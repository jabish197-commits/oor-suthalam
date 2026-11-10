import mongoose from 'mongoose';
import Destination from '../src/models/Destination.js';
import Package from '../src/models/Package.js';
import { starterCatalog } from '../src/data/starterCatalog.js';

try {
  // Fixed loopback target: this script cannot modify the Atlas catalog.
  await mongoose.connect('mongodb://127.0.0.1:27017/oor_suthalam_local', {
    serverSelectionTimeoutMS: 5000,
  });
  let destinations = 0;
  let packages = 0;
  for (const item of starterCatalog) {
    const found = await Destination.findOne({ name: item.destination.name }).collation({
      locale: 'en',
      strength: 2,
    });
    const destination = found || (await Destination.create(item.destination));
    if (!found) destinations++;
    const result = await Package.updateOne(
      { title: item.package.title, destination: destination._id },
      { $setOnInsert: { ...item.package, destination: destination._id, active: true } },
      { upsert: true, runValidators: true, collation: { locale: 'en', strength: 2 } },
    );
    packages += result.upsertedCount;
  }
  console.log(
    `Local catalog: ${destinations} destinations and ${packages} packages added. Existing records and photos preserved.`,
  );
} catch {
  console.error(
    'Could not finish adding the local catalog. Check local MongoDB and rerun; existing records are preserved.',
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
