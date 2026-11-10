import mongoose from 'mongoose';
export default mongoose.model(
  'Destination',
  new mongoose.Schema(
    {
      active: { type: Boolean, default: true },
      hiddenGem: { type: Boolean, default: false },
      lat: Number,
      lng: Number,
      sourceUrl: String,
      accessNote: String,
      name: { type: String, required: true, trim: true },
      region: { type: String, required: true },
      category: {
        type: String,
        enum: ['Nature', 'Heritage', 'Coast', 'City'],
        required: true,
      },
      description: { type: String, required: true },
      image: { type: String, default: '' },
      galleryConfigured: { type: Boolean, default: false },
      gallery: [
        {
          title: { type: String, required: true, trim: true, maxLength: 120 },
          caption: { type: String, default: '', maxLength: 500 },
          image: { type: String, default: '' },
        },
      ],
      dailyBudget: { type: Number, min: 0, required: true },
      activities: [{ type: String }],
      indoorActivities: [{ type: String }],
    },
    { timestamps: true },
  ),
);
