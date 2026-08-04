const express = require('express');
const router = express.Router();
const { getRiwayatPembersihan, deleteAllRiwayat } = require('../controllers/riwayatPembersihanController');

router.get('/history', getRiwayatPembersihan);
router.delete('/history', deleteAllRiwayat);
module.exports = router;