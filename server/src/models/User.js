import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['traveler', 'admin'], default: 'traveler' },
    savedPlaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Destination' }],
  },
  { timestamps: true },
);
schema.set('toJSON', {
  transform(_doc, result) {
    delete result.passwordHash;
    return result;
  },
});
export default mongoose.model('User', schema);
