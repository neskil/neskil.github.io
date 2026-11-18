// Hero set piece for "canyon-of-light": THE ARCH.
//
// A free-standing Navajo-sandstone span on the far rim of the amphitheatre. Opening 64 m wide and
// 48 m high, the span 12 m thick at the crown and swelling into heavy shoulders and flared legs;
// horizontal bedding ledges, cream / red strata, plum desert-varnish streaks, an underside that
// glows orange with bounced light. A slow sandfall pours from a notch in the top 16 m left of
// centre: a sunlit veil with falling grains, a wind-frayed dust plume and a sand cone at its foot.
// Spindrift blows off the crest, sand streamers snake across the sill, swifts wheel through the opening.
// The Arch stands on its own rim block (slickrock sill, sand drifts, talus, one or two hoodoos)
// whose sides are 50 m cliffs, so the ground really does fall away behind it.
//
// LOCAL SPACE  origin = centre of the opening at amphitheatre-floor level (y = 0), +Y up, the front
//   (the side the camera arrives from, 200 m down the slot's axis) faces +Z. "Left" = -X.
//   The sill under the opening sits at y ~ +1; the rim block's top dips to y = -2 at its edge, so
//   put your amphitheatre floor at y = 0 and let it bury the block's front and side cliffs
//   (block edge: |x| ~ 92, z ~ +48 in front). Behind (z < -26) the block is the rim cliff: keep
//   your terrain low there (y <= -40) so sky and far mesas show through the opening.
//
// SIZE   radius 62 (the arch itself; its rim block reaches |x| ~95), height 62, center (0,26,0).
// COST   ~80k triangles, 5 draw calls (rock 1, sand veils 1, grains 1, dust 1, swifts 1), no
//        lights, no textures, built in short steps (ctx.yield() throughout, also inside the long loops).
//
// LIGHTING  Self-lit: every material here is a ShaderMaterial that writes linear HDR and honours
//   scene fog, but ignores scene lights. Noon sun, sky fill and ground bounce are uniforms, and
//   the Arch's shadow on itself and on the sill is baked per vertex at build time from opts.sunDir.
//   It wants: a noon sun a little behind and to the left (default), so the front face is in open
//   shade glowing with bounce, every ledge top is rim-lit, the veil is backlit and the Arch's
//   shadow lies on the sill toward the camera; a deep blue sky behind
//   (#1f4fa8-ish, not bright: the veil and the sunlit caprock should be the brightest things),
//   thin warm fog. Bloom threshold ~0.9 is right; the sunlit veil peaks around 2.2.
//
// opts
//   palette      7 hex strings (brief order: cream, orange, red-orange, deep red, plum, near-black, sky)
//   sunDir       [x,y,z] local direction TO the sun (default [-0.36, 0.86, -0.36]); baked shadows follow it
//   sunColor     hex, sunIntensity (default '#fff0d8', 2.3)
//   skyColor     hex, skyIntensity (default palette[6]-ish blue, 0.65)
//   bounce       strength of the orange bounce light (default 1)
//   wind         [x,z] local wind direction for the veil's drift (default: per seed, mostly -X, away from the portal)
//   portalColor  hex of the exit portal (default palette[6]); its light on the inside of the opening
//   portalGlow   0..1 strength of that light (default 0; ~0.4-0.6 reads as a cool sheen on the legs and underside)
//   shimmer      0..1 slow breathing of the bounce light on rock inside the slot (z > 200); default 0 (off)
//   swifts       number of white-throated swifts wheeling through the opening (default 16, 0 = none)
//   yield        a function to await in place of ctx.yield() (a world that paces its own build passes its own)
//
// anchors (all local space; positions are THREE.Vector3)
//   portalSeat     { position (0,22,0), normal (0,0,1), radius 10 }  the 20 m circle portal hangs here,
//                  facing the camera; nearest rock is 20 m away, the veil's edge 3 m outside its rim
//   flyThrough     ordered points of the exit run: straight, level at y = 22 from z = 200 to the
//                  portal and 40 m beyond; >= 12 m from the veil, >= 22 m from rock everywhere
//   viewpoints     { slotMouth, burstOut, lowLeft, underSpan, behind }  good camera positions
//   lookAt         (0,26,0) centre of the opening (same as `center`)
//   sandfallTop    lip of the notch where the veil starts;  sandfallBase  its foot on the sand cone
//   trickles       origins of the thin sandfalls on the legs;  spires  hoodoo tops (x, height, z) on the block's flanks
//   apex           top of the span above the crown;  leftFoot / rightFoot  where the legs meet the sill
//   ravenPerch     a ledge on the right shoulder (position + normal) for a bird to launch from
//   swiftCenter    centre of the opening, for wheeling flocks (radius ~25 clear in the XY plane)
//   sunDir         the sun direction actually used
//   rimEdgeZ       z of the rear cliff edge (terrain should drop away behind it)
//   blockHalfWidth / blockFrontZ   extent of the rim block to bury in your floor
//
// hooks
//   update(dt, time, camera)   animation (veil, grains, dust, swifts); pass the camera that renders
//   setProgress(u)             u = 0..1 over the final approach: one heavier gout of sand lets go at
//                              the notch (u ~0.25) and unfurls down the veil, reaching the floor in
//                              a burst of dust at u ~0.8. If never called, gentle surges loop on time.
//   setPortalGlow(color, k)    tint the inside of the opening with the portal's light
//   setSun(dirArrayOrVector3)  changes shading only (baked shadows stay as built)
//
// shared with the world (so the whole canyon is one sandstone)
//   rockMaterial   the ShaderMaterial of the Arch: geometry needs position, normal, color (albedo tint, may
//                  exceed 1) and aShade (x ambient occlusion / bounce grade, y sun visibility, z sand amount).
//                  A clone with defines { CANYON: 1 } (sharing .uniforms) is the slot-canyon variant: it also needs
//                  aSlot (x slot amount, y swept bedding coordinate, z slot-floor flag, w metres along the canyon on a
//                  slot wall, plus 4096 on the wall of the +x side; -1000 on the amphitheatre's ground, -2000 on the desert),
//                  aLd (the direction the slot's bounce light mostly comes from, scaled by how one-sided it is; zero
//                  outside the slot) and reads uniforms uPools[6] (x, z, radius, y of each beam's foot) and uBeamDir, and
//                  uHeroF[2], uHeroE1[2], uHeroE2[2], uHeroA: the hero beam's shafts (foot, the two axes of the section with
//                  their half sizes, the way the shaft climbs), whose pool is burnt onto the sand in the slit's own shape.
//                  In the slot the beds follow the flutes as crisp-edged strata at three scales (beds, partings,
//                  laminae) whose relief is shaded per pixel by that light, the deepest folds grade to plum, the
//                  floor gets wind ripples and the beams' pools of sun are drawn per pixel. Near the eye each set of the
//                  slot's walls resolves into its own beds (crisp steps of tone, a hand to a forearm thick, a thin dark
//                  parting between them, by the pixel's footprint: the even partings and laminae give way to them only
//                  where a bed's own edge is crisp) and varnish runs down across them; the amphitheatre's ground is drawn as benches, wash,
//                  drifted sand and dunes (uAmp: two offsets of the visit), the desert as zones of earth, flats and dunes.
//                  Slow cloud shadows drift over everything outside the slot.
//   sculpt.at(x,y,z,vert)  the relief function in metres along the normal; sculpt.cav = its cavity term (0..1)
//   groundAt(x,z)  sill height on the rim block;  blockE(x,z)  < 1 inside the block's footprint, 1 on its edge
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#f7e3c0', '#ff9d4d', '#d95f2b', '#8f2f1e', '#4a1a2c', '#1e0f1c', '#6fd6ff'];

const GLSL_NOISE = /* glsl */`
float h11(float n){ return fract(sin(n*127.1)*43758.5453); }
float h31(vec3 p){ p = fract(p*0.3183099 + vec3(0.71,0.113,0.419)); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vn3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h31(i), h31(i+vec3(1,0,0)), f.x), mix(h31(i+vec3(0,1,0)), h31(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i+vec3(0,0,1)), h31(i+vec3(1,0,1)), f.x), mix(h31(i+vec3(0,1,1)), h31(i+vec3(1,1,1)), f.x), f.y), f.z); }
float fbm3(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++){ s += a*vn3(p); p = p*2.03 + 7.1; a *= 0.5; } return s/0.875; }
float n1(float y){ float i = floor(y), f = fract(y); f = f*f*(3.0-2.0*f); return mix(h11(i), h11(i+1.0), f); }
float vn2(vec2 x){ vec2 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
  float a = h11(i.x + i.y*57.0), b = h11(i.x+1.0 + i.y*57.0), c = h11(i.x + (i.y+1.0)*57.0), d = h11(i.x+1.0 + (i.y+1.0)*57.0);
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }
`;

// ---------------------------------------------------------------- rock
const ROCK_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 color;
attribute vec3 aShade;           // x ambient occlusion, y baked sun visibility, z sand amount
uniform float uBufH;              // height of the picture in pixels
varying vec3 vP, vN, vCol, vShade;
varying float vPix;               // the angle one pixel spans
#ifdef CANYON
attribute vec4 aSlot;            // x slot amount, y swept bedding coordinate, z slot-floor flag, w metres along the canyon
attribute vec3 aLd;              // where the slot's bounce light mostly comes from (unit direction times how one-sided it is)
attribute vec2 aFar;             // set at the build, by place: x 1 where no pool's warm glow can reach any point of the triangles this corner belongs to, y 1 where none of them lies in the hall's round (0 where the answer is yes or not known)
varying vec4 vSlot;
varying vec3 vLd;
varying vec2 vFar;
#endif
void main(){
  vP = position; vN = normal; vCol = color; vShade = aShade;
  vPix = 2.0/(max(projectionMatrix[1][1], 0.05)*max(uBufH, 16.0));
  #ifdef CANYON
  vSlot = aSlot; vLd = aLd; vFar = aFar;
  #endif
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const ROCK_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uSun, uSunCol, uSkyCol, uBounceCol, uCam, uPortalCol, uPortalPos;
uniform vec3 uCream, uOrange, uRed, uDeep, uPlum, uDark;
uniform float uPortalGlow, uStrataPhase, uBed, uTime, uShimmer;
uniform vec2 uWind;
varying vec3 vP, vN, vCol, vShade;
varying float vPix;
#ifdef CANYON
varying vec4 vSlot;
varying vec3 vLd;
varying vec2 vFar;               // (see aFar: exactly 0 all over every triangle that a glow, or the hall's round, can reach)
uniform vec4 uPools[6];          // beams standing in the slot: x, z of the foot, radius, y of the foot
uniform vec3 uBeamDir;
uniform vec4 uCourtC;            // the open court's sunbeam: x, y, z of the middle of its patch on the floor; w how bright the patch is on sand
uniform vec4 uCourtA;            // the patch's long axis (x, z, unit), its half length and half width
uniform vec3 uCourtD;            // the direction that light comes from
uniform vec4 uCourtS;            // the sapling's shadow on the court's patch: x, z of the crown's shadow, its radius, its strength
uniform vec3 uCourtT;            // x, z of the trunk's foot and the trunk shadow's strength
uniform vec3 uHeroF[8];          // the hero beam, the soft ray beside it, the smaller pillars and the thin blades: the foot of each shaft's axis on the sand
uniform vec4 uHeroE1[8];         // the long axis of the shaft's section (unit, square to the shaft) and its half length
uniform vec4 uHeroE2[8];         // the short axis and its half width
uniform vec2 uHeroK[8];          // how fast the spill of light round each pool dies out, and how strong it is
uniform vec3 uHeroA;             // the direction the shafts climb in (unit)
uniform vec3 uHallF[3];          // the hall's three shafts: the same four things as above for each
uniform vec4 uHallE1[3];
uniform vec4 uHallE2[3];
uniform vec2 uHallK[3];
uniform vec4 uHallC;             // the middle of the hall (world space) and the radius of its round, in plan: its pools are drawn inside it only
uniform vec4 uGlowP[12];         // every pool that throws a warm glow round itself, in one list (the eight places of the hero beam's kind: the hero beam, the pillars, the blades and, last, the first slot's lesser shaft; the hall's three; the court's patch): the pool's middle on the sand, and the square of the distance beyond which its glow is exactly nothing
uniform vec4 uGlowE[12];         // .. its long axis and half length
uniform float uGlowS[12];        // .. and how strong its glow is (by the pool's kind)
uniform vec4 uGlyphC;            // the blade of sun on the petroglyph wall: the middle of its patch, and its radius
uniform vec3 uGlyphL;            // the direction that light comes from (unit)
uniform sampler2D uGlyphTex;     // the petroglyphs: the marks' coverage in its alpha
uniform vec4 uGlyphU, uGlyphV;   // the panel's axes on the wall (unit: along the wall, up it) and its half length and half height
uniform vec3 uGlyphN;            // the way the panel's rock faces (unit)
uniform vec4 uHoo[3];            // the hoodoos on the plain: x, y of the foot, z, height
uniform vec3 uHooR[3];           // radius at the foot, 1 if it carries a cap
uniform float uMouthD;           // metres along the canyon at which the slot's mouth lies
uniform vec4 uAmp;               // the amphitheatre's floor: the phase of its wash, and the seed of its benches
#endif
uniform vec3 uGlowCol;
${GLSL_NOISE}
// strata with crisp edges: a value that steps from one hashed level to the next, the step antialiased by e (half its
// width in periods; at e = 0.5 it is plain value noise, so far beds melt into soft bands instead of aliasing)
// Returns the value and its slope per unit of p: the slope goes straight into the bump, so a bed's edge is shaded per pixel
// (screen-space derivatives of a step this sharp come out in 2 x 2 pixel blocks).
vec2 bandS(float p, float e){
  float i = floor(p), f = fract(p), a = h11(i), b = h11(i + 1.0);
  float t = clamp((f - 0.5 + e)/(2.0*e), 0.0, 1.0);
  return vec2(mix(a, b, t*t*(3.0 - 2.0*t)), (b - a)*3.0*t*(1.0 - t)/e);
}
// a term of the relief or the colour with c cells to the pixel: whole while a cell spans four pixels or more, gone before it
// spans two. Every noise the bump differentiates is weighted by this, because screen-space derivatives of noise a pixel
// cannot resolve come out as a quilt of 2 x 2 pixel blocks (and the colour terms would sparkle).
float seen(float c){ return 1.0 - smoothstep(0.15, 0.42, c); }
// the height the bump is taken from by screen-space derivatives: rounded lumps drawn out along the beds, and grain.
// fp: how much of p one pixel covers. (The beds' own steps are not in here: their slopes are known exactly, see bandS.)
float rockH(vec3 p, float fp){
  float h = 0.0, a = 0.5, f = 0.55;
  vec3 q = p*0.55;
  for (int i = 0; i < 3; i++){ h += a*(vn3(q) - 0.5)*seen(fp*f); q = q*2.03 + 7.1; f *= 2.03; a *= 0.5; }
  return h*0.9/0.875;
}
// the grain: its slope is taken per pixel, from the pixel's own footprint on the rock (a screen-space derivative of anything
// this fine comes out as a quilt of 2 x 2 pixel blocks in the shaded hollows)
float rockG(vec3 p){ return (vn3(p*5.5) - 0.5)*0.08; }
#ifdef CANYON
// The lie of the amphitheatre's floor, in levels: lowest along the dry wash that runs from under the pour-off, rising away
// from it toward the cliffs and up the amphitheatre (a round-bottomed valley, never a plain V), bent by the ground's own swells
// at the scale of a terrace and of several. Its level lines are the edges of the slickrock benches, which step down toward the
// wash in curved terraces that close into lobes and bays.
float benchE(vec2 p, float o1){
  float wX = 16.0*sin(p.y*0.03 + o1)*(1.0 - smoothstep(150.0, 200.0, p.y));
  float dW = p.x - wX;
  return 0.045*sqrt(dW*dW + 400.0) + 0.02*(p.y - 40.0) + 4.0*(vn2(p*0.017 + 3.0) - 0.5) + 1.3*(vn2(p*0.043 + 29.0) - 0.5) + 0.5*(vn2(p*0.06 + 11.0) - 0.5);
}
// The beds inside one set of the slot's rock (sid: the set; sf: the place in it, 0 at its foot .. 1 at its top; wS1: sets under
// one pixel; dFl: what the bedding coordinate changes by across the pixel, along each of its axes; dxz: the pixel's two axes on
// the rock, in plan; lenPx: the longer of them in metres). Three to five thick beds to a
// set, of unequal thickness, lying at the set's own low angle and bending along the wall; most of them built of three thin
// ones. Returns the bed's tone (0 soft and red .. 1 hard and pale), how far the beds are resolved by this pixel, the metres of
// bedding from here to the middle of the bed, and the shade under the nose of a bed harder than the one beneath it and in
// the parting between two beds; and in
// crisp how far an edge is a crisp one here (1 while a bed spans many pixels, 0 before its edge is a soft ramp): x for the
// thick beds, y for the thin ones inside them (nothing where a thick bed has none).
vec4 setBeds(float sid, float sf, vec3 P, float ysv, float wS1, vec2 dFl, vec4 dxz, float lenPx, out vec2 crisp){
  float sm = mod(sid, 113.0);
  float hA = h11(sm*1.93 + 0.7), hB = h11(sm*3.11 + 5.3), hC = h11(sm*0.57 + 2.9), hD = h11(sm*2.37 + 8.1), hE = h11(sm*4.71 + 1.3);
  float nb = floor(mix(3.0, 5.99, hA));                        // thick beds in this set: 31 cm down to 19 cm apiece, before they swell and pinch
  float massive = step(hB, 0.1);                               // one set in ten: a massive bed of one tone, not split into beds
  float gam = mix(0.62, 1.0, smoothstep(0.35, 0.7, hC));      // beds that sweep down to lie along the set's foot, or plane ones
  float dip = 0.1*hE*sqrt(hE);                                  // how far they lean from the set (metres per metre), and which way
  vec2 dr = vec2(cos(hD*6.2832), sin(hD*6.2832));
  float sfc = clamp(sf, 0.03, 1.0), Gp = gam*pow(sfc, gam - 1.0);
  float ph = nb*(pow(sfc, gam) + dip*dot(P.xz, dr)/0.93) + 1.1*(vn3(vec3(P.x*0.16, ysv*0.8, P.z*0.16) + sm*3.7) - 0.5) + hB*7.0;
  // beds under one pixel: the bed phase's own change across it, signed along each axis (a wall seen along its length has a
  // long pixel, but its beds run with that length: only what the pixel crosses of them counts), and the slow wander's share
  float fbx = nb*(Gp*1.07*dFl.x + dip/0.93*dot(dxz.xy, dr)), fby = nb*(Gp*1.07*dFl.y + dip/0.93*dot(dxz.zw, dr));
  float fph = abs(fbx) + abs(fby) + 0.2*lenPx;
  // unequal thickness: the beds' own count is drawn out here and crowded there
  float a1 = hA*6.2832, a2 = hC*6.2832;
  float Jp = 1.0 + 0.46*cos(2.3*ph + a1) + 0.37*cos(5.3*ph + a2);
  float pq = ph + 0.2*sin(2.3*ph + a1) + 0.07*sin(5.3*ph + a2), fpq = fph*Jp;
  float bi = floor(pq), bfr = pq - bi, e = clamp(0.5*fpq, 0.01, 0.5);
  float tt = clamp((bfr - 0.5 + e)/(2.0*e), 0.0, 1.0); tt = tt*tt*(3.0 - 2.0*tt);
  float bm = mod(bi, 97.0), sd1 = sm*17.3;
  float t0 = h11(bm*7.31 + sd1), t1 = h11((bm + 1.0)*7.31 + sd1);
  // (a bed's tone is drawn while its edge is a small part of it; before the edge is a ramp as wide as the bed, the bed is gone)
  float kIn = (1.0 - smoothstep(0.2, 0.4, fpq))*(1.0 - massive), kSet = (1.0 - smoothstep(0.2, 0.4, wS1))*massive;
  // the thin beds, three to a thick one (their edges fall on the thick ones' edges); some thick beds have none
  float q3 = 3.0*pq - 1.0, b3 = floor(q3), f3 = q3 - b3, e3 = clamp(1.0*fpq, 0.01, 0.5);
  float t3 = clamp((f3 - 0.5 + e3)/(2.0*e3), 0.0, 1.0); t3 = t3*t3*(3.0 - 2.0*t3);
  float m3 = mod(b3, 89.0);
  float th0 = smoothstep(0.2, 0.8, h11(m3*3.97 + sd1 + 5.0)), th1 = smoothstep(0.2, 0.8, h11((m3 + 1.0)*3.97 + sd1 + 5.0));   // (a hard pale bed or a soft red one, seldom between)
  float thin = mix(th0, th1, t3);
  float lam = mix(step(0.28, h11(bm*2.13 + sd1 + 3.0)), step(0.28, h11((bm + 1.0)*2.13 + sd1 + 3.0)), tt);
  float k3 = lam*(1.0 - smoothstep(0.3, 0.6, 3.0*fpq));       // (the thin beds are drawn while one is two pixels thick, then melt into the thick bed's tone)
  crisp = vec2(1.0 - smoothstep(0.14, 0.3, fpq), lam*(1.0 - smoothstep(0.2, 0.42, 3.0*fpq)))*(1.0 - massive);   // (a massive bed keeps the even partings and laminae: it is never barer than the rock was)
  float tone = smoothstep(0.06, 0.94, mix(t0, t1, tt));
  tone = 0.5 + (tone - 0.5)*mix(1.0, 0.5, k3) + (thin - 0.5)*k3;
  tone = mix(tone, 0.2 + 0.6*hE, massive);
  float dq = mix((tt - bfr)/max(Jp*nb*Gp*1.07, 0.5), (0.5 - sf)/1.07, massive);
  // (the shade: some centimetres deep, soft below, never a line; gone before it is thinner than a pixel)
  float wsh = 0.03*nb*Gp*1.07*Jp, Dsh = min(3.0*wsh, 0.5);
  float sh = (1.0 - tt)*(1.0 - smoothstep(0.0, max(Dsh, 1e-3), 0.5 - bfr))*clamp((t1 - t0 - 0.12)*2.4, 0.0, 1.0)*clamp(Dsh/max(2.4*fpq, 1e-3), 0.0, 1.0)*kIn;
  float w3 = 0.016*3.0*nb*Gp*1.07*Jp, D3 = min(3.0*w3, 0.5);  // .. and the same under a thin hard bed, in little
  float sh3 = (1.0 - t3)*(1.0 - smoothstep(0.0, max(D3, 1e-3), 0.5 - f3))*clamp((th1 - th0 - 0.15)*2.2, 0.0, 1.0)*clamp(D3/max(7.2*fpq, 1e-3), 0.0, 1.0)*k3*kIn;
  // the parting between two beds: a thin dark seam where the softer rock has weathered back, a centimetre or two of it and
  // never under a pixel and a half, crisp on both sides; some seams strong, some faint. (Shade in a recess, never a line of light.)
  float bpm = nb*Gp*1.07*Jp;                                   // beds to the metre here
  float pwk = max(0.014*bpm, 0.7*fpq);
  float part = (1.0 - smoothstep(pwk - e, pwk + e, abs(bfr - 0.5)))*mix(0.4, 1.0, h11(bm*5.13 + sd1 + 9.0))*crisp.x;
  float e3p = clamp(1.5*fpq, 0.01, 0.5), pw3 = max(0.024*bpm, 2.1*fpq);   // .. and a fainter one between the thin beds
  float part3 = (1.0 - smoothstep(pw3 - e3p, pw3 + e3p, abs(f3 - 0.5)))*mix(0.2, 0.8, h11(m3*2.71 + sd1 + 13.0))*crisp.y;
  return vec4(tone, kIn + kSet, dq, max(max(sh, 0.8*sh3), max(part, part3)));
}
#endif
#ifdef CANYON
// The warm light a pool of sun throws back on the rock and the sand round it: by the pool's place alone (d: from the pool's
// middle on the sand to this point; e1: the pool's long axis and half length), falling off with the distance from the pool
// (taken to the nearest point of its long middle line) and gone at some three times its reach, strongest on faces that look
// at the pool. Added light and nothing else.
float poolGlow(vec3 d, vec4 e1, vec3 n, float sandK){
  float hl = min(e1.w, 3.2), R = 2.2 + 1.2*hl;
  vec3 tp = e1.xyz*clamp(dot(d, e1.xyz), -0.8*e1.w, 0.8*e1.w) + vec3(0.0, 0.4, 0.0) - d;
  float r2 = dot(tp, tp);
  if (r2 > 10.24*R*R) return 0.0;
  float r = sqrt(r2), fc = clamp(dot(n, tp/max(r, 1e-3))*1.3 + 0.2, 0.0, 1.0);
  return mix(fc, 0.55, sandK)/(1.0 + r2/(R*R))*(1.0 - smoothstep(1.8*R, 3.2*R, r));
}
#endif
void main(){
  vec3 N = normalize(vN);
  vec3 toCam = uCam - vP;
  float dist = length(toCam);
  vec3 rd = -toCam/max(dist, 1e-3);
  // The ripK of rock under this pixel, worked out from the smooth normal and the camera. Every fade below is driven by it
  // and not by fwidth(): screen-space derivatives are constant over 2 x 2 pixels, and where the rock turns away from the eye
  // (the lip of a wall against the sky) they jump from one block to the next and turn every threshold into a plaid.
  // (the rock is drawn unrotated: object space and world space share their axes)
  vec3 camR = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), camU = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  float nr = dot(N, rd); nr = (nr < 0.0 ? -1.0 : 1.0)*max(abs(nr), 0.04);
  vec3 dPx = dist*vPix*(camR - rd*(dot(N, camR)/nr)), dPy = dist*vPix*(camU - rd*(dot(N, camU)/nr));
  float fw = length(dPx) + length(dPy);                    // metres of rock under one pixel
  float sl = 0.0, flr = 0.0, hiW = 0.0;
  #ifdef CANYON
  hiW = clamp(-vSlot.z, 0.0, 1.0);                         // high on the slot's walls, where the mesh's rows stand metres apart
  // (what the vertices carry is held in its range: with multisampling on, a pixel on the edge of a sliver of rock seen edge-on
  // reads it extrapolated far outside, and one such pixel "ten times in the sun" blooms into a small bright square)
  sl = clamp(vSlot.x, 0.0, 1.0); flr = clamp(vSlot.z, 0.0, 1.0);
  float sideW = step(2048.0, vSlot.w), dAl = vSlot.w - 4096.0*sideW;   // which of the slot's two walls this is, and the metres along the canyon
  float mwS = sl*smoothstep(uMouthD - 62.0, uMouthD - 34.0, dAl);   // the walls that frame the mouth (all that are in the picture as the mouth is)
  #else
  float mwS = 0.0;
  #endif
  float fine = 1.0 - smoothstep(22.0, mix(220.0, 120.0, sl), dist);   // (fine beds carry further on the open cliffs)
  float sandy = clamp(vShade.z, 0.0, 1.0);
  // open, level ground is either drifted sand or bare slickrock, with an edge between them that wanders at its own scale
  // (not a soft blend that follows the mesh)
  {
    float lvl = smoothstep(0.78, 0.95, N.y)*(1.0 - sl);
    float sEdge = sandy + 0.3*(vn3(vP*0.33 + 5.0) - 0.5) + 0.12*(vn3(vP*1.4) - 0.5)*seen(fw*1.4);
    float sw_ = clamp(0.12 + fw*0.6, 0.12, 0.5);
    sandy = mix(sandy, smoothstep(0.5 - sw_, 0.5 + sw_, sEdge), lvl);
  }
  // The amphitheatre's floor is slickrock and sand, not one sheet. Benches of banded slickrock step down toward the wash in
  // curved terraces (each bench its own bed of red, orange or cream, the beds' outcrop drawn along its level lines; a riser
  // of thin beds at each step, lit where it looks to the sun and in short hard shade where it looks away, with shade at its
  // foot); sand lies in the wash, against the cliffs' feet, in a drift below each step and in tongues laid down the wind
  // across the benches, the broader tongues in dunes with a long lit back and a short shaded slip face; the wash keeps cut
  // banks and cobbles; patches of the pavement are dark with varnish. All of it is placed by the lie of the ground (world
  // metres), the same from everywhere; each part is drawn while the pixel resolves it.
  float amph = 0.0, amRock = 0.0, amShade = 1.0, amSlip = 0.0, desF = 0.0;
  vec3 amCol = vec3(0.0), amG = vec3(0.0);
  #ifdef CANYON
  amph = (1.0 - sl)*step(vSlot.w, -500.0)*step(-1500.0, vSlot.w)*smoothstep(0.62, 0.86, N.y);
  desF = (1.0 - sl)*step(vSlot.w, -1500.0);
  if (amph > 0.001) {
    vec2 p = vP.xz;
    float o1 = uAmp.x;
    float E0 = benchE(p, o1);
    vec2 gE = vec2(benchE(p + vec2(0.8, 0.0), o1) - E0, benchE(p + vec2(0.0, 0.8), o1) - E0)/0.8;
    float gl = max(length(gE), 0.01);
    float Jq = 1.0 + 0.44*cos(2.2*E0 + 1.0), Eq = E0 + 0.2*sin(2.2*E0 + 1.0);   // benches of unequal width
    float fE = (abs(dot(gE, dPx.xz)) + abs(dot(gE, dPy.xz)))*Jq;          // levels under one pixel
    float bi = floor(Eq + 0.5), fr = Eq - bi;                             // the step nearest, and how far above (+) or below (-) it this is, in levels
    float bm = mod(bi, 53.0), bl = mod(bi - 1.0, 53.0);
    float eE = clamp(0.7*fE, 0.004, 0.5);
    float stp = smoothstep(-eE, eE, fr);                                   // 0 on the bench below the step, 1 on the bench above
    float tone = mix(h11(bl*3.1 + 2.0 + uAmp.y), h11(bm*3.1 + 2.0 + uAmp.y), stp);
    float hr = h11(bm*5.7 + 9.0 + uAmp.y);                                 // how high this step is (some are hardly a ramp)
    float rw = clamp(2.2*gl*Jq, 0.03, 0.34)*mix(0.5, 1.3, hr);            // the riser's width in plan, in levels
    float ris = stp*(1.0 - smoothstep(rw - eE, rw + eE, fr))*clamp(rw/max(1.3*fE, 1e-4) - 0.35, 0.0, 1.0);
    float tR = clamp(fr/max(rw, 1e-3), 0.0, 1.0);
    vec2 sunH = normalize(uSun.xz + vec2(1e-4, 0.0));
    float face = dot(-gE/gl, sunH);                                        // the riser looks toward the sun (+) or away from it (-)
    float rbed = bandS(tR*3.0 + bm*7.0, clamp(2.1*fE/max(rw, 1e-3), 0.04, 0.5)).x;
    vec3 risCol = mix(mix(uRed*0.8, uDeep, 0.45), mix(uOrange, uCream, 0.5)*0.9, rbed)*mix(0.46, 1.08, smoothstep(-0.4, 0.4, face))*(1.0 - 0.5*(1.0 - smoothstep(0.0, 0.3, tR)));
    // (the shade a riser that looks away from the sun lays on the bench below it)
    float swE = 1.1*gl*Jq*mix(0.5, 1.3, hr);
    float shCast = (1.0 - stp)*(1.0 - smoothstep(0.0, max(swE, 1e-3), -fr))*(1.0 - smoothstep(-0.4, 0.1, face))*clamp(swE/max(1.3*fE, 1e-4) - 0.3, 0.0, 1.0);
    vec3 bcol = mix(mix(mix(uRed*0.62, uDeep, 0.35), uOrange*0.6, 0.35), uOrange*0.7, smoothstep(0.34, 0.6, tone));
    bcol = mix(bcol, mix(uOrange, uCream, 0.5)*0.74, smoothstep(0.72, 0.94, tone));
    float cb = bandS(E0*4.3 + 3.0, clamp(3.4*fE/Jq, 0.03, 0.5)).x;         // the beds' outcrop along the level
    bcol *= mix(1.0, 0.64 + 0.72*cb, 1.0 - smoothstep(0.3, 0.7, 4.3*fE/Jq));
    float pv = smoothstep(0.6, 0.68, vn2(p*0.03 + 71.0) + 0.25*(vn2(p*0.21 + 5.0) - 0.5)*seen(fw*0.21));
    // (the benches are light ground on every visit: no bed lies darker than a set share of the sand's own light, whatever the rock's red)
    bcol *= max(1.0, 0.72*dot(uCream, vec3(0.3, 0.59, 0.11))/max(dot(bcol, vec3(0.3, 0.59, 0.11)), 1e-3));
    // (.. and a bench is weathered pavement, never one flat sheet of a colour: held up to that light, its beds still outcrop
    // along its level lines, the harder ones as paler, creamier lines and the rock between them redder at the bench's own
    // light, and the wind scours it paler in broad patches; drawn while a pixel resolves a bed, none of it under the floor above)
    { float cbK = 1.0 - smoothstep(0.3, 0.7, 4.3*fE/Jq), bY = dot(bcol, vec3(0.3, 0.59, 0.11));
      vec3 bHot = mix(uOrange, uCream, 0.6), bRed = mix(uRed, uOrange, 0.3);
      bcol = mix(bcol, bRed*(bY/max(dot(bRed, vec3(0.3, 0.59, 0.11)), 1e-3)), 0.4*(1.0 - cb)*cbK);
      bcol = mix(bcol, bHot*(1.24*bY/max(dot(bHot, vec3(0.3, 0.59, 0.11)), 1e-3)), 0.6*cb*cbK);
      bcol *= 1.0 + 0.14*smoothstep(0.4, 0.75, vn2(p*0.085 + 53.0)); }
    bcol = mix(bcol, uPlum*0.55 + uDeep*0.35, 0.62*pv*(0.75 + 0.5*mix(0.5, vn2(p*1.9), seen(fw*1.9))));
    // (.. and a riser in shade stays a line of warm shade, never a black one)
    risCol *= max(1.0, 0.5*dot(uCream, vec3(0.3, 0.59, 0.11))/max(dot(risCol, vec3(0.3, 0.59, 0.11)), 1e-3));
    amCol = mix(bcol, risCol, ris);
    amShade = 1.0 - 0.45*shCast;
    // where the sand lies
    float wX = 16.0*sin(p.y*0.03 + o1)*(1.0 - smoothstep(150.0, 200.0, p.y)), wd = (p.x - wX)/(8.0*(0.65 + 0.7*vn2(vec2(p.y*0.031, 7.0)))), wk = smoothstep(46.0, 92.0, p.y);   // (the bed narrows and widens down its length)
    float inW = exp(-wd*wd*0.7)*wk;
    float sdR = min(length(vec2(p.x, p.y - 85.0)) - 118.0, max(abs(p.x) - 124.0, p.y - 85.0));   // metres inside the cliffs (negative on the floor)
    float dwv = vn2(p*0.045 + 23.0), dw = 0.08 + 0.5*dwv*dwv;             // how far the drift lies out from the foot of a step, in levels
    float drift = (1.0 - stp)*(1.0 - smoothstep(0.4*dw, dw, -fr));
    vec2 wdir = -sunH;                                                     // (the wind comes from under the sun: the slip faces look away from it)
    float tng = vn2(vec2(dot(p, wdir)*0.013, dot(p, vec2(-wdir.y, wdir.x))*0.045) + 31.0);
    float sF = 0.7*(clamp(vShade.z, 0.0, 1.0) - 0.62) + 1.2*inW + 0.9*smoothstep(-26.0, -5.0, sdR) + 0.7*drift + 1.2*(tng - 0.5)
      + 0.25*(vn2(p*0.37 + 3.0) - 0.5)*seen(fw*0.37) + 1.5*exp(-(p.x*p.x + (p.y - 192.0)*(p.y - 192.0))/200.0)
      + 0.5*(vn2(p*0.12 + 19.0) - 0.5)                         // (.. in lobes a few metres across: where sand meets a bench the line wanders, it is never ruled)
      + 0.45*(vn2(vec2(dot(p, wdir)*0.07, dot(p, vec2(-wdir.y, wdir.x))*1.3) + 61.0) - 0.5)*seen(fw*1.3);   // (.. and in streaks laid down the wind: a bench's edge under sand is feathered, not cut)
    float sw2 = clamp(0.03 + fw*0.25, 0.03, 0.3);
    float sandA = smoothstep(0.3 - sw2, 0.3 + sw2, sF);
    sandy = mix(sandy, sandA, amph);
    amRock = amph*(1.0 - sandA);
    // dunes on the broader tongues: a long back up the wind, a short slip face down it
    float pd = dot(p, wdir)/10.0 + 3.2*vn2(p*0.028 + 5.0) + 0.9*vn2(p*0.09 + 15.0);   // (crests that bend: none runs straight)
    float fP = (abs(dot(wdir, dPx.xz)) + abs(dot(wdir, dPy.xz)))/10.0 + 0.12*fw;
    float sdn = fract(pd), ed = clamp(fP, 0.03, 0.3);
    float slip = smoothstep(0.74 - ed, 0.74 + ed, sdn)*(1.0 - smoothstep(1.0 - ed, 1.0, sdn));
    float dz = smoothstep(0.56, 0.74, tng)*sandA*(1.0 - inW)*(1.0 - smoothstep(0.25, 0.6, fP))*amph;
    // (each crest runs some tens of metres and dies out into flat sand)
    dz *= smoothstep(0.35, 0.6, vn2(vec2(floor(pd)*7.3, dot(p, vec2(-wdir.y, wdir.x))*0.05)));
    amG = vec3(wdir.x, 0.0, wdir.y)*mix(0.13, -0.3, slip)*dz;
    amSlip = slip*dz;
    // the wash: cut banks, cobbles in its bed
    // (a bank is a face a metre or two high that looks across the wash: the one that looks away from the sun is in shade, the other lit)
    float bkw = 0.14 + 0.1*vn2(p*0.09 + 13.0);
    // (each bank wanders on its own and is cut only here and there: never two lines running side by side)
    float bank = (1.0 - smoothstep(0.5*bkw, bkw, abs(abs(wd) - 1.25 - 1.0*(vn2(p*0.05 + 27.0) - 0.5))))*wk*clamp(bkw*8.0/max(1.5*fw, 1e-3) - 0.3, 0.0, 1.0)*smoothstep(0.34, 0.56, vn2(p*0.041 + 47.0));
    float bface = -sign(wd)*sunH.x;
    float cob = (1.0 - smoothstep(0.16, 0.27, vn2(p*1.5 + 9.0)))*exp(-wd*wd*1.6)*wk*seen(fw*1.5);
    amShade *= (1.0 - bank*mix(0.5, -0.08, smoothstep(-0.3, 0.3, bface)))*(1.0 - 0.42*cob);
  }
  #endif
  // warped height coordinate: bedding with a little cross-bed tilt
  // (where the slot's rock flares out toward level, the short waves of the warp are held down: on a low slope a bed's outcrop
  // wanders a metre for every half metre of warp, and the beds would smear into wavy contour lines)
  float lvl2 = smoothstep(0.3, 0.8, abs(N.y));
  float wob = (vn3(vP*0.028 + 3.7) - 0.5)*5.0 + (vn3(vP*0.11) - 0.5)*1.1*(1.0 - 0.75*lvl2*sl)*(1.0 - 0.7*hiW);   // (.. and high on the slot's walls, where the wander would kink at every facet)
  float ys = vP.y + wob + 0.05*vP.x + uStrataPhase;
  // The slot's scoops: shallow bowls that water has plucked out of the face, here and there, in patches: each its own size
  // (one to three metres long, longer along the canyon than tall), many places with none, smooth rock between. A field of
  // the rock itself, in metres, the same from every distance. A scoop is shown by its dish alone: the beds' outcrop lines
  // bow as they cross it (below), its slope goes into the normal wherever a pixel resolves it, its roof keeps a little shade. Where two
  // bowls cut into each other the slope turns over; nothing is drawn along that edge.
  float bowlD = 0.0;                                       // metres the face lies back in a bowl
  vec3 bowlG = vec3(0.0);                                  // .. and the slope of the face there (world space)
  #ifdef CANYON
  {
    float zone = sl*(1.0 - flr)*(1.0 - sandy)*smoothstep(0.38, 0.62, vn3(vP*0.085 + 41.0));   // scooped stretches of wall (two fifths of it or so), and smooth ones between
    if (zone > 0.0) {
      vec3 SC = vec3(0.36, 0.6, 0.36);
      // (the rock's own slow fields bend the bowls' places, so no two neighbours stand in a row)
      vec3 pw = vP + 1.5*vec3(vn3(vP*0.2 + 61.0) - 0.5, 0.6*(vn3(vP*0.17 + 83.0) - 0.5), vn3(vP*0.19 + 107.0) - 0.5);
      vec3 qs = pw*SC + vec3(3.3, 0.0, 7.1);
      vec3 ci = floor(qs - 0.5), cf = qs - ci;
      for (int ia = 0; ia < 2; ia++) for (int ib = 0; ib < 2; ib++) for (int ic = 0; ic < 2; ic++) {
        vec3 o = vec3(float(ia), float(ib), float(ic));
        float hc = h31(ci + o);
        vec3 r = o + 0.5 + 0.7*(fract(hc*vec3(1.0, 61.7, 127.3)) - 0.5) - cf;
        float sz = fract(hc*337.1);
        // (four places in ten hold no bowl; the others a bowl of their own radius, as deep as it is wide)
        float Ri = mix(0.26, 0.63, fract(sz*7.3))*step(0.4, sz);
        // (a bowl with a soft lip: its slope is nothing at its middle and at its edge, steepest between)
        float ti = max(1.0 - dot(r, r)/max(Ri*Ri, 1e-3), 0.0);
        float di = 0.62*Ri*zone*ti*ti;
        if (di > bowlD) { bowlD = di; bowlG = (-2.48*zone*ti/max(Ri, 1e-3))*r*SC; }
      }
    }
  }
  // in the slot the beds follow the water-carved flutes (the swept coordinate the geometry was cut with), and dip a little
  // into the rock: where a bowl cuts the face back their outcrop lines bow round it
  ys = mix(ys, vSlot.y + wob*0.8 + uStrataPhase, sl) + bowlD;
  #endif
  // metres of bedding under one pixel: the level part exactly, the warp (and the slot's sweep) as its typical slope
  // (in the slot the beds dip along the canyon with the sweep: a wall seen at a slant covers more bedding per pixel than its height alone says)
  float fy = abs(dPx.y + 0.05*dPx.x) + abs(dPy.y + 0.05*dPy.x) + (0.03 + 0.02*sl)*fw + 0.07*sl*(length(dPx.xz) + length(dPy.xz)) + abs(dot(bowlG, dPx)) + abs(dot(bowlG, dPy));
  float lam = 1.0 - 0.6*sl;                                // hairline laminae: fewer on the slot's water-smoothed walls
  // flowing strata: massive beds (outside the slot), beds, partings and laminae, each with a crisp edge. In the slot they
  // run with the flutes. (a little short-wave wander where the rock flares out toward level, so beds crossing a low wall
  // foot or a boulder's shoulder curl like water-cut stone instead of following the mesh's facets)
  float wand = 0.06*(1.0 - 0.8*lvl2)*seen(fw*0.9);
  // (out in the open the beds lie level, as laid down: crisp ledges and bands. Only the slot's water-cut walls swirl)
  float flow = ys + mix(0.12, 1.0, sl)*(1.0 - 0.7*hiW)*((0.6 - 0.52*lvl2)*(vn3(vec3(vP.x*0.21, ys*0.45, vP.z*0.21) + 17.0) - 0.5) + wand*(vn3(vec3(vP.x*0.9, ys*0.6, vP.z*0.9)) - 0.5));
  float ff = fy + 0.15*wand*fw;
  float p0 = flow*0.31 + 7.0, p1 = flow*1.07 + 3.0, p2 = flow*3.6 + 11.0, p3 = flow*11.5 + 5.0;
  float w0 = ff*0.31, w1 = ff*1.07, w2 = ff*3.6, w3 = ff*11.5;
  // The slot's rock at the rock's own scale. Each bed of about a metre drawn below (a set) is itself built of beds a hand to
  // a forearm thick, each of ONE tone with a crisp edge: harder pale ones, softer red ones, of unequal thickness. In most
  // sets they lie at a low angle to the set and are cut off by the next one (a bed thins to nothing against the set's foot
  // or its top); they swell and pinch along the wall and change tone along their length; now and then a set is one massive
  // bed of one tone. Between two beds runs a thin dark parting; a harder bed stands a little proud of a softer one beneath
  // it, which keeps a soft shade under its nose. This is a level of the rock's own field, drawn by the pixel's footprint on
  // the rock: whole while a bed's edge is crisp (a small part of the bed), and given back to the even partings and laminae
  // before that edge would be a soft ramp, level by level (so no wall is softer or barer for it, and nothing can shimmer).
  float bedK = 0.0, bedT = 0.5, bedSh = 0.0, ysB = ys, bedX = 0.0, bedL = 0.0;   // (bedX: where the thick beds stand in for the even partings; bedL: where the thin ones stand in for the laminae)
  #ifdef CANYON
  // (the bedding coordinate is smooth: what one pixel covers of it is read off it directly, taken outside every branch)
  vec2 dFl = vec2(dFdx(flow), dFdy(flow));
  float gFl = length(dFl);
  {
    float rk0 = sl*(1.0 - flr)*(1.0 - sandy)*(1.0 - hiW);
    if (rk0 > 0.001) {
      float sid = floor(p1 + 0.5), sf = p1 + 0.5 - sid;         // the set, and the place in it from its foot (0) to its top (1)
      float wS1 = gFl*1.07, lenPx = max(length(dPx), length(dPy)), up = step(0.5, sf);
      vec4 dxz = vec4(dPx.xz, dPy.xz);
      vec2 c0 = vec2(0.0), c1 = vec2(0.0);
      vec4 b0 = setBeds(sid, sf, vP, ys, wS1, dFl, dxz, lenPx, c0);
      // (at a set's edge the next set's own first bed is read too: the edge is a step from one bed to another, never a break in the field)
      vec4 b1 = setBeds(sid + 2.0*up - 1.0, 1.0 - up, vP, ys, wS1, dFl, dxz, lenPx, c1);
      float own = 0.5 + 0.5*smoothstep(0.0, clamp(wS1, 0.008, 0.25), min(sf, 1.0 - sf));
      bedK = rk0*mix(b1.y, b0.y, own);
      // (the even lines are handed over to the beds level by level, and only where that bed's own edge is still crisp: the
      // partings to the thick beds, the laminae to the thin ones. A wall is never softer, and never barer, for its beds)
      bedX = rk0*mix(b1.y*c1.x, b0.y*c0.x, own);
      bedL = rk0*mix(b1.y*c1.y, b0.y*c0.y, own);
      bedT = mix(b1.x, b0.x, own);
      // the broad bands are read at the middle of the bed: each bed takes ONE tone from them, and steps to the next at its edge
      ysB = ys + clamp(b0.z, -0.45, 0.45)*rk0*b0.y*(2.0*own - 1.0);
      bedSh = b0.w*rk0*(2.0*own - 1.0);
      // (.. and the parting between two sets, as between two beds: a thin dark seam, crisp, where the beds are)
      float eS = clamp(0.5*wS1, 0.004, 0.25), pS = max(0.017, 0.7*wS1);
      bedSh = max(bedSh, (1.0 - smoothstep(pS - eS, pS + eS, min(sf, 1.0 - sf)))*mix(0.5, 1.0, h11(mod(sid + up, 61.0)*3.7 + 1.1))*bedX);
    }
  }
  #endif
  // (a set of lines fades out before its period nears two pixels: no moire on walls seen at a slant or from afar)
  float k0 = (1.0 - smoothstep(0.3, 0.75, w0))*(1.0 - sl), k1 = 1.0 - smoothstep(0.3, 0.75, w1), k2 = (1.0 - smoothstep(0.32, 0.78, w2))*(1.0 - bedX), k3 = (1.0 - smoothstep(mix(0.18, 0.12, mwS), mix(0.5, 0.36, mwS), w3))*(1.0 - bedL);   // (where the set's own beds are drawn crisp, the even partings and laminae that stood in for them are not)   // (round the mouth the finest set goes sooner on grazing faces: no dotted line along a ledge)
  vec2 s0 = bandS(p0, clamp(w0*0.8, 0.02, 0.5)), s1 = bandS(p1, clamp(w1*0.8, 0.035, 0.5)), s2 = bandS(p2, clamp(w2*0.8, 0.05, 0.5)), s3 = bandS(p3, clamp(w3*0.8, 0.08, 0.5));
  float st0 = mix(0.5, s0.x, k0), st1 = mix(0.5, s1.x, k1), st2 = mix(0.5, s2.x, k2), st3 = mix(0.5, s3.x, k3);
  float strata = mix(st0*0.34 + st1*0.3 + st2*0.24 + st3*0.12, st1*0.42 + st2*0.38 + st3*0.2, sl);
  // the relief of those beds, as a slope along the flow coordinate (metres of height per metre). The slope is exact and per
  // pixel, so a bed is embossed for as long as it is drawn: that is what makes a thin lamina read as a hairline
  float dStrata = 0.5*k0*s0.y*0.31 + 0.32*k1*s1.y*1.07*(1.0 - bedX) + 0.2*k2*s2.y*3.6 + 0.06*k3*s3.y*11.5;   // (where the beds are drawn crisp, a set's edge is a step of tone with a dark seam, not an embossed line)
  float ledgeSh = 1.0;
  {                                                        // bedding ledges of the open cliffs and the Arch: a rounded step at the foot and the top of each bed
    float fb = fract(ys/uBed), wb = fy/uBed, eb = max(0.12, 1.3*wb);
    float ta = clamp(fb/eb, 0.0, 1.0), tb = clamp((fb - 0.5)/eb, 0.0, 1.0);
    dStrata += 0.7*(1.0 - sl)*(6.0*ta*(1.0 - ta) - 6.0*tb*(1.0 - tb))/(eb*uBed)*(1.0 - smoothstep(0.34, 0.6, wb));   // (drawn until a bed is two pixels thick: the far cliffs keep their ledges)
    // the thin line of shade under each ledge, as colour (no screen-space derivative): what makes a far cliff read as stepped
    float lw = max(wb, 0.004);
    ledgeSh = 1.0 - 0.3*(1.0 - sl)*smoothstep(0.0, lw, fb)*(1.0 - smoothstep(0.03 + lw, 0.09 + 2.0*lw, fb))*(1.0 - smoothstep(0.26, 0.5, wb));
    float fh = fract(ys/uBed + 0.5);                       // and a fainter one at the half-bed parting
    ledgeSh *= 1.0 - 0.16*(1.0 - sl)*smoothstep(0.0, lw, fh)*(1.0 - smoothstep(0.02 + lw, 0.06 + 2.0*lw, fh))*(1.0 - smoothstep(0.2, 0.4, wb));
  }
  // ---- albedo
  // (each band of colour melts into its own average before it is thinner than a couple of pixels: far mesas keep the
  // broad banding and lose the fine beds, instead of showing them as a grid)
  float bA = n1(ysB*0.21 + 1.3), bB = n1(ysB*mix(0.83, 0.55, sl) + 9.1), bC = n1(ys*2.9), bD = n1(ysB*mix(0.47, 0.4, sl) + 21.0);
  float bE = mix(0.5, n1(ysB*1.25 + 4.0), seen(fy*1.25));   // the slot's own bands, 0.4-1.5 m, soft-edged
  float kB = seen(fy*0.83*mix(0.45, 0.6, sl)), kD = seen(fy*0.47*mix(0.45, 0.6, sl)), kC = seen(fy*2.9);
  float fineA = fine*kC*(1.0 - bedX);
  vec3 alb = mix(uRed, uOrange, smoothstep(0.15, 0.85, bA));
  alb = mix(alb, uDeep, mix(0.25, smoothstep(mix(mix(0.62, 0.5, sl), 0.64, mwS), mix(0.9, 0.76, mwS), bD), kD)*mix(0.75, 0.62, sl));   // (round the mouth a dark bed has an edge: a band, never a smudge)
  alb = mix(alb, uCream, mix(0.22, smoothstep(mix(0.66, 0.56, sl), mix(0.92, 0.96, sl), bB), kB)*mix(0.6, 0.36, sl));
  alb *= 0.86 + 0.28*bC*fineA*lam + 0.14*(1.0 - fineA*lam);
  // grain and hairline laminae, as colour: drawn per pixel with no screen-space derivative, so there is nothing to quilt
  alb *= 1.0 + fine*(0.12*(vn3(vP*6.3) - 0.5)*seen(fw*6.3*0.5) + 0.16*(n1(ys*23.0 + 2.0) - 0.5)*seen(fy*23.0*0.8)*(1.0 - sandy)*(1.0 - bedL));
  alb *= mix(1.0, 0.9 + 0.2*bE, sl)*mix(0.6 + 0.8*strata, 0.64 + 0.72*strata, sl);
  alb = mix(alb, uCream*0.9, smoothstep(0.8, 0.95, st1)*0.22);       // now and then a pale bed
  alb = mix(alb, mix(mix(uDeep, uRed, 0.45), uDeep, sl), (1.0 - smoothstep(0.06, 0.2, st1))*mix(0.44, 0.5, sl));     // and a dark iron-rich one
  alb = mix(alb, mix(uDeep, uRed, 0.4), (1.0 - smoothstep(0.1, 0.3, st0))*0.42); // (out of the slot) a massive dark bed, a massive pale one
  alb = mix(alb, mix(uOrange, uCream, 0.6), smoothstep(0.75, 0.95, st0)*0.24);
  alb *= ledgeSh;
  #ifdef CANYON
  {                                                        // the beds of each set: a tone apiece (hard beds pale, soft beds red), and the shade under a proud one
    float tq = clamp(bedT, 0.0, 1.0);
    alb *= mix(1.0, mix(0.64, 1.34, tq), bedK);
    alb = mix(alb, uCream*0.78, 0.22*smoothstep(0.62, 1.0, tq)*bedK);
    alb = mix(alb, uDeep*0.95, 0.36*(1.0 - smoothstep(0.0, 0.38, tq))*bedK);
    alb *= mix(vec3(1.0), vec3(0.52, 0.4, 0.47), bedSh);
  }
  #endif
  float vert = 1.0 - abs(N.y);
  // desert varnish: dark plum curtains hanging from the tops of vertical faces
  // (in the slot they are thin crisp streaks, and few: never soft brown stains metres wide)
  float vsc = mix(0.42, 1.1, sl);
  float streak = vn3(vec3(vP.x*vsc, vP.y*0.028, vP.z*vsc)) * 0.65 + mix(0.5, vn3(vec3(vP.x*1.7, vP.y*0.06, vP.z*1.7)), seen(fw*1.7*0.6))*0.35;
  float varn = smoothstep(mix(0.46, 0.56, sl), mix(0.68, 0.64, sl), streak) * smoothstep(0.35, 0.8, vert) * (0.45 + 0.55*vn3(vP*0.045 + 11.0)) * seen(fw*vsc*0.5);
  alb = mix(alb, uPlum*0.8 + uDark*0.3, varn*0.72*(1.0 - 0.65*sl));
  #ifdef CANYON
  {
    // Desert varnish down the slot's walls, ACROSS the beds: dark plum curtains that hang from a seep or a ledge and fray out
    // downward, and narrow tears beside and between them, each running plumb down the face (along the wall's own upright
    // section), a few metres apart and uneven: some stretches of wall streaked, some clean. Placed by metres along the canyon
    // and metres above the floor; drawn while a streak is wider than a pixel or two.
    float rkV = sl*(1.0 - flr)*(1.0 - sandy)*smoothstep(0.3, 0.7, vert);
    if (rkV > 0.001) {
      float hF = vP.y - (14.5 + 7.0*smoothstep(262.0, 600.0, vP.z));      // metres above the slot's floor
      float fa = length(dPx.xz) + length(dPy.xz) + 0.25*(abs(dPx.y) + abs(dPy.y));   // the pixel's run along the wall
      float aW = dAl + sideW*37.7;
      float zoneV = smoothstep(0.42, 0.7, vn3(vec3(aW*0.045, sideW*9.0 + 3.0, vP.y*0.02)));   // (streaked stretches, and clean wall between them)
      float vv = 0.0;
      {                                                                    // curtains: solid under the seep, in fewer and fewer threads further down
        float ca = aW/3.4, ci = floor(ca), cf = ca - ci, cm = mod(ci, 211.0) + sideW*211.0;
        float h1 = h11(cm*1.7 + 9.0), h2 = h11(cm*2.9 + 4.0), h3 = h11(cm*0.83 + 7.0), h4 = h11(cm*3.7 + 1.0), h5 = h11(cm*5.3 + 2.0);
        float hT = mix(8.0, 27.0, h4), len = mix(6.0, 24.0, h5), hBm = hT - len;
        float dn = clamp((hT - hF)/len, 0.0, 1.0);                         // 0 at its top .. 1 at its lowest thread's end
        float fray = smoothstep(0.35, 1.0, dn);
        float hw = mix(0.03, 0.1, h3)*(1.0 - 0.3*fray)*(0.8 + 0.4*vn2(vec2(hF*0.5 + cm*7.0, cm)));
        float cx = 0.5 + 0.5*(h2 - 0.5) + 0.03*(vn2(vec2(hF*0.23, cm*3.0)) - 0.5);
        float ew = clamp(0.8*fa/3.4, 0.008, 0.2);
        float m = 1.0 - smoothstep(hw - ew, hw + ew, abs(cf - cx));
        float thn = vn2(vec2(aW*4.3 + 0.2*vn2(vec2(hF*0.35, cm)), cm*1.3 + hF*0.02));
        float thE = 0.1 + fa*4.3;
        float thr = mix(1.0 - 0.8*fray, smoothstep(mix(-0.4, 0.8, fray) - thE, mix(-0.4, 0.8, fray) + thE, thn), seen(fa*4.3));
        // (shown while its body is some pixels wide: a curtain whose edge would be a blur is not drawn at all; each of its own darkness)
        vv = m*thr*step(0.62, h1)*(1.0 - smoothstep(hT - 0.4, hT, hF))*step(hBm, hF)*clamp(hw*3.4/max(2.5*fa, 1e-3) - 0.5, 0.0, 1.0)*mix(0.3, 0.6, h3)*mix(1.0, 0.8, fray);
      }
      {                                                                    // tears
        float ta = aW/1.27 + 0.31, ti = floor(ta), tf = ta - ti, tm = mod(ti, 173.0) + sideW*173.0;
        float h1 = h11(tm*2.3 + 5.0), h2 = h11(tm*1.3 + 8.0), h3 = h11(tm*3.1 + 2.0), h4 = h11(tm*0.7 + 6.0), h5 = h11(tm*4.3 + 3.0);
        float hT = mix(3.5, 30.0, h4), len = mix(3.0, 13.0, h5), hBm = hT - len;
        float tap = smoothstep(hBm, hBm + 0.8*len, hF);
        float hw = mix(0.04, 0.09, h3)*(0.25 + 0.75*tap);
        float cx = 0.5 + 0.6*(h2 - 0.5) + 0.07*(vn2(vec2(hF*0.4, tm*5.0)) - 0.5);
        float ew = clamp(0.8*fa/1.27, 0.008, 0.3);
        float m = 1.0 - smoothstep(hw - ew, hw + ew, abs(tf - cx));
        vv = max(vv, m*step(0.5, h1)*(1.0 - smoothstep(hT - 0.2, hT, hF))*smoothstep(hBm, hBm + 0.3*len, hF)*clamp(hw*1.27/max(0.6*fa, 1e-3) - 0.2, 0.0, 1.0)*0.75);
      }
      // (the rock's own colour gone dark, with a breath of plum; lighter on rock that is dark already: a streak, never a black bar)
      alb = mix(alb, alb*0.2 + uPlum*0.3 + uDark*0.25, vv*zoneV*rkV*mix(0.55, 1.0, smoothstep(0.08, 0.3, dot(alb, vec3(0.3, 0.5, 0.2)))));
    }
  }
  #endif
  // slickrock tops: swirling cross-bedding
  // (the cross-beds run one way, their lines bent but never closed: no bullseye rings on the ground)
  float sw = fbm3(vec3(vP.x*0.022, vP.y*0.09, vP.z*0.03) + 2.0)*6.0 + vP.x*0.33 + vP.z*0.13 + vP.y*1.4;
  float swe = clamp(fw*1.2, 0.08, 0.3);
  float swl = smoothstep(-swe, swe, sin(sw)) * (0.6 + 0.4*n1(sw*0.16));
  alb = mix(alb, mix(uRed*0.85, mix(uOrange, uCream, 0.45), swl), smoothstep(0.5, 0.9, N.y)*0.7*seen(fw*0.35));
  // sun-bleached tops, mottling
  alb = mix(alb, uCream*0.85, smoothstep(0.55, 0.95, N.y)*0.1);
  #ifdef CANYON
  alb = mix(alb, amCol*(0.86 + 0.28*swl), amRock);          // the amphitheatre's benches (their cross-beds' lines kept, in little)
  #endif
  // mottling, drawn out along the beds
  alb *= mix(0.8, 0.9, mwS) + mix(0.4, 0.2, mwS)*mix(0.5, fbm3(mix(vP*0.19, vec3(vP.x*0.17, ysB*0.5, vP.z*0.17), sl) + 5.0), seen(mix(0.19*fw, fy*0.5 + fw*0.17, sl)));
  alb *= mix(1.0, 0.88 + 0.24*fbm3(vec3(vP.x*0.09, ysB*0.36, vP.z*0.09) + 9.0), sl);
  // the slot's walls, near the eye: upright flutes and scoops that cut ACROSS the beds (leaning a little, as water leaves them),
  // in tone here and in relief below, so a wall seen along its length is never beds alone, drawn out into streaks
  float flu = 0.0, xbG = 0.0;
  vec3 xbN = vec3(0.0, 1.0, 0.0);
  vec3 gA = vec3(0.0);                                     // the slot's small relief (its scoops): its slope in metres per metre, world space
  float nCrest = 0.0, nHol = 0.0;                          // .. and how far this pixel lies on a small lit edge, or in a small hollow (under a ledge, in the roof of a scoop)
  #ifdef CANYON
  {
    vec3 pf = vec3(vP.x + 0.22*vP.y, vP.y, vP.z + 0.16*vP.y);
    float fa = vn3(vec3(pf.x*0.78, pf.y*0.17, pf.z*0.78) + 3.0), fb = vn3(vec3(pf.x*2.3, pf.y*0.42, pf.z*2.3) + 11.0);
    flu = sl*(1.0 - flr)*(1.0 - smoothstep(30.0, 70.0, dist))*((smoothstep(0.15, 0.85, fa) - 0.5)*seen(fw*0.78) + 0.5*(fb - 0.5)*seen(fw*2.3));
    alb *= 1.0 + 0.42*flu;
  }
  // The slot's rock within a few metres of the eye. Beds alone, seen along a wall, are drawn out into long streaks: what holds
  // at one or two metres is what cuts ACROSS them, in world space. Cross-bedding: inside each bed a set of foresets, a hand apart,
  // dipping its own way and cut off at the bed's top and foot. Pits eaten into the softer beds. Grain. Each is faded by the
  // pixel's own footprint across it (worked out from the rock's plane, no screen-space derivative), so nothing sparkles.
  {
    float nearW = sl*(1.0 - flr)*(1.0 - sandy)*(1.0 - smoothstep(16.0, 38.0, dist));
    float bid = floor(p1 + 0.5), bf = fract(p1 + 0.5);
    float az = h11(bid*1.37 + 3.1)*6.2832, dipS = mix(0.24, 0.6, h11(bid*2.11 + 9.0)), fq = mix(3.6, 6.4, h11(bid*0.73 + 0.5));
    xbN = vec3(cos(az)*dipS, 1.0, sin(az)*dipS);
    float cph = dot(vP, xbN)*fq + 1.4*vn3(vP*0.33 + bid*3.0);       // (foresets that curve a little: swept in by wind, never ruled)
    float fc = (abs(dot(dPx, xbN)) + abs(dot(dPy, xbN)))*fq;
    float sx = sin(6.2832*cph), cx = cos(6.2832*cph);
    // (laminae of unequal thickness, in sets that come and go along the bed: never a ruled hatch)
    float sx2 = sin(6.2832*cph*2.37 + bid*1.9)*(1.0 - smoothstep(0.2, 0.46, fc*2.37));
    float setK = 0.3 + 0.7*smoothstep(0.3, 0.64, vn3(vP*0.27 + bid*5.0));
    float sb = smoothstep(0.26, 0.5, h11(bid*3.3 + 1.7))*smoothstep(0.0, 0.1, bf)*(1.0 - smoothstep(0.9, 1.0, bf))*k1*(1.0 - smoothstep(0.2, 0.46, fc))*nearW*setK*(1.0 - bedX);
    alb *= 1.0 + 0.19*(0.62*sx + 0.38*sx2)*sb;
    xbG = 0.0034*fq*6.2832*cx*sb;                                    // their relief, as an exact slope along xbN
    float fiso = sqrt(max(length(dPx)*length(dPy), 1e-8));
    float pz = smoothstep(0.42, 0.68, vn3(vec3(vP.x*0.5, ys*1.3, vP.z*0.5) + 23.0));   // pitted zones run with certain beds
    float pit = (1.0 - smoothstep(0.14, 0.3, vn3(vP*4.6 + 13.0)))*pz*seen(fiso*4.6*1.3)*nearW;
    alb *= 1.0 - 0.45*pit;
    alb *= 1.0 + 0.2*(vn3(vP*13.0 + 5.0) - 0.5)*seen(fiso*13.0*0.8)*nearW;
    // The scoops' own slope goes into the normal (gA), and the partings between sets keep a soft shade:
    float rockK = sl*(1.0 - flr)*(1.0 - sandy);
    // (1) the scoops' slope (the field worked out above), as far as the eye can read it
    vec3 gS = bowlG*seen(fiso*0.8);
    gA = gS - N*dot(gS, N);
    nHol += 0.7*clamp(gS.y*1.6, 0.0, 1.0);                               // (the roof of a scoop looks down: it keeps a little shade ..
    nCrest += 0.55*clamp(-gS.y*1.6, 0.0, 1.0);                           // .. and its floor looks up at the slit: a dish, lit from above)
    // (2) the partings between sets: where a harder set lies over a much softer one it overhangs, with a soft band of shade beneath
    {
      float hsA = h11(bid*5.7 + 2.0), hsB = h11((bid + 1.0)*5.7 + 2.0), hsC = h11((bid - 1.0)*5.7 + 2.0);
      float pw = clamp(0.6*w1, 0.12, 0.25);                               // (a soft band a hand wide, never a hairline)
      float parting = (1.0 - smoothstep(0.0, pw, min(bf, 1.0 - bf)))*(1.0 - smoothstep(0.16, 0.4, w1))*rockK;
      float dl = bf > 0.5 ? hsA - hsB : hsC - hsA;
      float partN = parting;
      nHol += 0.5*partN*clamp(-dl*2.2 - 0.35, 0.0, 1.0);
      alb *= 1.0 + 0.16*(hsA - 0.5)*rockK*k1;   // (hard sets weather pale, soft ones darker)
    }
  }
  {                                                                  // the petroglyphs: marks pecked through a skin of desert varnish into the rock itself
    vec3 dg = vP - uGlyphC.xyz;
    vec2 guv = vec2(dot(dg, uGlyphU.xyz)/max(uGlyphU.w, 0.01), dot(dg, uGlyphV.xyz)/max(uGlyphV.w, 0.01));
    float gon = sl*(1.0 - flr)*(1.0 - sandy)*(1.0 - smoothstep(1.6, 3.2, abs(dot(dg, uGlyphN))));
    // the panel: a face of rock under dark varnish, its outline uneven, streaked down from above
    float gr = length(guv*vec2(0.86, 0.9)) + 0.34*(vn3(vP*0.45 + 31.0) - 0.5) + 0.2*(vn3(vec3(vP.x*1.9, vP.y*0.12, vP.z*1.9)) - 0.5);
    float gv = (1.0 - smoothstep(0.82, 1.3, gr))*gon;
    alb = mix(alb, (uPlum*0.7 + uDark*0.3)*(0.75 + 0.5*strata), 0.72*gv);
    // the marks: the paler rock under that skin, dinted by the stone that pecked it (lighter than the varnish, darker than sand)
    float lod = clamp(log2(max(fw*512.0/max(uGlyphU.w, 0.01), 1.0)) - 0.6, 0.0, 7.0);
    float gm = textureLod(uGlyphTex, clamp(guv*0.5 + 0.5, 0.0, 1.0), lod).a*step(abs(guv.x), 1.0)*step(abs(guv.y), 1.0)*gon;
    float fisoG = sqrt(max(length(dPx)*length(dPy), 1e-8));
    alb = mix(alb, mix(uOrange, uCream, 0.5)*0.92*(1.0 + 0.3*(vn3(vP*17.0) - 0.5)*seen(fisoG*17.0)), smoothstep(0.25, 0.7, gm)*0.9);
  }
  #endif
  // wind-blown sand: ripples across the wind, a finer set riding them near the camera
  float rpo = vP.x*3.1 + vP.z*1.3 + 6.0*vn3(vP*0.21) + 9.0*vn3(vP*0.05 + 4.0);
  float ripK = smoothstep(0.25, 0.7, vn3(vP*0.06 + 13.0));           // ripple fields between smooth, wind-swept sand
  float rip = mix(0.5, sin(rpo)*0.5 + 0.5, 1.0 - smoothstep(1.0, 2.4, abs(3.1*dPx.x + 1.3*dPx.z) + abs(3.1*dPy.x + 1.3*dPy.z) + 0.5*fw));
  float rpb = vP.x*1.15 + vP.z*0.42 + 5.0*vn3(vP*0.07 + 9.0);        // broad ripples, about 5 m apart: these carry to the middle distance
  float ripB = mix(0.5, sin(rpb)*0.5 + 0.5, (1.0 - smoothstep(1.0, 2.4, abs(1.15*dPx.x + 0.42*dPx.z) + abs(1.15*dPy.x + 0.42*dPy.z) + 0.15*fw))*(1.0 - flr));
  float rpf = vP.x*2.3 - vP.z*10.5 + 5.0*vn3(vP*0.5 + 3.0);
  float ripF = mix(0.5, sin(rpf)*0.5 + 0.5, (1.0 - smoothstep(1.0, 2.4, abs(2.3*dPx.x - 10.5*dPx.z) + abs(2.3*dPy.x - 10.5*dPy.z) + 1.0*fw))*(1.0 - flr));
  rip = rip*rip*(3.0 - 2.0*rip);
  #ifdef CANYON
  {                                                                  // the slot's floor: wind ripples across the canyon
    float rph = dAl*14.0 + 6.0*vn3(vP*0.27) + 1.6*vn3(vP*1.3);
    float rf = 1.0 - smoothstep(0.5, 1.9, 16.0*length(dPy) + 6.0*length(dPx));
    float r2 = sin(rph + 0.55*sin(rph))*0.5 + 0.5;                   // skewed: a long windward back, a short lee face
    // and a broader set, a metre and a half from crest to crest, that carries on down the canyon
    float rpw = dAl*4.1 + 4.0*vn3(vP*0.11 + 2.0) + 1.2*vn3(vP*0.6);
    float rfw = 1.0 - smoothstep(0.5, 1.9, 4.7*length(dPy) + 1.8*length(dPx));
    float r3 = sin(rpw + 0.6*sin(rpw))*0.5 + 0.5;
    rip = mix(rip, 0.58*mix(0.5, r2*r2*(3.0 - 2.0*r2), rf) + 0.42*mix(0.5, r3, rfw), flr);
  }
  #endif
  float ripN = 1.0 - smoothstep(25.0, 60.0, dist), ripA = mix(0.2, 0.36, ripN);   // (near the eye the ripples are crisp and deep)
  vec3 sand = mix(uOrange, uCream, 0.5 + 0.2*vn3(vP*0.3) + 0.22*(vn3(vP*0.043 + 7.0) - 0.5)*(1.0 - flr))
    * mix(0.94 - 0.5*ripA + ripA*mix(0.5, rip, ripK*(1.0 - 0.5*sl)) + mix(0.1, 0.2, ripN)*(ripF - 0.5)*ripK*(1.0 - 0.6*sl) + 0.26*(ripB - 0.5)*(1.0 - sl), 0.72 + 0.46*rip, flr);   // (no broad ripples on the drift banked up a slot wall)
  alb = mix(alb, sand, sandy);
  // wind-driven sand streamers snaking over the flats
  vec2 wd = normalize(uWind + 1e-4);
  float al = dot(vP.xz, wd), ac = dot(vP.xz, vec2(-wd.y, wd.x));
  float sn = vn2(vec2(al*0.06 - uTime*0.5, ac*0.3 + 4.0*vn2(vec2(al*0.025, ac*0.045))));
  sn = smoothstep(0.62, 0.84, sn) * (0.45 + 0.55*vn2(vec2(al*0.45 - uTime*2.6, ac*1.8)));
  alb += sand * sn * mix(0.42, 0.24, smoothstep(30.0, 90.0, dist)) * smoothstep(0.7, 0.95, N.y);   // (stronger near the eye: sand on the move under the low pass)
  alb *= clamp(vCol, 0.0, 3.4) * mix(0.6, 0.44, sandy) * mix(1.0, 0.86, smoothstep(0.6, 0.95, N.y));
  #ifdef CANYON
  alb *= mix(1.0, amShade*(1.0 - 0.16*amSlip), amph);
  if (desF > 0.5) {
    // The open desert beyond the rim is not one pale plain: flats of red earth, dark flats of scrub and varnished pavement,
    // pale dune fields with their slip faces in shade, and a dry river winding away to the horizon. Seen from the rim these
    // lie one behind another in bands that close up with distance. Zones of the land itself, in world metres.
    vec2 p = vP.xz;
    float zA = vn2(p*0.0011 + 3.0), zB = mix(0.5, vn2(p*0.0037 + 17.0), seen(fw*0.0037*0.6)), zC = mix(0.5, vn2(p*0.012 + 5.0), seen(fw*0.012*0.6));
    float red = smoothstep(0.44, 0.58, 0.55*zA + 0.3*zB + 0.15*zC);
    float dark = smoothstep(0.52, 0.66, 0.5*vn2(p*0.0019 + 41.0) + 0.35*zB + 0.15*zC);
    alb = mix(alb, mix(uRed, uDeep, 0.35)*0.4, 0.72*red);
    alb *= 1.0 - 0.4*dark*(1.0 - 0.5*red);
    vec2 wdr = -normalize(uSun.xz + vec2(1e-4, 0.0));
    float pdn = dot(p, wdr)/64.0 + 2.2*vn2(p*0.0027 + 9.0);
    float fPd = (abs(dot(wdr, dPx.xz)) + abs(dot(wdr, dPy.xz)))/64.0;
    float sq = fract(pdn), eq = clamp(fPd, 0.03, 0.3);
    float slipD = smoothstep(0.7 - eq, 0.7 + eq, sq)*(1.0 - smoothstep(1.0 - eq, 1.0, sq));
    alb *= 1.0 + (0.1 - 0.36*slipD)*(1.0 - red)*(1.0 - dark)*(1.0 - smoothstep(0.2, 0.5, fPd))*smoothstep(0.35, 0.6, vn2(p*0.0016 + 55.0));
    float rvx = 150.0*sin(p.y*0.0033 + uAmp.x) + 48.0*sin(p.y*0.0109 + 1.7) + 30.0 + 22.0*(vn2(p*0.011 + 61.0) - 0.5);
    float rvw = 9.0 + 16.0*vn2(vec2(p.y*0.012, 3.0)), rvf = abs(dPx.x) + abs(dPy.x) + 0.3*(abs(dPx.z) + abs(dPy.z));   // (narrow, then wide)
    float rvE = max(rvf, 1e-3);
    float rv = (1.0 - smoothstep(rvw - rvE, rvw + rvE, abs(p.x - rvx)))*(1.0 - smoothstep(-420.0, -180.0, p.y))*clamp(rvw/rvE, 0.0, 1.0);
    alb = mix(alb, mix(uOrange, uCream, 0.7)*0.4, 0.5*rv);
  }
  #endif
  float heroB = 0.0, heroH = 0.0;
  #ifdef CANYON
  if (sl > 0.0) {                                          // the hero beam's pool: the shape of the slit it comes through, burnt onto the sand
    for (int i = 0; i < 8; i++) {
      float fi = float(i);
      // (the smaller pillars' pools drift slowly round their feet, as the patches of the version before did: the design's 'slow drift of the beams' light patches')
      vec3 d = vP - uHeroF[i] - step(1.5, fi)*vec3(0.3*sin(uTime*0.13 + fi*2.1), 0.0, 0.3*cos(uTime*0.11 + fi*1.3));
      if (dot(d, d) > 2500.0) continue;
      // (the pool is a third larger than the shaft's section, so the foot of the shaft stands inside it and never ends on a patch of its own width)
      vec2 q = vec2(dot(d, uHeroE1[i].xyz)/max(uHeroE1[i].w, 0.01), dot(d, uHeroE2[i].xyz)/max(uHeroE2[i].w, 0.01))/1.32;
      float r = length(q), rs = r, al = dot(d, uHeroA);
      vec2 qn = q/max(r, 0.01);
      // (a lobed, notched outline that breathes slowly, pinched across its middle: a slit's shadow, never a disc)
      r *= 1.0 + 0.62*(vn3(vec3(qn*1.7, 3.0 + fi*7.0 + uTime*0.02)) - 0.5) + 0.16*(vn3(vec3(q*2.3, 9.0 + fi)) - 0.5) + 0.3*exp(-q.x*q.x*14.0)*abs(qn.y);
      float ew = clamp(1.5*fw/max(uHeroE2[i].w, 0.01), 0.06, 0.16);
      heroB = max(heroB, (1.0 - smoothstep(1.0 - ew, 1.0 + ew, r))*step(-2.5, al)*(1.0 - 0.75*smoothstep(20.0, 34.0, al))*(1.0 - 0.6*step(0.5, fi)*step(fi, 1.5)));   // (the soft ray beside the hero beam lays a faint patch, never a pale plinth)
      // the spill of light round it: on the sand, and on the rock beside it that faces it
      vec3 tp = vec3(0.0, 0.4, 0.0) - d;
      float fcp = clamp(dot(N, tp/max(length(tp), 1e-3))*1.4 + 0.1, 0.0, 1.0);
      heroH = max(heroH, exp(-max(rs*1.32 - 1.0, 0.0)*uHeroK[i].x)*step(-2.5, al)*(1.0 - smoothstep(1.0, 8.0, al))*uHeroK[i].y*mix(fcp, 1.0, max(flr, sandy)));
    }
    heroB *= sl; heroH *= sl;
  }
  // THE HALL'S POOLS: the pillars' pool, as above, for the three shafts that stand in the hall (lobed, breathing, drifting
  // slowly round its foot; its spill on the sand and on the rock that faces it), inside the hall's own round in plan and
  // exactly nothing outside it
  if (sl > 0.0) {
    vec2 dhc = vP.xz - uHallC.xz;
    float hwn = 1.0 - smoothstep(0.7, 1.0, dot(dhc, dhc)/max(uHallC.w*uHallC.w, 1.0));
    if (hwn > 0.0) {
      float hB = 0.0, hH = 0.0;
      int nH = vFar.y > 0.0 ? 0 : 3;                        // (a triangle the hall's round cannot reach walks none of its pools)
      for (int i = 0; i < nH; i++) {
        float fi = float(i) + 8.0;
        vec3 d = vP - uHallF[i] - vec3(0.3*sin(uTime*0.13 + fi*2.1), 0.0, 0.3*cos(uTime*0.11 + fi*1.3));
        vec2 q = vec2(dot(d, uHallE1[i].xyz)/max(uHallE1[i].w, 0.01), dot(d, uHallE2[i].xyz)/max(uHallE2[i].w, 0.01))/1.32;
        float r = length(q), rs = r, al = dot(d, uHeroA);
        vec2 qn = q/max(r, 0.01);
        r *= 1.0 + 0.62*(vn3(vec3(qn*1.7, 3.0 + fi*7.0 + uTime*0.02)) - 0.5) + 0.16*(vn3(vec3(q*2.3, 9.0 + fi)) - 0.5) + 0.3*exp(-q.x*q.x*14.0)*abs(qn.y);
        float ew = clamp(1.5*fw/max(uHallE2[i].w, 0.01), 0.06, 0.16);
        hB = max(hB, (1.0 - smoothstep(1.0 - ew, 1.0 + ew, r))*step(-2.5, al)*(1.0 - 0.75*smoothstep(20.0, 34.0, al)));
        vec3 tp = vec3(0.0, 0.4, 0.0) - d;
        float fcp = clamp(dot(N, tp/max(length(tp), 1e-3))*1.4 + 0.1, 0.0, 1.0);
        hH = max(hH, exp(-max(rs*1.32 - 1.0, 0.0)*uHallK[i].x)*step(-2.5, al)*(1.0 - smoothstep(1.0, 8.0, al))*uHallK[i].y*mix(fcp, 1.0, max(flr, sandy)));
      }
      heroB = max(heroB, hB*hwn*sl); heroH = max(heroH, hH*hwn*sl);
    }
  }
  // (the first slot's lesser shaft has no pool code of its own: its pool is the last of the eight places above, a pillar's pool like the others)
  #endif
  // ---- bump: the lumps and grain from the procedural height, the beds from their exact slopes
  float bs = mix(1.0, mix(0.75, 0.55, flr), sandy) * (0.45 + 0.55*fine) * (1.0 + 0.8*heroB*flr);   // (in the hero pool every ripple throws a shadow)
  // (the lumps of the relief are drawn out along the beds: flutes and scallops, not pillows)
  vec3 pR = mix(vP, vec3(vP.x*0.7, ys*1.7, vP.z*0.7), sl);
  float fpR = mix(fw, 0.7*fw + 1.7*fy, sl);
  float hr = rockH(pR, fpR) + 0.62*flu
    + sl*0.3*mix(0.5, n1(ys*mix(0.83, 0.55, sl) + 9.1), kB)   // (the broad band itself, smooth: the relief is taken by screen-space derivatives, and a bed's step would come out dotted)
    + (1.0 - sl)*fine*fine*lam*0.1*(vn3(vec3(vP.x*0.45, ys*8.0, vP.z*0.45)) - 0.5)*seen(8.0*fy + 0.45*fw);
  // (open sand: the ripples are relief the low sun can model)
  float h = mix(hr, mix((rip*mix(0.22, 0.34, ripN) + ripF*mix(0.04, 0.08, ripN))*ripK*(1.0 - 0.6*sl) + ripB*0.45*(1.0 - sl), rip*0.17, flr), sandy);
  vec3 Ng = N;
  vec3 dpx = dFdx(vP), dpy = dFdy(vP);
  float hx = dFdx(h), hy = dFdy(h);
  {
    float gk = fine*fine*seen(fpR*5.5)*(1.0 - sandy), g0 = rockG(pR);
    vec3 qx = mix(dPx, vec3(dPx.x*0.7, (dPx.y + 0.05*dPx.x)*1.7, dPx.z*0.7), sl), qy = mix(dPy, vec3(dPy.x*0.7, (dPy.y + 0.05*dPy.x)*1.7, dPy.z*0.7), sl);
    hx += gk*(rockG(pR + qx) - g0); hy += gk*(rockG(pR + qy) - g0);
  }
  { float ds = dStrata*(1.0 - sandy); hx += ds*dFdx(flow); hy += ds*dFdy(flow); }
  hx += xbG*dot(xbN, dpx); hy += xbG*dot(xbN, dpy);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx);
  float det = dot(dpx, r1);
  vec3 grad = sign(det)*(hx*r1 + hy*r2);
  N = normalize(max(abs(det), 1e-6)*N - 0.95*bs*grad);
  N = normalize(N - gA - amG);                                    // (the scoops of the slot's rock: an exact slope, no screen-space derivative)
  #ifdef CANYON
  // (the slot's rock is a sheet with two sides: a crest that stands beyond the open court shows its far side over the low
  // wall. That side is rock too, lit by the way IT looks: it keeps its beds and stands warm in the shade of its own crest,
  // and is not the sunlit face seen through from behind, a pale lobe on the sky)
  if (!gl_FrontFacing && sl > 0.5) { N = -N; Ng = -Ng; }
  #endif
  // ---- light: noon sun, sky fill, bounce that grades orange -> red -> plum into the folds
  float ao = clamp(vShade.x, 0.0, 1.0), vis = clamp(vShade.y, 0.0, 1.0);
  // slow cloud shadows drifting over the open ground and the cliffs
  vis *= 1.0 - 0.4*(1.0 - sl)*smoothstep(0.43, 0.63, vn2(vP.xz*0.0042 + uTime*vec2(0.03, 0.011)) + 0.25*vn2(vP.xz*0.013 - uTime*vec2(0.018, 0.035)) - 0.125);
  float relief = 1.0, courtB = 0.0, courtH = 0.0;
  vec3 sunTint = vec3(1.0);
  #ifdef CANYON
  if (sl < 0.5) {                                                    // the hoodoos' shadows, thrown across the sand and whatever stands on it
    vec2 sh = uSun.xz; float shl = max(length(sh), 1e-3); sh /= shl;
    float tanE = uSun.y/shl, hsd = 0.0;
    for (int i = 0; i < 3; i++) {
      vec2 dxz = uHoo[i].xz - vP.xz;
      float s0 = dot(dxz, sh), t = (vP.y + s0*tanE - uHoo[i].y)/max(uHoo[i].w, 1.0);
      float rr = uHooR[i].x*(1.0 - 0.48*pow(clamp(t, 0.0, 1.0), 0.8))*(1.0 + 0.25*uHooR[i].y*step(0.8, t));
      float pen = 0.2 + 0.04*max(s0, 0.0);                           // (the penumbra widens down the shadow)
      hsd = max(hsd, (1.0 - smoothstep(rr*0.88 - pen, rr*0.88 + pen, length(dxz - sh*s0)))*smoothstep(rr*1.1, rr*1.7, s0)*step(-0.15, t)*(1.0 - smoothstep(0.95, 1.03, t)));
    }
    vis *= 1.0 - 0.92*hsd*(1.0 - sl);
  }
  {                                                                  // the fine relief, modelled by the light that reaches this wall
    float ldl = length(vLd);
    relief = clamp(1.0 + 1.5*min(ldl, 1.0)*dot(N - Ng, vLd/max(ldl, 1e-3)), 0.45, 1.75);
    // (where the light has no side to rake from, the slit above is what the small edges catch: a lit edge on top, shade beneath)
    // (.. and only as far as there is light to catch: in the dark of a fold or of the entry hall no edge glows)
    float catchL = smoothstep(0.2, 0.6, ao);
    relief *= 1.0 + (0.14 + 0.3*(1.0 - min(ldl*1.4, 1.0)))*(1.1*min(nCrest, 1.0)*catchL - min(nHol, 1.0)*(0.45 + 0.55*catchL));
  }
  // (sun on the slot's walls has a hard edge: the baked value is cut per pixel along a slightly uneven line)
  vis = mix(vis, smoothstep(0.46, 0.54, vis + 0.05*(vn3(vP*0.7 + 21.0) - 0.5)), sl);
  if (sl > 0.0) {                                                    // pools of sun where a beam comes down the slot
    {                                                                // the open court's sunbeam: a hard-edged patch on the floor, and on whatever rock stands in it
      vec3 e3 = vP - uCourtD*((vP.y - uCourtC.y)/max(uCourtD.y, 0.2));
      vec2 e = e3.xz - uCourtC.xz;
      vec2 q = vec2(dot(e, uCourtA.xy)/max(uCourtA.z, 0.01), dot(e, vec2(-uCourtA.y, uCourtA.x))/max(uCourtA.w, 0.01));
      float r = length(q);
      // (the slit's own shape thrown on the sand: long, lobed and notched, never a disc)
      r *= 1.0 + 0.46*(vn3(vec3(q/max(r, 0.01)*1.7, 3.0 + uTime*0.012)) - 0.5) + 0.14*(vn3(vec3(e*0.4, 9.0)) - 0.5);
      float ew = clamp(1.5*fw/max(uCourtA.w, 0.01), 0.02, 0.07);
      // (the shaft is drawn from the low rim down: rock that stands higher in its line keeps the baked light, or a fin would blaze white in the sky)
      float cb = (1.0 - smoothstep(1.0 - ew, 1.0 + ew, r))*step(uCourtC.y - 2.5, vP.y)*(1.0 - smoothstep(13.0, 20.0, vP.y - uCourtC.y));
      {                                                              // the sapling's shadow on its patch: trunk and a crown of shivering leaves
        vec2 sc = e3.xz - uCourtS.xy, sa = uCourtS.xy - uCourtT.xy, pt = e3.xz - uCourtT.xy;
        float crown = 1.0 - smoothstep(0.55, 1.0, length(sc)/max(uCourtS.z, 0.01));
        float dap = smoothstep(0.3, 0.62, 0.6*vn3(vec3(sc*2.6, uTime*0.45)) + 0.4*vn3(vec3(sc*7.0 + 3.0, uTime*0.8)));
        float tk = clamp(dot(pt, sa)/max(dot(sa, sa), 1e-3), 0.0, 1.0);
        float trunk = 1.0 - smoothstep(0.07, 0.13 + 1.5*fw, length(pt - sa*tk));
        cb *= 1.0 - max(0.74*crown*(0.4 + 0.6*dap), 0.7*trunk*uCourtT.z)*uCourtS.w;
      }
      vis = max(vis, cb*sl*smoothstep(-0.1, 0.2, dot(normalize(vN), uCourtD))*mix(0.8, uCourtC.w, max(flr, sandy)));
      sunTint = mix(sunTint, vec3(1.24, 0.62, 0.2), cb*max(flr, sandy));   // (the court's shaded sand is baked cool: in the patch it is sunlit gold)
      courtB = cb*max(flr, sandy);
      {                                                              // the light that patch throws back: on the sand round it and up the rock beside it that faces it, gone within a few metres
        vec2 eh = vP.xz - uCourtC.xz;
        float rh = length(vec2(dot(eh, uCourtA.xy)/max(uCourtA.z, 0.01), dot(eh, vec2(-uCourtA.y, uCourtA.x))/max(uCourtA.w, 0.01)));
        vec2 pn = eh/max(rh, 1.0);                                   // (the part of the patch that lies nearest, more or less)
        vec3 tp = vec3(pn.x - eh.x, uCourtC.y + 0.3 - vP.y, pn.y - eh.y);
        float tl = length(tp);
        float fcp = clamp(dot(N, tp/max(tl, 1e-3))*1.3 + 0.15, 0.0, 1.0);
        courtH = exp(-tl/4.0)*mix(fcp, 0.3, max(flr, sandy))*sl*step(uCourtC.y - 2.5, vP.y);   // (on the sand only a breath of it: the patch keeps its hard edge)
      }
    }
    heroB *= smoothstep(-0.15, 0.25, dot(normalize(vN), uHeroA));
    vis = max(vis, heroB*mix(1.0, 0.74, flr));
    heroB *= max(flr, sandy);
    sunTint = mix(sunTint, vec3(1.3, 0.72, 0.29), heroB);          // (burning gold on the sand, never a pale blob)
  }
  #endif
  float ndl = max(dot(N, uSun), 0.0);
  float up = N.y*0.5 + 0.5, down = 1.0 - up;
  // (a patch of sun on the slot's floor shows every ripple; the hero pool deeper still, and mottled like trodden sand)
  vec3 light = uSunCol * sunTint * mix(ndl, 0.35 + 0.65*ndl, heroB) * vis * mix(1.0, mix(0.45 + 1.1*rip, 1.4*(0.36 + 1.28*rip)*(0.82 + 0.36*vn3(vP*1.3 + 31.0)), heroB), flr) * mix(1.0, 0.52 + 0.96*rip, courtB);   // (.. and the court's patch is warm rippled sand)
  float ss = sl * sandy;                                   // sand in the slot: floor and banked drift lit as one body
  #ifdef CANYON
  {                                                        // the hero pool's spill: the sand round it glows, and the rock beside it that faces it
    light += uSunCol*vec3(1.2, 0.6, 0.24)*1.15*heroH*(1.0 - 0.8*heroB);
    light += uSunCol*vec3(1.2, 0.62, 0.26)*(0.9*courtH*(1.0 - courtB) + 0.45*courtB*(0.75 + 0.5*rip));   // (.. and the court's patch, in little: a hot pool with warm rock beside it)
    // the blade of sun that picks out the petroglyphs: a lobed patch on the rock of their wall, raking down it
    vec3 dg = vP - uGlyphC.xyz;
    if (dot(dg, dg) < 900.0) {
      vec3 pg = dg - uGlyphL*dot(dg, uGlyphL);
      float rg = length(pg);
      float rgn = rg/max(uGlyphC.w, 0.01)*(1.0 + 0.5*(vn3(pg/max(rg, 0.01)*1.6 + vec3(5.0 + uTime*0.015)) - 0.5) + 0.12*(vn3(vP*1.1 + 3.0) - 0.5));
      float eg = clamp(1.5*fw/max(uGlyphC.w, 0.01), 0.04, 0.14);
      light += uSunCol*vec3(0.62, 0.4, 0.22)*(1.0 - smoothstep(1.0 - eg, 1.0 + eg, rgn))*sl*(1.0 - flr)*(1.0 - sandy)*(0.3 + 0.7*max(dot(N, uGlyphL), 0.0))*(1.0 - smoothstep(6.0, 9.0, dot(dg, uGlyphL)))*smoothstep(-6.5, -3.0, dot(dg, uGlyphL));   // (a blade raking down the face: it dies away above and below the panel)
    }
  }
  #endif
  light += uSkyCol * mix(0.25 + 0.75*up*up, 0.2, ss) * (0.35 + 0.65*ao);
  vec3 bounceTint = mix(vec3(0.36, 0.16, 0.22), uBounceCol, smoothstep(0.25, 0.78, ao));
  bounceTint = mix(bounceTint, uBounceCol*vec3(1.0, 0.62, 0.5), (1.0 - smoothstep(0.35, 0.85, ao))*0.5);
  bounceTint = mix(bounceTint, uBounceCol*vec3(1.0, 0.9, 0.75), ss);
  light += bounceTint * mix(0.3*(1.0 - 0.55*up*up) + 1.0*pow(max(down, 0.0), 1.35), 0.6, ss) * (0.3 + 0.7*ao) * mix(1.12, 0.82, smoothstep(0.0, 60.0, vP.y)) * relief * mix(1.06, 1.0, sl);
  // rock that looks straight down at lit sand (the underside of the span, of an overhang, of a bed) glows orange with it
  light += uGlowCol*mix(0.9, 0.7, sl) * down*down*down * (1.0 - ss) * (0.3 + 0.7*ao) * relief;
  // sand in the open shade (the Arch's shadow on its sill) keeps a warm violet, never grey
  light += uBounceCol*vec3(1.0, 0.6, 0.72)*0.16*(1.0 - vis)*sandy*(1.0 - sl);
  // grazing warm scatter so shaded faces keep a glow at their edges
  vec3 V = normalize(uCam - vP);
  float fr = pow(clamp(1.0 - dot(N, V), 0.0, 1.0), 3.0);
  light += uBounceCol * fr * 0.22 * ao * (1.0 - ss);
  // inside the slot (z > 200) the bounce light breathes as dust drifts through the beams that feed it
  float slot = smoothstep(203.0, 216.0, vP.z) * uShimmer;
  if (slot > 0.0) {
    float dn = vn3(vec3(vP.x*0.11, vP.y*0.09 - uTime*0.22, vP.z*0.11 + uTime*0.45))*0.62
             + vn3(vec3(vP.x*0.31 + uTime*0.2, vP.y*0.25 - uTime*0.5, vP.z*0.31))*0.38;
    light *= 1.0 + slot*(dn - 0.5)*1.7;
  }
  vec3 Lp = uPortalPos - vP; float dp = length(Lp);
  vec3 col = alb * light;
  #ifdef CANYON
  {                                                                  // the deepest folds go violet-plum, never black-red
    // (a darkening tint, never brighter than the rock it stands in for)
    // (open shade is the rock's own colour turned toward deep red and held as dark as the plum it used to be; only where the
    // light is lowest, in the hollows of the flutes, does it go over into plum and near-black)
    float fold = sl * (1.0 - smoothstep(0.14, 0.32, ao)) * (1.0 - sandy);
    float deep = 1.0 - smoothstep(0.15, 0.26, ao);
    float lum = dot(col, vec3(0.3, 0.55, 0.15));
    // (it follows the rock's own light and dark up to twice its base value: a fold keeps its beds, it is never one flat tone)
    float kl = clamp(lum/0.05, 0.4, 2.0);
    vec3 redSh = col*vec3(1.0, 0.6, 0.5) + uDeep*0.02;
    redSh *= 0.031*kl/max(dot(redSh, vec3(0.3, 0.55, 0.15)), 1e-4);
    vec3 plumSh = mix(uPlum*vec3(1.0, 0.95, 1.45), uDark*1.9, 0.25)*kl;
    col = mix(col, mix(redSh, plumSh, deep), fold*0.85);
    // (the small hollows grade the same way, in little: the shade under a ledge and in the roof of a scoop is red, then violet-plum,
    // cool against the edge that catches the light, which is gold)
    float hk = clamp(nHol, 0.0, 1.0), ck = clamp(nCrest, 0.0, 1.0)*smoothstep(0.2, 0.6, ao);
    col *= mix(vec3(1.0), vec3(0.86, 0.6, 0.86), hk*(1.0 - fold))*mix(vec3(1.0), vec3(1.1, 1.02, 0.86), ck);
    // .. and so does the underside of an overhang, where no pool lights it from below
    float under = sl*(1.0 - sandy)*smoothstep(0.3, 0.72, -Ng.y)*(1.0 - smoothstep(0.2, 0.42, ao))*(1.0 - fold);
    col = mix(col, vec3(0.3, 0.13, 0.3)*(lum/0.19), 0.32*under);
    // THE WARM GLOW ROUND EACH POOL OF SUN: where a beam meets the sand, the sand and the rock within some metres of the pool
    // take warm light from it, by the pool's place: the hero beam's, each pillar's and blade's, the first slot's lesser shaft's,
    // the hall's three, the court's patch. The glow lies where the pool's light falls and does not move or change (what
    // drifts in it is the dust: the world's own motes). Light ADDED to what the rock already shows, in the rock's own colour (so every bed
    // and ledge is still drawn in it, the ledges' undersides turned to the pool the brightest); no shade is changed by it, and
    // where the deepest folds stand in their own shade (fold) it adds nothing at all.
    if (sl > 0.0) {
      float pg = 0.0, sk = max(flr, sandy);
      vec2 dhc = vP.xz - uHallC.xz;
      float hwn = 1.0 - smoothstep(0.7, 1.0, dot(dhc, dhc)/max(uHallC.w*uHallC.w, 1.0));
      // (its cost, cured by place: the build marks every triangle that no pool's glow can reach, and such a triangle walks no
      // pool at all; a triangle in reach first notes which pools this point lies in reach of, a subtraction and a comparison
      // for each, and then works out the glow of those alone, in the list's own order: the same sums as walking them all)
      int nG = vFar.x > 0.0 ? 0 : 12, nc = 0;
      ivec3 ca = ivec3(0), cb2 = ivec3(0);
      for (int i = 0; i < nG; i++) {
        vec3 d = vP - uGlowP[i].xyz;
        if (dot(d, d) < uGlowP[i].w) {
          if (nc == 0) ca.x = i; else if (nc == 1) ca.y = i; else if (nc == 2) ca.z = i; else if (nc == 3) cb2.x = i; else if (nc == 4) cb2.y = i; else if (nc == 5) cb2.z = i;
          nc++;
        }
      }
      if (nc > 6) nc = 6;
      for (int j = 0; j < nc; j++) {
        int i = j == 0 ? ca.x : j == 1 ? ca.y : j == 2 ? ca.z : j == 3 ? cb2.x : j == 4 ? cb2.y : cb2.z;
        vec3 d = vP - uGlowP[i].xyz;
        float g = poolGlow(d, uGlowE[i], N, sk)*uGlowS[i];
        if (i >= 8 && i <= 10) g *= hwn;                                 // (the hall's three, inside the hall's own round)
        if (i == 11) g *= 1.0 - 0.8*courtB;                              // (the court's patch)
        pg += g;
      }
      col += alb*uSunCol*vec3(1.2, 0.6, 0.24)*pg*sl*(1.0 - 0.8*heroB)*(1.0 - fold);
    }
  }
  #endif
  col += (alb*0.45 + 0.2) * uPortalCol * uPortalGlow * (0.3 + 0.7*max(dot(N, Lp/max(dp, 1e-3)), 0.0)) * 1000.0/(dp*dp + 500.0);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- sandfall (veil strips, grains, dust)
// One falling-sand kinematics shared by all three so they stay registered: v = 0 at the lip, 1 at the foot.
const GLSL_FALL = /* glsl */`
uniform float uTime;
uniform vec2 uWind;
vec3 fallPos(vec3 o, float v, float L, float seed){
  vec3 p = o;
  p.y -= v*L;
  float gust = 0.6 + 0.4*sin(uTime*0.35 + seed*6.0) + 0.25*sin(uTime*0.9 + v*5.0 + seed*3.0);
  p.xz += uWind * (v*v) * L * 0.19 * gust * (1.0 + floor(seed)*0.55);
  p.z += sqrt(v) * 1.6 * min(L/40.0, 1.0);                   // thrown clear of the lip
  p.x += sin(v*7.0 - uTime*1.1 + seed*10.0) * 0.4 * v * min(L/40.0, 1.0);
  return p;
}`;

const VEIL_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec2 aUV;
attribute vec4 aStrip;           // angle about Y, seed, half width at the foot, length
${GLSL_FALL}
varying vec2 vUV; varying vec2 vInfo;
void main(){
  float v = aUV.y, L = aStrip.w;
  vec3 p = fallPos(position, v, L, aStrip.y);
  float w = mix(0.3, 1.0, pow(v, 0.55)) * aStrip.z;
  p.xz += vec2(cos(aStrip.x), sin(aStrip.x)) * aUV.x * w;
  vUV = aUV; vInfo = vec2(aStrip.y, L);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const VEIL_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform float uTime, uSurge, uFall;
uniform vec3 uSandLit, uSandShade;
varying vec2 vUV; varying vec2 vInfo;
${GLSL_NOISE}
void main(){
  float u = vUV.x, v = vUV.y, seed = vInfo.x;
  float big = step(30.0, vInfo.y);
  float q = sqrt(v + 0.012) * uFall * sqrt(vInfo.y/55.0) - uTime;        // constant on a falling parcel
  float s1 = vn2(vec2(u*2.6 + seed*17.0, q*0.8));
  float s2 = vn2(vec2(u*9.0 + seed*31.0, q*2.1 + 4.0));
  float s3 = vn2(vec2(u*31.0 + seed*7.0, q*4.6));
  float dens = s1*0.5 + s2*0.32 + s3*0.18;
  float pulse = 0.6 + 0.4*smoothstep(0.25, 0.75, vn2(vec2(seed*3.0, q*0.4)));
  float edge = pow(max(1.0 - u*u, 0.0), 1.3);
  float a = edge * smoothstep(0.3, 0.85, dens*(0.6 + 0.9*edge)) * pulse * 1.35;
  float sv = (v - (uSurge*1.25 - 0.2))/0.17;
  a *= 1.0 + big*uSurge*2.2*exp(-sv*sv) * edge;
  a *= smoothstep(0.0, 0.035, v) * (1.0 - smoothstep(mix(0.72, 0.7, big), 1.0, v)) * mix(1.0, 0.6, v);
  // (the thin trickles on the legs fall through the Arch's own shade: faint threads of dim sand, not bright sticks)
  a = clamp(a, 0.0, 0.9) * mix(0.3, 0.92, big) / (1.0 + floor(seed)*0.7);
  vec3 col = mix(uSandLit, uSandShade, smoothstep(0.35, 1.0, a)*0.8);
  col *= (0.8 + 0.5*s2) * mix(0.6, 1.0, big);
  col += uSandLit * pow(s3, 5.0) * 0.9 * big;                            // glints
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

const GRAIN_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aSeed;
uniform vec3 uOrigin; uniform float uLen, uHalfW, uFall, uPx;
${GLSL_FALL}
varying float vA;
void main(){
  float ph = fract(uTime/(uFall*1.05) + aSeed.x);
  float v = ph*ph;
  vec3 p = fallPos(uOrigin, v, uLen, 0.0);
  float w = mix(0.3, 1.0, pow(v, 0.55)) * uHalfW;
  float ang = aSeed.y*6.2832, rad = sqrt(aSeed.z)*w*1.2;
  p.xz += vec2(cos(ang), sin(ang)*0.6)*rad;
  p.xz += normalize(uWind + 1e-4) * aSeed.w*aSeed.w * v * 7.0 * length(uWind);   // the wind's fringe
  vA = smoothstep(0.0, 0.05, v) * (1.0 - smoothstep(0.86, 1.0, v)) * (0.45 + 0.55*aSeed.w);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float px = uPx * (0.5 + aSeed.z) / max(-mvPosition.z, 1.0);
  vA *= clamp(px, 0.25, 1.0);
  gl_PointSize = clamp(px, 1.0, 3.0);
  #include <fog_vertex>
}`;

const GRAIN_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uSandLit;
varying float vA;
void main(){
  vec2 d = gl_PointCoord - 0.5;
  float a = vA * (1.0 - smoothstep(0.15, 0.5, length(d)));
  gl_FragColor = vec4(uSandLit*1.25, a);
  #include <fog_fragment>
}`;

const DUST_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aSeed;
uniform vec3 uOrigin; uniform float uLen, uBoost, uCrest;
${GLSL_FALL}
varying vec2 vQ; varying float vA; varying float vS;
void main(){
  float life = mix(5.0, 9.0, aSeed.w);
  float ph = fract(uTime/life + aSeed.x);
  float v0 = aSeed.y;
  float base = step(0.93, v0);
  vec3 c = fallPos(uOrigin, min(v0, 0.985), uLen, 0.0);
  vec2 wd = normalize(uWind + 1e-4); float ws = length(uWind);
  c.xz += wd * ph * mix(12.0, 24.0, aSeed.z) * ws + (vec2(aSeed.z, fract(aSeed.w*7.3)) - 0.5) * mix(2.5, 6.0, base);
  c.y += mix(-ph*7.0, 0.6 + ph*(2.0 - ph)*mix(3.0, 9.0, fract(aSeed.z*5.1)), base);
  float size = mix(1.0, mix(3.0, 8.5, aSeed.w), sqrt(ph));
  vA = pow(sin(ph*3.14159), 1.3) * mix(0.04, 0.06, base) * (1.0 + base*uBoost*1.6);
  if (v0 > 1.5) {                                          // spindrift blowing off the top of the span
    float xs = (aSeed.z*2.0 - 1.0) * 46.0;
    c = vec3(xs, uCrest - smoothstep(26.0, 50.0, abs(xs))*10.0, (fract(aSeed.w*13.7) - 0.5)*8.0);
    c.xz += wd * ph * mix(10.0, 22.0, fract(aSeed.x*7.7)) * ws;
    c.y += ph*4.0 - ph*ph*7.0;
    size = mix(1.0, mix(2.5, 6.0, aSeed.w), sqrt(ph));
    vA = pow(sin(ph*3.14159), 1.3) * 0.055;
  }
  vQ = position.xy; vS = aSeed.x*37.0;
  vec4 mvPosition = modelViewMatrix * vec4(c, 1.0);
  mvPosition.xy += position.xy * size;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const DUST_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uDustCol;
varying vec2 vQ; varying float vA; varying float vS;
${GLSL_NOISE}
void main(){
  float r = length(vQ);
  float a = 1.0 - smoothstep(0.0, 1.0, r); a *= a;
  a *= 0.55 + 0.75*vn2(vQ*1.7 + vS);
  a *= vA;
  if (a < 0.003) discard;
  gl_FragColor = vec4(uDustCol, a);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- swifts
const SWIFT_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aSeed;            // phase, speed, x radius, height
attribute float aWing;
uniform float uTime; uniform vec3 uCenter;
varying float vShade;
vec3 orbit(float th, vec4 s){
  float ry = 2.0 + 3.0*fract(s.x*9.7);
  return uCenter + vec3(cos(th)*s.z, s.w + sin(th*2.0 + s.x*20.0)*ry, sin(th)*mix(26.0, 46.0, fract(s.x*3.3)) + 4.0);
}
void main(){
  float dirn = aSeed.y > 0.0 ? 1.0 : -1.0;
  float th = uTime*aSeed.y + aSeed.x*6.2832 + 0.35*sin(uTime*0.23 + aSeed.x*40.0);
  vec3 c = orbit(th, aSeed);
  vec3 fwd = normalize(orbit(th + 0.02*dirn, aSeed) - c);
  vec3 fw2 = normalize(orbit(th + 0.10*dirn, aSeed) - c);
  vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
  float bank = clamp(dot(fw2 - fwd, right)*9.0, -1.1, 1.1);
  vec3 upv = normalize(cross(right, fwd));
  vec3 r2 = right*cos(bank) + upv*sin(bank);
  vec3 u2 = upv*cos(bank) - right*sin(bank);
  float gate = smoothstep(-0.2, 0.3, sin(uTime*1.7 + aSeed.x*50.0));                // flicker, then glide
  float flap = sin(uTime*34.0 + aSeed.x*100.0) * 0.55 * gate - 0.12*(1.0 - gate);
  vec3 l = position * 0.55;
  l.y += aWing * abs(l.x) * flap;
  vec3 p = c + r2*l.x + u2*l.y + fwd*l.z;
  vShade = 0.5 + 0.5*u2.y;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const SWIFT_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uBody;
varying float vShade;
void main(){
  gl_FragColor = vec4(uBody * (0.6 + 0.8*vShade), 1.0);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- loading in small steps
// geometry.computeVertexNormals(), bit for bit (the same sums in the same order, the same float32 stores), but in
// slices with a ctx.yield() between them, so that no single step of the build holds the page.
export async function computeNormalsInSteps(geo, ctx) {
  const P = geo.attributes.position.array, I = geo.index.array, n = P.length, N = new Float32Array(n);
  for (let t = 0, tl = I.length; t < tl; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
    const bx = P[b], by = P[b + 1], bz = P[b + 2];
    const cx = P[c] - bx, cy = P[c + 1] - by, cz = P[c + 2] - bz, ax = P[a] - bx, ay = P[a + 1] - by, az = P[a + 2] - bz;
    const nx = cy * az - cz * ay, ny = cz * ax - cx * az, nz = cx * ay - cy * ax;
    const a0 = N[a] + nx, a1 = N[a + 1] + ny, a2 = N[a + 2] + nz, b0 = N[b] + nx, b1 = N[b + 1] + ny, b2 = N[b + 2] + nz, c0 = N[c] + nx, c1 = N[c + 1] + ny, c2 = N[c + 2] + nz;
    N[a] = a0; N[a + 1] = a1; N[a + 2] = a2; N[b] = b0; N[b + 1] = b1; N[b + 2] = b2; N[c] = c0; N[c + 1] = c1; N[c + 2] = c2;
    if (t % 3000 === 2997) await ctx.yield();
  }
  for (let v = 0; v < n; v += 3) {
    const x = N[v], y = N[v + 1], z = N[v + 2], s = 1 / (Math.sqrt(x * x + y * y + z * z) || 1);
    N[v] = x * s; N[v + 1] = y * s; N[v + 2] = z * s;
    if (v % 6000 === 5997) await ctx.yield();
  }
  await ctx.yield();
  geo.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  await ctx.yield();
}

// geometry.computeBoundingSphere(), the same numbers (the box of the positions, its centre, the farthest vertex from
// it), in slices with a ctx.yield() between them
export async function boundingSphereInSteps(geo, ctx) {
  const P = geo.attributes.position.array, n = geo.attributes.position.count * 3;
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (let v = 0; v < n; v += 3) {
    const x = P[v], y = P[v + 1], z = P[v + 2];
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); z0 = Math.min(z0, z); x1 = Math.max(x1, x); y1 = Math.max(y1, y); z1 = Math.max(z1, z);
    if (v % 1500 === 1497) await ctx.yield();
  }
  await ctx.yield();
  const cx = (x0 + x1) * 0.5, cy = (y0 + y1) * 0.5, cz = (z0 + z1) * 0.5;
  let m = 0;
  for (let v = 0; v < n; v += 3) {
    const dx = cx - P[v], dy = cy - P[v + 1], dz = cz - P[v + 2];
    m = Math.max(m, dx * dx + dy * dy + dz * dz);
    if (v % 1500 === 1497) await ctx.yield();
  }
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), Math.sqrt(m));
  await ctx.yield();
}

// ---------------------------------------------------------------- build
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, N = ctx.noise;
  // the world may hand in its own yield (the same hand-back, asked for less often): every step of this build goes through it
  const Y = opts.yield || (() => ctx.yield()), yctx = { yield: Y };
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [cCream, cOrange, cRed, cDeep, cPlum, cDark, cSky] = pal;

  // ---- per-seed character
  const W = 32, H = 48, PW = 0.85;                       // opening half width, height, shoulder squareness
  const nL = rng.range(3.0, 3.7), nR = rng.range(2.35, 2.8);    // outer silhouette: 2 = round bridge, 3.5 = blocky fin
  const AL = W + rng.range(27, 33), AR = W + rng.range(19, 24);   // heavy left buttress, slimmer right leg
  const tilt = rng.range(-1.5, 3.0), shL = rng.range(2, 6), shR = rng.range(-5, -1);
  const hdCrown = rng.range(7, 8.4), hdLeg = rng.range(12, 14.5);
  const bed = rng.range(2.0, 2.8), strataPhase = rng.range(0, 40);
  const o1 = rng.range(0, 100), o2 = rng.range(0, 100);
  const windA = rng.range(-0.45, 0.45);
  const wind = opts.wind ? new THREE.Vector2(opts.wind[0], opts.wind[1]) : new THREE.Vector2(-Math.cos(windA), Math.sin(windA)).multiplyScalar(rng.range(0.8, 1.1));
  const sun = new THREE.Vector3().fromArray(opts.sunDir || [-0.36, 0.86, -0.36]).normalize();

  // ---- shared vertex store (one rock mesh, one draw call)
  const pos = [], col = [], shd = [], idx = [];
  let vcount = 0;
  const push = (x, y, z, r, g, b, ao, sand) => { pos.push(x, y, z); col.push(r, g, b); shd.push(ao, 1, sand); return vcount++; };
  // index a rows x cols grid starting at vertex `base`; orientation is fixed afterwards so normals face out
  const gridRows = (base, cols, wrap, r0, r1) => {
    const cw = wrap ? cols : cols - 1;
    for (let i = r0; i < r1; i++) for (let j = 0; j < cw; j++) {
      const a = base + i * cols + j, b = base + i * cols + (j + 1) % cols, c = a + cols, d = b + cols;
      idx.push(a, b, d, a, d, c);
    }
  };
  const grid = (base, rows, cols, wrap) => { const i0 = idx.length; gridRows(base, cols, wrap, 0, rows - 1); gridFace(i0, base, rows, cols); };
  // the same grid for a big sheet, a few rows at a time so the page keeps drawing while it is indexed
  const gridInSteps = async (base, rows, cols, wrap, per) => {
    const i0 = idx.length;
    for (let r = 0; r < rows - 1; r += per) { gridRows(base, cols, wrap, r, Math.min(rows - 1, r + per)); await Y(); }
    const c = gridCentre(base, rows, cols);
    await Y();
    let vol = 0;
    for (let t = i0; t < idx.length; t += 6000) { vol = gridVolume(t, Math.min(idx.length, t + 6000), c[0], c[1], c[2], vol); await Y(); }
    if (vol < 0) for (let t = i0; t < idx.length; t += 3) { const s = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = s; }
    await Y();
  };
  const gridCentre = (base, rows, cols) => {
    let cx = 0, cy = 0, cz = 0; const n = rows * cols;
    for (let v = base; v < base + n; v++) { cx += pos[v * 3]; cy += pos[v * 3 + 1]; cz += pos[v * 3 + 2]; }
    return [cx / n, cy / n, cz / n];
  };
  const gridFace = (i0, base, rows, cols) => {
    const c = gridCentre(base, rows, cols), vol = gridVolume(i0, idx.length, c[0], c[1], c[2], 0);
    if (vol < 0) for (let t = i0; t < idx.length; t += 3) { const s = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = s; }
  };
  const gridVolume = (t0, t1, cx, cy, cz, vol) => {
    for (let t = t0; t < t1; t += 3) {
      const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
      const ax = pos[a] - cx, ay = pos[a + 1] - cy, az = pos[a + 2] - cz, bx = pos[b] - cx, by = pos[b + 1] - cy, bz = pos[b + 2] - cz, ex = pos[c] - cx, ey = pos[c + 1] - cy, ez = pos[c + 2] - cz;
      vol += ax * (by * ez - bz * ey) + ay * (bz * ex - bx * ez) + az * (bx * ey - by * ex);
    }
    return vol;
  };

  // ---- sandstone relief: big swells, bedding ledges, weathering creases, grain. Returns metres along the normal.
  const hashL = (i) => { const s = Math.sin(i * 127.1 + strataPhase * 3.3) * 43758.5453; return s - Math.floor(s); };
  let cav = 0.5;
  const rockDisp = (x, y, z, vert) => {
    const big = N.fbm3(x * 0.016 + o1, y * 0.016 + o2, z * 0.016, 2) * 2.8;
    const ys = y + N.n3(x * 0.028 + o1, y * 0.028, z * 0.028 + o2) * 2.5 + 0.05 * x + strataPhase;
    const s = ys / bed, li = Math.floor(s), f = s - li, hard = hashL(li);
    const prof = smoothstep(0, 0.14, f) * (1 - smoothstep(0.55, 0.75, f));
    const zone = smoothstep(0.02, 0.4, N.n2(ys * 0.075 + o2, o1 * 0.37));   // thin-bedded zones between massive ones
    const bench = N.n2(ys * 0.105 + o1, 2.3) * 1.5 + N.n3(x * 0.045 + o2, y * 0.045, z * 0.045 + o1) * 1.3;        // partings, rounded bulges
    const ledge = ((prof * (0.3 + 0.95 * hard) - 0.45) * lerp(0.14, 0.95, zone) + bench) * vert;
    const r = 1 - Math.abs(N.n3(x * 0.055 + o2, y * 0.04, z * 0.055 + o1));
    const crease = -r * r * r * 1.7;
    const fine = N.n3(x * 0.22, y * 0.22, z * 0.22) * 0.3;
    cav = clamp(0.66 + (ledge - bench * vert) * 0.5 + bench * vert * 0.1 + crease * 0.22 + big * 0.04, 0, 1);
    return big + ledge + crease + fine;
  };

  // ---- the Arch: a rounded-rectangle section swept from the left foot over the crown to the right foot
  const innerPt = (a) => { const sa = Math.sin(a); return [-W * Math.cos(a), sa >= 0 ? H * Math.pow(sa, PW) : H * sa]; };
  // top line: 12 m over the crown, a raised caprock shoulder on the left, a slumped one on the right
  const topB = (x) => H + 12 - tilt * clamp(x / W, -1.6, 1.6) * smoothstep(4, 20, Math.abs(x))
    + (x < 0 ? shL : shR) * smoothstep(14, 34, Math.abs(x)) + 1.6 * N.n2(x * 0.06 + o1, 5.5) * smoothstep(5, 18, Math.abs(x));
  const outerF = (x, y) => { const n = x < 0 ? nL : nR; return Math.pow(Math.abs(x) / (x < 0 ? AL : AR), n) + Math.pow(Math.max(y, 0) / topB(x), n); };
  const depthAt = (y) => {                                // half depth (z) of the solid at height y
    const sa = Math.min(1, Math.pow(Math.max(y, 0) / H, 1 / PW));
    return lerp(hdLeg, hdCrown, smoothstep(0, 0.9, sa)) * (1 + 0.35 * (1 - smoothstep(0, 18, y)));
  };
  const leanAt = (a) => 2.2 * N.n2(a * 0.9 + o2, 7.7);
  const NOTCH_X = -16;
  const SN = 272, RN = 76, A0 = -0.13, A1 = Math.PI + 0.13;
  const archBase = vcount;
  let lip = null, lipScore = -1e9, apexY = 0, perch = null, perchScore = -1e9;
  const trickleCand = [];
  for (let i = 0; i <= SN; i++) {
    const a = lerp(A0, A1, i / SN), sa = Math.sin(a);
    const [ix, iy] = innerPt(a), [px, py] = innerPt(a - 0.004), [qx, qy] = innerPt(a + 0.004);
    let tx = qx - px, ty = qy - py; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const nx = -ty, ny = tx;                              // outward: left at the left foot, up at the crown
    let lo = 2, hi = 90;
    for (let k = 0; k < 22; k++) { const m = (lo + hi) * 0.5; if (outerF(ix + nx * m, iy + ny * m) < 1) lo = m; else hi = m; }
    let T = Math.max(11, lo * (1 + 0.08 * N.n2(a * 2.2 + o1, 3.1)));
    if (iy < 0) T *= 1.06;
    const ht = T * 0.5, hd = depthAt(iy) * (1 + 0.06 * N.n2(a * 3.1 + o2, 1.7));
    const cxr = ix + nx * ht, cyr = iy + ny * ht, zoff = leanAt(a);
    const m = lerp(3.3, 2.6, smoothstep(0.2, 0.95, Math.max(sa, 0)));
    for (let j = 0; j < RN; j++) {
      const ph = (j / RN) * Math.PI * 2, c = Math.cos(ph), s = Math.sin(ph);
      const hdz = s < 0 ? hd * 0.93 : hd;
      const r = 1 / Math.pow(Math.pow(Math.abs(c) / ht, m) + Math.pow(Math.abs(s) / hdz, m), 1 / m);
      const lx = c * r, lz = s * r;
      let gn = Math.sign(c) * Math.pow(Math.abs(lx) / ht, m - 1) / ht, gz = Math.sign(s) * Math.pow(Math.abs(lz) / hdz, m - 1) / hdz;
      const gl = Math.hypot(gn, gz) || 1; gn /= gl; gz /= gl;
      const dx = nx * gn, dy = ny * gn, dz = gz;
      let x = cxr + nx * lx, y = cyr + ny * lx, z = zoff + lz;
      const vert = Math.hypot(dx, dz);
      // the underside of the span is smooth, spalled rock; the faces carry the full relief
      const under = smoothstep(0.3, 0.8, -dy) * smoothstep(0.3, 0.8, Math.max(sa, 0));
      const d = rockDisp(x, y, z, vert) * (1 - 0.55 * under);
      x += dx * d; y += dy * d; z += dz * d;
      if (dy > 0.3) {                                      // the notch: a wind-cut groove through the front lip
        const g = Math.exp(-Math.pow((x - NOTCH_X) / 2.4, 2)) * smoothstep(-4, 2, z - zoff) * smoothstep(0.3, 0.7, dy);
        y -= 4.6 * g;
      }
      if (dz > 0.25 && dy > -0.2) {                        // and its chute down the upper front face
        const g = Math.exp(-Math.pow((x - NOTCH_X) / 2.0, 2)) * smoothstep(0.25, 0.7, dz);
        z -= 1.3 * g;
        const sc = z * 1.0 + y * 0.35 - Math.abs(x - NOTCH_X) * 3 - (dy < 0.25 ? 6 : 0);
        if (sc > lipScore) { lipScore = sc; lip = new THREE.Vector3(NOTCH_X, y, z); }
      }
      if (Math.abs(x) < 4 && y > apexY) apexY = y;
      if (dy > 0.55 && x > 20 && x < 36 && z > zoff) { const sc = z + y * 0.2; if (sc > perchScore) { perchScore = sc; perch = new THREE.Vector3(x, y, z); } }
      if (dz > 0.85 && Math.abs(x) > 37 && y > 18 && y < 44 && (i * 7 + j) % 5 === 0) trickleCand.push([x, y, z]);
      const tint = 0.92 + 0.16 * N.n3(x * 0.03 + o2, y * 0.03, z * 0.03);
      // (the underside of the span looks straight down at sunlit sand: it takes the full bounce)
      const ao = lerp(cav * lerp(0.5, 1, smoothstep(-2, 10, y)), Math.max(cav, 0.92), under);
      push(x, y, z, tint, tint * (0.97 + 0.05 * N.n2(a * 9, j * 0.2)), tint, ao, 0);
    }
    await Y();
  }
  await Y();
  await gridInSteps(archBase, SN + 1, RN, true, 8);

  // ---- the rim block: slickrock sill with terraces and sand drifts, 50 m cliffs all round
  const veilTop = lip.clone().add(new THREE.Vector3(0, 0.3, 0.5));
  const PX = rng.range(88, 96), PZF = rng.range(38, 44), PZB = rng.range(32, 35), PCZ = 8;
  const rimR = (c, s) => {
    const r = 1 / Math.pow(Math.pow(Math.abs(c) / PX, 2.7) + Math.pow(Math.abs(s) / (s > 0 ? PZF : PZB), 2.7), 1 / 2.7);
    return r * (1 + 0.06 * N.n2(c * 1.6 + o1, s * 1.6 + o2) + 0.03 * N.n2(c * 5 + o2, s * 5 + o1));
  };
  const footL = -(W + (AL - W) * 0.5), footR = W + (AR - W) * 0.5;
  // where the veil lands (mean wind drift) and its sand cone
  const cone = new THREE.Vector2(veilTop.x + wind.x * 6.3, veilTop.z + 1.6 + wind.y * 6.3);
  let sandAmt = 0;
  const topH = (x, z, e) => {
    let h = lerp(1.0, -2.2, smoothstep(0.6, 1.0, e));
    h += 3.4 * Math.exp(-((x - footL) ** 2 + z * z * 1.3) / 500) + 3.0 * Math.exp(-((x - footR) ** 2 + z * z * 1.3) / 420);
    h += 0.9 * N.fbm2(x * 0.02 + o1, z * 0.02 + o2, 3);
    const q = h / 0.7, qi = Math.floor(q);
    h = lerp(h, (qi + smoothstep(0.3, 0.7, q - qi)) * 0.7, 0.65);            // slickrock terraces
    const drift = smoothstep(0.2, 0.62, N.fbm2(x * 0.035 + o2, z * 0.05 + o1, 3) + 0.25 * (1 - smoothstep(0, 30, Math.abs(x))));
    const dc = Math.hypot(x - cone.x, z - cone.y);
    const k = Math.exp(-dc * dc / 30);
    h += 0.35 * drift + 2.6 * k + 0.6 * Math.exp(-dc * dc / 160);
    sandAmt = clamp(drift * 0.85 + smoothstep(0.05, 0.3, k + 0.3 * Math.exp(-dc * dc / 160)), 0, 1);
    return h;
  };
  const groundAt = (x, z) => {                              // sill height at any (x,z) on the block
    const dx = x, dz = z - PCZ, r = Math.hypot(dx, dz) || 1e-3;
    return topH(x, z, Math.min(1, r / rimR(dx / r, dz / r)));
  };
  const AN = 240, TR = 34, CR = 20, DROP = 52;
  const blockBase = vcount;
  for (let k = 0; k <= TR + CR; k++) {
    for (let j = 0; j < AN; j++) {
      const th = (j / AN) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th), R = rimR(c, s);
      if (k <= TR) {
        const e = Math.pow(k / TR, 0.85), x = c * R * e, z = PCZ + s * R * e, y = topH(x, z, e);
        const dl = Math.min(Math.hypot(x - footL, z), Math.hypot(x - footR, z));
        const ao = lerp(0.55, 1, smoothstep(10, 30, dl)) * (0.85 + 0.15 * sandAmt);
        const tint = 0.95 + 0.14 * N.n2(x * 0.05 + o1, z * 0.05);
        // (the outer rim of the sill lies under drifted sand, so the amphitheatre's floor laps onto it without a seam)
        push(x, y, z, tint, tint, tint, ao, Math.max(sandAmt * (1 - smoothstep(0.9, 1, e)), 0.92 * smoothstep(0.8, 0.9, e)));
      } else {
        const t = (k - TR) / CR, ye = topH(c * R, PCZ + s * R, 1);
        const talus = Math.pow(smoothstep(0.6, 1, t), 1.4);
        const y = ye - DROP * Math.pow(t, 1.05);
        let rr = R + 1.4 * Math.sqrt(t) + talus * 17;
        const x0 = c * rr, z0 = PCZ + s * rr;
        rr += (rockDisp(x0, y, z0, 1) * 1.35 + 1.2 * N.n2(th * 14 + o1, y * 0.03)) * (1 - talus) * smoothstep(0, 0.12, t);
        const tint = 0.9 + 0.14 * N.n3(x0 * 0.03, y * 0.03, z0 * 0.03 + o1);
        push(c * rr, y, PCZ + s * rr, tint, tint, tint, cav * lerp(1, 0.6, smoothstep(0.3, 1, t)), talus * 0.9);
      }
    }
    await Y();
  }
  await Y();
  await gridInSteps(blockBase, TR + CR + 1, AN, true, 3);

  // ---- hoodoos (weathered remnants of the same fin) and talus boulders
  const addSpire = async (cx, cz, h, r0, capped) => {
    const SA = 18, SV = 30, base = vcount, yb = groundAt(cx, cz) - 2.5, ph = rng.range(0, 6.28), ell = rng.range(0.1, 0.3);
    for (let i = 0; i <= SV; i++) {
      const t = i / SV, y = yb + (h + 2.5) * t;
      let r = r0 * (1 - 0.5 * Math.pow(t, 0.8)) * (1 + 0.5 * (1 - smoothstep(0, 0.16, t)));
      if (capped) r *= 1 - 0.3 * smoothstep(0.6, 0.74, t) * (1 - smoothstep(0.8, 0.85, t)) + 0.1 * smoothstep(0.82, 0.87, t);
      r *= Math.sqrt(Math.max(0, 1 - Math.pow(smoothstep(0.9, 1, t), 2)));
      for (let j = 0; j < SA; j++) {
        const th = (j / SA) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th), e = 1 + ell * Math.cos(2 * (th - ph));
        let x = cx + c * r * e, z = cz + s * r / e;
        const d = rockDisp(x * 1.7, y * 1.3, z * 1.7, 1) * 0.55 * Math.min(1, r / 2.5);
        x += c * d; z += s * d;
        const tint = 0.92 + 0.14 * N.n3(x * 0.06, y * 0.06, z * 0.06);
        push(x, y, z, tint, tint, tint, cav * lerp(0.6, 1, smoothstep(0, 0.2, t)), 0);
      }
      if (i % 3 === 2) await Y();
    }
    grid(base, SV + 1, SA, true);
  };
  const addBoulder = (cx, cy, cz, r) => {
    const SA = 9, SV = 6, base = vcount, sx = rng.range(0.8, 1.35), sy = rng.range(0.55, 0.9), sz = rng.range(0.8, 1.3), po = rng.range(0, 50);
    for (let i = 0; i <= SV; i++) {
      const la = (i / SV - 0.5) * Math.PI, cl = Math.cos(la), sl = Math.sin(la);
      for (let j = 0; j < SA; j++) {
        const th = (j / SA) * Math.PI * 2, nx = cl * Math.cos(th), nz = cl * Math.sin(th);
        const rr = r * (1 + 0.32 * N.n3(nx * 1.3 + po, sl * 1.3, nz * 1.3 + po));
        const tint = 0.85 + 0.2 * N.n2(po, j * 0.4 + i);
        push(cx + nx * rr * sx, cy + sl * rr * sy, cz + nz * rr * sz, tint, tint * 0.96, tint * 0.94, lerp(0.5, 1, sl * 0.5 + 0.5), 0);
      }
    }
    grid(base, SV + 1, SA, true);
  };
  const leftBig = rng.chance(0.6);
  const spires = [];
  const sideSpire = async (side, big) => {
    const x = side * rng.range(70, 80), z = rng.range(-12, 4);
    const h = big ? rng.range(22, 30) : rng.range(10, 15), r = big ? rng.range(4.2, 5.4) : rng.range(3.4, 4.4);
    await addSpire(x, z, h, r, big); spires.push(new THREE.Vector3(x, h, z));
    if (rng.chance(0.7)) await addSpire(x + side * rng.range(-9, -6), z + rng.range(6, 10), h * rng.range(0.3, 0.45), r * 0.7, false);
  };
  await sideSpire(-1, leftBig);
  await Y();
  await sideSpire(1, !leftBig);
  await Y();
  const nB = rng.int(30, 40);
  for (let b = 0; b < nB; b++) {
    const side = rng.sign(), foot = side < 0 ? footL : footR, an = rng.range(0, 6.28), dd = rng.range(15, 30);
    let x = foot + Math.cos(an) * dd * 1.1 + side * 6, z = Math.sin(an) * dd;
    if (Math.abs(x) < 24) x = side * rng.range(24, 30);                    // keep the sill under the portal open
    const r = Math.pow(rng(), 2.2) * 2.8 + 0.5;
    const er = Math.hypot(x, z - PCZ) || 1;
    if (er / rimR(x / er, (z - PCZ) / er) > 0.86) continue;
    addBoulder(x, groundAt(x, z) + r * 0.25, z, r);
    if (b % 4 === 3) await Y();
  }
  await Y();

  // ---- geometry, normals, then bake the Arch's own shadow from the sun
  const geo = new THREE.BufferGeometry();
  const P = new Float32Array(pos), S = new Float32Array(shd);
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
  await Y();
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
  geo.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1));
  await Y();
  await computeNormalsInSteps(geo, yctx);
  const NR = geo.attributes.normal.array;
  const topLut = new Float32Array(321), depLut = new Float32Array(101);
  for (let i = 0; i <= 320; i++) topLut[i] = topB(-80 + i * 0.5);
  for (let i = 0; i <= 100; i++) depLut[i] = depthAt(i * 0.5) * 0.92;
  const solid = (x, y, z) => {                             // roughly metres inside the Arch (negative outside)
    const dq = depLut[Math.min(100, Math.max(0, (y * 2) | 0))] - Math.abs(z);
    if (dq < -4) return dq;
    const n = x < 0 ? nL : nR, tb = topLut[Math.min(320, Math.max(0, ((x + 80) * 2) | 0))];
    let f = (0.95 - Math.pow(Math.abs(x) / (x < 0 ? AL : AR), n) - Math.pow(Math.max(y, 0) / tb, n)) * 20;
    if (Math.abs(x) < W) f = Math.min(f, y - H * Math.pow(1 - (x / W) * (x / W), PW * 0.5) - 0.8);
    return Math.min(f, dq, y + 6);
  };
  const bx0 = -(AL + 3), bx1 = AR + 3, by0 = -6, by1 = 70, bz = hdLeg * 1.4 + 3;
  for (let v = 0; v < vcount; v++) {
    if (v % 64 === 63) await Y();
    const nx = NR[v * 3], ny = NR[v * 3 + 1], nz = NR[v * 3 + 2];
    if (nx * sun.x + ny * sun.y + nz * sun.z < -0.05) { S[v * 3 + 1] = 0; continue; }
    const x = P[v * 3] + nx * 1.8, y = P[v * 3 + 1] + ny * 1.8, z = P[v * 3 + 2] + nz * 1.8;
    if (y < -8) continue;
    // clip the sun ray to the Arch's box, then march only that stretch
    let t0 = 1.5, t1 = 150;
    if (Math.abs(sun.x) > 1e-5) { const a = (bx0 - x) / sun.x, b = (bx1 - x) / sun.x; t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b)); } else if (x < bx0 || x > bx1) continue;
    { const a = (by0 - y) / sun.y, b = (by1 - y) / sun.y; t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b)); }
    if (Math.abs(sun.z) > 1e-5) { const a = (-bz - z) / sun.z, b = (bz - z) / sun.z; t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b)); } else if (Math.abs(z) > bz) continue;
    if (t0 >= t1) continue;
    const n = Math.min(22, Math.ceil((t1 - t0) / 2.2)), dt = (t1 - t0) / n;
    let deep = -9;
    for (let k = 0; k < n && deep < 2; k++) { const t = t0 + (k + 0.5) * dt, f = solid(x + sun.x * t, y + sun.y * t, z + sun.z * t); if (f > deep) deep = f; }
    S[v * 3 + 1] = 1 - smoothstep(-1.6, 1.6, deep);
  }
  geo.setAttribute('aShade', new THREE.BufferAttribute(S, 3));
  await Y();
  await boundingSphereInSteps(geo, yctx);

  // ---- materials
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const sunCol = new THREE.Color(opts.sunColor || '#fff0d8').multiplyScalar(opts.sunIntensity ?? 2.3);
  const skyCol = (opts.skyColor ? new THREE.Color(opts.skyColor) : new THREE.Color('#3a6fd0').lerp(cSky, 0.25)).multiplyScalar(opts.skyIntensity ?? 0.65);
  const bounceCol = cOrange.clone().lerp(cCream, 0.75).multiplyScalar(2.2 * (opts.bounce ?? 1));
  const sandLit = cCream.clone().lerp(cOrange, 0.2).multiply(sunCol).multiplyScalar(0.56);
  const sandShade = cOrange.clone().lerp(cCream, 0.4).multiplyScalar(0.85);
  const object = new THREE.Group(); object.name = 'canyon-of-light:arch';
  const rockMat = new THREE.ShaderMaterial({
    uniforms: Object.assign(fogU(), {
      uShimmer: { value: opts.shimmer ?? 0 }, uSun: { value: sun.clone() }, uSunCol: { value: sunCol }, uSkyCol: { value: skyCol }, uBounceCol: { value: bounceCol },
      uCam: { value: new THREE.Vector3(0, 30, 200) }, uPortalCol: { value: new THREE.Color(opts.portalColor || pal[6]) },
      uPortalPos: { value: new THREE.Vector3(0, 22, 0) }, uPortalGlow: { value: opts.portalGlow ?? 0 },
      uCream: { value: cCream.clone() }, uOrange: { value: cOrange.clone().lerp(cCream, 0.3) }, uRed: { value: cRed.clone().lerp(cCream, 0.24) },
      uDeep: { value: cDeep.clone().lerp(cRed, 0.3) }, uPlum: { value: cPlum.clone() }, uDark: { value: cDark.clone() },
      uStrataPhase: { value: strataPhase }, uBed: { value: bed }, uTime: { value: 0 }, uWind: { value: wind }, uBufH: { value: 900 },
      // only read by the world's canyon mesh (its clone of this material defines CANYON and adds an aSlot attribute)
      uPools: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 0.001, -1e4)) }, uBeamDir: { value: new THREE.Vector3(0, -1, 0) },
      uHeroF: { value: Array.from({ length: 8 }, () => new THREE.Vector3(0, -1e4, 0)) }, uHeroE1: { value: Array.from({ length: 8 }, () => new THREE.Vector4(1, 0, 0, 0.01)) },
      uHeroE2: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 1, 0.01)) }, uHeroK: { value: Array.from({ length: 8 }, () => new THREE.Vector2(1, 0)) }, uHeroA: { value: new THREE.Vector3(0, 1, 0) },
      uHallF: { value: Array.from({ length: 3 }, () => new THREE.Vector3(0, -1e4, 0)) }, uHallE1: { value: Array.from({ length: 3 }, () => new THREE.Vector4(1, 0, 0, 0.01)) },
      uHallE2: { value: Array.from({ length: 3 }, () => new THREE.Vector4(0, 0, 1, 0.01)) }, uHallK: { value: Array.from({ length: 3 }, () => new THREE.Vector2(1, 0)) }, uHallC: { value: new THREE.Vector4(0, -1e4, 0, 1) },
      uGlowP: { value: Array.from({ length: 12 }, () => new THREE.Vector4(0, -1e4, 0, 0)) }, uGlowE: { value: Array.from({ length: 12 }, () => new THREE.Vector4(1, 0, 0, 0.01)) }, uGlowS: { value: new Array(12).fill(0) },
      uGlyphTex: { value: null }, uGlyphU: { value: new THREE.Vector4(1, 0, 0, 1) }, uGlyphV: { value: new THREE.Vector4(0, 1, 0, 1) }, uGlyphN: { value: new THREE.Vector3(0, 0, 1) },
      uHoo: { value: Array.from({ length: 3 }, () => new THREE.Vector4(0, -1e4, 0, 1)) }, uHooR: { value: Array.from({ length: 3 }, () => new THREE.Vector3(0.01, 0, 0)) },
      uAmp: { value: new THREE.Vector4(0, 0, 0, 0) }, uGlyphC: { value: new THREE.Vector4(0, -1e4, 0, 1) }, uGlyphL: { value: new THREE.Vector3(0, 1, 0) }, uMouthD: { value: 1e6 },
      uCourtC: { value: new THREE.Vector4(0, -1e4, 0, 0.7) }, uCourtA: { value: new THREE.Vector4(1, 0, 0.01, 0.01) }, uCourtD: { value: new THREE.Vector3(0, 1, 0) }, uCourtS: { value: new THREE.Vector4(0, 0, 1, 0) }, uCourtT: { value: new THREE.Vector3(0, 0, 0) },
      // the glow on rock that looks down at lit sand: the brief's own orange on every seed, however bleached the seed's rock
      uGlowCol: { value: new THREE.Color('#ff9d4d').lerp(new THREE.Color('#f7e3c0'), 0.75).multiplyScalar(2.2).multiply(new THREE.Color(1.05, 0.7, 0.4)) },
    }),
    vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG, fog: true,
  });
  const rock = new THREE.Mesh(geo, rockMat); rock.name = 'arch-rock'; object.add(rock);
  await Y();

  // ---- sandfall: main veil (three crossed strips) plus thin trickles off the ledges, one draw call
  const footY = groundAt(cone.x, cone.y) - 0.4, fallLen = veilTop.y - footY;
  const vp = [], vuv = [], vst = [], vi = []; let vn = 0;
  const addStrip = (o, ang, seed, halfW, L, nu, nv) => {
    const b = vn;
    for (let i = 0; i <= nv; i++) for (let j = 0; j <= nu; j++) { vp.push(o.x, o.y, o.z); vuv.push((j / nu) * 2 - 1, i / nv); vst.push(ang, seed, halfW, L); vn++; }
    for (let i = 0; i < nv; i++) for (let j = 0; j < nu; j++) { const a = b + i * (nu + 1) + j; vi.push(a, a + 1, a + nu + 2, a, a + nu + 2, a + nu + 1); }
  };
  const veilW = rng.range(2.5, 3.1);
  addStrip(veilTop, 0, rng(), veilW, fallLen, 6, 48);
  addStrip(veilTop, 1.05, rng(), veilW * 0.8, fallLen, 4, 48);
  addStrip(veilTop, -1.05, rng(), veilW * 0.8, fallLen, 4, 48);
  for (let k = 1; k <= 4; k++) addStrip(veilTop, rng.range(-0.35, 0.35), k + rng(), veilW * rng.range(0.55, 0.8), fallLen, 3, 40);   // wind-peeled streamers
  const trickles = [];
  for (let k = 0, tries = 0; k < 4 && tries < 60 && trickleCand.length; tries++) {
    const c = rng.pick(trickleCand);
    if (trickles.some((t) => Math.abs(t.x - c[0]) < 7)) continue;
    const o = new THREE.Vector3(c[0], c[1], c[2] + 0.5), L = Math.min(rng.range(10, 22), c[1] - 3), hw = rng.range(0.35, 0.6), sd = rng();
    // (no thread of sand is drawn on the legs: from the plain it was a pale scratch on the rock. The places are kept as anchors.)
    trickles.push(o); k++;
  }
  const veilGeo = new THREE.BufferGeometry();
  veilGeo.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3));
  veilGeo.setAttribute('aUV', new THREE.Float32BufferAttribute(vuv, 2));
  veilGeo.setAttribute('aStrip', new THREE.Float32BufferAttribute(vst, 4));
  veilGeo.setIndex(vi);
  await Y();
  const FALL = 4.2;
  const veilMat = new THREE.ShaderMaterial({
    uniforms: Object.assign(fogU(), { uTime: { value: 0 }, uWind: { value: wind }, uSurge: { value: 0 }, uFall: { value: FALL }, uSandLit: { value: sandLit }, uSandShade: { value: sandShade } }),
    vertexShader: VEIL_VERT, fragmentShader: VEIL_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const veil = new THREE.Mesh(veilGeo, veilMat); veil.frustumCulled = false; veil.renderOrder = 2; veil.name = 'sandfall-veil'; object.add(veil);
  await Y();

  const nG = 2600, gs = new Float32Array(nG * 4);
  for (let i = 0; i < nG * 4; i++) gs[i] = rng();
  const grainGeo = new THREE.BufferGeometry();
  grainGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nG * 3), 3));
  grainGeo.setAttribute('aSeed', new THREE.BufferAttribute(gs, 4));
  const grainMat = new THREE.ShaderMaterial({
    uniforms: Object.assign(fogU(), { uTime: { value: 0 }, uWind: { value: wind }, uOrigin: { value: veilTop }, uLen: { value: fallLen }, uHalfW: { value: veilW }, uFall: { value: FALL }, uPx: { value: 170 }, uSandLit: { value: sandLit } }),
    vertexShader: GRAIN_VERT, fragmentShader: GRAIN_FRAG, fog: true, transparent: true, depthWrite: false,
  });
  const grains = new THREE.Points(grainGeo, grainMat); grains.frustumCulled = false; grains.renderOrder = 3; grains.name = 'sandfall-grains'; object.add(grains);
  await Y();

  const nD = 300, ds = new Float32Array(nD * 4);
  for (let i = 0; i < nD; i++) { ds[i * 4] = rng(); ds[i * 4 + 1] = i < 70 ? 2 : rng.chance(0.5) ? rng.range(0.95, 1) : rng.range(0.3, 0.9); ds[i * 4 + 2] = rng(); ds[i * 4 + 3] = rng(); }
  const dustGeo = new THREE.InstancedBufferGeometry();
  dustGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  dustGeo.setIndex([0, 1, 2, 0, 2, 3]);
  dustGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(ds, 4));
  dustGeo.instanceCount = nD;
  const dustMat = new THREE.ShaderMaterial({
    uniforms: Object.assign(fogU(), { uTime: { value: 0 }, uWind: { value: wind }, uOrigin: { value: veilTop }, uLen: { value: fallLen }, uBoost: { value: 0 }, uCrest: { value: apexY + 0.5 }, uDustCol: { value: cCream.clone().lerp(cOrange, 0.15).multiply(sunCol).multiplyScalar(0.36) } }),
    vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, fog: true, transparent: true, depthWrite: false,
  });
  const dust = new THREE.Mesh(dustGeo, dustMat); dust.frustumCulled = false; dust.renderOrder = 4; dust.name = 'sandfall-dust'; object.add(dust);
  await Y();

  // ---- swifts wheeling through the opening (they cross the portal's plane outside its rim)
  const nS = opts.swifts ?? 16;
  let swiftMat = null;
  if (nS > 0) {
    const sp = [0, 0, 0.42, -0.06, 0, -0.3, 0.06, 0, -0.3, -0.06, 0, -0.3, -0.1, 0, -0.55, 0, 0, -0.32, 0.06, 0, -0.3, 0, 0, -0.32, 0.1, 0, -0.55];
    const sw = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (const m of [-1, 1]) {
      sp.push(m * 0.03, 0, 0.2, m * 0.03, 0, -0.06, m * 0.45, 0, 0.03, m * 0.45, 0, 0.03, m * 0.03, 0, -0.06, m * 0.4, 0, -0.1, m * 0.45, 0, 0.03, m * 0.4, 0, -0.1, m * 0.86, 0, -0.4);
      sw.push(0, 0, 0.6, 0.6, 0, 0.6, 0.6, 0.6, 1);
    }
    const ss = new Float32Array(nS * 4);
    for (let i = 0; i < nS; i++) { ss[i * 4] = rng(); ss[i * 4 + 1] = rng.sign() * rng.range(0.34, 0.6); ss[i * 4 + 2] = rng.range(13, 21); ss[i * 4 + 3] = rng.range(-8, 4); }
    const sg = new THREE.InstancedBufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    sg.setAttribute('aWing', new THREE.Float32BufferAttribute(sw, 1));
    sg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(ss, 4));
    sg.instanceCount = nS;
    swiftMat = new THREE.ShaderMaterial({
      uniforms: Object.assign(fogU(), { uTime: { value: 0 }, uCenter: { value: new THREE.Vector3(0, 24, 0) }, uBody: { value: cDark.clone().lerp(cPlum, 0.3).multiplyScalar(0.6) } }),
      vertexShader: SWIFT_VERT, fragmentShader: SWIFT_FRAG, fog: true, side: THREE.DoubleSide,
    });
    const swifts = new THREE.Mesh(sg, swiftMat); swifts.frustumCulled = false; swifts.name = 'swifts'; object.add(swifts);
  }
  await Y();

  // ---- anchors
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const center = V(0, 26, 0);
  const anchors = {
    portalSeat: { position: V(0, 22, 0), normal: V(0, 0, 1), radius: 10 },
    flyThrough: [V(0, 22, 200), V(0, 22, 140), V(0, 22, 80), V(0, 22, 30), V(0, 22, 0), V(0, 22, -40)],
    viewpoints: { slotMouth: V(0, 22, 200), burstOut: V(0, 24, 150), lowLeft: V(-70, 8, 95), underSpan: V(14, 6, 26), behind: V(40, 30, -120) },
    lookAt: center.clone(),
    sandfallTop: veilTop.clone(), sandfallBase: V(cone.x, footY + 0.4, cone.y), trickles,
    apex: V(0, apexY, 0), leftFoot: V(footL, groundAt(footL, 20), 20), rightFoot: V(footR, groundAt(footR, 20), 20),
    ravenPerch: { position: (perch || V(30, 50, 6)).clone(), normal: V(0, 1, 0) },
    swiftCenter: V(0, 24, 0), spires, sunDir: sun.clone(),
    rimEdgeZ: PCZ - PZB, blockHalfWidth: PX, blockFrontZ: PCZ + PZF,
  };

  // ---- animation
  let progress = null;
  const tmp = new THREE.Vector3(), bufSize = new THREE.Vector2();
  const timed = [rockMat, veilMat, grainMat, dustMat]; if (swiftMat) timed.push(swiftMat);
  return {
    object, radius: 62, height: Math.ceil(apexY + 1), center, anchors,
    ground: true, groundY: -50,
    // for the world: the sandstone shader (so walls, floors and far mesas share one look and one program),
    // the relief function (returns metres along the normal; `sculpt.cav` is the cavity term it left behind),
    // the sill height and the block's footprint (e < 1 inside the rim block, 1 on its edge)
    rockMaterial: rockMat, palette: pal, strata: { bed, phase: strataPhase },
    sculpt: { cav: 0.5, at(x, y, z, vert = 1) { const d = rockDisp(x, y, z, vert); this.cav = cav; return d; } },
    groundAt,
    blockE(x, z) { const dx = x, dz = z - PCZ, r = Math.hypot(dx, dz) || 1e-3; return r / rimR(dx / r, dz / r); },
    update(dt, time, camera) {
      for (const m of timed) m.uniforms.uTime.value = time;
      let s, boost;
      if (progress === null) { s = (time % 20) / 14; boost = smoothstep(0.6, 0.85, s) * (1 - smoothstep(1.05, 1.4, s)); }
      else { s = clamp((progress - 0.25) / 0.55, 0, 1); boost = smoothstep(0.6, 0.9, s); }
      veilMat.uniforms.uSurge.value = s; dustMat.uniforms.uBoost.value = boost;
      if (ctx.renderer) {                                   // grains sized, and the rock's detail filtered, for the picture as it is drawn now
        const bh = ctx.renderer.getDrawingBufferSize(bufSize).y;
        grainMat.uniforms.uPx.value = bh * 0.38; rockMat.uniforms.uBufH.value = bh;
      }
      if (camera) { object.updateWorldMatrix(true, false); rockMat.uniforms.uCam.value.copy(object.worldToLocal(tmp.setFromMatrixPosition(camera.matrixWorld))); }
    },
    setProgress(u) { progress = u == null ? null : clamp(u, 0, 1); },
    setPortalGlow(color, k = 1) { if (color != null) rockMat.uniforms.uPortalCol.value.set(color); rockMat.uniforms.uPortalGlow.value = k; },
    setSun(d) { const v = Array.isArray(d) ? tmp.fromArray(d) : tmp.copy(d); rockMat.uniforms.uSun.value.copy(v).normalize(); },
    dispose() {},
  };
}
