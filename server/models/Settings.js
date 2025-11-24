import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: 'D.Watson Group of Pharmacy' },
    currency: { type: String, default: '' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    itemsPerPage: { type: Number, default: 10 },
    defaultCostPercent: { type: Number, default: 70 },
    theme: { type: String, default: 'light', enum: ['light', 'dark', 'blue', 'red', 'green', 'purple', 'teal', 'redblue'] }
  },
  { timestamps: true }
);

export const Settings = mongoose.model('Settings', SettingsSchema);
