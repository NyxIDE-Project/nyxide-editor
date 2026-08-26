const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const usersModel = require('../models/users');
const projectsModel = require('../models/projects');
const emailTokensModel = require('../models/email-tokens');
const {ADMIN_ROLES, requireAuth} = require('../middleware/auth');
const {serializeMe} = require('../lib/serialize');
const {verifyTurnstileToken} = require('../lib/turnstile');
const {sendAccountEmail} = require('../lib/account-emails');
const {removeFile} = require('../middleware/upload');
const sessionStore = require('../session-store');
const {
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, FRONTEND_URL
} = require('../config');

const router = express.Router();

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
// Deliberately simple/permissive - just enough to reject obviously-malformed input.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_COST = 12;

// Best-effort: a broken mail provider shouldn't break the underlying account action.
const sendAccountEmailSafely = (user, type) => sendAccountEmail(user, type).catch(() => {});

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

// Deliberately ugly and impossible to remember - the goal is to nudge people into actually
// picking a real username from Settings rather than keeping it, not to be a nice default.
const randomGoogleUsername = () => `googleuser-${crypto.randomInt(10000000, 99999999)}`;

const uniqueGoogleUsername = () => {
    let username = randomGoogleUsername();
    while (usersModel.getByUsername(username)) {
        username = randomGoogleUsername();
    }
    return username;
};

const buildGoogleAuthUrl = state => {
    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        prompt: 'select_account'
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

const fetchGoogleProfile = async code => {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams({
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code'
        })
    });
    if (!tokenRes.ok) {
        return {error: 'google_token_failed'};
    }
    const {access_token: accessToken} = await tokenRes.json();

    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
        headers: {Authorization: `Bearer ${accessToken}`}
    });
    if (!profileRes.ok) {
        return {error: 'google_profile_failed'};
    }
    return {profile: await profileRes.json()};
};

// Logging in with Google never links to or creates an account by email match alone - if the
// email is already registered to an account with no google_id, that account might not belong
// to whoever is sitting behind this Google session, so we refuse rather than log them in.
// Linking is only ever done from the authenticated /google/link flow below, which requires
// already being logged into the target account first.
const findOrCreateGoogleLoginUser = async profile => {
    const byGoogleId = usersModel.getByGoogleId(profile.sub);
    if (byGoogleId) {
        return byGoogleId;
    }
    if (profile.email && usersModel.getByEmail(profile.email)) {
        return null;
    }
    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), BCRYPT_COST);
    const username = uniqueGoogleUsername();
    return usersModel.create({
        username,
        email: profile.email || null,
        passwordHash,
        displayName: username,
        googleId: profile.sub
    });
};

const logInAs = (req, res, next, user, redirectUrl) => {
    req.session.regenerate(err => {
        if (err) return next(err);
        req.session.userId = user.id;
        if (ADMIN_ROLES.includes(user.role)) {
            req.session.adminAuthenticatedAt = Date.now();
        }
        res.redirect(redirectUrl);
    });
};

router.post('/register', async (req, res, next) => {
    try {
        const {username, email, password, turnstileToken} = req.body;
        if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
            return res.status(400).json({error: 'Username must be 3-20 letters, numbers, or underscores'});
        }
        if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
            return res.status(400).json({error: 'A valid email address is required'});
        }
        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({error: 'Password must be at least 8 characters'});
        }
        const verified = await verifyTurnstileToken(turnstileToken, req.ip);
        if (!verified) {
            return res.status(400).json({error: 'Please complete the verification challenge'});
        }
        if (usersModel.getByUsername(username)) {
            return res.status(409).json({error: 'Username is already taken'});
        }
        if (usersModel.getByEmail(email)) {
            return res.status(409).json({error: 'An account with this email already exists'});
        }
        const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
        const user = usersModel.create({username, email, passwordHash, displayName: username});
        sendAccountEmailSafely(user, 'verify_email');
        req.session.regenerate(err => {
            if (err) return next(err);
            req.session.userId = user.id;
            if (ADMIN_ROLES.includes(user.role)) {
                req.session.adminAuthenticatedAt = Date.now();
            }
            res.status(201).json({user: serializeMe(user)});
        });
    } catch (err) {
        next(err);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const {identifier, password, turnstileToken} = req.body;
        const verified = await verifyTurnstileToken(turnstileToken, req.ip);
        if (!verified) {
            return res.status(400).json({error: 'Please complete the verification challenge'});
        }
        const user = typeof identifier === 'string' ? usersModel.getByUsernameOrEmail(identifier) : null;
        const valid = user && typeof password === 'string' && await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({error: 'Invalid username/email or password'});
        }
        req.session.regenerate(err => {
            if (err) return next(err);
            req.session.userId = user.id;
            if (ADMIN_ROLES.includes(user.role)) {
                req.session.adminAuthenticatedAt = Date.now();
            }
            res.json({user: serializeMe(user)});
        });
    } catch (err) {
        next(err);
    }
});

router.get('/google', (req, res) => {
    if (!GOOGLE_CLIENT_ID) {
        return res.status(503).send('Google login is not configured on this server.');
    }
    const state = crypto.randomBytes(16).toString('hex');
    req.session.googleOAuth = {state, intent: 'login'};
    res.redirect(buildGoogleAuthUrl(state));
});

// Deliberately requireAuth: linking must be initiated by someone already logged into the
// target account via username/password (or a prior Google session) - that's what makes it
// safe for the callback to attach this Google identity to req.user's account below.
router.get('/google/link', requireAuth, (req, res) => {
    if (!GOOGLE_CLIENT_ID) {
        return res.status(503).send('Google login is not configured on this server.');
    }
    const state = crypto.randomBytes(16).toString('hex');
    req.session.googleOAuth = {state, intent: 'link', userId: req.user.id};
    res.redirect(buildGoogleAuthUrl(state));
});

router.get('/google/callback', async (req, res, next) => {
    try {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            return res.redirect(`${FRONTEND_URL}/login?error=google_not_configured`);
        }
        const {code, state} = req.query;
        const pending = req.session.googleOAuth;
        delete req.session.googleOAuth;
        const isLink = Boolean(pending) && pending.intent === 'link';
        const failureUrl = isLink ? `${FRONTEND_URL}/settings` : `${FRONTEND_URL}/login`;

        if (!pending || !state || state !== pending.state) {
            return res.redirect(`${failureUrl}?error=google_state_mismatch`);
        }
        if (!code) {
            return res.redirect(`${failureUrl}?error=google_denied`);
        }

        const {profile, error} = await fetchGoogleProfile(code);
        if (error) {
            return res.redirect(`${failureUrl}?error=${error}`);
        }

        if (isLink) {
            // req.user reflects the *current* session, which must still be the same account
            // that started the link flow - guards against the session changing mid-flow.
            if (!req.user || req.user.id !== pending.userId) {
                return res.redirect(`${FRONTEND_URL}/settings?error=google_link_session`);
            }
            const takenBy = usersModel.getByGoogleId(profile.sub);
            if (takenBy && takenBy.id !== req.user.id) {
                return res.redirect(`${FRONTEND_URL}/settings?error=google_already_linked`);
            }
            usersModel.setGoogleId(req.user.id, profile.sub);
            return res.redirect(`${FRONTEND_URL}/settings?linked=google`);
        }

        const user = await findOrCreateGoogleLoginUser(profile);
        if (!user) {
            return res.redirect(`${FRONTEND_URL}/login?error=google_email_registered`);
        }
        logInAs(req, res, next, user, FRONTEND_URL);
    } catch (err) {
        next(err);
    }
});

// Covers the two email actions a logged-in user can trigger themselves - resending their
// verification email, or starting the account-deletion confirmation flow.
router.post('/send-email-action', requireAuth, async (req, res) => {
    const {type} = req.body;
    if (!['verify_email', 'delete_account'].includes(type)) {
        return res.status(400).json({error: 'Invalid email action'});
    }
    if (type === 'verify_email' && req.user.email_verified) {
        return res.status(400).json({error: 'Your email is already verified'});
    }
    if (!req.user.email) {
        return res.status(400).json({error: 'Add an email address in Settings first'});
    }
    try {
        await sendAccountEmail(req.user, type);
        res.status(204).end();
    } catch (err) {
        if (err instanceof emailTokensModel.EmailCooldownError) {
            return res.status(429).json({error: err.message, remainingMs: err.remainingMs});
        }
        res.status(502).json({error: `Could not send that email: ${err.message}`});
    }
});

router.post('/forgot-password', async (req, res) => {
    const {email, turnstileToken} = req.body;
    const verified = await verifyTurnstileToken(turnstileToken, req.ip);
    if (!verified) {
        return res.status(400).json({error: 'Please complete the verification challenge'});
    }
    if (typeof email === 'string') {
        const user = usersModel.getByEmail(email);
        // Same response whether or not the email matched, so this can't be used to test
        // which addresses have an account.
        if (user) {
            await sendAccountEmailSafely(user, 'reset_password');
        }
    }
    res.json({message: 'If that email is registered, a reset link has been sent.'});
});

router.post('/verify-email', (req, res) => {
    const row = emailTokensModel.consume(req.body.token, 'verify_email');
    if (!row) {
        return res.status(400).json({error: 'This verification link is invalid or has expired.'});
    }
    usersModel.setEmailVerified(row.user_id, true);
    res.status(204).end();
});

router.post('/reset-password', async (req, res) => {
    const {token, password} = req.body;
    if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({error: 'Password must be at least 8 characters'});
    }
    const row = emailTokensModel.consume(token, 'reset_password');
    if (!row) {
        return res.status(400).json({error: 'This reset link is invalid or has expired.'});
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    usersModel.updatePassword(row.user_id, passwordHash);
    sessionStore.destroyAllForUser(row.user_id);
    res.status(204).end();
});

router.post('/confirm-account-deletion', async (req, res) => {
    const {token, password} = req.body;
    const row = emailTokensModel.consume(token, 'delete_account');
    if (!row) {
        return res.status(400).json({error: 'This link is invalid or has expired.'});
    }
    const user = usersModel.getById(row.user_id);
    const valid = user && typeof password === 'string' && await bcrypt.compare(password, user.password_hash);
    if (!valid) {
        return res.status(401).json({error: 'Incorrect password'});
    }
    const {items: projects} = projectsModel.listByOwner(user.id, 1, 100000);
    projects.forEach(project => {
        removeFile(project.file_path);
        removeFile(project.thumbnail_path);
    });
    removeFile(user.avatar_path);
    removeFile(user.banner_path);
    usersModel.deleteUser(user.id);
    sessionStore.destroyAllForUser(user.id);
    if (req.session.userId === user.id) {
        req.session.destroy(() => {});
    }
    res.status(204).end();
});

router.post('/logout', (req, res, next) => {
    req.session.destroy(err => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        res.status(204).end();
    });
});

router.get('/me', (req, res) => {
    res.json({user: req.user ? serializeMe(req.user) : null});
});

module.exports = router;
