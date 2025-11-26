import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    sequence: { type: Number, default: 0 },
    marginDedPercent: { type: Number, default: 0 },
    showInIncomeStatement: { type: Boolean, default: true },
  },
  { timestamps: true }
);

DepartmentSchema.index({ branchId: 1, name: 1 }, { unique: true });

export const Department = mongoose.model('Department', DepartmentSchema);