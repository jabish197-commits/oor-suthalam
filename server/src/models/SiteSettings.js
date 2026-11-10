import mongoose from 'mongoose';
export default mongoose.model(
  'SiteSettings',
  new mongoose.Schema(
    {
      key: { type: String, unique: true, required: true, enum: ['homepage'] },
      heroVideo: { type: String, default: '' },
      heroPoster: { type: String, default: '' },
    },
    { timestamps: true },
  ),
);
