import mongoose from 'mongoose';
export default mongoose.model(
  'TravelPartner',
  new mongoose.Schema(
    {
      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
      },
      company: { type: String, required: true, maxlength: 150 },
      phone: { type: String, required: true, maxlength: 30 },
      regions: { type: String, required: true, maxlength: 500 },
      description: { type: String, required: true, maxlength: 2000 },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
    },
    { timestamps: true },
  ),
);
