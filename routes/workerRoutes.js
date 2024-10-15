const express = require('express');
const authController = require('../controllers/authController');
const workerController = require('../controllers/workerController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// Auth Stuff
router.route('/signup').post(authController.signup);

// POST /workers/234fad4/reviews
// GET /workers/234fad4/reviews
// GET /workers/234fad4/reviews/56fd12s

router.use('/:workerId/reviews', reviewRouter);

router
  .route('/')
  .get(workerController.getAllWorkers)
  .post(workerController.createWorker);

router
  .route('/:id')
  .get(workerController.getWorker)
  .delete(workerController.deleteWorker);

module.exports = router;
