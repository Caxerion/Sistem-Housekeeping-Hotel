const express = require('express');
const router = express.Router();
const { getAllRooms, updateRoom } = require('../controllers/roomController');
const { verifyToken, verifyRole } = require('../middlewares/auth');

router.use(verifyToken);
router.use(verifyRole(['admin']));

router.get('/', getAllRooms);
router.put('/:id', updateRoom);

module.exports = router;