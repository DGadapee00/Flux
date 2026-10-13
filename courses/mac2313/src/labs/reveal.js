/** Play / step through a Riemann sum. `anim.i` is how many terms are on screen; 1e9 means all of them. */

export function ensureAnim(state) {
  if (!state.anim) state.anim = { playing: false, i: 1e9, t: 0 };
  if (state.cell == null || !Number.isFinite(state.cell)) state.cell = 0;
}

export function shownCount(state, total) {
  const i = state.anim?.i;
  if (i == null || i >= total) return total;
  return Math.max(0, i | 0);
}

export function tickReveal(dt, state, total, every = 0.08) {
  const a = state.anim;
  if (!a?.playing || total <= 0) return false;
  if ((a.i | 0) <= 0) {
    a.i = 1;
    a.t = 0;
    state.cell = 0;
    if (total <= 1) {
      a.playing = false;
      a.i = 1e9;
    }
    return true;
  }
  a.t = (a.t || 0) + dt;
  if (a.t < every) return false;
  const jumps = Math.max(1, Math.floor(a.t / every));
  a.t -= jumps * every;
  a.i = Math.min(total, (a.i | 0) + jumps);
  state.cell = Math.max(0, a.i - 1);
  if (a.i >= total) {
    a.playing = false;
    a.i = 1e9;
    state.cell = total - 1;
  }
  return true;
}

export function showAll(state) {
  ensureAnim(state);
  state.anim.playing = false;
  state.anim.i = 1e9;
}

export function onTermAction(action, state, total) {
  if (total <= 0) return false;
  if (action !== 'next' && action !== 'prev') return false;
  showAll(state);
  const dir = action === 'next' ? 1 : -1;
  state.cell = (((state.cell | 0) + dir) % total + total) % total;
  return true;
}

export function playControls(id) {
  return `
    <div class="seg">
      <button type="button" id="${id}-play">Play</button>
      <button type="button" id="${id}-step">Step</button>
    </div>
    <p class="tiny">Arrows move the highlighted cell. Click the floor to pick one.</p>`;
}

export function bindPlay(id, api, totalOf) {
  document.getElementById(`${id}-play`).addEventListener('click', () => {
    const s = api.slice();
    ensureAnim(s);
    if (s.anim.playing) {
      s.anim.playing = false;
      s.anim.i = 1e9;
    } else {
      s.anim.playing = true;
      s.anim.i = 0;
      s.anim.t = 0;
    }
    // bump() with its default argument stops every animation, including the one this click just started.
    api.bump(false);
  });
  document.getElementById(`${id}-step`).addEventListener('click', () => {
    const s = api.slice();
    ensureAnim(s);
    const total = Math.max(1, totalOf(s));
    s.anim.playing = false;
    const i = s.anim.i >= total ? 0 : s.anim.i | 0;
    s.anim.i = Math.min(total, i + 1);
    s.cell = Math.max(0, s.anim.i - 1);
    api.bump();
  });
}

export function syncPlayButton(id, state) {
  const b = document.getElementById(`${id}-play`);
  if (b) b.textContent = state.anim?.playing ? 'Pause' : 'Play';
}

export function plain(n) {
  if (!Number.isFinite(n)) return '—';
  const a = Math.abs(n);
  if (a < 1e-8) return '0';
  if (a >= 100) return n.toFixed(1);
  return String(Number(n.toFixed(2)));
}
