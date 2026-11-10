import mongoose from 'mongoose';
export default mongoose.model(
  'InquiryReply',
  new mongoose.Schema(
    {
      inquiry: { type: mongoose.Schema.Types.ObjectId, ref: 'Inquiry', required: true },
      requestId: { type: String, required: true, unique: true },
      admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      subject: { type: String, required: true },
      message: { type: String, required: true },
      status: {
        type: String,
        enum: ['sending', 'accepted', 'failed', 'unknown'],
        default: 'sending',
      },
    },
    { timestamps: true },
  ),
);
