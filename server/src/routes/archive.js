const express = require('express');
const {getArchiveProjects, downloadArchiveProject} = require('../lib/arkide-archive');

const router = express.Router();

router.get('/projects', async (req, res) => {
    try {
        const items = await getArchiveProjects();
        res.json({items});
    } catch (err) {
        res.status(502).json({error: `Could not load the ArkIDE archive: ${err.message}`});
    }
});

router.get('/projects/:id/download', async (req, res) => {
    try {
        const result = await downloadArchiveProject(req.params.id);
        if (!result) {
            return res.status(404).json({error: 'Project not found in the archive'});
        }
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.setHeader('Content-Type', 'application/zip');
        res.send(result.buffer);
    } catch (err) {
        res.status(502).json({error: `Could not rebuild this project: ${err.message}`});
    }
});

module.exports = router;
