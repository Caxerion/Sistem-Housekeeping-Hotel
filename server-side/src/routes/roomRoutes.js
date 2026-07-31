const express = require('express');
const router = express.Router();
const { getAllRooms, updateRoom } = require('../controllers/roomController');

router.get('/', getAllRooms);
router.put('/:id', updateRoom);

module.exports = router;