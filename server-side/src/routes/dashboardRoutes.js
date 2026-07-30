const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/stats', getDashboardStats);

module.exports = router;