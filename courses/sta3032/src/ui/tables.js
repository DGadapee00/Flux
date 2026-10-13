/**
 * Tables: Appendix A as a lookup, for studying away from the printed copy. Each lookup shows the
 * number on the page (what the exam expects) beside the exact value, and the z table is drawn in
 * full with the entry highlighted, so reading it is practised, not skipped.
 *
 * Reference content, not a lab: nothing here changes an intuition, it saves a trip to the book.
 */
import { zTable, zForArea, tTable, chi2Table, fTable, binomTable, poisTable, T_TABLE, CHI2_TABLE, BINOM_PS, POIS_MUS } from '../stats/tables.js';
import { normCdf, normInv, tCrit, chi2Crit, fCrit, binomCdf, poisCdf } from '../stats/dist.js';
import { tex } from './shared.js';

const f4 = (x) => (Number.isFinite(x) ? x.toFixed(4) : '—');
const f3 = (x) => (Number.isFinite(x) ? x.toFixed(3) : '—');
const num = (s) => {
  const v = Number(String(s).replace(/[−–]/g, '-'));
  return Number.isFinite(v) ? v : NaN;
};

const state = { z: '1.96', area: '0.95', ta: '0.025', tdf: '10', ca: '0.05', cdf: '10', fa: '0.05', f1: '5', f2: '10', bn: '10', bp: '0.3', br: '3', pm: '4.5', pr: '5' };

export function renderTables(root) {
  root.innerHTML = `
    <div class="stack">
      <h2>Tables (Appendix A)</h2>
      <p class="note">Each lookup gives the number printed in your textbook's Appendix A and the exact value. On the exam, use the printed one; the practice problems accept either.</p>

      <section class="card stack" aria-labelledby="zt">
        <h3 id="zt">Table A.3 · Normal: area to the left of z</h3>
        <div class="lookup">
          <label>z<input id="z" inputmode="decimal" value="${state.z}" /></label>
          <label>area to the left<input id="area" inputmode="decimal" value="${state.area}" /></label>
        </div>
        <div class="readout" id="zout"></div>
        <div class="scroll-x" style="max-height: 340px; overflow-y: auto" id="zgrid"></div>
      </section>

      <section class="card stack" aria-labelledby="tt">
        <h3 id="tt">Table A.4 · t: area α to the right</h3>
        <div class="lookup">
          <label>α<select id="ta">${T_TABLE.alphas.map((a) => `<option ${String(a) === state.ta ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
          <label>ν (df)<input id="tdf" inputmode="numeric" value="${state.tdf}" /></label>
        </div>
        <div class="readout" id="tout"></div>
      </section>

      <section class="card stack" aria-labelledby="ct">
        <h3 id="ct">Table A.5 · χ²: area α to the right</h3>
        <div class="lookup">
          <label>α<select id="ca">${CHI2_TABLE.alphas.map((a) => `<option ${String(a) === state.ca ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
          <label>ν (df)<input id="cdf" inputmode="numeric" value="${state.cdf}" /></label>
        </div>
        <div class="readout" id="cout"></div>
      </section>

      <section class="card stack" aria-labelledby="ft">
        <h3 id="ft">Table A.6 · F: area α to the right</h3>
        <div class="lookup">
          <label>α<select id="fa">${['0.05', '0.01', '0.95', '0.99'].map((a) => `<option ${a === state.fa ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
          <label>ν₁<input id="f1" inputmode="numeric" value="${state.f1}" /></label>
          <label>ν₂<input id="f2" inputmode="numeric" value="${state.f2}" /></label>
        </div>
        <div class="readout" id="fout"></div>
        <p class="note">The book prints only α = 0.05 and 0.01. For α = 0.95 or 0.99 it uses ${tex(String.raw`f_{1-\alpha}(\nu_1, \nu_2) = 1/f_{\alpha}(\nu_2, \nu_1)`)}.</p>
      </section>

      <section class="card stack" aria-labelledby="bt">
        <h3 id="bt">Table A.1 · Binomial: P(X ≤ r)</h3>
        <div class="lookup">
          <label>n (1–20)<input id="bn" inputmode="numeric" value="${state.bn}" /></label>
          <label>p<select id="bp">${BINOM_PS.map((p) => `<option ${String(p) === state.bp ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
          <label>r<input id="br" inputmode="numeric" value="${state.br}" /></label>
        </div>
        <div class="readout" id="bout"></div>
      </section>

      <section class="card stack" aria-labelledby="pt">
        <h3 id="pt">Table A.2 · Poisson: P(X ≤ r)</h3>
        <div class="lookup">
          <label>μ<select id="pm">${POIS_MUS.map((m) => `<option ${String(m) === state.pm ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
          <label>r<input id="pr" inputmode="numeric" value="${state.pr}" /></label>
        </div>
        <div class="readout" id="pout"></div>
      </section>
    </div>`;

  const $ = (id) => root.querySelector(`#${id}`);
  const cell = (label, value) => `<div class="cell"><div class="label">${label}</div><div class="value">${value}</div></div>`;

  function update() {
    for (const k of Object.keys(state)) if ($(k)) state[k] = $(k).value;

    // z
    const z = num(state.z);
    const area = num(state.area);
    let hitZ = null;
    const zo = [];
    if (Number.isFinite(z)) {
      const t = zTable(z);
      hitZ = t.off ? null : t.z;
      zo.push(cell(`Table: Φ(${t.z.toFixed(2)})`, f4(t.value)), cell('Exact Φ(z)', f4(normCdf(z))), cell('Area to the right', f4(1 - t.value)));
    }
    if (area > 0 && area < 1) {
      const t = zForArea(area);
      zo.push(cell(`z with area ${area} to the left`, t.tie ? `${t.z} <small class="dim">(between ${t.values[1].toFixed(2)} and ${t.values[2].toFixed(2)})</small>` : t.z.toFixed(2)), cell('Exact z', f4(normInv(area))));
    }
    $('zout').innerHTML = zo.join('');
    $('zgrid').innerHTML = zGrid(hitZ);
    // Scroll the table, not the page, to the entry.
    const hit = $('zgrid').querySelector('.hit');
    if (hit) {
      const box = $('zgrid');
      box.scrollTop = hit.offsetTop - box.clientHeight / 2;
      box.scrollLeft = Math.max(0, hit.offsetLeft - box.clientWidth / 2);
    }

    // t
    const ta = num(state.ta);
    const df = state.tdf.trim() === '∞' || /^inf/i.test(state.tdf) ? Infinity : num(state.tdf);
    if (df >= 1) {
      const t = tTable(ta, df);
      $('tout').innerHTML = cell(t.rows.length > 1 ? `Table (rows ν = ${t.rows.join(' and ')})` : `Table: t<sub>${ta}</sub>`, t.values.map(f3).join(' / ')) + cell('Exact', f3(tCrit(ta, df))) + (ta === 0.0005 && df === 1 ? cell('Note', 'Book misprint: 636.578 (exact 636.619)') : '');
    } else $('tout').innerHTML = '';

    // chi-squared
    const ca = num(state.ca);
    const cdf = num(state.cdf);
    if (cdf >= 1) {
      const t = chi2Table(ca, cdf);
      $('cout').innerHTML = cell(t.rows.length > 1 ? `Table (rows ν = ${t.rows.join(' and ')})` : `Table: χ²<sub>${ca}</sub>`, t.values.join(' / ')) + cell('Exact', f3(chi2Crit(ca, cdf)));
    } else $('cout').innerHTML = '';

    // F
    const fa = num(state.fa);
    const v1 = /^inf|∞/i.test(state.f1) ? Infinity : num(state.f1);
    const v2 = /^inf|∞/i.test(state.f2) ? Infinity : num(state.f2);
    if (v1 >= 1 && v2 >= 1) {
      const t = fTable(fa, v1, v2);
      $('fout').innerHTML = cell(fa > 0.5 ? `Table: 1/f<sub>${(1 - fa).toFixed(2)}</sub>(${v2}, ${v1})` : `Table: f<sub>${fa}</sub>(${v1}, ${v2})`, t.values.map((x) => (fa > 0.5 ? f4(x) : x.toFixed(2))).join(' / ')) + cell('Exact', f4(fCrit(fa, v1, v2)));
    } else $('fout').innerHTML = '';

    // binomial
    const bn = num(state.bn);
    const bp = num(state.bp);
    const br = num(state.br);
    if (bn >= 1 && br >= 0) {
      const t = binomTable(br, bn, bp);
      $('bout').innerHTML = cell('Table A.1', t == null ? 'not printed (n > 20)' : f4(t)) + cell('Exact', f4(binomCdf(br, bn, bp)));
    } else $('bout').innerHTML = '';

    // Poisson
    const pm = num(state.pm);
    const pr = num(state.pr);
    if (pr >= 0) $('pout').innerHTML = cell('Table A.2', f4(poisTable(pr, pm))) + cell('Exact', f4(poisCdf(pr, pm)));
  }

  root.oninput = update;
  root.onchange = update;
  update();
}

/**
 * Table A.3 in full, as printed: rows −3.4 … −0.0 then 0.0 … 3.4, and a negative row's columns
 * count away from zero (row −1.2, column .06 is z = −1.26). The entry at z is highlighted.
 */
function zGrid(hitZ) {
  const cols = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const rows = [];
  for (let r = 34; r >= 0; r--) rows.push(-r);
  for (let r = 0; r <= 34; r++) rows.push(r);
  const body = rows.map((r, i) => {
    const neg = i <= 34; // the first 35 rows are the negative half, ending with −0.0
    const base = Math.abs(r) / 10;
    const zs = cols.map((c) => Math.round((neg ? -1 : 1) * (base + c / 100) * 100) / 100);
    // z = 0 is printed twice (rows −0.0 and 0.0); highlight it in the 0.0 row.
    const at = hitZ == null ? -1 : zs.findIndex((z) => z === hitZ && !(hitZ === 0 && neg));
    const name = `${neg ? '−' : ''}${base.toFixed(1)}`;
    return `<tr><th class="${at >= 0 ? 'rowhit' : ''}">${name}</th>${zs
      .map((z, c) => `<td class="${c === at ? 'hit' : at >= 0 ? 'rowhit' : ''}">${zTable(z).value.toFixed(4)}</td>`)
      .join('')}</tr>`;
  });
  return `<table class="ztab"><thead><tr><th>z</th>${cols.map((c) => `<th>.0${c}</th>`).join('')}</tr></thead><tbody>${body.join('')}</tbody></table>`;
}

