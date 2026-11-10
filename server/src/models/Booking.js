import { quoteSchema } from './quoteSchema.js';
import mongoose from 'mongoose';
export default mongoose.model(
  'Booking',
  new mongoose.Schema(
    {
      quote: { type: quoteSchema, default: undefined },
      traveler: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
      startDate: { type: Date, required: true },
      travelers: { type: Number, min: 1, max: 20, required: true },
      total: { type: Number, required: true, min: 0 },
      priceMode: { type: String, enum: ['fixed', 'quote'], default: 'fixed' },
      partner: { type: mongoose.Schema.Types.ObjectId, ref: 'TravelPartner' },
      partnerStatus: {
        type: String,
        enum: ['assigned', 'accepted', 'declined'],
        default: 'assigned',
      },
      changeRequest: {
        package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
        startDate: Date,
        travelers: Number,
        status: { type: String, enum: ['pending', 'approved', 'rejected'] },
      },
      status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending',
      },
    },
    { timestamps: true },
  ),
);
