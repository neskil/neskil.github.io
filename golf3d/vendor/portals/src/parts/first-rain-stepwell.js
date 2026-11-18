// HERO SET PIECE: "The Thousand-Stair Rain" (world first-rain-stepwell)
// A ninth-century stepwell, enlarged: 130 m square at the rim, 65 m deep, 13 tiers of paired
// flights on the west, east and north walls (a net of stone diamonds), a five-storey carved
// pavilion on the south wall with a two-storey central arch, a colonnaded rim gallery with a
// fallen bay on the west side, and the transformation itself: rain spots, the wet front, every
// step turning into a fall tier by tier, ledge curtains, two spout plumes, landing mist and a
// green pool that climbs 8.7 m and swallows a tier and a half.
//
// SPACE (local, exactly the brief's): X east, Z south (+Z is the pavilion "front" side the exit
//   lies on), Y up, RIM AT y = 0, floor at y = -65. The piece is a pit: the world's terrain needs
//   a hole of 66 m half-width (the piece brings its own earth apron out to opts.apron metres).
// SIZE: true extent is in `extent` { half: 100 (with apron), rim: 65, depth: 65, top: 13 }.
//   `radius`, `height` and `center` are VIEWER ORBIT HINTS (a small interior orbit, because an
//   outside orbit of a pit shows nothing); do not use them as the bounding size.
// OPTS: palette (7 hex strings, brief order: dry stone, wet stone, storm indigo, slate fill,
//   marigold, pool green, brass light); progress (initial u, default 0.72 so a lone viewer sees
//   the front mid-wall); sunDir ([x,y,z] TO the sun, local space; default azimuth 285, 24 up);
//   sunColor / sunIntensity; fillColor; apron (metres, default 100, 0 = none); festival (bool,
//   marigold garlands in the arch eddy; default per seed); damage (collapsed flights, per seed).
// PROGRESS HOOK: hero.setProgress(u) with the world's path u (0..1). Everything scripted reads
//   it: drop spots 0.26-0.40, rain curtain crossing from the east 0.38-0.46, the cascade front
//   (tier k of 13 runs at u = 0.44 + 0.03k), curtains, plumes (from 0.50), mist, the pool rise
//   (0.47 -> 0.97). hero.poolLevel(u) and hero.frontY(u) return the water level and the depth of
//   the cascade front. hero.setSun(dir, color, intensity) and hero.setSky(east, west, fill)
//   re-light it (all shaders are self-lit from these uniforms; scene lights are ignored).
// ANCHORS (local space): portalSeat { position (0,-48,46), facing (0,0,-1), radius 7 } inside the
//   arch; flyThrough: the brief's line from the fallen bay down the well to the portal, checked
//   for 6 m of stone clearance (two of the brief's points nudged 1-2 m inward); gap: centre of
//   the fallen bay; viewpoints { tip, eastWall, pavilionPass, image, finalRun } each
//   { position, target }; arch; spouts / plumeImpacts; poolCenter; ledges(tier, wall) for seating
//   creatures; eddy (where garlands circle).
// LIGHT IT EXPECTS: a low warm sun from the west under storm cloud, cool slate fill, grey rain
//   fog 0.0012-0.004. An analytic rim shadow (the diagonal on the north wall) is built in.
// COST: about 95k triangles, 6 draw calls (stone, instanced flights, pool, curtains, plumes, mist),
//   no lights, no textures. Build about 100 ms.
// WORLD EXTRAS: opts.poolStart (water level at u = 0.47, default -64.2), opts.moss (0..1 green on the low tiers),
//   hero.setLamps(v) (oil lamps in the wall niches and the pavilion galleries, for dusk); opts.cool (0..1, default 1: how far
//   shaded stone greys toward slate under the fill light). Festival garlands hang above the arch crown and down its piers,
//   never inside the 15 m opening. hero.setShaft(x, z, radius, amount) narrows the sun to one shaft (the rare torn cloud).
//   hero.setCloud(edgeX, amount) lays a cloud's shadow over everything east of edgeX (the world uses it in the approach, so the
//   lit west gallery and its fallen bay stand against a shaded east wall).
// LIT PLACES (for the stair walls, which otherwise have no subject): an octagonal corner tower in the north-east corner (third ledge to
//   above the gallery roof, a balcony down the diagonal, a domed chhatri with a fire bowl and pennant; anchors.tower), and four shrine
//   pavilions on landings (north wall y -40 and y -20, east wall y -5 and y -40) with flames, a lit ceiling, marigold swags and a pennant.
//   anchors.lamps lists their flames for the world's glow sprites. Leaf-cup lamps and marigold heads float on the pool (more of them
//   with opts.festival); at dusk (setLamps) each niche lamp throws a pool of light on its wall and the pool mirrors the lamps.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEF_PALETTE = ['#D9A55B', '#8A5A2B', '#1F2347', '#4B5673', '#E3B21A', '#3F7A4E', '#FFE3A1'];
const RIM = 65, DEPTH = 65, TIERS = 13, TH = 5, STEP_IN = 3, PAV_Z = 38, CELL = 14, FL_D = 2.1;
const hwOf = (k) => RIM - STEP_IN * k;          // half-width of the wall face of tier k (0 = top)
const SHRINES = [[7, 0, 0], [3, 0, 14], [0, 1, -18], [7, 1, 3]];   // [tier, wall, place along the wall] of the landings that carry a shrine pavilion

// ---------- tiny flat-shaded geometry builder (positions + tint + material id) ----------
// Normals are derived per pixel from screen derivatives, so winding never matters.
function makeBuilder() {
  const pos = [], col = [], mat = [];
  const b = {
    c: [1, 1, 1], m: 0, ox: 0, oy: 0, oz: 0, cs: 1, sn: 0, sx: 1,
    at(x, y, z, rot = 0, mirror = 1) { b.ox = x; b.oy = y; b.oz = z; b.cs = Math.cos(rot); b.sn = Math.sin(rot); b.sx = mirror; return b; },
    home() { return b.at(0, 0, 0, 0, 1); },
    tint(r, g, bl) { b.c = [r, g, bl]; return b; },
    v(x, y, z) {
      x *= b.sx;
      pos.push(b.ox + x * b.cs + z * b.sn, b.oy + y, b.oz - x * b.sn + z * b.cs);
      col.push(b.c[0], b.c[1], b.c[2]); mat.push(b.m);
    },
    tri(a, c, d) { b.v(a[0], a[1], a[2]); b.v(c[0], c[1], c[2]); b.v(d[0], d[1], d[2]); },
    quad(a, c, d, e) { b.tri(a, c, d); b.tri(a, d, e); },
    // axis box with optional top inset (taper) and optional skipped faces
    box(x0, y0, z0, x1, y1, z1, tp = 0, noBottom = true) {
      const a0 = [x0, y0, z0], a1 = [x1, y0, z0], a2 = [x1, y0, z1], a3 = [x0, y0, z1];
      const t0 = [x0 + tp, y1, z0 + tp], t1 = [x1 - tp, y1, z0 + tp], t2 = [x1 - tp, y1, z1 - tp], t3 = [x0 + tp, y1, z1 - tp];
      b.quad(a0, a1, t1, t0); b.quad(a1, a2, t2, t1); b.quad(a2, a3, t3, t2); b.quad(a3, a0, t0, t3);
      b.quad(t0, t1, t2, t3); if (!noBottom) b.quad(a0, a3, a2, a1);
    },
    // lathe around a vertical axis at (cx, cz): profile = [[radius, y], ...] bottom to top
    lathe(cx, cz, prof, sides = 8, rot0 = 0, capTop = true, sz = 1) {
      for (let i = 0; i < prof.length - 1; i++) {
        const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
        for (let s = 0; s < sides; s++) {
          const a0 = rot0 + (s / sides) * Math.PI * 2, a1 = rot0 + ((s + 1) / sides) * Math.PI * 2;
          const c0 = Math.cos(a0), s0 = Math.sin(a0) * sz, c1 = Math.cos(a1), s1 = Math.sin(a1) * sz;
          const p0 = [cx + c0 * r0, y0, cz + s0 * r0], p1 = [cx + c1 * r0, y0, cz + s1 * r0];
          const p2 = [cx + c1 * r1, y1, cz + s1 * r1], p3 = [cx + c0 * r1, y1, cz + s0 * r1];
          if (r0 < 1e-3) b.tri(p0, p2, p3); else if (r1 < 1e-3) b.tri(p0, p1, p2); else b.quad(p0, p1, p2, p3);
        }
      }
      const [rt, yt] = prof[prof.length - 1];
      if (capTop && rt > 1e-3) for (let s = 1; s < sides - 1; s++) {
        const a0 = rot0, a1 = rot0 + (s / sides) * Math.PI * 2, a2 = rot0 + ((s + 1) / sides) * Math.PI * 2;
        b.tri([cx + Math.cos(a0) * rt, yt, cz + Math.sin(a0) * rt * sz], [cx + Math.cos(a1) * rt, yt, cz + Math.sin(a1) * rt * sz], [cx + Math.cos(a2) * rt, yt, cz + Math.sin(a2) * rt * sz]);
      }
    },
    count() { return pos.length / 9; },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
      g.setAttribute('aC', new THREE.BufferAttribute(new Float32Array(col), 3));
      g.setAttribute('aM', new THREE.BufferAttribute(new Float32Array(mat), 1));
      return g;
    },
  };
  return b;
}

// material ids used by the stone shader
const M_FLIGHT = 0, M_WALL = 1, M_CARVED = 2, M_DARK = 3, M_EARTH = 4, M_JALI = 5, M_PLASTER = 6, M_GLOW = 9;   // (7.x: garlands and pennants; 9: a lamp flame, or the ceiling it lights)

// ---------- shared GLSL ----------
const GLSL_COMMON = /* glsl */`
uniform float uU, uTime, uPoolY, uSunI;
uniform vec3 uSunDir, uSunCol, uFill, uBounce, uSkyE, uSkyW, uCam;
uniform vec4 uShaft;                           // (x, z at the rim plane, radius, amount): confines the sun to one shaft through torn cloud
uniform vec4 uCloud;                           // (edge x, softness, 0, amount): a patch of cloud shadow lying east of the edge
float h11(float n){ return fract(sin(n*127.1)*43758.5453); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float vn(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h21(i), h21(i+vec2(1.,0.)), f.x), mix(h21(i+vec2(0.,1.)), h21(i+vec2(1.,1.)), f.x), f.y);
}
// depth of the cascade front: tier k (1..13) is running when uU = 0.44 + 0.03 k
float frontY(){ return -(uU-0.44)/0.03*5.; }
// analytic shadow of the rim: walk toward the sun to the edge of the pit and see if we are above ground
float sunVis(vec3 p){
  vec3 L = uSunDir;
  float tx = L.x < 0. ? (-65.-p.x)/min(L.x,-1e-3) : (65.-p.x)/max(L.x,1e-3);
  float tz = L.z < 0. ? (-65.-p.z)/min(L.z,-1e-3) : (38.-p.z)/max(L.z,1e-3);
  float t = max(min(tx,tz), 0.);
  float rim = (tz < tx && L.z > 0.) ? 4. : 0.;
  float ye = p.y + t*L.y, w = 0.4 + 0.012*t;
  float v = smoothstep(rim-w, rim+w, ye);
  if (uShaft.w > 0.) {
    vec2 q = p.xz + L.xz * (max(-p.y, 0.) / max(L.y, 0.05));
    float m = 1. - smoothstep(uShaft.z - 14., uShaft.z + 6., length(q - uShaft.xy) + (vn(q*0.05) - 0.5)*14.);
    v *= mix(1., m, uShaft.w);
  }
  if (uCloud.w > 0.) v *= 1. - uCloud.w*smoothstep(uCloud.x - uCloud.y, uCloud.x + uCloud.y, p.x + (vn(vec2(p.z*0.045 + 3., 1.7)) - 0.5)*22.);
  return v;
}
vec3 skyRefl(vec3 r){ return mix(uSkyW, uSkyE, smoothstep(-0.6, 0.6, r.x)) * (0.55 + 0.45*clamp(r.y, 0., 1.)); }
`;

const STONE_VERT = /* glsl */`
attribute vec3 aC; attribute float aM;
#ifdef USE_INSTANCING
attribute vec3 aTint;
#endif
uniform float uTime;
varying vec3 vP; varying vec3 vC; varying float vM;
#include <fog_pars_vertex>
void main(){
  vec4 lp = vec4(position, 1.); vC = aC;
  #ifdef USE_INSTANCING
  lp = instanceMatrix*lp; vC = aC*aTint;
  #endif
  if (aM > 6.5 && aM < 7.9) { float w = (aM-7.)*2.5; lp.z += sin(uTime*6.3 + lp.x*1.7 + lp.y)*w*0.55; lp.y += cos(uTime*5.1 + lp.x*2.3)*w*0.2; }
  vP = lp.xyz; vM = aM;
  vec4 mvPosition = modelViewMatrix*lp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

const STONE_FRAG = /* glsl */`
uniform vec3 uDry, uWet, uGarland;
uniform float uMoss, uLamp, uCool;
varying vec3 vP; varying vec3 vC; varying float vM;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  vec3 dx = dFdx(vP), dy = dFdy(vP);
  vec3 cr = cross(dx, dy);
  vec3 N = cr / max(length(cr), 1e-9);
  vec3 Vv = uCam - vP; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-4);
  if (dot(N, V) < 0.) N = -N;
  float up = N.y;
  float isTop = smoothstep(0.55, 0.8, up);
  float s = abs(N.x) > abs(N.z) ? vP.z : vP.x;                 // horizontal coordinate in a vertical face
  bool flight = vM < 0.5, wall = vM > 0.5 && vM < 1.5, carved = vM > 1.5 && vM < 2.5;
  bool dark = vM > 2.5 && vM < 3.5, earth = vM > 3.5 && vM < 4.5, jali = vM > 4.5 && vM < 5.5, plaster = vM > 5.5 && vM < 8.5, glowM = vM > 8.5;
  float tierF = -vP.y/5.; float tier = floor(tierF); float yy = fract(tierF);      // yy: 0 top of tier, 1 foot
  float lod = smoothstep(160., 40., dist);

  // ---- albedo: ashlar courses every 0.35 m, staggered joints, per-block tone ----
  float course = vP.y/0.35; float row = floor(course), cf = fract(course);
  float bs = s/0.95 + h11(row)*7.3;
  float blk = h21(vec2(floor(bs), row));
  float joint = max(smoothstep(0.86, 0.97, cf), smoothstep(0.92, 0.985, fract(bs))) * (1.-isTop) * lod;
  float blotch = vn(vec2(s*0.06 + vP.y*0.03, vP.y*0.09 + s*0.02)) * 0.6 + vn(vP.xz*0.21 + vP.y*0.5)*0.4;
  vec3 alb = uDry * vC * (0.80 + 0.26*blk*lod + 0.06) * (0.78 + 0.42*blotch);
  alb *= 1. - 0.42*joint;
  if (isTop > 0.5 && (flight || wall)) {                      // worn treads and ledges: paler, slab joints
    vec2 sl = vP.xz/vec2(1.3, 1.3); float e = max(smoothstep(0.93,0.99,fract(sl.x)), smoothstep(0.93,0.99,fract(sl.y)));
    alb *= (1.08 + 0.1*vn(vP.xz*1.7)) * (1. - 0.3*e*lod);
  }
  if (carved) {                                               // carved bands and fluting
    float band = smoothstep(0.35, 0.5, abs(fract(vP.y*0.77)-0.5));
    float flute = 0.5 + 0.5*sin(s*21.);
    alb *= 0.86 + 0.12*band + 0.07*flute*lod*(1.-isTop);
  }
  if (plaster) alb = vC * (0.8 + 0.2*blotch) * (1. - 0.25*vn(vec2(s*3., vP.y*0.4)));
  if (earth) {
    float g = vn(vP.xz*0.9)*0.5 + vn(vP.xz*0.13)*0.5;
    alb = vC * (0.72 + 0.4*g); alb = mix(alb, alb*vec3(0.8,0.95,0.6), smoothstep(0.62,0.8,vn(vP.xz*0.31+9.))*0.5);
  }
  if (jali) {                                                 // pierced screen: lattice of dark holes
    vec2 q = fract(vec2(s, vP.y)*2.6) - 0.5;
    float hole = smoothstep(0.34, 0.26, abs(q.x)+abs(q.y)) * lod;
    alb = mix(alb, vec3(0.012,0.01,0.014), hole);
  }
  if (dark) alb = uDry * vC * 0.34 * (0.7 + 0.5*blotch);
  // black algae under every ledge, streaking down; stronger low in the well
  if ((flight || wall || carved) && isTop < 0.5) {
    float st = vn(vec2(s*1.1, tier*3.1)) * 0.65 + vn(vec2(s*4.3, vP.y*0.25))*0.35;
    float al = smoothstep(0.55, 0.0, yy) * smoothstep(0.32, 0.7, st) * (wall || carved ? 1. : 0.6);
    al = max(al, smoothstep(0.75, 1., yy) * 0.25 * (wall ? 1. : 0.));
    alb = mix(alb, alb*vec3(0.22,0.25,0.2), al * (0.55 + 0.4*smoothstep(0., -65., vP.y)));
  }
  // a dark arched niche in the wall triangles of every third diamond
  float nm = 0., lampG = 0.;
  if (wall && isTop < 0.5 && vP.y < 0. && vP.z < 37.9) {
    float odd = mod(tier, 2.);
    float along = abs(N.z) > abs(N.x) ? vP.x/14. + 0.5 : (38.-vP.z)/14.;
    along += odd*0.5 + 0.5;
    float d = (fract(along)-0.5)*14.; float cell = floor(along);
    float hgt = 5.*(1.-yy);
    float pick = step(mod(cell + tier*2. + floor(N.x*1.5 + 0.5)*1., 3.), 0.5);
    float inside = step(abs(d), 0.95) * step(1.7, hgt) * step(hgt, 3.4 + sqrt(max(0.9 - d*d, 0.))*1.05);
    float rimN = step(abs(d), 1.2) * step(1.45, hgt) * step(hgt, 3.6 + sqrt(max(1.44 - d*d, 0.))*1.05);
    alb = mix(alb, alb*1.18, (rimN-inside)*pick);
    alb = mix(alb, vec3(0.02,0.016,0.02)*(1.+hgt*0.2), inside*pick);
    nm = inside*pick;
    lampG = pick * exp(-(d*d*0.55 + (hgt - 2.3)*(hgt - 2.3))/3.4);        // the pool of light a niche lamp throws on the wall round it
  }

  // moss on the low tiers in the second week of the monsoon
  if (uMoss > 0. && (flight || wall || carved)) {
    float mz = smoothstep(-28., -50., vP.y + (vn(vec2(s*0.12, vP.y*0.2))-0.5)*14.) * smoothstep(0.25, 0.7, vn(vec2(s*0.9, vP.y*0.7)) + 0.35*isTop);
    alb = mix(alb, vec3(0.105, 0.2, 0.06)*(0.7 + 0.6*blotch), mz*uMoss*0.8);
  }
  // ---- wetness: drop spots, then the rain curtain from the east, then the cascade front ----
  vec2 suv = isTop > 0.5 ? vP.xz : vec2(s, vP.y);
  float spotAmt = smoothstep(0.26, 0.42, uU);
  vec2 sc = suv*2.2; vec2 ci = floor(sc); vec2 cp = fract(sc) - 0.5 - (vec2(h21(ci), h21(ci+3.7))-0.5)*0.5;
  float sr = 0.34*clamp((spotAmt*1.25 - h21(ci+11.))*3., 0., 1.);
  float srr = max(sr, 1e-3);
  float spot = (1. - smoothstep(srr*0.6, srr, length(cp))) * step(0.001, sr) * (0.3 + 0.7*isTop);
  spot = mix(spotAmt*0.35*(0.3+0.7*isTop), spot, lod);
  float rainX = mix(85., -95., clamp((uU-0.38)/0.08, 0., 1.));
  float rained = smoothstep(0., 14., vP.x - rainX + (vn(vP.zy*0.2)-0.5)*10.);
  float wet = max(rained, spot);
  if (dark) wet *= 0.3;
  float fy = frontY() + (vn(vec2(s*0.3, tier))-0.5)*3.0 + (vn(vec2(s*1.9, 7.))-0.5)*0.9;
  float run = smoothstep(fy-0.2, fy+0.2, vP.y) * step(vP.y, -0.02) * ((flight || wall) && vP.z < 37.9 ? 1. : 0.);
  float age = clamp((vP.y - fy)/12., 0., 1.);
  if (carved || plaster || jali) {                            // eaves and sills dribble once it rains hard
    float dr = smoothstep(0.52, 0.66, vn(vec2(s*5., vP.y*0.3 + uTime*1.6)) * vn(vec2(s*1.3, 2.)) * 1.6);
    run = dr * smoothstep(0.5, 0.6, uU) * (1.-isTop) * 0.5 * lod;
  }

  // ---- light ----
  float nl = max(dot(N, uSunDir), 0.);
  float vis = sunVis(vP + N*0.25);
  if (dark) vis *= 0.25;
  vis *= mix(1., smoothstep(41.2, 38.7, vP.z), step(vP.y, -0.3));        // the buried hall and galleries are roofed; the roof terrace and kiosks are not
  float ao = mix(0.66, 1., smoothstep(-72., 4., vP.y));
  float litK = nl * vis;
  alb = mix(alb, alb*(uWet/max(uDry, vec3(0.05)))*1.15, wet*mix(0.3, 0.5, litK));   // wet stone darkens; in shade a little less, so the low tiers keep their courses
  vec3 hemi = mix(uBounce, uFill, clamp(up*0.35 + 0.65, 0., 1.)) * ao * (1. - 0.55*litK) * (1. + 0.2*wet*(1. - litK));
  vec3 sun = uSunCol * uSunI * litK;
  vec3 albS = mix(alb, vec3(dot(alb, vec3(0.3, 0.5, 0.2))), 0.8*uCool*(1. - litK));   // honey stone in blue skylight reads slate, not brown; in the sun it stays gold
  vec3 col = alb * sun + albS * hemi;
  if (vM > 6.9) col += alb * 0.32;                              // garlands and pennants keep their colour in shade
  bool gal = dark && vP.z > 38.5 && (abs(vP.x) > 8.5 || vP.y > -38.9);       // the shaded rooms behind the pavilion's arches (not the hall)
  float galH = fract((vP.y + 65.)/13.)*13.;                                  // height above that storey's floor
  if (gal) col += albS * (uFill*0.5 + uBounce*0.6) * smoothstep(11., 0., galH);   // light thrown up off the gallery floor

  // wet sheen: sky in the film, a sun glint on wet treads
  vec3 R = reflect(-V, N);
  float nv = clamp(dot(N, V), 0., 1.); float fr = 1.-nv; fr = 0.09 + 0.6*fr*fr*fr;
  col += wet * fr * skyRefl(R) * ao * (dark ? 0.2 : 1.) * (1. - nm);
  float rl = max(dot(R, uSunDir), 0.); float sp = rl*rl; sp *= sp; sp *= sp; sp *= sp;
  col += uSunCol * uSunI * sp * sp * vis * wet * 0.5;

  // oil lamps: a flame low in every niche, a warm wash on the gallery back walls
  if (uLamp > 0.) {
    float fl = 0.8 + 0.2*sin(uTime*9. + vP.x*3.1 + vP.y*1.7) * sin(uTime*13.7 + vP.z*2.3);
    float yn = 5.*(1.-yy);
    col += nm * uLamp * fl * vec3(2.6, 1.15, 0.3) * smoothstep(3.6, 1.7, yn) * (1. + 3.*smoothstep(2.25, 1.75, yn));
    col += alb * uLamp * fl * vec3(1.5, 0.66, 0.2) * lampG * (1. - nm) * 1.1;
    if (dark && vP.z > 38.5) {                               // one oil lamp to a bay, and not in every bay: pools of light, dark rooms between
      float ax = abs(vP.x), sg = vP.x < 0. ? -1. : 1.;
      float bi = ax < 2.5 ? -2. : (ax < 7.5 ? -1. : floor((ax - 7.5)/4.625));
      float bc = ax < 2.5 ? 0. : (ax < 7.5 ? 5. : 7.5 + 4.625*(bi + 0.5));
      float id = (bi + 3.)*(ax < 2.5 ? 1. : sg), stF = floor((vP.y + 65.)/13.);
      float k = mod(id*7. + stF*13. + id*stF*3. + 120., 5.);     // small exact integers: the world places its lamp glows by the same rule
      float lit = k < 0.5 ? 1. : ((k > 1.5 && k < 2.5) ? 0.45 : 0.);
      if (abs(abs(id) - 3.) < 0.5 && abs(stF - 1.) < 0.5) lit = 1.;        // and always the pair that flanks the great arch
      vec3 lv = vP - vec3(sg*bc, stF*13. - 65. + 2.0, 41.5);          // the lamp stands at the back wall
      float fl2 = 0.82 + 0.18*sin(uTime*8.3 + id*2.7 + stF*1.9)*sin(uTime*12.1 + id*4.3 + stF);
      float pool = gal ? lit*fl2*(exp(-dot(lv, lv)/2.2)*1.5 + exp(-dot(lv, lv)/14.)*0.14) : 0.;      // a tight pool with its falloff inside the bay and a faint spill: a lamp, not a lit panel
      col += uLamp * vec3(1.5, 0.62, 0.16) * alb * 2.6 * (0.03*(0.7 + 0.5*vn(vec2(s*0.35, vP.y*0.3)))*smoothstep(9., 1., galH) + pool);
    }
  }
  // ---- falling water ----
  float t = uTime;
  float wv, far;
  vec3 outN = (-vP.z > abs(vP.x)) ? vec3(0.,0.,1.) : vec3(-sign(vP.x), 0., 0.);
  float facing = abs(dot(N, outN));                            // 1 on faces looking into the well, 0 on risers
  if (isTop > 0.5) {                                          // film racing over treads and ledges
    float a = vn(vP.xz*vec2(5.,5.) + t*vec2(1.7,-1.1)), b2 = vn(vP.xz*2.1 - t*vec2(0.9,1.3));
    wv = smoothstep(0.35, 0.8, a*0.6 + b2*0.6) * 0.5 + (flight ? 0.14 : 0.0); far = flight ? 0.4 : 0.2;
  } else {                                                    // streaks at fall speed with dark gaps
    float a = vn(vec2(s*2.4, vP.y*0.2 + t*1.5)), b2 = vn(vec2(s*7., vP.y*0.6 + t*3.8));       // longer than they are wide, at fall speed
    float colm = vn(vec2(s*0.55, tier*5.))*0.6 + vn(vec2(s*1.6, tier*5. + 3.))*0.4;
    float st = a*0.62 + b2*0.38 + (colm-0.5)*0.9;
    if (flight && facing < 0.5) { wv = 0.62 + 0.38*smoothstep(0.25, 0.6, st); far = 0.86; }        // every step a white fall
    else if (flight) { wv = smoothstep(0.45, 0.8, st) * 0.62; far = 0.24; }                            // sheets off the tread ends
    else { float fine = vn(vec2(s*11., vP.y*0.3 + t*4.4));
      wv = smoothstep(0.56, 0.9, st) * (0.62 - 0.3*yy) * (0.25 + 0.25*fine + fine*fine) * (1. + 0.6*smoothstep(0.13, 0., yy)) + 0.4*smoothstep(0.07, 0.01, yy)
         + 0.5*smoothstep(0.84, 1., yy) * smoothstep(0.3, 0.7, vn(vec2(s*1.4 + t*0.7, tier*3. + t*1.1))) * smoothstep(0.3, 0.7, st + 0.2);   // and boiling white where they land on the ledge
      far = 0.07; }   // threads down the wall, rooted in a bright line under each ledge
  }
  float glint = smoothstep(0.8, 0.98, vn(vec2(s*17. + vP.y*0.6, vP.y*0.7 + t*6.3) + (isTop > 0.5 ? vP.xz*3. : vec2(0.)))) * lod;   // bright beads riding the falls
  wv = mix(far, wv, lod*0.8 + 0.2) * run * (0.6 + 0.4*age) * (1. - 0.85*nm);
  float edge = smoothstep(0.8, 0., abs(vP.y - fy)) * run;      // the bright lip of the front
  wv = clamp(wv + edge*0.5, 0., 1.);
  vec3 wfill = mix(uBounce, uFill, 0.8); wfill = mix(wfill, vec3(dot(wfill, vec3(0.333))), 0.45);       // shaded water is silver, not blue
  vec3 wlight = uSunCol*uSunI*vis*(0.62 + 0.38*nl) * 0.62 + wfill*ao*mix(1.15, 0.8, vis);
  vec3 wtint = mix(vec3(0.88,0.92,1.0), mix(vec3(1.0,0.9,0.7), uSunCol, 0.5), vis);   // silver in shade, a gold sheet where lit
  col = mix(col, wtint*wlight*0.92, wv);
  col += wtint*wlight * glint * wv * 0.75 + vec3(1.5, 0.66, 0.2) * uLamp * lampG * wv * 0.8;
  // foam where the pool meets the stone
  float pl = smoothstep(0.55, 0., abs(vP.y - uPoolY - 0.12)) * smoothstep(0.47, 0.55, uU) * (0.5+0.5*vn(vec2(s*2.+t*0.6, t*0.8)));
  col = mix(col, vec3(0.8,0.85,0.8)*wlight, pl*0.7);

  if (glowM) col = mix(col, vC * (0.8 + 0.2*sin(uTime*9.3 + vP.x*3.1 + vP.z*2.3)*sin(uTime*13.1 + vP.y*1.7)), 0.6 + 0.4*uLamp);   // a flame, or the ceiling it lights
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

const fogUniforms = (u) => Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), u);

// ---------- the flight pair: one stepped pyramid, 2 x 20 real steps, instanced over three walls ----------
// local: x along the wall (-7..7), y 0..5, z 0..FL_D out of the wall
function flightGeometry(rng) {
  const b = makeBuilder(); b.m = M_FLIGHT;
  const lw = 0.36, run = (CELL / 2 - lw) / 20, D = FL_D;
  for (const sgn of [1, -1]) {
    const X = (j) => sgn * (lw + j * run), Y = (j) => TH - 0.25 * j;
    for (let j = 0; j < 20; j++) {
      const w = 0.9 + 0.12 * rng();
      b.tint(0.86 * w, 0.84 * w, 0.82 * w);                                     // riser, a little darker
      b.quad([X(j), Y(j), 0], [X(j), Y(j), D], [X(j), Y(j + 1), D], [X(j), Y(j + 1), 0]);
      if (j < 19) {
        const t = 1.0 + 0.12 * rng(), dip = -0.03 * rng();                       // worn tread, sagging nosing
        b.tint(1.04 * t, 1.03 * t, 1.0 * t);
        b.quad([X(j), Y(j + 1), 0], [X(j + 1), Y(j + 1) + dip * 0.3, 0], [X(j + 1), Y(j + 1) + dip, D], [X(j), Y(j + 1), D]);
        b.tint(0.97, 0.96, 0.95);
        b.tri([X(j), Y(j + 1), D], [X(j + 1), Y(j + 1) + dip, D], [X(j + 1), Y(j + 2), D]);
      }
    }
    b.tint(0.97, 0.96, 0.95);
    b.quad([0, 0, D], [X(19), 0, D], [X(0), Y(1), D], [0, Y(1), D]);
    b.quad([0, Y(1), D], [X(0), Y(1), D], [X(0), TH, D], [0, TH, D]);
  }
  b.tint(1.08, 1.07, 1.04);
  b.quad([-lw, TH, 0], [lw, TH, 0], [lw, TH, D], [-lw, TH, D]);
  return b.geometry();
}

// centres of the flight pairs on one wall of one tier; wall: 0 north, 1 east, 2 west
function flightCentres(k, wall) {
  const hw = hwOf(k), odd = k % 2, out = [];
  if (wall === 0) {
    for (let j = -6; j <= 6; j++) { const c = j * CELL + odd * CELL / 2; if (Math.abs(c) + CELL / 2 <= hw - 3.2) out.push(c); }
  } else {
    for (let j = 0; j < 9; j++) { const c = PAV_Z - CELL / 2 - j * CELL - odd * CELL / 2; if (c - CELL / 2 >= -hw + 3.2) out.push(c); }
  }
  return out;
}
// local placement of something on a wall: s along the wall, d out from the wall face, y
function wallPoint(k, wall, s, d, y, out = new THREE.Vector3()) {
  const hw = hwOf(k);
  if (wall === 0) return out.set(s, y, -hw + d);
  return out.set(wall === 1 ? hw - d : -hw + d, y, s);
}

function buildLattice(b, rng, damage) {
  // retaining walls, string courses, ledges, floor
  b.home(); b.m = M_WALL;
  for (let k = 0; k < TIERS; k++) {
    const hw = hwOf(k), y0 = -TH * k, y1 = -TH * (k + 1), hi = hw - STEP_IN;
    const t = 0.93 + 0.1 * rng();
    b.tint(t, t * 0.985, t * 0.96);
    b.quad([-hw, y0, -hw], [hw, y0, -hw], [hw, y1, -hw], [-hw, y1, -hw]);
    b.quad([hw, y0, -hw], [hw, y0, PAV_Z], [hw, y1, PAV_Z], [hw, y1, -hw]);
    b.quad([-hw, y0, -hw], [-hw, y0, PAV_Z], [-hw, y1, PAV_Z], [-hw, y1, -hw]);
    // projecting string course under each ledge lip: a bright line in raking light
    b.tint(t * 1.08, t * 1.06, t * 1.02);
    const c = 0.2, yc = y0 - 0.4;
    b.quad([-hw, y0, -hw + c], [hw, y0, -hw + c], [hw, yc, -hw + c], [-hw, yc, -hw + c]);
    b.quad([-hw, yc, -hw + c], [hw, yc, -hw + c], [hw, yc - 0.12, -hw], [-hw, yc - 0.12, -hw]);
    for (const sx of [1, -1]) {
      b.quad([sx * (hw - c), y0, -hw], [sx * (hw - c), y0, PAV_Z], [sx * (hw - c), yc, PAV_Z], [sx * (hw - c), yc, -hw]);
      b.quad([sx * (hw - c), yc, -hw], [sx * (hw - c), yc, PAV_Z], [sx * hw, yc - 0.12, PAV_Z], [sx * hw, yc - 0.12, -hw]);
    }
    // ledges (the walkway at the foot of the tier)
    b.tint(t * 1.03, t * 1.02, t);
    b.quad([-hw, y1, -hw], [hw, y1, -hw], [hw, y1, -hi], [-hw, y1, -hi]);
    b.quad([hi, y1, -hi], [hw, y1, -hi], [hw, y1, PAV_Z], [hi, y1, PAV_Z]);
    b.quad([-hi, y1, -hi], [-hw, y1, -hi], [-hw, y1, PAV_Z], [-hi, y1, PAV_Z]);
  }
  // dished floor: the first pool gathers in the middle, silt slopes at the wall feet
  const f = hwOf(TIERS) + 3, nx = 14, nz = 16;
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const x0 = -f + (2 * f * i) / nx, x1 = -f + (2 * f * (i + 1)) / nx, z0 = -f + ((PAV_Z + f) * j) / nz, z1 = -f + ((PAV_Z + f) * (j + 1)) / nz;
    const w = 0.7 + 0.12 * rng(); b.tint(w, w * 0.99, w * 0.96);
    b.quad([x0, dishY(x0, z0), z0], [x1, dishY(x1, z0), z0], [x1, dishY(x1, z1), z1], [x0, dishY(x0, z1), z1]);
  }

  // flight pairs: instance transforms; a few have collapsed into rubble
  const inst = [], rubble = [];
  for (let k = 0; k < TIERS; k++) for (let wall = 0; wall < 3; wall++) {
    for (const c of flightCentres(k, wall)) {
      if (k > 0 && rng() < damage) { rubble.push({ k, wall, c }); continue; }
      inst.push({ k, wall, c, tint: 0.92 + 0.14 * rng(), warm: (rng() - 0.5) * 0.06 });
    }
  }
  // rubble where a flight pair has fallen: a slumped heap of blocks and a stump of the lower steps
  const p = new THREE.Vector3();
  for (const r of rubble) {
    const yb = -TH * (r.k + 1);
    for (let i = 0; i < 16; i++) {
      const s = r.c + (rng() - 0.5) * 12, d = 0.3 + rng() * 2.3, sz = 0.35 + rng() * 0.75, h = sz * (0.5 + rng() * 0.6);
      wallPoint(r.k, r.wall, s, d, yb, p);
      const w = 0.8 + 0.25 * rng(); b.tint(w, w * 0.98, w * 0.94);
      b.at(p.x, p.y + Math.max(0, 1.6 - Math.abs(s - r.c) * 0.3) * rng(), p.z, rng() * 3.1);
      b.box(-sz, 0, -sz * 0.7, sz, h, sz * 0.7, 0.06);
    }
    b.home();
  }
  return { inst, rubble };
}

function flightMesh(geo, inst, material) {
  const mesh = new THREE.InstancedMesh(geo, material, inst.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const tint = new Float32Array(inst.length * 3);
  inst.forEach((it, i) => {
    wallPoint(it.k, it.wall, it.c, 0, -TH * (it.k + 1), p);
    q.setFromAxisAngle(up, it.wall === 0 ? 0 : it.wall === 1 ? -Math.PI / 2 : Math.PI / 2);
    mesh.setMatrixAt(i, m.compose(p, q, s));
    tint[i * 3] = it.tint + it.warm; tint[i * 3 + 1] = it.tint; tint[i * 3 + 2] = it.tint - it.warm;
  });
  geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 3));
  mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false;
  return mesh;
}

// ---------- pavilion pieces ----------
function jit(b, rng, base = 1, amp = 0.1, warm = 0.03) {
  const t = base * (1 - amp / 2 + amp * rng()), w = (rng() - 0.5) * warm;
  return b.tint(t * 1.02 + w, t * 0.97, t * 0.92 - w);
}
// carved octagonal pillar: square plinth, banded shaft, bracket capital
function pillar(b, rng, x, y, z, H, r = 0.5) {
  b.m = M_CARVED; jit(b, rng, 0.98);
  b.at(x, y, z);
  b.box(-r * 1.35, 0, -r * 1.35, r * 1.35, 0.7, r * 1.35, 0.08);
  const m = H * 0.52;
  b.lathe(0, 0, [[r * 1.2, 0.7], [r * 1.2, 1.05], [r, 1.2], [r * 0.92, m], [r * 1.18, m + 0.14], [r * 1.18, m + 0.5], [r * 0.9, m + 0.66],
    [r * 0.84, H - 1.3], [r * 1.25, H - 1.1], [r * 1.25, H - 0.82], [r * 0.9, H - 0.68], [r * 1.55, H - 0.12], [r * 1.55, H]], 8, Math.PI / 8, false);
  // bracket arms either side under the beam
  jit(b, rng, 1.05);
  for (const s of [1, -1]) {
    b.quad([s * r, H - 0.9, -0.22], [s * (r + 0.95), H - 0.12, -0.22], [s * (r + 0.95), H, -0.22], [s * r, H, -0.22]);
    b.quad([s * r, H - 0.9, 0.22], [s * (r + 0.95), H - 0.12, 0.22], [s * (r + 0.95), H, 0.22], [s * r, H, 0.22]);
    b.quad([s * r, H - 0.9, -0.22], [s * (r + 0.95), H - 0.12, -0.22], [s * (r + 0.95), H - 0.12, 0.22], [s * r, H - 0.9, 0.22]);
  }
  b.home();
}
// cusped arch plate filling x0..x1 between springing ys and top yt at depth z (front face + soffit)
function cuspedArch(b, rng, x0, x1, ys, rise, yt, z, thick = 0.5, cusps = 5, segs = 10) {
  b.m = M_CARVED; jit(b, rng, 1.02);
  const w = x1 - x0, f = (t) => {
    const u = Math.abs(t * 2 - 1);                                      // 0 at crown, 1 at springing
    const arch = Math.pow(Math.max(0, 1 - Math.pow(u, 2.3)), 0.62);      // pointed, shouldered
    const lobe = Math.abs(Math.sin(t * Math.PI * cusps));
    return ys + rise * arch - rise * 0.085 * (1 - lobe) * Math.min(1, arch * 2.5);
  };
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs, t1 = (i + 1) / segs, xa = x0 + w * t0, xb = x0 + w * t1, ya = f(t0), yb = f(t1);
    b.quad([xa, ya, z], [xb, yb, z], [xb, yt, z], [xa, yt, z]);
    b.quad([xa, ya, z], [xb, yb, z], [xb, yb, z + thick], [xa, ya, z + thick]);
  }
}
// jharokha: corbelled balcony with colonettes, pierced rail, stone eave and a domed cap
function jharokha(b, rng, x, y, z, s = 1, bangla = false, rot = 0) {
  b.at(x - 0.5 * s * Math.sin(rot), y, z - 0.5 * s * Math.cos(rot), rot); b.m = M_CARVED; jit(b, rng, 1.0);
  b.lathe(0, 0, [[0.25 * s, -2.2 * s], [0.7 * s, -1.6 * s], [0.85 * s, -1.45 * s], [1.25 * s, -0.8 * s], [1.4 * s, -0.62 * s], [1.85 * s, -0.12 * s], [1.85 * s, 0.1 * s]], 8, Math.PI / 8, true);
  b.m = M_JALI; jit(b, rng, 1.08);
  b.lathe(0, 0, [[1.72 * s, 0.1 * s], [1.72 * s, 1.0 * s], [1.8 * s, 1.08 * s]], 8, Math.PI / 8, false);
  b.m = M_CARVED;
  for (let i = 0; i < 5; i++) {
    const a = Math.PI + Math.PI * (i + 0.0) / 4 + 0, cx = Math.cos(a) * 1.55 * s, cz = Math.sin(a) * 1.55 * s;
    jit(b, rng, 0.98);
    b.lathe(cx, cz, [[0.17 * s, 0.1 * s], [0.13 * s, 1.4 * s], [0.17 * s, 1.5 * s], [0.12 * s, 2.7 * s], [0.24 * s, 2.95 * s]], 6, 0, false);
  }
  jit(b, rng, 0.94);
  b.lathe(0, 0, [[1.8 * s, 2.95 * s], [2.45 * s, 2.85 * s], [2.5 * s, 2.98 * s], [1.75 * s, 3.35 * s], [1.7 * s, 3.6 * s]], 8, Math.PI / 8, false);
  b.m = M_PLASTER; b.tint(0.74, 0.5, 0.24);
  const dome = bangla
    ? [[1.75, 3.6], [1.7, 4.0], [1.35, 4.5], [0.7, 4.85], [0.2, 4.95]]
    : [[1.6, 3.6], [1.66, 3.95], [1.45, 4.5], [1.0, 4.95], [0.45, 5.2], [0.14, 5.28]];
  b.lathe(0, 0, dome.map(([r, h]) => [r * s, h * s]), 10, 0, false);
  b.m = M_CARVED; jit(b, rng, 1.1);
  const top = dome[dome.length - 1][1] * s;
  b.lathe(0, 0, [[0.14 * s, top], [0.3 * s, top + 0.2 * s], [0.1 * s, top + 0.42 * s], [0.2 * s, top + 0.6 * s], [0, top + 1.1 * s]], 6, 0, false);
  b.home();
}
// roof kiosk (chhatri): four pillars, eave slab, dome and finial; optional pennant
function kiosk(b, rng, x, y, z, s, flagCol) {
  b.at(x, y, z); b.m = M_CARVED; jit(b, rng, 1.0);
  b.box(-1.9 * s, 0, -1.9 * s, 1.9 * s, 0.5 * s, 1.9 * s, 0.1);
  for (const [px, pz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    jit(b, rng, 0.97);
    b.lathe(px * 1.4 * s, pz * 1.4 * s, [[0.26 * s, 0.5 * s], [0.2 * s, 0.9 * s], [0.18 * s, 2.6 * s], [0.3 * s, 2.8 * s], [0.2 * s, 2.95 * s], [0.36 * s, 3.3 * s]], 6, 0, false);
  }
  jit(b, rng, 0.92);
  b.lathe(0, 0, [[1.95 * s, 3.3 * s], [2.65 * s, 3.18 * s], [2.7 * s, 3.3 * s], [1.9 * s, 3.7 * s], [1.8 * s, 4.0 * s]], 4, Math.PI / 4, false);
  b.m = M_PLASTER; b.tint(0.76, 0.52, 0.25);
  b.lathe(0, 0, [[1.7, 4.0], [1.78, 4.4], [1.6, 5.0], [1.15, 5.55], [0.55, 5.9], [0.16, 6.0]].map(([r, h]) => [r * s, h * s]), 10, 0, false);
  b.m = M_CARVED; jit(b, rng, 1.1);
  b.lathe(0, 0, [[0.16 * s, 6.0 * s], [0.34 * s, 6.25 * s], [0.1 * s, 6.5 * s], [0.22 * s, 6.72 * s], [0.03, 7.5 * s]], 6, 0, false);
  if (flagCol) {                                                        // a festival pennant cracking in the gust
    b.box(-0.04, 7.4 * s, -0.04, 0.04, 9.6 * s, 0.04, 0);
    b.tint(flagCol[0], flagCol[1], flagCol[2]);
    const y0 = 8.3 * s, y1 = 9.5 * s, n = 5, L = 2.6;
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n;
      b.m = 7 + u0 * 0.39; b.v(u0 * L, lerp(y0, (y0 + y1) / 2, u0), 0); b.v(u0 * L, lerp(y1, (y0 + y1) / 2, u0), 0);
      b.m = 7 + u1 * 0.39; b.v(u1 * L, lerp(y0, (y0 + y1) / 2, u1), 0);
      b.m = 7 + u0 * 0.39; b.v(u0 * L, lerp(y1, (y0 + y1) / 2, u0), 0);
      b.m = 7 + u1 * 0.39; b.v(u1 * L, lerp(y1, (y0 + y1) / 2, u1), 0); b.v(u1 * L, lerp(y0, (y0 + y1) / 2, u1), 0);
    }
  }
  b.home();
}

function swag(b, x0, x1, y, z, sag, col, thick = 0.3, segs = 10) {
  b.tint(col[0], col[1], col[2]);
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs, t1 = (i + 1) / segs, f = (t) => y - sag * 4 * t * (1 - t), w = (t) => 7.05 + 0.3 * 4 * t * (1 - t);
    const xa = lerp(x0, x1, t0), xb = lerp(x0, x1, t1);
    b.m = w(t0); b.v(xa, f(t0), z); b.v(xa, f(t0) - thick, z); b.m = w(t1); b.v(xb, f(t1) - thick, z);
    b.m = w(t0); b.v(xa, f(t0), z); b.m = w(t1); b.v(xb, f(t1) - thick, z); b.v(xb, f(t1), z);
  }
}

// a marigold string hanging straight down a pier: a beaded ribbon that sways more toward its free end
function strand(b, x, y0, y1, z, col, w = 0.28, segs = 9) {
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs, t1 = (i + 1) / segs, ya = lerp(y0, y1, t0), yb = lerp(y0, y1, t1), k = i % 2 ? 0.82 : 1.08, wa = w * (i % 2 ? 0.5 : 0.36), wb = w * (i % 2 ? 0.36 : 0.5);
    b.tint(col[0] * k, col[1] * k, col[2] * k);
    b.m = 7.04 + t0 * 0.26; b.v(x - wa, ya, z); b.v(x + wa, ya, z); b.m = 7.04 + t1 * 0.26; b.v(x + wb, yb, z);
    b.m = 7.04 + t0 * 0.26; b.v(x - wa, ya, z); b.m = 7.04 + t1 * 0.26; b.v(x + wb, yb, z); b.v(x - wb, yb, z);
  }
}

async function buildPavilion(b, rng, o, pause) {
  const X = [7.5, 12.125, 16.75, 21.375, 26], zF = PAV_Z, zP = PAV_Z + 0.6, zB = PAV_Z + 4, EX = 26.6, PX = 8.9;
  b.home();
  // wings: the plain ashlar of the south wall either side of the pavilion block, with string courses
  for (const sx of [1, -1]) {
    b.m = M_WALL; b.tint(0.95, 0.94, 0.92);
    b.quad([sx * EX, 0, zF], [sx * 66, 0, zF], [sx * 66, -DEPTH, zF], [sx * EX, -DEPTH, zF]);
    b.m = M_CARVED;
    for (let s = 1; s <= 5; s++) {
      const y = -DEPTH + 13 * s; jit(b, rng, 1.06, 0.05);
      b.quad([sx * EX, y, zF - 0.28], [sx * 66, y, zF - 0.28], [sx * 66, y - 0.45, zF - 0.28], [sx * EX, y - 0.45, zF - 0.28]);
      b.quad([sx * EX, y, zF - 0.28], [sx * 66, y, zF - 0.28], [sx * 66, y, zF], [sx * EX, y, zF]);
      b.quad([sx * EX, y - 0.45, zF - 0.28], [sx * 66, y - 0.45, zF - 0.28], [sx * 66, y - 0.65, zF], [sx * EX, y - 0.65, zF]);
    }
  }
  for (let s = 0; s < 5; s++) {
    const base = -DEPTH + 13 * s, low = s < 2;
    const sections = low ? [[-EX, -PX], [PX, EX]] : [[-EX, EX]];
    for (const [xa, xb] of sections) {
      // gallery floor, shadowed back wall with a paler dado, ceiling
      b.m = M_WALL; b.tint(0.9, 0.89, 0.86);
      if (s > 0) b.quad([xa, base + 0.02, zF], [xb, base + 0.02, zF], [xb, base + 0.02, zB], [xa, base + 0.02, zB]);
      b.m = M_DARK; b.tint(1.5, 1.3, 1.1);
      b.quad([xa, base, zB], [xb, base, zB], [xb, base + 2.2, zB], [xa, base + 2.2, zB]);
      b.tint(0.8, 0.75, 0.75);
      b.quad([xa, base + 2.2, zB], [xb, base + 2.2, zB], [xb, base + 11, zB], [xa, base + 11, zB]);
      b.quad([xa, base + 10.6, zF + 1], [xb, base + 10.6, zF + 1], [xb, base + 10.6, zB], [xa, base + 10.6, zB]);
      // end walls: each gallery is a closed room (and so is the gap between its ceiling and the floor above), so no sky shows through the last bay
      for (const xe of [xa, xb]) b.quad([xe, base, zF], [xe, base, zB], [xe, base + 13, zB], [xe, base + 13, zF]);
      // beam, carved frieze, sloped stone eave with a drip lip
      b.m = M_CARVED; jit(b, rng, 1.0, 0.06);
      b.box(xa, base + 10, zF + 0.05, xb, base + 11.3, zF + 1.1, 0, false);
      jit(b, rng, 0.95, 0.06);
      b.quad([xa, base + 11.3, zF], [xb, base + 11.3, zF], [xb, base + 13, zF], [xa, base + 13, zF]);
      jit(b, rng, 1.08, 0.05);
      const e0 = [zF + 0.05, base + 11.45], e1 = [zF - 1.75, base + 10.85];
      b.quad([xa - 0.3, e0[1], e0[0]], [xb + 0.3, e0[1], e0[0]], [xb + 0.3, e1[1], e1[0]], [xa - 0.3, e1[1], e1[0]]);
      b.quad([xa - 0.3, e1[1], e1[0]], [xb + 0.3, e1[1], e1[0]], [xb + 0.3, e1[1] - 0.24, e1[0]], [xa - 0.3, e1[1] - 0.24, e1[0]]);
      b.tint(0.7, 0.66, 0.62);
      b.quad([xa - 0.3, e0[1] - 0.3, e0[0]], [xb + 0.3, e0[1] - 0.3, e0[0]], [xb + 0.3, e1[1] - 0.24, e1[0]], [xa - 0.3, e1[1] - 0.24, e1[0]]);
    }
    // pillar lines, eave brackets, cusped arches, pierced rails
    const lines = [];
    for (const sx of [1, -1]) for (let i = low ? 1 : 0; i < 5; i++) lines.push(sx * X[i]);
    if (low) lines.push(PX + 0.1, -PX - 0.1); else lines.push(2.5, -2.5);
    lines.sort((a, c) => a - c);
    for (const x of lines) {
      if (!(low && Math.abs(x) < PX + 0.2)) pillar(b, rng, x, base, zP, 10, 0.5);
      b.m = M_CARVED; jit(b, rng, 1.04);
      b.quad([x - 0.2, base + 10.05, zF], [x + 0.2, base + 10.05, zF], [x + 0.2, base + 10.85, zF - 1.5], [x - 0.2, base + 10.85, zF - 1.5]);
      b.quad([x - 0.2, base + 10.05, zF], [x - 0.2, base + 10.85, zF - 1.5], [x - 0.2, base + 10.95, zF], [x - 0.2, base + 10.95, zF]);
      b.quad([x + 0.2, base + 10.05, zF], [x + 0.2, base + 10.85, zF - 1.5], [x + 0.2, base + 10.95, zF], [x + 0.2, base + 10.95, zF]);
    }
    for (let i = 0; i < lines.length - 1; i++) {
      const xa = lines[i], xb = lines[i + 1];
      if (low && xa < 0 && xb > 0) continue;                             // the great arch
      cuspedArch(b, rng, xa, xb, base + 7.0, 2.5, base + 10.0, zF + 0.25, 0.55, xb - xa > 4.8 ? 5 : 5, 10);
      b.m = M_JALI; jit(b, rng, 1.1, 0.08);
      b.quad([xa + 0.5, base + 0.05, zF + 0.3], [xb - 0.5, base + 0.05, zF + 0.3], [xb - 0.5, base + 1.35, zF + 0.3], [xa + 0.5, base + 1.35, zF + 0.3]);
      b.m = M_CARVED;
      b.box(xa + 0.4, base + 1.35, zF + 0.16, xb - 0.4, base + 1.55, zF + 0.46, 0, true);
      if (o.festival && rng() < 0.3 && s > 0) { swag(b, xa + 0.4, xb - 0.4, base + 9.2, zF + 0.1, 1.1, o.garland, 0.22, 8); }
    }
    await pause();
  }
  // the great arch: piers, cusped two-storey plate, hood, sill
  const sill = -58, crown = -41, topA = -39;
  for (const sx of [1, -1]) {
    b.at(sx * (7.5 + 0.7), 0, zF + 0.4); b.m = M_CARVED; jit(b, rng, 1.0, 0.05);
    b.box(-0.95, sill, -1.2, 0.95, sill + 1.4, 1.2, 0.12);
    b.box(-0.78, sill + 1.4, -1.0, 0.78, -48.2, 1.0, 0.03);
    jit(b, rng, 1.08, 0.05);
    b.box(-1.0, -48.2, -1.25, 1.0, -47.3, 1.25, -0.1);
    b.box(-0.78, -47.3, -1.0, 0.78, topA, 1.0, 0.0);
    b.home();
  }
  cuspedArch(b, rng, -7.5, 7.5, -47.2, crown + 47.2, topA + 0.01, zF - 0.5, 1.6, 7, 28);
  b.m = M_CARVED; jit(b, rng, 1.06, 0.04);
  b.box(-PX, topA - 0.9, zF - 0.75, PX, topA, zF - 0.5, 0, false);
  if (o.festival) {                                                      // garlands: on the facade above the crown and down the piers, never in the opening
    for (const sx of [1, -1]) {
      swag(b, sx * 0.4, sx * 8.6, -39.08, zF - 0.86, 0.8, o.garland, 0.32, 10); swag(b, sx * 1.6, sx * 7.4, -39.15, zF - 0.9, 1.15, o.garland2, 0.24, 10);
      strand(b, sx * 8.75, -40.0, -46.6, zF - 0.95, o.garland, 0.3); strand(b, sx * 8.2, -40.0, -45.2, zF - 0.97, o.garland2, 0.24); strand(b, sx * 7.72, -40.0, -43.9, zF - 0.95, o.garland, 0.26);
    }
  }
  // hall behind the arch: dark shell, sill slab, engaged pillars
  b.m = M_WALL; b.tint(0.85, 0.84, 0.82);
  b.quad([-PX, sill, zF - 0.6], [PX, sill, zF - 0.6], [PX, sill, zF + 16], [-PX, sill, zF + 16]);
  b.m = M_DARK; b.tint(0.42, 0.38, 0.4);
  for (const sx of [1, -1]) b.quad([sx * 8.3, sill, zF + 0.9], [sx * 8.3, sill, zF + 16], [sx * 8.3, topA, zF + 16], [sx * 8.3, topA, zF + 0.9]);
  b.quad([-8.3, sill, zF + 16], [8.3, sill, zF + 16], [8.3, topA, zF + 16], [-8.3, topA, zF + 16]);
  b.quad([-8.3, crown + 0.6, zF + 1], [8.3, crown + 0.6, zF + 1], [8.3, crown + 0.6, zF + 16], [-8.3, crown + 0.6, zF + 16]);
  for (const sx of [1, -1]) for (const dz of [3.2, 13.6]) pillar(b, rng, sx * 7.6, sill, zF + dz, crown + 0.6 - sill, 0.62);
  // the portal's light on the stone that frames it: the hall's side walls (brightest beside the ring, falling away toward the well) and the
  // inner faces of the arch's piers, so the portal is felt from the stair walls even where a pier hides the ring itself
  { const gv = (x, y, z) => { const k = 0.02 + 0.52 * Math.exp(-((z - zF - 8) * (z - zF - 8)) / 34) * Math.exp(-((y + 48) * (y + 48)) / 70); b.tint(k, 0.74 * k, 0.36 * k); b.v(x, y, z); };
    const ZS = [zF + 0.95, zF + 2.6, zF + 4.3, zF + 6.1, zF + 7.9], YS = [sill + 0.05, -54.5, -51, -47.5, -44, crown + 0.55];
    b.m = M_GLOW;
    for (const sx of [1, -1]) {
      const x = sx * 8.24;
      for (let i = 0; i < ZS.length - 1; i++) for (let j = 0; j < YS.length - 1; j++) {
        gv(x, YS[j], ZS[i]); gv(x, YS[j], ZS[i + 1]); gv(x, YS[j + 1], ZS[i + 1]); gv(x, YS[j], ZS[i]); gv(x, YS[j + 1], ZS[i + 1]); gv(x, YS[j + 1], ZS[i]);
      }
      b.tint(0.1, 0.074, 0.036);
      b.quad([sx * 7.39, sill + 1.45, zF - 0.55], [sx * 7.39, sill + 1.45, zF + 1.35], [sx * 7.39, -48.25, zF + 1.35], [sx * 7.39, -48.25, zF - 0.55]);
    } }
  // ghats from the sill down into the pool: the gauge the rising water is read against
  b.m = M_WALL;
  for (let i = 0; i < 14; i++) {
    const y0 = sill - 0.5 * i, y1 = y0 - 0.5, z0 = zF - 0.6 - 0.62 * i, z1 = z0 - 0.62, gx = 13 + i * 0.25;
    const t = 0.9 + 0.12 * rng(); b.tint(t * 1.04, t * 1.02, t);
    b.quad([-gx, y0, z0 + 0.62], [gx, y0, z0 + 0.62], [gx, y0, z0], [-gx, y0, z0]);
    b.tint(t * 0.88, t * 0.86, t * 0.84);
    b.quad([-gx, y0, z0], [gx, y0, z0], [gx, y1, z0], [-gx, y1, z0]);
    for (const sx of [1, -1]) b.quad([sx * gx, y0, z0 + 0.62], [sx * gx, y0, z0], [sx * gx, -DEPTH, z0], [sx * gx, -DEPTH, z0 + 0.62]);
  }
  // spouts: carved makara heads either side of the arch, draining the third gallery
  for (const sx of [1, -1]) {
    b.at(sx * o.spoutX, o.spoutY, zF); b.m = M_CARVED; jit(b, rng, 1.02);
    b.box(-0.75, -0.9, -1.2, 0.75, 0.55, 0.3, 0.1);
    b.quad([-0.5, -0.6, -1.2], [0.5, -0.6, -1.2], [0.36, -0.42, -3.3], [-0.36, -0.42, -3.3]);
    b.quad([-0.5, 0.25, -1.2], [0.5, 0.25, -1.2], [0.36, 0.3, -3.3], [-0.36, 0.3, -3.3]);
    for (const q of [1, -1]) b.quad([q * 0.5, -0.6, -1.2], [q * 0.5, 0.25, -1.2], [q * 0.36, 0.3, -3.3], [q * 0.36, -0.42, -3.3]);
    b.lathe(0, -3.5, [[0.42, -0.5], [0.62, -0.2], [0.6, 0.25], [0.35, 0.55]], 6, 0, true);
    b.m = M_DARK; b.tint(0.2, 0.2, 0.2);
    b.quad([-0.3, -0.36, -3.32], [0.3, -0.36, -3.32], [0.3, 0.12, -3.32], [-0.3, 0.12, -3.32]);
    b.home();
  }
  await pause();
  // fourteen jharokhas on the wings
  const spots = [[1, 30.6], [2, 31], [3, 31], [3, 39.5], [4, 31], [4, 39.8], [4, 48.6]];
  for (const sx of [1, -1]) for (const [s, x] of spots) {
    const y = -DEPTH + 13 * s + 4.2, sc = 1 + 0.12 * rng();
    b.m = M_DARK; b.tint(0.25, 0.22, 0.2);
    b.quad([sx * x - 0.85, y, zF - 0.04], [sx * x + 0.85, y, zF - 0.04], [sx * x + 0.85, y + 2.7, zF - 0.04], [sx * x - 0.85, y + 2.7, zF - 0.04]);
    jharokha(b, rng, sx * x, y, zF, sc, o.bangla);
  }
  await pause();
  // roof: a paved terrace over the buried hall and galleries, parapet with merlons and a row of kiosks
  b.m = M_WALL;
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) {
    const x0 = -30 + i * 10, z0 = zF + 0.6 + j * 8.2, t = 0.9 + 0.1 * rng(); b.tint(t * 1.02, t, t * 0.96);
    b.quad([x0, 0.04, z0], [x0 + 10, 0.04, z0], [x0 + 10, 0.04, z0 + 8.2], [x0, 0.04, z0 + 8.2]);
  }
  b.m = M_CARVED; jit(b, rng, 1.0, 0.04);
  b.box(-EX, 0, zF, EX, 1.25, zF + 0.6, 0.04);
  for (let x = -EX + 0.7; x < EX - 0.5; x += 1.7) { jit(b, rng, 1.0, 0.14); b.at(x, 1.25, zF + 0.3); b.lathe(0, 0, [[0.62, 0], [0.62, 0.45], [0.3, 0.95], [0.0, 1.15]], 4, 0, false, 0.42); }
  b.home();
  const nk = o.kiosks, span = 21.5;
  for (let i = 0; i < nk; i++) {
    const x = nk === 1 ? 0 : -span + (2 * span * i) / (nk - 1), mid = i === (nk - 1) / 2;
    kiosk(b, rng, x, 0, zF + 3.4, mid ? 1.55 : 1.0 + 0.08 * rng(), o.festival && (mid || rng() < 0.5) ? o.flag : null);
  }
}

// ---------- lit places on the stairs: shrine pavilions on four landings, and the tower in the north-east corner ----------
// (a small generator of their own, so these pieces leave every other random draw of the set piece as it was)
function miniRng(seed) { let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

// a fire bowl: a stone stand and its flame (local coordinates under the current b.at)
function lampAt(b, x, y, z, s = 1) {
  b.m = M_CARVED; b.tint(0.8, 0.74, 0.66);
  b.lathe(x, z, [[0.16 * s, y], [0.1 * s, y + 0.12 * s], [0.24 * s, y + 0.3 * s], [0.2 * s, y + 0.36 * s]], 6, 0, true);
  b.m = M_GLOW; b.tint(3.4, 1.55, 0.4);
  b.lathe(x, z, [[0.0, y + 0.36 * s], [0.14 * s, y + 0.5 * s], [0.09 * s, y + 0.72 * s], [0.0, y + 0.98 * s]], 5, 0, false);
}
// a pennant on its pole, streaming downwind (local -x); the cloth is drawn with the swaying material
function pennant(b, x, z, y0, y1, yTop, L, col) {
  b.m = M_CARVED; b.tint(0.5, 0.42, 0.34); b.box(x - 0.05, y0 - 1.7, z - 0.05, x + 0.05, yTop, z + 0.05, 0);
  b.tint(col[0], col[1], col[2]);
  const n = 6, ym = (y0 + y1) / 2;
  for (let i = 0; i < n; i++) {
    const u0 = i / n, u1 = (i + 1) / n, m0 = 7 + u0 * 0.39, m1 = 7 + u1 * 0.39;
    b.m = m0; b.v(x - u0 * L, lerp(y0, ym, u0), z); b.v(x - u0 * L, lerp(y1, ym, u0), z); b.m = m1; b.v(x - u1 * L, lerp(y0, ym, u1), z);
    b.m = m0; b.v(x - u0 * L, lerp(y1, ym, u0), z); b.m = m1; b.v(x - u1 * L, lerp(y1, ym, u1), z); b.v(x - u1 * L, lerp(y0, ym, u1), z);
  }
}
// a shrine pavilion on a landing: plinth, four carved pillars, stone eave, a copper dome with finial and saffron pennant; a back wall
// against the stair wall, a lotus pedestal with a flame, the ceiling and wall that flame lights, marigold swags across the open front.
// rot turns its front (local +z) to face into the well. The flame's place (hero-local) is pushed to `lamps` for the world's glow sprites.
function landingShrine(b, rng, x, y, z, rot, s, o, lamps) {
  b.at(x, y, z, rot); b.m = M_CARVED; jit(b, rng, 1.0);
  b.box(-1.9 * s, 0, -1.9 * s, 1.9 * s, 0.5 * s, 1.9 * s, 0.1);
  for (const [px, pz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    jit(b, rng, 0.97);
    b.lathe(px * 1.4 * s, pz * 1.4 * s, [[0.26 * s, 0.5 * s], [0.2 * s, 0.9 * s], [0.18 * s, 2.6 * s], [0.3 * s, 2.8 * s], [0.2 * s, 2.95 * s], [0.36 * s, 3.3 * s]], 6, 0, false);
  }
  jit(b, rng, 0.92);
  b.lathe(0, 0, [[1.95 * s, 3.3 * s], [2.65 * s, 3.18 * s], [2.7 * s, 3.3 * s], [1.9 * s, 3.7 * s], [1.8 * s, 4.0 * s]], 4, Math.PI / 4, false);
  b.m = M_PLASTER; b.tint(0.78, 0.53, 0.25);
  b.lathe(0, 0, [[1.7, 4.0], [1.78, 4.4], [1.6, 5.0], [1.15, 5.55], [0.55, 5.9], [0.16, 6.0]].map(([r, h]) => [r * s, h * s]), 10, 0, false);
  b.m = M_CARVED; jit(b, rng, 1.1);
  b.lathe(0, 0, [[0.16 * s, 6.0 * s], [0.34 * s, 6.25 * s], [0.1 * s, 6.5 * s], [0.22 * s, 6.72 * s], [0.03, 7.5 * s]], 6, 0, false);
  jit(b, rng, 0.9);
  b.box(-1.55 * s, 0.5 * s, -1.8 * s, 1.55 * s, 3.3 * s, -1.5 * s, 0);                       // back wall
  b.m = M_GLOW; b.tint(0.8, 0.36, 0.1);                                                       // what the flame lights: the wall behind it, the ceiling
  b.quad([-1.2 * s, 0.75 * s, -1.48 * s], [1.2 * s, 0.75 * s, -1.48 * s], [1.2 * s, 3.0 * s, -1.48 * s], [-1.2 * s, 3.0 * s, -1.48 * s]);
  b.tint(0.62, 0.27, 0.08);
  b.quad([-1.7 * s, 3.28 * s, -1.45 * s], [1.7 * s, 3.28 * s, -1.45 * s], [1.7 * s, 3.28 * s, 1.7 * s], [-1.7 * s, 3.28 * s, 1.7 * s]);
  b.m = M_CARVED; jit(b, rng, 1.05);
  b.lathe(0, 0, [[0.6 * s, 0.5 * s], [0.66 * s, 0.72 * s], [0.38 * s, 0.86 * s], [0.56 * s, 1.1 * s], [0.5 * s, 1.2 * s]], 8, 0, true);
  lampAt(b, 0, 1.2 * s, 0, 1.25 * s);
  const cs = Math.cos(rot), sn = Math.sin(rot), lip = 2.85 - 1.9 * s;                      // (lip: the ledge's edge, in local z)
  for (const [px, pz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {                             // fire bowls on the four corners of the eave
    const lx = px * 1.75 * s, lz = pz * 1.75 * s;
    lampAt(b, lx, 3.4 * s, lz, 0.85 * s);
    if (pz > 0) lamps.push([x + lx * cs + lz * sn, y + 4.0 * s, z - lx * sn + lz * cs]);
  }
  if (lip < 1.9 * s) {                                                                        // a corbel carries what stands out past the ledge
    b.m = M_CARVED; jit(b, rng, 0.9);
    const w = 1.9 * s, f = 1.9 * s;
    b.quad([-w, 0, f], [w, 0, f], [w * 0.8, -1.7, lip], [-w * 0.8, -1.7, lip]);
    for (const sx of [1, -1]) b.tri([sx * w, 0, f], [sx * w * 0.8, -1.7, lip], [sx * w, 0, lip]);
  }
  swag(b, -1.4 * s, 1.4 * s, 3.12 * s, 1.5 * s, 0.75 * s, o.garland, 0.26, 8); swag(b, -1.4 * s, 1.4 * s, 3.16 * s, 1.56 * s, 1.15 * s, o.garland2, 0.18, 8);
  for (const sx of [1, -1]) strand(b, sx * 1.4 * s, 3.1 * s, 1.3 * s, 1.68 * s, o.garland, 0.26);
  pennant(b, 0, 0, 8.3 * s, 9.5 * s, 9.7 * s, 2.8, o.flag);
  lamps.push([x, y + 1.95 * s, z]);
  b.home();
}
// the corner tower (burj): an octagonal bastion standing in the north-east corner from the third ledge to above the gallery roof, with a
// balcony looking down the well's diagonal, lit windows, and a domed eight-pillared chhatri with a fire bowl under it and a long pennant.
function cornerTower(b, rng, o, lamps) {
  const cx = 59, cz = -59, yb = -15, yp = 6.4, R8 = Math.PI / 8;
  b.at(cx, 0, cz); b.m = M_CARVED; jit(b, rng, 0.98, 0.05);
  b.lathe(0, 0, [[3.6, yb], [3.6, yb + 0.9], [3.25, yb + 1.1], [3.15, -5.4], [3.4, -5.2], [3.4, -4.7], [3.15, -4.5], [3.05, 0.2], [3.3, 0.4], [3.3, 0.9], [3.05, 1.1],
    [3.0, 4.4], [3.3, 4.7], [4.5, 6.0], [4.5, yp]], 8, R8, true);
  b.m = M_JALI; jit(b, rng, 1.08, 0.05);
  b.lathe(0, 0, [[4.42, yp], [4.42, yp + 1.0], [4.28, yp + 1.0]], 8, R8, false);
  b.m = M_CARVED;
  for (let i = 0; i < 8; i++) {
    const a = R8 + i * Math.PI / 4; jit(b, rng, 0.97);
    b.lathe(Math.cos(a) * 3.45, Math.sin(a) * 3.45, [[0.44, yp], [0.44, yp + 0.5], [0.3, yp + 0.7], [0.27, yp + 3.6], [0.44, yp + 3.85], [0.3, yp + 4.05], [0.52, yp + 4.6]], 6, 0, false);
  }
  jit(b, rng, 0.92);
  b.lathe(0, 0, [[3.8, yp + 4.6], [5.3, yp + 4.3], [5.4, yp + 4.5], [3.8, yp + 5.2], [3.5, yp + 5.7]], 8, R8, false);
  b.m = M_GLOW; b.tint(0.72, 0.32, 0.09);
  b.lathe(0, 0, [[0.0, yp + 4.56], [3.75, yp + 4.56]], 8, R8, false);                          // the ceiling its fire lights
  b.m = M_PLASTER; b.tint(0.8, 0.54, 0.25);
  b.lathe(0, 0, [[3.3, yp + 5.7], [3.45, yp + 6.5], [3.15, yp + 7.7], [2.3, yp + 8.9], [1.15, yp + 9.7], [0.32, yp + 9.95]], 12, 0, false);
  b.m = M_CARVED; jit(b, rng, 1.1);
  b.lathe(0, 0, [[0.32, yp + 9.95], [0.66, yp + 10.45], [0.2, yp + 10.95], [0.44, yp + 11.4], [0.05, yp + 12.9]], 6, 0, false);
  pennant(b, 0, 0, yp + 14.3, yp + 16.2, yp + 16.5, 4.6, o.flag);
  lampAt(b, 0, yp, 0, 2.1);
  lamps.push([cx, yp + 1.5, cz]);
  // lit windows on the three faces that look into the well, and the doorway behind the balcony
  for (const [nx, nz] of [[-1, 0], [-Math.SQRT1_2, Math.SQRT1_2], [0, 1]]) {
    const tx = -nz, tz = nx, ap = 3.02 * Math.cos(R8) + 0.05, px = nx * ap, pz = nz * ap;
    b.m = M_GLOW; b.tint(0.85, 0.38, 0.11);
    b.quad([px - tx * 0.42, 1.7, pz - tz * 0.42], [px + tx * 0.42, 1.7, pz + tz * 0.42], [px + tx * 0.42, 3.3, pz + tz * 0.42], [px - tx * 0.42, 3.3, pz - tz * 0.42]);
    b.tri([px - tx * 0.42, 3.3, pz - tz * 0.42], [px + tx * 0.42, 3.3, pz + tz * 0.42], [px, 3.85, pz]);
  }
  { const n = Math.SQRT1_2, ap = 3.2 * Math.cos(R8) + 0.06, px = -n * ap, pz = n * ap;
    b.m = M_GLOW; b.tint(0.95, 0.42, 0.12);
    b.quad([px - n * 0.8, -9.4, pz - n * 0.8], [px + n * 0.8, -9.4, pz + n * 0.8], [px + n * 0.8, -6.7, pz + n * 0.8], [px - n * 0.8, -6.7, pz - n * 0.8]);
    b.home();
    jharokha(b, rng, cx - n * 2.96, -9.5, cz + n * 2.96, 1.3, o.bangla, 3 * Math.PI / 4);
    lamps.push([cx - n * 3.9, -8.2, cz + n * 3.9]); }
  b.home();
}

// ---------- rim: parapet, colonnaded gallery with the fallen bay, sculpture fragments, earth apron ----------
function fragment(b, rng, kind) {                 // stands on the current origin (top of a plinth)
  b.m = M_CARVED; jit(b, rng, 1.05, 0.1);
  if (kind === 0) {                               // torso: hips, waist, chest, broken neck
    b.lathe(0, 0, [[0.34, 0], [0.4, 0.25], [0.27, 0.6], [0.36, 0.95], [0.42, 1.2], [0.3, 1.38], [0.13, 1.45], [0.11, 1.56]], 7, rng() * 6, true, 0.7);
    b.box(0.3, 0.95, -0.12, 0.62, 1.28, 0.12, 0.05);
  } else if (kind === 1) {                        // lotus medallion on edge
    b.lathe(0, 0, [[0.0, 0.0], [0.5, 0.06], [0.8, 0.3], [0.86, 0.8], [0.8, 1.3], [0.5, 1.54], [0.0, 1.6]], 12, 0, false, 0.16);
    b.lathe(0, -0.1, [[0.0, 0.5], [0.3, 0.6], [0.3, 1.0], [0.0, 1.1]], 8, 0, false, 0.2);
  } else {                                        // headless bull: body, hump, haunch, legs, neck stump
    b.box(-0.95, 0.5, -0.36, 0.85, 1.22, 0.36, 0.1);
    b.lathe(0.42, 0, [[0.34, 1.15], [0.3, 1.4], [0.0, 1.56]], 6, 0, false);
    b.box(0.8, 0.8, -0.24, 1.12, 1.2, 0.24, 0.07);
    for (const [lx, lz] of [[-0.72, -0.24], [-0.72, 0.24], [0.6, -0.24], [0.6, 0.24]]) b.box(lx - 0.12, 0, lz - 0.11, lx + 0.12, 0.55, lz + 0.11, 0.02);
  }
}

async function buildRim(b, rng, o, pause) {
  const colProf = [[0.9, 0.03], [0.9, 0.5], [0.62, 0.72], [0.56, 3.5], [0.76, 3.72], [0.76, 4.1], [0.6, 4.28], [0.98, 4.95], [0.98, 5.2]];
  const sides = [
    { at: [0, 0, -RIM], rot: 0, a: -71, c: 71, gap: null },
    { at: [RIM, 0, 0], rot: -Math.PI / 2, a: -71, c: PAV_Z, gap: null },
    { at: [-RIM, 0, 0], rot: Math.PI / 2, a: -PAV_Z, c: 71, gap: [-o.gapZ - 9, -o.gapZ + 9] },
  ];
  const inGap = (sd, x, pad = 0) => sd.gap && x > sd.gap[0] - pad && x < sd.gap[1] + pad;
  for (const sd of sides) {
    const A = () => b.at(sd.at[0], sd.at[1], sd.at[2], sd.rot);
    // paving under the gallery and the low parapet on the lip
    A(); b.m = M_WALL; b.tint(0.9, 0.89, 0.86);
    b.quad([sd.a, 0.08, 0], [sd.c, 0.08, 0], [sd.c, 0.08, -7.4], [sd.a, 0.08, -7.4]);
    const runs = sd.gap ? [[sd.a + 6, sd.gap[0] + 1.5], [sd.gap[1] - 1.5, sd.c]] : [[sd.a + 6, sd.c - (sd.rot === 0 ? 6 : 0)]];
    for (const [x0, x1] of runs) for (let x = x0; x < x1 - 0.1; x += 6.5) {
      const xe = Math.min(x + 6.5, x1), h = rng() < 0.12 ? 0.35 + 0.3 * rng() : 0.95;      // some lengths knocked down
      A(); b.m = M_CARVED; jit(b, rng, 1.0, 0.1);
      b.box(x + 0.03, 0, -0.5, xe - 0.03, h, -0.05, 0.03);
      if (h > 0.9) { jit(b, rng, 1.08, 0.06); b.box(x, h, -0.58, xe, h + 0.16, 0.02, 0.02); }
    }
    // two rows of squat columns and the flat roof in slabs, old and uneven
    for (let x = sd.a + 2.8; x < sd.c - 1; x += 5.6) {
      const gone = inGap(sd, x, 0.5), edge = gone && (!inGap(sd, x - 5.6, 0.5) || !inGap(sd, x + 5.6, 0.5));
      for (const z of [-1.9, -5.9]) {
        A(); b.at(b.ox + (x * b.cs + z * b.sn), 0, b.oz + (-x * b.sn + z * b.cs), rng() * 0.8);
        b.m = M_CARVED; jit(b, rng, 0.98, 0.12);
        if (!gone) b.lathe(0, 0, colProf, 8, Math.PI / 8, false);
        else if (edge) { const h = 3.0 + rng() * 1.1; b.lathe(0, 0, [[0.9, 0.03], [0.9, 0.5], [0.62, 0.72], [0.57, h - 0.6], [0.6, h - 0.25], [0.42, h], [0.16, h + 0.35]], 8, 0, true); }   // the break's two ends stand as tall stumps
        else if (rng() < 0.75) { const h = 0.7 + rng() * 1.5; b.lathe(0, 0, [[0.9, 0.03], [0.9, 0.5], [0.62, 0.72], [0.58, h], [0.3, h + 0.15]], 8, 0, true); }
      }
    }
    await pause();
    for (let x = sd.a + 0.2; x < sd.c - 1; x += 11.2) {
      const xe = Math.min(x + 11.2, sd.c + 0.4);
      if (inGap(sd, x + 2, 0) || inGap(sd, xe - 2, 0)) continue;
      A(); b.m = M_CARVED; jit(b, rng, 0.96, 0.1);
      const sag = rng() < 0.2 ? -0.12 - 0.15 * rng() : 0;
      b.box(x + 0.04, 5.2 + sag, -7.0, xe - 0.04, 5.75 + sag, -0.8, 0.0, false);
      jit(b, rng, 1.06, 0.06);
      b.box(x, 5.75 + sag, -7.25, xe, 6.0 + sag, -0.55, 0.05, false);
    }
    await pause();
    // sculpture fragments on plinths between the rows
    for (let x = sd.a + 5.6 * 2; x < sd.c - 8; x += 5.6 * (2 + rng.int(0, 2))) {
      if (inGap(sd, x, 3)) continue;
      A(); b.at(b.ox + (x * b.cs - 3.9 * b.sn), 0.03, b.oz + (-x * b.sn - 3.9 * b.cs), sd.rot + (rng() - 0.5) * 0.5);
      b.m = M_CARVED; jit(b, rng, 0.95, 0.1);
      b.box(-0.8, 0, -0.6, 0.8, 0.9, 0.6, 0.06); b.oy += 0.9;
      fragment(b, rng, rng.int(0, 2));
    }
    // the fallen bay: drums, tilted roof slabs, a torso on its plinth either side
    if (sd.gap) {
      const mid = (sd.gap[0] + sd.gap[1]) / 2;
      for (let i = 0; i < 26; i++) {
        const x = mid + (rng() - 0.5) * 17, z = -0.6 - rng() * 8.5, big = rng() < 0.3;
        A(); b.at(b.ox + (x * b.cs + z * b.sn), 0.03, b.oz + (-x * b.sn + z * b.cs), rng() * 6.3);
        b.m = M_CARVED; jit(b, rng, 0.95, 0.16);
        if (big) { const L = 1.5 + rng() * 2.2; b.box(-L, 0, -0.9, L, 0.35 + rng() * 0.3, 0.9, 0.05); }
        else if (rng() < 0.5) b.lathe(0, 0, [[0.6, 0], [0.62, 0.5 + rng() * 0.7]], 8, 0, true);
        else { const s = 0.3 + rng() * 0.5; b.box(-s, 0, -s * 0.7, s, s * 0.9, s * 0.7, 0.05); }
      }
      for (const dx of [-7.4, 7.4]) {
        A(); b.at(b.ox + ((mid + dx) * b.cs - 2.4 * b.sn), 0.03, b.oz + (-(mid + dx) * b.sn - 2.4 * b.cs), sd.rot + Math.PI + (rng() - 0.5) * 0.4);
        b.m = M_CARVED; jit(b, rng, 0.98, 0.06);
        b.box(-0.9, 0, -0.7, 0.9, 1.1, 0.7, 0.08); b.oy += 1.1;
        b.lathe(0, 0, [[0.48, 0], [0.56, 0.35], [0.38, 0.85], [0.5, 1.35], [0.6, 1.7], [0.42, 1.95], [0.18, 2.05], [0.15, 2.2]], 7, 0, true, 0.7);
      }
    }
    await pause();
  }
  // a kiosk on each northern corner of the gallery roof, for the skyline
  // (the north-east one has given its corner to the tower: it is still drawn, into a scrap builder, so the random draws are as they were)
  for (const sx of [1, -1]) kiosk(sx > 0 ? makeBuilder() : b, rng, sx * (RIM + 3.9), 6.0, -RIM - 3.9, 1.35, null);
  b.home();
  await pause();
  cornerTower(b, o.xr, o, o.lamps);
  landingShrine(b, o.xr, 0, -40, -44 + 0.15 + 1.9 * 1.3, 0, 1.3, o, o.lamps);              // north wall, eighth landing: in the middle of the image
  landingShrine(b, o.xr, 14, -20, -56 + 0.15 + 1.9 * 1.3, 0, 1.3, o, o.lamps);             // north wall, fourth landing: under the tip
  landingShrine(b, o.xr, 65 - 0.15 - 1.9 * 1.3, -5, -18, -Math.PI / 2, 1.3, o, o.lamps);   // east wall, first landing: its dome stands up past the rim; passed on the way down
  landingShrine(b, o.xr, 44 - 0.15 - 1.9 * 1.3, -40, 3, -Math.PI / 2, 1.3, o, o.lamps);    // east wall, eighth landing: the image's right-hand light
  await pause();
  // earth apron round the pit (and over the buried hall on the south side)
  if (o.apron > RIM + 8) {
    const Ap = o.apron, e = o.earth;
    b.m = M_EARTH; b.tint(e[0], e[1], e[2]);
    const y = 0.0;
    b.quad([-Ap, y, -Ap], [Ap, y, -Ap], [Ap, y, -RIM], [-Ap, y, -RIM]);
    b.quad([-Ap, y, PAV_Z + 0.6], [Ap, y, PAV_Z + 0.6], [Ap, y, Ap], [-Ap, y, Ap]);
    b.quad([-Ap, y, -RIM], [-RIM, y, -RIM], [-RIM, y, PAV_Z + 0.6], [-Ap, y, PAV_Z + 0.6]);
    b.quad([RIM, y, -RIM], [Ap, y, -RIM], [Ap, y, PAV_Z + 0.6], [RIM, y, PAV_Z + 0.6]);
  }
}

// ---------- falling water that stands off the stone: ledge curtains, eave beads, mist, spout plumes ----------
const FX_LIGHT = /* glsl */`
vec3 waterLight(vec3 p){
  float ao = mix(0.55, 1., smoothstep(-72., 4., p.y));
  return uSunCol*uSunI*sunVis(p)*0.5 + uFill*ao*1.05;
}`;

function makeCurtains(U, list) {
  const g = new THREE.InstancedBufferGeometry();
  const segs = 6, pos = [], idx = [];
  for (let i = 0; i <= segs; i++) { pos.push(-0.5, -i / segs, 0, 0.5, -i / segs, 0); }
  for (let i = 0; i < segs; i++) { const a = i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const A = new Float32Array(list.length * 4), B = new Float32Array(list.length * 4);
  list.forEach((c, i) => { A.set([c.x, c.y, c.z, c.rot], i * 4); B.set([c.w, c.h, c.kind, c.seed], i * 4); });
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4));
  g.instanceCount = list.length;
  const mat = new THREE.ShaderMaterial({
    uniforms: fogUniforms(U), fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 iA, iB; uniform float uTime;
      varying vec3 vP; varying vec4 vQ;
      #include <fog_pars_vertex>
      void main(){
        float t = -position.y, kind = iB.z;
        float sway = sin(uTime*1.7 + iB.w*40. + t*2.)*0.12*t;
        vec3 l = vec3(position.x*iB.x, -t*iB.y, (0.28 + 1.05*t*t)*(kind < 0.5 ? 1. : 0.5) + sway);
        float c = cos(iA.w), s = sin(iA.w);
        vP = iA.xyz + vec3(l.x*c + l.z*s, l.y, -l.x*s + l.z*c);
        vQ = vec4(position.x, t, kind, iB.w);
        vec4 mvPosition = modelViewMatrix*vec4(vP, 1.);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vP; varying vec4 vQ;
      #include <fog_pars_fragment>
      ${GLSL_COMMON}
      ${FX_LIGHT}
      void main(){
        float kind = vQ.z, s = vQ.x * (kind < 0.5 ? 12. : 50.) + vQ.w*31.;
        float a, on, bright = 1.;
        if (kind < 0.5) {
          float st = vn(vec2(s*2.6, vP.y*0.5 + uTime*3.9))*0.6 + vn(vec2(s*8., vP.y*1.6 + uTime*6.5))*0.4 + (vn(vec2(s*0.7, vQ.w*9.))-0.5)*0.35;
          // each ledge sheds a few separate falls with dark stone between them, not one pale sheet
          float strm = smoothstep(0.4, 0.6, vn(vec2(s*0.8, vQ.w*9.))*0.75 + vn(vec2(s*2.7, vQ.w*5. + vP.y*0.12 + uTime*0.5))*0.25 + 0.06);
          float thr = vn(vec2(s*7., vP.y*0.3 + uTime*5.2)), thr2 = vn(vec2(s*19., vP.y*0.45 + uTime*8.3));
          a = smoothstep(0.42, 0.95, st) * strm * (0.07 + 0.55*thr*thr + 0.22*thr2*thr2);      // falling threads, not a sheet
          float dC = length(uCam - vP);
          float beads = smoothstep(0.74, 0.98, vn(vec2(s*15., vP.y*0.18 + uTime*7.))) * strm;
          a += 0.34*beads * (1. - smoothstep(34., 70., dC));                      // bright beads racing down (too fine to draw far off)
          float foam = smoothstep(0.55, 0.95, vQ.y) * strm * smoothstep(0.3, 0.75, vn(vec2(s*2.1, uTime*2.3 + vQ.w*5.))*0.6 + vn(vec2(s*6.3, vP.y*2. + uTime*4.))*0.4);
          a += 0.3*foam;                                                          // where a fall lands it boils white
          bright = 0.72 + 0.5*thr2 + 0.85*beads + 0.45*foam;
          float fy = frontY() + (vn(vec2(s*0.6, 3.))-0.5)*1.5;
          on = smoothstep(fy-0.3, fy+0.5, vP.y);
          float sideN = abs(vQ.x) + (vn(vec2(vP.y*0.8 + uTime*2.6, vQ.w*23.)) - 0.5)*0.2 + (vn(vec2(vP.y*3.1 + uTime*5., vQ.w*7.)) - 0.5)*0.07;
          float footN = vQ.y + (vn(vec2(s*1.1, uTime*1.3 + vQ.w*5.)) - 0.5)*0.5 + (vn(vec2(s*4.7, uTime*3.1)) - 0.5)*0.16;
          a *= smoothstep(0.5, 0.3, sideN) * smoothstep(0., 0.06, vQ.y) * (1. - 0.35*vQ.y) * smoothstep(1.08, 0.74, footN);
          a *= smoothstep(6., 15., dC);             // up close a sheet of quads reads as a pane of glass: the wall's own threads carry it there
          on *= smoothstep(-0.25, 0.75, (vP.y - fy)/4.7 - vQ.y*0.6 + 0.35);   // a new curtain lets down from its ledge, it does not switch on whole
        } else {                                                 // eave beads: thin broken threads
          float th = vn(vec2(s*7.5, 1.7)); float bead = vn(vec2(s*7.5, vP.y*1.1 + uTime*7.));
          a = smoothstep(0.66, 0.8, th) * smoothstep(0.35, 0.7, bead) * 0.42 * (1.-vQ.y) * (1.-vQ.y);
          on = smoothstep(0.5, 0.62, uU);
        }
        a *= on * smoothstep(uPoolY, uPoolY + 0.6, vP.y);
        if (a < 0.01) discard;
        gl_FragColor = vec4(vec3(0.9,0.93,0.95)*waterLight(vP)*bright, min(a, 0.9));
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return mesh;
}

function makeMist(U, list) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const A = new Float32Array(list.length * 4), B = new Float32Array(list.length * 4);
  list.forEach((c, i) => { A.set([c.x, c.y, c.z, c.size], i * 4); B.set([c.seed, c.kind, c.y, 0], i * 4); });
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4));
  g.instanceCount = list.length;
  const mat = new THREE.ShaderMaterial({
    uniforms: fogUniforms(U), fog: true, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec4 iA, iB;
      varying vec2 vUv; varying vec3 vC; varying vec2 vA;
      #include <fog_pars_vertex>
      ${GLSL_COMMON}
      void main(){
        float seed = iB.x, kind = iB.y;
        float ph = fract(uTime*(0.22 + 0.16*seed) + seed*7.);
        vec3 c = iA.xyz;
        float on = kind < 0.5 ? smoothstep(0.5, 3., c.y - frontY()) * step(uPoolY + 0.2, c.y + 1.5)
                              : smoothstep(0.53, 0.6, uU);
        if (kind > 0.5) c.y = max(c.y, uPoolY) + 0.6;
        c.y += ph*iA.w*0.55; c.x += sin(seed*40. + uTime*0.6)*0.6;
        float sz = iA.w*(0.55 + 0.75*ph);
        vec4 mvPosition = modelViewMatrix*vec4(c, 1.);
        mvPosition.xy += position.xy*sz;
        vUv = position.xy; vC = c; vA = vec2(sin(ph*3.14159)*on, seed);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec3 vC; varying vec2 vA;
      #include <fog_pars_fragment>
      ${GLSL_COMMON}
      ${FX_LIGHT}
      void main(){
        float d = length(vUv);
        float n = vn(vUv*2.2 + vA.y*17. + uTime*0.35);
        float a = smoothstep(1., 0.0, d + (n-0.5)*0.55); a = a*a * vA.x * 0.26;
        if (a < 0.008) discard;
        gl_FragColor = vec4(vec3(0.88,0.91,0.94)*waterLight(vC), a);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 5;
  return mesh;
}

// two parabolic plumes as camera-facing ribbons (a bright core and a wide spray envelope each)
function makePlumes(U, spouts, v0) {
  const segs = 28, T = Math.sqrt((spouts[0].y + DEPTH) / 4.9), pos = [], tan = [], prm = [], idx = [];
  let base = 0;
  for (const sp of spouts) for (const layer of [0, 1]) {
    for (let i = 0; i <= segs; i++) {
      const t = (i / segs) * T, p = [sp.x, sp.y - 4.9 * t * t, sp.z - v0 * t], tg = [0, -9.8 * t, -v0];
      for (const side of [-1, 1]) { pos.push(p[0], p[1], p[2]); tan.push(tg[0], tg[1], tg[2]); prm.push(side, t / T, layer, sp.seed); }
    }
    for (let i = 0; i < segs; i++) { const a = base + i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    base += (segs + 1) * 2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(tan, 3));
  g.setAttribute('aP', new THREE.Float32BufferAttribute(prm, 4)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: fogUniforms(U), fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aT; attribute vec4 aP; uniform vec3 uCam;
      varying vec3 vP; varying vec4 vQ;
      #include <fog_pars_vertex>
      void main(){
        vec3 tg = normalize(aT), toC = uCam - position;
        vec3 sd = cross(tg, toC); sd = sd / max(length(sd), 1e-4);
        float w = mix(0.38, 1.7, aP.y) * (aP.z < 0.5 ? 1. : 2.8);
        vP = position + sd*aP.x*w; vQ = aP;
        vec4 mvPosition = modelViewMatrix*vec4(vP, 1.);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vP; varying vec4 vQ;
      #include <fog_pars_fragment>
      ${GLSL_COMMON}
      ${FX_LIGHT}
      void main(){
        float along = vQ.y*26., x = vQ.x;
        float st = vn(vec2(x*3.5 + vQ.w*9., along*0.6 - uTime*3.4))*0.55 + vn(vec2(x*9., along*1.5 - uTime*6.))*0.45;
        float core = smoothstep(1., 0.25, abs(x));
        float a = vQ.z < 0.5 ? core*smoothstep(0.3, 0.7, st + 0.3*(1.-vQ.y)*(1.-vQ.y))*0.92
                             : core*core*smoothstep(0.45, 0.9, st)*0.3*smoothstep(0.05, 0.4, vQ.y);
        float head = clamp((uU-0.50)/0.045, 0., 1.)*1.05;
        a *= smoothstep(head, head-0.05, vQ.y) * step(0.501, uU) * smoothstep(uPoolY-0.3, uPoolY+0.8, vP.y);
        if (a < 0.01) discard;
        gl_FragColor = vec4(vec3(0.92,0.95,0.97)*waterLight(vP)*1.1, a);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4;
  return mesh;
}

// ---------- the pool ----------
const dishY = (x, z) => -65.4 + 1.9 * smoothstep(7, 27, Math.max(Math.abs(x), Math.abs(z - 6) * 0.82));

function makePool(U) {
  const g = new THREE.BufferGeometry(), H = 36, zN = -36, zS = PAV_Z - 0.4, zH = PAV_Z + 16;
  g.setAttribute('position', new THREE.Float32BufferAttribute([-H, 0, zN, H, 0, zN, H, 0, zS, -H, 0, zS, -8.3, 0, zS, 8.3, 0, zS, 8.3, 0, zH, -8.3, 0, zH], 3));
  g.setIndex([0, 2, 1, 0, 3, 2, 4, 6, 5, 4, 7, 6]);
  const mat = new THREE.ShaderMaterial({
    uniforms: fogUniforms(U), fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      uniform float uPoolY; varying vec3 vP;
      #include <fog_pars_vertex>
      void main(){
        vP = vec3(position.x, uPoolY, position.z);
        vec4 mvPosition = modelViewMatrix*vec4(vP, 1.);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uDry, uPool, uGarland, uPortalCol, uImp; uniform float uPortalI, uFest, uSeed, uLamp, uDiya, uCool;
      varying vec3 vP;
      #include <fog_pars_fragment>
      ${GLSL_COMMON}
      float dishY(vec2 p){ return -65.4 + 1.9*smoothstep(7., 27., max(abs(p.x), abs(p.y-6.)*0.82)); }
      float hgt(vec2 p, float churn){
        float t = uTime;
        return (vn(p*0.45 + t*vec2(0.25,0.17))*0.6 + vn(p*1.6 - t*vec2(0.5,0.35))*0.3 + vn(p*4.3 + t*1.1)*0.1) * (0.1 + 0.9*churn);
      }
      float swell(vec2 p){ return vn(p*0.2 + uTime*vec2(0.1, 0.07))*0.7 + vn(p*0.62 - uTime*vec2(0.27, 0.2))*0.3; }
      // what the water mirrors, traced: a ray off the surface meets one of the three stair walls (stepping in 3 m a tier, so a plane at
      // 59 degrees), the pavilion's face, or leaves by the well's mouth. The wall is redrawn there by the stone shader's own rules: tier
      // ledges, the diamond net of flights, the niches and their lamps, the cascades above the front, the pavilion's bays and the portal
      vec3 mirrored(vec3 o, vec3 R){
        float hw0 = 26. + 0.6*(o.y + 65.);
        float dW = R.x + 0.6*R.y, dE = R.x - 0.6*R.y, dN = R.z + 0.6*R.y;
        float tW = dW < -1e-3 ? -(hw0 + o.x)/dW : 1e5;
        float tE = dE > 1e-3 ? (hw0 - o.x)/dE : 1e5;
        float tN = dN < -1e-3 ? -(hw0 + o.z)/dN : 1e5;
        float tS = R.z > 1e-3 ? (38. - o.z)/R.z : 1e5;
        float t = max(min(min(tW, tE), min(tN, tS)), 0.);
        vec3 h = o + R*t;
        float above = smoothstep(-0.8, 0.8, h.y);
        h.y = min(h.y, -0.05);
        float ao = mix(0.66, 1., smoothstep(-72., 4., h.y));
        float wetK = smoothstep(0.38, 0.47, uU);
        vec3 wfill = mix(uBounce, uFill, 0.8); wfill = mix(wfill, vec3(dot(wfill, vec3(0.333))), 0.45);
        vec3 col;
        if (tS <= t) {
          float ax = abs(h.x), sy = h.y + 65., stF = floor(sy/13.), gh = sy - stF*13.;
          vec3 alb = uDry*0.7*(0.85 + 0.3*vn(vec2(h.x*0.3, h.y*0.3))) * mix(1., 0.78, wetK);
          float litK = max(-uSunDir.z, 0.)*sunVis(h - vec3(0., 0., 0.4));
          float open = 0., lampP = 0.;
          if (ax < 26.6) {
            float bi = ax < 2.5 ? -2. : (ax < 7.5 ? -1. : floor((ax - 7.5)/4.625));
            float bc = ax < 2.5 ? 0. : (ax < 7.5 ? 5. : 7.5 + 4.625*(bi + 0.5));
            float q = (ax - bc)/(ax < 7.5 ? 2.5 : 2.3125);
            open = step(abs(q), 0.8)*step(1.5, gh)*step(gh, 7.2 + 2.6*sqrt(max(1. - q*q, 0.)));
            if (ax < 8.9 && stF < 1.5) open = 0.;
            float id = (bi + 3.)*(ax < 2.5 ? 1. : (h.x < 0. ? -1. : 1.));
            float k = mod(id*7. + stF*13. + id*stF*3. + 120., 5.);
            float lit = k < 0.5 ? 1. : ((k > 1.5 && k < 2.5) ? 0.45 : 0.);
            if (abs(abs(id) - 3.) < 0.5 && abs(stF - 1.) < 0.5) lit = 1.;
            lampP = lit*exp(-((ax - bc)*(ax - bc) + (gh - 2.6)*(gh - 2.6))/3.2);
            alb *= 1. - 0.45*smoothstep(10.1, 10.7, gh)*(1. - smoothstep(11.5, 12., gh));
          }
          float archTop = -47.2 + 6.2*sqrt(max(1. - ax*ax/56.25, 0.));
          float arch = step(ax, 7.5)*step(-58., h.y)*step(h.y, archTop);
          vec3 hemi = mix(uBounce, uFill, 0.65)*ao*(1. - 0.55*litK);
          vec3 albS = mix(alb, vec3(dot(alb, vec3(0.3, 0.5, 0.2))), 0.8*uCool*(1. - litK));
          col = alb*uSunCol*uSunI*litK + albS*hemi;
          col = mix(col, vec3(0.012, 0.01, 0.014), max(open, arch));
          col += uLamp*vec3(1.5, 0.62, 0.16)*open*lampP*0.7;
          vec2 pd = vec2(h.x, h.y + 48.);
          col += uPortalCol*uPortalI*arch*(exp(-dot(pd, pd)/26.)*1.5 + 0.1);
        } else {
          bool north = tN <= t, east = tE <= t;
          vec3 wn = north ? vec3(0., 0., 1.) : vec3(east ? -1. : 1., 0., 0.);
          float s = north ? h.x : h.z;
          float tierF = -h.y/5., tier = floor(tierF), yy = fract(tierF), hl = 5.*(1. - yy), odd = mod(tier, 2.);
          float along = (north ? h.x/14. + 0.5 : (38. - h.z)/14.) + odd*0.5 + 0.5;
          float d = (fract(along) - 0.5)*14., cell = floor(along);
          float pick = step(mod(cell + tier*2. + (north ? 0. : (east ? -1. : 2.)), 3.), 0.5);
          float edgeH = abs(d)*0.7143;                                   // a flight pair below this height, the wall and its niche above
          float fl = smoothstep(-0.15, 0.15, edgeH - hl);
          float line = smoothstep(0.5, 0., abs(edgeH - hl)) + 0.7*smoothstep(0.35, 0., hl) + 0.5*smoothstep(4.6, 5., hl);
          float inside = step(abs(d), 0.95)*step(1.7, hl)*step(hl, 3.4 + sqrt(max(0.9 - d*d, 0.))*1.05)*pick;
          vec3 alb = uDry*(0.6 + 0.2*fl)*(0.85 + 0.3*vn(vec2(s*0.3, h.y*0.3)));
          alb *= (1. + 0.4*line) * mix(1., 0.75, wetK);
          alb = mix(alb, vec3(0.02, 0.016, 0.02), inside);
          float vis = sunVis(h + wn*0.4), litK = max(dot(wn, uSunDir), 0.)*vis;
          vec3 hemi = mix(uBounce, uFill, 0.65)*ao*(1. - 0.55*litK);
          vec3 albS = mix(alb, vec3(dot(alb, vec3(0.3, 0.5, 0.2))), 0.8*uCool*(1. - litK));
          col = alb*uSunCol*uSunI*litK + albS*hemi;
          float lampG = pick*exp(-(d*d*0.55 + (hl - 2.3)*(hl - 2.3))/3.4);
          col += uLamp*(alb*vec3(1.5, 0.66, 0.2)*lampG*1.1 + vec3(2.6, 1.15, 0.3)*1.7*pick*exp(-(d*d/0.55 + (hl - 2.2)*(hl - 2.2)/3.2)));   // (the flame is drawn out upright, as ripples draw a light toward the eye)
          float fy = frontY();
          float run = smoothstep(-0.3, 0.3, h.y - fy);
          float st = vn(vec2(s*0.5, h.y*0.15 + uTime*1.2));
          float wv = mix(0.08 + 0.34*smoothstep(0.45, 0.8, st), 0.5 + 0.3*st, fl)*run + 0.4*run*smoothstep(0.8, 0., abs(h.y - fy));
          vec3 wlight = uSunCol*uSunI*vis*0.5 + wfill*ao;
          vec3 wtint = mix(vec3(0.88, 0.92, 1.0), mix(vec3(1.0, 0.9, 0.7), uSunCol, 0.5), vis);
          col = mix(col, wtint*wlight*0.92, clamp(wv, 0., 1.));
        }
        return mix(col, skyRefl(R), above);
      }
      void main(){
        vec2 p = vP.xz; float t = uTime;
        float depth = uPoolY - dishY(p);
        float churn = smoothstep(0.46, 0.64, uU), rainAmt = smoothstep(0.36, 0.5, uU);
        float e = 0.35, h0 = hgt(p, churn);
        vec3 N = normalize(vec3(-(hgt(p+vec2(e,0.), churn)-h0)/e*1.1, 1., -(hgt(p+vec2(0.,e), churn)-h0)/e*1.1));
        // rain rings
        vec2 rc = p/2.1; vec2 ri = floor(rc); vec2 rf = fract(rc) - 0.5 - (vec2(h21(ri), h21(ri+5.))-0.5)*0.45;
        float rph = fract(t*(0.7 + 0.5*h21(ri+9.)) + h21(ri+2.)), rd = length(rf);
        float ring = smoothstep(0.075, 0., abs(rd - rph*0.46)) * (1.-rph) * rainAmt * step(0.45, h21(ri+floor(t*0.35+h21(ri))*1.3));
        N.xz += ring * rf / max(rd, 1e-3) * 0.55; N = normalize(N);
        vec3 Vv = uCam - vP; vec3 V = Vv / max(length(Vv), 1e-4);
        if (V.y < 0.) V.y = -V.y;
        vec3 R = reflect(-V, N); R.y = abs(R.y);
        float nv = clamp(dot(N, V), 0., 1.), f = 1.-nv, f2 = f*f, fres = 0.03 + 0.97*f2*f2*f;

        // body: still green -> churned jade, shallows show the floor, silt fans creep in from the wall feet
        float turb = vn(p*0.3 + t*0.11 + uSeed);
        vec3 body = mix(uPool*0.75, mix(uPool, vec3(0.2,0.44,0.36), 0.5)*0.82, churn*(0.35 + 0.65*turb));   // churned jade, deep enough to mirror what stands over it
        float hwP = uPoolY < -60. ? 29. : 32.;
        float dE = min(hwP - abs(p.x), p.y + hwP);
        float silt = smoothstep(11., 0., dE + (vn(p*0.33 - t*0.04)-0.5)*12.) * churn;
        float calm = 1. - smoothstep(0.42, 0.6, uU);                       // the still green coin before the rain churns it
        body *= 1. + 0.7*calm;
        silt = max(silt, smoothstep(0.9, 0.1, depth)*0.7*(1. - 0.8*calm));  // (the shallows stay dark wet amber until the cascades bring silt)
        body = mix(body, uDry*vec3(0.6,0.55,0.5), silt*0.8);
        body = mix(uDry*(0.32 + 0.06*calm), body, smoothstep(-0.05, 0.6, depth));
        // duckweed mat, torn apart as the rain hits
        float tear = smoothstep(0.38, 0.66, uU);
        float dwn = vn(p*0.21 + 3. + uSeed)*0.62 + vn(p*0.95 + uSeed)*0.38;
        float dw = smoothstep(0.36 + tear*0.5, 0.52 + tear*0.5, dwn + (vn(p*4.5 + t*0.15*tear)-0.5)*(0.1 + 0.5*tear));
        dw *= smoothstep(0.15, 0.5, depth);
        // foam: wall feet, under the plumes
        float imp = min(length(p - uImp.xy), length(p - vec2(-uImp.x, uImp.y)));
        float plOn = smoothstep(0.54, 0.6, uU);
        float foam = smoothstep(3.5, 0., dE) * churn * smoothstep(0.35, 0.75, vn(p*1.4 + t*vec2(0.5,0.3)));
        foam += smoothstep(7.5, 0.5, imp) * plOn * (0.55 + 0.45*sin(imp*2.6 - t*5.)) * smoothstep(0.25, 0.7, vn(p*1.1 - t*0.8) + 0.3);
        foam = clamp(foam, 0., 1.);

        vec3 wp = vec3(p.x, uPoolY, p.y);
        float vis = sunVis(wp), ao = mix(0.55, 1., smoothstep(-72., 4., uPoolY));
        vec3 Ld = uSunCol*uSunI*vis*max(dot(N, uSunDir), 0.) + uFill*ao*1.15;
        vec3 Lp = mix(Ld, vec3(dot(Ld, vec3(0.3, 0.5, 0.2))), 0.55*calm);   // still water keeps its own green under the blue skylight
        vec3 col = mix(body, mix(vec3(0.13,0.25,0.07), vec3(0.14,0.30,0.10), calm), dw) * Lp;
        col += skyRefl(vec3(R.x, abs(R.y), R.z)) * 0.12 * calm * (1. - dw) * smoothstep(0.1, 0.6, depth);
        // what the surface mirrors: the walls themselves, traced (their tiers, flights, lamps and cascades), the pavilion and the portal in
        // its arch, the sky by the well's mouth. The ripples are flattened for the mirror ray, so the picture wavers and does not shatter
        float cas = smoothstep(0.47, 0.83, uU);
        float mk = 0.075*(0.3 + 0.7*churn), me = 0.8, m0 = swell(p);
        vec3 Nr = normalize(vec3(-(swell(p + vec2(me, 0.)) - m0)/me*mk, 1., -(swell(p + vec2(0., me)) - m0)/me*mk));   // the long swell only: the chop and the rain rings would shatter the picture
        vec3 Rr = reflect(-V, Nr); Rr.y = max(abs(Rr.y), 0.02);
        vec3 refl = mirrored(vP, normalize(Rr));
        float mir = mix(0.42, 0.04, calm);
        col = mix(col, refl, (mir + (1. - mir)*f2*f)*(1. - dw*0.85)*(1. - silt*0.45));
        float rl = max(dot(R, uSunDir), 0.); float sp = rl*rl; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
        col += uSunCol*uSunI*sp*sp*vis*3.;
        col += ring * skyRefl(R) * 0.35;
        col = mix(col, vec3(0.85,0.9,0.86)*(uSunCol*uSunI*vis*0.5 + uFill*ao*1.3), foam*0.8);
        // the portal's light lying on the water from the arch, wavering
        float sx = p.x + (vn(vec2(p.y*0.25, t*0.5))-0.5)*3.0 + N.x*6.;
        float w = 3.2 + (38.-p.y)*0.07;
        float streak = exp(-sx*sx/(w*w)) * smoothstep(-40., 28., p.y) * (0.55 + 0.45*vn(vec2(p.y*1.1 - t*1.4, 2.)));
        col += uPortalCol*uPortalI*streak*(1.-dw*0.6)*0.6*(1. - 0.45*calm);
        // marigold garlands and leaf cups circling in the eddy at the arch
        vec2 q = p - uImp.z*vec2(0., 1.); float r = length(q);
        float ang = atan(q.y, q.x + 1e-4) + t*0.45/(0.5 + r*0.22);
        vec2 gc = vec2(r/1.5, ang/6.2832*6.); vec2 gi = floor(gc); vec2 gf = (fract(gc)-0.5)*vec2(1.5, max(r, 0.5)*6.2832/6.);
        float pick = step(0.45, h21(gi + uSeed)) * step(1., gi.x) * step(gi.x, 5.) * uFest;
        float gd = length(gf);
        float gar = smoothstep(0.13, 0.04, abs(gd - 0.38)) * pick;
        col = mix(col, uGarland*(Ld*0.9 + 0.15), gar*smoothstep(0.2, 0.6, depth));
        // leaf-cup lamps set afloat, and marigold heads with them: a loose raft on the still coin that the rain scatters; some go out
        vec2 dp = p - vec2(0., 6.) - vec2(sin(t*0.11), cos(t*0.09))*0.8*(1. + 2.*churn);
        dp = vec2(dp.x*0.825 - dp.y*0.565, dp.x*0.565 + dp.y*0.825);        // (the scatter's grain lies askew to the pool's edges)
        float spreadK = 1. + 0.55*churn, cellD = 2.0*spreadK;
        vec2 dc = dp/cellD; vec2 di = floor(dc);
        float dh = h21(di + uSeed + 17.), dh2 = h21(di + 31.7);
        vec2 dj = (vec2(h21(di + 3.3), h21(di + 9.1)) - 0.5)*0.4 + 0.04*vec2(sin(t*0.7 + dh*40.), cos(t*0.6 + dh2*40.));
        vec2 df = (fract(dc) - 0.5 - dj)*cellD; float dd = length(df);
        float inRaft = 1. - smoothstep(8., 14., length(di)*2.0 + dh2*4.);
        float clump = 0.14 + 0.5*vn(di*0.45 + uSeed);                           // they drift in knots, with open water between
        float isLamp = step(dh, clump*(0.6 + 0.4*uDiya)) * inRaft * step(dh2*0.9, 1.05 - 0.5*cas);     // (cas: some are swamped as the cascades arrive)
        float isBloom = step(0.62, dh) * inRaft * (0.4 + 0.6*uFest);
        float deep = smoothstep(0.1, 0.45, depth);
        float cup = (1. - smoothstep(0.17, 0.25, dd)) * isLamp * deep;
        col = mix(col, vec3(0.05, 0.075, 0.03)*(Ld + 0.1), cup);
        float petal = (1. - smoothstep(0.26, 0.36, dd + 0.07*sin(atan(df.y, df.x + 1e-4)*7. + dh*30.))) * isBloom * deep;
        col = mix(col, uGarland*(Ld*0.95 + 0.2), petal);
        float flk = 0.8 + 0.2*sin(t*9. + dh*50.)*sin(t*13.7 + dh2*50.);
        vec3 flame = vec3(3.2, 1.4, 0.34) * flk * isLamp * deep * (0.6 + 0.4*uLamp);
        col += flame * ((1. - smoothstep(0.04, 0.11, dd))*2.2 + exp(-dd*dd/0.13)*0.7*(1. - smoothstep(0.4, 0.6, dd)));
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return mesh;
}

// ---------- assembly ----------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE).map((h) => new THREE.Color(h));
  const white = new THREE.Color(1, 1, 1);
  // per-seed character
  const warmth = rng.range(-1, 1);                                   // pinker or yellower stone
  const dry = pal[0].clone().lerp(new THREE.Color(warmth > 0 ? '#E09A62' : '#D8B26A'), Math.abs(warmth) * 0.35);
  const festival = opts.festival ?? rng.chance(0.65);
  const o = {
    festival, bangla: rng.chance(0.4), kiosks: rng.pick([5, 7, 7, 9]), gapZ: 4, spoutX: 12.5, spoutY: -24.5,
    apron: opts.apron ?? 100,
    garland: pal[4].clone().lerp(new THREE.Color('#FF7A10'), 0.55).toArray(),
    garland2: rng.chance(0.5) ? [0.75, 0.06, 0.05] : pal[4].clone().toArray(),
    flag: rng.pick([[0.9, 0.3, 0.03], [0.75, 0.05, 0.06], [0.95, 0.55, 0.05]]),
    earth: pal[0].clone().lerp(pal[1], 0.45).multiplyScalar(0.8).toArray(),
  };
  { let sd = 7; for (const ch of String(ctx.seed ?? 1)) sd = (Math.imul(sd, 31) + ch.charCodeAt(0)) >>> 0; o.xr = miniRng(sd); o.lamps = []; }
  const damage = opts.damage ?? rng.range(0.015, 0.05);
  const sunDir = new THREE.Vector3(...(opts.sunDir || [-0.882, 0.407, -0.236])).normalize();
  const sunCol = new THREE.Color(opts.sunColor || '#FFD08A').lerp(white, 0.22);
  const fill = (opts.fillColor ? new THREE.Color(opts.fillColor) : pal[3].clone()).lerp(white, 0.18).multiplyScalar(2.2);
  const impZ = PAV_Z - 3.5 - 4.8 * Math.sqrt((o.spoutY + 60) / 4.9);

  const U = {
    uU: { value: opts.progress ?? 0.72 }, uTime: { value: 0 }, uPoolY: { value: -60 }, uSunI: { value: opts.sunIntensity ?? 1.75 },
    uSunDir: { value: sunDir }, uSunCol: { value: sunCol }, uFill: { value: fill },
    uBounce: { value: dry.clone().multiplyScalar(0.18).add(new THREE.Color(0.05, 0.05, 0.07)) },
    uSkyE: { value: pal[2].clone().lerp(pal[3], 0.25).multiplyScalar(2.6) }, uSkyW: { value: pal[6].clone().multiplyScalar(0.85) },
    uCam: { value: new THREE.Vector3(0, -20, 0) }, uShaft: { value: new THREE.Vector4(0, 0, 40, 0) }, uCloud: { value: new THREE.Vector4(40, 14, 0, 0) },
    uDry: { value: dry }, uWet: { value: pal[1].clone().lerp(new THREE.Color('#a07840'), 0.4) }, uGarland: { value: new THREE.Color().fromArray(o.garland) },
    uPool: { value: pal[5].clone().offsetHSL(rng.range(-0.03, 0.03), 0, 0) },
    uPortalCol: { value: pal[6].clone().lerp(white, 0.3) }, uPortalI: { value: opts.portalGlow ?? 1.0 },
    uMoss: { value: opts.moss ?? 0 }, uLamp: { value: 0 }, uCool: { value: opts.cool ?? 1 },
    uImp: { value: new THREE.Vector3(o.spoutX, impZ, PAV_Z - 8) }, uFest: { value: festival ? 1 : 0 }, uSeed: { value: rng.range(0, 50) }, uDiya: { value: festival ? 1 : 0.45 },
  };
  const object = new THREE.Group(); object.name = 'first-rain-stepwell-hero';
  const stoneMat = new THREE.ShaderMaterial({ uniforms: fogUniforms(U), vertexShader: STONE_VERT, fragmentShader: STONE_FRAG, fog: true, side: THREE.DoubleSide });

  // static stone: walls, ledges, floor, pavilion, rim
  const b = makeBuilder(), pause = () => ctx.yield?.();
  const { inst, rubble } = buildLattice(b, rng, damage);
  await pause();
  await buildPavilion(b, rng, o, pause);
  await pause();
  await buildRim(b, rng, o, pause);
  await ctx.yield?.();
  const stone = new THREE.Mesh(b.geometry(), stoneMat); stone.frustumCulled = false;
  object.add(stone);
  await ctx.yield?.();
  const flights = flightMesh(flightGeometry(rng), inst, stoneMat);
  object.add(flights);
  await ctx.yield?.();

  // curtains at every cell boundary (and where a flight has fallen), eave beads, mist at the landings
  const curtains = [], mist = [], p = new THREE.Vector3(), ROT = [0, -Math.PI / 2, Math.PI / 2];
  for (let k = 0; k < TIERS; k++) for (let wall = 0; wall < 3; wall++) {
    const cs = flightCentres(k, wall), seen = new Set();
    for (const c of cs) for (const s of [c - CELL / 2, c + CELL / 2]) {
      const key = Math.round(s * 10); if (seen.has(key)) continue; seen.add(key);
      const shr = SHRINES.some((q) => q[0] === k && q[1] === wall && Math.abs(q[2] - s) < 0.5);    // a shrine pavilion stands on this landing
      wallPoint(k, wall, s, 0, -TH * k - 0.3, p);
      const c0 = { x: p.x, y: p.y, z: p.z, rot: ROT[wall], w: 12.6, h: TH - 0.3, kind: 0, seed: rng() };
      wallPoint(k, wall, s, 1.5, -TH * (k + 1) + 0.6, p);
      const m0 = { x: p.x, y: p.y, z: p.z, size: rng.range(3.2, 5.6), seed: rng(), kind: 0 };
      const m1 = rng() < 0.4 ? { x: p.x, y: p.y + 0.5, z: p.z, size: rng.range(2.5, 4), seed: rng(), kind: 0 } : null;
      if (shr) continue;
      curtains.push(c0); mist.push(m0); if (m1) mist.push(m1);
    }
  }
  for (const r of rubble) {
    wallPoint(r.k, r.wall, r.c, 0, -TH * r.k - 0.3, p);
    curtains.push({ x: p.x, y: p.y, z: p.z, rot: ROT[r.wall], w: 13.5, h: TH - 0.3, kind: 0, seed: rng() });
  }
  for (let s = 0; s < 5; s++) {
    const y = -DEPTH + 13 * s + 10.6;
    if (s < 2) for (const sx of [1, -1]) curtains.push({ x: sx * 17.75, y, z: PAV_Z - 1.75, rot: Math.PI, w: 17.7, h: 7, kind: 1, seed: rng() });
    else curtains.push({ x: 0, y, z: PAV_Z - 1.75, rot: Math.PI, w: 53.8, h: 7, kind: 1, seed: rng() });
  }
  const spouts = [1, -1].map((sx) => ({ x: sx * o.spoutX, y: o.spoutY - 0.15, z: PAV_Z - 3.5, seed: rng() }));
  for (const sp of spouts) for (let i = 0; i < 8; i++) {
    mist.push({ x: sp.x + rng.range(-3, 3), y: -DEPTH, z: impZ + rng.range(-3.5, 3), size: rng.range(5, 9.5), seed: rng(), kind: 1 });
  }
  await ctx.yield?.();
  object.add(makePool(U), makeCurtains(U, curtains), makePlumes(U, spouts, 4.8), makeMist(U, mist));

  // ---------- hooks, anchors ----------
  const pool0 = opts.poolStart ?? -64.2;
  const poolLevel = (u) => lerp(pool0, -55.5, clamp((u - 0.47) / 0.5, 0, 1));
  const frontY = (u) => clamp(-((u - 0.44) / 0.03) * 5, -DEPTH, 0);
  let progress = U.uU.value;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z), tmp = new THREE.Vector3();
  const anchors = {
    portalSeat: { position: V3(0, -48, 46), facing: V3(0, 0, -1), radius: 7 },
    flyThrough: [[-94, 11, 19], [-63, 12, 4], [-30, 8, -22], [4, 3, -42], [36, -3, -43], [50, -8, -22], [48, -12, 4], [40, -16, 22], [18, -20, 28],
      [-10, -24, 28], [-29, -28, 17], [-34, -32, -2], [-33, -35, -18], [-27, -38, -29], [-16, -41, -31], [-5, -45, -28], [0, -47.6, -16], [0, -48, 4],
      [0, -48, 24], [0, -48, 46]].map((q) => V3(...q)),
    gap: { position: V3(-RIM, 0, o.gapZ), width: 18, facing: V3(1, 0, 0) },
    arch: { center: V3(0, -49.5, PAV_Z), width: 15, sill: -58, crown: -41 },
    spouts: spouts.map((s) => V3(s.x, s.y, s.z)),
    plumeImpacts: spouts.map((s) => V3(s.x, -60, impZ)),
    poolCenter: V3(0, -64.2, 6), eddy: V3(0, -60, PAV_Z - 8),
    lamps: o.lamps.map((q) => V3(q[0], q[1], q[2])),          // fire bowls of the corner tower and the landing shrines (for glow sprites)
    tower: V3(59, 8, -59),
    viewpoints: {
      tip: { position: V3(-63, 12, 4), target: V3(8, -50, 0) },
      eastWall: { position: V3(49, -12, 4), target: V3(10, -40, 36) },
      pavilionPass: { position: V3(4, -22, 28), target: V3(-14, -24, 38) },
      image: { position: V3(-31, -36, -22), target: V3(6, -44, -40) },
      finalRun: { position: V3(0, -48, 4), target: V3(0, -48, 46) },
    },
    // foot of a flight pair: where langurs, parakeets and frogs can sit. tier 0..12, wall 0 north, 1 east, 2 west
    ledges: (tier, wall) => flightCentres(tier, wall).map((c) => wallPoint(tier, wall, c + CELL / 2, 2.5, -TH * (tier + 1))),
    walls: { rim: RIM, stepIn: STEP_IN, tierHeight: TH, tiers: TIERS, pavilionZ: PAV_Z, flightDepth: FL_D },
  };
  const triangles = b.count() + inst.length * 204 + curtains.length * 12 + mist.length * 2 + 4 * 56 + 4;
  const hero = {
    object, radius: 9, height: 40, center: V3(0, -36, 2), anchors,
    extent: { half: Math.max(o.apron, RIM + 8), rim: RIM, depth: DEPTH, top: 13 },
    ground: false, groundY: 0, triangles,
    setProgress(u) { progress = clamp(u, 0, 1); },
    poolLevel, frontY,
    setSun(dir, color, intensity) {
      if (dir) U.uSunDir.value.copy(dir).normalize();
      if (color) U.uSunCol.value.set(color);
      if (intensity !== undefined) U.uSunI.value = intensity;
    },
    setSky(east, west, fillC) { if (east) U.uSkyE.value.set(east); if (west) U.uSkyW.value.set(west); if (fillC) U.uFill.value.set(fillC); },
    setLamps(v) { U.uLamp.value = v; },
    setShaft(x, z, radius, amount) { U.uShaft.value.set(x, z, radius, amount); },   // amount 0 = the whole sky's sun (default)
    setCloud(edgeX, amount, soft = 14) { U.uCloud.value.set(edgeX, soft, 0, amount); },   // a cloud's shadow over everything east of edgeX (amount 0 = none)
    setPortalGlow(color, intensity) { if (color) U.uPortalCol.value.set(color); if (intensity !== undefined) U.uPortalI.value = intensity; },
    uniforms: U,
    update(dt, time, camera) {
      U.uTime.value = time; U.uU.value = progress; U.uPoolY.value = poolLevel(progress);
      if (camera) { object.updateWorldMatrix(true, false); camera.getWorldPosition(tmp); U.uCam.value.copy(object.worldToLocal(tmp)); }
    },
    dispose() {},
  };
  hero.update(0, 0, null);
  return hero;
}
