const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  voucher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['redeem'],
    default: 'redeem'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
