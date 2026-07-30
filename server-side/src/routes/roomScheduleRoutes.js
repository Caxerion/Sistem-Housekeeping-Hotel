const express = require('express');
const router = express.Router();
const {
    getAvailableRooms,
    getHousekeepingStaff,
    getAllSchedules,
    createSchedule,
    startSchedule,
    completeSchedule,
    cancelSchedule,
} = require('../controllers/roomScheduleController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/rooms-available', getAvailableRooms);
router.get('/staff', getHousekeepingStaff);
router.get('/', getAllSchedules);
router.post('/', createSchedule);
router.put('/:id/start', startSchedule);
router.put('/:id/complete', completeSchedule);
router.put('/:id/cancel', cancelSchedule);

module.exports = router