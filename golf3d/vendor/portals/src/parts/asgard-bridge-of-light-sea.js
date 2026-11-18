// THE GOLDEN CITY AND ITS BRIDGE: the sea, its edge with the bay, THE FALL that goes over it, the spray and the mist under
// the lip, and the stars under the sea's level.
// THE MIRROR. The sea is one flat sheet at y 0 with no bed. It is drawn after everything solid and before every image:
// each of its pixels shows the kit's own sky for the MIRRORED ray (the sky's own fragment shader, run with the sight
// line turned over about the sheet), so every star, star cloud and moon stands in the water where a true mirror
// puts it. It writes no depth; the images (the city, the bridge) are real meshes turned over about y 0 and drawn
// straight after it, depth-tested against the real things; then a depth-only copy of the sheet is drawn, so that what lies below
// the sea's level is hidden wherever the sight line meets the water first.
// THE LIGHTS IT HOLDS: the bridge's colours either side of the bridge (the colours passing that stretch of it), and the city's gold round the island.
// THE EDGE AND THE FALL. The glass is still to its very edge, where it bends over in a smooth glossy curve. Along the whole
// edge (the old rim and both arms of the bay alike) the sea FALLS. Down the fall, from the lip:
//  the curve: glass for the first 1 to 5.5 m (the still water's own colour carried over, with a sheen), ending higher here and
//   lower there, so the white never begins along a ruled line;
//  the rim of foam under it, 2 to 4 m broad, the brightest thing of the fall, fuller here and thinner there; the foam
//   spills on, fading, for some 15 m under it;
//  the BODY of white water, moonlit blue-white, in dense soft falling streaks (9 m, 3.8 m, 1.6 m and 0.7 m broad, each several
//   times longer than broad, fine bright threads among them), shut for its top 60 m: nothing shows through. It is brightest
//   under the lip, dimmer and bluer with the depth;
//  from 60 m down it opens: holes where less water falls, more and wider with the depth, until only streamers and falling
//   clumps are left with dark gaps between them (spray in shadow lies behind them down to 400 m, so what shows through is
//   dimmed), each with a soft fringe of spray, a soft haze where they end; all gone by 310 to 440 m.
// The water falls faster the deeper it is: every pattern in it lengthens and quickens with the depth (at most 2.6 of its cells
// pass a place in a second), and every pattern is filtered by the pixel's footprint, across and along: far off the body is one
// soft pale band, brighter at its top. The faces toward the key light (high in the north-west) are brighter than those turned
// from it; near the bridge the water takes the colours passing there. It leaves the edge at 1.8 m a second, so it hangs nearly
// upright (14 m out at the most). The depth-only copy takes in the fall's shut top.
// THE SPRAY AND THE MIST: three soft curtains beyond the falling water, along the whole edge: nearest, the spray going down
// with it in long soft plumes (from 3 m under the lip); then two of mist in soft billows, 12 to 90 m out, from 40 m under the
// lip to 620 m, thickest where the streamers end, sinking at 4 m a second and drifting along the edge, lit by the moon, warmed
// by the gate house where it is near, taking the bridge's colours near the bridge. No curtain is thinned or hidden by where the eye is; none
// reaches the bay's middle (where the two arms' curtains would cross near the apex they end at the bay's axis). No plume, no
// bank, no floor of mist: below the sea's level there is open space.
// THE STARS UNDER THE SEA'S LEVEL. A half box about the eye, drawn straight after the kit's sky, shows the kit's own sky for the
// sight line turned over about the level and turned a quarter about the upright, without the moons: stars, star clouds and the
// galaxy below as above, darkening toward straight down.
import * as THREE from 'three';
import * as fx from '../kit/fx.js';
import { lipZ, BRIDGE, CITY, MIRROR_GLSL } from './asgard-bridge-of-light-plan.js';

const F1 = (v) => v.toFixed(1);      // a number of the plan, written into a shader
const OUT = (drop) => Math.min(0.8 * Math.sqrt(drop), 14);      // how far out from the edge the falling water is, `drop` metres down (1.8 m a second outward)

const SEA_VERT = /* glsl */`
attribute float aDrop, aS;
varying vec3 vDir, vSeaW, vSeaN; varying float vDrop, vBend, vS;
void main(){
  vec4 w = modelMatrix*vec4(position, 1.); vSeaW = w.xyz; vSeaN = normal; vDrop = aDrop; vS = aS; vBend = 1. - normal.y;
  vDir = reflect(w.xyz - cameraPosition, normal);          // the mirrored sight line (exact on the flat sheet)
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
const SEA_HEAD = /* glsl */`varying vec3 vDir; varying vec3 vSeaW, vSeaN; varying float vDrop, vBend, vS;
uniform vec3 uSeaBody, uSeaFog; uniform float uSeaDim, uSeaFogD, uSeaMist, uSeaTime;
${MIRROR_GLSL}
float abH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float abN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f); return mix(mix(abH(i), abH(i + vec2(1., 0.)), f.x), mix(abH(i + vec2(0., 1.)), abH(i + vec2(1., 1.)), f.x), f.y); }
float abK(float a, float b){ return clamp(1.5 - 1.66*max(a, b), 0., 1.); }      // how much of a pattern is left when a pixel covers a (across) or b (along) of its cells: all under 0.3, none over 0.9
vec4 abSea(vec3 c, vec3 d){
  float fwS = length(fwidth(vSeaW.xz));                                    // the footprint on the water, in metres: taken once
  float far = length(vSeaW.xz - cameraPosition.xz), alpha = 1.;
  float g = 1. - clamp(d.y, 0., 1.), g2 = g*g, fres = .46 + .54*g2*g;      // glass: a full mirror toward the horizon, darker looking down
  float lum = dot(c, vec3(.299, .587, .114));
  c = c*(uSeaDim + .7*smoothstep(.12, .5, lum))*fres + uSeaBody*(1.2 - .8*g2);      // the mirrored sky over deep water: the stars, the star clouds and the moons keep more of their light than the dark between them
  c += vec3(.016, .024, .040)*g2*g2*g2;                                  // a faint cool sheen toward the horizon
  float ax = abs(vSeaW.x);
  float gl = abN(vec2(vSeaW.x*.45 + uSeaTime*.35, vSeaW.z*1.9 - uSeaTime*.6))*abN(vec2(vSeaW.x*1.1 - uSeaTime*.5, vSeaW.z*.7 + uSeaTime*.3) + 31.);
  float glint = smoothstep(.38, .62, gl)*clamp(1.4 - fwS*.9, 0., 1.);      // short glints, no two alike, coming and going
  // THE BRIDGE'S LIGHT ON THE WATER either side of it: the colours passing that stretch, strong beside the slab, a faint wash far out
  float by = 1. - smoothstep(${F1(BRIDGE.z0)}, ${F1(BRIDGE.z0 + 40)}, vSeaW.z);
  vec3 hue = abHue(vSeaW.z*.0031 - uSeaTime*.11 + .06*abN(vec2(vSeaW.z*.02 - uSeaTime*1.3, 3.)));
  c += hue*by*(.30*exp(-ax/16.) + .02*exp(-ax/70.))*(.85 + .4*glint);
  // THE CITY'S GOLD lying on the water round the island
  float cd = max(length(vSeaW.xz - vec2(${F1(CITY.x)}, ${F1(CITY.z)})) - ${F1(CITY.r)}, 0.);
  c += vec3(1., .66, .26)*(.13*exp(-cd/150.) + .035*exp(-cd/600.))*(.9 + .25*glint);
  float sl = (abLipZ(vSeaW.x + 1.) - abLipZ(vSeaW.x - 1.))*.5, edge = (vSeaW.z - abLipZ(vSeaW.x))/sqrt(1. + sl*sl), onGlass = 1. - step(.001, vBend);
  // where the glass ends the water quickens and thins: a soft sheen over its last metres, carried on over the edge (no line there: a line finer than a pixel would break into beads)
  float fe = fwidth(edge), e6 = (1. - smoothstep(0., 6. + fe, edge))*6./(6. + fe); c += vec3(.045, .06, .09)*e6*e6*onGlass;      // (seen low over the water the sheen's band is finer than a pixel: it is spread over the pixel and dimmed)
  c = mix(c, vec3(.30, .36, .50), uSeaMist*.3*smoothstep(900., 3500., far)*onGlass);      // the mist night: the far water pales
  // every derivative the fall uses is taken here, before its branch, so that it is defined at the lip too
  float fs = fwidth(vS) + fwidth(vDrop)*.05, fh = fwidth(vDrop);                 // the footprint along the edge and down the fall, in metres
  float q = sqrt(max(vDrop, 0.) + 3.), fq = fwidth(q);                           // falling water quickens: its patterns are laid out along q and run down it
  if(vDrop > 0.){
    // THE FALL
    float h = vDrop, qt = q - uSeaTime*1.3;
    float k0 = abK(fs*.036, fq*.18), k1 = abK(fs*.11, fq*.4), k2 = abK(fs*.26, fq*.9), k3 = abK(fs*.62, fq), k4 = abK(fs*1.45, fq*2.);
    float u0 = abN(vec2(vS*.017 + 3., uSeaTime*.03));                             // where more water goes over and where less, along the edge
    // falling streaks at four breadths (9 m, 3.8 m, 1.6 m and 0.7 m), each several times longer than broad, and fine bright threads among them
    float W = .30*mix(.5, abN(vec2(vS*.11 + 4., qt*.25)), k1) + .27*mix(.5, abN(vec2(vS*.26 + 9., qt*.5)), k2)
      + .24*mix(.5, abN(vec2(vS*.62 + 2., qt)), k3) + .19*mix(.5, abN(vec2(vS*1.45, qt*2.)), k4);
    float thread = smoothstep(.56, .9, abN(vec2(vS*3.1 + 5., qt*2. + 3.)))*abK(fs*3.1, fq*2.);
    // hanks of water (28 m, 9 m and 3.5 m broad), falling with it: where they are thin the body opens lower down
    float M = .45*mix(.5, abN(vec2(vS*.036 + 7., qt*.18)), k0) + .3*mix(.5, abN(vec2(vS*.115 + 4., qt*.4 + 2.)), k1) + .25*mix(.5, abN(vec2(vS*.29 + 6., qt*.9 + 5.)), k2);
    float streak = smoothstep(.33, .67, W);
    vec3 fn = vSeaN*inversesqrt(max(dot(vSeaN, vSeaN), 1e-8)); float lit = .72 + .6*max(dot(fn, vec3(-.418, .518, -.746)), 0.);      // the faces toward the key light are brighter
    float deep = smoothstep(0., 200., h), dim = mix(1., .36, deep)*(.85 + .3*u0);      // brightest under the lip, dimmer and bluer with the depth
    vec3 v = mix(vec3(.13, .20, .38), vec3(.62, .72, .95), clamp(streak*(.45 + .8*M) + .3*thread, 0., 1.))*lit*dim*mix(vec3(1.), vec3(.74, .86, 1.), deep);
    v += abHue(vSeaW.z*.0031 - uSeaTime*.11)*.14*dim*exp(-ax/50.);              // near the bridge it takes the colours passing there
    // the lip: glass over the turn (the still water's own colour carried over, with a sheen), then the broken rim of foam
    // along the lip a pattern must be ten pixels long to be drawn in full (a finer one would show as beads on so thin a line); the slowest (60 m) carries on far off
    float kA = clamp(1.5 - fs*.42, 0., 1.), kB = clamp(1.5 - fs*1.65, 0., 1.), kC = clamp(1.5 - fs*3., 0., 1.), kD = clamp(1.5 - fs*.35, 0., 1.), thin = clamp(1.5 - fh*1.6, 0., 1.);
    float f0 = (1. + 4.5*mix(.5, abN(vec2(vS*.085 + 2., uSeaTime*.05)), kA)*(.5 + .5*mix(.5, abN(vec2(vS*.33, uSeaTime*.15)), kB)))*(.7 + .6*u0);      // where the glass breaks into foam: 1 to 5.5 m down, more where more water goes over
    float wd = 2. + 2.*mix(.5, abN(vec2(vS*.09 + 5., 1.)), clamp(1.5 - fs*.45, 0., 1.));      // the rim's breadth, 2 to 4 m (11 m cells, eased to their mean by the same rule)
    float full = mix(.7, .35 + .65*smoothstep(.2, .6, abN(vec2(vS*.6 + 8., uSeaTime*.2))), kC)*(.55 + .45*mix(.6, smoothstep(.15, .55, abN(vec2(vS*.07, 4.))), kD))*(.8 + .4*abN(vec2(vS*.017 + 11., uSeaTime*.02)));
    float rim = smoothstep(f0 - .4 - fh, f0 + .4 + fh, h)*(1. - smoothstep(f0 + wd*.5, f0 + wd + fh*2., h))*full*wd/(wd + fh);
    c = mix(uSeaBody*1.2, c, clamp(1.5 - fh*3., 0., 1.)) + vec3(.09, .125, .19);      // the curve's own sheen; its mirror of the sky only where a pixel is finer than the curve (far off the mirror's quick turn would be a line finer than a pixel, and break into beads)
    c += vec3(.10, .13, .19)*(mix(.5, streak, thin) + thread*thin)*smoothstep(.5, f0 + .5, h);      // the sheen of the curve; the first threads of foam in it
    v = mix(v, vec3(.78, .86, 1.)*lit, (1. - smoothstep(f0 + 1., f0 + 15. + fh, h))*(.12 + .6*streak));      // the foam spills on for some 15 m under the rim
    v = mix(v, vec3(.84, .91, 1.)*(.78 + .22*streak)*lit, rim);
    c = mix(c, v, smoothstep(f0 - .6 - fh, f0 + .9 + fh, h));
    // from 60 m down the body opens: holes where the hanks are thin, more and wider with the depth, until only streamers are
    // left, then falling clumps; a fringe of spray round each, and a soft haze where they end
    float th = mix(-.12, .88, pow(clamp((h - 60.)/300., 1e-4, 1.), .45)) - .14*(u0 - .5), w = .07 + .25*(1. - k1);
    float core = smoothstep(th - w, th + w, M), fringe = smoothstep(th - .3 - w, th + .02, M);
    float hz = .4 + .6*abN(vec2(vS*.02 + 1., q*.2 - uSeaTime*.1));
    float cov = max(core*mix(1., .55, smoothstep(100., 380., h)), fringe*.3);      // the water itself
    float bk = max(.3*smoothstep(110., 260., h), .5*smoothstep(55., 100., h)*(1. - smoothstep(230., 400., h)))*hz;      // behind it, in the gaps: spray in shadow, so that the gaps are dark
    alpha = cov + (1. - cov)*bk;
    c = mix(mix(vec3(.035, .06, .13), c*.5, smoothstep(110., 300., h)), c*mix(.55, 1., core), cov/max(alpha, 1e-3));
    alpha *= 1. - smoothstep(310., 440., h);
  }
  float fd = far*uSeaFogD; return vec4(mix(uSeaFog, c, exp(-fd*fd)), alpha*(1. - smoothstep(4200., 7600., far)));
}
`;

// the spray and the mist: each curtain's rows as [metres out from the edge, height, how thick it is there]
const CURTAINS = [
  [[1.5, -3, 0], [4, -20, 0.3], [8, -70, 0.8], [13, -160, 1], [19, -300, 0.85], [25, -450, 0]],      // the spray going down with the water
  [[12, -40, 0], [19, -90, 0.6], [30, -170, 1], [46, -300, 1], [60, -440, 0.8], [72, -580, 0]],      // the mist
  [[30, -90, 0], [44, -180, 0.5], [60, -300, 0.85], [76, -460, 0.55], [90, -620, 0]],                // the mist farther out, thinner
];

export function buildSea(ctx, shared, sky, opts = {}) {
  const mist = opts.mist ? 1 : 0, group = new THREE.Group(); group.name = 'sea';
  // ---- the columns across: close together round the apex and round the bay's two corners, every 10 m along the arms, then wider
  // and wider out to 9.6 km either side
  const half = [0, 1, 2, 3, 4, 5, 6.5, 8, 10, 12.5, 15, 18, 22, 26, 30, 35, 40];
  for (let x = 50; x <= 250; x += 10) half.push(x);
  for (let x = 255; x <= 350; x += 5) half.push(x);
  for (let x = 350, step = 25; x < 9000; step *= 1.3) { x += step; half.push(x); }
  const XS = half.slice(1).reverse().map((v) => -v).concat(half), K = XS.length - 1;
  // ---- the sheet and the fall: each column runs from the far south to the edge, then down the fall (each row `drop` metres down
  // and OUT(drop) metres out, square to the edge); aS is the length along the edge, so the streaks are as fine on the arms as on the old rim.
  // The glass is laid in rows across as well (GLASS: where they lie, south to north; two more between the last and the lip): a
  // triangle running 10 km from beside the eye is cut by the drawing machine at the picture's side, and the cuts of two
  // neighbours do not always meet, which showed as rows of dots of what lies under the sea
  const GLASS = [9000, 5000, 2800, 1600, 950, 600, 380, 230, 120, 30, -60, -160, -270, -390, -510], NG = GLASS.length + 2;
  const DROPS = [0, 0.5, 1.2, 2.2, 3.6, 6, 10, 16, 26, 40, 60, 100, 160, 240, 330, 440], rows = NG + DROPS.length, TOP = [0, 3, 6, 9, 12, 15, NG, NG + 6, NG + 10];      // TOP: the rows the depth copy runs through: every third of the glass, the lip, 10 m and 60 m down (to there nothing shows through)
  const pos = [], nor = [], drop = [], along = [], idx = [], idxTop = [], idxFall = [], EDGE = [];
  let s = 0;
  for (let i = 0; i <= K; i++) { const x = XS[i], zl = lipZ(x), sl = lipZ(x + 0.5) - lipZ(x - 0.5), h = Math.hypot(sl, 1), nx = sl / h, nz = -1 / h;      // (nx, nz): square to the edge, away from the sea
    if (i) s += Math.hypot(x - XS[i - 1], zl - lipZ(XS[i - 1]));
    EDGE.push([x, zl, nx, nz, s]);
    for (const z of GLASS) { pos.push(x, 0, z); nor.push(0, 1, 0); drop.push(0); along.push(s); }
    for (const f of [1 / 3, 2 / 3]) { pos.push(x, 0, GLASS[GLASS.length - 1] + (zl - GLASS[GLASS.length - 1]) * f); nor.push(0, 1, 0); drop.push(0); along.push(s); }
    for (const dr of DROPS) { const o = OUT(dr), t = dr > 0 ? 0.4 / Math.sqrt(dr) : 1e3, hh = Math.hypot(1, t);
      pos.push(x + nx * o, -dr, zl + nz * o); nor.push(nx / hh, t / hh, nz / hh); drop.push(dr); along.push(s); }
    if (i) for (let j = 0; j < rows - 1; j++) { const a = (i - 1) * rows + j, b = i * rows + j, list = [a, a + 1, b, b, a + 1, b + 1];
      (j >= NG ? idxFall : idx).push(...list); }      // the fall is drawn first, the flat glass after it: the sheet writes no depth, so what is drawn later lies over
    if (i) for (let j = 0; j < TOP.length - 1; j++) { const a = (i - 1) * rows + TOP[j], a2 = (i - 1) * rows + TOP[j + 1], b = i * rows + TOP[j], b2 = i * rows + TOP[j + 1]; idxTop.push(a, a2, b, b, a2, b2); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('aDrop', new THREE.Float32BufferAttribute(drop, 1));
  geo.setAttribute('aS', new THREE.Float32BufferAttribute(along, 1)); geo.setIndex(idxFall.concat(idx));
  const geoTop = new THREE.BufferGeometry(); geoTop.setAttribute('position', geo.attributes.position); geoTop.setIndex(idxTop);      // the depth copy: the glass and the fall's shut top 60 m
  // the kit's sky shader, asked for the mirrored ray
  const skyFrag = sky.material.fragmentShader, tail = 'gl_FragColor = vec4(max(col, 0.), uOpacity);', at = skyFrag.lastIndexOf(tail), eye = 'vec3 d = normalize(vDir);\n  float pix';
  let frag = at >= 0 ? skyFrag.slice(0, at) + 'gl_FragColor = abSea(max(col, 0.), d);' + skyFrag.slice(at + tail.length) : skyFrag;
  frag = frag.replace('varying vec3 vDir;', SEA_HEAD);
  // on the flat glass the mirrored sight line is worked out in the fragment from the place itself, not carried from the corners
  frag = frag.replace(eye, 'float ripK = .0012*clamp(1.5 - length(fwidth(vSeaW.xz))*.35, 0., 1.); vec3 ripN = normalize(vec3((sin(vSeaW.x*.9 + vSeaW.z*.35 + uSeaTime*.8) + sin(vSeaW.x*.23 - vSeaW.z*.61 - uSeaTime*.5))*ripK, 1., (sin(vSeaW.z*.8 - vSeaW.x*.27 + uSeaTime*.7) + sin(vSeaW.z*.19 + vSeaW.x*.5 + uSeaTime*.4))*ripK));\n  vec3 dd = vBend < .001 ? reflect(vSeaW - cameraPosition, ripN) : vDir; vec3 d = dd*inversesqrt(max(dot(dd, dd), 1e-8));\n  float pix');
  const uniforms = { ...sky.uniforms, uSeaBody: { value: new THREE.Color(0.008, 0.017, 0.036) }, uSeaFog: shared.uFogColor, uSeaFogD: shared.uFogDensity,
    uSeaDim: { value: 0.5 }, uSeaMist: { value: mist }, uSeaTime: shared.uTime };
  const sheet = new THREE.Mesh(geo, new THREE.ShaderMaterial({ name: 'abSeaMirror', uniforms, defines: { ...sky.material.defines }, vertexShader: SEA_VERT, fragmentShader: frag,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true }));      // one pass: each triangle once, in the order of the list
  sheet.frustumCulled = false; sheet.renderOrder = 0.1; group.add(sheet);
  const depth = new THREE.Mesh(geoTop, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, transparent: true, side: THREE.DoubleSide, forceSinglePass: true }));
  depth.frustumCulled = false; depth.renderOrder = 0.6; group.add(depth);

  // ---- THE STARS UNDER THE SEA'S LEVEL: the kit's sky for the sight line turned over about the level and turned a quarter about
  // the upright (so nothing stands under its own image; the join at the level lies behind the sea in every view of the flight), without the moons
  const below = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 2).translate(0, -0.5, 0), new THREE.ShaderMaterial({ name: 'abSkyBelow', uniforms: sky.uniforms, defines: { ...sky.material.defines, NUM_BODIES: 0 },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix*vec4(mat3(viewMatrix)*position, 1.); if(abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }',
    fragmentShader: skyFrag.replace(eye, 'vec3 d = vDir*inversesqrt(max(dot(vDir, vDir), 1e-8)); d = vec3(-d.z, abs(d.y), d.x);\n  float pix'),
    side: THREE.DoubleSide, depthWrite: false, depthTest: true, fog: false, toneMapped: false }));
  below.frustumCulled = false; below.renderOrder = -0.9; group.add(below);

  // ---- THE SPRAY AND THE MIST: three curtains along the whole edge, one mesh (aLay: which curtain). Where a curtain of one arm
  // would cross the bay's axis near the apex it ends there
  const bp = [], be = [], bs = [], bl = [], bi = []; let base = 0;
  CURTAINS.forEach((ROWS, lay) => {
    for (let i = 0; i <= K; i++) { const e = EDGE[i], sg = Math.sign(e[0]);
      for (const r of ROWS) { const xo = e[0] + e[2] * r[0], inBay = sg ? Math.min(Math.max(xo * sg / 14, 0), 1) : (r[0] > 12 ? 0 : 1);
        bp.push(xo, r[1], e[1] + e[3] * r[0]); be.push(r[2] * (r[0] > 9 ? inBay : 1)); bs.push(e[4]); bl.push(lay); }
      if (i) for (let j = 0; j < ROWS.length - 1; j++) { const a = base + (i - 1) * ROWS.length + j, b = base + i * ROWS.length + j; bi.push(a, a + 1, b, b, a + 1, b + 1); } }
    base += (K + 1) * ROWS.length;
  });
  const bankGeo = new THREE.BufferGeometry(); bankGeo.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bankGeo.setAttribute('aEdge', new THREE.Float32BufferAttribute(be, 1));
  bankGeo.setAttribute('aS', new THREE.Float32BufferAttribute(bs, 1)); bankGeo.setAttribute('aLay', new THREE.Float32BufferAttribute(bl, 1)); bankGeo.setIndex(bi);
  const bank = new THREE.Mesh(bankGeo, new THREE.ShaderMaterial({ name: 'abSprayAndMist', uniforms: { uTime: shared.uTime, uGlowP: shared.uGlowP, uThick: { value: mist ? 1.3 : 1.0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true,
    vertexShader: 'attribute float aEdge, aS, aLay; varying vec3 vW; varying float vE, vS, vLay; void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vE = aEdge; vS = aS; vLay = aLay; gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader: /* glsl */`precision highp float; uniform float uTime, uThick; uniform vec3 uGlowP[3]; varying vec3 vW; varying float vE, vS, vLay;
      ${fx.GLSL_HASH}${fx.GLSL_VALUE_NOISE}${fx.GLSL_FBM}
      ${MIRROR_GLSL}
      void main(){
        float dist = length(vW - cameraPosition), hz = dist*.0005, h = max(-vW.y, 0.), n, a; vec3 c;
        float fl = fwidth(vS);      // the footprint along the edge, taken before the branch
        if(vLay < .5){      // the spray: long soft plumes going down with the water
          vec2 q = vec2(vS*.05, sqrt(h + 3.)*.35 - uTime*.42); n =.6*mix(.5, vnoise(q), clamp(1.5 - fl*.08, 0., 1.)) + .4*mix(.5, vnoise(q*vec2(2.7, 1.9) + 5.3), clamp(1.5 - fl*.22, 0., 1.));
          a = smoothstep(.4, .8, n)*.36; c = vec3(.36, .45, .66)*(.6 + .6*n)*mix(1., .45, smoothstep(30., 320., h));
        } else {            // the mist: soft and slow, sinking at 4 m a second, drifting along the edge
          vec2 q = vec2(vS*.014 + vLay*3.7 + uTime*.0086, vW.y*.009 + uTime*(.034 + .006*vLay)); n = fbm(q + .45*vnoise(q*2.1 - uTime*.02));
          a = smoothstep(.36, .66, n)*(vLay < 1.5 ? .8 : .45); c = vec3(.33, .40, .58)*(.6 + .5*n);
        }
        a *= vE*exp(-hz*hz)*uThick;      // thinned by its own rows (none at its top and bottom) and by air by distance; never by where the eye is
        c += abHue(vW.z*.0031 - uTime*.11)*.16*exp(-abs(vW.x)/55.)*(1. - smoothstep(20., 260., h));      // the bridge's colours near the bridge
        for(int i = 0; i < 3; i++){ vec3 d = uGlowP[i] - vW; c += vec3(.62, .50, .40)*.12/(1. + dot(d, d)/60000.); }      // lit by the gate house and its beam where they are near
        gl_FragColor = vec4(c*a, a);
      }`, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }));
  bank.frustumCulled = false; bank.renderOrder = 1.3; group.add(bank);
  return { object: group, sheet, uniforms, below, bank };
}
