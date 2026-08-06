const express = require('express');
const router = express.Router();
const { getRoomTypes } = require('../controllers/roomTypeController');
const { verifyToken, verifyRole } = require('../middlewares/auth');

router.use(verifyToken);
router.use(verifyRole(['admin', 'staff']));

router.get('/', getRoomTypes);

module.exports = router;