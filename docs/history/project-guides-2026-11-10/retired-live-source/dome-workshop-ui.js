import { WORKSHOPS, practicePlot } from './dome-workshop.js';
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const STAGES = [['learn', 'Learn'], ['worked', 'Worked example'], ['practice', 'Practise'], ['record', 'Build record']];

export function stageNav() {
  return `<div class="lesson-stages" role="tablist" aria-label="Lesson steps">${STAGES.map(([id, label], i) => `<button type="button" role="tab" id="stage-tab-${id}" aria-controls="stage-${id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-stage="${id}"><span>${i + 1}</span>${label}</button>`).join('')}</div>`;
}
export function stageStart(id) {
  return `<div role="tabpanel" id="stage-${id}" aria-labelledby="stage-tab-${id}" tabindex="0" ${id !== 'learn' ? 'hidden' : ''}>`;
}
export function stageNext(id, label) {
  return `<button type="button" class="copy-button stage-next" data-stage-next="${id}">${label} →</button>`;
}
export function showStage(box, id, focus = false) {
  for (const tab of box.querySelectorAll('[data-stage]')) {
    const active = tab.dataset.stage === id;
    tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
  }
  for (const panel of box.querySelectorAll('[role="tabpanel"]')) panel.hidden = panel.id !== `stage-${id}`;
  if (focus) box.querySelector(`#stage-tab-${id}`).focus();
}
export function workedHtml(id) {
  const w = WORKSHOPS[id];
  return `${stageStart('worked')}<h5>${esc(w.title)}</h5><p>${esc(w.story)}</p>
    <p class="app-meta">Original worked teaching example. Numerical examples, quotes and limits here are fictional, not production specifications.</p>
    <ol class="course-steps worked-reasoning">${w.worked.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    <h5>What this step should produce</h5><ul class="decision-list">${w.record.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
    ${stageNext('practice', 'Try it yourself')}</div>`;
}
function traceHtml(id) {
  const plot = practicePlot(id); if (!plot) return '';
  const min = Math.min(plot.low, ...plot.points.map(p => p[1])), max = Math.max(plot.high, ...plot.points.map(p => p[1]));
  const range = (max - min) || 1;
  const x = v => 60 + (v - plot.points[0][0]) / (plot.points.at(-1)[0] - plot.points[0][0]) * 290;
  const y = v => 155 - (v - min) / range * 100;
  return `<div class="practice-trace"><figure><svg viewBox="0 0 410 215" role="img" aria-label="${esc(plot.label)} at four seam locations, with fictional exercise limits"><path d="M60 32V170H365" fill="none" stroke="currentColor"/>
    <text x="60" y="20">${esc(plot.label)}</text><text x="60" y="205">${esc(plot.xLabel)}</text>
    ${[plot.low, plot.high].map(v => `<path d="M60 ${y(v)}H350" class="trace-limit"/><text x="4" y="${y(v) + 4}">${v}</text>`).join('')}
    <polyline points="${plot.points.map(([a,b]) => `${x(a)},${y(b)}`).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2"/>
    ${plot.points.map(([a,b]) => `<circle cx="${x(a)}" cy="${y(b)}" r="4" fill="var(--accent)"/><text x="${x(a)}" y="185" text-anchor="middle">${a}</text>`).join('')}
    </svg><figcaption>Sampled readings. Dashed lines are fictional exercise limits. Select a location to inspect its reading.</figcaption></figure>
    <div class="trace-picks" aria-label="Inspect sampled readings">${plot.points.map(([pos],i) => `<button class="copy-button" type="button" data-trace-point="${i}" aria-pressed="false">${pos} mm</button>`).join('')}</div><p data-trace-status role="status">No reading selected. Compare each sample with the stated band.</p></div>`;
}
export function traceReading(id, index) {
  const plot = practicePlot(id), [pos, value] = plot.points[index];
  return `At ${pos} mm: ${value} ${id === 'weld' ? 'kN' : 'mm'}. Fictional band: ${plot.low} to ${plot.high}. ${value < plot.low || value > plot.high ? 'Outside the band. Preserve the location and investigate under the procedure.' : 'Inside the band at this sample. Other samples and required evidence still need review.'}`;
}
export function practiceHtml(id, r) {
  const p = WORKSHOPS[id].practice;
  return `${stageStart('practice')}<h5>Read the evidence. Make a decision.</h5><p class="training-label">Fictional training record. These values and limits do not describe the NASA article or a production procedure.</p>
    <dl class="practice-data">${p.rows.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${traceHtml(id)}
    <form data-practice-form novalidate><p>${esc(p.prompt)}</p><p class="app-meta">${esc(p.formula)}</p>
    <label class="practice-numeric" for="practice-number"><strong>${esc(p.label)}, ${esc(p.unit)}</strong><input id="practice-number" data-practice-number inputmode="decimal" autocomplete="off" value="${esc(r.practiceValue || '')}"></label>
    <fieldset class="course-check"><legend>Your decision</legend><p>${esc(p.question)}</p>${p.options.map((o, i) => `<label><input type="radio" name="practice-choice" data-practice-choice value="${i}" ${r.practiceChoice === i ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('')}</fieldset>
    <button class="copy-button" type="submit">Check calculation and decision</button><p data-practice-feedback role="status"></p></form>
    <details class="practice-solution"><summary>Show the worked solution</summary><p>${esc(p.reason)}</p><p class="app-meta">After reading it, try explaining the reasoning without the solution.</p></details>
    ${stageNext('record', 'Write your build record')}</div>`;
}
export function reviewHtml(id, r) {
  return `<fieldset class="course-check course-review"><legend>Review your explanation</legend><p>Check each item after you can point to it in your build note. This is your self-review; Flux does not grade the written reasoning.</p>${WORKSHOPS[id].rubric.map((text,i) => `<label><input type="checkbox" data-record-review="${i}" ${r.review?.[i] ? 'checked' : ''}><span>${esc(text)}</span></label>`).join('')}</fieldset>
    <h5>Transfer it to a new situation</h5><p>${esc(WORKSHOPS[id].transfer)}</p><p class="app-meta">Include your response in the build note. The final lesson combines the earlier decisions into a capstone for mentor review.</p>
    ${WORKSHOPS[id].capstone ? `<details class="practice-solution"><summary>Compare your capstone reasoning</summary><p>Write your own response first. A defensible plan should address these connections; different authorized technical solutions may be possible.</p><ol class="course-steps">${WORKSHOPS[id].capstone.map(s => `<li>${esc(s)}</li>`).join('')}</ol></details>` : ''}`;
}
export function noteTemplate(id) {
  return WORKSHOPS[id].record.map((prompt,i) => `${i + 1}. ${prompt}\n[Write your reasoning, evidence and unresolved questions here]`).join('\n\n');
}

