/**
 * The scene objects a lab draws. The five labs so far are logic only, so the pool holds nothing yet:
 * each unit's PR adds the views its labs need (docs/course-plans/phy2048.md). A lab's first visit
 * builds what it asks for; leaving hides it and does not dispose it.
 */
export function createViewPool() {
  const made = {};
  return {
    /** Hide every view; syncViews of the open lab shows what it needs. */
    hideAll() {
      for (const view of Object.values(made)) view.hide?.();
    },
  };
}
