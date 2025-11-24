import mongoose from 'mongoose';

const EmployeeDesignationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const EmployeeDesignation = mongoose.model('EmployeeDesignation', EmployeeDesignationSchema);

