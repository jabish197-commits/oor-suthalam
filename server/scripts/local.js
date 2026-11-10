// Explicit development mode: never rewrite or fall back from the Atlas URI.
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

import '../src/config/env.js';

if (process.env.NODE_ENV === 'production') {
  console.error('Local database commands are for development only.');
  process.exit(1);
}
const mode = process.argv[2];
const targets = {
  dev: [
    'node_modules/nodemon/bin/nodemon.js',
    '--exec',
    'node --use-system-ca',
    'src/server.js',
  ],
  start: ['--use-system-ca', 'src/server.js'],
  check: ['--use-system-ca', 'scripts/checkDatabase.js'],
  admin: ['--use-system-ca', 'scripts/promoteAdmin.js', ...process.argv.slice(3)],
};
if (!Object.hasOwn(targets, mode)) {
  console.error('Choose dev, start, check, or admin.');
  process.exit(1);
}
console.log(
  'Using the separate local development database. Atlas configuration is preserved.',
);
const child = spawn(process.execPath, targets[mode], {
  cwd: fileURLToPath(new URL('../', import.meta.url)),
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    MONGO_URI: 'mongodb://127.0.0.1:27017/oor_suthalam_local',
    MONGO_DNS_SERVERS: '',
  },
});
child.on('error', () => {
  console.error('Could not start the local development command.');
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
