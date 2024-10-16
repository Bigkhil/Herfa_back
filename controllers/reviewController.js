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

  const reviews = await Review.find(filter);

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
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('No review found with that ID.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: review,
    },
  });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  // Find the review first to check ownership
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('No review found with that ID', 404));
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
  // Find the review first to check ownership
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('No review found with that ID', 404));
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
