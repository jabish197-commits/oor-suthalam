import mongoose from 'mongoose';
export default mongoose.model(
  'Inquiry',
  new mongoose.Schema(
    {
      readAt: { type: Date, default: null },
      name: { type: String, required: true },
      email: { type: String, required: true },
      message: { type: String, required: true },
    },
    { timestamps: true },
  ),
);
