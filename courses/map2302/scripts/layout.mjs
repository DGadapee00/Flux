import assert from 'node:assert/strict';import fs from 'node:fs';
import { chromium } from './playwright.mjs';import { EXAMS } from '../src/data/catalog.js';import { course } from '../src/manifest.js';
const base=process.env.LAYOUT_URL||'http://127.0.0.1:5184/',shots=process.env.SMOKE_SHOTS||'../../work/map2302-u1-shots';fs.mkdirSync(shots,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox']}: {})});let views=0,predictions=0;const errors=[];
try{for(const width of (process.env.LAYOUT_WIDTHS?process.env.LAYOUT_WIDTHS.split(',').map(Number):[380,1280])){
 const page=await browser.newPage({viewport:{width,height:width===380?820:800}});page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack);});
 async function ready(unit,id=''){await page.goto(`${base}#/${course.id}/${unit.id}/${id}`);await page.waitForFunction(({id})=>window.__flux?.app&&(id?window.__flux.app.lab?.id===id:!window.__flux.app.lab),{id});await page.waitForTimeout(1100);}
 async function finite(){assert.doesNotMatch(await page.locator('#readout').innerText(),/NaN|Infinity|undefined/);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);}
 for(const unit of EXAMS){
  if(!unit.labs.length){await ready(unit);assert.match(await page.locator('#lab-controls').innerText(),/planned/);assert.equal(await page.locator('#predict').isVisible(),false);views++;continue;}
  for(const id of unit.labs){await ready(unit,id);assert.equal(await page.locator('#exam-select').inputValue(),unit.id);if(width===380){const r=await page.locator('#lab-tabs .active').boundingBox();assert.ok(r.x>=-1&&r.x+r.width<=381,'selected lab tab visible');}assert.ok((await page.locator('#brand-sub').innerText()).includes(course.code));assert.equal(await page.getByRole('button',{name:/^(Export|Import)$/}).count(),0);
   const scenarios=await page.locator('#scenario option').evaluateAll(es=>es.map(e=>e.value));
   for(const scenario of scenarios){await page.selectOption('#scenario',scenario);await page.waitForTimeout(60);await finite();views++;}
   // Sweep every available control, independently from its scenario baseline.
   const sliders=await page.locator('#lab-controls input[type=range]').evaluateAll(es=>es.map(e=>e.id));
   for(const slider of sliders)for(const f of [0,.5,1]){await page.selectOption('#scenario',scenarios[0]);await page.locator('#'+slider).evaluate((el,f)=>{el.value=Number(el.min)+(Number(el.max)-Number(el.min))*f;el.dispatchEvent(new Event('input',{bubbles:true}));},f);await page.waitForTimeout(70);await finite();}
   const prompts=await page.evaluate(()=>window.__flux.app.lab.predictions.map(p=>({watch:p.watch.map(w=>({id:w.id,mode:w.mode||p.mode})),expect:p.expect})));
   for(const prompt of prompts){const pred=page.locator('#predict');await pred.evaluate(e=>e.open=true);for(const w of prompt.watch){const bad=w.mode==='bool'?!prompt.expect[w.id]:w.mode==='dir'?(prompt.expect[w.id]==='bigger'?'smaller':'bigger'):2;await pred.locator(`[data-watch="${w.id}"][data-value="${bad}"]`).click();}await pred.locator('[data-act="apply"]').click();await pred.locator('.pred-grade.bad').first().waitFor();assert.ok((await pred.locator('.pred-grade.bad').first().innerText()).length>8);predictions++;await pred.locator('[data-act="next"]').click();}
   await page.locator('#predict').evaluate(e=>e.open=false);await page.selectOption('#scenario',scenarios[0]);await page.waitForTimeout(1000);
   if(id==='coffee'){assert.notEqual(await page.locator('#lab-controls a').evaluate(e=>getComputedStyle(e).color),'rgb(0, 0, 238)');const before=await page.evaluate(()=>window.__flux.state.t);await page.locator('#cf-play').check();await page.waitForTimeout(300);assert.ok(await page.evaluate(t=>window.__flux.state.t>t,before));await page.locator('#cf-play').uncheck();assert.ok(await page.evaluate(()=>window.__flux.app.handles.coffee.group.children.length>5));}
   if(id==='slope-field'){
    const xy=await page.evaluate(()=>{const s=window.__flux.state,c=window.__flux.camera,u=window.__flux.app.lab.frame(s).upm,p=c.position.clone().set(s.probe.x*u,s.probe.y*u,0).project(c);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2,old:s.probe.y};});
    await page.mouse.move(xy.x,xy.y);await page.mouse.down();await page.mouse.move(xy.x+20,xy.y+30,{steps:6});await page.mouse.up();await page.waitForTimeout(150);assert.ok(await page.evaluate(old=>Math.abs(window.__flux.state.probe.y-old)>.1,xy.old));await page.selectOption('#scenario','affine');
   }
   await finite();await page.screenshot({path:`${shots}/${unit.id}-${id}-${width}.png`});
  }
  await ready(unit,unit.labs[0]);await page.locator('#btn-notes').click();await page.locator('#notes .nt-show').first().waitFor();assert.equal(await page.locator('#notes .katex-error').count(),0);await page.screenshot({path:`${shots}/${unit.id}-notes-${width}.png`});await page.locator('#notes .nt-show').first().click();await page.waitForTimeout(1000);await page.keyboard.press('Escape');
  await page.locator('#btn-practice').click();const problemIds=await page.locator('.pb-item').evaluateAll(es=>es.slice(0,5).map(e=>e.dataset.open));for(const pid of problemIds){await page.locator(`[data-open="${pid}"]`).click();await page.locator('.pb-part').first().waitFor();assert.equal(await page.locator('.katex-error').count(),0);await finite();await page.locator('[data-act="list"]').click();}await page.screenshot({path:`${shots}/${unit.id}-practice-${width}.png`});await page.keyboard.press('Escape');
 }
 await page.close();
}assert.deepEqual(errors,[]);console.log(`layout: ${views} scenario/unit views; ${predictions} deliberately wrong predictions graded; both widths; no overflow or runtime/TeX errors`);
}finally{await browser.close();}
