// HERO SET PIECE for "hoopwind-flats": THE GRAND WHEEL.
//
// What it is
//   A living hoop 220 m across standing on its keel on the salt. A horn rim 3 m thick, keeled and worn
//   chalk-white where it runs, its flanks stepped with ~460 short growth terraces (swept back from the keel in a
//   chevron, each drawn with three or four finer annuli; pale ivory, lilac in shade, amber only in the creases,
//   lichened rose and ochre) that turn as it rolls. Clasped in
//   the rim's inner edge runs an amber glass ballast tube in which a 26 m slug of plum fluid (the bead) rides
//   just ahead of the contact point, sloshing and leaving droplets. Stretched inside is a translucent
//   membrane graded rose (rim) -> amber -> sea-green round an open hub eye 58 m wide hemmed by a second,
//   smaller horn ring. 13 trunk veins root in the rim, run inward and fork twice (52 tips at the eye: an
//   iris), with a tree of venules and, close up, dragonfly-wing cells between them. The membrane drums,
//   salt leaves the keel as two streaked fan sheets (14 m across, 16 m long) plus grains and a trailing
//   skirt of salt smoke, ~300 saltpickers wheel in its wake and round the eye, and its stained-glass shadow
//   lies on the ground with the veins, the amber line of the tube and a sunlit hole in it.
//
// Frame (local space of hero.object)
//   origin = the contact point of the keel on the ground, +Y up. The disc stands in the XY plane and ROLLS
//   TOWARD -X. +Z is its PORT face: the face the camera rides along, climbs and looks at ("front"). The sun
//   of the brief is to starboard (-Z), so the +Z face is the backlit, glowing one. The wheel leans 7 deg
//   toward +Z, over the camera. The world moves/yaws hero.object along its hub spline; do not scale it.
//
// Size and cost
//   radius 112, height 220 (hub at about (0, 109, 13)). ~115k triangles (rim 59k, veins 14k, hub ring 8k,
//   membrane 16.6k drawn twice, fan + grains 4k, pickers 5k), 7 draw calls (6 without the shadow), no lights,
//   one 2048 x 2048 RGBA8 canvas texture (1024 when detail < 1), ~100-150 ms build.
//
// Lighting it expects
//   Every material is its own ShaderMaterial (linear HDR out, scene fog supported, nothing emissive: the
//   only values above 1 are sun glints on the keel and the glass tube, and the backlit membrane peaking
//   near 1.3 in its own hue). Each frame update() looks for the first DirectionalLight and HemisphereLight
//   in the scene the hero is in and uses them (direction; colour * intensity / PI, as MeshStandardMaterial
//   would). With no DirectionalLight it falls back to the brief: warm key #FFF1DC x 0.95 from starboard,
//   16 deg up (opts.sunDir, hero-local), lilac fill #B9B3E6 x 0.42, salt bounce. hero.setLight({ sunDir,
//   sunColor, skyColor, groundColor }) (world space, linear radiance) overrides both and stops the search.
//   Keep the sun 25 deg or more off the disc plane, on the -Z side for the brief's backlit climb.
//
// How the look is done (so the rest of the herd can match it)
//   * Membrane = one mesh drawn twice, depth-tested, no depth write: a MULTIPLY pass (blend ZERO, SRC_COLOR)
//     writing its transmittance T, then an ADD pass (ONE, ONE) writing milky sheen on the sunlit side, the
//     backlit glow T*T/max(T) * sun on the far side, a forward-scatter lobe toward the sun and grazing sky.
//     Fog: the multiply pass is left unfogged and the add pass outputs add*(1-f) + fogColor*f*(1-T).
//   * T = pow(tint, thickness) where tint is the palette swatch read as plain sRGB numbers (rose 0.95, 0.56,
//     0.65; amber 0.96, 0.70, 0.29; green 0.35, 0.78, 0.69) and thickness = density (2.0 on the pane, 1.25 in
//     the shadow) * (ripples + fibres + blotches) + venules + trunk halo. GLSL: MEM_OPTICS (paneTint/paneT).
//   * Veins: R of hero.veinTexture = trunk halo, G = venules, B = blotches, mapped uv = discXY / 220 + 0.5 in
//     the frame that turns with the wheel. Trunks are also real tubes that ride the drum displacement.
//   * Shadow (opts.shadow, default on): one quad in the disc plane; the vertex shader slides each corner
//     down the sun ray onto y = ground + 0.08; the fragment shader evaluates the same T in disc coordinates
//     (rim and bead 0, tube amber, eye 1, penumbra 1.4% of the source height, vein map blurred by mip bias)
//     and blends floor + (1 - floor) * T with (ZERO, SRC_COLOR), floor = sky / (sun * sin(elevation) + sky).
//     It multiplies whatever is already in the frame, so it works on any ground and mixes with other
//     multiplied shadows in any order. If the world has its own shadow buffer, pass shadow:false and draw the
//     Wheel there from anchors.bands (band radii and tints), anchors.hub and anchors.discNormal.
//
// opts
//   palette  [salt, lilac, rose, amber, sea-green, horn, plum] hex strings (brief default)
//   detail   0.6..1 (default ctx.quality.detail or 1): thins pickers and salt, halves the vein map, drops the cells
//   lean     radians toward +Z (default 7 deg)          veins   trunk count (13)
//   beadAhead 23 (m from contact to bead centre)        beadLength 26
//   terrace 1.5 (average length of a growth terrace on the rim, m; a far Wheel can take 2.6 and save 35k triangles)
//   shadow   true | false      shadowDensity 1.25       shadowSoft 1       shadowStrength 1
//   pickers  300 | false       fan 1 (salt strength)    drum 1 (membrane drum amplitude, ~1.4 m at 1)
//   density  2.0 (pane colour depth)   glow 0.9   clear 0.92   sunDir [x,y,z] hero-local fallback sun
//
// Runtime (all keyed by the world, none by wall clock except ambient loops)
//   update(dt, time, camera)   every frame
//   setRoll(angle)   radians = distance rolled / 110. Never called -> it turns once in 35 s by itself.
//                    Growth rings, veins and shadow turn with it; bead, fan and pickers stay with the contact.
//   setLean(angle)   for the herd's lean wave (anchors and hero.center follow)
//   setProgress(u) / setScatter(u)   0..1: the pickers scatter outward as the camera climbs the face
//   setGather(g)     0..1: the hub flock draws in and wheels across the eye (for the approach to it)
//   setDrum(a), setFan(a), setLight({...}); hero.uniforms holds the shared uniforms (uSunDir, uSunCol, ...)
//
// anchors (hero-local; portalSeat is null: this world's portal is the standing ring, not the Wheel)
//   contact (0,0,0), heading (-1,0,0), hub, discNormal (unit, toward port), sunSide (0,0,-1)
//   eye { position, normal, radius 28.9 }   clear opening of the hub ring
//   bead   centre of the plum slug in its tube (about 23 m ahead of the contact, 2.5 m up)
//   flyThrough  11 points in the WHEEL'S OWN FRAME (transform by hero.object.matrixWorld at the matching u):
//               in on the port side at y 8, 12 m off the rim past the contact and the bead, up the leaning
//               face 13.5 m off the membrane (rose, amber, green), through the eye 16 m from the hub ring,
//               out on the sun side. Clearance is 11 m or more everywhere (membrane drum included).
//   viewpoints  { reveal, contact, face, eye, sunward } each { position, target }
//   bands  { greenToAmber, amberToRose } radii in metres and tints { green, amber, rose } (Vector3 transmittance)
import * as THREE from 'three';

const TAU = Math.PI * 2;
const R = 110;          // keel radius
const R_TUBE = 105.35;  // centre line of the ballast tube
const R_MO = 104.2;     // membrane outer edge (inside the rim's hem)
const R_MI = 32.0;      // membrane inner edge (inside the hub ring's hem)
const R_HUB = 28.9;     // clear radius of the eye (hub ring keel)
const DEFAULT_PALETTE = ['#C9C0AE', '#B9B3E6', '#F28FA6', '#F5B24A', '#58C7B0', '#E8DCC0', '#5B4C8C'];

// ------------------------------------------------------------------ geometry accumulators
function makeAcc() { return { pos: [], aA: [], aB: [], idx: [], n: 0, seams: [] }; }

// growth terraces round a ring: three sections per terrace (proud lip, mid slope, foot of the next step)
function terraceRings(rng, circ, avgLen, ampBase) {
  const lens = []; let s = 0;
  while (s < circ) { const L = avgLen * rng.range(0.4, 1.8); lens.push(L); s += L; }
  const k = circ / s, rings = [];
  const skews = lens.map(() => 0.26 + rng.range(-0.09, 0.09)); skews.push(skews[0]);
  let a = 0, i = 0, burst = 0;
  for (const L0 of lens) {
    const L = L0 * k, da = (L / circ) * TAU, seed = rng();
    if (burst <= 0 && rng.chance(0.12)) burst = rng.int(1, 2);
    const major = burst > 0; burst--;
    const amp = ampBase * (major ? rng.range(1.3, 1.9) : rng.range(0.25, 0.8));
    const stepF = Math.min(0.16, L * 0.1) / L;
    rings.push({ a, h: 1, edge: 1, seed, amp, skew: skews[i] });
    rings.push({ a: a + da * rng.range(0.38, 0.52), h: rng.range(0.38, 0.55), edge: 0, seed, amp, skew: (skews[i] + skews[i + 1]) * 0.5 });
    rings.push({ a: a + da * (1 - stepF), h: 0, edge: 1, seed, amp, skew: skews[i + 1] });
    a += da; i++;
  }
  return rings;
}

// sweep a closed profile [{r,z,terr,wear,kind,pc}] round the hub axis through the terrace rings
async function sweepRing(acc, prof, rings, cr, flip, arcR, wob, keelR, ctx) {
  const base = acc.n, P = prof.length, NR = rings.length + 1;
  for (let i = 0; i < NR; i++) {
    if ((i & 31) === 0) await ctx.yield?.();
    const rg = rings[i % rings.length], a = i === rings.length ? TAU : rg.a;
    const lf = wob * (Math.sin(a * 9 + 1.3) * 0.6 + Math.sin(a * 23 + 4.1) * 0.4);
    for (let j = 0; j < P; j++) {
      const p = prof[j];
      const dr = p.r - cr, dz = p.z, l = Math.hypot(dr, dz) || 1;
      const d = p.terr * (rg.amp * rg.h + lf);
      const r = p.r + (dr / l) * d, z = p.z + (dz / l) * d;
      // growth rings sweep back from the keel in a chevron, like the annuli of a ram's horn
      const ak = a + (rg.skew * Math.hypot(p.r - keelR, p.z * 0.6)) / p.r, ca = Math.cos(ak), sa = Math.sin(ak);
      acc.pos.push(r * ca, r * sa, z);
      acc.aA.push(p.kind, p.wear, rg.h, rg.edge);
      acc.aB.push(a * arcR, p.pc, rg.seed);
    }
  }
  for (let i = 0; i < NR - 1; i++) {
    if ((i & 127) === 0) await ctx.yield?.();
    for (let j = 0; j < P - 1; j++) {
      const a = base + i * P + j, b = a + P, c = a + 1, d = b + 1;
      if (flip) acc.idx.push(a, c, b, b, c, d); else acc.idx.push(a, b, c, b, d, c);
    }
  }
  acc.seams.push({ a: base, b: base + (NR - 1) * P, n: P });
  acc.n += NR * P;
}

function mirrorProfile(half) {
  const out = half.map((p) => ({ terr: 0, wear: 0, kind: 0, pc: 0, ...p }));
  for (let i = half.length - 1; i >= 0; i--) { const p = out[i]; out.push({ ...p, z: -p.z }); }
  return out;
}

const RIM_HALF = [
  { r: 110.0, z: 0.0, terr: 0.04, wear: 1 },
  { r: 109.62, z: 0.3, terr: 0.14, wear: 0.9 },
  { r: 109.05, z: 0.86, terr: 0.38, wear: 0.7 },
  { r: 108.2, z: 1.38, terr: 1, wear: 0.05 },
  { r: 107.35, z: 1.52, terr: 1 },
  { r: 106.7, z: 1.4, terr: 0.8 },
  { r: 106.3, z: 1.12, terr: 0.45 },
  { r: 106.18, z: 0.8, terr: 0.1 },
  { r: 106.18, z: 0.8, kind: 1, pc: -1 },
  { r: 105.92, z: 0.93, kind: 1, pc: -0.6 },
  { r: 105.5, z: 1.02, kind: 1, pc: -0.2 },
  { r: 105.1, z: 0.98, kind: 1, pc: 0.2 },
  { r: 104.78, z: 0.8, kind: 1, pc: 0.6 },
  { r: 104.58, z: 0.5, kind: 1, pc: 1 },
  { r: 104.58, z: 0.5, terr: 0.12 },
  { r: 104.3, z: 0.24, terr: 0.1 },
  { r: 103.85, z: 0.05 },
];
// hub ring: keel toward the eye; listed hem -> keel so the mirrored loop winds outward-facing
const HUB_HALF = [
  { r: 32.3, z: 0.06 },
  { r: 31.85, z: 0.34, terr: 0.3 },
  { r: 31.4, z: 0.66, terr: 0.7 },
  { r: 30.7, z: 0.86, terr: 1 },
  { r: 29.9, z: 0.72, terr: 0.8, wear: 0.1 },
  { r: 29.2, z: 0.3, terr: 0.2, wear: 0.85 },
  { r: R_HUB, z: 0.0, terr: 0.04, wear: 1 },
];

// ------------------------------------------------------------------ veins: 13 trunks rooted in the rim, forking twice
function buildVeinPaths(rng, count) {
  const branches = [], d = TAU / count, off = rng() * TAU;
  const sm = (t) => t * t * (3 - 2 * t);
  const run = (tha, thb, ra, rb, n, wA, wB, level, flareA, flareB) => {
    const pts = [], ph = rng() * TAU, fr = rng.range(1.4, 2.6), amp = rng.range(0.006, 0.014) * (level ? 0.6 : 1);
    for (let i = 0; i <= n; i++) {
      const t = i / n, r = ra + (rb - ra) * t;
      const th = tha + (thb - tha) * sm(t) + amp * Math.sin(Math.PI * t) * Math.sin(t * fr * Math.PI + ph);
      let w = wA + (wB - wA) * t;
      if (flareA) w += flareA * Math.exp(-(ra - r) / 2.2);
      if (flareB) w += flareB * Math.exp(-(r - rb) / 1.3);
      pts.push({ x: r * Math.cos(th), y: r * Math.sin(th), w, r, th });
    }
    branches.push({ pts, level, seed: rng() });
    return thb;
  };
  for (let k = 0; k < count; k++) {
    const th0 = off + k * d + rng.range(-0.16, 0.16) * d;
    const r1 = rng.range(72, 83), r2a = rng.range(47, 58), r2b = rng.range(47, 58);
    run(th0, th0, R_MO + 0.5, r1, 18, 0.82, 0.64, 0, 0.9, 0);
    let c = 0;
    for (const sgn of [-1, 1]) {
      const r2 = c++ ? r2b : r2a;
      const th1 = th0 + sgn * d * 0.25 * (1 + rng.range(-0.14, 0.14));
      run(th0, th1, r1, r2, 14, 0.56, 0.44, 1, 0, 0);
      for (const s2 of [-1, 1]) {
        const th2 = th1 + s2 * d * 0.125 * (1 + rng.range(-0.16, 0.16));
        run(th1, th2, r2, R_MI - 0.1, 11, 0.36, 0.2, 2, 0, 0.22);
      }
    }
  }
  branches.off = off;
  return branches;
}

async function addVeinTubes(acc, branches, ctx) {
  const K = 6; let nb = 0;
  for (const br of branches) {
    if ((nb++ & 7) === 0) await ctx.yield?.();
    const base = acc.n, pts = br.pts, n = pts.length;
    let arc = 0;
    for (let i = 0; i < n; i++) {
      const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b.x - a.x, ty = b.y - a.y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      if (i > 0) arc += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y);
      const node = 1 + 0.12 * Math.sin(arc * 1.9 + br.seed * 40);   // faint knuckles along the vein
      for (let m = 0; m < K; m++) {
        const f = (m / K) * TAU, c = Math.cos(f) * p.w * 0.5 * node, s = Math.sin(f) * p.w * 0.4 * node;
        acc.pos.push(p.x - ty * c, p.y + tx * c, s);
        acc.aA.push(2, 0, 0, 0);
        acc.aB.push(arc, br.level, br.seed);
      }
    }
    for (let i = 0; i < n - 1; i++) for (let m = 0; m < K; m++) {
      const a = base + i * K + m, b = base + (i + 1) * K + m, c = base + i * K + ((m + 1) % K), d = base + (i + 1) * K + ((m + 1) % K);
      acc.idx.push(a, c, b, b, c, d);
    }
    acc.n += n * K;
  }
}

// BufferGeometry.computeVertexNormals() for an indexed geometry, call for call (the same Vector3 arithmetic in
// the same order, so the normals are the same to the last bit), handing the page back between slices
async function vertexNormalsInSlices(g, ctx) {
  const index = g.index, pos = g.getAttribute('position');
  const nor = new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3);
  g.setAttribute('normal', nor);
  const pA = new THREE.Vector3(), pB = new THREE.Vector3(), pC = new THREE.Vector3();
  const nA = new THREE.Vector3(), nB = new THREE.Vector3(), nC = new THREE.Vector3(), cb = new THREE.Vector3(), ab = new THREE.Vector3();
  for (let i = 0, il = index.count; i < il; i += 3) {
    if (i % 3072 === 0) await ctx.yield?.();
    const vA = index.getX(i + 0), vB = index.getX(i + 1), vC = index.getX(i + 2);
    pA.fromBufferAttribute(pos, vA); pB.fromBufferAttribute(pos, vB); pC.fromBufferAttribute(pos, vC);
    cb.subVectors(pC, pB); ab.subVectors(pA, pB); cb.cross(ab);
    nA.fromBufferAttribute(nor, vA); nB.fromBufferAttribute(nor, vB); nC.fromBufferAttribute(nor, vC);
    nA.add(cb); nB.add(cb); nC.add(cb);
    nor.setXYZ(vA, nA.x, nA.y, nA.z); nor.setXYZ(vB, nB.x, nB.y, nB.z); nor.setXYZ(vC, nC.x, nC.y, nC.z);
  }
  for (let i = 0, il = nor.count; i < il; i++) {
    if ((i & 2047) === 0) await ctx.yield?.();
    pA.fromBufferAttribute(nor, i); pA.normalize(); nor.setXYZ(i, pA.x, pA.y, pA.z);
  }
  nor.needsUpdate = true;
}

async function finishHorn(acc, ctx) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.pos, 3));
  await ctx.yield?.();
  g.setAttribute('aA', new THREE.Float32BufferAttribute(acc.aA, 4));
  g.setAttribute('aB', new THREE.Float32BufferAttribute(acc.aB, 3));
  await ctx.yield?.();
  g.setIndex(acc.n > 65535 ? new THREE.Uint32BufferAttribute(acc.idx, 1) : new THREE.Uint16BufferAttribute(acc.idx, 1));
  await ctx.yield?.();
  await vertexNormalsInSlices(g, ctx);
  await ctx.yield?.();
  const nr = g.attributes.normal.array;
  for (const s of acc.seams) for (let j = 0; j < s.n; j++) {   // weld the normals across each ring's closing seam
    const a = (s.a + j) * 3, b = (s.b + j) * 3;
    let x = nr[a] + nr[b], y = nr[a + 1] + nr[b + 1], z = nr[a + 2] + nr[b + 2];
    const l = Math.hypot(x, y, z) || 1; x /= l; y /= l; z /= l;
    nr[a] = nr[b] = x; nr[a + 1] = nr[b + 1] = y; nr[a + 2] = nr[b + 2] = z;
  }
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), R + 4);
  return g;
}

// ------------------------------------------------------------------ vein map (R trunk halo, G venules, B blotches)
async function buildVeinTexture(rng, branches, size, ctx) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const c = cv.getContext('2d'), S = size, m2p = S / (2 * R);
  const X = (x) => (0.5 + x / (2 * R)) * S, Y = (y) => (0.5 - y / (2 * R)) * S;
  c.fillStyle = '#000'; c.fillRect(0, 0, S, S);
  await ctx.yield?.();
  c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
  // blotches: slow thickness variation of the pane
  for (let i = 0; i < 260; i++) {
    if ((i & 31) === 0) await ctx.yield?.();
    const r = Math.sqrt(rng.range(0.09, 0.92)) * R, th = rng() * TAU, x = X(r * Math.cos(th)), y = Y(r * Math.sin(th));
    const rad = rng.range(3, 15) * m2p, g = c.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, 'rgba(0,0,255,' + rng.range(0.1, 0.3).toFixed(3) + ')'); g.addColorStop(1, 'rgba(0,0,255,0)');
    c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  const seg = (ax, ay, bx, by, w, style) => { c.strokeStyle = style; c.lineWidth = Math.max(1, w * m2p); c.beginPath(); c.moveTo(X(ax), Y(ay)); c.lineTo(X(bx), Y(by)); c.stroke(); };
  // venules: leave each vein obliquely, curl back toward the eye, twig once
  const twig = (x, y, dir, len, w, depth) => {
    let px = x, py = y, d = dir; const n = 5, bend = rng.range(-0.5, 0.5);
    for (let i = 0; i < n; i++) {
      const rr = Math.hypot(px, py), inward = Math.atan2(-py, -px);
      let dd = inward - d; dd = Math.atan2(Math.sin(dd), Math.cos(dd));
      d += dd * 0.16 + bend / n;
      const nx = px + Math.cos(d) * len / n, ny = py + Math.sin(d) * len / n, nr2 = Math.hypot(nx, ny);
      if (nr2 > R_MO - 0.3 || nr2 < R_MI + 0.3 || rr < R_MI) return;
      seg(px, py, nx, ny, w * (1 - 0.5 * i / n), 'rgba(0,255,0,0.85)');
      if (depth > 0 && i > 0 && rng.chance(0.7)) twig(nx, ny, d + rng.sign() * rng.range(0.5, 1.0), len * rng.range(0.3, 0.5), w * 0.55, depth - 1);
      px = nx; py = ny;
    }
  };
  for (const br of branches) {
    await ctx.yield?.();
    const pts = br.pts; let side = rng.sign(), acc = rng.range(0, 3);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], L = Math.hypot(b.x - a.x, b.y - a.y), dir = Math.atan2(b.y - a.y, b.x - a.x);
      acc += L;
      const pitch = 1.6 + b.r * 0.026;
      while (acc > pitch) {
        await ctx.yield?.();
        acc -= pitch; const t = rng();
        const len = b.r * rng.range(0.07, 0.17) * (br.level === 0 ? 1.25 : 1);
        twig(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, dir + side * rng.range(0.45, 0.95), len, 0.3, 2);
        side = -side;
      }
    }
  }
  // trunks and forks: soft halo, then core
  for (const br of branches) {
    await ctx.yield?.();
    for (let i = 1; i < br.pts.length; i++) {
      const a = br.pts[i - 1], b = br.pts[i], w = (a.w + b.w) * 0.5;
      seg(a.x, a.y, b.x, b.y, w * 3.4, 'rgba(255,0,0,0.16)');
      seg(a.x, a.y, b.x, b.y, w * 2.0, 'rgba(255,0,0,0.3)');
      seg(a.x, a.y, b.x, b.y, w * 1.05, 'rgba(255,0,0,1)');
    }
  }
  await ctx.yield?.();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 8; tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
  return tex;
}

// ------------------------------------------------------------------ GLSL shared by every material of the Wheel
const GLSL_COMMON = /* glsl */`
const float PI = 3.14159265;
const float RR = ${R.toFixed(1)};
const float RO = ${R_MO.toFixed(2)};
const float RI = ${R_MI.toFixed(2)};
uniform float uTime, uRoll, uDrum, uGroundY;
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol;
vec3 nrm(vec3 v){ return v / max(length(v), 1e-5); }
float hash11(float n){ return fract(sin(n) * 43758.5453); }
float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y);
}
float fbm(vec2 p){ return vnoise(p) * .5 + vnoise(p * 2.03 + 7.1) * .3 + vnoise(p * 4.1 + 3.7) * .2; }
vec2 unroll(vec2 p){ float c = cos(uRoll), s = sin(uRoll); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
// drum displacement of the membrane (metres along the hub axis); p = disc coordinates that turn with the wheel
float drumH(vec2 p){
  float r = length(p);
  float e = clamp((r - RI) / (RO - RI), 0., 1.);
  float env = sin(PI * e);
  vec2 q = unroll(p);
  float a = atan(q.y, q.x + step(r, 1e-4));
  float h = .55 * sin(2. * a - .9 * uTime) + .42 * sin(3. * a + 1.4 * uTime + 2. * e)
          + .3 * sin(5. * a - 2.1 * uTime) * sin(2. * PI * e) + .11 * sin(q.x * .33 + q.y * .07 + uTime * 4.6);
  return h * env * uDrum;
}
float fogF(float depth, float density, float nearV, float farV){
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      return 1. - exp(-density * density * depth * depth);
    #else
      return smoothstep(nearV, farV, depth);
    #endif
  #else
    return 0.;
  #endif
}
`;

// ------------------------------------------------------------------ horn: rim, ballast tube, veins, hub ring
const HORN_VERT = /* glsl */`
attribute vec4 aA; attribute vec3 aB;
varying vec4 vA; varying vec3 vB; varying vec3 vN; varying vec3 vW; varying vec3 vP;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  vec3 p = position; vec3 n = normal;
  if (aA.x > 1.5) {
    float h = drumH(p.xy), d = 1.5;
    float hx = (drumH(p.xy + vec2(d, 0.)) - h) / d, hy = (drumH(p.xy + vec2(0., d)) - h) / d;
    p.z += h; n = n - vec3(hx, hy, 0.) * n.z;
  }
  vA = aA; vB = aB; vP = position;
  vec4 wp = modelMatrix * vec4(p, 1.);
  vW = wp.xyz; vN = nrm(mat3(modelMatrix) * n);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const HORN_FRAG = /* glsl */`
uniform vec3 uHorn, uAmber, uRose, uOchre, uPlum, uSalt;
uniform vec2 uBead;
varying vec4 vA; varying vec3 vB; varying vec3 vN; varying vec3 vW; varying vec3 vP;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  vec3 N = nrm(vN);
  vec3 V = nrm(cameraPosition - vW);
  float kind = vA.x, wear = vA.y, h = vA.z, edge = vA.w;
  float s = vB.x, seed = vB.z;
  float fw = fwidth(s);
  float isVein = step(1.5, kind);
  float isGlass = step(.5, kind) * (1. - isVein);
  float rr = length(vP.xy);
  float n1 = fbm(vec2(s * .35, vP.z * .6 + seed * 9.));
  float n2 = vnoise(vec2(s * 3.1, vP.z * 2.3 + rr * 2.3));
  float nl = dot(N, uSunDir);
  float dif = max(nl, 0.), back = max(-nl, 0.);
  vec3 hemi = mix(uGndCol, uSkyCol, N.y * .5 + .5);
  vec3 H = nrm(uSunDir + V + vec3(0., 1e-4, 0.));
  float nh = max(dot(N, H), 1e-4);
  float lit1 = step(0., nl);

  // ---- horn
  // pale ivory, built in annuli like a ram's horn: three or four fine growth rings to every terrace, each rising
  // fast and falling slowly, amber only in the creases (no long fibres: those read as timber)
  vec3 horn = uHorn * (.68 + .26 * n1);
  float streak = vnoise(vec2(s * .12 + seed * 3., rr * 6. + vP.z * 4.));
  horn *= .93 + .14 * streak;
  float gl = s / .36 + .9 * n1 + seed * 3.;
  float gf = fract(gl), gA = clamp(1. - fw * 4.5, 0., 1.) * (1. - isVein);
  float gstep = smoothstep(0., .16, gf) * (1. - .6 * gf);
  horn *= mix(1., .66 + .46 * gstep, gA);
  horn = mix(horn, uAmber * .5, gA * (1. - smoothstep(0., .14, gf)) * .55 * step(.45, hash21(vec2(floor(gl), 7.))));
  float band = smoothstep(.34, .04, h) * (.3 + .7 * seed);
  horn = mix(horn, uAmber * .46, band * .5 * (1. - isVein));
  float rid = sin(s * 38. + n2 * 2.5), ridA = clamp(1. - fw * 23., 0., 1.);
  horn *= 1. - .17 * ridA * (.5 + .5 * rid);
  float rid2 = smoothstep(.72, 1., sin(s * 11.3 + n1 * 5.)) * clamp(1. - fw * 7., 0., 1.);
  horn *= 1. - .2 * rid2;
  float crev = edge * (1. - h);
  horn *= 1. - .62 * crev * crev;
  horn = mix(horn, vec3(.8, .76, .66), .4 * edge * smoothstep(.6, 1., h));
  float lich = smoothstep(.46, .68, fbm(vec2(s * .21 + 3., vP.z * .9 + seed * 5.))) * smoothstep(.5, .05, h) * (1. - isVein);
  vec3 lichCol = mix(uRose * .62, uOchre, step(.55, fract(seed * 7.31)));
  horn = mix(horn, lichCol * (.7 + .5 * n2), lich * .75);
  // the hub ring is never run on: its keel keeps its horn (ivory, amber bands) instead of wearing to chalk,
  // and it takes the sun a little under the rim's so its lit side never clips when we pass it in the eye
  float hubK = smoothstep(42., 35., rr) * (1. - isVein);
  float kw = smoothstep(.3, .8, wear + (n2 - .5) * .4 + (n1 - .5) * .3) * (1. - .3 * hubK);
  horn = mix(horn, horn * vec3(1.1, 1.07, 1.) + uHorn * .08, hubK);      // the same pale horn as the rim, a pale hem round the opening
  horn = mix(horn, vec3(.9, .89, .86), kw);          // the keel, worn chalk white where it runs
  // veins: dark plum horn with knuckled rings
  vec3 veinCol = mix(uPlum * .6, uHorn * .42, .25 + .5 * n1) * (1. - .25 * (.5 + .5 * rid) * ridA);
  horn = mix(horn, veinCol, isVein);
  // salt dust clings low on the wheel
  float dust = smoothstep(10., 0., vW.y - uGroundY) * (.25 + .5 * n2) * (1. - isGlass);
  horn = mix(horn, uSalt, dust * (.18 + .3 * crev));
  // in shade the horn takes the lilac of the sky (the pan under the Wheel lies in its shadow and gives little back)
  vec3 fill = mix(hemi, mix(uGndCol * .6, uSkyCol * 2.9, N.y * .5 + .5), 1. - isVein);
  vec3 col = horn * (uSunCol * dif * (1. - .3 * hubK) + fill);
  col += horn * uAmber * uSunCol * back * .035 * (1. - isVein);        // thick horn lets very little amber through
  float sp = pow(nh, 36.) * .3 + pow(nh, 240.) * kw * 5. * step(.5, n2);
  col += uSunCol * sp * lit1 * (1. - .6 * isVein);
  float vf = 1. - max(dot(N, V), 0.);
  col += isVein * vec3(.9, .24, .2) * uSunCol * vf * vf * (.2 + .8 * back) * .55;   // thin vein edges let the sun through

  // ---- ballast tube: amber glass, plum bead riding ahead of the contact
  vec2 q = unroll(vP.xy);
  float ang = atan(q.x, -q.y + step(rr, 1e-4));       // 0 at the contact, negative ahead (toward -X)
  float arc = ang * ${R_TUBE.toFixed(2)};
  float pc = vB.y;
  float along = -arc - uBead.x + .7 * sin(uTime * 1.1);
  float halfL = uBead.y + .8 * pc * sin(uTime * 1.7) + .4 * sin(uTime * 2.9 + pc * 2.);
  float endd = abs(along) - halfL;
  // (the slug rides inside the glass: amber wall on either side of it, a rounded meniscus at each end)
  float bead = smoothstep(.45, -.45, endd) * smoothstep(.86, .6, abs(pc) + smoothstep(-3.5, 0., endd) * .5);
  float behind = -along - halfL;
  float drops = step(0., behind) * smoothstep(22., 0., behind) * smoothstep(.7, .8, vnoise(vec2(s * 1.1, pc * 2.5 + seed)));
  bead = max(bead, drops * .85);
  float thick = 1. - pc * pc * .6;
  vec3 honey = mix(uAmber, vec3(1., .74, .3), .2);                   // clear glass, lit from behind: the plum slug reads dark in it
  // a rod of honey glass: clear down its middle (the terraces behind show dimly through it), dense toward its edges
  vec3 through = col * mix(honey, vec3(1.), .5) * 1.3;
  float dense = mix(.12, .96, pc * pc);
  vec3 g = mix(through, honey * (.2 + .34 * thick) * (uSunCol * dif * .8 + hemi), dense);
  vec3 slug = mix(uPlum, vec3(.5, .1, .42), .45) * (.34 + .3 * thick);      // plum wine: a colour, not a gap in the glass
  g = mix(g, slug * (uSunCol * (dif * .8 + back * .35) + hemi * 1.5), bead);
  float clear = 1. - bead * .94;
  float fwd = max(dot(-V, uSunDir), 0.); fwd *= fwd; fwd *= fwd;
  g += honey * uSunCol * clear * (.22 + .78 * thick * thick) * (back * .5 + fwd * .8 + .2) * .42 * (.35 + .65 * dense);     // darker toward its edges, like a rod of glass
  float bub = smoothstep(.86, .96, vnoise(vec2(s * 2.2 - uTime * .9, pc * 4. + uTime * .35)));
  g += honey * .3 * bub * clear;
  float f1 = 1. - max(dot(N, V), 0.); f1 *= f1; f1 *= f1;
  g += uSkyCol * f1 * mix(1.5, .5, bead) + uSunCol * pow(nh, 160.) * 6. * lit1;
  float hl = smoothstep(.07, 0., abs(pc + .4));                               // one hard line of window light along the glass
  g += (uSkyCol * 3.2 + uSunCol * .9 * lit1) * hl * (1. - .4 * bead);
  g += uAmber * uAmber * uSunCol * smoothstep(.22, 0., abs(pc - .5)) * .7 * clear * lit1;   // caustic on the far wall
  col = mix(col, g, isGlass);

  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------ membrane: one mesh drawn twice (multiply, then add)
const MEM_OPTICS = /* glsl */`
uniform sampler2D uVein;
uniform vec3 uT0, uT1, uT2;      // transmittance of sea-green (eye), amber, rose (rim)
uniform vec4 uBand;              // band edges e1, e2, softness, seed
uniform vec3 uVeinA;             // trunk count, angle of trunk 0, pane density
// p: disc coordinates turning with the wheel. returns the tint of the pane at that point
vec3 paneTint(vec2 p, float e, float a){
  float k = uVeinA.x * (a - uVeinA.y);
  // the bands are scalloped by the veins: rose runs inward along each trunk, green reaches out between forks
  float wob = .042 * cos(k) * smoothstep(0., .5, e) - .028 * cos(2. * k) + .022 * cos(4. * k) * (1. - e)
            + .03 * sin(a * 5. + uBand.w) + .13 * (vnoise(p * .04 + uBand.w) - .5);
  float ee = e + wob;
  vec3 t = mix(uT0, uT1, smoothstep(uBand.x - uBand.z, uBand.x + uBand.z, ee));
  t = mix(t, uT2, smoothstep(uBand.y - uBand.z, uBand.y + uBand.z, ee));
  return mix(t, vec3(1.), .2 * smoothstep(.4, 0., e));      // paler toward the eye
}
// reticulation between the venules, like the cells of a dragonfly wing (F2 - F1 of a jittered grid, periodic in x)
float cellEdge(vec2 p){
  vec2 i = floor(p), f = fract(p); float d1 = 8., d2 = 8.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 c = i + g; c.x = mod(c.x, 256.);
    vec2 r = g + vec2(hash21(c), hash21(c + 17.3)) - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return sqrt(d2) - sqrt(d1);
}
// transmittance of the membrane at p given the vein map sample; fades = (stretch ripples, radial fibres, cells) 0..1
vec3 paneT(vec2 p, vec4 tx, vec3 fades, out vec3 tint, out float thick){
  float r = length(p);
  float e = clamp((r - RI) / (RO - RI), 0., 1.);
  float a = atan(p.y, p.x + step(r, 1e-4));
  tint = paneTint(p, e, a);
  float rip = .5 + .5 * sin(r * 2.1 + 5. * vnoise(p * .06) + 2. * vnoise(p * .31));
  float fine = .5 + .5 * sin(r * 14. + 6. * vnoise(p * .21));
  float fib = vnoise(vec2(a * 220., r * .07));
  float hem = smoothstep(.022, 0., e) + smoothstep(.982, 1., e);
  thick = uVeinA.z * (.78 + .1 * rip + .05 * fine * fades.x + .13 * fib * fades.y + .75 * tx.b)
        + 1.5 * tx.g + 3.5 * tx.r + 1.6 * hem;
  if (fades.z > 0.) thick += .85 * smoothstep(.1, 0., cellEdge(vec2(a * 40.7437, r * .55))) * fades.z * (1. - tx.r);
  return pow(max(tint, vec3(.02)), vec3(thick)) * (1. - .8 * tx.r) * (1. - .4 * tx.g) * (1. - .3 * hem);
}
`;

const MEM_VERT = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vRad; varying vec2 vP; varying float vDepth;
${GLSL_COMMON}
void main(){
  vec3 p = position;
  float h = drumH(p.xy), d = 1.2;
  float hx = (drumH(p.xy + vec2(d, 0.)) - h) / d, hy = (drumH(p.xy + vec2(0., d)) - h) / d;
  p.z += h;
  vP = position.xy;
  vec4 wp = modelMatrix * vec4(p, 1.);
  vW = wp.xyz;
  vN = nrm(mat3(modelMatrix) * vec3(-hx * 3., -hy * 3., 1.));   // tilt exaggerated so the sheen visibly slides
  vRad = mat3(modelMatrix) * vec3(position.xy / max(length(position.xy), 1e-3), 0.);
  vec4 mv = viewMatrix * wp;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const MEM_FRAG = /* glsl */`
uniform vec3 fogColor; uniform float fogDensity, fogNear, fogFar;
uniform float uGlow, uClear, uCells;
varying vec3 vW; varying vec3 vN; varying vec3 vRad; varying vec2 vP; varying float vDepth;
${GLSL_COMMON}
${MEM_OPTICS}
void main(){
  float r = length(vP);
  vec4 tx = texture2D(uVein, vP / (2. * RR) + .5);
  float fwr = fwidth(r);
  float fineFade = clamp(1. - fwr * 9., 0., 1.);
  vec3 fades = vec3(fineFade, clamp(1. - fwr / max(r, 1.) * 160., 0., 1.), clamp(1.3 - fwr * 8., 0., 1.) * uCells);
  vec3 tint; float thick;
  vec3 T = paneT(vP, tx, fades, tint, thick) * uClear;
  #ifdef PASS_MULTIPLY
    gl_FragColor = vec4(T, 1.);
  #else
    vec3 V = nrm(cameraPosition - vW);
    vec3 N = nrm(vN);
    if (dot(N, V) < 0.) N = -N;
    float k1 = cos(r * 2.1 + 5. * vnoise(vP * .06) + 2. * vnoise(vP * .31)) * .035 + cos(r * 14. + 6. * vnoise(vP * .21)) * .02 * fineFade;
    vec3 N2 = nrm(N + vRad * k1);
    float nl = dot(N, uSunDir);
    float veil = (1. - .85 * tx.r) * (1. - .5 * tx.g);
    // sunlit side: a milky sheen with dark veins
    vec3 sat = T * T / max(max(T.r, max(T.g, T.b)), 1e-3);
    vec3 milk = mix(sat, vec3(.9), .38) * (.17 + .1 * tx.b + .04 * thick);
    vec3 col = milk * (uSunCol * max(nl, 0.) + mix(uGndCol, uSkyCol, N.y * .5 + .5)) * veil;
    // backlit side: the pane glows with its own tint, like held-up sea glass
    float bl = max(-nl, 0.);
    float gl = smoothstep(0., .5, bl) * (.55 + .45 * bl);
    float fwd = max(dot(-V, uSunDir), 0.); fwd *= fwd; fwd *= fwd * fwd;
    col += sat * uSunCol * (gl * uGlow + fwd * .55);            // (.55: looking sunward through it must not clip)
    // sheen sliding over the stretch ripples, sky in the grazing reflection
    vec3 H = nrm(uSunDir + V + vec3(0., 1e-4, 0.));
    float nh = max(dot(N2, H), 1e-4);
    col += uSunCol * (pow(nh, 60.) * .6 + pow(nh, 18.) * .3 + pow(nh, 5.) * .12) * step(0., nl) * veil;
    float f1 = 1. - max(dot(N2, V), 0.); float fr = f1 * f1 * f1;
    col += uSkyCol * fr * .8;
    // vein bodies catch a little light of their own
    col += vec3(.2, .15, .16) * tx.r * (uSunCol * max(nl, 0.) + uSkyCol) * .5;
    float ff = fogF(vDepth, fogDensity, fogNear, fogFar);
    gl_FragColor = vec4(col * (1. - ff) + fogColor * ff * (1. - T), 1.);
  #endif
}`;

// ------------------------------------------------------------------ stained-glass shadow, slid along the sun ray onto the ground
const SHADOW_VERT = /* glsl */`
varying vec2 vD; varying float vH; varying float vDepth;
${GLSL_COMMON}
void main(){
  vec4 wp = modelMatrix * vec4(position.xy * RR, 0., 1.);
  float h = wp.y - uGroundY;
  vec3 gp = wp.xyz - uSunDir * (h / max(uSunDir.y, .05));
  gp.y = uGroundY + .08;
  vD = position.xy * RR; vH = h;
  vec4 mv = viewMatrix * vec4(gp, 1.);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const SHADOW_FRAG = /* glsl */`
uniform vec3 fogColor; uniform float fogDensity, fogNear, fogFar;
uniform float uClear, uSoft, uShadowK;
uniform vec3 uFloor, uAmberT;
uniform vec2 uBead;
varying vec2 vD; varying float vH; varying float vDepth;
${GLSL_COMMON}
${MEM_OPTICS}
void main(){
  float rm = length(vD);
  float hh = max(vH, 0.);
  float wm = .35 + .014 * hh * uSoft;                    // penumbra, metres in the disc: crisp at the foot
  float c = cos(uRoll), s = sin(uRoll);
  vec2 p = vec2(c * vD.x + s * vD.y, -s * vD.x + c * vD.y);   // into the turning frame of the pane
  vec4 tx = texture2D(uVein, p / (2. * RR) + .5, clamp(log2(1. + hh * .06 * max(uSoft, 0.)), 0., 5.));
  if (rm > RR + wm) discard;
  vec3 tint; float thick;
  vec3 T = paneT(p, tx, vec3(0.), tint, thick) * uClear;
  float ang = atan(vD.x, -vD.y + step(rm, 1e-4));
  float bead = smoothstep(1., -1., abs(-ang * ${R_TUBE.toFixed(2)} - uBead.x) - uBead.y);
  vec3 tube = uAmberT * .62 * (1. - bead);      // the amber window passes amber; the bead in it casts plain lilac
  vec3 Tt = vec3(1.);
  Tt = mix(Tt, vec3(0.), smoothstep(${R_HUB.toFixed(1)} - wm, ${R_HUB.toFixed(1)} + wm, rm));
  Tt = mix(Tt, T, smoothstep(32.3 - wm, 32.3 + wm, rm));
  Tt = mix(Tt, tube, smoothstep(104.5 - wm, 104.5 + wm, rm));
  Tt = mix(Tt, vec3(.1, .09, .13), smoothstep(108.3 - wm, 108.3 + wm, rm));      // rim, keel and bead cast plain lilac (no tint of the glass)      // the rim is horn: it passes nothing and casts plain lilac (the sky fill)
  Tt = mix(Tt, vec3(1.), smoothstep(RR - wm, RR + wm, rm));
  float ff = fogF(vDepth, fogDensity, fogNear, fogFar);
  vec3 o = uFloor + (1. - uFloor) * Tt;
  gl_FragColor = vec4(mix(vec3(1.), o, (1. - ff) * uShadowK), 1.);
}`;

// ------------------------------------------------------------------ salt: two fan wings off the keel and a trailing skirt of smoke
const FAN_GLSL = /* glsl */`
// ballistic position on the fan: u 0 (straight back) .. 1 (out to the side), side -1/+1, tt seconds since leaving the keel
vec3 fanPos(float u, float side, float tt, float jit){
  float phi = mix(.22, 1.32, u);
  float w = sin(u * 7. + uTime * 2.3 + side) * .5 + .5;
  float sp = mix(13.5, 8., u) * (.9 + .16 * w) * (1. + jit);
  float el = mix(.78, .28, u) + .06 * sin(u * 11. - uTime * 3.1) + jit;
  vec3 v = vec3(cos(phi) * sp * cos(el) + 5., sp * sin(el), side * sin(phi) * sp * cos(el));
  return vec3(0., .15, side * .6) + v * tt + vec3(0., -4.9 * tt * tt, 0.);
}
vec3 saltLight(vec3 wpos, vec3 org, vec3 discN, vec3 shadeTint){
  float sgn = dot(uSunDir, discN);
  float inSh = smoothstep(-.6, .6, -dot(wpos - org, discN) * (sgn < 0. ? -1. : 1.));
  // warm where the low sun strikes it, the Wheel's own tint inside its shadow, lilac from the sky: never white, never over the bloom threshold
  return uSunCol * vec3(1., .93, .8) * .7 * mix(vec3(1.), shadeTint, inSh * .5) + uSkyCol * vec3(.95, .92, 1.15) * 1.1;
}
`;

const SPRAY_VERT = /* glsl */`
attribute vec4 aS; attribute vec4 aS2;
uniform vec3 uSalt, uShadeTint, uDiscN;
uniform float uFan;
varying vec2 vUv; varying float vAl; varying vec3 vCol; varying float vSeed;
#include <fog_pars_vertex>
${GLSL_COMMON}
${FAN_GLSL}
void main(){
  float skirt = step(.6, aS.y);
  float life = mix(1.15, 3.4, skirt) * (.8 + .4 * aS2.w);
  float t = fract(uTime / life + aS.x), tt = t * life;
  float side = aS.z < .5 ? -1. : 1.;
  // fan: grains riding the same arcs as the sheet, a little scattered about it
  vec3 pf = fanPos(aS.w, side, tt, (aS2.x - .5) * .12) + vec3((aS2.z - .5) * 1.6, 0., 0.);
  float sf = mix(.14, 1.05, t) * (.6 + .8 * aS2.w);
  float af = smoothstep(0., .05, t) * (1. - t) * smoothstep(-.4, .5, pf.y) * .75;
  // skirt: salt smoke left behind, streaming back low over the pan
  float spk = mix(8., 19., aS2.x);
  vec3 pk = vec3(1.5 + spk * tt, .5 + (.5 + 3.2 * aS2.y) * sqrt(t), (aS.z - .5) * (3. + 16. * t) * (.5 + aS.w));
  float sk = mix(1.2, 5., t) * (.6 + .8 * aS2.w);
  float ak = smoothstep(0., .1, t) * (1. - t) * .1;
  vec3 p = mix(pf, pk, skirt);
  float size = mix(sf, sk, skirt);
  vAl = mix(af, ak, skirt) * uFan;
  vec4 wc = modelMatrix * vec4(p, 1.);
  vec4 org = modelMatrix * vec4(0., 0., 0., 1.);
  vCol = uSalt * saltLight(wc.xyz, org.xyz, uDiscN, uShadeTint) * (.9 + .2 * aS2.y);
  vUv = position.xy; vSeed = aS.x * 31.;
  vec4 mvPosition = viewMatrix * wc;
  vAl *= smoothstep(1.5, 7., -mvPosition.z);
  mvPosition.xy += position.xy * size;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// the fan itself: two thin sheets of salt, streaked, leaving the keel on ballistic arcs
const SHEET_VERT = /* glsl */`
uniform vec3 uSalt, uShadeTint, uDiscN;
varying vec2 vUv; varying vec3 vCol; varying float vNear;
#include <fog_pars_vertex>
${GLSL_COMMON}
${FAN_GLSL}
void main(){
  vec3 p = fanPos(position.x, position.z, position.y * 1.15, 0.);
  p.y = max(p.y, .06);
  vec4 wc = modelMatrix * vec4(p, 1.);
  vec4 org = modelMatrix * vec4(0., 0., 0., 1.);
  vCol = uSalt * saltLight(wc.xyz, org.xyz, uDiscN, uShadeTint);
  vUv = vec2(position.x + position.z * 3.7, position.y);
  vec4 mvPosition = viewMatrix * wc;
  vNear = smoothstep(2.5, 9., -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const SHEET_FRAG = /* glsl */`
uniform float uFan;
varying vec2 vUv; varying vec3 vCol; varying float vNear;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  float u = fract(vUv.x * .999), v = vUv.y;
  // thrown grains in streaks: fine across the fan, long along each arc
  float st = vnoise(vec2(vUv.x * 30., v * 4. - uTime * 3.4)) * .4 + vnoise(vec2(vUv.x * 83., v * 9. - uTime * 5.3)) * .33
           + vnoise(vec2(vUv.x * 190., v * 17. - uTime * 8.)) * .27;
  float a = smoothstep(.3, .58, st + .26 * (1. - v));
  a *= smoothstep(0., .04, v) * (1. - v * v) * smoothstep(1., .82, v) * smoothstep(0., .12, u) * smoothstep(1., .8, u) * uFan * vNear;      // (the sheet holds together all the way out and tears into streaks at its edge: a 14 m fan)
  a = min(a * 1.5, .94);
  if (a < .004) discard;
  gl_FragColor = vec4(min(vCol * mix(vec3(.8, .76, .95), vec3(1.06, 1.02, .96), smoothstep(.45, .8, st)), vec3(.98)), a);      // each streak lit on its crest, lilac in its own shade
  #include <fog_fragment>
}`;

const SPRAY_FRAG = /* glsl */`
varying vec2 vUv; varying float vAl; varying vec3 vCol; varying float vSeed;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  float d = length(vUv);
  float br = vnoise(vUv * 2.3 + vSeed);
  float a = smoothstep(1., .15, d + (br - .5) * .5) * vAl;
  if (a < .004) discard;
  gl_FragColor = vec4(min(vCol * mix(vec3(.82, .78, .96), vec3(1.04, 1., .95), smoothstep(.3, .75, br + .3 * vUv.y)), vec3(.98)), a);      // lit from above and sunward, lilac beneath
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------ saltpickers: dark tern-like fliers hanging in the wake and circling the eye
const BIRD_VERT = /* glsl */`
attribute vec4 aO; attribute vec4 aQ; attribute float aW;
uniform float uScatter, uLean, uGather;
varying vec3 vCol;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  float hub = step(.5, aQ.w);
  float rad = aO.w * (1. + uScatter * (.6 + 1.6 * aQ.x));
  // uGather: the hub flock draws in and wheels ACROSS the eye instead of round it (the world calls it as we come at the eye)
  rad *= mix(1., .16 + .62 * aQ.z, hub * uGather);
  float th = aQ.x * 6.2832 + uTime * aQ.y / max(aO.w, 1.) + uScatter * 2.5 * aQ.x;
  float al = mix(aQ.z * 6.2832, 0., hub), be = mix(.1 + .5 * fract(aQ.z * 7.7), 1.5708 - uLean, hub);
  vec3 e1 = vec3(cos(al), 0., sin(al));
  vec3 e2 = vec3(-sin(al) * cos(be), sin(be), cos(al) * cos(be));
  vec3 rdir = cos(th) * e1 + sin(th) * e2;
  vec3 c = aO.xyz + rdir * rad + (e1 * (fract(aQ.x * 5.3) - .5) * 30. + e2 * (fract(aQ.z * 3.7) - .5) * 22.) * hub * uGather;
  c.y += sin(uTime * .7 + aQ.x * 40.) * 1.5 + uScatter * 6. * (aQ.z - .3);
  vec3 fwd = -sin(th) * e1 + cos(th) * e2;
  vec3 upG = nrm(vec3(0., 1., 0.) - rdir * mix(.6, 1.5, hub));
  vec3 right = nrm(cross(fwd, upG));
  vec3 up = cross(right, fwd);
  // wing beat: bursts of flapping, then a glide
  float beat = sin(uTime * (7. + 3. * aQ.z) + aQ.x * 60. - aW * .9);
  float glide = smoothstep(-.2, .5, sin(uTime * .45 + aQ.x * 20.));
  vec3 lp = position;
  lp.y += aW * (beat * .5 * (1. - .75 * glide) + .12 * glide) * abs(lp.z);
  vec4 wc = modelMatrix * vec4(c, 1.);
  float dist = length(cameraPosition - wc.xyz);
  float sc = .65 * clamp(dist / 42., 1., 3.6);          // never under about 1% of the frame's height
  vec3 wp = wc.xyz + mat3(modelMatrix) * (fwd * lp.x + up * lp.y + right * lp.z) * sc;
  vec3 nW = nrm(mat3(modelMatrix) * (up + right * sign(lp.z) * aW * beat * .4));
  float under = step(lp.y, -.01);
  vec3 alb = mix(vec3(.07, .06, .1), vec3(.3, .29, .31), under * .6 + .15 * aW);
  vCol = alb * (uSunCol * max(dot(nW, uSunDir), 0.) + mix(uGndCol, uSkyCol, .5 + .5 * nW.y) * 1.2);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const BIRD_FRAG = /* glsl */`
varying vec3 vCol;
#include <fog_pars_fragment>
void main(){
  gl_FragColor = vec4(vCol, 1.);
  #include <fog_fragment>
}`;

function birdGeometry() {
  const P = [], W = [], I = [];
  const v = (x, y, z, w = 0) => { P.push(x, y, z); W.push(w); return P.length / 3 - 1; };
  // body: a slim spindle with a hooked head
  const nose = v(0.52, -0.02, 0), tail = v(-0.42, 0.0, 0), top = v(0.08, 0.075, 0), bot = v(0.06, -0.065, 0), l = v(0.08, 0, 0.07), r = v(0.08, 0, -0.07);
  I.push(nose, top, l, nose, l, bot, nose, r, top, nose, bot, r, tail, l, top, tail, bot, l, tail, top, r, tail, r, bot);
  for (const s of [1, -1]) {   // swept two-section wings
    const rf = v(0.2, 0.01, 0.06 * s), rb = v(-0.1, 0.01, 0.06 * s), ef = v(0.16, 0.02, 0.46 * s, 0.6), eb = v(-0.07, 0.02, 0.42 * s, 0.6), tp = v(-0.2, 0, 1.0 * s, 1);
    I.push(rf, rb, ef, rb, eb, ef, ef, eb, tp);
    const t0 = v(-0.4, 0, 0.02 * s), t1 = v(-0.82, 0, 0.13 * s), t2 = v(-0.58, 0, 0.0);   // forked tail
    I.push(t0, t1, t2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 1));
  g.setIndex(I);
  return g;
}

// ------------------------------------------------------------------ the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('grand-wheel') : ctx.rng;
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [cSalt, cLilac, cRose, cAmber, cGreen, cHorn, cPlum] = pal;
  // a membrane's transmittance is its swatch read as plain numbers (rose -> 0.95, 0.56, 0.65), nudged per seed
  const trans = (c, dh) => { const t = c.clone().offsetHSL(dh, 0, 0).convertLinearToSRGB(); return new THREE.Vector3(t.r, t.g, t.b); };
  const hueJ = rng.range(-0.018, 0.018);
  const tGreen = trans(cGreen, hueJ), tAmber = trans(cAmber, hueJ * 0.6), tRose = trans(cRose, hueJ);
  const e1 = rng.range(0.24, 0.33), e2 = e1 + rng.range(0.27, 0.35);
  let lean = opts.lean ?? THREE.MathUtils.degToRad(7);
  const beadAhead = opts.beadAhead ?? 23, beadHalf = (opts.beadLength ?? 26) * 0.5 * rng.range(0.94, 1.06);
  const veinCount = opts.veins ?? 13;

  const shared = {
    uTime: { value: 0 }, uRoll: { value: 0 }, uDrum: { value: opts.drum ?? 1 }, uGroundY: { value: 0 },
    uSunDir: { value: new THREE.Vector3(0.1, 0.276, -0.956).normalize() },
    uSunCol: { value: new THREE.Color('#FFF1DC').multiplyScalar(0.95) },
    uSkyCol: { value: cLilac.clone().multiplyScalar(0.42) },
    uGndCol: { value: cSalt.clone().multiplyScalar(0.3) },
  };
  const mkU = (extra) => Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), shared, extra);

  const object = new THREE.Group(); object.name = 'grand-wheel';
  const leanG = new THREE.Group(); leanG.rotation.x = lean; object.add(leanG);
  const spinG = new THREE.Group(); spinG.position.set(0, R, 0); leanG.add(spinG);

  // ---- horn: rim + ballast tube, hub ring, veins: one geometry, one draw call
  const acc = makeAcc();
  const rimRings = terraceRings(rng, TAU * 108, opts.terrace ?? 1.5, 0.26);      // short steps: from 12 m none is taller than a twentieth of the frame
  await sweepRing(acc, mirrorProfile(RIM_HALF), rimRings, 107.6, false, 108, 0.07, R, ctx);
  await ctx.yield?.();
  const hubRings = terraceRings(rng, TAU * 30.6, 1.25, 0.2);
  await sweepRing(acc, mirrorProfile(HUB_HALF), hubRings, 30.7, false, 30.6, 0.04, R_HUB, ctx);
  await ctx.yield?.();
  const branches = buildVeinPaths(rng, veinCount);
  await ctx.yield?.();
  await addVeinTubes(acc, branches, ctx);
  await ctx.yield?.();
  const hornGeo = await finishHorn(acc, ctx);
  await ctx.yield?.();
  const ochre = cAmber.clone().lerp(cHorn, 0.35).multiplyScalar(0.7);
  const beadU = { value: new THREE.Vector2(beadAhead, beadHalf) };
  const hornMat = new THREE.ShaderMaterial({
    uniforms: mkU({ uHorn: { value: cHorn }, uAmber: { value: cAmber }, uRose: { value: cRose }, uOchre: { value: ochre },
      uPlum: { value: cPlum }, uSalt: { value: cSalt }, uBead: beadU }),
    vertexShader: HORN_VERT, fragmentShader: HORN_FRAG, fog: true,
  });
  const horn = new THREE.Mesh(hornGeo, hornMat); spinG.add(horn);
  await ctx.yield?.();

  // ---- membrane
  const veinTex = await buildVeinTexture(rng, branches, detail >= 1 ? 2048 : 1024, ctx);
  await ctx.yield?.();
  const NR = 40, NA = 208, mp = new Float32Array((NR + 1) * (NA + 1) * 3), mi = [];
  for (let i = 0, k = 0; i <= NR; i++) {
    const r = R_MI + (R_MO - R_MI) * (i / NR);
    for (let j = 0; j <= NA; j++) { const a = (j / NA) * TAU; mp[k++] = r * Math.cos(a); mp[k++] = r * Math.sin(a); mp[k++] = 0; }
  }
  await ctx.yield?.();
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + NA + 1; mi.push(a, b, a + 1, b, b + 1, a + 1); }
  await ctx.yield?.();
  const memGeo = new THREE.BufferGeometry();
  memGeo.setAttribute('position', new THREE.BufferAttribute(mp, 3)); memGeo.setIndex(mi);
  memGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), R);
  await ctx.yield?.();
  const memU = { uVein: { value: veinTex }, uT0: { value: tGreen }, uT1: { value: tAmber }, uT2: { value: tRose },
    uBand: { value: new THREE.Vector4(e1, e2, rng.range(0.11, 0.16), rng.range(0, 40)) }, uGlow: { value: opts.glow ?? 0.9 }, uCells: { value: detail >= 0.8 ? 1 : 0 }, uClear: { value: opts.clear ?? 0.92 }, uVeinA: { value: new THREE.Vector3(veinCount, branches.off, opts.density ?? 2.0) } };
  const memBase = { vertexShader: MEM_VERT, fragmentShader: MEM_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation };
  const memMul = new THREE.ShaderMaterial({ ...memBase, uniforms: mkU(memU), defines: { PASS_MULTIPLY: 1 },
    blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });
  const memAdd = new THREE.ShaderMaterial({ ...memBase, uniforms: mkU(memU),
    blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });
  const mem1 = new THREE.Mesh(memGeo, memMul); mem1.renderOrder = 2; spinG.add(mem1);
  const mem2 = new THREE.Mesh(memGeo, memAdd); mem2.renderOrder = 3; spinG.add(mem2);

  // ---- shadow: one quad in the disc plane, slid down the sun ray in the vertex shader, multiplied onto whatever is there
  let shadow = null;
  const floorU = { value: new THREE.Vector3(0.3, 0.29, 0.42) };
  if (opts.shadow !== false) {
    const sg = new THREE.PlaneGeometry(2.12, 2.12);
    const sm = new THREE.ShaderMaterial({
      uniforms: mkU({ ...memU, uVeinA: { value: new THREE.Vector3(veinCount, branches.off, opts.shadowDensity ?? 1.25) }, uSoft: { value: opts.shadowSoft ?? 1 }, uShadowK: { value: opts.shadowStrength ?? 1 }, uFloor: floorU,
        uAmberT: { value: tAmber }, uBead: beadU }),
      vertexShader: SHADOW_VERT, fragmentShader: SHADOW_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor,
      blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    });
    if (opts.shadowTarget) { sm.depthTest = false; sm.polygonOffset = false; }
    shadow = new THREE.Mesh(sg, sm); shadow.position.set(0, R, 0); shadow.renderOrder = 1; shadow.frustumCulled = false; leanG.add(shadow);
  }

  await ctx.yield?.();
  // ---- salt fan and skirt
  const quad = new THREE.PlaneGeometry(2, 2);
  const nFan = Math.round(760 * detail), nSkirt = Math.round(150 * detail), nS = nFan + nSkirt;
  const s1 = new Float32Array(nS * 4), s2 = new Float32Array(nS * 4);
  for (let i = 0; i < nS; i++) {
    s1[i * 4] = rng(); s1[i * 4 + 1] = i < nFan ? 0 : 1; s1[i * 4 + 2] = rng(); s1[i * 4 + 3] = rng();
    for (let j = 0; j < 4; j++) s2[i * 4 + j] = rng();
  }
  const sprayGeo = new THREE.InstancedBufferGeometry();
  sprayGeo.setAttribute('position', quad.attributes.position); sprayGeo.setIndex(quad.index);
  sprayGeo.setAttribute('aS', new THREE.InstancedBufferAttribute(s1, 4)); sprayGeo.setAttribute('aS2', new THREE.InstancedBufferAttribute(s2, 4));
  sprayGeo.instanceCount = nS;
  const discN = { value: new THREE.Vector3(0, 0, 1) };
  const sprayU = { uSalt: { value: cSalt.clone().lerp(new THREE.Color(1, 1, 1), 0.3).multiplyScalar(0.84) }, uShadeTint: { value: tRose.clone().multiplyScalar(0.85) }, uDiscN: discN, uFan: { value: opts.fan ?? 1 } };
  const sprayMat = new THREE.ShaderMaterial({
    uniforms: mkU(sprayU),
    vertexShader: SPRAY_VERT, fragmentShader: SPRAY_FRAG, fog: true, transparent: true, depthWrite: false,
  });
  const spray = new THREE.Mesh(sprayGeo, sprayMat); spray.frustumCulled = false; spray.renderOrder = 4; object.add(spray);

  await ctx.yield?.();
  const FU = 30, FV = 18, fp = [], fi = [];
  for (const side of [-1, 1]) {
    const b0 = fp.length / 3;
    for (let i = 0; i <= FU; i++) for (let j = 0; j <= FV; j++) fp.push(i / FU, Math.pow(j / FV, 1.4), side);
    for (let i = 0; i < FU; i++) for (let j = 0; j < FV; j++) { const a = b0 + i * (FV + 1) + j, b = a + FV + 1; fi.push(a, b, a + 1, b, b + 1, a + 1); }
  }
  const sheetGeo = new THREE.BufferGeometry();
  sheetGeo.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); sheetGeo.setIndex(fi);
  const sheetMat = new THREE.ShaderMaterial({ uniforms: mkU(sprayU), vertexShader: SHEET_VERT, fragmentShader: SHEET_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const sheet = new THREE.Mesh(sheetGeo, sheetMat); sheet.frustumCulled = false; sheet.renderOrder = 4; object.add(sheet);
  spray.renderOrder = 5;

  await ctx.yield?.();
  // ---- saltpickers
  let birds = null; const scatterU = { value: 0 }, leanU = { value: lean }, gatherU = { value: 0 };
  const nB = opts.pickers === false ? 0 : Math.round((opts.pickers ?? 300) * detail);
  if (nB > 0) {
    const bg = birdGeometry(), ig = new THREE.InstancedBufferGeometry();
    ig.setAttribute('position', bg.attributes.position); ig.setAttribute('aW', bg.attributes.aW); ig.setIndex(bg.index);
    const o = new Float32Array(nB * 4), q = new Float32Array(nB * 4);
    const hy = R * Math.cos(lean), hz = R * Math.sin(lean);
    for (let i = 0; i < nB; i++) {
      const hub = rng.chance(0.36);
      if (hub) {
        const off = rng.sign() * rng.range(4, 17);
        o[i * 4] = rng.range(-3, 3); o[i * 4 + 1] = hy + rng.range(-3, 3) - off * Math.sin(lean); o[i * 4 + 2] = hz + off * Math.cos(lean);
        o[i * 4 + 3] = rng.range(33, 54);
      } else {
        const back = rng(); o[i * 4] = rng.range(20, 55) + 130 * back * back; o[i * 4 + 1] = rng.range(30, 180); o[i * 4 + 2] = hz + rng.range(-30, 30);
        o[i * 4 + 3] = rng.range(7, 30);
      }
      q[i * 4] = rng(); q[i * 4 + 1] = rng.range(9, 15) * rng.sign(); q[i * 4 + 2] = rng(); q[i * 4 + 3] = hub ? 1 : 0;
    }
    ig.setAttribute('aO', new THREE.InstancedBufferAttribute(o, 4)); ig.setAttribute('aQ', new THREE.InstancedBufferAttribute(q, 4));
    ig.instanceCount = nB;
    const bm = new THREE.ShaderMaterial({ uniforms: mkU({ uScatter: scatterU, uLean: leanU, uGather: gatherU }), vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, fog: true, side: THREE.DoubleSide });
    birds = new THREE.Mesh(ig, bm); birds.frustumCulled = false; object.add(birds);
  }
  await ctx.yield?.();

  // ---- anchors (local space; they follow setLean)
  const anchors = {};
  const refreshAnchors = () => {
    const cl = Math.cos(lean), sl = Math.sin(lean), tl = Math.tan(lean);
    const hub = new THREE.Vector3(0, R * cl, R * sl), n = new THREE.Vector3(0, -sl, cl);
    // a point `off` metres to port of the disc plane, at lateral x and height y
    const P = (x, y, off) => new THREE.Vector3(x, y - off * sl, y * tl + off * cl);
    Object.assign(anchors, {
      contact: new THREE.Vector3(0, 0, 0), heading: new THREE.Vector3(-1, 0, 0), hub, discNormal: n,
      eye: { position: hub.clone(), normal: n.clone(), radius: R_HUB },
      bead: new THREE.Vector3(-R * Math.sin(beadAhead / R_TUBE), (R - R_TUBE * Math.cos(beadAhead / R_TUBE)) * cl, (R - R_TUBE * Math.cos(beadAhead / R_TUBE)) * sl),
      sunSide: new THREE.Vector3(0, 0, -1),
      portalSeat: null,
      flyThrough: [new THREE.Vector3(95, 8, 30), new THREE.Vector3(45, 8, 16), new THREE.Vector3(8, 8, 13.6), new THREE.Vector3(-27, 8.5, 14.2),
        P(-38, 30, 13.5), P(-40, 58, 13.5), P(-33, 82, 13.5), P(-20, 97, 11), P(-10, 101, 0), P(-20, 102, -14), P(-42, 102, -34)],
      viewpoints: {
        reveal: { position: new THREE.Vector3(766, 6, 643), target: hub.clone() },
        contact: { position: new THREE.Vector3(10, 8, 13.6), target: new THREE.Vector3(-14, 3, 1) },
        face: { position: P(-40, 58, 13.5), target: hub.clone() },
        eye: { position: P(-20, 97, 11), target: P(-30, 101, -40) },
        sunward: { position: new THREE.Vector3(-70, 60, -170), target: hub.clone() },
      },
      bands: { greenToAmber: R_MI + e1 * (R_MO - R_MI), amberToRose: R_MI + e2 * (R_MO - R_MI), tints: { green: tGreen, amber: tAmber, rose: tRose } },
    });
  };
  refreshAnchors();

  // ---- runtime
  let rollSet = false, roll = 0, manualLight = false, lightRoot = null, sunL = null, hemiL = null, frame = 0;
  const roll0 = rng() * TAU;
  const localSun = opts.sunDir ? new THREE.Vector3().fromArray(opts.sunDir).normalize() : new THREE.Vector3(0.1, 0.276, -0.956).normalize();
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), q1 = new THREE.Quaternion();
  const findLights = () => {
    let root = object; while (root.parent) root = root.parent;
    if (root === lightRoot && (sunL || frame % 90)) return;
    lightRoot = root; sunL = hemiL = null;
    root.traverse((o) => { if (!sunL && o.isDirectionalLight) sunL = o; if (!hemiL && o.isHemisphereLight) hemiL = o; });
  };
  const hero = {
    object, radius: R + 2, height: 2 * R, center: new THREE.Vector3(0, R * Math.cos(lean), R * Math.sin(lean)), anchors,
    ground: true, groundY: 0, uniforms: shared, veinTexture: veinTex,
    // roll angle in radians = distance rolled / 110 (the world drives this from its hub spline); never called -> one turn in 35 s
    setRoll(a) { rollSet = true; roll = a; },
    setLean(a) { lean = a; leanG.rotation.x = a; leanU.value = a; refreshAnchors(); hero.center.copy(anchors.hub); },
    // world-space light: { sunDir: Vector3 TO the sun, sunColor, skyColor, groundColor } (linear radiance, i.e. light.color * intensity / PI)
    setLight(l) {
      manualLight = true;
      if (l.sunDir) shared.uSunDir.value.copy(l.sunDir).normalize();
      if (l.sunColor) shared.uSunCol.value.copy(l.sunColor);
      if (l.skyColor) shared.uSkyCol.value.copy(l.skyColor);
      if (l.groundColor) shared.uGndCol.value.copy(l.groundColor);
    },
    setScatter(s) { scatterU.value = Math.min(1, Math.max(0, s)); },
    setProgress(u) { hero.setScatter(u); },
    setGather(g) { gatherU.value = Math.min(1, Math.max(0, g)); },      // 0..1: the hub flock wheels across the eye
    setDrum(a) { shared.uDrum.value = a; },
    setFan(a) { sprayU.uFan.value = a; },
    update(dt, time) {
      frame++;
      shared.uTime.value = time;
      if (!rollSet) roll = roll0 + time * TAU / 35;
      spinG.rotation.z = roll; shared.uRoll.value = roll % TAU;
      object.updateWorldMatrix(true, false);
      shared.uGroundY.value = v1.setFromMatrixPosition(object.matrixWorld).y;
      leanG.updateWorldMatrix(false, false);
      discN.value.set(0, 0, 1).transformDirection(leanG.matrixWorld);
      if (!manualLight) {
        findLights();
        if (sunL) {
          sunL.getWorldPosition(v1); sunL.target.getWorldPosition(v2);
          if (v1.sub(v2).lengthSq() > 1e-8) shared.uSunDir.value.copy(v1.normalize());
          shared.uSunCol.value.copy(sunL.color).multiplyScalar(sunL.intensity / Math.PI);
        } else {
          object.getWorldQuaternion(q1); shared.uSunDir.value.copy(localSun).applyQuaternion(q1);
        }
        if (hemiL) {
          shared.uSkyCol.value.copy(hemiL.color).multiplyScalar(hemiL.intensity / Math.PI);
          shared.uGndCol.value.copy(hemiL.groundColor).multiplyScalar(hemiL.intensity / Math.PI);
        }
      }
      const s = shared.uSunCol.value, k = shared.uSkyCol.value, el = Math.max(shared.uSunDir.value.y, 0.05);
      if (opts.shadowTarget) floorU.value.set(0, 0, 0);      // the world gathers T in its own shadow target and lights the pan once
      else floorU.value.set(k.r / Math.max(s.r * el + k.r, 1e-4), k.g / Math.max(s.g * el + k.g, 1e-4), k.b / Math.max(s.b * el + k.b, 1e-4));
      if (shadow) shadow.visible = shared.uSunDir.value.y > 0.03;
    },
    get shadowMesh() { return shadow; },
    dispose() { veinTex.dispose(); quad.dispose(); },
  };
  hero.update(0, 0);
  return hero;
}
