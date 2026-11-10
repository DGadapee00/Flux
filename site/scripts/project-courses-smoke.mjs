/** Browser interaction, rendering and lifecycle checks for the equipment studies. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { preview } from 'vite';
const out=process.env.FLUX_EQUIPMENT_OUT || '/tmp/flux-project-courses';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(fn){for(let i=0;i<200;i++){try{const x=await fn();if(x)return x;}catch{}await delay(100);}throw Error('Equipment check timed out');}
class CDP{
 constructor(url){this.url=url;this.id=0;this.pending=new Map();this.errors=[];this.loads=0;}
 async open(){this.ws=new WebSocket(this.url);this.ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.method==='Page.loadEventFired')this.loads++;if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);const p=this.pending.get(m.id);if(p){this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}});await new Promise((r,j)=>{this.ws.addEventListener('open',r);this.ws.addEventListener('error',j);});}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}));});}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
}

const server=await preview({root:new URL('..',import.meta.url).pathname,preview:{host:'127.0.0.1',port:5186,strictPort:true}});
const port=9340;
const chrome=spawn(process.env.CHROME||'google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader',`--remote-debugging-port=${port}`,`--user-data-dir=/tmp/flux-project-courses-${process.pid}`,'about:blank'],{stdio:'ignore'});
let page;
try{
 const target=await wait(async()=>(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page'));
 page=new CDP(target.webSocketDebuggerUrl);await page.open();await page.send('Page.enable');await page.send('Runtime.enable');await fs.mkdir(out,{recursive:true});
 const click=s=>page.eval(`document.querySelector(${JSON.stringify(s)}).click()`);
 async function navigate(path){await page.send('Page.navigate',{url:'about:blank'});await wait(()=>page.eval('location.href === "about:blank"'));await page.send('Page.navigate',{url:'http://127.0.0.1:5186/'+path});await wait(()=>page.eval('!!window.__gauss?.courseId || !!document.querySelector("[data-course=dome]")'));}
 const shot=async name=>{await delay(120);const r=await page.send('Page.captureScreenshot',{format:'png'});await fs.writeFile(`${out}/${name}.png`,Buffer.from(r.data,'base64'));};
 await navigate('');
 assert.equal(await page.eval('document.querySelector("[data-course=dome]").getAttribute("href")'),'dome/');
 assert.equal(await page.eval('document.querySelector("#traveler-workbench")'),null);
 for(const theme of ['light','dark'])for(const [width,height]of [[390,844],[1280,800]]){
  await page.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
  for(const [unit,lab]of [['u1','lands'],['u2','inspection'],['u3','repairs'],['u4','proof']]){
   await navigate(`dome/#/dome/${unit}/${lab}`);
   await wait(()=>page.eval(`window.__gauss?.app.labId==='${lab}' && Number.isFinite(window.__gauss.computed.proofKPa)`));
   assert.equal(await page.eval('document.querySelectorAll("#exam-select option").length'),4);
   await page.eval(`document.documentElement.dataset.theme='${theme}'`);
   await page.eval(`const p=document.querySelector('#dome-p');p.value=400;p.dispatchEvent(new Event('input',{bubbles:true}));`);
   await wait(()=>page.eval('Math.abs(window.__gauss.computed.proofKPa-420)<1e-6'));
   assert.equal(await page.eval('document.documentElement.scrollWidth>innerWidth'),false);
   await shot(`${theme}-${width}-dome-${lab}`);
   await click('#btn-notes');await wait(()=>page.eval('!!document.querySelector("#notes .topic")'));
   await shot(`${theme}-${width}-dome-${lab}-notes`);
   await click('#btn-notes');await click('#btn-practice');
   await wait(()=>page.eval('!document.querySelector("#problems").hidden && document.querySelector("#problems").textContent.length>60'));
   await shot(`${theme}-${width}-dome-${lab}-practice`);
   await click('#problems [data-open]');
   await wait(()=>page.eval('!!document.querySelector("#pb-in-0") && !!window.__gauss.practice.current()?.inst'));
   await page.eval(`(()=>{const c=window.__gauss.practice.current(),e=document.querySelector('#pb-in-0');e.value=String(c.tpl.parts[0].get(c.inst.$));e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
   await click('#problems [data-act="check"]');
   await wait(()=>page.eval('!!window.__gauss.practice.current()?.results?.value?.correct'));

  }
  await navigate('satellite/#/satellite/u4/shake?n=build-it');
  await wait(()=>page.eval('document.querySelector("#notes")?.textContent.includes("Choose the material")'));
  assert.equal(await page.eval('document.querySelectorAll("#exam-select option").length'),7);
  assert.equal(await page.eval(`document.querySelector('a[href="guide.html"]')`),null);
  await page.eval(`document.documentElement.dataset.theme='${theme}'`);await shot(`${theme}-${width}-satellite-structure`);
  await navigate('satellite/#/satellite/u7/?n=integration');
  await wait(()=>page.eval('document.querySelector("#notes")?.textContent.includes("Sensor payload")'));
  assert.equal(await page.eval('window.__gauss.app.lab'),null);
  await page.eval(`document.documentElement.dataset.theme='${theme}'`);await shot(`${theme}-${width}-satellite-integration`);
 }
 assert.deepEqual(page.errors,[]);
 console.log(`Project course checks passed. Standard units, labs, notes and practice in the simplified hub. Screenshots: ${out}`);
}finally{page?.ws.close();chrome.kill();await new Promise(resolve=>server.httpServer.close(resolve));}
