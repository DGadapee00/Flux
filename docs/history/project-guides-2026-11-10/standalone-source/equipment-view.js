import { SCENES, clampProgress, weldState, tensileState, scanState, proofState } from './equipment-state.js';
import './equipment.css';
import { COMPONENT_DESCRIPTIONS } from './equipment-descriptions.js';
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PARTS = {
  dome: [['gores','Gore panels'],['lands','Weld lands'],['ring','Interface ring'],['fitting','Crown fitting']],
  weld: [['spindle','Spindle'],['shoulder','Shoulder'],['pin','Pin'],['plate','Panel edges'],['backing','Backing anvil'],['clamps','Clamps']],
  material: [['frame','Load frame'],['grips','Wedge grips'],['specimen','Dog-bone specimen'],['gauge','Extensometer']],
  panels: [['spindle','Spindle / cutter'],['panel','Curved panel'],['lands','Weld lands'],['fixture','Contoured fixture']],
  inspection: [['probe','Array and wedge'],['plate','Welded panel'],['beam','Sound paths'],['flaw','Illustrative reflector']],
  proof: [['vessel','Test article'],['gauge','Pressure sensing'],['line','Test connection'],['supports','Saddles']]
};
export function equipmentHtml(kind, compact = false) {
  const s=SCENES[kind];
  return `<section class="equipment-view${compact ? ' equipment-compact' : ''}" data-equipment-scene="${kind}" aria-label="${s.title}">
    <header class="equipment-heading"><div><p class="app-kicker">Interactive equipment study</p><h5>${s.title}</h5><p>${s.subtitle}</p></div><span class="equipment-badge">3D · ${kind === 'dome' ? 'Assembly' : 'Process'}</span></header>
    <div class="equipment-stage" data-equipment-stage><div class="equipment-canvas" data-equipment-canvas tabindex="0" role="img" aria-label="${s.title}. Drag to orbit; use the view and component buttons for keyboard access."></div><div class="equipment-loading" data-equipment-loading>Preparing the assembly…</div><div class="equipment-stage-note">${kind === 'inspection' ? 'SECTION THROUGH THE JOINT' : kind === 'dome' ? 'APPROXIMATE GEOMETRY' : 'REPRESENTATIVE SETUP'}</div><div class="equipment-view-tools" aria-label="Camera views"><button type="button" data-equipment-camera="iso" aria-label="Reset to three quarter view">↗ <span>Perspective</span></button><button type="button" data-equipment-camera="front">Front</button><button type="button" data-equipment-camera="side">Side</button><button type="button" data-equipment-camera="detail">Detail</button></div><span class="equipment-orbit-hint">Drag to orbit · pinch to zoom</span></div>
    <div class="equipment-bottom"><div class="equipment-transport"><button type="button" class="equipment-play" data-equipment-play aria-label="Play ${s.slider.toLowerCase()}" aria-pressed="false">▶ <span>Play</span></button><label><span>${s.slider}</span><input type="range" min="0" max="100" step="0.1" value="${kind === 'inspection' ? 50 : 0}" data-equipment-progress aria-label="${s.slider}"><span class="equipment-range-ends"><span>${s.start}</span><span>${s.end}</span></span></label><button type="button" data-equipment-reset>Reset</button></div>
      <div class="equipment-options">${['weld','inspection','dome'].includes(kind) ? `<label><input type="checkbox" data-equipment-section ${kind === 'inspection' ? 'checked' : ''}>${kind === 'dome' ? 'Reveal interior' : kind === 'weld' ? 'Reveal pin and backing' : 'Reveal sound paths'}</label>` : ''}${kind === 'inspection' ? '<label><input type="checkbox" data-equipment-condition checked>Include internal reflector</label>' : kind === 'proof' ? '<label><input type="checkbox" data-equipment-condition>Show permanent set</label>' : ''}</div>
      <div class="equipment-parts" aria-label="Inspect assembly components">${PARTS[kind].map(([id,label])=>`<button type="button" data-equipment-part="${id}" aria-pressed="false"><i></i>${label}</button>`).join('')}</div><div class="equipment-selection" data-equipment-selection role="status">Select a component to see what it does.</div>
      <div class="equipment-monitor" data-equipment-monitor aria-label="Synchronized teaching readout"></div>
      <p class="equipment-caption">${s.note}</p></div></section>`;
}
function chart(points, marker, xLabel, yLabel, xMax, yMax) {
  const x=v=>48+v/xMax*352, y=v=>142-v/yMax*110;
  return `<figure class="instrument-figure equipment-chart"><svg viewBox="0 0 440 190" role="img" aria-label="${esc(yLabel)} versus ${esc(xLabel)}, with the current point highlighted"><g class="equipment-chart-grid">${[0,.5,1].map(t=>`<path d="M48 ${y(t*yMax)}H400"/><text x="40" y="${y(t*yMax)+4}" text-anchor="end">${+(t*yMax).toFixed(1)}</text><text x="${x(t*xMax)}" y="160" text-anchor="middle">${+(t*xMax).toFixed(1)}</text>`).join('')}</g><path class="equipment-chart-axis" d="M48 25V142H408"/><polyline class="equipment-chart-line" points="${points.map(p=>`${x(p[0])},${y(p[1])}`).join(' ')}"/><circle class="equipment-chart-point" cx="${x(marker[0])}" cy="${y(marker[1])}" r="5"/><text x="48" y="16">${yLabel}</text><text x="220" y="183" text-anchor="middle">${xLabel}</text></svg><figcaption>Illustrative data linked to the current process position.</figcaption></figure>`;
}
export function monitorHtml(kind, value, condition=true) {
  const t=clampProgress(value); let phase, readings=[], plot='', explanation;
  if (kind==='dome') {
    phase=t > .01 ? 'Assembly separated' : 'Assembled shell';
    readings=[['Panels','8 gores'],['View','Oblate dome'],['Separation',`${Math.round(t*100)}%`]];
    explanation='Separate the gores to see the crown fitting, thickened seam edges and interface ring. The barrel attaches at the ring.';
  } else if (kind==='material') {
    const s=tensileState(t); phase=s.phase;
    readings=[['Engineering strain',`${s.strainPct.toFixed(2)}%`],['Engineering stress',`${s.stressMPa.toFixed(0)} MPa`],['Load',`${(s.forceN/1000).toFixed(2)} kN`]];
    plot=chart(Array.from({length:101},(_,i)=>{const p=tensileState(i/100);return [p.strainPct,p.stressMPa];}),[s.strainPct,s.stressMPa],'Engineering strain, %','Engineering stress, MPa',12,450);
    explanation=s.broken ? 'The specimen separates in its reduced section and the load falls. Review the full curve and test validity.' : 'The load cell measures force. The extensometer measures local extension. Engineering stress uses the original 48 mm² area; the animation exaggerates deformation.';
  } else if (kind==='weld') {
    const s=weldState(t); phase=s.phase;
    readings=[['Tool rotation',s.rotating?'Shown rotating':'Stopped'],['Pin engagement',`${Math.round(s.plunge*100)}% shown`],['Seam travel',`${Math.round(s.travel*100)}%`]];
    plot=chart([[0,0],[18,0],[32,1],[80,1],[96,0],[100,0]],[100*t,s.plunge],'Cycle progression, %','Shown engagement',100,1);
    explanation=({Ready:'The tool is clear of the joint. Check panel alignment, clamps, backing and the approved procedure.',Plunge:'The pin enters the joint and the shoulder meets the upper surface. The backing supports the load; it is not another tool shoulder.',Traverse:'The rotating pin moves along the joint. The shoulder remains at the surface while the pin stirs material through most of the thickness.',Withdraw:'The tool withdraws at the planned termination. A conventional fixed pin leaves an exit hole that must be accounted for.',Review:'Preserve the machine record and inspect the joint. A completed animation is not evidence of an acceptable weld.'})[phase];
  } else if (kind==='inspection') {
    const s=scanState(t,condition); phase=s.phase;
    readings=[['Probe travel',`${Math.round(t*100)}%`],['Internal echo',`${s.echo.toFixed(0)}% relative`],['Back-wall echo',`${s.backwall.toFixed(0)}% relative`]];
    const points=Array.from({length:161},(_,i)=>{const x=i*50/160;return [x,5+35*Math.exp(-(((x-4)/.7)**2))+s.echo*Math.exp(-(((x-24)/1.2)**2))+s.backwall*Math.exp(-(((x-43)/1.1)**2))];});
    plot=chart(points,[24,5+s.echo],'Sound-path distance, mm','Relative amplitude, %',50,100);
    explanation='Synthetic A-scan: entry response at the left, an internal response near the middle when the beam crosses the reflector, and a back-wall echo farther along the sound path. Interpret signals with a qualified scan plan.';
  } else if (kind==='panels') {
    phase=t===1?'Contour pass complete':'Following the curved surface';
    readings=[['Path complete',`${Math.round(t*100)}%`],['Tool','Vertical end mill'],['Edge lands','Left uncut']];
    plot=chart(Array.from({length:101},(_,i)=>[i,.25+.35*Math.cos(i/100*Math.PI)**2]),[100*t,.25+.35*Math.cos(t*Math.PI)**2],'Path progression, %','Relative contour height',100,1);
    explanation='The cutter follows the changing surface height while the contoured fixture supports the formed panel. The thicker edge bands are reserved for joining. Stock removal is simplified.';
  } else {
    const s=proofState(t,condition);phase=s.phase;
    readings=[['Applied load',`${Math.round(s.level*100)}% of example peak`],['Diameter change',`${s.deformation.toFixed(2)} mm`],['Cycle',s.loading?'Loading':'Unloading']];
    const points=Array.from({length:101},(_,i)=>{const p=proofState(i/100,condition);return [p.level*100,p.deformation];});
    plot=chart(points,[s.level*100,s.deformation],'Applied load, % of example peak','Diameter change, mm',100,1);
    explanation='Watch the same path during loading and unloading. Permanent set leaves a nonzero change after unloading. Compare it with the measurement uncertainty and the approved test criteria.';
  }
  return `<div class="equipment-readout-top"><span class="equipment-live-dot"></span><strong>${phase}</strong><span>TEACHING READOUT</span></div><dl class="equipment-readings">${readings.map(([a,b])=>`<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>${plot}<p class="equipment-process-explanation">${explanation}</p>`;
}

/** Lazy, bounded lifecycle: hidden equipment does not animate or allocate a renderer. */
export function mountEquipment(root) {
  const views=new Map(); let library;
  const load=()=>library ||= import('./equipment-3d.js');
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){const v=views.get(entry.target);if(!v)continue;v.visible=entry.isIntersecting;if(v.visible)initialize(v);else pause(v);}}, {rootMargin:'80px'});
  function pause(v){v.playing=false;cancelAnimationFrame(v.frame);const b=v.el.querySelector('[data-equipment-play]');b.setAttribute('aria-pressed','false');b.innerHTML='▶ <span>Play</span>';}
  async function initialize(v){
    if(v.controller || v.loading || v.failed)return;
    v.loading=true;
    try {
      const { createEquipment }=await load();
      if(!v.el.isConnected||!v.visible)return;
      v.controller=createEquipment(v.el, v.kind, (id,text)=>select(v,id,text));
      v.el.dataset.equipmentReady='true';v.el.querySelector('[data-equipment-loading]').hidden=true;
      update(v);if(v.selected)v.controller.highlight(v.selected);
    } catch {
      v.failed=true;v.el.dataset.equipmentReady='fallback';v.el.querySelector('[data-equipment-loading]').textContent='3D is unavailable in this browser. Use the process slider and component guide below.';
      // Keep the lesson and synchronized readout usable without WebGL.
      v.el.querySelector('[data-equipment-canvas]').setAttribute('aria-label','3D unavailable; the text guide and process readout remain available.');
    } finally {v.loading=false;}
  }
  function select(v,id,text){
    v.selected=id;
    for(const b of v.el.querySelectorAll('[data-equipment-part]'))b.setAttribute('aria-pressed',String(b.dataset.equipmentPart===id));
    v.controller?.highlight(id);
    v.el.querySelector('[data-equipment-selection]').textContent=text || COMPONENT_DESCRIPTIONS[v.kind][id];
  }
  function update(v){
    v.el.querySelector('[data-equipment-monitor]').innerHTML=monitorHtml(v.kind,v.t,v.el.querySelector('[data-equipment-condition]')?.checked ?? true);
    v.controller?.update(v.t,{section:!!v.el.querySelector('[data-equipment-section]')?.checked,condition:v.el.querySelector('[data-equipment-condition]')?.checked ?? true});
  }
  function refresh(){
    for(const [el,v]of views)if(!el.isConnected){pause(v);observer.unobserve(el);v.controller?.dispose();views.delete(el);}
    for(const el of root.querySelectorAll('[data-equipment-scene]'))if(!views.has(el)){
      const v={el,kind:el.dataset.equipmentScene,t:Number(el.querySelector('[data-equipment-progress]').value)/100,playing:false,visible:false};views.set(el,v);update(v);observer.observe(el);
    }
  }
  root.addEventListener('input',event=>{
    if(!event.target.matches('[data-equipment-progress]'))return;
    const v=views.get(event.target.closest('[data-equipment-scene]'));pause(v);v.t=Number(event.target.value)/100;update(v);
  });
  root.addEventListener('change',event=>{if(event.target.matches('[data-equipment-section],[data-equipment-condition]'))update(views.get(event.target.closest('[data-equipment-scene]')));});
  root.addEventListener('click',event=>{
    const el=event.target.closest('[data-equipment-scene]'),v=views.get(el);if(!v)return;
    const part=event.target.closest('[data-equipment-part]');
    if(part){const id=part.dataset.equipmentPart;select(v,id,COMPONENT_DESCRIPTIONS[v.kind][id]);return;}
    const cam=event.target.closest('[data-equipment-camera]');if(cam){v.controller?.camera(cam.dataset.equipmentCamera);return;}
    if(event.target.closest('[data-equipment-reset]')){pause(v);v.t=v.kind==='inspection'?.5:0;el.querySelector('[data-equipment-progress]').value=v.t*100;v.controller?.camera('iso');update(v);return;}
    if(event.target.closest('[data-equipment-play]')){
      if(v.playing){pause(v);return;}if(v.t>=1)v.t=0;
      v.playing=true;let previous;const button=el.querySelector('[data-equipment-play]');button.innerHTML='Ⅱ <span>Pause</span>';button.setAttribute('aria-pressed','true');
      function tick(now){if(!v.playing||!el.isConnected||!v.visible)return;if(previous&&now-previous<33){v.frame=requestAnimationFrame(tick);return;}const dt=previous?Math.min(50,now-previous):0;previous=now;v.t=Math.min(1,v.t+dt/14000);el.querySelector('[data-equipment-progress]').value=v.t*100;update(v);if(v.t>=1)pause(v);else v.frame=requestAnimationFrame(tick);}
      v.frame=requestAnimationFrame(tick);
    }
  });
  refresh();return {refresh};
}
