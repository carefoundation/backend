const app = require('./app');
const { connectDB } = require('./config/database');
const { isS3Configured } = require('./utils/s3Service');
const { testEmailConnection } = require('./utils/emailService');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Function to check S3 configuration
const checkS3Connection = async () => {
  try {
    const isConfigured = isS3Configured();
    if (isConfigured) {
      console.log('   ✅ AWS S3: CONFIGURED');
      console.log(`      📦 Bucket: ${process.env.AWS_S3_BUCKET_NAME}`);
      console.log(`      🌍 Region: ${process.env.AWS_REGION || 'us-east-1'}`);
      console.log(`      🔑 Access Key: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 8)}...`);
    } else {
      console.log('   ⚠️  AWS S3: NOT CONFIGURED');
      console.log('      Missing environment variables:');
      if (!process.env.AWS_ACCESS_KEY_ID) console.log('         - AWS_ACCESS_KEY_ID');
      if (!process.env.AWS_SECRET_ACCESS_KEY) console.log('         - AWS_SECRET_ACCESS_KEY');
      if (!process.env.AWS_S3_BUCKET_NAME) console.log('         - AWS_S3_BUCKET_NAME');
      if (!process.env.AWS_REGION) console.log('         - AWS_REGION (optional, default: us-east-1)');
    }
    return isConfigured;
  } catch (error) {
    console.log('   ❌ AWS S3: ERROR CHECKING CONFIGURATION');
    console.log(`      Error: ${error.message}`);
    return false;
  }
};

// Function to check Email service
const checkEmailService = async () => {
  try {
    const result = await testEmailConnection();
    if (result.success) {
      console.log('   ✅ Email Service: CONNECTED');
      console.log(`      📧 SMTP Host: ${process.env.SMTP_HOST || process.env.EMAIL_USER ? 'Configured' : 'Not set'}`);
      console.log(`      📮 From: ${process.env.SMTP_USER || process.env.EMAIL_USER || 'Not set'}`);
    } else {
      console.log('   ⚠️  Email Service: NOT CONFIGURED');
      console.log(`      ${result.message || 'SMTP credentials missing'}`);
      if (!process.env.SMTP_USER && !process.env.EMAIL_USER) {
        console.log('      Missing: SMTP_USER or EMAIL_USER');
      }
      if (!process.env.SMTP_PASS && !process.env.EMAIL_PASS) {
        console.log('      Missing: SMTP_PASS or EMAIL_PASS');
      }
    }
    return result.success;
  } catch (error) {
    console.log('   ❌ Email Service: ERROR');
    console.log(`      Error: ${error.message}`);
    return false;
  }
};

// Function to check environment variables
const checkEnvironmentVariables = () => {
  console.log('\n📋 Environment Variables Check:');
  console.log('   ──────────────────────────────────────');
  
  const requiredVars = {
    'MONGODB_URI': process.env.MONGODB_URI,
    'JWT_SECRET': process.env.JWT_SECRET,
  };

  const optionalVars = {
    'RAZORPAY_KEY_ID': process.env.RAZORPAY_KEY_ID,
    'RAZORPAY_KEY_SECRET': process.env.RAZORPAY_KEY_SECRET,
    'SMTP_HOST': process.env.SMTP_HOST,
    'SMTP_USER': process.env.SMTP_USER || process.env.EMAIL_USER,
    'SMTP_PASS': process.env.SMTP_PASS || process.env.EMAIL_PASS,
    'AWS_ACCESS_KEY_ID': process.env.AWS_ACCESS_KEY_ID,
    'AWS_SECRET_ACCESS_KEY': process.env.AWS_SECRET_ACCESS_KEY,
    'AWS_S3_BUCKET_NAME': process.env.AWS_S3_BUCKET_NAME,
    'AWS_REGION': process.env.AWS_REGION,
  };

  // Check required variables
  let allRequiredPresent = true;
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (value) {
      console.log(`   ✅ ${key}: Set`);
    } else {
      console.log(`   ❌ ${key}: MISSING (Required)`);
      allRequiredPresent = false;
    }
  });

  // Check optional variables
  console.log('\n   Optional Variables:');
  Object.entries(optionalVars).forEach(([key, value]) => {
    if (value) {
      const displayValue = key.includes('SECRET') || key.includes('PASS') || key.includes('KEY')
        ? `${value.substring(0, 8)}...` : value;
      console.log(`   ✅ ${key}: ${displayValue}`);
    } else {
      console.log(`   ⚠️  ${key}: Not set (Optional)`);
    }
  });

  return allRequiredPresent;
};

// Main server startup function
const startServer = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Care Foundation Trust - Backend Server Starting...');
  console.log('='.repeat(60));
  
  console.log(`\n🌐 Environment: ${NODE_ENV.toUpperCase()}`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);

  // Check environment variables
  const envCheck = checkEnvironmentVariables();

  if (!envCheck) {
    console.log('\n⚠️  WARNING: Some required environment variables are missing!');
    console.log('   Server may not function properly.');
  }

  // Check connections
  console.log('\n🔌 Connection Status:');
  console.log('   ──────────────────────────────────────');

  // Check MongoDB
  let dbConnected = false;
  try {
    await connectDB();
    dbConnected = true;
  } catch (error) {
    console.log('   ❌ MongoDB: CONNECTION FAILED');
    console.log(`      Error: ${error.message}`);
  }

  // Check S3
  const s3Configured = await checkS3Connection();

  // Check Email Service
  const emailConfigured = await checkEmailService();

  // Summary
  console.log('\n📊 Connection Summary:');
  console.log('   ──────────────────────────────────────');
  console.log(`   ${dbConnected ? '✅' : '❌'} MongoDB: ${dbConnected ? 'CONNECTED' : 'DISCONNECTED'}`);
  console.log(`   ${s3Configured ? '✅' : '⚠️ '} AWS S3: ${s3Configured ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
  console.log(`   ${emailConfigured ? '✅' : '⚠️ '} Email Service: ${emailConfigured ? 'CONNECTED' : 'NOT CONFIGURED'}`);

  // Start server
  if (dbConnected) {
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('✅ SERVER STARTED SUCCESSFULLY!');
      console.log('='.repeat(60));
      console.log(`\n🌐 Server running on: http://localhost:${PORT}`);
      console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
      console.log(`\n💡 Tips:`);
      if (!s3Configured) {
        console.log('   - Configure AWS S3 for file uploads');
      }
      if (!emailConfigured) {
        console.log('   - Configure SMTP for email notifications');
      }
      console.log(`\n⏹️  Press Ctrl+C to stop the server\n`);
    });
  } else {
    console.log('\n❌ SERVER STARTUP FAILED!');
    console.log('   MongoDB connection is required. Please fix the connection and try again.');
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('\n❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error:', err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('\n❌ UNHANDLED REJECTION! Shutting down...');
  console.error('Error:', err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();

