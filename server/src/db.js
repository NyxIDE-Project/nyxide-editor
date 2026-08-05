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
        email TEXT COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL DEFAULT '',
        bio TEXT NOT NULL DEFAULT '',
        avatar_path TEXT,
        banner_path TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        banned_until INTEGER,
        ban_reason TEXT,
        username_changed_at INTEGER,
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

    CREATE TABLE IF NOT EXISTS project_tags (
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        tag TEXT NOT NULL,
        PRIMARY KEY (project_id, tag)
    );

    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
    CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows(followee_id);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);
    CREATE INDEX IF NOT EXISTS idx_project_tags_tag ON project_tags(tag);
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
addColumnIfMissing('users', 'email', 'TEXT COLLATE NOCASE');
addColumnIfMissing('users', 'username_changed_at', 'INTEGER');

// Created here (not in the main CREATE TABLE block above) because on an existing database
// the users.email column above is only added by the migration line just before this, and
// this index would fail with "no such column" if it ran any earlier than that.
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)');

module.exports = db;
