const {Store} = require('express-session');

const DEFAULT_MAX_AGE = 24 * 60 * 60 * 1000;

// Minimal express-session Store backed by our own node:sqlite database, since
// better-sqlite3-session-store expects a better-sqlite3 Database instance and we don't have one.
class SqliteSessionStore extends Store {
    constructor (db) {
        super();
        this.db = db;
        this.getStmt = db.prepare('SELECT sess, expires FROM sessions WHERE sid = ?');
        this.upsertStmt = db.prepare(`
            INSERT INTO sessions (sid, sess, expires) VALUES (?, ?, ?)
            ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expires = excluded.expires
        `);
        this.deleteStmt = db.prepare('DELETE FROM sessions WHERE sid = ?');
        this.deleteExpiredStmt = db.prepare('DELETE FROM sessions WHERE expires < ?');
    }
    get (sid, callback) {
        try {
            const row = this.getStmt.get(sid);
            if (!row || row.expires < Date.now()) {
                return callback(null, null);
            }
            callback(null, JSON.parse(row.sess));
        } catch (err) {
            callback(err);
        }
    }
    set (sid, sessionData, callback) {
        try {
            const maxAge = (sessionData.cookie && sessionData.cookie.maxAge) || DEFAULT_MAX_AGE;
            const expires = Date.now() + maxAge;
            this.upsertStmt.run(sid, JSON.stringify(sessionData), expires);
            callback(null);
        } catch (err) {
            callback(err);
        }
    }
    destroy (sid, callback) {
        try {
            this.deleteStmt.run(sid);
            callback(null);
        } catch (err) {
            callback(err);
        }
    }
    touch (sid, sessionData, callback) {
        this.set(sid, sessionData, callback);
    }
    pruneExpired () {
        this.deleteExpiredStmt.run(Date.now());
    }
    // Full scan is fine here - this only runs on password reset, and the sessions table is
    // small (pruned every 15 minutes) and has no user_id column to index on directly.
    destroyAllForUser (userId) {
        const rows = this.db.prepare('SELECT sid, sess FROM sessions').all();
        rows.forEach(row => {
            try {
                if (JSON.parse(row.sess).userId === userId) {
                    this.deleteStmt.run(row.sid);
                }
            } catch (err) {
                // Corrupt row - leave it for pruneExpired to clean up eventually.
            }
        });
    }
}

module.exports = SqliteSessionStore;
