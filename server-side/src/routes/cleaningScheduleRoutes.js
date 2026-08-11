const express = require('express');
const router = express.Router();
const {
    getRooms,
    getHousekeepingStaff,
    getAllCleaningSchedules,
    createCleaningSchedule,
    updateCleaningSchedule,
    startCleaningSchedule,
    completeCleaningSchedule,
    cancelCleaningSchedule,
    assignStaffToCleaningSchedule,
    uploadCleaningPhotos,
    getMyCleaningSchedule,
} = require('../controllers/cleaningScheduleController');
const { verifyToken, verifyRole } = require('../middlewares/auth');
const { uploadMaintenancePhotos } = require('../middlewares/upload');

router.use(verifyToken);
router.use(verifyRole(['admin', 'staff']));

router.get('/rooms', getRooms);
router.get('/staff', getHousekeepingStaff);
router.get('/', getAllCleaningSchedules);
router.get('/my-schedule', getMyCleaningSchedule);
router.post('/', createCleaningSchedule);
router.put('/:id', updateCleaningSchedule);
router.put('/:id/assign-staff', assignStaffToCleaningSchedule);
router.post('/:id/upload-photos', uploadMaintenancePhotos.array('photos', 20), uploadCleaningPhotos);
router.put('/:id/start', startCleaningSchedule);
router.put('/:id/complete', completeCleaningSchedule);
router.put('/:id/cancel', cancelCleaningSchedule);

module.exports = router;
