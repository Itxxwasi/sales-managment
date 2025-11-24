import mongoose from 'mongoose';

const GroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    permissions: [{ type: String }],
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Group = mongoose.model('Group', GroupSchema);