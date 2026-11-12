// THE WAVE AND WHAT IT PAINTS: hero set piece of "the-toppling" (a domino run through a house built
// 25x life size). One system of about 6,600 ivory tiles (2 m tall, 1 m wide, 0.3 m thick):
//   * THE LINE   about 800 tiles 1.1 m apart standing 4 m to the right of the camera path for the whole
//                880 m flight: across the floor, up the atlas, along the bridge and up the book ramp. From
//                station 235 on (where it leaves the floor) it stands on a boxwood yardstick that this
//                module builds, so the tiles never float whatever is put under them.
//   * THE FAN    about 5,400 tiles in the hall, a 150 m fan of curving quills that split again and again,
//                ivory until the wave passes, then a picture: peacock (28 eyes in three arcs), sunflower,
//                two koi or a kingfisher (opts.design).
//   * THE NECK   a card-house of painted tiles stood on end in six tiers, 14 m + crest, beyond the apex.
//   * THE ARCH   about 320 tiles corbelled into a gateway 22 m across and 22 m high with three painted
//                string courses and a row of standing tiles on top; the exit portal sits in it.
//   * the cobalt (or amber) glass marble and its brass stair-rod chute on cotton reels down the aisle,
//     a blue sun shadow for every tile (analytic, swings down with the tile), dust puffs where tiles land.
//
// COORDINATES (hero-local, metres). The camera travels toward -Z; station s of the brief (0..880) is
// z = 480 - s. Floor y = 0. Windows / sun side = +X (right). Fan apex (0,0,-80), rim arc r = 150 (z = +70
// on the axis). Origin = middle of the fan floor. Arch foot at (0, 31, -399), i.e. on a 31 m tower that
// the WORLD builds. Front = +Z: the fan is meant to be seen from +Z, from 9-20 m up.
//
// HOW THE FALL IS DONE (and two deliberate cheats; keep them when matching the look):
//   Everything is in the vertex shader. Each tile has a trigger value; lean = f((front - trigger) / width),
//   turning it about its lower edge to rest at 72 degrees on its neighbour with a small rebound, so about
//   ten tiles are in mid-fall at once. Line tiles: trigger = station, they fall forward (-Z along the path).
//   Fan tiles: trigger = distance from the strike point (anchors.strike). They fall TOWARD THE APEX, away
//   from the viewer, while the front runs toward the viewer: a tile that falls our way would show us only
//   its top edge from a 9-20 m eye (its upper face slopes away), so the fall is reversed; what the eye
//   sees is each tile lying back like a shingle with its upper face tilted 18 degrees up at us and at the sun.
//   Second cheat: the face that ends uppermost is plain ivory with a brass pin while the tile stands and
//   takes its paint as it leans (physically it would have to be painted from the start).
//
// PROGRESS (all pure functions of what the world passes; nothing here runs on wall-clock except small
// ambient motion: glitter, settle wobble, arch shiver). Until one of these is called the piece runs a
// demo loop on `time` so the viewer shows it alive.
//   hero.setProgress(u, lead = 9)   the brief's whole schedule from the path's u, assuming the path is built
//                                   on anchors.flyThrough (station = 880 u): line front = station + lead,
//                                   marble 0.40..0.47, fan 0.47..0.60, second line (rare) from 0.22,
//                                   arch shiver 0.93..1.
//   hero.setLineFront(s)            station of the crest of the line (tiles behind it are down). The brief
//                                   wants it abreast; put it 6-10 m AHEAD of the eye or it is out of frame.
//   hero.setFanFront(m)             radius of the fan's front from the strike, 0..anchors.fanFrontMax.
//   hero.setSecondFront(s)          the rare second line (left side, starts at anchors.second.start).
//   hero.setMarble(v)               0..1 the cobalt marble down its chute (1 = it strikes).
//   hero.setShiver(k)               0..1 the arch trembling.
//   hero.setLight({ sunDir, sunColor, skyColor, bounceColor, shadowColor, shadowStrength, sunAmount })
//                                   see LIGHT.   hero.setWindows([...]) see OPTS.windows.
//
// LIGHT    Own shaders, no three.js lights, no textures. sunDir = direction TOWARD the sun in world space
//          (default the brief's ten o'clock: (0.557, 0.616, 0.557), from the right and behind), sunColor
//          linear HDR (default warm white x 2.3), skyColor (cool fill from above), bounceColor (warm, from
//          below). Ivory albedo is 0.74. opts.windows restricts direct sun to the window shapes (tiles and
//          their shadows outside the shapes get no sun and cast none); without it everything is in sun.
//          sunAmount 0 = overcast (no sun, no shadows). Low evening sun: just pass the lower sunDir, the
//          shadows lengthen by themselves. Fog supported. Bloom should only catch the pins and the marble.
// OPTS     palette   7 hex strings (ivory, honey, shadow blue, sun white, peacock green, deep blue, gold)
//          design    'peacock' | 'sunflower' | 'koi' | 'kingfisher' (default: by seed, peacock most often;
//                    kingfisher when ctx.vary.hour is 'golden')
//          rare      build the second line on the left (default ctx.vary.rare)
//          windows   [{ x, y, z, w, h }] rectangles in walls x = const (centre; w along z, h up), max 8; roofs [{ x, z, w, d }] roof
//                    lights at y = roofY, max 4; splitZ: windows with z above it light only points above it (two rooms)
//          lineDrop  (s) => metres the line's foot lies below the default (eye - 2.5), e.g. to keep it out of the view over the fan
//          apexZ (default -80) slides the fan along the axis; rim (150 m) and phi (0.497 rad half-angle) resize it; neckAt [x,y,z]
//          branches  [{ from:[x,y,z], to:[x,y,z], trig }] short side runs of line tiles; chuteX (default -3)
//          slats     [pitch, open] shutter bars across the windows (metres, fraction), default none
//          eye       (s) => [x, y, z] replaces the default path of the eye (the line follows it 4 m right)
//          archAt    [x, y, z] foot of the arch (default [0, 31, -399]);  neckAt [x, y, z] (default [9, 0, -92])
//          marbleColor hex (default cobalt, amber on some seeds); sunDir / sunColor / skyColor / bounceColor
//          lineY (s) => height of the line's foot (replaces eye - 2.5 - lineDrop); lineOffset (s) => metres right of the eye
//          aisle     half-width of the strip left clear along the axis for the line (default: the old 6 m chute), notch widens
//                    it round the neck (extra metres at the apex, gone by r = 22), clipX cuts the fan at |x| (side walls)
//          strikeR   how far in front of the apex the marble strikes (14); arcs [{ r, n }] the peacock's three rows of eyes
//          neckTiers [[x offset, tiles across], ...] bottom to top (default six tiers); secondFrom station of the rare line
//          windows may hold up to 11 rectangles. The fan's tiles carry no narrow side faces (6 triangles each).
//          lineEye   (s) => [x, y, z] the path the LINE is laid beside, when the eye swings away from it (default: eye)
//          arch      { inner, outer, spring, courses } resizes the gateway (default 7.6, 11, 10.4, 20)
//          wall      { z, cy, r0, r1, yMin, hole, skip(x, y) } a round-headed panel of tiles on shelves on the end wall z = const,
//                    centre height cy, sunburst from radius r0 to r1; hero.setWallFront(m) runs its wave out from the centre
//                    (0..anchors.wallFrontMax); each tile tips back against the wall and takes its paint; setWallFront(m, m2):
//                    m2 is a second front that rocks each tile once more and lays a second picture (eyes) into the first
// ANCHORS  station(s) -> Vector3 eye position at station s;   eyeStations: 45 Vector3 every 20 m
//          flyThrough   ordered Vector3 list, the brief's eye path (s 0..880): level 2.5 m to s 235, up to 9 m,
//                       9 -> 20 m over the fan axis, the ramp swinging 30 m left and up to 38 m, last 60 m level.
//                       Clear of every tile by >= 3.5 m (the brief waives 6 m for the line); >= 6 m from the
//                       fan, neck and arch stones.
//          portalSeat   { position (0,38,-400), facing (0,0,1), shape:'arch', width:14, height:17.5, radius:7 }
//          arch { foot, inner:7.6, outer:11, spring:10.4, top:22.2 }, neck { foot, top, height }
//          fan { apex, rim, halfAngle, aisle }, strike (where the marble hits), fanFrontMax
//          line { offset:4, base(s) -> Vector3 foot of the line at station s, rulerFrom:235 }
//          second { start, base(s) } (rare line, 4 m left), chute { points[], x }, marble(v) -> Vector3
//          viewpoints { entry, crest, rim, peacock, arch }, lookAt (middle of the fan)
// COST     about 109k triangles (131k with the rare line), 6 draw calls, 5 shader programs, no lights, no
//          textures; build 60-140 ms of JS with yields. radius 70 / height 80 / center (0,26,-10) are framing hints
//          for the set-piece viewer (the fan); the line runs 480 m either way and the arch stands at z = -399.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#E9DFC6', '#C8923F', '#5E7FB4', '#F6F1E4', '#137E8C', '#1E3F9A', '#D9A62B'];
const ZS = 480, S_END = 880, APEX_Z0 = -80, RIM = 150, PHI = 0.497, PITCH = 1.1;
const TH = 2, TW = 1, TT = 0.3, REST = 1.2566;   // tile height, width, thickness, rest angle (72 deg)

const lin = (hex) => new THREE.Color(hex);
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const hash2 = (a, b) => hash1(a * 1.37 + b * 71.13 + 0.5);
const vnoise = (x, y) => {            // small value noise for the painted designs
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return lerp(lerp(hash2(xi, yi), hash2(xi + 1, yi), u), lerp(hash2(xi, yi + 1), hash2(xi + 1, yi + 1), u), v);
};

// ---- the brief's path of the eye, by station ----
function defaultEye(s) {
  let y = 2.5;
  if (s > 235) y = 2.5 + 6.5 * smoothstep(235, 275, s);
  if (s > 400) y = 9 + 11 * smoothstep(392, 568, s);
  if (s > 560) y = Math.max(y, 20 + 18 * smoothstep(560, 822, s));
  let x = 0;
  if (s > 560 && s < 820) { const k = Math.sin(Math.PI * (s - 560) / 260); x = -30 * k * k; }
  return [x, y, ZS - s];
}

// ---- the pictures hidden in the fan: (r from the apex, a = angle / half-angle in -1..1, w = signed arc metres) -> paint index ----
function makeDesign(name, P, rng, opts = {}) {
  const ivory = lin(P[0]), honey = lin(P[1]), shade = lin(P[2]), green = lin(P[4]), blue = lin(P[5]), gold = lin(P[6]);
  const mix = (a, b, t) => a.clone().lerp(b, t);
  if (name === 'sunflower') {
    // A whole sunflower head lying in the middle of the floor, seen from above: a dark disc of seeds in crossing spirals,
    // a front row of gold petals with orange hearts, a back row of orange petals with burnt tips, on a cobalt ground
    // with teal ripples; a green stem runs to the apex between two leaves and two more leaves fill the near corners.
    // Laid out in true metres on the floor (X across, D from the apex), big flat shapes several tiles wide.
    const goldD = lin('#e2a218'), orange = lin('#e3661a'), sienna = lin('#96381a'), cobalt = lin('#1b3ea6'), teal = lin('#128c9a'), leaf = lin('#4a9a2c'), leafD = lin('#1c5424'),
      dark = lin('#1c0e08'), umber = lin('#562a10'), cream = lin('#f1e3b4');
    const RIMk = opts.rim ?? RIM, PHIk = opts.phi ?? PHI, Q = 230 / RIMk, CD = 118, RD = 26, nP = 17, off = rng.range(0, 1), sa = 7 + rng.int(0, 2), sb = sa + 5;
    const leafAt = (X, D, cx, cy, rx, ry, rot) => {
      const c = Math.cos(rot), sn = Math.sin(rot), u = ((X - cx) * c + (D - cy) * sn) / rx, v = (-(X - cx) * sn + (D - cy) * c) / ry;
      if (Math.abs(u) >= 1) return -1;
      const hw = Math.pow(1 - u * u, 0.8), av = Math.abs(v);
      if (av > hw) return -1;
      if (av > hw - 0.16) return 6;
      if (av < 0.09) return 9;
      return Math.abs((((u * 3.5 - av * 1.3) % 1) + 1) % 1 - 0.5) < 0.1 ? 6 : 5;
    };
    const petal = (rho, th, o, len, hwMax) => {       // -1 outside, else [q along the petal, how far inside its edge, |f|]
      const q = (rho - RD + 2) / len; if (q <= 0 || q >= 1) return null;
      const f = Math.abs(((((th / (Math.PI * 2)) * nP + o) % 1) + 1) % 1 - 0.5);
      const hw = hwMax * (q < 0.42 ? 0.6 + 0.4 * Math.sin(Math.PI * 0.5 * q / 0.42) : Math.pow(Math.cos(Math.PI * 0.5 * (q - 0.42) / 0.58), 0.75));
      return f < hw ? [q, (hw - f) * rho * 6.2832 / nP, f] : null;
    };
    return {
      paints: [goldD, orange, sienna, cobalt, teal, leaf, leafD, dark, umber, cream, lin('#e6c25e')], line: [0, 3, 1, 4, 2, 0, 9], neck: [6, 5, 5, 5, 0, 1], crest: 1,
      wall: { bg: 3, rays: [0, 1], edge: 2, disc: 0, ring: 9, dark: 7, eye: [2, 10, 4, 7] },
      fn(r, a, w) {
        if (r > 146.5) return 7;
        if (r > 143) return (Math.floor(Math.abs(w) / 3.6) & 1) ? 0 : 9;
        const rr = r * RIMk / RIM, psi = a * PHIk, X = rr * Math.sin(psi) * Q, D = rr * Math.cos(psi) * Q, ax = Math.abs(X);
        const dy = D - CD, rho = Math.hypot(X, dy), th = Math.atan2(X, dy);
        if (rho < RD) {
          if (rho > RD - 2.6) return 7;
          if (rho < 6.5) return (Math.sin(rho * 1.3 + th * 5) > 0.2) ? 6 : 8;
          const sp = Math.sin(rho * 0.62 + th * sa) * Math.sin(rho * 0.62 - th * sb);
          return sp > 0.3 ? 2 : sp < -0.25 ? 7 : 8;
        }
        let p = petal(rho, th, off, 38, 0.47);
        if (p) return p[1] < 1.5 ? 2 : (p[2] < 0.05 && p[0] < 0.8) ? 1 : p[0] < 0.26 ? 1 : 0;
        p = petal(rho, th, off + 0.5, 49, 0.42);
        if (p) return p[1] < 1.5 ? 8 : p[0] > 0.8 ? 2 : 1;
        let k = leafAt(ax, D, 24, 30, 24, 10.5, 0.5); if (k >= 0) return k;
        k = leafAt(ax, D, 61, 197, 19, 9, 0.5); if (k >= 0) return k;
        if (D < 50 && ax < 4.6) return ax > 3.2 ? 6 : 5;
        return (((rho * 0.085) % 1) < 0.24) ? 4 : 3;
      },
    };
  }
  if (name === 'koi') {
    const white = lin('#efe9dc'), red = lin('#c93a22'), pink = lin('#eea2ae'), aqua = lin('#4fb3b4'), pale = lin('#b9e2d8'), teal = mix(green, lin('#0c3b46'), 0.45), orange = lin('#e58a2c');
    const ph = rng.range(0, 6.28), wig = rng.range(4, 7);
    return {
      paints: [white, red, pink, aqua, teal, orange, pale], line: [1, 0, 2, 3, 0, 1, 5], neck: [3, 3, 2, 0, 1, 1], crest: 1,
      wall: { bg: 4, rays: [0, 1], edge: 5, disc: 5, ring: 6, dark: 4, eye: [6, 5, 3, 4] },
      fn(r, a, w) {
        const sd = a < 0 ? -1 : 1, A = Math.abs(a);
        let q = (r - 34) / 104; if (sd > 0) q = 1 - q;                 // left koi swims to the apex, right koi to the rim
        if (q > 0 && q < 1) {
          const wc = sd * (r * PHI * 0.52 + 3) + wig * Math.sin(r / 17 + ph * sd), d = Math.abs(w - wc);
          const body = q < 0.78 ? 7.2 * Math.pow(Math.sin(Math.PI * Math.pow(q / 0.78, 0.75) * 0.94 + 0.1), 0.8) + 0.6 : 0;
          if (q < 0.78 && d < body) {
            if (q > 0.05 && q < 0.09 && d > body * 0.45 && d < body * 0.8) return 4;                 // eyes
            if (d > body - 1.0) return 4;
            const nz = vnoise(r * 0.085 + 31 * sd, w * 0.085 + 7);
            return nz > 0.5 ? (vnoise(r * 0.3, w * 0.3) > 0.74 ? 5 : 1) : 0;
          }
          if (q >= 0.74) { const fan = 1.5 + (q - 0.74) * 46; if (d < fan) return (Math.floor(d * 0.9 + q * 30) & 1) ? 2 : 0; }
          if (q > 0.2 && q < 0.36 && d < body + 5.5 * Math.sin(Math.PI * (q - 0.2) / 0.16)) return 2;   // pectoral fins
        }
        const rip = Math.sin(Math.hypot(r - 70, w - 20 * sd) * 0.55);
        return rip > 0.8 ? 6 : (vnoise(r * 0.05, w * 0.05 + 40) > 0.7 ? 4 : (rip < -0.86 ? 2 : 3));
      },
    };
  }
  if (name === 'kingfisher') {
    // A kingfisher on its perch, in profile, head up (toward the apex) and bill to the right: one big silhouette on a
    // dark teal ground, the disc of the low sun behind its head. Turquoise crown, back and wing, a burnt-orange cheek and breast, a white throat and a white
    // patch on the neck, one dark eye, a long dark bill, a short blue tail, orange feet on a brown branch. Laid out in
    // metres on the floor (X across, D from the apex) as an ANAMORPHOSIS: the bird is drawn flat on the picture plane of an
    // eye 79.5 m up and 11 m inside the rim, looking 33 degrees down (where the flight is at station 481), and thrown from
    // there onto the floor. From that place it stands upright and whole; from anywhere else it stretches, as such
    // pictures do.
    const turq = lin('#10b4d2'), sea = lin('#2259c6'), orange = lin('#e4601a'), white = lin('#f3eee0'), dark = lin('#0a1730'), light = lin('#86e8f2'), apricot = lin('#f59a3c'),
      teal = lin('#0a4650'), tealL = lin('#116a74'), umber = lin('#5a3516');
    const RIMk = opts.rim ?? RIM, PHIk = opts.phi ?? PHI, Q = 230 / RIMk, EX = -2.2, EH = 79.5, ED = 219, SP = Math.sin(0.572), CP = Math.cos(0.572), KP = 374 / 1.83;
    const ell = (x, y, cx, cy, rx, ry) => { const u = (x - cx) / rx, v = (y - cy) / ry; return u * u + v * v; }, fo = [0, 0];
    // floor to the bird's own flat coordinates (x right, y up; about 125 by 140)
    const flat = (X, D, o) => { const dz = ED - D, dep = Math.max(dz * CP + EH * SP, 20); o[0] = 17 + (X - EX) / dep * KP; o[1] = 28.9 + (dz * SP - EH * CP) / dep * KP; return o; };
    // a stocky bird: a head a third of its height, a round leaning body, a short tail; every shape many tiles across
    const bird = (x, y) => {
      const bu = (x + 12) * 0.927 - (y + 8) * 0.375, bv = (x + 12) * 0.375 + (y + 8) * 0.927;       // the body's own axes (it leans forward)
      const head = ell(x, y, 10, 38, 36, 27) < 1, body = (bu * bu) / 1600 + (bv * bv) / 2500 < 1;
      if (x > 40 && x < 93 && Math.abs(y - (40 - 0.08 * (x - 40))) < 8.5 * (1 - (x - 40) / 53)) return 4;       // the bill
      if (head) {
        if (ell(x, y, 24, 44, 6, 6) < 1) return 4;                                                     // the eye
        if (ell(x, y, 24, 44, 9.5, 9.5) < 1) return 3;                                                 // in a pale ring
        if (ell(x, y, 36, 41, 5, 4) < 1) return 2;                                                     // the spot before it
        if (ell(x, y, 14, 30, 16, 8) < 1) return 2;                                                    // the orange cheek
        if (ell(x, y, -12, 24, 13, 10) < 1) return 3;                                                  // the white patch on the neck
        if (ell(x, y, 33, 21, 17, 10) < 1) return 3;                                                   // the white throat
        if (y < 26 - 0.2 * (x - 10)) return body && bu > 2 ? 2 : 1;                                     // below the cheek: blue, or already breast
        return 0;                                                                                       // the crown
      }
      if (body) {
        if (bu > 2) return 2;                                                                           // the breast
        if (bu < -29) return 5;                                                                         // the bright streak down the back
        if (bv > 8) return 0;                                                                           // shoulder
        return Math.abs(((bu + 60) / 9) % 1 - 0.5) > 0.38 ? 4 : 1;                                     // flight feathers, a dark line between them
      }
      if (bv > -72 && bv <= -44 && Math.abs(bu + 8) < 13 - 0.15 * (-44 - bv)) return 1;                  // the tail
      if (ell(x, y, -14, -53, 7, 3.4) < 1) return 6;                                                    // the feet
      return -1;
    };
    return {
      paints: [turq, sea, orange, white, dark, light, apricot, teal, tealL, umber], line: [0, 2, 1, 0, 3, 2, 5], neck: [2, 2, 3, 0, 0, 1], crest: 0,
      wall: { bg: 1, rays: [2, 6], edge: 4, disc: 6, ring: 5, dark: 4, eye: [3, 0, 5, 4] },
      fn(r, a, w) {
        if (r > 145) return 4;                                                             // a dark rim round the whole fan
        if (r > 142) return (Math.floor(Math.abs(w) / 4.2) & 1) ? 2 : 3;                   // and a border of orange and white
        const rr = r * RIMk / RIM, psi = a * PHIk, X = rr * Math.sin(psi) * Q, D = rr * Math.cos(psi) * Q;
        const x = flat(X, D, fo)[0], y = fo[1], k = bird(x, y);
        if (k >= 0) return k;
        const e = 2.2;
        if (bird(x + e, y) >= 0 || bird(x - e, y) >= 0 || bird(x, y + e) >= 0 || bird(x, y - e) >= 0) return 4;    // a dark line round the bird
        if (ell(x, y, 43, 37, 45, 45) < 1) return 6;                                       // the low sun behind its head: the bill and the crown stand against it
        if (Math.abs(y - (-58.5 + 0.08 * x)) < 3.6) return 9;                              // the perch
        const rp = Math.sin(Math.hypot(X - 40, D - 236) * 0.16);
        return rp > 0.9 ? 8 : 7;                                                           // dark water, a few slow rings
      },
    };
  }
  // peacock (default): breast of blue scales, a gold collar, barbed train and 28 eyes in three arcs
  const turq = mix(green, lin('#58d8c0'), 0.42), dark = blue.clone().multiplyScalar(0.42), bronze = mix(gold, lin('#3a2a10'), 0.5);
  const eyes = [];
  for (const arc of opts.arcs ?? [{ r: 57, n: 2 }, { r: 92, n: 5 }, { r: 127, n: 7 }]) {
    const w0 = 8.5, w1 = arc.r * PHI * 0.985, sp = (w1 - w0) / arc.n;
    for (let sd = -1; sd <= 1; sd += 2) for (let i = 0; i < arc.n; i++)
      eyes.push({ r: arc.r + rng.range(-1.5, 1.5) + ((i & 1) ? 2.5 : -2.5), w: sd * (w0 + sp * (i + 0.5)), at: Math.min(4.9, sp * 0.47), ar: 10.5 });
  }
  const shafts = 8 + rng.int(0, 2), barb = rng.range(0.27, 0.34);
  return {
    paints: [blue, green, gold, turq, dark, bronze, lin('#ead79c')], line: [0, 1, 3, 1, 2, 0, 1], neck: [0, 0, 3, 0, 1, 0], crest: 2, eyes,
    wall: { bg: 0, rays: [2, 3], edge: 4, disc: 2, ring: 3, dark: 4, eye: [5, 6, 3, 4] },
    fn(r, a, w) {
      for (let i = 0; i < eyes.length; i++) {
        const e = eyes[i], dr = (r - e.r) / e.ar, dw = (w - e.w) / e.at, d2 = dr * dr + dw * dw;
        if (d2 > 1.45) continue;
        const pr = (r - e.r + 2.2) / (e.ar * 0.42), pw = (w - e.w) / (e.at * 0.52), p2 = pr * pr + pw * pw;
        if (p2 < 0.3) return 4;
        if (p2 < 1) return 0;
        const d = Math.sqrt(d2);
        return d < 0.6 ? 3 : d < 0.76 ? 1 : d < 1.0 ? 2 : 5;
      }
      if (r < 31) { const row = Math.floor(r / 2.3), col = Math.floor(w / 2.3 + (row & 1) * 0.5); return ((row + col * 2) % 3 === 0) ? 3 : (r < 6 ? 4 : 0); }
      if (r < 34.5) return 2;
      const fa = (Math.abs(a) * shafts) % 1, d = Math.abs(fa - 0.5);
      if (d < 0.045) return 2;
      const band = Math.floor(r * barb + d * 5.5) % 6;
      return band === 0 ? 3 : (band === 3 && d > 0.3) ? 0 : 1;
    },
  };
}

// ---- one tile: origin at the middle of its foot, y up 0..2, local +z = the way it falls; no bottom face ----
function tileGeometry(bevel, sides = true) {
  const hw = TW / 2, ht = TT / 2, c = bevel ? 0.04 : 0, pos = [], nor = [];
  const tri = (a, b, d) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const cx = (a[0] + b[0] + d[0]) / 3, cy = (a[1] + b[1] + d[1]) / 3 - 1, cz = (a[2] + b[2] + d[2]) / 3;
    const flip = nx * cx + ny * cy * 0.2 + nz * cz < 0;
    const order = flip ? [a, d, b] : [a, b, d];
    if (flip) { nx = -nx; ny = -ny; nz = -nz; }
    for (const p of order) { pos.push(p[0], p[1], p[2]); nor.push(nx, ny, nz); }
  };
  const quad = (a, b, d, e) => { tri(a, b, d); tri(a, d, e); };
  const y1 = TH - c;
  for (const sz of [-1, 1]) quad([-hw + c, 0, sz * ht], [hw - c, 0, sz * ht], [hw - c, y1, sz * ht], [-hw + c, y1, sz * ht]);
  if (sides) for (const sx of [-1, 1]) quad([sx * hw, 0, -ht + c], [sx * hw, 0, ht - c], [sx * hw, y1, ht - c], [sx * hw, y1, -ht + c]);
  quad([-hw + c, TH, -ht + c], [hw - c, TH, -ht + c], [hw - c, TH, ht - c], [-hw + c, TH, ht - c]);
  if (bevel) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      quad([sx * (hw - c), 0, sz * ht], [sx * hw, 0, sz * (ht - c)], [sx * hw, y1, sz * (ht - c)], [sx * (hw - c), y1, sz * ht]);
      tri([sx * (hw - c), TH, sz * (ht - c)], [sx * (hw - c), y1, sz * ht], [sx * hw, y1, sz * (ht - c)]);
    }
    for (const sz of [-1, 1]) quad([-hw + c, y1, sz * ht], [hw - c, y1, sz * ht], [hw - c, TH, sz * (ht - c)], [-hw + c, TH, sz * (ht - c)]);
    for (const sx of [-1, 1]) quad([sx * hw, y1, -ht + c], [sx * hw, y1, ht - c], [sx * (hw - c), TH, ht - c], [sx * (hw - c), TH, -ht + c]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}

const GLSL_COMMON = /* glsl */`
uniform vec4 uFront, uWidth;
uniform float uTime, uShiver, uMaskOn, uSunAmount, uFront2;
uniform vec3 uSunDir;
uniform vec4 uWin[11];
uniform float uWinX[11];
uniform vec4 uRoof[5];
uniform float uRoofY, uSplitZ;
uniform vec2 uSlat;
float leanAngle(float trig, float k, out float tc) {
  float front = k < 0.5 ? uFront.x : (k < 1.5 ? uFront.y : (k < 2.5 ? uFront.z : (k > 4.5 ? uFront.w : -1.0e6)));
  float W = k < 0.5 ? uWidth.x : (k < 1.5 ? uWidth.y : (k < 2.5 ? uWidth.z : uWidth.w));
  float t = (front - trig) / max(W, 0.01);
  tc = clamp(t, 0.0, 1.0);
  float th = ${REST.toFixed(4)} * tc * tc * (1.7 - 0.7 * tc);
  float ts = max(t - 1.0, 0.0);
  th -= 0.085 * exp(-2.0 * ts) * abs(sin(5.5 * ts));
  // the tiles just ahead of the crest tremble on their feet, less with distance
  th += step(t, 0.0) * step(k, 2.5) * 0.065 * exp(min(t, 0.0) * 0.45) * sin(uTime * 12.0 + trig * 2.3) * step(-1.0e5, front);
  if (k > 4.5) {      // a tile on a wall shelf only tips back against the wall; the second wave rocks it once more
    float t2 = clamp((uFront2 - trig) / max(W, 0.01), 0.0, 1.0);
    th = th * 0.2 - 0.16 * sin(3.14159 * t2);
  }
  return th;
}
// direct sun at P: 1 inside the shape a window (in a wall x = const) or a roof light (at y = uRoofY) throws.
// Windows on the near side of uSplitZ light only that room, the others (and the roof lights) only the hall.
float sunMask(vec3 P) {
  float m = 1.0;
  if (uMaskOn > 0.5) {
    m = 0.0;
    float side = step(uSplitZ, P.z);
    for (int i = 0; i < 11; i++) {
      vec4 a = uWin[i];
      float tt = (uWinX[i] - P.x) / max(uSunDir.x, 0.05);
      vec3 Q = P + uSunDir * tt;
      float dz = a.z - abs(Q.z - a.x), dy = a.w - abs(Q.y - a.y);
      float k = clamp(dz / 1.6 + 0.5, 0.0, 1.0) * clamp(dy / 1.6 + 0.5, 0.0, 1.0) * step(0.01, a.z) * step(0.0, tt);
      k *= 1.0 - abs(side - step(uSplitZ, a.x));
      if (uSlat.x > 0.01) { float f = fract(Q.y / uSlat.x); k *= smoothstep(0.0, 0.08, f) * (1.0 - smoothstep(uSlat.y, uSlat.y + 0.08, f)); }
      m = max(m, k);
    }
    for (int i = 0; i < 5; i++) {
      vec4 a = uRoof[i];
      float tt = (uRoofY - P.y) / max(uSunDir.y, 0.05);
      vec3 Q = P + uSunDir * tt;
      float dx = a.z - abs(Q.x - a.x), dz = a.w - abs(Q.z - a.y);
      m = max(m, clamp(dx / 1.6 + 0.5, 0.0, 1.0) * clamp(dz / 1.6 + 0.5, 0.0, 1.0) * step(0.01, a.z) * (1.0 - side));
    }
  }
  return m * uSunAmount;
}
`;

const TILE_VERT = /* glsl */`
attribute vec4 aA;      // trigger, which front (0 line, 1 fan, 2 second line, 3 neck, 4 arch), random, paint while standing
attribute vec3 aCol, aCol2;
varying vec3 vL, vLN, vN, vWP, vCol;
varying float vT2, vBand;
varying vec4 vS;
varying float vK;
#include <common>
#include <fog_pars_vertex>
${GLSL_COMMON}
void main() {
  float tc;
  float th = leanAngle(aA.x, aA.y, tc);
  vec3 p = position, n = normal;
  float c = cos(th), s = sin(th), zz = p.z - ${(TT / 2).toFixed(3)};
  p = vec3(p.x, p.y * c - zz * s, p.y * s + zz * c + ${(TT / 2).toFixed(3)});
  n = vec3(n.x, n.y * c - n.z * s, n.y * s + n.z * c);
  if (aA.y > 3.5 && aA.y < 4.5) { float w = uShiver * sin(uTime * (23.0 + aA.z * 17.0) + aA.z * 50.0); p.x += 0.04 * w; p.z += 0.06 * w * sin(aA.z * 91.0); }
  vec4 lp = instanceMatrix * vec4(p, 1.0);
  vec4 wp = modelMatrix * lp;
  vN = mat3(modelMatrix) * (mat3(instanceMatrix) * n);
  vBand = step(aA.y, 2.5) * step(0.5, fract(aA.x / 18.0));      // standing tiles: every other 9 m ring shows a band of its paint
  vT2 = aA.y > 4.5 ? clamp((uFront2 - aA.x) / max(uWidth.w, 0.01), 0.0, 1.0) : 0.0;
  vL = position; vLN = normal; vWP = wp.xyz; vCol = mix(aCol, aCol2, smoothstep(0.3, 0.7, vT2)); vK = aA.y;
  vec3 mid = (instanceMatrix * vec4(0.0, 1.0, 0.0, 1.0)).xyz;
  vS = vec4(tc, sunMask(mid), aA.z, max(aA.w, smoothstep(0.1, 0.7, tc)));
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const TILE_FRAG = /* glsl */`
uniform vec3 uIvory, uBrass, uSun, uSky, uBounce, uSunDir;
uniform float uTime;
uniform vec2 uPaint;     // how far the sun is taken to white on painted faces, and the paints' saturation
uniform float uDap;      // how deep the slow shade of passing cloud lies on the tiles' sun
varying vec3 vL, vLN, vN, vWP, vCol;
varying vec4 vS;
varying float vK, vT2, vBand;
#include <common>
#include <fog_pars_fragment>
void main() {
  vec3 N = normalize(vN + vec3(0.0, 1.0e-5, 0.0));
  vec3 an = abs(vLN);
  vec2 fuv, hf;
  if (an.z > 0.5) { fuv = vec2(vL.x, vL.y - 1.0); hf = vec2(0.5, 1.0); }
  else if (an.x > 0.5) { fuv = vec2(vL.z, vL.y - 1.0); hf = vec2(0.15, 1.0); }
  else { fuv = vL.xz; hf = vec2(0.5, 0.15); }
  vec2 e2 = hf - abs(fuv);
  float e = min(e2.x, e2.y), rnd = vS.z, tc = vS.x;
  float grain = sin(vL.x * 83.0 + rnd * 40.0 + sin(vL.y * 5.0 + rnd * 9.0) * 1.5);
  vec3 col = uIvory * (0.93 + 0.07 * rnd) * (1.0 - 0.035 * grain);
  col *= mix(0.8, 1.0, smoothstep(0.0, 0.04, e));                       // worn dark arris
  float face = step(0.5, -vLN.z);                                       // the face that ends uppermost
  float bandM = vBand * 0.9 * smoothstep(0.5, 0.54, fuv.y) * (1.0 - smoothstep(0.84, 0.88, fuv.y));      // a painted band under the head of the face
  float panel = smoothstep(0.055, 0.085, e) * face * max(vS.w, bandM);
  float brush = sin(vL.y * 31.0 + rnd * 60.0) * sin(vL.x * 9.0 + rnd * 20.0);
  vec3 paint = max(mix(vec3(dot(vCol, vec3(0.3, 0.55, 0.15))), vCol, uPaint.y), vec3(0.0)) * (0.92 + 0.14 * brush + 0.1 * (rnd - 0.5));
  paint *= mix(0.78, 1.0, smoothstep(0.085, 0.16, e));                  // darker painted border
  float big = step(0.5, an.z);
  float groove = (1.0 - smoothstep(0.0, 0.014, abs(e - 0.115))) * big;
  col *= 1.0 - 0.2 * groove;
  paint *= 1.0 + 0.16 * (1.0 - smoothstep(0.0, 0.55, length(fuv * vec2(1.7, 1.0) - vec2(0.0, 0.2))));
  paint += vec3(0.07) * (1.0 - smoothstep(0.0, 0.012, abs(e - 0.2)));
  col = mix(col, paint, max(panel, vBand * 0.85 * step(0.5, an.y) * smoothstep(0.02, 0.05, e)));      // (and its top edge)
  float pd = length(fuv - vec2(0.0, 0.52));
  float pin = (1.0 - smoothstep(0.07, 0.09, pd)) * face;
  col = mix(col, uBrass * (1.25 - 0.5 * smoothstep(0.0, 0.08, pd)), pin);
  // light
  float ndl = max(dot(N, uSunDir), 0.0);
  float stand = mix(0.66, 1.0, smoothstep(0.0, 1.4, vL.y));              // contact darkening at the foot
  float lap = smoothstep(0.86, 1.2, vL.y);                                // the part of a fallen tile that shows past the next one
  float down = mix(mix(0.62, 0.3, step(0.5, vLN.z)), mix(0.3, 1.0, lap), face);
  float ao = mix(stand, down, tc);
  if (vK > 2.5) ao = 0.8 + 0.2 * rnd;      // stacked, static tiles
  if (N.y < -0.5) ao *= 0.5;
  vec3 V = normalize(cameraPosition - vWP + vec3(0.0, 1.0e-4, 0.0));
  vec3 H = normalize(uSunDir + V + vec3(0.0, 1.0e-4, 0.0));
  float nh = max(dot(N, H), 0.0);
  float sunK = vS.y * mix(1.0, lap * 0.75 + 0.25, tc * face);
  float cl = 0.5 + 0.3 * sin(vWP.x * 0.045 + vWP.z * 0.021 + uTime * 0.33) + 0.2 * sin(vWP.z * 0.06 - vWP.x * 0.03 - uTime * 0.21);
  sunK *= 1.0 - uDap * smoothstep(0.5, 0.85, cl);
  vec3 sunC = mix(uSun, vec3(dot(uSun, vec3(0.3, 0.55, 0.15))), uPaint.x * panel);
  vec3 sunL = sunC * ndl * sunK * mix(1.0, ao, 0.5), ambL = (uSky * (0.62 + 0.38 * N.y) + uBounce * (0.55 - 0.45 * N.y)) * ao;
  vec3 light = sunL + ambL;
  // the wall's tiles: lifted, so the burst glows in the shade; the patch of sun on them is held to a warm glow (at full
  // strength it burns gold, orange and blue alike to white, and the picture beside the gateway is lost)
  if (vK > 4.5) light = sunL * 0.34 + ambL * 1.25 + (uSky + uBounce) * 0.3;
  vec3 outc = col * light;
  // a slow sheen crosses the lacquered faces, as when a cloud's edge passes the roof lights
  float sheen = 0.5 + 0.5 * sin(vWP.z * 0.07 + vWP.x * 0.04 + vWP.y * 0.09 - uTime * 1.1); sheen *= sheen * sheen; sheen *= sheen;
  outc *= 1.0 + 0.32 * sheen * (0.35 + 0.65 * panel);
  outc += uSun * pow(nh, 60.0) * sunK * (0.06 + 0.1 * panel);
  float band = pow(0.5 + 0.5 * sin(vWP.z * 0.07 + vWP.x * 0.045 - uTime * 1.7 + rnd * 1.3), 24.0);
  outc += uBrass * pin * (pow(nh, 14.0) * 5.0 * sunK + band * 2.2 * (0.25 + 0.75 * vS.y));
  // the crest: tiles in mid-fall flash as they turn
  float crest = (4.0 * tc * (1.0 - tc) + 4.0 * vT2 * (1.0 - vT2)) * (step(vK, 2.5) + step(4.5, vK));
  float tw = 0.5 + 0.5 * sin(uTime * 13.0 + rnd * 70.0); tw *= tw; tw *= tw;
  outc += (uSun * 0.3 + uBrass * 0.9) * crest * (0.18 + 1.25 * tw) * (0.4 + 0.6 * vS.y);
  gl_FragColor = vec4(outc, 1.0);
  #include <fog_fragment>
}`;

const SHADOW_VERT = /* glsl */`
attribute vec3 aBase;
attribute vec2 aDir;
attribute vec4 aB;      // trigger, which front, clip half-width, random
varying vec3 vQ;        // u, v, lateral metres
varying vec2 vM;        // sun mask, clip
#include <common>
#include <fog_pars_vertex>
${GLSL_COMMON}
void main() {
  float tc;
  float th = leanAngle(aB.x, aB.y, tc);
  vec3 d = vec3(aDir.x, 0.0, aDir.y), wv = vec3(aDir.y, 0.0, -aDir.x);
  float hy = ${TH.toFixed(1)} * cos(th), hd = ${TH.toFixed(1)} * sin(th);
  vec2 off = d.xz * hd - uSunDir.xz * (hy / max(uSunDir.y, 0.12));
  vec3 P = aBase + wv * position.x * 1.04 + vec3(off.x, 0.0, off.y) * position.y + d * 0.15 * (1.0 - 2.0 * position.y) * -1.0;
  P.y = aBase.y + 0.035;
  vQ = vec3(position.x, position.y, dot(P - aBase, wv));
  vM = vec2(sunMask(aBase + vec3(0.0, 1.0, 0.0)), aB.z);
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const SHADOW_FRAG = /* glsl */`
uniform vec3 uShadowColor;
uniform float uShadowStrength;
varying vec3 vQ;
varying vec2 vM;
#include <common>
#include <fog_pars_fragment>
void main() {
  if (abs(vQ.z) > vM.y) discard;
  float a = uShadowStrength * vM.x * (1.0 - smoothstep(0.36, 0.5, abs(vQ.x))) * (1.0 - 0.55 * smoothstep(0.45, 1.0, vQ.y)) * smoothstep(0.0, 0.04, vQ.y);
  float ff = 0.0;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      ff = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
  gl_FragColor = vec4(mix(vec3(1.0), uShadowColor, a * (1.0 - ff)), 1.0);
}`;

const PROP_VERT = /* glsl */`
attribute vec3 color;
attribute vec3 aM;      // metal, ruler u (metres, < -100 = not a ruler), ruler v
varying vec3 vN, vWP, vCol, vM;
varying float vMask;
#include <common>
#include <fog_pars_vertex>
${GLSL_COMMON}
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = mat3(modelMatrix) * normal; vWP = wp.xyz; vCol = color; vM = aM;
  vMask = sunMask(position);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const PROP_FRAG = /* glsl */`
uniform vec3 uSun, uSky, uBounce, uSunDir;
varying vec3 vN, vWP, vCol, vM;
varying float vMask;
#include <common>
#include <fog_pars_fragment>
void main() {
  vec3 N = normalize(vN + vec3(0.0, 1.0e-5, 0.0));
  vec3 col = vCol;
  if (vM.y > -100.0) {
    float g = sin(vM.z * 23.0 + sin(vM.y * 0.9) * 2.0) * 0.5 + 0.5;
    col *= 0.9 + 0.1 * g;
    if (N.y > 0.5) {
      float av = abs(vM.z);
      float f1 = abs(fract(vM.y / 0.25 + 0.5) - 0.5) * 0.25, f5 = abs(fract(vM.y / 1.25 + 0.5) - 0.5) * 1.25;
      float ink = (1.0 - smoothstep(0.012, 0.026, f1)) * step(0.74, av) + (1.0 - smoothstep(0.02, 0.04, f5)) * step(0.5, av);
      ink = max(ink, 1.0 - smoothstep(0.0, 0.03, abs(av - 0.985)));
      col = mix(col, vec3(0.1, 0.06, 0.035), clamp(ink, 0.0, 1.0) * 0.85);
    }
  }
  vec3 V = normalize(cameraPosition - vWP + vec3(0.0, 1.0e-4, 0.0));
  vec3 H = normalize(uSunDir + V + vec3(0.0, 1.0e-4, 0.0));
  float ndl = max(dot(N, uSunDir), 0.0), nh = max(dot(N, H), 0.0), metal = vM.x;
  vec3 amb = uSky * (0.62 + 0.38 * N.y) + uBounce * (0.55 - 0.45 * N.y);
  vec3 R = reflect(-V, N);
  vec3 env = mix(uBounce * 1.6, uSky * 1.8, smoothstep(-0.2, 0.5, R.y));
  vec3 outc = col * (uSun * ndl * vMask * mix(1.0, 0.45, metal) + amb * mix(1.0, 0.35, metal));
  outc += col * env * metal * 0.9 + uSun * col * pow(nh, mix(30.0, 90.0, metal)) * vMask * mix(0.05, 2.2, metal);
  gl_FragColor = vec4(outc, 1.0);
  #include <fog_fragment>
}`;

const MARBLE_VERT = /* glsl */`
varying vec3 vN, vWP, vOP;
#include <common>
#include <fog_pars_vertex>
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = mat3(modelMatrix) * normal; vWP = wp.xyz; vOP = position;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const MARBLE_FRAG = /* glsl */`
uniform vec3 uColor, uSun, uSky, uBounce, uSunDir;
varying vec3 vN, vWP, vOP;
#include <common>
#include <fog_pars_fragment>
void main() {
  vec3 N = normalize(vN + vec3(0.0, 1.0e-5, 0.0));
  vec3 V = normalize(cameraPosition - vWP + vec3(0.0, 1.0e-4, 0.0));
  float nv = max(dot(N, V), 0.0), fres = (1.0 - nv) * (1.0 - nv) * (1.0 - nv);
  float tw = sin(vOP.y * 5.0 + 4.0 * (vOP.x * cos(vOP.y * 3.0) + vOP.z * sin(vOP.y * 3.0)));
  vec3 inner = uColor * (0.35 + 0.9 * smoothstep(0.2, 0.95, tw)) + vec3(0.25, 0.4, 0.5) * smoothstep(0.9, 1.0, tw) * 0.5;
  float through = max(dot(-N, uSunDir), 0.0);                       // sun gathered on the far side of the glass
  vec3 col = inner * (uSky * 0.9 + uBounce * 0.5 + uSun * (0.25 + 1.6 * through * through)) * (0.45 + 0.55 * nv);
  vec3 R = reflect(-V, N);
  vec3 env = mix(uBounce * 1.4, uSky * 2.2, smoothstep(-0.3, 0.6, R.y));
  col += env * (0.04 + 0.6 * fres);
  vec3 H = normalize(uSunDir + V + vec3(0.0, 1.0e-4, 0.0));
  float nh = max(dot(N, H), 0.0);
  col += (uSun * 1.6 + uColor * 2.0) * pow(nh, 220.0) * 2.2;
  col += uSky * pow(max(dot(R, normalize(vec3(-0.4, 0.75, 0.5))), 0.0), 90.0) * 2.0;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

const PUFF_VERT = /* glsl */`
attribute vec4 aP;      // trigger, which front, random, size (m)
uniform float uBufH;
varying float vA;
#include <common>
#include <fog_pars_vertex>
${GLSL_COMMON}
void main() {
  float front = aP.y < 0.5 ? uFront.x : (aP.y < 1.5 ? uFront.y : uFront.z);
  float W = aP.y < 0.5 ? uWidth.x : (aP.y < 1.5 ? uWidth.y : uWidth.z);
  float q = ((front - aP.x) / max(W, 0.01) - 0.9) / 2.6;
  float live = step(0.0, q) * step(q, 1.0);
  float qc = clamp(q, 0.0, 1.0);
  vec3 P = position + vec3(sin(aP.z * 40.0) * 0.7, 0.25 + 1.5 * sqrt(qc), cos(aP.z * 71.0) * 0.7) * (0.3 + qc);
  vA = live * smoothstep(0.0, 0.08, qc) * (1.0 - qc) * (1.0 - qc) * (0.3 + 0.7 * sunMask(position));
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = live * aP.w * (0.7 + 1.8 * qc) * min(projectionMatrix[1][1] * uBufH * 0.5 / max(gl_Position.w, 0.5), 160.0);
  if (live < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  #include <fog_vertex>
}`;

const PUFF_FRAG = /* glsl */`
uniform vec3 uDust;
varying float vA;
#include <common>
#include <fog_pars_fragment>
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = 1.0 - smoothstep(0.1, 0.5, length(c));
  gl_FragColor = vec4(uDust, d * vA * 0.3);
  #include <fog_fragment>
}`;

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng;
  const P = DEFAULT_PALETTE.map((h, i) => (opts.palette && opts.palette[i]) || h);
  const detail = ctx.quality?.detail ?? 1;
  const eyeFn = opts.eye ?? defaultEye, lineEye = opts.lineEye ?? eyeFn, lineDrop = opts.lineDrop ?? (() => 0);
  const rare = opts.rare ?? !!(ctx.vary && ctx.vary.rare);
  const pick = rng();
  const designName = opts.design ?? ((ctx.vary && ctx.vary.hour === 'golden') ? 'kingfisher'
    : pick < 0.52 ? 'peacock' : pick < 0.7 ? 'sunflower' : pick < 0.85 ? 'koi' : 'kingfisher');
  const design = makeDesign(designName, P, rng.fork('design'), opts);
  await ctx.yield();
  const lrng = rng.fork('layout');
  const amber = opts.marbleColor ? false : lrng.chance(0.3);
  const RIMv = opts.rim ?? RIM, PHIv = opts.phi ?? PHI, DS = RIM / RIMv;   // a larger or narrower fan shows the same picture, scaled
  const APEX_Z = opts.apexZ ?? APEX_Z0;      // the world may slide the whole fan (apex, strike, neck, chute end) along the axis
  const curl = lrng.range(0.02, 0.1), chuteX = opts.chuteX ?? -3;
  const archAt = new THREE.Vector3().fromArray(opts.archAt ?? [0, 31, ZS - S_END + 1]);
  const neckAt = new THREE.Vector3().fromArray(opts.neckAt ?? [9, 0, APEX_Z - 12]);
  const strike = new THREE.Vector3(chuteX, 0, APEX_Z + (opts.strikeR ?? 14));
  const AISLE = opts.aisle ?? 0, NOTCH = opts.notch ?? 0, CLIPX = opts.clipX ?? 1e6;
  const ivory = lin(P[0]).multiplyScalar(0.92);            // #E9DFC6 is 0.8 linear at its brightest channel; keep form

  // ---- instance lists ----
  const fanT = [], nearT = [], shadows = [], puffs = [];
  const M = new THREE.Matrix4(), V0 = new THREE.Vector3(), V1 = new THREE.Vector3(), V2 = new THREE.Vector3();
  const addYaw = (list, x, y, z, yaw, trig, k, paint0, col) => {
    M.makeRotationY(yaw); M.setPosition(x, y, z);
    list.push({ m: M.toArray(), trig, k, r: lrng(), paint0, col });
  };
  const addBasis = (list, bx, by, bz, x, y, z, k, paint0, col) => {
    M.makeBasis(V0.fromArray(bx), V1.fromArray(by), V2.fromArray(bz)); M.setPosition(x, y, z);
    list.push({ m: M.toArray(), trig: 0, k, r: lrng(), paint0, col });
  };
  const paints = design.paints;

  // ---- the line (and the rare second line) ----
  const lineBase = (s, side) => {
    const a = lineEye(s - 0.5), b = lineEye(s + 0.5), e = lineEye(s);
    let tx = b[0] - a[0], tz = b[2] - a[2]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const off = side * (opts.lineOffset ? opts.lineOffset(s) : 4 + 4.6 * smoothstep(835, 872, s));
    return { x: e[0] - tz * off, y: opts.lineY ? opts.lineY(s) : Math.max(0, e[1] - 2.5 - lineDrop(s)), z: e[2] + tx * off, tx, tz };
  };
  const RULER_FROM = 235, SECOND_FROM = opts.secondFrom ?? 197, LINE_END = 873;
  const secT = [];
  const layLine = async (s0, side, k, list = nearT) => {
    const run = 5 + lrng.int(0, 4);
    let i = 0;
    for (let s = s0; s <= LINE_END; s += PITCH, i++) {
      const b = lineBase(s, side), yaw = Math.atan2(b.tx, b.tz) + lrng.range(-0.035, 0.035);
      const band = Math.floor(i / run), idx = (i % run === run - 1) ? design.line[6] : design.line[band % 6];
      addYaw(list, b.x, b.y, b.z, yaw, s, k, 0, paints[idx % paints.length]);
      shadows.push({ x: b.x, y: b.y, z: b.z, dx: b.tx, dz: b.tz, trig: s, k, clip: s >= RULER_FROM && b.y > 0.2 ? 0.86 : 1e4 });
      if (i % 3 === 0) puffs.push({ x: b.x + b.tx * 1.9, y: b.y, z: b.z + b.tz * 1.9, trig: s, k });
      if (i % 100 === 99) await ctx.yield();
    }
  };
  await layLine(opts.lineStart ?? 4, 1, 0);
  await ctx.yield();
  if (rare) await layLine(SECOND_FROM, -1, 2, secT);
  // side branches: short runs of tiles leaving the line (opts.branches: [{ from:[x,y,z], to:[x,y,z], trig (station) }])
  for (const br of opts.branches || []) {
    const ax = br.from[0], ay = br.from[1], az = br.from[2], bx = br.to[0] - ax, bz = br.to[2] - az, len = Math.hypot(bx, bz) || 1, dx = bx / len, dz = bz / len;
    for (let d = 0, i = 0; d <= len; d += PITCH, i++) {
      const x = ax + dx * d, z = az + dz * d, trig = br.trig + d;
      addYaw(nearT, x, ay, z, Math.atan2(dx, dz) + lrng.range(-0.035, 0.035), trig, 0, 0, paints[design.line[i % 6] % paints.length]);
      shadows.push({ x, y: ay, z, dx, dz, trig, k: 0, clip: ay > 0.1 ? 0.86 : 1e4 });
    }
  }
  await ctx.yield();

  // ---- the fan: quills that split whenever their lane grows wider than about 2.3 m ----
  let fanFrontMax = 0;
  for (let sd = -1; sd <= 1; sd += 2) {
    let quills = [{ t0: 0, t1: 1, ph: lrng(), th: lrng.range(2.35, 2.6) }];
    let ring = 0;
    for (let r = 2.6; r <= RIMv; r += PITCH, ring++) {
      const hwA = AISLE > 0 ? AISLE + NOTCH * (1 - smoothstep(6, 22, r)) : 6 * smoothstep(9, 20, r), phiIn = Math.asin(Math.min(1, hwA / r)), span = PHIv - phiIn;
      if (span < 0.02) continue;
      const next = [];
      for (const q of quills) {
        if ((q.t1 - q.t0) * span * r > q.th) {
          const tm = (q.t0 + q.t1) / 2;
          next.push({ t0: q.t0, t1: tm, ph: q.ph, th: lrng.range(2.35, 2.6) }, { t0: tm, t1: q.t1, ph: (q.ph + 0.37) % 1, th: lrng.range(2.35, 2.6) });
        } else next.push(q);
      }
      quills = next;
      for (const q of quills) {
        const rr = r + (q.ph - 0.5) * PITCH * 0.8;
        if (rr > RIMv + 0.4) continue;
        const phi = phiIn + span * (q.t0 + q.t1) / 2, psi = sd * phi * (1 + curl * Math.sin(Math.PI * rr / RIMv));
        const x = rr * Math.sin(psi) + lrng.range(-0.04, 0.04), z = APEX_Z + rr * Math.cos(psi);
        if (Math.abs(x) > CLIPX) continue;
        const dx = -Math.sin(psi), dz = -Math.cos(psi), trig = Math.hypot(x - strike.x, z - strike.z);
        const idx = design.fn(rr * DS, psi / PHIv, rr * DS * psi * PHI / PHIv);
        addYaw(fanT, x, 0, z, Math.atan2(dx, dz) + lrng.range(-0.03, 0.03), trig, 1, 0, paints[idx]);
        shadows.push({ x, y: 0, z, dx, dz, trig, k: 1, clip: 1e4 });
        if (lrng() < 0.12 * detail) puffs.push({ x: x + dx * 1.9, y: 0, z: z + dz * 1.9, trig, k: 1 });
        if (trig > fanFrontMax) fanFrontMax = trig;
      }
      if ((ring & 3) === 0) await ctx.yield();
    }
  }
  fanFrontMax += 16;       // plus the width of the crest, so that the last tiles are down at the maximum
  await ctx.yield();

  // ---- the neck: six tiers of tiles stood on end, each tier capped with tiles laid flat ----
  const tiers = opts.neckTiers ?? [[0, 7], [0.7, 4], [1.6, 2], [2.3, 2], [1.8, 2], [0.8, 3]], NT = tiers.length;
  tiers.forEach(([cx, n], k) => {
    const y0 = neckAt.y + k * 2.3, col = paints[design.neck[Math.min(5, Math.round(k * 5 / (NT - 1)))]];
    for (let i = 0; i < n; i++) {
      const x = neckAt.x + cx + (i - (n - 1) / 2) * 1.04;
      addYaw(nearT, x, y0, neckAt.z + 0.68, Math.PI, 0, 3, 1, col);
      addYaw(nearT, x, y0, neckAt.z - 0.68, 0, 0, 3, 1, col);
    }
    addYaw(nearT, neckAt.x + cx + n * 0.52 + 0.17, y0, neckAt.z, -Math.PI / 2, 0, 3, 1, col);
    addYaw(nearT, neckAt.x + cx - n * 0.52 - 0.17, y0, neckAt.z, Math.PI / 2, 0, 3, 1, col);
    const m = Math.ceil((n * 1.04 + 0.5) / 2.05);
    for (let j = 0; j < m; j++) for (const zr of [-0.52, 0.52])
      addBasis(nearT, [0, 0, 1], [1, 0, 0], [0, 1, 0], neckAt.x + cx + (j - m / 2) * 2.05, y0 + 2.15, neckAt.z + zr, 3, 0, col);
  });
  {
    const [cx] = tiers[NT - 1], y0 = neckAt.y + (NT - 1) * 2.3, top = neckAt.y + NT * 2.3;
    addBasis(nearT, [0, 0, -1], [1, 0, 0], [0, -1, 0], neckAt.x + cx - 4.1, y0 + 1.25, neckAt.z, 3, 1, paints[design.crest]);   // the beak
    for (let i = 0; i < 5; i++) {
      const tilt = (i - 2) * 0.36;
      M.makeRotationZ(-tilt).multiply(new THREE.Matrix4().makeRotationY(Math.PI));
      M.setPosition(neckAt.x + cx + (i - 2) * 0.62, top - 0.06 * Math.abs(i - 2), neckAt.z + (i - 2) * 0.33);
      nearT.push({ m: M.toArray(), trig: 0, k: 3, r: lrng(), paint0: 1, col: paints[design.crest] });
    }
  }

  // ---- the arch: courses of stretchers in three leaves, corbelled in to a round opening (opts.arch resizes it) ----
  const ARCH = Object.assign({ inner: 7.6, outer: 11, spring: 10.4, course: 1.01, courses: 20 }, opts.arch || {});
  const NC = ARCH.courses, JS = Math.round(ARCH.spring / ARCH.course), NFULL = Math.ceil(2 * ARCH.outer / 2.03);
  const wIn = (y) => (y < ARCH.spring ? ARCH.inner : Math.sqrt(Math.max(0, ARCH.inner * ARCH.inner - (y - ARCH.spring) * (y - ARCH.spring))));
  for (let j = 0; j < NC; j++) {
    const y0 = j * ARCH.course, wi = wIn(y0), full = wi < 0.6, band = j === 0 || j === NC - 1 || j === JS;
    for (let leaf = -1; leaf <= 1; leaf++) {
      const z = archAt.z + leaf * 0.42, bz = leaf >= 0 ? [0, 0, -1] : [0, 0, 1], bx = leaf >= 0 ? [0, 1, 0] : [0, -1, 0];
      // the opening is outlined twice on both faces: a ring in the crest's paint from foot to foot, and round the head a
      // second ring outside it in the ground colour of the wall behind
      const place = (x0, inner) => {
        const jx = lrng.range(-0.035, 0.035), ring2 = inner === 2 && j > JS, paint = band || ((inner === true || ring2) && leaf !== 0);
        const col = band ? paints[(Math.round(x0 * 0.5) & 1) ? 0 : 1] : ring2 && opts.wall ? paints[design.wall.bg] : paints[design.crest];
        addBasis(nearT, bx, [1, 0, 0], bz, archAt.x + x0 + jx, archAt.y + y0 + 0.5, z + lrng.range(-0.02, 0.02), 4, paint ? 1 : 0, col);
      };
      if (full) { const o = ((j + leaf) & 1) ? 0 : 1.0; for (let i = 0; i < NFULL; i++) place(-ARCH.outer - 0.15 + o * 0.5 + i * 2.03, false); }
      else {
        const o = (leaf === 0 && j > JS) ? 0.5 : ((j & 1) && j <= JS ? 0.3 * leaf * leaf : 0), n = Math.max(1, Math.ceil((ARCH.outer - wi - o - 0.5) / 2.03));
        for (let i = 0; i < n; i++) { const kind = i === 0 ? true : i === 1 ? 2 : false; place(wi + o + i * 2.03, kind); place(-(wi + o + i * 2.03) - 2, kind); }
      }
    }
    if ((j & 7) === 7) await ctx.yield();
  }
  { const nTop = Math.round(2 * ARCH.outer / 1.55) + 1; for (let i = 0; i < nTop; i++) addYaw(nearT, archAt.x + (i - (nTop - 1) / 2) * 1.55, archAt.y + NC * ARCH.course, archAt.z, Math.PI, 0, 4, 0, paints[0]); }
  await ctx.yield();

  // ---- the wall: tiles standing on shelves up the end wall behind the arch, face to the room. A wave runs out from the
  // arch; each tile tips back against the wall and takes its paint: a sunburst in the picture's colours ----
  const wallT = [], wallShelves = [];
  let wallFrontMax = 0;
  if (opts.wall) {
    const Wl = opts.wall, wp = design.wall, cy = Wl.cy, R0 = Wl.r0, R1 = Wl.r1, nR = Wl.rays ?? 14, pitchY = Wl.pitch ?? 2.16;
    // a sun behind the gateway: a disc, and from it broad wedges of the picture's two warm paints fanning out to the rim on a
    // dark ground, each wedge with a darker edge; a checked border round the whole panel
    const wallFn = (x, y) => {
      const dy = y - cy, rho = Math.hypot(x, dy), th = Math.atan2(x, dy);
      const edge = dy >= 0 ? R1 - rho : Math.min(R1 - Math.abs(x), y - Wl.yMin + 1.3);
      if (edge < 2.3) return (Math.floor((dy >= 0 ? th * R1 : y + Math.sign(x) * 40) / 3.2 + 100) & 1) ? wp.ring : wp.rays[0];
      if (edge < 3.6) return wp.dark;
      if (rho < R0 - 2.6) return wp.disc;
      if (rho < R0) return wp.ring;
      const g = (th / (Math.PI * 2)) * nR, i = Math.round(g), f = Math.abs(g - i), hw = 0.29, ew = 1.25 / (rho * Math.PI * 2 / nR);
      if (f < hw) return f > hw - ew ? wp.edge : wp.rays[((i % 2) + 2) % 2];
      return wp.bg;
    };
    // THE SECOND PICTURE, which a second wave lays into the first: the sunburst becomes a displayed tail. An eye opens at the
    // end of every ray (four rings round a dark pupil), smaller eyes open between the rays nearer the gateway, and the ground
    // between the rays takes a scalloped fringe. Everything else keeps the paint the first wave gave it.
    const ey = wp.eye ?? [wp.ring, wp.bg, wp.disc, wp.dark], RE = R0 + (R1 - R0) * 0.705, RI = R0 + (R1 - R0) * 0.333;
    // (the two ranks keep clear of each other and of the panel's foot, so that every eye is whole: a dark pupil, two broad
    // rings and a thin pale rim, each ring at least a row of tiles wide)
    const eyeAt = (rho, g, gc, rc, ra) => {
      if (cy + rc * Math.cos(gc * Math.PI * 2 / nR) < Wl.yMin + ra * 1.22 + 2.5) return -1;
      const dr = (rho - rc) / 1.22, dt = (g - gc) * (rho * Math.PI * 2 / nR), d = Math.hypot(dr, dt) / ra;
      if (d >= 1) return -1;
      return d < 0.36 ? ey[3] : d < 0.68 ? ey[2] : d < 0.86 ? ey[1] : ey[0];
    };
    const wallFn2 = (x, y) => {
      const first = wallFn(x, y), dy = y - cy, rho = Math.hypot(x, dy), th = Math.atan2(x, dy);
      const edge = dy >= 0 ? R1 - rho : Math.min(R1 - Math.abs(x), y - Wl.yMin + 1.3);
      if (edge < 3.6 || rho < R0) return first;
      const g = (th / (Math.PI * 2)) * nR;
      let k = eyeAt(rho, g, Math.round(g), RE, (R1 - R0) * 0.187); if (k >= 0) return k;
      k = eyeAt(rho, g, Math.floor(g) + 0.5, RI, (R1 - R0) * 0.145); if (k >= 0) return k;
      if (first === wp.bg && rho > RE + 1) { const f = Math.abs(g - Math.round(g)); if ((((rho - f * 30) / 9) % 1 + 1) % 1 < 0.42) return ey[2]; }
      return first;
    };
    let row = 0;
    for (let y = Wl.yMin; y < cy + R1 - 1.5; y += pitchY, row++) {
      const dy = y + 1 - cy, half = dy <= 0 ? R1 : Math.sqrt(Math.max(0, R1 * R1 - dy * dy));
      if (half < 2) continue;
      const n = Math.floor(2 * half / 1.06), x0 = -(n - 1) / 2 * 1.06;
      for (let i = 0; i < n; i++) {
        const x = x0 + i * 1.06, rho = Math.hypot(x, y + 1 - cy);
        if (rho < (Wl.hole ?? 5) || (Wl.skip && Wl.skip(x, y))) continue;
        M.makeRotationY(Math.PI); M.setPosition(x + lrng.range(-0.03, 0.03), y, Wl.z + 0.72);
        wallT.push({ m: M.toArray(), trig: rho, k: 5, r: lrng(), paint0: 0, col: paints[wallFn(x, y + 1)], col2: paints[wallFn2(x, y + 1)] });
        if (rho > wallFrontMax) wallFrontMax = rho;
      }
      wallShelves.push({ y, half: half + 0.4 });
      if ((row & 3) === 3) await ctx.yield();
    }
    wallFrontMax += 12;
  }
  await ctx.yield();

  // ---- shared uniforms and the five materials (all made here; update() only changes values) ----
  const sunDir = new THREE.Vector3().fromArray(opts.sunDir ?? [0.557, 0.616, 0.557]).normalize();
  const wins = [], winX = [], roofs = [];
  for (let i = 0; i < 11; i++) { wins.push(new THREE.Vector4(0, 0, 0, 0)); winX.push(75); }
  for (let i = 0; i < 5; i++) roofs.push(new THREE.Vector4(0, 0, 0, 0));
  const U = {
    uFront: { value: new THREE.Vector4(-1e3, -1e3, -1e3, -1e3) }, uWidth: { value: new THREE.Vector4(11, 14, 11, 1) },
    uTime: { value: 0 }, uShiver: { value: 0 }, uMaskOn: { value: 0 }, uSunAmount: { value: 1 }, uFront2: { value: -1e3 },
    uSunDir: { value: sunDir }, uWin: { value: wins }, uWinX: { value: winX }, uRoof: { value: roofs }, uRoofY: { value: opts.roofY ?? 120 },
    uSplitZ: { value: opts.splitZ ?? -1e6 }, uSlat: { value: new THREE.Vector2(0, 0.5) },
    uIvory: { value: ivory }, uBrass: { value: lin(P[6]).lerp(lin('#ffd98a'), 0.25) },
    uSun: { value: new THREE.Color().copy(opts.sunColor ? lin(opts.sunColor) : new THREE.Color(1.0, 0.93, 0.8).multiplyScalar(1.5)) },
    uSky: { value: opts.skyColor ? lin(opts.skyColor) : new THREE.Color(0.5, 0.63, 0.88).multiplyScalar(0.55) },
    uBounce: { value: opts.bounceColor ? lin(opts.bounceColor) : lin(P[1]).multiplyScalar(0.45) },
    uShadowColor: { value: new THREE.Color(0.4, 0.5, 0.78) }, uShadowStrength: { value: 0.85 },
    uColor: { value: lin(opts.marbleColor ?? (amber ? '#d98a1c' : P[5])) },
    uDust: { value: lin(P[3]).multiplyScalar(0.9) }, uBufH: { value: 450 }, uPaint: { value: new THREE.Vector2(0, 1) }, uDap: { value: 0.2 },
  };
  // windows: [{ x (the wall), y, z (centre), w (along z), h }] up to 11;  roofs: [{ x, z (centre), w (along x), d (along z) }] up to 5
  const setWindows = (list, roofList) => {
    const n = Math.min(11, list ? list.length : 0), nr = Math.min(5, roofList ? roofList.length : 0);
    for (let i = 0; i < 11; i++) { if (i < n) { const w = list[i]; wins[i].set(w.z, w.y, w.w / 2, w.h / 2); winX[i] = w.x; } else wins[i].set(0, 0, 0, 0); }
    for (let i = 0; i < 5; i++) { if (i < nr) { const w = roofList[i]; roofs[i].set(w.x, w.z, w.w / 2, w.d / 2); } else roofs[i].set(0, 0, 0, 0); }
    U.uMaskOn.value = n + nr > 0 ? 1 : 0;
  };
  setWindows(opts.windows, opts.roofs);
  if (opts.slats) U.uSlat.value.set(opts.slats[0], opts.slats[1]);
  const mat = (vertexShader, fragmentShader, extra = {}) => new THREE.ShaderMaterial({
    uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), U), vertexShader, fragmentShader, fog: true, ...extra });
  const tileMat = mat(TILE_VERT, TILE_FRAG);
  const shadowMat = mat(SHADOW_VERT, SHADOW_FRAG, { transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  const propMat = mat(PROP_VERT, PROP_FRAG);
  const marbleMat = mat(MARBLE_VERT, MARBLE_FRAG);
  const puffMat = mat(PUFF_VERT, PUFF_FRAG, { transparent: true, depthWrite: false });
  await ctx.yield();

  const object = new THREE.Group(); object.name = 'the-toppling-hero';
  const tileMesh = async (list, geo) => {
    const n = list.length, mesh = new THREE.InstancedMesh(geo, tileMat, n);
    const aA = new Float32Array(n * 4), aCol = new Float32Array(n * 3), aCol2 = new Float32Array(n * 3), im = mesh.instanceMatrix.array;
    for (let i = 0; i < n; i++) {
      const t = list[i]; im.set(t.m, i * 16);
      aA[i * 4] = t.trig; aA[i * 4 + 1] = t.k; aA[i * 4 + 2] = t.r; aA[i * 4 + 3] = t.paint0;
      aCol[i * 3] = t.col.r; aCol[i * 3 + 1] = t.col.g; aCol[i * 3 + 2] = t.col.b;
      const c2 = t.col2 || t.col; aCol2[i * 3] = c2.r; aCol2[i * 3 + 1] = c2.g; aCol2[i * 3 + 2] = c2.b;
      if ((i & 1023) === 1023) await ctx.yield();
    }
    geo.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4));
    geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(aCol, 3));
    geo.setAttribute('aCol2', new THREE.InstancedBufferAttribute(aCol2, 3));
    mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false;
    object.add(mesh);
    return mesh;
  };
  const fanMesh = await tileMesh(fanT, tileGeometry(false, false));       // the fan's tiles have no narrow sides: 6 triangles each
  await ctx.yield();
  const nearMesh = await tileMesh(nearT, tileGeometry(true));
  if (secT.length) await tileMesh(secT, tileGeometry(false));      // the rare second line: plain tiles, 10 triangles each
  const wallMesh = wallT.length ? await tileMesh(wallT, tileGeometry(false, false)) : null;
  await ctx.yield();

  {   // shadows: one floor quad per falling tile
    const n = shadows.length, g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
    const aBase = new Float32Array(n * 3), aDir = new Float32Array(n * 2), aB = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const t = shadows[i];
      aBase[i * 3] = t.x; aBase[i * 3 + 1] = t.y; aBase[i * 3 + 2] = t.z; aDir[i * 2] = t.dx; aDir[i * 2 + 1] = t.dz;
      aB[i * 4] = t.trig; aB[i * 4 + 1] = t.k; aB[i * 4 + 2] = t.clip; aB[i * 4 + 3] = hash1(i);
    }
    g.setAttribute('aBase', new THREE.InstancedBufferAttribute(aBase, 3));
    g.setAttribute('aDir', new THREE.InstancedBufferAttribute(aDir, 2));
    g.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4));
    g.instanceCount = n;
    const mesh = new THREE.Mesh(g, shadowMat); mesh.frustumCulled = false; mesh.renderOrder = 1; object.add(mesh);
  }
  {   // dust kicked up where tiles land
    const n = puffs.length, pos = new Float32Array(n * 3), aP = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const t = puffs[i]; pos[i * 3] = t.x; pos[i * 3 + 1] = t.y + 0.3; pos[i * 3 + 2] = t.z;
      aP[i * 4] = t.trig; aP[i * 4 + 1] = t.k; aP[i * 4 + 2] = hash1(i * 3.1 + 7); aP[i * 4 + 3] = 1.6 + 1.6 * hash1(i * 1.7);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aP', new THREE.BufferAttribute(aP, 4));
    const pts = new THREE.Points(g, puffMat); pts.frustumCulled = false; pts.renderOrder = 3; object.add(pts);
  }
  await ctx.yield();

  // ---- props in one mesh: the yardstick under the raised line, the brass chute and its cotton reels ----
  const pp = [], pn = [], pc = [], pm = [];
  const pv = (p, n, c, metal, u, v) => { pp.push(p[0], p[1], p[2]); pn.push(n[0], n[1], n[2]); pc.push(c.r, c.g, c.b); pm.push(metal, u, v); };
  const pquad = (a, b, c2, d, n, col, metal, ua, ub, va, vb) => {
    pv(a, n, col, metal, ua, va); pv(b, n, col, metal, ua, vb); pv(c2, n, col, metal, ub, vb);
    pv(a, n, col, metal, ua, va); pv(c2, n, col, metal, ub, vb); pv(d, n, col, metal, ub, va);
  };
  const boxA = lin(P[1]).lerp(lin(P[0]), 0.5), boxB = lin(P[1]).lerp(lin(P[0]), 0.36), brass = lin(P[6]).lerp(lin('#8a5a1a'), 0.45);
  const layRuler = (s0, side) => {
    let prev = null;
    for (let s = s0; s <= LINE_END + 2.2; s += 2.2) {
      const b = lineBase(s, side), wx = -b.tz, wz = b.tx, y = b.y + 0.02;
      const cur = { s, y: b.y, L: [b.x - wx * 0.86, y, b.z - wz * 0.86], R: [b.x + wx * 0.86, y, b.z + wz * 0.86], wx, wz };
      if (prev && (b.y > 0.2 || prev.y > 0.2)) {
        const col = (Math.floor(prev.s / 22.9) & 1) ? boxA : boxB, dn = (q) => [q[0], Math.max(q[1] - 0.26, 0), q[2]];
        pquad(prev.L, prev.R, cur.R, cur.L, [0, 1, 0], col, 0, prev.s, cur.s, -1, 1);
        pquad(prev.L, dn(prev.L), dn(cur.L), cur.L, [-wx, 0, -wz], col, 0, prev.s, cur.s, 0.3, 0.3);
        pquad(prev.R, dn(prev.R), dn(cur.R), cur.R, [wx, 0, wz], col, 0, prev.s, cur.s, 0.3, 0.3);
        pquad(dn(prev.L), dn(prev.R), dn(cur.R), dn(cur.L), [0, -1, 0], col, 0, prev.s, cur.s, 0.3, 0.3);
      }
      prev = cur;
    }
  };
  layRuler(RULER_FROM, 1);
  if (rare) layRuler(RULER_FROM, -1);
  await ctx.yield();
  const shelfC = opts.wall ? paints[design.wall.bg].clone().multiplyScalar(0.34) : lin('#4a2e1a');
  for (const sh of wallShelves) {      // the shelves the wall's tiles stand on: a top and a front edge each
    const z0 = opts.wall.z + 0.05, z1 = opts.wall.z + 1.25, y = sh.y - 0.02, h = sh.half;
    pquad([-h, y, z0], [-h, y, z1], [h, y, z1], [h, y, z0], [0, 1, 0], shelfC, 0, -1e3, -1e3, 0, 0);
    pquad([-h, y - 0.12, z1], [h, y - 0.12, z1], [h, y, z1], [-h, y, z1], [0, 0, 1], shelfC, 0, -1e3, -1e3, 0, 0);
  }
  if (opts.wall) {      // the board the shelves are fixed to: what shows between the tiles is dark, not wallpaper
    const Wl = opts.wall, z = Wl.z + 0.07, R = Wl.r1 + 0.9, yb = Wl.yMin - 0.5, c = shelfC.clone().multiplyScalar(0.8), nA = 24;
    pquad([-R, yb, z], [R, yb, z], [R, Wl.cy, z], [-R, Wl.cy, z], [0, 0, 1], c, 0, -1e3, -1e3, 0, 0);
    for (let i = 0; i < nA; i++) {
      const a0 = Math.PI * i / nA, a1 = Math.PI * (i + 1) / nA, n = [0, 0, 1];
      pv([0, Wl.cy, z], n, c, 0, -1e3, 0); pv([R * Math.cos(a0), Wl.cy + R * Math.sin(a0), z], n, c, 0, -1e3, 0); pv([R * Math.cos(a1), Wl.cy + R * Math.sin(a1), z], n, c, 0, -1e3, 0);
    }
  }
  const CH_Z0 = 118, CH_Z1 = strike.z + 3, MR = 0.8;
  const chuteY = (f) => 0.75 + 6.6 * (1 - smoothstep(0, 0.28, f)) - 0.15 * f;
  const chutePts = [];
  for (let i = 0; i <= 40; i++) { const f = i / 40; chutePts.push(new THREE.Vector3(chuteX, chuteY(f), lerp(CH_Z0, CH_Z1, f))); }
  for (const rx of [-0.42, 0.42]) for (let i = 0; i < 40; i++) {
    const a = chutePts[i], b = chutePts[i + 1];
    for (let k = 0; k < 6; k++) {
      const a0 = k / 6 * Math.PI * 2, a1 = (k + 1) / 6 * Math.PI * 2, am = (a0 + a1) / 2, r = 0.13;
      const o0 = [Math.cos(a0) * r + rx, Math.sin(a0) * r], o1 = [Math.cos(a1) * r + rx, Math.sin(a1) * r];
      pquad([a.x + o0[0], a.y + o0[1], a.z], [a.x + o1[0], a.y + o1[1], a.z], [b.x + o1[0], b.y + o1[1], b.z], [b.x + o0[0], b.y + o0[1], b.z],
        [Math.cos(am), Math.sin(am), 0], brass, 1, -1e3, -1e3, 0, 0);
    }
  }
  const reel = (x, y0, z, h, thread) => {
    const prof = [[0.95, 0], [0.95, 0.12], [0.56, 0.2], [0.56, 0.8], [0.95, 0.88], [0.95, 1], [0.02, 1]], wood = boxA;
    for (let j = 0; j < prof.length - 1; j++) {
      const [r0, h0] = prof[j], [r1, h1] = prof[j + 1], col = j === 2 ? thread : wood;
      let ny = r0 - r1, nr = (h1 - h0) * h; const l = Math.hypot(ny, nr) || 1; ny /= l; nr /= l;
      for (let k = 0; k < 10; k++) {
        const a0 = k / 10 * Math.PI * 2, a1 = (k + 1) / 10 * Math.PI * 2, am = (a0 + a1) / 2;
        const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        pquad([x + c0 * r0, y0 + h0 * h, z + s0 * r0], [x + c1 * r0, y0 + h0 * h, z + s1 * r0], [x + c1 * r1, y0 + h1 * h, z + s1 * r1], [x + c0 * r1, y0 + h1 * h, z + s0 * r1],
          [Math.cos(am) * nr, ny, Math.sin(am) * nr], col, 0, -1e3, -1e3, 0, 0);
      }
    }
  };
  for (let i = 1; i <= 40; i += 3) {
    const p = chutePts[i], top = p.y - 0.13, n = Math.max(1, Math.round(top / 1.3)), h = top / n;
    for (let j = 0; j < n; j++) reel(p.x, j * h, p.z, h, paints[(i + j) % Math.min(4, paints.length)]);
  }
  {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(pn, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(pc, 3)); g.setAttribute('aM', new THREE.Float32BufferAttribute(pm, 3));
    propMat.side = THREE.DoubleSide;
    const mesh = new THREE.Mesh(g, propMat); mesh.frustumCulled = false; object.add(mesh);
  }
  const marble = new THREE.Mesh(new THREE.SphereGeometry(MR, 28, 18), marbleMat);
  object.add(marble);
  const marbleAt = (v, out = new THREE.Vector3()) => {
    const q = clamp(v, 0, 1), f = q * (0.3 + 0.7 * q), z = lerp(CH_Z0, strike.z + MR + 0.2, f), fz = (CH_Z0 - z) / (CH_Z0 - CH_Z1);
    const y = lerp(chuteY(Math.min(fz, 1)) + 0.81, MR, smoothstep(1, 1.25, fz));
    return out.set(chuteX, y, z);
  };
  await ctx.yield();

  // ---- anchors ----
  const station = (s, out = new THREE.Vector3()) => out.fromArray(eyeFn(s));
  const eyeStations = []; for (let s = 0; s <= S_END; s += 20) eyeStations.push(station(s));
  const anchors = {
    station, eyeStations, flyThrough: eyeStations,
    portalSeat: { position: new THREE.Vector3(archAt.x, archAt.y + (ARCH.spring + ARCH.inner) / 2, archAt.z - 1), facing: new THREE.Vector3(0, 0, 1), shape: 'arch', width: ARCH.inner * 2 - 1.2, height: ARCH.spring + ARCH.inner - 0.6, radius: ARCH.inner - 0.6 },
    arch: { foot: archAt.clone(), inner: ARCH.inner, outer: ARCH.outer, spring: ARCH.spring, top: NC * ARCH.course + 2 },
    wallFrontMax,
    neck: { foot: neckAt.clone(), top: new THREE.Vector3(neckAt.x + 0.8, neckAt.y + NT * 2.3 + 2, neckAt.z), height: NT * 2.3 + 2 },
    fan: { apex: new THREE.Vector3(0, 0, APEX_Z), rim: RIMv, halfAngle: PHIv * (1 + curl), aisle: 6 },
    strike: strike.clone(), fanFrontMax,
    line: { offset: 4, rulerFrom: RULER_FROM, end: LINE_END, base: (s, out = new THREE.Vector3()) => { const b = lineBase(s, 1); return out.set(b.x, b.y, b.z); } },
    second: { present: rare, start: SECOND_FROM, base: (s, out = new THREE.Vector3()) => { const b = lineBase(s, -1); return out.set(b.x, b.y, b.z); } },
    chute: { x: chuteX, points: chutePts },
    marble: marbleAt,
    lookAt: new THREE.Vector3(0, 1, -10),
    viewpoints: { entry: station(0), crest: station(200), rim: station(405), peacock: station(520), arch: station(845) },
    design: designName,
  };

  // ---- state ----
  let driven = false, marbleV = 0;
  const F = U.uFront.value, size = new THREE.Vector2(), mp = new THREE.Vector3();
  const setLineFront = (s) => { driven = true; F.x = s; };
  const setFanFront = (m) => { driven = true; F.y = m; };
  const setSecondFront = (s) => { driven = true; F.z = s; };
  const setMarble = (v) => { driven = true; marbleV = v; };
  const setShiver = (k) => { driven = true; U.uShiver.value = k; };
  const setWallFront = (m, m2 = -1e3) => { driven = true; F.w = m; U.uFront2.value = m2; };
  const setProgress = (u, lead = 9) => {
    driven = true;
    const s = u * S_END;
    F.x = -2 + (s + lead + 2) * smoothstep(0.012, 0.05, u);
    F.y = fanFrontMax * clamp((u - 0.47) / 0.13, 0, 1);
    F.z = u < 0.22 ? -1e3 : s + lead - 14 * (1 - smoothstep(0.22, 0.9, u));
    marbleV = clamp((u - 0.4) / 0.07, 0, 1);
    U.uShiver.value = smoothstep(0.93, 0.985, u);
  };
  const setLight = (o = {}) => {
    if (o.sunDir) { sunDir.fromArray(o.sunDir.isVector3 ? o.sunDir.toArray() : o.sunDir).normalize(); if (sunDir.y < 0.1) { sunDir.y = 0.1; sunDir.normalize(); } }
    if (o.sunColor) U.uSun.value.copy(o.sunColor.isColor ? o.sunColor : lin(o.sunColor));
    if (o.skyColor) U.uSky.value.copy(o.skyColor.isColor ? o.skyColor : lin(o.skyColor));
    if (o.bounceColor) U.uBounce.value.copy(o.bounceColor.isColor ? o.bounceColor : lin(o.bounceColor));
    if (o.shadowColor) U.uShadowColor.value.copy(o.shadowColor.isColor ? o.shadowColor : lin(o.shadowColor));
    if (o.shadowStrength !== undefined) U.uShadowStrength.value = o.shadowStrength;
    if (o.sunAmount !== undefined) U.uSunAmount.value = o.sunAmount;
    if (o.slats) U.uSlat.value.set(o.slats[0], o.slats[1]);
    if (o.paintNeutral !== undefined) U.uPaint.value.x = o.paintNeutral;
    if (o.paintSat !== undefined) U.uPaint.value.y = o.paintSat;
  };
  if (opts.progress !== undefined) setProgress(opts.progress);

  function update(dt, time, camera) {
    U.uTime.value = time;
    if (ctx.renderer && ctx.renderer.getDrawingBufferSize) U.uBufH.value = ctx.renderer.getDrawingBufferSize(size).y;
    if (!driven) {                                   // demo loop for the set-piece viewer
      const T = time % 20;
      F.x = (time * 25) % 900;
      F.y = fanFrontMax * clamp((T - 2) / 14, 0, 1);
      F.z = F.x - 12; F.w = wallFrontMax * clamp((T - 6) / 12, 0, 1); U.uFront2.value = wallFrontMax * clamp((T - 16) / 8, 0, 1) - 1;
      marbleV = clamp(T / 2, 0, 1);
      U.uShiver.value = 0.3 + 0.3 * Math.sin(time * 0.7);
    }
    marbleAt(marbleV, mp);
    marble.position.copy(mp);
    marble.rotation.x = -(CH_Z0 - mp.z) / MR;
  }
  update(0, 0, null);

  // viewer framing: the fan (the line runs on for 480 m either way); the centre is raised so the orbiting viewer stays above the floor
  const radius = 70, height = 80, center = new THREE.Vector3(0, 26, -10);

  return {
    object, radius, height, center, anchors, update, dispose() {}, ground: true, groundY: 0,
    setProgress, setLineFront, setFanFront, setSecondFront, setWallFront, setMarble, setShiver, setLight, setWindows,
    uniforms: U, meshes: { fan: fanMesh, near: nearMesh, wall: wallMesh, marble }, counts: { fan: fanT.length, near: nearT.length, shadows: shadows.length, puffs: puffs.length },
  };
}
