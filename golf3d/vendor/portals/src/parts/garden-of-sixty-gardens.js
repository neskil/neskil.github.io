// THE GLOBE: hero set piece of "The Garden of Sixty Gardens" (styled world: a kaleidoscope built as real geometry).
//
// WHAT IT IS. A hollow glass globe 300 m across (pentakis dodecahedron: 60 triangular gardens = 120 mirror images
// of ONE authored wedge, generated breadth-first from three reflections, so word length = "generation"), every
// garden facing inward: black pond, leaning maple with lobed foliage pads and cut leaf cards, mossed stones, iris,
// koi. Seen from outside it is a paper lantern of OPAQUE dusk-glass panes: each half-garden its own step of four tones
// (uKeyW), a hairline joint between the halves, the garden behind each pane drawn on it as a shadow (pond, crown, trunk,
// koi, turning with the disc), one hard highlight on the ball, light burning as one thin line between panes (uSlitCol);
// inside, sixty-fold gardens lit by a BAND on the wall when the world sets uBand0/uBand1/uBandC (brightness belongs to
// the facets; otherwise counted from uShellEye, which the leaf strings always use), seam
// lines like the leading of a lamp, a drizzle of leaves converging on the Gate (four mirror images of one
// quarter-arch) at the centre, wreathed in turning leaves. Under it the Tongue: seven pairs of garden pages on a
// lacquer rib, peeling off the plain and opening like a book up to the 16 m slit.
//
// HOW THE STYLE IS MADE (use these exports for the whole world so the hero is not pasted in):
//   makeStyleUniforms(palette)  ONE uniforms object shared by every material: uPal[7] (display colours: 0 amber,
//                               1 vermilion, 2 jade-black, 3 ivory, 4 moss jade, 5 plum, 6 seam gold), uTime, uTurn
//                               (disc angle), uShell, uKey (key light in WEDGE space), uApex, uGenGain, uGenPlum.
//                               Pass yours as opts.uniforms, or take hero.uniforms.
//   TONE_GLSL / toScene(hex)    EXACT COLOUR: display colour -> scene value (inverse of exposure/0.6 + ACES at
//                               post.exposure 1). All shading is composed in display space, converted last.
//   STYLE_VERT_GLSL             gardenVertex(pw, nw): wedge space -> copy (instanceMatrix = mirror matrix) -> shell
//                               -> world; discToWedge()/discDir() turn disc-space objects by uTurn about the pivot.
//                               Light is taken in wedge space, so every copy carries its own mirrored light.
//   STYLE_FRAG_GLSL             clipWedge(): true outside the three mirrors (which lean to uApex on the Globe): keep it in a bool
//                               and discard after the last fwidth (a width taken after a discard is not defined);
//                               enamel(base, N, gloss): flat colour, hard terminator toward jade-black, dark glossy
//                               rim, one hard gold highlight; generation(col, g): x uGenGain^g, toward plum; finish().
//   enamelMaterial(U, opts)     the material factory (slots, vertMove / fragColor hooks, wedgeSpace, noClip).
//   makeCopies(rng), applyCopies(geometry, material, copies, slots)   mirror copies as one InstancedMesh.
//   SWAY_GLSL, LEAF_GLSL, KOI_GLSL, WEDGE, GLOBE, GATE, DEFAULT_PALETTE.
// The medium moves by uTurn: the authored disc turns 1.2 deg/s against the fixed mirrors, so boughs, pads, stones
// and koi slide into seams and fold into their twins. No fog: distance is generation(). No full-screen pass.
//
// CONTRACT. buildHero(ctx, opts) -> { object, radius 180, height 250, center, anchors, uniforms, update(dt, time,
// camera), setProgress(u), setShellAngle(rad), setTurn(rad), setKoiClock(rad), dispose, ground, groundY }. Origin: the point of the plain under the
// Globe's centre; +Y up; the camera arrives from +Z, climbing toward -Z (rotate the object by PI for a +Z path).
// opts: palette (7 hex), detail 0.6..1 (leaf cards, air leaves), uniforms (shared style uniforms), turnRate
// (rad/s, default 1.2 deg), shellRate (rad/s roll of the shell about the line of flight, default 0.011), gateHeading
// (local unit vector the Gate faces along; default the radial line through the slit), clearLane [x0, x1, zc, halfWidth]
// (wedge space: stones and iris sink out of it). maple.reach { ang, R }: the long reaching bough's tip, in disc space.
// setGateFacing(dirLocal, scale = 1, open = 1, dist): the Gate (with its wreath and the ends of the leaf strings) turns to be
// passed along dirLocal; scale > 1 shows it larger from afar. Its opening is ONE FLAT TONE (opts.veil, hex): a reveal disc that
// stands toward the lens while open < 1 (the Gate is not yet square to the flight) and lies in the ring's plane at open 1;
// dist (metres from the lens) keeps the disc's edge under the ring's inner rim.
// More opts: shellAxis (unit vector the shell rolls about; default the line of flight), lineEvery / lineCards / wreathKeep
// (how many air leaves fly in strings, how many of a string's cards are kept, how much of the wreath).
// More shared uniforms: uGenCut (gardens more than this many reflections from the light are plum, seams only), uBoughCut
// (metres: trunks and boughs nearer the lens than this are not drawn), uGlow (x, z, reach, strength: copies on the plain
// near that point are a reflection brighter). Tongue pages (iClip.w -1) carry a gold cloison rim.
// Review 7: opts.portalRadius (the world's portal radius; round 9c: no longer read, the toothed lacquer medallion behind the portal's plane is
// out and a whole flat disc of the veil stands there, `medal`); the Gate's stones carry gold teeth; uGenMax (no garden is counted more than this many reflections from
// the light: the wall keeps its crimson step); uPadCut (metres: the maple's pads nearer the lens than this shrink whole into
// their hearts, per pad, attribute aPad); enamelMaterial opt keepIf (GLSL condition exempt from the clear cone); the reaching
// bough carries four tufts (drawn on the 'full' level only, coreIndex).
// The band of light measures from each copy's centre in the WORLD (the shell's lift GLOBE_CY is added in the vertex shader).
// Near water (within 27 m) carries two koi per facet circling across the joint into their twins (curved body, forked tail,
// saddle by colourway), pads with an amber heart and three loose leaf cards, and crisp rings.
// Ponds mirror the crowns as lobed pads with dark rims and leaf cards (crownMirror). The glass backs carry their garden's
// shadow (pond edge, lobed crown blots, trunk, koi, drifting leaves, strider rings) on one of four tones, the key side
// lighter; within 27 m a pane is black water mirroring its crown, and a slit's wall close by is lacquer-plum with one gold hairline.
// The four quarter-gardens at the slit's hub carry no maple (iClip.w 2): the way in is open water.
// A seam on the plain and the Tongue is a THREAD: one percent of the frame wide at any distance (the rest of its strip is pond).
// Panes: light and dark halves alternate by mirror parity; koi are curved fish, with a school of small ones seen close; within
// 25 m a pane is black water behind ONE hard contour, with separate lobed pads, crisp rings and a hairline joint (no fades).
// opts.nearStrings: start points (local) of extra leaf strings that run straight to the Gate's rim; mirrorN: crowns mirrored on ponds.
// setProgress(u): 0..1 over the final approach; to 0.5 the wreath comes in onto the rim and turns there (the middle stays clear), from 0.5 to 1 it closes across the opening; formerly it slipped through ahead of the
// camera (keep 0 until the last second: the opening stays clear). setShellAngle(a) overrides the timed roll.
// anchors (local): center (0,170,0); heading (unit, 35 deg up toward -Z) and up; portalSeat { position = centre,
// normal (faces the arriving camera), heading, radius 7, tiltDeg 35 }; slit { position, along, clearHalfWidth 6.7 };
// flyThrough: 11 points: 8 above the Tongue's rib (34 m above it at the root, 20 m at the tip), the slit, 70 m
// inside, the centre: the last 150 m is one straight line at 35 deg; tongueRoot, tongueTip; viewpoints.
// Viewer-only: ?gview=in|mid|close|gate|tongue reframes tools/shot.mjs _part; the world never sets it.
// Cost: about 145k triangles, 12 draw calls, no lights, no textures, about 50 ms build.
// Expects: post.exposure 1, saturation/contrast 1, bloom threshold above ~2 (only seam glints exceed it), a plum
// surround (#3A2545), and the plain to stop under the Tongue's first pages (they lie at y 0..2, z 365..437; the piece as a whole reaches z 437).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

// ---------------------------------------------------------------------------------------------------------------
// The wedge. True garden = right triangle C(0,0) 90 deg, A(95,0) 30 deg, B(0,55) 60 deg, in wedge space (x, y up, z).
// ---------------------------------------------------------------------------------------------------------------
const GLOBE_CY = 170;
export const WEDGE = { ax: 95, bz: 55, pivot: [20, 20], hn: [0.5, 0.8636364], hd: 47.5 };
export const DEFAULT_PALETTE = ['#F2A93B', '#D9381E', '#0E1F1B', '#F3EAD6', '#3E7F5E', '#3A2545', '#FFE9B8'];
const EXPOSURE = 1;                       // the world must run post.exposure 1 (bloom low, saturation/contrast 1)

// ---- EXACT COLOUR: display-linear colour -> scene value that exposure/0.6 + ACES lands back on it ----
const M3inv = (e) => new THREE.Matrix3().fromArray(e).invert().elements;
const ACES_IN = [0.59719, 0.076, 0.0284, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777];
const ACES_OUT = [1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602];
const IN_I = M3inv(ACES_IN), OUT_I = M3inv(ACES_OUT);
const g6 = (a) => a.map((v) => v.toFixed(6)).join(',');
export const TONE_GLSL = /* glsl */`
  vec3 toScene(vec3 D){
    vec3 y = clamp(mat3(${g6(OUT_I)})*clamp(D, 0., 0.95), 0.0004, 0.97);
    vec3 A = 0.983729*y - 1., B = 0.432951*y - 0.0245786, Cc = 0.238081*y + 0.000090537;
    vec3 v = (-B - sqrt(max(B*B - 4.*A*Cc, 0.)))/(2.*A);
    return max(mat3(${g6(IN_I)})*v, 0.)*${(0.6 / EXPOSURE).toFixed(5)};
  }`;
/** JS twin of toScene: hex or THREE.Color (display) -> THREE.Color holding the scene-linear value. */
export function toScene(hex) {
  const c = new THREE.Color(hex), D = [Math.min(c.r, 0.95), Math.min(c.g, 0.95), Math.min(c.b, 0.95)];
  const mul = (m, v) => [m[0] * v[0] + m[3] * v[1] + m[6] * v[2], m[1] * v[0] + m[4] * v[1] + m[7] * v[2], m[2] * v[0] + m[5] * v[1] + m[8] * v[2]];
  const y = mul(OUT_I, D).map((v) => clamp(v, 0.0004, 0.97));
  const v = y.map((yy) => { const A = 0.983729 * yy - 1, B = 0.432951 * yy - 0.0245786, C = 0.238081 * yy + 0.000090537; return (-B - Math.sqrt(Math.max(B * B - 4 * A * C, 0))) / (2 * A); });
  const s = mul(IN_I, v).map((x) => Math.max(x, 0) * 0.6 / EXPOSURE);
  return new THREE.Color(s[0], s[1], s[2]);
}

// ---- shared uniforms: ONE object, referenced by every material of the world ----
export function makeStyleUniforms(palette = DEFAULT_PALETTE) {
  const pal = DEFAULT_PALETTE.map((h, i) => new THREE.Color(palette[i] || h));   // display-linear
  return {
    uPal: { value: pal },                                   // 0 amber 1 vermilion 2 jade-black 3 ivory 4 moss jade 5 plum 6 seam gold
    uTime: { value: 0 }, uPetal: { value: 0 },                 // uPetal 1: April (petals for leaves, weeping boughs)
    uKoiT: { value: 0 }, uKoiYaw: { value: 0 }, uJoint: { value: 0 }, uNearR: { value: 25 },   // uNearR: within this many metres a pane of the Globe is the black water itself (the world opens it at the crossing)
                // (uKoiYaw turns the koi's loops so that one runs out under the maple's reaching bough)                                    // the koi's place on their figure of eight (radians; the hero or the world advances it)
    uTurn: { value: 0 },                                    // disc angle (rad): the object turning against the mirrors
    uShell: { value: new THREE.Matrix4() },                 // extra transform of copies flagged "shell" (the Globe's slow roll)
    uKey: { value: new THREE.Vector3(-0.50, 0.42, 0.76).normalize() },   // low amber key, in WEDGE space (so each copy mirrors it)
    uApex: { value: new THREE.Vector3(0, 0, 0) },           // where the leaning mirrors of the shell meet, in wedge space (x/y, z/y, hd/y)
    uBreeze: { value: 0 },                                  // 0..1 gust crossing the true crown (every 7 s)
    uGenGain: { value: 0.93 }, uGenPlum: { value: 0.925 },   // per reflection: light kept, and colour kept from plum
    uFocus: { value: new THREE.Vector4(0, 0, 0, 0) },       // xyz world point, w>0: ivory formation marker (unused by default)
    uGenEye: { value: new THREE.Vector4(0, 0, 0, 0) },      // plain copies (iInfo.z = -1): generation counted from this world point; w = reflections per metre
    uClear: { value: new THREE.Vector4(0, 0, 1, 2) },       // foliage is cut out of a cone round this world direction (w = cos of its half-angle; 2 = off) ...
    uClearFar: { value: 0 },                                // ... nearer than this (m): keeps the moon gate and the Globe unobstructed at the entry
    uLateTurn: { value: 0.9 },                              // cracked mirror: copies with seed >= 2 turn out of step by this angle
    uBand0: { value: new THREE.Vector4(1, 0, 0, 0) }, uBand1: { value: new THREE.Vector4(0, 1, 0, 0) }, uBandC: { value: new THREE.Vector4(0, 0, 0, 0) }, uCapB: { value: new THREE.Vector4(0, 1, 0, 0.3) }, uCapK: { value: new THREE.Vector2(0, 0) },   // the band of light on the Globe's wall (see gardenVertex); uBandC.w 0 = off
    uShellEye: { value: new THREE.Vector4(0, 0, 0, 0) },    // Globe copies: generation counted from this world point (the lens, inside); w = reflections per metre
    uKeyW: { value: new THREE.Vector3(0.62, 0.42, -0.66).normalize() },   // the key's side of the Globe, in the world (pane tones of the dusk glass)
    uSlitCol: { value: new THREE.Color(palette[0] || DEFAULT_PALETTE[0]) },   // the light burning in the slits between the panes
    uGlow: { value: new THREE.Vector4(0, 0, 400, 0) },      // the Globe's light on the plain: world (x, z) of its foot, reach (m), strength 0..1 (a garden in it counts fewer reflections)
    uGenMax: { value: 1e3 },                                // inside the Globe no garden is counted more than this many reflections from the light (the world sets it: the far wall stays bright)
    uGenCut: { value: 1e3 },                                // beyond this many reflections a garden sinks wholly into plum over the next five (inside the Globe: the far side is dusk, with only its seams)
    uBoughCut: { value: 0 },                                // boughs and trunks part this far from the lens (m), when more than their own nine
    uPadCut: { value: 0 },                                  // foliage (and, at 0.6 of it, boughs) parts this far from the lens (m) when larger than a material's own distance: the slit
    uPush: { value: 1 }, uBare: { value: 0 }, uIce: { value: 0 }, uKoiMode: { value: 0 },   // koi: 0 ivory with a vermilion saddle, 1 all gold, 2 one black among ivory
                // January: no leaves (inks 0 and 1 drop out), a skin of ice on the pond
  };
}

// ---- STYLE GLSL -----------------------------------------------------------------------------------------------
// Vertex side: an object vertex authored in DISC space goes disc -> wedge (turned by uTurn about the pivot) ->
// copy (instanceMatrix, a mirror matrix) -> shell -> world. Fragment side: clip to the three mirrors, enamel.
export const STYLE_VERT_GLSL = /* glsl */`
  uniform float uTime, uTurn, uBreeze, uLateTurn; uniform mat4 uShell; uniform vec3 uKey, uApex; uniform vec4 uGenEye, uShellEye, uBand0, uBand1, uBandC, uGlow, uCapB; uniform vec2 uCapK; uniform float uPush, uGenMax;
  attribute vec4 iInfo;      // generation, slot, shell flag (1 = Globe copy), seed
  attribute vec4 iClip;      // inset of mirror x=0, of the hypotenuse, of z=0 (m); w: 1 leaning mirrors (uApex), 0 upright, -1 upright + hinge sway
  varying vec3 vW, vN, vV, vL, vApex; varying vec4 vInfo; varying vec3 vInset;
  const vec2 PIVOT = vec2(${WEDGE.pivot[0].toFixed(1)}, ${WEDGE.pivot[1].toFixed(1)});
  float turnOf(){ return uTurn + step(1.5, iInfo.w)*uLateTurn; }
  vec3 discToWedge(vec3 p){ float c = cos(turnOf()), s = sin(turnOf()); return vec3(PIVOT.x + c*p.x - s*p.z, p.y, PIVOT.y + s*p.x + c*p.z); }
  vec3 discDir(vec3 n){ float c = cos(turnOf()), s = sin(turnOf()); return vec3(c*n.x - s*n.z, n.y, s*n.x + c*n.z); }
  vec2 wedgeToDisc(vec2 w){ float c = cos(turnOf()), s = sin(turnOf()); vec2 d = w - PIVOT; return vec2(c*d.x + s*d.y, -s*d.x + c*d.y); }
  mat4 copyMatrix(){ mat4 m = instanceMatrix; if (iInfo.z > 0.5) m = uShell*m; return modelMatrix*m; }
  // pw, nw: position and normal in wedge space. Sets every varying and returns the clip-space position.
  vec4 gardenVertex(vec3 pw, vec3 nw){
    mat4 m = copyMatrix();
    if (iClip.w < -0.5 && iClip.w > -1.5) {                 // (iClip.w -2: an upright copy whose tree is not drawn) a page of the Tongue swaying a degree on its hinge (the edge x = 0)
      float a = 0.0175*sin(uTime*0.45 + iInfo.w*6.2832), c = cos(a), s = sin(a);
      pw = vec3(c*pw.x - s*pw.y, s*pw.x + c*pw.y, pw.z); nw = vec3(c*nw.x - s*nw.y, s*nw.x + c*nw.y, nw.z);
    }
    vec4 wp = m*vec4(pw, 1.);
    mat3 m3 = mat3(m);
    vW = pw; vInfo = iInfo; vInset = iClip.xyz; vApex = uApex*clamp(iClip.w, 0., 1.);
    if (iInfo.z < -0.5) { vec3 cc = (m*vec4(34., 0., 17., 1.)).xyz; vInfo.x = (iInfo.x + max(length(cc - uGenEye.xyz) - 46., 0.)*uGenEye.w)*(1. - uGlow.w*(1. - smoothstep(0.3*uGlow.z, uGlow.z, length(cc.xz - uGlow.xy)))); }   // (the Globe is a lantern: the gardens round its foot stand in its light)
    // the Globe counts its reflections from where we are: the garden beside the lens is the true one, the far side is dusk
    if (iInfo.z > 0.5) {
      vec3 cc = (m*vec4(34., 0., 17., 1.)).xyz; vInfo.x = max(length(cc - uShellEye.xyz) - 64., 0.)*uShellEye.w;
      // ... or, when the world lays a BAND OF LIGHT on the wall (uBandC.w > 0): brightness belongs to the facets. The band is an
      // arc of the shell (from uBand0.xyz round toward uBand1.xyz, uBand0.w radians long, uBand1.w radians wide); a garden is
      // dimmer by one reflection for every 1/uBandC.w radians it lies from that arc. Counted in the shell's own frame.
      if (uBandC.w > 0.) {
        vec3 dd = (modelMatrix*(instanceMatrix*vec4(34., 0., 17., 1.) + vec4(0., ${GLOBE_CY}., 0., 0.))).xyz - uBandC.xyz; dd = dd/max(length(dd), 1e-3);   // (the shell's own frame: its centre is GLOBE_CY up, as uShell places it)
        float bx = dot(dd, uBand0.xyz), by = dot(dd, uBand1.xyz), an = atan(by, bx + 1e-5), ac = clamp(an, 0., uBand0.w);
        vec3 near = uBand0.xyz*cos(ac) + uBand1.xyz*sin(ac);
        vInfo.x = max(acos(clamp(dot(dd, near), -1., 1.)) - uBand1.w, 0.)*uBandC.w;
        // (review 6) ... and a second, smaller cap of light (uCapB: its direction in the shell's frame and its half-width; uCapK: reflections
        // per radian beyond it, and reflections added to the whole cap: large = dark): the gardens that stand behind the Gate
        if (uCapK.x > 0.) vInfo.x = min(vInfo.x, max(acos(clamp(dot(dd, uCapB.xyz), -1., 1.)) - uCapB.w, 0.)*uCapK.x + uCapK.y);
        vInfo.x = min(vInfo.x, uGenMax);
      }
    }
    vec3 n = m3*nw; vN = n/max(length(n), 1e-5);
    vec3 l = m3*uKey; vL = l/max(length(l), 1e-5);
    // nothing solid comes nearer the lens than about five metres: boughs and leaves part before it
    vec3 dc = wp.xyz - cameraPosition; float dl = length(dc);
    wp.xyz += dc/max(dl, 1e-3)*(1. - smoothstep(2.0, 6.5, dl))*(6.5 - dl)*0.8*uPush;
    vV = cameraPosition - wp.xyz;
    return projectionMatrix*viewMatrix*wp;
  }`;
export const STYLE_FRAG_GLSL = /* glsl */`
  uniform vec3 uPal[7]; uniform float uGenGain, uGenPlum, uGenCut, uBoughCut, uTime, uBare, uIce, uKoiMode, uClearFar, uPadCut; uniform vec4 uClear;
  varying vec3 vW, vN, vV, vL, vApex; varying vec4 vInfo; varying vec3 vInset;
  ${TONE_GLSL}
  // signed distances (m, positive inside) to the three mirrors at this height; the mirrors lean to vApex
  vec3 mirrorDist(vec3 P){
    return vec3(P.x - P.y*vApex.x, ${WEDGE.hd.toFixed(1)} - dot(P.xz, vec2(${WEDGE.hn[0]}, ${WEDGE.hn[1]})) - P.y*vApex.z, P.z - P.y*vApex.y);
  }
  // (true = cut. It does not discard: a derivative taken after a discard is not defined, so the caller makes the cut after its last fwidth)
  bool clipWedge(){ vec3 d = mirrorDist(vW); d.x -= max(vInset.x - 1.3, 0.); return min(d.x, min(d.y, d.z)) < 0.; }
  // JANUARY (review 8): the ice is enamel like the rest: flat PLATES in three decided tones (a pale frost of ivory toward plum, a
  // jade-grey, a plum-grey), each one flat tone, with hard cracked edges; the jade-black water shows in the leads between plates,
  // in scalloped leads along the seams, in whole missing plates and in the open pools passed in open (metres, negative inside).
  // p: disc metres (the plates turn with the garden and fold into the seams), seamD: metres to the nearest mirror, px: metres a pixel.
  vec2 iceH2(vec2 c){ vec3 p3 = fract(vec3(c.xyx)*vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz)*p3.zy); }
  vec3 iceTone(float h){
    vec3 frost = mix(uPal[3], uPal[5], 0.60), jade = mix(mix(uPal[2], uPal[4], 0.35), uPal[3], 0.20), plumG = mix(uPal[5], uPal[3], 0.09);
    return h < 0.50 ? frost : h < 0.80 ? jade : plumG;
  }
  // (iceCol takes three widths, and a width taken inside a branch that not every pixel of a block of four takes is not defined. So it stands
  // in two parts for a caller that lays the ice inside a branch: icePlate(p) = (metres to the plate's cracked edge, the plate's hash), and
  // iceLaid, which is handed pl = icePlate(p) and w = the fwidth of (pl.x, seamD, open), both taken ABOVE the caller's branch.)
  vec2 icePlate(vec2 p){
    vec2 g = p/13., ci = floor(g), f = g - ci, id = ci; float d1 = 9., d2 = 9.;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
      vec2 o = vec2(float(i), float(j)), q = o + 0.12 + 0.76*iceH2(ci + o) - f; float d = dot(q, q);
      if (d < d1) { d2 = d1; d1 = d; id = ci + o; } else if (d < d2) d2 = d;
    }
    return vec2((sqrt(d2) - sqrt(d1))*6.5, iceH2(id + 17.3).x);         // metres to the plate's cracked edge, and its hash
  }
  vec3 iceLaid(vec3 water, vec2 p, float seamD, float open, float px, vec2 pl, vec3 w){
    float h = pl.y, edge = pl.x;
    float sc = abs(sin(p.x*0.46 + 1.3*sin(p.y*0.21)));                      // scallops along the leads
    float wE = w.x, wS = w.y, wO = w.z;                                      // (the edge is filtered by its own slope on screen: hard from any angle)
    float l0 = edge - max(0.26, min(0.8*wE, 0.8*px)), l1 = seamD - 0.9 - 1.2*sc, l2 = open - 1.3*sc, lead = min(l0, min(l1, l2));
    float e = 0.7*(l0 < min(l1, l2) ? wE : l1 < l2 ? wS : wO);
    if (h < 0.07) lead = -1.;                                               // a plate gone: a whole dark lead
    e = clamp(e, 1e-3, 0.75*px + 1e-3); float ice = smoothstep(-e, e, lead);
    vec3 avg = mix(water, mix(iceTone(0.2), iceTone(0.6), 0.45), 0.72);     // plates too small to draw: their flat average
    return mix(avg, mix(water, iceTone((h - 0.07)/0.93), ice), 1. - smoothstep(1.7, 3.6, px));
  }
  vec3 iceCol(vec3 water, vec2 p, float seamD, float open, float px){       // (whole, as it was: for a caller that stands outside every branch)
    if (uIce < 0.5) return water;
    vec2 pl = icePlate(p);
    return iceLaid(water, p, seamD, open, px, pl, vec3(fwidth(pl.x), fwidth(seamD), fwidth(open)));
  }
  // fired enamel: flat colour, hard terminator leaning to jade-black, dark glossy rim, one tight hard highlight
  vec3 gShade = vec3(-1.);                                  // set to a colour to shade toward it instead of the pond's jade-black
  vec3 enamel(vec3 base, vec3 N, float gloss){
    vec3 V = vV/max(length(vV), 1e-4); vec3 sh = gShade.x < 0. ? uPal[2] : gShade;
    // amber's shade leans to vermilion, not to jade-black: its dark side is orange, never mustard or brown
    if (gShade.x < 0.) sh = mix(sh, uPal[1]*0.72, smoothstep(0.25, 0.42, base.g/max(base.r, 1e-3))*smoothstep(0.5, 0.8, (base.r - base.b)/max(base.r, 1e-3)));
    if (dot(N, V) < 0.) N = -N;
    float nl = dot(N, vL), w = fwidth(nl) + 1e-4;
    vec3 col = mix(mix(base, sh, 0.40), base, smoothstep(-w, w, nl - 0.08));
    float nv = dot(N, V), wv = fwidth(nv) + 1e-4;
    col = mix(mix(col, sh, 0.62), col, smoothstep(-wv, wv, nv - 0.23));
    vec3 H = vL + V; H = H/max(length(H), 1e-4);
    float h = dot(N, H), wh = fwidth(h) + 1e-4;
    col = mix(col, uPal[6], gloss*smoothstep(-wh, wh, h - 0.972));
    return col;
  }
  // distance is counted in reflections: each one keeps uGenGain of the light and leans a step toward plum
  // (a warm pigment leans to rose on its way to plum, so a dimmed amber is plum-red, never brown)
  vec3 generation(vec3 col, float g){
    float kp = pow(uGenPlum, g), warm = smoothstep(0.3, 0.7, (col.r - col.b)/max(col.r, 1e-3)), w = warm*(1. - kp);
    col.g = mix(col.g, min(col.g, 0.07*col.r), 0.9*warm*(1. - pow(0.74, g)));        // amber dims THROUGH vermilion (orange, then red), then to rose-plum with the rest: never tan
    col.g *= 1. - 0.62*w; col.b = mix(col.b, max(col.b, 0.22*col.r), w);
    kp *= 1. - smoothstep(uGenCut, uGenCut + 5., g);
    return mix(uPal[5], col*pow(uGenGain, g), kp);
  }
  const vec3 LACQ = vec3(0.0044, 0.0137, 0.0110);            // black lacquer #0E1F1B: trunks, boughs and the Tongue's rib, whatever colour the water is
  // the cracked mirror: a copy flagged late (seed >= 2) is the same garden an hour on, in blue dusk
  vec3 lateHour(vec3 c){ float l = dot(c, vec3(0.3, 0.5, 0.2)); return mix(c, vec3(0.17, 0.27, 0.52)*(0.3 + 1.5*l), 0.74*step(1.5, vInfo.w)); }
  vec4 finish(vec3 col){ return vec4(toScene(generation(lateHour(col), vInfo.x)), 1.); }`;

// ---- material factory -----------------------------------------------------------------------------------------
// enamelMaterial(U, { slots, vertDecl, vertMove, fragDecl, fragColor, defines, ...material props })
//   geometry attributes: position, normal (DISC space, metres), aInk vec2 (palette index, gloss 0..1),
//   plus the per-copy instanced attributes written by applyCopies(): instanceMatrix, iInfo, iClip.
//   slots > 0: the object's place on the disc comes from uSlot[iInfo.y] = (x, z, yaw, scale); scale 0 collapses it.
//   vertMove: GLSL that may edit `vec3 p, n` (disc space) ; fragColor: GLSL that may edit `vec3 base; float gloss; vec3 N`.
export function enamelMaterial(U, o = {}) {
  const slots = o.slots | 0;
  const uniforms = { ...U, ...(o.uniforms || {}) };
  if (slots) uniforms.uSlot = { value: Array.from({ length: slots }, () => new THREE.Vector4(0, 0, 0, 0)) };
  const mat = new THREE.ShaderMaterial({
    uniforms, side: o.side ?? THREE.DoubleSide, transparent: !!o.transparent, depthWrite: o.depthWrite ?? true,
    blending: o.blending ?? THREE.NormalBlending, defines: o.defines || {},
    vertexShader: /* glsl */`
      ${STYLE_VERT_GLSL}
      attribute vec2 aInk; varying vec2 vInk; varying vec3 vP;
      ${slots ? `uniform vec4 uSlot[${slots}];` : ''}
      ${o.vertDecl || ''}
      void main(){
        vec3 p = position, n = normal; float alive = 1.;
        ${slots ? `vec4 sl = uSlot[int(iInfo.y + 0.5)]; float sc_ = cos(sl.z), ss_ = sin(sl.z); alive = step(1e-4, sl.w);
        p = vec3(sc_*p.x - ss_*p.z, p.y, ss_*p.x + sc_*p.z)*sl.w + vec3(sl.x, 0., sl.y);
        n = vec3(sc_*n.x - ss_*n.z, n.y, ss_*n.x + sc_*n.z);` : ''}
        vP = position; vInk = aInk;
        ${o.vertMove || ''}
        gl_Position = gardenVertex(${o.wedgeSpace ? 'p, n' : 'discToWedge(p), discDir(n)'});
        if (alive < 0.5) gl_Position = vec4(0., 0., 2., 1.);
      }`,
    fragmentShader: /* glsl */`
      ${STYLE_FRAG_GLSL}
      varying vec2 vInk; varying vec3 vP;
      ${o.fragDecl || ''}
      void main(){
        // EVERY CUT IS DECIDED WHERE IT STANDS AND MADE LATE: a derivative taken after a discard is not defined (the rim of every cut came out
        // different on each draw). So a cut sets the bool cut (here, and in a fragColor piece: cut = true, never a discard), and the one
        // discard stands after the last fwidth: after enamel(), or after fragEnd when a material has one. A piece that leaves main by return
        // must make the cut itself, after its own last fwidth.
        bool cut = ${o.noClip ? 'false' : 'clipWedge()'};
        if (vInk.x < 1.5 && (uBare > 0.5 || vInfo.w > 1.5)) discard;   // (made here: an ink is one value over a triangle and vInfo.w one over a copy, so this takes whole triangles and leaves no rim)
        { float d2 = dot(vV, vV); if (d2 < 2.6) cut = true;                // foliage never sits on the lens: it parts in a bubble round it, and in the clear cone
          // (round 12: opts.lensCut false leaves the cut by the lens's distance out of a material whose bodies are kept off the route by place; the bubble and the clear cone stay)
          if (vInk.x < 1.5 && (${o.lensCut === false ? '' : `d2 < max(${((o.nearCut ?? 7.5) ** 2).toFixed(1)}, uPadCut*uPadCut) || `}(${o.keepIf ? '!(' + o.keepIf + ') && ' : ''}d2 < uClearFar*uClearFar && dot(-vV, uClear.xyz) > uClear.w*sqrt(d2)))) cut = true; }
        vec3 base = uPal[int(clamp(vInk.x, 0., 6.) + 0.5)]; float gloss = vInk.y;
        vec3 N = vN/max(length(vN), 1e-4);
        ${o.fragColor || ''}
        vec3 lit = enamel(base, N, gloss);
        ${o.fragEnd ? '' : 'if (cut) discard;'}
        gl_FragColor = finish(lit);
        ${o.fragEnd ? o.fragEnd + '\n        if (cut) discard;' : ''}
      }`,
  });
  return mat;
}

// ---- the copies: every mirror image of the wedge that this piece draws ----------------------------------------
const PHI = (1 + Math.sqrt(5)) / 2;
export const GLOBE = { R: 150, Ra: 157, centerY: GLOBE_CY, pitch: 35 * Math.PI / 180, slitHalf: 8 };

/** Builds the 120 half-facets of the Globe (icosahedral mirror group, breadth-first so word length = generation)
 *  and the 28 half-pages of the Tongue. Returns { copies:[{matrix, gen, shell, seed, clip:[ix,ih,iz,lean]}], apex, tongue } */
export function makeCopies(rng) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const Bp = V(0, 1 / PHI, PHI).normalize().multiplyScalar(GLOBE.R), Bq = V(0, -1 / PHI, PHI).normalize().multiplyScalar(GLOBE.R);
  const C0 = Bp.clone().add(Bq).multiplyScalar(0.5), Ap = V(1, 0, PHI).normalize().multiplyScalar(GLOBE.Ra);
  const ex = Ap.clone().sub(C0).multiplyScalar(1 / WEDGE.ax), ez = Bp.clone().sub(C0).multiplyScalar(1 / WEDGE.bz);
  const ny = ez.clone().cross(ex).normalize(); if (ny.dot(C0) > 0) ny.negate();
  ny.multiplyScalar((ex.length() + ez.length()) / 2);
  const T0 = new THREE.Matrix4().makeBasis(ex, ny, ez).setPosition(C0);
  const refl = (n) => { n = n.clone().normalize(); const m = new THREE.Matrix4(); m.set(1 - 2 * n.x * n.x, -2 * n.x * n.y, -2 * n.x * n.z, 0, -2 * n.x * n.y, 1 - 2 * n.y * n.y, -2 * n.y * n.z, 0, -2 * n.x * n.z, -2 * n.y * n.z, 1 - 2 * n.z * n.z, 0, 0, 0, 0, 1); return m; };
  const gens = [refl(V(0, 1, 0)), refl(V(1, 0, 0)), refl(Ap.clone().cross(Bp))];   // mirrors z=0, x=0, hypotenuse
  const probe = V(0.31, 0.57, 0.83), key = (m) => { const p = probe.clone().applyMatrix4(m); return [p.x, p.y, p.z].map((v) => Math.round(v * 1e4)).join(','); };
  const seen = new Map(), queue = [{ g: new THREE.Matrix4(), gen: 0, word: '' }];
  seen.set(key(queue[0].g), 1);
  for (let qi = 0; qi < queue.length && queue.length < 130; qi++) {
    const e = queue[qi];
    for (let i = 0; i < 3; i++) {
      const g = e.g.clone().multiply(gens[i]), k = key(g);
      if (!seen.has(k)) { seen.set(k, 1); queue.push({ g, gen: e.gen + 1, word: e.word + i }); }
    }
  }
  const tilt = new THREE.Matrix4().makeRotationX(GLOBE.pitch);          // the slit hub (0,0,1) goes to (0,-sin35,cos35)
  const copies = [];
  const slip = () => { const m = new THREE.Matrix4(); if (rng() < 0.34) { m.makeRotationX((rng() - 0.5) * 0.014); m.setPosition((rng() - 0.5) * 0.3, 0, (rng() - 0.5) * 0.3); } else { rng(); rng(); rng(); } return m; };
  for (const e of queue) {
    const atSlit = e.word === '' || e.word === '0' || e.word === '1' || e.word === '01' || e.word === '10';
    const m = tilt.clone().multiply(e.g).multiply(T0).multiply(slip());
    copies.push({ matrix: m, gen: e.gen, shell: 1, seed: rng(), clip: [atSlit ? GLOBE.slitHalf : 1.3, 1.3, 0.12, atSlit ? 2 : 1] });   // (lean 2: a leaning copy whose maple is not drawn. The four quarter-gardens that meet at the slit's hub are open water: the way in is clear, and the hollow is seen whole from the crossing)
  }
  const q = V(0, 0, 0).applyMatrix4(T0.clone().invert());
  const apex = V(q.x / q.y, q.z / q.y, (WEDGE.hd - WEDGE.hn[0] * q.x - WEDGE.hn[1] * q.z) / q.y);
  // --- the Tongue: seven pairs of garden pages on a rising spine, each pair opened 8 degrees less flat than the last
  const cy = GLOBE.centerY, sp = Math.sin(GLOBE.pitch), cp = Math.cos(GLOBE.pitch);
  const slit = V(0, cy - GLOBE.R * sp, GLOBE.R * cp), head = V(0, sp, -cp), up = V(0, cp, sp);
  const L = [84, 72, 62, 52, 44, 36, 30], TH = [0, 3, 7, 12, 18, 26, 35], spine = [];
  const tip = slit.clone().addScaledVector(up, -20).addScaledVector(head, -16);
  let rise = 0; for (let k = 0; k < 7; k++) rise += L[k] * Math.sin(TH[k] * Math.PI / 180);
  const fit = tip.y / rise;                                              // root lies exactly on the plain
  let p = tip.clone(); spine[7] = p.clone();
  for (let k = 6; k >= 0; k--) { const th = TH[k] * Math.PI / 180; p = p.clone().addScaledVector(V(0, Math.sin(th), -Math.cos(th)), -L[k] * fit); spine[k] = p.clone(); }
  const pages = [];
  for (let k = 0; k < 7; k++) {
    const th = TH[k] * Math.PI / 180, t = V(0, Math.sin(th), -Math.cos(th)), u = V(0, Math.cos(th), Math.sin(th));
    const rho = (k + 1) * 4.5 * Math.PI / 180, sc = L[k] * fit / 110, gut = 1.6 + 0.95 * k;
    for (const side of [1, -1]) {
      const w = V(side * Math.cos(rho), 0, 0).addScaledVector(u, Math.sin(rho)), n = V(-side * Math.sin(rho), 0, 0).addScaledVector(u, Math.cos(rho));
      const c = spine[k].clone().add(spine[k + 1]).multiplyScalar(0.5).addScaledVector(w, gut);
      pages.push({ k, side, c, w, n, t, sc, rho });
      const pageSeed = rng();
      for (const zs of [1, -1]) {
        const m = new THREE.Matrix4().makeBasis(w.clone().multiplyScalar(sc), n.clone().multiplyScalar(sc), t.clone().multiplyScalar(sc * zs)).setPosition(c);
        copies.push({ matrix: m, gen: 0.3 + k * 0.22, shell: 0, seed: pageSeed, clip: [clamp(1.5 / sc, 2.2, 5.5), clamp(1.5 / sc, 2.2, 5.5), 0.12, -1] });   // (the rim: a gold wire about a metre and a half wide round every page, whatever its scale)   // the pages we fly over are near: nearly the true garden
      }
    }
  }
  return { copies, apex, tongue: { spine, pages, slit, head, up, tip, TH } };
}

/** Gives a geometry the per-copy instanced attributes and returns an InstancedMesh with count = copies x slots. */
export function applyCopies(geometry, material, copies, slots = 1) {
  const n = copies.length * slots, mesh = new THREE.InstancedMesh(geometry, material, n);
  const info = new Float32Array(n * 4), clip = new Float32Array(n * 4);
  for (let s = 0, i = 0; s < slots; s++) for (const c of copies) {
    mesh.setMatrixAt(i, c.matrix);
    info.set([c.gen, s, c.shell, c.seed], i * 4); clip.set(c.clip, i * 4); i++;
  }
  geometry.setAttribute('iInfo', new THREE.InstancedBufferAttribute(info, 4));
  geometry.setAttribute('iClip', new THREE.InstancedBufferAttribute(clip, 4));
  mesh.frustumCulled = false; mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

// ---- small geometry builder (positions, normals, aInk) ----
function geo() {
  const P = [], N = [], K = [], I = [];
  const g = {
    P, N, K, I,
    v(x, y, z, nx, ny, nz, ink, gloss = 0.8) { P.push(x, y, z); N.push(nx, ny, nz); K.push(ink, gloss); return P.length / 3 - 1; },
    tri(a, b, c) { I.push(a, b, c); }, quad(a, b, c, d) { I.push(a, b, c, a, c, d); },
    build(flat = false) {
      let bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      bg.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      bg.setAttribute('aInk', new THREE.Float32BufferAttribute(K, 2));
      bg.setIndex(I);
      if (flat) { bg = bg.toNonIndexed(); bg.computeVertexNormals(); }
      return bg;
    },
  };
  return g;
}
const HASH_GLSL = /* glsl */`
  float hash1(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.x); }`;

// ---- the plate: pond face, glowing seam strips, dusk-glass back. One wedge-fixed prism per copy. ----
function plateGeometry() {
  const g = geo();
  // position = (corner id 0 C / 1 A / 2 B, layer 0 pond-inset / 1 seam-outer / 2 back, part 0 pond / 1 seam / 2 back)
  const c = (id, lay, part, ny) => g.v(id, lay, part, 0, ny, 0, 2, 1);
  g.tri(c(0, 0, 0, 1), c(2, 0, 0, 1), c(1, 0, 0, 1));
  for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) g.quad(c(a, 0, 1, 1), c(b, 0, 1, 1), c(b, 1, 1.999, 1), c(a, 1, 1.999, 1));
  g.tri(c(0, 2, 2, -1), c(1, 2, 2, -1), c(2, 2, 2, -1));
  for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) g.quad(c(a, 0, 2, -0.2), c(b, 0, 2, -0.2), c(b, 2, 2, -0.2), c(a, 2, 2, -0.2));
  return g.build();
}
// pass 0 (opaque): pond face (seen from above only) and seam strips. pass 1 (blended, no depth write): the glass
// back and skirt, so that from outside the garden is seen from beneath through dusk-coloured glass.
function plateMaterial(U, extra, pass) {
  return enamelMaterial(U, {
    wedgeSpace: true, noClip: true, uniforms: extra,
    vertDecl: /* glsl */`varying float vPart; varying vec3 vCamW; varying vec2 vDisc; varying float vAlong; varying vec3 vPane; varying float vLean, vPar;`,
    vertMove: /* glsl */`
      vCamW = (inverse(copyMatrix())*vec4(cameraPosition, 1.)).xyz;
      float lay = position.y; vec3 ins = iClip.xyz;
      ins.z = max(ins.z, 0.001*length(vCamW - vec3(PIVOT.x, 0., PIVOT.y)));        // the hairline seam never thins below ~1.5 px
      bool page = iClip.w < -0.5 && iClip.w > -1.5;                                // a page of the Tongue: its rim is a cloison wire, drawn whole
      if (lay > 0.5 && lay < 1.5) ins = page ? vec3(0., 0., max(ins.z - 1.3, 0.)) : max(ins - 1.3, 0.) - clamp(0.003*length(vCamW - vec3(PIVOT.x, 0., PIVOT.y)), 0.05, 0.5);   // (review 6: each strip LAPS a little past its mirror line, and the fragment stage trims the lap to under a pixel: no crack between the two copies that share a line, so a thread's core is one unbroken line)
      if (lay > 1.5) ins = vec3(page ? vec2(0.) : max(iClip.xy - 1.3, 0.), -0.25);                   // the glass back runs out to the mirror lines: pane meets pane (and laps its other half, so no crack shows the seam behind)
      const vec2 HN = vec2(${WEDGE.hn[0]}, ${WEDGE.hn[1]}); const float HD = ${WEDGE.hd.toFixed(1)};
      vec2 q = position.x < 0.5 ? ins.xz : position.x < 1.5 ? vec2((HD - ins.y - HN.y*ins.z)/HN.x, ins.z) : vec2(ins.x, (HD - ins.y - HN.x*ins.x)/HN.y);
      p = vec3(q.x, lay > 1.5 ? -1.6 : 0., q.y); n = normalize(normal + vec3(0.001, 0., 0.));
      // (10c: the strips lie flat on the plain again, as in the version on the site; a ridge that rose with its distance from the lens is out)
      vPart = position.z; vAlong = q.x + q.y*0.7; vLean = iClip.w; vPar = step(0.5, mod(floor(iInfo.x + 0.5), 2.));   // (which side of the mirror this half-garden is: light and dark alternate round the ball)
      vPane = (copyMatrix()*vec4(34., 0., 17., 1.)).xyz;                            // this half-garden's centre, in the world (the same at every corner)
      vDisc = wedgeToDisc(q);
      if (${pass === 1 ? 'position.z < 1.9995' : 'position.z > 1.9995'}) alive = 0.;`,
    fragDecl: /* glsl */`
      varying float vPart; varying vec3 vCamW; varying vec2 vDisc; varying float vAlong; varying vec3 vPane; varying float vLean, vPar;
      float sdTaper(vec2 p, vec2 a, vec2 b, float ra, float rb){ vec2 ab = b - a; float h = clamp(dot(p - a, ab)/max(dot(ab, ab), 1e-3), 0., 1.); return length(p - a - ab*h) - mix(ra, rb, h); }
      uniform vec4 uCrown[6]; uniform vec3 uKoiW[4]; uniform vec3 uKey, uKeyW, uSlitCol; uniform float uInside; uniform vec4 uRing, uTrunk, uBandC;
      uniform float uKoiT, uKoiYaw, uMirrorN, uJoint, uNearR;
      ${KOI_GLSL}
      // a koi drawn flat on the glass or the near water: a curved body through four points of its own path (nose, shoulder, middle, tail root),
      // a forked tail, two pectoral fins; sad: the field of its saddle
      float koiBody(vec2 p, vec2 n0, vec2 s0, vec2 m0, vec2 t0, out float sad){
        vec2 bk = t0 - m0; bk = bk/max(length(bk), 1e-3); vec2 pr = vec2(-bk.y, bk.x);
        float d = min(min(sdTaper(p, n0, s0, 0.55, 1.45), sdTaper(p, s0, m0, 1.45, 1.15)), sdTaper(p, m0, t0, 1.15, 0.3));
        d = min(d, min(sdTaper(p, t0, t0 + bk*2.7 + pr*1.6, 0.16, 0.6), sdTaper(p, t0, t0 + bk*2.7 - pr*1.6, 0.16, 0.6)));
        vec2 fw = s0 - n0; fw = fw/max(length(fw), 1e-3); vec2 fp = vec2(-fw.y, fw.x);
        d = min(d, min(sdTaper(p, s0, s0 - fw*0.7 + fp*2.4, 0.32, 0.1), sdTaper(p, s0, s0 - fw*0.7 - fp*2.4, 0.32, 0.1)));
        sad = length(p - mix(s0, m0, 0.4)) - 1.2;
        return d;
      }
      ${HASH_GLSL}
      ${LEAF_GLSL}
      // the crown, mirrored in the water the way it is drawn above: each bough's pad a lobed rosette with a heart of the other leaf
      // colour and a dark rim, and two leaf cards let go beside it. px: metres per pixel on the water (taken before the call).
      float crownMirror(vec3 ro, vec3 rd, float px, out vec3 rc){
        float cov = 0.; rc = vec3(0.);
        float ry = max(rd.y, 0.06);
        for (int i = 0; i < 6; i++){
          vec4 c = uCrown[i]; float t = (c.y - ro.y)/ry;
          if (c.w > 1. && t > 0. && float(i) < uMirrorN) {
            vec2 d = (ro.xz + rd.xz*t) - c.xz; float rad = length(d), R0 = c.w*1.3, fi = float(i);
            if (rad < R0*2.4) {
              float e = clamp(0.3*px*(1. + 0.02*t), 0.03, 2.), fineK = 1. - smoothstep(0.35, 1.5, e);   // hard enamel edges; lobes and cards drop out when too fine
              float ang = rad > 1e-3 ? atan(d.y, d.x) : 0.;
              float lob = R0*(0.82 + 0.20*cos(5.*ang + fi*1.9)*fineK);
              float inP = 1. - smoothstep(lob - e, lob + e, rad);
              bool amb = (i == 1 || i == 4);
              vec3 pc = amb ? uPal[0] : uPal[1], hc = amb ? uPal[1] : uPal[0];
              if (inP > 0.) {
                vec3 col = mix(hc, pc, max(smoothstep(0.36*lob - e, 0.36*lob + e, rad), 1. - fineK));
                float rimW = max(0.09*R0, 1.5*e);
                col = mix(col, mix(pc, uPal[2], 0.72), smoothstep(lob - rimW - e, lob - rimW + e, rad)*fineK);
                rc = mix(rc, col, inP); cov = max(cov, inP);
              }
              for (int k = 0; k < 2; k++){
                float ak = fi*2.4 + float(k)*2.6 + 0.6, sz = 2.3;
                vec2 q = d - R0*(1.5 + 0.35*float(k))*vec2(cos(ak), sin(ak));
                if (dot(q, q) < sz*sz && fineK > 0.01) {
                  float ca = cos(ak*1.7), sa = sin(ak*1.7); vec2 uv = vec2(ca*q.x - sa*q.y, sa*q.x + ca*q.y)/sz;
                  float lf = leafShape(uv), inL = smoothstep(0., 2.*e/sz, lf)*fineK;
                  vec3 lc = (k == 0) == amb ? uPal[1] : uPal[0];
                  lc = mix(mix(lc, uPal[2], 0.7), lc, smoothstep(0.05, 0.05 + 2.*e/sz, lf));
                  rc = mix(rc, lc, inL); cov = max(cov, inL);
                }
              }
            }
          }
        }
        return cov;
      }`,
    fragColor: /* glsl */`
      vec3 Vw = vCamW - vW; Vw = Vw/max(length(Vw), 1e-4); float glassA = 1.;
      float px = fwidth(vW.x) + fwidth(vW.z);
      // A SEAM IS A THREAD. On the plain and the Tongue the strip is 1.3 m of each garden, but only a thread of it is drawn: one
      // percent of the frame across both halves at any distance (seam gold on the mirror line, a thin amber edge); the rest of
      // the strip is the pond's own black water, mirror and rings and all.
      vec3 mdS = mirrorDist(vec3(vW.x, 0., vW.z)); mdS.xy -= max(vInset.xy - 1.3, 0.);   // (measured from the strip's own outer edge: a pane beside the slit stands back from its mirror)
      float sdS = min(mdS.x, mdS.y), wsd = fwidth(sdS) + 1e-4, distS = length(vV);
      // EACH PASS HOLDS ONLY ITS OWN TEXT. Pass 1 (the glass back) draws no pond and no strip: vPart is 2 at every corner it draws, so the
      // pond's and the thread's widths, the lap and both their branches are left out of its text. Pass 0 leaves at the end of its own
      // share of the back (below) on every path and never reaches the back's text, which is left out of pass 0.
      ${pass === 0 ? /* glsl */`
      float thW = clamp(mix(0.0092, 0.0078, step(0.5, vInfo.z))*distS*mix(0.55, 1., smoothstep(8., 30., distS)), 0.03, 1.3);   // (finer beside the lens: at the bottom edge a thread with its amber edge is under ten pixels)
      bool pageS = vLean < -0.5 && vLean > -1.5;
      bool wideS = !pageS && vPart > 0.5 && vPart < 1.999 && sdS < 1.3001 && mdS.z > max(0.13, 0.0011*distS);   // (review 6: the Globe's leading too: ONE burning thread with its ivory core from the lens to the hub, a hundredth of the frame across at any distance, never a plum band that fades into a thread)
      float wzE = fwidth(vW.z) + 1e-4, wDistE = fwidth(length(vV)) + 1e-4, wPE = fwidth(length(vDisc) - 27.) + 1e-4;   // (for the edge pixels that reach the back: see there)
      float wsz = fwidth(mdS.z) + 1e-4, lapS = min(sdS + max(0.75*wsd, 0.3*thW), mdS.z + max(0.75*wsz, 0.03));
      if (!pageS && vPart > 0.5 && vPart < 1.999 && lapS < 0.) cut = true;   // the lap past the mirror line, trimmed (decided here, made below: see cut in the factory's main)
      // EVERY WIDTH THE POND AND THE THREAD TAKE STANDS HERE, above their branches and above every cut. One strip holds pixels of both
      // branches, and a width taken inside a branch that not every pixel of a block of four takes is as undefined as one taken after a
      // discard. So what each width is taken of is computed on every pixel (the same expressions as before, moved up), and each branch
      // makes the cut at its head, where no width follows.
      float tS = (vPart - 1.)/0.999, wtS = fwidth(tS) + 1e-4;                                             // the thread (seam strip)
      float calm = smoothstep(0.05, 0.4, Vw.y)*mix(1., 0.5, step(vInfo.z, -0.5));                       // seen at a grazing angle the mirror lies flat: a wobble there would smear every reflection into strips
      vec3 Nw = normalize(vec3((0.016*sin(vDisc.x*0.83 + uTime*1.1) + 0.012*sin(vDisc.y*1.9 - uTime*0.7))*calm, 1., 0.016*sin(vDisc.y*0.71 - uTime*0.9)*calm));
      vec3 R = reflect(-Vw, Nw);
      float gz = abs(R.y), wgz = fwidth(gz) + 1e-4;
      float hk = dot(R, uKey), wk = fwidth(hk) + 1e-4;
      ` : ''}
      // January: the ice's three widths too (of its plate's edge, of the seam, of the open water), for the pond here and for the near water of the glass back
      vec2 iceP = vec2(0.); vec3 iceW = vec3(0.); float openS = 0.;
      if (uIce >= 0.5) {
        vec2 ga = vec2((vW.x - 58.)*1.45, vW.z*0.84), sa = vW.xz - vec2(0.5, 45.), sb = vec2(14., -17.5);   // open water round the moon gate's feet, the stepping stones and the tipper's knocking stone
        openS = length(ga) - 14.5;
        if (vInfo.z < -0.5) openS = min(min(openS, length(sa - sb*clamp(dot(sa, sb)/dot(sb, sb), 0., 1.)) - 3.0), length(vW.xz - vec2(43.5, 16.8)) - 5.2);   // (stones and tipper stand on the plain only)
        iceP = icePlate(vDisc); iceW = vec3(fwidth(iceP.x), fwidth(min(sdS, mdS.z)), fwidth(openS));
      }
      ${pass === 0 ? /* glsl */`
      if (vPart < 0.5 || (wideS && sdS > thW + wsd)) {                // ---- the pond: a jade-black mirror
        if (cut) discard;                                               // (the factory's cuts and the lap: every width stands above)
        if (vCamW.y < 0.) discard;                                      // (made here: vCamW is one value over a copy and no width follows on any path)
        float ring = 0.;
        for (int i = 0; i < 4; i++){
          float ph = fract(uTime*0.3 + uKoiW[i].z), rr = 1.2 + ph*8.;
          ring = max(ring, (1. - ph)*(1. - smoothstep(0.10, 0.26, abs(length(vW.xz - uKoiW[i].xy) - rr))));
        }
        vec2 cell = floor(vDisc/11.), f = vDisc - (cell + 0.5)*11.; float hs = hash1(cell);
        vec2 o = (vec2(hash1(cell + 3.1), hash1(cell + 7.7)) - 0.5)*6.;
        float ph = fract(uTime*0.21 + hs*7.), rr = 0.3 + ph*2.6;
        ring = max(ring, step(0.45, hs)*(1. - ph)*(1. - smoothstep(0.06, 0.2, abs(length(f - o) - rr))));
        // (review 8) the tipper's knock: ONE small ring spreading from its knocking stone on each pond of the plain, every six seconds
        { float pk = fract(uTime/6. - 0.87)*2.2; if (pk < 1. && vInfo.z < -0.5) ring = max(ring, (1. - pk*pk)*(1. - smoothstep(0.12, 0.28, abs(length(vW.xz - vec2(42.9, 16.4)) - (1.9 + 4.4*pk))))); }
        ring *= 1. - smoothstep(0.25, 0.7, px);
        // (review 8) the water is ONE flat tone; where it takes the dome's plum (seen flat) it does so across one hard contour, never a fade
        vec3 col = mix(uPal[2], uPal[5], 0.5*(1. - smoothstep(-wgz, wgz, gz - 0.2)));   // (calm, Nw, R, gz and its width: above the branch)
        vec3 rc; float hit = crownMirror(vW, R, px, rc)*(1. - 0.9*ring);   // (a ripple ring cuts the mirrored crown)
        hit *= mix(1., smoothstep(0.13, 0.21, R.y), step(vInfo.z, 0.5));   // on the plain a crown is mirrored only where the water is seen steeply enough to hold its shape: far water stays black
        col = mix(col, rc, 0.84*hit*(1. - uBare)*(1. - step(1.5, vInfo.w)));
        if (uRing.w > 0.5 && abs(vInfo.z) > 0.5 && abs(R.x) > 1e-3) {      // the plain's moon gate (plane x = uRing.x), mirrored in the water
          float tR = (uRing.x - vW.x)/R.x; vec3 hp = vW + R*max(tR, 0.); float rr = length(vec2(hp.y + 0.5, hp.z));
          if (tR > 0. && rr > uRing.y && rr < uRing.z) col = mix(col, mix(uPal[3], uPal[4], step(uRing.z - 1.6, rr)), 0.6);
        }
        col = mix(col, uPal[4], 0.6*ring);
        col = mix(col, uPal[6], smoothstep(-wk, wk, hk - 0.9996)*(1. - step(0.42, px)));   // (a glitter too fine to draw drops out: no dotted lattice on far ponds)
        if (uIce >= 0.5) col = iceLaid(col, vDisc, min(sdS, mdS.z), openS, px, iceP, iceW);   // (the open water, the plate and the three widths: above the branch)
        gl_FragColor = finish(col); return;
      }
      if (vPart < 1.999) {                                            // ---- seam strip: amber, gold core on the mirror line
        if (cut) discard;                                               // (the factory's cuts and the lap: the thread's width stands above)
        float t = tS, wt = wtS, thin = 0.;
        if (wideS) { t = clamp(1. - sdS/thW, 0., 1.); wt = wsd/thW; thin = 1. - smoothstep(0.5, 1.3, thW); }
        float nearK = 0.;   // the Globe's leading seen close: dark lacquer-plum with ONE gold hairline on the mirror line, not an amber slab and not a grey band
        float core = mix(smoothstep(-wt, wt, t - (1. - max(pageS ? 0.62 : mix(mix(0.30, 0.56, thin), 0.08, nearK), 1.3*wt))), 0.45, smoothstep(0.25, 0.5, wt));
        float gl = fract(vAlong/41. + vInfo.w + dot(Vw, vec3(0.9, 0.3, 0.7))*1.7 + uTime*0.05);
        float glint = core*(1. - smoothstep(0.02, 0.05, abs(gl - 0.5)));
        vec3 seamC = mix(uPal[0], uSlitCol, step(0.5, vInfo.z));                    // the Globe's leading burns with the slit light in every season
        vec3 col = mix(mix(seamC, uPal[5]*0.72, nearK), uPal[6], core*(1. - 0.6*smoothstep(0.25, 0.5, wt)));
        vec3 sc = toScene(mix(uPal[5], col*pow(uGenGain, vInfo.x*0.6), pow(uGenPlum, vInfo.x*0.6)));
        float farS = smoothstep(20., 90., distS);                                   // beside the lens the thread is the seam gold itself: no gain, a quiet glint, nothing blown
        if (wideS) sc *= smoothstep(-wsd, wsd, thW - sdS)*0.999 + 0.001;
        gl_FragColor = vec4(sc*(mix(mix(1.0, 1.25, farS), 0.8 + 0.45*core, nearK) + mix(0.3, 2.0, farS)*glint*(1. - nearK)), 1.); return;
      }
      ` : ''}
      // PASS 0 HOLDS THE POND AND THE STRIPS ONLY, yet a pixel on a strip's outer edge is worked out at its centre, which can lie past
      // the edge: there vPart runs past 1.999 and the pixel comes down here. The back's text takes widths of its own, and taken by one
      // pixel of a block of four after the others have left they are not defined (those pixels came out different on every draw).
      // So in pass 0 such a pixel is given here what the back gives it, from widths taken at the head: the joint's lap trimmed, the
      // pane's flat tone and limb, the pond's shadow, the joint's hairline, the near water's flat tone and contour, the slit's line.
      // THE SAME EXPRESSIONS AS IN THE BACK BELOW: KEEP THE TWO IN STEP. Left out, because they need the back's own widths: the far
      // highlight; the shadow of crown, trunk, mound and leaf cards; striders' rings and koi; what lies on the near water (mirrored
      // crown, cards, koi, rings); and the wall of a slit, which only a swaying page of the Tongue can reach here.
      ${pass === 0 ? `{ if (cut || vW.z < -max(0.75*wzE, 0.01)) discard;
        vec3 Vv = vV/max(length(vV), 1e-4); float dist = length(vV); vec3 salmon = mix(uPal[1], uPal[3], 0.5);
        if (dot(N, Vv) < 0.) N = -N;
        vec3 pd = vPane - uBandC.xyz; pd = uBandC.w > 0. ? pd/max(length(pd), 1e-3) : N;
        float hs = fract(vInfo.w*7.31 + 0.37), hs2 = fract(vInfo.w*13.7 + 0.11);
        float face = 0.5 + 0.10*dot(pd, uKeyW) + 0.12*max(-pd.y, 0.) + 0.46*(hs - 0.5) + 0.44*(vPar - 0.5);
        float stepK = floor(clamp((face - 0.2)/0.6, 0., 0.999)*4.);
        if (vLean > 1.5) stepK = pd.x*uKeyW.x > 0. ? 2. + step(0.5, hs2) : step(0.5, hs2);
        vec3 gcol = stepK < 0.5 ? uPal[5]*0.42 : stepK < 1.5 ? uPal[5]*0.80 : stepK < 2.5 ? mix(uPal[5], salmon, 0.075) : mix(uPal[5], salmon, 0.21);
        float limb = 1. - smoothstep(0.16, 0.34, abs(dot(N, Vv)));
        gcol = mix(gcol, mix(uPal[5], salmon, 0.17), 0.7*limb*step(stepK, 1.5)*smoothstep(60., 130., dist));
        float dP = length(vDisc) - 27., pondIn = 1. - smoothstep(-wPE, wPE, dP), lwP = max(0.7, 0.9*wPE);
        float shade = max(0.17*pondIn, 0.46*(1. - smoothstep(lwP - wPE, lwP + wPE, abs(dP)))*clamp(0.45/lwP, 0.35, 1.));
        gcol *= stepK < 0.5 ? 1. + 1.5*shade : 1. - shade;
        float nearW = 1. - smoothstep(-wDistE, wDistE, dist - uNearR);
        float jw = max(min(0.16, 0.0035*dist), 0.75*wzE), jo = fract(vInfo.w*3.71) < 0.34 ? 0.55 : 0.;
        float joint = 0.5*clamp(0.3/jw, mix(0.12, 0.5, smoothstep(27., 60., dist)), 1.)*(1. - smoothstep(jw - 0.5*wzE, jw + 0.5*wzE, abs(vW.z - jo)));
        gcol = mix(gcol, uSlitCol, joint*(1. - nearW));
        if (nearW > 0.) {
          vec3 wcol = mix(uPal[2], uPal[5], 0.5*(1. - smoothstep(0.10, 0.34, abs(dot(N, Vv)))));
          if (uIce >= 0.5) wcol = iceLaid(wcol, vDisc, 1e3, 1e3, px, iceP, vec3(iceW.x, 0., 0.));
          wcol = mix(wcol, uSlitCol, joint); gcol = mix(gcol, wcol, nearW);
          float lwN = max(0.07, 0.8*wDistE); gcol = mix(gcol, uPal[5]*0.3, (1. - smoothstep(lwN - wDistE, lwN + wDistE, abs(dist - uNearR)))*0.9); }
        gcol = mix(gcol, uSlitCol, 1. - smoothstep(-0.5*wsd, 0.5*wsd, sdS - max(mix(0.26, 0.08, nearW), 0.72*wsd)));   // (sdS and wsd: the back's rimD and wr, the same expressions, taken at the head)
        gl_FragColor = vec4(toScene(gcol), 1.); return; }` : /* glsl */`
      // ---- the back: a pane of dusk glass. ONE flat tone per pane (four steps, spread round the ball with only a gentle lean to
      // the key side, so no meridian divides it), a lighter limb at the silhouette, one hard highlight from afar, and light burning
      // only as one thin line where pane meets pane. The garden behind each pane lies on it as a shadow that never drops out:
      // pond edge, lobed crown, trunk, koi ticks, leaf cards drifting inward. Seen CLOSE (the crossing) the glass is the black
      // water itself: jade-black, the crown mirrored in it in vermilion, koi and ripple rings sliding on it.
      vec3 Vv = vV/max(length(vV), 1e-4); float dist = length(vV);
      vec3 salmon = mix(uPal[1], uPal[3], 0.5);
      if (dot(N, Vv) < 0.) N = -N;
      vec3 pd = vPane - uBandC.xyz; pd = uBandC.w > 0. ? pd/max(length(pd), 1e-3) : N;
      float hs = fract(vInfo.w*7.31 + 0.37), hs2 = fract(vInfo.w*13.7 + 0.11);
      float face = 0.5 + 0.10*dot(pd, uKeyW) + 0.12*max(-pd.y, 0.) + 0.46*(hs - 0.5) + 0.44*(vPar - 0.5);
      float stepK = floor(clamp((face - 0.2)/0.6, 0., 0.999)*4.);
      if (vLean > 1.5) stepK = pd.x*uKeyW.x > 0. ? 2. + step(0.5, hs2) : step(0.5, hs2);          // the panes either side of the slit: the key side a visible step lighter
      vec3 gcol = stepK < 0.5 ? uPal[5]*0.42 : stepK < 1.5 ? uPal[5]*0.80 : stepK < 2.5 ? mix(uPal[5], salmon, 0.075) : mix(uPal[5], salmon, 0.21);
      float limb = 1. - smoothstep(0.16, 0.34, abs(dot(N, Vv)));
      gcol = mix(gcol, mix(uPal[5], salmon, 0.17), 0.7*limb*step(stepK, 1.5)*smoothstep(60., 130., dist));   // the paper-moon limb: the dark panes lift at the silhouette
      // one hard highlight on the ball of glass, sliding from pane to pane as the view shifts (from afar only: close, it would be a stain)
      { vec3 Ns = (cameraPosition - vV) - uBandC.xyz; Ns = uBandC.w > 0. ? Ns/max(length(Ns), 1e-3) : N;
        vec3 Ng = mix(N, Ns, 0.6); Ng = Ng/max(length(Ng), 1e-3); vec3 Hg = uKeyW + Vv; Hg = Hg/max(length(Hg), 1e-4);
        float hg = dot(Ng, Hg), wg = fwidth(hg) + 1e-5;
        gcol = mix(gcol, mix(uPal[5], mix(uPal[3], salmon, 0.45), 0.5), smoothstep(-wg, wg, hg - 0.9968)*smoothstep(230., 340., dist)); }   // (round 9c: no rim crescent on the glass; the horizon's band stands behind the Globe instead)
      // THE GARDEN BEHIND THE PANE. Every mark is antialiased by the width of its own distance field (taken outside the loops),
      // and a mark thinner than a pixel is widened to it and thinned in ink, so nothing shimmers and nothing vanishes.
      float dP = length(vDisc) - 27., wP = fwidth(dP) + 1e-4;
      float pondIn = 1. - smoothstep(-wP, wP, dP), lwP = max(0.7, 0.9*wP);
      float pondEdge = (1. - smoothstep(lwP - wP, lwP + wP, abs(dP)))*clamp(0.45/lwP, 0.35, 1.);
      float dC = 1e3, heart = 0., dW = 1e3, heartW = 0., dHrt = 1e3, iW = 0.; vec4 cW = vec4(0., 0., 0., 1.);                               // dC: the crown's shadow on the glass; dW: its pads mirrored in the water, each a small separate lobed shape
      for (int i = 0; i < 6; i++){ vec2 dcr = vW.xz - uCrown[i].xz; float rr = length(dcr), ac = rr > 1e-3 ? atan(dcr.y, dcr.x) : 0.;
        float di = rr - uCrown[i].w*(1.42 + 0.22*cos(5.*ac + float(i)*1.9)); if (di < dC) { dC = di; heart = (i == 1 || i == 4) ? 1. : 0.; }
        float dj = rr - uCrown[i].w*(0.36 + 0.07*cos(5.*ac + float(i)*1.9)); if (dj < dW && (i == 0 || i == 2 || i == 4 || i == 5)) { dW = dj; heartW = (i == 4) ? 1. : 0.; dHrt = rr - uCrown[i].w*(0.15 + 0.035*cos(5.*ac + float(i)*1.9)); cW = uCrown[i]; iW = float(i); } }
      if (vLean > 1.5) {                                                                // (review 6) the panes beside the slit keep a pad of their own in the water we pass, whole inside the flank, wherever the disc's turn has carried the crown's; it draws in as one of those comes near
        float nearP = 1e3; for (int i = 0; i < 6; i++) if (i == 0 || i == 2 || i == 4 || i == 5) nearP = min(nearP, length(uCrown[i].xz - vec2(11.5, 7.8)) - 0.36*uCrown[i].w);
        float kP = smoothstep(2.8, 4.8, nearP); vec2 dcr = vW.xz - vec2(11.5, 7.8); float rr = length(dcr), ac = rr > 1e-3 ? atan(dcr.y, dcr.x) : 0.;
        float dj = rr - 6.6*kP*(0.36 + 0.07*cos(5.*ac + 0.7));
        if (kP > 0.02 && dj < dW) { dW = dj; heartW = 0.; dHrt = rr - 6.6*kP*(0.15 + 0.035*cos(5.*ac + 0.7)); cW = vec4(11.5, 0., 7.8, 6.6*kP); iW = 1.3; } }
      float wW = fwidth(dW) + 1e-4, distB = length(vV), wDist = fwidth(distB) + 1e-4;
      float wC = fwidth(dC) + 1e-4, cr = (1. - smoothstep(-wC, wC, dC))*(1. - uBare);
      vec2 pa = vW.xz - uTrunk.xy, ba = uTrunk.zw - uTrunk.xy; float hh = clamp(dot(pa, ba)/max(dot(ba, ba), 1e-3), 0., 1.);
      float dT = length(pa - ba*hh), wT = fwidth(dT) + 1e-4, lwT = max(1.1, 0.9*wT);
      float tr = (1. - smoothstep(lwT - wT, lwT + wT, dT))*clamp(1.1/lwT, 0.4, 1.);
      float dM = length(pa) - 7.5, wM = fwidth(dM) + 1e-4, lwM = max(0.5, 0.9*wM);       // the moss mound the maple stands on: a disc with its edge drawn
      float mound = max(0.5*(1. - smoothstep(-wM, wM, dM)), (1. - smoothstep(lwM - wM, lwM + wM, abs(dM)))*clamp(0.5/lwM, 0.35, 1.));
      float dK = 1e3, dSad = 1e3, kWho = 0.;
      for (int k = 0; k < 4; k++){ vec2 tg, t2; float fk = float(k), tau = uKoiT + fk*2.1; koiAt(fk, tau, tg); float sp = max(length(tg), 1.);   // each koi a curved fish with a forked tail, bending as it swims its own path
        vec2 tn = tg/sp, sv = vec2(-tn.y, tn.x); float wg = sin(uTime*2.2 + fk*1.7);
        vec2 n0 = koiAt(fk, tau + 4.6/sp, t2) - sv*0.3*wg, s0 = koiAt(fk, tau + 1.7/sp, t2), m0 = koiAt(fk, tau - 2.0/sp, t2) + sv*0.6*wg, t0 = koiAt(fk, tau - 5.4/sp, t2) - sv*1.1*wg;
        float sd1, dk = koiBody(vDisc, n0, s0, m0, t0, sd1); if (dk < dK) { dK = dk; dSad = sd1; kWho = fk; } }
      float wSad = fwidth(dSad) + 1e-4;
      float wK = fwidth(dK) + 1e-4, lwK = max(0., 0.8*wK - 1.1), kk = (1. - smoothstep(lwK - wK, lwK + wK, dK))*clamp(1.1/max(0.8*wK, 1e-3), 0.5, 1.);
      float lsh = 0., lshV = 0., lshA = 0.;
      for (int j = 0; j < 3; j++){ float ph = fract(uTime*0.045 + float(j)*0.37 + vInfo.w*5.), grow = smoothstep(0., 0.1, ph)*(1. - smoothstep(0.9, 1., ph));
        vec2 ql = (vW.xz - mix(uCrown[j].xz, vec2(34., 17.), ph))/(2.6*max(grow, 0.02));
        if (dot(ql, ql) < 1.) { float al = float(j)*2.1 + ph*4., cl = cos(al), sl = sin(al), lfv = leafShape(vec2(cl*ql.x - sl*ql.y, sl*ql.x + cl*ql.y)); if (lfv > lshV) { lshV = lfv; lshA = step(1.5, float(j)); } } }
      { float eL = clamp(0.25*px, 0.004, 0.2); lsh = smoothstep(0., 2.*eL, lshV)*(1. - step(1.1, 0.5*px))*(1. - uBare); }   // (review 6: a flat card with a hard edge, drawn in and out by its size: never a see-through stain)
      float ringW = 0.;                                                                 // water striders' dimples (as on the pond)
      { vec2 cell = floor(vDisc/11.), fc = vDisc - (cell + 0.5)*11.; float hc = hash1(cell);
        vec2 oc = (vec2(hash1(cell + 3.1), hash1(cell + 7.7)) - 0.5)*6.; float phr = fract(uTime*0.21 + hc*7.), rrr = 0.5 + phr*3.2;
        ringW = step(0.4, hc)*(1. - phr)*(1. - smoothstep(0.10, 0.30, abs(length(fc - oc) - rrr)))*(1. - smoothstep(0.25, 0.7, 0.5*px)); }
      // a school of small koi under the glass (seen only close: a twentieth of the frame each), each curving round its own small circle
      float fry = 0., frySad = 1e3;
      { vec2 cs = floor(vDisc/9.5), fc = vDisc - (cs + 0.5)*9.5; float hf = hash1(cs + 17.3), dirF = hf > 0.71 ? 1. : -1.;
        float af = uTime*(0.30 + 0.45*fract(hf*9.7))*dirF + hf*40., pxf = 0.5*px;
        vec2 qf = (fc - (vec2(hash1(cs + 4.4), hash1(cs + 9.1)) - 0.5)*1.6)*4.;                                        // (a koi a quarter the size of the great ones: three metres, on a circle of 3.2 m)
        float aN = af + 0.44*dirF, aS = af + 0.16*dirF, aM = af - 0.19*dirF, aT = af - 0.50*dirF, sdf;
        float df = koiBody(qf, 12.8*vec2(cos(aN), sin(aN)), 12.8*vec2(cos(aS), sin(aS)), 12.8*vec2(cos(aM), sin(aM)), 12.8*vec2(cos(aT), sin(aT)), sdf)*0.25, wf = clamp(0.6*pxf, 0.004, 0.2);
        fry = step(0.25, hf)*(1. - smoothstep(-wf, wf, df))*(1. - smoothstep(0.12, 0.3, pxf))*pondIn; frySad = sdf*0.25; }
      // ... and two that keep to the joint between the halves of the garden (wedge space: z = 0), each circling across it, so that beside the
      // slit a koi is always sliding nose to nose into its twin
      { float pxf = 0.5*px, wf = clamp(0.6*pxf, 0.004, 0.2);
        for (int j = 0; j < 2; j++){ float fj = float(j), dj2 = 1. - 2.*fj, aj = dj2*uJoint*(1. + 0.27*fj) + fj*1.9, sdj;   // (review 6: on the hero's joint clock, which the world keys to the flight: at the crossing a pair touches noses on the joint, mid-flank, on every seed and at any hour; every copy in step, as mirrors are)
          vec2 cj = vec2(17. + 14.*fj, 0.), ej = vec2(5.5, 4.2);   // (the first touches its twin 13 m along the joint: mid-flank beside the slit, whose panes stand 6.7 m back from the mirror)
          vec2 qj = (vW.xz - cj)*4.; float aN = aj + 0.42*dj2, aS = aj + 0.15*dj2, aM = aj - 0.18*dj2, aT = aj - 0.48*dj2;
          vec4 cA = cos(vec4(aN, aS, aM, aT))*ej.x*4., sA = sin(vec4(aN, aS, aM, aT))*ej.y; sA = (sqrt(sA*sA + 0.81) - 0.78)*4.;   // the koi does not swim THROUGH the mirror (half a fish is a bar): it comes to the joint nose first, touches its twin's nose there and turns away, whole all the while
          float dfj = koiBody(qj, vec2(cA.x, sA.x), vec2(cA.y, sA.y), vec2(cA.z, sA.z), vec2(cA.w, sA.w), sdj)*0.25;
          float fj2 = (1. - smoothstep(-wf, wf, dfj))*(1. - smoothstep(0.12, 0.3, pxf))*(1. - smoothstep(-wDist, wDist, distB - uNearR));
          if (fj2 > fry) { fry = fj2; frySad = sdj*0.25; } } }
      float nearW = 1. - smoothstep(-wDist, wDist, distB - uNearR);                           // within 25 m the pane is the black water itself: the change is a contour, never a fade
      { float shade = max(max(0.17*pondIn, 0.46*pondEdge), max(max(0.42*cr, 0.5*mound), max(0.6*tr, 0.55*lsh)));
        gcol *= stepK < 0.5 ? 1. + 1.5*shade : 1. - shade;                               // on the darkest panes the garden shows lighter than the glass, on the others darker
        gcol = mix(gcol, mix(uPal[5], salmon, 0.45), 0.5*ringW*(1. - nearW));              // a strider's dimple, as a ring of lighter glass
        gcol = mix(gcol, mix(uPal[5], uPal[3], 0.42), 0.6*max(kk, fry));
        // the joint between the two halves of one garden: a hairline, dimmer than the burning slits, one in three with the hair of offset
      }
      float wz = fwidth(vW.z) + 1e-4; if (vW.z < -max(0.75*wz, 0.01)) cut = true;     // (review 6: the two halves of a pane lap at the joint; the lap is trimmed to under a pixel so they never fight) (decided here; made below, after the last width of the back)
      // (the last widths of the back stand here: the slit's line and the slit's wall (above the wall's branch, as the pond's are). So the cuts
      // decided above, the factory's and the joint's lap, are made here, before the joint and the near water are worked out)
      vec3 md = mirrorDist(vec3(vW.x, 0., vW.z)); float rimD = min(md.x - max(vInset.x - 1.3, 0.), md.y - max(vInset.y - 1.3, 0.));
      float wr = fwidth(rimD) + 1e-4;
      float sy = clamp(-vW.y/1.6, 0., 1.), wy = fwidth(sy) + 1e-4, sx = vAlong*1.43, wx = fwidth(sx) + 1e-4;
      vec2 iceS = vec2(0.); float wIceS = 0.;
      if (uIce >= 0.5) { iceS = icePlate(vec2(sx, sy*22.)); wIceS = fwidth(iceS.x); }
      if (cut) discard;
      float jw = max(min(0.16, 0.0035*distB), 0.75*wz), jo = fract(vInfo.w*3.71) < 0.34 ? 0.55 : 0.;   // (a hairline at any distance)
      float joint = 0.5*clamp(0.3/jw, mix(0.12, 0.5, smoothstep(27., 60., dist)), 1.)*(1. - smoothstep(jw - 0.5*wz, jw + 0.5*wz, abs(vW.z - jo)));
      gcol = mix(gcol, uSlitCol, joint*(1. - nearW));
      if (nearW > 0.) {
        vec3 wcol = mix(uPal[2], uPal[5], 0.5*(1. - smoothstep(0.10, 0.34, abs(dot(N, Vv)))));
        vec3 leafC = mix(uPal[1], uPal[0], heart);
        leafC = mix(uPal[1], uPal[0], heartW);
        float crW = (1. - smoothstep(-wW, wW, dW))*(1. - uBare);                          // the crown mirrored as separate lobed pads, each with ONE crisp dark rim
        wcol = mix(wcol, leafC, crW);
        wcol = mix(wcol, mix(uPal[0], uPal[1], heartW), crW*(1. - smoothstep(-wW, wW, dHrt)));   // ... with a heart of the other leaf colour
        wcol = mix(wcol, leafC*0.36, crW*smoothstep(-wW, wW, dW + max(0.3, 1.5*wW)));
        for (int k2 = 0; k2 < 3; k2++){                                                 // ... and three leaf cards let go beside it, turning a little on the water
          float ak = iW*2.4 + float(k2)*2.1 + 0.6; vec2 ql = (vW.xz - cW.xz) - cW.w*(0.62 + 0.15*float(k2))*vec2(cos(ak), sin(ak));
          if (dot(ql, ql) < 2.25 && uBare < 0.5) { float at = ak*1.7 + 0.25*sin(uTime*0.5 + ak), ca = cos(at), sa = sin(at), eL = clamp(0.6*px, 0.004, 0.2)/1.5;
            float lf = leafShape(vec2(ca*ql.x - sa*ql.y, sa*ql.x + ca*ql.y)/1.5);
            vec3 lc = (k2 == 1) ? mix(uPal[0], uPal[1], heartW) : leafC; lc = mix(mix(lc, uPal[2], 0.7), lc, smoothstep(0.06, 0.06 + 2.*eL, lf));
            wcol = mix(wcol, lc, smoothstep(0., 2.*eL, lf)); } }
        { float eL = clamp(0.25*px, 0.004, 0.2); vec3 lc = mix(uPal[1], uPal[0], lshA); wcol = mix(wcol, mix(mix(lc, uPal[2], 0.7), lc, smoothstep(0.06, 0.06 + 2.*eL, lshV)), lsh); }
        wcol = mix(wcol, LACQ, 0.8*tr);
        wcol = mix(wcol, mix(uPal[4], uPal[2], 0.25), step(0.25, mound)*(1. - smoothstep(-wM, wM, dM)));
        { vec3 koiC = (uKoiMode > 0.5 && uKoiMode < 1.5) ? uPal[0] : uPal[3], bigC = (uKoiMode > 1.5 && kWho < 0.5) ? mix(uPal[2], uPal[5], 0.55) : koiC;
          bigC = mix(bigC, uKoiMode < 0.5 ? uPal[1] : uKoiMode < 1.5 ? mix(uPal[0], uPal[1], 0.6) : bigC, 1. - smoothstep(-wSad, wSad, dSad));   // the saddle
          { float wfs = clamp(0.3*px, 0.004, 0.2); vec3 fryC = mix(koiC, uKoiMode < 0.5 ? uPal[1] : uKoiMode < 1.5 ? mix(uPal[0], uPal[1], 0.6) : koiC, 1. - smoothstep(-wfs, wfs, frySad)); wcol = mix(wcol, fryC, fry); }
          wcol = mix(wcol, bigC, kk); }
        { vec2 cell = floor(vDisc/11.), fc = vDisc - (cell + 0.5)*11.; float hc = hash1(cell), eR = clamp(0.6*px, 0.006, 0.2), hwR = max(0.05, 0.7*px);   // two or three thin crisp rings
          vec2 oc = (vec2(hash1(cell + 3.1), hash1(cell + 7.7)) - 0.5)*6.; float phr = fract(uTime*0.21 + hc*7.), rrr = 0.5 + phr*3.2;
          wcol = mix(wcol, uPal[4], step(0.3, hc)*step(phr, 0.8)*(1. - smoothstep(hwR - eR, hwR + eR, abs(length(fc - oc) - rrr)))); }
        { vec2 c2 = floor(vW.xz/5.), f2 = vW.xz - (c2 + 0.5)*5. - (vec2(hash1(c2 + 5.9), hash1(c2 + 2.3)) - 0.5)*2.4; float h2 = hash1(c2 + 11.3), p2 = fract(uTime*0.23 + h2*5.);   // rain-fine rings on the black water beside the slit
          float e2 = clamp(0.6*px, 0.004, 0.1), hw2 = max(0.025, 0.7*px);
          wcol = mix(wcol, mix(uPal[4], uPal[3], 0.3), step(0.9, h2)*step(p2, 0.7)*(1. - smoothstep(hw2 - e2, hw2 + e2, abs(length(f2) - 0.3 - 1.5*p2)))); }
        if (uIce >= 0.5) wcol = iceLaid(wcol, vDisc, 1e3, 1e3, px, iceP, vec3(iceW.x, 0., 0.));   // (the plate and its edge's width: taken at the head, above every branch; the width of a constant is nought)
        wcol = mix(wcol, uSlitCol, joint);                                                // the joint: one burning hairline on the water
        gcol = mix(gcol, wcol, nearW);
        float lwN = max(0.07, 0.8*wDist);                                                 // where pane meets water: one dark line
        gcol = mix(gcol, uPal[5]*0.3, (1. - smoothstep(lwN - wDist, lwN + wDist, abs(distB - uNearR)))*0.9);
      }
      float rb = 1. - smoothstep(-0.5*wr, 0.5*wr, rimD - max(mix(0.26, 0.08, nearW), 0.72*wr));       // one thin burning line per slit (each pane draws half of it)   // (round 9c: a line is a seam. No gold jamb on the panes that flank the slit: the same 0.08 m line as on every other pane)
      gcol = mix(gcol, uSlitCol, rb);
      if (vW.y < -0.02 && vW.y > -1.58) {                                           // ---- the wall of a slit
        // From afar it is lit from inside (the amber burning between the panes). CLOSE (the crossing) it is the black water of the
        // facet we pass, tilted toward us: jade-black, one burning seam edge above, the mirrored crown, a koi and a ripple ring
        // sliding along it, and below it the edge of the glass in lacquer-plum with one gold hairline. Never an amber slab.
        float nearS = 1. - smoothstep(30., 70., dist);
        vec3 farC = mix(gcol, uSlitCol, (1. - smoothstep(1.6, 2.2, rimD))*0.85);
        vec3 sk = mix(uPal[2], uPal[5], 0.25);
        float blob = 0., amb = 0., padIn = 0.;
        for (int i = 0; i < 6; i++){ vec2 qb = vec2((sx - uCrown[i].z*1.9)/(uCrown[i].w*1.5), (sy - 0.34)/0.27); float ab = dot(qb, qb) > 1e-6 ? atan(qb.y, qb.x) : 0.;
          float v = length(qb)/(0.84 + 0.16*cos(5.*ab + float(i)*1.9)); if (v < 1. && uCrown[i].w > 1.) { padIn = 1.; blob = 1. - smoothstep(0.80, 0.84, v); amb = (i == 1 || i == 4) ? 1. : 0.; } }
        vec3 padC = mix(uPal[1], uPal[0], amb);
        sk = mix(sk, mix(mix(padC, uPal[2], 0.7), padC, blob), padIn*(1. - uBare));   // a hard-edged pad with one dark rim
        float tick = 0., rip = 0.;
        for (int k = 0; k < 3; k++){ float fk = float(k), zk = mod(uKoiT*(22. + 9.*fk) + fk*37. + vInfo.w*50., 130.) - 10.;
          vec2 qk = vec2((sx - zk)/5.0, (sy - (0.2 + 0.2*fk))/0.07); tick = max(tick, 1. - smoothstep(0.92, 1., length(qk)));
          float phr = fract(uTime*0.19 + fk*0.37 + vInfo.w*3.), zr = fract(vInfo.w*7. + fk*0.41)*110.;
          rip = max(rip, step(phr, 0.8)*(1. - smoothstep(0.05, 0.08, abs(length(vec2((sx - zr)/6., (sy - 0.45)/0.3)) - 0.25 - phr)))); }
        sk = mix(sk, (uKoiMode > 0.5 && uKoiMode < 1.5) ? uPal[0] : uPal[3], 0.9*tick);
        sk = mix(sk, uPal[4], 0.6*rip*(1. - smoothstep(0.02, 0.06, wy)));
        if (uIce >= 0.5) sk = iceLaid(sk, vec2(sx, sy*22.), 1e3, 1e3, wx + 22.*wy, iceS, vec3(wIceS, 0., 0.));
        float glassE = smoothstep(0.80 - wy, 0.80 + wy, sy);                           // the edge of the pane below the water
        sk = mix(sk, uPal[5]*0.62, glassE);
        float hl = max(0.012, 0.8*wy);
        sk = mix(sk, uPal[6], (1. - smoothstep(hl - wy, hl + wy, abs(sy - 0.9)))*clamp(0.012/hl, 0.4, 1.)*(1. - smoothstep(0.03, 0.08, hl)));        // one gold hairline on the glass
        float se = max(0.035, 0.9*wy);
        sk = mix(sk, mix(uSlitCol, uPal[6], 0.5), (1. - smoothstep(se - wy, se + wy, sy - 0.02))*(1. - 0.85*smoothstep(0.08, 0.25, wy)));                    // the burning seam edge of the pond
        gcol = mix(farC, sk, nearS); }
      gl_FragColor = vec4(toScene(gcol), 1.); return;`}`,
  });
}

// ---- the maple (DISC space, origin at the pivot): lacquer trunk and boughs on a moss mound, then the leaf cards ----
function tube(g, pts, radii, sides, ink, gloss, capEnd = true) {
  const n = pts.length, ring = [], t = new THREE.Vector3(), ref = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    t.subVectors(pts[Math.min(i + 1, n - 1)], pts[Math.max(i - 1, 0)]).normalize();
    ref.set(0.13, 0.2, 0.97); if (Math.abs(t.dot(ref.normalize())) > 0.9) ref.set(1, 0, 0);
    a.crossVectors(t, ref).normalize(); b.crossVectors(t, a);
    const row = [];
    for (let s = 0; s < sides; s++) {
      const an = (s / sides) * Math.PI * 2, cx = Math.cos(an), sx = Math.sin(an);
      const nx = a.x * cx + b.x * sx, ny = a.y * cx + b.y * sx, nz = a.z * cx + b.z * sx;
      row.push(g.v(pts[i].x + nx * radii[i], pts[i].y + ny * radii[i], pts[i].z + nz * radii[i], nx, ny, nz, ink, gloss));
    }
    ring.push(row);
  }
  for (let i = 0; i < n - 1; i++) for (let s = 0; s < sides; s++) { const s1 = (s + 1) % sides; g.quad(ring[i][s], ring[i][s1], ring[i + 1][s1], ring[i + 1][s]); }
  if (capEnd) { const e = pts[n - 1]; t.subVectors(e, pts[n - 2]).normalize(); const c = g.v(e.x + t.x * radii[n - 1], e.y + t.y * radii[n - 1], e.z + t.z * radii[n - 1], t.x, t.y, t.z, ink, gloss); for (let s = 0; s < sides; s++) g.tri(ring[n - 1][s], ring[n - 1][(s + 1) % sides], c); }
}
function buildMaple(rng, detail) {
  const g = geo(), V = (x, y, z) => new THREE.Vector3(x, y, z);
  const lean = rng.range(-0.5, 0.9), H = rng.range(25, 29), base = V(rng.range(-5, -2), 0, rng.range(-1, 4));
  const ld = V(Math.cos(lean), 0, Math.sin(lean));                       // leans this way, out over the pond
  // moss mound the tree stands on: a low faceted cushion
  { const R = 7.5, c = g.v(base.x, 1.5, base.z, 0, 1, 0, 4, 0.5), r1 = [], r2 = [];
    for (let s = 0; s < 8; s++) { const an = s / 8 * Math.PI * 2 + 0.3, k = 0.85 + 0.3 * rng(); r1.push(g.v(base.x + Math.cos(an) * R * 0.55 * k, 1.05, base.z + Math.sin(an) * R * 0.55 * k, Math.cos(an) * 0.4, 0.9, Math.sin(an) * 0.4, 4, 0.5)); r2.push(g.v(base.x + Math.cos(an) * R * k, -0.3, base.z + Math.sin(an) * R * k, Math.cos(an) * 0.85, 0.5, Math.sin(an) * 0.85, 4, 0.5)); }
    for (let s = 0; s < 8; s++) { const s1 = (s + 1) % 8; g.tri(c, r1[s1], r1[s]); g.quad(r1[s], r1[s1], r2[s1], r2[s]); } }
  // trunk: an S-curve with a root flare
  const tp = [], tr = [];
  for (let i = 0; i <= 6; i++) { const u = i / 6, y = 0.6 + u * H * 0.62, sway = Math.sin(u * 3.0) * 2.2; tp.push(V(base.x + ld.x * (u * u * 9) - ld.z * sway, y, base.z + ld.z * (u * u * 9) + ld.x * sway)); tr.push(lerp(1.75, 0.8, Math.sqrt(u)) * (i === 0 ? 1.5 : 1)); }
  tube(g, tp, tr, 6, 2, 1, false);
  // boughs
  const nb = 5, tips = [], sprays = [];
  for (let k = 0; k < nb; k++) {
    const u0 = 0.42 + 0.58 * (k / (nb - 1)), i0 = Math.min(5, Math.floor(u0 * 6)), f = u0 * 6 - i0;
    const o = tp[i0].clone().lerp(tp[Math.min(6, i0 + 1)], f);
    const an = lean + (k === nb - 1 ? 0.1 : (k % 2 ? 1 : -1) * rng.range(0.5, 1.5) + (k === 0 ? 2.6 : 0)), len = k === nb - 1 ? rng.range(10, 13) : rng.range(15, 23);
    const d = V(Math.cos(an), 0, Math.sin(an)), up = rng.range(0.35, 0.75) + (k === nb - 1 ? 0.6 : 0);
    const pts = [], rad = [], r0 = lerp(0.85, 0.5, k / nb);
    for (let i = 0; i <= 4; i++) { const u = i / 4, bend = Math.sin(u * 2.4 + k) * 1.6; pts.push(V(o.x + d.x * len * u - d.z * bend, o.y + len * (up * u - 0.42 * u * u), o.z + d.z * len * u + d.x * bend)); rad.push(lerp(r0, 0.16, u)); }
    tube(g, pts, rad, 4, 2, 1, true);
    tips.push(pts[4].clone());
    for (let i = 1; i <= 4; i++) sprays.push({ p: pts[i], r: lerp(3.2, 6.2, i / 4), w: i });
  }
  sprays.push({ p: tp[6], r: 5.5, w: 4 });
  // the reaching bough: one long low limb out along the lean, to a fine tip 29.7 m from the pivot. The world sets the disc
  // angle so that at the fold moment this tip comes to the seam beside the path and to its own twin, tip to tip: its middle
  // 0.15 m off the seam. (Round 11 halved the limb, the fold kept: the finer tip now ends 0.06 m short of the seam, its twin
  // as much; the disc's rocking carries it across.)
  const reach = { ang: lean, R: 32.8, y: 13 };                           // (high enough to pass over the moon gate's crown stone as the entry sees it)
  { const o = tp[4].clone(), e = V(Math.cos(lean) * reach.R, reach.y, Math.sin(lean) * reach.R), pts = [], rad = [];
    for (let i = 0; i <= 5; i++) { const u = i / 5, q = o.clone().lerp(e, u); q.y += 3.0 * Math.sin(u * Math.PI) * (1 - 0.5 * u); const bend = 1.4 * Math.sin(u * 5.2); q.x += -Math.sin(lean) * bend; q.z += Math.cos(lean) * bend; pts.push(q); rad.push(lerp(0.3, 0.09, u)); }   // (round 11, stage one, the owner's order of 11 Oct 2026: the limb's two radii halved, 0.6 and 0.18 before; the fold, the beat and reach.y are kept)
    pts[5].copy(e);
    tube(g, pts, rad, 3, 2, 1, true);
    sprays.push({ p: pts[2], r: 3.3, w: 3.5 }, { p: pts[3], r: 2.9, w: 3.5 }, { p: pts[4], r: 2.3, w: 3.5 }); }
  // foliage pads: the layered tiers of a Japanese maple, each a lobed, slightly domed rosette of enamel
  const padRanges = [];
  const padAt = sprays.filter((s, i) => s.w >= 2 && (i % 2 === 0 || s.w === 4 || s.w === 3.5));
  for (const s of padAt) {
    const R = s.r * rng.range(0.95, 1.3), ink = rng() < 0.3 ? 0 : 1, a0 = rng() * 6.283, tx = rng.range(-0.18, 0.18), tz = rng.range(-0.18, 0.18), L = 5;
    const c = g.v(s.p.x, s.p.y + R * 0.46, s.p.z, 0, 1, 0, ink, 0.9), ring = [];
    for (let i = 0; i < L * 2; i++) {
      const an = a0 + i / (L * 2) * Math.PI * 2, rr = R * (i % 2 ? 0.56 : rng.range(0.9, 1.2)), x = Math.cos(an) * rr, z = Math.sin(an) * rr;
      ring.push(g.v(s.p.x + x, s.p.y + x * tx + z * tz + (i % 2 ? R * 0.12 : -R * 0.2), s.p.z + z, Math.cos(an) * 0.75, 0.66, Math.sin(an) * 0.75, ink, 0.6));
    }
    for (let i = 0; i < L * 2; i++) g.tri(c, ring[(i + 1) % (L * 2)], ring[i]);
    padRanges.push([c, g.P.length / 3, s.p.x, s.p.y + R * 0.2, s.p.z, R * 1.2]);
  }
  // (review 7) the reaching bough wears four small tufts of its own along its length, amber and vermilion by turns: from the garden's first frame
  // it is a maple bough in leaf, not a black band. They are not cleared from the gaze's cone (aPad.w < 0), being too small to hide anything.
  const coreIndex = g.I.length;                                       // (the far plain draws the tree without the tufts)
  { const o = tp[4], e = V(Math.cos(lean) * reach.R, reach.y, Math.sin(lean) * reach.R);
    [0.46, 0.63, 0.8, 0.95].forEach((u, j) => {
      const q = o.clone().lerp(e, u); q.y += 3.0 * Math.sin(u * Math.PI) * (1 - 0.5 * u) + 0.9; const side = j % 2 ? 1 : -1; q.x += -Math.sin(lean) * side * 1.3; q.z += Math.cos(lean) * side * 1.3;
      const R = 2.3 - 0.35 * j, ink = j % 2, a0 = 0.7 + j * 1.3, c = g.v(q.x, q.y + R * 0.4, q.z, 0, 1, 0, ink, 0.9), ring = [];
      for (let i = 0; i < 10; i++) { const an = a0 + i / 10 * Math.PI * 2, rr = R * (i % 2 ? 0.56 : 1.05), x = Math.cos(an) * rr, z = Math.sin(an) * rr; ring.push(g.v(q.x + x, q.y + (i % 2 ? R * 0.12 : -R * 0.2), q.z + z, Math.cos(an) * 0.75, 0.66, Math.sin(an) * 0.75, ink, 0.6)); }
      for (let i = 0; i < 10; i++) g.tri(c, ring[(i + 1) % 10], ring[i]);
      padRanges.push([c, g.P.length / 3, q.x, q.y, q.z, -R]);
    }); }
  const trunkGeo = g.build();
  { const a = new Float32Array(g.P.length / 3 * 4); for (const [i0, i1, x, y, z, r] of padRanges) for (let i = i0; i < i1; i++) a.set([x, y, z, r], i * 4); trunkGeo.setAttribute('aPad', new THREE.BufferAttribute(a, 4)); }   // each pad knows its own centre and reach: it parts before the lens WHOLE (review 7), never as a shape cut by the lens's bubble
  // leaf cards: clustered at the sprays; a few float on the water
  const nCards = Math.round(64 * detail), nFloat = Math.round(12 * detail), n = nCards + nFloat;
  const P = new Float32Array(n * 12), N = new Float32Array(n * 12), C = new Float32Array(n * 16), K = new Float32Array(n * 8), I = [];
  const wsum = sprays.reduce((s, x) => s + x.w, 0), nrm = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    let px, py, pz, size, seed = rng(), ink = rng() < 0.3 ? 0 : 1;
    if (i < nCards) {
      let pick = rng() * wsum, sp = sprays[0]; for (const s of sprays) { pick -= s.w; if (pick <= 0) { sp = s; break; } }
      nrm.set(rng.gauss(), rng.gauss() * 0.6 + 0.25, rng.gauss()).normalize();
      const rr = sp.r * Math.cbrt(rng());
      px = sp.p.x + nrm.x * rr; py = Math.max(2, sp.p.y + nrm.y * rr * 0.7); pz = sp.p.z + nrm.z * rr; size = rng.range(0.85, 1.4);
      nrm.y = Math.abs(nrm.y) + 0.45; nrm.normalize();
    } else {
      const an = rng() * 6.283, rr = rng.range(8, 46);
      px = Math.cos(an) * rr; py = 0.06; pz = Math.sin(an) * rr; size = rng.range(1.0, 1.7); seed += 2; nrm.set(0.02, 1, 0.02).normalize();
    }
    for (let c = 0; c < 4; c++) {
      P.set([px, py, pz], i * 12 + c * 3); N.set([nrm.x, nrm.y, nrm.z], i * 12 + c * 3);
      C.set([c === 0 || c === 3 ? -1 : 1, c < 2 ? -1 : 1, size, seed], i * 16 + c * 4); K.set([ink, 0.9], i * 8 + c * 2);
    }
    I.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  }
  const leafGeo = new THREE.BufferGeometry();
  leafGeo.setAttribute('position', new THREE.BufferAttribute(P, 3)); leafGeo.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  leafGeo.setAttribute('aCard', new THREE.BufferAttribute(C, 4)); leafGeo.setAttribute('aInk', new THREE.BufferAttribute(K, 2)); leafGeo.setIndex(I);
  // crown spheres for the pond's reflection and the glass ghost
  const crown = tips.map((t, i) => new THREE.Vector4(t.x, t.y - 0.5, t.z, 5.2 + (i % 2)));
  crown.push(new THREE.Vector4(tp[6].x, tp[6].y + 1, tp[6].z, 6)); while (crown.length < 6) crown.push(new THREE.Vector4(0, -99, 0, 0.1));
  return { trunkGeo, leafGeo, crown: crown.slice(0, 6), tips, top: tp[6].clone(), foot: tp[0].clone(), H, reach, coreIndex };
}
// gust that crosses the true crown every seven seconds (so it crosses every crown), shared by trunk and leaves
// (round 10, APRIL IS A WEEPING CHERRY: uPetal 1 lets every bough droop toward its tip and cuts every leaf card as a petal)
export const SWAY_GLSL = /* glsl */`
#ifndef U_PETAL
#define U_PETAL
  uniform float uPetal;
#endif
  float gustAt(vec3 q){ float g = fract(uTime/7.), front = mix(-40., 60., g); float d = (q.x - front)/9.; return exp(-d*d); }
  vec3 treeSway(vec3 q){ float h = clamp(q.y/28., 0., 1.); float s = h*h*(0.25*sin(uTime*0.8 + q.x*0.1) + 1.1*gustAt(q));
    float rr = max(length(q.xz - vec2(-3.5, 1.5)) - 8., 0.), droop = uPetal*min(0.0045*rr*rr, 0.22*max(q.y, 0.));   // the weeping cherry: the further out along a bough, the lower it hangs
    return q + vec3(s, -droop, 0.35*s); }`;
// the maple-leaf silhouette cut into a card, with its dark enamel rim. uv in -1..1, tip toward +v.
export const LEAF_GLSL = /* glsl */`
#ifndef U_PETAL
#define U_PETAL
  uniform float uPetal;
#endif
  float leafShape(vec2 uv){
    if (uPetal > 0.5) { vec2 q = vec2(uv.x, uv.y + 0.04); float e = 1. - length(q/vec2(0.7, 0.94)), notch = length(q - vec2(0., 1.0)) - 0.27, wedge = 0.62*(0.8*(q.y + 1.0) - abs(q.x)); return min(min(0.6*e, wedge), notch); }   // a cherry petal: a rounded card with one notch at its tip
    float r = length(uv); if (r < 0.08) return 1.;
    float yy = uv.y + 0.25; if (abs(uv.x) + abs(yy) < 1e-4) return 1.;
    float a = atan(uv.x, yy), aa = abs(a);
    float R = 0.20 + 0.80*exp(-aa*5.5) + 0.70*exp(-abs(aa - 0.75)*5.5) + 0.52*exp(-abs(aa - 1.5)*5.5) + 0.30*exp(-abs(aa - 2.2)*5.5);
    float stem = (1. - step(0.045, abs(uv.x)))*step(uv.y, -0.2)*step(-0.95, uv.y);
    return max(R - length(vec2(uv.x, uv.y + 0.25)), stem > 0.5 ? 0.06 : -1.);
  }`;
function leafMaterial(U) {
  return enamelMaterial(U, {
    nearCut: 13,
    vertDecl: /* glsl */`attribute vec4 aCard; varying vec2 vUv; ${SWAY_GLSL}`,
    vertMove: /* glsl */`
      vec3 nn = normalize(n), tt = cross(nn, vec3(0.31, 0.2, 0.93)); tt = tt/max(length(tt), 1e-3); vec3 bb = cross(nn, tt);
      float sd = aCard.w, isTree = step(sd, 1.5), s1 = fract(sd); if ((iClip.w < -1.5 || iClip.w > 1.5) && isTree > 0.5) alive = 0.;
      float fl = isTree*(0.38*sin(uTime*(1.0 + s1) + s1*40.) + 1.0*gustAt(p)*sin(uTime*6. + s1*20.));
      vec3 t2 = tt*cos(fl) + nn*sin(fl); n = nn*cos(fl) - tt*sin(fl);
      float spin = (1. - isTree)*(uTime*0.05*(s1 - 0.5) + s1*6.3), cs = cos(spin), sn = sin(spin);
      vec2 cuv = vec2(cs*aCard.x - sn*aCard.y, sn*aCard.x + cs*aCard.y);
      p = mix(p, treeSway(p), isTree) + (t2*cuv.x + bb*cuv.y)*aCard.z;
      vUv = aCard.xy;`,
    fragDecl: /* glsl */`varying vec2 vUv; ${LEAF_GLSL}`,
    fragColor: /* glsl */`
      float lf = leafShape(vUv); if (lf < 0.) cut = true;                           // (the leaf's outline: decided here, made by the factory after the last width: the rim's fwidth below would not be defined after a discard)
      gloss *= 1. - smoothstep(0.13, 0.2, length(vUv - vec2(0.16, 0.22)));          // a card's highlight is a spot, never the whole leaf
      float wl = fwidth(lf) + 1e-4; base = mix(mix(base, uPal[2], 0.7), base, smoothstep(-wl, wl, lf - max(0.07, 1.5*wl)*step(wl, 0.05)));`,
  });
}

// ---- mossed granite: a faceted boulder (unit radius, placed by slot) ----
function stoneGeometry(rng) {
  const g = geo(), S = 6, rb = [], rs = [], rt = [];
  for (let s = 0; s < S; s++) {
    const an = s / S * Math.PI * 2, k = 0.82 + 0.36 * rng(), c = Math.cos(an), sn = Math.sin(an);
    rb.push([c * k, -0.25, sn * k]); rs.push([c * k * 0.86, 0.5 + 0.12 * rng(), sn * k * 0.86]); rt.push([c * k * 0.5, 0.78 + 0.1 * rng(), sn * k * 0.5]);
  }
  const tri = (a, b, c, ink, gl) => { const i0 = g.v(...a, 0, 1, 0, ink, gl), i1 = g.v(...b, 0, 1, 0, ink, gl), i2 = g.v(...c, 0, 1, 0, ink, gl); g.tri(i0, i1, i2); };
  for (let s = 0; s < S; s++) {
    const s1 = (s + 1) % S;
    tri(rb[s], rs[s1], rb[s1], 3, 0.6); tri(rb[s], rs[s], rs[s1], s % 2 ? 4 : 3, 0.6);
    tri(rs[s], rt[s1], rs[s1], 4, 0.5); tri(rs[s], rt[s], rt[s1], 4, 0.5);
    tri(rt[s], [0, 0.9, 0], rt[s1], 4, 0.5);
  }
  const bg = g.build(); bg.computeVertexNormals(); return bg;
}
// ---- iris clump: curved tapering blades (unit height ~1, placed by slot) ----
function irisGeometry(rng) {
  const g = geo(), nB = 7;
  for (let b = 0; b < nB; b++) {
    const an = rng() * 6.283, out = rng.range(0.05, 0.3), h = rng.range(0.7, 1.15), w = rng.range(0.05, 0.075), bend = rng.range(0.1, 0.45);
    const dx = Math.cos(an), dz = Math.sin(an), row = [];
    for (let i = 0; i <= 2; i++) {
      const u = i / 2.6, y = h * u, o = out + bend * u * u, ww = w * (1 - u * 0.55);
      row.push([g.v(dx * o - dz * ww, y, dz * o + dx * ww, dx, 0.25, dz, 4, 0.9), g.v(dx * o + dz * ww, y, dz * o - dx * ww, dx, 0.25, dz, 4, 0.9)]);
    }
    for (let i = 0; i < 2; i++) g.quad(row[i][0], row[i][1], row[i + 1][1], row[i + 1][0]);
    const tip = g.v(dx * (out + bend * 1.05), h, dz * (out + bend * 1.05), dx, 0.25, dz, 4, 0.9); g.tri(row[2][0], row[2][1], tip);
  }
  return g.build();
}
// ---- koi: fusiform body along +x (7 m), fins; the saddle is cut in the fragment shader ----
function koiGeometry() {
  const g = geo(), S = 5, xs = [3.4, 2.6, 1.0, -1.0, -2.5], rr = [0.16, 0.62, 0.86, 0.6, 0.2], rings = [];
  for (let i = 0; i < xs.length; i++) { const row = []; for (let s = 0; s < S; s++) { const an = s / S * Math.PI * 2 + Math.PI / 2, c = Math.cos(an), sn = Math.sin(an); row.push(g.v(xs[i], sn * rr[i] * 0.92, c * rr[i] * 0.8, 0, sn, c, 3, 1)); } rings.push(row); }
  for (let i = 0; i < xs.length - 1; i++) for (let s = 0; s < S; s++) { const s1 = (s + 1) % S; g.quad(rings[i][s], rings[i][s1], rings[i + 1][s1], rings[i + 1][s]); }
  const fin = (a, b, c, n) => g.tri(g.v(...a, ...n, 3, 1), g.v(...b, ...n, 3, 1), g.v(...c, ...n, 3, 1));
  fin([-2.4, 0.1, 0], [-3.6, 0.95, 0], [-3.1, 0.1, 0], [0, 0.3, 1]); fin([-2.4, 0.1, 0], [-3.1, 0.1, 0], [-3.6, -0.6, 0], [0, 0.3, 1]);   // tail
  fin([1.2, 0.75, 0], [-0.9, 0.6, 0], [-0.3, 1.2, 0], [0, 0.3, 1]);                                                                     // dorsal
  fin([1.7, 0.1, 0.6], [0.9, 0.2, 1.7], [0.8, 0.1, 0.6], [0, 1, 0]); fin([1.7, 0.1, -0.6], [0.8, 0.1, -0.6], [0.9, 0.2, -1.7], [0, 1, 0]); // pectorals
  return g.build();
}
// the koi's figure of eight, in DISC space; identical in GLSL and JS (JS feeds the pond's ripple rings)
export const KOI = { a: 31, b: 13, speed: 0.105, n: 4 };
export const KOI_GLSL = /* glsl */`
  vec2 koiAt(float k, float tau, out vec2 tang){
    float ph = k*2.3, c = cos(ph), s = sin(ph), a = ${KOI.a.toFixed(1)} - 4.*k, b = ${KOI.b.toFixed(1)} + 2.*k;
    vec2 q = vec2(a*sin(tau), b*sin(2.*tau)), d = vec2(a*cos(tau), 2.*b*cos(2.*tau));
    vec2 o = vec2(6. - 5.*k, -4. + 6.*k);
    float cy = cos(uKoiYaw), sy = sin(uKoiYaw);
    vec2 t0 = vec2(c*d.x - s*d.y, s*d.x + c*d.y), p0 = o + vec2(c*q.x - s*q.y, s*q.x + c*q.y);
    tang = vec2(cy*t0.x - sy*t0.y, sy*t0.x + cy*t0.y);
    return vec2(cy*p0.x - sy*p0.y, sy*p0.x + cy*p0.y);
  }`;
export function koiAtJS(k, tau, yaw = 0) {
  const ph = k * 2.3, c = Math.cos(ph), s = Math.sin(ph), a = KOI.a - 4 * k, b = KOI.b + 2 * k;
  const qx = a * Math.sin(tau), qy = b * Math.sin(2 * tau);
  const px = 6 - 5 * k + c * qx - s * qy, py = -4 + 6 * k + s * qx + c * qy, cy = Math.cos(yaw), sy = Math.sin(yaw);
  return [cy * px - sy * py, sy * px + cy * py];
}
function koiMaterial(U) {
  return enamelMaterial(U, {
    vertDecl: 'uniform float uKoiT, uKoiYaw;' + KOI_GLSL,
    vertMove: /* glsl */`
      float k = iInfo.y, tau = uKoiT + k*2.1;
      vec2 tg0; koiAt(k, tau, tg0); float spd = max(length(tg0), 1.);
      float ks = iInfo.z > 0.5 ? 1.55 : 1.;                             // in the Globe the koi are seen from across the hollow: a lattice of ivory, not ticks
      vec2 tg; vec2 c = koiAt(k, tau + position.x*1.25*ks/spd, tg); tg = tg/max(length(tg), 1e-3);
      vec2 sd = vec2(-tg.y, tg.x);
      float wig = sin(uTime*2.6 - position.x*0.8 + k*1.7)*0.34*smoothstep(2.5, -3.5, position.x);
      float lat = position.z + wig;
      p = vec3(c.x + sd.x*lat*1.25*ks, position.y*1.1*ks + 0.3, c.y + sd.y*lat*1.25*ks);
      n = vec3(tg.x*normal.x + sd.x*normal.z, normal.y, tg.y*normal.x + sd.y*normal.z);`,
    fragColor: /* glsl */`
      float sdl = fract(vInfo.y*0.37 + 0.2)*2.4 - 0.9;
      if (uKoiMode < 0.5) { if (vP.y > 0.12 && abs(vP.x - sdl) < 0.95 + 0.25*sin(vP.z*5.)) base = uPal[1]; if (vP.x > 2.9) base = mix(base, uPal[0], 0.6); }
      else if (uKoiMode < 1.5) { base = uPal[0]; if (vP.y > 0.12 && abs(vP.x - sdl) < 0.95) base = mix(uPal[0], uPal[6], 0.6); }
      else if (vInfo.y < 0.5) base = uPal[2];
      base = mix(base, uPal[2], 0.45*uIce);`,
  });
}
// picks which disc objects currently touch the wedge and writes them into a material's slot uniforms
function makeSlotter(items, slotUniform, margin, lane) {
  const { ax, bz, hn, hd, pivot } = WEDGE;
  return (turn) => {
    const c = Math.cos(turn), s = Math.sin(turn), arr = slotUniform.value; let k = 0;
    for (let i = 0; i < items.length && k < arr.length; i++) {
      const it = items[i], x = pivot[0] + c * it.x - s * it.z, z = pivot[1] + s * it.x + c * it.z, m = margin * it.s;
      if (x > -m && z > -m && x < ax + m && z < bz + m && hd - hn[0] * x - hn[1] * z > -m) {
        let f = 1;
        if (lane) { const dx = Math.max(lane[0] - x, 0, x - lane[1]), dz = Math.max(Math.abs(z - lane[2]) - lane[3], 0); f = smoothstep(it.s * 0.9, it.s * 0.9 + 4, Math.hypot(dx, dz)); }
        if (f > 0.02) arr[k++].set(it.x, it.z, it.yaw, it.s * f);
      }
    }
    for (; k < arr.length; k++) arr[k].w = 0;
  };
}

// ---- the Gate: ONE quarter of a moon gate (arch space: ring in the XY plane, first quadrant, axis Z) ----
export const GATE = { rIn: 7.5, rOut: 10.4, depth: 2.6 };
export const GATE_FRAG = /* glsl */`
  { float gr = length(vP.xy), ga = atan(vP.y, max(vP.x, 1e-4));
    float wd = fwidth(ga)*gr + fwidth(gr) + fwidth(vP.z) + 1e-4;                     // metres per pixel on the stone
    // (EVERY DERIVATIVE OF THE STONES IS TAKEN HERE, above their branch: the line gr = 7.53 runs along the inner chamfer of every stone, so a
    // block of four pixels can lie half inside the branch, and a derivative taken in there of a value that only the branch computes is not
    // defined. What the derivatives are taken of, t, gr and the relief hgt with all it is made of, is computed on every pixel: the same
    // expressions as before, moved up; the branch uses the results.)
    float t = clamp((ga - 0.012)/1.5468, 0., 1.)*8., bi = floor(t), ft = t - bi, hs = fract(sin(bi*12.9898 + 4.1)*43758.5453), hs2 = fract(hs*7.13 + 0.31);
    float front = step(1.02, abs(vP.z));                                             // the ring's two faces (else its outer and inner bands)
    float dj = min(ft, 1. - ft)*gr*0.19335;                                          // metres to the nearest joint ...
    float de = min(dj, max(mix(1.28 - abs(vP.z), min(gr - 7.5, ${(10.4).toFixed(1)} - gr), front), 0.));   // ... and to the nearest edge of this face of the voussoir
    // the moss: scalloped cushions hanging from the crown of each stone and spilling down the joints
    float wc = fwidth(gr) + 1e-4, lob = 0.3*abs(sin(ga*27. + hs*6.)), spill = step(0.3, hs2)*(0.3 + 0.9*hs2)*exp(-dj*dj/0.1);
    float cap = ${(10.4).toFixed(1)} - (0.2 + 0.7*hs*hs) - lob - spill;
    float mo = max(smoothstep(-wc, wc, gr - cap)*front, (1. - front)*step(8.5, gr)*step(0.3, hs2)*(1. - smoothstep(0.3, 0.3 + wd, dj)));
    float wj = fwidth(t) + 1e-4;
    float fv = clamp(mix((vP.z + 1.3)/2.6, (gr - 7.5)/2.9, front), 0., 1.);
    float hgt = (0.34*smoothstep(0., 0.6, de) + 0.5*sin(ft*3.14159)*sin(fv*3.14159))*(1. - mo);
    vec3 dpx = dFdx(vV), dpy = dFdy(vV); float hx = dFdx(hgt), hy = dFdy(hgt);
    if (vInk.x > 2.5 && vInk.x < 3.5 && gr > ${(7.5 + 0.03).toFixed(2)}) {
      float nearK = 1. - smoothstep(0.05, 0.14, wd);
      base = mix(uPal[3], uPal[5], 0.07 + 0.13*hs);                                  // each stone its own grey of ivory
      base = mix(base, mix(base, uPal[5], 0.17), smoothstep(-wd, wd, de - 0.46)*nearK);          // the dressed panel, a step darker ...
      base = mix(base, mix(base, uPal[2], 0.42), (1. - smoothstep(-wd, wd, de - 0.15))*nearK);   // ... and the dark glossy rim round every voussoir
      { vec2 lc = vec2(t*5., mix(vP.z, gr, front)*1.4), ci = floor(lc); float lh = fract(sin(dot(ci, vec2(127.1, 311.7)))*43758.5453);
        vec2 lf = lc - ci - 0.5 - 0.5*(vec2(fract(lh*29.3), fract(lh*13.7)) - 0.5);
        float lr = 0.1 + 0.16*fract(lh*5.3); base = mix(base, mix(uPal[4], uPal[3], 0.25), step(0.8, lh)*(1. - smoothstep(lr, lr + 2.*wd, length(lf*vec2(1., 0.7 + 0.6*fract(lh*3.1)))))*nearK); }   // lichen
      vec3 moss = mix(uPal[4], mix(uPal[4], uPal[2], 0.34), step(0.5, fract(ga*27./6.2832 + hs*0.95)));   // (the moss: its cap, cover mo and width wc stand above the branch)
      moss = mix(moss, mix(uPal[4], uPal[2], 0.6), (1. - smoothstep(0.06, 0.06 + wc, abs(gr - cap)))*front*nearK);
      base = mix(base, moss, mo);
      float hw = max(0.04, 0.8*wj);
      base = mix(base, uPal[2], 0.85*(1. - smoothstep(hw - 0.5*wj, hw + 0.5*wj, min(ft, 1. - ft)))*(1. - smoothstep(0.2, 0.45, wj)));   // dark joints
      if (bi > 6.5) base = mix(base, uPal[6], (1. - smoothstep(0.5*wj, 1.5*wj + 0.006, 1. - ft))*(1. - smoothstep(0.2, 0.45, wj)));     // the hair of seam gold where the quarter meets its twin
      // every voussoir is a pillow of enamel: its shoulders turn the light, so one hard highlight slides round each as we pass
      { vec2 q = vec2(ga*gr, mix(vP.z, gr, front))*0.6 + vec2(0.4*sin(uTime*0.45) + uTime*0.05, 0.3*sin(uTime*0.33 + 1.));   // the crown's shadow dappling the stone, stirring with the breeze
        vec2 qi = floor(q); float qh = fract(sin(dot(qi, vec2(41.3, 289.1)))*43758.5453);
        vec2 qf = q - qi - 0.5 - 0.3*(vec2(qh, fract(qh*17.)) - 0.5);
        float dap = step(0.45, qh)*(1. - smoothstep(0.3, 0.3 + 1.5*wd, length(qf)*(1. + 0.12*sin(uTime*0.9 + qh*40.))));
        base = mix(base, mix(base, uPal[2], 0.3), dap*nearK); }
      { vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);     // (the relief hgt and its four derivatives: above the branch)
        vec3 gN = N + (hx*r1 + hy*r2)*(det < 0. ? -1. : 1.)/max(abs(det), 1e-7)*nearK;
        N = gN/max(length(gN), 1e-4); gloss = mix(gloss, 0.95, nearK*(1. - mo)); }
    } else if (vInk.x > 3.5 && vInk.x < 4.5 && gr > ${(7.5 + 0.03).toFixed(2)}) {  // the mossed crown: cushions with dark seams between them
      vec2 mc = vec2(ga*gr, vP.z)*0.95, ci = floor(mc); float mh = fract(sin(dot(ci, vec2(269.5, 183.3)))*43758.5453);
      vec2 mf = mc - ci - 0.5 - 0.24*(vec2(mh, fract(mh*9.3)) - 0.5); float md2 = length(mf), nearK = 1. - smoothstep(0.08, 0.2, wd);
      base = mix(uPal[4], mix(uPal[4], uPal[2], 0.3), step(0.5, mh)*nearK);
      base = mix(base, mix(uPal[4], uPal[2], 0.62), smoothstep(0.43, 0.43 + 2.*wd, md2)*nearK);
      gloss = mix(gloss, 0.9*(1. - smoothstep(0.1, 0.16, md2)), nearK);
    } }`;
export function gateQuarterGeometry(rng) {
  const g = geo(), NV = 8, a0 = 0.012, a1 = Math.PI / 2 - 0.012;
  const block = (aa, ab, ri, ro, d, mossy) => {
    const ch = 0.22, prof = [[ri + ch, -d], [ro - ch, -d], [ro, -d + ch], [ro, d - ch], [ro - ch, d], [ri + ch, d], [ri, d - ch], [ri, -d + ch]];
    const ringA = [], ringB = [];
    for (const [r, z] of prof) { ringA.push([r * Math.cos(aa), r * Math.sin(aa), z]); ringB.push([r * Math.cos(ab), r * Math.sin(ab), z]); }
    const tri = (a, b, c, ink) => { g.tri(g.v(...a, 0, 0, 1, ink, 0.55), g.v(...b, 0, 0, 1, ink, 0.55), g.v(...c, 0, 0, 1, ink, 0.55)); };
    for (let i = 0; i < 8; i++) {
      const j = (i + 1) % 8, ink = mossy && (i === 2 || i === 1 || i === 3) ? 4 : 3;
      tri(ringA[i], ringA[j], ringB[j], ink); tri(ringA[i], ringB[j], ringB[i], ink);
    }
    for (let i = 1; i < 7; i++) { tri(ringA[0], ringA[i + 1], ringA[i], 3); tri(ringB[0], ringB[i], ringB[i + 1], 3); }
  };
  for (let i = 0; i < NV; i++) {
    const aa = lerp(a0, a1, i / NV) + 0.006, ab = lerp(a0, a1, (i + 1) / NV) - 0.006;
    const big = i === 0 || i === NV - 1;                                 // the foot and the crown stone stand proud
    block(aa, ab, GATE.rIn - (big ? 0.12 : 0), GATE.rOut + (big ? 0.55 : rng.range(-0.12, 0.2)), GATE.depth / 2 + (big ? 0.3 : rng.range(-0.08, 0.1)), rng() < 0.62);
  }
  // an inner bead of jade-black lacquer round the opening, and the hairline of seam gold at the square mirror
  for (let i = 0; i < 10; i++) block(lerp(a0, a1, i / 10), lerp(a0, a1, (i + 1) / 10), GATE.rIn - 0.28, GATE.rIn - 0.02, 0.5, false);
  const bg = g.build(); bg.computeVertexNormals();
  const ink = bg.getAttribute('aInk'), pos = bg.getAttribute('position');
  for (let i = 0; i < ink.count; i++) { const r = Math.hypot(pos.getX(i), pos.getY(i)); if (r < GATE.rIn + 0.05 && Math.abs(pos.getZ(i)) < 0.51) ink.setXY(i, 2, 1); }
  return bg;
}

// ---- leaves in the air: the drizzle (one slanting line per crown, converging) and the wreath round the Gate ----
function airLeafMaterial(U, extra) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: { ...U, ...extra },
    vertexShader: /* glsl */`
      uniform float uTime; uniform mat4 uShell, uGate; uniform vec3 uKey; uniform float uProgress; uniform vec4 uShellEye;
      attribute vec3 aStart; attribute vec4 aPar;    // phase, seed, mode (0 drizzle, 1 wreath), ink
      attribute float aGen;
      varying vec3 vW, vN, vV, vL, vApex, vInset; varying vec4 vInfo; varying vec2 vUv; varying float vInk, vFade;
      void main(){
        float ph = aPar.x, sd = aPar.y; vec3 c; float size = 0.8 + 0.6*sd; vFade = 1.;
        float ang = sd*6.2832 + uTime*0.16;
        if (aPar.z < 0.5 || aPar.z > 1.5) {
          float nearS = step(2.5, aPar.z);                                  // mode 3: a NEAR string, strung beside the last straight (its start is given in the piece's own space and does not roll with the shell)
          vec3 s0 = nearS > 0.5 ? aStart : (uShell*vec4(aStart, 1.)).xyz;
          float s = fract(uTime*0.021 + ph); float e = mix(s, s*s*(3. - 2.*s), 0.25);   // evenly strung: a line of separate cards, not a cloud at its ends
          vec3 ctr = (uGate*vec4(0., 0., 0., 1.)).xyz;
          vec3 rad = s0 - ctr; vec3 ax = (uGate*vec4(0., 0., 1., 0.)).xyz; float gs = max(length(ax), 1e-3); ax /= gs;
          vec3 rp = rad - ax*dot(rad, ax); float rl = length(rp); vec3 e1 = rl > 1e-3 ? rp/rl : vec3(1., 0., 0.), e2 = cross(ax, e1);
          float sw = 0.9 + 0.5*fract(sd*7.31);          // each line slants round the axis and never crosses the opening
          vec3 end = ctr + (e1*cos(sw) + e2*sin(sw))*13.5*gs + ax*(-1. + 3.*fract(sd*3.7));
          vec3 mid = ctr + rad*0.5 + e2*rl*0.13 + e1*4.;   // (round 10: a line for each garden: each a gentle slant, so they read as lines converging on the Gate, not as a whirl)
          if (nearS > 0.5) { end = ctr + e1*12.6*gs - ax; mid = 0.5*(s0 + end) + e2*1.5; }   // straight to the ring's rim, outside the stones: it converges on the Gate as the straight does
          c = mix(mix(s0, mid, e), mix(mid, end, e), e);
          c += vec3(sin(uTime*0.9 + ph*50.), sin(uTime*0.7 + ph*31.), cos(uTime*0.8 + ph*17.))*0.5*sin(s*3.1416);
          vFade = smoothstep(0., 0.03, s)*(1. - smoothstep(0.95, 1., s));
          vFade *= smoothstep(5., 12., length(cameraPosition - (modelMatrix*vec4(c, 1.)).xyz));
          { vec3 toC = (modelMatrix*vec4(c, 1.)).xyz - cameraPosition, toG = (modelMatrix*vec4(ctr, 1.)).xyz - cameraPosition; float dG = max(length(toG), 1e-3), al = dot(toC, toG)/dG, pe = length(toC - toG/dG*al);
            vFade *= max(step(dG + 3., al), smoothstep(11.0*gs/dG*max(al, 0.), 13.2*gs/dG*max(al, 0.) + 1e-3, pe)); }   // (round 10: the cone kept clear is the whole ring, stones and all: the lines end ON the rim and none lies across the Gate)   // (review 7: the opening's cone is kept clear of the drizzle and the strings; they end on the rim)   // (review 6: a card of the drizzle never passes against the lens as a slab: it draws in as it comes within twelve metres)
          size *= mix(1.3, 0.8, nearS);   // (round 10b: THE ONE RULE OF SIZE. A line's card has its own size in metres, as every leaf card has: 0.8 to 1.4 by its seed, 1.3 times that on a line and 0.8 times on a near string, the same at any distance from the lens)
          vInfo = vec4(min(max(length((modelMatrix*vec4(c, 1.)).xyz - uShellEye.xyz) - 64., 0.)*uShellEye.w*(1. - 0.5*e), 2.6)*(1. - nearS), 0., 0., sd);   // (round 10: a line across the hollow is as many reflections down as the wall it leaves, up to 2.6: near lines bright, far lines crimson)   // counted from the lens: the strings stay bright against the plum side
        } else {
          float r = 12.2 + 2.6*fract(sd*5.3) + 0.5*sin(uTime*0.5 + sd*30.);
          float a = ph*6.2832 + uTime*0.16;
          // (review 6) uProgress 0..0.5: the wreath comes in onto the RIM and turns there, its leaves over the stones and the opening's outer
          // edge, the middle clear; 0.5..1 (the last second): it closes across the opening and we go through with it
          float pr = clamp(uProgress*3. - fract(sd*9.1)*0.5, 0., 1.); pr = pr*pr*(3. - 2.*pr);
          float pc = clamp((uProgress - 0.5)*3. - fract(sd*4.7)*0.5, 0., 1.); pc = pc*pc*(3. - 2.*pc);
          r = mix(r, 7.3 + 2.9*fract(sd*5.3), pr); r = mix(r, 0.8 + 6.0*fract(sd*5.3), pc);
          c = (uGate*vec4(r*cos(a), r*sin(a), mix((fract(sd*3.7) - 0.5)*3.4, -0.7 - 2.6*fract(sd*2.3), pr), 1.)).xyz;
          vInfo = vec4(0., 0., 0., sd);
        }
        float sp = uTime*(0.9 + sd) + sd*40. + ph*23.;
        vec3 nn = normalize(vec3(sin(sp)*cos(sp*0.37), cos(sp), sin(sp)*sin(sp*0.37)) + vec3(0., 0.15, 0.));
        vec3 tt = cross(nn, vec3(0.31, 0.2, 0.93)); tt = tt/max(length(tt), 1e-3); vec3 bb = cross(nn, tt);
        if (aPar.z > 1.5 && aPar.z < 2.5) vFade = 0.;
        vec4 wp = modelMatrix*vec4(c + (tt*position.x + bb*position.y)*size*vFade, 1.);
        vec3 n = mat3(modelMatrix)*nn; vN = n/max(length(n), 1e-5);
        vec3 l = mat3(modelMatrix)*mat3(uGate)*uKey; vL = l/max(length(l), 1e-5);
        vV = cameraPosition - wp.xyz; vW = vec3(0.); vApex = vec3(0.); vInset = vec3(0.);
        vUv = position.xy; vInk = aPar.w;
        gl_Position = projectionMatrix*viewMatrix*wp;
      }`,
    fragmentShader: /* glsl */`
      ${STYLE_FRAG_GLSL}
      ${LEAF_GLSL}
      varying vec2 vUv; varying float vInk, vFade;
      void main(){
        float lf = leafShape(vUv); if (uBare > 0.5) lf = 0.55 - length(vUv); bool cut = lf < 0. || vFade < 0.02;   // (decided here, made after enamel: a width taken after a discard is not defined, and the rim of every card came out different on each draw)
        vec3 base = uBare > 0.5 ? uPal[3] : uPal[int(vInk + 0.5)]; float wl = fwidth(lf) + 1e-4;
        base = mix(mix(base, uPal[2], 0.7), base, smoothstep(-wl, wl, lf - max(0.07, 1.5*wl)*step(wl, 0.05)));
        vec3 lit = enamel(base, vN/max(length(vN), 1e-4), 0.9);
        if (cut) discard;
        gl_FragColor = finish(lit);
      }`,
  });
}

// ================================================================================================================
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const U = opts.uniforms || makeStyleUniforms(opts.palette || DEFAULT_PALETTE);
  const root = new THREE.Group(); root.name = 'garden-of-sixty-gardens:globe';
  const { copies, apex, tongue } = makeCopies(rng);
  U.uApex.value.copy(apex);
  if (opts.lateFacet) {                                     // the cracked mirror inside the Globe: one facet in sixty is an hour late
    const want = new THREE.Vector3(-0.62, 0.05, -0.78).normalize().multiplyScalar(GLOBE.R), q = new THREE.Vector3();
    const near = copies.filter((c) => c.shell > 0.5).map((c) => ({ c, d: q.set(34, 0, 17).applyMatrix4(c.matrix).distanceTo(want) })).sort((a, b) => a.d - b.d);
    near[0].c.seed += 2; near[1].c.seed += 2;
  }
  const shellAxis = opts.shellAxis ? opts.shellAxis.clone().normalize() : tongue.head.clone();   // the axis the shell rolls about (local): the line of flight by default; the world may give the vertical, so the bowl turns under the lens like a table
  const turn0 = rng() * 6.283, shell0 = rng.range(-0.25, 0.25), turnRate = opts.turnRate ?? 1.2 * Math.PI / 180, shellRate = opts.shellRate ?? 0.011;
  await ctx.yield();

  // plates: pond, seams, glass backs
  const pondU = { uMirrorN: { value: 6 }, uTrunk: { value: new THREE.Vector4(0, 0, 0, 0) }, uRing: { value: new THREE.Vector4(0, 0, 0, 0) }, uCrown: { value: [] }, uKoiW: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] } };
  const plateMat0 = plateMaterial(U, pondU, 0);
  const plates = applyCopies(plateGeometry(), plateMat0, copies); root.add(plates);
  const glass = applyCopies(plateGeometry(), plateMaterial(U, pondU, 1), copies); glass.renderOrder = 5; root.add(glass);
  await ctx.yield();

  // the maple, drawn once per copy
  const maple = buildMaple(rng, detail);
  pondU.uCrown.value = maple.crown.map((c) => c.clone());
  U.uKoiYaw.value = maple.reach.ang;
  const trunkMat = enamelMaterial(U, { vertDecl: SWAY_GLSL + 'attribute vec4 aPad; uniform float uPadCut, uClearFar, uBare; uniform vec4 uClear; varying float vKeep;', fragDecl: 'varying float vKeep;', keepIf: 'vKeep > 0.5', nearCut: 12,
    vertMove: /* glsl */`p = treeSway(p);
      // (review 8) January: a bare bough is a solid stroke at any distance. Each lacquer tube swells along its own normal by three
      // quarters of a pixel, so the far boughs are strokes a pixel and a half wide or more, never dotted hairlines.
      if (uBare > 0.5 && aInk.x > 1.5 && aInk.x < 2.5) { float dB = length((copyMatrix()*vec4(discToWedge(p), 1.)).xyz - cameraPosition); p += n*0.0021*max(dB - 20., 0.); } if (iClip.w < -1.5 || iClip.w > 1.5) alive = 0.; vKeep = step(aPad.w, -0.01);
      if (aPad.w > 0.) {                                      // a foliage pad draws in toward its own heart as the lens (or the clear cone) comes for it
        vec3 pc = treeSway(aPad.xyz), dP = (copyMatrix()*vec4(discToWedge(pc), 1.)).xyz - cameraPosition; float dl = max(length(dP), 1e-3), cut = max(12., uPadCut);
        float k = smoothstep(cut, cut + 7., dl - aPad.w);
        if (dl < uClearFar) k = min(k, 1. - smoothstep(uClear.w - 0.035, uClear.w - 0.008, dot(dP, uClear.xyz)/dl - 0.6*aPad.w/dl));
        p = mix(pc, p, k); if (k < 0.03) alive = 0.; }`,
    // a foliage pad is cloisonne, not a blot: a heart of the other leaf colour, the pad's own colour round it, a dark glossy rim
    fragColor: /* glsl */`
      if (vInk.x > 1.5 && vInk.x < 2.5) { base = LACQ; gShade = LACQ*0.55; if (dot(vV, vV) < max(max(81., uBoughCut*uBoughCut), 0.3*uPadCut*uPadCut)) cut = true; }   // black lacquer in every season and hour; a bough parts nine metres from the lens, so none is a bar across the frame (the cut is decided here and made by the factory, after enamel's widths)
      if (vInk.x < 1.5) {
        float rho = clamp((0.9 - vInk.y)/0.3, 0., 1.), wq = fwidth(rho) + 1e-4; gloss = 0.9*(1. - smoothstep(0.30, 0.42, rho));   // the highlight keeps to the pad's heart
        base = mix(vInk.x < 0.5 ? uPal[1] : uPal[0], base, smoothstep(-wq, wq, rho - 0.36));
        float rimW = max(0.075, 1.5*wq);
        base = mix(base, mix(base, uPal[2], 0.72), smoothstep(-wq, wq, rho - (1. - rimW))*(1. - smoothstep(0.1, 0.25, wq)));
      }` });
  const trunks = applyCopies(maple.trunkGeo, trunkMat, copies); root.add(trunks);
  await ctx.yield();
  const leafMat = leafMaterial(U);                                  // (its cards part 13 m from the lens: see nearCut)
  const leaves = applyCopies(maple.leafGeo, leafMat, copies); root.add(leaves);
  await ctx.yield();

  // stones and iris live on the turning disc; only those touching the wedge take a slot
  const scatter = (n, r0, r1, s0, s1) => { const out = []; for (let i = 0; i < n; i++) { const an = rng() * 6.283, r = Math.sqrt(lerp(r0 * r0, r1 * r1, rng())); out.push({ x: Math.cos(an) * r, z: Math.sin(an) * r, yaw: rng() * 6.283, s: rng.range(s0, s1) }); } return out; };
  const stoneItems = scatter(19, 13, 80, 2.4, 5.0), irisItems = scatter(8, 11, 62, 3.4, 5.0);
  const stoneMat = enamelMaterial(U, { slots: 4 }), irisMat = enamelMaterial(U, { slots: 2, vertMove: 'p.xz += (0.05*sin(uTime*1.3 + p.x*0.4) + 0.03*sin(uTime*2.1 + p.z))*position.y*position.y*sl.w;' });
  const stoneGeo = stoneGeometry(rng);
  const stones = applyCopies(stoneGeo, stoneMat, copies, 4); root.add(stones);
  await ctx.yield();
  const irisGeo = irisGeometry(rng);
  const iris = applyCopies(irisGeo, irisMat, copies, 2); root.add(iris);
  const slotStones = makeSlotter(stoneItems, stoneMat.uniforms.uSlot, 1.2, opts.clearLane), slotIris = makeSlotter(irisItems, irisMat.uniforms.uSlot, 0.5, opts.clearLane);
  await ctx.yield();
  const koiGeo = koiGeometry(), koiMat = koiMaterial(U);
  const koi = applyCopies(koiGeo, koiMat, copies, KOI.n); root.add(koi);
  await ctx.yield();

  // the Gate: four mirror images of one quarter-arch, at the centre, square to the line of flight
  const cy = GLOBE.centerY, center = new THREE.Vector3(0, cy, 0), head = tongue.head, up = tongue.up;
  // The Gate faces the last straight of the flight. By default that is the radial line through the slit (head); the
  // world may pass opts.gateHeading (local unit vector) when its path arrives on another line.
  const gHead = opts.gateHeading ? opts.gateHeading.clone().normalize() : head.clone();
  const gUp = new THREE.Vector3(0, 1, 0).addScaledVector(gHead, -gHead.y).normalize(), gRight = new THREE.Vector3().crossVectors(gUp, gHead).normalize();
  const gateM = new THREE.Matrix4().makeBasis(gRight, gUp, gHead).setPosition(center);   // arch +Z = line of flight: the face we meet is in shade, bevels lit
  const gateGeo = gateQuarterGeometry(rng);
  const gateCopies = [[1, 1, 0], [-1, 1, 1.6], [1, -1, 3.2], [-1, -1, 4.8]].map(([sx, sy, gen], i) => ({
    matrix: gateM.clone().multiply(new THREE.Matrix4().makeScale(sx, sy, -1).setPosition(i ? (rng() - 0.5) * 0.16 : 0, i ? (rng() - 0.5) * 0.16 : 0, i * 0.05)),
    gen, shell: 0, seed: rng(), clip: [0, 0, 0, 0] }));
  // (review 7: THE EXIT IS A DOOR. The Gate alone carries a rim of gold teeth on its stones, round the opening: twenty-four amber teeth with a
  // seam-gold facet each and a dark cloison edge, a metre deep, on both faces of the ring.)
  const GATE_TEETH = /* glsl */`
    { float gr2 = length(vP.xy), ga2 = atan(vP.y, max(vP.x, 1e-4)), tt = fract(ga2*3.8197186 + 0.5);   // (the teeth's two widths are taken above their branch, on every pixel: abs(vP.z) > 1.02 divides a block of four on the stones' flanks, and a width taken inside is not defined there)
      float dT = (1. - (gr2 - 7.52)/1.05)*0.5 - abs(tt - 0.5), wT = fwidth(dT) + 1e-4, wtt = fwidth(tt);
      if (vInk.x > 2.5 && vInk.x < 3.5 && abs(vP.z) > 1.02) { float inT = smoothstep(-wT, wT, dT)*step(7.5, gr2)*(1. - smoothstep(0.2, 0.5, wtt));
        vec3 gT = mix(uPal[0], uPal[6], step(0.5, tt)); gT = mix(mix(uPal[0], uPal[2], 0.6), gT, smoothstep(0.035, 0.035 + wT, dT));
        base = mix(base, gT, inT); gloss = mix(gloss, 0.9, inT); } }
    // (round 10: ONE TRUE QUARTER AND THREE REFLECTIONS. Each reflected quarter of the Gate is a clear step dimmer and cooler than the one before it)
    { float qg = clamp(vInfo.x/1.6, 0., 3.); base = mix(base, uPal[5], 0.15*qg)*(1. - 0.06*qg); }`;
  const gate = applyCopies(gateGeo, enamelMaterial(U, { wedgeSpace: true, noClip: true, fragColor: GATE_FRAG + GATE_TEETH }), gateCopies); root.add(gate);
  // the reveal: when the world shows the Gate larger from afar (setGateFacing's scale), a band of black lacquer with a hair of seam gold
  // fills the ring from the portal's rim (7 m) out to the stones, so the opening never shows a gap round the next world
  const irisU = { uIris: { value: 7.2 }, uIrisIn: { value: 6.9 }, uIrisZ: { value: 0.2 }, uVeil: { value: toScene(opts.veil || DEFAULT_PALETTE[0]) } };
  const revealGeo = (() => { const g = geo(), N = 48, a = [], b = [];
    for (let i = 0; i < N; i++) { const an = i / N * Math.PI * 2; a.push(g.v(Math.cos(an), Math.sin(an), 0, 0, 0, 1, 2, 1)); b.push(g.v(Math.cos(an), Math.sin(an), 1, 0, 0, 1, 2, 1)); }
    for (let i = 0; i < N; i++) { const j = (i + 1) % N; g.quad(a[i], a[j], b[j], b[i]); }
    return g.build(); })();
  const reveal = applyCopies(revealGeo, enamelMaterial(U, { wedgeSpace: true, noClip: true, uniforms: irisU,
    vertDecl: 'uniform float uIris, uIrisIn, uIrisZ; varying float vBand; varying vec2 vQ;',
    vertMove: 'vBand = position.z; p = vec3(position.xy*mix(uIrisIn, max(uIris, 7.05), position.z), -uIrisZ); vQ = p.xy; n = vec3(0., 0., -1.);',
    fragDecl: 'varying float vBand; varying vec2 vQ; uniform vec3 uVeil;',
    // (round 10: the hairlines between the four quarters run on across the light as a cross of seam gold whose arms do not quite meet: each arm lies a
    // hair off its mirror line, as the quarters do, and stops short of the middle. At least a pixel and a half wide; the light itself is not dimmed.)
    fragColor: 'gloss = 0.;', fragEnd: `{ vec2 aq = abs(vQ); float along = max(aq.x, aq.y), horiz = step(aq.y, aq.x);
        float off = horiz > 0.5 ? (vQ.x > 0. ? 0.09 : -0.07) : (vQ.y > 0. ? -0.08 : 0.06), across = (horiz > 0.5 ? vQ.y : vQ.x) - off;
        float wq = fwidth(across) + 1e-4, hw = max(0.05, 0.8*wq), ln = (1. - smoothstep(hw - 0.5*wq, hw + 0.5*wq, abs(across)))*smoothstep(0.55, 0.55 + 2.*wq, along)*clamp(0.09/hw, 0.35, 1.);
        gl_FragColor = vec4(mix(uVeil, toScene(uPal[6]), ln), 1.); }` }),   // the reveal is the Gate's own light: the one flat tone the opening holds (the world gives the same colour as portal.veil), out to the stones
    [{ matrix: gateM.clone(), gen: 0, shell: 0, seed: 0.5, clip: [0, 0, 0, 0] }]);
  reveal.matrixAutoUpdate = false; root.add(reveal);
  // (round 9c: the medallion of black lacquer and gold rays is OUT. Behind the opening stands what the live version has there, the Gate's own flat
  // tone, WHOLE: one unshaded disc of the veil out to the stones' inner rim, with nothing drawn on it. It stands a little behind the portal's own
  // plane, so the portal (the next world, or the same flat veil) is always drawn in front of it, whatever way the ring faces, and once the light
  // in the Gate has opened no gap shows round the next world.)
  const medalU = { uMedR: { value: 8 }, uMedZ: { value: 0.3 }, uVeil: irisU.uVeil };
  const medalGeo = new THREE.BufferGeometry(); for (const k of ['position', 'normal', 'aInk']) medalGeo.setAttribute(k, revealGeo.getAttribute(k)); medalGeo.setIndex(revealGeo.getIndex());
  const medal = applyCopies(medalGeo, enamelMaterial(U, { wedgeSpace: true, noClip: true, uniforms: medalU,
    vertDecl: 'uniform float uMedR, uMedZ;',
    vertMove: 'p = vec3(position.xy*uMedR*position.z, uMedZ); n = vec3(0., 0., -1.);',
    fragDecl: 'uniform vec3 uVeil;',
    fragColor: 'gloss = 0.;', fragEnd: 'gl_FragColor = vec4(uVeil, 1.);' }),
    [{ matrix: gateM.clone(), gen: 0, shell: 0, seed: 0.5, clip: [0, 0, 0, 0] }]);
  medal.matrixAutoUpdate = false; root.add(medal);
  await ctx.yield();

  // leaves in the air
  // The Gate exists only by reflection, and it turns to face whoever looks for it: setGateFacing(dir) swings the four
  // quarter-arches (and the wreath and the ends of the leaf strings with them) about the centre. The world brings it square
  // to the last straight before the lens is on it.
  const gateNow = gateM.clone(), gateQ = new THREE.Quaternion(), gateR = new THREE.Matrix4(), gateT = new THREE.Matrix4(), gateD = new THREE.Vector3();
  gate.matrixAutoUpdate = false;
  const airU = { uGate: { value: gateNow }, uProgress: { value: 0 } };
  const shellCopies = copies.filter((c) => c.shell > 0.5), perLine = Math.round(40 * detail), nWreath = Math.round(280 * detail), wreathKeep = opts.wreathKeep ?? 1, lineCards = opts.lineCards ?? 1;
  const lineOf = opts.linePer === 'garden' ? (ci) => shellCopies[ci].matrix.determinant() > 0 && shellCopies[ci].clip[3] < 1.5 : (ci) => ci % (opts.lineEvery || 7) === 5,   // (linePer 'garden': one line from the crown of each garden, from its unmirrored half. round 10b: a line begins at a crown, so the two gardens at the slit's hub, whose maples are not drawn (lean 2), have none: fifty-eight lines)
    nLines = shellCopies.filter((c, ci) => lineOf(ci)).length;
  const nearStr = opts.nearStrings || [], perNear = Math.round(42 * detail);
  const nAir = nLines * perLine + nWreath + nearStr.length * perNear;
  const aStart = new Float32Array(nAir * 3), aPar = new Float32Array(nAir * 4), aGen = new Float32Array(nAir); let nAirUsed = nAir;
  { const top = new THREE.Vector3(); let i = 0;
    for (let ci = 0; ci < shellCopies.length; ci++) {                // one line for each garden that has a maple, each a string of separate cards
      const c = shellCopies[ci], lineSeed = rng(), on = lineOf(ci);
      for (let k = 0; k < perLine; k++) {
        top.set(WEDGE.pivot[0] + rng.range(-3.5, 3.5), 16 + rng() * 9, WEDGE.pivot[1] + rng.range(-3.5, 3.5)).applyMatrix4(c.matrix);
        const par = [(k + 0.15 + 0.7 * rng()) / perLine, (lineSeed + rng() * 0.004) % 1, 0, rng() < 0.3 ? 1 : 0];   // evenly strung along the line, mostly amber: they read against the vermilion crowns
        if (!on || (k * 0.618034) % 1 >= lineCards) continue;                                     // (every other one: separate cards, not a ribbon)                                              // (the same draws either way: the seed's later choices do not move)
        aStart.set([top.x, top.y, top.z], i * 3); aGen[i] = c.gen; aPar.set(par, i * 4); i++;
      }
    }
    for (let k = 0; k < nWreath; k++) { const par = [rng(), rng(), 1, rng() < 0.35 ? 0 : 1]; if ((k * 0.618034) % 1 < wreathKeep) { aPar.set(par, i * 4); i++; } }   // (the same draws whatever is kept)
    // the near strings (opts.nearStrings: start points in this piece's space): separate cards evenly strung, amber and vermilion by turns (no draws from rng)
    nearStr.forEach((p0, li) => { for (let k = 0; k < perNear; k++, i++) {
      const h = (k * 0.618034 + li * 0.37) % 1, h2 = (k * 0.754877 + li * 0.19) % 1;
      aStart.set([p0.x + (h - 0.5) * 2.4, p0.y + (h2 - 0.5) * 2.4, p0.z + (((h + h2) % 1) - 0.5) * 2.4], i * 3); aGen[i] = 0;
      aPar.set([(k + 0.2 + 0.6 * h) / perNear, (0.137 + li * 0.291 + h2 * 0.004) % 1, 3, (k + li) % 3 === 0 ? 1 : 0], i * 4); } });
    nAirUsed = i;
  }
  const airGeo = new THREE.InstancedBufferGeometry();
  airGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); airGeo.setIndex([0, 1, 2, 0, 2, 3]);
  airGeo.setAttribute('aStart', new THREE.InstancedBufferAttribute(aStart, 3)); airGeo.setAttribute('aPar', new THREE.InstancedBufferAttribute(aPar, 4)); airGeo.setAttribute('aGen', new THREE.InstancedBufferAttribute(aGen, 1));
  airGeo.instanceCount = nAirUsed;
  const air = new THREE.Mesh(airGeo, airLeafMaterial(U, airU)); air.frustumCulled = false; root.add(air);
  await ctx.yield();

  // the Tongue's spine: a lacquer rib the pages hinge on
  { const g = geo(), pts = [], rad = [];
    for (let k = 0; k <= 7; k++) { pts.push(tongue.spine[k].clone()); rad.push(lerp(1.5, 0.45, k / 7)); if (k < 7) { pts.push(tongue.spine[k].clone().lerp(tongue.spine[k + 1], 0.5)); rad.push(lerp(1.5, 0.45, (k + 0.5) / 7) * 0.72); } }
    pts[0].y -= 1.2;
    tube(g, pts, rad, 6, 2, 1, true);
    for (const pg of tongue.pages) for (const e of [0, 1]) {            // hinge arms from the rib to each page corner
      const a = tongue.spine[pg.k + e], b = pg.c.clone().addScaledVector(pg.t, (e ? 1 : -1) * 53 * pg.sc).addScaledVector(pg.w, 1.5 * pg.sc);
      tube(g, [a.clone(), a.clone().lerp(b, 0.5).addScaledVector(pg.n, 0.8), b], [0.55, 0.4, 0.28], 4, e ? 2 : 6, 1, true);
    }
    const rib = applyCopies(g.build(), enamelMaterial(U, { wedgeSpace: true, noClip: true, fragColor: 'if (vInk.x > 1.5 && vInk.x < 2.5) { base = LACQ; gShade = LACQ*0.55; }' }), [{ matrix: new THREE.Matrix4(), gen: 1, shell: 0, seed: 0.5, clip: [0, 0, 0, 0] }]);
    root.add(rib); }

  // ---- anchors (local space; the camera arrives from +Z, climbing toward -Z) ----
  const slit = tongue.slit.clone(), fly = [];
  for (let k = 0; k <= 7; k++) { const th = tongue.TH[Math.max(0, k - 1)] * Math.PI / 180; fly.push(tongue.spine[k].clone().add(new THREE.Vector3(0, Math.cos(th), Math.sin(th)).multiplyScalar(lerp(34, 20, k / 7)))); }
  
  fly.push(slit.clone(), slit.clone().addScaledVector(head, 70), center.clone());
  const anchors = {
    center, heading: head.clone(), up: up.clone(),
    portalSeat: { position: center.clone(), normal: gHead.clone().negate(), heading: gHead.clone(), radius: 7, tiltDeg: 35 },
    slit: { position: slit, along: up.clone(), clearHalfWidth: GLOBE.slitHalf - 1.3 },
    flyThrough: fly, tongueRoot: tongue.spine[0].clone(), tongueTip: tongue.tip.clone(),
    viewpoints: { plain: new THREE.Vector3(60, 30, 560), underTongue: new THREE.Vector3(26, 22, 300), inside: slit.clone().addScaledVector(head, 40) },
  };

  // ---- animation ----
  const shellM = U.uShell.value, rotM = new THREE.Matrix4(), state = { progress: 0, shell: null, turn: null, koiT: null, eye: false }, eyeV = new THREE.Vector3();
  const update = (dt, time, camera) => {
    if (!state.eye && camera) { camera.getWorldPosition(eyeV); U.uShellEye.value.set(eyeV.x, eyeV.y, eyeV.z, 1 / 25); }   // (the world may place it: setShellEye)
    U.uTime.value = time;
    const turn = state.turn ?? (turn0 + time * turnRate); U.uTurn.value = turn;
    const koiT = state.koiT ?? time * KOI.speed; U.uKoiT.value = koiT; U.uJoint.value = state.joint ?? time * 0.26;
    rotM.makeRotationAxis(shellAxis, state.shell ?? (shell0 + time * shellRate));
    shellM.makeTranslation(0, cy, 0).multiply(rotM);
    const c = Math.cos(turn), s = Math.sin(turn), px = WEDGE.pivot[0], pz = WEDGE.pivot[1];
    for (let i = 0; i < 6; i++) { const a = maple.crown[i]; pondU.uCrown.value[i].set(px + c * a.x - s * a.z, a.y, pz + s * a.x + c * a.z, a.w); }
    { const f = maple.foot, t = maple.top; pondU.uTrunk.value.set(px + c * f.x - s * f.z, pz + s * f.x + c * f.z, px + c * t.x - s * t.z, pz + s * t.x + c * t.z); }
    for (let i = 0; i < 4; i++) {                       // ripple rings start where a koi was when the ring began
      const k = i % KOI.n, phase = i * 0.27, ph = (time * 0.3 + phase) % 1;
      const q = koiAtJS(k, koiT - (ph / 0.3) * KOI.speed + k * 2.1 + 3.4 / 30, U.uKoiYaw.value);
      pondU.uKoiW.value[i].set(px + c * q[0] - s * q[1], pz + s * q[0] + c * q[1], phase);
    }
    slotStones(turn); slotIris(turn);
  };
  update(0, 0);
  const dbg = opts.gview || '';
  // viewer-only framing (tools/shot.mjs _part --query "...&gview=in|mid|close|tongue"); the world never sets it
  let vR = 180, vH = 250, vC = new THREE.Vector3(0, 150, 40);
  if (dbg === 'in') { vR = 28; vH = 60; vC = center.clone().addScaledVector(head, -15); }
  if (dbg === 'mid') { vR = 75; vH = 60; vC = center.clone().addScaledVector(head, -15); }
  if (dbg === 'close') { vR = 9; vH = 26; vC = new THREE.Vector3(WEDGE.pivot[0] + 6, 5, WEDGE.pivot[1]).applyMatrix4(copies[0].matrix).applyMatrix4(shellM); }
  if (dbg === 'gate') { vR = 5; vH = 14; vC = center.clone(); }
  if (dbg === 'tongue') { vR = 34; vH = 40; vC = tongue.spine[4].clone().add(new THREE.Vector3(0, 12, 0)); }
  return {
    object: root, radius: vR, height: vH, center: vC,
    anchors, uniforms: U, update, ground: !dbg, groundY: 0,
    setProgress(u) { state.progress = clamp(u, 0, 1); airU.uProgress.value = state.progress; },
    setShellAngle(a) { state.shell = a; },
    setGateFacing(dir, scale = 1, open = 1, dist = 1e4) {    // open 0..1: the light in the Gate is a whole disc (0) or a band round the portal's own opening (1); dist: metres from the lens (the disc stands toward the lens while the ring is not square to the portal, and must still fit the ring)                         // local unit vector along which the Gate is passed (default: opts.gateHeading); scale: the Gate shown larger from afar (1 at the crossing)
      gateD.copy(dir).normalize(); if (gateD.dot(gHead) < -0.999) gateD.copy(gHead);
      gateQ.setFromUnitVectors(gHead, gateD); gateR.makeRotationFromQuaternion(gateQ);
      reveal.matrix.makeTranslation(center.x, center.y, center.z).multiply(gateR).multiply(gateT.makeTranslation(-center.x, -center.y, -center.z));
      gate.matrix.makeTranslation(center.x, center.y, center.z).multiply(gateR).multiply(gateT.makeScale(scale, scale, scale)).multiply(gateT.makeTranslation(-center.x, -center.y, -center.z));
      gate.matrixWorldNeedsUpdate = true; reveal.matrixWorldNeedsUpdate = true; { const cs = clamp(gateD.dot(gHead), -1, 1), zo = 0.2 + 7.4 * Math.sqrt(1 - cs * cs) * (1 - open); irisU.uIrisZ.value = zo; irisU.uIris.value = (7.5 * scale + 0.25) * (1 - zo / Math.max(dist, 30)); irisU.uIrisIn.value = Math.max(irisU.uIris.value, 7.05) * open;
        const zb = 0.3 + 7.4 * Math.sqrt(1 - cs * cs); medalU.uMedZ.value = zb; medalU.uMedR.value = (7.5 * scale + 0.35) * (1 + zb / Math.max(dist, 30)); medal.matrix.copy(reveal.matrix); medal.matrixWorldNeedsUpdate = true; } gateNow.copy(gate.matrix).multiply(gateM);
    },
    setTurn(a) { state.turn = a; },
    // THE KEEP-CLEAR (round 11, stage two; the owner's order of 11 Oct 2026). BY PLACE, ONCE, AT THE BUILD. The world hands over the flown
    // line of the first metres of its route (points of the path, each with the angle the disc has when the lens is there, the rocking left
    // out) and the copies of the garden that stand by it. A leaf card of the tree whose square, as it lies at rest, is nearer a point of
    // that line than `keep`, in any of those copies, is moved straight away from that point, a pass at a time, until none is (24 passes
    // at the most; a card they did not suffice for is told in `left`); a foliage pad whose shape lies nearer is raised whole by what is
    // missing (never lowered: one whose lobes hang under the line goes up past it). The line's points stand half a metre apart: the
    // chord between two is under a centimetre off the line. There is ONE authored tree: the move is made in the geometry every copy
    // shares, so all sixty gardens carry it. No draw of any stream is added, taken or reordered. It reads no lens and no clock, and of a
    // copy's seed number only its kind, as the shader does (a late copy turns late); April's droop is counted (it is where the bough
    // hangs). NOT counted: the sway and a card's own flutter about its middle; the world's remark at KEEP says what the 3.7 m holds.
    // The pond's mirrored crown is made of the boughs' tips and the trunk's top: where the pad that is raised is a tip's own, that tip's rosette in the water is raised
    // with it (round 12; told in `mirror`). A raised pad that is no tip's has no rosette in the water and nothing follows it.
    keepClear(line, list, keep) {
      const PX = WEDGE.pivot[0], PZ = WEDGE.pivot[1], late = U.uLateTurn.value, petal = U.uPetal.value, REACH = 48;   // (REACH: by the builder's ranges no foliage stands further from the pivot than 42.8 m, an ordinary bough's tip pad; with the keep 46.5 m)
      const droop = (x, y, z) => petal ? petal * Math.min(0.0045 * Math.pow(Math.max(Math.hypot(x + 3.5, z - 1.5) - 8, 0), 2), 0.22 * Math.max(y, 0)) : 0;   // (SWAY_GLSL's own line)
      // every pair of a copy and a point of the line, carried into the disc's own frame: the point; the turn's cosine and sine; the copy's inset
      const Q = [], inv = new THREE.Matrix4(), v = new THREE.Vector3();
      for (const c of list) {
        if (c.clip[3] < -1.5 || c.clip[3] > 1.5) continue;             // (a copy whose maple is not drawn)
        v.set(PX, 0, PZ).applyMatrix4(c.matrix); const hx = v.x, hz = v.z; inv.copy(c.matrix).invert();
        const lateC = c.seed >= 1.5 ? late : 0, inset = Math.max(c.clip[0] - 1.3, 0);
        for (const s of line) {
          if (Math.hypot(s.p.x - hx, s.p.z - hz) > REACH) continue;
          v.copy(s.p).applyMatrix4(inv); const a = s.turn + lateC, cs = Math.cos(a), sn = Math.sin(a), dx = v.x - PX, dz = v.z - PZ;
          Q.push(cs * dx + sn * dz, v.y, -sn * dx + cs * dz, cs, sn, inset);
        }
      }
      const out = { cards: 0, pads: 0, left: 0, far: 0, mirror: 0 }; if (!Q.length) return out;
      const inW = (k, x, z) => { const wx = PX + Q[k + 3] * x - Q[k + 4] * z, wz = PZ + Q[k + 4] * x + Q[k + 3] * z; return wx >= Q[k + 5] && wz >= 0 && WEDGE.hd - (wx * WEDGE.hn[0] + wz * WEDGE.hn[1]) >= 0; };
      // the point of triangle a b c closest to p (Ericson); r takes it
      const ab = new THREE.Vector3(), ac = new THREE.Vector3(), ap = new THREE.Vector3(), bp = new THREE.Vector3(), cp = new THREE.Vector3();
      const closest = (p, a, b, c, r) => {
        ab.subVectors(b, a); ac.subVectors(c, a); ap.subVectors(p, a); const d1 = ab.dot(ap), d2 = ac.dot(ap); if (d1 <= 0 && d2 <= 0) return r.copy(a);
        bp.subVectors(p, b); const d3 = ab.dot(bp), d4 = ac.dot(bp); if (d3 >= 0 && d4 <= d3) return r.copy(b);
        const vc = d1 * d4 - d3 * d2; if (vc <= 0 && d1 >= 0 && d3 <= 0) return r.copy(a).addScaledVector(ab, d1 / (d1 - d3));
        cp.subVectors(p, c); const d5 = ab.dot(cp), d6 = ac.dot(cp); if (d6 >= 0 && d5 <= d6) return r.copy(c);
        const vb = d5 * d2 - d1 * d6; if (vb <= 0 && d2 >= 0 && d6 <= 0) return r.copy(a).addScaledVector(ac, d2 / (d2 - d6));
        const va = d3 * d6 - d5 * d4; if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) return r.copy(b).addScaledVector(cp.subVectors(c, b), (d4 - d3) / ((d4 - d3) + (d5 - d6)));
        const dn = 1 / (va + vb + vc); return r.copy(a).addScaledVector(ab, vb * dn).addScaledVector(ac, vc * dn);
      };
      const q = new THREE.Vector3(), hit = new THREE.Vector3(), dir = new THREE.Vector3(), T = [0, 1, 2, 3].map(() => new THREE.Vector3());
      // what is missing for the shape T[0..n) (a fan of triangles from T[0]) against every pair it is drawn in: the most, and the way straight away from the line there
      const missing = (n, cx, cy, cz, reach) => {
        let worst = 0;
        for (let k = 0; k < Q.length; k += 6) {
          const ex = cx - Q[k], ey = cy - Q[k + 1], ez = cz - Q[k + 2], far = keep + reach; if (ex * ex + ey * ey + ez * ez > far * far) continue;
          let drawn = inW(k, cx, cz); for (let j = 0; j < n && !drawn; j++) drawn = inW(k, T[j].x, T[j].z); if (!drawn) continue;
          q.set(Q[k], Q[k + 1], Q[k + 2]);
          for (let j = 1; j + 1 < n; j++) { closest(q, T[0], T[j], T[j + 1], hit); const dd = hit.distanceTo(q); if (keep - dd > worst) { worst = keep - dd; if (dd > 1e-4) dir.subVectors(hit, q).divideScalar(dd); else dir.set(cx - Q[k], cy - Q[k + 1], cz - Q[k + 2]).normalize(); } }
        }
        return worst;
      };
      // the leaf cards (a card afloat on the water is not the tree's): the square as the shader lays it at rest
      const LP = maple.leafGeo.getAttribute('position'), LN = maple.leafGeo.getAttribute('normal'), LC = maple.leafGeo.getAttribute('aCard');
      const nn = new THREE.Vector3(), tt = new THREE.Vector3(), bb = new THREE.Vector3(), AX = new THREE.Vector3(0.31, 0.2, 0.93), CN = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (let i = 0; i < LP.count; i += 4) {
        if (LC.getW(i) > 1.5) continue;
        const size = LC.getZ(i); let x = LP.getX(i), y = LP.getY(i), z = LP.getZ(i), moved = 0, miss = 0;
        nn.set(LN.getX(i), LN.getY(i), LN.getZ(i)).normalize(); tt.crossVectors(nn, AX); tt.divideScalar(Math.max(tt.length(), 1e-3)); bb.crossVectors(nn, tt);
        for (let pass = 0; pass <= 24; pass++) {                       // (24: a bound and no tuning; a pass clears the worst point of the line, and a card between several points needs a few)
          const yy = y - droop(x, y, z);
          for (let j = 0; j < 4; j++) T[j].set(x, yy, z).addScaledVector(tt, CN[j][0] * size).addScaledVector(bb, CN[j][1] * size);
          miss = missing(4, x, yy, z, 1.5 * size); if (miss <= 0 || pass === 24) break;   // (1.5 size: a square's corner stands 1.414 size from its middle)
          const m = miss + 0.01; moved += m;                        // (a centimetre more than is missing, so that the next reading is clear of rounding)
          if (y + dir.y * m < 2) { const h = Math.hypot(dir.x, dir.z); y = 2; if (h > 1e-3) { x += dir.x / h * m; z += dir.z / h * m; } else x += m; }   // (the builder's own floor for a card: 2 m)
          else { x += dir.x * m; y += dir.y * m; z += dir.z * m; }
        }
        if (moved) { for (let j = 0; j < 4; j++) LP.setXYZ(i + j, x, y, z); out.cards++; out.far = Math.max(out.far, moved); if (miss > 0) out.left++; }
      }
      LP.needsUpdate = true;
      // the foliage pads (none is drawn in January; the reaching bough's four tufts are not pads): each a fan from its own heart, raised whole
      if (!(U.uBare.value > 0.5)) {
        const TP = maple.trunkGeo.getAttribute('position'), TA = maple.trunkGeo.getAttribute('aPad'), runs = [];
        for (let i = 0; i < TA.count; i++) {
          if (!(TA.getW(i) > 0)) continue; const r = runs[runs.length - 1];
          if (r && r.i1 === i && TA.getX(r.i0) === TA.getX(i) && TA.getY(r.i0) === TA.getY(i) && TA.getZ(r.i0) === TA.getZ(i) && TA.getW(r.i0) === TA.getW(i)) r.i1 = i + 1; else runs.push({ i0: i, i1: i + 1 });
        }
        for (const r of runs) {
          const n = r.i1 - r.i0; while (T.length < n + 1) T.push(new THREE.Vector3());   // (a pad is its heart's vertex and its ring, in order: the fan closes on the ring's first)
          let up = 0, miss = 0;
          for (let pass = 0; pass <= 80; pass++) {                    // (80: a bound and no tuning; a pass raises the pad by what is missing at its worst point)
            for (let j = 0; j < n; j++) { const x = TP.getX(r.i0 + j), y = TP.getY(r.i0 + j) + up, z = TP.getZ(r.i0 + j); T[j].set(x, y - droop(x, y, z), z); } T[n].copy(T[1]);
            const hx = TA.getX(r.i0), hy = TA.getY(r.i0) + up, hz = TA.getZ(r.i0);
            miss = missing(n + 1, hx, hy - droop(hx, hy, hz), hz, 2 * TA.getW(r.i0)); if (miss <= 0 || pass === 80) break;   // (2 w: by the builder no vertex of a pad stands further from its heart than 1.16 w; the rest is room for April's unequal droop)
            up += Math.max(miss + 0.01, 0.05);                       // (5 cm at the least, so that a rise near its end does not take a pass for a millimetre)
          }
          if (up) { for (let i = r.i0; i < r.i1; i++) { TP.setY(i, TP.getY(i) + up); TA.setY(i, TA.getY(i) + up); } out.pads++; out.far = Math.max(out.far, up); if (miss > 0) out.left++;
            for (const c of maple.crown) if (Math.fround(c.x) === TA.getX(r.i0) && Math.fround(c.z) === TA.getZ(r.i0)) { c.y += up; out.mirror++; } }   // (a tip's pad stands over the tip itself: the same x and z; the pond's uniform is filled from maple.crown at every update)
        }
        TP.needsUpdate = true; TA.needsUpdate = true;
      }
      return out;
    },
    setShellEye(p, perMetre) { state.eye = true; U.uShellEye.value.set(p.x, p.y, p.z, perMetre); },   // where the Globe's reflections are counted from (world point), and how many per metre
    setJointClock(v) { state.joint = v; },                // the koi that keep to the joint of each garden: their angle (radians); 2.72 is a pair touching noses on the joint
    setKoiClock(v) { state.koiT = v; },                   // overrides the timed swimming (radians along the figure of eight)                       // overrides the timed turning of the disc (the world keys it to u)
    // THE PLAIN: more mirror images of the same garden, as their own meshes (so the world can hide them). list: copies
    // { matrix, gen, shell: -1 (generation counted from uGenEye), seed, clip }; level 'full' or 'mid' (pond, seams, tree).
    addCopies(list, level = 'full') {
      const grp = new THREE.Group(), share = (g) => { const o = new THREE.BufferGeometry(); for (const k of ['position', 'normal', 'aInk', 'aCard', 'aPad']) if (g.getAttribute(k)) o.setAttribute(k, g.getAttribute(k)); o.setIndex(g.getIndex()); return o; };
      const tg = share(maple.trunkGeo); if (level !== 'full') tg.setDrawRange(0, maple.coreIndex);
      grp.add(applyCopies(share(plates.geometry), plateMat0, list), applyCopies(tg, trunkMat, list));
      if (level === 'full') grp.add(applyCopies(share(maple.leafGeo), leafMat, list), applyCopies(share(stoneGeo), stoneMat, list, 4), applyCopies(share(irisGeo), irisMat, list, 2), applyCopies(share(koiGeo), koiMat, list, KOI.n));
      return grp;
    },
    crown: pondU.uCrown, mirrorN: pondU.uMirrorN, pondRing: pondU.uRing, koiRings: pondU.uKoiW, maple, tongue, copies, turnAt: (time) => turn0 + time * turnRate,
    shellAt: (time) => state.shell ?? (shell0 + time * shellRate),
    dispose() {},
  };
}
export { geo, tube };
