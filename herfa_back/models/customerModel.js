const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/appError');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  role: {
    type: String,
    enum: ['customer', 'worker', 'admin'], // Added 'admin' here
    default: 'customer', // Default role for customers
  },
  image: { 
    type:String,
    default:'default.png'
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  city: {
    type: String,
    trim:true,
    required: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //This only works only on SAVE and CREATE !!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

customerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12); // .hash() is sync function so we used async, await

  this.passwordConfirm = undefined;
  next();
});

customerSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  this.passwordChangedAt = Date.now() - 1000;
});

customerSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

customerSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return JWTTimeStamp < changedTimeStamp; // 9:00 < 11:00
  }

  //False means NOT Changed
  return false;
};

customerSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
