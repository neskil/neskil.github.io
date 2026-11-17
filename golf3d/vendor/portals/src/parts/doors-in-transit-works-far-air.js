// doors-in-transit: THE FAR STORE'S AIR AND PAINT (the works builder's part). Everything beyond the hall's end wall is
// PAINTED, NOT LIT: no light of ours stands there. Each thing shows its own paint as the air about it lights it (one
// colour for the whole store, uLit) and then takes the far air BY ITS OWN PLACE IN THE WORLD (the plan's farAir,
// pasted here as the plan gives it): none at the opening, wholly air at the store's far end, far sides and top.
// Nothing here is cut, sized, hidden or faded by where the lens is or by how far a thing is from it, and none of it
// takes the hall's own haze. The one thing read of the picture is the pixel's footprint on a drawn line (the
// face's own derivatives), which filters the frame, the panels and the paving's joints as every drawn line of this
// world is filtered.
import { FAR, FAR_AIR_GLSL, DOOR } from './doors-in-transit-plan.js';

// THE RULE FOR look.farAir (the far air's colour: one Color for the whole visit, set by the world in the look it
// hands to every part). The store lies beyond the -z end. WITH THE SUN AT THAT END we look into the light and the
// air between the ranks glows: a BRIGHT WARM haze, the hall's own haze of the hour steeped in the colour of the
// sun's light (multiplied by that colour drawn six tenths of the way from white) at eight tenths of its strength:
// deeper and warmer than the hall's haze, and bright. WITH THE SUN AT THE +z END the light comes from behind us
// and the far air is plain: a COOLER, PALER haze, the hall's haze drawn six tenths of the way to a pale grey-blue.
// Between the two by the sun's bearing alone: `toward` is 1 with the sun due -z and 0 with it due +z (half of one
// less the cosine of its bearing from +z), eased.
export function farAirColour(THREE, sunDir, haze, light) {
  const flat = Math.hypot(sunDir.x, sunDir.z), toward = flat > 1e-6 ? 0.5 - 0.5 * sunDir.z / flat : 0.5;
  const warm = new THREE.Color(haze).multiply(new THREE.Color(1, 1, 1).lerp(new THREE.Color(light), 0.6)).multiplyScalar(0.8);
  const cool = new THREE.Color(haze).lerp(new THREE.Color('#dfe8ee'), 0.6).multiplyScalar(0.94);
  return cool.lerp(warm, toward * toward * (3 - 2 * toward));
}
// how the far air lights a paint: the air's tint (its colour at full strength) drawn half way to white, at
// eighty-five hundredths (a face turned from the sun in a bright haze: about as the hall's own doors stand at its
// far end)
export function farLit(THREE, air) {
  const most = Math.max(air.r, air.g, air.b, 1e-3);
  return new THREE.Color(1, 1, 1).lerp(air.clone().multiplyScalar(1 / most), 0.5).multiplyScalar(0.85);
}

const N = (v) => Number(v).toFixed(3);
const XG = N(FAR.xGone), DROP = N(DOOR.drop), DEPTH = N(DOOR.depth);
export const FRAME = 0.42;            // a far door's frame: this wide at the jambs and the head
export const SLAB = 6, JOINT = 0.18;  // the far floor's paving: square flags this wide, with joints this wide

// what every material of the far store shares: its place in the world, the plan's law, the paint and the air
const SHARED = /* glsl */`
uniform vec3 uFarAir, uLit;
varying vec3 vWorld;
${FAR_AIR_GLSL}
vec4 farPaint(vec3 paint) { return vec4(mix(paint * uLit, uFarAir, farAir(vWorld)), 1.); }
`;

// ---- the doors: a thin box and two flat straps (the near ranks) or one face (the rest), instanced. Each glides
// across on the world's clock from its own dealt place, and comes in again at the other end, where the air is whole.
const DOOR_VERT = /* glsl */`
attribute float aKind;      // 0: a corner of the door's own box; 1: of a hanger strap
attribute vec4 aPlace;      // its place along its rail at clock 0, the rail's height, the rank's z, the rail's speed (signed)
attribute vec4 aSize;       // its width, its height, the leaf's style (0..3, and 4 more if round-headed), its frame (0..3)
attribute vec3 aPaint;
uniform float uTime; uniform vec3 uStrap;
varying vec3 vWorld; varying vec3 vPaint; varying vec3 vFlat; varying vec4 vFace; varying vec2 vWhat;
void main() {
  float x = mod(aPlace.x + aPlace.w * uTime + ${XG}, 2. * ${XG}) - ${XG};
  float body = 1. - aKind, front = body * step(.5, normal.z);
  vec3 q = vec3(position.x * mix(1., aSize.x, body), mix(mix(aSize.y, ${DROP}, position.y), position.y * aSize.y, body), position.z * mix(1., ${DEPTH}, body));
  vec4 wp = modelMatrix * vec4(x + q.x, aPlace.y - ${DROP} + q.y, aPlace.z + q.z, 1.);
  vWorld = wp.xyz; vPaint = aPaint;
  // the frame: white, cream, stone or wood, as the hall's door kinds deal theirs (the joiner's four, doors.js)
  vec3 frame = aSize.w < .5 ? vec3(.60, .59, .55) : aSize.w < 1.5 ? vec3(.56, .49, .33) : aSize.w < 2.5 ? vec3(.36, .35, .32) : vec3(.22, .135, .07);
  vFlat = mix(uStrap, frame * mix(.8, 1., front), body);      // a strap; the box's sides, head and sill; the frame on its face
  vFace = vec4(q.x + .5 * aSize.x, q.y, aSize.x, aSize.y);     // metres on the face from its lower corner; the face's size
  vWhat = vec2(front, aSize.z);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const DOOR_FRAG = /* glsl */`
varying vec3 vPaint; varying vec3 vFlat; varying vec4 vFace; varying vec2 vWhat;
${SHARED}
void main() {
  vec3 col = vFlat;
  if (vWhat.x > .5) {
    vec2 f = vFace.xy, s = vFace.zw, px = fwidth(f) + 1e-4;
    float style = floor(vWhat.y + .5), arch = step(3.5, style); style -= 4. * arch;
    // the leaf inside its frame, round-headed on some: above its springing it keeps inside the half circle
    vec2 ls = s - vec2(2. * ${N(FRAME)}, ${N(FRAME)}), lf = f - vec2(${N(FRAME)}, 0.);
    float leaf = clamp(min(lf.x, ls.x - lf.x) / px.x + .5, 0., 1.) * clamp((ls.y - lf.y) / px.y + .5, 0., 1.);
    float r = .5 * ls.x; vec2 c = lf - vec2(r, ls.y - r);
    leaf *= mix(1., clamp((r - length(c)) / max(px.x, px.y) + .5, 0., 1.), arch * step(0., c.y));
    // its fields: four sunk panels, two tall ones, seven planks with dark joints, or three panels one over another
    bool planks = style > 1.5 && style < 2.5;
    vec2 cells = style < .5 ? vec2(2., 2.) : style < 1.5 ? vec2(2., 1.) : planks ? vec2(7., 1.) : vec2(1., 3.);
    vec2 g = lf / ls * cells, e = (.5 - (planks ? .05 : .4) * cells / ls - abs(fract(g) - .5)) / (fwidth(g) + 1e-4);
    float field = clamp(e.x + .5, 0., 1.) * clamp(e.y + .5, 0., 1.);
    col = mix(vFlat, vPaint * (planks ? mix(.7, 1., field) : mix(1., .8, field)), leaf);
  }
  gl_FragColor = farPaint(col);
}`;

// ---- the iron: plain boxes (rails, gantry posts), instanced by their middle and their size, in the works' green
const IRON_VERT = /* glsl */`
attribute vec3 aBoxC; attribute vec3 aBoxD;
varying vec3 vWorld; varying float vTone;
void main() {
  vec4 wp = modelMatrix * vec4(aBoxC + position * aBoxD, 1.);
  vWorld = wp.xyz; vTone = .82 + .18 * normal.z + .1 * normal.y;      // painted tones by the way a face looks: no light
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const IRON_FRAG = /* glsl */`
uniform vec3 uPaint; varying float vTone;
${SHARED}
void main() { gl_FragColor = farPaint(uPaint * vTone); }`;

// ---- the ground and the sheets that close the view. The ground: plain large paving by place, a soft shade painted
// under every rank's line, under the far air. A sheet: the far air's colour and nothing else (it stands where the
// plan's law gives air alone, so the ground and the ranks meet it without a seam)
const GROUND_VERT = /* glsl */`
attribute float aSheet; varying vec3 vWorld; varying float vSheet;
void main() { vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz; vSheet = aSheet; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const GROUND_FRAG = /* glsl */`
uniform vec3 uPaint; varying float vSheet;
${SHARED}
void main() {
  if (vSheet > .5) { gl_FragColor = vec4(uFarAir, 1.); return; }
  vec2 p = vWorld.xz / ${N(SLAB)}, px = fwidth(p) + 1e-5;
  // a joint is a thin line: the share of the pixel it covers, never more than its own width in pixels
  vec2 line = clamp((${N(JOINT / SLAB / 2)} - (.5 - abs(fract(p) - .5))) / px + .5, 0., 1.) * min(vec2(1.), ${N(JOINT / SLAB)} / px);
  float flag = (1. - line.x) * (1. - line.y);
  float own = fract(dot(floor(p), vec2(.3183, .7071))) * clamp(1.5 - max(px.x, px.y), 0., 1.);      // each flag a little its own tone, while a flag is wider than a pixel
  float dz = abs(mod(${N(FAR.first)} - vWorld.z + ${N(FAR.step / 2)}, ${N(FAR.step)}) - ${N(FAR.step / 2)});
  float under = step(vWorld.z, ${N(FAR.first + FAR.step / 2)}) * step(${N(FAR.first - FAR.step * (FAR.ranks - 0.5))}, vWorld.z);
  gl_FragColor = farPaint(uPaint * (.93 + .09 * own) * mix(.8, 1., flag) * (1. - .22 * under * exp(-dz * dz / 30.)));
}`;

// the three materials. U: { uTime, uFarAir, uLit } (one set of uniforms for the whole far store)
export function farMaterials(THREE, U, paints) {
  const mk = (vertexShader, fragmentShader, more, side) => new THREE.ShaderMaterial({ uniforms: Object.assign({ uTime: U.uTime, uFarAir: U.uFarAir, uLit: U.uLit }, more),
    vertexShader, fragmentShader, fog: false, side: side || THREE.FrontSide });
  return {
    doors: mk(DOOR_VERT, DOOR_FRAG, { uStrap: { value: new THREE.Color(paints.strap) } }),
    iron: mk(IRON_VERT, IRON_FRAG, { uPaint: { value: new THREE.Color(paints.iron) } }),
    ground: mk(GROUND_VERT, GROUND_FRAG, { uPaint: { value: new THREE.Color(paints.ground).multiplyScalar(paints.groundLit) } }, THREE.DoubleSide),
  };
}
