// Shared compositions: colourways, lockups, backgrounds and the stamp
// templates. build.mjs (the kit) and stamp.mjs (per-project) both use these,
// so a project stamp is always pixel-consistent with the master kit.
import { emblem, PALETTE, METALS } from './emblem.mjs';
import { wordmark, katakana, outline, outlineFit } from './type.mjs';

METALS.ink = ['#5A5464', '#3A3542', '#24212B', '#0B0B10'];

export const TAGLINE = 'GAMES  ·  WORLDS  ·  TOOLS  ·  CREATIONS';

export const THEMES = {
  primary: { metal: 'steel', core: 'crimson', ring: PALETTE.crimson, word: PALETTE.ivory, slash: PALETTE.crimson,
    kana: '#CFC5BB', rule: PALETTE.crimson, tag: '#9A94A3', glow: true, dark: true },
  light: { metal: 'ink', core: 'crimson', ring: PALETTE.crimson, word: PALETTE.void, slash: PALETTE.crimson,
    kana: '#3A3542', rule: PALETTE.crimson, tag: '#5A5464', glow: false, dark: false },
  'mono-ivory': { mode: 'flat', flat: PALETTE.ivory, ring: 'inherit', word: PALETTE.ivory, slash: false,
    kana: PALETTE.ivory, rule: PALETTE.ivory, tag: PALETTE.ivory, dark: true },
  'mono-void': { mode: 'flat', flat: PALETTE.void, ring: 'inherit', word: PALETTE.void, slash: false,
    kana: PALETTE.void, rule: PALETTE.void, tag: PALETTE.void, dark: false },
  gold: { metal: 'aurum', core: 'aurum', ring: PALETTE.aurum, word: '#E8C987', slash: PALETTE.aurum,
    kana: '#E9D9B6', rule: PALETTE.aurum, tag: '#BFA57A', glow: true, dark: true },
  aether: { metal: 'aether', core: 'aether', ring: PALETTE.aether, word: '#CFC4FF', slash: PALETTE.aether,
    kana: '#D8CFFF', rule: PALETTE.aether, tag: '#9C8FD0', glow: true, dark: true },
};

// Lane accents for stamped projects. The crest keeps its crimson core in
// every lane; the accent drives the ring, rules and atmosphere.
export const LANES = {
  games: { label: 'GAMES & MODS', accent: PALETTE.crimson, light: '#FF5A69' },
  forge: { label: 'FORGE WORKBENCH', accent: PALETTE.aether, light: '#B9A6FF' },
  native: { label: 'NATIVE PLUGIN', accent: PALETTE.aurum, light: '#F2CF83' },
  app: { label: 'WINDOWS APP', accent: PALETTE.mist, light: '#A9CBE6' },
  ai: { label: 'AGENT TOOLING', accent: PALETTE.aether, light: '#B9A6FF' },
  release: { label: 'RELEASE', accent: PALETTE.aurum, light: '#F2CF83' },
};

const n = (v) => Math.round(v * 100) / 100;
let uid = 0;
const nid = (p) => `${p}${(uid++).toString(36)}`;
// Reset per document set so a project stamps identically alone or in a batch.
export const resetIds = () => { uid = 0; };

export function crestFor(theme, extra = {}) {
  const t = THEMES[theme] || theme;
  return emblem({
    metal: t.metal, core: t.core, mode: t.mode || 'facet', flat: t.flat,
    ringColor: t.ring, glow: t.glow, id: nid('c'), ...extra,
  });
}

// Fading rule with a diamond in the middle (the crest's crystal, in miniature).
export function diamondRule(cx, y, half, color, { diamond = 7, weight = 1.5, defs }) {
  const g = nid('r');
  defs.push(`<linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="${n(cx - half)}" x2="${n(cx + half)}" y1="0" y2="0">` +
    `<stop offset="0" stop-color="${color}" stop-opacity="0"/><stop offset=".5" stop-color="${color}"/>` +
    `<stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient>`);
  return `<rect x="${n(cx - half)}" y="${n(y - weight / 2)}" width="${n(half * 2)}" height="${weight}" fill="url(#${g})"/>` +
    (diamond ? `<path d="M${n(cx)} ${n(y - diamond)}L${n(cx + diamond * 0.6)} ${n(y)}L${n(cx)} ${n(y + diamond)}L${n(cx - diamond * 0.6)} ${n(y)}Z" fill="${color}"/>` : '');
}

const svgDoc = (w, h, defs, body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(w)} ${n(h)}" width="${Math.round(w)}" height="${Math.round(h)}">` +
  (defs.length ? `<defs>${defs.join('')}</defs>` : '') + (bg || '') + body + `</svg>`;

// ---- Lockups ------------------------------------------------------------
export function stackedLockup(theme, { tagline = TAGLINE, kana = true } = {}) {
  const t = THEMES[theme];
  const defs = [];
  const W = 1200, pad = 40;
  const crest = crestFor(theme);
  defs.push(crest.defs);
  const cs = 0.94; // crest scale (512 -> ~480)
  const wm = wordmark({ fill: t.word, slash: t.slash !== false, slashColor: t.slash || t.word });
  const ws = 880 / wm.width;
  let y = pad;
  let body = `<g transform="translate(${n(W / 2 - 256 * cs)} ${y}) scale(${cs})">${crest.body}</g>`;
  y += 512 * cs + 36;
  body += `<g transform="translate(${n((W - wm.width * ws) / 2)} ${n(y)}) scale(${n(ws)})">${wm.body}</g>`;
  y += 100 * ws + 34;
  if (kana) {
    const k = katakana({ stroke: t.kana });
    const ks = 0.3;
    const kw = k.width * ks;
    body += `<g transform="translate(${n((W - kw) / 2)} ${n(y)}) scale(${ks})">${k.body}</g>`;
    body += diamondRule(W / 2 - kw / 2 - 150, y + 15, 120, t.rule, { diamond: 0, defs }) +
      diamondRule(W / 2 + kw / 2 + 150, y + 15, 120, t.rule, { diamond: 0, defs });
    y += 30 + 40;
  }
  if (tagline) {
    const o = outline(tagline, { face: 'body', size: 22, tracking: 0.42 });
    body += `<path transform="translate(${n((W - o.width) / 2)} ${n(y)})" d="${o.d}" fill="${t.tag}"/>`;
    y += o.height + pad;
  }
  return { svg: svgDoc(W, y, defs, body), w: W, h: y };
}

export function horizontalLockup(theme, { kana = true } = {}) {
  const t = THEMES[theme];
  const defs = [];
  const crest = crestFor(theme);
  defs.push(crest.defs);
  const H = 300, cs = H / 512;
  const wm = wordmark({ fill: t.word, slash: t.slash !== false, slashColor: t.slash || t.word });
  const ws = 0.84;
  const x0 = H + 36;
  const wy = kana ? 84 : 100;
  let body = `<g transform="scale(${n(cs)})">${crest.body}</g>`;
  body += `<g transform="translate(${x0} ${wy}) scale(${ws})">${wm.body}</g>`;
  const wW = wm.width * ws;
  if (kana) {
    const k = katakana({ stroke: t.kana, gap: 60 });
    const ks = 0.24;
    body += diamondRule(x0 + wW / 2, wy + 100 * ws + 26, wW / 2, t.rule, { diamond: 6, defs });
    body += `<g transform="translate(${n(x0 + (wW - k.width * ks) / 2)} ${n(wy + 100 * ws + 46)}) scale(${ks})">${k.body}</g>`;
  }
  return { svg: svgDoc(x0 + wW + 8, H, defs, body), w: x0 + wW + 8, h: H };
}

export function minimalLockup(theme) {
  const t = THEMES[theme];
  const defs = [];
  const wm = wordmark({ fill: t.word, slash: false });
  const W = wm.width + 40;
  let body = `<g transform="translate(20 10)">${wm.body}</g>`;
  body += diamondRule(W / 2, 142, W / 2 - 20, t.rule, { diamond: 9, defs });
  body += `<path d="M${n(W / 2 - 9)} 162L${n(W / 2)} 186L${n(W / 2 + 9)} 162L${n(W / 2)} 170Z" fill="${t.rule}"/>`;
  return { svg: svgDoc(W, 196, defs, body), w: W, h: 196 };
}

export function wordmarkSvg(theme, { slash = true } = {}) {
  const t = THEMES[theme];
  const wm = wordmark({ fill: t.word, slash: slash && t.slash !== false, slashColor: t.slash || t.word });
  // Pad for the slash, which overshoots the cap height.
  return svgDoc(wm.width + 24, 136, [], `<g transform="translate(12 18)">${wm.body}</g>`);
}

export function kanaSvg(theme) {
  const t = THEMES[theme];
  const k = katakana({ stroke: t.kana, weight: 10 });
  return svgDoc(k.width + 20, 120, [], `<g transform="translate(10 10)">${k.body}</g>`);
}

// ---- Atmosphere ---------------------------------------------------------
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const PETAL = 'M0 11C-8 5-8-5-2.4-10.5L0-7.6L2.4-10.5C8-5 8 5 0 11Z';

// Cinematic void background. Returns { defs: [], body } sized w x h.
export function background(w, h, { accent = PALETTE.crimson, accentLight = '#FF5A69', seed = 7, petals = true,
  sparks = true, ring = true, horizon = 0.66, focusX = 0.5, grain = true, petalBand = 0.45 } = {}) {
  const r = rng(seed);
  const defs = [];
  const sky = nid('sky'), glow = nid('glow'), vig = nid('vig'), hz = nid('hz'), gr = nid('gr');
  defs.push(`<linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07070B"/>` +
    `<stop offset=".62" stop-color="#0D0B12"/><stop offset="1" stop-color="#140D14"/></linearGradient>`);
  defs.push(`<radialGradient id="${glow}" gradientUnits="userSpaceOnUse" cx="${n(w * focusX)}" cy="${n(h * horizon)}" r="${n(Math.max(w, h) * 0.55)}">` +
    `<stop offset="0" stop-color="${accent}" stop-opacity=".30"/><stop offset=".35" stop-color="${accent}" stop-opacity=".10"/>` +
    `<stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>`);
  defs.push(`<radialGradient id="${vig}" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/>` +
    `<stop offset="1" stop-color="#000" stop-opacity=".7"/></radialGradient>`);
  defs.push(`<linearGradient id="${hz}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${accentLight}" stop-opacity="0"/>` +
    `<stop offset=".5" stop-color="${accentLight}" stop-opacity=".55"/><stop offset="1" stop-color="${accentLight}" stop-opacity="0"/></linearGradient>`);
  let body = `<rect width="${w}" height="${h}" fill="url(#${sky})"/><rect width="${w}" height="${h}" fill="url(#${glow})"/>`;
  if (ring) {
    // A huge faint ring echoing the crest's halo: the "portal".
    const R = Math.max(w, h) * 0.42, cx = w * focusX, cy = h * horizon + R * 0.15;
    body += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R)}" fill="none" stroke="#fff" stroke-opacity=".035" stroke-width="2"/>` +
      `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R * 0.86)}" fill="none" stroke="${accent}" stroke-opacity=".08" stroke-width="1.2" stroke-dasharray="2 14"/>`;
  }
  body += `<rect x="0" y="${n(h * horizon)}" width="${w}" height="1.4" fill="url(#${hz})"/>`;
  if (sparks) {
    let s = '';
    const count = Math.round((w * h) / 9000);
    for (let i = 0; i < count; i++) {
      // Bias sparks toward the glow.
      const x = w * (focusX + (r() - 0.5) * (0.4 + r() * 0.9));
      const y = h * horizon - Math.pow(r(), 1.6) * h * 0.7 + (r() - 0.5) * 40;
      const rad = 0.5 + Math.pow(r(), 3) * 2.2;
      const c = r() < 0.7 ? accentLight : '#F2E7DC';
      s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(rad)}" fill="${c}" opacity="${n(0.15 + r() * 0.6)}"/>`;
    }
    body += s;
  }
  if (petals) {
    let p = '';
    const count = Math.round((w * h) / 70000) + 4;
    for (let i = 0; i < count; i++) {
      // Petals drift in from the upper corners, thinning toward the centre.
      const side = r() < 0.5 ? 0 : 1;
      const x = side ? w * (1 - Math.pow(r(), 1.8) * petalBand) : w * Math.pow(r(), 1.8) * petalBand;
      const y = h * Math.pow(r(), 1.3) * 0.9;
      const sc = 0.5 + r() * 1.1;
      const c = r() < 0.6 ? PALETTE.crimson : '#FF7A86';
      p += `<path d="${PETAL}" transform="translate(${n(x)} ${n(y)}) rotate(${Math.round(r() * 360)}) scale(${n(sc)} ${n(sc * (0.6 + r() * 0.4))})" fill="${c}" opacity="${n(0.35 + r() * 0.5)}"/>`;
    }
    body += p;
  }
  body += `<rect width="${w}" height="${h}" fill="url(#${vig})"/>`;
  if (grain) {
    defs.push(`<filter id="${gr}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${seed}" stitchTiles="stitch"/>` +
      `<feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 0"/></filter>`);
    body += `<rect width="${w}" height="${h}" filter="url(#${gr})" opacity=".05"/>`;
  }
  return { defs, body };
}

// ---- Stamp templates ----------------------------------------------------
function laneOf(lane) {
  return LANES[lane] || LANES.games;
}
function crestLane(L, extra = {}) {
  return emblem({ metal: 'steel', core: 'crimson', ringColor: L.accent, glow: true, id: nid('c'), ...extra });
}
const kickerText = (L, kicker) => (kicker || `KINJURA  ·  ${L.label}`).toUpperCase();

// README header, 1280 x 320.
export function stampHeader({ name, tagline = '', lane = 'games', kicker, seed = 11 }) {
  const L = laneOf(lane);
  const W = 1280, H = 320;
  const bg = background(W, H, { accent: L.accent, accentLight: L.light, seed, horizon: 0.78, focusX: 0.17, petals: true, petalBand: 0.16 });
  const defs = [...bg.defs];
  const crest = crestLane(L);
  defs.push(crest.defs);
  const cs = 250 / 512;
  let body = bg.body + `<g transform="translate(${n(218 - 256 * cs)} ${n(H / 2 - 256 * cs)}) scale(${n(cs)})">${crest.body}</g>`;
  const x0 = 380, maxW = W - x0 - 70;
  const k = outline(kickerText(L, kicker), { face: 'body', size: 16, tracking: 0.38 });
  const t = outlineFit(name, { face: 'display', size: 64, tracking: 0.04 }, maxW);
  const tg = tagline ? outlineFit(tagline, { face: 'body', size: 23, tracking: 0.02 }, maxW) : null;
  const blockH = k.height + 22 + t.height + (tg ? 30 + tg.height : 0);
  let y = (H - blockH) / 2;
  body += `<path transform="translate(${x0} ${n(y)})" d="${k.d}" fill="${L.light}"/>`;
  y += k.height + 22;
  body += `<path transform="translate(${x0} ${n(y)})" d="${t.d}" fill="${PALETTE.ivory}"/>`;
  y += t.height;
  body += diamondRule(x0 + Math.min(t.width, maxW) * 0.5, y + 16, Math.min(t.width, maxW) * 0.5, L.accent, { diamond: 0, weight: 1.2, defs });
  if (tg) body += `<path transform="translate(${x0} ${n(y + 30)})" d="${tg.d}" fill="#B3ADBC"/>`;
  // Signature: mini wordmark, bottom right.
  const wm = wordmark({ fill: PALETTE.ivory, slash: true, slashColor: L.accent });
  const ws = 13 / 100;
  body += `<g opacity=".55" transform="translate(${n(W - 36 - wm.width * ws)} ${H - 30}) scale(${ws})">${wm.body}</g>`;
  return svgDoc(W, H, defs, body);
}

// Repo social preview, 1280 x 640 (GitHub's recommended size).
export function stampSocial({ name, tagline = '', lane = 'games', kicker, seed = 23, w = 1280, h = 640, brandTitle = false }) {
  const L = laneOf(lane);
  const sc = w / 1280;
  const bg = background(w, h, { accent: L.accent, accentLight: L.light, seed, horizon: 0.5, petals: true, petalBand: 0.24 });
  const defs = [...bg.defs];
  const crest = crestLane(L);
  defs.push(crest.defs);
  const cs = (250 * sc) / 512;
  let body = bg.body + `<g transform="translate(${n(w / 2 - 256 * cs)} ${n(52 * sc)}) scale(${n(cs)})">${crest.body}</g>`;
  let y = 340 * sc;
  if (brandTitle) {
    // The studio card uses the drawn wordmark, never a font.
    const bw = wordmark({ fill: PALETTE.ivory, slash: true, slashColor: L.accent });
    const bs = (64 * sc) / 100;
    body += `<g transform="translate(${n((w - bw.width * bs) / 2)} ${n(y)}) scale(${n(bs)})">${bw.body}</g>`;
    y += 64 * sc + 28 * sc;
  } else {
    const t = outlineFit(name, { face: 'display', size: 70 * sc, tracking: 0.04 }, w - 160 * sc);
    body += `<path transform="translate(${n((w - t.width) / 2)} ${n(y)})" d="${t.d}" fill="${PALETTE.ivory}"/>`;
    y += t.height + 28 * sc;
  }
  body += diamondRule(w / 2, y, 260 * sc, L.accent, { diamond: 6 * sc, weight: 1.5 * sc, defs });
  y += 30 * sc;
  if (tagline) {
    const tg = outlineFit(tagline, { face: 'body', size: 26 * sc, tracking: 0.02 }, w - 200 * sc);
    body += `<path transform="translate(${n((w - tg.width) / 2)} ${n(y)})" d="${tg.d}" fill="#B3ADBC"/>`;
  }
  // Footer strip: wordmark left, lane right.
  const wm = wordmark({ fill: PALETTE.ivory, slash: true, slashColor: L.accent });
  const ws = (18 * sc) / 100;
  body += `<g opacity=".8" transform="translate(${n(48 * sc)} ${n(h - 52 * sc)}) scale(${n(ws)})">${wm.body}</g>`;
  const k = outline(kickerText(L, kicker).replace(/^KINJURA\s+·\s+/, ''), { face: 'body', size: 15 * sc, tracking: 0.38 });
  body += `<path transform="translate(${n(w - 48 * sc - k.width)} ${n(h - 50 * sc)})" d="${k.d}" fill="${L.light}"/>`;
  return svgDoc(w, h, defs, body);
}

// App / repo icon, 1024 tile.
export function stampIcon({ lane = 'games', shape = 'tile', parts, size = 1024, theme } = {}) {
  const L = laneOf(lane);
  const S = 1024;
  const defs = [];
  const bgG = nid('ig'), edge = nid('ie');
  defs.push(`<radialGradient id="${bgG}" cx=".5" cy=".42" r=".7"><stop offset="0" stop-color="#1D1520"/>` +
    `<stop offset=".6" stop-color="#0F0D14"/><stop offset="1" stop-color="#07070B"/></radialGradient>`);
  defs.push(`<linearGradient id="${edge}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.light}" stop-opacity=".55"/>` +
    `<stop offset="1" stop-color="${L.accent}" stop-opacity=".12"/></linearGradient>`);
  const tile = shape === 'circle'
    ? `<circle cx="512" cy="512" r="512" fill="url(#${bgG})"/><circle cx="512" cy="512" r="506" fill="none" stroke="url(#${edge})" stroke-width="6"/>`
    : `<rect width="1024" height="1024" rx="228" fill="url(#${bgG})"/><rect x="4" y="4" width="1016" height="1016" rx="224" fill="none" stroke="url(#${edge})" stroke-width="6"/>`;
  const glow = nid('ih');
  defs.push(`<radialGradient id="${glow}" cx=".5" cy=".42" r=".42"><stop offset="0" stop-color="${L.accent}" stop-opacity=".28"/>` +
    `<stop offset="1" stop-color="${L.accent}" stop-opacity="0"/></radialGradient>`);
  const opts = theme ? { ...THEMES[theme], ringColor: THEMES[theme].ring } : {};
  const crest = theme
    ? crestFor(theme, parts ? { parts } : {})
    : crestLane(L, parts ? { parts } : {});
  defs.push(crest.defs);
  const isCore = parts && !parts.includes('outerWing');
  // Core mark is tall and narrow; frame it larger.
  const cs = isCore ? 2.35 : 1.62;
  const cy = isCore ? 178 : 252;
  const body = tile + `<rect width="1024" height="1024" rx="228" fill="url(#${glow})"/>` +
    `<g transform="translate(512 512) scale(${cs}) translate(-256 -${cy})">${crest.body}</g>`;
  void opts;
  return svgDoc(S, S, defs, body).replace(`width="1024" height="1024"`, `width="${size}" height="${size}"`);
}

// Small README badge: [core mark KINJURA | LANE].
export function stampBadge({ lane = 'games', label } = {}) {
  const L = laneOf(lane);
  const defs = [];
  const H = 28;
  const crest = emblem({ mode: 'flat', flat: PALETTE.ivory, parts: ['innerWing', 'spire', 'crystal'], ring: false, id: nid('b') });
  defs.push(crest.defs);
  const left = outline('KINJURA', { face: 'display', size: 10.5, tracking: 0.3 });
  const right = outline((label || L.label).toUpperCase(), { face: 'bodyBold', size: 10.5, tracking: 0.2 });
  const lw = 30 + left.width + 12, rw = right.width + 24;
  const ty = (H - left.height) / 2;
  const body = `<rect width="${n(lw + rw)}" height="${H}" rx="4" fill="${PALETTE.void}"/>` +
    `<path d="M${n(lw)} 0H${n(lw + rw - 4)}Q${n(lw + rw)} 0 ${n(lw + rw)} 4V${H - 4}Q${n(lw + rw)} ${H} ${n(lw + rw - 4)} ${H}H${n(lw)}Z" fill="${L.accent}"/>` +
    `<g transform="translate(6 3.5) scale(.064) translate(-100 -14)">${crest.body}</g>` +
    `<path transform="translate(28 ${n(ty)})" d="${left.d}" fill="${PALETTE.ivory}"/>` +
    `<path transform="translate(${n(lw + 12)} ${n(ty)})" d="${right.d}" fill="#0B0B10"/>`;
  return svgDoc(lw + rw, H, defs, body);
}

// README footer / divider, 1280 x 72.
export function stampFooter({ lane = 'games', text = 'A  KINJURA  PROJECT' } = {}) {
  const L = laneOf(lane);
  const W = 1280, H = 72;
  const defs = [];
  const o = outline(text, { face: 'body', size: 13, tracking: 0.42 });
  const k = katakana({ stroke: '#8A8494', weight: 11 });
  const ks = 0.11;
  let body = diamondRule(W / 2, 22, 560, L.accent, { diamond: 6, defs });
  body += `<path transform="translate(${n((W - o.width) / 2)} 38)" d="${o.d}" fill="#9A94A3"/>`;
  body += `<g transform="translate(${n((W - k.width * ks) / 2)} 58) scale(${ks})">${k.body}</g>`;
  return svgDoc(W, H, defs, body);
}

export { svgDoc, n, nid };
