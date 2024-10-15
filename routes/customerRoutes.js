const express = require('express');
const authController = require('../controllers/authController');
const customerController = require('../controllers/customerController');

const router = express.Router();
// Auth stuff
router.route('/signup').post(authController.signup);

router
  .route('/')
  .get(customerController.getAllCustomers)
  .post(customerController.createCustomer);

router
  .route('/:id')
  .get(customerController.getCustomer)
  .delete(customerController.deleteCustomer);

module.exports = router;
