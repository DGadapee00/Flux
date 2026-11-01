import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from './playwright.mjs';
import { course } from '../src/manifest.js';
import { EXAMS } from '../src/data/catalog.js';
const base=process.env.LAYOUT_URL||'http://127.0.0.1:5198/';
const shots=process.env.SMOKE_SHOTS||'../../work/mathstarter-shots';fs.mkdirSync(shots,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{} )});
const errors=[];let views=0;
try{for(const [width,height] of [[380,820],[1280,800]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>(errors.push(e.message),console.error(e.stack)));
 for(const unit of EXAMS){await page.goto(`${base}#/${course.id}/${unit.id}/${unit.labs[0]||''}`);await page.waitForFunction(()=>window.__flux?.app);await page.waitForTimeout(1200);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 assert.ok((await page.locator('#brand-sub').innerText()).includes(course.code));
 assert.equal(await page.locator('button').filter({hasText:/^(Export|Import)$/}).count(),0);
 if(unit.labs.length){
 const ids=await page.locator('#scenario option').evaluateAll(els=>els.map(e=>e.value));for(const id of ids){await page.selectOption('#scenario',id);await page.waitForTimeout(80);assert.ok(!/NaN|Infinity/.test(await page.locator('#readout').innerText()));views++;}
 await page.selectOption('#scenario',ids[0]);await page.locator('#tk-t').evaluate(el=>{el.value='300';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#tk-play').check();await page.waitForTimeout(300);assert.ok(await page.evaluate(()=>window.__flux.state.t>0));await page.locator('#tk-play').uncheck();
 const pred=page.locator('#predict');await pred.locator('summary').click();await pred.locator('[data-watch]').first().click();await pred.locator('[data-act="apply"]').click();await pred.locator('.pred-grade').waitFor();await pred.locator('summary').click();await page.waitForTimeout(1000);
 await page.locator('#tk-t').evaluate(el=>{el.value='150';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForTimeout(200);
 await page.screenshot({path:`${shots}/${course.id}-lab-${width}.png`});
 await page.locator('#btn-notes').click();await page.locator('#notes .nt-show').first().waitFor();await page.waitForTimeout(200);assert.equal(await page.locator('#notes .katex-error').count(),0);
 await page.screenshot({path:`${shots}/${course.id}-notes-${width}.png`});await page.locator('#notes .nt-show').first().click();await page.waitForTimeout(1100);await page.keyboard.press('Escape');
 await page.locator('#btn-practice').click();await page.locator('.pb-item').first().click();await page.locator('.pb-part').waitFor();assert.equal(await page.locator('.katex-error').count(),0);
 }else{assert.ok((await page.locator('#lab-controls').innerText()).includes('confirmation'));views++;await page.screenshot({path:`${shots}/${course.id}-${unit.id}-${width}.png`});}
 }
 await page.close();
}assert.deepEqual(errors,[]);console.log(`layout: ${views} scenario/unit views; both sizes; no overflow or runtime errors`);
}finally{await browser.close();}
