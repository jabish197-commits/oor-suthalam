import '../src/config/env.js';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import { email as validEmail } from '../src/validators/index.js';
import { databaseErrorMessage } from '../src/utils/databaseError.js';

const email = process.argv[2]?.trim().toLowerCase();
if (!validEmail(email)) {
  console.error('Usage: npm run admin -- registered-user@example.com');
  process.exitCode = 1;
} else {
  try {
    await connectDB();
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true, runValidators: true },
    );
    if (!user) {
      console.error('Account not found. Register the intended account in the app first.');
      process.exitCode = 1;
    } else {
      console.log(
        'The selected registered account now has admin access. Refresh the app to reload its role.',
      );
    }
  } catch (error) {
    console.error(databaseErrorMessage(error));
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
