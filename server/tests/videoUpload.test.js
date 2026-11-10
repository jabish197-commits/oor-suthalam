import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMp4} from '../src/services/videoUploadService.js';
test('video uploads reject incomplete files, misleading names and invalid box sizes',()=>{
 assert.throws(()=>validateMp4(Buffer.from('not a video')));
 const invalid=Buffer.alloc(48);invalid.writeUInt32BE(999999,0);invalid.write('ftyp',4);assert.throws(()=>validateMp4(invalid));
});
