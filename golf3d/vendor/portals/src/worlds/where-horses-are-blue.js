// WHERE THE HORSES ARE BLUE. A run at fox height through a Bavarian summer in pure colour: past the flank of a blue horse
// 10.6 metres to the withers, up to four blue horses standing one above another on a crag, then down a red and yellow valley inside
// the herd as it gallops past and turns into the blue hills.
// Everything is one unlit paint: lofted arcs shaded by a painted coordinate (deep at the contour, light at the crown), a
// hairline hull, and leaning wedges of tinted air that multiply what is behind them. post.flat = 1: a hex written is the
// hex shown, no tone map and no inverse. The style routines live in ../parts/where-horses-are-blue.js.
// ONE THING STANDING HERE CHANGES ITS PLACE BY THE EYE: the doorkeeper, stand[0], the blue horse nearest the entry. The route
// runs through its shoulders and breast where it stands, so it gives way: as the eye comes within twice its height (its scale,
// 10.6 m to the withers: 21.2 m) of the point named below, it lifts its head and steps back along its own axis, and it has
// stepped back, its head lifted, by the time the eye is within once its height of that point; the route then passes ahead of
// its breast and under its lifted head. When the eye has drawn off to twice its height from that point again it has stepped
// forward to where it stood, its neck bowed as before. What it does (its place, the set of its neck, and the strength and phase
// of its gait) reads the eye's distance to one fixed point, DOOR_MID: 0.75 of its height straight above the point 0.1 m under
// groundY at the place where it stands (its origin there is its seat's, by count 0.24 m under that point), inside its
// barrel, and nothing else: not the share of the flight, the
// clock, a route metre or a seed. (The shader adds the herd's stride, uStride, to every row's phase; placeHerd holds it at 0
// until the share of the flight is over 0.4.) Under the gait it is still drawn as every standing horse is, by the clock and
// its own seed: breath, nod and ear in full, the standing set of its legs and the swish of its tail faded by the gait's
// strength. (Where it steps to is fixed once at build: the place from which the route crosses its middle plane 0.85 of its
// height ahead of its origin.) Nothing else that stands here has its matrix set from the eye. Live's paint reads the eye
// too and is not this round's: the sky's dome is drawn centred on the eye; the contour shells stand off their forms by a
// width that reads the lens's pixels at their depth; the paint's grain, rows and hairlines read the lens's pixels; the wedges
// of the weather take their strength from the eye's distance to their planes, and the tower's own from the eye's level
// distance to the tower.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import {
  buildHero, PALETTE, HUE, pig, makeStyleUniforms, STYLE_GLSL, STYLE_COMMON_GLSL, bandMaterial, makeBandGeo, loftBand, finishBandGeo,
  capProfile, makeHorseGeometryAsync, addHillBack, makeWedgeGeometry, wedgeMaterial,
} from '../parts/where-horses-are-blue.js';

const ss = THREE.MathUtils.smoothstep, lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp;
const TOWER = { x: 14, y: 16.5, z: 345 };          // the hero stands here, turned to face the entry
const VAX = 50;                                    // the run's valley axis (x)
const Z0 = 98;                                     // the entry: 265 m short of the tower, so it stands over a fifth of the first frame high
const mixc = (a, b, t) => a.clone().lerp(b, t);

// the edition: which pigments the land wears. Hue indices into the band tables; the tables themselves are retuned in place.
function makeEdition(ctx, rng) {
  const hour = ctx.vary?.hour || 'any';
  let kind = hour === 'day' ? 'noon' : hour === 'golden' ? 'evening' : hour === 'night' ? 'moon' : hour === 'dawn' ? 'morning' : null;
  const r = rng();
  if (!kind) kind = r < 0.45 ? 'noon' : r < 0.62 ? 'evening' : r < 0.82 ? 'moon' : 'morning';
  const H = HUE;
  const E = {
    noon: { sky: [H.YELLOW, H.YELLOW, H.LBLUE, H.YELLOW], pasture: [H.GREEN, H.YELLOW], port: H.RED, star: H.YELLOW, mid: [H.RED, H.VIOLET, H.YELLOW, H.GREEN], alps: H.VIOLET, wedges: [H.GREEN, H.YELLOW, H.VIOLET, H.YELLOW, H.GREEN], moon: 0 },
    evening: { sky: [H.RED, H.RED, H.VIOLET, H.RED], pasture: [H.GREEN, H.RED], port: H.VIOLET, star: H.RED, mid: [H.VIOLET, H.RED, H.RED, H.YELLOW], alps: H.VIOLET, wedges: [H.YELLOW, H.RED, H.YELLOW, H.RED], moon: 0 },
    moon: { sky: [H.BLUE, H.BLUE, H.LBLUE, H.BLUE], pasture: [H.GREEN, H.VIOLET], port: H.VIOLET, star: H.GREEN, mid: [H.VIOLET, H.GREEN, H.VIOLET, H.BLUE], alps: H.VIOLET, wedges: [H.GREEN, H.VIOLET, H.YELLOW], moon: 1 },
    morning: { sky: [H.YELLOW, H.YELLOW, H.LBLUE, H.YELLOW], pasture: [H.YELLOW, H.GREEN], port: H.GREEN, star: H.YELLOW, mid: [H.RED, H.GREEN, H.YELLOW, H.RED], alps: H.LBLUE, wedges: [H.YELLOW, H.GREEN, H.YELLOW, H.GREEN], moon: 0 },
  }[kind];
  return { kind, ...E, redHerd: rng() < 0.2, lean: rng() < 0.5 ? 1 : -1, nWedge: 24 + Math.floor(rng() * 7), skyPh: rng() * 6.283 };
}
function tuneTables(U, ed) {
  const [B, LB, R, Y, G, V, K] = PALETTE.map(pig), W = new THREE.Color(1, 1, 1), H = HUE;
  const hue = U.uHue.value, deep = U.uDeep.value, lite = U.uLite.value;
  if (ed.kind === 'evening') {                     // pasture blue green, the horses' deep goes violet
    hue[H.GREEN].copy(mixc(G, B, 0.42)); deep[H.GREEN].copy(mixc(mixc(G, B, 0.5), K, 0.5)); lite[H.GREEN].copy(mixc(G, Y, 0.45));
    deep[H.BLUE].copy(mixc(V, K, 0.35)); lite[H.RED].copy(mixc(Y, R, 0.25));
  } else if (ed.kind === 'moon') {                 // lighter blue horses with a lemon crown
    deep[H.BLUE].copy(mixc(B, K, 0.5)); lite[H.BLUE].copy(mixc(LB, mixc(Y, W, 0.4), 0.07));   // the horses stay ultramarine; a little lemon in the crown only
    lite[H.GREEN].copy(mixc(G, LB, 0.6)); lite[H.VIOLET].copy(mixc(V, LB, 0.75));
  } else if (ed.kind === 'morning') {              // the land leans to yellow and green
    lite[H.GREEN].copy(mixc(mixc(G, Y, 0.12), W, 0.2)); deep[H.YELLOW].copy(mixc(Y, G, 0.85)); lite[H.YELLOW].copy(mixc(Y, W, 0.28));   // emerald stays emerald; the yellow's edge is emerald too
    hue[H.RED].copy(mixc(R, Y, 0.3));
  }
}

export default {
  id: 'where-horses-are-blue',
  name: 'Where the Horses Are Blue',
  category: 'artists',
  placeKind: 'wilderness',
  after: 'Franz Marc, 1880 to 1916',
  weirdness: 0.35,
  media: ['open', 'air'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, density = ctx.vary?.density ?? 1, rare = !!ctx.vary?.rare;
    const scene = new THREE.Scene();
    const ed = makeEdition(ctx, rng.fork('edition'));
    const U = makeStyleUniforms(PALETTE); tuneTables(U, ed);
    scene.background = U.uHue.value[ed.sky[0]].clone();

    // ---- the hero: the tower, turned to face the entry ---------------------------------------------------------------
    const hero = await buildHero(ctx, { uniforms: U, detail, ground: false, backdrop: false, wedge: true, lod: 1.75 });
    hero.object.position.set(TOWER.x, TOWER.y, TOWER.z); hero.object.rotation.y = Math.PI; scene.add(hero.object);
    hero.object.updateMatrixWorld(true);
    const toW = (v) => new THREE.Vector3(TOWER.x - v.x, TOWER.y + v.y, TOWER.z - v.z);
    await ctx.yield();

    // ---- the path --------------------------------------------------------------------------------------------------
    // in at fox height, along the marked flank, then a climbing left wrap round the rump end and the back of the stair
    // (the tower stays inside the turn, so the gaze of either camera holds it), and out over the pass
    const ft = hero.anchors.flyThrough.map(toW), lay = hero.layout;
    const O = lay.horses[0].pos.clone().addScaledVector(lay.step, 1.5); O.y = 0;       // the middle of the stair (hero space)
    const orb = (deg, R, y) => { const th = THREE.MathUtils.degToRad(deg); return toW(O.clone().addScaledVector(lay.p, -R * Math.cos(th)).addScaledVector(lay.h, -R * Math.sin(th)).setY(y)); };
    const pts = [[0, 8.6, Z0], [0, 8.6, Z0 + 36], [-36, 9, 171], [6, 11.5, 213], [36, 17.5, 243]];      // a swing to starboard and back among the grazers
    // the pass along the marked flank stands off 25 m: the lowest horse is whole in the frame, the three above it stacked to the top edge
    { const low = lay.horses[0], nr = new THREE.Vector3(Math.cos(low.yaw), 0, -Math.sin(low.yaw)).multiplyScalar(lay.side);
      for (const q of [[66, 42, 0], [38, 33, 5], [16, 29, 9], [1, 28, 11], [-13, 27, 13]]) { const v = toW(low.pos.clone().addScaledVector(low.h, q[0]).addScaledVector(nr, q[1]).setY(low.pos.y + q[2])); pts.push([v.x, v.y, v.z]); } }
    const ORB = [[35, 34, 24], [64, 50, 32]];   // degrees round, metres out, height (hero space)
    for (const o of ORB) { const v = orb(o[0], o[1], o[2]); pts.push([v.x, v.y, v.z]); }
    // Then out from the rump end and up. Each slab of the stair is a wall along its horse, so from behind the top slab hides the
    // three below it: the line therefore backs away along the stair's diagonal, where all four step up side by side, and
    // crosses behind only once it is high enough to look down over the top slab (metres toward the back, toward the head, up).
    const stair = (bp, bh, y) => toW(O.clone().addScaledVector(lay.p, bp).addScaledVector(lay.h, bh).setY(y));
    const STAIR = [[-6, -64, 39], [4, -86, 49], [21, -93, 59], [46, -78, 74], [58, -46, 76]].map((q) => stair(q[0], q[1], q[2]));
    for (const v of STAIR) pts.push([v.x, v.y, v.z]);
    pts.push([36, 76.5, 434], [47, 68.5, 455], [VAX, 58.5, 478],
      // the run is no straight corridor: out and up the starboard wall (the herd crosses below in profile), back down across the
      // floor to the three great horses on the port knoll, on under the cow's second leap, and only then round to the rhombus
      [VAX - 6, 55.5, 526], [VAX - 43, 57, 578], [VAX - 42, 52, 622], [VAX - 40, 43, 668], [VAX - 27, 31, 712], [VAX + 7, 15.5, 754], [VAX + 24, 3.5, 798], [VAX + 17, -7.5, 842], [VAX + 4, -15.5, 884], [VAX, -20, 930], [VAX, -20, 975], [VAX, -20, 1020]);
    const path = makePath(pts);
    const L = path.length;
    const uAt = (x, z) => path.nearestXZ(x, z).u;
    const uPass = uAt(VAX, 470), uFlank = uAt(ft[3].x, ft[3].z), uOrb = (deg) => { const v = orb(deg, 45, 0); return uAt(v.x, v.z); }, uBehind = uOrb(85), uTop = uAt(STAIR[2].x, STAIR[2].z), uOut = uAt(STAIR[4].x, STAIR[4].z);

    // ---- the land's height: pasture, crag foot, pass, the run, the floor, the far slope ---------------------------------
    const sRamp = (s) => 0.5 * (s + Math.sqrt(s * s + 1600));          // a ramp without a crease
    const baseH = (x, z) => {
      let h = 16.5 * ss(z, 90, 300) + 37 * ss(z, 388, 470);
      h -= (sRamp(z - 470) - sRamp(z - 900)) * 0.1928;                 // the floor falls with the path: the lens rides 9 m over it, in no trench
      const far = 150 * (1 - Math.exp(-Math.max(0, z - 1042) / 150)); h += far * far / (far + 60) * 0.42;   // the far slope: a rise the herd climbs, then a shelf behind the blue backs (no bowl)
      const sv = ss(z, 425, 500), open = ss(z, 870, 990);
      const d0 = Math.max(0, Math.abs(x - VAX) - lerp(22, 65, open)), dv = d0 * d0 / (d0 + 40);      // a round trough: no kink where the floor meets the walls
      const wall = Math.pow(dv, 1.12) * lerp(0.8, 0.3, open); h += sv * 72 * (1 - Math.exp(-wall / 72));   // the walls lean up, then lie back under the hill backs
      const dp = Math.max(0, Math.abs(x - 10) - 120); h += (1 - sv) * Math.pow(dp, 1.1) * 0.32;
      { const dx = (x - VAX) / 16, dz = (z - 1020) / 40, e = dx * dx + dz * dz; if (e < 12) h -= 13.5 * Math.exp(-0.5 * e); }      // the dell the rhombus stands in, on its lower point
      h += (1 - ss(z, 240, 330)) * (2.6 * Math.sin(x * 0.045 + 1.3) * Math.sin(z * 0.037 + 0.4) + 1.6 * Math.sin(x * 0.02 - z * 0.031));
      return h;
    };
    const GX0 = -260, GX1 = 360, GZ0 = -140, GZ1 = 1420, CELL = 9;
    const NX = Math.round((GX1 - GX0) / CELL), NZ = Math.round((GZ1 - GZ0) / CELL);
    const HG = new Float32Array((NX + 1) * (NZ + 1));
    for (let j = 0; j <= NZ; j++) {
      for (let i = 0; i <= NX; i++) {
        const x = GX0 + i * CELL, z = GZ0 + j * CELL; let h = baseH(x, z);
        if (Math.abs(x - 10) < 150) {
          const n = path.nearestXZ(x, z), dd = Math.max(0, n.dist - 7), lim = n.y - 7.6 + dd * dd / (dd + 30) * 0.7;
          if (h > lim - 3) h = lim - 3 * Math.exp(-(h - lim + 3) / 3);          // a soft floor under the path, no crease
        }
        HG[j * (NX + 1) + i] = h;
      }
      if (j % 12 === 11) await ctx.yield();
    }
    const groundY = (x, z) => {
      const fx = clamp((x - GX0) / CELL, 0, NX - 1e-3), fz = clamp((z - GZ0) / CELL, 0, NZ - 1e-3), i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j, k = j * (NX + 1) + i;
      return lerp(lerp(HG[k], HG[k + 1], tx), lerp(HG[k + NX + 1], HG[k + NX + 2], tx), tz);
    };
    // ---- the ground: one sheet, painted in the fragment as long arcs (cells of one hue, deep at the contour, light at the
    // crown, hairline between), so the lower third of every frame is bands that foreshorten and slide ---------------------
    {
      const pos = new Float32Array((NX + 1) * (NZ + 1) * 3), idx = [];
      for (let j = 0, k = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++, k++) { pos[k * 3] = GX0 + i * CELL; pos[k * 3 + 1] = HG[k]; pos[k * 3 + 2] = GZ0 + j * CELL; }
      for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
      // aNy: at each corner of the sheet's CELL squares, the y of the upward unit normal of a plane with the two slopes of HG
      // there: along x and along z, the difference of the heights of the two corners next to it over their distance along that
      // axis (on an axis where a corner at the sheet's rim has one neighbour, from the corner itself and that neighbour). The
      // fragment reads it interpolated over each triangle (vNy).
      const ny = new Float32Array((NX + 1) * (NZ + 1));
      for (let j = 0, k = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++, k++) {
        const i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, NX), j0 = Math.max(j - 1, 0), j1 = Math.min(j + 1, NZ), row = j * (NX + 1);
        const sx = (HG[row + i1] - HG[row + i0]) / ((i1 - i0) * CELL), sz = (HG[j1 * (NX + 1) + i] - HG[j0 * (NX + 1) + i]) / ((j1 - j0) * CELL);
        ny[k] = 1 / Math.sqrt(1 + sx * sx + sz * sz);
      }
      g.setAttribute('aNy', new THREE.BufferAttribute(ny, 1));
      const gm = new THREE.ShaderMaterial({
        uniforms: { ...U, uHeave: { value: 1 / 3 }, uCrownK: { value: 0.09 }, uLiteCap: { value: 0.8 }, uPast: { value: new THREE.Vector2(ed.pasture[0], ed.pasture[1]) },
          uMid: { value: new THREE.Vector4(...ed.mid) }, uPort: { value: ed.port }, uStar: { value: ed.star }, uVax: { value: VAX },
          uTower: { value: new THREE.Vector2(TOWER.x, TOWER.z) } },
        vertexShader: /* glsl */`attribute float aNy; varying vec3 vW; varying float vNy; void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vNy = aNy; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: STYLE_GLSL + /* glsl */`
          uniform vec2 uPast, uTower; uniform vec4 uMid; uniform float uPort, uStar, uVax, uViewH; varying vec3 vW; varying float vNy;
          float zoneHue(vec2 c, float r, out float dom){
            float h = r < 0.6 ? uPast.x : uPast.y; dom = uPast.x;
            float dT = length(c - uTower);
            if (dT < 62. + 30. * r) { h = r < 0.5 ? uMid.x : uMid.y; dom = uMid.x; }
            if (c.y > 392. && c.y < 500.) { h = r < 0.4 ? uMid.x : (r < 0.7 ? uMid.z : uMid.w); dom = uMid.z; }
            if (c.y >= 470.) {
              float lat = c.x - uVax;
              if (lat > 40. + 30. * r) { h = r < 0.75 ? uPort : uMid.y; dom = uPort; }
              else if (lat < -40. - 30. * r) { h = r < 0.75 ? uStar : uMid.w; dom = uStar; }
              else if (c.y >= 500.) { h = r < 0.55 ? uPast.x : (r < 0.8 ? uPast.y : uMid.x); dom = uPast.x; }
            }
            if (c.y > 1012. + 110. * r - 1.15 * min(abs(c.x - uVax), 120.)) { h = r < 0.8 ? 0. : (r < 0.92 ? 1. : 5.); dom = 0.; }   // the last slopes are horses' blue
            return h;
          }
          // One layer of the ground: rows of backs D metres apart up the course. Each back is an arc whose crest bows away
          // from the entry; it stands over the row behind it and is covered by the row in front, and within a row one back
          // overlaps its neighbour: so every boundary on the ground is the curved crest of some back, with the deep under
          // it, the light swell a little below and the hairline along it. No level stripe, no straight edge.
          vec3 backs(vec2 p0, float D, float salt, float zr, float fz, float fx, float nearK){
            vec2 p = p0;
            const float H = 1.75;
            float r0 = ceil(zr - H), dWin = 0., rowWin = r0 + 3., ciWin = 0., xWin = 0., slWin = 0., offWin = 0., hit = 0.;
            for (int k = 0; k < 4; k++) {
              float row = r0 + float(k);
              float Lc = D * (3.4 + 2.8 * mHash(vec2(row, 7.3 + salt))), off = mHash(vec2(row, 3.7 + salt)) * 900.;
              float g = (p.x + off) / Lc, ci0 = floor(g), nb = g - ci0 < 0.5 ? -1. : 1.;
              // the two backs of this row that can stand over the pixel; the one with the higher lot lies in front
              float pa = mHash(vec2(row * 1.3 + ci0, 1.9 + salt)), pb = mHash(vec2(row * 1.3 + ci0 + nb, 1.9 + salt));
              for (int j = 0; j < 2; j++) {
                float ci = (j == 0 ? pa > pb : pa <= pb) ? ci0 : ci0 + nb;
                float hk = mHash(vec2(ci * 2.3 + 5.1, row * 1.7 + 0.3 + salt));
                float xc = (ci + 0.36 + 0.28 * hk) * Lc - off, Rw = Lc * (0.62 + 0.14 * fract(hk * 7.7));
                float e = (p.x - xc) / Rw, ht = H * (0.72 + 0.28 * fract(hk * 13.1));
                float crest = row + ht * (1. - e * e) * (1. - 0.22 * e) - 0.35;         // the crown off centre
                float d = crest - zr;
                if (hit < 0.5 && d > 0.) { hit = 1.; dWin = d; rowWin = row; ciWin = ci; xWin = xc; offWin = off;
                  slWin = abs(ht * (2. * e + 0.22 * (1. - 3. * e * e)) / Rw); }
              }
            }
            float hk = mHash(vec2(ciWin * 2.3 + 5.1, rowWin * 1.7 + 0.3 + salt)), dom;
            // broad fields of one pigment: neighbouring backs share their hue (a slow lot over the land decides it) and differ by
            // their deep edge, light swell and hairline; one back in nine is an accent. No pinstripe of alternating hues.
            vec2 zc = vec2(xWin, (rowWin + 0.3) * D);
            float zn = mNoise(zc * 0.0085 + 3.1) * 0.7 + mNoise(zc.yx * 0.021 + 7.7) * 0.3;
            float rr = fract(hk * 5.3) > 0.89 ? fract(hk * 29.7) : clamp((zn - 0.5) * 2.2 + 0.5 + 0.5 * (mHash(vec2(rowWin * 1.7 + 0.3, 4.4 + salt)) - 0.5), 0., 0.999);
            float hueIx = zoneHue(vec2(xWin, (rowWin + 0.3) * D), rr, dom);
            float s = pow(smoothstep(0., 0.42, dWin), 0.8) * (1. - 0.72 * smoothstep(0.42, 0.85, dWin));
            float seed = fract(hk * 7.31 + 0.13);
            float fd = max(fz + slWin * fx, 1e-5);
            vec3 c = bandPaintW(hueIx, clamp(s, 0.03, 1.), p.x + offWin, dWin * D, seed, 2.5 * fd, fd * D);
            int hi = int(clamp(hueIx + 0.5, 0., 7.));
            // the brush, loaded and dragged along the arc: streaks of the light partner and of the deep, a hand wide
            float st = mNoise(vec2((p.x + offWin) * 0.19 + seed * 9., dWin * D * 1.1 + seed * 5.)) * 0.6 + mNoise(vec2((p.x + offWin) * 0.41 - seed * 4., dWin * D * 2.3)) * 0.4;
            c = mix(c, uLite[hi], smoothstep(0.6, 0.84, st) * 0.11 * nearK * s);
            c = mix(c, uDeep[hi], smoothstep(0.60, 0.86, 1. - st) * 0.11 * nearK);
            // the hairline along the crest, measured in pixels: 0.07 m near, never under a pixel, never over 0.6 percent of the frame
            float wMax = max(1.2, 0.006 * uViewH), wA = clamp(0.07 / D / fd, 0.9, wMax);
            float line = (1. - smoothstep(wA, wA + 1., dWin / fd)) * lineKeep(p.x * 0.7 + rowWin * 9., seed) * hit;
            return mix(c, uLine, line);
          }
          void main(){
            vec2 p = vW.xz;
            // no row is level and no crest straight: the whole sheet is warped before the rows are counted
            p += vec2(11. * sin(p.y * 0.0125 + 0.7) + 5. * sin(p.y * 0.031 + p.x * 0.011), 17. * sin(p.x * 0.0105 + 1.9) + 9. * sin(p.x * 0.023 - p.y * 0.0062 + 0.4) + 0.2 * (p.x - uVax) * sin(p.y * 0.0043));
            const float D1 = 26., D2 = 96.;
            float z1 = p.y / D1, z2 = (p.y + 31.) / D2;
            float f1 = fwidth(z1), f2 = fwidth(z2), fx = fwidth(p.x);
            float rag = 0.07 * (mNoise(p * 0.11) - 0.5);
            float far1 = smoothstep(0.085, 0.14, f1 + 0.4 * rag), far2 = smoothstep(0.11, 0.18, f2 + 0.4 * rag);      // a row under about nine pixels is no longer a band: it gives way
            // rows finer than 3 px give way to rows four times as broad, and those to the flat average (both layers are always
            // painted: no derivative is taken inside a branch)
            vec3 c = backs(p, D1, 0., z1, f1, fx, 1. - smoothstep(0.02, 0.09, f1));
            vec3 c2 = backs(p, D2, 4.7, z2, f2, fx, 0.);
            float dom; zoneHue(p, 0.3, dom); int di = int(clamp(dom + 0.5, 0., 7.));
            c2 = mix(c2, mix(uHue[di], uLite[di], 0.12), far2);
            float steep = smoothstep(0.93, 0.76, vNy);
            c = mix(c, c2, max(far1, steep));
            gl_FragColor = vec4(c, 1.);
          }`,
      });
      const ground = new THREE.Mesh(g, gm); ground.frustumCulled = false; scene.add(ground);
    }
    await ctx.yield();
    // ---- the sky: more hills. Broad arcs in the same paint and the same hairline; below the level line, pasture --------------
    const skyU = { ...U, uHeave: { value: 1 / 3 }, uCrownK: { value: 0.012 }, uSky: { value: new THREE.Vector4(...ed.sky) }, uSkyPh: { value: new THREE.Vector4(Math.cos(ed.skyPh), Math.sin(ed.skyPh), Math.cos(ed.skyPh * 1.7 + 1), Math.sin(ed.skyPh * 1.7 + 1)) }, uUnder: { value: ed.pasture[0] }, uMoon: { value: ed.moon } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 40, 20), new THREE.ShaderMaterial({
      uniforms: skyU, side: THREE.BackSide, depthWrite: false, depthTest: true, depthFunc: THREE.LessEqualDepth, transparent: true,
      vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
      fragmentShader: STYLE_GLSL + /* glsl */`
        uniform vec4 uSky, uSkyPh; uniform float uUnder, uMoon; varying vec3 vD;
        // one arc of the sky, painted like a hill back: deep under its contour, the light swell a hand below it, then the hue
        vec3 skyArc(float hueIx, float below, float a, float seed){
          float d = clamp(below / 15., 1e-4, 1.);
          float s = 0.14 + 0.72 * sin(3.14159 * pow(d, 0.7)) * (1. - 0.55 * d) + 0.26 * d;
          return bandPaint(hueIx, clamp(s, 0., 1.), a, below * 2.5, seed);
        }
        void main(){
          vec3 d = vD / max(length(vD), 1e-4);
          float el = degrees(asin(clamp(d.y, -1., 1.)));
          float az = (abs(d.x) + abs(d.z) < 1e-5) ? 0. : atan(d.x, d.z);
          if (el < -0.5) { int ui = int(clamp(uUnder + 0.5, 0., 7.)); gl_FragColor = vec4(mix(uHue[ui], uLite[ui], 0.25), 1.); return; }
          // the crests are sums of harmonics of the bearing, written in sin and cos so that no seam crosses the sky
          float hl = max(length(d.xz), 1e-4), sa = d.x / hl, ca = d.z / hl;
          float s2 = 2. * sa * ca, c2 = ca * ca - sa * sa, s3 = sa * (3. - 4. * sa * sa), c3 = ca * (4. * ca * ca - 3.);
          float e0 = 25. + 8. * (s2 * uSkyPh.x + c2 * uSkyPh.y) + 5. * (c3 * uSkyPh.z - s3 * uSkyPh.w) + 3. * sa;      // the low yellow back: 9 to 41 degrees
          float cc = max(ca * 0.92 + sa * 0.39, 0.);                                                              // the one cloud, over the tower's port shoulder
          float e1 = 47. * cc * cc * cc - 1.;
          float e2 = 50. + 9. * (sa * uSkyPh.y - ca * uSkyPh.x) + 6. * c2;                                         // the high back
          float e3 = 71. + 13. * (sa * uSkyPh.z + ca * uSkyPh.w) + 4. * s2;                                       // and one more, leaning right across the top: no ring overhead
          float below, hueIx, seed, crest;
          if (el < e0) { below = e0 - el; hueIx = uSky.x; seed = 0.21; crest = e0; }
          else if (el < e1) { below = e1 - el; hueIx = uSky.z; seed = 0.57; crest = e1; }
          else if (el < e2) { below = e2 - el; hueIx = uSky.y; seed = 0.83; crest = e2; }
          else if (el < e3) { below = e3 - el; hueIx = uSky.w; seed = 0.39; crest = e3; }
          else { below = 6.5 + 0.15 * (el - e3); hueIx = uSky.x; seed = 0.71; crest = e3; }
          vec3 c = skyArc(hueIx, below, az * 90. + seed * 300., seed);
          // the hairline along each crest
          float fe = fwidth(el) + 1e-4, lw = max(0.22, 0.9 * fe);
          float dE = min(min(abs(el - e0), el > e0 ? abs(el - e1) : 99.), min(el > max(e0, e1) ? abs(el - e2) : 99., el > max(max(e0, e1), e2) ? abs(el - e3) : 99.));
          c = mix(c, uLine, (1. - smoothstep(lw, lw + fe, dE)) * lineKeep(az * 60. + crest, seed));
          if (uMoon > 0.5) {                                   // the moon edition: a yellow crescent and a dozen stars, flat shapes
            vec2 q = vec2((az - 0.42) * cos(radians(el)) * 57.3, el - 27.5);
            float aa = fe * 1.2 + 1e-4;
            float m = smoothstep(0., aa, min(3.4 - length(q), length(q - vec2(1.5, 0.9)) - 3.0));
            for (int i = 0; i < 12; i++) {
              float fi = float(i);
              vec2 sp = vec2(-2.6 + fi * 0.47 + 0.3 * sin(fi * 3.1), 22. + 16. * fract(fi * 0.618 + 0.11));
              vec2 r = abs(vec2((az - sp.x) * cos(radians(sp.y)) * 57.3, el - sp.y));
              float st = (0.75 + 0.35 * fract(fi * 0.37)) - (r.x + r.y) - 1.4 * min(r.x, r.y);
              m = max(m, smoothstep(0., aa, st));
            }
            c = mix(c, mix(uHue[3], uLite[3], 0.35), m);
          }
          gl_FragColor = vec4(c, 1.);
        }`,
    }));
    sky.renderOrder = 60; sky.frustumCulled = false; scene.add(sky);      // painted last, at the far plane, where nothing else stands: the wedges of light tint beast and hill, never the sky (over it they read as stray panes)
    await ctx.yield();

    // ---- the hills: every ridge is the horse's own topline, scaled, stacked round the bowl ----------------------------------
    {
      const rH = rng.fork('hills'), HG2 = makeBandGeo(), seg = (n) => Math.max(18, Math.round(n * (0.6 + 0.4 * detail)));
      const hills = [
        { cx: -98, z: 150, yaw: Math.PI / 2 - 0.3, width: 230, scale: 44, baseY: -6, hue: ed.port, flip: true },
        { cx: 128, z: 175, yaw: Math.PI / 2 + 0.22, width: 270, scale: 48, baseY: -6, hue: ed.star },
        { cx: -200, z: 300, yaw: Math.PI / 2 - 0.12, width: 420, scale: 88, baseY: -10, hue: ed.mid[1], flip: true },
        { cx: 225, z: 330, yaw: Math.PI / 2 + 0.1, width: 440, scale: 92, baseY: -10, hue: ed.mid[3] },
        { cx: VAX + 150, z: 655, yaw: Math.PI / 2 - 0.05, width: 560, scale: 132, baseY: 36, hue: ed.port, flip: true, depth: 60 },
        { cx: VAX - 150, z: 760, yaw: Math.PI / 2 + 0.05, width: 470, scale: 124, baseY: 30, hue: ed.star, flip: true, depth: 56 },
        { cx: VAX + 250, z: 760, yaw: Math.PI / 2 + 0.1, width: 700, scale: 185, baseY: 0, hue: ed.mid[1] },
        { cx: VAX - 250, z: 740, yaw: Math.PI / 2 - 0.1, width: 700, scale: 180, baseY: 0, hue: ed.mid[3] },
        // fore-backs down both sides of the run, each standing in front of the last
        { cx: VAX + 72, z: 548, yaw: Math.PI / 2 - 0.16, width: 210, scale: 50, baseY: 44, hue: ed.mid[2], depth: 20 },
        { cx: VAX - 72, z: 610, yaw: Math.PI / 2 + 0.14, width: 220, scale: 52, baseY: 32, hue: ed.mid[0], flip: true, depth: 20 },
        { cx: VAX + 104, z: 742, yaw: Math.PI / 2 - 0.1, width: 240, scale: 62, baseY: 14, hue: ed.port, flip: true, depth: 20 },
        { cx: VAX - 74, z: 812, yaw: Math.PI / 2 + 0.12, width: 230, scale: 50, baseY: -7, hue: ed.mid[3], depth: 20 },
        { cx: VAX + 100, z: 930, yaw: Math.PI / 2 - 0.2, width: 200, scale: 44, baseY: -22, hue: ed.mid[1], depth: 18 },
        { cx: VAX - 104, z: 960, yaw: Math.PI / 2 + 0.2, width: 200, scale: 42, baseY: -24, hue: ed.star, flip: true, depth: 18 },
        // the far end: the last ridges are the horses' own blue
        { cx: VAX + 4, z: 1090, yaw: 0.06, width: 100, scale: 17, baseY: -27, hue: HUE.LBLUE, depth: 9 },
        { cx: VAX - 105, z: 1150, yaw: 0.22, width: 270, scale: 46, baseY: -16, hue: HUE.BLUE, flip: true },
        { cx: VAX + 110, z: 1158, yaw: -0.2, width: 280, scale: 50, baseY: -16, hue: HUE.BLUE },
        { cx: VAX + 15, z: 1215, yaw: 0.04, width: 360, scale: 78, baseY: -12, hue: HUE.LBLUE },
        { cx: VAX - 90, z: 1290, yaw: 0.1, width: 520, scale: 118, baseY: -8, hue: HUE.BLUE, flip: true },
        { cx: VAX + 120, z: 1370, yaw: -0.08, width: 640, scale: 165, baseY: -4, hue: HUE.LBLUE },
        { cx: VAX - 20, z: 1480, yaw: 0.03, width: 900, scale: 240, baseY: 10, hue: HUE.BLUE, flip: true },
      ];
      const ring = (n, rx, rz, cz, scale, hues, baseY, wK) => {
        for (let i = 0; i < n; i++) {
          const a = (i + 0.5 * (hues === 0 ? 1 : 0)) / n * Math.PI * 2 + rH.range(-0.08, 0.08), cx = 20 + Math.sin(a) * rx, z = cz + Math.cos(a) * rz;
          const hue = z > 1250 && Math.abs(cx - VAX) < 420 ? (i % 2 ? HUE.VIOLET : ed.alps) : (hues ? hues[i % hues.length] : (i % 3 === 1 ? HUE.LBLUE : ed.alps));
          hills.push({ cx, z, yaw: Math.atan2(-Math.sin(a) * rz, Math.cos(a) * rx), width: wK * rH.range(0.9, 1.15), scale: scale * rH.range(0.85, 1.15), baseY, hue, flip: rH() < 0.5, depth: scale * 0.3 });
        }
      };
      // three rings of backs stand round the whole bowl, each higher than the last, so that the skyline is held about 20
      // degrees above level from the pasture floor, from the crag and from the pass alike
      const nNamed = hills.length;
      ring(10, 330, 800, 500, 150, [ed.mid[0], ed.mid[2], ed.mid[1], ed.mid[3]], -20, 520);
      ring(11, 475, 870, 530, 215, [ed.mid[1], ed.mid[3], ed.mid[0], ed.alps, ed.mid[2]], 24, 690);
      ring(12, 620, 1010, 560, 330, 0, 60, 880);
      for (let i = 0; i < hills.length; i++) {
        const h = hills[i];
        addHillBack(HG2, { ...h, dip: h.scale * 0.75 + 30, dipRange: 0.24, seed: rH(), nSeg: seg(i === 4 || i === 5 ? 60 : i < nNamed + 10 ? 34 : i < nNamed + 21 ? 26 : 22), nRing: i < nNamed + 10 ? 12 : 8 });
        await ctx.yield();
      }
      const hgeo = finishBandGeo(HG2); await ctx.yield();
      const hm = new THREE.Mesh(hgeo, bandMaterial(U, { crownK: 0.045, heave: 1 / 3, hullWidth: 0.3, flank: 46, doubleSide: true }));      // two-sided: where a great back folds through itself its paint still shows, never a hole
      hm.frustumCulled = false; scene.add(hm);
    }
    await ctx.yield();
    // ---- the herd: one drawing, thirty times with the tower. Seven stand in the pasture, three great ones on the knoll of the run; sixteen gallop it (closed form in u) ---
    const horseMat = bandMaterial(U, { horse: true, liteCap: 0.8, hullFar: 1.9 });
    // ONE drawing for every horse, and no low-detail copy of it: all of them come to the lens. The twelve of the finer mesh
    // (the seven in the pasture, the three on the knoll and the two flankers of the run) are lofted finer still, so no facet shows on a rump.
    const geoHerd = await makeHorseGeometryAsync({ lod: 1.0 }, ctx.yield);
    await ctx.yield();
    const geoClose = await makeHorseGeometryAsync({ lod: 1.3 }, ctx.yield);
    await ctx.yield();
    const rHd = rng.fork('herd');
    const N_STAND = 10, N_RUN = 16, N_GIANT = 4, N_FLANK = 2, N_CLOSE = N_STAND + N_FLANK, N_HERD = N_RUN - N_FLANK;      // in the rare edition the four leaders are the tower's own, come down
    const herd = new THREE.InstancedMesh(geoHerd, horseMat, N_HERD), herdC = new THREE.InstancedMesh(geoClose, horseMat, N_CLOSE);
    const instN = new Float32Array(N_HERD * 4), inst2N = new Float32Array(N_HERD * 4), instC = new Float32Array(N_CLOSE * 4), inst2C = new Float32Array(N_CLOSE * 4);
    const _M = new THREE.Matrix4(), _Q = new THREE.Quaternion(), _E = new THREE.Euler(0, 0, 0, 'YXZ'), _S = new THREE.Vector3(), _P = new THREE.Vector3();
    const ZERO = new THREE.Matrix4().makeScale(0, 0, 0).setPosition(0, -400, 0);
    const setHorse = (mesh, i, x, y, z, yaw, pitch, sc) => { _E.set(pitch, yaw, 0); _Q.setFromEuler(_E); _S.setScalar(sc); _P.set(x, y, z); _M.compose(_P, _Q, _S); mesh.setMatrixAt(i, _M); };
    const pathAtZ = (z) => { let a = 0, b = 0.3; for (let k = 0; k < 18; k++) { const m = (a + b) / 2; if (path.pointAt(m, _P).z < z) a = m; else b = m; } return path.pointAt((a + b) / 2, new THREE.Vector3()); };
    // the doorkeeper: rump and bowed neck in the starboard half of the first frame, head tucked down and away. Where it stands
    // the route passes through its breast, 0.42 m from the axis of its barrel (by print), so it gives way (see the head)
    const stand = [{ x: -13.5, z: Z0 + 45, yaw: 0.58, neck: 0.4, sc: 10.6 }];
    const gz = [126, 152, 177.5, 198, 222, 261], glat = [66, -13.5, -15.5, 28.25, -21, 31], gyaw = [0.5, -0.35, 1.45, -0.75, 0, -0.9], gneck = [0.75, 0.2, 0.95, 0.6, 0.1, 0.8];
    // the fourth of the six (stand[4]) stands on the bank beside the route (the ground is held down under the route and rises away
    // from it): 28.25 m to the side of the route's point at its z and turned toward the route (yaw -0.75), both before its
    // dealt jitter. That heads it down the bank's fall, so that its seat (seatOf, below) is a pitch with little roll of the
    // ground left under it. It was first typed at 24 m and -0.6: there, seated by the same law, a hoof was off the count
    // named below on 83 of seeds 1 to 400 at detail 1 and its head came within 0.8 m of the lens (by vertices).
    // the first of the six (stand[1]) stands 66 m to port of the route's point at its z, at gz 126, on the heading it had (yaw
    // 0.5), all before its dealt jitter. It was first typed at 44 m and gz 130: there a pasture hump stood inside its box (the
    // box of inBox, below) on every one of seeds 1 to 400. Here, by the same count, no hump, trunk or leaf fan stands in its
    // box on any seed.
    // the third (stand[3]) stands 15.5 m to starboard of the route's point at gz 177.5, at yaw 1.45, before its dealt jitter of
    // yaw (it has none of place). It was first typed at 13 m, gz 176 and yaw 1.25: there, seated by seatOf, its head came
    // within 1.90 m of the route (seeds 1 to 400 at detail 1, by vertices, with the clock at its worst; 2.04 m at rest) and a
    // pasture hump stood in its box on 19 of those seeds by samples (21 by true triangles). Here, on those seeds, its least
    // clear air is 2.58 m by triangles with the clock at its worst (2.87 m at rest), and no hump stands in its box at the
    // three details or on seeds 401 to 1000 at detail 1; the foot of one trunk crosses the box's astern lower edge by 0.02 m
    // on one seed of 400 at detail 0.6 and meets no part of the horse. (At 15.25 m and gz 177, a smaller move, its hooves
    // keep the count too, and the same trunk crosses that edge by 0.05 m.)
    // the fifth (stand[5]) stands 21 m to starboard at gz 222, at yaw 0, before its dealt jitter. It was first typed at 18 m, gz
    // 220 and yaw 0.3: there, seated by seatOf, a hoof was off the count named below on 71 of seeds 1 to 400 at detail
    // 1. Here its hooves keep the count with 36 to 56 mm to spare at the three details; at the same place with 0.05 rad
    // less turn (yaw 0.05) they keep it with 6 mm.
    // the last of the six: its x is the greater of 50.5 and p.x + 14.5 (p, as for the others, is the point pathAtZ gives for its z)
    for (let i = 0; i < 6; i++) { const p = pathAtZ(gz[i]); stand.push({ x: i === 5 ? Math.max(50.5, p.x + 14.5) + 0 * rHd() : p.x + glat[i] + (i === 2 ? 0 : rHd.range(-1.5, 1.5)), z: gz[i], yaw: gyaw[i] + rHd.range(-0.15, 0.15), neck: gneck[i], sc: 9 * rHd.range(0.94, 1.06) }); }
    // the three great horses of the run: on the port knoll under the red hill, broadside to the lens, necks bowed one over another
    const TRIO = [[VAX + 41, 807, -1.3, 0.55, 13.4], [VAX + 54, 829, -0.95, 0.12, 14.2], [VAX + 39, 853, -1.12, 0.8, 12.6]];
    for (const q of TRIO) stand.push({ x: q[0], z: q[1], yaw: q[2], neck: q[3], sc: q[4] });
    // THE SEAT OF THE STANDING HORSES: the doorkeeper and the six grazers (stand[0] to stand[6]) stand on their own ground. One
    // law, seatOf, seats all seven: a function of the horse's x, z, yaw and scale and of groundY, and of nothing else: no
    // draw of any stream, no lens, no seed, no share of the flight, no clock. (The doorkeeper's x and z along its step read
    // the eye, as they did: placeDoor, below, seats it by this law at the place it has stepped to.) The knoll's three
    // (stand[7] to stand[9]) are NOT seated: see the end of this block.
    // THE GROUND IT READS is the sheet as it is drawn. groundY is the two-way lerp of the corners of the sheet's CELL squares; the
    // sheet itself is drawn as two triangles a square, parted along the diagonal from the corner at the greater x to the
    // corner at the greater z, and under the hooves of stand[4] the two lie up to 0.2 m apart (by print 0.18 m). sheetY(x, z)
    // is the height of the drawn triangle over the point: groundY at that triangle's three corners, weighed (true for a
    // point in any square but those of the sheet's last row and last column, whose far corners groundY does not give).
    // HOOF is where a leg's lowest point lies at rest in the frame of a horse that stands level, in units of its scale (x to
    // either side, y up from the origin, z ahead): a fore hoof's three places, then a hind hoof's three. Three, because the
    // drawing swings each leg by a standing set dealt from the row's own seed, which the seat does not read: the places
    // are those at the set's two ends and its middle, and by print every dealt hoof lies within 0.002 of the scale of the
    // arc through its leg's three.
    // THE PITCH (about the horse's own cross axis; positive is nose down) is the fall of the drawn ground along the horse: the
    // angle whose tangent is the mean of sheetY at the two hind middle places less the mean at the two fore middle places,
    // the four laid out level from the horse's x and z by its yaw and scale, over their level distance; held within the
    // row's bound in SEAT_MOST. On level ground it is nought, and it has the sign of that fall.
    // THE HEIGHT: each of the twelve places, both sides, tilted by that pitch and laid out level, asks for the origin height at
    // which it would touch sheetY there; the origin stands at the middle of the span from the least to the greatest of the
    // twelve heights asked, less SEAT_UNDER. (On level ground that is 0.29 m under the ground at scale 9.5: a hoof's lowest
    // point lies 0.0009 to 0.0457 of the scale over the origin.)
    // SEAT_MOST holds each seated row's bound of pitch; 0 is height alone. stand[2] (0), stand[4] and stand[6] (0.3) keep the
    // bounds they had. For stand[0], [1], [3] and [5] the bound is the least on a grid of 0.05 at which the row's hooves keep
    // the count below at all three details (one step less, and a hoof is off it on 395 or more of the 400 seeds for
    // stand[1], 112 or more for stand[3], 26 or more for stand[5]). stand[0]: 0, where it stands and all along its
    // step. stand[1]: 0.05 (the ground rises 0.07 to 0.08 rad toward its nose). stand[2]: 0 (the ground under it falls
    // up to 0.05 rad toward its nose, by count its hooves keep the count below without a pitch, and seated with that pitch
    // its least clear air (seeds 1 to 400, detail 1, by vertices) was 2.35 m for 2.49 m unseated; by height alone it is
    // 2.48 m). stand[3]: 0.1 (the ground falls 0.11 to 0.15 rad toward its nose). stand[5]: 0.25 (the ground rises 0.19
    // to 0.25 rad toward its nose).
    // There is no roll: setHorse turns a horse by pitch and yaw only.
    // BY COUNT (seeds 1 to 400 at details 1, 0.8 and 0.6; the lowest vertex of each leg at rest against the drawn ground; the
    // doorkeeper where it stands and at a quarter, a half, three quarters and the end of its step, its legs posed at rest)
    // no hoof of the seven is more than 0.30 m over the ground or 0.45 m under it. The pitch as built: stand[1]'s -0.05 and
    // stand[3]'s 0.1, each at its bound on every seed; stand[4]'s 0.25 to 0.30 and never at its bound; stand[5]'s -0.25
    // to -0.19, at its bound on 3 of the 1200 builds counted; stand[6]'s -0.04 to 0.03. No hoof is set on the ground: the
    // seat does not know the set dealt to each leg, which alone moves a hind hoof's lowest point 0.39 m in height at scale
    // 9.5, nor the gait the doorkeeper's row carries while it steps: drawn with that gait, at the half and at three
    // quarters of its step a hoof is up to 0.54 m in the air and one up to 0.51 m under the ground.
    // THE KNOLL'S THREE (stand[7], stand[8], stand[9]) are not seated: each keeps its origin 0.1 m under groundY at the origin
    // and stands level, as every standing horse once did. They stand on the valley's port wall, headed down it: the drawn
    // ground falls 0.42 to 0.51 rad toward their noses, and seatOf at a bound of 0.3 leaves each a hoof off the count on
    // 400 of 400 seeds (detail 1). Other places for them were searched only on a coarse grid (5 m by 8 m by 0.3 rad), on
    // which none kept the count. By the count above each has, on every seed, a hoof more than 0.60 m in the air and one
    // more than 0.45 m under the ground: at the most 3.41 m in the air and 3.95 m under.
    const HOOF = [[0.1517, 0.0053, 0.3702], [0.1517, 0.0009, 0.2774], [0.1517, 0.0106, 0.1853], [0.158, 0.0048, -0.4227], [0.158, 0.0237, -0.4556], [0.158, 0.0457, -0.487]];
    const SEAT_MOST = { 0: 0, 1: 0.05, 2: 0, 3: 0.1, 4: 0.3, 5: 0.25, 6: 0.3 }, SEAT_UNDER = 0.073;
    const sheetY = (x, z) => {
      const i = Math.floor(clamp((x - GX0) / CELL, 0, NX - 1e-3)), j = Math.floor(clamp((z - GZ0) / CELL, 0, NZ - 1e-3)), x0 = GX0 + i * CELL, z0 = GZ0 + j * CELL, tx = (x - x0) / CELL, tz = (z - z0) / CELL;
      return tx + tz <= 1 ? groundY(x0, z0) * (1 - tx - tz) + groundY(x0 + CELL, z0) * tx + groundY(x0, z0 + CELL) * tz
        : groundY(x0 + CELL, z0 + CELL) * (tx + tz - 1) + groundY(x0, z0 + CELL) * (1 - tx) + groundY(x0 + CELL, z0) * (1 - tz);
    };
    const seatOf = (s, most) => {
      const sy = Math.sin(s.yaw), cy = Math.cos(s.yaw), at = (lx, lz) => sheetY(s.x + s.sc * (lx * cy + lz * sy), s.z + s.sc * (lz * cy - lx * sy)), f = HOOF[1], h = HOOF[4];
      const pitch = most ? clamp(Math.atan2(at(h[0], h[2]) + at(-h[0], h[2]) - at(f[0], f[2]) - at(-f[0], f[2]), 2 * s.sc * (f[2] - h[2])), -most, most) : 0;
      const cp = Math.cos(pitch), sp = Math.sin(pitch); let lo = Infinity, hi = -Infinity;
      for (const sx of [1, -1]) for (const q of HOOF) { const n = at(sx * q[0], q[1] * sp + q[2] * cp) - s.sc * (q[1] * cp - q[2] * sp); if (n < lo) lo = n; if (n > hi) hi = n; }
      return { y: (lo + hi) / 2 - SEAT_UNDER, pitch };
    };
    stand.forEach((s, i) => {
      if (i in SEAT_MOST) { const q = seatOf(s, SEAT_MOST[i]); setHorse(herdC, i, s.x, q.y, s.z, s.yaw, q.pitch, s.sc); } else
      setHorse(herdC, i, s.x, groundY(s.x, s.z) - 0.1, s.z, s.yaw, 0, s.sc);
      instC.set([rHd(), 0, s.neck, rHd()], i * 4); inst2C.set([0, -1, 0, 0], i * 4);
    });
    // the runners: eight rows of two. AHEAD is where each row settles in front of the lens once the herd has come past
    // (row 0 are the two flankers; the port file keeps inside the knoll where the three great ones stand).
    const herdHue = ed.redHerd ? HUE.RED : -1;
    const AHEAD = [26, 46, 61, 77, 92, 108, 123, 138], LANE = [14, 17, 21, 15, 22, 18, 20, 16], LANE_P = [13, 16, 20, 14, 21, 17, 19, 15];      // fewer and larger: each one a whole drawing
    const runners = [];
    for (let i = 0; i < N_RUN; i++) {
      const row = i >> 1, side = i % 2 ? 1 : -1, close = i < N_FLANK, mesh = close ? herdC : herd, k = close ? N_STAND + i : i - N_FLANK, giant = rare && i >= N_RUN - N_GIANT, gi = i - (N_RUN - N_GIANT);
      const ln = (side > 0 ? LANE_P : LANE)[row] + rHd.range(0, 1.2), ah = AHEAD[row] + (row ? rHd.range(-2.5, 2.5) + side * 3.5 : side * 1.5), sc = 11.2 * rHd.range(0.94, 1.08), sd = rHd();
      // the rare event: the tower comes down. The four leaders are its own horses, half as tall again, in the wide lanes
      const smax = [10, 46, 52, 58, 64, 70, 76, 82][row] + 8 * sd, peel = row ? 0 : 14;      // the nearest turn out widest: seen from the rear quarter, never dead astern
      runners.push(giant ? { mesh, i: k, lane: side * (gi < 2 ? 24 : 38), ahead: 112 - gi * 9, sc: 16.5, sd, giant, smax: 14 } : { mesh, i: k, lane: side * ln, ahead: ah, sc, sd, giant, smax, peel });
      (close ? instC : instN).set([rHd(), 1, giant ? 0.04 : rHd.range(-0.02, 0.1), rHd()], k * 4); (close ? inst2C : inst2N).set([giant && gi === 0 ? 1 : 0, giant ? -1 : herdHue, 0, 0], k * 4);
    }
    geoHerd.setAttribute('aInst', new THREE.InstancedBufferAttribute(instN, 4)); geoHerd.setAttribute('aInst2', new THREE.InstancedBufferAttribute(inst2N, 4));
    geoClose.setAttribute('aInst', new THREE.InstancedBufferAttribute(instC, 4)); geoClose.setAttribute('aInst2', new THREE.InstancedBufferAttribute(inst2C, 4));
    herd.frustumCulled = false; herdC.frustumCulled = false; scene.add(herd, herdC);
    // THE DOORKEEPER GIVES WAY (see the head). placeDoor(d) takes the distance d from the eye to DOOR_MID and sets how far along
    // its step it is: k = 0 while d is twice its height (DOOR.sc) or more, 1 once d is its height or less, and between them one
    // minus the smoothstep of d (three's, the same cubic as the kit's). The step runs along its own axis from where it stands to
    // (DOOR_X, DOOR_Z), the place from which the route crosses its middle plane 0.85 of its height ahead of its origin: ahead
    // of the breast, and from a metre past that plane under the lifted head. At every place of the step it is seated as it is
    // where it stands: DOOR_AT holds the place it has stepped to, and seatOf, by height alone (SEAT_MOST[0] is 0), sets its
    // origin there from the drawn ground at the twelve places a hoof can take (36 reads of groundY; timed in node, about 0.002 ms a
    // call; it makes about a kilobyte of short-lived objects a call while the step lasts). By count its origin lies 0.34 m under groundY where it stands and 0.07 m over groundY at the end of its step.
    // (Of the ten in stand only the knoll's three have no seat: their origins keep 0.1 m under groundY at the origin, and
    // the ground is not read under their hooves.) Whenever k changes
    // its row of the instance table is written: the drawing's gait at a strength of DOOR_GAIT x 4k(1 - k), none at either end,
    // the gait's phase running from DOOR_PH0 down by DOOR_CYC of a cycle, so that the legs go backward as it backs and
    // forward again as it returns, and the set of its neck (the row's third number) running from DOOR.neck, bowed, to
    // DOOR_LIFT, lifted. (The drawing's fore legs sit at 0 and 0.12 of the cycle and its hind legs at 0.5 and 0.62: on
    // this run of the phase both fore legs are in the gait's lifted half and both hind legs in its straight half while k is
    // between 0.12 and 0.88.) At k = 1 the row keeps that end phase with no gait, which draws as the row it was built
    // with but for the set of the neck (the gait's strength multiplies every term of the phase). At k = 0 the matrix and
    // the row are the ones it was built with. The eye is the camera update() is given: the flight's, or the portal's when
    // this place is seen through an opening.
    // DOOR_MID lies 45 m beyond the entry in z, so an opening's camera sees it as built wherever it is 21.2 m or more from
    // DOOR_MID; one that stands before the entry plane always is. (The viewer of a route that curls past its own exit plane
    // carries the opening's camera beyond the entry plane.)
    const DOOR = stand[0], DOOR_GAIT = 0.4, DOOR_PH0 = 0.19, DOOR_CYC = 0.5, DOOR_LIFT = -0.3, DOOR_ROW = instC[0], aInstC = geoClose.attributes.aInst;
    const DOOR_MID = new THREE.Vector3(DOOR.x, groundY(DOOR.x, DOOR.z) - 0.1 + 0.75 * DOOR.sc, DOOR.z);
    let DOOR_X = DOOR.x, DOOR_Z = DOOR.z, doorK = 0;
    { const sx = Math.sin(DOOR.yaw), cz = Math.cos(DOOR.yaw); let a = 0, b = 0.3;
      for (let i = 0; i < 18; i++) { const m = (a + b) / 2; if ((path.pointAt(m, _P).x - DOOR.x) * cz > (_P.z - DOOR.z) * sx) a = m; else b = m; }
      DOOR_X = _P.x - sx * 0.85 * DOOR.sc; DOOR_Z = _P.z - cz * 0.85 * DOOR.sc; }
    const DOOR_AT = { x: DOOR.x, z: DOOR.z, yaw: DOOR.yaw, sc: DOOR.sc };
    const placeDoor = (d) => {
      const k = 1 - ss(d, DOOR.sc, 2 * DOOR.sc); if (k === doorK) return; doorK = k;
      DOOR_AT.x = lerp(DOOR.x, DOOR_X, k); DOOR_AT.z = lerp(DOOR.z, DOOR_Z, k); const q = seatOf(DOOR_AT, SEAT_MOST[0]);
      setHorse(herdC, 0, DOOR_AT.x, q.y, DOOR_AT.z, DOOR.yaw, q.pitch, DOOR.sc); herdC.instanceMatrix.needsUpdate = true;
      instC[0] = k > 0 ? DOOR_PH0 - DOOR_CYC * k : DOOR_ROW; instC[1] = DOOR_GAIT * 4 * k * (1 - k); instC[2] = lerp(DOOR.neck, DOOR_LIFT, k); aInstC.needsUpdate = true;
    };
    const Z_REF = 478, uRef = uAt(VAX, Z_REF), dRef = uRef * L;
    // the lead: how far the herd has gained on the lens, a pure function of the lens's own z (so of u). It pours over the
    // pass at 1.6 times our speed, settles round us for the length of the run, and draws away again where the floor levels.
    const LEADK = 0.08, ZA0 = 428, leadT = new Float32Array(700);
    { let a = 0; for (let k = 0; k < 700; k++) { const z = ZA0 + k; leadT[k] = a; a += 0.6 * ss(z, 432, 442) * (1 - ss(z, 590, 700)) + 1.0 * ss(z, 432, 442) * (1 - ss(z, 462, 492)) + 0.45 * ss(z, 630, 650) * (1 - ss(z, 680, 700)) - 0.33 * ss(z, 824, 842) * (1 - ss(z, 882, 900)) - LEADK * ss(z, 505, 515) * (1 - ss(z, 595, 605)); } }      // (it draws clear of the three on the knoll, and lets us close again before the files part)
    const leadAt = (z) => { const f = clamp(z - ZA0, 0, 698.99), k = Math.floor(f); return lerp(leadT[k], leadT[k + 1], f - k); };
    const A_RUN = leadAt(760) - 20;
    // trackAt(w), which every runner's x in lane() is reckoned from: the lens's own track over the pass, then the valley axis
    const trackZ = [], trackX = [];
    for (let k = 0; k <= 60; k++) { const p = path.pointAt(lerp(uRef - 0.075, uRef, k / 60), _P); if (!trackZ.length || p.z > trackZ[trackZ.length - 1] + 0.05) { trackZ.push(p.z); trackX.push(p.x); } }
    const trackAt = (w) => { if (w >= Z_REF) return VAX; if (w <= trackZ[0]) return trackX[0]; let k = 1; while (k < trackZ.length - 1 && trackZ[k] < w) k++; return lerp(trackX[k - 1], trackX[k], clamp((w - trackZ[k - 1]) / (trackZ[k] - trackZ[k - 1]), 0, 1)); };
    // lineAt(w): under Z_REF, trackAt(w); from Z_REF on, the x of the route where its z is w, by straight lines between samples
    // of the route taken every 0.001 of u from uRef, two at least, until one stands at z 600 or beyond (before the first of them
    // the first one's x, past the last the last one's).
    const lineZ = [], lineX = [];
    for (let k = 0; lineZ.length < 2 || lineZ[lineZ.length - 1] < 600; k++) { const p = path.pointAt(uRef + k * 0.001, _P); lineZ.push(p.z); lineX.push(p.x); }
    const lineAt = (w) => { if (w < Z_REF) return trackAt(w); let k = 1; while (k < lineZ.length - 1 && lineZ[k] < w) k++; return lerp(lineX[k - 1], lineX[k], clamp((w - lineZ[k - 1]) / (lineZ[k] - lineZ[k - 1]), 0, 1)); };
    const lane = (r, w0, out) => {
      const c = Math.max(0, w0 - 1052), w = w0 - 0.7 * c * c / (c + 45);                    // the far slope slows them: they climb, and stay this side of the blue backs
      const t = Math.max(0, w - 850), split = r.smax * t * t / (t * t + 3600), sg      // the files peel off either side of the rhombus, turning away in rear three-quarter view
        = r.lane > 0 ? 1 : -1;
      out.x = trackAt(w) + r.lane * (1 - 0.5 * ss(w, 740, 790) * (1 - ss(w, 880, 930))) * (1 + 0.9 * (1 - ss(w, 530, 600))) + sg * (split + (r.peel || 0) * ss(w, 888, 926)) + 2.2 * Math.sin(w * 0.021 + r.sd * 6.28);
      // a runner with r.inside set, while w is under 600: xi is the x that lies r.inside + 18 * ss(w, 505, 560) metres toward +x of
      // lineAt(w); its x is mixed, by 1 - ss(w, 560, 600), from the x above to half of (that x + xi + the root of (their difference
      // squared + 36)), which is more than the greater of the two: by 3 m where they are equal, by less the further apart they are
      if (r.inside && w < 600) { const xi = lineAt(w) + r.inside + 18 * ss(w, 505, 560), d = out.x - xi; out.x = lerp(out.x, 0.5 * (out.x + xi + Math.sqrt(d * d + 36)), 1 - ss(w, 560, 600)); }
      out.z = w; out.y = groundY(out.x, out.z); return out;
    };
    const _l0 = new THREE.Vector3(), _l1 = new THREE.Vector3(), _hp = new THREE.Vector3();
    // which runners have r.inside set: each one whose lane is not over 0 and for which, at some z of the route from 500 to 600 in
    // steps of 0.5, the level distance from (lineAt(z), z) to its body line is under 3 m. Its body line: through its place at w (as
    // lane() gives it while its r.inside is not set; w as placeHerd reckons it for that z of the route), along the level direction
    // from that place to its place at w + 3, from 0.9 of its scale behind that place to 1.15 of its scale ahead of it. Of these, in
    // rising order of r.lane (the most negative first), the first has r.inside 7 and each next one 8 more than the one before it.
    const inside = runners.filter((r) => {
      if (r.lane > 0) return false;
      let near = Infinity;
      for (let zc = 500; zc <= 600; zc += 0.5) {
        const w = zc + leadAt(zc) - (A_RUN - r.ahead); lane(r, w, _l0); lane(r, w + 3, _l1);
        const fx = _l1.x - _l0.x, fz = _l1.z - _l0.z, fl = Math.hypot(fx, fz), px = lineAt(zc) - _l0.x, pz = zc - _l0.z, t = clamp((px * fx + pz * fz) / fl, -0.9 * r.sc, 1.15 * r.sc);
        near = Math.min(near, Math.hypot(px - fx / fl * t, pz - fz / fl * t));
      }
      return near < 3;
    });
    inside.sort((a, b) => a.lane - b.lane).forEach((r, k) => { r.inside = 7 + 8 * k; });
    let herdShown = -1;
    const placeHerd = (u) => {
      const zc = path.pointAt(u, _hp).z, on = u > 0.4 && zc >= ZA0 ? 1 : 0;
      if (!on && herdShown === 0) return;
      herdShown = on;
      const A = leadAt(zc);
      for (const r of runners) {
        const w = zc + A - (A_RUN - r.ahead);
        if (!on || w < 416) { r.mesh.setMatrixAt(r.i, ZERO); continue; }   // each one comes into being behind the lens, on the pass
        lane(r, w, _l0); lane(r, w + 3, _l1);
        const dx = _l1.x - _l0.x, dz = _l1.z - _l0.z, dy = _l1.y - _l0.y;
        setHorse(r.mesh, r.i, _l0.x, _l0.y + 0.02 * r.sc, _l0.z, Math.atan2(dx, dz), -Math.atan2(dy, Math.hypot(dx, dz)) * 0.85, r.sc);
      }
      herd.instanceMatrix.needsUpdate = true; herdC.instanceMatrix.needsUpdate = true;
      U.uStride.value = on ? (zc + A - ZA0 + 60) / 38 : 0;
    };
    placeHerd(0);
    // rare: the tower's own four leave their ledges once we are over the pass
    const towerM = []; for (let i = 0; i < 4; i++) { const m = new THREE.Matrix4(); hero.horses.getMatrixAt(i, m); towerM.push(m); }
    let towerGone = false;
    const setTower = (gone) => { if (gone === towerGone) return; towerGone = gone; for (let i = 0; i < 4; i++) hero.horses.setMatrixAt(i, gone ? ZERO : towerM[i]); hero.horses.instanceMatrix.needsUpdate = true; };
    await ctx.yield();
    // ---- flora: pointed leaf fans (each blade one curved emerald band, light down the midrib), swells of bush, bare red trunks --
    const _t3 = new THREE.Vector3(), _p3 = new THREE.Vector3();
    const sideOf = (u, lat, out) => { path.pointAt(u, _p3); path.tangentAt(u, _t3); const n = Math.hypot(_t3.x, _t3.z) || 1; out.set(_p3.x - _t3.z / n * lat, 0, _p3.z + _t3.x / n * lat); out.y = groundY(out.x, out.z); return _p3.y - out.y; };
    {
      const nS = 3, bp = [], bn = [], bb = [], bpt = [], bi = [];
      for (let i = 0; i <= nS; i++) {
        const t = i / nS, phi = t * 1.15, y = Math.sin(phi) / 1.15, z = (1 - Math.cos(phi)) / 1.15, w = 0.15 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.1)), 0.8);
        for (let j = -1; j <= 1; j++) {
          bp.push(j * w, y, z - Math.abs(j) * w * 0.35); bn.push(0, -Math.sin(phi), Math.cos(phi));
          bb.push(HUE.GREEN, j === 0 ? 1 : 0, t * 3.6, j * w * 3.6); bpt.push(0, 0.37, t, 0);
        }
        if (i < nS) { const a = i * 3; bi.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4); }
      }
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute('normal', new THREE.Float32BufferAttribute(bn, 3));
      bg.setAttribute('aBand', new THREE.Float32BufferAttribute(bb, 4)); bg.setAttribute('aPart', new THREE.Float32BufferAttribute(bpt, 4)); bg.setIndex(bi);
      const rF = rng.fork('flora'), nFan = Math.round(500 * detail * clamp(density, 0.8, 1.2)), fans = [];
      fans.push({ x: -6.6, z: Z0 + 13, big: 1 }, { x: 6.9, z: Z0 + 15, big: 1 }, { x: 7.4, z: Z0 + 31, big: 0.8 }, { x: -7.2, z: Z0 + 44, big: 0.8 });
      const v = new THREE.Vector3();
      for (let k = 0; k < nFan; k++) {
        const u = rF(), sgn = rF() < 0.5 ? -1 : 1, lat = sgn * (7 + Math.pow(rF(), 2) * 16);
        const hgt = sideOf(u, lat, v);
        if (hgt > 19 || hgt < 5.5 || path.distanceTo(v.x, v.y + 3, v.z) < 6.2) continue;
        const dT = Math.hypot(v.x - TOWER.x, v.z - TOWER.z); if (dT < 40) continue;
        fans.push({ x: v.x, z: v.z, big: 0 });
        if (k % 150 === 149) await ctx.yield();
      }
      let nB = 0; for (const f of fans) { f.n = 5 + Math.floor(rF() * 4); nB += f.n; }
      const leaves = new THREE.InstancedMesh(bg, bandMaterial(U, { crownK: 1.4, sway: 0.3, edge: 0.085, doubleSide: true }), nB);
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(0, 0, 0, 'YXZ'), S = new THREE.Vector3(), P = new THREE.Vector3();
      let b = 0;
      for (let fi = 0; fi < fans.length; fi++) {
        const f = fans[fi], y0 = groundY(f.x, f.z) - 0.15, yaw0 = rF() * 6.283, len0 = f.big ? 5.4 * f.big : rF.range(2.6, 5);
        for (let j = 0; j < f.n; j++) {
          const yaw = yaw0 + (j / f.n) * 6.283 + rF.range(-0.25, 0.25), tilt = rF.range(0.05, 0.75), len = len0 * rF.range(0.62, 1);
          E.set(tilt, yaw, 0); Q.setFromEuler(E); S.set(len * rF.range(0.9, 1.5), len, len); P.set(f.x, y0, f.z); M.compose(P, Q, S); leaves.setMatrixAt(b++, M);
        }
        if (fi % 120 === 119) await ctx.yield();
      }
      leaves.frustumCulled = false; scene.add(leaves);
      await ctx.yield();

      // bushes (single violet or green swells), trunks (one leaning red arc each, no crown), pasture humps (small backs)
      const FG = makeBandGeo(), nBush = Math.round(44 * (0.5 + 0.5 * detail));
      // No bush is laid where its swell would reach, level, the box of any of the six grazers (stand[1] to stand[6]) or the far
      // end of the doorkeeper's step. inBox(s, x, z, rr, a, b) is true where the point lies
      // within rr, level, of the plan box that runs from a to b along s's heading, measured from its origin (astern is
      // negative), and 0.35 of its scale to either side. A grazer's box runs from 0.9 of its scale astern to 1.25 ahead. The
      // doorkeeper's runs from 0.9 of its scale plus the length of its step (DOOR_STEP) astern to 0.15 of its scale short
      // of that: the strip its stern passes over in the last 0.15 of its scale of the step. A bush is asked with its radius
      // and the size of its lean added together, after all its draws: what the stream deals next does not depend on whether
      // the bush is laid. (The box is level and the seat pitches five of the six: the top of the pitched box passes the level
      // one by some 4.5 m for stand[4] and 4.1 m for stand[5]. By count on seeds 1 to 400 at the three details no bush
      // or hump stands in the pitched box of any of the six, and no trunk but the foot of one, 0.02 m into stand[3]'s on one
      // seed at detail 0.6.)
      const DOOR_STEP = Math.hypot(DOOR_X - DOOR.x, DOOR_Z - DOOR.z);
      const inBox = (s, x, z, rr, a, b) => { const fx = Math.sin(s.yaw), fz = Math.cos(s.yaw), dx = x - s.x, dz = z - s.z, t = dx * fx + dz * fz;
        return Math.hypot(Math.max(0, a - t, t - b), Math.max(0, Math.abs(dx * fz - dz * fx) - 0.35 * s.sc)) < rr; };
      const inHorse = (x, z, rr) => [1, 2, 3, 4, 5, 6].some((i) => inBox(stand[i], x, z, rr, -0.9 * stand[i].sc, 1.25 * stand[i].sc))
        || inBox(DOOR, x, z, rr, -0.9 * DOOR.sc - DOOR_STEP, -0.75 * DOOR.sc - DOOR_STEP);
      for (let k = 0; k < nBush; k++) {
        const u = rF.range(0.01, 0.99), lat = (rF() < 0.5 ? -1 : 1) * rF.range(12, 46); const hgt = sideOf(u, lat, v);
        const r = rF.range(2.6, 5.6), hh = r * rF.range(1.0, 1.5), hue = rF() < 0.5 ? HUE.VIOLET : HUE.GREEN, lean = rF.range(-0.25, 0.25) * r, sd = rF();
        if (hgt > 40 || path.distanceTo(v.x, v.y + hh * 0.5, v.z) < r + 7 || Math.hypot(v.x - TOWER.x, v.z - TOWER.z) < 58 || TRIO.some((q) => Math.hypot(v.x - q[0], v.z - q[1]) < 19)) continue;
        if (v.z < 300 && v.x > -6 && v.x < 34 + v.z * 0.05 && lat < 0) continue;        // keep the sight line from the entry to the tower open
        if (inHorse(v.x, v.z, r + Math.abs(lean))) continue;
        const x = v.x, z = v.z, y = v.y;
        loftBand(FG, { pts: [[x, y - 1.5, z], [x + lean * 0.5, y + hh * 0.5, z], [x + lean, y + hh, z]], rad: (t) => { const kk = capProfile(t, 0.35, 0.55); return [r * kk, r * 0.9 * kk]; }, ref: [0, 0, 1], hue,
          nSeg: 6, nRing: 10, ends: [0, 0.3], lobes: [[Math.PI / 2 - 0.5, 1.5], [-Math.PI / 2, 1.0]], limb: sd, sFloor: 0.05 });
        if (k % 8 === 7) await ctx.yield();
      }
      for (let k = 0; k < 12; k++) {
        const u = [0.035, 0.07, 0.11, 0.15, 0.2, 0.56, 0.62, 0.68, 0.74, 0.8, 0.86, 0.9][k] + rF.range(-0.012, 0.012), lat = (k < 5 ? 1 : (k % 2 ? 1 : -1)) * rF.range(k < 5 ? 24 : 17, 34); sideOf(u, lat, v);
        const hgt = rF.range(26, 33), ln = (k % 2 ? -1 : 1) * rF.range(5, 11), lz = rF.range(-5, 5), r0 = rF.range(1.2, 1.7);
        const cx = 14 * (v.z - Z0) / 247;                                      // nothing stands between the entry and the tower
        if (v.z < 330 && Math.abs(v.x - cx) < 34) { const off = rF.range(40, 58); for (const sg of [-1, 1, -1.7, 1.7]) { v.x = cx + sg * off; if (path.nearestXZ(v.x, v.z).dist > 15) break; } v.y = groundY(v.x, v.z); }
        // down the run the trunks stand outside the files, and never between the lens and what it is looking at
        if (k >= 5) { v.x = VAX + [39, 45, 41, 60, -56, 66, -50][k - 5]; v.z = [556, 608, 652, 742, 806, 884, 912][k - 5]; v.y = groundY(v.x, v.z); }
        const x = v.x, y = v.y, z = v.z;
        loftBand(FG, { pts: [[x, y - 2, z], [x + ln * 0.25, y + hgt * 0.35, z + lz * 0.3], [x + ln * 0.7, y + hgt * 0.72, z + lz * 0.7], [x + ln * 1.25, y + hgt, z + lz]],
          rad: (t) => { const r = lerp(r0, r0 * 0.3, t) * capProfile(t, 0, 0.12); return [r, r]; }, ref: [0, 0, 1], hue: ed.kind === 'moon' ? HUE.VIOLET : HUE.RED, nSeg: 14, nRing: 8, ends: [0, 0.1], limb: rF() });
      }
      await ctx.yield();
      const humps = [[38, 112, -0.3], [-84, 150, 0.2], [58, 150, 0.5], [78, 236, 0.2], [-58, 262, 0.1], [VAX + 43, 484, 1.45], [VAX - 43, 498, 1.7], [VAX - 36, 600, 1.4], [VAX + 80, 836, 1.7], [VAX - 38, 800, 1.5], [VAX + 44, 905, 1.2], [VAX - 52, 960, 1.9]];
      const HPG = makeBandGeo();
      humps.forEach((hp, k) => {
        const sc = rF.range(7, 11.5), wd = rF.range(48, 80), x = hp[0], z = hp[1];
        if (path.nearestXZ(x, z).dist < 26) return;
        addHillBack(HPG, { cx: x, z, yaw: hp[2], width: wd, scale: sc, baseY: groundY(x, z) - 3.5, hue: ed.pasture[k % 3 === 2 ? 1 : 0], flip: k % 2 === 0, depth: sc * 1.5, seed: rF(), nSeg: 20, nRing: 10 });
      });
      const fm = new THREE.Mesh(finishBandGeo(FG), hero.bandMaterial); fm.frustumCulled = false; scene.add(fm);
      await ctx.yield();
      const hpm = new THREE.Mesh(finishBandGeo(HPG), bandMaterial(U, { crownK: 0.09, heave: 0.6, flank: 5.5 })); hpm.frustumCulled = false; scene.add(hpm);
    }
    await ctx.yield();
    // ---- the yellow cow: one leap over the path at the pass, hind legs flung up, head thrown back and away ----------------------
    const cow = new THREE.Group();
    {
      const CG = makeBandGeo(), Yh = HUE.YELLOW, K = HUE.LINE, Bh = HUE.BLUE;
      const part = (pts, r0, r1, o = {}) => loftBand(CG, { pts, rad: (t) => { const k = capProfile(t, o.c0 ?? 0.25, o.c1 ?? 0.25), r = lerp(r0, r1, t) * k; return [r * (o.fx ?? 1), r * (o.fy ?? 1)]; }, ref: o.ref || [0, 1, 0], hue: o.hue ?? Yh,
        nSeg: o.nSeg ?? 10, nRing: o.nRing ?? 14, ends: [0.15, 0.15], limb: o.seed ?? 0.4, hull: o.hull, sFloor: o.sFloor ?? 0, lobes: o.lobes });
      part([[0, 0, -5.4], [0, 0.45, -0.4], [0, 0, 4.6]], 2.45, 2.3, { nSeg: 12, nRing: 18, seed: 0.21 });                    // barrel
      part([[0, 1.3, -2.6], [0, 1.15, -5.6], [0, -0.3, -7.3], [0, -1.4, -7.0]], 2.35, 1.3, { seed: 0.52, ref: [0, 1, -1], nRing: 16 });   // rump
      part([[0, 1.6, 2.6], [0, 0.7, 5.4], [0, -1.3, 5.7]], 2.1, 1.3, { seed: 0.83, ref: [0, 0, 1], nRing: 16 });               // shoulder
      part([[0, 1.0, 4.5], [0.1, 3.1, 6.5], [0.6, 4.7, 7.3]], 1.45, 0.95, { seed: 0.33, ref: [0, 0.3, -1], c0: 0.1 });         // neck
      part([[0.5, 4.5, 7.1], [1.3, 5.7, 7.9], [2.4, 5.6, 9.3]], 0.95, 0.52, { seed: 0.61, ref: [0, 1, 0], nSeg: 8 });          // head, thrown back and away
      await ctx.yield();
      for (const sx of [1, -1]) {
        part([[0.6 + sx * 0.5, 5.3, 7.3], [0.5 + sx * 1.0, 6.4, 7.0], [0.7 + sx * 0.8, 7.3, 7.5]], 0.2, 0.06, { hue: K, hull: false, nSeg: 6, nRing: 6, c1: 0, sFloor: 0.2 });   // horns
        part([[sx * 1.15, -0.8, 4.9], [sx * 1.15, -2.7, 7.3], [sx * 1.1, -3.1, 9.9]], 0.85, 0.36, { seed: 0.1 + sx * 0.05, c1: 0.08, nRing: 10 });      // forelegs reach
        part([[sx * 1.1, -3.05, 9.7], [sx * 1.1, -3.15, 10.5]], 0.4, 0.44, { hue: K, hull: false, nSeg: 2, nRing: 8, sFloor: 0.2, c0: 0.1, c1: 0.1 });
        part([[sx * 1.25, -0.4, -6.2], [sx * 1.35, 1.2, -8.9], [sx * 1.3, 3.7, -11.1]], 0.95, 0.36, { seed: 0.7 + sx * 0.05, c1: 0.08, nRing: 10 });   // hind legs flung up
        part([[sx * 1.3, 3.6, -10.95], [sx * 1.3, 4.3, -11.6]], 0.4, 0.44, { hue: K, hull: false, nSeg: 2, nRing: 8, sFloor: 0.2, c0: 0.1, c1: 0.1 });
        // the blue patches, lying on the hide
        part([[sx * 2.12, 1.3, -3.6], [sx * 2.3, 0.4, -1.6], [sx * 2.15, 0.9, 0.6]], 1.25, 1.0, { hue: Bh, hull: false, fx: 0.3, ref: [sx, 0, 0], seed: 0.44, nSeg: 8, nRing: 10, sFloor: 0.15 });
        part([[sx * 1.75, 1.6, 2.6], [sx * 1.95, 0.6, 4.2], [sx * 1.5, -0.4, 5.3]], 0.95, 0.7, { hue: Bh, hull: false, fx: 0.3, ref: [sx, 0, 0], seed: 0.9, nSeg: 8, nRing: 10, sFloor: 0.15 });
        await ctx.yield();
      }
      part([[0, 2.3, -4.2], [0, 2.55, -2.0], [0, 2.5, 0.4]], 1.3, 1.0, { hue: Bh, hull: false, fy: 0.3, ref: [0, 1, 0], seed: 0.15, nSeg: 8, nRing: 10, sFloor: 0.15 });
      part([[0, 1.9, -6.9], [0, 4.2, -8.7], [0.5, 6.6, -8.4]], 0.34, 0.13, { seed: 0.27, nSeg: 10, nRing: 6, c1: 0 });         // tail
      part([[0.5, 6.4, -8.45], [0.7, 7.5, -8.1]], 0.3, 0.42, { hue: K, hull: false, nSeg: 3, nRing: 6, sFloor: 0.2 });
      const cm = new THREE.Mesh(finishBandGeo(CG), bandMaterial(U, { crownK: 0.5, heave: 1 })); cm.frustumCulled = false; cow.add(cm);
    }
    cow.rotation.order = 'YXZ'; cow.scale.setScalar(1.15); scene.add(cow);
    const pPass = path.pointAt(uPass, new THREE.Vector3()), gPass = groundY(VAX, pPass.z);
    const uCow = uPass - 35 / L, uCow0 = uCow - 0.047, uCow1 = uCow + 0.047;
    const cowTop = Math.max(pPass.y + 7.5, path.pointAt(uCow, new THREE.Vector3()).y + 8.5);      // its belly passes over the lens: seen against hills and sky, not against the ground
    // its second leap, down in the run: port to starboard across the valley ahead of the lens, whole against the blue backs
    const uVista = uAt(VAX - 34, 690);      // the valley opens: the sun gate at its end, the herd streaming down to it
    const cowAt = (u, out) => {
      const t = clamp((u - uCow0) / (uCow1 - uCow0), 0, 1), k = 2 * t - 1;
      out.set(pPass.x - 40 * k, cowTop - (cowTop - (gPass - 16)) * k * k, pPass.z + 4 * k);   // port (+X) to starboard (-X)
      return k;
    };
    const placeCow = (u) => { const k = cowAt(u, cow.position); cow.rotation.set(k * 0.6, -Math.PI / 2, 0); };
    placeCow(0);
    await ctx.yield();

    // ---- weather: wedges of tinted air, leaning slabs that multiply the paint behind them -------------------------------------
    const wedges = [];
    {
      const rW = rng.fork('wedges'), hexOf = (h) => { const c = U.uHue.value[h].clone(); c.multiplyScalar(1 / Math.max(c.r, c.g, c.b, 1e-3)); return '#' + c.getHexString(); },   // tinted light: the hue at full value, so it colours more than it darkens
         geos = [makeWedgeGeometry(20, 150), makeWedgeGeometry(27, 190)];
      const add = (x, y, z, yaw, leanDeg, hueIx, big) => {
        const g = geos[big ? 1 : 0], m = new THREE.Mesh(g, wedgeMaterial(U, hexOf(hueIx), { W: g.userData.W, L: g.userData.L, phase: rW(), strength: 0.34 }));
        m.position.set(x, y, z); m.rotation.set(0, yaw, THREE.MathUtils.degToRad(leanDeg) * ed.lean); m.renderOrder = 50; m.frustumCulled = false; scene.add(m);
        m.updateMatrixWorld(true); wedges.push({ m, n: new THREE.Vector3(0, 0, 1).transformDirection(m.matrixWorld), p: m.position.clone() });
      };
      const wh = ed.wedges, pk = (i) => wh[i % wh.length];
      add(-30, 44, Z0 + 58, 0.1, 30, ed.kind === 'noon' ? HUE.YELLOW : wh[0], false);       // overhead in the first frame
      add(6, 30, 152, -0.15, 24, pk(0), true); wedges[wedges.length - 1].near = 1;               // the first crossing: the frame goes green (it comes up only as we reach it: from the entry the tower stands in its own clear ultramarine)
      add(VAX + 4, 40, 622, 0.2, -27, ed.kind === 'evening' ? HUE.RED : HUE.VIOLET, true);      // the run: violet, then yellow
      add(VAX - 6, 14, 762, -0.2, 25, HUE.YELLOW, true);
      add(VAX - 58, -2, 1000, 0.5, 26, pk(0), false); add(VAX + 60, -2, 1004, -0.5, -26, pk(1), false); add(VAX + 96, 8, 1040, 0.5, -20, pk(2), true);   // the exit's diamond
      const nMore = Math.max(0, ed.nWedge - 1 - wedges.length);
      for (let i = 0; i < nMore; i++) {
        const u = (i + 0.5) / nMore * 0.94 + rW.range(-0.02, 0.02), sgn = i % 2 ? 1 : -1, v = new THREE.Vector3(); sideOf(clamp(u, 0, 1), sgn * rW.range(48, 120), v);
        add(v.x, v.y + rW.range(30, 55), v.z, rW.range(-0.7, 0.7), sgn * rW.range(20, 35), pk(i + 1), i % 3 === 0);
      }
    }
    await ctx.yield();
    // ---- the exit: a rhombus of four broad bands, standing where three wedges cross ---------------------------------------------
    const pEnd = path.end.clone();
    {
      const PG = makeBandGeo(), hx = 19, hy = 25.5, hues = [HUE.BLUE, HUE.VIOLET, HUE.LBLUE, HUE.GREEN];
      const V = [[0, hy], [-hx, 0], [0, -hy], [hx, 0]];
      for (let i = 0; i < 4; i++) {
        const a = V[i], b = V[(i + 1) % 4], mx = (a[0] + b[0]) * 0.5, my = (a[1] + b[1]) * 0.5, ml = Math.hypot(mx, my) || 1, bow = 1.5;
        const ax = a[0] + (a[0] - b[0]) * 0.1, ay = a[1] + (a[1] - b[1]) * 0.1, bx = b[0] + (b[0] - a[0]) * 0.1, by = b[1] + (b[1] - a[1]) * 0.1;
        loftBand(PG, { pts: [[pEnd.x + ax, pEnd.y + ay, pEnd.z + 0.6], [pEnd.x + mx + mx / ml * bow, pEnd.y + my + my / ml * bow, pEnd.z + 0.6], [pEnd.x + bx, pEnd.y + by, pEnd.z + 0.6]],
          rad: (t) => { const k = capProfile(t, 0.1, 0.1); return [2.1 * (0.55 + 0.45 * k), 3.7 * (0.55 + 0.45 * k)]; }, ref: [0, 0, -1], hue: hues[i], nSeg: 16, nRing: 12, ends: [0.06, 0.06],
          lobes: [[-Math.PI / 2 + 0.3, 1.5]], seam: Math.PI / 2, limb: 0.2 + i * 0.21, sFloor: 0.1 });
      }

      // the sun the herd runs to: one great lemon swell behind the rhombus, deep cadmium at its contour, and one vermilion bow
      // over it (the picture's own arc), both standing against the ultramarine backs. Paint only: nothing glows but the colour.
      {
        const sx = pEnd.x, sy = pEnd.y + 9, sz = pEnd.z + 15, R = 31;
        loftBand(PG, { pts: [[sx - R, sy, sz], [sx + R, sy, sz]], rad: (t) => { const q = 2 * t - 1, r = R * Math.sqrt(Math.max(0, 1 - q * q)); return [0.11 * r + 0.02, r + 0.02]; }, ref: [0, 1, 0], hue: ed.kind === 'moon' ? HUE.LBLUE : HUE.YELLOW,
          nSeg: 30, nRing: 20, ends: [0.3, 0.3], lobes: [[0, 1.45]], seam: Math.PI, limb: 0.63, sFloor: 0.05, unit: 0.3 });      // unit: the brush on the sun is three times as broad as on a flank
        const bow = (r0, tube, hue, a0, a1, dz, limb) => loftBand(PG, { at: (t, out) => { const a = lerp(a0, a1, t); return out.set(sx + Math.cos(a) * r0, sy + Math.sin(a) * r0 * 1.04, sz + dz); },
          rad: (t) => { const k = capProfile(t, 0.06, 0.06); return [tube * (0.5 + 0.5 * k), tube * 1.25 * (0.5 + 0.5 * k)]; }, ref: [0, 0, -1], hue, nSeg: 36, nRing: 10, ends: [0.05, 0.05], lobes: [[-Math.PI / 2 + 0.3, 1.9]], seam: Math.PI / 2, limb, sFloor: 0.3 });
        bow(40.5, 5.4, ed.kind === 'evening' ? HUE.YELLOW : HUE.RED, -0.5, Math.PI + 0.5, 6, 0.37);
        bow(56, 5.2, ed.kind === 'evening' ? HUE.RED : ed.kind === 'moon' ? HUE.LBLUE : HUE.YELLOW, -0.4, Math.PI + 0.4, 13, 0.81);
      }
      await ctx.yield();
      const pm = new THREE.Mesh(finishBandGeo(PG), bandMaterial(U, { crownK: 0.28, heave: 1 })); pm.frustumCulled = false; scene.add(pm);
    }
    await ctx.yield();

    // ---- pace: linger at the doorkeeper and along the marked flank, hurry the run ----------------------------------------------
    const uHerd = uAt(VAX - 34, 600), uTrio = uAt(VAX + 24, 798);
    const knots = [[0, 0.7], [0.04, 0.7], [0.17, 1], [uFlank, 0.58], [uBehind, 0.62], [uCow, 0.85], [uHerd - 0.05, 1.35], [uHerd, 1.0], [uVista, 1.1], [uTrio, 0.72], [uTrio + 0.06, 1.1], [0.9, 0.95], [1, 0.95]];
    const trioC = new THREE.Vector3(VAX + 44, groundY(VAX + 44, 820) + 11, 820);
    const pace = (u) => { for (let i = 1; i < knots.length; i++) if (u <= knots[i][0]) { const a = knots[i - 1], b = knots[i]; return lerp(a[1], b[1], ss(u, a[0], b[0])); } return 0.95; };
    const towerC = toW(hero.center);
    const l0 = hero.anchors.ledges[0], flankC = toW(l0.position).add(new THREE.Vector3(0, l0.scale * 1.25, 0));
    const rumpC = toW(l0.position.clone().addScaledVector(lay.h, -l0.scale * 0.35).add(new THREE.Vector3(0, l0.scale * 0.85, 0))), stackC = toW(O.clone().setY(35)), l3 = hero.anchors.ledges[3], topC = toW(l3.position.clone().add(new THREE.Vector3(0, l3.scale * 0.9, 0)));
    // ---- the gaze. One poi does all of it: who is looked at (the tower, the marked flank, the rump, the stack from behind) and
    // how strongly (k) are both functions of u. The engine mixes a poi into the look-ahead chord with a fixed weight; to hold the
    // tower through a wrap where it stands at right angles to the route (and to give the steady camera, which takes a third of
    // any weight, as much of it as it can have) the poi is given a weight over 1 and aimed so that the mix lands on the gaze wanted.
    const LOOK = 22, POI_W = 2.5, gF = 0, gT = 0.9, gFade = (gT - gF) * 0.04;
    const _cw = new THREE.Vector3(), _gp = new THREE.Vector3(), _gc = new THREE.Vector3(), _gg = new THREE.Vector3(), _gt = new THREE.Vector3(), _poi = new THREE.Vector3();
    const gazeAt = (time, u) => {
      _gt.lerpVectors(towerC, flankC, ss(u, uFlank - 0.07, uFlank - 0.02));
      _gt.lerp(rumpC, ss(u, uFlank - 0.005, uFlank + 0.02)).lerp(stackC, ss(u, uFlank + 0.02, uBehind - 0.01)).lerp(topC, ss(u, uTop, uOut));
      const k = (0.5 + 0.12 * ss(u, uFlank - 0.075, uFlank - 0.03) + 0.3 * ss(u, uFlank - 0.01, uFlank + 0.02)) * ss(u, 0, 0.03) * (1 - ss(u, uCow - 0.004, uCow + 0.03));
      path.pointAt(u, _gp); path.posAtDist(u * L + LOOK, _gc); _gc.sub(_gp).normalize();
      _gt.sub(_gp).normalize();
      cowAt(u, _cw); _cw.sub(_gp).normalize(); _gt.lerp(_cw, ss(u, uCow - 0.027, uCow - 0.008)).normalize();      // from the top horse the gaze swings straight to the rising cow
      _gg.copy(_gc).multiplyScalar(1 - k).addScaledVector(_gt, k).normalize();          // the gaze wanted
      // the run: the herd in profile below us, then the three on the knoll, then the cow's second leap
      const kH = 0.9 * ss(u, uHerd - 0.07, uHerd - 0.02) * (1 - ss(u, uHerd + 0.025, uHerd + 0.06));
      const kT = 0.9 * ss(u, uTrio - 0.06, uTrio - 0.02) * (1 - ss(u, uTrio + 0.02, uTrio + 0.05));
            if (kH > 0) { _cw.set(VAX + 4, groundY(VAX, _gp.z + 36) + 5, _gp.z + 36).sub(_gp).normalize(); _gg.lerp(_cw, kH).normalize(); }
      const kV = 0.85 * ss(u, uVista - 0.045, uVista - 0.015) * (1 - ss(u, uVista + 0.02, uVista + 0.05));
      if (kV > 0) { _cw.set(VAX + 6, pEnd.y + 2, pEnd.z).sub(_gp).normalize(); _gg.lerp(_cw, kV).normalize(); }      // the valley opens: the sun at its end
      if (kT > 0) { _cw.copy(trioC).sub(_gp).normalize(); _gg.lerp(_cw, kT).normalize(); }
      const kG = 0.9 * ss(u, uTrio + 0.03, uTrio + 0.07);      // then the gate and its sun, held in the middle as we come back to the axis
      if (kG > 0) { _cw.set(pEnd.x, pEnd.y + 7, pEnd.z).sub(_gp).normalize(); _gg.lerp(_cw, kG).normalize(); }
      const w = ss(u, gF, gF + gFade) * (1 - ss(u, gT - gFade, gT)) * POI_W * ss(u, 0, 0.04) * (1 - ss(u, 0.93, 0.985));
      if (w > 0.55) {
        const gc = _gg.dot(_gc), lam = -(w - 1) * gc + Math.sqrt(Math.max(0, (w - 1) * (w - 1) * gc * gc + 2 * w - 1));
        _gg.multiplyScalar(lam).addScaledVector(_gc, w - 1).normalize();
      }
      return _poi.copy(_gp).addScaledVector(_gg, 200);
    };
    const _cp = new THREE.Vector3();
    return {
      scene, path, duration: 44, pace,
      moments: { flank: uFlank, behind: uBehind, top: uTop, out: uOut, cow: uCow, pass: uPass, herd: uHerd, vista: uVista, trio: uTrio },      // where the beats fall on this seed's path (for shots/.../beats.json)
      camera: { fov: 57, near: 0.3, far: 4000, lookAhead: 22, sway: 0.8, bank: 0.3 },
      pois: [{ at: gazeAt, from: 0, to: gT, weight: POI_W, fade: 0.04 }],
      portal: { shape: 'circle', radius: 10, color: '#F7DA76', glow: 0.25, revealDistance: 460, blendDistance: 40 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        hero.setProgress(u); hero.update(dt, time, camera);
        placeHerd(u); placeCow(u);
        if (rare) setTower(u * L - dRef > -30);
        camera.getWorldPosition(_cp);
        placeDoor(_cp.distanceTo(DOOR_MID));      // the doorkeeper gives way
        if (hero.wedge) hero.wedge.material.uniforms.uWedgeOn.value = 1 - ss(Math.hypot(_cp.x - TOWER.x, _cp.z - TOWER.z), 110, 190);      // far off, the tower stands in its own pure ultramarine
        for (const w of wedges) { const d = Math.abs((_cp.x - w.p.x) * w.n.x + (_cp.y - w.p.y) * w.n.y + (_cp.z - w.p.z) * w.n.z); w.m.material.uniforms.uWedgeOn.value = ss(d, 1.5, 10) * (w.near ? 1 - ss(d, 16, 30) : 1); }
      },
      dispose() { hero.dispose?.(); },
    };
  },
};
