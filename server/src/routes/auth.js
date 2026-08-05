const express = require('express');
const bcrypt = require('bcryptjs');
const usersModel = require('../models/users');
const {ADMIN_ROLES} = require('../middleware/auth');
const {serializeMe} = require('../lib/serialize');
const {verifyTurnstileToken} = require('../lib/turnstile');

const router = express.Router();

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
// Deliberately simple/permissive - just enough to reject obviously-malformed input, since
// real deliverability is out of scope (no verification email is sent).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_COST = 12;

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
