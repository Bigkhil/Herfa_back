const multer = require('multer');
const path = require('path');

// Set storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `${__dirname}/../public/uploads`); // Directory to store images
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user-${Date.now()}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image.'), false);
  }
};

// Multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 2 }, // Limit: 2MB
});

module.exports = upload;
