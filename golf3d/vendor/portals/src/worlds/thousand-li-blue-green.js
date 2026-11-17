// A Thousand Li in Blue and Green: qinglü mineral colour on tea-gold silk.
// The whole world is made from ONE makeStyle instance (src/parts/thousand-li-blue-green.js): bare silk (sky, lake, mist,
// fall, smoke), pigment by height laid in coats, gold ridge ribbons lit only by the glance, flat ruled buildings and
// stamped trees, wheels and creatures. No lights, no fog, no shadows.
// World frame: +Z is the course (the brief's z), the lake is y 0, the crown of the peak stands on the left (+X).
import * as THREE from 'three';
import { makePath, makeRng, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, makeStyle, PALETTE } from '../parts/thousand-li-blue-green.js';

export default {
  id: 'thousand-li-blue-green',
  name: 'A Thousand Li in Blue and Green',
  category: 'wilderness',
  after: 'Wang Ximeng, 1096 to 1119',
  weirdness: 0.3,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise;
    const detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;

    // ---- the seeded look: the age and ground of the silk, the season, the colourway, the cast
    const hourPick = rng();
    let hour = vary.hour && vary.hour !== 'any' ? vary.hour : (hourPick < 0.52 ? 'day' : hourPick < 0.68 ? 'dawn' : hourPick < 0.9 ? 'golden' : 'night');
    const seasonPick = rng(), season = seasonPick < 0.42 ? 'spring' : seasonPick < 0.74 ? 'autumn' : 'winter';
    const light = rng() < 0.3;                                  // colourway: light blue-green (thin coats over ink strokes)
    const cast = rng.pick(['mules', 'mules', 'oxcarts', 'porters']), rafts = rng() < 0.35;
    const pal = PALETTE.slice();
    let thin = 1, flake = 0, capCut = 0, stroke = 1, weave = 0.05;
    if (hour === 'dawn') { pal[0] = '#DFC592'; thin = 0.8; capCut = 0.55; }
    else if (hour === 'golden') { pal[0] = '#B0854A'; flake = 0.028; weave = 0.06; pal[4] = '#F4D060'; }
    else if (hour === 'night') { pal[0] = '#1B2540'; pal[1] = '#7E8BB0'; pal[4] = '#EDE2B0'; thin = 0.7; capCut = 1.25; stroke = 0.5; }
    if (light) { capCut = Math.max(capCut, 0.9); stroke = Math.max(stroke, 1.9); thin *= 0.9; }
    const creases = [-0.62 + rng.range(-0.2, 0.2), 0.21 + rng.range(-0.08, 0.3), 1.37 + rng.range(-0.3, 0.3)];
    const style = makeStyle(ctx, { palette: pal, thin, flake, stroke, weave, creases });
    const P = style.palette, U = style.uniforms;
    const wash = (k) => P.silk.clone().lerp(P.ink, k);
    const cap = (c) => Math.max(1, c - capCut);                 // every range's highest coat, one behind at dawn

    const scene = new THREE.Scene();
    scene.background = P.silk.clone();
    scene.add(style.sky(3000));

    // ---- the hero: bridge, pavilion, peak, three-step fall, moon gate
    const hero = await buildHero(ctx, { style, palette: pal, detail, winter: season === 'winter', vermilion: season === 'autumn' ? 0.34 : 1 / 12 });
    hero.object.rotation.y = Math.PI; hero.object.position.set(0, 0, 480);
    hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    const heroMat = hero.parts.peak.material;
    heroMat.uniforms.uSpeed.value = 10; heroMat.uniforms.uCap.value = light && hour !== 'night' ? 1.6 : cap(3);     // the light colourway: the second coat is only half laid, the third never comes
    const groundHero = (x, z) => hero.heightAt(-x, 480 - z);     // world -> hero local
    const groundHero0 = (x, z) => hero.heightAt0(-x, 480 - z);   // the ground before the balcony was cut: seeded decisions are taken on it, so no later draw of the seed moves
    await ctx.yield();

    // ---- the path: off the bluff, out and round an islet on the lake, under the centre span, up in front of the three falls,
    // along the terrace to the gate. pathC is the course as it was flown before the lake was crossed in a half circle: straight
    // down the axis, low across each pool and up beside the threads. Everything in the gorge is still PLACED against it.
    const pathC = makePath([
      [0, 56, 0], [0, 56, 30], [0, 55.6, 58], [0, 52, 76], [0, 31, 128], [0, 9.5, 178], [0, 4.4, 204], [0, 4, 240], [0, 4, 280], [0, 4.3, 310], [0, 4.8, 335],
      [0, 6.5, 346], [0, 13, 353], [0, 24, 360], [0, 36.5, 367], [-0.3, 49, 374], [-1.2, 58.5, 380], [-2.5, 63, 387], [-4, 63.5, 395], [-4.5, 64, 403], [-4.5, 66, 410],
      [-3, 71, 417], [-1, 82, 425], [0, 94, 432], [0, 104.5, 437], [0, 111, 442], [0, 115, 449], [0, 119.5, 455], [0, 129, 462], [0, 141.5, 470],
      [0, 154, 478], [0, 163, 485.5], [0, 167.5, 494], [0, 168.5, 506], [0, 167.5, 540], [0, 166, 580], [0, 166, 625],
    ]);
    // THE COURSE NOW. Everything in the gorge is still placed against pathC (the course as it was flown until now), so nothing
    // drawn there moves. The course itself differs in two places:
    // (1) THE LAKE IS CROSSED AS A HANDSCROLL IS READ: off the bluff we swing out to starboard, fly a half circle round a tall
    // rock islet and come back to the axis 37 m short of the bridge, the lens resting on the pavilion all the while, so the
    // near things of the lake (the islet, the plank bridge, the craft) slide across the picture. 84 m out, 96 m longer.
    // (2) THE FIRST FALL IS A PICTURE: we stay low over the water until 45 m from its foot, where it stands whole under its lip
    // with sky over it, and then rise in front of it, not beside it, and come over the lip onto the hermit's ledge.
    const SR = 38, SZ0 = 70, SZ1 = SZ0 + 4 * SR, SLEN = 2 * Math.PI * SR;
    const coursePts = [[0, 56, 0], [0, 56, 30], [0, 55.7, 52]];
    {
      const yS = (f) => lerp(55.4, 4.4, 1 - Math.pow(1 - f, 2.2));      // the dive is steepest off the bluff and eases onto the water
      // heading h (0 = +Z, positive toward +X): a quarter turn to starboard, a half turn back through the course, a quarter turn home
      const arcs = [[0, SZ0, -SR, SZ0, 0, -1], [-SR, SZ0 + SR, -SR, SZ0 + 2 * SR, -1, 2], [-SR, SZ0 + 3 * SR, -SR, SZ0 + 4 * SR, 1, -1]];   // [start x, z, centre x, z, heading at start / 90 deg, quarter turns (signed)]
      let done = 0;
      for (const [x0, z0, cx, cz, h0, q] of arcs) {
        const n = Math.abs(q) * 5;
        for (let i = (done ? 1 : 0); i <= n; i++) {
          const dh = q * Math.PI / 2 * i / n, cs = Math.cos(dh), sn = Math.sin(dh), rx = x0 - cx, rz = z0 - cz;
          // turning the heading by dh turns the radius by the same angle (toward +X is a turn of -dh about Y in the XZ plane as written here)
          const x = cx + rx * cs + rz * sn, z = cz - rx * sn + rz * cs, f = (done + Math.abs(dh) * SR) / SLEN;
          coursePts.push([Math.abs(x) < 1e-6 ? 0 : x, yS(f), z]);
        }
        done += Math.abs(q) * Math.PI / 2 * SR;
      }
    }
    // the tail: low to the first fall; up in front of it and over its lip onto the hermit's ledge, low; then one ramp of 55 degrees
    // from the ledge to the height of the last lip, in front of the two upper falls and never beside them; then the terrace
    for (const p of [[0, 4.1, 246], [0, 4, 280], [0, 4.3, 310], [0, 4.4, 322], [0, 6.5, 330], [0, 22, 338.5], [0, 39, 347], [0, 52.5, 356], [-0.4, 60, 365.5], [-1.2, 62.5, 376],
      [-2.5, 63, 386], [-3.6, 64.5, 392], [-3.3, 73.5, 398], [-2.7, 88.4, 407.8], [-2.2, 102.7, 417.2], [-1.6, 117, 426.7], [-1.1, 131.4, 436.1], [-0.5, 145.7, 445.6], [0, 159, 454.5],
      [0, 165.3, 465], [0, 167.6, 482], [0, 168.5, 506], [0, 167.5, 540], [0, 166, 580], [0, 166, 625]]) coursePts.push(p);
    const path = makePath(coursePts);
    // the course as it was first flown: every seeded decision on the bluff is still taken against it, so that no draw of the seed
    // (and with it no pine of the entry, no range) moves
    const pathB = makePath([
      [0, 56, 0], [0, 56, 30], [0, 55.6, 58], [0, 52, 76], [0, 31, 128], [0, 9.5, 178], [0, 4.4, 204], [0, 4, 240], [0, 4, 280], [0, 7, 300],
      [0, 18, 322], [0, 33, 345], [0, 48, 366], [0, 60, 381], [0, 64.3, 391], [0, 68, 400], [0, 77, 410], [0, 89, 421], [0, 101, 432], [0, 110.5, 441],
      [0, 115, 449], [0, 119.5, 455], [0, 129, 462], [0, 141.5, 470], [0, 154, 478], [0, 163, 485.5], [0, 167.5, 494], [0, 168.5, 506], [0, 167.5, 540], [0, 166, 580], [0, 166, 625],
    ]);
    // THE JOURNEY CLOCK is the brief's: 42 s along the course as it was first timed (speedC on pathC), read off by where we are (z),
    // so every scripted moment (coats, egrets, the train, the flake) still happens at the place it was written for.
    const CLOCK = 42;
    const speedC = (z) => {
      let v = lerp(7, 9, clamp(z / 60, 0, 1));
      v = lerp(v, lerp(12, 24, smoothstep(60, 190, z)), smoothstep(52, 80, z));
      v = lerp(v, 23, smoothstep(180, 200, z));
      v = lerp(v, 19, smoothstep(290, 318, z));
      for (const [a, b] of [[383, 404], [443, 453]]) v = lerp(v, 13, smoothstep(a - 8, a + 2, z) * (1 - smoothstep(b - 4, b + 8, z)));
      return lerp(v, 15, smoothstep(478, 494, z));
    };
    const NT = 256, _pp = new THREE.Vector3(), zTab = new Float32Array(NT + 1), cTab = new Float32Array(NT + 1);
    for (let i = 1; i <= NT; i++) { cTab[i] = cTab[i - 1] + (pathC.length / NT) / speedC(pathC.pointAt((i - 0.5) / NT, _pp).z); zTab[i] = pathC.pointAt(i / NT, _pp).z; }
    const clockAtZ = (z) => { let lo = 0, hi = NT; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (zTab[m] < z) lo = m; else hi = m; } return lerp(cTab[lo], cTab[hi], clamp((z - zTab[lo]) / Math.max(1e-4, zTab[hi] - zTab[lo]), 0, 1)) / cTab[NT] * CLOCK; };
    const clockAt = (u) => clockAtZ(path.pointAt(clamp(u, 0, 1), _pp).z);
    const uAtClock = (t) => { let lo = 0, hi = 1; for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (clockAt(m) < t) lo = m; else hi = m; } return (lo + hi) / 2; };
    // the speed we fly at now (pace(u) for the engine, and the length of the visit): unhurried round the islet, quick under the
    // pavilion, slow where the first fall stands whole, slow over the hermit's ledge
    const speedAt = (z) => {
      let v = lerp(7, 9, clamp(z / 60, 0, 1));
      v = lerp(v, 18.5, smoothstep(54, 84, z));
      v = lerp(v, 22, smoothstep(212, 246, z));
      v = lerp(v, 12.5, smoothstep(286, 316, z) * (1 - smoothstep(326, 344, z)));
      v = lerp(v, 18, smoothstep(328, 348, z) * (1 - smoothstep(356, 374, z)));
      v = lerp(v, 12.5, smoothstep(360, 378, z) * (1 - smoothstep(394, 406, z)));
      v = lerp(v, 19, smoothstep(398, 412, z));
      return lerp(v, 15, smoothstep(450, 474, z));
    };
    const tTab = new Float32Array(NT + 1);
    for (let i = 1; i <= NT; i++) tTab[i] = tTab[i - 1] + (path.length / NT) / speedAt(path.pointAt((i - 0.5) / NT, _pp).z);
    const DURATION = Math.min(50, Math.round(tTab[NT] * 2) / 2), vAvg = path.length / tTab[NT];
    const pace = (u) => speedAt(path.pointAt(clamp(u, 0, 1), _pp).z) / vAvg;

    const ranges = [];           // every coated mountain: { mat, t2, t3 } clock seconds at which coats 2 and 3 begin at its summit
    const updaters = [];         // (dt, time, camera, jc, u) for each living thing
    const wind = (t, k) => Math.sin(t * 0.6 + k) * 0.6 + Math.sin(t * 1.37 + k * 2.1) * 0.4;
    const goldLines = [], stampList = [], wheelList = [], B = style.batch();
    const kindOf = () => { const r = rng(); return r < (season === 'autumn' ? 0.34 : 1 / 12) ? 1 : 0; };

    // ---- the pine bluff under the entry: a folded headland whose top runs from z -40 to 60, 50 m above the lake
    const bluffTop = (x, z) => {
      const ex = Math.abs(x) - (58 + 9 * noise.n2(z * 0.02, 3.3)), ez = z - (57 + 7 * noise.n2(x * 0.025, 8.1)), eb = -78 - z;
      const out = Math.max(ex, ez, eb, 0);
      const top = 47.0 + 2.2 * noise.n2(x * 0.03, z * 0.03) + 1.0 * noise.n2(x * 0.11, z * 0.11 + 5) - out * (2.6 + 1.2 * noise.n2(x * 0.05, z * 0.05 + 9)) - out * out * 0.03;
      const ax = Math.abs(x), w0 = 13 + 0.42 * Math.max(0, z - 16), sad = 1 - smoothstep(w0, w0 + 13, ax);
      return Math.min(top, 47.3 + Math.max(0, ax - 9) * 0.5, lerp(60, 55.2 - 0.41 * z, sad));
    };
    {
      const ridges = [];
      const rim = [[-58, 40, 2.2, 3.0], [-40, 58, 0.5, 1.0], [-24, 60, -0.1, 0.5], [26, 60, -0.5, 0.1], [42, 57, -1.0, -0.4], [58, 38, -3.0, -2.2],
        [-60, 6, 1.7, 2.3], [60, 2, -2.3, -1.7], [-58, -34, 1.9, 2.6], [58, -38, -2.6, -1.9], [-17, 61, -0.5, -0.2], [18, 61, 0.2, 0.5]];
      for (const [x, z, a0, a1] of rim) {
        const sp = style.spurs(rng, [x + rng.range(-3, 3), bluffTop(x, z) + rng.range(0, 1.2), z], { n: 1, foot: -4, slope: rng.range(0.95, 1.3), from: Math.min(a0, a1), to: Math.max(a0, a1) });
        for (const r of sp) ridges.push(r);
      }
      const carve = (x, z, h) => {
        let y = Math.max(h, bluffTop(x, z));
        const n = pathB.nearestXZ(x, z);
        if (n.dist < 30) y = Math.min(y, n.y - 8.5 + Math.max(0, n.dist - 9) * 1.4);
        return y;
      };
      const g = Math.sqrt(detail < 1 ? 0.75 : 1);
      const m = await style.mountain({ ridges, x0: -150, x1: 150, z0: -100, z1: 150, nx: Math.round(118 * g), nz: Math.round(100 * g), foot: 0, top: 280, slope: 1.35, carve,
        pigment: { green: 0.11, blue: 0.53, cap: Math.min(1.75, cap(2.4)), speed: 9 } });
      scene.add(m.mesh);
      if (!light) for (const l of m.goldLines(4, 0.6)) goldLines.push(l);
      ranges.push({ mat: m.material, t2: -60, t3: 1e9, top: 50 });
      var bluffH = m.heightAt;
      // stamped trees down its flanks and round its foot
      for (let i = 0; i < Math.round(420 * detail * density); i++) {
        const x = rng.range(-140, 140), z = rng.range(-60, 140), k = kindOf(), s = rng.range(6, 10.5) * (k ? 0.6 : 1);
        const y = bluffH(x, z);
        if (i % 100 === 99) await ctx.yield();
        if (y < 1.2 || (Math.abs(x) < 50 && z < 54 && y > 44) || pathB.distanceTo(x, y + s * 0.5, z) < 12 + s) continue;
        stampList.push([x, y - 0.4, z, s, k]);
      }
    }
    for (let i = 0; i < Math.round(170 * detail); i++) {          // moss dots and grass strokes: the flat of the bluff is drawn on
      const x = rng.range(-56, 56), z = rng.range(-30, 62), n = rng.int(2, 5), big = rng() < 0.3, y0 = bluffH(x, z);
      if (i % 30 === 29) await ctx.yield();
      if (y0 < 40) continue;
      for (let j = 0; j < n; j++) {
        const tx = x + rng.range(-3, 3), tz = z + rng.range(-3, 3), ty = bluffH(tx, tz), s = big ? rng.range(2.2, 3.6) : rng.range(1.0, 1.9), hgt = rng.range(0.7, 1.5), ln = rng.range(-0.4, 0.4);
        if (pathB.distanceTo(tx, ty + 1, tz) < 7.5) continue;
        if (big || j < 2) stampList.push([tx, ty - s * 0.12, tz, s, 0]);
        else B.quad([tx - 0.07, ty - 0.1, tz], [tx + 0.07, ty - 0.1, tz], [tx + ln + 0.02, ty + hgt, tz], [tx + ln - 0.02, ty + hgt, tz], P.ink, { bare: true });
      }
    }
    await ctx.yield();

    // ---- pines: an umber trunk with ink ring-scales, boughs, and every needle cluster a wheel of fourteen strokes
    const cTrunk = wash(0.72), cBough = wash(0.86), pathNow = pathC;
    const pine = (bx, by, bz, H, toward, lx = 0, lz = 0) => {
      const path = bz < 300 ? pathB : pathNow;
      const N = 7, lean = rng.range(-0.14, 0.14) + lx, bend = rng.range(1.5, 3.1) * rng.sign(), r0 = 0.32 + H * 0.016;
      const axis = (t) => [bx + lean * H * t + bend * Math.sin(t * 2.9), by + H * t, bz + lz * H * t + bend * 0.6 * Math.sin(t * 2.3 + 1)];
      const ringAt = (t) => { const c = axis(t), r = r0 * (1 - 0.72 * t), o = []; for (let k = 0; k < 5; k++) { const a = k / 5 * 6.2832; o.push([c[0] + Math.cos(a) * r, c[1], c[2] + Math.sin(a) * r]); } return o; };
      for (let i = 0; i < N; i++) {
        const a = ringAt(i / N), b = ringAt((i + 1) / N), sv = H / N;
        for (let k = 0; k < 5; k++) { const k2 = (k + 1) % 5; B.quad(a[k], a[k2], b[k2], b[k], cTrunk, { uv: [[0.6, i * sv], [1.4, i * sv], [1.4, (i + 1) * sv], [0.6, (i + 1) * sv]], size: [2, H + 2], rule: 0.55 }); }
      }
      const nb = Math.max(4, Math.round(H / 3.4));
      for (let j = 0; j < nb; j++) {
        const t = 0.3 + 0.67 * (j + rng()) / nb, c = axis(t), top = j === nb - 1;
        let ang = rng() * 6.2832; if (rng() < 0.6) ang = toward + rng.range(-0.9, 0.9);
        const L = (top ? 2.5 : rng.range(5.5, 10)) * (1.3 - 0.8 * t), up = rng.range(-0.04, 0.2), dx = Math.cos(ang), dz = Math.sin(ang);
        const seg = 4; let prev = c, w0 = 0.26 * (1 - 0.5 * t) + 0.08;
        for (let s2 = 1; s2 <= seg; s2++) {
          const f = s2 / seg, p = [c[0] + dx * L * f, c[1] + L * (up * f - 0.22 * Math.sin(f * 3.1)), c[2] + dz * L * f], w1 = w0 * (1 - 0.8 * f) + 0.05, wp = w0 * (1 - 0.8 * (f - 1 / seg)) + 0.05;
          if (path.distanceTo(p[0], p[1], p[2]) < 5.2) break;
          if (bz < 100 && Math.atan2(Math.abs(p[0]), p[2] + 10) < 0.36 && Math.atan2(p[1] - 56, Math.hypot(p[0], p[2] + 10)) < 0.44) break;
          B.quad([prev[0], prev[1] - wp, prev[2]], [p[0], p[1] - w1, p[2]], [p[0], p[1] + w1, p[2]], [prev[0], prev[1] + wp, prev[2]], cBough, { bare: true });
          B.quad([prev[0] + dz * wp, prev[1], prev[2] - dx * wp], [p[0] + dz * w1, p[1], p[2] - dx * w1], [p[0] - dz * w1, p[1], p[2] + dx * w1], [prev[0] - dz * wp, prev[1], prev[2] + dx * wp], cBough, { bare: true });
          const nw = top ? 2 : 2 + (s2 > 1 ? 1 : 0);
          for (let q = 0; q < nw; q++) {
            const sz = rng.range(2.3, 3.5) * (top ? 0.9 : 1), wx = p[0] + rng.range(-1.3, 1.3), wy = p[1] + rng.range(-0.2, 0.8), wz = p[2] + rng.range(-1.3, 1.3);
            if (path.distanceTo(wx, wy, wz) < 4.6 + sz * 0.5) continue;
            if (bz < 100) { const az = Math.atan2(Math.abs(wx), wz + 10), el = Math.atan2(wy - 56, Math.hypot(wx, wz + 10)); if (az < 0.38 && el < 0.46 && el > -0.6) continue; }   // the window: between two trunks lies the whole picture
            wheelList.push([wx, wy - 0.32 * sz, wz, sz, rng() < 0.12 ? 1 : 0]);
          }
          prev = p;
        }
      }
    };
    {
      const spots = [[-13, 14], [14.5, 19], [-21, 29], [22, 34], [-28, 44], [30, 49], [-35, 54], [35, 57], [-27, 17], [26, 7], [-40, 38], [40, 28]];
      for (const [x, z] of spots) {
        const px = x + rng.range(-1, 1), pz = z + rng.range(-1.5, 1.5), frame = z > 40 && z < 60;      // four tall ones frame the picture, their crowns above the eye
        pine(px, bluffH(px, pz) - 0.5, pz, rng.range(14, 22) + (frame ? 8 : 0), Math.atan2(rng.range(-6, 6), -px), frame ? -Math.sign(px) * 0.12 : 0);
        await ctx.yield();
      }
    }
    await ctx.yield();
    // ---- ranges. Each is modelled small from ridge polylines and stood in the world scaled by k, so one builder serves a
    // 300 m flank and a wall of peaks 11 km long. o: { cx, cz, foot, k, half, depth, nx, nz, summits: [[mx, my, mz, n]], pigment, t2, t3 }
    const makeRange = async (o) => {
      const k = o.k, ridges = [];
      for (const [mx, my, mz, n, sl] of o.summits) for (const r of style.spurs(o.rng || rng, [mx, my, mz], { n, foot: -4, slope: (o.spurSlope ?? 1.0) * (sl ?? 1), sub: o.sub })) ridges.push(r);
      await ctx.yield();
      const carve = o.keepClear ? (x, z, h) => o.keepClear(o.cx + x * k, o.cz + z * k, h) : undefined;
      const top = o.summits.reduce((a, s) => Math.max(a, s[1]), 0);
      const m = await style.mountain({ ridges, x0: -o.half, x1: o.half, z0: -o.depth, z1: o.depth, nx: o.nx, nz: o.nz, foot: 0, top, slope: o.slope ?? 1.5, carve,
        pigment: { foot: o.foot, top: o.foot + top * k, green: o.green ?? 0.16, blue: o.blue ?? 0.56, speed: o.speed ?? 12, winter: season === 'winter', run: top * 1.25, ...(o.pigment || {}) } });
      m.mesh.scale.setScalar(k); m.mesh.position.set(o.cx, o.foot, o.cz); m.mesh.updateMatrixWorld(true);
      scene.add(m.mesh);
      if (o.gold !== false) for (const l of m.goldLines(o.goldStep ?? 6, 0.6 / k + 0.3, o.goldOrder ?? 2)) goldLines.push({ w: Math.min(1, l.w * (o.goldW ?? 1)), pts: l.pts.map((p) => [o.cx + p[0] * k, o.foot + p[1] * k, o.cz + p[2] * k]) });
      ranges.push({ mat: m.material, t2: o.t2, t3: o.t3, top: o.foot + top * k });
      await ctx.yield();
      return { ...m, heightAt: (x, z) => o.foot + k * m.heightAt((x - o.cx) / k, (z - o.cz) / k) };
    };
    const g2 = detail < 1 ? 0.85 : 1;
    // four near ranges flank the lake, 250 to 400 m tall; the bridge ends at their feet
    const bridgeClear = (x, z, h) => (Math.abs(x) < 512 && Math.abs(z - 265) < 34 ? Math.min(h, -8 + Math.max(0, Math.abs(z - 265) - 13) * 0.9) : h);
    const nearSpec = [[1, 505, 75, 7.5], [-1, 520, 95, 9], [1, 590, 455, 11], [-1, 575, 430, 12.5]];
    for (let i = 0; i < 4; i++) {
      const [sd, ax, az, t2] = nearSpec[i], k = 1.5, Hw = rng.range(250, 400), cx = sd * (ax + rng.range(-20, 30)), cz = az + rng.range(-25, 25);
      const sm = [[rng.range(-20, 20), Hw / k, rng.range(-20, 20), rng.int(6, 8)]];
      const n2 = rng.int(2, 3);
      for (let j = 0; j < n2; j++) { const a = rng() * 6.2832, d = rng.range(70, 125); sm.push([Math.cos(a) * d + sd * 30, Hw / k * rng.range(0.5, 0.8), Math.sin(a) * d, rng.int(4, 6)]); }
      const R = await makeRange({ cx, cz, foot: 0, k, half: 250, depth: 215, nx: Math.round(100 * g2), nz: Math.round(84 * g2), summits: sm, keepClear: bridgeClear,
        pigment: { cap: cap(3), flat: 0.55 }, t2, t3: t2 + 13, speed: 13, gold: !light });
      for (let j = 0; j < Math.round(520 * detail * density); j++) {
        const x = cx + rng.range(-360, 360), z = cz + rng.range(-310, 310), mass = noise.n2(x * 0.011 + 7, z * 0.011) * 0.5 + 0.5, s = rng.range(8, 14), kd = kindOf();
        const y = R.heightAt(x, z);
        if (j % 120 === 119) await ctx.yield();
        if (y < 1.5 || rng() > (y < 12 ? 1 : y < Hw * 0.5 ? 0.7 : 0.25) * (0.15 + 1.4 * mass * mass)) continue;
        for (let q = 0, nq = 1 + Math.floor(mass * 3); q < nq; q++) { const tx = x + (q ? Math.sin(q * 2.4 + j) * 11 : 0), tz = z + (q ? Math.cos(q * 2.4 + j) * 9 : 0), ty = R.heightAt(tx, tz); if (ty > 1.5) stampList.push([tx, ty - 0.5, tz, s, kd]); }
      }
      await ctx.yield();
    }
    // seven far ranges, each an arc of peaks facing the path, each with its foot 55 m higher and its tops higher up the
    // picture than the one in front; no haze: a far range has a thinner coat, no trees and fewer lines
    const farZ = [1150, 1500, 2000, 2800, 3800, 5000, 6500], farElev = [9.2, 11, 12.6, 14.2, 15.7, 17.1, 18.4], farCap = [2.6, 2.45, 2.25, 2.0, 1.7, 1.35, 1.0];
    const farTop = [], mistDefs = [];
    for (let i = 0; i < 7; i++) {
      const z = farZ[i], foot = 55 * (i + 1), topY = 56 + z * Math.tan(farElev[i] * Math.PI / 180), hw = 0.9 * z + 350, k = hw / 470, Hm = (topY - foot) / k;
      const ns = clamp(Math.round(940 / (Hm * 1.05)), 6, 17), sm = [];
      for (let j = 0; j < ns; j++) {
        const mx = -470 + 940 * (j + 0.5 + rng.range(-0.3, 0.3)) / ns, ax = Math.abs(mx) / 470;
        const hf = (0.6 + 0.4 * rng()) * (0.86 + 0.5 * ax * ax) * (i < 3 ? 0.8 + 0.2 * smoothstep(0.05, 0.3, ax) : 1);
        sm.push([mx, Hm * hf, -ax * ax * 150 + rng.range(-22, 22), rng.int(4, 6)]);
      }
      farTop.push(topY);
      // THE FAR RANGES ARE NOT ONE CONE REPEATED. The seed's draws are taken exactly as before (and thrown away), so nothing
      // later in the world moves; the range that is built is drawn from them with a generator of its own: a master peak with
      // lesser ones leaning on it, twin heads, long level screens of rock, a needle here and there.
      for (const [mx, my, mz, n] of sm) style.spurs(rng, [mx, my, mz], { n, foot: -4, slope: 1.05, sub: i < 5 });
      const fr = makeRng(7919 * (i + 1) + Math.floor(sm[0][1] * 13.7) + Math.floor((sm[0][0] + 500) * 3.1)), sm2 = [], cap1 = Hm * 1.12;
      for (let j = 0; j < sm.length; j++) {
        const [mx, my, mz, n] = sm[j], kind = fr(), ax = Math.abs(mx) / 470;
        if (kind < 0.24) {                  // a screen: three or four tops in a row at one height, a long level skyline
          const m = fr.int(3, 4), h = Math.min(cap1, my * fr.range(0.62, 0.8)), sp = fr.range(26, 38), tilt = fr.range(-0.12, 0.12);
          for (let q = 0; q < m; q++) sm2.push([mx + (q - (m - 1) / 2) * sp, h * (1 + tilt * (q - (m - 1) / 2) + fr.range(-0.03, 0.03)), mz + fr.range(-8, 8), 3, 1.35]);
        } else if (kind < 0.44) {           // a needle: tall, narrow, steep
          sm2.push([mx, Math.min(cap1, my * fr.range(1.05, 1.22)), mz, 4, 1.7], [mx + fr.sign() * fr.range(20, 30), my * fr.range(0.5, 0.62), mz + fr.range(-6, 6), 3, 1.5]);
        } else if (kind < 0.66) {           // twin heads on one base
          const d = fr.range(22, 34), sg = fr.sign();
          sm2.push([mx - sg * d * 0.5, Math.min(cap1, my * fr.range(0.95, 1.1)), mz, n, 1], [mx + sg * d * 0.5, my * fr.range(0.74, 0.88), mz + fr.range(-10, 10), 4, 1.15]);
        } else if (kind < 0.84) {           // a low broad back
          sm2.push([mx, my * fr.range(0.45, 0.6), mz + fr.range(-15, 15), n, 0.62]);
        } else sm2.push([mx, Math.min(cap1, my * (1 + 0.1 * ax)), mz, n, 1]);          // the cone, as it was
      }
      await makeRange({ cx: 0, cz: z, foot, k, half: 520, depth: Math.min(260, Hm / 1.2 + 190), nx: Math.round(150 * g2), nz: Math.round(34 * g2), summits: sm2, rng: fr, sub: i < 5, slope: 1.45, spurSlope: 1.05,
        pigment: { cap: cap(farCap[i]), thin: thin * (i === 6 ? 0.42 : 1 - 0.07 * i), flat: 1 }, speed: 55 + 6 * i, t2: 28.5 + 1.2 * i, t3: 32 + 1.3 * i,
        gold: !(light && true), goldStep: 8, goldOrder: i < 2 ? 1 : 0, goldW: 1 });
      mistDefs.push({ z: z - Math.min(260, Hm / 1.2 + 190) * k * 0.45, y0: foot - 60 - 10 * i, h: (topY - foot) * 0.5 + 60, hw: hw * 1.25, drift: (i % 2 ? -1 : 1) * 0.012 * z / (hw * 2.5) });      // the same slide across the picture at every distance
    }
    // mist: scalloped bands of the same bare silk, sliding sideways, swallowing the feet of the ranges; drawn far to near
    for (let i = mistDefs.length - 1; i >= 0; i--) {
      const d = mistDefs[i], lobe = 0.05 * d.z, mm = new THREE.Mesh(new THREE.PlaneGeometry(d.hw * 2, d.h), style.silk('mist', { drift: d.drift, scallops: Math.PI * 2 * d.hw / lobe, edge: 0.42 * lobe / d.h }));
      mm.position.set(0, d.y0 + d.h / 2, d.z); mm.rotation.y = Math.PI; mm.renderOrder = 10 - i; scene.add(mm);
    }
    await ctx.yield();
    // ---- built things, small and ruled: the hamlet on the far shore right of the fall, the hermit's hut, the terrace pines
    const cWall = P.shell, cRoof = wash(0.68), cPost = P.vermilion, cInk = P.ink.clone().multiplyScalar(0.95), cThatch = wash(0.34);
    const house = (x, y, z, w, d, rot, thatch) => {
      const hgt = 2.7, cs = Math.cos(rot), sn = Math.sin(rot), pt = (a, b, c) => [x + a * cs + c * sn, y + b, z - a * sn + c * cs];
      B.box(x, y + hgt / 2 - 0.4, z, w, hgt + 0.8, d, cWall, { rotY: rot, rule: -w / 3, skip: 'tb' });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = pt(sx * w / 2, 0, sz * d / 2); B.box(p[0], y + hgt / 2 - 0.4, p[2], 0.3, hgt + 0.8, 0.3, cPost, { rotY: rot, skip: 'tb', bare: true }); }
      const e = 0.7, rh = 1.9, col = thatch ? cThatch : cRoof, sl = Math.hypot(d / 2 + e, rh);
      for (const sg of [-1, 1]) B.quad(pt(-w / 2 - e, hgt - 0.25, sg * (d / 2 + e)), pt(w / 2 + e, hgt - 0.25, sg * (d / 2 + e)), pt(w / 2 + e * 0.4, hgt + rh, 0), pt(-w / 2 - e * 0.4, hgt + rh, 0), col, { rule: thatch ? -0.35 : -0.6, uv: [[0, 0], [w + 2 * e, 0], [w + 2 * e, sl], [0, sl]], size: [w + 2 * e, sl] });
      for (const sg of [-1, 1]) B.tri(pt(sg * w / 2, hgt, -d / 2), pt(sg * w / 2, hgt, d / 2), pt(sg * w / 2, hgt + rh - 0.2, 0), cWall);
      const r0 = pt(0, hgt + rh, 0); B.box(r0[0], r0[1], r0[2], w + e, 0.3, 0.3, cInk, { rotY: rot, bare: true });
    };
    {
      let placed = 0;
      for (let i = 0; i < 400 && placed < 30; i++) {
        const row = placed % 3, x = -(46 + (placed / 30) * 150 + rng.range(-4, 4)), z0 = 350 + row * 9 + rng.range(-2, 2);
        let z = z0, y = groundHero(x, z);
        for (let s2 = 0; s2 < 14 && y < 2.2; s2++) { z += 2.5; y = groundHero(x, z); }
        if (y < 2.2 || y > 26) continue;
        const yb = Math.min(y, groundHero(x - 3, z), groundHero(x + 3, z), groundHero(x, z - 3));
        house(x, yb + 0.3, z, rng.range(4.6, 5.6), rng.range(3.4, 4.2), rng.range(-0.25, 0.25), rng() < 0.2);
        if (rng() < 0.5 * density) stampList.push([x + rng.range(-5, 5), y + 1, z + 4, rng.range(5, 7.5), season === 'spring' && rng() < 0.4 ? 2 : kindOf()]);
        placed++;
      }
    }
    const hutW = hero.toWorld(hero.anchors.hutSeat);
    {
      const y = groundHero(hutW.x, hutW.z);
      // three walls and a thatch roof, open toward the pool; half as large again as a hamlet house: it is the subject of the ledge
      const x = hutW.x, z = hutW.z, w = 7.6, d = 5.8, hgt = 3.7;
      B.box(x, y + hgt / 2, z + d / 2, w, hgt, 0.2, cWall, { rule: -1.9 }); B.box(x - w / 2, y + hgt / 2, z, 0.2, hgt, d, cWall, { rule: -1.9 }); B.box(x + w / 2, y + hgt / 2, z, 0.2, hgt, d, cWall, { rule: -1.9 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box(x + sx * w / 2, y + hgt / 2, z + sz * d / 2, 0.4, hgt, 0.4, cPost, { skip: 'tb', bare: true });
      const e = 1.2, rh = 3.2, sl = Math.hypot(d / 2 + e, rh);
      for (const sg of [-1, 1]) B.quad([x - w / 2 - e, y + hgt - 0.4, z + sg * (d / 2 + e)], [x + w / 2 + e, y + hgt - 0.4, z + sg * (d / 2 + e)], [x + w / 2 + 0.4, y + hgt + rh, z], [x - w / 2 - 0.4, y + hgt + rh, z], cThatch, { rule: -0.42, uv: [[0, 0], [w + 2 * e, 0], [w + 2 * e, sl], [0, sl]], size: [w + 2 * e, sl] });
      for (const sg of [-1, 1]) B.tri([x + sg * w / 2, y + hgt, z - d / 2], [x + sg * w / 2, y + hgt, z + d / 2], [x + sg * w / 2, y + hgt + rh - 0.3, z], cWall);
      B.box(x, y + hgt + rh, z, w + 1.4, 0.42, 0.42, cInk, { bare: true });
      B.box(x + 0.9, y + 1.2, z - 0.4, 0.22, 2.1, 0.22, cInk, { bare: true }); B.box(x + 0.9, y + 2.4, z - 0.4, 1.0, 0.2, 1.0, cThatch, { bare: true });      // the hermit: one stroke and a hat dot
      for (let i = 0; i < 7; i++) { const a = rng.range(-2.6, 0.4), r = rng.range(5, 10); const tx = x + Math.cos(a) * r, tz = z + 3 - Math.sin(a) * r * 0.6; stampList.push([tx, groundHero(tx, tz) + 0.2, tz, rng.range(2.6, 3.8), season === 'autumn' ? (i % 2 ? 1 : 0) : 2]); }
    }
    await ctx.yield();
    for (const a of hero.anchors.terracePines) {
      const w = hero.toWorld(a), sx = Math.sign(w.x) || 1, px = w.x + sx * 1.5;
      pine(px, groundHero(px, w.z) - 0.4, w.z, rng.range(17, 21), sx > 0 ? Math.PI : 0);
    }
    for (const [x, z, hgt] of [[-17, 516, 25], [21, 519, 28], [-31, 530, 19], [-15, 388, 21], [18, 390, 19], [-30, 393, 15], [-23, 449, 15], [22, 452, 17]]) pine(x, groundHero(x, z) - 0.4, z, hgt, x > 0 ? Math.PI : 0);   // pines on the third lip, rising into the sky as we climb
    await ctx.yield();
    // pines of the gorge: rooted at the foot of either wall and on the pool ledges, tall enough that their tiers of wheels
    // hang at the height of the eye as we climb, leaning in over the fall
    for (const [z, side, tall] of [[357, -1, 0], [373, 1, 1], [404, 1, 0], [417, -1, 1], [431, 1, 1], [462, -1, 0], [474, 1, 1], [488, -1, 1], [499, 1, 0]]) {
      const n = pathC.nearestXZ(0, z), fl = groundHero(0, z);
      let x = side * 13; while (Math.abs(x) < 46 && groundHero(x, z) < fl + (tall ? 12 : 6)) x += side * 1.5;
      x += side * rng.range(0.5, 3);
      const by = groundHero(x, z) - 0.6, H = clamp(n.y - by + rng.range(0, 6), 14, 25);
      if (Math.abs(x - hutW.x) < 9 && Math.abs(z - hutW.z) < 9) continue;
      pine(x, by, z, H, side > 0 ? Math.PI : 0, -side * rng.range(0.16, 0.32), rng.range(-0.1, 0.1));
      await ctx.yield();
    }
    // the terrace is drawn on: moss dots, small stamped shrubs and grass strokes either side of the stream
    for (let i = 0; i < Math.round(150 * detail); i++) {
      const x = rng.sign() * rng.range(5.5, 26), z = rng.range(512, 622), y = groundHero(x, z), big = rng() < 0.25, s = big ? rng.range(2.4, 3.8) : rng.range(1.0, 1.9), hgt = rng.range(0.7, 1.5), ln = rng.range(-0.4, 0.4);
      const y0 = groundHero0(x, z), here = y < 163.5 && y > 157;
      if (y0 > 163.5 || y0 < 157) continue;
      if (i % 3) { const kd = !big && rng() < 0.2 ? kindOf() : 0; if (here) stampList.push([x, y - s * 0.12, z, s, kd]); }
      else if (here) for (let j = 0; j < 3; j++) { const tx = x + j * 0.5 - 0.5, l2 = ln + (j - 1) * 0.25; B.quad([tx - 0.07, y - 0.1, z], [tx + 0.07, y - 0.1, z], [tx + l2 + 0.02, y + hgt, z], [tx + l2 - 0.02, y + hgt, z], P.ink, { bare: true }); }
    }
    await ctx.yield();
    // shore reeds: single ink strokes along the near water's edge, and the lesser strokes of the scene
    for (let i = 0; i < Math.round(160 * detail); i++) {
      const front = i % 2 === 0, x = rng.range(-150, 150), z = front ? rng.range(64, 132) : rng.range(340, 356), hgt = rng.range(1.6, 3.4), ln = rng.range(-0.5, 0.5);
      const y = front ? bluffH(x, z) : groundHero(x, z);
      if (y > 2.5 || y < -3 || Math.abs(x) < 12) continue;
      B.quad([x - 0.09, 0, z], [x + 0.09, 0, z], [x + ln + 0.03, hgt, z], [x + ln - 0.03, hgt, z], cInk, { bare: true });
    }
    await ctx.yield();
    // ---- THE WATER IS FURNISHED, as the scroll furnishes it: rocks with their own blue-green caps, reed islets, a long plank
    // bridge with a pavilion, small craft and waterfowl, near the lens as well as far. All of it is drawn with its own
    // generator (wr), so that no draw of the world's seed moves.
    let wseed = (Math.floor((creases[0] + 2) * 1e6) ^ 0x9e3779b9) >>> 0;
    const wr = () => { wseed = (wseed + 0x6D2B79F5) >>> 0; let t = wseed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const wrr = (a, b) => a + (b - a) * wr();
    const cFoot = wash(0.6), cMoss = P.malachite, cCap = season === 'winter' ? P.shell : P.azurite, cPlank = wash(0.4), cMat = wash(0.24);
    // a rock: a cluster of tapered five-sided columns, umber at the waterline, malachite above, a cap of azurite; ink on every arris
    const rock = (x, y0, z, H, R, n) => {
      for (let c = 0; c < n; c++) {
        const a0 = wr() * 6.2832, d = c ? R * wrr(0.45, 0.95) : 0, cx = x + Math.cos(a0) * d, cz = z + Math.sin(a0) * d * 0.7;
        const h = H * (c ? wrr(0.35, 0.8) : 1), r = R * (c ? wrr(0.4, 0.7) : 0.62), tw = wr() * 6.2832, lx = wrr(-0.25, 0.25) * h, lz = wrr(-0.2, 0.2) * h;
        const lev = [[0, 1.08], [0.42, 0.9], [0.78, 0.6], [1, 0.22]], cols = [cFoot, cMoss, cCap], ring = [];
        for (let l = 0; l < 4; l++) { const o = []; for (let k = 0; k < 5; k++) { const a = tw + k / 5 * 6.2832 + l * 0.12, rr = r * lev[l][1] * (l ? wrr(0.8, 1.15) : 1), f = lev[l][0];
          o.push([cx + Math.cos(a) * rr + lx * f, y0 + h * (f + (l === 1 || l === 2 ? wrr(-0.09, 0.09) : 0)) - (l ? 0 : 0.3), cz + Math.sin(a) * rr + lz * f]); } ring.push(o); }
        for (let l = 0; l < 3; l++) for (let k = 0; k < 5; k++) { const k2 = (k + 1) % 5, w = 2 * r * lev[l][1] * 0.59;
          B.quad(ring[l][k], ring[l][k2], ring[l + 1][k2], ring[l + 1][k], cols[l], { uv: [[0, 50], [w, 50], [w, 50], [0, 50]], size: [w, 100] }); }
        const top = [cx + lx, y0 + h * 1.04, cz + lz];
        for (let k = 0; k < 5; k++) B.tri(ring[3][k], ring[3][(k + 1) % 5], top, cCap);
      }
    };
    const reed = (x, y, z, hgt) => { const ln = wrr(-0.5, 0.5); B.quad([x - 0.08, y, z], [x + 0.08, y, z], [x + ln + 0.03, y + hgt, z], [x + ln - 0.03, y + hgt, z], cInk, { bare: true });
      if (wr() < 0.5) B.quad([x + ln - 0.1, y + hgt * 0.8, z], [x + ln + 0.1, y + hgt * 0.8, z], [x + ln * 1.15 + 0.06, y + hgt * 1.08, z], [x + ln * 1.15 - 0.06, y + hgt * 1.08, z], cFoot, { bare: true }); };
    // a reed islet: a low umber bar with a malachite back, a rock or two, shrubs and a fringe of ink reeds
    const islets = [];
    const islet = (x, z, r, rocks) => {
      const N = 11, o0 = [], o1 = [], sq = wrr(0.45, 0.7), rot = wrr(-0.5, 0.5), cs = Math.cos(rot), sn = Math.sin(rot);
      const at = (a, rr, y) => { const px = Math.cos(a) * rr, pz = Math.sin(a) * rr * sq; return [x + px * cs + pz * sn, y, z - px * sn + pz * cs]; };
      for (let k = 0; k < N; k++) { const a = k / N * 6.2832, j = wrr(0.78, 1.15); o0.push(at(a, r * j, -0.15)); o1.push(at(a + 0.1, r * j * wrr(0.55, 0.72), 0.55)); }
      const mid = [x, 0.95, z];
      for (let k = 0; k < N; k++) { const k2 = (k + 1) % N;
        B.quad(o0[k], o0[k2], o1[k2], o1[k], cFoot, { uv: [[50, 0.15], [50, 0.15], [50, 3], [50, 3]], size: [100, 100] });
        B.quad(o1[k], o1[k2], mid, mid, cMoss, { uv: [[50, 0], [50, 0], [50, 9], [50, 9]], size: [100, 100] }); }
      for (let k = 0; k < Math.round(r * 2.2); k++) { const a = wr() * 6.2832, p = at(a, r * wrr(0.75, 1.12), 0); reed(p[0], 0, p[2], wrr(1.5, 3.3)); }
      for (let k = 0; k < rocks; k++) { const a = wr() * 6.2832, p = at(a, r * wrr(0.2, 0.75), 0); rock(p[0], 0.2, p[2], wrr(0.28, 0.6) * r + 1, wrr(0.16, 0.3) * r + 0.6, 2 + Math.floor(wr() * 3)); }
      for (let k = 0; k < 1 + Math.floor(r / 5); k++) { const a = wr() * 6.2832, p = at(a, r * wrr(0.1, 0.5), 0), s = wrr(2.6, 4.6); stampList.push([p[0], 0.5, p[2], s, season === 'spring' && wr() < 0.3 ? 2 : (wr() < (season === 'autumn' ? 0.34 : 0.1) ? 1 : 0)]); }
      islets.push([x, z, r]);
    };
    for (const [x, z, r, n] of [[-21, 205, 9, 2], [17, 228, 6, 2], [48, 152, 12, 3], [-70, 128, 14, 3], [-13, 146, 5, 1], [95, 215, 11, 2], [-112, 232, 12, 3], [31, 106, 7, 2], [-38, 98, 8, 1],
      [150, 160, 15, 3], [-170, 185, 16, 3], [70, 96, 9, 1], [-120, 100, 10, 2], [210, 240, 14, 2], [-230, 130, 15, 2], [-15, 300, 4.5, 1], [26, 318, 6, 2]]) { islet(x, z, r, n); await ctx.yield(); }
    await ctx.yield();
    // lone rocks standing in the water, some of them close beside the course
    for (const [x, z, H, R] of [[-10, 236, 4.2, 2.2], [11, 256, 3.2, 1.9], [-9.5, 284, 3.6, 1.8], [12, 207, 2.6, 1.6], [-19, 170, 6.5, 3], [24, 178, 5, 2.6], [-45, 160, 8, 3.6], [62, 196, 9, 4], [-84, 190, 7, 3.4], [120, 130, 11, 5], [-150, 240, 10, 4.5], [38, 242, 4, 2.2], [-34, 246, 5, 2.4], [7, 118, 4.5, 2.4], [-60, 300, 6, 3], [75, 305, 7, 3.2]])
      { rock(x, -0.1, z, H * wrr(0.85, 1.15), R, 2 + Math.floor(wr() * 3)); await ctx.yield(); }
    await ctx.yield();
    // the long plank bridge: a zigzag of ruled planks on ink legs from islet to islet, a small pavilion at its knee, two travellers
    const figure = (x, y, z, s = 1, load) => { B.quad([x - 0.13 * s, y, z], [x + 0.13 * s, y, z], [x + 0.11 * s, y + 1.5 * s, z], [x - 0.11 * s, y + 1.5 * s, z], cInk, { bare: true });
      B.quad([x - 0.42 * s, y + 1.5 * s, z], [x + 0.42 * s, y + 1.5 * s, z], [x + 0.1 * s, y + 1.78 * s, z], [x - 0.1 * s, y + 1.78 * s, z], cThatch, { bare: true });
      B.quad([x, y + 0.4 * s, z - 0.13 * s], [x, y + 0.4 * s, z + 0.13 * s], [x, y + 1.5 * s, z + 0.11 * s], [x, y + 1.5 * s, z - 0.11 * s], cInk, { bare: true });
      if (load) B.box(x + 0.35 * s, y + 1.1 * s, z, 0.5 * s, 0.5 * s, 0.4 * s, P.vermilion, { bare: true }); };
    {
      const pts = [[-27, 207.5], [-47, 212], [-61, 206], [-79, 221], [-103, 229]], dy = 1.55;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, rot = Math.atan2(-uz, ux);
        B.box((a[0] + b[0]) / 2, dy, (a[1] + b[1]) / 2, L + 1.2, 0.22, 2.1, cPlank, { rotY: rot, rule: -0.62 });
        B.box((a[0] + b[0]) / 2 - uz * 0.95, dy + 0.95, (a[1] + b[1]) / 2 + ux * 0.95, L + 1.2, 0.09, 0.09, cInk, { rotY: rot, bare: true });
        for (let s2 = 0; s2 <= L; s2 += 3.4) for (const sd of [-1, 1]) { const px = a[0] + ux * s2 - uz * 0.95 * sd, pz = a[1] + uz * s2 + ux * 0.95 * sd;
          B.box(px, (sd < 0 ? dy + 1 : dy) / 2 - 0.25, pz, 0.16, (sd < 0 ? dy + 1 : dy) + 0.5, 0.16, cInk, { bare: true, skip: 'tb' }); }
      }
      const [kx, kz] = pts[2], w = 5.2, py = dy + 0.12;
      B.box(kx, py - 0.1, kz, w, 0.3, w, cPlank, { rule: 0.62 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { B.box(kx + sx * w * 0.42, py + 1.35 - 1.2, kz + sz * w * 0.42, 0.26, 2.7 + 2.4, 0.26, cPost, { bare: true, skip: 'tb' }); }
      B.box(kx, py + 0.55, kz - w * 0.42, w * 0.84, 0.08, 0.08, cPost, { bare: true }); B.box(kx, py + 0.55, kz + w * 0.42, w * 0.84, 0.08, 0.08, cPost, { bare: true });
      const e = w / 2 + 1.1, ry = py + 2.6, ap = [kx, ry + 2.5, kz], cn = [[-e, -e], [e, -e], [e, e], [-e, e]].map(([a, b]) => [kx + a, ry - 0.25, kz + b]);
      for (let k = 0; k < 4; k++) { const a = cn[k], b = cn[(k + 1) % 4], sl = Math.hypot(e, 2.75); B.quad(a, b, ap, ap, cRoof, { rule: 0.5, uv: [[0, 0], [2 * e, 0], [e, sl], [e, sl]], size: [2 * e, 100] }); }
      B.box(kx, ry + 2.7, kz, 0.3, 0.7, 0.3, cInk, { bare: true });
      figure(kx + 0.6, py + 0.05, kz + 0.3, 1.15); figure(-39, dy + 0.11, 210.5, 1.15, true); figure(-71, dy + 0.11, 214.6, 1.15); figure(-90, dy + 0.11, 224.8, 1.15, true);
    }
    await ctx.yield();
    // ---- THE CLIFFS ARE DRAWN ON, as the scroll draws them: small pines along every ledge, a hut or two, a zigzag path with
    // travellers, and side falls as drawn ribbons of bare silk. (wr only: no draw of the world's seed moves.)
    const ledgePine = (x, y, z, H, lean) => {
      const tx = x + lean * H * 0.3, kx = x + lean * H * 0.12 + wrr(-0.4, 0.4), w0 = 0.13 + H * 0.012;
      for (const [a, b, ya, yb] of [[x, kx, 0, 0.55], [kx, tx, 0.55, 1]]) { B.quad([a - w0, y + ya * H, z], [a + w0, y + ya * H, z], [b + w0 * 0.6, y + yb * H, z], [b - w0 * 0.6, y + yb * H, z], cTrunk, { bare: true });
        B.quad([a, y + ya * H, z - w0], [a, y + ya * H, z + w0], [b, y + yb * H, z + w0 * 0.6], [b, y + yb * H, z - w0 * 0.6], cTrunk, { bare: true }); }
      const nw = 3 + Math.floor(wr() * 3);
      for (let q = 0; q < nw; q++) { const f = 0.5 + 0.5 * (q + wr()) / nw, sz = wrr(1.7, 2.7) * (1.25 - 0.4 * f), cx = x + lean * H * 0.3 * f * f + wrr(-1, 1) * (1.1 - f) * 2.2 + lean * (1 - f) * 1.6;
        wheelList.push([cx, y + H * f - 0.3 * sz, z + wrr(-0.9, 0.9), sz, wr() < 0.1 ? 1 : 0]); }
    };
    const ledges = [];
    for (let zi = 0; zi < 66; zi++) {
      const z = 350 + zi * 2.6 + wrr(-0.6, 0.6), fl = groundHero(3, z);
      for (const side of [-1, 1]) {
        let hp = groundHero(3 + side * 10, z), sp = 0;
        for (let x = 11.3; x < 96; x += 1.3) {
          const wx = 3 + side * x, h = groundHero(wx, z), sl = Math.abs(h - hp) / 1.3;
          if (sl < 0.5 && sp > 1.1 && h > fl + 5 && h < fl + 85 && wr() < 0.8) ledges.push([wx + side * 0.6, h, z, side, h - fl]);
          sp = sl; hp = h;
        }
      }
      if (zi % 22 === 21) await ctx.yield();
    }
    const taken = [];
    for (const [x, y, z, side, up] of ledges) {
      if (Math.hypot(x - hutW.x, z - hutW.z) < 11 || pathC.distanceTo(x, y + 4, z) < 9.5) continue;
      if (taken.some((t) => Math.hypot(t[0] - x, t[1] - z) < 4.2)) continue;
      taken.push([x, z]);
      if (wr() < 0.62 * Math.min(1, detail + 0.2)) ledgePine(x, y - 0.3, z, wrr(4.5, 8.5), -side * wrr(0.1, 0.5));
      else { const s = wrr(2.6, 4.4); stampList.push([x, y - 0.2, z, s, season === 'spring' && wr() < 0.2 ? 2 : (wr() < (season === 'autumn' ? 0.34 : 0.1) ? 1 : 0)]); if (wr() < 0.5) stampList.push([x + side * 1.2, y - 0.2, z + wrr(-2, 2), s * 0.7, 0]); }
    }
    await ctx.yield();
    // trees massed on the faces themselves, as the scroll masses them: rows of stamped clusters in the clefts and across the
    // buttresses, and small pines that grow straight out of the rock, leaning over the gorge
    {
      const footX = [];
      for (let zi = 0; zi <= 44; zi++) { const z = 350 + zi * 4, fl = groundHero(3, z), o = [0, 0]; for (const sd of [0, 1]) { let xf = 11; while (xf < 60 && groundHero(3 + (sd ? 1 : -1) * xf, z) < fl + 2.5) xf += 1; o[sd] = xf; } footX.push(o); }
      await ctx.yield();
      const nT = Math.round(1300 * Math.min(1, detail + 0.15) * density);
      for (let i = 0; i < nT; i++) {
        const z = wrr(352, 524), side = wr() < 0.5 ? -1 : 1, xf = footX[Math.min(44, Math.round((z - 350) / 4))][side > 0 ? 1 : 0], out = 2 + 62 * wr() * wr(), x = 3 + side * (xf + out), y = groundHero(x, z);
        const mass = noise.n2(x * 0.06 + 3, z * 0.06 + y * 0.03), pineHere = i % 6 === 0;
        if (i % 450 === 449) await ctx.yield();
        if (y < groundHero(3, z) + 3 || Math.hypot(x - hutW.x, z - hutW.z) < 9 || pathC.distanceTo(x, y + 3, z) < (pineHere ? 10.5 : 8.5)) continue;
        if (pineHere) { if (!taken.some((t) => Math.hypot(t[0] - x, t[1] - z) < 5)) { taken.push([x, z]); ledgePine(x, y - 0.4, z, wrr(4.5, 9), -side * wrr(0.25, 0.6)); } continue; }
        if (mass < -0.3 && wr() < 0.6) continue;
        const s = wrr(2.8, 5.2) * (out > 30 ? 1.5 : 1), kd = season === 'spring' && wr() < 0.08 ? 2 : (wr() < (season === 'autumn' ? 0.34 : 1 / 12) ? 1 : 0);
        stampList.push([x - side * 0.5, y - 0.3, z, s, kd]);
        if (mass > 0.1) { const z2 = z + wrr(-3, 3), x2 = x + side * wrr(1, 3.5); stampList.push([x2 - side * 0.5, groundHero(x2, z2) - 0.3, z2, s * wrr(0.6, 0.9), 0]); }
      }
    }
    await ctx.yield();
    // the pool ledges are drawn on like the terrace: moss dots, small shrubs and grass strokes on every level floor
    for (let i = 0; i < Math.round(700 * detail); i++) {
      const x = 3 + (wr() < 0.5 ? -1 : 1) * wrr(6.5, 40), z = wrr(384, 514), y = groundHero(x, z), fl = groundHero(3, z);
      if (i % 350 === 349) await ctx.yield();
      if (y > fl + 10 || y < fl + 0.25 || Math.abs(groundHero(x + 1.2, z) - y) > 0.55 || Math.abs(groundHero(x, z + 1.2) - y) > 0.7 || pathC.distanceTo(x, y + 1, z) < 6 || Math.hypot(x - hutW.x, z - hutW.z) < 6) continue;
      if (i % 3) stampList.push([x, y - 0.15, z, i % 7 === 0 ? wrr(2.2, 3.4) : wrr(1.0, 1.9), wr() < 0.12 ? (season === 'spring' ? 2 : 1) : 0]);
      else for (let j = 0; j < 3; j++) { const tx = x + j * 0.5 - 0.5, l2 = wrr(-0.4, 0.4) + (j - 1) * 0.25, hg = wrr(0.7, 1.5); B.quad([tx - 0.07, y - 0.1, z], [tx + 0.07, y - 0.1, z], [tx + l2 + 0.02, y + hg, z], [tx + l2 - 0.02, y + hg, z], P.ink, { bare: true }); }
    }
    await ctx.yield();
    // two more huts on the widest ledges, thatched, each with a blossom or two
    { let n = 0; for (const [x, y, z, side, up] of ledges) { if (n >= 2 || up < 14 || Math.abs(z - (n ? 478 : 398)) > 7 || Math.abs(x - 3) < 24 || Math.abs(x - 3) > 44) continue;
        house(x + side * 1.2, y + 0.3, z, 3.9, 2.9, side * 0.35, true); figure(x - side * 1.4, y, z + 1.2, 1.1); stampList.push([x + side * 3, y + 0.6, z - 2.5, 3.6, season === 'autumn' ? 1 : 2]); n++; } }
    // the zigzag path up the wall, a pale line of bare silk between ink edges, and four travellers on it
    for (const [z0, side, o0, o1] of [[487, -1, 3.5, 30], [414, 1, 4, 27]]) {
      const fl = groundHero(3, z0); let xf = 12; while (xf < 60 && groundHero(3 + side * xf, z0) < fl + 2.5) xf += 1;
      const legs = 5, per = 16, pt = (t) => { const k = t * legs, leg = Math.floor(k), f = k - leg, zz = z0 + (leg % 2 ? 1 - f : f) * 13 - 6.5, out = xf + lerp(o0, o1, t) - 2, x = 3 + side * out; return [x - side * 0.45, groundHero(x, zz) + 0.25, zz]; };
      let a = pt(0);
      for (let i = 1; i <= legs * per; i++) { const b = pt(i / (legs * per));
        B.quad([a[0], a[1] - 0.15, a[2]], [b[0], b[1] - 0.15, b[2]], [b[0], b[1] + 0.5, b[2]], [a[0], a[1] + 0.5, a[2]], P.silk, { uv: [[50, 0], [50, 0], [50, 0.65], [50, 0.65]], size: [100, 0.65] });
        if (i % 17 === 9) figure(b[0] - side * 0.3, b[1] + 0.4, b[2], 1.25, i % 34 === 9);
        a = b; }
    }
    // side falls: pale ribbons ruled with ink threads, draped down the wall from a ledge to the pool (drawn in the flat
    // material: a program of their own cost half a second of compiling)
    {
      const cFall = P.silk;
      for (const [z0, side, o1, W] of [[402, -1, 30, 1.9], [466, 1, 34, 2.1], [497, -1, 26, 1.7], [372, 1, 24, 1.7]]) {
        const fl = groundHero(3, z0); let xf = 12; while (xf < 60 && groundHero(3 + side * xf, z0) < fl + 2.5) xf += 1;
        const n = Math.round((o1 + 2) / 0.9); let pa = null, pb = null, run = 0;
        for (let i = 0; i <= n; i++) { const out = xf - 2 + (o1 + 2) * i / n, x = 3 + side * out, zz = z0 + Math.sin(out * 0.21) * 0.5, t = i / n, w = W * (0.55 + 0.45 * (1 - t));
          const y = groundHero(x, zz) + 0.3, a = [x - side * 0.5, Math.max(groundHero(x, zz - w / 2) + 0.3, y), zz - w / 2], b2 = [x - side * 0.5, Math.max(groundHero(x, zz + w / 2) + 0.3, y), zz + w / 2];
          if (pa) { const L = Math.hypot(a[0] - pa[0], a[1] - pa[1], a[2] - pa[2]); B.quad(pa, pb, b2, a, cFall, { rule: -0.42, uv: [[0, 500 + run], [W, 500 + run], [W, 500 + run + L], [0, 500 + run + L]], size: [W, 2000] }); run += L; }
          pa = a; pb = b2; }
      }
    }
    await ctx.yield();
    // ---- THE ISLET WE FLY ROUND: a stack of lake rock 31 m tall in the middle of the half circle, drawn like the lake rocks
    // (umber at the waterline, malachite, a cap of azurite, ink on every arris) but in six tiers and with companions, a reed bar
    // at its foot, a shrine on the bar, pines leaning from its shoulders. Its own generator: no other draw moves.
    {
      let cs2 = 0x51ed270b; const cr = () => { cs2 = (cs2 + 0x6D2B79F5) >>> 0; let t = cs2; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      const crr = (a, b) => a + (b - a) * cr();
      // its coats follow the colourway: solid, or (the light colourway) a thin stain of each pigment over the silk
      // (the thin blue is matched by eye to the peak's: #4280AC on screen, carried through the same correction as the silk)
      const t0 = new THREE.Color('#4280AC'), s0 = new THREE.Color(pal[0]), thinBlue = hour === 'night' ? P.silk.clone().lerp(P.azurite, 0.78) : new THREE.Color(t0.r * P.silk.r / Math.max(0.02, s0.r), t0.g * P.silk.g / Math.max(0.02, s0.g), t0.b * P.silk.b / Math.max(0.02, s0.b));
      const gMoss = light ? P.silk.clone().lerp(P.malachite, 0.7) : cMoss, gCap = season === 'winter' ? P.shell : light ? thinBlue : P.azurite, gFoot = light ? wash(0.4) : cFoot;
      const cMossD = gMoss.clone().lerp(P.ink, light ? 0.12 : 0.2);        // the coat pooled on every other facet
      const crag = (x, z, H, R, lx, lz) => {
        const tw = cr() * 6.2832, NS = 6, lev = [[0, 1.1], [0.14, 0.97], [0.36, 0.86], [0.58, 0.7], [0.76, 0.52], [0.9, 0.33], [1, 0.14]], ring = [];
        for (let l = 0; l < lev.length; l++) { const o = [], f = lev[l][0]; for (let k = 0; k < NS; k++) { const a = tw + k / NS * 6.2832 + l * 0.17, rr = R * lev[l][1] * (l ? crr(0.82, 1.14) : 1);
          o.push([x + Math.cos(a) * rr + lx * H * f * f, H * (f + (l > 0 && l < 6 ? crr(-0.035, 0.035) : 0)) - (l ? 0 : 0.3), z + Math.sin(a) * rr * 0.8 + lz * H * f * f]); } ring.push(o); }
        for (let l = 0; l < lev.length - 1; l++) for (let k = 0; k < NS; k++) { const k2 = (k + 1) % NS, f = (lev[l][0] + lev[l + 1][0]) / 2, w = 2 * R * lev[l][1] * 0.5;
          B.quad(ring[l][k], ring[l][k2], ring[l + 1][k2], ring[l + 1][k], f < 0.1 ? gFoot : f < 0.72 + 0.09 * Math.sin(k * 2.3 + l) ? (k % 2 ? gMoss : cMossD) : gCap, { uv: [[0, 50], [w, 50], [w, 50], [0, 50]], size: [w, 100] }); }
        const top = [x + lx * H, H * 1.03, z + lz * H]; for (let k = 0; k < NS; k++) B.tri(ring[6][k], ring[6][(k + 1) % NS], top, gCap);
        // hemp-fibre strokes: short tapered ink strokes down every facet below the cap, a little proud of the rock
        if (H > 9) for (let l = 0; l < 4; l++) for (let k = 0; k < NS; k++) { const k2 = (k + 1) % NS, a = ring[l][k], b = ring[l][k2], c = ring[l + 1][k2], d = ring[l + 1][k];
          for (let q = 0; q < 3; q++) { const s0 = crr(0.18, 0.82), t0 = crr(0.5, 0.95), t1 = t0 - crr(0.3, 0.5), ww = 0.11 * (0.6 + H / 40);
            const at = (sx, t) => { const o = 1.03; return [x + ((a[0] + (b[0] - a[0]) * sx) * (1 - t) + (d[0] + (c[0] - d[0]) * sx) * t - x) * o, (a[1] + (b[1] - a[1]) * sx) * (1 - t) + (d[1] + (c[1] - d[1]) * sx) * t, z + ((a[2] + (b[2] - a[2]) * sx) * (1 - t) + (d[2] + (c[2] - d[2]) * sx) * t - z) * o]; };
            const p0 = at(s0, t0), p1 = at(s0 + crr(-0.05, 0.05), t1), dx = (b[0] - a[0]), dz = (b[2] - a[2]), dl = Math.hypot(dx, dz) || 1;
            B.tri([p0[0] - dx / dl * ww, p0[1], p0[2] - dz / dl * ww], [p0[0] + dx / dl * ww, p0[1], p0[2] + dz / dl * ww], p1, P.ink); } }
        return (f, k) => ring[Math.round(f * 6)][k % NS];
      };
      const IX = -61, IZ = 147;
      islet(IX + 1, IZ + 1, 17, 0);
      const stack = [[0, 0, 27, 5.4, 0.05, -0.03], [5.5, 2.5, 21, 4.5, 0.09, 0.04], [-5, -2, 17, 4.3, -0.1, 0.02], [2, -6.5, 13, 3.9, 0.04, -0.09], [-3.5, 5.5, 11, 3.7, -0.08, 0.09], [9.5, -2.5, 8, 3.3, 0.1, 0], [-9, 3, 6, 3.1, -0.1, 0.05], [4, 8, 5, 2.9, 0.06, 0.1]];
      const pk = []; for (const [dx, dz, H, R, lx, lz] of stack) { pk.push(crag(IX + dx, IZ + dz, H, R, lx, lz)); await ctx.yield(); }
      for (const [i, f, k, hgt, ln] of [[0, 0.67, 1, 8, 0.55], [0, 0.5, 4, 7, -0.5], [1, 0.83, 2, 6.5, 0.45], [2, 0.83, 5, 6, -0.5], [0, 0.83, 3, 5.5, -0.3], [3, 0.83, 0, 5, 0.4], [4, 0.83, 3, 4.5, -0.4]]) { const p = pk[i](f, k); ledgePine(p[0], p[1] - 0.5, p[2], hgt, ln); }
      // the shrine on the bar, toward the course: white walls, red posts, a tiled roof; a pilgrim at its door; two stamped trees
      house(IX - 12, 0.8, IZ + 6, 3.4, 2.6, 0.9, false); figure(IX - 13.5, 0.8, IZ + 8.5, 1.15); figure(IX - 10, 0.8, IZ + 9.5, 1.1, true);
      stampList.push([IX - 14.5, 0.6, IZ + 2, 4.6, 0], [IX + 6, 0.6, IZ + 13, 5, season === 'autumn' ? 1 : 0], [IX - 3, 0.6, IZ - 14, 4.2, 0], [IX + 14, 0.6, IZ + 9, 3.6, season === 'spring' ? 2 : 0]);
      for (const [i, f, k, sz] of [[0, 0.33, 0, 3.2], [0, 0.5, 2, 2.8], [0, 0.67, 5, 2.4], [1, 0.5, 1, 2.8], [1, 0.67, 4, 2.3], [2, 0.5, 3, 2.6], [2, 0.67, 0, 2.2], [3, 0.67, 2, 2.2], [0, 0.33, 3, 3], [1, 0.33, 5, 2.8]]) { const p = pk[i](f, k); stampList.push([p[0], p[1] - 0.6, p[2], sz, 0]); }
      await ctx.yield();
      // ---- THE TERRACE IS LIVED ON: flooded rice steps on the balcony side (bare silk between ink bunds, rows of shoots), a foot
      // path along the crown side with travellers and a thatched rest house, and the painter's tufts close under the lens.
      const onTerr = (x, z) => { const y = groundHero(x, z); return y > 157 && y < 164.2 ? y : NaN; };
      const cShoot = P.malachite.clone().lerp(P.ink, 0.5);
      for (let r = 0; r < 5; r++) {                                 // five steps, arcs about a point out over the balcony
        const R0 = 9.5 + r * 3.6, R1 = R0 + 2.8, cx = -34, cz = 541, n = 16;
        for (let q = 0; q < n; q++) {
          const a0 = -1.0 + 2.0 * q / n, a1 = -1.0 + 2.0 * (q + 1) / n, wob = 0.5 * Math.sin(q * 1.3 + r * 2.1);
          const P4 = [[R0 + wob, a0], [R0 + wob, a1], [R1 + wob, a1], [R1 + wob, a0]].map(([rr, a]) => { const x = cx + rr * Math.cos(a), z = cz + rr * Math.sin(a) * 1.25; return [x, onTerr(x, z) + 0.14, z]; });
          if (P4.some((p) => !(p[1] === p[1]) || p[0] > -7.5)) continue;
          B.quad(P4[0], P4[1], P4[2], P4[3], P.silk, { uv: [[50, 0], [50, 0], [50, 2.8], [50, 2.8]], size: [100, 2.8] });
          for (let t = 0; t < 3; t++) { const rr = R0 + 0.6 + t * 0.8 + wob, a = a0 + (a1 - a0) * (0.2 + 0.3 * t), x = cx + rr * Math.cos(a), z = cz + rr * Math.sin(a) * 1.25, y = P4[0][1];
            B.quad([x - 0.05, y, z], [x + 0.05, y, z], [x + 0.12, y + 0.55, z], [x + 0.04, y + 0.55, z], cShoot, { bare: true }); B.quad([x + 0.25, y, z + 0.3], [x + 0.35, y, z + 0.3], [x + 0.2, y + 0.5, z + 0.3], [x + 0.14, y + 0.5, z + 0.3], cShoot, { bare: true }); }
        }
      }
      figure(-12.5, onTerr(-12.5, 536) || 160, 536, 1.15); figure(-16, onTerr(-16, 549) || 160, 549, 1.1, true);       // two at work on the bunds
      await ctx.yield();
      { let pa = null;                                               // the foot path: a pale line between two ink edges
        for (let z = 513; z <= 617; z += 2.6) { const x = 9.5 + 2.2 * Math.sin(z * 0.085) + Math.max(0, z - 596) * 0.12, y = onTerr(x, z), pb = y === y ? [[x - 0.65, y + 0.13, z], [x + 0.65, y + 0.13, z]] : null;
          if (pa && pb) B.quad(pa[0], pb[0], pb[1], pa[1], P.silk, { uv: [[50, 0], [50, 0], [50, 1.3], [50, 1.3]], size: [100, 1.3] });
          pa = pb; }
        for (const [z, sc, load] of [[527, 1.2, true], [530, 1.15, false], [552, 1.2, false], [571, 1.15, true], [574.5, 1.2, false], [597, 1.15, true]]) { const x = 9.5 + 2.2 * Math.sin(z * 0.085) + Math.max(0, z - 596) * 0.12, y = onTerr(x, z); if (y === y) figure(x, y + 0.1, z, sc, load); }
        const hy = onTerr(16.5, 560); if (hy === hy) { house(16.5, hy + 0.3, 560, 4.2, 3.2, -0.5, true); stampList.push([20, hy + 0.5, 557, 3.8, season === 'autumn' ? 1 : 2], [13.5, hy + 0.4, 564, 2.6, 0]); }
      }
      for (let i = 0; i < Math.round(70 * detail); i++) {          // tufts and moss dots, thickest near the lip where the lens comes over
        const x = (cr() < 0.5 ? -1 : 1) * crr(6.2, 20), z = 512 + 62 * cr() * cr(), y = onTerr(x, z);
        if (!(y === y) || (x < -7 && Math.hypot((x + 34), (z - 541) / 1.25) < 28 && Math.hypot((x + 34), (z - 541) / 1.25) > 9)) continue;
        if (i % 3 === 0) stampList.push([x, y - 0.2, z, crr(1.2, 2.6), cr() < 0.15 ? (season === 'spring' ? 2 : 1) : 0]);
        else for (let j = 0; j < 4; j++) { const tx = x + j * 0.4 - 0.6, l2 = crr(-0.5, 0.5), hg = crr(0.8, 1.7); B.quad([tx - 0.07, y - 0.1, z], [tx + 0.07, y - 0.1, z], [tx + l2 + 0.02, y + hg, z], [tx + l2 - 0.02, y + hg, z], P.ink, { bare: true }); }
      }
    }
    await ctx.yield();
    // WATER-END
    // ---- THE SHORE FLAT AT THE FOOT OF THE FIRST FALL IS DRAWN ON, like every other level floor: the umber ground of the gorge's
    // mouth, from the water's edge to the fall's foot, as wide as the mouth (32 m either side of its centre line at the water,
    // 17 m at the fall), the first 7 m of both mouth walls' feet, and the shallows 15 m out. Moss dots, shrubs and grass strokes
    // in threes on the ground; four to six clumps of stamped trees each side of the stream; reed beds of single ink strokes along
    // the edge and in the shallows, a bed to every 8 m of edge. Nothing stands in the fall's stream and spray (within 9 m of
    // x 8), and no tree and no reed within 12 m of the axis. A stream of its own.
    {
      const sf = makeRng(ctx.seed + ':thousand-li shore flat'), MX = 3, FX = 8, Z0 = 330, Z1 = 369;
      const halfAt = (z) => lerp(32, 17, smoothstep(343, 371, z));                   // the mouth flares open to the shore
      const wet = (x) => Math.abs(x - FX) < 9, shut = (x) => wet(x) || Math.abs(x) < 12;
      for (let i = 0; i < Math.round(260 * detail); i++) {                           // moss dots, shrubs, grass in threes
        const z = sf.range(Z0 + 0.5, Z1), x = MX + sf.sign() * sf.range(0, halfAt(z) + 7), s = sf.range(1.0, 1.9), hgt = sf.range(0.7, 1.5), ln = sf.range(-0.4, 0.4), kd = sf() < 0.12 ? (season === 'spring' ? 2 : 1) : 0;
        const y = groundHero(x, z);
        if (i % 90 === 89) await ctx.yield();
        if (wet(x) || y < 0.7) continue;
        if (i % 3) stampList.push([x, y - s * 0.12, z, s, kd]);
        else for (let j = 0; j < 3; j++) { const tx = x + j * 0.5 - 0.5, l2 = ln + (j - 1) * 0.25; B.quad([tx - 0.07, y - 0.1, z], [tx + 0.07, y - 0.1, z], [tx + l2 + 0.02, y + hgt, z], [tx + l2 - 0.02, y + hgt, z], P.ink, { bare: true }); }
      }
      await ctx.yield();
      for (const sd of [-1, 1]) {                                                    // clumps of three to five stamped trees, each side of the stream
        const nc = sf.int(4, 6);
        for (let c = 0; c < nc; c++) {
          const z = lerp(Z0 + 3, Z1 - 3, (c + sf.range(0.15, 0.85)) / nc), h = halfAt(z), lo = sd > 0 ? FX + 9 + 1.5 : MX - h + 1, hi = sd > 0 ? MX + h - 1 : -12 - 1.5, x = sf.range(Math.min(lo, hi), hi), nt = sf.int(3, 5);
          for (let j = 0; j < nt; j++) {
            const a = sf() * 6.2832, d = j ? sf.range(1.2, 3.2) : 0, tx = x + Math.cos(a) * d, tz = z + Math.sin(a) * d * 0.7, s = sf.range(2.6, 4.4), kd = sf() < (season === 'autumn' ? 0.34 : 1 / 12) ? 1 : 0, ty = groundHero(tx, tz);
            if (!shut(tx) && ty > 0.7) stampList.push([tx, ty - 0.2, tz, kd ? 2.6 + (s - 2.6) * 0.3 : s, kd]);      // vermilion is always small
          }
        }
      }
      await ctx.yield();
      for (const far of [0, 1]) for (let bx = MX - 32 + (far ? 8 : 4); bx <= MX + 32; bx += 8) {      // a bed to every 8 m of edge, at the edge; and another, between them, out in the shallows
        const cx = bx + sf.range(-2.5, 2.5), n = sf.int(5, 9);
        let ze = Z0 + 6; while (ze > Z0 - 45 && groundHero(cx, ze) > 0.05) ze -= 0.5;          // where the water begins on this line
        const cz = ze - (far ? sf.range(5, 14) : sf.range(0, 2.5));
        for (let j = 0; j < n; j++) {
          const x = cx + sf.range(-3, 3), z = cz + sf.range(-1.6, 1.6), hgt = sf.range(1.6, 3.4), ln = sf.range(-0.5, 0.5), y = Math.max(0, groundHero(x, z));
          if (shut(x) || y > 1.6) continue;
          B.quad([x - 0.09, y, z], [x + 0.09, y, z], [x + ln + 0.03, y + hgt, z], [x + ln - 0.03, y + hgt, z], cInk, { bare: true });
        }
      }
      await ctx.yield();
      for (let i = 0; i < Math.round(280 * detail); i++) {                           // and the feet of the two mouth walls, their first 7 m, drawn on as thickly as the flat's own rim
        const z = sf.range(Z0 + 0.5, Z1), x = MX + sf.sign() * (halfAt(z) + sf.range(-1.5, 7)), s = sf.range(1.0, 1.9), hgt = sf.range(0.7, 1.5), ln = sf.range(-0.4, 0.4), kd = sf() < 0.1 ? (season === 'spring' ? 2 : 1) : 0;
        const y = groundHero(x, z);
        if (i % 90 === 89) await ctx.yield();
        if (wet(x) || y < 0.7) continue;
        if (i % 3) stampList.push([x, y - s * 0.12, z, s, kd]);
        else for (let j = 0; j < 3; j++) { const tx = x + j * 0.5 - 0.5, l2 = ln + (j - 1) * 0.25; B.quad([tx - 0.07, y - 0.1, z], [tx + 0.07, y - 0.1, z], [tx + l2 + 0.02, y + hgt, z], [tx + l2 - 0.02, y + hgt, z], P.ink, { bare: true }); }
      }
      await ctx.yield();
      // where the peak's own shore stands out of the water in front of the mouth (it does on some seeds), that ground is drawn
      // on in the same way as far as 40 m out, and nothing on it stands within 6 m of the axis
      for (let i = 0; i < Math.round(300 * detail); i++) {
        const z = sf.range(Z0 - 40, Z0 + 0.5), x = MX + sf.sign() * sf.range(0, 39), s = sf.range(1.0, 1.9), hgt = sf.range(0.7, 1.5), ln = sf.range(-0.4, 0.4), kd = sf() < 0.1 ? (season === 'spring' ? 2 : 1) : 0;
        const y = groundHero(x, z);
        if (i % 90 === 89) await ctx.yield();
        if (wet(x) || Math.abs(x) < 6 || y < 0.7) continue;
        if (i % 3) stampList.push([x, y - s * 0.12, z, s, kd]);
        else for (let j = 0; j < 3; j++) { const tx = x + j * 0.5 - 0.5, l2 = ln + (j - 1) * 0.25; B.quad([tx - 0.07, y - 0.1, z], [tx + 0.07, y - 0.1, z], [tx + l2 + 0.02, y + hgt, z], [tx + l2 - 0.02, y + hgt, z], P.ink, { bare: true }); }
      }
    }
    await ctx.yield();
    await ctx.yield();
    const builtGeo = await B.geometryAsync(ctx);
    await ctx.yield();
    const builtMesh = new THREE.Mesh(builtGeo, style.flat()); builtMesh.frustumCulled = false; scene.add(builtMesh);
    await ctx.yield();
    scene.add(style.stamps(stampList));
    await ctx.yield();
    scene.add(style.wheels(wheelList));
    await ctx.yield();
    const goldMesh = style.goldRibbon(goldLines); scene.add(goldMesh);
    await ctx.yield();
    // ---- the cast: flat profile stamps, one instanced draw per pose, all from the flat material
    const cShell = P.shell, cGrey = wash(0.74), cLoad = P.vermilion, cHat = wash(0.3);
    const inst = (b, n) => { const m = new THREE.InstancedMesh(b.geometry(), style.flat(), n); m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m); return m; };
    const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _s = new THREE.Vector3(), _p = new THREE.Vector3(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
    const put = (mesh, i, x, y, z, yaw, pitch, roll, sx, sy, sz) => { _e.set(pitch, yaw, roll); _q.setFromEuler(_e); _m4.compose(_p.set(x, y, z), _q, _s.set(sx, sy ?? sx, sz ?? sx)); mesh.setMatrixAt(i, _m4); };
    const O = { bare: true };
    const flush = (mesh) => { mesh.instanceMatrix.version++; };      // the instance transforms changed (an attribute upload, not a material change)
    // a goose, flying +Z, in one of four held wing poses; ink and shell white. Seen mostly from behind: wings are strokes with body
    const goosePose = (th) => {
      const b = style.batch(), L = 0.93;
      b.quad([-0.14, 0, 0], [0, 0, -0.5], [0.14, 0, 0], [0, 0, 0.42], cShell, O); b.quad([-0.13, 0, 0], [0, -0.1, 0], [0.13, 0, 0], [0, 0.13, 0], cShell, O);
      b.quad([0, -0.11, 0.3], [0, -0.1, -0.45], [0, 0.07, -0.5], [0, 0.11, 0.3], cShell, O);
      b.quad([-0.035, 0.02, 0.4], [0.035, 0.02, 0.4], [0.03, 0.05, 0.86], [-0.03, 0.05, 0.86], cInk, O); b.quad([0, -0.03, 0.4], [0, 0.07, 0.4], [0, 0.1, 0.9], [0, 0.0, 0.98], cInk, O);
      b.tri([-0.1, 0.01, -0.36], [0.1, 0.01, -0.36], [0, 0.02, -0.62], cInk);
      for (const sd of [-1, 1]) {
        const pt = (t) => [sd * (0.1 + L * t * Math.cos(th * (0.7 + 0.5 * t))), 0.03 + L * t * Math.sin(th * (0.7 + 0.6 * t)), -0.04 - 0.12 * t * t];
        for (let i = 0; i < 3; i++) {
          const a = pt(i / 3), c = pt((i + 1) / 3), ch0 = 0.34 - 0.07 * i, ch1 = i === 2 ? 0.06 : 0.34 - 0.07 * (i + 1), t0 = 0.075 - 0.018 * i, t1 = 0.075 - 0.018 * (i + 1), col = i === 2 ? cInk : cGrey;
          b.quad([a[0], a[1], a[2] + ch0 / 2], [c[0], c[1], c[2] + ch1 / 2], [c[0], c[1], c[2] - ch1 / 2], [a[0], a[1], a[2] - ch0 / 2], col, O);
          b.quad([a[0], a[1] - t0, a[2]], [c[0], c[1] - t1, c[2]], [c[0], c[1] + t1, c[2]], [a[0], a[1] + t0, a[2]], col, O);
        }
      }
      return b;
    };
    await ctx.yield();
    const NG = 5, goosePoses = [0.62, 0.12, -0.5, 0.12].map((th) => inst(goosePose(th), NG));
    // the leaders are ONE object (geese.visible hides them all): a small skein, low in the frame, roaming against it
    const geese = new THREE.Group(); geese.name = 'geese'; scene.add(geese); for (const m of goosePoses) geese.add(m);
    const gooseOff = [[0, 0, 0], [-1.9, 0.25, -1.9], [1.9, 0.2, -1.7], [-3.8, 0.55, -3.7], [3.9, 0.45, -3.4]];      // a wedge behind its leader: [to the side, up, along]
    // [u of our course, then where the leader is]: see the comment in update()
    const GK = [[0, 0, 50, 12], [0.02, 0.5, 50.3, 28], [0.05, 0, 51, 58], [0.08, -12, 49, 88], [0.105, -45, 42, 101], [0.135, -80, 34, 112], [0.18, -106, 24, 140], [0.225, -103, 13, 173], [0.26, -84, 9, 196],
      [0.30, -48, 7, 211], [0.34, -10, 6, 222], [0.375, 2, 20, 245], [0.40, 1, 37, 263], [0.45, 3, 12, 300], [0.50, 6, 5, 345], [0.54, 7, 30, 366], [0.58, 4, 62, 385], [0.61, -6, 80, 402], [0.65, -26, 97, 425],
      [0.70, -20, 126, 455], [0.75, 8, 153, 482], [0.79, 14, 171, 500], [0.83, -8, 173, 535], [0.87, -19, 171, 560], [0.91, -13, 171, 590], [0.94, -6, 172, 608], [0.985, 0, 181, 629], [1, 0, 188, 646]];
    const gooseAt = (u, out) => {
      let i = 0; while (i < GK.length - 2 && u > GK[i + 1][0]) i++;
      const a = GK[i], b = GK[i + 1], p = GK[Math.max(0, i - 1)], n = GK[Math.min(GK.length - 1, i + 2)], du = b[0] - a[0], t = clamp((u - a[0]) / du, 0, 1), t2 = t * t, t3 = t2 * t;
      const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
      const c = (k) => { const m0 = (b[k] - p[k]) / Math.max(1e-4, b[0] - p[0]) * du, m1 = (n[k] - a[k]) / Math.max(1e-4, n[0] - a[0]) * du; return h00 * a[k] + h10 * m0 + h01 * b[k] + h11 * m1; };
      return out.set(c(1), c(2), c(3));
    };
    // egrets (in autumn: more geese, seen in profile): a white stroke flying +X, wing above; the flap is the instance's y scale
    const NE = 41, egretB = style.batch(), cBird = season === 'autumn' ? cInk : cShell;
    egretB.quad([-0.55, -0.06, 0], [0.3, -0.1, 0], [0.38, 0.1, 0], [-0.5, 0.07, 0], cBird, O);
    egretB.quad([0.3, -0.04, 0], [0.95, 0.1, 0], [0.97, 0.18, 0], [0.3, 0.09, 0], season === 'autumn' ? cShell : cBird, O);
    egretB.tri([0.93, 0.08, 0], [1.25, 0.11, 0], [0.95, 0.2, 0], season === 'autumn' ? cInk : P.gold);
    egretB.quad([-0.5, -0.03, 0], [-1.25, -0.1, 0], [-1.25, -0.05, 0], [-0.5, 0.04, 0], season === 'autumn' ? cShell : cInk, O);
    const cWing = season === 'autumn' ? cGrey : cShell;
    egretB.quad([-0.14, 0.05, 0], [0.24, 0.06, 0], [0.06, 0.42, 0], [-0.2, 0.46, 0], cWing, O); egretB.quad([-0.22, 0.46, 0], [0.1, 0.42, 0], [-0.12, 0.74, 0], [-0.33, 0.78, 0], cWing, O);
    egretB.tri([-0.33, 0.78, 0], [-0.12, 0.74, 0], [-0.42, 1.0, 0], season === 'autumn' ? cInk : cBird);
    egretB.quad([-0.2, 0.02, -0.45], [0.26, 0.02, -0.45], [0.26, 0.02, 0.45], [-0.2, 0.02, 0.45], cWing, O);
    const egrets = inst(egretB, NE);
    await ctx.yield();
    // the train on the bridge: mules (or oxen with carts, or porters with shoulder poles) and three drovers; two leg poses
    const NM = 14, animal = (pose) => {
      const b = style.batch(), s = cast === 'oxcarts' ? 1.18 : 1, q = (a, c, d, e, col) => b.quad([a[0] * s, a[1] * s, 0], [c[0] * s, c[1] * s, 0], [d[0] * s, d[1] * s, 0], [e[0] * s, e[1] * s, 0], col, O);
      if (cast === 'porters') {
        q([-0.14, 0.75], [0.14, 0.75], [0.12, 1.75], [-0.12, 1.75], cInk); q([-0.42, 1.78], [0.42, 1.78], [0.1, 2.02], [-0.1, 2.02], cHat); q([-1.45, 1.5], [1.45, 1.5], [1.45, 1.58], [-1.45, 1.58], cInk);
        const k = pose ? 0.3 : -0.3; q([-0.12, 0.8], [0.02, 0.8], [0.02 + k, 0], [-0.12 + k, 0], cInk); q([0, 0.8], [0.13, 0.8], [0.13 - k, 0], [-k, 0], cInk);
      } else {
        q([-0.95, 1.0], [0.75, 1.0], [0.8, 1.8], [-0.9, 1.75], cInk); q([0.55, 1.5], [0.85, 1.35], [1.3, 2.05], [1.02, 2.25], cInk); q([1.0, 1.95], [1.5, 1.7], [1.55, 1.92], [1.15, 2.3], cInk);
        q([1.02, 2.2], [1.12, 2.2], [1.02, 2.6], [0.97, 2.55], cInk); q([-0.95, 1.7], [-0.85, 1.7], [-1.12, 0.85], [-1.18, 0.9], cInk);
        const k = pose ? 0.28 : -0.28;
        for (const [x0, sg] of [[0.6, 1], [0.42, -1], [-0.7, -1], [-0.86, 1]]) q([x0 - 0.09, 1.05], [x0 + 0.09, 1.05], [x0 + 0.07 + sg * k, 0], [x0 - 0.07 + sg * k, 0], cInk);
      }
      return inst(b, NM);
    };
    const animals = [animal(0), animal(1)];
    const loadB = style.batch();
    if (cast === 'porters') { for (const sx of [-1.4, 1.4]) { loadB.box(sx, 1.0, 0, 0.6, 0.55, 0.6, cLoad, {}); loadB.quad([sx - 0.02, 1.25, 0], [sx + 0.02, 1.25, 0], [sx + 0.02, 1.52, 0], [sx - 0.02, 1.52, 0], cInk, O); } }
    else if (cast === 'oxcarts') { loadB.box(-2.6, 1.55, 0, 2.2, 1.0, 1.5, wash(0.45), { rule: 0.3 }); loadB.box(-2.6, 2.25, 0, 1.6, 0.45, 1.2, cLoad, {}); loadB.quad([-1.5, 1.2, 0], [-0.9, 1.5, 0], [-0.9, 1.6, 0], [-1.5, 1.3, 0], cInk, O);
      for (let i = 0; i < 8; i++) { const a0 = i / 8 * 6.2832, a1 = (i + 1) / 8 * 6.2832; for (const z of [-0.8, 0.8]) loadB.tri([-2.6, 0.85, z], [-2.6 + Math.cos(a0) * 0.85, 0.85 + Math.sin(a0) * 0.85, z], [-2.6 + Math.cos(a1) * 0.85, 0.85 + Math.sin(a1) * 0.85, z], cInk); } }
    else loadB.box(-0.1, 2.12, 0, 1.15, 0.72, 0.95, cLoad, {});
    const loads = inst(loadB, NM), loadEvery = cast === 'porters' ? 1 : cast === 'oxcarts' ? 2 : 3;
    const drB = style.batch(); drB.quad([-0.13, 0, 0], [0.13, 0, 0], [0.11, 1.7, 0], [-0.11, 1.7, 0], cInk, O); drB.quad([-0.45, 1.72, 0], [0.45, 1.72, 0], [0.1, 2.0, 0], [-0.1, 2.0, 0], cHat, O); drB.quad([0.2, 0.3, 0], [0.25, 0.3, 0], [0.5, 2.1, 0], [0.45, 2.1, 0], cInk, O);
    const drovers = inst(drB, 3);
    await ctx.yield();
    // fishing boats 7 m long with mat awnings (or log rafts), each with its one-stroke boatman and pole
    const NB = 9, boatB = style.batch();
    if (rafts) { for (let i = 0; i < 6; i++) boatB.box(0, 0.12, (i - 2.5) * 0.42, 7 + (i % 2) * 0.5, 0.36, 0.4, wash(0.6), {}); boatB.box(-1.2, 0.6, 0, 1.3, 0.6, 1.2, cLoad, {}); }
    else {
      const st = [[-3.5, 0.12, 1.0], [-2.2, 0.8, 0.55], [0, 1.0, 0.45], [2.2, 0.75, 0.55], [3.5, 0.1, 1.05]];
      for (let i = 0; i < 4; i++) { const a = st[i], c = st[i + 1];
        for (const sg of [-1, 1]) boatB.quad([a[0], -0.15, sg * a[1] * 0.7], [c[0], -0.15, sg * c[1] * 0.7], [c[0], c[2], sg * c[1]], [a[0], a[2], sg * a[1]], wash(0.72), {});
        boatB.quad([a[0], a[2] - 0.12, -a[1]], [c[0], c[2] - 0.12, -c[1]], [c[0], c[2] - 0.12, c[1]], [a[0], a[2] - 0.12, a[1]], wash(0.45), { rule: 0.4 }); }
      for (let i = 0; i < 6; i++) { const a0 = i / 6 * Math.PI, a1 = (i + 1) / 6 * Math.PI, r = 0.98;
        boatB.quad([-1.9, 0.45 + Math.sin(a0) * r, Math.cos(a0) * r], [0.7, 0.45 + Math.sin(a0) * r, Math.cos(a0) * r], [0.7, 0.45 + Math.sin(a1) * r, Math.cos(a1) * r], [-1.9, 0.45 + Math.sin(a1) * r, Math.cos(a1) * r], wash(0.26), { rule: -0.28, uv: [[0, i * 0.5], [2.6, i * 0.5], [2.6, i * 0.5 + 0.5], [0, i * 0.5 + 0.5]], size: [2.6, 3] }); }
    }
    boatB.box(2.5, 1.3, 0, 0.2, 1.6, 0.2, cInk, O); boatB.box(2.5, 2.2, 0, 0.8, 0.14, 0.8, cHat, O);
    boatB.quad([2.6, 2.6, 0.2], [2.68, 2.6, 0.2], [3.75, -1.2, 1.5], [3.67, -1.2, 1.5], cInk, O); boatB.quad([2.64, 2.6, 0.16], [2.64, 2.6, 0.24], [3.71, -1.2, 1.54], [3.71, -1.2, 1.46], cInk, O);
    const boats = inst(boatB, NB);
    const boatHome = [[-10, 0, Math.PI / 2 + 0.12]];
    for (let i = 1; i < NB; i++) boatHome.push(i < 5 ? [rng.sign() * rng.range(22, 80), rng.range(110, 330), rng.range(0, 6.28)] : [rng.sign() * rng.range(100, 330), rng.range(100, 330), rng.range(0, 6.28)]);
    await ctx.yield();
    // ---- more craft on the water, each kind its own drawing: a ferry under a mat sail, fishermen at a dip net, a covered barge
    // being poled; and rafts of waterfowl. One instanced draw each, drifting on the journey clock so that a still is repeatable.
    const hullInto = (b, L, beam, hgt) => {
      const st = [[-0.5, 0.1, 1.0], [-0.3, 0.85, 0.55], [0, 1.0, 0.42], [0.3, 0.8, 0.55], [0.5, 0.1, 1.05]].map(([f, w, h]) => [f * L, w * beam / 2, h * hgt]);
      for (let i = 0; i < 4; i++) { const a = st[i], c = st[i + 1];
        for (const sg of [-1, 1]) b.quad([a[0], -0.15, sg * a[1] * 0.7], [c[0], -0.15, sg * c[1] * 0.7], [c[0], c[2], sg * c[1]], [a[0], a[2], sg * a[1]], wash(0.72), {});
        b.quad([a[0], a[2] - 0.12, -a[1]], [c[0], c[2] - 0.12, -c[1]], [c[0], c[2] - 0.12, c[1]], [a[0], a[2] - 0.12, a[1]], wash(0.45), { rule: 0.4 }); }
    };
    const manInto = (b, x, y, z, s = 1, crouch = 0) => { const h = 1.5 * s * (1 - 0.4 * crouch);
      b.quad([x - 0.13 * s, y, z], [x + 0.13 * s, y, z], [x + 0.11 * s + crouch * 0.3, y + h, z], [x - 0.11 * s + crouch * 0.3, y + h, z], cInk, O); b.quad([x, y, z - 0.13 * s], [x, y, z + 0.13 * s], [x + crouch * 0.3, y + h, z + 0.11 * s], [x + crouch * 0.3, y + h, z - 0.11 * s], cInk, O);
      b.box(x + crouch * 0.3, y + h + 0.1 * s, z, 0.8 * s, 0.14 * s, 0.8 * s, cHat, O); };
    const awningInto = (b, x0, x1, r, y) => { for (let i = 0; i < 6; i++) { const a0 = i / 6 * Math.PI, a1 = (i + 1) / 6 * Math.PI;
      b.quad([x0, y + Math.sin(a0) * r, Math.cos(a0) * r], [x1, y + Math.sin(a0) * r, Math.cos(a0) * r], [x1, y + Math.sin(a1) * r, Math.cos(a1) * r], [x0, y + Math.sin(a1) * r, Math.cos(a1) * r], cMat, { rule: -0.3, uv: [[0, i * 0.5], [x1 - x0, i * 0.5], [x1 - x0, i * 0.5 + 0.5], [0, i * 0.5 + 0.5]], size: [x1 - x0, 3] }); } };
    const ferryB = style.batch();                                // 10 m, a tall mat sail ruled with its battens, a steersman and two passengers
    hullInto(ferryB, 10, 2.6, 1.15);
    ferryB.box(0.9, 3.6, 0, 0.16, 6.6, 0.16, cInk, O);
    ferryB.quad([0.75, 1.5, -1.9], [1.05, 1.5, 1.9], [1.05, 6.6, 1.9], [0.75, 6.6, -1.9], cMat, { rule: 0.55 });
    ferryB.quad([0.75, 6.6, -2.0], [1.05, 6.6, 2.0], [1.05, 6.75, 2.0], [0.75, 6.75, -2.0], cInk, O); ferryB.quad([0.75, 1.42, -2.0], [1.05, 1.42, 2.0], [1.05, 1.56, 2.0], [0.75, 1.56, -2.0], cInk, O);
    ferryB.quad([0.9, 6.9, 0], [0.9, 7.25, 0], [1.9, 7.1, 0.1], [1.9, 7.0, 0.1], P.vermilion, O);
    manInto(ferryB, -3.6, 0.75, 0, 1.1); manInto(ferryB, -1.4, 0.8, 0.35, 1, 0.8); manInto(ferryB, -0.7, 0.8, -0.35, 1, 0.8);
    ferryB.quad([-3.5, 1.9, 0.05], [-3.42, 1.9, 0.05], [-5.9, -0.6, 0.4], [-5.98, -0.6, 0.4], cInk, O);
    const NF = 3, ferries = inst(ferryB, NF);
    const fisherB = style.batch();                               // 6 m, one man at the stern pole, one crouched at the lever of a square dip net
    hullInto(fisherB, 6, 1.7, 0.85);
    manInto(fisherB, -2.0, 0.6, 0, 1.05); fisherB.quad([-2.1, 2.3, 0.2], [-2.02, 2.3, 0.2], [-3.3, -1.0, 1.2], [-3.38, -1.0, 1.2], cInk, O);
    manInto(fisherB, 0.9, 0.62, 0, 1, 0.9);
    fisherB.quad([1.0, 0.9, 0.04], [1.0, 1.0, -0.04], [4.6, 3.3, -0.04], [4.6, 3.2, 0.04], cInk, O);                 // the lever
    for (const [ax, az] of [[-1.3, -1.3], [1.3, -1.3], [1.3, 1.3], [-1.3, 1.3]]) fisherB.quad([4.6, 3.25, 0], [4.66, 3.25, 0], [4.6 + ax + 0.06, 0.55, az], [4.6 + ax, 0.55, az], cInk, O);
    fisherB.quad([3.3, 0.55, -1.3], [5.9, 0.55, -1.3], [5.9, 0.55, 1.3], [3.3, 0.55, 1.3], wash(0.1), { rule: 0.32 });
    fisherB.quad([3.3, 0.56, -1.3], [5.9, 0.56, -1.3], [5.9, 0.56, 1.3], [3.3, 0.56, 1.3], wash(0.1), { rule: -0.32 });
    // THE NET IS DRAWN, small and ruled: an ink rim round the square the four arms hold, a belly of mesh sagging from the rim
    // toward the water, ruled both ways in the plank's wash, and three shell-white fish in it, the longest 0.39 m.
    {
      const NX = 4.6, NH = 1.3, yR = 0.55, SAG = 0.42, NC = 8, cw = 2 * NH / NC, cNet = wash(0.45);
      for (const sg of [-1, 1]) { fisherB.box(NX, yR, sg * NH, 2 * NH + 0.1, 0.09, 0.1, cInk, O); fisherB.box(NX + sg * NH, yR, 0, 0.1, 0.09, 2 * NH + 0.1, cInk, O); }
      // the belly: eight strips of eight cells; a strip's two edges are ink lines one way, the rule of the material the other
      const sagY = (x, z) => yR - SAG * (1 - (x / NH) * (x / NH)) * (1 - (z / NH) * (z / NH)), nv = (x, z) => [NX + x, sagY(x, z), z];
      for (let i = 0; i < NC; i++) for (let k = 0; k < NC; k++) { const x0 = -NH + i * cw, x1 = x0 + cw, z0 = -NH + k * cw, z1 = z0 + cw;
        fisherB.quad(nv(x0, z0), nv(x1, z0), nv(x1, z1), nv(x0, z1), cNet, { rule: cw, uv: [[0, 52 + k * cw], [2, 52 + k * cw], [2, 52 + (k + 1) * cw], [0, 52 + (k + 1) * cw]], size: [2, 104 + 2 * NH] }); }
      for (const [fx, fz, ang, L, fy] of [[0.15, -0.1, 0.5, 0.33, 0.66], [-0.5, 0.45, 2.3, 0.29, 0.7], [0.55, 0.5, -1.1, 0.26, 0.64]]) {       // each fish lies on the taut sheet at the rim: a leaf seen from above and from the side, and a tail
        const cs = Math.cos(ang), sn = Math.sin(ang), at = (a, y, c) => [NX + fx + a * cs - c * sn, fy + y, fz + a * sn + c * cs];
        fisherB.quad(at(-L / 2, 0, 0), at(0, 0, -L * 0.2), at(L / 2, 0, 0), at(0, 0, L * 0.2), cShell, O);
        fisherB.quad(at(-L / 2, 0, 0), at(0, -L * 0.2, 0), at(L / 2, 0, 0), at(0, L * 0.2, 0), cShell, O);
        fisherB.tri(at(-L * 0.42, 0, 0), at(-L * 0.68, L * 0.16, 0), at(-L * 0.68, -L * 0.16, 0), cShell);
      }
    }
    const NFI = 4, fishers = inst(fisherB, NFI);
    const bargeB = style.batch();                                // 12 m, a long mat cabin, a man poling at the bow, a sweep at the stern
    hullInto(bargeB, 12, 3.0, 1.2); awningInto(bargeB, -3.6, 2.4, 1.3, 0.55);
    bargeB.box(-3.6, 1.0, 0, 0.1, 1.3, 2.4, P.shell, { rule: 0.5 }); bargeB.box(2.4, 1.0, 0, 0.1, 1.3, 2.4, P.shell, { rule: 0.5 });
    manInto(bargeB, 4.3, 0.8, 0.5, 1.1); bargeB.quad([4.4, 2.5, 0.6], [4.48, 2.5, 0.6], [6.5, -1.4, 1.9], [6.42, -1.4, 1.9], cInk, O);
    manInto(bargeB, -4.6, 0.85, 0, 1.05); bargeB.quad([-4.5, 1.7, 0.05], [-4.42, 1.7, 0.05], [-7.4, -0.5, 0.2], [-7.48, -0.5, 0.2], cInk, O);
    bargeB.box(-5.4, 2.1, 0, 0.1, 1.6, 0.1, cInk, O); bargeB.quad([-5.4, 2.55, 0], [-5.4, 2.9, 0], [-6.2, 2.75, 0.08], [-6.2, 2.68, 0.08], P.vermilion, O);
    const NBG = 3, barges = inst(bargeB, NBG);
    const fowlB = style.batch();                                 // a duck on the water, 0.6 m: an ink back, a shell breast, a head stroke
    fowlB.quad([-0.3, 0, 0], [0.22, 0, 0], [0.26, 0.2, 0], [-0.38, 0.16, 0], cInk, O); fowlB.quad([0.1, 0, 0], [0.3, 0, 0], [0.3, 0.18, 0], [0.16, 0.2, 0], P.shell, O);
    fowlB.quad([0.2, 0.15, 0], [0.3, 0.15, 0], [0.4, 0.42, 0], [0.26, 0.42, 0], cInk, O); fowlB.tri([0.38, 0.4, 0], [0.56, 0.34, 0], [0.38, 0.32, 0], P.gold);
    fowlB.quad([-0.34, 0.1, -0.12], [0.26, 0.1, -0.12], [0.26, 0.1, 0.12], [-0.34, 0.1, 0.12], cInk, O);
    const NW = Math.max(14, Math.round(34 * detail)), fowl = inst(fowlB, NW), fowlHome = [];
    { const rafts2 = [[-14, 214], [15, 240], [-22, 262], [9, 190], [40, 170], [-52, 150], [22, 130], [-6, 160]];
      for (let i = 0; i < NW; i++) { const g = rafts2[i % rafts2.length], j = Math.floor(i / rafts2.length); fowlHome.push([g[0] + j * 1.5 + wrr(-0.4, 0.4), g[1] + (j % 2 ? 0.9 : -0.5) * (1 + j * 0.3) + wrr(-0.3, 0.3), (i % rafts2.length) * 0.8 + 0.3, wrr(1.5, 2.1)]); } }
    // homes: [x, z, heading, drift m/s along the heading]; the craft keep at least 9 m off the course
    const ferryHome = [[-69.5, 190, -1.27, 1.1], [150, 205, 2.9, 1.0], [-200, 150, 0.2, 0.9]];
    const fisherHome = [[14.5, 172, 2.2, 0], [-17, 222, 0.6, 0], [70, 240, 4.0, 0], [-53, 171, 0.5, 0]];
    const bargeHome = [[26, 249, 3.3, 0.7], [-120, 195, 0.1, 0.8], [58, 120, 3.0, 0.7]];
    await ctx.yield();
    // ---- petals (spring), leaves (autumn) or snow (winter): small matte flecks falling in the slow air along the course
    const NP = Math.round(150 * detail), petB = style.batch(), petCol = season === 'autumn' ? P.vermilion : P.shell;
    petB.quad([-0.5, 0, 0], [0, -0.32, 0], [0.5, 0, 0], [0, 0.32, 0], petCol, O);
    const petals = inst(petB, NP), petHome = new Float32Array(NP * 5);
    for (let i = 0; i < NP; i++) {
      const pu = i < NP * 0.4 ? rng.range(0.78, 1) : rng(), q = path.pointAt(pu, _p), sd = rng.sign();
      petHome.set([q.x + sd * rng.range(5.5, 34), q.y + rng.range(-4, 22), q.z, rng.range(0.28, 0.5), rng() * 100], i * 5);
    }

    // ---- the hut's smoke: a thread of bare silk, leaning in the slow air
    const SN = 18, smokePos = new Float32Array((SN + 1) * 6), smokeG = new THREE.BufferGeometry();
    { const idx = []; for (let i = 0; i < SN; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
      smokeG.setAttribute('position', new THREE.BufferAttribute(smokePos, 3).setUsage(THREE.DynamicDrawUsage)); smokeG.setIndex(idx); }
    const smoke = new THREE.Mesh(smokeG, style.silk('plain', { side: THREE.DoubleSide })); smoke.frustumCulled = false; scene.add(smoke);
    const smokeBase = [hutW.x - 1.6, groundHero(hutW.x, hutW.z) + 7.1, hutW.z + 0.8];

    // ---- the rare event, the flake: a plate of azurite 30 m across that lifts from the crown and drifts down to port
    const crownW = hero.toWorld(hero.anchors.crown);
    // A LEAF, NOT A WALL: 13 m across, lightly cupped with one lip curled over, and it keeps its granular blue face toward the
    // lens (it is placed from the camera's world matrix every frame) while it sways; it rolls once, late, to show the silk back.
    let flakeObj = null; const flakeFrom = new THREE.Vector3(crownW.x - 26, 0, crownW.z - 40);
    flakeFrom.y = groundHero(flakeFrom.x, flakeFrom.z) + 1.5;
    const flakeMid = new THREE.Vector3(10, 192, 560), flakeTo = new THREE.Vector3(70, 175, 500), flakeCtl = new THREE.Vector3();      // over the axis of the gorge, in open sky, at 31.75 s; then away to port, never nearer the lens than 30 m
    { const w = 0.5; flakeCtl.copy(flakeMid).addScaledVector(flakeFrom, -(1 - w) * (1 - w)).addScaledVector(flakeTo, -w * w).multiplyScalar(1 / (2 * w * (1 - w))); }
    const _fq = new THREE.Quaternion(), _fq0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.15, 2.4, 0, 'YXZ')), _fc = new THREE.Vector3();
    if (rare) {
      const g = new THREE.PlaneGeometry(18, 18, 14, 14), pa = g.attributes.position;
      for (let i = 0; i < pa.count; i++) {
        const x = pa.getX(i), y = pa.getY(i), c = Math.max(0, x - 3.6), ph = 0.07 * c * c * 0.24;      // the lip beyond x 3.6 curls up and over
        const z0 = 0.008 * (x * x + y * y) - 1 + 0.04 * x * y * 0.2;
        pa.setXYZ(i, Math.min(x, 3.6) + Math.sin(Math.min(ph * 4, 2.4)) * c * 0.75, y, z0 + (1 - Math.cos(Math.min(ph * 4, 2.4))) * c * 0.75);
      }
      flakeObj = new THREE.Mesh(g, style.flake()); flakeObj.frustumCulled = false; flakeObj.scale.setScalar(0); scene.add(flakeObj);
      heroMat.uniforms.uScar.value.set(flakeFrom.x, flakeFrom.z, 7.5, 0);
    }
    await ctx.yield();

    // ---- clocks. jc: the journey clock every coat keys to (it follows u, and may idle 2.5 s ahead of a held camera);
    // gc: the glance's clock, which crosses the course at 4, 21 and 38 s and otherwise simply runs
    let jc = -1, gc = -1, started = false;
    const zEgret = path.pointAt(uAtClock(15.2), new THREE.Vector3()).z + 16, zBoat = path.pointAt(uAtClock(16), new THREE.Vector3()).z + 1;
    const bridgeZ = 265, deckY = hero.anchors.bridge.deckY, lakeU = hero.parts.lake.material.uniforms;
    const _t = new THREE.Vector3(), _g = new THREE.Vector3(), _cp = new THREE.Vector3(), _cd = new THREE.Vector3(), FLAP = [1, 0.35, -0.75, 0.35];
    function update(dt, time, camera, u) {
      const tJ = clockAt(u || 0);
      if (!started) { jc = tJ; gc = tJ; started = true; }
      jc = clamp(jc + dt, tJ - 0.4, tJ + 2.5);
      gc += dt; if (u > 0.0005 && Math.abs(gc - tJ) > 3.5) gc = tJ;
      style.update(dt, time, camera);
      const ph = (((gc + 4.5) % 17) + 17) % 17;
      U.uGlance.value.z = style.glance.start + ph * style.glance.speed;
      hero.setCoats(jc + 10.5, jc - 27); hero.update(dt, time, camera);
      for (const r of ranges) r.mat.setCoats(jc - r.t2, jc - r.t3);
      const wl = wind(time, 0.3);
      // geese: our leaders, but wild ones. The skein flies its own way through the picture (GK: where it is at each point of
      // our course), so it crosses the frame in profile, goes wide round the islet while we cut inside, passes over the pavilion
      // roof while we pass under its floor, climbs the first fall as five small birds, and is out of the frame for long stretches.
      const uu = clamp(u || 0, 0, 1);
      gooseAt(uu, _g); gooseAt(Math.min(1, uu + 0.004), _t); _t.sub(_g);
      if (_t.lengthSq() < 1e-8) _t.set(0, 0, 1); else _t.normalize();
      const gyaw = Math.atan2(_t.x, _t.z), gcs = Math.cos(gyaw), gsn = Math.sin(gyaw), gpitch = -Math.asin(clamp(_t.y, -1, 1)) * 0.7, breathe = 1 + 0.18 * Math.sin(time * 0.23 + uu * 40);
      for (let g = 0; g < NG; g++) {
        const o = gooseOff[g], wv = time * 0.7 + g * 1.9, lx = o[0] * breathe + Math.sin(wv) * 0.35, lz = o[2] - Math.abs(o[0]) * 0.25 * (breathe - 1) + Math.cos(wv * 0.8) * 0.3, ly = o[1] + Math.sin(time * 1.1 + g) * 0.22;
        const pose = Math.floor(time * 6 + g * 1.37) & 3;
        for (let k = 0; k < 4; k++) {
          if (k !== pose) goosePoses[k].setMatrixAt(g, ZERO);
          else put(goosePoses[k], g, _g.x + gcs * lx + gsn * lz, _g.y + ly, _g.z - gsn * lx + gcs * lz, gyaw, gpitch, -Math.cos(wv) * 0.2, 1.15);
        }
      }
      for (const m of goosePoses) flush(m);
      // egrets: the twelve cross our bow at 15 s; the twenty and the nine are white stitches against the peak
      for (let i = 0; i < NE; i++) {
        const fl = FLAP[Math.floor(time * 5 + i * 0.8) & 3];
        if (i < 12) put(egrets, i, (jc - 15.2) * 13 + 13 - i * 2.3, 1.9 + Math.sin(time * 1.5 - i * 0.55) * 0.4 + i * 0.05, zEgret + Math.sin(i * 1.3) * 0.7, 0, 0, 0.05, 1.1, 1.1 * fl, 1.1);
        else {
          const big = i < 32, j = big ? i - 12 : i - 32, a = time * (big ? 0.09 : 0.16) + (big ? 1 : 3), dir = Math.cos(a) >= 0 ? 1 : -1;
          const x = (big ? 42 : 36) * Math.sin(a) - dir * j * (big ? 5 : 4.2), y = (big ? 86 : 192) + (big ? 22 : 7) * Math.sin(time * 0.05 + (big ? 0 : 2)) + Math.sin(time * 1.2 - j * 0.5) * 1.4 + j * 0.3;
          const s = big ? 2.7 : 2.4; put(egrets, i, x, y, (big ? 394 : 556) + Math.sin(j * 1.7) * 3, 0, 0, 0, s * dir, s * fl, s);
        }
      }
      flush(egrets);
      // the train walks the bridge to the pavilion
      const head = Math.min(-10.5, -10.5 - (20 - jc) * 1.25), walking = jc < 20;
      let mi = 0, di = 0;
      for (let i = 0; i < 17; i++) {
        const x = head - i * 3.5, y = deckY(x) + 0.22, z = bridgeZ - 2.3 + Math.sin(i * 2.1) * 0.5, step = walking ? Math.floor(time * 2.6 + i * 0.6) & 1 : 0;
        if (i % 8 === 0) { put(drovers, di++, x, y, z, 0, 0, 0, 1.25); continue; }
        put(animals[step], mi, x, y + (step ? 0.05 : 0), z, 0, 0, 0, 1.25); animals[1 - step].setMatrixAt(mi, ZERO);
        if (mi % loadEvery === 0) put(loads, mi, x, y + (step ? 0.05 : 0), z, 0, 0, 0, 1.25); else loads.setMatrixAt(mi, ZERO);
        mi++;
      }
      flush(animals[0]); flush(animals[1]); flush(loads); flush(drovers);
      // boats: poling and rocking; the first slides by 10 m to starboard at 16 s
      for (let i = 0; i < NB; i++) {
        const h = boatHome[i]; let x, z, yaw = h[2];
        if (i === 0) { x = -10 + Math.sin(time * 0.3) * 0.4; z = zBoat - (jc - 16) * 2.2; yaw = -Math.PI / 2 + 0.1; }
        else { const s = 14 * Math.sin(time * 0.08 + i * 1.7); x = h[0] + Math.cos(yaw) * s; z = h[1] - Math.sin(yaw) * s; }
        put(boats, i, x, -0.02 + Math.sin(time * 1.1 + i) * 0.07, z, yaw, Math.sin(time * 1.3 + i * 2) * 0.06, Math.sin(time * 0.9 + i) * 0.035 + Math.max(0, Math.sin(time * 1.6 + i)) * 0.03, 1);
        if (i < 5) lakeU.uRipple.value[i + 1].set(x, z, 17, 0.9);
      }
      flush(boats);
      // the other craft: the ferry heels a little under its sail, the fishers' boat dips with the net, the barge is poled along
      for (let i = 0; i < NF; i++) { const h = ferryHome[i], s = h[3] * (jc - 14); put(ferries, i, h[0] + Math.cos(h[2]) * s, -0.02 + Math.sin(time * 0.9 + i) * 0.06, h[1] - Math.sin(h[2]) * s, h[2], Math.sin(time * 0.7 + i * 2) * 0.03, 0.05 + Math.sin(time * 0.6 + i) * 0.04, i ? 1.3 : 1.25); }
      flush(ferries);
      for (let i = 0; i < NFI; i++) { const h = fisherHome[i]; put(fishers, i, h[0], -0.02 + Math.sin(time * 1.2 + i * 1.3) * 0.06, h[1], h[2] + Math.sin(time * 0.11 + i) * 0.12, Math.sin(time * 0.8 + i * 2.2) * 0.07, Math.sin(time * 1.1 + i) * 0.05, i > 1 ? 1.3 : 1); }
      flush(fishers);
      for (let i = 0; i < NBG; i++) { const h = bargeHome[i], s = h[3] * (jc - 14) + Math.max(0, Math.sin(time * 1.4 + i)) * 0.25; put(barges, i, h[0] + Math.cos(h[2]) * s, -0.02 + Math.sin(time + i) * 0.04, h[1] - Math.sin(h[2]) * s, h[2], Math.sin(time * 1.4 + i) * 0.02, Math.sin(time * 0.8 + i) * 0.03, i ? 1.25 : 1); }
      flush(barges);
      for (let i = 0; i < NW; i++) { const h = fowlHome[i], s = 0.35 * (jc - 14) + Math.sin(time * 0.5 + i) * 0.3; put(fowl, i, h[0] + Math.cos(h[2]) * s, Math.sin(time * 1.7 + i * 1.9) * 0.04, h[1] - Math.sin(h[2]) * s, h[2] + Math.sin(time * 0.4 + i) * 0.25, 0, Math.sin(time * 2.3 + i) * 0.08, h[3]); }
      flush(fowl);
      for (let i = 0; i < NP; i++) {
        const k = i * 5, ph = petHome[k + 4], fall = ((time * (0.9 + (ph % 1) * 0.6) + ph) % 26), a = time * 1.3 + ph * 3;
        put(petals, i, petHome[k] + Math.sin(a * 0.7) * 1.6 + wl * 2.5, petHome[k + 1] - fall, petHome[k + 2] + Math.cos(a * 0.5) * 1.4, a, Math.sin(a) * 1.2, a * 0.6, petHome[k + 3]);
      }
      flush(petals);
      // smoke
      for (let i = 0; i <= SN; i++) {
        const t = i / SN, hgt = t * 30, w = 0.22 + 1.5 * t * t + 0.25 * t, ox = (wl * 5 + 3) * t * t + Math.sin(time * 0.9 - t * 5) * 0.9 * t, oz = Math.sin(time * 0.6 - t * 4 + 1) * 0.7 * t;
        smokePos[i * 6] = smokeBase[0] + ox - w; smokePos[i * 6 + 1] = smokeBase[1] + hgt; smokePos[i * 6 + 2] = smokeBase[2] + oz;
        smokePos[i * 6 + 3] = smokeBase[0] + ox + w; smokePos[i * 6 + 4] = smokeBase[1] + hgt; smokePos[i * 6 + 5] = smokeBase[2] + oz;
      }
      smokeG.attributes.position.needsUpdate = true;
      // the flake
      if (flakeObj) {
        const tf = jc - 27, w = tf / 9.5;
        if (tf <= 0 || w >= 1.25 || !camera) flakeObj.scale.setScalar(0);
        else {
          const k0 = (1 - w) * (1 - w), k1 = 2 * w * (1 - w), k2 = w * w, lift = Math.sin(Math.min(1, tf / 2.2) * 1.5708);
          flakeObj.scale.setScalar(1);
          flakeObj.position.set(flakeFrom.x * k0 + flakeCtl.x * k1 + flakeTo.x * k2 + Math.sin(tf * 1.1) * 2.2 * Math.min(1, tf / 2),
            flakeFrom.y * k0 + flakeCtl.y * k1 + flakeTo.y * k2 + lift * 9 * Math.max(0, 1 - w * 1.6) + Math.cos(tf * 1.7) * 1.3 * Math.min(1, tf / 2),
            flakeFrom.z * k0 + flakeCtl.z * k1 + flakeTo.z * k2);
          _fc.setFromMatrixPosition(camera.matrixWorld);
          flakeObj.lookAt(_fc);                                 // the blue face to the lens ...
          flakeObj.rotateX(0.5 * Math.sin(tf * 1.25 + 0.6)); flakeObj.rotateY(0.55 * Math.sin(tf * 0.85) + 6.2832 * smoothstep(5.7, 7.5, tf));     // ... swaying; one roll, late, shows the back
          flakeObj.rotateZ(0.5 + tf * 0.22);
          _fq.copy(flakeObj.quaternion); flakeObj.quaternion.copy(_fq0).slerp(_fq, smoothstep(0.1, 2.4, tf));    // it peels off the slope first
        }
        heroMat.uniforms.uScar.value.w = smoothstep(27, 27.6, jc) * (1 - smoothstep(34, 39, jc));
      }
    }
    const pav = hero.toWorld(hero.anchors.pavilion), _poi = new THREE.Vector3();
    const uAtZ = (z) => { let lo = 0, hi = 1; for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (path.pointAt(m, _poi).z < z) lo = m; else hi = m; } return (lo + hi) / 2; };
    // [z of the lens, then the point looked at]
    const GAZE = [[259, 3, 50, 385], [300, 6, 31, 385], [322, 7, 25, 384], [336, 7, 36, 385], [348, 5, 50, 387], [358, 0, 60, 400], [367, -6, 66, 416], [386, -10, 65, 425], [396, -10, 67, 428],
      [408, 2, 100, 450], [424, 6, 122, 480], [440, 6, 142, 505], [452, 2, 152, 520], [466, 1, 160, 545], [484, 0, 166, 580], [502, 0, 168, 600]];
    update(0, 0, null, 0); started = false;
    return {
      scene, path, duration: DURATION, pace, title: 'A Thousand Li in Blue and Green',
      camera: { fov: 60, near: 0.4, far: 12000, lookAhead: 30, sway: 0.6, bank: 0.3 },
      // the gaze: the pavilion from the bluff; then the three pictures of the climb (GAZE: where the lens rests at each point of
      // the course: the first fall whole from the lake, its lip and pines against the sky as we go up beside it, the hut ledge
      // with the second fall behind, the third fall with the crown on the left and the far country over the right shoulder);
      // then the gate, from below the third lip
      pois: [{ at: pav, from: uAtClock(2), to: uAtZ(248), weight: 0.78, fade: 0.14 },      // the lens rests on the pavilion while the course swings round the islet
       
        { at: (t, u) => {
            const zc = path.pointAt(clamp(u, 0, 1), _poi).z; let i = 0; while (i < GAZE.length - 2 && zc > GAZE[i + 1][0]) i++;
            const a = GAZE[i], b = GAZE[i + 1], f = smoothstep(a[0], b[0], zc);
            return _poi.set(lerp(a[1], b[1], f), lerp(a[2], b[2], f), lerp(a[3], b[3], f)); },
          from: uAtZ(259), to: uAtZ(502), weight: 0.74, fade: 0.07 },
        { at: new THREE.Vector3(0, 170, 625), from: uAtZ(492), to: uAtClock(37.5), weight: 0.62 }],
      portal: { shape: 'circle', radius: 7, color: '#E9C55A', glow: 0.35, revealDistance: 300 },
      post: { exposure: 1.0, bloom: { strength: 0.22, radius: 0.5, threshold: 1.0 }, grade: { saturation: 1.0, contrast: 1.0, tint: '#ffffff', shadowTint: '#000000', vignette: 0.06, grain: 0, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update, dispose() {},
    };
  },
};
