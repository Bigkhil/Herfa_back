const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Auth stuff
router.route('/login').post(authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Profile Stuff
module.exports = router;

