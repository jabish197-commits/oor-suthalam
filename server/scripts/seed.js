import '../src/config/env.js';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Destination from '../src/models/Destination.js';
import Package from '../src/models/Package.js';
import { demoCatalog } from '../src/data/demoCatalog.js';
import { databaseErrorMessage } from '../src/utils/databaseError.js';

try {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Production seeding is disabled.');
  await connectDB();
  let addedDestinations = 0;
  let addedPackages = 0;
  for (const item of demoCatalog) {
    const destinationResult = await Destination.updateOne(
      { name: item.destination.name },
      { $setOnInsert: item.destination },
      { upsert: true, runValidators: true },
    );
    addedDestinations += destinationResult.upsertedCount;
    const destination = await Destination.findOne({ name: item.destination.name }).select(
      '_id',
    );
    const packageResult = await Package.updateOne(
      { title: item.package.title },
      { $setOnInsert: { ...item.package, destination: destination._id, active: true } },
      { upsert: true, runValidators: true },
    );
    addedPackages += packageResult.upsertedCount;
  }
  console.log(
    `Demo catalog ready: ${addedDestinations} destinations and ${addedPackages} packages added. Existing entries were preserved.`,
  );
} catch (error) {
  console.error(
    process.env.NODE_ENV === 'production'
      ? 'Demo seeding is disabled in production.'
      : databaseErrorMessage(error),
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
