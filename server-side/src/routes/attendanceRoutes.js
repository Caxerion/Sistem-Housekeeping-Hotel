const express = require('express');
const router = express.Router();
const {
    getMyAttendanceToday,
    checkIn,
    checkOut,
    submitIzin,
    getAttendanceLogs,
} = require('../controllers/attendanceController');
const { verifyToken, verifyRole } = require('../middlewares/auth');
const { uploadAttendancePhotos } = require('../middlewares/upload');

router.use(verifyToken);
router.use(verifyRole(['admin', 'staff']));

router.get('/today', getMyAttendanceToday);
router.post('/check-in', checkIn);
router.post('/:id/check-out', uploadAttendancePhotos.array('photos', 10), checkOut);
router.post('/:id/izin', submitIzin);
router.get('/logs', getAttendanceLogs);

module.exports = router;