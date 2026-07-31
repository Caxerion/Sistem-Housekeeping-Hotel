const express = require('express');
const router = express.Router();
const { getRoomTypes } = require('../controllers/roomTypeController');

router.get('/', getRoomTypes);

module.exports = router;