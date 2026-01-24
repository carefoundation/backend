const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carefoundation';

const connectDB = async () => {
  try {
    console.log(`Attempting to connect to MongoDB...`);
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Unable to connect to MongoDB:');
    console.error('Error:', error.message || error);
    console.error('\nPlease check:');
    console.error('  1. MongoDB is running locally');
    console.error('  2. MongoDB connection string is correct');
    console.error('  3. Connection settings in .env file (MONGODB_URI)');
    console.error('\nTo start MongoDB locally:');
    console.error('  - Windows: mongod');
    console.error('  - Mac/Linux: sudo systemctl start mongod');
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

module.exports = { mongoose, connectDB };
