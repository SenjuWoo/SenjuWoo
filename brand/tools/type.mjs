// Letterforms. The KINJURA wordmark and the katakana are drawn here as
// geometry (no font involved); everything else is outlined from OFL fonts
// via opentype.js so every SVG renders identically everywhere, GitHub included.
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const FONT_FILES = {
  display: 'node_modules/@fontsource/orbitron/files/orbitron-latin-700-normal.woff',
  displayMed: 'node_modules/@fontsource/orbitron/files/orbitron-latin-500-normal.woff',
  body: 'node_modules/@fontsource/exo-2/files/exo-2-latin-500-normal.woff',
  bodyBold: 'node_modules/@fontsource/exo-2/files/exo-2-latin-700-normal.woff',
};
const cache = {};
function font(name) {
  if (!cache[name]) {
    const buf = readFileSync(join(HERE, FONT_FILES[name]));
    cache[name] = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }
  return cache[name];
}

// Outline a string. Returns { d, width, height } with the cap top at y=0.
// tracking is in em fractions (0.3 = 30% of the size between letters).
export function outline(text, { face = 'display', size = 48, tracking = 0 } = {}) {
  const f = font(face);
  const scale = size / f.unitsPerEm;
  const capH = (f.tables.os2.sCapHeight || f.ascender * 0.7) * scale;
  let x = 0;
  let d = '';
  const glyphs = f.stringToGlyphs(text);
  glyphs.forEach((g, i) => {
    d += g.getPath(x, capH, size).toPathData(2);
    x += g.advanceWidth * scale;
    if (i < glyphs.length - 1) {
      x += f.getKerningValue(g, glyphs[i + 1]) * scale + tracking * size;
    }
  });
  return { d, width: x, height: capH };
}

// Fit text into maxWidth by shrinking size; returns outline at the fitted size.
export function outlineFit(text, opts, maxWidth) {
  let o = outline(text, opts);
  if (o.width > maxWidth) o = outline(text, { ...opts, size: (opts.size * maxWidth) / o.width });
  return o;
}

// ---- KINJURA wordmark ---------------------------------------------------
// Cap height 100, stroke 12, chamfered corners echo the crest's blade cuts.
const GLYPHS = {
  K: { w: 92, d: 'M0 0H12V100H0Z M12 46L74 0H93L12 61Z M28 50L41 41L94 100H76Z' },
  I: { w: 12, d: 'M0 0H12V100H0Z' },
  N: { w: 96, d: 'M0 0H12V100H0Z M84 0H96V100H84Z M0 0H16L96 100H80Z' },
  J: { w: 84, d: 'M72 0H84V86L70 100H14L0 86V62H12V82L18 88H66L72 82Z' },
  U: { w: 96, d: 'M0 0H12V82L18 88H78L84 82V0H96V86L82 100H14L0 86Z' },
  R: { w: 92, d: 'M0 0H76L90 14V44L76 58H12V100H0Z M12 12V46H72L78 40V18L72 12Z M46 58H62L93 100H76Z' },
  A: { w: 100, d: 'M0 100L43 0H57L100 100H87L50 14L13 100Z M24 62H76V73H24Z' },
};
export const WORD = 'KINJURA';
export const WORD_GAP = 46; // generous tracking, as in the concept

// Returns { body, width, height:100 }. The J carries the crimson slash when
// slash !== false. Colour of letters = fill; slash colour = slashColor.
export function wordmark({ fill = '#F2E7DC', slash = true, slashColor = '#D12F3F', gap = WORD_GAP } = {}) {
  let x = 0;
  const parts = [];
  let jx = 0;
  for (const ch of WORD) {
    const g = GLYPHS[ch];
    if (ch === 'J') jx = x;
    parts.push(`<path transform="translate(${x} 0)" d="${g.d}"/>`);
    x += g.w + gap;
  }
  const width = x - gap;
  let body = `<g fill="${fill}">${parts.join('')}</g>`;
  if (slash) {
    // Tapered blade crossing the J, lower-left to upper-right; widest at
    // the middle so it reads as a cut, not a strikethrough.
    const x0 = jx - 4, y0 = 104, x1 = jx + 100, y1 = -10;
    const mxp = (x0 + x1) / 2, myp = (y0 + y1) / 2;
    const len = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / len * 3.2, ny = (x1 - x0) / len * 3.2;
    const f = (v) => v.toFixed(1);
    body += `<path d="M${f(x0)} ${f(y0)}L${f(mxp + nx)} ${f(myp + ny)}L${f(x1)} ${f(y1)}L${f(mxp - nx)} ${f(myp - ny)}Z" fill="${slashColor}"/>`;
  }
  return { body, width, height: 100 };
}

// ---- キンジュラ -----------------------------------------------------------
// Stroked katakana on a 100-unit em. Rendered with butt caps, miter joins.
const KANA = [
  // キ
  'M12 32L86 25 M6 60L94 52 M42 6L58 96',
  // ン
  'M14 18L34 34 M16 90Q66 76 90 22',
  // ジ
  'M16 14L32 26 M8 40L24 52 M14 92Q60 80 86 30 M74 4L80 18 M88 2L94 16',
  // ュ
  'M28 52H64V82 M18 82H80',
  // ラ
  'M24 14H74 M12 40H84Q76 80 32 96',
];
export function katakana({ stroke = '#F2E7DC', weight = 9, gap = 34 } = {}) {
  const parts = KANA.map((d, i) => `<path transform="translate(${i * (100 + gap)} 0)" d="${d}"/>`);
  const width = KANA.length * (100 + gap) - gap;
  return {
    body: `<g fill="none" stroke="${stroke}" stroke-width="${weight}" stroke-linecap="butt" stroke-linejoin="miter">${parts.join('')}</g>`,
    width, height: 100,
  };
}
