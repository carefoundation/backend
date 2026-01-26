const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    console.log('\n   🔄 Connecting to MongoDB Atlas...');
    console.log(`      URI: ${MONGODB_URI ? MONGODB_URI.replace(/\/\/.*@/, '//***:***@') : 'Not set'}`);
    
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`   ✅ MongoDB Atlas: CONNECTED`);
    console.log(`      🖥️  Host: ${conn.connection.host}`);
    console.log(`      📊 Database: ${conn.connection.name}`);
    console.log(`      🔌 State: ${conn.connection.readyState === 1 ? 'Ready' : 'Connecting'}`);
    console.log(`      🌐 Connection String: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
    return true;
  } catch (error) {
    console.log(`   ❌ MongoDB Atlas: CONNECTION FAILED`);
    console.log(`      Error: ${error.message}`);
    console.log(`      URI: ${MONGODB_URI ? MONGODB_URI.replace(/\/\/.*@/, '//***:***@') : 'MONGODB_URI not set'}`);
    throw error;
  }
};

mongoose.connection.on('connecting', () => {
  console.log('   🔄 MongoDB: Connecting...');
});

mongoose.connection.on('connected', () => {
  console.log('   ✅ MongoDB: Connected successfully');
});

mongoose.connection.on('disconnected', () => {
  console.log('   ⚠️  MongoDB: Disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('   ❌ MongoDB: Connection error:', err.message);
});

mongoose.connection.on('reconnected', () => {
  console.log('   ✅ MongoDB: Reconnected');
});

module.exports = { mongoose, connectDB };
