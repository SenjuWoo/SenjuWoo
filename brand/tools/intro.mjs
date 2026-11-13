// Renders the 3.5 s KINJURA startup intro from the same vector parts as the
// kit (true per-part motion, not blended stills), then encodes with ffmpeg.
//   node intro.mjs [--audio path.wav] [--fps 60] [--w 1920]
// Timeline follows the concept board: 0.0 ignition, 0.5 halo forms,
// 1.1 core assembles, 1.8 emblem locks, 2.4 title reveal, 3.0-3.5 hold.
import { mkdirSync, rmSync, existsSync, copyFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { emblem, PALETTE } from './emblem.mjs';
import { wordmark, katakana, outline } from './type.mjs';
import * as L from './layout.mjs';
import { renderPng } from './render.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'kit', '07_Intro');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const FPS = Number(opt('fps', 60));
const RW = Number(opt('w', 1920));
const AUDIO = opt('audio', null);
const DUR = 3.5;
const W = 1920, H = 1080;

const clamp = (v) => Math.max(0, Math.min(1, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeBack = (x) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const n = (v) => Math.round(v * 100) / 100;

// Static layers, built once.
const bg = L.background(W, H, { seed: 9, horizon: 0.385, petals: false });
const petalsBg = L.background(W, H, { seed: 41, sparks: false, ring: false, grain: false, petalBand: 0.5 });
const petals = petalsBg.body.match(/<path d="M0 11[^>]*>/g).join('');
const wm = wordmark();
const kana = katakana({ stroke: '#CFC5BB' });
const tag = outline(L.TAGLINE, { face: 'body', size: 20, tracking: 0.42 });

// Layout (matches the splash).
const CREST = { x: 960, y: 404, s: 0.6 };        // crest centre-top anchor, scale
const crestTop = CREST.y - 256 * CREST.s + 40;   // crest box top
const WM = { w: 560 };
const wms = WM.w / wm.width;
const wmY = 628;
const kanaS = 0.22, kanaY = wmY + 100 * wms + 26;
const tagY = kanaY + 22 + 34;

function frame(t) {
  const defs = [...bg.defs];
  let body = '';
  // Background fades up with the halo.
  const bgO = easeOut(seg(t, 0.15, 1.2));
  body += `<rect width="${W}" height="${H}" fill="#000"/>`;
  body += `<g opacity="${n(bgO)}">${bg.body}</g>`;
  // Petals drift down and across, appearing with the reveal.
  const pO = easeOut(seg(t, 1.6, 2.8)) * 0.9;
  if (pO > 0) body += `<g opacity="${n(pO)}" transform="translate(${n(t * 14)} ${n(t * 22 - 30)})">${petals}</g>`;

  // Ignition flare: a hot line that grows from the centre then thins out.
  const fy = crestTop + 210 * CREST.s;
  const ig = easeOut(seg(t, 0.0, 0.55));
  const igFade = 1 - easeInOut(seg(t, 0.6, 1.4));
  if (ig * igFade > 0.01) {
    defs.push(`<radialGradient id="fl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF2F3"/>` +
      `<stop offset=".15" stop-color="#FF5A69"/><stop offset="1" stop-color="#D12F3F" stop-opacity="0"/></radialGradient>`);
    const fw = 1500 * ig, fh = 10 + 30 * (1 - ig);
    body += `<ellipse cx="960" cy="${n(fy)}" rx="${n(fw / 2)}" ry="${n(fh / 2)}" fill="url(#fl)" opacity="${n(igFade)}"/>`;
    body += `<ellipse cx="960" cy="${n(fy)}" rx="${n(40 + 40 * ig)}" ry="${n(40 + 40 * ig)}" fill="url(#fl)" opacity="${n(igFade * 0.8)}"/>`;
  }

  // Crest parts.
  const ring = easeOut(seg(t, 0.45, 1.25));
  const core = easeBack(seg(t, 1.05, 1.55));
  const coreO = seg(t, 1.05, 1.3);
  const lock = easeOut(seg(t, 1.3, 1.95));
  const lockO = seg(t, 1.3, 1.7);
  const eyeO = seg(t, 1.8, 1.95);
  const anim = {
    ring: { o: ring, r: -140 * (1 - ring) },
    crystal: { o: coreO, s: 0.2 + 0.8 * core },
    spire: { o: lockO, dy: -50 * (1 - lock), s: 1 },
    innerWing: { o: lockO, dx: -70 * (1 - lock), dy: 50 * (1 - lock) },
    outerWing: { o: lockO, dx: -150 * (1 - lock), dy: 10 * (1 - lock) },
    jaw: { o: lockO, dy: 80 * (1 - lock) },
    eye: { o: eyeO },
  };
  const crest = emblem({ glow: t > 1.05, anim, id: 'ic' });
  defs.push(crest.defs);
  // Settle: the whole lockup breathes in very slightly during the hold.
  const settle = 1 + 0.015 * easeInOut(seg(t, 1.9, DUR));
  body += `<g transform="translate(960 540) scale(${n(settle)}) translate(-960 -540)">`;
  body += `<g transform="translate(${n(CREST.x - 256 * CREST.s)} ${n(crestTop)}) scale(${CREST.s})">${crest.body}</g>`;
  // Lock flash on the crystal.
  const flash = seg(t, 1.8, 1.9) * (1 - seg(t, 1.9, 2.3));
  if (flash > 0.01) {
    body += `<circle cx="960" cy="${n(crestTop + 200 * CREST.s)}" r="${n(60 + 120 * seg(t, 1.8, 2.3))}" fill="url(#fl2)" opacity="${n(flash)}"/>`;
    defs.push(`<radialGradient id="fl2"><stop offset="0" stop-color="#FFE3E6"/><stop offset=".3" stop-color="#FF5A69" stop-opacity=".6"/><stop offset="1" stop-color="#D12F3F" stop-opacity="0"/></radialGradient>`);
  }

  // Title: wiped open from the centre, slash cuts in last.
  const rev = easeInOut(seg(t, 2.35, 2.95));
  if (rev > 0) {
    const half = (WM.w / 2 + 20) * rev;
    defs.push(`<clipPath id="wipe"><rect x="${n(960 - half)}" y="${wmY - 30}" width="${n(half * 2)}" height="160"/></clipPath>`);
    const wmNoSlash = wordmark({ slash: false });
    body += `<g clip-path="url(#wipe)"><g transform="translate(${n(960 - WM.w / 2)} ${wmY}) scale(${n(wms)})">${wmNoSlash.body}</g></g>`;
    const cut = seg(t, 2.75, 2.9);
    if (cut > 0) {
      body += `<g opacity="${n(cut)}" transform="translate(${n(960 - WM.w / 2)} ${wmY}) scale(${n(wms)})">` +
        wm.body.replace(/^<g fill="[^"]+">.*?<\/g>/, '') + `</g>`;
    }
  }
  const kO = easeOut(seg(t, 2.6, 3.05));
  if (kO > 0) {
    const kw = kana.width * kanaS;
    body += `<g opacity="${n(kO)}" transform="translate(${n(960 - kw / 2)} ${n(kanaY + 8 * (1 - kO))}) scale(${kanaS})">${kana.body}</g>`;
    body += `<g opacity="${n(kO)}">` + L.diamondRule(960 - kw / 2 - 120, kanaY + 11, 95 * kO, PALETTE.crimson, { diamond: 0, defs }) +
      L.diamondRule(960 + kw / 2 + 120, kanaY + 11, 95 * kO, PALETTE.crimson, { diamond: 0, defs }) + `</g>`;
  }
  const tO = easeOut(seg(t, 2.8, 3.25));
  if (tO > 0) body += `<path opacity="${n(tO)}" transform="translate(${n((W - tag.width) / 2)} ${n(tagY)})" d="${tag.d}" fill="#9A94A3"/>`;
  body += `</g>`;
  return L.svgDoc(W, H, defs, body);
}

// ---- Render ---------------------------------------------------------------
mkdirSync(OUT, { recursive: true });
// Keyframes at the board's beats.
const beats = [['01_Ignition', 0.25], ['02_Halo', 0.9], ['03_Core', 1.35], ['04_Assembly', 1.9], ['05_Reveal', 2.75], ['06_Hold', 3.45]];
for (const [name, t] of beats) {
  const svg = frame(t);
  writeFileSync(join(OUT, `KINJURA_Intro_${name}.svg`), svg);
  renderPng(svg, join(OUT, `KINJURA_Intro_${name}.png`), 1920);
}

if (argv.includes('--keys')) process.exit(0);

const frames = Math.round(DUR * FPS);
const tmp = join(tmpdir(), `kinjura-intro-${process.pid}`);
mkdirSync(tmp, { recursive: true });
mkdirSync(OUT, { recursive: true });
console.log(`[intro] rendering ${frames} frames @ ${FPS} fps, ${RW}px -> ${tmp}`);
for (let i = 0; i < frames; i++) {
  renderPng(frame(i / FPS), join(tmp, `f${String(i).padStart(4, '0')}.png`), RW);
  if (i % 30 === 0) process.stdout.write(`.`);
}
console.log('');
const ff = (a) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], { stdio: 'inherit' });
const seq = ['-framerate', String(FPS), '-i', join(tmp, 'f%04d.png')];
const audio = AUDIO ? resolve(AUDIO) : null;
if (audio && existsSync(audio)) {
  copyFileSync(audio, join(OUT, 'KINJURA_Intro_Sting.wav'));
  ff([...seq, '-i', audio, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'slow',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', join(OUT, `KINJURA_Intro_${RW === 1920 ? '1080p' : RW + 'w'}${FPS}.mp4`)]);
}
ff([...seq, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'slow', '-movflags', '+faststart',
  join(OUT, `KINJURA_Intro_${RW === 1920 ? '1080p' : RW + 'w'}${FPS}_Silent.mp4`)]);
const withAudio = audio && existsSync(audio);
ff([...seq, ...(withAudio ? ['-i', audio] : []), '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '28', '-row-mt', '1', '-pix_fmt', 'yuv420p',
  ...(withAudio ? ['-c:a', 'libopus', '-shortest'] : []), join(OUT, `KINJURA_Intro_${FPS}fps.webm`)]);
ff([...seq, '-vf', 'fps=30,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a',
  join(OUT, 'KINJURA_Intro_Preview.gif')]);
rmSync(tmp, { recursive: true, force: true });
console.log(`[intro] done -> ${OUT}`);
