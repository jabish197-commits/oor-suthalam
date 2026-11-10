import test from 'node:test';
import assert from 'node:assert/strict';
import {requestLocation} from '../src/utils/requestLocation.js';
test('location retries unavailable network coordinates in high accuracy mode',async()=>{const modes=[];const result=await requestLocation({getCurrentPosition(ok,fail,options){modes.push(options.enableHighAccuracy);if(modes.length===1)fail({code:3});else ok({coords:{latitude:13,longitude:80}});}});assert.deepEqual(modes,[false,true]);assert.equal(result.coords.latitude,13);});
test('location permission denial does not retry',async()=>{let count=0;await assert.rejects(requestLocation({getCurrentPosition(ok,fail){count++;fail({code:1});}}));assert.equal(count,1);});
