const User = require('../models/User');
const Voucher = require('../models/Voucher');

// GET /api/users/students
const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').sort('name');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users/businesses
const getBusinesses = async (req, res) => {
  try {
    const businesses = await User.find({ role: 'business' }).select('-password').sort('name');
    res.json(businesses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users/students/:id/vouchers - Get all vouchers for a student (admin)
const getStudentVouchers = async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-password');
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'סטודנט לא נמצא' });
    }

    const vouchers = await Voucher.find({ assignedTo: req.params.id })
      .populate('redeemedBy', 'name businessName')
      .sort('-createdAt');

    res.json({ student, vouchers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/users/profile - Update own profile (all users)
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    const { name, currentPassword, newPassword } = req.body;

    if (name) {
      user.name = name;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'יש להזין סיסמה נוכחית' });
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'סיסמה נוכחית שגויה' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'סיסמה חדשה חייבת להכיל לפחות 6 תווים' });
      }
      user.password = newPassword;
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      businessName: user.businessName,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStudents, getBusinesses, getStudentVouchers, updateProfile };
