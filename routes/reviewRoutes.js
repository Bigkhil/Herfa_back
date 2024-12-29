const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('customer'),
    reviewController.setWorkerCustomersIds,
    reviewController.createReview,
  );

router
  .route('/:id')
  .delete(reviewController.deleteReview)
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('customer', 'admin'),
    reviewController.updateReview,
  );

module.exports = router;
