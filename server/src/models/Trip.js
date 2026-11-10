import mongoose from 'mongoose';
export default mongoose.model(
  'Trip',
  new mongoose.Schema(
    {
      traveler: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      destination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Destination',
        required: true,
      },
      title: { type: String, required: true },
      startDate: { type: Date, required: true },
      days: { type: Number, min: 1, max: 30, required: true },
      travelers: { type: Number, min: 1, max: 20, required: true },
      budget: { type: Number, min: 0, required: true },
      origin: String,
      style: String,
      costs: {
        transport: Number,
        stay: Number,
        food: Number,
        localTransport: Number,
        sightseeing: Number,
        contingency: Number,
      },
      estimateNote: String,
      estimatedCost: Number,
      itinerary: [{ day: Number, activities: [String], planB: [String] }],
    },
    { timestamps: true },
  ),
);
