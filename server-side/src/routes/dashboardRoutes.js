const express = require('express');
const router = express.Router();
const { getDashboardStats, getTrend } = require('../controllers/dashboardController');
const { verifyToken, verifyRole } = require('../middlewares/auth');


router.use(verifyToken);
router.use(verifyRole(['admin', 'staff']));

router.get('/stats', getDashboardStats);
router.get('/trend', getTrend);

module.exports = router;