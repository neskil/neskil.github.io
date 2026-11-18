// THE WIND COMES HOME (whiplash-wind): a June evening inside an art-nouveau poster whose figure has left, leaving
// only her hair. The wind is gold-lined tresses streaming over poppy hills, drawn home and coiled onto a great
// ornamental roundel on the highest hill. A colour lithograph: cream paper, six flat inks, one olive tint stone,
// bronze-powder gold; nothing is lit; the line is everything. Everything visible is made from ONE makeStyle().
// Course +Z (north). Port (+X) is where the undrawn sun is. y = 0 is the river.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildHero, makeStyle, WW_PALETTE, WW_EXPOSURE } from '../parts/whiplash-wind.js';

const TAU = Math.PI * 2;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const sm = (x) => { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); };
const clamp01 = (x) => Math.min(Math.max(x, 0), 1);
const UP0 = new THREE.Vector3(0, 1, 0);
const HZ = 910, HTOP = 104;                         // the summit: z of the roundel, height of the ground under it

export default {
  id: 'whiplash-wind',
  name: 'The Wind Comes Home',
  category: 'bizarre',
  weirdness: 0.8,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {};
    const detail = Math.min(1, Math.max(0.5, ctx.quality?.detail ?? 1));
    const density = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    const scene = new THREE.Scene();
    const tick = [];                                    // per-frame workers of the cast, added as each is built

    // ---- the seeded look: hour, season, colourway of the hair, cast (drawn first, in a fixed order) ----------
    const vr = rng.fork('look');
    const hourRoll = vr(), seasonRoll = vr(), hairRoll = vr(), castRoll = vr(), castRoll2 = vr(), castRoll3 = vr();
    let hour = hourRoll < 0.5 ? 'evening' : hourRoll < 0.76 ? 'morning' : 'blue';
    if (vary.hour === 'dawn') hour = 'morning'; else if (vary.hour === 'night') hour = 'blue';
    else if (vary.hour === 'golden' || vary.hour === 'day') hour = 'evening';
    const season = seasonRoll < 0.5 ? 'june' : seasonRoll < 0.76 ? 'september' : 'april';
    const colourway = hairRoll < 0.5 ? 'auburn' : hairRoll < 0.75 ? 'olive' : 'silver';
    const birds = castRoll < 0.5 ? 'swallow' : castRoll < 0.78 ? 'dove' : 'dragonfly';
    const wader = castRoll2 < 0.6 ? 'swan' : 'heron';
    const boat = castRoll3 < 0.6 ? 'punt' : 'barge';
    const rare = !!vary.rare;

    const style = makeStyle(ctx, { palette: WW_PALETTE, exposure: WW_EXPOSURE });
    const pal = style.pal, U = style.uniforms;
    style.setSun(V3(0.93, 0.26, -0.22));               // 80 degrees to port of a +Z course, low; never drawn
    // inks by role. The seven stones never change; the hour and season choose which stone prints which thing.
    const INK = {
      hill: hour === 'blue' ? pal.sage2 : season === 'september' ? pal.cream2.clone().lerp(pal.peach, 0.3) : pal.sage,
      hillFar: hour === 'blue' ? pal.sage : season === 'september' ? pal.cream2 : pal.sage,
      flower: season === 'april' ? pal.cream : hour === 'blue' ? pal.rose2 : pal.rose,
      skyTop: hour === 'evening' ? pal.peach : hour === 'morning' ? pal.sage : pal.teal,
      cloud: hour === 'blue' ? pal.rose : pal.cream,
      water: hour === 'blue' ? pal.teal2 : pal.teal,
      hair: colourway === 'auburn' ? pal.peach : colourway === 'olive' ? style.toInk('#6E6A45') : style.toInk('#E6DFD0'),
    };
    style.hairInk = INK.hair;                           // the hero's coil is wound from the same hair
    if (colourway === 'silver') U.uBronze.value = style.toInk('#8C5A52');   // silver-white with rose: the strands turn rose when away

    // ---- the lie of the land: one height function for everything ---------------------------------------------
    const riverZ = (x) => 425 + 26 * Math.sin(x * 0.0045 + 0.6);
    const roll = (x, z) => noise.fbm2(x * 0.0032 + 11.3, z * 0.0032 - 4.1, 3);
    const ground = (x, z) => {
      const ax = Math.abs(x), side = sm((ax - 40) / 220);
      let h = 23.5 * Math.pow(clamp01(1 - z / 385), 1.5) + 0.6 - (z < 0 ? Math.min(z * z * 0.004, 5) + 23.5 * (Math.pow(1 - z / 385, 1.5) - 1) : 0);
      h += Math.min(0.00022 * x * x, 46) * (0.55 + 0.45 * Math.sin(z * 0.006 + x * 0.002 + 1.0));
      h += roll(x, z) * 20 * side;
      const dr = Math.abs(z - riverZ(x));
      h = h + (-3 - h) * (1 - sm((dr - 36) / 46));     // the river bed
      const d = Math.hypot(x * 0.8, z - HZ), t = clamp01((d - 50) / 370);
      h += (HTOP + 3) * (1 - t * t) * (z > 380 || d < 420 ? 1 : 0);
      return h;
    };
    const hillYLocal = (lx, lz) => ground(-lx, HZ - lz) - HTOP;   // the hero is turned to face us: local +Z is world -Z

    // ---- the path: the centre line of tress zero ---------------------------------------------------------------
    const cork = [];
    for (let i = 0; i <= 8; i++) {                      // the hero's fly-through, in world space (it swings to starboard first)
      const t = i / 8, th = -Math.PI / 2 + TAU * t, rho = 45 * Math.pow(1 - t, 0.85);
      cork.push([-Math.cos(th) * rho, HTOP + 62 + Math.sin(th) * rho, HZ - 210 + 140 * t]);
    }
    const path = makePath([
      [0, 33, 0], [0, 29.9, 32], [0, 26.9, 64], [0, 21.2, 128], [1.5, 15.9, 196], [6, 11.7, 258], [-5.5, 8.65, 312],
      [0, 6.45, 362], [0, 5, 410], [0, 5.6, 458], [1, 15.5, 498], [4, 28, 520], [5, 39.5, 543], [0, 52.5, 570], [-5, 64.5, 598], [0, 77, 628], [4, 91, 657],
      ...cork, [0, HTOP + 62, HZ - 35], [0, HTOP + 62, HZ],
    ]);
    const L = path.length, SPEED = 25, duration = Math.round((L / SPEED) * 2) / 2;
    const uAtZ = (z) => { let lo = 0, hi = 0.7; const v = V3(); for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; path.pointAt(m, v); if (v.z < z) lo = m; else hi = m; } return (lo + hi) / 2; };
    await ctx.yield();

    // ---- the sky: one split-fountain blend, the scroll frieze, the gold stars (all in the dome's material) ----
    const sky = style.sky({ top: INK.skyTop, cloud: INK.cloud, stars: hour === 'morning' ? 4 : 9, frieze: hour === 'morning' ? 0.6 : 1,
      starSize: hour === 'blue' ? 0.042 : 0.03, rng: rng.fork('stars') });
    scene.add(sky);
    if (hour === 'blue') {                              // blue hour: thirty gold stars are out (nine in the dome, the rest hung far off)
      const b = style.batch(), sr = rng.fork('more-stars');
      for (let i = 0; i < 21; i++) {
        const az = sr() * TAU, el = sr.range(0.42, 1.2), R = 3600, c = V3(Math.sin(az) * Math.cos(el) * R, Math.sin(el) * R, 450 + Math.cos(az) * Math.cos(el) * R), n = c.clone().sub(V3(0, 60, 450)).normalize().negate();
        const ex = V3().crossVectors(n, UP0).normalize(), ey = V3().crossVectors(ex, n), ring = [], sz = sr.range(60, 105);
        for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU, r = k % 2 ? sz * 0.26 : sz; ring.push(c.clone().addScaledVector(ex, Math.cos(a) * r).addScaledVector(ey, Math.sin(a) * r)); }
        style.fan(b, c, ring, { ink: pal.gold, gold: 2, lw: sz * 0.06, inset: sz * 0.26, normal: n.clone().lerp(V3(sr.range(-1, 1), sr.range(-0.3, 0.6), sr.range(-1, 1)), 0.5).normalize() });
      }
      const m = new THREE.Mesh(style.geometry(b), style.ink({ grainScale: 0.05, lineHold: 1 })); m.frustumCulled = false; m.name = 'gold-stars'; scene.add(m);
    }

    // ---- the ground: one sheet for the down, the river valley and the highest hill (second tone = drawn hollows;
    //      grass = combed hairline strokes in the material; crest keyline = its inverted hull) --------------------
    const gb = style.batch();
    {
      const NX = 100, NZ = 124, X = (i) => { const a = (i / NX) * 2 - 1; return 820 * Math.sign(a) * Math.pow(Math.abs(a), 1.55); }, Z = (j) => -70 + (j / NZ) * 1500;
      for (let j = 0; j <= NZ; j++) {
        for (let i = 0; i <= NX; i++) {
          const x = X(i), z = Z(j), y = ground(x, z);
          const nx = ground(x - 4, z) - ground(x + 4, z), nz = ground(x, z - 4) - ground(x, z + 4), nl = Math.hypot(nx, 8, nz);
          gb.pos.push(x, y, z); gb.nor.push(nx / nl, 8 / nl, nz / nl); gb.ink.push(INK.hill.r, INK.hill.g, INK.hill.b);
          // hollows: long drawn shapes lying along the slopes (never a falloff: the shader cuts them hard at 0.5)
          const hol = noise.fbm2(x * 0.0055 - 9.2, z * 0.0030 + 4.4, 2) * 1.7 + 0.22 + 0.5 * Math.max(0, nz / nl) - 2.6 * sm((95 - Math.abs(x)) / 50) * (z < 760 ? 1 : 0.3) - 2.4 * sm((46 - Math.abs(x * 0.766 + (z - 290) * 0.643)) / 30);
          gb.aux.push(99, 0.1, hol, 0); gb.bnd.push(0);
          if (i < NX && j < NZ) { const p = j * (NX + 1) + i, q = p + NX + 1; gb.idx.push(p, q, p + 1, p + 1, q, q + 1); }
        }
        if (j % 5 === 4) await ctx.yield();
      }
      const gg = style.geometry(gb);
      const land = new THREE.Mesh(gg, style.ink({ grainScale: -5, comb: true, combZ: HZ + 160, combSpacing: 3.4, side: THREE.FrontSide, field: 1, fieldCell: 8.5, fieldRosette: 1.9,
        fieldAmount: (season === 'september' ? 0.45 : 1) * (0.75 + 0.25 * density), driftInk: INK.flower }));
      const crest = new THREE.Mesh(gg, style.hull({ weight: 0.003 }));
      land.name = 'land'; crest.name = 'land-keyline'; land.frustumCulled = crest.frustumCulled = false;
      scene.add(crest, land);
    }
    await ctx.yield();

    // ---- hills rolling away in five planes: separate overlapping mounds, each with its own contour. Distance takes
    //      the hollows first, then the weight of the line, then the colour: the last ridge is a line on bare cream.
    const farLines = [];
    {
      const mr = rng.fork('mounds');
      const planes = [
        { n: 7, r0: 620, r1: 900, h: [50, 95], w: [260, 420], ink: INK.hill, pale: 0.0, weight: 0.0026, tone: 1 },
        { n: 8, r0: 950, r1: 1400, h: [80, 150], w: [380, 620], ink: INK.hillFar, pale: 0.22, weight: 0.0021, tone: 1 },
        { n: 9, r0: 1500, r1: 2100, h: [120, 220], w: [560, 900], ink: INK.hillFar, pale: 0.48, weight: 0.0017, tone: 0 },
        { n: 9, r0: 2250, r1: 3000, h: [170, 300], w: [800, 1300], ink: INK.hillFar, pale: 0.70, weight: 0.0013, tone: 0 },
        { n: 10, r0: 3200, r1: 3900, h: [230, 400], w: [1100, 1700], ink: pal.cream, pale: 1.0, weight: 0.0011, tone: 0 },
      ];
      for (let pi = 0; pi < planes.length; pi++) {
        const P = planes[pi], b = style.batch(), RINGS = 7, SEGS = 22;
        for (let k = 0; k < P.n; k++) {
          const az = ((k + mr.range(-0.3, 0.3)) / P.n) * TAU + pi * 0.7, r = mr.range(P.r0, P.r1);
          let cx = Math.sin(az) * r, cz = 450 + Math.cos(az) * r * (pi === 0 ? 1.15 : 1);
          if (pi === 0 && Math.abs(cx) < 560) cx = 560 * (cx < 0 ? -1 : 1) + cx * 0.3;      // keep the first plane off our valley
          const hh = mr.range(P.h[0], P.h[1]), wx = mr.range(P.w[0], P.w[1]), wz = wx * mr.range(0.7, 1.2), sk = mr.range(-0.35, 0.35);
          const rosy = mr() < 0.3 && pi > 0 && pi < 4 && season !== 'september';
          const ink = (rosy ? INK.flower : P.ink).clone().lerp(pal.cream, P.pale * (rosy ? 0.9 : 1));
          const base = b.pos.length / 3, y0 = pi === 0 ? -6 : -12;
          if (pi < 3 && (pi < 2 || k % 2 === 0)) {          // a tress lies over this hill, pointing home
            const aT = Math.atan2(-cx, HZ - cz) + mr.range(-0.5, 0.5), pts = [];
            for (let q = -8; q <= 8; q++) {
              const f = (Math.abs(q) / 8) * 0.9, a = q < 0 ? aT + Math.PI + 0.7 * sk : aT + 0.3 * Math.sin(k * 1.9);
              const lob = 1 + 0.16 * Math.sin(a * 2 + k) + 0.1 * Math.sin(a * 3 + k * 2.3), prof = Math.cos(f * Math.PI * 0.5);
              pts.push(V3(cx + Math.sin(a) * wx * f * lob + sk * hh * (1 - f), y0 + hh * Math.pow(prof, 1.25) + 3 + pi * 2, cz + Math.cos(a) * wz * f * lob));
            }
            farLines.push({ pts, half: 8 + pi * 5 + mr.range(0, 3), plane: pi });
          }
          for (let i = 0; i <= RINGS; i++) for (let j = 0; j < SEGS; j++) {
            const f = i / RINGS, a = (j / SEGS) * TAU, lob = 1 + 0.16 * Math.sin(a * 2 + k) + 0.1 * Math.sin(a * 3 + k * 2.3);
            const prof = Math.cos(f * Math.PI * 0.5), yy = y0 + hh * Math.pow(prof, 1.25) * (1 + 0.1 * Math.sin(a * 2 + k * 1.7) * f);
            const x = cx + Math.sin(a) * wx * f * lob + sk * hh * (1 - f), z = cz + Math.cos(a) * wz * f * lob;
            b.pos.push(x, yy, z); b.nor.push(Math.sin(a) * f, 1.05 - f, Math.cos(a) * f); b.ink.push(ink.r, ink.g, ink.b);
            const hol = P.tone ? Math.sin(a * 2 + k * 1.3 + f * 2.5) * 0.9 + noise.n2(x * 0.004, z * 0.004 + k) * 0.8 + 0.1 : 0;
            b.aux.push(99, 0.1, hol, 0); b.bnd.push(0);
            if (i < RINGS) { const p = base + i * SEGS + j, q = base + i * SEGS + ((j + 1) % SEGS); b.idx.push(p, p + SEGS, q, q, p + SEGS, q + SEGS); }
          }
        }
        const g = style.geometry(b);
        const m = new THREE.Mesh(g, style.ink({ grainScale: 0.3 - pi * 0.04, side: THREE.FrontSide })), hl = new THREE.Mesh(g, style.hull({ weight: P.weight }));
        m.frustumCulled = hl.frustumCulled = false; m.name = 'hills' + pi; scene.add(hl, m);
        await ctx.yield();
      }
    }
    await ctx.yield();

    // ---- THE HERO: the roundel on the summit, turned to face us (local +Z = world -Z) -------------------------
    const hero = await buildHero(ctx, { style, detail: detail * 0.85, mound: false, hillY: hillYLocal, progress: 0.2, joinFeet: true });
    hero.object.position.set(0, HTOP, HZ); hero.object.rotation.y = Math.PI; scene.add(hero.object);
    hero.object.updateMatrixWorld(true);
    const toWorld = (v) => V3(-v.x, v.y + HTOP, HZ - v.z), dirWorld = (v) => V3(-v.x, v.y, -v.z);
    const feet = hero.anchors.tressFeet.map((f) => ({ p: toWorld(f.position), d: dirWorld(f.direction), half: f.halfWidth }));
    feet.sort((a, b) => b.p.x - a.p.x);                 // port to starboard
    await ctx.yield();

    // ---- THE TRESSES. Centre lines first (tip first, roundel end last). -----------------------------------------
    const RIDE_DROP = 4.3;                              // our own tress runs this far under the eye
    const lay = (x, z, lift = 2) => V3(x, Math.max(ground(x, z), 0) + lift, z);
    const resample = (ctl, step) => { const c = new THREE.CatmullRomCurve3(ctl, false, 'centripetal'), n = Math.max(8, Math.round(c.getLength() / step)), out = []; for (let i = 0; i <= n; i++) out.push(c.getPointAt(i / n)); return out; };
    const _t = V3(), _s = V3(), _n = V3(), _c = V3(), UP = V3(0, 1, 0);
    // a point of the plait: on a helix round our own path (never nearer than 6.5 m), kept off the ground
    const plaitAt = (d, phi, over) => {                 // only two of the five ever cross over us; the others weave beside and under
      path.posAtDist(d, _c); path.tangentAtDist(d, _t); _s.crossVectors(_t, UP).normalize(); _n.crossVectors(_s, _t).normalize();
      // the plait is woven round OUR TRESS, which runs 4.3 m under the eye: two of the five cross just over it (and so
      // close under us), the others under it, so the whole braid lies below the eye line and the roundel stands clear above
      const sn = Math.sin(phi);
      const p = _c.clone().addScaledVector(_s, 11.5 * Math.cos(phi)).addScaledVector(_n, over ? -RIDE_DROP + (sn > 0 ? 1.8 * sn : 3.0 * sn) : -3 - 4.2 * Math.abs(sn));
      p.y = Math.max(p.y, ground(p.x, p.z) + 1.6); return p;
    };
    const dPlait1 = uAtZ(680) * L, tr = rng.fork('tresses');
    // five near tresses: [approach over the land ...], where each joins the plait (z), its phase round the path
    const nearDefs = [
      { ctl: [[430, -70], [310, 120], [185, 290], [78, 432, 5], [24, 494, 4]], join: 520, phi: 0.2 },                       // closes from port at 21 s
      { ctl: [[340, 10], [215, 70], [122, 128, 16], [52, 204, 19], [0, 238, 15], [-62, 286, 20], [-126, 344, 10], [-122, 424, 6], [-66, 484, 5], [-26, 528, 3]], join: 548, phi: 3.3 }, // crosses overhead at the poplars, closes from starboard at 23 s
      { ctl: [[-470, 60], [-330, 250], [-250, 400, 6], [-150, 500], [-48, 548, 4]], join: 566, phi: 2.2 },
      { ctl: [[520, 300], [330, 420, 6], [170, 500], [48, 556, 4]], join: 576, phi: 5.3 },
      { ctl: [[-600, 420, 6], [-380, 520], [-200, 540], [-46, 574, 4]], join: 592, phi: 5.0 },
    ];
    const nearLines = [];
    for (let k = 0; k < nearDefs.length; k++) {
      const D = nearDefs[k], ctl = D.ctl.map((c) => (c[2] !== undefined && c[2] > 9 ? V3(c[0], path.nearestXZ(c[0], c[1]).y + c[2], c[1]) : lay(c[0], c[1], c[2] ?? 2.2)));
      const d0 = uAtZ(D.join) * L;
      for (let d = d0; d <= dPlait1 + 1; d += 14) ctl.push(plaitAt(d, D.phi + ((d - d0) * TAU) / 150, k < 2));
      const F = feet[[0, 4, 3, 1, 2][k]];
      // leaving the plait it turns toward its foot in one slow curve (never a corner)
      const pl = ctl[ctl.length - 1], tl = pl.clone().sub(ctl[ctl.length - 2]).normalize(), toF = F.p.clone().sub(pl).normalize();
      const c1 = pl.clone().addScaledVector(tl.clone().lerp(toF, 0.3).normalize(), 17), c2 = c1.clone().addScaledVector(tl.clone().lerp(toF, 0.7).normalize(), 19);
      for (const c of [c1, c2]) { c.y = Math.max(c.y, ground(c.x, c.z) + 3); ctl.push(c); }
      const last = ctl[ctl.length - 1], mid = last.clone().lerp(F.p, 0.45); mid.y = Math.max(mid.y, ground(mid.x, mid.z) + 3); ctl.push(mid);
      ctl.push(F.p.clone().addScaledVector(F.d, -34), F.p.clone().addScaledVector(F.d, -12), F.p.clone());
      nearLines.push({ pts: resample(ctl, 2.6), half: F.half, foot: true, wide: 4.6 + tr.range(0, 1.6) });
      await ctx.yield();
    }
    // eight middle tresses lying over the hills to left and right, all going home round the back of the roundel
    const midLines = [];
    for (let k = 0; k < 8; k++) {
      const sgn = k % 2 ? -1 : 1, x0 = sgn * tr.range(360, 720), z0 = tr.range(-60, 520), ctl = [];
      const xe = sgn * tr.range(60, 110), n = 7;
      for (let i = 0; i <= n; i++) {
        const t = i / n, e = t * t * (3 - 2 * t), x = x0 + (xe - x0) * (0.35 * t + 0.65 * e) + 46 * Math.sin(t * 5.2 + k) * (1 - t), z = z0 + (HZ + 30 - z0) * t;
        if (Math.abs(x) < 34) continue;
        ctl.push(lay(x, z, 2.4));
      }
      midLines.push({ pts: resample(ctl, 4.2), half: tr.range(4.5, 8), foot: false });
    }
    await ctx.yield();

    // ---- tress geometry: three meshes (our own; the near and middle ones; the far bands) ------------------------
    const tressGeos = [], zOf = (pts, t) => pts[Math.min(pts.length - 1, Math.round(t * (pts.length - 1)))].z;
    for (let k = 0; k < nearLines.length; k++) {
      const T = nearLines[k], join = nearDefs[k].join, pts = T.pts;
      let len = 0; for (let i = 1; i < pts.length; i++) len += pts[i].distanceTo(pts[i - 1]);
      tressGeos.push(style.tressGeometry(pts, {
        phase: k * 1.7 + tr.range(0, 6), across: 4,
        half: (t) => { const z = zOf(pts, t), a = sm((z - join + 70) / 80), b = sm((z - 684) / 80); return (T.wide + (1.7 - T.wide) * a) * (1 - b) + T.half * b; },
        sway: (t, s) => { const z = zOf(pts, t), a = sm((z - join + 90) / 70); return (1 - 0.8 * a) * (1 - sm((s - len + 110) / 60)); },
        roll: (t, s) => { const z = zOf(pts, t); return z < join - 60 || (z > 700 && s < len - 120) ? 1 : 0; },
      }));
      await ctx.yield();
    }
    for (let k = 0; k < midLines.length; k++) {
      const T = midLines[k];
      tressGeos.push(style.tressGeometry(T.pts, { phase: 9 + k * 2.3, across: 4, half: (t) => T.half * (0.04 + 0.96 * sm(t * 4.5)) * (1 - 0.35 * t), sway: (t) => 1 - sm((t - 0.8) / 0.2), roll: 1 }));
    }
    const hairNearMat = style.hair({ ink: INK.hair, sway: 3.2, waveLen: 170, rollLen: 430, strandCount: 7, calm: 1, grainScale: -7 });
    const hairNear = new THREE.Mesh(mergeGeometries(tressGeos), hairNearMat); hairNear.frustumCulled = false; hairNear.name = 'tresses';
    for (const g of tressGeos) g.dispose();
    scene.add(hairNear);
    await ctx.yield();
    {
      const fg = [];
      for (let k = 0; k < farLines.length; k++) {
        const T = farLines[k], pts = resample(T.pts, 14 + T.plane * 8);
        fg.push(style.tressGeometry(pts, { phase: 20 + k * 1.3, across: 2, half: (t) => T.half * (0.35 + 0.65 * sm(t * 5)) * (1 - 0.3 * sm((t - 0.8) * 5)), sway: 1, roll: T.plane === 0 ? 1 : 0 }));
      }
      const m = new THREE.Mesh(mergeGeometries(fg), style.hair({ ink: INK.hair, sway: 7, waveLen: 420, rollLen: 900, strandCount: 3 }));
      for (const g of fg) g.dispose();
      m.frustumCulled = false; m.name = 'far-tresses'; scene.add(m);
    }
    await ctx.yield();
    // our own: tress zero. Its centre line is the camera path, 3.4 m under the eye; nothing is drawn behind the tip.
    const S0 = -12;
    // It is drawn by distance ahead of its tip: a true taper under the eye, an S that keeps its size in the picture,
    // and far off a line that never thins below a hundredth of the frame until it reaches the roundel's foot.
    const sOf = (z) => uAtZ(z) * L;
    const hair0Mat = style.hair({ ink: INK.hair, sway: 7.4, waveLen: 380, rollLen: 300, strandCount: 7, calm: 1, grainScale: -7,
      ride: true, tipHalf: 0.8, tipWiden: 0.021, rideSway: 0.085, rideSwayMax: 14, farFloor: 0.0175, farS0: sOf(640), farS1: sOf(700) });
    {
      const pts = [];
      for (let d = S0; d <= L + 0.01; d += 2.4) {
        path.posAtDist(d, _c); path.tangentAtDist(d, _t); _s.crossVectors(_t, UP).normalize(); _n.crossVectors(_s, _t).normalize();
        pts.push(_c.clone().addScaledVector(_n, -RIDE_DROP));
      }
      const sNarrow = uAtZ(676) * L, sClimb = uAtZ(535) * L;   // it draws finer on the climb so the roundel shows past it
      const sGapA = sOf(236), sGapB = sOf(322), sRise = sOf(468), sCork = sOf(645);
      const swayAt = (s) => {                           // free on the down and over the river, held through the poplar gap and in the plait
        const gap = sm((s - sGapA + 45) / 45) * (1 - sm((s - sGapB) / 45));
        return (1 - 0.9 * gap) * (1 - 0.6 * sm((s - sRise) / 60)) * (1 - 0.125 * sm((s - sCork) / 50)) * (1 - sm((s - (L - 150)) / 80));
      };
      const g = style.tressGeometry(pts, { phase: (t, s) => { const o = Math.max(s - sRise + 40, 0); return 0.4 + (0.0127 * o * o) / (o + 60); }, across: 4, s0: S0, half: (t, s) => 4.2 - 1.9 * sm((s - sClimb) / 90) - 0.8 * sm((s - sNarrow) / 70), sway: (t, s) => swayAt(s), roll: (t, s) => (s < sRise - 30 ? 1 : 0) });   // it turns over on the down and the river; on the climb it is one clean line to the roundel
      const m = new THREE.Mesh(g, hair0Mat); m.frustumCulled = false; m.name = 'tress-zero'; scene.add(m);
      hair0Mat.uniforms.uTip.value.set(0, 1, 0);
    }
    await ctx.yield();
    // the volute: the last 12 m of our tress curling forward over us like the lip of a wave. Built in the rider's
    // frame (x port, y up, z ahead) and placed from the camera's world matrix every frame, position and heading both.
    // It is the only thing built in the rider's frame (the drift's box follows the eye too), and it is this one group: volute.visible hides all of it.
    const volute = new THREE.Group(); volute.name = 'volute'; volute.matrixAutoUpdate = false; scene.add(volute);
    // (hand round "whip") the lock's own reach, kept for its rest above the frame: for every point of its centre line, tip first, how far
    // ahead it stands (lockP) and a bound under its lower edge (lockQ: the centre's height less the whole half width) at a dip of 0.05 + 0.03 rad,
    // just over the deepest the slow sway reaches (the two amplitudes of fl in update, typed here a second time: change both together); lockHalf is the lock's width law, the one its geometry is built with.
    const lockP = [], lockQ = [], SWAY_C = Math.cos(0.05 + 0.03), SWAY_S = Math.sin(0.05 + 0.03), lockHalf = (t) => 0.07 + 0.78 * sm(t * 1.15);
    {
      // the lip: behind and above, coming forward over the head; it shows when the tip snaps
      const c = [[0, -RIDE_DROP, -1.5], [0, -3.4, -6.5], [0, -0.6, -11.4], [0, 3.8, -11.8], [0, 6.8, -7.2], [0, 7.3, -1], [0, 6.9, 3.6], [0, 6.5, 5.8]];
      const pts = resample(c.map((p) => V3(p[0], p[1], p[2])).reverse(), 0.6);
      const g1 = style.tressGeometry(pts, { phase: 0.4, across: 4, s0: 0, sway: 0, roll: 0, normal: (i) => { const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, pts.length - 1)]; return V3(0, b.z - a.z, a.y - b.y); }, half: (t) => 0.9 + 2.6 * sm(t * 1.6) });
      // its gold-lined end: one lock, a whiplash curl drawn in the picture plane; it whips into the top of frame when the tip snaps (see update)
      const wl = style.whiplash({ origin: V3(6.6, 7.6, 8.6), u: V3(-0.25, -1, 0), v: V3(1, -0.25, 0), len: 6.6, heading: -0.12, bend: 0.75, curl: 5.4, curlAt: 0.52, n: 44 });
      const g2 = style.tressGeometry(wl.reverse(), { phase: 0.4, across: 4, s0: 0, sway: 0, roll: 0, normal: V3(0, 0, -1), half: lockHalf });
      for (let i = 0; i < wl.length; i++) { const p = wl[i], h = lockHalf(i / (wl.length - 1)); lockP.push(p.y * SWAY_S + p.z * SWAY_C); lockQ.push(p.y * SWAY_C - p.z * SWAY_S - h); }
      const vm = style.hair({ ink: INK.hair, sway: 0, strandCount: 3, slide: 6 });
      const m1 = new THREE.Mesh(g1, vm), m2 = new THREE.Mesh(g2, vm); m1.frustumCulled = m2.frustumCulled = false; volute.add(m1, m2);
    }
    await ctx.yield();

    // ---- instancing helper: one drawn thing, many places (iA = seed, gold phase, tone shift, bend gain) -------
    const instanced = (geo, mat, list, name, hullMat) => {
      const n = list.length, im = new THREE.InstancedMesh(geo, mat, n), iA = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { im.setMatrixAt(i, list[i].m); iA.set(list[i].a, i * 4); }
      geo.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4));
      im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; im.name = name; scene.add(im);
      if (hullMat) { const h = new THREE.InstancedMesh(geo, hullMat, n); h.instanceMatrix = im.instanceMatrix; h.frustumCulled = false; h.name = name + '-keyline'; scene.add(h); }
      return im;
    };
    const _M = new THREE.Matrix4(), _Q = new THREE.Quaternion(), _E = new THREE.Euler();
    const place = (x, y, z, yaw, s, tx = 0, tz = 0, sy = s) => _M.compose(V3(x, y, z), _Q.setFromEuler(_E.set(tx, yaw, tz)), V3(s, sy, s)).clone();

    // ---- poppies: four-petalled rosettes, one petal darker, an olive hairline round each, a sage stem. Each is ONE
    //      quad (the petals, the hairline and the dark heart are drawn in the material) leaning toward the eye, so
    //      the down can carry tens of thousands: a field of flowers, densest beside our tress ------------------------
    {
      const b = style.batch(), fr = rng.fork('poppies'), fInk = INK.flower, H = 0.8, lean = 0.9;
      const stem = hour === 'blue' ? pal.sage : pal.sage2, cl = Math.cos(lean), sl = Math.sin(lean);
      for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {     // the face: up the quad is up and away, so it looks back at the eye
        b.pos.push(u * 0.5, H + v * 0.5 * sl, v * 0.5 * cl); b.nor.push(0, cl, -sl); b.ink.push(fInk.r, fInk.g, fInk.b); b.aux.push(u, v, 0, 0); b.bnd.push(0.55);
      }
      b.idx.push(0, 1, 2, 0, 2, 3);
      for (const [x, y, bn] of [[-0.05, 0, 0], [0.05, 0, 0], [0, H, 0.55]]) { b.pos.push(x, y, 0.03); b.nor.push(0, 1, 0); b.ink.push(stem.r, stem.g, stem.b); b.aux.push(99, 0.03, 0, 0); b.bnd.push(bn); }
      b.idx.push(4, 5, 6);
      // the path's x and height by z, tabulated once (the scatter asks twenty thousand times)
      const TZ0 = -30, TN = 400, tabX = new Float32Array(TN + 1), tabY = new Float32Array(TN + 1);
      for (let i = 0; i <= TN; i++) { path.pointAt(uAtZ(TZ0 + i * 2), _c); tabX[i] = _c.x; tabY[i] = _c.y; if (i % 80 === 79) await ctx.yield(); }
      const want = Math.round(21000 * detail * density * (season === 'september' ? 0.45 : 1)), list = [];
      for (let i = 0; i < want; i++) {
        const onHill = fr() < 0.16, z = onHill ? fr.range(505, 760) : fr.range(-25, 378);
        const off = (onHill ? 9 : 2.5) + (onHill ? 110 : 140) * Math.pow(fr(), 2.5), sgn = fr() < 0.5 ? -1 : 1;
        const yaw = fr.range(-0.75, 0.75), sc = fr.range(0.9, 1.45) * (fr() < 0.07 ? 1.45 : 1), ph = fr() * 6.28, ts = fr() < 0.2 ? 0.6 : 0;
        const ti = Math.min(TN, Math.max(0, Math.round((z - TZ0) / 2))), cx = z < 700 ? tabX[ti] : 0;
        const x = cx + sgn * off, y = ground(x, z);
        if (i % 500 === 499) await ctx.yield();
        if (y < 0.7 || tabY[ti] - y < 3.2) continue;
        list.push({ m: place(x, y - 0.03, z, yaw, sc, fr.range(-0.12, 0.12), fr.range(-0.12, 0.12)), a: [ph, 0, ts, 0.25] });
      }
      await ctx.yield();
      instanced(style.geometry(b), style.ink({ inst: true, bendy: true, rosette: true, grainScale: 3 }), list, 'poppies');
    }
    await ctx.yield();

    // ---- on the middle hills the flowers are flat patches with scalloped edges ----------------------------------
    {
      const b = style.batch(), fr = rng.fork('patches'), n = Math.round(54 * density * (season === 'september' ? 0.4 : 1));
      for (let k = 0; k < n; k++) {
        const z = fr.range(-40, 1150), x = (fr() < 0.5 ? -1 : 1) * fr.range(z > 520 ? 34 : 70, z > 520 ? 420 : 640), R = fr.range(13, 40) * (1 + Math.abs(x) / 700), lobes = fr.int(7, 12), el = fr.range(0.5, 0.85), rot = fr() * TAU;
        const gy = ground(x, z), tph = fr() * TAU;
        if (gy < 2 || Math.hypot(x, z - HZ) < 120 || (z > 330 && z < 520 && Math.abs(x) < 220)) continue;
        const base = b.pos.length / 3, RINGS = 3, SEGS = lobes * 4;
        for (let i = 0; i <= RINGS; i++) for (let j = 0; j < SEGS; j++) {
          const f = i / RINGS, a = (j / SEGS) * TAU, sc = 0.84 + 0.16 * Math.abs(Math.sin((a * lobes) / 2));
          const lx = Math.cos(a) * R * f * sc, lz = Math.sin(a) * R * f * sc * el, wx = x + lx * Math.cos(rot) - lz * Math.sin(rot), wz = z + lx * Math.sin(rot) + lz * Math.cos(rot);
          b.pos.push(wx, ground(wx, wz) + 0.25, wz); b.nor.push(0, 1, 0); b.ink.push(INK.flower.r, INK.flower.g, INK.flower.b);
          b.aux.push((1 - f) * R * 0.8 * el, 0.34, Math.sin(a + tph) * 1.2 * f + 0.1, 0); b.bnd.push(0);
          if (i < RINGS) { const p = base + i * SEGS + j, q = base + i * SEGS + ((j + 1) % SEGS); b.idx.push(p, q, p + SEGS, q, q + SEGS, p + SEGS); }
        }
      }
      const m = new THREE.Mesh(style.geometry(b), style.ink({ grainScale: 0.7, offset: -3, lineHold: 0.6 })); m.frustumCulled = false; m.name = 'poppy-patches'; scene.add(m);
    }
    await ctx.yield();

    // ---- the poplars: twenty-four flames in a row across the course. Each is one smooth flame bent in an S, with a
    //      whiplash hairline up each face (drawn in the flat, so it never stands off the form) and one hard-edged
    //      darker lock that climbs it like a flame, on the side away from the port sun ---------------------------------
    {
      const b = style.batch(), SIDES = 16, RINGS = 15, Hh = 32;
      const rad = (t) => 3.5 * Math.pow(Math.max(Math.sin(Math.PI * Math.pow(t, 0.62)), 0), 0.85) * (1 - 0.25 * t);
      const axis = (t) => -3.4 * Math.sin(t * 4.7 + 0.2) * Math.pow(t, 0.9) - 1.8 * sm((t - 0.78) / 0.22);   // an S, with the quick return at the tip
      const swirl = (t) => 0.5 * Math.sin(t * 4.4 + 0.5);              // the faces turn a little as they rise: the hairline is a curve
      for (let i = 0; i <= RINGS; i++) for (let j = 0; j < SIDES; j++) {
        const t = Math.pow(i / RINGS, 1.45), r = Math.max(rad(t), 0.015), a = (j / SIDES) * TAU + swirl(t), ax = axis(t) * 0.7071;
        b.pos.push(Math.cos(a) * r + ax, t * Hh, Math.sin(a) * r - ax); b.nor.push(Math.cos(a), 0.25, Math.sin(a)); b.ink.push(pal.teal.r, pal.teal.g, pal.teal.b);
        // hairlines on two faces (local +x and -z: the row is turned so one looks down the course and one at our tress)
        const dj = Math.min(Math.abs(((j + 8) % 16) - 8), Math.abs(j - 12));
        const lw = 0.05 + 0.2 * Math.sin(Math.PI * clamp01((t - 0.07) / 0.87)) * (1 - 0.5 * t);
        // the lock: centred on the side away from port, coming round toward the eye at the foot; a flame in outline
        const ac = Math.PI + 1.2 * (1 - t) + swirl(t), hw = 1.12 * Math.pow(Math.max(Math.sin(Math.PI * Math.pow(t, 0.8)), 0), 0.6);
        const tone = 0.5 + (Math.cos((j / SIDES) * TAU + swirl(t) - ac) - Math.cos(hw)) * 2.2 - (t < 0.04 || t > 0.93 ? 2 : 0);
        b.aux.push(dj * (TAU / SIDES) * r + 4 * clamp01((0.09 - t) / 0.09) + 4 * clamp01((t - 0.92) / 0.08), lw, tone, 0); b.bnd.push(t);
        if (i < RINGS) { const p = i * SIDES + j, q = i * SIDES + ((j + 1) % SIDES); b.idx.push(p, p + SIDES, q, q, p + SIDES, q + SIDES); }
      }
      const pr = rng.fork('poplars'), list = [], dx = -Math.cos(0.873), dz = Math.sin(0.873);
      for (let j = 0; j < 12; j++) for (const sg of [-1, 1]) {
        const kk = sg * (15.5 + 12.4 * j), x = kk * dx + pr.range(-0.8, 0.8), z = 290 + kk * dz * (j === 0 ? 0.3 : 1), s = pr.range(0.88, 1.12) * (j === 0 ? 1.08 : 1);
        if (ground(x, z) < 1) continue;
        // starboard trees stand as built; port trees are turned a quarter, so both show a hairline to the course and one to our tress, and their S mirrors
        list.push({ m: place(x, ground(x, z) - 0.15, z, (x > 0 ? Math.PI / 2 : 0) + (pr() - 0.5) * 0.36, s), a: [pr() * 6.28, 0, pr() < 0.3 ? 0.25 : 0, 2.6] });
      }
      instanced(style.geometry(b), style.ink({ inst: true, bendy: true, grainScale: -8, lineHold: 0.6 }), list, 'poplars', style.hull({ inst: true, bendy: true, weight: 0.0034 }));
    }
    await ctx.yield();

    // ---- the river: flat grey-teal that reflects nothing, with drawn darker reaches; cream ripple lines and olive
    //      weed under the surface, all streaming in the same S (their own vertex work, the style's own drawing) ----
    const RIPPLE_VERT = /* glsl */`
      attribute vec3 ink; attribute vec4 aux; attribute float bnd;
      uniform float uTime; uniform vec4 uPass;
      varying vec3 vInk; varying vec4 vAux; varying vec3 vWp; varying vec3 vG; varying vec3 vPh; varying float vDist;
      void main(){
        vec3 p = (modelMatrix * vec4(position, 1.0)).xyz;
        float cls = floor(bnd + 1e-3), weed = step(1.0, cls), along = step(2.0, cls), seed = fract(bnd);   // 0 ripple | 1 weed across the course | 2 weed streaming under our tress
        vec2 pd = p.xz - uPass.xy; float q = length(pd) / max(uPass.z * 1.6, 1.0); float near = exp(-q * q);
        float ph = mix(p.x, p.z, along) * mix(0.11, 0.05, weed) - uTime * mix(1.5, 0.7, weed) + seed * 40.0;
        float dS = (mix(0.55, 1.6, weed) + 2.6 * near) * sin(ph) + 0.4 * sin(ph * 2.3 + 1.0);
        p.z += dS * (1.0 - along);
        p.x += dS * along + 0.8 * sin(ph * 0.5 + seed * 9.0) * (1.0 - along);
        vInk = ink; vAux = aux; vWp = p; vG = vec3(0.0, 1.0, 0.0); vPh = vec3(0.0);
        vec4 mv = viewMatrix * vec4(p, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv;
      }`;
    {
      const b = style.batch(), wr = rng.fork('river');
      for (let i = 0; i <= 82; i++) for (let j = 0; j <= 4; j++) {
        const x = -820 + i * 20, z = riverZ(x) + (j / 4 - 0.5) * 132;
        b.pos.push(x, 0, z); b.nor.push(0, 1, 0); b.ink.push(INK.water.r, INK.water.g, INK.water.b);
        b.aux.push(99, 0.1, 1.5 * Math.sin(x * 0.017 + j * 1.9 + 0.5 * Math.sin(x * 0.03)) - 0.62, 0); b.bnd.push(0);
        if (i < 82 && j < 4) { const p = i * 5 + j, q = p + 5; b.idx.push(p, p + 1, q, p + 1, q + 1, q); }
      }
      const water = new THREE.Mesh(style.geometry(b), style.ink({ grainScale: -9, comb: true, combGain: 0, field: 2, fieldCell: 7.5 })); /* no strokes: its second tone is one scalloped reach, drawn in the flat */ water.frustumCulled = false; water.name = 'river'; scene.add(water);
      const pxRiver = path.pointAt(uAtZ(425), V3()).x;
      const rb = style.batch(), weedInk = pal.olive.clone().lerp(INK.water, 0.3);
      const nRip = Math.round(150 * detail), nWeed = Math.round(64 * detail);
      for (let k = 0; k < nRip + nWeed; k++) {
        const weed = k >= nRip, x0 = (wr() < (weed ? 0.75 : 0.6) ? wr.range(-150, 110) : wr.range(-520, 520)), len = weed ? wr.range(30, 66) : wr.range(8, 26), zo = wr.range(-33, 33), seed = wr() * 0.98, pts = [];
        if (weed && k % 3 === 0) {                      // weed streaming under our tress, in its S: a few long olive ribbons run with the course side by side, so the eye looks down their length
          const jA = Math.floor((k - nRip) / 3), side = jA % 2 ? 1 : -1, xa = pxRiver + side * (5.5 + 2.9 * Math.floor(jA / 2) + 1.5 * seed), za = riverZ(xa) - 62 + 16 * seed, la = 96 + 22 * seed;
          for (let i = 0; i <= 30; i++) { const t = i / 30; pts.push(V3(xa + (4.6 + 1.6 * seed) * Math.sin(t * 11.5 + 0.9 + 0.5 * seed + side * 0.3) * (0.45 + 0.55 * t), 0.05, za + t * la)); }
          style.ribbon(rb, pts, { half: (t) => (0.2 + 0.16 * seed) * Math.pow(Math.max(Math.sin(Math.PI * Math.pow(t, 0.75)), 0), 0.8), ink: weedInk, lw: 0, normal: UP, bnd: () => seed * 0.06 + 2, across: 1 });
          continue;
        }
        const xs = weed && Math.abs(x0 + len / 2 - pxRiver) < 100 ? (x0 + len / 2 > pxRiver ? 150 : -150) : 0;   // weed lying across the stream keeps clear of our crossing (there it runs with us)
        const n = weed ? 18 : 10, bow = (k % 2 ? 1 : -1) * (weed ? 0 : 0.2 + 0.25 * seed), sPh = seed * 9;
        for (let i = 0; i <= n; i++) {
          const t = i / n, x = x0 + xs + t * len;
          // a ripple is a crescent with its quick return at one end; a weed is a long S that widens and runs out to a point
          const dzz = weed ? 4.2 * Math.sin(t * 5.2 + sPh) * (0.35 + 0.65 * t) : bow * len * Math.sin(Math.PI * Math.pow(t, 1.7));
          pts.push(V3(x - (weed ? 0 : Math.abs(bow) * len * 0.5 * t * t), weed ? 0.04 : 0.09, riverZ(x) + zo + dzz));
        }
        style.ribbon(rb, pts, { half: (t) => (weed ? 1.15 : 0.27) * Math.pow(Math.max(Math.sin(Math.PI * Math.pow(t, 0.8)), 0), 0.8), ink: weed ? weedInk : pal.cream, lw: 0, normal: UP, bnd: () => seed + (weed ? 1 : 0), across: 1 });
      }
      const rip = new THREE.Mesh(style.geometry(rb), style.inkWith(RIPPLE_VERT, {}, { grainScale: 2 })); rip.frustumCulled = false; rip.name = 'ripples-weed'; scene.add(rip);
    }
    await ctx.yield();

    // ---- solids of the village and the bridge go in one batch (closed boxes and prisms: the hull closes them) ----
    const solid = style.batch();
    let quadFrom = null;                                 // a point inside the solid being built: faces are turned to look away from it
    const quad = (b, p0, p1, p2, p3, ink, tone, o = {}) => {       // p0..p3 counter-clockwise seen from outside
      let n = V3().subVectors(p1, p0).cross(V3().subVectors(p3, p0)).normalize(), e = o.e || [99, 99, 99, 99];
      if (n.lengthSq() < 0.5) n = V3().subVectors(p1, p0).cross(V3().subVectors(p2, p0)).normalize();
      const from = o.from || quadFrom;
      if (from && n.dot(V3().addVectors(p0, p2).multiplyScalar(0.5).sub(from)) < 0) { const t = p1; p1 = p3; p3 = t; n.negate(); e = [e[0], e[3], e[2], e[1]]; }
      const base = b.pos.length / 3;
      [p0, p1, p2, p3].forEach((p, i) => { b.pos.push(p.x, p.y, p.z); b.nor.push(n.x, n.y, n.z); b.ink.push(ink.r, ink.g, ink.b); b.aux.push(e[i], o.lw ?? 0.12, tone, o.gold || 0); b.bnd.push(0); });
      b.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };
    const box = (b, c, w, h, d, yaw, ink, toneSide = 0.9) => {      // c = centre of the base
      quadFrom = V3(c.x, c.y + h * 0.5, c.z);
      const cs = Math.cos(yaw), sn = Math.sin(yaw), P = (x, y, z) => V3(c.x + x * cs + z * sn, c.y + y, c.z - x * sn + z * cs), X = w / 2, Z = d / 2;
      quad(b, P(-X, 0, Z), P(X, 0, Z), P(X, h, Z), P(-X, h, Z), ink, 0); quad(b, P(X, 0, -Z), P(-X, 0, -Z), P(-X, h, -Z), P(X, h, -Z), ink, 0);
      quad(b, P(X, 0, Z), P(X, 0, -Z), P(X, h, -Z), P(X, h, Z), ink, toneSide); quad(b, P(-X, 0, -Z), P(-X, 0, Z), P(-X, h, Z), P(-X, h, -Z), ink, toneSide);
      quad(b, P(-X, h, Z), P(X, h, Z), P(X, h, -Z), P(-X, h, -Z), ink, 0);
      return P;
    };
    const chimneys = [];
    {
      const vrn = rng.fork('village'), wall = [pal.cream, pal.peach, pal.cream, pal.cream2];
      let cock = null;
      for (let k = 0; k < 14; k++) {
        const row = k % 3, x = -55 - k * 13.5 - vrn.range(0, 6) - (k > 8 ? 30 : 0), zb = riverZ(x) + 58 + row * 15 + vrn.range(0, 6), y = ground(x, zb) - 0.6;
        const w = vrn.range(7.5, 11), d = vrn.range(7, 9.5), h = vrn.range(4.6, 7.5) * (k === 4 ? 1.9 : 1), yaw = vrn.range(-0.35, 0.35), ink = wall[k % 4], rh = w * vrn.range(0.95, 1.35);
        const P = box(solid, V3(x, y, zb), w, h, d, yaw, ink), X = w / 2 + 0.7, Z = d / 2 + 0.6, sag = 0.12 * rh;
        quadFrom = V3(x, y + h + rh * 0.3, zb);
        // a steep roof with a whiplash sag in its slopes, one slope in the second tone
        const rf = (s0, s1, zz) => P(s0 * X + (s1 - s0) * X, 0, zz);
        for (const zs of [1, -1]) {
          const A = P(-X, h, zs * Z), B = P(X, h, zs * Z), M1 = P(-X * 0.42, h + rh * 0.5 - sag, zs * Z), M2 = P(X * 0.42, h + rh * 0.5 - sag, zs * Z), T = P(0, h + rh, zs * Z);
          if (zs > 0) { quad(solid, A, B, M2, M1, ink, 0); quad(solid, M1, M2, T, T, ink, 0); } else { quad(solid, B, A, M1, M2, ink, 0); quad(solid, M2, M1, T, T, ink, 0); }
        }
        for (const xs of [1, -1]) {
          const a0 = P(xs * X, h, Z), a1 = P(xs * X, h, -Z), m0 = P(xs * X * 0.42, h + rh * 0.5 - sag, Z), m1 = P(xs * X * 0.42, h + rh * 0.5 - sag, -Z), t0 = P(0, h + rh, Z), t1 = P(0, h + rh, -Z), tn = xs > 0 ? 0 : 0.9;
          if (xs > 0) { quad(solid, a0, a1, m1, m0, INK.flower === pal.cream ? pal.rose : pal.rose, tn); quad(solid, m0, m1, t1, t0, pal.rose, tn); }
          else { quad(solid, a1, a0, m0, m1, pal.rose, tn); quad(solid, m1, m0, t0, t1, pal.rose, tn); }
        }
        // a door and a window toward the river, drawn in the second tone of the wall with their own hairline
        const wy = h * 0.5, f = -d / 2 - 0.06; quadFrom = V3(x, y + 1, zb);
        quad(solid, P(1.2, wy - 0.9, f), P(-0.4, wy - 0.9, f), P(-0.4, wy + 1.1, f), P(1.2, wy + 1.1, f), pal.teal, 0, { e: [0, 0, 0, 0], lw: 0.5 });
        quad(solid, P(-1.6, 0, f), P(-3.0, 0, f), P(-3.0, 2.6, f), P(-1.6, 2.6, f), pal.olive, 0);
        const cx = w * 0.22, ch = h + rh * 0.62 + 2.2;
        const Ph = P; box(solid, Ph(cx, 0, 0).setY(y + h + rh * 0.3), 1.3, rh * 0.32 + 2.2, 1.3, yaw, ink);
        chimneys.push(P(cx, 0, 0).setY(y + ch));
        if (k === 4) cock = P(0, 0, 0).setY(y + h + rh);
      }
      // the bridge: cream, three sage arches, 90 m to port
      const bx = 90, zc = riverZ(bx), half = 52, yDeck = (z) => 7.2 + 2.4 * Math.cos(((z - zc) / half) * 1.35), soff = (z) => { const t = (z - zc + half - 5) / 31.4, f = t - Math.floor(t), a = Math.abs(f - 0.5) * 2; return t < 0 || t >= 3 || a > 0.86 ? -3 : 0.4 + 5.6 * Math.sqrt(Math.max(1 - (a / 0.86) * (a / 0.86), 0)); };
      const NS = 108, W = 2.6, halfT = half + 20, yTop = (z) => { const o = Math.abs(z - zc) - half; return o <= 0 ? yDeck(z) : yDeck(zc + half) - 7.4 * sm(o / 20) + 1.1 * Math.sin(Math.PI * clamp01(o / 20)); };
      for (const zs of [-1, 1]) { const ze = zc + zs * halfT; quadFrom = V3(bx, 0, ze - zs * 2); quad(solid, V3(bx - W, -3, ze), V3(bx + W, -3, ze), V3(bx + W, yTop(ze), ze), V3(bx - W, yTop(ze), ze), pal.cream, 0.9); }
      for (let i = 0; i < NS; i++) {
        const z0 = zc - halfT + (i / NS) * halfT * 2, z1 = zc - halfT + ((i + 1) / NS) * halfT * 2, t0 = yTop(z0), t1 = yTop(z1), s0 = soff(z0), s1 = soff(z1);
        const e = [s0 < 0 ? 99 : 0, s1 < 0 ? 99 : 0, s1 < 0 ? 99 : t1 - s1, s0 < 0 ? 99 : t0 - s0]; quadFrom = V3(bx, (t0 + Math.max(s0, 0)) * 0.5 + 0.2, (z0 + z1) * 0.5);
        quad(solid, V3(bx - W, s0, z1 * 0 + z0), V3(bx - W, s1, z1), V3(bx - W, t1, z1), V3(bx - W, t0, z0), pal.cream, 0, { e, lw: 0.42 });
        quad(solid, V3(bx + W, s1, z1), V3(bx + W, s0, z0), V3(bx + W, t0, z0), V3(bx + W, t1, z1), pal.cream, 0, { e: [e[1], e[0], e[3], e[2]], lw: 0.42 });
        quad(solid, V3(bx - W, t0, z0), V3(bx - W, t1, z1), V3(bx + W, t1, z1), V3(bx + W, t0, z0), pal.cream, 0.9);
        if (s0 >= 0 || s1 >= 0) quad(solid, V3(bx - W, Math.max(s0, 0), z0), V3(bx + W, Math.max(s0, 0), z0), V3(bx + W, Math.max(s1, 0), z1), V3(bx - W, Math.max(s1, 0), z1), pal.sage, 0.9);
      }
      const sg = style.geometry(solid), sm1 = new THREE.Mesh(sg, style.ink({ grainScale: 1.6, side: THREE.FrontSide })), sh = new THREE.Mesh(sg, style.hull({ weight: 0.0026 }));
      sm1.frustumCulled = sh.frustumCulled = false; sm1.name = 'village-bridge'; scene.add(sh, sm1);
      // the weathercock: gold, on the tallest roof; it swings to point along the passing hair
      const wb = style.batch(), wc = V3(0, 0, 0);
      style.ribbon(wb, [V3(0, 0, 0), V3(0, 3.4, 0)], { half: 0.09, ink: pal.gold, gold: 2, lw: 0, normal: V3(0, 0, 1) });
      style.ribbon(wb, style.whiplash({ origin: V3(-2.6, 3.4, 0), u: V3(1, 0, 0), v: V3(0, 1, 0), len: 5.6, heading: 0, bend: 0.5, curl: 2.6, curlAt: 0.66, n: 16 }), { half: (t) => 0.5 * Math.sin(Math.PI * Math.min(t * 1.1 + 0.08, 1)) + 0.04, ink: pal.gold, gold: 2, lw: 0.07, normal: V3(0, 0, 1) });
      const cockMesh = new THREE.Mesh(style.geometry(wb), style.ink({ grainScale: 3 })); cockMesh.position.copy(cock || wc); cockMesh.name = 'weathercock'; scene.add(cockMesh);
      const uVillage = uAtZ(430);
      tick.push((dt, time, camera, u) => { const k = sm((u - uVillage + 0.07) / 0.1); cockMesh.rotation.y = -2.2 + 3.6 * k + 0.22 * Math.sin(time * 1.3) * (1 - 0.6 * k) + 0.5 * Math.exp(-(((u - uVillage) * 40) ** 2)) * Math.sin(time * 5); });
    }
    await ctx.yield();

    // ---- chimney smoke: one cream ribbon with a hairline from each chimney, leaning into the hair's curve --------
    {
      const b = style.batch();
      const pts = style.whiplash({ origin: V3(0, 0, 0), u: V3(0, 1, 0), v: V3(0.8, 0, -0.6), len: 17, heading: 0.1, bend: 0.5, curl: 3.4, curlAt: 0.62, n: 18 });
      style.ribbon(b, pts, { half: (t) => 0.25 + 1.5 * Math.sin(Math.PI * Math.pow(t, 0.8)) * (0.4 + 0.6 * t), ink: pal.cream, lw: 0.1, normal: V3(0.6, 0, 0.8), tone: (a, t) => (a > 0.25 ? 1 : 0), bnd: (t) => t });
      instanced(style.geometry(b), style.ink({ inst: true, bendy: true, grainScale: 1.2, lineHold: 0.5 }), chimneys.map((c, i) => ({ m: place(c.x, c.y, c.z, 0.4 * Math.sin(i * 2.1), 0.8 + 0.3 * Math.sin(i * 1.3) ** 2), a: [i * 1.7, 0, 0, 3.2] })), 'smoke');
    }

    // ---- lilies on the hill (denser toward the roundel) and irises on the banks: one drawn plant ----------------
    {
      const b = style.batch(), bn = (y) => clamp01(y / 4.6);
      style.ribbon(b, [V3(0, 0, 0), V3(0.12, 1.3, 0), V3(-0.05, 2.6, 0), V3(0.05, 3.5, 0)], { half: (t) => 0.1 - 0.03 * t, ink: pal.teal, lw: 0, across: 1, normal: V3(0, 0, 1), bnd: (t) => bn(t * 3.5) });
      style.ribbon(b, style.whiplash({ origin: V3(0, 0.5, 0), u: UP, v: V3(0.8, 0, 0.6), len: 2.7, n: 5, heading: 0.5, bend: 0.5, curl: 1.5 }), { half: (t) => 0.24 * Math.sin(Math.PI * Math.min(t * 1.2 + 0.1, 1)) + 0.01, ink: pal.teal, lw: 0.04, tone: (a) => (a > 0 ? 1 : 0), normal: V3(-0.5, 0.6, -0.4), bnd: (t) => bn(0.5 + t * 1.4) });
      for (let j = 0; j < 4; j++) {
        const a = (j / 4) * TAU + 0.5, v = V3(Math.cos(a), 0, Math.sin(a));
        const pts = style.whiplash({ origin: V3(0.05, 3.4, 0), u: UP, v, len: 2.0, n: 4, heading: 0.3, bend: 0.3, curl: 1.9, curlAt: 0.5 });
        style.ribbon(b, pts, { half: (t) => 0.44 * Math.sin(Math.PI * Math.min(t * 0.9 + 0.12, 1)) + 0.01, ink: pal.cream, lw: 0.055, tone: (a2) => (j % 2 ? (a2 > 0.1 ? 1 : 0) : 0), swell: 2, normal: V3().copy(UP).multiplyScalar(0.62).addScaledVector(v, -0.78), bnd: () => 1 });
      }
      for (let j = 0; j < 2; j++) { const v = V3(Math.cos(j * 2.6 + 1), 0, Math.sin(j * 2.6 + 1)); style.ribbon(b, [V3(0.05, 3.7, 0), V3(0.05, 4.6, 0).addScaledVector(v, 0.35), V3(0.05, 5.2, 0).addScaledVector(v, 0.8)], { half: (t) => 0.05 + 0.1 * t * t, ink: pal.gold, gold: 1, lw: 0, across: 1, normal: V3(-v.z, 0, v.x), bnd: () => 1 }); }
      const lr = rng.fork('hill-lilies'), list = [], want = Math.round(340 * detail * density);
      for (let i = 0; i < want * 3 && list.length < want; i++) {
        const z = 520 + 330 * Math.pow(lr(), 0.75), off = 7.5 + 95 * Math.pow(lr(), 1.7), sgn = lr() < 0.5 ? -1 : 1, s = lr.range(1.15, 1.9), yaw = lr() * TAU, ph = lr() * 6.28;
        const px = path.nearestXZ(0, z), cx = z < 700 ? path.pointAt(px.u, _c).x : 0, x = cx + sgn * off + 5 * Math.sin(z * 0.11), y = ground(x, z);
        if (lr() > 0.25 + 0.75 * sm((z - 520) / 300)) continue;
        if (z < 700 && path.distanceTo(x, y + 4 * s, z) < 6.5) continue;
        list.push({ m: place(x, y - 0.1, z, yaw, s, lr.range(-0.08, 0.08), lr.range(-0.08, 0.08)), a: [ph, ph * 1.7, 0, 0.8] });
      }
      for (let i = 0; i < Math.round(190 * detail); i++) {              // irises: the same plant, small, along both banks
        const x = (lr() < 0.7 ? lr.range(-70, 70) : lr.range(-260, 200)), bank = lr() < 0.5 ? -1 : 1, z = riverZ(x) + bank * lr.range(49, 60), y = ground(x, z);
        if (y < -0.4 || y > 4) continue;
        list.push({ m: place(x, Math.max(y, 0) - 0.15, z, lr() * TAU, lr.range(0.5, 0.78)), a: [lr() * 6.28, lr() * 6.28, 0, 0.5] });
      }
      instanced(style.geometry(b), style.ink({ inst: true, bendy: true, grainScale: 3 }), list, 'lilies-irises');
    }
    await ctx.yield();

    // ---- the swans (or herons): cream cut-outs with a heavy olive keyline; their necks turn from one S to its
    //      mirror as our tress crosses above (the vertex shader reads how far the tip has passed each bird) --------
    const NECK_VERT = /* glsl */`
      attribute vec3 ink; attribute vec4 aux; attribute float bnd; attribute vec4 iA;
      uniform float uTime; uniform vec4 uPass; uniform vec2 uBendDir;
      varying vec3 vInk; varying vec4 vAux; varying vec3 vWp; varying vec3 vG; varying vec3 vPh; varying float vDist;
      void main(){
        mat4 m = modelMatrix * instanceMatrix;
        vec4 wp = m * vec4(position, 1.0);
        vec3 fw = m[0].xyz, sd = m[2].xyz;
        float along = dot(m[3].xz - uPass.xy, uBendDir);                 // < 0 while the tip is still coming, > 0 once it has passed
        float A = along / (abs(along) + 7.0);
        float t = bnd, S = sin(t * 4.6) * (0.35 + 0.65 * t);
        wp.xyz += sd * (A * iA.w * S + 0.12 * sin(uTime * 0.9 + iA.x) * t) + fw * (0.18 * iA.w * (1.0 - A * A) * t);
        wp.xyz += fw * (1.6 * sin(uTime * 0.16 + iA.x)) ;                 // gliding
        wp.y += 0.05 * sin(uTime * 1.1 + iA.x * 3.0);
        vInk = ink; vAux = aux; vWp = wp.xyz; vG = vec3(0.0, 1.0, 0.0); vPh = vec3(iA.x, iA.y, 0.0);
        vec4 mv = viewMatrix * wp; vDist = length(mv.xyz); gl_Position = projectionMatrix * mv;
      }`;
    {
      const b = style.batch(), heron = wader === 'heron', body = pal.cream, wingInk = heron ? pal.teal : pal.cream, NZ = V3(0, 0, 1);
      const ringOf = (fn, n) => { const r = []; for (let i = 0; i < n; i++) r.push(fn((i / n) * TAU)); return r; };
      // side profile and plan of the body: two crossed cut-outs
      style.fan(b, V3(-0.2, 0.75, 0), ringOf((a) => V3(-0.35 + 2.0 * Math.cos(a) - 0.5 * Math.max(0, -Math.cos(a)) ** 3, 0.5 + 0.52 * Math.sin(a) + 0.6 * Math.max(0, -Math.cos(a)) ** 4, 0), 18), { ink: body, lw: 0.13, inset: 0.7, tone: (k) => (k > 9 ? 1.5 : -0.5), toneC: 0.3, normal: NZ });
      style.fan(b, V3(-0.2, 1.12, 0), ringOf((a) => V3(-0.35 + 2.1 * Math.cos(a) - 0.4 * Math.max(0, -Math.cos(a)) ** 3, 1.0 + 0.1 * Math.max(0, -Math.cos(a)), 1.0 * Math.sin(a) * (0.72 + 0.28 * Math.cos(a))), 16), { ink: body, lw: 0.14, inset: 0.85, tone: (k) => (k > 8 ? 1.5 : -0.5), toneC: 0.2, normal: UP });
      for (const zs of [-1, 1]) style.fan(b, V3(-0.7, 1.3, zs * 0.5), ringOf((a) => V3(-0.8 + 1.45 * Math.cos(a) - 0.7 * Math.max(0, -Math.cos(a)) ** 2, 1.22 + 0.18 * Math.sin(a) + 0.5 * Math.max(0, -Math.cos(a)) ** 3, zs * (0.5 + 0.3 * Math.sin(a))), 12), { ink: wingInk, lw: 0.09, inset: 0.3, tone: (k) => (k > 6 ? 1.5 : -0.5), normal: V3(0, 1, zs * 0.3) });
      const neck = new THREE.CatmullRomCurve3([[1.3, 0.8], [1.95, 1.35], [2.05, 2.05], [1.6, 2.65], [1.38, 3.15], [1.62, 3.6], [2.1, 3.68]].map((p) => V3(p[0], p[1] * (heron ? 1.25 : 1), 0))).getPoints(14);
      for (const nrm of [NZ, V3(1, 0, 0)]) style.ribbon(b, neck, { half: (t) => 0.36 - 0.13 * t, ink: body, lw: 0.1, normal: nrm, bnd: (t) => t });
      const hd = neck[neck.length - 1];
      style.fan(b, hd.clone(), ringOf((a) => V3(hd.x + 0.42 * Math.cos(a), hd.y + 0.3 * Math.sin(a), 0), 10), { ink: body, lw: 0.09, inset: 0.3, normal: NZ, bnd: 1 });
      style.ribbon(b, [V3(hd.x + 0.3, hd.y + 0.02, 0), V3(hd.x + 0.75, hd.y - 0.08, 0), V3(hd.x + (heron ? 1.7 : 1.15), hd.y - 0.24, 0)], { half: (t) => 0.15 * (1 - t) + 0.02, ink: heron ? pal.gold : pal.rose, lw: 0.04, normal: NZ, bnd: () => 1 });
      const sr = rng.fork('swans'), list = [], uR = uAtZ(425), pr = path.pointAt(uR, V3());
      for (let i = 0; i < 9; i++) {
        const near = i < 3, x = near ? pr.x + 11.5 + i * 2.6 : (sr() < 0.5 ? -1 : 1) * sr.range(20, 130), z = near ? 404 + i * 17 + sr.range(-3, 3) : riverZ(x) + sr.range(-28, 28);
        list.push({ m: place(x, heron ? 0.9 : -0.25, z, near ? -Math.PI / 2 + sr.range(-0.5, 0.5) : sr() * TAU, sr.range(1.0, 1.25)), a: [sr() * 6.28, 0, 0, (sr() < 0.5 ? -1 : 1) * sr.range(0.8, 1.15)] });
      }
      instanced(style.geometry(b), style.inkWith(NECK_VERT, {}, { grainScale: 2.4, lineHold: 0.7 }), list, wader);
    }
    // ---- the punt (or a small sailing barge) moored on the far bank, rocking ------------------------------------
    {
      const b = style.batch(), boatG = new THREE.Group(), Lb = boat === 'punt' ? 5.2 : 6.4, Wb = boat === 'punt' ? 1.2 : 1.9;
      quadFrom = V3(0, 0.3, 0);
      const st = [[-Lb, 0.55, 0.35], [-Lb * 0.6, 0.0, 1], [Lb * 0.6, 0.0, 1], [Lb, 0.7, 0.3]];
      for (let i = 0; i < 3; i++) { const [x0, y0, w0] = st[i], [x1, y1, w1] = st[i + 1];
        for (const zs of [1, -1]) quad(b, V3(x0, y0 - 0.1, zs * Wb * w0 * 0.8), V3(x1, y1 - 0.1, zs * Wb * w1 * 0.8), V3(x1, 0.85, zs * Wb * w1), V3(x0, 0.85, zs * Wb * w0), pal.rose, zs > 0 ? 0 : 0.9);
        quad(b, V3(x0, 0.6, -Wb * w0), V3(x1, 0.6, -Wb * w1), V3(x1, 0.6, Wb * w1), V3(x0, 0.6, Wb * w0), pal.cream2, 0, { from: V3(0, -5, 0) }); }
      if (boat === 'barge') { style.ribbon(b, [V3(0.5, 0.6, 0), V3(0.5, 8.5, 0)], { half: 0.12, ink: pal.olive, lw: 0, normal: V3(0, 0, 1) });
        style.ribbon(b, style.whiplash({ origin: V3(0.7, 8.2, 0), u: V3(0, -1, 0), v: V3(-1, 0, 0), len: 7.2, heading: 0.25, bend: 0.5, curl: 0.6, n: 10 }), { half: (t) => 2.6 * Math.sin(Math.PI * Math.min(t + 0.08, 1)) ** 0.6 + 0.05, ink: pal.cream, lw: 0.1, tone: (a) => (a < -0.2 ? 1 : 0), normal: V3(0, 0, 1) }); }
      const g = style.geometry(b), bm = new THREE.Mesh(g, style.ink({ grainScale: 2 })), bh = new THREE.Mesh(g, style.hull({ weight: 0.0026 }));
      boatG.add(bh, bm); const bx0 = -30, bz0 = riverZ(-30) + 27; boatG.position.set(bx0, 0.05, bz0); boatG.rotation.y = 0.35; boatG.name = boat; scene.add(boatG);
      tick.push((dt, time) => { boatG.rotation.z = 0.07 * Math.sin(time * 0.9); boatG.rotation.x = 0.05 * Math.sin(time * 0.63 + 1); boatG.position.y = 0.05 + 0.08 * Math.sin(time * 0.8); });
    }
    await ctx.yield();

    // ---- the birds beside us: three groups, one pacing the eye off the port side; each track is a small S --------
    const VARY = /* glsl */`varying vec3 vInk; varying vec4 vAux; varying vec3 vWp; varying vec3 vG; varying vec3 vPh; varying float vDist;`;
    const flock = [V3(), V3(), V3()], headU = new THREE.Vector2(0, 1), eyeU = V3();
    {
      const BIRD_VERT = /* glsl */`
        attribute vec3 ink; attribute vec4 aux; attribute float bnd; attribute vec4 iA;   // iA: seed, group, flap rate, size
        uniform float uTime; uniform vec3 uFlock[3]; uniform vec2 uHead;
        ${VARY}
        void main(){
          vec3 off = instanceMatrix[3].xyz;
          vec3 c = iA.y < 0.5 ? uFlock[0] : (iA.y < 1.5 ? uFlock[1] : uFlock[2]);
          vec3 fwd = vec3(uHead.x, 0.0, uHead.y), port = vec3(uHead.y, 0.0, -uHead.x);
          float t = uTime, s = iA.x;
          float sx = 1.5 * sin(t * 0.9 + s * 5.0), sy = 0.6 * sin(t * 1.3 + s * 3.0), sz = 1.3 * sin(t * 0.6 + s * 7.0);
          float bank = 0.5 * cos(t * 0.9 + s * 5.0);
          float burst = smoothstep(-0.3, 0.5, sin(t * 0.8 + s * 9.0));
          float fl = sin(t * iA.z + s * 20.0) * (0.25 + 0.75 * burst);
          vec3 p = position * iA.w;
          p.y += bnd * iA.w * 0.75 * fl - abs(p.x) * 0.12;
          float cb = cos(bank), sb = sin(bank);
          p = vec3(p.x * cb - p.y * sb, p.x * sb + p.y * cb, p.z);
          vec3 w = c + port * (off.x + sx + p.x) + vec3(0.0, 1.0, 0.0) * (off.y + sy + p.y) + fwd * (off.z + sz + p.z);
          vInk = ink; vAux = aux; vWp = w; vG = vec3(0.0, 1.0, 0.0); vPh = vec3(s, s, 0.0);
          vec4 mv = viewMatrix * vec4(w, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv;
        }`;
      const b = style.batch(), wing = birds === 'dove' ? pal.cream : pal.teal, breast = birds === 'dove' ? pal.cream2 : pal.cream, fly = birds === 'dragonfly';
      const span = [], NW = 12;
      for (let i = 0; i <= NW; i++) { const x = -1.15 + (2.3 * i) / NW, ax = Math.abs(x) / 1.15; span.push(V3(x, 0, fly ? 0.25 : 0.38 - 0.95 * Math.pow(ax, 1.35))); }
      style.ribbon(b, span, { half: (t) => { const ax = Math.abs(t * 2 - 1); return (fly ? 0.3 : 0.24) * (1 - Math.pow(ax, fly ? 4 : 1.4)) + 0.02; }, ink: fly ? pal.cream : wing, lw: 0.045, normal: UP, tone: (a) => (a < -0.3 ? 1 : 0), bnd: (t) => Math.abs(t * 2 - 1) });
      const ring = []; for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; ring.push(V3(0.14 * Math.sin(a), -0.03, (fly ? -0.5 : 0.08) + (fly ? 1.0 : 0.46) * Math.cos(a))); }
      style.fan(b, V3(0, -0.03, fly ? -0.5 : 0.08), ring, { ink: fly ? pal.teal : breast, lw: 0.04, inset: 0.14, normal: UP });
      if (!fly) for (const xs of [-1, 1]) style.ribbon(b, [V3(0, 0, -0.3), V3(xs * 0.1, 0, -0.62), V3(xs * 0.3, 0, -1.02)], { half: (t) => 0.075 * (1 - t) + 0.015, ink: wing, lw: 0, normal: UP });
      const br = rng.fork('birds'), list = [];
      for (let i = 0; i < 40; i++) {
        const g = i < 14 ? 0 : i < 28 ? 1 : 2, j = g === 0 ? i : g === 1 ? i - 14 : i - 28;
        const m = new THREE.Matrix4().setPosition(br.range(-3.2, 3.2) + (j % 2) * 1.5, br.range(-1.6, 2.2), -j * 1.9 + br.range(-1, 1));
        list.push({ m, a: [br(), g, fly ? 24 : br.range(7, 10), (fly ? 0.9 : 0.92) * br.range(0.9, 1.15)] });
      }
      instanced(style.geometry(b), style.inkWith(BIRD_VERT, { uFlock: { value: flock }, uHead: { value: headU } }, { grainScale: 3, lineHold: 0.6 }), list, birds);
    }
    // (the snaps and their envelope stand here, above the butterflies: their homes are laid against the same law update flies)
    const SNAPS = [6, 12.2, 18.4, 24.4, 30.6, 36.4].map((t) => t / duration);   // the tip snaps about every six seconds (keyed to u)
    const env = (x, a, b) => Math.exp(-((x < 0 ? x / a : x / b) ** 2));         // eased rise (a) and decay (b)
    // ---- three hundred cream butterflies: they lift out of the flowers in a line under the tress and settle again --
    {
      const FLUTTER_VERT = /* glsl */`
        attribute vec3 ink; attribute vec4 aux; attribute float bnd; attribute vec4 iA;
        uniform float uTime; uniform vec4 uPass; uniform vec4 uRing; uniform vec2 uBendDir; uniform vec3 uEye;
        ${VARY}
        void main(){
          mat4 m = modelMatrix * instanceMatrix; vec3 root = m[3].xyz;
          float ahead = -dot(root.xz - uPass.xy, uBendDir);                // metres ahead of the tress tip
          float q = (ahead - 24.0) / 17.0, lift = exp(-q * q);
          vec2 rd = root.xz - uRing.xy; float rq = (length(rd) - uRing.z) / 9.0;
          lift = max(lift, exp(-rq * rq) * min(uRing.w, 1.0));
          float s = iA.x, t = uTime;
          float ang = mix(1.2, 0.5, lift) + (0.12 + 0.9 * lift) * sin(t * (4.0 + 10.0 * lift) + s * 30.0);
          vec3 p = position * (0.35 + 0.65 * smoothstep(3.0, 13.0, distance(root + vec3(0.0, 3.0 * lift, 0.0), uEye))); float sg = p.x < 0.0 ? -1.0 : 1.0, ax = abs(p.x);
          p = vec3(ax * cos(ang) * sg, p.y + ax * sin(ang), p.z);
          vec4 wp = m * vec4(p, 1.0);
          wp.y += lift * (1.2 + 4.2 * fract(s * 7.3)) + 0.25 * lift * sin(t * 3.1 + s * 11.0);
          wp.xz += lift * 1.8 * vec2(sin(t * 1.3 + s * 40.0), cos(t * 1.1 + s * 17.0));
          vInk = ink; vAux = aux; vWp = wp.xyz; vG = vec3(0.0, 1.0, 0.0); vPh = vec3(s, s, 0.0);
          vec4 mv = viewMatrix * wp; vDist = length(mv.xyz); gl_Position = projectionMatrix * mv;
        }`;
      const b = style.batch(), wInk = pal.cream;
      for (const xs of [-1, 1]) {
        const ring = [[0.03, 0.12], [0.26, 0.6], [0.6, 0.64], [0.72, 0.24], [0.4, 0.02], [0.58, -0.3], [0.34, -0.52], [0.04, -0.2]].map((p) => V3(xs * p[0], 0, p[1]));
        style.fan(b, V3(xs * 0.3, 0, 0.04), ring, { ink: wInk, lw: 0.035, inset: 0.2, tone: (k) => (k > 4 ? 1.4 : -0.4), normal: UP });
      }
      // No butterfly rises into the course. A butterfly is not its home: the shader above lifts it by `lift`, a law of the lens's
      // place alone (the pass ahead of the tip, and the ring each snap sends out, both keyed to u), up to 5.4 m over its home, and
      // there it wanders in a box 1.8 m to each side and a quarter metre up and down by the clock. So at each place of the lens
      // (LNS: every half metre of the course, with the heading and the ring update would set there) a home's box of wander is
      // known whatever the clock. A home whose box comes nearer the lens than 2.5 m and the wings' reach, at any of those
      // half-metre places, is dealt half a metre further out on the side its offset was dealt on, and again, until it is clear
      // there. Between two places the least falls a little under 2.5 m where a ring's window opens (a reader's exact count: 2.37 m
      // at the worst home that can be dealt), so 2.5 m is asked here to keep 2.0 m. (After the first and the second snap the
      // ring runs up the course just ahead of the lens and lifted the nearest butterflies to eye height in its way.)
      // Every draw is made as before and in the same order. FLUTTER_VERT, flyClear and the ring's law as typed in LNS below and
      // in update (window, radius, amplitude) must change together.
      await ctx.yield();
      const gB = style.geometry(b), pB = gB.attributes.position; let rB = 0; for (let j = 0; j < pB.count; j++) rB = Math.max(rB, Math.hypot(pB.getX(j), pB.getY(j), pB.getZ(j)));
      const LNS = [], ZB = new Map(); { const q = V3(), tq = V3(), c0 = path.pointAt(0, V3()), cs = SNAPS.map((su) => path.pointAt(su, V3()));   // (ZB: the places by bands of 8 m of z, so a home asks only the bands it can reach)
        for (let d = 0; d <= L; d += 0.5) { const u = d / L; path.posAtDist(d, q); path.tangentAtDist(d, tq); const hl = Math.hypot(tq.x, tq.z) || 1;
          let rR = -1000, rA = 0, rc = c0; SNAPS.forEach((su, k) => { const du = (u - su) * duration; if (du > -0.05 && du < 3.2) { rR = 4 + du * 30; rA = 2.6 * env(du - 0.2, 0.25, 1.8); rc = cs[k]; } });
          const zb = Math.floor(q.z / 8); if (!ZB.has(zb)) ZB.set(zb, []); ZB.get(zb).push(LNS.length);
          LNS.push(q.x, q.y, q.z, tq.x / hl, tq.z / hl, rc.x, rc.z, rR, Math.min(rA, 1)); } }
      await ctx.yield();
      const flyClear = (x, y, z, sc, f) => { const far = 2.5 + rB * sc + 1.8;
        for (let zb = Math.floor((z - far) / 8), z1 = Math.floor((z + far) / 8); zb <= z1; zb++) for (const j of ZB.get(zb) || []) { const dx = LNS[j] - x, dz = LNS[j + 2] - z; if (Math.abs(dx) > far || Math.abs(dz) > far) continue;
          const q = (-(dx * LNS[j + 3] + dz * LNS[j + 4]) - 24) / 17, rq = (Math.hypot(x - LNS[j + 5], z - LNS[j + 6]) - LNS[j + 7]) / 9, lift = Math.max(Math.exp(-q * q), Math.exp(-rq * rq) * LNS[j + 8]);
          const e = Math.min(Math.max((Math.hypot(dx, LNS[j + 1] - y - 3 * lift, dz) - 3) / 10, 0), 1), need = 2.5 + rB * sc * (0.35 + 0.65 * e * e * (3 - 2 * e));
          const ax = Math.max(Math.abs(dx) - 1.8 * lift, 0), ay = Math.max(Math.abs(LNS[j + 1] - y - lift * (1.2 + 4.2 * f)) - 0.25 * lift, 0), az = Math.max(Math.abs(dz) - 1.8 * lift, 0);
          if (ax * ax + ay * ay + az * az < need * need) return false; }
        return true; };
      const fr = rng.fork('butterflies'), list = [], n = Math.round(300 * detail);
      for (let i = 0; i < n; i++) {
        const z = fr.range(8, 372), px = path.nearestXZ(0, z), cx = path.pointAt(px.u, _c).x, off = fr.range(-13, 13) * (0.4 + 0.6 * fr()), yaw = fr() * TAU, sc = fr.range(0.55, 0.85), s = fr();
        const f7 = Math.fround(Math.fround(s) * Math.fround(7.3)) % 1, fs = f7 < 0.001 || f7 > 0.999 ? [0, 1] : [f7], side = off < 0 ? -1 : 1;   // (where the shader's fract stands on its seam, both ends are kept clear)
        let x = cx + off, y = Math.max(ground(x, z), 0) + 0.85;
        while (Math.abs(x - cx) < 40 && !fs.every((f) => flyClear(x, y, z, sc, f))) { x += 0.5 * side; y = Math.max(ground(x, z), 0) + 0.85; }
        list.push({ m: place(x, y, z, yaw, sc), a: [s, 0, 0, 0] });
        if (i % 60 === 59) await ctx.yield();
      }
      instanced(gB, style.inkWith(FLUTTER_VERT, { uEye: { value: eyeU } }, { grainScale: 3, lineHold: 0.3 }), list, 'butterflies');
    }
    // ---- the season in the air: September's gold leaves riding along with the hair, April's almond blossom ------
    if (season !== 'june') {
      const DRIFT_VERT = /* glsl */`
        attribute vec3 ink; attribute vec4 aux; attribute float bnd; attribute vec4 iA;
        uniform float uTime; uniform vec3 uEye;
        ${VARY}
        void main(){
          vec3 base = instanceMatrix[3].xyz, B = vec3(140.0, 46.0, 140.0);
          float s = iA.x, t = uTime;
          vec3 d = vec3(3.0 * sin(t * 0.31 + s * 9.0), -t * (0.7 + fract(s * 3.0)), t * (7.0 + 4.0 * fract(s * 5.0)));
          vec3 rel = mod(base + d - uEye + 0.5 * B, B) - 0.5 * B;
          float a = t * (1.2 + 2.0 * fract(s * 13.0)) + s * 40.0, ca = cos(a), sa = sin(a);
          vec3 p = position * iA.w * smoothstep(3.0, 16.0, length(rel)); p = vec3(p.x * ca - p.y * sa, p.x * sa + p.y * ca, p.z);
          float cb = cos(a * 0.37), sb = sin(a * 0.37); p = vec3(p.x, p.y * cb - p.z * sb, p.y * sb + p.z * cb);
          vec3 w = uEye + rel + p;
          vInk = ink; vAux = aux; vWp = w; vG = normalize(vec3(sa * cb, ca * cb, sb) + vec3(0.0, 1e-3, 0.0)); vPh = vec3(s, s * 40.0, 0.0);
          vec4 mv = viewMatrix * vec4(w, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv;
        }`;
      const b = style.batch(), sept = season === 'september';
      style.ribbon(b, [V3(-0.42, 0, 0), V3(-0.1, 0.05, 0), V3(0.2, 0, 0), V3(0.42, -0.06, 0)], { half: (t) => 0.2 * Math.sin(Math.PI * Math.min(t + 0.06, 1)) + 0.01, ink: sept ? pal.gold : pal.cream, gold: sept ? 2 : 0, lw: sept ? 0 : 0.03, normal: V3(0, 0, 1) });
      const fr = rng.fork('drift'), list = [], n = Math.round(420 * detail * density);
      for (let i = 0; i < n; i++) list.push({ m: new THREE.Matrix4().setPosition(fr() * 140, fr() * 46, fr() * 140), a: [fr(), 0, 0, fr.range(0.7, 1.5)] });
      instanced(style.geometry(b), style.inkWith(DRIFT_VERT, { uEye: { value: eyeU } }, { grainScale: 3 }), list, sept ? 'gold-leaves' : 'blossom');
    }
    tick.push((dt, time, camera, u, d) => {
      path.posAtDist(d, _c); path.tangentAtDist(d, _t);
      const hl = Math.hypot(_t.x, _t.z) || 1; headU.set(_t.x / hl, _t.z / hl);
      const px = headU.y, pz = -headU.x;                                 // port
      flock[0].set(_c.x + px * 7.5 + headU.x * 19, _c.y - 2.6, _c.z + pz * 7.5 + headU.y * 19);
      path.posAtDist(Math.min(d + 60, L), _c); flock[1].set(_c.x - px * 16, _c.y + 9, _c.z - pz * 16);
      path.posAtDist(Math.min(d + 130, L), _c); flock[2].set(_c.x + px * 30 * Math.sin(time * 0.12), _c.y + 16, _c.z + pz * 30 * Math.sin(time * 0.12));
      eyeU.setFromMatrixPosition(camera.matrixWorld);
    });
    await ctx.yield();

    // ---- THE RARE EVENT, the letting-down: at 30 s the two pins slide out, the coil lets go, and the hair spills
    //      back down the hill in one long cascade past both sides of us while our own strand goes on up ----------
    if (rare) {
      const cr = rng.fork('cascade'), geos = [];
      let maxLen = 0;
      for (let k = 0; k < 12; k++) {
        const sgn = k % 2 ? -1 : 1, phi = sgn * (0.2 + 1.25 * (Math.floor(k / 2) / 5) + cr.range(-0.08, 0.08)), spread = 34 + 22 * Math.floor(k / 2) + cr.range(-6, 6);
        const x0 = Math.sin(phi) * 57, y0 = HTOP + 62 - Math.cos(phi) * 57, ctl = [V3(x0, y0, HZ - 3), V3(x0 * 1.1, Math.max(ground(x0 * 1.1, HZ - 30) + 9, y0 - 40), HZ - 30)];
        for (const z of [830, 760, 690, 620, 560, 505]) { const f = (HZ - z) / 400, x = sgn * (Math.abs(x0) * (1 - f) + spread * (0.6 + 1.4 * f)) + 14 * Math.sin(z * 0.02 + k); ctl.push(V3(x, ground(x, z) + 3.2 + 2 * Math.sin(k + z * 0.01), z)); }
        const pts = resample(ctl, 4).reverse();
        let len = 0; for (let i = 1; i < pts.length; i++) len += pts[i].distanceTo(pts[i - 1]);
        maxLen = Math.max(maxLen, len);
        geos.push(style.tressGeometry(pts, { phase: 30 + k * 1.9, across: 4, s0: -len, half: () => 4.2 + 2.6 * ((k * 0.37) % 1), sway: (t) => 1 - sm((t - 0.8) / 0.2), roll: (t) => (t < 0.8 ? 1 : 0) }));
      }
      const cm = style.hair({ ink: INK.hair, sway: 4.2, waveLen: 140, waveSpeed: 22, rollLen: 300, slide: -40, strandCount: 7 });
      const cas = new THREE.Mesh(mergeGeometries(geos), cm); for (const g of geos) g.dispose();
      cas.frustumCulled = false; cas.name = 'cascade'; cas.visible = false; scene.add(cas);
      cm.uniforms.uTip.value.set(0, 1, 0); cm.uniforms.uTipS.value = 0;
      tick.push((dt, time, camera, u) => {
        const kk = sm((u * duration - 30.6) / 5.2), tip = -maxLen * kk;
        cas.visible = kk > 0.001; cm.uniforms.uTip.value.x = tip; cm.uniforms.uTipS.value = tip;
      });
      await ctx.yield();
    }

    // ==== TAIL ====
    // ---- the journey ------------------------------------------------------------------------------------------
    const heroC = V3(0, HTOP + 62, HZ);
    const _cp = V3(), _tx = V3(), _ty = V3(), _tz = V3(), _m = new THREE.Matrix4(), _p2 = V3();
    let letDown = 0;
    function update(dt, time, camera, u) {
      u = clamp01(u || 0);
      style.update(dt, time, camera);
      const d = u * L;
      // the snap: which one are we in, and how far has its ring run
      let flick = 0, ringR = -1000, ringA = 0, ringU = 0;
      for (const su of SNAPS) {
        const du = (u - su) * duration;                 // seconds since this snap, in journey time
        flick += env(du - 0.12, 0.12, 0.45);
        if (du > -0.05 && du < 3.2) { ringR = 4 + du * 30; ringA = 2.6 * env(du - 0.2, 0.25, 1.8); ringU = su; }
      }
      path.pointAt(ringU, _p2);
      U.uRing.value.set(_p2.x, _p2.z, ringR, ringA);
      // the bend field: everything the hair passes takes its curve, combed along our heading
      path.tangentAtDist(d, _tz); path.posAtDist(d, _p2);
      style.setBend(-_tz.x, -_tz.z, 1.5, 0.5 * flick);
      U.uPass.value.set(_p2.x, _p2.z, 34, 2.4);
      // our own tress: its free tip is just behind the eye
      hair0Mat.uniforms.uTip.value.x = d - 1.5; hair0Mat.uniforms.uTipS.value = d - 1.5;
      { const kc = sm((u - 0.42) / 0.08); hair0Mat.uniforms.uRide.value.x = 0.8 - 0.42 * kc; hair0Mat.uniforms.uRide.value.y = 0.021 - 0.009 * kc; }   // on the climb our tress is drawn finer under the eye, so the plait and the roundel show over it
      hair0Mat.uniforms.uRideK.value = 1 - sm((u - 0.62) / 0.09);          // on the corkscrew the tip draws fine again (a thread under the eye), so the roundel's face is never covered
      // the volute rides with the eye: position and heading from the camera's world matrix
      _cp.setFromMatrixPosition(camera.matrixWorld);
      _m.extractRotation(camera.matrixWorld); _tx.setFromMatrixColumn(_m, 0).negate(); _ty.setFromMatrixColumn(_m, 1); _tz.setFromMatrixColumn(_m, 2).negate();   // x port, y up, z ahead, as the eye sees it
      const fl = 0.36 * flick + 0.05 * Math.sin(time * 0.9) + 0.03 * Math.sin(time * 2.3);
      _ty.applyAxisAngle(_tx, fl); _tz.applyAxisAngle(_tx, fl);                 // the flick: the lip dips into frame and springs back
      // (hand round "whip") between snaps the lock rests just above the top of the frame, whatever the window's shape and lens: rest is worked
      // out from the lock's own curve and the camera's lens (the 60 is the world's own lens typed again; the engine always sets fov), at least 0.1 m clear at the slow sway's deepest. Live's draw-up before the roundel is the
      // first term, unchanged. With each snap the lock whips down into the frame and springs back, by the snap's own envelope. Live held it
      // in the top left corner of almost every frame of a 16 by 9, 4 by 3 or 1 by 1 window, where strangers read a shape stuck to the lens.
      let rest = 0; { const tF = Math.tan(((camera.fov || 60) * Math.PI) / 360); for (let i = 0; i < lockP.length; i++) rest = Math.max(rest, tF * lockP[i] - lockQ[i]); rest = rest / (SWAY_C - tF * SWAY_S) + 0.1; }
      _cp.addScaledVector(_ty, Math.max(1.7 * sm((u - 0.72) / 0.08), rest * (1 - Math.min(flick, 1))));
      volute.matrix.copy(_m.makeBasis(_tx, _ty, _tz).setPosition(_cp)); volute.matrixWorldNeedsUpdate = true;
      // the coil grows turn by turn as the hair comes home; the rare letting-down undoes it
      if (rare) letDown = sm((u * duration - 29.5) / 6.5);
      hero.setProgress(u); hero.setLetDown(letDown);
      for (const f of tick) f(dt, time, camera, u, d, flick);
    }

    return {
      scene, path, duration,
      camera: { fov: 60, near: 0.4, far: 5200, lookAhead: 34, sway: 0.5, bank: 0.6 },
      pois: [
        { at: heroC, from: 0.0, to: 0.16, weight: 0.3 },
        { at: V3(13, 2.5, 428), from: 0.33, to: 0.41, weight: 0.4 },
        { at: V3(-70, 8, 490), from: 0.4, to: 0.47, weight: 0.35 },
        { at: heroC, from: 0.5, to: 0.7, weight: 0.5 },
        { at: heroC, from: 0.66, to: 0.93, weight: 0.8 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#F6E3B4', glow: 0.35, revealDistance: 330 },
      post: { exposure: WW_EXPOSURE, bloom: { strength: 0.16, radius: 0.35, threshold: 1.0 },
        grade: { saturation: 1.05, contrast: 1.04, tint: '#ffffff', shadowTint: '#000000', vignette: 0, grain: 0.012, aberration: 0 } },
      ride: 'none', style: 'none',
      update,
      dispose() {},
    };
  },
};
