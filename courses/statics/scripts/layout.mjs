#!/usr/bin/env node
/**
 * Layout check: every lab and scenario at 1280×800 and 380×820, against the dev server.
 * The readout bar covers no panel and no plot, its values fit, and nothing scrolls sideways.
 * Start `npm run dev` first. LAYOUT_URL points it at another server.
 */
import { checkLayout } from '@flux/shells/engineering/layout-check.mjs';
import { EXAMS } from '../src/data/catalog.js';
import { COURSE } from '../src/engine/router.js';
import { chromium } from './playwright.mjs';

const base = process.env.LAYOUT_URL || 'http://localhost:5176/';
const routes = EXAMS.flatMap((e) => (e.labs || []).map((lab) => `#/${COURSE}/${e.id}/${lab}`));
const { views, plots, fails } = await checkLayout({ chromium, base, routes });
if (fails.length) {
  console.error(`layout: ${fails.length} problem(s)\n  ${fails.join('\n  ')}`);
  process.exit(1);
}
console.log(`layout: ${views} views (${routes.length} labs, every scenario, 2 sizes) · ${plots} with a plot · no overlap`);
