const db = require('./db');
const SqliteSessionStore = require('./lib/sqlite-session-store');

module.exports = new SqliteSessionStore(db);
