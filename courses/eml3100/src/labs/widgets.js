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

/**
 * An application lab's explainer ends with what the course model leaves out (D30). `out` is that
 * paragraph; it is added after the lab's own body in every branch of `coach`.
 */
export function leavesOut(out, coach) {
  const label = '<b>What the course model leaves out.</b>';
  return (state, c) => {
    const k = coach(state, c);
    return { ...k, body: [...(Array.isArray(k.body) ? k.body : [k.body]), `${label} ${out}`] };
  };
}
