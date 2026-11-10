import mongoose from 'mongoose';
import Destination from '../src/models/Destination.js';
import Package from '../src/models/Package.js';
import { keralaCatalog } from '../src/data/keralaCatalog.js';
await mongoose.connect('mongodb://127.0.0.1:27017/oor_suthalam_local');
try {
  for (const place of keralaCatalog) {
    const d = await Destination.findOneAndUpdate(
      { name: place.name },
      { $set: place, $setOnInsert: { image: '' } },
      { upsert: true, returnDocument: 'after', runValidators: true },
    );
    await Package.updateOne(
      { destination: d._id, title: place.name + ' · Kerala discovery' },
      {
        $setOnInsert: {
          destination: d._id,
          title: place.name + ' · Kerala discovery',
          days: 2,
          price: 0,
          priceMode: 'quote',
          travelType: 'land',
          active: true,
          description:
            'Flexible local sightseeing itinerary; request a confirmed quote before booking.',
          inclusions: [
            'Proposed local sightseeing itinerary',
            'Accommodation and transport options to be quoted',
          ],
        },
      },
      { upsert: true },
    );
  }
  console.log('12 Kerala destinations and packages ready');
} finally {
  await mongoose.disconnect();
}
