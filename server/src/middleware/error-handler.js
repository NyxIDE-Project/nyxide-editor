const multer = require('multer');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({error: 'File exceeds the maximum allowed size'});
    }
    if (err instanceof multer.MulterError) {
        return res.status(400).json({error: err.message});
    }
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({error: 'Internal server error'});
};

module.exports = errorHandler;
