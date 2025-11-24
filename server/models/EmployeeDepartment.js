import mongoose from 'mongoose';

const EmployeeDepartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const EmployeeDepartment = mongoose.model('EmployeeDepartment', EmployeeDepartmentSchema);

