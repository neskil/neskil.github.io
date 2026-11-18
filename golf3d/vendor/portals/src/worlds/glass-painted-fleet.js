// THE FLEET UNDER GLASS. Saint-Louis, Senegal, painted in reverse on glass (souwer): under an iron arch of the river
// bridge, down a sand street at balcony height, out along three hundred painted pirogues, then through three lines of
// surf on a pirogue's prow to a portal under two crossed prow spars.
// Coordinates: +Z west (sea), -Z east (river), -X north, +X south; mean water y = 0, island ground y = 1.
// Everything is drawn with the souwer materials of src/parts/glass-painted-fleet.js (ink in front, flat enamel behind,
// bronze deepest); nothing is lit. Looks by seed / ctx.vary.hour: noon, late afternoon (vermilion sky, bronze sun),
// night (stars, crescent, lanterns), harmattan (ochre sky, sand streaming), rains (violet squall). Rare: the sardinella run.
// The sea run goes through the fleet: the convoy sails out with us (one comes close alongside between the breakers), and beyond the
// third wave two big hulls lie at anchor either side of the last run, sails set, a string of pennants from masthead to masthead.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, makeSouwerMaterials, spriteMesh, SB, PAT, FLG, SEA, enc, PALETTE } from '../parts/glass-painted-fleet.js';

const TAU = Math.PI * 2;
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

const PTS = [[130, 2.5, -284], [100, 2.5, -284], [66, 2.5, -284], [46, 2.9, -281.5], [27, 3.6, -273.5], [11, 4.4, -260.5], [2, 5.0, -243], [0, 5.3, -215], [0, 5.4, -192],
  [0, 5.4, -150], [0, 5.4, -105], [0, 5.3, -64], [0, 5.1, -46], [-1.5, 5, -34], [-6.5, 4.8, -24.5], [-16, 3.9, -15.6], [-32, 3.0, -13.5], [-50, 2.5, -15.5], [-66, 2.5, -17.2],
  [-80, 2.7, -16.4], [-92, 3.1, -10.5], [-98.5, 3.4, -1.5], [-100, 3.2, 12], [-100, 2.9, 28], [-100, 2.8, 40], [-100, 3.3, 55], [-100, 2.9, 76], [-100, 3.9, 98], [-100, 3.2, 120], [-100, 4.7, 141],
  [-100, 3.5, 160], [-100, 2.8, 176], [-100, 2.6, 192], [-100, 2.6, 215]];
const DURATION = 48, GY = 1;                    // seconds; island ground level
const BR = { x: 65, z0: -203, span: 54, n: 7, deck: 9.5, w: 9 };

const LOOKS = {
  noon: { title: 'The Fleet Under Glass', sky: '#1B49B5', sea: '#12B5B0', tint: [1, 1, 1], bronze: 1, sun: [0.24, 0.97, 0.03], disc: 0, stars: 0, squall: 0, flap: 1, portal: '#F5B81F' },
  afternoon: { title: 'The Fleet at Vermilion Hour', sky: '#DE3A2C', sea: '#12B5B0', tint: [1, 0.97, 0.93], bronze: 1.25, sun: [0.5, 0.36, 0.78], disc: 0.075, discDir: [0.56, 0.15, 0.8], stars: 0, squall: 0, flap: 1, flagBronze: 1, portal: '#F5B81F' },
  night: { title: 'Lantern Night on the Fleet', sky: '#0E1340', sea: '#0D6F86', tint: [1, 1, 1], mul: [0.268, 0.349, 0.793], bronze: 1.1, sun: [-0.3, 0.8, 0.5], disc: 0.05, discDir: [-0.42, 0.5, 0.75], stars: 1, squall: 0, flap: 0.8, portal: '#F5B81F' },
  harmattan: { title: 'The Fleet in the Harmattan', sky: '#E2BC72', sea: '#22ADA0', tint: [1, 0.95, 0.86], bronze: 0.8, sun: [0.24, 0.97, 0.03], disc: 0, stars: 0, squall: 0, flap: 0.3, portal: '#E0322B' },
  rains: { title: 'The Fleet Before the Rain', sky: '#2A4CA6', sea: '#0F9C7C', tint: [0.96, 0.98, 1], bronze: 0.7, sun: [0.24, 0.97, 0.03], disc: 0, stars: 0, squall: 1, flap: 1.15, portal: '#F5B81F' },
};
const BRONZE_HEX = '#C08A2E';
const DOMS = [[3, 4], [1, 6], [7, 5]];

const frame = (x, y, z, yaw) => new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);

// One house front in local space: X along the facade (0..W), Y up from the ground, +Z out toward the viewer.
function houseFront(sb, K, rng, W, H, D, o = {}) {
  const wallC = rng.pick(K.lime), trim = rng.pick([K.cream, K.cream, K.lemon, K.pink]), shut = rng.pick(K.shut), door = rng.pick(K.shut), rail = rng.pick([shut, K.cream, K.green, K.oxblood, K.cobalt]);
  const full = o.detail !== 0, sd = rng();
  // wall, plinth with stains, cornice
  sb.wave().col(wallC, wallC).pat(PAT.PLAIN, 1, 0, sd).quad([0, 0, 0], [W, 0, 0], [W, H, 0], [0, H, 0]);
  sb.col(K.plinth[rng.int(0, K.plinth.length - 1)], wallC).pat(PAT.DABS, 0.5, FLG.NOBRONZE, sd).quad([0, 0, 0.06], [W, 0, 0.06], [W, 0.85, 0.06], [0, 0.85, 0.06]);
  sb.col(trim, trim).pat(PAT.PLAIN, 1, 0, sd).box(W / 2, H - 0.2, 0.1, W, 0.4, 0.2, 'NB');
  if (o.ends) { sb.col(wallC, wallC).pat(PAT.PLAIN, 1, 0, sd); if (o.ends & 1) sb.quad([0, 0, -D], [0, 0, 0], [0, H, 0], [0, H, -D]); if (o.ends & 2) sb.quad([W, 0, 0], [W, 0, -D], [W, H, -D], [W, H, 0]); }
  // roof: red tiles with a ridge, or a flat roof with a parapet
  if (rng() < 0.78) {
    const rh = rng.range(1.4, 2.1);
    sb.col(K.tile, K.oxblood).pat(PAT.TILES, 0.62, FLG.NOBORDER, sd);
    sb.quad([-0.15, H, 0.55], [W + 0.15, H, 0.55], [W + 0.15, H + rh, -D / 2], [-0.15, H + rh, -D / 2]);
    sb.quad([W + 0.15, H, -D - 0.4], [-0.15, H, -D - 0.4], [-0.15, H + rh, -D / 2], [W + 0.15, H + rh, -D / 2]);
    sb.col(K.tile, K.tile).pat(PAT.PLAIN, 1, 0, sd).box(W / 2, H + rh + 0.06, -D / 2, W + 0.3, 0.16, 0.34, 'B');
    sb.col(K.ink, K.ink).pat(PAT.PLAIN, 1, FLG.NOBORDER).quad([-0.15, H - 0.02, 0.55], [W + 0.15, H - 0.02, 0.55], [W + 0.15, H + 0.07, 0.55], [-0.15, H + 0.07, 0.55]);
  } else {
    sb.col(trim, wallC).pat(PAT.COMB, 0.7, 0, sd).quad([0, H, 0.02], [W, H, 0.02], [W, H + 0.7, 0.02], [0, H + 0.7, 0.02]);
    sb.col(K.stone, K.stone).pat(PAT.PLAIN, 1, FLG.NOBORDER | FLG.NOBRONZE).quad([0, H, 0], [W, H, 0], [W, H, -D], [0, H, -D]);
  }
  const shutter = (x, y, w, h, open) => {
    sb.wave().col(K.dark, K.dark).pat(PAT.PLAIN, 1, FLG.NOBRONZE).quad([x, y, 0.03], [x + w, y, 0.03], [x + w, y + h, 0.03], [x, y + h, 0.03]);
    sb.col(trim, trim).pat(PAT.PLAIN, 1, 0).box(x + w / 2, y - 0.07, 0.1, w + 0.3, 0.12, 0.2, 'NB');
    for (const s of [0, 1]) {
      const a = open ? rng.range(0.5, 1.25) : (rng() < 0.3 ? rng.range(0.1, 0.4) : 0), hx = s ? x + w : x, dir = s ? -1 : 1, lw = w / 2;
      const ex = hx + dir * lw * Math.cos(a), ez = 0.07 + lw * Math.sin(a);
      sb.col(shut, shut).pat(PAT.PLANKS, 0.15, 0, rng());
      if (a > 0.05) sb.wave(rng.range(0.7, 1.4), 0.1 + 0.1 * rng(), rng() * 6); else sb.wave();
      if (s) sb.quad([ex, y, ez], [hx, y, 0.07], [hx, y + h, 0.07], [ex, y + h, ez], [1, 0, 0, 1]); else sb.quad([hx, y, 0.07], [ex, y, ez], [ex, y + h, ez], [hx, y + h, 0.07], [0, 1, 1, 0]);
    }
    sb.wave();
  };
  // ground floor: a studded door with a fanlight, and shuttered windows
  const bays = Math.max(2, Math.round(W / 3.1)), bw = W / bays, doorBay = rng.int(0, bays - 1);
  for (let b = 0; b < bays; b++) {
    const cx = (b + 0.5) * bw;
    if (b === doorBay) {
      sb.col(door, K.cream).pat(PAT.STUDS, 0.36, 0, sd).quad([cx - 0.7, 0, 0.05], [cx + 0.7, 0, 0.05], [cx + 0.7, 2.5, 0.05], [cx - 0.7, 2.5, 0.05]);
      sb.col(K.yellow, K.cream).pat(PAT.FAN, 5, 0, sd).quad([cx - 0.7, 2.55, 0.05], [cx + 0.7, 2.55, 0.05], [cx + 0.7, 3.2, 0.05], [cx - 0.7, 3.2, 0.05]);
      sb.col(K.stone, K.stone).pat(PAT.PLAIN, 1, 0).box(cx, 0.1, 0.4, 1.9, 0.2, 0.7, 'NB');
      if (full && rng() < 0.6) { const kx = cx + rng.pick([-0.75, 0.75]); sb.col(rng.pick(K.bright), K.cream).pat(PAT.STRIPE_V, 0.12, 0).box(kx, 0.36, 0.5, 0.22, 0.3, 0.22, 'B'); }
    } else if (full || b % 2 === 0) shutter(cx - 0.55, 1.15, 1.1, 1.65, false);
  }
  if (!full) { for (let b = 0; b < bays; b += 1) shutter((b + 0.5) * bw - 0.5, 4.5, 1.0, 1.9, false); return; }
  // upper floor: french doors behind a timber balcony on curled iron brackets
  const by = 3.3, bd = 1.2, bx0 = 0.35, bx1 = W - 0.35, has = o.balcony !== false;
  for (let b = 0; b < bays; b++) shutter((b + 0.5) * bw - 0.6, by + 0.08, 1.2, 2.3, has && rng() < 0.35);
  if (has) {
    sb.col(K.wood, K.brown).pat(PAT.PLANKS, 0.2, 0, sd).box((bx0 + bx1) / 2, by, bd / 2, bx1 - bx0, 0.14, bd, 'N');
    sb.col(rail, rail).pat(PAT.BALUSTER, 0.24, FLG.NOBORDER, sd);
    sb.quad([bx0, by + 0.07, bd], [bx1, by + 0.07, bd], [bx1, by + 1.07, bd], [bx0, by + 1.07, bd]);
    sb.quad([bx0, by + 0.07, 0], [bx0, by + 0.07, bd], [bx0, by + 1.07, bd], [bx0, by + 1.07, 0]);
    sb.quad([bx1, by + 0.07, bd], [bx1, by + 0.07, 0], [bx1, by + 1.07, 0], [bx1, by + 1.07, bd]);
    sb.col(rail, rail).pat(PAT.PLAIN, 1, 0).box((bx0 + bx1) / 2, by + 1.1, bd, bx1 - bx0 + 0.1, 0.09, 0.12);
    const nb = Math.max(2, Math.round(W / 2.6));
    for (let i = 0; i <= nb; i++) { const x = bx0 + 0.1 + (i / nb) * (bx1 - bx0 - 0.2); sb.col(K.ink, K.ink).pat(PAT.CURL, 1, FLG.NOBORDER | FLG.NOBRONZE).quad([x, by - 1.0, 0.02], [x, by - 1.0, 1.02], [x, by - 0.07, 1.02], [x, by - 0.07, 0.02]); }
    // things on the rail: pots of basil and geranium, a bird cage, washing hung to dry
    const np = rng.int(2, 4);
    for (let i = 0; i < np; i++) {
      const x = mix(bx0 + 0.4, bx1 - 0.4, rng());
      sb.col(K.terra, K.terra).pat(PAT.PLAIN, 1, 0).box(x, by + 1.3, bd, 0.3, 0.3, 0.3, 'B');
      sb.wave(-5, -0.03, rng() * 6).col(rng() < 0.5 ? K.leaf : K.red, K.pink).pat(PAT.DISC, 5, FLG.NOBRONZE, 0.9).quad([x - 0.3, by + 1.42, bd + 0.02], [x + 0.3, by + 1.42, bd + 0.02], [x + 0.3, by + 2.0, bd + 0.02], [x - 0.3, by + 2.0, bd + 0.02]);
      sb.wave();
    }
    if (rng() < 0.5) { const x = mix(bx0 + 0.6, bx1 - 0.6, rng()); sb.col(K.yellow, K.ink).pat(PAT.STRIPE_U, 0.14, 0).wave(1.6, 0.05, rng() * 6).box(x, by - 0.5, bd - 0.2, 0.34, 0.46, 0.34); sb.wave(); }
    if (rng() < 0.55) {
      const x0 = mix(bx0 + 0.3, bx1 - 1.6, rng()), w = rng.range(0.8, 1.3), c = rng.pick(K.cloth);
      sb.col(c, rng.pick(K.cloth)).pat(rng.pick([PAT.PLAIN, PAT.DIAMOND, PAT.DOTS, PAT.STRIPE_U]), 0.3, FLG.NOBRONZE, rng()).wave(4.2, 0.07, rng() * 6);
      sb.quad([x0, by + 0.25, bd + 0.08], [x0 + w, by + 0.25, bd + 0.08], [x0 + w, by + 1.1, bd + 0.08], [x0, by + 1.1, bd + 0.08], [1, 1, 0, 0]); sb.wave();
    }
  }
  // awning over the door, a hanging sign without lettering, a satellite dish, a water jar
  if (rng() < 0.5) {
    const cx = (doorBay + 0.5) * bw, c = rng.pick(K.bright);
    sb.col(c, K.cream).pat(PAT.STRIPE_U, 0.5, FLG.NOBRONZE, sd).wave(4.5, 0.06, rng() * 6);
    sb.quad([cx - 1.3, 2.35, 1.5], [cx + 1.3, 2.35, 1.5], [cx + 1.3, 3.05, 0.1], [cx - 1.3, 3.05, 0.1], [1, 1, 0, 0]); sb.wave();
  }
  if (rng() < 0.45) { const x = rng.range(0.6, W - 0.6); sb.col(rng.pick(K.bright), K.cream).pat(rng.pick([PAT.STAR, PAT.DIAMOND, PAT.CRESCENT, PAT.EYE]), 0.6, 0, rng()).wave(1.3, 0.04, rng() * 6).box(x, 2.75, 0.75, 0.07, 0.62, 0.62); sb.wave(); }
  if (rng() < 0.5) { const x = rng.range(1, W - 1); sb.col(K.cream, K.stone).pat(PAT.DISC, 0, 0, 0.9).quad([x - 0.5, H + 0.5, -1.2], [x + 0.5, H + 0.5, -1.2], [x + 0.5, H + 1.45, -1.0], [x - 0.5, H + 1.45, -1.0]); }
  if (rng() < 0.6) { const x = rng.range(0.5, W - 0.5); sb.col(rng.pick([K.terra, K.cobalt, K.ochre]), K.cream).pat(PAT.DISC, 0, 0, 0.9).quad([x - 0.33, 0, 0.5], [x + 0.33, 0, 0.5], [x + 0.33, 0.85, 0.5], [x - 0.33, 0.85, 0.5]); }
}

// a palm or a filao: trunk ribbons and comb-cut fronds that swing
function palm(sb, K, rng, x, y, z, h, filao) {
  const lean = rng.range(-0.12, 0.12), lz = rng.range(-0.1, 0.1), n = 6, A = [], B = [], A2 = [], B2 = [], wA = [], wB = [];
  for (let i = 0; i <= n; i++) { const t = i / n, px = x + lean * h * t * t, pz = z + lz * h * t * t, w = 0.26 - 0.1 * t; A.push([px - w, y + h * t, pz]); B.push([px + w, y + h * t, pz]); A2.push([px, y + h * t, pz - w]); B2.push([px, y + h * t, pz + w]); wA.push(t * t * 0.5); wB.push(t * t * 0.5); }
  sb.col(K.ochre, K.brown).pat(PAT.STRIPE_U, 0.55, FLG.NOBRONZE, rng()).wave(-0.9, -0.5, rng() * 6).strip(A, B, wA, wB).strip(A2, B2, wA, wB);
  const tx = x + lean * h, tz = z + lz * h, ty = y + h, nf = filao ? 14 : 10, ph = rng() * 6;
  for (let f = 0; f < nf; f++) {
    const a = (f / nf) * TAU + rng.range(-0.2, 0.2), len = filao ? rng.range(2.2, 3.6) : rng.range(3.6, 4.8), up = filao ? rng.range(-0.2, 0.5) : rng.range(0.25, 0.9), wd = filao ? 0.5 : 0.75;
    const fy = filao ? ty - rng.range(0, h * 0.45) : ty, A3 = [], B3 = [], w3 = [], dx = Math.cos(a), dz = Math.sin(a);
    for (let i = 0; i <= 4; i++) { const t = i / 4, r = len * t, yy = fy + up * len * t - (filao ? 1.1 : 1.5) * len * t * t * 0.55; A3.push([tx + dx * r - dz * wd, yy, tz + dz * r + dx * wd]); B3.push([tx + dx * r + dz * wd, yy, tz + dz * r - dx * wd]); w3.push(0.5 + t); }
    sb.col(filao ? K.filao : (f % 3 ? K.leaf : K.leafDark), K.leafDark).pat(PAT.FROND, filao ? 0.22 : 0.42, FLG.NOBORDER | FLG.NOBRONZE, rng()).wave(-1.4, -0.32, ph + f * 0.4).strip(A3, B3, w3, w3);
  }
  sb.wave();
}

// bougainvillea pouring over a wall: flat bracts with an ink midrib, shivering
function bougain(sb, K, rng, cx, cy, cz, sx, sy, sz, n) {
  for (let i = 0; i < n; i++) {
    const u = rng(), fall = Math.pow(u, 1.7) * (0.7 + 0.3 * rng());
    const x = cx + (rng() - 0.5) * sx * (0.6 + 0.4 * u), y = cy + sy * 0.5 - sy * fall, z = cz + (rng() - 0.5) * sz * (0.65 + 0.35 * u);
    const s = rng.range(0.5, 0.95), a = rng() * TAU, t = rng.range(-0.6, 0.6), dx = Math.cos(a) * s, dz = Math.sin(a) * s, r = rng();
    sb.col(r < 0.64 ? K.bract : r < 0.92 ? K.pink : K.leaf, K.leafDark).pat(PAT.BRACT, 1, FLG.NOBRONZE | FLG.NOBORDER | FLG.FINE, rng()).wave(-(5 + rng() * 3), -0.05, rng() * 6);
    sb.quad([x - dx / 2, y - s * 0.7, z - dz / 2], [x + dx / 2, y - s * 0.7 + t * 0.2, z + dz / 2], [x + dx / 2 + t * 0.2, y + s * 0.7, z + dz / 2], [x - dx / 2 + t * 0.2, y + s * 0.7 - t * 0.2, z - dz / 2]);
  }
  sb.wave();
}

export default {
  id: 'glass-painted-fleet',
  name: 'The Fleet Under Glass',
  category: 'city',
  weirdness: 0.3,
  media: ['air', 'water', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, vr = rng.fork('gpf-look'), det = ctx.quality?.detail ?? 1;
    const hour = vary.hour || 'any', density = vary.density ?? 1, rare = !!vary.rare;
    const r0 = vr();
    const lookId = hour === 'night' ? 'night' : (hour === 'golden' || hour === 'dawn') ? 'afternoon' : hour === 'day' ? (r0 < 0.6 ? 'noon' : r0 < 0.8 ? 'harmattan' : 'rains')
      : (r0 < 0.4 ? 'noon' : r0 < 0.6 ? 'afternoon' : r0 < 0.74 ? 'night' : r0 < 0.87 ? 'harmattan' : 'rains');
    const look = LOOKS[lookId], night = lookId === 'night';
    const dom = vr.pick(DOMS), market = vr() < 0.4, waxLaundry = vr() < 0.5, ownA = vr.int(1, 5), ownB = vr.pick([6, 4, 3]);

    // night: every enamel is darkened BEFORE the tone curve is inverted (display colour x about 0.55, 0.62, 0.9), so sand and walls sit
    // well below the lanterns and lamps, which keep their full colour
    const NM = look.mul || null, E = (h, g = 1) => enc(h, g, NM);
    SEA.L = 58;
    const mats = makeSouwerMaterials({ mul: NM });
    const U = mats.uniforms, M = mats.mat();
    U.uTint.value.setRGB(look.tint[0], look.tint[1], look.tint[2]); U.uBronzeAmt.value = look.bronze; U.uSun.value.set(look.sun[0], look.sun[1], look.sun[2]).normalize();
    U.uSea.value.copy(E(look.sea)); U.uRiver.value.copy(E(look.sea).lerp(E('#0E9FA6'), 0.5)); U.uFlap.value = look.flap; U.uFlagBronze.value = look.flagBronze || 0;
    if (lookId === 'harmattan') U.uWind.value.set(0.87, 0, 0.5, 1.6);
    mats.skyU.uSky.value.copy(enc(look.sky)); mats.skyU.uSea = { value: E(look.sea).multiply(U.uTint.value) }; mats.sky.material.uniforms.uSea = mats.skyU.uSea;
    mats.skyU.uDisc.value = look.disc; if (look.discDir) mats.skyU.uSunDisc.value.set(look.discDir[0], look.discDir[1], look.discDir[2]).normalize();
    mats.skyU.uStars.value = look.stars; mats.skyU.uSquallAmt.value = look.squall;
    mats.paneU.uAmt.value = night ? 0.55 : 1;
    const scene = new THREE.Scene(); scene.background = enc(look.sky);
    scene.add(mats.sky, mats.pane);
    const K = {
      ink: E(PALETTE[0]), cobalt: E(PALETTE[1]), turq: E(PALETTE[2]), red: E(PALETTE[3]), yellow: E(PALETTE[4]), pink: E(PALETTE[5]), cream: E(PALETTE[6]), green: E(PALETTE[7]), oxblood: E(PALETTE[8]),
      ochre: E('#E3A84A'), lemon: E('#F6E27A'), stone: E('#DAD3B6'), stone2: E('#C4BC9C'), grey: E('#B7CFBA'), grey2: E('#8FB09A'), sand: E('#F1DDA6'), sand2: E('#E2C17E'), wet: E('#D8BC86'),
      street: E('#EBCB8E'), street2: E('#D9AE6C'), tile: E('#CF4A2C'), magenta: E('#D4268E'), bract: E('#E8409E'), rut: E('#CC9C5C'), indigo: E('#232C7A'), leaf: E('#2E9B4E'), leafDark: E('#17633A'), filao: E('#3F8F7A'), lilac: E('#B48CE0'),
      brown: E('#7B4A22'), wood: E('#B9793A'), terra: E('#C4622D'), dark: E('#16214A'), silver: E('#DCE6EC'), lamp: enc('#FFD23F'),
    };
    K.lime = [K.ochre, K.pink, K.cream, K.lemon, K.ochre, K.pink, E('#F2C9A0'), K.cream];
    K.shut = [K.green, K.cobalt, K.oxblood, K.green, K.turq];
    K.plinth = [E('#C98F4E'), E('#B9A27E'), E('#D98C8C'), K.stone2];
    K.bright = [K.red, K.yellow, K.cobalt, K.turq, K.pink, K.green];
    K.cloth = waxLaundry ? [K.red, K.yellow, K.turq, K.pink, K.cream, K.green, K.indigo] : [K.indigo, K.indigo, K.cream, K.cobalt, K.cream, K.indigo, K.turq];

    const path = makePath(PTS);
    const uOf = (f) => { const q = new THREE.Vector3(); for (let i = 0; i <= 2000; i++) { path.pointAt(i / 2000, q); if (f(q)) return i / 2000; } return 1; };
    const uBridge = uOf((q) => q.x < BR.x), uStreet0 = uOf((q) => q.z > -192), uStreet1 = uOf((q) => q.z > -60), uLane = uOf((q) => q.z > -24), uRun1 = uOf((q) => q.x < -82);
    const uWater = uOf((q) => q.x < -90 && q.z > 0), uZ30 = uOf((q) => q.x < -90 && q.z > 30), uW1 = uOf((q) => q.z > 55), uW2 = uOf((q) => q.z > 98), uW3 = uOf((q) => q.z > 141);
    const speed = 43 / ((uW2 - uW1) * DURATION); SEA.L = 43 * (1 + SEA.C / speed); U.uL.value = SEA.L;

    const moored = [{ x: 92, z: -275.5, yaw: -Math.PI / 2 - 0.1, sc: 1.0 }, { x: 101, z: -293.5, yaw: -Math.PI / 2 + 0.12, sc: 0.9 }, { x: 68, z: -275.5, yaw: -Math.PI / 2 + 0.08, sc: 0.7 }, { x: 34, z: -260.5, yaw: -0.9, sc: 1.0 }, { x: -13.5, z: -236, yaw: 0.5, sc: 0.75 }, { x: 13.5, z: -244, yaw: 2.4, sc: 0.85 }, { x: 24, z: -206.2, yaw: Math.PI / 2, sc: 0.8 }, { x: 44, z: -206.4, yaw: -Math.PI / 2, sc: 0.85 },
      { x: -22, z: -206.2, yaw: Math.PI / 2, sc: 0.8 }, { x: -41, z: -206.5, yaw: Math.PI / 2, sc: 0.75 },
      { x: 120, z: -318, yaw: -Math.PI / 2, sc: 0.8, vx: -2.6 }, { x: -40, z: -301, yaw: Math.PI / 2, sc: 0.8, vx: 2.2 }, { x: -72, z: -258, yaw: Math.PI / 2, sc: 0.8, ux: 200 }, { x: -60, z: -352, yaw: Math.PI / 2, sc: 0.85, vx: 2.1 }, { x: 40, z: -252, yaw: -Math.PI / 2, sc: 0.7, vx: -1.7 },
      { x: -30, z: -6.5, yaw: 1.9, sc: 0.45, y: 0.06, still: true, roll: 0.22 }, { x: -77, z: -4.5, yaw: 1.2, sc: 0.42, y: 0.04, still: true, roll: -0.2 }, { x: -60, z: 0, yaw: 0, sc: 0.9, y: -0.1, still: true, roll: 0.1 }, { x: -128, z: -8, yaw: 2.2, sc: 0.5, y: 0.08, still: true, roll: 0.18 }, { x: -9, z: -4, yaw: 0.9, sc: 0.4, y: 0.02, still: true, roll: -0.24 }, { x: -46, z: -9.6, yaw: 1.45, sc: 0.5, y: 0.1, still: true, roll: 0.2 }];
    await ctx.yield();
    const _zv = new THREE.Vector3(), zOfU = (uu) => { path.pointAt(Math.min(1, Math.max(0, uu)), _zv); return _zv.z; };
    // the roadstead: two big hulls at anchor either side of the last run, sails set and dressed with pennants, and six more beyond the pair
    const anchored = [{ x: -113.5, z: 190, yaw: -0.1, sc: 1.3, sail: 0 }, { x: -86.5, z: 192.5, yaw: 0.05, sc: 1.3, sail: 2 },
      { x: -150, z: 262, yaw: 0.45, sc: 1.7, sail: 0 }, { x: -188, z: 300, yaw: -0.3, sc: 1.8, sail: 2 }, { x: -140, z: 338, yaw: 0.2, sc: 1.8, sail: 1 },
      { x: -52, z: 266, yaw: -0.4, sc: 1.7, sail: 1 }, { x: -16, z: 304, yaw: 0.35, sc: 1.8, sail: 0 }, { x: -62, z: 342, yaw: -0.15, sc: 1.8, sail: 2 }];
    const hero = await buildHero(ctx, { mats, rare, moored, anchored, mul: NM, look: { dom, night }, portalAt: [-100, 215], cross: { x: 49, z: -284, sc: 0.9 },
      meet: { x: -100, D: DURATION, u1: uW1, z1: 55, uLa: uLane + 0.01, uLb: uZ30, zOf: zOfU } });
    scene.add(hero.object);
    await ctx.yield();

    // ---------- ground: river, island, quay wall, beach ----------
    {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1600, 0, -203, 1600, 0, -203, 1600, 0, -1500, -1600, 0, -203, 1600, 0, -1500, -1600, 0, -1500]), 3));
      const river = new THREE.Mesh(g, mats.sea); river.frustumCulled = false; scene.add(river);
      const sb = new SB(2000), NB = FLG.NOBORDER | FLG.NOBRONZE;
      sb.col(K.street, K.street2).pat(PAT.DABS, 1.1, NB, 0.3).quad([-1300, GY, -60], [600, GY, -60], [600, GY, -203], [-1300, GY, -203]);
      sb.col(K.sand, K.sand2).pat(PAT.DABS, 1.4, NB, 0.6).quad([-1300, 0.15, -9], [600, 0.15, -9], [600, GY, -60], [-1300, GY, -60]).quad([-1300, -0.9, 54], [600, -0.9, 54], [600, -0.15, 9], [-1300, -0.15, 9]);
      sb.col(K.wet, K.sand2).pat(PAT.DABS, 2.2, NB, 0.1).quad([-1300, -0.15, 9], [600, -0.15, 9], [600, 0.15, -9], [-1300, 0.15, -9]);
      for (let z = -7.5; z < 3; z += 3.4) sb.col(K.wood, K.brown).pat(PAT.STRIPE_U, 0.6, 0, 0.4).box(-60, -z / 60 + 0.13, z, 3.6, 0.26, 0.3, 'B');
      for (let x = -400; x < 320; x += 36) {
        sb.col(K.stone, K.stone2).pat(PAT.PLANKS, 0.5, FLG.NOBRONZE, 0.2).quad([x + 36, -1, -203], [x, -1, -203], [x, GY, -203], [x + 36, GY, -203]);
        sb.col(K.stone2, K.stone2).pat(PAT.PLAIN, 1, 0).box(x + 18, GY + 0.1, -202.6, 36, 0.2, 0.8, 'B');
      }
      // mooring posts in the river and bollards on the quay
      for (const p of [[96, -272.5], [80, -272.7], [112.5, -292.4], [54, -270], [44, -269.5], [-8, -229], [23, -249.3]]) sb.col(K.brown, K.ochre).pat(PAT.STRIPE_V, 0.5, 0, 0.1).box(p[0], 0.6, p[1], 0.3, 2.4, 0.3);
      for (let x = -60; x <= 60; x += 15) if (Math.abs(x) > 5) sb.col(K.ink, K.ink).pat(PAT.PLAIN, 1, 0).box(x, GY + 0.45, -201.6, 0.4, 0.7, 0.4, 'B');
      // a net's float line on the river just inside the entry, snaking from the left-hand hull round to the right-hand one
      for (let i = 0; i < 16; i++) {
        const t = i / 15, x = 125 - t * 21 + 1.2 * Math.sin(t * 7), z = -277.5 - t * 13 + 1.5 * Math.sin(t * 4.2), r = i % 4 === 0 ? 0.5 : 0.34;
        sb.col([K.red, K.yellow, K.cream][i % 3], K.ink).pat(PAT.DISC, 0, FLG.NOBRONZE, 0.9).quad([x - r, 0.07, z + r], [x + r, 0.07, z + r], [x + r, 0.07, z - r], [x - r, 0.07, z - r]);
      }
      await ctx.yield();
      // far bank: a sand bar and the mainland's baobabs
      sb.col(K.sand2, K.sand).pat(PAT.PLAIN, 1, NB).quad([900, 0, -585], [-900, 0, -585], [-900, 3, -600], [900, 3, -600]);
      sb.col(K.leaf, K.leafDark).pat(PAT.COMB, 9, FLG.NOBRONZE, 0.2).quad([900, 3, -600], [-900, 3, -600], [-900, 12, -602], [900, 12, -602]);
      const br = rng.fork('baobab');
      for (let i = 0; i < 16; i++) {
        const x = -640 + i * 80 + br.range(-25, 25), h = br.range(16, 24), w = br.range(4.5, 7), z = -598 + br.range(-3, 3);
        sb.col(K.stone2, K.brown).pat(PAT.PLANKS, 60, 0, br()).quad([x + w / 2, 2, z], [x - w / 2, 2, z], [x - w * 0.32, h, z], [x + w * 0.32, h, z]);
        for (let k = 0; k < 4; k++) { const cx = x + (k - 1.5) * w * 0.55 + br.range(-1, 1), cy = h + br.range(-1, 3.5), r = br.range(3.2, 5.2); sb.col(k % 2 ? K.leaf : K.leafDark, K.leaf).pat(PAT.DISC, 0, FLG.NOBRONZE, 0).quad([cx + r, cy - r * 0.6, z + 0.5 + k * 0.2], [cx - r, cy - r * 0.6, z + 0.5 + k * 0.2], [cx - r, cy + r * 0.6, z + 0.5 + k * 0.2], [cx + r, cy + r * 0.6, z + 0.5 + k * 0.2]); }
      }
      const m = new THREE.Mesh(sb.build(), M); m.name = 'ground'; m.frustumCulled = false; scene.add(m);
    }

    await ctx.yield();
    // ---------- the iron bridge: seven bowstring spans of lattice on round stone piers ----------
    {
      const sb = new SB(5000), x0 = BR.x - BR.w / 2, x1 = BR.x + BR.w / 2, dk = BR.deck;
      for (let k = 0; k <= BR.n; k++) {
        const z = BR.z0 - k * BR.span, r = 3.1;
        sb.col(K.stone, K.stone2).pat(PAT.PLANKS, 0.9, FLG.NOBRONZE, 0.3);
        for (let s = 0; s < 8; s++) { const a0 = (s / 8) * TAU, a1 = ((s + 1) / 8) * TAU; sb.quad([BR.x + Math.cos(a0) * r * 1.5, -1, z + Math.sin(a0) * r], [BR.x + Math.cos(a1) * r * 1.5, -1, z + Math.sin(a1) * r], [BR.x + Math.cos(a1) * r * 1.5, dk - 1.6, z + Math.sin(a1) * r], [BR.x + Math.cos(a0) * r * 1.5, dk - 1.6, z + Math.sin(a0) * r]); }
        sb.col(K.cream, K.cream).pat(PAT.PLAIN, 1, 0).box(BR.x, dk - 1.3, z, BR.w + 1.6, 0.6, r * 2 + 1.2);
      }
      for (let k = 0; k < BR.n; k++) {
        const za = BR.z0 - k * BR.span, zc = za - BR.span / 2;
        // deck: riveted side girders, cross-girders underneath
        sb.col(K.grey, K.cream).pat(PAT.STUDS, 0.55, 0, 0.2).quad([x1, dk - 1, za - BR.span], [x1, dk - 1, za], [x1, dk, za], [x1, dk, za - BR.span]).quad([x0, dk - 1, za], [x0, dk - 1, za - BR.span], [x0, dk, za - BR.span], [x0, dk, za]);
        sb.col(K.wood, K.brown).pat(PAT.PLANKS, 0.35, FLG.NOBRONZE, 0.2).quad([x0, dk - 1, za], [x1, dk - 1, za], [x1, dk - 1, za - BR.span], [x0, dk - 1, za - BR.span]);
        if (k < 3) {
          // seen from the water: timber planks on riveted cross-girders and two hatched stringers
          for (let i = 1; i < 14; i++) sb.col(K.grey, K.cream).pat(PAT.STUDS, 0.3, 0, 0.2).box(BR.x, dk - 1.35, za - (i + 0.5) * BR.span / 15, BR.w, 0.7, 0.35, 'T');
          for (const sx of [-2.6, 2.6]) sb.col(K.grey2, K.grey2).pat(PAT.HATCH, 0.45, 0, 0.2).box(BR.x + sx, dk - 1.25, zc, 0.3, 0.5, BR.span - 7.6, 'T');
        }
        if (k === 1) {
          // a string of pennants sagging between the two piers on the downstream side
          const n = 22, xa = x0 - 0.25, A = [], B = [];
          for (let i = 0; i <= n; i++) {
            const t = i / n, z = za - 3.6 - t * (BR.span - 7.2), y = 7.9 - 4 * t * (1 - t); A.push([xa, y - 0.06, z]); B.push([xa, y + 0.06, z]);
            if (i > 0 && i < n) sb.col(K.bright[i % 6], K.cream).pat(PAT.TRI, 1, FLG.NOBRONZE, 0).wave(6, 0.08, i * 1.7).quad([xa, y - 0.95, z + 0.5], [xa, y - 0.95, z - 0.5], [xa, y, z - 0.5], [xa, y, z + 0.5], [1, 1, 0, 0]);
          }
          sb.wave().col(K.ink, K.ink).pat(PAT.PLAIN, 1, FLG.NOBORDER | FLG.NOBRONZE).strip(A, B);
        }
        sb.col(K.stone2, K.stone).pat(PAT.PLANKS, 2.2, FLG.NOBRONZE, 0.2).quad([x1, dk, za], [x0, dk, za], [x0, dk, za - BR.span], [x1, dk, za - BR.span]);
        // the two bows: lattice panels under an arched top chord, braced across
        const n = 14;
        for (const xs of [x0, x1]) {
          const A = [], B = [], C0 = [], C1 = [];
          for (let i = 0; i <= n; i++) { const t = i / n, z = za - t * BR.span, y = dk + 0.3 + 12 * 4 * t * (1 - t); A.push([xs, dk, z]); B.push([xs, y, z]); C0.push([xs - 0.4, y, z]); C1.push([xs + 0.4, y, z]); }
          sb.col(K.grey, K.grey).pat(PAT.LATTICE, 3.1, FLG.NOBORDER, 0.2).strip(A, B);
          sb.col(K.grey, K.grey2).pat(PAT.STUDS, 0.8, 0, 0.3).strip(C0, C1);
        }
        for (let i = 3; i <= n - 3; i += 2) { const t = i / n, z = za - t * BR.span, y = dk + 0.3 + 12 * 4 * t * (1 - t); sb.col(K.grey, K.grey).pat(PAT.HATCH, 0.8, 0, 0.2).box(BR.x, y - 0.25, z, BR.w, 0.4, 0.3); }
        // lamp brackets and railings
        for (const dz of [-13.5, 0, 13.5]) for (const xs of [x0 + 0.3, x1 - 0.3]) {
          sb.col(K.ink, K.ink).pat(PAT.PLAIN, 1, FLG.NOBORDER).box(xs, dk + 2.2, zc + dz, 0.3, 4.4, 0.3, 'B');
          sb.col(night ? K.lamp : K.cream, K.yellow).pat(PAT.DISC, 0, night ? FLG.GLOW : 0, 0.9).box(xs, dk + 4.7, zc + dz, 0.8, 0.9, 0.8);
        }
        sb.col(K.grey2, K.grey2).pat(PAT.BALUSTER, 0.5, FLG.NOBORDER, 0.2).quad([x1 + 0.05, dk, za - BR.span], [x1 + 0.05, dk, za], [x1 + 0.05, dk + 1.1, za], [x1 + 0.05, dk + 1.1, za - BR.span]);
        await ctx.yield();
      }
      const m = new THREE.Mesh(sb.build(), M); m.name = 'bridge'; scene.add(m);
    }
    await ctx.yield();
    // traffic on the deck: two yellow-and-black taxis, a blue bus, a horse cart
    const traffic = [], beachCart = { x: 0, z: 0, sc: 0 };
    {
      const car = (len, hgt, wid, c1, c2, kind) => {
        const sb = new SB(300);
        sb.col(c1, c2).pat(PAT.PLAIN, 1, 0, 0.1).box(0, hgt * 0.5 + 0.35, 0, wid, hgt * 0.6, len);
        if (kind === 'taxi') sb.col(K.ink, K.ink).pat(PAT.PLAIN, 1, FLG.NOBORDER | FLG.NOBRONZE).box(0, hgt * 0.5 + 0.3, 0, wid + 0.06, 0.26, len + 0.06, 'TB');
        if (kind !== 'cart') {
          if (kind === 'bus') sb.col(c1, K.cream).pat(PAT.CHECK, 0.9, 0, 0.2).box(0, hgt * 1.02 + 0.2, 0, wid * 0.92, hgt * 0.5, len * 0.96);
          else { sb.col(K.dark, K.dark).pat(PAT.PLAIN, 1, FLG.NOBRONZE).box(0, hgt * 1.0 + 0.2, -len * 0.06, wid * 0.9, hgt * 0.42, len * 0.56); sb.col(c1, c1).pat(PAT.PLAIN, 1, 0).box(0, hgt * 1.21 + 0.28, -len * 0.06, wid * 0.96, 0.16, len * 0.6, 'B'); }
          if (kind === 'taxi') sb.col(K.red, K.cream).pat(PAT.STRIPE_U, 0.7, 0, 0.3).box(0, hgt * 1.27 + 0.5, -len * 0.06, wid * 0.8, 0.6, len * 0.48, 'B');
          if (kind === 'bus') sb.col(K.yellow, K.red).pat(PAT.CHEVRON, 0.5, 0, 0.3).box(0, hgt * 1.3 + 0.24, 0, wid * 0.8, 0.14, len * 0.8, 'B');
        } else {
          sb.col(K.wood, K.brown).pat(PAT.PLANKS, 0.2, 0, 0.3).box(0, 1.25, -0.2, wid * 0.9, 0.5, len * 0.8);
          sb.col(K.red, K.yellow).pat(PAT.STRIPE_U, 0.7, 0, 0.3).box(0, 2.5, -0.3, wid * 0.84, 2.0, len * 0.66, 'B');
          sb.col(K.wood, K.wood).pat(PAT.PLAIN, 1, FLG.NOBORDER).box(0, 0.95, len * 0.75, 0.1, 0.1, len * 0.8);
        }
        const wr = kind === 'cart' ? 0.8 : 0.56;
        for (const sx of [-1, 1]) for (const sz of kind === 'cart' ? [-0.15] : [-0.32, 0.32]) sb.col(K.ink, kind === 'cart' ? K.red : K.cream).pat(PAT.DISC, kind === 'cart' ? 8 : 0, FLG.NOBRONZE, 0.9).quad([sx * (wid / 2 + 0.03), 0, sz * len - wr], [sx * (wid / 2 + 0.03), 0, sz * len + wr], [sx * (wid / 2 + 0.03), wr * 2, sz * len + wr], [sx * (wid / 2 + 0.03), wr * 2, sz * len - wr]);
        return sb.build();
      };
      const geos = { taxi: car(5.7, 2.0, 2.4, K.yellow, K.ink, 'taxi'), bus: car(12.5, 3.2, 2.9, K.cobalt, K.cream, 'bus'), cart: car(4.3, 1.6, 2.3, K.wood, K.brown, 'cart') };
      const span = BR.n * BR.span, lanes = [['taxi', 'cart', 'bus', 'taxi', 'cart', 'taxi', 'bus'], ['cart', 'taxi', 'taxi', 'bus', 'cart', 'taxi', 'cart']], cnt = { taxi: 0, bus: 0, cart: 0 }, meshes = {}, tr = rng.fork('traffic');
      for (const l of lanes) for (const k of l) cnt[k]++;
      cnt.cart++;                                  // one more cart for the beach
      for (const k in geos) { const m = new THREE.InstancedMesh(geos[k], M, cnt[k]); m.name = k; m.frustumCulled = false; scene.add(m); meshes[k] = m; cnt[k] = 0; }
      // one every 54 m in each lane, so every span carries traffic whenever it is looked at
      lanes.forEach((l, li) => l.forEach((k, i) => traffic.push({ kind: k, mesh: meshes[k], idx: cnt[k]++, x: BR.x + (li ? -2.25 : 2.25), off: i * (span / 7) + tr.range(-8, 8) + (li ? 24 : 0), v: li ? 4.2 : 5.2, span, dir: li ? -1 : 1, z: 0, sc: 1 })));
      beachCart.mesh = meshes.cart; beachCart.idx = cnt.cart;
    }
    await ctx.yield();

    // ---------- the island: waterfront, the street's 26 fronts, the houses along the beach top ----------
    const hr = rng.fork('houses');
    {
      const row = (sb, x0, x1, z, yaw, o) => {       // a run of fronts along X at depth z; yaw 0 faces +Z (sea), PI faces -Z (river)
        let x = x0; const dir = Math.sign(x1 - x0);
        while ((x1 - x) * dir > 5) {
          const W = Math.min(hr.range(7.5, 12.5), Math.abs(x1 - x)), H = hr.range(7.2, 9.6), xa = dir > 0 ? x : x - W;       // xa = low-x end
          const far = Math.abs(xa) > (o.farAt ?? 1e9);
          sb.tr(frame(yaw === 0 ? xa : xa + W, GY, z, yaw)); houseFront(sb, K, hr, W, H, 10, { detail: far ? 0 : 1, balcony: o.balcony && hr() < 0.8, ends: Math.abs(xa) < 9 || Math.abs(xa + W) < 9 ? 3 : 0 }); sb.tr(null);
          x += dir * W;
        }
      };
      const sbW = new SB(12000);
      row(sbW, 7, 330, -196, Math.PI, { balcony: true, farAt: 160 }); row(sbW, -7, -430, -196, Math.PI, { balcony: true, farAt: 160 });
      const mw = new THREE.Mesh(sbW.build(), M); mw.name = 'waterfront'; scene.add(mw);
      await ctx.yield();
      const sbB = new SB(16000);
      row(sbB, 7, 330, -63, 0, { balcony: true, farAt: 120 }); row(sbB, -7, -905, -63, 0, { balcony: true, farAt: 150 });
      const mb = new THREE.Mesh(sbB.build(), M); mb.name = 'beach-row'; scene.add(mb);
      await ctx.yield();
      // the street: walls 14 m apart, balconies at 4.3 m, every front with shutters, a balcony and its props
      const sbS = new SB(16000);
      for (const side of [1, -1]) {
        const ws = []; let tot = 0, z = -186;
        for (let i = 0; i < 13; i++) { const w = hr.range(7.5, 10.5); ws.push(w); tot += w; }
        for (let i = 0; i < 13; i++) {
          const W = ws[i] * 113 / tot, H = hr.range(7.6, 9.8);
          sbS.tr(frame(side * 7, GY, side > 0 ? z : z + W, side > 0 ? -Math.PI / 2 : Math.PI / 2)); houseFront(sbS, K, hr, W, H, 10, { detail: 1, balcony: true }); sbS.tr(null);
          z += W;
        }
        await ctx.yield();
      }
      const ms = new THREE.Mesh(sbS.build(), M); ms.name = 'street'; scene.add(ms);
    }
    await ctx.yield();

    // ---------- street life: laundry lines, pennants, lanterns, a cart, bicycles, bougainvillea, the minaret ----------
    const pr = rng.fork('props'), cartPos = [];
    {
      const sb = new SB(12000);
      const rope = (a, b, sag, n = 8, hw = 0.08) => { const A = [], B = []; for (let i = 0; i <= n; i++) { const t = i / n, y = mix(a[1], b[1], t) - sag * 4 * t * (1 - t); A.push([mix(a[0], b[0], t), y - hw, mix(a[2], b[2], t)]); B.push([mix(a[0], b[0], t), y + hw, mix(a[2], b[2], t)]); } sb.wave().col(K.ink, K.ink).pat(PAT.PLAIN, 1, FLG.NOBORDER | FLG.NOBRONZE).strip(A, B); };
      // eight laundry lines across the street, cloth flapping two metres over the eye
      for (let i = 0; i < 8; i++) {
        const z = -178 + i * 14.5 + pr.range(-2, 2), y = pr.range(8.7, 9.3), dz = pr.range(-1.5, 1.5), sag = pr.range(0.35, 0.6);
        rope([-7, y, z], [7, y + pr.range(-0.3, 0.3), z + dz], sag);
        let x = -6 + pr.range(0, 0.8);
        while (x < 5.4) {
          const w = pr.range(0.7, 1.5), h = pr.range(0.9, 1.55), t0 = (x + 7) / 14, t1 = (x + w + 7) / 14, y0 = y - sag * 4 * t0 * (1 - t0), y1 = y - sag * 4 * t1 * (1 - t1), z0 = z + dz * t0, z1 = z + dz * t1;
          const c = pr.pick(K.cloth), pat = pr() < (waxLaundry ? 0.7 : 0.3) ? pr.pick([PAT.DIAMOND, PAT.DOTS, PAT.CHEVRON, PAT.STRIPE_U, PAT.STAR, PAT.CHECK]) : PAT.PLAIN;
          sb.col(c, pr.pick(K.cloth)).pat(pat, pr.range(0.28, 0.42), FLG.NOBRONZE, pr()).wave(pr.range(4.2, 5.5), 0.16, pr() * 6);
          const m0 = [x, y0 - h / 2, z0], m1 = [x + w, y1 - h / 2, z1];
          sb.quadE([x, y0 - h, z0], [x + w, y1 - h, z1], m1, m0, [0, 0], [w, 0], [w, h / 2], [0, h / 2], w, h, [1, 1, 0.45, 0.45]);
          sb.quadE(m0, m1, [x + w, y1, z1], [x, y0, z0], [0, h / 2], [w, h / 2], [w, h], [0, h], w, h, [0.45, 0.45, 0, 0]);
          x += w + pr.range(0.15, 0.7);
        }
      }
      await ctx.yield();
      // strings of pennants between the roofs, paper lanterns on parade nights
      for (let i = 0; i < 6; i++) {
        const z = -184 + i * 20 + pr.range(-3, 3), a = [-7, 10.4, z], b = [7, 10.0, z + pr.range(6, 12)]; rope(a, b, 0.8, 10, 0.12);
        for (let k = 1; k < 16; k++) { const t = k / 16, x = mix(a[0], b[0], t), y = mix(a[1], b[1], t) - 0.8 * 4 * t * (1 - t), zz = mix(a[2], b[2], t), dx = (b[0] - a[0]) / 16 * 0.42, dzz = (b[2] - a[2]) / 16 * 0.42;
          sb.col(pr.pick(K.bright), K.cream).pat(PAT.TRI, 1, FLG.NOBRONZE, 0).wave(6, 0.07, pr() * 6).quad([x - dx, y - 0.62, zz - dzz], [x + dx, y - 0.62, zz + dzz], [x + dx, y, zz + dzz], [x - dx, y, zz - dzz], [1, 1, 0, 0]); }
      }
      // two more strings high between the tallest roofs, on poles, so a tall frame has something crossing its sky
      for (const [z, dz] of [[-158, 9], [-104, -8]]) {
        const a = [-7.6, 13.4, z], b = [7.6, 12.7, z + dz]; rope(a, b, 1.0, 10, 0.12);
        for (const q of [a, b]) sb.col(K.ochre, K.brown).pat(PAT.STRIPE_V, 0.7, FLG.NOBRONZE, 0.2).box(q[0], q[1] - 2.2, q[2], 0.2, 4.6, 0.2, 'TB');
        for (let k = 1; k < 14; k++) { const t = k / 14, x = mix(a[0], b[0], t), y = mix(a[1], b[1], t) - 1.0 * 4 * t * (1 - t), zz = mix(a[2], b[2], t), dx = (b[0] - a[0]) / 14 * 0.44, dzz = (b[2] - a[2]) / 14 * 0.44;
          sb.col(pr.pick(K.bright), K.cream).pat(PAT.TRI, 1, FLG.NOBRONZE, 0).wave(6, 0.09, pr() * 6).quad([x - dx, y - 0.95, zz - dzz], [x + dx, y - 0.95, zz + dzz], [x + dx, y, zz + dzz], [x - dx, y, zz - dzz], [1, 1, 0, 0]); }
      }
      if (night) for (let i = 0; i < 9; i++) {
        const z = -182 + i * 13, a = [-7, 8.5, z], b = [7, 8.5, z + 3]; rope(a, b, 0.5, 8);
        for (let k = 1; k < 6; k++) { const t = k / 6, x = mix(a[0], b[0], t), y = 8.5 - 0.5 * 4 * t * (1 - t), zz = mix(a[2], b[2], t), c = pr.pick([K.lamp, K.lamp, enc('#FF7A3A'), enc('#FFE9A8')]), ph = pr() * 6;
          if (k === 3 && i % 2) continue;
          sb.col(c, enc('#FF8A2A')).pat(PAT.STRIPE_U, 0.14, FLG.GLOW | FLG.NOBRONZE, 0).wave(-1.2, -0.12, ph);
          sb.quad([x - 0.36, y - 0.95, zz], [x + 0.36, y - 0.95, zz], [x + 0.36, y - 0.2, zz], [x - 0.36, y - 0.2, zz]).quad([x, y - 0.95, zz - 0.36], [x, y - 0.95, zz + 0.36], [x, y - 0.2, zz + 0.36], [x, y - 0.2, zz - 0.36]);
          sb.col(K.ink, K.ink).pat(PAT.PLAIN, 1, FLG.NOBORDER | FLG.NOBRONZE).box(x, y - 0.14, zz, 0.3, 0.12, 0.3).box(x, y - 1.01, zz, 0.3, 0.12, 0.3); }
      }
      sb.wave();
      // a parked cart, two bicycles, crates and jars along the walls (carts double on market day)
      const carts = market ? 4 : 2;
      for (let i = 0; i < carts; i++) {
        const z = -168 + i * 27 + pr.range(-3, 3), x = (i % 2 ? -1 : 1) * 4.6; cartPos.push([x, z]);
        sb.col(K.wood, K.brown).pat(PAT.PLANKS, 0.22, 0, pr()).box(x, GY + 0.95, z, 1.5, 0.16, 2.6); sb.col(pr.pick(K.bright), K.cream).pat(PAT.STRIPE_U, 0.4, 0, pr()).box(x, GY + 1.3, z, 1.3, 0.55, 2.2, 'B');
        for (const s of [-1, 1]) sb.col(K.ink, K.red).pat(PAT.DISC, 8, FLG.NOBRONZE, 0.9).quad([x + s * 0.82, GY, z - 0.7], [x + s * 0.82, GY, z + 0.7], [x + s * 0.82, GY + 1.4, z + 0.7], [x + s * 0.82, GY + 1.4, z - 0.7]);
      }
      for (const [x, z] of [[5.9, -141], [-5.8, -99]]) for (const dz of [-0.55, 0.55]) sb.col(K.ink, K.cream).pat(PAT.DISC, 10, FLG.NOBRONZE, 0.9).quad([x, GY, z + dz - 0.36], [x, GY, z + dz + 0.36], [x - 0.12, GY + 0.72, z + dz + 0.36], [x - 0.12, GY + 0.72, z + dz - 0.36]);
      for (let i = 0; i < 16 * density; i++) { const s = pr.sign(), z = pr.range(-184, -76), w = pr.range(0.5, 0.9); sb.col(pr.pick([K.wood, K.ochre, K.turq, K.red]), K.brown).pat(PAT.PLANKS, 0.2, 0, pr()).box(s * (6.1 - pr() * 0.8), GY + w / 2, z, w, w, w, 'B'); }
      await ctx.yield();
      // the street floor: two cart ruts down the middle, mats spread by the doors, striped kettles, fish baskets, jars
      { const fl = rng.fork('floor');
        for (const rx of [-0.85, 0.85]) { const A = [], B = []; for (let i = 0; i <= 28; i++) { const z = -199 + i * 5, x = rx + 0.4 * Math.sin(z * 0.09) + 0.15 * Math.sin(z * 0.31 + rx); A.push([x - 0.13, GY + 0.03, z]); B.push([x + 0.13, GY + 0.03, z]); }
          sb.wave().col(K.rut, K.rut).pat(PAT.PLAIN, 1, FLG.NOBORDER | FLG.NOBRONZE).strip(A, B); }
        for (let i = 0; i < 10; i++) { const s = i % 2 ? -1 : 1, z = -180 + i * 10.6 + fl.range(-3, 3), x = s * fl.range(3.6, 5.0), w = fl.range(1.2, 1.6), l = fl.range(1.9, 2.6);
          sb.col(fl.pick(K.bright), fl.pick([K.cream, K.yellow, K.indigo])).pat(fl.pick([PAT.DIAMOND, PAT.CHECK, PAT.CHEVRON, PAT.STRIPE_V, PAT.STAR]), fl.range(0.42, 0.6), FLG.NOBRONZE, fl()).quad([x - w / 2, GY + 0.04, z + l / 2], [x + w / 2, GY + 0.04, z + l / 2], [x + w / 2, GY + 0.04, z - l / 2], [x - w / 2, GY + 0.04, z - l / 2]); }
        for (let i = 0; i < 14; i++) { const s = fl.sign(), z = fl.range(-184, -76), x = s * fl.range(5.3, 6.0);
          sb.col(fl.pick(K.bright), K.cream).pat(PAT.STRIPE_V, 0.13, 0, fl()).box(x, GY + 0.22, z, 0.34, 0.44, 0.34, 'B'); sb.col(K.ink, K.ink).pat(PAT.PLAIN, 1, FLG.NOBORDER).box(x, GY + 0.5, z, 0.12, 0.12, 0.12, 'B'); }
        for (let i = 0; i < 10; i++) { const s = fl.sign(), z = fl.range(-182, -78), x = s * fl.range(4.4, 5.9), c = fl.pick([K.ochre, K.terra, K.wood]);
          sb.col(c, K.brown).pat(PAT.HATCH, 0.16, FLG.NOBRONZE, fl()).box(x, GY + 0.3, z, 0.85, 0.6, 0.85, 'B'); sb.col(fl.pick([K.silver, K.red, K.yellow, K.leaf]), K.cream).pat(PAT.DOTS, 0.2, FLG.NOBRONZE, fl()).box(x, GY + 0.63, z, 0.72, 0.06, 0.72, 'B'); }
        for (let i = 0; i < 8; i++) { const s = fl.sign(), z = fl.range(-182, -78), x = s * fl.range(5.6, 6.2), c = fl.pick([K.terra, K.cobalt, K.ochre, K.turq]);
          sb.col(c, K.cream).pat(PAT.DISC, 0, 0, 0.9).quad([x - 0.38, GY, z], [x + 0.38, GY, z], [x + 0.38, GY + 0.95, z], [x - 0.38, GY + 0.95, z]).quad([x, GY, z - 0.38], [x, GY, z + 0.38], [x, GY + 0.95, z + 0.38], [x, GY + 0.95, z - 0.38]); }
      }
      // bougainvillea: right at S=170, left at S=215, more over the waterfront and beach-row walls
      const bg = Math.round(260 * det);
      bougain(sb, K, pr, -6.3, 7.6, -157, 1.5, 5.2, 7.5, bg); bougain(sb, K, pr, 6.3, 7.8, -112, 1.5, 5.4, 8, bg); bougain(sb, K, pr, -6.3, 7.2, -84, 1.4, 4.4, 6, bg * 0.6);
      bougain(sb, K, pr, 16, 7.5, -196.6, 6.5, 4.6, 1.2, bg * 0.7); bougain(sb, K, pr, -22, 7.2, -196.6, 6, 4.4, 1.2, bg * 0.6); bougain(sb, K, pr, -34, 7, -62.4, 6.5, 4.6, 1.2, bg * 0.7); bougain(sb, K, pr, 18, 7, -62.4, 6, 4.4, 1.2, bg * 0.5); bougain(sb, K, pr, 6.4, 6.8, -176, 1.2, 3.6, 4.5, bg * 0.4);
      await ctx.yield();
      // a flame tree in a courtyard behind the left wall
      { const x = 14.5, z = -128; sb.col(K.brown, K.ochre).pat(PAT.PLANKS, 40, 0, 0.2).quad([x - 0.5, GY, z], [x + 0.5, GY, z], [x + 0.3, 10, z], [x - 0.3, 10, z]);
        for (let i = 0; i < 42; i++) { const a = pr() * TAU, r = pr.range(0.5, 5.2), y = pr.range(9.6, 13.2) - r * 0.25, s = pr.range(1.0, 1.9), ya = pr() * TAU, dx = Math.cos(ya) * s, dz = Math.sin(ya) * s, cx = x + Math.cos(a) * r, cz = z + Math.sin(a) * r;
          sb.col(pr() < 0.7 ? K.red : E('#F2761F'), K.leaf).pat(PAT.DISC, 0, FLG.NOBRONZE, pr() < 0.3 ? 0.9 : 0).wave(-2, -0.14, pr() * 6).quad([cx - dx, y - s * 0.6, cz - dz], [cx + dx, y - s * 0.6, cz + dz], [cx + dx, y + s * 0.6, cz + dz], [cx - dx, y + s * 0.6, cz - dz]); }
        sb.wave(); }
      await ctx.yield();
      // the white minaret over the roofs to the right
      { const x = -19.5, z = -119, w = 1.7;
        sb.col(K.cream, K.green).pat(PAT.STRIPE_V, 7, 0, 0.82).box(x, 11.5, z, w * 2, 21, w * 2, 'B');
        sb.col(K.cream, K.cream).pat(PAT.BALUSTER, 0.4, FLG.NOBORDER, 0).box(x, 22.6, z, w * 2 + 1.6, 1.2, w * 2 + 1.6, 'TB'); sb.col(K.stone, K.stone).pat(PAT.PLAIN, 1, 0).box(x, 21.9, z, w * 2 + 1.8, 0.25, w * 2 + 1.8);
        sb.col(K.cream, K.dark).pat(PAT.ARCH, 9, 0, 0).box(x, 25, z, 2.3, 6, 2.3, 'B');
        for (let s = 0; s < 4; s++) { const a = s * Math.PI / 2 + Math.PI / 4, b = a + Math.PI / 2, r = 1.75; sb.col(K.green, K.green).pat(PAT.PLAIN, 1, 0).quad([x + Math.cos(a) * r, 28, z + Math.sin(a) * r], [x + Math.cos(b) * r, 28, z + Math.sin(b) * r], [x + Math.cos(b) * 0.08, 31.4, z + Math.sin(b) * 0.08], [x + Math.cos(a) * 0.08, 31.4, z + Math.sin(a) * 0.08]); }
        sb.col(E(BRONZE_HEX), K.cream).pat(PAT.CRESCENT, 1.4, FLG.INKONLY * 0, 0).pat(PAT.DISC, 0, 0, 0).quad([x - 0.5, 31.6, z], [x + 0.5, 31.6, z], [x + 0.5, 32.6, z], [x - 0.5, 32.6, z]).quad([x, 31.6, z - 0.5], [x, 31.6, z + 0.5], [x, 32.6, z + 0.5], [x, 32.6, z - 0.5]); }
      const m = new THREE.Mesh(sb.build(), M); m.name = 'street-life'; scene.add(m);
    }
    await ctx.yield();

    // ---------- the beach: fish racks, nets, crates, rollers, parasols and specks of people, palms and filaos ----------
    {
      const sb = new SB(9000), sandY = hero.sandY, br = rng.fork('beach');
      // fish-drying racks at the street's end
      for (const [x, z, ya] of [[13, -55, 0.1], [22, -52.5, -0.15], [-13.5, -55.5, 0.2], [-24, -53, -0.1], [-36, -55, 0.05], [33, -55.5, 0.12]]) {
        sb.tr(frame(x, GY, z, ya));
        sb.col(K.wood, K.silver).pat(PAT.DOTS, 0.32, FLG.NOBRONZE, br()).box(0, 1.15, 0, 5.2, 0.1, 1.9);
        for (const sx of [-2.4, 2.4]) for (const sz of [-0.8, 0.8]) sb.col(K.brown, K.brown).pat(PAT.PLAIN, 1, FLG.NOBORDER).box(sx, 0.55, sz, 0.2, 1.1, 0.2, 'TB');
        sb.tr(null);
      }
      // heaps of blue nets with floats, stacked crates
      const heap = (x, z, r, h) => { const y = sandY(z); for (let s = 0; s < 6; s++) { const a0 = (s / 6) * TAU, a1 = ((s + 1) / 6) * TAU; sb.col(br() < 0.5 ? K.cobalt : E('#2F6FD0'), K.turq).pat(PAT.HATCH, 0.3, FLG.NOBRONZE, br()).quad([x + Math.cos(a0) * r, y, z + Math.sin(a0) * r], [x + Math.cos(a1) * r, y, z + Math.sin(a1) * r], [x + Math.cos(a1) * r * 0.25, y + h, z + Math.sin(a1) * r * 0.25], [x + Math.cos(a0) * r * 0.25, y + h, z + Math.sin(a0) * r * 0.25]); }
        for (let k = 0; k < 4; k++) { const a = br() * TAU, rr = r * 0.8; sb.col(br.pick([K.red, K.yellow, K.cream]), K.ink).pat(PAT.DISC, 0, 0, 0.9).box(x + Math.cos(a) * rr, y + 0.2, z + Math.sin(a) * rr, 0.36, 0.36, 0.36, 'B'); } };
      for (const [x, z] of [[9.5, -47], [-10.5, -49.5], [17, -57.5], [-45, -50], [-63, -52], [-88, -50.5], [-112, -51], [40, -51], [-20, -6], [-66, -20.3], [-112, -14], [-36, -10], [-54.5, -12.6], [-71, -9.2], [-86, -11.4], [-25, -11.6]]) heap(x, z, br.range(1.3, 2.1), br.range(0.7, 1.2));
      for (let i = 0; i < 26 * density; i++) { const x = br.range(-190, 70), z = br.range(-59, -49.5), w = br.range(0.6, 1.0); if (Math.abs(x) < 9) continue; const y = sandY(z);
        sb.col(br.pick([K.wood, K.turq, K.red, K.yellow, K.ochre]), K.brown).pat(PAT.PLANKS, 0.18, 0, br()).box(x, y + w * 0.5, z, w * 1.3, w, w, 'B'); if (br() < 0.5) sb.box(x + br.range(-0.2, 0.2), y + w * 1.45, z, w * 1.2, w * 0.9, w * 0.9, 'B'); }
      for (let i = 0; i < 26; i++) { const x = br.range(-96, -8), z = br() < 0.5 ? br.range(-9.5, -3.5) : br.range(-21.5, -19.8), y = sandY(z), k = br(); if (Math.abs(x + 60) < 2.6 && z > -12) continue;
        if (k < 0.4) { const w = br.range(0.5, 0.8); sb.col(br.pick([K.wood, K.turq, K.red, K.yellow]), K.brown).pat(PAT.PLANKS, 0.16, 0, br()).box(x, y + w * 0.4, z, w * 1.4, w * 0.8, w, 'B'); }
        else if (k < 0.7) { sb.col(br.pick([K.red, K.yellow, K.cream, K.pink]), K.ink).pat(PAT.DISC, 0, 0, 0.9).box(x, y + 0.2, z, 0.4, 0.4, 0.4, 'B'); }
        else { sb.col(K.ochre, K.brown).pat(PAT.HATCH, 0.14, FLG.NOBRONZE, br()).box(x, y + 0.25, z, 0.75, 0.5, 0.75, 'B'); sb.col(K.silver, K.cream).pat(PAT.DOTS, 0.2, FLG.NOBRONZE, br()).box(x, y + 0.53, z, 0.62, 0.06, 0.62, 'B'); } }
      for (let i = 0; i < 18; i++) { const x = br.range(-92, -28), z = br.range(-12.2, -6.2), y = sandY(z), k = br(); if ((Math.abs(x + 46) < 6.5 && Math.abs(z + 9.6) < 1.6) || Math.abs(x + 60) < 2.6) continue;
        if (k < 0.45) { const w = br.range(0.6, 0.95); sb.col(br.pick([K.wood, K.turq, K.red, K.yellow, K.pink]), K.brown).pat(PAT.PLANKS, 0.16, 0, br()).box(x, y + w * 0.4, z, w * 1.4, w * 0.8, w, 'B'); if (br() < 0.4) sb.box(x + 0.1, y + w * 1.15, z, w * 1.2, w * 0.7, w * 0.9, 'B'); }
        else if (k < 0.75) { sb.col(K.ochre, K.brown).pat(PAT.HATCH, 0.16, FLG.NOBRONZE, br()).box(x, y + 0.3, z, 0.9, 0.6, 0.9, 'B'); sb.col(K.silver, K.cream).pat(PAT.DOTS, 0.22, FLG.NOBRONZE, br()).box(x, y + 0.63, z, 0.76, 0.06, 0.76, 'B'); }
        else { sb.col(br.pick([K.red, K.yellow, K.cream, K.pink]), K.ink).pat(PAT.DISC, 0, 0, 0.9).box(x, y + 0.25, z, 0.5, 0.5, 0.5, 'B'); } }
      await ctx.yield();
      // nets spread to dry on the wet sand, weighted with floats
      for (const [x, z, w, d, ya] of [[-22, -8.5, 7, 4, 0.2], [-44, -6.5, 6, 3.5, -0.3], [-73, -6, 7, 4, 0.15], [-40, -20.2, 5, 2.2, 0.05], [-66, -20.6, 6, 2.4, -0.06], [-150, -7, 8, 4, 0.3], [-20, -20.4, 4.5, 2, 0.1], [-190, -9, 7, 4, -0.2]]) {
        const y = sandY(z) + 0.06, c = Math.cos(ya), s = Math.sin(ya), P = (a, b) => [x + a * c - b * s, y - (b * c + a * s) / 60, z + b * c + a * s];
        sb.col(br.pick([K.cobalt, K.turq, E('#2F6FD0'), K.red]), K.cream).pat(PAT.HATCH, 0.36, FLG.NOBRONZE, br()).quad(P(-w / 2, d / 2), P(w / 2, d / 2), P(w / 2, -d / 2), P(-w / 2, -d / 2));
        for (let k = 0; k < 5; k++) { const q = P(br.range(-w / 2, w / 2), br.pick([-d / 2, d / 2])); sb.col(br.pick([K.red, K.yellow, K.cream]), K.ink).pat(PAT.PLAIN, 1, 0, 0).box(q[0], q[1] + 0.12, q[2], 0.28, 0.24, 0.28, 'B'); }
      }
      // two cart ruts along the beach below the bows, running toward the comb's vanishing point; they widen far off to hold their width
      for (const o of [0, 1.5]) { const A = [], B = []; for (let x = -4; x >= -250; x -= 6) { const z = -11.4 - o + 1.3 * Math.sin(x * 0.045) + 0.4 * Math.sin(x * 0.17 + o), w = 0.15 + Math.max(0, -90 - x) * 0.0028, y = sandY(z) + 0.04; A.push([x, y - w / 60, z + w]); B.push([x, y + w / 60, z - w]); }
        sb.wave().col(K.rut, K.rut).pat(PAT.PLAIN, 1, FLG.NOBORDER | FLG.NOBRONZE).strip(A, B); }
      // log rollers down the launch lanes
      for (const lx of [0, -100, -200, 100]) for (let z = -44; z < -3; z += 4.5) { const x = lx + (lx === -100 ? -7 : lx === 0 ? 0 : 0.5), y = sandY(z); sb.col(K.wood, K.brown).pat(PAT.STRIPE_U, 0.6, 0, br()).box(x + br.range(-0.4, 0.4), y + 0.13, z, 3.4, 0.26, 0.3, 'B'); }
      await ctx.yield();
      // parasols with flat teardrops of colour beneath them, never nearer than 40 m; they tilt and drift
      const np = Math.round((market ? 44 : 22) * density);
      for (let i = 0; i < np; i++) {
        let x = br.range(-520, 260); const top = br() < 0.6, z = top ? br.range(-58.5, -50) : br.range(-17, -3);
        if (Math.abs(x) < 46 || (!top && x > -146 && x < 46) || Math.abs(x + 100) < 46) continue;
        const y = sandY(z), c = br.pick(K.bright), ya = br() * TAU, dx = Math.cos(ya), dz = Math.sin(ya);
        sb.wave().col(K.ink, K.ink).pat(PAT.PLAIN, 1, FLG.NOBORDER).box(x, y + 1.1, z, 0.16, 2.2, 0.16, 'TB');
        sb.col(c, K.cream).pat(PAT.FAN, 3, FLG.NOBRONZE, 0).wave(-0.7, -0.12, br() * 6);
        sb.quad([x - dx * 1.5, y + 2.0, z - dz * 1.5], [x + dx * 1.5, y + 2.0, z + dz * 1.5], [x + dx * 1.5, y + 2.85, z + dz * 1.5], [x - dx * 1.5, y + 2.85, z - dz * 1.5]).quad([x + dz * 1.5, y + 2.0, z - dx * 1.5], [x - dz * 1.5, y + 2.0, z + dx * 1.5], [x - dz * 1.5, y + 2.85, z + dx * 1.5], [x + dz * 1.5, y + 2.85, z - dx * 1.5]);
        const ns = br.int(1, market ? 4 : 3);
        for (let k = 0; k < ns; k++) { const px = x + br.range(-1.6, 1.6), pz = z + br.range(-1.2, 1.2), h = br.range(1.15, 1.5); sb.col(br.pick(K.bright), K.ink).pat(PAT.DROP, 1, FLG.NOBRONZE | FLG.NOBORDER, 0).wave(-(0.2 + br() * 0.25), -br.range(0.4, 1.6), br() * 6);
          sb.quad([px - 0.3, y, pz - 0.3], [px + 0.3, y, pz + 0.3], [px + 0.3, y + h, pz + 0.3], [px - 0.3, y + h, pz - 0.3]).quad([px + 0.3, y, pz - 0.3], [px - 0.3, y, pz + 0.3], [px - 0.3, y + h, pz + 0.3], [px + 0.3, y + h, pz - 0.3]); }
      }
      // strolling specks far up the wet sand
      for (let i = 0; i < 40 * density; i++) { const x = br.range(-700, -150), z = br.range(-16, -2), y = sandY(z), h = br.range(1.2, 1.5); sb.col(br.pick(K.bright), K.ink).pat(PAT.DROP, 1, FLG.NOBRONZE | FLG.NOBORDER, 0).wave(-(0.12 + br() * 0.2), -br.range(1.5, 4), br() * 6);
        sb.quad([x - 0.3, y, z - 0.3], [x + 0.3, y, z + 0.3], [x + 0.3, y + h, z + 0.3], [x - 0.3, y + h, z - 0.3]).quad([x + 0.3, y, z - 0.3], [x - 0.3, y, z + 0.3], [x - 0.3, y + h, z + 0.3], [x + 0.3, y + h, z - 0.3]); }
      sb.wave();
      // beach morning glory in lilac dots on the dune
      for (let i = 0; i < 160 * det; i++) { const x = br.range(-260, 120), z = br.range(-61.5, -56), y = sandY(z) + 0.04, s = br.range(0.16, 0.3), g = br() < 0.4; if (Math.abs(x) < 7.5) continue;
        sb.col(g ? K.leaf : K.lilac, K.cream).pat(PAT.DISC, 0, FLG.NOBRONZE, g ? 0 : 0.9).quad([x - s, y, z + s], [x + s, y, z + s], [x + s, y, z - s], [x - s, y, z - s]); }
      // forty boats as specks on the horizon line, nodding; at night each carries a yellow lamp
      for (let i = 0; i < 40; i++) { const x = br.range(-1500, 900), z = br.range(650, 1500), w = br.range(14, 20) * (z / 700), h = w * 0.13;
        sb.col(br.pick(K.bright), br.pick([K.cream, K.yellow, K.red])).pat(PAT.STRIPE_V, h, FLG.NOBRONZE, 0).wave(-(0.5 + br() * 0.4), -w * 0.06, br() * 6).quad([x + w / 2, 0.1, z], [x - w / 2, 0.1, z], [x - w / 2 - h, h + 0.1, z], [x + w / 2 + h, h + 0.1, z]);
        if (night) sb.col(K.lamp, K.lamp).pat(PAT.DISC, 0, FLG.GLOW | FLG.NOBRONZE, 0).quad([x + h * 1.2, h * 1.6, z], [x - h * 1.2, h * 1.6, z], [x - h * 1.2, h * 4, z], [x + h * 1.2, h * 4, z]); }
      sb.wave();
      const m = new THREE.Mesh(sb.build(), M); m.name = 'beach'; m.frustumCulled = false; scene.add(m);
      await ctx.yield();
      // eight coconut palms and the filao pines along the beach top, one palm at the end of the street slot
      const sf = new SB(8000), fr = rng.fork('trees');
      const spots = [[10.5, -55.5], [-11.5, -57], [38, -57.5], [-47, -56.5], [-78, -58], [-122, -56.5], [-171, -57.5], [-232, -57], [64, -58], [-300, -57.5]];
      spots.forEach(([x, z], i) => palm(sf, K, fr, x, GY - 0.1, z, fr.range(9.5, 13), false));
      for (let i = 0; i < 14; i++) { const x = fr.range(-420, 160), z = fr.range(-60.5, -57.5); if (Math.abs(x) < 16) continue; palm(sf, K, fr, x, GY - 0.1, z, fr.range(7, 10), true); }
      for (const [x, z] of [[-30, -150], [28, -100], [-42, -92], [40, -160], [-60, -130]]) palm(sf, K, fr, x, 8, z, fr.range(6, 9), false);      // crowns over the roofs
      const mf = new THREE.Mesh(sf.build(), M); mf.name = 'trees'; mf.frustumCulled = false; scene.add(mf);
    }
    await ctx.yield();
    // a string of pennants from masthead to masthead of the two hulls at anchor, high over the last run (it clears the flags on the crossed spars)
    {
      const sb = new SB(200), a = [-113.7, 14.9, 192.1], b = [-86.4, 14.9, 194.6], n = 28, sg = (t) => -1.3 * 4 * t * (1 - t);
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n, p0 = [mix(a[0], b[0], t0), a[1] + sg(t0), mix(a[2], b[2], t0)], p1 = [mix(a[0], b[0], t1), a[1] + sg(t1), mix(a[2], b[2], t1)];
        sb.col(K.bright[i % 6], K.cream).pat(PAT.TRI, 1, FLG.NOBRONZE, 0).wave(6, 0.1, i * 1.7).quad([p0[0], p0[1] - 1.25, p0[2]], [p1[0], p1[1] - 1.25, p1[2]], p1, p0, [1, 1, 0, 0]);
      }
      sb.wave();
      const m = new THREE.Mesh(sb.build(), M); m.name = 'roadstead-pennants'; m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ---------- animals: goats, sheep and horses share one small rig; pelicans, terns and kites another ----------
    const WH = new THREE.Color(1, 1, 1), GR = new THREE.Color(0.22, 0.2, 0.2), LEG = new THREE.Color(0.03, 0.028, 0.03);
    const beasts = [], birds = [];
    let beastMesh, horseMesh, pelMesh, ternMesh;
    {
      const NBR = FLG.NOBRONZE, NB2 = FLG.NOBORDER | FLG.NOBRONZE;
      const rig = (horns) => {
        const sb = new SB(500), Z = [-0.52, -0.38, -0.12, 0.14, 0.36, 0.5], belly = [0.54, 0.42, 0.38, 0.4, 0.46, 0.62], back = [0.72, 0.86, 0.84, 0.82, 0.88, 0.94], hw = [0.07, 0.2, 0.25, 0.23, 0.18, 0.1];
        // body: side profile with a curved back and belly, the back seen from above, two round sections seen from in front
        sb.col(WH, LEG).pat(PAT.DABS, 0.42, NBR, 0.3).strip(Z.map((z, i) => [0, belly[i], z]), Z.map((z, i) => [0, back[i], z]));
        sb.strip(Z.map((z, i) => [-hw[i], back[i] - 0.03, z]), Z.map((z, i) => [hw[i], back[i] - 0.03, z]));
        for (const z of [-0.3, 0.24]) sb.col(WH, WH).pat(PAT.DISC, 0, NBR, 0).quad([-0.25, 0.36, z], [0.25, 0.36, z], [0.25, 0.9, z], [-0.25, 0.9, z]);
        // neck and head: profile, plan and face
        sb.col(WH, WH).pat(PAT.PLAIN, 1, NBR).strip([[0, 0.6, 0.4], [0, 0.84, 0.62], [0, 0.92, 0.9]], [[0, 0.94, 0.38], [0, 1.18, 0.56], [0, 1.1, 0.9]]);
        sb.strip([[-0.09, 1.0, 0.42], [-0.1, 1.15, 0.6], [-0.05, 1.07, 0.9]], [[0.09, 1.0, 0.42], [0.1, 1.15, 0.6], [0.05, 1.07, 0.9]]);
        sb.pat(PAT.DISC, 0, NBR, 0).quad([-0.11, 0.84, 0.66], [0.11, 0.84, 0.66], [0.11, 1.18, 0.66], [-0.11, 1.18, 0.66]);
        for (const sx of [-1, 1]) {
          if (horns) sb.wave().col(GR, GR).pat(PAT.CURL, 1, NB2).quad([sx * 0.04, 1.1, 0.64], [sx * 0.2, 1.12, 0.36], [sx * 0.26, 1.5, 0.32], [sx * 0.07, 1.48, 0.6]);
          sb.col(WH, GR).pat(PAT.LEAF, 1, NBR).wave(5, 0.03, sx).quad([sx * 0.07, 1.14, 0.48], [sx * 0.07, 1.14, 0.62], [sx * 0.33, 1.0, 0.6], [sx * 0.33, 1.0, 0.5], [0, 0, 1, 1]);
          // legs: a profile blade and a front blade each
          for (const sz of [-0.36, 0.34]) { sb.wave().col(LEG, LEG).pat(PAT.PLAIN, 1, NBR).quad([sx * 0.12, 0, sz - 0.07], [sx * 0.12, 0, sz + 0.07], [sx * 0.13, 0.5, sz + 0.1], [sx * 0.13, 0.5, sz - 0.1]).quad([sx * 0.12 - 0.06, 0, sz], [sx * 0.12 + 0.06, 0, sz], [sx * 0.13 + 0.085, 0.5, sz], [sx * 0.13 - 0.085, 0.5, sz]); }
        }
        sb.wave(7, 0.08, 0).col(WH, WH).pat(PAT.PLAIN, 1, NBR).quad([0, 0.84, -0.48], [0, 0.56, -0.6], [0, 0.56, -0.52], [0, 0.76, -0.46], [0, 1, 1, 0]); sb.wave();
        return sb.build();
      };
      await ctx.yield();
      const fr = rng.fork('beasts'), goatC = [K.cream, E('#E9D8B8'), K.brown, E('#3A2A22'), K.ochre, K.cream, E('#9A6A3A')];
      for (let i = 0; i < 11; i++) beasts.push({ kind: i < 2 ? 'butt' : i === 2 ? 'cart' : 'goat', x: fr.range(-2.2, 2.2), z: -178 + (i - 3) * 11.8 + fr.range(-3, 3), yaw: fr() * TAU, ph: fr() * 6, sc: fr.range(0.85, 1.1) * 1.5, side: fr.sign(), c: fr.pick(goatC) });
      beasts[0].x = 1.4; beasts[0].z = -131; beasts[1].x = 1.4; beasts[1].z = -128.5; beasts[2].x = cartPos[1][0]; beasts[2].z = cartPos[1][1];
      for (let i = 0; i < 6; i++) beasts.push({ kind: 'sheep', x: 5.5 - (i % 2) * 0.9, z: -101 + i * 1.1, yaw: -Math.PI / 2 + fr.range(-0.5, 0.5), ph: fr() * 6, sc: fr.range(0.95, 1.15), c: i % 3 ? K.cream : E('#EDE3CC') });
      const nHorned = beasts.length, horseC = [E('#8A5A30'), E('#4A342A'), E('#A9733F'), E('#C9B79A'), E('#6B4A30')];
      traffic.forEach((t, ti) => { if (t.kind === 'cart') beasts.push({ kind: 'horse', t: ti, sc: 2.6, c: horseC[beasts.length % 5], ph: ti * 1.3 }); });
      beasts.push({ kind: 'beach', x: 20, z: -53.5, yaw: 0.6, sc: 2.1, c: E('#A9733F'), ph: 4 });
      beasts.push({ kind: 'bcart', sc: 2.2, c: E('#4A342A'), ph: 2 });
      beastMesh = new THREE.InstancedMesh(rig(true), M, nHorned); beastMesh.frustumCulled = false; beastMesh.name = 'beasts';
      horseMesh = new THREE.InstancedMesh(rig(false), M, beasts.length - nHorned); horseMesh.frustumCulled = false; horseMesh.name = 'horses';
      beasts.forEach((b, i) => { b.mesh = i < nHorned ? beastMesh : horseMesh; b.idx = i < nHorned ? i : i - nHorned; b.mesh.setColorAt(b.idx, b.c); }); scene.add(beastMesh, horseMesh);
      const birdGeo = (o) => {
        const bb = new SB(260), DK = new THREE.Color(0.06, 0.06, 0.07), z0 = 0.54, bl = o.bill, bd = o.deep, hb = (bd * (o.pouch ? 2.6 : 2) + 0.015) / 3;
        // seen from above: body and tail; seen from the side: body, an S-curved neck and the head
        bb.wave().col(WH, WH).pat(PAT.PLAIN, 1, NBR).quad([0, 0, -0.5], [0.19, 0, 0], [0, 0, 0.36], [-0.19, 0, 0]);
        bb.quad([0, 0.01, -0.42], [0.14, 0.01, -0.74], [0, 0.01, o.fork ? -0.56 : -0.7], [-0.14, 0.01, -0.74]);
        bb.strip([[0, -0.03, -0.5], [0, -0.1 - o.belly, -0.28], [0, -0.1 - o.belly, 0.05], [0, -0.05, 0.3]], [[0, 0.03, -0.5], [0, 0.11, -0.28], [0, 0.13, 0.05], [0, 0.1, 0.3]]);
        bb.strip([[0, -0.04, 0.3], [0, 0.0, 0.4], [0, 0.06, 0.44], [0, 0.07, 0.56]], [[0, 0.1, 0.3], [0, 0.13, 0.35], [0, 0.2, 0.4], [0, 0.21, 0.56]]);
        // the bill, in profile (with the pouch slung under it) and in plan
        bb.col(o.pouch ? E('#F08A1C') : K.yellow, K.yellow).pat(o.pouch ? PAT.STRIPE_V : PAT.PLAIN, hb * 1.03, NBR)
          .strip([[0, 0.175 - bd, z0], [0, 0.155 - bd * (o.pouch ? 1.6 : 1), z0 + bl * 0.45], [0, 0.1, z0 + bl]], [[0, 0.175, z0], [0, 0.155, z0 + bl * 0.45], [0, 0.115, z0 + bl]]);
        bb.col(K.yellow, K.yellow).pat(PAT.PLAIN, 1, NBR).quad([-0.05, 0.15, z0], [0.05, 0.15, z0], [0.02, 0.11, z0 + bl], [-0.02, 0.11, z0 + bl]);
        // wings: two white segments and dark primaries, bending more toward the tip
        const LX = [0.1, 0.55, 0.9], LZ = [0.24, 0.22, 0.12], TZ = [-0.22, -0.2, -0.16], W = [0, 0.3, 0.6], WY = [0.03, 0.03 + o.arch, 0.03 + o.arch * 1.15];
        bb.wave(o.fr, o.amp, 0);
        for (const sx of [1, -1]) {
          const Le = LX.map((x, i) => [sx * x, WY[i], LZ[i]]), Tr = LX.map((x, i) => [sx * x, WY[i], TZ[i]]);
          bb.col(WH, WH).pat(PAT.PLAIN, 1, NBR); if (sx > 0) bb.strip(Le, Tr, W, W); else bb.strip(Tr, Le, W, W);
          bb.col(DK, DK).pat(PAT.PLAIN, 1, NBR);
          if (sx > 0) bb.quad([0.9, WY[2], 0.12], [1.32, WY[2] - o.arch * 0.55, -0.02], [1.32, WY[2] - o.arch * 0.55, -0.1], [0.9, WY[2], -0.16], [0.6, 1, 1, 0.6]);
          else bb.quad([-0.9, WY[2], -0.16], [-1.32, WY[2] - o.arch * 0.55, -0.1], [-1.32, WY[2] - o.arch * 0.55, -0.02], [-0.9, WY[2], 0.12], [0.6, 1, 1, 0.6]);
        }
        return bb.build();
      };
      await ctx.yield();
      const nT = rare ? 60 : 30, nearBoats = [0, 1, 2, 3, 4, 14, 15, 16, 17, 8];
      pelMesh = new THREE.InstancedMesh(birdGeo({ bill: 0.55, deep: 0.12, pouch: true, fr: 2.0, amp: 0.12, belly: 0.07, arch: 0.13 }), M, 27); pelMesh.frustumCulled = false; pelMesh.name = 'pelicans';
      ternMesh = new THREE.InstancedMesh(birdGeo({ bill: 0.22, deep: 0.05, fork: true, fr: 2.9, amp: 0.2, belly: 0, arch: 0.05 }), M, nT + 5 + 9); ternMesh.frustumCulled = false; ternMesh.name = 'terns-kites';
      for (let i = 0; i < 13; i++) birds.push({ kind: i === 12 ? 'post' : i >= 10 ? 'dive' : i >= 6 ? 'cross' : 'line', i, ph: fr() * 6, sc: 2.3, c: K.cream, dx: i === 10 ? 34 : -41, dz: i === 10 ? 72 : 122 });
      for (let i = 0; i < nT; i++) birds.push({ kind: 'tern', i, boat: nearBoats[i % 10], ph: fr() * 6, ox: fr.range(-9, 9), oy: fr.range(4.5, 9), oz: fr.range(-8, 8), sc: 0.85, c: K.cream, per: fr.range(5, 9) });
      for (let i = 0; i < 5; i++) birds.push({ kind: i === 0 ? 'street' : 'kite', i, ph: fr() * 6, r: fr.range(11, 22), y: fr.range(13, 19), cx: fr.range(-25, 25), sc: 1.5, c: E('#6B3F22') });
      for (let i = 0; i < 9; i++) birds.push({ kind: 'gull', i, ph: fr() * 6, r: fr.range(5, 11), y: fr.range(7.5, 12.5), cx: -34 - i * 19 + fr.range(-5, 5), cz: fr.range(-31, -24), sc: 1.15, c: K.cream });      // terns wheeling over the beached bows
      for (let i = 0; i < 5; i++) birds.push({ kind: 'bow', i, ph: i * 1.3, sc: 2.3, c: K.cream });      // a second line of pelicans that crosses the bow between the breakers
      for (let i = 0; i < 9; i++) birds.push({ kind: 'skein', i, ph: i * 0.9, sc: 2.6, c: K.cream });      // a skein that flies out to sea with us, over the convoy
      { let np = 0, nt = 0; for (const b of birds) { const pel = b.sc > 2; b.mesh = pel ? pelMesh : ternMesh; b.idx = pel ? np++ : nt++; b.mesh.setColorAt(b.idx, b.c); } }
      scene.add(pelMesh, ternMesh);
    }
    await ctx.yield();

    await ctx.yield();
    // ---------- our own pirogue: only the prow, low in the frame, following the camera from the wet sand on ----------
    const prow = new THREE.Object3D();
    {
      const sb = new SB(1400), cA = mats.P[ownA], cB = mats.P[ownB], n = 10, FN = FLG.FINE;
      const zOf = (s) => 2.6 - s * 6.4, yg = (s) => -1.93 + 0.1 * s * s * s, bm = (s) => 1.8 * Math.pow(Math.max(0, 1 - Math.pow(s, 4)), 0.6);
      const side = (sx) => {
        const A = [], B = [], C0 = [], C1 = [], I0 = [], F = [];
        for (let i = 0; i <= n; i++) { const s = i / n, z = zOf(s), b = bm(s), y = yg(s); A.push([sx * b * 0.68, y - 0.95, z]); B.push([sx * b, y, z]); C0.push([sx * b, y + 0.02, z]); C1.push([sx * Math.max(0, b - 0.15), y + 0.02, z]); I0.push([sx * Math.max(0, b - 0.15), y, z]); F.push([sx * b * 0.6, y - 0.72, z]); }
        sb.col(cA, cB).pat(vr.pick([PAT.CHEVRON, PAT.DIAMOND, PAT.COMB, PAT.CHECK]), 0.48, 0, 0.4).strip(A, B);
        sb.col(K.cream, K.cream).pat(PAT.PLAIN, 1, 0, 0.2).strip(C0, C1);
        sb.col(cA, cB).pat(PAT.STRIPE_V, 0.72, FLG.NOBRONZE | FN, 0.2).strip(F, I0);
        return F;
      };
      const FL = side(-1), FR = side(1);
      sb.col(K.ochre, K.wood).pat(PAT.STRIPE_U, 1.3, FLG.NOBRONZE | FLG.NOBORDER | FN, 0.3).strip(FL, FR);
      sb.col(cB, cA).pat(PAT.PLAIN, 0.2, FN, 0.3).box(0, yg(0.6) - 0.23, zOf(0.6), 3.0, 0.08, 0.36);
      // the painted foredeck with its net heap and floats
      const DL = [], DR = [];
      for (let i = Math.round(n * 0.6); i <= n; i++) { const s = i / n, b = Math.max(0, bm(s) - 0.15), y = yg(s) - 0.015; DL.push([-b, y, zOf(s)]); DR.push([b, y, zOf(s)]); }
      sb.col(cB, cA === cB ? K.cream : cA).pat(vr.pick([PAT.DIAMOND, PAT.STAR, PAT.CHEVRON, PAT.CHECK]), 0.42, FN | FLG.NOBORDER, 0.3).strip(DL, DR);
      sb.col(K.cream, K.cream).pat(PAT.PLAIN, 1, FN, 0.3).box(0, DL[0][1] + 0.03, DL[0][2], -DL[0][0] * 2, 0.12, 0.12);
      const hy = yg(0.9), hz = -3.12;
      for (let s = 0; s < 6; s++) { const a0 = (s / 6) * TAU, a1 = ((s + 1) / 6) * TAU, r = 0.4; sb.col(K.cobalt, K.turq).pat(PAT.HATCH, 0.16, FLG.NOBRONZE | FN | FLG.NOBORDER, 0.5).quad([Math.cos(a0) * r, hy, hz + Math.sin(a0) * r], [Math.cos(a1) * r, hy, hz + Math.sin(a1) * r], [Math.cos(a1) * 0.08, hy + 0.26, hz + Math.sin(a1) * 0.08], [Math.cos(a0) * 0.08, hy + 0.26, hz + Math.sin(a0) * 0.08]); }
      for (const [x, z, c] of [[-0.46, -3.3, K.red], [0.44, -3.05, K.yellow], [0.12, -3.5, K.cream], [-0.3, -2.8, K.yellow], [0.3, -3.42, K.red]]) sb.col(c, K.ink).pat(PAT.DISC, 0, FN | FLG.NOBRONZE, 0.9).quad([x - 0.1, hy + 0.02, z + 0.1], [x + 0.1, hy + 0.02, z + 0.1], [x + 0.1, hy + 0.02, z - 0.1], [x - 0.1, hy + 0.02, z - 0.1]);
      // the upswept stem: a tapering painted tongue rising ahead of the bow, a small flag on a staff at its tip, streaming with the wind
      const SZ = [-3.5, -3.75, -3.98, -4.18, -4.33, -4.42], SY = [-1.88, -1.86, -1.84, -1.81, -1.78, -1.75], SW = [0.17, 0.15, 0.125, 0.1, 0.08, 0.065];
      sb.wave().col(cA, K.cream).pat(PAT.STRIPE_U, 0.26, FN, 0.3).strip(SZ.map((z, i) => [-SW[i], SY[i], z]), SZ.map((z, i) => [SW[i], SY[i], z]));
      sb.col(cA, cA).pat(PAT.PLAIN, 1, FN, 0.3).strip(SZ.map((z, i) => [-SW[i], SY[i] - 0.12, z]), SZ.map((z, i) => [-SW[i], SY[i], z])).strip(SZ.map((z, i) => [SW[i], SY[i], z]), SZ.map((z, i) => [SW[i], SY[i] - 0.12, z]));
      const tz = SZ[5] + 0.02, ty = SY[5], wd = U.uWind.value, wl = Math.hypot(wd.x, wd.z) || 1, fx = -wd.x / wl * 0.62, fz = -wd.z / wl * 0.62;
      sb.col(K.ochre, K.ochre).pat(PAT.PLAIN, 1, FLG.NOBORDER).box(0, ty + 0.13, tz, 0.04, 0.3, 0.04);
      sb.col(cB, cA === cB ? K.cream : cA).pat(PAT.STRIPE_U, 0.62, FLG.NOBRONZE | FN, 0).wave(8, 0.06, 0).quad([0, ty + 0.03, tz], [fx, ty + 0.03, tz + fz], [fx, ty + 0.28, tz + fz], [0, ty + 0.28, tz], [0, 1, 1, 0]);
      const m = new THREE.Mesh(sb.build(), mats.mat({ prow: true })); m.frustumCulled = false; m.name = 'our-prow'; prow.add(m); prow.visible = false; scene.add(prow);
    }
    let sand = null;
    if (lookId === 'harmattan') { sand = spriteMesh(U, Math.round(1600 * det), 2, rng.fork('sand')); sand.material.uniforms.uFoam = { value: enc('#B9823E') }; scene.add(sand); }
    await ctx.yield();

    // ---------- per-frame ----------
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _t = new THREE.Vector3(), _c = new THREE.Vector3(), _f = new THREE.Vector3(), camPos = mats.camPos;
    const XA = new THREE.Vector3(1, 0, 0), YA = new THREE.Vector3(0, 1, 0), PIV = new THREE.Vector3(0, -2.0, 1.5);
    const _poi = new THREE.Vector3(), uKite = (uStreet0 + uStreet1) / 2 - 0.05, uBow = uW1 + (uW2 - uW1) * 0.5;
    let pitchS = 0, heaveS = 0, lastU = -1;
    const put = (mesh, i, x, y, z, yaw, pitch, roll, sc) => { _e.set(pitch, yaw, roll, 'YXZ'); _p.set(x, y, z); _s.set(sc, sc, sc); _m.compose(_p, _q.setFromEuler(_e), _s); mesh.setMatrixAt(i, _m); };
    function update(dt, time, camera, u = 0) {
      mats.update(time, camera, u);
      hero.update(dt, time, camera, u);
      for (let i = 0; i < traffic.length; i++) {
        const t = traffic[i], d = (((t.off + time * t.v) % t.span) + t.span) % t.span, z = t.dir > 0 ? BR.z0 - d : BR.z0 - t.span + d, sc = sstep(0, 7, d) * sstep(t.span, t.span - 7, d);
        put(t.mesh, t.idx, t.x, BR.deck, z, t.dir > 0 ? Math.PI : 0, 0, 0, Math.max(0.001, sc * 1.5)); t.mesh.instanceMatrix.needsUpdate = true; t.z = z; t.sc = sc;
      }
      { const p = (((time * 0.03 + 0.2) % 1) + 1) % 1, x = -114 - p * 78, z = -12.15 + 1.3 * Math.sin(x * 0.045), sc = sstep(0, 0.06, p) * sstep(1, 0.94, p);      // the beach cart follows the ruts north
        beachCart.x = x; beachCart.z = z; beachCart.sc = sc; put(beachCart.mesh, beachCart.idx, x, hero.sandY(z) + 0.05 * Math.abs(Math.sin(time * 4)), z, -Math.PI / 2, 0, 0, Math.max(0.001, sc * 1.2)); }
      path.pointAt(u, _t); const pathZ = _t.z;
      for (let i = 0; i < beasts.length; i++) {
        const b = beasts[i]; let x = b.x, y = GY, z = b.z, yaw = b.yaw, pitch = 0, sc = b.sc;
        if (b.kind === 'goat') {
          const dzg = pathZ - b.z, k = sstep(-26, -10, dzg) * (1 - sstep(5, 17, dzg)), vx = Math.cos(time * 0.25 + b.ph) * 0.25, vz = -Math.sin(time * 0.2 + b.ph) * 0.4;
          x = mix(x + Math.sin(time * 0.25 + b.ph) * 1.0, b.side * 3.7, k); z += Math.cos(time * 0.2 + b.ph) * 2; yaw = mix(Math.atan2(vx, vz), b.side * 1.2, k);
          y += Math.abs(Math.sin(time * 5 + b.ph)) * 0.05 + k * (1 - k) * 0.8 * Math.abs(Math.sin(time * 11 + b.ph));
        } else if (b.kind === 'butt') { const s = i === 0 ? 1 : -1, a = Math.max(0, Math.sin(time * 2.2)); z += s * (0.15 - 0.24 * a); yaw = s > 0 ? 0 : Math.PI; pitch = 0.25 * a; y += 0.05 * a; }
        else if (b.kind === 'cart') { y = GY + 1.58; yaw = 0.6 * Math.sin(time * 0.3); }
        else if (b.kind === 'sheep') { pitch = 0.06 * Math.sin(time * 1.1 + b.ph); }
        else if (b.kind === 'horse') { const t = traffic[b.t]; x = t.x; y = BR.deck; z = t.z + (t.dir > 0 ? -7.9 : 7.9) * t.sc; yaw = t.dir > 0 ? Math.PI : 0; pitch = 0.07 * Math.sin(time * 3 + b.ph); y += Math.abs(Math.sin(time * 4 + b.ph)) * 0.08; sc *= t.sc; }
        else if (b.kind === 'bcart') { x = beachCart.x - 6.4 * beachCart.sc; z = beachCart.z; y = hero.sandY(z) + Math.abs(Math.sin(time * 4 + b.ph)) * 0.08; yaw = -Math.PI / 2; pitch = 0.07 * Math.sin(time * 3 + b.ph); sc *= beachCart.sc; }
        else { y = hero.sandY(z); pitch = 0.09 * Math.sin(time * 0.9 + b.ph); }
        put(b.mesh, b.idx, x, y, z, yaw, pitch, 0, Math.max(0.001, sc));
      }
      beastMesh.instanceMatrix.needsUpdate = true; horseMesh.instanceMatrix.needsUpdate = true;
      const ret = hero.retPos, esc = hero.escPos, cx = camPos.x, cy = camPos.y, cz = camPos.z, feast = rare ? sstep(uW2 - 0.05, uW2 + 0.02, u) : 0;
      for (let i = 0; i < birds.length; i++) {
        const b = birds[i]; let x = 0, y = 0, z = 0, yaw = 0, pitch = 0, roll = 0, sc = b.sc;
        if (b.kind === 'line') {
          // keyed to u: the line flies north over the swash, ahead of the eye along the bows and across the sky of the swing from the fleet to the sea
          x = -150 + (0.65 - u) * 900 + b.i * 11; z = 1 + 2.5 * Math.sin(x * 0.03 + b.i);
          y = 8.5 + 0.5 * b.i + 0.4 * Math.sin(time * 0.7 + b.i); yaw = -Math.PI / 2; roll = 0.12 * Math.sin(time * 0.8 + b.i);
        } else if (b.kind === 'cross') { x = -100 - (u - 0.915) * 700 + (b.i - 6) * 9; z = 200 + (b.i - 6) * 3.5; y = 9.5 + (b.i - 6) * 0.45 + 0.3 * Math.sin(time + b.i); yaw = -Math.PI / 2; roll = 0.1 * Math.sin(time * 0.9 + b.i); }
        else if (b.kind === 'dive') {
          const p = ((time / 8 + b.ph) % 1 + 1) % 1, a = time * 0.5 + b.ph; x = -100 + b.dx + Math.cos(a) * 6; z = b.dz + Math.sin(a) * 6; yaw = Math.atan2(-Math.sin(a), Math.cos(a));
          const d = sstep(0.7, 0.8, p); y = 9 + Math.sin(time + b.ph) - d * 9.6 + sstep(0.86, 1, p) * 9.6 * (p > 0.86 ? 1 : 0); pitch = Math.sin(d * Math.PI) * 1.2; sc *= p > 0.8 && p < 0.86 ? 0.001 : 1; if (p >= 0.86) y = mix(0.5, 9 + Math.sin(time + b.ph), sstep(0.86, 1, p));
        } else if (b.kind === 'post') { const k = sstep(0.012, 0.07, u), k2 = sstep(0.06, 0.24, u); x = 96 - k * 62 - k2 * 52; y = 2.0 + k * 10 + k2 * 4; z = -272.5 + k * 30 + k2 * 52; yaw = Math.atan2(-62 - k2 * 20, 30 + k2 * 40); pitch = -0.3 * Math.sin(k * Math.PI); roll = 0.12 * Math.sin(time * 0.8); }
        else if (b.kind === 'tern') {
          const j = b.boat * 3, p = ((time / b.per + b.ph) % 1 + 1) % 1, drop = p > 0.8 ? Math.sin(((p - 0.8) / 0.2) * Math.PI) : 0;
          x = ret[j] + b.ox + 2 * Math.sin(time * 0.9 + b.ph); z = ret[j + 2] + b.oz + 2 * Math.cos(time * 0.7 + b.ph); y = ret[j + 1] + b.oy * (1 - 0.86 * drop) + 0.6;
          if (feast > 0) { x = mix(x, cx + b.ox * 2.6, feast); z = mix(z, cz + 22 + b.oz * 3, feast); y = mix(y, 1.2 + b.oy * (1 - 0.9 * drop), feast); }
          yaw = time * 0.5 + b.ph; pitch = drop * 0.9;
        } else if (b.kind === 'kite') { const a = time * 0.35 + b.ph; x = b.cx + Math.cos(a) * b.r; z = -50 + Math.sin(a) * b.r * 0.6; y = b.y + Math.sin(time * 0.4 + b.ph); yaw = Math.atan2(-Math.sin(a), 0.6 * Math.cos(a)); roll = -0.4; }
        else if (b.kind === 'gull') { const a = time * (0.5 + 0.04 * b.i) * (b.i % 2 ? 1 : -1) + b.ph, dr = b.i % 2 ? 1 : -1; x = b.cx + Math.cos(a) * b.r; z = b.cz + Math.sin(a) * b.r * 0.7; y = b.y + 0.8 * Math.sin(time * 0.5 + b.ph); yaw = Math.atan2(-Math.sin(a) * dr, 0.7 * Math.cos(a) * dr); roll = -0.45 * dr; }
        else if (b.kind === 'bow') { const k = u - uBow; x = -100 - k * 430 + (b.i - 2) * 7.5; z = 100 + (b.i - 2) * 3.2; y = 4.8 + 0.6 * hero.heightAt(x, z) + (b.i % 2) * 0.6 + 0.3 * Math.sin(time * 0.7 + b.i); yaw = -Math.PI / 2; roll = 0.38 + 0.1 * Math.sin(time * 0.8 + b.i); sc *= sstep(0.2, 0.16, Math.abs(k)); }
        else if (b.kind === 'skein') {
          // a V ahead of the eye from the first breaker to the anchored pair, drifting from right to left; two fold and dive beside the escorts
          const r = Math.ceil(b.i / 2), sd = b.i % 2 ? 1 : -1, a = sstep(0.66, 0.78, u), e = sstep(0.915, 0.99, u), wob = Math.sin(time * 0.6 + b.ph);
          x = -100 + mix(-9, 9, sat((u - 0.76) / 0.17)) - sd * r * 3.7 - (1 - a) * 140 + e * 46 + 0.5 * wob;
          z = pathZ + 46 - r * 4.3 + (1 - a) * 50 + e * 26 + 0.6 * Math.sin(time * 0.45 + b.ph * 2);
          y = 14.7 - r * 0.75 + (1 - a) * 8 + e * 14 + 0.35 * wob; roll = 0.1 * Math.sin(time * 0.8 + b.ph); sc *= sstep(0.6, 0.66, u);
          yaw = 0.12; pitch = -0.85 + 0.06 * wob;      // drawn as the painter draws a bird going away: wings spread flat to the eye
          if (b.i >= 7) { const c = b.i === 7 ? 0.80 : 0.855, j = (b.i === 7 ? 0 : 1) * 4, dv = sstep(c - 0.02, c, u) * (1 - sstep(c + 0.006, c + 0.032, u));
            x = mix(x, esc[j] + (b.i === 7 ? 4.5 : -4.5), dv); y = mix(y, esc[j + 1] + 1.4, dv); z = mix(z, esc[j + 2] + 5, dv); pitch = mix(pitch, u < c ? 1.1 : -0.4, Math.sin(dv * Math.PI)); }
        }
        else { const k = (u - uKite) / 0.1; x = mix(-17, 17, k); z = -134 + k * 30; y = 15.6 - 1.6 * Math.sin(sat(k) * Math.PI); yaw = Math.atan2(34, 30); roll = 0.55; sc *= k > -0.4 && k < 1.6 ? 1 : 0.001; }
        put(b.mesh, b.idx, x, y, z, yaw, pitch, roll, Math.max(0.001, sc));
      }
      pelMesh.instanceMatrix.needsUpdate = true; ternMesh.instanceMatrix.needsUpdate = true;
      // our prow: rides under the eye from the wet sand on. It turns with the gaze and follows most of its pitch, so stem and flag stay
      // in the bottom of the frame; on top of that it rears and heaves on the wave function. It never rolls with the camera.
      const on = u > uWater - 0.04;
      prow.visible = on;
      if (on) {
        path.tangentAt(u, _t); const tl = Math.hypot(_t.x, _t.z) || 1, fx = _t.x / tl, fz = _t.z / tl;
        const hB = hero.heightAt(cx + fx * 5, cz + fz * 5), hS = hero.heightAt(cx - fx * 4, cz - fz * 4), hM = hero.heightAt(cx, cz);
        // (the rear is held to 0.13 rad: beyond that the whole foredeck swings up across the lower half of the frame and covers the portal)
        const afloat = sstep(uWater, uZ30, u), pt = Math.max(-0.04, Math.min(0.13, Math.atan2(hB - hS, 9))) * afloat, hv = Math.max(-0.12, Math.min(0.12, hM + 2.6 - cy)) * afloat;
        const k = (lastU < 0 || Math.abs(u - lastU) > 0.02 || dt <= 0) ? 1 : Math.min(1, dt * 7);
        pitchS += (pt - pitchS) * k; heaveS += (hv - heaveS) * k;
        _f.set(0, 0, -1).applyQuaternion(mats.camQuat);
        const cyaw = Math.atan2(-_f.x, -_f.z), cp = Math.asin(Math.max(-1, Math.min(1, _f.y))) * 0.7, wp = pitchS + 0.015 * Math.sin(time * 1.7);
        _q.setFromAxisAngle(YA, cyaw); _q2.setFromAxisAngle(XA, wp);
        _c.copy(PIV).applyQuaternion(_q2); _p.copy(PIV).sub(_c);                       // it rears about a point behind and below the eye
        _q2.setFromAxisAngle(XA, cp); _p.applyQuaternion(_q2).applyQuaternion(_q);
        const wide = Math.max(0, Math.tan((camera.fov || 62) * Math.PI / 360) - 0.601);            // a tall, wide-angle frame would show the whole foredeck: sit lower there
        prow.position.copy(camPos).add(_p); prow.position.y += heaveS - 1.8 * wide - 3.2 * (1 - sstep(uWater - 0.04, uWater + 0.01, u)) + 0.025 * Math.sin(time * 2.3);
        _q2.setFromAxisAngle(XA, cp + wp); prow.quaternion.copy(_q).multiply(_q2);
      }
      lastU = u;
      if (sand) sand.material.uniforms.uCam.value.copy(camPos);
    }
    await ctx.yield();
    { const c0 = new THREE.PerspectiveCamera(62, ctx.aspect || 1.78, 0.3, 3200); path.pointAt(0, c0.position); c0.lookAt(BR.x, 6, -284); c0.updateMatrixWorld(); update(0, 0, c0, 0); lastU = -1; }

    return {
      scene, path, duration: DURATION,
      pace: (u) => 1 - 0.3 * sstep(uLane - 0.02, uLane + 0.02, u) * (1 - sstep(uRun1 - 0.01, uRun1 + 0.03, u)),      // linger along the comb of bows
      title: look.title + (rare ? ': the Sardinella Run' : ''),
      ride: 'none', style: 'none',
      camera: { fov: 62, near: 0.3, far: 3200, lookAhead: 17, sway: 0.8, bank: 0.12 },
      pois: [
        // the bow of the second arch; the pull slides onto the route's own look-ahead before the deck, so the gaze is level as it passes overhead
        { at: (t, u) => { const k = sstep(0.034, 0.062, u); path.pointAt(Math.min(1, u + 0.025), _poi); return _poi.set(mix(BR.x, _poi.x, k), mix(13, _poi.y, k), mix(-284, _poi.z, k)); }, from: 0.0, to: uBridge + 0.01, weight: 0.3, fade: 0.3 },
        { at: [18, 6, -197], from: uBridge - 0.05, to: uStreet0 - 0.03, weight: 0.7, fade: 0.055 / (uStreet0 - 0.03 - uBridge + 0.05) },                // the waterfront and the street mouth
        { at: (t, u) => { path.pointAt(u, _poi); return _poi.set(_poi.x - 70, 6, _poi.z - 40); }, from: uLane - 0.01, to: uRun1 + 0.03, weight: 0.9, fade: 0.25 },              // the comb of bows to its vanishing point
        { at: [-100, 8, 215], from: uW1, to: 1, weight: 0.25, fade: 0.2 },                                   // the crossed prows over the portal
      ],
      portal: { shape: 'circle', radius: 7, color: look.portal, glow: 0.9, blendDistance: 25 },
      post: { exposure: 1, bloom: { strength: 0.0, radius: 0.3, threshold: 6 }, grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0.1, grain: 0.012, aberration: 0 } },
      update,
      dispose() { hero.dispose?.(); },
    };
  },
};
