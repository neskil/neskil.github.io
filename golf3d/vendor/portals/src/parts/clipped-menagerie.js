// The Peacock Yew: hero set piece of clipped-menagerie (topiary style), and the style kit for the whole world.
//
// WHAT IT IS  A clipped-yew peacock on a three-tier drum (96 / 70 / 46 m across, 22 m high): a breast of great sheared
//   facets, a slender neck, a head held in profile at 52 m (it looks toward local -x) with a long wedge of a beak in
//   golden yew and a crest of five golden-yew balls on canes; behind it a half-disc tail 90 m wide leaning back 20
//   degrees, its front cut in eleven stepped tiers (treads in box, risers in lime golden yew, so the fan stands light
//   behind the dark bird) and pierced by five 15 m eye hollows collared in lime golden yew.
//   It stands as one shaggy gold mound (67 m) before a shaggy gold fan, and is CUT OUT OF THEM as the eye flies. The
//   uncut fan is a peacock's tail already, in gold: 22 bands in the two golds and a round boss over each eye to be.
// THE UNIT  Every cut in this file and in the world is a ROUTE METRE: the metres of route the eye has flown (STYLE.uS;
//   the world writes it before every draw). A cut value below 0 means cut before we came, that many days ago (300 and
//   more: as shaggy again as a cut face gets); 1e6 means not cut while we are here. No cut, eye or shower in this
//   file reads a clock, a share of the flight, a seed or the lens.
// THE PEACOCK'S LAWS (typed at BODY_LEAD, TAIL_LEAD and their fellows below; the same on every seed; metres of route
//   SHORT OF THE EYE'S PASS THROUGH THE FAN, which the world gives as opts.sEye):
//   body   the shear starts at the top of the mound 340 m short (in this world: a few metres of route before we come
//          in, so the head stands out of the gold on arrival) and runs down to the drum's foot over 58 m of route;
//   tail   one front turns about a place 6 m under the hub, a half turn to 163 m of route, far tip first and near tip
//          last, and a place is reached later by 27 m times its share of the fan's radius: the far tip's rim is cut
//          196 m short, the hub 149 m short, the near tip's rim 46 m short, so the whole fan, skirt and all, stands
//          cut 46 m short of the pass;
//   eyes   an eye starts to open from its centre 7 m of route after the front has passed its centre and is open 8 m
//          later (uHoleSpan); ours is the fourth from the far tip (it starts to open about 96 m short of our pass).
// THE GROWING BACK is the garden's own time and is shown as a STATE: a face cut some days before we came carries the
//   tufts those days bring (CARD_VERT: old, again); nothing grows back in sight, and a face cut while we are here stays
//   as cut. What runs on the garden's clock (STYLE.uTime) would run the same with no visitor: shoots nod, a clipping
//   flutters as it falls, a string thrums, the flock wheels.
// A CLIPPING'S FALL is drawn by the eye's place: a clipping is born 0 to 5.7 m of route after its place is cut (how
//   many by its own chance: a shower, not a sheet) and falls one second for every uFall (10.8) metres of route flown
//   after that, until it meets the gravel, the drum (a tier's top, chamfer or wall), the bird or the clipped fan's own
//   face; there it settles over its last 0.8 s and lies as litter. A place sunk inside the drum or the bird sheds nothing.
// CLEAR AIR BY PLACE  opts.keep(p, reach, cut, kind) is asked of every leaf card before it is made; opts.air(x, y, z)
//   gives the clear air from the eye's course to a local point (opts.airWide the same, measured out to 60 m, for the
//   flock). A clipping whose whole fall, or a string or cane that, would come within 2.5 m (and its own reach) of the
//   course is not made; a flock bird's ring is drawn in until its whole wander, wing and all, stands that far off, and
//   a bird no ring of which fits is not made. THE FLOCK'S PLACE: every ring lies above the uncut mound's top (so over
//   the crest, the head and the beak, cut or uncut) and in front of the uncut fan's gold face, for the whole flight. Nothing is moved, shrunk, faded or hidden for the lens: no material here
//   reads the camera's place. fwidth is used in four places only, as a sampling filter: a hairline on a clipped face
//   and the line under a tuft of uncut growth are left out where they are finer than the picture's grain (HULL_FRAG);
//   a yew card's comb is drawn only where its needles are coarser than that grain (CARD_FRAG); the rake's lines in
//   the gravel go to their own mean tone where they are finer than it (RAKE_GLSL, used by the flat shadow here and by
//   the world's gravel).
// SIZE  radius 57, height 74 (as it stands uncut when we come; the clipped bird: radius 48, height 70). Origin at base
//   centre, +Y up, FRONT (breast, stepped tail face) toward +Z, so the world rotates it by PI when the camera arrives
//   travelling +Z. Sun for baked face shadows is opts.sun (local, toward the sun).
// OPTS  palette: 7 hex [yewShade, yewSun, boxSun, goldenYewSun, gold, gravel, sky] (brief order); tones: { boxShade,
//   goldenShade, goldShade, shadow, shadowDamp, damp, tackle, bird } overrides; detail 0.6-1 thins leaf cards,
//   clippings and flock; sun: [x,y,z] local; flock: false leaves out the sixty blackbirds wheeling over the crest;
//   plan: what heroPlan(ctx) gave; sEye: the route metre of the eye's pass through the fan; keep, air, airWide: above.
// EXPORTS  heroPlan(ctx): this visit's lopsided tail and where our eye of the fan stands { lop, eye, normal, up, radius }
//   (local space), asked before the world lays its route. buildHero(ctx, opts) -> { object, radius, height, center,
//   anchors, setProgress(s), update(dt, time), dispose, stats }.
// ANCHORS (local space, metres)  eye { position, normal, radius, openAt }: our eye of the fan, 7.5 m in radius, and the
//   route metre at which it stands open; eyes[5] { position, radius, openAt }; head, crest[5], hub, flock (the place
//   under the middle of the flock's rings, at the head's height), sunLocal.
// COST  about 150k triangles in 6 draw calls (hull, its flat shadow, leaf cards, clippings, tackle, flock), 0 lights,
//   0 textures; built in yielded steps.
// EXPECTS  flat post ({ flat: 1, bloom 0, neutral grade }), an empty flat sky (#C3DCDD), no fog, gravel at y = 0.
//
// STYLE EXPORTS (shade the whole world with these so the hero is not pasted in)
//   STYLE           shared uniforms: uS (route metres flown), uTime (the garden's clock), uSun (WORLD-space unit vector
//                   toward the sun; the WORLD writes it, this file never does), the tone tables uSunTone[3] /
//                   uShadeTone[3] (0 yew, 1 box, 2 golden yew), uGold and uGoldShade (the uncut growth, lit and in
//                   shade), uGravel, uDamp, uShadow and uShadowDamp (a shadow on the gravel and on its raked lines),
//                   uSky, uTackle, uBird, uHoleSpan, uFall, uCourt (the round court's centre x, z and radius: the
//                   world writes it; the rake turns in rings inside it).
//   setStylePalette(palette, tones)   writes the brief palette into STYLE (call once in build()).
//   STYLE_GLSL      the common chunk: uniform declarations, mgHash, mgTone(plant, lit), mgHole().
//   RAKE_GLSL       mgRake(world place): 1 on a raked line of the gravel (fragment shaders only).
//   hullMaterial()  two-tone sheared solids AND their gold lumps (a lump's face hangs in rows of tufts, each drawn by
//                   a line of the other gold under it). Geometry: non-indexed, flat normals, attributes
//                   aFace (plant 0..2, bakedShadow 0/1 (on a lump: 1 marks a facet of the deeper gold, makeFacets'
//                   option deep), kind 0 clipped hull / 1 gold lump / 2 gold lump on a fast front), aCut (the route metre at which the cut reaches the vertex: a lump is gone from there on,
//                   behind a leaf-ragged edge of 0.8 m of route either way, 0.3 m for kind 2), aHole (xy metres in a
//                   hole's plane scaled so the finished hole has radius 9, z = the route metre at which it starts to
//                   open; (1e3, 1e3, 1e9) for none).
//   shadowMaterial() the same geometry laid flat on the gravel along uSun in the shadow's two tones (opaque, no blending).
//   cardMaterial()  the leaf cards: instanced single triangles (attributes iPos, iDir, iData, iHole): a lump's gold
//                   shoots until its place is cut; a clipped face's short leaves from its cut on, and tufts where it
//                   was cut long before we came. Each card lies as it grew, with its own fixed turn about its stem.
//   makeFacets()    builder for hull geometry (quads / tris with cut, plant, kind, hole) that also records where cards
//                   go; its geometryAsync(pause) builds attribute by attribute (no long build step on a big zone).
//   makeCards()     turns a facet builder's record into the instanced card mesh.
//   makeTackle()    strings and canes as two flat tapes crossed along their own line; clippingMaterial() the
//                   shower; tackleMaterial(); birdMaterial() the flock's flat blackbird cut-outs.
//   Hairlines: on a lit face the shade tone; on a shade face the next darker plant's shade (yew shade: none).
import * as THREE from 'three';

export const DEFAULT_PALETTE = ['#12261D', '#2A4A33', '#5B8A3F', '#B5C247', '#E8C53C', '#E9E0C9', '#C3DCDD'];
export const DEFAULT_TONES = { boxShade: '#2F5A34', goldenShade: '#6F8F3A', goldShade: '#C8A22E', shadow: '#BDB699', shadowDamp: '#ADA587', damp: '#D8CDB2', tackle: '#F3ECD6', bird: '#12261D' };
const col = (h) => new THREE.Color(h);
const v3c = (c) => new THREE.Vector3(c.r, c.g, c.b);

// Shared uniforms: one object for every material in the world. Under post.flat a colour written is the colour shown.
export const STYLE = {
  uS: { value: 0 }, uTime: { value: 0 },           // uS: metres of route the eye has flown; uTime: the garden's own clock
  uSun: { value: new THREE.Vector3(-0.74, 0.616, -0.27).normalize() },
  uSunTone: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
  uShadeTone: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
  uGold: { value: new THREE.Vector3() }, uGravel: { value: new THREE.Vector3() }, uDamp: { value: new THREE.Vector3() },
  uShadow: { value: new THREE.Vector3() }, uSky: { value: new THREE.Vector3() }, uTackle: { value: new THREE.Vector3() },
  uBird: { value: new THREE.Vector3() }, uGoldShade: { value: new THREE.Vector3() }, uShadowDamp: { value: new THREE.Vector3() },
  uCourt: { value: new THREE.Vector3(0, 0, 86) },   // the round court the gravel is raked in rings in: centre x, centre z, radius (the world writes it)
  uHoleSpan: { value: 8 },                     // metres of route in which a hole opens from its centre to radius 9
  uFall: { value: 10.8 },                      // metres of route to one second of a clipping's fall
};
export function setStylePalette(palette = DEFAULT_PALETTE, tones = {}) {
  const p = palette && palette.length >= 7 ? palette : DEFAULT_PALETTE, t = { ...DEFAULT_TONES, ...tones };
  STYLE.uShadeTone.value[0].copy(v3c(col(p[0]))); STYLE.uSunTone.value[0].copy(v3c(col(p[1])));
  STYLE.uShadeTone.value[1].copy(v3c(col(t.boxShade))); STYLE.uSunTone.value[1].copy(v3c(col(p[2])));
  STYLE.uShadeTone.value[2].copy(v3c(col(t.goldenShade))); STYLE.uSunTone.value[2].copy(v3c(col(p[3])));
  STYLE.uGold.value.copy(v3c(col(p[4]))); STYLE.uGravel.value.copy(v3c(col(p[5]))); STYLE.uSky.value.copy(v3c(col(p[6])));
  STYLE.uShadow.value.copy(v3c(col(t.shadow))); STYLE.uDamp.value.copy(v3c(col(t.damp)));
  STYLE.uTackle.value.copy(v3c(col(t.tackle))); STYLE.uBird.value.copy(v3c(col(t.bird)));
  STYLE.uGoldShade.value.copy(v3c(col(t.goldShade))); STYLE.uShadowDamp.value.copy(v3c(col(t.shadowDamp)));
}
setStylePalette();

export const STYLE_GLSL = /* glsl */`
uniform float uS, uTime, uHoleSpan, uFall;
uniform vec3 uSun, uGold, uGoldShade, uGravel, uDamp, uShadow, uShadowDamp, uSky, uTackle, uBird, uCourt;
uniform vec3 uSunTone[3]; uniform vec3 uShadeTone[3];
float mgHash(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
// the rule of two tones: plant 0 yew, 1 box, 2 golden yew; lit is 0 or 1, nothing between
vec3 mgTone(float plant, float lit){
  vec3 s = uSunTone[0], d = uShadeTone[0];
  if (plant > 1.5) { s = uSunTone[2]; d = uShadeTone[2]; } else if (plant > .5) { s = uSunTone[1]; d = uShadeTone[1]; }
  return lit > .5 ? s : d;
}
// a hole cut outward from its centre: h.xy metres in the hole's plane (finished radius 9), h.z the route metre at which it starts
float mgHole(vec3 h, float speck){ float open = 9. * clamp((uS - h.z) / max(uHoleSpan, 1e-4), 0., 1.); return step(1e-4, open) * step(length(h.xy) + speck, open); }   // nothing of it before its metre
`;

// the gravel's rake (fragment shaders only): rows along x outside the round court, rings inside it, one damp ring at its
// rim; 1 on a damp line. Where the lines are finer than the picture's grain they are left out for an even share of damp.
export const RAKE_GLSL = /* glsl */`
float mgRake(vec3 w){
  float r = length(w.xz - uCourt.xy), inC = step(r, uCourt.z);
  float qx = w.x / 1.4, qr = r / 1.4, fw = mix(fwidth(qx), fwidth(qr), inC), q = mix(qx, qr, inC);
  float f = abs(fract(q) - .5), line = 1. - smoothstep(.07, .07 + fw, f);
  float damp = mix(.14, line, 1. - smoothstep(.12, .4, fw));
  return max(damp, step(abs(r - uCourt.z), .9));
}
`;

const HULL_VERT = /* glsl */`
attribute vec3 aFace; attribute float aCut; attribute vec3 aHole;
varying vec3 vCol; varying vec3 vLine; varying vec3 vW; varying vec3 vHole; varying vec3 vK; // vK: kind, cut metre, lit
varying float vStripe; varying float vAcross;
${STYLE_GLSL}
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  vec3 n = mat3(modelMatrix) * normal; n = n / max(length(n), 1e-5);
  float lit = step(.02, dot(n, uSun)) * (1. - aFace.y);
  vCol = aFace.z > .5 ? (lit > .5 ? uGold : uGoldShade) : mgTone(aFace.x, lit);   // uncut fur keeps the rule of two tones: gold in the sun, a deeper gold out of it
  vLine = aFace.z > .5 ? (lit > .5 ? uGoldShade : uGold) : (lit > .5 ? mgTone(aFace.x, 0.) : (aFace.x > 1.5 ? uShadeTone[1] : uShadeTone[0]));   // a shade face takes the next darker plant's shade (yew: none), so the palette holds
  vec3 t = cross(n, vec3(0., 1., 0.)); if (dot(t, t) < 1e-3) t = vec3(1., 0., 0.); t = normalize(t);
  vStripe = dot(w.xyz, cross(n, t)) / 1.3 + mgHash(floor(n * 9. + 4.5)) ;
  vAcross = dot(w.xyz, t) / 1.25;
  vW = w.xyz; vHole = aHole; vK = vec3(aFace.z, aCut, lit);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const HULL_FRAG = /* glsl */`
varying vec3 vCol; varying vec3 vLine; varying vec3 vW; varying vec3 vHole; varying vec3 vK;
varying float vStripe; varying float vAcross;
${STYLE_GLSL}
void main(){
  float sp = mgHash(floor(vW * 1.6));
  if (vK.x > .5 && vK.y + (sp - .5) * (vK.x > 1.5 ? .6 : 1.6) < uS) discard;   // the lump is sheared away, leaf-ragged front (kind 2: a fast front, finer rag); the rag is in metres of route
  if (mgHole(vHole, (sp - .5) * .5 - .12) > .5) discard;            // eye plugs empty from the centre; the finished cut is ragged between 8.28 and 8.75 m, inside the collar's solid (its chamfer reaches a tread's depth at 8.18, its wall stands at 8.87)
  vec3 c = vCol;
  float fw = fwidth(vStripe);
  if (vK.x < .5) {                                                  // hairline of shade where two blade passes overlap
    float f = abs(fract(vStripe) - .5);
    float ln = (1. - smoothstep(.022, .022 + fw, f)) * (1. - smoothstep(.035, .1, fw));
    c = mix(c, vLine, ln);
  } else {                                                          // uncut growth hangs in tufts: a row of scallops every 0.96 m up the face, each 1.25 m wide, drawn as a line of the other gold under each tuft
    float s = vStripe * 1.35, row = floor(s), fy = s - row;
    float fx = fract(vAcross + .5 * mod(row, 2.) + mgHash(vec3(row, 3., 7.))) - .5;
    float d = fy - 1.2 * fx * fx, fs = fwidth(s);
    float tick = smoothstep(0., fs, d) * (1. - smoothstep(.2, .2 + fs, d)) * (1. - smoothstep(.16, .45, fs));   // a line 0.19 m thick: left out where it is finer than the picture's grain
    c = mix(c, vLine, tick);
  }
  gl_FragColor = vec4(c, 1.);
}`;
/** Two-tone sheared solids and their gold lumps (see header for the attributes). */
export function hullMaterial() {
  return new THREE.ShaderMaterial({ uniforms: STYLE, vertexShader: HULL_VERT, fragmentShader: HULL_FRAG, side: THREE.DoubleSide });
}
/** The same hull geometry laid flat on the gravel (y = groundY) along the sun, in the shadow tone and, along the rake's lines, the damp shadow tone. */
export function shadowMaterial(groundY = 0) {
  return new THREE.ShaderMaterial({
    uniforms: { ...STYLE, uGy: { value: groundY + 0.06 } }, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: /* glsl */`
attribute vec3 aFace; attribute float aCut; attribute vec3 aHole; uniform float uGy;
varying vec3 vW; varying vec3 vHole; varying vec3 vK; varying vec3 vS;
${STYLE_GLSL}
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  vW = w.xyz; vHole = aHole; vK = vec3(aFace.z, aCut, 0.);
  w.xyz -= uSun * (max(w.y - uGy, 0.) / max(uSun.y, .08)); w.y = uGy;
  vS = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`,
    fragmentShader: /* glsl */`
varying vec3 vW; varying vec3 vHole; varying vec3 vK; varying vec3 vS;
${STYLE_GLSL}
${RAKE_GLSL}
void main(){
  float sp = mgHash(floor(vW * 1.6));
  if (vK.x > .5 && vK.y + (sp - .5) * (vK.x > 1.5 ? .6 : 1.6) < uS) discard;
  if (mgHole(vHole, (sp - .5) * .5 - .12) > .5) discard;
  gl_FragColor = vec4(mix(uShadow, uShadowDamp, mgRake(vS)), 1.);     // the rake's lines run on through a shadow
}` });
}

const CARD_VERT = /* glsl */`
attribute vec3 iPos; attribute vec3 iDir; attribute vec4 iData; attribute vec3 iHole;   // iData: cutS, age0, seed, code
varying vec3 vCol; varying vec3 vUv;                                                     // vUv: x, y, comb (clipped yew)
${STYLE_GLSL}
void main(){
  float cutS = iData.x, age0 = iData.y, seed = iData.z, code = iData.w;
  float kind = step(7.5, code); code -= 8. * kind; float lit = step(3.5, code); float plant = code - 4. * lit;
  float cut = step(cutS, uS);                                            // the shear has reached this card's place
  float old = clamp(-cutS / 300., 0., 1.);                               // a face cut before we came: its age, a state of the place
  float tuft = step(.86, mgHash(floor(iPos * .3) + 7.));                  // a tuft is missed, and comes back first
  float again = cut * (1. - kind) * step(seed, old * old * mix(.008, .4, tuft));   // fur that had come back before we came
  float shoot = max(1. - cut, again);                                    // 1 gold shoot, 0 clipped leaf
  float len = mix(.24 + .08 * seed, age0 * mix(1., .2 + .6 * old, again), shoot);
  float wid = mix(.42, .34 + .12 * seed, shoot);
  float show = mix(1., 1. - cut, kind) * (1. - mgHole(iHole, 0.));       // lump fur drops at the cut; nothing lives in a hole
  show *= mix(cut, 1., kind);                                            // a clipped leaf does not exist until its face is cut
  vec3 base = (modelMatrix * vec4(iPos, 1.)).xyz;
  vec3 axis = mat3(modelMatrix) * iDir;
  float ph = uTime * (1.9 + .9 * seed) + seed * 61. + base.x * .13 + base.z * .11;
  float gust = .55 + .45 * sin(base.x * .09 + base.z * .07 - uTime * 1.3);
  axis += shoot * vec3(sin(ph), .25 * sin(ph * 1.7 + 1.), cos(ph * .83)) * (.16 + .2 * seed) * (.5 + 1.1 * gust);   // shoots nod in a light air, in passing gusts
  axis = axis / max(length(axis), 1e-4);
  vec3 turn = vec3(sin(seed * 91.7), cos(seed * 47.3), sin(seed * 23.1 + 1.));   // each card lies as it grew: its own fixed turn about its stem
  vec3 side = cross(axis, turn); float sl = length(side);
  side = sl > 1e-3 ? side / sl : vec3(1., 0., 0.);
  vec3 p = base + (side * position.x * wid + axis * position.y * len) * show;
  float gap = kind * step(fract(seed * 7.31), mix(.07, 0., lit));                 // a few green gaps on the shade side of a lump
  float other = step(fract(seed * 13.7), mix(.18, .34, lit));                     // stipple: a third of the shoots on a lit face stand in their own shade, a fifth on a shade face catch the sun
  vCol = shoot > .5 ? mix(abs(lit - other) > .5 ? uGold : uGoldShade, uShadeTone[2], gap) : mgTone(plant, lit);
  vUv = vec3(position.xy, (1. - shoot) * (plant < .5 ? 1. : 0.));
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const CARD_FRAG = /* glsl */`
varying vec3 vCol; varying vec3 vUv;
void main(){
  // a clipped yew card is a comb: a rib and needles (where the needles are finer than the picture's grain, the flat shape)
  if (vUv.z > .5 && fwidth(vUv.y * 5.) < .45 && abs(vUv.x) > .06 && fract(vUv.y * 5.) > .55) discard;
  gl_FragColor = vec4(vCol, 1.);
}`;
/** Leaf cards: opaque, depth-written single triangles; a lump's gold shoots until its place is cut, a clipped face's leaves from its cut on (and tufts where that cut is old). */
export function cardMaterial() {
  return new THREE.ShaderMaterial({ uniforms: STYLE, vertexShader: CARD_VERT, fragmentShader: CARD_FRAG, side: THREE.DoubleSide });
}

/**
 * Facet builder: collects flat-normalled quads and triangles (the sheared planes) and the sites where leaf cards grow.
 *   const F = makeFacets(rng, sunLocal); F.quad(a, b, c, d, o); F.tri(a, b, c, o); const geo = F.geometry();
 * o = { plant 0..2, kind 0 clipped | 1 gold lump, cut: number | (p) => route metre (below 0: cut before we came, by
 *       that many days of regrowth; 1e6: not cut while we are here), hole: (p) => [x, y, start metre] | undefined,
 *       ref: Vector3 inside the form (normals are turned away from it) or nrm: Vector3 the normal must agree with,
 *       edge: cards per metre of facet edge, fur: cards per square metre, len: [min, max] shoot length }
 * F.occluders: array of (origin, dir) => boolean used to bake each face's "stands in another form's shadow" flag;
 *   an occluder with .tag is skipped for facets whose o.tag is the same (a form does not shade its own front).
 * F.keep: (p, reach, cut, kind) => boolean, set by the world: a card whose place fails it is never made (clear air by place).
 */
export function makeFacets(rng, sunLocal) {
  // growable typed buffers: plain arrays of a few million numbers cost the build a long copy at the end
  const buf = (n) => { let a = new Float32Array(n), len = 0; return { push() { const k = arguments.length; if (len + k > a.length) { const c = new Float32Array(Math.max(a.length * 2, len + k)); c.set(a); a = c; } for (let i = 0; i < k; i++) a[len++] = arguments[i]; }, view: () => a.subarray(0, len), size: () => len }; };
  const pos = buf(36000), nor = buf(36000), face = buf(36000), cut = buf(12000), hole = buf(36000), sites = buf(130000);
  const A = new THREE.Vector3(), B = new THREE.Vector3(), N = new THREE.Vector3(), C = new THREE.Vector3(), P = new THREE.Vector3(), E = new THREE.Vector3(), O = new THREE.Vector3();
  const NOHOLE = [1e3, 1e3, 1e9];
  const cutAt = (o, p) => (typeof o.cut === 'function' ? o.cut(p) : (o.cut ?? -300));
  const F = {
    occluders: [], faces: 0, edgeMult: 1, furMult: 1, keep: null, dropped: 0,
    shadowed(c, n, tag) {
      O.copy(c).addScaledVector(n, 0.35);
      for (const occ of F.occluders) if (!(tag && occ.tag === tag) && occ(O, sunLocal)) return true;
      return false;
    },
    poly(vs, o) {
      const n = vs.length;
      A.subVectors(vs[1], vs[0]); B.subVectors(vs[n - 1], vs[0]); N.crossVectors(A, B);
      if (n === 4) { A.subVectors(vs[2], vs[0]); B.subVectors(vs[3], vs[1]); N.crossVectors(A, B); }
      if (N.lengthSq() < 1e-8) return;
      N.normalize(); C.set(0, 0, 0); for (const v of vs) C.add(v); C.multiplyScalar(1 / n);
      let flip = false;
      if (o.ref) flip = N.dot(A.subVectors(C, o.ref)) < 0; else if (o.nrm) flip = N.dot(o.nrm) < 0;
      if (flip) N.negate();
      const kind = o.kind || 0, plant = o.plant || 0;
      const sh = kind ? (o.deep ? 1 : 0) : (F.shadowed(C, N, o.tag) ? 1 : 0);   // a lump's facet marked deep takes the deeper gold whatever its light (a band, an eye of the uncut fan)
      const lit = N.dot(sunLocal) > 0.02 && !sh ? 1 : 0;
      const order = n === 4 ? [0, 1, 2, 0, 2, 3] : [0, 1, 2];
      for (const i of order) {
        const v = vs[i], h = o.hole ? (o.hole(v) || NOHOLE) : NOHOLE;
        pos.push(v.x, v.y, v.z); nor.push(N.x, N.y, N.z); face.push(plant, sh, kind); cut.push(cutAt(o, v)); hole.push(h[0], h[1], h[2]);
      }
      F.faces++;
      const code = plant + 4 * lit + 8 * (kind ? 1 : 0), len = o.len || (kind ? [0.3, 0.75] : [0.35, 1.0]);
      const site = (p, dx, dy, dz) => {
        const h = o.hole ? (o.hole(p) || NOHOLE) : NOHOLE, c = cutAt(o, p), age = rng.range(len[0], len[1]), sd = rng();
        if (F.keep && !F.keep(p, kind ? age : Math.max(0.45, 0.8 * age), c, kind)) { F.dropped++; return; }   // a lump's shoot is age long; a clipped leaf asks 0.45 m (its card is 0.32 m long at most), a tuft come back 0.8 of its age
        sites.push(p.x, p.y, p.z, dx, dy, dz, c, age, sd, code, h[0], h[1], h[2]);
      };
      const ed = (o.edge ?? 0.5) * F.edgeMult, fur = (o.fur ?? 0.03) * F.furMult;
      if (ed > 0) for (let i = 0; i < n; i++) {                       // speckled edge: cards along every arris
        const a = vs[i], b = vs[(i + 1) % n], L = a.distanceTo(b);
        let k = L * ed; k = Math.floor(k) + (rng() < k % 1 ? 1 : 0);
        for (let j = 0; j < k; j++) {
          P.lerpVectors(a, b, rng()); E.subVectors(P, C).normalize();
          const s = 0.75, jx = rng.range(-0.35, 0.35), jy = rng.range(-0.35, 0.35), jz = rng.range(-0.35, 0.35);
          site(P, N.x + E.x * s + jx, N.y + E.y * s + jy, N.z + E.z * s + jz);
        }
      }
      if (fur > 0) {                                                  // fur on the face
        let area = 0; A.subVectors(vs[1], vs[0]); B.subVectors(vs[2], vs[0]); area += A.cross(B).length() * 0.5;
        if (n === 4) { A.subVectors(vs[2], vs[0]); B.subVectors(vs[3], vs[0]); area += A.cross(B).length() * 0.5; }
        let k = area * fur; k = Math.floor(k) + (rng() < k % 1 ? 1 : 0);
        for (let j = 0; j < k; j++) {
          let s = rng(), t = rng();
          if (n === 4) { A.lerpVectors(vs[0], vs[1], s); B.lerpVectors(vs[3], vs[2], s); P.lerpVectors(A, B, t); }
          else { if (s + t > 1) { s = 1 - s; t = 1 - t; } P.copy(vs[0]).addScaledVector(A.subVectors(vs[1], vs[0]), s).addScaledVector(B.subVectors(vs[2], vs[0]), t); }
          site(P, N.x + rng.range(-0.45, 0.45), N.y + rng.range(-0.45, 0.45) + (kind ? 0.25 : 0), N.z + rng.range(-0.45, 0.45));
        }
      }
    },
    quad(a, b, c, d, o) { F.poly([a, b, c, d], o); },
    tri(a, b, c, o) { F.poly([a, b, c], o); },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos.view(), 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor.view(), 3));
      g.setAttribute('aFace', new THREE.Float32BufferAttribute(face.view(), 3));
      g.setAttribute('aCut', new THREE.Float32BufferAttribute(cut.view(), 1));
      g.setAttribute('aHole', new THREE.Float32BufferAttribute(hole.view(), 3));
      return g;
    },
    /** the same, built attribute by attribute with a pause between (no long step on a big zone) */
    async geometryAsync(pause) {
      const g = new THREE.BufferGeometry();
      for (const [name, arr, n] of [['position', pos, 3], ['normal', nor, 3], ['aFace', face, 3], ['aCut', cut, 1], ['aHole', hole, 3]]) { g.setAttribute(name, new THREE.Float32BufferAttribute(arr.view(), n)); if (pause) await pause(); }
      return g;
    },
    get sites() { return sites.view(); }, triangles: () => pos.size() / 9,
  };
  return F;
}

/** Instanced leaf-card mesh from a facet builder's sites (13 floats a site). max caps the count; async: await it,
 *  and pass ctx.yield as pause so no step is long. */
export async function makeCards(sites, material, max = 1e9, pause) {
  const total = sites.length / 13, n = Math.min(total, Math.floor(max)), step = total / Math.max(n, 1);
  const iPos = new Float32Array(n * 3), iDir = new Float32Array(n * 3), iData = new Float32Array(n * 4), iHole = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    if (pause && i % 6000 === 5999) await pause();
    const s = Math.min(total - 1, Math.floor(i * step)) * 13;
    iPos[i * 3] = sites[s]; iPos[i * 3 + 1] = sites[s + 1]; iPos[i * 3 + 2] = sites[s + 2];
    const dx = sites[s + 3], dy = sites[s + 4], dz = sites[s + 5], l = Math.hypot(dx, dy, dz) || 1;
    iDir[i * 3] = dx / l; iDir[i * 3 + 1] = dy / l; iDir[i * 3 + 2] = dz / l;
    iData[i * 4] = sites[s + 6]; iData[i * 4 + 1] = sites[s + 7]; iData[i * 4 + 2] = sites[s + 8]; iData[i * 4 + 3] = sites[s + 9];
    iHole[i * 3] = sites[s + 10]; iHole[i * 3 + 1] = sites[s + 11]; iHole[i * 3 + 2] = sites[s + 12];
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0, 1, 0], 3));
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 3));
  g.setAttribute('iDir', new THREE.InstancedBufferAttribute(iDir, 3));
  g.setAttribute('iData', new THREE.InstancedBufferAttribute(iData, 4));
  g.setAttribute('iHole', new THREE.InstancedBufferAttribute(iHole, 3));
  g.instanceCount = n;
  const m = new THREE.Mesh(g, material); m.frustumCulled = false;
  return m;
}

const V = (x, y, z) => new THREE.Vector3(x, y, z);
// tail frame: hub, lean 20 degrees back; fan coords (a across, b up the fan, d depth toward the front)
const HUB = V(0, 26.5, -9), LEAN = 20 * Math.PI / 180;
const FU = V(0, Math.cos(LEAN), -Math.sin(LEAN)), FN = V(0, Math.sin(LEAN), Math.cos(LEAN));
const fanPt = (a, b, d) => V(HUB.x + a + 0 * d, HUB.y + b * FU.y + d * FN.y, HUB.z + b * FU.z + d * FN.z);
const toFan = (p) => { const x = p.x - HUB.x, y = p.y - HUB.y, z = p.z - HUB.z; return [x, y * FU.y + z * FU.z, y * FN.y + z * FN.z]; };
const TIERS = 11, TAIL_R = 45, EYE_R = 31.5, EYE_HOLE = 7.5, EYE_LIP = 8.4, BACK_D = -1.3;   // neighbouring collars (9.1 m at the foot) stand 18.4 m and more apart, centre to centre
const EYE_ANG = [20, 55, 90, 125, 160].map((d) => d * Math.PI / 180), OURS = 3;   // from the far tip round to the near one; ours is the fourth
// THE PEACOCK'S LAWS OF THE PLACE (typed; the same on every seed; metres of route SHORT OF THE EYE'S PASS THROUGH THE FAN):
//   the body: the shear starts at the crest BODY_LEAD m short of that pass and runs down to the drum's foot over BODY_SPAN m;
//   the tail: one front turns about a place TAIL_UNDER m under the hub, a half turn to TAIL_SWEEP m of route, from the far
//     tip (TAIL_LEAD m short, less the 7 m that place gives) round to the near tip, and a place is reached later by
//     TAIL_RIM m times its share of the fan's radius (so the whole fan, skirt and all, is cut 46 m short of the pass);
//   an eye starts to open EYE_AFTER m of route after the front has passed its centre, and is open uHoleSpan (8 m) later.
const BODY_LEAD = 340, BODY_SPAN = 58, TAIL_LEAD = 230, TAIL_SWEEP = 163, TAIL_UNDER = 6, TAIL_RIM = 27, EYE_AFTER = 7;
const bodyLaw = (p) => -BODY_LEAD + BODY_SPAN * Math.min(1, Math.max(0, (62 - p.y) / 62 + 0.05 * Math.sin(Math.atan2(p.x, p.z) * 2)));
const tailLawAt = (a, b) => -TAIL_LEAD + TAIL_SWEEP * Math.atan2(Math.max(b, 0) + TAIL_UNDER, a) / Math.PI + TAIL_RIM * Math.min(1, Math.hypot(a, Math.max(b, 0)) / TAIL_R);

/** What the world must know before it lays its route: this visit's lopsided tail and where our eye stands (local space). */
export function heroPlan(ctx) {
  const r = ctx.rng.fork ? ctx.rng.fork('peacock-plan') : ctx.rng, lop = r.range(-0.05, 0.05);
  const t = EYE_ANG[OURS], a = Math.cos(t) * EYE_R * (1 + lop * Math.cos(t)), b = Math.sin(t) * EYE_R;
  return { lop, eye: fanPt(a, b, 1), normal: FN.clone(), up: FU.clone(), radius: EYE_HOLE, bodyDone: BODY_SPAN - BODY_LEAD };   // bodyDone: the route metre, counted from the pass through the fan, at which the body's mound is wholly cut
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('peacock-yew') : ctx.rng;
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  setStylePalette(opts.palette, opts.tones);
  const sun = (opts.sun ? V(opts.sun[0], opts.sun[1], opts.sun[2]) : V(-0.74, 0.616, -0.27)).normalize();
  const group = new THREE.Group(); group.name = 'peacock-yew';
  const F = makeFacets(rng, sun);
  F.edgeMult = 2.4; F.furMult = 18; F.keep = opts.keep || null;
  const sEye = opts.sEye ?? 325, air = opts.air || (() => 1e9), airWide = opts.airWide || air;       // the route metre of the pass through the fan; clear air from the course to a local point
  const cutBody = (p) => sEye + bodyLaw(p), cutTail = (p) => { const q = toFan(p); return sEye + tailLawAt(q[0], q[1]); };
  const noise = ctx.noise, jit = (s = 0.15) => rng.range(-s, s);
  // grid of facets from a parametric surface; o may be an object or (i, j, centre) => object
  const C4 = V(0, 0, 0);
  let quadCount = 0;
  const sheet = async (nu, nv, fn, o, wrapU = false) => {
    const g = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) g.push(wrapU && i === nu ? g[j * (nu + 1)] : fn(i / nu, j / nv, i, j));
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = g[j * (nu + 1) + i], b = g[j * (nu + 1) + i + 1], c = g[(j + 1) * (nu + 1) + i + 1], d = g[(j + 1) * (nu + 1) + i];
      C4.copy(a).add(b).add(c).add(d).multiplyScalar(0.25);
      F.quad(a, b, c, d, typeof o === 'function' ? o(i, j, C4) : o);
      if ((++quadCount & 15) === 0) await ctx.yield();
    }
  };
  // per-seed character: a lopsided tail, a lean, how shaggy, where the crest sits
  const lop = opts.plan ? opts.plan.lop : 0, bellyAmt = rng.range(0.5, 1.2), nSeg = 40, shag = rng.range(0.85, 1.15);
  const eyes = EYE_ANG.map((t) => { const a = Math.cos(t) * EYE_R * (1 + lop * Math.cos(t)), b = Math.sin(t) * EYE_R; return { a, b, u: sEye + tailLawAt(a, b) + EYE_AFTER }; });
  const holeFor = (c) => {                                     // one eye per facet (chosen at its centre), exact for every point
    const [a, b] = toFan(c); let best = eyes[0], bd = 1e9;
    for (const e of eyes) { const d = Math.hypot(a - e.a, b - e.b); if (d < bd) { bd = d; best = e; } }
    if (bd > 22) return undefined;
    const s = 9 / EYE_LIP; return (p) => { const q = toFan(p); return [(q[0] - best.a) * s, (q[1] - best.b) * s, best.u]; };
  };
  // analytic occluders for the baked "stands in shadow" flag: the tail slab (with its eyes), the body, the drum tiers
  const inEye = (a, b) => { for (const e of eyes) if (Math.hypot(a - e.a, b - e.b) < EYE_HOLE) return true; return false; };
  const tailOcc = (o, d) => {                                  // tail: plane d = 1.5 in fan coords
    const [a, b, dd] = toFan(o), vd = d.y * FN.y + d.z * FN.z; if (Math.abs(vd) < 1e-4) return false;
    const t = (1.5 - dd) / vd; if (t < 0.4) return false;
    const pa = a + d.x * t, pb = b + (d.y * FU.y + d.z * FU.z) * t;
    return pb > -17 && Math.hypot(pa, Math.max(pb, 0)) < TAIL_R - 1 && Math.abs(pa) < TAIL_R - 1 && !inEye(pa, pb);
  };
  tailOcc.tag = 'tail'; F.occluders.push(tailOcc);
  const ell = (cx, cy, cz, rx, ry, rz) => (o, d) => {         // ray against an ellipsoid
    const ox = (o.x - cx) / rx, oy = (o.y - cy) / ry, oz = (o.z - cz) / rz, dx = d.x / rx, dy = d.y / ry, dz = d.z / rz;
    const A = dx * dx + dy * dy + dz * dz, B = ox * dx + oy * dy + oz * dz, Cc = ox * ox + oy * oy + oz * oz - 1;
    if (Cc < 0) return false; const disc = B * B - A * Cc; return disc > 0 && -B - Math.sqrt(disc) > 0.3 * A;
  };
  F.occluders.push(ell(0, 30, 4, 12.5, 12, 13.5), ell(0, 45, 9.3, 2.6, 6, 2.9), ell(-1.4, 52.6, 10.4, 5.6, 3.5, 3.5));
  F.occluders.push(ell(0, 15, 0, 23, 6.6, 23), ell(0, 8, 0, 35, 7.6, 35));

  // ---- the tail: eleven shingled tiers, each a 4 m band stepping back toward the rim ------------------------------
  // profile across one tier: a broad tread leaning toward the hub (shade), then a riser falling 1.25 m and facing
  // outward (it takes the sun over the left and the crown): edges e = 2k (tier start) and 2k + 1 (the nose)
  const tierTop = (k) => 1.7 + 0.55 * (TIERS - k), NOSE = 0.68;
  const rOf = (k, th) => (k === 0 ? 0.6 : 1 + 4 * k) * (1 + lop * Math.cos(th));
  const rEdge = (e, th) => { const k = e >> 1; return e & 1 ? rOf(k, th) + NOSE * (rOf(k + 1, th) - rOf(k, th)) : rOf(k, th); };
  const dEdge = (e) => tierTop(e >> 1) + (e & 1 ? 0.7 : 0);
  const wob = []; for (let e = 0; e <= 2 * TIERS; e++) { wob.push([]); for (let i = 0; i <= nSeg; i++) wob[e].push([jit(0.012), jit(0.15), jit(0.12)]); }
  const tierPt = (e, i) => {
    const w = wob[e][i], th = Math.PI * (1 - i / nSeg) + (i > 0 && i < nSeg ? w[0] : 0), r = rEdge(e, th) + w[1];
    return fanPt(Math.cos(th) * r, Math.sin(th) * r, dEdge(e) + w[2]);
  };
  const tailO = (c) => ({ plant: 1, kind: 0, cut: cutTail, hole: holeFor(c), nrm: FN, edge: 0.5, fur: 0.035, tag: 'tail' });   // the fan's treads are box, its risers golden yew; the bird before it is yew
  for (let e = 0; e < 2 * TIERS; e++) {
    await sheet(nSeg, 1, (u, v, i, j) => tierPt(e + j, i), (i, j, c) => (e & 1 ? { ...tailO(c), plant: 2, edge: 0.7 } : tailO(c)));
    await ctx.yield();
  }
  const SK = 20.6, SKL = 23.5, skTaper = (b) => 1 + 0.16 * b / SK;   // the skirt: the tail's foot, sunk into the drum's first tier at its corners (SKL: the uncut slab's, sunk likewise)
  const polar = (th, r, d) => fanPt(Math.cos(th) * r * (1 + lop * Math.cos(th)), Math.sin(th) * r, d);
  const rimD = tierTop(TIERS), backD = (r) => BACK_D - bellyAmt * 0.5 * Math.sin(Math.min(1, r / (TAIL_R + 0.2)) * Math.PI);   // the back bellies out between hub and rim
  await sheet(nSeg, 1, (u, v, i, j) => (j ? polar(Math.PI * (1 - u), TAIL_R + 0.2, BACK_D) : tierPt(2 * TIERS, i)), { plant: 0, cut: cutTail, ref: HUB, edge: 0.6, fur: 0.05 });
  const footJ = [[], []]; for (let k = 0; k <= 9; k++) for (const f of footJ) f.push(k > 0 && k < 9 ? jit(0.12) : 0);   // the back's two foot rows wander once: the skirt's back hangs from them
  await sheet(nSeg, 9, (u, v, i, j) => polar(Math.PI * (1 - u), v * (TAIL_R + 0.2), backD(v * (TAIL_R + 0.2)) + (i === 0 ? footJ[0][j] : i === nSeg ? footJ[1][j] : j > 0 && j < 9 ? jit(0.12) : 0)),   // its rim row is the rim strip's own back edge
    (i, j, c) => ({ plant: 0, cut: cutTail, hole: holeFor(c), nrm: V(0, -FN.y, -FN.z), edge: 0.3, fur: 0.02 }));
  await ctx.yield();
  for (const s of [-1, 1]) {
    const th = s < 0 ? Math.PI : 0, rr = (k) => rOf(k, th) * s, re = (e) => rEdge(e, th) * s;
    // each strip's rows are shared with its neighbour (one wander an edge and row), and the first row is the fan's own foot
    const skw = []; for (let e = 0; e <= 2 * TIERS; e++) { skw.push([]); for (let j = 0; j <= 4; j++) skw[e].push([jit(), jit(0.1)]); }
    const skPt = (e, j) => (j === 0 ? tierPt(e, s < 0 ? 0 : nSeg) : fanPt(re(e) * skTaper(-j / 4 * SK) + skw[e][j][0], -j / 4 * SK, dEdge(e) + skw[e][j][1]));
    for (let e = 0; e < 2 * TIERS; e++) await sheet(1, 4, (u, v, i, j) => skPt(e + i, j), { plant: e & 1 ? 2 : 1, cut: cutTail, nrm: FN, edge: 0.4, fur: 0.03, tag: 'tail' });
    await sheet(1, 4, (u, v, i, j) => (i ? fanPt(s * (TAIL_R + 0.2) * (1 + lop * s) * skTaper(-v * SK), -v * SK, BACK_D) : skPt(2 * TIERS, j)), { plant: 0, cut: cutTail, nrm: V(s, 0, 0), edge: 0.5, fur: 0.04 });   // the side wall: its front edge is the last strip's own, its back edge the rim's
  }
  // the skirt's back: its top row is the back's own foot row, its two side columns are the side walls' back edges
  const backA = [], backF = [];
  for (let k = 9; k >= 0; k--) { backA.push(-(k / 9) * (TAIL_R + 0.2) * (1 - lop)); backF.push(backD(k / 9 * (TAIL_R + 0.2)) + footJ[0][k]); }
  for (let k = 1; k <= 9; k++) { backA.push((k / 9) * (TAIL_R + 0.2) * (1 + lop)); backF.push(backD(k / 9 * (TAIL_R + 0.2)) + footJ[1][k]); }
  await sheet(backA.length - 1, 4, (u, v, i, j) => fanPt(backA[i] * skTaper(-v * SK), -v * SK, j === 0 ? backF[i] : BACK_D + (backF[i] - BACK_D) * (1 - v) + (i > 0 && i < backA.length - 1 ? jit(0.12) : 0)), { plant: 0, cut: cutTail, nrm: V(0, -FN.y, -FN.z), edge: 0.25, fur: 0.02 });
  await ctx.yield();
  // eye collars: a lime golden-yew rim standing proud of the tiers, chamfered into the hollow, and the yew lining
  const nE = 22, COL_D = 6.2;   // proud of the highest tier nose under any collar (5.8)
  for (const e of eyes) {
    const ring = (r, d) => (u) => { const t = u * Math.PI * 2; return fanPt(e.a + Math.cos(t) * r, e.b + Math.sin(t) * r, d); };
    const prof = [[EYE_LIP + 0.7, 1.2], [EYE_LIP + 0.55, COL_D], [EYE_LIP - 0.1, COL_D + 0.05], [EYE_HOLE, 3.3], [EYE_HOLE, BACK_D - 0.95], [EYE_LIP + 0.6, BACK_D - 0.95], [EYE_LIP + 0.7, BACK_D + 0.6]];   // the back ring stands behind the back's deepest belly (0.6)
    const cw = prof.map(() => { const a = []; for (let i = 0; i < nE; i++) a.push(V(jit(0.06), jit(0.06), jit(0.06))); return a; });   // one wander a ring and place, shared by the strips either side
    const axisPt = fanPt(e.a, e.b, 1);
    for (let s = 0; s < prof.length - 1; s++) {
      const p0 = ring(prof[s][0], prof[s][1]), p1 = ring(prof[s + 1][0], prof[s + 1][1]), lining = s === 3;
      const far = (c) => V(axisPt.x + (c.x - axisPt.x) * 3, axisPt.y + (c.y - axisPt.y) * 3, axisPt.z + (c.z - axisPt.z) * 3);
      await sheet(nE, 1, (u, v, i, j) => (j ? p1(u) : p0(u)).add(cw[s + j][i % nE]), (i, j, c) => {
        const o = { plant: lining ? 0 : 2, cut: cutTail, edge: lining ? 0.2 : 0.7, fur: lining ? 0 : 0.06 };
        if (s === 0 || s === 5) o.ref = axisPt; else if (s === 1) o.nrm = FN; else if (s === 4) o.nrm = V(0, -FN.y, -FN.z); else o.ref = far(c);
        return o;
      }, true);
    }
  }
  await ctx.yield();
  // the uncut tail: one shaggy gold fan that hides tiers and collars until the shear reaches them
  const lumpD = (a, b) => 10.3 - 0.085 * Math.hypot(a, Math.max(b, 0)) + 1.5 * (0.5 + 0.5 * noise.fbm2(a * 0.045 + 3, b * 0.045, 2));   // 0.4 m and more over every collar's top ring (6.3 at 42.5 m from the hub at most)
  const lumpO = (nrm, ref) => (i, j, c) => ({ plant: 0, kind: 1, cut: cutTail, hole: holeFor(c), nrm, ref, edge: 0.35 * shag, fur: 0.085 * shag });
  const LR = TAIL_R + 2.6, lumpB = (a, b) => BACK_D - 1.7 - 1.2 * (0.5 + 0.5 * noise.fbm2(a * 0.05 + 11, b * 0.05 + 7, 2));
  // its front stands in 22 bands, two to each tier beneath, every other one in the deeper gold, and over each eye
  // to be a round boss in the deeper gold with a gold heart: the uncut fan is a peacock's tail already, in gold
  const bandR = (j) => (j >= 23 ? LR : 0.5 + (TAIL_R - 0.5) * j / 22);   // 22 bands to the tiers' rim, then the lump's own rim band
  await sheet(32, 23, (u, v, i, j) => { const th = Math.PI * (1 - u), r = bandR(j), a = Math.cos(th) * r, b = Math.sin(th) * r; return fanPt(a, b, lumpD(a, b)); }, (i, j, c) => ({ ...lumpO(FN)(i, j, c), deep: j % 2 === 1 && j < 22 }));
  for (const e of eyes) {
    const bp = (r, t) => { const a = e.a + Math.cos(t) * r, b = e.b + Math.sin(t) * r; return fanPt(a, b, lumpD(a, b) + (r > 8.5 ? 0 : 0.4)); };
    const bo = (deep) => (i, j, c) => ({ plant: 0, kind: 1, cut: cutTail, hole: holeFor(c), nrm: FN, edge: 0.25 * shag, fur: 0.05 * shag, deep });
    await sheet(18, 1, (u, v, i, j) => bp(j ? 4.6 : 0.01, u * Math.PI * 2), bo(false), true);
    await sheet(18, 1, (u, v, i, j) => bp(j ? 8.4 : 4.6, u * Math.PI * 2), bo(true), true);
    await sheet(18, 1, (u, v, i, j) => bp(j ? 8.9 : 8.4, u * Math.PI * 2), bo(true), true);
  }
  await sheet(32, 1, (u, v, i, j) => { const th = Math.PI * (1 - u), a = Math.cos(th) * LR, b = Math.sin(th) * LR; return fanPt(a, b, j ? lumpB(a, b) : lumpD(a, b)); }, lumpO(null, HUB));
  await sheet(32, 5, (u, v) => { const th = Math.PI * (1 - u), r = 0.5 + v * (LR - 0.5); const a = Math.cos(th) * r, b = Math.sin(th) * r; return fanPt(a, b, lumpB(a, b)); }, lumpO(V(0, -FN.y, -FN.z)));
  // the skirts' top rows are the front's and the back's own foot rows (the same places, the same lumpD and lumpB), so no slit opens between them
  const footA = [], footB = []; for (let j = 23; j >= 0; j--) footA.push(-bandR(j)); for (let j = 0; j <= 23; j++) footA.push(bandR(j));
  for (let k = 5; k >= 0; k--) footB.push(-(0.5 + k / 5 * (LR - 0.5))); for (let k = 0; k <= 5; k++) footB.push(0.5 + k / 5 * (LR - 0.5));
  await sheet(footA.length - 1, 3, (u, v, i) => { const a = footA[i]; return fanPt(a * skTaper(-v * SKL), -v * SKL, lumpD(a, 0)); }, lumpO(FN));
  await sheet(footB.length - 1, 3, (u, v, i) => { const a = footB[i]; return fanPt(a * skTaper(-v * SKL), -v * SKL, lumpB(a, 0)); }, lumpO(V(0, -FN.y, -FN.z)));
  for (const s of [-1, 1]) await sheet(1, 3, (u, v, i, j) => fanPt(s * LR * skTaper(-v * SKL), -v * SKL, i ? lumpB(s * LR, 0) : lumpD(s * LR, 0)), lumpO(V(s, 0, 0)));
  await ctx.yield();
  // ---- the drum: three battered tiers, each rim chamfered in lime golden yew -------------------------------------
  const DRUM = [[48, 0, 9, 56], [35, 9, 16, 44], [23, 16, 22, 32]];
  const body = (plant, extra = {}) => ({ plant, cut: cutBody, edge: 0.5, fur: 0.035, ...extra });
  for (const [R, y0, y1, n] of DRUM) {
    const ph = rng() * 6.28, ax = V(0, (y0 + y1) / 2, 0), pt = (u, r, y) => { const t = ph + u * Math.PI * 2; return V(Math.sin(t) * r, y, Math.cos(t) * r); };
    const yc = y1 - 1.3;
    // the wall's top row and the chamfer's two rows are made once and shared by the strips that meet there
    const rowA = [], rowB = []; for (let i = 0; i < n; i++) { rowA.push(pt(i / n, R - 0.7, yc).add(V(jit(0.08), jit(0.05), jit(0.08)))); rowB.push(pt(i / n, R - 2.2, y1).add(V(jit(0.08), jit(0.05), jit(0.08)))); }
    await sheet(n, 2, (u, v, i, j) => (j === 2 ? rowA[i % n] : pt(u, R - 0.7 * v + bellyAmt * 0.6 * Math.sin(v * Math.PI) + jit(), y0 + (yc - y0) * v)), body(0, { ref: ax }), true);
    await sheet(n, 1, (u, v, i, j) => (j ? rowB : rowA)[i % n], body(2, { ref: V(0, y0 - 20, 0), edge: 0.7, fur: 0.06 }), true);
    await sheet(n, 1, (u, v, i, j) => (j ? pt(u, R - 14.5, y1 + jit(0.06)) : rowB[i % n]), body(0, { nrm: V(0, 1, 0), edge: 0.2 }), true);
    await ctx.yield();
  }
  // ---- the bird: a breast of great sheared facets (staggered rings of triangles), a slender neck, and a small plain
  // head held IN PROFILE (it looks toward local -x, the side the route rounds), with a long wedge of a beak in golden yew
  const RINGS = [[22, 2, 12.5, 13.5], [25.2, 2.6, 13.7, 14.7], [29, 3.6, 13.4, 14.7], [33, 4.8, 11.4, 12.8], [36.5, 6, 8.0, 9.6], [39.5, 7.3, 4.8, 5.8],
    [42, 8.4, 3.2, 3.8], [44.5, 9.2, 2.5, 2.9], [47, 9.8, 2.4, 2.7], [49.6, 10.2, 2.6, 2.9]];
  const NS = 16, lean = rng.range(-0.035, 0.035);
  const ringPts = RINGS.map(([y, cz, rx, rz], j) => {
    const a = [];
    for (let i = 0; i < NS; i++) {
      const t = (i + (j % 2) * 0.5) / NS * Math.PI * 2, c = Math.cos(t), wing = y > 24 && y < 37 && Math.abs(Math.sin(t)) > 0.62 && c < 0.5 ? 1.13 : 1, ledge = j > 0 && j < 7 && j % 2 === 1 ? 1.075 : 1, keel = (c > 0 ? 1 + 0.2 * c * c : 0.92) * wing * ledge;
      a.push(V(Math.sin(t) * rx * wing * ledge + (y - 22) * lean + jit(), j ? y + jit(0.2) : y - 0.3, cz + c * rz * keel + jit()));   // the foot ring is sunk in the drum's top
    }
    return a;
  });
  for (let j = 0; j < RINGS.length - 1; j++) {
    const L = ringPts[j], U = ringPts[j + 1], ref = V(0, (RINGS[j][0] + RINGS[j + 1][0]) / 2, (RINGS[j][1] + RINGS[j + 1][1]) / 2), o = body(0, { ref, edge: 0.55 });
    for (let i = 0; i < NS; i++) {
      const i1 = (i + 1) % NS;
      if (j % 2 === 0) { F.tri(L[i], L[i1], U[i], o); F.tri(L[i1], U[i1], U[i], o); } else { F.tri(L[i], L[i1], U[i1], o); F.tri(L[i], U[i1], U[i], o); }
      if (i % 8 === 7) await ctx.yield();
    }
  }
  const HEAD = V(0 + 31 * lean, 51, 10.8), HC = V(HEAD.x - 1.4, 52.6, 10.4), HR = [5.6, 3.5, 3.5];   // the head: an ellipsoid lying along x
  { const T = ringPts[RINGS.length - 1], apex = V(HEAD.x, 50.6, 10.3); for (let i = 0; i < NS; i++) F.tri(T[i], T[(i + 1) % NS], apex, body(0, { ref: V(HEAD.x, 48, 10.2) })); }
  await sheet(8, 5, (u, v) => { const a = u * Math.PI * 2, b = (v - 0.5) * Math.PI, w = v > 0 && v < 1 ? 0.08 : 0; return V(HC.x - Math.sin(b) * HR[0] + jit(w), HC.y + Math.cos(b) * Math.cos(a) * HR[1] + jit(w), HC.z + Math.cos(b) * Math.sin(a) * HR[2] + jit(w)); }, body(0, { ref: HC, edge: 0.7 }), true);   // both poles closed
  { // the beak: one long wedge, golden yew, no face; its root (2.26 m from the axis at its corners) is sunk in the head, whose flats stand 2.46 m from the axis there
    const bx = HC.x - 3.2, tip = V(HC.x - 13.0, 51.6, 10.4), q = [V(bx, 54.2, 10.4 - 1.6), V(bx, 54.2, 10.4 + 1.6), V(bx, 51.0, 10.4 + 1.2), V(bx, 51.0, 10.4 - 1.2)];
    for (let i = 0; i < 4; i++) F.tri(q[i], q[(i + 1) % 4], tip, body(2, { ref: V(bx - 2, 52.5, 10.4), edge: 0.8 }));
  }
  await ctx.yield();
  // the crest: five golden-yew balls on canes
  const crest = [], caneSegs = [];
  for (let i = 0; i < 5; i++) {
    const t = (i - 2) * 0.4 + jit(0.05), len = 7.6 + rng.range(-0.5, 0.7) - Math.abs(i - 2) * 0.45, c = V(HEAD.x + Math.sin(t) * len, 55 + Math.cos(t) * len, 10.4 - 0.2 * len + jit(0.3)), r = 1.5 + jit(0.15);
    crest.push(c); caneSegs.push([V(HEAD.x + Math.sin(t) * 0.6, 55, 10.6), c.clone(), 0.24, 1e6]);
    await sheet(7, 4, (u, v) => { const a = u * Math.PI * 2, b = (v - 0.5) * Math.PI * 0.94; return V(c.x + Math.cos(b) * Math.cos(a) * r, c.y + Math.sin(b) * r * 1.05, c.z + Math.cos(b) * Math.sin(a) * r); }, body(2, { ref: c, edge: 1.1, fur: 0.12 }), true);
  }
  // ---- the mound the bird is cut out of: one shaggy gold lump over drum, breast, neck, head and crest ------------
  const PROF = [[0, 53, 0], [8, 51, 0], [14, 41.5, 0], [21, 30, 1], [26, 20.5, 2.5], [34, 17, 5], [40, 12.5, 7.5], [46, 11.5, 9.5], [52, 17.0, 10.4], [58, 11.5, 10.5], [63.5, 6, 10.4], [66.8, 0.4, 10.4]];
  const prof = (v) => { const x = v * (PROF.length - 1), i = Math.min(PROF.length - 2, Math.floor(x)), f = x - i, a = PROF[i], b = PROF[i + 1]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; };
  // a place on the mound's face: round the axis by t, at height y, `off` m proud of it (the bumps are gentler at the foot,
  // where the first drum tier stands inside the gold: 3.9 m at the mean, 0.55 m and more)
  const moundAt = (t, v, off = 0) => {
    const [y, r, cz] = prof(v), bump = 1 + (y < 12 ? 0.05 : 0.09) * noise.fbm2(Math.sin(t) * 2.2 + 9, y * 0.07 + Math.cos(t) * 2.2, 2), rr = r * bump + off;
    return V(Math.sin(t) * rr + (y > 22 ? (y - 22) * lean : 0), y, cz + Math.cos(t) * rr * (Math.cos(t) > 0 && y > 22 ? 1.12 : 1));
  };
  await sheet(30, 22, (u, v) => moundAt(u * Math.PI * 2, v), (i, j, c) => ({ plant: 0, kind: 1, cut: cutBody, ref: V(0, Math.min(c.y, 55), c.y > 22 ? 6 : 0), edge: 0.35 * shag, fur: 0.085 * shag }), true);
  await ctx.yield();
  // ---- meshes: hull + lump in one geometry, its shadow, the leaf cards -------------------------------------------
  const hullGeo = await F.geometryAsync(ctx.yield);
  hullGeo.boundingSphere = new THREE.Sphere(V(0, 35, 0), 140);
  const hull = new THREE.Mesh(hullGeo, hullMaterial()); hull.frustumCulled = false; group.add(hull);
  const shadow = new THREE.Mesh(hullGeo, shadowMaterial(0)); shadow.frustumCulled = false; shadow.renderOrder = 1; group.add(shadow);
  await ctx.yield();
  const cardBudget = Math.max(20000, 150000 - 2 * F.triangles() - 23000) * (0.4 + 0.6 * (detail - 0.6) / 0.4);
  const cards = await makeCards(F.sites, cardMaterial(), cardBudget, ctx.yield); group.add(cards);
  await ctx.yield();
  // ---- clippings: a closed-form shower off every front; each drifts and falls until it meets the gravel, the drum
  // (a tier's top, chamfer or wall), the bird or the clipped fan's own face, and lies there (one caught on a wall, on
  // the bird or on the fan stays where it met it). A clipping off the fan's face starts 1.7 m and more before the clipped
  // tiers' noses and is sent out at 3.2 to 4.4 m/s along its own facing, so that all but a few clear the tiers that lean out
  // under it (they come forward 2.9 m/s under a fall at full speed); one that does not lies where it meets them.
  // A clipping passes the fur of a lump not yet cut; only sheared bodies stop it.
  // BY PLACE: a clipping whose whole fall would come within 2.5 m (and its own reach) of the eye's course is never made
  const inDrum = (x, y, z) => {                                 // gravel and the three tiers as built: bellied wall, chamfer, flat top
    if (y <= 0) return true; const r = Math.hypot(x, z);
    for (const [R, y0, y1] of DRUM) {
      if (y > y1 || y < y0) continue; const yc = y1 - 1.3, v = (y - y0) / (yc - y0);
      if (r <= (y > yc ? R - 0.7 - 1.5 * (y - yc) / 1.3 : R - 0.7 * v + bellyAmt * 0.6 * Math.sin(v * Math.PI))) return true;
    }
    return false;
  };
  // breast and neck by their rings with ledges, wings and keel (0.97: a little inside the facets; a wing's edge slopes
  // over 22.5 degrees from a plain corner to a winged one, taken where the staggered rings stand least, so the test is
  // inside the facets there too: nowhere outside them, more than 0.5 m inside on one place in twenty-three of breast
  // and neck and 1.95 m at the most, in slivers at the wings' edges), and the head (0.9 of its ellipsoid: between its
  // arrises and its flats)
  const birdRing = RINGS.map(([y, cz, rx, rz], j) => { const ledge = j > 0 && j < 7 && j % 2 === 1 ? 1.075 : 1; return [y, cz, rx * ledge, rz * ledge, y > 24 && y < 37 ? 1.13 : 1]; });
  const inBird = (x, y, z) => {
    if (y >= 22 && y <= 49.6) {
      let j = 0; while (j < birdRing.length - 2 && y > birdRing[j + 1][0]) j++;
      const A = birdRing[j], B = birdRing[j + 1], f = (y - A[0]) / (B[0] - A[0]), cz = A[1] + (B[1] - A[1]) * f, rx = A[2] + (B[2] - A[2]) * f, rz = A[3] + (B[3] - A[3]) * f, wing = A[4] + (B[4] - A[4]) * f;
      const xn = (x - (y - 22) * lean) / rx, zn = (z - cz) / rz; let k = 1, h = Math.hypot(xn, zn);
      if (h < 1e-6) return true;
      for (let q = 0; q < 3; q++) { const c = zn / k / h; k = c > 0 ? 1 + 0.2 * c * c : 0.92; h = Math.hypot(xn, zn / k); }
      const t = Math.atan2(Math.abs(xn), zn / k) * 180 / Math.PI;        // round the breast from the keel, in degrees
      if (h < 0.97 * (1 + (wing - 1) * Math.min(1, Math.max(0, Math.min(t - 56.25, 146.25 - t) / 22.5)))) return true;
    }
    const hx = (x - HC.x) / HR[0], hy = (y - HC.y) / HR[1], hz = (z - HC.z) / HR[2];
    return hx * hx + hy * hy + hz * hz < 0.81;
  };
  // the clipped fan as built, less its wander (0.15 m): from its bellied back to the tiers' own saw (a tread rising
  // 0.7 m to its nose, a riser falling 1.25 m), its rim lopsided as built, its skirt drawn in toward the foot, its
  // eyes open (a collar's proud rim is not asked: a clipping that meets one comes to rest on the tier inside it)
  const inTail = (x, y, z) => {
    const fy = y - HUB.y, fz = z - HUB.z, a = x - HUB.x, b = fy * FU.y + fz * FU.z, d = fy * FN.y + fz * FN.z;
    if (b <= -SK || d >= tierTop(0) + 0.7 || Math.abs(a) >= TAIL_R * 1.05) return false;
    let r, rb;                                                  // r: the tiers' own radius there (lopsided along their rays); rb: the back's (lopsided across only)
    if (b < 0) rb = r = Math.abs(a) / skTaper(b) / (1 + lop * Math.sign(a));
    else { const h = Math.hypot(a, b) || 1e-9; r = h / (1 + lop * a / h); let th = Math.atan2(b, a); th = Math.atan2(b * (1 + lop * Math.cos(th)), a); rb = Math.hypot(a / (1 + lop * Math.cos(th)), b); }
    const w = Math.min(1, Math.max(0, (d - BACK_D) / (rimD - BACK_D)));                    // the rim strip runs from the last tier's edge to the back's rim, 0.2 m further out
    if (w * r / TAIL_R + (1 - w) * rb / (TAIL_R + 0.2) >= 1 || d <= BACK_D + (backD(rb) - BACK_D) * (b < 0 ? 1 + b / SK : 1)) return false;
    const k = Math.min(TIERS - 1, Math.max(0, Math.floor((r - 1) / 4))), r0 = k ? 1 + 4 * k : 0.6, f = Math.min(1, Math.max(0, (r - r0) / (5 + 4 * k - r0)));
    return d < tierTop(k) + (f < NOSE ? 0.7 * f / NOSE : 0.7 - 1.25 * (f - NOSE) / (1 - NOSE)) && !inEye(a, b);
  };
  const solidAt = (x, y, z) => inDrum(x, y, z) || inBird(x, y, z) || inTail(x, y, z);
  const nClip = Math.round(9000 * detail), cOrg = new Float32Array(nClip * 3), cVel = new Float32Array(nClip * 3), cData = new Float32Array(nClip * 4);
  const S = F.sites;                                            // one view (the getter makes a new one each time)
  const nSites = S.length / 13; let made = 0, clipDropped = 0;
  for (let tries = 0; made < nClip && tries < nClip * 12; tries++) {
    if (tries % 150 === 0) await ctx.yield();
    const s = Math.floor(rng() * nSites) * 13; if (S[s + 9] < 8) continue;          // lumps only: that is what is cut off
    const onFan = S[s + 5] > 0.3 && S[s + 1] > 27 && S[s + 2] < -4;
    if (!onFan && rng() > 0.4) continue;                                                 // most come off the tail's face
    const x = S[s], y = S[s + 1], z = S[s + 2]; let dx = S[s + 3], dz = S[s + 5];
    if (inDrum(x, y - 0.3, z) || inBird(x, y, z) || inTail(x, y, z)) continue;           // a site sunk in the drum, in the bird or in the clipped fan sheds nothing
    const hl = Math.hypot(dx, dz) || 1, sp = onFan ? rng.range(3.2, 4.4) : rng.range(1.6, 3.2); dx = dx / hl * sp; dz = dz / hl * sp;
    const late = rng.range(0, 5.7), sd = rng(), size = rng() < 0.06 ? rng.range(1.3, 1.7) : rng.range(0.6, 1.2);   // a few big sheets
    const fallY = (t) => y - 5.5 * (t - (1 - Math.exp(-1.3 * t)) / 1.3);
    let tl = 0.25, near = air(x, y, z), met = false;                                       // find where it first meets a body, by quarter seconds
    for (; tl < 30; tl += 0.25) { const yy = fallY(tl); near = Math.min(near, air(x + dx * tl, yy, z + dz * tl)); if (solidAt(x + dx * tl, yy, z + dz * tl)) { met = true; break; } }
    if (met) { let lo = tl - 0.25, hi = tl; for (let q = 0; q < 7; q++) { const m = (lo + hi) / 2; if (solidAt(x + dx * m, fallY(m), z + dz * m)) hi = m; else lo = m; } tl = hi; }   // then the moment itself, to 2 ms: it does not sink and jump
    if (near < 2.5 + 0.9 + 1.1 * size) { clipDropped++; continue; }                        // 0.9 + 1.1 x size covers its flutter (1.04 m at most) and its half length (0.62 x size)
    cOrg[made * 3] = x; cOrg[made * 3 + 1] = y; cOrg[made * 3 + 2] = z; cVel[made * 3] = dx; cVel[made * 3 + 1] = tl; cVel[made * 3 + 2] = dz;
    cData[made * 4] = S[s + 6] + late; cData[made * 4 + 1] = sd; cData[made * 4 + 2] = fallY(tl);
    cData[made * 4 + 3] = size;
    made++;
  }
  const clipGeo = new THREE.InstancedBufferGeometry();
  clipGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.62, 0, 0, 0, 0, -0.2, 0.62, 0, 0.04, 0, 0, 0.22], 3));   // a leaf-shaped sliver
  clipGeo.setIndex([0, 1, 2, 0, 2, 3]);
  clipGeo.setAttribute('iOrg', new THREE.InstancedBufferAttribute(cOrg, 3));
  clipGeo.setAttribute('iVel', new THREE.InstancedBufferAttribute(cVel, 3));
  clipGeo.setAttribute('iData', new THREE.InstancedBufferAttribute(cData, 4));
  clipGeo.instanceCount = Math.max(1, made);
  const clips = new THREE.Mesh(clipGeo, clippingMaterial()); clips.frustumCulled = false; group.add(clips);
  await ctx.yield();
  // ---- tackle: pale strings along every edge about to be cut, canes ribbing the back of the tail ------------------
  const segs = caneSegs.slice();                                    // [a, b, width, the route metre after which it is gone]
  for (let k = 1; k <= TIERS; k++) for (let i = 0; i < 40; i++) {   // a string over each tier's arris, on the uncut fur
    const p = (j) => { const th = Math.PI * (1 - j / 40), r = rEdge(2 * k - 1, th), a = Math.cos(th) * r, b = Math.sin(th) * r; return fanPt(a, b, lumpD(a, b) + 0.45); };
    const a = p(i), b = p(i + 1); segs.push([a, b, 0.07, Math.min(cutTail(a), cutTail(b)) - 0.9]);
  }
  for (const y of [12, 19, 27, 36, 45, 54, 61]) for (let i = 0; i < 30; i++) {
    const pv = (() => { let lo = 0, hi = 1; for (let it = 0; it < 14; it++) { const m = (lo + hi) / 2; if (prof(m)[0] < y) lo = m; else hi = m; } return lo; })();
    const p = (j) => moundAt(j / 30 * Math.PI * 2, pv, 0.45);            // on the fur, 0.45 m proud of the mound's face
    const a = p(i), b = p(i + 1); segs.push([a, b, 0.07, Math.min(cutBody(a), cutBody(b)) - 0.9]);
  }
  const nearEye = (A, B) => { const q = toFan(A), w = toFan(B), a = (q[0] + w[0]) / 2, b = (q[1] + w[1]) / 2; return eyes.some((e) => Math.hypot(a - e.a, b - e.b) < EYE_LIP + 1.6); };   // no cane or tie crosses an eye hollow
  for (let c = 0; c <= 12; c++) for (let i = 0; i < 16; i++) {       // canes ribbing the back, hub to rim
    const th = Math.PI * (0.04 + 0.92 * c / 12), p = (j) => { const r = 3 + j / 16 * (TAIL_R - 4); return polar(th, r, backD(r) - 0.26); };   // against the back's own belly: clear of its wander (0.12) and their own half width
    const a = p(i), b = p(i + 1); if (!nearEye(a, b)) segs.push([a, b, 0.13, 1e6]);
  }
  for (const r of [15, 27, 39]) for (let i = 0; i < 36; i++) {       // string ties across the canes
    const p = (j) => polar(Math.PI * (0.04 + 0.92 * j / 36), r, backD(r) - 0.36);
    const a = p(i), b = p(i + 1); if (!nearEye(a, b)) segs.push([a, b, 0.07, 1e6]);
  }
  const tackle = makeTackle(segs.filter(([a, b, w]) => air((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2) > 2.5 + w + a.distanceTo(b) / 2)); group.add(tackle);
  await ctx.yield();
  // ---- the flock: sixty blackbird cut-outs wheeling over the crest. BY PLACE, for the whole flight and on every seed:
  // each bird's whole ring of wander, wing and all, lies above the uncut mound's top (so above crest, head and beak, cut
  // or uncut), in front of the uncut fan's gold face, and 2.5 m clear of the eye's course (a ring is drawn in until it
  // fits, never a bird moved aside; one that fits at no size of 5 m and more is not there)
  const flockAt = V(HEAD.x, 53, 9), FLOCK_FLOOR = Math.max(PROF[PROF.length - 1][0] + 0.8, ...crest.map((c) => c.y + 1.75)) + 0.3;   // the mound's top with its longest shoots (0.75 m); the crest's balls top out lower and are asked all the same
  let flockNotMade = 0;
  if (opts.flock !== false) {
    const nB = Math.round(60 * detail), orb = new Float32Array(nB * 4), bs = new Float32Array(nB * 3);
    let nMade = 0;
    for (let k = 0; k < nB; k++) {
      let r = rng.range(7, 18); const lift = rng.range(0, 5.5), ph = rng() * 6.283, w = rng.range(0.22, 0.4) * (rng() < 0.85 ? 1 : -1), sd = rng(), tilt = rng.range(-0.15, 0.15), size = rng.range(0.8, 1.25);
      const wing = 1.4 * size, half = () => 2.5 + Math.abs(tilt) * 1.18 * r, y0of = () => FLOCK_FLOOR - flockAt.y + wing + half() + lift;   // its lowest wing tip stands `lift` over the floor
      const fits = () => {
        const R = 1.18 * r, h = half(), cy = flockAt.y + y0of();
        if (airWide(flockAt.x, cy, flockAt.z) - 2.5 < Math.hypot(R, h) + wing) return false;                    // the course
        for (let q = 0; q < 48; q++) for (const py of [cy - h, cy + h]) {                                       // the uncut fan's gold face (lumpD at its fullest)
          const a = q / 48 * 6.2832, fx = flockAt.x + Math.sin(a) * R - HUB.x, fy = py - HUB.y, fz = flockAt.z + Math.cos(a) * R - HUB.z;
          const fb = fy * FU.y + fz * FU.z, fd = fy * FN.y + fz * FN.z, fr = Math.hypot(fx, Math.max(fb, 0));
          if (fr < LR + wing + 0.4 && fb > -SKL - wing && fd < 11.8 - 0.085 * fr + wing + 0.4) return false;
        }
        return true;
      };
      for (let q = 0; q < 60 && r >= 5 && !fits(); q++) r *= 0.95;
      if (r < 5 || !fits()) { flockNotMade++; continue; }           // no ring of 5 m and more fits: it is not there
      const i = nMade++;
      orb[i * 4] = r; orb[i * 4 + 1] = y0of(); orb[i * 4 + 2] = ph; orb[i * 4 + 3] = w; bs[i * 3] = sd; bs[i * 3 + 1] = tilt; bs[i * 3 + 2] = size;
      if (k % 10 === 9) await ctx.yield();
    }
    const bg = new THREE.InstancedBufferGeometry();   // body diamond + tail + two wings; y of 'position' carries the wing weight
    bg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.5, 0.11, 0, 0, -0.11, 0, 0, 0.11, 0, 0, -0.11, 0, 0, 0, 0, -0.62, 0.1, 0, 0.22, 0.1, 0, -0.16, 0.8, 1, -0.2, -0.1, 0, 0.22, -0.1, 0, -0.16, -0.8, 1, -0.2], 3));
    bg.setAttribute('iOrb', new THREE.InstancedBufferAttribute(orb, 4)); bg.setAttribute('iSeed', new THREE.InstancedBufferAttribute(bs, 3)); bg.instanceCount = nMade;
    const birds = new THREE.Mesh(bg, birdMaterial(flockAt)); birds.frustumCulled = false; birds.name = 'flock'; group.add(birds);
  }
  // ---- anchors (local space) --------------------------------------------------------------------------------------
  const eyePos = (e, d = 1) => fanPt(e.a, e.b, d), ours = eyes[OURS], E = eyePos(ours);
  const anchors = {
    eye: { position: E, normal: FN.clone(), radius: EYE_HOLE, openAt: ours.u + STYLE.uHoleSpan.value },
    eyes: eyes.map((e) => ({ position: eyePos(e), radius: EYE_HOLE, openAt: e.u + STYLE.uHoleSpan.value })),
    head: HEAD.clone(), crest: crest.map((c) => c.clone()), hub: HUB.clone(), flock: flockAt.clone(), sunLocal: sun.clone(),
  };
  return {
    object: group, radius: 57, height: 74, center: V(0, 33, -4), anchors, ground: true, groundY: 0,   // radius and height are the Peacock's own form; the flock wheels over it, under 89 m
    /** the eye's place: metres of route flown; every cut, eye and shower is a function of it (the world writes STYLE itself before each draw) */
    setProgress(s) { STYLE.uS.value = s; },
    update(dt, time) { STYLE.uTime.value = time; },
    dispose() { group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); },
    stats: { hullTriangles: F.triangles(), cards: cards.geometry.instanceCount, clippings: made, clippingsNotMade: clipDropped, cardsNotMade: F.dropped, flockNotMade, sites: F.sites.length / 13 },
  };
}

/** Strings and canes from segments [a, b, width, the route metre after which it is gone]: each is two flat tapes
 *  crossed at right angles along its own line, so it shows from every side; nothing of it turns to the eye. */
export function makeTackle(segs) {
  const nS = segs.length, tp = new Float32Array(nS * 24), ts = new Float32Array(nS * 24), tn = new Float32Array(nS * 24), th = new Float32Array(nS * 8), ti = [];
  const d = new THREE.Vector3(), n1 = new THREE.Vector3(), n2 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), ax = new THREE.Vector3(1, 0, 0);
  segs.forEach(([a, b, w, hide], s) => {
    d.subVectors(b, a).normalize(); n1.crossVectors(d, Math.abs(d.y) > 0.95 ? ax : up).normalize(); n2.crossVectors(d, n1).normalize();
    for (let q = 0; q < 8; q++) {
      const end = (q & 2) ? b : a, n = q < 4 ? n1 : n2, sg = (q & 1) ? 0.5 : -0.5, o = s * 24 + q * 3;
      tp[o] = end.x; tp[o + 1] = end.y; tp[o + 2] = end.z; ts[o] = n.x * sg * w; ts[o + 1] = n.y * sg * w; ts[o + 2] = n.z * sg * w;
      tn[o] = n1.x; tn[o + 1] = n1.y; tn[o + 2] = n1.z; th[s * 8 + q] = hide;
    }
    for (const q of [0, 4]) ti.push(s * 8 + q, s * 8 + q + 1, s * 8 + q + 2, s * 8 + q + 2, s * 8 + q + 1, s * 8 + q + 3);
  });
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.BufferAttribute(tp, 3)); tg.setAttribute('aSide', new THREE.BufferAttribute(ts, 3)); tg.setAttribute('aThrum', new THREE.BufferAttribute(tn, 3)); tg.setAttribute('aHide', new THREE.BufferAttribute(th, 1)); tg.setIndex(ti);
  const tackle = new THREE.Mesh(tg, tackleMaterial()); tackle.frustumCulled = false; tackle.name = 'tackle';
  return tackle;
}

/** The shower: instanced quads (iOrg, iVel = drift x / landing time / drift z, iData = birth metre, seed, resting height, size).
 *  A clipping is born at its birth metre (its place's cut and up to 5.7 m of chance, the maker's choice); its fall is drawn
 *  by the eye's place: uFall metres of route to one second of fall (so a still at one place of the route is the same however
 *  we came to it). Over its last 0.8 s of fall it settles: flutter, roll and size ease to a leaf of litter lying flat. */
export function clippingMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: STYLE, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec3 iOrg; attribute vec3 iVel; attribute vec4 iData;
varying vec3 vCol;
${STYLE_GLSL}
void main(){
  float t = (uS - iData.x) / uFall, on = step(0., t), seed = iData.y;
  float tl = iVel.y, tt = clamp(t, 0., tl), glide = smoothstep(0., .8, tl - tt);   // 1 in the air, easing to 0 over its last 0.8 s of fall: it settles, nothing snaps
  vec3 p = iOrg + vec3(iVel.x, 0., iVel.z) * tt;
  p.y = max(iOrg.y - 5.5 * (tt - (1. - exp(-1.3 * tt)) / 1.3), iData.z);
  p.xz += glide * vec2(sin(tt * 2.1 + seed * 30.), cos(tt * 1.7 + seed * 17.)) * .45 * min(tt, 1.);
  float air = glide * on;                                             // while it falls it also flutters on the garden's clock
  p.xz += air * .28 * vec2(sin(uTime * 1.7 + seed * 50.), cos(uTime * 1.3 + seed * 31.)); p.y += air * .16 * sin(uTime * 2.3 + seed * 70.);
  p.y = max(p.y, iData.z) + (.09 + .06 * seed) * (1. - glide);        // never under where it will lie; at rest a little proud of it
  float yaw = seed * 40. + tt * (1.5 + 2. * seed) + air * .9 * sin(uTime * (.9 + seed) + seed * 23.), roll = seed * 17. + tt * (3. + 3. * seed) + uTime * (1.6 + 2. * seed);
  float cr = mix(1., cos(roll), glide), sr = sin(roll) * glide;       // the roll flattens as it settles
  vec3 e1 = vec3(cos(yaw), 0., sin(yaw)), e2 = vec3(-sin(yaw) * cr, sr, cos(yaw) * cr);
  vec3 wp = (modelMatrix * vec4(p, 1.)).xyz;
  float s = mix(.2 + .2 * seed, iData.w, glide) * on;                 // a sheet in the air; a leaf of litter once it lies
  wp += mat3(modelMatrix) * (e1 * position.x + e2 * position.z * (iData.w > 1.5 ? 1.7 : 1.)) * s;
  vCol = seed < .62 ? uGold : (seed < .74 ? uShadeTone[2] : uSunTone[0]);
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`,
    fragmentShader: /* glsl */`varying vec3 vCol; void main(){ gl_FragColor = vec4(vCol, 1.); }` });
}

/** Strings and canes: see makeTackle(). aHide: the route metre after which the string is gone (cut with its edge). */
export function tackleMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: STYLE, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec3 aSide; attribute vec3 aThrum; attribute float aHide;
${STYLE_GLSL}
void main(){
  float left = aHide - uS, show = step(0., left);
  float thrum = (1. - smoothstep(0., 14., left)) * step(aHide, 5e5) * .07 * sin(uTime * 31. + position.x * .9 + position.y * .7);   // the string sings as the cut nears: the last 14 m of route
  vec3 p = position + (aSide + aThrum * thrum) * show;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`,
    fragmentShader: /* glsl */`
${STYLE_GLSL}
void main(){ gl_FragColor = vec4(uTackle, 1.); }` });
}

/** Blackbirds: flat cut-outs in the darkest yew tone, four eased wing poses, each wheeling on its own ring about the upright through a point (local to the mesh), iOrb.y above it. */
export function birdMaterial(centre = new THREE.Vector3()) {
  return new THREE.ShaderMaterial({
    uniforms: { ...STYLE, uHead: { value: centre.clone() } }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec4 iOrb; attribute vec3 iSeed; uniform vec3 uHead;
${STYLE_GLSL}
void main(){
  float ang = iOrb.z + uTime * iOrb.w, r = iOrb.x * (1. + .18 * sin(ang * 2. + iSeed.x * 9.));
  vec3 c = uHead + vec3(sin(ang) * r, iOrb.y + 2.5 * sin(ang * 1.3 + iSeed.x * 20.) + iSeed.y * r * sin(ang), cos(ang) * r);
  vec3 fwd = sign(iOrb.w) * vec3(cos(ang), 0., -sin(ang)), right = vec3(fwd.z, 0., -fwd.x);
  float ph = fract(uTime * (1.6 + iSeed.x) + iSeed.x * 7.) * 4., k = floor(ph), f = smoothstep(0., 1., fract(ph));
  float p0 = k < .5 ? .95 : (k < 1.5 ? .15 : (k < 2.5 ? -.75 : .15)), p1 = k < .5 ? .15 : (k < 1.5 ? -.75 : (k < 2.5 ? .15 : .95));
  float wa = mix(p0, p1, f), wv = position.y;
  vec3 l = vec3(position.x * mix(1., cos(wa), wv), wv * abs(position.x) * sin(wa), position.z);
  vec3 wc = (modelMatrix * vec4(c, 1.)).xyz;
  vec3 wp = wc + mat3(modelMatrix) * (right * l.x + vec3(0., 1., 0.) * l.y + fwd * l.z) * (iSeed.z * 1.4);
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`,
    fragmentShader: /* glsl */`
${STYLE_GLSL}
void main(){ gl_FragColor = vec4(uBird, 1.); }` });
}
