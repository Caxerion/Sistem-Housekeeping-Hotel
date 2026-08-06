const express = require('express');
const router = express.Router();
const { getRoomLogs } = require('../controllers/roomLogsController');
const { verifyToken, verifyRole } = require('../middlewares/auth');

router.use(verifyToken);
router.use(verifyRole(['admin', 'staff']));

router.get('/', getRoomLogs);

module.exports = router;
