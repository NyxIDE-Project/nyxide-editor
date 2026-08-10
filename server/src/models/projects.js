const db = require('../db');
const {HOMEPAGE_FEATURE_THRESHOLD, HOMEPAGE_FEATURE_DURATION_MS} = require('../config');

const statements = {
    insert: db.prepare(`
        INSERT INTO projects (owner_id, title, description, notes_and_credits, file_path, thumbnail_path, file_size)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `),
    getById: db.prepare('SELECT * FROM projects WHERE id = ?'),
    updateMeta: db.prepare(`
        UPDATE projects
        SET title = ?, description = ?, notes_and_credits = ?,
            updated_at = datetime('now')
        WHERE id = ?
    `),
    updateFile: db.prepare(`
        UPDATE projects
        SET file_path = ?, thumbnail_path = ?, file_size = ?,
            updated_at = datetime('now')
        WHERE id = ?
    `),
    updateThumbnail: db.prepare(`
        UPDATE projects SET thumbnail_path = ?, updated_at = datetime('now') WHERE id = ?
    `),
    delete: db.prepare('DELETE FROM projects WHERE id = ?'),
    listByOwner: db.prepare(`
        SELECT * FROM projects WHERE owner_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?
    `),
    countByOwner: db.prepare('SELECT COUNT(*) AS count FROM projects WHERE owner_id = ?'),
    listAll: db.prepare(`
        SELECT * FROM projects ORDER BY created_at DESC LIMIT ? OFFSET ?
    `),
    countAll: db.prepare('SELECT COUNT(*) AS count FROM projects'),
    search: db.prepare(`
        SELECT * FROM projects
        WHERE title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\'
        ORDER BY created_at DESC LIMIT ? OFFSET ?
    `),
    searchCount: db.prepare(`
        SELECT COUNT(*) AS count FROM projects
        WHERE title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\'
    `),
    listFeatured: db.prepare(`
        SELECT p.* FROM projects p
        JOIN featured_projects f ON f.project_id = p.id
        WHERE f.user_id = ?
        ORDER BY f.position ASC
    `),
    clearFeatured: db.prepare('DELETE FROM featured_projects WHERE user_id = ?'),
    addFeatured: db.prepare(`
        INSERT INTO featured_projects (user_id, project_id, position) VALUES (?, ?, ?)
    `),
    recent: db.prepare('SELECT * FROM projects ORDER BY created_at DESC LIMIT ?'),
    incrementViews: db.prepare('UPDATE projects SET view_count = view_count + 1 WHERE id = ?'),
    likeCount: db.prepare('SELECT COUNT(*) AS count FROM project_likes WHERE project_id = ?'),
    favoriteCount: db.prepare('SELECT COUNT(*) AS count FROM project_favorites WHERE project_id = ?'),
    isLiked: db.prepare('SELECT 1 FROM project_likes WHERE user_id = ? AND project_id = ?'),
    isFavorited: db.prepare('SELECT 1 FROM project_favorites WHERE user_id = ? AND project_id = ?'),
    like: db.prepare('INSERT OR IGNORE INTO project_likes (user_id, project_id) VALUES (?, ?)'),
    unlike: db.prepare('DELETE FROM project_likes WHERE user_id = ? AND project_id = ?'),
    favorite: db.prepare('INSERT OR IGNORE INTO project_favorites (user_id, project_id) VALUES (?, ?)'),
    unfavorite: db.prepare('DELETE FROM project_favorites WHERE user_id = ? AND project_id = ?'),
    homepageFeaturedExists: db.prepare('SELECT 1 FROM homepage_featured WHERE project_id = ?'),
    insertHomepageFeatured: db.prepare(`
        INSERT OR REPLACE INTO homepage_featured (project_id, source, featured_at) VALUES (?, ?, ?)
    `),
    deleteHomepageFeatured: db.prepare('DELETE FROM homepage_featured WHERE project_id = ?'),
    deleteExpiredAutoFeatured: db.prepare(`
        DELETE FROM homepage_featured WHERE source = 'auto' AND featured_at < ?
    `),
    listHomepageFeatured: db.prepare(`
        SELECT p.*, hf.source AS featured_source, hf.featured_at AS featured_at
        FROM projects p
        JOIN homepage_featured hf ON hf.project_id = p.id
        ORDER BY hf.featured_at DESC
        LIMIT ?
    `),
    listNearFeatured: db.prepare(`
        SELECT * FROM (
            SELECT p.*,
                (SELECT COUNT(*) FROM project_likes WHERE project_id = p.id) AS like_count,
                (SELECT COUNT(*) FROM project_favorites WHERE project_id = p.id) AS favorite_count
            FROM projects p
            WHERE p.id NOT IN (SELECT project_id FROM homepage_featured)
        ) sub
        WHERE (like_count + favorite_count) >= ? AND (like_count + favorite_count) < ?
        ORDER BY (like_count + favorite_count) DESC
        LIMIT ?
    `),
    getTags: db.prepare('SELECT tag FROM project_tags WHERE project_id = ? ORDER BY tag ASC'),
    clearTags: db.prepare('DELETE FROM project_tags WHERE project_id = ?'),
    addTag: db.prepare('INSERT OR IGNORE INTO project_tags (project_id, tag) VALUES (?, ?)'),
    popularTags: db.prepare(`
        SELECT tag, COUNT(*) AS count FROM project_tags
        GROUP BY tag ORDER BY count DESC, tag ASC LIMIT ?
    `)
};

const escapeLike = str => str.replace(/[\\%_]/g, ch => `\\${ch}`);

const create = ({ownerId, title, description, notesAndCredits, filePath, thumbnailPath, fileSize}) => {
    const info = statements.insert.run(
        ownerId, title, description, notesAndCredits, filePath, thumbnailPath, fileSize
    );
    return statements.getById.get(info.lastInsertRowid);
};

const getById = id => statements.getById.get(id);

const updateMeta = (id, {title, description, notesAndCredits}) => {
    statements.updateMeta.run(title, description, notesAndCredits, id);
    return statements.getById.get(id);
};

const updateFile = (id, {filePath, thumbnailPath, fileSize}) => {
    statements.updateFile.run(filePath, thumbnailPath, fileSize, id);
    return statements.getById.get(id);
};

const updateThumbnail = (id, thumbnailPath) => {
    statements.updateThumbnail.run(thumbnailPath, id);
    return statements.getById.get(id);
};

const remove = id => statements.delete.run(id);

const listByOwner = (ownerId, page, pageSize) => ({
    items: statements.listByOwner.all(ownerId, pageSize, (page - 1) * pageSize),
    total: statements.countByOwner.get(ownerId).count
});

const listAll = (page, pageSize) => ({
    items: statements.listAll.all(pageSize, (page - 1) * pageSize),
    total: statements.countAll.get().count
});

const search = (query, page, pageSize) => {
    const pattern = `%${escapeLike(query)}%`;
    const offset = (page - 1) * pageSize;
    return {
        items: statements.search.all(pattern, pattern, pageSize, offset),
        total: statements.searchCount.get(pattern, pattern).count
    };
};

// Powers both plain search and the #tag / :isfeatured search operators (see
// server/src/routes/projects.js GET /) - built dynamically since the set of joins/filters
// varies per request, unlike the fixed statements above.
const queryProjects = ({queryText, tags, isFeatured, page, pageSize}) => {
    if (isFeatured) {
        pruneExpiredHomepageFeatured();
    }
    const offset = (page - 1) * pageSize;
    const joins = [];
    const conditions = [];
    const params = [];

    tags.forEach((tag, i) => {
        joins.push(`JOIN project_tags pt${i} ON pt${i}.project_id = p.id AND pt${i}.tag = ?`);
        params.push(tag);
    });
    if (isFeatured) {
        joins.push('JOIN homepage_featured hf ON hf.project_id = p.id');
    }
    if (queryText) {
        const pattern = `%${escapeLike(queryText)}%`;
        conditions.push("(p.title LIKE ? ESCAPE '\\' OR p.description LIKE ? ESCAPE '\\')");
        params.push(pattern, pattern);
    }

    const joinSql = joins.length ? ` ${joins.join(' ')}` : '';
    const whereSql = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';

    const items = db.prepare(`
        SELECT p.* FROM projects p${joinSql}${whereSql}
        ORDER BY p.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);
    const total = db.prepare(`
        SELECT COUNT(*) AS count FROM projects p${joinSql}${whereSql}
    `).get(...params).count;

    return {items, total};
};

const getTags = projectId => statements.getTags.all(projectId).map(row => row.tag);

const setTags = (projectId, tags) => {
    db.exec('BEGIN');
    try {
        statements.clearTags.run(projectId);
        tags.forEach(tag => statements.addTag.run(projectId, tag));
        db.exec('COMMIT');
    } catch (err) {
        db.exec('ROLLBACK');
        throw err;
    }
};

const popularTags = (limit = 3) => statements.popularTags.all(limit);

const listFeatured = userId => statements.listFeatured.all(userId);

const setFeatured = (userId, projectIds) => {
    db.exec('BEGIN');
    try {
        statements.clearFeatured.run(userId);
        projectIds.forEach((projectId, index) => {
            statements.addFeatured.run(userId, projectId, index);
        });
        db.exec('COMMIT');
    } catch (err) {
        db.exec('ROLLBACK');
        throw err;
    }
};

const recent = (limit = 12) => statements.recent.all(limit);

const recordView = id => statements.incrementViews.run(id);

const getEngagement = (id, viewerId) => ({
    likeCount: statements.likeCount.get(id).count,
    favoriteCount: statements.favoriteCount.get(id).count,
    isLikedByViewer: viewerId ? Boolean(statements.isLiked.get(viewerId, id)) : false,
    isFavoritedByViewer: viewerId ? Boolean(statements.isFavorited.get(viewerId, id)) : false
});

const like = (userId, projectId) => statements.like.run(userId, projectId);
const unlike = (userId, projectId) => statements.unlike.run(userId, projectId);
const favorite = (userId, projectId) => statements.favorite.run(userId, projectId);
const unfavorite = (userId, projectId) => statements.unfavorite.run(userId, projectId);

// Homepage "Featured" - distinct from a user's own profile-featured picks. Projects get
// added automatically once they cross HOMEPAGE_FEATURE_THRESHOLD combined likes+favorites
// (source: 'auto', expires after HOMEPAGE_FEATURE_DURATION_MS) or manually by an admin
// (source: 'manual', no expiry - stays until an admin unfeatures it).
const pruneExpiredHomepageFeatured = () => {
    statements.deleteExpiredAutoFeatured.run(Date.now() - HOMEPAGE_FEATURE_DURATION_MS);
};

const isHomepageFeatured = projectId => Boolean(statements.homepageFeaturedExists.get(projectId));

const autoFeatureIfEligible = projectId => {
    if (isHomepageFeatured(projectId)) {
        return;
    }
    const engagement = getEngagement(projectId, null);
    if ((engagement.likeCount + engagement.favoriteCount) >= HOMEPAGE_FEATURE_THRESHOLD) {
        statements.insertHomepageFeatured.run(projectId, 'auto', Date.now());
    }
};

const manualFeature = projectId => {
    statements.insertHomepageFeatured.run(projectId, 'manual', Date.now());
};

const manualUnfeature = projectId => statements.deleteHomepageFeatured.run(projectId);

const listHomepageFeatured = (limit = 24) => {
    pruneExpiredHomepageFeatured();
    return statements.listHomepageFeatured.all(limit);
};

// Projects sitting at half the threshold or more, but not yet featured - close enough to
// spotlight as "almost there" without surfacing projects that barely have any engagement.
const NEAR_FEATURED_MIN_RATIO = 0.5;

const listNearFeatured = (limit = 8) => {
    const minEngagement = Math.ceil(HOMEPAGE_FEATURE_THRESHOLD * NEAR_FEATURED_MIN_RATIO);
    return statements.listNearFeatured.all(minEngagement, HOMEPAGE_FEATURE_THRESHOLD, limit);
};

module.exports = {
    create,
    getById,
    updateMeta,
    updateFile,
    updateThumbnail,
    remove,
    listByOwner,
    listAll,
    search,
    listFeatured,
    setFeatured,
    recent,
    recordView,
    getEngagement,
    like,
    unlike,
    favorite,
    unfavorite,
    isHomepageFeatured,
    autoFeatureIfEligible,
    manualFeature,
    manualUnfeature,
    listHomepageFeatured,
    listNearFeatured,
    queryProjects,
    getTags,
    setTags,
    popularTags
};
