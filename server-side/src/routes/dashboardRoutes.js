const express = require('express');
const router = express.Router();
const { getDashboardStats, getMaintenanceTrend } = require('../controllers/dashboardController');
const { verifyToken, verifyRole } = require('../middlewares/auth');


router.use(verifyToken);
router.use(verifyRole(['admin', 'staff']));

router.get('/stats', getDashboardStats);
router.get('/maintenance-trend', getMaintenanceTrend);

module.exports = router;