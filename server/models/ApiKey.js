import mongoose from 'mongoose';

const ApiKeySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    apiKey: { type: String, required: true, unique: true },
    apiSecret: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    lastUsed: { type: Date },
    usageCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

ApiKeySchema.index({ isActive: 1 });

export const ApiKey = mongoose.model('ApiKey', ApiKeySchema);