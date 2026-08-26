const express = require('express');
const path = require('path');
const usersModel = require('../models/users');
const projectsModel = require('../models/projects');
const {
    requireAuth, blockIfBanned, requireVerifiedEmail, loadProject, requireProjectOwnership
} = require('../middleware/auth');
const {projectFields, thumbnailField, removeFile} = require('../middleware/upload');
const {projectWriteLimiter} = require('../middleware/rate-limit');
const {serializeProject, serializeProjectSummary} = require('../lib/serialize');
const {HOMEPAGE_FEATURE_THRESHOLD} = require('../config');

const router = express.Router();

const PAGE_SIZE = 24;
const pageOf = req => Math.max(1, parseInt(req.query.page, 10) || 1);

const TAG_RE = /^[a-z0-9_-]{1,30}$/;
const MAX_TAGS = 10;

// Search-bar operators: "#tag" filters by tag, ":isfeatured" filters to homepage-featured
// projects, ":newest" is an explicit request for newest-first (which is already every
// listing's default order, so it's a recognized no-op - it just needs to not fall through to
// free text). Anything else is treated as free text and ANDed with the operators.
const TAG_TOKEN_RE = /^#([a-z0-9_-]{1,30})$/i;
const parseSearchTokens = q => {
    const tags = [];
    let isFeatured = false;
    let isNewest = false;
    const textParts = [];
    q.split(/\s+/).filter(Boolean).forEach(token => {
        const tagMatch = token.match(TAG_TOKEN_RE);
        const lower = token.toLowerCase();
        if (tagMatch) {
            tags.push(tagMatch[1].toLowerCase());
        } else if (lower === ':isfeatured') {
            isFeatured = true;
        } else if (lower === ':newest') {
            isNewest = true;
        } else {
            textParts.push(token);
        }
    });
    return {tags, isFeatured, isNewest, queryText: textParts.join(' ')};
};

// Accepts either a real array (JSON request bodies, e.g. PUT /:id) or a JSON-stringified
// array (multipart form fields, e.g. POST / upload, which are always plain strings), and
// returns a cleaned, deduplicated, capped list. Invalid entries are silently dropped rather
// than erroring the whole request - the client already validates this, this is just defense
// in depth.
const parseTagsField = raw => {
    let list = raw;
    if (typeof raw === 'string') {
        try {
            list = JSON.parse(raw);
        } catch (e) {
            return [];
        }
    }
    if (!Array.isArray(list)) {
        return [];
    }
    const cleaned = [];
    list.forEach(entry => {
        if (typeof entry !== 'string') return;
        const tag = entry.trim().toLowerCase().replace(/^#/, '');
        if (TAG_RE.test(tag) && !cleaned.includes(tag)) {
            cleaned.push(tag);
        }
    });
    return cleaned.slice(0, MAX_TAGS);
};

router.get('/', (req, res) => {
    const page = pageOf(req);
    const rawQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const {tags, isFeatured: isFeaturedToken, isNewest, queryText} = parseSearchTokens(rawQuery);
    if (typeof req.query.tag === 'string' && req.query.tag.trim()) {
        tags.push(req.query.tag.trim().toLowerCase());
    }
    const isFeatured = isFeaturedToken || req.query.featured === 'true';
    const hasFilters = tags.length > 0 || isFeatured || isNewest || queryText;
    const {items, total} = hasFilters ?
        projectsModel.queryProjects({queryText, tags, isFeatured, page, pageSize: PAGE_SIZE}) :
        projectsModel.listAll(page, PAGE_SIZE);
    res.json({
        items: items.map(project => serializeProjectSummary(project, usersModel.getById(project.owner_id))),
        total,
        page,
        pageSize: PAGE_SIZE
    });
});

// Must come before GET /:id, otherwise "featured" would be parsed as a project id.
router.get('/featured', (req, res) => {
    const items = projectsModel.listHomepageFeatured();
    res.json({
        items: items.map(project => serializeProjectSummary(project, usersModel.getById(project.owner_id)))
    });
});

// Must come before GET /:id, otherwise "near-featured" would be parsed as a project id.
router.get('/near-featured', (req, res) => {
    const items = projectsModel.listNearFeatured();
    res.json({
        items: items.map(project => serializeProjectSummary(project, usersModel.getById(project.owner_id))),
        threshold: HOMEPAGE_FEATURE_THRESHOLD
    });
});

// Must come before GET /:id, otherwise "tags" would be parsed as a project id.
router.get('/tags/popular', (req, res) => {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 3));
    res.json({items: projectsModel.popularTags(limit)});
});

router.get('/:id', loadProject, (req, res) => {
    projectsModel.recordView(req.project.id);
    const project = projectsModel.getById(req.project.id);
    const owner = usersModel.getById(project.owner_id);
    res.json(serializeProject(project, owner, req.user && req.user.id));
});

router.get('/:id/file', loadProject, (req, res) => {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${req.project.id}.sb3"`);
    res.sendFile(path.resolve(req.project.file_path));
});

router.get('/:id/thumbnail', loadProject, (req, res) => {
    if (!req.project.thumbnail_path) {
        return res.status(404).end();
    }
    res.sendFile(path.resolve(req.project.thumbnail_path));
});

router.post('/', requireAuth, blockIfBanned, requireVerifiedEmail, projectWriteLimiter, projectFields, (req, res) => {
    const file = req.files && req.files.file && req.files.file[0];
    const thumbnail = req.files && req.files.thumbnail && req.files.thumbnail[0];
    if (!file) {
        return res.status(400).json({error: 'A project file is required'});
    }
    const title = typeof req.body.title === 'string' && req.body.title.trim() ? req.body.title.trim().slice(0, 100) : 'Untitled';
    const description = typeof req.body.description === 'string' ? req.body.description.slice(0, 2000) : '';
    const notesAndCredits = typeof req.body.notesAndCredits === 'string' ? req.body.notesAndCredits.slice(0, 2000) : '';

    const project = projectsModel.create({
        ownerId: req.user.id,
        title,
        description,
        notesAndCredits,
        filePath: file.path,
        thumbnailPath: thumbnail ? thumbnail.path : null,
        fileSize: file.size
    });
    projectsModel.setTags(project.id, parseTagsField(req.body.tags));
    res.status(201).json(serializeProject(project, req.user, req.user.id));
});

router.put('/:id',
    requireAuth, blockIfBanned, requireVerifiedEmail, projectWriteLimiter, loadProject, requireProjectOwnership,
    (req, res) => {
        const title = typeof req.body.title === 'string' && req.body.title.trim() ?
            req.body.title.trim().slice(0, 100) : req.project.title;
        const description = typeof req.body.description === 'string' ?
            req.body.description.slice(0, 2000) : req.project.description;
        const notesAndCredits = typeof req.body.notesAndCredits === 'string' ?
            req.body.notesAndCredits.slice(0, 2000) : req.project.notes_and_credits;

        const updated = projectsModel.updateMeta(req.project.id, {title, description, notesAndCredits});
        if (Object.prototype.hasOwnProperty.call(req.body, 'tags')) {
            projectsModel.setTags(req.project.id, parseTagsField(req.body.tags));
        }
        res.json(serializeProject(updated, req.user, req.user.id));
    });

router.put('/:id/file',
    requireAuth, blockIfBanned, requireVerifiedEmail, projectWriteLimiter, loadProject, requireProjectOwnership,
    projectFields, (req, res) => {
        const file = req.files && req.files.file && req.files.file[0];
        const thumbnail = req.files && req.files.thumbnail && req.files.thumbnail[0];
        if (!file) {
            return res.status(400).json({error: 'A project file is required'});
        }
        const previousFile = req.project.file_path;
        const previousThumbnail = req.project.thumbnail_path;

        const updated = projectsModel.updateFile(req.project.id, {
            filePath: file.path,
            thumbnailPath: thumbnail ? thumbnail.path : previousThumbnail,
            fileSize: file.size
        });

        removeFile(previousFile);
        if (thumbnail) removeFile(previousThumbnail);

        res.json(serializeProject(updated, req.user, req.user.id));
    });

router.put('/:id/thumbnail',
    requireAuth, blockIfBanned, requireVerifiedEmail, loadProject, requireProjectOwnership, thumbnailField,
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({error: 'A thumbnail image is required'});
        }
        const previousThumbnail = req.project.thumbnail_path;
        const updated = projectsModel.updateThumbnail(req.project.id, req.file.path);
        removeFile(previousThumbnail);
        res.json(serializeProject(updated, req.user, req.user.id));
    });

router.post('/:id/like', requireAuth, blockIfBanned, requireVerifiedEmail, loadProject, (req, res) => {
    projectsModel.like(req.user.id, req.project.id);
    projectsModel.autoFeatureIfEligible(req.project.id);
    res.json(projectsModel.getEngagement(req.project.id, req.user.id));
});

router.delete('/:id/like', requireAuth, blockIfBanned, requireVerifiedEmail, loadProject, (req, res) => {
    projectsModel.unlike(req.user.id, req.project.id);
    res.json(projectsModel.getEngagement(req.project.id, req.user.id));
});

router.post('/:id/favorite', requireAuth, blockIfBanned, requireVerifiedEmail, loadProject, (req, res) => {
    projectsModel.favorite(req.user.id, req.project.id);
    projectsModel.autoFeatureIfEligible(req.project.id);
    res.json(projectsModel.getEngagement(req.project.id, req.user.id));
});

router.delete('/:id/favorite', requireAuth, blockIfBanned, requireVerifiedEmail, loadProject, (req, res) => {
    projectsModel.unfavorite(req.user.id, req.project.id);
    res.json(projectsModel.getEngagement(req.project.id, req.user.id));
});

router.delete('/:id',
    requireAuth, blockIfBanned, requireVerifiedEmail, loadProject, requireProjectOwnership,
    (req, res) => {
        projectsModel.remove(req.project.id);
        removeFile(req.project.file_path);
        removeFile(req.project.thumbnail_path);
        res.status(204).end();
    });

module.exports = router;
