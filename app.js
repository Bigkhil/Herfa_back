const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorhandler = require('./controllers/errorController');
const customerRouter = require('./routes/customerRoutes');
const workerRouter = require('./routes/workerRoutes');
const authRouter = require('./routes/authRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const orderRouter = require('./routes/orderRoutes');

const app = express();

//1) GLOBAL MIDDLEWARES
// i want to add puplic as my html & css landing page in my server
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  cors({
    origin: '*', // Allow your front-end origin
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], // Allow specific methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow headers
  }),
);

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
console.log(__dirname);

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//Set Security - HTTP Headers
app.use(helmet());

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // this is called logger
}

// Limit request from same IP
//const limiter = rateLimit({
//  max: 500,
//  windowMs: 60 * 60 * 1000, // 1 hour
//  message: 'Too many requests from this IP, Please try again in an hour!',
//});

//app.use('/api', limiter);

//Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // middleware

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
// app.use(
//   hpp({
//     whitelist: [
//       'duration',
//       'ratingsQuantity',
//       'ratingsAverage',
//       'maxGroupSize',
//       'difficulty',
//       'price',
//     ],
//   }),
// );

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

//3) Routes
app.get('/', (req, res) => {
  res.status(200).render('base', {
    title: 'My Landing Page',
    message: 'Welcome to the best Express app!',
  });
});

app.use('/api/v1/customers', customerRouter);
app.use('/api/v1/workers', workerRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/orders', orderRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });

  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorhandler);

module.exports = app;
