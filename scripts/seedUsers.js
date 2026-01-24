const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carefoundation';

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@care.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists, updating...');
      existingAdmin.name = 'Admin User';
      existingAdmin.mobileNumber = '9999999999';
      existingAdmin.password = 'admin123';
      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      existingAdmin.isVerified = true;
      await existingAdmin.save();
      console.log('✅ Admin user updated');
    } else {
      // Create admin user
      const admin = await User.create({
        name: 'Admin User',
        mobileNumber: '9999999999',
        email: 'admin@care.com',
        password: 'admin123',
        role: 'admin',
        isActive: true,
        isVerified: true,
      });
      console.log('✅ Admin user created:', admin.email);
    }

    // Check if regular user already exists
    const existingUser = await User.findOne({ email: 'user@gmail.com' });
    if (existingUser) {
      console.log('⚠️  Regular user already exists, updating...');
      existingUser.name = 'Test User';
      existingUser.mobileNumber = '8888888888';
      existingUser.password = 'user123';
      existingUser.role = 'donor';
      existingUser.isActive = true;
      existingUser.isVerified = true;
      await existingUser.save();
      console.log('✅ Regular user updated');
    } else {
      // Create regular user
      const user = await User.create({
        name: 'Test User',
        mobileNumber: '8888888888',
        email: 'user@gmail.com',
        password: 'user123',
        role: 'donor',
        isActive: true,
        isVerified: true,
      });
      console.log('✅ Regular user created:', user.email);
    }

    console.log('\n📝 Login Credentials:');
    console.log('Admin: admin@care.com / admin123');
    console.log('User: user@gmail.com / user123');
    console.log('\n✅ Seed completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();

