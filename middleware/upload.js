const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// Memory storage for file processing before S3 upload
const memoryStorage = multer.memoryStorage();

// S3 storage configuration
const s3Storage = multerS3({
  s3: s3Client,
  bucket: BUCKET_NAME,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: function (req, file, cb) {
    const folder = req.body.folder || 'uploads';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = `${folder}/${uniqueSuffix}-${file.originalname}`;
    cb(null, fileName);
  },
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  }
  // Allow PDFs
  else if (file.mimetype === 'application/pdf') {
    cb(null, true);
  }
  // Allow documents
  else if (
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    cb(null, true);
  }
  // Reject other file types
  else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
  }
};

// Check if S3 is configured
const isS3Configured = () => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME &&
    process.env.AWS_REGION
  );
};

// Use S3 storage if configured, otherwise use memory storage
const storage = isS3Configured() ? s3Storage : memoryStorage;

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Single file upload
exports.uploadSingle = (fieldName = 'file') => {
  return upload.single(fieldName);
};

// Multiple files upload
exports.uploadMultiple = (fieldName = 'files', maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

// Multiple fields upload
exports.uploadFields = (fields) => {
  return upload.fields(fields);
};

// Error handler middleware
exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 10MB.',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files uploaded.',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field.',
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
  next();
};

