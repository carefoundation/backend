const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carefoundation';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`   ✅ MongoDB: CONNECTED`);
    console.log(`      🖥️  Host: ${conn.connection.host}`);
    console.log(`      📊 Database: ${conn.connection.name}`);
    console.log(`      🔌 State: ${conn.connection.readyState === 1 ? 'Ready' : 'Connecting'}`);
    return true;
  } catch (error) {
    console.log(`   ❌ MongoDB: CONNECTION FAILED`);
    console.log(`      Error: ${error.message}`);
    console.log(`      URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
    throw error;
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

module.exports = { mongoose, connectDB };
