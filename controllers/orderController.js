const Order = require('../models/orderModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Get all orders
exports.getAllOrders = catchAsync(async (req, res, next) => {
  let filter = {};

  // If a worker is logged in, show only the orders assigned to them
  if (req.user.role === 'worker') {
    filter.worker = req.user.id;
  }

  // If a customer is logged in, show only the orders submitted by them
  if (req.user.role === 'customer') {
    filter.customer = req.user.id;
  }

  const orders = await Order.find(filter);

  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: {
      orders,
    },
  });
});

// Create a new order
// Order Controller

exports.createOrder = catchAsync(async (req, res, next) => {
  // Make sure only customers can create an order
  if (req.user.role !== 'customer') {
    return next(new AppError('Only customers can create orders', 403));
  }

  // Create a new order with the customer ID from req.user and worker ID from req.params
  const newOrder = await Order.create({
    customer: req.user.id,
    worker: req.params.workerId, // Assuming the worker's ID is passed in the route
    ...req.body, // Include any additional details like order description, etc.
  });

  res.status(201).json({
    status: 'success',
    data: {
      order: newOrder,
    },
  });
});

// Get a specific order by ID
exports.getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name email') // Populate customer details (optional)
    .populate('worker', 'name email'); // Populate worker details (optional)

  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      order,
    },
  });
});

// Update an existing order
exports.updateOrder = catchAsync(async (req, res, next) => {
  const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedOrder) {
    return next(new AppError('No order found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      order: updatedOrder,
    },
  });
});

// Delete an order
exports.deleteOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findByIdAndDelete(req.params.id);

  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
