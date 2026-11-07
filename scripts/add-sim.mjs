#!/usr/bin/env node
// Adds a built teardown simulator to the gallery.
//
//   node scripts/add-sim.mjs <sim.html> <card.png|jpg> --slug v8-four-stroke --title "V8 Four-Stroke" \
//        --text "The throttle opens to 2,400 rpm, cylinder 4 cut open ..." [--credit "..."]
//
// Copies the page to sims/<slug>/index.html, writes a 1200x630 share card (needs ffmpeg),
// adds Open Graph / Twitter tags with absolute URLs and updates gallery.json.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.GALLERY_URL || 'https://mannix-create.github.io/teardown-gallery';
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const MAX_BYTES = 1024 * 1024;

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(`--${k}`); return i < 0 ? undefined : args.splice(i, 2)[1]; };
const slug = opt('slug'), title = opt('title'), text = opt('text') || '', credit = opt('credit');
const [htmlIn, cardIn] = args;
if (!htmlIn || !cardIn || !slug || !title) {
  console.error('usage: add-sim.mjs <sim.html> <card image> --slug <slug> --title <title> [--text <text>] [--credit <credit>]');
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error('--slug: lowercase letters, digits and hyphens only');
  process.exit(1);
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);
const dir = path.join(ROOT, 'sims', slug);
fs.mkdirSync(dir, {recursive: true});

execFileSync(FFMPEG, ['-loglevel', 'error', '-y', '-i', cardIn, '-vf',
  'scale=1200:630:force_original_aspect_ratio=increase,crop=1200:630', '-q:v', '3', path.join(dir, 'card.jpg')]);

const url = `${BASE}/sims/${slug}/`;
const meta = [
  `<title>${esc(title)}</title>`,
  `<meta name="description" content="${esc(text)}">`,
  `<meta property="og:type" content="website">`,
  `<meta property="og:title" content="${esc(title)}">`,
  `<meta property="og:description" content="${esc(text)}">`,
  `<meta property="og:url" content="${url}">`,
  `<meta property="og:image" content="${url}card.jpg">`,
  `<meta property="og:image:width" content="1200">`,
  `<meta property="og:image:height" content="630">`,
  `<meta name="twitter:card" content="summary_large_image">`,
  `<meta name="twitter:image" content="${url}card.jpg">`,
].join('\n');
let html = fs.readFileSync(htmlIn, 'utf8');
html = html.replace(/<title>[^<]*<\/title>/, '');
// keep <meta charset> first: browsers only look for it in the first 1024 bytes
html = /<meta charset[^>]*>/i.test(html)
  ? html.replace(/(<meta charset[^>]*>)/i, `$1\n${meta}`)
  : html.replace(/<head>/i, `<head>\n<meta charset="utf-8">\n${meta}`);
fs.writeFileSync(path.join(dir, 'index.html'), html);
const bytes = Buffer.byteLength(html);
if (bytes > MAX_BYTES) console.warn(`warning: page is ${(bytes / 1024).toFixed(0)} KB; link crawlers may skip the share card above 1 MB`);

const file = path.join(ROOT, 'gallery.json');
const gallery = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {items: []};
const item = {slug, title, text, added: new Date().toISOString().slice(0, 10), kb: Math.round(bytes / 1024), ...(credit ? {credit} : {})};
gallery.items = [item, ...gallery.items.filter((x) => x.slug !== slug)];
fs.writeFileSync(file, JSON.stringify(gallery, null, 2) + '\n');
console.log(`added ${url}  (${item.kb} KB)`);
