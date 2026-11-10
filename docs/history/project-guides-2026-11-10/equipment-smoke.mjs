/** Browser interaction, rendering and lifecycle checks for the equipment studies. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { createServer } from 'vite';
const out=process.env.FLUX_EQUIPMENT_OUT || '/tmp/flux-equipment';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(fn){for(let i=0;i<200;i++){try{const x=await fn();if(x)return x;}catch{}await delay(100);}throw Error('Equipment check timed out');}
class CDP{
 constructor(url){this.url=url;this.id=0;this.pending=new Map();this.errors=[];this.loads=0;}
 async open(){this.ws=new WebSocket(this.url);this.ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.method==='Page.loadEventFired')this.loads++;if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);const p=this.pending.get(m.id);if(p){this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}});await new Promise((r,j)=>{this.ws.addEventListener('open',r);this.ws.addEventListener('error',j);});}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}));});}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
}
const server=await createServer({root:new URL('..',import.meta.url).pathname,server:{host:'127.0.0.1',port:5186,strictPort:true,hmr:false}});await server.listen();
const port=9340;
const chrome=spawn(process.env.CHROME || 'google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader',`--remote-debugging-port=${port}`,`--user-data-dir=/tmp/flux-equipment-chrome-${process.pid}`,'about:blank'],{stdio:'ignore'});
let page;
try{
 const target=await wait(async()=>(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page'));
 page=new CDP(target.webSocketDebuggerUrl);await page.open();await page.send('Page.enable');await page.send('Runtime.enable');await fs.mkdir(out,{recursive:true});
 const click=s=>page.eval(`document.querySelector(${JSON.stringify(s)}).click()`);
 const input=(s,value)=>page.eval(`(()=>{const e=document.querySelector(${JSON.stringify(s)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 async function navigate(station){await page.send('Page.navigate',{url:'about:blank'});await wait(()=>page.eval('location.href === "about:blank"'));await page.send('Page.navigate',{url:`http://127.0.0.1:5186/?traveler=fsw-dome&station=${station}#applications`});await wait(()=>page.eval(`document.querySelector('[data-lesson]')?.dataset.lesson===${JSON.stringify(station)}`));}
 const cases=[['design','dome'],['material','material'],['panels','panels'],['weld','weld'],['inspection','inspection'],['proof','proof']];
 for(const theme of ['light','dark'])for(const [width,height]of [[390,844],[1280,800]]){
  await page.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
  for(const [station,kind]of cases){
   await navigate(station);
   const selector=`[data-equipment-scene="${kind}"]`;
   await page.eval(`document.documentElement.dataset.theme='${theme}';document.querySelector('${selector} [data-equipment-canvas]').scrollIntoView({block:'start'});`);
   await wait(()=>page.eval(`document.querySelector('${selector}').dataset.equipmentReady`));
   assert.equal(await page.eval(`document.querySelector('${selector}').dataset.equipmentReady`),'true',`${kind}: WebGL rendered`);
   await input(`${selector} [data-equipment-progress]`,kind==='material'?65:kind==='proof'?85:kind==='dome'?40:55);
   if(['weld','dome'].includes(kind))await click(`${selector} [data-equipment-section]`);
   if(kind==='proof')await click(`${selector} [data-equipment-condition]`);
   await click(`${selector} [data-equipment-part]`);
   assert.ok((await page.eval(`document.querySelector('${selector} [data-equipment-selection]').textContent`)).length>40,`${kind}: component description`);
   await click(`${selector} [data-equipment-camera="front"]`);await click(`${selector} [data-equipment-camera="iso"]`);
   await delay(180);
   assert.equal(await page.eval('document.documentElement.scrollWidth > innerWidth'),false,`${theme} ${width} ${kind}`);
   let shot=await page.send('Page.captureScreenshot',{format:'png'});await fs.writeFile(`${out}/${theme}-${width}-${kind}.png`,Buffer.from(shot.data,'base64'));
   if(kind==='weld'){
    assert.match(await page.eval(`document.querySelector('${selector} [data-equipment-monitor]').textContent`),/Traverse/);
    await click(`${selector} [data-equipment-play]`);const before=await page.eval(`document.querySelector('${selector} [data-equipment-progress]').value`);await delay(250);const after=await page.eval(`document.querySelector('${selector} [data-equipment-progress]').value`);assert.ok(Number(after)>Number(before));await click(`${selector} [data-equipment-play]`);
    await input(`${selector} [data-equipment-progress]`,100);assert.match(await page.eval(`document.querySelector('${selector} [data-equipment-monitor]').textContent`),/Review/);
   }
   if(kind==='material'){
    await input(`${selector} [data-equipment-progress]`,100);assert.match(await page.eval(`document.querySelector('${selector} [data-equipment-monitor]').textContent`),/Fracture/);
   }
   if(kind==='inspection'){
    await input(`${selector} [data-equipment-progress]`,58.6);const withFlaw=await page.eval(`document.querySelector('${selector} [data-equipment-monitor]').textContent`);await click(`${selector} [data-equipment-condition]`);const without=await page.eval(`document.querySelector('${selector} [data-equipment-monitor]').textContent`);assert.notEqual(withFlaw,without);
   }
   await page.eval(`document.querySelector('${selector} [data-equipment-monitor]').scrollIntoView({block:'start'});`);await delay(80);shot=await page.send('Page.captureScreenshot',{format:'png'});await fs.writeFile(`${out}/${theme}-${width}-${kind}-readout.png`,Buffer.from(shot.data,'base64'));
   await click(`${selector} [data-equipment-reset]`);
   // A station change disposes the removed lesson renderer; the overview is retained.
   if(kind!=='dome'){
    await click('.route [data-station="acceptance"]');
    assert.equal(await page.eval('document.querySelectorAll("[data-equipment-scene] canvas").length <= 1'),true);
   }
  }
 }
 assert.deepEqual(page.errors,[]);
 console.log(`Equipment studies passed: six assemblies, transport, cameras, components, cutaways and linked readouts. Screenshots: ${out}`);
}finally{page?.ws.close();chrome.kill();await server.close();}
