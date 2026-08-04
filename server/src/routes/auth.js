const express = require('express');
const bcrypt = require('bcryptjs');
const usersModel = require('../models/users');
const {ADMIN_ROLES} = require('../middleware/auth');
const {serializeMe} = require('../lib/serialize');

const router = express.Router();

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const BCRYPT_COST = 12;

router.post('/register', async (req, res, next) => {
    try {
        const {username, password} = req.body;
        if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
            return res.status(400).json({error: 'Username must be 3-20 letters, numbers, or underscores'});
        }
        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({error: 'Password must be at least 8 characters'});
        }
        if (usersModel.getByUsername(username)) {
            return res.status(409).json({error: 'Username is already taken'});
        }
        const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
        const user = usersModel.create({username, passwordHash, displayName: username});
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
        const {username, password} = req.body;
        const user = typeof username === 'string' ? usersModel.getByUsername(username) : null;
        const valid = user && typeof password === 'string' && await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({error: 'Invalid username or password'});
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
