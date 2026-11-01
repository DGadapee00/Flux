import assert from 'node:assert/strict';import test from 'node:test';
import { EXAMS,LAB_META } from '../src/data/catalog.js';import { PROBLEMS } from '../src/problems/index.js';import { SETUPS } from '../src/notes/setups.js';import { PREDICTIONS } from '../src/labs/predictions.js';
test('every built unit preserves the course content floors',()=>{
 for(const unit of EXAMS.filter(u=>u.labs.length)){
  const bank=PROBLEMS.filter(p=>p.exam===unit.id);assert.ok(bank.length);
  assert.ok(bank.filter(p=>p.parts.every(p=>p.kind==='choice')).length/bank.length>=.25);
  assert.ok(Object.values(SETUPS[unit.id]||{}).flat().length>=6);
  assert.ok(unit.labs.some(id=>LAB_META[id].app));
  for(const id of unit.labs)assert.ok(PREDICTIONS[id].length>=2);
  for(const p of bank){assert.ok(p.hints.length>=2,p.id);assert.ok(p.cases.some(c=>c.src?.length),p.id);for(const part of p.parts){if(part.kind==='numeric')assert.ok(part.traps?.length>=2,p.id);if(part.kind==='choice')assert.ok(part.options.every(o=>o.why),p.id);}}
 }
});
