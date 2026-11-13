// Minimal SVG -> PNG helper around resvg. Text is always outlined before it
// reaches here, so no system fonts are loaded (renders are machine-independent).
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function renderPng(svg, outPath, width) {
  const r = new Resvg(svg, {
    fitTo: width ? { mode: 'width', value: width } : { mode: 'original' },
    font: { loadSystemFonts: false },
    background: 'rgba(0,0,0,0)',
  });
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, r.render().asPng());
}

// CLI: node render.mjs in.svg out.png [width]
if (process.argv[1] && process.argv[1].endsWith('render.mjs')) {
  const [, , i, o, w] = process.argv;
  renderPng(readFileSync(i, 'utf8'), o, w ? Number(w) : undefined);
}
