/**
 * Play-once motion for a track card.
 *
 * Rest is frame 0. Hover or focus on a device with a real pointer plays the
 * animation once and holds the last frame. A touch device plays it once when
 * the card scrolls into view. Reduced motion stays on frame 0. Hiding the card
 * freezes the frame; showing it again continues.
 *
 * @typedef {{
 *   t: number,
 *   playing: boolean,
 *   visible: boolean,
 *   fineHover: boolean,
 *   reduced: boolean,
 *   touchPlayed: boolean,
 * }} MotionState
 *
 * @typedef {{type:'enter'}
 *   | {type:'tick', dt: number}
 *   | {type:'hide'}
 *   | {type:'show'}
 *   | {type:'reduced', on: boolean}
 * } MotionEvent
 */

/**
 * @param {MotionState} state
 * @param {MotionEvent} event
 * @returns {MotionState}
 */
export function reduceMotion(state, event) {
  switch (event.type) {
    case 'reduced':
      if (event.on) return { ...state, reduced: true, t: 1, playing: false };
      return { ...state, reduced: false };
    case 'enter':
      if (state.reduced || !state.fineHover || state.playing) return state;
      return { ...state, playing: true, t: 0 };
    case 'tick': {
      if (state.reduced || !state.playing || !state.visible) return state;
      const t = Math.min(1, state.t + event.dt);
      return { ...state, t, playing: t < 1 };
    }
    case 'hide':
      return { ...state, visible: false };
    case 'show':
      if (state.reduced) return { ...state, visible: true };
      if (!state.fineHover && !state.touchPlayed) {
        return { ...state, visible: true, playing: true, touchPlayed: true, t: 0 };
      }
      return { ...state, visible: true };
    default: {
      /** @type {never} */
      const unexpected = event;
      throw new Error(`unknown motion event ${JSON.stringify(unexpected)}`);
    }
  }
}

/**
 * @param {HTMLElement} el
 * @param {{ duration?: number, onFrame: (t: number) => void }} options
 */
export function attachMotion(el, { duration = 900, onFrame }) {
  const reducedMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hoverMedia = window.matchMedia('(hover: hover) and (pointer: fine)');
  /** @type {MotionState} */
  let state = {
    t: 0,
    playing: false,
    visible: false,
    fineHover: hoverMedia.matches,
    reduced: reducedMedia.matches,
    touchPlayed: false,
  };
  let raf = 0;
  let last = 0;

  function paint() {
    // Reduced motion shows the finished picture, not the empty first frame.
    const t = state.reduced ? 1 : state.t;
    onFrame(t);
    el.dataset.t = String(t);
    if (state.reduced || (!state.playing && t === 0)) el.dataset.motion = 'still';
    else if (state.playing) el.dataset.motion = 'playing';
    else el.dataset.motion = 'held';
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
  }

  function kick() {
    if (raf || state.reduced || !state.playing || !state.visible) return;
    last = 0;
    raf = requestAnimationFrame(loop);
  }

  /** @param {number} now */
  function loop(now) {
    if (!last) last = now;
    const dt = (now - last) / duration;
    last = now;
    state = reduceMotion(state, { type: 'tick', dt });
    paint();
    if (state.playing && state.visible && !state.reduced) raf = requestAnimationFrame(loop);
    else stop();
  }

  /** @param {MotionEvent} event */
  function apply(event) {
    state = reduceMotion(state, event);
    paint();
    kick();
  }

  el.addEventListener('pointerenter', () => apply({ type: 'enter' }));
  el.addEventListener('focusin', () => apply({ type: 'enter' }));
  reducedMedia.addEventListener('change', () => apply({ type: 'reduced', on: reducedMedia.matches }));
  hoverMedia.addEventListener('change', () => {
    state = { ...state, fineHover: hoverMedia.matches };
  });

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.45);
      apply({ type: visible ? 'show' : 'hide' });
    },
    { threshold: [0, 0.45, 1] },
  );
  observer.observe(el);
  paint();
}
