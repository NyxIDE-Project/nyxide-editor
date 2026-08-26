const crypto = require('crypto');
const db = require('../db');
const {EMAIL_COOLDOWN_MS} = require('../config');

// verify_email links are fine to sit unread in an inbox for a while; reset/delete links grant
// real account control, so they expire fast.
const TOKEN_TTL_MS = {
    verify_email: 24 * 60 * 60 * 1000,
    reset_password: 60 * 60 * 1000,
    delete_account: 60 * 60 * 1000
};

const statements = {
    insert: db.prepare(`
        INSERT INTO email_tokens (user_id, type, token_hash, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?)
    `),
    latestForUser: db.prepare(`
        SELECT created_at FROM email_tokens WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
    `),
    getByHash: db.prepare('SELECT * FROM email_tokens WHERE token_hash = ?'),
    markUsed: db.prepare('UPDATE email_tokens SET used_at = ? WHERE id = ?')
};

// Thrown by create() when the account is still within its cooldown window - callers turn
// this into an HTTP 429, except forgot-password, which must swallow it (see routes/auth.js)
// so it doesn't leak "this email exists but is on cooldown" to an anonymous requester.
class EmailCooldownError extends Error {
    constructor (remainingMs) {
        super('Please wait before requesting another email.');
        this.remainingMs = remainingMs;
    }
}

const hashToken = token => crypto.createHash('sha256')
    .update(token)
    .digest('hex');

// One shared cooldown clock per user across every token type - a resend-verification request
// blocks a forgot-password request for the same account and vice versa, by design.
const create = (userId, type) => {
    const latest = statements.latestForUser.get(userId);
    if (latest) {
        const elapsed = Date.now() - latest.created_at;
        if (elapsed < EMAIL_COOLDOWN_MS) {
            throw new EmailCooldownError(EMAIL_COOLDOWN_MS - elapsed);
        }
    }
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    statements.insert.run(userId, type, hashToken(token), now + TOKEN_TTL_MS[type], now);
    return token;
};

// Single-use: a token that's expired, already used, or of the wrong type for this action is
// treated exactly like a token that never existed.
const consume = (token, type) => {
    if (typeof token !== 'string' || !token) {
        return null;
    }
    const row = statements.getByHash.get(hashToken(token));
    if (!row || row.type !== type || row.used_at || row.expires_at < Date.now()) {
        return null;
    }
    statements.markUsed.run(Date.now(), row.id);
    return row;
};

module.exports = {create, consume, EmailCooldownError};
