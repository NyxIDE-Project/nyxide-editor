// Uses Node's built-in SQLite bindings instead of a native npm package (e.g. better-sqlite3)
// so this server has no compiled/prebuilt-binary dependency to break across Node versions.
const {DatabaseSync} = require('node:sqlite');
const {DB_PATH} = require('./config');

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL DEFAULT '',
        bio TEXT NOT NULL DEFAULT '',
        avatar_path TEXT,
        banner_path TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        banned_until INTEGER,
        ban_reason TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS follows (
        follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        followee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (follower_id, followee_id)
    );

    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL DEFAULT 'Untitled',
        description TEXT NOT NULL DEFAULT '',
        notes_and_credits TEXT NOT NULL DEFAULT '',
        file_path TEXT NOT NULL,
        thumbnail_path TEXT,
        file_size INTEGER NOT NULL DEFAULT 0,
        view_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS featured_projects (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        position INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, project_id)
    );

    CREATE TABLE IF NOT EXISTS project_likes (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (user_id, project_id)
    );

    CREATE TABLE IF NOT EXISTS project_favorites (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (user_id, project_id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expires INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_type TEXT NOT NULL,
        target_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL DEFAULT '',
        read_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS homepage_featured (
        project_id INTEGER PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
        source TEXT NOT NULL DEFAULT 'auto',
        featured_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
    CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows(followee_id);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);
`);

// Migrations for databases created before a column existed (CREATE TABLE IF NOT EXISTS
// above only helps brand-new databases).
const addColumnIfMissing = (table, column, definition) => {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!columns.some(col => col.name === column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
};

addColumnIfMissing('projects', 'view_count', "INTEGER NOT NULL DEFAULT 0");
addColumnIfMissing('users', 'role', "TEXT NOT NULL DEFAULT 'user'");
addColumnIfMissing('users', 'banned_until', 'INTEGER');
addColumnIfMissing('users', 'ban_reason', 'TEXT');
addColumnIfMissing('users', 'banner_path', 'TEXT');

module.exports = db;
