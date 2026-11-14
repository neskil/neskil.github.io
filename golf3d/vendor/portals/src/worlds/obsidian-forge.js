// THE OBSIDIAN FORGE: a young volcanic world at night. The camera comes up a lava river that steps down
// three basalt terraces from a summit vent throwing a 300 m fountain under a shattered moon.
// World space == the hero's local space (src/parts/obsidian-forge.js at the origin): the river flows toward +Z,
// the camera flies toward -Z and leaves through the portal hanging under the hero's basalt bridge.
// All rock (land, columns, blades, slag-walkers) is lit by the hero's analytic lava emitters + moon rim, so the
// world and the set piece are one picture; the kit supplies sky, smoke, lightning, particles, glows, crystals, grass.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep as sst } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import * as flora from '../kit/flora.js';
import { makeHorizonRidges } from '../kit/terrain.js';
import { buildHero } from '../parts/obsidian-forge.js';

const PALETTE = ['#07040a', '#2a0f1e', '#5a1a1a', '#12101a', '#ff5a1f', '#ffc21a', '#7fe0ff'];
const MOODS = {
  // fog, sky horizon, sky mid, moon colour, portal, grade tint, shadow tint
  ember: { fog: '#210a0e', horizon: '#3d1210', mid: '#1c0a16', moon: '#bfe4ff', tint: '#fff0e4', shadow: '#16060f', pal4: '#ff5a1f', pal5: '#ffc21a' },
  violet: { fog: '#1c0a1a', horizon: '#341024', mid: '#190a22', moon: '#a9d0ff', tint: '#f6ecff', shadow: '#120618', pal4: '#ff4e2a', pal5: '#ffb62a' },
  sulphur: { fog: '#241008', horizon: '#421a0d', mid: '#1a0a1c', moon: '#c4e6f6', tint: '#fff4dc', shadow: '#170805', pal4: '#ff6a16', pal5: '#ffd02a' },
};

export default {
  id: 'obsidian-forge',
  name: 'The Obsidian Forge',
  category: 'alien',
  weirdness: 0.45,
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, DETAIL = clamp((ctx.quality && ctx.quality.detail) || 1, 0.5, 1);
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const scene = new THREE.Scene();
    const time = { value: 0 };
    const xr = (k) => ctx.core.makeRng(((ctx.seed | 0) + 1) * 7919 + k);      // side generators: new features never reshuffle the layout
    // a generator of its own for one kind of thing, made from the seed and the name of what it deals (never from the main stream):
    // nothing that is changed elsewhere can move what it deals. A name is given once and kept
    const ownRng = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));

    // ---------- what this visit is like ----------
    const moodName = rng.pick(['ember', 'ember', 'violet', 'sulphur']), mood = MOODS[moodName];
    const S = {
      haze: rng.range(0.00044, 0.0006),                        // ash haze: how far the fountain carries
      moonAz: rng.range(17, 31), moonEl: rng.range(20.5, 25.5), moonPhase: rng.range(0.62, 0.95), moonSize: rng.range(5.5, 7.5),
      Z2: rng.range(596, 650),                                 // where the second lava fall stands
      dropB: rng.range(14, 18), dropC: rng.range(12, 16),      // heights of the two lower terraces
      amp: rng.sign() * rng.range(26, 46), ph: rng.range(0, 6.28),
      _w: rng.int(2, 4), swarms: rng.int(3, 5), clusters: rng.int(7, 11), blades: rng.int(8, 13),
      ashfall: rng.range(0.5, 1.5), stormEvery: rng.range(2.1, 3.6), smoke: rng.int(2, 4),
      entrySide: rng.sign(),
    };
    const pal = PALETTE.slice(); pal[4] = mood.pal4; pal[5] = mood.pal5;
    const LB = -S.dropB, LC = -S.dropB - S.dropC, Z1 = 300, Z2 = S.Z2;

    // ---------- sky: black-violet, red ash haze at the horizon, the shattered moon ----------
    const arc = rng.range(-28, -8) * Math.PI / 180;            // the fragments trail away along this screen angle
    const frag = (k, size) => ({ elevation: S.moonEl + Math.sin(arc) * -k + rng.range(-1, 1), azimuth: S.moonAz + Math.cos(arc) * -k * 1.15, size,
      color: mood.moon, color2: '#4a5a78', texture: 0.9, phase: S.moonPhase, phaseAngle: 205, intensity: 1.1, glow: 0.05, glowColor: '#7a8cff', glowSize: 1.6, seed: rng.int(1, 999) });
    const sky = makeSky({
      rng, preset: 'night', bake: true, renderer: ctx.renderer,
      zenith: '#06040b', mid: mood.mid, horizon: mood.horizon, ground: '#0c0508', horizonPow: 4.5, midPow: 1.1,
      scatterColor: '#ff4a14', scatter: 0.16, scatterPow: 3.6, scatterHigh: 0.05,
      sunElevation: -20, sunAzimuth: 0, sunIntensity: 0,
      stars: 0.8, starDensity: 0.5, twinkle: 0.5, milkyWay: 0.2,
      bodies: [
        { elevation: S.moonEl, azimuth: S.moonAz, size: S.moonSize, color: mood.moon, color2: '#3c4a66', texture: 1, phase: S.moonPhase, phaseAngle: 205, intensity: 1.25,
          glow: 0.12, glowColor: '#7a8cff', glowSize: 1.8, ring: { inner: 1.5, outer: 2.7, color: '#9fc4e8', opacity: 0.35, tilt: 14, roll: arc * 180 / Math.PI + 180 }, seed: rng.int(1, 999) },
        frag(S.moonSize * 1.75, S.moonSize * 0.3), frag(S.moonSize * 2.6, S.moonSize * 0.17), frag(S.moonSize * 3.3, S.moonSize * 0.1),
      ],
      key: 0,
      clouds: false, clouds2: false,
    });
    scene.add(sky.object);
    await ctx.yield();
    const moonDir = (sky.bodyDirections && sky.bodyDirections[0] ? sky.bodyDirections[0].clone() : V3(0.4, 0.5, -0.76)).normalize();
    const fogCol = new THREE.Color(mood.fog);
    scene.fog = new THREE.FogExp2(fogCol, S.haze);
    scene.background = new THREE.Color('#050308');
    // two lights for the kit's lit materials (grass): the moon, and lava bounce from below
    const moonCol = new THREE.Color(mood.moon);
    const moonLight = new THREE.DirectionalLight(moonCol, 1.6); moonLight.position.copy(moonDir).multiplyScalar(600); scene.add(moonLight);
    scene.add(new THREE.HemisphereLight(new THREE.Color('#32284e'), new THREE.Color(pal[4]).multiplyScalar(0.5), 1.1));
    // the rest of the shattered moon: shards of decreasing size and a dust trail strung along the arc on both sides of it
    {
      const dr = xr(37), DEG = Math.PI / 180, aD = [], aP = [];
      const put = (k, lat, rad, stretch) => {
        const el = S.moonEl - Math.sin(arc) * k + lat * Math.cos(arc) - 0.006 * k * k, az = S.moonAz - Math.cos(arc) * k * 1.15 - lat * Math.sin(arc);
        if (el < 7 || el > 80) return;
        aD.push(Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), -Math.cos(az * DEG) * Math.cos(el * DEG));
        aP.push(rad * DEG, dr(), arc + Math.PI + dr.range(-0.5, 0.5), stretch);
      };
      for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) {
        const k = sd * S.moonSize * (1.32 + i * 0.62 + dr.range(-0.12, 0.12)) + (sd > 0 ? S.moonSize * 0.42 : 0);
        put(k, dr.range(-0.3, 0.3) * S.moonSize, S.moonSize * lerp(0.2, 0.05, i / 5) * dr.range(0.8, 1.2), dr.range(1.0, 1.7));
      }
      for (let i = 0; i < 150; i++) { const k = dr.sign() * S.moonSize * (1.08 + 5.2 * Math.pow(dr(), 1.4)); put(k, dr.gauss() * 0.13 * S.moonSize * (1 + Math.abs(k) / (S.moonSize * 4)), dr.range(0.1, 0.19) * (dr.chance(0.1) ? 1.8 : 1), dr.range(1, 1.5)); }
      const geo = new THREE.InstancedBufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
      geo.setAttribute('aD', new THREE.InstancedBufferAttribute(new Float32Array(aD), 3)); geo.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(aP), 4));
      geo.instanceCount = aD.length / 3;
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, fog: false, uniforms: { uCol: { value: moonCol.clone().lerp(new THREE.Color('#5a6a90'), 0.3).multiplyScalar(0.8) } },
        vertexShader: /* glsl */`
          attribute vec3 aD; attribute vec4 aP; varying vec2 vQ; varying vec2 vS;
          void main(){
            vec3 d = normalize(aD), rt = normalize(cross(d, vec3(0.0, 1.0, 0.0))), up = cross(rt, d);
            float cr = cos(aP.z), sr = sin(aP.z); vec2 q = position.xy * 2.0, o = vec2(q.x * aP.w, q.y);
            o = vec2(o.x * cr - o.y * sr, o.x * sr + o.y * cr) * aP.x;
            vQ = q; vS = vec2(aP.y, aP.x);
            gl_Position = projectionMatrix * viewMatrix * vec4(cameraPosition + (d + rt * o.x + up * o.y) * 5300.0, 1.0);
          }`,
        fragmentShader: /* glsl */`
          varying vec2 vQ; varying vec2 vS; uniform vec3 uCol;
          float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
          float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
            return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
          void main(){
            float s = vS.x * 97.0, a = atan(vQ.y, vQ.x), r = length(vQ);
            float edge = 0.7 + 0.11 * sin(a * 2.0 + s) + 0.08 * sin(a * 3.0 + s * 2.3) + 0.05 * sin(a * 7.0 + s * 4.1);
            float m = smoothstep(edge, edge - fwidth(r) * 1.5 - 0.02, r);
            if (m < 0.01) discard;
            float rn = r / edge;
            vec3 n = normalize(vec3(vQ / edge * 0.95 + (vec2(vn(vQ * 2.5 + s), vn(vQ * 2.5 + s + 7.0)) - 0.5) * 0.9, sqrt(max(1.0 - rn * rn, 0.04))));
            float lit = max(dot(n, normalize(vec3(-0.62, -0.2, 0.76))), 0.0), big = smoothstep(0.004, 0.012, vS.y);
            vec3 col = uCol * lit * mix(0.75, 0.55 + 0.6 * vn(vQ * 4.0 + s * 3.0), big) + vec3(0.012, 0.014, 0.022);
            gl_FragColor = vec4(col, m * mix(0.55, 1.0, big));
          }`,
      });
      const mesh = new THREE.Mesh(geo, mat); mesh.name = 'moon-shards'; mesh.frustumCulled = false; mesh.renderOrder = -0.8; scene.add(mesh);
      await ctx.yield();
      // ash haze: a band of the sky's own horizon colours that swallows the stars below ~15 degrees
      const NS = 64, els = [-5, 1, 4, 7, 10, 13, 16.5], pos = [], col = [], idx = [], c = new THREE.Color(), dv = new THREE.Vector3();
      els.forEach((el, j) => { for (let i = 0; i <= NS; i++) {
        const az = (i / NS) * Math.PI * 2; dv.set(Math.sin(az) * Math.cos(el * DEG), Math.sin(el * DEG), -Math.cos(az) * Math.cos(el * DEG));
        pos.push(dv.x, dv.y, dv.z); sky.colorAt(dv.clone().setY(Math.max(dv.y, 0.02)).normalize(), c); col.push(c.r, c.g, c.b, 0.92 * Math.pow(1 - sst(3.5, 16.5, el), 1.25));
        if (j > 0 && i < NS) { const a0 = (j - 1) * (NS + 1) + i, b0 = a0 + 1, c0 = a0 + NS + 1, d0 = c0 + 1; idx.push(a0, b0, c0, b0, d0, c0); }
      } });
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('aC', new THREE.Float32BufferAttribute(col, 4)); bg.setIndex(idx);
      const band = new THREE.Mesh(bg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
        vertexShader: 'attribute vec4 aC; varying vec4 vC; void main(){ vC = aC; gl_Position = projectionMatrix * viewMatrix * vec4(cameraPosition + position * 5450.0, 1.0); }',
        fragmentShader: 'varying vec4 vC; void main(){ gl_FragColor = vC; }' }));
      band.name = 'ash-haze'; band.frustumCulled = false; band.renderOrder = -0.9; scene.add(band);
    }
    await ctx.yield();

    // ---------- layout (needs the hero's own river course, so it is set up from inside the hero's hooks) ----------
    const shr = xr(11), SH = { x: shr.range(-380, 60), z: -2000, h: shr.range(740, 820), side: shr.sign() };
    // the loops that try places and refuse some (stacks, sails, the sails of the entry plain) each deal from a generator of their own,
    // made here before any land, braid or route exists: a change of course or of a braid can refuse a candidate, it cannot re-deal one
    const stackR = ownRng('forge-stacks'), sailR = ownRng('forge-sails'), entryR = ownRng('forge-entry-sails');
    const pairR = ownRng('forge-entry-pair'), midSailR = ownRng('forge-middle-sails'), landR = ownRng('forge-stubs-landward');
    // the slag-walkers' three lanes: loops at fixed places on the left bank of the middle terrace, their half length a and half width b dealt
    // here, before anything is stood on that bank. LANE: what stands there keeps this far from a lane's centre line (the legs reach 10 m, plus 2 m)
    const laneR = ownRng('forge-walker-lanes'), LANE = 12;
    const lanes = [496, Math.min(560, Z2 - 36), 428].map((z0) => ({ z0, a: laneR.range(17, 20), b: laneR.range(2.2, 2.7) }));
    let L = null;
    const route = (L0) => L0.path || (L0.path = L0.mkPath());
    // ---------- the open view from the lowest terrace ----------
    // From the whole of the route's first stretch, the lowest terrace (from the entry to the brink of the second fall; eyes every 4 m of route
    // metres), two sight lines are kept free of everything the world stands on the plains, stacks and sails alike: the one to the fountain,
    // from its foot at the vent upward, and the one to the moon. A body (in plan a disc of radius R, its top at y) is in the way of the fountain
    // when it reaches higher than 6 m under the line from an eye to the vent while standing nearer to that line than R + 12 m plus the fountain's
    // own half width (45 m at the vent, in proportion along the line); and in the way of the moon when it reaches higher than 4 m under the
    // moon's lower limb while standing nearer than R + 8 m to the cone that the moon's disc fills from that eye.
    // What is in the way steps aside: across the valley to the nearest place where it stands clear (ok(x) says where it may stand at all)
    const sight = (L0) => {
      if (L0.aside) return L0.aside;
      const path = route(L0), eyes = [], P = V3(0, 0, 0), ventY = L0.hl.groundH(0, -430) + 1.5;
      for (let d = 0; d < path.length; d += 4) { path.posAtDist(d, P); if (P.z < Z2) break; eyes.push(P.x, P.y, P.z); }
      const mh = Math.hypot(moonDir.x, moonDir.z) || 1, mx = moonDir.x / mh, mz = moonDir.z / mh, rho = S.moonSize * Math.PI / 180;
      const tanR = Math.tan(rho), tanLow = Math.tan(Math.max(0.02, Math.asin(clamp(moonDir.y, -1, 1)) - rho));
      const inWay = (x, z, R, top) => {
        for (let i = 0; i < eyes.length; i += 3) {
          const ex = eyes[i], ey = eyes[i + 1], ez = eyes[i + 2], dx = -ex, dz = -430 - ez;
          const t = clamp(((x - ex) * dx + (z - ez) * dz) / (dx * dx + dz * dz), 0, 1);
          if (t > 0 && top > ey + (ventY - ey) * t - 6 && Math.hypot(ex + dx * t - x, ez + dz * t - z) < R + 12 + 45 * t) return true;
          const s = (x - ex) * mx + (z - ez) * mz;
          if (s > 0 && top > ey + Math.max(s - R, 0) * tanLow - 4 && Math.abs((x - ex) * mz - (z - ez) * mx) < R + 8 + s * tanR) return true;
        }
        return false;
      };
      // h: how high the body stands over its ground. NaN when there is no clear place within 240 m to either side
      L0.aside = (x, z, R, h, ok) => {
        if (!inWay(x, z, R, L0.terrH(x, z) + h)) return x;
        for (let k = 1; k <= 60; k++) for (const sg of [1, -1]) { const x1 = x + sg * 4 * k; if (ok(x1) && !inWay(x1, z, R, L0.terrH(x1, z) + h)) return x1; }
        return NaN;
      };
      return L0.aside;
    };
    const setup = (hl) => {
      if (L) return L;
      const M = hl.meander;
      // river centre line: the hero's stub down to z = 300, then our meanders across the two lower terraces
      const cx = (z) => { if (z <= Z1) return hl.rx(z); const s = z - Z1; return M + (M / 80) * s * Math.exp(-s / 70) + S.amp * Math.sin(s * 0.0108 + S.ph) * sst(0, 170, s) - S.amp * Math.sin(S.ph) * sst(0, 170, s) * Math.exp(-s / 400); };
      const hwm = (z) => (z <= Z1 ? hl.hw(z) : 17 + 6 * Math.exp(-(((z - 500) / 70) ** 2)) + 7 * Math.exp(-(((z - Z1 - 22) / 20) ** 2)) + 7 * Math.exp(-(((z - Z2 - 24) / 20) ** 2)));
      const c2 = (x) => Z2 + 30 * Math.sin(x * 0.0105 + S.ph * 2) * sst(26, 130, Math.abs(x - cx(Z2)));      // line of the second terrace
      const wallH = (z) => 3.5 + 15 * sst(Z2 + 8, Z2 + 34, z) * (1 - sst(Z2 + 120, Z2 + 200, z));         // gorge below the second fall
      const base = (x, z) => LB * sst(Z1 + 1.5, Z1 + 7.5, z) + (LC - LB) * sst(0, 7, z - c2(x));
      const riverY = (z) => (z < Z1 + 3 ? 0 : z < Z2 + 3 ? LB : LC);
      // braided side channels: leave the river, wander over the plain, come back
      const chans = [];
      const chan = (z0, z1) => chans.push({ z0, z1, side: rng.sign(), amp: rng.range(34, 80), w: rng.range(2.2, 3.6), skew: rng.range(0.6, 1.5) });
      chan(Z1 + rng.range(40, 60), Z1 + rng.range(150, 190)); chan(Z1 + rng.range(130, 170), Z2 - rng.range(36, 60));
      chan(Z2 + rng.range(210, 240), Z2 + rng.range(330, 380)); chan(Z2 + rng.range(180, 260), Z2 + rng.range(430, 520)); chan(Z2 + rng.range(340, 380), Z2 + rng.range(480, 560));
      chans[3].side = S.entrySide; chans[2].side = -S.entrySide;
      // one more braid across the entry plain, on the side of the river the route comes in over. One list of braids: the land is carved
      // for every one of them, and every stack, stub and sail keeps clear of every one of them
      chans.push({ z0: Z2 + 150, z1: 1012, side: S.entrySide, amp: chans[3].amp > 58 ? chans[3].amp - 27 : chans[3].amp + 27, w: 2.9, skew: 0.8 });
      const chanX = (c, z) => cx(z) + c.side * c.amp * Math.pow(Math.sin(Math.PI * Math.pow(clamp((z - c.z0) / (c.z1 - c.z0), 0, 1), c.skew)), 0.75);
      const chanD = (x, z) => { let best = 1e9; for (const c of chans) { if (z < c.z0 || z > c.z1) continue; const d = Math.abs(x - chanX(c, z)) - c.w; if (d < best) best = d; } return best; };
      // a walker's lane: a loop that follows the left bank, its centre line 7.6 to 13 m landward of the bank line
      const laneXZ = (w, th, out) => { const z = w.z0 + w.a * Math.sin(th); return out.set(cx(z) - hwm(z) - 13 + w.b * (1 + Math.cos(th)), 0, z); };
      const NL = 192, lanePts = lanes.map((w) => Array.from({ length: NL + 1 }, (_, k) => laneXZ(w, (k / NL) * Math.PI * 2, V3(0, 0, 0))));
      // metres from a place to the nearest lane's centre line (measured to a polyline of the loop, which cuts its sharp ends short
      // by 4 mm at most: 5 mm are taken off, so the answer is never too large)
      const laneZ0 = Math.min(...lanes.map((w) => w.z0 - w.a)) - 50, laneZ1 = Math.max(...lanes.map((w) => w.z0 + w.a)) + 50;
      const laneD = (x, z) => {
        let best = 1e9;
        if (z < laneZ0 || z > laneZ1) return best;                             // more than 50 m up or down the river from every lane (no margin asked of it is that wide)
        for (const p of lanePts) for (let k = 0; k < NL; k++) {
          const a = p[k], ux = p[k + 1].x - a.x, uz = p[k + 1].z - a.z, t = clamp(((x - a.x) * ux + (z - a.z) * uz) / (ux * ux + uz * uz || 1), 0, 1);
          best = Math.min(best, Math.hypot(x - a.x - ux * t, z - a.z - uz * t));
        }
        return best - 0.005;
      };
      // the plain downstream of the hero (z > 300), relative to its terrace level
      const plainRel = (x, z) => {
        const d = Math.abs(x - cx(z)) - hwm(z), W0 = wallH(z);
        const n1 = noise.fbm2(x * 0.012 + 7.3, z * 0.012 - 3.1, 3), n2 = noise.fbm2(x * 0.07, z * 0.07, 2);
        const swell = 7 * Math.max(0, noise.n2(x * 0.0045 + 3, z * 0.0045)) * sst(50, 220, d);              // tumuli far from the river
        const W = 3.6 + n1 * 2.2 + n2 * 0.7 + swell + (W0 - 3.5) * (1 - 0.84 * sst(30, 125, d));
        const sb = sst(8, 14, W0);
        let h = lerp(-4, W, Math.pow(sst(-3 + 5 * sb, 9 + 8 * sb, d), 0.8 + 0.4 * sb));
        // broken levees: slabs and pressure ridges along the banks instead of a smooth tube
        if (d > -2 && d < 34) h += (noise.ridged2(x * 0.105 + 9, z * 0.105, 2) - 0.42) * 2.6 * sst(-1.5, 3.5, d) * (1 - sst(12, 34, d)) * (1 - 0.6 * sb)
          + Math.round(noise.n2(x * 0.06 + 31, z * 0.06) * 2) * 0.45 * sst(0, 5, d) * (1 - sst(16, 34, d));
        const dc = chanD(x, z);
        if (dc < 11) h = lerp(h, lerp(-1.5, 1.6, sst(-1, 2.5, dc)), (1 - sst(2, 11, dc)) * sst(-5, 5, d));
        return h;
      };
      // hero footprint: grid rectangle + the disc under the cone. > 0 inside (metres from the edge)
      const inset = (x, z) => Math.max(Math.min(329 - Math.abs(x), 299.5 - z, z + 299), 329 - Math.hypot(x, z + 430));
      const own = (x, z) => {                                         // the land around the hero where it has none
        const n1 = noise.fbm2(x * 0.012 + 7.3, z * 0.012 - 3.1, 3), n2 = noise.fbm2(x * 0.07, z * 0.07, 2);
        const zc = hl.cliffZ(x), k = sst(zc + 4, zc - 4, z), rho = Math.hypot(x, z + 430);
        const low = 3.6 + n1 * 2.2 + n2 * 0.7 + 7 * Math.max(0, noise.n2(x * 0.0045 + 3, z * 0.0045)) * sst(60, 220, Math.abs(x));
        // the shield: the vent stands on the flank of a mountain that climbs 800 m behind it
        const dE = Math.hypot((x - SH.x) * 0.6, z - SH.z), t = 1 - sst(0, 1900, dE), gate = sst(330, 1300, rho);
        const dS = Math.hypot(x - SH.x - SH.side * 1050, z - SH.z - 420) / 1000;
        let sh = SH.h * Math.pow(t, 1.35) + SH.h * 0.3 * Math.pow(Math.max(0, 1 - dS * dS), 2);
        sh += t * (70 * noise.fbm2(x * 0.0017 + 3, z * 0.0017, 4) + 55 * (noise.ridged2(x * 0.0026, z * 0.0026 + 5, 3) - 0.35));
        sh -= 60 * Math.exp(-((dE / 150) ** 2));                                   // summit caldera
        const up = 49 + n1 * 5 + n2 + 30 * Math.pow(sst(330, 1700, rho), 1.2) + 26 * Math.max(0, noise.n2(x * 0.0021, z * 0.0021 + 9)) * sst(350, 800, rho) + Math.max(0, sh) * gate;
        return lerp(low, up, k);
      };
      // our terrain: below the hero's own ground inside its footprint, above its edges around it
      const terrInfo = { dip: 0 };
      const terrH = (x, z) => {
        terrInfo.dip = 0;
        if (z > Z1) return base(x, z) + plainRel(x, z);
        const ins = inset(x, z), o = own(x, z);
        if (ins < -40) return o;
        const xc = clamp(x, -328, 328), zc0 = clamp(z, -298, 299), hh = hl.groundH(xc, zc0);
        const zc = hl.cliffZ(x), kU = sst(zc + 4, zc - 4, z);
        const dip = sst(lerp(0, 74, kU), lerp(6, 96, kU), ins);
        terrInfo.dip = dip;
        const edge = Math.max(o, hh + 0.8);
        return lerp(lerp(edge, o, sst(0, -40, ins)), hh - 9, dip);
      };
      // the ground that is actually seen (for standing things on it)
      const groundAt = (x, z) => { const t = terrH(x, z); return terrInfo.dip > 0.02 ? hl.groundH(x, z) : t; };
      // lava light for all rock: capsules along our river and at the two falls
      const E = (za, zb, y, I, hot = 0.3) => [cx(za), y, za, cx(zb), y, zb, 21, I, 0.3, hot];
      // short capsules, so the light follows the meanders (one long straight one ran behind a gorge wall and left both walls black)
      const run = (za, zb, n, y) => Array.from({ length: n }, (_, i) => E(lerp(za, zb, i / n), lerp(za, zb, (i + 1) / n), y, 7.5));
      const emitters = [
        ...run(Z1 + 10, Z2 - 2, 3, LB), ...run(Z2 + 8, Z2 + 300, 4, LC),
        [cx(Z1 + 4) - 15, LB * 0.5, Z1 + 4, cx(Z1 + 4) + 15, LB * 0.5, Z1 + 4, 16, 4.5, 0.35, 0.5],
        [cx(Z2 + 4) - 15, (LB + LC) / 2, Z2 + 4, cx(Z2 + 4) + 15, (LB + LC) / 2, Z2 + 4, 16, 4.5, 0.35, 0.5],
        [cx(455) - hwm(455) - 1, LB + 0.5, 455, cx(520) - hwm(520) - 1, LB + 0.5, 520, 16, 5, 0.4, 0.35],      // the left bank's foot in the middle stretch
      ];
      // camera route: over the veined plain, down into the gorge, up over two falls, then the hero's own line
      const es = S.entrySide;
      // the entry axis looks a little right of the fountain, so torch and moon both sit inside the previous world's portal
      const p1x = cx(900) + es * 22, p0x = p1x + (p1x - 130) * (68 / 1330);
      // the middle terrace is one low banked pass, then the approach to the first fall, flown level: one straight line in plan, at the fall.
      // The rule, in the world's own terms (the melt of the middle terrace lies at LB, the first fall's brink at 0, the fall is -LB high):
      //   the low pass: at z 520 the route is 15 m right of the river's centre line and 7.6 m over the melt; its lowest point is at z 455,
      //     5.2 m over the melt and 10 m LEFT of the centre line, toward the walkers' bank;
      //   the approach: a straight that begins A metres below the brink and is aimed at the route's own next knot above the fall (the hero's
      //     line at z 250), so that the fall stands upright ahead of it and the ride has no bend to lean into, before the brink or over it.
      //     From the river's centre line A metres below, that aim crosses the brink at one point of it; where that would be more than 8 m from
      //     the fall's middle, it crosses 8 m from it (the fall is 35 m wide). The straight that runs on through that point to the next knot
      //     without any bend begins beside the centre line: it is taken where it stays over the melt (2 m or more inside the right bank, 8 m
      //     or more inside the left one, the walkers') and begins no more than 4 m toward the walkers' bank; else the beginning is moved back
      //     toward the centre line by quarters of the way, and what bend is left is made above the fall; from the centre line itself it need
      //     only stay 2 m inside both banks. A is 120 m, or the longest shorter length (in steps of 4 m) for which one of these holds: where
      //     the river bends hard below the fall the straight is shorter. A knot 8 m after its beginning holds the line from there on;
      //   its heights, at five knots evenly along it: 6.5 m over the melt; level with the middle of the fall's sheet; three tenths of the fall's
      //     height under its brink; 3 m over the brink's level; 13 m over the brink as it crosses it. From z 250 on it is the hero's own line up the river.
      // So both falls are come at square on: the second a wall looked up at, the first an upright sheet with the fountain over it
      const approach = () => {
        const xk = hl.rx(250), xm = cx(Z1);
        const brinkX = (A) => xm + clamp(xk + (50 / (50 + A)) * (cx(Z1 + A) - xk) - xm, -8, 8);
        const overMelt = (xa, xb, A, left) => { for (let s = 4; s <= A; s += 4) { const o = xb + (xa - xb) * s / A - cx(Z1 + s), h = hwm(Z1 + s); if (o > h - 2 || o < left - h) return false; } return true; };
        let A = 120, xa = 0, xb = 0, found = false;
        for (; A >= 60 && !found; A -= found ? 0 : 4) {
          const xc = cx(Z1 + A), xl = brinkX(A) + (brinkX(A) - xk) * A / 50; xb = brinkX(A);
          for (let k = 4; k >= 0 && !found; k--) { xa = xc + (k / 4) * (xl - xc); found = k ? xa - xc >= -4 && overMelt(xa, xb, A, 8) : overMelt(xa, xb, A, 2); }
        }
        if (!found) { A = 60; xa = cx(Z1 + A); xb = brinkX(A); }
        const ys = [LB + 6.5, LB / 2, 0.3 * LB, 3, 13], out = [];
        // a short straight leaves a long way from the low pass to its beginning: one knot between them, over the river's centre line
        if (A < 100) { const z = (455 + Z1 + A) / 2; out.push([cx(z), LB + 6, z]); }
        for (let i = 0; i <= 4; i++) {
          out.push([xb + (xa - xb) * (1 - i / 4), ys[i], Z1 + A * (1 - i / 4)]);
          if (i === 0) out.push([xb + (xa - xb) * (1 - 8 / A), ys[0] + (ys[1] - ys[0]) * 8 / (A / 4), Z1 + A - 8]);
        }
        return out;
      };
      const pts = () => [
        [p0x, LC + 27, 968], [p1x, LC + 25.5, 900], [cx(838) + es * 16, LC + 18, 838], [cx(778) + es * 3, LC + 11.5, 778],
        [cx(Z2 + 92) - es * 2, LC + 10, Z2 + 92], [cx(Z2 + 42), LC + 11.5, Z2 + 42], [cx(Z2 + 4), LB + 8.5, Z2 + 4], [cx(Z2 - 34) + 9, LB + 10.5, Z2 - 34],
        [cx(520) + 15, LB + 7.6, 520], [cx(455) - 10, LB + 5.2, 455], ...approach(),
        [hl.rx(250), 15, 250], [hl.rx(190), 12.5, 190], [0, 11.5, 132], [0, 11, 90], [0, 11, 45], [0, 11, 2],
      ];
      // one route: it is flown, and columns, stubs and blades are placed and cleared against it
      // (the curve is built on first use, in a loading step of its own: see route above)
      L = { hl, M, cx, hwm, c2, wallH, base, riverY, chans, chanX, chanD, laneXZ, laneD, plainRel, inset, terrH, terrInfo, groundAt, emitters, path: null, mkPath: () => makePath(pts()) };
      return L;
    };

    // ---------- hooks: our basalt columns and obsidian blades go into the hero's own draw calls ----------
    const SQ3 = Math.sqrt(3);
    const clusters = [];
    const standColumns = async (add, hl) => {
      const L0 = setup(hl);
      await ctx.yield();
      if (!L0.path) { route(L0); await ctx.yield(); }
      const { cx, hwm, c2, wallH, terrH, groundAt, chans, chanX, chanD, laneD, riverY, path } = L0, es = S.entrySide;
      // free-standing column fields on the plains
      clusters.push({ x: cx(912) + es * 132, z: 912, R: 21, peak: rng.range(50, 62) * 0.8 }, { x: cx(868) - es * (hwm(868) + 40), z: 868, R: 15, peak: rng.range(26, 36) });
      // every stack keeps the two sight lines of the lowest terrace open (see sight above): one that would stand in them stands aside, on its own
      // bank. A stack's pipes reach 2 m beyond its radius and, with their lids, 9 m over its peak
      const aside = sight(L0);
      for (const q of clusters) {
        const sd = Math.sign(q.x - cx(q.z)) || 1, x1 = aside(q.x, q.z, q.R + 2, q.peak + 9, (x) => (x - cx(q.z)) * sd > hwm(q.z) + q.R + 25 && path.nearestXZ(x, q.z).dist > q.R + 20);
        if (x1 === x1) q.x = x1;
      }
      await ctx.yield();
      for (let i = 0, tries = 0; i < S.clusters && tries < 500; tries++) {
        // a candidate takes all its numbers (place, radius, height) before any test, so one that is refused never moves those after it
        const z = stackR.range(Z1 + 34, 1050), sd = stackR.sign(), x0 = cx(z) + sd * stackR.range(50, 250), R0 = stackR.range(11, 21), peak = stackR.range(22, 60);
        const x = aside(x0, z, R0 + 2, peak + 9, (x1) => (x1 - cx(z)) * sd >= 50);       // out of the sight lines, never nearer the river than a stack may be dealt
        if (!(x === x)) continue;
        if (Math.abs(z - c2(x)) < R0 + 22 || path.nearestXZ(x, z).dist < R0 + 20 || chanD(x, z) < R0 + 3) continue;
        if (laneD(x, z) < R0 + 2 + LANE) continue;                             // no pipe of it (they reach 2 m beyond R0) in a walker's lane
        if (clusters.some((q) => Math.hypot(q.x - x, q.z - z) < q.R + R0 + 16)) continue;
        clusters.push({ x, z, R: R0, peak: peak * (1 - 0.3 * sst(120, 260, Math.abs(x - cx(z)))) }); i++;
        if ((tries & 31) === 31) await ctx.yield();
      }
      await ctx.yield();
      // two more stacks on the plain of the lowest terrace, on the side of the river the route comes in over, by a rule of the plain: each
      // stands between the downstream end of the second fall's gorge (its walls end 200 m below the fall) and the entry's end of the plain
      // (z 968), 50 to 250 m from the river's centre line as every dealt stack does, its radius and peak dealt as theirs. They come from a
      // generator of their own; a candidate takes all its numbers before any test, and keeps what every stack keeps: the terrace line, the
      // route, the braids, the lanes, the other stacks, the tall sail that frames the entry, and the open view of the lowest terrace (see sight above)
      const grid = clusters.slice();
      for (let n = 0, tries = 0; n < 2 && tries < 400; tries++) {
        const z = pairR.range(Z2 + 200, 968), x0 = cx(z) + es * pairR.range(50, 250), R0 = pairR.range(11, 21), peak = pairR.range(22, 60);
        if ((tries & 31) === 31) await ctx.yield();
        const x = aside(x0, z, R0 + 2, peak + 9, (x1) => (x1 - cx(z)) * es >= 50);
        if (!(x === x)) continue;
        if (Math.abs(z - c2(x)) < R0 + 22 || path.nearestXZ(x, z).dist < R0 + 20 || chanD(x, z) < R0 + 3 || laneD(x, z) < R0 + 2 + LANE) continue;
        if (grid.some((q) => Math.hypot(q.x - x, q.z - z) < q.R + R0 + 16)) continue;
        if (Math.hypot(x - (cx(928) + es * 74), z - 928) < R0 + 16) continue;      // the tall sail that frames the entry stands there (see bladeSpots)
        grid.push({ x, z, R: R0, peak: peak * (1 - 0.3 * sst(120, 260, Math.abs(x - cx(z)))) }); n++;
      }
      clusters.push(...grid.slice(clusters.length));        // the sails, stood after the stacks, keep clear of these two as of every stack
      await ctx.yield();
      const R = 1.7, j1 = Math.ceil((1062 - Z1) / (SQ3 * R));
      for (let i = -170; i <= 170; i++) {
        const x = 1.5 * R * i;
        for (let j = 0; j <= j1; j++) {
          const z = Z1 + 0.7 + SQ3 * R * (j + 0.5 * (i & 1));
          const dzA = z - Z1 - 0.7, dzB = z - c2(x);
          const inA = dzA < 12, inB = dzB > 0.3 && dzB < 12, inG = z > Z2 + 12 && z < Z2 + 205;
          let cl = null;
          for (const q of grid) if (Math.abs(q.x - x) < q.R && Math.abs(q.z - z) < q.R && Math.hypot(q.x - x, q.z - z) < q.R) { cl = q; break; }
          if (!inA && !inB && !inG && !cl) continue;
          const d = Math.abs(x - cx(z)) - hwm(z);
          if (d < 0.8) continue;
          const nA = noise.n2(x * 0.045, z * 0.045), nB = noise.n2(x * 0.83 + 5, z * 0.83), nC = noise.n2(x * 1.9 + 60, z * 1.9);
          const far = 1 - sst(140, 330, Math.abs(x - cx(z)));               // the palisades thin out away from the river
          let top = -1e9;
          if (inA && nC * 0.5 + 0.5 < far * 1.25) { const t = terrH(x, Z1 - 1) + 1.4 + nA * 2.6 + nB * 5 * sst(0, 4, dzA); top = Math.max(top, LB + 3 + (t - LB - 3) * (1 - 0.9 * Math.pow(sst(1.5, 12, dzA), 0.7))); }
          if (inB && nC * 0.5 + 0.5 < far * 1.25) { const t = terrH(x, z - dzB - 2) + 1.4 + nA * 2.6 + nB * 5 * sst(0, 4, dzB); top = Math.max(top, LC + 3 + (t - LC - 3) * (1 - 0.9 * Math.pow(sst(1.5, 12, dzB), 0.7))); }
          if (inG && d < 18) { const W0 = wallH(z); if (W0 > 8) top = Math.max(top, LC + W0 * clamp(0.36 + 0.72 * sst(0, 9, d), 0, 1.06) * (1 - 0.25 * sst(11, 17, d)) + nA * 3 + nB * 5.5); }
          const g = terrH(x, z);
          if (cl) {                                                            // organ-pipe stacks: steep, ragged, with missing pipes
            const rr = Math.hypot(cl.x - x, cl.z - z) / cl.R;
            if (nC < 0.5 - 0.75 * rr * rr) top = Math.max(top, g + cl.peak * Math.pow(1 - rr * rr, 0.45) * (0.45 + 0.55 * (nB * 0.5 + 0.5)) * (0.8 + 0.2 * nA) + nB * 6);
          }
          if (top < g + 1.4) continue;
          const pn = path.nearestXZ(x, z);
          if (pn.dist < 10 && top > pn.y - 9) continue;                        // never in the flight corridor
          const b0 = Math.min(g, d < 4 ? riverY(z) - 3 : g) - 4;
          // stepped lids: every pipe ends a different number of 1.5 m drums up or down, so no wall has a ruled top
          // (no steps within 16 m of the route: there the corridor rule above has the last word on a pipe's height)
          top = Math.max(g + 1.4, top + Math.round(nC * 2.6) * 1.5 * (cl ? 0.6 : 1) * (pn.dist < 16 ? 0 : 1));
          add(x + nB * 0.12, b0, z, R * 0.965, top - b0, 1, 1 - sst(0, 24, d));
        }
        await ctx.yield();
      }
      // broken column stubs littering the banks
      const sr = xr(23);
      // stub: stand one, if the place is free (off the melt, the braids, the terrace line, the flight corridor and the walkers' lanes).
      // The answer says why not: 1 when the land itself refuses it (the melt, a braid of the river's own, the terrace line); 2 when the
      // land would bear it and only the flight corridor, a walker's lane or the braid across the entry plain (the last of the list)
      // refuses it; 0 when it stands
      const stub = (x, z, r, hgt) => {
        if (Math.abs(x - cx(z)) - hwm(z) < 2.5 || Math.abs(z - c2(x)) < 15) return 1;
        for (let k = 0; k < chans.length - 1; k++) { const c = chans[k]; if (z >= c.z0 && z <= c.z1 && Math.abs(x - chanX(c, z)) - c.w < 3) return 1; }
        const g = groundAt(x, z), pn = path.nearestXZ(x, z);
        if (pn.dist < 8 && g + hgt > pn.y - 6) return 2;                       // never in the flight corridor
        if (chanD(x, z) < 3 || laneD(x, z) < r + LANE) return 2;               // none in the entry plain's braid, none in a walker's lane
        add(x, g - 2, z, r, hgt + 2, 1, 1 - sst(0, 24, Math.abs(x - cx(z)) - hwm(z)));
        return 0;
      };
      let owed = 0;                                                            // stubs that the corridor, the lanes and the entry plain's braid have refused
      for (let i = 0; i < 92; i++) {
        const z0 = sr.range(i < 22 ? 40 : Z1 + 16, i < 22 ? Z1 - 12 : 1010), sd = sr.sign(), d0 = sr.range(3.5, 26), n = sr.int(2, 6);
        for (let k = 0; k < n; k++) {
          // a stub takes all its numbers (place, radius, height) before any test, so one that is refused never moves those after it
          const z = z0 + sr.range(-3.2, 3.2), x = cx(z) + sd * (hwm(z) + d0 + sr.range(-3, 3)), r = sr.range(0.6, 1.25), hgt = sr.range(0.7, 3.4) * (k === 0 ? 1.5 : 1);
          if (stub(x, z, r, hgt) === 2 && z > Z1) owed++;                      // (owed on the two lower terraces only: the walkers' bank lies there)
        }
        if ((i & 7) === 7) await ctx.yield();
      }
      // the stubs so refused lie landward of the lanes instead, the same number of them: the walkers have trodden their bank bare and
      // what they broke lies behind their loops. Dealt from a generator of its own by the stubs' own rule (a group of 2 to 6 round one place,
      // 3.2 m up and down the river and 3 m to and from it, the same sizes), on the left bank along the lanes' whole reach, in a band as
      // deep as the bank's own (22.5 m) that begins where no lane can refuse a stub: a lane's centre line lies up to 13 m back from the
      // bank, the keep-clear is 12 m and a stub's radius up to 1.25 m, its scatter 3 m: 29.5 to 52 m back from the bank
      const lz0 = Math.min(...lanes.map((w) => w.z0 - w.a)), lz1 = Math.max(...lanes.map((w) => w.z0 + w.a));
      for (let i = 0; owed > 0 && i < 60; i++) {
        const z0 = landR.range(lz0, lz1), d0 = landR.range(29.5, 52), n = landR.int(2, 6);
        for (let k = 0; k < n; k++) {
          const z = z0 + landR.range(-3.2, 3.2), x = cx(z) - (hwm(z) + d0 + landR.range(-3, 3)), r = landR.range(0.6, 1.25), hgt = landR.range(0.7, 3.4) * (k === 0 ? 1.5 : 1);
          if (owed > 0 && stub(x, z, r, hgt) === 0) owed--;
        }
        if ((i & 7) === 7) await ctx.yield();
      }
    };
    const bladeSpots = (hl) => {
      const L0 = setup(hl), { cx, hwm, c2, terrH, chanD, laneD } = L0, path = route(L0), es = S.entrySide, out = [];
      const put = (x, z, h) => out.push([x, terrH(x, z), z, h]);
      // every sail keeps the two sight lines of the lowest terrace open, like the stacks (see sight above): one that would stand in them stands aside.
      // clearX: where a sail of height h (half width at most a fifth of that) stands clear, the nearest such place to x that ok allows; x itself if none
      const aside = sight(L0), clearX = (x, z, h, ok) => { const x1 = aside(x, z, 0.2 * h, h, ok); return x1 === x1 ? x1 : x; };
      const offRoute = (z) => (x) => path.nearestXZ(x, z).dist > 21;
      { const h0 = rng.range(34, 42), h1 = rng.range(20, 25); put(clearX(cx(928) + es * 74, 928, h0, offRoute(928)), 928, h0); put(clearX(cx(902) - es * 9, 902, h1, offRoute(902)), 902, h1); }     // sails framing the entry
      // a sail keeps clear of a walker's lane by LANE plus its own half width (at most a fifth of its height)
      const offLane = (x, z, h) => laneD(x, z) > LANE + 0.2 * h;
      // seeded sails: every candidate is dealt from a generator of its own (one draw of the sails' stream each), so one that is refused
      // by the route, a braid or a lane never moves those after it
      for (let i = 0, tries = 0; i < S.blades && tries < 400; tries++) {
        const c = sailR.fork('sail'), z = c.range(Z1 + 26, 860), sd = c.sign(), x0 = cx(z) + sd * (hwm(z) + c.range(15, 85)), h = c.range(10, 30);
        const x = aside(x0, z, 0.2 * h, h, (x1) => (x1 - cx(z)) * sd >= hwm(z) + 15);        // out of the sight lines, on its own bank
        if (!(x === x)) continue;
        if (path.nearestXZ(x, z).dist < 21 || Math.abs(z - c2(x)) < 16 || chanD(x, z) < 6 || !offLane(x, z, h)) continue;
        if (out.some((q) => Math.hypot(q[0] - x, q[2] - z) < 18) || clusters.some((q) => Math.hypot(q.x - x, q.z - z) < q.R + 6)) continue;
        put(x, z, h); i++;
        for (let k = c.int(0, 2); k > 0; k--) { const sx0 = x + c.range(-7, 7), sz = z + c.range(-7, 7), sh = c.range(4, 11), sx = clearX(sx0, sz, sh, (x1) => chanD(x1, sz) > 3 && offLane(x1, sz, sh)); if (chanD(sx, sz) > 3 && offLane(sx, sz, sh)) put(sx, sz, sh); }
      }
      for (const [z, off, h] of [[735, 78, 27], [728, 86, 10]]) {            // sails on the entry side (no rng)
        const fits = (x) => path.nearestXZ(x, z).dist > 21 && chanD(x, z) > 6 && !out.some((q) => Math.hypot(q[0] - x, q[2] - z) < 6);
        const x = clearX(cx(z) + es * (hwm(z) + off - 17), z, h, (x1) => (x1 - cx(z)) * es > hwm(z) + 15 && fits(x1));
        if (fits(x)) put(x, z, h);
      }
      // five sails scattered on the bare side of the entry plain, between z 826 and 934 and 57 to 83 m from the river's centre line on the side
      // the route comes in over: black glass that takes the moon rim. Dealt like the seeded sails (each candidate from a generator of its own),
      // and each stands clear of every braid by the 6 m, and of every other sail by the 18 m, that the seeded sails keep
      for (let i = 0, tries = 0; i < 5 && tries < 200; tries++) {
        const c = entryR.fork('sail'), z = c.range(826, 934), x0 = cx(z) + es * c.range(57, 83), h = c.range(15, 27);
        const x = aside(x0, z, 0.2 * h, h, (x1) => (x1 - cx(z)) * es >= 57);                // out of the sight lines, on the side it was dealt to
        if (!(x === x)) continue;
        if (path.nearestXZ(x, z).dist < 30 || chanD(x, z) < 6 || Math.abs(z - c2(x)) < 16) continue;
        if (out.some((q) => Math.hypot(q[0] - x, q[2] - z) < 18) || clusters.some((q) => Math.hypot(q.x - x, q.z - z) < q.R + 6)) continue;
        put(x, z, h); i++;
      }
      // three tall sails on the left bank of the middle terrace, the walkers' bank, between the first fall and the far end of the last
      // walker's loop (its centre at lanes[2].z0, its half length a). Dealt like the five of the entry plain, each candidate from a generator
      // of its own: z from 26 m below the first fall (clear of the palisade under its brink, as the seeded sails are) to that far end;
      // 34 to 58 m back from the bank (a lane's centre line lies up to 13 m back, the legs reach 12 m more and a tall sail is 7 m to a
      // side; the tumuli of the far plain begin 50 m from the bank and are still low at 58 m); 26 to 34 m high (the terrace above lies 14 to 18 m over this one:
      // their upper halves stand over its rim). They keep the seeded sails' margins: the route, the braids, the lanes, the terrace line,
      // the other sails and the stacks, and the open view of the lowest terrace
      for (let i = 0, tries = 0; i < 3 && tries < 600; tries++) {
        const c = midSailR.fork('sail'), z = c.range(Z1 + 26, lanes[2].z0 + lanes[2].a), back = c.range(34, 58), h = c.range(26, 34);
        const x = aside(cx(z) - (hwm(z) + back), z, 0.2 * h, h, (x1) => { const b = cx(z) - x1 - hwm(z); return b >= 34 && b <= 58; });      // out of the sight lines, within the bounds it may be dealt in
        if (!(x === x)) continue;
        if (out.some((q) => Math.hypot(q[0] - x, q[2] - z) < 18) || clusters.some((q) => Math.hypot(q.x - x, q.z - z) < q.R + 6)) continue;
        if (path.nearestXZ(x, z).dist < 21 || Math.abs(z - c2(x)) < 16 || chanD(x, z) < 6 || !offLane(x, z, h)) continue;
        put(x, z, h); i++;
      }
      return out;
    };

    // ---------- the hero: fountain, last fall, basalt bridge ----------
    const hero = await buildHero(ctx, { palette: pal, moonDir, emitters: (hl) => setup(hl).emitters, columns: standColumns, bladeSpots });
    scene.add(hero.object);
    const A = hero.anchors, hl = hero.layout;
    const { cx, hwm, c2, base, riverY, chans, chanX, chanD, laneXZ, terrH, terrInfo, groundAt } = setup(hl), path = route(setup(hl));
    await ctx.yield();

    // ---------- our land: one mesh warped around the river, drawn with the hero's own terrain material ----------
    {
      const rowsZ = [];
      for (let z = 1168; z > 1014; z -= 14) rowsZ.push(z);
      for (let z = 1014; z > 296.5; z -= 3) rowsZ.push(z);
      for (let z = 294; z > -150; z -= 12) rowsZ.push(z);
      for (let z = -150, st = 22; z > -4000; z -= st, st = Math.min(st * 1.16, 64)) rowsZ.push(z);
      const NX = 120, NR = rowsZ.length, n = NR * (NX + 1);
      const pos = new Float32Array(n * 3), dat = new Float32Array(n * 3), dipped = new Uint8Array(n), idx = [];
      for (let r = 0, v = 0; r < NR; r++) {
        const z = rowsZ[r], c = cx(z), cz = z > Z1;
        for (let i = 0; i <= NX; i++, v++) {
          const t = (i / NX) * 2 - 1, at = Math.abs(t), wide = sst(-160, -900, z);
          const x = (wide > 0 ? lerp(c, SH.x * 0.6, wide) : c) + Math.sign(t) * lerp(112 * at + 1040 * at * at * at * at, 3500 * (0.22 * at + 0.78 * at * at), wide);
          let y = terrH(x, z); dipped[v] = terrInfo.dip > 0.999 ? 1 : 0;
          // no sill across the river above the first fall: this mesh's edge stood 4 m over the melt there, a pale lintel the fall seemed to pour from under
          if (!cz && z > 289) { const dch = Math.abs(x - hl.rx(z)) - hl.hw(z); if (dch < 6) y = Math.min(y, lerp(-4.6, y, sst(-1, 6, dch))); }
          pos[v * 3] = x; pos[v * 3 + 1] = y; pos[v * 3 + 2] = z;
          let prox = 0, ao = 1;
          if (cz) {
            const d = Math.abs(x - c) - hwm(z), dc = chanD(x, z);
            const veins = 0.82 * sst(-0.08, 0.4, noise.fbm2(x * 0.0065 + 11, z * 0.0065, 2)) * sst(Z1 + 14, Z1 + 80, z) * (1 - 0.4 * sst(880, 930, z));
            prox = Math.max(1 - sst(-2, 30, d), 1 - sst(-1, 13, dc), veins);
            ao = Math.min(0.55 + 0.45 * sst(-4, 16, d), 0.6 + 0.4 * sst(-2, 6, dc));
          }
          dat[v * 3] = prox; dat[v * 3 + 1] = ao; dat[v * 3 + 2] = 0;
        }
        if (r > 0) for (let i = 0; i < NX; i++) {
          const a = (r - 1) * (NX + 1) + i, b = a + 1, cc = a + NX + 1, dd = cc + 1;
          if (dipped[a] && dipped[b] && dipped[cc] && dipped[dd]) continue;
          idx.push(a, b, cc, b, dd, cc);
        }
        await ctx.yield();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aData', new THREE.BufferAttribute(dat, 3));
      geo.setIndex(idx); await ctx.yield();
      // normals from the grid itself, a few rows at a time (computeVertexNormals on 43k vertices is one long stall)
      const nrm = new Float32Array(n * 3), W1 = NX + 1;
      for (let r = 0; r < NR; r++) {
        const r0 = Math.max(r - 1, 0) * W1, r1 = Math.min(r + 1, NR - 1) * W1;
        for (let i = 0; i <= NX; i++) {
          const a = (r * W1 + Math.max(i - 1, 0)) * 3, b = (r * W1 + Math.min(i + 1, NX)) * 3, c = (r0 + i) * 3, d = (r1 + i) * 3;
          const ax = pos[b] - pos[a], ay = pos[b + 1] - pos[a + 1], az = pos[b + 2] - pos[a + 2], bx = pos[d] - pos[c], by = pos[d + 1] - pos[c + 1], bz = pos[d + 2] - pos[c + 2];
          let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
          const l = Math.hypot(nx, ny, nz) || 1, o = (r * W1 + i) * 3; nrm[o] = nx / l; nrm[o + 1] = ny / l; nrm[o + 2] = nz / l;
        }
        if ((r & 31) === 31) await ctx.yield();
      }
      geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); await ctx.yield();
      const mesh = new THREE.Mesh(geo, hero.materials.terrain); mesh.name = 'forge-plain'; scene.add(mesh);
    }
    await ctx.yield();

    // ---------- molten river on the two lower terraces + braided side channels (the hero's river material) ----------
    {
      const pos = [], uv = [], idx = [];
      // deep(z): how deep the channel is there, for the river material's gold core. The river is deepest where it runs at its ordinary width
      // (17 m to a side: 1); where it spreads into the lake of the middle terrace and the pools under the two falls the same melt lies
      // shallower and more of it skins over (the cube of 17 m over its half width there); a braid is a shallow vein and keeps its crust
      const riverDeep = (z) => Math.pow(Math.min(1, 17 / hwm(z)), 3);
      const ribbon = (z0, z1, step, NC, centre, halfW, yAt, deepAt = riverDeep) => {
        const o = pos.length / 3; let r = 0;
        for (let z = z0; ; z = Math.min(z + step, z1), r++) {
          const c0 = centre(z), w = halfW(z), deep = deepAt(z);
          for (let i = 0; i <= NC; i++) { const u = (i / NC) * 2 - 1, x = c0 + u * w; pos.push(x, yAt(x, z), z); uv.push(u * w, 300 + (z - Z1), u, deep); }
          if (r > 0) for (let i = 0; i < NC; i++) { const a = o + (r - 1) * (NC + 1) + i, b = a + 1, c = a + NC + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
          if (z >= z1) break;
        }
      };
      ribbon(Z1 + 4.2, Z2 + 1.2, 5, 10, cx, (z) => hwm(z) + 4.5, () => LB);
      ribbon(Z2 + 4.6, 1168, 5, 10, cx, (z) => hwm(z) + 4.5, () => LC);
      for (const c of chans) {
        const slope = (z) => (chanX(c, z + 2) - chanX(c, z - 2)) / 4;
        ribbon(c.z0, c.z1, 3.5, 2, (z) => chanX(c, z), (z) => (c.w + 1.7) * Math.min(2.2, Math.hypot(1, slope(z))),
          (x, z) => base(chanX(c, z), z) + lerp(-0.14, 0.55, sst(0, 14, Math.abs(chanX(c, z) - cx(z)) - hwm(z))), () => 0.2);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 4)); geo.setIndex(idx);
      const mesh = new THREE.Mesh(geo, hero.materials.river); mesh.name = 'forge-lower-river'; scene.add(mesh);
    }
    await ctx.yield();

    // ---------- the two lower lava falls ----------
    const falls = [{ z: Z1, top: 0, drop: -LB }, { z: Z2, top: LB, drop: LB - LC }].map((f) => ({ ...f, x: cx(f.z + 2), hw: hwm(f.z) - 0.5 }));
    {
      const NXF = 40, pos = [], uv = [], idx = [];
      for (const f of falls) {
        const rows = [], o = pos.length / 3, y0 = f.top + 0.14;
        for (let r = 0; r < 4; r++) rows.push({ z: f.z - 9 + 2.5 * r, y: y0, tau: -1 + (0.8 * r) / 3 });
        rows.push({ z: f.z - 0.6, y: y0 - 0.03, tau: -0.1 }, { z: f.z + 0.1, y: y0 - 0.14, tau: -0.04 });     // the melt rolls over a rounded brink
        for (let r = 0; r <= 20; r++) { const t = r / 20; rows.push({ z: f.z + 0.6 + 7.4 * t, y: y0 - 0.36 - (f.drop + 0.3) * t * t - 1.0 * t, tau: t }); }     // thrown well clear of the cliff under it
        rows.forEach((q, r) => {
          const t = Math.max(q.tau, 0), k = sst(-0.15, 0.25, q.tau);
          for (let i = 0; i <= NXF; i++) {
            const u = (i / NXF) * 2 - 1, x = cx(Math.min(q.z, f.z + 2)) + u * f.hw;
            const lobe = Math.max(-0.25, 0.8 + 1.1 * noise.n2(x * 0.14, f.z) + 1.5 * noise.n2(x * 0.2, f.z + 50));   // the sheet bulges between the teeth, and never back into the rock
            const notch = 0.7 * (noise.n2(x * 0.11, f.z + 9) * 0.5 + 0.5) * sst(-0.5, 0, q.tau) * (1 - 0.6 * t);  // and the lip is not a ruled line
            pos.push(x, q.y - notch, q.z + lobe * k * (1 - 0.4 * t)); uv.push(u * f.hw, q.tau, f.hw);
          }
          if (r > 0) for (let i = 0; i < NXF; i++) { const a = o + (r - 1) * (NXF + 1) + i, b = a + 1, c = a + NXF + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
        });
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 3)); geo.setIndex(idx);
      const mat = new THREE.ShaderMaterial({
        fog: true, side: THREE.DoubleSide, uniforms: hero.lavaUniforms(),
        vertexShader: /* glsl */`
          attribute vec3 aUV; varying vec3 vUV; uniform float uTime;
          #include <fog_pars_vertex>
          void main(){ vUV = aUV; vec3 P = position; float t = max(aUV.y, 0.0);
            P.z += (sin(P.x * 0.41 + t * 7.0 - uTime * 2.3) * 0.45 + sin(P.x * 1.03 - uTime * 1.7 + t * 11.0) * 0.2) * t;
            vec4 mvPosition = modelViewMatrix * vec4(P, 1.0); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vUV; uniform float uTime; uniform vec3 uLavaCol, uHotCol;
          #include <fog_pars_fragment>
          ${hero.glsl.noise}
          void main(){
            float x = vUV.x, tau = vUV.y, t = max(tau, 0.0), hw = vUV.z;
            float wn = fb(vec2(x * 0.5, t * 2.0 - uTime * 0.4));
            float m = smoothstep(hw - 0.3, hw - 3.2, abs(x) + (wn - 0.5) * 4.0 * (0.4 + t));
            float thr = fb(vec2(x * 1.7, t * 0.3 - uTime * 0.55));                               // long slits, never round holes
            m *= smoothstep(0.02, 0.2, thr + 0.12 - 0.36 * t);                                   // the sheet tears into separate tongues on the way down: black rock shows between them
            if (m < 0.5) discard;
            // basalt teeth split the curtain at the lip: wedges of black rock, not holes
            float teeth = fb(vec2(x * 0.21 + hw, 3.0)), tw = 0.055 * (1.0 - t * 1.25), td = abs(teeth - 0.5);
            float tooth = (1.0 - smoothstep(tw - 0.012, tw, td)) * smoothstep(0.0, 0.012, tw) * smoothstep(-0.6, -0.2, tau) * (1.0 - smoothstep(0.35, 0.6, t));
            float fall = t * 2.2 - uTime * 1.5;
            float streak = fb(vec2(x * 1.3, fall * 0.9)) * 0.45 + fb(vec2(x * 4.1, fall * 0.5)) * 0.3 + fb(vec2(x * 9.0, fall * 0.35)) * 0.25;
            float clot = smoothstep(0.5, 0.8, fb(vec2(x * 6.0, fall * 0.25)));                // long thin cooling skins riding the melt
            float heat = 0.82 - 0.34 * t - 0.4 * clot * (0.35 + t) + (streak - 0.5) * 0.75;
            heat += 0.12 * smoothstep(0.3, 0.0, t) * smoothstep(-0.25, 0.0, tau);                // the brink is the hottest: fresh melt rolling over
            heat -= 0.22 * smoothstep(hw - 7.0, hw - 1.0, abs(x));                           // thinner and cooler at the edges
            heat -= 0.3 * smoothstep(tw + 0.05, tw, td) * (1.0 - t);                         // and where it parts round a tooth
            heat = mix(heat, 0.42 + 0.4 * streak, step(tau, 0.0) * 0.85 * smoothstep(-0.02, -0.3, tau));
            heat = max(heat, (0.8 + 0.25 * fb(vec2(x * 0.9, uTime * 1.7 + t * 4.0))) * smoothstep(0.78, 0.95, t));   // the sheet rejoins in a bright splash band
            vec3 col = lavaRamp(clamp(heat, 0.0, 0.88));                                        // yellow-white at the brink, never a flat white panel
            vec3 rock = vec3(0.011, 0.009, 0.014) * (0.5 + 1.0 * fb(vec2(x * 2.3, t * 9.0 + tau * 3.0))) + vec3(0.32, 0.03, 0.0) * smoothstep(tw * 0.35, tw, td) * 0.6;
            gl_FragColor = vec4(mix(col, rock, tooth), 1.0);
            #include <fog_fragment>
          }`,
      });
      const mesh = new THREE.Mesh(geo, mat); mesh.name = 'forge-lower-falls'; scene.add(mesh);
    }
    falls.forEach((f, i) => hero.uniforms.falls.value[i].set(f.x, f.z, f.hw, 1));           // the river churns where they land
    await ctx.yield();

    // ---------- slag-walkers: armoured six-legged waders with molten seams (one instanced draw call) ----------
    const walkers = [];
    let walkerMesh = null;
    {
      const pos = [], nor = [], kk = [], idx = [], m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), v = new THREE.Vector3(), nm = new THREE.Matrix3();
      const part = (g, kind, phase = 0, wf = null, hf = null) => {
        const o = pos.length / 3, p = g.attributes.position, nn = g.attributes.normal; nm.getNormalMatrix(m4);
        for (let i = 0; i < p.count; i++) {
          const lx = p.getX(i), ly = p.getY(i), lz = p.getZ(i);
          v.set(lx, ly, lz).applyMatrix4(m4); pos.push(v.x, v.y, v.z);
          v.set(nn.getX(i), nn.getY(i), nn.getZ(i)).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z);
          kk.push(kind, phase, wf ? wf(lx, ly, lz) : 0, hf ? hf(lx, ly, lz) : 0);
        }
        if (g.index) { const ix = g.index.array; for (let i = 0; i < ix.length; i++) idx.push(o + ix[i]); } else for (let i = 0; i < p.count; i++) idx.push(o + i);
        g.dispose();
      };
      const TRS = (x, y, z, sx, sy, sz, rx = 0) => m4.compose(v.set(x, y, z), q4.setFromAxisAngle(new THREE.Vector3(1, 0, 0), rx), new THREE.Vector3(sx, sy, sz));
      const rim = (x, y) => 1 - sst(0.02, 0.42, y);
      for (let i = 0; i < 7; i++) {                                          // broad overlapping shield plates, slung low
        const w = 2.3 * Math.pow(Math.sin((Math.PI * (i + 0.95)) / 7.9), 0.6);
        TRS(0, 0.86 + 0.08 * w + 0.05 * (i & 1), -3.3 + i * 1.1, w * 1.06, (0.62 + 0.2 * w) * 0.7, 0.76, -0.36);          // seven domed shingles, each lifting its front lip over the next: the melt shows in the valley between two
        part(new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), 0, 0, null, (x, y, z) => Math.max(rim(x, y), 0.6 * sst(0.46, 0.78, Math.abs(z))));
      }
      // the head: a low armoured wedge under a brow plate, two molten eye pits, two short horns
      TRS(0, 0.92, 4.75, 1.2, 0.74, 1.45, 0.2); part(new THREE.SphereGeometry(1, 16, 10), 0);
      TRS(0, 1.2, 4.3, 1.42, 0.62, 1.05, 0.12); part(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), 0, 0, null, rim);
      for (const s of [-1, 1]) {
        m4.compose(v.set(s * 0.62, 1.02, 5.72), q4.identity(), new THREE.Vector3(0.3, 0.2, 0.26)); part(new THREE.SphereGeometry(1, 10, 8), 4);
        TRS(s * 0.78, 1.5, 5.0, 1, 1, 1, 0.95); part(new THREE.ConeGeometry(0.2, 1.5, 8), 0, 0, null, (x, y) => sst(0.2, 0.7, y) * 0.7);
      }
      TRS(0, 1.0, -4.8, 1, 1, 1, -1.75); part(new THREE.ConeGeometry(0.62, 2.6, 10), 0);                                                             // tail spike
      TRS(0, 0.8, 0.2, 1.9, 0.78, 4.1); part(new THREE.SphereGeometry(1, 14, 8), 1);                                                                   // molten core between the plates
      await ctx.yield();
      const Y = new THREE.Vector3(0, 1, 0);
      // limbs and their armour are faceted, like the basalt they walk among: every face takes the lava or the moon on its own
      const facet = (g) => { const f = g.toNonIndexed(); g.dispose(); f.computeVertexNormals(); return f; };
      // a limb: a tapered prism from a to b; w0..w1 is how much of the step it takes, hot(k) lights a seam along it (k: 0 at a .. 1 at b)
      const seg = (a, b, r0, r1, phase, w0, w1, kind = 2, hot = null, sides = 6) => {
        const d = b.clone().sub(a), len = d.length();
        m4.compose(a.clone().add(b).multiplyScalar(0.5), q4.setFromUnitVectors(Y, d.normalize()), new THREE.Vector3(1, 1, 1));
        part(facet(new THREE.CylinderGeometry(r1, r0, len, sides, 1)), kind, phase, (x, y) => lerp(w0, w1, y / len + 0.5), hot ? (x, y) => hot(y / len + 0.5) : null);
      };
      // a lozenge of armour: a faceted plate with its long axis along `axis`, th thick, wd wide (along the body)
      const plate = (c, axis, th, ln, wd, phase, wf, hf = null) => {
        m4.compose(c, q4.setFromUnitVectors(Y, axis.clone().normalize()), new THREE.Vector3(th, ln, wd));
        part(facet(new THREE.OctahedronGeometry(1, 0)), 3, phase, wf, hf);
      };
      for (const s of [-1, 1]) for (let li = 0; li < 4; li++) {              // eight thick, short legs, each ending in a point
        if (li === 0) await ctx.yield();
        const zl = -3.0 + li * 2.0, ph = ((li + (s > 0 ? 1 : 0)) % 2) * Math.PI;
        const hip = V3(s * 1.3, 0.95, zl), knee = V3(s * 3.5, 1.8, zl + 0.15), ankle = V3(s * 4.25, -0.2, zl + 0.12), toe = V3(s * 4.5, -1.25, zl + 0.1);
        // dark armoured limbs: the melt shows only in a seam at each joint
        seg(hip, knee, 0.5, 0.4, ph, 0, 0.35, 2, (k) => 0.5 * sst(0.9, 0.99, k), 6);
        seg(knee, ankle, 0.38, 0.26, ph, 0.35, 0.85, 2, (k) => 0.5 * Math.max(1 - sst(0.01, 0.08, k), sst(0.9, 0.99, k)), 5);
        seg(ankle, toe, 0.27, 0.03, ph, 0.85, 1, 3, (k) => 0.45 * (1 - sst(0.02, 0.12, k)), 4);
        m4.compose(knee, q4.identity(), new THREE.Vector3(0.27, 0.26, 0.27)); part(new THREE.SphereGeometry(1, 8, 6), 2, ph, () => 0.35, () => 0.55);   // a small molten joint under the knee plate
        const thigh = knee.clone().sub(hip), shin = ankle.clone().sub(knee);
        plate(V3(knee.x + s * 0.3, knee.y + 0.22, knee.z), V3(s * 0.72, 0.7, 0), 0.3, 0.86, 0.6, ph, () => 0.35);                                        // a horned knee plate
        plate(hip.clone().lerp(knee, 0.52).add(V3(0, 0.3, 0)), thigh, 0.22, thigh.length() * 0.56, 0.66, ph, (x, y) => lerp(0, 0.35, 0.52 + y * 0.56));      // a lozenge lying along the thigh
        plate(knee.clone().lerp(ankle, 0.46).add(V3(s * 0.24, 0, 0)), shin, 0.26, shin.length() * 0.52, 0.5, ph, (x, y) => lerp(0.35, 0.85, 0.46 + y * 0.52), (x, y) => 0.3 * sst(0.7, 1, y));   // a keeled greave, its lower point hot
      }
      await ctx.yield();
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      geo.setAttribute('aK', new THREE.Float32BufferAttribute(kk, 4)); geo.setIndex(idx);
      // always three, each on a loop of its own at a fixed place on the left bank of the middle terrace; the first is the largest.
      // Which way each one goes round and where on its loop it starts are seeded; they walk on the world clock
      await ctx.yield();
      // (the lanes themselves, place, length and width, are dealt before the hero's hooks: see lanes above)
      const seeds = new Float32Array(lanes.length);
      lanes.forEach(({ z0, a, b }, i) => {
        const x0 = 0, dir = rng.sign(), size = rng.range(1.6, 1.9), tab = [0];
        for (let k = 1; k <= 64; k++) { const t0 = ((k - 1) / 64) * Math.PI * 2, t1 = (k / 64) * Math.PI * 2; tab.push(tab[k - 1] + Math.hypot(b * (Math.cos(t1) - Math.cos(t0)), a * (Math.sin(t1) - Math.sin(t0)))); }
        seeds[i] = rng();
        walkers.push({ x0, z0, a, b, dir, size: size * (i === 0 ? 1.26 : 1.12), tab, s0: rng.range(0, tab[64]), y: LB + 0.2 });
      });
      geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
      await ctx.yield();
      const mat = new THREE.ShaderMaterial({
        fog: true, uniforms: hero.lightUniforms(),
        vertexShader: /* glsl */`
          attribute vec4 aK; attribute float aSeed; uniform float uTime; varying vec4 vK; varying vec3 vL;
          ${hero.glsl.vertHead}
          void main(){
            vec3 lp = position; float w = aK.z, ph = uTime * 1.5 + aSeed * 6.2832 + aK.y;
            lp.z += sin(ph) * 0.85 * w; lp.y += max(cos(ph), 0.0) * 0.8 * w;                 // tripod gait
            lp.y += 0.08 * sin(uTime * 3.0 + aSeed * 12.6) * (1.0 - w);                      // the body rides the steps
            lp.x += 0.07 * sin(uTime * 1.5 + aSeed * 6.2832 + lp.z * 0.5) * (1.0 - w);       // and snakes a little
            vK = aK; vL = lp;
            vec3 P = (instanceMatrix * vec4(lp, 1.0)).xyz, N = normalize(mat3(instanceMatrix) * normal);
            ${hero.glsl.vertTail} }`,
        fragmentShader: /* glsl */`
          varying vec3 vP; varying vec3 vN; varying vec3 vCam; varying vec4 vK; varying vec3 vL; uniform float uTime;
          #include <fog_pars_fragment>
          ${hero.glsl.light}
          ${hero.glsl.noise}
          void main(){
            vec3 P = vP, N = normalize(vN); float dist = length(vCam - P); vec3 V = (vCam - P) / dist; vec3 col;
            if (vK.x > 3.5) {                                                                 // eye pits: two coals that never go out
              col = lavaRamp(0.86 + 0.05 * sin(uTime * 2.7 + vL.x * 9.0)) * (0.55 + 0.75 * max(dot(N, V), 0.0));
            } else if (vK.x > 0.5 && vK.x < 1.5) {                                            // the molten body seen between the plates
              float n = fb(vL.xz * 1.4 + vec2(0.0, uTime * 0.3));
              col = lavaRamp(clamp(0.44 + 0.34 * n + 0.07 * sin(uTime * 2.1 + vL.z * 2.0), 0.0, 0.8)) * (0.45 + 0.55 * smoothstep(0.1, 1.2, vL.y));
            } else {
              float n = fb(vL.xz * 2.3 + vL.y * 1.7);
              vec2 pc = voro(vL.xz * 1.5 + vec2(vL.y * 0.9, 0.0));                              // the plates are crazed: a net of cracks that glows as it breathes
              float crack = smoothstep(0.1, 0.0, pc.y) * (step(vK.x, 0.5) + step(2.5, vK.x));
              vec3 alb = vec3(0.04, 0.034, 0.046) * (0.5 + 0.9 * n) * (0.72 + 0.56 * vn(vL.xz * 1.1 + vL.y * 0.7 + 3.0)) * (1.0 - 0.6 * crack);   // slag armour, modelled by orange up-light and a blue rim
              gMoonSpec = 0.8; gLava = mix(0.5, 0.34, step(1.5, vK.x));
              float rimW = 1.0 - max(dot(N, V), 0.0);
              col = forgeShade(P, N, V, alb, 0.45, 0.5 + 0.5 * smoothstep(0.2, 1.7, vL.y)) + uMoonCol * 0.34 * rimW * rimW * smoothstep(-0.1, 0.5, N.y);
              float heat = vK.w * (0.78 + 0.22 * sin(uTime * 1.7 + vL.z * 3.0)) * (0.7 + 0.5 * n);
              heat = max(heat, crack * (0.24 + 0.3 * vn(vL.xz * 0.8 + uTime * 0.25)) * smoothstep(1.9, 0.9, vL.y) * 1.8 * (1.0 - 0.45 * step(2.5, vK.x)));
              float seam = smoothstep(0.17, 0.03, abs(fract((vL.z + 3.3) / 1.1) - 0.5)) * step(vK.x, 0.5) * step(abs(vL.z), 3.7) * smoothstep(0.5, 1.2, vL.y);
              heat = max(heat, seam * (0.58 + 0.6 * fb(vL.xz * 1.3 + 7.0)) * (0.85 + 0.15 * sin(uTime * 2.3 + vL.z)));
              col += lavaRamp(clamp(heat * 1.02, 0.0, 0.86)) * smoothstep(0.08, 0.34, heat);
              col += lavaRamp(0.42) * smoothstep(-0.35, -1.2, vL.y) * step(1.5, vK.x) * 0.5;      // only the points of the feet glow, where they wade
            }
            gl_FragColor = vec4(col, 1.0);
            #include <fog_fragment>
          }`,
      });
      await ctx.yield();
      walkerMesh = new THREE.InstancedMesh(geo, mat, walkers.length); walkerMesh.name = 'slag-walkers'; walkerMesh.frustumCulled = false; scene.add(walkerMesh);
    }
    const wM = new THREE.Matrix4(), wQ = new THREE.Quaternion(), wP = new THREE.Vector3(), wS = new THREE.Vector3(), wE = new THREE.Euler();
    const walkerXZ = laneXZ;                                               // each walks its lane: a loop on the left bank (see laneXZ)
    const wP2 = new THREE.Vector3();
    const walkerPos = (w, t, out) => {
      const len = w.tab[64], s = (((w.s0 + t * 0.62 * w.size) % len) + len) % len; let k = 1; while (k < 64 && w.tab[k] < s) k++;
      const th = w.dir * (((k - 1 + (s - w.tab[k - 1]) / Math.max(1e-4, w.tab[k] - w.tab[k - 1])) / 64) * Math.PI * 2);
      walkerXZ(w, th + w.dir * 0.04, wP2); walkerXZ(w, th - w.dir * 0.04, out);
      const yaw = Math.atan2(wP2.x - out.x, wP2.z - out.z);
      walkerXZ(w, th, out); out.y = Math.max(w.y, groundAt(out.x, out.z) - 0.5) + 0.12 * Math.sin(t * 0.7 + w.s0);      // the whole loop lies on the bank: the body follows its ground
      return yaw;
    };
    const moveWalkers = (t) => {
      walkers.forEach((w, i) => { const yaw = walkerPos(w, t, wP); wQ.setFromEuler(wE.set(0.03 * Math.sin(t * 0.9 + i), yaw, 0.04 * Math.sin(t * 1.5 + i * 2))); walkerMesh.setMatrixAt(i, wM.compose(wP, wQ, wS.setScalar(w.size))); });
      walkerMesh.instanceMatrix.needsUpdate = true;
    };
    moveWalkers(0);
    // the gaze goes to the walker nearer the second fall while that one is still well upriver of the camera, and over to the one further up the river
    // over the last 40 m along the river before the camera is level with it. Both are taken where they stand at that moment,
    // and the aim is 10 m above the walker's back: a nod toward it that keeps the fountain and the fall in the gaze as well
    const herdV = new THREE.Vector3(), herdW = new THREE.Vector3(), herdC = new THREE.Vector3();
    const herdAt = (t, u) => {
      walkerPos(walkers[0], t, herdV); walkerPos(walkers[1], t, herdW); path.pointAt(u || 0, herdC);
      herdV.lerp(herdW, sst(0, 40, herdC.z - herdW.z));
      walkerPos(walkers[2], t, herdW); herdV.lerp(herdW, 1 - sst(4, 44, herdC.z - walkers[0].z0)); herdV.y += 6; return herdV;      // then on to the third, still ahead, which the low pass goes by
    };
    await ctx.yield();

    // ---------- ember-moths: glowing winged specks spiralling up the heat columns ----------
    const quad = () => { const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };
    const lavaCol = hero.uniforms.lavaCol, hotCol = hero.uniforms.hotCol;
    const mothU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time, uStir: { value: 0 }, uLavaCol: lavaCol, uHotCol: hotCol };
    const swarmSites = [
      V3(cx(522) - 7, LB, 522), V3(cx(Z2 + 78) - S.entrySide * 9, LC, Z2 + 78), V3(hl.rx(168) + 9, 0, 168),
      V3(cx(Z1 + 26) - 15, LB, Z1 + 26), V3(cx(430) + 13, LB, 430),
    ].slice(0, S.swarms);
    // two more columns right beside the route, each 13.5 m from it (measured to the route itself) on the side away from the walkers, who
    // keep the left bank (the side of lesser x). One stands 18 m above the second fall's brink: the fall's sheet begins 9 m above the
    // brink, where the melt speeds up to go over, and the column stands as far again above that, over the last slow melt, where the
    // heat still rises straight. The other stands over the melt beside the first walker's lane: abeam of its loop, at the place nearest
    // the loop's middle where such a column stands a metre or more inside the melt's edge (abeam of the middle itself if there is none)
    const routeX = (z0) => { let a = 0, b = 1; for (let i = 0; i < 22; i++) { const m = (a + b) / 2; if (path.pointAt(m).z > z0) a = m; else b = m; } return path.pointAt((a + b) / 2).x; };
    const beside = (z) => {
      let a = routeX(z), b = a + 60;                                         // from the route outward, away from the walkers' bank
      for (let i = 0; i < 20; i++) { const m = (a + b) / 2; if (path.nearestXZ(m, z).dist < 13.5) a = m; else b = m; }
      return (a + b) / 2;
    };
    let zLane = lanes[0].z0;
    search: for (let k = 0; k <= lanes[0].a; k += 2) for (const sg of [1, -1]) { const z = lanes[0].z0 + sg * k; if (Math.abs(beside(z) - cx(z)) < hwm(z) - 1) { zLane = z; break search; } }
    for (const z of [Z2 - 18, zLane]) swarmSites.push(V3(beside(z), riverY(z), z));
    {
      // 260 moths to a site, each dealt its four numbers from the moths' own generator
      const mr = ownRng('forge-moths'), per = Math.round(260 * DETAIL), nm = swarmSites.length * per, n = nm + swarmSites.length, aS = new Float32Array(n * 4), aB = new Float32Array(n * 4);
      swarmSites.forEach((q, i) => { const o = (nm + i) * 4; aS[o] = rng(); aB[o] = q.x; aB[o + 1] = q.y; aB[o + 2] = q.z; aB[o + 3] = 0; });   // a faint column of hot air under each swarm
      for (let i = 0; i < nm; i++) {
        const si = Math.floor(i / per), s = swarmSites[si];
        for (let k = 0; k < 4; k++) aS[i * 4 + k] = mr();
        aB[i * 4] = s.x; aB[i * 4 + 1] = s.y; aB[i * 4 + 2] = s.z; aB[i * 4 + 3] = si % 2 ? 1 : -1;
        if (i % per === per - 1) await ctx.yield();
      }
      const geo = quad();
      geo.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4)); geo.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4));
      geo.instanceCount = n;
      const mat = new THREE.ShaderMaterial({
        fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: mothU,
        vertexShader: /* glsl */`
          attribute vec4 aS; attribute vec4 aB; uniform float uTime, uStir; uniform vec3 uLavaCol, uHotCol; varying vec2 vQ; varying vec3 vC; varying float vF;
          #include <fog_pars_vertex>
          void main(){
            if (aB.w == 0.0) {                                    // the heat column
              vec4 mvPosition = modelViewMatrix * vec4(aB.xyz + vec3(0.0, 21.0 + position.y * 46.0, 0.0), 1.0);
              mvPosition.x += position.x * 17.0;
              vQ = position.xy * 2.0; vF = 1.0;
              vC = mix(uLavaCol, uHotCol, 0.2) * 0.3 * (1.0 - smoothstep(150.0, 320.0, -mvPosition.z)) * (0.85 + 0.15 * sin(uTime * 1.7 + aS.x * 40.0)) * smoothstep(20.0, 70.0, -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
              #include <fog_vertex>
              return;
            }
            float T = mix(16.0, 22.0, aS.x), k = fract(uTime / T + aS.y), H = 38.0;
            float arm = floor(aS.w * 3.0) / 3.0 * 6.2832, jit = fract(aS.w * 3.0) - 0.5;      // three arms: the swarm climbs as a triple helix
            float ang = arm + (k * 9.0 + uTime * 0.7) * aB.w + jit * 0.11;
            float rad = (2.5 + 5.0 * pow(k, 0.7)) * (1.0 + 0.05 * jit) * (1.0 + 0.6 * uStir);
            vec3 c = aB.xyz + vec3(cos(ang) * rad, 1.0 + k * H + sin(uTime * 1.3 + aS.y * 30.0) * 0.7, sin(ang) * rad);
            c.xz += vec2(sin(uTime * 2.3 + aS.z * 40.0), cos(uTime * 1.9 + aS.x * 40.0)) * 0.14;       // erratic, moth-like
            float flap = abs(sin(uTime * 13.0 + aS.y * 60.0)), s = mix(0.3, 0.62, aS.z);
            float beat = 0.6 + 0.4 * sin(uTime * 18.0 + aS.x * 40.0);                          // wing-beat glint
            vec4 mvPosition = modelViewMatrix * vec4(c, 1.0);
            float px = -mvPosition.z * 0.0023;
            float roll = (aS.x - 0.5) * 0.9 + 0.4 * sin(uTime * 1.1 + aS.x * 31.0), cr = cos(roll), sr = sin(roll);   // each one banks its own way
            vec2 wq = position.xy * vec2(max(s * (0.3 + 0.7 * flap) * 2.3, px * 1.5), max(s * 1.25, px * 1.1));
            mvPosition.xy += vec2(wq.x * cr - wq.y * sr, wq.x * sr + wq.y * cr);
            float bright = smoothstep(0.0, 0.06, k) * (1.0 - smoothstep(0.75, 1.0, k)) * (0.55 + 0.45 * flap) * smoothstep(2.5, 9.0, -mvPosition.z);
            vQ = position.xy * 2.0; vF = 0.0; vC = mix(mix(uLavaCol, uHotCol, 0.35 + 0.65 * aS.z), vec3(1.0, 0.85, 0.55), 0.1 + 0.3 * aS.x) * 2.5 * beat * bright * clamp(s / px, 0.4, 1.0) * (1.0 - smoothstep(90.0, 230.0, -mvPosition.z));
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          varying vec2 vQ; varying vec3 vC; varying float vF;
          #include <fog_pars_fragment>
          ${hero.glsl.fogFade}
          void main(){
            // two wing lobes swept back from a bright body: a small glowing V, not a dash
            float ax = abs(vQ.x), wy = vQ.y - 0.55 * ax + 0.12, lobe = (ax - 0.5) * (ax - 0.5) * 7.0 + wy * wy * 9.0;
            float wings = exp(-lobe) * smoothstep(0.04, 0.2, ax) * (1.0 - smoothstep(0.8, 1.0, ax)), body = exp(-(vQ.x * vQ.x * 60.0 + vQ.y * vQ.y * 9.0));
            float colm = exp(-vQ.x * vQ.x * 4.0) * smoothstep(1.0, -0.3, vQ.y) * smoothstep(-1.0, -0.75, vQ.y) * (1.0 - vQ.x * vQ.x);
            gl_FragColor = vec4(mix(vC * (wings * vec3(0.62, 0.5, 0.38) + body * 1.5), vC * colm, vF) * fogFade(), 1.0);
          }`,
      });
      const mesh = new THREE.Mesh(geo, mat); mesh.name = 'ember-moths'; mesh.frustumCulled = false; mesh.renderOrder = 4; scene.add(mesh);
    }
    await ctx.yield();

    // ---------- fumaroles: crystal growths burning with small blue gas flames, glass-hair grass around them ----------
    const set = fx.fxGroup(); scene.add(set.object);
    const wind = [hl.wind.x, hl.wind.y];
    const env = fx.makeEnv({ sunDir: moonDir, sunColor: mood.moon, sunIntensity: 1.2, sky: '#150b22', horizon: mood.horizon, ground: pal[4], ambient: 0.5 });
    const sites = [];
    const site = (x, z) => sites.push(V3(x, groundAt(x, z), z));
    site(cx(905) + S.entrySide * 58, 905); site(cx(Z2 - 58) + hwm(Z2 - 58) + 13, Z2 - 58); site(cx(470) + hwm(470) + 9, 470);
    site(cx(368) - hwm(368) - 15, 368); site(cx(815) - S.entrySide * (hwm(815) + 18), 815);
    sites.push(A.banks.right.clone(), A.banks.left.clone());
    site(cx(505) - hwm(505) - 38, 505);                                    // index 7: on the left bank of the middle terrace, 38 m back from the melt (clear of the walkers' legs)
    site(cx(868) + S.entrySide * 56, 868);                                 // index 8: on the bare side of the entry plain
    const xc = xr(61), BIG = (si) => (si === 2 ? 1.8 : si === 7 || si === 8 ? 1.5 : 1);
    const flames = [], tips = [];
    await ctx.yield();
    {
      const cg = fx.crystalGeometry({ rng: rng.fork('crystal'), count: 7, height: [1.4, 4.2], radius: [0.22, 0.6], spread: 0.9, colors: ['#ffffff', '#bfe9ff', '#8fb4ff'] });
      const perSite = 6, im = new THREE.InstancedMesh(cg, fx.crystalMaterial({ env, time, color: pal[6], glow: 1.5, pulse: 0.3, vertexColors: true }), sites.length * perSite);
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
      const apex = cg.userData.apex || [0, 3, 0];
      sites.forEach((s, si) => {
        const rng = si < 7 ? ctx.rng : xc, big = BIG(si);
        for (let k = 0; k < perSite; k++) {
          const a = rng.range(0, 6.28), r = k === 0 ? 0 : rng.range(2.5, 8) * (big > 1 ? 0.8 : 1), x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r, size = (k === 0 ? rng.range(1.5, 2.1) : rng.range(0.6, 1.4)) * big;
          p.set(x, groundAt(x, z) - 0.2, z); q.setFromEuler(e.set(rng.range(-0.15, 0.15), rng.range(0, 6.28), rng.range(-0.15, 0.15)));
          im.setMatrixAt(si * perSite + k, m.compose(p, q, sc.setScalar(size)));
          tips.push([p.x + apex[0] * size, p.y + apex[1] * size, p.z + apex[2] * size]);
        }
        for (let k = 0; k < 7; k++) { const a = rng.range(0, 6.28), r = rng.range(0.8, 7), x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r; flames.push([x, groundAt(x, z), z, rng.range(1.3, 3.0) * (big > 1 ? 1.65 : 1) * 1.35]); }
      });
      im.name = 'fumarole-crystals'; im.frustumCulled = false; scene.add(im);
      await ctx.yield();
      // blue gas flames: instanced upright billboards
      const geo = quad(), aF = new Float32Array(flames.length * 4), aR = new Float32Array(flames.length);
      flames.forEach((f, i) => { aF.set(f, i * 4); aR[i] = i < 49 ? rng() : xc(); });
      geo.setAttribute('aF', new THREE.InstancedBufferAttribute(aF, 4)); geo.setAttribute('aR', new THREE.InstancedBufferAttribute(aR, 1)); geo.instanceCount = flames.length;
      const mat = new THREE.ShaderMaterial({
        fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time, uCol: { value: new THREE.Color(pal[6]) }, uLavaCol: lavaCol, uHotCol: hotCol },
        vertexShader: /* glsl */`
          attribute vec4 aF; attribute float aR; uniform float uTime; varying vec3 vQ;
          #include <fog_pars_vertex>
          void main(){
            float h = aF.w * (1.0 + 0.28 * sin(uTime * 6.3 + aR * 40.0) + 0.14 * sin(uTime * 13.7 + aR * 90.0));
            vec4 mvPosition = modelViewMatrix * vec4(aF.xyz + vec3(0.0, (position.y + 0.5) * h, 0.0), 1.0);
            mvPosition.x += position.x * max(aF.w * 0.7, -mvPosition.z * 0.012);
            vQ = vec3(position.x * 2.0, position.y + 0.5, aR);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vQ; uniform float uTime; uniform vec3 uCol, uLavaCol, uHotCol;
          #include <fog_pars_fragment>
          ${hero.glsl.noise}
          ${hero.glsl.fogFade}
          void main(){
            float y = vQ.y, n = fb(vec2(vQ.x * 1.6 + vQ.z * 31.0, y * 2.4 - uTime * 2.6 + vQ.z * 17.0));
            float x = vQ.x + (n - 0.5) * 0.9 * y;
            float w = (0.2 + 0.8 * pow(1.0 - y, 0.75)) * (0.5 + 0.7 * n) * smoothstep(0.0, 0.08, y);
            float body = smoothstep(w, w * 0.25, abs(x)), core = smoothstep(w * 0.45, 0.0, abs(x)) * (1.0 - y);
            vec3 col = mix(vec3(0.25, 0.3, 1.0), uCol, smoothstep(0.75, 0.1, y)) * body * 2.4 + vec3(0.8, 1.0, 1.1) * core * 2.2;
            gl_FragColor = vec4(col * (1.0 - smoothstep(0.55, 1.0, y)) * fogFade(), 1.0);
          }`,
      });
      const fm = new THREE.Mesh(geo, mat); fm.name = 'gas-flames'; fm.frustumCulled = false; fm.renderOrder = 4; scene.add(fm);
      set.add(fx.makeGlows({ rng: rng.fork('blue'), positions: flames.map((f) => [f[0], f[1] + f[3] * 0.35, f[2]]).concat(tips.filter((t, i) => i % 6 === 0)), color: pal[6], size: 4.6, sizeJitter: 0.4, intensity: 0.5, core: 0.3, flicker: 0.55, time }));
    }
    await ctx.yield();
    // glass-fibre grass: pale volcanic hair that takes the blue moonlight, on the banks and round the fumaroles
    await ctx.yield();
    const grassWind = flora.makeWind({ direction: wind, strength: 1.35, speed: 1.2 });
    const grassMat = { ambient: 1, leafAmbient: 1, wrap: 0.3, backlight: 0.9, sheen: 1.6, detail: 0 };
    await flora.prepareLeafTexture(grassMat, ctx.yield, 5);                // the leaf atlas in short steps (it was one long step inside the grass)
    await ctx.yield();
    const grass = await flora.makeGrassAsync({
      rng: rng.fork('grass'), path, uRange: [0, 0.9], radius: 42, bias: 1.5, count: Math.round(34000 * DETAIL), heightAt: groundAt, heightStep: 3, wind: grassWind,
      density: (x, z) => {
        const d = Math.abs(x - cx(z)) - hwm(z);
        if (z <= Z1 + 9) return z > 150 && z < Z1 - 4 && d > 6 ? 0.75 : 0;
        if (d < 4 || chanD(x, z) < 3.5 || Math.abs(z - c2(x) - 3.5) < 6) return 0;
        let near = 0; for (const s of sites) near = Math.max(near, 1 - sst(5, 19, Math.hypot(s.x - x, s.z - z)));
        if (z > 826) near = Math.max(near, 0.85 * (1 - sst(15, 28, Math.abs(x - cx(z) - S.entrySide * lerp(16, 22, clamp((z - 838) / 62, 0, 1))))) * sst(826, 852, z));   // a field of it under the entry
        return clamp(0.75 * sst(0.2, 0.55, noise.n2(x * 0.03 + 40, z * 0.03)) + near * 1.2, 0, 1);       // dense tufts round the fumaroles, a few stray patches, bare crust between
      },
      root: '#56648a', tip: '#cfeaff', dry: '#eaf6ff', dryAmount: 0.4, tint: 0.16, glow: 0.6, height: [1.0, 2.3], width: [0.4, 0.8], flowers: 0, fade: [48, 78], chunks: 4,
      materialOptions: grassMat,
    }, ctx.yield, 5);
    scene.add(grass.object);
    await ctx.yield();

    // ---------- atmosphere: smoke lit from beneath, ash, embers, sparks at the falls, heat glow, plume lightning ----------
    const smokeAt = [V3(cx(700) - S.entrySide * 120, LC + 5, 700), V3(cx(430) + 105, LB + 5, 430), V3(cx(560) - 150, LB + 5, 560), V3(cx(860) + S.entrySide * 170, LC + 5, 860)].slice(0, S.smoke);
    for (const s of smokeAt) {
      set.add(fx.makeSmokeColumn({ rng: rng.fork('smoke'), time, position: [s.x, s.y + 0.5, s.z], height: rng.range(80, 130), radius: [2.5, rng.range(13, 19)], size: [7, 26], count: 70,
        color: '#2c1c22', colorTop: '#3f2a30', shadowColor: '#0d0709', ambient: '#150a0c', hot: new THREE.Color(pal[4]).multiplyScalar(0.6), hotFalloff: 7.5, opacity: 0.55, rate: 0.05,
        wind: [wind[0] * 1.5, 0, wind[1] * 1.5], bend: 0.5, rim: 0.6, scatter: 0.3, sunDir: moonDir, sunColor: moonCol.clone().multiplyScalar(0.6) }));
      await ctx.yield();
    }
    set.add(fx.makeParticles({ rng: rng.fork('embers'), preset: 'embers', time, count: Math.round(800 * DETAIL), box: [70, 34, 70], size: [0.05, 0.13], intensity: 2.6 }));
    await ctx.yield();
    set.add(fx.makeParticles({ rng: rng.fork('ash'), preset: 'ash', time, count: Math.round(1500 * S.ashfall * DETAIL), box: [50, 32, 50], colors: ['#4a3a40', '#2a2026', '#6a4a44'],
      velocity: [wind[0] * 1.6, -0.7, wind[1] * 1.6], lightDir: moonDir }));
    await ctx.yield();
    for (const f of falls) set.add(fx.makeParticles({ rng: rng.fork('sparks'), preset: 'sparks', time, follow: false, count: Math.round(640 * DETAIL), center: [f.x, f.top - f.drop + 6, f.z + 9], box: [f.hw * 2, 14, 14], size: [0.07, 0.2], intensity: 3 }));
    {
      const hz = [], sz = [];
      for (let z = Z1 + 40; z < 1010; z += 84) { hz.push([cx(z), riverY(z) + 3, z]); sz.push(1); }
      for (const f of falls) { hz.push([f.x, f.top - f.drop * 0.5, f.z + 6]); sz.push(1.25); }
      for (const c of chans) { const zm = (c.z0 + c.z1) / 2; hz.push([chanX(c, zm), base(chanX(c, zm), zm) + 2, zm]); sz.push(0.6); }
      set.add(fx.makeGlows({ rng: xr(91), positions: falls.flatMap((f) => [[f.x, f.top - f.drop * 0.45, f.z + 7], [f.x, f.top - f.drop + 1.5, f.z + 9]]), sizes: [1, 0.95],
        color: pal[4], size: 62, intensity: 0.26, core: 0, halo: 1, flicker: 0.22, near: [0.5, 1.5], minAngle: 0, time, renderOrder: 2 }));
      set.add(fx.makeGlows({ rng: rng.fork('heat'), positions: hz, sizes: sz, color: pal[4], size: 84, intensity: 0.09, core: 0, halo: 1, flicker: 0.12, near: [0.5, 1.5], minAngle: 0, time, renderOrder: 2 }));
    }
    await ctx.yield();
    const plume = A.plumeBase, drift = A.plumeDrift;
    const boltAt = V3(plume.x + drift.x * 150, plume.y + 235, plume.z + drift.z * 150);
    const bolt = set.add(fx.makeLightning({ rng: rng.fork('bolt'), from: [0, 140, 0], to: [drift.x * 150, -120, drift.z * 150], position: [boltAt.x, boltAt.y, boltAt.z],
      area: 130, interval: S.stormEvery, color: '#c6a8ff', width: 2.2, intensity: 6, glow: 0.1, jaggedness: 0.45, fogAmount: 0.2, light: false, branches: 8 }));
    // (the strikes keep the kit's own schedule: one in every S.stormEvery seconds of the world clock, at a seeded moment within it)
    // the plume lights up from inside with every strike (eased: a quick rise, a slow violet afterglow)
    const flashCol = new THREE.Color('#9a78ff'), flashC = new THREE.Color();
    const plumeFlash = set.add(fx.makeGlows({ rng: rng.fork('flash'), positions: [[boltAt.x, boltAt.y + 10, boltAt.z], [boltAt.x + drift.x * 80, boltAt.y + 60, boltAt.z + drift.z * 80]], sizes: [1, 1.3],
      color: '#000000', size: 330, intensity: 1, core: 0, halo: 1, flicker: 0, near: [0.1, 0.4], minAngle: 0, fogAmount: 0.2, time, renderOrder: 2 }));
    let flashV = 0;
    await ctx.yield();
    const ridges = makeHorizonRidges({ rng: rng.fork('ridges'), layers: 3, radius: [2300, 3600], height: [110, 380], base: -40, jagged: 0.32, coverage: 0.8,
      colorNear: '#0a0509', fog: scene.fog, sunDir: moonDir, sunColor: mood.moon, sunIntensity: 0.1, rim: 0.2 });
    scene.add(ridges.object);
    await ctx.yield();
    // heat shimmer: wavering wisps of hot air standing over the river, thickest in the gorge and at the falls
    {
      const hs = xr(51), aF = [];
      const wisp = (x, y, z, w, h) => aF.push(x, y, z, w, h * 0.36, hs(), 0, 0);      // 7-12 m: they lick over the melt, they do not wall the river in
      for (let z = Z2 + 26; z < Z2 + 200; z += 17) wisp(cx(z) + hs.range(-9, 9), LC, z, hs.range(20, 30), hs.range(22, 34));
      for (let z = Z1 + 30; z < Z2 - 10; z += 31) wisp(cx(z) + hs.range(-10, 10), LB, z, hs.range(22, 32), hs.range(20, 30));
      // the series up the top terrace ends 64 m short of the first fall's lip: standing in a row along the river there, their glows added up to a pale band over the brink
      for (let z = 40; z < Z1 - 64; z += 36) wisp(hl.rx(z) + hs.range(-7, 7), 0, z, hs.range(18, 26), hs.range(18, 26));
      for (const f of falls) { wisp(f.x - f.hw * 0.4, f.top - f.drop, f.z + 9, 26, 30); wisp(f.x + f.hw * 0.4, f.top - f.drop, f.z + 11, 26, 30); }
      const geo = quad(), ib = new THREE.InstancedInterleavedBuffer(new Float32Array(aF), 8);
      geo.setAttribute('aF', new THREE.InterleavedBufferAttribute(ib, 4, 0)); geo.setAttribute('aG', new THREE.InterleavedBufferAttribute(ib, 4, 4)); geo.instanceCount = aF.length / 8;
      const mat = new THREE.ShaderMaterial({
        fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time, uLavaCol: lavaCol, uHotCol: hotCol },
        vertexShader: /* glsl */`
          attribute vec4 aF; attribute vec4 aG; varying vec3 vQ; varying float vA;
          #include <fog_pars_vertex>
          void main(){
            vec4 mvPosition = modelViewMatrix * vec4(aF.xyz + vec3(0.0, (position.y + 0.5) * aG.x, 0.0), 1.0);
            mvPosition.x += position.x * aF.w;
            vQ = vec3(position.x * 2.0, position.y + 0.5, aG.y); vA = smoothstep(7.0, 26.0, -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vQ; varying float vA; uniform float uTime; uniform vec3 uLavaCol, uHotCol;
          #include <fog_pars_fragment>
          ${hero.glsl.noise}
          ${hero.glsl.fogFade}
          void main(){
            float x = vQ.x, y = vQ.y, r = vQ.z * 37.0;
            float wob = sin(y * 11.0 - uTime * 2.6 + r + 4.0 * vn(vec2(x * 2.0 + r, y * 2.5 - uTime * 0.6)));
            float n = fb(vec2(x * 3.4 + wob * 0.3 + r, y * 1.1 - uTime * 0.85));
            n *= 0.5 + 1.0 * vn(vec2(x * 9.0 + r * 3.0 + wob * 0.4, y * 2.4 - uTime * 1.6));                 // a second, faster octave breaks the sheet into tongues
            float yc = clamp(y, 0.0, 1.0);
            float a = smoothstep(0.36 + 0.3 * yc, 0.7 + 0.25 * yc, n) * pow(max(1.0 - x * x, 0.0), 2.0) * smoothstep(0.0, 0.1, y) * pow(1.0 - yc, 2.0);
            gl_FragColor = vec4(mix(uLavaCol, uHotCol, 0.3) * 0.44 * a * vA * fogFade(), 1.0);
          }`,
      });
      const mesh = new THREE.Mesh(geo, mat); mesh.name = 'heat-shimmer'; mesh.frustumCulled = false; mesh.renderOrder = 3; scene.add(mesh);
    }
    // ---------- lava bombs: thrown from the vent on long ballistic arcs, they come down in the river and on its banks ----------
    // On the world clock, all through the visit: six throwers, each with a seeded run of throws of its own (pause, height, size, landing spot)
    // that comes round again after about two minutes. Every landing spot is drawn along the open reach of the river between the bridge gorge
    // and the second fall, in the melt or 7-13 m up a bank. One instanced additive draw call
    const bombU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time, uLavaCol: lavaCol, uHotCol: hotCol };
    const bombs = [], SPLASH = 2;                                            // SPLASH: seconds the ring and the spatter last after an impact
    let bombB = null, bombT = null;
    {
      // every throw has a generator of its own (the seed, its thrower's number, its own number): its height, size, spark seed and pause
      // are drawn first, then its landing candidates one after another, each with all four of its numbers before any test. So a place
      // that is refused (by the route, a walker, a fumarole) moves no other throw
      const NB = 6, NTHROW = 5;
      const spot = (br) => {
        let x = 0, y = 0, z = 0;
        for (let tries = 0; tries < 80; tries++) {
          z = br.range(110, Z2 - 32);                                        // from the end of the bridge gorge's walls down to the second fall's lip
          const sd = br.sign(), onBank = br.chance(1 / 3), q = br(), r = onBank ? hwm(z) + 7 + 6 * q : q * (hwm(z) - 4);      // 7 to 13 m up a bank, or in the melt 4 m inside it
          x = cx(z) + sd * r; y = onBank ? groundAt(x, z) + 0.4 : riverY(z) + 0.25;
          if (Math.abs(z - Z1) < 30) continue;                                                           // not on the first fall's lip or in its plunge
          if (path.distanceTo(x, y, z) < (onBank ? 20 : 15.5)) continue;                                 // never in the flight corridor
          if (walkers.some((w) => Math.abs(z - w.z0) < w.a + 12 && x < cx(z) - hwm(z) + 14)) continue;   // nor on a walker's loop
          if (sites.some((q) => Math.hypot(q.x - x, q.z - z) < 14)) continue;                            // nor on a fumarole
          break;
        }
        return [x, y, z];
      };
      for (let i = 0; i < NB; i++) {
        const throws = []; let t0 = 0;
        for (let j = 0; j < NTHROW; j++) {
          const br = ownRng('forge-bomb:' + i + ':' + j);
          const H = br.range(240, 330), size = br.range(0.75, 1.15), seed = br(), pause = br.range(0.6, 9), fly = 14.4 * Math.sqrt(H / 300);      // H: how high the arc goes;  fly: seconds in the air
          const [x, y, z] = spot(br);
          throws.push({ x, y, z, H, size, seed, t0, fly });
          t0 += fly + SPLASH + pause;                                                                    // then a pause before this thrower's next one
        }
        bombs.push({ throws, cycle: t0, phase: ownRng('forge-bomber:' + i)() * t0, cur: -1, glow: -1 });  // phase: where in its run the visit finds it
      }
      const NT = 22, NS = 30, pos = [], kind = [], idx = [];
      for (let j = 0; j <= NT; j++) { pos.push(j / NT, -1, 0, j / NT, 1, 0); kind.push(0, 0); if (j > 0) { const a = (j - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
      const quadAt = (k, c) => { const o = pos.length / 3; pos.push(-1, -1, c, 1, -1, c, 1, 1, c, -1, 1, c); kind.push(k, k, k, k); idx.push(o, o + 1, o + 2, o, o + 2, o + 3); };
      quadAt(2, 0); for (let j = 0; j < NS; j++) quadAt(3, (j + 0.5) / NS); quadAt(1, 0);
      const geo = new THREE.InstancedBufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1)); geo.setIndex(idx);
      const aA = new Float32Array(NB * 3);
      for (let i = 0; i < NB; i++) aA.set([A.vent.x, A.vent.y + 8, A.vent.z], i * 3);
      // aB: where the throw in hand comes down + its height;  aT: its flight 0..1, its splash 0..1, seed, size (both written from the clock in update)
      bombB = new THREE.InstancedBufferAttribute(new Float32Array(NB * 4), 4); bombT = new THREE.InstancedBufferAttribute(new Float32Array(NB * 4).fill(-1), 4);
      bombB.setUsage(THREE.DynamicDrawUsage); bombT.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 3)); geo.setAttribute('aB', bombB); geo.setAttribute('aT', bombT);
      geo.instanceCount = NB;
      const mat = new THREE.ShaderMaterial({
        fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: bombU,
        vertexShader: /* glsl */`
          attribute float aKind; attribute vec3 aA; attribute vec4 aB; attribute vec4 aT;
          uniform float uTime; uniform vec3 uLavaCol, uHotCol; varying vec3 vQ; varying vec3 vC; varying float vKind;
          #include <fog_pars_vertex>
          vec3 arc(float k){ vec3 p = mix(aA, aB.xyz, k); p.y += aB.w * 4.0 * k * (1.0 - k); return p; }
          float hh(float n){ return fract(sin(n * 91.7 + aT.z * 37.3) * 43758.5453); }
          void main(){
            float k = aT.x, e = aT.y;                                                          // k: 0 thrown .. 1 down;  e: 0..1 after the impact (two seconds)
            float fly = step(0.0, k) * step(k, 1.0), hit = step(0.0, e) * step(e, 1.0), a = 0.0, ec = clamp(e, 0.0, 1.0);
            vec3 col = uHotCol * 3.4; vec4 mvPosition = vec4(0.0, 0.0, -1.0, 1.0);
            vKind = aKind; vQ = position;
            if (aKind < 0.5) {                                                                 // the trail: a ribbon laid back along the arc
              // A tail of fire behind its bomb, not a ruled line across the sky: half a second of the flight long (about 40 m at the
              // speed it comes down with), its light falling off with the cube of the way back along it, and gone a tenth of a second
              // after the bomb is down (it was a second long, fell off with the square and stood over the impact a third of a second)
              float kk = max(min(k, 1.0) - position.x * 0.035 * (1.0 - smoothstep(0.0, 0.05, ec)), 0.0);
              mvPosition = modelViewMatrix * vec4(arc(kk), 1.0);
              vQ.z = 1.0 - clamp(length(mvPosition.xyz) / 90.0, 0.0, 1.0);                     // how near the eye this part of the trail is: 0 from 90 m on .. 1 at the eye (see the fragment shader)
              vec4 m2 = modelViewMatrix * vec4(arc(kk + 0.004), 1.0);
              vec2 dd = m2.xy / max(-m2.z, 0.1) - mvPosition.xy / max(-mvPosition.z, 0.1);
              float dl = length(dd); vec2 nn = dl > 1e-6 ? vec2(-dd.y, dd.x) / dl : vec2(1.0, 0.0);
              mvPosition.xy += nn * position.y * max(aT.w * 0.55 * (1.0 - 0.8 * position.x), -mvPosition.z * 0.0026);
              a = step(0.0, k) * (1.0 - smoothstep(0.0, 0.06, max(e, 0.0))) * smoothstep(0.0, 0.03, k);
              col = mix(uHotCol * 3.2, mix(uLavaCol * 1.6, vec3(0.5, 0.03, 0.0), smoothstep(0.3, 1.0, position.x)), smoothstep(0.0, 0.4, position.x));
            } else if (aKind < 1.5) {                                                          // the bomb: a white-hot clot in its own glow
              mvPosition = modelViewMatrix * vec4(arc(clamp(k, 0.0, 1.0)), 1.0);
              mvPosition.xy += position.xy * max(aT.w * 4.2, -mvPosition.z * 0.008);
              a = fly * smoothstep(0.0, 0.03, k) * (0.85 + 0.15 * sin(uTime * 23.0 + aT.z * 60.0));
              col = mix(uHotCol, vec3(1.0, 0.92, 0.7), 0.4) * 4.2;
            } else if (aKind < 2.5) {                                                          // the splash: a ring of melt running out from the impact
              float R = 3.0 + 27.0 * (1.0 - (1.0 - ec) * (1.0 - ec));
              mvPosition = modelViewMatrix * vec4(aB.xyz + vec3(position.x * R, 0.35, position.y * R), 1.0);
              a = hit * pow(1.0 - ec, 1.4); col = mix(uHotCol * 3.2, uLavaCol * 2.0, ec);
            } else {                                                                           // spatter thrown up by it
              float h1 = hh(position.z * 7.0 + 1.0), h2 = hh(position.z * 13.0 + 5.0), h3 = hh(position.z * 29.0 + 9.0), ts = ec * 2.0, ang = h1 * 6.2832;
              vec3 c = aB.xyz + vec3(cos(ang) * (5.0 + 13.0 * h2) * ts, max((14.0 + 20.0 * h3) * ts - 9.0 * ts * ts, 0.0), sin(ang) * (5.0 + 13.0 * h2) * ts);
              mvPosition = modelViewMatrix * vec4(c, 1.0);
              mvPosition.xy += position.xy * max((0.16 + 0.26 * h1) * (1.0 - 0.5 * ec), -mvPosition.z * 0.0017);
              a = hit * (1.0 - ec) * (1.0 - ec); col = mix(uHotCol * 4.5, uLavaCol * 3.0, ec * 0.8 + 0.2 * h2);
            }
            vC = col * a;
            gl_Position = a > 0.001 ? projectionMatrix * mvPosition : vec4(2.0, 2.0, 2.0, 1.0);
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vQ; varying vec3 vC; varying float vKind;
          #include <fog_pars_fragment>
          ${hero.glsl.fogFade}
          void main(){
            float m, r2 = dot(vQ.xy, vQ.xy), r = sqrt(r2);
            if (vKind < 0.5) { float f = clamp(1.0 - vQ.x, 0.0, 1.0); m = clamp(1.0 - vQ.y * vQ.y, 0.0, 1.0) * f * f * f; }
            else if (vKind < 1.5) m = (exp(-r2 * 26.0) * 2.6 + exp(-r2 * 4.5) * 0.4) * (1.0 - smoothstep(0.75, 1.0, r));
            else if (vKind < 2.5) { float bd = (r - 0.8) / 0.085; m = (exp(-bd * bd) * (0.6 + 0.4 * sin(vQ.x * 13.0) * sin(vQ.y * 11.0)) + 0.22 * clamp(1.0 - r / 0.8, 0.0, 1.0)) * (1.0 - smoothstep(0.92, 1.0, r)); }
            else m = exp(-r2 * 6.0) * (1.0 - smoothstep(0.7, 1.0, r));
            // A trail seen from near is no slab of light. Within 90 m of the eye its light is drawn in toward its middle line, the more the
            // nearer: a core whose share of the trail's width is the eye's distance over 90 m, as bright down its middle as the trail ever
            // is and cooling to orange at its edges, in a faint red sheath (6 hundredths of the light) that keeps the trail's whole width.
            // From 90 m on nothing is changed (vQ.z, from the vertex shader: 0 there, 1 at the eye)
            vec3 hue = vec3(1.0);
            if (vKind < 0.5) {
              float n = clamp(vQ.z, 0.0, 0.95), f = clamp(1.0 - vQ.x, 0.0, 1.0), c = clamp(1.0 - vQ.y * vQ.y, 0.0, 1.0);
              float yc = clamp(vQ.y, -1.0, 1.0) / (1.0 - n), cc = clamp(1.0 - yc * yc, 0.0, 1.0);
              m = (cc + 0.06 * (c - cc)) * f * f * f; hue = mix(hue, vec3(1.0, 0.3 + 0.7 * cc, cc * cc), n);
            }
            gl_FragColor = vec4(vC * hue * m * fogFade(), 1.0);
          }`,
      });
      const mesh = new THREE.Mesh(geo, mat); mesh.name = 'lava-bombs'; mesh.frustumCulled = false; mesh.renderOrder = 5; scene.add(mesh);
    }
    const bombGlow = set.add(fx.makeGlows({ rng: xr(78), positions: bombs.map((b) => [b.throws[0].x, b.throws[0].y + 2.5, b.throws[0].z]), color: '#000000', size: 46, intensity: 1, core: 0, halo: 1, flicker: 0.2,
      near: [0.3, 1.2], minAngle: 0, time, renderOrder: 2 }));
    const bombC = new THREE.Color(), bombHot = new THREE.Color(pal[4]).lerp(new THREE.Color(pal[5]), 0.45);
    await ctx.yield();
    if (hero.uniforms.shield) hero.uniforms.shield.value.set(SH.x, SH.z, 1, xr(71)() * 6.28);
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    const fountain = V3(A.vent.x, A.vent.y + 110, A.vent.z), exitGaze = A.lookAt.clone(), camP = V3(0, 0, 0);
    // where along the flight a place of the world is passed: the route runs up the river, z falling all the way, so a place is named by its z
    const uAtZ = (z0) => { let a = 0, b = 1; for (let i = 0; i < 22; i++) { const m = (a + b) / 2; if (path.pointAt(m, camP).z > z0) a = m; else b = m; } return (a + b) / 2; };
    let uWas = -1;   // the place at the last update (-1: none yet): tells a first call or a jump of place from the flight (see update)
    return {
      scene, path, duration: 48,
      camera: { fov: 62, near: 0.4, far: 6000, lookAhead: 26, sway: 0.8, bank: 1.1 },
      pois: [
        { at: fountain, from: 0.0, to: 0.2, weight: 0.55 },
        // the walkers. From the route's lowest knot in the gorge below the second fall (z = Z2 + 92): there the climb to their terrace begins,
        // and the eye goes ahead of it to the place over the brink where the second walker stands. To where the third and last walker's
        // loop centre is abeam: after that all three are behind
        { at: herdAt, from: uAtZ(Z2 + 92), to: uAtZ(lanes[2].z0), weight: 0.6 },
        // the forge (upper fall and fountain). From where the first walker's loop centre is abeam: the largest walker has been passed and the eye
        // starts back to the forge while the route swings across the river and up the right bank. To the knot at z = 250, the first of the hero's
        // own line up the river: from there the route itself heads for the upper fall and nothing has to hold the eye on it
        { at: exitGaze, from: uAtZ(lanes[0].z0), to: uAtZ(250), weight: 0.58 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#8fe6ff', glow: 1.1, revealDistance: 320 },
      post: { exposure: 0.95, bloom: { strength: 0.38, radius: 0.7, threshold: 1.0 },
        grade: { saturation: 1.0, contrast: 1.06, tint: mood.tint, shadowTint: mood.shadow, vignette: 0.36, grain: 0.03, aberration: 0.016 } },
      update(dt, t, camera, u) {
        time.value = t;
        hero.setProgress(u); hero.update(dt, t, camera);
        sky.update(dt, t, camera); set.update(dt, t, camera); grass.update(dt, t, camera); ridges.update(dt, t, camera);
        moveWalkers(t);
        // lava bombs: the clock says which throw each thrower has in hand and how far along it is; every landing throws a pulse of light over the river
        for (let i = 0; i < bombs.length; i++) {
          const s = bombs[i], tt = (((t + s.phase) % s.cycle) + s.cycle) % s.cycle;
          let j = s.throws.length - 1; while (j > 0 && s.throws[j].t0 > tt) j--;
          const b = s.throws[j], k = (tt - b.t0) / b.fly, e = (tt - b.t0 - b.fly) / SPLASH;
          if (s.cur !== j) { s.cur = j; bombB.setXYZW(i, b.x, b.y, b.z, b.H); bombB.needsUpdate = true; bombGlow.setPosition(i, b.x, b.y + 2.5, b.z); }
          bombT.setXYZW(i, k, e, b.seed, b.size);
          const g = e >= 0 ? (e < 1 ? 1.5 * Math.exp(-e * 3.2) * (1 - e) : 0) : 0.3 * sst(0.9, 1, k);
          if (g !== s.glow) { s.glow = g; bombGlow.setColor(i, bombC.copy(bombHot).multiplyScalar(g)); }
        }
        bombT.needsUpdate = true;
        // lightning lights the plume from inside: 0.1 s rise, slow decay
        // (the afterglow here and the moths' stir below are eased by the clock step alone: at a step of 0, a pause or a still drawn twice, neither
        // moves. On the first call, and when the place jumps further than a flight goes in one step (a still, a place posed afresh; a hurried
        // flight at the fastest Pace makes 0.013 of the route in its longest step), both are put at their targets: the afterglow at the lightning's own level just then)
        const jump = Math.abs(u - uWas) > 0.04; uWas = u;
        const fdt = Math.min(0.1, dt), ft = bolt.flash || 0;
        if (jump) flashV = ft;
        else if (dt > 0) flashV += (ft > flashV ? (ft - flashV) * Math.min(1, fdt / 0.1) : -flashV * Math.min(1, fdt / 0.9));
        // between strikes the ash cloud keeps a faint violet glow of its own, so it never goes flat
        flashC.copy(flashCol).multiplyScalar(0.55 * flashV + 0.06 + 0.02 * Math.sin(t * 0.6)); plumeFlash.setColor(0, flashC); plumeFlash.setColor(1, flashC);
        // the moths scatter as the camera sweeps past their heat column
        camP.setFromMatrixPosition(camera.matrixWorld);
        let stir = 0; for (const s of swarmSites) { const d = Math.hypot(camP.x - s.x, camP.z - s.z); stir = Math.max(stir, 1 - sst(18, 60, d)); }
        const stirT = stir * (u > 0 ? 1 : 0);
        if (jump) mothU.uStir.value = stirT;
        else if (dt > 0) mothU.uStir.value += (stirT - mothU.uStir.value) * Math.min(1, dt * 1.2);
      },
      dispose() { sky.dispose(); hero.dispose(); },
    };
  },
};
