const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const Customer = require('./../models/customerModel'); // Import Customer model
const Worker = require('./../models/workerModel'); // Import Worker model
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    password,
    passwordConfirm,
    phoneNumber,
    ratingsAverage,
    ratingsQuantity,
    city,
    role,
    skill, // New field for worker
    yearsOfExperience, // New field for worker
    hourlyRate, // New field for worker
    bio, // New field for worker
  } = req.body;

  // Check if the email already exists in either Worker or Customer collections
  const existingWorker = await Worker.findOne({ email });
  const existingCustomer = await Customer.findOne({ email });

  // Check if the phone number exists in both collections
  const existingWorkerPhone = await Worker.findOne({ phoneNumber });
  const existingCustomerPhone = await Customer.findOne({ phoneNumber });

  if (existingWorker || existingCustomer) {
    return next(new AppError('Email is already in use by another user.', 400));
  }

  if (existingWorkerPhone || existingCustomerPhone) {
    return next(
      new AppError('Phone number is already in use by another user.', 400),
    );
  }

  let newUser;

  if (role === 'worker') {
    newUser = await Worker.create({
      name,
      email,
      password,
      passwordConfirm,
      phoneNumber,
      city,
      ratingsAverage,
      ratingsQuantity,
      skill, // Worker-specific field
      yearsOfExperience, // Worker-specific field
      hourlyRate, // Worker-specific field
      bio, // Worker-specific field
    });
  } else if (role === 'customer') {
    newUser = await Customer.create({
      name,
      email,
      password,
      passwordConfirm,
      phoneNumber,
      city,
      role: 'customer', // Set role to 'customer' explicitly
    });
  } else {
    return next(new AppError('Invalid role specified', 400));
  }

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  let user;

  // Check both Customer and Worker collections
  user = await Customer.findOne({ email }).select('+password');
  if (!user) {
    user = await Worker.findOne({ email }).select('+password');
  }

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user exists in both Customer and Worker models
  let currentUser = await Customer.findById(decoded.id);
  if (!currentUser) {
    currentUser = await Worker.findById(decoded.id);
  }

  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401),
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401),
    );
  }
  console.log(currentUser);
  // Grant access to protected route
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  let user = await Worker.findOne({ email: req.body.email });
  if (!user) {
    user = await Customer.findOne({ email: req.body.email });
  }

  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500,
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // Search for the user in both models (Worker and Customer)
  let user = await Worker.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    // If not found in Worker, check in Customer
    user = await Customer.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
  }
  console.log(user);

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.getMe = (req, res, next) => {
  // Check if the user is a worker or a customer
  if (req.user.role === 'worker') {
    // If the user is a worker, fetch their worker profile
    req.params.workerId = req.user.id;
  } else if (req.user.role === 'customer') {
    // If the user is a customer, fetch their customer profile
    req.params.customerId = req.user.id;
  }
  // Continue to the next middleware or controller
  next();
};

/// Get worker Profile
exports.getWorkerMe = catchAsync(async (req, res, next) => {
  const worker = await Worker.findById(req.user.id); // Using req.user.id from the getMe middleware

  if (!worker) {
    return next(new AppError('No worker found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: worker,
    },
  });
});

// Get Customer Profile
exports.getCustomerMe = catchAsync(async (req, res, next) => {
  const customer = await Customer.findById(req.user.id); // Using req.user.id from the getMe middleware

  if (!customer) {
    return next(new AppError('No customer found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: customer,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs passwords data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMypassword',
        400,
      ),
    );
  }

  // 2) Determine whether the user is a customer or worker and filter allowed fields
  let filteredBody;
  let updatedUser;

  if (req.user.role === 'customer') {
    filteredBody = filterObj(req.body, 'name', 'email'); // Add more fields if necessary
    updatedUser = await Customer.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true,
    });
  } else if (req.user.role === 'worker') {
    filteredBody = filterObj(req.body, 'name', 'email', 'skill', 'hourlyRate'); // Add more fields if necessary
    updatedUser = await Worker.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true,
    });
  } else {
    return next(new AppError('User role is not recognized.', 400));
  }

  // 3) If the user is not found
  if (!updatedUser) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});
