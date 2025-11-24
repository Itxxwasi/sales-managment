import mongoose from 'mongoose';

const DepartmentSaleSchema = new mongoose.Schema(
  {
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    subDepartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubDepartment', required: true },
    date: { type: Date, required: true },
    grossSale: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    saleValue: { type: Number, required: true },
    returnAmount: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    netSale: { type: Number, required: true },
    subDepartmentTotal: { type: Number, required: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const DepartmentSale = mongoose.model('DepartmentSale', DepartmentSaleSchema);