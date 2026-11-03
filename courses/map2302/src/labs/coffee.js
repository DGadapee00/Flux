/** Shows that Newton cooling tracks temperature excess, not absolute Celsius temperature.
 * A drawn HARIO XGSR-60-TB server uses the maker's overall dimensions for its silhouette.
 * Analytic piecewise cooling is checked by RK4 and the integrated sensible-heat balance.
 * The pouring illustration conserves 300 mL; it does not model separate cup/server temperatures. */
import { cooling,integrate } from '@flux/subjects/math/ode.js';import { defineLab } from './define.js';import { slider,bindSlider } from './widgets.js';
import { cells,kv } from '../ui/shared.js';import { fig } from '../ui/format.js';import { THREE,ANSWER_LAYER,C,line,label,cameraFor } from './figure.js';
const scenarios=[{id:'room',name:'Coffee in a 20 °C room',T0:90,Ta:20,Ta2:20,k:.001,t:600,switchAt:300},{id:'switch',name:'Move into 10 °C air after 5 min',T0:90,Ta:20,Ta2:10,k:.001,t:900,switchAt:300},{id:'lebl',name:'Lebl §1.3 Example 1.3.3 check',T0:89,Ta:22,Ta2:22,k:-Math.log(63/67)/60,t:60,switchAt:600}];
const apply=(id,s)=>Object.assign(s,scenarios.find(x=>x.id===id)||scenarios[0],{scenarioId:id,anim:{playing:false},show:{}});
function numerical(s){const mid=Math.min(s.t,s.switchAt),a=integrate((t,T)=>-s.k*(T-s.Ta),0,s.T0,mid,512);if(s.t<=mid)return a;const b=integrate((t,T)=>-s.k*(T-s.Ta2),mid,a.end,s.t,512);return {end:b.end,ts:[...a.ts,...b.ts.slice(1)],ys:[...a.ys,...b.ys.slice(1)]};}
export default defineLab({id:'coffee',exam:'u1',title:'Cooling coffee',app:true,hint:'Start the cooling clock. Double temperature excess, or change the room after five minutes.',orbit:false,cameraFor,gapLimit:2e-5,scenarios,
 defaultState(){const s={};apply('room',s);return s;},applyScenario:apply,
 controls:()=>slider('cf-t','elapsed time (s)',600,0,1800,.1)+slider('cf-k','fitted k (1/s)',.001,.0003,.004,.000001)+slider('cf-room','ambient after switch (°C)',20,5,30,1)+`<label class="field"><span>Animate cooling and pouring (accelerated)</span><input id="cf-play" type="checkbox"></label><p class="tiny">HARIO XGSR-60-TB: 145 × 121 × 120 mm overall. <a href="https://global.hario.com/product/coffee/server/XGSR.html" target="_blank" rel="noreferrer">Manufacturer dimensions</a>. 300 mL fill, temperatures and k are chosen model inputs. The pour is an illustration of one well-mixed lump.</p>`,
 bind(api){for(const [id,key] of [['cf-t','t'],['cf-k','k'],['cf-room','Ta2']])bindSlider(id,(s,v)=>s[key]=v,api);document.getElementById('cf-play').addEventListener('change',e=>{const s=api.slice();if(s.t>=1800)s.t=0;s.anim.playing=e.target.checked;api.bump(false);});},
 syncControls(s){for(const [id,key] of [['cf-t','t'],['cf-k','k'],['cf-room','Ta2']])document.getElementById(id).value=s[key];document.getElementById('cf-play').checked=s.anim.playing;},
 compute(s){const r=cooling(s.T0,s.Ta,s.k,s.t,s.Ta2,s.switchAt),num=numerical(s);let integral=0;for(let i=1;i<num.ts.length;i++){const t0=num.ts[i-1],t1=num.ts[i],Ta=t0>=s.switchAt?s.Ta2:s.Ta;integral+=-s.k*((num.ys[i-1]-Ta)+(num.ys[i]-Ta))*(t1-t0)/2;}
 const poured=60*(1-Math.exp(-s.t/80)),server=300-poured;return {...r,numeric:num.end,poured,server,initialRate:-s.k*(s.T0-s.Ta),heatBalance:(r.T-s.T0)-integral,gap:Math.max(Math.abs(r.T-num.end),Math.abs((r.T-s.T0)-integral))/Math.max(1,Math.abs(s.T0)),xs:num.ts,ys:num.ys};},
 recompute(s,c){Object.assign(c,this.compute(s));},
 init(ctx){const group=new THREE.Group(),serverGroup=new THREE.Group();ctx.scene.add(group);group.add(serverGroup);serverGroup.position.x=-.65;
 const points=[new THREE.Vector2(.65,-1.3),new THREE.Vector2(.95,-1.1),new THREE.Vector2(.93,-.8),new THREE.Vector2(.55,.85),new THREE.Vector2(.53,1.05)];
 const glass=new THREE.Mesh(new THREE.LatheGeometry(points,40),new THREE.MeshBasicMaterial({color:C.blue,wireframe:true,transparent:true,opacity:.3}));serverGroup.add(glass);
 const water=new THREE.Mesh(new THREE.CylinderGeometry(.65,.83,1.1,40),new THREE.MeshBasicMaterial({color:0xb96d32,transparent:true,opacity:.9}));water.position.y=-.55;water.layers.set(ANSWER_LAYER);serverGroup.add(water);
 const handle=new THREE.Mesh(new THREE.TorusGeometry(.55,.045,8,32,Math.PI*1.65),new THREE.MeshBasicMaterial({color:C.ink}));handle.position.set(.76,.05,0);handle.rotation.z=-Math.PI*.82;serverGroup.add(handle);
 line(serverGroup,[[-.53,.85,0],[-.95,1.15,0],[-.52,1.02,0]],C.ink,false);line(serverGroup,[[-.53,1.05,0],[.53,1.05,0]],C.ink,false);
 const cup=new THREE.Mesh(new THREE.CylinderGeometry(.4,.32,.7,32,1,true),new THREE.MeshBasicMaterial({color:C.ink,wireframe:true,transparent:true,opacity:.6}));cup.position.set(-2.3,-1,0);group.add(cup);
 const cupWater=new THREE.Mesh(new THREE.CylinderGeometry(.36,.3,.3,24),new THREE.MeshBasicMaterial({color:0xb96d32}));cupWater.position.set(-2.3,-1.15,0);cupWater.layers.set(ANSWER_LAYER);group.add(cupWater);
 const stream=line(group,[[-1.6,1.1,0],[-2.3,-.7,0]],0xd2a06c,false);stream.visible=false;
 const steam=[];for(let j=0;j<3;j++)steam.push(line(group,Array.from({length:20},(_,i)=>[-1+j*.3+.05*Math.sin(i/3),1.2+i*.035,0]),C.muted,false));
 label(group,'HARIO glass server and cup',0,2.15);label(group,'accelerated, schematic pour',0,-2);return {group,serverGroup,water,cupWater,stream,steam};},
 enter(ctx,h){ctx.grid.group.visible=false;h.group.visible=true;},exit(ctx,h){h.group.visible=false;},
 syncViews(s,c,ctx){const h=ctx.handle;ctx.grid.group.visible=false;const f=c.server/300;h.water.scale.y=f;h.water.position.y=-1.1+.55*f;h.water.material.color.setHSL(.045,.6,.15+.25*Math.max(0,Math.min(1,(c.T-20)/70)));h.cupWater.scale.y=c.poured/60;h.cupWater.visible=c.poured>0;h.cupWater.material.color.copy(h.water.material.color);h.serverGroup.rotation.z=s.anim.playing&&s.t<180?.12*Math.sin(Math.PI*s.t/180):0;h.stream.visible=s.anim.playing&&s.t>0&&s.t<180;for(let i=0;i<h.steam.length;i++){h.steam[i].visible=c.T>35;h.steam[i].position.x=.04*Math.sin(s.t/40+i);}},
 tick(dt,s){if(!s.anim.playing)return false;s.t=Math.min(1800,s.t+dt*100);if(s.t>=1800)s.anim.playing=false;return true;},
 plot:(s,c)=>({type:'accum',xs:c.xs,ys:c.ys,x:s.t,title:'Temperature (°C); elapsed time (s)'}),
 law:()=>[String.raw`T'=-k(T-T_a)`],liveRows:(s,c)=>kv('initial / first ambient',`${fig(s.T0)} / ${fig(s.Ta)} °C`)+kv('RK4 temperature',`${fig(c.numeric)} °C`)+kv('excess half-time',`${fig(c.half)} s`),readout:(s,c)=>cells([['temperature now',`${fig(c.T)} °C`],['rate (°C/s)',fig(c.rate)],['elapsed time',`${fig(s.t)} s`],['excess half-time',`${fig(c.half)} s`]]),
 coach:s=>({title:'Temperature excess decays exponentially',body:`Dimensions identify the HARIO server; temperatures, fill and k are chosen. The second ambient segment starts at ${fig(s.switchAt)} s. <b>What the course model leaves out.</b> Evaporation, radiation, wall heat capacity, internal gradients and separate cup cooling are omitted. Pouring and drafts can change a real k.`}),
});
