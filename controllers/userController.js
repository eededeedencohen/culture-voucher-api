const User = require('../models/User');

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

module.exports = { getStudents, getBusinesses };
