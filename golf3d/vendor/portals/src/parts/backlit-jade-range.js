// THE LIT WALL: hero set piece of "backlit-jade-range" (The Jade Range).
//
// Three kilometres of mountain carved from one boulder of nephrite with the sun BEHIND it. The top 900 m is a
// fluted fin 10 to 150 m thick, so the light comes through the stone: webs between the flute ribs and the
// cornices glow white-celadon, flanks apple green, buttresses black-green. A white-hot bloom shows where the
// hidden sun stands behind the fin, cirrus shadows slide along the wall, spindrift plumes stream off the crest.
//
// LOCAL SPACE  origin = centre of the wall's foot at cloud-sea level, +Y up, the wall runs along X.
//   +Z = FRONT = the shaded west face the flight sees (the basin, the cloud sea and the col lie on +Z).
//   -Z = east: the sun is behind the wall there.   -X = north (the flight's heading), +X = south.
//   Size: 3,300 m long (x -1650..1650), crest 1,900 to 2,500 m (north horn = 2,500 m near x -1150), foot about
//   700 m deep. The mesh runs down to y = -160 so a cloud sea or terrain anywhere up to y ~ 150 hides its hem.
//   radius 1500 (viewer hint), height 2500.
//
// OPTS
//   palette   7 hex strings, brief order: [white-celadon, apple, deep green, black-green, cloud, rind, accent]
//             The absorption of the stone is derived from palette[1] (its colour through 120 m of rock).
//   hour      'day' (default, sun 24 deg up, white) | 'sunrise' / 'golden' / 'dawn' (6 deg, honey light through
//             the top of the fin only) | 'night' (full moon behind the wall, cold white-blue jade)
//   weather   'clear' (default) | 'gale' (plumes twice as long and denser)
//   season    'spring' (default) | 'autumn' (October: pass mirror too; fresh-snow-pale sky fill on the stone)
//   mirror    true flips the piece along X (horn in the south) for the southbound variation
//   sunAzimuth  degrees the sun stands toward +X of straight behind (default 0); sunElevation overrides the hour
//   maxHaze   the hero never accepts a FogExp2 denser than this (default 0.00006), so it keeps its contrast at
//             3.4 km whatever the scene fog is; scene fog colour and Fog (linear) are used as they are
//   cloudApron  false removes the hero's own patch of cloud sea (y about 60, 5 km across): PASS FALSE when the
//             world lays its own cloud sea, or the two will fight
//   plumes    false removes the spindrift;  skein false removes the far skein (eleven geese in a ragged V)
//
// PROGRESS   hero.setProgress(u) with the flight's u (0..1): the sun climbs 2 degrees, the baked rock thickness
//   lerps with it and the bright zone creeps down the fin. Nothing else is keyed. Ambient motion (cirrus bands,
//   plumes, far skein, glints) runs on the time passed to update(dt, time, camera).
//
// ANCHORS (all local)
//   sunDir, sunDirEnd     unit vectors TOWARD the sun at u = 0 and u = 1: light the rest of the world with these
//   hornTop               tip of the north horn;  summits: every named top, highest first
//   crest                 25 points along the crest line, south to north (for plume or bird placement)
//   sunBloom              the point low in the fin where the sun's bloom shows from viewpoints.reveal
//   viewpoints.reveal     { position, lookAt }  THE image: whole wall, 3.4 km from the centre
//   viewpoints.col        { position, lookAt }  the col, 2.3 km from the horn, horn towering on the right
//   flyThrough            ordered points for the camera's line from the reveal to the col (heading -X, the wall
//                         on the right, never nearer than 2 km to the rock)
//   portalSeat            { position, facing } where the 14 m exit portal (the arch on the col) should sit;
//                         facing points back along the path (+X-ish), the sun is 90 deg to its side
//   plumeRoots            where the big spindrift plumes leave the crest;  wind: unit vector they stream along
//   skeinLine             { from, to, s } the far skein's line of flight in front of the wall (from and to are live
//                         uniforms; s.value >= 0 puts the lead that many metres along the line instead of the clock;
//                         spread.value is the least spacing between birds, minPx.value the least wingspan in pixels:
//                         the birds are drawn larger than life at a distance and the V opens with them, so it reads as
//                         a ragged V of beating wings, one arm long and one short, never as a dotted line)
// LIFT  hero.setLift(k) 0..1: the whole wall reads thinner and brighter (white-celadon), for the first sight of it as
//   one horn above a notch. Eased by the world over u; a uniform only.
//
// COST  about 95k triangles in 4 draw calls (wall front 72k + back 12.8k in one mesh, plumes, skein, cloud apron 7.5k),
//   no lights, no textures, build about 250 ms (three yields).
// LIGHTING  self-lit by its own transmission shader from anchors.sunDir; scene lights are ignored. It expects a
//   teal zenith and a pale horizon behind it, haze about 0.00005, and bloom threshold near 0.9: only cornices,
//   flute webs and the sun's bloom exceed 1. Style: carved nephrite (see STYLE at the jade shader).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#EEF5E4', '#8FCB86', '#3F8F5A', '#0B2318', '#D9DCCB', '#A4522A', '#C8372C'];
const LEN = 3300, Y0 = -160, NX = 360, NV = 100, BX = 160, BV = 40;
const GP = 1.5; // rows crowd toward the crest: y = Y0 + (H - Y0) * (1 - (1 - v)^GP)

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('lit-wall') : ctx.rng;
  const noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const hour = opts.hour || 'day';
  const night = hour === 'night', low = hour === 'sunrise' || hour === 'golden' || hour === 'dawn';
  const gale = opts.weather === 'gale';
  const mirror = opts.mirror ? -1 : 1;

  // ---------------------------------------------------------------- per-seed character of the range
  const ox = rng.range(-500, 500), oz = rng.range(-500, 500);
  const hornX = -1150 + rng.range(-90, 90);
  const summitDefs = [
    { x: hornX, h: rng.range(820, 920), w: rng.range(250, 310), p: 1.1 },                  // the north horn
    { x: rng.range(-80, 320), h: rng.range(480, 620), w: rng.range(320, 430), p: 1.4 },    // central top
    { x: rng.range(820, 1080), h: rng.range(330, 470), w: rng.range(250, 340), p: 1.3 },   // south top
    { x: rng.range(-620, -380), h: rng.range(160, 300), w: rng.range(120, 180), p: 1.2 },   // shoulder of the horn
    { x: rng.range(430, 640), h: rng.range(120, 260), w: rng.range(100, 160), p: 1.2 },
  ];
  const bowK = rng.range(0.00008, 0.00014), sway = rng.range(60, 130);
  const fluteP = rng.range(52, 66), fluteP2 = fluteP * rng.range(0.38, 0.46);
  // buttresses: sharp spurs standing out of the foot, also dividing the fin into facets
  const butF = [], butB = [];
  for (let x = -1500 + rng.range(0, 150); x < 1500; x += rng.range(300, 520)) butF.push({ x, w: rng.range(90, 230), s: rng.range(0.35, 1.2), top: rng.range(900, 1750), lean: rng.range(-0.12, 0.12) });
  for (let x = -1400 + rng.range(0, 200); x < 1500; x += rng.range(380, 620)) butB.push({ x, w: rng.range(140, 220), s: rng.range(0.5, 1.0), top: rng.range(1100, 1700), lean: rng.range(-0.08, 0.08) });
  const spur = (list, x, y) => { let m = 0; for (const b of list) { const t = 1 - Math.abs(x - b.x - b.lean * (b.top - y)) / (b.w * (0.55 + 0.45 * smoothstep(b.top, 0, y))); if (t > 0) m = Math.max(m, b.s * t * t * (3 - 2 * t) * Math.pow(smoothstep(b.top, -150, y), 1.2)); } return m; };

  const endW = (x) => smoothstep(1650, 1130, Math.abs(x));
  const zc = (x) => bowK * x * x + sway * 1.7 * noise.n2(x / 950 + ox, 7.7) + 38 * noise.n2(x / 310 + oz, 2.2) - 60;
  const crestRaw = (x) => {
    let h = 1620 + 90 * noise.n2(x / 760 + ox, 1.3);
    for (const s of summitDefs) h += s.h * Math.exp(-1.7 * Math.pow(Math.abs(x - s.x) / s.w, s.p));
    h += 110 * noise.ridged2(x / 170 + ox, 4.1, 3) - 50 + 12 * noise.n2(x / 23 + ox, 9.2);
    return h;
  };
  let hMax = 0; for (let i = 0; i <= 200; i++) hMax = Math.max(hMax, crestRaw(-1650 + i * 16.5));
  const hOff = 2500 - hMax;
  const crestH = (x) => { const w = endW(x); return 240 + (crestRaw(x) + hOff - 240) * Math.pow(w, 0.75); };

  // half-thickness of the wall toward the front (+Z) and the back (-Z) at depth d below the crest
  const flute = (xw, P) => { const s = 1 - Math.abs(Math.sin(Math.PI * xw / P)); return s * s * s; };
  const front = (x, y, H) => {
    const d = Math.max(0, H - y), e = endW(x);
    const thin = clamp(0.95 + 0.6 * noise.n2(x / 430 + ox, y / 900 + 3.1), 0.5, 1.5);
    const web = (9 + 0.066 * Math.min(d, 1000)) * thin;
    const xw = x + 22 * noise.n2(x / 190 + oz, d / 420) + d * 0.03 * Math.sin(x / 260);
    const fade = smoothstep(0, 50, d) * (1 - smoothstep(850, 1500, d));
    const rib = (flute(xw, fluteP) * (12 + 0.07 * Math.min(d, 800)) + flute(xw + 13, fluteP2) * (2 + 0.008 * Math.min(d, 600))) * fade;
    const sp = spur(butF, x, y);
    const low = smoothstep(1650, -150, y);
    const but = sp * 560 + 40 * smoothstep(60, 800, d) * flute(x + 0.05 * d, 410);
    const wide = 520 * Math.pow(low, 1.5) * smoothstep(0, 500, d);
    const rough = noise.fbm2(x / 95 + ox, y / 95 + oz, 3) * (2 + 34 * low) + noise.ridged2(x / 230 + oz, y / 310, 2) * 70 * low * low;
    return Math.max(1.5, (web + rib + but + wide + rough)) * (0.3 + 0.7 * e);
  };
  const back = (x, y, H) => {
    const d = Math.max(0, H - y), e = endW(x);
    const thin = clamp(0.95 + 0.6 * noise.n2(x / 430 + ox, y / 900 + 3.1), 0.5, 1.5);
    const web = (6 + 0.06 * Math.min(d, 1000)) * thin;
    const fade = smoothstep(0, 50, d) * (1 - smoothstep(850, 1500, d));
    const rib = flute(x * 1.07 + 31 + d * 0.02, fluteP * 1.2) * (5 + 0.02 * Math.min(d, 800)) * fade;
    const but = spur(butB, x, y) * 420;
    const wide = 540 * Math.pow(smoothstep(1650, -150, y), 1.5) * smoothstep(0, 500, d);
    const rough = noise.fbm2(x / 120 + oz, y / 120 + ox, 2) * (2 + 26 * smoothstep(600, 1700, d));
    return Math.max(1.5, (web + rib + but + wide + rough)) * (0.3 + 0.7 * e);
  };

  // ---------------------------------------------------------------- sample both faces on the fine grid
  const W = NX + 1, R = NV + 1;
  const Hc = new Float32Array(W), Zc = new Float32Array(W), zF = new Float32Array(W * R), zB = new Float32Array(W * R);
  const gOf = (v) => 1 - Math.pow(1 - v, GP);
  for (let i = 0; i < W; i++) { const x = -LEN / 2 + (LEN * i) / NX; Hc[i] = crestH(x); Zc[i] = zc(x); }
  for (let i = 0; i < W; i++) {
    const x = -LEN / 2 + (LEN * i) / NX, H = Hc[i], endK = i === 0 || i === NX ? 0 : 1;
    for (let j = 0; j < R; j++) {
      const y = Y0 + (H - Y0) * gOf(j / NV), k = j * W + i;
      // the crest row closes to a knife edge with a small cornice leaning east (lee side)
      const lip = j === NV ? 0 : 1;
      zF[k] = Zc[i] + front(x, y, H) * lip * endK - (1 - lip) * 3;
      zB[k] = Zc[i] - back(x, y, H) * lip * endK - (1 - lip) * 3;
    }
    if ((i & 15) === 15) await ctx.yield();
  }

  // ---------------------------------------------------------------- sun, and metres of rock toward it
  const elev0 = THREE.MathUtils.degToRad(opts.sunElevation ?? (low ? 6 : night ? 30 : 24));
  const az = THREE.MathUtils.degToRad(opts.sunAzimuth ?? 0);
  const sunAt = (el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
  const sunA = sunAt(elev0), sunB = sunAt(elev0 + THREE.MathUtils.degToRad(2));

  // signed "how far inside the rock" (metres, rough) at a point, by bilinear lookup in the baked faces
  const inside = (x, y, z) => {
    const fi = clamp(((x + LEN / 2) / LEN) * NX, 0, NX - 0.001), i = fi | 0, tx = fi - i;
    const H = Hc[i] + (Hc[i + 1] - Hc[i]) * tx;
    if (y >= H) return H - y;
    const g = clamp((y - Y0) / (H - Y0), 0, 1), fj = Math.min((1 - Math.pow(1 - g, 1 / GP)) * NV, NV - 0.001), j = fj | 0, ty = fj - j;
    const k = j * W + i, a = (1 - tx) * (1 - ty), b = tx * (1 - ty), c = (1 - tx) * ty, d = tx * ty;
    const f = zF[k] * a + zF[k + 1] * b + zF[k + W] * c + zF[k + W + 1] * d;
    const bk = zB[k] * a + zB[k + 1] * b + zB[k + W] * c + zB[k + W + 1] * d;
    return Math.min(f - z, z - bk, (H - y) * 0.9);
  };
  // metres of rock along +-S: an adaptive march whose step is the distance to the nearest face, summing every
  // stretch spent inside, so the result is continuous (no contour bands) and a ray that grazes out of a ledge
  // still counts the mountain behind it
  const thickness = (x, y, z, S, sign) => {
    let L = 0, pt = 0, pm = inside(x, y, z);
    for (let s = 0; s < 44; s++) {
      const st = Math.max(1.5, Math.abs(pm) * 0.7, pm < 0 ? pt * 0.14 : 0), t = pt + st;
      const qy = y + S.y * t * sign;
      const m = inside(x + S.x * t * sign, qy, z + S.z * t * sign);
      if (pm > 0 && m > 0) L += st; else if (pm > 0) L += st * pm / (pm - m); else if (m > 0) L += st * m / (m - pm);
      pm = m; pt = t;
      if (t > 2400 || qy > 2560 || qy < Y0 || L > 1100) break;
    }
    return L;
  };

  // ---------------------------------------------------------------- geometry: front sheet + coarser back sheet
  const nF = W * R, WB = BX + 1, RB = BV + 1, nB = WB * RB, nV = nF + nB;
  const pos = new Float32Array(nV * 3), dat = new Float32Array(nV * 4);
  for (let j = 0; j < R; j++) {
    for (let i = 0; i < W; i++) {
      const k = j * W + i, x = -LEN / 2 + (LEN * i) / NX, y = Y0 + (Hc[i] - Y0) * gOf(j / NV), z = zF[k];
      pos[k * 3] = x * mirror; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
      // start the march a little inside so a grazing ray does not miss the rock it stands on
      dat[k * 4] = thickness(x, y, z - 0.5, sunA, 1);
      dat[k * 4 + 1] = dat[k * 4] > 800 ? dat[k * 4] : thickness(x, y, z - 0.5, sunB, 1);
      // baked occlusion: how far this point sits behind its neighbours (flute troughs, buttress clefts)
      let avg = 0, n = 0;
      for (let o = -10; o <= 10; o += 2) { const ii = clamp(i + o, 0, NX); avg += zF[j * W + ii] - Zc[ii]; n++; }
      avg /= n;
      const conc = clamp((avg - (z - Zc[i])) / (10 + 0.02 * (Hc[i] - y)), 0, 1);
      dat[k * 4 + 2] = 1 - 0.62 * conc;
      dat[k * 4 + 3] = Hc[i] - y;
    }
    await ctx.yield();   // a row of marches at a time
  }
  // the knife edges at both ends take their neighbours' thickness, so they do not glow as white seams
  for (let j = 0; j < R; j++) for (let c = 0; c < 2; c++) { dat[(j * W) * 4 + c] = dat[(j * W + 3) * 4 + c]; dat[(j * W + NX) * 4 + c] = dat[(j * W + NX - 3) * 4 + c]; }
  for (let j = 0; j < RB; j++) {
    for (let i = 0; i < WB; i++) {
      const k = nF + j * WB + i, fi = (i / BX) * NX, fj = (j / BV) * NV;
      const i0 = Math.min(fi | 0, NX - 1), tx = fi - i0, j0 = Math.min(fj | 0, NV - 1), ty = fj - j0;
      const x = -LEN / 2 + (LEN * i) / BX, H = lerp(Hc[i0], Hc[i0 + 1], tx);
      const y = Y0 + (H - Y0) * gOf(j / BV), q = j0 * W + i0;
      const z = lerp(lerp(zB[q], zB[q + 1], tx), lerp(zB[q + W], zB[q + W + 1], tx), ty);
      pos[k * 3] = x * mirror; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
      // the sunlit face: thickness is measured away from the sun, so its thin tops still glow a little
      const L = thickness(x, y, z + 0.5, sunA, -1);
      dat[k * 4] = i === 0 || i === BX ? 900 : L; dat[k * 4 + 1] = dat[k * 4]; dat[k * 4 + 2] = 0.75 + 0.25 * smoothstep(900, 100, H - y); dat[k * 4 + 3] = H - y;
    }
    if ((j & 3) === 3) await ctx.yield();
  }
  await ctx.yield();
  const idx = new Uint32Array((NX * NV + BX * BV) * 6); let q = 0;
  const quad = (a, b, c, d, flip) => { if (flip) { idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; } else { idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = b; idx[q++] = d; idx[q++] = c; } };
  for (let j = 0; j < NV; j++) for (let i = 0; i < NX; i++) { const a = j * W + i; quad(a, a + 1, a + W, a + W + 1, mirror < 0); }
  for (let j = 0; j < BV; j++) for (let i = 0; i < BX; i++) { const a = nF + j * WB + i; quad(a, a + 1, a + WB, a + WB + 1, mirror > 0); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aData', new THREE.BufferAttribute(dat, 4));   // thickA, thickB, occlusion, depth below crest
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  await ctx.yield();
  geo.computeVertexNormals();
  await ctx.yield();
  geo.computeBoundingSphere();
  await ctx.yield();
  geo.computeBoundingBox();
  await ctx.yield();

  // ---------------------------------------------------------------- the jade shader
  // STYLE (for the world coder: reuse JADE_COMMON + the transmit() recipe on terrain, pinnacles and the arch)
  //   colour = sun * exp(-metres of rock toward the sun / meanFreePath(rgb)) * forward phase (floor 0.35),
  //   capped at 1.6, + a sun bloom where the view ray points at the sun through thin rock, + one wide GGX lobe
  //   (roughness 0.55) from the sky, + hemisphere fill * baked occlusion on a black-green floor. Veins: two
  //   octaves of warped value noise in OBJECT space scale the absorption (+-30%) and add milky inclusions, each
  //   octave faded before it is 2 pixels wide. Tool marks: object-space striations bending the normal, near only.
  const mfp = new THREE.Vector3(...[pal[1].r, pal[1].g, pal[1].b].map((c) => -90 / Math.log(clamp(c, 0.03, 0.9))));
  const sunCol = night ? new THREE.Color(0.42, 0.56, 0.8) : low ? new THREE.Color(2.3, 1.55, 0.62) : new THREE.Color(1.72, 1.72, 1.6);
  const skyCol = night ? new THREE.Color(0.02, 0.035, 0.07) : opts.season === 'autumn' ? new THREE.Color(0.2, 0.3, 0.34) : new THREE.Color(0.075, 0.24, 0.3);
  const U = {
    uSunA: { value: sunA.clone() }, uSunB: { value: sunB.clone() }, uProg: { value: 0 }, uTime: { value: 0 }, uFogK: { value: 1 },
    uLift: { value: 0 }, uSkS: { value: -1e5 }, uSkSp: { value: 1 }, uSkMin: { value: 4 }, uMfp: { value: mfp }, uSunCol: { value: sunCol }, uSkyCol: { value: skyCol },
    uPale: { value: pal[0] }, uApple: { value: pal[1] }, uCloud: { value: pal[4] }, uDeep: { value: pal[2] }, uDark: { value: pal[3] }, uMirror: { value: mirror },
  };
  const JADE_COMMON = /* glsl */`
    float jh(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
    float jn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(mix(jh(i), jh(i + vec3(1,0,0)), f.x), mix(jh(i + vec3(0,1,0)), jh(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(jh(i + vec3(0,0,1)), jh(i + vec3(1,0,1)), f.x), mix(jh(i + vec3(0,1,1)), jh(i + vec3(1,1,1)), f.x), f.y), f.z); }`;
  const jadeMat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
    vertexShader: /* glsl */`
      attribute vec4 aData;
      uniform vec3 uSunA, uSunB; uniform float uProg, uFogK, uMirror;
      varying vec3 vObj, vNw, vWorld, vSunW, vFrontW, vXw; varying vec4 vData;
      #include <fog_pars_vertex>
      void main(){
        vObj = position; vData = aData;
        vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz;
        vNw = mat3(modelMatrix) * normal;
        vec3 s = mix(uSunA, uSunB, uProg); s.x *= uMirror;
        vSunW = normalize(mat3(modelMatrix) * s);
        vFrontW = normalize(mat3(modelMatrix) * vec3(0., 0.55, 0.83));
        vXw = normalize(mat3(modelMatrix) * vec3(1., 0., 0.));
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
        #ifdef USE_FOG
          vFogDepth *= uFogK;
        #endif
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uMfp, uSunCol, uSkyCol, uPale, uApple, uDeep, uDark; uniform float uProg, uTime, uLift;
      varying vec3 vObj, vNw, vWorld, vSunW, vFrontW, vXw; varying vec4 vData;
      #include <fog_pars_fragment>
      ${JADE_COMMON}
      // carved facets, fixed in the stone: x = distance to the nearest edge between two facets, yzw = the facet's random triple,
      // dir = from the facet's middle toward this point (the way its bevelled edge leans)
      vec4 facet(vec3 p, out vec3 dir){
        vec3 i = floor(p), f = fract(p), id = vec3(.5), rb = vec3(0., 1., 0.); float d1 = 8., d2 = 8.;
        for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
          vec3 g = vec3(float(x), float(y), float(z)); float h = jh(i + g + 3.7);
          vec3 o = fract(h * vec3(1., 57.31, 193.7) + vec3(0., .31, .67));
          vec3 r = g + .1 + .8 * o - f; float q = dot(r, r);
          if (q < d1) { d2 = d1; d1 = q; id = o; rb = r; } else if (q < d2) d2 = q;
        }
        dir = -rb * inversesqrt(max(d1, 1e-6));
        return vec4(sqrt(d2) - sqrt(d1), id);
      }
      void main(){
        vec3 N = vNw * inversesqrt(max(dot(vNw, vNw), 1e-8));
        vec3 toCam = cameraPosition - vWorld;
        float dist = max(length(toCam), 1e-3);
        vec3 V = toCam / dist;
        vec3 S = normalize(vSunW + vec3(0., 1e-5, 0.));
        float px = max(length(fwidth(vObj)), 1e-3);              // metres per pixel, taken once, outside any loop
        float depth = vData.w, ao = vData.z;

        // ---- veins and inclusions, fixed in the stone
        vec3 q = vObj * vec3(1., .6, 1.);
        vec3 wq = q + 90. * vec3(jn(q / 310. + 4.), jn(q / 310. + 19.), jn(q / 310. + 31.));
        float f1 = 1. - smoothstep(60., 120., px), f2 = 1. - smoothstep(14., 28., px), f3 = 1. - smoothstep(2.2, 4.5, px);
        float n1 = jn(wq / 240.), n2 = jn(wq / 58. + 7.3), n3 = jn(wq / vec3(9., 30., 9.) + 3.1);
        float vein = smoothstep(.56, .86, n1) * f1 * .7 + smoothstep(.6, .9, n2) * f2 * .45 + (1. - smoothstep(0., .07, abs(n2 - .47))) * f2 * .3;
        float moss = smoothstep(.56, .8, jn(wq / 130. + 11.)) * f1 + smoothstep(.62, .85, n3) * f3 * .5;
        float k = 1. + .3 * ((n1 * 2. - 1.) * f1 * .7 + (n2 * 2. - 1.) * f2 * .5) + .55 * moss - .32 * vein;
        // ---- the carver's planes: standing facets in two sizes (95 x 210 m and 30 x 64 m), each with its own tilt and a little
        // more or less stone behind it, and a narrow bevel whose upper side carries a thin line of light: the flanks break into
        // crisp planes instead of soft mottling. Weaker in the fluted fin, where the ribs are the form; each size gives way to
        // its mean before its bevel is under two pixels.
        float lowK = mix(.35, 1., smoothstep(120., 650., depth));
        float fA = (1. - smoothstep(18., 40., px)) * lowK, fB = (1. - smoothstep(5.5, 12., px)) * lowK;
        vec3 fq = vObj + 24. * (vec3(jn(vObj / 170. + 5.), jn(vObj / 170. + 17.), jn(vObj / 170. + 29.)) - .5), dA, dB;
        vec4 FA = facet(fq / vec3(95., 210., 95.) + 3.3, dA), FB = facet(fq / vec3(30., 64., 30.) + 11.7, dB);
        float wA = max(.1, 2.4 * px / 95.), wB = max(.12, 2.4 * px / 30.);
        float bA = (1. - smoothstep(0., wA, FA.x)) * fA, bB = (1. - smoothstep(0., wB, FB.x)) * fB;
        dA = normalize(dA * vec3(1., .45, 1.)); dB = normalize(dB * vec3(1., .47, 1.));
        float eF = max(bA * bA * max(dA.y, 0.), bB * bB * max(dB.y, 0.) * .6), crease = max(bA * bA * max(-dA.y, 0.), bB * bB * max(-dB.y, 0.) * .6);
        k *= mix(1., .82 + .4 * FA.y, .8 * fA) * mix(1., .9 + .22 * FB.z, fB);
        vec3 tiltF = (FA.yzw - .5) * vec3(1., .4, 1.) * (.4 * fA) + (FB.yzw - .5) * vec3(1., .4, 1.) * (.26 * fB) + dA * (bA * .5) + dB * (bB * .35);

        // ---- carver's tool marks: fine striations along the fall line, bending the normal when near
        float fs = 1. - smoothstep(.35, .8, px);
        float dtool = cos(vObj.x * 3.1 + 2.5 * jn(vObj * vec3(.2, .05, .2))) * 1.55 + cos(vObj.x * .82 + vObj.y * .11) * .41;
        vec3 Nb = N - vXw * (dtool * .05 * fs) + tiltF;
        N = Nb * inversesqrt(max(dot(Nb, Nb), 1e-8));

        // ---- transmitted light: Beer-Lambert through the baked thickness
        // uLift (the world raises it while the wall is only a horn seen above the gorge's notch): the stone reads thinner and
        // the forward phase is filled in, so what shows above the notch burns white-celadon
        float L = max(mix(vData.x, vData.y, uProg), 0.) * k * (1. - .93 * uLift);
        // the ladder, on the palette: under 15 m white-celadon (blooms), to 120 m apple, to 400 m deep, then black-green
        vec3 T = mix(uPale * 1.02, uApple * .74, smoothstep(7., 52., L));
        T = mix(T, uDeep * .5, smoothstep(90., 400., L));
        T = mix(T, uDark * .5, smoothstep(330., 950., L));
        float c = dot(-V, S);                                    // 1 when we look straight at the sun through the rock
        float fwd = clamp(c * .5 + .5, 0., 1.);
        float phase = mix(.35 + .65 * fwd * fwd * fwd, .95, uLift);
        // cirrus veils crossing the sun dim the wall in slow sliding bands
        float cir = jn(vec3(vObj.x * .0011 - uTime * .036, vObj.y * .00045 + uTime * .004, 2.7));
        float veil = 1. - .34 * smoothstep(.42, .72, cir);
        vec3 trans = min(uSunCol * T * phase * veil, vec3(1.6));
        // milky inclusions scatter a little light of their own where the stone is not too thick
        trans += uPale * vein * .16 * exp(-L / 260.) * veil;
        // the hidden sun: a white-hot bloom where the view ray meets it, coloured by the rock in between
        float cs = max(c, 1e-4);
        float hot = pow(cs, 1400.) * 7. + pow(cs, 160.) * .8 + pow(cs, 24.) * .1;
        vec3 bloomT = exp(-L / (uMfp * 2.6));
        vec3 col = trans * mix(1., ao, .6) + uSunCol * bloomT * hot * veil;

        // ---- surface: black-green floor, sky fill, one broad waxy highlight
        float hemi = N.y * .5 + .5;
        col += (uDark * (.9 + 1.5 * hemi) * (1. + .5 * vein) + uSkyCol * .05 * hemi * hemi) * ao;
        vec3 Ls = normalize(vFrontW + vec3(0., 1e-5, 0.));
        vec3 Hh = Ls + V; Hh *= inversesqrt(max(dot(Hh, Hh), 1e-6));
        float nh = max(dot(N, Hh), 0.), a2 = .55 * .55 * .55 * .55;
        float dd = nh * nh * (a2 - 1.) + 1.;
        float ggx = a2 / (3.14159 * dd * dd);
        float fres = .04 + .96 * pow(clamp(1. - dot(V, Hh), 0., 1.), 5.);
        col += mix(uSkyCol, vec3(dot(uSkyCol, vec3(.4))), .5) * ggx * fres * max(dot(N, Ls), 0.) * ao * 3.5;
        // the sunward face (never seen from the flight, seen from the orbit): plain waxy diffuse
        float lit = max(dot(N, S), 0.);
        col += mix(uDeep, uPale, .12 + .16 * vein) * uSunCol * lit * (.3 - .1 * moss) * (.5 + .5 * ao);
        // a thin bright rim where the surface turns away from us toward the light
        float rim = pow(clamp(1. - dot(N, V), 0., 1.), 4.) * smoothstep(-.2, .5, c);
        col += uSunCol * T * rim * .35;
        // the edge between two facets is thin stone: a line of light; the cut beside it lies in shade
        col *= 1. - .22 * crease;
        col += uSunCol * mix(T, uApple, .5) * eF * (.05 + .16 * fwd * fwd) * veil * mix(.6, 1., ao);

        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  Object.assign(jadeMat.uniforms, U);
  const wall = new THREE.Mesh(geo, jadeMat);
  wall.name = 'lit-wall';
  const object = new THREE.Group(); object.name = 'backlit-jade-range-hero';
  object.add(wall);

  // ---------------------------------------------------------------- crest line, summits, anchors
  const crestAt = (x) => new THREE.Vector3(x * mirror, crestH(x), zc(x) - 3);
  const crest = []; for (let i = 0; i <= 24; i++) crest.push(crestAt(1500 - i * 125));
  const peakNear = (x0) => { let bx = x0, bh = 0; for (let x = x0 - 160; x <= x0 + 160; x += 4) { const h = crestH(x); if (h > bh) { bh = h; bx = x; } } return crestAt(bx); };
  const summits = summitDefs.slice(0, 5).map((s) => peakNear(s.x)).sort((a, b) => b.y - a.y);
  const hornTop = peakNear(hornX);
  const wind = (opts.wind ? new THREE.Vector3().copy(opts.wind) : new THREE.Vector3(-0.8 * mirror, 0.2, -0.56)).normalize();

  // ---------------------------------------------------------------- spindrift plumes: view-facing ribbons
  const plumeRoots = [];
  let plumes = null;
  if (opts.plumes !== false) {
    const defs = [];
    for (const s of summits) defs.push({ p: s, len: rng.range(520, 780), w: rng.range(120, 180), a: 1 });
    const nSmall = Math.round(18 * (ctx.quality?.detail ?? 1));
    for (let i = 0; i < nSmall; i++) { const x = rng.range(-1300, 1300); defs.push({ p: crestAt(x), len: rng.range(170, 400), w: rng.range(50, 95), a: rng.range(0.6, 0.95) }); }
    const SEG = 28, per = (SEG + 1) * 2, n = defs.length;
    const pp = new Float32Array(n * per * 3), pa = new Float32Array(n * per * 4), pb = new Float32Array(n * per * 3), pi = new Uint16Array(n * SEG * 6);
    let v = 0, t = 0;
    defs.forEach((d, di) => {
      if (d.a === 1) plumeRoots.push(d.p.clone());
      const len = d.len * (gale ? 2 : 1), seed = rng.range(0, 100);
      for (let s = 0; s <= SEG; s++) for (let e = -1; e <= 1; e += 2) {
        pp[v * 3] = d.p.x; pp[v * 3 + 1] = d.p.y - 6; pp[v * 3 + 2] = d.p.z;
        pa[v * 4] = s / SEG; pa[v * 4 + 1] = e; pa[v * 4 + 2] = len; pa[v * 4 + 3] = d.w;
        pb[v * 3] = seed; pb[v * 3 + 1] = d.a * (gale ? 1.25 : 1); pb[v * 3 + 2] = di;
        v++;
      }
      for (let s = 0; s < SEG; s++) { const a = di * per + s * 2; pi[t++] = a; pi[t++] = a + 2; pi[t++] = a + 1; pi[t++] = a + 1; pi[t++] = a + 2; pi[t++] = a + 3; }
    });
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    pg.setAttribute('aP', new THREE.BufferAttribute(pa, 4));
    pg.setAttribute('aQ', new THREE.BufferAttribute(pb, 3));
    pg.setIndex(new THREE.BufferAttribute(pi, 1));
    pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2000, 0), 3200);
    const pm = new THREE.ShaderMaterial({
      fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
      vertexShader: /* glsl */`
        attribute vec4 aP; attribute vec3 aQ;
        uniform vec3 uWind; uniform float uTime, uFogK;
        varying vec2 vUv; varying vec3 vQ; varying float vLen, vFwd;
        #include <fog_pars_vertex>
        void main(){
          float t = aP.x, len = aP.z;
          vec3 p = position + uWind * (len * t);
          // the plume lifts and snakes as it leaves the crest
          p.y += len * .1 * t * t + sin(t * 5. - uTime * .55 + aQ.x) * len * .035 * t;
          p.z += cos(t * 3.7 - uTime * .4 + aQ.x * 1.7) * len * .03 * t;
          vec4 wp = modelMatrix * vec4(p, 1.);
          vec3 dirW = normalize(mat3(modelMatrix) * uWind);
          vec3 view = cameraPosition - wp.xyz;
          vec3 side = cross(dirW, view) + vec3(0., 1e-4, 0.);
          side *= inversesqrt(max(dot(side, side), 1e-8));
          float w = aP.w * (.1 + .9 * sqrt(t + .002)) * (1. + .15 * sin(uTime * .3 + aQ.x + t * 4.));
          wp.xyz += side * w * aP.y;
          vUv = vec2(t, aP.y); vQ = aQ; vLen = len;
          vFwd = dot(normalize(-view + vec3(0., 1e-4, 0.)), dirW);
          vec4 mvPosition = viewMatrix * wp;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
          #ifdef USE_FOG
            vFogDepth *= uFogK;
          #endif
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSunCol, uPale; uniform float uTime, uLift;
        varying vec2 vUv; varying vec3 vQ; varying float vLen, vFwd;
        #include <fog_pars_fragment>
        ${JADE_COMMON}
        void main(){
          float t = vUv.x, e = vUv.y;
          vec3 q = vec3(t * vLen / 85. - uTime * .33, e * 1.6 + vQ.x, vQ.x * 3. + uTime * .05);
          float n = jn(q) * .6 + jn(q * 2.3 + 5.) * .28 + jn(q * 5.1 + 9.) * .12;
          float edge = 1. - e * e; edge *= edge;
          float a = edge * smoothstep(0., .05, t) * pow(max(1. - t, 0.), .8) * (1. - t * .4) * smoothstep(.16, .64, n + .3 * (1. - t)) * vQ.y;
          // lit from behind: brightest where thin and near the crest, never far above 1 so only its core blooms
          vec3 col = mix(uPale * 1.05, uSunCol * .92, smoothstep(.3, .9, n) * (1. - t * .5)) * (1. + .5 * uLift);   // lit from behind: as bright as the crest it leaves
          gl_FragColor = vec4(col, clamp(a * .9, 0., 1.));
          #include <fog_fragment>
        }`,
    });
    Object.assign(pm.uniforms, { uWind: { value: wind }, uTime: U.uTime, uFogK: U.uFogK, uSunCol: U.uSunCol, uPale: U.uPale, uLift: U.uLift });
    plumes = new THREE.Mesh(pg, pm); plumes.name = 'spindrift'; plumes.renderOrder = 2; plumes.frustumCulled = false;
    object.add(plumes);
  }

  // ---------------------------------------------------------------- the far skein: eleven geese in a ragged V, one arm long
  // and one short, the arms stepped back, out and (the long one) up, so the V shows from the side as well as from below
  const zMid = zc(0);
  const skFrom = opts.skeinLine?.from ? new THREE.Vector3().copy(opts.skeinLine.from) : new THREE.Vector3(1250 * mirror, rng.range(520, 700), zMid + rng.range(900, 1300));
  const skTo = opts.skeinLine?.to ? new THREE.Vector3().copy(opts.skeinLine.to) : new THREE.Vector3(-1450 * mirror, skFrom.y + rng.range(160, 320), zMid + rng.range(700, 1000));
  let skein = null; const bufSize = new THREE.Vector2();
  if (opts.skein !== false) {
    const N = 11, lead = rng.int(4, 5);
    const sp = new Float32Array(N * 5 * 3), sa = new Float32Array(N * 5 * 4), si = new Uint16Array(N * 9);
    // per bird: nose, tail, left tip, right tip, neck tip.  aG = (slot back along the line, lateral, phase, part)
    const part = [[0, 0, 0.3], [0, 0, -0.42], [-0.78, 0, -0.1], [0.78, 0, -0.1], [0, 0.02, 0.75]];
    for (let b = 0; b < N; b++) {
      const rank = Math.abs(b - lead), arm = b < lead ? -1 : 1;
      const backM = rank * 3 + (rank ? rng.range(-0.9, 0.9) : 0), lat = arm * rank * 1.3 + (rank ? rng.range(-0.55, 0.55) : 0);
      for (let k = 0; k < 5; k++) {
        const v = b * 5 + k; sp.set(part[k], v * 3);
        sa[v * 4] = backM; sa[v * 4 + 1] = lat; sa[v * 4 + 2] = rank * 0.2 + rng.range(-0.03, 0.03); sa[v * 4 + 3] = k;
      }
      si.set([b * 5, b * 5 + 1, b * 5 + 2, b * 5, b * 5 + 3, b * 5 + 1, b * 5 + 2, b * 5 + 4, b * 5 + 3], b * 9);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    sg.setAttribute('aG', new THREE.BufferAttribute(sa, 4));
    sg.setIndex(new THREE.BufferAttribute(si, 1));
    const sm = new THREE.ShaderMaterial({
      fog: true, side: THREE.DoubleSide,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
      vertexShader: /* glsl */`
        attribute vec4 aG;
        uniform vec3 uFrom, uTo; uniform float uTime, uVH, uFogK, uSkS, uSkSp, uSkMin;
        varying float vGlow, vTip;
        #include <fog_pars_vertex>
        void main(){
          vec3 line = uTo - uFrom; float len = max(length(line), 1.); vec3 dir = line / len;
          vec3 right = cross(dir, vec3(0., 1., 0.)) + vec3(1e-5, 0., 0.); right *= inversesqrt(max(dot(right, right), 1e-8));
          vec3 up = cross(right, dir);
          vec3 c0 = uFrom + dir * (uSkS > -9000. ? uSkS : len * .5);
          vec4 q0 = projectionMatrix * viewMatrix * modelMatrix * vec4(c0, 1.);
          float k0 = max(1., uSkMin / max(1.56 * projectionMatrix[1][1] * uVH * .5 / max(q0.w, 1e-3), 1e-5));
          float sp = max(uSkSp, k0 * .5);                   // the V opens with the size the birds are drawn at
          float back = aG.x * sp;
          float s = fract(uTime * 18. / (len + 400.) + .35) * (len + 400.) - 200. - back;   // 18 m/s, wraps past both ends
          if (uSkS > -9000.) s = uSkS - back;                                               // or the world keys the lead's place to the flight
          float show = smoothstep(-30., 60., s) * (1. - smoothstep(len - 60., len + 30., s));
          // the line snakes: each bird repeats the leader's weave a little later
          float wv = sin(uTime * .45 - aG.x * .035) * 5. + sin(uTime * .21 - aG.x * .011) * 9.;
          vec3 c = uFrom + dir * s + right * (aG.y * sp + wv) + up * (aG.y * sp * 1.5 + (sin(uTime * .33 - aG.x * .03) * 3. + sin(uTime * .19 - aG.x * .012) * 4.) * min(sp, 3.));
          // wings never glide: 2.8 beats a second, each bird a fifth of a beat behind the one ahead
          float ph = 6.2832 * (uTime * 2.8 - aG.z);
          float isTip = step(1.5, aG.w) * step(aG.w, 3.5);
          vec3 l = position; l.y += isTip * sin(ph) * .52; l.x *= 1. - isTip * .18 * (1. - cos(ph));
          vec4 cc = projectionMatrix * viewMatrix * modelMatrix * vec4(c, 1.);
          float pxPerM = projectionMatrix[1][1] * uVH * .5 / max(cc.w, 1e-3);
          float k = max(1., uSkMin / max(1.56 * pxPerM, 1e-5)) * show;
          vec3 p = c + (right * l.x + up * l.y + dir * l.z) * k;
          vGlow = .5 + .5 * sin(ph + 1.9);            // brightest on the downbeat, a wave down the line
          vTip = isTip;
          vec4 mvPosition = viewMatrix * modelMatrix * vec4(p, 1.);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
          #ifdef USE_FOG
            vFogDepth *= uFogK;
          #endif
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uPale, uRind;
        varying float vGlow, vTip;
        #include <fog_pars_fragment>
        void main(){
          vec3 col = uPale * (.5 + .55 * vGlow * vGlow);
          col = mix(col, uRind * .12, smoothstep(.8, 1., vTip));     // dark primaries at the wingtips
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }`,
    });
    Object.assign(sm.uniforms, { uFrom: { value: skFrom }, uTo: { value: skTo }, uTime: U.uTime, uVH: { value: 900 }, uFogK: U.uFogK, uSkS: U.uSkS, uSkSp: U.uSkSp, uSkMin: U.uSkMin, uPale: U.uPale, uRind: { value: pal[5] } });
    skein = new THREE.Mesh(sg, sm); skein.name = 'far-skein'; skein.frustumCulled = false;
    object.add(skein);
  }

  // ---------------------------------------------------------------- cloud apron: milk-jade sea lapping the foot
  let apron = null;
  if (opts.cloudApron !== false) {
    const RG = 40, SG = 96, RAD = 5200, cy = opts.cloudY ?? 60;
    const ap = new Float32Array((RG + 1) * SG * 3), ai = new Uint16Array(RG * SG * 6); let av = 0, at = 0;
    for (let r = 0; r <= RG; r++) for (let g = 0; g < SG; g++) {
      const rr = RAD * Math.pow(r / RG, 1.5), a = (g / SG) * Math.PI * 2;
      ap[av++] = Math.sin(a) * rr; ap[av++] = cy; ap[av++] = Math.cos(a) * rr + 300;
    }
    for (let r = 0; r < RG; r++) for (let g = 0; g < SG; g++) { const a = r * SG + g, b = r * SG + (g + 1) % SG; ai[at++] = a; ai[at++] = b; ai[at++] = a + SG; ai[at++] = b; ai[at++] = b + SG; ai[at++] = a + SG; }
    const ag = new THREE.BufferGeometry();
    ag.setAttribute('position', new THREE.BufferAttribute(ap, 3)); ag.setIndex(new THREE.BufferAttribute(ai, 1));
    ag.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, cy, 300), RAD + 100);
    const CLOUD_H = /* glsl */`
      float cloudH(vec2 p, float t){
        vec2 f = p + vec2(.0, 1.) * t * 5.;                       // the sea drifts slowly toward +Z (the gorge)
        float h = jn(vec3(f / 420., t * .012)) * .55 + jn(vec3(f / 150. + 7., t * .03)) * .3;
        float b = jn(vec3(f / 52. + 3., t * .05)); return h + b * b * .22;
      }`;
    const am = new THREE.ShaderMaterial({
      fog: true, transparent: true, side: THREE.DoubleSide,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
      vertexShader: /* glsl */`
        uniform float uTime, uFogK; varying vec3 vObj; varying float vH;
        #include <fog_pars_vertex>
        ${JADE_COMMON}
        ${CLOUD_H}
        void main(){
          vec3 p = position; vH = cloudH(p.xz, uTime); p.y += vH * 70. - 30.; vObj = p;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
          #ifdef USE_FOG
            vFogDepth *= uFogK;
          #endif
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uCloud, uPale, uApple, uSunCol; uniform float uTime;
        varying vec3 vObj; varying float vH;
        #include <fog_pars_fragment>
        ${JADE_COMMON}
        ${CLOUD_H}
        void main(){
          float px = max(length(fwidth(vObj.xz)), 1e-3);
          float h = cloudH(vObj.xz, uTime);
          float fine = jn(vec3(vObj.xz / 17. + 2., uTime * .08)) * (1. - smoothstep(5., 12., px));
          float crest = smoothstep(.38, .82, h + fine * .12);
          // grey-green in the wall's shade (+Z), white on billow crests and on the far, sunlit shore (-Z)
          float lee = smoothstep(-700., 500., vObj.z) * (1. - smoothstep(2600., 4600., vObj.z));
          vec3 shade = mix(uCloud, vec3(.62, .72, .7), .35) * mix(.46, .8, crest) + uApple * .04 * lee;
          vec3 sunlit = mix(uCloud * .7, uPale * .98, crest) * (uSunCol / 1.72);
          vec3 col = mix(sunlit, shade, lee) + uPale * .22 * crest * crest * crest;
          float r = length(vObj.xz - vec2(0., 300.)) / 5200.;
          gl_FragColor = vec4(col, 1. - smoothstep(.72, .98, r));
          #include <fog_fragment>
        }`,
    });
    Object.assign(am.uniforms, { uTime: U.uTime, uFogK: U.uFogK, uCloud: U.uCloud, uPale: U.uPale, uApple: U.uApple, uSunCol: U.uSunCol });
    apron = new THREE.Mesh(ag, am); apron.name = 'cloud-apron'; apron.renderOrder = 1;
    object.add(apron);
  }

  // ---------------------------------------------------------------- anchors
  const revealPos = new THREE.Vector3(500 * mirror, 120, 3360);
  const tB = (revealPos.z - zc(500)) / Math.max(-sunA.z, 0.2);
  const sunBloom = new THREE.Vector3(revealPos.x + sunA.x * mirror * tB, revealPos.y + sunA.y * tB, zc(500));
  const colPos = new THREE.Vector3((hornX + 1000) * mirror, 230, hornTop.z + 2070);
  const fly = [[450, -120, 60], [300, -92, 30], [150, -45, 8], [60, 0, 0], [0, 0, 0]].map((o) => new THREE.Vector3(colPos.x + o[0] * mirror, colPos.y + o[1], colPos.z + o[2]));
  const mx = (v) => new THREE.Vector3(v.x * mirror, v.y, v.z);
  const anchors = {
    sunDir: mx(sunA), sunDirEnd: mx(sunB), hornTop, summits, crest, sunBloom, plumeRoots, wind: wind.clone(),
    viewpoints: {
      reveal: { position: revealPos, lookAt: new THREE.Vector3(0, 1150, zMid) },
      col: { position: colPos, lookAt: new THREE.Vector3(hornTop.x, 1400, hornTop.z) },
    },
    flyThrough: fly,
    portalSeat: { position: colPos.clone(), facing: new THREE.Vector3(mirror, 0, 0) },
    skeinLine: { from: skFrom, to: skTo, s: U.uSkS, spread: U.uSkSp, minPx: U.uSkMin },
  };

  const maxHaze = opts.maxHaze ?? 0.00006;
  let prog = 0;
  return {
    object, radius: 1500, height: 2500, center: new THREE.Vector3(0, 1150, zMid), anchors,
    ground: true, groundY: 0,
    setProgress(u) { prog = clamp(u, 0, 1); U.uProg.value = prog; },
    setLift(k) { U.uLift.value = clamp(k, 0, 1); },
    update(dt, time, camera) {
      U.uTime.value = time;
      // keep the wall's contrast at kilometres: never accept an exponential haze denser than maxHaze
      let root = object; while (root.parent) root = root.parent;
      const fog = root.fog;
      U.uFogK.value = fog && fog.isFogExp2 && fog.density > maxHaze ? maxHaze / fog.density : 1;
      if (skein && ctx.renderer) { ctx.renderer.getDrawingBufferSize(bufSize); skein.material.uniforms.uVH.value = bufSize.y; }
    },
    dispose() {},
  };
}
