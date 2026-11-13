// Stamp a project with KINJURA branding.
//
//   node stamp.mjs --name "SkyrimForge" --tagline "Typed automation for Skyrim" --lane forge --out "D:/repos/SkyrimForge/branding"
//   node stamp.mjs --batch projects.json            (one entry per project, same keys)
//   node stamp.mjs --list-lanes
//
// Writes header.svg/png, social.png, cover.png, icon.svg + PNGs, favicon.ico,
// badge.svg, footer.svg and STAMP.md (the README snippet to paste).
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import * as L from './layout.mjs';
import { CORE_PARTS } from './emblem.mjs';
import { renderPng } from './render.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

function args(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const k = argv[i].slice(2);
    const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    a[k] = v;
  }
  return a;
}
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Stable per-project seed, so re-stamping never reshuffles the petals.
const seedOf = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 2166136261) % 100000;

export function stamp(p) {
  if (!p.name) throw new Error('stamp: --name is required');
  if (p.lane && !L.LANES[p.lane]) throw new Error(`stamp: unknown lane "${p.lane}" (try --list-lanes)`);
  L.resetIds();
  const lane = p.lane || 'games';
  const out = resolve(p.out || join(HERE, '..', 'stamps', slug(p.name)));
  const seed = Number(p.seed) || seedOf(p.name);
  const common = { name: p.name, tagline: p.tagline || '', lane, kicker: p.kicker };
  mkdirSync(out, { recursive: true });
  const files = [];
  const save = (file, svg, png) => {
    if (file.endsWith('.svg')) { writeFileSync(join(out, file), svg); files.push(file); }
    for (const [name, w] of png || []) { renderPng(svg, join(out, name), w); files.push(name); }
  };

  const header = L.stampHeader({ ...common, seed });
  save('header.svg', header, [['header.png', 1280]]);
  const social = L.stampSocial({ ...common, seed: seed + 1 });
  save('social.svg', social, [['social.png', 1280]]);
  const cover = L.stampSocial({ ...common, seed: seed + 2, w: 1920, h: 1080 });
  save('cover.svg', cover, [['cover.png', 1920]]);
  const icon = L.stampIcon({ lane });
  save('icon.svg', icon, [['icon-1024.png', 1024], ['icon-256.png', 256], ['icon-128.png', 128]]);
  const small = L.stampIcon({ lane, parts: CORE_PARTS });
  save('icon-small.svg', small, [['icon-64.png', 64], ['icon-32.png', 32], ['icon-16.png', 16]]);
  try {
    execFileSync('magick', [join(out, 'icon-16.png'), join(out, 'icon-32.png'), join(out, 'icon-64.png'), join(out, 'favicon.ico')]);
    files.push('favicon.ico');
  } catch {
    console.warn('[stamp] favicon.ico skipped: ImageMagick (magick) not found');
  }
  save('badge.svg', L.stampBadge({ lane, label: p.badge }));
  save('footer.svg', L.stampFooter({ lane }));

  const rel = p.readmePath || 'branding';
  const alt = (p.tagline ? `${p.name} — ${p.tagline}` : p.name).replace(/"/g, '&quot;');
  writeFileSync(join(out, 'STAMP.md'), `<!-- KINJURA stamp: paste the header at the very top of README.md -->
<p align="center">
  <img src="${rel}/header.svg" alt="${alt}" width="100%">
</p>
<p align="center">
  <img src="${rel}/badge.svg" alt="A KINJURA project · ${L.LANES[lane].label.toLowerCase()}" height="28">
</p>

<!-- ...README body... -->

<!-- KINJURA stamp: paste the footer at the very bottom of README.md -->
<p align="center">
  <img src="${rel}/footer.svg" alt="A KINJURA project" width="100%">
</p>

<!--
  Repo settings > General > Social preview: upload ${rel}/social.png (1280x640).
  Nexus / mod pages: use ${rel}/cover.png (1920x1080) as the primary image.
  App icon: icon.svg / icon-1024.png; favicon.ico for web and Windows apps.
-->
`);
  files.push('STAMP.md');
  return { out, files };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const a = args(process.argv.slice(2));
  if (a['list-lanes']) {
    for (const [k, v] of Object.entries(L.LANES)) console.log(`${k.padEnd(8)} ${v.accent}  ${v.label}`);
    process.exit(0);
  }
  if (a.help || (!a.name && !a.batch)) {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(0, 9).join('\n'));
    process.exit(a.help ? 0 : 1);
  }
  const jobs = a.batch ? JSON.parse(readFileSync(resolve(a.batch), 'utf8')) : [a];
  for (const job of jobs) {
    const r = stamp(job);
    console.log(`[stamp] ${job.name}: ${r.files.length} files -> ${r.out}`);
  }
}
