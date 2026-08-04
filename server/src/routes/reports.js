const express = require('express');
const reportsModel = require('../models/reports');
const usersModel = require('../models/users');
const projectsModel = require('../models/projects');
const {requireAuth, blockIfBanned} = require('../middleware/auth');
const {serializeReport} = require('../lib/serialize');

const router = express.Router();

const VALID_TARGET_TYPES = ['project', 'user'];

router.post('/', requireAuth, blockIfBanned, (req, res) => {
    const {targetType, targetId, reason} = req.body;
    if (!VALID_TARGET_TYPES.includes(targetType)) {
        return res.status(400).json({error: 'targetType must be "project" or "user"'});
    }
    if (typeof reason !== 'string' || !reason.trim()) {
        return res.status(400).json({error: 'A reason is required'});
    }
    const target = targetType === 'project' ?
        projectsModel.getById(targetId) :
        usersModel.getById(targetId);
    if (!target) {
        return res.status(404).json({error: 'The thing you are reporting could not be found'});
    }
    const report = reportsModel.create({
        reporterId: req.user.id,
        targetType,
        targetId,
        reason: reason.trim().slice(0, 1000)
    });
    res.status(201).json(serializeReport(report, req.user));
});

module.exports = router;
