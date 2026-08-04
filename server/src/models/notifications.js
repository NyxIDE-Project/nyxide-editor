const db = require('../db');
const usersModel = require('./users');

const statements = {
    insert: db.prepare(`
        INSERT INTO notifications (user_id, type, title, body) VALUES (?, ?, ?, ?)
    `),
    getById: db.prepare('SELECT * FROM notifications WHERE id = ?'),
    listByUser: db.prepare(`
        SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
    `),
    countByUser: db.prepare('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ?'),
    unreadCount: db.prepare(`
        SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_at IS NULL
    `),
    markRead: db.prepare(`
        UPDATE notifications SET read_at = datetime('now') WHERE id = ? AND user_id = ?
    `),
    markAllRead: db.prepare(`
        UPDATE notifications SET read_at = datetime('now') WHERE user_id = ? AND read_at IS NULL
    `),
    deleteOne: db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?'),
    deleteAllForUser: db.prepare('DELETE FROM notifications WHERE user_id = ?')
};

const create = ({userId, type, title, body}) => {
    const info = statements.insert.run(userId, type, title, body || '');
    return statements.getById.get(info.lastInsertRowid);
};

const createForAllUsers = ({type, title, body}) => {
    const ids = usersModel.listAllIds();
    db.exec('BEGIN');
    try {
        ids.forEach(userId => statements.insert.run(userId, type, title, body || ''));
        db.exec('COMMIT');
    } catch (err) {
        db.exec('ROLLBACK');
        throw err;
    }
    return ids.length;
};

const listByUser = (userId, page, pageSize) => ({
    items: statements.listByUser.all(userId, pageSize, (page - 1) * pageSize),
    total: statements.countByUser.get(userId).count
});

const unreadCount = userId => statements.unreadCount.get(userId).count;

const markRead = (id, userId) => statements.markRead.run(id, userId);

const markAllRead = userId => statements.markAllRead.run(userId);

const deleteOne = (id, userId) => statements.deleteOne.run(id, userId);

const deleteAllForUser = userId => statements.deleteAllForUser.run(userId);

module.exports = {
    create,
    createForAllUsers,
    listByUser,
    unreadCount,
    markRead,
    markAllRead,
    deleteOne,
    deleteAllForUser
};
