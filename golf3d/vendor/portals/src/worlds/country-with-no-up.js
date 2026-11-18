// THE COUNTRY WITH NO UP (from Flatland): a nation that lives in a plane. We begin inside it, as its people see: the
// whole country is one band of lights in fog. Then we are lifted out, the line opens into a luminous country of flat
// bright-edged figures streaming between pentagon houses with all their insides open to us, a mirror ball 160 m across
// comes down through it as a blazing circle, and we climb the way it came to a ring hung above the plane.
//
// MAP OF THIS WORLD
//   src/parts/country-with-no-up-glsl.js     places, the Sphere's track from u, COMMON GLSL (the fog slab, its light, the palette)
//   src/parts/country-with-no-up-plan.js     the town plan per seed: roads, lane loops, houses, people (typed arrays)
//   src/parts/country-with-no-up-people.js   figures, skirts and their reflections, houses, hall, static walls
//   src/parts/country-with-no-up.js          THE HERO: the mirror Sphere, its picture of the plane, the circle, the hoops
//   this file                                the seeded day, the path, space (dome), the black glass and its far edge,
//                                            rain, dust, the point country, the vermilion square at home, the streaks
//                                            on the Sphere's track, the gaze, update()
// Everything is its own light: no lights, no kit sky; unlit shaders, bloom, style none.
// PLANE SPACE: shaders work with the glass at y 0 and the eye at uEye; uLift (0 in flight) stands the glass lower only
// while the world is seen through a portal by a camera that would otherwise be under it.
// Following the flight (told in metres from places found on the road, never in typed u): the Sphere's visit
// (hero.setS), the gaze (one poi that slides hall -> circle -> flank -> the next ring on the track -> hoop), the
// painting's front on the rare day. We are the one who is lifted. Everything else runs on the world clock.
import * as THREE from 'three';
import { makePath, clamp, smoothstep } from '../kit/core.js';
import { COMMON, SKY, makeShared, HALL, FIELD, HOOP, REST, TRACK, TRACK_LEN, SPHERE_R, POINT, sphereS, spherePos } from '../parts/country-with-no-up-glsl.js';
import { makePlan } from '../parts/country-with-no-up-plan.js';
import { buildPeople } from '../parts/country-with-no-up-people.js';
import { buildHero } from '../parts/country-with-no-up.js';

const DUR = 50;
const SQ_NEAR = [FIELD.x - FIELD.r - 30, FIELD.z];      // the vermilion square lives in the roomy house nearest this place: the west point of the landing ground's rim, 30 m out (the ground's own margin and half a house)

// ---------------------------------------------------------------- GLSL of this file
// the black glass: blue-black with a slow sheen; it mirrors space (the horizon's band with it), the mist's light, the
// hoop and the ball, by the one law of the glass (mirrorK: more the more the line of sight grazes it at the point seen)
const GLASS = /* glsl */`
uniform vec4 uRc[16], uRn[16], uRcol[16];      // the hero's rings (its NR)
float cosI;
vec3 glassCol(vec3 P, vec3 V, float fp){
  cosI = clamp(-V.y, 0., 1.); float fres = mirrorK(cosI);
  vec3 col = uPal[7]*(0.30 + 0.22*cN(P.xz*0.011 + 3.) + 0.14*cN(P.xz*0.21)*(1. - smoothstep(0.8, 5., fp)));
  vec3 Rr = normalize(vec3(V.x, max(-V.y, 0.004), V.z));
  vec3 refl = skyCol(Rr);
  float dn = dot(Rr, uRn[0].xyz); dn = abs(dn) < 1e-3 ? 1e-3 : dn;
  float t = dot(uRc[0].xyz - P, uRn[0].xyz)/dn; vec3 hp = P + Rr*t - uRc[0].xyz;
  float e = abs(length(hp) - uRc[0].w), w = 9. + 0.03*max(t, 0.);
  refl += uRcol[0].rgb*uRcol[0].w*0.16*step(0., t)*exp(-e*e/(w*w))*(0.35 + 0.9*cN(P.xz*vec2(0.9, 0.11) + vec2(0., uTime*0.2)));
  vec3 oc = P - uSphere.xyz; float b = dot(oc, Rr), c = dot(oc, oc) - uSphere.w*uSphere.w, disc = b*b - c;
  if (disc > 0. && b < 0.) {
    float sd = sqrt(max(disc, 0.)); vec3 N = (oc + Rr*(-b - sd))/uSphere.w;
    float o2 = 1. - clamp(-dot(Rr, N), 0., 1.);
    vec3 ball = vec3(0.50, 0.62, 0.95)*(0.06 + 0.6*o2*o2*o2) + fogLight(P.xz)*0.6*clamp(-N.y + 0.3, 0., 1.);
    refl = mix(refl, ball, smoothstep(0., 6., sd));
  }
  float rl = min(uFogP.z/Rr.y, 1200.), rT = exp(-uFogP.x*rl);
  refl = refl*rT + fogLight(P.xz + Rr.xz*min(rl, 150.)*0.5)*(1. - rT);
  return col + refl*fres;
}`;
// rain comes from the north in bands some 300 m deep that travel south
const RAIN = /* glsl */`
float rainBand(vec2 p){
  float bz = p.y - uTime*12. + 0.3*p.x + 140.*(cN(p*0.0021 + 4.) - 0.5);
  float m = cN(vec2(bz/330., uRain.y));
  return uRain.x*smoothstep(0.62 - 0.3*uRain.x, 0.76 - 0.3*uRain.x, m);
}`;

const DOME_VS = /* glsl */`
varying vec3 vD;
void main(){ vD = position; vec4 p = projectionMatrix*modelViewMatrix*vec4(position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p; }`;
const DOME_FS = COMMON + SKY + GLASS + /* glsl */`
varying vec3 vD;
void main(){
  vec3 d = normalize(vD); vec3 col; float L = 1.0e5;
  if (d.y >= 0.) col = skyCol(d);
  // the glass runs on beyond its mesh: its far points are asked no further out than 30 km, but the mist is reckoned
  // along the whole ray down to the glass, so no ray near the horizon is counted as missing the mist
  else { L = uEye.y/max(-d.y, 1e-4); float Lp = min(L, 3.0e4); col = glassCol(vec3(uEye.x + d.x*Lp, 0., uEye.z + d.z*Lp), d, 50.); }
  vec4 fg = slabFogRay(d, L);
  // the far mist's low glow: where a ray is lost in the mist beyond the country's edge, the mist there is the glow
  // that lies along the horizon (so the far glass runs up into the horizon's band with no line between them). The
  // place asked is where the ray ends its way through the slab: on the glass, or at the slab's top.
  float tEnd = d.y < 0. ? L : clamp((uFogP.z - uEye.y)/max(d.y, 1e-4), 0., 3.0e4);
  col = col*fg.a + fg.rgb + horizon(d)*(1. - fg.a)*(1. - edgeDim(uEye.xz + d.xz*tEnd));
  col += (cH(gl_FragCoord.xy + fract(uTime)*71.) - 0.5)*0.0012;                       // fine grain: depth, not a flat card
  gl_FragColor = vec4(max(col, 0.), 1.);
}`;

// (the mesh is a fan of slices round the eye's foot: its middle vertex stands straight under the eye, and under a level
// gaze its depth along the sight is nothing, where a slice cannot be drawn: every slice came out as one plain band. So
// that depth is never taken as less than a tenth of a millimetre, as in the dome's shader above: one law for every gaze)
const PLANE_VS = COMMON + /* glsl */`
varying vec3 vW;
void main(){ vW = vec3(position.x + uEye.x, 0., position.z + uEye.z); vec4 p = projectionMatrix*viewMatrix*vec4(vW.x, uLift, vW.z, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p; }`;
const PLANE_FS = COMMON + SKY + GLASS + RAIN + /* glsl */`
uniform sampler2D uOcc; uniform vec4 uOccR;      // r: where houses stand, g: where the roads run; x0, z0, size
varying vec3 vW;
float occ(vec2 p){ return textureLod(uOcc, (p - uOccR.xy)/uOccR.z, 0.).r; }
void main(){
  vec3 P = vW, V = P - uEye; float dist = length(V); V /= max(dist, 1e-3);
  float fp = max(length(dFdx(P.xz)), length(dFdy(P.xz)));
  vec3 col = glassCol(P, V, fp);                         // (the horizon's band is in it as the glass mirrors it: by the angle of sight, never by how far the eye is)
  // the glass holds the light of what stands on it, most where the roads have worn it bright
  float road = textureLod(uOcc, (P.xz - uOccR.xy)/uOccR.z, 0.).g;
  float grainy = 0.75 + 0.5*cN(P.xz*0.045) - 0.3*cN(P.xz*0.31)*(1. - smoothstep(0.5, 4., fp));
  float ed = edgeDim(P.xz);                              // toward the country's far edge its light on the glass dims away
  col += (townGlow(P.xz)*(0.02 + 0.05*road)*grainy + uPal[7]*0.25*road)*mix(0.3, 1., smoothstep(0.2, 0.8, cosI))*ed;     // seen from above; at a grazing eye the glass is a mirror
  // rain on the glass: a glitter of splashes, and a dry wedge trailing south of every house (the rain comes from the north)
  float rb = rainBand(P.xz);
  if (rb > 0.003) {
    float dry = max(occ(P.xz), max(occ(P.xz + vec2(0., -9.)), max(0.75*occ(P.xz + vec2(0., -20.)), 0.45*occ(P.xz + vec2(0., -33.)))));
    float wet = rb*(1. - clamp(dry*1.3, 0., 1.))*ed;      // the rain glitters by the country's light
    vec2 cid = floor(P.xz/0.35); float ph = fract(cH(cid) + uTime*(1.4 + cH(cid + 7.)));
    float fine = 1. - smoothstep(0.06, 0.4, fp);
    float rr = length(fract(P.xz/0.35) - 0.5 - 0.3*(vec2(cH(cid + 11.), cH(cid + 5.)) - 0.5));
    float splash = step(0.6, cH(cid + 3.))*exp(-ph*7.)*(1. - smoothstep(0.0, 0.06, rr - 0.03 - 0.1*ph));
    col += vec3(0.42, 0.75, 0.85)*wet*(0.55*splash*fine + 0.012 + 0.03*(1. - fine));
  }
  vec4 fg = slabFog(P);
  // beyond the country's edge the glass that is lost in the mist takes the far mist's low glow (as in the dome)
  gl_FragColor = vec4(col*fg.a + fg.rgb + horizon(V)*(1. - fg.a)*(1. - ed), 1.);
}`;

// rain dashes lying in the plane, 2.5 m long, sweeping south; they wrap in a box round a place on the glass ahead of the eye along the road
const DASH_VS = COMMON + RAIN + /* glsl */`
attribute vec3 aSeed;
uniform vec4 uFocus;            // x, z, box size, -
varying vec3 vW; varying vec2 vQ; varying float vA;
void main(){
  float B = uFocus.z;
  vec2 c = vec2(aSeed.x*B, aSeed.y*B + uTime*30.);
  c = uFocus.xy + (fract((c - uFocus.xy)/B + 0.5) - 0.5)*B;
  float dist = length(vec3(c.x, 0.5, c.y) - uEye), hw = max(0.07, 0.6*dist/uPx);
  vec3 P = vec3(c.x + position.x*hw, 0.56, c.y + position.y*1.25);
  vec2 e = abs(c - uFocus.xy)/B;
  vA = rainBand(c)*(1. - smoothstep(0.4, 0.5, max(e.x, e.y)))*mix(1., 0.07/hw, 0.7)*(0.5 + 0.5*aSeed.z);
  vQ = position.xy; vW = P;
  gl_Position = projectionMatrix*viewMatrix*vec4(P.x, P.y + uLift, P.z, 1.);
}`;
const DASH_FS = COMMON + /* glsl */`
varying vec3 vW; varying vec2 vQ; varying float vA;
void main(){
  float a = clamp(vA, 0., 1.)*(1. - abs(vQ.x))*(1. - smoothstep(0.3, 1., abs(vQ.y)))*(0.55 + 0.45*vQ.y);
  vec4 fg = slabFog(vW);
  gl_FragColor = vec4(vec3(0.55, 0.85, 0.95)*1.9*a*fg.a, 0.);
}`;

// pearl dust drifting past the eye's place above the plane
const MOTE_VS = COMMON + /* glsl */`
attribute vec4 aSeed;
uniform vec4 uBox;              // centre xyz, size
varying vec2 vQ; varying vec3 vW; varying float vA;
// right and up of a card at c that faces the eye's PLACE (never the lens: a card does not turn when the gaze turns)
void faceEye(vec3 c, out vec3 r, out vec3 u){
  vec3 f = uEye - c; float l = length(f); f = l > 1e-4 ? f/l : vec3(0., 0., 1.);
  r = cross(vec3(0., 1., 0.), f); float rl = length(r); r = rl > 1e-3 ? r/rl : vec3(1., 0., 0.);
  u = cross(f, r);
}
void main(){
  float B = uBox.w;
  vec3 c = aSeed.xyz*B + vec3(uTime*0.7, uTime*0.22*(aSeed.w - 0.3), uTime*0.45) + 1.4*vec3(sin(uTime*0.4 + aSeed.w*40.), sin(uTime*0.33 + aSeed.w*23.), cos(uTime*0.37 + aSeed.w*31.));
  c = uBox.xyz + (fract((c - uBox.xyz)/B + 0.5) - 0.5)*B;
  float dist = max(length(c - uEye), 0.05), s = 0.03 + 0.05*aSeed.w;
  vec3 cr, cu; faceEye(c, cr, cu);
  vec3 P = c + (cr*position.x + cu*position.y)*s;
  vec3 e = abs(c - uBox.xyz)/B;
  vA = (1. - smoothstep(0.3, 0.5, max(e.x, max(e.y, e.z))))*smoothstep(0.8, 3., dist)*smoothstep(0.6, 2.0, c.y)*(0.5 + 0.5*sin(uTime*1.7 + aSeed.w*90.))*clamp(s*uPx/dist/2.2, 0., 1.);
  vQ = position.xy; vW = P;
  gl_Position = projectionMatrix*viewMatrix*vec4(P.x, P.y + uLift, P.z, 1.);
}`;
const MOTE_FS = COMMON + /* glsl */`
varying vec2 vQ; varying vec3 vW; varying float vA;
void main(){
  float r = min(dot(vQ, vQ), 9.), a = clamp(vA, 0., 1.)*(1. - smoothstep(0.35, 1., r));
  gl_FragColor = vec4(vec3(0.80, 0.86, 0.98)*0.07*a, 0.);
}`;

// a soft light facing the eye: the country of one point (kind 0), the vermilion square's glow (kind 1)
const SPOT_VS = COMMON + /* glsl */`
uniform vec4 uSpot; uniform float uSpotV;      // place and radius; how tall it is for its width (1: round)
varying vec2 vQ; varying vec3 vW;
// right and up of a card at c that faces the eye's PLACE (never the lens: a card does not turn when the gaze turns)
void faceEye(vec3 c, out vec3 r, out vec3 u){
  vec3 f = uEye - c; float l = length(f); f = l > 1e-4 ? f/l : vec3(0., 0., 1.);
  r = cross(vec3(0., 1., 0.), f); float rl = length(r); r = rl > 1e-3 ? r/rl : vec3(1., 0., 0.);
  u = cross(f, r);
}
void main(){
  vec3 cr, cu; faceEye(uSpot.xyz, cr, cu);
  vec3 P = uSpot.xyz + (cr*position.x + cu*position.y*uSpotV)*uSpot.w;
  vQ = position.xy; vW = P;
  gl_Position = projectionMatrix*viewMatrix*vec4(P.x, P.y + uLift, P.z, 1.);
}`;
const SPOT_FS = COMMON + /* glsl */`
uniform vec4 uSpotCol, uSpotK;  // colour and strength; core tightness and gain, halo tightness and gain
varying vec2 vQ; varying vec3 vW;
void main(){
  float r2 = min(dot(vQ, vQ), 9.), a = (uSpotK.y*exp(-r2*uSpotK.x) + uSpotK.w*exp(-r2*uSpotK.z))*uSpotCol.a*(1. - smoothstep(0.5, 1., r2));
  vec4 fg = slabFog(vW);
  gl_FragColor = vec4(uSpotCol.rgb*a*fg.a, 0.);
}`;
// the one square with vermilion edges: a slab like every body of its country, at home in its house
const SQUARE_VS = COMMON + /* glsl */`
varying vec3 vL, vN, vW;
void main(){
  vL = position; vN = normal;
  vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz;
  gl_Position = projectionMatrix*viewMatrix*vec4(w.x, w.y + uLift, w.z, 1.);
}`;
const SQUARE_FS = COMMON + /* glsl */`
varying vec3 vL, vN, vW;
void main(){
  vec3 red = uPal[6], col;
  if (abs(vN.y) > 0.5) {
    vec2 p = vL.xz; float d = max(abs(p.x), abs(p.y)) - 3.25, fw = max(fwidth(d), 1e-4);
    float w = max(0.3, 1.3*fw), rim = 1. - clamp(0.5 - (d + w)/fw, 0., 1.);
    vec2 q = p/6.5;
    float nuc = exp(-dot(q - vec2(0.03, 0.02), q - vec2(0.03, 0.02))/0.010), ch = exp(-dot(q - vec2(-0.1, -0.2), q - vec2(-0.1, -0.2))/0.016) + exp(-dot(q - vec2(0.12, 0.2), q - vec2(0.12, 0.2))/0.012);
    float beat = 0.5 + 0.5*sin(uTime*9.0); beat *= beat; beat *= beat;
    float heart = exp(-dot(q - vec2(0.1, -0.04), q - vec2(0.1, -0.04))/0.0012)*(0.35 + 0.65*beat);
    vec3 inner = uPal[7]*1.4 + red*(0.42*exp(clamp(d, -40., 0.)/1.5) + 0.24*ch + 0.07) + uPal[3]*(0.6*nuc + 1.9*heart);      // a living figure, lit inside
    col = mix(inner, red*3.0*(0.8 + 0.4*smoothstep(-3.25, 3.25, p.y)), rim);
    vec2 ge = p - vec2(0., 3.05); col += uPal[3]*2.6*exp(-dot(ge, ge)/0.10)*(0.7 + 0.3*sin(uTime*2.3));      // its eye: a small glint on its leading edge
  } else col = red*2.4;
  col += uPal[4]*circleLight(vW.xz)*0.25*exp(-max(vW.y, 0.)/40.);
  vec4 fg = slabFog(vW);
  gl_FragColor = vec4(col*fg.a + fg.rgb, 1.);
}`;

// streaks of the ball's own pearl-gold drawn up the Sphere's track, inside its rings, into the hoop: each is the last
// 7 to 13 m of its own path, a slow helix about the track (so it is a streak seen from the side and seen end on).
// On the world clock; each thins within 15 m of the eye's place and by nothing else of the eye.
const STREAK_VS = COMMON + /* glsl */`
attribute vec4 aSeed;
uniform vec3 uTrk0, uTrkD; uniform float uTrkL;      // the hoop's middle; the way down the track; the track's length to the resting ball's skin
varying vec2 vQ; varying float vA;
vec3 onHelix(float s, float a, float z){
  vec3 U = normalize(cross(uTrkD, vec3(1., 0., 0.))), W = cross(uTrkD, U);
  float rad = (0.12 + 0.5*z)*(46. - 0.09*s);           // inside the rings: at most five eighths of a ring's radius at that place
  return uTrk0 + uTrkD*s + (U*cos(a) + W*sin(a))*rad;
}
void main(){
  float v = 6. + 8.*aSeed.w, turn = 0.45;              // metres a second up the track; radians a second about it
  float s = mod(aSeed.x*uTrkL - uTime*v, uTrkL), a = aSeed.y*6.2831853 + uTime*turn;
  float lag = (7. + 6.*fract(aSeed.z*7.13))/v;         // seconds of its own path that the streak shows
  vec3 c0 = onHelix(s, a, aSeed.z), c1 = onHelix(s + v*lag, a - turn*lag, aSeed.z), ax = c1 - c0;
  vec3 f = uEye - 0.5*(c0 + c1); float l = length(f); f = l > 1e-4 ? f/l : vec3(0., 0., 1.);
  vec3 side = cross(ax, f); float sl = length(side); side = sl > 1e-4 ? side/sl : vec3(1., 0., 0.);
  vec3 P = mix(c0, c1, 0.5 + 0.5*position.y) + side*position.x*0.14;
  vA = smoothstep(0., 30., s)*(1. - smoothstep(uTrkL - 50., uTrkL, s))*smoothstep(3., 15., l);
  vQ = position.xy;
  gl_Position = projectionMatrix*viewMatrix*vec4(P.x, P.y + uLift, P.z, 1.);
}`;
const STREAK_FS = COMMON + /* glsl */`
varying vec2 vQ; varying float vA;
void main(){
  float x = clamp(vQ.x, -1., 1.), head = 0.5 - 0.5*clamp(vQ.y, -1., 1.);       // bright at its head, fading down its tail
  gl_FragColor = vec4(uPal[4]*0.8*vA*(1. - x*x)*head*head, 0.);
}`;

const ADD = { transparent: true, depthWrite: false, depthTest: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, side: THREE.DoubleSide };
const sm = smoothstep;
// instanced unit quads with one seed attribute of `n` random numbers each
function seededQuads(count, n, rng) {
  const q = new THREE.PlaneGeometry(2, 2), g = new THREE.InstancedBufferGeometry(), a = new Float32Array(count * n);
  for (let i = 0; i < a.length; i++) a[i] = rng();
  g.index = q.index; g.setAttribute('position', q.attributes.position); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(a, n)); g.instanceCount = count;
  return g;
}

export default {
  id: 'country-with-no-up',
  name: 'The Country with No Up',
  category: 'books',
  placeKind: 'bizarre',
  book: 'Flatland',
  author: 'Edwin A. Abbott, 1838 to 1926',
  weirdness: 0.95,
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const scene = new THREE.Scene();

    // ---- the day, by seed: the age, the hall, the landing ground, the weather, the hour
    // Every stream of the generator, one per kind of thing, taken here in one fixed list before anything is drawn.
    const FK = {}; for (const k of ['day', 'roads', 'houses', 'scatter', 'people', 'field', 'home', 'doors', 'rain', 'motes', 'sway', 'clock', 'standin', 'avenue', 'blocks']) FK[k] = rng.fork(k);
    const vr = FK.day;
    // the moment on the world's clock at which this visit begins: every walk, door, wave and shimmer starts from it
    const clock0 = FK.clock.range(0, 600);
    const rare = !!vary.rare;                                           // the painting spreads as we rise
    const greyAge = vr() < 1 / 3 || rare;                               // the age after colour was forbidden
    const sides = vr.pick([16, 20, 24]), spokes = vr.pick([8, 8, 6]);
    const field = vr.pick(['drill', 'drill', 'market', 'procession']);
    const fogK = vr.range(0.7, 1.4), rain = vr.pick([0, 0.55, 0.8, 1]);
    const hour = ['night', 'day', 'golden'].includes(vary.hour) ? vary.hour : vary.hour === 'dawn' ? 'golden' : vr.pick(['day', 'day', 'night', 'golden']);
    const H = { day: { crowd: 1, home: 0.35, rooms: 0.85, walls: 1 }, night: { crowd: 0.42, home: 1.9, rooms: 1.8, walls: 1.12 }, golden: { crowd: 0.85, home: 0.6, rooms: 1.15, walls: 1.4 } }[hour];
    const density = clamp(vary.density ?? 1, 0.7, 1.3);

    const U = makeShared();
    U.uFogP.value.set(0.008 * fogK, 0.25, 7, 1.1);
    U.uAge.value.set(greyAge ? 1 : 0, rare ? 800 : 1e5, 0, 0);
    U.uHour.value.set(H.rooms, H.walls, 0, 0);
    U.uRain.value.set(rain, vr.range(0, 50), 0, 0);
    if (hour === 'golden') { U.uGl.value[0].w = 1.5; U.uGlC.value[3].set('#F2B24E'); }
    const gl = U.uGl.value; gl[0].w *= 0.1; gl[1].w = 0.035; gl[2].w = 0.035; gl[3].w = 0.04;
    await ctx.yield();

    // ---- the path: north along the avenue a metre over the glass, the lift, over the top, down the Sphere's west side,
    // round its north-western shoulder and up the Sphere's own track to the hoop: we climb the way the ball came
    // (level for the first 95 m with points close enough that the curve cannot dip toward the bodies; over the top at
    // 142 m; down toward the ball swinging west, so that plane, ball and hoop stay in one frame; a pass along the
    // mirror's western flank some 35 m off; round the shoulder; then the last six knots are points of the track
    // itself, so the road lies on the track there. The road comes onto the track S_JOIN metres down it from the
    // hoop's middle: a ball's radius and a quarter up the track from the resting ball's skin (the quarter was fitted
    // to the 190 m the road had before: it is that number written in the ball's size, the room the road needs to come
    // round the shoulder); the other five knots divide the track from there to the hoop evenly)
    const pts = [[0, 1, 480], [0, 1, 455], [0, 1, 430], [0, 1, 405], [0, 1.3, 385], [0.3, 3.4, 365], [0.8, 7.6, 345], [2, 14.5, 320], [4, 28, 286], [6, 46, 250], [12, 92, 170], [16, 128, 90],
      [15, 142, 22], [5, 134, -38], [-27, 112, -90], [-66, 84, -134], [-100, 60, -178], [-104, 42, -228], [-98, 42, -272], [-80, 44, -310], [-52, 52, -345], [-22, 68, -372]];
    const onTrack = (s) => [HOOP.x + TRACK.x * s, HOOP.y + TRACK.y * s, HOOP.z + TRACK.z * s];      // a point s metres down the track from the hoop's middle
    const S_JOIN = TRACK_LEN - SPHERE_R - 1.25 * SPHERE_R;
    for (let i = 5; i >= 0; i--) pts.push(onTrack(S_JOIN * i / 5));
    const path = makePath(pts), L = path.length;
    // Places on our road, found on the path (metres of road from its start); every window below is told from these.
    const tp = new THREE.Vector3(), roadWhere = (test) => { for (let d = 0; d <= L; d += 0.5) { path.posAtDist(d, tp); if (test(tp)) return d; } return L; };
    const dLift = roadWhere((p) => p.y > pts[0][1] + 0.2);                                       // where the road first leaves the level of the plane
    const dHall = roadWhere((p) => p.z < HALL.z);                                                // over the middle of the hall (the road first north of it)
    const dRim = roadWhere((p) => Math.hypot(p.x - FIELD.x, p.z - FIELD.z) < FIELD.r);           // over the rim of the landing ground
    let dTop = 0; for (let d = 0, y = -1; d <= dRim; d += 0.5) { path.posAtDist(d, tp); if (tp.y > y) { y = tp.y; dTop = d; } }   // the top of our climb (the highest of the road short of that rim)
    // THE ONE PACING: the Sphere's visit is paced to the flight. The ball goes down its own track with the metres we
    // fly, without a hold: it starts from the hoop as we start, is on the glass as we come over the hall's middle (we
    // look up from the hall and it is there), half-way through as we cross the rim of the ground it lands on, and the
    // little sinking that is left lasts to the hoop. Everything else that happens follows from where things are.
    const fall = { leave: 0, touch: dHall, half: dRim, end: L };
    const zLift = path.posAtDist(dLift, new THREE.Vector3()).z, zTop = path.posAtDist(dTop, new THREE.Vector3()).z;
    const ballS = (u) => sphereS(clamp(u, 0, 1) * L, fall);

    // Clearance, on this seed's own layout: the eye's ground track in even steps of 2 m of road wherever the eye is
    // lower than 8 m (inside the mist). The plan leaves unwalked every loop of road that comes within a body's reach
    // of it. Nothing else in the plane stands higher than 0.5 m, and the road is never lower than its first metre.
    const lowTrack = []; let lx0 = 1e9, lx1 = -1e9, lz0 = 1e9, lz1 = -1e9;
    for (let d = 0; d <= L; d += 2) { path.posAtDist(d, tp); if (tp.y < 8) { lowTrack.push(tp.x, tp.z); lx0 = Math.min(lx0, tp.x); lx1 = Math.max(lx1, tp.x); lz0 = Math.min(lz0, tp.z); lz1 = Math.max(lz1, tp.z); } }
    const tooNear = (x, z, r) => {
      if (x < lx0 - r || x > lx1 + r || z < lz0 - r || z > lz1 + r) return false;
      for (let i = 0; i < lowTrack.length; i += 2) { const dx = lowTrack[i] - x, dz = lowTrack[i + 1] - z; if (dx * dx + dz * dz < r * r) return true; }
      return false;
    };
    await ctx.yield();

    const plan = await makePlan(ctx, { forks: FK, clock0, spokes, field, crowd: H.crowd * density * (0.55 + 0.45 * detail), home: H.home, squareNear: SQ_NEAR, tooNear });
    await ctx.yield();
    const people = await buildPeople(ctx, plan, U, { hallSides: sides, gates: spokes, wallColor: '#F2B24E', hallColor: '#F6C878', doors: FK.doors });
    await ctx.yield();
    const sway = [0, 1, 2, 3, 4].map(() => FK.sway.range(0, 6.2832));
    const hero = await buildHero(ctx, { shared: U, mapObjects: people.mapObjects, sway, standin: FK.standin });
    scene.add(people.group, hero.object);
    await ctx.yield();

    // ---- space and the glass
    const mat = (vs, fs, extra = {}, uni = {}) => new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms: { ...U, ...hero.uniforms, ...uni }, ...extra });
    const put = (m, order) => { m.frustumCulled = false; m.renderOrder = order; scene.add(m); return m; };
    const dome = put(new THREE.Mesh(new THREE.SphereGeometry(4300, 40, 20), mat(DOME_VS, DOME_FS, { side: THREE.BackSide, depthWrite: false, depthTest: false })), -10);
    const glowTex = new THREE.DataTexture(plan.glow, plan.glowN, plan.glowN, THREE.RGBAFormat, THREE.UnsignedByteType);
    glowTex.minFilter = glowTex.magFilter = THREE.LinearFilter; glowTex.generateMipmaps = false; glowTex.needsUpdate = true;
    U.uGlow.value = glowTex; U.uGlowR.value.set(plan.occ0, plan.occ0, 1 / plan.occSize, 1);
    const occTex = new THREE.DataTexture(plan.occ, plan.occN, plan.occN, THREE.RGFormat, THREE.UnsignedByteType);
    occTex.unpackAlignment = 1; occTex.minFilter = occTex.magFilter = THREE.LinearFilter; occTex.generateMipmaps = false; occTex.needsUpdate = true;
    const glass = put(new THREE.Mesh(new THREE.CircleGeometry(4700, 40).rotateX(-Math.PI / 2), mat(PLANE_VS, PLANE_FS, { depthWrite: false, depthTest: false }, { uOcc: { value: occTex }, uOccR: { value: new THREE.Vector4(plan.occ0, plan.occ0, plan.occSize, 0) } })), -9);
    glass.matrixAutoUpdate = false;
    await ctx.yield();

    // ---- weather and air
    const uFocus = { value: new THREE.Vector4(0, 380, 440, 0) }, uBox = { value: new THREE.Vector4(0, 20, 480, 90) };
    const dashes = put(new THREE.Mesh(seededQuads(Math.round(6000 * (0.5 + 0.5 * detail)), 3, FK.rain), mat(DASH_VS, DASH_FS, ADD, { uFocus })), 6);
    dashes.visible = rain > 0;
    const motes = put(new THREE.Mesh(seededQuads(Math.round(800 * detail), 4, FK.motes), mat(MOTE_VS, MOTE_FS, ADD, { uBox })), 8);
    await ctx.yield();

    // ---- the point country, the vermilion square, the streaks on the track
    const spot = (at, col, k, tall = 1) => put(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat(SPOT_VS, SPOT_FS, ADD, { uSpot: at, uSpotCol: col, uSpotK: { value: new THREE.Vector4(...k) }, uSpotV: { value: tall } })), 1);
    const uPointSpot = { value: new THREE.Vector4(POINT.x, POINT.y, POINT.z, 44) }, uPointCol = { value: new THREE.Vector4(0.93, 0.92, 0.98, 1.0) };
    const point = spot(uPointSpot, uPointCol, [60, 1.5, 5, 0.10]);                // a small sharp point with a faint breath round it
    // THE VERMILION SQUARE is one person of the country, at home in its house (beyond the west rim of the landing
    // ground) among its neighbours, its family round it. It never leaves the glass: we are the one who is lifted.
    // Like every body at home it moves a little about its place and turns a little, on the world's clock, from its
    // own dealt phase (the fifth of `sway`). Its true size: 6.5 m square, half a metre thick.
    const square = put(new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.5, 6.5), mat(SQUARE_VS, SQUARE_FS)), 0);
    const H0 = plan.sqHome;                                                        // its house: x, z
    const uSqSpot = { value: new THREE.Vector4(H0[0], 0.75, H0[1], 11) }, uSqCol = { value: new THREE.Vector4(1.0, 0.085, 0.03, 0.07) };
    const sqGlow = spot(uSqSpot, uSqCol, [8, 0.6, 3, 0.12]); sqGlow.renderOrder = 4;
    const squareAtHome = (now) => {
      const a = sway[4] + now * 0.2, q = square.position;
      q.set(H0[0] + 0.6 * Math.cos(a), 0.35, H0[1] + 0.6 * Math.sin(a * 0.73 + 1.3));
      square.rotation.y = 0.5 * Math.sin(now * 0.17 + sway[4]);
      U.uSq.value.set(q.x, q.y, q.z, 1); uSqSpot.value.set(q.x, q.y + 0.4, q.z, 11);
    };
    squareAtHome(clock0);
    // streaks drawn up the track through the rings: 90 of them, dealt from a stream of their own
    const streaks = put(new THREE.Mesh(seededQuads(90, 4, ctx.core.makeRng(ctx.core.hashSeed('trackmotes:' + ctx.seed))), mat(STREAK_VS, STREAK_FS, ADD, { uTrk0: { value: HOOP }, uTrkD: { value: TRACK }, uTrkL: { value: TRACK_LEN - SPHERE_R } })), 6);
    await ctx.yield();

    // One more place on the road, for the gaze. Where the road leaves the ball's flank: its nearest place to the
    // ball at rest (flankSkin: how far off the resting ball's surface it is there; from there on it draws away).
    const offTrack = (p) => { const x = p.x - HOOP.x, y = p.y - HOOP.y, z = p.z - HOOP.z, s = x * TRACK.x + y * TRACK.y + z * TRACK.z; return Math.hypot(x - TRACK.x * s, y - TRACK.y * s, z - TRACK.z * s); };
    let dFlank = dRim, flankSkin = 1e9; for (let d = dRim; d <= L; d += 0.5) { const r = path.posAtDist(d, tp).distanceTo(REST) - SPHERE_R; if (r < flankSkin) { flankSkin = r; dFlank = d; } }
    // The middle of the next ring ahead on the track, for an eye whose own station down the track is e (metres from
    // the hoop's middle, the eye's place dropped square onto the track's line). The rings are the hero's own
    // (hero.ringAt, dealt). So that the goal never jumps it slides: it is on a ring's middle as the eye's station
    // passes the ring before it, and goes evenly on to the middle of the ring after while the eye's station goes
    // on to that ring (below the lowest ring the station is counted from the track's foot; past the last, the goal
    // is the hoop's middle).
    const ringGoal = (e, out) => {
      const R = hero.ringAt; let j = -1; for (let i = 0; i < R.length; i++) if (R[i] < e) j = i;
      const sNext = j >= 0 ? R[j] : 0, sAfter = j >= 1 ? R[j - 1] : 0, sBehind = j + 1 < R.length ? R[j + 1] : TRACK_LEN;
      const sg = sNext + (sAfter - sNext) * clamp((sBehind - e) / Math.max(sBehind - sNext, 1), 0, 1);
      return out.set(HOOP.x + TRACK.x * sg, HOOP.y + TRACK.y * sg, HOOP.z + TRACK.z * sg);
    };

    // ---- the gaze: one point that slides from the hall, to the place where the Sphere meets the glass, past the
    // mirror's western flank, to the hoop. It is told by where we are in the country, not by the clock: by how far
    // short of the hall's middle we are, how far short of (or past) the ball's middle, how far from the hoop.
    // Between the place where the road leaves the ball's flank and the place where it comes onto the track, the same
    // one pull (the poi's weight, 0.72) is drawn onto the middle of the next ring ahead on the track: the rings then
    // stand one behind another toward the hoop, not across a corner. Both eases are measures of the place. In: past
    // its nearest place, as the eye's distance off the resting ball's surface grows from that least distance to twice
    // it. Out: as the eye's distance off the track's line falls from one ball's radius to a metre. (The two overlap,
    // the road closing on the track while it draws off the ball: the pull reaches about half and is never whole.)
    const gz = new THREE.Vector3(), g2 = new THREE.Vector3(), sp = new THREE.Vector3(), eye = new THREE.Vector3();
    const gaze = (time, u) => {
      spherePos(ballS(u), sp); path.pointAt(clamp(u, 0, 1), eye);
      const toHall = eye.z - HALL.z, toBall = eye.z - sp.z, toHoop = eye.distanceTo(HOOP);
      gz.set(HALL.x, 0, HALL.z - 30);
      g2.set(sp.x, Math.max(sp.y, 0) * 0.45 + 45 * (1 - sm(20, 110, sp.y)), sp.z + 20);    // between the ball and its circle; once it is in the glass, its shoulder
      gz.lerp(g2, 1 - sm(0, HALL.court, toHall));                             // from the hall to the ball, between the court's rim and the hall's middle
      g2.set(sp.x - 40, 40, sp.z - 60); gz.lerp(g2, 1 - sm(40, 115, toBall)); // past the mirror's western flank as we draw level with it
      g2.copy(HOOP); g2.y -= 110 * sm(60, 260, toHoop);                        // the hoop, the northern country still under it until the last 100 m
      gz.lerp(g2, 1 - sm(-1.2 * SPHERE_R, SPHERE_R / 4, toBall));             // from a quarter of the ball's radius south of its middle to clear of its northern skin (1.2 radii north); the two multipliers were fitted to the 20 m and 95 m this window had before
      const pull = clamp(u, 0, 1) * L < dFlank ? 0 : sm(flankSkin, 2 * flankSkin, eye.distanceTo(REST) - SPHERE_R) * sm(1, SPHERE_R, offTrack(eye));
      if (pull > 0) {
        // (the two goals are blended by their directions from the road's place, so the gaze turns evenly from one to the other)
        ringGoal((eye.x - HOOP.x) * TRACK.x + (eye.y - HOOP.y) * TRACK.y + (eye.z - HOOP.z) * TRACK.z, g2);
        gz.sub(eye); g2.sub(eye);
        const l0 = gz.length() || 1, l1 = g2.length() || 1, far = l0 + (l1 - l0) * pull;
        gz.divideScalar(l0); g2.divideScalar(l1);
        const ang = Math.acos(clamp(gz.dot(g2), -1, 1)), sn = Math.sin(ang);
        if (sn > 1e-4) gz.multiplyScalar(Math.sin((1 - pull) * ang) / sn).addScaledVector(g2, Math.sin(pull * ang) / sn); else gz.lerp(g2, pull);
        gz.normalize().multiplyScalar(far).add(eye);
      }
      return gz;
    };
    // pace: linger inside the plane and while the ball stands whole before us (only while it is ahead of us: not again
    // on the way out), hurry along the mirror's flank; told by our height, by how near the ball's skin we are and by
    // which side of it we are on (a pure function of u through the path)
    const pe = new THREE.Vector3(), ps = new THREE.Vector3();
    const pace = (u) => {
      path.pointAt(clamp(u, 0, 1), pe); spherePos(ballS(u), ps);
      const skin = pe.distanceTo(ps) - 80;
      return 0.55 + 0.45 * sm(1.2, 12, pe.y) - 0.25 * sm(70, 110, skin) * (1 - sm(250, 330, skin)) * sm(0, 60, pe.z - ps.z) + 0.35 * (1 - sm(45, 70, skin));
    };

    const camPos = new THREE.Vector3(), road = new THREE.Vector3(), size = new THREE.Vector2();
    return {
      scene, path, duration: DUR,
      ride: 'none', companion: 'none', style: 'none',
      variant: { age: greyAge ? 'grey' : 'colour', rare, sides, spokes, field, hour, rain, fog: fogK, shutLanes: plan.shutLanes },
      // linger at the edge-on opening and over the country, hurry the links
      pace,
      camera: { fov: 62, near: 0.2, nearThrough: 0.3, far: 5000, sway: 0.4, bank: 0.4 },
      pois: [{ at: gaze, from: 0, to: 1, weight: 0.72, fade: 70 / L }],        // the whole road; it comes in over the first 70 m
      portal: { shape: 'circle', radius: 7, color: '#EDEBFA', glow: 0.55, tilt: true, revealDistance: 420 },
      post: {
        exposure: 1,
        bloom: { strength: 0.48, radius: 0.55, threshold: 0.9 },
        grade: { saturation: 1.1, contrast: 1.08, tint: '#ffffff', shadowTint: '#070A1C', vignette: 0.35, grain: 0.02, aberration: 0 },
      },
      update(dt, time, camera, u) {
        // (the camera behind a portal has its world matrix set directly: read that, never position alone)
        camPos.setFromMatrixPosition(camera.matrixWorld);
        // seen through a portal from below the level of the glass, the glass is stood lower so the eye stays above it
        const lift = ctx.through ? Math.min(0, camPos.y - 0.9) : 0;
        const now = time + clock0;
        U.uLift.value = lift; U.uEye.value.set(camPos.x, camPos.y - lift, camPos.z); U.uTime.value = now;
        if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); if (size.y > 0) U.uPx.value = 0.5 * size.y * camera.projectionMatrix.elements[5]; }
        dome.position.copy(camPos);
        // Nothing here reads the lens. The rain's dashes wrap round a place on the glass ahead of the eye along the road
        // (further ahead the higher the eye is); the box of dust is round the eye's own place.
        const ey = U.uEye.value.y; path.tangentAt(clamp(u, 0, 1), road);
        const hl = Math.hypot(road.x, road.z) || 1e-3, reach = Math.min(190 + ey, 340);
        uFocus.value.x = camPos.x + road.x / hl * reach; uFocus.value.y = camPos.z + road.z / hl * reach;
        uBox.value.set(camPos.x, ey, camPos.z, 30);
        // the rare day: the painting's front runs north, from south of every house we can see (z 800) to north of the last
        // (z -1500), with our own northing between the place where we lift and the place where our climb tops out
        if (rare) { path.pointAt(clamp(u, 0, 1), tp); U.uAge.value.y = 800 - 2300 * sm(0, zLift - zTop, zLift - tp.z); }
        hero.setS(ballS(u), now);
        squareAtHome(now);
        const beat = Math.sin(now * 6.2832 / 7 + sway[3]); uPointSpot.value.w = 44 + 8 * beat; uPointCol.value.w = 0.85 + 0.3 * beat;      // a point that swells and sinks
        motes.visible = !ctx.through;
        if (ctx.renderer) hero.renderMap(ctx.renderer);
      },
      dispose() { hero.dispose(); },
    };
  },
};
