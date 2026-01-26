const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// S3 bucket configuration
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const REGION = process.env.AWS_REGION || 'us-east-1';

/**
 * Generate unique file name
 * @param {string} originalName - Original file name
 * @param {string} folder - Folder path in S3 (optional)
 * @returns {string} - Unique file name
 */
const generateFileName = (originalName, folder = '') => {
  const randomName = crypto.randomBytes(16).toString('hex');
  const fileExtension = originalName.split('.').pop();
  const timestamp = Date.now();
  const fileName = `${randomName}-${timestamp}.${fileExtension}`;
  return folder ? `${folder}/${fileName}` : fileName;
};

/**
 * Upload file to S3
 * @param {Buffer|Stream} fileBuffer - File buffer or stream
 * @param {string} originalName - Original file name
 * @param {string} mimeType - File MIME type
 * @param {string} folder - Folder path in S3 (optional)
 * @returns {Promise<Object>} - Upload result with URL and key
 */
exports.uploadToS3 = async (fileBuffer, originalName, mimeType, folder = '') => {
  try {
    if (!BUCKET_NAME) {
      throw new Error('AWS_S3_BUCKET_NAME is not configured');
    }

    const fileName = generateFileName(originalName, folder);
    const key = fileName;

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: 'public-read', // Make file publicly accessible
    };

    // Add cache control for images
    if (mimeType.startsWith('image/')) {
      uploadParams.CacheControl = 'max-age=31536000'; // 1 year
    }

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Generate public URL
    const fileUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;

    return {
      success: true,
      url: fileUrl,
      key: key,
      bucket: BUCKET_NAME,
      region: REGION,
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

/**
 * Upload base64 image to S3
 * @param {string} base64String - Base64 encoded image string
 * @param {string} originalName - Original file name
 * @param {string} folder - Folder path in S3 (optional)
 * @returns {Promise<Object>} - Upload result with URL and key
 */
exports.uploadBase64ToS3 = async (base64String, originalName, folder = '') => {
  try {
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Determine MIME type from base64 string or default to jpeg
    let mimeType = 'image/jpeg';
    if (base64String.startsWith('data:image/png')) {
      mimeType = 'image/png';
    } else if (base64String.startsWith('data:image/gif')) {
      mimeType = 'image/gif';
    } else if (base64String.startsWith('data:image/webp')) {
      mimeType = 'image/webp';
    }

    // Update file extension based on MIME type
    const extension = mimeType.split('/')[1];
    const fileName = originalName || `image.${extension}`;

    return await exports.uploadToS3(buffer, fileName, mimeType, folder);
  } catch (error) {
    console.error('Error uploading base64 to S3:', error);
    throw new Error(`Failed to upload base64 image to S3: ${error.message}`);
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<Object>} - Delete result
 */
exports.deleteFromS3 = async (key) => {
  try {
    if (!BUCKET_NAME) {
      throw new Error('AWS_S3_BUCKET_NAME is not configured');
    }

    // Extract key from URL if full URL is provided
    let objectKey = key;
    if (key.includes('amazonaws.com/')) {
      objectKey = key.split('amazonaws.com/')[1];
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
    });

    await s3Client.send(command);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};

/**
 * Get presigned URL for private file access (expires in 1 hour by default)
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
 * @returns {Promise<string>} - Presigned URL
 */
exports.getPresignedUrl = async (key, expiresIn = 3600) => {
  try {
    if (!BUCKET_NAME) {
      throw new Error('AWS_S3_BUCKET_NAME is not configured');
    }

    // Extract key from URL if full URL is provided
    let objectKey = key;
    if (key.includes('amazonaws.com/')) {
      objectKey = key.split('amazonaws.com/')[1];
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
};

/**
 * Upload multiple files to S3
 * @param {Array} files - Array of file objects with buffer, originalName, mimeType
 * @param {string} folder - Folder path in S3 (optional)
 * @returns {Promise<Array>} - Array of upload results
 */
exports.uploadMultipleToS3 = async (files, folder = '') => {
  try {
    const uploadPromises = files.map((file) =>
      exports.uploadToS3(file.buffer, file.originalName, file.mimeType, folder)
    );

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading multiple files to S3:', error);
    throw new Error(`Failed to upload files to S3: ${error.message}`);
  }
};

/**
 * Check if S3 is configured
 * @returns {boolean} - True if S3 is configured
 */
exports.isS3Configured = () => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME &&
    process.env.AWS_REGION
  );
};

