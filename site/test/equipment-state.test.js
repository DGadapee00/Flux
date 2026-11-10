import test from 'node:test';
import assert from 'node:assert/strict';
import { clampProgress, weldState, tensileState, scanState, proofState, sceneForStation } from '../src/applications/equipment-state.js';

test('weld pin engagement and travel follow distinct phases',()=>{
 assert.equal(weldState(0).plunge,0);
 assert.equal(weldState(.25).phase,'Plunge');
 assert.ok(Math.abs(weldState(.25).plunge-.5)<1e-9);
 assert.equal(weldState(.56).plunge,1);
 assert.ok(Math.abs(weldState(.56).travel-.5)<1e-9);
 assert.equal(weldState(.9).phase,'Withdraw');
 assert.ok(weldState(.9).plunge<1);
 assert.equal(weldState(1).plunge,0);
 assert.equal(weldState(1).travel,1);
 for(let i=0;i<=100;i++){const s=weldState(i/100);assert.ok(s.plunge>=0&&s.plunge<=1);assert.ok(s.travel>=0&&s.travel<=1);}
});
test('synthetic tensile load and plotted engineering stress agree by SI force balance',()=>{
 for(let i=0;i<=100;i++){
  const s=tensileState(i/100);
  assert.ok(Math.abs(s.forceN / (12e-3*4e-3) / 1e6 - s.stressMPa)<1e-8);
  assert.ok(Math.abs(s.strainPct/100-(i/100*.12))<1e-9);
  assert.ok(s.stressMPa>=0&&s.stressMPa<=420);
 }
 assert.equal(tensileState(1).forceN,0);assert.equal(tensileState(1).broken,true);
});
test('inspection echoes change at the reflector and clear when it is excluded',()=>{
 const at=scanState((.25+1.45)/2.9),off=scanState(0);
 assert.ok(at.echo>off.echo+50);
 assert.ok(at.backwall<off.backwall);
 assert.equal(scanState(.586,false).echo,8);
});
test('loading/unloading example returns elastically or retains the stated fictional residual',()=>{
 for(let i=0;i<=50;i++){
  const a=proofState(i/100),b=proofState(1-i/100);
  assert.ok(Math.abs(a.level-b.level)<1e-9);
  assert.ok(Math.abs(a.deformation-b.deformation)<1e-9);
 }
 assert.equal(proofState(1,true).deformation,.16);
 assert.equal(proofState(1,false).deformation,0);
});
test('timeline inputs are bounded and every course station has an equipment scene',()=>{
 assert.equal(clampProgress(Infinity),0);assert.equal(clampProgress(-1),0);assert.equal(clampProgress(2),1);
 for(const id of ['requirement','design','material','panels','fitup','schedule','weld','inspection','nonconformance','proof','acceptance'])assert.ok(sceneForStation(id));
});
