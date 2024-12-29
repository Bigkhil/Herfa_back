const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Auth stuff
router.route('/login').post(authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Profile Stuff
// Protecting Routes
router.use(authController.protect);

router.get('/me', authController.getMe, (req, res, next) => {
  if (req.user.role === 'worker') {
    return authController.getWorkerMe(req, res, next);
  } else if (req.user.role === 'customer') {
    return authController.getCustomerMe(req, res, next);
  }
});
router.patch('/updateMe', authController.updateMe);
router.patch('/updateMyPassword', authController.updatePassword);
// router.delete('/deleteMe', userController.deleteMe);

module.exports = router;
