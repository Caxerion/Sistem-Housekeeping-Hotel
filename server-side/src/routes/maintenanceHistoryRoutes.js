const express = require('express');
const router = express.Router();
const { getRiwayatPembersihan, deleteAllRiwayat } = require('../controllers/riwayatPembersihanController');
const { verifyToken, verifyRole } = require('../middlewares/auth');

router.use(verifyToken);
router.use(verifyRole(['admin', 'staff']));

router.get('/history', getRiwayatPembersihan);
router.delete('/history', deleteAllRiwayat);
module.exports = router;