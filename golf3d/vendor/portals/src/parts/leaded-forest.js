// HERO SET PIECE for "leaded-forest": THE WISTERIA TREE, a Tiffany lampshade 90 m wide that you fly inside
// while autumn arrives and its forty thousand panes let go.
//
// What it is
//   A twisted trunk of black lead strands (6 m thick, splayed roots) rises to 46 m and spreads into ribs like the
//   frame of a lampshade: 13-17 main ribs that fork once, three sagging hoops, curled crozier ends at the rim and
//   drooping side twigs. On the frame lies a ragged leaded shell (Voronoi panes in black came, open toward the
//   rim) and from it hang ~400 racemes, each a tapering curtain of petal panes on a hair-thin lead string
//   (40,000 panes at detail 1). Rim curtains hang to 8-11 m above the ground; a tunnel is kept clear inside.
//   Origin = centre of the trunk at ground level, +Y up. Dome radius 45 m, apex 60 m.
//   The camera arrives travelling toward -Z along the line x = +28 (so the ENTRY PARTING is on the +Z side, 28 m
//   right of the trunk as seen from the front), sweeps 120 degrees LEFT round the trunk at 28 m radius, and leaves
//   heading (-0.866, 0, +0.5) through the EXIT PARTING at (-44.5, y, -6.6).
//
// Style (how the leaded glass is done, so the world can match it)
//   Unlit. Every pane writes  famColour * sheet(viewRay) * grazing * streak * glassGain (+ bubbles), linear HDR:
//     sheet(d)  = sheetGain * (1 + 0.18*max(d.y,0) + 0.07*sin(3.1 d.x + 2.3 d.z + 0.05 t)*sin(4.7 d.z - 2 d.y + 0.03 t))
//                 d = normalize(worldPos - cameraPosition), i.e. the brightness of the light sheet BEHIND the pane
//     grazing   = mix(0.42, 1, smoothstep(0, 0.75, |N.V|))            (edge-on glass is darker)
//     streak    = 0.8 + 0.2*sin(...) ripple along the pane, plus a few seed-bubble dots (+0.5)
//   Black came #0A0B0E is drawn in the fragment shader from the distance to the pane edge, antialiased with
//   fwidth, never thinner than 1.5 px, and dissolved into a darker tint of the glass once the pane is only a few
//   pixels across (no sparkle at distance). Colour = a 4-stop ramp per season ("family"), looked up by a per-pane
//   and per-raceme random; uSeason 0..3 cross-fades family i -> i+1 pane by pane as a front (see setProgress).
//   Lead (trunk, ribs) is near-black with faint sliding pools of the season colour and a 3 % pearl rim.
//   All materials have fog: true and use the three.js fog chunks: give the scene a pearl fog for the halation.
//
// opts
//   palette     [lead, pearl, lilac, green, amber, flame, cobalt] hex strings (brief default)
//   variant     'wisteria' | 'laburnum'              (seeded if omitted: 70 / 30 %; 'cherry' still works if asked for)
//   autumn      'amber' | 'wine' | 'ginkgo'          (seeded if omitted: 60 / 20 / 20 %)
//   density     1      scales the pane count (also multiplied by ctx.quality.detail)
//   sheetGain   1.15   brightness of the light sheet seen through the glass
//   glassGain   1.5    overall pane brightness
//   duration    40     seconds of the world's journey (used by setProgress to turn u into fall seconds)
//   timeline    { summer:[0.17,0.30], autumn:[0.575,0.63], fall:0.60, winter:[0.70,0.80] }  in path u
//   pools       true   additive pools of colour on the ground under the dome (y = 0.06)
//
// Progress hooks (nothing story-critical runs on wall-clock time)
//   setProgress(u)            u = 0..1 of the world's journey; maps through opts.timeline to season + fall.
//   setState({season, fallT}) direct control: season 0 spring .. 1 summer .. 2 autumn .. 3 winter (fractions
//                             are a front crossing the dome from the entry parting to the exit parting; winter whitens from the top down);
//                             fallT = seconds since the first pane let go (releases are spread over 5.5 s,
//                             terminal speed 4 m/s; ~5 % of panes, near the top of each raceme, never fall and frost over, and
//                             each bare string breaks back to a short stub between fallT 3 and 8).
//   Until one of these is called the piece plays a 40 s demo loop from `time` (for the part viewer only).
//   uniforms.{uSeason,uFallT,uTime} are also exposed.
//   uniforms.uHeroFog (default 1) scales the fog on the hero alone: under 1 the far dome keeps its colour through the
//   haze (the world holds it at 0.3 for the entry view and eases it to 1 by u 0.24). Loose panes shrink within 9 m of the lens.
//
// anchors (hero-local space)
//   flyThrough    ordered points: approach along x = 28 from z = 150, entry parting, the 120 degree arc at r = 28,
//                 y 14-18, exit parting, 70 m beyond. All fixed glass and lead stays >= 6 m from this line (only the
//                 loose falling panes cross it).
//   entryParting  { position (28,15,36), direction (0,0,-1), width 14 }   exitParting { position, direction, width }
//   orbit         { center (0,0,0), radius 28, fromAzimuth 90deg, toAzimuth 210deg } azimuth = atan2(x, z)
//   portalSeat    { position, normal }: 60 m beyond the exit parting on the exit line, facing back at the tree, for
//                 a world that wants its 14 m portal framed by the parting (the brief's own ring is elsewhere).
//   viewpoints    reveal (whole tree across the clearing from canopy height), inside, under the apex.
//   trunkTop, apex, rimRadius, curtainBottom
//
// Size and cost: radius 46, height 60. ~135-140k triangles (80k of them the panes), 5 draw calls, no lights, no
// textures, ~200 ms build. opts.rain 0..1 ripples the sheet and runs runnels down the panes.
// Exports Tubes, makeFamilies and GLSL_COMMON so the world can build the rest of the forest in the same glass.
// Lighting: none needed. It wants a bright even backdrop (the pearl sheet, ~1.2) and a dark ground.
import * as THREE from 'three';

const R = 45, H = 60, TRUNK_TOP = 46, RIM_Y = 31, R_APEX = 13;
const PATH_R = 28, A0 = Math.PI / 2, A1 = (7 * Math.PI) / 6;
const DEFAULT_PALETTE = ['#0A0B0E', '#DDE9F0', '#8E6BD6', '#2FA35A', '#F2A21E', '#D9471C', '#1D5FBF'];

// height of the lampshade surface at horizontal radius r
function domeY(r) {
  if (r < R_APEX) return TRUNK_TOP + (H - TRUNK_TOP) * Math.sin((Math.PI / 2) * (r / R_APEX));
  const k = Math.min(1.1, (r - R_APEX) / (R - R_APEX));
  return H - (H - RIM_Y) * Math.pow(k, 1.8);
}
// horizontal distance from (x,z) to the camera line
function pathDist(x, z) {
  let d = Infinity;
  d = Math.min(d, Math.hypot(x - PATH_R, z - Math.max(0, Math.min(160, z))));       // approach, x = 28, z >= 0
  let az = Math.atan2(x, z); if (az < 0) az += Math.PI * 2;
  if (az >= A0 && az <= A1) d = Math.min(d, Math.abs(Math.hypot(x, z) - PATH_R));    // the arc
  const ex = Math.sin(A1) * PATH_R, ez = Math.cos(A1) * PATH_R, hx = Math.cos(A1), hz = -Math.sin(A1);
  const t = Math.max(0, Math.min(140, (x - ex) * hx + (z - ez) * hz));               // exit line
  d = Math.min(d, Math.hypot(x - ex - hx * t, z - ez - hz * t));
  return d;
}

// ---- merged tube builder (parallel-transport frames, per-ring radius, capped ends) ----
export class Tubes {
  constructor() { this.p = []; this.n = []; this.i = []; this.r = []; }
  add(pts, rad, sides = 7, squash = 1) {
    const N = pts.length, base = this.p.length / 3;
    const T = new THREE.Vector3(), Nn = new THREE.Vector3(), B = new THREE.Vector3(), prevT = new THREE.Vector3(), q = new THREE.Quaternion(), v = new THREE.Vector3();
    for (let k = 0; k < N; k++) {
      T.subVectors(pts[Math.min(N - 1, k + 1)], pts[Math.max(0, k - 1)]).normalize();
      if (k === 0) { Nn.set(0, 1, 0); if (Math.abs(T.y) > 0.9) Nn.set(1, 0, 0); Nn.addScaledVector(T, -Nn.dot(T)).normalize(); }
      else { q.setFromUnitVectors(prevT, T); Nn.applyQuaternion(q).addScaledVector(T, -Nn.dot(T)).normalize(); }
      prevT.copy(T); B.crossVectors(T, Nn);
      const r = typeof rad === 'function' ? rad(k / (N - 1), k) : rad;
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a) * squash;
        v.copy(Nn).multiplyScalar(ca).addScaledVector(B, sa);
        this.p.push(pts[k].x + v.x * r, pts[k].y + v.y * r, pts[k].z + v.z * r);
        v.normalize(); this.n.push(v.x, v.y, v.z); this.r.push(r);
      }
      if (k > 0) for (let s = 0; s < sides; s++) {
        const a = base + (k - 1) * sides + s, b = base + (k - 1) * sides + ((s + 1) % sides), c = a + sides, d = b + sides;
        this.i.push(a, c, b, b, c, d);
      }
    }
    // end cap (a point), so tips taper shut
    const tip = this.p.length / 3, e = pts[N - 1];
    this.p.push(e.x + prevT.x * 0.05, e.y + prevT.y * 0.05, e.z + prevT.z * 0.05); this.n.push(prevT.x, prevT.y, prevT.z); this.r.push(0.02);
    for (let s = 0; s < sides; s++) this.i.push(base + (N - 1) * sides + s, tip, base + (N - 1) * sides + ((s + 1) % sides));
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('aRad', new THREE.Float32BufferAttribute(this.r, 1));
    g.setIndex(this.i);
    return g;
  }
}

// ---- colour families: 4 seasons x 4 stops, each held to a narrow span of hue ----
export function makeFamilies(pal, variant, autumn) {
  const C = (h) => new THREE.Color(h), hsl = (c, dh, ds, dl) => { const o = {}; c.getHSL(o); return new THREE.Color().setHSL((o.h + dh + 1) % 1, Math.min(1, Math.max(0, o.s * ds)), Math.min(0.92, Math.max(0.04, o.l * dl))); };
  const lilac = C(pal[2]), green = C(pal[3]), amber = C(pal[4]), flame = C(pal[5]), pearl = C(pal[1]);
  let spring;
  if (variant === 'laburnum') { const g = C('#E9C84A'); spring = [hsl(g, 0.0, 1.0, 0.85), g, hsl(g, 0.02, 0.8, 1.25), hsl(green, -0.04, 0.45, 1.75)]; }
  else if (variant === 'cherry') { const p = C('#E0679A'); spring = [hsl(p, -0.01, 1.0, 0.8), p, hsl(p, 0.01, 0.8, 1.25), hsl(p, 0.02, 0.5, 1.5)]; }
  else spring = [hsl(lilac, 0.03, 1.1, 0.8), lilac, hsl(lilac, -0.045, 0.95, 1.12), hsl(lilac, -0.02, 0.7, 1.38)];
  const summer = [hsl(green, 0.05, 1.1, 0.55), green, hsl(green, -0.035, 1.0, 1.15), hsl(green, -0.1, 0.95, 1.45)];
  let aut;
  if (autumn === 'wine') { const w = C('#B01E3A'); aut = [hsl(w, -0.02, 1, 0.6), w, hsl(w, 0.02, 1, 1.2), hsl(w, 0.04, 0.95, 1.5)]; }
  else if (autumn === 'ginkgo') { const y = C('#F0C928'); aut = [hsl(y, -0.02, 1, 0.8), y, hsl(y, 0.01, 0.95, 1.1), hsl(y, 0.02, 0.8, 1.3)]; }
  else aut = [hsl(flame, -0.01, 1.05, 0.78), flame, hsl(amber, -0.02, 1.0, 0.98), hsl(amber, 0.015, 0.95, 1.12)];
  const winter = [hsl(pearl, 0.0, 1.6, 0.8), hsl(pearl, 0.01, 1.0, 0.92), pearl, hsl(pearl, -0.02, 0.5, 1.03)];
  return [...spring, ...summer, ...aut, ...winter];
}

// ---- GLSL shared by every material ----
export const GLSL_COMMON = /* glsl */`
uniform float uTime, uSeason, uFallT, uSheetGain, uGlassGain, uRain, uHeroFog;
uniform vec3 uFam[16];
uniform vec3 uLead;
float h11(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 fam(float i, float x){
  float p = clamp(x, 0., 0.999) * 3.; float k = floor(p); int b = int(clamp(i, 0., 3.)) * 4 + int(k);
  return mix(uFam[b], uFam[b + 1], p - k);
}
// colour of a pane: x ramp position, c front coordinate (0 = first reached), r random, topC = 1 - height
vec3 seasonColor(float x, float c, float r, float topC){
  float S = clamp(uSeason, 0., 2.999); float i = floor(S); float f = S - i;
  float e = (i > 1.5 ? topC : c) * 0.8 + r * 0.1;
  return mix(fam(i, x), fam(i + 1., x), smoothstep(e, e + 0.08, f));
}
float frontCoord(vec3 p){ return clamp(0.5 - (p.x * 0.862 + p.z * 0.507) / 90., 0., 1.); }   // from the entry parting toward the exit parting
float sheet(vec3 d){
  float rp = uRain * 0.09 * sin(d.x * 23. + sin(d.z * 17. + uTime * 0.9) * 2. + d.y * 31. - uTime * 2.2);
  return uSheetGain * (1. + rp + 0.18 * max(d.y, 0.) + 0.07 * sin(d.x * 3.1 + d.z * 2.3 + uTime * 0.05) * sin(d.z * 4.7 - d.y * 2. + uTime * 0.03));
}
// slow travelling waves through everything that hangs; d = metres below the attachment
vec3 sway(vec3 p, float d){
  float ph = dot(p.xz, vec2(0.071, 0.052)) - uTime * 0.8;
  float a = min(0.028 * pow(max(d, 0.), 1.25), 1.6);
  return vec3(a * (sin(ph) + 0.4 * sin(ph * 2.3 + 1.7)), 0., a * 0.6 * sin(ph * 1.31 + p.x * 0.11 + 2.));
}
`;

// ---- the lead: trunk strands, ribs, forks, croziers, hoops, twigs ----
async function buildLead(rng, noise, P, yld) {
  const tb = new Tubes(), V = (x, y, z) => new THREE.Vector3(x, y, z);
  const attach = [];   // { x, y, z } points on the frame from which racemes may hang
  // trunk: strands winding round each other, splaying into roots at the base
  const strands = P.strands, hand = P.hand;
  for (let s = 0; s < strands; s++) {
    const a0 = (s / strands) * Math.PI * 2 + rng.range(-0.25, 0.25), turns = rng.range(1.1, 1.7), fat = rng.range(0.85, 1.2), ph = rng() * 9, splayR = rng.range(4.2, 5.8);
    const pts = [], n = 64;
    for (let k = 0; k <= n; k++) {
      const t = k / n, y = -3 + t * (TRUNK_TOP + 5);
      const yy = Math.max(0, y) / TRUNK_TOP;
      const splay = Math.pow(Math.max(0, 1 - Math.max(0, y) / 9), 2.2) * splayR;
      const rad = 1.95 * (1 - 0.35 * yy) + splay + 0.35 * Math.sin(yy * 11 + ph) + (y > 38 ? (y - 38) * 0.05 : 0);
      const a = a0 + hand * turns * Math.PI * 2 * Math.pow(yy, 0.85) + 0.25 * Math.sin(yy * 7 + ph * 2);
      pts.push(V(Math.sin(a) * rad, y - splay * 0.3, Math.cos(a) * rad));
    }
    tb.add(pts, (t) => fat * (1.65 - 0.6 * t) * (1 + 0.16 * Math.sin(t * 40 + ph) + 0.1 * Math.sin(t * 91 + ph * 3)) * (t < 0.06 ? 0.5 + t * 8 : 1), 8, 0.8);
    await yld();
  }
  // a thin tendril or two spiralling loosely round the trunk
  for (let s = 0; s < 3; s++) {
    const a0 = rng() * 6.28, pts = [];
    for (let k = 0; k <= 48; k++) { const t = k / 48, y = 1 + t * 44, a = a0 - hand * t * 15, rad = 3.6 - 1.1 * t + 0.4 * Math.sin(t * 23 + s); pts.push(V(Math.sin(a) * rad, y, Math.cos(a) * rad)); }
    tb.add(pts, (t) => 0.32 - 0.14 * t, 5);
  }
  // ribs
  const NR = P.ribs, ribEnds = [], ribLines = [];
  const ribPoint = (az, r, lift) => V(Math.sin(az) * r, domeY(r) + lift, Math.cos(az) * r);
  const crozier = (pts, az, r, y, size) => {
    for (let k = 1; k <= 12; k++) { const g = (k / 12) * Math.PI * 1.7, rho = size * (1 - 0.6 * k / 12); const rr = r + Math.sin(g) * rho, yy = y - size + Math.cos(g) * rho; pts.push(V(Math.sin(az) * rr, yy, Math.cos(az) * rr)); }
  };
  for (let i = 0; i < NR; i++) {
    const az0 = (i / NR) * Math.PI * 2 + rng.range(-0.08, 0.08), swirl = hand * P.swirl, ph = rng() * 9, lift = rng.range(-0.5, 0.5);
    const rFork = rng.range(17, 23), main = [], azAt = (r) => az0 + swirl * (r / R) + 0.1 * Math.sin(r * 0.21 + ph);
    for (let k = 0; k <= 16; k++) { const r = 0.6 + (rFork - 0.6) * (k / 16); main.push(ribPoint(azAt(r), r, lift * (r / R))); if (k > 5 && k % 2 === 0) attach.push(main[main.length - 1]); }
    tb.add(main, (t) => 1.15 - 0.55 * t, 7);
    ribLines.push(main);
    for (const side of [-1, 1]) {
      const spread = side * (Math.PI / NR) * rng.range(0.42, 0.58), ph2 = rng() * 9, rEnd = R + rng.range(-1.2, 1.5), pts = [];
      for (let k = 0; k <= 22; k++) {
        const u = k / 22, r = rFork + (rEnd - rFork) * u;
        const az = azAt(r) + spread * Math.pow(u, 0.7) + 0.05 * Math.sin(u * 9 + ph2);
        pts.push(ribPoint(az, r, lift * (r / R) + 0.6 * Math.sin(u * 5 + ph2)));
        if (k > 1 && k % 2 === 0) attach.push(pts[pts.length - 1]);
      }
      const last = pts[pts.length - 1], azE = Math.atan2(last.x, last.z);
      ribEnds.push({ az: azE, r: rEnd, y: last.y });
      ribLines.push(pts.slice());
      crozier(pts, azE, rEnd, last.y, rng.range(1.5, 2.3));
      tb.add(pts, (t) => (0.62 - 0.36 * Math.min(1, t * 1.3)) * (t > 0.78 ? 1 - (t - 0.78) * 2.2 : 1), 6);
    }
    await yld();
  }
  // hoops: three sagging rings like the wires of a shade
  for (const [hr, thick, sag] of [[R_APEX + 3, 0.3, 0.5], [30.5, 0.26, 1.1], [R - 0.4, 0.24, 1.6]]) {
    const pts = [], n = 150, ph = rng() * 9;
    for (let k = 0; k <= n; k++) {
      const az = (k / n) * Math.PI * 2, r = hr + 0.7 * Math.sin(az * 5 + ph);
      const y = domeY(r) - sag * (0.5 + 0.5 * Math.cos(az * NR * 2 + ph)) - 0.25;
      pts.push(V(Math.sin(az) * r, y, Math.cos(az) * r)); if (k % 2 === 0 && k < n) attach.push(pts[pts.length - 1]);
    }
    tb.add(pts, thick, 5);
    await yld();
  }
  // twigs: side shoots that leave a rib, run sideways along the shade and droop, ending in a small curl
  for (let i = 0; i < P.twigs; i++) {
    const line = rng.pick(ribLines), a = line[rng.int(3, line.length - 2)], r0 = Math.hypot(a.x, a.z);
    if (r0 < 9) continue;
    const az0 = Math.atan2(a.x, a.z), dir = rng.sign(), len = rng.range(4, 9), droop = rng.range(2, 6), out = rng.range(-1, 3), pts = [], ph = rng() * 9;
    for (let k = 0; k <= 9; k++) {
      const u = k / 9, r = r0 + out * u, az = az0 + dir * (len * u) / r0;
      const y = Math.max(27, a.y + (domeY(r) - domeY(r0)) - droop * u * u + 0.4 * Math.sin(u * 6 + ph) - 0.2);
      pts.push(V(Math.sin(az) * r, y, Math.cos(az) * r));
    }
    const e = pts[pts.length - 1], azE = Math.atan2(e.x, e.z), rE = Math.hypot(e.x, e.z);
    for (let k = 1; k <= 6; k++) { const g = (k / 6) * Math.PI * 1.5, rho = 0.7 * (1 - 0.5 * k / 6); pts.push(V(Math.sin(azE + dir * Math.sin(g) * rho / rE) * rE, e.y - 0.7 + Math.cos(g) * rho, Math.cos(azE + dir * Math.sin(g) * rho / rE) * rE)); }
    tb.add(pts, (t) => 0.2 - 0.13 * t, 3);
    attach.push(pts[5], pts[9]);
    if (i % 24 === 23) await yld();
  }
  await yld();
  const geometry = tb.geometry(); geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 29, 0), 62);
  return { geometry, attach, ribEnds };
}

function leadMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    vertexShader: /* glsl */`
      varying vec3 vWp, vN, vLp;
      #include <fog_pars_vertex>
      void main(){
        vLp = position; vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      varying vec3 vWp, vN, vLp;
      #include <fog_pars_fragment>
      void main(){
        vec3 V = normalize(cameraPosition - vWp), N = normalize(vN);
        float fr = 1. - abs(dot(N, V)); fr = fr * fr * fr;
        // pools of the season's colour sliding over the lead
        vec3 q = vLp * 0.19; float t = uTime * 0.25;
        float m = sin(q.x * 1.7 + t + sin(q.y * 1.3 - t * 0.7)) * sin(q.y * 2.1 - t * 0.6 + sin(q.z * 1.9)) * sin(q.z * 1.5 + q.x + t * 0.4);
        m = smoothstep(0.12, 0.7, m);
        float under = smoothstep(52., 30., vLp.y) * (1. - smoothstep(2.2, 3., uSeason) * 0.7) * (1. - smoothstep(4., 9., uFallT) * 0.6);
        vec3 pool = seasonColor(0.35 + 0.3 * sin(q.y + q.x), frontCoord(vLp), 0.5, 0.5) * m * under * 0.11;
        // solder seams: faint paler rings along the strands
        float seam = smoothstep(0.92, 1., sin(vLp.y * 2.3 + sin(vLp.x * 1.1 + vLp.z * 0.9) * 2.)) * 0.012;
        vec3 col = uLead + pool + seam + vec3(0.87, 0.92, 0.95) * fr * 0.035 * sheet(-V);
        gl_FragColor = vec4(col, 1.);
        #ifdef USE_FOG
          #ifdef FOG_EXP2
            float fogK = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth * uHeroFog);
          #else
            float fogK = smoothstep(fogNear, fogFar, vFogDepth) * uHeroFog;
          #endif
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogK);
        #endif
      }`,
  });
}

// ---- the shell: a ragged leaded skin lying on the ribs, thinning toward the rim ----
function buildShell(noise) {
  const NA = 112, NRr = 26, pos = [], idx = [];
  for (let j = 0; j <= NRr; j++) for (let i = 0; i <= NA; i++) {
    const az = (i / NA) * Math.PI * 2, r = 2.2 + (41.5 - 2.2) * Math.pow(j / NRr, 0.9), x = Math.sin(az) * r, z = Math.cos(az) * r;
    pos.push(x, domeY(r) - 0.15 + 0.7 * noise.n2(x * 0.09, z * 0.09) * Math.min(1, r / 12), z);
  }
  for (let j = 0; j < NRr; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 45, 0), 50);
  return g;
}

function shellMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    vertexShader: /* glsl */`
      varying vec3 vWp, vN, vLp;
      #include <fog_pars_vertex>
      void main(){
        vLp = position; vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      varying vec3 vWp, vN, vLp;
      #include <fog_pars_fragment>
      // is this cell glazed now?  x: glazed, y: ever glazed
      vec2 cellState(vec2 id, vec2 cpos){
        float h = h21(id + 3.7), r = length(cpos);
        float dens = 1. - 0.8 * smoothstep(0.4, 0.95, r / 45.);
        float ever = step(h, dens);
        float rel = 0.4 + 5.6 * sqrt(h21(id + 11.3));
        float keep = step(h21(id + 23.1), 0.05);
        float gone = step(rel, uFallT) * (1. - keep);
        return vec2(ever * (1. - gone), ever);
      }
      void main(){
        vec2 p = vLp.xz / 2.7;
        float fw = length(fwidth(p));
        vec2 ip = floor(p), fp = fract(p);
        float d1 = 9., d2 = 9.; vec2 id1 = vec2(0.), id2 = vec2(0.), c1 = vec2(0.), c2 = vec2(0.);
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 g = vec2(float(i), float(j)), o = vec2(h21(ip + g), h21(ip + g + 57.3)) * 0.8 + 0.1;
          vec2 dv = g + o - fp; float d = dot(dv, dv);
          if (d < d1) { d2 = d1; id2 = id1; c2 = c1; d1 = d; id1 = ip + g; c1 = (ip + g + o) * 2.7; }
          else if (d < d2) { d2 = d; id2 = ip + g; c2 = (ip + g + o) * 2.7; }
        }
        float edge = sqrt(d2) - sqrt(d1);
        vec2 s1 = cellState(id1, c1), s2 = cellState(id2, c2);
        float bw = max(0.075, 1.5 * fw);
        float came = 1. - smoothstep(bw * 0.6, bw, edge);
        // bare came survives the fall here and there, as tracery
        float bare = step(0.45, h21(id1 + id2)) * max(s1.y, s2.y);
        float cameOn = came * max(max(s1.x, s2.x), bare);
        if (s1.x < 0.5 && cameOn < 0.5) discard;
        vec3 V = normalize(vWp - cameraPosition);
        float hx = h21(id1 + 1.9), hy = h21(id1 + 7.7);
        float graze = abs(dot(normalize(vN), V));
        float b = sheet(V) * mix(0.42, 1., smoothstep(0., 0.75, graze));
        vec2 lp = vLp.xz - c1;
        float streak = 0.8 + 0.2 * sin(dot(lp, vec2(cos(hx * 6.28), sin(hx * 6.28))) * 4. + sin(lp.x * 2.1 + hy * 9.) * 1.5);
        vec2 bb = fract(vLp.xz * 1.3 + hy * 5.) - 0.5; float bub = smoothstep(0.1, 0.03, length(bb)) * step(0.82, h21(floor(vLp.xz * 1.3 + hy * 5.)));
        vec3 gc = seasonColor(0.1 + 0.55 * hx, frontCoord(vec3(c1.x, 0., c1.y)), hy, 0.1);
        // frost: the few cells that stay turn clear and craze
        float frost = smoothstep(2.2, 3., uSeason);
        float craze = smoothstep(0.06, 0.0, abs(sin(lp.x * 5. + hy * 9.) * sin(lp.y * 4.3 + hx * 7.) - 0.2));
        vec3 glass = gc * b * streak * uGlassGain * 0.86 + bub * 0.4 + frost * craze * 0.35;
        float dissolve = 1. - smoothstep(0.12, 0.4, fw);
        vec3 col = mix(glass, mix(glass * 0.4, uLead, dissolve), cameOn * step(0.5, s1.x) + (1. - step(0.5, s1.x)));
        gl_FragColor = vec4(col, 1.);
        #ifdef USE_FOG
          #ifdef FOG_EXP2
            float fogK = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth * uHeroFog);
          #else
            float fogK = smoothstep(fogNear, fogFar, vFogDepth) * uHeroFog;
          #endif
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogK);
        #endif
      }`,
  });
}

// ---- racemes: where they hang, how long, and their panes ----
function layoutRacemes(rng, attach, count) {
  const out = [], nRim = Math.round(count * 0.42), nIn = count - nRim;
  const snap = (x, z, maxD) => {
    let best = null, bd = maxD * maxD;
    for (const a of attach) { const d = (a.x - x) * (a.x - x) + (a.z - z) * (a.z - z); if (d < bd) { bd = d; best = a; } }
    return best;
  };
  const place = (x, z, rim) => {
    let r = Math.hypot(x, z), y = domeY(r) - 0.5;
    const s = snap(x, z, r > 40 ? 6 : 2.2);
    if (s) { x = s.x + rng.range(-0.3, 0.3); z = s.z + rng.range(-0.3, 0.3); y = s.y - 0.3; r = Math.hypot(x, z); } else if (r > 40) return;
    let bottom = rim ? rng.range(8, 11.5) : r < 20 ? rng.range(12, 21) + (20 - r) * 0.5 : rng.range(10, 23);
    const pd = pathDist(x, z);
    if (pd < 12.5) { const lifted = 25.5 + rng() * 3.5 - Math.max(0, r - 38) * 0.35; bottom = Math.max(bottom, pd < 8.5 ? lifted : lifted + (bottom - lifted) * ((pd - 8.5) / 4)); }
    const L = y - bottom; if (L < 2.2) return;
    out.push({ x, y, z, L, W: Math.min(4.4, 1.7 + L * 0.15) * rng.range(0.8, 1.2), az: Math.atan2(x, z), rnd: rng(), flat: rng.range(0.45, 0.8) });
  };
  for (let i = 0; i < nRim; i++) { const az = ((i + rng()) / nRim) * Math.PI * 2, r = rng.range(37, 45.4); place(Math.sin(az) * r, Math.cos(az) * r, true); }
  // interior: best-candidate sampling for an even scatter
  const pts = [];
  for (let i = 0; i < nIn; i++) {
    let bx = 0, bz = 0, bd = -1;
    for (let c = 0; c < 6; c++) {
      const az = rng() * Math.PI * 2, r = Math.sqrt(rng.range(7.5 * 7.5, 37 * 37)), x = Math.sin(az) * r, z = Math.cos(az) * r;
      let d = 1e9; for (const q of pts) d = Math.min(d, (q[0] - x) * (q[0] - x) + (q[1] - z) * (q[1] - z));
      if (d > bd) { bd = d; bx = x; bz = z; }
    }
    pts.push([bx, bz]); place(bx, bz, false);
  }
  return out;
}

async function buildPanes(rng, racemes, total, yld) {
  let area = 0; for (const r of racemes) area += r.L * r.W;
  const iPos = [], iA = [], iB = [], sp = [], sh = [], ss = [], si = [], sk = [];
  let rcN = 0;
  for (const rc of racemes) {
    if (++rcN % 24 === 0) await yld();
    const n = Math.max(12, Math.round((total * rc.L * rc.W) / area));
    const tx = Math.cos(rc.az), tz = -Math.sin(rc.az), nx = Math.sin(rc.az), nz = Math.cos(rc.az);   // tangent, radial
    const bend = rng.range(-0.6, 0.6), keepLen = Math.min(rc.L, rng.range(2, 6) + 0.12 * rc.L);
    for (let k = 0; k < n; k++) {
      const f = Math.pow((k + rng()) / n, 0.85), d = f * rc.L;
      const w = rc.W * 0.5 * Math.pow(1 - f, 0.55) * (0.3 + 0.7 * Math.min(1, f * 9));
      const th = rng() * Math.PI * 2, rho = Math.sqrt(rng()) * w, a = Math.cos(th) * rho, b = Math.sin(th) * rho * rc.flat;
      const size = (1.3 - 0.62 * f) * rng.range(0.8, 1.2);
      iPos.push(rc.x + tx * a + nx * b + tx * bend * f * f, rc.y - d - 0.4, rc.z + tz * a + nz * b + tz * bend * f * f);
      iA.push(d + 0.4, rng(), rc.rnd, size);
      const never = d < keepLen && rng() < 0.3, rel = never ? 1000 : 0.3 + 5.2 * Math.pow(rng(), 0.45);
      iB.push(rc.az + rng.range(-1.0, 1.0) + (rng() < 0.5 ? Math.PI : 0), rel, f, rng.range(-0.3, 0.3));
    }
    // the string: a ribbon of 6 segments
    const base = sp.length / 3;
    for (let k = 0; k <= 6; k++) {
      const u = k / 6, d = u * rc.L * 0.97;
      for (const side of [-1, 1]) { sp.push(rc.x + tx * bend * u * u, rc.y - d, rc.z + tz * bend * u * u); sh.push(d); ss.push(side); sk.push(keepLen); }
      if (k < 6) { const a = base + k * 2; si.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
  }
  await yld();
  const quad = new THREE.PlaneGeometry(1, 1);
  const g = new THREE.InstancedBufferGeometry(); g.index = quad.index; g.setAttribute('position', quad.getAttribute('position'));
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(iPos), 3));
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(iA), 4));
  g.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(iB), 4));
  g.instanceCount = iPos.length / 3;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 30, 0), 75);
  const s = new THREE.BufferGeometry();
  s.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); s.setAttribute('aHang', new THREE.Float32BufferAttribute(sh, 1)); s.setAttribute('aSide', new THREE.Float32BufferAttribute(ss, 1)); s.setAttribute('aKeep', new THREE.Float32BufferAttribute(sk, 1)); s.setIndex(si);
  s.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 30, 0), 75);
  return { panes: g, strings: s, count: g.instanceCount };
}

function paneMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    vertexShader: GLSL_COMMON + /* glsl */`
      attribute vec3 iPos; attribute vec4 iA, iB;
      varying vec2 vUv; varying vec3 vCol, vN, vWp; varying vec3 vK;   // vK: random, fallen, frost
      #include <fog_pars_vertex>
      vec3 rot(vec3 v, vec3 ax, float a){ float c = cos(a), s = sin(a); return v * c + cross(ax, v) * s + ax * dot(ax, v) * (1. - c); }
      void main(){
        float r1 = iA.y, size = iA.w;
        float tt = max(uFallT - iB.y, 0.), fell = step(0.0001, tt);
        vec3 c = iPos + sway(iPos, iA.x) * exp(-tt * 0.8);
        // drag-limited fall to 4 m/s, with a lazy sideways wander
        float late = max(tt - 3.5, 0.); c.y -= 4. * (tt - (1. - exp(-1.4 * tt)) / 1.4) + 0.3 * late * late;   // stragglers hurry, so the air clears
        float wd = min(tt, 2.5) * 0.55;
        c.xz += vec2(sin(tt * 0.9 + r1 * 40.), cos(tt * 0.7 + r1 * 23.)) * wd + vec2(0.25, -0.15) * tt;
        float land = smoothstep(0.15, 1.6, c.y); c.y = max(c.y, 0.12);
        float yaw = iB.x + 0.35 * sin(uTime * 2.1 + r1 * 50.) * (1. - fell);
        float tilt = iB.w + 0.12 * sin(uTime * 1.7 + r1 * 31.);
        vec3 X = vec3(cos(yaw), 0., -sin(yaw)), N = vec3(sin(yaw) * cos(tilt), sin(tilt), cos(yaw) * cos(tilt));
        vec3 Y = cross(N, X);
        vec3 ax = normalize(vec3(sin(r1 * 90.), 0.35, cos(r1 * 90.)));
        float ang = tt * (1.4 + 2.6 * fract(r1 * 7.3));
        X = rot(X, ax, ang); Y = rot(Y, ax, ang); N = rot(N, ax, ang);
        float cd = distance(c, cameraPosition);
        float sc = mix(1., land * smoothstep(0.7, 1.8, cd) * mix(0.3, 1., smoothstep(2., 9., cd)), fell);
        vec3 lp = c + (X * position.x * size * 0.84 + Y * position.y * size * 1.22) * sc;
        vUv = position.xy * 2.; vN = normalize(mat3(modelMatrix) * N);
        vCol = seasonColor(0.55 * iA.z + 0.27 * r1 + 0.18 * iB.z, frontCoord(iPos), r1, 1. - clamp(iPos.y / 60., 0., 1.));
        vK = vec3(r1, fell, smoothstep(2.2, 3., uSeason));
        vec4 wp = modelMatrix * vec4(lp, 1.); vWp = wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      varying vec2 vUv; varying vec3 vCol, vN, vWp; varying vec3 vK;
      #include <fog_pars_fragment>
      void main(){
        float u = vUv.x, v = vUv.y, r = vK.x;
        // petal: pointed at the bottom, round at the top
        float w = v < 0. ? 0.84 * pow(max(v + 1., 0.), 0.62 + 0.3 * r) : 0.84 * sqrt(max(1. - v * v, 0.));
        float e = min(w - abs(u), (1. - v) * 1.4 + 0.02);
        if (e < 0.) discard;
        float fw = (abs(dFdx(u)) + abs(dFdy(u)) + abs(dFdx(v)) + abs(dFdy(v))) * 0.6;
        float bw = max(0.12, 1.5 * fw);
        float came = 1. - smoothstep(bw * 0.65, bw, e);
        vec3 V = normalize(vWp - cameraPosition), N = normalize(vN);
        float graze = abs(dot(N, V));
        float b = sheet(V) * mix(0.42, 1., smoothstep(0., 0.75, graze));
        float streak = 0.8 + 0.2 * sin(v * 3.2 + u * 7. * (r - 0.5) + r * 30. + sin(u * 4. + r * 11.));
        vec2 bb = fract(vUv * 1.7 + r * 7.) - 0.5; float bub = smoothstep(0.13, 0.04, length(bb)) * step(0.72, h21(floor(vUv * 1.7 + r * 7.) + r));
        float craze = smoothstep(0.08, 0.0, abs(sin(u * 6. + r * 9.) * sin(v * 5.3 + r * 7.) - 0.2)) * vK.z;
        float run = smoothstep(0.8, 1., sin(u * 9. + r * 40.)) * smoothstep(0.3, 1., sin(v * 2.4 + uTime * (2. + 2. * r) + r * 60.)) * uRain;
        vec3 glass = vCol * b * streak * uGlassGain * (1. - 0.12 * uRain) + bub * 0.45 + craze * 0.3 + run * 0.55;
        // a brief white glint as a tumbling pane turns its face to the light
        float gl = abs(dot(N, normalize(vec3(0., 0.75, 0.) - V)));
        gl *= gl; gl *= gl; gl *= gl; gl *= gl; gl *= gl; gl *= gl;
        glass += vec3(1., 0.97, 0.92) * gl * 3.2 * vK.y;
        float dissolve = 1. - smoothstep(0.18, 0.5, fw);
        vec3 col = mix(glass, mix(glass * 0.72, uLead, dissolve), came);
        gl_FragColor = vec4(col, 1.);
        #ifdef USE_FOG
          #ifdef FOG_EXP2
            float fogK = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth * uHeroFog);
          #else
            float fogK = smoothstep(fogNear, fogFar, vFogDepth) * uHeroFog;
          #endif
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogK);
        #endif
      }`,
  });
}

function stringMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    vertexShader: GLSL_COMMON + /* glsl */`
      attribute float aHang, aSide, aKeep;
      #include <fog_pars_vertex>
      void main(){
        // once its panes have gone the stalk breaks back to a short bare stub
        float h = mix(aHang, min(aHang, aKeep), smoothstep(3., 8., uFallT + h11(aKeep) * 1.5));
        vec3 p = position; p.y += aHang - h; p += sway(p, h);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
        vec2 dn = (modelViewMatrix * vec4(0., 1., 0., 0.)).xy; float l = length(dn); dn = l > 1e-4 ? dn / l : vec2(0., 1.);
        float wdt = clamp(0.0016 * -mvPosition.z, 0.03, 0.14);
        mvPosition.xy += vec2(-dn.y, dn.x) * aSide * wdt;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uLead; uniform float uHeroFog;
      #include <fog_pars_fragment>
      void main(){ gl_FragColor = vec4(uLead, 1.);
        #ifdef USE_FOG
          #ifdef FOG_EXP2
            float fogK = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth * uHeroFog);
          #else
            float fogK = smoothstep(fogNear, fogFar, vFogDepth) * uHeroFog;
          #endif
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogK);
        #endif
      }`,
  });
}

// ---- pools of colour on the ground under the dome ----
function buildPools(rng, n) {
  const quad = new THREE.PlaneGeometry(1, 1); quad.rotateX(-Math.PI / 2);
  const g = new THREE.InstancedBufferGeometry(); g.index = quad.index; g.setAttribute('position', quad.getAttribute('position'));
  const d = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const az = rng() * Math.PI * 2, r = Math.sqrt(rng.range(36, 46 * 46)); d[i * 4] = Math.sin(az) * r; d[i * 4 + 1] = Math.cos(az) * r; d[i * 4 + 2] = rng.range(8, 17); d[i * 4 + 3] = rng(); }
  g.setAttribute('iP', new THREE.InstancedBufferAttribute(d, 4)); g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 70);
  return g;
}
function poolMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    vertexShader: GLSL_COMMON + /* glsl */`
      attribute vec4 iP; varying vec2 vUv; varying vec3 vCol; varying float vR;
      #include <fog_pars_vertex>
      void main(){
        vec3 c = vec3(iP.x, 0.06 + iP.w * 0.03, iP.y);
        c += sway(c, 22.) * 1.4;
        vUv = position.xz * 2.; vR = iP.w;
        float fade = (1. - 0.75 * smoothstep(1., 8., uFallT)) * (1. - 0.6 * smoothstep(2.2, 3., uSeason));
        vCol = seasonColor(iP.w, frontCoord(c), iP.w, 0.5) * fade;
        vec4 mvPosition = modelViewMatrix * vec4(c + position * iP.z, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      varying vec2 vUv; varying vec3 vCol; varying float vR;
      #include <fog_pars_fragment>
      void main(){
        float a = atan(vUv.y, vUv.x + 1e-4), l = length(vUv);
        float lobes = 0.88 + 0.12 * sin(a * 3. + vR * 20. + uTime * 0.3) * sin(a * 2. - vR * 9.);
        float m = smoothstep(lobes, 0.0, l);
        gl_FragColor = vec4(vCol * vCol * m * m * 0.22, 1.);
        #ifdef USE_FOG
          #ifdef FOG_EXP2
            gl_FragColor.rgb *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          #else
            gl_FragColor.rgb *= 1. - smoothstep(fogNear, fogFar, vFogDepth);
          #endif
        #endif
      }`,
  });
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('wisteria') : ctx.rng, noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const detail = (ctx.quality?.detail ?? 1) * (opts.density ?? 1);
  const pickV = rng(), pickA = rng();
  const variant = opts.variant || (pickV < 0.7 ? 'wisteria' : 'laburnum');
  const autumn = opts.autumn || (pickA < 0.6 ? 'amber' : pickA < 0.8 ? 'wine' : 'ginkgo');
  const TL = Object.assign({ summer: [0.17, 0.30], autumn: [0.575, 0.63], fall: 0.60, winter: [0.70, 0.80] }, opts.timeline || {});
  const duration = opts.duration ?? 40;

  const U = {
    uTime: { value: 0 }, uSeason: { value: 0 }, uFallT: { value: -1 },
    uSheetGain: { value: opts.sheetGain ?? 1.15 }, uGlassGain: { value: opts.glassGain ?? 1.5 },
    uHeroFog: { value: 1 }, uFam: { value: makeFamilies(pal, variant, autumn) }, uLead: { value: new THREE.Color(pal[0]) }, uRain: { value: opts.rain ?? 0 },
  };
  const P = { strands: rng.int(4, 6), hand: rng.sign(), ribs: rng.int(13, 17), swirl: rng.range(0.25, 0.7), twigs: 150 };

  const object = new THREE.Group(); object.name = 'wisteria-tree';
  const yld = async () => { if (ctx.yield) await ctx.yield(); };
  const lead = await buildLead(rng, noise, P, yld);
  const leadMesh = new THREE.Mesh(lead.geometry, leadMaterial(U)); object.add(leadMesh);
  await ctx.yield?.();
  const shell = new THREE.Mesh(buildShell(noise), shellMaterial(U)); object.add(shell);
  await ctx.yield?.();
  const racemes = layoutRacemes(rng, lead.attach, 420);
  await ctx.yield?.();
  const pg = await buildPanes(rng, racemes, Math.round(40000 * detail), yld);
  await yld();
  const panes = new THREE.Mesh(pg.panes, paneMaterial(U)); object.add(panes);
  const strings = new THREE.Mesh(pg.strings, stringMaterial(U)); object.add(strings);
  await ctx.yield?.();
  let pools = null;
  if (opts.pools !== false) { pools = new THREE.Mesh(buildPools(rng, Math.round(130 * Math.min(1, detail))), poolMaterial(U)); pools.renderOrder = 2; object.add(pools); }

  // ---- anchors ----
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const fly = [V(28, 18, 150), V(28, 16.5, 95), V(28, 15, 36)];
  for (let k = 0; k <= 8; k++) { const a = A0 + (A1 - A0) * (k / 8); fly.push(V(Math.sin(a) * PATH_R, 14 + 4 * Math.sin(Math.PI * k / 8), Math.cos(a) * PATH_R)); }
  const ex = Math.sin(A1) * PATH_R, ez = Math.cos(A1) * PATH_R, hx = Math.cos(A1), hz = -Math.sin(A1), exitDir = V(hx, 0, hz);
  const exitPos = V(ex + hx * 35.2, 15, ez + hz * 35.2);
  fly.push(exitPos.clone(), V(ex + hx * 105, 16, ez + hz * 105));
  const anchors = {
    flyThrough: fly,
    entryParting: { position: V(28, 15, 36), direction: V(0, 0, -1), width: 14 },
    exitParting: { position: exitPos, direction: exitDir, width: 14 },
    orbit: { center: V(0, 0, 0), radius: PATH_R, fromAzimuth: A0, toAzimuth: A1, yMin: 14, yMax: 18 },
    portalSeat: { position: V(ex + hx * 95, 16, ez + hz * 95), normal: exitDir.clone().negate() },
    viewpoints: { reveal: V(28, 20, 150), inside: V(28, 15, 10), underApex: V(9, 16, 9) },
    trunkTop: V(0, TRUNK_TOP, 0), apex: V(0, H, 0), rimRadius: R, curtainBottom: 8,
  };

  // ---- progress ----
  let driven = false;
  const seg = (u, a) => Math.min(1, Math.max(0, (u - a[0]) / (a[1] - a[0])));
  function setState(s) {
    driven = true;
    if (s.season != null) U.uSeason.value = Math.min(3, Math.max(0, s.season));
    if (s.fallT != null) U.uFallT.value = s.fallT;
  }
  function applyU(u) {
    U.uSeason.value = seg(u, TL.summer) + seg(u, TL.autumn) + seg(u, TL.winter);
    U.uFallT.value = u > TL.fall ? (u - TL.fall) * duration : -1;
  }
  function setProgress(u) { driven = true; applyU(Math.min(1, Math.max(0, u))); }
  return {
    object, radius: R + 1, height: H, center: V(0, 31, 0), anchors,
    variant, autumn, uniforms: U, setProgress, setState,
    update(dt, time) {
      U.uTime.value = time;
      if (!driven) applyU((time / 40) % 1);
    },
    dispose() {},
    ground: true, groundY: 0,
    stats: { panes: pg.count, racemes: racemes.length },
  };
}
