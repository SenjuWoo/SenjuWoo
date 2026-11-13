// KINJURA emblem: the single geometry source for every mark in the kit.
// Coordinates live in a 512x512 box. Only the left half is authored; the
// right half is mirrored so the crest is always perfectly symmetric.

export const PALETTE = {
  void: '#0B0B10',
  voidRaised: '#15151D',
  voidLine: '#2A2A36',
  crimson: '#D12F3F',
  crimsonLight: '#FF5A69',
  crimsonDark: '#8E1626',
  crimsonDeep: '#4E0A15',
  ivory: '#F2E7DC',
  aurum: '#D9B46B',
  aether: '#8B70E8',
  mist: '#6FA0C8',
};

// Facet tones per metal: [highlight, light, mid, shadow].
export const METALS = {
  steel: ['#F4F1F5', '#C9C4CF', '#8A8494', '#4A4554'],
  aurum: ['#F7E2AE', '#D9B46B', '#A07A3A', '#5E4420'],
  aether: ['#E2DAFF', '#A892F2', '#6B50C8', '#33246E'],
  ivory: ['#FFFFFF', '#F2E7DC', '#CDBFB1', '#8F8274'],
};

// Core (crystal / eyes) tones: [hot, light, base, deep].
export const CORES = {
  crimson: ['#FFD3D7', '#FF5A69', '#D12F3F', '#6E0F1D'],
  aurum: ['#FFF4D6', '#F2CF83', '#C99A45', '#6E4F1C'],
  aether: ['#F0EBFF', '#B9A6FF', '#8B70E8', '#3E2B8C'],
};

const W = 512;
const mx = (x) => W - x;

// Shapes are point lists with optional quadratic control points:
// [x, y] for a corner, [cx, cy, x, y] for a quadratic curve into (x, y).
function path(pts, mirror = false) {
  const f = (x) => (mirror ? mx(x) : x);
  let d = '';
  pts.forEach((p, i) => {
    if (p.length === 2) d += `${i ? 'L' : 'M'}${f(p[0])} ${p[1]}`;
    else d += `Q${f(p[0])} ${p[1]} ${f(p[2])} ${p[3]}`;
  });
  return d + 'Z';
}

// ---- Left-half geometry -------------------------------------------------
// Each part is a list of facets. tone index into METALS/CORES.
const G = {
  // Long outer wing: sweeps out to the far tip, hooked underside.
  outerWing: [
    { t: 1, p: [[212, 272], [128, 222, 12, 216], [110, 252, 198, 302]] },
    { t: 3, p: [[12, 216], [110, 252, 198, 302], [232, 352], [188, 324, 136, 294], [150, 284], [96, 258, 12, 216]] },
  ],
  // Inner wing: rises steeply from the spire shoulder.
  innerWing: [
    { t: 0, p: [[206, 236], [156, 172, 112, 84], [150, 186, 214, 272]] },
    { t: 2, p: [[112, 84], [150, 186, 214, 272], [236, 306], [178, 248, 142, 186], [130, 164, 112, 84]] },
  ],
  // Jaw blade converging to the lower point.
  jaw: [
    { t: 1, p: [[184, 310], [214, 330], [256, 502], [206, 408, 184, 310]] },
    { t: 2, p: [[214, 330], [246, 344], [256, 502]] },
    { t: 3, p: [[246, 344], [256, 502], [256, 362]] },
  ],
  // Eye shard (core colour).
  eye: [
    { t: 1, p: [[164, 286], [238, 322], [242, 338], [184, 316]] },
  ],
};

// Spire and crystal are drawn whole (they straddle the axis).
const SPIRE_L = [[256, 18], [196, 214], [256, 352], [256, 316], [222, 214], [256, 72]];
const CRYSTAL = {
  tl: [[256, 90], [230, 212], [256, 200]],
  tr: [[256, 90], [282, 212], [256, 200]],
  bl: [[230, 212], [256, 300], [256, 200]],
  br: [[282, 212], [256, 300], [256, 200]],
};
const CRYSTAL_D = 'M256 90L230 212L256 300L282 212Z';

// ---- Ring ---------------------------------------------------------------
// Two tapered crescents (brush-stroke ring) with gaps at the spire and the
// lower-right, so the crest breaks out of the circle.
const RC = [256, 262];
function crescent(a0, a1, r, thick) {
  const rad = (a) => (a * Math.PI) / 180;
  const pt = (a, rr) => [RC[0] + rr * Math.cos(rad(a)), RC[1] + rr * Math.sin(rad(a))];
  const [x0, y0] = pt(a0, r);
  const [x1, y1] = pt(a1, r);
  const span = ((a1 - a0) + 360) % 360;
  const large = span > 180 ? 1 : 0;
  // Outer arc bulges by `thick`: a slightly larger radius through the same ends.
  const chord = Math.hypot(x1 - x0, y1 - y0);
  const sag = r - Math.sqrt(Math.max(r * r - (chord / 2) ** 2, 0));
  const R2 = outerRadius(chord, (span > 180 ? 2 * r - sag : sag) + thick, span > 180);
  const n = (v) => v.toFixed(2);
  return `M${n(x0)} ${n(y0)}A${n(r)} ${n(r)} 0 ${large} 1 ${n(x1)} ${n(y1)}` +
         `A${n(R2)} ${n(R2)} 0 ${large} 0 ${n(x0)} ${n(y0)}Z`;
}
// Radius of a circle through a chord with the given sagitta.
function outerRadius(chord, sagitta, major) {
  const h = sagitta;
  const c = chord / 2;
  return major ? (h * h + c * c) / (2 * h) : (h * h + c * c) / (2 * h);
}

export function ringPaths() {
  return [crescent(112, 246, 216, 22), crescent(292, 70, 216, 20)];
}

// ---- Assembly -----------------------------------------------------------
// opts.mode: 'facet' (full colour) or 'flat' (one-colour silhouette with the
// crystal and eyes knocked out).
// opts.parts: which parts to draw (default all). 'core' preset = small-size mark.
// opts.anim: per-part { o: opacity, dx, dy, s: scale } used by the intro
// renderer; the right half mirrors dx automatically.
export const ALL_PARTS = ['ring', 'outerWing', 'innerWing', 'jaw', 'spire', 'crystal', 'eye'];
export const CORE_PARTS = ['innerWing', 'spire', 'crystal'];

export function emblem(opts = {}) {
  const {
    metal = 'steel', core = 'crimson', mode = 'facet', ring = true,
    ringColor = PALETTE.crimson, flat = PALETTE.ivory, glow = false, id = 'kj',
    parts: partList = ALL_PARTS, anim = {},
  } = opts;
  const has = (k) => partList.includes(k) && (k !== 'ring' || ring);
  const M = METALS[metal];
  const C = CORES[core];
  const out = [];
  const defs = [];
  const isFlat = mode === 'flat';

  // Wrap a part's markup in its animation transform (if any).
  const wrap = (k, mirror, body) => {
    const a = anim[k];
    if (!a) return body;
    const dx = (a.dx || 0) * (mirror ? -1 : 1), dy = a.dy || 0, sc = a.s ?? 1;
    const o = a.o ?? 1;
    if (o <= 0) return '';
    // Scale about the crystal centre so parts grow from the heart of the crest.
    const tf = `translate(${dx} ${dy}) translate(256 210) scale(${sc}) translate(-256 -210)`;
    return `<g transform="${tf}" opacity="${o}">${body}</g>`;
  };
  const piece = (facets, colorOf, mirror) =>
    facets.map((f) => {
      const c = colorOf(f.t);
      return `<path d="${path(f.p, mirror)}" fill="${c}" stroke="${c}" stroke-width=".8" stroke-linejoin="round"/>`;
    }).join('');
  const both = (k, colorOf, colorOfR = colorOf) =>
    wrap(k, false, piece(G[k], colorOf, false)) + wrap(k, true, piece(G[k], colorOfR, true));

  const rc = ringColor === 'inherit' ? flat : ringColor;
  if (has('ring')) {
    const a = anim.ring;
    // Sweep: the crescents rotate into place while fading in.
    const rot = a && a.r ? ` transform="rotate(${a.r} ${RC[0]} ${RC[1]})"` : '';
    const op = a && a.o !== undefined ? ` opacity="${a.o}"` : '';
    out.push(`<path d="${ringPaths().join('')}" fill="${rc}"${rot}${op}/>`);
  }

  if (isFlat) {
    const tone = () => flat;
    const body = [];
    for (const k of ['outerWing', 'innerWing', 'jaw']) if (has(k)) body.push(both(k, tone));
    if (has('spire')) {
      // Spire frame with the crystal window knocked out (evenodd).
      body.push(wrap('spire', false, `<path fill-rule="evenodd" fill="${flat}" stroke="${flat}" stroke-width=".8" ` +
        `d="M256 18L196 214L256 352L316 214Z M256 72L222 214L256 316L290 214Z"/>`));
    }
    if (has('crystal')) body.push(wrap('crystal', false, `<path d="${CRYSTAL_D}" fill="${flat}"/>`));
    if (has('eye')) {
      // Eyes are cut out of the silhouette (with a hairline margin).
      const m = `${id}-eyes`;
      const eyes = G.eye.map((f) => `<path d="${path(f.p)}${path(f.p, true)}"/>`).join('');
      defs.push(`<mask id="${m}" maskUnits="userSpaceOnUse" x="-64" y="-64" width="640" height="640">` +
        `<rect x="-64" y="-64" width="640" height="640" fill="#fff"/>` +
        `<g fill="#000" stroke="#000" stroke-width="3" stroke-linejoin="round">${eyes}</g></mask>`);
      out.push(`<g mask="url(#${m})">${body.join('')}</g>`);
    } else out.push(body.join(''));
    return { defs: defs.join(''), body: out.join('') };
  }

  if (glow) {
    defs.push(`<filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%">` +
      `<feGaussianBlur stdDeviation="10"/></filter>`);
  }
  const metalTone = (t) => M[t];
  for (const k of ['outerWing', 'innerWing', 'jaw']) if (has(k)) out.push(both(k, metalTone));
  if (has('spire')) {
    out.push(wrap('spire', false, `<path d="${path(SPIRE_L)}" fill="${M[0]}"/>`) +
      wrap('spire', true, `<path d="${path(SPIRE_L, true)}" fill="${M[2]}"/>`));
  }
  if (glow && (has('crystal') || has('eye'))) {
    const gl = (has('crystal') ? `<path d="${CRYSTAL_D}"/>` : '') +
      (has('eye') ? G.eye.map((f) => `<path d="${path(f.p)}${path(f.p, true)}"/>`).join('') : '');
    const go = Math.min(anim.crystal?.o ?? 1, 1) * 0.85;
    out.push(`<g filter="url(#${id}-glow)" fill="${C[1]}" opacity="${go}">${gl}</g>`);
  }
  if (has('crystal')) {
    out.push(wrap('crystal', false,
      `<path d="${path(CRYSTAL.tl)}" fill="${C[1]}"/><path d="${path(CRYSTAL.tr)}" fill="${C[2]}"/>` +
      `<path d="${path(CRYSTAL.bl)}" fill="${C[2]}"/><path d="${path(CRYSTAL.br)}" fill="${C[3]}"/>` +
      `<path d="M256 108L244 200L256 194Z" fill="${C[0]}" opacity=".9"/>`));
  }
  if (has('eye')) out.push(both('eye', () => C[1], () => C[2]));
  return { defs: defs.join(''), body: out.join('') };
}

// Bounding boxes (in the 512 box) used to frame each mark tightly.
export const BOX = {
  crest: [12, 12, 488, 492],
  emblem: [8, 14, 496, 492],
  core: [100, 14, 312, 342],
};

export function emblemSvg(opts = {}, box = BOX.crest, size = 1024) {
  const { defs, body } = emblem(opts);
  const [x, y, w, h] = box;
  const side = Math.max(w, h);
  const vx = x - (side - w) / 2, vy = y - (side - h) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${side} ${side}" width="${size}" height="${size}">` +
    (defs ? `<defs>${defs}</defs>` : '') + body + `</svg>`;
}
