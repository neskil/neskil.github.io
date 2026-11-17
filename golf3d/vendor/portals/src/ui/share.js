// Sharing and keeping: the links a visitor can copy, the caption on saved pictures, the favourites and the About.
// main.js wires these to the bar and the options; the gallery (atlas.js) is handed the favourites and the seen list.
// tools/build-deploy.mjs writes the page behind a world link (w/<id>/index.html) and copies og.jpg.

export const SITE = 'https://portals-endless-worlds.netlify.app';   // printed on saved pictures; the tags in index.html carry it too

// ---------- the About ----------
// The text is the site's public statement of who made it: a release does not reword it.
// ?about=1 shows the button even when ABOUT_READY is false. The count is the registry's own ({N}).
export const ABOUT_READY = true;
export const ABOUT_FILM = '';      // address of the teaser film (an .mp4); empty: no film. It loads only when its play button is pressed.
export const ABOUT_POSTER = '';    // the still shown before the film is asked for; empty: the link preview picture (og.jpg)
export const ABOUT_TEXT = [
  'Portals is an endless, hands-off flight through {N} generated worlds, each one reached through a portal in the last. There is nothing to steer. Press S for sound.',
  'Every world was designed and built by AI agents working with Ethan Mollick in October 2026.',
  'Worlds marked "after" are original places in the manner of an artist of the past. Worlds marked "inspired by" are original places imagined from a book, a film or a television series.',
];

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

// One panel over everything (the journey, the options, the gallery). count: how many worlds the registry holds.
let aboutRoot = null;
export function openAbout(count) {
  if (aboutRoot) { aboutRoot.hidden = false; aboutRoot.querySelector('.about-x').focus(); return; }
  const root = (aboutRoot = el('div')); root.id = 'about'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'About Portals');
  const card = el('div', 'about-card'), x = el('button', 'about-x', '×'); x.setAttribute('aria-label', 'Close');
  const close = () => { root.hidden = true; const v = root.querySelector('video'); if (v) v.pause(); };
  x.onclick = close; root.onclick = (e) => { if (e.target === root) close(); };
  // while it is open no key is a journey shortcut, wherever the focus is: caught at the window on the way down
  window.addEventListener('keydown', (e) => { if (root.hidden || e.ctrlKey || e.metaKey || e.altKey) return; if (e.key === 'Escape') close(); e.stopPropagation(); }, true);
  card.append(x, el('h2', '', 'Portals'));
  if (ABOUT_FILM) {
    // a still with a play button: the film itself is fetched only when asked for
    const film = el('button', 'about-film'); film.type = 'button'; film.setAttribute('aria-label', 'Play the film');
    const img = new Image(); img.alt = ''; img.onerror = () => img.remove(); img.src = ABOUT_POSTER || './og.jpg';
    film.append(img, el('span', 'about-play'));
    film.onclick = () => { const v = el('video'); v.controls = true; v.autoplay = true; v.playsInline = true; v.src = ABOUT_FILM; v.className = 'about-video'; film.replaceWith(v); };
    card.appendChild(film);
  }
  for (const p of ABOUT_TEXT) card.appendChild(el('p', '', p.replace('{N}', count)));
  root.appendChild(card); document.body.appendChild(root); x.focus();
}

// ---------- the line under a world's name ----------
// as on the title card: 'Katsushika Hokusai, 1760 to 1849' reads "after Katsushika Hokusai"; a book world reads
// "from The Time Machine by H. G. Wells". d: the registry entry or the loaded definition; w: the built world, if any.
export function byline(d, w) {
  const after = String((w && w.after) || (d && d.after) || '').split(',')[0].trim();
  const book = String((w && w.book) || (d && d.book) || '').trim(), author = String((w && w.author) || (d && d.author) || '').split(/\s*,\s*and\s+/).map((a) => a.split(',')[0].trim()).filter(Boolean).join(' and ');
  // a wonder reads "The Seven Wonders · Alexandria, about 260 BC": its set, then the place and the year it is shown in
  const wonder = String((w && w.wonder) || (d && d.wonder) || '').trim(), where = [String((w && w.place) || (d && d.place) || '').trim(), String((w && w.year) || (d && d.year) || '').trim()].filter(Boolean).join(', ');
  // a film or television world reads "inspired by the film Interstellar (2014)" or "inspired by the series ... (2016)"
  const screen = String((w && w.screen) || (d && d.screen) || '').trim(), sYear = String((w && w.screenYear) || (d && d.screenYear) || '').trim(), sKind = String((w && w.screenKind) || (d && d.screenKind) || '') === 'series' ? 'series' : 'film';
  if (!after && !book && screen) return 'inspired by the ' + sKind + ' ' + screen + (sYear ? ' (' + sYear + ')' : '');
  // a music world reads "inspired by the album <music> (<musicYear>) by <musicBy>" or "inspired by the song ..."
  const music = String((w && w.music) || (d && d.music) || '').trim(), mBy = String((w && w.musicBy) || (d && d.musicBy) || '').trim(), mYear = String((w && w.musicYear) || (d && d.musicYear) || '').trim(), mKind = String((w && w.musicKind) || (d && d.musicKind) || '') === 'song' ? 'song' : 'album';
  if (!after && !book && music) return 'inspired by the ' + mKind + ' ' + music + (mYear ? ' (' + mYear + ')' : '') + (mBy ? ' by ' + mBy : '');
  return after ? 'after ' + after : book ? 'inspired by ' + book + (author ? ' by ' + author : '') : wonder ? wonder + (where ? ' \u00b7 ' + where : '') : where;   // a known place that is not of a set reads "Rome, AD 80"
}

// ---------- favourites ----------
// localStorage 'portals.hearts': a JSON array of world ids. The Set made here is the one the engine reads as engine.hearts.
export function loadHearts() {
  const s = new Set();
  try { const a = JSON.parse(localStorage.getItem('portals.hearts') || '[]'); if (Array.isArray(a)) for (const id of a) if (typeof id === 'string') s.add(id); } catch (e) {}
  return s;
}
export function saveHearts(set) { try { localStorage.setItem('portals.hearts', JSON.stringify([...set])); } catch (e) {} }

// ---------- links ----------
// The worlds flown in this sitting, in order (main.js adds each as it comes on screen; the antechamber is never one).
export const flown = [];

// ?tour=id1,id2,...: worlds to fly in that order before the picker takes over (the engine's opts.tour). Ids the
// collection does not hold are dropped. The first world of a tour is the opening world, which the page already takes
// from ?start=: when the link names none, the tour's first id is put there for the lines that choose the opening.
export function readTour(q, defs) {
  if (!q.has('tour')) return undefined;
  const ids = q.get('tour').split(',').map((s) => s.trim()).filter((id) => defs.some((d) => d.id === id));
  if (ids.length && !q.has('start')) q.set('start', ids[0]);
  return ids.length ? ids : undefined;
}

// ?suite=<id>: a journey from the list (SUITES in the registry: worlds flown in order), read as a tour. On a calm-only
// visit its worlds that are not calm are passed over. The journey opens on its first world unless the link names a
// world of it in ?start= (then it is flown from there); a ?start= outside it is flown first. Returns null where the
// link names no journey, or fewer than two of its worlds can be flown; else { id, title, line, worlds (the ids as flown),
// tour (the ids still to come, the opening world among them), at (the index in worlds of the last one shown: -1),
// hours (the hour a step is flown at, { id: 'dawn' | 'day' | 'golden' | 'night' }, or null: the engine's opts.tourHours) }.
export function readSuite(q, defs, suites, calm) {
  const s = q.has('suite') && (suites || []).find((x) => x.id === q.get('suite')); if (!s) return null;
  const worlds = s.worlds.filter((id) => { const d = defs.find((w) => w.id === id); return !!d && (!calm || !!d.calm); });
  if (worlds.length < 2) return null;
  const from = q.has('start') ? worlds.indexOf(q.get('start')) : -1;
  if (!q.has('start')) q.set('start', worlds[0]);
  return { id: s.id, title: s.title, line: s.line || '', worlds, hours: s.hours || null, tour: worlds.slice(Math.max(0, from)), at: -1, over: false };
}
// The address of a journey: its own small page (j/<id>/, written by build-deploy for link previews), which sends the
// visitor on to ?suite=<id>.
export function suiteLink(id, loc = location) {
  const dir = loc.origin + loc.pathname.replace(/[^/]*$/, '');
  const local = loc.protocol === 'file:' || /^(localhost|127\.|0\.0\.0\.0|\[::1\]|10\.|192\.168\.)/.test(loc.hostname);
  return local ? dir + '?suite=' + encodeURIComponent(id) : dir + 'j/' + encodeURIComponent(id) + '/';
}

// The address that shows one world: its own small page (w/<id>/, written by build-deploy with that world's name and
// picture for link previews), which sends the visitor on to ?start=<id>. A development server has no such pages.
export function worldLink(id, loc = location) {
  const dir = loc.origin + loc.pathname.replace(/[^/]*$/, '');
  if (!id) return dir;
  const local = loc.protocol === 'file:' || /^(localhost|127\.|0\.0\.0\.0|\[::1\]|10\.|192\.168\.)/.test(loc.hostname);
  return local ? dir + '?start=' + encodeURIComponent(id) : dir + 'w/' + encodeURIComponent(id) + '/';
}

// A link that replays this sitting: its session number (every world's seed comes from it), the worlds flown so far
// in order, and the choices that shape a world. Every choice is written, 'auto' included, so that the recipient's own
// saved choices do not stand in. COMFORT IS THE EXCEPTION: the steady camera and calm-only are written only where the
// sender has them on, so a link never asks its reader for more motion than the reader chose (main.js reads it so too:
// an older link's camera=sweeping or calm=0 does not undo the reader's own choice or the system's 'reduce motion').
// Kept under about 1800 characters by keeping the FIRST worlds.
export function journeyLink(engine, ids = flown, loc = location) {
  const s = engine.settings, p = new URLSearchParams();
  p.set('session', engine.session); p.set('strange', s.strangeness);
  for (const k of ['style', 'ride', 'companion']) p.set(k, s[k]);
  if (s.camera === 'steady') p.set('camera', 'steady'); if (s.calmOnly) p.set('calm', '1');
  // the hour too; 'My clock' is sent as the hour it is for the sender (the engine's own reading of the clock)
  const h = new Date().getHours(); p.set('hour', s.hour === 'clock' ? (h < 5 ? 'night' : h < 8 ? 'dawn' : h < 16 ? 'day' : h < 20 ? 'golden' : 'night') : s.hour || 'any');
  let url = loc.origin + loc.pathname + '?' + p.toString();
  if (ids.length) {
    url += '&start=' + ids[0] + '&tour=';   // ids are file names (letters, digits, hyphens): they need no escaping
    const kept = []; for (const id of ids) { if (url.length + kept.join(',').length + id.length + 1 > 1800) break; kept.push(id); }
    url += kept.join(',');
  }
  return url;
}

// Copies text; true when it worked. window.__copied keeps the last text for the page tests.
export async function copyText(text) {
  window.__copied = text;
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  try { const t = el('textarea'); t.value = text; t.style.cssText = 'position:fixed;left:-99px;top:0;opacity:0'; document.body.appendChild(t); t.select(); const ok = document.execCommand('copy'); t.remove(); return ok; } catch (e) { return false; }
}

// ---------- the caption on a saved picture ----------
// Returns a 2D copy of the frame with a quiet strip at its foot: the world's name and its 'after' or 'from' line at
// the left, the site's address at the right. Sizes follow the picture (its shorter side: 17 px letters at 720p, never
// under 11 px); where the two do not fit on one line the address goes under the name. The strip stays within the
// lowest eighth of the picture.
export function captioned(src, name, by, site = SITE.replace(/^https?:\/\//, '')) {
  const w = src.width, h = src.height, c = el('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(src, 0, 0);
  const u = Math.max(11, Math.round(Math.min(w, h) * 0.024)), pad = Math.round(u * 1.2);
  const serif = (px) => 'italic ' + px + 'px "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
  const sans = Math.max(9, Math.round(u * 0.66)) + 'px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
  const spaced = (em) => { if ('letterSpacing' in g) g.letterSpacing = em ? (u * em).toFixed(1) + 'px' : '0px'; };
  g.font = serif(u); const nameW = g.measureText(name).width;
  g.font = serif(Math.round(u * 0.8)); const gap = u * 0.9; let byW = by ? g.measureText(by).width : 0;
  g.font = sans; spaced(0.09); const siteW = g.measureText(site).width; spaced(0);
  const room = w - pad * 2;
  if (by && nameW + gap + byW > room) { by = ''; byW = 0; }                    // a narrow picture keeps the name alone
  const two = nameW + (by ? gap + byW : 0) + gap * 2 + siteW > room;           // two lines: the address under the name
  const lines = two ? 2 : 1, strip = Math.min(Math.round(u * (two ? 3.9 : 2.5)), Math.round(h / 8));
  const shade = g.createLinearGradient(0, h - strip * 1.7, 0, h);
  shade.addColorStop(0, 'rgba(0,0,0,0)'); shade.addColorStop(0.45, 'rgba(0,0,0,0.38)'); shade.addColorStop(1, 'rgba(0,0,0,0.62)');
  g.fillStyle = shade; g.fillRect(0, Math.floor(h - strip * 1.7), w, Math.ceil(strip * 1.7));
  g.textBaseline = 'alphabetic'; g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = u * 0.5;
  const base = h - Math.round(u * 0.85), top = lines === 2 ? base - Math.round(u * 1.45) : base;
  g.fillStyle = 'rgba(255,255,255,0.94)'; g.font = serif(u); g.textAlign = 'left'; g.fillText(name, pad, top, room);
  if (by) { g.fillStyle = 'rgba(255,255,255,0.78)'; g.font = serif(Math.round(u * 0.8)); g.fillText(by, pad + nameW + gap, top); }
  g.fillStyle = 'rgba(255,255,255,0.7)'; g.font = sans; spaced(0.09);
  if (two) g.fillText(site, pad, base, room); else { g.textAlign = 'right'; g.fillText(site, w - pad, base); }
  spaced(0);
  return c;
}
