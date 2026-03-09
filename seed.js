require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Voucher = require('./models/Voucher');
const Settings = require('./models/Settings');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Voucher.deleteMany({});
    await Settings.deleteMany({});

    const admin = await User.create({
      name: 'תרבות לכל',
      email: 'admin@tarbut.co.il',
      password: process.env.SEED_ADMIN_PASSWORD,
      role: 'admin',
      phone: '03-1234567'
    });

    const student = await User.create({
      name: 'יוסי כהן',
      email: 'student@test.co.il',
      password: process.env.SEED_STUDENT_PASSWORD,
      role: 'student',
      studentId: 'STU-001',
      phone: '050-1234567'
    });

    const student2 = await User.create({
      name: 'דנה לוי',
      email: 'dana@test.co.il',
      password: process.env.SEED_STUDENT_PASSWORD,
      role: 'student',
      studentId: 'STU-002',
      phone: '052-7654321'
    });

    const business = await User.create({
      name: 'מוסא',
      email: 'musa@test.co.il',
      password: process.env.SEED_BUSINESS_PASSWORD,
      role: 'business',
      businessName: 'מוסא פיתה שוק',
      phone: '04-9876543'
    });

    console.log('Users created');

    const voucherData = [
      { code: 'SHV-A1B2C3D4', amount: 50, description: 'שובר תרבות - הצגה', assignedTo: student._id, status: 'assigned', createdBy: admin._id, expiryDate: new Date('2026-06-30') },
      { code: 'SHV-E5F6G7H8', amount: 100, description: 'שובר תרבות - קונצרט', assignedTo: student._id, status: 'assigned', createdBy: admin._id, expiryDate: new Date('2026-06-30') },
      { code: 'SHV-I9J0K1L2', amount: 75, description: 'שובר תרבות - סרט', assignedTo: student2._id, status: 'assigned', createdBy: admin._id, expiryDate: new Date('2026-06-30') },
      { code: 'SHV-M3N4O5P6', amount: 50, description: 'שובר תרבות - מוזיאון', status: 'available', createdBy: admin._id, expiryDate: new Date('2026-06-30') },
      { code: 'SHV-Q7R8S9T0', amount: 120, description: 'שובר תרבות - פסטיבל', status: 'available', createdBy: admin._id, expiryDate: new Date('2026-06-30') },
      { code: 'SHV-U1V2W3X4', amount: 80, description: 'שובר תרבות - תיאטרון', assignedTo: student._id, status: 'redeemed', redeemedBy: business._id, redeemedAt: new Date('2026-02-15'), createdBy: admin._id, expiryDate: new Date('2026-06-30') },
    ];
    for (const v of voucherData) {
      await Voucher.create(v);
    }

    console.log('Vouchers created');

    await Settings.create({
      organizationName: 'תרבות לכל',
      barcodeExpiryMinutes: 5,
      totalBudget: 10000
    });

    console.log('Settings created');
    console.log('\nSeed completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seed();
