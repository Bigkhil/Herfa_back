const Worker = require('../models/workerModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.getAllWorkers = catchAsync(async (req, res, next) => {
  const workers = await Worker.find();

  res.status(200).json({
    satus: 'Sucess',
    results: workers.length,
    data: {
      data: workers,
    },
  });
});

exports.getWorker = catchAsync(async (req, res, next) => {
  const worker = await Worker.findById(req.parmas);

  res.status(200).json({
    satus: 'Sucess',
    data: {
      data: worker,
    },
  });
});
