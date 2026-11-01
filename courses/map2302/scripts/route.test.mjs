import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSE, courseHash, parseRoute } from '../src/engine/router.js';
import { EXAMS } from '../src/data/catalog.js';
test('each planned unit has a canonical empty route',()=>{
  assert.equal(COURSE,'map2302');
  for(const unit of EXAMS){const hash=courseHash(unit.id,'');const route=parseRoute(hash);assert.equal(route.examId,unit.id);assert.ok(!route.labId);assert.equal(route.legacy,false);}
});
test('empty URL opens the first unit without the starter tank',()=>{
  const route=parseRoute('');assert.equal(route.examId,'u1');assert.ok(!route.labId);
});
