import '../src/config/env.js';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import { databaseErrorMessage } from '../src/utils/databaseError.js';

const deadline = setTimeout(() => {
  console.error('Database check timed out. Check DNS and Atlas network access.');
  process.exit(1);
}, 25000);
try {
  if (!process.env.MONGO_URI) throw new Error('Missing database configuration');
  await connectDB();
  await mongoose.connection.db.command({ ping: 1 });
  console.log('Database ping passed. TLS verification was not disabled.');
} catch (error) {
  console.error(databaseErrorMessage(error));
  process.exitCode = 1;
} finally {
  clearTimeout(deadline);
  await mongoose.disconnect();
}
