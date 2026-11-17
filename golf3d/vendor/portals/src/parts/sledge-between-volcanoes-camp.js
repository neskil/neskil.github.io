// THE SLEDGE BETWEEN THE VOLCANOES: the camp on the plateau. One low ridge tent lit from inside (two poles, a ridge,
// two slopes, two low walls and a leaning triangular end at each pole), its cloth working in the wind and the shadows
// of the two on its walls; snow banked on its windward end and low along its two long walls, a drift tail in its lee;
// the sledge tipped on its side at the windward end, its load to the tent, where the track ends; two pairs of skis
// planted upright beside the sledge; guy lines from the pole heads and the eaves to lumps of snow; the track that
// comes up from the lip and ends here. The lamp's light on the snow is the lamp's through the cloth (CLOTH_THROUGH).
// Declared footprint fade: the cloth's five down-slope seams are drawn as their mean over the pixel's footprint
// along the tent (a seam narrower than the pixel pales by the share of the pixel it fills).
//   makeCamp(ctx, S, opts) -> { object, light (the ONE point light of the world), emitters (vapour from the vent, for
//                               the world's sprite draw), setLit(k), update(time) }
import * as THREE from 'three';
import { smoothstep } from '../kit/core.js';
import { sharedUniforms, SBV_NOISE, SBV_LIGHT, Acc } from './sledge-between-volcanoes-common.js';
import { makeTrack, addSledge } from './sledge-between-volcanoes-travellers.js';

// How far the camp reaches from the tent's middle, in metres over the ground: the farthest thing that stands in it is
// the stern of the tipped sledge (6.4 m), then the snow lump of the back pole's guy line (5.7 m). The world measures
// the road's clearance of the camp by this.
export const CAMP_REACH = 6.5;
// (third part, C1) what the cloth lets through: the share of the lamp's light that falls on the land's snow round the
// tent (the world's one point light: live's strength times this), so that the snow at the wall's foot is amber as
// the cloth is. The camp's own things take the lamp by their own shares in the props' shader (which multiply this).
// (fourth part, E1b: 0.6; it was 0.3, too dim. The number was tuned on the camp as a whole: from looks drawn by
// chance along the whole approach to the camp on a dusk, a night and a copper visit, for the snow at the wall's foot
// to be plainly warm, dimmer than the cloth at its brightest, never white, and gone within a tent's length.)
const CLOTH_THROUGH = 0.6;
// the tent: local metres, long axis z, the door at +z, the floor at y = 0
// low and long, of undyed canvas (dun), with no hoops: the cloth hangs from a ridge between the two ends
const TENT = { hx: 1.5, hz: 3.1, h: 1.16, ribs: 2 };
// THE LIGHT OUT OF THE DOOR on the snow before it: ONE declaration, read by the props' shader below (the camp's own
// snow: the banked snow, the drift tail, the guy lines' lumps) and by the land's shader in the world. A small pool:
// its middle at the door's own foot, half a metre out from the tent's end down its long axis; it fades by a
// measure of 1.8 m, so it has no edge; its strength 0.2 of the lamp's colour, times the lamp's strength as the
// flame breathes (uLit here; the world hands the land the same number, the camp's `litNow`). The pool is this
// polish's own; live has none. (fifth part, J2: it was 1.3 m out, 2.6 m and 0.55, and the snow by the door was
// brighter than the cloth. Tuned on the camp as a whole, with the tent's shade, on looks drawn by chance on a
// dusk, a night and a copper visit.)
// tent: the tent's middle (world x, z) and its long axis (x, z)
const DOOR = { at: TENT.hz + 0.5, r: 1.8, k: 0.2 };
export const DOOR_POOL = /* glsl */`
float sbvDoorPool(vec2 xz, vec4 tent){ vec2 dd = xz - (tent.xy + tent.zw*${DOOR.at.toFixed(2)}); return ${DOOR.k.toFixed(2)}*exp(-dot(dd, dd)/${(DOOR.r * DOOR.r).toFixed(3)}); }
`;
const TENT_HEM = 0.95;      // the tent's floor: half its width at the hem (its half length is TENT.hz)
// (fourth part, E1b; fifth part, P2) THE TENT'S OWN SHADE: ONE rule, stated here once and read by the props' shader
// below and by the land's shader in the world. The tent shades the SKY's light on what lies at its foot: 0.85 of it
// at the hem, falling off by the distance from the tent's own floor with a measure of 2 m (a tenth of it left 4.3 m
// out). The lamp's and the door's light come from the tent and are not shaded by it, so they show warm there.
// (fifth part, J2: 0.85 at the hem and 2 m; it was 0.65 and 1.4 m. Tuned with the door's pool, on the camp as a
// whole, on looks drawn by chance on a dusk, a night and a copper visit.)
// tent: the tent's middle (world x, z) and its long axis (x, z)
export const TENT_SHADE = /* glsl */`
float sbvTentShade(vec2 xz, vec4 tent){ vec2 tl = xz - tent.xy; tl = vec2(tl.x*tent.w - tl.y*tent.z, dot(tl, tent.zw));
  return 1. - .85*exp(-length(max(abs(tl) - vec2(${TENT_HEM.toFixed(2)}, ${TENT.hz.toFixed(2)}), 0.))/2.); }
`;
// the two poles stand TENT_POLE either side of the middle (0.62 m in from the ends); the guy lines hold the eaves out
// under the poles and 1.1 m either side of the middle. Every line that needs the poles' place reads it here.
const TENT_POLE = 2.48, TENT_GUYS = [-TENT_POLE, -1.1, 1.1, TENT_POLE];
const TENT_VS = /* glsl */`
attribute vec2 aUv;          // x: 0..1 along the tent, y: 0..1 over the arch from one hem to the other
uniform float uTime; uniform vec4 uTentWind;      // wind in the tent's own frame (x, z), strength, ribs
varying vec3 vW, vN, vL; varying vec2 vUv;
${SBV_NOISE}
void main(){
  // cloth between the ribs is loose: it bellies and snaps with gusts that travel down the wind
  // (third part, C1) held along the ridge, at the eaves and at the hem: loose on each slope and each wall between them
  float rib = abs(sin(aUv.x*3.14159265*uTentWind.w)), sl = abs(1. - 2.*aUv.y);
  float arch = sl < .625 ? sin(sl*5.0265482) : .5*sin((sl - .625)*8.3775804);
  float loose = rib*rib*arch;
  float gust = sN2(vec2(dot(position.xz, uTentWind.xy)*.9 - uTime*3.1, uTime*.6));
  float snap = sin(uTime*11. + aUv.x*23. + aUv.y*7.)*.5 + sin(uTime*17.3 + aUv.x*41.)*.3;
  vec3 p = position + normal*loose*(-.05 + .05*gust + .016*snap*(.4 + gust))*uTentWind.z;
  vec4 w = modelMatrix*vec4(p, 1.); vW = w.xyz; vL = p; vUv = aUv;
  vN = normalize(mat3(modelMatrix)*(normal + vec3(0., .0, .0)));
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
const TENT_FS = /* glsl */`
precision highp float;
varying vec3 vW, vN, vL; varying vec2 vUv;
uniform float uTime, uLit; uniform vec3 uCloth, uLamp, uLampAt; uniform vec4 uTentWind; uniform vec4 uBodies;      // uBodies: where each of the two sits, in the tent's frame: A (x, z), B (x, z)
${SBV_NOISE}
${SBV_LIGHT}
const float POLE_U = ${(TENT_POLE / TENT.hz).toFixed(4)};      // where the poles stand along the tent, as a share of its half length
// (polish 1) the shadow of a seated person on the wall, drawn in the wall's own metres. p: (along the tent, height);
// at: where along the tent it sits; lean: how far the head leans along the tent; s: its size (1 = a metre tall)
float sbvFigure(vec2 p, float at, float lean, float s){
  vec2 q = vec2(p.x - at, p.y)/s; float zc = lean*clamp(q.y/.6, 0., 1.3);
  // (sixth part, S4) a trunk that narrows from the floor to the shoulders, shoulders that slope in to the neck, and
  // a hooded head of a head's size (it was a square block with a small knob on it)
  float body = max(abs(q.x - zc) - mix(.4, .34, clamp(q.y/.46, 0., 1.))*(1. - .75*smoothstep(.46, .72, q.y)), q.y - .72);
  float head = length((q - vec2(zc*1.15 + lean*.1, .82 - .45*abs(lean)))*vec2(1., .92)) - .2;      // (fifth part, J3: a head that leans is bowed: it sinks toward the shoulders)
  return 1. - smoothstep(-.02, .06, min(body, head));      // (third part: soft-edged; fourth part: a firmer edge)
}
float bodyShadow(vec3 c, float r){ vec3 d = vL - uLampAt; float t = clamp(dot(c - uLampAt, d)/max(dot(d, d), 1e-4), 0., 1.); return 1. - smoothstep(r*.55, r*1.35, length(uLampAt + d*t - c)); }
void main(){
  // the relief of the cloth from the screen-space change of its own position
  vec3 fc = cross(dFdx(vW), dFdy(vW)); vec3 n = dot(fc, fc) > 1e-14 ? normalize(fc) : normalize(vN); if (dot(n, vN) < 0.) n = -n; n = normalize(mix(normalize(vN), n, .6) + vec3(0., 1e-4, 0.));
  float weave = sN2(vUv*vec2(240., 150.)), stain = sF2(vUv*vec2(5., 3.) + 2.);
  // (polish 1) the cloth is sewn: a seam along the ridge and one over each pole; (third part, C1) and five more that
  // run down the slopes and walls from ridge to hem, a panel's width (1.03 m) apart
  float endK = smoothstep(POLE_U, POLE_U + .015, abs(2.*vUv.x - 1.));                      // (fourth part) 1 on the two triangular ends
  float sl = abs(1. - 2.*vUv.y), roofK = (1. - smoothstep(.57, .66, sl))*(1. - endK);      // sl: 0 at the ridge, .625 at the eaves, 1 at the hem
  float su = abs(fract(vUv.x*6. + .5) - .5)/6., sw = max(fwidth(vUv.x), 1e-4);
  float seam = max(1. - smoothstep(.0, .014, abs(vUv.y - .5)), 1. - smoothstep(.0, .01, abs(abs(2.*vUv.x - 1.) - POLE_U)));
  seam = max(seam, (1. - smoothstep(.004, .004 + sw, su))*min(1., .008/sw));
  vec3 alb = uCloth*(.86 + .14*weave)*(.9 + .2*stain)*(1. - .3*seam);
  // (third part, C1) a little snow lies along the ridge on both slopes and thickens toward the windward end (the
  // tent lies along the wind, its back to it: its weather slope is that end's), in broken patches
  float lie = .05 + .4*(1. - smoothstep(0., .4, vUv.x));
  float snowK = .85*roofK*(1. - smoothstep(lie - .08, lie + .08, sl/.625 + .45*(sF2(vec2(vUv.x*17., sl*6. + step(.5, vUv.y)*9.)) - .5)));
  alb = mix(alb, vec3(.62, .68, .76), snowK);
  float frost = (1. - smoothstep(0., .16, vL.y))*.5;                   // rime and drift at the hem (third part: the lowest 16 cm, so the lit wall is cloth)
  alb = mix(alb, vec3(.62, .68, .76), frost*(.5 + .5*stain));
  vec3 c = alb*sbvLight(vW, n)*mix(.5, 1., max(snowK, frost));      // (third part: the cloth is a weathered dun, dark under the dusk; the snow on it is not)
  // lit from inside: brightest low near the lamp, the ribs and seams dark against it, and the two as soft shadows
  float lampD = length(vL - uLampAt);
  // (each of the two is a body rising from the floor between the light and the wall they sleep along: A sits
  //  upright and throws a tall shadow; B sits by it, bowed over its knees, and throws a lower, smaller one)
  // (the stove stands low in the middle of the tent, a little to one side, its open door toward the two: its light is
  //  thrown at the wall they sit along, low, and that wall carries their two shadows; the wall behind the stove keeps
  //  only a dim glow)
  float door = smoothstep(.1, .7, dot(normalize(vL - uLampAt), vec3(-sign(uLampAt.x), -.05, 0.)));
  // (second part, B2) the whole cloth is lit by its own light, on every visit alike: both slopes, brightest low by the stove
  // (third part, C1) no part of the cloth is white: its brightest place is a warm amber, well under white after the
  // picture's bloom, at ONE place (low, by the stove); from there it falls off toward both ends and toward the ridge,
  // the two slopes of the roof (cloth turned to the sky) are darker than the walls, and the snow lying on it is dark
  // (fourth part, E1a) a notch or two brighter and a deeper amber: the lit wall's brightest place is 0.9 of the
  // lamp's strength (0.5), tinted (1, 0.74, 0.42), so its red is full, its green about a half and its blue low
  // (never white); it falls off more slowly down the tent's length; the slopes are at six tenths of the walls; the
  // two ends glow too, dimly and evenly (the lamp's light down the length of the tent). The cloth is a dun canvas.
  // Tuned on the camp as a whole (cloth, snow and sledge together) on a dusk, a night and a copper visit.
  float glow = (.03 + .9*(.3 + .7*door)*exp(-lampD*lampD*.13) + .3*endK*exp(-lampD*lampD*.05))*(1. - .6*smoothstep(.2, 1.5, vL.y))*mix(1., .6, roofK)*(.8 + .2*weave)*(1. - .7*frost)*(1. - .9*snowK);
  // (polish 1) the two as SEATED people's shadows on the wall they sit along: heads, shoulders, bodies down to the
  // floor; one sits upright, the other is bowed; they move a little (the same slow movements as before)
  float wallK = smoothstep(.15, .5, -sign(uLampAt.x)*vL.x);
  // (third part, C1) thrown large by the low light: head and shoulders of each stand on the wall and the foot of the
  // slope above it
  // (fourth part, E1d) each is head, shoulders and trunk down to the floor
  // (fifth part, J3) the two sit close and are unlike: one sits upright and tall (1.42: its head's top 1.45 m up),
  // the other, 0.85 m along the wall from it, is smaller (1.0) and bowed over its knees, away from the first, its
  // head low (its top 0.94 m up); their bodies overlap from the floor to the shoulders, by 0.12 m at the floor, and
  // there is a notch between the two heads. They were 2.15 m apart and near of a height.
  float sh = wallK*(1. - endK)*max(sbvFigure(vL.zy, -.5 + .25*(uBodies.y + .35), .04 + .5*(uBodies.x + .5*sign(uLampAt.x)), 1.42),
                       sbvFigure(vL.zy, .35 + .2*(uBodies.w - .9), .22 + .6*(uBodies.z + .95*sign(uLampAt.x)), 1.));
  glow *= 1. - .45*seam;
  glow *= 1. - .93*sh;
  c += uLamp*vec3(1., .74, .42)*glow*uLit;      // (third part: what comes through the dun cloth is amber, never white; fourth part: a deeper amber)
  gl_FragColor = vec4(sbvFog(c, length(cameraPosition - vW), 1.), 1.);
}`;
// (third part, C1) a RIDGE tent with low walls: the ridge cloth hangs between the two pole heads (1.74 m) and sags
// between them; from it two plain slopes fall to the eaves (0.52 to 0.56 m up, 0.89 to 1.0 m out), and a low wall from
// the eaves to the hem (0.95 m out). The guy lines hold the eaves out at four places a side (under the two poles and
// 1.1 m either side of the middle); between them the eaves draw in 0.11 m, in shallow scallops. The ridge stands at
// least 1.4 times as high over the floor as the eaves' spread is half-wide.
// (fourth part, E1c) the two poles stand 0.62 m in from the ends (2.48 m either side of the middle) and each END is
// a plain triangle of cloth leaning in from its foot on the snow to the pole head (20 degrees off upright), so the
// tent is a ridge tent with a triangular end at each pole;
// the ridge sags 0.28 m between the poles (it was 0.42 m, with two sharp peaks at the poles).
function tentSection(z) {
  const az = Math.min(Math.abs(z), TENT_POLE) / TENT_POLE; let t = 0;
  for (let k = 0; k < 3; k++) if (z >= TENT_GUYS[k] && z <= TENT_GUYS[k + 1]) t = (z - TENT_GUYS[k]) / (TENT_GUYS[k + 1] - TENT_GUYS[k]);
  const sc = 4 * t * (1 - t);
  return { ridge: 1.46 + 0.28 * az * az, eaveX: 1 - 0.11 * sc, eaveY: 0.56 - 0.04 * sc, hem: TENT_HEM };
}
function tentGeometry() {
  const NA = 30, NC = 16, pos = [], uv = [], idx = [];
  for (let i = 0; i <= NA; i++) {
    const u = i / NA, a = u * 2 - 1, zz = a * TENT.hz, az = Math.abs(zz), T = tentSection(Math.max(-TENT_POLE, Math.min(TENT_POLE, zz)));      // a: -1 back .. 1 door
    const te = Math.max(0, (az - TENT_POLE) / (TENT.hz - TENT_POLE));      // 0 under the pole and between the poles .. 1 at the end's foot
    for (let j = 0; j <= NC; j++) {
      const v = j / NC, ex = 1 - 2 * v, sl = Math.abs(ex), sg = ex < 0 ? -1 : 1; let x, y;
      if (sl <= 0.625) { const r = sl / 0.625; x = sg * T.eaveX * r; y = T.ridge + (T.eaveY - T.ridge) * r; }           // the slope: plain, from the ridge to the eaves
      else { const w = (sl - 0.625) / 0.375; x = sg * (T.eaveX + (T.hem - T.eaveX) * w); y = T.eaveY * (1 - w); }       // the low wall
      // the end: a plain triangle from the section under the pole to its foot, a line on the snow
      if (te > 0) { x = x + (ex * T.hem - x) * te; y = y * (1 - te); }
      pos.push(x, y - 0.03, zz); uv.push(u, v);
    }
  }
  for (let i = 0; i < NA; i++) for (let j = 0; j < NC; j++) { const a = i * (NC + 1) + j, b = a + 1, c = a + NC + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// props: vertex colours lit by the world's lights; aK > 0 trembles in the wind (the planted skis), aPart 1 takes snow on top
const PROP_VS = /* glsl */`
attribute vec3 color; attribute float aK, aPart;
uniform float uTime; uniform vec4 uTentWind;
varying vec3 vW, vN, vC; varying float vPart;
void main(){
  vec3 p = position; float sw = aPart < .5 ? aK*aK : 0.; p.xz += uTentWind.xy*sw*(.035*sin(uTime*13. + position.x*9.) + .02*sin(uTime*21. + position.z*5.));
  vec4 w = modelMatrix*vec4(p, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal); vC = color; vPart = aPart;
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
const PROP_FS = /* glsl */`
precision highp float;
varying vec3 vW, vN, vC; varying float vPart;
uniform vec3 uLamp, uLampW, uLampC; uniform float uLit; uniform vec4 uTentW;      // uTentW: the tent's middle (world x, z) and its long axis (x, z)
${SBV_NOISE}
${SBV_LIGHT}
${TENT_SHADE}
${DOOR_POOL}
const float CLOTH_K = ${CLOTH_THROUGH.toFixed(2)};
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 alb = vC; float snowK = smoothstep(.35, .8, n.y + .3*(sN2(vW.xz*3.) - .5));
  // (fourth part, E1e) the sledge by the tent (part 9): weathered wood, canvas and harness, greyed and paler, with
  // little snow lying on it and rime on all of it, so it takes the light much as the snow about it does (six tenths
  // as a face turned up, four tenths as its own face); it takes a share of the tent's light on its near side
  float sled = step(8.5, vPart);
  alb = mix(alb, vec3(.5, .47, .42), .5*sled)*(1. + .25*sled);
  alb = mix(alb, vec3(.62, .68, .76), snowK*(abs(vPart - 1.) < .5 ? 1. : .5 - .3*sled));
  // the tent's light falls on what stands near it
  vec3 d = uLampW - vW; float l = length(d); float lamp = clamp(dot(n, d/max(l, .01))*.7 + .3, 0., 1.)/(1. + l*l*.22);
  // the tent's own shade (TENT_SHADE, the one rule): on the sky's light only
  float shade = sbvTentShade(vW.xz, uTentW);
  // (third part, C1: it comes through the cloth, amber, so the snow banked on the wall is not white. As the text
  //  has it: the camp's snow (part 1: the banked snow, the drift tail, the guy lines' lumps) takes 2.4 x 0.6 = 1.44
  //  of the lamp's glow, amber as the cloth (live: 1.4, the lamp's own colour); the skis and the lines 1.4 x 0.6 =
  //  0.84; the sledge 0.84 x 0.55 = 0.46, paler)
  // (and the camp's snow takes the light out of the door as the land beside it does: DOOR_POOL, the one declaration)
  float door = abs(vPart - 1.) < .5 ? sbvDoorPool(vW.xz, uTentW) : 0.;
  vec3 c = alb*(mix(sbvLight(vW, n), sbvLight(vW, vec3(0., 1., 0.)), .6*sled)*shade + uLampC*door*uLit + uLamp*mix(vec3(1., .74, .42), vec3(1., .95, .8), sled)*lamp*uLit*((abs(vPart - 1.) < .5 ? 2.4 : 1.4)*CLOTH_K)*(1. - .45*sled));
  gl_FragColor = vec4(sbvFog(c, length(cameraPosition - vW), 1.), 1.);
}`;

// opts: rng, ground (x, z) => y, at [x, z], wind [x, z], trackFrom [x, z] (where the track comes over the lip),
//       life (a stream for where the lamp's flicker, the two shadows and the cloth's clock start; its own fork of rng
//       when not given)
export async function makeCamp(ctx, S, o) {
  const rng = o.rng, ground = o.ground, [cx, cz] = o.at, wind = o.wind || [-1, 0], object = new THREE.Group(); object.name = 'camp';
  // where the flame's two beats, the two shadows' slow movements and the cloth's clock start: seeded, from a stream of
  // their own that is in hand before anything is dealt
  const lf = o.life || rng.fork('life'), LP = []; for (let i = 0; i < 8; i++) LP.push(lf.range(0, 6.283));
  const campClock = { value: 0 };
  const camp = new THREE.Group(); camp.position.set(cx, ground(cx, cz), cz); camp.rotation.y = Math.atan2(wind[0], wind[1]); object.add(camp);      // the tent's back to the wind, the door in the lee
  // which long wall the two sleep along: the one on the side the track comes in by. The tent lies along the wind and
  // the two's line of march meets it at an angle, so the track arrives to one side of the windward end (o.march: the
  // line's heading there); the sledge is drawn up on that side, the skis planted by it, the two sleep along that wall
  // and the stove stands toward the other. A rule of the tent's own frame and the line of march; nothing here looks
  // at the road. (side: the stove's side, the opposite one)
  const ry1 = Math.atan2(wind[0], wind[1]), march = o.march || [wind[0], wind[1]];
  const side = (-march[0] * Math.cos(ry1) + march[1] * Math.sin(ry1)) >= 0 ? -1 : 1;
  const SLEDGE_AT = [-2.5 * side, -4.2];      // the sledge is drawn up at the windward end, where the track comes in
  const lampCol = new THREE.Color(o.lamp ?? '#FFB060');
  const tentWind = { value: new THREE.Vector4(0, 1, 1, TENT.ribs) }, uLit = { value: 0 }, lampW = new THREE.Vector3(), tentW = new THREE.Vector4(), tw0 = new THREE.Vector3(), tw1 = new THREE.Vector3();
  const tentU = { ...sharedUniforms(S), uTentWind: tentWind, uLit, uCloth: { value: new THREE.Color('#9a8f78') }, uLamp: { value: lampCol.clone().multiplyScalar(o.glow ?? 1.5) }, uLampAt: { value: new THREE.Vector3(0.3 * side, 0.25, 0.05) },
    uBodies: { value: new THREE.Vector4(-0.5 * side, -0.35, -0.95 * side, 0.9) } };
  const tent = new THREE.Mesh(tentGeometry(), new THREE.ShaderMaterial({ uniforms: tentU, vertexShader: TENT_VS, fragmentShader: TENT_FS, side: THREE.DoubleSide })); tent.name = 'tent'; camp.add(tent);
  await ctx.yield();
  // what stands round it
  const A = new Acc();
  A.id(1).color('#9fb0c8'); A.kv = 0;
  A.ball(0, -0.15, -TENT.hz - 0.35, 2.1, 0.85, 1.5, 12, 6);                                   // snow banked on the windward end
  // (fourth part, E1: the snow banked along the two long walls lies against the walls as they now stand, 0.95 m out,
  //  and lower, 0.2 m, so the lit wall shows over it; it lay 1.8 m out and 0.35 m high, for live's wider tent)
  A.ball(-1.42, -0.2, -0.6, 0.75, 0.4, 2.3, 10, 5); A.ball(1.42, -0.2, -0.7, 0.75, 0.38, 2.2, 10, 5);
  A.ball(0.4, -0.25, TENT.hz + 2.6, 1.3, 0.42, 2.4, 10, 5);                                   // the drift tail in the lee
  // the sledge lies tipped on its side for the night at the tent's windward end, where the track ends: its load to
  // the tent, its runners out to the weather, its bow down the wind as it was hauled; the traces lie on the snow
  // ahead of it where the two dropped them
  const SL_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI + 0.22, 0, 'YXZ'));
  A.m = new THREE.Matrix4().compose(new THREE.Vector3(SLEDGE_AT[0], 0.3, SLEDGE_AT[1]), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI + 0.22, -1.2 * side, 'YXZ')), new THREE.Vector3(1, 1, 1));
  addSledge(A);
  A.m = new THREE.Matrix4().compose(new THREE.Vector3(SLEDGE_AT[0], 0.0, SLEDGE_AT[1]), SL_Q, new THREE.Vector3(1, 1, 1));
  A.id(0).color('#241e19');
  A.tube([[-0.24, 0.3, -1.6, 0.014], [-0.34, 0.08, -2.2, 0.014], [-0.62, 0.03, -3.0, 0.014], [-0.42, 0.03, -3.9, 0.014], [-0.5, 0.03, -4.4, 0.03]], 4, true, true);
  A.tube([[0.24, 0.3, -1.6, 0.014], [0.3, 0.08, -2.3, 0.014], [0.52, 0.03, -3.3, 0.014], [0.9, 0.03, -4.0, 0.014], [1.0, 0.03, -4.5, 0.03]], 4, true, true);
  A.m = null;
  // two pairs of skis planted upright in the snow
  A.id(0);
  const ski = (x, z, lean, yaw, col) => { const dx = Math.sin(lean) * Math.cos(yaw), dz = Math.sin(lean) * Math.sin(yaw), L = 1.95, pts = [];
    for (let i = 0; i <= 5; i++) { const t = i / 5, tip = t > 0.8 ? (t - 0.8) * 0.5 : 0; pts.push([x + dx * L * t + Math.cos(yaw) * tip * 0.3, -0.25 + Math.cos(lean) * L * t, z + dz * L * t + Math.sin(yaw) * tip * 0.3, [0.13 * (t > 0.9 ? 0.6 : 1), 0.014]]); }      // (polish 1: wide blades; second part: 13 cm)
    A.color(col).tube(pts, 4, true, true); };
  // (they stand beside the sledge, clear of the tent: each pair close together; skis only, no poles)
  for (const [bx, bz] of [[-3.6 * side, -1.6], [-3.9 * side, -0.5]]) { const yaw = rng.range(0, 3), l = rng.range(0.03, 0.09);
    ski(bx, bz, l, yaw, '#7a6a52'); ski(bx + 0.17, bz + 0.05, l + rng.range(0.02, 0.07), yaw + rng.range(-0.3, 0.3), '#6b5c47'); }
  // (third part, C1) the two pole heads stand proud of the ridge cloth (fourth part: they end 0.04 m over the ridge cloth at the poles)
  A.id(0).color('#241e19'); A.kv = 0; for (const pz of [-TENT_POLE, TENT_POLE]) A.tube([[0, 1.5, pz, 0.03], [0, 1.75, pz, 0.03]], 5, true, true);
  // (polish 1) guy lines from the two poles and from the eaves to snow (third part: made fast at the pole heads and
  // at the eaves, where they pull the cloth out; sixth part, S4: each ends in a low rounded lump of snow, half a
  // metre across and a hand high, a little unlike its neighbours by the line's own measures; they were cubes)
  for (const [fx, fy, fz, tx, tz] of [[0, 1.71, TENT_POLE, 0, 5.0], [0, 1.71, -TENT_POLE, 0.6 * side, -5.4], [1.0, 0.53, 1.1, 2.7, 1.5], [-1.0, 0.53, 1.1, -2.7, 1.5], [1.0, 0.53, -1.1, 2.7, -1.3], [-1.0, 0.53, -1.1, -2.7, -1.3]]) {
    A.id(0).color('#241e19'); A.kv = 0; A.tube([[fx, fy, fz, 0.012], [(fx + tx) / 2, fy * 0.47, (fz + tz) / 2, 0.012], [tx, 0.12, tz, 0.012]], 4, true, true);
    A.id(1).color('#9fb0c8'); { const g = 1 + 0.15 * Math.sin(fx * 2.1 + fz * 1.7); A.ball(tx, 0.02, tz, 0.27 * g, 0.16 * g, 0.23 / g, 8, 4); } }
  const propU = { ...sharedUniforms(S), uTentWind: tentWind, uLit, uLamp: tentU.uLamp, uLampW: { value: lampW }, uTentW: { value: tentW }, uLampC: { value: lampCol } };
  const props = new THREE.Mesh(A.geometry(), new THREE.ShaderMaterial({ uniforms: propU, vertexShader: PROP_VS, fragmentShader: PROP_FS, side: THREE.DoubleSide })); props.name = 'camp-props'; camp.add(props);
  await ctx.yield();
  // the one point light of the world: the tent's light on the snow round it
  const light = new THREE.PointLight(lampCol, 0, 35, 2); light.position.set(0.3 * side, 0.7, 0.05); camp.add(light);      // (at the stove's own place: it lights the snow all round)
  // the track: over the lip, across the plateau, to the sledge
  let track = null;
  if (o.trackPts) {
    // the world gives the track's way across the plateau; it ends under the sledge. Laid in steps of about 1.5 m.
    const ry = camp.rotation.y, cs = Math.cos(ry), sn = Math.sin(ry), end = [cx + SLEDGE_AT[0] * cs + SLEDGE_AT[1] * sn, cz - SLEDGE_AT[0] * sn + SLEDGE_AT[1] * cs];
    const way = o.trackPts.concat([[end[0] - wind[0] * 9, end[1] - wind[1] * 9], end]), pts = [];
    for (let i = 0; i < way.length - 1; i++) { const a = way[i], b = way[i + 1], m = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.5)); for (let j = 0; j < m; j++) pts.push([a[0] + (b[0] - a[0]) * j / m, a[1] + (b[1] - a[1]) * j / m]); }
    pts.push(end);
    await ctx.yield();
    track = makeTrack(S, ground, pts, { bends: true }); track.object.name = 'camp-track'; object.add(track.object);
  } else if (o.trackFrom) { const pts = [], [fx, fz] = o.trackFrom, ex = cx - wind[0] * 5.2, ez = cz - wind[1] * 5.2, n = Math.ceil(Math.hypot(ex - fx, ez - fz) / 2);
    for (let i = 0; i <= n; i++) { const t = i / n, e = t * t * (3 - 2 * t); pts.push([fx + (ex - fx) * e + 3 * Math.sin(t * 5) * (1 - t) * t * 4 * 0.35, fz + (ez - fz) * t]); }
    track = makeTrack(S, ground, pts, {}); track.object.name = 'camp-track'; object.add(track.object); }
  // vapour from the vent at the door end, carried off down the wind
  const c = Math.cos(camp.rotation.y), s = Math.sin(camp.rotation.y), vent = [cx + s * 1.2, camp.position.y + TENT.h * 0.92, cz + c * 1.2];
  const emitters = [{ p: vent, v: [wind[0] * 2.2, 1.1, wind[1] * 2.2], spread: 0.12, vr: 0.25, n: 7, life: 3.2, size: [0.3, 1.9], tone: 0, alpha: 0.3, drag: 0.4 }];
  tentU.uTime = campClock; propU.uTime = campClock;
  // where the wall that carries the two shadows is, in the stage's metres (for the world's small bloom there)
  const ry0 = camp.rotation.y, litWall = [cx - 1.4 * side * Math.cos(ry0) + 0.05 * Math.sin(ry0), camp.position.y + 0.5, cz + 1.4 * side * Math.sin(ry0) + 0.05 * Math.cos(ry0)];
  const api = { object, camp, tent, light, track, emitters, side, litWall, triangles: tent.geometry.index.count / 3 + A.triangles, position: camp.position,
    // k: how far into the night it is (0 on the glacier, 1 at the camp): the lamp is lit by then
    lit: 0, setLit(k) { api.lit = k; },
    get litNow() { return uLit.value; },      // the lamp's strength as the flame breathes (what the shaders here have; the world hands it to the land for the door's pool)
    update(time) {
      campClock.value = time + LP[7] * 60;
      const breathe = 1 + 0.07 * Math.sin(time * 0.8 + LP[0]) + 0.03 * Math.sin(time * 2.3 + LP[1]);      // the lamp's flame is never quite still
      uLit.value = api.lit * breathe; light.intensity = (o.lightIntensity ?? 46) * CLOTH_THROUGH * api.lit * breathe;
      const b = tentU.uBodies.value;                                 // the two inside, moving a little
      b.x = -0.5 * side + 0.05 * Math.sin(time * 0.37 + LP[2]) + 0.03 * Math.sin(time * 0.9 + LP[3]); b.y = -0.35 + 0.09 * Math.sin(time * 0.23 + LP[4]);
      b.z = -0.95 * side + 0.03 * Math.sin(time * 0.31 + LP[5]); b.w = 0.9 + 0.06 * Math.sin(time * 0.41 + LP[6]);
      lampW.set(0.3 * side, 0.5, 0.05); camp.localToWorld(lampW);
      camp.localToWorld(tw0.set(0, 0, 0)); camp.localToWorld(tw1.set(0, 0, 1)); { const ax = tw1.x - tw0.x, az = tw1.z - tw0.z, al = Math.hypot(ax, az) || 1; tentW.set(tw0.x, tw0.z, ax / al, az / al); }
    } };
  return api;
}
