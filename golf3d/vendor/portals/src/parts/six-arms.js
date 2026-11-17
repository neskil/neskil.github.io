// SIX ARMS: hero set piece for the world "six-arms".
//
// What it is
//   One stellar dendrite snowflake, 60 m tip to tip, that GROWS: a clear hexagonal plate (6 m) with a dark
//   dust nucleus and tree-ring growth rings; at 8 s (brief seconds) six arms punch out together, then a
//   burst every 1.3 s pushes all six spearhead tips forward and fires a mirrored pair of side branches at
//   exactly 60 degrees, which later sprout twigs. Every piece is a hard-edged prism with a raised ridge,
//   ribs, bevels and a faceted spearhead cap. Fresh ice is born frosted with a short flash and clears to
//   glass. Frozen-on rime beads appear on the top face (each with its own birth second).
//
// Local space
//   The crystal lies FLAT in the XZ plane, centred on the origin (y = 0 is its mid-plane, top face at
//   about y = +0.75 at the hub, +0.3 at the tips). Arm 0 runs along +Z (the "front"); the others follow
//   in 60 degree steps (arm k points at angle k*60 degrees from +Z toward +X). Tilt, spin, sink and the
//   opening tumble are the world's: move hero.object.
//
// Growth clock (never wall-clock in a world)
//   hero.setSeconds(s)   s = brief seconds (u * 56). 0-5 the plate widens in two bursts, 8.0 the arms punch
//                        out to r = 10 m, bursts at 9.3 + 1.3 k (k = 0..15), last burst lands at 29 s: r = 30.
//   hero.setProgress(u)  same thing, u = 0..1 over 56 s.
//   If neither is called, update() loops the growth on wall time and switches to the gold light after
//   41 s (viewer only).
//   hero.tipRadius(s)    radius of the six spine tips at second s (JS mirror of the shader).
//   hero.getTips(s, out) fills out[0..11] (Vector3, local): six spine tips, then the six tips of the newest
//                        right-hand branches: feed these to the droplet shader so globes shrink round them.
//   hero.burstTimes      seconds at which bursts fire (for sound or a camera nudge).
//
// Light and environment (the ice is unlit glass: it shows an analytic environment, no scene lights)
//   hero.setBelow(k)     0 = inside the cloud (pearl fog, cool key), 1 = below the base (gold key from the
//                        side, slate ceiling, dark sea, gold rims and fire in the bevels).
//   hero.setEnv({ fogHi, fogLo, keyDir, keyCol, goldDir, goldCol, sea, ceil })  colours (hex or Color) and
//                        WORLD-space unit directions toward the cloud key and the low sun.
//   hero.uniforms        the shared uniform objects (uSaT, uSaBelow, uSaFogHi, uSaHollow ...): put them in your own
//                        materials to keep them in sync. The ice is shaded as a clear pane: a flat top shows what
//                        lies straight behind it (fog, the bluer hollow, sea or sky), bevels and ridges bend that
//                        view, mirror the bright fog by Fresnel and carry bright hairlines; ribs are cobalt lines.
//                        THE CLOSE PASS (the hero only, within 10 m, fading out by 28 m: `cl` in ICE_FRAG): the
//                        material is drawn with the transparent things, depth written. In the cloud only the hub
//                        plate and the clear facets of a spine's spearhead are see-through there; every arm, branch
//                        and twig is a solid pane, so pieces standing behind one another never blend (below the
//                        base walls, bevels and a spine's top are a little see-through, as the sea shows in them).
//                        A top is a PALE, slightly blue pane (a tone lighter than the hollow under it, never blue
//                        steel) with only a breath of growth terraces and of the underside's pattern, frost patches
//                        (their fine grain fades before it can stipple) and COBALT hairlines, ribs and edge lines;
//                        only the facet that holds the key's reflection carries a white one. A SPINE's top also has
//                        bubbles at two depths (none on a face seen steeper than 70 degrees), the far wall seen from
//                        inside as a soft blue strip along its far edge (filtered by its footprint) and, toward
//                        grazing, a mirror that holds the billows; its walls are a deep tone of the hollow with a
//                        dark foot line, a top-edge line and a pale band of fog thrown up from the underside. A
//                        BRANCH or TWIG is plainer: one pale top (half the grazing mirror, no bubbles, no inner
//                        strip), walls of one mid-blue tone a little lighter toward the key (no band) with a dark
//                        foot, and a plain spearhead. Near the eye no wall or bevel mirrors more than a quarter of
//                        the fog, and the hard glint and the growth flash are damped within a few metres, so
//                        nothing under the lens blows out to a white wedge. A spine's spearhead is a cut gem (out
//                        to 16 m, gone by 30): six facets fanning to the point, one white, its neighbours cobalt or
//                        clear, the white one moving as the eye passes, and no grazing mirror over them.
//                        Under the lens the hub is a block of deep blue glass; its growth rings are thin pale lines
//                        (a ninth of their uneven spacing, box-filtered so they never swell into bands at a slant),
//                        like tree rings, round the nucleus: a rough brown-black dust grain with a lit side and one
//                        small highlight. An end plate (plate habit) is a dark hexagon with a pale rim and one inner
//                        hexagon line. Below the base: deep blue glass, a gold rim line and gold fire only on bevels
//                        turned to the sun. uSaOpen (0..1, the world's opening) makes the hub plate a bright clear
//                        pane hardly veiled by fog: six sector tones, three thin dark ring lines, a dark rim with a
//                        bright line inside it, blue walls. uSaClock (wall seconds; the world sets it, update() sets
//                        it in the viewer) drifts the mirror's billows and the wall bands.
//   hero.setHubBoost(b)  shows the hub plate b times wider (the world's opening: the plate larger than life).
//   hero.hubRadius(s)    corner radius of the hub plate at second s, before any boost.
//   Exports for the rest of the world: SIX_ARMS_ENV_GLSL (vec3 saEnv(vec3 dir)), makeIceMaterial(uniforms)
//   (the same glass for the companion crystals: needs the attributes listed at makeIceMaterial; give it
//   uSaRod: { value: 1 } for small companions: each blade is one thin clear pane. How it is drawn depends on how bright
//   the world straight behind it really is: against bright cloud a thin blade is a cobalt line and a wide pane a tone
//   deeper and bluer than the fog with broad dark edges and no sparks; against the dark of the hollow its edges are
//   the bright ones; one pale centre line on a wide blade, the cloud showing through its wide faces; level 3 faces
//   are small hub plates with rings and a dark rim, for a capped column),
//   makeSegmentGeometry(list) (or await makeSegmentGeometryAsync(ctx, list), which yields as it goes) to build
//   companion prisms with those attributes, and makeCrystal(ctx, rng, habit,
//   uniforms): a second finished star (another plan, same glass) as a Group, for a near neighbour.
//
// anchors (all local space)
//   hub          (0, 0.75, 0) top of the nucleus: gaze target.
//   skim         ordered eye points for the skim over the hub and out along arm 0 (+Z), 2 m above the top face.
//   skimArm      unit direction of arm 0. armDirs: the six unit directions.
//   notch        { position, normal (0,1,0), clear }: centre of the pruned gap between arm 0 and arm 1
//                (on the 30 degree bisector, 28 m out). Nothing of the crystal lies within `clear` (8.5 m)
//                of the line through it along Y.
//   flyThrough   ordered points straight through that notch along -Y (from 34 m above to 40 m below).
//   portalSeat   { position, normal, radius 7 }: 36 m beyond the notch on that line, facing back up it.
//   viewpoints   { reveal, above, skimStart, exitLook }.
//   tips         the six finished tip positions (r = 30).
//
// opts
//   palette   brief palette [fog pearl, hollow blue, cobalt, key white, nucleus, gold, sea]
//   habit     'fern' | 'sector' | 'plate' (default: by seed; fern is twice as likely)
//   rime      'clean' | 'heavy' (default by seed)       seconds: fixed growth second (stills)
//
// Size: radius 30.5, thickness 1.5 at the hub (returned height is a framing hint for the viewer, see
//   anchors.size for the true box).
// Cost: about 95-125k triangles by habit (arm about 14-18k drawn six times, hub 2k, rime up to 24k),
//   3 draw calls, no lights, no textures, build about 60-120 ms.
// Lighting it expects: none from the scene. Give it the fog colours and key direction of the world with
//   setEnv. Fog is the world's own two-layer model (SIX_ARMS_FOG_GLSL: uSaAtm, uSaHub, uSaAir, uSaFogMid in
//   hero.uniforms), not scene.fog; left at its defaults nothing is fogged.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#C4D6EC', '#7FA3CF', '#2F4A73', '#EFF8FF', '#17120E', '#F0B35A', '#0A1420'];
const T_PUNCH = 8.0, T_BURST0 = 9.3, BURST_DT = 1.3, N_BURST = 16, R_PUNCH = 10, R_TIP = 30, R_HUB = 3;
const TAN30 = Math.tan(Math.PI / 6), SIN60 = Math.sin(Math.PI / 3), COS60 = 0.5;

// ---------------------------------------------------------------- shared environment
export const SIX_ARMS_ENV_GLSL = /* glsl */`
uniform vec3 uSaFogHi, uSaFogLo, uSaKeyDir, uSaKeyCol, uSaGoldDir, uSaGoldCol, uSaSea, uSaCeil;
uniform float uSaBelow, uSaT;
vec3 saEnv(vec3 d){
  float up = d.y*0.5 + 0.5;
  float kd = max(dot(d, uSaKeyDir), 0.0);
  vec3 cloud = mix(uSaFogLo, uSaFogHi, smoothstep(0.08, 0.95, up));
  cloud += uSaKeyCol*(0.22*kd*kd + 0.30*kd*kd*kd*kd*kd*kd);
  float gd = max(dot(d, uSaGoldDir), 0.0);
  float band = exp(-abs(d.y - 0.07)*7.0);
  vec3 ceilc = uSaCeil*(0.55 + 0.25*sin(d.x*9.0 + d.z*7.0)) + uSaGoldCol*0.35*gd*gd;
  vec3 below = mix(uSaSea*1.6 + uSaGoldCol*0.10*gd*gd*smoothstep(-0.6, 0.0, d.y), ceilc, smoothstep(0.02, 0.30, d.y));
  below += uSaGoldCol*band*(0.45 + 1.1*gd*gd);
  below += uSaGoldCol*2.2*pow(max(gd, 0.0), 24.0);
  return mix(cloud, below, uSaBelow);
}
`;

// Fog shared by the hero and by everything else in the world (include after SIX_ARMS_ENV_GLSL). The air has two
// layers split at the cloud base uSaAtm.z: dense cloud above, clear hazy air below. Only the part of the view ray
// that runs inside the cloud is fogged with the cloud colour; the crystal's hollow and the tear it leaves in the
// base are clearer. With uSaAtm.x = uSaAtm.y = 0 (the set-piece viewer) nothing is fogged.
export const SIX_ARMS_FOG_GLSL = /* glsl */`
uniform vec4 uSaAtm;   // x fog density in the cloud, y haze density below it, z height of the cloud base, w radius of the tear in the base
uniform vec4 uSaHub;   // xyz crystal centre (world), w radius of the hollow it has eaten
uniform vec3 uSaAir, uSaFogMid;
vec3 saCloudCol(vec3 d){
  float kd = max(dot(d, uSaKeyDir), 0.0);
  vec3 c = mix(uSaFogLo, uSaFogMid, smoothstep(-0.8, 0.12, d.y));
  c = mix(c, uSaFogHi, smoothstep(0.0, 0.95, d.y)*0.75);
  return c + uSaKeyCol*(0.10*kd*kd + 0.16*kd*kd*kd*kd*kd*kd);
}
vec3 saAirCol(vec3 d){ return mix(uSaSea*2.2, uSaAir, smoothstep(-0.5, 0.03, d.y)); }
float saHole(vec2 p){ return 1.0 - smoothstep(uSaAtm.w*0.72, uSaAtm.w*1.08 + 0.01, length(p - uSaHub.xz)); }
// rgb: the fog colour for this point, a: how much of it lies over the point (0..1)
vec4 saFogCA(vec3 wpos){
  vec3 dv = wpos - cameraPosition; float dist = length(dv); vec3 d = dv/max(dist, 1e-4);
  float cy = cameraPosition.y - uSaAtm.z, wy = wpos.y - uSaAtm.z;
  float fr = clamp(max(cy, wy)/max(abs(cy - wy), 1e-3), 0.0, 1.0);
  float inH = (1.0 - smoothstep(uSaHub.w*0.8, uSaHub.w*1.3, length(wpos.xz - uSaHub.xz)))*smoothstep(-26.0, -9.0, wpos.y - uSaHub.y)*(1.0 - smoothstep(10.0, 24.0, wpos.y));
  float tb = clamp(cy/max(cy - wy, 1e-3), 0.0, 1.0);
  float thr = step(wy, 0.0)*step(0.0, cy)*saHole(cameraPosition.xz + dv.xz*tb);
  float lc = dist*fr*uSaAtm.x*mix(1.0, 0.40, max(inH, thr));
  float fc = 1.0 - exp(-lc*lc);
  float la = dist*(1.0 - fr)*uSaAtm.y;
  float fa = 1.0 - exp(-la*la);
  float a = 1.0 - (1.0 - fc)*(1.0 - fa);
  vec3 c = (saAirCol(d)*fa*(1.0 - fc) + saCloudCol(d)*fc)/max(a, 1e-4);
  return vec4(c, a);
}
vec3 saFog(vec3 col, vec3 wpos){ vec4 f = saFogCA(wpos); return mix(col, f.rgb, f.a); }
`;

export function makeEnvUniforms(palette = DEFAULT_PALETTE) {
  const c = (h) => new THREE.Color(h);
  return {
    uSaT: { value: 0 }, uSaBelow: { value: 0 }, uSaClock: { value: 0 },
    uSaFogHi: { value: c(palette[3]).multiplyScalar(0.80) },
    uSaFogLo: { value: c(palette[2]).multiplyScalar(0.85) },
    uSaKeyDir: { value: new THREE.Vector3(-0.55, 0.64, 0.5).normalize() },
    uSaKeyCol: { value: c(palette[3]) },
    uSaGoldDir: { value: new THREE.Vector3(0.9, 0.1, -0.35).normalize() },
    uSaGoldCol: { value: c(palette[5]) },
    uSaSea: { value: c(palette[6]) },
    uSaCeil: { value: c(palette[2]).multiplyScalar(0.55) },
    uSaPale: { value: c(palette[3]).multiplyScalar(0.78) },
    uSaMid: { value: c(palette[1]) },
    uSaCobalt: { value: c(palette[2]) },
    uSaOpen: { value: 0 },
    uSaDust: { value: c(palette[4]) }, uSaHollow: { value: c(palette[1]).multiplyScalar(0.42) },
    uSaAtm: { value: new THREE.Vector4(0, 0, -10, 0) }, uSaHub: { value: new THREE.Vector4(0, 0, 0, 42) },
    uSaAir: { value: c(palette[5]).lerp(c(palette[2]), 0.45) }, uSaFogMid: { value: c(palette[0]) },
  };
}

// ---------------------------------------------------------------- the ice
// Attributes the ice shader needs (makeSegmentGeometry writes them):
//   position  final (fully grown) position
//   aOrg      vec4: segment origin x, origin z, birth second, growth duration
//   aAx       vec4: unit axis x, axis z, seed 0..1, level (0 spine, 1 branch, 2 twig, 3 hub plate; the point vertex of
//             a spearhead carries level + 0.25, so the fraction says how far into the cap a fragment is)
//   aSeg      vec4: metres along the segment, across -1..1, half thickness here, half width here
//   aPl       vec3: for a segment that ends in a hexagonal plate: metres along from the plate's centre, half the
//             length of its straight sides, length of its point; (0, 0, 1) elsewhere
const ICE_VERT = /* glsl */`
attribute vec4 aOrg, aAx, aSeg;
attribute vec3 aPl;
uniform float uSaT;
varying vec3 vW, vL, vViewL, vUp, vPl;
varying vec2 vAxL;
varying vec4 vSeg, vInfo;
#include <common>
void main(){
  float age = uSaT - aOrg.z;
  float x = clamp(age/max(aOrg.w, 0.01), 0.0, 1.0);
  float g = 1.0 - (1.0 - x)*(1.0 - x)*(1.0 - x);
  float on = step(0.0005, g);
  vec2 ax = aAx.xy;
  vec2 rel = position.xz - aOrg.xy;
  float al = dot(rel, ax);
  vec2 ac = rel - ax*al;
  float wide = mix(0.35, 1.0, g)*on;
  vec3 p = position;
  if (aAx.w < 2.5) { p.xz = aOrg.xy + ax*al*g + ac*wide; p.y *= wide; }
  vL = p;
#ifdef USE_INSTANCING
  mat4 M = modelMatrix*instanceMatrix;
#else
  mat4 M = modelMatrix;
#endif
  vec4 w = M*vec4(p, 1.0);
  vW = w.xyz;
  mat3 R = mat3(normalize(M[0].xyz), normalize(M[1].xyz), normalize(M[2].xyz));
  vUp = R[1];
  vAxL = ax;
  vPl = aPl*g;
  vViewL = (w.xyz - cameraPosition)*R;
  vSeg = vec4(aSeg.x*g, aSeg.y, aSeg.z*wide, aSeg.w*wide);
  float fresh = on*(1.0 - smoothstep(0.0, 0.35, age - aOrg.w));
  vInfo = vec4(g, fresh, aAx.z, aAx.w);
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
}
`;

const ICE_FRAG = /* glsl */`
uniform vec3 uSaPale, uSaMid, uSaCobalt, uSaDust, uSaHollow;
uniform float uSaHubS, uSaRod, uSaOpen, uSaClock;
varying vec3 vW, vL, vViewL, vUp, vPl;
varying vec2 vAxL;
varying vec4 vSeg, vInfo;
#include <common>
${SIX_ARMS_ENV_GLSL}
${SIX_ARMS_FOG_GLSL}
float saHash(float n){ return fract(sin(n*91.345 + 1.7)*47453.5453); }
float saHash2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float saNoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(saHash2(i), saHash2(i + vec2(1.0, 0.0)), f.x), mix(saHash2(i + vec2(0.0, 1.0)), saHash2(i + vec2(1.0, 1.0)), f.x), f.y);
}
float saHex(vec2 p){ p = abs(p); return max(p.y*0.8660254 + p.x*0.5, p.x); }
float saLine(float v, float halfw, float fw){ return 1.0 - smoothstep(halfw, halfw + fw*1.5 + 1e-4, abs(v)); }
// lines drawn on a face: x = metres along, y = across in metres, hw = half width
float saTerrace = 0.0, saHair = 0.0, saWide = 1.0, saFloor = 0.25;
float saFaceLines(vec2 q, float hw, float seed, float lvl){
  float fwx = fwidth(q.x) + 1e-4, fwy = fwidth(q.y) + 1e-4;
  float chev = q.x - abs(q.y)*0.5774;
  float sp = min(max(lvl < 0.5 ? 0.8 : 0.55, hw*0.75), 1.0);
  saWide = clamp((hw/fwy - 2.5)/3.5, 0.0, 1.0);   // 0 where the face is only a few pixels across
  float c = chev/sp + seed*7.0;
  float fwc = fwidth(c) + 1e-4;
  float k = abs(fract(c) - 0.5);
  float gl = (1.0 - smoothstep(0.02, 0.02 + min(fwc, 0.06)*1.5, k))*clamp(0.12/fwc, 0.0, 1.0)*0.7;
  saTerrace = fract(c + 0.5)*clamp(0.35/fwc, 0.0, 1.0);
  float c2 = c*3.0 + 0.3;
  float fwc2 = fwc*3.0;
  float gl2 = (1.0 - smoothstep(0.05, 0.05 + min(fwc2, 0.06)*1.5, abs(fract(c2) - 0.5)))*clamp(0.12/fwc2, 0.0, 1.0)*0.35;
  float eg = lvl < 0.5 ? 0.86 : (lvl < 1.5 ? 0.75 : 0.56);
  float ribs = saLine(abs(q.y) - hw*0.55, 0.02*hw + 0.01, fwy)*0.8 + saLine(q.y, 0.03*hw + 0.01, fwy) + saLine(abs(q.y) - hw*eg, 0.035*hw + 0.012, fwy);
  ribs *= clamp(hw*0.25/fwy, 0.0, 1.0);
  saHair = (saLine(abs(q.y) - hw*(eg - 0.075), 0.012*hw + 0.004, fwy) + saLine(q.y - (lvl < 0.5 ? 0.17 : 0.26)*hw, 0.012*hw + 0.004, fwy))*clamp(hw*0.2/fwy, 0.0, 1.0);
  return max(max(gl, gl2), ribs);
}
// trapped air: sparse bubbles in cells of p; x = disc, y = its dark rim, z = one small highlight (aa = a pixel, in cells)
vec3 saBubble(vec2 p, float aa){
  vec2 i = floor(p), f = fract(p) - 0.5;
  float on = step(0.70, saHash2(i + 0.37));
  vec2 o = (vec2(saHash2(i + 3.7), saHash2(i + 9.1)) - 0.5)*0.5;
  float rr = 0.09 + 0.14*saHash2(i + 5.3), r = length(f - o);
  float disc = (1.0 - smoothstep(rr - aa, rr + aa, r))*on;
  float hi = (1.0 - smoothstep(rr*0.12, rr*0.34 + aa, length(f - o + vec2(rr*0.38, -rr*0.3))))*on;
  return vec3(disc, smoothstep(rr*0.42, rr*0.92, r)*disc, hi)*clamp(rr/(aa*1.5), 0.0, 1.0);
}
// What a clear pane shows: the world straight behind it. In the cloud that is the fog, the bluer hollow the crystal
// has eaten (the same chord the dome draws, with a floor so the glass always reads a tone deeper than the fog) and
// the dark sea through the tear; below the base it is the dusk sky and the sea.
vec3 saBehind(vec3 o, vec3 d){
  vec3 c = saCloudCol(d);
  vec3 sc = vec3(1.0, 2.0, 1.0);
  vec3 oc = (o - uSaHub.xyz)*sc, dd = d*sc; dd /= max(length(dd), 1e-4);
  float R = max(uSaHub.w*1.1, 1.0), bq = dot(oc, dd), h = bq*bq - (dot(oc, oc) - R*R), sq = sqrt(max(h, 0.0));
  float chord = max(-bq + sq, 0.0) - max(-bq - sq, 0.0);
  float cr = chord/R, hol = (1.0 - exp(-cr*cr*0.9))*smoothstep(0.0, 0.5, h/(R*R));
  // from inside the hollow the fog thins downward into deep blue (the dome draws the same), and the glass keeps a little of it
  float inside = 1.0 - smoothstep(0.7, 1.05, length(oc)/R);
  float down = 1.0 - smoothstep(-0.25, 0.08, d.y);
  c = mix(c, uSaHollow*mix(0.5, 1.0, smoothstep(-0.6, 0.0, d.y)), max(max(hol*0.92, inside*down*0.92), saFloor));
  float dn = min(d.y, -1e-3), tb = (o.y - uSaAtm.z)/(-dn);
  float th = saHole(o.xz + d.xz*tb)*step(uSaAtm.z, o.y)*step(d.y, 0.0);
  c = mix(c, uSaSea*1.6 + uSaCobalt*0.22, th*0.5);
  return mix(c, saEnv(d), uSaBelow);
}
void main(){
  vec3 dx = dFdx(vW), dy = dFdy(vW);
  vec3 Nf = cross(dx, dy);
  float nl2 = dot(Nf, Nf);
  vec3 V = normalize(cameraPosition - vW);
  vec3 N = nl2 > 1e-20 ? Nf*inversesqrt(nl2) : V;
  // (okN: 0 on a face seen so nearly edge-on that its normal, taken from screen derivatives, is noise from pixel to
  // pixel: such a face carries no white glint or key line, which would break up into a stipple)
  float okN = smoothstep(0.003, 0.03, nl2/max(dot(dx, dx)*dot(dy, dy), 1e-30));
  if (dot(N, V) < 0.0) N = -N;
  // level (0 spine, 1 branch, 2 twig, 3 hub plate) and how far into a spearhead cap this is (0 at its base ring, 1 at the point)
  float seed = vInfo.z, lvl = floor(vInfo.w + 0.01), cap = clamp((vInfo.w - lvl)*4.0, 0.0, 1.0), hubK = step(2.5, lvl);
  float flatness = abs(dot(N, vUp));
  // (on the hub the low ring ridges belong to the pane: they are lines in the glass, not steps)
  float slope = 1.0 - smoothstep(mix(0.55, 0.40, hubK), mix(0.98, 0.72, hubK), flatness);
  float topness = smoothstep(mix(0.80, 0.55, hubK), mix(0.97, 0.72, hubK), flatness);
  float wallK = 1.0 - smoothstep(0.15, 0.45, flatness);
  // near the eye (nearK 1) the ice is see-through glass: a flat top is a dark clear pane, a wall shows what is really
  // behind it; far off (0) a flat top keeps the fog's tone. cl = the close pass of the hero (never a companion rod)
  float dist = length(cameraPosition - vW), nearK = 1.0 - smoothstep(10.0, 28.0, dist), cl = nearK*(1.0 - uSaRod);
  float brB = step(0.5, lvl)*(1.0 - hubK)*(1.0 - uSaBelow), armB = (1.0 - hubK)*(1.0 - uSaBelow), bt = cl*brB;   // a branch or twig, an arm piece, in the cloud
  float paneK = lvl < 0.5 ? 0.42 : (lvl < 2.5 ? 0.20 : 0.88);   // how much of the hollow's dark a top near the eye keeps: arm, branch and twig tops are pale panes
  // (bgL: how bright the world straight behind this piece really is, before any floor: it decides how a companion is drawn)
  saFloor = 0.0; float bgL = uSaRod > 0.5 ? dot(saBehind(vW, -V), vec3(0.3333)) : 0.0;
  saFloor = mix(0.50, mix(mix(0.25, 0.62, 0.8*slope), mix(mix(paneK, mix(0.72, 0.36, brB), wallK), mix(0.78, 0.40, brB), slope*wallK), nearK), 1.0 - uSaRod);
  vec3 Nh = N - vUp*dot(N, vUp);   // which way the facet leans
  // each segment leans a hair off true so glints come one piece at a time
  vec3 jit = vec3(saHash(seed*13.0 + 0.5), saHash(seed*29.0 + 3.0), saHash(seed*53.0 + 7.0)) - 0.5;
  N = normalize(N + jit*0.08);
  float NV = clamp(dot(N, V), 0.0, 1.0);
  float side = dot(vUp, V) >= 0.0 ? 1.0 : -1.0;
  vec3 Nb = vUp*side;
  // a flat top is a pane: the view goes straight through. A bevel, rib or ridge bends it like a prism (no hard
  // switch anywhere, so nothing flips from pixel to pixel), and a slow waviness slides the picture as the eye moves.
  vec3 bend = N - Nb*dot(N, Nb);
  vec2 wv = vL.xz*0.8 + seed*5.0;
  vec3 D2 = normalize(-V - bend*0.55 + 0.10*vec3(saNoise(wv) - 0.5, 0.0, saNoise(wv + 7.3) - 0.5));
  vec3 e0 = saBehind(vW, D2);
  vec3 eR = saBehind(vW, normalize(D2 + N*0.10)), eB = saBehind(vW, normalize(D2 - N*0.10));
  e0 = mix(e0, vec3(eR.r, e0.g, eB.b), slope*0.7);
  float thick = min(2.0*max(vSeg.z, 0.15)/max(abs(dot(V, vUp)), 0.25), mix(1000.0, 1.0, uSaRod));   // (a companion is thin clear glass whatever its build)
  vec3 tint = mix(vec3(0.92), uSaMid*1.3, 1.0 - exp(-thick*0.35));
  tint = mix(tint, vec3(0.62, 0.74, 0.95), 0.6*wallK*cl);   // a wall near the eye is thin clear glass, not a saturated slab
  tint = mix(tint, vec3(0.78, 0.86, 0.98), 0.55*topness*cl*(1.0 - hubK));   // and a top seen along its length stays pale ice, never blue steel
  vec3 Lk = normalize(mix(uSaKeyDir, uSaGoldDir, uSaBelow)), lc = mix(uSaKeyCol, uSaGoldCol*1.25, uSaBelow);
  vec3 palK = mix(uSaPale, uSaGoldCol*0.9, uSaBelow);
  float nk = max(dot(N, Lk), 0.0);
  // body: the scene behind, tinted by the path through the ice, plus a breath of light scattered inside the plate
  vec3 col = e0*tint + uSaPale*(0.025*dot(saEnv(Nb), vec3(0.3333)) + 0.02*nk)*(1.0 - 0.6*slope)*(1.0 - 0.5*uSaBelow);
  // (near the eye a branch or twig top is a pale pane: a tone lighter than the hollow under it, darker than the fog)
  col += uSaPale*0.14*cl*topness*(1.0 - hubK)*(lvl > 0.5 ? 1.0 : 0.6)*(1.0 - uSaBelow);
  col += (uSaPale*0.07 + uSaMid*0.16)*cl*topness*armB;
  // below the base the body of the glass stays deep blue, never black
  col += (uSaCobalt*0.26 + uSaMid*0.08)*uSaBelow*(0.6 + 0.4*flatness);
  // local face coordinates (in a cap the half width runs to nothing, so the true distance across is taken from its base)
  // and the patterns in them
  // (a spearhead stays a cut gem a little further out than the rest of the close pass: 16 m, gone by 30)
  float capD = max(1.0 - cap, 0.03), capK = smoothstep(0.0, 0.05, cap)*(1.0 - uSaRod)*(1.0 - smoothstep(16.0, 30.0, dist));
  vec2 q = vec2(vSeg.x, vSeg.y*vSeg.w);
  // where the eye's ray, bent into the ice, leaves through the underside (local xz), along and across the segment
  vec3 vl = normalize(vViewL);
  vec2 par = vl.xz*(2.0*vSeg.z)*0.85*inversesqrt(max(1.72 - dot(vl.xz, vl.xz), 0.2));
  float pa = dot(par, vAxL), pc = dot(par, vec2(vAxL.y, -vAxL.x));
  float lines = 0.0, under = 0.0, ring = 0.0, nucleus = 0.0, hair = 0.0, inner = 0.0, innerLn = 0.0, wideK = 1.0, cLine = 0.0;
  vec3 grain = uSaDust;
  if (lvl < 2.5) {
    lines = saFaceLines(q, vSeg.w, seed, lvl);
    float terr = saTerrace; hair = saHair;
    // a companion's face that is only a few pixels wide carries no pattern (it would stipple): plain dark-edged glass
    float wide = mix(1.0, saWide, uSaRod); wideK = saWide;
    // one pale line down the middle of a companion's blade (its ridge), where the blade is wide enough to carry it
    float fwq = fwidth(q.y) + 1e-4;
    cLine = saLine(q.y, 0.035*vSeg.w + 0.004, fwq)*clamp(vSeg.w*0.3/fwq, 0.0, 1.0)*uSaRod;
    // the underside seen through the top: same pattern, shifted by parallax (a companion is one clear pane: no
    // underside pattern, and its ribs and growth lines only a breath)
    under = saFaceLines(q + vec2(pa, pc)*0.6 + 0.21, vSeg.w, seed + 0.37, lvl)*wide*(1.0 - uSaRod)*(1.0 - 0.65*cl*armB);
    lines *= wide*mix(1.0, 0.25, uSaRod); hair *= wide; terr *= 1.0 - uSaRod;
    // an end plate (the plate habit): a dark glass hexagon with a pale rim and one inner hexagon line, no growth stripes
    float wfL = (lvl < 0.5 ? 1.9 : 0.95)*mix(0.35, 1.0, vInfo.x);
    float dH = abs(q.y)/(capD*wfL) + max(abs(vPl.x) - vPl.y, 0.0)/max(vPl.z, 1e-3), fwh = fwidth(dH) + 1e-4;
    float inPl = step(1e-3, vPl.y)*(1.0 - smoothstep(0.98, 1.06, dH));
    float plLn = max(saLine(dH - 0.58, 0.018, fwh), 0.55*smoothstep(0.80, 0.90, dH))*clamp(0.3/fwh, 0.0, 1.0);
    lines *= 1.0 - inPl; under *= 1.0 - inPl; terr *= 1.0 - inPl; hair = mix(hair, plLn, inPl);
    col = mix(col, uSaCobalt*0.42, 0.5*inPl*topness*saLine(dH - 0.66, 0.02, fwh)*clamp(0.3/fwh, 0.0, 1.0));
    col *= 1.0 - mix(0.06, mix(0.15, 0.04, armB), cl)*terr*topness*wide;
    // the far wall seen from inside, through the top: a pale band of refracted fog along the far edge of every face,
    // with a dark line where it starts; it widens and slides as the eye moves (the thickness of the glass)
    float ayU = abs(q.y + clamp(pc, -0.42*vSeg.w, 0.42*vSeg.w))/max(vSeg.w, 0.02);
    float fwI = fwidth(ayU) + 1e-4, innK = (1.0 - smoothstep(0.0, 0.05, cap))*topness*cl*smoothstep(0.3, 0.7, vSeg.w)*clamp(0.05/fwI, 0.0, 1.0)*(1.0 - brB);
    inner = smoothstep(0.86 - fwI, 0.93 + fwI, ayU)*innK;
    innerLn = saLine(ayU - 0.86, 0.025, fwI)*innK;
    // in a spearhead near the eye the facets carry the picture, not the lines
    lines *= 1.0 - capK; under *= 1.0 - capK; hair *= 1.0 - capK;
  } else {
    vec2 h = vL.xz*uSaHubS;
    float hd = saHex(h.xy);   // constant along the plate's own outline: the rings run parallel to its edges
    float wob = saNoise(h*1.3 + seed*9.0)*0.35;
    float c = hd*2.7 + 0.30*sin(hd*4.3 + seed*20.0) + wob*0.6;   // (unevenly spaced, like tree rings; each line a seventh of its spacing)
    float fwc = fwidth(c) + 1e-4;
    // (a thin line, filtered as a box so a ring seen at a slant never swells into a band: a ninth of its spacing)
    ring = min(clamp((0.045 - abs(fract(c) - 0.5))/fwc + 0.5, 0.0, 1.0), clamp(0.09/fwc, 0.0, 1.0));
    float c2 = hd*11.0 + wob*2.0; float fw2 = fwidth(c2) + 1e-4;
    ring = max(ring, 0.4*(1.0 - smoothstep(0.08, 0.08 + fw2*1.5, abs(fract(c2) - 0.5)))*clamp(0.3/fw2, 0.0, 1.0)*(1.0 - 0.85*cl));   // (the fine set only from afar)
    // six faint radial seams to the corners
    float ang = atan(h.x, h.y + 1e-5);
    float seam = abs(fract(ang/1.0471976 + 0.5) - 0.5)*1.0471976*length(h);
    float seamL = 0.6*saLine(seam, 0.015, fwidth(seam) + 1e-4)*smoothstep(0.3, 0.6, length(h));
    ring = max(ring, seamL);
    vec2 hu = vL.xz*uSaHubS + par*0.9;
    float hdu = saHex(hu.xy), c3 = hdu*2.7 + 0.30*sin(hdu*4.3 + seed*20.0) + 0.5; float fw3 = fwidth(c3) + 1e-4;
    under = (1.0 - smoothstep(0.05, 0.05 + fw3*1.5, abs(fract(c3) - 0.5)))*clamp(0.4/fw3, 0.0, 1.0)*(1.0 - cl);
    // the modelled ring ridges: soft dark lines in the pane
    ring = max(ring, 0.8*(1.0 - smoothstep(0.80, 0.97, flatness))*cl);
    // the dust grain, seen at depth through the glass
    vec2 nq = vL.xz*uSaHubS + vl.xz/max(abs(vl.y), 0.35)*0.55;
    float nr = length(nq) + (saNoise(nq*14.0) - 0.5)*0.10 + (saNoise(nq*41.0) - 0.5)*0.04;
    nucleus = 1.0 - smoothstep(0.20, 0.27, nr);
    // (a rough brown-black grain, rounded: lit from the key's side, one small highlight, never a flat black blob)
    vec2 gn = nq/0.27; vec3 gN = normalize(vec3(gn.x, sqrt(max(1.0 - dot(gn, gn), 0.0)) + 0.15, gn.y));
    float gdf = max(dot(gN, normalize(vec3(uSaKeyDir.x, uSaKeyDir.y + 0.6, uSaKeyDir.z))), 0.0);
    grain = uSaDust*(1.1 + 2.4*saNoise(nq*26.0)) + (uSaDust*5.0 + uSaMid*0.12)*gdf*gdf + uSaPale*0.6*smoothstep(0.90, 0.97, dot(gN, normalize(vec3(-0.35, 0.8, 0.35))));
    float halo = 1.0 - smoothstep(0.25, 0.75, nr);
    col = mix(col, col*uSaMid*1.1, halo*0.5);
    // the opening: the tumbling plate is a pale pane catching the bright fog, its rings and rim drawn dark on it
    // (seen from 60 m: no fine rings, which would stipple, but one inner hexagon, the six seams and a dark rim)
    float hx = saHex(vL.xz)/(0.8660254*max(vSeg.w, 0.05)), fhx = fwidth(hx) + 1e-4;   // 0 at the centre, 1 on the outline
    // six sectors of slightly different tone (a cut crystal, not a card), brighter toward the rim where the light is thrown back
    vec3 pane = (uSaPale*1.14 + lc*0.25*nk)*(0.82 + 0.18*NV)*(0.90 + 0.16*saHash(floor(ang/1.0471976 + 3.0) + seed*7.0))*(0.88 + 0.20*smoothstep(0.3, 0.84, hx));
    pane = mix(pane, uSaMid*1.05 + uSaPale*0.22, 0.38*(1.0 - smoothstep(0.08, 0.62, hx)));   // clear in the middle: the blue of the well comes through
    col = mix(col, pane, uSaOpen*0.9*topness);
    float oR = max(max(saLine(hx - 0.34, 0.006, fhx), saLine(hx - 0.56, 0.008, fhx)), 0.8*saLine(hx - 0.74, 0.006, fhx));
    ring = mix(ring, max(seamL*0.7, oR), uSaOpen);
    under *= 1.0 - uSaOpen;
    col = mix(col, uSaCobalt*mix(0.36, 0.26, uSaOpen), smoothstep(mix(0.86, 0.90, uSaOpen), mix(0.92, 0.95, uSaOpen), hx)*max(uSaOpen, uSaRod)*0.92*topness);
    col += lc*0.25*saLine(hx - 0.86, 0.012, fhx)*uSaOpen*topness;
    lines = ring;
  }
  // air trapped in the plate: two sparse layers of bubbles at different depths, sliding against the surface lines
  float baa = dist*0.0034/max(NV, 0.2), bk = (1.0 - smoothstep(6.0, 11.0, dist))*topness*(1.0 - uSaRod)*smoothstep(0.30, 0.48, NV)*(1.0 - 0.9*brB);
  vec3 bub = max(saBubble((vL.xz + par*0.55)*2.3 + 3.1, baa*2.3), saBubble((vL.xz + par*1.25)*3.4 + 11.7, baa*3.4)*0.8)*bk;
  col = mix(col, col*1.12 + uSaPale*0.03, bub.x*0.6);
  col = mix(col, uSaCobalt*0.32, bub.y*0.8);
  col += lc*0.55*bub.z;
  // a breath of frost inside the pane: soft milky patches (the same on all six arms)
  vec2 fwL = fwidth(vL.xz);
  float fr = smoothstep(0.5, 0.82, saNoise(vL.xz*0.6 + 17.0))*mix(0.72, 0.45 + 0.55*saNoise(vL.xz*11.0 + 3.0), clamp(0.035/max(max(fwL.x, fwL.y), 1e-4), 0.0, 1.0));
  col += uSaPale*0.07*fr*topness*cl*(1.0 - uSaBelow);
  // the far wall through the top
  col = mix(col, mix(col*0.55 + min(saEnv(vUp), vec3(1.0))*0.30, col*0.72 + uSaMid*0.16, 1.0 - uSaBelow), inner*mix(0.85, 0.35, 1.0 - uSaBelow));
  col *= 1.0 - 0.4*innerLn;
  // ribs and growth lines: cobalt in the bright cloud, pale on the dark glass below the base
  // (under the lens the hub is a block of deep blue glass: its growth rings are pale lines in it, like tree rings)
  float hubC = hubK*cl*(1.0 - uSaOpen)*(1.0 - uSaBelow);
  col = mix(col, uSaHollow*1.1 + uSaCobalt*0.05, 0.55*hubC*topness);
  col = mix(col, mix(mix(uSaCobalt*0.45, uSaPale*0.62, hubC), uSaPale*0.3 + uSaGoldCol*0.1, uSaBelow), clamp(lines*mix(0.50, 0.8, max(hubC, max(uSaOpen, uSaRod)*hubK)) + under*mix(0.22, 0.4, nearK), 0.0, 0.8)*topness);
  // a bright hairline where each flat meets its bevel and along the ridge: the light caught in the edge of the pane.
  // Near the eye it is not a pinstripe but a glint that travels along the edge as the eye moves
  float hg = mix(1.0, 0.12 + 0.88*smoothstep(0.2, 0.9, sin(q.x*1.1 + dot(vViewL.xz, vec2(0.7, 0.5)) + seed*17.0 + uSaClock*0.3)), cl);
  // (in the cloud, under the lens, these lines are cobalt, as every edge of clear ice is in bright fog; only the facet
  // that holds the key's reflection carries a white one)
  float keyF = smoothstep(0.90, 0.985, max(dot(reflect(-V, N), Lk), 0.0))*okN, cobK = cl*(1.0 - uSaBelow);
  col = mix(col, mix(lc*0.85, mix(uSaCobalt*0.40, lc*0.9, keyF), cobK), hair*mix(hg, 1.0, cobK*(1.0 - keyF))*mix(0.75, 0.6, nearK)*topness*(1.0 - 0.65*uSaRod));
  // edges go dark where the facet turns from the eye; bevels, ribs and the ridge are cobalt until the key finds them
  float rim = 1.0 - NV; rim *= rim;
  // (a companion is drawn as glass is seen in bright fog: pale down the middle, a broad dark band toward each edge)
  float brightBg = smoothstep(0.30, 0.55, bgL)*uSaRod*(1.0 - uSaBelow);
  float ay = abs(vSeg.y), thinRod = 1.0 - smoothstep(0.2, 0.35, vSeg.w), rodEdge = uSaRod*smoothstep(mix(0.62, 0.18, thinRod) - 0.14*brightBg, mix(0.95, 0.72, thinRod) - 0.12*brightBg, ay)*(lvl < 2.5 ? 0.88 + 0.08*brightBg : 0.0);
  col = mix(col, uSaCobalt*0.5, clamp(rim*(0.15 + 0.5*slope) + slope*mix(0.3, 0.05, nearK), 0.0, 0.9)*(1.0 - 0.6*wallK*cl));
  col = mix(col, col*vec3(0.80, 0.88, 0.97), uSaRod);
  col = mix(col, col*vec3(0.70, 0.81, 0.97), 0.55*brightBg);   // against bright cloud the pane is a tone deeper and bluer than the fog
  // (as glass is seen under a microscope: against bright fog its edges are dark; against the dark of the hollow they
  // are the bright ones, and the pane takes a faint sheen)
  float darkBg = (1.0 - smoothstep(0.16, 0.34, bgL))*uSaRod*(1.0 - uSaBelow);
  col += uSaPale*0.07*darkBg*topness;
  col = mix(col, mix(uSaCobalt*mix(0.40, 0.33, brightBg), uSaPale*0.92 + lc*0.06, darkBg), rodEdge);
  col = mix(col, uSaCobalt*0.5 + uSaMid*0.12, 0.95*brightBg*thinRod);   // a thin blade against bright cloud is a cobalt line: lace drawn dark on the fog
  col *= mix(1.0, 0.80 + 0.40*saHash(seed*31.0 + 2.0), uSaRod);   // (each rod its own tone, so a bundle reads as separate needles)
  col += uSaPale*0.08*uSaRod*topness*(1.0 - smoothstep(0.0, 0.5, ay))*(1.0 - 0.8*brightBg*thinRod);   // a companion rod: pale down its middle, dark at its edges
  col = mix(col, palK*0.95 + lc*0.05, 0.75*cLine*topness);
  col += lc*slope*mix(0.35, 0.12, nearK)*smoothstep(mix(0.6, 0.85, nearK), mix(0.95, 0.98, nearK), nk)*(1.0 - 0.7*uSaRod)*(1.0 - 0.8*brightBg);
  // ---- the close pass. WALLS are clear panes standing on edge. Their own colour is the dark of the hollow (and the
  // true background comes through them: see the alpha at the end), lighter where they are turned to the key and
  // cobalt where they are turned away, with a dark line at the foot and a bright line along the top edge. Inside the
  // bar the eye's ray falls to the underside and is thrown back up at the bright fog, so the lower part of every wall
  // carries a pale band of fog: wider the steeper the eye looks, so it slides up and down the wall as we move
  vec3 LkP = Lk - vUp*dot(Lk, vUp); LkP /= max(length(LkP), 1e-3);
  float kwall = dot(N, LkP), wk = wallK*cl;
  float wallH = lvl > 2.5 ? 0.8 : (lvl < 0.5 ? 0.5 : (lvl < 1.5 ? 0.45 : 0.4));
  float hb = clamp(vL.y/max(vSeg.z*wallH, 0.02), -1.3, 1.3);
  float litK = min(smoothstep(0.55, 0.95, kwall), mix(1.0, 0.6, cl*(1.0 - uSaBelow)));
  vec3 wallC = mix(col, uSaHollow + uSaMid*0.20, 0.5)*(0.88 + 0.22*litK);
  float wallB = armB*(lvl < 0.5 ? 0.5 : 1.0);   // (a spine's wall goes half way: it keeps its band and a deeper tone)
  col = mix(col, mix(col*(0.62 + 0.50*litK) + palK*0.05*litK, wallC, wallB), wk);
  col = mix(col, uSaCobalt*0.30, mix(0.45, 0.12, wallB)*wk*(1.0 - smoothstep(-0.2, 0.6, kwall)));
  float fall = abs(vl.y)/max(length(vl.xz), 0.15)/1.31;
  float barW = lvl > 2.5 ? 1.2 : 2.0*vSeg.w/capD;
  float bandTop = -1.0 + 2.0*clamp(fall*barW/max(2.0*vSeg.z*wallH, 0.02), 0.08, 0.5) + 0.10*sin(vSeg.x*1.7 + seed*40.0 + uSaClock*0.25);
  float band = (1.0 - smoothstep(bandTop - 0.45, bandTop + 0.06, hb))*smoothstep(-1.0, -0.86, hb)*wk*(1.0 - brB);
  vec3 bandD = normalize(vec3(D2.x, abs(D2.y) + 0.3, D2.z));
  vec2 bq = vL.xz*0.45 + bandD.xz*2.0 + vec2(0.0, uSaClock*0.05);
  col = mix(col, min(saEnv(bandD), vec3(1.0))*(0.15 + 0.08*saNoise(bq) + 0.07*litK), band*0.85);
  col *= 1.0 - 0.6*wk*(1.0 - smoothstep(-1.0, -0.84, hb));
  float topLn = wk*smoothstep(0.82, 0.98, hb)*(0.35 + 0.65*smoothstep(0.2, 0.9, kwall));
  col += lc*0.45*topLn*mix(1.0, keyF, 1.0 - uSaBelow);
  col = mix(col, uSaCobalt*0.40, 0.5*topLn*(1.0 - keyF)*(1.0 - uSaBelow));
  // BEVELS turned to the key are bright, those turned away cobalt
  float bevK = slope*(1.0 - wallK)*cl;
  col += lc*0.16*bevK*smoothstep(0.55, 0.92, nk);
  col = mix(col, uSaCobalt*0.34, 0.35*bevK*(1.0 - smoothstep(0.05, 0.5, nk)));
  // A SPEARHEAD near the eye is a cut gem: six facets fan out to the point, each with its own tone (one white, its
  // neighbours cobalt or clear), and the white one moves from facet to facet as the eye passes
  float ac0 = clamp(vSeg.y/capD, -1.0, 1.0)*3.0, fi = floor(ac0), ff = ac0 - fi;
  float gv = sin(fi*2.4 + dot(vl.xz, vec2(vAxL.y, -vAxL.x))*3.0 + dot(vl.xz, vAxL)*1.3 + seed*6.28);
  vec3 gbody = e0*tint*1.1 + uSaMid*0.05*(1.0 - uSaBelow);
  vec3 gem = mix(uSaCobalt*0.30, gbody, smoothstep(-0.75, -0.25, gv));
  gem = mix(gem, gbody*0.45 + palK*0.40, smoothstep(0.15, 0.40, gv));
  gem = mix(gem, palK*1.05, smoothstep(0.62, 0.78, gv));
  gem = mix(gem, gem*0.5 + palK*0.3, (1.0 - smoothstep(0.5, 1.6, min(ff, 1.0 - ff)/max(fwidth(ac0), 1e-4)))*0.6);
  float gemK = capK*smoothstep(0.25, 0.55, flatness)*(1.0 - brB);
  col = mix(col, gem, gemK*0.9);
  float gemSee = smoothstep(-0.75, -0.25, gv)*(1.0 - smoothstep(0.15, 0.40, gv));   // the clear facets
  // a thin bright line along the outer edge of every bevel: white near the eye in the cloud; below the base a gold
  // rim on the edges that face the low sun or stand against it
  float fwe = fwidth(vSeg.y);
  float eline = (1.0 - smoothstep(0.6, 1.9, (1.0 - ay)/max(fwe, 1e-5)))*step(1e-5, fwe)*smoothstep(0.12, 0.3, flatness)*(1.0 - topness)*(lvl < 2.5 ? 1.0 : 0.0);
  float fire = max(dot(D2, uSaGoldDir), 0.0), sunFace = smoothstep(0.1, 0.6, dot(N, uSaGoldDir));
  eline *= mix(1.0, (0.2 + 0.8*hg)*(0.3 + 0.7*smoothstep(0.3, 0.85, nk)), cl);
  col = mix(col, mix(lc*0.9, mix(uSaCobalt*0.42, lc*0.9, keyF), cobK), eline*mix(mix(0.55, 1.0, nearK)*(1.0 - 0.85*uSaRod), max(sunFace, fire*fire)*0.9, uSaBelow));
  // mirror: fresnel, a soft sheen, and a hard glint when a facet catches the key (never wider than a facet)
  // (in a spearhead near the eye each facet mirrors its own piece of the fog: its lean is exaggerated)
  vec3 Nm = normalize(N + Nh*2.0*gemK);
  vec3 R = reflect(-V, Nm);
  float F = 0.03 + 0.97*pow(max(1.0 - NV, 0.0), 5.0);
  // a facet turned from the eye mirrors the bright fog above it; one turned to the eye shows the dark through it
  // (a flat top takes the whole grazing mirror, so the far end of an arm is a pale mirror of the fog; right under
  // the lens it stays a dark clear pane). The mirror holds the billows of the cloud, sliding as the eye moves
  float Ft = 0.03 + 0.97*pow(max(1.0 - NV, 0.0), 3.5);
  vec3 mir = mix(saBehind(vW, R), saEnv(R), smoothstep(-0.1, 0.3, R.y));
  vec2 mp = R.xz/max(R.y, 0.2)*1.5 + vec2(0.0, uSaClock*0.04);
  mp += vL.xz*0.22*cl;
  mir *= mix(1.0, 0.60 + 0.80*(saNoise(mp)*0.65 + saNoise(mp*2.6 + 4.0)*0.35), (1.0 - uSaRod)*(1.0 - 0.5*uSaBelow)*smoothstep(-0.1, 0.3, R.y));
  // (near the eye, in the cloud, a wall or bevel seen along its face never turns into a white mirror of the fog: a quarter at most)
  float mirK = mix(min(F*(0.36 + 0.59*slope), mix(1.0, 0.25, cl*armB)), Ft*0.9*mix(0.35, 1.0, smoothstep(3.0, 14.0, dist))*(1.0 - 0.25*cl)*mix(1.0, mix(1.0, 0.5, smoothstep(0.26, 0.42, NV)), cl), topness)*(1.0 - 0.95*gemK)*mix(1.0, 0.5 - 0.25*brightBg, uSaRod)*(1.0 - 0.5*bt*topness);
  col = mix(col, mir, mirK);
  float gk = max(dot(R, Lk), 0.0);
  float g8 = gk*gk; g8 *= g8; g8 *= g8; float g40 = g8*g8*g8*g8*g8;
  col += lc*0.4*g40*(0.15 + 0.85*slope)*(1.0 - 0.9*brightBg)*okN;
  // below the base: gold fire inside the bevels that are turned to the sun; the rest stays deep blue glass
  col += uSaGoldCol*uSaBelow*slope*(0.02 + 1.2*fire*fire*fire*sunFace);
  col = min(col, vec3(0.82));
  // (a companion on bright cloud is drawn dark: no stipple of sparks on its lace; its one glint is the world's sprite)
  col += lc*3.0*smoothstep(mix(0.990, 0.975, cl), 0.998, gk)*(0.03 + 0.97*slope)*(1.0 - 0.9*brightBg)*mix(1.0, smoothstep(5.0, 14.0, dist), 1.0 - uSaRod)*okN;   // (a softer edge near the eye)
  // (the opening plate's walls and bevels: blue glass, so the hexagon reads as a pale pane with a darker rim)
  col = mix(col, uSaMid*0.30 + uSaCobalt*0.25, uSaOpen*(1.0 - topness)*(lvl > 2.5 ? 0.8 : 0.0));
  // the dust nucleus sits under everything but the mirror
  col = mix(col, grain, nucleus*0.96);
  // fresh ice: frosted (never a white cut-out), with one soft flash on its bevels as it forms
  float g = vInfo.x, fresh = vInfo.y;
  vec3 frost = saEnv(N)*0.5 + lc*0.25*nk;
  frost = min(frost*(0.8 + 0.3*saNoise(vL.xz*22.0)), vec3(0.70));
  col = mix(col, frost, fresh*0.12);
  float pulse = 4.0*g*(1.0 - g);
  float tipward = smoothstep(0.35, 1.0, g);
  col += uSaKeyCol*(lvl < 0.5 ? 2.2 : 1.0)*pulse*tipward*slope*mix(0.35, 1.0, smoothstep(4.0, 10.0, dist));
  // near the eye the glass really is clear: what lies behind it (the hollow and its drifting billows, the arms beyond,
  // the sea through the tear) comes through walls, bevels and the steeply seen top; lines, bands, bubbles, the mirror
  // and every glint stay solid
  // (only the hub plate and the spine's top face are see-through; walls, bevels, branches and twigs are all but solid,
  // so where arm roots stand behind one another nothing blends in draw order and each reads as a clean pane)
  float see = 0.15*wallK*(1.0 - 0.8*band)*(1.0 - topLn) + 0.10*slope*(1.0 - wallK) + 0.36*topness*mix(1.0, gemSee*1.25, gemK)*(1.0 - 0.6*hubK)*mix(0.3, 1.0, clamp(step(lvl, 0.5) + hubK, 0.0, 1.0));
  see *= mix(1.0, max(hubK, gemK), 1.0 - uSaBelow);
  see *= max(cl, gemK)*(1.0 - mirK)*(1.0 - clamp(hair*hg + eline + bub.x + 0.6*lines + 0.6*inner + nucleus + fresh, 0.0, 1.0));
  // a companion's wide blade lets the cloud through its pane (never its edges, its centre line or its mirror)
  float seeRod = mix(0.5, 0.22, brightBg)*uSaRod*topness*wideK*(1.0 - rodEdge)*(1.0 - mirK)*(1.0 - clamp(cLine + hair + eline + 0.6*lines, 0.0, 1.0));
  float alpha = 1.0 - clamp(max(see, seeRod), 0.0, 0.6);
  vec4 fg = saFogCA(vW);   // (in the opening the plate stands in clear air: the well's fog hardly veils it)
  gl_FragColor = vec4(mix(col, fg.rgb, fg.a*(1.0 - 0.6*uSaOpen)*(1.0 - 0.5*brightBg*thinRod))*alpha, alpha);   // (dark lace on bright cloud keeps its tone through the fog)
}
`;

export function makeIceMaterial(uniforms) {
  // (drawn with the transparent things, depth written: only the close pass of the hero is ever less than solid)
  const m = new THREE.ShaderMaterial({ vertexShader: ICE_VERT, fragmentShader: ICE_FRAG, side: THREE.DoubleSide, transparent: true, premultipliedAlpha: true });
  m.uniforms = { ...uniforms };
  if (!m.uniforms.uSaHubS) m.uniforms.uSaHubS = { value: 1 };
  if (!m.uniforms.uSaRod) m.uniforms.uSaRod = { value: 0 };
  if (!m.uniforms.uSaOpen) m.uniforms.uSaOpen = { value: 0 };
  return m;
}

// ---------------------------------------------------------------- prism segments
// cross-sections: [across -1..1, height 0..1] for the top half, left to right (the bottom mirrors it)
const PROFILES = [
  [[-1, 0.5], [-0.88, 0.8], [-0.64, 0.8], [-0.55, 0.93], [-0.46, 0.8], [-0.14, 0.8], [0, 1], [0.14, 0.8], [0.46, 0.8], [0.55, 0.93], [0.64, 0.8], [0.88, 0.8], [1, 0.5]],
  [[-1, 0.45], [-0.78, 0.78], [-0.22, 0.78], [0, 1], [0.22, 0.78], [0.78, 0.78], [1, 0.45]],
  [[-1, 0.4], [-0.6, 0.8], [0, 1], [0.6, 0.8], [1, 0.4]],
];
const LOOPS = PROFILES.map((top) => { const l = top.map((q) => [q[0], q[1]]); for (let i = top.length - 1; i >= 0; i--) l.push([top[i][0], -top[i][1]]); return l; });

// list: [{ ox, oz, dx, dz, rings: [{ a, w, h }...], tip: metres | 0, profile, birth, dur, seed, level }]
// Each segment is a bevelled, ridged prism running from (ox, oz) along (dx, dz) in the XZ plane, ending in a
// faceted spearhead that comes to a point at `tip` metres (omit for an open end).
// (the work is one generator, pausing every 40 segments: makeSegmentGeometry runs it straight through, and
// makeSegmentGeometryAsync(ctx, list) awaits ctx.yield() at every pause, so a long list never holds the page. It draws
// no random numbers: both give the same geometry.)
function* segmentGeometrySteps(list) {
  let nv = 0, ni = 0, done = 0;
  for (const s of list) { const n = LOOPS[s.profile].length; nv += n * s.rings.length + (s.tip ? 1 : 0); ni += n * 6 * (s.rings.length - 1) + (s.tip ? n * 3 : 0); }
  const pos = new Float32Array(nv * 3), org = new Float32Array(nv * 4), axs = new Float32Array(nv * 4), seg = new Float32Array(nv * 4), pl = new Float32Array(nv * 3);
  const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let v = 0, ii = 0;
  for (const s of list) {
    if (++done % 40 === 0) yield;
    const loop = LOOPS[s.profile], n = loop.length, px = s.dz, pz = -s.dx, v0 = v;
    const put = (a, sx, y, w, h) => {
      pos[v * 3] = s.ox + s.dx * a + px * sx * w; pos[v * 3 + 1] = y * h; pos[v * 3 + 2] = s.oz + s.dz * a + pz * sx * w;
      org[v * 4] = s.ox; org[v * 4 + 1] = s.oz; org[v * 4 + 2] = s.birth; org[v * 4 + 3] = s.dur;
      axs[v * 4] = s.dx; axs[v * 4 + 1] = s.dz; axs[v * 4 + 2] = s.seed; axs[v * 4 + 3] = s.level;
      seg[v * 4] = a; seg[v * 4 + 1] = sx; seg[v * 4 + 2] = h; seg[v * 4 + 3] = w;
      if (s.plate) { pl[v * 3] = a - s.plate.xc; pl[v * 3 + 1] = s.plate.f; pl[v * 3 + 2] = s.plate.pt; } else pl[v * 3 + 2] = 1;
      v++;
    };
    for (const r of s.rings) for (let j = 0; j < n; j++) put(r.a, loop[j][0], loop[j][1], r.w, r.h);
    for (let r = 0; r < s.rings.length - 1; r++) for (let j = 0; j < n; j++) {
      const a = v0 + r * n + j, b = v0 + r * n + (j + 1) % n, c = a + n, d = b + n;
      idx[ii++] = a; idx[ii++] = c; idx[ii++] = b; idx[ii++] = b; idx[ii++] = c; idx[ii++] = d;
    }
    if (s.tip) {
      const last = s.rings[s.rings.length - 1], t = v, base = v0 + (s.rings.length - 1) * n;
      put(s.tip, 0, 0, 0.0001, last.h);
      axs[t * 4 + 3] = s.level + 0.25;   // the fraction of the level marks the cap: 0 at its base ring, 0.25 at the point
      for (let j = 0; j < n; j++) { idx[ii++] = base + j; idx[ii++] = t; idx[ii++] = base + (j + 1) % n; }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aOrg', new THREE.BufferAttribute(org, 4));
  g.setAttribute('aAx', new THREE.BufferAttribute(axs, 4));
  g.setAttribute('aSeg', new THREE.BufferAttribute(seg, 4));
  g.setAttribute('aPl', new THREE.BufferAttribute(pl, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}
export function makeSegmentGeometry(list) {
  const it = segmentGeometrySteps(list);
  for (;;) { const r = it.next(); if (r.done) return r.value; }
}
export async function makeSegmentGeometryAsync(ctx, list) {
  const it = segmentGeometrySteps(list);
  for (;;) { const r = it.next(); if (r.done) return r.value; await ctx.yield(); }
}

// ---------------------------------------------------------------- habits
const HABITS = {
  // long thin branches, dense twigs
  fern: { wRoot: 1.6, wTip: 0.7, flare: 1.32, bw: 0.35, bLen: 0.80, bMax: 8.0, bShort: 0.45, twigStep: 1.1, twigLen: 2.3, twigW: 0.2, endPlate: 0, bFlare: 1.35 },
  // broad ridged arms, few short stout branches
  sector: { wRoot: 1.62, wTip: 1.5, flare: 1.42, bw: 0.52, bLen: 0.34, bMax: 3.6, bShort: 0.6, twigStep: 1.2, twigLen: 1.2, twigW: 0.2, endPlate: 0, bFlare: 1.6 },
  // slimmer star whose arms and long branches end in small hexagonal plates
  plate: { wRoot: 1.35, wTip: 0.6, flare: 1.3, bw: 0.27, bLen: 0.6, bMax: 6.0, bShort: 0.4, twigStep: 1.5, twigLen: 1.3, twigW: 0.16, endPlate: 1, bFlare: 2.3 },
};
const NOTCH_R = 28, NOTCH_CLEAR = 8.5;
const NOTCH_X = NOTCH_R * 0.5, NOTCH_Z = NOTCH_R * Math.cos(Math.PI / 6);

function burstAfter(t) {
  if (t <= T_BURST0) return T_BURST0;
  const k = Math.min(N_BURST - 1, Math.ceil((t - T_BURST0) / BURST_DT - 1e-6));
  return T_BURST0 + k * BURST_DT;
}
function distToSeg(x, z, s) {
  const ex = s.x1 - s.x0, ez = s.z1 - s.z0, l2 = ex * ex + ez * ez;
  const t = clamp(((x - s.x0) * ex + (z - s.z0) * ez) / Math.max(l2, 1e-6), 0, 1);
  return Math.hypot(x - s.x0 - ex * t, z - s.z0 - ez * t);
}

// Plans arm 0 (along +Z): returns { segs (right side and spine, in local arm space), spine: [{ r0, L, birth, dur }],
// sites: places on the top face where rime can sit, branches: [{ birth, tip... }] }
// (async: it yields between branches; only this plan draws from `rng` meanwhile, so the draw order never changes)
async function planArm(ctx, rng, H) {
  const segs = [], spine = [], sites = [], branchInfo = [];
  const wAt = (r) => Math.min(lerp(H.wRoot, H.wTip, clamp((r - R_HUB) / (R_TIP - R_HUB), 0, 1)), Math.max(0.4, r * TAN30 - 0.12));
  const hAt = (r) => lerp(0.80, 0.30, clamp(r / R_TIP, 0, 1));
  // spine tips: four quick pushes at the punch, then one per burst
  const tips = [];
  for (let i = 0; i < 4; i++) tips.push({ r: R_HUB + (R_PUNCH - R_HUB) * (i + 1) / 4, birth: T_PUNCH + i * 0.12, dur: 0.42 });
  const step = (R_TIP - R_PUNCH) / N_BURST;
  for (let k = 0; k < N_BURST; k++) tips.push({ r: R_PUNCH + step * (k + 1), birth: T_BURST0 + k * BURST_DT, dur: 0.5 });
  let prevShoulder = 1.0, prevTip = R_HUB;
  const nodes = [];
  for (let i = 0; i < tips.length; i++) {
    const t = tips[i], lastOne = i === tips.length - 1;
    const w = wAt(t.r), h = hAt(t.r), plate = lastOne && H.endPlate;
    const wf = plate ? 1.9 : w * H.flare;
    const widen = (wf - w) * 0.5774, point = wf * (plate ? 0.5774 : 1.7321), flat = plate ? 1.3 : 0;
    const head = widen + flat + point;
    const o = i === 0 ? 1.0 : prevShoulder - 0.06, L = t.r - o;
    const rings = [{ a: 0, w: i === 0 ? 0.45 : wAt(o), h: hAt(o) }];
    if (i === 0) rings.push({ a: R_HUB - 0.35 - o, w: wAt(R_HUB), h: hAt(R_HUB) });
    rings.push({ a: L - head, w, h });
    rings.push({ a: L - head + widen, w: wf, h: h * (plate ? 1.0 : 0.92) });
    if (plate) rings.push({ a: L - point, w: wf, h });
    segs.push({ ox: 0, oz: o, dx: 0, dz: 1, rings, tip: L, profile: 0, birth: t.birth, dur: t.dur, seed: rng(), level: 0, plate: plate ? { xc: L - point - flat * 0.5, f: flat * 0.5, pt: point } : null });
    spine.push({ r0: o, L, birth: t.birth, dur: t.dur });
    for (let a = Math.max(o, R_HUB + 0.3); a < t.r - head; a += 0.5) sites.push({ x: 0, z: a, y: hAt(a), birth: t.birth + t.dur, hw: wAt(a), ridge: 1 });
    if (i >= 1) nodes.push({ r: prevTip - 0.55 * (prevTip - prevShoulder) , birth: t.birth + 0.04, k: i, w });
    prevShoulder = t.r - head; prevTip = t.r;
  }
  // side branches (right-hand side; mirrored afterwards), at exactly 60 degrees
  const lines = [];
  const pointOk = (x, z, hw) => x > hw && x < z * TAN30 - 0.16 - hw * 0.6 && Math.hypot(x, z) < R_TIP + 0.2
    && Math.hypot(x - NOTCH_X, z - NOTCH_Z) > NOTCH_CLEAR + hw + 0.15;
  const branches = [];
  for (let n = 0; n < nodes.length; n++) {
    const nd = nodes[n], long = (n % 2 === 0);
    const env = Math.min(H.bLen * nd.r, H.bMax, (R_TIP + 0.5 - nd.r) * 0.95 + 0.8);
    let Lb = env * (long ? rng.range(0.86, 1.0) : H.bShort * rng.range(0.8, 1.1));
    const ox = nd.w * 0.5, oz = nd.r - nd.w * 0.5 * COS60 / SIN60;
    const bw = H.bw * (long ? 1 : 0.85) * lerp(1.1, 0.8, nd.r / R_TIP);
    for (let it = 0; it < 14 && Lb > 0.9; it++) {
      if (pointOk(ox + SIN60 * Lb, oz + COS60 * Lb, bw) && pointOk(ox + SIN60 * Lb * 0.6, oz + COS60 * Lb * 0.6, bw)) break;
      Lb *= 0.88;
    }
    if (Lb < 1.0) continue;
    branches.push({ nd, Lb, ox, oz, bw, long, seed: rng() });
    lines.push({ x0: ox, z0: oz, x1: ox + SIN60 * Lb, z1: oz + COS60 * Lb, id: branches.length - 1 });
  }
  await ctx.yield();
  for (let b = 0; b < branches.length; b++) {
    if (b % 3 === 2) await ctx.yield();
    const B = branches[b], nd = B.nd, hb = hAt(nd.r) * 0.82;
    const nseg = Math.max(1, Math.ceil(B.Lb / 2.7)), per = B.Lb / nseg;
    const reach = [];   // [{ a0, a1, t }] when each stretch of the branch exists
    let shoulder = 0;
    for (let j = 0; j < nseg; j++) {
      const birth = j < 2 ? nd.birth + j * 0.26 : Math.min(nd.birth + (j - 1) * BURST_DT, T_BURST0 + (N_BURST - 1) * BURST_DT + 0.04);
      const dur = j < 2 ? 0.36 : 0.5;
      const lastSeg = j === nseg - 1, plate = lastSeg && H.endPlate && B.long && B.Lb > 3.5;
      const w = B.bw * lerp(1, 0.78, (j + 1) / nseg), h = hb * lerp(1, 0.85, (j + 1) / nseg);
      const wf = plate ? 0.95 : w * H.bFlare * (H.endPlate ? 0.62 : 1), widen = (wf - w) * 0.5774;
      const point = wf * (plate ? 0.5774 : 1.7321), flat = plate ? 0.6 : 0, head = Math.min(widen + flat + point, per * 0.8 + (j ? 0.3 : 0));
      const k = head / (widen + flat + point);
      const o = j === 0 ? -0.25 : shoulder - 0.05, tipA = per * (j + 1), L = tipA - o;
      const rings = [{ a: 0, w: j === 0 ? B.bw : B.bw * lerp(1, 0.78, j / nseg), h: j === 0 ? hb : hb * lerp(1, 0.85, j / nseg) }];
      rings.push({ a: L - head, w, h });
      rings.push({ a: L - head + widen * k, w: wf, h: h * (plate ? 1 : 0.92) });
      if (plate) rings.push({ a: L - point * k, w: wf, h });
      segs.push({ ox: B.ox + SIN60 * o, oz: B.oz + COS60 * o, dx: SIN60, dz: COS60, rings, tip: L, profile: 1, birth, dur, seed: rng(), level: 1, plate: plate ? { xc: L - (point + flat * 0.5) * k, f: flat * 0.5 * k, pt: point * k } : null });
      reach.push({ a0: Math.max(o, 0), a1: tipA, t: birth + dur });
      for (let a = Math.max(o, 0.4); a < tipA - head; a += 0.7) sites.push({ x: B.ox + SIN60 * a, z: B.oz + COS60 * a, y: h, birth: birth + dur, hw: w, ridge: 0 });
      shoulder = tipA - head;
    }
    branchInfo.push({ birth: nd.birth, x: B.ox + SIN60 * B.Lb, z: B.oz + COS60 * B.Lb, ox: B.ox, oz: B.oz, L: B.Lb, grown: reach[reach.length - 1].t });
    // twigs: outward ones run parallel to the arm, inward ones lean back at 120 degrees
    let a = rng.range(0.9, 1.3), sideFlip = rng.chance(0.5);
    while (a < B.Lb - 0.7) {
      const rc = reach.find((q) => a <= q.a1) || reach[reach.length - 1];
      for (let sd = 0; sd < 2; sd++) {
        const outer = sd === 0, dx = outer ? 0 : SIN60, dz = outer ? 1 : -COS60;
        if (!outer && (sideFlip = !sideFlip)) continue;
        const bx = B.ox + SIN60 * a, bz = B.oz + COS60 * a;
        let lt = H.twigLen * rng.range(0.55, 1.0) * (outer ? 1 : 0.6) * (0.6 + 0.4 * Math.sin(Math.PI * clamp(a / B.Lb, 0, 1)));
        const tw = H.twigW * rng.range(0.85, 1.15);
        for (let it = 0; it < 10 && lt > 0.45; it++) {
          const tx = bx + dx * lt, tz = bz + dz * lt;
          let ok = pointOk(tx, tz, tw + 0.1);
          for (let q = 0; ok && q < lines.length; q++) if (lines[q].id !== b && (distToSeg(tx, tz, lines[q]) < 0.42 + tw || distToSeg(bx + dx * lt * 0.5, bz + dz * lt * 0.5, lines[q]) < 0.3 + tw)) ok = false;
          if (ok) break;
          lt *= 0.8;
        }
        if (lt <= 0.45) continue;
        const birth = Math.min(burstAfter(rc.t + 0.15) + (rng.chance(0.4) ? BURST_DT : 0), T_BURST0 + (N_BURST - 1) * BURST_DT) + 0.08;
        const head = Math.min(tw * 2.6, lt * 0.6), ht = hb * 0.5;
        segs.push({ ox: bx - dx * 0.1, oz: bz - dz * 0.1, dx, dz, rings: [{ a: 0, w: tw, h: ht }, { a: lt + 0.1 - head, w: tw * 0.9, h: ht * 0.95 }], tip: lt + 0.1, profile: 2, birth, dur: 0.45, seed: rng(), level: 2 });
        // twiglets: a pair of small prongs at 60 degrees on the longer twigs
        if (lt > 1.0) for (let pr = -1; pr <= 1; pr += 2) {
          const ex = dx * COS60 + pr * dz * SIN60, ez = dz * COS60 - pr * dx * SIN60, at = lt * rng.range(0.4, 0.6), lp = lt * rng.range(0.3, 0.42);
          const sx = bx + dx * at, sz = bz + dz * at;
          if (!pointOk(sx + ex * lp, sz + ez * lp, 0.1)) continue;
          segs.push({ ox: sx, oz: sz, dx: ex, dz: ez, rings: [{ a: 0, w: tw * 0.7, h: ht * 0.8 }, { a: lp * 0.5, w: tw * 0.62, h: ht * 0.76 }], tip: lp, profile: 2,
            birth: Math.min(birth + BURST_DT, T_BURST0 + (N_BURST - 1) * BURST_DT + 0.1), dur: 0.4, seed: rng(), level: 2 });
        }
      }
      a += H.twigStep * rng.range(0.8, 1.25) * (B.long ? 1 : 0.8);
    }
  }
  return { segs, spine, sites, branchInfo };
}

function mirrorSegs(segs) {
  const out = [];
  for (const s of segs) {
    out.push(s);
    if (s.level > 0.5) out.push({ ...s, ox: -s.ox, dx: -s.dx });
  }
  return out;
}

// ---------------------------------------------------------------- hub plate
function makeHubGeometry(rng) {
  const prof = [[0.012, 0.695], [0.30, 0.695], [0.42, 0.712], [0.56, 0.712], [0.64, 0.70]];   // low terraces: the rings are lines in the glass, not steps
  let r = 0.64 + rng.range(0.1, 0.25);
  while (r < 2.3) { const wd = rng.range(0.14, 0.3); prof.push([r, 0.70], [r + 0.07, 0.712], [r + 0.07 + wd, 0.712], [r + 0.14 + wd, 0.70]); r += 0.14 + wd + rng.range(0.12, 0.34); }
  prof.push([2.66, 0.70], [2.74, 0.73], [2.9, 0.73], [3.0, 0.6]);
  const full = prof.map((q) => [q[0], q[1]]);
  for (let i = prof.length - 1; i >= 0; i--) full.push([prof[i][0], -prof[i][1]]);
  const SUB = 4, n = 6 * SUB, nr = full.length, nv = nr * n;
  const pos = new Float32Array(nv * 3), org = new Float32Array(nv * 4), axs = new Float32Array(nv * 4), seg = new Float32Array(nv * 4);
  const idx = new Uint16Array((nr - 1) * n * 6), seed = rng();
  let v = 0, ii = 0;
  for (let k = 0; k < nr; k++) {
    const R = full[k][0], y = full[k][1];
    for (let j = 0; j < n; j++) {
      const c = Math.floor(j / SUB), f = (j % SUB) / SUB;
      const a0 = c * Math.PI / 3, a1 = (c + 1) * Math.PI / 3;
      // corners outrun the faces: each face is drawn in a touch at its middle
      const pull = 1 - 0.07 * Math.sin(Math.PI * f) * (R / 3) * (R / 3);
      const x = lerp(Math.sin(a0), Math.sin(a1), f) * R * pull, z = lerp(Math.cos(a0), Math.cos(a1), f) * R * pull;
      pos[v * 3] = x; pos[v * 3 + 1] = y; pos[v * 3 + 2] = z;
      org[v * 4 + 2] = -100; org[v * 4 + 3] = 1; axs[v * 4 + 1] = 1; axs[v * 4 + 2] = seed; axs[v * 4 + 3] = 3;
      seg[v * 4 + 2] = 0.75; seg[v * 4 + 3] = 3; v++;
    }
  }
  for (let k = 0; k < nr - 1; k++) for (let j = 0; j < n; j++) {
    const a = k * n + j, b = k * n + (j + 1) % n, c = a + n, d = b + n;
    idx[ii++] = a; idx[ii++] = c; idx[ii++] = b; idx[ii++] = b; idx[ii++] = c; idx[ii++] = d;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aOrg', new THREE.BufferAttribute(org, 4));
  g.setAttribute('aAx', new THREE.BufferAttribute(axs, 4));
  g.setAttribute('aSeg', new THREE.BufferAttribute(seg, 4));
  g.setAttribute('aPl', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

// ---------------------------------------------------------------- rime beads
const RIME_VERT = /* glsl */`
attribute vec2 aBead;
uniform float uSaT;
varying vec3 vN, vW; varying vec2 vB;
#include <common>
void main(){
  float age = uSaT - aBead.x;
  float x = clamp(age/0.16, 0.0, 1.0);
  float s = x*(1.0 + 0.35*sin(x*3.14159));
  mat4 M = modelMatrix*instanceMatrix;
  vec3 p = position*s;
  vec4 w = M*vec4(p, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(M)*normal + vec3(1e-6, 0.0, 0.0));
  vB = vec2(age, aBead.y);
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
}
`;
const RIME_FRAG = /* glsl */`
varying vec3 vN, vW; varying vec2 vB;
#include <common>
${SIX_ARMS_ENV_GLSL}
${SIX_ARMS_FOG_GLSL}
float rmHash(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719)))*43758.5453); }
void main(){
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  vec3 L = normalize(mix(uSaKeyDir, uSaGoldDir, uSaBelow));
  vec3 lc = mix(uSaKeyCol, uSaGoldCol*1.3, uSaBelow);
  float nl = dot(N, L);
  float grain = 0.86 + 0.28*rmHash(floor(vW*38.0 + vB.y*17.0));
  vec3 col = 0.70*grain*(saEnv(N)*0.62 + lc*(0.42*max(nl, 0.0) + 0.10*max(nl*0.5 + 0.5, 0.0)));
  float rim = 1.0 - max(dot(N, V), 0.0);
  col += saEnv(reflect(-V, N))*rim*rim*0.25;
  float sp = step(0.985, rmHash(floor(vW*55.0) + floor(dot(V, vec3(31.0, 17.0, 23.0)))));
  col += lc*sp*1.6*max(nl, 0.0);
  col += uSaKeyCol*1.4*exp(-max(vB.x, 0.0)*5.0)*step(0.0, vB.x);
  gl_FragColor = vec4(saFog(col, vW), 1.0);
}
`;

// ---------------------------------------------------------------- a second, finished crystal
// The same kind of star with its own seeded plan (rng) and habit, fully grown (its clock is held at 99 s): six
// instanced arms and a hub in the hero's glass. `uniforms` is hero.uniforms. Local space as the hero: lying in the XZ plane,
// radius 30.5; scale the returned Group. About 100k triangles, 2 draw calls.
export async function makeCrystal(ctx, rng, habitName, uniforms) {
  const plan = await planArm(ctx, rng, HABITS[habitName] || HABITS.sector);
  await ctx.yield();
  const geo = await makeSegmentGeometryAsync(ctx, mirrorSegs(plan.segs));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 15), 34);
  await ctx.yield();
  const u = { ...uniforms, uSaT: { value: 99 }, uSaHubS: { value: 1 } };
  const group = new THREE.Group(), arms = new THREE.InstancedMesh(geo, makeIceMaterial(u), 6), m4 = new THREE.Matrix4();
  for (let k = 0; k < 6; k++) arms.setMatrixAt(k, m4.makeRotationY(k * Math.PI / 3));
  arms.instanceMatrix.needsUpdate = true; arms.frustumCulled = false; group.add(arms);
  await ctx.yield();
  const hub = new THREE.Mesh(makeHubGeometry(rng), makeIceMaterial(u));
  hub.frustumCulled = false; group.add(hub);
  await ctx.yield();
  return group;
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('six-arms') : ctx.rng;
  const palette = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const detail = ctx.quality?.detail ?? 1;
  const habitName = opts.habit && HABITS[opts.habit] ? opts.habit : rng.pick(['fern', 'fern', 'sector', 'plate']);
  const H = HABITS[habitName];
  const rimeHeavy = opts.rime ? opts.rime === 'heavy' : rng.chance(0.5);
  const uniforms = makeEnvUniforms(palette);
  const hubS = { value: 0.6 };
  const object = new THREE.Group(); object.name = 'six-arms';

  // --- arms: one arm, drawn six times
  const plan = await planArm(ctx, rng, H);
  await ctx.yield();
  const armGeo = await makeSegmentGeometryAsync(ctx, mirrorSegs(plan.segs));
  armGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 15), 34);
  await ctx.yield();
  const armMat = makeIceMaterial({ ...uniforms, uSaHubS: hubS });
  const arms = new THREE.InstancedMesh(armGeo, armMat, 6);
  const m4 = new THREE.Matrix4(), armDirs = [];
  for (let k = 0; k < 6; k++) { const th = k * Math.PI / 3; arms.setMatrixAt(k, m4.makeRotationY(th)); armDirs.push(new THREE.Vector3(Math.sin(th), 0, Math.cos(th))); }
  arms.instanceMatrix.needsUpdate = true; arms.frustumCulled = false; object.add(arms);

  // --- hub
  await ctx.yield();
  const hubGeo = makeHubGeometry(rng);
  const hub = new THREE.Mesh(hubGeo, makeIceMaterial({ ...uniforms, uSaHubS: hubS }));
  hub.frustumCulled = false; object.add(hub);
  await ctx.yield();

  // --- rime: frozen-on droplets (about 40 big ones) and, on a heavy seed, a moss of small beads on the windward half
  const nCatch = 40, nMoss = Math.round((rimeHeavy ? 260 : 36) * detail), nBead = nCatch + nMoss;
  const beadGeo = new THREE.IcosahedronGeometry(1, 1); beadGeo.scale(1, 0.82, 1);
  const beadAttr = new Float32Array(nBead * 2);
  const rimeMat = new THREE.ShaderMaterial({ vertexShader: RIME_VERT, fragmentShader: RIME_FRAG });
  rimeMat.uniforms = { ...uniforms };
  const rime = new THREE.InstancedMesh(beadGeo, rimeMat, nBead);
  const wind = rng.range(0, Math.PI * 2), wx = Math.sin(wind), wz = Math.cos(wind);
  const q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), p3 = new THREE.Vector3(), s3 = new THREE.Vector3();
  const sites = plan.sites, ridgeSites = sites.filter((s) => s.ridge);
  for (let i = 0; i < nBead; i++) {
    if (i % 60 === 59) await ctx.yield();
    const big = i < nCatch;
    let st, k, sgn, x, z, tries = 0;
    do {
      st = i === 0 ? ridgeSites.reduce((a, b) => (Math.abs(b.z - 20) < Math.abs(a.z - 20) ? b : a)) : (big && rng.chance(0.4) ? rng.pick(ridgeSites) : rng.pick(sites));
      k = i === 0 ? 0 : rng.int(0, 5); sgn = rng.sign();
      const across = i === 0 ? 0 : rng.range(-0.75, 0.75) * st.hw;
      const lx = st.x * sgn + across * (st.ridge ? 1 : 0.5), lz = st.z - (st.ridge ? 0 : across * 0.5 * sgn);
      const th = k * Math.PI / 3;
      x = lx * Math.cos(th) + lz * Math.sin(th); z = -lx * Math.sin(th) + lz * Math.cos(th);
      st._across = across;
    } while (!big && rimeHeavy && x * wx + z * wz < -4 && ++tries < 6);
    const rad = big ? rng.range(0.15, 0.27) : rng.range(0.055, 0.125);
    const onRidge = st.ridge && Math.abs(st._across) < st.hw * 0.14;
    const y = st.y * (onRidge ? 1.0 : 0.8) + rad * 0.45;
    e3.set(rng.range(-0.3, 0.3), rng.range(0, 6.28), rng.range(-0.3, 0.3)); q4.setFromEuler(e3);
    s3.set(rad * rng.range(0.9, 1.1), rad * rng.range(0.85, 1.05), rad * rng.range(0.9, 1.1));
    rime.setMatrixAt(i, m4.compose(p3.set(x, y, z), q4, s3));
    beadAttr[i * 2] = i === 0 ? 24.0 : Math.max(st.birth + rng.range(0.8, 3), big ? rng.range(13, 33) : rng.range(11, 34));
    beadAttr[i * 2 + 1] = rng();
  }
  beadGeo.setAttribute('aBead', new THREE.InstancedBufferAttribute(beadAttr, 2));
  rime.instanceMatrix.needsUpdate = true; rime.frustumCulled = false; object.add(rime);
  await ctx.yield();

  // --- growth clock
  const ease = (x) => { const c = clamp(x, 0, 1); return 1 - (1 - c) * (1 - c) * (1 - c); };
  const hubScale = (s) => 0.6 + 0.2 * ease((s - 1.4) / 0.5) + 0.2 * ease((s - 3.4) / 0.5);
  const tipRadius = (s) => {
    let r = R_HUB * hubScale(s);
    for (const sp of plan.spine) if (s > sp.birth) r = Math.max(r, sp.r0 + sp.L * ease((s - sp.birth) / sp.dur));
    return r;
  };
  let seconds = opts.seconds ?? 0, driven = opts.seconds != null, belowDriven = false;
  const getTips = (s = seconds, out = []) => {
    const r = tipRadius(s);
    let nb = null;
    for (const b of plan.branchInfo) if (b.birth <= s && (!nb || b.birth > nb.birth)) nb = b;
    const g = nb ? clamp((s - nb.birth) / Math.max(nb.grown - nb.birth, 0.1), 0, 1) : 0;
    const bx = nb ? nb.ox + SIN60 * nb.L * g : 0, bz = nb ? nb.oz + COS60 * nb.L * g : r;
    for (let k = 0; k < 6; k++) {
      const th = k * Math.PI / 3, c = Math.cos(th), sn = Math.sin(th);
      (out[k] || (out[k] = new THREE.Vector3())).set(r * sn, 0, r * c);
      (out[k + 6] || (out[k + 6] = new THREE.Vector3())).set(bx * c + bz * sn, 0, -bx * sn + bz * c);
    }
    return out;
  };
  let hubBoost = 1;   // the world's opening shows the hub plate larger than life (setHubBoost); the ring pattern scales with it
  const apply = () => { uniforms.uSaT.value = seconds; const hs = hubScale(seconds); hubS.value = hs; hub.scale.set(hs*hubBoost, 1 + 0.12*(hubBoost - 1), hs*hubBoost); };
  apply();

  const notchPos = new THREE.Vector3(NOTCH_X, 0, NOTCH_Z);
  const burstTimes = [T_PUNCH]; for (let k = 0; k < N_BURST; k++) burstTimes.push(T_BURST0 + k * BURST_DT);
  const setCol = (u, v) => { if (v == null) return; if (v.isColor) u.value.copy(v); else u.value.set(v); };
  const CLOSE = 0;   // artist's close-up check in the viewer (0 = off)
  return {
    object, radius: [30.5, 8, -3.3][CLOSE], height: [60, 50, 4][CLOSE], center: CLOSE === 2 ? new THREE.Vector3(0, 0.6, 17) : new THREE.Vector3(0, 0, 0),
    habit: habitName, rime: rimeHeavy ? 'heavy' : 'clean', uniforms, burstTimes, tipRadius, getTips,
    anchors: {
      hub: new THREE.Vector3(0, 0.75, 0),
      size: { radius: 30.5, thickness: 1.6 },
      skimArm: armDirs[0].clone(), armDirs,
      skim: [[0, 4.5, -9], [0, 2.9, -3], [0, 2.75, 0], [0, 2.7, 6], [0, 2.55, 14], [0, 2.4, 22], [0, 2.35, 29], [0, 3.2, 35]].map((p) => new THREE.Vector3(...p)),
      notch: { position: notchPos.clone(), normal: new THREE.Vector3(0, 1, 0), clear: NOTCH_CLEAR },
      flyThrough: [34, 20, 8, 0, -8, -20, -40].map((y) => new THREE.Vector3(NOTCH_X, y, NOTCH_Z)),
      portalSeat: { position: new THREE.Vector3(NOTCH_X, -36, NOTCH_Z), normal: new THREE.Vector3(0, 1, 0), radius: 7 },
      viewpoints: {
        reveal: new THREE.Vector3(16, 12, 2), above: new THREE.Vector3(6, 26, 30), skimStart: new THREE.Vector3(0, 2.9, -3),
        exitLook: new THREE.Vector3(NOTCH_X, 30, NOTCH_Z),
      },
      tips: armDirs.map((d) => d.clone().multiplyScalar(R_TIP)),
    },
    setSeconds(s) { seconds = s; driven = true; apply(); },
    setProgress(u) { seconds = u * 56; driven = true; apply(); },
    setBelow(k) { uniforms.uSaBelow.value = clamp(k, 0, 1); belowDriven = true; },
    setHubBoost(b) { hubBoost = Math.max(1, b); apply(); },
    hubRadius: (s = seconds) => R_HUB*hubScale(s),
    setEnv(e = {}) {
      setCol(uniforms.uSaFogHi, e.fogHi); setCol(uniforms.uSaFogLo, e.fogLo); setCol(uniforms.uSaKeyCol, e.keyCol);
      setCol(uniforms.uSaGoldCol, e.goldCol); setCol(uniforms.uSaSea, e.sea); setCol(uniforms.uSaCeil, e.ceil);
      if (e.keyDir) uniforms.uSaKeyDir.value.copy(e.keyDir).normalize();
      if (e.goldDir) uniforms.uSaGoldDir.value.copy(e.goldDir).normalize();
    },
    update(dt, time) {
      uniforms.uSaClock.value = time;
      if (!driven) {
        seconds = time % 56; apply();
        if (!belowDriven) uniforms.uSaBelow.value = smoothstep(40, 43, seconds);
      }
    },
    dispose() {},
    ground: false, groundY: -0.8,
  };
}
