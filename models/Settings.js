const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  organizationName: {
    type: String,
    default: 'תרבות לכל'
  },
  barcodeExpiryMinutes: {
    type: Number,
    default: 5,
    min: 1,
    max: 60
  },
  totalBudget: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: '₪'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
