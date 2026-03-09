const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);

// Serve static files from client build (middle layer)
const clientBuildPath = path.join(__dirname, 'dist');
app.use(express.static(clientBuildPath));

// Catch-all: serve index.html for SPA routing
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

module.exports = app;
