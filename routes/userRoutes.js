const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getStudents, getBusinesses, getStudentVouchers, updateProfile } = require('../controllers/userController');

router.put('/profile', protect, updateProfile);
router.get('/students', protect, authorize('admin'), getStudents);
router.get('/students/:id/vouchers', protect, authorize('admin'), getStudentVouchers);
router.get('/businesses', protect, authorize('admin'), getBusinesses);

module.exports = router;
