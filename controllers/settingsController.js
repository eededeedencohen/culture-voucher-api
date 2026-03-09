const Settings = require('../models/Settings');

// GET /api/settings
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/settings
const updateSettings = async (req, res) => {
  try {
    const { organizationName, barcodeExpiryMinutes, totalBudget } = req.body;
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({ organizationName, barcodeExpiryMinutes, totalBudget });
    } else {
      if (organizationName !== undefined) settings.organizationName = organizationName;
      if (barcodeExpiryMinutes !== undefined) settings.barcodeExpiryMinutes = barcodeExpiryMinutes;
      if (totalBudget !== undefined) settings.totalBudget = totalBudget;
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSettings, updateSettings };
