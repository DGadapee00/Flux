import * as T from 'three';
import { COMPONENT_DESCRIPTIONS as DESC } from './equipment-descriptions.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { weldState, tensileState, scanState, proofState } from './equipment-state.js';

const C={steel:0xa8b6c4,edge:0x657487,dark:0x263c50,body:0xdce4ea,blue:0x277794,cyan:0x39c6d5,orange:0xecad57,rubber:0x1a2531};

function material(color=C.steel, extra={}){return new T.MeshStandardMaterial({color,metalness:.4,roughness:.36,...extra});}
function mesh(geo,mat,parent,x=0,y=0,z=0){const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function box(parent,w,h,d,x,y,z,mat){return mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d)*.06),mat,parent,x,y,z);}
function cylinder(parent,r1,r2,h,x,y,z,mat){return mesh(new T.CylinderGeometry(r1,r2,h,40),mat,parent,x,y,z);}
function torus(parent,r,tube,x,y,z,mat){const o=mesh(new T.TorusGeometry(r,tube,12,64),mat,parent,x,y,z);o.rotation.x=Math.PI/2;return o;}
function part(parent,id){const g=new T.Group();g.userData.part=id;parent.add(g);return g;}
function tube(parent,points,radius,mat){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));return mesh(new T.TubeGeometry(curve,48,radius,8,false),mat,parent);}
function line(parent,points,color=C.cyan){const o=new T.Line(new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),new T.LineBasicMaterial({color}));parent.add(o);return o;}
function bolts(parent,positions,r=.045){for(const p of positions){cylinder(parent,r,r,.055,...p,material(C.edge));}}
function surface(fn,nu=28,nv=36){
 const points=[],indices=[];
 for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++)points.push(...fn(i/nu,j/nv));
 for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+nu+1;indices.push(a,b,a+1,b,b+1,a+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function dome(root){
 const panels=[],r=2,h=1.25;
 for(let k=0;k<8;k++){
  const panel=part(root,'gores');
  // The crown opening leaves room for the fitting; a small angular gap reveals the panel boundaries.
  const geo=surface((u,v)=>{const phi=k*Math.PI/4+.004+u*(Math.PI/4-.008),theta=.14+v*(Math.PI/2-.14);return [r*Math.sin(theta)*Math.cos(phi),h*Math.cos(theta),r*Math.sin(theta)*Math.sin(phi)];},18,30);
  mesh(geo,material(k%2?0xb8c7d4:0xc8d3dc,{side:T.DoubleSide}),panel);
  const lands=part(panel,'lands');
  for(const phi of [k*Math.PI/4+.01,(k+1)*Math.PI/4-.01]){
   tube(lands,Array.from({length:33},(_,j)=>{const th=.14+j/32*(Math.PI/2-.14);return [r*Math.sin(th)*Math.cos(phi),(h+.013)*Math.cos(th),r*Math.sin(th)*Math.sin(phi)];}),.025,material(C.edge));
  }
  panels.push({panel,angle:(k+.5)*Math.PI/4});
 }
 const ring=part(root,'ring');torus(ring,2,.065,0,0,0,material(C.blue));torus(ring,1.95,.035,0,-.12,0,material(C.steel));
 const fitting=part(root,'fitting');cylinder(fitting,.26,.29,.12,0,1.28,0,material(C.steel));torus(fitting,.225,.035,0,1.36,0,material(C.blue));
 cylinder(fitting,.12,.12,.2,0,1.41,0,material(C.edge));
 bolts(fitting,Array.from({length:8},(_,i)=>[.21*Math.cos(i*Math.PI/4),1.35,.21*Math.sin(i*Math.PI/4)]),.019);
 const skirt=part(root,'ring');mesh(new T.CylinderGeometry(2,2,.5,80,1,true),material(C.edge,{side:T.DoubleSide}),skirt,0,-.28,0);
 return {target:[0,.55,0],distance:7.6,update(t,{section}){for(const p of panels){p.panel.position.set(Math.cos(p.angle)*t*.8,t*.2,Math.sin(p.angle)*t*.8);p.panel.visible=!(section&&p.angle>0&&p.angle<Math.PI/2);}fitting.position.y=t*.55;ring.position.y=-t*.25;skirt.position.y=-t*.4;}};
}
function welding(root){
 const plates=part(root,'plate'),left=box(plates,1.77,.22,3.7,-.9,1.1,0,material(C.steel)),right=box(plates,1.77,.22,3.7,.9,1.1,0,material(0xbac7d2));
 const support=part(root,'backing');box(support,3.8,.38,4.0,0,.79,0,material(C.dark));box(support,4.3,.22,4.4,0,.48,0,material(C.edge));
 const clamps=part(root,'clamps');
 for(const x of [-1.45,1.45])for(const z of [-1.35,1.35]){
  box(clamps,.36,.12,.48,x,1.29,z,material(C.blue));cylinder(clamps,.05,.05,.38,x,1.28,z,material(C.edge));cylinder(clamps,.095,.095,.06,x,1.5,z,material(C.dark));
 }
 const tool=new T.Group();root.add(tool);
 const spindle=part(tool,'spindle');cylinder(spindle,.27,.22,1.1,0,1.95,0,material(C.dark));cylinder(spindle,.3,.3,.18,0,2.46,0,material(C.blue));cylinder(spindle,.19,.23,.32,0,1.35,0,material(C.steel));
 const shoulder=part(tool,'shoulder');cylinder(shoulder,.32,.36,.12,0,1.25,0,material(C.edge));
 torus(shoulder,.24,.012,0,1.186,0,material(C.steel));
 const pin=part(tool,'pin');cylinder(pin,.075,.11,.19,0,1.095,0,material(C.orange));
 const helix=Array.from({length:90},(_,i)=>{const f=i/89;return [.1*Math.cos(f*8*Math.PI),1.01+f*.17,.1*Math.sin(f*8*Math.PI)];});tube(pin,helix,.008,material(C.edge));
 const seam=box(root,.09,.008,1,0,1.215,0,material(0x6e9caa));
 const hole=mesh(new T.CircleGeometry(.09,32),material(C.rubber,{side:T.DoubleSide}),root,0,1.216,1.45);hole.rotation.x=-Math.PI/2;hole.visible=false;
 return {target:[0,1.12,0],distance:7.9,focus:()=>[0,1.18,tool.position.z],update(t,{section}){const s=weldState(t);tool.position.set(0,(1-s.plunge)*.62,s.z);tool.rotation.y=s.rotating?t*100:0;right.visible=!section;left.visible=true;seam.scale.z=Math.max(.001,2.9*s.travel);seam.position.z=-1.45+1.45*s.travel;seam.visible=s.travel>0;hole.visible=t>.82;}};
}
function specimenGeometry(top=false,bottom=false){
 const points=[[-.28,-.7],[.28,-.7],[.28,-.45],[.13,-.30],[.11,-.22],[.11,.22],[.13,.30],[.28,.45],[.28,.7],[-.28,.7],[-.28,.45],[-.13,.30],[-.11,.22],[-.11,-.22],[-.13,-.30],[-.28,-.45]];
 let filtered=points;
 if(top)filtered=[[-.10,0],[.1,.025],[.11,.22],[.13,.3],[.28,.45],[.28,.7],[-.28,.7],[-.28,.45],[-.13,.3],[-.11,.22]];
 if(bottom)filtered=[[-.28,-.7],[.28,-.7],[.28,-.45],[.13,-.3],[.11,-.22],[.1,-.015],[-.1,0],[-.11,-.22],[-.13,-.3],[-.28,-.45]];
 const shape=new T.Shape();filtered.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();return new T.ExtrudeGeometry(shape,{depth:.075,bevelEnabled:false});
}
function tensile(root){
 const frame=part(root,'frame');box(frame,3.3,.4,1.5,0,.25,0,material(C.dark));box(frame,2.9,.26,1.15,0,4.45,0,material(C.body));
 for(const x of [-1.18,1.18]){cylinder(frame,.12,.12,4.1,x,2.32,0,material(C.steel));cylinder(frame,.2,.2,.16,x,.55,0,material(C.edge));}
 const cross=part(root,'frame');box(cross,2.7,.27,1.03,0,3.78,0,material(C.body));cylinder(cross,.23,.23,.4,0,3.45,0,material(C.edge));
 const grips=part(root,'grips'),upper=new T.Group();grips.add(upper);
 function grip(g,y){box(g,.74,.46,.53,0,y,.02,material(C.edge));for(const x of [-.14,.14])box(g,.22,.28,.34,x,y-.025,.13,material(C.dark));bolts(g,[[-.27,y+.245,0],[.27,y+.245,0]],.034);}
 grip(grips,1.6);grip(upper,3.2);
 const sp=part(root,'specimen'),full=mesh(specimenGeometry(),material(C.steel),sp,0,2.4,.17),a=mesh(specimenGeometry(true),material(C.steel),sp,0,2.4,.17),b=mesh(specimenGeometry(false,true),material(C.steel),sp,0,2.4,.17);
 const gauge=part(root,'gauge');
 box(gauge,.21,.55,.18,.48,2.4,.37,material(C.orange));const upperArm=line(gauge,[[.46,2.62,.37],[.07,2.62,.27]],C.orange),lowerArm=line(gauge,[[.46,2.18,.37],[.07,2.18,.27]],C.orange);
 tube(gauge,[[.59,2.4,.37],[.95,2.15,.4],[1.7,1.9,.3]],.018,material(C.rubber));
 const display=part(root,'frame');box(display,.65,.9,.23,1.9,1.1,.05,material(C.dark));box(display,.5,.35,.025,1.9,1.27,.18,material(C.blue));
 const original=new Map([full,a,b].map(o=>[o,Float32Array.from(o.geometry.attributes.position.array)]));
 return {target:[.15,2.3,0],distance:8.6,update(t){
  const s=tensileState(t),extension=.6*s.strainPct/100*3;
  upper.position.y=extension+(s.broken?.06:0);cross.position.y=upper.position.y;
  for(const o of [full,a,b]){
   const p=o.geometry.attributes.position,src=original.get(o);
   for(let i=0;i<p.count;i++){
    const x=src[i*3],y=src[i*3+1];
    p.setXYZ(i,x*(1-.48*s.neck*Math.exp(-(y*y/.025))),y+extension/2*Math.max(-1,Math.min(1,y/.3)),src[i*3+2]);
   }
   p.needsUpdate=true;o.geometry.computeVertexNormals();o.position.y=2.4+extension/2;
  }
  full.visible=!s.broken;a.visible=b.visible=s.broken;a.position.y+=s.broken?.06:0;
  gauge.position.y=extension/2;upperArm.position.y=extension*.22/.6;lowerArm.position.y=-extension*.22/.6;gauge.visible=!s.broken;
 }};
}
const panelY=(x,z)=>.85+.105*x*x+.06*z*z;
function machining(root){
 const fixture=part(root,'fixture');box(fixture,4.25,.34,4.7,0,.28,0,material(C.dark));
 for(const z of [-1.7,-.85,0,.85,1.7])box(fixture,4.1,.035,.045,0,.46,z,material(C.edge));
 for(const z of [-1.6,-.8,0,.8,1.6]) {
  const rib=new T.Shape();rib.moveTo(-1.52,.47);rib.lineTo(1.52,.47);
  for(let j=24;j>=0;j--){const x=-1.52+j/24*3.04;rib.lineTo(x,panelY(x,z)-.07);}rib.closePath();
  mesh(new T.ExtrudeGeometry(rib,{depth:.16,bevelEnabled:false}),material(C.edge),fixture,0,0,z-.08);
 }
 const panel=part(root,'panel');mesh(surface((u,v)=>{const x=(u-.5)*3.1,z=(v-.5)*3.8;return [x,panelY(x,z),z];}),material(C.steel,{side:T.DoubleSide}),panel);
 const stock=[];
 for(let j=0;j<32;j++){const g=mesh(surface((u,v)=>{const x=(u-.5)*2.5,z=-1.9+(j+v)/32*3.8;return [x,panelY(x,z)+.11,z];},10,2),material(0x839db1,{side:T.DoubleSide}),panel);stock.push(g);}
 const lands=part(root,'lands');for(const sign of [-1,1])mesh(surface((u,v)=>{const x=sign*(1.28+u*.27),z=(v-.5)*3.8;return [x,panelY(x,z)+.12,z];},3,24),material(C.blue,{side:T.DoubleSide}),lands);
 for(const x of [-1.75,1.75])for(const z of [-1.35,1.35]){const y=panelY(1.5,z);box(fixture,.32,y-.46,.4,x,(y+.46)/2,z,material(C.edge));box(fixture,.45,.09,.3,x-Math.sign(x)*.12,y+.16,z,material(C.blue));cylinder(fixture,.055,.055,.2,x,y+.2,z,material(C.steel));}
 const column=part(root,'spindle');for(const x of [-2.35,2.35]){box(fixture,.4,.2,4.9,x,.48,0,material(C.edge));box(column,.45,2.65,.65,x,1.87,0,material(C.body));}box(column,5.15,.5,.75,0,3.32,0,material(C.edge));
 const head=part(root,'spindle');box(head,.65,.85,.75,0,3.05,0,material(C.body));cylinder(head,.25,.22,.55,0,2.37,0,material(C.edge));cylinder(head,.16,.1,.3,0,1.99,0,material(C.steel));
 const cutter=new T.Group();head.add(cutter);cylinder(cutter,.075,.075,.35,0,1.69,0,material(C.steel));
 for(let i=0;i<3;i++)tube(cutter,Array.from({length:30},(_,j)=>{const p=j/29;return [.08*Math.cos(p*5+i*2*Math.PI/3),1.52+p*.34,.08*Math.sin(p*5+i*2*Math.PI/3)];}),.012,material(C.dark));
 const path=line(root,Array.from({length:200},(_,i)=>{const t=i/199,x=1.1*Math.sin(t*8*Math.PI),z=-1.7+3.4*t;return [x,panelY(x,z)+.14,z];}),C.orange);
 return {target:[-.3,1.5,0],distance:10.6,focus:()=>[head.position.x,panelY(head.position.x,head.position.z),head.position.z],update(t){const x=1.1*Math.sin(t*8*Math.PI),z=-1.7+3.4*t;column.position.z=z;head.position.set(x,panelY(x,z)+.11-1.52,z);cutter.rotation.y=t*160;stock.forEach((m,i)=>{m.visible=i/32>=t;});path.visible=true;}};
}
function inspection(root){
 const plate=part(root,'plate');box(plate,3.6,.6,3.9,0,.9,0,material(C.steel));
 const near=box(plate,1.8,.6,3.9,.9,.9,0,material(C.steel));
 // Split meshes let the near half be removed, exposing the interior without hiding the whole joint.
 plate.children[0].geometry.dispose();plate.children[0].geometry=new T.BoxGeometry(1.8,.6,3.9);plate.children[0].position.x=-.9;
 box(plate,.08,.018,3.9,0,1.207,0,material(C.edge));
 const probe=part(root,'probe');
 const shape=new T.Shape();shape.moveTo(-.58,0);shape.lineTo(.35,0);shape.lineTo(.35,.2);shape.lineTo(-.58,.6);shape.closePath();
 const wedge=mesh(new T.ExtrudeGeometry(shape,{depth:.62,bevelEnabled:false}),material(C.orange,{transparent:true,opacity:.72,side:T.DoubleSide}),probe,-.2,1.21,-.31);
 const array=box(probe,.66,.15,.54,-.4,1.72,0,material(C.dark));array.rotation.z=-.4;
 for(let i=0;i<12;i++)box(probe,.023,.025,.51,-.68+i*.047,1.794-(i*.047)*.42,0,material(C.steel));
 tube(probe,[[-.72,1.76,0],[-1.3,1.9,.1],[-1.8,1.65,.5],[-2.2,1.1,1.1]],.028,material(C.rubber));
 const beam=part(root,'beam'),rays=[];
 for(let i=0;i<7;i++){const x=-.3+i/6*.78;rays.push(line(beam,[[-.3,1.19,0],[x,.61,.12]],i===6?C.orange:C.cyan));}
 const returning=line(beam,[[-.3,1.19,0],[.075,.91,.06]],C.orange);returning.material=new T.LineDashedMaterial({color:C.orange,dashSize:.045,gapSize:.025});returning.computeLineDistances();
 const ghost=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1.8,.6,3.9)),new T.LineBasicMaterial({color:C.edge,transparent:true,opacity:.35}));ghost.position.set(.9,.9,0);root.add(ghost);
 const flaw=part(root,'flaw');const reflector=box(flaw,.035,.25,.5,.075,.91,.25,material(C.orange));reflector.rotation.z=-.65;
 return {target:[0,1.05,0],distance:7.2,focus:()=>[0,1.1,probe.position.z],update(t,{section,condition}){const s=scanState(t,condition);probe.position.z=s.z;beam.position.z=s.z;beam.visible=section;near.visible=!section;ghost.visible=section;returning.visible=s.response>.15;flaw.visible=section&&condition;for(const ray of rays)ray.material.opacity=.3+.7*s.response;}};
}
function proof(root){
 const article=part(root,'vessel');const barrel=cylinder(article,.87,.87,2.7,0,1.55,0,material(C.steel));barrel.rotation.z=Math.PI/2;
 for(const sign of [-1,1]){const end=mesh(new T.SphereGeometry(.87,48,24,0,Math.PI*2,0,Math.PI/2),material(C.steel),article,sign*1.35,1.55,0);end.scale.y=.7;end.rotation.z=-sign*Math.PI/2;}
 const seams=part(root,'vessel');for(const x of [-1.35,1.35]){const r=torus(seams,.872,.018,x,1.55,0,material(C.edge));r.rotation.set(0,Math.PI/2,0);}
 const supports=part(root,'supports');for(const x of [-.95,.95]){box(supports,.5,.5,1.8,x,.55,0,material(C.dark));box(supports,.65,.15,2.0,x,.24,0,material(C.edge));const saddle=mesh(new T.TorusGeometry(.92,.1,10,48,Math.PI),material(C.blue),supports,x,1.55,0);saddle.rotation.set(Math.PI,Math.PI/2,0);}
 const connection=part(root,'line');tube(connection,[[-.7,2.38,0],[-.7,2.7,0],[-1.8,2.7,0],[-2.4,2.1,0],[-2.4,.5,0]],.04,material(C.blue));
 const gauge=part(root,'gauge');tube(gauge,[[.4,2.38,0],[.4,2.9,0],[.4,3,.05]],.028,material(C.edge));
 const dial=cylinder(gauge,.29,.29,.1,.4,3.13,.09,material(C.dark));dial.rotation.x=Math.PI/2;
 const face=mesh(new T.CircleGeometry(.25,48),material(0xf1f4f6),gauge,.4,3.13,.147);
 for(let i=0;i<=10;i++){const a=(1.25-i*.15)*Math.PI;line(gauge,[[.4+.2*Math.cos(a),3.13+.2*Math.sin(a),.152],[.4+.23*Math.cos(a),3.13+.23*Math.sin(a),.152]],C.dark);}
 const needle=new T.Group();needle.position.set(.4,3.13,.16);gauge.add(needle);line(needle,[[0,0,0],[.2,0,0]],C.orange);
 return {target:[-.2,1.65,0],distance:8.7,update(t,{condition}){const s=proofState(t,condition);article.scale.set(1,1+s.deformation*.025,1+s.deformation*.025);needle.rotation.z=(1.25-1.5*s.level)*Math.PI;}};
}
const BUILDERS={dome,weld:welding,material:tensile,panels:machining,inspection,proof};

export function createEquipment(el,kind,onSelect){
 const host=el.querySelector('[data-equipment-canvas]');
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;host.append(renderer.domElement);
 const scene=new T.Scene(),root=new T.Group();scene.add(root);
 const hemi=new T.HemisphereLight(0xeaf5ff,0x4e647a,2.6);scene.add(hemi);
 const key=new T.DirectionalLight(0xffffff,3.2);key.position.set(4,7,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-6;key.shadow.camera.right=6;key.shadow.camera.top=7;key.shadow.camera.bottom=-5;key.shadow.bias=-.0008;scene.add(key);
 const fill=new T.DirectionalLight(0x9ce8ff,1.5);fill.position.set(-4,3,-5);scene.add(fill);
 const ground=mesh(new T.PlaneGeometry(200,200),material(0xe2e9ed,{metalness:0,roughness:1}),scene,0,kind==='dome'?-.65:0,0);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
 const grid=new T.GridHelper(14,28,0x9cb1bf,0xc5d2dc);grid.position.y=ground.position.y+.003;grid.material.transparent=true;grid.material.opacity=.32;scene.add(grid);
 const model=BUILDERS[kind](root),camera=new T.PerspectiveCamera(36,1,.05,180),target=new T.Vector3(...model.target);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(target);controls.enableDamping=false;controls.enablePan=false;controls.minDistance=model.distance*.22;controls.maxDistance=model.distance*2;controls.maxPolarAngle=Math.PI*.49;controls.enableZoom=true;
 // Keep page scrolling predictable. Pinch zoom is handled explicitly for the viewport only.
 renderer.domElement.style.touchAction='none';controls.touches.ONE=T.TOUCH.ROTATE;controls.touches.TWO=T.TOUCH.DOLLY_ROTATE;
 let disposed=false,selected=null,theme;
 function render(){if(disposed||!host.clientWidth)return;renderer.render(scene,camera);}
 controls.addEventListener('change',render);
 function setCamera(view='iso'){
  const d=view==='detail'?model.distance*(kind==='material'?.34:.46):model.distance;
  const look=view==='detail'?(model.focus?new T.Vector3(...model.focus()):kind==='material'?new T.Vector3(0,2.45,.2):kind==='proof'?new T.Vector3(.4,3.13,.1):target):target;
  const offset=view==='front'?new T.Vector3(0,.12,d):view==='side'?new T.Vector3(d,.12,0):new T.Vector3(d*.72,d*.5,d*.85);
  offset.setLength(d);camera.position.copy(look).add(offset);controls.target.copy(look);controls.update();render();
 }
 function resize(){if(!host.clientWidth||!host.clientHeight)return;camera.aspect=host.clientWidth/host.clientHeight;camera.zoom=Math.min(1,camera.aspect/(kind==='material'?.9:1.15));camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight,false);render();}
 function appearance(){const dark=getComputedStyle(el).getPropertyValue('--equipment-theme').trim()==='dark';if(theme===dark)return;theme=dark;ground.material.color.set(dark?0x172632:0xe2e9ed);grid.material.color.set(dark?0x5e8398:0x8da9bb);render();}
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
 const themeObserver=new MutationObserver(appearance);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','class','style']});
 const raycaster=new T.Raycaster(),pointer=new T.Vector2();let down;
 const pointerDown=e=>{down=[e.clientX,e.clientY];};
 const pointerUp=e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);for(const hit of raycaster.intersectObjects(root.children,true)){let o=hit.object;while(o&&!o.userData.part)o=o.parent;if(o?.userData.part){onSelect(o.userData.part,DESC[kind][o.userData.part]);break;}}};
 const keydown=e=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home'].includes(e.key))return;
  e.preventDefault();if(e.key==='Home'){setCamera();return;}
  const offset=camera.position.clone().sub(controls.target),s=new T.Spherical().setFromVector3(offset);
  if(e.key==='ArrowLeft')s.theta-=.15;if(e.key==='ArrowRight')s.theta+=.15;
  if(e.key==='ArrowUp')s.phi=Math.max(.15,s.phi-.12);if(e.key==='ArrowDown')s.phi=Math.min(Math.PI*.49,s.phi+.12);
  if(e.key==='+')s.radius=Math.max(controls.minDistance,s.radius*.85);if(e.key==='-')s.radius=Math.min(controls.maxDistance,s.radius*1.15);
  camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(s));controls.update();render();
 };
 host.addEventListener('keydown',keydown);
 renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);
 function highlight(id){selected=id;root.traverse(o=>{if(!o.isMesh||!o.material.emissive)return;let p=o;while(p&&!p.userData.part)p=p.parent;const active=p?.userData.part===id;o.material.emissive.set(active?0x217e94:0x000000);o.material.emissiveIntensity=active?.5:0;});render();}
 appearance();setCamera();resize();model.update(0,{section:kind==='inspection',condition:true});render();
 return {
  update(t,opts){model.update(t,opts);if(selected)highlight(selected);else render();},
  camera:setCamera,highlight,description:id=>DESC[kind][id],
  dispose(){disposed=true;resizeObserver.disconnect();themeObserver.disconnect();controls.dispose();host.removeEventListener('keydown',keydown);renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
 };
}
