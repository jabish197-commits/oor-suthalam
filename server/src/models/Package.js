import mongoose from 'mongoose';
export default mongoose.model(
  'Package',
  new mongoose.Schema(
    {
      title: { type: String, required: true },
      description: { type: String, required: true },
      destination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Destination',
        required: true,
      },
      days: { type: Number, min: 1, max: 30, required: true },
      price: { type: Number, min: 0, required: true },
      priceMode: { type: String, enum: ['fixed', 'quote'], default: 'fixed' },
      travelType: { type: String, enum: ['land', 'flight'], default: 'land' },
      inclusions: [String],
      active: { type: Boolean, default: true },
    },
    { timestamps: true },
  ),
);
