// Which world comes next. Nothing here touches three.js or the page: the engine calls these with itself as `e`, and
// tools/ordertest.mjs calls them with a plain object of the same fields, thousands of times, in node.
// e: { registry, settings { strangeness, kinds, calmOnly, order }, hearts (a Set of world ids, or none), seen ({ id: when } or null),
//      recent, bags, lastId, pickRng, cur ({ def } or null), count (worlds shown so far), opts { tour }, tourDef,
//      series (seriesNext's own note of the run it is following, or null), seriesFailed (a Set of ids, or none) }
// Every random choice comes from e.pickRng, so a journey link (?session=N) gives the same order every time.

export const tierOf = (def) => { const w = def.weirdness ?? 0; return w < 0.35 ? 0 : w < 0.78 ? 1 : 2; };   // earth-like / alien / bizarre
// band: how good a world looks, 1 to 5 (5 best), from the polish order (design/bands.json, written into the registry by
// tools/gen-registry.mjs). A world with no band counts as the middle one.
export const bandOf = (def) => def.band || 3;
// The opening run: the first RUN worlds of a sitting come from the best band there is, each of another kind of place
// where the band allows. After it the bands widen step by step (pickNext, step 2).
export const RUN = 12;

// The worlds the journey may show: the kinds chosen, then calm only, then favourites only.
export function poolOf(e) {
  // never a later member of a made series (def.member): such a world is reached only through the world before it (seriesNext)
  const k = e.settings.kinds, all = e.registry.some((d) => d.member) ? e.registry.filter((d) => !d.member) : e.registry; let pool = all;
  if (k && k.size) { const f = pool.filter((d) => k.has(d.category)); if (f.length) pool = f; }
  // 'calm worlds only' (for anyone the motion makes queasy): worlds measured as gentle from arrival to exit (def.calm, set by
  // tools/gen-registry.mjs from design/calm.json). Where the chosen kinds hold no calm world, calm wins over the kinds.
  if (e.settings.calmOnly) { let f = pool.filter((d) => d.calm); if (!f.length) f = all.filter((d) => d.calm); if (f.length) pool = f; }
  // 'favourites only': the hearted worlds of that pool when there are at least three of them (two would only take turns);
  // with fewer the order behaves as 'new to you first'
  if (e.settings.order === 'hearts' && e.hearts) { const f = pool.filter((d) => e.hearts.has(d.id)); if (f.length >= 3) pool = f; }
  return pool;
}
// true when that pool is the favourites
export const heartsOnly = (e, pool) => e.settings.order === 'hearts' && !!e.hearts && pool.length >= 3 && pool.every((d) => e.hearts.has(d.id));

// the picker's memory of a world it has handed out, however it was chosen
function note(e, def) { e.lastId = def.id; e.recent.push(def.id); if (e.recent.length > 24) e.recent.shift(); }

export function pickNext(e) {
  const s = e.settings.strangeness, pool = poolOf(e), n = e.count + 1;   // n: the number of the world being chosen in this sitting
  // tier odds: earth-like / alien / bizarre
  const lo = [0.9, 0.09, 0.01], mid = [0.56, 0.29, 0.15], hi = [0.12, 0.4, 0.48];
  const odds = [0, 1, 2].map((i) => (s < 0.5 ? lo[i] + (mid[i] - lo[i]) * s * 2 : mid[i] + (hi[i] - mid[i]) * (s - 0.5) * 2));
  // never a world seen in the last few visits: a small tier must not come round again too soon
  const memory = Math.min(12, Math.floor(pool.length / 2)), recent = e.recent.slice(-memory);
  const fresh = (d) => !recent.includes(d.id);
  // The worlds that may come next, narrowed step by step, each step only where it leaves something:
  let ok = pool.filter(fresh), allNew = false;
  // 1. worlds this viewer has never seen, in whichever strangeness tier they are: nothing repeats while anything is unseen
  const byWhen = !!e.seen && e.settings.order !== 'any', when = (d) => e.seen[d.id] || 0;
  if (byWhen) { const never = ok.filter((d) => !when(d)); if (never.length) { ok = never; allNew = true; } }
  // 2. the best first: the opening run of a sitting (its first twelve worlds) comes from the top band (the best band
  //    there is, when the top one is used up), the eight after it from the two best bands, and the two weakest bands
  //    wait until the thirty-first
  if (n <= RUN + 18) for (const min of n <= RUN ? [5, 4, 3] : n <= RUN + 8 ? [4, 3] : [3]) { const f = ok.filter((d) => bandOf(d) >= min); if (f.length) { ok = f; break; } }
  // 3. the strangeness tier, drawn by the slider's odds among the tiers that still hold such a world (so a tier with none
  //    of them hands its share to the others instead of repeating itself or giving up the band)
  const can = new Set(ok), have = [0, 1, 2].map((i) => ok.some((d) => tierOf(d) === i));
  let total = 0; for (let i = 0; i < 3; i++) total += have[i] ? odds[i] : 0;
  let def;
  if (total <= 0) def = e.pickRng.pick(pool.filter((d) => d.id !== e.lastId).length ? pool.filter((d) => d.id !== e.lastId) : pool);
  else {
    let x = e.pickRng() * total, tier = 0;
    for (let i = 0; i < 3; i++) { if (!have[i]) continue; tier = i; x -= odds[i]; if (x <= 0) break; }
    // each tier is dealt from a shuffled bag, refilled when it holds nothing that may come next
    const bag = e.bags[tier];
    const usable = () => bag.filter((d) => can.has(d));
    if (!usable().length) { bag.length = 0; bag.push(...pool.filter((d) => tierOf(d) === tier)); e.pickRng.shuffle(bag); }
    let cand = usable();
    // everything seen already: the ones seen longest ago
    if (byWhen && !allNew) cand = cand.slice().sort((a, b) => when(b) - when(a)).slice(-5);
    // prefer a world that contrasts with the one on screen: another kind of place, another light. In the opening run the
    // whole bag is weighed, not its last five, and a kind of place this sitting has not shown yet counts for most: the
    // first worlds anyone sees should lie as far apart as the collection does
    const cur = e.cur?.def, run = n <= RUN && !(byWhen && !allNew);
    const shown = run ? new Set(e.recent.map((id) => e.registry.find((w) => w.id === id)?.category)) : null;
    if (!run) cand = cand.slice(-5);
    let best = -1;
    for (const d of cand) {
      let score = e.pickRng() * 0.5;
      if (shown && !shown.has(d.category)) score += 2;
      if (cur) {
        if (d.category !== cur.category) score += 1;
        if (d.tone && cur.tone) score += Math.abs(d.tone[0] - cur.tone[0]) * 1.2 + Math.abs(d.tone[1] - cur.tone[1]) * 0.8;
      }
      if (score > best) { best = score; def = d; }
    }
    bag.splice(bag.indexOf(def), 1);
  }
  note(e, def);
  return def;
}

// A tour: world ids to fly in order before the picker takes over (e.opts.tour, from a shared journey link). Returns the
// next world of the tour, or null when it is over. Ids that are not in the registry are passed over, and so is the world
// on screen (the page may have opened on the tour's first world itself).
export function tourNext(e) {
  const t = e.opts && e.opts.tour; if (!Array.isArray(t)) return null;
  // the tour world handed out last never came on screen (a setting changed and the waiting world was rebuilt): the same one again
  // (by id throughout: the def of a world on screen is the engine's own copy of its registry entry, with the module's fields added)
  const on = e.cur?.def.id;
  let def = e.tourDef && e.tourDef.id !== on ? e.tourDef : null;
  while (!def && t.length) { const id = t.shift(), d = e.registry.find((w) => w.id === id); if (d && d.id !== on) def = d; }
  e.tourDef = def;
  if (!def) return null;
  // it leaves its tier's bag as a picked world would, and so does the world on screen (the page opened on it, no bag dealt
  // it): the picker must not deal a world of the tour again soon after the tour
  const pool = poolOf(e);
  for (const w of [pool.find((d) => d.id === on), def]) {
    if (!w || !pool.includes(w)) continue;
    const bag = e.bags[tierOf(w)]; if (!bag.length) { bag.push(...pool.filter((d) => tierOf(d) === tierOf(w))); e.pickRng.shuffle(bag); }
    if (bag.includes(w)) bag.splice(bag.indexOf(w), 1);
  }
  note(e, def);
  return def;
}

// A made series: worlds built to follow one another. A member names the world after it (def.next) and every member after
// the first carries def.member, both written by tools/gen-registry.mjs from design/suites.json; poolOf leaves the later
// members out, so the picker deals only the first, and from it the series is flown in order whatever kinds are chosen
// (it is one work). Returns the world after the one on screen, or null when the picker should choose.
// e.series: { run: [ids, in order, from the world the run began on], closed }. A ring (the last member names the first) is
// flown once round and closes on the world the run began on; that world, shown the second time, ends the run. The run
// also ends where the successor is not in the registry, has failed to load (e.seriesFailed, a Set the engine fills), is
// not a calm world on a calm-only journey, or the journey is favourites only.
export function seriesNext(e) {
  const cur = e.cur?.def, end = () => { e.series = null; return null; };
  if (!cur || !cur.next || cur.next === cur.id) return end();
  const id = cur.next, def = e.registry.find((w) => w.id === id), pool = poolOf(e);
  if (!def || (e.seriesFailed && e.seriesFailed.has(id)) || (e.settings.calmOnly && !def.calm) || heartsOnly(e, pool)) return end();
  let s = e.series; const last = s ? s.run[s.run.length - 1] : null;
  // the successor handed out last never came on screen (a setting changed and the waiting world was rebuilt): the same one again
  const again = !!s && last === id && s.run[s.run.length - 2] === cur.id;
  if (!again) {
    if (!s || last !== cur.id) s = e.series = { run: [cur.id], closed: false };   // a run begins on the world on screen
    if (s.closed) return end();
    if (s.run.includes(id)) { if (id !== s.run[0] || s.run.length < 2) return end(); s.closed = true; }
    s.run.push(id);
  }
  // it leaves its tier's bag as a picked world would (only the first member of a ring is ever in a bag)
  if (pool.includes(def)) { const bag = e.bags[tierOf(def)]; if (!bag.length) { bag.push(...pool.filter((d) => tierOf(d) === tierOf(def))); e.pickRng.shuffle(bag); } if (bag.includes(def)) bag.splice(bag.indexOf(def), 1); }
  note(e, def);
  return def;
}

// The size of the pool when def is the one world of it this viewer has not seen (the collection is complete once def
// has been shown), else 0. Not for 'any order', a journey link, or favourites only.
export function lastUnseen(e, def) {
  if (!e.seen || e.settings.order === 'any' || !def || e.seen[def.id]) return 0;
  const pool = poolOf(e); if (!pool.includes(def) || heartsOnly(e, pool)) return 0;
  return pool.every((d) => d === def || e.seen[d.id]) ? pool.length : 0;
}

// The world a sitting opens on. The page asks once, before the journey starts; rand is the page's own dice (the journey's
// are not touched, so a journey link still gives its order). defs: every world the page has. In this order: the first
// world of a tour; on 'favourites only' a favourite; one of the openers (def.opener: the chosen first sights; on a calm
// journey the calm ones, or any calm world when no opener is calm) this viewer has not seen; when every opener has been
// seen, the best band among the worlds not seen; when everything has been seen, the openers seen longest ago.
export function firstWorld(e, defs, rand = Math.random) {
  const any = (l) => l[Math.floor(rand() * l.length)], pool = poolOf(e);
  const t = e.opts && e.opts.tour; if (Array.isArray(t)) for (const id of t) { const d = defs.find((w) => w.id === id); if (d) return d; }
  if (heartsOnly(e, pool)) return any(pool);
  const calm = e.settings.calmOnly ? defs.filter((d) => d.calm && !d.member) : [];
  const openers = calm.length ? (calm.some((d) => d.opener) ? calm.filter((d) => d.opener) : calm) : defs.filter((d) => d.opener);
  if (!e.seen || e.settings.order === 'any') return any(openers);
  const when = (d) => e.seen[d.id] || 0, a = openers.filter((d) => !when(d));
  if (a.length) return any(a);
  const b = pool.filter((d) => !when(d));
  if (b.length) { const top = Math.max(...b.map(bandOf)); return any(b.filter((d) => bandOf(d) === top)); }
  return any(openers.slice().sort((x, y) => when(x) - when(y)).slice(0, 4));
}
