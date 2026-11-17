// WHERE CIRCLES HUM
// After Wassily Kandinsky (the Bauhaus years). A buff sprayed field with no ground: we ride a ruled black line that a
// flying point has just drawn, through a shoal of films, under seven compass arcs, between edged triangle peaks, through
// a harp, break a chequer plane, pass through the rose grain of a vast black circle, cross its skin and fall through
// the night inside it to a dark-blue circle with a black heart.
//
// Everything is made with the style kit of src/parts/where-circles-hum.js (unlit flat paint; films that multiply on the
// buff and exclude on the dark; stipple halos; ruled ribbons; edged plates; chequers). No light, no fog, no texture,
// no full-screen pass but the hero's brief wash. post.flat: a hex written is the hex shown.
//
// FRAME. The world is laid out in the brief's coordinates (course +Z, rail from (4,-2,40) to (-60,20,556), hero centre
// (-110,70,660)) inside one group W whose x is mirrored (W.scale.x = -1), so that the great circle hangs UPPER LEFT of
// the course as the brief's glance asks (a lens travelling +Z has world -X on its right). B(x,y,z) below takes a brief
// point to world space. All materials are double-sided so the mirror culls nothing.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import {
  buildHero, makeUniforms, pigments, makeField, makeFilms, makeHalos, makeGrain, makeLines, bundle, lineHead, lineMaterial,
  makePlates, makeChequer, chequerBoard, makeHatch,
} from '../parts/where-circles-hum.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const bell = (c, w, x) => { const t = Math.max(0, 1 - Math.abs(x - c) / w); return t * t * (3 - 2 * t); };
const RAIL_A = V3(4, -2, 40), RAIL_T = V3(-64, 22, 516).normalize();      // the rail, brief coordinates
const OFF = V3(1.5, 1.3, 0);                                               // the lens rides this far off the line

export default {
  id: 'where-circles-hum',
  name: 'Where Circles Hum',
  category: 'artists',
  placeKind: 'bizarre',
  after: 'Wassily Kandinsky, 1866 to 1944',
  weirdness: 0.8,
  media: ['air', 'rail'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const W = new THREE.Group(); W.scale.x = -1; scene.add(W);            // the mirror (see FRAME above)
    const detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {}, density = vary.density ?? 1, rare = !!vary.rare;
    const rng = ctx.rng, rw = rng.fork('wch-world');
    const HU = makeUniforms();
    const weather = rw.int(0, 2), castLead = rw.int(0, 1);                 // 0 clear, 1 hatch showers, 2 grain banks; darts or swimmers lead
    const hour = vary.hour || 'any';

    // hero local -> brief coordinates (the hero's seat: position (-110,-55,660), turned half round)
    const hb = (v) => V3(-110 - v.x, -55 + v.y, 660 - v.z);
    const B = (v) => V3(-v.x, v.y, v.z);                                   // brief -> world
    const railAt = (s) => RAIL_A.clone().addScaledVector(RAIL_T, s);
    // ---- the path: along the rail 2 m off the line, through the skin, then the hero's own line down the tiers. Laid from the hero's
    // own points by layRoute(), which the hero calls for (opts.cast) before it makes its meshes, so that its cast can be measured
    // against the line that is flown (CLEAR AIR, below) ---------------------------------------------------------------
    let route = null;
    const layRoute = (flyL, skinL) => {
      const fly = flyL.map(hb), skinB = hb(skinL), nightCurve = new THREE.CatmullRomCurve3(fly.slice(2), false, 'centripetal');
      const sSkin = skinB.clone().sub(RAIL_A).dot(RAIL_T), s0 = sSkin - nightCurve.getLength();   // day as long as night: the skin at u 0.5
      const pts = [];
      for (let s = s0; s < sSkin - 30; s += 45) pts.push(railAt(s).add(OFF));
      pts.push(railAt(sSkin - 20).add(OFF), railAt(sSkin).add(OFF), fly[3].clone().addScaledVector(OFF, 0.7));
      for (let i = 4; i <= 8; i++) pts.push(fly[i].clone());
      pts.push(fly[8].clone().lerp(fly[9], 0.34), fly[8].clone().lerp(fly[9], 0.67), fly[9].clone());
      const path = makePath(pts.map(B)), n = Math.ceil(path.length / 0.5), at = new Float32Array((n + 1) * 3), v = V3();
      let skinI = n;   // the first of those half-metre places inside the great circle (centre (-110,70,660), 125 m): day forms are measured against the places up to it, night forms against the places from it (the night itself is switched at the exact crossing, uSkin below, under half a metre before this place: that last stretch is measured for day forms only)
      for (let i = 0; i <= n; i++) { path.posAtDist(Math.min(path.length, i * 0.5), v); at[i * 3] = -v.x; at[i * 3 + 1] = v.y; at[i * 3 + 2] = v.z; if (skinI === n && Math.hypot(-v.x + 110, v.y - 70, v.z - 660) <= 125) skinI = i; }   // the flown line every half metre, brief coordinates
      return (route = { fly, skinB, sSkin, s0, path, at, n, skinI });
    };
    // CLEAR AIR (p3, the cure). The bar: every body keeps 2 m of air from the flown line. flownDist: how far a place (brief
    // coordinates) stands from the part of the flown line on which a form of that `when` is there (0: before the skin, 1: from the
    // skin on, 2: all of it), by the nearest of its places 8 m apart and then every half metre round that one. segNear: true when a
    // straight stroke a to b comes within `need` metres of it (stepped along the stroke by what is left over, half a metre at the
    // least). A line or a square that comes too near is marked cut and is not made; nothing is moved, shrunk or drawn again.
    const flownDist = (x, y, z, when = 2) => { const a = route.at, i0 = when === 1 ? route.skinI : 0, i1 = when === 0 ? route.skinI : route.n; let bi = i0, bd = 1e18;
      for (let i = i0; i <= i1; i = i < i1 ? Math.min(i1, i + 16) : i1 + 1) { const dx = a[i * 3] - x, dy = a[i * 3 + 1] - y, dz = a[i * 3 + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; bi = i; } }
      for (let i = Math.max(i0, bi - 16); i <= Math.min(i1, bi + 16); i++) { const dx = a[i * 3] - x, dy = a[i * 3 + 1] - y, dz = a[i * 3 + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < bd) bd = d; }
      return Math.sqrt(bd); };
    const segNear = (a, b, need, when) => { const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, len = Math.hypot(dx, dy, dz) || 1e-6;
      for (let m = 0; ; ) { const t = Math.min(1, m / len), d = flownDist(a.x + dx * t, a.y + dy * t, a.z + dz * t, when); if (d < need) return true; if (t >= 1) return false; m += Math.max(0.5, d - need); } };
    // a ruled line's own reach: 2 m of air, its half width (heavier at its end), its hum, its wave (a swimmer also slides 2.5 waves along itself);
    // a looping line carries a ruling point, a still disc (no swell) that slides from end to end of it, and is given that disc's radius (head) on top
    const lineCut = (l, map, head = 0) => { const a = map(V3(...l.a)), b = map(V3(...l.b)), wv = l.wave || 0;
      if (wv) { const d = b.clone().sub(a).normalize().multiplyScalar(2.5 * wv); a.sub(d); b.add(d); }
      return segNear(a, b, 2.1 + 0.65 * (l.w ?? 0.3) + (l.hum || 0) + wv + (l.loop ? head : 0), l.when ?? 0); };
    const POINT_R = 0.8;                                                   // the radius of the world's ruling points
    const same = (v) => v, laid = (l) => { if (lineCut(l, same, POINT_R)) l.cut = true; return l; }, kept = (a) => a.filter((f) => !f.cut);
    // a compass arc is measured by its drawn shape: the line shader's own at() (bow and bowDir, as the part's lineMaterial has it) at each of the
    // ARC_SEGS + 1 joints of the ribbon it is drawn with, and every straight chord between two joints as a ruled stroke (the same reach: 2 m of air,
    // its half width, its hum). The chords ARE the drawn line, so nothing drawn lies between the joints; along a chord segNear steps half a metre at
    // the most against flown places half a metre apart, which can hide no more than 2.1 m less the root of (2.1 squared less 0.5 squared), 6 cm.
    const ARC_SEGS = 48;
    const arcCut = (l) => { const a = V3(...l.a), dv = V3(...l.b).sub(a), len = Math.max(dv.length(), 1e-3), dir = dv.multiplyScalar(1 / len), bd = V3(...(l.bowDir || [0, 1, 0])), mid = a.clone().addScaledVector(dir, len / 2);
      const hh = -l.bow, c2 = len / 2, rho = (c2 * c2 + hh * hh) / Math.max(2 * hh, 1e-3), th1 = Math.asin(Math.min(1, Math.max(0, c2 / Math.max(rho, 1e-3))));
      const at = (t) => { if (!(l.bow < 0)) return a.clone().addScaledVector(dir, len * t).addScaledVector(bd, (l.bow || 0) * 4 * t * (1 - t)); const th = (2 * t - 1) * th1; return mid.clone().addScaledVector(bd, rho * Math.cos(th) - (rho - hh)).addScaledVector(dir, rho * Math.sin(th)); };
      for (let j = 0, p = at(0); j < ARC_SEGS; j++) { const q = at((j + 1) / ARC_SEGS); if (segNear(p, q, 2.1 + 0.65 * (l.w ?? 0.3) + (l.hum || 0), l.when ?? 0)) return true; p = q; }
      return false; };
    // the hero's cast, before its meshes (its places are its own: hb takes them to brief coordinates): a dart whose straight track
    // comes within 3 m of the flown line is not made; a ruled line (but the rail's own end) that comes within its reach is not made, a
    // looping line with its ruling point's radius (c.head) on top. The hero's squares, standing triangles, solid circles, films and halos
    // are handed over too and are not measured here: no law holds them
    const heroCast = (c) => {
      layRoute(c.fly, c.skin);
      for (const f of c.plates) if (f.vel && f.span) { const p = hb(V3(...f.p)), d = hb(V3(...f.p).add(V3(...f.vel).normalize())).sub(p).multiplyScalar(f.span / 2); if (segNear(p.clone().sub(d), p.clone().add(d), 3, f.when ?? 0)) f.cut = true; }
      for (const l of c.lines.concat(c.bent)) if (l !== c.rail && lineCut(l, hb, c.head)) l.cut = true;
    };

    // ---- the hero: the great circle and the night inside it -------------------------------------------------------
    const hero = await buildHero(ctx, { U: HU, detail, field: false, cast: heroCast });
    hero.object.position.set(...hero.place.position); hero.object.rotation.y = hero.place.rotationY;
    W.add(hero.object); W.updateMatrixWorld(true);
    const P = hero.pigments, UO = { U: HU };
    const fieldCloud = hour === 'dawn' ? P.rose : hour === 'golden' ? P.ochre : [P.ochre, P.buff, P.rose][hero.groundKind];
    const field = makeField({ U: HU, pig: P, seed: rw.range(0, 9), cloud: fieldCloud, toward: hour === 'night' ? P.pblue.clone().lerp(P.blue, 0.35) : P.pblue });
    field.material.transparent = false;   // opaque, so it is drawn before the engine's portal (an opaque mesh): as a transparent mesh without depth test it painted over the opening
    scene.add(field);
    await ctx.yield();
    const A = hero.anchors, { fly, skinB, sSkin, s0, path } = route || layRoute(A.flyThrough, A.skin.position), heroC = hb(A.center);
    const seatB = hb(A.portalSeat.position), blueB = hb(A.blueCircle.center), heartB = hb(A.heart), compB = hb(A.companion);

    const Lp = path.length, tmpV = V3();
    let uSkin = 0.5;
    { let lo = 0.3, hi = 0.7; const hw = B(heroC);                         // the u at which the lens enters the great circle
      for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (path.pointAt(m, tmpV).distanceTo(hw) > 125) lo = m; else hi = m; } uSkin = hi; }
    const sOfU = (u) => s0 + u * Lp;                                       // rail distance of the lens at u (day half)
    const uOfS = (s) => (s - s0) / Lp;
    const eyeAt = (u) => { const p = path.pointAt(u, V3()); p.x = -p.x; return p; };   // the lens at u, brief coordinates
    await ctx.yield();

    const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];
    const warm = [P.yellow, P.orange, P.yellow, P.red, P.rose], cool = [P.pblue, P.green, P.lviolet, P.blue, P.white];
    const hues = [P.yellow, P.red, P.pblue, P.orange, P.green, P.lviolet, P.rose];
    const railDist = (p) => { const v = p.clone().sub(RAIL_A), s = v.dot(RAIL_T); return v.addScaledVector(RAIL_T, -s).length(); };
    const films = [], solids = [], halos = [], lines = [], staves = [], bent = [], plates = [], squares = [];

    // ---- DAY FILMS: 700 flat circles in the volume round the rail; near ones warm and small, far ones blue and large --
    const rf = rng.fork('wch-films');
    const drift = (r, amp) => { const a = r.range(0, 6.283), e = r.range(-0.35, 0.35); return [Math.cos(a) * amp, Math.sin(a) * amp * 0.8 + e * amp, Math.sin(a + 1.3) * amp * 0.4]; };
    const pathClear = (p, need) => { const w = B(p); return path.distanceTo(w.x, w.y, w.z) > need; };
    const addFilm = (p, r, c, r_, o = {}) => {
      const holds = r_() < 0.22, f = { p: p.toArray(), r, c, when: 0, seed: r_(), vel: o.vel || drift(r_, o.amp ?? r_.range(4, 22)), w: o.w ?? r_.range(0.05, 0.14),
        c2: pick(r_, cool), inner: holds ? [r_.range(-0.2, 0.2), r_.range(-0.2, 0.2), r_.range(0.3, 0.55)] : [0, 0, 0] };
      films.push(f);
      if (r > 1.2 && r_() < (o.halo ?? 0.33)) halos.push({ p: f.p, ri: r, ro: r * r_.range(1.3, 1.6), c: pick(r_, [P.yellow, P.white, P.rose, P.yellow]), when: 0, seed: r_(), rate: r_.range(0.4, 1.4), dens: 1.15 });
      return f;
    };
    const nFilms = Math.round(280 * (0.45 + 0.55 * detail) * (0.8 + 0.2 * density));
    const eyesDay = []; for (let m = 0; m < 0.45 * Lp; m += 2.5) eyesDay.push(eyeAt(m / Lp)); eyesDay.push(eyeAt(0.45));   // the lens every 2.5 m of route over the first 0.45 of the route's length, and once more at that stretch's end, under 2.5 m on (live's own stretch for this test): even steps of route metres but for that last place, no chosen positions
    const overFace = (p, r = 0) => eyesDay.some((e) => { const dv = p.clone().sub(e), L = dv.length(), oc = heroC.clone().sub(e), b = oc.dot(dv) / L; return b > L && oc.addScaledVector(dv, -b / L).length() < 140 + r * b / L; });   // between the rail (any lens position of the day half) and the great circle's face
    for (let i = 0; i < nFilms; i++) {
      const s = rf.range(s0 - 10, sSkin - 15), an = rf.range(0, 6.283), far = rf(), d = 12 + 280 * Math.pow(far, 1.25);
      // the weight sits lower and to port (the hero's side); the upper starboard third stays emptier
      let x = Math.cos(an) * d, y = Math.sin(an) * d * 0.62 - 8 - d * 0.12;
      const r = d < 40 ? 0.4 + 2.6 * rf() * rf() : (d < 150 ? 0.8 + 11 * Math.pow(rf(), 2.4) : 3 + 24 * Math.pow(rf(), 3));
      const c = d < 40 ? pick(rf, [P.yellow, P.orange, P.yellow, P.orange, P.rose, P.red]) : (d < 150 ? pick(rf, [P.yellow, P.orange, P.pblue, P.green, P.rose, P.rose, P.red, P.pblue, P.lviolet]) : pick(rf, [P.blue, P.pblue, P.pblue, P.lviolet, P.green, P.pblue]));
      const keep = rf();
      if (x > 20 && y > 12 && keep < 0.9) continue;                       // a third of the frame empty
      const p = railAt(s).add(V3(x, y, 0));
      if (!pathClear(p, r * 1.5 + 7) || p.distanceTo(heroC) < 125 + r + 4 || (overFace(p, r) && keep > 0.1)) continue;
      addFilm(p, r, c, rf, { amp: d < 40 ? rf.range(1, 3) : rf.range(5, 26) });
      if (i % 200 === 199) await ctx.yield();
    }
    // the shoal at the entry: films above, beside and below the eye, ten of them threaded at 2 m, three passed THROUGH
    const rs = rng.fork('wch-shoal'), washFilms = [];
    for (let i = 0; i < 26; i++) {
      const u = 0.004 + 0.12 * (i + rs.range(0.1, 0.9)) / 26, e = eyeAt(u), near = i % 3 === 0, r = near ? rs.range(0.9, 2.3) : rs.range(1.3, 4.6);
      const an = near ? rs.range(-1.9, 0.6) : rs.range(0, 6.283), d = near ? r + rs.range(1.9, 2.6) : r + rs.range(6, 14) + u * 130;
      let p = e.clone().add(V3(Math.cos(an) * d, Math.sin(an) * d * 0.85, rs.range(-3, 3)));
      if (!near && overFace(p, r)) p = e.clone().add(V3(Math.abs(Math.cos(an)) * d + 3, -Math.abs(Math.sin(an)) * d * 0.85, rs.range(-3, 3)));   // never between the entry and the great circle: to starboard and below instead
      if (railDist(p) < r + 0.6) p.y += r + 1.5;
      addFilm(p, r, pick(rs, near ? [P.yellow, P.orange, P.yellow, P.pblue, P.rose] : [P.yellow, P.pblue, P.orange, P.green, P.blue, P.rose, P.lviolet]), rs,
        { vel: [RAIL_T.x * 2, rs.range(-0.6, 0.6), RAIL_T.z * 2], w: rs.range(0.1, 0.25), halo: near ? 0.2 : 0.4 });
    }
    const rwash = rs.fork('wch-wash');   // three films ON the lens line, one in each third of the shoal's stretch (u 0.03 to 0.10), each place drawn by the seed
    [P.yellow, P.pblue, P.rose].forEach((c, i) => {
      const u = 0.03 + 0.07 * (i + rwash.range(0.15, 0.85)) / 3, e = eyeAt(u); films.push({ p: e.toArray(), r: 1.15 + 0.15 * i, c, when: 0, seed: rs(), vel: [0, 0, 0], kind: 2 }); washFilms.push({ u, c });
    });
    // a near yellow film that swells and a blue one that withdraws, off the bow in the first seconds
    { const e = eyeAt(0.06);
      films.push({ p: e.clone().add(V3(7.5, 3.5, 6)).toArray(), r: 4.2, c: P.yellow, when: 0, seed: rs(), vel: [0, 0.5, 0], w: 0.2, kind: 1 });
      films.push({ p: e.clone().add(V3(-9, -4.5, 16)).toArray(), r: 5, c: P.blue, when: 0, seed: rs(), vel: [0, 0.5, 0], w: 0.2, kind: -1, c2: P.pblue, inner: [0.1, -0.1, 0.4] });
      halos.push({ p: e.clone().add(V3(7.5, 3.5, 6)).toArray(), ri: 4.2, ro: 6.6, c: P.yellow, when: 0, seed: rs(), rate: 1.4, dens: 1.3 }); }
    // the first frame's near signs: a pale-blue edged triangle and a small sheared chequer within 30 m to starboard
    { const e = eyeAt(0);
      plates.push({ p: e.clone().add(V3(9.5, -7.5, 27)).toArray(), axis: [0.12, 1, 0], n: [-0.3, 0, -1], h: 13, hb: 2.1, lean: 0.3, edge: 0.22, c: P.pblue, c2: P.yellow, when: 0, seed: rs() });
      for (const q of chequerBoard(rs, e.clone().add(V3(13, -3.5, 31)).toArray(), [0.92, 0.05, 0.38], [0.24, 0.97, 0], 4, 5, 1.7, hues, { ink: 0.45, empty: 0.18 })) squares.push(q); }
    // a film within a few metres every second of the rail
    for (let i = 0; i < 16; i++) {
      const u = 0.13 + 0.31 * (i + rs.range(0.2, 0.8)) / 16, e = eyeAt(u), r = rs.range(0.8, 2.2), an = rs.range(-0.6, 2.2), d = r + rs.range(2.4, 4.5);
      addFilm(e.add(V3(Math.cos(an) * d, Math.sin(an) * d, 0)), r, pick(rs, [P.yellow, P.orange, P.yellow, P.rose, P.pblue]), rs, { vel: [RAIL_T.x * 3, 0, RAIL_T.z * 3], w: rs.range(0.1, 0.2), halo: 0.25 });
    }
    await ctx.yield();

    // ---- THE COUNTRY OF LINE: 15 to 130 m below the rail, 300 m to either side -----------------------------------------
    const rc = rng.fork('wch-country'), sA = s0 + 10, sB = sSkin - 40;
    const below = (s, lat, drop) => railAt(s).add(V3(lat, -drop, 0));
    for (let i = 0; i < 12; i++) {                                         // twelve staves: bundles of unequal parallels at free angles
      const s = sA + (sB - sA) * (i + rc.range(0.1, 0.9)) / 12, c = below(s, rc.range(-240, 200), rc.range(18, 120)), an = rc.range(0, 3.1416), len = rc.range(80, 400) * 0.5;
      const d = V3(Math.cos(an), rc.range(-0.22, 0.22), Math.sin(an)).normalize();
      const a = c.clone().addScaledVector(d, -len), b = c.clone().addScaledVector(d, len);
      for (const l of bundle(rc, a.toArray(), b.toArray(), rc.int(3, 9), rc.range(1.8, 4.5), { w: rc.range(0.22, 0.5), hum: 0.1, side: [rc.range(-0.4, 0.4), 0.3, rc.range(-0.4, 0.4)] })) staves.push(l);
    }
    for (let i = 0; i < 20; i++) {                                         // free ruled diagonals, 60 to 550 m, cropped by the frame
      const s = rc.range(sA, sB + 60), lat = rc.range(30, 280) * (rc() < 0.62 ? -1 : 1), c = below(s, lat, rc.range(-40, 120)), len = rc.range(60, 550) * 0.5;
      const d = V3(rc.range(-1, 1), rc.range(-0.7, 0.7), rc.range(-0.6, 0.6)).normalize();
      const a = c.clone().addScaledVector(d, -len), b = c.clone().addScaledVector(d, len);
      if (pathClear(c, 14)) lines.push({ a: a.toArray(), b: b.toArray(), w: i < 5 ? rc.range(0.6, 1) : rc.range(0.14, 0.4), when: 0, seed: rc(), ruled: i < 5 ? 0 : 2 });
    }
    const towers = [];
    for (let i = 0; i < 9; i++) {                                          // nine chequer towers, sheared, standing in the country
      const s = sA + 30 + (sB - sA - 60) * (i + rc.range(0.15, 0.85)) / 9, lat = rc.range(16, 150) * (i % 2 ? 1 : -1), size = rc.range(3.2, 7.5), nu = rc.int(4, 6), nv = rc.int(5, 8);
      const o = below(s, lat, rc.range(14, 26) + nv * size * rc.range(0.3, 0.9)), yaw = rc.range(-0.6, 0.6) + (lat > 0 ? -0.35 : 0.35), sh = rc.range(-0.3, 0.3);
      const sq = chequerBoard(rc, o.toArray(), [Math.cos(yaw), rc.range(-0.08, 0.08), Math.sin(yaw)], [sh, 0.98, sh * 0.2], nu, nv, size, hues, { ink: 0.45, empty: 0.2 });
      for (const q of sq) { q.c = pick(rc, hues); squares.push(q); }       // each square wipes to a new hue as the flight goes on
      towers.push(o);
    }
    for (let i = 0; i < 60; i++) {                                         // sixty edged triangles
      const s = rc.range(sA, sB + 30), lat = rc.range(10, 290) * (rc() < 0.5 ? -1 : 1), near = Math.abs(lat) < 70, h = near ? rc.range(3, 16) : rc.range(8, 42);
      const p = below(s, lat, rc.range(10, 125) + (near ? 4 : 0));
      const ax = V3(rc.range(-0.5, 0.5), 1, rc.range(-0.2, 0.2)).normalize(); if (rc() < 0.18) ax.set(rc.range(-1, 1), rc.range(-0.3, 0.3), 0.2).normalize();
      const c = near ? pick(rc, [P.yellow, P.orange, P.yellow, P.rose]) : pick(rc, [P.lviolet, P.green, P.rose, P.pblue, P.ochre, P.orange, P.white]);
      if (pathClear(p.clone().addScaledVector(ax, h * 0.5), h * 0.5 + 7)) plates.push({ p: p.toArray(), axis: ax.toArray(), n: [rc.range(-0.3, 0.3), 0.15, -1], h, hb: h * rc.range(0.09, 0.2), lean: rc.range(-0.5, 0.5), c, c2: pick(rc, [P.pblue, P.yellow, P.rose]), when: 0, seed: rc() });
    }
    await ctx.yield();
    // flora: tufts (fans of thin lines from one point) every 20 to 40 m under the rail, and fruit (a circle holding a circle on a stem)
    const rt = rng.fork('wch-flora'), tufts = [];
    for (let s = sA; s < sB - 20; s += rt.range(20, 40) / Math.min(1.2, Math.max(0.8, density))) {
      const side = rt() < 0.6 ? -1 : 1, lat = side * rt.range(3.5, 11), root = below(s, lat, rt.range(5, 13)), n = rt.int(5, 12), tall = rt.range(4, 30), lean0 = rt.range(-0.5, 0.5);
      for (let k = 0; k < n; k++) {
        const fa = (k / (n - 1) - 0.5) * rt.range(0.9, 1.5) + lean0 + rt.range(-0.06, 0.06), len = tall * rt.range(0.55, 1.05);
        const d = V3(side * (0.35 + Math.abs(Math.sin(fa)) * 0.6) + Math.sin(fa) * 0.5, Math.cos(fa), rt.range(-0.25, 0.25)).normalize();
        tufts.push({ a: root.toArray(), b: root.clone().addScaledVector(d, len).toArray(), w: rt.range(0.07, 0.13), when: 0, seed: rt(), hum: rt.range(0.12, 0.3), ruled: 2 });
      }
      if (rt() < 0.7) {                                                    // fruit on a stem beside it
        const fp = root.clone().add(V3(side * rt.range(3, 9), rt.range(1, 7), rt.range(-6, 6))), r = rt.range(0.7, 2.2), d = V3(rt.range(-0.5, 0.5), 1, rt.range(-0.3, 0.3)).normalize();
        solids.push({ p: fp.toArray(), r, c: pick(rt, [P.red, P.yellow, P.orange, P.pblue, P.green]), c2: pick(rt, [P.black, P.white, P.yellow, P.blue]), inner: [0, 0, rt.range(0.35, 0.6)], when: 0, seed: rt(), kind: 2 });
        lines.push({ a: fp.clone().addScaledVector(d, -rt.range(5, 14)).toArray(), b: fp.clone().addScaledVector(d, r * rt.range(1.3, 2.2)).toArray(), w: 0.12, when: 0, seed: rt(), ruled: 2 });
      }
    }
    // fauna of line: wavy lines that swim along their own length, and points that fly at 90 m/s and leave a line standing
    const rl = rng.fork('wch-fauna'), nSwim = castLead ? 30 : 14, loopLines = [];
    for (let i = 0; i < nSwim; i++) {
      const u = 0.03 + 0.4 * (i + rl.range(0.1, 0.9)) / nSwim, e = eyeAt(u), an = rl.range(0, 6.283), d = rl.range(8, castLead ? 45 : 70), len = rl.range(8, 20);
      const c = e.add(V3(Math.cos(an) * d, Math.sin(an) * d * 0.7 - 4, rl.range(-10, 10))), dir = V3(rl.range(-1, 1), rl.range(-0.3, 0.3), rl.range(0.2, 1)).normalize();
      bent.push({ a: c.clone().addScaledVector(dir, -len / 2).toArray(), b: c.clone().addScaledVector(dir, len / 2).toArray(), w: rl.range(0.1, 0.24), when: 0, seed: rl(), wave: rl.range(0.5, 1.1), waves: rl.int(5, 9), ruled: 2 });
    }
    for (let i = 0; i < 9; i++) {
      const u = 0.02 + 0.42 * (i + rl.range(0.1, 0.9)) / 9, e = eyeAt(u), lat = rl.range(18, 120) * (rl() < 0.6 ? -1 : 1), c = e.add(V3(lat, rl.range(-70, 30), rl.range(20, 90))), len = rl.range(150, 340);
      const dir = V3(rl.range(-1, 1), rl.range(-0.35, 0.35), rl.range(-0.4, 1)).normalize();
      const l = { a: c.clone().addScaledVector(dir, -len / 2).toArray(), b: c.clone().addScaledVector(dir, len / 2).toArray(), w: 0.3, when: 0, seed: rl(), loop: len / 90 / 0.6 };
      bent.push(l); loopLines.push(l);
    }
    await ctx.yield();

    // ---- THE ARCHITECTURE OVER THE RAIL: seven compass arcs, the range of peaks, the harp, the chequer plane ----------
    const ra = rng.fork('wch-built'), arcs = [], harp = [];
    const sOfZ = (z) => (z - RAIL_A.z) / RAIL_T.z;
    { let s = sOfZ(150);
      for (let i = 0; i < 7; i++) {                                        // a row of unequal arcs, side by side and overhead: never a tunnel of rings
        const heavy = i === 2 || i === 5, rho = heavy ? ra.range(20, 30) : ra.range(18, 70), cl = heavy ? 8 : ra.range(10, 40), hf = ra() < 0.3 ? ra.range(0.55, 0.8) : 1;
        const lo = (i === 3 ? -1 : 1) * rho * ra.range(0.15, 0.6), yaw = ra.range(-0.55, 0.55), cd = V3(Math.cos(yaw), 0, Math.sin(yaw));
        const top = railAt(s).y + OFF.y + cl, h = rho * hf, half = Math.sqrt(Math.max(rho * rho - (rho - h) * (rho - h), 1)), rise = Math.sqrt(Math.max(rho * rho - lo * lo, 1)) - (rho - h);
        const mid = railAt(s).add(V3(lo, 0, 0)); mid.y = top - rise;
        arcs.push({ a: mid.clone().addScaledVector(cd, -half).toArray(), b: mid.clone().addScaledVector(cd, half).toArray(), w: heavy ? 1.0 : ra.range(0.2, 0.42), when: 0, seed: ra(), bow: -h, bowDir: [ra.range(-0.12, 0.12), 1, 0], hum: heavy ? 0.08 : 0 });
        s += (sOfZ(300) - sOfZ(150)) / 6 * ra.range(0.6, 1.4);
      } }
    const peaks = [];
    for (let i = 0; i < 11; i++) {                                         // triangle peaks 40 to 100 m tall on both sides, the nearest 9 m from the eye
      const s = sOfZ(230) + (sOfZ(420) - sOfZ(230)) * (i + ra.range(0.1, 0.9)) / 11, side = i % 2 ? 1 : -1, h = side > 0 ? ra.range(50, 100) : ra.range(40, 62), hb = h * ra.range(0.1, 0.17), lean = ra.range(-0.35, 0.35);
      const up = h * (side > 0 ? ra.range(0.35, 0.6) : ra.range(0.74, 0.9)), wAt = hb * (1 - up / h), gap = i === 3 ? 9 : (i === 6 ? 12 : ra.range(14, 70));
      const p = railAt(s).add(V3(side * (gap + wAt + Math.abs(lean) * hb), OFF.y - up, 0)), nearP = gap < 30;
      const c = nearP ? pick(ra, [P.yellow, P.orange, P.yellow]) : pick(ra, [P.rose, P.lviolet, P.green, P.orange, P.pblue, P.ochre]);
      peaks.push(p);
      plates.push({ p: p.toArray(), axis: [ra.range(-0.08, 0.08), 1, 0], n: [-side * 0.35, 0, -1], h, hb, lean, edge: ra.range(0.5, 0.9), c, c2: pick(ra, [P.pblue, P.yellow, P.rose]), when: 0, seed: ra() });
    }
    const sHarp = sOfZ(330), uHarp = uOfS(sHarp);
    { const d = V3(0.36, 1, 0.12).normalize(), g = V3(Math.cos(0.5), 0, Math.sin(0.5)), c = railAt(sHarp).addScaledVector(OFF, 0.5); let off = -4.6;
      const offs = [off]; for (let i = 0; i < 4; i++) { off -= ra.range(5, 11); offs.unshift(off); } off = -4.6 + 9.6; offs.push(off); for (let i = 0; i < 3; i++) { off += ra.range(5, 11); offs.push(off); }
      for (const o of offs) { const len = ra.range(92, 120), sh = ra.range(-12, 12), m = c.clone().addScaledVector(g, o).addScaledVector(d, sh);
        harp.push({ a: m.clone().addScaledVector(d, -len / 2).toArray(), b: m.clone().addScaledVector(d, len / 2).toArray(), w: ra.range(0.18, 0.3), when: 0, seed: ra(), hum: 0.2, ruled: 2 }); } }
    // the chequer plane: 6 by 6 squares of 10 m, sheared 12 degrees, 30 degrees to the rail, the rail through its one empty square
    const uWall = 0.444, sWall = sOfU(uWall), wallSq = [];
    { const all = chequerBoard(ra, [0, 0, 0], [Math.cos(0.5236), 0, -Math.sin(0.5236)], [Math.sin(0.2094), Math.cos(0.2094), 0], 6, 6, 10, hues, { ink: 0.4, empty: 0 });
      const hole = all[2 * 6 + 2], shift = railAt(sWall).addScaledVector(OFF, 0.5).sub(V3(...hole.p));
      all.forEach((q, i) => { const gone = ra() < 0.1; if (i === 14 || (gone && i !== 8 && i !== 20 && i !== 13 && i !== 15)) return;
        q.p = [q.p[0] + shift.x, q.p[1] + shift.y, q.p[2] + shift.z]; q.c = pick(ra, hues); q.wake = 0.1 + 0.8 * ra(); wallSq.push(q); }); }
    const wallC = railAt(sWall);
    await ctx.yield();

    // CLEAR AIR over the world's own cast, by place: every straight ruled line (staves, diagonals, tufts, stems, swimmers, the
    // points' lines with their points, the harp), every compass arc (by its drawn shape, arcCut above: an arc is laid to clear the rail
    // only at the one place straight above it, and with its yaw, its offset and its lean it can come down onto the flown line elsewhere) and
    // every chequer square that comes within 2 m of the flown line is not made; a point does not rule a line that is not made. The rail
    // and its chord are the line we ride and are not measured
    for (const l of lines.concat(tufts, staves, harp, bent)) laid(l);
    for (const l of arcs) if (arcCut(l)) l.cut = true;
    const squareCut = (q) => { const c = V3(...q.p), u = V3(...q.u).multiplyScalar(1.04), v = V3(...q.v).multiplyScalar(1.04), lu = u.length(), lv = v.length();
      if (flownDist(c.x, c.y, c.z, q.when ?? 0) > lu + lv + 2.1) return false;
      const nu = Math.ceil(lu * 4), nv = Math.ceil(lv * 4);
      for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const x = 2 * i / nu - 1, y = 2 * j / nv - 1; if (flownDist(c.x + u.x * x + v.x * y, c.y + u.y * x + v.y * y, c.z + u.z * x + v.z * y, q.when ?? 0) < 2.1) return true; }
      return false; };
    for (const q of squares.concat(wallSq)) if (squareCut(q)) q.cut = true;
    for (let i = loopLines.length - 1; i >= 0; i--) if (loopLines[i].cut) loopLines.splice(i, 1);
    await ctx.yield();

    // ---- THE RAIL, the points that rule it, beads, dart shoals, grain banks, hatch -----------------------------------
    const rb = rng.fork('wch-life');
    const sRail0 = s0 - 90, sRailEnd = hb(A.rail.a).sub(RAIL_A).dot(RAIL_T) + 0.5, railLen = sRailEnd - sRail0;
    const railOffs = rare ? [V3(0, 0, 0), V3(5.4, 0.9, 0), V3(-1.4, 5.8, 0)] : [V3(0, 0, 0)];      // the chord: three unequal parallels, the lens between them
    const railLines = railOffs.map((o, i) => ({ a: railAt(sRail0).add(o).toArray(), b: railAt(i ? sSkin + 6 : sRailEnd).add(o).toArray(), w: i ? 0.1 + 0.05 * i : 0.3, when: 0, seed: 0.11 + 0.3 * i, ruled: 1 }));
    const railEnds = railOffs.map((o, i) => (i ? sSkin + 6 : sRailEnd) - sRail0);
    const pointList = railOffs.map((o, i) => ({ p: railAt(sRail0).add(o).toArray(), r: 0.42, c: P.black, when: 0, seed: 0.3 + i * 0.2, kind: 2 }));
    for (const l of loopLines) pointList.push({ p: l.a, r: POINT_R, c: P.black, when: 0, seed: l.seed, kind: 2 });
    // beads: red circles sliding along lines; the first rides the rail and comes alongside at arm's length near u 0.17 (it and the rail's
    // own points ride beside the lens by design and are not measured). Every other bead slides from end to end of its line, and its skin, not
    // its line, must clear: its drawn radius is its own times 1.045 at the most (the film shader's throb for a red circle; no outline)
    const beadTracks = [null], beadList = [{ p: railAt(0).toArray(), r: 0.8, c: P.red, when: 0, seed: 0.7, kind: 0 }];
    const beadHaloList = [{ p: railAt(0).toArray(), ri: 0.8, ro: 1.35, c: P.yellow, when: 0, seed: 0.41, rate: 1.6, dens: 1.6 }], beadHaloOf = [0];
    { const cand = staves.concat(harp).concat(lines.filter((l) => V3(...l.a).distanceTo(V3(...l.b)) > 120));
      for (let i = 0; i < 13; i++) {
        const l = cand[Math.floor(rb() * cand.length) % cand.length], len = V3(...l.a).distanceTo(V3(...l.b)), halo = i % 3 === 0;
        beadTracks.push({ a: V3(...l.a), b: V3(...l.b), rate: rb.range(34, 45) / len * (rb() < 0.5 ? 1 : -1), ph: rb() });
        const r0 = rb.range(0.6, 1.3), r = l.cut || segNear(V3(...l.a), V3(...l.b), 2.1 + 1.045 * r0 + (l.hum || 0), 0) ? 0 : r0;   // a bead on a line that is not made, or whose line comes within 2.1 m and its drawn radius and its line's hum of the flown line, is not seen (radius nought); every draw is made
        beadList.push({ p: l.a, r, c: P.red, when: 0, seed: rb(), kind: 0 });
        if (halo) { beadHaloList.push({ p: l.a, ri: r, ro: r * 1.6, c: P.yellow, when: 0, seed: rb(), rate: 1.5, dens: 1.5 }); beadHaloOf.push(i + 1); }
      } }
    // dart shoals: black-edged acute triangles in yellow and orange overtaking point first at 50 m/s
    const nShoal = castLead ? 1 : 3, uDart = [0.3, 0.12, 0.38];
    for (let k = 0; k < nShoal; k++) {
      const n = Math.round(rb.range(22, 38) * (0.6 + 0.4 * detail)), e = eyeAt(uDart[k]), sideK = k === 1 ? 1 : -1;
      for (let i = 0; i < n; i++) {
        const lat = sideK * rb.range(4, 20), p = e.clone().add(V3(lat, rb.range(-8, 6), 0)).addScaledVector(RAIL_T, rb.range(-45, 45)), h = rb.range(1.5, 4);
        plates.push({ p: p.toArray(), axis: RAIL_T.toArray(), n: [-sideK * 0.6, 0.5, -0.4], h, hb: h * rb.range(0.16, 0.26), lean: rb.range(-0.3, 0.3), edge: 0.09, c: pick(rb, [P.yellow, P.orange, P.yellow]), c2: P.yellow, when: 0, seed: rb(),
          vel: RAIL_T.clone().multiplyScalar(50).toArray(), span: 520, cut: segNear(p.clone().addScaledVector(RAIL_T, -260), p.clone().addScaledVector(RAIL_T, 260), 3, 0) });   // a dart whose straight track comes within 3 m of the flown line is not made
      }
    }
    // banks of grain across the rail (weather 2; one small bank always, so the material is on screen from build)
    const grains = [], nBank = weather === 2 ? 3 : 1, rbank = rb.fork('wch-banks'), uBank = [2, 1, 0].map((third) => 0.06 + 0.33 * (third + rbank.range(0.15, 0.85)) / 3);   // one bank in each third of the rail between the shoal and the chequer plane, the place drawn by the seed
    for (let k = 0; k < nBank; k++) {
      const e = eyeAt(uBank[k]), n = Math.round((weather === 2 ? 2600 : 700) * detail), ci = k % 3;
      for (let i = 0; i < n; i++) {
        const w = rb(), q = e.clone().add(V3(rb.gauss() * 16, rb.gauss() * 9 - 2, rb.gauss() * 20));
        grains.push(q.x, q.y, q.z, 0.015 + 0.1 * w * w * w, 0, rb(), ci, 0);
      }
      await ctx.yield();
    }

    // the storm before the skin (the design: "rose grain thickens from sparse dots to a storm of discs at arm's length"): discs of the
    // halo's own hue, 4 to 20 cm across, drawn all round the rail's line moved by the lens's offset (the straight line the lens flies
    // to 20 m before the skin anchor; from there to the anchor it keeps to within 4 cm of it) over the 60 m of rail that end at that
    // anchor. By the law of the draw there are none at the far end and their number per metre grows evenly with the way in; the cull
    // below then takes some (about 45 of 6,000 at full detail), every one of them on the great circle's side of the line and within
    // the last 3 m, so there the number left falls, by about a quarter at the anchor itself, and the discs are no longer all round.
    // Across the line they crowd toward it by the power of the part's own grain about its rail (0.7 m + a reach x a draw to the 2.1;
    // the reach is 6.3 m here), so none is laid nearer that straight line than arm's length (0.7 m) nor nearer the flown route than
    // 0.66 m (each drifts up to 0.35 m along each axis about its place, 0.61 m in all, as all grain does), and none is laid inside
    // the great circle (a margin of 0.4 m, the part's own). Its stream is forked from the films' stream after that stream's last
    // draw, so no live draw moves.
    { const rst = rf.fork('wch-storm'), n = Math.round(6000 * detail), ci = [0, 1, 3][hero.variant] ?? 0;
      const g1 = V3().crossVectors(RAIL_T, V3(0, 1, 0)).normalize(), g2 = V3().crossVectors(g1, RAIL_T).normalize();
      for (let i = 0; i < n; i++) {
        const s = sSkin - 60 * (1 - Math.sqrt(rst())), rho = 0.7 + 6.3 * Math.pow(rst(), 2.1), th = rst.range(0, 6.283), w = rst(), sd = rst();
        const q = railAt(s).add(OFF).addScaledVector(g1, Math.cos(th) * rho).addScaledVector(g2, Math.sin(th) * rho);
        if (q.distanceTo(heroC) < 125.4) continue;                         // none laid inside the great circle
        grains.push(q.x, q.y, q.z, 0.02 + 0.08 * w * w, 0, sd, ci, 0);
        if (i % 2000 === 1999) await ctx.yield();
      } }

    // ---- meshes: every material exists and is on screen from here on ---------------------------------------------------
    const day = new THREE.Group(); W.add(day);
    day.add(makeHalos(halos, UO)); day.add(makeFilms(solids, { U: HU, solid: true })); await ctx.yield();
    day.add(makeFilms(films, UO)); await ctx.yield();
    const towerMesh = makeChequer(kept(squares), UO), wallMesh = makeChequer(kept(wallSq), UO); day.add(towerMesh, wallMesh);
    day.add(makePlates(kept(plates), UO)); await ctx.yield();
    const staveMat = lineMaterial(HU), railMat = lineMaterial(HU);
    day.add(makeLines(kept(lines.concat(tufts)), { U: HU, segs: 16 }));
    day.add(makeLines(kept(staves.concat(harp)), { U: HU, segs: 40, material: staveMat })); await ctx.yield();
    day.add(makeLines(kept(bent.concat(arcs)), { U: HU, segs: ARC_SEGS }));
    day.add(makeLines(railLines, { U: HU, segs: 120, material: railMat }));   // segments: the 1.6 px floor is taken per vertex await ctx.yield();
    const pointMesh = makeFilms(pointList, { U: HU, solid: true, order: -7.5 }), beadMesh = makeFilms(beadList, { U: HU, solid: true, order: -7.4 }), beadHalo = makeHalos(beadHaloList, UO);
    day.add(pointMesh, beadMesh, beadHalo);
    day.add(makeGrain(grains, { U: HU, colors: [P.rose, P.yellow, P.white, P.pblue] }));   // the fourth hue serves the storm under a pale-blue halo
    const hatch = makeHatch(Math.round(5000 * detail), { U: HU, rng: () => rb(), box: 130, fall: V3(-7, -17, 6), len: 1.6 });
    scene.add(hatch);
    scene.traverse((o) => { if (o.material) o.material.side = THREE.DoubleSide; });   // the mirror must cull nothing
    await ctx.yield();
    const pointPos = pointMesh.children[0].geometry.getAttribute('iPos'), beadPos = beadMesh.children[0].geometry.getAttribute('iPos'), haloPos = beadHalo.geometry.getAttribute('iPos');

    // ---- the flight ------------------------------------------------------------------------------------------------------
    const eye = V3(), eyeB = V3(), q = V3(), wallW = B(wallC), washCol = new THREE.Color(1, 1, 1);
    const setP = (attr, i, v) => attr.setXYZ(i, v.x, v.y, v.z);
    const railA0 = railAt(sRail0);
    return {
      scene, path, duration: 40,
      pace: (u) => 0.86 + 0.42 * sstep(0.07, 0.14, u) - 0.2 * sstep(0.36, 0.42, u) - 0.24 * sstep(0.43, 0.47, u) + 0.44 * sstep(0.5, 0.58, u) - 0.3 * sstep(0.8, 0.88, u),
      camera: { fov: 50, near: 0.3, far: 3000, lookAhead: 22 },
      pois: [
        { at: B(heroC), from: 0.05, to: 0.35, weight: 0.4 },
        { at: B(blueB), from: 0.55, to: 0.8, weight: 0.5 },
      ],
      portal: { shape: 'circle', radius: 7, tilt: true, color: '#DDE6EA', veil: '#DDE6EA', style: 'ring', glow: 0, halo: false, blendDistance: 25, revealDistance: 320, dewash: 0 },   // dewash 0: nothing blooms here, and the engine's take-back of glow blacked the opening out
      post: { flat: 1, exposure: 1, bloom: { strength: 0, radius: 0, threshold: 1 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        camera.getWorldPosition(eye); eyeB.set(-eye.x, eye.y, eye.z);
        hero.setProgress(u >= uSkin ? 1 : 0);
        // a film we pass through washes the view its hue for a quarter of a second
        let wk = 0; washCol.setRGB(1, 1, 1);
        for (const f of washFilms) { const k = bell(f.u, 0.0065, u); if (k > wk) { wk = k; washCol.copy(f.c); } }
        hero.setWash(washCol, wk * 0.5);
        hero.update(dt, time, camera);
        // the points rule the rail: 87 m behind the lens at u 0, past it at u 0.03, 90 m/s to our 24
        const headS = s0 - 87 + 3.75 * u * Lp, rule = Math.min(1, Math.max(0, (headS - sRail0) / railLen));
        railMat.uniforms.uRule.value = rule;
        for (let i = 0; i < railOffs.length; i++) {
          if (i === 0) q.copy(RAIL_A).addScaledVector(RAIL_T, Math.min(headS, sSkin + 28));
          else q.copy(railA0).add(railOffs[i]).addScaledVector(RAIL_T, railEnds[i] * rule);
          setP(pointPos, i, q);
        }
        for (let i = 0; i < loopLines.length; i++) { const l = loopLines[i], h = lineHead(time, l.loop, l.seed);
          pointPos.setXYZ(railOffs.length + i, l.a[0] + (l.b[0] - l.a[0]) * h, l.a[1] + (l.b[1] - l.a[1]) * h, l.a[2] + (l.b[2] - l.a[2]) * h); }
        pointPos.needsUpdate = true;
        // beads: the first rides the rail and comes alongside near u 0.17; the rest slide along staves, strings and diagonals
        const g = sstep(0.185, 0.45, u), beadS = Math.min(sSkin + 24, sOfU(u) - 60 * (1 - sstep(0.12, 0.155, u)) + 4.5 + 520 * g * g);
        q.copy(RAIL_A).addScaledVector(RAIL_T, beadS); setP(beadPos, 0, q);
        for (let i = 1; i < beadTracks.length; i++) { const t = beadTracks[i], f = ((time * t.rate + t.ph) % 1 + 1) % 1; q.copy(t.a).lerp(t.b, f); setP(beadPos, i, q); }
        for (let i = 0; i < beadHaloOf.length; i++) { const j = beadHaloOf[i]; haloPos.setXYZ(i, beadPos.getX(j), beadPos.getY(j), beadPos.getZ(j) + 0.02); }
        beadPos.needsUpdate = true; haloPos.needsUpdate = true;
        // the chord (rare): at the harp every stave and string hums at once
        staveMat.uniforms.uStrike.value = rare ? bell(uHarp, 0.04, u) : 0;
        // chequers: the wall's squares wipe as we near; the towers' wipe as the flight goes on
        wallMesh.setWake(1 - sstep(28, 240, eye.distanceTo(wallW)));
        towerMesh.setWake(sstep(0.0, 0.46, u));
        // hatch showers: on the slant through the harp (and wider in shower weather), gone before the grain
        const rain = (weather === 1 ? 0.22 + 0.5 * bell(0.12, 0.08, u) + 0.78 * bell(uHarp, 0.13, u) : 0.9 * bell(uHarp, 0.07, u)) * (1 - sstep(0.43, 0.48, u));
        hatch.setRain(Math.min(1, rain));
      },
      dispose() { hero.dispose(); },
    };
//@@END
  },
};
