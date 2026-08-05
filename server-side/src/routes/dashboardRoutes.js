const express = require('express');
const router = express.Router();
const { getDashboardStats, getMaintenanceTrend } = require('../controllers/dashboardController');
const { verifyToken } = require('../middlewares/auth');


router.use(verifyToken);

router.get('/stats', getDashboardStats);
router.get('/maintenance-trend', getMaintenanceTrend);

module.exports = router;