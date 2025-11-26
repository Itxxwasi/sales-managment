import mongoose from 'mongoose';

const IncomeStatementReportSchema = new mongoose.Schema(
  {
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reportDate: { type: Date, default: Date.now },
    items: [{
      subDepartment: {
        _id: mongoose.Schema.Types.ObjectId,
        name: String,
        sequence: Number
      },
      departmentId: mongoose.Schema.Types.ObjectId,
      departmentName: String,
      departmentSequence: Number,
      departmentMarginDedPercent: Number,
      sales: Number,
      returns: Number,
      gst: Number,
      netSale: Number,
      discountAmount: Number,
      discountPercent: Number,
      cost: Number
    }],
    summary: {
      totalSale: Number,
      totalReturns: Number,
      netSales: Number,
      cost: Number,
      grossProfit: Number,
      expenses: Number,
      shortCash: Number,
      netProfit: Number
    },
    branch: {
      _id: mongoose.Schema.Types.ObjectId,
      name: String
    },
    savedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

IncomeStatementReportSchema.index({ branchId: 1, fromDate: 1, toDate: 1 });
IncomeStatementReportSchema.index({ savedBy: 1, createdAt: -1 });

export const IncomeStatementReport = mongoose.model('IncomeStatementReport', IncomeStatementReportSchema);

