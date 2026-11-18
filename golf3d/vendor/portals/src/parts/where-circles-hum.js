// WHERE CIRCLES HUM: the hero set piece and the style kit. After Wassily Kandinsky (Bauhaus years: Composition VIII,
// Several Circles). The great circle, and the night inside it.
//
// WHAT IT IS. Outside: a flat black circle 250 m across (an unlit sphere that reads and sorts as a disc) holding an
// off-centre violet circle, in a halo of rose grain 55 m deep; a red circle in a yellow grain halo on its upper
// starboard rim; the rail's last 200 m and two ruled diagonals pierce it and turn ivory inside its edge; an edged
// triangle and a sheared 5 by 5 chequer stand astride the rim, counterchanged; bright films slide across its face;
// real rose grain discs hang in the air where the rail meets the skin. Inside (uNight 1): black clouded with violet,
// six thinned tiers of films, ivory lines, a harp, a bundle, pale triangles, darts, a chequer, ivory tufts and fruit,
// round ONE subject: the dark-blue circle (150 m) with its off-centre black heart, white grain corona, the exit on
// the heart's rim in yellow grain, and the heart's 6 by 7 chequer that wakes as the lens nears.
//
// SIZE AND COST. Local space, origin at the base of the circle, +Y up, front +Z (the lens arrives travelling -Z).
// Circle centre (0,125,0), radius 125; halo to 180. The night reaches to about (220,-90,-350). About 36k triangles,
// 14 draw calls, ~40 ms build, no lights, no textures. hero.place gives the brief's seat: position (-110,-55,660),
// rotation.y = PI, which puts the centre at world (-110,70,660) and the skin point on the rail's end (-60,20,556).
//
// OPTS. palette (7 hex, brief order), detail (0.6..1: thins grain, far films, darts), variant (0 rose halo + red
// companion, 1 yellow + blue, 2 pale blue + orange; default by seed), ground (0 buff, 1 ochre, 2 halo white; by seed),
// field:false (leave my dome out), rail:false (you draw the whole rail), wash:false (you make the wash),
// exitDisc:false (no white disc behind the portal seat), uSkin (0.5: the u at which setProgress turns day to night),
// night (force 0/1), U (a uniform set from makeUniforms()), cast (a function handed every list before the meshes are made:
// { films, solids, halos, lines, bent, plates, squares, heartSq, rail, fly, skin, curve, head }; an entry it marks cut is not made).
// head: the radius of the ruling point that a looping line of bent carries.
//
// THE HERO OBJECT. { object, radius, height, center, anchors, U, pigments, variant, groundKind, place, update, dispose,
//   setProgress(u), setNight(v), setWash(color, k) }.
// update(dt, time, camera) must run every frame: it keeps U current (time, hero centre in world space, buffer height,
// gaze), flips day to night, draws the dark film at the skin by distance from the place (under a second at flight
// speed, no flash), wakes the heart's chequer by distance to the exit, and moves the ruling points. With no
// setProgress() call night latches when the lens is inside the sphere; call setProgress(u) each frame for an exact
// flip at uSkin. While ctx.through is true it is always day.
// anchors (local): center; skin {position, direction}: where the rail meets the skin and its heading; rail {a, b}: the
// part of the rail I draw (end yours at a); flyThrough: ten points, a safe line from 90 m outside through the skin, down
// the six tiers to the exit (use them as the path's second half); portalSeat {position, facing, direction}: the 14 m
// circle portal, tilt true, facing back up the path; blueCircle {center, radius}; heart; companion; viewpoints.
//
// THE STYLE, exported for the whole world (pass { U: hero.U } to every factory so one set of uniforms drives all):
//   PALETTE, MIXES, pigments(palette)   the pigments as THREE.Color (post.flat: a hex written is the hex shown).
//   U, makeUniforms()                   uTime, uNight, uHeroC, uHeroR, uViewH, uPaper, uInk, uIvory, uGaze.
//   STYLE_GLSL, COVER_GLSL              hashes, value noise, whenScale(when); heroCover(P): the counterchange test.
//   makeField(opts)                     the sprayed ground dome (day buff / night black), sits on the lens by itself.
//   makeGreatCircle(opts)               the flat-sorting black circle with its view-facing core.
//   makeFilms(list, {solid})            circles: films (multiply on buff, exclusion on the dark: 2 calls) or opaque.
//   makeHalos(list)                     grain halos: stipple fixed in the quad, six sizes, mean below 3 px. Never a glow.
//   makeGrain(flat8, {colors})          real grain discs for the places the lens flies through a halo.
//   makeLines(list, {segs}), bundle(), lineHead()   ruled lines: 1.6 px floor, black/ivory by heroCover, hum, swim, loop.
//   makePlates(list)                    edged triangles (peaks, darts): turned to stay within 55 degrees of the lens.
//   makeChequer(list), chequerBoard()   sheared boards whose squares wipe: mesh.setWake(0..1).
//   makeWash()                          the one screen-space thing: a multiply film over the lens, white when idle.
// Every form takes `when`: 0 day only, 1 night only, 2 always (scaled by uNight in the vertex shader, never hidden).
// Draw order is fixed by renderOrder: field -10, great circle -9, solids -8, chequers -7, plates -6 (these write
// depth), then halos -5, films -4/-3, lines -2, grain -1, wash 900. All materials are transparent:true so that order holds.
// Expects: post { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
// no scene fog, no lights, camera far >= 1000.
import * as THREE from 'three';

// ---------------------------------------------------------------------------------------------------------------
// Pigments (display hex; under post.flat a hex written is the hex shown: no inverse tone map anywhere in this file)
// ---------------------------------------------------------------------------------------------------------------
export const PALETTE = ['#EDE3C6', '#12110F', '#1E3A82', '#F0C61C', '#D8412A', '#45295F', '#E6A39B'];
export const MIXES = { orange: '#E2772A', green: '#2E8B6E', lviolet: '#6A4B9B', pblue: '#7DB3D8', ochre: '#D2B06A', white: '#DDE6EA' };
export function pigments(palette = PALETTE) {
  const p = palette && palette.length >= 7 ? palette : PALETTE, c = (h) => new THREE.Color(h), o = {};
  ['buff', 'black', 'blue', 'yellow', 'red', 'violet', 'rose'].forEach((k, i) => { o[k] = c(p[i]); });
  for (const k in MIXES) o[k] = c(MIXES[k]);
  return o;
}

// One set of uniforms for every material of the world. The hero's update() keeps them current.
export const U = {
  uTime: { value: 0 },                              // seconds, ambient loops only (drift, breathing, throb)
  uNight: { value: 0 },                             // 0 day (outside the great circle) .. 1 night (inside it)
  uHeroC: { value: new THREE.Vector3(0, 125, 0) },  // world centre of the great circle
  uHeroR: { value: 125 },                           // its radius; 0 switches the counterchange test off
  uViewH: { value: 720 },                           // drawing buffer height in px (line floors, stipple fades)
  uPaper: { value: new THREE.Color('#EDE3C6') },    // day ground (films multiply against it)
  uInk: { value: new THREE.Color('#12110F') },      // black: ruled line, edges, hero, night ground
  uIvory: { value: new THREE.Color('#DDE6EA') },    // what black turns into on the dark
  uGaze: { value: new THREE.Vector3(0, 0, -1) },    // world direction the lens looks (plates and squares key on it)
};
const withU = (u, extra = {}) => Object.assign({}, u || U, extra);
// a fresh set for one build of the world (two builds never share state): pass it as opts.U to every factory below
export function makeUniforms() { const o = {}; for (const k in U) { const v = U[k].value; o[k] = { value: v && v.clone ? v.clone() : v }; } return o; }

// GLSL shared by every material (vertex and fragment). Nothing here loops or samples a texture.
export const STYLE_GLSL = /* glsl */`
uniform float uTime, uNight, uHeroR, uViewH;
uniform vec3 uHeroC, uPaper, uInk, uIvory, uGaze;
float h11(float n){ return fract(sin(n * 127.1 + 1.7) * 43758.5453); }
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
vec2 h22(vec2 p){ float n = h21(p); return vec2(n, h21(p + n * 19.19 + 7.3)); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float vnoise3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); vec2 o = vec2(37.0, 17.0);
  float a = mix(vnoise(i.xy + o * i.z + f.xy), vnoise(i.xy + o * (i.z + 1.) + f.xy), f.z); return a; }
// when: 0 = a day form (gone inside the great circle), 1 = a night form (gone outside), 2 = always there
float whenScale(float when){ return when < 0.5 ? 1. - uNight : (when < 1.5 ? uNight : 1.); }
`;
// Fragment-only: the counterchange test. 1 where the eye ray through world point P has the great circle behind it
// (or the eye is inside it), 0 on the day ground; antialiased exactly on the circle's edge. Call outside loops.
export const COVER_GLSL = /* glsl */`
float heroCover(vec3 P){
  vec3 oc = cameraPosition - uHeroC; vec3 dv = P - cameraPosition; float L = max(length(dv), 1e-4); vec3 d = dv / L;
  float b = dot(oc, d); float h = sqrt(max(dot(oc, oc) - b * b, 0.));
  float fw = clamp(fwidth(h), 1e-4, 4.);
  float c = (1. - smoothstep(uHeroR - fw, uHeroR + fw, h)) * step(b, 0.) * step(1., uHeroR);
  return max(c, uNight);
}
// metres per pixel at view depth z (z > 0)
float pxSize(float z){ return z * 2. / max(projectionMatrix[1][1] * uViewH, 1.); }
`;
const VERT_PX = /* glsl */`float pxSize(float z){ return z * 2. / max(projectionMatrix[1][1] * uViewH, 1.); }\n`;
const FRAG_HEAD = 'uniform mat4 projectionMatrix;\n' + STYLE_GLSL + COVER_GLSL;
const VERT_HEAD = STYLE_GLSL + VERT_PX;

// instanced-quad helper: a unit quad (-1..1) with per-instance attributes {name: [itemSize, Float32Array]}
function instQuad(attrs, count, segX = 1) {
  const g = new THREE.InstancedBufferGeometry(), pos = [], idx = [];
  for (let i = 0; i <= segX; i++) { const x = -1 + 2 * i / segX; pos.push(x, -1, 0, x, 1, 0); }
  for (let i = 0; i < segX; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k][1], attrs[k][0]));
  g.instanceCount = count; return g;
}
function finish(mesh, order) { mesh.frustumCulled = false; mesh.renderOrder = order; mesh.matrixAutoUpdate = true; return mesh; }
const col3 = (c) => (c.isColor ? c : new THREE.Color(c));

// ---------------------------------------------------------------------------------------------------------------
// The field: no sky and no ground, one sprayed ground all round, on a dome that sits on the lens (no update needed).
// Day: paper clouded in large soft patches, ochre toward uOchreDir, pale blue deepening toward the great circle.
// Night (uNight 1): black clouded with violet.
// ---------------------------------------------------------------------------------------------------------------
export function makeField(opts = {}) {
  const P = opts.pig || pigments();
  const mat = new THREE.ShaderMaterial({
    uniforms: withU(opts.U, {
      uOchre: { value: col3(opts.cloud || P.ochre) }, uPBlue: { value: col3(opts.toward || P.pblue) }, uViolet: { value: P.violet.clone() },
      uOchreDir: { value: (opts.ochreDir || new THREE.Vector3(-0.8, -0.45, 0.4)).clone().normalize() }, uSeed: { value: opts.seed ?? 3.7 },
    }),
    vertexShader: VERT_HEAD + /* glsl */`
      varying vec3 vDir;
      void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(cameraPosition + position * 900., 1.);
        if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
    fragmentShader: FRAG_HEAD + /* glsl */`
      uniform vec3 uOchre, uPBlue, uViolet, uOchreDir; uniform float uSeed; varying vec3 vDir;
      void main(){
        vec3 d = vDir / max(length(vDir), 1e-4);
        float n1 = vnoise3(d * 1.7 + uSeed), n2 = vnoise3(d * 3.9 - uSeed * 1.3), n3 = vnoise3(d * 9.0 + 11.);
        float mott = (n3 - .5) * .035 + (vnoise3(d * 31.) - .5) * .02;                     // uneven spray
        vec3 day = uPaper;
        float wo = smoothstep(.42, .9, n1 * .62 + .55 * max(dot(d, uOchreDir), 0.) + n2 * .18);
        day = mix(day, uOchre, wo * .8);
        vec3 hv = uHeroC - cameraPosition; vec3 hd = hv / max(length(hv), 1e-3);
        float wb = smoothstep(.62, 1.02, dot(d, hd) * .8 + n2 * .26 + n3 * .06);
        day = mix(day, uPBlue, wb * .62);
        day *= 1. + mott;
        float wv = smoothstep(.52, .95, n1 * .7 + n2 * .45);
        vec3 night = mix(uInk, uViolet, clamp(wv * .34 + mott * 1.2, 0., 1.));
        gl_FragColor = vec4(mix(day, night, uNight), 1.);
      }`,
    side: THREE.BackSide, depthWrite: false, depthTest: false, transparent: true,
  });
  return finish(new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), mat), -10);
}

// ---------------------------------------------------------------------------------------------------------------
// The great circle: an unlit sphere that reads and SORTS as a flat disc. It is cut round by the eye ray's miss
// distance (so its edge is antialiased from any range), writes the depth of the plane through its centre (so a
// line can pierce it and a circle can kiss its rim), and draws its off-centre core in view-facing coordinates.
// Scaled to nothing by uNight. core: [x, y, radius] in metres, view-facing (x to the lens's right, y up).
// ---------------------------------------------------------------------------------------------------------------
export function makeGreatCircle(opts = {}) {
  const P = opts.pig || pigments(), core = opts.core || [-20, 14, 85];
  const mat = new THREE.ShaderMaterial({
    uniforms: withU(opts.U, { uCoreCol: { value: col3(opts.coreColor || P.violet) }, uCore: { value: new THREE.Vector3(...core) }, uSeed: { value: opts.seed ?? 1.3 } }),
    vertexShader: VERT_HEAD + /* glsl */`
      varying vec3 vW;
      void main(){ vW = uHeroC + position * uHeroR * 1.04 * (1. - uNight); gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.); }`,
    fragmentShader: FRAG_HEAD + /* glsl */`
      uniform vec3 uCoreCol, uCore; uniform float uSeed; varying vec3 vW;
      void main(){
        vec3 oc = cameraPosition - uHeroC; vec3 dv = vW - cameraPosition; vec3 d = dv / max(length(dv), 1e-4);
        float b = dot(oc, d); vec3 q = oc - b * d; float h = length(q);
        float fw = clamp(fwidth(h), 1e-4, 4.);
        float a = 1. - smoothstep(uHeroR - fw, uHeroR + fw, h);
        if (a < .004) discard;
        float dC = max(length(oc), 1e-3); vec3 f = -oc / dC; vec3 rt = cross(f, vec3(0, 1, 0)); rt /= max(length(rt), 1e-4); vec3 up = cross(rt, f);
        // where the ray meets the plane through the centre, scaled so the circle's own edge is always at uHeroR: a flat disc
        vec3 pp = oc + d * (dC / max(dot(d, f), 1e-3));
        vec2 p = vec2(dot(pp, rt), dot(pp, up)) * (sqrt(max(dC * dC - uHeroR * uHeroR, 0.)) / dC);
        float rc = length(p - uCore.xy);
        float fc = clamp(fwidth(rc), 1e-4, 4.);
        float inCore = 1. - smoothstep(uCore.z - fc, uCore.z + fc, rc);
        // one flat hue with one faint sprayed cloud toward one rim
        float cloud = smoothstep(.2, 1., (p.x * .6 - p.y * .8 - uCore.x * .6 + uCore.y * .8) / max(uCore.z, 1.) * .5 + .5) * (.55 + .9 * vnoise(p * .045 + uSeed));
        vec3 core = mix(uCoreCol, uInk, clamp(cloud * .5, 0., .6)) * (1. + (vnoise(p * .21 + 3.) - .5) * .07 + (vnoise(p * .06 + 9.) - .5) * .06);
        gl_FragColor = vec4(mix(uInk, core, inCore), a);
        vec4 c = projectionMatrix * viewMatrix * vec4(cameraPosition + d * max(-b, .6), 1.);
        gl_FragDepth = clamp(c.z / max(c.w, 1e-4) * .5 + .5, 0., 1.);
      }`,
    side: THREE.BackSide, transparent: true, depthWrite: true, depthTest: true,
  });
  return finish(new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), mat), -9);
}

// ---------------------------------------------------------------------------------------------------------------
// Circles. One flat hue, crisp fwidth edge, always round (view-plane quads), a faint sprayed cloud toward one rim,
// some holding one smaller circle. mode 'mul': a film on the day ground (multiplies, Beer-Lambert at 60 percent,
// so yellow over blue is green); 'exc': the same film where the great circle is behind it or at night (exclusion:
// stays bright, the lens a pale third hue); 'solid': an opaque circle. makeFilms() draws a list twice (mul + exc).
// Each drifts on its own straight course and none orbits; yellow swells and blue withdraws as the lens nears, red throbs.
// ---------------------------------------------------------------------------------------------------------------
const FILM_VERT = VERT_HEAD + /* glsl */`
  attribute vec3 iPos, iCol, iCol2, iIn; attribute vec4 iRC, iVel;
  varying vec2 vUv; varying vec3 vW, vCol, vCol2, vIn; varying vec2 vSeedR;
  void main(){
    vec3 lp = iPos + iVel.xyz * sin(uTime * iVel.w + iRC.z * 6.2832);
    vec3 wc = (modelMatrix * vec4(lp, 1.)).xyz;
    float dist = length(wc - cameraPosition), near = 1. - smoothstep(20., 170., dist);
    float k = iRC.w, r = iRC.x * whenScale(iRC.y);
    r *= 1. + near * (k > .5 && k < 1.5 ? .07 : (k < -.5 ? -.07 : (abs(k) < .5 ? .045 * sin(uTime * 4.4 + iRC.z * 40.) : 0.)));
    float vz = max(-(viewMatrix * vec4(wc, 1.)).z, .05);
    r *= smoothstep(2., 5., r / pxSize(vz));                          // nothing under 4 px across is drawn; a film grows in as it nears
    vec3 cr = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), cu = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    vW = wc + (cr * position.x + cu * position.y) * r;
    vUv = position.xy; vCol = iCol; vCol2 = iCol2; vIn = iIn; vSeedR = vec2(iRC.z, r);
    gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
  }`;
const FILM_FRAG = (mode) => FRAG_HEAD + /* glsl */`
  varying vec2 vUv; varying vec3 vW, vCol, vCol2, vIn; varying vec2 vSeedR;
  void main(){
    float rr = length(vUv), fw = clamp(fwidth(rr), 1e-5, .5);
    float a = 1. - smoothstep(1. - 1.5 * fw, 1., rr);
    if (a < .003) discard;
    float s = vSeedR.x, ang = s * 37.;
    float inner = (1. - smoothstep(vIn.z - fw, vIn.z + fw, length(vUv - vIn.xy))) * step(.01, vIn.z);
    vec3 c = mix(vCol, vCol2, inner);
    float cloud = smoothstep(.15, 1.1, dot(vUv, vec2(cos(ang), sin(ang))) * .55 + .45) * (.35 + vnoise(vUv * 2.6 + s * 91.));
    float grainPx = .6 / max(fw * vSeedR.y, 1e-4);                                  // px size of a 0.6 m spray cell
    float spray = (vnoise(vUv * vSeedR.y * 1.7 + s * 13.) - .5) * smoothstep(3., 7., grainPx);
    float tone = clamp(cloud * .30 * (1. - inner) + spray * .10, -.2, .5);          // 0 flat .. darker toward one rim
    float cover = heroCover(vW);
    ${mode === 'mul' ? `
    vec3 T = pow(clamp(c / max(uPaper, vec3(.02)), vec3(.002), vec3(1.)), vec3(.6 * (1. + tone * .9)));
    gl_FragColor = vec4(mix(vec3(1.), T, a * (1. - cover)), 1.);` : mode === 'exc' ? `
    gl_FragColor = vec4(clamp(c * (1. - tone * .7), 0., 1.) * a * cover, 1.);
    if (a * cover < .003) discard;` : `
    gl_FragColor = vec4(c * (1. - tone * .5), a);`}
  }`;
export function filmMaterial(mode = 'mul', u = U) {
  const m = new THREE.ShaderMaterial({ uniforms: withU(u), vertexShader: FILM_VERT, fragmentShader: FILM_FRAG(mode), transparent: true, depthTest: true, depthWrite: mode === 'solid', side: THREE.DoubleSide });
  if (mode !== 'solid') {
    m.blending = THREE.CustomBlending; m.blendEquation = THREE.AddEquation;
    m.blendSrc = mode === 'mul' ? THREE.DstColorFactor : THREE.OneMinusDstColorFactor;
    m.blendDst = mode === 'mul' ? THREE.ZeroFactor : THREE.OneMinusSrcColorFactor;
    m.blendSrcAlpha = THREE.ZeroFactor; m.blendDstAlpha = THREE.OneFactor;
  }
  return m;
}
const kindOf = (c) => (c.r > .45 && c.g > .22 && c.b < .2 ? 1 : (c.b > c.r * 1.3 ? -1 : (c.r > c.g * 2.2 ? 0 : 2)));
// a growable list of instances: set = instList(floatsPerInstance); set.push(...numbers); set.array()
function instList(stride) { const a = []; return { push(...v) { for (let i = 0; i < stride; i++) a.push(v[i] ?? 0); }, get count() { return a.length / stride; }, data: a, stride }; }
function split(list, spec) { // spec: {name: itemSize} in order -> {name: [itemSize, Float32Array]}
  const n = list.count, out = {}; let off = 0;
  for (const k in spec) { const s = spec[k], arr = new Float32Array(n * s); for (let i = 0; i < n; i++) for (let j = 0; j < s; j++) arr[i * s + j] = list.data[i * list.stride + off + j]; out[k] = [s, arr]; off += s; }
  return out;
}
// circles = [{ p:[x,y,z], r, c:Color, when:0|1|2, c2:Color, inner:[ox,oy,ratio] (unit-circle coords), vel:[x,y,z] (drift
// half-span, m), w (rad/s), seed, kind:+1 swell | -1 withdraw | 0 throb | 2 still }]. solid: true = opaque circles (1 call),
// else films (2 calls). Returns a Group.
export function makeFilms(circles, opts = {}) {
  const L = instList(20);
  for (const f of circles) {
    const c = f.c, c2 = f.c2 || f.c, inn = f.inner || [0, 0, 0], v = f.vel || [0, 0, 0];
    L.push(f.p[0], f.p[1], f.p[2], f.r, f.when ?? 0, f.seed ?? 0.5, f.kind ?? kindOf(c), c.r, c.g, c.b, c2.r, c2.g, c2.b, inn[0], inn[1], inn[2], v[0], v[1], v[2], f.w ?? 0.1);
  }
  const g = instQuad(split(L, { iPos: 3, iRC: 4, iCol: 3, iCol2: 3, iIn: 3, iVel: 4 }), L.count), grp = new THREE.Group();
  if (opts.solid) grp.add(finish(new THREE.Mesh(g, filmMaterial('solid', opts.U)), opts.order ?? -8));
  else { grp.add(finish(new THREE.Mesh(g, filmMaterial('mul', opts.U)), -4)); grp.add(finish(new THREE.Mesh(g, filmMaterial('exc', opts.U)), -3)); }
  return grp;
}

// ---------------------------------------------------------------------------------------------------------------
// Grain halos: sprayed stipple, never a glow. A view-plane quad whose dots are fixed in the quad's own metres, in
// four sizes of cell (x4 apart); a size whose cell is under ~3 px is replaced by its flat mean tint, one over ~90 px
// is dropped, so there are always discrete dots and nothing shimmers. Uneven, thinning outward. hero: 1 = the ring
// hugs the great circle's edge at any range (density by the eye ray's miss distance). They breathe: rate per halo.
// halos = [{ p, ri, ro, c:Color, when, seed, hero:0|1, rate (rad/s), dens (0..1.5) }]
// ---------------------------------------------------------------------------------------------------------------
export function haloMaterial(u = U) {
  return new THREE.ShaderMaterial({
    uniforms: withU(u), transparent: true, depthTest: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: VERT_HEAD + /* glsl */`
      attribute vec3 iPos, iCol; attribute vec4 iR, iOpt;
      varying vec2 vM; varying vec3 vW, vCol; varying vec4 vR; varying vec3 vOpt;
      void main(){
        vec3 wc = (modelMatrix * vec4(iPos, 1.)).xyz; float d = length(wc - cameraPosition);
        float ro = iR.y, grow = 1.;
        if (iOpt.x > .5) { wc = uHeroC; d = length(wc - cameraPosition); grow = 1.35 * d / sqrt(max(d * d - ro * ro, .09 * d * d)); }
        float br = 1. + .035 * sin(uTime * iOpt.y + iR.w * 6.2832);
        float r = ro * grow * whenScale(iR.z);
        float vz = max(-(viewMatrix * vec4(wc, 1.)).z, .05); r *= step(2., ro / pxSize(vz));
        vec3 cr = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), cu = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        vW = wc + (cr * position.x + cu * position.y) * r;
        vM = position.xy * ro * grow / br; vCol = iCol; vR = iR; vOpt = iOpt.xzw;
        gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
      }`,
    fragmentShader: FRAG_HEAD + /* glsl */`
      varying vec2 vM; varying vec3 vW, vCol; varying vec4 vR; varying vec3 vOpt;
      // one size of dot: returns coverage (discrete dots, or their mean when too small to draw)
      float stip(vec2 m, float cell, float D, float mpp, float seed){
        float px = cell / mpp;
        float mean = D * .045;
        if (px < 2.2) return mean;
        float an = seed * 2.399; vec2 cs = vec2(cos(an), sin(an));                   // every size on its own slant: no lattice
        vec2 g = vec2(m.x * cs.x - m.y * cs.y, m.x * cs.y + m.y * cs.x) / cell + seed * 7.13, id = floor(g), f = fract(g);
        vec2 hh = h22(id + seed); float present = step(h21(id * 1.7 + 3.1 + seed), D * .82);
        float rad = .07 + .30 * hh.x * hh.x + .12 * hh.y;                 // uneven dot sizes, gaps
        vec2 c = rad + (1. - 2. * rad) * h22(id + 17.7 + seed);
        float aa = 1. / px, dd = length(f - c);
        float dot1 = present * (1. - smoothstep(rad - aa, rad + aa, dd));
        float keep = 1. - smoothstep(60., 130., px);
        return mix(mean, dot1, smoothstep(2.2, 4.5, px)) * keep;
      }
      void main(){
        vec3 oc = cameraPosition - uHeroC; vec3 dv = vW - cameraPosition; vec3 d = dv / max(length(dv), 1e-4);
        float b = dot(oc, d), h = sqrt(max(dot(oc, oc) - b * b, 0.));
        float rho = vOpt.x > .5 ? h : length(vM);
        float t = (rho - vR.x) / max(vR.y - vR.x, 1e-3);
        float mpp = max(length(fwidth(vM)) * .7071, 1e-5);
        if (t < 0. || t > 1. || (vOpt.x > .5 && b > 0.)) discard;
        float s = vR.w;
        float lump = .45 + 1.0 * vnoise(vM / max(vR.y, 1e-3) * 5. + s * 31.) ;       // uneven spray: banks and gaps
        float fall = (1. - t); fall = fall * sqrt(fall) * (.55 + .45 * fall);          // thinning outward
        float D = clamp(fall * lump * vOpt.y, 0., 1.) * smoothstep(0., .008, t);
        float base = clamp((vR.y - vR.x) / 430., .004, .13);
        float a = 1.;
        a *= 1. - stip(vM, base, D, mpp, s);
        a *= 1. - stip(vM, base * 2.5, D, mpp, s + 1.);
        a *= 1. - stip(vM, base * 6.25, D, mpp, s + 2.);
        a *= 1. - stip(vM, base * 15.6, D, mpp, s + 3.);
        a *= 1. - stip(vM, base * 39., D * .8, mpp, s + 4.);
        a *= 1. - stip(vM, base * 97., D * .42, mpp, s + 5.);
        a = 1. - a;
        if (a < .004) discard;
        gl_FragColor = vec4(vCol, a);
      }`,
  });
}
export function makeHalos(halos, opts = {}) {
  const L = instList(14);
  for (const f of halos) L.push(f.p[0], f.p[1], f.p[2], f.ri, f.ro, f.when ?? 0, f.seed ?? 0.3, f.c.r, f.c.g, f.c.b, f.hero ?? 0, f.rate ?? 0.6, f.dens ?? 1, 0);
  return finish(new THREE.Mesh(instQuad(split(L, { iPos: 3, iR: 4, iCol: 3, iOpt: 4 }), L.count), opts.material || haloMaterial(opts.U)), opts.order ?? -5);
}

// Real grain: sprayed dots as discs standing in the air, 2 to 20 cm, for the places the lens goes THROUGH a halo.
// Drawn only within ~110 m of the lens (further off the halo quad carries the look). They drift a little.
// grains = flat array, 8 numbers each: x, y, z, radius, when, seed, colourIndex (into opts.colors), 0
export function makeGrain(grains, opts = {}) {
  const n = grains.length / 8, cols = (opts.colors || [new THREE.Color('#E6A39B')]).slice(0, 4);
  while (cols.length < 4) cols.push(cols[0]);
  const a = new Float32Array(grains), ib = new THREE.InstancedInterleavedBuffer(a, 8);
  const g = instQuad({}, n); g.setAttribute('iPos', new THREE.InterleavedBufferAttribute(ib, 4, 0)); g.setAttribute('iG', new THREE.InterleavedBufferAttribute(ib, 4, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: withU(opts.U, { uCols: { value: cols } }), transparent: true, depthTest: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: VERT_HEAD + /* glsl */`
      attribute vec4 iPos, iG; uniform vec3 uCols[4]; varying vec2 vUv; varying vec4 vCA;
      void main(){
        float s = iG.y; vec3 lp = iPos.xyz + .35 * vec3(sin(uTime * .31 + s * 50.), sin(uTime * .23 + s * 81.), cos(uTime * .27 + s * 33.));
        vec4 mv = viewMatrix * modelMatrix * vec4(lp, 1.); float vz = max(-mv.z, .05), px = pxSize(vz);
        float r = iPos.w * whenScale(iG.x), vis = (1. - smoothstep(90., 170., vz)) * smoothstep(.35, 1., r / px);
        r = max(r, px * .9) * step(.01, vis) * step(.3, vz);
        mv.xy += position.xy * r; vUv = position.xy; int ci = int(clamp(iG.z, 0., 3.));
        vCA = vec4(uCols[ci], vis); gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: FRAG_HEAD + /* glsl */`
      varying vec2 vUv; varying vec4 vCA;
      void main(){ float rr = length(vUv), fw = clamp(fwidth(rr), 1e-4, .7); float a = (1. - smoothstep(1. - 1.5 * fw, 1., rr)) * vCA.a;
        if (a < .01) discard; gl_FragColor = vec4(vCA.rgb, a); }`,
  });
  return finish(new THREE.Mesh(g, mat), opts.order ?? -1);
}

// ---------------------------------------------------------------------------------------------------------------
// Ruled lines: axis-billboard ribbons, one weight, square ends, never under 1.5 px, a little heavier at the far end.
// Black on the day ground, ivory where the great circle is behind them or at night, per fragment (the counterchange).
// A line can swim (waves > 0: a wavy line travelling along its own length), hum where the lens is near (hum, m),
// or be ruled again and again by a point (loop, s: see lineHead()). lines = [{ a:[x,y,z], b:[x,y,z], w (m), when,
// seed, wave (m), waves (count), hum (m), loop (s), bow (m: one compass arc, sagitta) , bowDir:[x,y,z] }]
// opts.segs: ribbon segments (1 for dead-straight lines, 24+ for any that bend, swim or hum).
// ---------------------------------------------------------------------------------------------------------------
export const lineHead = (time, loop, seed) => { const tt = ((time / loop + seed) % 1 + 1) % 1, s = Math.min(1, tt / 0.6); return s * s * (3 - 2 * s); };
export function lineMaterial(u = U) {
  return new THREE.ShaderMaterial({
    uniforms: withU(u, { uRule: { value: 1 }, uStrike: { value: 0 } }), transparent: true, depthTest: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: VERT_HEAD + /* glsl */`
      attribute vec3 iA, iB; attribute vec4 iL, iM, iBow; uniform float uRule, uStrike;
      varying float vV, vA; varying vec3 vW;
      vec3 at(float t, vec3 A, vec3 B, vec3 dir, float len, vec3 n1){
        vec3 p = mix(A, B, t);
        if (iBow.w < 0.) { float hh = -iBow.w, c2 = len * .5, rho = (c2 * c2 + hh * hh) / max(2. * hh, 1e-3), th = (2. * t - 1.) * asin(clamp(c2 / max(rho, 1e-3), 0., 1.));
          p = mix(A, B, .5) + iBow.xyz * (rho * cos(th) - (rho - hh)) + dir * (rho * sin(th)); }
        else p += iBow.xyz * (iBow.w * 4. * t * (1. - t));                                           // one compass arc
        float ph = t * iM.x * 6.2832 - uTime * 2.2 - iL.z * 9.;
        p += n1 * iL.w * sin(ph) * step(.5, iM.x) + dir * (iL.w * 2.5 * sin(uTime * .35 + iL.z * 20.)) * step(.5, iM.x);   // swimmer
        float near = max(uStrike, 1. - smoothstep(12., 75., length((modelMatrix * vec4(p, 1.)).xyz - cameraPosition)));
        p += n1 * iM.y * near * sin(t * 3.14159 * (3. + floor(iL.z * 5.))) * sin(uTime * 17. + iL.z * 60.);   // hum
        return p;
      }
      void main(){
        vec3 A = iA, B = iB; vec3 dv = B - A; float len = max(length(dv), 1e-3); vec3 dir = dv / len;
        vec3 n1 = cross(dir, vec3(.31, .9, .29)); n1 /= max(length(n1), 1e-3);
        float t = position.x * .5 + .5;
        if (iM.z > .01) { float tt = fract(uTime / iM.z + iL.z); float head = smoothstep(0., .6, tt), tail = smoothstep(.82, 1., tt); t = clamp(t, tail, head); }
        if (iM.w > .5) t = min(t, uRule);
        vec3 p = at(t, A, B, dir, len, n1), p2 = at(min(t + .01, 1.), A, B, dir, len, n1), p0 = at(max(t - .01, 0.), A, B, dir, len, n1);
        vec3 wp = (modelMatrix * vec4(p, 1.)).xyz, tg = mat3(modelMatrix) * (p2 - p0); tg /= max(length(tg), 1e-5);
        vec3 te = cameraPosition - wp; vec3 sd = cross(tg, te); sd /= max(length(sd), 1e-5);
        float vz = max(-(viewMatrix * vec4(wp, 1.)).z, .05), px = pxSize(vz);
        float w = iL.x * (1. + .3 * smoothstep(1. - 4. * iL.x / len, 1., t));                   // ink heavier at the end
        vA = iM.w > 1.5 ? clamp(iL.x / (1.6 * px), 0., 1.) : 1.;
        w = max(w, 1.6 * px) * .5 * whenScale(iL.y) * step(.15, vA);
        w += px * .75 * step(1e-4, w);                                                           // room for the edge
        vV = position.y * (w / max(w - px * .75, 1e-4)); vW = wp + sd * position.y * w;
        gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
      }`,
    fragmentShader: FRAG_HEAD + /* glsl */`
      varying float vV, vA; varying vec3 vW;
      void main(){ float v = abs(vV), fw = clamp(fwidth(vV), 1e-4, 1.); float a = (1. - smoothstep(1. - fw, 1. + fw, v)) * vA;
        if (a < .01) discard; gl_FragColor = vec4(mix(uInk, uIvory, heroCover(vW)), a); }`,
  });
}
export function makeLines(lines, opts = {}) {
  const L = instList(18);
  for (const f of lines) { const bd = f.bowDir || [0, 1, 0];
    L.push(f.a[0], f.a[1], f.a[2], f.b[0], f.b[1], f.b[2], f.w ?? 0.3, f.when ?? 0, f.seed ?? 0.5, f.wave ?? 0, f.waves ?? 0, f.hum ?? 0, f.loop ?? 0, f.ruled ?? 0, bd[0], bd[1], bd[2], f.bow ?? 0); }
  return finish(new THREE.Mesh(instQuad(split(L, { iA: 3, iB: 3, iL: 4, iM: 4, iBow: 4 }), L.count, opts.segs ?? 1), opts.material || lineMaterial(opts.U)), opts.order ?? -2);
}
// a bundle of n unequal parallels (no two gaps equal, unequal lengths): returns line records
export function bundle(rng, a, b, n, gap, o = {}) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length(); d.normalize();
  const side = new THREE.Vector3(...(o.side || [0.2, 1, 0.1])).cross(d).normalize(), out = []; let off = -gap * (n - 1) * 0.5;
  for (let i = 0; i < n; i++) {
    const s0 = rng.range(0, 0.22) * len, s1 = len - rng.range(0, 0.22) * len;
    const pa = A.clone().addScaledVector(d, s0).addScaledVector(side, off), pb = A.clone().addScaledVector(d, s1).addScaledVector(side, off);
    out.push({ a: pa.toArray(), b: pb.toArray(), w: (o.w ?? 0.3) * rng.range(0.7, 1.5), when: o.when ?? 0, seed: rng(), hum: o.hum ?? 0 });
    off += gap * rng.range(0.55, 1.6);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Triangle plates: flat acute plates with a ruled black edge (ivory on the dark) and a paler triangle inside, cut in
// the fragment shader. Each is turned in the vertex shader so it never stands more than 55 degrees off the lens
// (never a sliver). c2 is the fill it takes where the great circle is behind it (the counterchange). vel/span make
// a dart: it flies point first along vel (m/s) and wraps over span metres, scaling in and out at the ends.
// plates = [{ p:[x,y,z] (base centre), axis:[x,y,z] (base -> apex), n:[x,y,z] (facing), h, hb (half base), lean (-1..1),
//             edge (m), c, c2, when, seed, vel:[x,y,z], span }]
// ---------------------------------------------------------------------------------------------------------------
export function plateMaterial(u = U) {
  return new THREE.ShaderMaterial({
    uniforms: withU(u), transparent: true, depthTest: true, depthWrite: true, side: THREE.DoubleSide,
    vertexShader: VERT_HEAD + /* glsl */`
      attribute vec3 iPos, iCol, iCol2; attribute vec4 iAx, iN, iS, iVel;
      varying vec2 vP; varying vec4 vS; varying vec3 vW, vCol, vCol2; varying float vSeed;
      void main(){
        float sc = whenScale(iAx.w); vec3 lp = iPos;
        if (iVel.w > .5) { float s = mod(uTime + iN.w * 97., iVel.w / max(length(iVel.xyz), 1e-3)); float f = s * length(iVel.xyz) / iVel.w;
          lp += iVel.xyz * s - iVel.xyz / max(length(iVel.xyz), 1e-3) * iVel.w * .5; sc *= smoothstep(0., .06, f) * (1. - smoothstep(.94, 1., f)); }
        mat3 M = mat3(modelMatrix);
        vec3 e2 = M * iAx.xyz; e2 /= max(length(e2), 1e-4); vec3 n = M * iN.xyz; n -= e2 * dot(n, e2); n /= max(length(n), 1e-4); vec3 e1 = cross(e2, n);
        vec3 wc = (modelMatrix * vec4(lp, 1.)).xyz + e2 * iS.x * .4;
        vec3 v = cameraPosition - wc; v /= max(length(v), 1e-4);
        float c = dot(n, v); if (c < 0.) { n = -n; e1 = -e1; c = -c; }
        if (c < .5736) {                                                  // more than 55 degrees off: turn toward the lens
          vec3 perp = n - v * c; perp /= max(length(perp), 1e-4);
          vec3 n2 = v * .5736 + perp * .8192; vec3 k = cross(n, n2); float sk = length(k);
          if (sk > 1e-4) { k /= sk; float ck = clamp(dot(n, n2), -1., 1.);
            e1 = e1 * ck + cross(k, e1) * sk + k * dot(k, e1) * (1. - ck); e2 = e2 * ck + cross(k, e2) * sk + k * dot(k, e2) * (1. - ck); }
        }
        float hbx = iS.y * max(1., abs(iS.w)) * 1.06;
        vec2 q = vec2(position.x * hbx, (position.y * .53 + .5) * iS.x) ;
        wc -= e2 * iS.x * .4;
        vW = wc + (e1 * q.x + e2 * q.y) * sc; vP = q; vS = iS; vCol = iCol; vCol2 = iCol2; vSeed = iN.w;
        gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
      }`,
    fragmentShader: FRAG_HEAD + /* glsl */`
      varying vec2 vP; varying vec4 vS; varying vec3 vW, vCol, vCol2; varying float vSeed;
      float edgeD(vec2 p, vec2 a, vec2 b){ vec2 e = b - a; return (e.x * (p.y - a.y) - e.y * (p.x - a.x)) / max(length(e), 1e-4); }
      void main(){
        vec2 A = vec2(-vS.y, 0.), B = vec2(vS.y, 0.), C = vec2(vS.w * vS.y, vS.x);
        float d = min(edgeD(vP, A, B), min(edgeD(vP, B, C), edgeD(vP, C, A)));
        float fw = clamp(length(fwidth(vP)) * .7071, 1e-5, 10.);
        float a = smoothstep(-fw, fw, d); if (a < .01) discard;
        float ew = max(vS.z, 1.6 * fw);
        float edge = 1. - smoothstep(ew - fw, ew + fw, d);
        float inr = vS.x * vS.y / max(vS.y + length(C - A) * .5 + length(C - B) * .5, 1e-3);      // inradius
        float inset = inr * (.34 + .2 * fract(vSeed * 7.3));
        float inner = smoothstep(inset - fw, inset + fw, d);
        float cover = heroCover(vW);
        vec3 fill = mix(vCol, vCol2, cover);
        vec3 pale = mix(fill, mix(uPaper, uIvory, cover), .5) * (1. + (vnoise(vP * 1.3 + vSeed * 40.) - .5) * .07);
        vec3 col = mix(fill, pale, inner);
        col = mix(col, mix(uInk, uIvory, cover), edge);
        gl_FragColor = vec4(col, a);
      }`,
  });
}
export function makePlates(plates, opts = {}) {
  const L = instList(25);
  for (const f of plates) { const c = f.c, c2 = f.c2 || f.c, v = f.vel || [0, 0, 0];
    L.push(f.p[0], f.p[1], f.p[2], c.r, c.g, c.b, c2.r, c2.g, c2.b, f.axis[0], f.axis[1], f.axis[2], f.when ?? 0, f.n[0], f.n[1], f.n[2], f.seed ?? 0.5,
      f.h, f.hb, f.edge ?? Math.max(0.12, f.h * 0.012), f.lean ?? 0, v[0], v[1], v[2], f.span ?? 0); }
  return finish(new THREE.Mesh(instQuad(split(L, { iPos: 3, iCol: 3, iCol2: 3, iAx: 4, iN: 4, iS: 4, iVel: 4 }), L.count), opts.material || plateMaterial(opts.U)), opts.order ?? -6);
}

// ---------------------------------------------------------------------------------------------------------------
// Chequers: sheared boards of flat squares, many hues, some black (ivory on the dark), some empty; never turned.
// Each square wipes from c to c2 as the material's uWake passes its own threshold (wake, 0..1): set mesh.setWake(v)
// from distance or progress. squares = [{ p:[x,y,z] centre, u:[x,y,z], v:[x,y,z] (half edges), c, c2, ink:0|1, wake, when, seed }]
// chequerBoard() lays one board out: uneven rows and columns, sheared, with holes.
// ---------------------------------------------------------------------------------------------------------------
export function chequerMaterial(u = U) {
  return new THREE.ShaderMaterial({
    uniforms: withU(u, { uWake: { value: 0 } }), transparent: true, depthTest: true, depthWrite: true, side: THREE.DoubleSide,
    vertexShader: VERT_HEAD + /* glsl */`
      attribute vec3 iPos, iCol, iCol2; attribute vec4 iU, iV, iW; uniform float uWake;
      varying vec2 vUv; varying vec3 vW, vCol, vCol2; varying vec3 vK;
      void main(){
        float sc = whenScale(iU.w) * 1.04;
        vec3 lp = iPos + (iU.xyz * position.x + iV.xyz * position.y) * sc;
        vW = (modelMatrix * vec4(lp, 1.)).xyz; vUv = position.xy * 1.04; vCol = iCol; vCol2 = iCol2;
        vK = vec3(clamp((uWake - iW.x) / .12, 0., 1.), iW.y, iV.w);
        gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
      }`,
    fragmentShader: FRAG_HEAD + /* glsl */`
      varying vec2 vUv; varying vec3 vW, vCol, vCol2; varying vec3 vK;
      void main(){
        vec2 fw = clamp(fwidth(vUv), 1e-5, 1.), e = vec2(1.) - smoothstep(vec2(1.) - fw, vec2(1.) + fw, abs(vUv));
        float a = e.x * e.y; if (a < .01) discard;
        float cover = heroCover(vW);
        float sweep = vUv.x * .5 + .5 + (vUv.y * .5) * (vK.z - .5) * .5;                  // the wipe runs across on a slight slant
        float w = smoothstep(-fw.x, fw.x, vK.x * 1.3 - .15 - sweep);
        vec3 col = mix(vCol, vCol2, w);
        col = mix(col, mix(uInk, uIvory, cover), vK.y);
        col *= 1. + (vnoise(vUv * 2.1 + vK.z * 50.) - .5) * .06;
        gl_FragColor = vec4(col, a);
      }`,
  });
}
export function makeChequer(squares, opts = {}) {
  const L = instList(21);
  for (const f of squares) { const c = f.c, c2 = f.c2 || f.c;
    L.push(f.p[0], f.p[1], f.p[2], c.r, c.g, c.b, c2.r, c2.g, c2.b, f.u[0], f.u[1], f.u[2], f.when ?? 0, f.v[0], f.v[1], f.v[2], f.seed ?? 0.5, f.wake ?? 0.5, f.ink ?? 0, 0, 0); }
  const m = finish(new THREE.Mesh(instQuad(split(L, { iPos: 3, iCol: 3, iCol2: 3, iU: 4, iV: 4, iW: 4 }), L.count), opts.material || chequerMaterial(opts.U)), opts.order ?? -7);
  m.setWake = (v) => { m.material.uniforms.uWake.value = v; }; return m;
}
// origin: a corner; U, V: unit-ish edge directions (shear them yourself); nu, nv squares of about `size` metres.
// hues: Colors to draw from; o: { ink: share black (0.3), empty: share left out (0.15), keepEmpty: [[i,j],...], when, from: Color the
// squares wake from (default: their own hue) }
export function chequerBoard(rng, origin, U_, V_, nu, nv, size, hues, o = {}) {
  const O = new THREE.Vector3(...origin), Uv = new THREE.Vector3(...U_), Vv = new THREE.Vector3(...V_), out = [];
  const cu = [0], cv = [0];
  for (let i = 0; i < nu; i++) cu.push(cu[i] + size * rng.range(0.82, 1.2));
  for (let j = 0; j < nv; j++) cv.push(cv[j] + size * rng.range(0.82, 1.2));
  const holes = new Set((o.keepEmpty || []).map((e) => e[0] + ',' + e[1]));
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const r1 = rng(), r2 = rng(), c = rng.pick(hues), sd = rng(), wk = rng();
    if (holes.has(i + ',' + j) || r1 < (o.empty ?? 0.15)) continue;
    const ink = r2 < (o.ink ?? 0.3) && (i + j) % 2 === 0 ? 1 : 0;
    const hu = (cu[i + 1] - cu[i]) * 0.5, hv = (cv[j + 1] - cv[j]) * 0.5;
    const p = O.clone().addScaledVector(Uv, cu[i] + hu).addScaledVector(Vv, cv[j] + hv);
    out.push({ p: p.toArray(), u: Uv.clone().multiplyScalar(hu).toArray(), v: Vv.clone().multiplyScalar(hv).toArray(), c: o.from || c, c2: c, ink, wake: 0.08 + 0.8 * wk, when: o.when ?? 0, seed: sd });
  }
  return out;
}

// Hatch showers: short ruled strokes on the slant, falling at uFall (m/s), wrapped by modulo in a box round the lens
// (world space, so they slide in parallax; not a filter). uRain 0..1 is how many of them are there. Black on the
// ground, ivory over the great circle. Day forms. count strokes, one draw call.
export function makeHatch(count, opts = {}) {
  const a = new Float32Array(count * 4), r = opts.rng || ((i) => (Math.sin(i * 127.1 + 3.3) * 43758.5453) % 1);
  for (let i = 0; i < count * 4; i++) { const v = r(i); a[i] = v - Math.floor(v); }
  const mat = new THREE.ShaderMaterial({
    uniforms: withU(opts.U, { uBox: { value: opts.box ?? 130 }, uFall: { value: (opts.fall || new THREE.Vector3(7, -17, 6)).clone() }, uRain: { value: 0 }, uLen: { value: opts.len ?? 1.5 } }),
    transparent: true, depthTest: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: VERT_HEAD + /* glsl */`
      attribute vec4 iS; uniform float uBox, uRain, uLen; uniform vec3 uFall; varying float vV; varying vec3 vW;
      void main(){
        float box = max(uBox, 1.);
        vec3 q = iS.xyz * box + uFall * uTime * (.8 + .4 * iS.w);
        vec3 c = cameraPosition + mod(q - cameraPosition, vec3(box)) - .5 * box;
        vec3 dir = uFall / max(length(uFall), 1e-3);
        float dist = length(c - cameraPosition), len = uLen * (.55 + .9 * fract(iS.w * 7.31));
        vec3 te = cameraPosition - c; vec3 sd = cross(dir, te); sd /= max(length(sd), 1e-4);
        float vz = max(-(viewMatrix * vec4(c, 1.)).z, .05), px = pxSize(vz);
        float on = step(iS.w, uRain) * (1. - uNight) * step(4., len / px) * (1. - smoothstep(.36 * box, .48 * box, dist)) * smoothstep(1.5, 4., dist);
        float w = max(.07, 1.6 * px) * .5 * on; w += px * .75 * step(1e-5, w);
        vV = position.y * (w / max(w - px * .75, 1e-4));
        vW = c + dir * position.x * len * .5 * on + sd * position.y * w;
        gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
      }`,
    fragmentShader: FRAG_HEAD + /* glsl */`
      varying float vV; varying vec3 vW;
      void main(){ float v = abs(vV), fw = clamp(fwidth(vV), 1e-4, 1.); float a = 1. - smoothstep(1. - fw, 1. + fw, v);
        if (a < .01) discard; gl_FragColor = vec4(mix(uInk, uIvory, heroCover(vW)), a); }`,
  });
  const m = finish(new THREE.Mesh(instQuad({ iS: [4, a] }, count), mat), opts.order ?? -1.5);
  m.setRain = (v) => { mat.uniforms.uRain.value = v; }; return m;
}

// The crossing: one wash over the lens, multiply, white when idle (the only screen-space thing in the world).
export function makeWash() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uWash: { value: new THREE.Color(1, 1, 1) } }, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: 'uniform vec3 uWash; void main(){ gl_FragColor = vec4(uWash, 1.); }',
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
  });
  return finish(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat), 900);
}

// ===============================================================================================================
// THE HERO: the great circle, and the night inside it
// ===============================================================================================================
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = opts.detail ?? ctx.quality?.detail ?? 1;
  const P = pigments(opts.palette), HU = opts.U || makeUniforms(), UO = { U: HU };
  const R = 125, C0 = V3(0, R, 0), root = new THREE.Group();
  const rv = rng.fork('variant'), rd = rng.fork('day'), rn = rng.fork('night'), rg = rng.fork('grain');
  // per-seed variety: which halo and companion, which ground, where the core and the companion sit
  const dev = new URLSearchParams(opts.devQuery || '');   // no URL read: pass opts.devQuery ('wchnight=1&wchu=0.3') to use the viewer hooks
  const devN = (k) => (dev.has(k) ? +dev.get(k) : null);   // set-piece viewer only: wchnight, wchvariant, wchground
  const variant = opts.variant ?? devN('wchvariant') ?? (rv() < 0.6 ? 0 : (rv() < 0.5 ? 1 : 2));
  const haloCol = [P.rose, P.yellow, P.pblue][variant], compCol = [P.red, P.blue, P.orange][variant], compHalo = [P.yellow, P.white, P.yellow][variant];
  const ground = opts.ground ?? devN('wchground') ?? (rv() < 0.6 ? 0 : (rv() < 0.5 ? 1 : 2));
  HU.uPaper.value.copy([P.buff, P.ochre, P.white][ground]); HU.uInk.value.copy(P.black); HU.uIvory.value.copy(P.white);
  HU.uHeroR.value = R;
  const coreA = rv.range(2.2, 3.0), coreD = rv.range(20, 33), compA = rv.range(0.5, 0.82);
  if (opts.field !== false) root.add(makeField({ U: HU, pig: P, seed: rv.range(0, 9), cloud: [P.ochre, P.buff, P.rose][ground], toward: P.pblue }));
  const great = makeGreatCircle({ U: HU, pig: P, core: [Math.cos(coreA) * coreD, Math.sin(coreA) * coreD, 85], seed: rv.range(0, 9) });
  root.add(great);
  await ctx.yield();

  // route inside (local): in at the skin where the rail meets it, 30 m on along the line, then to starboard and down
  const S = V3(-50, 75, 104), T = V3(64, 22, -516).normalize();
  const fly = [S.clone().addScaledVector(T, -90), S.clone().addScaledVector(T, -40), S.clone(), S.clone().addScaledVector(T, 30),
    V3(-36, 66, 20), V3(-10, 40, -60), V3(30, 5, -140), V3(80, -30, -215), V3(135, -57, -280), V3(186.8, -75.1, -323.5)];
  const curve = new THREE.CatmullRomCurve3(fly.slice(2), false, 'centripetal');
  const exitDir = fly[9].clone().sub(fly[8]).normalize(), seat = fly[9].clone();
  const eR = V3().crossVectors(exitDir, V3(0, 1, 0)).normalize(), eUp = V3().crossVectors(eR, exitDir).normalize();
  const routePts = curve.getSpacedPoints(160);
  const routeDist = (p) => { let m = 1e9; for (let i = 0; i < routePts.length; i++) { const d = routePts[i].distanceToSquared(p); if (d < m) m = d; } return Math.sqrt(m); };
  const exitClear = (p, r) => { const v = p.clone().sub(seat), ax = v.dot(exitDir); return ax < -115 || ax > 12 || v.addScaledVector(exitDir, -ax).length() > 15 + r * 1.6; };
  const railDist = (p) => { const v = p.clone().sub(S), s = Math.min(30, v.dot(T)); return v.addScaledVector(T, -s).length(); };

  const films = [], solids = [], halos = [], lines = [], bent = [], plates = [], squares = [];
  const warm = [P.yellow, P.orange, P.yellow, P.red, P.rose], cool = [P.pblue, P.green, P.lviolet, P.blue, P.white];
  const drift = (r, amp) => { const a = r.range(0, 6.283), e = r.range(-0.35, 0.35); return [Math.cos(a) * amp, Math.sin(a) * amp * 0.8 + e * amp, Math.sin(a + 1.3) * amp * 0.4]; };

  // --- DAY: halo, companion, films on the face, piercing lines, triangle and chequer astride the rim ---------------
  halos.push({ p: C0.toArray(), ri: R - 0.5, ro: R + 55, c: haloCol, when: 0, seed: rv(), hero: 1, rate: 0.35, dens: 1.5 });
  const cp = V3(Math.cos(compA) * (R + 9), R + Math.sin(compA) * (R + 9), 16);
  solids.push({ p: cp.toArray(), r: 32.5, c: compCol, when: 0, seed: rv(), kind: 0, vel: [0, 0, 0] });
  halos.push({ p: [cp.x, cp.y, cp.z - 1], ri: 32.5, ro: 32.5 * 1.6, c: compHalo, when: 0, seed: rv(), rate: 1.4, dens: 2.6 });
  const nFace = 13;
  for (let i = 0; i < nFace + 9 + 6; i++) {
    const onFace = i < nFace, back = i >= nFace + 9, a = rd.range(0, 6.283), rad = onFace || back ? rd.range(8, 118) : rd.range(120, 200);
    const r = i < 2 ? rd.range(15, 23) : 4 + 17 * rd() * rd(), z = back ? -rd.range(140, 190) : (onFace ? rd.range(R * 0.25, R + 40) : rd.range(-20, 150));
    const c = rd.pick(rd() < 0.55 ? warm : cool), holds = rd() < 0.25;
    films.push({ p: [Math.cos(a) * rad, R + Math.sin(a) * rad, z], r, c, when: 0, seed: rd(), vel: drift(rd, onFace ? rd.range(26, 60) : rd.range(14, 46)), w: onFace ? rd.range(0.13, 0.3) : rd.range(0.05, 0.13),
      c2: rd.pick(cool), inner: holds ? [rd.range(-0.2, 0.2), rd.range(-0.2, 0.2), rd.range(0.3, 0.55)] : [0, 0, 0] });
    if (rd() < 0.34) halos.push({ p: films[films.length - 1].p, ri: r, ro: r * rd.range(1.3, 1.6), c: rd.pick([P.yellow, P.white, P.rose]), when: 0, seed: rd(), rate: rd.range(0.4, 1.3), dens: 1.1 });
  }
  // the rail's last 200 m and its 30 m inside; two ruled diagonals that pierce the circle; a stave of unequal parallels
  const railA = S.clone().addScaledVector(T, -200), railB = S.clone().addScaledVector(T, 30), railLine = { a: railA.toArray(), b: railB.toArray(), w: 0.3, when: 0, seed: 0.11 };
  if (opts.rail !== false) lines.push(railLine);
  const j = (s) => rd.range(-s, s);
  bent.push({ a: [-235 + j(20), 262 + j(20), 62], b: [205 + j(20), -34 + j(20), 96], w: 0.55, when: 0, seed: rd(), hum: 0.3 });
  bent.push({ a: [-190 + j(20), 26 + j(20), 132], b: [246 + j(20), 222 + j(20), 44], w: 0.32, when: 0, seed: rd(), hum: 0.3 });
  for (const l of bundle(rd, [-150 + j(15), 10 + j(10), 70], [-28 + j(15), -52 + j(10), 86], rd.int(4, 6), 3.2, { w: 0.28, side: [0, 0, 1] })) lines.push(l);
  bent.push({ a: [-120, 255, 30], b: [150, 300, 40], w: 0.3, when: 0, seed: rd(), loop: rd.range(7, 10) });          // a point rules this one over and over
  bent.push({ a: [60 + j(10), 6, 150], b: [78 + j(10), 4, 152 + j(4)], w: 0.3, when: 0, seed: rd(), wave: 0.9, waves: 6 });
  bent.push({ a: [-175, 150 + j(20), 60], b: [-163, 156 + j(20), 64], w: 0.26, when: 0, seed: rd(), wave: 0.7, waves: 7 });
  // the edged triangle astride the lower starboard rim, and the sheared 5 by 5 chequer astride the port rim
  const ta = -rd.range(0.5, 0.8), tb = V3(Math.cos(ta) * (R + 20), R + Math.sin(ta) * (R + 20), 24);
  plates.push({ p: tb.toArray(), axis: [-Math.cos(ta) * 0.9 - 0.2, -Math.sin(ta) * 0.9 + 0.38, 0], n: [0, 0, 1], h: 96, hb: 17, lean: 0.3, edge: 0.9, c: P.yellow, c2: P.pblue, when: 0, seed: rd() });
  plates.push({ p: [tb.x + 34, tb.y - 6, 40], axis: [-0.25, 1, 0], n: [0.1, 0, 1], h: 38, hb: 7, lean: -0.2, edge: 0.5, c: P.orange, c2: P.yellow, when: 0, seed: rd() });
  const qa = rd.range(3.25, 3.6), sq = 9.5;
  const qo = V3(Math.cos(qa) * (R + 3) - 2.5 * sq, R + Math.sin(qa) * (R + 3) - 2.5 * sq, 30);
  for (const s of chequerBoard(rd, qo.toArray(), [1, 0.06, 0], [0.21, 0.98, 0], 5, 5, sq, [P.yellow, P.red, P.pblue, P.orange, P.green, P.lviolet, P.rose], { ink: 0.5, empty: 0.16 })) squares.push(s);
  await ctx.yield();

  // --- NIGHT: six thinned tiers of films falling away round the route, strung with ivory lines ---------------------
  const nightCols = [P.yellow, P.orange, P.red, P.pblue, P.rose, P.green, P.lviolet, P.white, P.yellow, P.pblue];
  const perp = (tg, r, d) => { const a = V3().crossVectors(tg, V3(0, 1, 0)).normalize(), b = V3().crossVectors(a, tg).normalize(), an = r.range(0, 6.283); return a.multiplyScalar(Math.cos(an) * d).addScaledVector(b, Math.sin(an) * d); };
  const calm = (p, r, v) => (exitClear(p, r + 17) ? v : [0, 0, 0]);   // a film whose drift could carry it over the exit stays put
  const addNightFilm = (p, r, c, r_, far) => {
    const holds = r_() < 0.2, f = { p: p.toArray(), r, c, when: 1, seed: r_(), vel: far ? [0, 0, 0] : calm(p, r, drift(r_, r_.range(5, 26))), w: r_.range(0.04, 0.11), c2: r_.pick(nightCols), inner: holds ? [r_.range(-0.2, 0.2), r_.range(-0.2, 0.2), r_.range(0.3, 0.55)] : [0, 0, 0] };
    films.push(f);
    if (r_() < 0.33) halos.push({ p: f.p, ri: r, ro: r * r_.range(1.3, 1.6), c: r_.pick([P.yellow, P.white, P.rose, P.pblue]), when: 1, seed: r_(), rate: r_.range(0.3, 1.4), dens: 1.15 });
  };
  const perTier = Math.round(56 * (0.4 + 0.6 * detail));
  for (let k = 0; k < 6; k++) {
    const y = 62 - 25 * k;
    for (let i = 0; i < perTier; i++) {
      const q = curve.getPointAt(rn()), an = rn.range(0, 6.283), d = 12 + 250 * Math.pow(rn(), 1.35), r = 1.2 + 15 * rn() * rn() * rn() + (rn() < 0.05 ? 12 : 0), thin = rn();
      const p = V3(q.x + Math.cos(an) * d, y + rn.range(-4.5, 4.5), q.z + Math.sin(an) * d), c = rn.pick(nightCols), rdist = routeDist(p), ok = rdist > r * 1.5 + 5 && (rdist > 45 || thin < 0.4) && exitClear(p, r);   // room for the drift; thinned round the route
      if (ok) addNightFilm(p, r, c, rn);
    }
    await ctx.yield();
  }
  for (let i = 0; i < 15; i++) {                                    // a film within about 5 m every second of the drop
    const u = 0.06 + 0.72 * (i + rn.range(0.2, 0.8)) / 15, q = curve.getPointAt(u), tg = curve.getTangentAt(u), r = rn.range(1.1, 2.8);
    const p = q.clone().add(perp(tg, rn, r + rn.range(4.2, 6.5)));
    films.push({ p: p.toArray(), r, c: rn.pick(nightCols), when: 1, seed: rn(), vel: tg.clone().multiplyScalar(rn.range(2, 6)).toArray(), w: rn.range(0.1, 0.2) });
  }
  for (let i = 0; i < 9; i++) {                                     // far and round: blue, large
    const an = rn.range(0, 6.283), d = rn.range(260, 420), p = V3(60 + Math.cos(an) * d, rn.range(-150, 90), -150 + Math.sin(an) * d);
    addNightFilm(p, rn.range(18, 44), rn.pick([P.blue, P.blue, P.lviolet, P.violet, P.green]), rn, true);
  }
  // the ONE subject: the dark-blue circle with its off-centre black heart, white grain corona, and the exit on the heart's rim
  const ga = rn.range(-0.85, -0.4), ea = ga - rn.range(0.5, 0.9), g2 = [Math.cos(ga), Math.sin(ga)], e2 = [Math.cos(ea), Math.sin(ea)];
  const Q = seat.clone().addScaledVector(exitDir, 40), on = (x, y, back = 0) => Q.clone().addScaledVector(eR, x).addScaledVector(eUp, y).addScaledVector(exitDir, -back);
  const Bc = on(40 * g2[0] - 30 * e2[0], 40 * g2[1] - 30 * e2[1]);
  solids.push({ p: Bc.toArray(), r: 75, c: P.blue, c2: P.black, inner: [e2[0] * 0.4, e2[1] * 0.4, 40 / 75], when: 1, seed: rn(), kind: -1 });
  halos.push({ p: Bc.clone().addScaledVector(exitDir, 1).toArray(), ri: 75, ro: 75 * 1.45, c: P.white, when: 1, seed: rn(), rate: 0.3, dens: 1.3 });
  halos.push({ p: seat.clone().addScaledVector(exitDir, 0.6).toArray(), ri: 7.2, ro: 13.5, c: P.yellow, when: 1, seed: rn(), rate: 1.5, dens: 1.4 });
  if (opts.exitDisc !== false) solids.push({ p: seat.clone().addScaledVector(exitDir, 0.5).toArray(), r: 7, c: P.white, when: 1, seed: rn(), kind: 2 });
  for (let i = 0; i < 3; i++) {                                     // three films lap the blue circle, clear of the exit axis
    const a = ga + 2.2 + i * 1.5 + rn.range(-0.3, 0.3), r = rn.range(13, 24), d = Math.max(r + 12, rn.range(30, 62));
    films.push({ p: on(Math.cos(a) * d, Math.sin(a) * d, rn.range(7, 14)).toArray(), r, c: [P.yellow, P.rose, P.green][i], when: 1, seed: rn(), vel: [eR.x * 5, eR.y * 5 + 2, eR.z * 5], w: 0.08 });
  }
  lines.push({ a: on(-150, -40 + rn.range(-10, 10), 6).toArray(), b: on(120, 62 + rn.range(-10, 10), 6).toArray(), w: 0.4, when: 1, seed: rn() });       // two ivory lines cross the heart
  lines.push({ a: on(-60, 120, 9).toArray(), b: on(74 + rn.range(-10, 10), -130, 9).toArray(), w: 0.28, when: 1, seed: rn() });
  plates.push({ p: on(-46, -84, 12).toArray(), axis: eUp.clone().addScaledVector(eR, 0.3).normalize().toArray(), n: exitDir.clone().negate().toArray(), h: 78, hb: 10, lean: 0.25, edge: 0.7, c: P.rose, c2: P.rose, when: 1, seed: rn() });
  const hU = eR.clone().addScaledVector(eUp, 0.1), hV = eUp.clone().addScaledVector(eR, 0.26), bo = on(g2[0] * 31, g2[1] * 31, 10).addScaledVector(hU, -13.5).addScaledVector(hV, -16);
  const heartSq = chequerBoard(rn, bo.toArray(), hU.toArray(), hV.toArray(), 6, 7, 4.6, [P.yellow, P.red, P.pblue, P.orange, P.green, P.rose, P.white], { ink: 0.22, empty: 0.12, when: 1, from: P.violet.clone().multiplyScalar(0.55) })
    .filter((s) => V3(...s.p).sub(seat).cross(exitDir).length() > 11.5);
  await ctx.yield();

  // ivory ruled lines at free angles, six of them crossing 3 to 8 m from the route; they hum as the lens passes
  const lineClear = (a, b, min) => { const n = Math.ceil(a.distanceTo(b) / 4), p = V3(); for (let i = 0; i <= n; i++) { if (routeDist(p.lerpVectors(a, b, i / n)) < min) return false; } return true; };
  for (let i = 0; i < 12; i++) {
    for (let tries = 0; tries < 6; tries++) {
      const u = i < 6 ? 0.1 + 0.75 * (i + rn()) / 6 : rn(), q = curve.getPointAt(u), tg = curve.getTangentAt(u);
      const off = perp(tg, rn, i < 6 ? rn.range(3.6, 8) : rn.range(20, 130)), dir = V3(rn.range(-1, 1), rn.range(-0.55, 0.55), rn.range(-1, 1)).normalize();
      if (i < 6) dir.addScaledVector(off.clone().normalize(), -dir.dot(off.clone().normalize())).addScaledVector(tg, -0.6 * dir.dot(tg)).normalize();   // pass by, do not come at the lens
      const len = i < 6 ? rn.range(60, 200) : rn.range(120, 400), sh = rn.range(0.25, 0.75), c = q.clone().add(off), a = c.clone().addScaledVector(dir, -len * sh), b = c.clone().addScaledVector(dir, len * (1 - sh));
      if (!lineClear(a, b, 3.2)) continue;
      bent.push({ a: a.toArray(), b: b.toArray(), w: i < 6 ? rn.range(0.07, 0.16) : rn.range(0.2, 0.5), when: 1, seed: rn(), hum: i < 6 ? 0.3 : 0 }); break;
    }
  }
  { // the second harp: 9 strings 120 m long, 5 to 11 m apart, slanted across the route, which passes through its widest gap
    const q = curve.getPointAt(0.43), tg = curve.getTangentAt(0.43), ax = V3().crossVectors(tg, V3(0, 1, 0)).normalize(), sd = V3(0, 1, 0).addScaledVector(ax, 0.36).addScaledVector(tg, 0.2).normalize();
    let off = -5.4; const offs = [];
    for (let i = 0; i < 4; i++) { offs.push(off); off -= rn.range(5, 9.5); }
    off = 5.6; for (let i = 0; i < 5; i++) { offs.push(off); off += rn.range(5, 9.5); }
    for (const o of offs) { const c = q.clone().addScaledVector(ax, o), l0 = rn.range(22, 40), l1 = rn.range(58, 80) - l0;
      bent.push({ a: c.clone().addScaledVector(sd, -l0).toArray(), b: c.clone().addScaledVector(sd, l1).toArray(), w: 0.12, when: 1, seed: rn(), hum: 0.3 }); }
    const q2 = curve.getPointAt(0.68), t2 = curve.getTangentAt(0.68), o2 = perp(t2, rn, 15);
    for (const l of bundle(rn, q2.clone().add(o2).addScaledVector(t2, -95).toArray(), q2.clone().add(o2).addScaledVector(t2, 85).add(V3(0, -30, 0)).toArray(), rn.int(5, 7), 2.6, { w: 0.13, when: 1, side: o2.toArray() })) lines.push(l);
  }
  for (let i = 0; i < 10; i++) {                                    // pale edged triangles
    const u = 0.08 + 0.7 * rn(), q = curve.getPointAt(u), tg = curve.getTangentAt(u), h = 8 + 40 * rn() * rn(), off = perp(tg, rn, h * 0.6 + rn.range(9, 70));
    plates.push({ p: q.clone().add(off).add(V3(0, -h * 0.4, 0)).toArray(), axis: [rn.range(-0.4, 0.4), 1, rn.range(-0.4, 0.4)], n: tg.clone().negate().toArray(), h, hb: h * rn.range(0.13, 0.22), lean: rn.range(-0.5, 0.5),
      c: rn.pick([P.white, P.pblue, P.rose, P.lviolet, P.yellow]), when: 1, seed: rn() });
  }
  { // a pale dart shoal overtaking point first at 50 m/s; one small chequer near the way in
    const q = curve.getPointAt(0.5), tg = curve.getTangentAt(0.5), n = Math.round(26 * (0.5 + 0.5 * detail));
    for (let i = 0; i < n; i++) { const off = perp(tg, rn, rn.range(7, 22)), h = rn.range(1.5, 4), sp = rn.range(46, 54);
      plates.push({ p: q.clone().add(off).addScaledVector(tg, rn.range(-30, 30)).toArray(), axis: tg.toArray(), n: off.clone().normalize().toArray(), h, hb: h * 0.2, lean: 0, edge: 0.09, c: rn.pick([P.yellow, P.orange, P.white]), when: 1, seed: rn(), vel: tg.clone().multiplyScalar(sp).toArray(), span: 330 }); }
    const q1 = curve.getPointAt(0.15), t1 = curve.getTangentAt(0.15), a1 = V3().crossVectors(t1, V3(0, 1, 0)).normalize(), up1 = V3(0.2, 1, 0).normalize();
    for (const s of chequerBoard(rn, q1.clone().addScaledVector(a1, -26).add(V3(0, -10, 0)).toArray(), a1.clone().addScaledVector(t1, -0.5).normalize().toArray(), up1.toArray(), 5, 4, 3, nightCols, { ink: 0.3, empty: 0.15, when: 1 })) squares.push(s);
  }
  // flora, ivory inside: fans of thin lines from one point, and fruit (a circle holding a circle, pierced by its stem)
  for (let i = 0; i < 5; i++) {
    const u = 0.05 + 0.65 * (i + rn()) / 5, q = curve.getPointAt(u), tg = curve.getTangentAt(u), base = q.clone().add(perp(tg, rn, rn.range(2, 9))).add(V3(0, -rn.range(12, 20), 0));
    const n = rn.int(5, 10), tall = rn.range(4, 20), lean = rn.range(-0.4, 0.4), sp = rn.range(0.5, 1.1), fa = rn.range(0, 3.14);
    for (let k = 0; k < n; k++) { const a = lean + sp * ((k + rn.range(-0.3, 0.3)) / (n - 1) - 0.5) * 2, l = tall * rn.range(0.45, 1) * 0.72;   // stays below the lens
      bent.push({ a: base.toArray(), b: [base.x + Math.sin(a) * Math.cos(fa) * l, base.y + Math.cos(a) * l, base.z + Math.sin(a) * Math.sin(fa) * l], w: rn.range(0.035, 0.06), when: 1, seed: rn(), hum: 0.12 }); }
    if (i % 2 === 0) { const f = base.clone().add(V3(rn.range(-5, 5), rn.range(2, 6), rn.range(-5, 5))), r = rn.range(0.9, 1.8);
      films.push({ p: f.toArray(), r, c: rn.pick([P.red, P.yellow, P.orange]), c2: P.white, inner: [0, 0, 0.45], when: 1, seed: rn() });
      lines.push({ a: [f.x - r * 2.4, f.y - r * 2.9, f.z], b: [f.x + r * 1.5, f.y + r * 1.9, f.z], w: 0.1, when: 1, seed: rn() }); }
  }
  // a point that rules its line again and again (night, two of them), and wavy lines that swim along their own length
  const loops = [bent.findIndex((l) => l.loop)];
  for (let i = 0; i < 2; i++) { const u = 0.3 + 0.4 * i, q = curve.getPointAt(u), tg = curve.getTangentAt(u), off = perp(tg, rn, rn.range(16, 30)), c = q.clone().add(off), d = V3().crossVectors(off, tg).normalize().addScaledVector(tg, 0.5).normalize();
    bent.push({ a: c.clone().addScaledVector(d, -110).toArray(), b: c.clone().addScaledVector(d, 130).toArray(), w: 0.3, when: 1, seed: rn(), loop: rn.range(6.5, 9) }); loops.push(bent.length - 1); }
  for (let i = 0; i < 4; i++) { const u = rn.range(0.15, 0.85), q = curve.getPointAt(u), tg = curve.getTangentAt(u), c = q.clone().add(perp(tg, rn, rn.range(7, 16))), d = tg.clone().add(V3(rn.range(-0.4, 0.4), rn.range(-0.2, 0.2), rn.range(-0.4, 0.4))).normalize(), l = rn.range(8, 20);
    bent.push({ a: c.toArray(), b: c.clone().addScaledVector(d, l).toArray(), w: 0.2, when: 1, seed: rn(), wave: rn.range(0.5, 1), waves: rn.int(5, 9) }); }
  await ctx.yield();

  // --- real grain: rose spatter in the air before the skin (thick toward the rail and the skin), yellow round the exit
  const grains = [], nRose = Math.round(7000 * detail), nYel = Math.round(2000 * detail);
  const ga1 = V3().crossVectors(T, V3(0, 1, 0)).normalize(), ga2 = V3().crossVectors(ga1, T).normalize();
  for (let i = 0; i < nRose; i++) {
    const s = -78 * Math.pow(rg(), 1.6), rho = 0.7 + 44 * Math.pow(rg(), 2.1), th = rg.range(0, 6.283), w = rg(), sd = rg();
    const p = S.clone().addScaledVector(T, s).addScaledVector(ga1, Math.cos(th) * rho).addScaledVector(ga2, Math.sin(th) * rho);
    if (p.distanceTo(C0) < R + 0.4) p.sub(C0).setLength(R + 0.4 + rho * 0.2).add(C0);
    grains.push(p.x, p.y, p.z, 0.012 + 0.09 * w * w * w, 0, sd, 0, 0);
    if (i % 1500 === 1499) await ctx.yield();
  }
  for (let i = 0; i < nYel; i++) {
    const ax = rg.range(-15, 5) * rg(), rho = 7.6 + 8.5 * rg() * rg(), th = rg.range(0, 6.283), w = rg(), sd = rg();
    const p = seat.clone().addScaledVector(exitDir, ax).addScaledVector(eR, Math.cos(th) * rho).addScaledVector(eUp, Math.sin(th) * rho);
    grains.push(p.x, p.y, p.z, 0.02 + 0.2 * w * w, 1, sd, 1, 0);
  }
  await ctx.yield();

  // the world's say on the cast, by place (the world owns the line that is flown; I own only my curve): opts.cast is handed every
  // list, in my local places, after the last draw and before any mesh; an entry it marks cut is not made. Nothing is drawn for it.
  const HEAD_R = 0.9;   // the radius of my ruling points (the dots below): the world adds it to the reach of the looping line that carries one
  if (opts.cast) await opts.cast({ films, solids, halos, lines, bent, plates, squares, heartSq, rail: railLine, fly, skin: S, curve, head: HEAD_R });
  const kept = (a) => a.filter((f) => !f.cut);
  // --- meshes: every material exists and is on screen from here on; day and night forms are scaled by uNight -------
  root.add(makeHalos(kept(halos), UO)); await ctx.yield();
  root.add(makeFilms(kept(solids), { U: HU, solid: true }));
  root.add(makeFilms(kept(films), UO)); await ctx.yield();
  root.add(makeChequer(kept(squares), UO));
  const heart = makeChequer(kept(heartSq), UO); root.add(heart);
  root.add(makePlates(kept(plates), UO)); await ctx.yield();
  root.add(makeLines(kept(lines), { U: HU, segs: 24 }));
  root.add(makeLines(kept(bent), { U: HU, segs: 48 })); await ctx.yield();
  root.add(makeGrain(grains, { U: HU, colors: [haloCol, P.yellow, P.white] }));
  const heads = loops.filter((i) => i >= 0 && !bent[i].cut).map((i) => bent[i]);
  const dots = makeFilms(heads.map((l) => ({ p: l.a, r: HEAD_R, c: l.when ? P.white : P.black, when: l.when, seed: l.seed, kind: 2 })), { U: HU, solid: true, order: -7.5 });
  root.add(dots);
  const wash = makeWash(); if (opts.wash !== false) root.add(wash);
  await ctx.yield();

  // --- state ------------------------------------------------------------------------------------------------------
  const forceNight = opts.night ?? devN('wchnight'), devU0 = devN('wchu'); let devU = devU0;
  const uSkin = opts.uSkin ?? 0.5, darkFilm = P.black.clone().lerp(P.violet, 0.35);
  const eye = V3(), cw = V3(), sw = V3(), seatW = V3(), tmp = new THREE.Color(), size = new THREE.Vector2(), tint = new THREE.Color(1, 1, 1), white = new THREE.Color(1, 1, 1);
  let progress = null, latched = false, tintK = 0;
  const dotPos = dots.children[0].geometry.getAttribute('iPos');
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const hero = {
    object: root, radius: 190, height: 300, center: C0.clone(), ground: false, groundY: 0, U: HU, pigments: P, variant, groundKind: ground,
    place: { position: [-110, -55, 660], rotationY: Math.PI },
    anchors: {
      center: C0.clone(), skin: { position: S.clone(), direction: T.clone() }, rail: { a: railA.clone(), b: railB.clone() },
      flyThrough: fly.map((p) => p.clone()), portalSeat: { position: seat.clone(), facing: exitDir.clone().negate(), direction: exitDir.clone() },
      blueCircle: { center: Bc.clone(), radius: 75 }, heart: on(40 * g2[0], 40 * g2[1]), companion: cp.clone(),
      viewpoints: { first: V3(0, 110, 660), reveal: S.clone().addScaledVector(T, -330), close: S.clone().addScaledVector(T, -45), night: fly[4].clone(), exit: seat.clone().addScaledVector(exitDir, -110) },
    },
    setProgress(u) { progress = u; },                    // the world's u each frame: night is u >= uSkin exactly
    setNight(v) { progress = null; latched = v > 0.5; }, // or drive it yourself
    setWash(color, k) { tint.set(color); tintK = k; },   // a film the lens passes through: tint the wash for a moment
    update(dt, time, camera) {
      if (devU != null) {   // viewer only: ride the brief's line. 0 = the world's entry, 0.5 = the skin, 1 = the exit
        root.updateWorldMatrix(true, false);
        const e0 = V3(-114, 53, 620), a = devU < 0.5 ? e0.lerp(S, devU / 0.5) : curve.getPointAt(Math.min(1, (devU - 0.5) / 0.5));
        const b = devU < 0.5 ? a.clone().addScaledVector(T, 60).lerp(C0, 0.25) : (devU > 0.97 ? a.clone().add(exitDir) : curve.getPointAt(Math.min(1, (devU - 0.5) / 0.5 + 0.06)));
        if (devU < 0.5) a.add(V3(1.6, 1.2, 0));
        camera.position.copy(a.applyMatrix4(root.matrixWorld)); camera.lookAt(b.applyMatrix4(root.matrixWorld)); camera.updateMatrixWorld(true);
        latched = devU >= 0.5;
      }
      camera.getWorldPosition(eye); camera.getWorldDirection(HU.uGaze.value);
      root.updateWorldMatrix(true, false);
      cw.copy(C0).applyMatrix4(root.matrixWorld); sw.copy(S).applyMatrix4(root.matrixWorld); seatW.copy(seat).applyMatrix4(root.matrixWorld);
      HU.uHeroC.value.copy(cw); HU.uTime.value = time;
      const rdr = ctx.renderer; if (rdr && rdr.getDrawingBufferSize) HU.uViewH.value = rdr.getDrawingBufferSize(size).y;
      const dC = eye.distanceTo(cw), dS = eye.distanceTo(sw);
      if (ctx.through) latched = false; else if (progress != null) latched = progress >= uSkin; else if (dC < R) latched = true;
      const night = forceNight != null ? forceNight : (latched ? 1 : 0);
      HU.uNight.value = night;
      // the dark film at the skin: by distance from the place, under a second at flight speed, no flash
      const k = forceNight != null || ctx.through ? 0 : 0.85 * (night ? 1 - sstep(2, 17, dS) : 1 - sstep(1, 13, dC - R));
      wash.material.uniforms.uWash.value.copy(white).lerp(darkFilm, k).multiply(tmp.setRGB(1 + (tint.r - 1) * tintK, 1 + (tint.g - 1) * tintK, 1 + (tint.b - 1) * tintK));
      heart.setWake(1 - sstep(45, 300, eye.distanceTo(seatW)));
      for (let i = 0; i < heads.length; i++) { const l = heads[i], h = lineHead(time, l.loop, l.seed);
        dotPos.setXYZ(i, l.a[0] + (l.b[0] - l.a[0]) * h, l.a[1] + (l.b[1] - l.a[1]) * h, l.a[2] + (l.b[2] - l.a[2]) * h); }
      dotPos.needsUpdate = true;
    },
    dispose() { if (!wash.parent) { wash.geometry.dispose(); wash.material.dispose(); } },
  };
  return hero;
}
