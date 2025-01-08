const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.setWorkerCustomersIds = (req, res, next) => {
  // For Nested Routes
  if (!req.body.worker) req.body.worker = req.params.workerId;
  req.body.customer = req.user.id; // forcing the customer too add his id
  next();
};

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.workerId) filter = { worker: req.params.workerId };
  console.log(filter);

  const reviews = await Review.find(filter).populate('customer', 'name city image');

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      data: reviews,
    },
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  const review = await Review.create(req.body);

  res.status(200).json({
    status: 'success',
    data: {
      data: review,
    },
  });
});

exports.getReview = catchAsync(async (req, res, next) => {
  const filter = { worker: req.params.workerId, _id: req.params.id };

  // Use findOne to search by worker ID and review ID
  const review = await Review.findOne(filter).populate('customer', 'name city');

  if (!review) {
    return next(
      new AppError('No review found with that ID for this worker.', 404),
    );
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: review,
    },
  });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  // Check if workerId is provided in the request
  if (!req.params.workerId) {
    return next(
      new AppError('Worker ID is required to delete the review.', 400),
    );
  }

  // Find the review based on workerId and reviewId
  const review = await Review.findOne({
    worker: req.params.workerId,
    _id: req.params.id,
  });

  if (!review) {
    return next(
      new AppError('No review found with that ID for this worker', 404),
    );
  }

  // Check if the current user is the owner of the review
  if (review.customer.toString() !== req.user.id) {
    return next(
      new AppError('You do not have permission to delete this review', 403),
    );
  }

  // Proceed with deletion if ownership is validated
  await Review.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.updateReview = catchAsync(async (req, res, next) => {
  // Check if workerId is provided in the request
  if (!req.params.workerId) {
    return next(
      new AppError('Worker ID is required to update the review.', 400),
    );
  }

  // Find the review based on workerId and reviewId
  const review = await Review.findOne({
    worker: req.params.workerId,
    _id: req.params.id,
  });

  if (!review) {
    return next(
      new AppError('No review found with that ID for this worker', 404),
    );
  }

  // Check if the current user is the owner of the review
  if (review.customer.toString() !== req.user.id) {
    return next(
      new AppError('You do not have permission to update this review', 403),
    );
  }

  // Proceed with the update if ownership is validated
  const updatedReview = await Review.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).json({
    status: 'success',
    data: {
      data: updatedReview,
    },
  });
});
