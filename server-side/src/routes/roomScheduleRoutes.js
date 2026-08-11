const express = require('express');
const router = express.Router();
const {
    getAvailableRooms,
    getHousekeepingStaff,
    getAllSchedules,
    createSchedule,
    updateSchedule,
    startSchedule,
    completeSchedule,
    cancelSchedule,
    requestMaintenance,
    assignStaffToSchedule,
    uploadPhotos,
    getMySchedule,
} = require('../controllers/roomScheduleController');
const { verifyToken, verifyRole } = require('../middlewares/auth');
const { uploadMaintenancePhotos } = require('../middlewares/upload');

router.use(verifyToken);
router.use(verifyRole(['admin', 'staff']));

router.get('/rooms-available', getAvailableRooms);
router.get('/staff', getHousekeepingStaff);
router.get('/', getAllSchedules);
router.get('/my-schedule', getMySchedule);
router.post('/', createSchedule);
router.post('/request', requestMaintenance);
router.put('/:id', updateSchedule);
router.put('/:id/assign-staff', assignStaffToSchedule);
router.post('/:id/upload-photos', uploadMaintenancePhotos.array('photos', 20), uploadPhotos);
router.put('/:id/start', startSchedule);
router.put('/:id/complete', completeSchedule);
router.put('/:id/cancel', cancelSchedule);

module.exports = router