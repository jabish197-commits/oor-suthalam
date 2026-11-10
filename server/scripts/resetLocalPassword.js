import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { emitKeypressEvents } from 'node:readline';
import User from '../src/models/User.js';

// This maintenance tool deliberately never loads .env or accepts a remote URI.
function hiddenPassword(label) {
  const input = process.stdin;
  process.stdout.write(label);
  input.setRawMode(true);
  input.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    function finish(error) {
      input.off('keypress', onKey);
      input.setRawMode(false);
      input.pause();
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    }
    function onKey(text, key = {}) {
      if (key.ctrl && key.name === 'c') return finish(new Error('Cancelled.'));
      if (key.name === 'return' || key.name === 'enter') return finish();
      if (key.name === 'backspace') value = Array.from(value).slice(0, -1).join('');
      else if (!key.ctrl && !key.meta && text && !/[\x00-\x1f\x7f]/.test(text))
        value += text;
    }
    input.on('keypress', onKey);
  });
}

try {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || process.argv.length !== 3) {
    throw new Error('Usage: npm run password:reset:local -- your-account-email');
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      'Run this command directly in your interactive terminal. Passwords cannot be supplied as arguments or piped input.',
    );
  }
  await mongoose.connect('mongodb://127.0.0.1:27017/oor_suthalam_local', {
    serverSelectionTimeoutMS: 5000,
  });
  const user = await User.findOne({ email }).select('_id');
  if (!user)
    throw new Error('Account not found in the local database. Register locally first.');
  console.log(
    'Resetting the selected local account only. Typing will be hidden. Press Ctrl+C to cancel.',
  );
  emitKeypressEvents(process.stdin);
  let password = await hiddenPassword(
    'New password (10–72 characters, maximum 72 UTF-8 bytes): ',
  );
  if (
    password.length < 10 ||
    password.length > 72 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    throw new Error('Password must be 10–72 characters and no more than 72 UTF-8 bytes.');
  }
  let confirmation = await hiddenPassword('Confirm new password: ');
  if (password !== confirmation)
    throw new Error('Passwords did not match. No password was changed.');
  const passwordHash = await bcrypt.hash(password, 12);
  password = confirmation = '';
  const result = await User.updateOne(
    { _id: user._id },
    { $set: { passwordHash } },
    { runValidators: true },
  );
  if (result.matchedCount !== 1)
    throw new Error('Account no longer exists. No password was changed.');
  console.log(
    'Local password reset complete. Log out and log in with your new password. Existing sessions are not revoked by this command.',
  );
} catch (error) {
  // Never expose raw database error messages or connection configuration.
  const safe = [
    'Usage:',
    'Run this command',
    'Account not found',
    'Account no longer',
    'Password must',
    'Passwords did not',
    'Cancelled.',
  ];
  console.error(
    safe.some((prefix) => error.message?.startsWith(prefix))
      ? error.message
      : 'Local password reset failed. Check that local MongoDB is running.',
  );
  process.exitCode = 1;
} finally {
  if (process.stdin.isTTY && process.stdin.isRaw) process.stdin.setRawMode(false);
  await mongoose.disconnect();
}
