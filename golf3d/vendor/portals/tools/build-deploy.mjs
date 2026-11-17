// Assembles the deployable site in dist/: only the files the site loads, each minified on its own, and the pages that
// exist only on a deployed site (one small page per world and per journey for link previews, and the text gallery).
// Usage: node tools/build-deploy.mjs [--stamp name]      (npm run build)
//   --stamp name          the release's name: it goes into atlas.json and onto the addresses of the script and the style sheet
//   PORTALS_SITE=address  the address the world, journey and text pages name in their link-preview tags, when the site is
//                         hosted somewhere else (index.html and src/ui/share.js name the address themselves)
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
let esbuild; try { esbuild = await import('esbuild'); } catch (e) { console.error('esbuild is not installed yet: run "npm install" first'); process.exit(1); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), out = path.resolve(root, 'dist');
const args = process.argv.slice(2);
// the one argument is --stamp with a name after it; anything else is more likely a slip than a wish, so it stops here, before dist is touched
{ const i = args.indexOf('--stamp'); if (args.length !== (i < 0 ? 0 : 2) || (i >= 0 && !/^[\w.-]+$/.test(args[i + 1] || ''))) { console.error('usage: node tools/build-deploy.mjs [--stamp name]     (through npm: npm run build -- --stamp name)'); process.exit(1); } }
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const reg = fs.readFileSync(path.join(root, 'src/worlds/index.js'), 'utf8');
const worldFiles = [...reg.matchAll(/import\('\.\/([^']+)'\)/g)].map((m) => m[1]);
// follow static and dynamic relative imports from main.js and every shipped world
const seen = new Set(), queue = ['src/main.js', ...worldFiles.map((f) => 'src/worlds/' + f)], bare = new Set();
while (queue.length) {
  const rel = queue.pop(); if (seen.has(rel)) continue; seen.add(rel);
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  for (const m of src.matchAll(/(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s*['"]([^'"]+)['"]/g)) {
    const spec = m[1] || m[2] || m[3];
    if (spec.startsWith('.')) queue.push(path.posix.normalize(path.posix.join(path.posix.dirname(rel), spec)));
    else bare.add(spec);
  }
}
// audio.js is loaded on demand by the sound button: ship it and whatever it imports (its layers and the table of which world gets what), whether or not the crawl above met it
{ const q = ['src/core/audio.js']; while (q.length) { const rel = q.pop(); if (seen.has(rel) && rel !== 'src/core/audio.js') continue; seen.add(rel); for (const m of fs.readFileSync(path.join(root, rel), 'utf8').matchAll(/from\s*['"](\.[^'"]+)['"]/g)) { const dep = path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[1])); if (!seen.has(dep)) q.push(dep); } } }
// vendored three addons: follow their own relative imports too
const vq = [...bare].filter((s) => s.startsWith('three/addons/')).map((s) => 'vendor/three/addons/' + s.slice('three/addons/'.length)), vseen = new Set(['vendor/three/three.module.min.js']);
while (vq.length) {
  const rel = vq.pop(); if (vseen.has(rel)) continue; vseen.add(rel);
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  for (const m of src.matchAll(/from\s*['"]([^'"]+)['"]/g)) { const spec = m[1]; if (spec.startsWith('.')) vq.push(path.posix.normalize(path.posix.join(path.posix.dirname(rel), spec))); else if (spec.startsWith('three/addons/')) vq.push('vendor/three/addons/' + spec.slice('three/addons/'.length)); }
}
let raw = 0, min = 0;
for (const rel of [...seen, ...vseen]) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8'), dst = path.join(out, rel); fs.mkdirSync(path.dirname(dst), { recursive: true });
  const code = rel.endsWith('.min.js') ? src : (await esbuild.transform(src, { minify: true, format: 'esm', target: 'es2020', legalComments: 'none' })).code;
  raw += src.length; min += code.length; fs.writeFileSync(dst, code);
}
fs.mkdirSync(path.join(out, 'src/ui'), { recursive: true });
fs.copyFileSync(path.join(root, 'src/ui/ui.css'), path.join(out, 'src/ui/ui.css'));
// home-screen install: the manifest and its icons
fs.copyFileSync(path.join(root, 'manifest.webmanifest'), path.join(out, 'manifest.webmanifest'));
fs.cpSync(path.join(root, 'icons'), path.join(out, 'icons'), { recursive: true });
// the notices of the open-source work the site builds on (shipped files are minified with their comments stripped)
if (fs.existsSync(path.join(root, 'THIRD-PARTY-NOTICES.txt'))) fs.copyFileSync(path.join(root, 'THIRD-PARTY-NOTICES.txt'), path.join(out, 'THIRD-PARTY-NOTICES.txt')); else console.warn('THIRD-PARTY-NOTICES.txt is missing: the package ships no notices');
// the hidden index of worlds (src/ui/atlas.js): which release each world arrived in, and a small picture of each.
// The ledger is design/shipped.json: a world it does not know yet is written into it under this build's stamp.
// design/descriptions.json { texts: { id: "one to three sentences" } }: the short text of each world for the text gallery
// (text/index.html, written below); atlas.json says how many shipped worlds have one (text), and the gallery shows its
// way to that page once enough do.
let textOf = {}; try { textOf = JSON.parse(fs.readFileSync(path.join(root, 'design/descriptions.json'), 'utf8')).texts || {}; } catch (e) {}
const hasText = (id) => typeof textOf[id] === 'string' && textOf[id].trim().length > 0;
{
  const stampNow = args.includes('--stamp') ? args[args.indexOf('--stamp') + 1] : 'dev';
  const ledgerFile = path.join(root, 'design/shipped.json');
  let ledger = { releases: [], worlds: {} }; try { ledger = JSON.parse(fs.readFileSync(ledgerFile, 'utf8')); } catch (e) {}
  const ids = worldFiles.map((f) => f.replace(/\.js$/, '')), fresh = ids.filter((id) => !ledger.worlds[id]);
  if (fresh.length && stampNow !== 'dev') { if (!ledger.releases.includes(stampNow)) ledger.releases.push(stampNow); for (const id of fresh) ledger.worlds[id] = stampNow; fs.writeFileSync(ledgerFile, JSON.stringify(ledger, null, 1)); }
  const n = (id) => ledger.releases.indexOf(ledger.worlds[id]) + 1;
  fs.writeFileSync(path.join(out, 'atlas.json'), JSON.stringify({ stamp: stampNow, latest: Math.max(0, ...ids.map(n)), text: ids.filter(hasText).length, worlds: Object.fromEntries(ids.map((id) => [id, n(id)])) }));
  // pictures: thumbs/<id>.jpg, 480 by 270, one for each world (a world without one is listed without a picture)
  fs.mkdirSync(path.join(out, 'thumbs'), { recursive: true });
  let have = 0;
  for (const id of ids) { const keep = path.join(root, 'thumbs', id + '.jpg'); if (fs.existsSync(keep)) { fs.copyFileSync(keep, path.join(out, 'thumbs', id + '.jpg')); have++; } }
  console.log(`index of worlds: ${ids.length} worlds, ${fresh.length} new in ${stampNow}, ${have} pictures`);
  if (have < ids.length) console.log('WORLDS WITHOUT A PICTURE: ' + ids.filter((id) => !fs.existsSync(path.join(root, 'thumbs', id + '.jpg'))).join(', '));
}
const stamp = String(args.includes('--stamp') ? args[args.indexOf('--stamp') + 1] : fs.statSync(path.join(root, 'src/worlds/index.js')).mtimeMs / 1000 | 0);
fs.writeFileSync(path.join(out, 'index.html'), fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace('./src/main.js', './src/main.js?v=' + stamp).replace('./src/ui/ui.css', './src/ui/ui.css?v=' + stamp));
fs.writeFileSync(path.join(out, 'netlify.toml'), `[build]\n  publish = "."\n  command = "echo static site"\n\n[[headers]]\n  for = "/manifest.webmanifest"\n  [headers.values]\n    Content-Type = "application/manifest+json"\n\n[[headers]]\n  for = "/vendor/*"\n  [headers.values]\n    Cache-Control = "public, max-age=31536000, immutable"\n\n[[headers]]\n  for = "/src/*"\n  [headers.values]\n    Cache-Control = "public, max-age=0, must-revalidate"\n`);
// Sharing: the picture a pasted link shows (og.jpg, named by the tags in index.html) and one small page per world at
// w/<id>/, so that a link to a world previews as that world. Crawlers run no scripts, so the tags must sit in a file;
// a visitor is sent straight on to ?start=<id>. The pictures are the gallery's thumbnails (480 by 270) for now.
// PORTALS_SITE: the address the tags name, when the site moves.
{
  const SITE = (process.env.PORTALS_SITE || 'https://portals-endless-worlds.netlify.app').replace(/\/$/, '');
  if (fs.existsSync(path.join(root, 'og.jpg'))) fs.copyFileSync(path.join(root, 'og.jpg'), path.join(out, 'og.jpg')); else console.warn('og.jpg is missing: a pasted link will show no picture');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const field = (line, k) => { const m = line.match(new RegExp('\\b' + k + ': ("(?:[^"\\\\]|\\\\.)*")')); return m ? JSON.parse(m[1]) : ''; };
  const entries = reg.split('\n').filter((l) => /^\s*\{ id: "/.test(l)).map((l) => ({ id: field(l, 'id'), name: field(l, 'name'), after: field(l, 'after'), book: field(l, 'book'), author: field(l, 'author'), screen: field(l, 'screen'), screenYear: field(l, 'screenYear'), screenKind: field(l, 'screenKind'), music: field(l, 'music'), musicBy: field(l, 'musicBy'), musicYear: field(l, 'musicYear'), musicKind: field(l, 'musicKind'), set: field(l, 'set'), line: field(l, 'line') }));
  for (const w of entries) {
    // the line under the name, as on the title card: "after Katsushika Hokusai", "from The Time Machine by H. G. Wells"
    const name = w.name || w.id, by = w.after ? 'after ' + w.after.split(',')[0].trim() : w.book ? 'inspired by ' + w.book + (w.author ? ' by ' + w.author.split(/\s*,\s*and\s+/).map((a) => a.split(',')[0].trim()).filter(Boolean).join(' and ') : '') : w.screen ? 'inspired by the ' + (w.screenKind === 'series' ? 'series' : 'film') + ' ' + w.screen + (w.screenYear ? ' (' + w.screenYear + ')' : '') : w.music ? 'inspired by the ' + (w.musicKind === 'song' ? 'song' : 'album') + ' ' + w.music + (w.musicYear ? ' (' + w.musicYear + ')' : '') + (w.musicBy ? ' by ' + w.musicBy : '') : '';
    const desc =`${name}${by ? ', ' + by : ''}${w.line ? '. ' + w.line.replace(/\.$/, '') + '. One' : ', one'} of the ${entries.length} worlds of Portals: an endless flight through generated worlds, each reached through a portal in the last.`;
    const thumb = fs.existsSync(path.join(out, 'thumbs', w.id + '.jpg')), pic = thumb ? `${SITE}/thumbs/${w.id}.jpg` : `${SITE}/og.jpg`, [pw, ph] = thumb ? [480, 270] : [1200, 630];
    const to = '../../?start=' + encodeURIComponent(w.id), t = esc(name + ' · Portals'), d = esc(desc);
    const html = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${t}</title>\n<meta name="description" content="${d}">\n`
      + `<meta property="og:type" content="website">\n<meta property="og:site_name" content="Portals">\n<meta property="og:title" content="${t}">\n<meta property="og:description" content="${d}">\n<meta property="og:url" content="${SITE}/w/${w.id}/">\n`
      + `<meta property="og:image" content="${pic}">\n<meta property="og:image:type" content="image/jpeg">\n<meta property="og:image:width" content="${pw}">\n<meta property="og:image:height" content="${ph}">\n`
      + `<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${t}">\n<meta name="twitter:description" content="${d}">\n<meta name="twitter:image" content="${pic}">\n`
      + `<meta http-equiv="refresh" content="0; url=${to}">\n<script>location.replace(${JSON.stringify(to)});</script>\n<style>html{background:#000;color:#fff;font:italic 20px Georgia,serif}body{margin:30vh 24px 0;text-align:center}a{color:inherit}</style>\n</head>\n<body><a href="${to}">${esc(name)}</a></body>\n</html>\n`;
    fs.mkdirSync(path.join(out, 'w', w.id), { recursive: true }); fs.writeFileSync(path.join(out, 'w', w.id, 'index.html'), html);
  }
  // one small page per journey at j/<id>/ (SUITES of the registry: worlds flown in order), so that a link to a journey
  // previews with its title, its line and the picture of its first world; a visitor is sent on to ?suite=<id>
  let suites = []; try { suites = JSON.parse((reg.match(/^export const SUITES = (.*);$/m) || [])[1] || '[]'); } catch (e) { console.warn('SUITES could not be read from the registry: no journey pages'); }
  for (const s of suites) {
    if (!/^[a-z0-9-]+$/.test(s.id) || !Array.isArray(s.worlds) || s.worlds.length < 2) continue;
    const first = s.worlds[0], thumb = fs.existsSync(path.join(out, 'thumbs', first + '.jpg')), pic = thumb ? `${SITE}/thumbs/${first}.jpg` : `${SITE}/og.jpg`, [pw, ph] = thumb ? [480, 270] : [1200, 630];
    const to = '../../?suite=' + encodeURIComponent(s.id), t = esc((s.title || s.id) + ' · Portals'), d = esc(`${s.line ? s.line + ' ' : ''}A journey of ${s.worlds.length} worlds in order, in Portals: an endless flight through generated worlds, each reached through a portal in the last.`);
    const html = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${t}</title>\n<meta name="description" content="${d}">\n`
      + `<meta property="og:type" content="website">\n<meta property="og:site_name" content="Portals">\n<meta property="og:title" content="${t}">\n<meta property="og:description" content="${d}">\n<meta property="og:url" content="${SITE}/j/${s.id}/">\n`
      + `<meta property="og:image" content="${pic}">\n<meta property="og:image:type" content="image/jpeg">\n<meta property="og:image:width" content="${pw}">\n<meta property="og:image:height" content="${ph}">\n`
      + `<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${t}">\n<meta name="twitter:description" content="${d}">\n<meta name="twitter:image" content="${pic}">\n`
      + `<meta http-equiv="refresh" content="0; url=${to}">\n<script>location.replace(${JSON.stringify(to)});</script>\n<style>html{background:#000;color:#fff;font:italic 20px Georgia,serif}body{margin:30vh 24px 0;text-align:center}a{color:inherit}</style>\n</head>\n<body><a href="${to}">${esc(s.title || s.id)}</a></body>\n</html>\n`;
    fs.mkdirSync(path.join(out, 'j', s.id), { recursive: true }); fs.writeFileSync(path.join(out, 'j', s.id, 'index.html'), html);
  }
  // THE TEXT GALLERY (text/index.html): every world that ships, under the gallery's own headings (the kinds, the artists,
  // the books and each book series, as src/ui/atlas.js orders them), each with the line under its name and its short text
  // (textOf; where a world has none yet, its one-line caption if it has one). A plain page with no script, written anew at
  // every release from the registry, so it is whole with every new world. A title opens that world (w/<id>/).
  {
    // 'media': one heading for every world from a film, a television series or a record, then 'books'; 'ai-in-jokes': the
    // worlds of that journey (a row's set); all as in the gallery (src/ui/atlas.js)
    const ORDER = ['wilderness', 'prehistoric', 'ocean', 'sky', 'city', 'interior', 'domestic', 'alien', 'bizarre', 'ai-in-jokes', 'wonders', 'artists', 'media', 'books'];
    const NAMES = { media: 'From film, television and music', 'ai-in-jokes': 'AI in-jokes', wilderness: 'Wilderness', prehistoric: 'Prehistoric', ocean: 'Oceans', sky: 'Skies', city: 'Cities', interior: 'Interiors', domestic: 'At home', alien: 'Alien', bizarre: 'Bizarre', wonders: 'The Seven Wonders', artists: 'After the artists', books: 'From books' };
    const ws = reg.split('\n').filter((l) => /^\s*\{ id: "/.test(l)).map((l) => ({ id: field(l, 'id'), name: field(l, 'name'), category: field(l, 'category'), after: field(l, 'after'), book: field(l, 'book'), author: field(l, 'author'), wonder: field(l, 'wonder'), place: field(l, 'place'), year: field(l, 'year'), screen: field(l, 'screen'), screenYear: field(l, 'screenYear'), screenKind: field(l, 'screenKind'), music: field(l, 'music'), musicBy: field(l, 'musicBy'), musicYear: field(l, 'musicYear'), musicKind: field(l, 'musicKind'), set: field(l, 'set'), line: field(l, 'line') })).filter((w) => w.id && w.category !== 'test');
    const isBook = (w) => !w.after && !!w.book, isMedia = (w) => !w.after && !w.book && (!!w.screen || !!w.music || w.category === 'screen');
    const mediaIs = (w) => (w.music ? 'music' : w.screenKind === 'series' ? 'tv' : 'film');
    const kindOf = (w) => (w.after ? 'artists' : isBook(w) ? 'books' : isMedia(w) ? 'media' : w.wonder ? 'wonders' : w.set && NAMES[w.set] ? w.set : w.category), byName = (a, b) => (a.name || a.id).localeCompare(b.name || b.id);
    const kinds = [...new Set(ws.map(kindOf))].sort((a, b) => ((ORDER.indexOf(a) + 99) % 99) - ((ORDER.indexOf(b) + 99) % 99));
    const perBook = {}; for (const w of ws) if (w.book && !w.after) perBook[w.book] = (perBook[w.book] || 0) + 1;
    const sections = [];   // [anchor, heading, worlds]
    for (const k of kinds) {
      const of = ws.filter((w) => kindOf(w) === k).sort(byName);
      // the media heading says what the group holds in this release (as src/ui/atlas.js: mediaName)
      if (k === 'media') { sections.push([k, 'From ' + ([of.some((w) => mediaIs(w) === 'film') && 'film', of.some((w) => mediaIs(w) === 'tv') && 'television', of.some((w) => mediaIs(w) === 'music') && 'music'].filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' and $1') || 'film, television and music'), of]); continue; }
      if (k !== 'books') { sections.push([k, NAMES[k] || k, of]); continue; }
      const series = [...new Set(of.map((w) => w.book))].filter((b) => b && perBook[b] >= 3).sort();
      sections.push([k, NAMES.books, of.filter((w) => !series.includes(w.book))]);
      for (const b of series) { const sw = of.filter((w) => w.book === b), who = (sw[0].author || '').split(',')[0]; sections.push(['book-' + b.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), 'From ' + b + (who ? ' by ' + who : ''), sw]); }
    }
    const by = (w) => (w.after ? 'after ' + w.after.split(',')[0].trim() : w.book ? 'inspired by ' + w.book + (w.author ? ' by ' + w.author.split(/\s*,\s*and\s+/).map((a) => a.split(',')[0].trim()).filter(Boolean).join(' and ') : '') : w.screen ? 'inspired by the ' + (w.screenKind === 'series' ? 'series' : 'film') + ' ' + w.screen + (w.screenYear ? ' (' + w.screenYear + ')' : '') : w.music ? 'inspired by the ' + (w.musicKind === 'song' ? 'song' : 'album') + ' ' + w.music + (w.musicYear ? ' (' + w.musicYear + ')' : '') + (w.musicBy ? ' by ' + w.musicBy : '') : (w.wonder || w.place) ? [w.place, w.year].filter(Boolean).join(', ') : '');
    const one = (w) => { const t = hasText(w.id) ? textOf[w.id].trim() : w.line || '', b = by(w);
      return `<article id="${esc(w.id)}"><h3><a href="../w/${esc(w.id)}/">${esc(w.name || w.id)}</a></h3>${b ? `<p class="by">${esc(b)}</p>` : ''}${t ? `<p>${esc(t)}</p>` : ''}</article>`; };
    const full = sections.filter((s) => s[2].length);
    const body = full.map(([a, h, of]) => `<section id="${esc(a)}"><h2>${esc(h)}<span> · ${of.length}</span></h2>\n${of.map(one).join('\n')}\n</section>`).join('\n');
    const nav = full.map(([a, h]) => `<a href="#${esc(a)}">${esc(h)}</a>`).join(' ');
    const d = `Every one of the ${ws.length} worlds of Portals in a sentence or two: an endless flight through generated worlds, each reached through a portal in the last.`;
    const css = 'html{background:#07080c;color:#e9e6df;font:17px/1.55 "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;-webkit-text-size-adjust:100%}body{margin:0 auto;max-width:1180px;padding:28px clamp(16px,4vw,48px) 80px}a{color:inherit}'
      + 'header a.back{font:12px/1 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 12px;display:inline-block;opacity:.85}'
      + 'h1{font-style:italic;font-weight:400;font-size:clamp(30px,5vw,52px);letter-spacing:.03em;margin:26px 0 6px;text-wrap:balance}header p{margin:0 0 18px;max-width:62ch;opacity:.8}'
      + 'nav{display:flex;flex-wrap:wrap;gap:8px 16px;font:13px/1.3 system-ui,sans-serif;letter-spacing:.06em;padding:14px 0 6px;border-top:1px solid rgba(255,255,255,.1)}nav a{opacity:.8;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.25)}'
      + 'h2{font-style:italic;font-weight:400;font-size:clamp(24px,3.4vw,34px);margin:54px 0 18px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.12);column-span:all}h2 span{font:14px system-ui,sans-serif;letter-spacing:.1em;opacity:.55}'
      + 'section{column-width:330px;column-gap:44px}article{break-inside:avoid;margin:0 0 22px}h3{font-size:19px;font-weight:600;margin:0}h3 a{text-decoration:none}h3 a:hover{text-decoration:underline}'
      + 'p{margin:3px 0 0}p.by{font-style:italic;font-size:14px;line-height:1.4;opacity:.6}article p:not(.by){opacity:.86}footer{margin-top:60px;font:13px system-ui,sans-serif;opacity:.6}';
    const html = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Full World Descriptions · Portals</title>\n<meta name="description" content="${esc(d)}">\n<meta property="og:type" content="website">\n<meta property="og:site_name" content="Portals">\n<meta property="og:title" content="Full World Descriptions · Portals">\n<meta property="og:description" content="${esc(d)}">\n<meta property="og:url" content="${SITE}/text/">\n<meta property="og:image" content="${SITE}/og.jpg">\n<style>${css}</style>\n</head>\n<body>\n`
      + `<header><a class="back" href="../">Back to the journey</a><h1>Full World Descriptions</h1><p>${ws.length} worlds, each in a sentence or two. A title opens that world.</p><nav>${nav}</nav></header>\n<main>\n${body}\n</main>\n<footer>Portals: an endless flight through generated worlds, each reached through a portal in the last.</footer>\n</body>\n</html>\n`;
    fs.mkdirSync(path.join(out, 'text'), { recursive: true }); fs.writeFileSync(path.join(out, 'text', 'index.html'), html);
    console.log(`text gallery: ${ws.length} worlds in text/, ${ws.filter((w) => hasText(w.id)).length} with a text of their own, ${ws.filter((w) => !hasText(w.id) && w.line).length} more with a caption`);
  }
  console.log(`sharing: ${fs.existsSync(path.join(out, 'og.jpg')) ? 'og.jpg' : 'NO og.jpg'}, ${entries.length} world pages in w/, ${suites.length} journey pages in j/`);
}
console.log(`${worldFiles.length} worlds, ${seen.size + vseen.size} modules, ${(raw / 1e6).toFixed(2)} MB -> ${(min / 1e6).toFixed(2)} MB minified, in ${out}`);
