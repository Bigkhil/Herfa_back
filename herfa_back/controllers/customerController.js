const Customer = require('../models/customerModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.getAllCustomers = catchAsync(async (req, res, next) => {
  const customers = await Customer.find();

  res.status(200).json({
    status: 'success',
    results: customers.length,
    data: {
      data: customers,
    },
  });
});

exports.getCustomer = catchAsync(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);
  console.log(customer);
  if (!customer) {
    return next(new AppError('no customer found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: customer,
    },
  });
});

exports.createCustomer = catchAsync(async (req, res, next) => {
  const customer = await Customer.create(req.body);

  res.status(200).json({
    status: 'success',
    data: {
      data: customer,
    },
  });
});

exports.deleteCustomer = catchAsync(async (req, res, next) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);

  if (!customer) {
    return next(new AppError('no customer found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: null,
    },
  });
});
// {{url}}api/v1/workers/670dfd81ab2ae955b71d0c05/reviews/670df42735efac34eaeedaea
