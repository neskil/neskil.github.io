// PAINTED SHADOW TOWN: hero set piece and style kit ("Where the Light Is Painted On", after the Caligari set designers, 1920).
// The upper street head-on: a canyon of leaning canvas flats 60 m high (course z 150..524), knife gables crossing overhead, a chalk
// road zigzagging up a raked floor cloth, five crooked bridges rising like a stair, and the black wedge that lies across the road at
// z 283, climbs the port wall and ends in a black kite on a door flat that closes the canyon. The kite is cut: fly through it and the
// town is seen from behind (raw linen, lath, braces, the paint ghosting through in reverse).
//
// HOW THE STYLE IS MADE (shade the whole world with these; post { flat: 1, bloom 0 }, no tone-map inverse, no fog, no lights)
//   STYLE.uniforms   one set PER BUILD (buildHero makes a fresh one, also returned as hero.uniforms; make the world's materials straight
//                    after buildHero with no pause between, so two instances of the world never share dye or gusts): uDye (the single film tint), uInk, uTime, uRock, uLoose, uGust (course z of three gust fronts, w strength),
//                    uToCourse (world -> course coordinates, set by hero.update), uKite/uKite2 (the cut door), uViewH (set it to the
//                    drawing-buffer height each frame for minimum mark sizes).
//   STYLE_GLSL       distemper(g): THE final line of every material, colour = mix(black, dye, g) in display space (g 0 black, 0.42 grey,
//                    1 chalk; above 1 it runs on to bare chalk white, the painted light the dye does not take: 2; G has the named values); depthStep(g, s) the painted distance (step 1 = grey on chalk, no black);
//                    gustBand(z), kiteF(zy), h21, vnoise.  STYLE_VERT: clothPos(), the belly, gust and rocking of cloth.  STYLE_FRAG:
//                    slub(), lineAA(), lathMask().
//   canvasMaterial   scrubbed grey cloth with seams (front), linen and lath (back). { seam, tacks, cut }.   paintMaterial: distemper as
//                    clipped polygons, dry-brush teeth, bristle streaks, skips; back faces ghost through the linen.
//   boardMaterial    flat pigment from attribute aG (cut-outs, lath, bridges; instanced aSway = (phase, radians) nods a board).
//   ribbonMaterial   ropes and rails, never under 1.5 px.   ragMaterial: loose knives of cloth that flap and stream in a gust.
//   makePanel(spec)  a flat (plane with a knife gable) -> panel;  emitSkin(buf, panel);  floorPanels(zA, zB) the floor cloth as panels
//                    (zA a multiple of 6);  paintOnto(buf, panels, shape) clips a convex 3- or 4-gon to every grid triangle it crosses,
//                    in 'zt' (course z, unfolded T: crosses floor and walls in one sweep, see STREET.T) or 'ab' (metres in one panel);
//                    Buf(paint?) collects vertices, .geometry() makes the mesh geometry (skins: canvasMaterial, paint: paintMaterial,
//                    renderOrder 2).  STREET: hw, flatH, rise, rake, floorY, bay, T.  dyeAt(u, reel): the reel (amber -> bare chalk at
//                    0.665 -> blue-green; 'rose': rose from the kite, u 0.49, to 0.665; 'long': amber to 0.86).
//
// buildHero(ctx, opts) -> { object, radius 190, height 96, center, anchors, update, setProgress(u), kiteOpen, variation, panels, floors,
//                           street (the group in course coordinates), road0 [z, T] where the chalk road starts, bridges, uniforms }
//   opts: palette (6 hex, the brief's), detail 0.6..1 (flakes, fans, rags), backcloth (default true: the 700 m tent with splinters),
//         windowCut 'kite'|'rhomb'|'splinter', broadShafts, gusts 0|1|3|5 (1 = light air: soft breaths at 0.75 strength), gustTimes [u...], loose (the flat that comes loose from u 0.2),
//         figures, density, reel, gaps [[side, z0, z1]...] (flats whose middle lies in a range are drawn from the seed but stood out of
//         sight, so the world can open the wall there).  Unset ones are drawn from ctx.rng.
//   COORDINATES: inside, everything is in the brief's course coordinates (x, z as written; y = 0 on the floor at z 160, so add 9.23 for a
//   floor that is 0 at z 0). The object's own local space has the mouth toward +Z: local = (-x, y, 340 - z). To put it on the course:
//   object.rotation.y = Math.PI; object.position.set(0, 9.23, 340). NOTE the brief's "port" wall (x < 0) is on the RIGHT of a three.js
//   camera flying +Z; the coordinates were followed, not the word.
//   anchors (local space; anchors.fromCourse(x, y, z) converts): flyThrough (11 points: mouth, 2.4 m over the floor under the bridges,
//   2 m over the wedge at z 292, up the wedge wall, through the kite, into the back lane; 6 m clear except floor and cloth rags),
//   kite { position, normal (toward the street), halfWidth 7, up 8, down 16 }, wedgeTip, wedgeFoot, mouth, end, viewpoints { headOn,
//   overWedge, climb, backLane } each { position, target }, loosePanel.
//   setProgress(u): the world's u, every event hangs on it (gusts, rocking, cut-outs sliding, dye, loose flat). Never called = runs as
//   a 42 s preview on the clock. hero.kiteOpen: null = the black behind the kite dries open with camera distance (34 m -> 9 m); set 0..1 to drive it.
//   Cost: about 50k triangles, 10 draw calls, about 200 ms of build in steps under 30 ms; no lights, no textures.
//   The canyon stands OPEN from z 205 (flats lower and leaning less, the far end lower still, bridges at z 191, 210, 230, 352, 372, 446, 461,
//   no splinters on the north of the backcloth): the world stands its great tower at the street's end (z 482) and it must be seen whole.
//   Expects around it: the lower street (z < 150) and whatever stands behind the port wall (back lane, second street), the roofs, a floor
//   outside the walls. Artist's debug: ?psv=1 in the _part viewer puts the orbit camera inside the street (poses in the file).
import * as THREE from 'three';

export const PALETTE = ['#11100F', '#6C685F', '#EEE7D4', '#D69E3A', '#5FA3A0', '#C98A8C'];
// the three distempers as the one number every material ends in: colour = mix(black, dye, g)
export const G = { black: 0, grey: 0.42, chalk: 1, linen: 0.8, lath: 0.3, pale: 0.86 };

const srgb = (hex) => { const c = new THREE.Color(hex); c.convertLinearToSRGB(); return new THREE.Vector3(c.r, c.g, c.b); };
const _sc = new Map(), srgbC = (hex) => { let v = _sc.get(hex); if (!v) _sc.set(hex, v = srgb(hex)); return v; };   // cached, never mutated

// One set of uniforms shared by every material of the world (display-space sRGB triples for ink and dye).
// a fresh set per build: two instances of the world (one flown, one seen through its portal) must not share dye, gusts or progress
const makeUniforms = () => ({
    uInk: { value: srgb(PALETTE[0]) },
    uDye: { value: srgb(PALETTE[3]) },
    uTime: { value: 0 },
    uRock: { value: 0 },                                   // phase of the six rocking gables and of nodding boards (from progress)
    uLoose: { value: 0 },                                  // tan(angle) of the flat that comes loose (rare event), 0 = nailed
    uGust: { value: new THREE.Vector4(-999, -999, -999, 1) }, // course z of up to three gust fronts, w = strength
    uToCourse: { value: new THREE.Matrix4() },             // world -> course coordinates (x port negative, y up from the floor at z 160, z along the street)
    uKite: { value: new THREE.Vector4(410, 52, 7, 0.1) },  // the cut kite door: z centre, y of widest part, half width, lean (dz per dy)
    uKite2: { value: new THREE.Vector4(8, 16, 0, 0) },     // height above / below the widest part
    uViewH: { value: 900 },                                // drawing-buffer height in pixels (for minimum mark sizes)
  });
export const STYLE = { uniforms: makeUniforms() };

export const STYLE_GLSL = /* glsl */`
uniform vec3 uInk, uDye; uniform float uTime, uRock, uLoose, uViewH; uniform vec4 uGust, uKite, uKite2; uniform mat4 uToCourse;
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
// THE one final line of every material: g = 0 black, 0.42 grey, 1 chalk; mixed in display space, written linear.
// g above 1 is PAINTED LIGHT: bare chalk that the dye does not take (2 = chalk white), the third tone of every reel.
vec3 distemper(float g){ vec3 c = mix(uInk, uDye, clamp(g, 0., 1.)); c = mix(c, vec3(0.9333, 0.9059, 0.8314), clamp(g - 1., 0., 1.));
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
// painted distance: step 1 flats carry grey on chalk and no black
float depthStep(float g, float s){ return mix(g, 0.42 + 0.58 * clamp(g * 2., 0., 1.) + 0.6 * clamp(g - 1., 0., 1.), s); }
float gustBand(float z){ vec3 d = (vec3(z) - uGust.xyz) / 16.; return uGust.w * (exp(-d.x * d.x) + exp(-d.y * d.y) + exp(-d.z * d.z)); }
// signed kite test in the wall plane (z, y): below 0 is inside the cut door
float kiteF(vec2 zy){ float dy = zy.y - uKite.y; float dz = zy.x - uKite.x - uKite.w * dy;
  return abs(dz) / max(uKite.z, 1e-3) + (dy > 0. ? dy / max(uKite2.x, 1e-3) : -dy / max(uKite2.y, 1e-3)) - 1.; }
`;

// Vertex side of cloth: aPan = (u, v in lath bays, belly weight, phase), aAux = (rock height, loose height, depth step, bays u*16 + bays v),
// aBay = local bay size in metres, aMet = metres in the panel plane. clothPos() returns the displaced position; call it from every material that lies on canvas.
export const STYLE_VERT = /* glsl */`
attribute vec4 aPan; attribute vec4 aAux; attribute vec2 aBay; attribute vec2 aMet;
varying vec4 vPan; varying vec4 vAux; varying vec2 vBay; varying vec2 vMet; varying vec3 vCourse;
vec3 clothPos(vec3 pos, vec3 nrm){
  vec3 c0 = (uToCourse * modelMatrix * vec4(pos, 1.)).xyz;
  float band = gustBand(c0.z);
  float wall = 1. - 0.65 * step(0.9, abs(nrm.y));                          // the floor cloth is tacked down: it puckers less than a flat bellies
  float rp = sin(c0.z * 0.045 - uTime * 2.6 + 1.3 * sin(c0.x * 0.05 + aPan.w * 3.)); rp *= rp; rp *= rp;   // the draught: a soft wave every 140 m running up the course at 58 m/s
  float d = aPan.z * wall * (0.09 * sin(uTime * 1.3 + aPan.w * 6.283) + 0.06 * sin(c0.z * 0.09 - uTime * 2.1 + aPan.w * 2.) + 0.13 * rp + band * (0.42 + 0.18 * sin(uTime * 9. + aPan.w * 40. + c0.z * 0.4)));
  d += aAux.x * 0.01745 * sin(uRock + aPan.w * 6.283) + aAux.y * uLoose;
  vec3 p = pos + nrm * d;
  vPan = aPan; vAux = aAux; vBay = aBay; vMet = aMet; vCourse = (uToCourse * modelMatrix * vec4(p, 1.)).xyz;
  return p;
}
`;

// Fragment side of cloth: slub weave, seams, tacks, lath; all fade to their flat average before they go under 3 pixels.
export const STYLE_FRAG = /* glsl */`
varying vec4 vPan; varying vec4 vAux; varying vec2 vBay; varying vec2 vMet; varying vec3 vCourse;
float slub(vec2 m, vec2 fw){
  // 4 mm threads, and thicker slub threads every few centimetres that read from 2 to 12 m
  float f4 = 1. - smoothstep(0.3, 0.7, max(fw.x, fw.y) / 0.004);
  float f12 = 1. - smoothstep(0.28, 0.6, max(fw.x, fw.y) / 0.012);
  vec2 c12 = floor(m / 0.012); float ou = mod(c12.x + c12.y, 2.);          // the coarse over-and-under of scenic canvas
  float w = sin(m.x * 1570.8) * sin(m.y * 1570.8) * f4 * 0.6 + (ou - 0.5) * 1.3 * f12 * (0.6 + 0.8 * h21(c12));
  vec2 r = floor(m / 0.03); vec2 fr = fract(m / 0.03);
  float f30 = 1. - smoothstep(0.25, 0.55, max(fw.x, fw.y) / 0.03);
  float sx = step(0.72, h21(vec2(r.x, 3.))) * (vnoise(vec2(r.x * 7.3, m.y * 0.9)) - 0.5) * smoothstep(0., 0.3, fr.x) * smoothstep(1., 0.7, fr.x);
  float sy = step(0.72, h21(vec2(7., r.y))) * (vnoise(vec2(m.x * 0.9, r.y * 5.1)) - 0.5) * smoothstep(0., 0.3, fr.y) * smoothstep(1., 0.7, fr.y);
  return w + (sx + sy) * 2.2 * f30;
}
// a line of half-width hw metres at distance d, never thinner than 1.5 px, fading out when it would be much thinner than that
float lineAA(float d, float hw, float fw){ float w = max(hw, 0.75 * fw); return (1. - smoothstep(w - fw * 0.5, w + fw * 0.5, d)) * min(1., hw / max(0.3 * fw, 1e-5)); }
// lath frame of a flat seen from behind: 1 on wood. pan in bays, bay in metres.
float lathMask(vec2 pan, vec2 bay, float code, vec2 fwm){
  vec2 nb = vec2(floor(code / 16.), code - 16. * floor(code / 16.));
  vec2 dl = abs(pan - floor(pan + 0.5)) * bay;
  float m = max(lineAA(dl.x, 0.15, fwm.x), lineAA(dl.y, 0.15, fwm.y));
  vec2 a = pan * bay, L = vec2(nb.x * bay.x, 0.5 * nb.y * bay.y);
  float ll = max(length(L), 1e-3); float t = clamp(dot(a, L) / (ll * ll), 0., 1.);
  float db = length(a - L * t);
  return max(m, lineAA(db, 0.13, max(fwm.x, fwm.y)));
}
`;

const shared = (extra = {}) => ({ ...STYLE.uniforms, ...extra });

// CANVAS: the sized, scrubbed grey cloth of every flat and of the floor (front), raw linen and lath (back).
// seam = cloth width in metres along pan u; tacks = 1 draws tacks every 0.3 m beside the seams (floor); cut = 1 lets the kite door cut it.
export function canvasMaterial({ seam = 1.83, tacks = 0, cut = 1, side = THREE.DoubleSide } = {}) {
  return new THREE.ShaderMaterial({
    side, uniforms: shared({ uSeam: { value: seam }, uTack: { value: tacks }, uCut: { value: cut }, uSeamW: { value: tacks ? 0.03 : 0.012 } }),
    vertexShader: STYLE_GLSL + STYLE_VERT + /* glsl */`
      void main(){ vec3 p = clothPos(position, normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
    fragmentShader: STYLE_GLSL + STYLE_FRAG + /* glsl */`
      uniform float uSeam, uTack, uCut, uSeamW;
      void main(){
        if (uCut > 0.5 && vCourse.x < -2. && kiteF(vCourse.zy) < 0.) discard;
        vec2 m = vMet; vec2 fw = fwidth(m); float fwm = max(fw.x, fw.y);
        float g;
        if (gl_FrontFacing) {
          // scrubbed size-colour: long dragged streaks in two crossing directions, in three flat steps
          vec2 r1 = vec2(m.x * 0.94 + m.y * 0.34, -m.x * 0.34 + m.y * 0.94), r2 = vec2(m.x * 0.5 - m.y * 0.87, m.x * 0.87 + m.y * 0.5);
          float n = vnoise(vec2(r1.x * 0.9 + vPan.w * 37., r1.y * 0.07 + vPan.w * 11.)), n2 = vnoise(vec2(r2.x * 0.55 + vPan.w * 5., r2.y * 0.05 - vPan.w * 23.));
          g = 0.42 + 0.045 * step(0.62, n) - 0.035 * step(n, 0.3) + 0.03 * step(0.66, n2) * (1. - step(0.62, n));
          g += 0.07 * slub(m, fw);
          float sw = max(uSeam, 0.1);
          g += (0.022 + 0.058 * uTack) * (h21(vec2(floor(m.x / sw + 0.5), 7. + floor(vPan.w * 64.) * (1. - uTack))) - 0.5);          // each sewn width took the size a little differently
          // THE HAND on the base coat: dry-brush scumble dragged across the flat in two directions of its own, chalky pulls and a darker scrub,
          // 0.2 m tracks that run dry, bristle skips while a bristle clump is over a pixel and their flat average beyond
          float th = 0.5 + 2.2 * vPan.w, cth = cos(th), sth = sin(th);
          vec2 q = vec2(m.x * cth + m.y * sth, -m.x * sth + m.y * cth), q2 = vec2(m.x * cth - m.y * sth, m.x * sth + m.y * cth) * vec2(1., -1.);
          float fq = max(fwidth(q.y), 1e-5), kp = 1. - smoothstep(0.012, 0.03, fq), kt = 1. - smoothstep(0.1, 0.22, fq);
          float tk1 = floor(q.y / 0.21), hb1 = h21(vec2(tk1, 3. + floor(vPan.w * 97.)));
          float bd1 = floor(q.y / 1.26), hbd = h21(vec2(bd1, 11. + floor(vPan.w * 43.)));
          float pat = step(0.5, vnoise(vec2((q.x + 2.6 * hb1) * 0.13 + hbd * 57., bd1 * 3.7))) * step(0.3, hbd);
          float run = step(0.34, vnoise(vec2(q.x * 0.13 + hb1 * 41., tk1 * 0.71)));
          float br1 = step(0.42, h21(vec2(floor(q.y / 0.03), 5. + floor(vPan.w * 31.)))) * step(0.3, vnoise(vec2(q.x * 0.8, floor(q.y / 0.03) * 1.7)));
          g += mix(0.1, 0.15, kp) * (1. - uTack * 0.45) * pat * mix(0.6, run * step(0.22, hb1), kt) * mix(0.62, br1, kp);
          float tk2 = floor(q2.y / 0.26), hb2 = h21(vec2(tk2, 9. + floor(vPan.w * 61.)));
          float bd2 = floor(q2.y / 1.56), hbe = h21(vec2(bd2, 23. + floor(vPan.w * 67.)));
          float pat2 = step(0.55, vnoise(vec2((q2.x + 3.1 * hb2) * 0.1 + hbe * 39., bd2 * 5.3))) * step(0.4, hbe) * (1. - pat);
          float br2 = step(0.5, h21(vec2(floor(q2.y / 0.034), 2.))) * step(0.3, vnoise(vec2(q2.x * 0.6, floor(q2.y / 0.034) * 2.3)));
          g -= 0.1 * pat2 * mix(0.6, step(0.32, vnoise(vec2(q2.x * 0.12 + hb2 * 37., tk2 * 0.53))), kt) * mix(0.55, br2, kp);
          float ds = abs(m.x / sw - floor(m.x / sw + 0.5)) * sw;
          g = mix(g, 0.25, lineAA(ds, uSeamW, fw.x) * (0.3 + 0.55 * uTack));
          g = mix(g, 0.52, lineAA(abs(ds - 0.04 - uSeamW * 2.), 0.008 + uSeamW * 0.5, fw.x) * (0.25 + 0.35 * uTack));          // the turned hem beside the seam catches the size
          if (uTack > 0.5) {
            float ty = (fract(m.y / 0.3) - 0.5) * 0.3;
            float dt = length(vec2(ds - 0.075, ty));
            float tk = (1. - smoothstep(0.026, 0.026 + fwm, dt)) * (1. - smoothstep(0.03, 0.07, fwm));
            g = mix(g, 0.04, tk);
          }
        } else {
          g = 0.8 + 0.07 * slub(m, fw) - 0.04 * step(0.6, vnoise(m * vec2(0.4, 0.15) + vPan.w * 9.));
          float lm = lathMask(vPan.xy, vBay, vAux.w, fw);
          float grain = 0.2 + 0.07 * step(0.5, vnoise(m * vec2(9., 0.4) + m.yx * vec2(0.4, 9.)));
          g = mix(g, grain, lm);
        }
        gl_FragColor = vec4(distemper(gl_FrontFacing ? depthStep(g, vAux.z) : g), 1.);        // the back of a flat is raw linen and wood at any distance
      }`,
  });
}

// PAINT: distemper laid on the cloth as clipped polygons (see paintOnto). aEdge = metres to each of the shape's four true edges,
// aStroke = (metres along the pull, metres across it, g of the pigment, seed). Dry-brush teeth, bristle streaks and skips are cut here.
export function paintMaterial({ cut = 1 } = {}) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    uniforms: shared({ uCut: { value: cut } }),
    vertexShader: STYLE_GLSL + STYLE_VERT + /* glsl */`
      attribute vec4 aEdge; attribute vec4 aStroke; varying vec4 vEdge; varying vec4 vStroke;
      void main(){ vEdge = aEdge; vStroke = aStroke; vec3 p = clothPos(position, normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
    fragmentShader: STYLE_GLSL + STYLE_FRAG + /* glsl */`
      uniform float uCut; varying vec4 vEdge; varying vec4 vStroke;
      void main(){
        if (uCut > 0.5 && vCourse.x < -2. && kiteF(vCourse.zy) < 0.) discard;
        float d = min(min(vEdge.x, vEdge.y), min(vEdge.z, vEdge.w));
        float l = vStroke.x, a = vStroke.y, seed = vStroke.w;
        float fwm = fwidth(a), fd = max(fwidth(d), 1e-5);
        float trk = floor(a / 0.05), ft = floor(a / 0.0125);
        float hb = h21(vec2(trk, seed)), hf = h21(vec2(ft, seed + 3.));
        float keep = 1. - smoothstep(0.02, 0.05, fwm);                       // teeth are drawn while a 5 cm clump is over ~1.5 px
        float keepF = 1. - smoothstep(0.005, 0.011, fwm);                    // single bristles only up close
        float thr = mix(0.05, 0.012 + 0.22 * hb * hb + 0.05 * hf * keepF + 0.06 * vnoise(vec2(l * 0.7, seed)), keep);
        // coarse teeth that survive to mid distance: 0.22 m clumps of bristle that stop short, deeper on a broad pull than on a thin one
        float em = min(vEdge.x, vEdge.y), eM = max(vEdge.x, vEdge.y), fm = min(vEdge.z, vEdge.w), fM = max(vEdge.z, vEdge.w), d2 = min(max(em, fm), min(eM, fM));
        float hc = h21(vec2(floor(a / 0.22), seed + 7.));
        thr += (1. - smoothstep(0.09, 0.22, fwm)) * min(0.5, 0.45 * d2) * hc * hc;
        float cov = smoothstep(thr - fd * 0.6, thr + fd * 0.6, d);
        float dry = vnoise(vec2(l * 0.21 + hb * 31., trk * 0.37 + seed));    // long skips where a clump of bristles ran dry
        float skip = smoothstep(0.69, 0.75, dry) * step(0.3, hf);
        float streak = step(0.9, h21(vec2(ft, seed + 9.))) * step(0.35, vnoise(vec2(l * 0.9 + hf * 13., ft)));
        cov *= 1. - keep * skip * 0.92 - keepF * streak * 0.7 * (1. - skip);
        float g = vStroke.z; float alpha = cov;
        vec2 m = vMet; vec2 fw = fwidth(m);
        if (gl_FrontFacing) { g += 0.03 * slub(m, fw) * (1. - 0.6 * min(g, 1.)); }
        else {                                                               // the paint ghosts through the raw linen in reverse
          if (lathMask(vPan.xy, vBay, vAux.w, fw) > 0.5) discard;
          g = mix(0.8, g, 0.62) + 0.05 * slub(m, fw); alpha = cov * 0.92;
        }
        gl_FragColor = vec4(distemper(gl_FrontFacing ? depthStep(g, vAux.z) : g), alpha);
      }`,
  });
}

// BOARD: cut-out profile boards, bridges, lath, braces, the cat, the backcloth splinters. Flat pigment from the vertex attribute aG.
// Instanced meshes may carry aSway = (phase, radians): the board nods about its foot in its own plane, keyed to uRock.
export function boardMaterial({ side = THREE.DoubleSide } = {}) {
  return new THREE.ShaderMaterial({
    side, uniforms: shared(),
    vertexShader: STYLE_GLSL + /* glsl */`
      attribute float aG; attribute vec2 aSway; varying float vG;
      void main(){
        vG = aG; vec3 p = position;
        float ang = aSway.y * sin(uRock * 2.3 + uTime * 0.6 + aSway.x * 6.283);
        float c = cos(ang), s = sin(ang); p.xy = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
        #ifdef USE_INSTANCING
          p = (instanceMatrix * vec4(p, 1.)).xyz;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
      }`,
    fragmentShader: STYLE_GLSL + /* glsl */`
      varying float vG; void main(){ gl_FragColor = vec4(distemper(vG), 1.); }`,
  });
}

// RIBBON: ropes, rails and wires. position = centre line, aSide = (tangent xyz, signed half width): faces the eye, never under 1.5 px.
export function ribbonMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: shared(),
    vertexShader: STYLE_GLSL + /* glsl */`
      attribute vec4 aSide; attribute float aG; varying float vG;
      void main(){
        vG = aG; vec4 mv = modelViewMatrix * vec4(position, 1.);
        vec3 t = (modelViewMatrix * vec4(aSide.xyz, 0.)).xyz; vec3 sd = cross(t, mv.xyz);
        float ls = length(sd); sd = ls > 1e-5 ? sd / ls : vec3(1., 0., 0.);
        float px = abs(mv.z) * 2. / max(projectionMatrix[1][1] * uViewH, 1.);
        mv.xyz += sd * sign(aSide.w) * max(abs(aSide.w), 0.8 * px);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: STYLE_GLSL + /* glsl */`
      varying float vG; void main(){ gl_FragColor = vec4(distemper(vG), 1.); }`,
  });
}

// RAG: a loose knife of cloth. aRag = (0 at the tack .. 1 at the tip, phase, amplitude in metres, side), aFlap = the way it flaps.
// It always stirs, and streams when a gust front passes (course z from uToCourse).
export function ragMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: shared(),
    vertexShader: STYLE_GLSL + /* glsl */`
      attribute vec4 aRag; attribute vec3 aFlap; attribute float aG; varying float vG;
      void main(){
        vG = aG; vec3 c0 = (uToCourse * modelMatrix * vec4(position, 1.)).xyz;
        float band = gustBand(c0.z), t = aRag.x, ph = aRag.y * 6.283;
        float wv = sin(uTime * (3.2 + 2. * aRag.y) + ph - t * 4.5) * (0.4 + 1.6 * band) + 0.5 * sin(uTime * 1.1 + ph) + 2.2 * band;
        vec3 p = position + aFlap * aRag.z * t * sqrt(t) * wv + vec3(0., 0.35 * aRag.z * t * band * (1. + sin(uTime * 7. + ph)), 0.);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
      }`,
    fragmentShader: STYLE_GLSL + /* glsl */`
      varying float vG; void main(){ gl_FragColor = vec4(distemper(vG), 1.); }`,
  });
}

// ---------- the street's forced perspective, in course coordinates (the brief's z; y = 0 on the floor at z 160) ----------
const pl = (x, pts) => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } return pts[pts.length - 1][1]; };
export const STREET = {
  z0: 160, z1: 520, zc: 340,
  hw: (z) => pl(z, [[0, 15], [320, 11], [420, 9], [520, 1.5]]),            // half the distance between the walls
  flatH: (z) => pl(z, [[0, 25], [150, 34], [200, 44], [330, 48], [385, 60], [420, 60], [520, 20]]),   // height of the flats: 44 m at the mouth, so their knife gables and black roofs stand in frame against the backcloth, rising to 60 m at the door flat
  rise: (z) => (z - 160) * 30 / 520,                                       // the floor cloth climbs 30 m in 520
  rake: (z) => 0.0524 * Math.sin((z - 160) * Math.PI / 75),                // and rakes 3 degrees to alternate sides
  floorY(x, z) { return this.rise(z) + x * this.rake(z); },
  bay: (z) => pl(z, [[318, 0], [397, 6.8], [399, 7], [423, -7.3], [426, 0]]),   // the port wall draws back into a bay and the door flat turns to face down the street
  // unfolded lateral coordinate: on the floor T = x; on a wall T runs on up it. Paint authored in (z, T) crosses road and wall in one sweep.
  T(side, x, y, z) { return side === 0 ? x : side * (this.hw(z) + (side < 0 ? this.bay(z) : 0) + (y - this.rise(z))); },
};

const STR = 12; // per skin vertex: pos3, pan2, belly, met2 (a, b in metres in the panel plane), bay2, z, T
export class Buf {
  constructor(paint, cap = 4096) { this.paint = paint; this.n = 0; this.ni = 0; this.cap = cap; this.icap = cap * 2; this.alloc(); }
  alloc() {
    const mk = (k, old) => { const a = new Float32Array(this.cap * k); if (old) a.set(old.subarray(0, this.n * k)); return a; };
    this.pos = mk(3, this.pos); this.nrm = mk(3, this.nrm); this.pan = mk(4, this.pan); this.aux = mk(4, this.aux); this.bay = mk(2, this.bay); this.met = mk(2, this.met);
    if (this.paint) { this.edge = mk(4, this.edge); this.stroke = mk(4, this.stroke); }
  }
  vert(p, v, o, b0 = 1, o1 = 0, b1 = 0, o2 = 0, b2 = 0) {            // a vertex of panel p: record at offset o, or a barycentric mix of three
    if (this.n >= this.cap) { this.cap *= 2; this.alloc(); }
    const i = this.n++, f = (k) => v[o + k] * b0 + (b1 ? v[o1 + k] * b1 : 0) + (b2 ? v[o2 + k] * b2 : 0);
    this.pos[i * 3] = f(0); this.pos[i * 3 + 1] = f(1); this.pos[i * 3 + 2] = f(2);
    this.nrm[i * 3] = p.n.x; this.nrm[i * 3 + 1] = p.n.y; this.nrm[i * 3 + 2] = p.n.z;
    this.pan[i * 4] = f(3); this.pan[i * 4 + 1] = f(4); this.pan[i * 4 + 2] = f(5); this.pan[i * 4 + 3] = p.phase;
    const b = f(7);
    this.aux[i * 4] = p.rock * b; this.aux[i * 4 + 1] = p.loose * b; this.aux[i * 4 + 2] = p.step; this.aux[i * 4 + 3] = p.code;
    this.met[i * 2] = f(6); this.met[i * 2 + 1] = b; this.bay[i * 2] = f(8); this.bay[i * 2 + 1] = f(9);
    return i;
  }
  tri(a, b, c) { if (this.ni + 3 > this.icap) { this.icap *= 2; const n = new Uint32Array(this.icap); n.set(this.idx.subarray(0, this.ni)); this.idx = n; } if (!this.idx) this.idx = new Uint32Array(this.icap); this.idx[this.ni++] = a; this.idx[this.ni++] = b; this.idx[this.ni++] = c; }
  geometry() {
    const g = new THREE.BufferGeometry(), A = (name, arr, k) => g.setAttribute(name, new THREE.BufferAttribute(arr.subarray(0, this.n * k), k));   // a view, not a copy: copying a big paint buffer was the longest step of the build
    A('position', this.pos, 3); A('normal', this.nrm, 3); A('aPan', this.pan, 4); A('aAux', this.aux, 4); A('aBay', this.bay, 2); A('aMet', this.met, 2);
    if (this.paint) { A('aEdge', this.edge, 4); A('aStroke', this.stroke, 4); }
    g.setIndex(new THREE.BufferAttribute((this.idx || new Uint32Array(0)).subarray(0, this.ni), 1));
    return g;
  }
}

const _Y = new THREE.Vector3(0, 1, 0);
// A FLAT: a plane of canvas with a knife gable. spec: O (foot, course coords), side (-1 port, +1 starboard, normal faces the street),
// yaw, lean (top over the street), roll (in its own plane), w, hL, hR (shoulder heights), hTop, apex (0..1 across), xl, xr (shoulder
// overhang), br (rise of the foot line), nu, nv (even grid counts; laths lie on the even lines), step, rock, loose, phase.
export function makePanel(s) {
  const side = s.side, U0 = new THREE.Vector3(0, 0, side), N0 = new THREE.Vector3(-side, 0, 0);
  const U = U0.clone(), V = _Y.clone(), N = N0.clone();
  for (const a of [U, V, N]) a.applyAxisAngle(N0, s.roll || 0).applyAxisAngle(U0, s.lean || 0).applyAxisAngle(_Y, s.yaw || 0);
  const nu = s.nu, nv = s.nv, js = Math.max(2, Math.min(nv - 2, 2 * Math.round(nv * (0.5 * (s.hL + s.hR) / s.hTop) / 2)));
  const L = [[0, 0], [-(s.xl || 0), s.hL], [s.w * s.apex, s.hTop]], R = [[s.w, s.br || 0], [s.w + (s.xr || 0), s.hR], [s.w * s.apex, s.hTop]];
  const chain = (c, j) => { const k = j <= js ? 0 : 1, t = k ? (j - js) / (nv - js) : j / js; return [c[k][0] + (c[k + 1][0] - c[k][0]) * t, c[k][1] + (c[k + 1][1] - c[k][1]) * t]; };
  const nvert = (nu + 1) * (nv + 1), v = new Float32Array(nvert * STR), O = s.O;
  let a0 = 1e9, a1 = -1e9, z0 = 1e9, z1 = -1e9, t0 = 1e9, t1 = -1e9;
  for (let j = 0; j <= nv; j++) {
    const l = chain(L, j), r = chain(R, j), ln = chain(L, Math.min(nv, j + 1)), lp = chain(L, Math.max(0, j - 1));
    for (let i = 0; i <= nu; i++) {
      const f = i / nu, a = l[0] + (r[0] - l[0]) * f, b = l[1] + (r[1] - l[1]) * f, o = (j * (nu + 1) + i) * STR;
      const x = O[0] + U.x * a + V.x * b, y = O[1] + U.y * a + V.y * b, z = O[2] + U.z * a + V.z * b;
      v[o] = x; v[o + 1] = y; v[o + 2] = z; v[o + 3] = i / 2; v[o + 4] = j / 2; v[o + 5] = (i & 1) && (j & 1) ? 1 : 0;
      v[o + 6] = a; v[o + 7] = b; v[o + 8] = Math.max(0.3, (r[0] - l[0]) * 2 / nu); v[o + 9] = Math.max(0.3, ln[1] - lp[1]);
      v[o + 10] = z; v[o + 11] = STREET.T(side, x, y, z);
      a0 = Math.min(a0, a); a1 = Math.max(a1, a); z0 = Math.min(z0, z); z1 = Math.max(z1, z); t0 = Math.min(t0, v[o + 11]); t1 = Math.max(t1, v[o + 11]);
    }
  }
  const tri = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const n00 = j * (nu + 1) + i, n10 = n00 + 1, n01 = n00 + nu + 1, n11 = n01 + 1;
    if ((i + j) & 1) { tri.push(n00, n10, n01); if (j < nv - 1) tri.push(n10, n11, n01); }      // diagonals alternate so each bay bellies as a pyramid
    else { if (j < nv - 1) tri.push(n00, n11, n01); tri.push(n00, n10, n11); }
  }
  const outline = [L[0], R[0], R[1], L[2], L[1]];
  return { v, tri, n: N, U, V, O, side, phase: s.phase || 0, rock: s.rock || 0, loose: s.loose || 0, step: s.step || 0, code: (nu / 2) * 16 + nv / 2,
    w: s.w, hTop: s.hTop, hL: s.hL, hR: s.hR, apex: s.apex, outline, bbAB: [a0, 0, a1, s.hTop], bbZT: [z0, t0, z1, t1],
    at(a, b, out = new THREE.Vector3()) { return out.set(O[0] + U.x * a + V.x * b, O[1] + U.y * a + V.y * b, O[2] + U.z * a + V.z * b); } };
}
export function emitSkin(buf, p) {
  const base = buf.n, nvert = p.v.length / STR;
  for (let i = 0; i < nvert; i++) buf.vert(p, p.v, i * STR);
  for (let k = 0; k < p.tri.length; k += 3) buf.tri(base + p.tri[k], base + p.tri[k + 1], base + p.tri[k + 2]);
}

// PAINT ON CLOTH. shape = { space: 'zt' (course z and unfolded T, crosses floor and walls) | 'ab' (metres in one panel's plane),
// pts: convex polygon of 3 or 4 points, g: pigment, dir: [x, y] pull direction in that space (default: the longest edge), seed }.
// The polygon is clipped to every grid triangle of every panel it crosses, so it lies exactly on the bellied skin; each vertex carries
// its distance to the shape's true edges (not to the clip edges), which is where the fragment shader cuts the dry-brush teeth.
const _D = new Float32Array(12), _pa = new Float32Array(64), _pb = new Float32Array(64);
export function paintOnto(buf, panels, shape) {
  if (!buf) return 0;                                                     // a mark drawn from the seed but not laid (the walls are kept quiet between the big shapes)
  let pts = shape.pts; const n = pts.length, ox = shape.space === 'zt' ? 10 : 6;
  let area = 0; for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; area += p[0] * q[1] - q[0] * p[1]; }
  if (Math.abs(area) < 1e-4) return 0; if (area < 0) pts = pts.slice().reverse();
  const E = []; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, best = 0, dir = shape.dir;
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n], dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy) || 1e-6;
    E.push([-dy / len, dx / len, -(-dy / len * p[0] + dx / len * p[1])]);
    if (!shape.dir && len > best) { best = len; dir = [dx / len - 0.07 * dy / len, dy / len + 0.07 * dx / len]; }
    x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
  }
  const dl = Math.hypot(dir[0], dir[1]) || 1, dxn = dir[0] / dl, dyn = dir[1] / dl, g = shape.g, seed = shape.seed || 0, px = pts[0][0], py = pts[0][1];
  let made = 0;
  for (const p of panels) {
    const bb = shape.space === 'zt' ? p.bbZT : p.bbAB; if (bb[0] > x1 || bb[2] < x0 || bb[1] > y1 || bb[3] < y0) continue;
    const v = p.v, tri = p.tri;
    for (let t = 0; t < tri.length; t += 3) {
      const o0 = tri[t] * STR, o1 = tri[t + 1] * STR, o2 = tri[t + 2] * STR, os = [o0, o1, o2];
      let out = false, all = true;
      for (let e = 0; e < 4; e++) {
        if (e >= n) { _D[e] = _D[4 + e] = _D[8 + e] = 1e3; continue; }
        const d0 = E[e][0] * v[o0 + ox] + E[e][1] * v[o0 + ox + 1] + E[e][2], d1 = E[e][0] * v[o1 + ox] + E[e][1] * v[o1 + ox + 1] + E[e][2], d2 = E[e][0] * v[o2 + ox] + E[e][1] * v[o2 + ox + 1] + E[e][2];
        _D[e] = d0; _D[4 + e] = d1; _D[8 + e] = d2;
        if (d0 < 0 && d1 < 0 && d2 < 0) { out = true; break; } if (d0 < 0 || d1 < 0 || d2 < 0) all = false;
      }
      if (out) continue;
      // clip the triangle, in barycentric coordinates, by each edge of the shape
      let A = _pa, B = _pb, m = 3; A[0] = 1; A[1] = 0; A[2] = 0; A[3] = 0; A[4] = 1; A[5] = 0; A[6] = 0; A[7] = 0; A[8] = 1;
      if (!all) for (let e = 0; e < n && m > 2; e++) {
        let k = 0;
        for (let i = 0; i < m; i++) {
          const j = (i + 1) % m, i3 = i * 3, j3 = j * 3;
          const di = A[i3] * _D[e] + A[i3 + 1] * _D[4 + e] + A[i3 + 2] * _D[8 + e], dj = A[j3] * _D[e] + A[j3 + 1] * _D[4 + e] + A[j3 + 2] * _D[8 + e];
          if (di >= 0) { B[k * 3] = A[i3]; B[k * 3 + 1] = A[i3 + 1]; B[k * 3 + 2] = A[i3 + 2]; k++; }
          if ((di >= 0) !== (dj >= 0)) { const f = di / (di - dj); B[k * 3] = A[i3] + (A[j3] - A[i3]) * f; B[k * 3 + 1] = A[i3 + 1] + (A[j3 + 1] - A[i3 + 1]) * f; B[k * 3 + 2] = A[i3 + 2] + (A[j3 + 2] - A[i3 + 2]) * f; k++; }
        }
        m = k; const sw = A; A = B; B = sw;
      }
      if (m < 3) continue;
      const base = buf.n;
      for (let i = 0; i < m; i++) {
        const b0 = A[i * 3], b1 = A[i * 3 + 1], b2 = A[i * 3 + 2], vi = buf.vert(p, v, o0, b0, o1, b1, o2, b2);
        for (let e = 0; e < 4; e++) buf.edge[vi * 4 + e] = b0 * _D[e] + b1 * _D[4 + e] + b2 * _D[8 + e];
        const qx = b0 * v[o0 + ox] + b1 * v[o1 + ox] + b2 * v[o2 + ox] - px, qy = b0 * v[o0 + ox + 1] + b1 * v[o1 + ox + 1] + b2 * v[o2 + ox + 1] - py;
        buf.stroke[vi * 4] = qx * dxn + qy * dyn; buf.stroke[vi * 4 + 1] = -qx * dyn + qy * dxn; buf.stroke[vi * 4 + 2] = g; buf.stroke[vi * 4 + 3] = seed;
      }
      for (let i = 1; i < m - 1; i++) buf.tri(base, base + i, base + i + 1);
      made += m - 2;
    }
  }
  return made;
}

// ---------- layout of the hero canyon (course z 150..524) ----------
const DOOR = { z: 410, sill: 22, hd: 16, hu: 8, hw: 7, lean: 0.1, z0: 399, z1: 423, yaw: 0.55, w: 28.5 };   // the cut kite door on the port wall

async function layoutWalls(rng, V, Y) {
  const panels = [], tall = [];
  for (const side of [-1, 1]) for (const layer of [1, 0]) {
    let z = 150 + rng.range(0, 5), zig = rng.sign();
    while (z < 523) {
      if (side < 0 && z > DOOR.z0 - 5 && z < DOOR.z1) {                    // the door flat: one big house front turned to face down the street
        if (layer === 1) {
          const zf = DOOR.z1, x = -(STREET.hw(zf) + STREET.bay(zf));
          const p = makePanel({ O: [x, STREET.floorY(x, zf) - 1.6, zf], side, yaw: DOOR.yaw, lean: DOOR.lean, roll: -0.09, w: DOOR.w, hL: 39, hR: 45, hTop: 57, apex: 0.3, xl: 1.2, xr: 0.6, br: 1.0, nu: 8, nv: 14, phase: rng() });
          p.layer = 1; p.door = true; p.k = 0.7; panels.push(p);
        }
        z = DOOR.z1 + 0.3; continue;
      }
      const k = STREET.hw(z) / 13, ks = Math.max(0.16, k), H = STREET.flatH(z) * (z > 420 ? 1 : 1), far = z > 436;
      const w = rng.range(8.5, 14.5) * Math.pow(ks, z > 436 ? 0.45 : 0.75) * (layer ? 1.15 : 1);
      const calm = z > (side < 0 ? 285 : 325) && z < 432;                                      // where the camera climbs the port wall the tall flats lean less
      const lean = (layer ? (calm ? rng.range(0.085, 0.1) : rng.range(0.12, 0.2)) : rng.range(0.09, 0.15)) * (z > 205 && z < 440 ? 0.5 : 1);   // (the canyon stands open from z 205: the great tower at its end is seen whole between the walls)
      zig = -zig; const inBay = side < 0 && z > 316 && z < 400; const yaw = zig * rng.range(0.09, layer ? 0.2 : 0.3) * (calm && side < 0 ? 0.4 : 1) + (inBay ? 0.42 : 0);
      // before the door flat the street opens: the starboard wall drops to low houses (the roofs beyond stand over them) and the low flats under the kite stay under its sill
      const lowK = (side > 0 && z > 336 && z < 436 ? 0.42 : side < 0 && z > 346 && z < 404 ? 0.45 : 1) * (z > 436 ? 0.62 : pl(z, [[196, 1], [236, 0.7], [336, 0.7], [337, 1]]));
      const hTop = H * lowK * (layer ? rng.range(0.78, 1.04) : rng.range(0.3, 0.56));
      const knife = rng.range(0.16, 0.34) * hTop, tilt = rng.range(0.12, 0.3) * rng.sign();
      const hL = hTop - knife * (1 + tilt), hR = hTop - knife * (1 - tilt);
      const set = layer ? rng.range(1.6, 3.6) * ks : rng.range(-0.3, 0.5);
      const x = side * (STREET.hw(z) + set + (side < 0 ? Math.max(0, STREET.bay(z + (inBay ? w : 0))) : 0)), zO = side > 0 ? z : z + w * Math.cos(yaw);
      const roll = rng.sign() * rng.range(0.09, 0.16) * (calm && layer ? 0.7 : 1);
      const lane = side < 0 && layer === 1 && z > 424 && z < 506;
      const nu = lane ? 2 * Math.max(1, Math.round(w / 2.6)) : far ? 2 : 2 * Math.max(1, Math.round(w / 4.2)), nv = lane ? 2 * Math.max(2, Math.min(7, Math.round(hTop / 5))) : far ? 4 : 2 * Math.max(2, Math.min(7, Math.round(hTop / 9)));
      const br = rng.range(-0.5, 0.5), gap = Math.max(0, w * Math.sin(roll) + br - side * w * 0.0577);   // sink the foot so no corner hangs over the floor
      const sunk = V.gaps.some((q) => q[0] === side && z + w * 0.5 > q[1] && z + w * 0.5 < q[2]) ? 400 : 0;   // opts.gaps [[side, z0, z1]...]: flats drawn from the seed but stood out of sight (the world opens the wall there: its tower at the mouth, a side lane)
      const p = makePanel({ O: [x, STREET.floorY(x, zO) - 0.5 - 0.4 * ks - gap - sunk, zO], side, yaw, lean, roll, w, hL, hR, hTop, apex: rng.chance(0.5) ? rng.range(0.06, 0.3) : rng.range(0.7, 0.94),
        xl: rng.range(-0.3, 1.4) * ks, xr: rng.range(-0.3, 1.4) * ks, br, nu, nv, step: far ? 1 : 0, phase: rng() });
      p.layer = layer; p.k = ks; p.zmid = z + w * 0.5; p.lane = lane; panels.push(p); if (layer && !far && z > 175 && z < 395 && !sunk) tall.push(p);
      if (panels.length % 16 === 15) await Y();
      z += w * Math.cos(yaw) + rng.range(-0.8, 1.3) * ks;
    }
  }
  // the painted backdrop that closes the street at z 520, and its two wings
  const bd = makePanel({ O: [5.5, STREET.rise(521) - 1, 521.5], side: 1, yaw: -Math.PI / 2 + 0.12, lean: 0.07, roll: -0.1, w: 11, hL: 15, hR: 19, hTop: 24, apex: 0.72, nu: 4, nv: 6, step: 1, phase: rng() });
  bd.layer = 2; bd.k = 0.2; bd.backdrop = true; panels.push(bd);
  // six tallest gables rock one degree; the tallest starboard one is the flat that may come loose
  tall.sort((a, b) => b.hTop - a.hTop);
  let loose = null;
  for (let i = 0, n = 0; i < tall.length && n < 6; i++) { const p = tall[i]; if (p.door) continue; if (!loose && p.side > 0 && V.loose) { loose = p; continue; } p.rock = 1; n++; }
  if (loose) loose.loose = 1;
  return { panels, loose };
}

// The floor cloth as panels the paint can be clipped to: widths of 6 m laid across the street, seams every 6 m of z, puckers on the seams.
export function floorPanels(zA = 150, zB = 528) {
  const out = [], dz = 3, cols = 8, rowsPer = 10, n = { x: 0, y: 1, z: 0 };
  for (let zs = zA; zs < zB; zs += dz * rowsPer) {
    const rows = Math.min(rowsPer, Math.round((zB - zs) / dz)), v = new Float32Array((rows + 1) * (cols + 1) * STR), tri = [];
    let t0 = 1e9, t1 = -1e9;
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
      const z = zs + j * dz, half = STREET.hw(z) + 4.5, left = -half - Math.max(0, STREET.bay(z)), x = left + (half - left) * i / cols, o = (j * (cols + 1) + i) * STR, seam = Math.abs(z / 6 - Math.round(z / 6)) < 0.01;
      v[o] = x; v[o + 1] = STREET.floorY(x, z); v[o + 2] = z; v[o + 3] = z / 6; v[o + 4] = x / 6;
      v[o + 5] = seam && (i & 1) ? 0.5 + 0.5 * h1(z * 7.7 + i * 3.1) : (!seam && !(i & 1) ? 0.3 * h1(z * 3.3 + i * 5.9) : 0);
      v[o + 6] = z; v[o + 7] = x; v[o + 8] = 6; v[o + 9] = 6; v[o + 10] = z; v[o + 11] = x; t0 = Math.min(t0, x); t1 = Math.max(t1, x);
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1;       // (z, x) -> winding so the front faces up
      if ((i + j) & 1) tri.push(a, c, b, b, c, d); else tri.push(a, d, b, a, c, d);
    }
    out.push({ v, tri, n, side: 0, phase: h1(zs * 0.37), rock: 0, loose: 0, step: 0, code: 0, floor: true, bbZT: [zs, t0, zs + rows * dz, t1], bbAB: [0, 0, 0, 0] });
  }
  return out;
}
const h1 = (x) => { const s = Math.sin(x * 12.9898) * 43758.5453; return s - Math.floor(s); };
// a small seeded stream of our own (mulberry32) with the kit rng's helpers, for marks added without disturbing ctx.rng's order
export function ownRng(seed) { let a = seed >>> 0; const r = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.range = (lo, hi) => lo + (hi - lo) * r(); r.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * r()); r.pick = (arr) => arr[Math.floor(r() * arr.length)]; r.chance = (p) => r() < p; r.sign = () => (r() < 0.5 ? -1 : 1); return r; }

// the reel: which dye lies over everything at progress u. Always through bare chalk, never two dyes in one frame.
// 'roofs': amber, then blue-green from the tower's face (u 0.665) on; 'rose': the square behind the wall is rose between the two; 'long': amber to the last ridge (0.86).
export function dyeAt(u, reel = 'roofs', pal = PALETTE, out = new THREE.Vector3()) {
  const amber = srgbC(pal[3]), chalk = srgbC(pal[2]), end = srgbC(pal[4]), rose = srgbC(pal[5]);
  const at = reel === 'long' ? 0.86 : 0.665, ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  out.copy(amber);
  if (reel === 'rose') out.lerp(chalk, ss(0.478, 0.49, u)).lerp(rose, ss(0.49, 0.502, u));   // the cut comes as we go through the black kite (u 0.49): the square behind the wall is rose
  return out.lerp(chalk, ss(at - 0.014, at, u)).lerp(end, ss(at, at + 0.014, u));
}

export async function buildHero(ctx, opts = {}) {
  const Y = async () => { await ctx.yield(); };                           // every pause of the build goes through here
  let rng = ctx.rng; const pal = opts.palette || PALETTE, detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const xr = ownRng(((ctx.seed | 0) || 1) * 7919 + 17), mainRng = rng;       // marks added later draw from here, never from ctx.rng
  STYLE.uniforms = makeUniforms();                                        // this build's own set; materials made from now on (here and by the world, straight after) use it
  const U = STYLE.uniforms; U.uInk.value.copy(srgb(pal[0])); U.uDye.value.copy(srgb(pal[3]));
  // ---- the seed's choices (drawn first, in a fixed order) ----
  const V = {
    cut: opts.windowCut || rng.pick(['kite', 'kite', 'rhomb', 'splinter']),
    broad: opts.broadShafts ?? rng.chance(0.5),
    gusts: opts.gusts ?? rng.pick([3, 3, 3, 0, 5]),
    loose: opts.loose ?? rng.chance(0.15),
    figures: opts.figures ?? rng.chance(0.8), gaps: opts.gaps || [],
    density: opts.density ?? rng.range(0.8, 1.15),
    reel: opts.reel || 'roofs',
  };
  const object = new THREE.Group(); object.name = 'painted-shadow-town-hero';
  const street = new THREE.Group(); street.rotation.y = Math.PI; street.position.set(0, 0, STREET.zc); object.add(street);   // course coords inside, front toward +Z outside
  const matCanvas = canvasMaterial({ seam: 1.83, tacks: 0, cut: 1 }), matFloor = canvasMaterial({ seam: 6, tacks: 1, cut: 0, side: THREE.FrontSide });
  const matPaint = paintMaterial({ cut: 1 }), matBoard = boardMaterial(), matRibbon = ribbonMaterial();

  // ---- flats and floor ----
  const { panels, loose } = await layoutWalls(rng, V, Y);
  await Y(0);
  const floors = floorPanels(150, 528), all = panels.concat(floors);
  await Y(1);
  const skin = new Buf(false, 16384), floorBuf = new Buf(false, 2048);
  for (let i = 0; i < panels.length; i++) { emitSkin(skin, panels[i]); if (i % 16 === 15) await Y(2); }
  for (const f of floors) emitSkin(floorBuf, f);
  const skinMesh = new THREE.Mesh(skin.geometry(), matCanvas); skinMesh.frustumCulled = false; street.add(skinMesh);
  const floorMesh = new THREE.Mesh(floorBuf.geometry(), matFloor); floorMesh.frustumCulled = false; street.add(floorMesh);
  await Y(3);

  // ---- the big painted shapes, authored along the street in (z, T) ----
  const paint = new Buf(true, 98304), shapes = [];                         // sized so it never has to grow (growing copies everything in one step)
  const quad = (z0, T0, z1, T1, w0, w1, g, seed) => {                      // a pull from (z0,T0) to (z1,T1), w0 wide at the start, w1 at the end
    const dx = z1 - z0, dy = T1 - T0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    return { space: 'zt', g, seed, dir: [dx / l, dy / l], pts: [[z0 - nx * w0 / 2, T0 - ny * w0 / 2], [z1 - nx * w1 / 2, T1 - ny * w1 / 2], [z1 + nx * w1 / 2, T1 + ny * w1 / 2], [z0 + nx * w0 / 2, T0 + ny * w0 / 2]] };
  };
  let road0 = null;                                                      // where the chalk road starts (z, T), for the world's lower street to meet
  { // the chalk road, 5 m wide, zigzagging wall to wall and a little way up each wall
    let z = 146 + rng.range(0, 8), sgn = rng.sign(), T = sgn * (STREET.hw(z) + 1.5);
    road0 = [z, T];
    while (z < 512) {
      const k = Math.max(0.2, STREET.hw(z) / 13), z1 = z + rng.range(30, 44) * k, T1 = -sgn * (STREET.hw(z1) + rng.range(0.8, 2.6) * k);
      const ex = 0.06; shapes.push(quad(z - (z1 - z) * ex, T - (T1 - T) * ex, z1 + (z1 - z) * ex, T1 + (T1 - T) * ex, 5 * k, 5 * Math.max(0.2, STREET.hw(z1) / 13), 1, shapes.length * 7.3 + 1));
      z = z1; T = T1; sgn = -sgn;
    }
  }
  { // chalk shafts: few and broad, or many and narrow; each crosses the road and climbs a wall, no two neighbours the same way
    const n = V.broad ? 6 : 11; let sgn = rng.sign(), slant = rng.sign();
    for (let i = 0; i < n; i++) {
      const z = 172 + (i + rng.range(0.1, 0.9)) * (300 / n), k = STREET.hw(z) / 13; sgn = -sgn; slant = rng.chance(0.75) ? -slant : slant;
      const side = (z > 268 && z < 425) ? 1 : sgn;                         // the port wall of the upper canyon belongs to the wedge
      const up = rng.range(18, 44), run = slant * rng.range(8, 34) * k, T0 = -side * rng.range(0.1, 0.7) * STREET.hw(z), T1 = side * (STREET.hw(z + run) + up);
      const w = V.broad ? rng.range(3.5, 6.5) : rng.range(1.4, 3), flip = rng.chance(0.5);
      shapes.push(quad(z, T0, z + run, T1, (flip ? 0.25 : 1) * w * k, (flip ? 1 : 0.25) * w * k, 1, 100 + i * 3.7));
    }
  }
  // the rare event's proof: one shaft brushed across the road and straight up the flat that will come loose, so the break shows
  if (loose) shapes.push(quad(loose.zmid - 8, -5, loose.zmid + 2, STREET.hw(loose.zmid) + 48, 4.4, 1.6, 1, 150.5));
  shapes.push(quad(295, 2.4, 317, STREET.hw(317) + 40, 5.4, 1.4, 1, 160.5), quad(354, 3.5, 344, STREET.hw(344) + 47, 1.1, 3.6, 1, 161.5));   // two shafts up the starboard wall beside the wedge, at every seed
  { // lesser black wedges with no source, kept clear of the hero wedge
    const spots = [[178, 226], [226, 268], [432, 462], [462, 500]];
    for (let i = 0; i < spots.length; i++) {
      const z = rng.range(spots[i][0], spots[i][1]), k = STREET.hw(z) / 13, side = rng.sign(), up = rng.range(16, 38) * Math.max(0.35, k), run = rng.sign() * rng.range(10, 26) * k;
      const s = quad(z, side * STREET.hw(z) * rng.range(-0.2, 0.5), z + run, side * (STREET.hw(z + run) + up), rng.range(4, 8) * k, 0.02, i < 2 ? 1 : 0, 200 + i * 5.1);   // (the two in the lower canyon are brushed in chalk: nothing black stands close beside the eye there)
      shapes.push(s);
    }
    // THE WEDGE: from a point on the starboard edge of the road at z 283, across the floor for 45 m, up the port wall to the kite
    const Tk = -(STREET.hw(DOOR.z) + STREET.bay(DOOR.z) + DOOR.sill + DOOR.hd), zt = 283 + rng.range(-3, 3), Tt = rng.range(7, 9.5), lz = DOOR.lean, o = 1.1;
    shapes.push({ space: 'zt', g: 0, seed: 300.5, pts: [[zt, Tt], [DOOR.z - lz * DOOR.hd + 1.5, Tk + DOOR.hd - 0.5], [DOOR.z - DOOR.hw + 0.4, Tk + 0.6]] });
    // the black kite it ends in, brushed a hand wider than the hole that is cut in it
    { const o2 = 2.7, sh = 0.5; shapes.push({ space: 'zt', g: 2, seed: 301.2, dir: [0.2, 1], pts: [[DOOR.z - lz * (DOOR.hd + o2) - sh, Tk + DOOR.hd + o2 * 1.5], [DOOR.z + DOOR.hw + o2 * 0.8, Tk + 0.6], [DOOR.z + lz * (DOOR.hu + o2), Tk - DOOR.hu - o2 * 1.2], [DOOR.z - DOOR.hw - o2 * 1.15, Tk + 0.4]] }); }
    shapes.push({ space: 'zt', g: 0, seed: 301.5, dir: [0.3, 1], pts: [[DOOR.z - lz * (DOOR.hd + o), Tk + DOOR.hd + o * 1.6], [DOOR.z + DOOR.hw + o, Tk], [DOOR.z + lz * (DOOR.hu + o), Tk - DOOR.hu - o * 1.4], [DOOR.z - DOOR.hw - o, Tk]] });
  }
  let paintTris = 0;
  for (let i = 0; i < shapes.length; i++) { paintTris += paintOnto(paint, all, shapes[i]); await Y(4); }
  U.uKite.value.set(DOOR.z, STREET.rise(DOOR.z) + DOOR.sill + DOOR.hd, DOOR.hw, DOOR.lean); U.uKite2.value.set(DOOR.hu, DOOR.hd, 0, 0);

  // ---- marks per flat: contour pulls, kite windows with crooked bars, fans, leaning painted doors ----
  let cv = paint, fq = false, laid = 0;                                    // cv: where a mark goes (null = drawn but not laid); fq: fans kept quiet
  const windows = [];                                                     // kept for anchors and for the world coder
  const rot = (x, y, cx, cy, a) => { const c = Math.cos(a), s = Math.sin(a); return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]; };
  const fan = (p, cx, cy, ang, len, g, seed, nmin = 3, nmax = 7) => {      // 3 to 7 tapering pulls splayed from one point, never parallel
    const n = rng.int(nmin, nmax), spread = rng.range(0.7, 1.5);
    for (let i = 0; i < n; i++) {
      const a = ang + (n > 1 ? (i / (n - 1) - 0.5) : 0) * spread + rng.range(-0.08, 0.08), l = len * rng.range(0.45, 1), w = l * rng.range(0.07, 0.13) + 0.12;
      const dx = Math.cos(a), dy = Math.sin(a);
      paintOnto(fq ? null : cv, [p], { space: 'ab', g, seed: seed + i * 1.7, dir: [dx, dy], pts: [[cx - dy * w / 2 - dx * 0.2, cy + dx * w / 2 - dy * 0.2], [cx + dy * w / 2 - dx * 0.2, cy - dx * w / 2 - dy * 0.2], [cx + dx * l, cy + dy * l]] });
    }
  };
  const litW = (seed, pr) => { const h = Math.sin(seed * 78.233 + 1.7) * 43758.5453; return (h - Math.floor(h)) < pr ? 2 : 1; };   // a lit window: its pane is chalk white (painted light), the rest take the dye
  const windowOn = (p, a, b, s, seed) => {
    const hw = rng.range(0.9, 1.5) * s, hu = (V.cut === 'rhomb' ? rng.range(1.5, 2.3) : rng.range(1.0, 1.8)) * s, hd = (V.cut === 'rhomb' ? hu / s : rng.range(2.0, 3.4)) * s, tilt = rng.sign() * rng.range(0.1, 0.38);
    const R = (x, y) => rot(a + x, b + y, a, b, tilt);
    const pts = V.cut === 'splinter' ? [R(-hw * rng.range(0.5, 1), -hd * 0.8), R(hw, -hd * rng.range(0.2, 0.7)), R(hw * rng.range(-0.6, 0.3), hu)] : [R(0, -hd), R(hw, 0), R(0, hu), R(-hw, 0)];
    paintOnto(cv, [p], { space: 'ab', g: litW(seed, 0.2), seed, dir: [Math.sin(tilt) * 0.3 + 0.2, 1], pts });
    const half = (y) => hw * Math.max(0, 1 - (y > 0 ? y / hu : -y / hd)), bw = (0.2 + 0.1 * rng()) * Math.max(0.6, s * 0.75);
    const bar = (x0, y0, x1, y1) => { const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * bw / 2, ny = dx / l * bw / 2;
      paintOnto(cv, [p], { space: 'ab', g: 0, seed: seed + x0, dir: [dx, dy], pts: [R(x0 - nx, y0 - ny), R(x1 - nx * 0.6, y1 - ny * 0.6), R(x1 + nx * 0.6, y1 + ny * 0.6), R(x0 + nx, y0 + ny)] }); };
    if (V.cut !== 'splinter') {
      const o1 = rng.range(-0.3, 0.3) * hw, o2 = rng.range(-0.3, 0.3) * hw; bar(o1, -hd * (1 - Math.abs(o1) / hw) * 0.96, o2, hu * (1 - Math.abs(o2) / hw) * 0.96);
      if (rng.chance(0.65)) { const y1 = rng.range(-0.3, 0.1) * hd, y2 = rng.range(-0.1, 0.35) * hu; bar(-half(y1) * 0.97, y1, half(y2) * 0.97, y2); }
    } else bar(-hw * 0.2, -hd * 0.6, hw * 0.25, hu * 0.6);
    if (rng() < 0.5 * detail) { const c = rng.pick([R(0, -hd), R(hw, 0), R(-hw, 0)]); fan(p, c[0], c[1], Math.atan2(c[1] - b, c[0] - a + 1e-3) + rng.range(-0.5, 0.5), rng.range(2.2, 5) * s, rng.chance(0.8) ? 0 : 1, seed + 40); }
    windows.push({ panel: p, a, b, s });
  };
  for (let i = 0; i < panels.length; i++) {
    cv = paint; fq = false; laid = 0;
    const p = panels[i], k = p.k || 1, cap = p.layer ? 2 : 1, upper = p.zmid > 262 && p.zmid < 436, s = (1.3 * Math.pow(k, 1.5) + 0.12) * (upper ? 1.5 : 1.15), seed = 400 + i * 13.1;
    if (i & 1) await Y(5);
    // contour pulls along the gable knives and one side, their outer edge off the cloth so the flat's own edge cuts them clean
    const ol = p.outline, cw = (0.26 + 0.3 * rng()) * Math.max(0.45, k);
    for (const [e0, e1] of [[2, 3], [3, 4], rng.chance(0.5) ? [4, 0] : [1, 2]]) {
      const P = ol[e0], Q = ol[e1], dx = Q[0] - P[0], dy = Q[1] - P[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, nx = -uy, ny = ux, w1 = cw * rng.range(0.7, 1.5), w2 = cw * rng.range(0.5, 1.8);
      paintOnto(cv, [p], { space: 'ab', g: 0, seed: seed + e0, dir: [ux, uy], pts: [[P[0] - ux - nx * 0.4, P[1] - uy - ny * 0.4], [Q[0] + ux - nx * 0.4, Q[1] + uy - ny * 0.4], [Q[0] + ux * 0.3 + nx * w2, Q[1] + uy * 0.3 + ny * w2], [P[0] - ux * 0.3 + nx * w1, P[1] - uy * 0.3 + ny * w1]] });
    }
    if (p.backdrop) {                                                      // the painted end of the street: a road tip, a kite, splinters
      paintOnto(cv, [p], { space: 'ab', g: 1, seed, pts: [[3.6, 0], [7.2, 0], [5.9, 9.5]] });
      paintOnto(cv, [p], { space: 'ab', g: 0, seed: seed + 1, pts: [[5.2, 10.4], [6.3, 12.4], [5.6, 15.5], [4.7, 12.6]] });
      fan(p, 0.5, 0.5, 1.2, 14, 0, seed + 2, 3, 4); fan(p, 10.5, 1, 1.9, 13, 0, seed + 3, 3, 4); continue;
    }
    if (p.door) { fq = true; windowOn(p, 6.2, 16, 1.5, seed + 5); windowOn(p, 25.5, 30, 1.35, seed + 6); windowOn(p, 26, 11, 1.2, seed + 7); windowOn(p, 4.6, 39, 1.0, seed + 8); continue; }
    if (p.layer === 1 && !p.step && rng.chance(0.42)) {                     // light brushed on a gable: chalk under the knife edge
      const lf = rng.chance(0.5), sh = ol[lf ? 4 : 2], ap = ol[3], dn = rng.range(0.25, 0.6);
      paintOnto(cv, [p], { space: 'ab', g: 1, seed: seed + 50, pts: [[ap[0], ap[1] + 1], [sh[0] + (lf ? -1 : 1), sh[1]], [sh[0] + (lf ? 1 : -1) * p.w * rng.range(0.25, 0.6), sh[1] - p.hTop * dn * rng.range(0.4, 1)], [ap[0] + (lf ? 1 : -1) * p.w * rng.range(0.05, 0.3), ap[1] - p.hTop * dn * 0.35]] });
    }
    const body = Math.min(p.hL, p.hR), nw = Math.max(1, Math.round((p.layer ? rng.range(2.6, 5.4) : rng.range(1, 2.6)) * V.density * (k < 0.5 ? 0.6 : 1)));
    let a = p.w * rng.range(0.3, 0.7), drift = rng.sign();
    for (let j = 0; j < nw; j++) {
      const b = body * (p.layer ? 0.22 + 0.7 * (j + rng.range(0.2, 0.8)) / nw : 0.4 + 0.5 * (j + rng.range(0.2, 0.8)) / nw);
      a += drift * rng.range(0.1, 0.3) * p.w; if (a < p.w * 0.2 || a > p.w * 0.8) { drift = -drift; a = Math.min(p.w * 0.78, Math.max(p.w * 0.22, a)); }
      cv = laid < cap ? paint : null; fq = i % 3 !== 0; if (cv) laid++;                       // two barred windows to a tall flat, one to a low one: quiet grey between
      windowOn(p, a, b, s * rng.range(0.75, 1.2), seed + 10 + j * 3.3);
    }
    cv = paint; fq = false;
    if (!p.layer && rng.chance(0.6)) {                                     // a tall leaning door, painted, with a fan at its foot
      const dw = rng.range(2, 3) * s, dh = rng.range(5, 7.5) * s, a0 = p.w * rng.range(0.12, 0.7), sk = rng.sign() * rng.range(0.12, 0.3) * dh, y0 = 1.2 + Math.max(0, p.w * Math.sin(0.16));
      if (p.side > 0 && p.zmid > 256 && p.zmid < 310) cv = null;                          // (no black door on the flats we pass at arm's length over the wedge: drawn, not laid)
      paintOnto(cv, [p], { space: 'ab', g: 0, seed: seed + 30, dir: [sk, dh], pts: [[a0, y0 - 2], [a0 + dw, y0 - 2], [a0 + dw + sk, y0 + dh * rng.range(0.75, 0.95)], [a0 + sk - 0.2 * s, y0 + dh]] });
      cv = paint;
      fan(p, a0 + dw * 0.5, y0 + 0.3, Math.PI / 2 - Math.sign(sk) * rng.range(0.5, 1.1), rng.range(3, 6) * s, 1, seed + 31, 3, 5);
    } else if (rng() < 0.6 * detail) { fq = (i & 1) === 1; fan(p, p.w * rng.range(0.1, 0.9), rng.range(1, 4), Math.PI / 2 + rng.range(-0.7, 0.7), rng.range(4, 9) * Math.max(0.4, k), rng.chance(0.7) ? 0 : 1, seed + 32); fq = false; }
    if (!p.step) {                                                         // no bare slab at any seed: a second rank of barred windows and a fan, out of line with the first
      rng = xr; const more = Math.max(0, (p.layer ? 4 : 2) - nw) + (upper ? (p.layer ? 3 : 1) : 0), col = a < p.w * 0.5 ? 0.74 : 0.26;
      for (let j = 0; j < more; j++) { cv = laid < cap ? paint : null; fq = true; if (cv) laid++; windowOn(p, p.w * (col + xr.range(-0.12, 0.12)), body * (p.layer ? 0.1 + 0.82 * (j + xr.range(0.25, 0.75)) / more : 0.3 + 0.6 * (j + xr.range(0.25, 0.75)) / more), s * xr.range(0.8, 1.2), seed + 70 + j * 3.3); }
      cv = paint; fq = true;
      if (upper && xr.chance(0.7)) fan(p, p.w * xr.range(0.1, 0.9), body * xr.range(0.1, 0.8), xr.range(0, 6.283), xr.range(4, 9) * Math.max(0.5, k), xr.chance(0.6) ? 0 : 1, seed + 90);
      fq = false; rng = mainRng; }
  }
  const paintMesh = new THREE.Mesh(paint.geometry(), matPaint); paintMesh.frustumCulled = false; paintMesh.renderOrder = 2; street.add(paintMesh);
  await Y(6);

  const onProgress = [], onFrame = [];
  const hero_parts = {};
  // boards: every solid prop of the set goes into one merged buffer (position + aG), drawn with boardMaterial
  const bp = [], bg = [], bi = [];
  const bvert = (x, y, z, g) => { bp.push(x, y, z); bg.push(g); return bg.length - 1; };
  const bquad = (a, b, c, d, g) => { const i = bvert(a.x, a.y, a.z, g); bvert(b.x, b.y, b.z, g); bvert(c.x, c.y, c.z, g); bvert(d.x, d.y, d.z, g); bi.push(i, i + 1, i + 2, i, i + 2, i + 3); };
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _w = new THREE.Vector3(), _d = new THREE.Vector3(), cs = [];
  for (let i = 0; i < 8; i++) cs.push(new THREE.Vector3());
  // a board from A to B: w wide along W, t deep along D (unit vectors), one pigment, or `ge` on its +W edge (the chalk edge on the wrong side)
  const board = (A, B, W, D, w, t, g, ge = g) => {
    for (let i = 0; i < 8; i++) cs[i].copy(i & 4 ? B : A).addScaledVector(W, (i & 1 ? 0.5 : -0.5) * w).addScaledVector(D, (i & 2 ? 0.5 : -0.5) * t);
    bquad(cs[0], cs[1], cs[5], cs[4], g); bquad(cs[2], cs[6], cs[7], cs[3], g); bquad(cs[0], cs[4], cs[6], cs[2], g); bquad(cs[1], cs[3], cs[7], cs[5], ge); bquad(cs[0], cs[2], cs[3], cs[1], g); bquad(cs[4], cs[5], cs[7], cs[6], g);
  };
  const kiteAt = (z, y) => { const dy = y - U.uKite.value.y, dz = z - DOOR.z - DOOR.lean * dy; return Math.abs(dz) / DOOR.hw + (dy > 0 ? dy / DOOR.hu : -dy / DOOR.hd) - 1; };

  // (A) the black behind the kite: seen from the street the hole is the blackest paint; from behind it is not there (front side only)
  const doorP = panels.find((p) => p.door);
  const abOf = (p, z, y) => { const yy = y - p.O[1], zz = z - p.O[2], det = p.U.y * p.V.z - p.U.z * p.V.y; return [(yy * p.V.z - zz * p.V.y) / det, (p.U.y * zz - p.U.z * yy) / det]; };
  const kab = abOf(doorP, DOOR.z, U.uKite.value.y), kiteP = doorP.at(kab[0], kab[1]);
  { const g0 = [], m0 = [], q = new THREE.Vector3();                      // a kite a fifth larger than the hole, a hand behind the cloth
    for (const [dz, dy] of [[0, -DOOR.hd], [DOOR.hw, 0], [0, DOOR.hu], [-DOOR.hw, 0]]) { const ab = abOf(doorP, DOOR.z + dz * 1.22 + DOOR.lean * dy * 1.22, U.uKite.value.y + dy * 1.22); doorP.at(ab[0], ab[1], q).addScaledVector(doorP.n, -0.3); g0.push(q.x, q.y, q.z); m0.push(ab[0], ab[1]); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(g0, 3)); geo.setAttribute('aMet', new THREE.Float32BufferAttribute(m0, 2)); geo.setIndex([0, 2, 1, 0, 3, 2]);
    const veil = new THREE.Mesh(geo, new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: shared({ uOpen: { value: 0 } }),
      vertexShader: STYLE_GLSL + `attribute vec2 aMet; varying vec2 vM; void main(){ vM = aMet; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: STYLE_GLSL + `uniform float uOpen; varying vec2 vM;
        void main(){ if (!gl_FrontFacing) discard;                           // from behind it is not there
          vec2 r = vec2(vM.x * 0.94 + vM.y * 0.34, -vM.x * 0.34 + vM.y * 0.94);
          float n = 0.6 * vnoise(vec2(r.x * 0.22, r.y * 5.)) + 0.4 * vnoise(vec2(r.x * 0.7 + 3., r.y * 21.));
          if (n < uOpen * 1.08 - 0.04) discard;                              // the black dries off in bristle streaks as we come up to it
          gl_FragColor = vec4(distemper(0.), 1.); }` }));
    veil.frustumCulled = false; veil.name = 'kiteBlack'; street.add(veil); hero_parts.veil = veil; }

  // (B) the 10 cm edge of every flat, and (C) real lath, frame and braces behind the flats the back lane passes
  const lathOn = (p, real) => {
    const o = p.outline, N = p.n, at = (q, back, out) => p.at(q[0], q[1], out).addScaledVector(N, -back);
    if (!p.rock && !p.loose) for (let e = 0; e < 5; e++) { const P = o[e], Q = o[(e + 1) % 5]; bquad(at(P, 0, cs[0]), at(Q, 0, cs[1]), at(Q, 0.1, cs[2]), at(P, 0.1, cs[3]), p.step ? 0.6 : 0.2); }
    if (!real) return;
    const seg = (P, Q, w, g, back = 0.05) => {                              // a lath in the panel plane, broken where the kite is cut
      const len = Math.hypot(Q[0] - P[0], Q[1] - P[1]), n = Math.max(1, Math.ceil(len / 1.5)); let start = null;
      _d.set(0, 0, 0).addScaledVector(p.U, (Q[0] - P[0]) / len).addScaledVector(p.V, (Q[1] - P[1]) / len); _w.crossVectors(_d, N);
      for (let i = 0; i <= n; i++) {
        const t = i / n, q = [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]; at(q, back, _b);
        const open = p.door && kiteAt(_b.z, _b.y) < 0.1;
        if (!open && start === null) start = q; if ((open || i === n) && start !== null) { const endq = open ? [P[0] + (Q[0] - P[0]) * (i - 1) / n, P[1] + (Q[1] - P[1]) * (i - 1) / n] : q;
          if (endq !== start && Math.hypot(endq[0] - start[0], endq[1] - start[1]) > 0.3) board(at(start, back, _a).clone(), at(endq, back, _b).clone(), _w, N, w, 0.07, g); start = null; }
      }
    };
    for (let e = 0; e < 5; e++) seg(o[e], o[(e + 1) % 5], 0.42, G.lath);
    const nb = Math.floor(p.code / 16), nvb = p.code % 16, node = (i, j) => { const k = (j * (nb * 2 + 1) + i) * STR; return [p.v[k + 6], p.v[k + 7]]; };
    for (let i = 1; i < nb; i++) for (let j = 0; j < nvb; j++) seg(node(i * 2, j * 2), node(i * 2, j * 2 + 2), 0.3, G.lath);
    for (let j = 1; j < nvb; j++) seg(node(0, j * 2), node(nb * 2, j * 2), 0.3, G.lath, 0.09);
    seg(node(0, 0), node(nb * 2, Math.min(nvb * 2, 4)), 0.3, 0.22, 0.13);
    // a raking brace from the back of the flat down to the lane floor
    for (const [fa, fb, outB, sl] of [[0.5, 0.45, 9, 0], [0.16, 0.27, 6, -2.2]]) {
      const top = p.at(p.w * fa, Math.min(p.hL, p.hR) * fb).addScaledVector(N, -0.15), foot = top.clone().addScaledVector(N, -outB).addScaledVector(p.U, sl); foot.y = STREET.rise(foot.z) - 0.5;
      _d.subVectors(foot, top).normalize(); _w.crossVectors(_d, p.U).normalize(); board(top, foot, p.U, _w, 0.5, 0.26, 0.14); if (!p.door) break; }
    if (p.door) { const kc = [[0, -DOOR.hd], [DOOR.hw, 0], [0, DOOR.hu], [-DOOR.hw, 0]].map(([dz, dy]) => abOf(p, DOOR.z + dz * 1.07 + DOOR.lean * dy, U.uKite.value.y + dy * 1.07));
      for (let e = 0; e < 4; e++) { const P = kc[e], Q = kc[(e + 1) % 4], len = Math.hypot(Q[0] - P[0], Q[1] - P[1]); _d.set(0, 0, 0).addScaledVector(p.U, (Q[0] - P[0]) / len).addScaledVector(p.V, (Q[1] - P[1]) / len); _w.crossVectors(_d, N); board(at(P, 0.06, _a).clone(), at(Q, 0.06, _b).clone(), _w, N, 0.18, 0.1, 0.22); } }
  };
  let nReal = 0;
  for (let i = 0; i < panels.length; i++) { const p = panels[i], real = p.side < 0 && p.zmid !== undefined ? (p.lane || (p.layer === 1 && p.zmid > 380 && p.zmid < 426)) : !!p.door; if (real) nReal++; lathOn(p, real); if (real || i % 10 === 9) await Y(7); }

  await Y(8);
  // (D) the backcloth: a tent of scenic canvas 700 m out and 320 m high, strips 9 m wide, crossed by painted splinters from three points
  const tentR = (y) => (y < 200 ? 700 : Math.max(0, 700 * (320 - y) / 120));
  const tentP = (th, y, r = 1) => new THREE.Vector3(Math.sin(th) * tentR(y) * r, y, STREET.zc + Math.cos(th) * tentR(y) * r);
  let backcloth = null;
  if (opts.backcloth !== false) {
    const seg = 96, ys = [-260, 200, 320], pos = [], uv = [], idx = [];
    for (let j = 0; j < 3; j++) for (let i = 0; i <= seg; i++) { const th = i / seg * Math.PI * 2, p = tentP(th, ys[j]); pos.push(p.x, p.y, p.z); uv.push(th * 700, ys[j]); }
    for (let j = 0; j < 2; j++) for (let i = 0; i < seg; i++) { const a = j * (seg + 1) + i, b = a + 1, c = a + seg + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aMet', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    backcloth = new THREE.Mesh(geo, new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: shared(),
      vertexShader: STYLE_GLSL + `attribute vec2 aMet; varying vec2 vM; void main(){ vM = aMet; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: STYLE_GLSL + `varying vec2 vM;
        void main(){ float fw = fwidth(vM.x); float n = vnoise(vec2(vM.x * 0.0045 + vM.y * 0.002, vM.y * 0.085)), n2 = vnoise(vec2(vM.x * 0.06, vM.y * 0.004 + 9.));   // long horizontal scrubs, then the strips
          float g = 0.86 + 0.035 * (step(0.6, n) - step(n, 0.33)) + 0.02 * (step(0.55, n2) - 0.5);
          float ds = abs(vM.x / 9. - floor(vM.x / 9. + 0.5)) * 9.; float w = max(0.12, 0.8 * fw);
          g = mix(g, 0.74, (1. - smoothstep(w - fw * 0.5, w + fw * 0.5, ds)) * min(1., 0.12 / max(0.6 * fw, 1e-4)));
          gl_FragColor = vec4(distemper(g), 1.); }` }));
    backcloth.frustumCulled = false; backcloth.renderOrder = -1; street.add(backcloth);
    // splinters, as boards a little inside the cloth
    const pts3 = [[rng.range(-0.5, 0.5), rng.range(20, 90)], [rng.range(1.6, 2.6), rng.range(60, 140)], [rng.range(3.6, 4.8), rng.range(10, 110)]];
    for (let i = 0; i < 40; i++) {
      const o = pts3[i % 3], ang = rng.range(0, Math.PI * 2), len = rng.range(120, 430), w0 = rng.range(6, 26), g = rng.chance(0.55) ? G.grey : 0.02, n = 7;
      const dth = Math.cos(ang) * len / 700, dy = Math.sin(ang) * len * 0.6, wth = -Math.sin(ang) * w0 / 700, wy = Math.cos(ang) * w0;
      let prev = null;
      for (let s = 0; s <= n; s++) { const t = s / n, hw2 = 0.5 * (1 - t) + 0.004, th = o[0] + dth * t, y = Math.min(300, Math.max(-50, o[1] + dy * t));
        const A = tentP(th - wth * hw2, y - wy * hw2, 0.985), B = tentP(th + wth * hw2, y + wy * hw2, 0.985); if (prev && i % 3 !== 0) bquad(prev[0], A, B, prev[1], g); prev = [A, B]; }
    }
  }

  // (E) crooked footbridges: a kinked black deck with a chalk edge, leaning posts, ribbon rails; (F) cloaked cut-outs sliding on them
  const rp = [], rs = [], rg = [], ri = [];
  const _rt = new THREE.Vector3(), ribbon = (A, B, hw, g) => { const i = rg.length; _rt.subVectors(B, A).normalize(); for (const P of [A, B]) for (const s of [-1, 1]) { rp.push(P.x, P.y, P.z); rs.push(_rt.x, _rt.y, _rt.z, s * hw); rg.push(g); } ri.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); };
  const bridges = [], bz = [191, 210, 230, 352, 372, 446, 461], bh = [[10, 12], [12.5, 14.5], [16, 19], [9, 11], [8, 10], [30, 36], [30, 36]];   // five rise like a stair so the kite shows under them from the mouth; none over the wedge
  const nBr = Math.round(bz.length * Math.min(1, V.density));
  for (let i = 0; i < nBr; i++) {
    const z = bz[i] + rng.range(-3, 3), k = STREET.hw(z) / 13, hi = z > 400, h0 = rng.range(bh[i][0], bh[i][1]) * (hi ? k / 0.69 : 1), dh = rng.sign() * rng.range(1.5, 3.5) * k, sk = rng.sign() * rng.range(3, 9) * k;
    const xa = -(STREET.hw(z) + 1 - h0 * 0.1), xb = STREET.hw(z) + 1 - (h0 + dh) * 0.1, km = rng.range(0.3, 0.7), kz = rng.sign() * rng.range(1.5, 4) * k, kh = rng.range(-1.5, 1.5) * k;
    const A = new THREE.Vector3(xa, STREET.rise(z) + h0, z), B = new THREE.Vector3(xb, STREET.rise(z) + h0 + dh, z + sk), M = A.clone().lerp(B, km); M.z += kz; M.y += kh;
    const wd = 1.5 * Math.max(0.5, k), rail = 1.25 * Math.max(0.5, k);
    for (const [P, Q] of [[A, M], [M, B]]) {
      _d.subVectors(Q, P).normalize(); const W = new THREE.Vector3().crossVectors(_Y, _d).normalize(), D = new THREE.Vector3().crossVectors(_d, W).normalize();
      board(P.clone().addScaledVector(_d, -0.3), Q.clone().addScaledVector(_d, 0.3), W, D, wd, 0.22 * Math.max(0.5, k), 0.03, 1);
      const np = Math.max(2, Math.round(P.distanceTo(Q) / 3.2)); let last = null;
      for (let j = 0; j <= np; j++) { const base = P.clone().lerp(Q, j / np).addScaledVector(W, wd * 0.5), lean2 = rng.range(-0.3, 0.3), top = base.clone().addScaledVector(D, rail).addScaledVector(_d, lean2 * rail);
        board(base.clone().addScaledVector(D, -0.3), top, _d, W, 0.14 * Math.max(0.6, k), 0.05, 0.03); if (last) ribbon(last, top, 0.035, 0.03); last = top; }
      ribbon(P.clone().addScaledVector(W, -wd * 0.5).addScaledVector(D, rail * 0.9), Q.clone().addScaledVector(W, -wd * 0.5).addScaledVector(D, rail * 0.9), 0.035, 0.03);
    }
    for (const s of [0.25, 0.75]) { const P = (s < km ? A.clone().lerp(M, s / km) : M.clone().lerp(B, (s - km) / (1 - km))); ribbon(P, new THREE.Vector3(Math.sign(P.x) * (Math.abs(P.x) + 5 * k), P.y + rng.range(6, 12) * k, P.z + rng.range(-3, 3)), 0.03, 0.03); }
    bridges.push({ A, M, B, km, k, z });
  }
  await Y(9);

  // (F) cloaked townsfolk: board cut-outs, backs turned, sliding along the bridge decks on slot tracks and rocking side to side
  let figures = null;
  if (V.figures && bridges.length) {
    const fp = [], fg = [], fi = [];
    const poly = (pts, g, z) => { const b = fg.length; let cx = 0, cy = 0; for (const q of pts) { cx += q[0]; cy += q[1]; } fp.push(cx / pts.length, cy / pts.length, z); fg.push(g);
      for (const q of pts) { fp.push(q[0], q[1], z); fg.push(g); } for (let i = 0; i < pts.length; i++) fi.push(b, b + 1 + i, b + 1 + (i + 1) % pts.length); };
    poly([[-0.62, 0], [-0.2, 0.07], [0.15, 0], [0.66, 0.06], [0.44, 1.2], [0.3, 1.82], [-0.26, 1.86], [-0.44, 1.25]], 0.02, 0);
    poly([[-0.17, 1.84], [0.2, 1.82], [0.25, 2.1], [0.04, 2.27], [-0.19, 2.12]], 0.02, 0);
    for (const z of [-0.015, 0.015]) poly([[-0.62, 0], [-0.5, 0.02], [-0.37, 1.25], [-0.44, 1.25]], 1, z);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); geo.setAttribute('aG', new THREE.Float32BufferAttribute(fg, 1)); geo.setIndex(fi);
    const n = Math.min(16, bridges.length * 2), sway = new Float32Array(n * 2), tracks = [];
    for (let i = 0; i < n; i++) { sway[i * 2] = rng(); sway[i * 2 + 1] = rng.range(0.06, 0.11); tracks.push({ b: bridges[i % bridges.length], s0: rng(), rate: rng.range(1.2, 2.6) * rng.sign(), flip: rng.sign() }); }
    geo.setAttribute('aSway', new THREE.InstancedBufferAttribute(sway, 2));
    figures = new THREE.InstancedMesh(geo, matBoard, n); figures.frustumCulled = false; street.add(figures);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pp = new THREE.Vector3(), dd = new THREE.Vector3();
    onProgress.push((u) => {
      for (let i = 0; i < n; i++) {
        const t = tracks[i], b = t.b; let s = (t.s0 + u * t.rate) % 2; if (s < 0) s += 2; if (s > 1) s = 2 - s; s = 0.08 + 0.84 * s;
        if (s < b.km) { pp.lerpVectors(b.A, b.M, s / b.km); dd.subVectors(b.M, b.A); } else { pp.lerpVectors(b.M, b.B, (s - b.km) / (1 - b.km)); dd.subVectors(b.B, b.M); }
        const kk = 1.35 * Math.max(0.5, b.k); q.setFromAxisAngle(_Y, Math.atan2(-dd.z, dd.x)); sc.set(kk * t.flip, kk, kk); pp.y += 0.1;
        m4.compose(pp, q, sc); figures.setMatrixAt(i, m4);
      }
      figures.instanceMatrix.version++;                                    // the attribute's own upload flag (no material is touched)
    });
  }

  // (G) chalk flakes shaken loose by the gusts: chips that ride each gust front up the street, scaled to nothing when no gust is running
  { const n = Math.round(3000 * detail), pos = new Float32Array(n * 9), sd = new Float32Array(n * 12);
    for (let i = 0; i < n; i++) {
      const rel = rng.range(-34, 16), xf = rng.range(-1, 1), h = Math.pow(rng(), 1.7) * 30 + 0.4, ph = rng(), a0 = rng.range(0, 6.283);
      for (let c = 0; c < 3; c++) { const a = a0 + c * 2.094 + rng.range(-0.5, 0.5), r = c === 0 ? 1.5 : rng.range(0.5, 0.9); pos[(i * 3 + c) * 3] = Math.cos(a) * r; pos[(i * 3 + c) * 3 + 1] = Math.sin(a) * r;
        const o = (i * 3 + c) * 4; sd[o] = rel; sd[o + 1] = xf; sd[o + 2] = h; sd[o + 3] = ph; }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new THREE.BufferAttribute(sd, 4));
    const flakes = new THREE.Mesh(geo, new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: shared(),
      vertexShader: STYLE_GLSL + /* glsl */`attribute vec4 aSeed;
        void main(){
          float gi = floor(aSeed.w * 2.999); float gz = gi < 1. ? uGust.x : (gi < 2. ? uGust.y : uGust.z);
          float ph = fract(aSeed.w * 7.31), life = fract(ph + uTime * 0.13);
          float z = gz + aSeed.x + 3. * sin(uTime * 1.3 + ph * 40.);
          float hw = mix(13., 8.5, clamp((z - 160.) / 280., 0., 1.));
          vec3 c = vec3(aSeed.y * hw * 0.94 + 0.7 * sin(uTime * 2.1 + ph * 60.), (z - 160.) * 0.0577 + aSeed.z * (1. - 0.45 * life) + 0.3, z);
          float on = step(-900., gz) * smoothstep(0., 0.1, life) * smoothstep(1., 0.85, life) * uGust.w;
          vec4 mv = modelViewMatrix * vec4(c, 1.);
          float px = abs(mv.z) * 2. / max(projectionMatrix[1][1] * uViewH, 1.);
          float s = max(0.07 + 0.15 * fract(ph * 13.7), 1.5 * px) * min(on, 1.);
          float a1 = uTime * (3. + 5. * ph) + ph * 50., a2 = uTime * (2. + 3. * fract(ph * 5.3));
          vec3 q = vec3(position.x * cos(a1), position.y, position.x * sin(a1)); q.yz = vec2(q.y * cos(a2) - q.z * sin(a2), q.y * sin(a2) + q.z * cos(a2));
          gl_Position = projectionMatrix * modelViewMatrix * vec4(c + q * s, 1.);
        }`,
      fragmentShader: STYLE_GLSL + `void main(){ gl_FragColor = vec4(distemper(1.), 1.); }` }));
    flakes.frustumCulled = false; street.add(flakes); hero_parts.flakes = flakes; }

  // (H) loose cloth: knife-shaped offcuts tacked under the bridges, behind the back-lane flats and round the cut kite; they flap in the draught
  { const pp = [], ra = [], rn = [], gg = [], ii = [], q0 = new THREE.Vector3(), q1 = new THREE.Vector3();
    const rag = (anchor, down, across, flapN, len, wid, g) => {              // hangs from `anchor` along `down`, `wid` wide along `across`, flaps along flapN
      const b = gg.length, ph = rng(), rows = 4, amp = len * rng.range(0.1, 0.2);
      for (let r = 0; r <= rows; r++) { const t = r / rows, w = wid * (1 - t) * 0.5;
        for (const s of [-1, 1]) { q0.copy(anchor).addScaledVector(down, len * t).addScaledVector(across, s * w + (s > 0 ? 0 : wid * 0.25 * t)); pp.push(q0.x, q0.y, q0.z); ra.push(t, ph, amp, s); rn.push(flapN.x, flapN.y, flapN.z); gg.push(g); } }
      for (let r = 0; r < rows; r++) { const k = b + r * 2; ii.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    };
    const dn = new THREE.Vector3(0, -1, 0);
    for (const br of bridges) for (const [P, Q] of [[br.A, br.M], [br.M, br.B]]) {
      const n = Math.max(1, Math.round(P.distanceTo(Q) / 4 * detail)); q1.subVectors(Q, P).normalize(); const fl = new THREE.Vector3().crossVectors(q1, dn).normalize();
      for (let i = 0; i < n; i++) rag(P.clone().lerp(Q, (i + rng.range(0.2, 0.8)) / n).addScaledVector(dn, 0.1), dn.clone().addScaledVector(q1, rng.range(-0.25, 0.25)).normalize(), q1, fl, rng.range(1.4, 3.6) * Math.max(0.5, br.k), rng.range(0.4, 0.9) * Math.max(0.5, br.k), rng.chance(0.7) ? 0.03 : G.grey);
    }
    for (const p of panels) { if (!(p.side < 0 && (p.door || (p.zmid > 380 && p.zmid < 486)))) continue;
      const n = p.door ? 0 : Math.round(rng.range(4, 7) * detail), fl = p.n.clone().multiplyScalar(0.5).addScaledVector(p.U, 0.85);
      for (let i = 0; i < n; i++) { const a = p.w * rng.range(0.15, 0.85), b = Math.min(p.hL, p.hR) * rng.range(0.35, 0.95); p.at(a, b, q1).addScaledVector(p.n, -0.22);
        rag(q1.clone(), p.V.clone().negate().addScaledVector(p.U, rng.range(-0.3, 0.3)).normalize(), p.U, fl, rng.range(6, 14) * Math.max(0.6, p.k), rng.range(1.6, 3.2) * Math.max(0.6, p.k), rng.chance(0.5) ? 0.05 : 0.5); }
      if (p.door) for (let e = 0; e < 4; e++) {                              // the cut cloth of the kite hangs in flaps behind its edges
        const c = [[0, -DOOR.hd], [DOOR.hw, 0], [0, DOOR.hu], [-DOOR.hw, 0]], P = c[e], Q = c[(e + 1) % 4], nf = e === 1 || e === 2 ? 4 : 2;
        for (let i = 0; i < nf; i++) { const t = (i + rng.range(0.25, 0.75)) / nf, dz = P[0] + (Q[0] - P[0]) * t, dy = P[1] + (Q[1] - P[1]) * t, ab = abOf(p, DOOR.z + dz * 1.02 + DOOR.lean * dy, U.uKite.value.y + dy * 1.02);
          p.at(ab[0], ab[1], q1).addScaledVector(p.n, -0.12); rag(q1.clone(), p.V.clone().negate().addScaledVector(p.U, rng.range(-0.35, 0.35)).normalize(), p.U, p.n.clone().multiplyScalar(0.5).addScaledVector(p.U, 0.85), rng.range(1.4, 3) * (e === 1 || e === 2 ? 1 : 0.6), rng.range(0.6, 1.3), 0.06); }
      }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); geo.setAttribute('aRag', new THREE.Float32BufferAttribute(ra, 4)); geo.setAttribute('aFlap', new THREE.Float32BufferAttribute(rn, 3)); geo.setAttribute('aG', new THREE.Float32BufferAttribute(gg, 1)); geo.setIndex(ii);
    const rags = new THREE.Mesh(geo, ragMaterial()); rags.frustumCulled = false; street.add(rags); hero_parts.rags = rags; }

  { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); geo.setAttribute('aG', new THREE.Float32BufferAttribute(bg, 1)); geo.setIndex(bi);
    const boards = new THREE.Mesh(geo, matBoard); boards.frustumCulled = false; street.add(boards);
    const rgeo = new THREE.BufferGeometry(); rgeo.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rgeo.setAttribute('aSide', new THREE.Float32BufferAttribute(rs, 4)); rgeo.setAttribute('aG', new THREE.Float32BufferAttribute(rg, 1)); rgeo.setIndex(ri);
    const ribbons = new THREE.Mesh(rgeo, matRibbon); ribbons.frustumCulled = false; street.add(ribbons); }
  await Y(10);

  // ---- anchors (local space of `object`: front toward +Z; fromCourse() converts the brief's course coordinates) ----
  const fromCourse = (x, y, z) => new THREE.Vector3(-x, y, STREET.zc - z);
  const fy = (z) => STREET.rise(z), kiteC = [kiteP.x, kiteP.y, kiteP.z], kn = doorP.n;
  const line = [[0, 1.8, 150], [0.6, fy(200) + 2.4, 200], [-0.8, fy(250) + 2.6, 250], [1.2, fy(292) + 2.0, 292], [1.4, fy(330) + 4.5, 330], [-0.5, fy(362) + 17, 362], [0.8, kiteC[1] - 9, 389],
    kiteC, [kiteC[0] - 7, kiteC[1] + 1, kiteC[2] + 12], [-30, kiteC[1], 436], [-42, kiteC[1] - 2, 455]];
  const anchors = {
    fromCourse,
    flyThrough: line.map((p) => fromCourse(p[0], p[1], p[2])),             // mouth -> over the wedge at 2 m -> up the port wall -> through the kite -> the back lane
    kite: { position: fromCourse(kiteC[0], kiteC[1], kiteC[2]), normal: new THREE.Vector3(-kn.x, 0, -kn.z).normalize(), halfWidth: DOOR.hw, up: DOOR.hu, down: DOOR.hd },
    wedgeTip: fromCourse(8, fy(283), 283), wedgeFoot: fromCourse(-STREET.hw(330), fy(330), 330),
    mouth: fromCourse(0, 0, 160), end: fromCourse(0, fy(520), 520),
    viewpoints: {
      headOn: { position: fromCourse(2, fy(178) + 3, 176), target: fromCourse(-1, fy(300) + 14, 300) },
      overWedge: { position: fromCourse(1, fy(290) + 2, 290), target: fromCourse(-4, fy(340) + 12, 340) },
      climb: { position: fromCourse(1, fy(362) + 22, 362), target: fromCourse(kiteC[0], kiteC[1], kiteC[2]) },
      backLane: { position: fromCourse(-34, kiteC[1] + 2, 440), target: fromCourse(-14, kiteC[1] - 6, 415) },
    },
    windows: windows.length, loosePanel: loose ? fromCourse(loose.O[0], loose.O[1], loose.O[2]) : null,
  };

  // ---- motion: the medium first (belly, gusts, rocking), all events from progress u ----
  let progress = -1; const camP = new THREE.Vector3();
  const gustU = opts.gustTimes || (V.gusts === 5 ? [0.1, 0.25, 0.39, 0.62, 0.84] : V.gusts === 3 ? [0.18, 0.39, 0.84] : []);
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const apply = (u) => {
    U.uRock.value = u * 55;
    const gz = [-999, -999, -999]; let k = 0;
    for (let i = gustU.length - 1; i >= 0 && k < 3; i--) { const z = 100 + (u - gustU[i]) * 2520; if (u >= gustU[i] && z < 1000) gz[k++] = z; }
    U.uGust.value.set(gz[0], gz[1], gz[2], V.gusts === 5 ? 1.35 : V.gusts === 1 ? 0.75 : 1);
    dyeAt(u, V.reel, pal, U.uDye.value);
    U.uLoose.value = V.loose ? Math.tan(0.157) * (ss(0.16, 0.21, u) - 0.12 * ss(0.21, 0.23, u) * (1 - ss(0.23, 0.26, u))) : 0;
    for (const f of onProgress) f(u);
  };
  const hero = {
    object, radius: 190, height: 96, center: new THREE.Vector3(0, 36, 0), anchors, ground: false, groundY: 0, kiteOpen: null,
    variation: V, panels, floors, paintOnto, street, road0, bridges, uniforms: U,
    setProgress(u) { progress = Math.min(1, Math.max(0, u)); },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (camera && camera.projectionMatrix) { /* pixel sizes come from uViewH, which the world may set from renderer.getDrawingBufferSize() */ }
      const u = progress >= 0 ? progress : (time / 42) % 1;                 // never driven: run as a preview on the clock
      street.updateWorldMatrix(true, false); U.uToCourse.value.copy(street.matrixWorld).invert();
      apply(u);
      if (camera) { camP.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(U.uToCourse.value); const d = camP.distanceTo(kiteP);
        hero_parts.veil.material.uniforms.uOpen.value = hero.kiteOpen ?? 0.85 * ss(34, 9, d); }
      for (const f of onFrame) f(dt, time, camera);
    },
    dispose() {},
  };

  return hero;
}
