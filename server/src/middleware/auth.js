const usersModel = require('../models/users');
const projectsModel = require('../models/projects');
const {ADMIN_SESSION_TTL_MS} = require('../config');

const attachUser = (req, res, next) => {
    req.user = req.session && req.session.userId ? usersModel.getById(req.session.userId) || null : null;
    next();
};

const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({error: 'Not logged in'});
    }
    next();
};

// Blocks write actions for banned accounts, while still letting them log in and see why
// (attachUser still populates req.user for banned accounts).
const blockIfBanned = (req, res, next) => {
    if (req.user && usersModel.isBanned(req.user)) {
        return res.status(403).json({
            error: `Your account is restricted until ${new Date(req.user.banned_until).toISOString()}. ` +
                `Reason: ${req.user.ban_reason || 'No reason given'}`
        });
    }
    next();
};

// Blocks project/profile writes for unverified accounts. Deliberately not applied to
// PUT /users/me/email (needs to stay reachable so an unverified user can fix/set their email
// and get a new link) or POST /auth/send-email-action (how they verify in the first place).
const requireVerifiedEmail = (req, res, next) => {
    if (req.user && !req.user.email_verified) {
        return res.status(403).json({error: 'Verify your email before doing that - see Settings.'});
    }
    next();
};

// "owner" is functionally identical to "admin" (same permissions), just a distinct label
// for the bootstrapped account - see ADMIN_ROLES.
const ADMIN_ROLES = ['admin', 'owner'];

// Admin routes require three independent things: a logged-in session, an admin-tier role,
// and proof of a *recent* login (req.session.adminAuthenticatedAt, set at login time and
// checked against ADMIN_SESSION_TTL_MS) - an old session that happened to be promoted to
// admin/owner later isn't enough; it has to log in again after the promotion to pick this up.
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({error: 'Not logged in'});
    }
    if (!ADMIN_ROLES.includes(req.user.role)) {
        return res.status(403).json({error: 'You do not have permission to do that'});
    }
    const authenticatedAt = req.session.adminAuthenticatedAt;
    if (!authenticatedAt || (Date.now() - authenticatedAt) > ADMIN_SESSION_TTL_MS) {
        return res.status(403).json({error: 'Your admin session has expired. Please log out and log back in.'});
    }
    next();
};

const loadProject = (req, res, next) => {
    const project = projectsModel.getById(req.params.id);
    if (!project) {
        return res.status(404).json({error: 'Project not found'});
    }
    req.project = project;
    next();
};

const requireProjectOwnership = (req, res, next) => {
    if (req.project.owner_id !== req.user.id) {
        return res.status(403).json({error: 'You do not own this project'});
    }
    next();
};

module.exports = {
    attachUser,
    requireAuth,
    blockIfBanned,
    requireVerifiedEmail,
    requireAdmin,
    ADMIN_ROLES,
    loadProject,
    requireProjectOwnership
};
