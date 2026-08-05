const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const {
    PROJECTS_DIR,
    THUMBNAILS_DIR,
    AVATARS_DIR,
    BANNERS_DIR,
    MAX_PROJECT_FILE_BYTES,
    MAX_IMAGE_BYTES,
    MAX_AVATAR_BYTES,
    MAX_BANNER_BYTES
} = require('../config');

const randomName = ext => `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

const storageFor = (dir, ext) => multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => cb(null, randomName(ext))
});

const projectUpload = multer({
    storage: storageFor(PROJECTS_DIR, '.sb3'),
    limits: {fileSize: MAX_PROJECT_FILE_BYTES}
});

const imageUpload = multer({
    storage: storageFor(THUMBNAILS_DIR, '.png'),
    limits: {fileSize: MAX_IMAGE_BYTES}
});

const avatarUpload = multer({
    storage: storageFor(AVATARS_DIR, '.png'),
    limits: {fileSize: MAX_AVATAR_BYTES}
});

const bannerUpload = multer({
    storage: storageFor(BANNERS_DIR, '.png'),
    limits: {fileSize: MAX_BANNER_BYTES}
});

const removeFile = filePath => {
    if (!filePath) return;
    fs.unlink(filePath, () => {});
};

module.exports = {
    projectUpload,
    imageUpload,
    avatarUpload,
    bannerUpload,
    removeFile,
    projectFields: projectUpload.fields([
        {name: 'file', maxCount: 1},
        {name: 'thumbnail', maxCount: 1}
    ]),
    thumbnailField: imageUpload.single('thumbnail'),
    avatarField: avatarUpload.single('avatar'),
    bannerField: bannerUpload.single('banner')
};
