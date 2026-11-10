import test from 'node:test';
import assert from 'node:assert/strict';
import { distanceKm } from '../src/utils/distance.js';
test('distance helper calculates straight-line kilometers and handles missing location',()=>{
 assert.equal(distanceKm(null,{lat:10,lng:78}),null);
 assert.equal(distanceKm({lat:10,lng:78},{lat:10,lng:78}),0);
 const km=distanceKm({lat:13.08,lng:80.27},{lat:12.62,lng:80.19});assert.ok(km>50&&km<55);
});
