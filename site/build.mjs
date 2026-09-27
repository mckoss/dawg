// Build the demo site into _site/.
//
// Asset URLs in index.html get a content-hash query string, so browsers
// holding a cached copy (GitHub Pages allows 10 minutes) never mix a new
// page with an old script or stylesheet.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const OUT = '_site';

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);

await build({
  entryPoints: ['site/app.ts'],
  bundle: true,
  minify: true,
  target: 'es2019',
  outfile: `${OUT}/app.js`,
  logLevel: 'info',
});

copyFileSync('site/style.css', `${OUT}/style.css`);
copyFileSync('src/test/data/ospd3.txt', `${OUT}/ospd3.txt`);

function hash(file) {
  return createHash('sha256').update(readFileSync(`${OUT}/${file}`))
    .digest('hex').slice(0, 10);
}

let html = readFileSync('site/index.html', 'utf-8');
for (const asset of ['app.js', 'style.css']) {
  const ref = `"${asset}"`;
  if (!html.includes(ref)) {
    throw new Error(`site/index.html does not reference ${ref}`);
  }
  html = html.replace(ref, `"${asset}?v=${hash(asset)}"`);
}
writeFileSync(`${OUT}/index.html`, html);
