import mongoose from 'mongoose';
export const quoteSchema = new mongoose.Schema(
  {
    version: { type: String, required: true },
    total: { type: Number, required: true, min: 1 },
    currency: { type: String, enum: ['INR'], default: 'INR' },
    inclusions: { type: String, required: true, maxlength: 3000 },
    exclusions: { type: String, required: true, maxlength: 3000 },
    terms: { type: String, required: true, maxlength: 3000 },
    expiresAt: { type: Date, required: true },
    issuedAt: { type: Date, required: true },
    respondedAt: Date,
    status: { type: String, enum: ['offered', 'accepted', 'declined'], required: true },
  },
  { _id: false },
);
