const db = require('../db');

const DEFAULTS = {
    id: 1,
    enabled: 0,
    color: '#4cff8e',
    content: '',
    button_text: null,
    button_url: null
};

const statements = {
    get: db.prepare('SELECT * FROM site_banner WHERE id = 1'),
    upsert: db.prepare(`
        INSERT INTO site_banner (id, enabled, color, content, button_text, button_url, updated_at)
        VALUES (1, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
            enabled = excluded.enabled,
            color = excluded.color,
            content = excluded.content,
            button_text = excluded.button_text,
            button_url = excluded.button_url,
            updated_at = excluded.updated_at
    `)
};

const get = () => statements.get.get() || DEFAULTS;

const update = ({enabled, color, content, buttonText, buttonUrl}) => {
    statements.upsert.run(enabled ? 1 : 0, color, content, buttonText, buttonUrl);
    return get();
};

module.exports = {
    get,
    update
};
