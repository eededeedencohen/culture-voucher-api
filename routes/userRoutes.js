const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getStudents, getBusinesses } = require('../controllers/userController');

router.get('/students', protect, authorize('admin'), getStudents);
router.get('/businesses', protect, authorize('admin'), getBusinesses);

module.exports = router;
