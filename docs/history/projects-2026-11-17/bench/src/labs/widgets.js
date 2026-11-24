export function slider(id, label, val, min, max, step) {
  return `<label class="field" id="${id}-field"><span>${label}</span><div class="slider-row"><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}" /></div></label>`;
}

export function bindSlider(id, write, api) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', (e) => {
    write(api.slice(), Number(e.target.value));
    api.bump(false);
  });
}

export function showField(id, on) {
  const el = document.getElementById(`${id}-field`);
  if (el) el.hidden = !on;
}

/** A choice among a few named options: [[value, label], ...]. */
export function select(id, label, options, value) {
  const opts = options.map(([v, text]) => `<option value="${v}"${String(v) === String(value) ? ' selected' : ''}>${text}</option>`).join('');
  return `<label class="field" id="${id}-field"><span>${label}</span><select id="${id}">${opts}</select></label>`;
}

export function bindSelect(id, write, api) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('change', (e) => {
    write(api.slice(), e.target.value);
    api.bump(false);
  });
}

/** Put a value into a control without fighting the student's own edit. */
export function put(id, value) {
  const el = document.getElementById(id);
  if (el && document.activeElement !== el) el.value = String(value);
}
