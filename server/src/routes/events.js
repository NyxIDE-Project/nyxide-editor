const express = require('express');
const usersModel = require('../models/users');
const eventsModel = require('../models/events');
const {serializeEvent} = require('../lib/serialize');

const router = express.Router();

router.get('/', (req, res) => {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 5));
    const items = eventsModel.listRecent(limit);
    res.json({
        items: items.map(event => serializeEvent(event, event.created_by ? usersModel.getById(event.created_by) : null))
    });
});

module.exports = router;
