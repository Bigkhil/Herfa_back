const express = require('express');
const orderController = require('../controllers/orderController');
const authController = require('../controllers/authController');
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

// get all order for the worker himself / not allowed to see others' orders
router
  .route('/')
  .get(orderController.getAllOrders)
  .post(orderController.createOrder);

// router.post(
//   '/workers/:workerId/orders',
//   authController.protect,
//   orderController.createOrder,
// );

router
  .route('/:id')
  .get(orderController.getOrder)
  .patch(orderController.updateOrder)
  .delete(orderController.deleteOrder);

module.exports = router;
