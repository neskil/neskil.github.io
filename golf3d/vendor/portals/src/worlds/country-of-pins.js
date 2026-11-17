// THE COUNTRY OF PINS
// A plain made of nothing but sliding steel pins under a low sun: a pin-art toy the size of a country.
// Unseen things pass beneath and show only as the relief they raise: rays, a breaching pod, a herd of
// runners, and the Roller, a ball the size of a hill whose embossed belt turns over its crown. We ride
// its largest stroke: up the leading flank, over the crown, down the comb of its back, along its wake,
// into a trench of bared shafts and up a ramp into a henge of standing pins.
//
// Everything but the sky and the amber marbles is a pin, and every pin reads ONE closed-form height
// (src/parts/country-of-pins.js): the world only fills uniforms from u (ball, cast, moon) and adds the
// fixed works (trench mesh, Henge columns, portal collar) through the hero's helpers.
//
// FIX ROUND 3 (the stranger's twelve stills). The entry is 100 m nearer and comes in from the sun side on a curve, so the
// dome is a third of the frame wide at once and its lit and shaded halves both show; every scripted moment is still
// written in the old path's u and carried over by toNew/toOld. The lead ray is out ahead at the entry, the pod breaches
// by u 0.08, the runners cross at 0.16. Over the crown the path rides 8 m higher and the gaze dips onto the belt's
// terraces, then stays level down the comb. The Henge is an organ of standing pins up to 100 m tall, a landmark from the
// crown on, which lowers its pipes round the ring as we come up the trench (uTall). Each look has a shade colour
// (cShade: long pin shadows and the sides turned from the sun), the copper and noon looks have bare shafts of the
// relief colour under patinated heads (uFin), and the escort marbles are the seed's and spill caustics (uEsc).
//
// FIX ROUND 4 (twelve different pictures). The entry is 400 m from the Roller (the dome a third of the frame wide at
// once), the trench is 220 m long and starts at z -300, so the path is about 930 m and its u now runs: 0.02 entry and the
// lead ray, 0.08 the pod breaching close to starboard, 0.16 the runners, 0.25 the close pass with its escort marbles,
// 0.34 the crown, 0.43 off the back (the gaze dips onto the comb), 0.52 two leviathans (uLev: long terraced backs that
// surface beside the wake as we come down), 0.61 the wake, 0.70 rays crossing just ahead, 0.79-0.87 the trench, 0.94 the
// ring. The pod, the herd, the wake rays, the escorts, the leviathans and the gaze are keyed to this path's own u; only
// the entry rays still use the old path's u (toOld). Each look has a luminance floor and an edge light for shaded shafts
// (uFin.y, uFin.z), so shade falls to the shade colour and never to black.
//
// World frame: the Roller rolls toward +Z and its crown is at the origin when we cross it; we enter from
// +Z heading roughly -Z (port is -X): the sun stands on the +X (starboard) beam and the slate shelf
// of retreating night lies over -Z, behind the portal.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero } from '../parts/country-of-pins.js';

const DUR = 48;            // seconds; the Roller's timeline is u * DUR
const V_BALL = 9;          // m/s
const TRENCH_Z = -300, TRENCH_LEN = 220, TR_A = 60, TR_B = 150, TR_C = 70, HENGE_R = 22;   // the trench: start, length, metres of descent, where the ramp starts, metres of ramp

// ---- looks: hour + finish chosen together so every one is a decided picture ----
const LOOKS = {
  // apricot morning, teal -> violet -> rose-gold -> pale gold
  morning: {
    title: 'The Country of Pins',
    pal: ['#12464F', '#6B4E9B', '#E8A07C', '#F6E2A6', '#C9CED6', '#FBE9D7', '#101820'],
    skyLo: '#E8A07C', skyHi: '#FBE9D7', skySun: '#F6E2A6', slate: '#3E5266', haze: '#6F8196',
    sunEl: 14, horz: 0, cont: null, amber: '#F2A33C', portal: '#FBE9D7', shade: ['#0E4450', 0.8],
    post: { exposure: 1.0, bloom: 0.3, sat: 1.08, con: 1.06 },
  },
  // the same morning in copper and brass over verdigris: the datum heads and every shaded side are green-blue patina,
  // everything raised is lit copper, the crown pale brass
  oxblood: {
    title: 'The Country of Pins, in Copper',
    pal: ['#1E6660', '#A2502E', '#D98C52', '#F6D3A2', '#CFD2CE', '#FBE9D7', '#0C1414'],
    skyLo: '#EBAA84', skyHi: '#E6EEEA', skySun: '#F8E3A8', slate: '#3F4F60', haze: '#74869A',
    sunEl: 12, horz: 0, cont: null, amber: '#F0B04A', portal: '#FCEBD2', shade: ['#14575A', 0.85], lum: [0.4, 0.9], shaft: 3.2,
    post: { exposure: 1.0, bloom: 0.3, sat: 1.05, con: 1.07 },
  },
  // black nickel with one cyan contour, under a cooler, later morning
  nickel: {
    title: 'The Country of Pins, Black Nickel',
    pal: ['#39424C', '#4A525E', '#6B7480', '#A9B2BC', '#AEB6C0', '#F4EFE6', '#0B1016'],
    skyLo: '#E6B49A', skyHi: '#F3EEE8', skySun: '#F8E6B8', slate: '#33465A', haze: '#64788E',
    sunEl: 17, horz: 0, cont: ['#5FE6F2', 0.95], lum: [0.2, 0.5], amber: '#F2A33C', portal: '#EAF6FA', shade: ['#1C4A5E', 0.7],
    post: { exposure: 1.12, bloom: 0.34, sat: 1.05, con: 1.08 },
  },
  // pewter pre-dawn: dark heads, a lilac ramp and one gold horizon line in every head
  pewter: {
    title: 'The Country of Pins before Dawn',
    pal: ['#2B2A31', '#8474AE', '#C29ECE', '#F0DCE8', '#5E5E6A', '#C9C4DA', '#0A0B10'],
    skyLo: '#A79EC2', skyHi: '#5A6079', skySun: '#E2B07A', slate: '#454A5C', haze: '#6A6F84',
    sunEl: 3.5, horz: 3.6, cont: null, amber: '#FFB24A', portal: '#FFE2B8', lum: [0.4, 0.95], gl: [0, 0, 1.1, 1], shade: ['#5A6190', 0.7], floor: [0.075, 0.15],
    post: { exposure: 1.38, bloom: 0.42, sat: 1.04, con: 1.05 },
  },
  // white noon: the sun at 60 degrees, glints beneath us, cobalt to brass
  noon: {
    title: 'The Country of Pins at Noon',
    pal: ['#3E62A2', '#B8934A', '#D4AC5A', '#EBC564', '#D8DEE6', '#F4F8FC', '#0E1622'],
    skyLo: '#F5ECDA', skyHi: '#86AADB', skySun: '#FFF8E4', slate: '#56729A', haze: '#93ACCA',
    sunEl: 58, horz: 0, cont: null, amber: '#F5A93A', portal: '#FFF4D8', lum: [0.5, 0.9], gl: [5, 1, 0, 1], shade: ['#1F3F84', 0.75], shaft: 3.2,
    post: { exposure: 0.9, bloom: 0.26, sat: 1.0, con: 1.07 },
  },
};

function pickLook(vary, rng) {
  const hour = vary?.hour ?? 'any', r = rng();
  if (hour === 'dawn' || hour === 'night') return 'pewter';
  if (hour === 'day') return 'noon';
  if (hour === 'golden') return r < 0.5 ? 'morning' : (r < 0.8 ? 'oxblood' : 'nickel');
  return r < 0.22 ? 'noon' : r < 0.40 ? 'pewter' : r < 0.70 ? 'morning' : r < 0.84 ? 'oxblood' : 'nickel';
}

export default {
  id: 'country-of-pins',
  name: 'The Country of Pins',
  category: 'alien',
  weirdness: 0.75,
  media: ['air', 'open'],
  async build(ctx) {
    const { rng } = ctx;
    const vary = ctx.vary || {};
    const detail = ctx.quality?.detail ?? 1;
    const density = vary.density ?? 1;
    const vr = rng.fork ? rng.fork('pins-vary') : rng;
    const lookId = pickLook(vary, vr);
    const L = LOOKS[lookId];
    const weather = vr.pick(['still', 'still', 'rain', 'swell']);
    const beltStyle = vr.pick([0, 0, 1, 2]);
    const castEel = vr.chance(0.3);
    const nRays = Math.max(5, Math.min(9, Math.round(vr.range(5.5, 9.4) * density)));
    const nPod = Math.max(5, Math.min(9, Math.round(vr.range(5.5, 8.5) * density)));
    const herdLanes = vr.pick([3, 4, 4, 5]);
    const herdLen = Math.round(Math.max(24, Math.min(60, vr.range(30, 52) * density)) / herdLanes) * 26;
    const rare = !!vary.rare;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(L.skyHi).multiplyScalar(0.6);

    // sun on the starboard beam (+X), never ahead and never behind the portal; the slate shelf over the exit (-Z)
    const sunAz = (vr.range(74, 86)) * Math.PI / 180, sunEl = L.sunEl * Math.PI / 180;
    const sunDir = new THREE.Vector3(Math.sin(sunAz) * Math.cos(sunEl), Math.sin(sunEl), Math.cos(sunAz) * Math.cos(sunEl));
    const shelfDir = { x: -0.14, z: -0.99 };

    const hero = await buildHero(ctx, {
      palette: L.pal, skyLo: L.skyLo, skyHi: L.skyHi, skySun: L.skySun, amber: L.amber,
      sunDir, shelfDir, belt: beltStyle, nearPins: 8200, detail, speed: V_BALL,
      ripple: 0.5, plainRadius: 3400, skyDome: true, patch: true, patchRadius: 240,
    });
    const U = hero.uniforms;
    U.cSlate.value.set(L.slate); U.cHaze.value.set(L.haze);
    U.uHorz.value.set(1.0, 0.72, 0.36, L.horz);
    if (L.lum) U.uRampLum.value.set(L.lum[0], L.lum[1]);
    if (L.gl) U.uGl.value.set(...L.gl);
    if (L.cont) { const c = new THREE.Color(L.cont[0]); U.uCont.value.set(c.r, c.g, c.b, L.cont[1]); }
    { const c = new THREE.Color(L.shade[0]); U.cShade.value.set(c.r, c.g, c.b, L.shade[1]); }
    U.uFin.value.x = L.shaft || 0; if (L.floor) { U.uFin.value.y = L.floor[0]; U.uFin.value.z = L.floor[1]; }
    U.uFarOn.value = 1;
    U.uWx.value.set(weather === 'rain' ? 1 : 0, weather === 'swell' ? 1.5 : 0, 0);
    scene.add(hero.object);
    await ctx.yield();
    // ---------- the flight: authored in the ball's frame and stepped into the world by the ball's timeline ----------
    const shell = (azDeg, polDeg, off) => {
      const a = azDeg * Math.PI / 180, p = polDeg * Math.PI / 180, r = 130 + off;
      return new THREE.Vector3(Math.sin(a) * Math.sin(p) * r, Math.cos(p) * r - 20, Math.cos(a) * Math.sin(p) * r);
    };
    const swellLift = weather === 'swell' ? 1.5 : 0;
    let shellOff = 9.5, backOff = 0, path = null, tCrown = 22, ptsU = null;
    // The entry was moved 90 m nearer the Roller (fix round 3). Every scripted moment below is still written in the u of
    // the old, longer path ("old u"); toNew / toOld carry it onto the real path so the cast keeps its places.
    const mapU = { leadOld: 330, leadNew: 240, s: 1100 };
    const toNew = (uo) => { const d = uo * (mapU.s - mapU.leadNew + mapU.leadOld); return (d < mapU.leadOld ? d * mapU.leadNew / mapU.leadOld : d - (mapU.leadOld - mapU.leadNew)) / mapU.s; };
    const toOld = (u) => { const d = u * mapU.s; return (d < mapU.leadNew ? d * mapU.leadOld / mapU.leadNew : d + (mapU.leadOld - mapU.leadNew)) / (mapU.s - mapU.leadNew + mapU.leadOld); };
    const PORTAL = new THREE.Vector3(0, 8.6, TRENCH_Z - TRENCH_LEN);
    const CROWN_I = 6;
    const buildPath = () => {
      // ball-frame anchors (they ride with the ball): the rising traverse, the crown, the comb of the back
      const pol = (azDeg, rho, y) => new THREE.Vector3(Math.sin(azDeg * Math.PI / 180) * rho, y, Math.cos(azDeg * Math.PI / 180) * rho);
      const loc = [pol(14, 178, 12 + swellLift), pol(13, 147, 30), shell(12, 59, shellOff), shell(10, 43, shellOff), shell(7, 27, shellOff + 1.5), shell(3, 12, shellOff + 5.5),
        shell(180, 3, shellOff + 8 + backOff * 0.4), shell(181, 17, shellOff + 1 + backOff), shell(181, 35, shellOff - 1.5 + backOff), shell(180.5, 52, shellOff + backOff),
        new THREE.Vector3(0, 30, -152), new THREE.Vector3(0, 10 + swellLift, -216)];
      // the back sinks late (pins stand up to 2.2 s after the ball has gone on), so the descent rides 20 m further back
      [6, 16, 21, 21, 20, 6].forEach((dz, i) => { loc[CROWN_I + i].z -= dz; });
      const wy = 11 + swellLift;
      const tail = [[0, wy, -252], [0, 8.5 + swellLift * 0.5, TRENCH_Z - 2], [0, -3, TRENCH_Z - 46], [0, -13, TRENCH_Z - 90],
        [0, -13, PORTAL.z + 66.6], [0, -2.2, PORTAL.z + 33.3], [PORTAL.x, PORTAL.y, PORTAL.z]].map((p) => new THREE.Vector3(...p));
      let pts = null, tk = loc.map((_, i) => tCrown + (i - CROWN_I) * 2);
      for (let it = 0; it < 5; it++) {
        const w = loc.map((p, i) => p.clone().setZ(p.z + V_BALL * (tk[i] - tCrown)));
        const F = w[0];
        const lead = [[F.x + 79, 15 + swellLift, F.z + 153], [F.x + 60, 11 + swellLift, F.z + 112], [F.x + 32, 7 + swellLift, F.z + 76], [F.x + 9, 8 + swellLift, F.z + 38]]
          .map((p) => new THREE.Vector3(...p));
        pts = [...lead, ...w, ...tail];
        let s = 0; const cum = [0];
        for (let i = 1; i < pts.length; i++) { s += pts[i].distanceTo(pts[i - 1]); cum.push(s); }
        const tAll = cum.map((c) => (c / s) * DUR);
        tCrown = tAll[lead.length + CROWN_I];
        const old = [[F.x - 38, F.z + 394], [F.x - 26, F.z + 327], [F.x - 14, F.z + 260], [F.x - 1, F.z + 155], [F.x + 3, F.z + 72], [F.x, F.z]];
        let lo = 0; for (let i = 1; i < old.length; i++) lo += Math.hypot(old[i][0] - old[i - 1][0], old[i][1] - old[i - 1][1]);
        mapU.leadOld = lo; mapU.leadNew = cum[lead.length]; mapU.s = s;
        tk = loc.map((_, i) => tAll[lead.length + i]);
      }
      ptsU = pts;
      return makePath(pts, { samples: 480 });
    };
    const ballZ = (u) => V_BALL * (u * DUR - tCrown);
    // CPU bound of the pin tops under a point, with the ball where it is at that u
    const topAt = (x, z, u) => {
      const bz = ballZ(u), d2 = x * x + (z - bz) * (z - bz), d3 = x * x + (z - bz + 19.8) * (z - bz + 19.8);
      const cap = Math.max(0, Math.sqrt(Math.max(0, 16900 - d2)) - 20, Math.sqrt(Math.max(0, 16900 - d3)) - 20);
      const s = TRENCH_Z - z, inTr = Math.abs(x) < 8.3 && s > 0;
      const dep = inTr ? 22 * core_sm(s / TR_A) * (1 - core_sm((s - TR_B) / TR_C)) : 0;
      const wake = (bz - z > 100 && bz - z < 545 && Math.abs(x) < 80) ? U.uWakeAmp.value : 0;
      return cap + (cap > 0 ? 3.2 : 0) + 0.9 + swellLift + wake - dep;
    };
    const core_sm = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
    const tmp = new THREE.Vector3();
    for (let tries = 0; tries < 4; tries++) {
      path = buildPath();
      await ctx.yield();
      let need = 0, needB = 0;
      for (let i = 0; i <= 400; i++) {
        const u = i / 400; path.pointAt(u, tmp);
        const c = tmp.y - topAt(tmp.x, tmp.z, u);
        if (c < 5.2) { if (u * DUR > tCrown + 0.3) needB = Math.max(needB, 5.2 - c); else need = Math.max(need, 5.2 - c); }
      }
      if (need <= 0 && needB <= 0) break;
      if (need > 0) shellOff += need + 0.3;
      if (needB > 0) backOff += needB + 0.3;
    }
    await ctx.yield();

    // ---------- fixed works: the trench, the Henge, the portal's collar ----------
    U.uTr.value.set(0, TRENCH_Z, 0, -1); U.uTrOn.value = 1; U.uTrP.value.set(TR_A, TR_B, TR_C);
    {
      const xs = [-36, -28, -21, -16, -13.4, -12.6, -11.8, -11, -10.2, -9.4, -8.7, -8.1, -7, -4.8, -1.6, 1.6, 4.8, 7, 8.1, 8.7, 9.4, 10.2, 11, 11.8, 12.6, 13.4, 16, 21, 28, 36];
      const s0 = -14, rows = Math.round((TRENCH_LEN + 45 - s0) / 2.5), ds = (TRENCH_LEN + 45 - s0) / rows, pos = [], idx = [];
      for (let j = 0; j <= rows; j++) for (const x of xs) pos.push(x, 0, TRENCH_Z - (s0 + j * ds));
      const n = xs.length;
      for (let j = 0; j < rows; j++) for (let i = 0; i < n - 1; i++) {
        const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      hero.addStatic(g);
    }
    await ctx.yield();
    {
      const P = 0.8, ROW = P * 0.8660254, list = [];
      // sixteen columns of nineteen pins, 38 m tall, on a 44 m circle; the two at the trench mouth stand 14 m apart
      const gate = Math.asin(7 / HENGE_R), span = (Math.PI * 2 - 2 * gate) / 15;
      for (let c = 0; c < 16; c++) {
        const ang = gate + c * span, cx0 = PORTAL.x + Math.sin(ang) * HENGE_R, cz0 = PORTAL.z + Math.cos(ang) * HENGE_R;
        const j0 = Math.round(cz0 / ROW), cx = (Math.round(cx0 / P - 0.5 * j0) + 0.5 * j0) * P, cz = j0 * ROW;
        const back = Math.sin(Math.PI * c / 15), tall = 38 + 64 * back * back * back + ((c * 7) % 5 - 2) * 1.4, low = 22 + 12 * back;
        for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) {
          if (Math.abs(a + b) > 2) continue;
          const ring = Math.max(Math.abs(a), Math.abs(b), Math.abs(a + b));
          list.push({ x: cx + (a + 0.5 * b) * P, z: cz + b * ROW, lift: low - ring * 0.45, extra: tall - low, chase: 1.1, phase: c * 0.785 });
        }
      }
      // the collar: pins stepped up toward the ring like a setting round a stone, rising and falling in a slow chase
      for (let j = -5; j <= 5; j++) for (let i = -18; i <= 18; i++) {
        const x = PORTAL.x + (i + (j & 1 ? 0.5 : 0)) * P, z = PORTAL.z - 1.2 + j * ROW, ax = Math.abs(x - PORTAL.x), az = Math.abs(j) / 5;
        let lift;
        if (ax >= 7.7) lift = (1 + Math.floor((13.2 - ax) * 1.25)) * (1 - 0.55 * az * az);
        else lift = (0.35 + 0.35 * Math.floor(ax / 2.2)) * (1 - 0.7 * az);
        if (lift > 0.15) list.push({ x, z, lift, chase: ax >= 7.7 ? 0.7 : 0.25, phase: ax * 0.55 + (x > PORTAL.x ? 0 : 1.6) });
      }
      hero.addFixedPins(list);
    }
    await ctx.yield();
    const escU = U.uEsc.value;   // the hero's head shader reads the same four marbles for their amber caustics
    // ---------- thirty amber marbles rolling up the trench floor on its slow ripple ----------
    {
      const G = hero.glsl, n = 30, seeds = new Float32Array(n * 4);
      for (let i = 0; i < n * 4; i++) seeds[i] = vr();
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4)); g.instanceCount = n;
      const mat = new THREE.ShaderMaterial({
        uniforms: { ...U, cAmber: { value: new THREE.Color(L.amber) } },
        vertexShader: /* glsl */`
${G.uniforms}${G.lattice}${G.height}
attribute vec4 aSeed;
varying vec2 vUv; varying vec3 vC, vRight, vUp, vFwd;
void main(){
  float s = mod(aSeed.x * 175.0 + uTime * (3.0 + 4.5 * aSeed.y), 175.0) + 25.0;
  float l = (aSeed.z - 0.5) * 13.0 + sin(uTime * 0.6 + aSeed.w * 20.0) * 0.8;
  vec2 p = uTr.xy + uTr.zw * s + vec2(uTr.w, -uTr.z) * l;
  float fade = smoothstep(25.0, 38.0, s) * (1.0 - smoothstep(186.0, 200.0, s));
  float hop = abs(sin(uTime * (2.0 + aSeed.w) + aSeed.x * 40.0)) * 0.45 * aSeed.y;
  vec3 C = vec3(p.x, fieldH(p, 0.3) + 0.62 + hop - (1.0 - fade) * 2.6, p.y);
  vec4 mv = modelViewMatrix * vec4(C, 1.0);
  float rad = max(0.6, -mv.z * 0.0028);
  vUv = position.xy; vC = C;
  vRight = vec3(modelViewMatrix[0][0], modelViewMatrix[1][0], modelViewMatrix[2][0]);
  vUp = vec3(modelViewMatrix[0][1], modelViewMatrix[1][1], modelViewMatrix[2][1]);
  vFwd = vec3(modelViewMatrix[0][2], modelViewMatrix[1][2], modelViewMatrix[2][2]);
  gl_Position = projectionMatrix * (mv + vec4(position.xy * rad, 0.0, 0.0));
}`,
        fragmentShader: /* glsl */`
${G.uniforms}${G.sky}${G.glass}
uniform vec3 cAmber;
varying vec2 vUv; varying vec3 vC, vRight, vUp, vFwd;
void main(){
  float r2 = dot(vUv, vUv);
  if (r2 > 1.0) discard;
  float nz = sqrt(max(1.0 - r2, 0.0));
  vec3 n = vRight * vUv.x + vUp * vUv.y + vFwd * nz; n = n / max(length(n), 1e-4);
  vec3 Vd = vC - uCamL; vec3 V = Vd / max(length(Vd), 1e-3);
  gl_FragColor = vec4(glassBall(n, V, vUv, vRight, vUp, cAmber, 0.0), 1.0);
}`,
      });
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; hero.object.add(m);
      // four marbles that bound down the flank past the camera during the close pass (keyed to u; radius 0 = away)
      const ge = new THREE.InstancedBufferGeometry();
      ge.setAttribute('position', g.getAttribute('position')); ge.setIndex(g.getIndex());
      ge.setAttribute('aIdx', new THREE.InstancedBufferAttribute(new Float32Array([0, 1, 2, 3]), 1)); ge.instanceCount = 4;
      const escMat = new THREE.ShaderMaterial({
        uniforms: { ...U, cAmber: { value: new THREE.Color(L.amber) } },
        vertexShader: /* glsl */`
uniform vec4 uEsc[4];
attribute float aIdx;
varying vec2 vUv; varying vec3 vC, vRight, vUp, vFwd;
void main(){
  vec4 e = aIdx < 0.5 ? uEsc[0] : (aIdx < 1.5 ? uEsc[1] : (aIdx < 2.5 ? uEsc[2] : uEsc[3]));
  vec4 mv = modelViewMatrix * vec4(e.xyz, 1.0);
  vUv = position.xy; vC = e.xyz;
  vRight = vec3(modelViewMatrix[0][0], modelViewMatrix[1][0], modelViewMatrix[2][0]);
  vUp = vec3(modelViewMatrix[0][1], modelViewMatrix[1][1], modelViewMatrix[2][1]);
  vFwd = vec3(modelViewMatrix[0][2], modelViewMatrix[1][2], modelViewMatrix[2][2]);
  gl_Position = projectionMatrix * (mv + vec4(position.xy * e.w, 0.0, 0.0));
}`,
        fragmentShader: mat.fragmentShader,
      });
      const em = new THREE.Mesh(ge, escMat); em.frustumCulled = false; hero.object.add(em);
    }
    await ctx.yield();

    // ---------- the cast: nothing is ever seen, only backs written in pins; all keyed to u ----------
    const len = path.length, sm = core_sm;
    const pA = new THREE.Vector3(), tA = new THREE.Vector3(), pB = new THREE.Vector3();
    const along = (d, lat, out) => {   // a point 'lat' metres to starboard of the path at distance d; returns heading
      path.posAtDist(d, pA); path.tangentAtDist(d, tA);
      const hl = Math.hypot(tA.x, tA.z) || 1, tx = tA.x / hl, tz = tA.z / hl;
      out.set(pA.x - tz * lat, 0, pA.z + tx * lat);
      return Math.atan2(tx, tz);
    };
    // rays: a fan of kites; the lead one comes from behind, passes under us and settles ahead
    const rayLat = [0], rayBack = [0];
    for (let i = 1; i < nRays; i++) {
      const k = Math.ceil(i / 2), side = i % 2 ? 1 : -1;
      rayLat.push(side * (4 + 21 * k + vr.range(-3, 3))); rayBack.push(-15 * k + vr.range(-4, 4));
    }
    const U_CROSS = 0.69, crossAt = path.posAtDist(0.70 * path.length + 19, new THREE.Vector3());
    const setRays = (u, ur) => {
      const cr = U.uCr.value;
      let on = 0;
      if (u < 0.34) {
        const a0 = -46 + 74 * sm(u / 0.078) + 95 * sm((u - 0.17) / 0.12), early = 1 - sm(u / 0.075);
        const fan = 0.55 + 0.45 * sm(u / 0.12), veer = 85 * sm((u - 0.17) / 0.12), amp = 1 - sm((u - 0.2) / 0.07);
        for (let i = 0; i < 9; i++) {
          if (i >= nRays || amp < 0.01) { cr[i].w = 0; continue; }
          // the lead ray is already out ahead of us at the entry, a whole kite in the foreground; the rest overtake
          const d = ur * len + (i ? a0 + rayBack[i] + early * (64 + 9 * i) : 40 + 83 * sm((u - 0.17) / 0.12));
          const hd = along(d, rayLat[i] * fan + veer, pB);
          cr[i].set(pB.x, pB.z, hd + (i ? Math.sign(rayLat[i]) * -0.06 * early : 0) - 0.5 * sm((u - 0.2) / 0.1) * (1 - sm((u - 0.3) / 0.04)), amp);
          on = 1;
        }
      } else if (ur > 0.6 && ur < 0.8) {
        const tt = (ur - U_CROSS) * DUR, amp = sm((ur - 0.61) / 0.03) * (1 - sm((ur - 0.76) / 0.03));
        cr[0].set(crossAt.x + 33 * tt - 9, crossAt.z, Math.PI / 2, amp);
        cr[1].set(crossAt.x + 33 * (tt - 1.1), crossAt.z - 38, Math.PI / 2 + 0.08, amp);
        for (let i = 2; i < 9; i++) cr[i].w = 0;
        on = 1;
      } else for (let i = 0; i < 9; i++) cr[i].w = 0;
      U.uCrOn.value = on;
    };
    // the pod: domes that breach one after another along a line to starboard, the sun side
    const pods = [{ u0: 0.04, at: 0.04 + 42 / len, lat: 25, n: nPod, len: 110, sc: 0 }, { u0: 0.565, at: 0.6 + 78 / len, lat: 33, n: Math.max(5, nPod - 1), len: 150, sc: 0.7 }];
    for (const p of pods) { p.pos = new THREE.Vector3(); p.hd = along(p.at * len, p.lat, p.pos); p.sp = p.len / (p.n - 1); }
    const setPod = (u) => {
      const p = u >= pods[1].u0 ? pods[1] : pods[0];
      const w = (u - p.u0) * DUR;
      if (w < 0 || w > 14) { U.uPod.value.w = -1; return; }
      U.uPod.value.set(p.pos.x, p.pos.z, p.hd, w); U.uPodB.value.set(p.n, p.sp, p.sc, 0);
    };
    // runners: a herd streaming round the Roller's foot and across our bow; or, some visits, one long eel beside us
    const herdX = path.posAtDist(0.16 * len + 40, new THREE.Vector3()), herdHd = 150 * Math.PI / 180, HD0 = 400;
    const eelO = new THREE.Vector3(), eelE = new THREE.Vector3();
    along(toNew(0.1) * len, 27, eelO); along(toNew(0.3) * len, 33, eelE);
    const eelHd = Math.atan2(eelE.x - eelO.x, eelE.z - eelO.z);
    const setHerd = (u, ur) => {
      if (castEel) {
        U.uEel.value.set(eelO.x, eelO.z, eelHd, 62 + (ur - toNew(0.1)) * len * 0.86);
        U.uEelA.value = sm((u - 0.015) / 0.05) * (1 - sm((u - 0.37) / 0.04));
        return;
      }
      U.uHerd.value.set(herdX.x - Math.sin(herdHd) * HD0, herdX.z - Math.cos(herdHd) * HD0, herdHd, HD0 + 22 * DUR * (ur - 0.1));
      U.uHerdB.value.set(sm((ur - 0.03) / 0.04) * (1 - sm((ur - 0.25) / 0.04)), herdLen, herdLanes, 8);
    };
    // rare: a second ball, 90 m across, circling the Roller like a moon; its looping wake crosses the great one
    const MOON_TURN = 216 * Math.PI / 180, MOON_0 = 78 * Math.PI / 180;
    U.uMoon.value.set(MOON_0, 215, MOON_TURN / DUR, rare ? 1 : 0);

    // escort marbles: each meets the camera at its own u on the close pass. It bounds along a few metres to starboard, in
    // the air in front of the pins: lowest just over the local pin tops (where it spills its caustic), highest 3.3 m under
    // eye level; it is largest about 7 m ahead and the next one is then in mid-bounce 16 m up the slope
    // (place, phase and size are the seed's: drawn last, so no other draw moves)
    const ESC = [0.212, 0.234, 0.256, 0.278].map((u0) => [u0 + vr.range(-0.004, 0.004), vr.range(3.6, 6.6), vr.range(0, 3.1), vr.range(0.74, 0.98)]);
    const eP = new THREE.Vector3(), eT = new THREE.Vector3();
    const setEscorts = (u) => {
      for (let i = 0; i < 4; i++) {
        const [ui, lat, ph, rad] = ESC[i], du = u - ui, e = escU[i];
        if (du < -0.05 || du > 0.022) { e.set(0, -50, 0, 0); continue; }
        const d = u * len + 7.5 - du * len * 0.38;
        path.posAtDist(d, eP); path.tangentAtDist(d, eT);
        const hl = Math.hypot(eT.x, eT.z) || 1, x = eP.x - (eT.z / hl) * lat, z = eP.z + (eT.x / hl) * lat;
        const hop = Math.abs(Math.sin(du * len * 0.115 + ph)), fade = sm((du + 0.05) / 0.012) * sm((0.022 - du) / 0.006);
        const low = Math.max(topAt(x, z, u) - 2.0 + rad, eP.y - 8.2), high = Math.max(eP.y - 3.3 - rad, low + 1.5);
        e.set(x, low + (high - low) * (1 - (1 - hop) * (1 - hop)), z, rad * fade);
      }
    };
    const drive = (u) => {
      const bz = ballZ(u), uo = toOld(u);
      setEscorts(u);
      hero.setRoller(0, bz, bz / 130, 0, V_BALL);
      setRays(uo, u); setPod(u); setHerd(uo, u);
      if (rare) U.uMoon.value.x = MOON_0 + MOON_TURN * u;
      // two leviathans rise beside the wake as we come down the back, glide along it with us and sink before the trench
      const lv = U.uLev.value, la = sm((u - 0.345) / 0.07) * (1 - sm((u - 0.77) / 0.05));
      lv[0].set(-48, -205 - 144 * (u - 0.61), Math.PI, la);
      lv[1].set(92, -262 - 144 * (u - 0.61), Math.PI + 0.1, la * 0.9);
      U.uTall.value = 1 - sm((u - 0.87) / 0.055);   // the Henge lowers its organ of pins round the ring as we come up the trench
    };
    drive(0);
    await ctx.yield();

    const lookLev = new THREE.Vector3(), lookRay = new THREE.Vector3(), lookHenge = new THREE.Vector3(), lookCrown = new THREE.Vector3(), lookFlank = new THREE.Vector3(), lookBall = new THREE.Vector3();
    const lookRoller = new THREE.Vector3(), podLook = new THREE.Vector3(pods[0].pos.x, 3, pods[0].pos.z).addScaledVector(new THREE.Vector3(Math.sin(pods[0].hd), 0, Math.cos(pods[0].hd)), 30);
    return {
      scene, path, duration: DUR, title: L.title,
      camera: { fov: 62, near: 0.3, far: 5000, lookAhead: 22, sway: 0.5, bank: 0.55 },
      pois: [
        { at: (time, u) => lookRoller.set(0, 62, ballZ(u)), from: 0.0, to: 0.05, weight: 0.5 },
        { at: podLook, from: 0.04, to: 0.115, weight: 0.5 },
        { at: (time, u) => lookCrown.set(0, 62, ballZ(u)), from: 0.1, to: 0.18, weight: 0.6 },
        // the close pass: the gaze goes into the flank ahead and a little sunward, so the slope stands to port as a wall of shafts
        { at: (time, u) => {
          // level and 35 degrees to starboard of the climb: the wall of shafts and belt terraces to port, the country beyond to starboard
          path.pointAt(u, lookFlank);
          return lookFlank.set(lookFlank.x + 40, lookFlank.y - 50, lookFlank.z - 57);
        }, from: toNew(0.3), to: toNew(0.448), weight: 0.62, fade: 0.26 },
        // over the crown the gaze dips onto the belt's terraces with the country beyond them; as the back falls away it
        // comes up again to the wake, the leviathans and the Henge
        { at: (time, u) => lookHenge.copy(PORTAL).setY(PORTAL.y + 40 - 215 * sm((u - 0.25) / 0.04) * (1 - sm((u - 0.385) / 0.04))),
          from: 0.288, to: 0.6, weight: 0.72, fade: 0.14 },
        // along the wake the port leviathan, lit and terraced, takes the gaze for a while
        { at: (time, u) => lookLev.set(-46, 6, -205 - 144 * (u - 0.61) - 4), from: 0.465, to: 0.575, weight: 0.6 },
        // and the rays that cross the wake just ahead of us before the trench
        { at: (time, u) => lookRay.set(U.uCr.value[0].x, 2, U.uCr.value[0].y), from: 0.655, to: 0.735, weight: 0.4 },
      ],
      portal: { shape: 'circle', radius: 7, color: L.portal, glow: 1, revealDistance: 700, tilt: true },
      post: {
        exposure: L.post.exposure, bloom: { strength: L.post.bloom, radius: 0.35, threshold: 1.0 },
        grade: { saturation: L.post.sat, contrast: L.post.con, vignette: 0.18, grain: 0, aberration: 0 },
      },
      ride: 'none', style: 'none',
      update(dt, time, camera, u) {
        drive(u || 0);
        hero.update(dt, time, camera);
      },
      dispose() { hero.dispose(); },
    };
  },
};
