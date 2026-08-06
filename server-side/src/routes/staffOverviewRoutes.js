const express = require('express');
const router = express.Router();
const staffOverviewController = require('../controllers/staffOverviewController');
const { verifyToken, verifyRole } = require('../middlewares/auth');

// Get staff overview
router.use(verifyToken);
router.use(verifyRole(['admin', 'staff']));

router.get('/overview', staffOverviewController.getStaffOverview);

module.exports = router;