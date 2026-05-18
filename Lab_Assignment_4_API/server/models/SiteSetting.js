const mongoose = require('mongoose');

const siteSettingSchema = new mongoose.Schema({
  siteName: { type: String, default: 'Uni Buy & Sell' },
  maintenanceMode: { type: Boolean, default: false },
  announcementBanner: { type: String, default: '' },
  contactEmail: { type: String, default: 'admin@unibuyandsel.com' },
  allowNewRegistrations: { type: Boolean, default: true },
  campusOptions: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('SiteSetting', siteSettingSchema);
