import test from 'node:test';
import assert from 'node:assert/strict';
import { pcmToWav } from '../src/services/speechService.js';

test('speech wraps PCM in a mono 24kHz WAV header', () => {
  const pcm = Buffer.from([0, 0, 1, 0]);
  const wav = pcmToWav(pcm);
  assert.equal(wav.subarray(0, 4).toString(), 'RIFF');
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.equal(wav.readUInt32LE(40), pcm.length);
  assert.deepEqual(wav.subarray(44), pcm);
});
test('speech rejects malformed PCM and unsupported sample rates', () => {
  assert.throws(() => pcmToWav(Buffer.from([1])));
  assert.throws(() => pcmToWav(Buffer.alloc(2), 1));
});
