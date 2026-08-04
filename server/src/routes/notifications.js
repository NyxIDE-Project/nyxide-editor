const express = require('express');
const notificationsModel = require('../models/notifications');
const {requireAuth} = require('../middleware/auth');
const {serializeNotification} = require('../lib/serialize');

const router = express.Router();

const PAGE_SIZE = 30;
const pageOf = req => Math.max(1, parseInt(req.query.page, 10) || 1);

router.get('/', requireAuth, (req, res) => {
    const page = pageOf(req);
    const {items, total} = notificationsModel.listByUser(req.user.id, page, PAGE_SIZE);
    res.json({
        items: items.map(serializeNotification),
        total,
        page,
        pageSize: PAGE_SIZE,
        unreadCount: notificationsModel.unreadCount(req.user.id)
    });
});

router.get('/unread-count', requireAuth, (req, res) => {
    res.json({unreadCount: notificationsModel.unreadCount(req.user.id)});
});

router.post('/:id/read', requireAuth, (req, res) => {
    notificationsModel.markRead(req.params.id, req.user.id);
    res.json({unreadCount: notificationsModel.unreadCount(req.user.id)});
});

router.post('/read-all', requireAuth, (req, res) => {
    notificationsModel.markAllRead(req.user.id);
    res.json({unreadCount: 0});
});

router.delete('/', requireAuth, (req, res) => {
    notificationsModel.deleteAllForUser(req.user.id);
    res.status(204).end();
});

router.delete('/:id', requireAuth, (req, res) => {
    notificationsModel.deleteOne(req.params.id, req.user.id);
    res.status(204).end();
});

module.exports = router;
