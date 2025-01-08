const mongoose = require('mongoose');
const Worker = require('./workerModel');
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    customer: {
      type: mongoose.Schema.ObjectId,
      ref: 'Customer',
      required: [true, 'Review must belong to a customer.'],
    },
    worker: {
      type: mongoose.Schema.ObjectId,
      ref: 'Worker',
      required: [true, 'Review must belong to a worker.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index({ worker: 1, customer: 1 }, { unique: true });

reviewSchema.statics.calcAverageRatings = async function (workerId) {
  const stats = await this.aggregate([
    {
      $match: { worker: workerId },
    },
    {
      $group: {
        _id: '$worker',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);

  if (stats.length > 0) {
    await Worker.findByIdAndUpdate(workerId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Worker.findByIdAndUpdate(workerId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// Calc ReviewAvg and quantitiy After Making new one
reviewSchema.post('save', function () {
  // this points to current review
  this.constructor.calcAverageRatings(this.worker);
});

// EASIEST Soluction for the above ( delete and update reviews)
reviewSchema.post(/^findOneAnd/, async function (doc) {
  await doc.constructor.calcAverageRatings(doc.worker);
});


const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
