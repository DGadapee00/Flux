/**
 * The pure half of the compare gate (compare.mjs): no DOM, no Playwright.
 * The gate proves a UI move changed nothing a student can see.
 */

/**
 * The largest changedRatio accepted between two captures of one commit. compare.mjs freezes the
 * page's clock, so captures of one commit match exactly (0.0000% on the animated ac and circuits
 * labs). This is the floor for anything the GPU still varies, a few pixels in 2,000.
 */
export const TOLERANCE = 0.0005;

/**
 * One line per element in document order: tag#id.class[attr=value,…], indented two spaces per level,
 * with the element's own text appended in quotes. Script and style are skipped.
 *
 * An element carrying any class in `ignore` is skipped with its subtree. That is for the scene's
 * labels, which the renderer creates and moves every frame.
 *
 * Self-contained on purpose: compare.mjs serialises it into the page with toString().
 * @param {Element} root
 * @param {string[]} [ignore] Class names.
 * @returns {string[]}
 */
export function domSignature(root, ignore = []) {
  const lines = [];
  const walk = (node, depth) => {
    const tag = String(node.tagName).toLowerCase();
    if (tag === 'script' || tag === 'style') return;
    // SVG elements have an object for className, so read the attribute when there is one.
    const cls = typeof node.className === 'string' ? node.className : (node.getAttribute && node.getAttribute('class')) || '';
    const classes = cls.split(/\s+/).filter(Boolean);
    if (classes.some((c) => ignore.includes(c))) return;
    const attrs = Array.from(node.attributes || [])
      .filter((a) => a.name !== 'id' && a.name !== 'class')
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
      // The renderer moves labels every frame, so a style compares without its transform and z-index.
      .map((a) =>
        a.name === 'style'
          ? `style=${a.value.split(';').map((d) => d.trim()).filter((d) => d && !/^(transform|z-index)\s*:/.test(d)).join('; ')}`
          : `${a.name}=${a.value}`,
      );
    let line = `${'  '.repeat(depth)}${tag}${node.id ? `#${node.id}` : ''}${classes.map((c) => `.${c}`).join('')}`;
    if (attrs.length) line += `[${attrs.join(',')}]`;
    const own = Array.from(node.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (own) line += ` "${own}"`;
    lines.push(line);
    for (const child of node.childNodes) if (child.nodeType === 1) walk(child, depth + 1);
  };
  walk(root, 0);
  return lines;
}

/**
 * Lines added (+) and removed (-) between two signatures, by longest common subsequence,
 * so one inserted element does not report everything after it as changed.
 * @param {string[]} a
 * @param {string[]} b
 * @param {number} [max]
 * @returns {string[]}
 */
export function diffLines(a, b, max = 40) {
  const n = a.length;
  const m = b.length;
  const len = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      len[i][j] = a[i] === b[j] ? len[i + 1][j + 1] + 1 : Math.max(len[i + 1][j], len[i][j + 1]);
    }
  }
  const out = [];
  let i = 0;
  let j = 0;
  while ((i < n || j < m) && out.length < max) {
    if (i < n && j < m && a[i] === b[j]) {
      i++;
      j++;
    } else if (j < m && (i === n || len[i][j + 1] >= len[i + 1][j])) {
      out.push(`+ ${b[j++]}`);
    } else {
      out.push(`- ${a[i++]}`);
    }
  }
  return out;
}

/**
 * The fraction of pixels where any of R, G, B differs by more than channelTol.
 * @param {Uint8ClampedArray} a RGBA
 * @param {Uint8ClampedArray} b RGBA
 * @param {number} [channelTol]
 * @returns {number}
 */
export function changedRatio(a, b, channelTol = 8) {
  if (a.length !== b.length) throw new Error(`Different sizes: ${a.length} and ${b.length} bytes`);
  const pixels = a.length / 4;
  if (!pixels) return 0;
  let changed = 0;
  for (let p = 0; p < a.length; p += 4) {
    if (
      Math.abs(a[p] - b[p]) > channelTol ||
      Math.abs(a[p + 1] - b[p + 1]) > channelTol ||
      Math.abs(a[p + 2] - b[p + 2]) > channelTol
    ) {
      changed++;
    }
  }
  return changed / pixels;
}
