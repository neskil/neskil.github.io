// THE FIVE SISTERS: hero set piece "a colonnade of waterspouts" (procedural; imports three and kit/core only).
//
// WHAT     Six waterspouts (five standing, one being born as the thin sister dies). Each is ONE translucent hollow
//          tube whose spine, trumpet top, S-bend, kink and foot are computed in the vertex shader; the fragment
//          shader shades it as a hollow shell (dense bright limbs, thin middle) and ray-casts analytically to the
//          far wall and a lit core (a soft glow that wanders and swells, never a ruled stripe; at night the bands'
//          contrast is halved: uBandK) so both show through the near wall (inside about 400 m the far wall also closes
//          the middle to the world behind: another sister standing behind must not draw a line down it). Three scales of helical bands spin on it
//          (and are real relief: the silhouette is braided). Round each: shed vapour rags (soft instanced cards),
//          a spinning torn spray crown: mostly sprites on spiral ballistic tracks (crown, foot sheath, sun glitter;
//          each a torn sheet drawn out along its track and eroded to rags and drops, never a disc; capped at 0.18 of
//          the frame height and gone inside 12 m) over a faint displaced skirt mesh that dissolves at every fold and up close; a dark soft-rimmed
//          "stain" on the sea whose foam is drawn into streaks along the spiral flow (from the spray ring outward
//          broken into dashes and veined lace 1-2 m wide), with curved arms, a contact ring and tufts of sargassum;
//          and a collar of lowered indigo cloud (pouched and creased like the base, its sunward flanks lit) where the
//          trumpet enters the base. Close to (inside ~150 m) the
//          shell's middle half is thinnest and soft grain shows inside the braids (it climbs with them and is only
//          brushed by the light: no ruled hairlines); low down it is dense with spray. From 60 to 400 m the near wall
//          carries ROPES (ridged strands 3 and 6.5 m across on the middle bands' helix: the crisp spiral that the braids'
//          soft noise lacks at that range; inside 110-200 m, `nearR`, they are twice as strong in the tone and hold to a
//          coarser footprint, so the wall beside the eye, looked along or down on, is strands and not a smear;
//          on the climb round S5 (the eye above 130 m, `dnK`) that reach is 240-420 m and the lay of the ropes is
//          drawn as thin dark grooves with an edge a pixel and a half wide) and its sunward limb a bright rim. At arm's length the near wall also
//          carries THREADS: ridged ropes of water 1 m and 0.5 m across (metres of arc, so the same on every sister),
//          climbing with the braids on their own slow turn (uniform uThr, 0.3 of the spin), bright with soft flanks; they
//          fade before they fall under about three pixels (finer, they were a moire of ruled lines on the wall 100 m
//          off). Rags are torn at two scales with a lit top; from above 40-90 m a rag at or below the eye fades inside
//          300 m and is gone inside 120 m (it was a milky blur over the sea). Looked down on from above
//          (steepK in STAIN_FRAG) a stain is darker and its arms run on as curved streaks with fewer loose dashes.
// SIZE     Local space = the brief's world space shifted by anchors.origin: local = world - (0,0,-930).
//          Origin on the sea (y 0) at the middle of the line; the camera arrives from +Z flying toward -Z; +X east.
//          Sisters (local x,z): S1 (55,550) S2 (-55,320) S3 big (65,90) S4 thin, dies (-120,-130) S5 collar (70,-220)
//          S6 newborn (40,-550). All 620 m tall. radius 440 (the five standing sisters; the line with the newborn
//          is 1,100 m long), height 620. Do not rotate the object (the light-bar projection assumes local = world
//          axes); translate and mirror (opts.mirror) only.
// OPTS     palette     7 hex strings in the brief's order (turquoise, cobalt, jade-ink, ivory, indigo, slate, accent)
//          mood        'afternoon' (default) | 'noon' | 'lastlight' | 'night': tube/spray light colours
//          sunDir      Vector3 TOWARD the sun, world space (default west-south-west, 22 degrees up)
//          sunColor, shadowColor, bounceColor   linear THREE.Color overrides of the mood
//          height      (620) cloud-base height;  mirror (false) mirror the whole layout in X
//          layout      [[x,z,waistDiameter,trumpetDiameter], ...] six entries, local space (default: the brief)
//          dying (3), newborn (5)   indices of the sister that dies and the one that is born
//          collars (true), stains (true), fringe (true), spray (true)   switch layers off if the world draws them
//          seaY        (0.35) height of the stain discs above the origin (lift above your wave crests)
//          patchMin    (0.5) key light left inside the cloud-shadow gaps between sun patches
//          seat        [x, y, z] the portal seat, unmirrored local (default 477, 520, -305); approach [x, y, z] where the
//                      final straight starts (default 70, 285, -305). Round the seat the part lowers the cloud base into
//                      a BAY (ring wall, roof, mouth toward the approach, two shelves trailing back either side of the
//                      line of approach; mesh 'portal-bay', collar shader, lantern glow and a warm sun bar across the
//                      mouth; bay: false leaves it out; hero.bayHeight(x, z) = its underside; hero.bayBar = the bar).
//                      The scud that lines it (puffs, rags, tags) and the lantern are the world's.
//          timeline    { thin, kink, rope, gone, spot, ring, finger, down } path-progress keys (see setProgress)
// PER SEED spin sense (all one way) and rate, braid count and band character per sister, waist and trumpet size
//          (+-10%), bend amplitudes and phases, base walk, collar lobes, spray lobes, stain arm count.
// PROGRESS hero.setProgress(u): path progress 0..1 as in the brief (44 s flight). The thin sister thins from
//          u .26, kinks at .32 (14 s), is a rope by .386 (17 s) and is drawn up into the cloud by .455 (20 s), her
//          spray ring collapsing; the newborn's dark spot grows from .34, its spiral arms from .38, its spray ring
//          from .43, and only then (.50 -> .74) a finger lowers from the cloud to meet it. Until setProgress is
//          first called the piece previews that cycle on a 44 s loop of the `time` passed to update().
//          hero.setLife(i, { foot, thin, kink, taper, spray, stain, arms, alpha }) overrides one sister directly.
//          hero.setLight({ sunDir, sunColor, shadowColor, bounceColor, patchMin }) at any time.
//          hero.spineAt(i, y, target) -> local axis position of sister i at height y NOW (target.w = wall radius):
//          use it for points of interest, bird orbits and clearance checks.  hero.sisters[i] holds the numbers.
//          hero.PATCH_GLSL + hero.patchUniforms: the sliding sun-patch mask (float wsPatch(vec2 localXZ)) so the
//          world's sea dressing can use the same light bars that cross the tubes.
// ANCHORS  (local space)  origin: add this to local to get the brief's world coordinates (0,0,-930)
//          sisters[i] { base, top, waist, ring }   portalSeat { position (477,520,-305), normal, radius 10 }
//          flyThrough: the brief's slalom and helix as ordered points; clearance from every wall and spray ring
//          is at least 12 m with the worst-case bend.  closePass, helixCentre, entry, viewpoints [{position,target}]
// LIGHTING Self-lit custom shaders: they do NOT read scene lights (vapour is not a Lambert surface). One key from
//          opts.sunDir (ivory, peaks near 0.85), blue-violet shadow, turquoise sea bounce low down, a warm
//          forward-scatter glow when the sun is behind a tube, sliding sun patches (never darker than patchMin).
//          Scene fog is honoured (FogExp2 or Fog). Only spray glitter exceeds 1 (2-4) for bloom.
// COST     about 107k triangles, 32 draw calls (6 tubes, 6 skirts, 6 rag sets, 6 sprite sets, 6 collars, the bay, stains),
//          6 programs, no lights, no textures, ~130 ms build. Everything is transparent, depthWrite off, sorted per
//          sister (stains renderOrder -2, collars -1, the rest 0 for the nearest sister down to -0.05 for the farthest,
//          ranked every frame in update()): draw the world's sea and cloud ceiling before it.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const N_SP = 6;
// Artist's close-up switch for the part viewer (null in the shipped file): { center:[x,y,z], radius, height }
const VIEW = null;
const DEFAULT_PALETTE = ['#19C2B8', '#0B4F9E', '#0E3B3C', '#F3E8CF', '#2B3157', '#66728C', '#D2542E'];
const ORIGIN_Z = -930; // local = world - (0,0,ORIGIN_Z)
// x, z (local), waist diameter, trumpet diameter, spray ring diameter, collar radius, collar drop
const DEFAULT_LAYOUT = [
  [55, 550, 26, 110, 150, 150, 26],
  [-55, 320, 34, 130, 150, 165, 30],
  [65, 90, 60, 190, 150, 200, 40],
  [-120, -130, 16, 80, 80, 130, 20],
  [70, -220, 34, 130, 150, 230, 120],
  [40, -550, 22, 90, 90, 140, 24],
];

// ---------------------------------------------------------------- shared GLSL
const NOISE_GLSL = /* glsl */`
float wsHash(vec3 p){ p = fract(p*0.3183099 + vec3(0.71, 0.113, 0.419)); p *= 17.0; return fract(p.x*p.y*p.z*(p.x + p.y + p.z)); }
float wsNoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f*f*(3.0 - 2.0*f);
  return mix(mix(mix(wsHash(i), wsHash(i + vec3(1,0,0)), f.x), mix(wsHash(i + vec3(0,1,0)), wsHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(wsHash(i + vec3(0,0,1)), wsHash(i + vec3(1,0,1)), f.x), mix(wsHash(i + vec3(0,1,1)), wsHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float wsFbm(vec3 p){ return 0.55*wsNoise(p) + 0.3*wsNoise(p*2.13 + 7.1) + 0.15*wsNoise(p*4.7 + 3.3); }
`;

// Sliding sun patches / light bars (150-400 m wide). xz in hero-local metres. uPatch = (offset x, offset z, minimum, scale).
const PATCH_GLSL = /* glsl */`
uniform vec4 uPatch;
float wsPatch(vec2 xz){
  vec2 q = (xz + uPatch.xy)/uPatch.w;
  float n = 0.8*wsNoise(vec3(q, 3.7)) + 0.2*wsNoise(vec3(q*1.9 + 11.0, 9.1));
  return mix(uPatch.z, 1.0, smoothstep(0.30, 0.60, n));
}
`;

// Spine, radius profile and helical bands. Per sister: A = (lean x, lean z, foot y, tip taper 0..1),
// B = (bend1 x, bend1 z, bend2 x, bend2 z), C = (waist radius, trumpet radius, kink metres, thin 0..1),
// D = (kink dir x, kink dir z, braid count, seed).
const SPINE_GLSL = /* glsl */`
uniform float uH;
vec3 wsSpine(float y, vec4 A, vec4 B, vec4 C, vec4 D){
  float s = clamp(y/uH, 0.0, 1.0);
  vec2 o = A.xy*s + B.xy*sin(3.14159*s) + B.zw*sin(6.28318*s);
  float tent = max(1.0 - 2.0*sqrt((s - 0.5)*(s - 0.5) + 0.0012), 0.0);
  o += D.xy*C.z*tent;
  return vec3(o.x, y, o.y);
}
float wsRadius(float y, vec4 A, vec4 C, float rmin){
  float rw = C.x*C.w;
  float d = max(uH - y, 0.0);
  float flare = 0.58*exp(-d/38.0) + 0.42*exp(-d/78.0);
  float r = rw*(1.0 + 0.16*exp(-y/50.0)) + max(C.y*mix(1.0, C.w, 0.6) - rw, 0.0)*flare;
  r = max(r, rmin);
  float tp = smoothstep(0.0, 70.0, y - A.z);
  return r*mix(1.0, 0.04 + 0.96*tp, A.w);
}
// psi = angle*dir (radians), y metres, rw waist radius, spin = three band phases. Returns density 0..1.2;
// relief (-0.5..0.5) is the part the mesh is displaced by.
float gFine;   // the close-up grain that the last wsBands call added to its density (lit gently: see TUBE_FRAG)
float wsBands(float psi, float y, float rw, vec3 spin, float braids, float seed, vec2 lod, out float relief){
  gFine = 0.0;
  float h = y/max(rw, 1.0);
  float q1 = psi + spin.x - h*0.95;
  float w = wsNoise(vec3(cos(q1)*0.9, sin(q1)*0.9, h*0.21 + seed));
  float w2 = wsNoise(vec3(cos(q1)*1.7 + 3.0, sin(q1)*1.7, h*0.62 - seed));
  float b1 = 0.5 + 0.5*sin(braids*q1 + 7.5*w + 3.0*w2);
  b1 = mix(b1, smoothstep(0.22, 0.78, w2), 0.55);
  float q2 = psi + spin.y - h*1.55;
  float n2 = wsNoise(vec3(cos(q2)*3.1 + seed, sin(q2)*3.1, h*0.5));
  float q3 = psi + spin.z - h*2.3;
  float n3 = wsNoise(vec3(cos(q3)*8.5, sin(q3)*8.5 + seed, h*1.35));
  relief = 0.45*(b1 - 0.5) + 0.55*(n2 - 0.5);
  float d = 0.27 + 0.40*b1 + 0.38*n2 + 0.24*mix(0.5, n3, lod.x);
  if (lod.y > 0.01) {
    float q4 = psi - spin.y*0.6 - h*2.3 + 0.5*(n2 - 0.5);                                 // climbs with the braids (about 24 degrees) and wanders with them
    float n4 = wsNoise(vec3(cos(q4)*13.0 + seed, sin(q4)*13.0, h*2.5));
    float n5 = wsNoise(vec3(cos(q4)*31.0, sin(q4)*31.0 + seed, h*7.0));
    n4 = mix(n4, smoothstep(0.2, 0.8, n4), 0.5*lod.y);                                     // soft grain inside the braids, not ruled hairlines
    gFine = lod.y*(0.35 + 0.9*n2)*(0.2*(n4 - 0.5) + 0.11*(n5 - 0.5)*lod.y);
    d += gFine;
  }
  return d;
}
`;

// Vapour lighting shared by tube, rags, spray and collars. N outward normal, V from the camera to the point.
const LIGHT_GLSL = /* glsl */`
uniform vec3 uSunDir, uSunCol, uShadowCol, uBounceCol;
vec3 wsLit(vec3 N, vec3 V, float dens, float sunP, float y, float relief){
  float ndl = dot(N, uSunDir);
  float wrap = clamp((ndl + 0.22)/1.22, 0.0, 1.0); wrap = wrap*wrap*(3.0 - 2.0*wrap);
  float key = wrap*sunP*relief;
  float low = exp(-max(y, 0.0)/110.0);
  vec3 sh = uShadowCol*(0.78 + 0.22*N.y + 0.25*dens) + uBounceCol*(0.10 + 0.55*low)*(0.6 - 0.4*N.y);
  vec3 col = sh*(1.0 - 0.8*key) + uSunCol*key*(0.74 + 0.30*dens);
  float fs = max(dot(V, uSunDir), 0.0); fs = fs*fs; fs = fs*fs;
  col += uSunCol*vec3(1.0, 0.86, 0.62)*fs*sunP*(0.75 - 0.4*dens);
  return col;
}
`;

// ---------------------------------------------------------------- the tube
const TUBE_VERT = /* glsl */`
uniform vec4 uA, uB, uC, uD;
uniform vec3 uSpin;
uniform float uPx, uDir, uRelief;
varying vec3 vWP, vWC, vWA, vWN, vWE1, vLP;
varying float vR, vY;
#include <fog_pars_vertex>
${NOISE_GLSL}
${SPINE_GLSL}
float gRmin;
void wsFrame(float y, out vec3 c, out vec3 T, out vec3 e1, out vec3 e2){
  c = wsSpine(y, uA, uB, uC, uD);
  T = normalize(wsSpine(y + 2.0, uA, uB, uC, uD) - wsSpine(y - 2.0, uA, uB, uC, uD) + vec3(0.0, 1e-3, 0.0));
  e1 = normalize(vec3(1.0, 0.0, 0.0) - T*T.x);
  e2 = cross(T, e1);
}
vec3 wsSurf(float a, float y){
  vec3 c, T, e1, e2; wsFrame(y, c, T, e1, e2);
  float rel; wsBands(a*uDir, y, uC.x, uSpin, uD.z, uD.w, vec2(1.0, 0.0), rel);
  float r = wsRadius(y, uA, uC, gRmin)*(1.0 + uRelief*rel);
  return c + r*(cos(a)*e1 + sin(a)*e2);
}
void main(){
  float a = position.x*6.2831853;
  float t = position.y;
  float y = mix(uA.z, uH, 0.45*t + 0.55*t*t);
  vec3 c, T, e1, e2; wsFrame(y, c, T, e1, e2);
  vec3 wc = (modelMatrix*vec4(c, 1.0)).xyz;
  gRmin = 1.25*distance(wc, cameraPosition)/max(uPx, 1.0);
  vec3 p = wsSurf(a, y);
  float da = 0.05, dy = max(0.03*uC.x, 0.6);
  vec3 ta = wsSurf(a + da, y) - wsSurf(a - da, y);
  vec3 ty = wsSurf(a, y + dy) - wsSurf(a, y - dy);
  vec3 n = cross(ta, ty);
  vec3 rad = p - c;
  if (dot(n, rad) < 0.0) n = -n;
  n = normalize(n + rad*1e-5 + vec3(1e-6));
  mat3 m3 = mat3(modelMatrix);
  vec4 wp = modelMatrix*vec4(p, 1.0);
  vWP = wp.xyz; vWC = wc; vWA = normalize(m3*T); vWN = normalize(m3*n); vWE1 = normalize(m3*e1);
  vLP = p; vY = y; vR = length(m3[0]);
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}
`;

const TUBE_FRAG = /* glsl */`
uniform vec4 uA, uB, uC, uD;
uniform vec3 uSpin;
uniform vec2 uBase;
uniform float uDir, uAlpha, uTau, uTime, uBandK, uThr;
varying vec3 vWP, vWC, vWA, vWN, vWE1, vLP;
varying float vR, vY;
#include <fog_pars_fragment>
${NOISE_GLSL}
${PATCH_GLSL}
${SPINE_GLSL}
${LIGHT_GLSL}
// Path length through the near half of a hollow shell whose inner face is soft: the cusp where the line of sight first
// grazes the hollow is rounded off, so the dense limb feathers into the thin middle over about a fifth of the tube's width.
float wsShell(float mu){
  float t = mu*mu - 0.42, sm = 0.5*(t + sqrt(t*t + 0.012));
  return max(mu - 1.2*(sqrt(sm + 0.02) - 0.1414), 0.0)/0.56;
}
void main(){
  vec3 V = normalize(vWP - cameraPosition);
  vec3 A = normalize(vWA);
  vec3 d = vWP - vWC; d -= A*dot(d, A);
  float dl = max(length(d), 1e-3); vec3 dn = d/dl;
  vec3 Vp = V - A*dot(V, A); float vpl = max(length(Vp), 0.08); vec3 Vn = Vp/vpl;
  vec3 N = normalize(vWN);
  float mu0 = clamp(-dot(dn, Vn), 0.0, 1.0);
  float obl = min(1.0/vpl, 1.7);
  float camD = distance(vWP, cameraPosition);
  float thinK = mix(0.25, mix(0.58, 0.86, smoothstep(250.0, 800.0, camD)), smoothstep(130.0, 290.0, camD));   // the shell's middle is thin (thinnest close to): the far wall and core show through
  float lowN = 1.0 - smoothstep(20.0, 90.0, vY);                   // spray-laden and dense low down: the horizon never shows through a foot
  vec3 e1 = normalize(vWE1 - A*dot(vWE1, A) + vec3(1e-5, 0.0, 0.0));
  vec3 e2 = cross(A, e1);
  float phi = atan(dot(dn, e2), dot(dn, e1) + 1e-6);
  float rw = uC.x;
  // sun sunP mask: follow the light ray down to the sea
  vec2 sl = uSunDir.xz/max(uSunDir.y, 0.1);
  float sunP = wsPatch(vLP.xz + uBase - sl*vLP.y);
  // near wall
  float rel, rel2;
  float fp = length(fwidth(vWP));
  vec2 lod = vec2(1.0 - smoothstep(0.35, 0.9, fp*8.5/max(rw, 1.0)), 1.0 - smoothstep(0.45, 1.3, fp*23.0/max(rw, 1.0)));
  float dn1 = wsBands(phi*uDir, vY, rw, uSpin, uD.z, uD.w, lod, rel), fine1 = gFine;
  float st = dot(uSunDir, cross(A, dn));
  float dn2 = wsBands((phi + 0.11*clamp(st*3.0, -1.0, 1.0))*uDir, vY + 0.14*rw*dot(uSunDir, A), rw, uSpin, uD.z, uD.w, lod, rel2), fine2 = gFine;
  float relief = clamp(1.0 + uBandK*(3.2*(dn1 - dn2) - 2.3*(fine1 - fine2)), mix(0.35, 0.5, lod.y), 1.14);   // the braids are carved by the light; the grain inside them is only brushed by it (close to, the shaded side of a braid is never a dark blotch)
  // At arm's length (inside about 150 m) the wall is ropes of water and mist: threads 0.7 m and 0.3 m across and some
  // metres long, in metres of arc (the same size on a thin sister and on the big one), climbing with the braids and
  // turning with them. Ridged, so each is a bright line with a soft flank: they stay sharp where the braids' own noise
  // is a stretched blur. They fade out as they fall under a pixel.
  float thr = 0.0, l6 = (1.0 - smoothstep(0.15, 0.42, fp))*lod.y;                         // (a 1 m thread under about 3 px is a row of ruled lines: a moire on the wall 100 m off)
  if (l6 > 0.01) {
    float q6 = phi*uDir - uThr - vY/max(rw, 1.0)*2.3 + 0.5*(dn1 - 0.6);              // (uThr: their own slow turn, a third of the braids' rate, so a thread moves a fraction of its width per frame)
    float t1 = wsNoise(vec3(cos(q6)*rw + uD.w, sin(q6)*rw, vY*0.1));
    float t2 = wsNoise(vec3(cos(q6)*rw*2.1, sin(q6)*rw*2.1 + uD.w, vY*0.22));
    float r1 = 1.0 - abs(2.0*t1 - 1.0), r2 = 1.0 - abs(2.0*t2 - 1.0);
    thr = l6*(0.6*(r1*r1*r1 - 0.22) + 0.4*(r2*r2*r2 - 0.22)*(1.0 - smoothstep(0.07, 0.2, fp)));
    dn1 += 0.3*thr;
  }
  // ROPES. Between the braids (tens of metres) and the threads (a metre) the wall is twisted ropes of vapour 3 m and
  // 6.5 m across (metres of arc, so the same on every sister), riding the middle bands' own helix and spin: ridged, so
  // each is a crisp bright strand with a shaded groove beside it where the braids' noise alone is a soft smear. They
  // carry the wall from 60 to 400 m (the threads are under a pixel there) and fade before a strand is under two pixels.
  float dnK = smoothstep(60.0, 130.0, cameraPosition.y);                                     // on the climb round her (the slalom flies below 40 m): the wall is seen along its length, above and below the eye, out to 400 m
  float nearR = 1.0 - smoothstep(mix(110.0, 240.0, dnK), mix(200.0, 420.0, dnK), camD);      // (beside the wall, looked along or down on: the strands stay to a coarser footprint and carry more of the tone, or the wall there is the braids' soft smear alone)
  float rope = 0.0, lR = 1.0 - smoothstep(mix(0.9, 1.5, nearR), mix(2.2, 3.4, nearR), fp);
  if (lR > 0.01) {
    float q7 = phi*uDir + uSpin.y - vY/max(rw, 1.0)*1.55 + 0.3*(dn1 - 0.6);
    float a1 = wsNoise(vec3(cos(q7)*rw/3.0 + uD.w, sin(q7)*rw/3.0, vY/24.0));
    float a2 = wsNoise(vec3(cos(q7)*rw/6.5, sin(q7)*rw/6.5 + uD.w, vY/45.0 + 3.0));
    float k1 = 1.0 - abs(2.0*a1 - 1.0), k2 = 1.0 - abs(2.0*a2 - 1.0);
    float bund = smoothstep(0.3, 0.62, wsNoise(vec3(cos(q7)*rw/15.0 + 5.0, sin(q7)*rw/15.0 + uD.w, vY/70.0)));   // in bundles, with smooth wall between: an even hatch reads as cloth
    float crisp = nearR*dnK, w1 = clamp(1.0*fp, 0.035, 0.3), w2 = clamp(0.46*fp, 0.035, 0.3);   // on the climb the lay of the ropes is drawn: between the pale strands run thin dark GROOVES with an edge a pixel and a half wide whatever the distance (on an ivory wall a pale ridge 20 px across was a smear; a groove reads)
    float r1 = mix(k1*k1*k1 - 0.25, 0.15 - 0.6*smoothstep(0.82 - w1, 0.82 + w1, k1), crisp), r2 = mix(k2*k2*k2 - 0.25, 0.15 - 0.6*smoothstep(0.82 - w2, 0.82 + w2, k2), crisp);
    rope = lR*(0.2 + 0.8*bund)*(0.4*r1*(1.0 - smoothstep(mix(0.25, 0.4, nearR), mix(0.7, 1.1, nearR), fp)) + mix(0.62, 0.8, crisp)*r2);
    dn1 += mix(0.32, mix(0.46, 0.54, dnK), nearR)*rope;
  }
  float edge = smoothstep(0.0, 0.13, mu0);
  float dA = mix(0.74, 0.48, uBandK) + 0.52*uBandK*smoothstep(0.3, 1.0, dn1);   // (uBandK: under the moon the bands have half their contrast, so the limbs are braids, not a ladder of white ticks)
  float mu = clamp(mu0 + 0.08*(dn1 - 0.78)*smoothstep(0.2, 0.5, mu0), 0.0, 1.0);   // the shell's thickness follows the smooth cylinder (not the braided relief: that drew a faceted crease); the braids only fray the limb's inner edge
  float aN = (1.0 - exp(-uTau*(1.0 + 1.7*lowN)*wsShell(mu)*dA*obl*mix(1.0, mix(thinK, 1.0, 0.8*lowN), smoothstep(mix(0.45, 0.6, smoothstep(190.0, 350.0, camD)), 0.95, mu))))*edge;
  vec3 cN = wsLit(N, V, dn1, sunP, vY, relief)*mix(mix(0.79, 0.52, uBandK), 1.06, smoothstep(0.36, 1.05, dn1))*max(1.0 + uBandK*(0.7*thr + mix(0.62, 1.25, nearR)*rope), 0.3);
  cN *= 1.0 + 0.26*(1.0 - smoothstep(0.06, 0.5, mu0))*clamp(0.55 + dot(dn, uSunDir), 0.0, 1.0)*sunP;   // a bright rim on the limb that faces the light
  cN *= min(1.0, 1.04/max(max(cN.r, cN.g), max(cN.b, 1e-3)));                                  // (strands and rim keep their colour: nothing on the wall blooms)
  // far wall, found analytically on the local cylinder
  float s = 2.0*dl*mu0/vpl;
  float yF = vY + s*dot(V, A)/max(vR, 1e-3);
  vec3 dF = d + Vp*s; vec3 dFn = dF/max(length(dF), 1e-3);
  float phiF = atan(dot(dFn, e2), dot(dFn, e1) + 1e-6);
  float relF;
  float dnF = wsBands(phiF*uDir, yF, rw, uSpin, uD.z, uD.w, vec2(lod.x, 0.0), relF);
  float inF = smoothstep(uA.z, uA.z + 20.0, yF)*(1.0 - smoothstep(uH - 30.0, uH - 4.0, yF));
  float aF = (1.0 - exp(-uTau*1.25*(1.0 + 1.7*(1.0 - smoothstep(20.0, 90.0, yF)))*wsShell(mu0)*(0.30 + 0.70*smoothstep(0.3, 1.0, dnF))*obl))*inF;
  // Close to, the tube is 30-60 m of cloud: what stands behind it (another sister, a lit cloud edge) must not draw a line
  // down its middle. The far wall takes up the slack there, so the middle shows the far wall's bands and the core, not the world.
  aF = 1.0 - (1.0 - aF)*(1.0 - 0.8*smoothstep(uA.z, uA.z + 20.0, yF)*smoothstep(0.15, 0.6, mu0)*(1.0 - smoothstep(160.0, 420.0, camD)));
  vec3 cF = wsLit(normalize(mix(dFn, -dFn, 0.3) + vec3(0.0, 1e-4, 0.0)), V, dnF, sunP, yF, 1.0)*mix(mix(0.55, 0.15, uBandK), 1.0, smoothstep(0.36, 1.05, dnF))*vec3(0.84, 0.92, 1.10);   // counter-moving bands, in strong contrast
  // lit core: a soft glow seen through the wall. It wanders a quarter of the tube's width, swells and thins every
  // 30-60 m of height and is dimmed where the far wall's counter-moving bands cross it: never a ruled stripe
  float lat = dot(dn, cross(A, Vn));                                         // -1..1 across the tube as seen
  float yM = 0.5*(vY + yF);
  float cn = wsNoise(vec3(uD.w, yM/(rw*2.2) - uTime*0.9, 1.7))*wsNoise(vec3(4.0, yM/(rw*0.6) - uTime*2.1, uD.w));
  float swell = 0.4 + 0.6*wsNoise(vec3(uD.w + 2.0, yM/44.0 - uTime*0.5, 3.3));
  float offC = 0.15*sin(yM*0.05 + uTime*0.4 + uD.w) + 0.1*sin(yM*0.021 - uTime*0.23 + 2.0*uD.w);
  float cw = 1.0 - smoothstep(0.0, 0.63*swell, abs(lat - offC));
  float aC = cw*cw*(0.12 + 0.80*cn)*swell*(1.0 - 0.6*smoothstep(0.45, 0.95, dnF))*inF*smoothstep(0.25, 0.9, uC.w);
  vec3 cC = uSunCol*(0.55 + 0.6*sunP) + uShadowCol*0.35;
  // composite far -> core -> near
  vec3 acc = cF*aF;
  float al = aF;
  acc = mix(acc, cC, aC); al = al + (1.0 - al)*aC;
  acc = acc*(1.0 - aN) + cN*aN; al = al + (1.0 - al)*aN;
  float vfade = smoothstep(uA.z, uA.z + 30.0 + 45.0*uA.w, vY)*(1.0 - smoothstep(uH - 34.0, uH - 6.0, vY));
  al *= vfade*uAlpha;
  gl_FragColor = vec4(acc/max(al/max(vfade*uAlpha, 1e-3), 1e-3), al);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------- vapour rags shed off the wall (instanced cards)
// aI = (height fraction, start angle 0..1, size, phase), aJ = (rate 1/s, outward throw, tumble, shade)
const RAG_VERT = /* glsl */`
uniform vec4 uA, uB, uC, uD;
uniform vec3 uSpin, uWind;
uniform vec2 uBase;
uniform float uDir, uTime, uOmega, uAlpha;
attribute vec4 aI, aJ;
varying vec2 vUv; varying vec3 vCol; varying float vAl, vSeed;
#include <fog_pars_vertex>
${NOISE_GLSL}
${PATCH_GLSL}
${SPINE_GLSL}
${LIGHT_GLSL}
void main(){
  float p = fract(uTime*aJ.x + aI.w);
  float lifeT = 1.0/aJ.x;
  float y0 = mix(uA.z + 24.0, uH - 60.0, aI.x);
  float y = y0 + p*lifeT*(1.5 + 3.0*aJ.z);
  vec3 c = wsSpine(y, uA, uB, uC, uD);
  float r = wsRadius(y, uA, uC, 0.0);
  float ang = aI.y*6.2831853 + uDir*(uSpin.x*0.0 + uOmega*0.45*lifeT*(p - 0.42*p*p));
  vec3 radial = vec3(cos(ang), 0.0, sin(ang));
  float lee = 0.5 + 0.5*dot(radial.xz, uWind.xy);
  float rr = r*(0.96 + aJ.y*(0.2 + 1.1*lee)*p*p) + 2.0*p;
  vec3 lp = c + radial*rr + vec3(uWind.x, 0.0, uWind.y)*(uWind.z*p*p*lifeT*(0.4 + 0.6*lee));
  vec4 wp = modelMatrix*vec4(lp, 1.0);
  vec3 toCam = cameraPosition - wp.xyz; float dist = length(toCam); toCam /= max(dist, 1e-3);
  vec3 wr = normalize(mat3(modelMatrix)*radial);
  float facing = dot(wr, normalize(vec3(toCam.x, 0.0, toCam.z) + vec3(1e-4, 0.0, 0.0)));
  float limb = smoothstep(-0.55, 0.05, facing)*mix(0.22, 1.0, smoothstep(0.80, 0.35, abs(facing)));
  float across = rr*sqrt(max(1.0 - facing*facing, 0.0))/max(r, 0.5);
  float show = max(limb, smoothstep(1.25, 1.9, rr/max(r, 0.5)))*mix(0.18, 1.0, max(smoothstep(0.85, 1.15, across), smoothstep(0.1, -0.3, facing)*smoothstep(1.0, 1.3, across)));
  float size = aI.z*(3.0 + 0.42*max(r, 3.0))*(0.6 + 1.1*p)*length(mat3(modelMatrix)[0]);
  float rot = uDir*(0.6 + 0.5*p) + (aJ.z - 0.5)*2.4;
  vec2 q = vec2(position.x*(1.3 + 1.2*aJ.w), position.y);
  q = vec2(q.x*cos(rot) - q.y*sin(rot), q.x*sin(rot) + q.y*cos(rot));
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), -toCam) + vec3(1e-4, 0.0, 0.0));
  vec3 up = cross(-toCam, right);
  wp.xyz += (right*q.x + up*q.y)*size;
  vUv = position.xy; vSeed = aJ.w*37.0 + floor(uTime*aJ.x + aI.w)*3.1;
  vec2 sl = uSunDir.xz/max(uSunDir.y, 0.1);
  float sunP = wsPatch(lp.xz + uBase - sl*lp.y);
  vec3 N = normalize(wr*0.25 + toCam*0.3 + uSunDir*0.75 + vec3(0.0, 0.3, 0.0));
  vCol = wsLit(N, -toCam, 0.55 + 0.3*aJ.w, sunP, y, 1.0)*(0.9 + 0.2*aJ.w);
  float life = smoothstep(0.0, 0.16, p)*(1.0 - smoothstep(0.5, 1.0, p));
  float span = smoothstep(uA.z, uA.z + 40.0, y)*(1.0 - smoothstep(uH - 70.0, uH - 20.0, y));
  vAl = uAlpha*life*show*span*smoothstep(10.0, 45.0, dist)*(0.36 + 0.36*lee)*smoothstep(0.1, 0.5, uC.w);
  vAl *= 1.0 - smoothstep(40.0, 90.0, cameraPosition.y)*(1.0 - smoothstep(120.0, 300.0, dist))*(1.0 - smoothstep(10.0, 50.0, wp.y - cameraPosition.y));   // from the helix a rag at or below the eye and close by is a milky blur over the sea: gone inside 120 m, whole again at 300 m (one well above the eye stands against the cloud and stays)
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}
`;
const RAG_FRAG = /* glsl */`
uniform float uTime;
varying vec2 vUv; varying vec3 vCol; varying float vAl, vSeed;
#include <fog_pars_fragment>
${NOISE_GLSL}
void main(){
  float r2 = dot(vUv, vUv);
  float g = max(1.0 - r2, 0.0); g = g*g;
  float n = wsFbm(vec3(vUv*vec2(3.2, 1.5) + vSeed, uTime*0.22 + vSeed));
  float n2 = wsNoise(vec3(vUv*vec2(9.0, 4.5) - vSeed, uTime*0.3));                          // a finer tear: a rag has a torn outline and a lit top, it is never a round blur
  float a = g*smoothstep(0.47, 0.72, n + 0.34*g + 0.24*(n2 - 0.5));
  gl_FragColor = vec4(vCol*(0.76 + 0.32*n + 0.2*(n2 - 0.5) + 0.2*vUv.y), a*vAl);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------- spray: foot sheath + torn crown (displaced skirt)
// position = (angle 0..1, v 0..1, 0). uSk = (foot radius, ring radius, crown height, amount 0..1)
const SKIRT_VERT = /* glsl */`
uniform vec4 uSk;
uniform vec2 uBase;
uniform float uTime, uDir, uSpinS, uSeed;
varying vec3 vLP, vN, vWP; varying vec2 vAV; varying float vLobe;
#include <fog_pars_vertex>
${NOISE_GLSL}
float gLobe;
vec3 skSurf(float a, float v){
  float am = uSk.w;
  float q = a*uDir + uSpinS;
  float lobeLo = 0.45 + 1.1*wsNoise(vec3(cos(q)*2.4 + uSeed, sin(q)*2.4, uTime*0.35 + v*0.6));
  float lobe = lobeLo*(0.8 + 0.45*wsNoise(vec3(cos(q)*7.0, sin(q)*7.0 + uSeed, uTime*0.8)));
  gLobe = lobe;
  float R = uSk.y*(0.55 + 0.45*am);
  float rf = uSk.x;
  float s = clamp(v/0.4, 0.0, 1.0), w = clamp((v - 0.4)/0.6, 0.0, 1.0);
  float r0 = rf*2.1 + 0.06*R;
  float rho = mix(rf*(1.08 + 0.2*s) + (r0 - rf*1.28)*s*s*s, r0 + (R - r0)*pow(w, 0.85), step(0.4, v)) + R*0.16*(lobe - 1.0)*w;
  float lk = 0.9 + 0.12*lobeLo;
  float yS = (2.6 - 1.9*(0.6*s + 0.4*sqrt(s)))*lk;
  float yC = 0.7*lk*pow(1.0 - w, 5.0) + 0.92*lobe*sin(3.14159*pow(w, 0.75))*(1.0 - 0.25*w);
  float y = uSk.z*am*mix(yS, yC, step(0.4, v)) + 0.5;
  float aa = a - uDir*0.75*v;
  return vec3(cos(aa)*rho, y, sin(aa)*rho);
}
void main(){
  float a = position.x*6.2831853, v = position.y;
  vec3 p = skSurf(a, v); float lobe = gLobe;
  vec3 ta = skSurf(a + 0.03, v) - skSurf(a - 0.03, v);
  vec3 tv = skSurf(a, min(v + 0.02, 1.0)) - skSurf(a, max(v - 0.02, 0.0));
  vec3 n = cross(tv, ta);
  n = -n;   // the grid's winding makes cross(tv, ta) the inner / lower side: one sign everywhere (a per-vertex test tore steep lobes into wedges)
  vN = normalize(mat3(modelMatrix)*(n + vec3(0.0, 1e-4, 0.0)));
  vLP = p; vAV = vec2(a, v); vLobe = lobe;
  vec4 wp = modelMatrix*vec4(p, 1.0);
  vWP = wp.xyz;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}
`;
const SKIRT_FRAG = /* glsl */`
uniform vec4 uSk;
uniform vec2 uBase;
uniform float uTime, uDir, uSpinS, uSeed;
varying vec3 vLP, vN, vWP; varying vec2 vAV; varying float vLobe;
#include <fog_pars_fragment>
${NOISE_GLSL}
${PATCH_GLSL}
${LIGHT_GLSL}
void main(){
  float a = vAV.x, v = vAV.y;
  float q = a*uDir + uSpinS*1.35 + 1.7*v;
  float n1 = wsNoise(vec3(cos(q)*3.2, sin(q)*3.2 + uSeed, v*3.5 - uTime*0.9));
  float q2 = a*uDir + uSpinS*1.9 + 2.6*v;
  float n2 = wsNoise(vec3(cos(q2)*10.0 + uSeed, sin(q2)*10.0, v*9.0 - uTime*1.6));
  float n3 = wsNoise(vec3(cos(q2)*27.0, sin(q2)*27.0, v*30.0 - uTime*2.4 + uSeed));
  float qj = a*uDir + uSpinS*2.4 + 0.5*v;
  float jet = wsNoise(vec3(cos(qj)*46.0, sin(qj)*46.0 + uSeed, v*2.2 - uTime*1.3));
  float dens = 0.42*n1 + 0.26*n2 + 0.16*n3 + 0.22*jet;
  float camD = distance(vWP, cameraPosition);
  float nearK = 1.0 - smoothstep(60.0, 240.0, camD);
  float qh = a*uDir + uSpinS*2.9 + 0.3*v;
  float hf = wsNoise(vec3(cos(qh)*120.0, sin(qh)*120.0 + uSeed, v*7.0 - uTime*2.0));
  float hf2 = wsNoise(vec3(vLP.xz*0.9, vLP.y*0.9 - uTime*3.0));
  float hf3 = wsNoise(vec3(vLP.xz*0.23 + uSeed, vLP.y*0.3 - uTime*1.1));
  // torn at every distance: the fine terms erode the sheet (they average out when they fall under a pixel)
  dens += (0.45 + 0.55*nearK)*(0.20*(hf - 0.5) + 0.16*(hf2 - 0.5)) + 0.22*(hf3 - 0.5) + 0.12*(n3 - 0.5);
  float body = mix(0.40, 0.30, smoothstep(0.25, 0.6, v))*(0.5 + 0.5*smoothstep(12.0, 110.0, camD));
  float th = mix(-0.06, 0.50, smoothstep(0.2, 0.9, v)) - 0.14*(vLobe - 1.0);
  float al = body*smoothstep(th, th + 0.46, dens);
  al *= smoothstep(0.0, 0.24, v)*(1.0 - smoothstep(0.45, 0.9, v))*smoothstep(0.4, 3.0, vLP.y);
  vec3 V = normalize(vWP - cameraPosition);
  vec3 N = normalize(vN);
  vec3 rad = normalize(vec3(vLP.x, 0.0, vLP.z) + vec3(1e-4, 0.0, 0.0));
  // no silhouette: every fold dissolves toward grazing, the far side and the top thin out with height above the sea
  al *= uSk.w*smoothstep(0.0, 0.6, abs(dot(N, V)) + 0.3*(hf3 - 0.5) + 0.14*(hf2 - 0.5));
  float hy = vLP.y/max(uSk.z*max(uSk.w, 0.2), 1.0);
  al *= 1.0 - 0.8*smoothstep(0.45, 1.5, hy);
  al *= 1.0 - smoothstep(-0.15, 0.45, dot(rad, V))*smoothstep(0.12, 0.7, hy);
  al *= smoothstep(45.0, 190.0, camD);   // a far-view form: up close it dissolves and leaves the tube, sprites and stain
  vec2 sl = uSunDir.xz/max(uSunDir.y, 0.1);
  float sunP = wsPatch(vLP.xz + uBase - sl*vLP.y);
  vec3 Nl = normalize(rad*0.75 + N*0.6 + vec3(0.0, 0.35, 0.0));
  vec3 col = wsLit(Nl, V, dens, sunP, vLP.y, 0.8 + 0.5*dens)*mix(0.62, 1.1, smoothstep(0.28, 0.72, dens));
  gl_FragColor = vec4(col, al);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------- spray sprites (soft points on spiral ballistic tracks)
// aI = (start angle 0..1, radial seed, height seed, phase), aJ = (rate, size, kind: 0 crown 1 sheath 2 glint, tint)
const SPRITE_VERT = /* glsl */`
uniform vec4 uSk;
uniform vec2 uBase;
uniform float uTime, uDir, uOmega, uPx, uMaxPt;
attribute vec4 aI, aJ;
varying vec4 vCol; varying vec3 vDir; varying float vSeed;
#include <fog_pars_vertex>
${NOISE_GLSL}
${PATCH_GLSL}
${LIGHT_GLSL}
vec3 wsTrack(float p, float lifeT, float sheath, out float ang){
  float am = uSk.w, R = uSk.y*(0.55 + 0.45*am);
  float out1 = 1.0 - (1.0 - p)*(1.0 - p);
  float rho = mix(uSk.x*(1.05 + 0.5*aI.y), R*(0.62 + 0.55*aI.y), out1);
  float y = uSk.z*am*(0.5 + 1.1*aI.z)*4.0*p*(1.0 - p)*0.8 + 0.8;
  rho = mix(rho, uSk.x*(1.0 + 0.55*aI.y + 0.5*p), sheath);
  y = mix(y, uSk.z*am*(0.2 + 2.3*p)*(0.6 + 0.6*aI.z), sheath);
  ang = aI.x*6.2831853 + uDir*uOmega*lifeT*(0.30 + 0.5*sheath)*(p - 0.4*p*p);
  return vec3(cos(ang)*rho, y, sin(ang)*rho);
}
void main(){
  float cyc = uTime*aJ.x + aI.w;
  float p = fract(cyc);
  float lifeT = 1.0/aJ.x;
  float am = uSk.w;
  float sheath = step(0.5, aJ.z)*step(aJ.z, 1.5);
  float glint = step(1.5, aJ.z);
  float ang, ang2;
  vec3 lp = wsTrack(p, lifeT, sheath, ang);
  float y = lp.y;
  vec4 wp = modelMatrix*vec4(lp, 1.0);
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  // the sprite's track on screen: it is drawn out along it (gl_PointCoord runs downward)
  vec4 c2 = projectionMatrix*viewMatrix*modelMatrix*vec4(wsTrack(p + 0.035, lifeT, sheath, ang2), 1.0);
  vec2 sd = (c2.xy/max(c2.w, 1e-3) - gl_Position.xy/max(gl_Position.w, 1e-3))*vec2(projectionMatrix[1][1]/max(projectionMatrix[0][0], 1e-3), 1.0);
  float sdl = length(sd);
  vec2 dirS = sdl > 1e-5 ? sd/sdl : vec2(1.0, 0.0);
  float dist = max(-mvPosition.z, 0.5);
  float sc = length(mat3(modelMatrix)[0]);
  float size = aJ.y*(2.2 + 7.5*p)*(1.0 - 0.35*sheath)*sc*1.45;
  size = mix(size, 0.55*sc, glint);
  float px = size*uPx/dist;
  float over = max(px/uMaxPt, 1.0);
  gl_PointSize = clamp(px, 1.6, uMaxPt);
  vDir = vec3(dirS.x, -dirS.y, mix(1.0, 2.5, smoothstep(5.0, 16.0, px)));   // far off (a few pixels) a sprite stays round, or the crown would thin out
  vec3 toCam = normalize(cameraPosition - wp.xyz);
  vec3 rad = vec3(cos(ang), 0.0, sin(ang));
  vec2 sl = uSunDir.xz/max(uSunDir.y, 0.1);
  float sunP = wsPatch(lp.xz + uBase - sl*lp.y);
  vec3 N = normalize(rad*0.6 + toCam*0.5 + vec3(0.0, 0.4, 0.0));
  vec3 col = wsLit(N, -toCam, 0.6 + 0.4*aJ.w, sunP, y, 1.0)*(1.0 + 0.1*aJ.w);
  float life = smoothstep(0.0, 0.12, p)*(1.0 - smoothstep(0.45, 1.0, p));
  float al = life*am*(0.26 + 0.16*aJ.w)/over*smoothstep(12.0, 40.0, dist)*mix(1.0, 0.3, smoothstep(14.0, 70.0, px));   // nothing hangs at the lens: inside 12 m a sprite is gone
  // glitter: tiny HDR sparks on the sunward side, twinkling
  float tw = step(0.72, wsHash(vec3(floor(uTime*7.0 + aI.w*40.0), aI.x*91.0, aI.y*57.0)));
  float sunSide = smoothstep(-0.1, 0.6, dot(rad, uSunDir))*sunP;
  vec3 gcol = uSunCol*vec3(1.0, 0.93, 0.78)*3.6*tw*sunSide;
  col = mix(col, gcol, glint);
  al = mix(al, life*am*tw*sunSide*min(px/1.6, 1.0)*smoothstep(4.0, 12.0, dist), glint);
  vCol = vec4(col, al); vSeed = aI.x*31.0 + aI.y*17.0 + (1.0 - glint)*uTime*0.3 + glint*1000.0;
  #include <fog_vertex>
}
`;
// A sprite is a torn sheet of spray, not a disc: drawn out 2.5:1 along its track, streaked along it, and eroded by a
// finer noise right through its outline, so that it breaks into rags and droplet haze.
const SPRITE_FRAG = /* glsl */`
varying vec4 vCol; varying vec3 vDir; varying float vSeed;
#include <fog_pars_fragment>
${NOISE_GLSL}
void main(){
  vec2 c = gl_PointCoord*2.0 - 1.0;
  float glint = step(900.0, vSeed);
  float sa = dot(c, vDir.xy), sc = dot(c, vec2(-vDir.y, vDir.x));
  vec2 e = mix(vec2(sa, sc*vDir.z), c, glint);
  float r2 = dot(e, e);
  float g = max(exp(-4.5*r2) - 0.0111, 0.0)*step(r2, 1.0);
  float n1 = wsNoise(vec3(sa*1.3 + vSeed, sc*1.9*vDir.z, vSeed*0.37));
  float n2 = wsNoise(vec3(c*6.5 + vSeed*1.7, vSeed*0.11));
  float n = smoothstep(0.34, 0.74, 0.6*n1 + 0.4*n2 + 0.5*g - 0.08);
  n = max(n, 0.7*smoothstep(0.7, 0.86, n2)*smoothstep(0.02, 0.25, g));       // fine drops round the torn body
  n = mix(n, 1.0, glint);
  gl_FragColor = vec4(vCol.rgb*(0.8 + 0.25*n), vCol.a*min(g*1.25, 1.0)*n);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------- sea stains (one draw for all six)
// uStA[i] = (base x, base z, stain radius, strength), uStB[i] = (ring radius, arms 0..1, spray 0..1, turn phase)
const STAIN_VERT = /* glsl */`
uniform vec4 uStA[${N_SP}], uStB[${N_SP}];
uniform float uSeaY;
attribute float aSp;
varying vec2 vQ, vL; varying vec4 vA, vB; varying float vArms; varying vec3 vSW;
#include <fog_pars_vertex>
void main(){
  int i = int(aSp + 0.5);
  vec4 A = uStA[i]; vA = A; vB = uStB[i];
  vArms = 3.0 + mod(aSp*2.0 + 1.0, 3.0);
  vQ = position.xy;
  vec3 lp = vec3(A.x + position.x*A.z, uSeaY, A.y + position.y*A.z);
  vL = lp.xz;
  vSW = (modelMatrix*vec4(lp, 1.0)).xyz;
  vec4 mvPosition = modelViewMatrix*vec4(lp, 1.0);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}
`;
const STAIN_FRAG = /* glsl */`
uniform vec3 uDarkCol, uSargCol;
uniform float uTime, uDir;
varying vec2 vQ, vL; varying vec4 vA, vB; varying float vArms; varying vec3 vSW;
#include <fog_pars_fragment>
${NOISE_GLSL}
${PATCH_GLSL}
${LIGHT_GLSL}
void main(){
  float rho = length(vQ);
  float th = atan(vQ.y, vQ.x + 1e-6);
  float ct = vQ.x/max(rho, 1e-4), sn = vQ.y/max(rho, 1e-4);
  float lr = log(max(rho, 0.03));
  float wob = wsNoise(vec3(ct*1.6, sn*1.6, 2.0 + vA.x*0.01));
  float rn = rho*(0.86 + 0.28*wob);
  float ringR = vB.x/max(vA.z, 1.0);
  float nA = floor(vArms + 0.5);
  // dark smooth spot, soft-rimmed
  vec3 toC = cameraPosition - vSW;
  float steepK = smoothstep(0.3, 0.62, toC.y/max(length(toC), 1.0));                      // looked down on (from the helix): a darker spot, arms that run on as curved streaks, fewer loose dashes
  float dark = (1.0 - smoothstep(0.18, 1.0, rn))*0.45*vA.w*(1.0 + 0.8*steepK);
  // flow coordinates: q is constant along a spiral arm, lr runs along it. Noise is sampled about six times longer
  // along the flow than across it, so foam is drawn out into streaks and webbing; finer octaves come in near the eye
  float q = uDir*th - 2.3*lr + vB.w;
  float qs = q + 0.8*lr + 0.3*(wsNoise(vec3(vL*0.045, 1.0)) - 0.5) + 0.14*(wsNoise(vec3(vL*0.13, 5.0)) - 0.5);   // streaks wander a little: no drawn rings
  float cq = cos(qs), sq = sin(qs), tt = uTime*0.25;
  float fw = length(fwidth(vL))/max(rho*vA.z, 2.0);
  float g3 = 1.0 - smoothstep(0.2, 0.8, fw*46.0), g4 = 1.0 - smoothstep(0.2, 0.8, fw*115.0);
  float g1 = 1.0 - smoothstep(0.25, 1.0, fw*7.0), g2 = 1.0 - smoothstep(0.2, 0.8, fw*19.0);   // far off the streaks blur out: no drawn arcs
  float outR = smoothstep(0.45*ringR, 0.9*ringR, rho);                                     // from the spray ring outward ...
  float lf = lr + max(lr - log(max(0.85*ringR, 0.03)), 0.0);                                // ... the flow draws the foam out half as far (3:1), so ribbons break
  float s1 = mix(0.5, wsNoise(vec3(cq*7.0, sq*7.0, lf*3.2 - tt*0.5 + 1.0)), g1);
  float s2 = mix(0.5, wsNoise(vec3(cq*19.0 + 5.0, sq*19.0, lf*8.5 - tt)), g2);
  float s3 = mix(0.5, wsNoise(vec3(cq*46.0, sq*46.0 + 3.0, lf*20.0 - tt*1.7)), g3);
  float s4 = mix(0.5, wsNoise(vec3(cq*115.0 + 7.0, sq*115.0, lf*50.0 - tt*2.6)), g4);
  float fb = mix(0.40*s1 + 0.30*s2 + 0.18*s3 + 0.12*s4, 0.15*s1 + 0.30*s2 + 0.30*s3 + 0.25*s4, g4);   // finer toward the eye
  float web2 = 1.0 - abs(2.0*(0.5*s3 + 0.5*s4) - 1.0);                              // only the finest scale is ridged into lace
  float lace = smoothstep(0.36, 0.70, fb)*0.72 + 0.2*fb + 0.2*web2*web2*g3*g4;
  float warp = wsNoise(vec3(cq*1.3, sq*1.3, lr*1.5));
  // curved foam arms (log spiral): soft-sided bands made of streaks
  float sa = sin(nA*q + 4.0*warp);
  float w = fwidth(sa)*1.2 + 0.24 + 0.1*(1.0 - g2);                                        // (capped: far arms do not fatten into smooth bands)
  float brk = mix(smoothstep(0.30, 0.62, s1), smoothstep(0.42, 0.70, s1), g2)*(0.45 + 0.55*smoothstep(0.3, 0.6, wsNoise(vec3(vL*0.021, 4.0 + uTime*0.05))));
  float dashC = 0.08 + 0.92*smoothstep(0.36, 0.62, wsNoise(vec3(cq*5.0 + 2.0, sq*5.0, lf*11.0 - tt)));
  float dashF = 0.25 + 0.75*smoothstep(0.32, 0.6, wsNoise(vec3(cq*11.0 + 4.0, sq*11.0, lf*26.0 - tt*1.5)));
  float g2d = 1.0 - smoothstep(0.2, 0.8, 19.0*sqrt(length(dFdx(vL))*length(dFdy(vL)))/max(rho*vA.z, 2.0));   // by the footprint's mean axis: seen low across the sea, an arm lying across the view still resolves its dashes
  float dash = mix(mix(1.0, dashC*mix(0.72, dashF, g2d), max(g2d, 0.7*g1)*outR), 0.5 + 0.5*dashC, 0.8*steepK*outR);   // no arm runs unbroken for more than about 10 m: dashes at two scales, right up to the churned ring; both hold out to mid distance (60-250 m), the fine one fades first
  float band = smoothstep(ringR*0.85, ringR*1.35, rho)*(1.0 - smoothstep(0.55, 0.97, rn));
  float arms = smoothstep(0.52 - w, 0.52 + w, sa)*band*vB.y*(0.3 + 0.7*brk)*dash;
  float fine = smoothstep(0.84 - w, 0.84 + w, sin((nA*3.0)*q + 9.0*warp + 2.0))*band*vB.y*brk*0.5*dash*(1.0 - 0.6*steepK);
  // contact ring and churned water under the crown
  float rr = (rho - ringR)/0.09;
  float churnN = 0.5*s2 + 0.3*s1 + 0.2*s3;
  float ring = exp(-rr*rr)*smoothstep(0.25, 0.7, churnN)*vB.z;
  float churn = 0.8*(1.0 - smoothstep(ringR*0.45, ringR*1.05, rho))*smoothstep(0.30, 0.70, churnN)*vB.z;
  float core = (1.0 - smoothstep(0.14*ringR, 0.6*ringR, rho))*vB.z;
  float blot = 0.35 + 0.65*smoothstep(0.3, 0.7, wsNoise(vec3(vL*0.07, uTime*0.1 + 2.0)));
  float iso = mix(1.0, smoothstep(0.38, 0.62, 0.6*wsNoise(vec3(vL*0.9, uTime*0.2)) + 0.4*wsNoise(vec3(vL*0.31 + 7.0, uTime*0.11))), 0.8*g3*outR);   // near the eye the ribbons are dashes and webbing 1-2 m wide, dark water between
  float webN = 1.0 - abs(2.0*wsNoise(vec3(vL*1.9 + 3.0, uTime*0.3)) - 1.0);
  iso *= mix(1.0, 0.42 + 0.58*smoothstep(0.25, 0.8, webN), (1.0 - smoothstep(0.12, 0.4, length(fwidth(vL))))*outR);   // and within 60 m each dash is veined lace, not a blob
  float foam = clamp((arms + fine + ring*blot*dash)*iso + churn*blot, 0.0, 1.0)*smoothstep(0.16, 0.74, lace + 0.12*churn);   // (the contact ring too: no blot is a smooth blob)
  foam = min(max(foam, core*(0.40 + 0.75*lace)), 1.0);
  // sargassum drawn into the spiral: broken golden-brown tufts
  float q2 = uDir*th - 3.3*lr + vB.w*0.8 + 1.3;
  float ss = sin((nA + 2.0)*q2 + 5.0*warp + 2.2*(s2 - 0.5));
  float w2 = fwidth(ss)*1.2 + 0.07;
  float sband = smoothstep(ringR*1.25, ringR*1.8, rho)*(1.0 - smoothstep(0.80, 1.0, rn));
  float sarg = smoothstep(0.88 - w2, 0.88 + w2, ss)*sband*smoothstep(0.42, 0.6, wsNoise(vec3(vL*0.03 + 5.0, 1.0)))*vA.w;
  sarg *= smoothstep(0.38, 0.62, s2)*(0.45 + 0.55*smoothstep(0.3, 0.7, s3));
  float sunP = wsPatch(vL);
  vec3 foamCol = uSunCol*(0.25 + 0.62*sunP) + uShadowCol*0.55;
  vec3 col = uDarkCol;
  float al = dark;
  col = mix(col, uSargCol*(0.35 + 0.65*sunP), sarg); al = max(al, sarg*0.72);
  col = mix(col, foamCol*(0.82 + 0.3*lace), foam); al = max(al, foam*0.68);
  al *= 1.0 - smoothstep(0.90, 1.0, rho);
  gl_FragColor = vec4(col, al);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------- cloud collars (baked lobed undersides, shader-turned striations)
const COLLAR_VERT = /* glsl */`
attribute vec2 aK;
varying vec3 vLP, vWN, vWP; varying vec2 vK;
#include <fog_pars_vertex>
void main(){
  vLP = position; vK = aK;
  vWN = normalize(mat3(modelMatrix)*normal);
  vec4 wp = modelMatrix*vec4(position, 1.0); vWP = wp.xyz;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}
`;
const COLLAR_FRAG = /* glsl */`
uniform vec3 uIndigo, uOff, uGlowPos, uGlowCol;
uniform vec4 uBar;
uniform float uTime, uDir, uRc, uLitK, uBarK, uFormK;
varying vec3 vLP, vWN, vWP; varying vec2 vK;
#include <fog_pars_fragment>
${NOISE_GLSL}
${PATCH_GLSL}
${LIGHT_GLSL}
void main(){
  vec2 rel = vLP.xz;
  float rho = length(rel);
  float ct = rel.x/max(rho, 1e-3), sn = rel.y/max(rho, 1e-3);
  float tw = uDir*(uTime*0.045 - 1.25*log(max(rho, 10.0)/40.0));
  float c2 = ct*cos(tw) - sn*sin(tw), s2 = sn*cos(tw) + ct*sin(tw);
  float stri = wsNoise(vec3(c2*2.4, s2*2.4, rho/70.0));
  float fine = wsNoise(vec3(c2*7.5, s2*7.5, rho/22.0 + 4.0));
  vec2 wxz = vLP.xz + uOff.xz;
  float lump = wsFbm(vec3(wxz/64.0 + uTime*0.012, 1.3));
  float d1 = wsFbm(vec3(wxz.x, vLP.y*1.5, wxz.y)/23.0 + uTime*0.02);
  float d2 = wsNoise(vec3(wxz.x, vLP.y*1.5, wxz.y)/6.5 + 3.0);
  vec3 bp = vec3(wxz.x, vLP.y*1.4, wxz.y);
  float bl1 = 1.0 - abs(2.0*wsNoise(bp/13.0 + 5.0) - 1.0);
  float bl2 = 1.0 - abs(2.0*wsNoise(bp/4.2 + 9.0) - 1.0);
  float bill = 0.62*bl1 + 0.38*bl2*(1.0 - smoothstep(120.0, 500.0, distance(vWP, cameraPosition)));
  float tone = 0.40 + 0.34*mix(stri, 0.5, 0.7*uFormK) + 0.16*mix(fine, 0.5, 0.5*uFormK) + 0.34*lump + 0.46*d1 + 0.12*d2 + (0.14 + 0.2*uFormK)*bill;
  // pouches and creases at two scales, as on the cloud base (there a marched height field, here shading): broad soft shade
  // toward the creases, and light on the flanks that face the sun
  float pa = abs(2.0*wsNoise(vec3(wxz/125.0 + 3.0, 0.5)) - 1.0), pb = abs(2.0*wsNoise(vec3(wxz/52.0 + 17.0, 2.5)) - 1.0);
  vec2 ps = wxz + normalize(uSunDir.xz + vec2(1e-4, 0.0))*9.0;
  float pa2 = abs(2.0*wsNoise(vec3(ps/125.0 + 3.0, 0.5)) - 1.0), pb2 = abs(2.0*wsNoise(vec3(ps/52.0 + 17.0, 2.5)) - 1.0);
  float pao = 0.66*smoothstep(0.02, 0.4, pa) + 0.34*smoothstep(0.02, 0.4, pb);
  float pfl = clamp((0.66*(sqrt(min(sqrt(pa*pa + 0.006)*1.6, 1.0)) - sqrt(min(sqrt(pa2*pa2 + 0.006)*1.6, 1.0))) + 0.34*(sqrt(min(sqrt(pb*pb + 0.006)*1.7, 1.0)) - sqrt(min(sqrt(pb2*pb2 + 0.006)*1.7, 1.0))))*5.0, -1.0, 1.0);
  tone += 0.36*(pao - 0.6);
  float pcs = mix(1.0, smoothstep(0.0, 0.65, abs(2.0*wsNoise(bp/17.0 + 21.0) - 1.0)), uFormK);   // the bay is seen close: its walls are heads of cloud 15-20 m across with dark creases between, never a smooth plate
  tone -= 0.22*(1.0 - pcs);
  float hol = mix(1.0, smoothstep(55.0, 175.0, length(vLP.xz)), uFormK);                    // inside the bay's ring wall nothing is sunlit: the hollow is dark, lit by the lantern alone
  vec3 N = normalize(vWN);
  vec3 V = normalize(vWP - cameraPosition);
  float low = vK.y;
  vec2 sl = uSunDir.xz/max(uSunDir.y, 0.1);
  float sunP = wsPatch(wxz - sl*(vLP.y + uOff.y));
  float lip = smoothstep(-0.05, 0.55, dot(N, uSunDir) + 0.5*(d1 - 0.5))*(0.35 + 0.65*low)*sunP*(0.5 + d1);
  vec3 col = uIndigo*(0.34 + 0.62*tone)*(0.8 + 0.3*low) + uShadowCol*0.05*tone + uBounceCol*0.05*(0.5 - 0.5*N.y)*(0.4 + low);
  col *= (0.66 + 0.34*pao)*(1.0 - 0.26*max(-pfl, 0.0))*(0.62 + 0.38*hol);
  col += uSunCol*vec3(1.0, 0.8, 0.6)*max(pfl, 0.0)*(0.03 + 0.2*sunP)*(0.4 + 0.6*low)*hol;
  col += uSunCol*vec3(1.0, 0.74, 0.62)*lip*(0.10 + 0.05*bill)*uLitK*hol*(0.3 + 0.7*pcs);
  float fdn = dot(N.xz, normalize(uSunDir.xz + vec2(1e-4, 0.0)));                         // the bay's pouches are modelled: light them by their form, as the base's are
  col *= 1.0 - 0.3*uFormK*smoothstep(0.05, 0.6, -fdn);
  col += uSunCol*vec3(1.0, 0.8, 0.6)*uFormK*smoothstep(0.04, 0.72, fdn)*(0.03 + 0.2*sunP)*(0.4 + 0.6*low)*hol*(0.4 + 0.6*bill)*(0.55 + 0.9*d1)*(0.3 + 0.7*pcs);   // (billowed: a lit shelf seen close is never a flat plate)
  float bt = (dot(vLP.xz, uBar.xy) - uBar.z - 22.0*sin(uTime*0.17))/max(uBar.w, 1.0);   // the portal's bay: a warm bar of sun lying across its mouth ...
  col += uSunCol*vec3(1.0, 0.64, 0.4)*uBarK*exp(-bt*bt)*smoothstep(-0.35, 0.5, dot(N, uSunDir) + 0.5*(d1 - 0.5))*(0.3 + 0.7*low)*(0.25 + 0.75*bill)*(0.35 + 1.1*d1)*(0.5 + 0.5*pao)*(0.3 + 0.7*pcs);   // (on billows and pouches: never a flat warm plate)
  col += uGlowCol*exp(-length(vLP - uGlowPos)/60.0)*(0.45 + 0.55*d1);                    // ... and the lantern's light inside it
  float rag = wsNoise(vec3(wxz/38.0, 7.0 + uTime*0.02));
  float al = smoothstep(0.0, 0.5, vK.x - 0.7*rag*(1.0 - vK.x))*smoothstep(0.0, mix(0.6, 0.24, smoothstep(350.0, 1000.0, distance(vWP, cameraPosition))), abs(dot(N, V)) + 0.34*(d1 - 0.5) + 0.2*(d2 - 0.5) + 0.12*(lump - 0.5));   // folds dissolve: no crease has an edge
  gl_FragColor = vec4(col, al);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------- geometry helpers
function gridGeo(na, nv) {
  const pos = new Float32Array((na + 1) * (nv + 1) * 3);
  let k = 0;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= na; i++) { pos[k++] = i / na; pos[k++] = j / nv; pos[k++] = 0; }
  const idx = new Uint32Array(na * nv * 6); k = 0;
  for (let j = 0; j < nv; j++) for (let i = 0; i < na; i++) {
    const a = j * (na + 1) + i, b = a + 1, c = a + na + 1, d = c + 1;
    idx[k++] = a; idx[k++] = b; idx[k++] = c; idx[k++] = b; idx[k++] = d; idx[k++] = c;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}
function fogUniforms() { return THREE.UniformsUtils.clone(THREE.UniformsLib.fog); }
function lin(hex, k = 1) { return new THREE.Color(hex).multiplyScalar(k); }

const MOODS = {
  //            sun (linear)                        shadow                              bounce gain  elevation
  afternoon: (pal) => ({ sun: pal[3].clone().multiply(new THREE.Color(0.90, 0.80, 0.62)), shadow: lin('#3A4A7A').lerp(pal[5], 0.6).multiplyScalar(1.35), bounce: pal[0].clone().multiplyScalar(0.55), elev: 22 }),
  noon: (pal) => ({ sun: lin('#fffaf0', 0.92), shadow: lin('#4d6fb0', 1.5), bounce: pal[0].clone().multiplyScalar(0.7), elev: 60 }),
  lastlight: (pal) => ({ sun: lin('#ffab72', 0.95), shadow: lin('#6a4a86', 1.25), bounce: lin('#4d7a66', 0.45), elev: 7 }),
  night: (pal) => ({ sun: lin('#b8c8ea', 0.6), shadow: lin('#1c2646', 1.0), bounce: lin('#20d8b4', 0.12), elev: 34 }),
};

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng;
  const noise = ctx.noise;
  const detail = clamp(ctx.quality?.detail ?? 1, 0.4, 1);
  const palHex = Array.isArray(opts.palette) && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const pal = palHex.map((h) => new THREE.Color(h));
  const H = opts.height ?? 620;
  const mirror = opts.mirror ? -1 : 1;
  const mood = (MOODS[VIEW?.mood ?? opts.mood] || MOODS.afternoon)(pal);
  const el = (mood.elev * Math.PI) / 180;
  const sunDir = (opts.sunDir ? new THREE.Vector3().copy(opts.sunDir) : new THREE.Vector3(-Math.cos(el) * 0.924, Math.sin(el), Math.cos(el) * 0.383)).normalize();
  const dying = opts.dying ?? 3, newborn = opts.newborn ?? 5;
  const tl = Object.assign({ thin: 0.26, kink: 0.30, rope: 0.386, gone: 0.455, spot: 0.34, ring: 0.43, finger: 0.50, down: 0.74 }, opts.timeline || {});
  const spinDir = rng.chance(0.5) ? 1 : -1;
  const windAng = rng.range(-0.9, -0.2); // blowing toward the east-north-east
  const layout = opts.layout || DEFAULT_LAYOUT;
  const WALK = [7, 8, 5, 10, 6, 6];

  const root = new THREE.Group(); root.name = 'waterspout-sisters';

  // ---- the sisters' numbers
  const sisters = [];
  for (let i = 0; i < N_SP; i++) {
    const L = layout[i], D = DEFAULT_LAYOUT[i];
    const big = (L[2] ?? D[2]) >= 50, col = i === 4;
    const rw = (L[2] ?? D[2]) * 0.5 * rng.range(0.93, 1.08);
    const rt = (L[3] ?? D[3]) * 0.5 * rng.range(0.92, 1.1);
    const s = {
      index: i,
      home: new THREE.Vector2((L[0]) * mirror, L[1]),
      top: new THREE.Vector2(L[0] * mirror + (col ? 0 : rng.range(-14, 14)), L[1] + (col ? 0 : rng.range(-14, 14))),
      base: new THREE.Vector2(L[0] * mirror, L[1]),
      waist: rw, trumpet: rt,
      ring: (L[4] ?? D[4]) * 0.5, stainR: (L[4] ?? D[4]) * (i === dying || i === newborn ? 1.5 : 1.0),
      crown: i === dying ? 12 : i === newborn ? 13 : big ? 23 : 20,
      collarR: L[5] ?? D[5], collarDrop: (L[6] ?? D[6]) * (col ? 1 : rng.range(0.8, 1.25)),
      braids: big ? rng.int(3, 5) : rw < 10 ? 2 : rng.int(2, 4),
      seed: rng.range(0, 40),
      omega: Math.PI * Math.pow(clamp(17 / rw, 0.4, 1.3), 0.62) * rng.range(0.9, 1.1),
      walkA: WALK[i] * rng.range(0.8, 1.1), walkF: [rng.range(0.13, 0.24), rng.range(0.11, 0.2)], walkP: [rng.range(0, 6.28), rng.range(0, 6.28)],
      b1: (big ? rng.range(13, 19) : col ? rng.range(15, 21) : rng.range(20, 30)), b2: (big || col ? rng.range(6, 10) : rng.range(9, 15)),
      bf: [rng.range(0.22, 0.38), rng.range(0.2, 0.34), rng.range(0.3, 0.46), rng.range(0.27, 0.42)],
      bp: [rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0, 6.28)],
      kinkDir: rng.range(0, 6.28),
      life: { foot: 15, thin: 1, kink: 0, taper: 0, spray: 1, stain: 1, arms: 1, alpha: 1 },
      forced: null, eff: { foot: 15, thin: 1, kink: 0, taper: 0, spray: 1, stain: 1, arms: 1, alpha: 1 },
      uA: new THREE.Vector4(), uB: new THREE.Vector4(), uC: new THREE.Vector4(), uD: new THREE.Vector4(),
      uSpin: new THREE.Vector3(), uSk: new THREE.Vector4(), uBase: new THREE.Vector2(), uAlpha: { value: 1 },
      objs: [],
    };
    sisters.push(s);
  }

  // ---- shared uniforms
  const G = {
    uH: { value: H }, uTime: { value: 0 }, uDir: { value: spinDir }, uPx: { value: 400 }, uMaxPt: { value: 80 }, uBandK: { value: (VIEW?.mood ?? opts.mood) === 'night' ? 0.5 : 1 },
    uSunDir: { value: sunDir.clone() },
    uSunCol: { value: (opts.sunColor ? new THREE.Color().copy(opts.sunColor) : mood.sun) },
    uShadowCol: { value: (opts.shadowColor ? new THREE.Color().copy(opts.shadowColor) : mood.shadow) },
    uBounceCol: { value: (opts.bounceColor ? new THREE.Color().copy(opts.bounceColor) : mood.bounce) },
    uPatch: { value: new THREE.Vector4(0, 0, opts.patchMin ?? 0.5, 400) },
    uWind: { value: new THREE.Vector3(Math.cos(windAng), Math.sin(windAng), 6.5) },
  };
  const shared = (extra) => Object.assign(fogUniforms(), {
    uH: G.uH, uTime: G.uTime, uDir: G.uDir, uPx: G.uPx, uMaxPt: G.uMaxPt, uBandK: G.uBandK, uSunDir: G.uSunDir, uSunCol: G.uSunCol,
    uShadowCol: G.uShadowCol, uBounceCol: G.uBounceCol, uPatch: G.uPatch, uWind: G.uWind,
  }, extra);
  const perSister = (s) => ({ uA: { value: s.uA }, uB: { value: s.uB }, uC: { value: s.uC }, uD: { value: s.uD }, uSpin: { value: s.uSpin }, uBase: { value: s.uBase }, uSk: { value: s.uSk }, uAlpha: s.uAlpha, uOmega: { value: s.omega }, uSeed: { value: s.seed }, uThr: s.uThrU || (s.uThrU = { value: 0 }) });
  const matBase = { transparent: true, depthWrite: false, fog: true };

  // ---- tubes
  await ctx.yield?.();
  const tubeHi = gridGeo(64, 128), tubeLo = gridGeo(40, 96);
  const skirtGeo = gridGeo(72, 14);
  await ctx.yield?.();
  for (const s of sisters) {
    const lo = s.index === dying || s.index === newborn;
    const mat = new THREE.ShaderMaterial({ ...matBase, side: THREE.FrontSide, vertexShader: TUBE_VERT, fragmentShader: TUBE_FRAG,
      uniforms: shared({ ...perSister(s), uRelief: { value: 0.11 }, uTau: { value: 2.5 } }) });
    const tube = new THREE.Mesh(lo ? tubeLo : tubeHi, mat); tube.frustumCulled = false; tube.name = 'tube' + s.index;
    root.add(tube); s.objs.push(tube); s.tube = tube;
  }
  await ctx.yield?.();

  // ---- spray skirts
  if (opts.spray !== false) for (const s of sisters) {
    const mat = new THREE.ShaderMaterial({ ...matBase, side: THREE.DoubleSide, vertexShader: SKIRT_VERT, fragmentShader: SKIRT_FRAG,
      uniforms: shared({ ...perSister(s), uSpinS: { value: 0 } }) });
    const m = new THREE.Mesh(skirtGeo, mat); m.frustumCulled = false; m.name = 'skirt' + s.index;
    root.add(m); s.objs.push(m); s.skirt = m;
  }
  await ctx.yield?.();

  // ---- vapour rags
  const quad = new THREE.PlaneGeometry(2, 2);
  const RAGS = [110, 120, 150, 70, 160, 90];
  if (opts.fringe !== false) for (const s of sisters) {
    const n = Math.max(12, Math.round(RAGS[s.index] * detail));
    const g = new THREE.InstancedBufferGeometry(); g.index = quad.index; g.setAttribute('position', quad.getAttribute('position'));
    const aI = new Float32Array(n * 4), aJ = new Float32Array(n * 4);
    for (let k = 0; k < n; k++) {
      aI[k * 4] = Math.pow(rng(), 0.8); aI[k * 4 + 1] = rng(); aI[k * 4 + 2] = rng.range(0.55, 1.25); aI[k * 4 + 3] = rng();
      aJ[k * 4] = 1 / rng.range(3.2, 7.5); aJ[k * 4 + 1] = rng.range(0.5, 1.3); aJ[k * 4 + 2] = rng(); aJ[k * 4 + 3] = rng();
    }
    g.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 4)); g.setAttribute('aJ', new THREE.InstancedBufferAttribute(aJ, 4));
    g.instanceCount = n;
    const mat = new THREE.ShaderMaterial({ ...matBase, side: THREE.DoubleSide, vertexShader: RAG_VERT, fragmentShader: RAG_FRAG, uniforms: shared(perSister(s)) });
    const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = 'rags' + s.index;
    root.add(m); s.objs.push(m);
  }
  await ctx.yield?.();

  // ---- spray sprites
  const SPR = [1160, 1160, 1400, 580, 1160, 580];   // per sister: 52% crown, 39% foot sheath, 9% glints
  if (opts.spray !== false) for (const s of sisters) {
    const n = Math.max(40, Math.round(SPR[s.index] * detail));
    const pos = new Float32Array(n * 3), aI = new Float32Array(n * 4), aJ = new Float32Array(n * 4);
    for (let k = 0; k < n; k++) {
      const r = rng(); const kind = r < 0.52 ? 0 : r < 0.91 ? 1 : 2;
      aI[k * 4] = rng(); aI[k * 4 + 1] = rng(); aI[k * 4 + 2] = rng(); aI[k * 4 + 3] = rng();
      aJ[k * 4] = 1 / (kind === 1 ? rng.range(1.6, 3.0) : rng.range(2.4, 4.6)); aJ[k * 4 + 1] = rng.range(0.7, 1.4) * (s.ring / 75 * 0.5 + 0.5) * (kind === 2 ? 1 : 1.5); aJ[k * 4 + 2] = kind; aJ[k * 4 + 3] = rng();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aI', new THREE.BufferAttribute(aI, 4)); g.setAttribute('aJ', new THREE.BufferAttribute(aJ, 4));
    const mat = new THREE.ShaderMaterial({ ...matBase, vertexShader: SPRITE_VERT, fragmentShader: SPRITE_FRAG, uniforms: shared(perSister(s)) });
    const m = new THREE.Points(g, mat); m.frustumCulled = false; m.name = 'sprites' + s.index;
    root.add(m); s.objs.push(m);
  }
  await ctx.yield?.();

  // ---- sea stains (one draw)
  const uStA = [], uStB = [];
  for (let i = 0; i < N_SP; i++) { uStA.push(new THREE.Vector4()); uStB.push(new THREE.Vector4()); }
  let stain = null;
  if (opts.stains !== false) {
    const pos = [], sp = [], idx = [];
    for (let i = 0; i < N_SP; i++) {
      const o = i * 4; pos.push(-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0); sp.push(i, i, i, i); idx.push(o, o + 2, o + 1, o, o + 3, o + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aSp', new THREE.Float32BufferAttribute(sp, 1)); g.setIndex(idx);
    const mat = new THREE.ShaderMaterial({ ...matBase, side: THREE.DoubleSide, vertexShader: STAIN_VERT, fragmentShader: STAIN_FRAG,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
      uniforms: shared({ uStA: { value: uStA }, uStB: { value: uStB }, uSeaY: { value: opts.seaY ?? 0.35 },
        uDarkCol: { value: pal[2].clone().multiplyScalar(0.42) }, uSargCol: { value: lin('#6f5a22', 0.62) } }) });
    stain = new THREE.Mesh(g, mat); stain.frustumCulled = false; stain.renderOrder = -2; stain.name = 'stains';
    root.add(stain);
  }

  // ---- cloud collars (baked)
  const seatIn = opts.seat || [477, 520, -305], startIn = opts.approach || [70, 285, -305];   // unmirrored local x
  const seat = new THREE.Vector3(seatIn[0] * mirror, seatIn[1], seatIn[2]);
  const approach0 = new THREE.Vector3(startIn[0] * mirror, startIn[1], startIn[2]);
  function collarDrop(s, x, z) {
    const dx = x - s.top.x, dz = z - s.top.y, q = Math.hypot(dx, dz) / s.collarR;
    const ring = smoothstep(0.10, 0.48, q) * (1 - smoothstep(0.60, 1.0, q)) + 0.22 * (1 - smoothstep(0, 0.32, q));
    const lump = clamp(noise.fbm2(x / 120 + s.index * 7.3, z / 120, 2) * 0.9, -0.8, 0.8);
    return Math.max(s.collarDrop * ring * (1 + 0.5 * lump) + 9 * (lump + 0.45) * (1 - smoothstep(0.6, 1.2, q)), 0);
  }
  const bayOff = { uGlowPos: { value: new THREE.Vector3() }, uGlowCol: { value: new THREE.Color(0, 0, 0) }, uBar: { value: new THREE.Vector4(1, 0, 0, 1) }, uLitK: { value: 1 }, uBarK: { value: 0 }, uFormK: { value: 0 } };
  if (opts.collars !== false) for (const s of sisters) {
    const big = s.index === 4;
    const Rext = s.collarR * 1.5, na = big ? 112 : 56, nr = big ? 30 : 12;
    const g = gridGeo(na, nr), P = g.getAttribute('position');
    const nrm = new Float32Array(P.count * 3), aK = new Float32Array(P.count * 2);
    for (let k = 0; k < P.count; k++) {
      const a = P.getX(k) * Math.PI * 2, rho = Math.pow(P.getY(k), 0.85) * Rext;
      const lx = Math.cos(a) * rho, lz = Math.sin(a) * rho, x = s.top.x + lx, z = s.top.y + lz;
      const d = collarDrop(s, x, z), e = 3;
      const fx = -(collarDrop(s, x + e, z) - collarDrop(s, x - e, z)) / (2 * e), fz = -(collarDrop(s, x, z + e) - collarDrop(s, x, z - e)) / (2 * e);
      const il = 1 / Math.hypot(fx, 1, fz);
      P.setXYZ(k, lx, -d + 3, lz);
      nrm[k * 3] = fx * il; nrm[k * 3 + 1] = -il; nrm[k * 3 + 2] = fz * il;
      const q = rho / s.collarR;
      aK[k * 2] = clamp(Math.max(1 - smoothstep(0.7, 1.4, q + 0.5 * noise.fbm2(x / 150 + 9, z / 150, 2)), smoothstep(3, 20, d)), 0, 1) * (1 - smoothstep(0.88, 1.0, rho / Rext));
      aK[k * 2 + 1] = clamp(d / Math.max(s.collarDrop * 1.15, 45), 0, 1);
      if (k % 300 === 299) await ctx.yield?.();
    }
    g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.setAttribute('aK', new THREE.BufferAttribute(aK, 2));
    const off = new THREE.Vector3(s.top.x, H, s.top.y);
    const mat = new THREE.ShaderMaterial({ ...matBase, side: THREE.DoubleSide, vertexShader: COLLAR_VERT, fragmentShader: COLLAR_FRAG,
      uniforms: shared({ uIndigo: { value: pal[4].clone().lerp(pal[5], 0.28).multiplyScalar(0.92) }, uOff: { value: off }, uRc: { value: s.collarR }, ...bayOff }) });
    const m = new THREE.Mesh(g, mat); m.position.copy(off); m.frustumCulled = false; m.renderOrder = -1; m.name = 'collar' + s.index;
    root.add(m); s.collar = m;
    await ctx.yield?.();
  }

  // ---- the portal's bay: the cloud base lowered round the seat (opts.bay !== false). A ring wall 100 m from the seat's
  // axis hangs to 500 m (lower at the back), with a roof 40 m above the seat and its mouth open toward the approach; two
  // shelves trail back from the mouth either side of the line of approach, rising toward S5's collar. Nothing hangs within
  // 55 m of the line. Same shader as the collars, so it is one cloud with them and the base; rows run far to near along
  // the approach (the painter's order from the last straight).
  const bgd = new THREE.Vector2(seat.x - approach0.x, seat.z - approach0.z).normalize();   // the approach's heading on the map
  function bayDrop(x, z) {
    const dx = x - seat.x, dz = z - seat.z, a = dx * bgd.x + dz * bgd.y, l = -dx * bgd.y + dz * bgd.x, rho = Math.hypot(a, l);
    const lump = clamp(noise.fbm2(x / 120 + 51.3, z / 120, 2) * 0.9, -0.8, 0.8);
    const pouch = Math.sqrt(Math.min(Math.hypot(noise.n2(x / 88 + 3.3, z / 88 + 1.7), 0.06) * 1.7, 1));   // 0.3 along a crease, 1 at the bottom of a pouch (as the base's are)
    const wall = Math.exp(-Math.pow((rho - 100) / 62, 2)) * (118 + 26 * smoothstep(-40, 90, a));
    const roof = 52 * Math.exp(-Math.pow(rho / 70, 2));
    const mouth = 1 - Math.exp(-Math.pow(l / 62, 2)) * (1 - smoothstep(-55, 25, a));
    const t = clamp(-a / 300, 0, 1), al = Math.abs(l) - (118 + 50 * t);
    const arm = (1 - smoothstep(10, 50, a)) * (112 - 62 * t) * Math.exp(-Math.pow(al / (58 - 14 * t), 2)) * (1 - smoothstep(0.8, 1, t));
    const body = Math.max(wall, arm) + roof;
    return Math.max(body * mouth * (1 + 0.38 * lump) + (7 * (lump + 0.45) + 20 * (pouch - 0.6)) * smoothstep(8, 40, body * mouth), 0);
  }
  let bay = null;
  if (opts.collars !== false && opts.bay !== false) {
    const A0 = 250, A1 = -300, LW = 300, nl = 60, na = 55;
    const g = gridGeo(nl, na), P = g.getAttribute('position');
    const nrm = new Float32Array(P.count * 3), aK = new Float32Array(P.count * 2);
    for (let k = 0; k < P.count; k++) {
      const fl = P.getX(k), fa = P.getY(k), a = lerp(A0, A1, fa), l = (fl * 2 - 1) * LW;
      const lx = bgd.x * a - bgd.y * l, lz = bgd.y * a + bgd.x * l, x = seat.x + lx, z = seat.z + lz;
      const d = bayDrop(x, z), e = 3;
      const fx = -(bayDrop(x + e, z) - bayDrop(x - e, z)) / (2 * e), fz = -(bayDrop(x, z + e) - bayDrop(x, z - e)) / (2 * e);
      const il = 1 / Math.hypot(fx, 1, fz);
      P.setXYZ(k, lx, -d + 3, lz);
      nrm[k * 3] = fx * il; nrm[k * 3 + 1] = -il; nrm[k * 3 + 2] = fz * il;
      const rim = Math.min(fl, 1 - fl, fa, 1 - fa);
      aK[k * 2] = smoothstep(4, 24, d) * smoothstep(0, 0.07, rim);
      aK[k * 2 + 1] = clamp(d / 130, 0, 1);
      if (k % 150 === 149) await ctx.yield?.();
    }
    g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.setAttribute('aK', new THREE.BufferAttribute(aK, 2));
    const off = new THREE.Vector3(seat.x, H, seat.z);
    const glowCol = new THREE.Color(opts.lanternColor ?? '#BFF3EE').multiplyScalar(0.13);
    const mat = new THREE.ShaderMaterial({ ...matBase, side: THREE.DoubleSide, vertexShader: COLLAR_VERT, fragmentShader: COLLAR_FRAG,
      uniforms: shared({ uIndigo: { value: pal[4].clone().lerp(pal[5], 0.28).multiplyScalar(0.92) }, uOff: { value: off }, uRc: { value: 230 },
        uGlowPos: { value: new THREE.Vector3(0, seat.y - H, 0) }, uGlowCol: { value: glowCol }, uBar: { value: new THREE.Vector4(bgd.x, bgd.y, -105, 46) }, uLitK: { value: 0.8 }, uBarK: { value: 1.5 }, uFormK: { value: 1 } }) });
    bay = new THREE.Mesh(g, mat); bay.position.copy(off); bay.frustumCulled = false; bay.renderOrder = -0.9; bay.name = 'portal-bay';
    root.add(bay);
    await ctx.yield?.();
  }

  // ---- life cycle
  let progressSet = false, progress = 0;
  function applyProgress(u) {
    progress = u;
    const d = sisters[dying]?.life, b = sisters[newborn]?.life;
    if (d) {
      const lift = smoothstep(tl.rope, tl.gone, u);
      d.thin = lerp(lerp(1, 0.32, smoothstep(tl.thin, tl.rope, u)), 0.14, lift);
      d.kink = smoothstep(tl.kink, tl.kink + 0.035, u) * (1 - 0.55 * lift);
      d.foot = 15 + (H - 15) * Math.pow(lift, 1.5);
      d.taper = smoothstep(tl.rope - 0.03, tl.rope + 0.01, u);
      d.spray = 1 - smoothstep(tl.rope - 0.04, tl.gone - 0.02, u);
      d.stain = 1 - 0.8 * smoothstep(tl.gone - 0.03, tl.gone + 0.14, u);
      d.arms = 1 - smoothstep(tl.gone - 0.02, tl.gone + 0.16, u);
      d.alpha = 1 - smoothstep(tl.gone - 0.012, tl.gone + 0.008, u);
    }
    if (b) {
      const f = smoothstep(tl.finger, tl.down, u);
      b.stain = smoothstep(tl.spot, tl.spot + 0.07, u);
      b.arms = smoothstep(tl.spot + 0.04, tl.ring + 0.02, u);
      b.spray = smoothstep(tl.ring, tl.ring + 0.08, u);
      b.foot = H - (H - 15) * f;
      b.taper = 1 - smoothstep(tl.down - 0.02, tl.down + 0.05, u);
      b.thin = lerp(0.6, 1, smoothstep(tl.down - 0.1, tl.down + 0.1, u));
      b.kink = 0;
      b.alpha = smoothstep(tl.finger, tl.finger + 0.02, u);
    }
  }
  applyProgress(0);

  const TAU = Math.PI * 2, LIFE_KEYS = ['foot', 'thin', 'kink', 'taper', 'spray', 'stain', 'arms', 'alpha'];
  const _buf = new THREE.Vector2();
  function pose(time) {
    for (const s of sisters) {
      let L = s.life;
      if (s.forced) { L = s.eff; for (let k = 0; k < LIFE_KEYS.length; k++) { const key = LIFE_KEYS[k], v = s.forced[key]; L[key] = v !== undefined ? v : s.life[key]; } }
      s.base.set(s.home.x + s.walkA * Math.sin(s.walkF[0] * time + s.walkP[0]), s.home.y + s.walkA * Math.cos(s.walkF[1] * time + s.walkP[1]));
      s.uA.set(s.top.x - s.base.x, s.top.y - s.base.y, L.foot, L.taper);
      s.uB.set(s.b1 * Math.cos(s.bf[0] * time + s.bp[0]), s.b1 * Math.sin(s.bf[1] * time + s.bp[1]), s.b2 * Math.cos(s.bf[2] * time + s.bp[2]), s.b2 * Math.sin(s.bf[3] * time + s.bp[3]));
      s.uC.set(s.waist, s.trumpet, L.kink * 46, L.thin);
      s.uD.set(Math.cos(s.kinkDir), Math.sin(s.kinkDir), s.braids, s.seed);
      s.uSpin.set((s.omega * time) % TAU, (s.omega * 1.23 * time) % TAU, (s.omega * 0.81 * time) % TAU);
      if (s.uThrU) s.uThrU.value = (s.omega * 0.3 * time) % TAU;
      s.uSk.set(s.waist * 1.16 * Math.max(L.thin, 0.35), s.ring, s.crown, L.spray);
      s.uBase.copy(s.base); s.uAlpha.value = L.alpha;
      if (s.skirt) s.skirt.material.uniforms.uSpinS.value = (s.omega * 0.3 * time) % TAU;
      for (const o of s.objs) o.position.set(s.base.x, 0, s.base.y);
      const tubeOn = L.alpha > 0.004 && L.foot < H - 10;
      for (const o of s.objs) o.visible = o === s.tube ? tubeOn : o.isPoints || o === s.skirt ? L.spray > 0.01 : tubeOn;
      uStA[s.index].set(s.base.x, s.base.y, s.stainR, L.stain);
      uStB[s.index].set(s.ring, L.arms, L.spray, (-spinDir * 0.11 * time + s.seed) % TAU);
    }
  }

  // JS replica of the shader spine: local axis position of sister i at height y (target.w = wall radius there)
  function spineAt(i, y, target = new THREE.Vector4()) {
    const s = sisters[i], A = s.uA, B = s.uB, C = s.uC, D = s.uD;
    const t = clamp(y / H, 0, 1);
    const tent = Math.max(1 - 2 * Math.sqrt((t - 0.5) * (t - 0.5) + 0.0012), 0);
    const ox = A.x * t + B.x * Math.sin(Math.PI * t) + B.z * Math.sin(2 * Math.PI * t) + D.x * C.z * tent;
    const oz = A.y * t + B.y * Math.sin(Math.PI * t) + B.w * Math.sin(2 * Math.PI * t) + D.y * C.z * tent;
    const rw = C.x * C.w, dd = Math.max(H - y, 0), flare = 0.58 * Math.exp(-dd / 38) + 0.42 * Math.exp(-dd / 78);
    let r = rw * (1 + 0.16 * Math.exp(-y / 50)) + Math.max(C.y * lerp(1, C.w, 0.6) - rw, 0) * flare;
    r *= lerp(1, 0.04 + 0.96 * smoothstep(0, 70, y - A.z), A.w);
    return target.set(s.base.x + ox, y, s.base.y + oz, r);
  }

  let lastTime = 0;
  const _sp = new THREE.Vector4(), _rank = [0, 1, 2, 3, 4, 5], _dist = [0, 0, 0, 0, 0, 0];
  function update(dt, time, camera) {
    lastTime = time;
    if (!progressSet) applyProgress((time / 44) % 1);
    G.uTime.value = time;
    G.uPatch.value.x = time * 8.5; G.uPatch.value.y = time * 3.5;
    let bh = 450;
    if (ctx.renderer?.getDrawingBufferSize) bh = ctx.renderer.getDrawingBufferSize(_buf).y || 450;
    const p11 = camera?.projectionMatrix ? camera.projectionMatrix.elements[5] : 1.664;
    G.uPx.value = 0.5 * bh * p11; G.uMaxPt.value = Math.min(0.18 * bh, 160);
    pose(time);
    // Draw order, far sister first. three.js sorts transparent objects by the depth of their origin, and a sister's origin is
    // her foot on the sea: from the helix, looking up, the nearest foot lies behind the camera's plane and sorts wrongly, so
    // a sister standing BEHIND the one we circle was drawn over her (a bright "second tube" down her middle). Rank them here
    // by horizontal distance from the eye to the axis at the eye's own height. Nearest 0, then -0.01, -0.02 ...
    if (camera?.matrixWorld) {
      const ce = camera.matrixWorld.elements, re = root.matrixWorld.elements;
      const cx = ce[12] - re[12], cy = clamp(ce[13] - re[13], 0, H), cz = ce[14] - re[14];
      for (let i = 0; i < N_SP; i++) { spineAt(i, cy, _sp); _rank[i] = i; _dist[i] = Math.hypot(_sp.x - cx, _sp.z - cz); }
      _rank.sort((a, b) => _dist[a] - _dist[b]);
      for (let r = 0; r < N_SP; r++) { const o = sisters[_rank[r]].objs; for (let k = 0; k < o.length; k++) o[k].renderOrder = -0.01 * r; }
    }
  }
  pose(0);

  // ---- anchors (local space)
  const mx = (x, y, z) => new THREE.Vector3(x * mirror, y, z);
  const fly = [mx(0, 12, 930), mx(0, 12, 730), mx(-35, 35, 550), mx(40, 35, 320), mx(-5, 30, 90), mx(-30, 30, -220)];
  for (let k = 1; k <= 15; k++) {
    const a = (k / 15) * 2.5 * Math.PI, R = lerp(100, 85, k / 15), y = lerp(30, approach0.y, k / 15);
    fly.push(mx(70 - R * Math.cos(a), y, -220 - R * Math.sin(a)));
  }
  fly.push(seat.clone());
  const dirOut = new THREE.Vector3().subVectors(seat, approach0).normalize();
  const anchors = {
    origin: new THREE.Vector3(0, 0, ORIGIN_Z),
    sisters: sisters.map((s) => ({ base: new THREE.Vector3(s.home.x, 0, s.home.y), top: new THREE.Vector3(s.top.x, H, s.top.y), waist: s.waist * 2, ring: s.ring * 2 })),
    portalSeat: { position: seat.clone(), normal: dirOut.clone().negate(), direction: dirOut.clone(), radius: opts.portalRadius ?? 10 },
    flyThrough: fly,
    entry: mx(0, 12, 930),
    closePass: { position: mx(-5, 30, 90), target: mx(65, 45, 80) },
    helixCentre: mx(70, 0, -220),
    viewpoints: [
      { position: mx(0, 12, 930), target: mx(0, 180, 300) },
      { position: mx(-35, 35, 560), target: mx(55, 60, 540) },
      { position: mx(-5, 30, 100), target: mx(65, 60, 70) },
      { position: mx(70, 215, -130), target: mx(40, 120, -320) },
      { position: approach0.clone().lerp(seat, 0.45), target: seat.clone() },
    ],
  };

  const hero = {
    object: root,
    radius: VIEW ? VIEW.radius : 440,
    height: VIEW ? VIEW.height : H,
    center: VIEW ? new THREE.Vector3(...VIEW.center) : new THREE.Vector3(0, 230, 0),
    anchors, sisters, spineAt, update,
    PATCH_GLSL: NOISE_GLSL + PATCH_GLSL, patchUniforms: { uPatch: G.uPatch },
    uniforms: G,
    get progress() { return progress; },
    setProgress(u) { progressSet = true; applyProgress(clamp(u, 0, 1)); },
    setLife(i, life) { if (sisters[i]) { sisters[i].forced = life || null; pose(lastTime); } },
    setLight(l = {}) {
      if (l.sunDir) G.uSunDir.value.copy(l.sunDir).normalize();
      if (l.sunColor) G.uSunCol.value.copy(l.sunColor);
      if (l.shadowColor) G.uShadowCol.value.copy(l.shadowColor);
      if (l.bounceColor) G.uBounceCol.value.copy(l.bounceColor);
      if (l.patchMin !== undefined) G.uPatch.value.z = l.patchMin;
    },
    collarHeight(i, x, z) { return H + 3 - collarDrop(sisters[i], x, z); },
    bayHeight(x, z) { return H + 3 - (bay ? bayDrop(x, z) : 0); },   // the underside of the portal's bay at local (x, z)
    bay, bayBar: new THREE.Vector4(bgd.x, bgd.y, -105, 46),         // the sun bar across its mouth: (heading x, z, metres along the heading from the seat, half width)
    dispose() { quad.dispose(); },
    ground: true, groundY: -0.5,
  };
  root.userData.hero = hero;
  return hero;
}
