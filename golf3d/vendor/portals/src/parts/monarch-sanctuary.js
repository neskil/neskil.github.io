// THE GREAT BOUGH TREE: hero set piece for "monarch-sanctuary" (The Orange Awakening).
//
// A 42-47 m oyamel fir so laden with roosting monarchs that every limb sags about 35 degrees like
// wet thatch. Dormant, the whole tree is bark-brown: about 2,600 hanging shingle cards of closed
// wings plus a shader "coat" of closed wings over every frond, limb and the trunk. When the event
// runs, a sun shaft travels down the tree from crown to base at 7.5 m/s; along its ragged leading
// edge each wing cell flips to blazing orange, holds about half a second and peels away, ~22,000
// real two-triangle butterflies lift out of exactly those places, spiral out, fill the air round
// the tree and then gather into a river that runs away along +Z (downhill). Each unloaded limb
// springs up from 35 to about 10 degrees of droop on a damped 1.2 Hz spring and sheds needles.
//
// ORIENTATION  origin = centre of the trunk at ground level, +Y up, +Z = downhill / the gully /
//              the way the river of butterflies leaves. The trunk continues 4 m below y = 0 so it
//              can be planted on a 25 degree slope.
// SIZE         radius about 14 m (limb tips), height 42-47 m (hero.height). The released cloud
//              reaches about 30 m from the trunk; the river follows opts.riverPoints.
// COST         about 125k triangles (tree 68k, flyers 52k, needles 3.6k), 4 draw calls (tree,
//              flyers, needles, shaft), ~140 ms build, no lights of its own.
//
// DRIVING IT   Everything about the ignition is a pure function of one "event clock" te (seconds):
//                te <= 0   dormant, te 0..~7 the light sweeps crown -> base, te ~7..16 the cloud
//                gathers into the river and drains away down it.
//              hero.setProgress(u)     u 0..1 maps to te = u * hero.eventSeconds (16 s)
//              hero.setEventTime(sec)  the same in seconds (brief: te = journeySeconds - 17)
//              Until one of these is called the piece plays a looping demo from wall time (for
//              the part viewer). Call setProgress every frame from the world's u. Ambient motion
//              (wing flaps, shivers, wind sway) uses the time passed to update().
//              hero.frontY() returns the current local height of the light's leading edge so a
//              camera POI can tilt down with it.
//
// OPTS         palette      7 hex strings, brief order [mist, sky, fir, bark, closed wing, sun, orange]
//              sunDir       [x,y,z] direction TOWARD the sun, local space (default [-0.6,0.7,0.4])
//              riverPoints  8 local-space [x,y,z] points (resampled if another count) the river
//                           follows after leaving the tree; default is a level line down +Z, 220 m
//              slope        radians of ground fall toward +Z (keeps flyers/needles above the hill)
//              shaft        false to leave out the visible light-shaft mesh (the tree is still lit)
//              flyers       number of butterflies (default 26000)
//              fill         self-supplied cold ambient on the tree, 0..1 (default 0.5); lower it if the
//                           world's own ambient is already strong
//              afterLight   0..1 how much shaft light stays on the tree after the front passed (0.6)
//              shaftGain    brightness of the visible shaft (0.2); burst: how much larger the flyers are drawn while
//                           they pour out of the tree (0.6). hero.shaftFoot = live (local x, local z, strength) of
//                           the shaft's footprint on the ground, for a pool of light there.
//
// ANCHORS (local space; positions are THREE.Vector3)
//   crown          top of the leader
//   revealHold     where the camera should hang for the reveal (30 m back, 7 m up, uphill-left)
//   revealLook     what to look at from there (move it down with hero.frontY())
//   flyThrough     ordered points of a safe line (>= 6 m from any limb, sagging or sprung) from
//                  revealHold round the tree's -X side and into the river axis going downhill
//   riverMouth     where the river forms, riverDir its direction there
//   riverPoints    the 8 river points in use
//   portalSeat     { position, facing }: end of the river; the 14 m portal the river pours through
//                  belongs here (facing looks back up the river). Supply riverPoints to move it.
//   sunDir         unit vector toward the sun used by the shaft
//   limbTips       a few sagging limb tips for close passes or perched extras
//
// THE FOREST   liteFirGeometry(ctx, { rng, lod: 1|2|3, height, limbMax, palette }) builds lighter firs of the same
//              make (3.8k / 1.5k / 0.6k triangles). Draw them as InstancedMesh with hero.makeMaterial() and an
//              instanced attribute aInst = (clock offset s, coat multiplier, pattern offset): each instance runs
//              the same flip / peel / limb-spring on uTe - offset (1e5 = never). hero.flyers is the flyer mesh,
//              hero.palette the palette in use, hero.yTop the height the light front starts from.
//
// LIGHTING     The tree is a MeshStandardMaterial (patched), so it takes the scene's lights and fog.
//              It wants flat cold ambient (hemisphere about #C9D3D0, no strong directional) so it
//              reads grey-brown before ignition; the warm key is supplied by the piece itself as
//              an emissive "shaft" term, and open wings are emissive 2-3 so they bloom.
//              The flyers/needles/shaft are ShaderMaterials (linear HDR, scene fog supported);
//              flyers take their shade light from opts.palette[0].
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#C9D3D0', '#8FA6B8', '#24382F', '#4A4038', '#8C7A66', '#FFF1D0', '#F2811D'];
const EVENT_SECONDS = 16;
const SPEED = 7.5;          // m/s the light front travels down the tree
const SUN_SLOPE = 0.45;     // how much the front leans with the sun's azimuth

// GLSL shared by every material: hash/noise, the travelling light front and the flip clock.
const GLSL_COMMON = /* glsl */`
uniform float uTe, uTime, uY0, uSpeed, uAfter;
uniform vec3 uSunH;      // xy = sun azimuth (x,z), z = lean
float hHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float hNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hHash(i), hHash(i+vec2(1.,0.)), f.x), mix(hHash(i+vec2(0.,1.)), hHash(i+vec2(1.,1.)), f.x), f.y); }
float hEff(vec3 p){ return p.y - uSunH.z * dot(p.xz, uSunH.xy); }
// event time at which the light front reaches p (ragged)
float flipBase(vec3 p){ return (uY0 - hEff(p)) / uSpeed + 0.45*hNoise(p.xz*0.33 + p.y*0.09) + 0.18*hNoise(p.xz*1.9 + 3.1); }
// 0 in shade, 1 inside the shaft, uAfter once it has passed
float shaftLit(vec3 p, float te){ float d = hEff(p) - (uY0 - uSpeed*te);
  return smoothstep(-2.5, 0.5, d) * mix(1.0, uAfter, smoothstep(11.0, 17.0, d)); }
`;

// ---------------------------------------------------------------------------------------------
// growable merged-geometry builder with the per-vertex data the tree shader needs
function makeBuilder(maxV, maxI) {
  const B = {
    pos: new Float32Array(maxV * 3), nor: new Float32Array(maxV * 3), uv: new Float32Array(maxV * 2),
    col: new Float32Array(maxV * 3), piv: new Float32Array(maxV * 4), inf: new Float32Array(maxV * 4),
    dim: new Float32Array(maxV * 2), idx: new Uint32Array(maxI), nv: 0, ni: 0,
    // current state
    c: [1, 1, 1], pv: [0, 0, 0, 0], kind: 0, rand: 0, coat: 0, d: [1, 1],
    v(x, y, z, nx, ny, nz, u, v, w = 0, cm = 1) {
      const i = B.nv++; if (i >= maxV) throw new Error('monarch-sanctuary: vertex budget');
      B.pos[i * 3] = x; B.pos[i * 3 + 1] = y; B.pos[i * 3 + 2] = z;
      B.nor[i * 3] = nx; B.nor[i * 3 + 1] = ny; B.nor[i * 3 + 2] = nz;
      B.uv[i * 2] = u; B.uv[i * 2 + 1] = v;
      B.col[i * 3] = B.c[0] * cm; B.col[i * 3 + 1] = B.c[1] * cm; B.col[i * 3 + 2] = B.c[2] * cm;
      B.piv[i * 4] = B.pv[0]; B.piv[i * 4 + 1] = B.pv[1]; B.piv[i * 4 + 2] = B.pv[2]; B.piv[i * 4 + 3] = B.pv[3];
      B.inf[i * 4] = B.kind; B.inf[i * 4 + 1] = w; B.inf[i * 4 + 2] = B.rand; B.inf[i * 4 + 3] = B.coat;
      B.dim[i * 2] = B.d[0]; B.dim[i * 2 + 1] = B.d[1];
      return i;
    },
    tri(a, b, c) { if (B.ni + 3 > maxI) throw new Error('monarch-sanctuary: index budget'); B.idx[B.ni++] = a; B.idx[B.ni++] = b; B.idx[B.ni++] = c; },
    quad(a, b, c, d) { B.tri(a, b, c); B.tri(a, c, d); },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(B.pos.slice(0, B.nv * 3), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(B.nor.slice(0, B.nv * 3), 3));
      g.setAttribute('uv', new THREE.BufferAttribute(B.uv.slice(0, B.nv * 2), 2));
      g.setAttribute('color', new THREE.BufferAttribute(B.col.slice(0, B.nv * 3), 3));
      g.setAttribute('aPivot', new THREE.BufferAttribute(B.piv.slice(0, B.nv * 4), 4));
      g.setAttribute('aInfo', new THREE.BufferAttribute(B.inf.slice(0, B.nv * 4), 4));
      g.setAttribute('aDim', new THREE.BufferAttribute(B.dim.slice(0, B.nv * 2), 2));
      g.setIndex(new THREE.BufferAttribute(B.idx.slice(0, B.ni), 1));
      return g;
    },
  };
  return B;
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();

// A tapered tube along a list of points (bark). rad(t) gives the radius at t = 0..1.
function addTube(B, pts, rad, sides, uvLen) {
  const n = pts.length, ring = [];
  const circ = Math.PI * 2 * rad(0);
  B.d = [circ, uvLen];
  for (let i = 0; i < n; i++) {
    const p = pts[i], t = i / (n - 1);
    _a.copy(pts[Math.min(i + 1, n - 1)]).sub(pts[Math.max(i - 1, 0)]).normalize();
    _b.set(0, 1, 0); if (Math.abs(_a.y) > 0.92) _b.set(1, 0, 0);
    _c.crossVectors(_a, _b).normalize(); _d.crossVectors(_c, _a).normalize();
    const r = rad(t), row = [];
    for (let s = 0; s <= sides; s++) {
      const a = (s / sides) * Math.PI * 2, cx = Math.cos(a), sx = Math.sin(a);
      const nx = _c.x * cx + _d.x * sx, ny = _c.y * cx + _d.y * sx, nz = _c.z * cx + _d.z * sx;
      const w = B.wFn ? B.wFn(p) : 0;
      row.push(B.v(p.x + nx * r, p.y + ny * r, p.z + nz * r, nx, ny, nz, s / sides, t, w, 0.85 + 0.3 * ((s * 7 + i * 3) % 5) / 5));
    }
    ring.push(row);
  }
  for (let i = 0; i < n - 1; i++) for (let s = 0; s < sides; s++) B.quad(ring[i][s], ring[i][s + 1], ring[i + 1][s + 1], ring[i + 1][s]);
}

// The axis of a sagging limb or branchlet: starts at o heading (az, pitch0) and droops to pitchEnd.
function limbAxis(o, az, pitch0, pitchEnd, len, segs, curl, rng) {
  const pts = [o.clone()], dx = Math.sin(az), dz = Math.cos(az);
  let p = o.clone(), yaw = 0;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const pitch = lerp(pitch0, pitchEnd, Math.pow(t, 0.75)) - curl * t * t;
    yaw += (rng() - 0.5) * 0.09;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), hx = dx * cy + dz * sy, hz = dz * cy - dx * sy;
    const st = len / segs, cp = Math.cos(pitch);
    p = new THREE.Vector3(p.x + hx * cp * st, p.y + Math.sin(pitch) * st, p.z + hz * cp * st);
    pts.push(p);
  }
  return pts;
}

// A fir frond: a ribbon along an axis with an inverted-V cross-section; the fragment shader cuts
// it into branchlets and needles. halfW(t) is the half width in metres.
function addFrond(B, pts, halfW, across, len, sagSide, roll = 0) {
  const n = pts.length, rows = [], cr = Math.cos(roll), sr = Math.sin(roll);
  for (let i = 0; i < n; i++) {
    const p = pts[i], t = i / (n - 1);
    _a.copy(pts[Math.min(i + 1, n - 1)]).sub(pts[Math.max(i - 1, 0)]).normalize();
    _c.set(_a.z, 0, -_a.x); if (_c.lengthSq() < 1e-4) _c.set(1, 0, 0); _c.normalize();   // sideways, level
    _d.crossVectors(_c, _a).normalize(); if (_d.y < 0) _d.negate();                         // up-ish normal
    if (roll) {                                                                             // a spray turned about its own axis
      const cx = _c.x * cr + _d.x * sr, cy = _c.y * cr + _d.y * sr, cz = _c.z * cr + _d.z * sr;
      _d.set(_d.x * cr - _c.x * sr, _d.y * cr - _c.y * sr, _d.z * cr - _c.z * sr); _c.set(cx, cy, cz);
    }
    const hw = halfW(t), row = [], w = B.wFn ? B.wFn(p) : 0;
    B.d = [len, hw];                                                                        // uv.y * aDim.y = true metres off the rachis
    for (let k = -across; k <= across; k++) {
      const v = k / across, av = Math.abs(v);
      const drop = -Math.pow(av, 1.4) * hw * sagSide, fwd = av * hw * 0.25;
      const x = p.x + _c.x * v * hw + _a.x * fwd, y = p.y + _c.y * v * hw + drop + _a.y * fwd, z = p.z + _c.z * v * hw + _a.z * fwd;
      // normal leans outward on the drooping sides
      const lx = _d.x + _c.x * v * 0.7 * sagSide, ly = _d.y, lz = _d.z + _c.z * v * 0.7 * sagSide, il = 1 / Math.hypot(lx, ly, lz);
      row.push(B.v(x, y, z, lx * il, ly * il, lz * il, t, v, w, 0.8 + 0.35 * t));
    }
    rows.push(row);
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < across * 2; k++) B.quad(rows[i][k], rows[i][k + 1], rows[i + 1][k + 1], rows[i + 1][k]);
}

// A hanging shingle card of closed wings: top edge centred on p along direction t (unit), hanging
// h metres, bellying out along side normal sn.
function addCard(B, p, tx, ty, tz, snx, snz, w, h, belly, wgt, rows = 4) {
  B.d = [w, h];
  let prevL = -1, prevR = -1;
  for (let r = 0; r <= rows; r++) {
    const k = r / rows, off = belly * Math.sin(k * Math.PI * 0.85) + belly * 0.4 * k;
    const sway = 1 - 0.25 * k;                                     // card narrows a little toward the tip
    const cx = p.x + snx * off, cy = p.y - h * k + ty * 0 - 0.04, cz = p.z + snz * off;
    const hx = tx * w * 0.5 * sway, hy = ty * w * 0.5 * sway * (1 - k), hz = tz * w * 0.5 * sway;
    const ny = 0.25 - 0.5 * k, il = 1 / Math.hypot(snx, ny, snz);
    const l = B.v(cx - hx, cy - hy, cz - hz, snx * il, ny * il, snz * il, 0, k, wgt, 1 - 0.3 * k);
    const rr = B.v(cx + hx, cy + hy, cz + hz, snx * il, ny * il, snz * il, 1, k, wgt, 1 - 0.3 * k);
    if (r > 0) B.quad(prevL, prevR, rr, l);
    prevL = l; prevR = rr;
  }
}

// ---------------------------------------------------------------------------------------------
// The tree: trunk, dead snags, tiers of sagging limbs with fronds, and the hanging cards.
function* buildTreeGen(ctx, P, pal) {      // a generator: it hands back between whorls so the build never holds a frame long
  const rng = ctx.rng.fork('great-bough'), noise = ctx.noise;
  yield;
  const B = makeBuilder(210000, 660000);
  yield;
  const H = P.height, DEPTH = 4;
  const bark = new THREE.Color(pal[3]), fir = new THREE.Color(pal[2]), wing = new THREE.Color(pal[4]);
  const moss = fir.clone().lerp(new THREE.Color('#6f7f52'), 0.55);
  const leanAz = rng.range(0, Math.PI * 2), lean = rng.range(0.4, 1.6), kink = rng.range(-0.5, 0.5);
  const trunkAt = (y, out) => {
    const t = clamp(y / H, 0, 1), o = lean * t * t + kink * Math.sin(t * 5.0) * 0.25 * t;
    return out.set(Math.sin(leanAz) * o, y, Math.cos(leanAz) * o);
  };
  const lobes = rng.int(4, 6), lobePh = rng.range(0, 6.28), rBase = P.trunkRadius;
  const trunkR = (y) => rBase * Math.pow(clamp(1 - y / (H + 0.4), 0.004, 1.2), 0.82) + 0.02;

  // ---- trunk ----
  B.kind = 0; B.pv = [0, 0, 0, 0]; B.rand = rng(); B.wFn = null;
  const SIDES = 16, RINGS = 40, rings = [], cen = new THREE.Vector3();
  B.d = [Math.PI * 2 * rBase, H + DEPTH];
  for (let i = 0; i <= RINGS; i++) {
    const k = i / RINGS, y = -DEPTH + (H + DEPTH) * Math.pow(k, 1.5);
    trunkAt(y, cen);
    const r0 = trunkR(Math.max(y, 0)), row = [];
    B.coat = y > 4.5 && y < H * 0.93 ? 0.82 : (y > 2.5 ? 0.35 : 0);
    for (let s = 0; s <= SIDES; s++) {
      const a = (s % SIDES) / SIDES * Math.PI * 2;
      const flare = Math.exp(-Math.max(y + 0.6, 0) / 1.5) * (0.35 + 0.9 * Math.pow(0.5 + 0.5 * Math.cos(lobes * a + lobePh), 2.0));
      const fur = 0.05 * noise.n3(Math.cos(a) * 2.2, y * 0.35, Math.sin(a) * 2.2) + 0.03 * noise.n2(a * 9.0, y * 0.8);
      const r = r0 * (1 + flare * 1.25 + fur * (0.4 + 2.0 * r0 / rBase * 0.5));
      const nx = Math.cos(a), nz = Math.sin(a);
      const m = clamp(0.5 + 0.5 * Math.cos(a - 1.2) * 1.4, 0, 1) * smoothstep(9, 0.5, y) * (0.55 + 0.45 * noise.n2(a * 3, y * 0.6));
      const lich = smoothstep(0.35, 0.75, noise.n3(nx * 3 + 9, y * 0.22, nz * 3)) * 0.35;
      const c = bark.clone().multiplyScalar(1.7).lerp(moss, clamp(m, 0, 0.85)).lerp(new THREE.Color(pal[0]), lich * 0.5);
      B.c = [c.r, c.g, c.b];
      row.push(B.v(cen.x + nx * r, y, cen.z + nz * r, nx, flare * 0.4, nz, s / SIDES, k, 0, 0.85 + 0.3 * noise.n2(a * 5 + 3, y * 1.3)));
    }
    rings.push(row);
  }
  for (let i = 0; i < RINGS; i++) for (let s = 0; s < SIDES; s++) B.quad(rings[i][s], rings[i + 1][s], rings[i + 1][s + 1], rings[i][s + 1]);

  yield;
  const sources = [], needleSrc = [], limbTips = [];
  const o = new THREE.Vector3(), q = new THREE.Vector3();
  let cards = 0; const MAX_CARDS = 8400;
  const barkC = (m) => { B.c = [bark.r * m * 1.7, bark.g * m * 1.7, bark.b * m * 1.7]; };
  const firC = () => { const m = rng.range(0.75, 1.25), g = rng.range(-0.012, 0.02); B.c = [fir.r * m, (fir.g + g) * m, (fir.b + g * 0.5) * m]; };
  const wingC = () => { const m = rng.range(0.6, 1.1); B.c = [wing.r * m, wing.g * m * rng.range(0.92, 1.02), wing.b * m * rng.range(0.85, 1.0)]; };

  // ---- dead snags low on the trunk ----
  const nSnag = rng.int(6, 11);
  for (let i = 0; i < nSnag; i++) {
    const y = rng.range(2.6, P.yLow - 0.3), az = rng.range(0, 6.28), L = rng.range(0.5, 2.6);
    trunkAt(y, cen); o.set(cen.x + Math.sin(az) * trunkR(y) * 0.7, y, cen.z + Math.cos(az) * trunkR(y) * 0.7);
    B.kind = 0; B.coat = 0; B.rand = rng(); B.pv = [0, 0, 0, 0]; B.wFn = null; barkC(rng.range(0.7, 1.1));
    const pts = limbAxis(o, az, rng.range(-0.1, 0.3), rng.range(-0.5, 0.1), L, 4, 0, rng);
    addTube(B, pts, (t) => lerp(0.05 + 0.03 * L, 0.012, t), 4, L);
  }

  yield;
  // ---- whorls of sagging limbs ----
  const asymAz = rng.range(0, 6.28), asym = rng.range(0.05, 0.3);
  let y = P.yLow, whorl = 0, azOff = rng.range(0, 6.28), nLimbs = 0;
  while (y < H - 1.3) {
    const t = clamp((y - P.yLow) / (H - P.yLow), 0, 1);
    const count = t > 0.92 ? 4 : rng.int(5, 6);
    azOff += 0.9 + rng.range(-0.2, 0.2);
    for (let j = 0; j < count; j++) {
      if (t < 0.9 && rng.chance(0.06)) continue;                                   // a gap in the whorl
      const az = azOff + (j / count) * Math.PI * 2 + rng.range(-0.22, 0.22);
      let L = lerp(P.limbMax, 0.9, Math.pow(t, 0.9)) * rng.range(0.78, 1.12) * (1 - asym * Math.max(0, Math.cos(az - asymAz)));
      if (t < 0.5 && rng.chance(0.07)) L *= 0.55;                                    // a broken one
      L *= 1 + 0.15 * (1 - smoothstep(0.05, 0.4, t));                                 // the lowest limbs reach furthest: a heavy bell
      const yy = y + rng.range(-0.3, 0.3);
      trunkAt(yy, cen); const tr = trunkR(yy);
      o.set(cen.x + Math.sin(az) * tr * 0.6, yy, cen.z + Math.cos(az) * tr * 0.6);
      const up = smoothstep(0.8, 1.0, t);
      const pitch0 = lerp(0.12, 0.55, t) + rng.range(-0.08, 0.08), pitchEnd = lerp(-rng.range(0.68, 0.9), -0.25, up);
      const segs = L > 4 ? 10 : (L > 2 ? 7 : 5);
      const axis = limbAxis(o, az, pitch0, pitchEnd, L, segs, lerp(0.16, 0.0, up), rng);
      const ox = o.x, oy = o.y, oz = o.z;
      B.pv = [ox, oy, oz, az]; B.rand = rng();
      B.wFn = (p) => 0.55 + 0.45 * clamp(Math.hypot(p.x - ox, p.z - oz) / (L * 0.8), 0, 1);
      // branch wood
      B.kind = 0; B.coat = 0.9; barkC(rng.range(0.75, 1.05));
      const woodN = Math.max(3, Math.round(segs * 0.8));
      addTube(B, axis.slice(0, woodN + 1), (k) => lerp(0.045 + 0.016 * L, 0.02, k), 4, L * 0.8);
      // main frond
      B.kind = 1; B.coat = 0.92; firC();
      const Wm = L * rng.range(0.035, 0.05) + 0.3;
      addFrond(B, axis, (k) => Wm * Math.pow(Math.sin(Math.PI * (0.1 + 0.9 * k)), 0.6) + 0.02, 2, L, 1);
      limbTips.push(axis[segs].clone()); nLimbs++;
      // hanging cards along the main axis
      const axisAt = (s, out) => { const f = clamp(s, 0, 0.9999) * segs, i = Math.floor(f); return out.lerpVectors(axis[i], axis[i + 1], f - i); };
      const cardRun = (pts, n, len, s0, step, hMul, rows = 4) => {
        for (let s = s0; s < len; s += step * rng.range(0.8, 1.2)) {
          if (cards >= MAX_CARDS) return;
          const f = clamp(s / len, 0, 0.999) * n, i = Math.floor(f);
          q.lerpVectors(pts[i], pts[i + 1], f - i);
          _a.copy(pts[i + 1]).sub(pts[i]).normalize();
          const sd = rng.sign(), sl = Math.hypot(_a.z, _a.x) || 1;
          const snx = (_a.z / sl) * sd, snz = (-_a.x / sl) * sd;
          const h = rng.range(0.75, 1.55) * hMul * (1 - 0.45 * s / len), w = rng.range(0.5, 0.8);
          B.kind = 2; B.coat = rng.range(0.86, 0.98); B.rand = rng(); wingC();
          q.x += snx * rng.range(0, 0.12); q.z += snz * rng.range(0, 0.12);
          addCard(B, q, _a.x, _a.y, _a.z, snx, snz, w, h, rng.range(0.05, 0.2), B.wFn(q), rows);
          cards++;
          sources.push(q.x + snx * 0.15, q.y - h * rng.range(0.1, 0.9), q.z + snz * 0.15);
        }
      };
      cardRun(axis, segs, L, 0.5, lerp(0.46, 0.62, t) * lerp(0.7, 1, smoothstep(0.55, 0.75, t)), 1 + 0.5 * (1 - t));
      // two side boughs fork from each long limb, so the bell keeps its body when the wings have gone
      if (L > 6.5) for (const sd of [-1, 1]) {
        axisAt(rng.range(0.2, 0.36), q); const st = q.clone();
        const len3 = L * rng.range(0.5, 0.66), fk = limbAxis(st, az + sd * rng.range(0.42, 0.62), pitch0 * 0.4, pitchEnd + 0.08, len3, 6, 0.12, rng);
        B.kind = 1; B.coat = 0.92; B.rand = rng(); firC();
        const W3 = len3 * 0.1 + 0.4;
        addFrond(B, fk, (k) => W3 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.08 + 0.92 * Math.pow(k, 1.3))), 0.6) + 0.02, 1, len3, 1.15);
        cardRun(fk, 6, len3, 0.5, 0.95, 1.1, 3);
      }
      // side branchlets, each a smaller frond with its own cards
      const ns = clamp(Math.round(L / 0.62), 3, 17);
      for (let k = 0; k < ns; k++) {
        const sT = lerp(0.1, 0.93, (k + rng.range(0.3, 0.7)) / ns), side = (k % 2 ? 1 : -1);
        axisAt(sT, q); const st = q.clone();
        const f = clamp(sT, 0, 0.999) * segs, i = Math.floor(f);
        _a.copy(axis[i + 1]).sub(axis[i]).normalize();
        const az2 = Math.atan2(_a.x, _a.z) + side * rng.range(0.7, 1.05), pl = Math.asin(clamp(_a.y, -1, 1));
        const len2 = Math.max(0.5, L * lerp(0.2, 0.4, Math.sin(Math.PI * Math.min(1, sT * 1.25)) ) * (1.05 - 0.45 * sT) * rng.range(0.8, 1.2));
        const sub = limbAxis(st, az2, pl * 0.6 - 0.05, pl - rng.range(0.4, 0.75), len2, 4, 0.25, rng);
        B.kind = 1; B.coat = 0.9; B.rand = rng(); firC();
        const W2 = len2 * rng.range(0.05, 0.08) + 0.2;
        addFrond(B, sub, (kk) => W2 * Math.pow(Math.sin(Math.PI * (0.12 + 0.88 * kk)), 0.6) + 0.015, 1, len2, 1.3);
        cardRun(sub, 4, len2, 0.35, t < 0.66 ? 0.9 : 1.15, 0.8, 3);
        if (k % 3 === 0) needleSrc.push(sub[3].x, sub[3].y, sub[3].z, ox, oy, oz);
      }
      needleSrc.push(axis[segs >> 1].x, axis[segs >> 1].y, axis[segs >> 1].z, ox, oy, oz);
      yield;
    }
    y += lerp(1.75, 0.8, t) * rng.range(0.9, 1.1); whorl++;
    yield;
  }

  yield;
  // ---- cards hugging the trunk ----
  B.pv = [0, 0, 0, 0]; B.wFn = null;
  for (let i = 0; i < 260 && cards < MAX_CARDS + 260; i++) {
    const yy = rng.range(4.5, H * 0.86), az = rng.range(0, 6.28);
    if (noise.n3(Math.sin(az) * 1.3, yy * 0.2, Math.cos(az) * 1.3) < -0.25) continue;
    trunkAt(yy, cen); const r = trunkR(yy) * 1.12 + 0.1, snx = Math.sin(az), snz = Math.cos(az);
    q.set(cen.x + snx * r, yy, cen.z + snz * r);
    B.kind = 2; B.coat = rng.range(0.85, 0.97); B.rand = rng(); wingC();
    const h = rng.range(0.8, 1.5);
    addCard(B, q, snz, 0, -snx, snx, snz, Math.min(0.9, r * 1.3), h, 0.07, 0);
    cards++; sources.push(q.x + snx * 0.1, q.y - h * 0.5, q.z + snz * 0.1);
  }
  yield;
  const geometry = B.geometry();
  yield;
  return { geometry, sources, needleSrc, limbTips, cards, nLimbs, triangles: B.ni / 3, trunkAt };
}


// ---------------------------------------------------------------------------------------------
// The coat of closed wings. Wings hang in staggered rows like shingles: each is a teardrop 1.75 rows
// long, turned up to 25 degrees by its hash, and overlaps the row below.
const GLSL_WING = /* glsl */`
// wing of row 'row' at pattern point p: returns e (< 1 inside the teardrop); q = (across, 0..1 down the wing)
float hWing(vec2 p, float row, float rnd, out vec2 id, out vec2 q){
  float px = p.x + 0.5 * mod(row, 2.0) + 0.37 * hHash(vec2(row, 7.0 + rnd * 3.0));
  float cx = floor(px);
  id = vec2(cx, row) + floor(rnd * 97.0) * 13.0;
  float a = (hHash(id + 3.7) - 0.5) * 0.87;
  vec2 d = vec2(px - cx - 0.5, p.y - row);
  float c = cos(a), s = sin(a);
  d = vec2(d.x * c - d.y * s, d.x * s + d.y * c);
  float t = d.y / 1.75, tc = clamp(t, 0.0, 1.0);
  q = vec2(d.x, t);
  float hw = 0.5 * sqrt(max(sin(3.14159 * pow(tc, 1.35)), 0.0)) + 0.02;
  return max(abs(d.x) / hw, abs(t - 0.5) * 2.0);
}
// x = seconds since this wing flipped open (negative: still shut), y = how long it holds, z = 1 if it is there
vec3 hWingState(vec2 id, float coat, float tF, float te){
  float h = hHash(id), h2 = hHash(id + 17.3);
  float dt = te - (tF + h * 0.6), hold = 0.5 + h2 * 0.6;
  return vec3(dt, hold, (h2 < coat && dt < hold) ? 1.0 : 0.0);
}`;
const GLSL_COAT = /* glsl */`
  // ---- the coat of wings ----
  vec2 p = m / vec2(0.07, 0.062);
  float fw = max(fwidth(p.x), fwidth(p.y));
  float lod = smoothstep(0.24, 0.1, fw) * (1.0 - hFarK), lodc = smoothstep(0.9, 0.3, fw) * (1.0 - hFarK);      // wing detail only where a wing is 5+ pixels
  float patchy = card ? 1.0 : smoothstep(0.06, 0.3, hNoise(vHPos.xz * 0.9 + vHPos.y * 0.6 + rnd * 20.0));
  float row = floor(p.y), tF = flipBase(vHPos);
  vec2 idA, qA, idB, qB;
  float eA = hWing(p, row - 1.0, rnd, idA, qA), eB = hWing(p, row, rnd, idB, qB);
  // far off a wing is smaller than a pixel: every cell counts as there and the coat is blended in by its coverage
  // instead (a per-cell coin toss there is pixel noise)
  float cov = coat * patchy, covT = mix(cov, step(0.02, cov), 1.0 - lodc), covB = card ? 1.0 : mix(1.0, min(1.0, cov * 1.25), 1.0 - lodc);
  vec3 base0 = base;
  vec3 sA = hWingState(idA, covT, tF, vHTe), sB = hWingState(idB, covT, tF, vHTe);
  if (card) {
    // the card's outline follows the wings: one whose root lies past the ragged hem or the sides is not there
    vec2 rA = (m - vec2(qA.x * 0.07, qA.y * 0.1085)) / vHDim, rB = (m - vec2(qB.x * 0.07, qB.y * 0.1085)) / vHDim;
    if (rA.y > 0.62 + 0.26 * hNoise(vec2(rA.x * 5.0 + rnd * 31.0, rnd * 7.0)) || abs(rA.x - 0.5) > 0.4 + 0.07 * hNoise(vec2(rA.y * 9.0, rnd * 13.0))) sA.z = 0.0;
    if (rB.y > 0.62 + 0.26 * hNoise(vec2(rB.x * 5.0 + rnd * 31.0, rnd * 7.0)) || abs(rB.x - 0.5) > 0.4 + 0.07 * hNoise(vec2(rB.y * 9.0, rnd * 13.0))) sB.z = 0.0;
  }
  float limA = sA.x < 0.0 ? 1.0 : smoothstep(sA.y, sA.y - 0.12, sA.x), limB = sB.x < 0.0 ? 1.0 : smoothstep(sB.y, sB.y - 0.12, sB.x);
  bool hitA = sA.z > 0.5 && (lod < 0.5 || eA < limA), hitB = sB.z > 0.5 && (lod < 0.5 || eB < limB);
  float clump = 0.78 + 0.44 * hNoise(m * 3.1 + rnd * 9.0);                      // survives distance
  if (hitA || hitB) {
    vec2 id = hitA ? idA : idB, q = hitA ? qA : qB;
    float e = hitA ? eA : eB, dt = hitA ? sA.x : sB.x;
    float h = mix(0.5, hHash(id), lodc);
    float fan = atan(q.x, q.y * 1.75 + 0.3);
    if (dt < 0.0) {
      // shut: grey-brown, veined from the root, dark where it tucks under the wing above, pale margin, dark outline
      vec3 wc = (card ? base : uWing) * (0.74 + 0.62 * h) * clump;
      wc = mix(wc, vec3(dot(wc, vec3(0.3333))) * vec3(1.03, 1.0, 0.95), 0.42);                 // dead-leaf grey-brown, not ochre
      if (card) {
        // each hanging cluster is a turned form: pale straw where it bellies out, shaded down one side and up under
        // the bough, so that a drape reads as a mass of closed wings with a body and not as a flat card
        float tx = clamp(vHUv.x, 0.0, 1.0) - 0.5, ty = clamp(vHUv.y, 0.0, 1.0), sd = rnd < 0.5 ? -1.0 : 1.0;
        float form = (0.6 + 0.62 * sqrt(max(0.0, 1.0 - 3.4 * tx * tx))) * (0.74 + 0.5 * clamp(0.5 + tx * sd, 0.0, 1.0));
        wc *= form * (0.78 + 0.4 * smoothstep(0.0, 0.3, ty)) * vec3(1.55, 1.5, 1.32);
      } else wc *= vec3(1.32, 1.25, 1.08);
      // dew on the wing edges: cold points of light, each winking on its own clock (only where a wing is large enough to carry one)
      float dewH = hHash(floor(m / 0.045) + rnd * 53.0), dewS = max(0.0, sin(uTime * (0.6 + 1.7 * dewH) + dewH * 90.0));
      hEmis += vec3(0.75, 0.86, 1.0) * (step(0.93, dewH) * dewS * dewS * dewS * dewS * lod * (1.0 - uWarm) * (0.8 + 1.6 * uRime));
      wc *= mix(1.0, 0.74 + 0.26 * smoothstep(0.0, 0.3, abs(sin(fan * 16.0))), lod);
      wc *= mix(1.0, 0.55 + 0.6 * smoothstep(0.0, 0.7, q.y), lod);
      wc = mix(wc, wc * 1.45 + 0.025, lod * smoothstep(0.6, 0.85, e) * 0.5);
      wc *= mix(1.0, 0.5, lod * smoothstep(0.88, 1.0, e));
      // shivering to warm up: single wings in 25 Hz bursts, and a tremor that passes through the whole cluster
      float ahead = smoothstep(-2.2, 0.0, dt);
      float burst = step(0.972 - 0.5 * ahead, hHash(id + floor(uTime * 1.3 + h * 7.0)));
      float shiv = burst * (0.5 + 0.5 * sin(uTime * 157.0 + h * 40.0)) * lodc;
      float wave = smoothstep(0.58, 0.85, hNoise(vHPos.xz * 0.7 + vec2(vHPos.y * 0.9 - uTime * 0.8, uTime * 0.35) + rnd * 30.0));
      wc *= 1.0 + 0.45 * shiv + 0.32 * wave * (0.6 + 0.4 * sin(uTime * 31.0 + h * 40.0 + vHPos.y * 3.0));
      wc = mix(wc, uOrange * 0.55, min(1.0, ahead * ahead * 0.35 * step(0.5, hHash(id + 5.1)) + 0.25 * shiv * ahead + 0.7 * shiv * hNearK));
      base = mix(base0, wc, covB);
    } else {
      // open: blazing orange, black veins and border, white dots; then it lets go
      float bord = max(smoothstep(0.55, 0.8, e), smoothstep(0.8, 0.95, q.y));
      float vein = smoothstep(0.0, 0.25, abs(sin(fan * 13.0)));
      float ink = mix(0.8, min(1.0 - 0.92 * bord, 0.35 + 0.65 * vein), lod);
      vec3 oc = uOrange * (0.7 + 0.6 * h) * ink * mix(clump * clump, 1.0, lodc);
      oc += vec3(0.5) * lod * bord * step(0.8, hHash(floor(q * vec2(7.0, 11.0)) + id));
      float flash = smoothstep(0.0, 0.1, dt);
      base = mix(base0, oc * 0.6, covB); hOpen = 1.0;
      hEmis += oc * vec3(1.0, 0.7, 0.4) * flash * (1.1 + 2.0 * lit) * covB;
    }
  } else if (card) {
    // between wings: the shaded layer underneath while the cluster hangs, nothing once it has flown
    bool inside = vHUv.y < 0.6 && abs(vHUv.x - 0.5) < 0.38 && vHTe < tF + 0.25 && coat > 0.5;
    if (!inside) discard;
    base *= 0.52 * clump;
  }
  if (uRime > 0.0 && kind > 0.5) {
    // rime: a smooth frosting of whatever faces the sky, breathing slowly over the tree, gone at arm's length
    float upN = (transpose(mat3(viewMatrix)) * normalize(vNormal)).y * (gl_FrontFacing ? 1.0 : -1.0);
    float rk = max(smoothstep(-0.15, 0.7, upN), card ? 0.3 * (1.0 - vHUv.y) : 0.0) * (0.42 + 0.3 * hNoise(vHPos.xz * 0.3 + vHPos.y * 0.17 + rnd * 3.0));
    base = mix(base, vec3(0.74, 0.79, 0.85), uRime * rk * (1.0 - hOpen) * smoothstep(4.0, 12.0, hVd));
  }
`;

// ---------------------------------------------------------------------------------------------
// Tree material: MeshStandardMaterial patched with (a) the limb spring, (b) procedural bark,
// fir-frond and shingle-card detail, (c) the coat of closed wings that flips to orange and peels
// off as the light front passes, (d) the warm shaft light as an emissive term.
function makeTreeMaterial(U, pal) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.92, metalness: 0 });
  mat.customProgramCacheKey = () => 'monarch-great-bough-v2';
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
${GLSL_COMMON}
uniform float uSpring;
attribute vec4 aPivot; attribute vec4 aInfo; attribute vec2 aDim;
#ifdef USE_INSTANCING
attribute vec3 aInst;      // x = clock offset (s), y = coat multiplier, z = pattern offset
#endif
varying vec3 vHPos; varying vec2 vHUv; varying vec4 vHInfo; varying vec2 vHDim; varying float vHRel, vHTe;
float gTe;
float hLimbAngle(){
  float w = aInfo.y; if (w <= 0.0) return 0.0;
  vec2 d = vec2(sin(aPivot.w), cos(aPivot.w));
  float tRel = flipBase(aPivot.xyz + vec3(d.x, 0.0, d.y) * 2.5) + 1.25;
  float t = gTe - tRel;
  float a = t > 0.0 ? uSpring * (1.0 - exp(-1.5 * t) * cos(7.54 * t)) : 0.0;
  // heavy slow sway before release, light wind after
  a += (t > 0.0 ? 0.02 : 0.008) * sin(uTime * (t > 0.0 ? 1.3 : 0.7) + aPivot.w * 7.0 + aPivot.y * 1.7);
  return a * w;
}
vec3 hBend(vec3 q, float a){
  vec2 d = vec2(sin(aPivot.w), cos(aPivot.w));
  float r = dot(q.xz, d); vec2 lat = q.xz - d * r;
  float c = cos(a), s = sin(a);
  float r2 = r * c - q.y * s, h2 = q.y * c + r * s;
  return vec3(lat.x + d.x * r2, h2, lat.y + d.y * r2);
}`)
      .replace('#include <beginnormal_vertex>', `gTe = uTe;
#ifdef USE_INSTANCING
gTe = uTe - aInst.x;
#endif
float hAng = hLimbAngle();
vec3 objectNormal = hBend(normal, hAng);`)
      .replace('#include <begin_vertex>', `vec3 transformed = aPivot.xyz + hBend(position - aPivot.xyz, hAng);
vHPos = position; vHUv = uv; vHInfo = aInfo; vHDim = aDim; vHRel = hAng; vHTe = gTe;
#ifdef USE_INSTANCING
vHInfo.w *= aInst.y; vHInfo.z = fract(aInfo.z + aInst.z);
#endif`);

    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
${GLSL_COMMON}
uniform vec3 uShaftCol, uOrange, uSunDir, uWing, uFill; uniform float uRime, uWarm;
varying vec3 vHPos; varying vec2 vHUv; varying vec4 vHInfo; varying vec2 vHDim; varying float vHRel, vHTe;
${GLSL_WING}
vec3 hEmis; float hTrans, hBack;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  float kind = vHInfo.x, rnd = vHInfo.z, coat = vHInfo.w;
  vec3 base = diffuseColor.rgb;
  hEmis = vec3(0.0); hTrans = 0.0; hBack = 0.0;
  float lit = shaftLit(vHPos, vHTe);
  vec2 m = vHUv * vHDim;                       // metres on the surface
  float fwm = max(fwidth(m.x), fwidth(m.y));   // metres per pixel (taken here, outside every branch)
  bool card = kind > 1.5;
  float hVd = length(vViewPosition), hFarK = smoothstep(26.0, 42.0, hVd), hNearK = 1.0 - smoothstep(12.0, 30.0, hVd), hOpen = 0.0;
  if (kind < 0.5) {
    // bark: long vertical plates with dark furrows
    float pl = hNoise(vec2(m.x * 7.0 + rnd * 9.0, m.y * 0.9));
    float fu = smoothstep(0.42, 0.5, abs(hNoise(vec2(m.x * 15.0, m.y * 1.6 + pl * 2.0)) - 0.5) * 2.0 * 0.5 + 0.25 * pl);
    base *= 0.8 + 0.7 * pl; base *= mix(0.55, 1.0, fu);
  } else if (!card) {
    // fir frond: branchlets angled forward off the rachis, needles across them
    // (a comb of branchlets every 22 cm with a fringe of needle tips cut into the outline; beyond ~35 m the
    // stripes give way to their average so a distant fir is a dark toothed cone, not a zig-zag)
    // The pad is cut into sprays: side branches swept forward off the rachis, each one tapering to a point with
    // a saw edge of needle tufts and open air between it and the next. Every scale of the pattern is faded out by
    // its own size in pixels (fwidth), so it never turns to moire: far off the gaps close and a toothed outline is left.
    float v = abs(vHUv.y), lat = abs(m.y);
    float nS = clamp(floor(vHDim.x / 0.42), 4.0, 16.0), per = max(vHDim.x / nS, 0.05);
    float bx = (m.x - lat * 0.75) / per + rnd * 5.0 + 0.3 * hNoise(m * 1.3 + rnd * 11.0);
    float bid = floor(bx), bf = abs(fract(bx) - 0.5) * 2.0;                                  // 0 on a spray's midrib, 1 half way to the next
    float blen = 0.68 + 0.32 * hHash(vec2(bid, floor(rnd * 64.0) + 1.0)), vv = v / blen;
    float fine = 1.0 - smoothstep(0.2, 0.55, fwm / per), fine2 = 1.0 - smoothstep(0.25, 0.7, fwm / 0.075);
    float tuft = fract(lat / 0.075 + bid * 0.37 + rnd * 3.0);
    float wS = mix(1.0, 0.15, smoothstep(0.08, 1.0, vv)) * (1.0 - 0.3 * tuft * fine2);
    float cutN = max(bf / wS, vv + 0.25 * bf * bf), cutF = v / (0.94 - 0.3 * bf);
    if (mix(cutF, cutN, fine) > 1.0) discard;
    float ndK = 1.0 - smoothstep(0.25, 0.7, fwm / 0.024);
    float nd = abs(fract(lat / 0.024 + bf * 1.5) - 0.5) * 2.0;
    base *= mix(0.86, 0.64 + 0.46 * nd, ndK);                                                // needles across each spray
    base *= mix(0.9, 0.62 + 0.4 * smoothstep(0.0, 0.3, bf), fine);                           // its dark midrib
    base *= mix(1.0, 0.8 + 0.4 * hHash(vec2(bid, floor(rnd * 64.0) + 9.0)), fine);           // no two sprays the same green
    base = mix(base, base * vec3(1.15, 1.28, 1.05), smoothstep(0.5, 1.0, vv) * 0.65);      // paler new growth at the tips
    base *= mix(0.6, 1.0, smoothstep(0.0, 0.1, v));                                       // dark rachis
    base = mix(base, vec3(dot(base, vec3(0.3333))) * vec3(0.9, 1.0, 1.03), 0.5) * 2.2;      // a dark, desaturated blue-green: orange is the only loud colour here
    base *= (1.0 - 0.3 * uWarm) * mix(1.0, 0.8, hFarK);                                                               // in sun it stays the dark fir of the brief, never mint
    bool hTop = dot(vNormal, vViewPosition) > 0.0;                                           // looking at the bough's upper side
    if (!hTop) { base *= 0.72; hBack = 1.0; }                                                // shaded underside: sky light comes through the needles (see emissive)
    // the wings hang under the bough and along its hem: from above the fir's own green shows through
    else coat *= mix(0.1, 1.0, max(smoothstep(0.62, 0.92, vHUv.x), smoothstep(0.55, 0.95, v)));
    hTrans = 0.5;
  } else {
    // card outline: ragged hem and sides so the drape reads as hanging wings, not a rectangle
    hTrans = 0.3;
  }
${GLSL_COAT}
  diffuseColor.rgb = base;
}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
  float lit = shaftLit(vHPos, vHTe);
  float nl = dot(normal, normalize((viewMatrix * vec4(uSunDir, 0.0)).xyz));
  float wrap = mix(clamp(nl * 0.75 + 0.25, 0.0, 1.0), 0.35 + 0.65 * abs(nl), hTrans);
  float skyUp = 0.5 + 0.5 * (transpose(mat3(viewMatrix)) * normal).y;
  totalEmissiveRadiance += diffuseColor.rgb * (uShaftCol * (lit * wrap) + uFill * (0.55 + 0.45 * skyUp) + uShaftCol * (uWarm * 0.16 * (0.4 + 0.6 * skyUp))
    + (uFill * vec3(0.8, 1.05, 0.85) * 0.9 + uShaftCol * (0.08 * uWarm)) * hBack) + hEmis;
}`);
  };
  return mat;
}

// ---------------------------------------------------------------------------------------------
// Flyers: real butterflies, two triangles each folded along the body. Hidden until the light
// front reaches their source point on the tree; then spiral out, fill the air, join the river.
const FOG_FRAG_ADD = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float hFog = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    float hFog = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#else
  float hFog = 0.0;
#endif`;

// The outline and pattern of a flying monarch, drawn inside each of its two triangles from the barycentrics
// (x = nose, y = tail, z = wing tip): a forewing with a straight leading edge and a round tip, a scalloped
// hindwing, the notch between them, black veins and margin with a double row of white dots, a dark body on
// the fold. Under about 3 pixels of wing it is the whole triangle in flat orange, as before.
export const FLYER_VERTS = [0, 0, 0.62, 0, 0, -0.95, -1.3, 0, 0.36, 1.3, 0, 0.36];
export const GLSL_FLYWING = /* glsl */`
float flyWing(vec3 b, float px, float seed, out float white){
  white = 0.0;
  if (px < 2.4) return 0.85;
  vec2 w = vec2(1.3 * b.z, 0.62 * b.x - 0.95 * b.y + 0.36 * b.z);
  vec2 q1 = vec2((w.x - 0.55) / 0.6, (w.y - 0.1 * w.x - 0.2) / 0.25), q2 = vec2((w.x - 0.3) / 0.34, (w.y + 0.2) / 0.3);
  float a2 = atan(q2.y, q2.x + 1.0e-4);
  float d1 = length(q1), d2 = length(q2) * (1.0 + 0.055 * cos(a2 * 9.0));
  bool body = w.x < 0.05 && w.y > -0.5 && w.y < 0.54;
  float d = min(d1, d2);
  if (d > 1.0 && !body) discard;
  float det = smoothstep(4.0, 10.0, px);
  bool fore = d1 < d2;
  vec2 root = fore ? vec2(-0.1, 0.16) : vec2(-0.06, -0.12);
  float fan = atan(w.y - root.y, w.x - root.x);
  float vein = smoothstep(0.0, 0.2, abs(sin(fan * (fore ? 11.0 : 8.0) + 0.6)));
  float cell = smoothstep(0.02, 0.07, abs(d - 0.5));                                   // the cross vein that closes the cell
  float margin = smoothstep(0.8, 0.9, d);
  vec2 dg = vec2(fract(fan * (fore ? 9.0 : 6.5) + seed * 3.0) - 0.5, fract((d - 0.82) * 11.0) - 0.5);
  white = det * step(0.84, d) * step(d, 0.99) * smoothstep(0.42, 0.22, length(dg * vec2(1.0, 1.3)));
  float ink = (1.0 - 0.94 * margin) * (0.55 + 0.45 * vein * cell) * (1.14 - 0.25 * d);
  if (body || d > 1.0) { ink = 0.05; white = 0.0; }
  return mix(0.85, ink, det);
}`;

function makeFlyers(ctx, U, tree, P) {
  const rng = ctx.rng.fork('flyers'), N = P.flyers;
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FLYER_VERTS), 3));
  g.setAttribute('aBary', new THREE.BufferAttribute(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1]), 3));
  g.setIndex([0, 2, 1, 0, 1, 3]);
  const src = new Float32Array(N * 3), seed = new Float32Array(N * 4), S = tree.sources, ns = S.length / 3;
  for (let i = 0; i < N; i++) {
    const k = Math.floor(rng() * ns) * 3;
    src[i * 3] = S[k] + rng.range(-0.25, 0.25); src[i * 3 + 1] = S[k + 1] + rng.range(-0.4, 0.3); src[i * 3 + 2] = S[k + 2] + rng.range(-0.25, 0.25);
    seed[i * 4] = rng(); seed[i * 4 + 1] = rng(); seed[i * 4 + 2] = rng(); seed[i * 4 + 3] = rng();
  }
  g.setAttribute('aSrc', new THREE.InstancedBufferAttribute(src, 3));
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
  g.instanceCount = N;
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
    side: THREE.DoubleSide, fog: true,
    vertexShader: /* glsl */`
#include <common>
#include <fog_pars_vertex>
${GLSL_COMMON}
attribute vec3 aBary; attribute vec3 aSrc; attribute vec4 aSeed;
uniform vec3 uRiver[8], uSunDir; uniform float uRiverLen, uSize, uSlope, uLinger, uWarm, uBurst;
varying vec3 vBary; varying float vLit; varying float vSeed; varying float vFade; varying float vPx; varying float vBack;
vec3 riverPt(float s){
  float f = clamp(s / uRiverLen, 0.0, 1.0) * 7.0; float fi = min(floor(f), 6.0); float t = f - fi; int k = int(fi);
  vec3 p0 = uRiver[max(k - 1, 0)], p1 = uRiver[k], p2 = uRiver[min(k + 1, 7)], p3 = uRiver[min(k + 2, 7)];
  return 0.5 * ((2.0 * p1) + (p2 - p0) * t + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t * t + (3.0 * p1 - p0 - 3.0 * p2 + p3) * t * t * t);
}
vec3 wander(float s, float t){
  return vec3(sin(t * 0.83 + s * 6.3) + 0.5 * sin(t * 1.9 + s * 17.0),
              0.7 * sin(t * 1.07 + s * 11.0) + 0.4 * sin(t * 2.3 + s * 5.0),
              cos(t * 0.71 + s * 9.0) + 0.5 * cos(t * 1.7 + s * 13.0));
}
vec3 flyPos(float te, float tr, out float fade){
  float a = max(te - tr, 0.0);
  float rs = length(aSrc.xz) + 0.001; vec2 rad = aSrc.xz / rs;
  float out1 = 1.0 - exp(-a * 0.8);
  float sw = a * 0.2 * (aSeed.y - 0.35) + out1 * (aSeed.x - 0.5) * 1.6;
  float cs = cos(sw), sn = sin(sw); vec2 rr = vec2(rad.x * cs - rad.y * sn, rad.x * sn + rad.y * cs);
  float cr = rs + out1 * (3.0 + 17.0 * aSeed.w * aSeed.w + 5.0 * aSeed.y);
  vec3 cloud = vec3(rr.x * cr, aSrc.y + out1 * (1.0 + 10.0 * aSeed.z * aSeed.z) + 0.6 * sin(a * 0.5 + aSeed.x * 6.0), rr.y * cr);
  float sp = smoothstep(0.0, 0.3, a) * (1.0 - smoothstep(0.9, 2.2, a));
  float sa = a * 7.0 + aSeed.x * 40.0;
  cloud += vec3(cos(sa) * rad.y, sin(sa), -cos(sa) * rad.x) * 0.55 * sp;
  cloud += wander(aSeed.x * 10.0 + aSeed.w, te * 0.8) * (0.25 + 2.4 * out1);
  // the river
  float tG = aSeed.w > 1.0 - uLinger ? 1.0e4 : 1.6 + aSeed.z * 6.5;
  float gth = smoothstep(tG, tG + 4.5, a);
  float s = aSeed.x * 30.0 + max(a - tG - 1.2, 0.0) * (9.0 + 2.5 * aSeed.y);
  vec3 rp = riverPt(s);
  float ca = aSeed.x * 6.2832 + s * 0.035 + te * 0.15;
  float funnel = 1.0 - 0.55 * smoothstep(uRiverLen - 62.0, uRiverLen - 14.0, s);              // the river narrows into the portal
  float crad = sqrt(aSeed.y) * (3.6 + 1.2 * sin(s * 0.05 + aSeed.z * 6.0)) * (1.0 + 1.6 * (1.0 - smoothstep(0.0, 45.0, s))) * funnel;
  float braid = smoothstep(25.0, 70.0, s), strand = floor(aSeed.z * 3.0);                    // the river runs in three plaited strands
  rp += vec3(cos(ca) * crad, sin(ca) * crad * 0.6, 0.0) * (1.0 - 0.3 * braid) + wander(aSeed.y * 9.0 + aSeed.z, te * 1.1 + s * 0.05) * 0.7;
  rp += vec3(2.3 * sin(s * 0.052 + strand * 2.1 + te * 0.13), 0.9 * sin(s * 0.041 + strand * 4.0), 0.0) * braid * funnel;
  vec3 pos = mix(cloud, rp, gth);
  pos.y = max(pos.y, 1.2 - uSlope * pos.z + aSeed.x);
  fade = step(tr, te) * (1.0 - smoothstep(uRiverLen - 18.0, uRiverLen - 2.0, s));
  return pos;
}
void main(){
  float tr = flipBase(aSrc) + aSeed.x * 0.6 + 0.35 + aSeed.y * 0.35;
  float fade, f2;
  vec3 c = flyPos(uTe, tr, fade);
  vec3 c2 = flyPos(uTe + 0.12, tr, f2);
  vec3 fw = c2 - c; float fl = length(fw);
  fw = fl > 1e-4 ? fw / fl : vec3(0.0, 0.0, 1.0);
  fw = normalize(fw + vec3(0.0, 0.15, 0.0));
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)) + 1e-4), up = cross(rt, fw);
  // no two fly alike: each holds its own heading and bank about the stream's direction, and wavers
  float yaw = (fract(aSeed.y * 13.7 + aSeed.z) - 0.5) * 1.6 + 0.3 * sin(uTime * 1.3 + aSeed.x * 31.0);
  float rol = (fract(aSeed.z * 9.1 + aSeed.w) - 0.5) * 1.6 + 0.3 * sin(uTime * 1.7 + aSeed.y * 23.0);
  vec3 fwY = fw * cos(yaw) + rt * sin(yaw); rt = rt * cos(yaw) - fw * sin(yaw); fw = fwY;
  vec3 rtR = rt * cos(rol) + up * sin(rol); up = up * cos(rol) - rt * sin(rol); rt = rtR;
  // flap with glide pauses
  float ph = uTime * (46.0 + 16.0 * aSeed.z) + aSeed.x * 60.0;
  float glide = smoothstep(0.55, 0.7, fract(uTime * 0.37 + aSeed.w * 5.0 + aSeed.y));
  float ang = mix(0.15 + 1.05 * sin(ph), 0.06 + 0.34 * aSeed.z, glide);
  ang = mix(1.45, ang, smoothstep(0.0, 0.35, uTe - tr));          // wings still shut as it lets go
  vec4 mc = modelViewMatrix * vec4(c, 1.0);
  float sc = max(uSize, -mc.z * 0.0021) * (0.7 + 0.7 * fract(aSeed.w * 7.31 + aSeed.x * 3.7)) * fade * smoothstep(0.4, 3.2, -mc.z);   // shrink away at the lens
  sc *= 1.0 + uBurst * (1.0 - smoothstep(0.8, 4.5, uTe - tr));                       // the burst: larger while it pours out of the tree
  float side = position.x;
  vec3 lp = fw * position.z + rt * (side * cos(ang)) + up * (abs(side) * sin(ang));
  vec4 mvPosition = modelViewMatrix * vec4(c + lp * sc, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vBary = aBary; vSeed = aSeed.x; vFade = fade; vPx = sc / max(-mc.z * 0.0022, 1e-4);
  vec3 wv = (modelMatrix * vec4(c, 1.0)).xyz - cameraPosition;
  vBack = uWarm * smoothstep(0.6, 0.95, dot(wv, uSunDir) / max(length(wv), 1e-3));      // between the lens and the sun: amber glass
  vLit = shaftLit(c, uTe);
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uOrange, uShaftCol, uAmb;
varying vec3 vBary; varying float vLit; varying float vSeed; varying float vFade; varying float vPx; varying float vBack;
${GLSL_FLYWING}
void main(){
  if (vFade < 0.01) discard;
  float white, ink = flyWing(vBary, vPx, vSeed, white);
  vec3 col = mix(uOrange * (0.8 + 0.5 * vSeed) * ink, vec3(0.75), white);
  if (!gl_FrontFacing) col = mix(col, vec3(dot(col, vec3(0.5))) * vec3(1.3, 0.9, 0.55), 0.3);   // paler underside
  // shade light + amber-glass glow where the shaft backlights it
  vec3 outc = col * (uAmb + uShaftCol * vLit * 0.35) + col * vec3(1.0, 0.74, 0.45) * (0.15 + vLit * 0.8 + vBack * 0.9) * ink;
  ${FOG_FRAG_ADD}
  #ifdef USE_FOG
    outc = mix(outc, fogColor, hFog);
  #endif
  gl_FragColor = vec4(outc, 1.0);
}`,
  });
  Object.assign(mat.uniforms, U);
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false; mesh.name = 'monarch-flyers';
  return mesh;
}

// Needles shaken loose as each limb springs up: instanced slivers that tumble down.
function makeNeedles(ctx, U, tree, P) {
  const rng = ctx.rng.fork('needles'), N = 1800, S = tree.needleSrc, ns = S.length / 6;
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -1, 0, 0.5, -1, 0, 0.5, 1, 0, -0.5, 1, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const src = new Float32Array(N * 3), piv = new Float32Array(N * 3), seed = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const k = Math.floor(rng() * ns) * 6;
    src[i * 3] = S[k] + rng.range(-0.5, 0.5); src[i * 3 + 1] = S[k + 1] + rng.range(-0.3, 0.6); src[i * 3 + 2] = S[k + 2] + rng.range(-0.5, 0.5);
    piv[i * 3] = S[k + 3]; piv[i * 3 + 1] = S[k + 4]; piv[i * 3 + 2] = S[k + 5];
    seed[i * 4] = rng(); seed[i * 4 + 1] = rng(); seed[i * 4 + 2] = rng(); seed[i * 4 + 3] = rng();
  }
  g.setAttribute('aSrc', new THREE.InstancedBufferAttribute(src, 3));
  g.setAttribute('aPiv', new THREE.InstancedBufferAttribute(piv, 3));
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
  g.instanceCount = N;
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), side: THREE.DoubleSide, fog: true,
    vertexShader: /* glsl */`
#include <common>
#include <fog_pars_vertex>
${GLSL_COMMON}
attribute vec3 aSrc; attribute vec3 aPiv; attribute vec4 aSeed;
uniform float uSlope;
varying float vLit; varying float vShow;
void main(){
  // released over the limb's two bounces
  float tr = flipBase(aPiv) + 1.25 + aSeed.x * aSeed.x * 3.5;
  float a = uTe - tr;
  float fall = 1.4 + 1.3 * aSeed.y;
  vec3 c = aSrc;
  c.y -= fall * max(a, 0.0) - 0.4 * (1.0 - exp(-max(a, 0.0) * 2.0));
  c.xz += vec2(sin(a * 1.7 + aSeed.z * 6.3), cos(a * 1.3 + aSeed.w * 6.3)) * 0.35 * min(a, 2.0);
  float gy = -uSlope * c.z + 0.05;
  vShow = step(0.0, a) * step(gy, c.y) * smoothstep(0.0, 0.2, a);
  float sp = a * (5.0 + 6.0 * aSeed.w) + aSeed.z * 6.3;
  vec3 ax = normalize(vec3(sin(sp), 0.6 * cos(sp * 0.7), cos(sp)));
  vec3 bx = normalize(cross(ax, vec3(0.3, 1.0, 0.2)));
  vec4 mc = modelViewMatrix * vec4(c, 1.0);
  float wd = max(0.012, -mc.z * 0.0011), ln = max(0.09 + 0.07 * aSeed.x, -mc.z * 0.003);
  vec4 mvPosition = modelViewMatrix * vec4(c + (ax * position.y * ln + bx * position.x * wd) * vShow, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vLit = shaftLit(c, uTe);
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uShaftCol, uAmb, uNeedle;
varying float vLit; varying float vShow;
void main(){
  if (vShow < 0.5) discard;
  vec3 outc = uNeedle * (uAmb + uShaftCol * vLit * 2.2);
  ${FOG_FRAG_ADD}
  #ifdef USE_FOG
    outc = mix(outc, fogColor, hFog);
  #endif
  gl_FragColor = vec4(outc, 1.0);
}`,
  });
  Object.assign(mat.uniforms, U);
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false; mesh.name = 'monarch-needles';
  return mesh;
}

// The visible sun shaft: a soft additive column of light, 15 m wide, lying along the sun direction.
function makeShaft(U) {
  const g = new THREE.CylinderGeometry(1, 1, 1, 40, 1, true);
  g.translate(0, 0.5, 0);
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uShaftI: { value: 0 }, uLen: { value: 120 }, uLow: { value: 0.2 }, uLocal: { value: new THREE.Matrix4() } }]),
    side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
    vertexShader: /* glsl */`
#include <common>
#include <fog_pars_vertex>
uniform mat4 uLocal; uniform float uSlope;
varying vec3 vN; varying vec3 vV; varying vec3 vP; varying float vH;
void main(){
  vP = position;
  vec3 hl = (uLocal * vec4(position, 1.0)).xyz; vH = hl.y + uSlope * hl.z;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * vec3(position.x, 0.0, position.z));
  vV = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uShaftCol; uniform float uShaftI, uTime, uLen, uLow;
varying vec3 vN; varying vec3 vV; varying vec3 vP; varying float vH;
float hHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float hNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hHash(i), hHash(i+vec2(1.,0.)), f.x), mix(hHash(i+vec2(0.,1.)), hHash(i+vec2(1.,1.)), f.x), f.y); }
void main(){
  float body = pow(abs(dot(normalize(vN), normalize(vV))), 1.8);
  float ang = atan(vP.z, vP.x);
  float along = vP.y * uLen;
  float streak = 0.55 + 0.45 * hNoise(vec2(ang * 5.0 + 20.0, along * 0.03 - uTime * 0.05))
               + 0.35 * hNoise(vec2(ang * 17.0, along * 0.06 + uTime * 0.11));
  float mist = 0.75 + 0.5 * hNoise(vec2(ang * 2.0 + uTime * 0.07, along * 0.16 - uTime * 0.5));
  float ends = smoothstep(0.0, uLow, vP.y) * (1.0 - smoothstep(0.35, 1.0, vP.y)) * smoothstep(0.0, 16.0, vH);
  vec3 outc = uShaftCol * (uShaftI * body * streak * mist * ends);
  ${FOG_FRAG_ADD}
  gl_FragColor = vec4(outc * (1.0 - hFog * 0.7), 1.0);
}`,
  });
  mat.uniforms.uShaftCol = U.uShaftCol; mat.uniforms.uTime = U.uTime; mat.uniforms.uSlope = U.uSlope;
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false; mesh.renderOrder = 5; mesh.name = 'monarch-shaft';
  return mesh;
}


// ---------------------------------------------------------------------------------------------
// A lighter fir of the same make for the rest of the forest, drawn instanced with the tree material
// (hero.makeMaterial()). Per instance: aInst = (clock offset s, coat multiplier, pattern offset).
// lod 1: about 3.8k triangles (the draped gully firs); lod 2: about 1.5k (the forest near the path); lod 3: about 0.6k.
function* liteFirGen(ctx, o) {
  const rng = o.rng || ctx.rng.fork('lite-fir'), noise = ctx.noise, pal = o.palette || DEFAULT_PALETTE, lod = o.lod ?? 1;
  const H = o.height ?? 38, yLow = o.yLow ?? rng.range(3.4, 4.6), limbMax = o.limbMax ?? H * 0.2, rBase = H * 0.014 + 0.12, DEPTH = 4;
  const B = makeBuilder(14000, 42000);
  const bark = new THREE.Color(pal[3]), fir = new THREE.Color(pal[2]), wing = new THREE.Color(pal[4]);
  const leanAz = rng.range(0, 6.28), lean = rng.range(0.2, 1.0);
  const trunkAt = (y, out) => { const t = clamp(y / H, 0, 1); return out.set(Math.sin(leanAz) * lean * t * t, y, Math.cos(leanAz) * lean * t * t); };
  const trunkR = (y) => rBase * Math.pow(clamp(1 - y / (H + 0.4), 0.004, 1.2), 0.82) + 0.02;
  const firC = () => { const m = rng.range(0.75, 1.25), g = rng.range(-0.012, 0.02); B.c = [fir.r * m, (fir.g + g) * m, (fir.b + g * 0.5) * m]; };
  const wingC = () => { const m = rng.range(0.6, 1.1); B.c = [wing.r * m, wing.g * m * rng.range(0.92, 1.02), wing.b * m * rng.range(0.85, 1.0)]; };
  // trunk
  B.kind = 0; B.pv = [0, 0, 0, 0]; B.rand = rng(); B.wFn = null;
  const SIDES = [8, 6, 5][lod - 1], RINGS = [10, 6, 4][lod - 1], rings = [], cen = new THREE.Vector3();
  B.d = [Math.PI * 2 * rBase, H + DEPTH];
  for (let i = 0; i <= RINGS; i++) {
    const k = i / RINGS, y = -DEPTH + (H + DEPTH) * Math.pow(k, 1.4), row = [];
    trunkAt(y, cen);
    const r = trunkR(Math.max(y, 0)) * (1 + 0.6 * Math.exp(-Math.max(y + 0.6, 0) / 1.5));
    B.coat = y > 3.5 && y < H * 0.93 ? 0.82 : 0.3;
    for (let s = 0; s <= SIDES; s++) {
      const a = (s % SIDES) / SIDES * Math.PI * 2, nx = Math.cos(a), nz = Math.sin(a), m = 1.7 * (0.85 + 0.3 * noise.n2(a * 5 + 3, y * 1.3));
      B.c = [bark.r * m, bark.g * m, bark.b * m];
      row.push(B.v(cen.x + nx * r, y, cen.z + nz * r, nx, 0, nz, s / SIDES, k));
    }
    rings.push(row);
  }
  for (let i = 0; i < RINGS; i++) for (let s = 0; s < SIDES; s++) B.quad(rings[i][s], rings[i + 1][s], rings[i + 1][s + 1], rings[i][s + 1]);
  // whorls of sagging limbs: one broad frond each, hung with cards
  const o3 = new THREE.Vector3(), q = new THREE.Vector3();
  const card = (pts, n, s, len, hMul) => {
    const f = clamp(s / len, 0, 0.999) * n, i = Math.floor(f);
    q.lerpVectors(pts[i], pts[i + 1], f - i);
    _a.copy(pts[i + 1]).sub(pts[i]).normalize();
    const sd = rng.sign(), sl = Math.hypot(_a.z, _a.x) || 1, snx = (_a.z / sl) * sd, snz = (-_a.x / sl) * sd;
    const h = rng.range(1.2, 2.3) * hMul * (1 - 0.4 * s / len), w = rng.range(0.9, 1.5) * (lod === 3 ? 1.5 : 1);
    B.kind = 2; B.coat = rng.range(0.86, 0.98); B.rand = rng(); wingC();
    q.x += snx * rng.range(0, 0.15); q.z += snz * rng.range(0, 0.15);
    addCard(B, q, _a.x, _a.y, _a.z, snx, snz, w, h, rng.range(0.08, 0.25), B.wFn(q), 2);
  };
  let y = yLow, azOff = rng.range(0, 6.28), radius = 0;
  const perWhorl = [6, 5, 4][lod - 1], stepK = [1.3, 1.65, 2.2][lod - 1], segs = [3, 2, 2][lod - 1], jit = [0.6, 0.7, 0.9][lod - 1];
  while (y < H - 1.2) {
    const t = clamp((y - yLow) / (H - yLow), 0, 1), count = t > 0.9 ? 4 : perWhorl;
    azOff += 0.9 + rng.range(-0.2, 0.2);
    for (let j = 0; j < count; j++) {
      const az = azOff + (j / count) * Math.PI * 2 + rng.range(-0.25, 0.25);
      const L = lerp(limbMax, 0.9, Math.pow(t, 0.9)) * rng.range(0.78, 1.12);
      const yy = y + rng.range(-jit, jit) * (1 - 0.6 * t); trunkAt(yy, cen); const tr = trunkR(yy);
      o3.set(cen.x + Math.sin(az) * tr * 0.6, yy, cen.z + Math.cos(az) * tr * 0.6);
      const up = smoothstep(0.8, 1.0, t), pitch0 = lerp(0.12, 0.55, t) + rng.range(-0.08, 0.08), pitchEnd = lerp(-rng.range(0.68, 0.9), -0.25, up);
      const axis = limbAxis(o3, az, pitch0, pitchEnd, L, segs, lerp(0.16, 0.0, up), rng);
      const ox = o3.x, oy = o3.y, oz = o3.z;
      B.pv = [ox, oy, oz, az]; B.rand = rng();
      B.wFn = (p) => 0.55 + 0.45 * clamp(Math.hypot(p.x - ox, p.z - oz) / (L * 0.8), 0, 1);
      // the bough: a fan of branchlets, widest two thirds of the way out, its sides drooping
      B.kind = 1; B.coat = 0.92; firC();
      const Wm = lod === 1 ? L * 0.16 + 0.55 : lod === 2 ? L * 0.21 + 0.65 : L * 0.31 + 0.9;
      const fan = (k) => Wm * Math.pow(Math.sin(Math.PI * Math.min(1, 0.08 + 0.92 * Math.pow(k, 1.3))), 0.6) + 0.03;
      addFrond(B, axis, fan, 1, L, 1.15);
      radius = Math.max(radius, Math.hypot(axis[segs].x, axis[segs].z));
      const nc = L > 2.2 ? [2, 1, 1][lod - 1] : 1;
      for (let c = 0; c < nc; c++) card(axis, segs, L * (0.3 + 0.62 * (c + rng.range(0.2, 0.8)) / nc), L, 1);
      if (lod < 3) {
        // a second, shorter spray under it, turned about 35 degrees about its own axis: the crown keeps its body
        // (and hides the trunk) when the wings have gone and the limbs have sprung up
        const L2 = L * rng.range(0.55, 0.72), roll = rng.sign() * rng.range(0.5, 0.72);
        const sub = limbAxis(o3, az + rng.range(-0.4, 0.4), pitch0 - rng.range(0.3, 0.5), pitchEnd - 0.1, L2, segs, 0.1, rng);
        B.kind = 1; B.rand = rng(); B.coat = 0.9; firC();
        addFrond(B, sub, (k) => 0.85 * fan(k), 1, L2, 1.3, roll);
      }
    }
    y += lerp(1.75, 0.8, t) * rng.range(0.9, 1.1) * stepK;
    yield;
  }
  const g = B.geometry();
  g.computeBoundingSphere();
  g.userData = { height: H, radius, yLow, limbMax, triangles: B.ni / 3 };
  return g;
}
export function liteFirGeometry(ctx, o = {}) { const it = liteFirGen(ctx, o); let r; while (!(r = it.next()).done); return r.value; }
// the same fir built a whorl at a time, handing the frame back in between (same random draws, same result)
export async function liteFirGeometryAsync(ctx, o = {}) { const it = liteFirGen(ctx, o); let r; while (!(r = it.next()).done) await ctx.yield?.(); return r.value; }

// ---------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('monarch-hero');
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).slice();
  // per-seed character
  const P = {
    height: rng.range(42, 47), yLow: rng.range(6.5, 9), limbMax: rng.range(12.4, 14.4), trunkRadius: rng.range(0.95, 1.15),
    flyers: Math.round(clamp(opts.flyers ?? 26000, 1000, 30000)),
  };
  const firC = new THREE.Color(pal[2]).lerp(new THREE.Color(rng.chance(0.5) ? '#2f4a52' : '#3d4a2c'), rng.range(0.1, 0.35)).multiplyScalar(1.25);
  const wingC = new THREE.Color(pal[4]).lerp(new THREE.Color(rng.chance(0.5) ? '#7d766e' : '#8e7a66'), rng.range(0, 0.4));
  const tpal = pal.slice(); tpal[2] = '#' + firC.getHexString(); tpal[4] = '#' + wingC.getHexString();
  const H = P.height, slope = Math.tan(opts.slope ?? 0);

  const sunDir = new THREE.Vector3().fromArray(opts.sunDir || [-0.6, 0.7, 0.4]).normalize();
  const sunAz = new THREE.Vector2(sunDir.x, sunDir.z); if (sunAz.lengthSq() < 1e-6) sunAz.set(1, 0); sunAz.normalize();

  // the river the released butterflies join (local space)
  let river;
  if (opts.riverPoints && opts.riverPoints.length >= 2) {
    const pts = opts.riverPoints.map((p) => (p.isVector3 ? p.clone() : new THREE.Vector3(p[0], p[1], p[2])));
    river = pts.length === 8 ? pts : new THREE.CatmullRomCurve3(pts, false, 'centripetal').getSpacedPoints(7);
  } else {
    river = []; const mz = rng.range(0, 6.28);
    for (let i = 0; i < 8; i++) {
      const z = 10 + i * 30;
      river.push(new THREE.Vector3(i ? Math.sin(mz + i * 0.9) * 3.0 : 0, lerp(11, 4.5, smoothstep(0, 2.2, i)) - slope * z, z));
    }
  }
  let riverLen = 0; for (let i = 1; i < 8; i++) riverLen += river[i].distanceTo(river[i - 1]);

  const Y0 = H + 6.5;
  const U = {
    uTe: { value: -2 }, uTime: { value: 0 }, uY0: { value: Y0 }, uSpeed: { value: SPEED }, uAfter: { value: opts.afterLight ?? 0.6 },
    uSunH: { value: new THREE.Vector3(sunAz.x, sunAz.y, SUN_SLOPE) }, uSunDir: { value: sunDir.clone() },
    uSpring: { value: 0.39 },
    uShaftCol: { value: new THREE.Color(pal[5]).multiplyScalar(2.3) },
    uOrange: { value: new THREE.Color(pal[6]) }, uWing: { value: wingC.clone() },
    uAmb: { value: new THREE.Color(pal[0]).multiplyScalar(0.62) },
    uFill: { value: new THREE.Color(pal[0]).multiplyScalar(opts.fill ?? 0.5) },
    uNeedle: { value: new THREE.Color(pal[2]).lerp(new THREE.Color('#c9b46a'), 0.45).multiplyScalar(1.6) },
    uRiver: { value: river }, uRiverLen: { value: riverLen }, uSize: { value: 0.12 }, uSlope: { value: slope },
    uLinger: { value: 0.16 }, uRime: { value: 0 }, uWarm: { value: 0 }, uBurst: { value: opts.burst ?? 0.6 },
  };

  const object = new THREE.Group(); object.name = 'great-bough-tree';
  let tree;
  { const it = buildTreeGen(ctx, P, tpal); let r; while (!(r = it.next()).done) await ctx.yield?.(); tree = r.value; }
  await ctx.yield?.();
  await ctx.yield?.();
  const treeMesh = new THREE.Mesh(tree.geometry, makeTreeMaterial(U, tpal));
  treeMesh.name = 'great-bough'; treeMesh.frustumCulled = false;
  object.add(treeMesh);
  await ctx.yield?.();
  const flyers = makeFlyers(ctx, U, tree, P); object.add(flyers);
  await ctx.yield?.();
  const needles = makeNeedles(ctx, U, tree, P); object.add(needles);
  await ctx.yield?.();
  let shaft = null;
  const SHAFT_LEN = 170, SHAFT_R = 7.5;
  if (opts.shaft !== false) {
    shaft = makeShaft(U); shaft.material.uniforms.uLen.value = SHAFT_LEN;
    shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sunDir);
    shaft.scale.set(SHAFT_R, SHAFT_LEN, SHAFT_R * 1.15);
    object.add(shaft);
  }

  // ---- anchors ----
  const tips = tree.limbTips.slice().sort((a, b) => a.y - b.y).slice(0, 24);
  const limbTips = []; for (let i = 0; i < 6; i++) limbTips.push(tips[Math.floor(rng() * tips.length)].clone());
  const top = tree.trunkAt(H, new THREE.Vector3());
  const anchors = {
    crown: top.clone(),
    revealHold: new THREE.Vector3(-21, 7, -21),
    revealLook: new THREE.Vector3(0, H * 0.62, 0),
    flyThrough: [[-21, 7, -21], [-22.5, 7, -8], [-21.5, 6.6, 6], [-16, 6.2, 21], [-7.5, 5.6, 36], [-2, 5, 52], [0, 4.6, 74]]
      .map((p) => new THREE.Vector3(p[0], p[1] - slope * p[2], p[2])),
    riverMouth: river[1].clone(), riverDir: river[2].clone().sub(river[1]).normalize(),
    riverPoints: river.map((p) => p.clone()),
    portalSeat: { position: river[7].clone().add(new THREE.Vector3(0, 2.5, 0)), facing: river[6].clone().sub(river[7]).setY(0).normalize() },
    sunDir: sunDir.clone(), limbTips,
  };

  // ---- the event clock ----
  let manualTe = null, te = -2;
  const shaftGain = opts.shaftGain ?? 0.2, foot = new THREE.Vector3(0, 0, 0);
  const frontYAt = (t) => Y0 - SPEED * t;
  const _hit = new THREE.Vector3();
  function apply(time) {
    te = manualTe !== null ? manualTe : (((time - 6.7) % 18) + 18) % 18 - 2;      // looping demo until driven
    U.uTe.value = te; U.uTime.value = time;
    if (shaft) {
      // the shaft's centre line meets the trunk 7.5 m above the leading edge; once it reaches the
      // ground it slides away downhill and fades
      const yc = frontYAt(te) + SHAFT_R;
      const run = Math.max(0, 3 - yc) * 1.07;
      _hit.set(0, Math.max(yc, 3) - slope * run, run);
      const back = (_hit.y + slope * run + 14) / Math.max(sunDir.y, 0.2);
      shaft.position.copy(_hit).addScaledVector(sunDir, -back);
      shaft.material.uniforms.uLow.value = 8 / SHAFT_LEN;
      shaft.updateMatrix(); shaft.material.uniforms.uLocal.value.copy(shaft.matrix);
      const vis = smoothstep(-0.8, 0.4, te) * (1 - smoothstep(25, 70, run));
      shaft.material.uniforms.uShaftI.value = shaftGain * vis;
      shaft.visible = vis > 0.001;
      const drop = Math.max(yc, 3) - 1;                           // the pool of light at the shaft's foot (local x, z, strength)
      foot.set(_hit.x - sunDir.x * drop / Math.max(sunDir.y, 0.2), _hit.z - sunDir.z * drop / Math.max(sunDir.y, 0.2), vis);
    }
  }
  apply(0);

  return {
    object, radius: 14, height: H, center: new THREE.Vector3(0, H * 0.5, 0), anchors,
    eventSeconds: EVENT_SECONDS, sweepSeconds: (Y0 + 5) / SPEED,
    setProgress(u) { manualTe = clamp(u, 0, 1) * EVENT_SECONDS; },
    setEventTime(sec) { manualTe = sec; },
    frontY() { return clamp(frontYAt(te), 0, H); },
    shaftFoot: foot,          // (local x, local z, strength 0..1) of the shaft's footprint on the ground, live
    uniforms: U, palette: tpal, yTop: Y0,
    // the same material for the lighter firs of the forest (instanced, see liteFirGeometry); over = uniforms of its own
    makeMaterial(over = {}) { return makeTreeMaterial({ ...U, ...over }, tpal); },
    flyers,                   // the flyer mesh (the world stops drawing it while nothing has been released)
    update(dt, time /*, camera */) { apply(time); },
    dispose() {},
    ground: true, groundY: 0,
    info: { cards: tree.cards, limbs: tree.nLimbs, treeTriangles: tree.triangles, flyers: P.flyers },
  };
}
