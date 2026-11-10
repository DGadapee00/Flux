import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EXAMS,LAB_META } from '../src/data/catalog.js';
import { loadLab } from '../src/labs/load.js';
import { checkedDome } from '../src/labs/model.js';
import { NOTES } from '../src/notes/index.js';
import { PROBLEMS } from '../src/problems/index.js';
import { instance } from '../src/problems/engine.js';
import { courseHash,parseRoute } from '../src/engine/router.js';
import { courseStore,memoryStorage } from '../src/storage.js';
import { FACTORS,MPA_PER_KSI,WELD } from '@flux/subjects/mechanics/tank-dome.js';

test('four course units, four labs and eleven shop stations use the shared course routes',()=>{
 assert.equal(EXAMS.length,4);assert.equal(Object.keys(LAB_META).length,4);
 assert.equal(Object.values(NOTES).flatMap(n=>n.sections).length,11);
 for(const e of EXAMS)for(const id of e.labs){const path=courseHash(e.id,id);const r=parseRoute(path);assert.equal(r.examId,e.id);assert.equal(r.labId,id);}
 for(const set of Object.values(NOTES)){
  const html=fs.readFileSync(new URL(`../src/notes/content/${set.file}`,import.meta.url),'utf8');
  for(const section of set.sections)assert.ok(html.includes(`id="${section.id}"`),section.id);
  assert.match(html, /class="top"/);assert.match(html,/class="toc"/);assert.match(html,/class="box ex"/);
  assert.doesNotMatch(html,/Copy the case brief|Copy.*Claude|exported review brief|data-concept/);
 }
});
test('pressure-only sizing agrees with integrated equilibrium and both strength checks',async()=>{
 for(const p of [50,100,235,400,600])for(const d of [1,3,5.5,8]){
  const n=checkedDome({pressureKPa:p,diameterM:d});assert.ok(n.gap<1e-8);
  assert.ok(n.ultimateUtilization<=1+1e-8);assert.ok(n.proofUtilization<=1+1e-8);
  assert.ok(Math.abs(n.proofKPa/FACTORS.proof-p)<1e-8);
  for(const r of n.repairs){assert.ok(Math.abs(r.roomShare*WELD.wide.roomKsi-r.roomKsi)<1e-8);assert.ok(Math.abs(r.coldShare*WELD.wide.coldKsi-r.coldKsi)<1e-8);}
 }
 for(const id of Object.keys(LAB_META)){
  const lab=await loadLab(id);assert.equal(lab.kind,'scene3d');assert.ok(lab.controls().includes('dome-p'));
  for(const sc of lab.scenarios){const s=lab.defaultState();lab.applyScenario(sc.id,s);const c={};lab.recompute(s,c,{});assert.ok(c.gap<1e-8);}
 }
});
test('numeric practice applies its setup to the lab and agrees with its readout',async()=>{
 assert.ok(PROBLEMS.length>=12);
 for(const p of PROBLEMS)for(let seed=0;seed<12;seed++){
  const inst=instance(p,seed),lab=await loadLab(p.lab),s=lab.defaultState();p.sim.setup(s,inst.$);const c={};lab.recompute(s,c,{});
  const expected=p.parts[0].get(inst.$);assert.ok(Number.isFinite(expected));assert.ok(Math.abs(p.sim.read(c).value-expected)<1e-8,p.id);
 }
});
test('dome progress has its own exportable standard course store',()=>{
 const store=courseStore(memoryStorage());const blob=store.exportJSON();assert.equal(blob.courseId,'dome');assert.notEqual(blob.courseId,'satellite');
});

test('predict-first expectations follow the numeric lab model',async()=>{
 const {run,outcomes}=await import('@flux/shells/engineering/predict.js');
 for(const id of Object.keys(LAB_META)){
  const lab=await loadLab(id);assert.equal(lab.predictions.length,2);
  for(const prompt of lab.predictions){const s=lab.defaultState();lab.applyScenario(prompt.scenario,s);const result=run(lab,s,prompt);assert.deepEqual(outcomes(prompt,result.before,result.after),prompt.expect,prompt.id);}
 }
});
