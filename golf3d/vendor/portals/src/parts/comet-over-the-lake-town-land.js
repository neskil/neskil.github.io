// comet-over-the-lake-town, part LAND: the crater lake's ground (one height function), the kit terrain over it, the
// lake's true mirror (one planar reflection of the whole scene at y 0), and the flooded terraces, whose still sheets
// ask the sky part's own functions about the mirrored ray.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import * as T from '../kit/terrain.js';
import { SKY_GLSL, COMET_GLSL, STORM_GLSL } from './comet-over-the-lake-town-sky.js';

// THE ROUTE (metres; x east, y up, z south; we fly toward minus z), a typed line. In over the lake and round the islet's west side on a
// 75 m arc; north-west over open water; one wide right-hand turn (59 m radius) to run east past the quay 30 m off its lip; a left turn
// (62 m) in over the quay to THE LANE'S FOOT; then up THE LANE between the houses with the eye 6 m over the lane's ground: a left bend
// and a right bend, each of 125 m radius, with 101 m of straight between them; on past the meadow and beside the shrine's gate; up the
// brook's ride through the cedars to the bench's lip; and from the lip ONE STRAIGHT due north (x 0, 210 m) to the ring: over the terraces the eye
// rides 9 m above the slope's own contour height under it (contourZ: so 8 to 10 m over each step's water), and from over the top step's water it
// climbs evenly to the ring's middle. The town's main lane is laid on this line.
export const ROUTE = [
  [0, 6, 0], [0, 6, -30], [0, 6, -58], [0, 6, -72], [-1.3, 6, -85.7], [-5, 5.9, -98.8], [-10.9, 5.9, -110.9], [-19.1, 5.8, -121.9], [-28.5, 5.8, -131.5],
  [-38.2, 5.7, -141.2], [-47.9, 5.7, -150.9], [-57.4, 5.7, -160.4], [-67.1, 5.6, -170.1], [-76.8, 5.6, -179.8], [-85.7, 5.6, -189.9], [-92.2, 5.6, -202], [-95.7, 5.6, -215], [-96.2, 5.6, -228.7],
  [-93.5, 5.6, -241.9], [-87.8, 5.7, -254.4], [-79.4, 5.8, -265.2], [-68.9, 5.9, -273.6], [-56.6, 6, -279.6], [-43.3, 6, -282.7], [-30, 6, -285.2], [-17.2, 6, -289.8], [-5.9, 6.1, -297.1],
  [3.8, 6.7, -306.8], [11.5, 7.1, -318], [17.9, 7.4, -330.1], [22.9, 8.5, -342.6], [26.5, 9.6, -355.9], [28.7, 11.6, -369.2], [29.4, 13.6, -382.9], [28.6, 15.6, -396.4], [26.4, 18, -409.9],
  [22.7, 20.5, -422.9], [18, 22.9, -435.8], [13.4, 25.6, -448.5], [8.7, 28.3, -461.4], [4.1, 31, -474], [-0.6, 34, -487], [-5.3, 37.2, -499.9], [-9.9, 40.1, -512.5], [-14.5, 43.5, -525.5],
  [-17.8, 46.9, -538.5], [-19.7, 50.4, -552], [-20.4, 54.1, -565.6], [-21.1, 58.9, -579.2], [-21.6, 63.5, -593], [-22.2, 65.6, -606.5], [-22.5, 66.2, -620], [-20.6, 77.4, -640.4], [-16, 96, -668],
  [-11.6, 104.9, -688.5], [-6.3, 113.9, -709], [-1.9, 122.6, -729.5], [0, 131.5, -750], [0, 134.75, -790], [0, 138, -830], [0, 141.25, -870], [0, 142.87, -890], [0, 145.74, -900], [0, 163, -960]];
export const SHORE_Z = -320, SHRINE = { x: -55, y: 60, z: -620 }, ISLET = { x: 2, z: -124 }, RING = { x: 0, y: 163, z: -960, r: 9 };
export const GATE = { x: SHRINE.x + 15, y: SHRINE.y, z: SHRINE.z, h: 4.74 };   // the shrine's one gate: its foot's middle, its height
export const TERR = { z0: -740, z1: -925, y0: 122, y1: 135, xa: -112, xb: 132, yw: 122.8 };   // (yw: the lowest step's water)
// the meadow at the town's upper edge, between the last houses and the shrine's court (laid out by hand; x, z in metres)
export const FIELD = {
  lane: [[-20, -556], [-21.5, -572], [-24, -587], [-27, -598], [-29.5, -606]],                                        // the footpath from the lane's head to the court's edge: it ends 14 m short of the gate and 6 m to one side of it
  houses: [[26, -566, 0.3], [-63, -565, -0.25], [31, -597, 0.15]],                                                    // three farmhouses: x, z, turn
  plots: [[-38, -566, 8, 9, 5], [17, -596.5, 10, 7, 7], [-41, -592, 7, 8, 5]],                                        // vegetable plots: x, z, width, depth, bean poles
  trees: [[-9, -577, 1.0], [4, -591.5, 0.9], [-37, -581, 1.1], [20, -574, 0.95], [-56, -577.5, 1.05]],                // five persimmon trees
  lanterns: [0.07, 0.5, 0.93],                                                                  // seven along the footpath: three close at its foot, one half way, three close at its end (how far up it each group stands)
};
export const inField = (x, z, m = 1.2) => FIELD.houses.some((p) => Math.hypot(x - p[0], z - p[1]) < 8.5) || FIELD.plots.some((p) => Math.abs(x - p[0]) < p[2] / 2 + 0.5 && Math.abs(z - p[1]) < p[3] / 2 + 0.5)
  || FIELD.lane.some((p, i) => i > 0 && Math.abs(z - (p[1] + FIELD.lane[i - 1][1]) / 2) < Math.abs(p[1] - FIELD.lane[i - 1][1]) / 2 + 1 && Math.abs(x - (p[0] + FIELD.lane[i - 1][0]) / 2) < Math.abs(p[0] - FIELD.lane[i - 1][0]) / 2 + 3.2 + m - 1.2);
const LAKE = { cx: 260, cz: 520, a: 900, b: 840 };
const HEAD = { x0: 250, z0: -200, x1: 900, z1: -40 };            // the long low headland: tip, root
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
// the town's valley from the waterline to the rim, by metres inland
const PROFILE = [[0, 0], [40, 3.4], [80, 9.2], [120, 16.6], [160, 25.1], [200, 34.7], [250, 48], [300, 60], [330, 70], [440, 122], [600, 135], [640, 149.5], [662, 150],
  [760, 112], [1000, 62], [2400, 40]];
function profileAt(d) {
  if (d <= 0) return 0;
  for (let i = 1; i < PROFILE.length; i++) if (d <= PROFILE[i][0]) { const a = PROFILE[i - 1], b = PROFILE[i]; return lerp(a[1], b[1], (d - a[0]) / (b[0] - a[0])); }
  return 40;
}

// the ground: h(x, z) and the pieces of it other makers ask for
export function makeGround(noise, shape = {}) {
  const w3 = shape.w3 ?? 0.8, w5 = shape.w5 ?? 2.1, tn = -Math.PI / 2;
  const wob = (t) => 0.045 * Math.cos(3 * t + w3) + 0.03 * Math.cos(5 * t + w5) + 0.018 * Math.cos(8 * t + 0.3), wob0 = wob(tn);
  // metres inland of the waterline (negative over the lake), before the headland and the islet
  const bend = (x) => 20 * Math.sin(x / 95 + 0.6) + 0.0007 * x * x;          // the upper ground's contours curve
  const inland = (x, z) => {
    const ex = (x - LAKE.cx) / LAKE.a, ez = (z - LAKE.cz) / LAKE.b, th = Math.atan2(ez, ex);
    const oval = (Math.hypot(ex, ez) / (1 + wob(th) - wob0) - 1) * 840;
    const town = SHORE_Z - z + 5 * Math.sin(x / 60 + 1.3);
    const g = ss(215, 430, Math.abs(x + 15));
    return lerp(town, oval, g);
  };
  const gentle = (x) => (x < 0 ? 1 - ss(330, 600, -x) : 1 - ss(200, 430, x));   // the broad low saddle the town climbs
  const wallH = (x, z) => { const th = Math.atan2(z - LAKE.cz, x - LAKE.cx), c = Math.cos(th), s = Math.sin(th);
    return 325 + 70 * noise.n2(c * 1.7 + 5, s * 1.7) + 34 * noise.n2(c * 5 + 9, s * 5) - 26 * (1 - Math.abs(noise.n2(c * 13, s * 13 + 4))); };
  const headD = (x, z) => { const ax = HEAD.x1 - HEAD.x0, az = HEAD.z1 - HEAD.z0, t = Math.min(1, Math.max(0, ((x - HEAD.x0) * ax + (z - HEAD.z0) * az) / (ax * ax + az * az)));
    return Math.hypot(x - HEAD.x0 - ax * t, z - HEAD.z0 - az * t) + 9 * noise.n2(x * 0.02, z * 0.02) - 14 * t; };
  const base = (x, z) => {
    const d0 = inland(x, z);
    if (d0 <= 0) return Math.max(-26, d0 * 0.16);
    const g = gentle(x), up = ss(300, 380, d0), d = d0 + bend(x) * up * g;
    const wall = wallH(x, z) * Math.pow(1 - Math.exp(-d0 / 190), 1.25) * (1 - 0.5 * ss(620, 1500, d0));
    let h = lerp(wall, profileAt(Math.max(0, d)), g);
    const rough = (1 - g) * (5 + 0.05 * h) + g * (0.25 + 1.6 * ss(600, 700, d0));
    h += rough * noise.fbm2(x * 0.012, z * 0.012, 4) + (1 - g) * 9 * (1 - Math.abs(noise.n2(x * 0.006, z * 0.006))) * ss(20, 200, d0);
    return h;
  };
  const smax = (a, b, k) => { const hh = Math.max(0, 1 - Math.abs(a - b) / k); return Math.max(a, b) + hh * hh * k * 0.25; };
  const heightAt = (x, z) => {
    let h = base(x, z);
    const hd = headD(x, z);
    if (hd < 220) h = smax(h, hd < 62 ? 21 * (1 - (hd / 62) * (hd / 62)) + 1.2 * noise.n2(x * 0.05, z * 0.05) : -(hd - 62) * 0.18, 5);
    const di = Math.hypot(x - ISLET.x, z - ISLET.z) + 2.5 * noise.n2(x * 0.11, z * 0.11);
    if (di < 60) h = smax(h, di < 15 ? 5.2 * (1 - (di / 15) * (di / 15)) : -(di - 15) * 0.3, 2);
    const ds = Math.hypot(x - SHRINE.x, z - SHRINE.z);                           // the shrine's levelled shelf
    if (ds < 64) h = lerp(SHRINE.y, h, ss(24, 64, ds));
    return h;
  };
  // the terraces' ground is the same slope taken down a little, so that the built banks and sheets cover it
  // (the zone is known by the slope's own height between the lowest bank and the highest, inside the rim)
  const terrBy = (h, x) => ss(120, 122, h) * ss(136.6, 135.3, h) * ss(TERR.xa - 10, TERR.xa + 4, x) * ss(TERR.xb + 10, TERR.xb - 4, x);
  const outT = (x, z) => x < TERR.xa - 10 || x > TERR.xb + 10 || z > -700 || z < -960;
  const inTerr = (x, z) => (outT(x, z) ? 0 : terrBy(heightAt(x, z), x));
  const groundAt = (x, z) => { const h = heightAt(x, z); return outT(x, z) ? h : h - 0.9 * terrBy(h, x); };
  return { heightAt, groundAt, inland, gentle, bend, headD, inTerr, profileAt, ss };
}

// ------------------------------------------------------------------ the kit terrain over the ground
export async function buildTerrain(ctx, G, path, light) {
  const C = (h) => new THREE.Color(h), n = ctx.noise;
  const cMud = C('#2b2a24'), cShore = C('#6b665a'), cGrass = C('#465a30'), cGrass2 = C('#5a6b38'), cEarth = C('#5a4a36'), cWood = C('#1d3a27'), cBeech = C('#3f6a34'),
    cRock = C('#5e5a55'), cRidge = C('#66703e'), tmp = new THREE.Color();
  const color = (x, z, h, ny, out) => {
    if (h < 0.25) return out.copy(cMud).lerp(cShore, G.ss(-3, 0.25, h));
    const g = G.gentle(x), d = G.inland(x, z), hd = G.headD(x, z);
    const wooded = Math.max(1 - g, hd < 70 ? 1 : 0, G.ss(40, 110, Math.abs(x + 15) - 150) * G.ss(300, 200, d));
    const m = n.fbm2(x * 0.02 + 40, z * 0.02, 3) * 0.5 + 0.5, m2 = n.n2(x * 0.11, z * 0.11) * 0.5 + 0.5;
    out.copy(cGrass).lerp(cGrass2, m).lerp(cEarth, G.ss(0.55, 0.8, m2) * 0.6);
    out.lerp(cRidge, G.ss(560, 640, d) * g);
    tmp.copy(cWood).lerp(cBeech, G.ss(0.45, 0.75, m) * 0.7).multiplyScalar(0.75 + 0.5 * m2);
    out.lerp(tmp, wooded);
    out.lerp(cRock, G.ss(0.74, 0.6, ny) * 0.85);
    return out.lerp(cShore, G.ss(1.6, 0.25, h) * 0.8);
  };
  const terrain = await T.makeTerrainAsync({ rng: ctx.rng, noise: n, path, height: G.groundAt, corridor: false, bounds: [-1500, -2300, 1900, 1700],
    cell: 3, near: 46, levels: 5, maxTriangles: 40000, biome: 'meadow', palette: { clouds: 0, snow: 0, snowAmount: 0, rock: '#3a5238', rockB: '#4a623e', strata: 0, joints: 0, varnish: 0, patchAmount: 0, bedRelief: 0, cracks: 0 }, color, waterLevel: 0, sunDir: light, shadow: 0.12, skirt: 30 }, ctx.yield);
  terrain.object.name = 'ground';
  return terrain;
}

// ------------------------------------------------------------------ the land's foot in the mirror's picture
// The lake's mirror is drawn from the eye's mirrored place under the water, and from there the hills are hollow shells seen from inside: where the bank's own
// body should close that picture at the waterline, the low bright sky and the far ranges' lit rims stood instead, and the water showed them along every shore
// as one thin bright line (the lamps' long images picked the same up under the quay and laid it over the quay wall's image). This sheet closes the land at
// the water's level, in the dark of the bank: 48 m squares under all ground whose every corner and middle stand over 4 m; the ground's own triangles
// wherever a square is missing, laid flat and kept only where the ground is above the water (so the sheet's edge is the waterline itself); and a wide
// apron round the ground's outer edge. The world shows it in the mirror's pass alone.
export function makeLandFoot(terrain, G, bounds = [-1500, -2300, 1900, 1700]) {
  const C = 48, [bx0, bz0, bx1, bz1] = bounds, nx = Math.ceil((bx1 - bx0) / C), nz = Math.ceil((bz1 - bz0) / C), high = (x, z) => G.groundAt(x, z) > 4, v = [];
  const corner = new Uint8Array((nx + 1) * (nz + 1)), kept = new Uint8Array(nx * nz);
  for (let k = 0; k <= nz; k++) for (let i = 0; i <= nx; i++) corner[k * (nx + 1) + i] = high(bx0 + i * C, bz0 + k * C) ? 1 : 0;
  for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) { const j = k * (nx + 1) + i;
    kept[k * nx + i] = corner[j] + corner[j + 1] + corner[j + nx + 1] + corner[j + nx + 2] === 4 && high(bx0 + (i + 0.5) * C, bz0 + (k + 0.5) * C) ? 1 : 0; }
  const p0 = terrain.object.geometry.attributes.position, ix = terrain.object.geometry.index, n = ix ? ix.count : p0.count, at = (i) => (ix ? ix.getX(i) : i);
  for (let t = 0; t + 2 < n; t += 3) {
    const a = at(t), b = at(t + 1), c = at(t + 2), xa = p0.getX(a), ya = p0.getY(a), za = p0.getZ(a), xb = p0.getX(b), yb = p0.getY(b), zb = p0.getZ(b), xc = p0.getX(c), yc = p0.getY(c), zc = p0.getZ(c);
    if (Math.max(ya, yb, yc) < 0) continue;
    const i0 = Math.floor((Math.min(xa, xb, xc) - bx0) / C), i1 = Math.floor((Math.max(xa, xb, xc) - bx0) / C), k0 = Math.floor((Math.min(za, zb, zc) - bz0) / C), k1 = Math.floor((Math.max(za, zb, zc) - bz0) / C);
    let under = i0 >= 0 && k0 >= 0 && i1 < nx && k1 < nz && (i1 - i0) * (k1 - k0) < 64;
    for (let k = k0; k <= k1 && under; k++) for (let i = i0; i <= i1 && under; i++) under = kept[k * nx + i] === 1;
    if (!under) v.push(xa, ya, za, xb, yb, zb, xc, yc, zc);
  }
  const quad = (x0, z0, x1, z1) => v.push(x0, 1, z0, x1, 1, z0, x1, 1, z1, x0, 1, z0, x1, 1, z1, x0, 1, z1);
  for (let k = 0; k < nz; k++) {
    let run = -1;
    for (let i = 0; i <= nx; i++) {
      const ok = i < nx && kept[k * nx + i] === 1;
      if (ok && run < 0) run = i;
      if (!ok && run >= 0) { quad(bx0 + run * C, bz0 + k * C, bx0 + i * C, bz0 + (k + 1) * C); run = -1; }
    }
  }
  const F = 40000, ex = bx0 + nx * C, ez = bz0 + nz * C;
  quad(-F, -F, F, bz0); quad(-F, ez, F, F); quad(-F, bz0, bx0, ez); quad(ex, bz0, F, ez);
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  const material = new THREE.ShaderMaterial({ name: 'LakeTownLandFoot', side: THREE.DoubleSide, uniforms: { uCol: { value: new THREE.Color('#0f1814') } },
    vertexShader: /* glsl */`varying float vH; void main() { vec4 w = modelMatrix*vec4(position, 1.0); vH = w.y; w.y = 0.0; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`precision highp float; uniform vec3 uCol; varying float vH; void main() { if (vH < 0.0) discard; gl_FragColor = vec4(uCol, 1.0); }` });
  const mesh = new THREE.Mesh(geometry, material); mesh.name = 'land foot'; mesh.frustumCulled = false; mesh.visible = false; mesh.position.copy(terrain.object.position);
  mesh.userData.triangles = v.length / 9;
  return mesh;
}

// ------------------------------------------------------------------ the lake: one true mirror
// A planar reflection: the scene is drawn once more from the eye's mirror place under the water, cut at the water's
// level, and the sheet shows that picture where each point of water looks at it. So sky, comet, meteors, ridge, town,
// lamps, boats and the ring stand in the water at their mirrored places and nothing else does. Dimmed a little; a
// breath of ripple within a few metres of the town's shore and of the boats only.
export function makeLakeMirror(fog, boats = [], fish = []) {
  const fi = []; for (let i = 0; i < 5; i++) { const f = fish[i]; fi.push(f ? new THREE.Vector4(f[0], f[1], f[2], f[3]) : new THREE.Vector4(0, 90000, 30, 0)); }
  const bo = []; for (let i = 0; i < 8; i++) { const b = boats[i]; bo.push(b ? new THREE.Vector3(b.x, b.z, 1) : new THREE.Vector3(0, 0, 0)); }
  const mirror = new Reflector(new THREE.PlaneGeometry(2400, 1900), {
    textureWidth: 1280, textureHeight: 720, clipBias: 0.02, multisample: 0,
    shader: {
      name: 'LakeTownMirror',
      uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, uTime: { value: 0 }, uDeep: { value: new THREE.Color('#0a1626') },
        uFogColor: { value: fog.color }, uFogDensity: { value: fog.density }, uBoat: { value: bo }, uFish: { value: fi }, uShoreZ: { value: SHORE_Z } },
      vertexShader: /* glsl */`
        uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
        void main() { vUv = textureMatrix*vec4(position, 1.0); vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: /* glsl */`
        precision highp float;
        uniform sampler2D tDiffuse; uniform float uTime, uFogDensity, uShoreZ; uniform vec3 uDeep, uFogColor, uBoat[8]; uniform vec4 uFish[5];
        varying vec4 vUv; varying vec3 vW;
        void main() {
          vec3 toEye = cameraPosition - vW; float dist = length(toEye);
          float graze = 1.0 - clamp(toEye.y/max(dist, 1e-3), 0.0, 1.0);
          float near = (1.0 - smoothstep(0.0, 30.0, vW.z - uShoreZ))*(1.0 - smoothstep(200.0, 240.0, abs(vW.x + 15.0)));
          for (int i = 0; i < 8; i++) { vec2 b = vW.xz - uBoat[i].xy; near = max(near, uBoat[i].z*(1.0 - smoothstep(1.0, 16.0, dot(b, b)))); }
          float shoreN = near;
          near = max(near, 0.45);                                           // the open water breathes: a long slow smooth swell moves its image (never a sparkle)
          vec2 rip = vec2(sin(vW.x*0.8 + uTime*0.7 + 1.1*sin(vW.z*0.35 + uTime*0.25)), sin(vW.z*1.1 - uTime*0.6 + 0.9*sin(vW.x*0.3)));
          vec2 ring = vec2(0.0);                                            // a fish rises at a dealt place on a dealt clock: one ring widens and dies
          for (int i = 0; i < 5; i++) { vec2 f = vW.xz - uFish[i].xy; float d = length(f), a = fract((uTime + uFish[i].w)/uFish[i].z)*3.0, w = (d - 1.0 - 14.0*a)/(0.5 + 1.1*a);
            ring += f/max(d, 0.3)*sin(w*3.0)*exp(-w*w)*max(1.0 - a, 0.0)*max(1.0 - a, 0.0)*smoothstep(0.0, 0.06, a); }
          vec4 uv = vUv; uv.xy += (rip*near*0.0055 + ring*0.012)*uv.w;
          vec3 refl = texture2DProj(tDiffuse, uv).rgb;
          float shoreW = smoothstep(0.15, 1.0, shoreN);                     // (only within 30 m of the town's shore and round the boats: over the whole lake it drew the far bank's warm places as one red line on the waterline)
          // by the shore the lamps and lit windows draw long in the water, toward the eye: five reads of the image, each written out (no read stands in a loop)
          vec3 sk; float step1 = 0.011*uv.w;
          sk = texture2DProj(tDiffuse, uv + vec4(0.0, 1.0*step1, 0.0, 0.0)).rgb; refl = max(refl, sk*(smoothstep(0.55, 1.0, sk.r)*smoothstep(0.05, 0.3, sk.r - sk.b)*shoreW*(1.0 - 1.0/6.5)));
          sk = texture2DProj(tDiffuse, uv + vec4(0.0, 2.0*step1, 0.0, 0.0)).rgb; refl = max(refl, sk*(smoothstep(0.55, 1.0, sk.r)*smoothstep(0.05, 0.3, sk.r - sk.b)*shoreW*(1.0 - 2.0/6.5)));
          sk = texture2DProj(tDiffuse, uv + vec4(0.0, 3.0*step1, 0.0, 0.0)).rgb; refl = max(refl, sk*(smoothstep(0.55, 1.0, sk.r)*smoothstep(0.05, 0.3, sk.r - sk.b)*shoreW*(1.0 - 3.0/6.5)));
          sk = texture2DProj(tDiffuse, uv + vec4(0.0, 4.0*step1, 0.0, 0.0)).rgb; refl = max(refl, sk*(smoothstep(0.55, 1.0, sk.r)*smoothstep(0.05, 0.3, sk.r - sk.b)*shoreW*(1.0 - 4.0/6.5)));
          sk = texture2DProj(tDiffuse, uv + vec4(0.0, 5.0*step1, 0.0, 0.0)).rgb; refl = max(refl, sk*(smoothstep(0.55, 1.0, sk.r)*smoothstep(0.05, 0.3, sk.r - sk.b)*shoreW*(1.0 - 5.0/6.5)));
          float k = mix(0.62, 0.9, smoothstep(0.1, 0.8, graze));
          vec3 col = refl*k + uDeep*(1.0 - k);
          float f = uFogDensity*dist;
          gl_FragColor = vec4(mix(col, uFogColor, 1.0 - exp(-f*f)), 1.0);
        }`,
    },
  });
  const rt = mirror.getRenderTarget(); rt.texture.type = THREE.UnsignedByteType; rt.texture.colorSpace = THREE.SRGBColorSpace;   // an 8-bit target, set before the first frame
  mirror.rotation.x = -Math.PI / 2; mirror.position.set(260, 0, 624); mirror.name = 'lake';
  return { object: mirror, uniforms: mirror.material.uniforms };
}

// ------------------------------------------------------------------ the flooded terraces
// A flight of level paddies cut into the slope along its own contours (nine to twelve steps by the deal), the water lying from bank to bank, each bank a
// grass rib under 1.5 m wide; one mesh of
// banks, one mesh of still water. The water asks twSky / twStars / cometAt about the mirrored ray, and a baked
// skyline (the ground standing round the terraces, by compass bearing, set right for each point of water) says where
// the land, not the sky, stands in the mirror.
export function contourZ(G, x, y) { return SHORE_Z + 5 * Math.sin(x / 60 + 1.3) - (440 + (y - 122) * (160 / 13)) + G.bend(x); }

export function buildTerraces(G, rng, dn, B) {
  const K = Math.round(9 + 3 * dn), y0 = TERR.yw, dy = (TERR.y1 - y0) / K, STEP = 3, run = dy * 0.5;
  const waterP = [], waterI = [], waterB = [], tops = [], paddies = [];
  B.frame(0, 0, 0, 0);
  let mid = 6;                                                 // the flight wanders a little about the route as it climbs
  for (let k = 0; k <= K; k++) {
    const y = y0 + k * dy, last = k === K;
    const wL = rng.range(52, 92), wR = rng.range(52, 92), sh = rng.range(-7, 7), cuts = rng() < 0.55 ? 1 : 2, c1 = rng.range(0.2, 0.3), c2 = rng.range(0.45, 0.58), c3 = rng.range(0.7, 0.82);
    mid = Math.max(-4, Math.min(22, mid + sh * 0.4));
    const xa = mid - wL, xb = mid + wR, n = Math.max(8, Math.round((xb - xa) / STEP));
    const zf = (x) => contourZ(G, x, y - dy / 2), zb = (x) => contourZ(G, x, y + dy / 2);
    const cutsAt = cuts === 0 ? [] : cuts === 1 ? [c2] : [c1 + 0.08, c3 - 0.06];
    // the front bank: an earth face leaning back up from the paddy below, a flat grass top, a short wet face into its own water
    for (let i = 0; i < n; i++) {
      const xA = xa + (xb - xa) * i / n, xB = xa + (xb - xa) * (i + 1) / n, zA = zf(xA), zB = zf(xB), m = 0.9 + 0.14 * Math.sin(xA * 0.31 + k * 1.7), uo = [xA - xa, 0];
      const tint = [0.19 * m, 0.3 * m, 0.12 * m], fd = k === 0 ? 2.8 : 0.3, fz = k === 0 ? 1.6 : 0, f0 = [xA, y - dy - fd, zA + run + fz], f1 = [xB, y - dy - fd, zB + run + fz], t0 = [xA, y + 0.2, zA - 0.1], t1 = [xB, y + 0.2, zB - 0.1];
      const u0 = [xA, y + 0.2, zA - 0.5], u1 = [xB, y + 0.2, zB - 0.5], w0 = [xA, y - 0.25, zA - 0.7], w1 = [xB, y - 0.25, zB - 0.7];
      B.poly([f0, f1, t1, t0], 13, tint, uo); B.poly([t0, t1, u1, u0], 13, [0.21 * m, 0.2 * m, 0.115 * m], uo); if (!last) B.poly([u0, u1, w1, w0], 13, [tint[0] * 0.7, tint[1] * 0.7, tint[2] * 0.7], uo);
      tops.push([xA + 0.6, y + 0.2, zA - 0.3]);
    }
    if (last) break;
    // the still water of this row, cut into paddies by cross banks
    const edges = [0, ...cutsAt, 1].map((t) => xa + (xb - xa) * t);
    for (let e = 0; e < edges.length - 1; e++) {
      const pa = edges[e] + (e ? 0.35 : 0.8), pb = edges[e + 1] - (e === edges.length - 2 ? 0.8 : 0.35), m = Math.max(3, Math.round((pb - pa) / STEP)), i0 = waterP.length / 3;
      for (let i = 0; i <= m; i++) { const x = pa + (pb - pa) * i / m; waterP.push(x, y, zf(x) - 0.65, x, y, zb(x) + run + 0.05); waterB.push(zf(x) - zb(x) - run - 0.7, 0); }
      for (let i = 0; i < m; i++) { const a = i0 + i * 2; waterI.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      paddies.push({ x: (pa + pb) / 2, y, z: (zf((pa + pb) / 2) + zb((pa + pb) / 2)) / 2, w: pb - pa });
    }
    for (let e = 0; e < edges.length; e++) {                   // cross banks, and the two end banks down to the open slope
      const x = edges[e], end = e === 0 || e === edges.length - 1, hw = end ? 0.5 : 0.25;
      B.box(x - hw, end ? y - dy - 1.8 : y - 0.25, zb(x) + 0.2, x + hw, y + 0.2, zf(x) - 0.2, 13, [0.13, 0.19, 0.08]);
      if (!end) tops.push([x, y + 0.2, (zf(x) + zb(x)) / 2]);
    }
  }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(waterP, 3)); wg.setAttribute('aBack', new THREE.Float32BufferAttribute(waterB, 1)); wg.setIndex(waterI);
  return { wg, tops, paddies, K, dy };
}

// the rim: three small ponds on the crest's flat (uneven; the middle one lies where the ring's image falls), and the earthen path
// from the top terrace up to the ring (its lanterns are dealt by the world)
export const RIM = { ponds: [[-1, -949.5, 15, 6.5], [-19, -958, 9, 4.2], [16, -962, 8, 3.4]], lane: [[3, -902], [5.5, -914], [3.5, -927], [6, -937], [7.8, -946], [8.2, -957.5]] };
export const inPond = (x, z, m = 0) => RIM.ponds.some(([px, pz, w, d]) => { const a = (x - px) / (w / 2 + m), b = (z - pz) / (d + m); return a * a + b * b < 1; });
// each pond a flat uneven oval in the crest's turf with a low grassy bank all round (the paddies' own sheet and attributes)
export function buildRimPonds(heightAt, B, spots) {
  const P = [], I = [], A = [], tops = [], N = 10, turf = [0.16, 0.26, 0.1];
  B.frame(0, 0, 0, 0);
  for (const [x, z, w, dp] of spots) {
    const y = heightAt(x, z) + 0.1, i0 = P.length / 3, col = [];
    for (let i = 0; i <= N; i++) {
      const t = -1 + (2 * i) / N, xi = x + (t * w) / 2, h = dp * Math.sqrt(Math.max(0.02, 1 - t * t)) * (1 + 0.18 * Math.sin(i * 1.9 + x));
      col.push([xi, z - h, z + h * 0.85]); P.push(xi, y, z - h, xi, y, z + h * 0.85); A.push(0, h * 1.85);
    }
    for (let i = 0; i < N; i++) {
      const a = i0 + i * 2, p = col[i], q = col[i + 1];
      I.push(a, a + 1, a + 3, a, a + 3, a + 2);
      for (const [k, s] of [[1, -1], [2, 1]]) B.poly([[p[0], y + 0.12, p[k] - s * 0.1], [p[0], heightAt(p[0], p[k] + s * 1.2) - 0.05, p[k] + s * 1.2], [q[0], heightAt(q[0], q[k] + s * 1.2) - 0.05, q[k] + s * 1.2], [q[0], y + 0.12, q[k] - s * 0.1]], 13, turf);
    }
    for (const i of [2, 5, 8]) tops.push([col[i][0], y + 0.24, col[i][2] - 0.4]);
  }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); wg.setAttribute('aBack', new THREE.Float32BufferAttribute(A, 1)); wg.setIndex(I);
  return { wg, tops };
}

// THE LEAT: a narrow stone-walled channel of still water led along the slope's contour between two of the town's lanes (the paddies'
// own sheet and attributes, so it holds the same sky); the lane the route follows crosses it by three stone slabs laid side by side,
// with a sloping stone apron at each end (no treads). leat: [x, z, length, width] of its middle, where the lane crosses
export function buildLeat(heightAt, B, leat) {
  const [x0, z0, len, wd] = leat, N = 12, P = [], I = [], A = [], stone = [0.5, 0.5, 0.4];
  const zf = (x) => z0 + 5 * (Math.sin(x / 60 + 1.3) - Math.sin(x0 / 60 + 1.3)), xa = (i) => x0 - len / 2 + (len * i) / N, y0 = heightAt(x0, z0);
  // each station lies on the ground's own contour through the lane's crossing (sought within 4 m of the slope's general line), so the water lies along the hill
  const zs = [];
  for (let i = 0; i <= N; i++) { const x = xa(i), c = zf(x); let a = c - 4, b = c + 4;
    if (heightAt(x, a) > y0 && heightAt(x, b) < y0) { for (let k = 0; k < 12; k++) { const m = (a + b) / 2; if (heightAt(x, m) > y0) a = m; else b = m; } zs.push((a + b) / 2); } else zs.push(heightAt(x, a) <= y0 ? a : b); }
  const zc = (x) => { const t = Math.min(N - 1e-6, Math.max(0, ((x - x0 + len / 2) / len) * N)), i = Math.floor(t); return zs[i] + (zs[i + 1] - zs[i]) * (t - i); };
  let y = -1e9; for (let i = 0; i <= N; i++) y = Math.max(y, heightAt(xa(i), zc(xa(i)) - wd / 2 - 0.4));
  y += 0.16;                                                           // the water stands just over the highest ground along its uphill wall
  B.frame(0, 0, 0, 0);
  for (let i = 0; i <= N; i++) { const x = xa(i), z = zc(x); P.push(x, y, z - wd / 2, x, y, z + wd / 2); A.push(0, wd); }
  for (let i = 0; i < N; i++) {
    const a = i * 2, xl = xa(i), xr = xa(i + 1), zl = zc(xl), zr = zc(xr);
    I.push(a, a + 1, a + 3, a, a + 3, a + 2);
    for (const s of [-1, 1]) {                                          // the two walls: coursed stone, 0.4 m thick, a hand above the water
      const e0 = s * wd / 2, e1 = s * (wd / 2 + 0.4), gl = heightAt(xl, zl + e1) - 0.4, gr = heightAt(xr, zr + e1) - 0.4;
      B.poly([[xl, y + 0.22, zl + e0], [xr, y + 0.22, zr + e0], [xr, y + 0.22, zr + e1], [xl, y + 0.22, zl + e1]], 4, stone, [xl, 0]);
      B.poly([[xl, gl, zl + e1], [xr, gr, zr + e1], [xr, y + 0.22, zr + e1], [xl, y + 0.22, zl + e1]], 4, stone, [xl, 0]);
      B.poly([[xl, y - 0.3, zl + e0], [xr, y - 0.3, zr + e0], [xr, y + 0.22, zr + e0], [xl, y + 0.22, zl + e0]], 4, stone, [xl, 0]);
    }
  }
  for (const xe of [xa(0), xa(N)]) { const z = zc(xe), g = heightAt(xe, z + wd / 2 + 0.4) - 0.4; B.poly([[xe, g, z - wd / 2 - 0.4], [xe, g, z + wd / 2 + 0.4], [xe, y + 0.22, z + wd / 2 + 0.4], [xe, y + 0.22, z - wd / 2 - 0.4]], 4, stone); }
  const zb = zc(x0), top = y + 0.5, hw = 2.13;                         // the bridge: three slabs, a little uneven
  for (let k = 0; k < 3; k++) { const h = top + 0.04 * ((k * 2) % 3 - 1), xs = x0 + (k - 1) * 1.45; B.box(xs - 0.68, h - 0.3, zb - wd / 2 - 0.75, xs + 0.68, h, zb + wd / 2 + 0.75, 4, [0.55, 0.55, 0.45 + 0.1 * k], 4, true); }
  for (const s of [-1, 1]) {
    const z1 = zb + s * (wd / 2 + 0.75), z2 = z1 + s * (s > 0 ? 4.6 : 1.8), ga = heightAt(x0 - hw, z2), gb = heightAt(x0 + hw, z2);
    B.poly([[x0 - hw, top - 0.04, z1], [x0 + hw, top - 0.04, z1], [x0 + hw, gb + 0.14, z2], [x0 - hw, ga + 0.14, z2]], 5, [0.5, 0.5, 0.5]);
    for (const e of [-1, 1]) B.poly([[x0 + e * hw, top - 0.04, z1], [x0 + e * hw, (e < 0 ? ga : gb) + 0.14, z2], [x0 + e * hw, (e < 0 ? ga : gb) - 0.4, z2], [x0 + e * hw, y - 0.4, z1]], 4, stone);
  }
  B.skin(x0, top, zb, 2.6, 'bridge');
  // where irises grow and fireflies hang: seven places along its downhill wall, three plants at each (none at the bridge)
  const tops = []; for (const i of [0, 1, 3, 4, 8, 10, 12]) for (let k = 0; k < 3; k++) { const x = xa(i) + (k - 1) * 0.55 + 0.3 * Math.sin(i * 2.3), z = zc(x) + wd / 2 + 0.75 + 0.2 * k; tops.push([x, heightAt(x, z) + 0.08, z]); }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); wg.setAttribute('aBack', new THREE.Float32BufferAttribute(A, 1)); wg.setIndex(I);
  return { wg, y, z: zb, tops };
}

// the skyline round the terraces, by bearing: tan of its height over P0 and its distance, each in two bytes of a
// plain 8-bit RGBA texture (256 bearings; the packing is linear, so the texture's linear filtering stays exact)
export async function bakeSkyline(G, P0, yieldFn, lift, far) {
  const N = 256, data = new Uint8Array(N * 4);
  for (let i = 0; i < N; i++) {
    const az = (i / N) * Math.PI * 2, sx = Math.sin(az), sz = -Math.cos(az); let best = -1, bd = 2600;
    for (let t = 6; t < 2600; t = t * 1.07 + 2.5) { const x = P0.x + sx * t, z = P0.z + sz * t, h = G.heightAt(x, z), k = (h + (lift ? lift(x, z, h) : 0) - P0.y) / t; if (k > best) { best = k; bd = t; } }   // (lift: the height of the woods standing there)
    if (far && best < far[0]) { best = far[0]; bd = far[1]; }     // the far ranges stand at least this high all round
    const a = Math.round(((Math.max(-1, Math.min(4, best)) + 1) / 5) * 65535), b = Math.round((Math.min(2600, bd) / 2600) * 65535);
    data[i * 4] = a >> 8; data[i * 4 + 1] = a & 255; data[i * 4 + 2] = b >> 8; data[i * 4 + 3] = b & 255;
    if (i % 24 === 23 && yieldFn) await yieldFn();
  }
  const tex = new THREE.DataTexture(data, N, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = THREE.RepeatWrapping; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.needsUpdate = true;
  return tex;
}

export function makePaddyWater(wg, U, fog, skyline, P0, opts = {}) {
  const uniforms = { ...U, tSkyline: { value: skyline }, uP0: { value: new THREE.Vector3(P0.x, P0.y, P0.z) }, uLand: { value: new THREE.Color(opts.land ?? '#0c1a1c') },
    uFogColor: { value: fog.color }, uFogDensity: { value: fog.density }, uDim: { value: 0.9 },
    uRise: { value: opts.rise ?? 3.4 }, uRing: { value: new THREE.Vector4(...(opts.ring ?? [0, -999, 0, 1])) }, uRingCol: { value: new THREE.Color(opts.ringColor ?? '#f2dca4') }, uBank: { value: new THREE.Color(opts.bank ?? '#2c3a1c') },
    uGust: { value: opts.gust ?? new THREE.Vector4(1.6, 0.9, 0.045, 2.6) } };   // the wind over the water (drift in m/s, grain, ripple rate)
  const material = new THREE.ShaderMaterial({
    name: 'LakeTownPaddy', uniforms, fog: false,
    vertexShader: /* glsl */`attribute float aBack; varying vec3 vW; varying float vBack; void main() { vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz; vBack = aBack; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform sampler2D tSkyline; uniform vec3 uP0, uLand, uFogColor, uBank; uniform float uFogDensity, uDim, uRise; uniform vec4 uRing, uGust; uniform vec3 uRingCol;
      varying vec3 vW; varying float vBack;
      ${SKY_GLSL}
      ${COMET_GLSL}
      ${STORM_GLSL}
      void main() {
        vec3 E = vW - cameraPosition; float dist = length(E);
        vec3 V = E/max(dist, 1e-3);
        vec3 R = normalize(vec3(V.x, abs(V.y) + 1e-4, V.z));                 // the mirrored ray
        vec2 gp = (vW.xz - uGust.xy*uTime)*uGust.z;                           // cat's-paws of wind cross the water: where one passes the sheet shivers
        float gust = smoothstep(0.28, 0.6, cmN(gp.x)*cmN(gp.y + 17.0));        // and holds a wider piece of sky
        R = normalize(R + vec3(sin(vW.x*7.0 + uTime*uGust.w), 0.0, sin(vW.z*9.0 - uTime*uGust.w*0.83))*0.012*gust);
        float pxr = length(fwidth(R));
        vec3 sky = twSky(R) + vec3(0.86, 0.92, 1.0)*twStars(R, pxr)*uStarGain + cometAt(R, pxr*57.2958) + cmStormAt(R, pxr*57.2958);   // the twilight, the stars, the comet, and every meteor of the storm
        sky = mix(sky, twSky(normalize(vec3(R.x, R.y + 0.16, R.z))), 0.5*gust);
        float lr = max(length(R.xz), 1e-3), az = atan(R.x, abs(R.z) < 1e-5 ? -1e-5 : -R.z);
        vec4 s8 = texture2D(tSkyline, vec2(az/6.2831853, 0.5));
        vec2 sk = vec2((s8.r*65280.0 + s8.g*255.0)/65535.0*5.0 - 1.0, (s8.b*65280.0 + s8.a*255.0)/65535.0*2600.0);   // tan of the skyline's height, its distance
        vec3 S = uP0 + sk.y*vec3(sin(az), sk.x, -cos(az)) - vW;               // the skyline's own place, seen from this water
        float land = smoothstep(-0.004, 0.004, S.y/max(length(S.xz), 1.0) - R.y/lr);
        float fl = uFogDensity*sk.y;
        vec3 col = mix(sky, mix(uLand, uFogColor, 1.0 - exp(-fl*fl)), land);
        float tz = (uRing.z - vW.z)/min(R.z, -1e-3);                          // the ring on the rim stands in the water too: its glowing rim, at its true mirrored place
        vec2 rq = (vW + R*tz).xy - uRing.xy; float rd2 = dot(rq, rq)/(uRing.w*uRing.w);
        col = mix(col, uRingCol*1.05, (1.0 - smoothstep(0.94, 1.08, rd2))*smoothstep(0.56, 0.72, rd2)*step(R.z, -1e-3));
        float toBack = max(vBack, 0.0)/max(-R.z/lr, 0.02);                    // the bank behind this paddy stands in it too
        float hb = R.y/lr*toBack;                                             // how high on that bank the mirrored ray lands
        vec3 bankC = uBank*mix(0.45, 1.2, smoothstep(0.0, uRise, hb));
        col = mix(col, bankC, (1.0 - smoothstep(-0.12, 0.12, hb - uRise))*step(R.z, 0.0))*uDim*mix(0.86, 1.0, smoothstep(0.55, 0.95, 1.0 - abs(V.y)));
        float f = uFogDensity*dist;
        gl_FragColor = vec4(mix(col, uFogColor, 1.0 - exp(-f*f)), 1.0);
      }` });
  const mesh = new THREE.Mesh(wg, material); mesh.name = 'paddies';
  return { object: mesh, uniforms };
}
