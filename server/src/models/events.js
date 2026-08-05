const db = require('../db');

const statements = {
    insert: db.prepare(`
        INSERT INTO events (title, content, created_by) VALUES (?, ?, ?)
    `),
    getById: db.prepare('SELECT * FROM events WHERE id = ?'),
    delete: db.prepare('DELETE FROM events WHERE id = ?'),
    listRecent: db.prepare('SELECT * FROM events ORDER BY created_at DESC LIMIT ?')
};

const create = ({title, content, createdBy}) => {
    const info = statements.insert.run(title, content, createdBy);
    return statements.getById.get(info.lastInsertRowid);
};

const getById = id => statements.getById.get(id);

const remove = id => statements.delete.run(id);

const listRecent = (limit = 10) => statements.listRecent.all(limit);

module.exports = {
    create,
    getById,
    remove,
    listRecent
};
