const db = require('../db');

const statements = {
    insert: db.prepare(`
        INSERT INTO reports (reporter_id, target_type, target_id, reason)
        VALUES (?, ?, ?, ?)
    `),
    getById: db.prepare('SELECT * FROM reports WHERE id = ?'),
    setStatus: db.prepare('UPDATE reports SET status = ? WHERE id = ?'),
    listByStatus: db.prepare(`
        SELECT * FROM reports WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
    `),
    countByStatus: db.prepare('SELECT COUNT(*) AS count FROM reports WHERE status = ?'),
    listAll: db.prepare('SELECT * FROM reports ORDER BY created_at DESC LIMIT ? OFFSET ?'),
    countAll: db.prepare('SELECT COUNT(*) AS count FROM reports')
};

const create = ({reporterId, targetType, targetId, reason}) => {
    const info = statements.insert.run(reporterId, targetType, targetId, reason);
    return statements.getById.get(info.lastInsertRowid);
};

const getById = id => statements.getById.get(id);

const setStatus = (id, status) => {
    statements.setStatus.run(status, id);
    return statements.getById.get(id);
};

const list = (page, pageSize, status) => {
    if (status) {
        return {
            items: statements.listByStatus.all(status, pageSize, (page - 1) * pageSize),
            total: statements.countByStatus.get(status).count
        };
    }
    return {
        items: statements.listAll.all(pageSize, (page - 1) * pageSize),
        total: statements.countAll.get().count
    };
};

module.exports = {
    create,
    getById,
    setStatus,
    list
};
