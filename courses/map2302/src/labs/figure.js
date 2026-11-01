// Course figures only. The shell owns every panel, control layout and navigation element.
import * as THREE from 'three';
import { ANSWER_LAYER } from '@flux/core/scene3d/manim.js';
export { THREE, ANSWER_LAYER };
export const C={ink:0xece6e2,blue:0x58c4dd,gold:0xf4d345,muted:0x77716c,pink:0xfc6255};
export function clear(group){while(group.children.length){const o=group.children[0];group.remove(o);o.traverse(x=>{x.geometry?.dispose();if(x.material){x.material.map?.dispose();x.material.dispose();}});}}
export function line(group,points,color=C.blue,answer=true){
 const pts=points.filter(p=>p.every(Number.isFinite)).map(p=>new THREE.Vector3(...p));
 const o=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color}));if(answer)o.layers.set(ANSWER_LAYER);group.add(o);return o;
}
export function dot(group,x,y,color=C.gold,answer=true,r=.07){const o=new THREE.Mesh(new THREE.CircleGeometry(r,24),new THREE.MeshBasicMaterial({color}));o.position.set(x,y,.03);if(answer)o.layers.set(ANSWER_LAYER);group.add(o);return o;}
export function label(group,text,x,y,color='#aaa39e'){
 const cv=document.createElement('canvas');cv.width=1024;cv.height=64;const ctx=cv.getContext('2d');ctx.font='34px Georgia';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(text,512,40);
 const texture=new THREE.CanvasTexture(cv),o=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));o.scale.set(7.2,.45,1);o.position.set(x,y,.1);group.add(o);return o;
}
export function axes(group,xLabel,yLabel){line(group,[[-3,-2,0],[3,-2,0]],C.muted,false);line(group,[[-3,-2,0],[-3,2,0]],C.muted,false);label(group,xLabel,1.7,-2.35);label(group,yLabel,-1.7,2.35);}
export const cameraFor=()=>({pos:new THREE.Vector3(typeof window!=='undefined'&&innerWidth>720?-1:0,typeof window!=='undefined'&&innerWidth<721?-.6:0,typeof window!=='undefined'&&innerWidth<721?22:17),target:new THREE.Vector3(typeof window!=='undefined'&&innerWidth>720?-1:0,typeof window!=='undefined'&&innerWidth<721?-.6:0,0)});
export const map=(v,lo,hi,a=-3,b=3)=>a+(v-lo)*(b-a)/(hi-lo);
export function chart(group,xs,ys,{xLabel='t',yLabel='y',ymin,ymax,color=C.blue}={}){
 if(ymin==null)ymin=Math.min(0,...ys);if(ymax==null)ymax=Math.max(1,...ys);if(ymax-ymin<1e-8)ymax=ymin+1;
 axes(group,xLabel,yLabel);line(group,xs.map((x,i)=>[map(x,xs[0],xs.at(-1)),map(ys[i],ymin,ymax,-2,2),0]),color);
 label(group,`${Number(xs[0].toPrecision(3))}`, -3,-2.35);label(group,`${Number(xs.at(-1).toPrecision(3))}`,3,-2.35);label(group,`${Number(ymin.toPrecision(3))}`, -3.45,-2);label(group,`${Number(ymax.toPrecision(3))}`,-3.45,2);
}
export function initFigure(ctx){const group=new THREE.Group();ctx.scene.add(group);return {group};}
export const enterFigure=(ctx,h)=>{ctx.grid.group.visible=false;h.group.visible=true;};
export const exitFigure=(ctx,h)=>{h.group.visible=false;};
