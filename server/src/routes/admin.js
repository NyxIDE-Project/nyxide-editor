const express = require('express');
const usersModel = require('../models/users');
const projectsModel = require('../models/projects');
const reportsModel = require('../models/reports');
const notificationsModel = require('../models/notifications');
const eventsModel = require('../models/events');
const bannerModel = require('../models/banner');
const {requireAdmin, loadProject} = require('../middleware/auth');
const {removeFile} = require('../middleware/upload');
const {
    serializeMe, serializeProject, serializeProjectSummary, serializeReport, serializeEvent, serializeBanner
} = require('../lib/serialize');

const router = express.Router();

const PAGE_SIZE = 30;
const pageOf = req => Math.max(1, parseInt(req.query.page, 10) || 1);

router.use(requireAdmin);

const loadTargetUser = (req, res, next) => {
    const user = usersModel.getById(req.params.id);
    if (!user) {
        return res.status(404).json({error: 'User not found'});
    }
    req.targetUser = user;
    next();
};

// --- Users ---

router.get('/users', (req, res) => {
    const page = pageOf(req);
    const search = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const {items, total} = usersModel.listAllUsers(page, PAGE_SIZE, search);
    res.json({items: items.map(serializeMe), total, page, pageSize: PAGE_SIZE});
});

router.get('/users/:id', loadTargetUser, (req, res) => {
    const counts = usersModel.getCounts(req.targetUser.id);
    res.json({...serializeMe(req.targetUser), ...counts});
});

router.put('/users/:id/role', loadTargetUser, (req, res) => {
    const {role} = req.body;
    if (role !== 'user' && role !== 'admin') {
        return res.status(400).json({error: 'role must be "user" or "admin"'});
    }
    const updated = usersModel.setRole(req.targetUser.id, role);
    res.json(serializeMe(updated));
});

router.put('/users/:id/ban', loadTargetUser, (req, res) => {
    const days = Number(req.body.days);
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim().slice(0, 1000) : '';
    if (!Number.isFinite(days) || days <= 0) {
        return res.status(400).json({error: 'days must be a positive number'});
    }
    if (!reason) {
        return res.status(400).json({error: 'A reason is required'});
    }
    const bannedUntil = Date.now() + (days * 24 * 60 * 60 * 1000);
    const updated = usersModel.banUser(req.targetUser.id, bannedUntil, reason);
    notificationsModel.create({
        userId: req.targetUser.id,
        type: 'account_restricted',
        title: 'Your account has been restricted',
        body: `Your account is restricted until ${new Date(bannedUntil).toLocaleString()}. Reason: ${reason}`
    });
    res.json(serializeMe(updated));
});

router.put('/users/:id/unban', loadTargetUser, (req, res) => {
    const updated = usersModel.unbanUser(req.targetUser.id);
    notificationsModel.create({
        userId: req.targetUser.id,
        type: 'account_restored',
        title: 'Your account restriction has been lifted',
        body: 'Your account is no longer restricted.'
    });
    res.json(serializeMe(updated));
});

router.delete('/users/:id', loadTargetUser, (req, res) => {
    const {items: projects} = projectsModel.listByOwner(req.targetUser.id, 1, 100000);
    projects.forEach(project => {
        removeFile(project.file_path);
        removeFile(project.thumbnail_path);
    });
    removeFile(req.targetUser.avatar_path);
    usersModel.deleteUser(req.targetUser.id);
    res.status(204).end();
});

// --- Reports ---

router.get('/reports', (req, res) => {
    const page = pageOf(req);
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const {items, total} = reportsModel.list(page, PAGE_SIZE, status);
    const enriched = items.map(report => {
        const reporter = usersModel.getById(report.reporter_id);
        const serialized = serializeReport(report, reporter);
        if (report.target_type === 'project') {
            const project = projectsModel.getById(report.target_id);
            serialized.target = project ?
                serializeProject(project, usersModel.getById(project.owner_id)) : null;
        } else {
            const targetUser = usersModel.getById(report.target_id);
            serialized.target = targetUser ? serializeMe(targetUser) : null;
        }
        return serialized;
    });
    res.json({items: enriched, total, page, pageSize: PAGE_SIZE});
});

router.put('/reports/:id/dismiss', (req, res) => {
    const report = reportsModel.getById(req.params.id);
    if (!report) {
        return res.status(404).json({error: 'Report not found'});
    }
    res.json(serializeReport(reportsModel.setStatus(report.id, 'dismissed')));
});

router.put('/reports/:id/resolve', (req, res) => {
    const report = reportsModel.getById(req.params.id);
    if (!report) {
        return res.status(404).json({error: 'Report not found'});
    }
    res.json(serializeReport(reportsModel.setStatus(report.id, 'resolved')));
});

// --- Projects ---

router.delete('/projects/:id', loadProject, (req, res) => {
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim().slice(0, 1000) : '';
    if (!reason) {
        return res.status(400).json({error: 'A reason is required'});
    }
    const ownerId = req.project.owner_id;
    const title = req.project.title;
    projectsModel.remove(req.project.id);
    removeFile(req.project.file_path);
    removeFile(req.project.thumbnail_path);
    notificationsModel.create({
        userId: ownerId,
        type: 'project_removed',
        title: `Your project "${title}" was removed`,
        body: `Reason: ${reason}`
    });
    res.status(204).end();
});

// --- Homepage Featured ---
// Distinct from a user's own profile-featured picks (see /api/users/me/featured) - this is
// the site-wide Featured section on the homepage.

router.get('/homepage-featured', (req, res) => {
    const items = projectsModel.listHomepageFeatured();
    res.json({
        items: items.map(project => serializeProjectSummary(project, usersModel.getById(project.owner_id)))
    });
});

router.post('/homepage-featured/:id', loadProject, (req, res) => {
    projectsModel.manualFeature(req.project.id);
    res.status(204).end();
});

router.delete('/homepage-featured/:id', loadProject, (req, res) => {
    projectsModel.manualUnfeature(req.project.id);
    res.status(204).end();
});

// --- Events ---
// Simple markdown-content announcements shown in the "Current Events" box on the logged-in
// homepage. No draft/publish state - creating one publishes it immediately, deleting removes
// it immediately.

router.get('/events', (req, res) => {
    const items = eventsModel.listRecent(50);
    res.json({
        items: items.map(event => serializeEvent(event, event.created_by ? usersModel.getById(event.created_by) : null))
    });
});

router.post('/events', (req, res) => {
    const title = typeof req.body.title === 'string' ? req.body.title.trim().slice(0, 200) : '';
    const content = typeof req.body.content === 'string' ? req.body.content.slice(0, 20000) : '';
    if (!title) {
        return res.status(400).json({error: 'A title is required'});
    }
    if (!content.trim()) {
        return res.status(400).json({error: 'Content is required'});
    }
    const event = eventsModel.create({title, content, createdBy: req.user.id});
    res.status(201).json(serializeEvent(event, req.user));
});

router.put('/events/:id', (req, res) => {
    const event = eventsModel.getById(req.params.id);
    if (!event) {
        return res.status(404).json({error: 'Event not found'});
    }
    const title = typeof req.body.title === 'string' ? req.body.title.trim().slice(0, 200) : '';
    const content = typeof req.body.content === 'string' ? req.body.content.slice(0, 20000) : '';
    if (!title) {
        return res.status(400).json({error: 'A title is required'});
    }
    if (!content.trim()) {
        return res.status(400).json({error: 'Content is required'});
    }
    const updated = eventsModel.update(event.id, {title, content});
    const author = updated.created_by ? usersModel.getById(updated.created_by) : null;
    res.json(serializeEvent(updated, author));
});

router.delete('/events/:id', (req, res) => {
    const event = eventsModel.getById(req.params.id);
    if (!event) {
        return res.status(404).json({error: 'Event not found'});
    }
    eventsModel.remove(event.id);
    res.status(204).end();
});

// --- Site banner ---
// A single site-wide announcement bar shown under the topbar. Singleton row (id=1 always),
// see server/src/models/banner.js.

router.get('/banner', (req, res) => {
    res.json(serializeBanner(bannerModel.get()));
});

router.put('/banner', (req, res) => {
    const enabled = Boolean(req.body.enabled);
    const color = typeof req.body.color === 'string' && /^#[0-9a-f]{6}$/i.test(req.body.color) ?
        req.body.color : '#4cff8e';
    const content = typeof req.body.content === 'string' ? req.body.content.trim().slice(0, 300) : '';
    const rawButtonText = typeof req.body.buttonText === 'string' ? req.body.buttonText.trim().slice(0, 40) : '';
    const rawButtonUrl = typeof req.body.buttonUrl === 'string' ? req.body.buttonUrl.trim().slice(0, 500) : '';
    // A button needs both a label and a destination - drop it entirely if only one was given
    // rather than saving a half-configured button.
    const hasButton = Boolean(rawButtonText && rawButtonUrl);
    const updated = bannerModel.update({
        enabled,
        color,
        content,
        buttonText: hasButton ? rawButtonText : null,
        buttonUrl: hasButton ? rawButtonUrl : null
    });
    res.json(serializeBanner(updated));
});

// --- Notifications ---

router.post('/notifications/broadcast', (req, res) => {
    const title = typeof req.body.title === 'string' ? req.body.title.trim().slice(0, 200) : '';
    const body = typeof req.body.body === 'string' ? req.body.body.trim().slice(0, 2000) : '';
    if (!title) {
        return res.status(400).json({error: 'A title is required'});
    }
    const count = notificationsModel.createForAllUsers({type: 'admin_broadcast', title, body});
    res.json({sentTo: count});
});

router.post('/users/:id/message', loadTargetUser, (req, res) => {
    const title = typeof req.body.title === 'string' ? req.body.title.trim().slice(0, 200) : '';
    const body = typeof req.body.body === 'string' ? req.body.body.trim().slice(0, 2000) : '';
    if (!title) {
        return res.status(400).json({error: 'A title is required'});
    }
    notificationsModel.create({userId: req.targetUser.id, type: 'admin_message', title, body});
    res.status(204).end();
});

module.exports = router;
