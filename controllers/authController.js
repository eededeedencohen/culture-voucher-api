const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, name, email, password, role, phone, businessName, studentId } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'משתמש כבר קיים במערכת' });
    }

    if (username) {
      const usernameExists = await User.findOne({ username: username.toLowerCase() });
      if (usernameExists) {
        return res.status(400).json({ message: 'שם המשתמש כבר תפוס' });
      }
    }

    const user = await User.create({
      username, name, email, password, role, phone, businessName, studentId
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      businessName: user.businessName,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    // Support login by username or email (identifier field or legacy email field)
    const loginId = identifier || email;
    const user = await User.findOne({
      $or: [
        { email: loginId?.toLowerCase() },
        { username: loginId?.toLowerCase() }
      ]
    });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        businessName: user.businessName,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = { register, login, getMe };
