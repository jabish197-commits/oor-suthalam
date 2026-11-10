import mongoose from 'mongoose';
export default mongoose.model(
  'ChatConversation',
  new mongoose.Schema(
    {
      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
      title: { type: String, default: 'New travel chat', maxlength: 80 },
      messages: [
        {
          role: { type: String, enum: ['user', 'model'], required: true },
          text: { type: String, required: true, maxlength: 8000 },
          privateContext: { type: Boolean, default: false },
          cards: [
            {
              kind: { type: String, enum: ['plan', 'package', 'destination'] },
              title: String,
              description: String,
              destinationId: mongoose.Schema.Types.ObjectId,
              packageId: mongoose.Schema.Types.ObjectId,
              days: Number,
              estimatedCost: Number,
              budget: Number,
            },
          ],
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
    { timestamps: true, optimisticConcurrency: true },
  ),
);
