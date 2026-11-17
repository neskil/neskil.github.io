// The hidden index of worlds. Nothing on the page points to it: it opens with the I key, by adding #worlds to
// the address, or by holding the options button for a second on a touch screen. Choosing a world starts the
// journey again in that world (the page reloads with ?start=<id>) and it carries on from there as usual.
// build-deploy writes atlas.json (which release each world arrived in) and thumbs/<id>.jpg; both are optional.
import { byline } from './share.js';

// 'media' is one heading for every world imagined from a film, a television series or a record, and 'books' the heading after it;
// a world's own category 'screen', its book and its music are read by kindOf below. 'ai-in-jokes' is the heading of the worlds
// of that journey (a registry row's `set`).
const KIND_ORDER = ['wilderness', 'prehistoric', 'ocean', 'sky', 'city', 'interior', 'domestic', 'alien', 'bizarre', 'ai-in-jokes', 'wonders', 'artists', 'media', 'books'];
const KIND_NAMES = { media: 'From film, television and music', screen: 'From film, television and music', 'ai-in-jokes': 'AI in-jokes', wilderness: 'Wilderness', prehistoric: 'Prehistoric', ocean: 'Oceans', sky: 'Skies', city: 'Cities', interior: 'Interiors', domestic: 'At home', alien: 'Alien', bizarre: 'Bizarre', wonders: 'The Seven Wonders', artists: 'After the artists', books: 'From books' };
const TEXT_MIN = 100;   // texts a release must carry before the gallery shows the way to the text gallery
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

const HEART = '<svg class="i" viewBox="0 0 16 16"><path d="M8 13.6S2 9.8 2 5.9a3.1 3.1 0 0 1 6-1.2 3.1 3.1 0 0 1 6 1.2c0 3.9-6 7.7-6 7.7z"/></svg>';
const TICK = '<svg class="i" viewBox="0 0 16 16"><path d="M3.5 8.6l3 3 6-7"/></svg>';

// seen: main.js's own list of the worlds this visitor has seen (id to time), or null on a journey link and on test pages,
// where nothing is remembered: then no card is ticked and nothing is counted, rather than show wrong marks.
// hearts: the Set of favourite ids (the same object the engine reads); onHeart(id) keeps or releases one without
// starting that world. onAbout: opens the About, when there is one to show.
// suites: the journeys (SUITES of the registry: { id, title, line, worlds }), shown as a shelf at the head of the list.
export function setupAtlas({ worlds, suites = [], engine, setPaused, optionsButton, onReport, seen = null, hearts = null, onHeart = null, onAbout = null }) {
  let root = null, grid = null, count = null, meta = null, sort = 'kind', filter = '', show = 'all', showSel = null, wasPaused = false;
  try { sort = localStorage.getItem('portals.atlasSort') || 'kind'; } catch (e) {}
  const list = worlds.filter((w) => w.category !== 'test');
  const isOpen = () => !!root && !root.hidden;
  const kept = (w) => !!hearts && hearts.has(w.id), was = (w) => !!seen && seen[w.id] > 0;
  const nKept = () => list.filter(kept).length, nSeen = () => list.filter(was).length;

  const tile = (w) => {
    const a = el('a', 'atlas-card'); a.href = '?start=' + encodeURIComponent(w.id);
    const pic = el('div', 'atlas-pic');
    // until its picture arrives (or if it has none) a card shows the mood of the world's palette
    const [lum, warm] = w.tone || [0.4, 0];
    const h = Math.round(215 - 190 * Math.max(-1, Math.min(1, warm * 2.2))), l = Math.round(14 + 36 * lum);
    pic.style.background = `linear-gradient(160deg, hsl(${h} 42% ${l + 10}%), hsl(${(h + 320) % 360} 46% ${Math.max(6, l - 8)}%))`;
    const img = new Image(); img.loading = 'lazy'; img.decoding = 'async'; img.alt = ''; img.onerror = () => img.remove(); img.src = './thumbs/' + w.id + '.jpg' + (meta && meta.stamp ? '?v=' + meta.stamp : '');
    pic.appendChild(img);
    const n = meta && meta.worlds ? meta.worlds[w.id] : 0;
    if (meta && n && n === meta.latest && meta.latest > 1) pic.appendChild(el('span', 'atlas-new', 'New'));
    if (engine.cur && engine.cur.def.id === w.id) { a.classList.add('here'); pic.appendChild(el('span', 'atlas-here', 'You are here')); }
    // a small tick in the corner of a world this visitor has seen
    if (was(w)) { const t = el('span', 'atlas-seen'); t.innerHTML = TICK; t.title = 'Seen'; t.setAttribute('aria-label', 'Seen'); pic.appendChild(t); a.classList.add('seen'); }
    a.append(pic, el('div', 'atlas-name', w.name || w.id), el('div', 'atlas-kind', (w.after || w.book || w.screen || w.music) ? byline(w) : (w.wonder || w.place) ? [w.place, w.year].filter(Boolean).join(', ') || w.wonder : (KIND_NAMES[w.category] || w.category) + (w.weirdness >= 0.66 ? ' · strange' : '') + (w.calm ? ' · calm' : '')));
    if (w.line) a.appendChild(el('div', 'atlas-line', w.line));   // what the world is, in one line, where it has one
    // the card is a link; its heart is a button beside it (not inside: pressing it must not start the world), laid over
    // the picture's lower right corner by a box of the picture's own shape
    const cell = el('div', 'atlas-cell'); cell.dataset.id = w.id; cell.appendChild(a);
    if (onHeart && hearts) {
      const over = el('div', 'atlas-over'), b = el('button', 'atlas-heart'); b.type = 'button'; b.innerHTML = HEART; over.appendChild(b); cell.appendChild(over);
      b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); onHeart(w.id); hearted(w, cell); };
      heartState(cell, w);
    }
    return cell;
  };
  const heartState = (cell, w) => {
    const b = cell.querySelector('.atlas-heart'), on = kept(w); if (!b) return;
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.title = on ? 'A favourite: press to release it' : 'Keep as a favourite';
    b.setAttribute('aria-label', (on ? 'Release ' : 'Keep ') + (w.name || w.id) + (on ? ' from the favourites' : ' as a favourite'));
  };
  // after a heart is pressed: every card of that world shows it, and the Favourites section at the top is made again.
  // What the visitor is looking at must not jump: the scroll position takes up the section's change of height, and a
  // card released inside the section itself stays (with an empty heart) until the gallery is next drawn.
  const hearted = (w, cell) => {
    for (const c of grid.querySelectorAll('.atlas-cell')) if (c.dataset.id === w.id) heartState(c, w);
    if (showSel) showOptions();
    const favs = grid.querySelector('.atlas-favs'); if (!favs || favs.contains(cell)) return;
    const h0 = favs.offsetHeight; drawFavs(favs); grid.scrollTop += favs.offsetHeight - h0;
  };

  // The journeys' shelf: one wide card for each journey (four of its pictures in a strip, its title, its line, how many
  // worlds and how many of them this visitor has seen). The card is a link: the journey starts at its first world
  // (?suite=<id>) and is flown in order; after its last world the portals carry on as usual. Shown with all worlds (not
  // among the favourites or the unseen); a search keeps the journeys whose title, line or worlds' names it finds.
  const shelf = (into, f) => {
    const cards = [], moods = [];   // journeys with a story, and journeys by mood (design/suites.json mood: true)
    for (const s of suites) {
      const ws = s.worlds.map((id) => list.find((w) => w.id === id)).filter(Boolean); if (ws.length < 2) continue;
      if (f && !((s.title || '').toLowerCase().includes(f) || (s.line || '').toLowerCase().includes(f) || ws.some((w) => (w.name || '').toLowerCase().includes(f)))) continue;
      const a = el('a', 'atlas-journey'); a.href = '?suite=' + encodeURIComponent(s.id);
      const strip = el('div', 'atlas-strip'), n = Math.min(4, ws.length);
      for (let i = 0; i < n; i++) {   // the first, the last and two between
        const w = ws[Math.round(i * (ws.length - 1) / (n - 1))], pic = el('div', 'atlas-strip-pic'), [lum, warm] = w.tone || [0.4, 0];
        const h = Math.round(215 - 190 * Math.max(-1, Math.min(1, warm * 2.2))), l = Math.round(14 + 36 * lum);
        pic.style.background = `linear-gradient(160deg, hsl(${h} 42% ${l + 10}%), hsl(${(h + 320) % 360} 46% ${Math.max(6, l - 8)}%))`;
        const img = new Image(); img.loading = 'lazy'; img.decoding = 'async'; img.alt = ''; img.onerror = () => img.remove(); img.src = './thumbs/' + w.id + '.jpg' + (meta && meta.stamp ? '?v=' + meta.stamp : '');
        pic.appendChild(img); strip.appendChild(pic);
      }
      const seenN = ws.filter(was).length, here = !!engine.cur && s.worlds.includes(engine.cur.def.id) && new URLSearchParams(location.search).get('suite') === s.id;
      if (here) { a.classList.add('here'); strip.appendChild(el('span', 'atlas-here', 'You are here')); }
      a.append(strip, el('div', 'atlas-journey-name', s.title || s.id));
      if (s.line) a.appendChild(el('div', 'atlas-journey-line', s.line));
      // on a calm-only visit the journey passes over its worlds that are not calm: the card says how many it then flies
      const calmN = engine.settings.calmOnly ? ws.filter((w) => w.calm).length : 0;
      a.appendChild(el('div', 'atlas-kind', ws.length + ' worlds in order' + (engine.settings.calmOnly ? ' · ' + (calmN >= 2 ? calmN + ' of them on a calm journey' : 'not a calm journey') : '') + (seen && seenN ? ' · you have seen ' + (seenN === ws.length ? 'them all' : seenN) : '')));
      (s.mood ? moods : cards).push(a);
    }
    for (const [name, cs] of [['Journeys', cards], ['Journeys by mood', moods]]) {
      if (!cs.length) continue;
      const h = el('h3', 'atlas-h', name); h.appendChild(el('span', 'atlas-h-n', ' · ' + cs.length)); into.appendChild(h);
      const g = el('div', 'atlas-journeys'); for (const c of cs) g.appendChild(c); into.appendChild(g);
    }
  };

  const byName = (a, b) => (a.name || a.id).localeCompare(b.name || b.id);
  const isBook = (w) => !w.after && !!w.book;
  const isMedia = (w) => !w.after && !w.book && (!!w.screen || !!w.music || w.category === 'screen');
  const mediaIs = (w) => (w.music ? 'music' : w.screenKind === 'series' ? 'tv' : 'film');
  // the media heading says what the group holds in this release: film, and television and music once a world of each is in it
  const mediaName = (ws) => 'From ' + ([ws.some((w) => mediaIs(w) === 'film') && 'film', ws.some((w) => mediaIs(w) === 'tv') && 'television', ws.some((w) => mediaIs(w) === 'music') && 'music'].filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' and $1') || 'film, television and music');
  const MEDIA_WORDS = { film: /^(films?|movies?|media)$/, tv: /^(tv|television|series|shows?|media)$/, music: /^(music|musicians?|bands?|albums?|songs?|records?|media)$/ };
  let shown = list;
  // a heading is the kind's name, large, and after it the count, small (its text still reads "Wilderness · 63")
  const section = (into, title, ws) => { if (!ws.length) return; if (title) { const h = el('h3', 'atlas-h', title); h.appendChild(el('span', 'atlas-h-n', ' · ' + ws.length)); into.appendChild(h); } const g = el('div', 'atlas-grid'); for (const w of ws) g.appendChild(tile(w)); into.appendChild(g); };
  // the favourites lead the gallery whenever there are any (unless the gallery is showing only them already)
  const drawFavs = (favs) => { favs.textContent = ''; if (hearts && show !== 'hearts') section(favs, 'Favourites', shown.filter(kept).sort(byName)); };
  // the "Show" menu: all, the favourites, the worlds not seen yet (that one only where a seen list is kept)
  const showOptions = () => {
    const h = nKept(), u = seen ? list.length - nSeen() : 0;
    for (const o of showSel.options) {
      if (o.value === 'hearts') { o.textContent = 'Favourites' + (h ? ' (' + h + ')' : ''); o.disabled = !h && show !== 'hearts'; }
      if (o.value === 'unseen') { o.textContent = 'Not seen yet' + (u ? ' (' + u + ')' : ''); o.disabled = !u && show !== 'unseen'; }
    }
  };

  const draw = () => {
    const f = filter.trim().toLowerCase();
    shown = list.filter((w) => (show === 'hearts' ? kept(w) : show === 'unseen' ? !was(w) : true)).filter((w) => !f ||(w.name || '').toLowerCase().includes(f) || w.id.includes(f) || w.id.includes(f.replace(/\s+/g, '-')) || (!isMedia(w) && (KIND_NAMES[w.category] || w.category).toLowerCase().includes(f)) || (w.set && (KIND_NAMES[w.set] || '').toLowerCase().includes(f)) || (KIND_NAMES[w.placeKind] || '').toLowerCase().includes(f) || (w.after || '').toLowerCase().includes(f) || (w.book || '').toLowerCase().includes(f) || (w.author || '').toLowerCase().includes(f) || byline(w).toLowerCase().includes(f) || (isBook(w) && /^books?$/.test(f)) || (isMedia(w) && MEDIA_WORDS[mediaIs(w)].test(f)) || (w.line || '').toLowerCase().includes(f) || (w.calm && 'calm'.startsWith(f) && f.length > 1));
    const age = (w) => (meta && meta.worlds && meta.worlds[w.id]) || 0;
    grid.textContent = '';
    // the head counts what this visitor has seen ("You have seen 41 of 327 worlds"); on a journey link nothing is remembered, so nothing is claimed
    const all = shown.length === list.length, n = nSeen();
    count.textContent = seen ? (all ? 'You have seen ' + n + ' of ' + list.length + ' worlds' : shown.length + ' of ' + list.length + ' worlds · you have seen ' + n) : all ? list.length + ' worlds' : shown.length + ' of ' + list.length + ' worlds';
    if (showSel) { showSel.value = show; showOptions(); }
    if (show === 'all') shelf(grid, f);
    const favs = el('div', 'atlas-favs'); grid.appendChild(favs); drawFavs(favs);
    const plain = (title, ws) => section(grid, title, ws);
    if (sort === 'name') plain(favs.firstChild ? 'All worlds' : '', [...shown].sort(byName));
    else if (sort === 'new') {
      const ns = [...new Set(shown.map(age))].sort((a, b) => b - a);
      for (const n of ns) plain(n && meta ? (n === meta.latest ? 'Newest' : n === 1 ? 'The first worlds' : 'Release ' + n) : 'Worlds', shown.filter((w) => age(w) === n).sort(byName));
    } else {
      // every world stands under one heading: a world made after an artist (it carries `after`) under "After the artists",
      // a world from a film, a television series or a record under "From film, television and music", a world from a book
      // under "From books" after it, a wonder under "The Seven Wonders", a world of a set that has a heading (the AI
      // in-jokes) under that, every other under its own kind
      const kindOf = (w) => (w.after ? 'artists' : isBook(w) ? 'books' : isMedia(w) ? 'media' : w.wonder ? 'wonders' : w.set && KIND_NAMES[w.set] ? w.set : w.category);
      const kinds = [...new Set(shown.map(kindOf))].sort((a, b) => ((KIND_ORDER.indexOf(a) + 99) % 99) - ((KIND_ORDER.indexOf(b) + 99) % 99));
      // a book with three worlds or more is a series: its worlds stand together under the book's own heading, right after the other books
      const perBook = {}; for (const w of list) if (w.book && !w.after) perBook[w.book] = (perBook[w.book] || 0) + 1;
      for (const k of kinds) {
        const ws = shown.filter((w) => kindOf(w) === k).sort(byName);
        if (k === 'media') { plain(mediaName(list.filter(isMedia)), ws); continue; }
        if (k !== 'books') { plain(KIND_NAMES[k] || k, ws); continue; }
        const series = [...new Set(ws.map((w) => w.book))].filter((b) => b && perBook[b] >= 3).sort();
        plain(KIND_NAMES.books, ws.filter((w) => !series.includes(w.book)));
        for (const b of series) { const of = ws.filter((w) => w.book === b), who = (of[0].author || '').split(',')[0]; plain('From ' + b + (who ? ' by ' + who : ''), of); }
      }
    }
    if (!shown.length && !grid.querySelector('.atlas-journey')) grid.appendChild(el('p', 'atlas-none', f ? 'No world by that name.' : show === 'hearts' ? 'No favourites yet. The heart on a card, or H during the journey, keeps a world.' : show === 'unseen' ? 'You have seen every world.' : 'No world by that name.'));
  };

  const build = () => {
    root = el('div'); root.id = 'atlas'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'All worlds');
    const head = el('div', 'atlas-head');
    const titles = el('div', 'atlas-titles'); count = el('div', 'atlas-count'); titles.append(el('h2', '', 'All worlds'), count);
    const find = el('input'); find.type = 'search'; find.placeholder = 'Find a world'; find.setAttribute('aria-label', 'Find a world'); find.autocomplete = 'off';
    find.oninput = () => { filter = find.value; draw(); };
    const order = el('select'); order.setAttribute('aria-label', 'Order');
    for (const [v, t] of [['kind', 'By kind'], ['new', 'Newest first'], ['name', 'A to Z']]) { const o = el('option', '', t); o.value = v; order.appendChild(o); }
    order.value = sort; order.onchange = () => { sort = order.value; try { localStorage.setItem('portals.atlasSort', sort); } catch (e) {} draw(); };
    // which worlds to show: all, the favourites, the ones not seen yet
    showSel = el('select'); showSel.setAttribute('aria-label', 'Show'); showSel.className = 'atlas-show';
    for (const [v, t] of [['all', 'All worlds'], ...(hearts ? [['hearts', 'Favourites']] : []), ...(seen ? [['unseen', 'Not seen yet']] : [])]) { const o = el('option', '', t); o.value = v; showSel.appendChild(o); }
    showSel.onchange = () => { show = showSel.value; draw(); grid.scrollTop = 0; };
    if (showSel.options.length < 2) showSel.hidden = true;
    const x = el('button', 'atlas-x', '×'); x.setAttribute('aria-label', 'Close'); x.onclick = () => close();
    head.append(titles, find, order, showSel);
    if (onAbout) { const b = el('button', 'atlas-about', 'About'); b.type = 'button'; b.onclick = () => onAbout(); head.appendChild(b); }
    head.appendChild(x);
    grid = el('div', 'atlas-body');
    const foot = el('p', 'atlas-foot', 'Choosing a world starts the journey there. It carries on through the portals as usual. ');
    if (onReport) { const b = el('button', 'atlas-report', 'Copy performance report'); b.type = 'button'; b.onclick = () => onReport(); foot.appendChild(b); }
    root.append(head, grid, foot);
    document.body.appendChild(root);
    // keys typed here are not journey shortcuts
    root.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); e.stopPropagation(); });
    root.find = find;
  };

  async function open() {
    if (isOpen()) return;
    if (!root) build();
    if (!meta) { try { const r = await fetch('./atlas.json', { cache: 'no-cache' }); meta = r.ok ? await r.json() : {}; } catch (e) { meta = {}; } }
    // the way to the text gallery (text/index.html, written by build-deploy: every world in a sentence or two), beside About,
    // once the release carries enough texts for the page to be worth reading (atlas.json: text, how many worlds have one)
    if (!root.textLink && meta.text >= TEXT_MIN) { const a = el('a', 'atlas-about', 'Full World Descriptions'); a.href = './text/'; root.textLink = a; root.querySelector('.atlas-head').insertBefore(a, root.querySelector('.atlas-x')); }
    wasPaused = !!engine.settings.paused; setPaused(true); engine.opts.hold = true;   // nothing is drawn behind the index while it is open
    draw(); root.hidden = false; document.body.classList.add('atlas-open');
    if (!matchMedia('(pointer: coarse)').matches) root.find.focus();
    const here = root.querySelector('.here'); if (here) here.scrollIntoView({ block: 'center' });
  }
  function close() {
    if (!isOpen()) return;
    root.hidden = true; document.body.classList.remove('atlas-open'); engine.opts.hold = false; setPaused(wasPaused);
    if (location.hash === '#worlds') history.replaceState(null, '', location.pathname + location.search);
  }
  const toggle = () => (isOpen() ? close() : open());

  // the three ways in
  const fromHash = () => { if (location.hash === '#worlds' || location.hash === '#index') open(); };
  window.addEventListener('hashchange', fromHash); fromHash();
  if (optionsButton) {
    let held = 0, fired = false;
    optionsButton.addEventListener('pointerdown', () => { fired = false; clearTimeout(held); held = setTimeout(() => { fired = true; open(); }, 900); });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) optionsButton.addEventListener(ev, () => clearTimeout(held));
    // the click that ends a long hold must not also open the options (caught on the way down, before the button sees it)
    document.addEventListener('click', (e) => { if (fired && optionsButton.contains(e.target)) { e.stopImmediatePropagation(); e.preventDefault(); } fired = false; }, true);
    optionsButton.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  return { open, close, toggle, isOpen };
}
