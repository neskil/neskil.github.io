// Hero set piece for "The Chandelier City": THE GRAND CHANDELIER.
//
// An open "waterfall" corona 520 m wide hanging from the cloud: four concentric gilded ring-terraces
// stepping down and inward, each a continuous arcade of lit windows with a coffered, lamp-studded
// soffit, pierced cresting, a lace valance, S-armed candle-cups, and scalloped curtains of opaque
// faceted crystal pendants that turn and flash coral, gold and violet. Pearl swags join the tiers,
// a tent of pearl strands rises to a petalled ceiling rose in the cloud, and from the innermost ring
// four gold bead-chains converge on the lowest pendant of all: a 14 m gold ring that frames the portal.
//
// LOCAL SPACE  local Y is ALTITUDE: the origin is the point on the sea directly under the central boss
//   (put hero.object at (x, 0, z) with the sea at y = 0 and the cloud floor at y = 600). +Y up.
//   Azimuth az is measured from +Z toward +X (x = r sin az, z = r cos az). The camera's final swing
//   comes in from +Z travelling toward -Z; the portal ring stands in the XY plane facing +Z.
//   Rings (centreline radius / altitude / scale): 250/590/1.7, 200/545/1.5, 150/500/1.25, 104/460/1.0.
//   The piece spans y = 394 (teardrop under the portal) .. 612 (rim of the ceiling rose).
//   The cloud should be dimpled up to y >= 612 within 80 m of the axis, or simply swallow the rose's rim.
//
// OPTS  { palette          brief palette, 7 hex strings: [0] cream, [1] rose, [2] pink, [3] lilac,
//                          [4] periwinkle, [5] pale gold, [6] coral
//         sunDir           world-space unit vector TOWARD the sun (default: 4 deg up, 30 deg left of the
//                          portal as seen on approach = normalize(-0.5, 0.07, -0.866))
//         sunColor         hex, default '#FFB48A';  sunIntensity = 1.5
//         crystalDensity = 1   scales the pendant count (6,300-7,400 at 1, depending on the seed)
//         portalFrame = true   build the gold ring, crown, pearls and teardrop around the portal seat
//         sway = 1             scales the slow sway/twist of the whole corona (0.23 deg at 1) }
//   Per seed: scallop count and style (scallop / gothic / wave) of every crystal curtain, the leading
//   pendant colour, swag count and
//   twist direction, candle-arm count, rose petal count, window colour mix, gilding warmth, phases.
//
// RETURNS  radius 262, height 218, center (0, 490, 0), ground: false.
//   setProgress(u)   0..1 over the final swing (set it from the world's path u, never from time):
//                    a pulse of light runs down the four chains to the portal frame, the frame's glow
//                    and the crystal sparkle rise as the gondola falls toward the ring. Default 0.
//   setSun(dir, colorHex, intensity)   re-aim the built-in key light (world space).
//   uniforms         shared table: uTime, uSway, uProgress, uSunDir, uSunCol, uSkyUp, uSkyDn, uHaze, uGlow.
//   info             { rings, crystals, beads, arms, triangles }.
//
// ANCHORS (local space)
//   portalSeat    { position (0,410,0), normal (0,0,1) toward the arriving camera, travel (0,0,-1), radius 7 }
//   ropeAnchor    (0,600,0): tip of the central boss, pivot of the final 190 m rope.
//   catchPlatform (0,442.5,106): where the final quarter-swing starts, under the inner ring's rim in the +Z gate.
//   flyThrough    ordered points of the final pendulum arc (radius 190 about ropeAnchor, 34 deg -> 0) and
//                 60 m straight on beyond the ring. Clearance: >= 9 m to the inner ring's valance and gate
//                 fringe at the start, >= 14 m to the chains, 7 m to the portal frame at the crossing.
//   approach      points of a level lane from outside the corona to catchPlatform along +Z.
//   gates         azimuths [0, pi/2, pi, 3pi/2] where every curtain is parted (+-7 deg clear, soft to 16 deg).
//                 The same four lanes are free of swags, tent strands and chains. Mirror/rotate freely.
//   clearBelow    445: outside r = 116 m nothing hangs below y = 455, so any path under 445 m is free;
//                 only the inner ring's curtain (r 98..110) reaches down to y = 430, and it opens at the gates.
//   rings         [{ radius, y, scale, halfWidth, bottom }]  for hanging platforms, swifts, wisteria.
//   viewpoints    { reveal, under, inside, rim }: good camera positions.
//   glowPoints    [{ position, color, intensity, radius }] if the world wants fake light pools.
//
// COST  125-133k triangles in 4 draw calls (rings + rose + frame; crystals; candle arms; bead/flame
//   impostors), no lights, no textures, ~150 ms build. Beads are camera-facing sphere impostors that never
//   draw thinner than ~1.6 px (update() needs the camera for that).
//
// LIGHTING / STYLE  Self-shaded ShaderMaterials (they ignore scene lights, honour scene fog): a high-key
//   hemisphere (cream cloud bounce from above, lavender sea bounce from below: nothing falls darker than
//   mid periwinkle), a wrapped near-horizontal coral key along uSunDir, a fake pastel environment in every
//   gilded reflection and warm fresnel rims. Emissive: windows ~3, soffit lamps ~4, candle flames ~7,
//   crystal sparkles up to ~9. It wants wide gentle bloom (strength ~0.5, radius ~0.8, threshold ~0.9),
//   periwinkle fog #9C9AD0 and a low-contrast grade. To match the style elsewhere: ambient =
//   mix(uSkyDn, uSkyUp, N.y*0.5+0.5), sun wrap = ((N.L+0.45)/1.45)^2, rounded ornamental forms.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
const DEFAULT_PALETTE = ['#FBF1E1', '#F3B9A6', '#E8C7D6', '#B9B4E6', '#8E8CC9', '#FFE2A6', '#FF7A59'];
const PIVOT_Y = 600, PORTAL_Y = 410, ROPE = 190;
const RINGS = [
  { radius: 250, y: 590, scale: 1.7 },
  { radius: 200, y: 545, scale: 1.5 },
  { radius: 150, y: 500, scale: 1.25 },
  { radius: 104, y: 460, scale: 1.0 },
];
const GATE_HALF = 7 * Math.PI / 180, GATE_SOFT = 9 * Math.PI / 180;

// ---------------------------------------------------------------- shared GLSL
const COMMON = /* glsl */`
uniform float uTime, uSway, uProgress, uGlow;
uniform vec3 uSunDir, uSunCol, uSkyUp, uSkyDn, uHaze;
// slow sway + twist about the ceiling pivot; lower tiers lag; fades out toward the portal so the seat is fixed
vec3 swayP(vec3 p, float lag){
  float d = 600.0 - p.y;
  float w = smoothstep(418.0, 452.0, p.y);
  float ph = d*0.006 + lag;
  float ax = uSway*sin(uTime*0.262 - ph)*w;
  float az = uSway*0.7*sin(uTime*0.217 + 1.3 - ph)*w;
  float tw = uSway*1.4*sin(uTime*0.171 + 0.6 - ph*1.5)*w;
  p.x += d*ax; p.z += d*az;
  p.xz += vec2(-p.z, p.x)*tw;
  return p;
}
float hash1(float n){ return fract(sin(n*12.9898)*43758.5453); }
vec3 envCol(vec3 d){
  vec3 c = mix(uHaze, uSkyUp, smoothstep(0.0, 0.55, d.y));
  c = mix(c, uSkyDn, smoothstep(0.0, -0.45, d.y));
  float s = max(dot(d, uSunDir), 0.0);
  c += uSunCol*(pow(s, 6.0)*0.35 + pow(s, 48.0)*1.6);
  return c;
}
// high-key pastel shading: hemisphere bounce + wrapped coral key + pastel reflections + warm rim
vec3 shade(vec3 alb, vec3 N, vec3 V, float metal, float gloss){
  vec3 amb = mix(uSkyDn, uSkyUp, N.y*0.5 + 0.5);
  float wrap = clamp((dot(N, uSunDir) + 0.45)/1.45, 0.0, 1.0);
  vec3 dif = alb*(amb*0.78 + uSunCol*wrap*wrap*0.5);
  vec3 R = reflect(-V, N);
  float fr = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
  vec3 env = envCol(R);
  vec3 col = dif*(1.0 - 0.5*metal) + env*alb*metal*0.62*gloss;
  col += env*fr*(0.06 + 0.16*gloss);
  col += uSunCol*pow(max(dot(R, uSunDir), 0.0), 24.0)*gloss*(0.25 + 0.75*metal)*0.55;
  return col;
}
`;

// ---------------------------------------------------------------- small helpers
const angDist = (a, b) => { let d = Math.abs(a - b) % TAU; return d > Math.PI ? TAU - d : d; };
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function gateFactor(az) { // 0 inside a gate lane, 1 away from it
  let g = 1;
  for (let k = 0; k < 4; k++) g = Math.min(g, sstep(GATE_HALF, GATE_HALF + GATE_SOFT, angDist(az, k * Math.PI / 2)));
  return g;
}
const polar = (r, az, y, out = new THREE.Vector3()) => out.set(r * Math.sin(az), y, r * Math.cos(az));
// points along a sagging span from A to B (parabolic catenary), `spacing` apart along the curve
function swagPoints(A, B, sag, spacing) {
  const N = 48, pts = [], len = [0]; let L = 0;
  for (let i = 0; i <= N; i++) {
    const t = i / N, p = new THREE.Vector3().lerpVectors(A, B, t); p.y -= sag * 4 * t * (1 - t);
    if (i) { L += p.distanceTo(pts[i - 1]); len.push(L); }
    pts.push(p);
  }
  const n = Math.max(2, Math.round(L / spacing)), out = []; let j = 0;
  for (let i = 0; i <= n; i++) {
    const s = (i / n) * L; while (j < N - 1 && len[j + 1] < s) j++;
    const f = (s - len[j]) / Math.max(1e-6, len[j + 1] - len[j]);
    out.push({ p: new THREE.Vector3().lerpVectors(pts[j], pts[j + 1], f), t: i / n });
  }
  return out;
}
// give a three.js geometry the aData attribute (u, v, kind, w) and strip what the shader does not use
function tagGeometry(g, kind, w) {
  const n = g.attributes.position.count, d = new Float32Array(n * 4);
  const uv = g.attributes.uv;
  for (let i = 0; i < n; i++) { d[i * 4] = uv ? uv.getX(i) : 0; d[i * 4 + 1] = uv ? uv.getY(i) : 0; d[i * 4 + 2] = kind; d[i * 4 + 3] = w; }
  g.setAttribute('aData', new THREE.BufferAttribute(d, 4));
  g.deleteAttribute('uv');
  return g;
}

// ---------------------------------------------------------------- ring terraces
// Cross-section (dr outward, dy up) in ring-scale units, as flat-shaded segments: [r0, y0, r1, y1, kind].
// kinds: 0 gilt moulding, 1 arcade wall, 2 roof, 3 coffered soffit, 4 cresting strip, 5 valance strip, 6 plain, 8 deck
const PROFILE = [
  [7.0, 5.0, 7.7, 4.1, 0], [7.7, 4.1, 6.2, 3.0, 0], [6.2, 3.0, 6.2, -3.0, 1], [6.2, -3.0, 7.0, -3.7, 0],
  [7.0, -3.7, 5.0, -6.0, 3], [5.0, -6.0, 0.0, -7.0, 3], [0.0, -7.0, -5.0, -6.0, 3], [-5.0, -6.0, -7.0, -3.7, 3],
  [-7.0, -3.7, -6.2, -3.0, 0], [-6.2, -3.0, -6.2, 3.0, 1], [-6.2, 3.0, -7.7, 4.1, 0], [-7.7, 4.1, -7.0, 5.0, 0],
  [-7.0, 5.0, -3.6, 5.0, 8], [-3.6, 5.0, 0.0, 7.6, 2], [0.0, 7.6, 3.6, 5.0, 2], [3.6, 5.0, 7.0, 5.0, 8],
  // double-sided alpha-cut strips
  [7.0, 5.0, 7.0, 7.4, 4], [-7.0, 5.0, -7.0, 7.4, 4], [7.0, -3.7, 7.0, -8.0, 5], [-7.0, -3.7, -7.0, -8.0, 5],
];
function buildRing(ring, bays, ringId) {
  const { radius: R, y: Y, scale: s } = ring, segs = PROFILE.length, nv = segs * 2 * (bays + 1);
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), dat = new Float32Array(nv * 4), idx = [];
  const bayW = TAU * R / bays;
  let v = 0;
  for (let si = 0; si < segs; si++) {
    const [r0, y0, r1, y1, kind] = PROFILE[si];
    let nr = y1 - y0, ny = -(r1 - r0); const nl = Math.hypot(nr, ny) || 1; nr /= nl; ny /= nl;
    const mr = (r0 + r1) / 2, my = (y0 + y1) / 2 + 0.5;
    if (kind === 4 || kind === 5) { nr = Math.sign(r0); ny = 0; } else if (nr * mr + ny * my < 0) { nr = -nr; ny = -ny; }
    let v0 = 0, v1 = 1, w = 0;
    if (kind === 1) w = (6.0 * s) / bayW + 10 * (ringId * 2 + (r0 > 0 ? 0 : 1));
    else if (kind === 3) { v0 = (r0 + 7) / 14; v1 = (r1 + 7) / 14; w = ringId; }
    else if (kind === 2) { w = r0 + r1 > 0 ? 1 : 0; }
    else if (kind === 0) w = ringId;
    const base = v;
    for (let i = 0; i <= bays; i++) {
      const az = (i / bays) * TAU, sn = Math.sin(az), cs = Math.cos(az);
      for (let e = 0; e < 2; e++) {
        const rr = R + (e ? r1 : r0) * s, yy = Y + (e ? y1 : y0) * s;
        pos[v * 3] = rr * sn; pos[v * 3 + 1] = yy; pos[v * 3 + 2] = rr * cs;
        nor[v * 3] = nr * sn; nor[v * 3 + 1] = ny; nor[v * 3 + 2] = nr * cs;
        dat[v * 4] = i; dat[v * 4 + 1] = e ? v1 : v0; dat[v * 4 + 2] = kind; dat[v * 4 + 3] = w;
        v++;
      }
    }
    for (let i = 0; i < bays; i++) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aData', new THREE.BufferAttribute(dat, 4));
  g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------- materials
const FOG_V = '#include <common>\n#include <fog_pars_vertex>\n';
const FOG_F = '#include <common>\n#include <fog_pars_fragment>\n';

const GILT_VERT = FOG_V + COMMON + /* glsl */`
attribute vec4 aData;
varying vec3 vWorld, vN; varying vec4 vData;
void main(){
  vec3 p = swayP(position, 0.0);
  vec4 wp = modelMatrix*vec4(p, 1.0);
  vWorld = wp.xyz; vN = normalize(mat3(modelMatrix)*normal); vData = aData;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const GILT_FRAG = FOG_F + COMMON + /* glsl */`
uniform vec3 uGold, uCream, uRose, uLilac, uCoral, uWarm;
varying vec3 vWorld, vN; varying vec4 vData;
void main(){
  float k = vData.z; vec2 uv = vData.xy; float w = vData.w;
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 N = normalize(vN); if(dot(N, V) < 0.0) N = -N;
  vec3 alb = uGold; float metal = 0.8, gloss = 0.8; vec3 emi = vec3(0.0);
  float bx = fract(uv.x) - 0.5, bay = floor(uv.x);
  if(k < 0.5){                                   // gilt moulding with a bead-and-reel rhythm
    alb = uGold*(0.82 + 0.18*cos(uv.x*31.416))*(0.9 + 0.1*cos(uv.y*9.42));
  } else if(k < 1.5){                            // arcade wall: arched lit windows between pilasters
    float id = floor(w/10.0 + 0.001), asp = w - id*10.0;
    float py = uv.y*asp, hw = 0.30, sill = 0.13*asp, spring = asp*0.87 - hw, dx = abs(bx);
    float d = py > spring ? length(vec2(bx, py - spring)) - hw : max(dx - hw, sill - py);
    float band = 0.5 + 0.5*cos(6.2832*(uv.x*0.021 + uTime*0.012 + id*0.13));
    vec3 prism = 0.5 + 0.5*cos(6.2832*(uv.x*0.05 - uTime*0.02 + vec3(0.0, 0.33, 0.67)));
    alb = uCream*0.78*mix(vec3(1.0), 0.75 + 0.5*prism, 0.22*pow(band, 3.0)); metal = 0.05; gloss = 0.3;
    alb *= 0.9 + 0.1*smoothstep(0.0, 0.12, d);                       // soft shadow line round each opening
    if(dx > 0.43 || py < 0.07*asp || py > 0.95*asp){ alb = uGold*(0.85 + 0.15*cos(py*40.0)); metal = 0.8; gloss = 0.8; }
    if(d < 0.045 && d >= 0.0){ alb = uGold; metal = 0.8; gloss = 0.9; }
    if(d < 0.0){
      float h = hash1(bay*1.37 + id*17.13 + 3.1), lit = step(0.3, h);
      vec3 gc = mix(uWarm, uCoral, step(0.82, h)*0.55); gc = mix(gc, uCream, step(h, 0.45)*0.4);
      float mull = step(0.022, dx)*step(0.022, abs(py - spring));
      float tw = 0.86 + 0.14*sin(uTime*(0.5 + h*1.6) + h*50.0);
      float grad = 0.65 + 0.35*clamp((spring + hw - py)/(spring + hw - sill), 0.0, 1.0);
      alb = mix(uLilac, uRose, step(0.5, fract(h*7.0)))*0.5; metal = 0.3; gloss = 1.0;
      emi = gc*(1.9*lit + 0.12)*tw*grad*mix(0.3, 1.0, mull);
    }
  } else if(k < 2.5){                            // tiled roof with lit dormers
    float rv = w > 0.5 ? uv.y : 1.0 - uv.y, row = floor(rv*5.0);
    float t = fract(rv*5.0), tx = fract(uv.x*3.0 + row*0.5);
    alb = mix(uRose, uCoral, 0.22)*(0.72 + 0.2*t)*(0.9 + 0.1*step(0.1, tx)); metal = 0.05; gloss = 0.35;
    if(rv < 0.09){ alb = uGold; metal = 0.8; gloss = 0.8; }
    if(mod(bay, 3.0) < 0.5 && abs(bx) < 0.13 && rv > 0.38 && rv < 0.72){
      alb = uCream*0.7; if(abs(bx) < 0.085 && rv > 0.45 && rv < 0.66) emi = uWarm*1.8;
    }
  } else if(k < 3.5){                            // coffered soffit with a lamp in every other coffer
    float row = floor(uv.y*3.0); vec2 c = vec2(bx, fract(uv.y*3.0) - 0.5);
    float e = max(abs(c.x), abs(c.y)), rib = smoothstep(0.37, 0.43, e), l = length(c);
    alb = mix(mix(uRose, uLilac, 0.5 + 0.5*sin(row*2.1 + w*1.7))*0.85, uGold, rib); metal = mix(0.1, 0.8, rib); gloss = 0.7;
    alb = mix(alb, uGold, smoothstep(0.24, 0.2, l)*smoothstep(0.12, 0.16, l)); 
    float on = step(0.5, mod(bay + row, 2.0));
    emi = uWarm*3.2*smoothstep(0.14, 0.09, l)*on*(0.85 + 0.15*sin(uTime*1.3 + bay*2.4 + row));
  } else if(k < 4.5){                            // pierced cresting (v: 0 base .. 1 tips)
    float x2 = fract(uv.x*2.0) - 0.5, h = 0.2 + 0.8*pow(max(cos(x2*3.14159), 0.0), 0.6);
    if(uv.y > h) discard; if(length(vec2(x2*1.3, uv.y - 0.5)) < 0.2) discard;
    alb = uGold*(0.9 + 0.1*uv.y);
  } else if(k < 5.5){                            // lace valance (v: 0 top .. 1 scallop tips)
    float x2 = fract(uv.x*2.0) - 0.5, h = 0.25 + 0.75*sqrt(max(1.0 - 4.0*x2*x2, 0.0));
    if(uv.y > h) discard; if(length(vec2(x2*1.2, uv.y - 0.55)) < 0.17) discard;
    alb = mix(uCream*0.8, uGold, smoothstep(h - 0.22, h - 0.05, uv.y)); metal = 0.45;
  } else if(k < 6.5){                            // plain gilt / cream plaster (w = cream amount)
    alb = mix(uGold, uCream*0.8, w); metal = mix(0.8, 0.12, w); gloss = mix(0.8, 0.4, w);
  } else if(k < 7.5){                            // portal frame: engraved gold that wakes with uProgress
    float eng = 0.5 + 0.5*cos(uv.x*6.2832*48.0);
    alb = uGold*(0.85 + 0.15*eng);
    float fr = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.0);
    emi = uWarm*uGlow*(0.35 + 0.25*fr + uProgress*(1.6 + 0.6*sin(uv.x*6.2832*4.0 - uTime*2.0)));
  } else {                                       // terrace deck: cream paving, gold inlay
    alb = uCream*0.74*(0.92 + 0.08*step(0.06, abs(bx))); metal = 0.08; gloss = 0.3;
    alb = mix(alb, uGold, step(0.9, fract(uv.y*2.0 + 0.45))*0.8);
  }
  vec3 col = shade(alb, N, V, metal, gloss) + emi;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

const CRYSTAL_VERT = FOG_V + COMMON + /* glsl */`
attribute vec3 aTop; attribute vec4 aSc; attribute vec3 aTint;
varying vec3 vWorld, vN, vTint, vL; varying float vSeed;
void main(){
  float seed = aSc.z; vL = position;
  float ang = seed*40.0 + uTime*(0.22 + 0.5*fract(seed*7.0))*(fract(seed*13.0) < 0.5 ? -1.0 : 1.0);
  float c = cos(ang), s = sin(ang); mat2 rot = mat2(c, -s, s, c);
  vec3 lp = position; lp.xz = rot*lp.xz; vec3 n = normal; n.xz = rot*n.xz;
  vec3 sc = vec3(aSc.x, aSc.y, aSc.x);
  lp *= sc; n = normalize(n/sc);
  vec3 p = aTop + lp;
  float sp = dot(aTop.xz, vec2(0.131, 0.177));            // one phase per strand
  float dd = aSc.w - lp.y;                                 // metres below the ring it hangs from
  p.x += dd*0.02*sin(uTime*0.7 + sp); p.z += dd*0.02*cos(uTime*0.6 + sp*1.7);
  p = swayP(p, 0.35);
  vec4 wp = modelMatrix*vec4(p, 1.0);
  vWorld = wp.xyz; vN = normalize(mat3(modelMatrix)*n); vTint = aTint; vSeed = seed;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const CRYSTAL_FRAG = FOG_F + COMMON + /* glsl */`
uniform vec3 uCoral, uWarm, uViolet;
varying vec3 vWorld, vN, vTint, vL; varying float vSeed;
void main(){
  vec3 V = normalize(cameraPosition - vWorld), N = normalize(vN);
  // brilliant-cut sub-facets: each face is split into bands and sectors with slightly different tilts
  float cid = floor(vL.y*5.0)*7.0 + floor(atan(vL.z, vL.x)*2.5465) + floor(vSeed*89.0 + 0.5);
  float cut = clamp(1.0 - fwidth(vL.y)*12.0, 0.0, 1.0);
  N = normalize(N + (vec3(hash1(cid), hash1(cid + 1.7), hash1(cid + 3.1)) - 0.5)*0.55*cut);
  float tone = 1.0 + (hash1(cid + 5.3) - 0.5)*0.22*cut;
  vec3 R = reflect(-V, N);
  float ndv = abs(dot(N, V)), fr = pow(1.0 - ndv, 2.5);
  vec3 amb = mix(uSkyDn, uSkyUp, N.y*0.5 + 0.5);
  float wrap = clamp((dot(N, uSunDir) + 0.5)/1.5, 0.0, 1.0);
  vec3 irid = 0.5 + 0.5*cos(6.2832*(ndv*1.2 + vSeed*3.0 + R.y*0.35 + vec3(0.0, 0.33, 0.67)));
  vec3 base = vTint*tone*mix(vec3(1.0), 0.55 + 0.8*irid, 0.5);     // view-dependent hue shift
  vec3 col = base*(amb*0.72 + uSunCol*wrap*wrap*0.46);
  col += envCol(R)*(0.08 + 0.34*fr);
  // sparkle: three fake lights (sun, its glitter path on the sea, the bright cloud above)
  vec3 L2 = normalize(vec3(uSunDir.x, -0.55, uSunDir.z)), L3 = normalize(vec3(-uSunDir.x*0.6, 0.75, -uSunDir.z*0.6));
  float gain = 1.0 + 1.5*uProgress;
  float s1 = pow(max(dot(R, uSunDir), 0.0), 42.0), s2 = pow(max(dot(R, L2), 0.0), 60.0), s3 = pow(max(dot(R, L3), 0.0), 60.0);
  col += (mix(uCoral, uWarm, 0.3)*s1*10.0 + uWarm*s2*7.0 + uViolet*s3*7.0)*gain;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// sphere / flame impostors: aPS = centre + diameter, aCol = rgb + kind (0 pearl, 1 gold, 2 flame, 3 chain gold)
const BEAD_VERT = FOG_V + COMMON + /* glsl */`
attribute vec4 aPS; attribute vec4 aCol; attribute vec2 aAux;
uniform float uPix;
varying vec2 vQ; varying vec4 vCol; varying vec3 vWorld; varying float vT;
void main(){
  vec3 c = aPS.xyz; float kind = aCol.a;
  c.x += sin(uTime*0.5 + aAux.x*3.0)*aAux.y; c.z += cos(uTime*0.43 + aAux.x*3.0)*aAux.y;
  c = swayP(c, aAux.x*0.4);
  vec4 wp = modelMatrix*vec4(c, 1.0);
  vec4 mvPosition = viewMatrix*wp;
  float r = max(aPS.w*0.5, -mvPosition.z*uPix*0.8);          // never thinner than ~1.6 px
  vec2 q = position.xy; vT = aAux.x;
  if(kind > 1.5 && kind < 2.5){
    float fl = 0.88 + 0.12*sin(uTime*7.0 + aAux.x*31.0) + 0.06*sin(uTime*13.0 + aAux.x*17.0);
    mvPosition.x += sin(uTime*3.1 + aAux.x*9.0)*r*0.12*(q.y + 1.0);
    mvPosition.xy += q*r*vec2(0.9, 1.7*fl) + vec2(0.0, r*1.5);
  } else mvPosition.xy += q*r;
  vQ = q; vCol = aCol; vWorld = wp.xyz;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const BEAD_FRAG = FOG_F + COMMON + /* glsl */`
uniform vec3 uWarm, uCoral;
varying vec2 vQ; varying vec4 vCol; varying vec3 vWorld; varying float vT;
void main(){
  vec3 col; float kind = vCol.a;
  if(kind > 1.5 && kind < 2.5){                                 // candle flame: HDR teardrop
    float yy = vQ.y*0.5 + 0.5, wd = 1.5*sqrt(yy)*(1.0 - yy)*1.7;
    float e = abs(vQ.x)/max(wd, 1e-3); if(e > 1.0) discard;
    col = mix(vec3(1.0, 0.86, 0.62)*6.0, uCoral*2.6, smoothstep(0.2, 1.0, e)*0.8 + yy*0.2);
  } else {
    float r2 = dot(vQ, vQ); if(r2 > 1.0) discard;
    vec3 nV = vec3(vQ, sqrt(1.0 - r2));
    vec3 N = normalize((vec4(nV, 0.0)*viewMatrix).xyz), V = normalize(cameraPosition - vWorld);
    bool gold = kind > 0.5;
    col = shade(vCol.rgb, N, V, gold ? 0.85 : 0.25, 1.0);
    if(!gold) col += vCol.rgb*0.12 + uSunCol*pow(max(dot(reflect(-V, N), uSunDir), 0.0), 30.0)*1.2;   // pearl lustre
    if(kind > 2.5){                                              // chain: a pulse runs down to the portal
      float wave = exp(-pow((vT - uProgress*1.25 + 0.12)*7.0, 2.0));
      col += uWarm*(wave*4.0*step(0.001, uProgress) + 0.25*uProgress)*uGlow;
    }
  }
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

const ARM_VERT = FOG_V + COMMON + /* glsl */`
attribute vec4 aBase; attribute vec3 aDir; attribute float aPart;
varying vec3 vWorld, vN; varying vec2 vP;
void main(){
  float s = aBase.w, seed = aDir.z;
  vec3 lp = position*s; vec3 n = normal;
  lp.y += sin(uTime*1.3 + seed*40.0)*0.035*lp.x;              // cups tremble on their arms
  lp.z += sin(uTime*0.9 + seed*23.0)*0.03*lp.x;
  vec3 o = vec3(aDir.x, 0.0, aDir.y), t = vec3(aDir.y, 0.0, -aDir.x);
  vec3 p = aBase.xyz + o*lp.x + vec3(0.0, lp.y, 0.0) + t*lp.z;
  n = o*n.x + vec3(0.0, n.y, 0.0) + t*n.z;
  p = swayP(p, 0.15);
  vec4 wp = modelMatrix*vec4(p, 1.0);
  vWorld = wp.xyz; vN = normalize(mat3(modelMatrix)*n); vP = vec2(aPart, seed);
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const ARM_FRAG = FOG_F + COMMON + /* glsl */`
uniform vec3 uGold, uWarm, uCream, uCoral;
varying vec3 vWorld, vN; varying vec2 vP;
void main(){
  vec3 V = normalize(cameraPosition - vWorld), N = normalize(vN); if(dot(N, V) < 0.0) N = -N;
  float glass = clamp(vP.x, 0.0, 1.0);                        // 0 brass arm .. 1 glowing cup lip
  vec3 alb = mix(uGold, mix(uCream, uWarm, 0.75)*0.8, step(0.02, glass));
  vec3 col = shade(alb, N, V, glass > 0.02 ? 0.2 : 0.85, 0.9);
  float fl = 0.85 + 0.15*sin(uTime*5.0 + vP.y*61.0);
  col += mix(uCoral, uWarm, 0.35 + 0.65*glass)*(0.25*step(0.02, glass) + glass*glass*2.4)*fl;         // the cup is a lantern: lit from inside
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

function makeMaterial(U, vert, frag, extra = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    vertexShader: vert, fragmentShader: frag, fog: true, ...extra,
  });
}

// ---------------------------------------------------------------- part geometries
function crystalGeometry() {          // faceted drop: 8 flat faces, point at the top (y = 0), long point down (y = -1)
  const T = [0, 0, 0], B = [0, -1, 0], gy = -0.3;
  const g = [[0.5, gy, 0], [0, gy, 0.5], [-0.5, gy, 0], [0, gy, -0.5]];
  const pos = [], nor = [], a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  const tri = (p, q, r) => {
    a.fromArray(p); b.fromArray(q); c.fromArray(r); n.subVectors(b, a).cross(c.clone().sub(a)).normalize();
    pos.push(...p, ...q, ...r); for (let i = 0; i < 3; i++) nor.push(n.x, n.y, n.z);
  };
  for (let i = 0; i < 4; i++) { const g0 = g[i], g1 = g[(i + 1) % 4]; tri(T, g1, g0); tri(B, g0, g1); }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return geo;
}
function armGeometry() {              // S-curved brass arm + candle-cup; local x = outward, y = up
  const curve = new THREE.CatmullRomCurve3([[0, 0.4, 0], [1.5, -1.2, 0], [3.3, -1.7, 0], [4.6, -0.8, 0], [5.0, 1.6, 0]].map((p) => new THREE.Vector3(...p)));
  const tube = new THREE.TubeGeometry(curve, 7, 0.3, 4, false).toNonIndexed();
  const prof = [[0.03, -0.5], [0.5, -0.1], [1.35, 0.2], [0.55, 0.65], [0.85, 1.7], [1.3, 3.0], [1.1, 3.9]].map((p) => new THREE.Vector2(p[0], p[1]));
  const cup = new THREE.LatheGeometry(prof, 7).toNonIndexed(); cup.translate(5.0, 2.0, 0);
  const part = (g, f) => { const n = g.attributes.position.count, arr = new Float32Array(n); for (let i = 0; i < n; i++) arr[i] = f(g.attributes.position.getY(i)); g.setAttribute('aPart', new THREE.BufferAttribute(arr, 1)); g.deleteAttribute('uv'); return g; };
  part(tube, () => 0); part(cup, (y) => Math.max(0, Math.min(1, (y - 2.65) / 3.2)));
  const m = mergeGeometries([tube, cup]); tube.dispose(); cup.dispose();
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', m.attributes.position); geo.setAttribute('normal', m.attributes.normal); geo.setAttribute('aPart', m.attributes.aPart);
  return geo;
}
function roseGeometry(nPetal) {       // ceiling rose: petalled medallion with a pendant boss (rope anchor at its tip)
  const prof = [[0.01, 600], [1.2, 600.3], [2.6, 601.6], [1.8, 603.0], [3.2, 604.0], [7, 604.6], [10, 606.2], [14, 606.8],
    [22, 608.2], [34, 609.6], [50, 610.6], [66, 611.4], [74, 612.0]].map((p) => new THREE.Vector2(p[0], p[1]));
  const g = new THREE.LatheGeometry(prof, 96), P = g.attributes.position, n = P.count, d = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    let x = P.getX(i), y = P.getY(i), z = P.getZ(i); const r = Math.hypot(x, z), a = Math.atan2(x, z);
    const pet = Math.abs(Math.sin(a * nPetal / 2)), pet2 = Math.abs(Math.cos(a * nPetal / 2));
    const f = sstep(14, 40, r), f2 = sstep(4, 8, r) * (1 - sstep(12, 18, r));
    y -= f * 2.4 * Math.pow(pet, 0.6) + f2 * 1.1 * Math.pow(pet2, 0.7);
    const k = 1 + 0.09 * f * (Math.pow(pet, 0.5) - 0.6);
    P.setXYZ(i, x * k, y, z * k);
    const rim = sstep(64, 72, r), crease = 1 - sstep(0.0, 0.25, pet);
    d[i * 4] = 0; d[i * 4 + 1] = 0; d[i * 4 + 2] = 6; d[i * 4 + 3] = 0.75 * f * (1 - rim) * (1 - crease);
  }
  g.computeVertexNormals(); g.setAttribute('aData', new THREE.BufferAttribute(d, 4)); g.deleteAttribute('uv');
  return g;
}
function quadGeometry() {
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  return geo;
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('grand-chandelier') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [cCream, cRose, cPink, cLilac, cPeri, cGoldPale, cCoral] = pal;
  const density = opts.crystalDensity ?? 1, swayAmt = opts.sway ?? 1;
  const bounds = new THREE.Sphere(new THREE.Vector3(0, 503, 0), 300);

  // ---- per-seed character
  const warmth = rng.range(0, 1);                                   // gilding: pale champagne .. rose gold
  const gold = new THREE.Color('#DC9C40').lerp(new THREE.Color('#E8946A'), warmth * 0.45).lerp(cGoldPale, 0.12);
  const curtainStyle = rng.pick(['scallop', 'gothic', 'wave']);
  const scallops = [4 * rng.int(5, 7), 4 * rng.int(4, 6), 4 * rng.int(3, 4), 4 * rng.int(2, 3)];
  const swagTwist = rng.sign() * rng.range(0.14, 0.26), swagCounts = [4 * rng.int(4, 5), 4 * rng.int(3, 5), 4 * rng.int(3, 4)];
  const armCounts = [rng.pick([56, 64, 72]), rng.pick([48, 56]), rng.pick([36, 40, 44]), rng.pick([24, 28])];
  const nPetal = rng.pick([12, 16, 20]);
  const tintW = [rng.range(0.6, 1.4), rng.range(0.6, 1.4), rng.range(0.6, 1.4), rng.range(0.5, 1.3), rng.range(0.3, 0.9)];
  tintW[rng.int(0, 4)] += rng.range(1.5, 3.0);                      // one colour leads each seed's crystal mix
  const tintC = [cCream, cRose, cLilac, cPink, cPeri], tintSum = tintW.reduce((a, b) => a + b, 0);
  const pickTint = (out) => { let x = rng() * tintSum; for (let i = 0; i < 5; i++) { x -= tintW[i]; if (x <= 0) return out.copy(tintC[i]); } return out.copy(cCream); };

  // ---- shared uniforms
  const sunDir = new THREE.Vector3(-0.5, 0.07, -0.866).normalize();
  if (opts.sunDir) sunDir.copy(opts.sunDir).normalize();
  const sunI = opts.sunIntensity ?? 1.5;
  const U = {
    uTime: { value: 0 }, uSway: { value: 0.004 * swayAmt }, uProgress: { value: 0 }, uGlow: { value: 1 },
    uSunDir: { value: sunDir }, uSunCol: { value: new THREE.Color(opts.sunColor || '#FFB48A').multiplyScalar(sunI) },
    uSkyUp: { value: cCream.clone().lerp(cRose, 0.25).multiplyScalar(0.78) },
    uSkyDn: { value: cLilac.clone().lerp(cPeri, 0.2).multiplyScalar(0.86) },
    uHaze: { value: cGoldPale.clone().multiplyScalar(0.9) },
    uGold: { value: gold }, uCream: { value: cCream }, uRose: { value: cRose }, uLilac: { value: cLilac },
    uCoral: { value: cCoral }, uWarm: { value: cGoldPale.clone().lerp(new THREE.Color('#FFB65C'), 0.6) },
    uViolet: { value: cPeri.clone().lerp(new THREE.Color('#B48CFF'), 0.5) }, uPix: { value: 2 / (1.7 * 1080) },
  };
  const root = new THREE.Group(); root.name = 'grand-chandelier';

  // ---- 1. rings, rose, rods, portal frame: one merged mesh
  const ringInfo = [], giltParts = [];
  RINGS.forEach((r, k) => {
    const bays = Math.round(TAU * r.radius / (6.0 * (0.95 + 0.05 * r.scale)) / 8) * 8;
    giltParts.push(buildRing(r, bays, k));
    ringInfo.push({ radius: r.radius, y: r.y, scale: r.scale, halfWidth: 7.7 * r.scale, bottom: r.y - 8 * r.scale, top: r.y + 7.6 * r.scale, bays });
  });
  await ctx.yield?.();
  giltParts.push(roseGeometry(nPetal));
  const r1 = RINGS[0], rodTop = 611.5, rodBot = r1.y + 7.6 * r1.scale, nRod = 16;
  for (let i = 0; i < nRod; i++) {                                   // short rods from the widest ring into the cloud
    const az = (i + 0.5) / nRod * TAU, rod = new THREE.CylinderGeometry(0.9, 0.45, rodTop - rodBot, 6, 1, true);
    rod.translate(r1.radius * Math.sin(az), (rodTop + rodBot) / 2, r1.radius * Math.cos(az));
    giltParts.push(tagGeometry(rod, 6, 0));
    const cap = new THREE.LatheGeometry([[0.01, 0], [1.6, 0.5], [2.4, 1.6], [3.4, 2.2]].map((p) => new THREE.Vector2(p[0], p[1])), 8);
    cap.translate(r1.radius * Math.sin(az), rodTop - 2.2, r1.radius * Math.cos(az));
    giltParts.push(tagGeometry(cap, 6, 0.5));
  }
  const wantFrame = opts.portalFrame !== false;
  if (wantFrame) {
    const frame = new THREE.TorusGeometry(7.75, 0.75, 10, 72); frame.translate(0, PORTAL_Y, 0);
    giltParts.push(tagGeometry(frame, 7, 0));
    const lip = new THREE.TorusGeometry(8.55, 0.22, 5, 72); lip.translate(0, PORTAL_Y, 0);
    giltParts.push(tagGeometry(lip, 6, 0));
    const crown = new THREE.LatheGeometry([[0.01, 418.0], [1.5, 418.3], [2.3, 419.3], [1.1, 420.3], [1.9, 421.4], [0.9, 422.6], [0.4, 423.6], [0.01, 425.0]].map((p) => new THREE.Vector2(p[0], p[1])), 12);
    giltParts.push(tagGeometry(crown, 6, 0));
    const foot = new THREE.LatheGeometry([[0.01, 400.2], [0.9, 400.6], [1.5, 401.3], [0.7, 402.0], [0.01, 402.1]].map((p) => new THREE.Vector2(p[0], p[1])), 10);
    giltParts.push(tagGeometry(foot, 6, 0));
  }
  const giltGeo = mergeGeometries(giltParts); giltParts.forEach((g) => g.dispose());
  giltGeo.boundingSphere = bounds;
  const giltMat = makeMaterial(U, GILT_VERT, GILT_FRAG, { side: THREE.DoubleSide });
  const gilt = new THREE.Mesh(giltGeo, giltMat); gilt.name = 'rings'; root.add(gilt);
  await ctx.yield?.();

  // ---- 2. crystal curtains: strands of faceted pendants under both edges of every ring
  const cTop = [], cSc = [], cTint = [], tmpC = new THREE.Color(), tmpV = new THREE.Vector3();
  const addCrystal = (x, y, z, w, len, depth, tint) => { cTop.push(x, y, z); cSc.push(w, len, rng(), depth); cTint.push(tint.r * 0.82, tint.g * 0.82, tint.b * 0.82); };
  const LMAX = [33, 33, 35, 22.5];
  const curtainShape = (az, nSc) => {
    const sc = 0.5 - 0.5 * Math.cos(az * nSc);
    if (curtainStyle === 'gothic') return Math.pow(Math.abs(Math.sin(az * nSc / 2)), 0.55);
    if (curtainStyle === 'wave') return Math.min(1, 0.72 * sc + 0.28 * (0.5 - 0.5 * Math.cos(az * nSc * 3)) + 0.12 * sc * sc);
    return Math.pow(sc, 0.75);
  };
  RINGS.forEach((r, k) => {
    for (let row = 0; row < 2; row++) {
      const rr = r.radius + (row ? -5.6 : 5.6) * r.scale, y0 = r.y - 5.4 * r.scale;
      const spacing = (row ? 6.6 : 4.5) / density, nStr = Math.round(TAU * rr / spacing);
      for (let i = 0; i < nStr; i++) {
        const az = (i + rng.range(-0.2, 0.2)) / nStr * TAU, g = gateFactor(az);
        let L = LMAX[k] * (0.3 + 0.7 * curtainShape(az, scallops[k])) * (row ? 0.6 : 1) * rng.range(0.94, 1.04);
        L = 2.6 + (L - 2.6) * g;
        const x = rr * Math.sin(az), z = rr * Math.cos(az);
        let y = 0;
        while (L - y > 1.2) {
          let len = (3.0 + 3.6 * (y / LMAX[k])) * rng.range(0.85, 1.15);
          const rest = L - y; let last = false;
          if (rest - len < 2.6) { len = Math.min(rest, 10); last = true; }
          pickTint(tmpC);
          if (last && len > 4.5) tmpC.lerp(rng.chance(0.5) ? cCoral : cGoldPale, 0.35);
          addCrystal(x, y0 - y, z, len * (last ? rng.range(0.44, 0.52) : rng.range(0.36, 0.46)), len, y + 5.4 * r.scale, tmpC);
          y += len; if (last) break;
        }
      }
    }
  });
  RINGS.forEach((r, k) => {                                        // one great drop under the middle of every scallop
    const n = scallops[k];
    for (let i = 0; i < n; i++) {
      const az = (i + 0.5) / n * TAU; if (gateFactor(az) < 0.999) continue;
      const len = (k === 3 ? 11 : 15) * rng.range(0.9, 1.1);
      tmpC.copy(rng.chance(0.5) ? cCoral : cGoldPale).lerp(cCream, 0.35);
      addCrystal(r.radius * Math.sin(az), r.y - 7.0 * r.scale, r.radius * Math.cos(az), len * 0.4, len, 7.0 * r.scale, tmpC);
    }
  });
  if (wantFrame) addCrystal(0, 400.3, 0, 2.9, 6.4, 0, tmpC.copy(cCoral).lerp(cCream, 0.4));
  // ---- 3. candle arms (instanced arm + cup) and their flames (impostors)
  const bPS = [], bCol = [], bAux = [];
  const addBead = (p, dia, col, kind, lag, jig) => { bPS.push(p.x, p.y, p.z, dia); bCol.push(col.r, col.g, col.b, kind); bAux.push(lag, jig); };
  const aBase = [], aDir = [], glowPoints = [];
  const addArm = (r, az, y, s, inward) => {
    const o = inward ? -1 : 1, sx = Math.sin(az) * o, cz = Math.cos(az) * o, seed = rng();
    aBase.push(r * Math.sin(az), y, r * Math.cos(az), s); aDir.push(sx, cz, seed);
    tmpV.set(r * Math.sin(az) + sx * 5.0 * s, y + 6.2 * s, r * Math.cos(az) + cz * 5.0 * s);
    addBead(tmpV, 1.5 * s, cGoldPale, 2, seed, 0);
  };
  RINGS.forEach((r, k) => {
    const bays = ringInfo[k].bays, n = armCounts[k], s = 0.9 * r.scale;
    for (let i = 0; i < n; i++) {
      const az = Math.round((i + 0.5) / n * bays) / bays * TAU;
      addArm(r.radius + 7.0 * r.scale, az, r.y - 3.4 * r.scale, s, false);
    }
    if (k >= 2) {                                                  // inner arms on the two lowest rings, never in a gate
      const ni = Math.round(n * 0.6);
      for (let i = 0; i < ni; i++) {
        const az = Math.round((i + 0.5) / ni * bays) / bays * TAU;
        if (gateFactor(az) < 0.999 && k === 3) continue;
        addArm(r.radius - 7.0 * r.scale, az, r.y - 3.4 * r.scale, s * 0.85, true);
      }
    }
    for (let j = 0; j < 8; j++) glowPoints.push({ position: polar(r.radius, (j + 0.5) / 8 * TAU, r.y - 8 * r.scale), color: '#FFD08A', intensity: 1, radius: 40 * r.scale });
  });
  const nArm = aBase.length / 4, aGeo = armGeometry();
  aGeo.setAttribute('aBase', new THREE.InstancedBufferAttribute(new Float32Array(aBase), 4));
  aGeo.setAttribute('aDir', new THREE.InstancedBufferAttribute(new Float32Array(aDir), 3));
  aGeo.instanceCount = nArm; aGeo.boundingSphere = bounds;
  const arms = new THREE.Mesh(aGeo, makeMaterial(U, ARM_VERT, ARM_FRAG, { side: THREE.DoubleSide })); arms.name = 'candle-arms'; root.add(arms);

  // ---- 4. pearls: swags between tiers, the tent up to the rose, chains down to the portal
  const pearlA = cCream.clone().multiplyScalar(0.8), pearlB = cPink.clone().lerp(cCream, 0.4).multiplyScalar(0.8), beadGold = gold.clone();
  const A = new THREE.Vector3(), B = new THREE.Vector3();
  for (let k = 0; k < 3; k++) {                                    // sweeping swags ring k -> ring k+1
    const ra = RINGS[k], rb = RINGS[k + 1], n = swagCounts[k], off = rng.range(0, TAU / n);
    for (let i = 0; i < n; i++) {
      const az = off + i / n * TAU, lag = rng.range(0.8, 2.2);
      polar(ra.radius - 7.3 * ra.scale, az, ra.y - 3.9 * ra.scale, A);
      polar(rb.radius + 7.9 * rb.scale, az + swagTwist * (1 + 0.25 * k), rb.y + 4.4 * rb.scale, B);
      const sag = rng.range(11, 15);
      swagPoints(A, B, sag, 2.35).forEach((q, j) => {
        const big = j % 8 === 4;
        addBead(q.p, big ? 2.6 : 1.9, big ? beadGold : (j % 2 ? pearlA : pearlB), big ? 1 : 0, lag, 2.4 * q.t * (1 - q.t));
      });
      swagPoints(A, B, sag + rng.range(8, 11), 2.6).forEach((q, j) => addBead(q.p, j % 4 === 2 ? 1.7 : 1.15, j % 4 === 2 ? pearlB : beadGold, j % 4 === 2 ? 0 : 1, lag + 0.5, 3.2 * q.t * (1 - q.t)));
    }
  }
  for (let k = 1; k < 4; k++) {                                    // the tent: pearl strands from the rose to rings 2..4
    const rb = RINGS[k], off = [0, -0.21, 0.21, 0][k];
    for (let j = 0; j < 8; j++) {
      const az = Math.PI / 8 + j * Math.PI / 4 + off, lag = rng.range(0.3, 1.2);
      polar(31, az, 608.4, A); polar(rb.radius - 7.8 * rb.scale, az, rb.y + 4.4 * rb.scale, B);
      const pts = swagPoints(A, B, A.distanceTo(B) * 0.085, 3.0);
      pts.forEach((q, i) => addBead(q.p, i % 6 === 3 ? 2.9 : 2.2, i % 6 === 3 ? beadGold : pearlA, i % 6 === 3 ? 1 : 0, lag, 1.6 * q.t * (1 - q.t)));
    }
  }
  const r4 = RINGS[3], chainTops = [], chainDrops = [];
  for (let j = 0; j < 4; j++) {                                    // four gold chains converge on the portal's crown
    const az = Math.PI / 4 + j * Math.PI / 2;
    polar(r4.radius - 6.4 * r4.scale, az, r4.y - 4.6 * r4.scale, A); polar(1.7, az, 421.4, B);
    chainTops.push(A.clone());
    swagPoints(A, B, 5, 1.6).forEach((q, i) => {
      tmpV.copy(q.p); addBead(tmpV, i % 2 ? 1.2 : 1.9, beadGold, 3, q.t, 0);
      if (i % 5 === 2 && q.t < 0.95) chainDrops.push(q.p.x, q.p.y - 0.9, q.p.z, rng.range(2.4, 3.8));
    });
  }
  for (let i = 0; i < nRod; i++) addBead(polar(r1.radius, (i + 0.5) / nRod * TAU, (rodTop + rodBot) / 2 - 1, tmpV), 3.0, beadGold, 1, 0, 0);
  if (wantFrame) for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; addBead(tmpV.set(Math.cos(a) * 9.15, PORTAL_Y + Math.sin(a) * 9.15, 0), i % 5 ? 0.8 : 1.3, i % 5 ? pearlA : beadGold, i % 5 ? 0 : 1, 0, 0); }
  const nBead = bPS.length / 4, bGeo = quadGeometry();
  bGeo.setAttribute('aPS', new THREE.InstancedBufferAttribute(new Float32Array(bPS), 4));
  bGeo.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(bCol), 4));
  bGeo.setAttribute('aAux', new THREE.InstancedBufferAttribute(new Float32Array(bAux), 2));
  bGeo.instanceCount = nBead; bGeo.boundingSphere = bounds;
  const beads = new THREE.Mesh(bGeo, makeMaterial(U, BEAD_VERT, BEAD_FRAG, { side: THREE.DoubleSide })); beads.name = 'pearls'; root.add(beads);
  await ctx.yield?.();

  // ---- crystal mesh (after the chains, which carry a few drops of their own)
  for (let i = 0; i < chainDrops.length; i += 4) addCrystal(chainDrops[i], chainDrops[i + 1], chainDrops[i + 2], chainDrops[i + 3] * 0.42, chainDrops[i + 3], 0, pickTint(tmpC).lerp(cCoral, 0.25));
  const nCrystal = cTop.length / 3;
  const cGeo = crystalGeometry();
  cGeo.setAttribute('aTop', new THREE.InstancedBufferAttribute(new Float32Array(cTop), 3));
  cGeo.setAttribute('aSc', new THREE.InstancedBufferAttribute(new Float32Array(cSc), 4));
  cGeo.setAttribute('aTint', new THREE.InstancedBufferAttribute(new Float32Array(cTint), 3));
  cGeo.instanceCount = nCrystal; cGeo.boundingSphere = bounds;
  const crystals = new THREE.Mesh(cGeo, makeMaterial(U, CRYSTAL_VERT, CRYSTAL_FRAG)); crystals.name = 'crystals'; root.add(crystals);
  await ctx.yield?.();


  // ---- anchors
  const flyThrough = [];
  for (const deg of [34, 29, 24, 19, 14, 9, 4.5, 0]) { const t = deg * Math.PI / 180; flyThrough.push(new THREE.Vector3(0, PIVOT_Y - ROPE * Math.cos(t), ROPE * Math.sin(t))); }
  flyThrough.push(new THREE.Vector3(0, PORTAL_Y, -30), new THREE.Vector3(0, PORTAL_Y, -60));
  const anchors = {
    portalSeat: { position: new THREE.Vector3(0, PORTAL_Y, 0), normal: new THREE.Vector3(0, 0, 1), travel: new THREE.Vector3(0, 0, -1), radius: 7 },
    ropeAnchor: new THREE.Vector3(0, PIVOT_Y, 0),
    catchPlatform: flyThrough[0].clone(),
    flyThrough,
    approach: [new THREE.Vector3(0, 432, 420), new THREE.Vector3(0, 428, 300), new THREE.Vector3(0, 432, 190), flyThrough[0].clone()],
    gates: [0, Math.PI / 2, Math.PI, Math.PI * 1.5], gateHalfAngle: GATE_HALF,
    clearBelow: 445,
    rings: ringInfo, chainTops,
    viewpoints: {
      reveal: new THREE.Vector3(-150, 438, 520),      // whole corona, sun behind its far rim
      under: new THREE.Vector3(40, 425, 185),         // looking up through the tiers at the rose
      inside: new THREE.Vector3(0, 470, 40),          // within the inner ring, crystals all round
      rim: new THREE.Vector3(262, 560, 262),          // beside the widest ring's arcade
    },
    glowPoints,
  };

  const triangles = giltGeo.index.count / 3 + nCrystal * 8 + nArm * (aGeo.attributes.position.count / 3) + nBead * 2;
  const size = new THREE.Vector2();
  return {
    object: root, radius: 262, height: 218, center: new THREE.Vector3(0, 490, 0), anchors,
    ground: false, groundY: 0,
    uniforms: U,
    info: { rings: ringInfo, crystals: nCrystal, beads: nBead, arms: nArm, triangles: Math.round(triangles), curtainStyle },
    setProgress(u) { U.uProgress.value = Math.min(1, Math.max(0, u)); },
    setSun(dir, colorHex, intensity = 1.5) { if (dir) U.uSunDir.value.copy(dir).normalize(); if (colorHex) U.uSunCol.value.set(colorHex).multiplyScalar(intensity); },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (camera && camera.projectionMatrix) {
        let h = 1080; if (ctx.renderer && ctx.renderer.getDrawingBufferSize) h = ctx.renderer.getDrawingBufferSize(size).y || 1080;
        U.uPix.value = 2 / (camera.projectionMatrix.elements[5] * h);
      }
    },
    dispose() {},
  };
}
