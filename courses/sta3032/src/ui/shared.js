import { createTex } from '@flux/core';

/** House style, so every panel spells the same quantity the same way. */
const TEX_MACROS = {
  '\\xbar': '\\bar{x}',
  '\\phat': '\\hat{p}',
  '\\Xbar': '\\bar{X}',
  '\\given': '\\mid',
};

export const { tex, texError, mathText, mathProse, escapeHTML, breakable, fitMath, mathPieces } = createTex(TEX_MACROS, {
  displayDollars: true,
});
