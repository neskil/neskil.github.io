// bare-oilcloth-night: "The Night Was Already There" (after Niko Pirosmani).
// A Kakhetian valley painted on a tavern's black oilcloth: the cloth is night, ground, outline and shadow at once; a white
// she-bear 60 m long walks beside a laid cloth of wine jars, her cubs race us down it, and the paint is still landing.
// Everything that shows is made of the hero part's stroke routine (bristle strokes as instanced plates on unlit black
// bodies) plus one oilcloth shader for ground and sky. No lights, no fog, flat post: a hex written is the hex shown.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, makeStyleAsync, StrokeBuffer, makeLoft, loftGeometry, paintLoft, paintLoftAsync, flickRow, buildBeast, lendRng, landBroad, landing, MIDLAD, PALETTE, PIG } from '../parts/bare-oilcloth-night.js';

const { CREAM, OCHRE, BLUE, BRICK, GREEN } = PIG;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// ---- the oilcloth: ground bowl and sky are one skin (same shader, same sheen from the view direction) ----------------
const CLOTH_COMMON = /* glsl */`
uniform vec3 uCloth, uSheen, uAxis, uMoon, uPal[6]; uniform float uT, uHour, uMoonR, uCres; uniform vec4 uCrease[4]; uniform sampler2D uAtlas;
float hash21(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
vec2 hash22(vec2 p){ float n = hash21(p); return vec2(n, hash21(p + n * 17.3)); }
// the one optical event: a single soft band of gloss about 30 degrees wide, sliding with the view. Never on paint.
// It keeps to the view: its place follows the way the eye is turned at about two thirds of the eye's own pace, so it is
// always somewhere in the picture and slides across it as we turn.
float sheenBand(vec3 v, vec3 cam){
  vec3 f = -vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]);
  float c = .62 * dot(f, uAxis) + .1 + .09 * sin(uT * .13 + dot(cam, vec3(.006, .01, .008)));
  float d = (dot(v, uAxis) - c) / .14;
  return exp(-d * d);
}
// the cloth was folded: a net of long soft creases, S metres apart, each a pale ridge with a soft shoulder. Never thinner
// than about 1.5 px; a net finer than about 8 px is left out.
float creaseNet(vec2 p, float S, float wmin){
  vec2 q = vec2(p.x * .988 + p.y * .156, p.y * .988 - p.x * .156) / S;
  vec2 fw = max(fwidth(q), vec2(1e-5));
  q += .07 * sin(q.yx * vec2(2.1, 1.7) + vec2(1., 2.));       // a fold is never ruler-straight
  vec2 d = abs(fract(q) - .5);
  vec2 hw = max(vec2(wmin / S), 2.4 * fw);
  vec2 core = 1. - smoothstep(hw * .4, hw * 1.4, d);
  vec2 sh = exp(-d / (hw * 5.));
  vec2 l = (core * .6 + sh * .4) * (1. - smoothstep(.05, .14, fw));
  return clamp(max(l.x, l.y), 0., 1.);
}`;
const GROUND_VERT = /* glsl */`
attribute float aRidge; varying vec3 vW; varying float vRidge;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vRidge = aRidge; gl_Position = projectionMatrix * viewMatrix * w; }`;
const GROUND_FRAG = /* glsl */`
${CLOTH_COMMON}
varying vec3 vW; varying float vRidge;
// distance to the nearest crack: edges of a jittered cell net (no texture, no derivative inside the loop)
float crackDist(vec2 p){
  vec2 ip = floor(p), fp = fract(p); float d1 = 8., d2 = 8.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)); vec2 o = g + hash22(ip + g) * .8 + .1 - fp; float d = dot(o, o);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return sqrt(max(d2, 0.)) - sqrt(max(d1, 0.));
}
void main(){
  vec3 tc = vW - cameraPosition; float dist = max(length(tc), 1e-3); vec3 v = tc / dist;
  float band = sheenBand(v, cameraPosition);
  vec2 p = vW.xz;
  // cracks: a net within about 60 m of the eye; farther off only the big ones stay (fewer marks, never haze)
  vec2 pc = p / 2.6; float fwc = max(fwidth(pc.x) + fwidth(pc.y), 1e-4);
  float cd = crackDist(pc); float keepBig = step(.55, hash21(floor(pc * .5)));
  float near = 1. - smoothstep(38., 70., dist);
  float crack = (1. - smoothstep(.0, 1., (cd - .012) / fwc)) * max(near, keepBig * (1. - smoothstep(150., 260., dist))) * (1. - smoothstep(.25, .6, fwc));
  vec2 pf = p / .9 + 7.3; float fwf = max(fwidth(pf.x) + fwidth(pf.y), 1e-4);
  float fine = (1. - smoothstep(0., 1., (crackDist(pf) - .01) / fwf)) * (1. - smoothstep(14., 30., dist)) * (1. - smoothstep(.2, .5, fwf));
  // weave ghost: threads 0.16 m apart, drawn only while wider than about 3 px, else their flat average
  vec2 pw = p / .16; vec2 fww = max(fwidth(pw), vec2(1e-4));
  vec2 tw = abs(fract(pw) - .5); float line = max(1. - smoothstep(0., 1., (tw.x - .08) / fww.x), 1. - smoothstep(0., 1., (tw.y - .08) / fww.y));
  float fineK = 1. - smoothstep(.12, .33, max(fww.x, fww.y));
  float weave = mix(.3, line, fineK);
  // creases: the pressed folds catch the gloss along their crest
  float cr = smoothstep(.35, 1., vRidge);
  float k = clamp(band * (.72 + .28 * weave) + cr * .75 + .14 * weave + creaseNet(p, 58., .3) * .8, 0., 1.);
  k = max(k, max(crack, fine * .8) * .85) ;
  // the crack itself is matte inside the gloss: a hair of bare cloth
  k = mix(k, .0, crack * band * .9);
  gl_FragColor = vec4(mix(uCloth, uSheen, clamp(k, 0., 1.)), 1.);
}`;
const DOME_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(position * 100. + cameraPosition, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const DOME_FRAG = /* glsl */`
${CLOTH_COMMON}
varying vec3 vDir;
void main(){
  vec3 v = vDir / max(length(vDir), 1e-4);
  float band = sheenBand(v, cameraPosition);
  // the fold creases run up across the night as faint great circles of gloss
  vec4 cd4 = abs(vec4(dot(v, uCrease[0].xyz), dot(v, uCrease[1].xyz), dot(v, uCrease[2].xyz), dot(v, uCrease[3].xyz)));
  vec4 cf4 = max(fwidth(cd4), vec4(1e-5));
  vec4 cl4 = 1. - smoothstep(0., 1., (cd4 - .0016) / cf4 - .5);
  float cr = max(max(cl4.x, cl4.y), max(cl4.z, cl4.w));
  // the same net runs up across the night: the vault is the same cloth hung low and flat, its folds running straight to the edge
  vec2 pv = v.xz / (max(v.y, 0.) + .3) * 230.;
  float net = creaseNet(pv, 120., .6) * (1. - smoothstep(.8, .98, v.y));
  float k = clamp(band * .95 + cr * .5 * (1. - smoothstep(.5, .95, v.y)) + net * .75, 0., 1.);
  vec3 col = mix(uCloth, uSheen, k);
  float el = asin(clamp(v.y, -1., 1.)), az = atan(v.z, abs(v.x) < 1e-5 ? 1e-5 : v.x);
  // there is no sky: the bare cloth is the night. Only by day a thin coat of the cold blue is dragged dry over the upper
  // cloth to 40 degrees up, black streaking through.
  vec3 m = uMoon; vec3 mr = normalize(cross(vec3(0., 1., 0.), m)); vec3 mu = cross(m, mr);
  vec2 q = vec2(dot(v, mr), dot(v, mu)) / uMoonR; q.x *= 1.08; float md = step(0., dot(v, m));
  float moonGap = 1. - md * (1. - step(1.2, length(q))) * (1. - step(2.5, uHour));
  {
    float rowH = .05, row = floor(el / rowH), fy = fract(el / rowH);
    float n = 9. + mod(row * 3., 5.); float x = az / 6.2832 * n + hash21(vec2(row, 3.)); float ix = mod(floor(x), n), fx = fract(x);
    float var = floor(hash21(vec2(ix, row)) * 7.99);
    vec4 t = texture2D(uAtlas, vec2(fx, (var + clamp(fy, .03, .97)) / 8.));
    float thr = .5 + .32 * smoothstep(.25, .7, el);
    col = mix(col, uPal[3], step(2.5, uHour) * step(.168, el) * step(el, .7) * step(thr, t.r) * moonGap);
  }
  // dawn and golden: a brick and an ochre drag laid along the far edge under the blue
  {
    float rowH = .02, row = floor(el / rowH), fy = fract(el / rowH);
    float n = 9. + mod(row * 3., 5.); float x = az / 6.2832 * n + hash21(vec2(row, 3.)); float ix = mod(floor(x), n), fx = fract(x);
    float var = floor(hash21(vec2(ix, row)) * 7.99);
    vec4 t = texture2D(uAtlas, vec2(fx, (var + clamp(fy, .03, .97)) / 8.));
    float warm = step(1.5, uHour) * (1. - step(2.5, uHour)) * step(.18, el) * step(el, .24) * step(.3, t.r);
    col = mix(col, el < .2 ? uPal[4] : uPal[2], warm);
  }
  // the moon: one flat cream dab, not quite round, ragged where the brush ran dry; a crescent at dawn; none by day
  float ang = atan(q.y, abs(q.x) < 1e-5 ? 1e-5 : q.x);
  float rr = length(q) + .09 * sin(ang * 3. + 1.3) + .05 * sin(ang * 7. + .4);
  vec4 tm = texture2D(uAtlas, vec2(clamp(q.x * .42 + .46, 0., 1.), (2. + clamp(q.y * .45 + .5, .03, .97)) / 8.));
  float moon = md * step(rr, 1.) * step(.12, tm.r) * (1. - step(2.5, uHour));
  vec2 q2 = q - vec2(.45, .12); moon *= mix(1., step(1., length(q2) * 1.08), uCres);
  col = mix(col, uPal[1], moon);
  gl_FragColor = vec4(col, 1.);
}`;

export default {
  id: 'bare-oilcloth-night',
  name: 'The Night Was Already There',
  category: 'artists',
  placeKind: 'wilderness',
  after: 'Niko Pirosmani, 1862 to 1918',
  weirdness: 0.3,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, detail = (ctx.quality && ctx.quality.detail) || 1, vary = ctx.vary || {};
    const dens = Math.min(1.3, Math.max(0.7, vary.density || 1));
    const scene = new THREE.Scene(); scene.background = new THREE.Color(PALETTE[0]);
    // ---- variations, drawn once in a fixed order ----
    const vr = rng.fork ? rng.fork('edition') : rng;
    const st = vr(), season = st < 0.42 ? 'vintage' : st < 0.7 ? 'snow' : 'spring';
    const sow = vr() < 0.4, lion = vr() < 0.4;
    let hour = vary.hour && vary.hour !== 'any' ? vary.hour : (vr() < 0.7 ? 'night' : 'dawn');
    const hourK = hour === 'day' ? 3 : (hour === 'dawn' || hour === 'golden') ? 2 : 1;
    const rare = !!vary.rare;
    const style = await makeStyleAsync(ctx, PALETTE);
    const U = style.uniforms; U.uRip.value = 0.6; U.uRet.value = rare ? 2.2 : 4; U.uWet.value = 0;
    const ALWAYS = new THREE.Vector4(1e6, 30, 2e6, 100);       // world things keep their one coat at every distance
    // but the laid cloth and the brick forms on it (the jars, loaves, horns and the cut melon; no animal): those are laid
    // four times over, in strokes about 0.5, 1.3, 2.8 and 4 m wide, and the eye's distance in metres picks the coat
    // (style.uniforms.uLad, uLadF; stroke kinds 6..9). Each such form has two streams of its own, named by the form:
    // one for the strokes of its broader coats, and one for their landing (the second coat lands well ahead of the eye,
    // where the broader coats are what is drawn, so a share of each of them is second coat too, by the form's own birth
    // rule called at the broad stroke's middle). So no form's deal hangs on another form or on the order they are built in.
    const marksOf = (form) => ctx.core.makeRng(ctx.core.hashSeed('marks:' + form + ':' + ctx.seed));
    const landingOf = (form) => ctx.core.makeRng(ctx.core.hashSeed('landing:' + form + ':' + ctx.seed));
    const LADDERED = { cloth: 1, feast: 1, border: 1 };   // the painters that carry such forms
    await ctx.yield();

    // ---- the path (the brief's glide; hero-local flyThrough + (30,0,110)) ----
    const path = makePath([
      [98, 4, 41], [90, 5.4, 53], [84, 7, 68], [82.5, 8, 90], [80.5, 10.5, 108], [88, 10.5, 127], [91, 11, 141], [80, 13.5, 153], [66, 15, 157], [53, 14, 156], [47, 12.5, 150.5], [44.5, 8, 158.5],
      [37, 5, 167], [24, 4.6, 173], [12, 5, 177], [3, 6.4, 186], [-2.4, 9.5, 200], [-1.5, 13.5, 226], [-4, 12, 249], [-6.5, 10.5, 270], [-1, 8.5, 294], [-2, 6.6, 312],
      [-2, 8, 330], [-0.5, 16, 344], [1, 24, 358], [2.5, 32, 372], [4, 40, 386]], { samples: 480 });
    const CL = { x0: -13, x1: 13, z0: 70, z1: 370 };           // the laid cloth
    // ground height: level near the course, then the bowl rises 4 degrees to the blue edge
    const segD = (x, z) => { const ax = 60, az = 40, bx = 0, bz = 360, dx = bx - ax, dz = bz - az; const t = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - ax - dx * t, z - az - dz * t); };
    const gh = (x, z) => { const r = segD(x, z) - 150; return r <= 0 ? 0 : 0.07 * r * r / (r + 60); };

    // ---- the oilcloth ground: a polar bowl plus four pressed creases (ridges 0.4 m high), one mesh ----
    const creases = [   // a point on the fold and its direction on the ground
      { p: [0, 187], d: [1, 0] }, { p: [0, 0], d: [0, 1] }, { p: [100, 20], d: [0.7071, 0.7071] }, { p: [60, 250], d: [0.94, -0.34] }];
    const gPos = [], gRidge = [], gIdx = [];
    {
      const rings = [0, 10, 20, 34, 50, 70, 95, 125, 160, 200, 250, 310, 380, 460, 550, 650, 760, 880, 1010, 1160, 1400], SEG = 72, cx = 30, cz = 200;
      for (let i = 0; i < rings.length; i++) for (let j = 0; j < SEG; j++) { const a = j / SEG * Math.PI * 2, x = cx + Math.cos(a) * rings[i], z = cz + Math.sin(a) * rings[i]; gPos.push(x, gh(x, z) - 0.02, z); gRidge.push(0); }
      for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < SEG; j++) { const a = i * SEG + j, b = i * SEG + (j + 1) % SEG, c = a + SEG, d = b + SEG; gIdx.push(a, b, c, b, d, c); }
      await ctx.yield();
      const prof = [[-0.9, -0.02, 0], [-0.3, 0.26, 0.5], [0, 0.4, 1], [0.3, 0.26, 0.5], [0.9, -0.02, 0]];
      for (const c of creases) {
        const base = gPos.length / 3, NS = 220, nx = -c.d[1], nz = c.d[0];
        for (let i = 0; i <= NS; i++) {
          const t = -1100 + 2200 * i / NS, x = c.p[0] + c.d[0] * t, z = c.p[1] + c.d[1] * t;
          for (const [o, h, r] of prof) { const px = x + nx * o, pz = z + nz * o, inC = px > CL.x0 - 3 && px < CL.x1 + 3 && pz > CL.z0 - 3 && pz < CL.z1 + 3; gPos.push(px, gh(px, pz) + (inC ? -0.02 : h), pz); gRidge.push(inC ? 0 : r); }
        }
        for (let i = 0; i < NS; i++) for (let k = 0; k < 4; k++) { const a = base + i * 5 + k, b = a + 1, c2 = a + 5, d = c2 + 1; gIdx.push(a, b, c2, b, d, c2); }
        await ctx.yield();
      }
    }
    const gGeo = new THREE.BufferGeometry();
    gGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gPos), 3)); gGeo.setAttribute('aRidge', new THREE.BufferAttribute(new Float32Array(gRidge), 1)); gGeo.setIndex(gIdx);
    await ctx.yield();
    const moonDir = new THREE.Vector3(-Math.sin(32 * Math.PI / 180) * Math.cos(16 * Math.PI / 180), Math.sin(16 * Math.PI / 180), Math.cos(32 * Math.PI / 180) * Math.cos(16 * Math.PI / 180));
    const clothU = {
      uCloth: { value: new THREE.Color(PALETTE[0]) }, uSheen: { value: new THREE.Color('#23272B') }, uAxis: { value: new THREE.Vector3(0.77, 0.57, 0.28).normalize() },
      uT: U.uT, uHour: { value: hourK }, uMoon: { value: moonDir }, uMoonR: { value: Math.tan(1.9 * Math.PI / 180) }, uCres: { value: hourK === 2 ? 1 : 0 },
      uCrease: { value: creases.map((c) => new THREE.Vector4(-c.d[1], 0, c.d[0], 0)) }, uAtlas: U.uAtlas, uPal: U.uPal,
    };
    const ground = new THREE.Mesh(gGeo, new THREE.ShaderMaterial({ uniforms: clothU, vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG, side: THREE.DoubleSide, fog: false, toneMapped: false }));
    ground.frustumCulled = false; scene.add(ground);
    await ctx.yield();
    const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 4), new THREE.ShaderMaterial({ uniforms: clothU, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, toneMapped: false }));
    dome.frustumCulled = false; dome.renderOrder = -10; scene.add(dome);
    await ctx.yield();

    // ---- the hero: the white she-bear and her two cubs ----
    const hero = await buildHero(ctx, { style, cubs: true, birth: rare ? [0.2, 0.275] : [0.08, 0.26], second: rare ? 0.5 : 0.4 });
    hero.object.position.set(30, 0, 110); scene.add(hero.object);
    const A = hero.anchors, W3 = (v) => new THREE.Vector3(v.x + 30, v.y, v.z + 110);
    await ctx.yield();

    // ---- the painter: black lofted bodies + strokes laid on them, a few draw calls per region ----
    // world bones: 0 identity, 1..5 free (per painter), 6 = grass lean, 7 = hem ripple (in the shader)
    const painters = [];
    const makePainter = (name) => {
      const bones = []; for (let i = 0; i < 8; i++) bones.push(new THREE.Matrix4());
      const P = { name, bones, sb: new StrokeBuffer(rng.fork ? rng.fork('p-' + name) : rng), geos: [], group: new THREE.Group(), eyes: [], rng: rng.fork ? rng.fork('r-' + name) : rng };
      if (LADDERED[name]) P.rng = lendRng(P.rng);   // the same stream, draw for draw; lent (P.rng.lent) while a form's birth rule deals the landing of its broader coats
      // a loft body, painted. o: paintLoft options (+ ns, nq, bone, flicks: [flickRow options])
      P.loft = (stations, R, B, o = {}) => {
        const L = makeLoft(stations, R, B);
        if (o.body !== false) P.geos.push(loftGeometry(L, o.ns || 14, o.nq || 18, o.bone || 0));
        if (o.paint !== false) paintLoft(P.sb, L, P.rng, { width: 0.5, len: [1, 2.2], gap: 0.05, ...o });
        return L;
      };
      P.loftA = async (stations, R, B, o = {}) => {   // the same in short steps
        const L = makeLoft(stations, R, B);
        if (o.body !== false) P.geos.push(loftGeometry(L, o.ns || 14, o.nq || 18, o.bone || 0));
        await ctx.yield();
        if (o.paint !== false) await paintLoftAsync(P.sb, L, P.rng, { width: 0.5, len: [1, 2.2], ...o }, ctx.yield, 3);
        return L;
      };
      P.eye = (p, n, r, bone = 0, gain = 1) => P.eyes.push([p[0], p[1], p[2], n[0], n[1], n[2], r, bone, P.rng(), gain]);
      // a grass fan: seven green flicks from one point, in place of a shadow (bone 6 leans it)
      P.fan = (x, z, h, o = {}) => {
        const y = gh(x, z), yaw = P.rng() * 6.28, cx = Math.cos(yaw), sx = Math.sin(yaw), n = o.n || 7;
        for (let t = 0; t < n; t++) {
          const a = (t - (n - 1) / 2) * (1.9 / n) + P.rng.range(-0.06, 0.06), hh = h * (0.75 + 0.4 * P.rng());
          P.sb.add([x, y, z], [Math.sin(a) * cx * hh, Math.cos(a) * hh, Math.sin(a) * sx * hh], [-sx, 0.2, cx], (o.w || 0.2) * (0.8 + 0.4 * P.rng()), o.pig ?? GREEN, { bone: 6, birth: o.birth ? o.birth() : -1, dab: 1 });
        }
      };
      P.finish = () => {
        if (P.geos.length) {
          let nv = 0, ni = 0; for (const g of P.geos) { nv += g.attributes.position.count; ni += g.index.count; }
          const pos = new Float32Array(nv * 3), bn = new Float32Array(nv), idx = new Uint32Array(ni); let ov = 0, oi = 0;
          for (const g of P.geos) { pos.set(g.attributes.position.array, ov * 3); bn.set(g.attributes.aBone.array, ov); const a = g.index.array; for (let i = 0; i < a.length; i++) idx[oi + i] = a[i] + ov; ov += g.attributes.position.count; oi += a.length; g.dispose(); }
          const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('aBone', new THREE.BufferAttribute(bn, 1)); bg.setIndex(new THREE.BufferAttribute(idx, 1));
          const body = new THREE.Mesh(bg, style.bodyMaterial({ bones })); body.frustumCulled = false; P.group.add(body); P.geos = [];
        }
        P.strokes = P.sb.count;
        for (const m of P.sb.build(style.strokeMaterial({ bones, lod: ALWAYS, streak: P.streak || 0, lad: P.lad || null }))) P.group.add(m);
        if (P.eyes.length) {
          const eg = new THREE.InstancedBufferGeometry(), pl = new THREE.PlaneGeometry(1, 1); eg.index = pl.index; eg.setAttribute('position', pl.getAttribute('position'));
          const eb = new THREE.InstancedInterleavedBuffer(new Float32Array(P.eyes.flat()), 10);
          eg.setAttribute('aP', new THREE.InterleavedBufferAttribute(eb, 3, 0)); eg.setAttribute('aN', new THREE.InterleavedBufferAttribute(eb, 3, 3)); eg.setAttribute('aA', new THREE.InterleavedBufferAttribute(eb, 4, 6));
          eg.instanceCount = P.eyes.length; const em = new THREE.Mesh(eg, style.eyeMaterial({ bones })); em.frustumCulled = false; P.group.add(em);
        }
        scene.add(P.group); painters.push(P); return P;
      };
      return P;
    };
    const uAt = (x, z) => path.nearestXZ(x, z).u;
    // second coat: a thin share of a thing's strokes (share times 0.3: 12 in 100 at the default) lands as a front before the
    // eye reaches the thing's own place u0 on the route: at u0 less 0.06 less the lead (0.12 to 0.18 of the route at the
    // default, 52 to 78 m of its 433), so a thing is whole well before the eye is beside it; what lands is the last dry pass
    const coat2 = (r, u0, share = 0.4, lead = [0.06, 0.12]) => () => { if (r() >= share * 0.3) return -1; const b = u0 - 0.06 - lerp(lead[0], lead[1], r()); return b > 0.004 ? b : -1; };

    // rungs(P, L, mk, zones, w0): the three broader coats of a lofted form (kinds 7..9), in lanes nine tenths full, each drag
    // laid over the dry end of the last, so the cloth lies between two lanes and between two drags. zones: [[s0, s1, pig]]
    // along the form (a jar's belly, its shoulder), so every pigment keeps its own place on every coat. mk: the form's own
    // stream of marks.
    const rungs = (P, L, mk, zones, w0 = 0.6, bone = 0) => {
      for (const [lv, wx, l0, l1] of [[7, 2.4, 3.5, 6], [8, 4.8, 6, 10], [9, 8.5, 9, 16]]) for (const [s0, s1, pig] of zones)
        paintLoft(P.sb, L, mk, { width: w0 * wx, len: [l0, l1], level: lv, side: 0.93, adv: [0.8, 0.94], seed: [0.1, 0.6], dry: 0, own: true, s0, s1, pig, bone });
    };
    // formStreams(name): the two streams of one laddered form. landed(P, F, bth, lay): the broader coats that lay(F.mk)
    // lays take their landing from the form's own birth rule bth (the one its fine coat takes it from), asked for each
    // broad stroke at its own middle with the form's landing stream (see landBroad)
    const formStreams = (name) => ({ mk: marksOf(name), ld: landingOf(name) });
    const landed = (P, F, bth, lay) => { const q0 = P.sb.q.length, s0 = P.sb.s.length; lay(F.mk); P.rng.lent(F.ld, () => landBroad(P.sb, q0, s0, () => bth())); };
    // trimBelow(sb, q0, s0, y): the strokes added since the two lists were q0 and s0 long begin no lower than y: what is
    // under a brick form is the cloth left bare (the design's underside), never a darker paint
    const trimBelow = (sb, q0, s0, y) => {
      for (const [arr, i0] of [[sb.q, q0], [sb.s, s0]]) for (let i = i0; i < arr.length; i += 17) {
        if (arr[i + 1] >= y || arr[i + 4] <= 0) continue;
        const t = Math.min(1, (y - arr[i + 1]) / arr[i + 4]), k = 1 - t;
        for (let c = 0; c < 3; c++) { arr[i + c] += arr[i + 3 + c] * t; arr[i + 3 + c] *= Math.max(k, 1e-3); }
        arr[i + 15] *= k * k; if (k < 0.05) arr[i + 9] = 0;
      }
    };
    const jarZones = (snow) => [[0.08, 0.63, () => BRICK], [0.63, 0.9, (Q, N, s) => (snow && s > 0.7 ? CREAM : OCHRE)]];

    // ---- the vineyard: fourteen rows 6.5 m apart either side of the entry, 60 m long, arched canes overhead ----
    const L0 = Math.SQRT1_2, E0 = [120, 0], Hd = [-L0, L0], Ld = [L0, L0];       // entry, heading, port (lateral)
    const vp = (s, o) => [E0[0] + Hd[0] * s + Ld[0] * o, E0[1] + Hd[1] * s + Ld[1] * o];
    const leafPig = (r) => { const t = r(); if (season === 'spring') return t < 0.72 ? GREEN : CREAM; if (season === 'snow') return t < 0.4 ? BRICK : t < 0.65 ? OCHRE : t < 0.8 ? GREEN : CREAM; return t < 0.46 ? BRICK : t < 0.8 ? OCHRE : GREEN; };
    // a vine leaf: a fan of presses of a loaded brush drawn out from one node on a wire, the round loaded ends together
    // at the node, the dry ends spread like the lobes of the leaf. along = the row's direction [x, z], fc = the way it faces
    const cluster = (sb, r, xz, y, along, fc, n, big, bfn, ownP = -1) => {
      const g0 = gh(xz[0], xz[1]), own = ownP >= 0 ? ownP : leafPig(r), nn = Math.max(3, n + 1);   // a leaf is of one pigment
      const a0 = (r() < 0.3 ? 1 : -1) * r.range(1.0, 2.1), spread = r.range(1.5, 2.2), da = r.range(-0.4, 0.4) * big, yy = g0 + Math.max(0.9, y + r.range(-0.25, 0.25) * big);
      const p = [xz[0] + along[0] * da, yy, xz[1] + along[1] * da], b = bfn();
      for (let j = 0; j < nn; j++) {
        const f = j / (nn - 1) - 0.5, a = a0 + f * spread + r.range(-0.07, 0.07), len = r.range(1.0, 1.3) * big * (1 - 0.5 * f * f), sp = season === 'spring' && r() < 0.2 ? 0.6 : 1;
        sb.add(p, [Math.cos(a) * len * along[0], Math.sin(a) * len, Math.cos(a) * len * along[1]], fc, r.range(0.44, 0.56) * big * sp, r() < 0.85 ? own : leafPig(r), { birth: b, bone: 6, seed: r.range(0, 0.45), dab: 1 });
      }
      if (season === 'snow' && r() < 0.5) sb.add([p[0] - along[0] * 0.5, yy + 0.5, p[2] - along[1] * 0.5], [along[0] * 1.1, 0.05, along[1] * 1.1], fc, 0.32, CREAM, { birth: b, dab: 1 });
    };
    // a vine stock: a brick trunk of two leaning strokes beside one thin ochre stake
    const vineStock = (sb, r, x, z, along, fc, h, b) => {
      const y0 = gh(x, z), lx = r.range(0.25, 0.6) * (r() < 0.5 ? -1 : 1), tp = season === 'snow' && r() < 0.3 ? CREAM : BRICK;
      sb.add([x + along[0] * 0.5, y0, z + along[1] * 0.5], [r.range(-0.06, 0.06), h, r.range(-0.06, 0.06)], fc, 0.15, OCHRE, { birth: b, seed: 0.2 });
      sb.add([x, y0, z], [along[0] * lx, h * 0.46, along[1] * lx], fc, 0.42, tp, { birth: b, seed: 0.3 });
      sb.add([x + along[0] * lx * 0.9, y0 + h * 0.42, z + along[1] * lx * 0.9], [-along[0] * lx * 1.1, h * 0.42, -along[1] * lx * 1.1], fc, 0.34, tp, { birth: b, seed: 0.5 });
    };
    // a grape bunch: round cold-blue presses hung in a wedge under a node
    const bunch = (sb, r, x, y, z, along, fc, k, b) => {
      for (const [du, dv] of [[-0.42, 0], [0, 0.04], [0.42, 0], [-0.22, -0.38], [0.2, -0.36], [-0.02, -0.74], [0.3, -0.72], [0.1, -1.1]])
        sb.add([x + along[0] * (du - 0.19) * k, y + (dv + 0.12) * k, z + along[1] * (du - 0.19) * k], [along[0] * 0.08 * k, -0.4 * k, along[1] * 0.08 * k], fc, 0.4 * k, BLUE, { birth: b, variant: 0, seed: 0.1, dab: 1 });
    };
    {
      const P = makePainter('vines'), r = P.rng, sb = P.sb, nL = [Hd[0], 0, Hd[1]];
      const leafBirth = (s) => (s < 48 || r() > 0.6 ? -1 : Math.max(0.003, (s - 36) / 438 - lerp(0.012, 0.05, r())));
      // the rows: the old stacked rows either side, and four near rows that keep 5.6 and 11.6 m off the way in, so the
      // first picture is flown down between vines (trunks, stakes, leaf fans, grape bunches at arm's length)
      const wayO = (sv) => (sv < 58.7 ? 13.4 + 0.2 * (sv - 44.5) : 16.3 + 0.42 * (sv - 58.7));
      const rows = [-8, -7, -6, -5, -4, -3, -2, -1, 6, 7, 8, 9, 10].map((k) => ({ o: () => k * 6.5, sg: Math.sign(-k), s0: 16, s1: 68, near: false }));
      rows.push({ o: (sv) => wayO(sv) - 5.6, sg: 1, s0: 20, s1: 70.5, near: true }, { o: (sv) => wayO(sv) - 11.6, sg: 1, s0: 20, s1: 70.5, near: true },
        { o: (sv) => wayO(sv) + 5.6, sg: -1, s0: 20, s1: 64.5, near: true }, { o: (sv) => wayO(sv) + 11.6, sg: -1, s0: 20, s1: 58.5, near: true });
      for (const row of rows) {
        const nearRow = row.near, sg = row.sg, fc = [Ld[0] * sg, 0, Ld[1] * sg], at = (sv) => vp(sv, row.o(sv));
        for (let sv = row.s0; sv <= row.s1; sv += nearRow ? 4 : 5) { const [x, z] = at(sv); vineStock(sb, r, x, z, Hd, fc, nearRow ? 4.7 : 5.5, leafBirth(sv)); }
        // leaves fanned from nodes along the two wires: the rows read as lines running at her
        const wires = nearRow ? [1.5, 3.0, 4.5] : [2.4, 4.6], stepS = nearRow ? 1.05 : 2.5, big = nearRow ? 1.15 : 1.1, back = [-Hd[0], 0, -Hd[1]];
        for (let sv = row.s0 - 1 + r() * stepS; sv < row.s1; sv += stepS * r.range(0.8, 1.2)) for (const wy of wires) {
          if (r() < (nearRow ? 0.12 : 0.3)) continue;
          const cross = nearRow && r() < 0.5;      // half the near leaves face the eye coming down the row
          cluster(sb, r, at(sv), wy + r.range(-0.3, 0.3), cross ? Ld : Hd, cross ? back : fc, Math.max(2, Math.round((nearRow ? 4 : 3) * dens * Math.min(1, detail + 0.15))), big, () => leafBirth(sv), nearRow && r() < 0.62 ? GREEN : -1);
        }
        if (season !== 'spring') for (let sv = row.s0 + 1; sv < row.s1 - 1; sv += nearRow ? 2.6 : 7) {      // grapes
          const y = (nearRow ? [1.4, 2.6, 3.8] : [1.7, 3.4, 5.0])[Math.floor(r() * 3)] + r.range(-0.3, 0.3), [x, z] = at(sv + r.range(-1, 1)), cross = nearRow && r() < 0.5;
          bunch(sb, r, x + fc[0] * 0.3 + (cross ? back[0] * 0.3 : 0), gh(x, z) + y, z + fc[2] * 0.3 + (cross ? back[2] * 0.3 : 0), cross ? Ld : Hd, cross ? back : fc, nearRow ? 1.15 : 0.95, leafBirth(sv));
        }
        await ctx.yield();
      }
      await ctx.yield();
      // the near bank: tall grass fans either side of the way in, so the foot of the first picture is paint, not bare cloth
      for (let i = 0; i < Math.round(46 * dens * detail); i++) {
        const s = r.range(43, 62), o = r.range(-16, 46); if (Math.abs(o - (13.4 + (s - 38) * 0.2)) < 4.5) continue;
        const [x, z] = vp(s, o); P.fan(x, z, r.range(2.2, 3.8), { w: 0.36 });
      }
      P.finish(); await ctx.yield();
    }

    // ---- the stream (6 m wide, crossing at (78,0,42)) and the deer (or the white sow and her piglets) ----
    const streamX = (o) => { const w = 5 * Math.sin(o * 0.045) + 3 * Math.sin(o * 0.11 + 1); return vp(72 + w, o); };
    const deer = [];
    {
      const P = makePainter('stream'), r = P.rng, sb = P.sb;
      for (let o = -230; o < 260; o += 1.15 / Math.min(1, detail + 0.2)) {
        const near = Math.abs(o) < 70 ? 1 : 0.5; if (r() > near) continue;
        const [x0, z0] = streamX(o), [x1, z1] = streamX(o + 2.6), w = r.range(-2.6, 2.6), len = r.range(0.75, 1);
        sb.add([x0 + Hd[0] * w, gh(x0, z0) + 0.03, z0 + Hd[1] * w], [(x1 - x0) * len, 0, (z1 - z0) * len], [0, 1, 0], r.range(0.3, 0.5), r() < 0.36 ? CREAM : BLUE, { level: 3, dab: 1 });
      }
      // a profile relief in the plane of the stream bank; only the head is turned to us. kind: deer | sow | piglet
      const beast = (o, s, dir, k, kind, bone, hbone, fr = null) => {
        const [bx, bz] = fr ? fr.p : vp(s, o), y0 = gh(bx, bz), ax = fr ? fr.ax : [Ld[0] * dir, Ld[1] * dir], nV = fr ? fr.nV : [-Hd[0], 0, -Hd[1]];
        const S = (t, y, w = 0) => [bx + ax[0] * t * k + nV[0] * w * k, y0 + y * k, bz + ax[1] * t * k + nV[2] * w * k];
        const St = (rows) => rows.map(([t, y, a, b, n, w]) => [...S(t, y, w || 0), a * k, b * k, n]);
        const u0 = uAt(bx, bz), bth = coat2(r, u0, 0.35), pig = kind === 'deer';
        const main = pig ? OCHRE : CREAM, under = pig ? CREAM : OCHRE, fat = pig ? 1 : 1.55, hy = pig ? 0 : -2.1;
        const wd = 0.42 * Math.max(0.6, k), ln = [0.9 * k, 2 * k];
        P.loft(St([[-3.6, 4.9, 0.25, 0.5, 2], [-3, 4.9, 0.8, 1.2 * fat, 2.6], [-1, 4.7, 0.95, 1.35 * fat, 3], [1.5, 4.8, 0.95, 1.4 * fat, 3], [3, 5.1, 0.8, 1.2 * fat, 2.6], [3.7, 5.3, 0.3, 0.6, 2]]), nV, [0, 1, 0],
          { bone, width: wd, len: ln, reverse: true, birth: bth, pig: (Q, N) => (N[1] < -0.35 ? under : main) });
        if (pig) P.loft(St([[2.7, 5.2, 0.6, 0.9, 2.4], [3.4, 6.4, 0.5, 0.7, 2.3], [4, 7.6, 0.45, 0.6, 2.2], [4.3, 8.5, 0.4, 0.55, 2]]), nV, [ax[0], 0, ax[1]],
          { bone: hbone, ns: 6, nq: 12, width: wd * 0.8, len: [0.7 * k, 1.4 * k], birth: bth, pig: (Q, N) => (N[0] * ax[0] + N[2] * ax[1] > 0.3 ? under : main) });
        const hc = pig ? [4.3, 8.9] : [3.6, 5.4 + hy * 0.2];      // head: a solid turned out of the plane toward us
        P.loft([[-0.9, 0, 0.3, 0.3, 2], [-0.4, 0.05, 0.75, 0.8, 2.3], [0.5, 0, 0.7, 0.72, 2.3], [1.5, -0.25, 0.42, 0.42, 2.2], [2.1, -0.35, 0.3, 0.3, 2]].map(([w, dy, a, b, n]) => [...S(hc[0], hc[1] + dy * (pig ? 1 : 1.3), w * (pig ? 1 : 1.2)), a * k * (pig ? 1 : 1.5), b * k * (pig ? 1 : 1.4), n]),
          [ax[0], 0, ax[1]], [0, 1, 0], { bone: hbone, ns: 8, nq: 12, width: wd * 0.75, len: [0.5 * k, 1.1 * k], reverse: true, birth: bth, pig: (Q, N, sm) => (sm > 0.9 ? (pig ? -1 : BRICK) : N[1] < -0.5 ? under : main) });
        const es = pig ? 0.5 : 0.72, ew = pig ? 0.62 : 0.4;
        for (const sd of [-1, 1]) {
          const ep = S(hc[0] + sd * es, hc[1] + 0.3, ew); P.eye(ep, [nV[0] * 0.92 + ax[0] * sd * 0.38, 0.05, nV[2] * 0.92 + ax[1] * sd * 0.38], Math.max(0.25, (fr ? 0.2 : 0.27) * k), hbone);
          const e0 = S(hc[0] + sd * 0.55, hc[1] + 0.65, -0.3); sb.add(e0, [ax[0] * sd * 0.5 * k, 1.25 * k * (pig ? 1 : 0.6), ax[1] * sd * 0.5 * k], nV, 0.4 * k, main, { bone: hbone, birth: bth() });
        }
        if (fr && fr.antler) for (const sd of [-1, 1]) {   // antlers: one ochre beam each side, two tines
          const b0 = S(hc[0] + sd * 0.4, hc[1] + 0.9, 0), d = [ax[0] * sd * 1.2 * k, 3 * k, ax[1] * sd * 1.2 * k];
          sb.add(b0, d, nV, 0.36 * k, OCHRE, { bone: hbone, seed: 0.1 });
          for (const [fq, ox, oy] of [[0.4, 1.3, 0.8], [0.78, -0.75, 1]]) sb.add([b0[0] + d[0] * fq, b0[1] + d[1] * fq, b0[2] + d[2] * fq], [ax[0] * sd * ox * k, oy * k, ax[1] * sd * ox * k], nV, 0.3 * k, OCHRE, { bone: hbone, seed: 0.1 });
        }
        for (const [t, w] of [[-2.7, 0.5], [-2.1, -0.5], [2.1, 0.5], [2.7, -0.5]]) {
          // a leg is one closed limb: a thigh stroke and a shank stroke laid over each other on the first thin pass
          const p = S(t, 3.75 - (pig ? 0 : 0.6), w), b = bth(), dy = y0 - p[1] + 0.05, lf = [nV[0] * 0.05, 0, nV[2] * 0.05];
          sb.add(p, [0, dy, 0], nV, 0.36 * k, main, { bone, birth: b });
          sb.add([p[0] + lf[0], p[1] + 0.25 * k, p[2] + lf[2]], [0, dy * 0.62 - 0.25 * k, 0], nV, 0.66 * k, main, { bone, birth: b, variant: 0, seed: 0 });
          sb.add([p[0] + lf[0] * 2, p[1] + dy * 0.42, p[2] + lf[2] * 2], [0, dy * 0.58, 0], nV, 0.5 * k, main, { bone, birth: b, variant: 1, seed: 0 });
          if (!pig) sb.add([p[0] - ax[0] * 0.3 * k + lf[0] * 3, p[1], p[2] - ax[1] * 0.3 * k + lf[2] * 3], [0, dy * 0.9, 0], nV, 0.22 * k, under, { bone, birth: b, variant: 2, seed: 0.1 });
        }
        sb.add(S(-3.5, 5.3), [-ax[0] * 0.5 * k, 0.5 * k, -ax[1] * 0.5 * k], nV, 0.4 * k, CREAM, { bone });
        P.fan(bx + ax[0] * 2.4 * k + nV[0] * 1.6, bz + ax[1] * 2.4 * k + nV[2] * 1.6, 1.5); P.fan(bx - ax[0] * 2.6 * k + nV[0] * 1.3, bz - ax[1] * 2.6 * k + nV[2] * 1.3, 1.3);
        return { pivot: S(2.8, 5.2), x: bx, z: bz, ax, bone, hbone };
      };
      // eight at the stream; the nearest stands 9 m to port of the path
      const seats = [[22, 93, -1], [-14, 86, -1], [-25, 90, -1], [-37, 87, 1], [-50, 85, -1], [-62, 89, 1], [-76, 86, 1], [-90, 88, -1]];
      for (let i = 0; i < seats.length; i++) {
        const [o, s, dir] = seats[i], bound = i === 1 || i === 2;
        const kind = sow ? (i === 0 ? 'sow' : 'piglet') : 'deer', k = sow ? (i === 0 ? 1.25 : 0.5) : 1;
        deer.push({ ...beast(o, s, dir, k, kind, bound ? 2 + i : 0, bound ? 2 + i : dir > 0 ? 1 : 5), bound, dir, i });
        await ctx.yield();
      }
      {   // by the haystack beyond the flank run: a stag with his antlers, a doe and a fawn, heads turned to us
        const F = (x, z, sd) => ({ p: [x, z], ax: [0.94 * sd, -0.34 * sd], nV: [-0.34, 0, -0.94] });
        for (const [x, z, sd, k, an] of [[102, 176, 1, 1.75, 1], [85, 172, 1, 1.25, 0], [93, 175, -1, 0.75, 0]]) { beast(0, 0, 1, k, 'deer', 0, 0, { ...F(x, z, sd), antler: an }); await ctx.yield(); }
      }
      {
        const Fd = (x, z, sd) => ({ p: [x, z], ax: [0.485 * sd, -0.875 * sd], nV: [-0.875, 0, -0.485] });
        beast(0, 0, 1, 1.4, 'deer', 0, 0, Fd(105.5, 85.5, 1)); await ctx.yield(); beast(0, 0, 1, 0.75, 'deer', 0, 0, Fd(104.5, 97.5, -1));   // (moved 3 m along the bank: the doe stands whole in the picture at u 0.08, her rump was cut by its edge) await ctx.yield();
      }
      {   // beside the laid cloth: a stag and a fawn to starboard, a doe to port, heads turned to the eye coming down it
        const Fc = (x, z, sd) => { const sx = x > 0 ? 1 : -1; return { p: [x, z], ax: [0.866 * sd, -0.5 * sx * sd], nV: [-sx * 0.5, 0, -0.866] }; };
        for (const [x, z, sd, k, an] of [[-23, 290, 1, 1.25, 1], [-18.5, 283, -1, 0.7, 0], [24, 242, -1, 1.05, 0], [-21, 349, 1, 0.9, 0]]) { beast(0, 0, 1, k, 'deer', 0, 0, { ...Fc(x, z, sd), antler: an }); await ctx.yield(); }
      }
      P.finish(); deer.P = P; await ctx.yield();
    }

    // ---- the laid cloth: cream strokes in lanes, pressed fold lines every 13 m left bare, a hem that lifts ----
    const uTab = []; for (let z = 150; z <= 375; z += 5) uTab.push(uAt(0, z));
    const uZ = (z) => { if (z < 150) return 0.3; const f = Math.min(uTab.length - 1.001, (z - 150) / 5), i = Math.floor(f); return lerp(uTab[i], uTab[i + 1], f - i); };
    {
      const P = makePainter('cloth'), r = P.rng, sb = P.sb, up = [0, 1, 0]; P.streak = 0.6; const FS = formStreams('cloth'), mk = FS.mk;
      let n = 0, dragRule = null;   // dragRule: the birth rule of the lengthwise drags, as it stands below, kept to be asked again for the broader coats
      for (let x = CL.x0 + 0.35; x < CL.x1 - 0.2; x += 0.57) {
        for (let f0 = CL.z0; f0 < CL.z1 - 1; f0 += 13) {
          if (Math.round((f0 - CL.z0) / 13) % 2 === 1) continue;
          const za = f0 + 0.06 + 0.04 * r(), zb = Math.min(CL.z1, f0 + 13) - 0.06 - 0.04 * r(), xs = x, ws = 0.86;
          let z = za - r() * 4;
          while (z < zb - 0.5) {
            const rl = r(), full = 2.4 + 3.2 * rl * rl + 1.2 * r(), z0 = Math.max(za, z), z1 = Math.min(zb, z + full), len = z1 - z0;
            z += full * (r() < 0.12 ? 1.02 : r.range(0.7, 0.9));
            if (len < 0.5) continue;
            dragRule = (r, z0) => {   // (the next line as it was: now the body of the rule, so it can be asked again)
            const u0 = uZ(z0), b = r() < 0.12 ? u0 - lerp(0.1, 0.18, r()) : -1;
            return b; }; const b = dragRule(r, z0);
            // the pressed fold is a gap of bare cloth a brush wide: every drag stops 0.2 m short of it
            const zc0 = Math.max(z0, za + 0.2), zc1 = Math.min(z1, zb - 0.2), lc = zc1 - zc0;
            sb.add([xs + r.range(-0.05, 0.05), 0.03, zc0], [r.range(-0.06, 0.06), 0, Math.max(lc, 0.01)], up, r.range(0.62, 0.74) * (lc > 0.3 ? ws : 0), CREAM, { level: 6, birth: b > 0.004 ? b : -1, seed: 0.25 + 1.5 * r.range(0.0, 0.42) });
            if (++n % 400 === 0) await ctx.yield();
          }
        }
      }
      for (let f0 = CL.z0 + 13; f0 < CL.z1 - 1; f0 += 26) for (let z = f0 + 0.4, row = 0; z < Math.min(CL.z1, f0 + 13) - 0.3; z += 0.57, row++) {
        let x = -12.5 - r() * 1.5;
        while (x < 12.4) {
          const rl = r(), full = 2.4 + 3.2 * rl * rl + 1.2 * r(), x0 = Math.max(-12.5, x), x1 = Math.min(12.5, x + full), len = x1 - x0, back = row % 2 === 1; x += full * r.range(0.72, 0.92);
          if (len < 0.5) continue;
          const b = r() < 0.12 ? uZ(z) - lerp(0.1, 0.18, r()) : -1;
          sb.add([back ? x1 : x0, 0.03, z + r.range(-0.05, 0.05)], [back ? -len : len, 0, r.range(-0.06, 0.06)], up, r.range(0.62, 0.74) * 0.86, CREAM, { level: 6, birth: b > 0.004 ? b : -1, seed: 0.25 + 1.5 * r.range(0.0, 0.42) });
          if (++n % 400 === 0) await ctx.yield();
        }
      }
      // the broader coats of the cloth (kinds 7..9): drags along its length in lanes 1.45, 3 and 4.3 m apart, each drawn
      // nine tenths of its lane wide so the cloth's own black lies between two lanes, one drag laid over the dry end of
      // the last, and every 13 m the pressed fold left bare (wider on the broader coats, so it still reads far off)
      // (on the panels whose fine strokes run crosswise the broad coats run crosswise too, further down: this loop skips
      // those panels, laying nothing and drawing nothing there)
      const COATS = [[7, 1.45, 1.32, 5, 10, 0.3], [8, 3, 2.75, 6.5, 12.5, 0.45], [9, 4.3, 3.95, 12, 12.5, 0.6]];
      const crossPanel = (f0) => Math.round((f0 - CL.z0) / 13) % 2 === 1;
      for (const [lv, pitch, wd, l0, l1, inset] of COATS) {
        for (let x = CL.x0 + 0.3 + pitch * 0.5; x < CL.x1 - pitch * 0.3; x += pitch) for (let f0 = CL.z0; f0 < CL.z1 - 1; f0 += 13) {
          if (crossPanel(f0)) continue;
          const za = f0 + inset, zb = Math.min(CL.z1, f0 + 13) - inset; let z = za - mk() * l0 * 0.5;
          while (z < zb - 0.8) {
            const full = mk.range(l0, l1), z0 = Math.max(za, z), z1 = Math.min(zb, z + full); z += full * mk.range(0.8, 0.94);
            if (z1 - z0 < 0.8) continue;
            sb.add([x + mk.range(-0.08, 0.08) * pitch, 0.03, z0], [mk.range(-0.03, 0.03) * pitch, 0, z1 - z0], up, wd * mk.range(0.92, 1.08), CREAM, { level: lv, seed: mk.range(0.2, 0.8), rng: mk });
          }
        }
        await ctx.yield();
      }
      // their landing: the rule of the drags (fold lines fill on the cloth), asked at each broad drag's own middle
      {
        const L = landing(sb, 0, 0);
        await ctx.yield(); while (!L.over(250)) await ctx.yield();
        P.rng.lent(FS.ld, (ld) => L.which((M) => dragRule(ld, M[2])));
        while (!L.when(60)) await ctx.yield();
        await ctx.yield();
      }
      // the crosswise panels: all coats of one panel run the same way. There the broad coats are laid the way that
      // panel's fine strokes run: across the cloth from hem to hem (x -12.5 to 12.5), in rows that fill the panel
      // from fold inset to fold inset: the least whole number of rows that stand
      // no further apart than the coat's lengthwise lanes, at even steps, each row the same share of its step wide as
      // the lengthwise drag is of its lane; every second row drawn backwards (from the other hem), one drag laid over
      // the dry end of the last by the lengthwise rule, and every row held inside its own step, so none is nearer a
      // pressed fold than the coat's inset. They draw from one stream of their own.
      {
        const cx = ctx.core.makeRng(ctx.core.hashSeed('marks-cloth-cross:' + ctx.seed)), q0 = sb.q.length, s0 = sb.s.length, xa = -12.5, xb = 12.5;
        for (const [lv, pitch, wd, l0, l1, inset] of COATS) {
          for (let f0 = CL.z0 + 13; f0 < CL.z1 - 1; f0 += 26) {
            const za = f0 + inset, zb = Math.min(CL.z1, f0 + 13) - inset, rows = Math.ceil((zb - za) / pitch - 1e-9), step = (zb - za) / rows, ws = step * wd / pitch;
            for (let row = 0; row < rows; row++) {
              const zr = za + (row + 0.5) * step, back = row % 2 === 1; let t = -cx() * l0 * 0.5;   // t: metres from the hem the row begins at
              while (t < xb - xa - 0.8) {
                const full = cx.range(l0, l1), t0 = Math.max(0, t), t1 = Math.min(xb - xa, t + full); t += full * cx.range(0.8, 0.94);
                if (t1 - t0 < 0.8) continue;
                const jz = cx.range(-0.08, 0.08) * step, sl = cx.range(-0.03, 0.03) * step, wi = ws * cx.range(0.92, 1.08);
                const zlo = zr - 0.5 * (step - wi), zhi = zr + 0.5 * (step - wi), zs = Math.min(zhi, Math.max(zlo, zr + jz)), ze = Math.min(zhi, Math.max(zlo, zs + sl));
                sb.add([back ? xb - t0 : xa + t0, 0.03, zs], [back ? t0 - t1 : t1 - t0, 0, ze - zs], up, wi, CREAM, { level: lv, seed: cx.range(0.2, 0.8), rng: cx });
              }
            }
          }
          await ctx.yield();
        }
        // their landing: the same rule of the drags, asked at each one's own middle, by the same code; its draws for
        // them come from their own stream ('marks-cloth-cross'), which no other form reads
        const L = landing(sb, q0, s0);
        await ctx.yield(); while (!L.over(250)) await ctx.yield();
        L.which((M) => dragRule(cx, M[2]));
        while (!L.when(60)) await ctx.yield();
        await ctx.yield();
      }
      // the hem: crosswise strokes whose dry ends lift in slow waves (bone 7), a brick line inside it
      for (const sd of [-1, 1]) for (let z = CL.z0; z < CL.z1; z += 0.6) {
        if (Math.floor(z / 0.6) % 4 === 0) for (const e of [0, 0.62]) sb.add([sd * (12.75 + e), 0.06, z + e], [sd * r.range(-0.06, 0.06), 0, 2.7], up, 0.7, CREAM, { level: 5, seed: r.range(0, 0.3) });
      }
      // the border: one broad brick line and a thin one inside it all round, and a fringe of cream threads at both ends
      for (const sd of [-1, 1]) {
        for (let z = CL.z0 + 1.3; z < CL.z1 - 1.6; z += 2.55) sb.add([sd * 11.3 + r.range(-0.04, 0.04), 0.1, z], [0, 0, Math.min(2.9, CL.z1 - 1.3 - z)], up, 0.55, BRICK, { seed: r.range(0, 0.25) });
        for (let z = CL.z0 + 2.4; z < CL.z1 - 2.6; z += 2.3) sb.add([sd * 10.25, 0.1, z], [0, 0, 2.0], up, 0.2, BRICK, { seed: r.range(0, 0.25) });
      }
      for (const [zz, sd] of [[CL.z0, 1], [CL.z1, -1]]) {
        for (let x = -11.3; x < 11.2; x += 2.55) sb.add([x, 0.1, zz + sd * 1.3], [Math.min(2.9, 11.5 - x), 0, 0], up, 0.55, BRICK, { seed: r.range(0, 0.25) });
        for (let x = -10.2; x < 10; x += 2.3) sb.add([x, 0.1, zz + sd * 2.35], [2.0, 0, 0], up, 0.2, BRICK, { seed: r.range(0, 0.25) });
        for (let x = -13.2; x < 13.3; x += 0.5) sb.add([x + r.range(-0.08, 0.08), 0.05, zz + sd * 0.2], [r.range(-0.2, 0.2), 0, -sd * r.range(1.5, 2.3)], up, 0.22, CREAM, { seed: r.range(0, 0.3) });
      }
      for (const [zz, sd] of [[CL.z0, -1], [CL.z1, 1]]) for (let x = CL.x0 - 0.6; x < CL.x1; x += 2.4) for (const e of [0, 0.62]) sb.add([x + e, 0.06, zz + sd * (0.1 + e)], [2.7, 0, r.range(-0.06, 0.06)], up, 0.7, CREAM, { level: 5, seed: r.range(0, 0.3) });
      P.finish(); await ctx.yield();
    }

    // ---- the feast: jars big as houses, crescent loaves, a fish on a plate, a cut melon, drinking horns ----
    // the cut melon stands with its face squared to the eye at u 0.79: MELN the face normal, MELP along the face
    const MEL = [-21.5, 326], MELN = [0.68, -0.733], MELP = [0.733, 0.68];
    const jars = [[-5, 80, 16, 4.3], [7, 94, 13, 3.8], [10.8, 217, 15, 4], [-11.6, 213, 18, 4.4], [-37, 322, 13, 3.8], [-11, 150, 15, 4.1], [-11.6, 176, 15, 4], [-12.5, 356, 14, 3.8], [11.5, 150, 12, 3.6], [31, 262, 15, 4]];
    {
      const P = makePainter('feast'), r = P.rng, sb = P.sb, X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1]; P.streak = 0.6; P.lad = MIDLAD; let nJar = 0, nLoaf = 0, nHorn = 0;   // each form of the feast is named by its kind and its place in its own list
      const snow = season === 'snow';
      for (const [x, z0j, H, R] of jars) {
        const z = z0j + (z0j === 213 ? 9 : z0j === 217 ? 7 : 0), u0 = uAt(x, z), bth = coat2(r, z < 150 ? 0.3 : u0, 0.4);
        const prof = [[0.004, 0.5], [0.1, 0.78], [0.3, 0.97], [0.5, 1], [0.68, 0.86], [0.82, 0.52], [0.91, 0.36], [0.97, 0.42], [1, 0.47]];
        const q0 = sb.q.length, s0 = sb.s.length;
        const Lj = await P.loftA(prof.map(([h, q]) => [x, h * H, z, q * R, q * R, 2]), X, Z, { ns: 18, nq: 24, width: 0.62, len: [1.7, 3.2], gap: 0.07, s0: 0.01, s1: 0.995, birth: bth, level: 6,
          pig: (Q, N, s) => (s > 0.955 ? -1 : s > 0.63 && s < 0.86 ? (snow && s > 0.7 ? CREAM : OCHRE) : BRICK) });
        trimBelow(sb, q0, s0, 0.065 * H); landed(P, formStreams('feast-jar-' + nJar++), bth, (mk) => rungs(P, Lj, mk, jarZones(snow)));
        for (let a = 0; a < 5; a++) { const an = a / 5 * 6.28 + r(); P.fan(x + Math.cos(an) * (R * 0.62 + 0.4), z + Math.sin(an) * (R * 0.62 + 0.4), 1.7, { pig: GREEN }); }
        await ctx.yield();
      }
      // loaves: [x, z0, bulge side] 28 m crescents lying along the cloth, ochre with brick tips
      for (const [x, z0, sd] of [[-8.2, 100, -1], [9, 112, 1]]) {
        const st = [], N = 9, bth = coat2(r, uZ(z0 + 14), 0.4);
        for (let i = 0; i <= N; i++) { const t = i / N, e = Math.sin(t * Math.PI), w = 0.25 + 2.0 * Math.pow(e, 0.6); st.push([x + sd * 2.6 * e, w * 0.85, z0 + 28 * t, w, w * 0.85, 2.2]); }
        const Ll = await P.loftA(st, X, Y, { ns: 22, nq: 16, width: 0.55, len: [1.4, 2.6], birth: bth, level: 6, pig: (Q, N2, s) => (s < 0.12 || s > 0.88 ? BRICK : (snow && N2[1] > 0.8 ? CREAM : OCHRE)) });
        landed(P, formStreams('loaf-' + nLoaf++), bth, (mk) => rungs(P, Ll, mk, [[0.02, 0.12, () => BRICK], [0.12, 0.88, (Q, N2) => (snow && N2[1] > 0.8 ? CREAM : OCHRE)], [0.88, 0.98, () => BRICK]], 0.55));
        P.fan(x - sd * 2.8, z0 + 6, 1.4); P.fan(x - sd * 2.8, z0 + 21, 1.5);
      }
      await ctx.yield();
      // the cut melon: brick flesh toward us, green rind, seeds left as bare cloth
      {
        const FM = formStreams('melon');   // the melon is one form: its rind and its cut face draw from the same two streams
        const mx = MEL[0], mz = MEL[1], a = 6.9, b = 6.3, bth = coat2(r, uZ(mz), 0.4), ax = [-MELN[0], 0, -MELN[1]], pp = [MELP[0], 0, MELP[1]];
        const at = (t, w) => [mx + ax[0] * t + pp[0] * w, 0, mz + ax[2] * t + pp[2] * w];
        const Lr = await P.loftA([[0, 1], [2.4, 0.97], [4.6, 0.72], [5.6, 0.25]].map(([t, q]) => { const c = at(t, 0); return [c[0], b + 0.1, c[2], a * q, b * q, 2]; }), pp, Y,
          { ns: 8, nq: 28, width: 0.55, len: [1.2, 2.2], birth: bth, level: 6, pig: () => GREEN });
        landed(P, FM, bth, (mk) => rungs(P, Lr, mk, [[0.02, 0.98, () => GREEN]], 0.55));
        // the cut face reads as a melon from the cloth: a green rind round the rim, a cream ring of pith inside it, the
        // brick flesh in level drags, and the seeds left as bare cloth in two dotted rings (a drag stops and starts again)
        const FK = 0.8, nF = [MELN[0], 0, MELN[1]]; let row = 0;
        for (let y = b - FK * b + 0.3; y < b + FK * b; y += 0.52, row++) {
          const dy = y - b, hw = FK * a * Math.sqrt(Math.max(0, 1 - (dy / (FK * b)) * (dy / (FK * b)))) - 0.15, gaps = []; let x = -hw;
          if (row % 2 === 0) for (const f of [0.5, 0.25]) if (Math.abs(dy) < f * b * 0.97) { const sx = f * a * Math.sqrt(Math.max(0, 1 - (dy / (f * b)) * (dy / (f * b)))); if (sx > 0.7) gaps.push(-sx, sx); else gaps.push(0); }
          gaps.sort((p, q) => p - q);
          while (x < hw - 0.3) {
            let len = Math.min(r.range(2.2, 6), hw - x), nx = null; for (const g of gaps) if (g - 0.5 > x - 0.2 && g - 0.5 < x + len) { len = g - 0.5 - x; nx = g + 0.5; break; }
            if (len > 0.25) { const c = at(-0.08, x); sb.add([c[0], y + 0.1, c[2]], [pp[0] * len, r.range(-0.08, 0.08), pp[2] * len], nF, 0.52, BRICK, { level: 6, birth: bth(), seed: r.range(0.1, 0.6) }); }
            x = nx !== null ? nx : x + Math.max(0.3, len * r.range(0.7, 0.9));
          }
        }
        // the flesh on the broader coats: level drags 1, 2 and 3.6 m wide in rows with the cloth between, a seed's gap
        // of bare cloth between two drags of a row
        landed(P, FM, bth, (mk) => {
        for (const [lv, pitch, wd, l0, l1] of [[7, 1.25, 1.12, 2.6, 5], [8, 2.5, 2.25, 4, 7], [9, 4.4, 4.0, 6, 10]]) {
          for (let y = b - FK * b + pitch * 0.6; y < b + FK * b - pitch * 0.3; y += pitch) {
            const dy = y - b, hw = FK * a * Math.sqrt(Math.max(0, 1 - (dy / (FK * b)) * (dy / (FK * b)))) - wd * 0.3; let x = -hw + mk() * 0.5;
            while (x < hw - 0.6) {
              const len = Math.min(mk.range(l0, l1), hw - x), c = at(-0.08, x);
              if (len > 0.6) sb.add([c[0], y + 0.1, c[2]], [pp[0] * len, mk.range(-0.08, 0.08), pp[2] * len], nF, wd, BRICK, { level: lv, seed: mk.range(0.1, 0.6), rng: mk });
              x += len + pitch * mk.range(0.3, 0.6);
            }
          }
        }
        });
        for (const [k, w, pg, n] of [[0.875, 0.5, CREAM, 30], [0.975, 0.85, GREEN, 26]]) for (let i = 0; i < n; i++) {
          const a0 = i / n * 6.2832, a1 = (i + 0.93) / n * 6.2832, c0 = at(-0.1, Math.cos(a0) * a * k), c1 = at(-0.1, Math.cos(a1) * a * k), y0 = b + 0.1 + Math.sin(a0) * b * k, y1 = b + 0.1 + Math.sin(a1) * b * k;
          sb.add([c0[0], y0, c0[2]], [c1[0] - c0[0], y1 - y0, c1[2] - c0[2]], nF, w, pg, { birth: bth(), seed: r.range(0.1, 0.4) });
        }
        P.fan(mx - 4.4, mz + 1, 1.6); P.fan(mx + 4.6, mz + 2, 1.4);
      }
      // drinking horns: ochre, curved, the mouth left bare
      for (const [x, z, sd] of [[-9, 160, 1], [-9, 136, 1]]) {
        const st = [], bth = coat2(r, uZ(z), 0.4);
        for (let i = 0; i <= 7; i++) { const t = i / 7, w = 0.25 + 1.25 * t; st.push([x + sd * 1.8 * t * t, w + 2.6 * t * t, z + 8.5 * t, w, w, 2]); }
        const Lh = await P.loftA(st, X, Y, { ns: 12, nq: 14, width: 0.42, len: [1, 2], birth: bth, level: 6, pig: (Q, N2, s) => (s > 0.93 ? -1 : s > 0.8 ? BRICK : OCHRE) });
        landed(P, formStreams('horn-' + nHorn++), bth, (mk) => rungs(P, Lh, mk, [[0.03, 0.8, () => OCHRE], [0.8, 0.93, () => BRICK]], 0.42));
        P.fan(x - sd * 1.5, z + 2, 1.2);
      }
      P.finish(); await ctx.yield();
    }

    // ---- the exit: haystacks, the giraffe (or an ochre lion) in the plane z = 400, the blank signboard ----
    const END = path.end.clone(), ET = path.endTangent.clone().normalize();
    const OLDV = [48, 377, 50];   // the old vine on its pole beside the exit animal: x, z, height
    const exitAnimal = {}, sideAnimal = {}, SIDE_C = [30, 300], SIDE_S = 0.68, SIDE_G = new THREE.Vector3(23, 11.5, 300);
    {
      const P = makePainter('exit'), r = P.rng, sb = P.sb, X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1];
      const stack = async (x, z, H, R, u0) => {
        const bth = coat2(r, u0, 0.4), y0 = gh(x, z);
        const L = await P.loftA([[0, 0.8], [0.12, 1], [0.45, 0.93], [0.72, 0.74], [0.9, 0.46], [1, 0.05]].map(([h, q]) => [x, y0 + h * H, z, q * R, q * R, 2]), X, Z,
          { ns: 12, nq: 22, width: 0.6, len: [1.6, 3.4], gap: 0.1, reverse: true, birth: bth, pig: () => (season === 'snow' && r() < 0.0 ? CREAM : OCHRE), s0: 0.01, s1: 0.97 });
        for (let q = 0.02; q < 1; q += 0.09) { if (q > 0.5 && q < 0.6) await ctx.yield(); flickRow(sb, L, r, { q, s0: 0.1, s1: 0.96, step: 1.5, len: 1.5, width: 0.34, pig: season === 'snow' && q > 0.1 && q < 0.4 ? CREAM : OCHRE, mode: 'fin', birth: bth }); }
        for (let a = 0; a < 7; a++) { const an = a / 7 * 6.28 + r(); P.fan(x + Math.cos(an) * (R * 0.85 + 0.6), z + Math.sin(an) * (R * 0.85 + 0.6), 1.9); }
      };
      await stack(-5, 403, 35, 12.5, 0.84); await ctx.yield();
      await stack(121, 140, 18, 7.5, 0.2); await ctx.yield(); await stack(-40, 215, 13, 6, 0.5); await ctx.yield();
      const GO = [13, 0, -5];   // the exit animal stands clear of the signboard: head and frame never overlap from the last climb
      // the giraffe's patches, as he drew them: rounded, irregular, close-set rounds of the bare cloth, larger on the body and
      // smaller down the neck and legs, each edged by two or three short dry cream strokes that land late. A patch is a
      // small plate of the body's own black, wrapped on the form just proud of the coat (never a slot left between strokes).
      const spots = (PA, L, sr, o) => {
        const C = [0, 0, 0], Nc = [0, 0, 0], A = [0, 0, 0], B = [0, 0, 0], V = [0, 0, 0], Nv = [0, 0, 0], pos = [], idx = [], NV = 10, lift = 0.2;
        const cum = [0]; L.at(o.s0, 0.1, A);   // rows are spaced by metres along the form, not by station
        for (let i = 1; i <= 40; i++) { L.at(o.s0 + (o.s1 - o.s0) * i / 40, 0.1, B); cum.push(cum[i - 1] + Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2])); A[0] = B[0]; A[1] = B[1]; A[2] = B[2]; }
        const len = cum[40], sOf = (t) => { let i = 1; while (i < 40 && cum[i] < t * len) i++; const d = cum[i] - cum[i - 1]; return o.s0 + (o.s1 - o.s0) * (i - 1 + (d > 1e-6 ? (t * len - cum[i - 1]) / d : 0)) / 40; };
        const rows = Math.max(1, Math.round(len / o.step)), cols = Math.max(3, Math.round(L.perim / o.step));
        for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
          const sC = sOf((i + 0.5 + sr.range(-0.13, 0.13)) / rows), q = L.qAt((j + (i % 2) * 0.5 + sr.range(-0.13, 0.13)) / cols);
          const R = o.R * sr.range(0.78, 1.12) * (1 - (o.taper || 0) * sC), el = sr.range(0.85, 1.3), tw = sr() * 6.28;
          L.at(Math.min(1, sC + 0.01), q, A); L.at(Math.max(0, sC - 0.01), q, B); const dsm = 0.02 / Math.max(0.05, Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]));
          L.at(sC, q + 0.005, A); L.at(sC, q - 0.005, B); const dqm = 0.01 / Math.max(0.02, Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]));
          L.at(sC, q, C, Nc); const base = pos.length / 3; pos.push(C[0] + Nc[0] * lift, C[1] + Nc[1] * lift, C[2] + Nc[2] * lift);
          const rim = [];
          for (let m = 0; m < NV; m++) {
            const th = m / NV * 6.283, rho = R * (0.82 + 0.3 * Math.sin(th * 2 + tw) * (el - 1) * 2 + sr.range(-0.1, 0.1));
            L.at(Math.min(1, Math.max(0, sC + Math.cos(th) * rho * el * dsm)), q + Math.sin(th) * rho * dqm, V, Nv);
            pos.push(V[0] + Nv[0] * lift, V[1] + Nv[1] * lift, V[2] + Nv[2] * lift); rim.push([V[0], V[1], V[2], Nv[0], Nv[1], Nv[2]]);
            idx.push(base, base + 1 + m, base + 1 + (m + 1) % NV);
          }
          const ne = 2 + (sr() < 0.5 ? 1 : 0), m0 = Math.floor(sr() * NV), bth = o.birth(C);
          for (let e = 0; e < ne; e++) {
            const a = rim[(m0 + e * 3) % NV], b = rim[(m0 + e * 3 + 3) % NV], ex = 0.18;
            PA.sb.add([a[0] + a[3] * 0.14 - (b[0] - a[0]) * ex, a[1] + a[4] * 0.14 - (b[1] - a[1]) * ex, a[2] + a[5] * 0.14 - (b[2] - a[2]) * ex],
              [(b[0] - a[0]) * (1 + 2 * ex), (b[1] - a[1]) * (1 + 2 * ex), (b[2] - a[2]) * (1 + 2 * ex)], [a[3], a[4], a[5]], Math.max(0.24, R * 0.42), CREAM, { birth: bth, seed: sr.range(0.3, 0.8) });
          }
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
        g.setAttribute('aBone', new THREE.BufferAttribute(new Float32Array(pos.length / 3), 1)); g.setIndex(idx); PA.geos.push(g);
      };
      const makeAnimal = async (PA, lion, r, aimL, dB, out) => {
      // the exit animal: a profile relief along X, facing -X, its head a solid turned to -Z (to us) at (16, 40, 396)
      const main = lion ? OCHRE : CREAM, legY = lion ? 15 : 20, bodyB = lion ? 7.5 : 6, by = legY + bodyB - 1;
      const patch = (Q) => noise.n2(Q[0] * 0.3 + 9, Q[1] * 0.3) + 0.5 * noise.n2(Q[0] * 0.8, Q[1] * 0.8 + 4);
      const late = (Q) => 0.83 + dB + 0.13 * Math.min(1, Q[1] / 42) + r.range(-0.01, 0.01);
      const gPig = (Q, N) => { if (lion) return N[1] < -0.5 ? CREAM : OCHRE; return CREAM; };
      const gBirth = (Q) => { if (!lion && patch(Q) > 0.22) return late(Q); return r() < 0.4 ? 0.74 + dB + 0.1 * r() : -1; };
      const go = { width: 0.75, len: [1.8, 3.6], gap: 0.08, pig: gPig, birth: gBirth };
      const sr = PA.rng.fork ? PA.rng.fork('spots') : PA.rng, sBirth = (Q) => (Q[1] > 26 ? late(Q) : -1);
      const bodyL = await PA.loftA([[44.5, by + 1, 400, 0.4, 1, 2], [43, by + 0.5, 400, 3, bodyB * 0.8, 3], [38, by, 400, 3.8, bodyB, 3.6], [30, by, 400, 3.9, bodyB, 3.6], [24, by + 1, 400, 3.7, bodyB * 0.95, 3.2], [20.5, by + 2, 400, 2.6, bodyB * 0.7, 2.6], [19.6, by + 2.4, 400, 0.5, 1, 2]], Z, Y, { ...go, ns: 20, nq: 26, reverse: true });
      await ctx.yield();
      const nk = await PA.loftA([[26, by + 1, 400, 3.4, 5.6, 3], [23.5, by + 6, 400, 3.3, 5, 2.8], [20.6, 36, 400, 3.2, 4.4, 2.6], [18, 41, 400, 2.9, 3.6, 2.4]], Z, X, { ...go, ns: 10, nq: 20 });
      if (!lion) { spots(PA, bodyL, sr, { s0: 0.1, s1: 0.9, R: 1.3, step: 3.3, birth: sBirth }); await ctx.yield(); spots(PA, nk, sr, { s0: 0.3, s1: 0.9, R: 1.05, step: 2.7, taper: 0.3, birth: sBirth }); await ctx.yield(); }
      flickRow(PA.sb, nk, r, { q: 0.5, s0: 0.05, s1: 0.95, step: 0.7, len: lion ? 3 : 1.6, width: 0.4, pig: lion ? BRICK : OCHRE, mode: 'fin', birth: () => 0.8 + dB + 0.1 * r() });
      if (lion) for (const q of [0.3, 0.4, 0.6, 0.7]) flickRow(PA.sb, nk, r, { q, s0: 0.2, s1: 0.98, step: 0.8, len: 3, width: 0.45, pig: q > 0.5 ? BRICK : OCHRE, mode: 'fin', birth: () => 0.8 + dB + 0.1 * r() });
      for (const [lx, lz] of [[23, 2], [27.5, -2], [36.5, 2], [41, -2]]) {
        const legL = await PA.loftA([[lx, legY + 3, 400 + lz, 1.5, 1.9, 3], [lx, legY * 0.5, 400 + lz, 1.25, 1.5, 3], [lx, 2.2, 400 + lz, 1.1, 1.3, 3], [lx - 0.4, 0.9, 400 + lz, 1.3, 1.9, 3], [lx - 0.4, 0.1, 400 + lz, 1.1, 1.6, 3]], Z, X, { ...go, ns: 10, nq: 14, pig: (Q, N) => (Q[1] < 1.5 ? (lion ? CREAM : OCHRE) : gPig(Q, N)) });
        if (!lion) spots(PA, legL, sr, { s0: 0.03, s1: 0.5, R: 0.56, step: 1.6, taper: 0.5, birth: sBirth });
        PA.fan(lx - 2.6, 400 + lz - 2.5, 2.2); PA.fan(lx + 2.4, 400 + lz - 2.2, 1.8); await ctx.yield();
      }
      await ctx.yield();
      // head: a full solid whose axis is pitched down the line to the eye on the last climb (path near u 0.9), so the
      // face, both eye rounds, the ears and the muzzle front us from u 0.86 to the last frame (group offset GO)
      {
        const HS = 1.45, C = [18.5, 43.5, 399.5];
        let Ax = aimL[0] - C[0], Ay = aimL[1] - C[1] + 2, Az = aimL[2] - C[2]; const al = Math.hypot(Ax, Ay, Az) || 1; Ax /= al; Ay /= al; Az /= al;
        const rl = Math.hypot(Az, Ax) || 1, Rv = [Az / rl, 0, -Ax / rl], Bv = [Ay * Rv[2] - Az * Rv[1], Az * Rv[0] - Ax * Rv[2], Ax * Rv[1] - Ay * Rv[0]], Av = [Ax, Ay, Az];
        const at = (t0, a0 = 0, b0 = 0) => { const t = t0 * HS, a = a0 * HS, b = b0 * HS; return [C[0] + Ax * t + Rv[0] * a + Bv[0] * b, C[1] + Ay * t + Rv[1] * a + Bv[1] * b, C[2] + Az * t + Rv[2] * a + Bv[2] * b]; };
        const rows = lion ? [[-3.3, 0.5, 0.5, 2, 0], [-2.5, 3.3, 3.3, 2.4, 0], [-0.5, 4.1, 4.1, 2.5, 0], [1.4, 4.0, 3.9, 2.6, 0], [3.0, 2.7, 2.5, 2.4, -0.5], [4.3, 2.1, 1.8, 2.3, -0.8], [4.9, 0.6, 0.5, 2, -0.8]]
          : [[-3.3, 0.5, 0.5, 2, 0], [-2.5, 2.7, 2.9, 2.4, 0], [-0.5, 3.4, 3.6, 2.5, 0], [1.5, 3.1, 3.2, 2.5, -0.1], [3.6, 2.3, 2.2, 2.4, -0.5], [5.6, 2.0, 1.8, 2.3, -0.8], [6.7, 1.6, 1.4, 2.2, -0.9], [7.15, 0.2, 0.18, 2, -0.9]];
        const st = rows.map(([t, a, b, n, dr]) => [...at(t, 0, dr), a * HS, b * HS, n]), HL = makeLoft(st, Rv, Bv), Q = [0, 0, 0], Nn = [0, 0, 0];
        const eyeS = lion ? 0.6 : 0.5, er = (lion ? 1.0 : 0.88) * HS, eyes = [];
        for (const q of [0.25 - 0.13, 0.25 + 0.13]) {   // q 0 = +R, 0.25 = +B (up the face)
          HL.at(eyeS, q, Q, Nn); const n = [Nn[0] * 0.55 + Ax, Nn[1] * 0.55 + Ay, Nn[2] * 0.55 + Az], l = Math.hypot(n[0], n[1], n[2]);
          eyes.push([Q[0], Q[1], Q[2]]); PA.eye([Q[0] + n[0] / l * 0.35, Q[1] + n[1] / l * 0.35, Q[2] + n[2] / l * 0.35], [n[0] / l, n[1] / l, n[2] / l], er, 0, 0.2);
        }
        const hole = (P2) => eyes.some((e) => Math.hypot(P2[0] - e[0], P2[1] - e[1], P2[2] - e[2]) < er * 0.95);
        await PA.loftA(st, Rv, Bv, { ...go, ns: 16, nq: 22, width: 0.8, len: [1.8, 3.4], reverse: true, s0: 0.03, s1: 0.995, seed: [0.0, 0.1], dry: 0,
          pig: (P2, N, sm) => (hole(P2) ? -1 : lion ? (sm > 0.95 ? BRICK : sm > 0.28 ? CREAM : OCHRE) : (N[0] * Bv[0] + N[1] * Bv[1] + N[2] * Bv[2] < (sm > 0.75 ? -0.1 : -0.75) ? OCHRE : CREAM)),
          birth: () => -1 });
        // ears that flick (bones 1, 2), the giraffe's two ochre horns with brick tips, or the lion's brick mane behind a cream face
        out.earPivots = []; out.axis = new THREE.Vector3(Ax, Ay, Az);
        for (const sd of [-1, 1]) {
          const e0 = at(-1.2, sd * 2.9, 2.4); out.earPivots.push(e0);
          for (const dv of [-0.5, 0.5]) PA.sb.add([e0[0] + Bv[0] * dv, e0[1] + Bv[1] * dv, e0[2] + Bv[2] * dv], [Rv[0] * sd * 4.3 + Bv[0] * 1.9, Rv[1] * sd * 4.3 + Bv[1] * 1.9, Rv[2] * sd * 4.3 + Bv[2] * 1.9], Av, 1.3, main, { bone: sd > 0 ? 1 : 2, seed: 0.1 });
          if (!lion) { const h0 = at(-1.4, sd * 1.15, 3.2); PA.sb.add(h0, [Bv[0] * 3.6, Bv[1] * 3.6, Bv[2] * 3.6], Av, 0.7, OCHRE, { seed: 0.1 }); PA.sb.add([h0[0] + Bv[0] * 3.3 - Rv[0] * 0.55, h0[1] + Bv[1] * 3.3, h0[2] + Bv[2] * 3.3 - Rv[2] * 0.55], [Rv[0] * 1.1, 0.01, Rv[2] * 1.1], Av, 1.0, BRICK, { seed: 0.1 }); }
        }
        if (lion) for (const [ring, tb, r0, ln] of [[0, -1.4, 3.7, 3.4], [1, -2.4, 2.9, 4.6]]) for (let a = ring * 0.07; a < 6.283; a += 0.145) {
          const ca = Math.cos(a), sa = Math.sin(a), b0 = at(tb, ca * r0, sa * r0), dd = at(tb - 0.9, ca * (r0 + ln), sa * (r0 + ln));
          PA.sb.add(b0, [dd[0] - b0[0], dd[1] - b0[1], dd[2] - b0[2]], Av, r.range(1.0, 1.35), ring === 0 ? OCHRE : BRICK, { birth: r() < 0.3 ? 0.7 + dB + 0.08 * r() : -1, seed: r.range(0, 0.2) });
        }
        if (!lion) for (const sd of [-1, 1]) { const n0 = at(7.05, sd * 0.8 - 0.3 * sd, -0.5); PA.sb.add(n0, [Rv[0] * 0.6 * sd, Rv[1] * 0.6 * sd, Rv[2] * 0.6 * sd], Av, 0.6, BRICK, { seed: 0.1 }); }
        out.headL = C;
      }
      PA.sb.add([44.4, by + 2, 400], [1.6, -7, 0], [0, 0, -1], 0.5, main, { bone: 3 }); PA.sb.add([46, by - 5, 400], [0.3, -1.8, 0], [0, 0, -1], 0.8, lion ? BRICK : OCHRE, { bone: 3 });
      out.tailPivot = [44.4, by + 2, 400]; out.P = PA;
      await ctx.yield();
      };
      const PA = makePainter('animal');
      { const aim = path.pointAt(0.9, new THREE.Vector3()); await makeAnimal(PA, lion, r, [aim.x - GO[0], aim.y, aim.z - GO[2]], 0, exitAnimal); }
      exitAnimal.head = [exitAnimal.headL[0] + GO[0], exitAnimal.headL[1], exitAnimal.headL[2] + GO[2]];
      PA.finish(); PA.group.position.set(GO[0], 0, GO[2]);
      // the other animal of the pair (the giraffe when the lion keeps the exit, the lion when the giraffe does) stands whole
      // beside the laid cloth, a profile relief squared to the eye at u 0.70, its head turned to us
      {
        const PB = makePainter('animal2'), g = PB.group, eye = path.pointAt(0.7, new THREE.Vector3());
        g.scale.setScalar(SIDE_S); g.rotation.y = Math.atan2(SIDE_C[0] - eye.x, SIDE_C[1] - eye.z);
        g.position.set(0, 0, 0); g.updateMatrix(); const c = new THREE.Vector3(31, 0, 400).applyMatrix4(g.matrix); g.position.set(SIDE_C[0] - c.x, 0, SIDE_C[1] - c.z); g.updateMatrix();
        const aimL = eye.clone().applyMatrix4(new THREE.Matrix4().copy(g.matrix).invert());
        await makeAnimal(PB, !lion, PB.rng, [aimL.x, aimL.y + 6, aimL.z], -0.3, sideAnimal);
        PB.finish();
      }
      // the signboard: a blank round-topped ochre frame with a brick inner line, on an ochre pole. Nothing is written.
      const rt = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), ET).normalize(), upv = new THREE.Vector3().crossVectors(ET, rt).normalize(), nB = [-ET.x, -ET.y, -ET.z];
      const fp = (a, b, back = 0) => [END.x + rt.x * a + upv.x * b + ET.x * back, END.y + rt.y * a + upv.y * b + ET.y * back, END.z + rt.z * a + upv.z * b + ET.z * back];
      const outline = (R, step, w, pig, bfn) => {
        const pts = []; for (let y = -R; y < 0; y += step) pts.push([-R, y]);
        for (let a = Math.PI; a > 0; a -= step / R) pts.push([Math.cos(a) * R, Math.sin(a) * R]);
        for (let y = 0; y > -R; y -= step) pts.push([R, y]);
        for (let x = R; x > -R; x -= step) pts.push([x, -R]); pts.push([-R, -R]);
        for (let i = 0; i < pts.length - 1; i++) { const a = fp(pts[i][0], pts[i][1], 0.2), b = fp(pts[i + 1][0], pts[i + 1][1], 0.2); sb.add(a, [(b[0] - a[0]) * 0.97, (b[1] - a[1]) * 0.97, (b[2] - a[2]) * 0.97], nB, w, pig, { birth: bfn() }); }
      };
      const sbth = () => (r() < 0.35 ? 0.62 + 0.2 * r() : -1);
      outline(7.3, 1.7, 0.24, BRICK, sbth); outline(8.15, 2.1, 1.05, OCHRE, sbth); outline(9.45, 2.3, 1.05, OCHRE, sbth);
      const foot = fp(0, -10), gy = gh(foot[0], foot[2]);
      for (const e of [-0.55, 0.55]) for (let y = foot[1]; y > gy; y -= 3.3) sb.add([foot[0] + e, y, foot[2]], [r.range(-0.05, 0.05), -Math.min(3.4, y - gy), 0], [0, 0, -1], 0.7, OCHRE, { birth: sbth() });
      P.fan(foot[0] - 1.6, foot[2] - 0.6, 2); P.fan(foot[0] + 1.7, foot[2] - 0.4, 1.7);
      P.finish(); await ctx.yield();
    }

    // ---- distance: the blue edge all round, the square tower, the train; brick vines to port; near ground marks ----
    const HC = [40, 200], HR = [720, 860], trainA = 1.0, far = makePainter('far');
    const ring = (a, lift = 0) => { const x = HC[0] + Math.cos(a) * HR[0], z = HC[1] + Math.sin(a) * HR[1], flat = sstep(0.25, 0.1, Math.abs(a - 0.8)); return [x, Math.hypot(x - 40, z - 200) * 0.158 * (1 + 0.16 * (1 - flat) * noise.n2(Math.cos(a) * 2.3, Math.sin(a) * 2.3)) + lift, z]; };
    {
      const P = far, r = P.rng, sb = P.sb;
      for (let a = 0; a < 6.283;) {
        const da = r.range(0.05, 0.085), p0 = ring(a), p1 = ring(a + da), n = [HC[0] - p0[0], 0, HC[1] - p0[2]], nl = Math.hypot(n[0], n[2]); n[0] /= nl; n[2] /= nl;
        sb.add(p0, [(p1[0] - p0[0]) * 1.7, (p1[1] - p0[1]) * 1.7, (p1[2] - p0[2]) * 1.7], n, r.range(19, 24), BLUE, { variant: Math.floor(r() * 4) });
        if (r() < 0.6) { const q0 = ring(a + da * 0.3, -15), q1 = ring(a + da * 0.95, -15); sb.add(q0, [(q1[0] - q0[0]) * 1.6, (q1[1] - q0[1]) * 1.6, (q1[2] - q0[2]) * 1.6], n, 14, BLUE, { variant: 4 + Math.floor(r() * 4) }); }
        a += da * 0.97;
      }
      await ctx.yield();
      {   // the square tower: ochre strokes, a brick cap, one bare window
        const b = ring(0.906, 6), n = [-0.6, 0, -0.8], tx = [0.8, 0, -0.6];
        for (let c = -1; c <= 1; c++) for (let h = 0; h < 4; h++) { if (c === 0 && h === 2) continue; sb.add([b[0] + tx[0] * c * 11.5, b[1] + h * 20.4, b[2] + tx[2] * c * 11.5], [0, 19.6, 0], n, 11, OCHRE, {}); }
        sb.add([b[0] - tx[0] * 19.5, b[1] + 86, b[2] - tx[2] * 19.5], [tx[0] * 39, 0, tx[2] * 39], n, 9, BRICK, {});
      }
      {   // the far train (bone 1 crawls it): nine ochre window dabs, a brick engine and a cream smoke flick, laid along
          // the edge itself a hand's breadth to port of the tower. Paint, not light.
        const aC = 0.66, t0 = ring(aC - 0.01), t1 = ring(aC + 0.01), tl = Math.hypot(t1[0] - t0[0], t1[2] - t0[2]), tx = [(t1[0] - t0[0]) / tl, 0, (t1[2] - t0[2]) / tl];
        const car = (i) => { const b = ring(aC + (i - 4) * 34 / 814, 10), q = Math.hypot(HC[0] - b[0], HC[1] - b[2]) || 1; return [b[0] + (HC[0] - b[0]) / q * 26, b[1], b[2] + (HC[1] - b[2]) / q * 26]; };
        const n = [-tx[2], 0, tx[0]], b4 = car(4), sgn = n[0] * (HC[0] - b4[0]) + n[2] * (HC[1] - b4[2]) > 0 ? 1 : -1; n[0] *= sgn; n[2] *= sgn; far.trainDir = tx;
        for (let i = 0; i < 9; i++) { const b = car(i); sb.add([b[0], b[1] + 3, b[2]], [tx[0] * 22, 0, tx[2] * 22], n, 20, OCHRE, { bone: 1, variant: i % 3, seed: 0.1 }); }
        { const b = car(-1.25); sb.add([b[0], b[1] + 2, b[2]], [tx[0] * 36, 0, tx[2] * 36], n, 24, BRICK, { bone: 1, seed: 0.1 }); sb.add([b[0] + tx[0] * 4, b[1] + 24, b[2] + tx[2] * 4], [tx[0] * 120, 34, tx[2] * 120], n, 21, CREAM, { bone: 1, variant: 7, dab: 1 }); }
      }
      // a second, brick vineyard to port of the flank run: stacked rows on the rising ground
      for (let k = 0; k < 6; k++) {
        const x = 110 + k * 7, z0 = 96 + k * 3, len = 76, bth = coat2(r, 0.2 + k * 0.01, 0.5, [0.03, 0.09]);
        for (let z = z0 + r() * 2; z < z0 + len; z += r.range(1.6, 2.4)) for (const wy of [2.6, 5]) {
          if (Math.hypot(x - 121, z - 140) < 11 || r() < 0.3) continue;
          cluster(sb, r, [x + r.range(-0.3, 0.3), z], wy + r.range(-0.3, 0.3), [0, 1], [-1, 0, 0], Math.max(2, Math.round(4 * dens * Math.min(1, detail + 0.15))), 1.15, bth);
        }
        for (let z = z0; z < z0 + len; z += 5.5) if (Math.hypot(x - 121, z - 140) > 9) vineStock(sb, r, x, z, [0, 1], [-1, 0, 0], 6.4, -1);
        await ctx.yield();
      }
      await ctx.yield();
      // near ground marks: grass fans and dropped leaf dabs within 45 m of the path, never on the laid cloth
      const nFan = Math.round(430 * dens * detail), tmp = new THREE.Vector3(), tt = new THREE.Vector3();
      for (let i = 0; i < nFan; i++) {
        const u = r() * r() < 0.0 ? 0 : r.range(0.0, 1), sd = r() < 0.5 ? -1 : 1, lat = 4.5 + 42 * r() * r(); path.pointAt(u, tmp); path.tangentAt(u, tt);
        const x = tmp.x + tt.z * sd * lat, z = tmp.z - tt.x * sd * lat, s = (x - 120) * Hd[0] + z * Hd[1];
        if ((x > CL.x0 - 2.5 && x < CL.x1 + 2.5 && z > CL.z0 - 2.5 && z < CL.z1 + 2.5) || Math.abs(s - 72) < 9 || (Math.abs(x - 30) < 7 && z > 76 && z < 146) || gh(x, z) > 3 || path.nearestXZ(x, z).dist < 4) continue;
        const b = coat2(r, uAt(x, z), 0.4, [0.03, 0.1]);
        if (r() < 0.93) P.fan(x, z, r.range(1.1, 2.3), { birth: () => b() });
        else for (let j = 0; j < 4; j++) { const a = r() * 6.28, l = r.range(0.6, 0.95); sb.add([x + r.range(-1.6, 1.6), gh(x, z) + 0.03, z + r.range(-1.6, 1.6)], [Math.cos(a) * l, 0, Math.sin(a) * l], [0, 1, 0], r.range(0.4, 0.55), season === 'snow' ? CREAM : leafPig(r), { birth: b(), dab: 1 }); }
        if (i % 40 === 39) await ctx.yield();
      }
      for (let i = 0; i < Math.round(190 * dens * detail); i++) {
        if (i % 40 === 39) await ctx.yield();
        const x = r.range(16, 62), z = r.range(118, 178); if ((x > CL.x0 - 2 && x < CL.x1 + 2 && z > CL.z0) || (Math.abs(x - 30) < 5.5 && z < 127) || Math.hypot(x - 11, z - 166) < 8 || Math.hypot(x - 8, z - 181) < 8 || path.nearestXZ(x, z).dist < 4) continue;
        if (r() < 0.93) P.fan(x, z, r.range(1.2, 2.4), { w: 0.24 });
        else for (let j = 0; j < 4; j++) { const a = r() * 6.28, l = r.range(0.7, 1.1); sb.add([x + r.range(-1.4, 1.4), 0.03, z + r.range(-1.4, 1.4)], [Math.cos(a) * l, 0, Math.sin(a) * l], [0, 1, 0], r.range(0.5, 0.7), season === 'snow' ? CREAM : leafPig(r), { dab: 1 }); }
      }
      // the meadow between the stream and the bear: fans tipped with flower dabs, so the near floor is never bare cracks
      for (let i = 0; i < Math.round(150 * dens * detail); i++) {
        if (i % 40 === 39) await ctx.yield();
        const u = r.range(0.07, 0.46), sd = r() < 0.5 ? -1 : 1, lat = 3.5 + 26 * r() * r(); path.pointAt(u, tmp); path.tangentAt(u, tt);
        const x = tmp.x + tt.z * sd * lat, z = tmp.z - tt.x * sd * lat, s2 = (x - 120) * Hd[0] + z * Hd[1];
        if (Math.abs(s2 - 72) < 9 || (Math.abs(x - 30) < 7.5 && z > 76 && z < 146) || path.nearestXZ(x, z).dist < 3.2 || (x < 15 && z > 66)) continue;
        const h = r.range(1.1, 2.1), fp = r() < 0.45 ? CREAM : r() < 0.55 ? BRICK : OCHRE; P.fan(x, z, h, { w: 0.24 });
        if (r() < 0.3) for (let j = 0; j < 3; j++) { const ox = r.range(-0.9, 0.9), oz = r.range(-0.9, 0.9); sb.add([x + ox - tt.z * 0.3, gh(x, z) + h * r.range(0.75, 1.1), z + oz + tt.x * 0.3], [tt.z * 0.6, 0.05, -tt.x * 0.6], [-tt.x, 0.25, -tt.z], 0.48, fp, { variant: 0, bone: 6, seed: 0.1, dab: 1 }); }
      }
      // first snow: cream dabs that fall (kind 4, by world time) and dabs that have stayed
      if (season === 'snow') {
        const nS = Math.round(600 * detail);
        for (let i = 0; i < nS; i++) {
          const u = r(), sd = r() < 0.5 ? -1 : 1, lat = 5 + 34 * r(); path.pointAt(u, tmp); path.tangentAt(u, tt);
          const x = tmp.x + tt.z * sd * lat, z = tmp.z - tt.x * sd * lat, a = r() * 6.28;
          sb.add([x, r() * 34, z], [Math.cos(a) * 0.4, 0.12, Math.sin(a) * 0.4], [Math.sin(a), 0, -Math.cos(a)], 0.4, CREAM, { level: 4, variant: 0 });
        }
      }
      P.finish(); await ctx.yield();
    }

    // ---- the arbour: trees, pergola arches and garlands along the laid cloth (a feast under vines) ----
    // a leaf mass: n presses of a loaded brush inside an ellipsoid; most face the oncoming eye (-Z), some stand crosswise
    // (+X) so the mass is a body from the side too. own = the mass's dominant pigment
    const leafMass = (sb, r, c, rx, ry, rz, n, big, own, bfn, crossShare = 0.35, ownShare = 0.7) => {
      for (let j = 0; j < n; j++) {
        let px, py, pz; do { px = r.range(-1, 1); py = r.range(-1, 1); pz = r.range(-1, 1); } while (px * px + py * py + pz * pz > 1);
        const cross = r() < crossShare, a = r.range(-2.5, -0.65), len = r.range(0.9, 1.4) * big, ca = Math.cos(a) * len, sa = Math.sin(a) * len;
        sb.add([c[0] + px * rx, c[1] + py * ry, c[2] + pz * rz], cross ? [0, sa, ca] : [ca, sa, 0], cross ? [1, 0, 0] : [0, 0, -1], r.range(0.45, 0.6) * big, r() < ownShare ? own : leafPig(r), { birth: bfn(), bone: 6, seed: r.range(0, 0.4), dab: 1 });
      }
    };
    const grapes = (sb, r, x, y, z, s, bfn) => { const b = bfn(); for (const [du, dv] of [[-0.3, 0], [0.3, 0], [0, -0.5], [-0.25, -0.55], [0.12, -1.05]]) sb.add([x + (du - 0.2) * s, y + dv * s, z], [0.42 * s, r.range(-0.1, 0.1), 0], [0, 0, -1], 0.38 * s, BLUE, { birth: b, variant: 0, dab: 1 }); };
    // a tree as he painted them: a trunk of two dry edge strokes with the cloth between, a crown of leaf presses
    const tree = (P, x, z, H, R, u0, o = {}) => {
      const r = P.rng, sb = P.sb, y0 = gh(x, z), bth = coat2(r, u0, 0.35), th = H * (o.trunk ?? 0.42), tw = Math.max(0.5, R * 0.11);
      const tp = season === 'snow' && r() < 0.5 ? CREAM : r() < 0.6 ? BRICK : OCHRE;
      for (let y = 0; y < th + R * 0.3; y += 4.2) for (const e of [-1, 1]) {
        const l = Math.min(4.6, th + R * 0.3 - y + 0.4), lx = r.range(-0.12, 0.12);
        sb.add([x + e * tw, y0 + y, z], [lx, l, 0], [0, 0, -1], tw * 0.9, tp, { birth: bth() });
        sb.add([x, y0 + y, z + e * tw], [0, l, lx], [1, 0, 0], tw * 0.9, tp, { birth: bth() });
      }
      const t0 = r(), own = season === 'spring' ? (t0 < 0.8 ? GREEN : CREAM) : t0 < 0.86 ? GREEN : OCHRE;
      const ry = (H - th) * 0.5, cy = y0 + th + ry, big = o.big ?? Math.max(1.5, R * 0.3), n = Math.round((o.n ?? 100) * Math.min(1, detail + 0.2));
      leafMass(sb, r, [x, cy, z], R, ry, R * 0.7, n, big, own, bth, 0.35, 0.9);
      for (let j = 0; j < 3; j++) leafMass(sb, r, [x + r.range(-0.75, 0.75) * R, cy + r.range(-0.2, 0.75) * ry, z + r.range(-0.3, 0.3) * R], R * 0.5, ry * 0.42, R * 0.4, Math.round(n * 0.18), big, own, bth, 0.35, 0.9);
      if (o.fruit !== false && season !== 'spring') for (let j = 0; j < 7; j++) { const a = r() * 6.28, q = Math.sqrt(r()) * 0.8, fx = x + Math.cos(a) * q * R, fy = cy + Math.sin(a) * q * ry; sb.add([fx - 0.5, fy, z - R * 0.75], [1, r.range(-0.1, 0.1), 0], [0, 0, -1], 1.0, own === BRICK ? OCHRE : BRICK, { variant: 0, birth: bth() }); }
      if (season === 'snow') for (let j = 0; j < 8; j++) { const q = r.range(-0.8, 0.8); sb.add([x + q * R, cy + ry * Math.sqrt(1 - q * q) * 0.9, z - 0.4], [r.range(1.6, 2.6), -0.2, 0], [0, 0, -1], 0.7, CREAM, {}); }
      for (let a = 0; a < 4; a++) { const an = a / 4 * 6.28 + r(); P.fan(x + Math.cos(an) * (tw + 1.2), z + Math.sin(an) * (tw + 1.2), 1.6); }
    };
    const treeSpots = [];
    {
      const P = makePainter('arbour'), r = P.rng, sb = P.sb;
      // two rows of trees flanking the cloth (the port row starts beyond the cubs), their crowns closing the sky at the sides
      for (let z = 84; z < 372; z += r.range(48, 62)) treeSpots.push([-r.range(24, 33), z, r.range(26, 37), r.range(7.5, 10.5)]);
      for (let z = 226; z < 372; z += r.range(48, 62)) treeSpots.push([r.range(24, 33), z, r.range(26, 37), r.range(7.5, 10.5)]);
      for (const [x, z, H, R] of treeSpots) { if (x < 0 && z > 296 && z < 344) continue; tree(P, x > 0 && z > 262 && z < 328 ? 60 : x, z, H, R, uZ(z)); await ctx.yield(); }
      // the grove behind the exit: tall crowns round the signboard and the animal, so the last climb rises into leaves
      for (const [x, z, H, R] of [[-46, 428, 58, 14], [74, 414, 50, 13], [-78, 396, 42, 12]]) { tree(P, x, z, H, R, 0.86, { n: 90, big: 3.6, trunk: 0.38 }); await ctx.yield(); }
      P.finish(); P.leanK = 0.2; await ctx.yield();
    }
    // -end the arbour
    // ---- the table: small feast things laid down the cloth between the big ones, and a wreath round the signboard ----
    {
      const tv = new THREE.Vector3(), P = makePainter('table'), r = P.rng, sb = P.sb, Y = [0, 1, 0], X = [1, 0, 0], Zv = [0, 0, 1];
      const busy = [...jars.map(([x, z, H, R]) => [x, z, R + 1.2]), [-12, 257, 6], [-5, 257, 7], [2, 257, 6], [-8.6, 329, 6.5], [-8.4, 319, 6], [9, 126, 9], [10, 118, 6], [10, 134, 6], [-9, 106, 6], [-9.5, 114, 8], [-9, 122, 6],
        [10, 290, 6], [10.5, 298, 8], [10, 306, 6], [-8.5, 164, 5], [8.2, 200, 5], [-9.6, 281, 5], [8.5, 328, 5]];
      const free = (x, z, rad) => !busy.some(([bx, bz, br]) => Math.hypot(x - bx, z - bz) < br + rad);
      const ring = (x, z, R, pig, w, bth, y = 0.1) => { const n = Math.max(8, Math.round(R * 6.5)); for (let i = 0; i < n; i++) { const a = i / n * 6.283, ca = Math.cos(a), sa = Math.sin(a), l = 6.283 * R / n * 1.12; sb.add([x + ca * R, y, z + sa * R], [-sa * l, 0, ca * l], Y, w, pig, { birth: bth() }); } };
      const disc = (x, z, R, pig, bth, y = 0.12) => { for (let o = -R + 0.3; o < R; o += 0.55) { const hw = Math.sqrt(Math.max(0.05, R * R - o * o)); sb.add([x - hw, y, z + o], [2 * hw, 0, r.range(-0.1, 0.1)], Y, 0.62, pig, { birth: bth(), seed: r.range(0, 0.3) }); } };
      // a small jug standing on the cloth: brick belly, ochre neck, a bare mouth, one handle stroke
      const jug = async (x, z, H, bth) => {
        const R = H * 0.33;
        await P.loftA([[0.01, 0.45], [0.14, 0.8], [0.36, 1], [0.56, 0.85], [0.72, 0.42], [0.86, 0.3], [0.96, 0.4], [1, 0.44]].map(([h, q]) => [x, h * H, z, q * R, q * R, 2]), X, Zv,
          { ns: 10, nq: 14, width: 0.4, len: [0.9, 1.7], gap: 0.05, s0: 0.01, s1: 0.99, birth: bth, pig: (Q, N, s) => (s > 0.95 ? -1 : s > 0.6 ? OCHRE : BRICK) });
        sb.add([x + R * 0.45, H * 0.9, z - 0.1], [R * 0.75, -H * 0.12, 0], [0, 0, -1], 0.3, OCHRE, { birth: bth() }); sb.add([x + R * 1.2, H * 0.78, z - 0.1], [-R * 0.25, -H * 0.3, 0], [0, 0, -1], 0.3, OCHRE, { birth: bth() });
      };
      let k = 0;
      for (let z = 76; z < 366; z += 9) for (const sd of [-1, 1]) {
        const x = sd * r.range(15.5, 18), zz = z + r.range(-1.5, 1.5), kind = Math.floor(r() * 7), u0 = uZ(zz), bth = coat2(r, zz < 150 ? 0.3 : u0, 0.35, [0.04, 0.09]);
        if (kind > 2 || zz <= 160 || !free(x, zz, 2.4) || (zz > 168 && Math.abs(x - path.pointAt(u0, tv).x) < 5.5)) continue;
        if (++k % 3 === 0) await ctx.yield();
        if (kind <= 2) { await jug(x, zz, r.range(3.2, 4.6), bth); P.fan(x + 1.2, zz - 0.8, 1.0); }
        else if (kind <= 2) {            // a plate: blue rim, the cloth between, and on it fruit, a round loaf or a small fish
          const R = r.range(1.7, 2.3); ring(x, zz, R, BLUE, 0.42, bth); const what = Math.floor(r() * 3);
          if (what === 0) for (let j = 0; j < 4; j++) { const a = j * 1.57 + r(), q = R * 0.42; sb.add([x + Math.cos(a) * q - 0.45, 0.55, zz + Math.sin(a) * q], [0.9, 0, 0], [0, 0.8, -0.6], 0.95, j % 2 ? BRICK : OCHRE, { variant: 0, birth: bth() }); }
          else if (what === 1) { disc(x, zz, R * 0.62, OCHRE, bth, 0.3); sb.add([x - R * 0.5, 0.36, zz], [R, 0, 0], Y, 0.2, BRICK, {}); }
          else { sb.add([x - R * 0.7, 0.3, zz - 0.25], [R * 1.3, 0, 0], Y, 0.6, BLUE, { birth: bth() }); sb.add([x - R * 0.7, 0.3, zz + 0.3], [R * 1.2, 0, 0], Y, 0.55, CREAM, { birth: bth() }); sb.add([x + R * 0.55, 0.3, zz], [0.7, 0, 0.5], Y, 0.3, BLUE, {}); sb.add([x + R * 0.55, 0.3, zz], [0.7, 0, -0.5], Y, 0.3, BLUE, {}); }
        } else if (kind === 3) {         // radishes: brick dabs with green tops
          for (let j = 0; j < 4; j++) { const ox = j * 0.8 - 1.2; sb.add([x + ox, 0.3, zz], [0.25, 0.35, 0.9], [0, 0.7, -0.7], 0.6, BRICK, { variant: 0, birth: bth() }); for (const e of [-0.3, 0, 0.3]) sb.add([x + ox + 0.25, 0.5, zz + 0.9], [e, 0.5, 1.2], [0, 0.7, -0.7], 0.2, GREEN, { birth: bth() }); }
        } else if (kind === 4) {         // a skewer: one ochre line, brick pieces across it
          const a = r.range(-0.5, 0.5), dx = Math.cos(a), dz = Math.sin(a); sb.add([x - dx * 2.6, 0.25, zz - dz * 2.6], [dx * 5.2, 0, dz * 5.2], Y, 0.16, OCHRE, {});
          for (let j = -2; j <= 2; j++) sb.add([x + dx * j * 0.8 + dz * 0.4, 0.32, zz + dz * j * 0.8 - dx * 0.4], [-dz * 0.8, 0, dx * 0.8], Y, 0.6, j % 2 ? OCHRE : BRICK, { variant: 0, birth: bth() });
        } else if (kind === 5) {         // herbs: a green fan lying on the cloth, and a bunch of grapes
          const a0 = r() * 6.28; for (let t = 0; t < 7; t++) { const a = a0 + (t - 3) * 0.2, l = r.range(1.5, 2.4); sb.add([x, 0.28, zz], [Math.cos(a) * l, 0.25, Math.sin(a) * l], Y, 0.24, GREEN, { birth: bth() }); }
          if (season !== 'spring') for (let j = 0; j < 7; j++) sb.add([x + 1.2 + (j % 3) * 0.5 - (j > 5 ? 0.3 : 0), 0.4, zz + 1 + Math.floor(j / 3) * 0.5], [0.4, 0, 0], [0, 0.8, -0.6], 0.45, BLUE, { variant: 0, birth: bth() });
        } else {                         // a round flat bread with a brick cross, standing herbs beside it
          disc(x, zz, r.range(1.3, 1.9), OCHRE, bth, 0.26); P.fan(x + sd * 2.2, zz, 1.1, { n: 5 });
        }
      }
      await ctx.yield();
      // the wreath: leaf presses and grapes round the blank signboard, as a tavern dresses its sign for the vintage
      const rt = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), ET).normalize(), upv = new THREE.Vector3().crossVectors(ET, rt).normalize(), nB = [-ET.x, -ET.y, -ET.z];
      const wb = coat2(r, 0.9, 0.4, [0.04, 0.1]);
      for (let a = -0.5; a < Math.PI + 0.5; a += 0.085) {
        const R = 11.4 + r.range(-0.5, 0.5), px = Math.cos(a) * R, py = Math.sin(a) * R - (a < 0 || a > Math.PI ? 0 : 0), own = leafPig(r);
        for (let j = 0; j < 4; j++) {
          const qx = px + r.range(-1, 1), qy = py + r.range(-1, 1), an = a + Math.PI / 2 + r.range(-0.9, 0.9), l = r.range(1.5, 2.2), dx = Math.cos(an) * l, dy = Math.sin(an) * l;
          if (Math.hypot(END.x + rt.x * qx + upv.x * qy - exitAnimal.head[0], END.y + rt.y * qx + upv.y * qy - exitAnimal.head[1]) < 11) continue;
          sb.add([END.x + rt.x * qx + upv.x * qy + ET.x * 0.5, END.y + rt.y * qx + upv.y * qy + ET.y * 0.5, END.z + rt.z * qx + upv.z * qy + ET.z * 0.5], [rt.x * dx + upv.x * dy, rt.y * dx + upv.y * dy, rt.z * dx + upv.z * dy], nB, r.range(0.8, 1.05), r() < 0.7 ? own : leafPig(r), { birth: wb(), seed: r.range(0, 0.4), dab: 1 });
        }
        if (season !== 'spring' && r() < 0.35 && false) { const R2 = R + 1.6, b = wb(); for (const [du, dv] of [[-0.5, 0], [0.5, 0], [0, -0.8], [-0.4, -0.85], [0.2, -1.6]]) { const qx = Math.cos(a) * R2 + du - 0.3, qy = Math.sin(a) * R2 + dv; sb.add([END.x + rt.x * qx + upv.x * qy + ET.x * 0.3, END.y + rt.y * qx + upv.y * qy + ET.y * 0.3, END.z + rt.z * qx + upv.z * qy + ET.z * 0.3], [rt.x * 0.65, rt.y * 0.65, rt.z * 0.65], nB, 0.6, BLUE, { variant: 0, birth: b }); } }
      }
      P.finish(); await ctx.yield();
    }
    // -end the table
    // ---- laid on the cloth, LARGE and flat as he drew a feast: a whole fish on a blue-rimmed plate, round breads, a
    // wineskin, drinking horns, radishes and greens. Each is strokes lying on a thin black ground of its own (a loft the
    // colour of the oilcloth), so its outline is a gap of bare black, never a drawn line.
    {
      const P = makePainter('laid'), r = P.rng, sb = P.sb, Y = [0, 1, 0];
      // a flat shape: lanes of strokes along the t axis (angle a in the ground plane) wherever wfn(t / half) = [lo, hi] holds the lane
      const flat = (cx, cz, a, half, wfn, pigfn, o = {}) => {
        const ca = Math.cos(a), sa = Math.sin(a), y = o.y ?? 0.3, lw = o.w ?? 0.6, omax = o.omax ?? 8;
        const lay = (ta, tb, ov) => {
          let q = ta - r() * 0.5;
          while (q < tb - 0.3) {
            const l0 = r.range(2.2, 4.6) * (o.ls ?? 1), q0 = Math.max(ta, q), q1 = Math.min(tb, q + l0); q += l0 * r.range(0.72, 0.9);
            if (q1 - q0 < 0.35) continue;
            const pig = pigfn((q0 + q1) / 2 / half, ov); if (pig < 0) continue;
            const b0 = o.back ? q1 : q0, d = o.back ? q0 - q1 : q1 - q0;
            sb.add([cx + ca * b0 - sa * ov, y, cz + sa * b0 + ca * ov], [ca * d, 0, sa * d], Y, lw * r.range(0.98, 1.12), pig, { birth: o.birth ? o.birth() : -1, seed: r.range(0, 0.3) });
          }
        };
        for (let ov = -omax + lw * 0.45; ov < omax; ov += lw * 0.86) {
          let run = null;
          for (let t = -half; t <= half + 0.3; t += 0.25) {
            const w = t <= half ? wfn(t / half) : null, inn = !!w && ov >= w[0] && ov <= w[1];
            if (inn && run === null) run = t;
            if (!inn && run !== null) { lay(run, t - 0.25, ov); run = null; }
          }
        }
      };
      // its black ground: the same outline grown by g, a few centimetres thick
      const under = (cx, cz, a, half, wfn, g = 0.18, y = 0.2) => {
        const ca = Math.cos(a), sa = Math.sin(a), st = [], N = 16;
        for (let i = 0; i <= N; i++) {
          const tn = -1 + 2 * i / N, w = wfn(Math.max(-0.999, Math.min(0.999, tn))) || [0, 0], t = tn * (half + g), mid = (w[0] + w[1]) / 2, hw = Math.max(0.05, (w[1] - w[0]) / 2 + g * (i === 0 || i === N ? 0.3 : 1));
          st.push([cx + ca * t - sa * mid, y, cz + sa * t + ca * mid, hw, 0.1, 2]);
        }
        P.loft(st, [-sa, 0, ca], Y, { paint: false, ns: N, nq: 10 });
      };
      const ell = (R2) => (tn) => { const h = R2 * Math.sqrt(Math.max(0, 1 - tn * tn)); return [-h, h]; };
      // the fish on its plate: cold-blue back, cream belly, the round eye on us; the plate's well is bare cloth, its rim blue
      {
        const cx = -1, cz = 257, ex = 12.4, ez = 7.6, half = 10.6, bth = coat2(r, uZ(cz - 8), 0.35);
        under(cx, cz, 0, ex - 0.9, ell(ez - 0.9), 0, 0.2);
        for (let a = 0; a < 6.283; a += 0.05) {
          const ca = Math.cos(a), sa = Math.sin(a), dl = Math.hypot(sa * ex, ca * ez) || 1;
          sb.add([cx + ca * ex, 0.3, cz + sa * ez], [-sa * ex / dl * 0.95, 0, ca * ez / dl * 0.95], Y, 0.75, BLUE, { birth: bth(), seed: r.range(0, 0.25) });
          if (Math.round(a / 0.05) % 2 === 0) sb.add([cx + ca * (ex - 0.75), 0.3, cz + sa * (ez - 0.75)], [-ca * 1.25, 0, -sa * 1.25], Y, 0.7, CREAM, { birth: bth(), seed: r.range(0, 0.25) });
        }
        const fw = (tn) => { const s = (tn + 1) / 2; if (s < 0.13) { const h = 4 - 3.1 * s / 0.13; return [-h, h]; } const q = (s - 0.13) / 0.87, h = 0.7 + 4 * Math.pow(Math.sin(Math.PI * Math.pow(q, 0.72)), 0.7); return [-h, h]; };
        flat(cx, cz, 0, half, fw, (tn, ov) => { const s = (tn + 1) / 2; return s < 0.14 ? BLUE : s > 0.83 ? CREAM : ov > 0.9 + 0.5 * Math.sin(tn * 8) ? BLUE : ov < -3 ? OCHRE : CREAM; }, { y: 0.45, birth: bth, omax: 5 });
        P.eye([cx + half * 0.8, 0.7, cz + 0.9], [0, 0.8, -0.6], 0.72, 0, 0);
        for (const ov of [-1.4, 0, 1.4]) sb.add([cx + half * 0.66, 0.52, cz + ov - 0.6], [0.25, 0, 1.3], Y, 0.3, BRICK, { seed: 0.1 });            // the gill
        for (let i = 0; i < 6; i++) sb.add([cx - 3 + i * 1.3, 0.5, cz + 4.3], [-0.9, 0, 1.6], Y, 0.5, BLUE, { seed: 0.2, birth: bth() });          // back fin
        for (const tx of [-3.5, 3]) for (let i = 0; i < 3; i++) sb.add([cx + tx + i * 0.8, 0.5, cz - 4.0], [-0.8, 0, -1.5], Y, 0.5, OCHRE, { seed: 0.2, birth: bth() });   // belly fins
        await ctx.yield();
      }
      const bread = (cx, cz, R2) => {
        const a = r() * 3.14, bth = coat2(r, uZ(cz), 0.35); under(cx, cz, a, R2, ell(R2));
        flat(cx, cz, a, R2, ell(R2), () => OCHRE, { birth: bth, omax: R2 });
        for (let i = -2; i <= 2; i++) { const an = a + 1.2 + i * 0.28, q = R2 * 0.62; sb.add([cx + Math.cos(an) * q, 0.42, cz + Math.sin(an) * q], [-Math.sin(an) * 1.1, 0, Math.cos(an) * 1.1], Y, 0.5, BRICK, { seed: 0.15 }); }
      };
      const wineskin = (cx, cz, a) => {
        const half = 7.6, bth = coat2(r, uZ(cz), 0.35), ca = Math.cos(a), sa = Math.sin(a);
        const wf = (tn) => { const e = (tn + 0.14) / 0.86, h = Math.abs(e) < 1 ? 4.3 * Math.pow(1 - Math.pow(Math.abs(e), 2.6), 0.45) : 0; const hh = tn > 0.6 ? Math.max(h, 1.0) : h; return hh > 0.05 ? [-hh, hh] : null; };
        under(cx, cz, a, half, wf);
        flat(cx, cz, a, half, wf, (tn) => (tn > 0.9 ? OCHRE : tn > 0.74 && tn < 0.8 ? OCHRE : BRICK), { birth: bth, omax: 4.6 });
        for (const [t, sd] of [[-5.6, 1], [-5.6, -1], [2.8, 1], [2.8, -1]]) {       // the tied-off legs: a brick stub, an ochre knot
          const ov = sd * 3.3; sb.add([cx + ca * t - sa * ov, 0.3, cz + sa * t + ca * ov], [-sa * sd * 1.9 + ca * (t < 0 ? -0.9 : 0.9), 0, ca * sd * 1.9 + sa * (t < 0 ? -0.9 : 0.9)], Y, 0.8, BRICK, { seed: 0.1 });
          const o2 = sd * 5.0, t2 = t + (t < 0 ? -0.8 : 0.8); sb.add([cx + ca * t2 - sa * o2 - ca * 0.45, 0.36, cz + sa * t2 + ca * o2 - sa * 0.45], [ca * 0.9, 0, sa * 0.9], Y, 0.5, OCHRE, { seed: 0.1 });
        }
      };
      // a drinking horn drawn flat: an ochre crescent widening to a bare mouth, a cream ring before it, a brick tip
      const horn = (cx, cz, a, len, bend) => {
        const ca = Math.cos(a), sa = Math.sin(a), N = 9, bth = coat2(r, uZ(cz), 0.35), st = [];
        const pt = (t) => { const s = (t - 0.5) * len, ov = bend * 4 * t * (1 - t) * len * 0.2; return [cx + ca * s - sa * ov, cz + sa * s + ca * ov]; };
        for (let i = 0; i <= N + 1; i++) { const t = Math.min(1.07, i / N), p = pt(t); st.push([p[0], 0.2, p[1], (0.35 + 1.35 * Math.min(1, t)) * (i === 0 ? 0.4 : 1) + 0.4, 0.1, 2]); }
        const d0 = pt(0), d1 = pt(1); let nx = -(d1[1] - d0[1]), nz = d1[0] - d0[0]; const nl = Math.hypot(nx, nz) || 1; P.loft(st, [nx / nl, 0, nz / nl], Y, { paint: false, ns: N + 1, nq: 10 });
        for (let i = 0; i < N; i++) {
          const t0 = i / N, t1 = Math.min(0.955, (i + 1.25) / N), p0 = pt(t0), p1 = pt(t1), tm = (t0 + t1) / 2, w = 0.7 + 2.7 * tm;
          for (const e of [-0.25, 0.25]) sb.add([p0[0] + (p1[1] - p0[1]) * e * 0.1 * w, 0.32 + i * 0.004, p0[1] - (p1[0] - p0[0]) * e * 0.1 * w], [p1[0] - p0[0], 0, p1[1] - p0[1]], Y, w * 0.56, i === 0 ? BRICK : i === N - 2 ? CREAM : OCHRE, { birth: bth(), seed: r.range(0, 0.25) });
        }
      };
      const radishes = (cx, cz, a) => {
        const bth = coat2(r, uZ(cz), 0.35);
        for (let j = 0; j < 5; j++) {
          const an = a + (j - 2) * 0.33, ca = Math.cos(an), sa = Math.sin(an), bx = cx + ca * 2.2, bz = cz + sa * 2.2;
          sb.add([bx, 0.3, bz], [ca * 2.1, 0, sa * 2.1], Y, 1.5, BRICK, { variant: 0, seed: 0.05, birth: bth() });
          sb.add([bx + ca * 1.9, 0.3, bz + sa * 1.9], [ca * 1.3, 0, sa * 1.3], Y, 0.3, CREAM, { seed: 0.1 });
          for (const e of [-0.35, 0, 0.35]) sb.add([bx + ca * 0.2, 0.34, bz + sa * 0.2], [-Math.cos(an + e) * 3.2, 0, -Math.sin(an + e) * 3.2], Y, 0.5, GREEN, { seed: r.range(0, 0.3), birth: bth() });
        }
      };
      const greens = (cx, cz, a) => {
        const bth = coat2(r, uZ(cz), 0.35);
        for (let t = 0; t < 9; t++) { const an = a + (t - 4) * 0.13 + r.range(-0.03, 0.03), l = r.range(4.6, 6.4); sb.add([cx, 0.3, cz], [Math.cos(an) * l, 0, Math.sin(an) * l], Y, 0.55, GREEN, { seed: r.range(0, 0.35), birth: bth() }); }
        sb.add([cx + Math.cos(a) * 0.9 + Math.sin(a) * 0.8, 0.36, cz + Math.sin(a) * 0.9 - Math.cos(a) * 0.8], [-Math.sin(a) * 1.6, 0, Math.cos(a) * 1.6], Y, 0.5, BRICK, { seed: 0.1 });
      };
      // a blue-rimmed plate of fruit: brick rounds with an ochre dab and a green leaf, the well left bare
      const fruit = (cx, cz, R2) => {
        const bth = coat2(r, uZ(cz), 0.35); under(cx, cz, 0, R2 - 0.5, ell(R2 - 0.5), 0, 0.2);
        const n = Math.round(R2 * 7); for (let i = 0; i < n; i++) { const a = i / n * 6.283, ca = Math.cos(a), sa = Math.sin(a), l = 6.283 * R2 / n * 1.15; sb.add([cx + ca * R2, 0.3, cz + sa * R2], [-sa * l, 0, ca * l], Y, 0.7, BLUE, { birth: bth(), seed: r.range(0, 0.25) }); }
        for (let j = 0; j < 3; j++) {
          const a = j * 2.094 + 0.5, fx = cx + Math.cos(a) * R2 * 0.42, fz = cz + Math.sin(a) * R2 * 0.42, fr = R2 * 0.3, fa = r() * 3;
          flat(fx, fz, fa, fr, ell(fr), () => BRICK, { y: 0.42, birth: bth, omax: fr, ls: 0.6 });
          sb.add([fx - 0.35, 0.56, fz + fr * 0.2], [0.7, 0, 0.1], Y, 0.5, OCHRE, { variant: 0, seed: 0.05 });
          sb.add([fx + Math.cos(a) * fr * 0.9, 0.5, fz + Math.sin(a) * fr * 0.9], [Math.cos(a + 0.6) * 1.5, 0, Math.sin(a + 0.6) * 1.5], Y, 0.6, GREEN, { variant: 0, seed: 0.1 });
        }
      };
      // where the eye comes onto the cloth
      radishes(6.6, 196.5, 1.9); bread(-6.3, 198, 3.0); await ctx.yield();
      bread(-7, 236, 2.7); greens(4.5, 233, 0.5); await ctx.yield();
      // bread and wine
      bread(-6.4, 270.5, 3.3); greens(6.5, 266, 2.2); fruit(5.4, 279.5, 4.4); await ctx.yield();
      wineskin(-4.4, 286.5, Math.PI / 2 + 0.2); await ctx.yield();
      horn(4.4, 291.5, 0.45, 13, 1); horn(2.5, 300.5, -0.3, 12, -1); await ctx.yield();
      // toward the melon and the end of the cloth
      radishes(5.8, 311, 2.3); bread(6.2, 327, 3.0); horn(-4.6, 331, 1.25, 10, 1); greens(-6, 344, 0.9); bread(4.5, 346, 2.6); await ctx.yield();
      // the first reach of the cloth, seen across from her flank
      bread(4, 124, 3.2); bread(-3.5, 142, 3); radishes(3.5, 160, 2); horn(-2.5, 172, 1.3, 10, -1); await ctx.yield();
      // ---- the rest of the supra, laid in a row down the cloth and over its edges: a roast on a dish, cut melon, skewers,
      // bunches of grapes, bottles standing (after everything above, so nothing earlier is redrawn)
      const rimRing = (cx, cz, R2, pig, bth, w = 0.7) => { const n = Math.round(R2 * 7); for (let i = 0; i < n; i++) { const a = i / n * 6.283, ca = Math.cos(a), sa = Math.sin(a), l = 6.283 * R2 / n * 1.15; sb.add([cx + ca * R2, 0.3, cz + sa * R2], [-sa * l, 0, ca * l], Y, w, pig, { birth: bth(), seed: r.range(0, 0.25) }); } };
      const roast = (cx, cz, R2, a) => {
        const bth = coat2(r, uZ(cz), 0.35), ca = Math.cos(a), sa = Math.sin(a); under(cx, cz, 0, R2 - 0.5, ell(R2 - 0.5), 0, 0.2);
        rimRing(cx, cz, R2, OCHRE, bth); rimRing(cx, cz, R2 - 0.8, CREAM, bth, 0.35);
        const wf = (tn) => { const h = R2 * 0.36 * Math.pow(Math.max(0, 1 - tn * tn), 0.4) * (1 - 0.3 * tn); return h > 0.05 ? [-h, h] : null; };
        flat(cx, cz, a, R2 * 0.6, wf, (tn, ov) => (ov > R2 * 0.2 ? OCHRE : BRICK), { y: 0.44, birth: bth, omax: R2 * 0.4, ls: 0.7 });
        for (const e of [-1, 1]) { const q = R2 * 0.6 + 0.2; sb.add([cx + ca * q * e, 0.5, cz + sa * q * e], [ca * 1.5 * e, 0, sa * 1.5 * e], Y, 0.5, CREAM, { seed: 0.1 }); }     // the bone ends
        for (let t = 0; t < 5; t++) { const an = a + 1.57 + (t - 2) * 0.3, q = R2 * 0.42; sb.add([cx + Math.cos(an) * q, 0.46, cz + Math.sin(an) * q], [Math.cos(an) * 1.6, 0, Math.sin(an) * 1.6], Y, 0.5, GREEN, { seed: r.range(0, 0.3) }); }
      };
      // a cut slice of melon lying flat: brick flesh, a green rind along its round edge, seeds left as gaps
      const slice = (cx, cz, R2, a) => {
        const bth = coat2(r, uZ(cz), 0.35), wf = (tn) => { const h = R2 * 0.92 * Math.sqrt(Math.max(0, 1 - tn * tn)); return h > 0.3 ? [0, h] : null; };
        under(cx, cz, a, R2, (tn) => { const h = R2 * 0.92 * Math.sqrt(Math.max(0, 1 - tn * tn)); return [0, h]; }, 0.2);
        flat(cx, cz, a, R2, wf, (tn, ov) => (ov > R2 * 0.92 * Math.sqrt(Math.max(0, 1 - tn * tn)) - 1.0 ? GREEN : r() < 0.1 ? -1 : BRICK), { y: 0.32, birth: bth, omax: R2, ls: 0.45 });
      };
      const skewer = (cx, cz, a, len) => {
        const ca = Math.cos(a), sa = Math.sin(a), bth = coat2(r, uZ(cz), 0.35);
        sb.add([cx - ca * len / 2, 0.3, cz - sa * len / 2], [ca * len, 0, sa * len], Y, 0.22, OCHRE, { seed: 0.05 });
        for (let q = -len / 2 + 1.2, j = 0; q < len / 2 - 2.2; q += 1.45, j++) sb.add([cx + ca * q, 0.36, cz + sa * q], [ca * 1.25, 0, sa * 1.25], Y, 1.25, j % 3 === 2 ? OCHRE : BRICK, { variant: 0, seed: 0.06, birth: bth() });
      };
      const bunch = (cx, cz, a, s) => {
        const ca = Math.cos(a), sa = Math.sin(a), bth = coat2(r, uZ(cz), 0.35);
        for (let row = 0, k = 4; k > 0; row++, k--) for (let j = 0; j < k; j++) { const q = row * 0.8 * s, ov = (j - (k - 1) / 2) * 0.86 * s; sb.add([cx + ca * q - sa * ov - ca * 0.4 * s, 0.34, cz + sa * q + ca * ov - sa * 0.4 * s], [ca * 0.8 * s, 0, sa * 0.8 * s], Y, 0.8 * s, BLUE, { variant: 0, seed: 0.05, birth: bth() }); }
        sb.add([cx - ca * 0.5 * s, 0.32, cz - sa * 0.5 * s], [-ca * 1.5 * s, 0, -sa * 1.5 * s], Y, 0.25 * s, OCHRE, { seed: 0.1 });
        sb.add([cx - ca * 1.0 * s, 0.33, cz - sa * 1.0 * s], [-sa * 1.9 * s - ca * 0.6 * s, 0, ca * 1.9 * s - sa * 0.6 * s], Y, 1.1 * s, GREEN, { variant: 0, seed: 0.1, birth: bth() });
      };
      const bottle = async (x, z, H) => {
        const R = H * 0.15, bth = coat2(r, uZ(z), 0.35);
        await P.loftA([[0.004, 0.8], [0.05, 1], [0.52, 1], [0.66, 0.62], [0.76, 0.36], [0.97, 0.32], [1, 0.36]].map(([h, q]) => [x, h * H, z, q * R, q * R, 2]), [1, 0, 0], [0, 0, 1],
          { ns: 12, nq: 12, width: 0.45, len: [1.2, 2.4], gap: 0.06, s0: 0.01, s1: 0.99, birth: bth, pig: (Q, N, s) => (s > 0.93 ? OCHRE : s > 0.24 && s < 0.4 ? CREAM : GREEN) });
        P.fan(x + R + 0.5, z - 0.6, 0.9, { n: 5 });
      };
      skewer(7.2, 240.5, 0.35, 10); skewer(6.4, 243.5, 0.3, 10); await ctx.yield();
      await bottle(12.9, 287.5, 6.6); await bottle(13.3, 292, 5.6); await ctx.yield();
      roast(-8.8, 302, 4.9, 0.3); bunch(9.6, 300.5, 1.2, 1.5); await ctx.yield();
      slice(-9.6, 318, 3.3, -0.9); slice(3.5, 310.5, 4.2, 0.6); bunch(2.6, 320, 2.4, 1.3); await ctx.yield();
      skewer(-5.5, 339, -0.4, 9); skewer(-4.4, 341.6, -0.45, 9); bunch(9.4, 337, 0.6, 1.4); await bottle(-10.6, 357, 6.2); slice(6.5, 357.5, 3.6, 2.2); await ctx.yield();
      roast(7.6, 213.5, 3.6, 1.1); bunch(-4.2, 229.5, 2, 1.3); await ctx.yield();
      // the turn onto the cloth (u 0.5 to 0.54) looks down its length: a horn, a cut slice and a bread laid large at the foot
      horn(-2.6, 206.5, 0.35, 11, 1); slice(-6.2, 216, 3.6, 0.3); bread(0.8, 215.5, 2.6); await ctx.yield();
      P.finish(); await ctx.yield();
    }
    // -end laid
    // ---- the valley: far trees, haystacks, houses and vine rows stacked up the rising bowl; snow peaks; a skein of birds ----
    {
      const P = makePainter('valley'), r = P.rng, sb = P.sb;
      const nEl = Math.round(130 * dens * Math.min(1, detail + 0.2));
      for (let i = 0; i < nEl; i++) {
        if (i % 15 === 14) await ctx.yield();
        const a = r() * 6.283, rad = 95 + 330 * Math.pow(r(), 0.8), x = 25 + Math.cos(a) * rad * 0.9, z = 205 + Math.sin(a) * rad * 1.25, sd0 = segD(x, z);
        if (sd0 < 62 || path.nearestXZ(x, z).dist < 45 || (x > 40 && x < 125 && z > 95 && z < 200) || (z < 80 && x > 60 && x < 190 && Math.abs((x - 120) * Hd[0] + z * Hd[1]) < 90 && Math.abs((x - 120) * Ld[0] + z * Ld[1]) < 60)) continue;
        if (treeSpots.some(([tx, tz]) => Math.hypot(x - tx, z - tz) < 16) || (z > 385 && Math.abs(x) < 95 && z < 460)) continue;
        const y0 = gh(x, z); let nx = 20 - x, nz = 210 - z; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl; const n = [nx, 0, nz], tx = -nz, tz = nx;   // faces the course
        const S = 0.8 + sd0 * 0.0035, kind = r(), bth = coat2(r, Math.min(0.9, uAt(x, z) + 0.05), 0.3, [0.05, 0.14]);
        if (kind < 0.5) {            // a tree: one trunk stroke, a crown of big presses
          const H = r.range(15, 24) * S, R = H * 0.3, t1 = r(), own = season === 'spring' ? (t1 < 0.7 ? GREEN : CREAM) : t1 < 0.55 ? GREEN : t1 < 0.82 ? OCHRE : BRICK;
          sb.add([x, y0, z], [0, H * 0.5, 0], n, R * 0.24, season === 'snow' ? CREAM : BRICK, { birth: bth() });
          for (let j = 0; j < 9; j++) { const q = r.range(-1, 1), py = r.range(0.42, 1) * H, w = R * Math.sqrt(Math.max(0.1, 1 - Math.pow((py / H - 0.7) / 0.34, 2))), an = r.range(-2.4, -0.75), l = R * r.range(0.8, 1.2);
            sb.add([x + tx * q * w, y0 + py, z + tz * q * w], [tx * Math.cos(an) * l, Math.sin(an) * l, tz * Math.cos(an) * l], n, R * r.range(0.5, 0.7), r() < 0.75 ? own : leafPig(r), { birth: bth(), seed: r.range(0, 0.4), bone: 6 }); }
        } else if (kind < 0.68) {    // a haystack: ochre strokes combed down from the top
          const H = r.range(9, 14) * S, R = H * 0.42;
          for (let j = 0; j < 7; j++) { const q = (j - 3) / 3.4, top = [x + tx * q * R * 0.25, y0 + H * (1 - 0.12 * q * q), z + tz * q * R * 0.25]; sb.add(top, [tx * q * R * 0.75, -(top[1] - y0), tz * q * R * 0.75], n, R * 0.36, OCHRE, { birth: bth(), seed: r.range(0.1, 0.6) }); }
        } else if (kind < 0.82) {    // a house: cream wall strokes with the door left bare, a brick roof
          const W = r.range(7, 10) * S, H = W * 0.62;
          for (let j = 0; j < 4; j++) { if (j === 1 + Math.floor(r() * 2) && r() < 0.8) { sb.add([x + tx * (j - 1.5) * W * 0.25, y0 + H, z + tz * (j - 1.5) * W * 0.25], [0, -H * 0.4, 0], n, W * 0.23, CREAM, {}); continue; } sb.add([x + tx * (j - 1.5) * W * 0.25, y0 + H, z + tz * (j - 1.5) * W * 0.25], [0, -H, 0], n, W * 0.23, CREAM, { birth: bth(), seed: r.range(0, 0.4) }); }
          for (const e of [-1, 1]) sb.add([x, y0 + H * 1.62, z], [tx * e * W * 0.66, -H * 0.56, tz * e * W * 0.66], n, H * 0.4, BRICK, { birth: bth(), seed: r.range(0, 0.3) });
        } else {                     // a vine row: leaf presses in a line along the slope
          const L = r.range(26, 44) * S, own = leafPig(r);
          for (let q = -L / 2; q < L / 2; q += 2.6 * S) sb.add([x + tx * q, y0 + r.range(3.2, 5) * S, z + tz * q], [tx * r.range(-1, 1) * S, -r.range(2, 3.2) * S, tz * r.range(-1, 1) * S], n, 2.3 * S, r() < 0.75 ? own : leafPig(r), { birth: bth(), seed: r.range(0, 0.4) });
        }
      }
      await ctx.yield();
P.finish(); P.leanK = 0.25; await ctx.yield();
      
    }
    // -end the valley
    // ---- the earth: a dry ochre road to the bear and the cloth, a strip of turf under each animal (the ground line it
    // stands on), and two far rows of land under the blue edge. All dragged dry: the cloth shows through as half-tone.
    {
      const P = makePainter('earth'), r = P.rng, sb = P.sb, Y = [0, 1, 0];
      const onCloth = (x, z) => x > CL.x0 - 1.6 && x < CL.x1 + 1.6 && z > CL.z0 - 1.6 && z < CL.z1 + 1.6;
      const inStream = (x, z) => { const s2 = (x - 120) * Hd[0] + z * Hd[1], o2 = (x - 120) * Ld[0] + z * Ld[1]; return Math.abs(s2 - 72 - 5 * Math.sin(o2 * 0.045) - 3 * Math.sin(o2 * 0.11 + 1)) < 4.4; };
      const road = [[118, 14], [104, 34], [90, 51], [75, 66], [62, 83], [57, 103], [56, 124], [52, 142], [42, 156], [28, 165], [16, 169]];
      for (let i = 0; i < road.length - 1; i++) {
        const [ax, az] = road[i], [bx, bz] = road[i + 1], L = Math.hypot(bx - ax, bz - az), tx = (bx - ax) / L, tz = (bz - az) / L;
        for (let lane = -4; lane <= 4; lane++) for (let d = -r() * 3; d < L;) {
          const len = r.range(2.6, 5.2), x = ax + tx * d - tz * lane * 0.74, z = az + tz * d + tx * lane * 0.74; d += len * r.range(0.8, 1.25);
          if (r() < 0.2 + 0.07 * Math.abs(lane) || onCloth(x, z) || inStream(x, z) || inStream(x + tx * len, z + tz * len)) continue;
          sb.add([x, gh(x, z) + 0.04, z], [tx * len + r.range(-0.15, 0.15), 0, tz * len + r.range(-0.15, 0.15)], Y, r.range(0.55, 0.7), r() < 0.1 ? CREAM : OCHRE, { birth: -1, seed: r.range(0.45, 0.95) });
        }
        await ctx.yield();
      }
      // turf: long green drags inside an ellipse [cx, cz, rx, rz, along-x?]
      for (const [cx, cz, rx, rz, alongX] of [[30, 111, 17, 44, 0], [12, 174, 8, 18, 0], [96, 171, 26, 12, 1], [36, 394, 22, 8, 1], [-19, 321, 12, 10, 1], [-5, 400, 17, 9, 1], [121, 140, 12, 7, 1]]) {
        const ra = alongX ? rz : rx, rb = alongX ? rx : rz;
        for (let a = -ra + 0.6; a < ra; a += 1.25) for (let b = -rb - r() * 4; b < rb;) {
          const len = r.range(4, 8.5), x = alongX ? cx + b : cx + a, z = alongX ? cz + a : cz + b, e = (a / ra) * (a / ra) + ((b + len / 2) / rb) * ((b + len / 2) / rb); b += len * r.range(0.85, 1.3);
          if (e > 1 || r() < 0.22 || onCloth(x, z) || onCloth(x + (alongX ? len : 0), z + (alongX ? 0 : len))) continue;
          sb.add([x, gh(x, z) + 0.05, z], alongX ? [len, 0, r.range(-0.2, 0.2)] : [r.range(-0.2, 0.2), 0, len], Y, r.range(0.6, 0.78), r() < 0.12 ? OCHRE : GREEN, { birth: -1, seed: r.range(0.4, 0.9) });
        }
        await ctx.yield();
      }
      // far land: a green row and an ochre-and-green row standing under the blue edge, a few strokes each
      for (const [lift, w, share] of [[-38, 21, 0.8], [-61, 23, 0.62]]) for (let a = r() * 0.05; a < 6.283;) {
        const da = r.range(0.055, 0.09), p0 = ring(a, lift + r.range(-4, 4)), p1 = ring(a + da, lift + r.range(-4, 4)), n = [HC[0] - p0[0], 0, HC[1] - p0[2]], nl = Math.hypot(n[0], n[2]) || 1; n[0] /= nl; n[2] /= nl; a += da;
        if (r() > share) continue;
        sb.add(p0, [(p1[0] - p0[0]) * 1.1, (p1[1] - p0[1]) * 1.1, (p1[2] - p0[2]) * 1.1], n, w * r.range(0.8, 1.15), lift < -50 && r() < 0.4 ? OCHRE : GREEN, { birth: -1, variant: Math.floor(r() * 8), seed: r.range(0.3, 0.8) });
      }
      P.finish(); await ctx.yield();
    }
    // ---- the border of the laid cloth: what stands beside the feast, in rows on its own ground line, so the cloth never
    // lies in bare night: turf drags, wine jars standing whole, houses, haystacks, small fruit trees, a vine row ----
    {
      const P = makePainter('border'), r = P.rng, sb = P.sb, Y = [0, 1, 0], X = [1, 0, 0], Zv = [0, 0, 1]; P.lad = MIDLAD; let nJar = 0;
      const face = (x) => { const sx = x > 0 ? 1 : -1; return { n: [-sx * 0.5, 0, -0.866], t: [0.866, 0, -sx * 0.5] }; };
      // turf: long dry green drags along the cloth inside an ellipse; ochre now and then
      const turf = (cx, cz, rx, rz, pig = GREEN) => {
        for (let a = -rx + 0.5; a < rx; a += 1.2) for (let b = -rz - r() * 4; b < rz;) {
          const len = r.range(4, 8.5), x = cx + a, z = cz + b, e = (a / rx) * (a / rx) + ((b + len / 2) / rz) * ((b + len / 2) / rz); b += len * r.range(0.85, 1.3);
          if (e > 1 || r() < 0.2 || (Math.abs(x) < 14.6)) continue;
          sb.add([x, gh(x, z) + 0.05, z], [r.range(-0.2, 0.2), 0, len], Y, r.range(0.6, 0.78), r() < 0.14 ? OCHRE : pig, { birth: -1, seed: r.range(0.35, 0.85) });
        }
      };
      // a house as he painted them: cream wall strokes with the door and two windows left bare, a hipped brick roof, an ochre
      // balcony rail; a flat relief turned toward the eye coming down the cloth
      const house = (x, z, W) => {
        const { n, t } = face(x), y0 = gh(x, z), H = W * 0.6, rh = W * 0.34, bth = coat2(r, uZ(z) - 0.04, 0.35), cols = Math.round(W / 0.78), dc = Math.floor(cols * (0.3 + 0.4 * r()));
        P.loft([[x + n[0] * -0.3, y0, z + n[2] * -0.3, W / 2 + 0.3, 0.25, 4], [x - n[0] * 0.3, y0 + H, z - n[2] * 0.3, W / 2 + 0.5, 0.25, 4], [x - n[0] * 0.3, y0 + H + rh, z - n[2] * 0.3, W * 0.2, 0.25, 4]], t, n, { paint: false, ns: 4, nq: 12 });
        for (let c = 0; c < cols; c++) {
          const q = (c + 0.5) / cols - 0.5, px = x + t[0] * q * W, pz = z + t[2] * q * W, door = c === dc || c === dc + 1, win = !door && (c % 4 === 1) && c > 0 && c < cols - 1;
          if (door) { sb.add([px, y0 + H, pz], [0, -H * 0.36, 0], n, 0.8, CREAM, { seed: 0.2 }); continue; }
          if (win) { sb.add([px, y0 + H, pz], [0, -H * 0.22, 0], n, 0.8, CREAM, { seed: 0.2 }); sb.add([px, y0 + H * 0.5, pz], [0, -H * 0.5, 0], n, 0.8, CREAM, { birth: bth(), seed: r.range(0.1, 0.5) }); continue; }
          sb.add([px, y0 + H, pz], [r.range(-0.05, 0.05), -H, 0], n, 0.82, CREAM, { birth: bth(), seed: r.range(0.05, 0.5) });
        }
        for (let k = 0, rows = Math.max(3, Math.round(rh / 0.75)); k < rows; k++) {
          const hw = (W / 2 + 0.6) * (1 - 0.72 * k / rows), y = y0 + H + 0.35 + k * rh / rows;
          for (let q = -hw; q < hw - 0.3;) { const l = Math.min(hw - q, r.range(2.4, 4.4)); sb.add([x + t[0] * q + n[0] * 0.1, y, z + t[2] * q + n[2] * 0.1], [t[0] * l, 0, t[2] * l], n, 0.8, BRICK, { birth: bth(), seed: r.range(0.05, 0.45) }); q += l * 0.92; }
        }
        for (let q = -W / 2; q < W / 2 - 0.5; q += 2.6) sb.add([x + t[0] * q + n[0] * 0.5, y0 + H * 0.42, z + t[2] * q + n[2] * 0.5], [t[0] * 2.8, 0, t[2] * 2.8], n, 0.3, OCHRE, { seed: 0.15 });
        P.fan(x + t[0] * (W / 2 + 1) + n[0], z + t[2] * (W / 2 + 1) + n[2], 1.6); P.fan(x - t[0] * (W / 2 + 1.2) + n[0], z - t[2] * (W / 2 + 1.2) + n[2], 1.4); P.fan(x + n[0] * 1.5, z + n[2] * 1.5, 1.1);
      };
      // a haystack: ochre strokes combed down from the top, in two coats, on a body of bare cloth
      const stack = (x, z, H) => {
        const y0 = gh(x, z), R = H * 0.42, bth = coat2(r, uZ(z) - 0.04, 0.35);
        P.loft([[0, 0.8], [0.15, 1], [0.5, 0.9], [0.8, 0.6], [1, 0.08]].map(([h, q]) => [x, y0 + h * H * 0.97, z, q * R * 0.95, q * R * 0.95, 2]), X, Zv, { paint: false, ns: 8, nq: 14 });
        for (let a = 0; a < 6.283; a += 0.3) for (const [h0, h1] of [[1, 0.52], [0.6, 0.02]]) {
          const ca = Math.cos(a + h0), sa = Math.sin(a + h0), q0 = h0 > 0.9 ? 0.1 : 0.84, q1 = h1 < 0.1 ? 0.84 : 0.92;
          sb.add([x + ca * R * q0, y0 + H * h0, z + sa * R * q0], [ca * R * (q1 - q0), H * (h1 - h0), sa * R * (q1 - q0)], [ca, 0.3, sa], R * 0.36, OCHRE, { birth: bth(), seed: r.range(0.1, 0.6) });
        }
        for (let a = 0; a < 5; a++) { const an = a / 5 * 6.28 + r(); P.fan(x + Math.cos(an) * (R + 0.6), z + Math.sin(an) * (R + 0.6), 1.7); }
      };
      const jar = async (x, z, H, R) => {
        const bth = coat2(r, uZ(z) - 0.04, 0.4), y0 = gh(x, z);
        const q0 = P.sb.q.length, s0 = P.sb.s.length;
        const Lj = await P.loftA([[0.004, 0.5], [0.1, 0.78], [0.3, 0.97], [0.5, 1], [0.68, 0.86], [0.82, 0.52], [0.91, 0.36], [0.97, 0.42], [1, 0.47]].map(([h, q]) => [x, y0 + h * H, z, q * R, q * R, 2]), X, Zv,
          { ns: 14, nq: 20, width: 0.62, len: [1.7, 3.2], gap: 0.07, s0: 0.01, s1: 0.995, birth: bth, level: 6, pig: (Q, N, s) => (s > 0.955 ? -1 : s > 0.63 && s < 0.86 ? (season === 'snow' && s > 0.7 ? CREAM : OCHRE) : BRICK) });
        trimBelow(P.sb, q0, s0, y0 + 0.065 * H); landed(P, formStreams('border-jar-' + nJar++), bth, (mk) => rungs(P, Lj, mk, jarZones(season === 'snow')));
        for (let a = 0; a < 5; a++) { const an = a / 5 * 6.28 + r(); P.fan(x + Math.cos(an) * (R * 0.62 + 0.4), z + Math.sin(an) * (R * 0.62 + 0.4), 1.7); }
      };
      // a vine row along the cloth: black stem between two ochre edge strokes, leaf presses, grapes
      const vines = (x, z0, z1) => {
        const bth = coat2(r, uZ((z0 + z1) / 2) - 0.04, 0.35), n = [x > 0 ? -1 : 1, 0, 0];
        for (let z = z0; z < z1; z += 4.4) {
          for (const e of [-0.22, 0.22]) sb.add([x, 0, z + e], [0, 4.2, r.range(-0.2, 0.2)], n, 0.2, OCHRE, { seed: 0.2 });
          for (let j = 0; j < 7; j++) sb.add([x, r.range(3.2, 5.6), z + r.range(-2.2, 2.2)], [0, -r.range(1.1, 1.7), r.range(-0.8, 0.8)], n, r.range(1.0, 1.3), leafPig(r), { birth: bth(), seed: r.range(0, 0.4), bone: 6 });
          if (season !== 'spring') for (const [du, dv] of [[0, 0], [0.5, 0], [0.25, -0.45], [0.1, -0.9]]) sb.add([x, 2.9 + dv, z + 1.2 + du - 0.25], [0, 0, 0.5], n, 0.5, BLUE, { variant: 0 });
        }
      };
      for (const sd of [-1, 1]) { for (let z = 198; z < 366; z += 21) turf(sd * 19.5 + r.range(-1, 1), z + r.range(-3, 3), 5.5, 13); await ctx.yield(); }
      turf(31, 299, 13, 14); turf(-31, 252, 10, 9); turf(40, 287, 9, 8); turf(-36, 303, 9, 8); turf(36, 346, 9, 8); turf(-27, 278, 8, 12); turf(27, 236, 8, 12); await ctx.yield();
      house(-31, 252, 13); house(42, 284, 12); await ctx.yield(); house(-38, 304, 11); house(38, 347, 11); await ctx.yield();
      stack(46, 322, 13); stack(-25, 232, 10); await ctx.yield();
      await jar(-25, 270, 13, 3.7); await ctx.yield(); await jar(25, 346, 11, 3.3); await ctx.yield(); await jar(-28, 344, 12, 3.5); await ctx.yield(); await jar(22, 226, 11, 3.3); await ctx.yield();
      tree(P, -37, 278, 17, 5.5, uZ(278) - 0.03, { n: 46, big: 1.9 }); tree(P, 50, 303, 19, 6, uZ(303) - 0.03, { n: 50, big: 2 }); tree(P, -44, 326, 18, 6, uZ(326) - 0.03, { n: 50, big: 2 }); tree(P, 34, 246, 16, 5, uZ(246) - 0.03, { n: 44, big: 1.8 }); await ctx.yield();
      vines(-19.5, 236, 262); vines(19, 318, 340); await ctx.yield();
      P.finish(); P.leanK = 0.3; await ctx.yield();
    }
    // -end the border
    // ---- the near field: within 30 m of the eye there is always paint. Things of the feast and the vineyard set where
    // the route would otherwise cross bare cloth: beside the cubs, where the route drops to them, at the stream and round
    // the exit animal. Each thing's second coat lands by its OWN place on the route (uAt), as the feast's forms do ----
    {
      const P = makePainter('nearfield'), r = P.rng, sb = P.sb, X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1], snow = season === 'snow';
      const jar = async (x, z, H, R, bth) => {
        const prof = [[0.004, 0.5], [0.1, 0.78], [0.3, 0.97], [0.5, 1], [0.68, 0.86], [0.82, 0.52], [0.91, 0.36], [0.97, 0.42], [1, 0.47]], w = Math.max(0.3, Math.min(0.6, R * 0.17));
        const q0 = sb.q.length, s0 = sb.s.length;
        await P.loftA(prof.map(([h, q]) => [x, h * H, z, q * R, q * R, 2]), X, Z, { ns: 14, nq: 18, width: w, len: [w * 2.6, w * 5], s0: 0.01, s1: 0.995, birth: bth,
          pig: (Q, N, s) => (s > 0.955 ? -1 : s > 0.63 && s < 0.86 ? (snow && s > 0.7 ? CREAM : OCHRE) : BRICK) });
        trimBelow(sb, q0, s0, 0.065 * H);
        for (let a = 0; a < 4; a++) { const an = a / 4 * 6.28 + r(); P.fan(x + Math.cos(an) * (R * 0.62 + 0.4), z + Math.sin(an) * (R * 0.62 + 0.4), 1.3 + R * 0.2); }
      };
      // a round bread lying on the turf: ochre drags across a disc, a brick crust ring
      const bread = (x, z, R, bth) => {
        const y = gh(x, z) + 0.12;
        for (let o = -R + 0.3; o < R; o += 0.5) { const hw = Math.sqrt(Math.max(0.05, R * R - o * o)); sb.add([x - hw, y, z + o], [2 * hw, 0, r.range(-0.1, 0.1)], Y, 0.56, OCHRE, { birth: bth(), seed: r.range(0.1, 0.5) }); }
        const n = Math.max(8, Math.round(R * 6)); for (let i = 0; i < n; i++) { const a = i / n * 6.283, l = 6.283 * R / n * 1.2; sb.add([x + Math.cos(a) * R, y + 0.04, z + Math.sin(a) * R], [-Math.sin(a) * l, 0, Math.cos(a) * l], Y, 0.34, BRICK, { seed: 0.15 }); }
      };
      // a slice of melon stood on its rind, its cut face to n: brick flesh in level drags, a green rind, seeds left bare
      const slice = (x, z, R, n, bth) => {
        const y0 = gh(x, z), t = [n[2], 0, -n[0]];
        for (let y = 0.35; y < R; y += 0.5) {
          const hw = Math.sqrt(Math.max(0.04, R * R - (R - y) * (R - y))) - 0.3; let q = -hw;
          while (q < hw - 0.3) { const len = Math.min(r.range(1.6, 3.4), hw - q), seed = r() < 0.2; sb.add([x + t[0] * q, y0 + y, z + t[2] * q], [t[0] * len, r.range(-0.05, 0.05), t[2] * len], n, 0.56, BRICK, { birth: bth(), seed: r.range(0.1, 0.5) }); q += seed ? len + 0.4 : len * r.range(0.72, 0.9); }
        }
        const m = Math.max(6, Math.round(R * 3.2)); for (let i = 0; i < m; i++) { const a = Math.PI + i / m * Math.PI, a1 = Math.PI + (i + 1.15) / m * Math.PI;
          sb.add([x + t[0] * Math.cos(a) * R, y0 + R + Math.sin(a) * R + 0.1, z + t[2] * Math.cos(a) * R], [t[0] * (Math.cos(a1) - Math.cos(a)) * R, (Math.sin(a1) - Math.sin(a)) * R, t[2] * (Math.cos(a1) - Math.cos(a)) * R], n, 0.5, GREEN, { seed: 0.15 }); }
        P.fan(x + t[0] * (R + 0.6), z + t[2] * (R + 0.6), 1.3); P.fan(x - t[0] * (R + 0.5), z - t[2] * (R + 0.5), 1.5);
      };
      // turf: long green drags inside an ellipse
      const turf = (cx, cz, rx, rz, alongX) => {
        const ra = alongX ? rz : rx, rb = alongX ? rx : rz;
        for (let a = -ra + 0.6; a < ra; a += 1.25) for (let b = -rb - r() * 4; b < rb;) {
          const len = r.range(4, 8.5), x = alongX ? cx + b : cx + a, z = alongX ? cz + a : cz + b, e = (a / ra) * (a / ra) + ((b + len / 2) / rb) * ((b + len / 2) / rb); b += len * r.range(0.85, 1.3);
          if (e > 1 || r() < 0.22 || (x < CL.x1 + 1.6 && x + (alongX ? len : 0) > CL.x0 - 1.6 && z < CL.z1 + 2.6 && z + (alongX ? 0 : len) > CL.z0 - 1.6)) continue;
          sb.add([x, gh(x, z) + 0.05, z], alongX ? [len, 0, r.range(-0.2, 0.2)] : [r.range(-0.2, 0.2), 0, len], Y, r.range(0.6, 0.78), r() < 0.12 ? OCHRE : GREEN, { birth: -1, seed: r.range(0.4, 0.9) });
        }
      };
      // beside the cubs: a wine jar, a round bread and a cut slice of melon on a strip of turf, tall fans among them; the
      // second coat of all of it by the jar's own place
      {
        const jp = [36.6, 186.2], bth = coat2(r, uAt(...jp), 0.4);
        turf(33, 190, 11, 16, 0); await ctx.yield();
        await jar(...jp, 5.2, 1.7, bth); await ctx.yield();
        bread(35.6, 180.2, 1.5, bth);
        slice(34.3, 183.6, 2.0, [-0.19, 0, -0.98], bth);
        for (let i = 0; i < Math.round(18 * Math.max(0.7, detail)); i++) { const x = r.range(32.6, 41.5), z = r.range(175, 189); if (Math.hypot(x - 36.6, z - 186.2) < 2.2 || Math.hypot(x - 35.6, z - 180.2) < 1.8 || Math.hypot(x - 34.3, z - 183.6) < 1.2) continue; P.fan(x, z, r.range(1.5, 3), { w: 0.3, birth: () => bth() }); }
        await ctx.yield();
      }
      // round the exit animal and the great haystack: hay raked out on the ground, turf, tall fans, and one old vine
      // climbing a pole, its leaf fans and grape bunches as big as the hand that painted them; the second coat of this hay,
      // its tufts and fans by the haystack's place (the route's end). The stack's own coat is laid by the exit's painter
      {
        const hx = -5, hz = 403, hR = 12.5, bth = coat2(r, uAt(hx, hz), 0.4, [0.03, 0.09]);
        for (let i = 0; i < 64; i++) {
          const a = Math.PI + (i + r()) / 64 * Math.PI, ca = Math.cos(a), sa = Math.sin(a), q = hR * 0.82 + r.range(0, 2.5), l = r.range(3, 6.5), sw = r.range(-0.3, 0.3);
          const x = hx + ca * q, z = hz + sa * q; if (x > CL.x0 - 2 && x < CL.x1 + 2 && z + sa * l < CL.z1 + 2.6) continue;
          sb.add([x, gh(x, z) + 0.06, z], [(ca - sa * sw) * l, 0, (sa + ca * sw) * l], Y, r.range(0.4, 0.6), OCHRE, { birth: bth(), seed: r.range(0.3, 0.9), dab: 1 });
        }
        for (let i = 0; i < 26; i++) {      // hay dropped in tufts between the cloth's end and the animal
          const x = r.range(-24, 30), z = r.range(377, 391), a0 = r() * 6.28; if (Math.hypot(x - hx, z - hz) < hR) continue;
          for (let t = 0; t < 5; t++) { const a = a0 + (t - 2) * 0.24 + r.range(-0.05, 0.05), l = r.range(1.6, 2.8); sb.add([x, gh(x, z) + 0.06, z], [Math.cos(a) * l, 0.02, Math.sin(a) * l], Y, 0.32, OCHRE, { birth: bth(), seed: r.range(0.2, 0.8), dab: 1 }); }
        }
        await ctx.yield();
        turf(22, 386, 28, 6, 1); await ctx.yield();
        for (let i = 0; i < Math.round(22 * Math.max(0.7, detail)); i++) { const x = r.range(-22, 60), z = r.range(379, 391); if (Math.hypot(x - hx, z - hz) < hR + 1 || Math.hypot(x - OLDV[0], z - OLDV[1]) < 2) continue; P.fan(x, z, r.range(2.2, 3.8), { w: 0.34, birth: () => bth() }); }
        const vx = OLDV[0], vz = OLDV[1];
        for (let a = 0; a < 5; a++) { const an = a / 5 * 6.28 + r(); P.fan(vx + Math.cos(an) * 1.8, vz + Math.sin(an) * 1.8, 2.4); }
      }
      // where the route drops from her face toward the cubs it crosses bare cloth, so the feast is laid there too, at
      // arm's length: a jar's brick shoulder to port, a crescent loaf, two drinking horns, turf and fans; the second coat by
      // that jar's own place
      {
        const jp = [48.8, 173.5], bth = coat2(r, uAt(...jp), 0.4);
        turf(42.5, 172, 8.5, 11, 0); await ctx.yield();
        await jar(...jp, 10, 3.2, bth); await ctx.yield();
        {
          const st = [], N = 8, p0 = [44.6, 166.5], p1 = [38.6, 178.6], dx = p1[0] - p0[0], dz = p1[1] - p0[1], l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l;
          for (let i = 0; i <= N; i++) { const t = i / N, e = Math.sin(t * Math.PI), w = 0.22 + 1.5 * Math.pow(e, 0.6); st.push([p0[0] + dx * t + nx * 1.7 * e, w * 0.85, p0[1] + dz * t + nz * 1.7 * e, w, w * 0.85, 2.2]); }
          await P.loftA(st, X, Y, { ns: 18, nq: 14, width: 0.5, len: [1.3, 2.4], birth: bth, pig: (Q, N2, sm) => (sm < 0.12 || sm > 0.88 ? BRICK : (snow && N2[1] > 0.8 ? CREAM : OCHRE)) });
          P.fan(p0[0] + 1.6, p0[1] - 1, 1.6); P.fan(p1[0] + 1.8, p1[1] + 0.6, 1.5);
        }
        await ctx.yield();
        for (const [hx, hz, sd, ln] of [[38.3, 171.6, -1, 5.6], [40.4, 164.2, 1, 5]]) {
          const st = []; for (let i = 0; i <= 7; i++) { const t = i / 7, w = 0.2 + 0.95 * t; st.push([hx + sd * 1.4 * t * t, w + 1.7 * t * t, hz + ln * t, w, w, 2]); }
          await P.loftA(st, X, Y, { ns: 12, nq: 14, width: 0.36, len: [0.9, 1.8], birth: bth, pig: (Q, N2, sm) => (sm > 0.93 ? -1 : sm > 0.8 ? BRICK : OCHRE) });
          P.fan(hx - sd * 1.3, hz + 1.5, 1.3);
        }
        for (let i = 0; i < Math.round(16 * Math.max(0.7, detail)); i++) {
          const x = r.range(35.5, 50), z = r.range(160, 180);
          if (Math.hypot(x - 48.8, z - 173.5) < 3.8 || Math.abs((x - 44.6) * 12.1 + (z - 166.5) * 6) / 13.5 < 3.4 || path.nearestXZ(x, z).dist < 3.6 || (Math.abs(x - 39.5) < 2.6 && z > 163 && z < 178)) continue;
          P.fan(x, z, r.range(1.5, 2.8), { w: 0.3, birth: () => bth() });
        }
        await ctx.yield();
      }
      // the stream where the way in crosses it: broad cold-blue and cream dashes sliding down its 6 m, its banks combed in
      // green drags and reeds, so the ground at the way in is paint and not bare cloth. Its reeds take their second coat
      // by the crossing's own place: the point of the stream's middle line nearest the route, sought once metre by metre
      // along the laid stretch, no draw. The crossing lies near the route's start, so only a thin share of them lands late
      {
        const O0 = -46, O1 = 52; let oc = O0, dc = Infinity;
        for (let o = O0; o < O1; o++) { const d = path.nearestXZ(...streamX(o)).dist; if (d < dc) { dc = d; oc = o; } }
        const bth = coat2(r, uAt(...streamX(oc)), 0.4, [0.0, 0.02]); let n = 0;
        for (let o = O0; o < O1; o += 1.0 / Math.min(1, detail + 0.25)) {
          const [x0, z0] = streamX(o), [x1, z1] = streamX(o + 3.6), tx = x1 - x0, tz = z1 - z0, tl = Math.hypot(tx, tz) || 1;
          if (r() < 0.9) { const w = r.range(-2.8, 2.8), len = r.range(0.8, 1.25); sb.add([x0 + Hd[0] * w, gh(x0, z0) + 0.05, z0 + Hd[1] * w], [tx * len, 0, tz * len], Y, r.range(0.8, 1.3), r() < 0.38 ? CREAM : BLUE, { birth: -1, seed: r.range(0.2, 0.7), dab: 1 }); }
          for (const sd of [-1, 1]) {
            const w = sd * r.range(4.3, 7.4), x = x0 + Hd[0] * w, z = z0 + Hd[1] * w; if (path.nearestXZ(x, z).dist < 3.4) continue;
            if (r() < 0.5) { const len = r.range(1.2, 2.3); sb.add([x, gh(x, z) + 0.04, z], [tx * len, 0, tz * len], Y, r.range(0.5, 0.75), r() < 0.14 ? OCHRE : GREEN, { birth: -1, seed: r.range(0.4, 0.9) }); }
            if (r() < 0.45 * Math.max(0.7, detail)) P.fan(x0 + Hd[0] * sd * r.range(3.4, 4.6), z0 + Hd[1] * sd * r.range(3.4, 4.6), r.range(2.4, 4.2), { w: 0.36, birth: () => bth() });
          }
          if (++n % 30 === 0) await ctx.yield();
        }
        await ctx.yield();
      }
      // a wine jar at the exit animal's hind foot and one at the foot of the great haystack, so the ground to either side of
      // the last climb is paint; each jar's second coat by its own place
      for (const [x, z, H, R] of [[47.5, 370, 12, 3.6], [-13.5, 379.5, 8.5, 2.8]]) { await jar(x, z, H, R, coat2(r, uAt(x, z), 0.4, [0.03, 0.09])); await ctx.yield(); }
      // the ground before the stag's meadow: turf drags and fans
      { turf(96, 150, 8, 15, 0); for (let i = 0; i < Math.round(10 * Math.max(0.7, detail)); i++) { const x = r.range(89, 103), z = r.range(136, 164); if (path.nearestXZ(x, z).dist < 3.6) continue; P.fan(x, z, r.range(1.6, 3), { w: 0.3 }); } await ctx.yield(); }
      P.finish(); await ctx.yield();
    }

    // ---- the polish of 6 Oct (evening): near paint where the flight still looked across bare cloth, all in the lower two
    // thirds of the picture and all in the world's own things: vine rows with grapes beside the road to her, the old rows by
    // the way in grown full, a village in rows on its ground line behind the exit animal, far farms on the rising bowl ----
    {
      const P = makePainter('polish'), r = P.rng, sb = P.sb, Y = [0, 1, 0];
      const dk = Math.min(1, detail + 0.15);
      // a vine row along +Z at x, its leaves and grapes turned to +X (to the eye on the flank run) and half of them
      // squared to the eye coming up the row
      const zrow = (x, z0, z1, h, bfn) => {
        const al = [0, 1], fc = [1, 0, 0], back = [0, 0, -1], cr = [1, 0];
        for (let z = z0; z <= z1; z += 4) vineStock(sb, r, x, z, al, fc, h, bfn());
        for (let z = z0 - 1 + r() * 1.05; z < z1; z += 1.05 * r.range(0.8, 1.2)) for (const wy of [h * 0.32, h * 0.64, h * 0.96]) {
          if (r() < 0.12) continue;
          const cross = r() < 0.4;
          cluster(sb, r, [x, z], wy + r.range(-0.3, 0.3), cross ? cr : al, cross ? back : fc, Math.max(2, Math.round(4 * dens * dk)), 1.15, bfn, r() < 0.5 ? GREEN : -1);
        }
        if (season !== 'spring') for (let z = z0 + 1; z < z1 - 1; z += 2.6) {
          const y = [h * 0.3, h * 0.55, h * 0.8][Math.floor(r() * 3)] + r.range(-0.3, 0.3), zz = z + r.range(-1, 1);
          bunch(sb, r, x + 0.3, gh(x, zz) + y, zz, al, fc, 1.15, bfn());
        }
        for (let z = z0; z < z1; z += 5) P.fan(x + r.range(0.8, 1.6), z + r.range(-1.5, 1.5), r.range(1.4, 2.2), { w: 0.26 });
      };
      { const b = coat2(r, 0.14, 0.35, [0.02, 0.06]); zrow(65.2, 95, 127, 5.8, b); await ctx.yield(); zrow(71.4, 97, 121, 5.2, b); await ctx.yield(); }
      // the old rows to port of the way in (u 0 to 0.06): the same stocks, grown full of leaves and bunches where the first
      // pictures look across them
      {
        const back = [-Hd[0], 0, -Hd[1]]; let n = 0;
        for (const k of [-4, -3, -2, -1]) {
          const o = k * 6.5, fc = [Ld[0], 0, Ld[1]];
          for (let sv = 40 + r() * 1.3; sv < 67.5; sv += 1.3 * r.range(0.8, 1.2)) for (const wy of [1.6, 3.2, 4.8]) {
            if (r() < 0.2) continue;
            const cross = r() < 0.45;
            cluster(sb, r, vp(sv, o), wy + r.range(-0.3, 0.3), cross ? Ld : Hd, cross ? back : fc, Math.max(2, Math.round(4 * dens * dk)), 1.15, () => -1, r() < 0.5 ? GREEN : -1);
            if (++n % 60 === 0) await ctx.yield();
          }
          if (season !== 'spring') for (let sv = 42; sv < 66; sv += 2.4) { const [x, z] = vp(sv + r.range(-1, 1), o); bunch(sb, r, x + fc[0] * 0.3, gh(x, z) + [1.5, 2.8, 4.1][Math.floor(r() * 3)], z + fc[2] * 0.3, Hd, fc, 1.1, -1); }
        }
        await ctx.yield();
      }
      // a house as he painted them, a flat relief turned to the point (ex, ez): cream wall strokes with the door and a
      // window left bare, a hipped brick roof, an ochre rail
      const house = (x, z, W, ex, ez, bth) => {
        let nx = ex - x, nz = ez - z; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
        const n = [nx, 0, nz], t = [-nz, 0, nx], y0 = gh(x, z), H = W * 0.6, rh = W * 0.34, sw = Math.max(0.8, W * 0.075), cols = Math.max(4, Math.round(W / (sw * 0.95))), dc = Math.floor(cols * (0.3 + 0.4 * r()));
        for (let c = 0; c < cols; c++) {
          const q = (c + 0.5) / cols - 0.5, px = x + t[0] * q * W, pz = z + t[2] * q * W, door = c === dc, win = !door && c % 4 === 1 && c > 0 && c < cols - 1;
          if (door) { sb.add([px, y0 + H, pz], [0, -H * 0.36, 0], n, sw, CREAM, { seed: 0.2 }); continue; }
          if (win) { sb.add([px, y0 + H, pz], [0, -H * 0.22, 0], n, sw, CREAM, { seed: 0.2 }); sb.add([px, y0 + H * 0.5, pz], [0, -H * 0.5, 0], n, sw, CREAM, { birth: bth(), seed: r.range(0.1, 0.5) }); continue; }
          sb.add([px, y0 + H, pz], [r.range(-0.05, 0.05), -H, 0], n, sw * 1.02, CREAM, { birth: bth(), seed: r.range(0.05, 0.5) });
        }
        for (let k = 0, rows = Math.max(3, Math.round(rh / sw)); k < rows; k++) {
          const hw = (W / 2 + 0.6) * (1 - 0.72 * k / rows), y = y0 + H + sw * 0.45 + k * rh / rows;
          for (let q = -hw; q < hw - 0.3;) { const l = Math.min(hw - q, r.range(3, 5.5) * sw); sb.add([x + t[0] * q + n[0] * 0.1, y, z + t[2] * q + n[2] * 0.1], [t[0] * l, 0, t[2] * l], n, sw, BRICK, { birth: bth(), seed: r.range(0.05, 0.45) }); q += l * 0.92; }
        }
        for (let q = -W / 2; q < W / 2 - 0.5; q += 3.2 * sw) sb.add([x + t[0] * q + n[0] * 0.4, y0 + H * 0.42, z + t[2] * q + n[2] * 0.4], [t[0] * 3.4 * sw, 0, t[2] * 3.4 * sw], n, 0.36 * sw, OCHRE, { seed: 0.15 });
        P.fan(x + t[0] * (W / 2 + 1) + n[0], z + t[2] * (W / 2 + 1) + n[2], 1.4 + W * 0.05); P.fan(x - t[0] * (W / 2 + 1.2) + n[0], z - t[2] * (W / 2 + 1.2) + n[2], 1.3 + W * 0.05);
      };
      // a haystack as a few ochre strokes combed down from the top, facing (ex, ez)
      const hay = (x, z, H, ex, ez, bth) => {
        let nx = ex - x, nz = ez - z; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl; const y0 = gh(x, z), R = H * 0.42, tx = -nz, tz = nx, N = Math.max(7, Math.round(R * 2 / 0.9));
        for (let j = 0; j < N; j++) { const q = (j / (N - 1)) * 2 - 1, top = [x + tx * q * R * 0.25, y0 + H * (1 - 0.12 * q * q), z + tz * q * R * 0.25]; sb.add(top, [tx * q * R * 0.75, -(top[1] - y0), tz * q * R * 0.75], [nx, 0, nz], Math.max(0.7, R * 2.3 / N), OCHRE, { birth: bth(), seed: r.range(0.1, 0.6) }); }
        P.fan(x + tx * (R + 0.8) + nx, z + tz * (R + 0.8) + nz, 1.6); P.fan(x - tx * (R + 0.8) + nx, z - tz * (R + 0.8) + nz, 1.5);
      };
      // a line of vine leaves along a slope, facing (ex, ez)
      const vrow = (x, z, L, S, ex, ez, bth) => {
        let nx = ex - x, nz = ez - z; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl; const tx = -nz, tz = nx, own = leafPig(r);
        for (let q = -L / 2; q < L / 2; q += 2.6 * S) { const px = x + tx * q, pz = z + tz * q; sb.add([px, gh(px, pz) + r.range(3.2, 5) * S, pz], [tx * r.range(-1, 1) * S, -r.range(2, 3.2) * S, tz * r.range(-1, 1) * S], [nx, 0, nz], 2.3 * S, r() < 0.75 ? own : leafPig(r), { birth: bth(), seed: r.range(0, 0.4) }); }
      };
      // green drags along X inside an ellipse: the ground line a row stands on
      const sward = (cx, cz, rx, rz) => {
        for (let a = -rz + 0.6; a < rz; a += 1.3) for (let b = -rx - r() * 4; b < rx;) {
          const len = r.range(4, 8.5), e = (a / rz) * (a / rz) + ((b + len / 2) / rx) * ((b + len / 2) / rx), x = cx + b, z = cz + a; b += len * r.range(0.85, 1.3);
          if (e > 1 || r() < 0.25) continue;
          sb.add([x, gh(x, z) + 0.05, z], [len, 0, r.range(-0.2, 0.2)], Y, r.range(0.6, 0.8), r() < 0.14 ? OCHRE : GREEN, { birth: -1, seed: r.range(0.4, 0.9) });
        }
      };
      // the village behind the exit animal (the last climb, u 0.83 to 0.93): houses, haystacks, small fruit trees and vine
      // lines in two rows on their ground line, low under the blue edge, seen between the animal's legs and past the stack
      {
        const ex = 0, ez = 338, bth = coat2(r, 0.8, 0.35, [0.03, 0.1]);
        sward(52, 432, 62, 9); await ctx.yield(); sward(-40, 436, 16, 7); sward(60, 462, 70, 8); await ctx.yield();
        house(18, 436, 13, ex, ez, bth); house(63, 430, 14, ex, ez, bth); house(97, 437, 13, ex, ez, bth); house(-36, 437, 12, ex, ez, bth); await ctx.yield();
        hay(40, 431, 10, ex, ez, bth); hay(81, 428, 9, ex, ez, bth); hay(118, 444, 11, ex, ez, bth); hay(-24, 446, 9, ex, ez, bth);
        tree(P, 29, 446, 15, 5, 0.84, { n: 40, big: 1.9 }); tree(P, 52, 444, 17, 5.5, 0.84, { n: 44, big: 2 }); await ctx.yield();
        tree(P, 110, 428, 16, 5.2, 0.84, { n: 42, big: 1.9 }); tree(P, 76, 448, 14, 4.6, 0.84, { n: 36, big: 1.8 }); await ctx.yield();
        house(44, 466, 14, ex, ez, bth); house(92, 470, 15, ex, ez, bth); house(4, 470, 13, ex, ez, bth); hay(68, 464, 11, ex, ez, bth); hay(24, 468, 10, ex, ez, bth);
        vrow(126, 466, 34, 1.2, ex, ez, bth); vrow(-30, 472, 30, 1.2, ex, ez, bth); vrow(140, 430, 30, 1.1, ex, ez, bth); await ctx.yield();
      }
      // far farms on the rising bowl beyond it (the foot of the last pictures, u 0.9 to 0.96): a few strokes each, larger
      // with distance as the valley's are
      {
        const ex = 2, ez = 364, bth = coat2(r, 0.86, 0.3, [0.03, 0.1]);
        for (let i = 0; i < 22; i++) {
          const az = lerp(-0.42, 0.95, (i + r()) / 22), d = r.range(175, 330), x = ex + Math.sin(az) * d, z = ez + Math.cos(az) * d, S = 1.5 + (d - 175) * 0.006, kind = i % 4;
          if (kind === 0) house(x, z, r.range(11, 14) * S, ex, ez, bth); else if (kind === 1) hay(x, z, r.range(10, 13) * S, ex, ez, bth); else if (kind === 2) vrow(x, z, r.range(30, 44) * S, S, ex, ez, bth);
          else { const H = r.range(15, 22) * S, R = H * 0.3, y0 = gh(x, z), nl = Math.hypot(ex - x, ez - z), n = [(ex - x) / nl, 0, (ez - z) / nl], own = r() < 0.6 ? GREEN : leafPig(r);
            sb.add([x, y0, z], [0, H * 0.5, 0], n, R * 0.24, season === 'snow' ? CREAM : BRICK, { birth: bth() });
            for (let j = 0; j < 9; j++) { const q = r.range(-1, 1), py = r.range(0.42, 1) * H, w = R * Math.sqrt(Math.max(0.1, 1 - Math.pow((py / H - 0.7) / 0.34, 2))), an = r.range(-2.4, -0.75), l = R * r.range(0.8, 1.2); sb.add([x - n[2] * q * w, y0 + py, z + n[0] * q * w], [-n[2] * Math.cos(an) * l, Math.sin(an) * l, n[0] * Math.cos(an) * l], n, R * r.range(0.5, 0.7), r() < 0.75 ? own : leafPig(r), { birth: bth(), seed: r.range(0, 0.4) }); } }
          if (i % 5 === 4) await ctx.yield();
        }
      }
      // the floor under the flank run (u 0.085 to 0.3): the way itself was kept clear of standing things, so the cloth lay
      // bare right under the eye. Dry green drags laid along the way, ochre now and then, and fallen leaf dabs; all flat
      {
        const pt = new THREE.Vector3(), tg = new THREE.Vector3(), skip = (x, z) => {
          const s2 = (x - 120) * Hd[0] + z * Hd[1];
          return Math.abs(s2 - 72) < 10 || ((x - 96) / 9) ** 2 + ((z - 150) / 16) ** 2 < 1 || ((x - 96) / 27) ** 2 + ((z - 171) / 13) ** 2 < 1 || ((x - 121) / 13) ** 2 + ((z - 140) / 8) ** 2 < 1 || ((x - 30) / 18) ** 2 + ((z - 111) / 45) ** 2 < 1;
        };
        for (let lane = -5; lane <= 5; lane++) for (let u = 0.085 + r() * 0.01; u < 0.3;) {
          path.pointAt(u, pt); path.tangentAt(u, tg); const tl = Math.hypot(tg.x, tg.z) || 1, tx = tg.x / tl, tz = tg.z / tl, len = r.range(4, 8), o = lane * 1.3 + r.range(-0.2, 0.2);
          u += len * r.range(0.9, 1.4) / path.length;
          const x = pt.x - tz * o, z = pt.z + tx * o; if (r() < 0.28 || skip(x, z) || skip(x + tx * len, z + tz * len)) continue;
          sb.add([x, gh(x, z) + 0.05, z], [tx * len, 0, tz * len], Y, r.range(0.6, 0.8), r() < 0.14 ? OCHRE : GREEN, { birth: -1, seed: r.range(0.35, 0.85) });
        }
        await ctx.yield();
        for (let i = 0; i < Math.round(70 * dens * detail); i++) {
          const u = r.range(0.085, 0.31), o = r.range(-9, 9); path.pointAt(u, pt); path.tangentAt(u, tg); const tl = Math.hypot(tg.x, tg.z) || 1, x = pt.x - tg.z / tl * o, z = pt.z + tg.x / tl * o, a = r() * 6.28, l = r.range(0.7, 1.1);
          if (skip(x, z)) continue;
          sb.add([x, gh(x, z) + 0.08, z], [Math.cos(a) * l, 0, Math.sin(a) * l], Y, r.range(0.5, 0.7), season === 'snow' ? CREAM : leafPig(r), { dab: 1, seed: r.range(0, 0.3) });
        }
        await ctx.yield();
      }
      // the floor of the dive (u 0.355 to 0.45): the same under the drop from her face to the cubs, where the eye looks
      // straight down the way: green and ochre drags along it and leaf dabs, some still landing as we come down
      {
        const pt = new THREE.Vector3(), tg = new THREE.Vector3();
        for (let lane = -4; lane <= 4; lane++) for (let u = 0.355 + r() * 0.008; u < 0.45;) {
          path.pointAt(u, pt); path.tangentAt(u, tg); const tl = Math.hypot(tg.x, tg.z) || 1, tx = tg.x / tl, tz = tg.z / tl, len = r.range(3, 5.5), o = lane * 1.25 + r.range(-0.2, 0.2);
          u += len * r.range(0.9, 1.3) / path.length;
          const x = pt.x - tz * o, z = pt.z + tx * o; if (r() < 0.3 || x < CL.x1 + 2.5 || x + tx * len < CL.x1 + 2.5 || (Math.abs(x - 30) < 7.5 && z < 146)) continue;
          sb.add([x, gh(x, z) + 0.06, z], [tx * len, 0, tz * len], Y, r.range(0.55, 0.75), r() < 0.25 ? OCHRE : GREEN, { birth: -1, seed: r.range(0.2, 0.6) });
        }
        for (let i = 0; i < Math.round(90 * dens * detail); i++) {
          const u = r.range(0.355, 0.45), o = r.range(-7, 7); path.pointAt(u, pt); path.tangentAt(u, tg); const tl = Math.hypot(tg.x, tg.z) || 1, x = pt.x - tg.z / tl * o, z = pt.z + tg.x / tl * o, a = r() * 6.28, l = r.range(0.8, 1.25);
          if (x < CL.x1 + 2.5 || (Math.abs(x - 30) < 7.5 && z < 146)) continue;
          sb.add([x, gh(x, z) + 0.09, z], [Math.cos(a) * l, 0, Math.sin(a) * l], Y, r.range(0.55, 0.75), season === 'snow' && r() < 0.5 ? CREAM : leafPig(r), { dab: 1, seed: r.range(0, 0.3), birth: r() < 0.4 ? Math.max(0.01, u - r.range(0.015, 0.05)) : -1 });
        }
        await ctx.yield();
      }
      // the stream under the first picture (u 0 to 0.05): its water laid full, broad wet cold-blue and cream dashes lying
      // along the flow, so the band at the foot of the arrival is a painted stream and not glints on bare cloth
      {
        for (let o = -34; o < 40; o += 0.62 / Math.min(1, detail + 0.25)) {
          const [x0, z0] = streamX(o), [x1, z1] = streamX(o + 3.4), w = r.range(-2.7, 2.7), len = r.range(0.85, 1.3);
          sb.add([x0 + Hd[0] * w, gh(x0, z0) + 0.07, z0 + Hd[1] * w], [(x1 - x0) * len, 0, (z1 - z0) * len], Y, r.range(1.1, 1.7), r() < 0.3 ? CREAM : BLUE, { birth: -1, seed: r.range(0, 0.22), level: 3, dab: 1 });
        }
        await ctx.yield();
      }
      P.finish(); P.leanK = 0.3; await ctx.yield();
    }
    // -end the polish

    // (the lead, 6 Oct 15:45 UTC: a block "the vine overhead" (great arches over the cloth, canes over the way in, a garland at the stream,
    // tall trees) was tried here and taken out again: strangers preferred it, but the brief keeps the upper third bare black but for the moon.
    // The tried version is kept by the crew as shots/_lead/bare-oilcloth-night.world.garlands-7.53.js.)

    // ---- life, keyed to u (scripted) and to world time (ambient) ----
    const camP = new THREE.Vector3(), m1 = new THREE.Matrix4(), m2 = new THREE.Matrix4(), m3 = new THREE.Matrix4();
    const rotAbout = (out, p, axis, ang) => out.makeTranslation(p[0], p[1], p[2]).multiply(m2.makeRotationAxis(axis, ang)).multiply(m3.makeTranslation(-p[0], -p[1], -p[2]));
    const AZ = new THREE.Vector3(0, 0, 1);
    // ---- the cubs, keyed to u: they stand with their faces on us as we come out from under their mother, wheel and bolt
    // after us down the cloth, bound through the jar gate and round the fish, overtake, and reach the melon first: one
    // each side of its cut face, heads low against the flesh, dipping their muzzles in by turns.
    const cubEnd = [[MEL[0] + MELP[0] * 9.3 + MELN[0] * 2.9, MEL[1] + MELP[1] * 9.3 + MELN[1] * 2.9], [MEL[0] - MELP[0] * 9.3 + MELN[0] * 2.9, MEL[1] - MELP[1] * 9.3 + MELN[1] * 2.9]];
    const cubWay = [
      [[26.5, 192], [20, 203], [16.5, 214], [16, 226], [16.5, 238], [17.5, 251], [17.5, 262], [10, 276], [2, 292], [-3, 308], [-6.5, 321], cubEnd[0]],
      [[31, 203], [20, 210.5], [6.5, 214], [3.2, 222], [4, 229], [11, 241], [17.5, 251], [17.5, 264], [9, 277], [-3, 290], [-13, 298], [-21, 308], cubEnd[1]]];
    const mkTrack = (w) => {
      const pts = [], cum = [0], cr = (a, b, c, d, t) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
      for (let i = 0; i < w.length - 1; i++) for (let k = 0; k < 12; k++) {
        const a = w[Math.max(0, i - 1)], b = w[i], c = w[i + 1], d = w[Math.min(w.length - 1, i + 2)], t = k / 12;
        pts.push([cr(a[0], b[0], c[0], d[0], t), cr(a[1], b[1], c[1], d[1], t)]);
      }
      pts.push(w[w.length - 1]);
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      return { pts, cum, len: cum[cum.length - 1] };
    };
    const cubTrack = cubWay.map(mkTrack);
    // the first cub's way now keeps to port of the jar gate (it used to cross under the lens at u 0.565); from the point
    // where the two ways join, (17.5, 251), it is where it always was at every u: the old lead-in's length is kept in the count
    const CUB_K0 = mkTrack([[26.5, 192], [19, 202.5], [6.5, 212], [3.2, 222], [4, 229], [11, 241], [17.5, 251], [17.5, 262]]).cum[72], CUB_K1 = cubTrack[0].cum[60];
    const cubRun = [[0.51, 0.7], [0.495, 0.685]], cubSeatF = [Math.PI, Math.PI * 0.9], cubEndF = [Math.atan2(-MELP[0], -MELP[1]), Math.atan2(MELP[0], MELP[1])], cubEatYaw = [-0.75, 0.55];
    const angLerp = (a, b, t) => { let d = (b - a) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return a + d * t; };
    const cubO = { x: 0, z: 0, ry: 0, dist: 0, moving: 0, eat: 0 };
    // how far along its way a cub is: it sets off at a lope across the cloth ahead of us at u 0.45 (so the turn onto the
    // cloth has the two of them crossing between the jars), and from u 0.6 on it is the old bolt, unchanged
    const CUB_UM = 0.52, CUB_UJ = 0.6, CUB_FM = 0.15, CUB_SM = 3, cubUs = (i) => (i === 0 ? cubRun[0][0] : 0.45);
    const herm = (t, p0, p1, m0, m1, h) => { const t2 = t * t, t3 = t2 * t; return (2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * p1 + (t3 - t2) * h * m1; };
    const cubProg = (i, u) => {
      const [u0, u1] = cubRun[i];
      if (i === 0 || u >= CUB_UJ) return sstep(u0, u1, u);   // the first cub keeps the port side of the jars and overtakes at u 0.6
      const CUB_US = cubUs(i); if (u <= CUB_US) return 0;
      const tj = (CUB_UJ - u0) / (u1 - u0), fj = tj * tj * (3 - 2 * tj), sj = 6 * tj * (1 - tj) / (u1 - u0);
      if (u < CUB_UM) return herm((u - CUB_US) / (CUB_UM - CUB_US), 0, CUB_FM, 0, CUB_SM, CUB_UM - CUB_US);
      return herm((u - CUB_UM) / (CUB_UJ - CUB_UM), CUB_FM, fj, CUB_SM, sj, CUB_UJ - CUB_UM);
    };
    const cubAt = (i, u, o) => {
      const T = cubTrack[i], [u0, u1] = cubRun[i]; let d = cubProg(i, u) * T.len;
      if (i === 0) { d = cubProg(i, u) * (T.len + CUB_K0 - CUB_K1); d = d < CUB_K0 ? d * CUB_K1 / CUB_K0 : d - (CUB_K0 - CUB_K1); }
      let k = 1; while (k < T.cum.length - 1 && T.cum[k] < d) k++;
      const a = T.pts[k - 1], b = T.pts[k], seg = Math.max(1e-4, T.cum[k] - T.cum[k - 1]), f = Math.min(1, Math.max(0, (d - T.cum[k - 1]) / seg));
      o.x = lerp(a[0], b[0], f); o.z = lerp(a[1], b[1], f); o.dist = d;
      o.ry = angLerp(angLerp(cubSeatF[i], Math.atan2(b[0] - a[0], b[1] - a[1]), sstep(cubUs(i), cubUs(i) + 0.04, u)), cubEndF[i], sstep(u1 - 0.035, u1 + 0.004, u));
      o.moving = sstep(cubUs(i), cubUs(i) + 0.02, u) * (1 - sstep(u1 - 0.02, u1, u)); o.eat = sstep(u1 - 0.01, u1 + 0.02, u);
      return o;
    };
    const DIVEG = new THREE.Vector3(33, 3, 184), CUBG = new THREE.Vector3(26.5, 5.6, 190), CLOTHG = new THREE.Vector3(3, -5, 262), MELG = new THREE.Vector3(MEL[0], 5.6, MEL[1]);
    // the gaze: one subject at a time, whole, a third to a half of the frame. Keys by u, eased from one to the next.
    const faceW = W3(A.face), faceLow = faceW.clone().add(new THREE.Vector3(0, -3, 0)), headX = new THREE.Vector3(exitAnimal.head[0], exitAnimal.head[1], exitAnimal.head[2]);
    const gazeKeys = [
      [0.0, new THREE.Vector3(32, -2, 46)], [0.018, new THREE.Vector3(32, -2, 46)], [0.03, new THREE.Vector3(30, 8, 96)], [0.075, new THREE.Vector3(105, 8.5, 91)], [0.09, new THREE.Vector3(105, 8.5, 91)], [0.16, new THREE.Vector3(30, 11.5, 108)], [0.22, new THREE.Vector3(102, 9.5, 176)], [0.265, new THREE.Vector3(102, 9.5, 176)],
      [0.32, faceLow], [0.36, faceLow], [0.395, DIVEG], [0.42, CUBG], [0.447, CUBG], [0.5, CLOTHG], [0.54, CLOTHG], [0.595, new THREE.Vector3(-1, 6.5, 266)], [0.63, new THREE.Vector3(-1, 6.5, 268)], [0.685, SIDE_G], [0.715, SIDE_G], [0.775, MELG], [0.81, MELG],
      [0.87, new THREE.Vector3(19, 24, 393)], [0.93, new THREE.Vector3().lerpVectors(END, headX, 0.4).add(new THREE.Vector3(0, -2.6, 0))], [1, new THREE.Vector3().lerpVectors(END, headX, 0.35)]];
    const gA = new THREE.Vector3(), gB = new THREE.Vector3(), gOut = new THREE.Vector3();
    const gazeAt = (time, u) => {
      let j = 0; while (j < gazeKeys.length - 2 && u > gazeKeys[j + 1][0]) j++;
      const a = gazeKeys[j], b = gazeKeys[j + 1], f = sstep(a[0], b[0], u);
      gA.copy(typeof a[1] === 'function' ? a[1](time, u) : a[1]); gB.copy(typeof b[1] === 'function' ? b[1](time, u) : b[1]);
      return gOut.lerpVectors(gA, gB, f);
    };
    const update = (dt, time, camera, u) => {
      U.uT.value = time;
      path.pointAt(u, camP);
      { let d = Math.atan2(camP.x - 31.5, camP.z - 134.5) - 1.2217; if (d < -Math.PI) d += 2 * Math.PI; hero.bear.look.yaw = Math.min(1.5, Math.max(-0.35, d)) * (1 - sstep(0.4, 0.46, u)); }
      hero.setProgress(u);
      if (rare) U.uWet.value = sstep(0.2, 0.3, u);
      // grass fans lean (bone 6 of every painter): x and z sheared by height
      const lean = 0.13 * Math.sin(time * 0.9) + 0.05 * Math.sin(time * 2.3 + 1);
      for (const P of painters) { const e = P.bones[6].elements, lk = P.leanK ?? 1; e[4] = lean * lk; e[6] = lean * 0.6 * lk; }
      // deer: drink, lift their heads as we come (both eyes on us), two bound off in stiff arcs
      {
        const B = deer.P.bones;
        for (const [bi, dir, uu] of [[1, 1, 0.04], [5, -1, 0.056]]) {
          const down = 1 - sstep(uu, uu + 0.03, u), sip = down * (0.5 + 0.5 * Math.sin(time * 1.4 + bi));
          B[bi].makeTranslation(Ld[0] * dir * (1.3 * down), -3.3 * down - 0.5 * sip, Ld[1] * dir * (1.3 * down));
        }
        for (const d of deer) if (d.bound) {
          const t = Math.min(1, Math.max(0, (u - 0.068 - 0.012 * d.i) / 0.1)), dist = 85 * t * t * (3 - 2 * t) * (0.6 + 0.4 * t), hop = 3.4 * Math.abs(Math.sin(dist * Math.PI / 15));
          B[d.bone].makeTranslation(d.ax[0] * dist, hop, d.ax[1] * dist);
        }
      }
      // cubs: stand by their mother, bolt after us, overtake at u 0.62 bounding, reach the melon first and eat
      for (let i = 0; i < hero.cubs.length; i++) {
        const c = hero.cubs[i], o = cubAt(i, u, cubO), ph = o.dist * Math.PI * 2 / 12 + i * 1.3, mv = o.moving;
        c.object.position.set(o.x - 30, 1.5 * mv * (0.5 + 0.5 * Math.sin(ph)), o.z - 110); c.object.rotation.set(-0.2 * mv * Math.cos(ph), o.ry, 0);
        // the head alone turns to whoever is looking; at the melon it drops against the flesh and dips in by turns
        const dx = camP.x - o.x, dz = camP.z - o.z, cs = Math.cos(o.ry), sn = Math.sin(o.ry), yawT = Math.min(1.35, Math.max(-1.35, Math.atan2(dx * cs - dz * sn, dx * sn + dz * cs)));
        const [u0] = cubRun[i], wl = sstep(0.37, 0.42, u) * (1 - 0.45 * sstep(cubUs(i), cubUs(i) + 0.03, u)) * (1 - o.eat);
        const dip = o.eat * sstep(0.5, 0.85, Math.sin(time * 1.5 + i * Math.PI)), munch = o.eat * (0.5 + 0.5 * Math.sin(time * 6 + i * 2));
        c.look.yaw = yawT * wl + o.eat * lerp(cubEatYaw[i], i ? -0.5 : 0.5, dip);
        c.look.pitch = o.eat * (0.24 + 0.2 * dip + 0.07 * munch) + 0.12 * mv;
        c.setPose(mv > 0.02 ? ph : u * 60 + i * 2, lean, mv > 0.02 ? 0.4 : 0.05, mv);
      }
      // the far train crawls along the blue edge; the exit animal flicks its ears and tail
      { const d = u * 330 - 56 + 5 * Math.sin(time * 0.25), t = far.trainDir; far.bones[1].makeTranslation(-t[0] * d, 0, -t[2] * d); }
      {
        for (let k = 0; k < 2; k++) {
          const an = k ? sideAnimal : exitAnimal, B = an.P.bones, f1 = Math.pow(Math.max(0, Math.sin(time * 1.3 + k * 2)), 10), f2 = Math.pow(Math.max(0, Math.sin(time * 1.3 + 0.5 + k * 2)), 10);
          rotAbout(B[1], an.earPivots[0], an.axis, -0.5 * f1); rotAbout(B[2], an.earPivots[1], an.axis, 0.5 * f2);
          rotAbout(B[3], an.tailPivot, AZ, 0.22 * Math.sin(time * 1.1 + k));
        }
      }
    };
    update(0, 0, null, 0);

    const pace = (u) => 1 - 0.27 * (sstep(0.1, 0.16, u) - sstep(0.36, 0.43, u)) + 0.15 * (sstep(0.46, 0.53, u) - sstep(0.82, 0.89, u));
    return {
      scene, path, duration: 40, pace,
      camera: { fov: 50, near: 0.3, far: 3200, lookAhead: 22, sway: 0.4, bank: 0.12 },
      pois: [{ at: gazeAt, from: 0, to: 0.975, fade: 0.04, weight: 0.93 }],
      portal: { shape: 'arch', width: 14, height: 14, tilt: true, frame: 0, color: '#C89A3A', veil: '#C89A3A', glow: 0, revealDistance: 240, blendDistance: 30 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() { hero.dispose(); style.dispose(); },
    };
  },
};
