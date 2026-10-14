import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './playwright.mjs';

const out = path.resolve('scripts/output');
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
const fail = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

const settle = async () => {
  let last = null;
  for (let i = 0; i < 40; i++) {
    const now = await page.evaluate(() =>
      [window.__flux.camera.position.x, window.__flux.camera.position.y, window.__flux.camera.position.z]
        .map((v) => +v.toFixed(4))
        .join(),
    );
    if (now === last) return;
    last = now;
    await page.waitForTimeout(100);
  }
};

await page.goto('http://localhost:5179/#/mac2312/u1/solids', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForFunction(() => window.__flux?.state?.lab === 'solids', null, { timeout: 15000 });
await settle();

const first = await page.evaluate(() => {
  const c = window.__flux.computed;
  return {
    lab: window.__flux.state.lab,
    scenario: window.__flux.state.scenarioId,
    b: window.__flux.state.b,
    disk: c.disk,
    shell: c.shell,
    overPi: c.overPi,
    agree: c.agree,
  };
});
if (first.scenario !== 'disks') fail.push(`default scenario ${first.scenario}`);
if (!(Math.abs(first.disk - 8 * Math.PI) < 1e-6)) fail.push(`disk ${first.disk}`);
if (!(Math.abs(first.shell - 8 * Math.PI) < 1e-6)) fail.push(`shell ${first.shell}`);
if (!(Math.abs(first.overPi - 8) < 1e-6)) fail.push(`overPi ${first.overPi}`);
if (first.agree !== true) fail.push('disks do not agree');
await page.screenshot({ path: path.join(out, 'solids-desktop.png'), fullPage: true });

await page.selectOption('#scenario', 'shells');
await page.waitForTimeout(200);
const shells = await page.evaluate(() => ({
  scenario: window.__flux.state.scenarioId,
  method: window.__flux.state.method,
  agree: window.__flux.computed.agree,
  disk: window.__flux.computed.disk,
  shell: window.__flux.computed.shell,
}));
if (shells.scenario !== 'shells' || shells.method !== 'shells') fail.push(`shells scenario ${JSON.stringify(shells)}`);
if (shells.agree !== true) fail.push('shells scenario disagrees');
if (!(Math.abs(shells.disk - shells.shell) < 1e-6)) fail.push('shells volumes differ');

await page.fill('#sol-b', '2');
await page.dispatchEvent('#sol-b', 'input');
await page.waitForTimeout(200);
const half = await page.evaluate(() => ({
  b: window.__flux.state.b,
  disk: window.__flux.computed.disk,
  shell: window.__flux.computed.shell,
  agree: window.__flux.computed.agree,
}));
if (!(Math.abs(half.b - 2) < 1e-9)) fail.push(`b ${half.b}`);
if (!(Math.abs(half.disk - 2 * Math.PI) < 1e-6)) fail.push(`half disk ${half.disk}`);
if (!(Math.abs(half.shell - 2 * Math.PI) < 1e-6)) fail.push(`half shell ${half.shell}`);
if (half.agree !== true) fail.push('b=2 disagrees');

await page.setViewportSize({ width: 380, height: 780 });
await settle();
await page.screenshot({ path: path.join(out, 'solids-phone.png'), fullPage: true });
const phoneSolid = await page.evaluate(() => ({
  scroll: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
}));
if (phoneSolid.scroll > phoneSolid.client + 1) fail.push(`solids 380 scroll ${JSON.stringify(phoneSolid)}`);

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:5179/#/mac2312/u3/taylor', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__flux?.state?.lab === 'taylor', null, { timeout: 15000 });
await settle();
const line = await page.evaluate(() => {
  const c = window.__flux.computed;
  return { n: window.__flux.state.n, x: window.__flux.state.x, poly: c.poly, err: c.err, agree: c.agree };
});
if (line.n !== 1) fail.push(`taylor order ${line.n}`);
if (!(Math.abs(line.poly - 0.5) < 1e-9)) fail.push(`P1 ${line.poly}`);
if (!(line.err > 0.01 && line.err < 0.03)) fail.push(`line error ${line.err}`);
if (line.agree !== true) fail.push('taylor line disagrees');
await page.screenshot({ path: path.join(out, 'taylor-desktop.png'), fullPage: true });

await page.fill('#tay-n', '5');
await page.dispatchEvent('#tay-n', 'input');
await page.waitForTimeout(200);
const fifth = await page.evaluate(() => ({
  n: window.__flux.state.n,
  poly: window.__flux.computed.poly,
  err: window.__flux.computed.err,
  agree: window.__flux.computed.agree,
}));
if (fifth.n !== 5) fail.push(`order ${fifth.n}`);
if (!(Math.abs(fifth.poly - 1841 / 3840) < 1e-9)) fail.push(`P5 ${fifth.poly}`);
if (!(fifth.err < line.err / 10)) fail.push(`order 5 error ${fifth.err} vs ${line.err}`);
if (fifth.agree !== true) fail.push('order 5 disagrees');

await page.selectOption('#scenario', 'shift');
await page.waitForTimeout(200);
const shift = await page.evaluate(() => ({
  scenario: window.__flux.state.scenarioId,
  a: window.__flux.state.a,
  poly: window.__flux.computed.poly,
  agree: window.__flux.computed.agree,
}));
if (shift.scenario !== 'shift') fail.push(`shift scenario ${shift.scenario}`);
if (!(Math.abs(shift.a - Math.PI / 2) < 1e-9)) fail.push(`centre ${shift.a}`);
if (!(Math.abs(shift.poly - 0.92) < 1e-9)) fail.push(`shifted poly ${shift.poly}`);
if (shift.agree !== true) fail.push('shift disagrees');

await page.setViewportSize({ width: 380, height: 780 });
await settle();
await page.screenshot({ path: path.join(out, 'taylor-phone.png'), fullPage: true });
const phoneTay = await page.evaluate(() => ({
  scroll: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
}));
if (phoneTay.scroll > phoneTay.client + 1) fail.push(`taylor 380 scroll ${JSON.stringify(phoneTay)}`);

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:5179/#/mac2312/u2/numint', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__flux?.state?.lab === 'numint', null, { timeout: 15000 });
await settle();
const coarse = await page.evaluate(() => {
  const c = window.__flux.computed;
  return { n: window.__flux.state.n, trap: c.trap, simp: c.simp, trapErr: c.trapErr, simpErr: c.simpErr, agree: c.agree, closer: c.closer };
});
const trap4 = (Math.PI / 4) * (1 + Math.SQRT2);
const simp4 = (Math.PI / 6) * (1 + 2 * Math.SQRT2);
if (coarse.n !== 4) fail.push(`panels ${coarse.n}`);
if (!(Math.abs(coarse.trap - trap4) < 1e-9)) fail.push(`trap ${coarse.trap}`);
if (!(Math.abs(coarse.simp - simp4) < 1e-9)) fail.push(`simp ${coarse.simp}`);
if (!(coarse.simpErr < coarse.trapErr)) fail.push(`errors trap ${coarse.trapErr} simp ${coarse.simpErr}`);
if (coarse.agree !== true || coarse.closer !== true) fail.push('numerical rules disagree');
await page.screenshot({ path: path.join(out, 'numint-desktop.png'), fullPage: true });

await page.fill('#num-n', '8');
await page.dispatchEvent('#num-n', 'input');
await page.waitForTimeout(200);
const mid = await page.evaluate(() => ({
  n: window.__flux.state.n,
  trapErr: window.__flux.computed.trapErr,
  simpErr: window.__flux.computed.simpErr,
  closer: window.__flux.computed.closer,
  agree: window.__flux.computed.agree,
}));
if (mid.n !== 8) fail.push(`mid panels ${mid.n}`);
if (!(mid.trapErr < coarse.trapErr && mid.simpErr < coarse.simpErr)) fail.push(`errors did not fall ${JSON.stringify(mid)}`);
if (mid.closer !== true || mid.agree !== true) fail.push('eight panels disagree');

await page.setViewportSize({ width: 380, height: 780 });
await settle();
await page.screenshot({ path: path.join(out, 'numint-phone.png'), fullPage: true });
const phoneNum = await page.evaluate(() => ({
  scroll: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
}));
if (phoneNum.scroll > phoneNum.client + 1) fail.push(`numint 380 scroll ${JSON.stringify(phoneNum)}`);

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:5179/#/mac2312/u2/improper', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__flux?.state?.lab === 'improper', null, { timeout: 15000 });
await settle();
const near = await page.evaluate(() => {
  const c = window.__flux.computed;
  return { b: window.__flux.state.b, area: c.area, tail: c.tail, agree: c.agree };
});
if (!(Math.abs(near.b - 2) < 1e-9)) fail.push(`bound ${near.b}`);
if (!(Math.abs(near.area - 0.5) < 1e-12) || !(Math.abs(near.tail - 0.5) < 1e-12)) fail.push(`near area ${near.area}`);
if (near.agree !== true) fail.push('improper disagrees');
await page.screenshot({ path: path.join(out, 'improper-desktop.png'), fullPage: true });

await page.selectOption('#scenario', 'far');
await page.waitForTimeout(200);
const far = await page.evaluate(() => ({
  b: window.__flux.state.b,
  area: window.__flux.computed.area,
  tail: window.__flux.computed.tail,
  agree: window.__flux.computed.agree,
}));
if (!(Math.abs(far.b - 8) < 1e-9)) fail.push(`far bound ${far.b}`);
if (!(Math.abs(far.area - 0.875) < 1e-12)) fail.push(`far area ${far.area}`);
if (!(Math.abs(far.tail - 0.125) < 1e-12)) fail.push(`far tail ${far.tail}`);
if (!(far.area > near.area && far.tail < near.tail)) fail.push('the tail did not shrink');
if (far.agree !== true) fail.push('far bound disagrees');

await page.setViewportSize({ width: 380, height: 780 });
await settle();
await page.screenshot({ path: path.join(out, 'improper-phone.png'), fullPage: true });
const phoneImp = await page.evaluate(() => ({
  scroll: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
}));
if (phoneImp.scroll > phoneImp.client + 1) fail.push(`improper 380 scroll ${JSON.stringify(phoneImp)}`);

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:5179/#/mac2312/u3/series', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__flux?.state?.lab === 'series', null, { timeout: 15000 });
await settle();
const geom = await page.evaluate(() => {
  const c = window.__flux.computed;
  return {
    kind: window.__flux.state.kind,
    n: window.__flux.state.n,
    sn: c.sn,
    an: c.an,
    limit: c.limit,
    agree: c.agree,
    converges: c.converges,
  };
});
if (geom.kind !== 'geom' || geom.n !== 8) fail.push(`series default ${geom.kind} n=${geom.n}`);
if (!(Math.abs(geom.sn - 255 / 128) < 1e-9)) fail.push(`geom sum ${geom.sn}`);
if (!(Math.abs(geom.an - 1 / 128) < 1e-12)) fail.push(`geom term ${geom.an}`);
if (!(Math.abs(geom.limit - 2) < 1e-12)) fail.push(`geom limit ${geom.limit}`);
if (geom.agree !== true || geom.converges !== true) fail.push('geometric series disagrees');
await page.screenshot({ path: path.join(out, 'series-desktop.png'), fullPage: true });

await page.fill('#ser-n', '4');
await page.dispatchEvent('#ser-n', 'input');
await page.waitForTimeout(200);
const four = await page.evaluate(() => ({ n: window.__flux.state.n, sn: window.__flux.computed.sn, agree: window.__flux.computed.agree }));
if (four.n !== 4) fail.push(`series terms ${four.n}`);
if (!(Math.abs(four.sn - 15 / 8) < 1e-9)) fail.push(`four halves ${four.sn}`);
if (four.agree !== true) fail.push('four halves disagree');

await page.selectOption('#scenario', 'harm');
await page.waitForTimeout(200);
const harm = await page.evaluate(() => ({
  kind: window.__flux.state.kind,
  n: window.__flux.state.n,
  sn: window.__flux.computed.sn,
  converges: window.__flux.computed.converges,
  agree: window.__flux.computed.agree,
}));
if (harm.kind !== 'harm' || harm.n !== 8) fail.push(`harmonic ${harm.kind} n=${harm.n}`);
if (!(Math.abs(harm.sn - 761 / 280) < 1e-9)) fail.push(`H_8 ${harm.sn}`);
if (harm.converges !== false || harm.agree !== true) fail.push('harmonic should have no ceiling');

await page.selectOption('#scenario', 'ones');
await page.waitForTimeout(200);
const ones = await page.evaluate(() => ({
  sn: window.__flux.computed.sn,
  an: window.__flux.computed.an,
  converges: window.__flux.computed.converges,
  agree: window.__flux.computed.agree,
}));
if (!(Math.abs(ones.sn - 8) < 1e-12) || !(Math.abs(ones.an - 1) < 1e-12)) fail.push(`ones ${ones.sn}`);
if (ones.converges !== false || ones.agree !== true) fail.push('ones should diverge');

await page.selectOption('#scenario', 'alt');
await page.waitForTimeout(200);
const alt = await page.evaluate(() => ({
  n: window.__flux.state.n,
  sn: window.__flux.computed.sn,
  limit: window.__flux.computed.limit,
  converges: window.__flux.computed.converges,
  agree: window.__flux.computed.agree,
}));
if (alt.n !== 8) fail.push(`alternating terms ${alt.n}`);
if (!(Math.abs(alt.sn - 533 / 840) < 1e-9)) fail.push(`alt sum ${alt.sn}`);
if (!(Math.abs(alt.limit - Math.LN2) < 1e-12)) fail.push(`alt limit ${alt.limit}`);
if (alt.converges !== true || alt.agree !== true) fail.push('alternating series disagrees');

await page.setViewportSize({ width: 380, height: 780 });
await settle();
await page.screenshot({ path: path.join(out, 'series-phone.png'), fullPage: true });
const phoneSer = await page.evaluate(() => ({
  scroll: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
}));
if (phoneSer.scroll > phoneSer.client + 1) fail.push(`series 380 scroll ${JSON.stringify(phoneSer)}`);

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:5179/#/mac2312/u4/parametric', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__flux?.state?.lab === 'parametric', null, { timeout: 15000 });
await settle();
const circle = await page.evaluate(() => {
  const c = window.__flux.computed;
  return { k: window.__flux.state.k, x: c.x, y: c.y, slope: c.slope, speed: c.speed, length: c.length, agree: c.agree };
});
if (circle.k !== 2) fail.push(`parametric mark ${circle.k}`);
if (!(Math.abs(circle.x) < 1e-9) || !(Math.abs(circle.y - 1) < 1e-9)) fail.push(`circle point ${circle.x}, ${circle.y}`);
if (!(Math.abs(circle.slope) < 1e-9)) fail.push(`circle slope ${circle.slope}`);
if (!(Math.abs(circle.speed - 1) < 1e-12)) fail.push(`circle speed ${circle.speed}`);
if (!(Math.abs(circle.length - Math.PI / 2) < 1e-9)) fail.push(`circle length ${circle.length}`);
if (circle.agree !== true) fail.push('unit circle disagrees');
await page.screenshot({ path: path.join(out, 'parametric-desktop.png'), fullPage: true });

await page.fill('#par-k', '1');
await page.dispatchEvent('#par-k', 'input');
await page.waitForTimeout(200);
const quarter = await page.evaluate(() => ({
  k: window.__flux.state.k,
  slope: window.__flux.computed.slope,
  speed: window.__flux.computed.speed,
  length: window.__flux.computed.length,
  agree: window.__flux.computed.agree,
}));
if (quarter.k !== 1) fail.push(`quarter mark ${quarter.k}`);
if (!(Math.abs(quarter.slope + 1) < 1e-9)) fail.push(`quarter slope ${quarter.slope}`);
if (!(Math.abs(quarter.speed - 1) < 1e-12)) fail.push('speed changed on the circle');
if (!(Math.abs(quarter.length - Math.PI / 4) < 1e-9)) fail.push(`quarter length ${quarter.length}`);
if (quarter.agree !== true) fail.push('quarter turn disagrees');

await page.selectOption('#scenario', 'para');
await page.waitForTimeout(200);
const para = await page.evaluate(() => {
  const c = window.__flux.computed;
  return { k: window.__flux.state.k, x: c.x, y: c.y, slope: c.slope, speed: c.speed, length: c.length, agree: c.agree };
});
const paraLen = 0.5 * Math.sqrt(5) + 0.25 * Math.log(2 + Math.sqrt(5));
if (para.k !== 4) fail.push(`parabola mark ${para.k}`);
if (!(Math.abs(para.x - 1) < 1e-12) || !(Math.abs(para.y - 1) < 1e-12)) fail.push(`parabola point ${para.x}, ${para.y}`);
if (!(Math.abs(para.slope - 2) < 1e-12)) fail.push(`parabola slope ${para.slope}`);
if (!(Math.abs(para.speed - Math.sqrt(5)) < 1e-12)) fail.push(`parabola speed ${para.speed}`);
if (!(Math.abs(para.length - paraLen) < 1e-9)) fail.push(`parabola length ${para.length}`);
if (para.agree !== true) fail.push('parabola disagrees');

await page.selectOption('#scenario', 'line');
await page.waitForTimeout(200);
const line = await page.evaluate(() => ({
  slope: window.__flux.computed.slope,
  length: window.__flux.computed.length,
  y: window.__flux.computed.y,
  agree: window.__flux.computed.agree,
}));
if (!(Math.abs(line.slope - 2) < 1e-12)) fail.push(`line slope ${line.slope}`);
if (!(Math.abs(line.y - 2) < 1e-12)) fail.push(`line y ${line.y}`);
if (!(Math.abs(line.length - Math.sqrt(5)) < 1e-12)) fail.push(`line length ${line.length}`);
if (line.agree !== true) fail.push('line disagrees');

await page.setViewportSize({ width: 380, height: 780 });
await settle();
await page.screenshot({ path: path.join(out, 'parametric-phone.png'), fullPage: true });
const phonePar = await page.evaluate(() => ({
  scroll: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
}));
if (phonePar.scroll > phonePar.client + 1) fail.push(`parametric 380 scroll ${JSON.stringify(phonePar)}`);

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:5179/#/mac2312/u4/polar', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__flux?.state?.lab === 'polar', null, { timeout: 15000 });
await settle();
const disk = await page.evaluate(() => {
  const c = window.__flux.computed;
  return { k: window.__flux.state.k, area: c.area, naive: c.naive, agree: c.agree, differs: c.differs };
});
if (disk.k !== 4) fail.push(`polar sweep ${disk.k}`);
if (!(Math.abs(disk.area - Math.PI) < 1e-9)) fail.push(`disk area ${disk.area}`);
if (!(Math.abs(disk.naive - 2 * Math.PI) < 1e-9)) fail.push(`disk naive ${disk.naive}`);
if (disk.agree !== true || disk.differs !== true) fail.push('unit disk area disagrees');
await page.screenshot({ path: path.join(out, 'polar-desktop.png'), fullPage: true });

await page.fill('#pol-k', '2');
await page.dispatchEvent('#pol-k', 'input');
await page.waitForTimeout(200);
const half = await page.evaluate(() => ({
  k: window.__flux.state.k,
  area: window.__flux.computed.area,
  naive: window.__flux.computed.naive,
  agree: window.__flux.computed.agree,
  differs: window.__flux.computed.differs,
}));
if (half.k !== 2) fail.push(`half sweep ${half.k}`);
if (!(Math.abs(half.area - Math.PI / 2) < 1e-9)) fail.push(`half area ${half.area}`);
if (!(Math.abs(half.naive - Math.PI) < 1e-9)) fail.push(`half naive ${half.naive}`);
if (half.agree !== true || half.differs !== true) fail.push('half disk disagrees');

await page.selectOption('#scenario', 'card');
await page.waitForTimeout(200);
const card = await page.evaluate(() => ({
  k: window.__flux.state.k,
  area: window.__flux.computed.area,
  naive: window.__flux.computed.naive,
  agree: window.__flux.computed.agree,
  differs: window.__flux.computed.differs,
}));
if (card.k !== 4) fail.push(`cardioid sweep ${card.k}`);
if (!(Math.abs(card.area - (3 * Math.PI) / 2) < 1e-9)) fail.push(`cardioid area ${card.area}`);
if (!(Math.abs(card.naive - 2 * Math.PI) < 1e-9)) fail.push(`cardioid naive ${card.naive}`);
if (card.agree !== true || card.differs !== true) fail.push('cardioid disagrees');

await page.selectOption('#scenario', 'shift');
await page.waitForTimeout(200);
const shift = await page.evaluate(() => ({
  area: window.__flux.computed.area,
  naive: window.__flux.computed.naive,
  agree: window.__flux.computed.agree,
  differs: window.__flux.computed.differs,
}));
if (!(Math.abs(shift.area - Math.PI) < 1e-9)) fail.push(`shifted area ${shift.area}`);
if (!(Math.abs(shift.naive - 4) < 1e-9)) fail.push(`shifted naive ${shift.naive}`);
if (shift.agree !== true || shift.differs !== true) fail.push('shifted circle disagrees');

await page.setViewportSize({ width: 380, height: 780 });
await settle();
await page.screenshot({ path: path.join(out, 'polar-phone.png'), fullPage: true });
const phonePol = await page.evaluate(() => ({
  scroll: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
}));
if (phonePol.scroll > phonePol.client + 1) fail.push(`polar 380 scroll ${JSON.stringify(phonePol)}`);

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:5179/#/mac2312/u1/solids', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__flux?.state?.lab === 'solids', null, { timeout: 10000 });
await page.goBack();
await page.waitForTimeout(400);
const back = await page.evaluate(() => location.hash);
if (back !== '#/mac2312/u4/polar') fail.push(`back hash ${back}`);

await browser.close();

if (errors.length) {
  console.error('page errors:', errors);
  process.exit(1);
}
if (fail.length) {
  console.error('verify failed:\n' + fail.map((f) => '  ' + f).join('\n'));
  process.exit(1);
}
console.log('verify ok', { disk: first.disk, lineErr: line.err, fifthErr: fifth.err, back });
