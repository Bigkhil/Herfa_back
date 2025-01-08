const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.ObjectId,
      ref: 'Customer', // Reference to the Customer model
      required: [true, 'An order must belong to a customer.'],
    },
    worker: {
      type: mongoose.Schema.ObjectId,
      ref: 'Worker', // Reference to the Worker model
      required: [true, 'An order must belong to a worker.'],
    },
    service: {
      type: String,
      required: [true, 'A service type is required.'],
    },
    details: {
      type: String,
      required: [true, 'Order details are required.'],
    },
    status: {
      type: String,
      enum: ['pending', 'in progress', 'completed', 'canceled'],
      default: 'pending',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
// orderSchema.index({ worker: 1, customer: 1 }, { unique: true });

// Middleware to update the updatedAt field
orderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
