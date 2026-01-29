const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carefoundation';

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const adminEmail = 'adminaziz@care.com';
    const adminPassword = 'admin123';

    // Check if super admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️  Super admin user already exists, updating...');
      existingAdmin.name = 'Super Admin Aziz';
      existingAdmin.mobileNumber = '9999999999';
      existingAdmin.password = adminPassword;
      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      existingAdmin.isVerified = true;
      existingAdmin.isApproved = true;
      // Give all permissions to super admin
      existingAdmin.permissions = [
        'manage_campaigns',
        'manage_events',
        'manage_blogs',
        'manage_celebrities',
        'manage_partners',
        'manage_users',
        'manage_donations',
        'manage_volunteers',
        'manage_fundraisers',
        'view_reports',
        'manage_products',
        'manage_coupons',
        'manage_queries',
        'manage_form_submissions',
      ];
      await existingAdmin.save();
      console.log('✅ Super admin user updated');
    } else {
      // Create super admin user
      const superAdmin = await User.create({
        name: 'Super Admin Aziz',
        mobileNumber: '9999999999',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isActive: true,
        isVerified: true,
        isApproved: true,
        // Give all permissions to super admin
        permissions: [
          'manage_campaigns',
          'manage_events',
          'manage_blogs',
          'manage_celebrities',
          'manage_partners',
          'manage_users',
          'manage_donations',
          'manage_volunteers',
          'manage_fundraisers',
          'view_reports',
          'manage_products',
          'manage_coupons',
          'manage_queries',
          'manage_form_submissions',
        ],
      });
      console.log('✅ Super admin user created:', superAdmin.email);
    }

    console.log('\n📝 Super Admin Credentials:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('\n✅ Super admin creation completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();

