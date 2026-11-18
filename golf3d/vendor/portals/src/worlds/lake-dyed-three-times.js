// THE LAKE DYED THREE TIMES
// An October mountain lake at sunrise made of hanging sheets of silk warp ikat. Nothing here is a surface: every
// form is a row of taut vertical threads in a flat sheet across the course, each thread running from -top to +top,
// so the lake is only the fold where the same threads turn back on themselves. The valley starts white and takes
// its colours in the dyer's order (saffron, madder crimson, indigo), each bath rising from the fold.
//
// Everything is shaded by the one thread shader of the hero (src/parts/lake-dyed-three-times.js: makeStyle,
// packThread, makeSheetMesh, stripGeometry). This file hangs the rest of the valley in the same way:
//   reed curtains on the shore (parted by the eye; the first tied open and the rest swagged low on the axis, a window on
//   the white mountain), sixteen wing sheets of poplar bank (each poplar hung by itself, close-set, a hand in front of
//   its bank, against undyed silk: the ikat flame), six valley walls, three spurs (parted by the eye on the climb) with
//   their sky tapes, gauze for the mist edition, the farmhouses, jetty and boat, mallard
//   knots with their wedges of slip, thread-end leaves, and the cast (storks, white horses or swans as resist gaps).
//
// THE PICTURE (polish pass 2). The groves are gold from the first frame (saffron stands 35 m at 0 s), willows, farmhouses and
// two reed clumps in five were dyed before the valley (green and crimson from the start), the far massif already carries its
// saffron foot and crimson gullies. Wings, walls and spur faces are hung nearly close-set (a flat owns its pixels); curtains are
// sheer (one part in eight) and thicken at arm's length. From 12 to 20 s the path drifts to port and rises to about 30 m while
// the last wings stand their poplars well out and the spurs dip low on the axis: the massif stands whole above the groves and
// takes its indigo. The spurs' parted towers and the hero's lancet rest low until 20.5 to 25.6 s, then are hoisted.
// THE PICTURE (polish pass 3). THE DOUBLED VALLEY. The path stays 5 to 9 m above the fold to the head of the lake and the gaze
// rests on the fold under the summit (fov 66): mountain whole above, twin whole below, the fold across the middle. Wings 9 to 15
// stand back round an open basin. The high woods of the wings, the valley walls and the foothill flank were dyed before the valley
// (recipe bit 16): green spires and indigo slopes stand from the first frame, the far massif is indigo to 300 m at 0 s and the bath
// creeps to its snowline by 12 s; the lake level (groves, meadows, reeds, spurs, the exit lancet) takes the three baths in flight.
// Seen from afar a flat is whole cloth (uSolid: threads drawn wider than their spacing beyond 14 to 70 m; countable at arm's
// length); the folded half hangs one flat step deeper (uLow) and level ripple dashes lie on the fold, so the lake is a surface.
// Curtain threads beside each slit take saffron as the eye comes. Each spur's tower has its own dyes. No bare sky thread or sky
// tape hangs in the window on the mountain. Storks fly as gaps against the massif's indigo body.
// THE PICTURE (polish pass 4). FIVE PICTURES ON THE LAKE AND A DYED MIRROR. The folded half hangs in the same whole dyes one
// bath deeper (the part's dye()): no veil, nothing outside the dye table. The reed curtains are tied back as an avenue (their
// gold sheaves frame the lake and the white mountain); the course then swings to starboard and runs back at the port bank with
// the gaze side on (crimson and gold flames, in the horse edition three white horses, whole in the frame at 4.4 to 7.2 s on
// seed 7, the nearest a fifth of the frame wide until 6.4 s: round 13), skims 2 m over the fold past
// stands of dyed withies at arm's length, rises once to 28 m, and comes down to 9 m for the 18 s image. The spur towers hang
// a little open once hoisted: three partings one inside another with the exit at the end, a flat saffron disc (portal.veil)
// in a lancet tied in every dye. The satin sheen rides at the eye's own height. The shift is an edition of its own.
// THE PICTURE (polish pass 5). THE ONE LIGHT. The satin sheen is a real belt: level, a third of the frame tall, centred on the gaze
// at every distance (uBelt), each pale thread a tint of its own dye (pale gold, rose, pale blue, mauve, leaf green; the part's
// uTint). The starboard withy stands are bodies seen whole from the skim (10 s). The horses' resist is tied through every bank
// in front of them: on the port side a pair on wing 12 (round 13, seed 7: both whole and a sixth of the frame wide at 15.2 s;
// by 16 s the inner one a fifth of the frame wide and whole, the outer one three fifths out of the frame's left edge), and one
// on wing 14 that wades up out of the fold (16.6 to 17.5 s) and stands at the frame's left edge in the 18 s image.
// SHEET SPACE. All sheets hang in one group ("stage") placed like the hero: the eye flies from z 1000 toward z 0,
// starboard is +X, the fold is y 0. World course +Z = stage -Z.
// CLOCK. The journey clock is u * 40 s; every bath, breath, gust, parting and creature hangs on it or on the eye.
// VARIATIONS (seeded once): hour (sunrise | golden honey silk | day: the indigo bath only | night: indigo first),
//   season (early | late | first snow), weather (still | breezy | mist), cast (storks | horses | swans).
//   Rare (ctx.vary.rare): the shift, every other bundle of the massif drops 30 m at 24 s and creeps back.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, makeStyle, packThread, makeSheetMesh, stripGeometry, skyStripGeometry, packSkyTape, keepLevel, SKY_TOP, BATHS } from '../parts/lake-dyed-three-times.js';

const Y = 1, C = 2, I = 4, SH = 8, PRE = 16;             // recipe bits: saffron, crimson, indigo, starboard shade, dyed before the valley
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const EXPOSURE = 1;
// (round 13) the nine wing horses of the horse edition are HORSE_GROW times as large as the gap size set below (a number tuned
// on the whole field, for no still), and their whole run is scaled with them: every length in metres that places one (the
// offsets from the sheet's inner edge, the spacings, the metres of the jit draw, the run speed, the sway, the lift above the
// fold, the wader's depth) is the earlier number times HORSE_GROW; the start times, the stride rate, the draws and the clocks
// are unchanged, so each horse's place against its sheet's inner edge and the fold, counted in horse lengths, is what it was.
// The wing meadow they are gaps in stands taller with them; the spits' three and the other casts are unchanged
const HORSE_GROW = 1.5;

// the four grounds: silk, saffron, crimson, indigo, flame, green, aubergine; and the air between the sheets
const GROUNDS = {
  sunrise: { palette: ['#F4ECDD', '#E9A81C', '#B8252E', '#1F3A6E', '#DB5A1E', '#4F7A3C', '#47213F'], air: '#E3D8C6' },
  golden: { palette: ['#EDD9A8', '#D8930E', '#9E2622', '#27345C', '#BF4E16', '#5E6A28', '#41202C'], air: '#D9C492' },
  day: { palette: ['#F4ECDD', '#E9A81C', '#B8252E', '#1F3A6E', '#DB5A1E', '#4F7A3C', '#47213F'], air: '#E3D8C6' },
  night: { palette: ['#B4BFCB', '#D9AC3C', '#9A2A3C', '#182B5C', '#C25C2C', '#3C6E4C', '#332044'], air: '#98A3B3' },
};

// a growable list of threads (20 floats each, the hero's packThread layout)
function threadList(cap = 2048) {
  const L = { a: new Float32Array(cap * 20), n: 0 };
  L.push = (t) => {
    if ((L.n + 1) * 20 > L.a.length) { const b = new Float32Array(L.a.length * 2); b.set(L.a); L.a = b; }
    packThread(L.a, L.n++, t);
  };
  return L;
}

export default {
  id: 'lake-dyed-three-times',
  name: 'The Lake Dyed Three Times',
  category: 'wilderness',
  weirdness: 0.25,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {};
    const detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1), dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();

    // ---------- the edition: ground and hour, season, weather, cast, and the rare shift ----------
    const vr = rng.fork('edition');
    const hour = vary.hour === 'golden' ? 'golden' : vary.hour === 'day' ? 'day' : vary.hour === 'night' ? 'night' : 'sunrise';
    const season = (() => { const q = vr(); return q < 0.22 ? 'first-snow' : q < 0.5 ? 'early' : 'late'; })();
    let weather = (() => { const q = vr(); return q < 0.27 ? 'mist' : q < 0.55 ? 'breezy' : 'still'; })();
    let cast = (() => { const q = vr(); return q < 0.26 ? 'horses' : q < 0.5 ? 'swans' : 'storks'; })();
    if (vary.rare) { weather = 'still'; cast = 'storks'; }   // the shift is an edition of its own: a still mirror (the chevrons are doubled exactly) and storks on the broken mountain
    const rare = !!vary.rare;
    const ground = GROUNDS[hour];
    scene.userData.edition = { hour, season, weather, cast, rare };
    const style = makeStyle({ palette: ground.palette, exposure: EXPOSURE, air: ground.air });
    const U = style.uniforms;
    // the order of the baths for this hour (the shader takes start, rise, knee, accel per dye)
    // (the far massif is dipped early, uEarly seconds per bath, so the mountain stands in its tiers while the lake is in open view)
    if (hour === 'day') { U.uBath.value[0].set(-60, 2.2, 6, 3); U.uBath.value[1].set(-22, 4, 2.5, 11); U.uBath.value[2].set(5, 3, 13, 5); U.uEarly.value.set(0, 0, 12); U.uEarlyNear.value = 0; }
    if (hour === 'night') { U.uBath.value[2].set(...BATHS[0]); U.uBath.value[0].set(...BATHS[2]); U.uEarly.value.set(16, 24, 22); }
    U.uSettle.value = 2.2;
    U.uFoot.value.x = season === 'early' ? 7 : season === 'first-snow' ? 10 : 13;   // the madder tide mark: low in early October, full in late
    U.uCast.value = cast === 'horses' ? 1 : cast === 'swans' ? 2 : 0;
    U.uStorkSize.value = cast === 'horses' ? 21 : cast === 'swans' ? 18 : 18;
    U.uHorseGrow.value = cast === 'horses' ? HORSE_GROW : 1;   // the nine band gaps and their twins only (the part's loop index under 9); 1 in every other edition

    const stage = new THREE.Group(); stage.name = 'valley-of-hung-sheets';
    stage.position.set(0, 0, 1000); stage.rotation.y = Math.PI; scene.add(stage);
    await ctx.yield();
    const hero = await buildHero(ctx, { style, detail, exposure: EXPOSURE, season, weather: weather === 'breezy' ? 'breezy' : 'still', shift: rare, cast: 'world', airRadius: 4200, skyCover: 0.15, skyShare: 0.012 });
    stage.add(hero.object);
    stage.updateMatrixWorld(true);
    await ctx.yield();
    const A = hero.anchors;

    // ---------- the path: the hero's safe line, in the world's course ----------
    const toWorld = (v) => new THREE.Vector3(-v.x, v.y, 1000 - v.z);
    // level over the shore and the open lake, then (the crimson bath) drifting 25 m to port and rising over the grove tips while the
    // course swings back toward the mountain, which stands a little to starboard: the massif dead ahead above the groves
    // (polish pass 3) LOW AND LEVEL to the head of the lake: 5 to 9 m above the fold, so the mountain and its twin are the same
    // size and the fold lies across the middle of the frame; the last seven wings stand back round an open basin
    // (polish pass 4) FIVE PICTURES ON THE LAKE. After the shore the course swings out to starboard and runs back toward the
    // port bank while the gaze turns to it (the red and gold shore sliding past, side on); then a low skim, 2 m over the fold,
    // past stands of dyed withies at arm's length; one rise to 28 m, the doubled valley lying below; and down to 9 m, facing
    // the mountain, for the 18 s image
    const line = [[0, 5, 1000], [0, 5, 945], [12, 4.6, 905], [26, 4.2, 868], [20, 3.6, 830], [2, 3, 790], [-9, 2.3, 760], [-12, 2.8, 738], [-12.5, 10, 708], [-11, 21, 678],
      [-9, 27.5, 648], [-6, 26, 615], [-3, 18, 580], [-1.5, 11.5, 548], [-1, 9.2, 515], [-1, 9, 465], [-1, 9.6, 420], [0, 17, 365],
      [0, 41.8, 300], [0, 99.5, 200], [0, 157.3, 100], [0, 180.4, 60], [0, 215, 0]];
    const path = makePath(line.map((p) => toWorld(new THREE.Vector3(p[0], p[1], p[2]))));
    const _p = new THREE.Vector3(), _t = new THREE.Vector3();
    // the path's x and y in sheet space where it crosses sheet z (sampled once)
    const pathAtZ = (() => {
      const N = 400, xs = new Float32Array(N + 1), ys = new Float32Array(N + 1), zs = new Float32Array(N + 1);
      for (let i = 0; i <= N; i++) { path.pointAt(i / N, _p); xs[i] = -_p.x; ys[i] = _p.y; zs[i] = 1000 - _p.z; }
      return (z) => { let i = 0; while (i < N - 1 && zs[i + 1] > z) i++; const f = clamp((zs[i] - z) / Math.max(zs[i] - zs[i + 1], 1e-4), 0, 1); return { x: xs[i] + (xs[i + 1] - xs[i]) * f, y: ys[i] + (ys[i + 1] - ys[i]) * f, u: (i + f) / N }; };
    })();
    await ctx.yield();

    // ---------- hanging a sheet: threads asked from a picture function, exactly as the massif is hung ----------
    const rec = { x: 0, z: 0, geoTop: 0, picTop: 0, h: [0, 0, 0, 0], r: [0, 0, 0, 0], slip: 0, lag: 0, phase: 0, level: 0, pitch: 0, bundleDx: 0, delay: 0, gustAt: 0 };
    let steps = 0;
    const breezy = weather === 'breezy' ? 1.3 : 1;
    /** hang threads from x0 to x1 in sheet z. pic(x, out) fills out.T, out.h[4], out.r[4] (or returns false: no thread).
     *  o: { pitch, slip, sky (share of threads that run on to the top bar), slit (half width, for parting lists), delay } */
    async function hang(list, z, x0, x1, pic, o, r) {
      const n = Math.max(1, Math.floor((x1 - x0) / o.pitch)), out = { T: 0, h: rec.h, r: rec.r, delay: undefined };
      const delay = o.delay ?? 2.5 * clamp(1 - z / 1000, -0.6, 1), gustAt = 26.6 + z * 0.0035;
      // a thread that survives to a sparser hanging is jittered by that hanging's spacing, so the survivors of one sheet
      // never stand in a regular comb over the next (regular combs beat into fringes); then the picture is read in order
      const cand = new Float64Array(n * 5), order = new Array(n);
      for (let i = 0; i < n; i++) {
        const jit = Math.min(Math.pow(2, keepLevel(i + 1)), 14) * 0.9;
        cand[i * 5] = clamp(x0 + (i + 0.5 + (r() - 0.5) * jit) * o.pitch, x0 + 0.01, x1 - 0.01);
        cand[i * 5 + 1] = r(); cand[i * 5 + 2] = r(); cand[i * 5 + 3] = r(); cand[i * 5 + 4] = r(); order[i] = i;
        if ((++steps & 127) === 0) await ctx.yield();
      }
      order.sort((p, q) => cand[p * 5] - cand[q * 5]);
      await ctx.yield();
      for (let oi = 0; oi < n; oi++) {
        const i = order[oi], x = cand[i * 5], lag = cand[i * 5 + 1], sl = cand[i * 5 + 2], ph = cand[i * 5 + 3], sky = cand[i * 5 + 4] < (o.sky ?? 0.08);
        if ((++steps & 31) === 0) await ctx.yield();
        if (o.skip && o.skip(x)) continue;
        const skyOk = Math.abs(x + 10 - 0.08 * (600 - z)) > Math.max(70, 0.42 * (640 - z));   // no bare thread hangs in the window on the mountain and its twin
        out.delay = undefined;
        if (pic(x, out) === false) continue;
        rec.x = x; rec.z = z; rec.picTop = out.T;
        rec.slip = (sl - 0.5) * 2 * o.slip * breezy;
        rec.geoTop = sky && skyOk ? SKY_TOP : out.T + o.slip * 8 + 6;
        rec.lag = 0.1 + 0.7 * lag * lag + 0.25 * (0.5 + 0.5 * noise.n2(x * 0.03, z * 0.13));
        rec.phase = ph; rec.level = keepLevel(i + 1); rec.pitch = o.fine ?? o.pitch; rec.bundleDx = o.slit ?? 0; rec.delay = out.delay ?? delay; rec.gustAt = gustAt;
        list.push(rec);
      }
    }
    const lists = { plain: threadList(32768), curtain: threadList(2048), spur: [threadList(512), threadList(512), threadList(512)], gauze: threadList(2048) };
    const hash = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7 + 17.3) * 43758.5453; return v - Math.floor(v); };
    const flame = season === 'early' ? 0.18 : 0.5;         // share of poplars dyed yellow under crimson

    // ---------- what the pictures are made of ----------
    // a row of Lombardy poplars: lancets with dead-straight sides, each split light | deep down its middle
    const poplarRow = (r, groves, a0, a1, tall = 1) => {
      const P = [];
      for (let g = 0; g < groves; g++) {
        const gx = r.range(a0, a1), cnt = Math.round(r.int(14, 34) * dens), gw = cnt * r.range(6.5, 9);
        for (let i = 0; i < cnt; i++) {
          const q = r(), recipe = q < 0.33 ? Y : q < 0.33 + flame ? Y | C : C;
          P.push({ x: gx + (i / cnt - 0.5) * gw + r.range(-2, 2), w: r.range(3.6, 4.7) * tall, h: r.range(30, 45) * tall, rec: recipe });
        }
      }
      P.sort((p, q) => p.x - q.x);
      let pi = 0, last = -1e9;
      return (a, o) => {                                   // -> raises o.h1 / o.r0 where a poplar stands (ascending a)
        if (a < last) pi = 0; last = a;
        while (pi < P.length - 1 && P[pi].x + P[pi].w < a - 12) pi++;
        for (let j = pi; j < P.length && P[j].x - P[j].w <= a; j++) {
          const p = P[j], dx = (a - p.x) / p.w;
          if (Math.abs(dx) < 1) { const hp = p.h * (1 - 0.5 * Math.pow(Math.abs(dx), 1.7)); if (hp > o.h1) { o.h1 = hp; o.r0 = p.rec | (dx > 0 ? SH : 0); } }
        }
      };
    };
    // a LINE of poplars for the wing sheets: the ikat flame, each lancet standing clear of its neighbours (about twice its
    // width apart, white silk between), in runs of five to ten with a break before the next run; heights vary by half;
    // the tip feathers away thread by thread
    const poplarLine = (r, a0, a1, tall = 1, long = false) => {
      const P = [];
      // the first run stands at the sheet's inner edge, where no nearer sheet hangs in front of it: six to ten flames that
      // can be counted; further out (behind the nearer banks, seen through their bare silk) the runs are short and far apart
      let a = a0 + r.range(0, 8), first = true;
      while (a < a1) {
        const runRec = long ? (() => { const q = r(); return q < 0.33 ? Y : q < 0.33 + flame ? Y | C : C; })() : 0;   // (long: the whole row is tied for one dye)
        const run = long ? r.int(5, 9) : first ? Math.max(4, Math.round(r.int(6, 10) * Math.min(dens, 1.1))) : Math.max(2, Math.round(r.int(2, 5) * dens));   // (long: a spur's face, row after row)
        for (let i = 0; i < run && a < a1; i++) {
          const q = r(), recipe = long ? runRec : q < 0.33 ? Y : q < 0.33 + flame ? Y | C : C, w = r.range(3.6, 4.6) * tall;
          P.push({ x: a, w, h: r.range(28, 48) * tall * (i === 0 || i === run - 1 ? 0.8 : 1), rec: recipe });
          a += w * r.range(3.3, 4.7);
        }
        a += long ? r.range(26, 60) : first ? r.range(50, 90) : r.range(70, 150); first = false;
      }
      let pi = 0, last = -1e9;
      return (a, o) => {
        if (a < last) pi = 0; last = a;
        while (pi < P.length - 1 && P[pi].x + P[pi].w < a - 12) pi++;
        for (let j = pi; j < P.length && P[j].x - P[j].w <= a; j++) {
          const p = P[j], dx = (a - p.x) / p.w;
          if (Math.abs(dx) < 1) {
            const ax = Math.abs(dx), hp = p.h * (1 - 0.36 * ax * ax * ax) - hash(Math.floor(a * 9.3), 71) * 6 * (1 - ax * 0.5);   // dead-straight sides for two thirds of its height, an ogive above, the tip feathered
            if (hp > o.h1) { o.h1 = hp; o.r0 = p.rec | (dx > 0 ? SH : 0); }
          }
        }
      };
    };
    // ridge teeth along a sheet: 0 in the gully, 1 on the ridge, starboard of the apex is the deep side
    const teethRow = (r, a0, a1, wMin, wMax) => {
      const T = []; let x = a0;
      while (x < a1) { const w = r.range(wMin, wMax); T.push({ a: x, b: x + w, apex: x + w * r.range(0.3, 0.62), h: r.range(0.4, 1), g: r.range(0.08, 0.16) }); x += w; }
      let ti = 0, last = -1e9;
      return (a, o) => {
        if (a < last) ti = 0; last = a;
        while (ti < T.length - 1 && a >= T[ti].b) ti++;
        const t = T[ti];
        o.tent = clamp(a < t.apex ? (a - t.a) / (t.apex - t.a) : (t.b - a) / (t.b - t.apex), 0, 1) * t.h;
        o.deep = a > t.apex ? SH : 0; o.gully = o.tent < t.g ? 1 : 0;
      };
    };
    const snowline = season === 'first-snow' ? 450 : 700;
    // the slope above a foot band: spruce spires (green once indigo crosses yellow), blue slope, aubergine gullies
    const slope = (a, T, seed, sp, o, out, lineK = 0.5, footH = 0, pre = 0) => {
      if (footH > 0) {                                     // a wing: lancets | undyed silk to the foot of the wood | spruce | slope
        const sj = Math.floor(a / sp), su = a / sp - sj, stepsN = 3 + Math.floor(hash(sj, seed) * 2);
        const spire = (1 - Math.floor(Math.abs(su - 0.5) * 2 * stepsN) / stepsN) * (10 + 16 * hash(sj, seed + 3)) * (sp / 14);
        out.T = Math.max(T, o.h1);
        const hW = Math.max(o.h1, Math.min(out.T, footH)), h2 = Math.max(hW, Math.min(out.T, hW + (out.T - hW) * lineK * (0.8 + 0.2 * o.tent) + spire * (out.T > hW + 4 ? 1 : 0)));
        out.h[0] = o.h1; out.h[1] = hW; out.h[2] = h2; out.h[3] = out.T;
        out.r[0] = o.r0; out.r[1] = 0; out.r[2] = pre | Y | I | (su > 0.5 ? SH : 0); out.r[3] = pre | (o.gully ? C | I : I | o.deep);
        return;
      }
      const sj = Math.floor(a / sp), su = a / sp - sj, stepsN = 3 + Math.floor(hash(sj, seed) * 2);
      const spire = (1 - Math.floor(Math.abs(su - 0.5) * 2 * stepsN) / stepsN) * (10 + 16 * hash(sj, seed + 3)) * (sp / 14);
      const lineH = T * lineK * (0.8 + 0.2 * o.tent) * (hash(sj, seed + 5) < 0.14 ? 0.7 : 1);
      const h2 = Math.max(o.h1, Math.min(T, lineH + spire));
      const snow = snowline + Math.round((hash(Math.floor(a / 18), seed + 7) - 0.5) * 6) * 11 + (o.gully ? 30 : 0);
      out.T = Math.max(T, o.h1);
      out.h[0] = o.h1; out.h[1] = h2; out.h[2] = Math.max(h2, Math.min(T, T * 0.82 + (o.gully ? -18 : 0))); out.h[3] = Math.min(out.T, Math.max(out.h[2], snow));
      out.r[0] = o.r0; out.r[1] = pre | Y | I | (su > 0.5 ? SH : 0);
      out.r[2] = pre | (o.gully ? C | I : I | o.deep); out.r[3] = pre | (o.gully ? C | I | SH : I | (o.tent > 0.55 ? 0 : o.deep));
    };

    // ---------- the shore: four reed curtains, 120 m wide and 30 m tall, the eye parts each one ----------
    const CURT_Z = [986, 972, 957, 941], SLIT_C = 2.3, SLIT_0 = 3.8, REEDK = [0.75, 0.85, 0.95, 1.05];
    {
      const r = rng.fork('curtains');
      for (let c = 0; c < 4; c++) {
        const z = CURT_Z[c], sd = c * 7.3, d = 1000 - z;
        // seen from the shore the four curtains leave a window on the axis: the first is bowed open by its parting (SLIT_0, the
        // shader holds it open before we come), the three behind are swagged low between two high shoulders, so the white
        // massif stands in bare air from the saffron band to the top of the frame
        const low = 5 + 0.08 * d, hw = 0.4 * d;
        let reedPass = false;
        const pic = (x, out) => {
          // reeds: tufts in clumps at the curtain's foot (not a ruled row): half the cells are bare thread
          const cw = 2.9, j = Math.floor(x / cw + sd), q = hash(j, 31 + c);
          let reed = 0;
          if (q < 0.56) {
            const cx = (j - sd + 0.3 + 0.4 * hash(j, 33 + c)) * cw, half = 0.55 + 0.75 * hash(j, 35 + c), dx = (x - cx) / half;
            if (Math.abs(dx) < 1) reed = (2.1 + 2.2 * hash(j, 37 + c)) * REEDK[c] * (1 - dx * dx * 0.7) * (0.62 + 0.38 * hash(Math.floor(x * 11.7), 39 + c));
          }
          const full = 23 + 6 * noise.n2(x * 0.05, sd) + 2.5 * hash(Math.floor(x / 0.6), 5);
          out.T = c === 0 ? full : low + (full - low) * sstep(hw * 0.75, hw * 1.5, Math.abs(x)) + 1.6 * hash(Math.floor(x / 0.45), 9 + c);
          if (!reedPass) {                                    // the curtain itself is bare silk; its reeds are hung by themselves, close-set, a finger in front
            // ... but the threads we part (within 8 m of the slit) are taking the first bath as we come: saffron stands a little
            // above the eye at the crossing and climbs them, pale at its front, deep on the starboard side of the slit
            const climb = Math.abs(x) < (c === 0 ? 7 : 9) + 3 * hash(Math.floor(x / 0.35), 77 + c) ? out.T + 6 : 0;
            out.h[0] = climb; out.h[1] = climb; out.h[2] = climb; out.h[3] = climb;
            out.r[0] = Y | (x > 0 ? SH : 0); out.r[1] = 0; out.r[2] = 0; out.r[3] = 0;
            if (climb > 0) out.delay = 60;                    // (the thread shader strikes these as the eye comes)
            return;
          }
          else { if (reed <= 0.3) return false; out.T = reed; }
          out.h[0] = reed; out.h[1] = reed; out.h[2] = reed; out.h[3] = reed;
          out.r[0] = (q < 0.22 ? Y | I : Y) | (x > (j - sd + 0.5) * cw ? SH : 0); if (q < 0.22) out.delay = -40;   // two clumps in five are green from the start (dyed before the valley) out.r[1] = 0; out.r[2] = 0; out.r[3] = 0;
        };
        // hung sheer: threads 18 cm apart but drawn as fine as an 8 cm sett, so the valley shows through all four
        // hung sheer (one part silk in eight): four of them one behind another still leave the valley, its groves and its mirror plain
        const W = c === 0 ? SLIT_0 : SLIT_C, o = { pitch: 0.18 / detail, slip: 0.28, sky: 0.02, fine: 0.05 }, R = c === 0 ? W * 5 : W * 8;   // (the shader bows a reed curtain's threads within 8 slits of the eye's line)
        await hang(lists.plain, z, -60, -R, pic, o, r);
        await hang(lists.curtain, z, -R, R, pic, { ...o, pitch: 0.13 / Math.sqrt(detail), fine: 0.036, slit: W }, r);
        await hang(lists.plain, z, R, 60, pic, o, r);
        reedPass = true;
        const oR = { pitch: 0.12 / detail, fine: 0.12 / detail * 1.6, slip: 0.28, sky: 0 };
        await hang(lists.plain, z + 0.1, -60, -R, pic, oR, r);
        await hang(lists.curtain, z + 0.1, -R, R, pic, { ...oR, pitch: 0.1 / Math.sqrt(detail), fine: 0.16 / Math.sqrt(detail), slit: W }, r);
        await hang(lists.plain, z + 0.1, R, 60, pic, oR, r);
        await ctx.yield();
      }
    }

    // ---------- the lake: sixteen wing sheets of poplar bank, eight a side, alternately port and starboard ----------
    const wings = [];
    const castMeadowAt = (k) => (cast === 'horses' ? ((k >= 12 && k <= 15) || k === 4 ? 25 * HORSE_GROW : 0) : cast === 'swans' ? (k >= 2 && k <= 10 ? 11 : 0) : 0);   // a resist gap needs dyed cloth to be a gap in: the meadow stands taller for horses (25 m times HORSE_GROW: a horse's head and back inside dyed cloth) and swans (11 m)
    {
      const r = rng.fork('wings');
      for (let k = 0; k < 16; k++) {
        const side = k % 2 ? 1 : -1;                        // port first (-x)
        const z = 918 - k * 35.5 + r.range(-5, 5) + (k === 4 ? 24 : 0), pa = pathAtZ(z);        // (wing 4, port: the shore of the side-on run, 35 m ahead of the eye at 6.4 s)
        const gap = k === 4 ? r.range(8, 26) * 0 + 9 : k < 2 ? r.range(20, 30) : r.range(8, 26) + (k % 5 === 3 ? 14 : 0);
        const w = r.range(300, 500), H = r.range(60, 160) * (0.75 + 0.25 * k / 15), xin = Math.max(pa.x * side + gap, k >= 9 ? 0.75 * (0.4 * (620 - z) + 14) : 0);   // inner edge, measured outward (the basin: wings 9 on stand back)
        const hasFarm = side < 0 && (k === 6 || k === 8 || k === 10);
        // THE BASIN: from wing 9 on the banks stand back from the line of sight (their poplars and their rise begin outside a
        // cone of about 22 degrees from the eye at 14 s), so the head of the lake is open water: mountain above, twin below
        const basin = k >= 9 ? Math.max(0, 0.4 * (620 - z) + 14 - xin) : 0, rise0 = Math.max(26, basin);
        const wr = r.fork('w' + k), pop = poplarLine(wr, Math.max(hasFarm ? 38 : 16, 16 + Math.max(0, k - 8) * 9, basin), w * 0.9), teeth = teethRow(wr, -20, w + 40, 34, 90);
        const farm = hasFarm ? { a: wr.range(9, 16), w: wr.range(9, 14), h: wr.range(7, 9.5) } : null;
        const castMeadow = castMeadowAt(k);
        const wil = wr.range(0, 40), o = { h1: 0, r0: 0, tent: 0, deep: 0, gully: 0 };
        const pic = (x, out) => {
          const a = x * side - xin;
          if (a < 0) return false;
          teeth(a, o); if (side < 0) o.deep = o.deep ? 0 : SH;
          o.h1 = 0; o.r0 = Y;
          // (round 16) the horses' tall meadow feathers away toward its sheet's inner edge as a poplar's tip does, thread by thread: over
          // the first 24 m from the edge (18 to 30 m, as the noise shifts a run of threads by up to 6 m) its top steps down to six tenths
          // of its height: 22.5 m, a horse's back (21 m), so that a horse leaving the edge keeps cloth behind its body. It ended there in
          // one razor edge 37.5 m tall, which strangers read as a pane across the lake (four of four on the usual stills). Three typed
          // numbers: 24 and 6 set on the whole field, 0.6 from the horse's own height; none tuned for a still
          const mh = Math.max(4.5 + 2.5 * noise.n2(a * 0.02, z), castMeadow * sstep(230, 180, a) * (cast === 'horses' ? 0.6 + 0.4 * sstep(0, 24, a + 6 * noise.n2(a * 0.3, z + 3)) : 1) + 1.2 * noise.n2(a * 0.05, z + 9)); if (mh > o.h1) { o.h1 = mh; o.r0 = Y; }   // the saffron meadow
          const wj = Math.floor((a + wil) / 31), wc = (wj + 0.3 + 0.4 * hash(wj, k)) * 31 - wil, wd = (a - wc) / (6 + 4 * hash(wj, k + 9));
          const T = 6 + (H - 6) * sstep(rise0, rise0 + w * 0.46 - 26, a) * (1 - 0.4 * sstep(w * 0.55, w, a)) * (0.8 + 0.2 * o.tent) * (1 + 0.08 * noise.n2(a * 0.011, z * 0.7));
          slope(a, T, k * 11, 13, o, out, 0.5, 16 + 5 * noise.n2(a * 0.017, z * 0.31) + 4 * hash(Math.floor(a / 13), k + 21), PRE);   // (pass 3: a low bank of silk, then the wood: the gold flames stand against green and indigo)   // the woods above the banks were dyed before the valley: green spires, indigo slopes from the first frame
        };
        const x0 = side > 0 ? xin : -(xin + w), x1 = side > 0 ? xin + w : -xin;
        await hang(lists.plain, z, x0, x1, pic, { pitch: 0.25 / detail, fine: 0.25 / detail * 1.75, slip: 0.5 + 0.5 * (1 - z / 1000), sky: 0.003 }, wr);   // nearly close-set: a flat owns its pixels (half cover made every dyed band a barcode over the flats behind)
        // the poplars are hung by themselves, a hand in front of their bank and nearly close-set (cover 0.85), so each flame is
        // a shape with razor sides and not a comb the groves behind show through; they end at their own feathered tips
        const picPop = (x, out) => {
          const a = x * side - xin;
          if (a < 0) return false;
          o.h1 = 0; o.r0 = 0; pop(a, o);
          if (side < 0) o.r0 ^= SH;                                                              // port sheets are measured the other way: the deep half stays to starboard
          if (k <= 8 && (o.r0 & 7) === C) out.delay = -40;                                       // on the lower lake the madder-alone flames were dyed before the valley: a red and gold shore from the first frame
          // willows at the water (low green domes) and the farmhouses (plain blocks of madder) were dyed before the valley:
          // green and crimson stand on the banks from the first frame
          const wj = Math.floor((a + wil) / 31), wc = (wj + 0.3 + 0.4 * hash(wj, k)) * 31 - wil, wd = (a - wc) / (6 + 4 * hash(wj, k + 9));
          if (hash(wj, k + 2) < 0.6 && Math.abs(wd) < 1) { const hw = (7 + 5 * hash(wj, k + 4)) * Math.sqrt(1 - wd * wd); if (hw > o.h1) { o.h1 = hw; o.r0 = Y | I | (wd * side > 0 ? SH : 0); out.delay = -40; } }
          if (farm && a > farm.a && a < farm.a + farm.w) { const fq = (a - farm.a) / farm.w; o.h1 = farm.h * (1 + 0.28 * (1 - Math.abs(fq * 2 - 1))); o.r0 = C | ((fq < 0.5) === (side < 0) ? SH : 0); out.delay = -40; }
          if (o.h1 <= 0) return false;
          out.T = o.h1; out.h[0] = o.h1; out.h[1] = o.h1; out.h[2] = o.h1; out.h[3] = o.h1; out.r[0] = o.r0; out.r[1] = 0; out.r[2] = 0; out.r[3] = 0;
        };
        await hang(lists.plain, z + 0.25, x0, x1, picPop, { pitch: 0.25 / detail, fine: 0.25 / detail * 1.9, slip: 0.5 + 0.5 * (1 - z / 1000), sky: 0 }, wr);
        wings.push({ z, side, xin, w, H, farm });
        await ctx.yield();
      }
    }

    // ---------- stands of dyed withies in the shallows: the low skim passes them at arm's length ----------
    // each a solid body of close-set threads (9 cm apart) with razor sides and a top that feathers thread by thread, dyed before
    // the valley in its own tiers (a green foot, a saffron or crimson body, a crown of flame, crimson or gold), doubled in the fold
    {
      const r = vr.fork('stands'), o = { pitch: 0.1 / Math.sqrt(detail), fine: 0.2 / Math.sqrt(detail), slip: 0.45, sky: 0 };
      //            z, side, off the course, width, height, body, crown
      const ST = [[786, 1, 7, 6, 10, Y, C], [764, -1, 6, 7, 9, C, Y | C], [718, 1, 17.2, 12.5, 17, Y, Y | C], [722, -1, 5, 9, 12.5, Y | C, C], [684, 1, 26.2, 6.6, 17, C, Y], [690, -1, 9, 8, 17, Y, C]];
      // (pass 5) the starboard stands are bodies that can be taken in from the skim at 10 s (u 0.25): the nearer one a quarter of
      // the frame wide, its razor inner side against the open lake and its feathered top inside the frame; the next one smaller,
      // further up the lake and nearer the axis, a strip of lake between them; the middle of the frame is the mountain's
      for (let i = 0; i < ST.length; i++) {
        const [z, side, off, w, H, body, crown] = ST[i], cx = pathAtZ(z).x + side * (off + w * 0.5), hw = w * 0.5, Hs = H * r.range(0.92, 1.1);
        const pic = (x, out) => {
          const dx = (x - cx) / hw, ax = Math.abs(dx);
          if (ax >= 1) return false;
          const T = Hs * (1 - 0.55 * ax * ax * ax) * (0.74 + 0.26 * hash(Math.floor(x * 9.7), 91 + i));
          const sh = dx > 0 ? SH : 0;
          out.T = T; out.h[0] = T * (0.13 + 0.08 * hash(Math.floor(x * 3.1), 93 + i)); out.h[1] = T * (0.66 + 0.14 * hash(Math.floor(x * 5.3), 95 + i)); out.h[2] = T; out.h[3] = T;
          out.r[0] = Y | I | sh; out.r[1] = body | sh; out.r[2] = crown | sh; out.r[3] = crown | sh; out.delay = -40;
        };
        await hang(lists.plain, z, cx - hw, cx + hw, pic, z === 718 || z === 684 ? { ...o, fine: o.fine * 1.3 } : o, r);   // (the two seen whole from the skim are hung close: bodies, not combs)
      }
      await ctx.yield();
    }

    // ---------- six sheets of valley wall beyond the wings, 400 to 700 m tall ----------
    {
      const r = rng.fork('walls'), WZ = [800, 480, 160, -180, -520, -880];
      for (let k = 0; k < 6; k++) {
        const side = k % 2 ? -1 : 1, z = WZ[k] + r.range(-30, 30), H = r.range(400, 700) * (k < 2 ? 0.8 : 1), xin = r.range(330, 470) + (k > 2 ? 120 : 0), w = 1150;
        const wr = r.fork('v' + k), teeth = teethRow(wr, -40, w + 80, 70, 190), o = { h1: 0, r0: 0, tent: 0, deep: 0, gully: 0 };
        const shoulder = wr.range(0.3, 0.6);
        const pic = (x, out) => {
          const a = x * side - xin;
          if (a < 0) return false;
          teeth(a, o); if (side < 0) o.deep = o.deep ? 0 : SH;
          o.h1 = 0; o.r0 = Y;
          const rise = sstep(0, 560, a) * (1 - 0.25 * sstep(700, w, a)) + 0.16 * Math.exp(-Math.pow((a - w * shoulder) / 120, 2));
          const T = 30 + (H - 30) * Math.min(rise, 1) * (0.76 + 0.24 * o.tent) * (1 + 0.07 * noise.n2(a * 0.004, z * 0.01));
          slope(a, T, 50 + k * 13, 26 + k * 3, o, out, 0.34, 0, PRE);
        };
        const x0 = side > 0 ? xin : -(xin + w), x1 = side > 0 ? xin + w : -xin;
        await hang(lists.plain, z, x0, x1, pic, { pitch: (1.0 + k * 0.16) / detail, fine: (1.0 + k * 0.16) / detail * 1.6, slip: 3 + k * 0.7, sky: 0.004, delay: 2.5 + Math.max(0, -z) / 1400 * 1.6 }, wr);
        await ctx.yield();
      }
    }

    // ---------- three spurs across the whole valley; the climb goes through each one ----------
    const SPUR = [{ z: 300, H: 120 }, { z: 200, H: 200 }, { z: 100, H: 260 }], SLIT_S = 4.5, AXIS_H = [28, 42, 56], TOWER = 31;
    {
      const r = rng.fork('spurs');
      for (let k = 0; k < 3; k++) {
        const S = SPUR[k], pa = pathAtZ(S.z); S.yc = pa.y; S.u = pa.u;
        // each spur dips low and wide on the axis (the massif stands whole above it from the lake) and carries, on the axis, the
        // tower the eye will part: that tower rests at the height of the dip and is hoisted late (the thread shader's uHoist)
        const axisH = AXIS_H[k], sr = r.fork('s' + k), flip = sr.sign();
        const pop = poplarRow(sr, 5 + k, 60, 1340, 1.1), near = poplarRow(sr, 2, 640, 760, k === 0 ? 1.0 : 1.2), teeth = teethRow(sr, -40, 1460, 46, 120);
        const lancets = poplarLine(sr.fork('rows'), 14, 1390, [0.8, 0.95, 1.1][k], true);
        const o = { h1: 0, r0: 0, tent: 0, deep: 0, gully: 0 };
        const crestAt = (x, a) => (axisH + (S.H - axisH) * sstep(210, 600, Math.abs(x + flip * 40)) * (1 - 0.2 * sstep(600, 700, Math.abs(x)))) * (0.84 + 0.16 * o.tent) * (1 + 0.06 * noise.n2(a * 0.008, S.z));
        // the parted tower: close groves and bracken in every dye, coloured threads at arm's length
        const pic = (x, out) => {
          const a = x + 700;
          teeth(a, o);
          o.h1 = 5 + 3 * noise.n2(a * 0.02, S.z); o.r0 = Y;
          pop(a, o); near(a, o);
          let T = crestAt(x, a);
          const flank = Math.exp(-Math.pow((Math.abs(x) - 17) / 9, 2));                      // two coloured shoulders either side of the slit
          T = Math.max(T, (S.yc + 8 + 17 * flank) * sstep(TOWER, TOWER - 8, Math.abs(x)));  // the cloth stands above the eye only where it is parted
          slope(a, T, 90 + k * 17, 15 + k * 2, o, out, 0.62);
          // the tower is a tied motif, the same either side of the slit: three stepped tiers in whole dyes, starboard half deep
          const zx = Math.abs(x) < 10.5 ? 0 : Math.abs(x) < 20.5 ? 1 : 2, sh = x > 0 ? SH : 0, tw = sstep(TOWER, TOWER - 8, Math.abs(x));
          if (tw > 0.02 && out.T > 20) {
            // (each spur's tower in its own dyes: the first hot, the second cool once the indigo has come, the third between)
            const TW = [[[Y | C, C, Y], [C | I, Y | I, Y | C], [I, C | I, Y | I]], [[Y | I, I, C | I], [I, C | I, Y | I], [C | I, Y | I, I]], [[C | I, Y | C, Y | I], [Y | C, I, C | I], [Y | I, C | I, Y | C]]][k];
            out.h[0] = out.T * (0.5 + 0.08 * zx); out.r[0] = TW[0][zx] | sh;
            out.h[1] = out.T * (0.78 + 0.05 * zx); out.r[1] = TW[1][zx] | sh;
            out.h[2] = out.T; out.h[3] = out.T; out.r[2] = TW[2][zx] | sh; out.r[3] = out.r[2];
          }
        };
        // the face either side: a meadow, a band of undyed silk, stepped spruce, then bracken, scree and larch in whole ridges
        // (each ridge one dye, split light | deep at its apex); hung nearly close-set, so the nearest spur owns its pixels
        const picFace = (x, out) => {
          const a = x + 700;
          teeth(a, o);
          o.h1 = 5 + 3 * noise.n2(a * 0.02, S.z); o.r0 = Y;
          const T = crestAt(x, a);
          slope(a, T, 90 + k * 17, 15 + k * 2, o, out, 0.45, Math.min(52 + 8 * noise.n2(a * 0.017, S.z * 0.31) + 6 * hash(Math.floor(a / 15), k + 41), T * 0.72));
          if (!o.gully) {
            if (o.tent < 0.34) out.r[3] = Y | C | o.deep;
            else if (o.tent < 0.72) out.r[3] = (o.deep ? C | I : Y) | o.deep;
          }
        };
        // and its poplars, each hung by itself a hand in front: rows of lancets in one dye each, white or meadow between them
        const picLan = (x, out) => {
          o.h1 = 0; o.r0 = 0; lancets(x + 700, o);
          if (o.h1 <= 0) return false;
          out.T = o.h1; out.h[0] = o.h1; out.h[1] = o.h1; out.h[2] = o.h1; out.h[3] = o.h1; out.r[0] = o.r0; out.r[1] = 0; out.r[2] = 0; out.r[3] = 0;
        };
        const o1 = { pitch: 0.5 / detail, fine: 0.5 / detail * 1.9, slip: 1.5 + k * 0.4, sky: 0.002 };
        await hang(lists.plain, S.z, -660, -TOWER, picFace, o1, sr);
        await hang(lists.spur[k], S.z, -TOWER, TOWER, pic, { pitch: 0.12 / Math.sqrt(detail), fine: 0.21 / Math.sqrt(detail), slip: o1.slip, sky: 0.008, slit: SLIT_S + axisH * 0.0004 }, sr);
        await hang(lists.plain, S.z, TOWER, 660, picFace, o1, sr);
        await hang(lists.plain, S.z + 0.25, -660, -TOWER - 5, picLan, { ...o1, sky: 0 }, sr);
        await hang(lists.plain, S.z + 0.25, TOWER + 5, 660, picLan, { ...o1, sky: 0 }, sr);
        S.pic = pic;
        await ctx.yield();
      }
    }
    // sky tapes above the spurs: bare warp from each spur's crest to the top bar, drawn only while the eye is near (the hero's
    // packSkyTape), so on the climb the upper half of the frame is hung silk in depths with the sheen riding up it
    const tapeArr = new Float32Array(700 * 20); let nTape = 0;
    {
      const rt = rng.fork('sky-tapes'), out = { T: 0, h: [0, 0, 0, 0], r: [0, 0, 0, 0], delay: undefined };
      for (let k = 0; k < 3; k++) {
        const S = SPUR[k], gap = [12, 11.5, 11][k], pitch = [0.6, 0.7, 0.8][k];   // (pass 4: thin and even: hung warp, never streaks)
        for (let x = -560; x < 560 && nTape < 700; x += gap * (0.8 + 0.2 * rt.range(0.4, 1.7))) {
          if (Math.abs(x) < TOWER + 1) continue;             // the parted tower stays clear (it is hoisted late)
          if (Math.abs(x + 10 - 0.08 * (600 - S.z)) < 0.2 * (640 - S.z) + 20) { rt(); continue; }   // and none hangs across the mountain as seen from the lake
          S.pic(x, out);
          packSkyTape(tapeArr, nTape++, x, S.z - 0.7, Math.max(out.T - 2, 4), pitch * (1 + 0 * rt.range(0.65, 1.4)), rt());
          tapeArr[(nTape - 1) * 20 + 15] = 1;                // (kept one level further: a fine even line from twice as far)
        }
        await ctx.yield();
      }
    }

    // ---------- mist edition: three sheets of bare gauze low over the lake, parted like the curtains ----------
    if (weather === 'mist') {
      const r = rng.fork('gauze'), GZ = [885, 665, 430];   // (pass 4: clear of the side-on run and the skim)
      for (let k = 0; k < 3; k++) {
        const z = GZ[k] + r.range(-8, 8), pa = pathAtZ(z), sd = r() * 50;
        const pic = (x, out) => {
          out.T = (6 + 4 * noise.fbm2(x * 0.012 + sd, k * 3.3, 3)) * (0.5 + 0.5 * sstep(330, 200, Math.abs(x - pa.x)));
          const hf = out.T * 0.3;                                                                // bare gauze, dyed only where it stands in the bath: it veils the grove feet and leaves the flames clear                                                                      // the gauze takes the baths: saffron, then the madder tide mark
          out.h[0] = hf; out.h[1] = hf; out.h[2] = hf; out.h[3] = hf; out.r[0] = Y; out.r[1] = 0; out.r[2] = 0; out.r[3] = 0;
        };
        const o = { pitch: 0.14 / detail, fine: 0.1, slip: 1.6, sky: 0 }, R = 18;
        await hang(lists.plain, z, pa.x - 320, pa.x - R, pic, o, r);
        await hang(lists.curtain, z, pa.x - R, pa.x + R, pic, { ...o, pitch: 0.1 / Math.sqrt(detail), slit: 3.95 }, r);
        await hang(lists.plain, z, pa.x + R, pa.x + 320, pic, o, r);
        await ctx.yield();
      }
    }

    // ---------- three spits of meadow in the shallows (the horse and swan editions; none is hung with storks, and none in the
    // night hour, when the meadow cloth takes its saffron last and a gap in white cloth cannot be seen) ----------
    // each a low band of meadow cloth across the course, 6 to 8 m tall, from 12 m to 56 m off the course's line: hung by hang() with
    // a wing's own options (l.345) and dyed as a wing's meadow is (one band of saffron to the top, the bath's: l.339)
    const spits = [];
    if (cast !== 'storks' && hour !== 'night') {
      const rSpit = ctx.core.makeRng(ctx.core.hashSeed('lake-dyed-spits:' + ctx.seed));   // the cloth's stream, by name from the seed
      const rAnimal = ctx.core.makeRng(ctx.core.hashSeed('lake-dyed-spit-animals:' + ctx.seed));   // the animals' stream: no thread draws from it
      //            z, side
      const SPIT = [[584, -1], [500, 1], [440, -1]];
      // the z of the wings and their poplars, the jetty and boat, and (below) the gauze sheets
      const taken = wings.flatMap((w) => [w.z, w.z + 0.25]).concat([wings[8].z + 0.3, wings[8].z + 0.6]);
      for (let i = 0; i < lists.curtain.n; i++) { const zc = lists.curtain.a[i * 20 + 1]; if (zc < 900 && zc !== taken[taken.length - 1]) taken.push(zc); }
      for (const [z0, side] of SPIT) {
        const z = taken.some((t) => Math.abs(t - z0) < 6) ? z0 + 8 : z0, xin = pathAtZ(z).x + side * 12;   // 8 m toward the shore when one of those is within 6 m
        const pic = (x, out) => {
          const T = 7 + 1.0 * noise.n2((x - xin) * side * 0.05, z + 9);
          out.T = T; out.h[0] = T; out.h[1] = T; out.h[2] = T; out.h[3] = T; out.r[0] = Y; out.r[1] = 0; out.r[2] = 0; out.r[3] = 0;
        };
        await hang(lists.plain, z, side > 0 ? xin : xin - 44, side > 0 ? xin + 44 : xin, pic, { pitch: 0.25 / detail, fine: 0.25 / detail * 1.75, slip: 0.5 + 0.5 * (1 - z / 1000), sky: 0.003 }, rSpit);
        // its animal's place off the course's line (a horse's middle 27.5 m, a swan's 29.5 m: the animal's whole length over the spit's own
        // band) and, drawn for each spit in order, only what the edition reads: a swan's drift speed, its sign and its phase (the ranges
        // the nine swans draw from); a horse's stance (a stride of 0.18 to 0.35) and its sign, held still
        spits.push({ z, side, x: pathAtZ(z).x + side * (cast === 'swans' ? 29.5 : 27.5), ...(cast === 'swans' ? { sp: rAnimal.range(0.25, 0.5) * (rAnimal() < 0.5 ? 1 : -1), ph: rAnimal() * 6.28 } : { st: rAnimal.range(0.18, 0.35) * (rAnimal() < 0.5 ? 1 : -1) }) });
      }
    }

    // ---------- the sheets become meshes: one material for plain strips, one (the same shader, PARTING) for the bowing ones ----------
    const mat = style.threadMaterial(), matPart = style.threadMaterial(true);
    const plainGeo = stripGeometry();
    const rowsAt = (ys) => ys.map((y) => [0, 0, y]).concat([[1, 0, 0]]);
    const curtainGeo = stripGeometry(rowsAt([1.2, 3, 4.8, 6.6, 8.6, 11, 14, 18]));
    const ownGeos = [plainGeo, curtainGeo];
    const addSheet = (list, geo, m, order, name) => {
      if (!list.n) return null;
      const mesh = makeSheetMesh(style, list.a.subarray(0, list.n * 20), list.n, geo, m);
      mesh.renderOrder = order; mesh.name = name; stage.add(mesh); return mesh;
    };
    addSheet(lists.curtain, curtainGeo, matPart, 0.1, 'curtains'); await ctx.yield();
    addSheet(lists.plain, plainGeo, mat, 0.3, 'wings-walls-spurs'); await ctx.yield();
    {
      const g = skyStripGeometry(); ownGeos.push(g);
      const mesh = makeSheetMesh(style, tapeArr.subarray(0, nTape * 20), nTape, g, mat);
      mesh.renderOrder = 0.35; mesh.name = 'spur-sky-tapes'; stage.add(mesh);
    }
    for (let k = 0; k < 3; k++) {
      const yc = SPUR[k].yc, g = stripGeometry(rowsAt([-22, -15, -9, -4.5, 0, 4.5, 9, 15, 22].map((d) => yc + d)));
      ownGeos.push(g); addSheet(lists.spur[k], g, matPart, 0.2, 'spur-parting-' + k);
    }
    await ctx.yield();

    // ---------- small life, all in the cloth's own terms ----------
    const extras = [];                                     // (dt, time, tJ, eye, camera) => void
    const D = style.dyes.table, dyeAt = (set, depth) => new THREE.Vector3(D[(set * 3 + depth) * 3], D[(set * 3 + depth) * 3 + 1], D[(set * 3 + depth) * 3 + 2]);
    const viewH = { value: 720 }, uTimeL = U.uTime, bufSize = new THREE.Vector2();

    // thread ends: 30 cm snippets of saffron and flame fall from the groves, turn, and lie on the fold (white in first snow)
    {
      const r = rng.fork('leaves'), n = Math.round(6000 * detail * dens), nRip = Math.round(2600 * detail), a0 = new Float32Array(n * 8 + nRip * 4), a1 = new Float32Array(n * 8 + nRip * 4);
      for (let i = 0; i < n; i++) {
        let x, z;
        const channel = r() >= 0.48;                         // over the open channel they mostly lie: a scatter of snippets is what makes the fold a water
        if (!channel) { const w = wings[r.int(0, 15)]; z = w.z + r.range(-16, 10); x = w.side * (w.xin + Math.pow(r(), 1.6) * 170 - 6); }
        else { z = r.range(330, 985); x = pathAtZ(z).x + r.range(-1, 1) * r.range(3, 55); }
        const y0 = r.range(10, 44), ph = r(), T = r.range(8, 17) * (channel ? 1.8 : 1), kind = r() < 0.45 ? 1 : 0, sd = r(), lie = channel ? r.range(0.62, 0.86) : r.range(0.3, 0.55);
        if ((i & 511) === 0) await ctx.yield();
        for (let m = 0; m < 2; m++) { const o = (i * 2 + m) * 4; a0[o] = x; a0[o + 1] = y0; a0[o + 2] = z; a0[o + 3] = ph; a1[o] = T; a1[o + 1] = kind; a1[o + 2] = sd; a1[o + 3] = m ? -lie : lie; }
      }
      // RIPPLES: loose ends of silk lying level on the fold, light and shaded, all the way up the lake: they foreshorten toward
      // the far shore and lengthen and shorten as the water breathes, so the fold is a surface and the lower half its mirror
      {
        const rr = rng.fork('ripples');
        for (let i = 0; i < nRip; i++) {
          const z = 300 + 690 * Math.pow(rr(), 0.8), x = pathAtZ(z).x + rr.range(-1, 1) * (60 + 210 * sstep(680, 520, z)), o = n * 8 + i * 4;
          a0[o] = x; a0[o + 1] = rr.range(1.2, 4.5); a0[o + 2] = z; a0[o + 3] = rr();
          a1[o] = 1; a1[o + 1] = rr() < 0.55 ? 2 : 3; a1[o + 2] = rr(); a1[o + 3] = 0.5;
          if ((i & 511) === 0) await ctx.yield();
        }
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aL0', new THREE.InstancedBufferAttribute(a0, 4)); g.setAttribute('aL1', new THREE.InstancedBufferAttribute(a1, 4));
      g.instanceCount = n * 2 + nRip;
      const snowy = season === 'first-snow';
      const m = new THREE.ShaderMaterial({
        uniforms: { uTime: uTimeL, uViewH: viewH, uA: { value: snowy ? U.uCotton.value : dyeAt(1, 1) }, uB: { value: snowy ? U.uSilk.value : dyeAt(3, 1) }, uC: U.uCotton, uD: { value: new THREE.Vector3(U.uLow.value.x, U.uLow.value.y, U.uLow.value.z).multiplyScalar(0.9) }, uBreath: U.uBreath },
        side: THREE.DoubleSide, fog: false, toneMapped: false,
        vertexShader: /* glsl */`
        attribute vec4 aL0, aL1;                            // (x, start height, z, phase)  (period s, kind, seed, share of the time lying; negative = the twin below)
        uniform float uTime, uViewH, uBreath;
        flat varying float vKind;
        void main(){
          float lie = abs(aL1.w), sg = aL1.w < 0. ? -1. : 1.;
          float c = fract(uTime/aL1.x + aL0.w), f = clamp(c/(1. - lie), 0., 1.);        // falling for the first part of its time, then lying
          float y = aL0.y*(1. - f)*(1. - f*0.35), ph = aL1.z*6.2832;
          float sw = (1. - f)*aL0.y*0.12;
          vec3 cpos = vec3(aL0.x + sw*sin(uTime*0.8 + ph) + uBreath*1.5*(1. - f), max(y, 0.04)*sg, aL0.z + sw*0.6*cos(uTime*0.63 + ph*1.7));
          float ang = f < 1. ? uTime*(1.2 + aL1.z*1.8) + ph : 0.2*sin(ph*3.);
          if (aL1.y > 1.5) { cpos = vec3(aL0.x + 0.9*sin(uTime*0.35 + aL0.w*6.2832) + uBreath*2.5, 0.03, aL0.z); ang = 0.; }           // turning as it falls, lying along the fold after
          ang *= sg;
          vec4 mv = modelViewMatrix*vec4(cpos, 1.);
          float px = -mv.z*2./max(projectionMatrix[1][1]*uViewH, 1.);
          float show = step(5., -mv.z)*(sg < 0. ? step(f, 0.999) : 1.)*step(px, 0.4);   // too far to be a mark: gone, not shimmering                 // the twin is one with it once it lies
          vec2 sz = vec2(max(0.42, 2.6*px), max(0.085*(f < 1. ? 0.4 + 0.6*abs(cos(uTime*2.1 + ph)) : 1.), 1.5*px))*show;
          if (aL1.y > 1.5) {                                // a ripple: a level dash on the fold, never under five pixels long; fewer with distance
            float keep = step(px, 0.22 + 2.4*aL1.z*aL1.z)*step(4., -mv.z);
            sz = vec2(min(max(aL0.y*(0.6 + 0.4*sin(uTime*(0.6 + aL1.z) + ph*3.)), 5.*px), 34.*px), max(0.05, 1.4*px))*keep;
          }
          vec2 q = position.xy*sz; float ca = cos(ang), sa = sin(ang);
          mv.xy += vec2(q.x*ca - q.y*sa, q.x*sa + q.y*ca);
          vKind = aL1.y;
          gl_Position = projectionMatrix*mv;
        }`,
        fragmentShader: /* glsl */`
        uniform vec3 uA, uB, uC, uD; flat varying float vKind;
        void main(){ gl_FragColor = vec4(vKind > 2.5 ? uD : vKind > 1.5 ? uC : vKind > 0.5 ? uB : uA, 1.); }`,
      });
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 0.05; mesh.name = 'thread-ends'; stage.add(mesh);
    }
    await ctx.yield();

    // knots on the fold: nine mallard (aubergine), the moored boat (a crimson lozenge and its twin) and the jetty's posts
    const knotGeo = new THREE.BufferGeometry();
    knotGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, -0.16, 0.5, 0, 0.12, 0.4, 0, 0.5, 0, 0, 0.12, -0.4, 0, -0.16, -0.5, 0], 3)); knotGeo.setIndex([0, 2, 1, 0, 3, 2, 0, 4, 3, 0, 5, 4]);
    const knotMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, fog: false, toneMapped: false,
      vertexShader: /* glsl */`attribute vec3 aCol; flat varying vec3 vC; void main(){ vC = aCol; gl_Position = projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position, 1.); }`,
      fragmentShader: /* glsl */`flat varying vec3 vC; void main(){ gl_FragColor = vec4(vC, 1.); }`,
    });
    const NK = 9 + 1 + 7, knots = new THREE.InstancedMesh(knotGeo, knotMat, NK), kcol = new Float32Array(NK * 3);
    knots.frustumCulled = false; knots.renderOrder = 0.04; knots.name = 'knots-on-the-fold'; stage.add(knots);
    const aub = dyeAt(6, 1), crim = dyeAt(2, 1), aubDeep = dyeAt(6, 2);
    const ducks = [];
    {
      const r = rng.fork('mallard');
      for (let i = 0; i < 9; i++) {
        const w = wings[3 + ((i * 3 + (i > 4 ? 1 : 0)) % 12)];
        ducks.push({ z: w.z, x0: w.side * (w.xin + r.range(6, 18)), amp: r.range(5, 11), sp: r.range(0.05, 0.09), ph: r.range(0, 6.28), size: r.range(1.5, 2.1) });
        aub.toArray(kcol, i * 3);
      }
      crim.toArray(kcol, 27);
      for (let i = 10; i < NK; i++) aubDeep.toArray(kcol, i * 3);
      knotGeo.setAttribute('aCol', new THREE.InstancedBufferAttribute(kcol, 3));
    }
    const berth = wings[8], boatX = berth.side * (berth.xin - 4.5), boatZ = berth.z + 0.6;
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler();
    for (let i = 0; i < 7; i++) knots.setMatrixAt(10 + i, _m.compose(_p.set(berth.side * (berth.xin - 0.6 - i * 1.5), 0, berth.z + 0.3), _q.identity(), _s.set(0.34, 2.6 + (i % 2) * 0.5, 1)));
    extras.push((dt, time) => {
      for (let i = 0; i < 9; i++) {
        const d = ducks[i], a = time * d.sp + d.ph, x = d.x0 + d.amp * Math.sin(a), head = Math.cos(a) >= 0 ? 1 : -1;
        U.uDuck.value[i].set(x, d.z, head);
        knots.setMatrixAt(i, _m.compose(_p.set(x, 0, d.z + 0.25), _q.identity(), _s.set(d.size, d.size * 0.42 * (1 + 0.08 * Math.sin(time * 2.2 + i)), 1)));
      }
      _q.setFromEuler(_e.set(0, 0, 0.07 * Math.sin(time * 0.9) + 0.03 * Math.sin(time * 2.3)));   // the boat rocks against its twin
      knots.setMatrixAt(9, _m.compose(_p.set(boatX, 0, boatZ), _q, _s.set(6, 1.7, 1)));
      knots.instanceMatrix.needsUpdate = true;
    });

    // the cast other than storks: white horses on the port and starboard wing meadows, or swans on the fold (resist gaps in the dye, twins below)
    if (cast !== 'storks') {
      const r = rng.fork('cast'), list = [];
      for (let i = 0; i < 9; i++) {
        if (cast === 'horses') {                             // nine on five wings: three on port wing 4, a pair on port wing 12, one on port wing 14, a pair on starboard wing 15, one on starboard wing 13; each runs outward, away from the channel
          // (round 13) each is HORSE_GROW times the gap size (21 m times 1.5: as the part draws it about 41 m from nose to tail and
          // 30 m to the ears), a gap in a meadow 37.5 m tall. Its place is the middle of its body at the hooves' level, measured
          // from its sheet's inner edge: the typed offsets (12, 16 and 4 m), the spacings (26.6 and 26 m), the metres of the jit
          // draw and the run speed are round 12's times HORSE_GROW, so at every instant each stands as many of its own lengths from
          // the edge and from its band-mate as in round 12. At its start time a horse placed 12 m (times HORSE_GROW) out has its tail
          // at the inner edge; one placed 4 m out (wings 13 and 15) is a third of its length short of the edge and runs clear of
          // it 1.3 to 2.5 s later, as it did in round 12. The start times, the clamp of the run in seconds, the stride rate and the
          // draws are round 12's
          const [wk, j] = [[4, 0], [4, 1], [4, 2], [12, 0], [12, 1], [14, 0], [15, 0], [15, 1], [13, 0]][i], w = wings[wk], jit = r.range(0, 3);   // (pass 5: on the port side two large on the nearer wing, well out, and one beyond them at that wing's inner edge: no band stands in front of another as seen at 15.2 to 16 s)   // (pass 4: three on the port bank of the side-on run, large, at 6 s)   // (pass 3: on the far wings of the basin, 30 to 40 degrees off the axis at 15 to 18 s: whole horses, inside the frame)   // (none on the wing we are passing: a horse cut by the frame's edge is no horse)   // (round 13: those pass notes are history. On the starboard side wing 13's horse lies over wing 15's pair along the eye's line, as it did before by the same share of the horse; and where a horse meets the frame's edge is where it falls)
          // port: a pair on the nearer wing (12); on seed 7 at 15.2 to 16 s the inner one is a sixth to a fifth of the frame wide
          // and whole, the outer one as wide and whole at 15.2 s, its head at the frame's left edge, and three fifths out of the
          // frame by 16 s; and one on the wing beyond (14), which would stand behind them on the same line of sight: it wades up
          // out of the fold as they run out of the frame (16.6 to 17.5 s) and stands at the frame's left edge in the 18 s image.
          // (round 13: 30 m tall and 36 m down, all of it is under the fold until it wades up)
          const sp = r.range(3.2, 4.4) * HORSE_GROW, ph = r() * 6.28;   // metres a second: the ground covered in one stride grows with the horse, the stride rate does not
          if (wk === 12) list.push({ z: w.z, dir: w.side, x0: w.side * (w.xin + (12 + j * 26.6 + jit * 0.3) * HORSE_GROW), sp, ph, t0: 16.6 });
          else if (wk === 14) list.push({ z: w.z, dir: w.side, x0: w.side * (w.xin + (16 + jit * 0.3) * HORSE_GROW), sp, ph, t0: 17.3, rise: 16.6 });
          else list.push({ z: w.z, dir: w.side, x0: w.side * (w.xin + ((wk === 4 ? 12 : 4) + j * 26 + jit) * HORSE_GROW), sp, ph, t0: wk === 4 ? 5.6 : 15.2 });
        }
        else { const w = wings[2 + i]; list.push({ z: w.z, x0: w.side * (w.xin + r.range(18, 44)), sp: r.range(0.25, 0.5) * (r() < 0.5 ? 1 : -1), ph: r() * 6.28, t0: 0 }); }
      }
      const smooth = (v) => { const t = clamp(v, 0, 1); return t * t * (3 - 2 * t); };
      extras.push((dt, time, tJ) => {
        for (let m = 0; m < 2; m++) for (let i = 0; i < 9; i++) {
          const s = list[i], v = U.uStork.value[m * 9 + i], tt = time - m * 0.35;
          if (cast === 'horses') {
            const run = clamp(tJ - m * 0.3 - s.t0, -4.5, 30), c = ((tt * 1.7 + s.ph) % 1 + 1) % 1;       // stride from the wall clock, ground covered from the journey
            const stride = c < 0.5 ? smooth(c * 2) * 2 - 1 : 1 - smooth((c - 0.5) * 2) * 2;
            const up = s.rise ? sstep(s.rise, s.rise + 0.9, tJ - m * 0.3) : 1;
            v.set(s.x0 + s.dir * ((s.rise ? Math.max(run, 0) : run) * s.sp + 0.5 * HORSE_GROW * Math.sin(tt * 1.7 * 6.2832 + s.ph)), (0.2 + 0.4 * Math.max(0, stride) - 24 * (1 - up)) * HORSE_GROW, s.z, stride + (s.dir > 0 ? 10 : 0));   // (round 13) every length here is round 12's times HORSE_GROW: the sway, the lift above the fold, the wader's depth
          } else v.set(s.x0 + 7 * Math.sin(tt * s.sp * 0.3 + s.ph) - 0, 0, s.z, Math.sin(tt * 0.7 + s.ph));
        }
      });
    }
    // the spits' three animals: gap slots 18 to 20 above the fold and 21 to 23 for their twins (the part's dye() reads them after the nine)
    // a horse stands: hooves at y 0, its stance one stride pose drawn at build and held (no clock), facing the channel (pose + 10 on the port spits), set once
    if (cast === 'horses') for (let m = 0; m < 2; m++) for (let j = 0; j < spits.length; j++) U.uStork.value[18 + m * 3 + j].set(spits[j].x, 0, spits[j].z, (spits[j].side < 0 ? 10 : 0) + spits[j].st);
    // a swan sits on the fold and drifts 7 m either way on wall time, its neck by the same clock, its twin 0.35 s late
    if (cast === 'swans') extras.push((dt, time) => {
      for (let m = 0; m < 2; m++) for (let j = 0; j < spits.length; j++) {
        const s = spits[j], tt = time - m * 0.35;
        U.uStork.value[18 + m * 3 + j].set(s.x + 7 * Math.sin(tt * s.sp * 0.3 + s.ph), 0, s.z, Math.sin(tt * 0.7 + s.ph));
      }
    });
    if (cast === 'storks') {
      // five storks: gaps of undyed thread gliding starboard to port across the valley a quarter of a kilometre ahead, 10 to 30 s,
      // beating slowly in three eased poses, each repeated below the fold a little late
      const r = rng.fork('storks'), birds = [];
      // they cross low, just over the fold, where the madder tide and the saffron stand behind them (a gap needs dyed cloth
      // to show in: body and raised wing both), strung across the middle of the frame at 14.4 s (u 0.36)
      for (let i = 0; i < 5; i++) birds.push({ el: Math.tan((8.6 + ((i * 3) % 5) * 0.95 + r.range(-0.3, 0.3)) / 57.3), lead: (i - 2) * 0.115 + r.range(-0.012, 0.012), ph: r() * 3, bob: r.range(0.6, 1.4), far: 95 + ((i * 2) % 3) * 14 });   // (pass 3) white gaps against the indigo body of the massif, 9 to 13 degrees up   // near enough that no grove hangs in front of them
      const e3 = (a) => { const v = clamp(a, 0, 1); return v * v * (3 - 2 * v); };
      const pose = (t) => { const c = ((t % 2.1) + 2.1) % 2.1; return 1 - e3((c - 0.35) / 0.3) - e3((c - 1.0) / 0.3) + 2 * e3((c - 1.7) / 0.35); };
      extras.push((dt, time, tJ, eye) => {
        for (let m = 0; m < 2; m++) for (let i = 0; i < 5; i++) {
          const b = birds[i], t = tJ - m * 0.45, tt = time - m * 0.45, q = (t - 14.4) / 15 + 0.5 - b.lead, v = U.uStork.value[m * 9 + i];
          if (q < -0.15 || q > 1.15) { v.set(0, -9999, -99999, 0); continue; }
          v.set(eye.x - b.far * tan.x / Math.max(tan.z, 0.3) + (0.5 - q) * 2 * b.far * 1.2 + 2 * Math.sin(tt * 0.31 + b.ph), eye.y + b.far * b.el + Math.sin(tt * 0.5 + b.ph) * b.bob + 2 * Math.sin(q * 3.1), eye.z - b.far, pose(tt + b.ph));
        }
      });
    }
    extras.push((dt, time) => { viewH.value = ctx.renderer.getDrawingBufferSize(bufSize).y; });
    await ctx.yield();

    // ---------- the flight ----------
    const eye = new THREE.Vector3(), tan = new THREE.Vector3();
    const summitW = toWorld(A.summit), lookW = toWorld(A.lookAt), imageW = toWorld(new THREE.Vector3(A.summit.x, 45, A.summit.z));   // the gaze rests on the fold under the summit: mountain above, twin below
    // THE GAZE (one scripted point of interest): the fold under the summit; from u 0.1 to 0.2 the port bank, side on; on the
    // rise (u 0.28 to 0.4) a little down, the doubled valley below; then the mountain again
    const _g = new THREE.Vector3(), _gm = new THREE.Vector3(), _gs = new THREE.Vector3(Math.sin(0.82), 0.03, Math.cos(0.82)), _aim = new THREE.Vector3();
    const gaze = (time, u) => {
      path.pointAt(clamp(u, 0, 1), _g);
      const side = sstep(0.085, 0.135, u) * (1 - sstep(0.185, 0.235, u)), down = sstep(0.27, 0.32, u) * (1 - sstep(0.36, 0.42, u));
      _gm.copy(imageW).sub(_g).normalize().multiplyScalar(1 - side).addScaledVector(_gs, side);
      _gm.y -= 0.03 * down;
      return _aim.copy(_g).addScaledVector(_gm.normalize(), 600);
    };
    function update(dt, time, camera, u) {
      const uu = clamp(u ?? 0, 0, 1), tJ = uu * 40;
      hero.setProgress(uu);
      hero.update(dt, time, camera);
      eye.setFromMatrixPosition(camera.matrixWorld); stage.worldToLocal(eye);
      path.tangentAt(uu, tan);
      const climbK = clamp(tan.y / Math.max(tan.z, 0.2), 0, 0.7);
      U.uPart.value.set(eye.x, eye.y, eye.z, tan.y / Math.max(tan.z, 0.2));
      // the satin sheen: a level band at the eye's own height (a little above it on the climb, where the gaze looks up), creeping
      // up as morning comes: it slides along every thread wide enough to carry its stripe
      // (polish pass 5) THE BELT: centred where the gaze meets each sheet (the eye's height plus the gaze's slope times the sheet's
      // distance) and a third of the frame tall at any distance: one level belt of satin across every near stand, wing and sheaf
      { const e = camera.matrixWorld.elements, fz = Math.max(-e[10], 0.3);
        U.uBelt.value.set(eye.y, clamp(-e[9] / fz, -0.3, 0.8) + 0.02 + 0.02 * Math.sin(time * 0.23) + tJ * 0.0006, 0.2, 1); }
      for (let i = 0; i < extras.length; i++) extras[i](dt, time, tJ, eye, camera);
    }
    update(0, 0, { matrixWorld: new THREE.Matrix4().makeRotationY(Math.PI).setPosition(path.pointAt(0, _p)) }, 0);

    const names = { 'first-snow': 'First Snow', early: 'Early October', late: '' };
    const title = 'The Lake Dyed Three Times' + (rare ? ': The Shift' : hour === 'night' ? ': Indigo First' : hour === 'golden' ? ': Honey Silk' : season !== 'late' ? ': ' + names[season] : weather === 'mist' ? ': Gauze' : '');
    return {
      scene, path, duration: 40, title,
      // linger in the crimson bath, hurry over the open lake and through the climb, unhurried into the parting
      pace: (u) => 0.9 + 0.15 * sstep(0.06, 0.12, u) + 0.25 * sstep(0.2, 0.26, u) - 0.65 * sstep(0.27, 0.33, u) + 0.55 * sstep(0.5, 0.6, u) - 0.2 * sstep(0.86, 0.92, u),
      ride: 'none', style: 'none', companion: 'none',
      camera: { fov: 66, near: 0.3, far: 6000, lookAhead: 34, sway: 0.3, bank: 0 },
      pois: [
        { at: gaze, from: -0.2, to: 0.58, fade: 0.2, weight: 0.78 },
      ],
      // the way out is a flat disc of the first dye (saffron) in the indigo lancet until the next world shows in it: no swirl, no halo
      portal: { shape: 'circle', radius: 7, color: ground.palette[1], veil: ground.palette[1], frame: 0, glow: 0, halo: false, tilt: true, revealDistance: 320, blendDistance: 25 },   // flat pigments to the last frame
      post: {
        flat: 1, exposure: EXPOSURE, bloom: { strength: 0 },                 // flat pigments: no tone map, the dyes land on their hex values
        grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 },
      },
      update,
      dispose() { hero.dispose(); for (const g of ownGeos) g.dispose(); },
    };
  },
};
