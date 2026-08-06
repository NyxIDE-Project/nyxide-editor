const rateLimit = require('express-rate-limit');

// Keyed by account rather than IP since these routes already sit behind requireAuth.
const projectWriteLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 1,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: req => String(req.user.id),
    handler: (req, res) => {
        res.status(429).json({error: 'You can only save a project once per minute. Please wait and try again.'});
    }
});

module.exports = {
    projectWriteLimiter
};
