const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', 'data');

module.exports = {
    PORT: process.env.SERVER_PORT || 8602,
    SESSION_SECRET: process.env.SESSION_SECRET || 'nyxide-dev-secret-change-me',
    // How long a login's elevated admin access stays valid before it needs a fresh login to
    // renew - this is the "admin token" requirement: proof of a *recent* authentication as
    // an admin/owner, tracked server-side in the session, not a value the user types in.
    ADMIN_SESSION_TTL_MS: Number(process.env.ADMIN_SESSION_TTL_MS) || (2 * 60 * 60 * 1000),
    // Comma-separated usernames to auto-promote to the admin role on server startup, so
    // there's a way to bootstrap the first admin account without direct DB access.
    ADMIN_USERNAMES: (process.env.ADMIN_USERNAMES || '').split(',').map(s => s.trim()).filter(Boolean),
    // This username always gets the "owner" role (same permissions as admin, distinct
    // label) on every startup, no env setup required.
    OWNER_USERNAME: process.env.OWNER_USERNAME || 'nyx',
    DATA_DIR,
    DB_PATH: path.join(DATA_DIR, 'nyxide.db'),
    PROJECTS_DIR: path.join(DATA_DIR, 'projects'),
    THUMBNAILS_DIR: path.join(DATA_DIR, 'thumbnails'),
    AVATARS_DIR: path.join(DATA_DIR, 'avatars'),
    BANNERS_DIR: path.join(DATA_DIR, 'banners'),
    MAX_PROJECT_FILE_BYTES: 25 * 1024 * 1024,
    MAX_IMAGE_BYTES: 5 * 1024 * 1024,
    MAX_BANNER_BYTES: 2 * 1024 * 1024,
    // Homepage "Featured" auto-qualification: combined likes+favorites needed, and how long
    // an auto-featured (not manually admin-featured) project stays before it's dropped.
    HOMEPAGE_FEATURE_THRESHOLD: Number(process.env.HOMEPAGE_FEATURE_THRESHOLD) || 100,
    HOMEPAGE_FEATURE_DURATION_MS: Number(process.env.HOMEPAGE_FEATURE_DURATION_MS) || (5 * 24 * 60 * 60 * 1000),
    IS_PRODUCTION: process.env.NODE_ENV === 'production'
};
