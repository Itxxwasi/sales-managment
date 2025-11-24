import mongoose from 'mongoose';

const SubDepartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    sequence: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SubDepartmentSchema.index({ departmentId: 1, branchId: 1, name: 1 }, { unique: true });

export const SubDepartment = mongoose.model('SubDepartment', SubDepartmentSchema);