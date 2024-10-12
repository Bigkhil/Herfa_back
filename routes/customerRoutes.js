const express = require('express');
const authController = require('../controllers/authController');
const customerController = require('../controllers/customerController');

const router = express.Router();
// Auth stuff
router.route('/signup').post(authController.signup);


module.exports = router;
// api/v2/user/login
