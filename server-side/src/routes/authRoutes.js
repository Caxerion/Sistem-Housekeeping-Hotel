const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middlewares/validations/authValidation');
const { verifyToken } = require('../middlewares/auth');

router.post('/register', validateRegister, authController.register);

router.post('/login', validateLogin, authController.login);

router.post('/logout', authController.logout);

router.put('/profile', verifyToken, authController.updateProfile);

module.exports = router;