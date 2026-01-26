const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadSingle, uploadMultiple, uploadFields, handleUploadError } = require('../middleware/upload');
const { uploadToS3, uploadBase64ToS3, deleteFromS3, isS3Configured } = require('../utils/s3Service');

// All routes are protected
router.use(protect);

// Check S3 configuration
router.get('/check-config', (req, res) => {
  res.status(200).json({
    success: true,
    configured: isS3Configured(),
    message: isS3Configured() 
      ? 'S3 is configured and ready to use' 
      : 'S3 is not configured. Please check your environment variables.',
  });
});

// Upload single file
router.post('/single', uploadSingle('file'), handleUploadError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    // If using memory storage (S3 not configured), upload to S3 manually
    if (!isS3Configured() && req.file.buffer) {
      return res.status(400).json({
        success: false,
        error: 'S3 is not configured. Please configure AWS credentials.',
      });
    }

    // If using S3 storage, file is already uploaded
    const fileUrl = req.file.location || req.file.path;

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: fileUrl,
        key: req.file.key,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Upload multiple files
router.post('/multiple', uploadMultiple('files', 10), handleUploadError, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
      });
    }

    const files = req.files.map((file) => ({
      url: file.location || file.path,
      key: file.key,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    }));

    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      count: files.length,
      data: files,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Upload base64 image
router.post('/base64', async (req, res) => {
  try {
    const { base64, fileName, folder } = req.body;

    if (!base64) {
      return res.status(400).json({
        success: false,
        error: 'Base64 string is required',
      });
    }

    if (!isS3Configured()) {
      return res.status(400).json({
        success: false,
        error: 'S3 is not configured. Please configure AWS credentials.',
      });
    }

    const result = await uploadBase64ToS3(base64, fileName || 'image.jpg', folder || 'images');

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete file from S3
router.delete('/delete', async (req, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'File key or URL is required',
      });
    }

    if (!isS3Configured()) {
      return res.status(400).json({
        success: false,
        error: 'S3 is not configured. Please configure AWS credentials.',
      });
    }

    const result = await deleteFromS3(key);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;

