// Explicit local-only catalog migration. Photos, bookings and trip records are preserved.
import mongoose from 'mongoose';
import Destination from '../src/models/Destination.js';
import Package from '../src/models/Package.js';
import { tamilNaduCatalog } from '../src/data/tamilNaduCatalog.js';
await mongoose.connect('mongodb://127.0.0.1:27017/oor_suthalam_local', {
  serverSelectionTimeoutMS: 10000,
});
try {
  await Destination.updateMany(
    { region: { $not: /Tamil Nadu/i } },
    { $set: { active: false } },
  );
  const inactive = await Destination.find({ active: false }).select('_id');
  await Package.updateMany(
    {
      $or: [
        { destination: { $in: inactive.map((d) => d._id) } },
        { travelType: 'flight' },
      ],
    },
    { $set: { active: false } },
  );
  for (const place of tamilNaduCatalog) {
    const destination = await Destination.findOneAndUpdate(
      { name: place.name },
      { $set: { ...place, active: true }, $setOnInsert: { image: '' } },
      { upsert: true, returnDocument: 'after', runValidators: true },
    );
    const title = `${place.name} · Tamil Nadu discovery`;
    await Package.updateOne(
      { destination: destination._id, title },
      {
        $setOnInsert: {
          destination: destination._id,
          title,
          days: 2,
          price: 0,
          priceMode: 'quote',
          travelType: 'land',
          active: true,
          description: `A flexible two-day ${place.name} itinerary. Use the budget planner for a group cost estimate; request a confirmed quote before booking.`,
          inclusions: [
            'Proposed local sightseeing itinerary',
            'Accommodation and transport options to be quoted',
          ],
        },
      },
      { upsert: true },
    );
  }
  await Package.updateMany(
    { title: { $nin: tamilNaduCatalog.map((p) => `${p.name} · Tamil Nadu discovery`) } },
    { $set: { active: false } },
  );
  console.log(
    `Tamil Nadu catalog ready: ${tamilNaduCatalog.length} curated destinations. Photos and historical records preserved.`,
  );
} finally {
  await mongoose.disconnect();
}
