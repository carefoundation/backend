# AWS S3 Setup Guide

This guide will help you set up Amazon S3 for file storage in the Care Foundation Trust application.

## Prerequisites

1. An AWS account
2. AWS IAM user with S3 permissions

## Step 1: Create S3 Bucket

1. Log in to the AWS Console
2. Navigate to S3 service
3. Click "Create bucket"
4. Configure bucket settings:
   - **Bucket name**: Choose a unique name (e.g., `care-foundation-uploads`)
   - **AWS Region**: Choose your preferred region (e.g., `us-east-1`)
   - **Object Ownership**: ACLs enabled (recommended)
   - **Block Public Access**: Uncheck "Block all public access" (or configure bucket policy for specific access)
   - **Bucket Versioning**: Optional (enable if you want version history)
   - **Default encryption**: Enable (recommended)
5. Click "Create bucket"

## Step 2: Configure Bucket Policy

1. Go to your bucket → Permissions tab
2. Scroll to "Bucket policy"
3. Add the following policy (replace `YOUR_BUCKET_NAME` with your actual bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

**Note**: This makes all objects publicly readable. For production, consider using CloudFront or presigned URLs for private files.

## Step 3: Create IAM User

1. Navigate to IAM service in AWS Console
2. Click "Users" → "Create user"
3. Enter username (e.g., `care-foundation-s3-user`)
4. Click "Next"
5. Select "Attach policies directly"
6. Attach policy: `AmazonS3FullAccess` (or create a custom policy with minimal permissions)
7. Click "Next" → "Create user"

## Step 4: Create Access Keys

1. Click on the created user
2. Go to "Security credentials" tab
3. Scroll to "Access keys"
4. Click "Create access key"
5. Select "Application running outside AWS"
6. Click "Next" → "Create access key"
7. **IMPORTANT**: Copy both:
   - Access Key ID
   - Secret Access Key (shown only once - save it securely!)

## Step 5: Configure Environment Variables

Add the following to your `.env` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your_bucket_name_here
```

**Replace:**
- `your_access_key_id_here` with your Access Key ID
- `your_secret_access_key_here` with your Secret Access Key
- `us-east-1` with your bucket's region
- `your_bucket_name_here` with your bucket name

## Step 6: Install Dependencies

Run the following command in your backend directory:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer-s3
```

## Step 7: Test S3 Configuration

1. Start your server
2. Make a GET request to: `http://localhost:5000/api/upload/check-config`
3. You should receive: `{ "success": true, "configured": true }`

## Usage Examples

### Upload Single File

```javascript
// Using multer middleware
const { uploadSingle } = require('./middleware/upload');
router.post('/upload', uploadSingle('file'), (req, res) => {
  const fileUrl = req.file.location; // S3 URL
  res.json({ url: fileUrl });
});
```

### Upload Base64 Image

```javascript
const { uploadBase64ToS3 } = require('./utils/s3Service');

const result = await uploadBase64ToS3(
  base64String,
  'image.jpg',
  'images' // optional folder
);
// result.url contains the S3 URL
```

### Delete File

```javascript
const { deleteFromS3 } = require('./utils/s3Service');

await deleteFromS3('images/abc123-image.jpg');
// or with full URL
await deleteFromS3('https://bucket.s3.region.amazonaws.com/images/abc123-image.jpg');
```

## API Endpoints

- `GET /api/upload/check-config` - Check if S3 is configured
- `POST /api/upload/single` - Upload single file (requires authentication)
- `POST /api/upload/multiple` - Upload multiple files (requires authentication)
- `POST /api/upload/base64` - Upload base64 image (requires authentication)
- `DELETE /api/upload/delete` - Delete file from S3 (requires authentication)

## Security Best Practices

1. **Never commit `.env` file** - Add it to `.gitignore`
2. **Use IAM roles** in production (EC2, Lambda, etc.) instead of access keys
3. **Rotate access keys** regularly
4. **Use bucket policies** to restrict access
5. **Enable CloudFront** for better performance and security
6. **Use presigned URLs** for private file access
7. **Enable S3 bucket logging** for audit trails

## Troubleshooting

### Error: "Access Denied"
- Check IAM user permissions
- Verify bucket policy
- Ensure access keys are correct

### Error: "Bucket does not exist"
- Verify bucket name in `.env`
- Check AWS region matches bucket region

### Error: "Invalid credentials"
- Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in `.env`
- Check if access keys are active in IAM

## Cost Optimization

- Use S3 Intelligent-Tiering for automatic cost optimization
- Set up lifecycle policies to move old files to cheaper storage
- Enable S3 Transfer Acceleration only if needed
- Monitor usage with AWS Cost Explorer

