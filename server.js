const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  // listting to event
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' }); //requring the config.env file
const app = require('./app');

// console.log(process.env);

// database connection

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    // return a promise
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connetion successful!');
  });

// server

const port = process.env.PORT || 3000;
const server = https.createServer(sslOptions, app).listen(443, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  // listting to event
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
