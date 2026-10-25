// Labs animate, so two real-time captures of one commit differ by up to 17% of the pixels. Instead the
// page gets a virtual clock before any of its code runs: performance.now and Date.now stand still,
// requestAnimationFrame callbacks queue, and window.__advance(ms) runs them in 16 ms frames. Math.random
// is seeded. CSS transitions are off. Two captures of one commit then match pixel for pixel.
export const FREEZE = `(() => {
  let t = 0;
  let next = 0;
  let queue = [];
  window.requestAnimationFrame = (cb) => { queue.push([++next, cb]); return next; };
  window.cancelAnimationFrame = (id) => { queue = queue.filter(([i]) => i !== id); };
  performance.now = () => t;
  Date.now = () => 1.7e12 + t;
  let seed = 123456789;
  Math.random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  window.__advance = (ms) => {
    for (let spent = 0; spent < ms; spent += 16) {
      t += 16;
      const run = queue;
      queue = [];
      for (const [, cb] of run) {
        try { cb(t); } catch (err) { console.error(err); }
      }
    }
  };
  document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }';
    document.head.append(style);
  });
})();`;
