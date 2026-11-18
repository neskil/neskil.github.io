// The Glaze Stops at the Knees: hero set piece. After Tang three-colour (sancai) tomb figures, about 680-760.
// A Ferghana tomb horse 186 m tall (ears to 200) four-square on its slab: small tucked head, thick arched neck, hogged
// mane with knife cuts, docked tail, luted saddle on a green cloth with the one cobalt, breast strap and crupper with
// apricot-leaf pendants, rosettes and tassels. Glazed above a ragged line at 38 m, dead-matt pink clay below, slab included.
//
// SIZE / FRAME  Local units are metres on the hero. Origin = centre of the slab's underside, +Y up, head toward +Z.
//   Slab 84 (x) by 6 by 230 (z); body from z -97 (rump) to +82 (chest); legs at x +-18, z +60 (fore) and -68 (hind),
//   inner gap about 21 m; belly 78-90; back 150; saddle 158; crest 187; muzzle about y 100, z 128. radius 125, height 190.
//   The world places it with its +Z along the brief's d = (0.5, 0, 0.87) (rotation.y = atan2(0.5, 0.87)).
// COST  about 98k triangles, 4 draw calls (figure, shadow, runs, beads), 4 programs, no lights, no textures, build ~0.35 s
//   in steps under 40 ms (it awaits ctx.yield throughout). Expects around it: a flat bare-clay floor at y 0 (the shadow
//   is drawn 5 cm above it), the straw sky, nothing else; post exposure 1 (else set style.uGain.value = 0.6 / exposure),
//   bloom about 0.15.
// OPTS  palette (7 hex: clay, straw, amber, pooled amber, green, cobalt, slip), detail 0.6-1 (thins body runs),
//   kiln 'amber' | 'cream' | 'streaked' (else seeded), style (a makeGlazeStyle() object to share with the world),
//   q (mesh density, 1 hero, about 0.35 for a pony mould), runs (0-1 share of raised runs), slab [w, h, d], knee,
//   scale (uniform scale of the returned object; a pony is the same mould at scale 0.2 with slab [70, 7.5, 150]), cobalt, tint.
//   lite (a pony mould: coarser small pieces, cheap beads, coarser shadow and slab), pour (this figure's face takes the green pour:
//   the hero only; ponies keep their own firing). Beads are smooth teardrops on a thin neck, in two tiers on full figures (the
//   big ones finer). Added by the world: style.uShadeTint
//   (what a cast shadow does to clay, linear), a clock-driven pulse of thicker glass creeping down each lane, a swell on the runs.
// RETURNS  the contract, plus: style, material, kiln, shadow, setProgress(u) (the world calls it every frame with the
//   path's u; fronts, olive seams, bead swelling and the green pour over the face at u 0.56-0.66 are keyed to it; if it is
//   never called the piece loops u over 30 s for the viewer), instance(o) (another figure from the same mould: shared
//   geometry, own seed / kiln / pose; build time only).
// ANCHORS (local, unscaled)  glazeLineY 38; slabTop 6; slabSize; neckPivot; foreGate / hindGate (the points between the
//   leg pairs at y 30); legGapHalf (clear half-width, 10.5 m); flyUnder (safe line in under the muzzle, between the
//   forelegs, under the belly, out between the hind legs); chestBead (root of the 13 m bead: fly 20 m under it); chin
//   (root of the chin bead); muzzle; poll; crest; saddleTop; backLine (12 m over croup, saddle, mane and crest);
//   faceDive (down the face 12 m off, from the poll past the muzzle); rumpOrbit {center, radius}; tailTip; sun.
//   There is no portal seat: the exit portal belongs in the camel's vent.
// HOW THE STYLE IS MADE (exports; shade the whole world with these)
//   makeGlazeStyle(palette)   the shared uniforms: palette, sun, ambient tints, dust, uU (progress), uPour, uTime, uGain.
//   GLAZE_GLSL                fragment chunk: gzN1/gzN2 noise, gzToScene (exact colour: display-linear -> scene value,
//                             the inverse of exposure + ACES), gzLight (one low sun + rose shade + floor bounce as a
//                             tint), gzMatt (bare clay), gzGlass (glass colour + blurred sky/floor reflection + sun
//                             lobe in gzSpec), gzOut (dust paling, exact colour, highlight added in scene space).
//                             Floor, spatter, sky and dust should end with gzOut(col, dist, y).
//   GLAZE_POSE_GLSL           vertex chunk: gzPose(p, n, bend) = head toss about uPivot, breath, ear flick, tassel sway.
//   glazeFigureMaterial(style, o)   THE material: glazed where aDown is behind the lane's front and y is above the
//                             noisy knee line; amber with cream misses, green carried downhill from trappings, olive
//                             where both, cobalt dabs on the cloth, slip on ridges, dark pools in hollows and lips,
//                             a quiet half-metre crackle inside 68 m, bump-mapped lips; below the line matt speckled clay with knife facets.
//                             The run is the mark: every colour is laid in streak fields gzS(c, seed, len) in (lane, down); the
//                             octave is picked from aLw (log2 of the metres one lane unit spans, baked by partGeometry), so runs
//                             keep their 1 to 4 m width where lanes fan out over a dome and split instead of widening; where the
//                             lanes carry no width (legs, the hanging head) the fields fall back to vertical streaks in object space.
//                             Cream channel flags (aFlow.w below zero): -0.05 the saddle (amber), -0.12 a pendant or tassel (green,
//                             amber in the veins), under -0.35 a strap (green).
//   glazeShadowMaterial       the same mesh sheared flat along the sun in dusty rose (no shadow map).
//   loftPart / loftDisplace / bakeFlow / partGeometry   build any figure (the camel) as lofted rings and bake aFlow
//                             (aDown, aLane by steepest descent on the real surface, carried green, cream), aSurf
//                             (ridge, hollow, ao, part 0 body | 1 cloth | 2 always bare | 3 face) and aBend.
//   traceDown / runsGeometry / glazeRunMaterial   raised leading runs down the same flow lines, revealed by uU.
//   beadsMesh                 instanced hanging drops that swell with uU, sag and wobble, and never fall.
//   slabGeometry, buildHorseParts, HORSE, GLAZE_PALETTE.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeNoise, clamp, lerp, smoothstep } from '../kit/core.js';

export const GLAZE_PALETTE = ['#E7C9B0', '#F3E9CC', '#C9812A', '#7A4A1C', '#3F8F4E', '#1F4FA0', '#FBF6E6'];
const SUN_DIR = new THREE.Vector3(0.92, 0.24, 0.30).normalize();

// One set of uniforms shared by every material of the style (world coder: makeGlazeStyle once, pass it everywhere).
export function makeGlazeStyle(palette = GLAZE_PALETTE) {
  const c = (i) => new THREE.Color(palette[i] || GLAZE_PALETTE[i]);
  return {
    uTime: { value: 0 }, uU: { value: 0 }, uPour: { value: 0 },
    uSun: { value: SUN_DIR.clone() }, uSunCol: { value: new THREE.Color(1.0, 0.93, 0.8) },
    uSkyCol: { value: new THREE.Color(0.80, 0.76, 0.70) }, uFloorCol: { value: new THREE.Color(0.84, 0.70, 0.64) },
    uDustCol: { value: c(1).clone().lerp(c(0), 0.3) }, uDustK: { value: 0.00012 }, uDustL: { value: 0.0011 },   // uDustL: the dust that hangs in the lowest 40 m
    uClay: { value: c(0) }, uStraw: { value: c(1) }, uAmber: { value: c(2) }, uPool: { value: c(3) },
    uGreen: { value: c(4) }, uCobalt: { value: c(5) }, uSlip: { value: c(6) },
    uGain: { value: 0.6 },   // 0.6 / the world's post exposure
    uShadeTint: { value: new THREE.Color(0.417, 0.339, 0.433) },   // what a cast shadow does to clay on the floor (dusty rose); the world sets it by hour
    uSunK: { value: new THREE.Color(1.11, 1.226, 1.30) },         // clay turned full to the sun: the brightest matt thing in any frame
    uHazeSun: { value: c(6).clone().lerp(c(1), 0.4) }, uHazeRose: { value: new THREE.Color('#E9CEBD') }, uHazeD: { value: 1090 },   // the horizon's dust: straw toward the sun, rose away; a fifth of the way at 400 m, two thirds at 1,200 m
    uSkyZen: { value: new THREE.Color('#D9B3A2') },
    uVent: { value: new THREE.Vector4(0, 0, 0, 0) }, uVentR: { value: 120 },   // a kiln light inside a figure (the camel's vent): where, and how strong (0 = none); it warms whatever stands within its reach
  };
}

// GLSL shared by every material: noise, exact colour (inverse of the engine's tone map), light on matt clay, light on glass.
// Colours are composed in DISPLAY-linear space (so clay lands on the clay hex in full sun) and gzOut() converts the
// result to the scene value the engine's exposure + ACES will map back onto it; the sun's highlight is added after,
// in scene space, so the glass keeps a real highlight.
const TONE_INV = (() => {
  const inv = (e) => new THREE.Matrix3().fromArray(e).invert().elements.map((x) => x.toFixed(6)).join(',');
  return { inI: inv([0.59719, 0.076, 0.0284, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777]), outI: inv([1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602]) };
})();
export const GLAZE_GLSL = /* glsl */`
uniform float uU, uPour, uDustK, uDustL, uGain;
uniform vec3 uSun, uSunCol, uSkyCol, uFloorCol, uDustCol, uClay, uStraw, uAmber, uPool, uGreen, uCobalt, uSlip, uShadeTint, uSunK, uHazeSun, uHazeRose, uSkyZen;
uniform float uHazeD, uVentR; uniform vec4 uVent;
float gzSpec = 0.; vec3 gzVd = vec3(0., 0., 1.);   // gzVd: eye to point (each main sets it; the haze is straw toward the sun, rose away)
float gzH1(float n){ return fract(sin(n*127.1+3.7)*43758.5453); }
float gzH2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float gzN1(float x){ float i=floor(x), f=fract(x); f=f*f*(3.-2.*f); return mix(gzH1(i), gzH1(i+1.), f); }
float gzN2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(gzH2(i),gzH2(i+vec2(1,0)),f.x), mix(gzH2(i+vec2(0,1)),gzH2(i+vec2(1,1)),f.x), f.y); }
// a streak field about c metres wide, dl metres long, running downhill (the figure shader sets the globals)
float gzLane = 0., gzDown = 0., gzE0 = 1., gzE1 = 2., gzLf = 0., gzFb = 0., gzWx = 0.; vec3 gzO = vec3(0.);
float gzS(float c, float sd, float dl){
  float a = .5, b = .5, y = -gzO.y/dl;
  if (gzFb < .999) a = mix(gzN2(vec2(gzLane*gzE0/c + sd, gzDown/dl)), gzN2(vec2(gzLane*gzE1/c + sd + 7.3, gzDown/dl + 3.1)), gzLf);
  if (gzFb > .001) b = mix(gzN2(vec2(gzO.x/(c*1.4) + sd, y)), gzN2(vec2(gzO.z/(c*1.4) + sd + 5.1, y + 1.7)), gzWx);
  return mix(a, b, gzFb);
}
// display-linear colour -> scene value (uGain = 0.6 / the world's exposure)
vec3 gzToScene(vec3 D){
  vec3 y = clamp(mat3(${TONE_INV.outI})*clamp(D, 0., .95), .0004, .97);
  vec3 A = .983729*y - 1., B = .432951*y - .0245786, Cc = .238081*y + .000090537;
  vec3 v = (-B - sqrt(max(B*B - 4.*A*Cc, 0.)))/(2.*A);
  return max(mat3(${TONE_INV.inI})*v, 0.)*uGain;
}
// the one low side light and its bounce, as a tint. A level face takes the sun at a graze (the sine of its height), an
// upright face turned to it takes it whole: the same clay is a mid-tone floor, a bright leg and a rose shade side.
vec3 gzLight(vec3 N, float ao){
  float nl = clamp(dot(N, uSun), 0., 1.);
  float under = 1. - smoothstep(-.8, 0., N.y);
  vec3 amb = mix(uFloorCol*(1. + .2*under), uSkyCol, smoothstep(.05, .9, N.y))*(.7 + .3*ao);
  return amb + max(uSunK - amb, 0.)*nl*(.55 + .45*ao);
}
// the dust at the end of the floor, by bearing: sun-lit straw toward the sun, rose away from it
vec3 gzHaze(vec3 d){
  vec2 h = d.xz; float l = length(h); vec2 sx = normalize(uSun.xz + vec2(1e-5, 0.));
  float s = l > 1e-4 ? .5 + .5*dot(h/l, sx) : .5;
  return mix(uHazeRose, uHazeSun, smoothstep(.2, .95, s));
}
// dead-matt fired clay
vec3 gzMatt(vec3 alb, vec3 N, float ao){ return alb*gzLight(N, ao); }
// lead glass over slip: body colour, a blurred sky-above / floor-below reflection, one long soft sun highlight
vec3 gzGlass(vec3 alb, vec3 N, vec3 V, float ao){
  float nv = clamp(dot(N, V), 0., 1.), q1 = 1. - nv;
  float fr = .1 + .9*q1*q1*q1*q1*q1;
  vec3 R = reflect(-V, N);
  vec3 flo = uClay*gzLight(vec3(0., 1., 0.), 1.)*1.08;
  vec3 env = mix(flo, mix(uHazeSun, uSkyZen, smoothstep(.15, .9, R.y)), smoothstep(-.3, .3, R.y));
  float rl = max(dot(R, uSun), 0.);
  gzSpec = (pow(rl, 18.)*.17 + pow(rl, 80.)*1.15)*(.3 + .7*ao);   // one long soft highlight down the sunlit side; the colour round it stays
  vec3 dif = alb*gzLight(N, ao);
  return mix(dif, env, fr*.4*(.4 + .6*ao)) + uSlip*pow(rl, 7.)*.03;
}
// the style's distance rule, then exact colour, then the highlight. Two dusts: a thin layer in the lowest 40 m (the mean
// density along the ray from the eye's height to the point's), and the distance itself: a fifth of the way to the horizon's
// colour at 400 m, two thirds at 1,200 m, so a near figure is crisp and a far one is plainly far
vec3 gzOut(vec3 col, float dist, float y){
  float yc = max(cameraPosition.y, 0.), yp = max(y, 0.), dy = yp - yc;
  float a = exp(-yc/40.), b = exp(-yp/40.);
  float lay = abs(dy) > .5 ? 40.*(a - b)/dy : a;
  float a2 = exp(-yc/85.), b2 = exp(-yp/85.);
  float lay2 = abs(dy) > .5 ? 85.*(a2 - b2)/dy : a2;   // the haze thins with height too: looked down on from the air, the floor keeps its tone
  float t = max(dist, 0.)/max(uHazeD, 1.);
  float f = 1. - exp(-t*sqrt(t)*clamp(lay2, 0., 1.) - dist*(uDustK + uDustL*max(lay, 0.)));
  f = clamp(f, 0., 1.);
  { vec3 dv = cameraPosition + gzVd - uVent.xyz; float vl = uVent.w*exp(-dot(dv, dv)/max(uVentR*uVentR, 1.));   // the light in the vent: clay and glass near it glow straw
    col = mix(col*(1. + vl*vec3(.9, .58, .26)), uStraw, min(vl*.1, .6)); }
  return gzToScene(mix(col, gzHaze(gzVd), f)) + uSunCol*gzSpec*(1. - .8*f);
}
`;

// Vertex-side pose: every figure bends about a neck pivot (toss), breathes, flicks its ears. Shared by body, shadow, beads, runs.
export const GLAZE_POSE_GLSL = /* glsl */`
uniform vec4 uPose;    // x head toss (rad about the pivot's x axis), y head swing (rad about y), z breath 0..1, w ear flick
uniform vec3 uPivot;   // neck pivot, object space
uniform float uTime;
vec3 gzRotX(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(p.x, c*p.y-s*p.z, s*p.y+c*p.z); }
vec3 gzRotY(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x+s*p.z, p.y, -s*p.x+c*p.z); }
// bend.x neck weight 0..1, bend.y ear weight, bend.z breath weight
void gzPose(inout vec3 p, inout vec3 n, vec3 bend){
  float w = bend.x;
  vec3 q = p - uPivot;
  q = gzRotY(gzRotX(q, uPose.x*w), uPose.y*w*w); n = gzRotY(gzRotX(n, uPose.x*w), uPose.y*w*w);
  q.z -= max(bend.y, 0.)*uPose.w*3.;
  float sw = max(-bend.y, 0.); q.x += sw*.55*sin(uTime*.8 + p.z*.21 + p.x*.1); q.z += sw*.45*sin(uTime*.63 + p.x*.17);
  p = q + uPivot;
  p.x *= 1. + .012*uPose.z*bend.z; p.y += .25*uPose.z*bend.z;
}
`;

// ---- the figure material: ONE shader dresses every figure (glazed above its knee line, bare matt clay below) ----
const FIG_VERT = /* glsl */`
attribute vec4 aFlow;   // x aDown: metres downhill from the pour, y aLane: constant along a flow line, z green carried from uphill, w cream part (mane, blaze)
attribute vec4 aSurf;   // x ridge (glaze thins to slip), y hollow (it pools), z ao, w part: 0 body, 1 saddle cloth, 2 always bare, 3 face (takes the pour)
attribute vec3 aBend;   // neck, ear, breath weights
attribute float aLw;    // log2 of the metres one lane unit spans here (lanes fan out on domes: the runs split to keep their width)
attribute vec4 aMark; varying vec4 vMark;   // marks that stand on the mould (baked at build): x a pared arris of a leg (+1 / -1 on alternate edges), y a knife cut of the mane, z and w a tongue of the glaze line (how near its middle; how far below the knee it ends, m)
varying vec4 vFlow, vSurf; varying vec3 vN, vP, vO, vSunO; varying float vLw; uniform vec3 uSun;
${GLAZE_POSE_GLSL}
void main(){
  vec3 p = position, n = normal; gzPose(p, n, aBend);
  vSunO = normalize(uSun*mat3(modelMatrix) + vec3(0., 1e-6, 0.));   // the sun in the mould's own space (the same at every corner)
  vFlow = aFlow; vSurf = aSurf; vO = position; vLw = aLw;
  vMark = aMark;
  vec4 w = modelMatrix*vec4(p, 1.); vP = w.xyz; vN = mat3(modelMatrix)*n;
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
const FIG_FRAG = /* glsl */`
varying vec4 vFlow, vSurf; varying vec3 vN, vP, vO, vSunO; varying float vLw;
varying vec4 vMark;
uniform float uSeed, uKnee, uScale, uTime, uPourK; uniform vec3 uKiln; uniform vec2 uFront; uniform vec4 uLegs;
${GLAZE_GLSL}
void main(){
  vec3 toCam = cameraPosition - vP; float dist = length(toCam); vec3 V = toCam/max(dist, 1e-3); gzVd = -toCam;
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
  float down = vFlow.x, part = vSurf.w;
  float fan = clamp(fwidth(vFlow.y)/max(length(dFdx(vP)) + length(dFdy(vP)), 1e-5), 0., 1.); // lanes fan out on domes: calm the meander there
  float lane = vFlow.y + uSeed*37. + fan*(2.6*(gzN2(vec2(vFlow.y/8., down/15.) + uSeed) - .5) + .9*(gzN2(vec2(vFlow.y/2.5, down/5.)) - .5));
  float isCloth = step(.5, part)*step(part, 1.5), isBare = step(1.5, part)*step(part, 2.5), isFace = step(2.5, part);
  float lw = fwidth(lane);
  vec3 on = abs(cross(dFdx(vO), dFdy(vO)));
  float lgc = min(vLw, 3.), lgk = clamp(floor(lgc), -1., 3.);
  gzLf = smoothstep(.2, .8, lgc - lgk); gzE0 = exp2(lgk); gzE1 = gzE0*2.; gzLane = lane; gzDown = down; gzO = vO;
  gzFb = smoothstep(2.6, 3.8, vLw)*(1. - smoothstep(.45, .75, abs(N.y))); gzWx = smoothstep(.25, .75, on.x/(on.x + on.z + 1e-9));
  float px = mix(lw*exp2(lgc), (length(dFdx(vO)) + length(dFdy(vO)))*.7, gzFb);   // metres across the flow under one pixel
  float nW = gzN1(lane/11.), nM = gzN1(lane/3.1+7.), nF = gzN1(lane/1.05+19.);
  nF = mix(nF, .5, smoothstep(.35, 1.1, lw)); nM = mix(nM, .5, smoothstep(1.2, 3.5, lw));
  float finger = nM*nM*(.6+.8*nF);
  // where the glaze is: behind this lane's creeping front, and above the ragged knee line
  float front = uFront.x + uFront.y*nW + 34.*finger + uU*47.*mix(.5, 3., nM)*.8;
  float kf = gzS(1.7, 3.3, 1e4); front += 45.*(1. - smoothstep(58., 84., vO.y));
  float kneeY = uKnee + 3.2*(gzS(5., 31., 1e4)*2. - 1.) - 9.*kf*kf*kf - 4.*finger*finger;
  // a tongue of the line: at a fixed edge of a leg the glaze comes down a set distance below the knee in one fat rounded lip (a bead hangs from it)
  { float tq = clamp((1. - vMark.z)/.55, 0., 1.); kneeY = min(kneeY, uKnee + 3.5 - (vMark.w + 3.5)*sqrt(1. - tq*tq)*step(.001, vMark.z)); }
  float d = min(front - down, vO.y - kneeY) - isBare*1e4;
  float aa = fwidth(d) + 1e-4;
  float cover = smoothstep(-aa, aa, d);
  float lip = exp(-max(d, 0.)/1.7);
  float run = smoothstep(.5, .85, nF)*nM;
  // the one green pour over the face (uPour 0..1), with its own fat front
  float pq = uPour*uPourK;
  float pd = pq*96. - 8. - down - 13.*(1.-nM)*(1.-.6*pq) - 13.*clamp(vSurf.x, 0., 1.2)*(1. - .5*pq);
  float pmask = isFace*max(smoothstep(.1, .3, max(vFlow.w, 0.) + .34*(gzS(2.2, 5., 30.) - .5)), smoothstep(138., 147., vO.y));
  float pg = pmask*smoothstep(0., 1.5, pd)*step(1e-3, pq);
  float plip = pmask*exp(-abs(pd)/2.6)*step(1e-3, pq);
  // the wet glass still creeps: slow, thicker pulses travel down each lane (small cyclic life, on the clock)
  float lph = gzN1(lane/1.3 + 41.)*37. + gzN1(lane/.37 + 5.)*9.;
  float pz = down/(13.*uScale) - uTime*.5 + lph;
  float pulse = smoothstep(.42, .8, gzN1(pz))*(1. - smoothstep(.3, 1.1, fwidth(pz)))*(1. - smoothstep(.7, 2.2, lw))*(.4 + .6*nM)*smoothstep(.3, .6, N.y*.5 + .8);
  float h = cover*(.3 + 1.1*lip + .22*run + .9*plip + .3*pg + .4*pulse)*uScale;
  // THE RUN IS THE MARK. Streak noises in (lane, down): the octave is picked from the baked lane metric, so a run keeps its
  // width (about c metres) wherever lanes fan out over a dome and splits in two instead of widening into a blot.
  float sW = gzS(9., uSeed*3.1, 170.);                                      // where a colour was dabbed on: 9 m wide, running far
  float sM = mix(gzS(2.6, 7., 64.), .5, smoothstep(.9, 2.8, px));           // the runs: 2 to 4 m wide
  float sF = mix(gzS(.85, 19., 24.), .5, smoothstep(.3, .95, px));          // the threads between them
  float sP = mix(gzS(2.6, 33., 13.), .5, smoothstep(.9, 2.8, px));          // where a run slows
  float cream = max(vFlow.w, 0.), strapness = max(-vFlow.w, 0.);
  float isLeaf = step(.09, strapness)*step(strapness, .15);                 // a pendant or a tassel: its own green piece
  // amber over the body in runs, the misses left cream as tall narrow streaks
  float aN = .46*sW + .54*sM + .1*(sF - .5) + .22*(1. - smoothstep(64., 112., vO.y));
  float a = smoothstep(uKiln.x + .02, uKiln.x + .15, aN)*(1. - .92*cream);
  float tk = clamp((aN - uKiln.x - .04)*4.2, 0., 1.);                       // how thick the amber lies across its run: honey at the edge, amber in the body
  a = max(a, step(.5, uKiln.x)*cream*.9);
  a *= mix(1., smoothstep(.42, .58, sW), uKiln.y);
  a = max(a, step(.03, strapness)*step(strapness, .07)*.96);   // the luted saddle: amber, its seat pooled
  a = max(a, (1. - cream)*step(uKiln.x, .5)*smoothstep(.88, .97, N.y)*.95);   // where it was poured on, along the top, nothing misses
  // green carried downhill from cloth, straps and pendants in fingers; thrown splashes, combed by the runs
  float gT = .47 - .14*uU;
  float gv = vFlow.z*(.3 + 1.5*sM*(.6 + .5*sF)) + isCloth*.25 - gT;
  gv = max(gv, mix(-1., (gzS(6., 50., 140.) - .68)*.5, uKiln.y*(1. - cream)));
  gv = max(gv, (strapness - .42)*(.7 + .3*sM)*2.);
  float bl = gzN2(vO.zy/vec2(21., 27.) + vO.x/19. + uSeed*1.7) + .34*(sM - .5) + .16*(sF - .5);
  gv = max(gv, mix(-1., (bl - .79)*.9, (1. - cream)*(1. - isFace)));
  gv = max(gv, mix(-1., .2, isLeaf));
  float g = smoothstep(0., .06, gv);
  float over = isCloth*smoothstep(.6, .7, sM*.5 + sW*.5); g *= 1. - .9*over; a = max(a, over);   // amber from the saddle runs on across the cloth
  float seam = smoothstep(-.07, -.005, gv)*(1. - smoothstep(.05, .15, gv))*(1. - isLeaf)*(1. - isCloth);   // amber overruns green: an olive seam
  // resist spots that stayed cream: small, round, in dapples (never wider than they are tall)
  float dap = smoothstep(.5, .7, gzN2(vO.zy/vec2(34., 30.) + vO.x/25. + uSeed*2.3));
  float resist = smoothstep(.8, .85, gzS(1.5, uSeed + 11., 3.2))*(1. - smoothstep(.45, 1.2, px))*(1. - isCloth)*(1. - isLeaf)*(.25 + .75*dap)*smoothstep(-.7, .2, vLw);
  a *= 1. - .92*resist; g *= 1. - .92*resist; seam *= 1. - resist;
  g = max(g, pg);
  // thickness: thin amber is honey over the slip, thick amber deepens, slow stretches and hollows pool brown
  float slow = smoothstep(.56, .8, sP)*smoothstep(.4, .65, sM);
  float pool = clamp(vSurf.y*1.25 + lip*.6 + run*.35 + pulse*.85 + slow*.75, 0., 1.);
  float thick = smoothstep(.22, .62, sM*.7 + sF*.3);
  vec3 amb = mix(mix(uStraw, uAmber, .7), uAmber, max(thick*.6, smoothstep(.08, .6, tk)));
  amb = mix(amb, uPool, clamp(pool*.95 + .34*smoothstep(.55, .9, sM) + .5*smoothstep(.6, 1., tk)*sF, 0., 1.));
  vec3 col = mix(uStraw, amb, clamp(a, 0., 1.));
  col = mix(col, col*vec3(.95, .87, .7), pulse*.7*(1. - a));   // thicker clear glass is strawier
  vec3 olive = sqrt(uAmber*uGreen)*.86;
  vec3 gc = mix(mix(uGreen, uStraw, .2*(1. - thick)), uGreen*.55, pool*.7);
  col = mix(col, gc, g);
  col = mix(col, mix(olive, olive*.7, pool), seam*smoothstep(.2, .6, a)*.9);
  float dab = isCloth*uKiln.z*smoothstep(.75, .79, gzN2(vO.xz/5.6 + uSeed*5.) + .1*(sM - .5))*(1. - over);   // fat dabs, some 3 m across
  col = mix(col, uCobalt, dab*.93);
  float mo = gzN2(vO.zy/vec2(3.1, 5.3) + vO.x/3.7 + uSeed); mo = mix(mo, .5, smoothstep(.5, 1.8, px)); col *= .92 + .16*mo;   // the glass is mottled, never one flat tone
  float thin = clamp(vSurf.x*1.15 - .12, 0., 1.)*(1. - pool*.6);
  col = mix(col, mix(uSlip, uAmber, isLeaf*.85), thin*.8);   // slip on ridges, seams and strap edges; on a pendant the veins take amber
  // the knife's marks under the glass. A leg pared in six flat sides: along each arris between two of them (the edges marked +1) the
  // glass thins toward slip, a line 0.6 m wide (in the mould's metres, measured on the surface). A knife cut of the mane: its bottom pooled dark, 0.8 m wide, its edges slip (baked ridge)
  vec3 mox = dFdx(vO), moy = dFdy(vO); float mmx = dFdx(vMark.x), mmy = dFdy(vMark.x);
  float mg11 = dot(mox, mox), mg12 = dot(mox, moy), mg22 = dot(moy, moy);
  float mgr = sqrt(max((mg22*mmx*mmx - 2.*mg12*mmx*mmy + mg11*mmy*mmy)/max(mg11*mg22 - mg12*mg12, 1e-12), 1e-10));   // how fast the mark changes, per metre of surface
  float mpx = sqrt(max(mg11, mg22)), arris = (1. - smoothstep(.3 - mpx, .3 + mpx, (1. - vMark.x)/mgr))*(1. - smoothstep(.45, 1.3, mpx));
  col = mix(col, uSlip, arris*.3*(1. - pool*.6));
  col = mix(col, mix(uPool, uAmber, .2)*.9, smoothstep(.25, .45, vMark.y)*.92);
  // crazing: a quiet crackle about half a metre across, only near, never the loudest thing
  vec2 cz = (on.y > max(on.x, on.z) ? vO.xz : (on.x > on.z ? vO.zy : vO.xy))*uScale/.5; float cw = fwidth(cz.x) + fwidth(cz.y);
  float craze = 0.;
  if (dist < 70.) {
    vec2 ci = floor(cz), cf = fract(cz); float f1 = 9., f2 = 9.;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j)); vec2 r = o + vec2(gzH2(ci+o), gzH2(ci+o+17.3)) - cf; float dd = dot(r, r);
      if (dd < f1) { f2 = f1; f1 = dd; } else if (dd < f2) f2 = dd;
    }
    float e = sqrt(max(f2, 0.)) - sqrt(max(f1, 0.));
    craze = (1.-smoothstep(0., cw*1.2 + .02, e))*(1.-smoothstep(40., 68., dist))*(1.-smoothstep(.16, .42, cw))*(.35 + .65*gzN2(cz/7. + 3.));
  }
  col *= 1. - .085*craze*cover;
  // crazing at the nearest: inside 30 m of the eye (the design's own distance) the glass shows its wider net as well, cells a metre
  // across (the top of the design's 0.3 to 1 m: twice the quiet crackle's size) at twice its value (0.17 for 0.085), a line as fine;
  // full inside 18 m, gone at 30. One rule for every figure; still never the loudest thing
  if (dist < 30.) {
    vec2 cy = cz*.5 + 11.3; float cv = cw*.5;
    vec2 ci = floor(cy), cf = fract(cy); float f1 = 9., f2 = 9.;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j)); vec2 r = o + vec2(gzH2(ci+o+3.1), gzH2(ci+o+29.7)) - cf; float dd = dot(r, r);
      if (dd < f1) { f2 = f1; f1 = dd; } else if (dd < f2) f2 = dd;
    }
    float e = sqrt(max(f2, 0.)) - sqrt(max(f1, 0.));
    col *= 1. - .17*cover*(1.-smoothstep(0., cv*1.2 + .02, e))*(1.-smoothstep(18., 30., dist))*(1.-smoothstep(.2, .5, cv));
  }
  // relief of the wet glass: fat lips and raised runs bend the normal
  vec3 dpx = dFdx(vP), dpy = dFdy(vP); float hx = dFdx(h), hy = dFdy(h);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
  vec3 Nb = normalize(abs(det)*N - sign(det)*(hx*r1 + hy*r2)*1.6 + N*1e-7);
  float ao = vSurf.z;
  vec3 glass = gzGlass(col, Nb, V, ao);
  // bare clay: dead matt, knife facets, speckle
  vec3 fc = cross(dpx, dpy); vec3 Nf = fc/max(length(fc), 1e-9); if (dot(Nf, N) < 0.) Nf = -Nf;
  vec3 pk = vO*1.7; float skw = fwidth(pk.x) + fwidth(pk.y) + fwidth(pk.z);
  float sp = gzN2(pk.xy*2.3 + pk.z*1.9)*.5 + gzN2(pk.zx*5.1 + pk.y*4.3)*.5; sp = mix(sp, .5, smoothstep(.2, .7, skw));
  float mott = gzN2(vO.xz/23. + vO.y/31.);
  float grit = gzN2(vO.xy*.9 + vO.z*.7); grit = mix(grit, .5, smoothstep(.5, 1.6, skw));
  vec3 calb = uClay*(.9 + .14*mott)*(1. - .22*smoothstep(.7, .78, sp))*(.94 + .12*grit) + vec3(.035, .0, -.015)*(mott-.5);
  calb = mix(calb, mix(uClay, uSlip, .75), arris*.8);   // bare clay pared by the knife: each arris a pale line between two flat sides
  vec3 clay = gzMatt(calb, normalize(mix(N, Nf, .8)), ao);
  clay = mix(clay, calb*uShadeTint*1.06, .55*(1. - isBare)*smoothstep(11.6, 12.1, vO.y)*(1. - smoothstep(12.5, 13.1, vO.y)));   // the pared hoof: the knife's ledge round its top, in its own rose shade
  // each leg throws its shadow along the slab it stands on (the floor's shadows are the sheared moulds, below the slab's top)
  if (vO.y < 9.5 && N.y > .6) {
    vec2 sh = vSunO.xz; float sl = max(length(sh), 1e-4); sh /= sl; float tanE = vSunO.y/sl, lsh = 0.;
    vec2 r; float t, dp, sf;
    r = vec2(-uLegs.x, uLegs.y) - vO.xz; t = dot(r, sh); dp = abs(r.x*sh.y - r.y*sh.x); sf = .5 + .035*max(t, 0.);
    lsh = max(lsh, smoothstep(-2., 2., t)*step(t*tanE, 70.)*(1. - smoothstep(uLegs.w - sf, uLegs.w + sf, dp)));
    r = vec2(uLegs.x, uLegs.y) - vO.xz; t = dot(r, sh); dp = abs(r.x*sh.y - r.y*sh.x); sf = .5 + .035*max(t, 0.);
    lsh = max(lsh, smoothstep(-2., 2., t)*step(t*tanE, 70.)*(1. - smoothstep(uLegs.w - sf, uLegs.w + sf, dp)));
    r = vec2(-uLegs.x, uLegs.z) - vO.xz; t = dot(r, sh); dp = abs(r.x*sh.y - r.y*sh.x); sf = .5 + .035*max(t, 0.);
    lsh = max(lsh, smoothstep(-2., 2., t)*step(t*tanE, 70.)*(1. - smoothstep(uLegs.w - sf, uLegs.w + sf, dp)));
    r = vec2(uLegs.x, uLegs.z) - vO.xz; t = dot(r, sh); dp = abs(r.x*sh.y - r.y*sh.x); sf = .5 + .035*max(t, 0.);
    lsh = max(lsh, smoothstep(-2., 2., t)*step(t*tanE, 70.)*(1. - smoothstep(uLegs.w - sf, uLegs.w + sf, dp)));
    clay = mix(clay, calb*uShadeTint*1.06, lsh);
  }
  gzSpec *= cover;
  gl_FragColor = vec4(gzOut(mix(clay, glass, cover), dist, vP.y), 1.);
}`;

// Material factory for a figure. style = makeGlazeStyle(); per-figure: seed, knee (object-space y of the glaze line),
// scale (the mesh's world scale), kiln 'amber' | 'cream' | 'streaked', cobalt (dabs on the cloth: the horse only),
// pivot (neck pivot), tint (optional {uAmber,uPool} override, e.g. cobalt for the rare blue pony).
export function glazeFigureMaterial(style, o = {}) {
  const kiln = o.kiln === 'cream' ? [0.74, 0, 0] : o.kiln === 'streaked' ? [0.2, 1, 0] : [0.26, 0, 0];
  const m = new THREE.ShaderMaterial({
    vertexShader: FIG_VERT, fragmentShader: FIG_FRAG, side: THREE.DoubleSide,
    uniforms: { ...style, ...(o.tint || {}),
      uSeed: { value: o.seed ?? 0 }, uKnee: { value: o.knee ?? 38 }, uScale: { value: o.scale ?? 1 },
      uKiln: { value: new THREE.Vector3(kiln[0], kiln[1], o.cobalt ? 1 : 0) }, uFront: { value: new THREE.Vector2(o.front0 ?? 76, o.frontVar ?? 50) },
      uPourK: { value: o.pour ? 1 : 0 }, uLegs: { value: new THREE.Vector4(...(o.legs || [18, 60, -68, 7.5])) },
      uPose: { value: new THREE.Vector4(0, 0, 0, 0) }, uPivot: { value: (o.pivot || new THREE.Vector3(0, 120, 70)).clone() } },
  });
  return m;
}

// The rose shadow: the same mould drawn again, sheared flat along the sun 5 cm above the floor, with the same bends.
export function glazeShadowMaterial(style, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...style, uPose: o.pose || { value: new THREE.Vector4() }, uPivot: o.pivot || { value: new THREE.Vector3(0, 120, 70) }, uFloorY: { value: o.floorY ?? 0 } },
    vertexShader: /* glsl */`attribute vec3 aBend; uniform float uFloorY; uniform vec3 uSun; varying vec3 vP;
${GLAZE_POSE_GLSL}
void main(){ vec3 p = position, n = normal; gzPose(p, n, aBend); vec4 w = modelMatrix*vec4(p, 1.);
  float hgt = max(w.y - uFloorY, 0.); w.xz -= uSun.xz/max(uSun.y, .05)*hgt; w.y = uFloorY + .05; vP = w.xyz;
  gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`varying vec3 vP;
${GLAZE_GLSL}
void main(){ gzVd = vP - cameraPosition;
  vec3 c = uClay*uShadeTint*(.95 + .1*(gzN2(vP.xz/61.)*.6 + gzN2(vP.xz/17. + 9.)*.4));
  gl_FragColor = vec4(gzOut(c, length(gzVd), 0.), 1.); }`,
    side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
}

// ---- lofted mould parts and the flow bake ----
// loftPart(spec): rings swept along a path. spec = { nS, nT, at(s) -> {p:[x,y,z], rx, ry}, up:[x,y,z] frame hint,
//   shape(s, th) radius multiplier, disp(s, th, x, y, z) metres along the normal, seam (centre-seam ridge height, m),
//   part, cream(s, th), green(s, th), ridge(s, th), hollow(s, th), bend(x, y, z) -> [neck, ear, breath], laneOff, down0, facet }
// Returns a baked part { n, nS, nT, P, N, flow, surf, bend, idx, ... } ; bakeFlow traces every vertex's steepest descent
// on the real surface so that aDown / aLane follow true downhill (runs part round bumps and never go uphill).
export function loftPart(spec, defer = false) {
  const nS = spec.nS, nT = spec.nT, W = nT + 1, n = (nS + 1) * W;
  const P = new Float32Array(n * 3), plen = new Float32Array(nS + 1), rad = new Float32Array(nS + 1);
  const up = new THREE.Vector3().fromArray(spec.up || [0, 1, 0]), T = new THREE.Vector3(), R = new THREE.Vector3(), U = new THREE.Vector3();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i <= nS; i++) {
    const s = i / nS, e = 0.5 / nS, q = spec.at(s);
    a.fromArray(spec.at(Math.max(0, s - e)).p); b.fromArray(spec.at(Math.min(1, s + e)).p); c.fromArray(q.p);
    T.subVectors(b, a); const tl = T.length(); if (tl > 1e-6) T.multiplyScalar(1 / tl); else T.set(0, 0, 1);
    R.crossVectors(up, T); if (R.lengthSq() < 1e-8) R.set(1, 0, 0); R.normalize(); U.crossVectors(T, R);
    plen[i] = i ? plen[i - 1] + tl * (i === 1 || i === nS ? 1.5 : 1) : 0; rad[i] = (q.rx + q.ry) * 0.5;
    for (let j = 0; j <= nT; j++) {
      const th = (j % nT) / nT * Math.PI * 2, m = spec.shape ? spec.shape(s, th) : 1, o = (i * W + j) * 3;
      const cx = Math.cos(th) * q.rx * m, cy = Math.sin(th) * q.ry * m;
      P[o] = c.x + R.x * cx + U.x * cy; P[o + 1] = c.y + R.y * cx + U.y * cy; P[o + 2] = c.z + R.z * cx + U.z * cy;
    }
  }
  const part = { spec, nS, nT, W, n, P, plen, rad, N: new Float32Array(n * 3), flow: new Float32Array(n * 4), surf: new Float32Array(n * 4), bend: new Float32Array(n * 3) };
  loftNormals(part);
  if (!defer) loftDisplace(part);
  return part;
}
// second half of loftPart (displacement along the normal, centre seam); separate so a big part can yield between
// i0..i1: rings to displace in this call (a big part yields between chunks); finish = recompute the normals (last call)
export function loftDisplace(part, i0 = 0, i1 = Infinity, finish = true) {
  const { spec, nS, nT, W, P } = part;
  if (spec.disp || spec.seam) {
    const N = part.N;
    for (let i = i0; i <= Math.min(nS, i1 - 1); i++) for (let j = 0; j <= nT; j++) {
      const o = (i * W + j) * 3, s = i / nS, th = (j % nT) / nT * Math.PI * 2;
      let h = spec.disp ? spec.disp(s, th, P[o], P[o + 1], P[o + 2]) : 0;
      if (spec.seam) h += spec.seam * Math.exp(-(P[o] * P[o]) / 1.1);
      P[o] += N[o] * h; P[o + 1] += N[o + 1] * h; P[o + 2] += N[o + 2] * h;
    }
    if (finish) loftNormals(part);
  }
  return part;
}
function loftNormals(part) {
  const { nS, nT, W, P, N } = part;
  for (let i = 0; i <= nS; i++) for (let j = 0; j <= nT; j++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(nS, i + 1), jm = (j % nT + nT - 1) % nT, jp = (j % nT + 1) % nT;
    const A = (i1 * W + j) * 3, B = (i0 * W + j) * 3, C = (i * W + jp) * 3, D = (i * W + jm) * 3, o = (i * W + j) * 3;
    const sx = P[A] - P[B], sy = P[A + 1] - P[B + 1], sz = P[A + 2] - P[B + 2], tx = P[C] - P[D], ty = P[C + 1] - P[D + 1], tz = P[C + 2] - P[D + 2];
    let nx = ty * sz - tz * sy, ny = tz * sx - tx * sz, nz = tx * sy - ty * sx; const l = Math.hypot(nx, ny, nz) || 1;
    N[o] = nx / l; N[o + 1] = ny / l; N[o + 2] = nz / l;
  }
}
// Steepest-descent bake on a loft grid. Highest vertices first; each takes lane / down / carried green from the
// point uphill of it (interpolated between the two grid neighbours its uphill direction passes between).
// phase 0 = everything; 1 = the flow trace only, optionally just the vertices q0..q1 of the height order (so a big part can
// yield between chunks); 2 = the surface terms only.
export function bakeFlow(part, phase = 0, q0 = 0, q1 = Infinity) {
  const { spec, nS, nT, W, n, P, N, flow, surf, bend, plen, rad } = part;
  let order = part._order, k = 0;
  if (phase !== 2 && !order) { order = part._order = new Uint32Array((nS + 1) * nT); for (let i = 0; i <= nS; i++) for (let j = 0; j < nT; j++) order[k++] = i * W + j; order.sort((x, y) => P[y * 3 + 1] - P[x * 3 + 1]); part._done = new Uint8Array(n); }
  const done = part._done || new Uint8Array(n), laneOff = spec.laneOff || 0, down0 = spec.down0 || 0, qEnd = phase === 2 ? 0 : Math.min(q1, order.length);
  const NB = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const at = (i, j) => i * W + ((j % nT) + nT) % nT;
  for (let q = q0; q < qEnd; q++) {
    const v = order[q], i = (v / W) | 0, j = v % W, o = v * 3, s = i / nS, th = j / nT * Math.PI * 2;
    const own = spec.green ? spec.green(s, th) : 0;
    const A = at(Math.min(nS, i + 1), j) * 3, B = at(Math.max(0, i - 1), j) * 3, C = at(i, j + 1) * 3, D = at(i, j - 1) * 3;
    const fs = (i > 0 && i < nS) ? 0.5 : 1;
    const sx = (P[A] - P[B]) * fs, sy = (P[A + 1] - P[B + 1]) * fs, sz = (P[A + 2] - P[B + 2]) * fs;
    const tx = (P[C] - P[D]) * 0.5, ty = (P[C + 1] - P[D + 1]) * 0.5, tz = (P[C + 2] - P[D + 2]) * 0.5;
    const g11 = sx * sx + sy * sy + sz * sz + 1e-9, g12 = sx * tx + sy * ty + sz * tz, g22 = tx * tx + ty * ty + tz * tz + 1e-9;
    const det = g11 * g22 - g12 * g12 + 1e-12; let ds = (g22 * sy - g12 * ty) / det, dt = (g11 * ty - g12 * sy) / det;
    const slope2 = sy * ds + ty * dt;
    let lane = 0, down = 0, green = 0, ok = false;
    if (!(slope2 < 0.03 && N[o + 1] > 0)) {
      const m = Math.max(Math.abs(ds), Math.abs(dt)) || 1; ds /= m; dt /= m;
      const ang = Math.atan2(dt, ds), f = ((ang / (Math.PI / 4)) % 8 + 8) % 8, k0 = Math.floor(f) % 8, k1 = (k0 + 1) % 8, w = f - Math.floor(f);
      const va = cellAt(i + NB[k0][0], j + NB[k0][1]), vb = cellAt(i + NB[k1][0], j + NB[k1][1]);
      let pa = va >= 0 && done[va] ? va : -1, pb = vb >= 0 && done[vb] ? vb : -1, wb = w;
      if (pa < 0 && pb < 0) { // any finished higher neighbour
        let best = -1, by = P[o + 1];
        for (let e = 0; e < 8; e++) { const u = cellAt(i + NB[e][0], j + NB[e][1]); if (u >= 0 && done[u] && P[u * 3 + 1] > by) { by = P[u * 3 + 1]; best = u; } }
        pa = pb = best;
      } else if (pa < 0) { pa = pb; } else if (pb < 0) { pb = pa; }
      if (pa >= 0) {
        if (Math.abs(flow[pa * 4 + 1] - flow[pb * 4 + 1]) > 6) { if (wb > 0.5) pa = pb; else pb = pa; }
        const x = lerp(P[pa * 3], P[pb * 3], wb) - P[o], y = lerp(P[pa * 3 + 1], P[pb * 3 + 1], wb) - P[o + 1], z = lerp(P[pa * 3 + 2], P[pb * 3 + 2], wb) - P[o + 2];
        const dl = Math.hypot(x, y, z);
        lane = lerp(flow[pa * 4 + 1], flow[pb * 4 + 1], wb); down = lerp(flow[pa * 4], flow[pb * 4], wb) + dl;
        green = lerp(flow[pa * 4 + 2], flow[pb * 4 + 2], wb) * Math.exp(-dl / (spec.carry || 70)); ok = true;
      }
    }
    if (!ok) { // a pour point: the top of the part
      const steep = slope2 > 0.25 ? 1 : 0;
      lane = laneOff + plen[i] + steep * (j / nT) * Math.PI * 2 * rad[i]; down = down0;
    }
    const f4 = v * 4; flow[f4] = down; flow[f4 + 1] = lane; flow[f4 + 2] = Math.max(own, green); flow[f4 + 3] = spec.cream ? spec.cream(s, th) : 0;
    done[v] = 1;
  }
  function cellAt(i, j) { return (i < 0 || i > nS) ? -1 : at(i, j); }
  // surface terms: ridge / hollow from curvature, ao from facing and height, part code, bend weights; copy the seam column
  for (let i = (phase === 2 ? q0 : 0); phase !== 1 && i <= (phase === 2 ? Math.min(nS, q1 - 1) : nS); i++) for (let j = 0; j <= nT; j++) {   // phase 2: q0..q1 are rings
    const v = i * W + j, o = v * 3, s = i / nS, th = (j % nT) / nT * Math.PI * 2;
    if (j === nT) { const u = i * W; for (let e = 0; e < 4; e++) flow[v * 4 + e] = flow[u * 4 + e]; }
    const A = at(Math.min(nS, i + 1), j) * 3, B = at(Math.max(0, i - 1), j) * 3, C = at(i, j + 1) * 3, D = at(i, j - 1) * 3;
    const mx = (P[A] + P[B] + P[C] + P[D]) / 4 - P[o], my = (P[A + 1] + P[B + 1] + P[C + 1] + P[D + 1]) / 4 - P[o + 1], mz = (P[A + 2] + P[B + 2] + P[C + 2] + P[D + 2]) / 4 - P[o + 2];
    const el = Math.hypot(P[A] - P[B], P[A + 1] - P[B + 1], P[A + 2] - P[B + 2]) + Math.hypot(P[C] - P[D], P[C + 1] - P[D + 1], P[C + 2] - P[D + 2]) + 1e-6;
    const cv = (mx * N[o] + my * N[o + 1] + mz * N[o + 2]) / el * 14 * Math.min(1, 8 / el);   // a coarse mould (a pony) is no more curved than the fine one
    surf[v * 4] = clamp(-cv, 0, 1) * 0.8 * (spec.curvK ?? 1) + (spec.ridge ? spec.ridge(s, th, P[o], P[o + 1], P[o + 2]) : 0) + (spec.seam ? Math.exp(-(P[o] * P[o]) / 1.6) * 0.9 : 0);
    surf[v * 4 + 1] = clamp(cv, 0, 1) + (spec.hollow ? spec.hollow(s, th, P[o], P[o + 1], P[o + 2]) : 0);
    surf[v * 4 + 2] = clamp(0.78 + 0.22 * N[o + 1] - (spec.hollow ? 0.5 * spec.hollow(s, th, P[o], P[o + 1], P[o + 2]) : 0) - clamp(cv, 0, 1) * 0.4, 0.3, 1);
    surf[v * 4 + 3] = spec.part || 0;
    if (spec.bend) { const w = spec.bend(P[o], P[o + 1], P[o + 2], s, th); bend[o] = w[0]; bend[o + 1] = w[1]; bend[o + 2] = w[2]; }
  }
  return part;
}
// part -> BufferGeometry (grid triangles; rings of zero radius at the ends close the form)
export function partGeometry(part, metric = true) {   // metric false: a shadow mould (the lane metric is left at zero)
  const { nS, nT, W, P, N, flow, surf, bend } = part, idx = [];
  for (let i = 0; i < nS; i++) for (let j = 0; j < nT; j++) { const a = i * W + j, b = a + 1, c = a + W, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  g.setAttribute('aFlow', new THREE.BufferAttribute(flow, 4)); g.setAttribute('aSurf', new THREE.BufferAttribute(surf, 4));
  g.setAttribute('aBend', new THREE.BufferAttribute(bend, 3)); g.setAttribute('aLw', new THREE.BufferAttribute(metric === false ? new Float32Array(part.n) : laneMetric(part), 1)); g.setIndex(idx);
  return g;
}
// log2 of the metres one lane unit spans at each vertex (from the baked lanes and the real surface), smoothed: the figure
// shader picks its streak octave from it, so runs keep their width where lanes fan out and split instead of widening
function laneMetric(part) {
  const { nS, nT, W, n, P, flow } = part, a = new Float32Array(n), b = new Float32Array(n);
  const at = (i, j) => i * W + ((j % nT) + nT) % nT;
  for (let i = 0; i <= nS; i++) for (let j = 0; j <= nT; j++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(nS, i + 1), A = at(i1, j), B = at(i0, j), C = at(i, j + 1), D = at(i, j - 1);
    const sx = P[A * 3] - P[B * 3], sy = P[A * 3 + 1] - P[B * 3 + 1], sz = P[A * 3 + 2] - P[B * 3 + 2], tx = P[C * 3] - P[D * 3], ty = P[C * 3 + 1] - P[D * 3 + 1], tz = P[C * 3 + 2] - P[D * 3 + 2];
    const ls = flow[A * 4 + 1] - flow[B * 4 + 1], lt = flow[C * 4 + 1] - flow[D * 4 + 1];
    const g11 = sx * sx + sy * sy + sz * sz + 1e-6, g12 = sx * tx + sy * ty + sz * tz, g22 = tx * tx + ty * ty + tz * tz + 1e-6, det = g11 * g22 - g12 * g12 + 1e-9;
    const gr = Math.sqrt(Math.max((g22 * ls * ls - 2 * g12 * ls * lt + g11 * lt * lt) / det, 1e-8));   // lane units per metre
    a[i * W + j] = clamp(-Math.log2(gr), -1, 6);
  }
  for (let pass = 0; pass < 3; pass++) {
    const src = pass % 2 ? b : a, dst = pass % 2 ? a : b;
    for (let i = 0; i <= nS; i++) for (let j = 0; j <= nT; j++) {
      const i0 = Math.max(0, i - 1), i1 = Math.min(nS, i + 1);
      dst[i * W + j] = (src[at(i, j)] * 2 + src[at(i0, j)] + src[at(i1, j)] + src[at(i, j + 1)] + src[at(i, j - 1)]) / 6;
    }
  }
  return b;
}

// ---- the horse mould (object space: slab base centre at the origin, head toward +Z, 186 units tall = metres on the hero) ----
const bez = (a, b, c, d, t) => { const u = 1 - t; return [0, 1, 2].map((k) => u * u * u * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t * t * t * d[k]); };
const gauss = (x, w) => Math.exp(-(x * x) / (w * w));
const capR = (s, a, b) => { const x = Math.min(s / a, (1 - s) / b); return x >= 1 ? 1 : Math.sqrt(Math.max(0, 1 - (1 - x) * (1 - x))); };
const angd = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
export const HORSE = { knee: 38, slab: [84, 6, 230], pivot: [0, 126, 60], chestZ: 82, rumpZ: -97, legX: 18, foreZ: 60, hindZ: -68, back: 150 };

// THE MARKS OF THE KNIFE AND THE LINE on a figure's legs (the horse's mould and the camel's): places on the mould, set once at build,
// none drawn by chance. The mould's twelve edges round a leg carry aMark.x +1 / -1 in turn: the six at +1 are the arrises between its
// six pared sides (the shader draws the line from the distance to them); on three edges of each
// leg, four edges apart, the glaze line comes down in a tongue (aMark.z 1 on that edge, aMark.w its depth below the knee in the
// mould's metres on it and on the edge either side). Returns the tongues' ends, for the beads that hang from them.
const markHash = (n) => { const x = Math.sin(n * 91.7 + 2.3) * 4375.85; return x - Math.floor(x); };
export function markLegs(legs, knee) {
  const ends = [];
  legs.forEach((leg, k) => {
    const { nS, nT, W, n, P, N } = leg, m = leg.mark = new Float32Array(n * 4);
    for (let i = 0; i <= nS; i++) for (let j = 0; j <= nT; j++) m[(i * W + j) * 4] = (j % nT) % 2 ? -1 : 1;
    for (let t = 0; t < 3; t++) {
      const jc = (1 + 3 * k + 4 * t) % nT, T = (4.5 + 5 * markHash(k * 3 + t)) * knee / 38, yE = knee - T;
      for (let i = 0; i <= nS; i++) for (const dj of [-1, 0, 1]) for (const jj of [((jc + dj) % nT + nT) % nT]) for (const j of (jj === 0 ? [0, nT] : [jj])) { const o = (i * W + j) * 4; m[o + 3] = T; if (dj === 0) m[o + 2] = 1; }
      for (let i = 0; i < nS; i++) { const a = (i * W + jc) * 3, b = a + W * 3; if ((P[a + 1] - yE) * (P[b + 1] - yE) <= 0 && P[a + 1] !== P[b + 1]) { const f = (yE - P[a + 1]) / (P[b + 1] - P[a + 1]);
        ends.push({ p: [P[a] + (P[b] - P[a]) * f + N[a] * 0.25, yE + 0.35, P[a + 2] + (P[b + 2] - P[a + 2]) * f + N[a + 2] * 0.25], T, k, t }); break; } }
    }
  });
  return ends;
}
// the marks of a merged figure: the parts' own (part.mark, 4 per vertex) in the order they were merged, nothing on the rest
export function markAttr(geo, parts) {
  const a = new Float32Array(geo.attributes.position.count * 4); let o = 0;
  for (const p of parts) { if (p.mark) a.set(p.mark, o * 4); o += p.n; }
  geo.setAttribute('aMark', new THREE.BufferAttribute(a, 4));
  return geo;
}

// buildHorseParts(rng, q, yieldFn): the loft specs of one horse, baked. q scales the mesh density (1 hero, 0.3 shadow / far pony).
// Returns { parts: [...], v: the seed's proportions, sample(bodyS, th) } ; parts are in horse units.
export async function buildHorseParts(rng, q = 1, yieldFn = null, v = null, bake = true) {
  const BK = bake ? bakeFlow : (p) => p;
  v = v || { arch: rng.range(-1, 1), rump: rng.range(0.96, 1.06), tuck: rng.range(-1, 1), neckT: rng.range(0.94, 1.08), clothLen: rng.range(0.9, 1.15), tail: rng.range(0.85, 1.2), nPend: rng.int(7, 9), nCrup: rng.int(4, 5), earSplay: rng.range(0.7, 1.3) };
  const Y = async () => { if (yieldFn) await yieldFn(); };
  await Y();
  const NS = (x) => Math.max(8, Math.round(x * q)), NT = (x) => Math.max(8, Math.round(x * (0.5 + 0.5 * q) / 2) * 2);
  const parts = [];
  // body: rump (s 0) to chest (s 1). th = PI/2 is the back, 3PI/2 the belly.
  const zOf = (s) => lerp(HORSE.rumpZ, HORSE.chestZ, s);
  const clothA = 0.50 - 0.115 * v.clothLen, clothB = 0.50 + 0.125 * v.clothLen, clothTh = 1.02; // cloth hangs to 1.02 rad either side of the back
  const inCloth = (s, th) => smoothstep(clothA - 0.012, clothA + 0.004, s) * (1 - smoothstep(clothB - 0.004, clothB + 0.012, s)) * (1 - smoothstep(clothTh - 0.03, clothTh + 0.03, Math.abs(angd(th, Math.PI / 2)) + 0.05 * Math.sin(s * 90)));
  // straps: breast strap (round the chest at shoulder height), crupper (round the rump), girth
  const strap = (s, th, x, y, z) => {
    const breast = gauss(y - 120, 2.3) * smoothstep(clothB - 0.01, clothB + 0.01, s);
    const crup = gauss(y - 128, 2.3) * (1 - smoothstep(clothA - 0.01, clothA + 0.01, s));
    const girth = gauss((s - (clothB - 0.045)) * 179, 2.0) * smoothstep(clothTh - 0.05, clothTh + 0.05, Math.abs(angd(th, Math.PI / 2)));
    return Math.max(breast, crup, girth);
  };
  const body = loftPart({
    nS: NS(132), nT: NT(72), up: [0, 1, 0], seam: 0.6, carry: 42, laneOff: 0,
    at: (s) => {
      const c = capR(s, 0.2, 0.17);
      const top = HORSE.back + 3.5 * gauss(s - 0.16, 0.16) * v.rump - 4.5 * gauss(s - 0.52, 0.2) + 3.5 * gauss(s - 0.84, 0.1);
      const bot = 78 + 13 * (1 - smoothstep(0.1, 0.6, s)) - 2.5 * gauss(s - 0.78, 0.15);
      const ry = (top - bot) / 2 * (0.25 + 0.75 * c), cy = lerp((top + bot) / 2 + (s < 0.5 ? 5 : 2) * (1 - c), (top + bot) / 2, c);
      const rx = (30 + 6.5 * gauss(s - 0.2, 0.2) * v.rump + 2.5 * gauss(s - 0.82, 0.14) - 3 * gauss(s - 0.52, 0.16)) * c * (1 - 0.2 * smoothstep(0.9, 1, s));
      return { p: [0, cy, zOf(s)], rx, ry };
    },
    // egg section: broad above, narrower keel below; haunch and shoulder muscle swell where the legs join
    shape: (s, th) => 1 + 0.07 * Math.sin(th) + 0.09 * gauss(s - 0.13, 0.12) * Math.pow(Math.abs(Math.cos(th)), 1.5) * (Math.sin(th) < 0.3 ? 1 : 0.4)
      + 0.06 * gauss(s - 0.86, 0.09) * Math.pow(Math.abs(Math.cos(th)), 1.5) - 0.05 * gauss(s - 0.5, 0.25) * Math.max(0, -Math.sin(th)) * Math.abs(Math.cos(th)),
    disp: (s, th, x, y, z) => 1.3 * inCloth(s, th) + 1.5 * strap(s, th, x, y, z) * (1 - inCloth(s, th))
      + 4.2 * Math.exp(-((Math.abs(x) - 30) ** 2 + (y - 124) ** 2 + (z + 64) ** 2) / 500) + 3.2 * Math.exp(-((Math.abs(x) - 28) ** 2 + (y - 116) ** 2 + (z - 56) ** 2) / 330)
      - 1.6 * Math.exp(-((y - 104) ** 2 + (z + 30) ** 2) / 260) * smoothstep(10, 24, Math.abs(x)),
    part: 0, green: (s, th) => 0, cream: (s, th) => 0,
    bend: (x, y, z, s) => [0, 0, smoothstep(0.3, 0.6, s) * (1 - smoothstep(0.9, 1, s)) * smoothstep(150, 100, y)],
  }, true);
  await Y(); for (let a = 0; a <= body.nS; a += 4) { loftDisplace(body, a, a + 4, a + 4 > body.nS); await Y(); }
  const cSt = new Float32Array(body.n), cCl = new Float32Array(body.n);
  for (let i = 0; i <= body.nS; i++) { if (i % 8 === 7) await Y(); for (let j = 0; j <= body.nT; j++) { const o = i * body.W + j, s = i / body.nS, th = (j % body.nT) / body.nT * Math.PI * 2; cCl[o] = inCloth(s, th); cSt[o] = strap(s, th, body.P[o * 3], body.P[o * 3 + 1], body.P[o * 3 + 2]); } }
  const vi = (s, th) => Math.round(s * body.nS) * body.W + Math.round(th / (Math.PI * 2) * body.nT);
  // green is seeded from cloth and straps; the cloth is part 1 (cobalt dabs allowed there)
  body.spec.green = (s, th) => { const o = vi(s, th); return Math.max(cCl[o], cSt[o] > 0.45 ? 0.62 : 0); };
  body.spec.cream = (s, th) => { const o = vi(s, th); return -Math.min(1, 1.3 * cSt[o]) * (1 - cCl[o]); };
  body.spec.ridge = (s, th) => { const o = vi(s, th), c = cCl[o], st = cSt[o]; return 3.2 * c * (1 - c) + (st > 0.2 && st < 0.5 ? 0.7 : 0); };
  body.spec.hollow = (s, th, x, y, z) => 0.55 * gauss(y - 92, 14) * (gauss(z - HORSE.foreZ, 16) + gauss(z - HORSE.hindZ, 18)) * smoothstep(8, 14, Math.abs(x)) + 0.5 * gauss(s - 0.52, 0.1) * gauss(angd(th, Math.PI / 2), 0.5);
  await Y(); for (let a = 0; a < body.n; a += 150) { BK(body, 1, a, a + 150); await Y(); }
  for (let a = 0; a <= body.nS; a += 5) { BK(body, 2, a, a + 5); await Y(); }
  for (let i = 0; i < body.n; i++) { // cloth -> part 1
    if (i % 1500 === 1499) await Y();
    const s = ((i / body.W) | 0) / body.nS, th = ((i % body.W) % body.nT) / body.nT * Math.PI * 2; if (inCloth(s, th) > 0.5) body.surf[i * 4 + 3] = 1;
  }
  parts.push(body); await Y();
  // neck: thick, arched; crest 186; the poll hangs over and the head tucks in
  const nk = [[0, 122, 54], [0, 184 + 3 * v.arch, 56], [0, 202 * v.neckT - 4, 110 + 3 * v.arch], [0, 151, 123 + 2 * v.tuck]];
  const neckAt = (s) => { const p = bez(nk[0], nk[1], nk[2], nk[3], s); const c = capR(s, 0.01, 0.12); return { p, rx: lerp(35, 11.5, Math.pow(s, 0.7)) * (0.5 + 0.5 * c), ry: lerp(24, 9.5, Math.pow(s, 0.8)) * (0.6 + 0.4 * c) }; };
  const neckW = (y, z) => smoothstep(0.0, 1.0, clamp(((z - 58) * 0.5 + (y - 128) * 0.8) / 40, 0, 1));
  const neck = loftPart({
    nS: NS(64), nT: NT(44), up: [1, 0, 0], seam: 0.6, at: neckAt, laneOff: 300, carry: 70,
    shape: (s, th) => 1 - 0.1 * Math.abs(Math.sin(th)) * (1 - s), // flatter sides
    cream: (s, th) => gauss(angd(th, Math.PI * 1.5), 0.3) * 0.0,
    bend: (x, y, z) => [neckW(y, z), 0, 0],
  });
  await Y(); if (bake) { for (let a = 0; a < neck.n; a += 250) { bakeFlow(neck, 1, a, a + 250); await Y(); } await Y(); bakeFlow(neck, 2); }
  parts.push(neck); await Y();
  // head: 46 long, hanging near vertical. th = PI/2 is the face (toward +Z), 3PI/2 the jaw. Part 3: it takes the pour.
  const hp0 = [0, 153, 121 + 2 * v.tuck], hp1 = [0, 101, 125 + 3 * v.tuck];
  // moulded features, in metres on the face: d = distance from a feature's centre (along the head, round the head)
  const HF = (s, th, s0, a0) => Math.hypot((s - s0) * 52, angd(th, Math.PI / 2 + a0) * 8.5);
  const eyeD = (s, th) => Math.min(Math.hypot((s - 0.3) * 52 / 1.7, angd(th, Math.PI / 2 + 1.0) * 8.5), Math.hypot((s - 0.3) * 52 / 1.7, angd(th, Math.PI / 2 - 1.0) * 8.5)); // almond: 1.7 long to 1 high
  const nostD = (s, th) => Math.min(HF(s, th, 0.895, 0.62), HF(s, th, 0.895, -0.62));
  const mouthD = (s, th) => Math.abs((s - 0.945) * 52 + 2.2 * Math.max(0, Math.sin(th))) ;
  const head = loftPart({
    nS: NS(72), nT: NT(56), up: [0, 0, 1], seam: 0.95, laneOff: 500, part: 3, carry: 60,
    at: (s) => {
      const c = capR(s, 0.16, 0.1);
      const rx = (8.4 + 1.4 * gauss(s - 0.3, 0.16) - 2.9 * smoothstep(0.3, 0.72, s) + 1.2 * gauss(s - 0.9, 0.1)) * c;
      const ry = (9.0 + 2.4 * gauss(s - 0.34, 0.2) - 3.4 * smoothstep(0.4, 0.8, s) + 1.0 * gauss(s - 0.9, 0.1)) * c;
      return { p: [0, lerp(hp0[1], hp1[1], s), lerp(hp0[2], hp1[2], s) - 5 * gauss(s - 0.34, 0.25) + 1.5 * gauss(s - 0.75, 0.2)], rx, ry };
    },
    shape: (s, th) => 1 + 0.2 * gauss(s - 0.36, 0.2) * Math.max(0, -Math.sin(th)) - 0.12 * Math.max(0, Math.sin(th)) * Math.abs(Math.cos(th)) * 2 * gauss(s - 0.55, 0.3),
    disp: (s, th) => {
      const e = eyeD(s, th), n = nostD(s, th), af = Math.abs(angd(th, Math.PI / 2)), aj = Math.abs(angd(th, Math.PI * 1.5));
      const eye = 3.0 * gauss(e, 1.6) - 1.6 * gauss(e - 3.1, 1.2);                    // an almond bump in a pared socket
      const brow = 2.1 * gauss((s - 0.215) * 52, 2.2) * gauss(af - 0.95, 0.45);
      const nost = 1.7 * gauss(n - 1.5, 0.9) - 1.5 * gauss(n, 0.9);                   // a rolled rim round a thumbed hole
      const mouth = -1.2 * gauss(mouthD(s, th), 0.8) * smoothstep(0.5, 1.1, af);       // the cut of the lips, round the sides
      const jaw = 2.7 * gauss((s - 0.4) * 52, 6.5) * gauss(aj - 1.05, 0.42) - 1.3 * gauss((s - 0.62) * 52, 5) * gauss(aj - 1.3, 0.3); // the round cheek plate, the hollow below it
      const nasal = 1.0 * gauss(af, 0.42) * smoothstep(0.3, 0.45, s) * (1 - smoothstep(0.78, 0.9, s));
      const fore = 2.3 * (1 - smoothstep(0.1, 0.25, s)) * gauss(af - 0.5, 0.3) * (0.75 + 0.25 * Math.sin(s * 150)); // forelock parted round a notch, knife-cut
      return eye + brow + nost + mouth + jaw + nasal + fore;
    },
    cream: (s, th) => gauss(angd(th, Math.PI / 2), 0.55) * smoothstep(0.1, 0.3, s),
    // glass thins to slip on the lids, the nostril rims and the cheek's edge; it pools dark in the socket, the nostril and the mouth
    ridge: (s, th) => 0.55 * gauss(eyeD(s, th) - 1.2, 0.5) + 0.5 * gauss(nostD(s, th) - 1.6, 0.5),
    hollow: (s, th) => 0.85 * gauss(eyeD(s, th) - 2.9, 0.8) + 0.9 * gauss(nostD(s, th), 0.9) + 0.8 * gauss(mouthD(s, th), 0.7) * smoothstep(0.5, 1.1, Math.abs(angd(th, Math.PI / 2))),
    bend: () => [1, 0, 0],
  }, true);
  await Y(); for (let a = 0; a <= head.nS; a += 6) { loftDisplace(head, a, a + 6, a + 6 > head.nS); await Y(); }
  if (bake) { for (let a = 0; a < head.n; a += 200) { bakeFlow(head, 1, a, a + 200); await Y(); } for (let a = 0; a <= head.nS; a += 12) { bakeFlow(head, 2, a, a + 12); await Y(); } }
  parts.push(head); await Y();
  // ears: two pared leaves at the poll
  for (const sd of [-1, 1]) {
    const nq = neckAt(0.93), e0 = [sd * 5.2, nq.p[1] + nq.rx * 0.55, nq.p[2] + 3], e1 = [sd * (7 + 2.5 * v.earSplay), e0[1] + 21, e0[2] + 9];
    const ear = loftPart({ nS: NS(12), nT: 8, up: [0, 0, 1], laneOff: 560 + sd * 20, part: 3,
      at: (s) => ({ p: [lerp(e0[0], e1[0], s), lerp(e0[1], e1[1], s), lerp(e0[2], e1[2], s) + 2 * Math.sin(s * 3)], rx: 4.4 * Math.sin(Math.PI * Math.pow(Math.min(s + 0.12, 1), 0.7)) + 0.05, ry: 2.3 * (1 - s) + 0.05 }),
      shape: (s, th) => 1 - 0.55 * Math.max(0, Math.sin(th)) * Math.sin(Math.PI * s),
      bend: (x, y) => [1, smoothstep(e0[1], e0[1] + 18, y) * (sd > 0 ? 1 : 0.6), 0] });
    BK(ear); parts.push(ear); await Y();
  }
  // legs: slender, straight, pared by the knife (few flat sides); bare below the knee line. Hoof on the slab at y 6.
  const mkLeg = (x, z, hind, id) => {
    const fac = Array.from({ length: 12 }, () => rng.range(0.93, 1.05));
    const leg = loftPart({
      nS: NS(46), nT: hind === 2 ? 8 : 12, up: [0, 0, 1], curvK: 0.35, laneOff: 700 + id * 90, down0: 20 + id * 3, carry: 60,
      at: (s) => {
        const y = lerp(112, 6, s), k = hind ? 50 : 46; // knee / hock height
        const r = 6.1 + 8 * Math.pow(smoothstep(56, 114, y), 2) + 2.2 * gauss(y - k, 5) + 1.3 * gauss(y - 20, 3.2) - 0.9 * gauss(y - 14.5, 2.5) + 2.3 * (1 - smoothstep(6, 12.5, y));
        const zz = z + (hind ? -7 * gauss(y - 54, 16) + 5 * smoothstep(60, 110, y) : 1.5 * gauss(y - k, 7));
        const cx = Math.min(1, s / 0.07), cl = 0.25 + 0.75 * Math.sqrt(1 - (1 - cx) * (1 - cx)); return { p: [x * (1 - 0.3 * smoothstep(62, 112, y)), y, zz], rx: r * cl, ry: r * cl * (hind ? 1.12 : 1) * (1 + (hind ? 0.5 : 0.3) * smoothstep(62, 112, y)) };
      },
      shape: (s, th) => fac[Math.round(th / (Math.PI * 2) * 12) % 12] * (1 + 0.035 * Math.sin(s * 23 + th * 3)),
      hollow: (s, th, px, py) => 0.35 * gauss(py - 16.5, 2.2) + 0.5 * smoothstep(88, 104, py),
    });
    BK(leg); return leg;
  };
  const LX = HORSE.legX;
  parts.push(mkLeg(-LX, HORSE.foreZ, 0, 0)); await Y(); parts.push(mkLeg(LX, HORSE.foreZ, 0, 1)); await Y();
  parts.push(mkLeg(-LX - 1, HORSE.hindZ, 1, 2)); await Y(); parts.push(mkLeg(LX + 1, HORSE.hindZ, 1, 3)); await Y();
  const legEnds = markLegs(parts.slice(5, 9), HORSE.knee); parts.legEnds = legEnds;   // the pared arrises and the line's tongues (no draw of the seed)
  return { parts, v, body, neck, head, neckAt, nk, neckW, NS, NT, inCloth, strap, zOf, hp0, hp1, clothA, clothB, clothTh };
}

// ---- leading runs (raised ribbons down real flow lines) and hanging beads ----
// traceDown: walk a loft's surface downhill from grid coords (fi, fj) in steps of `step` metres.
export function traceDown(part, fi, fj, step, nSteps, minY, wob = 0, ph = 0) {
  const { nS, nT, W, P, N } = part, out = [];
  const smp = (A, i, j, k) => A[(i * W + ((j % nT) + nT) % nT) * 3 + k];
  for (let n = 0; n <= nSteps; n++) {
    const i0 = clamp(Math.floor(fi), 0, nS - 1), a = clamp(fi - i0, 0, 1), j0 = Math.floor(fj), b = fj - j0, p = [0, 0, 0], nn = [0, 0, 0];
    for (let k = 0; k < 3; k++) {
      p[k] = lerp(lerp(smp(P, i0, j0, k), smp(P, i0 + 1, j0, k), a), lerp(smp(P, i0, j0 + 1, k), smp(P, i0 + 1, j0 + 1, k), a), b);
      nn[k] = lerp(lerp(smp(N, i0, j0, k), smp(N, i0 + 1, j0, k), a), lerp(smp(N, i0, j0 + 1, k), smp(N, i0 + 1, j0 + 1, k), a), b);
    }
    const nl = Math.hypot(nn[0], nn[1], nn[2]) || 1; nn[0] /= nl; nn[1] /= nl; nn[2] /= nl;
    out.push({ p, n: nn });
    const sx = smp(P, i0 + 1, j0, 0) - smp(P, i0, j0, 0), sy = smp(P, i0 + 1, j0, 1) - smp(P, i0, j0, 1), sz = smp(P, i0 + 1, j0, 2) - smp(P, i0, j0, 2);
    const tx = smp(P, i0, j0 + 1, 0) - smp(P, i0, j0, 0), ty = smp(P, i0, j0 + 1, 1) - smp(P, i0, j0, 1), tz = smp(P, i0, j0 + 1, 2) - smp(P, i0, j0, 2);
    const g11 = sx * sx + sy * sy + sz * sz + 1e-9, g12 = sx * tx + sy * ty + sz * tz, g22 = tx * tx + ty * ty + tz * tz + 1e-9, det = g11 * g22 - g12 * g12 + 1e-12;
    const ds = -(g22 * sy - g12 * ty) / det, dt = -(g11 * ty - g12 * sy) / det, wl = Math.hypot(sx * ds + tx * dt, sy * ds + ty * dt, sz * ds + tz * dt);
    if (wl < 0.12 || p[1] < minY || fi <= 0.02 || fi >= nS - 0.02) break; // the bottom: it stops and hangs
    const wb = wob * Math.sin(ph + n * 0.33) * step / wl, ka = Math.sqrt(g22 / g11);
    fi += ds * step / wl - dt * ka * wb; fj += dt * step / wl + ds / ka * wb;
  }
  return out;
}
// runsGeometry(list): list of { pts: [{p, n}], w half-width m, col 0 amber | 1 green | 2 straw, h 0..1 (how early it arrives), bend [neck, ear, breath] }
export function runsGeometry(list) {
  let nv = 0, ni = 0; for (const r of list) { nv += r.pts.length * 4; ni += (r.pts.length - 1) * 18; }
  const P = new Float32Array(nv * 3), Nn = new Float32Array(nv * 3), S = new Float32Array(nv * 3), R = new Float32Array(nv * 4), C = new Float32Array(nv * 3), B = new Float32Array(nv * 3), I = new Uint32Array(ni);
  let v = 0, ii = 0; const cr = [-1, -0.4, 0.4, 1];
  for (const r of list) {
    const m = r.pts.length; let t = 0, L = 0; for (let k = 1; k < m; k++) L += Math.hypot(r.pts[k].p[0] - r.pts[k - 1].p[0], r.pts[k].p[1] - r.pts[k - 1].p[1], r.pts[k].p[2] - r.pts[k - 1].p[2]);
    for (let k = 0; k < m; k++) {
      const a = r.pts[Math.max(0, k - 1)].p, b = r.pts[Math.min(m - 1, k + 1)].p, q = r.pts[k];
      if (k) t += Math.hypot(q.p[0] - r.pts[k - 1].p[0], q.p[1] - r.pts[k - 1].p[1], q.p[2] - r.pts[k - 1].p[2]);
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; let sx = ty * q.n[2] - tz * q.n[1], sy = tz * q.n[0] - tx * q.n[2], sz = tx * q.n[1] - ty * q.n[0]; const sl = Math.hypot(sx, sy, sz) || 1;
      for (let c = 0; c < 4; c++, v++) {
        P.set(q.p, v * 3); Nn.set(q.n, v * 3); S[v * 3] = sx / sl; S[v * 3 + 1] = sy / sl; S[v * 3 + 2] = sz / sl;
        R[v * 4] = t; R[v * 4 + 1] = L; R[v * 4 + 2] = r.h; R[v * 4 + 3] = cr[c]; C[v * 3] = r.col; C[v * 3 + 1] = r.w * (0.8 + 0.2 * Math.sin(t * 0.7 + r.h * 40)); C[v * 3 + 2] = r.seed || 0; B.set(q.bend || r.bend || [0, 0, 0], v * 3);
        if (k < m - 1 && c < 3) { const o = v; I[ii++] = o; I[ii++] = o + 4; I[ii++] = o + 1; I[ii++] = o + 1; I[ii++] = o + 4; I[ii++] = o + 5; }
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(Nn, 3)); g.setAttribute('aSide', new THREE.BufferAttribute(S, 3));
  g.setAttribute('aRib', new THREE.BufferAttribute(R, 4)); g.setAttribute('aCol', new THREE.BufferAttribute(C, 3)); g.setAttribute('aBend', new THREE.BufferAttribute(B, 3));
  g.setIndex(new THREE.BufferAttribute(I.subarray(0, ii), 1));
  return g;
}
const RUN_REACH = 'clamp(.3 + .25*H + uU*(1.1 + 1.6*H), 0., 1.)';
const RUN_FRAG = /* glsl */`varying vec3 vN, vP; varying float vCol, vAo;
${GLAZE_GLSL}
void main(){ vec3 toCam = cameraPosition - vP; float dist = length(toCam); vec3 V = toCam/max(dist, 1e-3); gzVd = -toCam;
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (dot(N, V) < 0.) N = -N;
  vec3 col = vCol < .5 ? mix(uAmber, uPool, .5) : (vCol < 1.5 ? mix(uGreen, uGreen*.55, .45) : mix(uStraw, uAmber, .7));
  gl_FragColor = vec4(gzOut(gzGlass(col, N, V, vAo), dist, vP.y), 1.); }`;
// the raised runs: revealed by arc length against u, fat at the head
export function glazeRunMaterial(style, o = {}) {
  return new THREE.ShaderMaterial({ uniforms: { ...style, uPose: o.pose || { value: new THREE.Vector4() }, uPivot: o.pivot || { value: new THREE.Vector3() } },
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec3 aSide, aCol, aBend; attribute vec4 aRib; uniform float uU; varying vec3 vN, vP; varying float vCol, vAo;
${GLAZE_POSE_GLSL}
void main(){ float H = aRib.z; float front = aRib.y*${RUN_REACH}; float behind = front - aRib.x;
  float w = smoothstep(0., 1.4, behind)*(.5 + .75*exp(-max(behind, 0.)/3.2))*(1. + .3*sin(aRib.x*.55 - uTime*1.4 + aCol.z*40.));
  float c = aRib.w; vec3 p = position + aSide*c*aCol.y*w + normal*(.04 + .55*aCol.y*w*(1. - c*c));
  vec3 n = normal + aSide*c*.55; gzPose(p, n, aBend);
  vec4 wp = modelMatrix*vec4(p, 1.); vP = wp.xyz; vN = mat3(modelMatrix)*n; vCol = aCol.x; vAo = .75 + .25*normal.y;
  gl_Position = projectionMatrix*viewMatrix*wp; }`, fragmentShader: RUN_FRAG });
}
// beads: instanced drops. Per instance: iPos (anchor), iPar (length m, seed, h of its run or -1 = always there, colour), iBend.
export function beadsMesh(style, list, o = {}) {
  if (!o.lite && !o.tier) { // two tiers: the few big drops are round at a fifth of the frame, the many small ones stay cheap
    const big = list.filter((b) => b.size >= 4), small = list.filter((b) => b.size < 4), grp = new THREE.Group();
    if (big.length) grp.add(beadsMesh(style, big, { ...o, tier: 2 })); if (small.length) grp.add(beadsMesh(style, small, { ...o, tier: 1 }));
    return grp;
  }
  const prof = o.tier === 2 ? [[0, 0.035], [0.1, 0.055], [0.26, 0.11], [0.42, 0.24], [0.56, 0.375], [0.7, 0.465], [0.82, 0.47], [0.91, 0.38], [0.97, 0.22], [1, 0]]
    : o.tier === 1 ? [[0, 0.04], [0.28, 0.13], [0.54, 0.37], [0.76, 0.47], [0.93, 0.3], [1, 0]]
      : [[0, 0.05], [0.36, 0.2], [0.68, 0.46], [0.9, 0.34], [1, 0]];
  const nT = o.tier === 2 ? 14 : o.tier === 1 ? 8 : 6, pos = [], nor = [], idx = [];
  for (let i = 0; i < prof.length; i++) for (let j = 0; j <= nT; j++) { const a = j / nT * Math.PI * 2, r = prof[i][1]; pos.push(Math.cos(a) * r, -prof[i][0], Math.sin(a) * r);
    const dr = (prof[Math.min(prof.length - 1, i + 1)][1] - prof[Math.max(0, i - 1)][1]), dy = (prof[Math.min(prof.length - 1, i + 1)][0] - prof[Math.max(0, i - 1)][0]), l = Math.hypot(dr, dy) || 1; nor.push(Math.cos(a) * dy / l, dr / l, Math.sin(a) * dy / l); }
  for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < nT; j++) { const a = i * (nT + 1) + j; idx.push(a, a + 1, a + nT + 1, a + 1, a + nT + 2, a + nT + 1); }
  const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  const n = list.length, iPos = new Float32Array(n * 3), iPar = new Float32Array(n * 4), iBend = new Float32Array(n * 3);
  list.forEach((b, k) => { iPos.set(b.p, k * 3); iPar.set([b.size, b.seed ?? (k * 0.618) % 1, b.h ?? -1, b.col || 0], k * 4); iBend.set(b.bend || [0, 0, 0], k * 3); });
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 3)); g.setAttribute('iPar', new THREE.InstancedBufferAttribute(iPar, 4)); g.setAttribute('iBend', new THREE.InstancedBufferAttribute(iBend, 3));
  g.instanceCount = n;
  const m = new THREE.ShaderMaterial({ uniforms: { ...style, uPose: o.pose || { value: new THREE.Vector4() }, uPivot: o.pivot || { value: new THREE.Vector3() } },
    vertexShader: /* glsl */`attribute vec3 iPos, iBend; attribute vec4 iPar; uniform float uU; varying vec3 vN, vP; varying float vCol, vAo;
${GLAZE_POSE_GLSL}
void main(){ float H = iPar.z; float reach = H < 0. ? 1. : ${RUN_REACH};
  float grow = smoothstep(.93, 1., reach)*(.5 + .5*clamp(uU*1.5 + iPar.y*.35, 0., 1.));
  float ph = iPar.y*40.; float sag = 1. + .1*sin(uTime*1.1 + ph) + .25*uU;
  vec3 q = position*vec3(1., sag, 1.)*iPar.x*grow; float lo = -position.y;
  q.x += lo*lo*iPar.x*.07*sin(uTime*1.7 + ph); q.z += lo*lo*iPar.x*.06*sin(uTime*1.3 + ph*1.7);
  vec3 a = iPos, n0 = vec3(0., 1., 0.), n = normal; gzPose(a, n0, iBend);
  vec4 wp = modelMatrix*vec4(a + q, 1.); vP = wp.xyz; vN = mat3(modelMatrix)*n; vCol = iPar.w; vAo = 1.;
  gl_Position = projectionMatrix*viewMatrix*wp; }`, fragmentShader: RUN_FRAG });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; return mesh;
}

// A slab: trimmed, slightly warped edges, thumb marks; always bare clay (part 2). Base at y 0, top at h.
export function slabGeometry(w, h, d, rng, seedN = 1, nT = 112) {
  const noise = makeNoise(Math.floor(rng() * 1e9)), rings = [[1.0, 0], [1.012, h * 0.12], [1.004, h * 0.8], [0.992, h * 0.97], [0.975, h], [0.9, h], [0.6, h], [0.25, h], [0.0, h]];
  const W = nT + 1, n = rings.length * W, P = new Float32Array(n * 3), S = new Float32Array(n * 4), F = new Float32Array(n * 4), B = new Float32Array(n * 3), idx = [];
  const rr = Math.min(w, d) * 0.06;
  for (let i = 0; i < rings.length; i++) for (let j = 0; j <= nT; j++) {
    const t = (j % nT) / nT * Math.PI * 2, cx = Math.cos(t), cz = Math.sin(t), o = (i * W + j) * 3;
    // rounded rectangle by a superellipse, trimmed unevenly
    const e = 0.22, sx = Math.sign(cx) * Math.pow(Math.abs(cx), e), sz = Math.sign(cz) * Math.pow(Math.abs(cz), e);
    const k = rings[i][0], trim = i < 5 ? 1 + 0.012 * noise.n2(cx * 3 + seedN, cz * 3) + 0.004 * noise.n2(t * 9, 3.3) : 1;
    const x = sx * w / 2 * k * trim, z = sz * d / 2 * k * trim;
    const warp = 0.06 * h * noise.n2(x / (w * 0.4), z / (d * 0.4) + 7) + (i >= 3 ? -0.05 * h * Math.max(0, noise.n2(x / 9, z / 9)) : 0);
    P[o] = x; P[o + 1] = rings[i][1] + (i > 0 ? warp : 0) + (i === 3 || i === 4 ? -0.1 * h * Math.max(0, noise.n2(t * 14, 1.7)) : 0); P[o + 2] = z;
    S[(i * W + j) * 4 + 2] = i < 1 ? 0.6 : 1; S[(i * W + j) * 4 + 3] = 2; F[(i * W + j) * 4 + 1] = t * 40;
  }
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < nT; j++) { const a = i * W + j, b = a + 1, c = a + W, e = c + 1; idx.push(a, c, b, b, c, e); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aFlow', new THREE.BufferAttribute(F, 4));
  g.setAttribute('aSurf', new THREE.BufferAttribute(S, 4)); g.setAttribute('aBend', new THREE.BufferAttribute(B, 3)); g.setAttribute('aLw', new THREE.BufferAttribute(new Float32Array(n), 1));
  g.setIndex(idx); g.computeVertexNormals(); void rr;
  return g;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, Y = ctx.yield ? () => ctx.yield() : async () => {};
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const style = opts.style || makeGlazeStyle(opts.palette || GLAZE_PALETTE);
  const kiln = opts.kiln || (rng() < 0.7 ? 'amber' : rng() < 0.5 ? 'cream' : 'streaked');
  const seed = rng.range(1, 90), q = opts.q ?? 1, scale = opts.scale ?? 1, knee = opts.knee ?? HORSE.knee, slab = opts.slab || HORSE.slab, runsK = (opts.runs ?? 1);
  const group = new THREE.Group(); group.name = 'glaze-horse';
  const shadowRng = rng.fork('shadow');
  const lite = !!opts.lite;
  const H = await buildHorseParts(rng, q, Y);
  const extra = await buildTrappings(H, rng, Y, lite);
  await Y();
  const geos = []; { let acc = 0; for (const p of H.parts.concat(extra.parts)) { geos.push(partGeometry(p, true)); acc += p.n; if (acc > 1200) { acc = 0; await Y(); } } }
  geos.push(slabGeometry(slab[0], slab[1], slab[2], rng, 1, opts.lite ? 56 : 112));
  await Y();
  const gh = geos.length >> 1, geoA = mergeGeometries(geos.slice(0, gh), false); await Y(); const geoB = mergeGeometries(geos.slice(gh), false); await Y();
  const geo = mergeGeometries([geoA, geoB], false); geos.forEach((g) => g.dispose()); geoA.dispose(); geoB.dispose();
  markAttr(geo, H.parts.concat(extra.parts));
  if (H.crup) {   // green carried downhill from the crupper's strap either side of the spine: 0.62 at the strap as at every strap, falling by e in 9 m (the reach of its
    // own pendants; the body's 42 m turned the whole croup green, and amber is the body's glaze): a green fringe, fingers and olive seams beside the strap
    const b = H.body, fl = geo.attributes.aFlow.array, jt = Math.round(b.nT / 4);
    for (let i = Math.ceil(H.crup.s0 * b.nS); i <= Math.floor(H.crup.s1 * b.nS); i++) for (const dir of [1, -1]) { let arc = 0;
      for (let k = 0; k < b.nT / 4; k++) { const j = jt + dir * k, a = (i * b.W + j) * 3, c = (i * b.W + j - dir) * 3; if (k) arc += Math.hypot(b.P[a] - b.P[c], b.P[a + 1] - b.P[c + 1], b.P[a + 2] - b.P[c + 2]);
        const o = (i * b.W + j) * 4 + 2; fl[o] = Math.max(fl[o], 0.62 * Math.exp(-Math.max(0, arc - 2) / 9)); } }
  }
  await Y();
  const pivot = new THREE.Vector3().fromArray(HORSE.pivot);
  // the rose shadow: a low mould of the same horse, sheared flat in the vertex shader
  const HL = await buildHorseParts(shadowRng, lite ? Math.min(q, 0.05) : Math.min(q, 0.3), Y, H.v, false);
  await Y(); const sg = HL.parts.map((p) => partGeometry(p, false)); await Y(); sg.push(slabGeometry(slab[0], slab[1], slab[2], shadowRng, 1, lite ? 24 : 112));
  const shadowGeo = mergeGeometries(sg, false); sg.forEach((g) => g.dispose());
  for (const k of ['aFlow', 'aSurf', 'aLw', 'normal']) shadowGeo.deleteAttribute(k);
  await Y();

  // leading runs and beads
  const runs = [], beads = extra.hang.filter((h, k) => !lite || k % 3 === 0).map((h) => ({ p: h.p, size: h.size * (lite ? 1.5 : 1), bend: h.bend, col: h.green ? 1 : 0, h: -1 }));
  const legs = H.parts.slice(5, 9), TAU = Math.PI * 2;
  const addRun = (part, fi, fj, step, n, minY, w, bendOf) => {
    const pts = traceDown(part, fi, fj, step, n, minY, rng.range(0.06, 0.22), rng() * 9); if (pts.length < 4) return;
    const o = (clamp(Math.round(fi), 0, part.nS) * part.W + ((Math.round(fj) % part.nT) + part.nT) % part.nT) * 4;
    const h = rng(), col = part.flow[o + 2] > 0.8 ? 1 : (rng() < 0.15 ? 2 : 0), e = pts[pts.length - 1], early = pts.length - 1 === n && part === H.body;
    if (bendOf) for (const q of pts) q.bend = bendOf(q.p);
    runs.push({ pts, w, col, h, seed: rng() });
    beads.push({ p: [e.p[0] + e.n[0] * 0.25, e.p[1] + 0.35, e.p[2] + e.n[2] * 0.25], size: w * rng.range(2.2, 4.2) * (early ? 0.45 : 1), h, col, bend: e.bend, seed: rng() });
  };
  for (const leg of legs) { await Y(); for (let k = 0; k < Math.round(11 * runsK); k++) addRun(leg, (112 - rng.range(58, 86)) / 106 * leg.nS, rng() * leg.nT, 1.8, 31, knee - (rng() < 0.3 ? rng.range(3, 10) : rng.range(-2, 4)), rng.range(0.55, 1.35)); }
  await Y();
  const nBody = Math.round(84 * detail * runsK);
  for (let k = 0; k < nBody; k++) { if (k % 8 === 7) await Y(); addRun(H.body, rng.range(0.04, 0.96) * H.body.nS, (Math.PI / 2 + rng.sign() * rng.range(0.9, 1.95)) / TAU * H.body.nT, 2.6, rng.int(14, 31), 0, rng.range(0.8, 2.1)); }
  await Y();
  for (let k = 0; k < Math.round(14 * runsK); k++) addRun(H.neck, rng.range(0.12, 0.9) * H.neck.nS, (Math.PI + rng.sign() * rng.range(0.8, 1.7)) / TAU * H.neck.nT, 2.2, 31, 0, rng.range(0.7, 1.5), (p) => [H.neckW(p[1], p[2]), 0, 0]);
  await Y();
  // the chest bead (13 m, as big as a house), the chin bead, and the belly keel's row
  const lowest = (part, s0, s1) => { let best = 0, by = 1e9; for (let i = Math.round(s0 * part.nS); i <= Math.round(s1 * part.nS); i++) for (let j = 0; j < part.nT; j++) { const o = (i * part.W + j) * 3; if (part.P[o + 1] < by) { by = part.P[o + 1]; best = o; } } return [part.P[best], part.P[best + 1] + 0.5, part.P[best + 2]]; };
  const chestBead = lowest(H.body, 0.8, 0.93), chin = lowest(H.head, 0.8, 1);
  beads.push({ p: chestBead, size: 13, h: -1, col: 0, seed: 0.05 }, { p: chin, size: 5.5, h: -1, col: 0, bend: [1, 0, 0], seed: 0.4 });
  for (let k = 0; k < (lite ? 7 : 16); k++) { const q = extra.bodyPt(rng.range(0.2, 0.74), Math.PI * 1.5 + rng.range(-0.12, 0.12)); beads.push({ p: [q.p[0], q.p[1] + 0.4, q.p[2]], size: rng.range(1.8, 5), h: -1, col: body4(q.o), seed: rng() }); }
  function body4(o) { return H.body.flow[o * 4 + 2] > 0.3 ? 1 : 0; }
  if (!lite) {   // always there, at fixed places (no draw of the seed): a fat bead under each tongue of the glaze line on the legs, and a green drip under each tassel of the cloth
    for (const e of H.parts.legEnds) beads.push({ p: e.p, size: 2.7 + 0.9 * markHash(40 + e.k * 3 + e.t), h: -1, col: 0, seed: markHash(60 + e.k * 3 + e.t) });
    extra.hang.forEach((h, k) => { if (h.size === 1.1) beads.push({ p: [h.p[0], h.p[1] - 0.5, h.p[2]], size: 2.6 + 0.8 * markHash(80 + k), h: -1, col: 1, bend: h.bend, seed: markHash(120 + k) }); });
  }
  await Y();
  let runGeo;   // in two halves: each a short step
  if (runs.length > 40) { const rh = runs.length >> 1, ra = runsGeometry(runs.slice(0, rh)); await Y(); const rb = runsGeometry(runs.slice(rh)); await Y(); runGeo = mergeGeometries([ra, rb], false); ra.dispose(); rb.dispose(); }
  else runGeo = runsGeometry(runs);
  await Y();
  // instance(o): one more figure from this mould (shared geometry, its own seed / kiln / pose): { object, pose, material }.
  // o: { seed, kiln, cobalt, tint, scale }. Everything is made here, in build; call it during build only.
  const instance = (o = {}) => {
    const g = new THREE.Group(), sc = o.scale ?? scale;
    const m = glazeFigureMaterial(style, { seed: o.seed ?? seed, knee, kiln: o.kiln || kiln, cobalt: o.cobalt ?? false, pivot, scale: sc, tint: o.tint, pour: !!o.pour });
    const poseU = { pose: m.uniforms.uPose, pivot: m.uniforms.uPivot };
    const body = new THREE.Mesh(geo, m), sh = new THREE.Mesh(shadowGeo, glazeShadowMaterial(style, poseU));
    const rn = new THREE.Mesh(runGeo, glazeRunMaterial(style, poseU)), bd = beadsMesh(style, beads, { ...poseU, lite });
    sh.renderOrder = -0.5; for (const x of [body, sh, rn, bd]) { x.frustumCulled = false; g.add(x); }
    g.scale.setScalar(sc);
    return { object: g, pose: m.uniforms.uPose.value, material: m, shadow: sh };
  };
  const me = instance({ seed, kiln, cobalt: opts.cobalt ?? true, tint: opts.tint, pour: opts.pour ?? !lite }), mat = me.material;
  group.add(me.object);
  await Y();

  let progress = -1; const pose = mat.uniforms.uPose.value;
  const zc = H.zOf((H.clothA + H.clothB) / 2 + 0.01);
  const anchors = {
    glazeLineY: HORSE.knee, slabTop: HORSE.slab[1], slabSize: HORSE.slab.slice(), neckPivot: HORSE.pivot.slice(),
    foreGate: [0, 30, HORSE.foreZ], hindGate: [0, 30, HORSE.hindZ], legGapHalf: HORSE.legX - 7.5,
    flyUnder: [[0, 30, 185], [0, 30, 135], [0, 30, HORSE.foreZ], [0, 36, -8], [0, 30, HORSE.hindZ], [0, 30, -150]],
    chestBead, chin, muzzle: [0, H.hp1[1] + 2, H.hp1[2] + 6], poll: H.hp0.slice(), crest: [0, 187, 88], saddleTop: [0, 158, zc],
    backLine: [[0, 164, -90], [0, 168, zc - 10], [0, 170, zc + 28], [0, 196, 62], [0, 200, 96]],
    faceDive: [[0, 176, 128], [0, 160, 140], [0, 110, 142], [0, 60, 150]],
    rumpOrbit: { center: [0, 120, HORSE.rumpZ + 10], radius: 95 }, tailTip: extra.hang[0].p.slice(), sun: SUN_DIR.toArray(),
  };
  return {
    object: group, radius: 125 * scale, height: 190 * scale, center: new THREE.Vector3(0, 95 * scale, 10 * scale), anchors, ground: true, groundY: 0,
    style, material: mat, kiln, instance, shadow: me.shadow,
    setProgress(u) { progress = u; },
    update(dt, time) {
      const u = progress >= 0 ? progress : (time / 30) % 1; // set-piece viewer: no world drives u, so loop it
      style.uTime.value = time; style.uU.value = u; style.uPour.value = smoothstep(0.56, 0.66, u) + 0 * dt;
      pose.set(0.035 * Math.sin(time * 0.31) + 0.02 * Math.sin(time * 0.83 + 1), 0.05 * Math.sin(time * 0.23 + 2), 0.5 + 0.5 * Math.sin(time * 0.9), Math.pow(Math.max(0, Math.sin(time * 0.7 + 1.3)), 24));
    },
    dispose() {},
  };
}
// Luted-on pieces and harness ornament: hogged mane, knotted tail, saddle, apricot-leaf pendants, rosettes, tassels.
async function buildTrappings(H, rng, Y, lite = false) {
  const parts = [], { body, neckAt, neckW, v, NS } = H, hang = []; // hang: points where beads may hang (tips)
  const bodyPt = (s, th) => { const i = clamp(Math.round(s * body.nS), 0, body.nS), j = ((Math.round(th / (Math.PI * 2) * body.nT) % body.nT) + body.nT) % body.nT, o = i * body.W + j; return { o, p: [body.P[o * 3], body.P[o * 3 + 1], body.P[o * 3 + 2]], n: [body.N[o * 3], body.N[o * 3 + 1], body.N[o * 3 + 2]], down: body.flow[o * 4], lane: body.flow[o * 4 + 1] }; };
  // mane: a hogged ridge along the crest with a knife cut every 3 m; cream
  const crest = (s) => { const q = neckAt(s), a = neckAt(Math.max(0, s - 0.01)).p, b = neckAt(Math.min(1, s + 0.01)).p; let ty = b[1] - a[1], tz = b[2] - a[2]; const l = Math.hypot(ty, tz) || 1; ty /= l; tz /= l; const k = q.rx + 1.2; return [0, q.p[1] + tz * k, q.p[2] - ty * k]; };
  let mlen = 0; { let pp = crest(0.05); for (let i = 1; i <= 60; i++) { const c = crest(lerp(0.05, 0.875, i / 60)); mlen += Math.hypot(c[1] - pp[1], c[2] - pp[2]); pp = c; } }
  const nCut = Math.round(mlen / 3);
  const mane = loftPart({
    nS: NS(nCut * 5), nT: 8, up: [1, 0, 0], laneOff: 1000, carry: 40, curvK: 0.25,
    at: (s) => { const c = capR(s, 0.03, 0.02), cut = Math.pow(Math.abs(Math.sin(Math.PI * s * nCut)), 0.35); return { p: crest(lerp(0.05, 0.875, s)), rx: (1.2 + 3.6 * cut) * (0.3 + 0.7 * c), ry: 2.9 * c * (0.85 + 0.15 * cut) }; },
    shape: (s, th) => 1 - 0.35 * Math.abs(Math.sin(th)) * Math.max(0, -Math.cos(th)),
    cream: () => 1, ridge: (s, th) => 0.5 * Math.max(0, -Math.cos(th)) * (1 - Math.pow(Math.abs(Math.sin(Math.PI * s * nCut)), 0.35)),
    bend: (x, y, z) => [neckW(y, z), 0, 0],
  });
  await Y(); bakeFlow(mane); parts.push(mane); await Y();
  // tail: docked, knotted, luted on
  const tl = v.tail, tp = [[0, 141, -88], [0, 145, -101], [0, 150, -108 - 2 * tl], [0, 158 + 3 * tl, -111 - 5 * tl]];
  const tail = loftPart({
    nS: NS(34), nT: 14, up: [1, 0, 0], laneOff: 1200, seam: 0.4,
    at: (s) => { const c = capR(s, 0.02, 0.1), r = (6.8 - 3.0 * s + 1.7 * gauss(s - 0.36, 0.09) + 1.1 * gauss(s - 0.8, 0.12)) * (0.4 + 0.6 * c); return { p: bez(tp[0], tp[1], tp[2], tp[3], s), rx: r, ry: r * 0.92 }; },
    disp: (s, th) => 0.7 * gauss(s - 0.36, 0.1) * Math.sin(th * 2 + s * 16) + 0.3 * Math.sin(th * 6 + s * 5) * smoothstep(0.5, 0.9, s),
    hollow: (s) => 0.6 * gauss(s - 0.22, 0.05),
  });
  await Y(); bakeFlow(tail); parts.push(tail); { const e = bez(tp[0], tp[1], tp[2], tp[3], 0.995); hang.push({ p: e, size: 2.6, bend: [0, 0, 0] }); }
  // saddle: a separate piece luted to the back with a rolled seam; pommel and cantle rise to 158
  const sc = (H.clothA + H.clothB) / 2 + 0.01, zc = H.zOf(sc), sy = bodyPt(sc, Math.PI / 2).p[1];
  const saddle = loftPart({
    nS: NS(40), nT: 28, up: [0, 1, 0], laneOff: 1400, seam: 0.5, carry: 30, curvK: 0.15,
    at: (s) => { const c = capR(s, 0.14, 0.14); return { p: [0, sy - 3.5 + 5 * gauss(s - 0.06, 0.16) + 6 * gauss(s - 0.95, 0.14), zc + lerp(-19, 20, s)], rx: 16.5 * (0.45 + 0.55 * c) * (1 - 0.12 * gauss(s - 0.5, 0.25)), ry: (5.2 + 6.5 * gauss(s - 0.05, 0.13) + 7.5 * gauss(s - 0.96, 0.12)) * (0.35 + 0.65 * c) }; },
    shape: (s, th) => (Math.sin(th) < 0 ? 0.7 : 1) * (1 + 0.1 * Math.pow(Math.abs(Math.cos(th)), 6)),
    disp: (s, th) => 0.9 * Math.pow(Math.abs(Math.cos(th)), 10) * (Math.sin(th) > -0.3 ? 1 : 0),
    ridge: (s, th) => 0.8 * Math.pow(Math.abs(Math.cos(th)), 10), hollow: (s, th) => 0.5 * gauss(s - 0.5, 0.16) * Math.pow(Math.max(0, Math.sin(th)), 2),
    cream: () => -0.05, bend: () => [0, 0, 0.6],
  });
  await Y(); bakeFlow(saddle); parts.push(saddle); await Y();
  // small hanging pieces. leaf: an apricot-leaf pendant 9 m long with veins; boss: a rosette; tassel: a knotted tuft
  const small = (kind, at, len, id, bw) => {
    const nh = Math.hypot(at.n[0], at.n[2]) || 1, nx = at.n[0] / nh, nz = at.n[2] / nh, w = bw || [0, 0, 0];
    const base = { laneOff: at.lane - 2 + id * 0.01, down0: at.down, carry: 40, green: () => 1, cream: () => -0.12, part: 0, curvK: 0.2 };
    let P;
    if (kind === 'leaf') P = loftPart({ ...base, nS: lite ? 7 : 12, nT: lite ? 6 : 8, up: [nx, 0, nz],
      at: (s) => ({ p: [at.p[0] + nx * (1.3 + 1.2 * s * s), at.p[1] - 0.5 - s * len, at.p[2] + nz * (1.3 + 1.2 * s * s)], rx: len * 0.3 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.62)), 0.8) + 0.12, ry: 0.85 * (1 - 0.6 * s) + 0.05 }),
      disp: (s, th) => 0.3 * gauss(Math.cos(th) * 3, 0.5) + 0.16 * Math.sin((Math.abs(Math.cos(th)) * 2.4 + s * 4) * 6.28) * Math.abs(Math.cos(th)),
      ridge: (s, th) => 0.7 * Math.pow(Math.abs(Math.cos(th)), 10), hollow: (s, th) => 0.3 * (1 - Math.abs(Math.cos(th))),
      bend: (x, y) => [w[0], -smoothstep(at.p[1] - 1, at.p[1] - len, y) * 0.6, w[2]] });
    else if (kind === 'boss') P = loftPart({ ...base, green: () => 0, cream: () => 0.75, nS: lite ? 4 : 7, nT: lite ? 8 : 12, up: [0, 1, 0],
      at: (s) => ({ p: [at.p[0] + nx * (0.2 + 1.9 * s), at.p[1] + at.n[1] * 1.9 * s, at.p[2] + nz * (0.2 + 1.9 * s)], rx: len * Math.sqrt(Math.max(0, 1 - s * s)) + 0.02, ry: len * Math.sqrt(Math.max(0, 1 - s * s)) + 0.02 }),
      shape: (s, th) => 1 + 0.2 * Math.cos(th * 6) * (1 - s) - 0.25 * gauss(s - 0.55, 0.12), ridge: (s) => 0.6 * gauss(s - 0.3, 0.2), hollow: (s) => 0.6 * gauss(s - 0.55, 0.1), bend: () => w });
    else P = loftPart({ ...base, nS: lite ? 6 : 10, nT: lite ? 6 : 8, up: [nx, 0, nz],
      at: (s) => ({ p: [at.p[0] + nx * 1.1, at.p[1] + 0.6 - s * len, at.p[2] + nz * 1.1], rx: (0.5 + 1.0 * gauss(s - 0.12, 0.08) + 1.5 * smoothstep(0.25, 1, s)) * capR(s, 0.05, 0.04) + 0.05, ry: (0.5 + 1.0 * gauss(s - 0.12, 0.08) + 1.3 * smoothstep(0.25, 1, s)) * capR(s, 0.05, 0.04) + 0.05 }),
      shape: (s, th) => 1 + 0.14 * Math.cos(th * 4) * smoothstep(0.25, 0.5, s), hollow: (s) => 0.6 * gauss(s - 0.25, 0.06),
      bend: (x, y) => [w[0], -smoothstep(at.p[1], at.p[1] - len, y) * 0.9, w[2]] });
    bakeFlow(P); parts.push(P);
    if (kind !== 'boss') hang.push({ p: [at.p[0] + nx * 1.3, at.p[1] - len - 0.3, at.p[2] + nz * 1.3], size: kind === 'leaf' ? 1.5 : 1.1, bend: [w[0], -0.7, w[2]], green: 1 });
  };
  // find the body vertex on a strap nearest a bearing round the chest (sign +1) or rump (-1)
  const onStrap = (front, ang, yT) => {
    let best = -1, bd = 1e9; const i0 = front ? Math.round(body.nS * (H.clothB + 0.03)) : 2, i1 = front ? body.nS - 2 : Math.round(body.nS * (H.clothA - 0.03));
    for (let i = i0; i <= i1; i++) for (let j = 0; j < body.nT; j++) {
      const o = (i * body.W + j) * 3, x = body.P[o], y = body.P[o + 1], z = body.P[o + 2];
      const a = front ? Math.atan2(x, z - 50) : Math.atan2(x, -(z + 62)), d = Math.abs(y - yT(z)) + Math.abs(angd(a, ang)) * 30;
      if (d < bd) { bd = d; best = i * body.W + j; }
    }
    const o = best * 3; return { p: [body.P[o], body.P[o + 1] - 1.5, body.P[o + 2]], n: [body.N[o], body.N[o + 1], body.N[o + 2]], down: body.flow[best * 4], lane: body.flow[best * 4 + 1] };
  };
  let id = 0;
  for (let k = 0; k < v.nPend; k++) { const a = lerp(-2.2, 2.2, (k + 0.5) / v.nPend) + rng.range(-0.05, 0.05), at = onStrap(true, a, () => 120); small('leaf', at, rng.range(8.2, 9.6), id++, [0, 0, 0.5]); small('boss', { ...at, p: [at.p[0], at.p[1] + 1.5, at.p[2]] }, 2.0, id++, [0, 0, 0.5]); await Y(); }
  for (let k = 0; k < v.nCrup * 2; k++) { const a = lerp(-2.3, 2.3, (k + 0.5) / (v.nCrup * 2)) + rng.range(-0.05, 0.05), at = onStrap(false, a, () => 128); small('leaf', at, rng.range(8, 9.4), id++); small('boss', { ...at, p: [at.p[0], at.p[1] + 1.5, at.p[2]] }, 2.0, id++); await Y(); }
  await Y();
  for (const sd of [-1, 1]) for (let k = 0; k < 6; k++) { // tassels below the cloth; the corner ones are the knots
    const s = lerp(H.clothA + 0.004, H.clothB - 0.004, k / 5), at = bodyPt(s, Math.PI / 2 + sd * (H.clothTh + 0.03)), corner = k === 0 || k === 5;
    small('tassel', at, corner ? rng.range(8, 9.5) : rng.range(5, 7), id++, [0, 0, 0.5]); if (k % 2 === 1) await Y();
  }
  // THE BACK, FROM THE CROUP TO THE POLL (the great horse only): the design's own marks along the strip under backLine, at sizes an eye
  // some 40 m off can read; each stands on the mould at its own place, none is drawn by chance and none knows where the eye is.
  if (!lite) {
    await Y();
    const TAU = Math.PI * 2, HP = Math.PI / 2;
    const surf = (s, th) => {   // the body's surface: point and normal (bilinear on the loft)
      const fi = clamp(s, 0, 1) * body.nS, i0 = Math.min(body.nS - 1, Math.floor(fi)), a = fi - i0, fj = (((th / TAU) % 1) + 1) % 1 * body.nT, j0 = Math.floor(fj) % body.nT, b = fj - Math.floor(fj);
      const o = [i0 * body.W + j0, (i0 + 1) * body.W + j0, i0 * body.W + j0 + 1, (i0 + 1) * body.W + j0 + 1], w = [(1 - a) * (1 - b), a * (1 - b), (1 - a) * b, a * b], p = [0, 0, 0], n = [0, 0, 0];
      for (let k = 0; k < 4; k++) for (let c = 0; c < 3; c++) { p[c] += body.P[o[k] * 3 + c] * w[k]; n[c] += body.N[o[k] * 3 + c] * w[k]; }
      const l = Math.hypot(n[0], n[1], n[2]) || 1; return { p, n: [n[0] / l, n[1] / l, n[2] / l] };
    };
    const off = (q, h) => [q.p[0] + q.n[0] * h, q.p[1] + q.n[1] * h, q.p[2] + q.n[2] * h];
    const breath = (x, y, z) => [0, 0, smoothstep(0.3, 0.6, (z - HORSE.rumpZ) / 179) * (1 - smoothstep(0.9, 1, (z - HORSE.rumpZ) / 179)) * smoothstep(150, 100, y)];
    const piece = (spec) => { const P = loftPart({ laneOff: 2000 + 70 * parts.length, carry: 40, curvK: 0.2, part: 0, bend: breath, ...spec }); bakeFlow(P); parts.push(P); return P; };
    const cA = H.clothA - 0.004, cB = H.clothB + 0.004, cT = H.clothTh;
    // the cloth's border: a raised band 2.4 m wide round all four edges, green, slip along its crest, the glass pooled dark in the fold
    // either side (the tassels hang from its lower edges, the corner ones its knots)
    const border = { green: () => 0.62, cream: () => -0.6, ridge: (s, th) => 0.9 * Math.pow(Math.max(0, Math.cos(th)), 6), hollow: (s, th) => 0.8 * Math.pow(Math.abs(Math.sin(th)), 4) };
    for (const sE of [cA, cB]) piece({ ...border, nS: 22, nT: 6, up: [0, 0, -1], at: (s) => { const c = capR(s, 0.03, 0.03); return { p: off(surf(sE, HP + lerp(-cT, cT, s)), 0.3), rx: 1.0 * (0.4 + 0.6 * c), ry: 1.2 * (0.4 + 0.6 * c) }; } });
    await Y();
    for (const sd of [-1, 1]) { const hemTh = (s) => HP + sd * (cT - 0.05 * Math.sin(s * 90)), nm = surf((cA + cB) / 2, hemTh((cA + cB) / 2)).n;
      piece({ ...border, nS: 14, nT: 6, up: [-nm[1], nm[0], 0], at: (s) => { const c = capR(s, 0.04, 0.04), sb = lerp(cA, cB, s); return { p: off(surf(sb, hemTh(sb)), 0.3), rx: 1.0 * (0.4 + 0.6 * c), ry: 1.2 * (0.4 + 0.6 * c) }; } }); }
    await Y();
    // the saddle's rolled seam: a true roll 3 m thick round the saddle's foot where it is luted to the cloth, amber, pooled dark in its fold
    { const thOf = (sb, x) => { const X = surf(sb, 0).p[0]; let th = Math.acos(clamp(x / X, -1, 1)); for (let k = 0; k < 2; k++) th += (surf(sb, th).p[0] - x) / (X * Math.max(0.3, Math.sin(th))); return th; };   // where round the body the surface stands x to the side
      const pw = (c, e) => Math.sign(c) * Math.pow(Math.abs(c), e);
      piece({ nS: 44, nT: 6, up: [0, 1, 0], green: () => 0, cream: () => -0.05, bend: () => [0, 0, 0.6],
        ridge: (s, th) => 0.5 * Math.pow(Math.max(0, Math.sin(th)), 4), hollow: (s, th) => 0.9 * smoothstep(0.1, -0.6, Math.sin(th)),
        at: (s) => { const a = s * TAU, x = 19.3 * pw(Math.cos(a), 0.7), z = zc + 0.5 + 21 * pw(Math.sin(a), 0.8), sb = (z - HORSE.rumpZ) / 179; return { p: off(surf(sb, thOf(sb, x)), 0.5), rx: 1.5, ry: 1.5 }; } }); }
    await Y();
    // the crupper over the croup: its strap down the spine from the cloth's rear border to the root of the tail (4 m wide, as the
    // other straps), three rosette bosses 4 m across on it, and from each boss an apricot-leaf pendant 9 m long lying down either side
    const s0 = 0.06, s1 = H.clothA - 0.012;
    piece({ nS: 20, nT: 6, up: [1, 0, 0], green: () => 0.62, cream: () => -0.6, bend: () => [0, 0, 0], ridge: (s, th) => 0.7 * Math.pow(Math.abs(Math.sin(th)), 8),
      at: (s) => { const c = capR(s, 0.04, 0.04); return { p: off(surf(lerp(s1, s0, s), HP), 0.35), rx: 1.0 * (0.4 + 0.6 * c), ry: 2.0 * (0.5 + 0.5 * c) }; } });
    for (let k = 0; k < 3; k++) {
      const sb = lerp(s1, s0, 0.22 + 0.28 * k), q = surf(sb, HP), rr = Math.hypot(...[0, 1, 2].map((c) => surf(sb, HP - 0.1).p[c] - q.p[c])) / 0.1;
      small('boss', { p: off(q, 0.9), n: q.n, lane: 2600 + k, down: 0 }, 2.0, id++, [0, 0, 0]);
      for (const sd of [-1, 1]) { const len = 8.6 + 0.8 * markHash(200 + k * 2 + sd);
        piece({ nS: 9, nT: 8, up: [0, 1, 0], green: () => 1, cream: () => -0.12, bend: () => [0, 0, 0],
          at: (s) => ({ p: off(surf(sb, HP - sd * (1.6 + s * len) / rr), 0.75 - 0.35 * s), rx: len * 0.3 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.62)), 0.8) + 0.12, ry: 0.85 * (1 - 0.6 * s) + 0.05 }),
          disp: (s, th) => 0.3 * gauss(Math.cos(th) * 3, 0.5) + 0.16 * Math.sin((Math.abs(Math.cos(th)) * 2.4 + s * 4) * 6.28) * Math.abs(Math.cos(th)),
          ridge: (s, th) => 0.7 * Math.pow(Math.abs(Math.cos(th)), 10), hollow: (s, th) => 0.3 * (1 - Math.abs(Math.cos(th))) }); }
      await Y();
    }
    H.crup = { s0, s1 };   // buildHero carries the strap's green downhill from it by the body's own rule
    // one amber run coming down the neck: in the fold beside the mane on the +x side, from the highest point of the crest down to
    // the withers; 2.5 m wide at its tail, 3.5 m lower down, ending in a fat lip 5.5 m across; thick glass, pooled dark along its middle, slip along its lips
    { let sTop = 0.05, yTop = -1e9; for (let i = 0; i <= 80; i++) { const s = lerp(0.05, 0.875, i / 80), c = crest(s); if (c[1] > yTop) { yTop = c[1]; sTop = s; } }
      piece({ nS: 34, nT: 6, up: [1, 0, 0], green: () => 0, cream: () => -0.05, bend: (x, y, z) => [neckW(y, z), 0, 0], hollow: (s, th) => 0.6 * Math.max(0, Math.cos(th)), ridge: (s, th) => 0.75 * Math.pow(Math.abs(Math.sin(th)), 6),   // its two lips thin to slip
        at: (t) => { const s = lerp(sTop, 0.07, t), q = neckAt(s), a = neckAt(Math.max(0, s - 0.01)).p, b = neckAt(Math.min(1, s + 0.01)).p; let ty = b[1] - a[1], tz = b[2] - a[2]; const l = Math.hypot(ty, tz) || 1; ty /= l; tz /= l;
          const x = 4.6, sn = Math.min(0.95, x / q.ry), k = q.rx * Math.sqrt(1 - sn * sn) * (1 - 0.1 * sn * (1 - s)) + 0.2, c = capR(t, 0.04, 0.03), lip = gauss(t - 0.95, 0.04);
          return { p: [x, q.p[1] + tz * k, q.p[2] - ty * k], rx: 0.95 * (0.3 + 0.7 * c) * (1 + 0.5 * lip), ry: (1.25 + 0.5 * t + 1.0 * lip) * c + 0.05 }; } }); }
    await Y();
    // the hogged mane's knife cuts: every cut's bottom pooled dark (aMark.y), its two edges slip (ridge)
    mane.mark = new Float32Array(mane.n * 4);
    for (let i = 0; i <= mane.nS; i++) { const ph = (i / mane.nS * nCut) % 1, d = Math.min(ph, 1 - ph) * mane.nS / nCut;   // rings from the nearest cut's bottom
      for (let j = 0; j <= mane.nT; j++) { const v = i * mane.W + j; if (d < 0.5) mane.mark[v * 4 + 1] = 1; else if (d < 1.5) mane.surf[v * 4] = Math.max(mane.surf[v * 4], 1.3); } }
  }
  return { parts, hang, bodyPt };
}
