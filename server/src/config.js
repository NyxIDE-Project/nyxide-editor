const path = require('path');

// Loads server/.env (gitignored) into process.env, if present, so secrets like the Turnstile
// keys don't have to be exported by hand every time the server starts.
require('dotenv').config({path: path.resolve(__dirname, '..', '.env')});

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
    MAX_AVATAR_BYTES: 1 * 1024 * 1024,
    MAX_BANNER_BYTES: 2 * 1024 * 1024,
    // Homepage "Featured" auto-qualification: combined likes+favorites needed, and how long
    // an auto-featured (not manually admin-featured) project stays before it's dropped.
    HOMEPAGE_FEATURE_THRESHOLD: Number(process.env.HOMEPAGE_FEATURE_THRESHOLD) || 100,
    HOMEPAGE_FEATURE_DURATION_MS: Number(process.env.HOMEPAGE_FEATURE_DURATION_MS) || (5 * 24 * 60 * 60 * 1000),
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    CORS_ORIGINS: (process.env.CORS_ORIGINS || 'https://ide.nyxdev.app')
        .split(',').map(s => s.trim()).filter(Boolean),
    TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA',
    // Minimum time between username changes.
    USERNAME_CHANGE_COOLDOWN_MS: Number(process.env.USERNAME_CHANGE_COOLDOWN_MS) || (12 * 24 * 60 * 60 * 1000),
    // Repo shown in the homepage's "recent commits" box. A GitHub personal access token isn't
    // required for a public repo, but can be set to raise the (otherwise 60/hr, shared across
    // all visitors since this is fetched server-side) unauthenticated rate limit.
    GITHUB_REPO: process.env.GITHUB_REPO || 'NyxIDE-Project/nyxide-editor',
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || null,
    GITHUB_COMMITS_CACHE_MS: Number(process.env.GITHUB_COMMITS_CACHE_MS) || (5 * 60 * 1000),
    // Repo whose latest release provides the desktop app downloads.
    DESKTOP_REPO: process.env.DESKTOP_REPO || 'NyxIDE-Project/nyxide-desktop',
    GITHUB_RELEASE_CACHE_MS: Number(process.env.GITHUB_RELEASE_CACHE_MS) || (10 * 60 * 1000),
    // "Log in with Google" - unset by default, which just hides the button (see GET
    // /api/auth/google). Get these from a project at https://console.cloud.google.com/.
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || null,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || null,
    // Must exactly match an "Authorized redirect URI" configured for that Google client.
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'https://nyxideapi.nyxdev.app/api/auth/google/callback',
    // Where to send the browser back to once a Google login finishes - the frontend's own
    // origin, since it's hosted separately from this API.
    FRONTEND_URL: process.env.FRONTEND_URL || 'https://ide.nyxdev.app'
};
