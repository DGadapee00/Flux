import { decisionsOf, optionById } from '@flux/map/applications/decisions/index.js';
import { conflicts, derive, formatValue, linksOf } from '@flux/map/applications/decide.js';
import { travelerById } from '@flux/map/applications/travelers/index.js';
import { decisionRecord } from './brief.js';

/**
 * The Make side of a subsystem: its decisions, as cards that open in place. A card gives the usual
 * pick first, then what drives the choice, the options side by side with the figures that separate
 * them, each option's case for and against and what the shop must own to run it, what would change
 * the pick, what bites later, and a five-line record to copy out.
 *
 * Design, material and process are one choice, so a pick in one card marks the options it goes with
 * and rules out in the others. Picks live in the page only: Flux keeps none, and the record is copied.
 */

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const two = (n) => String(n).padStart(2, '0');
const nameOf = (id) => optionById[id].option.name;

/** A column's heading: its plain name, then its symbol and unit. */
function heading(col) {
  const small = [col.symbol, col.unit].filter(Boolean).join(', ');
  return `<th scope="col"${col.kind === 'number' ? ' class="num"' : ''}>${esc(col.label)}${small ? `<small>${esc(small)}</small>` : ''}</th>`;
}

function compareTable(d, picked) {
  const derived = derive(d);
  const cols = [...d.columns.map((c) => ({ ...c, derived: false })), ...(d.derived || []).map((c) => ({ ...c, kind: 'number', derived: true }))];
  const cell = (o, col) => {
    const v = col.derived ? derived[o.id][col.id] : o.values[col.id];
    const label = [col.label, col.unit && col.kind === 'number' ? `(${col.unit})` : ''].filter(Boolean).join(' ');
    const why = v === null && !col.derived ? ` title="${esc(o.blank[col.id])}"` : '';
    return `<td data-label="${esc(label)}"${col.kind === 'number' ? ' class="num"' : ''}${why}>${esc(formatValue(col, v))}</td>`;
  };
  return `<div class="option-table"><table>
    <thead><tr><th scope="col">Option</th>${cols.map(heading).join('')}</tr></thead>
    <tbody>${d.options.map((o) => `<tr${o.id === picked ? ' class="is-picked"' : ''}><th scope="row">${esc(o.name)}${o.id === d.pick.option ? ' <span class="option-tag">usual</span>' : ''}</th>${cols.map((c) => cell(o, c)).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

/** How an option sits with the picks made in the other cards. */
function standingOf(o, picks) {
  const notes = [];
  for (const link of linksOf(o.id)) {
    const other = optionById[link.other];
    if (picks[other.decision.id] !== link.other) continue;
    notes.push({ kind: link.kind, text: `${link.kind === 'rules-out' ? 'Ruled out by' : 'Goes with'} your pick for ${other.decision.title}: ${other.option.name}. ${link.why}` });
  }
  return notes;
}

function optionItem(o, d, picks) {
  const picked = picks[d.id] === o.id;
  const notes = standingOf(o, picks);
  const out = notes.some((n) => n.kind === 'rules-out');
  const links = linksOf(o.id);
  const list = (kind) => links.filter((l) => l.kind === kind).map((l) => nameOf(l.other));
  const withs = list('goes-with');
  const outs = list('rules-out');
  return `<li class="option${picked ? ' is-picked' : ''}${out ? ' is-out' : ''}">
    <label class="option-pick"><input type="radio" name="pick-${esc(d.id)}" value="${esc(o.id)}"${picked ? ' checked' : ''}>
      <span><strong>${esc(o.name)}</strong>${o.id === d.pick.option ? ' <span class="option-tag">usual pick</span>' : ''}</span></label>
    ${o.note ? `<p class="app-meta option-note">${esc(o.note)}</p>` : ''}
    <dl>
      <dt>For</dt><dd>${esc(o.for)}</dd>
      <dt>Against</dt><dd>${esc(o.against)}</dd>
      <dt>To run it in-house</dt><dd>${esc(o.own)}</dd>
      ${withs.length ? `<dt>Goes with</dt><dd>${esc(withs.join(' · '))}</dd>` : ''}
      ${outs.length ? `<dt>Rules out</dt><dd>${esc(outs.join(' · '))}</dd>` : ''}
    </dl>
    ${o.traveler ? `<p class="option-traveler"><a href="?traveler=${esc(o.traveler)}#applications">See how it is run: ${esc(travelerById[o.traveler].title)} <span aria-hidden="true">→</span></a></p>` : ''}
    ${notes.map((n) => `<p class="option-standing ${n.kind === 'rules-out' ? 'is-clash' : 'is-fit'}">${esc(n.text)}</p>`).join('')}
  </li>`;
}

/**
 * @param {any} recipe
 * @param {{
 *   picks: Record<string, string>,
 *   open: Set<string>,
 *   conceptLink: (id: string) => string,
 * }} ctx
 * @returns {string} The section's inner HTML, or '' for a recipe with no decisions.
 */
export function makeHtml(recipe, { picks, open, conceptLink }) {
  const decisions = decisionsOf(recipe.id);
  if (!decisions.length) return '';
  const clashes = conflicts(picks);
  const made = decisions.filter((d) => picks[d.id]).length;
  const status = made
    ? `${made} of ${decisions.length} picked. ${clashes.length ? clashes.map((c) => `${nameOf(c.a)} and ${nameOf(c.b)} rule each other out.`).join(' ') : 'No pick rules out another.'}`
    : `${decisions.length} choices. Pick an option in each to see how they fit.`;
  const cards = decisions.map((d, i) => {
    const mine = d.options.find((o) => o.id === picks[d.id]);
    const clash = mine && clashes.some((c) => c.a === mine.id || c.b === mine.id);
    const state = mine ? `Your pick: ${mine.name}${clash ? ' · ruled out by another pick' : ''}` : `Usual pick: ${nameOf(d.pick.option)}`;
    const record = decisionRecord(d, { recipe, picks });
    return `<details class="decision${clash ? ' has-clash' : ''}" id="decision-${esc(d.id)}" data-decision="${esc(d.id)}"${open.has(d.id) ? ' open' : ''}>
      <summary><span class="component-number">${two(i + 1)}</span>
        <span class="decision-title"><strong>${esc(d.title)}</strong><span>${esc(d.question)}</span></span>
        <span class="decision-state">${esc(state)}</span></summary>
      <div class="decision-body">
        <p class="decision-lede">${esc(d.lede)}</p>
        <div class="decision-usual"><p class="app-kicker">Usual pick</p><p><strong>${esc(nameOf(d.pick.option))}.</strong> ${esc(d.pick.why)}</p></div>
        <h5>What drives it</h5><ul class="decision-list">${d.drivers.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <h5>Compare</h5><p class="decision-read">${esc(d.read)}</p>${compareTable(d, picks[d.id])}
        <h5>Each option</h5><ul class="options" role="radiogroup" aria-label="Your pick: ${esc(d.title)}">${d.options.map((o) => optionItem(o, d, picks)).join('')}</ul>
        <h5>What would change it</h5><ul class="decision-list">${d.changes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <h5>Watch for</h5><ul class="decision-list">${d.watch.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <h5>Foundations on the map</h5><div class="foundation-links">${d.concepts.map(conceptLink).join('')}</div>
        <h5>Sources</h5><ul class="references">${d.references.map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)} <span aria-hidden="true">↗</span></a><p class="app-meta">${esc(x.why)}</p></li>`).join('')}</ul>
        <div class="decision-record"><p class="app-kicker">Your decision record</p>
          <p>Five lines to write: the choice, what drove it, what you rejected and why, the risk you accept, and what would change your mind. The facts are filled in. Take it to class or to your satellite Project.</p>
          <div class="copy-row"><button type="button" class="copy-button" data-copy="record" data-decision="${esc(d.id)}">Copy the decision record</button><span class="copy-note" data-copied="record-${esc(d.id)}" role="status"></span></div>
          <details><summary>Show the record</summary><pre class="brief-text" data-text="record-${esc(d.id)}">${esc(record)}</pre></details>
        </div>
      </div></details>`;
  }).join('');
  return `<header class="make-head"><p class="app-kicker">Make it</p>
      <h4 id="make-title">${decisions.length === 4 ? 'Four' : decisions.length} choices, made together</h4>
      <p>Raw stock comes in and tested hardware goes out. Design, material and process are one choice, because each limits the others. Open a card for the usual pick and the options. Pick one, and the other cards show what it goes with and what it rules out.</p>
      <div class="make-status-row"><p class="make-status" data-make-status role="status" tabindex="-1">${esc(status)}</p>${made ? '<button type="button" class="make-clear" data-clear-picks>Clear my picks</button>' : ''}</div></header>
    <div class="decisions">${cards}</div>
    <p class="app-meta make-note">Flux keeps no picks: copy each record. Welding has a traveler that shows how the process is run: see Follow a part. Travelers for machining and metal printing are still to build.</p>`;
}
