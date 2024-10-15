const Worker = require('../models/workerModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.getAllWorkers = catchAsync(async (req, res, next) => {
  const workers = await Worker.find();

  res.status(200).json({
    status: 'success',
    results: workers.length,
    data: {
      data: workers,
    },
  });
});

exports.getWorker = catchAsync(async (req, res, next) => {
  const worker = await Worker.findById(req.params.id).populate({
    path: 'reviews',
    populate: {
      path: 'customer',
      select: 'name', 
    },
  });

  res.status(200).json({
    status: 'success',
    data: {
      data: worker,
    },
  });
});

exports.createWorker = catchAsync(async (req, res, next) => {
  const worker = await Worker.create(req.body);

  if (!worker) {
    return next(new AppError('no worker found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: worker,
    },
  });
});

exports.deleteWorker = catchAsync(async (req, res, next) => {
  const worker = await Worker.findByIdAndDelete(req.params.id);

  if (!worker) {
    return next(new AppError('no worker found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: null,
    },
  });
});
