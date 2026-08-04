const express = require('express');
const path = require('path');
const usersModel = require('../models/users');
const projectsModel = require('../models/projects');
const {requireAuth, blockIfBanned} = require('../middleware/auth');
const {avatarField, bannerField, removeFile} = require('../middleware/upload');
const {serializeProfile, serializeUser, serializeProjectSummary} = require('../lib/serialize');

const router = express.Router();

const PAGE_SIZE = 24;
const pageOf = req => Math.max(1, parseInt(req.query.page, 10) || 1);

const loadUserByUsername = (req, res, next) => {
    const user = usersModel.getByUsername(req.params.username);
    if (!user) {
        return res.status(404).json({error: 'User not found'});
    }
    req.profileUser = user;
    next();
};

router.get('/:username', loadUserByUsername, (req, res) => {
    const profile = serializeProfile(req.profileUser, req.user && req.user.id);
    const featured = projectsModel.listFeatured(req.profileUser.id)
        .map(project => serializeProjectSummary(project, req.profileUser));
    res.json({...profile, featuredProjects: featured});
});

router.put('/me', requireAuth, blockIfBanned, (req, res) => {
    const displayName = typeof req.body.displayName === 'string' ? req.body.displayName.slice(0, 60) : req.user.display_name;
    const bio = typeof req.body.bio === 'string' ? req.body.bio.slice(0, 500) : req.user.bio;
    const updated = usersModel.updateProfile(req.user.id, {displayName, bio});
    res.json({user: serializeUser(updated)});
});

router.post('/me/avatar', requireAuth, blockIfBanned, avatarField, (req, res) => {
    if (!req.file) {
        return res.status(400).json({error: 'No avatar file provided'});
    }
    const previous = req.user.avatar_path;
    const updated = usersModel.updateAvatar(req.user.id, req.file.path);
    if (previous) removeFile(previous);
    res.json({user: serializeUser(updated)});
});

router.get('/:username/avatar', loadUserByUsername, (req, res) => {
    if (!req.profileUser.avatar_path) {
        return res.status(404).end();
    }
    res.sendFile(path.resolve(req.profileUser.avatar_path));
});

router.post('/me/banner', requireAuth, blockIfBanned, bannerField, (req, res) => {
    if (!req.file) {
        return res.status(400).json({error: 'No banner file provided'});
    }
    const previous = req.user.banner_path;
    const updated = usersModel.updateBanner(req.user.id, req.file.path);
    if (previous) removeFile(previous);
    res.json({user: serializeUser(updated)});
});

router.get('/:username/banner', loadUserByUsername, (req, res) => {
    if (!req.profileUser.banner_path) {
        return res.status(404).end();
    }
    res.sendFile(path.resolve(req.profileUser.banner_path));
});

router.put('/me/featured', requireAuth, blockIfBanned, (req, res) => {
    const projectIds = Array.isArray(req.body.projectIds) ? req.body.projectIds : [];
    const owned = projectIds.filter(id => {
        const project = projectsModel.getById(id);
        return project && project.owner_id === req.user.id;
    });
    projectsModel.setFeatured(req.user.id, owned);
    res.status(204).end();
});

router.post('/:username/follow', requireAuth, blockIfBanned, loadUserByUsername, (req, res) => {
    if (req.profileUser.id === req.user.id) {
        return res.status(400).json({error: 'You cannot follow yourself'});
    }
    usersModel.follow(req.user.id, req.profileUser.id);
    res.json({followerCount: usersModel.getCounts(req.profileUser.id).followers});
});

router.delete('/:username/follow', requireAuth, blockIfBanned, loadUserByUsername, (req, res) => {
    usersModel.unfollow(req.user.id, req.profileUser.id);
    res.json({followerCount: usersModel.getCounts(req.profileUser.id).followers});
});

router.get('/:username/followers', loadUserByUsername, (req, res) => {
    const page = pageOf(req);
    const items = usersModel.listFollowers(req.profileUser.id, page, PAGE_SIZE).map(serializeUser);
    res.json({items, total: usersModel.getCounts(req.profileUser.id).followers, page, pageSize: PAGE_SIZE});
});

router.get('/:username/following', loadUserByUsername, (req, res) => {
    const page = pageOf(req);
    const items = usersModel.listFollowing(req.profileUser.id, page, PAGE_SIZE).map(serializeUser);
    res.json({items, total: usersModel.getCounts(req.profileUser.id).following, page, pageSize: PAGE_SIZE});
});

router.get('/:username/projects', loadUserByUsername, (req, res) => {
    const page = pageOf(req);
    const {items, total} = projectsModel.listByOwner(req.profileUser.id, page, PAGE_SIZE);
    res.json({
        items: items.map(project => serializeProjectSummary(project, req.profileUser)),
        total,
        page,
        pageSize: PAGE_SIZE
    });
});

module.exports = router;
