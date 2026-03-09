const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createVoucher, assignVoucher, getVouchers,
  generateBarcode, scanBarcode, redeemVoucher, getStats, getRedemptionHistory
} = require('../controllers/voucherController');

router.get('/stats', protect, authorize('admin'), getStats);
router.get('/history', protect, authorize('business'), getRedemptionHistory);
router.post('/scan', protect, authorize('business'), scanBarcode);
router.get('/', protect, getVouchers);
router.post('/', protect, authorize('admin'), createVoucher);
router.post('/:id/assign', protect, authorize('admin'), assignVoucher);
router.post('/:id/generate-barcode', protect, authorize('student'), generateBarcode);
router.post('/:id/redeem', protect, authorize('business'), redeemVoucher);

module.exports = router;
