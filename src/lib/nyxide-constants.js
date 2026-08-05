const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_BANNER_BYTES = 2 * 1024 * 1024;
// Kept in sync with server/src/config.js's MAX_AVATAR_BYTES default.
const MAX_AVATAR_BYTES = 1 * 1024 * 1024;
// Kept in sync with server/src/config.js's USERNAME_CHANGE_COOLDOWN_MS default.
const USERNAME_CHANGE_COOLDOWN_MS = 12 * 24 * 60 * 60 * 1000;
// No trailing slash - paths already start with "/api/...".
const API_BASE_URL = 'https://nyxideapi.nyxdev.app';

const resolveApiUrl = url => (url && url.startsWith('/') ? `${API_BASE_URL}${url}` : url);

export {
    MAX_UPLOAD_BYTES,
    MAX_BANNER_BYTES,
    MAX_AVATAR_BYTES,
    USERNAME_CHANGE_COOLDOWN_MS,
    API_BASE_URL,
    resolveApiUrl
};
