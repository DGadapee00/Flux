/** Each lab owns its own meshes. The pool exists because a lab switch calls hideAll(). */
const noop = () => {};
const view = {
  setVisible: noop,
  sync: noop,
  clear: noop,
  update: noop,
  rebuild: () => ({ pieces: [] }),
};

export function createViewPool() {
  return new Proxy(
    { hideAll: noop },
    { get: (target, key) => (key in target ? target[key] : () => view) },
  );
}
