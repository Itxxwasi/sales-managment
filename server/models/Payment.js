import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
  {
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    voucherNumber: { type: String, unique: true, required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    description: { type: String, default: '' },
    paymentMethod: { type: String, default: 'Cash' },
    supplier: { type: String, required: true },
    notes: { type: String, default: '' },
    status: { type: String, default: 'Pending', enum: ['Pending', 'Approved', 'Rejected'] },
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', PaymentSchema);