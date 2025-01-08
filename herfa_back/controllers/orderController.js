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

  const orders = await Order.find(filter)
    .populate('customer', 'name')
    .populate('worker', 'name');

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
  // 1) Find the order
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }

  // 2) Check if the current user is either the customer or worker of this order
  const isCustomer = order.customer.toString() === req.user.id;
  const isWorker = order.worker.toString() === req.user.id;

  if (!isCustomer && !isWorker) {
    return next(
      new AppError('You are not authorized to update this order', 403),
    );
  }

  // 3) Validate status updates based on user role and current status
  if (req.body.status) {
    // Customer can only cancel pending orders
    if (isCustomer) {
      if (req.body.status !== 'canceled') {
        return next(new AppError('Customers can only cancel orders', 403));
      }
      if (order.status !== 'pending') {
        return next(new AppError('Can only cancel pending orders', 400));
      }
    }

    // Worker can update status to 'in progress' or 'completed'
    if (isWorker) {
      const allowedStatusUpdates = {
        pending: ['in progress'],
        'in progress': ['completed'],
      };

      if (!allowedStatusUpdates[order.status]?.includes(req.body.status)) {
        return next(
          new AppError(
            `Cannot update status from '${order.status}' to '${req.body.status}'`,
            400,
          ),
        );
      }
    }
  }

  // 4) Prevent updating certain fields
  const allowedUpdates = ['status', 'details'];
  const updates = filterObj(req.body, ...allowedUpdates);

  // 5) Update the order
  const updatedOrder = await Order.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      order: updatedOrder,
    },
  });
});

// Helper function to filter allowed fields
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};
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
