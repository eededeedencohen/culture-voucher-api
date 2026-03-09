const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getSettings, updateSettings } = require('../controllers/settingsController');

router.get('/', protect, getSettings);
router.put('/', protect, authorize('admin'), updateSettings);

module.exports = router;
