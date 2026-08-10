const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const usersModel = require('../models/users');
const {ADMIN_ROLES} = require('../middleware/auth');
const {serializeMe} = require('../lib/serialize');
const {verifyTurnstileToken} = require('../lib/turnstile');
const {
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, FRONTEND_URL
} = require('../config');

const router = express.Router();

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
// Deliberately simple/permissive - just enough to reject obviously-malformed input, since
// real deliverability is out of scope (no verification email is sent).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_COST = 12;

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

const findOrCreateGoogleUser = async profile => {
    const byGoogleId = usersModel.getByGoogleId(profile.sub);
    if (byGoogleId) {
        return byGoogleId;
    }
    if (profile.email) {
        // Someone who already registered with a password, now signing in with Google using
        // the same email - link the accounts instead of creating a duplicate.
        const byEmail = usersModel.getByEmail(profile.email);
        if (byEmail) {
            return usersModel.linkGoogleId(byEmail.id, profile.sub);
        }
    }
    // No password is ever set for a Google-only account, but password_hash is a required
    // column - fill it with a hash of a secret nobody has, rather than relaxing the column
    // constraint just for this one case.
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
    req.session.googleOAuthState = state;
    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        prompt: 'select_account'
    });
    res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
});

router.get('/google/callback', async (req, res, next) => {
    try {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            return res.redirect(`${FRONTEND_URL}/login?error=google_not_configured`);
        }
        const {code, state} = req.query;
        const expectedState = req.session.googleOAuthState;
        delete req.session.googleOAuthState;
        if (!state || state !== expectedState) {
            return res.redirect(`${FRONTEND_URL}/login?error=google_state_mismatch`);
        }
        if (!code) {
            return res.redirect(`${FRONTEND_URL}/login?error=google_denied`);
        }

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
            return res.redirect(`${FRONTEND_URL}/login?error=google_token_failed`);
        }
        const {access_token: accessToken} = await tokenRes.json();

        const profileRes = await fetch(GOOGLE_USERINFO_URL, {
            headers: {Authorization: `Bearer ${accessToken}`}
        });
        if (!profileRes.ok) {
            return res.redirect(`${FRONTEND_URL}/login?error=google_profile_failed`);
        }
        const profile = await profileRes.json();
        const user = await findOrCreateGoogleUser(profile);

        req.session.regenerate(err => {
            if (err) return next(err);
            req.session.userId = user.id;
            if (ADMIN_ROLES.includes(user.role)) {
                req.session.adminAuthenticatedAt = Date.now();
            }
            res.redirect(FRONTEND_URL);
        });
    } catch (err) {
        next(err);
    }
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
