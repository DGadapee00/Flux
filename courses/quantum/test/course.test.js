import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import katex from 'katex';
import {EXAMS,LAB_META} from '../src/data/catalog.js';
import {LESSONS} from '../src/data/lessons.js';
import {loadLab} from '../src/labs/load.js';
import {NOTES,sectionForProblem} from '../src/notes/index.js';
import {SETUPS} from '../src/notes/setups.js';
import {PROBLEMS} from '../src/problems/index.js';
import {instance,grade,render} from '../src/problems/engine.js';
import {courseHash,parseRoute} from '../src/engine/router.js';
import {courseStore,memoryStorage} from '../src/storage.js';
import {run,outcomes} from '@flux/shells/engineering/predict.js';

test('each unit has a routed lab, original structured notes and checked worked setups',async()=>{
 assert.equal(EXAMS.length,4);assert.equal(Object.keys(LAB_META).length,4);
 for(const lesson of LESSONS){
  const lab=await loadLab(lesson.id);assert.equal(lab.kind,'plot2d');assert.ok(lab.controls().includes('physics-'));
  const route=parseRoute(courseHash(lesson.exam,lesson.id));assert.equal(route.examId,lesson.exam);assert.equal(route.labId,lesson.id);
  const set=NOTES[lesson.exam],html=fs.readFileSync(new URL(`../src/notes/content/${set.file}`,import.meta.url),'utf8');
  for(const section of set.sections)assert.ok(html.includes(`id="${section.id}"`));
  assert.match(html,/class="top"/);assert.match(html,/class="toc"/);assert.match(html,/class="box ex"/);assert.doesNotMatch(html,/undefined|NaN|data-copy/);
  for(const tex of html.matchAll(/\\\[([\s\S]*?)\\\]/g))assert.doesNotThrow(()=>katex.renderToString(tex[1],{throwOnError:true}));
  const c=lab.compute(lab.defaultState());for(const [key,[got,want]]of Object.entries(SETUPS[lesson.exam].s2[0].read(c)))assert.ok(Math.abs(got-want)<1e-9*Math.max(1,Math.abs(want)),key);
 }
 const store=courseStore(memoryStorage());assert.ok(['modern','quantum','nuclear'].includes(store.exportJSON().courseId));
});
test('all scenarios and slider ranges satisfy the independent numeric check',async()=>{
 for(const lesson of LESSONS){
  const lab=await loadLab(lesson.id);
  const check=s=>{const c=lab.compute(s);assert.ok(c.gap<lab.gapLimit,`${lesson.id}: ${c.gap}`);for(const o of lesson.outputs)assert.ok(Number.isFinite(c[o.key]),`${lesson.id}: ${o.key}`);};
  for(const sc of lab.scenarios){const s=lab.defaultState();lab.applyScenario(sc.id,s);check(s);}
  for(const input of lesson.inputs)for(let i=0;i<=20;i++){const s=lab.defaultState();s[input.key]=Math.min(input.max,input.min+Math.round((input.max-input.min)*i/20/input.step)*input.step);check(s);}
  assert.equal(lab.predictions.length,2);for(const p of lab.predictions){const s=lab.defaultState(),r=run(lab,s,p);assert.deepEqual(outcomes(p,r.before,r.after),p.expect,p.id);}
 }
});
test('numeric and conceptual answers grade correctly, and numeric setups agree with the lab',async()=>{
 assert.ok(PROBLEMS.length>=15);
 for(const p of PROBLEMS){assert.ok(sectionForProblem(p));for(let seed=0;seed<16;seed++){
  const inst=instance(p,seed),part=p.parts[0],want=part.kind==='numeric'?part.get(inst.$):part.correct(inst.$);
  assert.equal(grade(part,inst.$,String(want)).correct,true,`${p.id}: correct answer`);
  const wrong=part.kind==='numeric'?(want===0?1:want*1.2):String((Number(want)+1)%3);
  assert.equal(grade(part,inst.$,String(wrong)).correct,false,`${p.id}: wrong answer`);
  if(part.kind==='numeric'){
   const lab=await loadLab(p.lab),s=lab.defaultState();p.sim.setup(s,inst.$);const c=lab.compute(s);assert.ok(Math.abs(c.gap)<lab.gapLimit);
   assert.equal(p.sim.read(c).value,want);
   if(Math.abs(want)>0&&Math.abs(want)<1e-12)assert.equal(grade(part,inst.$,'0').correct,false,`${p.id}: tiny quantities need their powers of ten`);
  }
 }}
});
