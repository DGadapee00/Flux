import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSE, courseHash, parseRoute } from '../src/engine/router.js';
import { EXAMS } from '../src/data/catalog.js';
test('each planned unit has a canonical empty route',()=>{
  assert.equal(COURSE,'map2302');
  for(const unit of EXAMS){const hash=courseHash(unit.id,unit.labs[0]||'');const route=parseRoute(hash);assert.equal(route.examId,unit.id);assert.equal(route.labId||'',unit.labs[0]||'');assert.equal(route.legacy,false);}
});
test('empty URL opens the first built MAP lab',()=>{
  const route=parseRoute('');assert.equal(route.examId,'u1');assert.equal(route.labId,'slope-field');
});
