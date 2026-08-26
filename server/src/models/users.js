const db = require('../db');

const statements = {
    insert: db.prepare(`
        INSERT INTO users (username, email, password_hash, display_name, google_id)
        VALUES (?, ?, ?, ?, ?)
    `),
    getById: db.prepare('SELECT * FROM users WHERE id = ?'),
    getByUsername: db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE'),
    getByEmail: db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE'),
    getByGoogleId: db.prepare('SELECT * FROM users WHERE google_id = ?'),
    setGoogleId: db.prepare('UPDATE users SET google_id = ? WHERE id = ?'),
    setEmailVerified: db.prepare('UPDATE users SET email_verified = ? WHERE id = ?'),
    updatePassword: db.prepare('UPDATE users SET password_hash = ? WHERE id = ?'),
    getByUsernameOrEmail: db.prepare(
        'SELECT * FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE'
    ),
    updateEmail: db.prepare('UPDATE users SET email = ?, email_verified = 0 WHERE id = ?'),
    updateUsername: db.prepare('UPDATE users SET username = ?, username_changed_at = ? WHERE id = ?'),
    updateProfile: db.prepare(`
        UPDATE users SET display_name = ?, bio = ? WHERE id = ?
    `),
    updateAvatar: db.prepare('UPDATE users SET avatar_path = ? WHERE id = ?'),
    updateBanner: db.prepare('UPDATE users SET banner_path = ? WHERE id = ?'),
    followerCount: db.prepare('SELECT COUNT(*) AS count FROM follows WHERE followee_id = ?'),
    followingCount: db.prepare('SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?'),
    projectCount: db.prepare('SELECT COUNT(*) AS count FROM projects WHERE owner_id = ?'),
    isFollowing: db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?'),
    follow: db.prepare('INSERT OR IGNORE INTO follows (follower_id, followee_id) VALUES (?, ?)'),
    unfollow: db.prepare('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?'),
    listFollowers: db.prepare(`
        SELECT u.* FROM users u
        JOIN follows f ON f.follower_id = u.id
        WHERE f.followee_id = ?
        ORDER BY f.created_at DESC
        LIMIT ? OFFSET ?
    `),
    listFollowing: db.prepare(`
        SELECT u.* FROM users u
        JOIN follows f ON f.followee_id = u.id
        WHERE f.follower_id = ?
        ORDER BY f.created_at DESC
        LIMIT ? OFFSET ?
    `),
    setRole: db.prepare('UPDATE users SET role = ? WHERE id = ?'),
    banUser: db.prepare('UPDATE users SET banned_until = ?, ban_reason = ? WHERE id = ?'),
    unbanUser: db.prepare("UPDATE users SET banned_until = NULL, ban_reason = NULL WHERE id = ?"),
    deleteUser: db.prepare('DELETE FROM users WHERE id = ?'),
    listAll: db.prepare(`
        SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?
    `),
    countAll: db.prepare('SELECT COUNT(*) AS count FROM users'),
    searchByUsername: db.prepare(`
        SELECT * FROM users WHERE username LIKE ? ESCAPE '\\'
        ORDER BY created_at DESC LIMIT ? OFFSET ?
    `),
    searchCount: db.prepare(`
        SELECT COUNT(*) AS count FROM users WHERE username LIKE ? ESCAPE '\\'
    `),
    listAllIds: db.prepare('SELECT id FROM users')
};

const create = ({username, email, passwordHash, displayName, googleId}) => {
    const info = statements.insert.run(username, email, passwordHash, displayName, googleId || null);
    return statements.getById.get(info.lastInsertRowid);
};

const getById = id => statements.getById.get(id);
const getByUsername = username => statements.getByUsername.get(username);
const getByEmail = email => statements.getByEmail.get(email);
const getByUsernameOrEmail = identifier => statements.getByUsernameOrEmail.get(identifier, identifier);
const getByGoogleId = googleId => statements.getByGoogleId.get(googleId);

const setGoogleId = (id, googleId) => {
    statements.setGoogleId.run(googleId, id);
    return statements.getById.get(id);
};

const setEmailVerified = (id, verified) => {
    statements.setEmailVerified.run(verified ? 1 : 0, id);
    return statements.getById.get(id);
};

const updatePassword = (id, passwordHash) => {
    statements.updatePassword.run(passwordHash, id);
    return statements.getById.get(id);
};

const updateEmail = (id, email) => {
    statements.updateEmail.run(email, id);
    return statements.getById.get(id);
};

const updateUsername = (id, username) => {
    statements.updateUsername.run(username, Date.now(), id);
    return statements.getById.get(id);
};

const updateProfile = (id, {displayName, bio}) => {
    statements.updateProfile.run(displayName, bio, id);
    return statements.getById.get(id);
};

const updateAvatar = (id, avatarPath) => {
    statements.updateAvatar.run(avatarPath, id);
    return statements.getById.get(id);
};

const updateBanner = (id, bannerPath) => {
    statements.updateBanner.run(bannerPath, id);
    return statements.getById.get(id);
};

const getCounts = userId => ({
    followers: statements.followerCount.get(userId).count,
    following: statements.followingCount.get(userId).count,
    projects: statements.projectCount.get(userId).count
});

const isFollowing = (followerId, followeeId) =>
    Boolean(statements.isFollowing.get(followerId, followeeId));

const follow = (followerId, followeeId) => statements.follow.run(followerId, followeeId);
const unfollow = (followerId, followeeId) => statements.unfollow.run(followerId, followeeId);

const listFollowers = (userId, page, pageSize) =>
    statements.listFollowers.all(userId, pageSize, (page - 1) * pageSize);

const listFollowing = (userId, page, pageSize) =>
    statements.listFollowing.all(userId, pageSize, (page - 1) * pageSize);

const setRole = (id, role) => {
    statements.setRole.run(role, id);
    return statements.getById.get(id);
};

const banUser = (id, bannedUntil, reason) => {
    statements.banUser.run(bannedUntil, reason, id);
    return statements.getById.get(id);
};

const unbanUser = id => {
    statements.unbanUser.run(id);
    return statements.getById.get(id);
};

const deleteUser = id => statements.deleteUser.run(id);

const isBanned = user => Boolean(user.banned_until) && user.banned_until > Date.now();

const escapeLike = str => str.replace(/[\\%_]/g, ch => `\\${ch}`);

const listAllUsers = (page, pageSize, search) => {
    if (search) {
        const pattern = `%${escapeLike(search)}%`;
        return {
            items: statements.searchByUsername.all(pattern, pageSize, (page - 1) * pageSize),
            total: statements.searchCount.get(pattern).count
        };
    }
    return {
        items: statements.listAll.all(pageSize, (page - 1) * pageSize),
        total: statements.countAll.get().count
    };
};

const listAllIds = () => statements.listAllIds.all().map(row => row.id);

module.exports = {
    create,
    getById,
    getByUsername,
    getByEmail,
    getByUsernameOrEmail,
    getByGoogleId,
    setGoogleId,
    setEmailVerified,
    updatePassword,
    updateEmail,
    updateUsername,
    updateProfile,
    updateAvatar,
    updateBanner,
    getCounts,
    isFollowing,
    follow,
    unfollow,
    listFollowers,
    listFollowing,
    setRole,
    banUser,
    unbanUser,
    deleteUser,
    isBanned,
    listAllUsers,
    listAllIds
};
