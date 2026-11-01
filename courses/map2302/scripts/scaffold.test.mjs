import assert from 'node:assert/strict';
import test from 'node:test';
import { course } from '../src/manifest.js';
import { EXAMS, LAB_META } from '../src/data/catalog.js';
import { PROBLEMS } from '../src/problems/index.js';
import { NOTES } from '../src/notes/index.js';
import { SETUPS } from '../src/notes/setups.js';
import { PREDICTIONS } from '../src/labs/predictions.js';
import { hasLab } from '../src/labs/load.js';
import { selectedBook, OCW, PROVISIONAL_SECTIONS } from '../src/data/textbook.js';
import { STORE_KEY, EXAM_KEY, WIDTH_KEY, FULL_KEY } from '../src/storage.js';
test('draft has four OCW-ordered units, named planned labs and no example content',()=>{
 assert.equal(course.id,'map2302');assert.equal(course.standard,false);
 assert.deepEqual(course.prereqs,['mac2311']);
 assert.deepEqual(EXAMS.map(u=>u.id),['u1','u2','u3','u4']);
 assert.deepEqual(EXAMS.map(u=>u.title),['First-order equations','Second-order linear equations','Fourier series and Laplace transforms','First-order systems']);
 assert.deepEqual(EXAMS.map(u=>u.coming.at(-1)),['coffee','rlc','radio-tuner','clock-pendulum']);
 for(const unit of EXAMS){assert.equal(unit.date,null);assert.deepEqual(unit.labs,[]);assert.ok(unit.coming.length>=4);for(const id of unit.coming)assert.equal(hasLab(id),false);}
 assert.equal(hasLab('tank'),false);
 for(const collection of [PROBLEMS,NOTES,SETUPS,LAB_META,PREDICTIONS])assert.equal(Object.keys(collection).length,0);
});
test('OCW is primary and textbook remains explicitly unselected',()=>{
 assert.equal(OCW.course,'18.03SC');assert.equal(OCW.term,'Fall 2011');assert.equal(selectedBook,null);
 assert.deepEqual(Object.keys(PROVISIONAL_SECTIONS),EXAMS.map(u=>u.id));
});
test('storage stays in the MAP namespace',()=>{
 const keys=[STORE_KEY,EXAM_KEY,WIDTH_KEY,FULL_KEY];
 assert.equal(new Set(keys).size,keys.length);
 for(const key of keys)assert.match(key,/^flux\.map2302\.[a-z.]+\.v1$/);
});
