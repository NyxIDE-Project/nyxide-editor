const express = require('express');
const path = require('path');
const usersModel = require('../models/users');
const projectsModel = require('../models/projects');
const {requireAuth, blockIfBanned, loadProject, requireProjectOwnership} = require('../middleware/auth');
const {projectFields, thumbnailField, removeFile} = require('../middleware/upload');
const {serializeProject, serializeProjectSummary} = require('../lib/serialize');

const router = express.Router();

const PAGE_SIZE = 24;
const pageOf = req => Math.max(1, parseInt(req.query.page, 10) || 1);

router.get('/', (req, res) => {
    const page = pageOf(req);
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const {items, total} = query ?
        projectsModel.search(query, page, PAGE_SIZE) :
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

router.post('/', requireAuth, blockIfBanned, projectFields, (req, res) => {
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
    res.status(201).json(serializeProject(project, req.user, req.user.id));
});

router.put('/:id', requireAuth, blockIfBanned, loadProject, requireProjectOwnership, (req, res) => {
    const title = typeof req.body.title === 'string' && req.body.title.trim() ? req.body.title.trim().slice(0, 100) : req.project.title;
    const description = typeof req.body.description === 'string' ? req.body.description.slice(0, 2000) : req.project.description;
    const notesAndCredits = typeof req.body.notesAndCredits === 'string' ?
        req.body.notesAndCredits.slice(0, 2000) : req.project.notes_and_credits;

    const updated = projectsModel.updateMeta(req.project.id, {title, description, notesAndCredits});
    res.json(serializeProject(updated, req.user, req.user.id));
});

router.put('/:id/file', requireAuth, blockIfBanned, loadProject, requireProjectOwnership, projectFields, (req, res) => {
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

router.put('/:id/thumbnail', requireAuth, blockIfBanned, loadProject, requireProjectOwnership, thumbnailField, (req, res) => {
    if (!req.file) {
        return res.status(400).json({error: 'A thumbnail image is required'});
    }
    const previousThumbnail = req.project.thumbnail_path;
    const updated = projectsModel.updateThumbnail(req.project.id, req.file.path);
    removeFile(previousThumbnail);
    res.json(serializeProject(updated, req.user, req.user.id));
});

router.post('/:id/like', requireAuth, blockIfBanned, loadProject, (req, res) => {
    projectsModel.like(req.user.id, req.project.id);
    projectsModel.autoFeatureIfEligible(req.project.id);
    res.json(projectsModel.getEngagement(req.project.id, req.user.id));
});

router.delete('/:id/like', requireAuth, blockIfBanned, loadProject, (req, res) => {
    projectsModel.unlike(req.user.id, req.project.id);
    res.json(projectsModel.getEngagement(req.project.id, req.user.id));
});

router.post('/:id/favorite', requireAuth, blockIfBanned, loadProject, (req, res) => {
    projectsModel.favorite(req.user.id, req.project.id);
    projectsModel.autoFeatureIfEligible(req.project.id);
    res.json(projectsModel.getEngagement(req.project.id, req.user.id));
});

router.delete('/:id/favorite', requireAuth, blockIfBanned, loadProject, (req, res) => {
    projectsModel.unfavorite(req.user.id, req.project.id);
    res.json(projectsModel.getEngagement(req.project.id, req.user.id));
});

router.delete('/:id', requireAuth, blockIfBanned, loadProject, requireProjectOwnership, (req, res) => {
    projectsModel.remove(req.project.id);
    removeFile(req.project.file_path);
    removeFile(req.project.thumbnail_path);
    res.status(204).end();
});

module.exports = router;
