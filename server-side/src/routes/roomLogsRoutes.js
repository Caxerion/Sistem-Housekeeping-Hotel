const express = require('express');
const router = express.Router();
const { getRoomLogs } = require('../controllers/roomLogsController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', getRoomLogs);

module.exports = router;
