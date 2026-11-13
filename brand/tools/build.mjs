// Builds the full KINJURA kit into ../kit. Deterministic: same input, same bytes.
//   node build.mjs            full kit
//   node build.mjs --fast     SVGs + small PNGs only (skips 4K renders)
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { emblemSvg, BOX, CORE_PARTS, PALETTE, ringPaths } from './emblem.mjs';
import * as L from './layout.mjs';
import { wordmark, katakana, outline } from './type.mjs';
import { renderPng } from './render.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT = join(HERE, '..', 'kit');
const FAST = process.argv.includes('--fast');
const log = (...a) => console.log('[build]', ...a);
const manifest = [];

function out(rel, svg, pngWidths = []) {
  const p = join(KIT, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p + '.svg', svg);
  manifest.push(rel + '.svg');
  for (const w of [].concat(pngWidths)) {
    const suffix = pngWidths.length > 1 ? `_${w}` : '';
    renderPng(svg, `${p}${suffix}.png`, w);
    manifest.push(`${rel}${suffix}.png`);
  }
}
function nest(svg, x, y, w) {
  // Embed a full SVG document at (x, y) scaled to width w.
  const vb = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const h = (w * vb[3]) / vb[2];
  return svg.replace(/<svg [^>]*?viewBox="([^"]+)"[^>]*>/, `<svg x="${L.n(x)}" y="${L.n(y)}" width="${L.n(w)}" height="${L.n(h)}" viewBox="$1">`);
}

// Clean only the folders this script owns; 07_Intro belongs to intro.mjs.
const OWNED = ['00_Tokens', '01_Marks', '02_Wordmarks', '03_Lockups', '04_Icons', '05_Backgrounds', '06_FX'];
mkdirSync(KIT, { recursive: true });
for (const d of OWNED) if (existsSync(join(KIT, d))) rmSync(join(KIT, d), { recursive: true, force: true });

const THEME_NAMES = ['primary', 'light', 'mono-ivory', 'mono-void', 'gold', 'aether'];
const cap = (s) => s.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('');

// ---- 01 Marks -----------------------------------------------------------
log('marks');
for (const t of THEME_NAMES) {
  const th = L.THEMES[t];
  const base = { metal: th.metal, core: th.core, mode: th.mode || 'facet', flat: th.flat, ringColor: th.ring, glow: th.glow };
  out(`01_Marks/Crest/KINJURA_Crest_${cap(t)}`, emblemSvg({ ...base, id: 'c' }, BOX.crest), 1024);
  out(`01_Marks/Emblem/KINJURA_Emblem_${cap(t)}`, emblemSvg({ ...base, ring: false, id: 'e' }, BOX.emblem), 1024);
  out(`01_Marks/Core/KINJURA_Core_${cap(t)}`, emblemSvg({ ...base, ring: false, parts: CORE_PARTS, id: 'k' }, BOX.core), 512);
}

// ---- 02 Wordmarks -------------------------------------------------------
log('wordmarks');
for (const t of THEME_NAMES) {
  out(`02_Wordmarks/KINJURA_Wordmark_${cap(t)}`, L.wordmarkSvg(t), 2048);
  out(`02_Wordmarks/KINJURA_Katakana_${cap(t)}`, L.kanaSvg(t), 1600);
}

// ---- 03 Lockups ---------------------------------------------------------
log('lockups');
for (const t of THEME_NAMES) {
  out(`03_Lockups/Stacked/KINJURA_Stacked_${cap(t)}`, L.stackedLockup(t).svg, 1600);
  out(`03_Lockups/Horizontal/KINJURA_Horizontal_${cap(t)}`, L.horizontalLockup(t).svg, 2000);
  out(`03_Lockups/Minimal/KINJURA_Minimal_${cap(t)}`, L.minimalLockup(t).svg, 1600);
}

// ---- 04 Icons -----------------------------------------------------------
log('icons');
const ICON_LANES = { Crimson: 'games', Aether: 'forge', Aurum: 'native', Mist: 'app' };
const SIZES = [1024, 512, 256, 128];
const SMALL = [64, 48, 32, 16];
for (const [label, lane] of Object.entries(ICON_LANES)) {
  out(`04_Icons/App/KINJURA_AppIcon_${label}`, L.stampIcon({ lane }), SIZES);
  // Below 128 px the full crest turns to mush: switch to the core mark.
  out(`04_Icons/App/KINJURA_AppIcon_${label}_Small`, L.stampIcon({ lane, parts: CORE_PARTS }), SMALL);
}
out('04_Icons/Avatar/KINJURA_Avatar_Circle', L.stampIcon({ lane: 'games', shape: 'circle' }), [1024, 400]);
out('04_Icons/Avatar/KINJURA_Avatar_Circle_Core', L.stampIcon({ lane: 'games', shape: 'circle', parts: CORE_PARTS }), [512]);
// favicon.ico (16/32/48) from the core tile.
try {
  const d = join(KIT, '04_Icons/App');
  execFileSync('magick', [16, 32, 48].map((s) => join(d, `KINJURA_AppIcon_Crimson_Small_${s}.png`)).concat(join(KIT, '04_Icons/favicon.ico')));
  manifest.push('04_Icons/favicon.ico');
} catch (e) {
  log('favicon.ico skipped (ImageMagick unavailable):', e.message.split('\n')[0]);
}

// ---- 05 Backgrounds & banners -------------------------------------------
log('backgrounds');
const bgDoc = (w, h, opts, extra = '') => {
  const bg = L.background(w, h, opts);
  return L.svgDoc(w, h, bg.defs, bg.body + extra);
};
const bigW = FAST ? [] : undefined;
out('05_Backgrounds/KINJURA_Background_Unbranded_16x9', bgDoc(1920, 1080, { seed: 3 }), bigW ?? [1920, 3840]);
out('05_Backgrounds/KINJURA_Background_Unbranded_Clean_16x9', bgDoc(1920, 1080, { seed: 3, petals: false }), [1920]);
out('05_Backgrounds/KINJURA_Background_Unbranded_Ultrawide', bgDoc(3440, 1440, { seed: 5 }), bigW ?? [3440]);

{ // Splash: stacked lockup centred.
  const lock = L.stackedLockup('primary');
  const w = 760;
  const h = (w * lock.h) / lock.w;
  out('05_Backgrounds/KINJURA_Splash_16x9', bgDoc(1920, 1080, { seed: 9, horizon: 0.42 }, nest(lock.svg, (1920 - w) / 2, (1080 - h) / 2 - 10, w)), bigW ?? [1920, 3840]);
}
{ // Startup hold: crest only, for an app's first frame.
  const c = emblemSvg({ glow: true, id: 'h' }, BOX.crest);
  out('05_Backgrounds/KINJURA_Startup_Hold_16x9', bgDoc(1920, 1080, { seed: 13, horizon: 0.5, petals: false }, nest(c, 960 - 230, 540 - 240, 460)), [1920]);
}
{ // Loading screen: horizontal lockup bottom-left, progress rule.
  const lock = L.horizontalLockup('primary');
  const defs = [];
  const lw = 520;
  let extra = nest(lock.svg, 96, 1080 - 96 - (lw * lock.h) / lock.w, lw);
  const t = outline('LOADING', { face: 'body', size: 18, tracking: 0.5 });
  extra += `<path transform="translate(${1920 - 96 - t.width} ${1080 - 128})" d="${t.d}" fill="#9A94A3"/>`;
  extra += `<rect x="${1920 - 96 - 420}" y="${1080 - 96}" width="420" height="2" fill="#2A2A36"/>` +
    `<rect x="${1920 - 96 - 420}" y="${1080 - 96}" width="260" height="2" fill="${PALETTE.crimson}"/>` +
    `<path d="M${1920 - 96 - 160} ${1080 - 101}L${1920 - 96 - 156} ${1080 - 95}L${1920 - 96 - 160} ${1080 - 89}L${1920 - 96 - 164} ${1080 - 95}Z" fill="#FF5A69"/>`;
  const bg = L.background(1920, 1080, { seed: 17, horizon: 0.6, focusX: 0.62 });
  out('05_Backgrounds/KINJURA_Loading_16x9', L.svgDoc(1920, 1080, [...bg.defs, ...defs], bg.body + extra), [1920]);
}
{ // Ultrawide branded banner.
  const lock = L.horizontalLockup('primary');
  const w = 1500;
  out('05_Backgrounds/KINJURA_Banner_Ultrawide', bgDoc(3440, 1440, { seed: 21, horizon: 0.55 }, nest(lock.svg, (3440 - w) / 2, (1440 - (w * lock.h) / lock.w) / 2, w)), bigW ?? [3440]);
}
{ // Wide web banner (Nexus / Ko-fi / X header style).
  const lock = L.horizontalLockup('primary');
  const w = 900;
  out('05_Backgrounds/KINJURA_Banner_Web_1500x500', bgDoc(1500, 500, { seed: 27, horizon: 0.62, petalBand: 0.2 }, nest(lock.svg, (1500 - w) / 2, (500 - (w * lock.h) / lock.w) / 2, w)), [1500]);
}
out('05_Backgrounds/KINJURA_Social_Card', L.stampSocial({ name: 'KINJURA', tagline: 'Games  ·  Worlds  ·  Tools  ·  Creations', kicker: 'STUDIO', brandTitle: true }), [1280]);

{ // Lower third: transparent, for video / streams.
  const W = 1920, H = 220;
  const defs = [];
  const plate = 'ltplate';
  defs.push(`<linearGradient id="${plate}" x1="0" x2="1"><stop offset="0" stop-color="#0B0B10" stop-opacity=".92"/>` +
    `<stop offset=".55" stop-color="#0B0B10" stop-opacity=".75"/><stop offset="1" stop-color="#0B0B10" stop-opacity="0"/></linearGradient>`);
  const c = emblemSvg({ glow: true, id: 'l' }, BOX.crest);
  const wm = wordmark();
  const ws = 0.5;
  const tg = outline(L.TAGLINE, { face: 'body', size: 18, tracking: 0.42 });
  let body = `<rect x="0" y="40" width="1300" height="150" fill="url(#${plate})"/>` +
    `<rect x="0" y="186" width="1100" height="2" fill="${PALETTE.crimson}"/>` +
    nest(c, 60, 46, 140) +
    `<g transform="translate(230 74) scale(${ws})">${wm.body}</g>` +
    `<path transform="translate(232 148)" d="${tg.d}" fill="#B3ADBC"/>`;
  out('05_Backgrounds/KINJURA_Lower_Third', L.svgDoc(W, H, defs, body), [1920]);
}

// ---- 06 FX --------------------------------------------------------------
log('fx');
out('06_FX/KINJURA_FX_Ring', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="12 18 488 488" width="1024" height="1024"><path d="${ringPaths().join('')}" fill="${PALETTE.crimson}"/></svg>`, 1024);
out('06_FX/KINJURA_FX_Petal', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 24 24" width="256" height="256"><path d="${L.PETAL}" fill="${PALETTE.crimson}"/></svg>`, 256);
{
  const bg = L.background(1920, 1080, { seed: 31, sparks: false, ring: false, grain: false, petalBand: 0.5 });
  const petals = bg.body.match(/<path d="M0 11[^>]*>/g).join('');
  out('06_FX/KINJURA_FX_Petals_Scatter', L.svgDoc(1920, 1080, [], petals), [1920]);
}
out('06_FX/KINJURA_FX_Spark', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256"><defs><radialGradient id="s"><stop offset="0" stop-color="#FFF2F3"/><stop offset=".12" stop-color="#FF5A69"/><stop offset=".45" stop-color="#D12F3F" stop-opacity=".35"/><stop offset="1" stop-color="#D12F3F" stop-opacity="0"/></radialGradient></defs><circle cx="128" cy="128" r="128" fill="url(#s)"/></svg>`, 256);
out('06_FX/KINJURA_FX_Flare', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 256" width="2048" height="256"><defs><radialGradient id="f" cx=".5" cy=".5" r=".5" gradientTransform="translate(0 .5) scale(1 .06) translate(0 -.5)"><stop offset="0" stop-color="#FFF2F3"/><stop offset=".08" stop-color="#FF5A69"/><stop offset=".4" stop-color="#D12F3F" stop-opacity=".4"/><stop offset="1" stop-color="#D12F3F" stop-opacity="0"/></radialGradient><radialGradient id="g"><stop offset="0" stop-color="#FFF2F3"/><stop offset=".25" stop-color="#FF5A69" stop-opacity=".6"/><stop offset="1" stop-color="#D12F3F" stop-opacity="0"/></radialGradient></defs><rect width="2048" height="256" fill="url(#f)"/><circle cx="1024" cy="128" r="60" fill="url(#g)"/></svg>`, 2048);
{
  const defs = [];
  out('06_FX/KINJURA_Divider', L.svgDoc(1280, 24, defs, L.diamondRule(640, 12, 620, PALETTE.crimson, { diamond: 6, defs })), [1280]);
}

// ---- Tokens -------------------------------------------------------------
log('tokens');
mkdirSync(join(KIT, '00_Tokens'), { recursive: true });
const tokens = {
  name: 'KINJURA', katakana: 'キンジュラ', tagline: 'Games · Worlds · Tools · Creations',
  color: {
    void: PALETTE.void, voidRaised: PALETTE.voidRaised, voidLine: PALETTE.voidLine,
    crimson: PALETTE.crimson, crimsonLight: PALETTE.crimsonLight, crimsonDark: PALETTE.crimsonDark,
    ivory: PALETTE.ivory, steel: '#C9C4CF', ash: '#9A94A3',
    aurum: PALETTE.aurum, aether: PALETTE.aether, mist: PALETTE.mist,
  },
  lanes: Object.fromEntries(Object.entries(L.LANES).map(([k, v]) => [k, v])),
  type: { display: 'Orbitron (OFL)', body: 'Exo 2 (OFL)', japanese: 'Noto Sans JP (OFL)', wordmark: 'custom geometry, not a font' },
};
writeFileSync(join(KIT, '00_Tokens/kinjura.tokens.json'), JSON.stringify(tokens, null, 2) + '\n');
writeFileSync(join(KIT, '00_Tokens/kinjura.css'), `/* KINJURA design tokens */\n:root {\n` +
  Object.entries(tokens.color).map(([k, v]) => `  --kj-${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}: ${v};`).join('\n') +
  `\n  --kj-font-display: 'Orbitron', 'Exo 2', system-ui, sans-serif;\n  --kj-font-body: 'Exo 2', system-ui, sans-serif;\n  --kj-font-jp: 'Noto Sans JP', sans-serif;\n  --kj-tracking-wide: 0.42em;\n}\n`);
manifest.push('00_Tokens/kinjura.tokens.json', '00_Tokens/kinjura.css');

writeFileSync(join(KIT, 'MANIFEST.txt'), manifest.sort().join('\n') + '\n');
log(`done: ${manifest.length} files -> ${KIT}`);
