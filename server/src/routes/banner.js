const express = require('express');
const bannerModel = require('../models/banner');
const {serializeBanner} = require('../lib/serialize');

const router = express.Router();

router.get('/', (req, res) => {
    res.json(serializeBanner(bannerModel.get()));
});

module.exports = router;
