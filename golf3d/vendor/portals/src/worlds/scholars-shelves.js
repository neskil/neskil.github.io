// THE SCHOLAR'S SHELVES: a Joseon chaekgeori (painted bookshelf screen) flown through in reverse perspective.
// A pelt curtain lifts on nine compartments, each twice the volume of the last, down one axis toward -Z: the
// vermilion table whose edges spread apart, the brush pot the size of a well, a fan that opens, slipcases that
// slide out like organ stops, a bowl of goldfish, cut fruit, an incense curl, scrolls that unroll, a pendulum
// clock, peacock feathers and coral, a go board where a stone comes down, a pendant that swings across, and at
// last the hall: book pagodas round a vase whose petals fall the size of sails, a striped cat on the cornice over
// the round lattice window, and the portal in the window's eye. A magpie leads the way and grows with the rooms.
//
// The enfilade itself is the hero (src/parts/scholars-shelves.js); world space is its local space. This file adds
// the path, the pace, the gaze, the cast (magpies, butterflies, goldfish) and the still life of every compartment,
// all painted with the hero's own two pigment programs (hero.kit) so nothing here is lit, shaded or fogged.
//
// Looks by seed: shelf backs indigo (the default), vermilion (the festival screen: pomegranates heaped in every
// compartment and paper fish swinging on cords) or ink (the night screen); the season's flower in the vase; a
// striped or spotted cat with a matching curtain; one magpie or a pair. Rare event (ctx.vary.rare): the hall's
// right wall, one leaf of the folding screen, hinges outward over u 0.60..0.84 onto a second hall that stands
// beside the window: vermilion ground, three towers, a vase of white lotus.
// Scripted on u: curtain parted from the start and gathered by 0.04, walls 1-4 folding from the start (done 0.028), walls 5-7
// at 0.07, 0.13, 0.22 and the hall's at 0.46; gaze on the cat over the window 0.70..0.905, then a nod down to the window; magpie hops 0.046, 0.088, 0.166, 0.305, 0.43,
// 0.776; fan 0.05..0.10; scrolls and cases as the camera nears; the go stone falls 0.374..0.464 (in frame from 0.40) as the magpie
// leaves the stone bowl at 0.43; the pendant swings across the axis at 0.48; magpie on the cornice from 0.812.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, smoothstep } from '../kit/core.js';
import { buildHero } from '../parts/scholars-shelves.js';

const TAU = Math.PI * 2;
const PALETTE = ['#D9C39A', '#1F1A17', '#1F3460', '#3F8F6B', '#C8432B', '#F4EEDD', '#C9952F'];
const FLOOR_B = -10.08, CEIL_B = 13.92;
const FRONT_Z = [-36, -58, -85, -119, -162, -216, -285, -371, -480, -690];

// ---------------------------------------------------------------- the birds and butterflies: flat painted cut-outs
const BIRD_VERT = /* glsl */`
attribute vec2 aC; varying vec2 vC;
void main() { vC = aC; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const BIRD_FRAG = /* glsl */`
uniform vec3 uPal[13]; uniform float uInk; uniform float uTime;
uniform vec4 uBird;    // pose (0 perched magpie, 1 flying magpie, 2 butterfly), flap phase, facing, phase offset
uniform vec4 uSlots;   // pigment slots: tail / wing base, wing edge, body, spare
varying vec2 vC;
float ell(vec2 p, vec2 c, vec2 r) { vec2 q = (p - c) / r; return (length(q) - 1.) * min(r.x, r.y); }
float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0., 1.); return length(pa - ba * h); }
vec2 rot(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
void main() {
  vec2 p = vC; p.x *= uBird.z;
  float px = max(max(fwidth(vC.x), fwidth(vC.y)), 1e-5), hl = max(0.011, uInk * px * 0.5);
  vec3 ink = uPal[1], wht = uPal[5];
  int sa = int(uSlots.x + 0.5), sb = int(uSlots.y + 0.5);
  int sc = int(uSlots.z + 0.5);
  vec3 ca = uPal[sa], cb = uPal[sb], bodyC = uPal[sc];
  vec3 col = bodyC; float dAll = 1., k = 0., t = uTime + uBird.w;
  if (uBird.x < 0.5) {                                   // magpie perched, in profile, feet at (0.07, -0.46)
    vec2 q = p - vec2(0., 0.014 * sin(t * 2.3));
    float flick = 0.16 * sin(t * 1.9) * smoothstep(0.3, 0.9, sin(t * 0.63 + 1.));
    vec2 qb = rot(q - vec2(0.05, 0.), -0.38);
    float dBody = ell(qb, vec2(0.), vec2(0.37, 0.235));
    float nod = 0.03 * smoothstep(0.5, 1., sin(t * 0.9 + 2.));
    vec2 hc = vec2(0.37 + nod, 0.25 - nod);
    float dHead = length(q - hc) - 0.155;
    float tb = clamp((q.x - hc.x - 0.11) / 0.2, 0., 1.);
    float dBeak = seg(q, hc + vec2(0.11, 0.), hc + vec2(0.31, -0.03)) - 0.052 * (1. - tb);
    vec2 ta = vec2(-0.22, -0.05), te = ta + rot(vec2(-0.76, -0.33), flick);
    float tt = clamp(dot(q - ta, te - ta) / max(dot(te - ta, te - ta), 1e-5), 0., 1.);
    float dTail = seg(q, ta, te) - mix(0.095, 0.05, tt);
    float dLeg = min(seg(q, vec2(0.0, -0.2), vec2(0.0, -0.45)), seg(q, vec2(0.14, -0.2), vec2(0.14, -0.45))) - 0.02;
    float dFoot = seg(q, vec2(-0.07, -0.45), vec2(0.22, -0.45)) - 0.02;
    dAll = min(min(min(dBody, dHead), min(dBeak, dTail)), min(dLeg, dFoot));
    if (dAll > hl) discard;
    if (dTail < 0. && dBody > 0.) col = ca;
    float dBelly = ell(qb, vec2(0.07, -0.11), vec2(0.27, 0.14));
    if (dBody < 0. && dBelly < 0.) col = wht;
    float dWing = ell(qb, vec2(-0.13, 0.055), vec2(0.31, 0.125));
    if (dWing < 0. && dBody < hl) col = qb.x < -0.2 ? ca : bodyC;
    float dPatch = ell(qb, vec2(0.02, 0.1), vec2(0.17, 0.07));
    if (dPatch < 0.) col = wht;
    k = max(k, (1. - smoothstep(hl * 0.7 - px, hl * 0.7 + px, min(abs(dWing), abs(dPatch)))) * step(dBody, 0.));
    k = max(k, (1. - smoothstep(hl * 0.7 - px, hl * 0.7 + px, abs(dBelly))) * step(dBody, 0.) * step(dWing, 0.) * 0.);
    float dEye = length(q - hc - vec2(0.045, 0.035));
    if (dEye < 0.045) col = dEye < 0.02 ? ink : wht;
  } else if (uBird.x < 1.5) {                            // magpie flying, in profile, wings beating
    float sA = sin(uBird.y), sa1 = 0.22 + 0.78 * sA, sa2 = 0.22 + 0.78 * sin(uBird.y - 0.8);
    sa1 = (sa1 < 0. ? -1. : 1.) * max(abs(sa1), 0.24); sa2 = (sa2 < 0. ? -1. : 1.) * max(abs(sa2), 0.24);
    vec2 q = p + vec2(0., 0.05 * sA);
    vec2 qb = rot(q, 0.1);
    float dBody = ell(qb, vec2(0.02, 0.), vec2(0.36, 0.17));
    vec2 hc = vec2(0.4, 0.07);
    float dHead = length(q - hc) - 0.14;
    float tb = clamp((q.x - hc.x - 0.1) / 0.2, 0., 1.);
    float dBeak = seg(q, hc + vec2(0.1, 0.), hc + vec2(0.3, -0.02)) - 0.05 * (1. - tb);
    float tt = clamp((-0.25 - q.x) / 0.75, 0., 1.);
    float dTail = seg(q, vec2(-0.25, -0.01), vec2(-1.0, -0.08 + 0.05 * sin(t * 3.1))) - mix(0.07, 0.125, tt);
    vec2 sh = vec2(0.06, 0.06);
    vec2 w1 = vec2(q.x - sh.x, (q.y - sh.y) / sa1); w1.x += 0.34 * w1.y;
    vec2 w2 = vec2(q.x - sh.x - 0.09, (q.y - sh.y) / sa2); w2.x += 0.34 * w2.y;
    float dW1 = ell(w1, vec2(-0.02, 0.42), vec2(0.26, 0.44)) * min(1., abs(sa1) + 0.3);
    float dW2 = ell(w2, vec2(-0.02, 0.42), vec2(0.26, 0.44)) * min(1., abs(sa2) + 0.3);
    dAll = min(min(min(dBody, dHead), min(dBeak, dTail)), min(dW1, dW2));
    if (dAll > hl) discard;
    if (dW2 < 0.) { col = w2.y > 0.5 ? wht : ca; }
    k = max(k, 1. - smoothstep(hl - px, hl + px, abs(dW2)));
    if (dTail < 0.) { col = ca; k = 0.; }
    if (dBody < 0. || dHead < 0. || dBeak < 0.) { col = bodyC; k = 0.; }
    if (dBody < 0. && ell(qb, vec2(0.05, -0.085), vec2(0.26, 0.1)) < 0.) col = wht;
    float dEye = length(q - hc - vec2(0.04, 0.03));
    if (dEye < 0.042) col = dEye < 0.019 ? ink : wht;
    k = max(k, (1. - smoothstep(hl - px, hl + px, min(abs(dBody), abs(dTail)))) * step(0., dW1));
    if (dW1 < 0.) {
      col = w1.y > 0.46 ? wht : bodyC; k = 0.;
      float feather = abs(fract(w1.x * 9.) - 0.5) / max(fwidth(w1.x) * 9., 1e-5);
      k = max(k, (1. - smoothstep(0.3, 1.1, feather)) * step(0.46, w1.y) * 0.8);
      k = max(k, 1. - smoothstep(0.6, 1.4, abs(w1.y - 0.46) / max(fwidth(w1.y), 1e-5)));
    }
    k = max(k, 1. - smoothstep(hl - px, hl + px, abs(dW1)));
  } else {                                               // butterfly, wings open and closing
    float c = 0.3 + 0.7 * abs(cos(uBird.y));
    vec2 q = p; float ax = abs(q.x);
    vec2 w = vec2(ax / c, q.y);
    float dUp = ell(rot(w - vec2(0.5, 0.3), -0.45), vec2(0.), vec2(0.5, 0.33));
    float dLo = ell(rot(w - vec2(0.34, -0.3), 0.5), vec2(0.), vec2(0.36, 0.27));
    float dWing = min(dUp, dLo) * mix(c, 1., 0.5);
    float dBody = seg(q, vec2(0., -0.36), vec2(0., 0.34)) - 0.055;
    float dAnt = min(seg(vec2(ax, q.y), vec2(0.02, 0.36), vec2(0.2, 0.72)), length(vec2(ax, q.y) - vec2(0.2, 0.72)) - 0.02) - 0.012;
    dAll = min(min(dWing, dBody), dAnt);
    if (dAll > hl) discard;
    if (dWing < 0.) {
      col = min(dUp, dLo) > -0.085 ? cb : ca;
      float spot = min(length(rot(w - vec2(0.5, 0.3), -0.45) - vec2(0.16, 0.03)) - 0.085, length(w - vec2(0.38, -0.34)) - 0.06);
      if (spot < 0.) col = cb;
      k = max(k, 1. - smoothstep(hl * 0.6 - px, hl * 0.6 + px, abs(spot)));
      k = max(k, (1. - smoothstep(hl * 0.6 - px, hl * 0.6 + px, abs(min(dUp, dLo) + 0.085))) * 0.8);
      k = max(k, (1. - smoothstep(hl * 0.8 - px, hl * 0.8 + px, abs(dLo))) * step(dUp, 0.));
    }
    if (dBody < 0.) col = ink;
  }
  k = max(k, 1. - smoothstep(hl - px, hl + px, abs(dAll)));
  gl_FragColor = vec4(mix(col, ink, clamp(k, 0., 1.)), 1.);
}`;

// pace by the brief: 8 m/s under the curtain, rising with the size of the rooms to 30 m/s, the linger in the hall
function paceOf(u) {
  const rise = 0.53 + 1.47 * smoothstep(0.08, 0.62, u);
  const fall = 1.5 * smoothstep(0.70, 0.78, u);
  const back = 0.5 * smoothstep(0.86, 0.90, u);
  return rise - fall + back;
}

export default {
  id: 'scholars-shelves',
  name: "The Scholar's Shelves",
  category: 'interior',
  weirdness: 0.45,
  media: ['interior'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {}, density = vary.density ?? 1;

    // ---- the look of this visit (its own stream, so that the choice does not move with the build)
    const lr = makeRng(hashSeed('chaekgeori:' + ctx.seed));
    let backs = lr.pick(['indigo', 'ink', 'indigo', 'vermilion', 'indigo', 'ink', 'vermilion', 'indigo']);
    const flower = lr.pick(['peony', 'peony', 'lotus', 'chrysanthemum', 'plum', 'peony']);
    const cat = lr.pick(['striped', 'striped', 'spotted']);
    const curtain = cat === 'spotted' ? 'leopard' : lr.pick(['leopard', 'leopard', 'tiger']);
    const pair = lr.chance(0.4);
    if (vary.hour === 'night') backs = 'ink'; else if (vary.hour === 'golden') backs = 'vermilion'; else if (vary.hour === 'day' || vary.hour === 'dawn') backs = 'indigo';
    const festival = backs === 'vermilion', night = backs === 'ink';
    scene.background = new THREE.Color(PALETTE[0]);

    const hero = await buildHero(ctx, { palette: PALETTE, backs, flower, cat, curtain, rare: !!vary.rare, petals: clamp(density, 0.7, 1.3) });
    scene.add(hero.object);
    await ctx.yield();

    const A = hero.anchors, K = hero.kit, S = hero.scaleAt, hp = K.hp;
    const { prism, card, lathe, rawQuad, setA, setB, setP, still } = K;
    const { TAN, INK, IND, MAL, VER, WHT, OCH } = K.pigment;
    const PT = K.pattern;
    const rng = ctx.rng;
    const PS = K.makeBatch(false), PM = K.makeBatch(true);       // the still life: still things, moving and round things
    const UV4 = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const flatQ = (bt, c0, c1, c2, c3, em = 15, pre = null) => rawQuad(bt, c0, c1, c2, c3, UV4[0], UV4[1], UV4[2], UV4[3], em, pre);
    // pigments that must stand against the shelf backs of this visit
    const ACC = festival ? IND : VER, DEEP = festival ? IND : MAL;
    // a low stand in shelf units: a board on a flared plinth; returns the b of its top
    const stand = (a, z, w, d, h, top = OCH, side = MAL) => {
      const s = S(z), z0 = z + d * s * 0.5, z1 = z - d * s * 0.5;
      prism(PS, a - w * 0.42, a + w * 0.42, FLOOR_B, FLOOR_B + h - 0.35, z0 - d * s * 0.08, z1 + d * s * 0.08, { f: 1.18, faces: { front: [side, WHT, PT.COIN], left: [OCH, INK, 0], right: [OCH, INK, 0] }, k: 1.2 });
      prism(PS, a - w * 0.5, a + w * 0.5, FLOOR_B + h - 0.35, FLOOR_B + h, z0, z1, { f: 1.22, ay: 1, faces: { front: [TAN, ACC, PT.BAND], left: [side, INK, 0], right: [side, INK, 0], top: [top, INK, 0], bottom: [OCH, INK, 0] } });
      return FLOOR_B + h;
    };
    // round things in shelf units: rows of [radius, height above b0, base, second, pattern, repeat, edges]
    const turn = (a, b0, z, rows, seg = 24, close = true) => {
      const s = S(z), R = rows.map((q) => [q[0] * s, (b0 + q[1]) * s, q[2], q[3] ?? INK, q[4] ?? 0, q[5] ?? 6, q[6] ?? 3]);
      if (close) R.push([0.01, (b0 + rows[rows.length - 1][1]) * s - 0.04 * s]);
      still(PM); lathe(PM, a * s, z, R, seg);
    };
    // a cut-out standing in the picture plane (facing the entry), centre in shelf units, half-sizes in shelf units
    const cut = (bt, a, b, z, hw, hh, base, sec, pat, rot = 0, dz = 0) => {
      const s = S(z), c = Math.cos(rot), sn = Math.sin(rot);
      card(bt, [a * s, b * s, z + dz], [c * hw * s, sn * hw * s, 0], [-sn * hh * s, c * hh * s, 0], base, sec, pat);
    };
    // a cut-out lying on a surface (seen from above as we come): centre in shelf units
    const lie = (bt, a, b, z, hw, hd, base, sec, pat, rot = 0) => {
      const s = S(z), c = Math.cos(rot), sn = Math.sin(rot);
      card(bt, [a * s, b * s, z], [c * hw * s, 0, sn * hw * s], [sn * hd * s, 0.02 * s, -c * hd * s], base, sec, pat);
    };
    // fruit heaped in a dish: cut pomegranates, a slice of watermelon, a citron like a hand
    const fruit = (a, bTop, z, kinds, r = 1) => {
      turn(a, bTop, z, [[1.5 * r, 0, DEEP, INK, 0, 6, 1], [1.7 * r, 0.35 * r, WHT, DEEP, PT.COIN, 16, 3], [3.5 * r, 1.25 * r, DEEP, INK, 0, 6, 3], [3.6 * r, 1.5 * r, WHT]], 22);
      still(PS);
      let n = 0;
      for (const kd of kinds) {
        const fa = a + (n - (kinds.length - 1) / 2) * 1.75 * r, fb = bTop + (1.5 + 1.25 + (n % 2) * 0.55) * r, fz = z + (0.3 + n * 0.14) * S(z) * r;
        if (kd === 'melon') cut(PS, fa, fb + 0.7 * r, fz, 2.1 * r, 2.1 * r, MAL, VER, PT.FRUIT, 0.25);
        else if (kd === 'pom') { cut(PS, fa, fb, fz, 1.3 * r, 1.3 * r, VER, WHT, PT.FRUIT, n * 1.3); cut(PS, fa + 0.2 * r, fb + 1.45 * r, fz, 0.3 * r, 0.42 * r, VER, INK, PT.LOTUS); }
        else if (kd === 'whole') cut(PS, fa, fb, fz, 1.2 * r, 1.2 * r, VER, OCH, PT.DISC);
        else for (let j = 0; j < 6; j++) { const an = (j - 2.5) * 0.3; cut(PS, fa + Math.sin(an) * 1.15 * r, fb + 0.3 * r + Math.cos(an) * 1.15 * r, fz + j * 0.02, 0.4 * r, 1.3 * r, OCH, TAN, PT.LOTUS, -an); }
        n++;
      }
    };
    // an orchid in a pot, leaves swaying
    const orchid = (a, bTop, z, r = 1) => {
      const s = S(z);
      turn(a, bTop, z, [[1.5 * r, 0, WHT, INK, 0, 6, 1], [2.5 * r, 1.3 * r, WHT, DEEP, PT.HEX, 18, 3], [2.6 * r, 2.5 * r, DEEP, INK, 0, 6, 3], [1.9 * r, 3.1 * r, WHT, INK, 0, 6, 0], [2.1 * r, 3.6 * r, INK]], 22);
      for (let j = 0; j < 9; j++) {
        const la = (j - 4) * 0.27 + rng.range(-0.06, 0.06), L = rng.range(3.2, 5.4) * r * s, ph = rng.range(0, TAU), dx = Math.sin(la), dy = Math.cos(la);
        setA(PM, 6, ph, 0.9, 1); setB(PM, 0.4 * s * r * dy, -0.4 * s * r * dx, 0, 0);
        card(PM, [a * s + dx * L, (bTop + 3.4 * r) * s + dy * L, z + j * 0.05 * s], [dy * L * 0.26, -dx * L * 0.26, 0], [dx * L, dy * L, 0], MAL, INK, PT.LEAF);
      }
      for (let j = 0; j < 3; j++) {                                    // three small blooms on a bowed stalk
        const an = -0.5 + j * 0.22, L = (4.6 + j * 0.7) * r * s;
        setA(PM, 6, j * 1.1, 0.8, 1); setB(PM, 0.5 * s * r, 0.1 * s * r, 0, 0);
        card(PM, [a * s + Math.sin(an) * L, (bTop + 3.4 * r) * s + Math.cos(an) * L, z + 0.6 * s], [0.75 * r * s, 0, 0], [0, 0.75 * r * s, 0], WHT, ACC, PT.FRUIT);
      }
      still(PM);
    };

    // ---- compartment 2: an open book with round spectacles on the far end of the table; the folding fan beyond it
    const fan = { u0: 0.05, u1: 0.1 };
    {
      const TB = A.table.b + 0.08, PG = [WHT, INK, PT.PAGES], CV = [DEEP, INK, 0];
      prism(PS, -4.5, 4.5, TB, TB + 0.16, -69.2, -75.4, { f: 1.2, faces: { front: CV, left: CV, right: CV, top: CV } });
      for (const sd of [-1, 1]) prism(PS, sd > 0 ? 0.12 : -4.2, sd > 0 ? 4.2 : -0.12, TB + 0.16, TB + 0.62, -69.6, -75, { f: 1.2, axAbs: 0, ayAbs: TB, k: 1.6, faces: { front: PG, left: PG, right: PG, top: PG } });
      const zs = -72, s = S(zs), y = (TB + 0.74) * s + 0.25;
      for (const e of [1.2, 3.0]) card(PS, [e * s, y, zs], [0.86 * s, 0, 0], [0, 0.33 * s, -0.9 * s], INK, TAN, PT.RING);
      setP(PS, INK, INK, 0);
      for (const e of [0.34, 3.86]) flatQ(PS, [e * s - 0.07 * s, y, zs], [e * s + 0.07 * s, y, zs], [(e + (e > 2 ? 0.5 : -0.5)) * s + 0.07 * s, y + 0.5 * s, zs - 2.6 * s], [(e + (e > 2 ? 0.5 : -0.5)) * s - 0.07 * s, y + 0.5 * s, zs - 2.6 * s], 3);

      const zf = -81.5, sf = S(zf), px0 = 0, py0 = (FLOOR_B + 0.9) * sf, L = 5.3 * sf, n = 17, span = 2.8, phi0 = span / 2, dl = (span / (n - 1)) * 0.56;
      const pt = (r, an, z) => [px0 - Math.sin(an) * r, py0 + Math.cos(an) * r, z];
      prism(PS, -1.3, 1.3, FLOOR_B, FLOOR_B + 0.7, zf + 1.2, zf - 1.2, { f: 1.2, faces: { front: [OCH, INK, 0], left: [MAL, INK, 0], right: [MAL, INK, 0], top: [TAN, INK, 0] } });
      for (let j = 0; j < n; j++) {
        const z = zf + j * 0.03 * sf, e = Math.sin(0.09 * sf / L);
        setA(PM, 7, 3, -(j / (n - 1)) * span, 0); setB(PM, px0, py0, z, 2);
        setP(PM, WHT, INK, 0); flatQ(PM, pt(L * 0.34, phi0 + dl, z), pt(L * 0.34, phi0 - dl, z), pt(L * 0.8, phi0 - dl, z), pt(L * 0.8, phi0 + dl, z), 15);
        setP(PM, j % 2 ? DEEP : OCH, INK, 0); flatQ(PM, pt(L * 0.8, phi0 + dl, z), pt(L * 0.8, phi0 - dl, z), pt(L, phi0 - dl, z), pt(L, phi0 + dl, z), 15);
        setP(PM, j % 4 === 0 ? ACC : TAN, INK, 0); flatQ(PM, pt(0, phi0, z + 0.01), pt(0, phi0, z + 0.01), pt(L * 0.36, phi0 - e * 2.2, z + 0.01), pt(L * 0.36, phi0 + e * 2.2, z + 0.01), 3);
      }
      still(PM);
      card(PM, [px0, py0, zf + n * 0.03 * sf + 0.05], [0.55 * sf, 0, 0], [0, 0.55 * sf, 0], OCH, ACC, PT.DISC);
      setA(PM, 4, 0.4, 1.3, 0.3); setB(PM, px0, py0, zf, 2);
      card(PM, [px0, py0 - 1.5 * sf, zf + n * 0.03 * sf + 0.1], [0.4 * sf, 0, 0], [0, -1.2 * sf, 0], ACC, OCH, PT.LEAF);
      still(PM);
    }
    await ctx.yield();

    // ---- compartment 4: the bowl of goldfish, cut fruit, the incense burner and its curl
    const perch = {};
    {
      const zb = -137, s = S(zb), a = 7.4, top = stand(a, zb, 6.4, 2.6, 1.5);
      turn(a, top, zb, [[1.7, 0, DEEP, INK, 0, 6, 1], [2.0, 0.4, WHT, INK, 0, 6, 1], [3.5, 1.7, WHT, DEEP, PT.CLOUD, 9, 3], [3.6, 2.7, WHT, INK, 0, 6, 0], [3.1, 3.5, DEEP, INK, 0, 6, 3], [3.3, 3.8, INK, INK, 0, 6, 3]], 28, false);
      const wy = top + 3.45;
      still(PM); lie(PM, a, wy, zb, 3.05, 3.05, WHT, WHT, PT.DISC);
      const cx = a * s, cy = (wy + 0.12) * s;
      for (let j = 0; j < 3; j++) {                                    // three vermilion goldfish circling
        const ph = j * 2.1 + 0.5, rr = (1.15 + j * 0.62) * s, len = (1.25 - j * 0.12) * s, sp = -(0.55 + 0.11 * ((j * 2) % 3));
        const c = Math.cos(ph), sn = Math.sin(ph), fx = cx + c * rr, fz = zb + sn * rr, tx = -sn, tz = c;
        setA(PM, 10, 0, sp, 0); setB(PM, cx, cy, zb, 1);
        card(PM, [fx, cy + j * 0.02, fz], [c * len * 0.5, 0, sn * len * 0.5], [tx * len, 0, tz * len], VER, OCH, PT.PETAL);
        card(PM, [fx - tx * len * 1.45, cy + j * 0.02, fz - tz * len * 1.45], [c * len * 0.5, 0, sn * len * 0.5], [-tx * len * 0.6, 0, -tz * len * 0.6], VER, WHT, PT.LOTUS);
      }
      still(PM);
      perch.bowl = new THREE.Vector3((a - 3.3) * s, (top + 3.8) * s, zb);

      const zf = -131, tf = stand(-7.2, zf, 7.4, 2.8, 1.5, TAN, DEEP);
      fruit(-7.2, tf, zf, ['pom', 'melon', 'citron', 'pom'], 1.05);

      const zi = -157, si = S(zi), ai = -7.6, ti = stand(ai, zi, 4.6, 2.2, 1.8);
      turn(ai, ti, zi, [[1.3, 0, OCH, INK, 0, 6, 1], [1.0, 0.5, OCH, INK, 0, 6, 1], [2.1, 1.3, OCH, DEEP, PT.HEX, 16, 3], [2.2, 2.4, DEEP, INK, 0, 6, 3], [1.6, 3.0, OCH, INK, 0, 6, 1], [0.5, 3.7, ACC, INK, 0, 6, 3], [0.6, 4.1, INK]], 22);
      // the curl: a flat white ribbon with an ink edge that scrolls upward, ending in a cloud
      const x0 = ai * si, y0 = (ti + 4.0) * si, H = 11.5 * si, nS = 26;
      const sx = (t) => x0 + Math.sin(t * 5.2) * (0.5 + 1.6 * t) * si, hw = (t) => (0.16 + 0.75 * t * t) * si;
      setP(PM, WHT, INK, 0);
      for (let j = 0; j < nS; j++) {
        const t0 = j / nS, t1 = (j + 1) / nS;
        const pre = (c) => { const t = c < 2 ? t0 : t1; setA(PM, 12, -t * 7.5, 1.5, t); setB(PM, 0.9 * si, 0, 0, 0); };
        flatQ(PM, [sx(t0) - hw(t0), y0 + t0 * H, zi], [sx(t0) + hw(t0), y0 + t0 * H, zi], [sx(t1) + hw(t1), y0 + t1 * H, zi], [sx(t1) - hw(t1), y0 + t1 * H, zi], 3, pre);
      }
      setA(PM, 12, -7.5, 1.5, 1); setB(PM, 0.9 * si, 0, 0, 0.5 * si);
      for (const [dx, dy, r] of [[0, 0.4, 1.5], [-1.5, -0.1, 1.05], [1.6, -0.2, 1.15], [0.5, 1.3, 0.9]]) card(PM, [sx(1) + dx * si, y0 + H + dy * si, zi + 0.05 + r * 0.02], [r * si * 1.25, 0, 0], [0, r * si, 0], WHT, WHT, PT.DISC);
      still(PM);
    }
    await ctx.yield();

    // ---- compartment 5 (between the scrolls): citrons in a dish, an orchid on a stand
    {
      fruit(6.9, stand(6.9, -186, 6.6, 2.6, 1.6, TAN, DEEP), -186, ['citron', 'whole', 'citron'], 1.0);
      orchid(-8.0, stand(-8.0, -195, 5.0, 2.4, 2.4), -195, 0.82);
    }

    // ---- compartment 6: the pendulum clock with a dial of dots; five peacock feathers in a tall vase
    {
      const zc = -246, s = S(zc), a = 8.3, F0 = FLOOR_B, o = (extra) => ({ f: 1.15, axAbs: a, ayAbs: F0, ...extra });
      const SD = [MAL, WHT, PT.COIN], PL = [OCH, INK, 0];
      prism(PS, a - 2.6, a + 2.6, F0, F0 + 1.2, zc + 4.8, zc - 4.8, o({ k: 1.3, faces: { front: [TAN, ACC, PT.BAND], left: PL, right: PL, top: [TAN, INK, 0] } }));
      prism(PS, a - 1.9, a + 1.9, F0 + 1.2, F0 + 8.0, zc + 4.2, zc - 4.2, o({ k: 1.3, faces: { front: [OCH, INK, PT.HEX], left: SD, right: SD } }));
      prism(PS, a - 1.25, a + 1.25, F0 + 1.9, F0 + 7.4, zc + 4.3, zc + 4.25, o({ faces: { front: [WHT, INK, 0] } }));
      prism(PS, a - 2.45, a + 2.45, F0 + 8.0, F0 + 12.3, zc + 4.7, zc - 4.7, o({ k: 1.3, faces: { front: [TAN, ACC, PT.BAND], left: SD, right: SD, top: PL, bottom: PL } }));
      prism(PS, a - 1.7, a + 1.7, F0 + 12.3, F0 + 13.1, zc + 4.0, zc - 4.0, o({ faces: { front: [ACC, INK, 0], left: PL, right: PL, top: [ACC, INK, 0] } }));
      const zd = zc + 4.7 + 0.12, sd = S(zd), dy = F0 + 10.15;
      cut(PS, a, dy, zd, 1.8, 1.8, WHT, WHT, PT.DISC);
      for (let j = 0; j < 12; j++) { const an = (j / 12) * TAU; cut(PS, a + Math.sin(an) * 1.38, dy + Math.cos(an) * 1.38, zd, j % 3 ? 0.11 : 0.17, j % 3 ? 0.11 : 0.17, INK, INK, PT.DISC, 0, 0.03); }
      setP(PS, INK, INK, 0);
      for (const [an, len] of [[0.9, 1.15], [-2.2, 0.8]]) {
        const ex = Math.sin(an), ey = Math.cos(an), w = 0.07 * sd;
        flatQ(PS, [a * sd - ey * w, dy * sd + ex * w, zd + 0.05], [a * sd + ey * w, dy * sd - ex * w, zd + 0.05], [(a + ex * len) * sd + ey * w * 0.4, (dy + ey * len) * sd - ex * w * 0.4, zd + 0.05], [(a + ex * len) * sd - ey * w * 0.4, (dy + ey * len) * sd + ex * w * 0.4, zd + 0.05], 0);
      }
      const zp = zc + 4.3 + 0.15, sp = S(zp), px = a * sp, py = (F0 + 7.3) * sp, len = 4.3 * sp;       // the pendulum
      setA(PM, 4, 0.7, 2.1, 0.2); setB(PM, px, py, zp, 2);
      setP(PM, OCH, INK, 0); flatQ(PM, [px - 0.07 * sp, py - len, zp], [px + 0.07 * sp, py - len, zp], [px + 0.07 * sp, py, zp], [px - 0.07 * sp, py, zp], 3);
      card(PM, [px, py - len, zp + 0.04], [0.72 * sp, 0, 0], [0, 0.72 * sp, 0], OCH, ACC, PT.DISC);
      still(PM);
      perch.clock = new THREE.Vector3((a - 1.2) * sd, (F0 + 13.1 * 1.02) * sd, zc + 3);

      const zv = -257, sv = S(zv), av = -7.5, tv = stand(av, zv, 4.6, 2.2, 1.3);
      turn(av, tv, zv, [[1.1, 0, OCH, INK, 0, 6, 1], [1.4, 0.5, WHT, INK, 0, 6, 1], [2.15, 2.6, WHT, DEEP, PT.COIN, 12, 3], [1.9, 3.9, WHT, INK, 0, 6, 0], [0.9, 5.3, DEEP, INK, 0, 6, 3], [0.8, 6.3, WHT, INK, 0, 6, 0], [1.15, 6.9, INK]], 24);
      const mx = av * sv, my = (tv + 6.8) * sv;
      for (let j = 0; j < 5; j++) {                                    // the feathers bow as we pass
        const an = (j - 2) * 0.25 + rng.range(-0.04, 0.04), L = rng.range(7.4, 9.2) * sv, ph = rng.range(0, TAU), bend = (j - 2) * 0.1, nS = 6, hw = 0.07 * sv;
        const P = (t) => { const aa = an + bend * t * t; return [mx + Math.sin(aa) * L * t, my + Math.cos(aa) * L * t, zv + j * 0.06 * sv]; };
        const sway = (t) => { setA(PM, 6, ph, 0.8, t * t); setB(PM, 1.5 * sv, -0.3 * sv, 0, 0); };
        setP(PM, OCH, INK, 0);
        for (let q = 0; q < nS; q++) {
          const p0 = P(q / nS), p1 = P((q + 1) / nS), pre = (c) => sway(c < 2 ? q / nS : (q + 1) / nS);
          flatQ(PM, [p0[0] - hw, p0[1], p0[2]], [p0[0] + hw, p0[1], p0[2]], [p1[0] + hw, p1[1], p1[2]], [p1[0] - hw, p1[1], p1[2]], 3, pre);
        }
        const tip = P(1), pv = P(0.9), dx = tip[0] - pv[0], dyy = tip[1] - pv[1], dl = Math.hypot(dx, dyy) || 1, ex = dx / dl, ey = dyy / dl, r = 1.45 * sv;
        for (let q = 0; q < 4; q++) {                                  // barbs below the eye
          const t = 0.52 + q * 0.11, c = P(t), sgn = q % 2 ? 1 : -1, bl = 0.95 * sv;
          sway(t); card(PM, [c[0] + (ey * sgn * 0.6 + ex * 0.5) * bl, c[1] + (-ex * sgn * 0.6 + ey * 0.5) * bl, c[2] - 0.02], [ey * bl * 0.34, -ex * bl * 0.34, 0], [(ey * sgn * 0.6 + ex * 0.5) * bl, (-ex * sgn * 0.6 + ey * 0.5) * bl, 0], MAL, INK, PT.LEAF);
        }
        sway(1); card(PM, [tip[0], tip[1], tip[2] + 0.03], [ey * r * 0.8, -ex * r * 0.8, 0], [ex * r, ey * r, 0], MAL, OCH, PT.EYE);
      }
      still(PM);
    }
    await ctx.yield();

    // ---- compartment 7: the go board with the game half played; fruit; the long pendant in the doorway beyond
    const stoneU = [0.374, 0.464], DROP = 90;                         // the stone comes down from above the ceiling at an even pace and lands at the second
    {
      const z0 = -322, z1 = -357, s0 = S(z0), s1 = S(z1), a0 = -9.4, a1 = -1.4, ax = (a0 + a1) / 2, bT = FLOOR_B + 5.5, f = 1.22;
      prism(PS, a0, a1, FLOOR_B + 1.1, bT, z0, z1, { f, axAbs: ax, ayAbs: bT, k: 1, faces: { front: [TAN, INK, PT.GRAIN], left: [OCH, INK, 0], right: [OCH, INK, 0], top: [OCH, INK, PT.GRID] } });
      for (const [la, lz] of [[a0 + 0.9, z0 - 3], [a1 - 0.9, z0 - 3], [a0 + 0.9, z1 + 5], [a1 - 0.9, z1 + 5]]) prism(PS, la - 0.7, la + 0.7, FLOOR_B, FLOOR_B + 1.1, lz, lz - 3.5, { f: 1.1, faces: { front: [MAL, INK, 0], left: [DEEP, INK, 0], right: [DEEP, INK, 0] } });
      const dn = (z0 - z1) / s0, wb = 1 / (f * s1 / s0), slope = (bT * s1 - bT * s0) / (z0 - z1);
      const at = (i, j) => {                                         // world place of the grid crossing (i, j)
        const nu = j / dn, t = (nu * wb) / (1 - nu + nu * wb), sc = s0 + (f * s1 - s0) * t;
        return { x: ax * (s0 + (s1 - s0) * t) + (a0 + i - ax) * sc, y: bT * (s0 + (s1 - s0) * t), z: z0 + (z1 - z0) * t, r: 0.43 * sc };
      };
      const stone = (bt, i, j, white, g = 1) => {                    // a lens: a disc on the board and its swell seen from the side
        const p = at(i, j), c = white ? WHT : INK, r = p.r * g;
        card(bt, [p.x, p.y + 0.12 * s0, p.z], [r, 0, 0], [0, r * slope, -r * 0.92], c, c, PT.DISC);
        card(bt, [p.x, p.y + 0.12 * s0 + 0.3 * r, p.z + 0.02 * s0], [r, 0, 0], [0, 0.36 * r, 0], c, c, PT.RING);
      };
      const used = new Set(['7,6', '6,6', '7,5', '7,7', '6,5', '6,7']);
      let ci = 3, cj = 3;
      for (let n = 0; n < 34; n++) {                                  // two wandering groups, as a game leaves them
        if (n === 17) { ci = 5; cj = 5; }
        ci = clamp(ci + rng.int(-1, 1), 1, 7); cj = clamp(cj + rng.int(-1, 1), 1, 7);
        const key = ci + ',' + cj; if (used.has(key)) continue;
        used.add(key); stone(PS, ci, cj, n % 2 === 0);
      }
      setA(PM, 11, 5, 0, 0); setB(PM, 0, DROP, 0, 0); stone(PM, 7, 6, true, 1.5);                  // the stone that comes down
      {                                                              // its face, turned to us while it is in the air; it sinks into the board as the stone lies down
        const p = at(7, 6), r = p.r * 1.5;
        setB(PM, 0, DROP + r + 0.6, 0, 0);
        card(PM, [p.x, p.y - r - 0.6, p.z - 0.05 * s0], [r, 0, 0], [0, r, 0], WHT, WHT, PT.RING);
      }
      still(PM);
      // the lidded bowl of stones at the far corner of the board: the magpie waits on its lid, at eye level from the door
      const pb = at(7.3, 7.35), sb = S(pb.z);
      turn(pb.x / sb, pb.y / sb, pb.z, [[0.5, 0, DEEP, INK, 0, 6, 1], [0.7, 0.45, WHT, DEEP, PT.COIN, 12, 3], [0.7, 1.0, DEEP, INK, 0, 6, 3], [0.45, 1.3, OCH, INK, 0, 6, 1], [0.18, 1.46, INK]], 20);
      perch.goban = new THREE.Vector3(pb.x, pb.y + 1.44 * sb, pb.z);
      perch.stone = at(7, 6); perch.stoneDrop = DROP;

      fruit(7.0, stand(7.0, -331, 6.8, 2.6, 2.2, TAN, DEEP), -331, ['pom', 'whole', 'melon', 'pom'], 1.05);

      const zp = FRONT_Z[7] + 2.2, sp = S(zp), px = 4.2 * sp, py = (CEIL_B - 0.8) * sp, Y = (d) => py - (d + 5.2) * sp;
      setA(PM, 7, 4, 1, 0); setB(PM, px, py, zp, 2);
      setP(PM, ACC, INK, 0); flatQ(PM, [px - 0.09 * sp, Y(4.5), zp], [px + 0.09 * sp, Y(4.5), zp], [px + 0.09 * sp, py, zp], [px - 0.09 * sp, py, zp], 3);
      card(PM, [px, Y(5.4), zp + 0.05], [1.0 * sp, 0, 0], [0, 1.0 * sp, 0], MAL, WHT, PT.DISC);
      for (let j = 0; j < 4; j++) { const an = j * (TAU / 4) + 0.785, r = 0.95 * sp; card(PM, [px + Math.sin(an) * r, Y(7.5) + Math.cos(an) * r, zp + 0.08 + j * 0.02], [Math.cos(an) * r * 0.75, -Math.sin(an) * r * 0.75, 0], [Math.sin(an) * r, Math.cos(an) * r, 0], ACC, OCH, PT.LOTUS); }
      card(PM, [px, Y(7.5), zp + 0.2], [0.42 * sp, 0, 0], [0, 0.42 * sp, 0], OCH, WHT, PT.DISC);
      card(PM, [px, Y(8.95), zp + 0.1], [0.5 * sp, 0, 0], [0, 0.42 * sp, 0], OCH, OCH, PT.DISC);
      for (const e of [-1, 0, 1]) card(PM, [px + e * 0.42 * sp, Y(10.85), zp + 0.12 + (e === 0 ? 0.03 : 0)], [0.5 * sp, 0, 0], [e * 0.3 * sp, -1.6 * sp, 0], e === 0 ? ACC : OCH, OCH, PT.LEAF);
      still(PM);
    }

    // ---- compartment 8 (between the walls of cases): books piled with an orchid on top; a branch of coral
    {
      const zk = -418, a = -9.0, covs = [MAL, OCH, WHT, DEEP, ACC];
      let b = FLOOR_B;
      for (let j = 0; j < 4; j++) {
        const w = 6.2 - j * 0.6, h = 0.95, ja = a + (j % 2 ? 0.35 : -0.25), cv = covs[(j * 2 + 1) % covs.length];
        prism(PS, ja - w / 2, ja + w / 2, b, b + h, zk + 12 - j, zk - 12 + j, { f: 1.2, axAbs: a, ayAbs: FLOOR_B, k: 0.9, uo: j * 1.7, faces: { front: [cv, cv === WHT ? TAN : WHT, PT.SLIP], left: [WHT, INK, PT.PAGES], right: [WHT, INK, PT.PAGES], top: [j % 2 ? OCH : MAL, INK, 0] } });
        b += h;
      }
      orchid(a, b + 0.05, zk, 0.7);

      const zc = -436, s = S(zc), ac = 6.6, tc = stand(ac, zc, 5.0, 2.2, 1.4);
      turn(ac, tc, zc, [[1.4, 0, DEEP, INK, 0, 6, 1], [2.3, 1.2, WHT, DEEP, PT.HEX, 16, 3], [2.4, 2.3, DEEP, INK, 0, 6, 3], [1.8, 2.9, INK]], 22);
      setP(PS, ACC, INK, 0);
      const branch = (x, y, an, len, w, depth) => {
        const ex = Math.sin(an), ey = Math.cos(an), tx = x + ex * len, ty = y + ey * len, w1 = w * 0.72, z = zc + depth * 0.03 * s;
        flatQ(PS, [x - ey * w, y + ex * w, z], [x + ey * w, y - ex * w, z], [tx + ey * w1, ty - ex * w1, z], [tx - ey * w1, ty + ex * w1, z], depth === 0 ? 3 : 11);
        if (depth >= 4) return;
        branch(tx, ty, an - rng.range(0.35, 0.6), len * 0.72, w1, depth + 1);
        branch(tx, ty, an + rng.range(0.3, 0.55), len * 0.66, w1, depth + 1);
      };
      branch(ac * s, (tc + 2.6) * s, -0.08, 1.9 * s, 0.3 * s, 0);
    }
    await ctx.yield();

    // ---- the festival screen: pomegranates heaped in every compartment, paper fish swinging on cords
    if (festival) {
      for (let i = 0; i < 8; i++) {
        const D = FRONT_Z[i] - FRONT_Z[i + 1], sd = i % 2 ? 1 : -1;
        fruit(sd * 4.7, FLOOR_B, FRONT_Z[i] - 0.13 * D, ['pom', 'whole', 'pom'], 0.72);
        if (i > 0) fruit(-sd * 5.0, FLOOR_B, FRONT_Z[i] - 0.72 * D, ['whole', 'pom', 'whole', 'pom'], 0.72);
      }
      for (let i = 1; i < 9; i++) for (const sd of [-1, 1]) {
        const z = FRONT_Z[i] + 0.03 * (FRONT_Z[i - 1] - FRONT_Z[i]), s = S(z), x = sd * 11.2 * s, yT = (CEIL_B - 0.8) * s, ph = rng.range(0, TAU);
        setA(PM, 4, ph, 1.15, 0.2); setB(PM, x, yT, z, 2);
        setP(PM, INK, INK, 0); flatQ(PM, [x - 0.06 * s, yT - 3.2 * s, z], [x + 0.06 * s, yT - 3.2 * s, z], [x + 0.06 * s, yT, z], [x - 0.06 * s, yT, z], 3);
        card(PM, [x, yT - 4.6 * s, z + 0.03 * s], [0.95 * s, 0, 0], [0, 1.5 * s, 0], WHT, i % 2 ? IND : MAL, PT.PETAL);
        card(PM, [x, yT - 6.5 * s, z + 0.02 * s], [0.75 * s, 0, 0], [0, -0.7 * s, 0], WHT, i % 2 ? IND : MAL, PT.LOTUS);
        card(PM, [x + 0.3 * s, yT - 3.75 * s, z + 0.05 * s], [0.2 * s, 0, 0], [0, 0.2 * s, 0], INK, WHT, PT.DISC);
      }
      still(PM);
    }
    // ---- round the window, for the approach: two tasselled pendants under the cornice, petals down the back wall
    {
      const zw = FRONT_Z[9] + 3, yT = (4.17 - 0.87) * S(FRONT_Z[9]), Y = (d) => yT - d;
      for (const sd of [-1, 1]) {
        const x = sd * 33;
        setA(PM, 4, rng.range(0, TAU), 0.85, 0.11); setB(PM, x, yT, zw, 2);
        setP(PM, ACC, INK, 0); flatQ(PM, [x - 0.35, Y(8), zw], [x + 0.35, Y(8), zw], [x + 0.35, yT, zw], [x - 0.35, yT, zw], 3);
        card(PM, [x, Y(11.6), zw + 0.1], [4, 0, 0], [0, 4, 0], MAL, WHT, PT.RING);
        for (let j = 0; j < 4; j++) { const an = j * (TAU / 4) + 0.785, r = 3.3; card(PM, [x + Math.sin(an) * r, Y(18.6) + Math.cos(an) * r, zw + 0.15 + j * 0.03], [Math.cos(an) * r * 0.75, -Math.sin(an) * r * 0.75, 0], [Math.sin(an) * r, Math.cos(an) * r, 0], ACC, OCH, PT.LOTUS); }
        card(PM, [x, Y(18.6), zw + 0.4], [1.5, 0, 0], [0, 1.5, 0], OCH, WHT, PT.DISC);
        for (const e of [-1, 0, 1]) card(PM, [x + e * 1.5, Y(29.5), zw + 0.2 + (e === 0 ? 0.05 : 0)], [1.8, 0, 0], [e * 1.1, -6.6, 0], e === 0 ? ACC : OCH, OCH, PT.LEAF);
      }
      const plum = flower === 'plum', nW = Math.round((plum ? 64 : 18) * detail), FLW = K.pigment.FLOWER, FLW2 = K.pigment.FLOWER2;
      for (let i = 0; i < nW; i++) {
        const half = (plum ? 1.8 : 5.4) * rng.range(0.8, 1.2), w = half * 0.62, sd = i % 2 ? 1 : -1, yTop = rng.range(18, 58);
        setP(PM, i % 3 === 1 ? FLW2 : FLW, i % 3 === 1 ? WHT : FLW2, flower === 'lotus' || flower === 'chrysanthemum' ? PT.LOTUS : PT.PETAL);
        setA(PM, 5, rng(), rng.range(4, 7), rng.range(0.25, 0.6) * sd); setB(PM, sd * rng.range(28, 72), yTop, rng.range(-686, -677), yTop + 78);
        rawQuad(PM, [-w, -half, 0], [w, -half, 0], [w, half, 0], [-w, half, 0], [-1, -1], [1, -1], [1, 1], [-1, 1], 0);
      }
      still(PM);
    }
    {
      orchid(-11.6, stand(-11.6, -68, 4.4, 2.2, 1.6), -68, 0.72);
      const er = makeRng(hashSeed('chaekgeori-petals:' + ctx.seed)), FLW = K.pigment.FLOWER, FLW2 = K.pigment.FLOWER2;
      const pp = flower === 'lotus' || flower === 'chrysanthemum' ? PT.LOTUS : PT.PETAL, small = flower === 'plum' ? 0.5 : 1;
      const nE = Math.round((flower === 'plum' ? 60 : 30) * detail);
      for (let i = 0; i < nE; i++) {
        const z = er.range(-86, -40), s = S(z), half = er.range(0.75, 1.15) * s * small, w = half * 0.62, sd = i % 2 ? 1 : -1;
        const x = sd * er.range(5.5 + half, 13.5 * s), yTop = CEIL_B * s * 0.96;
        setP(PM, i % 3 === 1 ? FLW2 : FLW, i % 3 === 1 ? WHT : FLW2, pp);
        setA(PM, 5, er(), er.range(1.6, 2.6) * s, er.range(0.3, 0.6) * sd); setB(PM, x, yTop, z, (CEIL_B - FLOOR_B) * s * 0.95);
        rawQuad(PM, [-w, -half, 0], [w, -half, 0], [w, half, 0], [-w, half, 0], [-1, -1], [1, -1], [1, 1], [-1, 1], 0);
      }
      still(PM);
    }
    const propsS = K.finish(PS), propsM = K.finish(PM);
    scene.add(propsS, propsM);
    await ctx.yield();

    // ---- the path: the hero's own line down the axis (a 5 m weave in compartments 3-5, a 14 m bow round the vase)
    const path = makePath(A.flyThrough.map((v) => [v.x, v.y, v.z]));

    // ---- the cast: magpies and butterflies, flat cut-outs that face the entry like everything else in the painting
    const birdGeo = new THREE.BufferGeometry();
    {
      const e = 1.16;
      birdGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-e, -e, 0, e, -e, 0, e, e, 0, -e, e, 0]), 3));
      birdGeo.setAttribute('aC', new THREE.BufferAttribute(new Float32Array([-e, -e, e, -e, e, e, -e, e]), 2));
      birdGeo.setIndex([0, 1, 2, 0, 2, 3]);
    }
    const mkBird = (pose, slotA, slotB, phase) => {
      const uBird = { value: new THREE.Vector4(pose, 0, 1, phase) };
      const mat = new THREE.ShaderMaterial({
        vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, side: THREE.DoubleSide,
        uniforms: { uPal: hero.uniforms.uPal, uInk: hero.uniforms.uInk, uTime: hero.uniforms.uTime, uBird, uSlots: { value: new THREE.Vector4(slotA, slotB, night ? IND : INK, 0) } },
      });
      const mesh = new THREE.Mesh(birdGeo, mat); mesh.frustumCulled = false;
      scene.add(mesh);
      return { mesh, uBird };
    };
    const wingOf = (z) => Math.min(40, 5.4 * S(z));
    // perches down the enfilade (where the feet stand), and the journey's u at which the magpie arrives and leaves
    const camAt = (u) => path.pointAt(u, new THREE.Vector3());
    let landing = A.pagodaTops[0] || new THREE.Vector3(60, 30, -620);
    {
      const pc = camAt(0.71); let best = 1e9;
      for (const t of A.pagodaTops) {
        const dz = pc.z - t.z; if (dz < 35 || t.z < -636) continue;
        const sc = Math.abs(Math.atan2(t.x - pc.x, dz)) + 0.6 * Math.abs(Math.atan2(t.y - pc.y, dz) - 0.2) + (t.x < 0 ? 0.25 : 0);
        if (sc < best) { best = sc; landing = t; }
      }
    }
    const pot = A.brushPot;
    const stops = [
      { p: new THREE.Vector3(A.inkstone.x + 0.6, A.inkstone.y + 0.1, A.inkstone.z), arrive: -1, leave: 0.046, o: 0.62 },
      { p: new THREE.Vector3(pot.position.x - pot.radius * 0.62, pot.rimY + 0.1, pot.position.z + pot.radius * 0.75), arrive: 0.064, leave: 0.088, o: 0.9 },
      { p: perch.bowl, arrive: 0.128, leave: 0.166, o: 1.2 },
      { p: perch.clock, arrive: 0.218, leave: 0.305, o: 0.45 },
      { p: perch.goban, arrive: 0.352, leave: 0.43, o: 0.62, long: true },
      { p: landing.clone(), arrive: 0.72, leave: 0.776, o: 0.5 },
      { p: new THREE.Vector3(47, A.cornice.y + 0.1, A.cornice.zFront + 1.6), arrive: 0.812, leave: 2, o: 0.62 },
    ];
    const magpies = [];
    const nMag = pair ? 2 : 1;
    for (let i = 0; i < nMag; i++) magpies.push({ ...mkBird(0, festival ? IND : MAL, 0, i * 2.7), lag: i * 0.011, side: i ? 1 : 0, pos: new THREE.Vector3() });
    // where magpie m is at journey u: writes m.pos, returns 0 when perched or 1..2 in flight (1 + flight progress)
    const magpieAt = (m, u, time) => {
      const uu = u - m.lag;
      let k = 0;
      while (k < stops.length - 1 && uu >= stops[k + 1].arrive) k++;
      const st = stops[k], off = m.side * wingOf(st.p.z) * st.o;
      if (uu <= st.leave || k === stops.length - 1) { m.pos.set(st.p.x + off, st.p.y, st.p.z); m.face = k < stops.length - 1 ? Math.sign(stops[k + 1].p.x - st.p.x) || 1 : -Math.sign(st.p.x) || 1; return 0; }
      const nx = stops[k + 1], t = clamp((uu - st.leave) / (nx.arrive - st.leave), 0, 1), long = !!st.long;
      const e = long ? 1 - Math.pow(1 - t, 1.7) : t * t * (3 - 2 * t), off2 = m.side * wingOf(nx.p.z) * nx.o;
      const d = st.p.distanceTo(nx.p), h = Math.min(34, d * (long ? 0.11 : 0.2));
      m.pos.set(st.p.x + off + (nx.p.x + off2 - st.p.x - off) * e, st.p.y + (nx.p.y - st.p.y) * e + Math.sin(Math.PI * t) * h + (long ? Math.sin(time * 0.9 + m.side) * 2.5 * Math.sin(Math.PI * t) : 0), st.p.z + (nx.p.z - st.p.z) * e);
      if (long) m.pos.x += Math.sin(Math.PI * t) * (m.side ? -26 : 20);
      m.face = Math.sign(nx.p.x - st.p.x) || 1;
      return 1 + t;
    };
    // two butterflies working the flowers: they drift between the heads nearest the path
    const heads = A.flowerHeads.slice().sort((p, q) => q.position.x - p.position.x).slice(0, 4);
    const flies = [];
    if (heads.length) {
      flies.push({ ...mkBird(2, WHT, OCH, 0.3), h0: heads[0], h1: heads[Math.min(2, heads.length - 1)], ph: 0.4 });
      flies.push({ ...mkBird(2, OCH, WHT, 1.9), h0: heads[Math.min(1, heads.length - 1)], h1: heads[Math.min(3, heads.length - 1)], ph: 3.1 });
    }
    await ctx.yield();

    // ---- the gaze
    const stoneAt = new THREE.Vector3();
    const stoneUp = (u) => clamp((stoneU[1] - u) / (stoneU[1] - stoneU[0]), 0, 1);   // 1 = above the ceiling, 0 = down on the board
    const pois = [
      { at: new THREE.Vector3(pot.position.x - 2, pot.rimY + 2, pot.position.z), from: 0.058, to: 0.112, weight: 0.3 },
      { at: (time, u) => stoneAt.set(perch.stone.x, perch.stone.y + 2 + perch.stoneDrop * stoneUp(u), perch.stone.z), from: 0.385, to: 0.475, weight: 0.35 },
    ];
    // rare visit: a modest turn to the right (about 20 degrees) keeps the window and the cat left of centre and the
    // opening leaf, with the second hall behind it, in the right of the same frame; the steady camera needs no turn
    if (vary.rare) pois.push({ at: A.rare.gaze.clone(), from: 0.66, to: 0.915, weight: 0.6 });
    else {
      // the cat over the window through the linger and until we are almost under the ledge; then a small nod down to the
      // window, so that the ledge leaves by the top of the frame cleanly instead of lying across it
      pois.push({ at: new THREE.Vector3(0, 16, A.cornice.zFront), from: 0.70, to: 0.905, weight: 0.75, fade: 0.2 });
      pois.push({ at: new THREE.Vector3(0, -13, FRONT_Z[9]), from: 0.875, to: 0.945, weight: 0.6 });
    }

    const uAng = hero.uniforms.uAng.value;
    return {
      scene, path, duration: 47, pace: paceOf,
      title: festival ? "The Scholar's Shelves: Festival Screen" : night ? "The Scholar's Shelves: Night Screen" : "The Scholar's Shelves",
      camera: { fov: 62, near: 0.5, far: 3000, lookAhead: 30, sway: 0.35, bank: 0 },
      pois,
      portal: { shape: 'circle', radius: A.portalSeat.radius, color: PALETTE[6], glow: 0.22, revealDistance: 240 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', companion: 'none', style: 'none',
      update(dt, time, camera, u) {
        hero.setProgress(u);
        if (vary.rare) hero.setFold(1.6 * smoothstep(0.60, 0.84, u));   // the leaf starts on the way in and stands wide through the linger
        hero.update(dt, time, camera);
        // scripted on u: the fan opens, the stone comes down, the pendant swings across
        uAng[3] = smoothstep(fan.u0, fan.u1, u);
        const env = 0.045 + 0.25 * smoothstep(0.36, 0.45, u) * (1 - smoothstep(0.5, 0.535, u));
        uAng[4] = -env * Math.cos(((u - 0.48) * TAU) / 0.085) + 0.035 * Math.sin(time * 0.8);
        uAng[5] = stoneUp(u);
        // the magpies
        for (let i = 0; i < magpies.length; i++) {
          const m = magpies[i], fl = magpieAt(m, u, time), sc = wingOf(m.pos.z) * 0.5;
          m.uBird.value.x = fl > 0 ? 1 : 0;
          m.uBird.value.y = time * (13 / Math.sqrt(Math.max(1, S(m.pos.z)))) + i * 1.3;
          m.uBird.value.z = m.face;
          m.mesh.scale.setScalar(sc);
          if (fl > 0) { m.uBird.value.z = m.face; m.mesh.position.copy(m.pos); m.mesh.rotation.z = 0.3 * m.face * Math.cos(Math.PI * (fl - 1)); }
          else { m.mesh.position.set(m.pos.x - 0.07 * sc * m.face, m.pos.y + 0.46 * sc, m.pos.z); m.mesh.rotation.z = 0; }
        }
        if (u > 0.5) hero.lookCatAt(magpies[0].pos); else hero.setCatLook(null);
        // the butterflies
        for (let i = 0; i < flies.length; i++) {
          const f = flies[i], w = 0.5 + 0.5 * Math.sin(time * 0.17 + f.ph), a = f.h0.position, b = f.h1.position, R = Math.max(7, f.h0.radius);
          const tt = time * 0.55 + f.ph;
          const wv = smoothstep(0.85, 0.905, u), gx = (i ? 15.5 : -16) + Math.cos(tt * 1.3) * 2.2, gy = (i ? -11.5 : 9.5) + Math.sin(tt * 1.9) * 1.7;   // to the window for the approach
          const fx = a.x + (b.x - a.x) * w + Math.cos(tt) * R * 0.8, fy = a.y + (b.y - a.y) * w + Math.sin(tt * 1.7) * R * 0.45 + R * 0.25, fz = Math.max(a.z, b.z) + 5 + 2 * Math.sin(tt * 0.6);
          f.mesh.position.set(fx + (gx - fx) * wv, fy + (gy - fy) * wv + Math.sin(Math.PI * wv) * 14, fz + (FRONT_Z[9] + 5 + i - fz) * wv);
          f.mesh.rotation.z = 0.5 * Math.sin(tt * 1.3) + (i ? -0.3 : 0.3);
          f.mesh.scale.setScalar(7 - wv);
          f.uBird.value.y = time * 5.2 + f.ph;
        }
      },
      dispose() {},
    };
  },
};
