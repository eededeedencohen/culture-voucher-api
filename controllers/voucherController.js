const crypto = require('crypto');
const Voucher = require('../models/Voucher');
const User = require('../models/User');
const Settings = require('../models/Settings');
const Transaction = require('../models/Transaction');
const { getIO } = require('../socket');

// POST /api/vouchers - Create voucher (admin)
const createVoucher = async (req, res) => {
  try {
    const { amount, description, expiryDate, count = 1 } = req.body;
    const vouchers = [];

    for (let i = 0; i < count; i++) {
      const code = 'SHV-' + crypto.randomBytes(4).toString('hex').toUpperCase();
      const voucher = await Voucher.create({
        code,
        amount,
        description,
        expiryDate,
        createdBy: req.user._id
      });
      vouchers.push(voucher);
    }

    res.status(201).json(vouchers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/vouchers/:id/assign - Assign voucher to student (admin)
const assignVoucher = async (req, res) => {
  try {
    const { studentId } = req.body;
    const voucher = await Voucher.findById(req.params.id);

    if (!voucher) {
      return res.status(404).json({ message: 'שובר לא נמצא' });
    }
    if (voucher.status !== 'available') {
      return res.status(400).json({ message: 'שובר לא זמין להקצאה' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'סטודנט לא נמצא' });
    }

    voucher.assignedTo = studentId;
    voucher.status = 'assigned';
    await voucher.save();

    res.json(voucher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/vouchers - Get all vouchers (admin) or my vouchers (student)
const getVouchers = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      query.assignedTo = req.user._id;

      // Fix stuck vouchers: reset expired pending_redeem back to assigned
      await Voucher.updateMany(
        {
          assignedTo: req.user._id,
          status: 'pending_redeem',
          'activeBarcode.expiresAt': { $lt: new Date() }
        },
        {
          $set: {
            status: 'assigned',
            'activeBarcode.code': null,
            'activeBarcode.expiresAt': null
          }
        }
      );
    }

    const vouchers = await Voucher.find(query)
      .populate('assignedTo', 'name email studentId')
      .populate('redeemedBy', 'name businessName')
      .sort('-createdAt');

    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/vouchers/:id/generate-barcode - Generate time-limited barcode (student)
const generateBarcode = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);

    if (!voucher) {
      return res.status(404).json({ message: 'שובר לא נמצא' });
    }
    if (voucher.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'שובר לא שייך לך' });
    }

    // Fix: allow re-generating barcode for expired pending_redeem
    if (voucher.status === 'pending_redeem') {
      if (voucher.activeBarcode.expiresAt && new Date() > new Date(voucher.activeBarcode.expiresAt)) {
        voucher.status = 'assigned';
        voucher.activeBarcode = { code: null, expiresAt: null };
      } else {
        return res.status(400).json({ message: 'כבר יש ברקוד פעיל לשובר זה' });
      }
    }

    if (voucher.status !== 'assigned') {
      return res.status(400).json({ message: 'שובר לא זמין למימוש' });
    }

    const settings = await Settings.findOne() || { barcodeExpiryMinutes: 5 };
    const barcodeData = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + settings.barcodeExpiryMinutes * 60 * 1000);

    voucher.activeBarcode = { code: barcodeData, expiresAt };
    voucher.status = 'pending_redeem';
    await voucher.save();

    res.json({
      barcode: barcodeData,
      expiresAt,
      expiryMinutes: settings.barcodeExpiryMinutes,
      voucherId: voucher._id,
      amount: voucher.amount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/vouchers/scan - Scan barcode (business)
const scanBarcode = async (req, res) => {
  try {
    const { barcode } = req.body;

    const voucher = await Voucher.findOne({ 'activeBarcode.code': barcode })
      .populate('assignedTo', 'name studentId');

    if (!voucher) {
      return res.status(404).json({ message: 'ברקוד לא נמצא', valid: false });
    }

    if (new Date() > new Date(voucher.activeBarcode.expiresAt)) {
      voucher.activeBarcode = { code: null, expiresAt: null };
      voucher.status = 'assigned';
      await voucher.save();
      return res.status(400).json({ message: 'ברקוד פג תוקף', valid: false });
    }

    // Notify student that their barcode was scanned
    try {
      getIO().to(voucher.assignedTo._id.toString()).emit('voucher:scanned', {
        voucherId: voucher._id,
        amount: voucher.amount,
        businessName: req.user.businessName || req.user.name
      });
    } catch (e) {}

    res.json({
      valid: true,
      voucherId: voucher._id,
      amount: voucher.amount,
      description: voucher.description,
      studentName: voucher.assignedTo?.name,
      expiresAt: voucher.activeBarcode.expiresAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/vouchers/:id/redeem - Confirm redemption (business)
const redeemVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);

    if (!voucher) {
      return res.status(404).json({ message: 'שובר לא נמצא' });
    }
    if (voucher.status !== 'pending_redeem') {
      return res.status(400).json({ message: 'שובר לא ממתין למימוש' });
    }
    if (!voucher.activeBarcode.expiresAt || new Date() > new Date(voucher.activeBarcode.expiresAt)) {
      voucher.activeBarcode = { code: null, expiresAt: null };
      voucher.status = 'assigned';
      await voucher.save();
      return res.status(400).json({ message: 'ברקוד פג תוקף' });
    }

    voucher.status = 'redeemed';
    voucher.redeemedBy = req.user._id;
    voucher.redeemedAt = new Date();
    voucher.activeBarcode = { code: null, expiresAt: null };
    await voucher.save();

    await Transaction.create({
      voucher: voucher._id,
      student: voucher.assignedTo,
      business: req.user._id,
      amount: voucher.amount
    });

    // Notify student that voucher was redeemed
    try {
      getIO().to(voucher.assignedTo.toString()).emit('voucher:redeemed', {
        voucherId: voucher._id,
        amount: voucher.amount,
        businessName: req.user.businessName || req.user.name
      });
    } catch (e) {}

    res.json({ message: 'שובר מומש בהצלחה!', voucher });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/vouchers/stats - Get statistics (admin)
const getStats = async (req, res) => {
  try {
    const total = await Voucher.countDocuments();
    const available = await Voucher.countDocuments({ status: 'available' });
    const assigned = await Voucher.countDocuments({ status: 'assigned' });
    const pendingRedeem = await Voucher.countDocuments({ status: 'pending_redeem' });
    const redeemed = await Voucher.countDocuments({ status: 'redeemed' });

    const totalAmountResult = await Voucher.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const redeemedAmountResult = await Voucher.aggregate([
      { $match: { status: 'redeemed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalAmount = totalAmountResult[0]?.total || 0;
    const redeemedAmount = redeemedAmountResult[0]?.total || 0;
    const remainingBudget = totalAmount - redeemedAmount;

    res.json({
      total,
      available,
      assigned,
      pendingRedeem,
      redeemed,
      totalAmount,
      redeemedAmount,
      remainingBudget
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/vouchers/history - Get redemption history (business)
const getRedemptionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ business: req.user._id })
      .populate('voucher', 'code amount description')
      .populate('student', 'name email studentId')
      .sort('-createdAt');

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createVoucher, assignVoucher, getVouchers,
  generateBarcode, scanBarcode, redeemVoucher, getStats, getRedemptionHistory
};
