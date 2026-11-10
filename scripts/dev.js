import { spawn } from 'node:child_process';

const children = ['server', 'client/oor-suthalam'].map((directory) =>
  spawn(
    process.execPath,
    [
      process.env.npm_execpath,
      '--prefix',
      directory,
      'run',
      directory === 'server' && process.argv.includes('--local') ? 'dev:local' : 'dev',
    ],
    { stdio: 'inherit', env: process.env },
  ),
);
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => child.kill());
  process.exitCode = code;
}
children.forEach((child) => {
  child.on('error', () => stop(1));
  child.on('exit', (code) => stop(code || 0));
});
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
