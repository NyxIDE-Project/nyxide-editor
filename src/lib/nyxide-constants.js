const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_BANNER_BYTES = 2 * 1024 * 1024;
// Kept in sync with server/src/config.js's USERNAME_CHANGE_COOLDOWN_MS default.
const USERNAME_CHANGE_COOLDOWN_MS = 12 * 24 * 60 * 60 * 1000;
// No trailing slash - paths already start with "/api/...".
const API_BASE_URL = 'https://nyxideapi.nyxdev.app';

export {
    MAX_UPLOAD_BYTES,
    MAX_BANNER_BYTES,
    USERNAME_CHANGE_COOLDOWN_MS,
    API_BASE_URL
};
