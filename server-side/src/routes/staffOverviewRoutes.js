const express = require('express');
const router = express.Router();
const staffOverviewController = require('../controllers/staffOverviewController');
const { verifyToken } = require('../middlewares/auth');

// Get staff overview
router.use(verifyToken); // Middleware to verify token for authentication

router.get('/overview', staffOverviewController.getStaffOverview);

module.exports = router;