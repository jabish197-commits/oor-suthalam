import { quoteSchema } from './quoteSchema.js';
import mongoose from 'mongoose';

export default mongoose.model(
  'FlightRequest',
  new mongoose.Schema(
    {
      quote: { type: quoteSchema, default: undefined },
      traveler: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      origin: { type: String, required: true },
      destination: { type: String, required: true },
      departureDate: { type: Date, required: true },
      returnDate: Date,
      travelers: { type: Number, required: true, min: 1, max: 9 },
      cabin: {
        type: String,
        enum: ['Economy', 'Premium economy', 'Business'],
        required: true,
      },
      notes: { type: String, maxlength: 1000, default: '' },
      status: {
        type: String,
        enum: ['pending', 'reviewed', 'cancelled'],
        default: 'pending',
      },
    },
    { timestamps: true },
  ),
);
