import { setup } from '@flux/core/plot2d/plot.js';

/**
 * Picture host for one lab. A `plot2d` lab replaces the three.js canvas with a
 * canvas sized by `@flux/core/plot2d`. Any other lab leaves the three.js canvas
 * showing. The course imports `styles/stage.css` when it has a plot2d lab.
 *
 * `draw(canvas, state, result)` paints. It may call `setup` again.
 *
 * @param {HTMLCanvasElement} canvas3d The course's three.js canvas.
 */
export function createStage(canvas3d) {
  const plot = document.createElement('canvas');
  plot.id = 'plot';
  plot.hidden = true;
  plot.setAttribute('aria-label', 'Plot');
  canvas3d.insertAdjacentElement('afterend', plot);

  /**
   * @param {object|null} lab
   * @param {object} state
   * @param {() => number} [rng] Seeded generator. Plot labs are pure given this.
   */
  function show(lab, state, rng) {
    const plot2d = lab?.kind === 'plot2d';
    canvas3d.hidden = plot2d;
    plot.hidden = !plot2d;
    if (!plot2d) return { kind: 'scene3d' };
    const random = typeof rng === 'function' ? rng : () => 0;
    const result = lab.compute(state, random);
    setup(plot);
    lab.draw(plot, state, result);
    return { kind: 'plot2d', result };
  }

  return { show, plot };
}
