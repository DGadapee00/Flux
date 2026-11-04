import assert from 'node:assert/strict';
import test from 'node:test';
import { course } from '../src/manifest.js';
import { EXAMS, LAB_META } from '../src/data/catalog.js';
import { PROBLEMS } from '../src/problems/index.js';
import { NOTES } from '../src/notes/index.js';
import { SETUPS } from '../src/notes/setups.js';
import { PREDICTIONS } from '../src/labs/predictions.js';
import { hasLab } from '../src/labs/load.js';
import { selectedBook, OCW, UNIT_SECTIONS } from '../src/data/textbook.js';
import { STORE_KEY, EXAM_KEY, WIDTH_KEY, FULL_KEY } from '../src/storage.js';
import { SYLLABUS } from '../src/data/syllabus.js';
test('the approved spine retains four units and the first unit has no starter content',()=>{
 assert.equal(course.id,'map2302');assert.equal(course.standard,false);
 assert.deepEqual(course.prereqs,['mac2311']);
 assert.deepEqual(EXAMS.map(u=>u.id),['u1','u2','u3','u4']);
 assert.deepEqual(EXAMS.map(u=>u.title),['First-order equations','Second-order linear equations','Fourier series and Laplace transforms','First-order systems']);
 assert.deepEqual(EXAMS[0].labs,['slope-field','euler','phase-line','first-order-response','coffee','exact-substitution','first-order-models']);
 for(const unit of EXAMS){assert.equal(unit.date,null);assert.deepEqual(unit.coming,[]);assert.ok(unit.labs.length>=4);for(const id of unit.labs)assert.equal(hasLab(id),true);}
 assert.equal(hasLab('tank'),false);
 assert.ok(PROBLEMS.length>=20);assert.deepEqual(Object.keys(NOTES),['u1','u2','u3','u4']);
 assert.equal(LAB_META.coffee.app,true);assert.ok(SETUPS.u1);assert.equal(PREDICTIONS.coffee.length,2);
});
test('OCW is primary and the confirmed textbook is selected',()=>{
 assert.equal(OCW.course,'18.03SC');assert.equal(OCW.term,'Fall 2011');assert.equal(selectedBook,'lebl');
 assert.deepEqual(Object.keys(UNIT_SECTIONS),EXAMS.map(u=>u.id));
});
test('storage stays in the MAP namespace',()=>{
 const keys=[STORE_KEY,EXAM_KEY,WIDTH_KEY,FULL_KEY];
 assert.equal(new Set(keys).size,keys.length);
 for(const key of keys)assert.match(key,/^flux\.map2302\.[a-z.]+\.v1$/);
});
test('every UNF syllabus section has notes and a lab in its unit',()=>{
 const seen=new Set();
 for(const row of SYLLABUS.sections){
  assert.ok(!seen.has(row.sec),`${row.sec} listed twice`);seen.add(row.sec);
  const unit=EXAMS.find(u=>u.id===row.unit);assert.ok(unit,`${row.sec}: no unit ${row.unit}`);
  assert.ok(unit.labs.includes(row.lab),`${row.sec}: ${row.lab} is not a ${row.unit} lab`);
  for(const id of row.notes){const sec=NOTES[row.unit].sections.find(s=>s.id===id);assert.ok(sec&&sec.title!=='Formula sheet',`${row.sec}: ${row.unit}/${id} is not a notes section`);}
  assert.ok(PROBLEMS.some(p=>p.exam===row.unit&&row.notes.some(id=>(NOTES[row.unit].sections.find(s=>s.id===id).topics||[]).some(t=>p.topics.includes(t)))),`${row.sec}: no practice problem`);
 }
});
