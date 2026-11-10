import { LESSONS } from './dome-course.js';
import { WORKSHOPS, WORKSHOP_VERSION, CAPABILITIES, gradePractice } from './dome-workshop.js';
import { stageNav, stageStart, stageNext, showStage, workedHtml, practiceHtml, reviewHtml, noteTemplate, traceReading, STAGES } from './dome-workshop-ui.js';
import { equipmentHtml } from './equipment-view.js';
import { sceneForStation } from './equipment-state.js';
const KEY = 'flux.projects.dome-course.v1';
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function mountDomeCourse(parent, traveler, inputs) {
  let records = {};
  let durable = true;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      if (saved._inputs && typeof saved._inputs.pressureKPa === 'string' && typeof saved._inputs.diameterM === 'string') Object.assign(inputs, { pressureKPa: saved._inputs.pressureKPa, diameterM: saved._inputs.diameterM });
      for (const id of Object.keys(LESSONS)) {
        const r = saved[id];
        if (r && typeof r.note === 'string') records[id] = normalizeRecord(id, r);
      }
    }
  } catch { durable = false; }
  let parameterSnapshot = JSON.stringify(inputs);
  const record = id => records[id] ||= normalizeRecord(id, {});
  function normalizeRecord(id, r) {
    const next = { note: typeof r.note === 'string' ? r.note : '', answer: Number.isInteger(r.answer) ? r.answer : null, complete: r.complete === true, practiceValue: typeof r.practiceValue === 'string' ? r.practiceValue : '', practiceChoice: Number.isInteger(r.practiceChoice) ? r.practiceChoice : null, practiceChecked: r.workshopVersion === WORKSHOP_VERSION && r.practiceChecked === true, review: Array.from({length: 4}, (_, i) => r.review?.[i] === true), workshopVersion: WORKSHOP_VERSION };
    next.complete = next.complete && ready(id, next);
    return next;
  }
  function ready(id, r) {
    return r.answer === LESSONS[id].answer && !!r.note.trim() && r.note !== noteTemplate(id) && r.review.every(Boolean) && r.practiceChecked && gradePractice(id, r.practiceValue, r.practiceChoice).passed;
  }
  function feedback(id, r) {
    if (!r.practiceChecked) return '';
    const g = gradePractice(id, r.practiceValue, r.practiceChoice);
    return `${g.numeric ? 'Calculation matches.' : 'Recheck the calculation, units and entry.'} ${g.decision ? 'Decision matches the evidence.' : 'Reconsider what the evidence supports.'} ${g.passed ? 'Practice passed. Explain why in your build record.' : 'Both parts need to match to pass this practice.'}`;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ ...records, _inputs: { ...inputs } })); durable = true; } catch { durable = false; }
    update();
  }
  function update() {
    const count = Object.values(records).filter(r => r.complete).length;
    parent.querySelector('[data-course-progress]').textContent = `${count} of ${traveler.stations.length} lessons completed`;
    parent.querySelector('[data-course-bar]').value = count;
    parent.querySelector('[data-capability-progress]').innerHTML = CAPABILITIES.map(c => `<div><dt>${esc(c.title)} <span>${c.stations.filter(id => records[id]?.complete).length}/${c.stations.length} lessons</span></dt><dd>${esc(c.evidence)}</dd></div>`).join('');
    const passed = Object.entries(records).filter(([id,r]) => r.practiceChecked && gradePractice(id, r.practiceValue, r.practiceChoice).passed).length;
    parent.querySelector('[data-practice-progress]').textContent = `${passed} of ${traveler.stations.length} applied practices passed. Written reasoning is self-reviewed and should be challenged by a mentor.`;
    for (const b of parent.querySelectorAll('.route [data-station]')) {
      const done = !!records[b.dataset.station]?.complete;
      const r = records[b.dataset.station];
      b.querySelector('[data-course-status]').textContent = done ? 'Completed' : r?.practiceChecked && gradePractice(b.dataset.station, r.practiceValue, r.practiceChoice).passed ? 'Build record due' : r?.note.trim() ? 'Applied practice due' : 'To explore';
    }
    const lesson = parent.querySelector('[data-lesson]');
    if (!lesson) return;
    const id = lesson.dataset.lesson, r = record(id);
    const canComplete = ready(id, r);
    const button = lesson.querySelector('[data-lesson-complete]');
    button.disabled = !canComplete || r.complete;
    button.textContent = r.complete ? 'Lesson completed' : 'Mark lesson complete';
    lesson.querySelector('[data-practice-feedback]').textContent = feedback(id, r);
    lesson.querySelector('[data-save-status]').textContent = durable ? 'Saved in this browser. Export your build plan to keep a copy.' : 'Browser storage is unavailable. Export your build plan before leaving.';
    lesson.querySelector('[data-complete-hint]').textContent = r.complete ? 'You can revisit any lesson and revise your notes.' : 'Complete the knowledge check, pass the applied practice, write your build note and review all four criteria.';
  }
  function html(id) {
    const l = LESSONS[id], r = record(id);
    return `<section class="course-lesson" data-lesson="${id}" aria-label="Guided lesson">
      <p class="app-kicker">Learn → calculate → diagnose → explain</p><h4>${esc(l.goal)}</h4>${stageNav()}${stageStart('learn')}<p>${esc(l.terms)}</p>
      <h5>Walk through it</h5><ol class="course-steps">${l.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      <div class="course-machine"><p class="app-kicker">Equipment walkthrough</p><h5>${esc(l.machine)}</h5><p>${esc(l.setup)}</p>
        ${['requirement','design','acceptance'].includes(id) ? '' : equipmentHtml(sceneForStation(id))}<div class="course-observations"><section><h5>Expected evidence</h5><p>${esc(l.good)}</p></section><section><h5>Investigate or hold</h5><p>${esc(l.bad)}</p></section></div>
        <p class="app-meta">Teaching examples. Use the qualified procedure and approved acceptance criteria for actual readings and limits. Sources and the detailed shop reference follow below.</p>
      </div>
      <fieldset class="course-check"><legend>Check your understanding</legend><p>${esc(l.question)}</p>${l.options.map((o, i) => `<label><input type="radio" name="lesson-${id}" value="${i}" data-lesson-answer ${r.answer === i ? 'checked' : ''}> <span>${esc(o)}</span></label>`).join('')}<p data-lesson-feedback role="status">${r.answer === null ? '' : esc((r.answer === l.answer ? 'Correct. ' : 'Reconsider. ') + l.explain)}</p></fieldset>
      ${stageNext('worked', 'Work through an example')}</div>
      ${workedHtml(id)}${practiceHtml(id, r)}${stageStart('record')}
      <h5>Your part of the build plan</h5><p>Use the prompts to explain your decisions. Keep the measurements, assumptions and remaining questions visible.</p><button class="copy-button" type="button" data-note-template>Insert build-record prompts</button><p class="app-meta" data-template-status role="status"></p>
      <label class="course-notebook" for="course-note"><strong>Your build note</strong><span>${esc(l.task)}</span><textarea id="course-note" rows="5" data-lesson-note placeholder="Explain the decision in your own words…">${esc(r.note)}</textarea></label>
      ${reviewHtml(id, r)}
      <p class="app-meta" data-save-status role="status"></p><div class="copy-row"><button class="copy-button" type="button" data-lesson-complete>Mark lesson complete</button><span class="app-meta" data-complete-hint></span></div></div>
    </section>`;
  }
  parent.addEventListener('change', event => {
    const box = event.target.closest('[data-lesson]');
    if (!box) return;
    const current = record(box.dataset.lesson);
    if (event.target.matches('[data-practice-choice]')) { current.practiceChoice = Number(event.target.value); current.practiceChecked = false; current.complete = false; save(); return; }
    if (event.target.matches('[data-record-review]')) { current.review[Number(event.target.dataset.recordReview)] = event.target.checked; if (!event.target.checked) current.complete = false; save(); return; }
    if (!event.target.matches('[data-lesson-answer]')) return;
    const id = box.dataset.lesson, r = record(id), l = LESSONS[id];
    r.answer = Number(event.target.value);
    if (r.answer !== l.answer) r.complete = false;
    box.querySelector('[data-lesson-feedback]').textContent = (r.answer === l.answer ? 'Correct. ' : 'Reconsider. ') + l.explain;
    save();
  });
  parent.addEventListener('input', event => {
    if (event.target.matches('[data-dome-form] input')) {
      if (JSON.stringify(inputs) !== parameterSnapshot) {
        parameterSnapshot = JSON.stringify(inputs);
        for (const r of Object.values(records)) { r.complete = false; r.review = [false, false, false, false]; }
        parent.querySelectorAll('[data-record-review]').forEach(c => { c.checked = false; });
        parent.querySelector('[data-parameter-status]').textContent = 'Sizing inputs changed. Your notes and practice are kept; review the build decisions against the new inputs before completing them again.';
      }
      save(); return;
    }
    if (event.target.matches('[data-practice-number]')) { const r = record(event.target.closest('[data-lesson]').dataset.lesson); r.practiceValue = event.target.value; r.practiceChecked = false; r.complete = false; save(); return; }
    if (!event.target.matches('[data-lesson-note]')) return;
    const r = record(event.target.closest('[data-lesson]').dataset.lesson);
    r.note = event.target.value;
    r.complete = false; r.review = [false, false, false, false];
    for (const checkbox of event.target.closest('[data-lesson]').querySelectorAll('[data-record-review]')) checkbox.checked = false;
    save();
  });
  parent.addEventListener('submit', event => {
    if (!event.target.matches('[data-practice-form]')) return;
    event.preventDefault();
    const r = record(event.target.closest('[data-lesson]').dataset.lesson);
    r.practiceChecked = true; save();
  });
  parent.addEventListener('keydown', event => {
    if (!event.target.matches('[data-stage]') || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); const i = STAGES.findIndex(([id]) => id === event.target.dataset.stage);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? STAGES.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + STAGES.length) % STAGES.length;
    showStage(event.target.closest('[data-lesson]'), STAGES[next][0], true);
  });
  parent.addEventListener('click', event => {
    const stage = event.target.closest('[data-stage], [data-stage-next]');
    if (stage) { showStage(stage.closest('[data-lesson]'), stage.dataset.stage || stage.dataset.stageNext, true); return; }
    const template = event.target.closest('[data-note-template]');
    if (template) {
      const box = template.closest('[data-lesson]'), r = record(box.dataset.lesson);
      if (r.note.trim()) { box.querySelector('[data-template-status]').textContent = 'Your note is kept. Add any missing prompts from the worked example.'; return; }
      r.note = noteTemplate(box.dataset.lesson); box.querySelector('[data-lesson-note]').value = r.note; save(); return;
    }
    const trace = event.target.closest('[data-trace-point]');
    if (trace) {
      const box = trace.closest('[data-lesson]');
      for (const b of box.querySelectorAll('[data-trace-point]')) b.setAttribute('aria-pressed', String(b === trace));
      box.querySelector('[data-trace-status]').textContent = traceReading(box.dataset.lesson, Number(trace.dataset.tracePoint)); return;
    }
    if (event.target.closest('[data-lesson-complete]')) {
      const id = event.target.closest('[data-lesson]').dataset.lesson, r = record(id);
      if (ready(id, r)) { r.complete = true; save(); }
    }
    if (event.target.closest('[data-course-resume]')) {
      const next = traveler.stations.find(s => !records[s.id]?.complete) || traveler.stations[0];
      parent.querySelector(`.route [data-station="${next.id}"]`).click();
    }
    if (event.target.closest('[data-course-export]')) {
      const text = ['# Tank dome: my build plan', 'Learning record, not a hardware release or qualified operating procedure. Completion records checks and self-review, not a measured literacy percentage.', '\n## Mentor review brief\nAsk me to explain the route without the lesson text. Recompute calculations independently, check units, challenge material and process choices, and examine how each claim connects to evidence. Mark each build-record criterion met, partly met or missing with reasons. Ask me to resolve the changed-pressure capstone. Identify my next learning task. Do not treat course practice limits as real specifications.', `\nEntered sizing inputs (invalid entries use the example in the calculator): ${inputs.pressureKPa} kPa; ${inputs.diameterM} m.`, ...traveler.stations.map((s, i) => `\n## ${i + 1}. ${s.title} (${records[s.id]?.complete ? 'completed' : 'in progress'})\n${LESSONS[s.id].task}\n\n${records[s.id]?.note || '[No build note yet]'}\n\nApplied practice (${records[s.id]?.practiceChecked && gradePractice(s.id, records[s.id].practiceValue, records[s.id].practiceChoice).passed ? 'passed' : 'not yet passed'}): ${WORKSHOPS[s.id].practice.prompt}\nEntered: ${records[s.id]?.practiceValue || '[none]'} ${WORKSHOPS[s.id].practice.unit}; decision: ${WORKSHOPS[s.id].practice.options[records[s.id]?.practiceChoice] || '[none]'}\n\nSelf-review criteria (not an automated assessment):\n${WORKSHOPS[s.id].rubric.map((text, i) => `- [${records[s.id]?.review?.[i] ? 'x' : ' '}] ${text}`).join('\n')}\n\nTransfer challenge: ${WORKSHOPS[s.id].transfer}\n\nReferences:\n${s.sources.map(id => traveler.references.find(r => r.id === id)?.url).join('\n')}`)].join('\n');
      const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = 'flux-tank-dome-build-plan.md'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });
  return { html, update };
}
