// Vercel serverless function entry point
const app = require('../app');
const { connectDB } = require('../config/database');

// Connect to MongoDB once
let dbConnected = false;

const connectDBOnce = async () => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
      console.log('✅ Database connected for Vercel serverless function');
    } catch (error) {
      console.error('❌ Database connection error:', error);
      // Don't throw, allow function to continue
    }
  }
};

// Initialize DB connection
connectDBOnce().catch(console.error);

module.exports = async (req, res) => {
  // Ensure DB is connected
  if (!dbConnected) {
    await connectDBOnce();
  }
  
  // Handle the request with Express app
  return app(req, res);
};

