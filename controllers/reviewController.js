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
  const review = await Review.findByIdAndDelete(req.params.id);

  if (!review) {
    return next(new AppError('No review found with that ID.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: null,
    },
  });
});

exports.updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!review) {
    return next(new AppError('no review found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: review,
    },
  });
});
