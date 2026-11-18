// "What the Chains Decided" (chains-turned-to-stone), after Antoni Gaudi, 1852 to 1926.
// A market hall of leaning, forking sandstone trunks stands in a still black reservoir; under the water the same
// hall hangs as the chain model it was found from. Viaduct -> level aisle -> helix round one trunk -> up through a
// star throat -> the roof of helmet chimneys -> the dive through a second star -> skim over the chains -> the
// catenary door in the wave wall. Everything is shaded with the hero's style routines (pigment x light rule ->
// inverse tone map), no lights, no fog, no textures.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makePath, makeRng } from '../kit/core.js';
import { buildHero, solveTrees, makeShared, STYLE_GLSL, stoneMaterial, sweepMember, sweepGeometry, toScene, PALETTE, HALL } from '../parts/chains-turned-to-stone.js';

const OZ = 310;                                    // the hall's centre in world z (hero-local z = world z - OZ)
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// the route, in hero-local coordinates (checked against every trunk, branch, twig and the vault shell)
function routePoints(A) {
  const P = [], ax = A.heroTrunk.axisAt;
  const add = (x, y, z) => P.push([x, y, z + OZ]);
  // under the viaduct (three pairs of leaning columns; the lizard is on the last starboard one), a swing out over the
  // open water so the whole hall front is seen three quarters on, then in down the starboard aisle to the hero trunk
  // (x -15, z -108: the trunk the great throat at x 30 throws its disc on)
  add(0, 8.5, -316); add(0, 8.5, -292); add(0, 8.5, -268); add(0.5, 8.5, -247); add(-6, 8.2, -228); add(-17, 7.8, -210);
  add(-22.5, 7.6, -193); add(-26, 8, -176); add(-29, 8.8, -158); add(-29.5, 9.8, -140); add(-29, 10.8, -124);
  // the helix, turning to starboard: 1.07 turns, radius 14 round the leaning axis, 12 -> 35 m. It starts on the aisle
  // side, swings round the back, and comes to look across the hall and down it with the sun behind us
  const N = 12, t0 = 190 / 360, t1 = (190 - 385) / 360;
  for (let i = 0; i <= N; i++) {
    const s = i / N, th = (t0 + (t1 - t0) * s) * Math.PI * 2, y = 12 + 23 * (0.5 * s * s * (3 - 2 * s) + 0.5 * s), c = ax(y);
    add(c.x + Math.cos(th) * 14, y, c.z + Math.sin(th) * 14);
  }
  // up through the great throat at x -30, z -90 at 66 degrees, drifting to starboard and on over the lip; the roof is
  // flown low, 4 m over the collars, so the chimneys stand above the eye and break the horizon
  const dx = -0.5, dz = 0.866, up = (y) => add(-30 + dx * (y - 69) * 0.445, y, -90 + dz * (y - 69) * 0.445);
  add(-23.5, 46, -98.5); up(58); up(69); up(77);
  add(-34.5, 78, -81); add(-34, 76.6, -67); add(-24, 76.2, -49); add(-7.5, 76, -30); add(5.5, 76.5, -11); add(1.5, 87.5, 4.5);
  const dn = (y) => add(0, y, 18 + (69 - y) * 0.53);
  dn(69); dn(58); dn(34); add(0, 13.5, 49.5); add(0, 5.6, 65); add(-4.5, 5, 92); add(-9, 5, 126); add(-4, 5.2, 152);        // the skim weaves between the last trunks
  add(3.5, 6, 174); add(1.2, 7.3, 194); add(0, 8, 211); add(0, 8, 240); add(0, 8, 270);                          // and the mooring posts, then dead straight to the door
  return P;
}

// ---------------------------------------------------------------------------------------------------------------
// BUILT: one material for everything the world adds in brick, lime wash, shard, iron, leaf, awning and timber.
// Attributes: aM = (material, u metres, v metres, ao), aA = (animation kind, weight, phase, direction).
//   material 0 ruled brick (courses along u, 0.3 m apart in v)   1 lime wash   2 shards, all glazes   3 iron
//            4 grey-green leaf   5 awning stripes   6 plain sandstone   7 timber / hull   8 shards, green and ochre
//            9 sack canvas   10 lantern glass (lit from inside, iron ribs)
//   animation 1 leaf stir   2 awning flutter   3 a thing hung from a pivot (weight = metres below it)
const BUILT_VERT = /* glsl */`
  uniform vec3 uOrigin; uniform float uTime, uMir;
  attribute vec4 aM, aA;
  varying vec3 vP, vN; varying vec4 vM;
  void main(){
    vec3 p = position;
    float k = aA.x;
    if (k > 0.5 && k < 1.5) p += vec3(cos(aA.w), 0.35, sin(aA.w))*(aA.y*aA.y*0.22*sin(uTime*1.25 + aA.z) + aA.y*0.05*sin(uTime*3.1 + aA.z*2.3));
    else if (k > 1.5 && k < 2.5) p.y += aA.y*0.16*sin(uTime*2.1 + aA.z + position.x*0.9 + position.z*0.7);
    else if (k > 2.5) p.xz += vec2(cos(aA.w), sin(aA.w))*aA.y*(0.07*sin(uTime*1.15 + aA.z) + 0.025*sin(uTime*2.7 + aA.z*1.9));
    vec4 w = modelMatrix*vec4(p, 1.);
    vP = w.xyz - uOrigin; vN = normalize(mat3(modelMatrix)*normal + vec3(0., 1e-6, 0.)); vM = aM;
    if (uMir < 0.) { float h = max(vP.y, 0.);                 // the image in the water (see the hero's stdVert)
      w.y = uOrigin.y - vP.y;
      w.xz += (0.05 + 0.006*h)*vec2(sin(h*1.9 + uTime*1.7 + w.z*0.21), sin(h*1.3 - uTime*1.3 + w.x*0.17)); }
    gl_Position = projectionMatrix*viewMatrix*w;
  }`;
const BUILT_FRAG = /* glsl */`
  varying vec3 vP, vN; varying vec4 vM;
  ${STYLE_GLSL}
  // one coarser level of brickwork: groups of four courses in two tones, bonded, pale joints (as the vault's)
  vec3 brickLvl(vec2 g, float w, vec3 a, vec3 b, vec3 mor){
    g.x += 0.5*mod(floor(g.y), 2.);
    vec2 c = floor(g); float h = hash21(c*0.73 + 5.);
    vec3 col = mix(a, b, mix(mod(c.y, 2.), step(0.5, h), 0.22))*(0.96 + 0.08*h);
    float dy = 0.5 - abs(fract(g.y) - 0.5), dx = 0.5 - abs(fract(g.x) - 0.5);          // the course lines rule; the upright joints only tick
    return mix(col, mor, max((1. - smoothstep(0.04, 0.041 + w*1.5, dy))*0.8, (1. - smoothstep(0.012, 0.013 + w*0.6, dx))*0.3));
  }
  void main(){
    if (uMir < 0. && vP.y < 0.02) discard;
    vec3 n = vN/max(length(vN), 1e-3);
    if (gl_FrontFacing != (uMir > 0.)) n = -n;
    float mat = floor(vM.x + 0.5), ao = vM.w;
    vec2 uv = vM.yz; vec2 fw = fwidth(uv); float px = max(fw.x, fw.y);
    vec3 D;
    if (mat < 0.5) {                                        // ruled brick: every course a straight line, fanning from the foot
      float fan = 1. + 0.3*(abs(fract(uv.x*0.02706 + 0.25) - 0.5)*4. - 1.);          // straight between the crests of the wall's wave
      float c = uv.y*fan/0.3, wc = fwidth(c), row = floor(c);
      wc = wc > 8. ? 0.05 : wc;
      float b = uv.x/0.62 + 0.5*mod(row, 2.) + 0.2*hash21(vec2(row, 3.)), wb = fwidth(uv.x/0.62);
      float jc = 1. - smoothstep(0.05, 0.051 + wc*1.5, abs(fract(c + 0.5) - 0.5));
      float jb = (1. - smoothstep(0.03, 0.031 + wb*1.5, abs(fract(b + 0.5) - 0.5)))*(1. - smoothstep(0.25, 0.6, wb));
      float tone = hash21(vec2(row, floor(b)));
      vec3 a = mix(uSand, uRed, 0.30), bb = mix(uSand, uRed, 0.10)*1.04, mor = mix(uSand, uWhite, 0.5);
      vec3 brick = mix(a, bb, step(0.5, tone))*(0.93 + 0.14*hash21(vec2(row, floor(b))*1.7));
      vec3 mean = mix(mix(a, bb, 0.5), mor, 0.15);
      vec3 alb = mix(brick, mor, max(jc, jb*0.8)*0.8);
      float w = max(wc, wb*0.25);
      alb = mix(alb, brickLvl(vec2(uv.x/2.48, c/4.), w/4., a, bb, mor), smoothstep(0.16, 0.34, w));
      alb = mix(alb, brickLvl(vec2(uv.x/9.92, c/16.), w/16., a, bb, mor), smoothstep(0.7, 1.4, w));
      alb = mix(alb, mean, smoothstep(4.5, 9., w));
      D = gaudiLight(alb, n, vP, ao);
    } else if (mat < 1.5) {                                 // lime wash, a helical arris drawn where u, v are given
      float wash = vnoise(vP.xz*0.9 + vP.y*0.7)*0.6 + vnoise(vP.xz*3.3 + vP.y*2.1)*0.4;
      float ar = abs(fract(uv.x + 0.5) - 0.5), wa = fwidth(uv.x); wa = wa > 1. ? 0.02 : wa;
      float seen = 1. - smoothstep(0.2, 0.5, wa);
      float line = (1. - smoothstep(0.05, 0.05 + wa*1.5, ar))*seen;                       // the helicoid's arrises, cut dark
      float flute = mix(0.5, ar*2., seen);                                                 // each flute rounds from arris to arris
      float fx = fract(uv.x), face = (smoothstep(0., wa*1.5 + 0.02, fx) - smoothstep(0.5 - wa*1.5, 0.5 + wa*1.5 + 0.02, fx))*seen;   // the face of each flute that looks away from the sun
      float cs = uv.y/0.55, wc = fwidth(cs);
      float course = (1. - smoothstep(0.04, 0.04 + wc*1.5, abs(fract(cs + 0.5) - 0.5)))*(1. - smoothstep(0.2, 0.5, wc));   // brick courses under the wash
      float stain = smoothstep(0.45, 0.8, vnoise(vec2(uv.x*1.7, uv.y*0.25) + 3.));
      vec3 lw = mix(uWhite, uSand, 0.3 + 0.25*stain)*(0.86 + 0.1*wash + 0.1*flute)*(1. - 0.45*line)*(1. - 0.2*course);
      lw = mix(lw, mix(lw*0.66, uCobalt, 0.12), 0.85*face);
      float ndl = dot(n, uSun);
      vec3 fd = vec3(-uSun.x, 0.25, -uSun.z); fd /= max(length(fd), 1e-3);
      vec3 shadeW = mix(lw*(uShade + 0.06), uCobalt, 0.16)*(0.82 + 0.1*n.y + 0.4*dot(n, fd));
      D = mix(shadeW, lw*(0.86 + 0.16*ndl), smoothstep(0.0, 0.3, ndl)*sunVis(vP))*mix(0.8, 1., ao);
    } else if (mat < 2.5 || (mat > 7.5 && mat < 8.5)) {     // shards
      vec3 tilt; vec4 sh = shardAt(uv/0.2, fw/0.2, step(7.5, mat), tilt);
      D = glazeLight(sh, tilt, n, vP, ao);
    } else if (mat < 3.5) {                                 // wrought iron: flat, with the faintest light
      D = uIron*(0.9 + 0.5*clamp(dot(n, uSun), 0., 1.)*sunVis(vP)) + uSand*0.03;
    } else if (mat < 4.5) {                                 // agave and palm: sand cut with shard green, a rib down each leaf
      float rib = 1. - smoothstep(0.0, 0.25, abs(uv.x));
      vec3 alb = mix(mix(uSand, uGreen, 0.42), uIron, 0.22)*(0.82 + 0.3*uv.y)*(1. - 0.2*rib);
      D = gaudiLight(alb, n, vP, ao);
    } else if (mat < 5.5) {                                 // awning: white and cobalt stripes
      float s = uv.x/0.7, ws = fwidth(s);
      float st = smoothstep(0.25 - ws, 0.25 + ws, abs(fract(s) - 0.5));
      D = gaudiLight(mix(ao < 0.5 ? mix(uOchre, uRed, 0.25) : uCobalt, uWhite, st)*0.96, n, vP, 1.);
    } else if (mat < 6.5) {                                 // plain sandstone, drum joints 1.2 m
      float d = uv.y/1.2, wd = fwidth(d);
      float joint = (1. - smoothstep(0.012, 0.014 + wd, abs(fract(d + 0.5) - 0.5)))*(1. - smoothstep(0.2, 0.45, wd));
      float grain = vnoise(vP.xz*2.3 + vP.y*vec2(1.7, 2.9)) - 0.5;
      D = gaudiLight(uSand*(0.97 + 0.08*grain + 0.06*hash21(vec2(floor(d + 0.5), floor(uv.x/2.)))) * (1. - 0.24*joint), n, vP, ao);
    } else if (mat > 9.5) {                                 // lantern glass: eight panes lit from inside between iron ribs
      float pn = uv.x*1.27324, wp = fwidth(pn); wp = wp > 2. ? 0.02 : wp;
      float rib = (1. - smoothstep(0.07, 0.07 + wp*1.5, abs(fract(pn + 0.5) - 0.5)))*(1. - smoothstep(0.3, 0.7, wp));
      float hp = hash21(vec2(floor(pn + 0.5), floor(vP.z/9.)));
      float core = clamp(1. - abs(fract(pn + 0.5) - 0.5)*1.6, 0., 1.)*clamp(1. - abs(uv.y + 1.2)/1.1, 0., 1.);
      vec3 pane = mix(mix(mix(uOchre, uRed, 0.12), mix(uOchre, uWhite, 0.75), core), mix(uOchre, uRed, 0.4), step(0.8, hp)*0.5);
      D = mix(pane*(0.86 + 0.14*uLamp + 0.1*sin(uTime*1.7 + vP.z)), uIron, rib*0.9);
    } else if (mat > 8.5) {                                 // sack canvas
      D = gaudiLight(mix(uOchre, uSand, 0.3)*(0.92 + 0.08*sin(uv.y*60.)*(1. - smoothstep(0.02, 0.06, px))), n, vP, ao);
    } else {                                                // timber and hulls: sand cut with iron, planks along u
      float pl = uv.y/0.35, wp = fwidth(pl);
      float seam = (1. - smoothstep(0.04, 0.04 + wp*1.5, abs(fract(pl + 0.5) - 0.5)))*(1. - smoothstep(0.25, 0.6, wp));
      D = gaudiLight(mix(uSand, uIron, 0.5)*(0.9 + 0.2*hash21(vec2(floor(pl + 0.5), 1.)))*(1. - 0.3*seam), n, vP, ao);
    }
    gl_FragColor = vec4(toScene(mirTone(D, vP.y)), 1.);
  }`;
function builtMaterial(shared, mirror) {
  return new THREE.ShaderMaterial({ uniforms: mirror ? { ...shared, uMir: { value: -1 } } : shared, vertexShader: BUILT_VERT, fragmentShader: BUILT_FRAG, side: THREE.DoubleSide });
}

// A geometry accumulator: non-indexed triangles with flat or smooth normals worked out here.
function makeG() { return { pos: [], nor: [], am: [], aa: [] }; }
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3(), _e = new THREE.Vector3();
// v = { p: Vector3, u, v, ao?, n?: Vector3, an?: [kind, weight, phase, dir] }
function tri(G, mat, A, B, C) {
  _a.subVectors(B.p, A.p); _b.subVectors(C.p, A.p); _c.crossVectors(_a, _b);
  if (_c.lengthSq() < 1e-12) return;
  _c.normalize();
  for (const q of [A, B, C]) {
    const n = q.n || _c, an = q.an;
    G.pos.push(q.p.x, q.p.y, q.p.z); G.nor.push(n.x, n.y, n.z); G.am.push(mat, q.u || 0, q.v || 0, q.ao ?? 1);
    if (an) G.aa.push(an[0], an[1], an[2], an[3]); else G.aa.push(0, 0, 0, 0);
  }
}
function quad(G, mat, A, B, C, D) { tri(G, mat, A, B, C); tri(G, mat, A, C, D); }
// a grid of vertices rows[m][j] -> quads; smooth normals from the grid itself when smooth is true
function grid(G, mat, rows, smooth, closed) {
  const M = rows.length, N = rows[0].length;
  if (smooth) for (let m = 0; m < M; m++) for (let j = 0; j < N; j++) {
    const jp = closed ? (j + 1) % N : Math.min(j + 1, N - 1), jm = closed ? (j + N - 1) % N : Math.max(j - 1, 0);
    _a.subVectors(rows[m][jp].p, rows[m][jm].p); _b.subVectors(rows[Math.min(m + 1, M - 1)][j].p, rows[Math.max(m - 1, 0)][j].p);
    const n = new THREE.Vector3().crossVectors(_b, _a);
    rows[m][j].n = n.lengthSq() > 1e-12 ? n.normalize() : new THREE.Vector3(0, 1, 0);
  }
  for (let m = 0; m < M - 1; m++) for (let j = 0; j < (closed ? N : N - 1); j++) {
    const j1 = (j + 1) % N;
    quad(G, mat, rows[m][j], rows[m + 1][j], rows[m + 1][j1], rows[m][j1]);
  }
}
function finishG(G) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(G.nor, 3));
  g.setAttribute('aM', new THREE.Float32BufferAttribute(G.am, 4));
  g.setAttribute('aA', new THREE.Float32BufferAttribute(G.aa, 4));
  g.computeBoundingSphere();
  return g;
}
// the same for the one big mesh, in short steps (it is never culled, so its sphere is simply given)
async function finishBig(G, pause) {
  const g = new THREE.BufferGeometry();
  const typed = async (src) => { const out = new Float32Array(src.length);             // a plain array -> a typed one, 150k numbers a step
    for (let o = 0; o < src.length; o += 150000) { const e = Math.min(o + 150000, src.length); for (let i = o; i < e; i++) out[i] = src[i]; await pause(); }
    return out; };
  g.setAttribute('position', new THREE.BufferAttribute(await typed(G.pos), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(await typed(G.nor), 3));
  g.setAttribute('aM', new THREE.BufferAttribute(await typed(G.am), 4));
  g.setAttribute('aA', new THREE.BufferAttribute(await typed(G.aa), 4)); await pause();
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, 0), 1200);
  return g;
}

// ---------------------------------------------------------------------------------------------------------------
// THE SKY: a dome graded from the zenith colour to the horizon colour, six authored flat-bottomed clouds drifting
// to starboard, low hills closing the reservoir, the far water's sheen below the horizon. Display colours -> toScene.
function skyMaterial(shared, U, mirror) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uMirS: { value: mirror ? 1 : 0 }, uZen: { value: U.zen }, uHor: { value: U.hor }, uCloud: { value: U.cloud }, uCloudAmt: { value: U.cloudAmt },
      uHill: { value: U.hill }, uSea: { value: U.sea }, uDisc: { value: U.disc }, uClouds: { value: U.clouds } },
    side: THREE.BackSide, depthWrite: !!mirror, depthTest: !!mirror,
    vertexShader: mirror ? /* glsl */`
      varying vec3 vD;
      void main(){ vec4 w = modelMatrix*vec4(position, 1.); vD = w.xyz - cameraPosition; gl_Position = projectionMatrix*viewMatrix*w; }` : /* glsl */`
      varying vec3 vD;
      void main(){ vD = position; vec4 p = projectionMatrix*viewMatrix*modelMatrix*vec4(position, 1.);
        if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */`
      varying vec3 vD;
      uniform vec3 uZen, uHor, uCloud, uHill, uSea; uniform float uCloudAmt, uMirS; uniform vec4 uDisc; uniform vec4 uClouds[6];
      ${STYLE_GLSL}
      float n1(float x){ float i = floor(x), f = fract(x); f = f*f*(3. - 2.*f); return mix(hash21(vec2(i, 7.)), hash21(vec2(i + 1., 7.)), f); }
      void main(){
        vec3 d = vD/max(length(vD), 1e-3);
        if (uMirS > 0.5) { d.y = abs(d.y); d.x += 0.012*sin(d.y*70. + uTime*1.4)*smoothstep(0., 0.05, d.y); }     // the sky's image, trembling
        float e = d.y, az = atan(d.x, d.z + 1e-5);
        float g = sqrt(clamp(e, 0., 1.));
        vec3 c = mix(uHor, uZen, smoothstep(0., 1., g*1.15));
        float px = fwidth(e)*1.5 + 1e-4;
        // the sun or the moon: a plain disc, never ahead of the course
        float sd = 1. - dot(d, uSun);
        c = mix(c, uDisc.rgb, uDisc.a*(1. - smoothstep(0.0006, 0.0009, sd)) + uDisc.a*0.25*(1. - smoothstep(0., 0.02, sd)));
        // six flat-bottomed clouds, authored: (azimuth, base elevation, half width, height)
        float cl = 0., shadeC = 0.;
        for (int i = 0; i < 6; i++) {
          vec4 q = uClouds[i];
          float x = az - q.x + uTime*0.011; x = mod(x + 3.14159265, 6.2831853) - 3.14159265;
          float t = x/max(q.z, 1e-3), y = e - q.y, top = 0.;
          for (int k = 0; k < 4; k++) {
            float fk = float(k), cx = -0.66 + 0.44*fk + 0.1*sin(q.x*7. + fk*2.1), r = 0.34 + 0.1*sin(q.x*3. + fk*1.3), hk = 0.6 + 0.4*sin(q.x*5. + fk*2.9)*sin(q.x*5. + fk*2.9);
            float s = 1. - (t - cx)*(t - cx)/(r*r);
            top = max(top, hk*sqrt(max(s, 0.)));
          }
          float inside = smoothstep(0., px, y)*smoothstep(0., px*2., top*q.w - y)*step(0.001, top);
          if (inside > cl) { cl = inside; shadeC = clamp(1. - y/max(q.w, 1e-3), 0., 1.); }
        }
        c = mix(c, mix(uCloud, uHor, 0.5*shadeC*shadeC), cl*uCloudAmt);
        // low hills 1.5 km off, two ranks, sand greyed with green
        float h1 = 0.010 + 0.018*n1(az*5. + 3.) + 0.008*n1(az*17.), h2 = 0.004 + 0.012*n1(az*9. + 11.) + 0.004*n1(az*31.);
        c = mix(c, mix(uHill, uHor, 0.5), 1. - smoothstep(h1 - px, h1 + px, e));
        c = mix(c, mix(uHill, uHor, 0.2), 1. - smoothstep(h2 - px, h2 + px, e));
        c = mix(c, uSea, (1. - smoothstep(-px, px, e))*(1. - uMirS));
        if (uMirS > 0.5) c = mix(mix(uIron*1.15, uCobalt, 0.22*uSteep), c, 0.64*(1. - 0.6*uSteep));
        gl_FragColor = vec4(toScene(c), 1.);
      }`,
  });
}

// SWIFTS: black sickles, instanced; wings flicker and glide in the vertex shader; never smaller than a few pixels.
function swiftGeometry() {
  // forward +Z, span along X (0.42 m), 12 triangles: two swept wings of three panels each, body, forked tail
  const P = [], W = [];
  const wing = (s) => { const pts = [[0.012, 0.045], [0.07, 0.05], [0.14, 0.0], [0.21, -0.1]], back = [[0.012, -0.03], [0.07, -0.005], [0.14, -0.04], [0.21, -0.1]];
    for (let i = 0; i < 3; i++) { const a = pts[i], b = pts[i + 1], c = back[i], d = back[i + 1];
      P.push(s * a[0], 0, a[1], s * b[0], 0, b[1], s * c[0], 0, c[1]); W.push(a[0], b[0], c[0]);
      if (i < 2) { P.push(s * b[0], 0, b[1], s * d[0], 0, d[1], s * c[0], 0, c[1]); W.push(b[0], d[0], c[0]); } } };
  wing(1); wing(-1);
  P.push(-0.014, 0, 0.05, 0.014, 0, 0.05, 0, 0, 0.1); W.push(0, 0, 0);
  P.push(-0.014, 0, 0.05, 0.014, 0, 0.05, 0, 0, -0.06); W.push(0, 0, 0);
  P.push(0, 0, -0.03, -0.035, 0, -0.14, -0.004, 0, -0.07); W.push(0, 0, 0);
  P.push(0, 0, -0.03, 0.035, 0, -0.14, 0.004, 0, -0.07); W.push(0, 0, 0);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 1));
  return g;
}
function swiftMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uPx: { value: 0.0025 } }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      uniform float uTime, uPx;
      attribute float aW, aPh;
      void main(){
        vec4 o = modelMatrix*instanceMatrix*vec4(0., 0., 0., 1.);
        float dist = length(cameraPosition - o.xyz);
        float beat = sin(uTime*(19. + 5.*fract(aPh*0.37)) + aPh), glide = smoothstep(-0.2, 0.3, sin(uTime*(0.9 + 0.4*fract(aPh*0.71)) + aPh*1.7));
        vec3 p = position;
        float ang = (0.75*beat*glide - 0.12)*smoothstep(0., 0.05, aW);
        p.y += aW*sin(ang)*2.2; p.x *= mix(1., cos(ang), 0.6);
        p *= max(1., dist*uPx/0.42);
        gl_Position = projectionMatrix*viewMatrix*modelMatrix*instanceMatrix*vec4(p, 1.);
      }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL}
      void main(){ gl_FragColor = vec4(toScene(uIron), 1.); }`,
  });
}
// the lizard's thread of water: a thin tube whose brightness runs along it
function threadMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: shared,
    vertexShader: /* glsl */`
      uniform float uTime; varying float vS;
      void main(){ vS = uv.x; vec3 p = position; p.x += 0.02*sin(uTime*7. + uv.x*9.)*uv.x; gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(p, 1.); }`,
    fragmentShader: /* glsl */`
      varying float vS;
      ${STYLE_GLSL}
      void main(){ float run = 0.5 + 0.5*sin(vS*42. - uTime*17.) ; gl_FragColor = vec4(toScene(mix(mix(uWhite, uCobalt, 0.3), uWhite, run)), 1.); }`,
  });
}
// chimney smoke: flat lime-white puffs, flat-bottomed like the clouds, rising and drifting to starboard
function puffMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: shared,
    vertexShader: /* glsl */`
      uniform float uTime;
      attribute vec4 aS; attribute float aPh;          // chimney top (world), drift phase; place in the train 0..1
      varying vec2 vQ; varying float vT;
      void main(){
        float t = fract(uTime*0.16 + aPh);
        vec3 c = aS.xyz + vec3(-(1.5*t + 5.5*t*t) + 0.5*sin(t*9. + aS.w), 0.6 + 8.5*t, 0.6*sin(t*6. + aS.w*1.7));
        float sz = mix(0.22, 0.9, sqrt(t))*(1. - smoothstep(0.72, 1., t));
        vec4 v = viewMatrix*vec4(c, 1.); v.xy += position.xy*sz;
        vQ = position.xy; vT = t;
        gl_Position = projectionMatrix*v;
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying float vT;
      ${STYLE_GLSL}
      void main(){
        float bump = max(max(1. - length(vQ - vec2(-0.38, -0.1))/0.55, 1. - length(vQ - vec2(0.36, -0.14))/0.5), 1. - length(vQ - vec2(0., 0.16))/0.72);
        if (bump < 0. || vQ.y < -0.42) discard;
        gl_FragColor = vec4(toScene(mix(uWhite, uCobalt, 0.1 + 0.12*(1. - smoothstep(-0.42, 0.1, vQ.y)))*mix(0.86, 0.97, uSunOn)), 1.);
      }`,
  });
}
// ripple rings on the black water: instanced quads, a ring that widens and fades, fwidth-filtered
function ringMaterial(shared, uAmt) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uAmt }, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      uniform float uTime; uniform vec3 uOrigin;
      attribute vec4 aR;                    // x, z (world), period s, largest radius m
      attribute float aPh;
      varying vec2 vQ; varying float vT, vR;
      void main(){
        float t = fract(uTime/max(aR.z, 0.2) + aPh);
        vT = t; vR = aR.w; vQ = position.xz;
        vec3 p = vec3(aR.x + position.x*aR.w, 0.04, aR.y + position.z*aR.w);
        gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying float vT, vR;
      uniform float uAmt;
      ${STYLE_GLSL}
      void main(){
        float r = length(vQ), w = fwidth(r) + 1e-4;
        float a = 0., k = 0.;
        float lw = max(0.11/max(vR, 0.1), w*1.6), fadeT = (1. - vT)*(1. - vT*0.5);
        float r0 = vT*0.95, r1 = max(vT - 0.2, 0.)*0.95, r2 = max(vT - 0.4, 0.)*0.95, r3 = max(vT - 0.6, 0.)*0.95;
        a += (1. - smoothstep(lw*0.5, lw, abs(r - r0)));                       k += 1. - smoothstep(lw*0.5, lw, abs(r - r0 + lw*1.7));
        a += 0.75*(1. - smoothstep(lw*0.5, lw, abs(r - r1)))*step(0.2, vT);    k += 0.75*(1. - smoothstep(lw*0.5, lw, abs(r - r1 + lw*1.7)))*step(0.2, vT);
        a += 0.55*(1. - smoothstep(lw*0.5, lw, abs(r - r2)))*step(0.4, vT);    k += 0.55*(1. - smoothstep(lw*0.5, lw, abs(r - r2 + lw*1.7)))*step(0.4, vT);
        a += 0.4*(1. - smoothstep(lw*0.5, lw, abs(r - r3)))*step(0.6, vT);
        float keep = (1. - smoothstep(0.7, 1.8, w*8.))*uAmt*fadeT;                 // too small to draw as rings: let it go
        a = clamp(a, 0., 1.)*keep; k = clamp(k, 0., 1.)*keep*(1. - a);
        if (a + k < 0.01) discard;
        vec3 crest = mix(mix(uCobalt, uWhite, 0.5), uWhite, 0.45), trough = uIron*0.9;
        gl_FragColor = vec4(toScene(mix(trough, crest, a/max(a + k, 1e-3))), clamp(a*0.92 + k*0.7, 0., 1.));
      }`,
  });
}

// ---------------------------------------------------------------------------------------------------------------
// BUILDERS (all append to a G accumulator in the caller's coordinates)
const vtx = (p, u, v, ao, an) => ({ p, u, v, ao, an });
// a turned form about a (possibly leaning) axis: prof = [[radius, height], ...]; sec(theta, k01) scales the radius
function lathe(G, mat, base, prof, n, o = {}) {
  const rows = [], lean = o.lean || [0, 0], us = o.uScale ?? 1;
  for (let m = 0; m < prof.length; m++) {
    const [r, y] = prof[m], k = m / (prof.length - 1), tw = (o.twist || 0) * k, row = [];
    for (let j = 0; j < n; j++) {
      const th = j / n * Math.PI * 2, rr = r * (o.sec ? o.sec(th - tw, k) : 1);
      const u = o.arris ? (th - tw) * o.arris / (Math.PI * 2) : th * (o.uConst ?? Math.max(r, 0.3)) * us;
      row.push(vtx(V3(base.x + Math.cos(th) * rr + lean[0] * y, base.y + y, base.z + Math.sin(th) * rr + lean[1] * y), u, y * us, o.ao ?? 1));
    }
    if (!o.arris) row.push({ ...row[0], u: Math.PI * 2 * (o.uConst ?? Math.max(r, 0.3)) * us }); else row.push({ ...row[0], u: row[0].u + o.arris });
    rows.push(row);
  }
  grid(G, mat, rows, o.smooth !== false, false);
}
function box(G, mat, c, sx, sy, sz, rotY = 0, ao = 1) {
  const cs = Math.cos(rotY), sn = Math.sin(rotY);
  const P = (x, y, z) => V3(c.x + (x * cs + z * sn) * sx / 2, c.y + y * sy / 2, c.z + (-x * sn + z * cs) * sz / 2);
  const F = [[[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]], [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]],
    [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]]];
  for (const f of F) { const q = f.map((k, i) => vtx(P(k[0], k[1], k[2]), (i === 1 || i === 2) ? Math.max(sx, sz) : 0, (i >= 2) ? sy : 0, ao)); quad(G, mat, q[0], q[1], q[2], q[3]); }
}
// a chimney: a twisted (helicoid) lime-washed shaft under a shard cap. cast 0 = helmet, 1 = twisted cone under a mushroom
function chimney(G, base, h, rng, cast) {
  const R = rng.range(0.8, 1.05), turn = rng.range(0.9, 1.7) * (rng.chance(0.5) ? 1 : -1) * Math.PI, lean = [rng.range(-0.035, 0.035), rng.range(-0.035, 0.035)];
  const lobes = rng.pick([3, 4, 4, 5]), sh = h - (cast ? 1.5 : 3.4), prof = [];
  for (let i = 0; i <= 9; i++) { const k = i / 9;
    prof.push([cast ? R * lerp(1.45, 0.5, Math.pow(k, 0.8)) : R * (1.12 - 0.34 * k + 0.22 * Math.pow(1 - k, 6) + 0.06 * Math.pow(k, 5)), -0.6 + (sh + 0.6) * k]); }
  lathe(G, 1, base, prof, 14, { twist: turn, lean, arris: lobes, sec: (th, k) => 1 + (cast ? 0.2 : 0.24) * Math.cos(th * lobes) });
  const top = V3(base.x + lean[0] * sh, base.y + sh, base.z + lean[1] * sh);
  if (!cast) {          // the helmet: a flared visor, a heavy four-sided brow, a pointed crown that leans; four dark eye slots
    const r = R * 0.92, hp = [[r * 0.8, -0.25], [r * 0.95, 0.05], [r * 1.56, 0.38], [r * 1.74, 0.85], [r * 1.68, 1.4], [r * 1.4, 1.95], [r * 1.02, 2.5], [r * 0.64, 3.0], [r * 0.3, 3.4], [0.02, 3.66]];
    const a0 = rng.range(0, 6.283), lz = [lean[0] * 3 + rng.range(-0.05, 0.05), lean[1] * 3 + rng.range(-0.05, 0.05)];
    const sec = (th, k) => 1 + 0.1 * Math.cos((th - a0) * 4) * (1 - k * k);
    lathe(G, 2, top, hp, 18, { uScale: 0.95, uConst: r * 1.3, lean: lz, sec });
    for (let e = 0; e < 4; e++) { const a = a0 + Math.PI / 4 + e * Math.PI / 2, t = V3(-Math.sin(a), 0, Math.cos(a));
      const at = (x, y, rr) => vtx(V3(top.x + lz[0] * y + Math.cos(a) * rr + t.x * x, top.y + y, top.z + lz[1] * y + Math.sin(a) * rr + t.z * x), 0, 0, 1);
      const r0 = r * 1.74 * 0.93 + 0.05, r1 = r * 1.6 * 0.93 + 0.05;
      quad(G, 3, at(-0.24 * r, 0.8, r0), at(0.24 * r, 0.8, r0), at(0.15 * r, 1.62, r1), at(-0.15 * r, 1.62, r1)); }
    lathe(G, 8, V3(top.x + lz[0] * 3.6, top.y + 3.6, top.z + lz[1] * 3.6), [[0.12, 0], [0.24, 0.16], [0.14, 0.36], [0.02, 0.44]], 6, { uScale: 0.68 });
  } else {              // the mushroom: a shard dome with a rolled edge on the twisted cone
    const r = R * rng.range(1.35, 1.75), hp = [[R * 0.5, -0.05], [r * 0.98, 0.0], [r * 1.08, 0.22], [r * 0.97, 0.6], [r * 0.72, 1.0], [r * 0.38, 1.3], [0.02, 1.42]];
    lathe(G, 2, top, hp, 16, { uScale: 0.95, uConst: r, lean: [lean[0] * 2, lean[1] * 2] });
    lathe(G, 8, V3(top.x, top.y + 1.38, top.z), [[0.24, 0], [0.3, 0.2], [0.16, 0.42], [0.02, 0.5]], 6, {});
  }
}
// a stone planter with a shard band, holding an agave (kind 0) or a dwarf fan palm (kind 1); leaves stir
function planter(G, at, kind, rng, sc = 1) {
  lathe(G, 6, at, [[0.5 * sc, 0], [0.82 * sc, 0.34 * sc], [0.92 * sc, 0.7 * sc], [0.8 * sc, 0.86 * sc]], 9, {});
  lathe(G, 2, V3(at.x, at.y + 0.52 * sc, at.z), [[0.9 * sc, 0], [0.95 * sc, 0.2 * sc]], 9, {});
  const c = V3(at.x, at.y + 0.8 * sc, at.z), ph0 = rng.range(0, 6.283);
  if (kind === 0) {
    const nL = 13;
    for (let i = 0; i < nL; i++) {
      const az = i * 2.399 + rng.range(-0.2, 0.2), el = lerp(1.35, 0.25, Math.pow(i / (nL - 1), 0.7)), L = sc * rng.range(1.5, 2.1) * (0.75 + 0.25 * Math.sin(el));
      const dir = V3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)), side = V3(-Math.sin(az), 0, Math.cos(az));
      let prev = null;
      for (let s = 0; s <= 4; s++) {
        const k = s / 4, w = 0.2 * sc * (1 - k) * (0.6 + 1.2 * k * (1 - k) * 2 + 0.4), droop = -0.55 * k * k * L * Math.cos(el);
        const mid = V3(c.x + dir.x * L * k, c.y + dir.y * L * k + droop, c.z + dir.z * L * k), an = [1, k, ph0 + i, az];
        const cur = [vtx(mid.clone().addScaledVector(side, -w).setY(mid.y + w * 0.5), -1, k, 1, an), vtx(mid, 0, k, 1, an), vtx(mid.clone().addScaledVector(side, w).setY(mid.y + w * 0.5), 1, k, 1, an)];
        if (prev) { quad(G, 4, prev[0], prev[1], cur[1], cur[0]); quad(G, 4, prev[1], prev[2], cur[2], cur[1]); }
        prev = cur;
      }
    }
  } else {
    for (let f = 0; f < 6; f++) {
      const az = f * 1.047 + rng.range(-0.3, 0.3), el = rng.range(0.5, 1.2), L = sc * rng.range(0.9, 1.4);
      const dir = V3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)), side = V3(-Math.sin(az), 0, Math.cos(az)), upv = V3().crossVectors(side, dir);
      const hub = c.clone().addScaledVector(dir, L), an0 = [1, 0.5, ph0 + f, az];
      quad(G, 4, vtx(c.clone().addScaledVector(side, -0.04), 0, 0, 1), vtx(c.clone().addScaledVector(side, 0.04), 0, 0, 1), vtx(hub.clone().addScaledVector(side, 0.04), 0, 0.5, 1, an0), vtx(hub.clone().addScaledVector(side, -0.04), 0, 0.5, 1, an0));
      const nB = 9, Rf = sc * 1.1;
      for (let b = 0; b < nB; b++) {
        const a0 = -1.25 + 2.5 * b / nB, a1 = a0 + 2.5 / nB * 0.8, an = [1, 1, ph0 + f, az];
        const tip = (a) => hub.clone().addScaledVector(side, Math.sin(a) * Rf).addScaledVector(dir, Math.cos(a) * Rf * 0.9).addScaledVector(upv, -0.25 * Rf * Math.abs(Math.sin(a)));
        tri(G, 4, vtx(hub, 0, 0.4, 1, an0), vtx(tip(a0), -1, 1, 1, an), vtx(tip((a0 + a1) / 2).addScaledVector(upv, 0.07), 0, 1, 1, an));
        tri(G, 4, vtx(hub, 0, 0.4, 1, an0), vtx(tip((a0 + a1) / 2).addScaledVector(upv, 0.07), 0, 1, 1, an), vtx(tip(a1), 1, 1, 1, an));
      }
    }
  }
}
// an iron fan-palm leaf: ribbed black blades radiating from a hub (the door's folded leaves)
function ironFan(G, hub, dir, side, Rf, nB, spread) {
  const nrm = V3().crossVectors(side, dir).normalize();
  for (let b = 0; b < nB; b++) {
    const a = -spread + 2 * spread * (b + 0.5) / nB, w = spread / nB * 0.72;
    const tip = (aa, r) => hub.clone().addScaledVector(side, Math.sin(aa) * r).addScaledVector(dir, Math.cos(aa) * r);
    const m = tip(a, Rf * 0.6).addScaledVector(nrm, 0.12);                       // each blade is folded along its rib
    quad(G, 3, vtx(hub, 0, 0, 1), vtx(tip(a - w, Rf * 0.62), 0, 0, 1), vtx(tip(a, Rf), 0, 0, 1), vtx(m, 0, 0, 1));
    quad(G, 3, vtx(hub, 0, 0, 1), vtx(m, 0, 0, 1), vtx(tip(a, Rf), 0, 0, 1), vtx(tip(a + w, Rf * 0.62), 0, 0, 1));
  }
  lathe(G, 3, hub.clone().addScaledVector(nrm, -0.1), [[0.02, 0], [0.26, 0.05], [0.2, 0.22], [0.02, 0.3]], 7, {});
}
// a lantern on an iron fan-palm leaf that springs from a column toward the aisle: the leaf is fixed, the lantern
// hangs from its tip on a link and swings (animation 3)
function lantern(G, at, out, rng, sc = 1) {
  const hub = at.clone().addScaledVector(out, 0), dir = out.clone().multiplyScalar(0.75).add(V3(0, 0.66, 0)).normalize(), side = V3(-out.z, 0, out.x);
  ironFan(G, hub, dir, side, 3.0 * sc, 11, 1.05);
  const tip = hub.clone().addScaledVector(dir, 3.0 * sc), n0 = G.aa.length / 4, ph = rng.range(0, 6.283), sw = rng.range(0, 6.283);
  box(G, 3, V3(tip.x, tip.y - 0.4 * sc, tip.z), 0.12 * sc, 0.8 * sc, 0.12 * sc);
  const top = V3(tip.x, tip.y - 0.75 * sc, tip.z);
  lathe(G, 3, top, [[0.05 * sc, 0.12 * sc], [0.34 * sc, 0.0], [0.82 * sc, -0.3 * sc], [0.86 * sc, -0.42 * sc]], 8, { smooth: false });
  lathe(G, 10, top, [[0.74 * sc, -0.42 * sc], [0.8 * sc, -1.0 * sc], [0.62 * sc, -1.7 * sc], [0.3 * sc, -2.15 * sc]], 8, { uConst: 1, ao: 0.6, smooth: false });
  lathe(G, 3, top, [[0.34 * sc, -2.12 * sc], [0.2 * sc, -2.4 * sc], [0.02, -2.75 * sc]], 6, { smooth: false });
  for (let i = n0; i < G.aa.length / 4; i++) { G.aa[i * 4] = 3; G.aa[i * 4 + 1] = Math.max(tip.y - G.pos[i * 3 + 1], 0); G.aa[i * 4 + 2] = ph; G.aa[i * 4 + 3] = sw; }
}
// a flat market barge, bow toward +Z: timber hull, a striped awning on four posts, heaps of produce, and one small
// standing figure at the stern seen as a dark shape under a wide hat, poling
function barge(G, rng) {
  const L = rng.range(8.5, 11), W = rng.range(2.5, 3.1), rows = [];
  for (let i = 0; i <= 8; i++) {
    const k = i / 8, z = (k - 0.5) * L, e = Math.pow(Math.abs(k - 0.5) * 2, 3), w = W / 2 * (1 - 0.45 * e), y0 = -0.25 + 0.75 * e, y1 = 0.55 + 0.5 * e;
    rows.push([vtx(V3(-w * 0.8, y0, z), z, 0, 0.8), vtx(V3(-w, y1, z), z, 0.9, 1), vtx(V3(-w * 0.86, y1, z), z, 1.1, 1), vtx(V3(-w * 0.8, y0 + 0.3, z), z, 1.6, 0.8),
      vtx(V3(w * 0.8, y0 + 0.3, z), z, 1.6 + w, 0.8), vtx(V3(w * 0.86, y1, z), z, 2.1 + w, 1), vtx(V3(w, y1, z), z, 2.3 + w, 1), vtx(V3(w * 0.8, y0, z), z, 3.2 + w, 0.8)]);
  }
  grid(G, 7, rows, false, false);
  const aw = L * 0.42, ah = rng.range(2.3, 2.8), az = rng.range(-0.5, 0.8), ph = rng.range(0, 6.283);
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) box(G, 3, V3(sx * W * 0.4, ah / 2 + 0.1, az + sz * aw / 2), 0.09, ah, 0.09);
  const can = [];
  for (let i = 0; i <= 6; i++) { const row = [];
    for (let j = 0; j <= 4; j++) { const kx = j / 4 - 0.5, kz = i / 6 - 0.5, edge = Math.max(Math.abs(kx), Math.abs(kz)) * 2;
      row.push(vtx(V3(kx * W * 0.98, ah + 0.2 + 0.35 * (1 - 4 * kx * kx) - 0.12 * Math.sin(i * Math.PI) , az + kz * aw * 1.15), kz * aw * 1.15, kx * W, 1, [2, 1 - 0.6 * edge * edge * (Math.abs(kx) > 0.49 && Math.abs(kz) > 0.49 ? 1.6 : 1), ph, 0])); }
    can.push(row); }
  grid(G, 5, can, false, false);
  for (let i = 0; i < 5; i++) {       // produce: low heaps in sand, ochre canvas and leaf green
    const c = V3(rng.range(-0.6, 0.6), 0.3, az + rng.range(-aw * 0.45, aw * 0.45)), r = rng.range(0.4, 0.75);
    lathe(G, rng.pick([6, 6, 4, 7]), c, [[r, 0], [r * 0.9, r * 0.45], [r * 0.5, r * 0.8], [0.02, r * 0.9]], 6, {});
  }
  const fz = -L * 0.36, f = V3(rng.range(-0.3, 0.3), 0.85, fz);
  lathe(G, 3, f, [[0.2, 0], [0.24, 0.5], [0.3, 1.25], [0.14, 1.45], [0.13, 1.7]], 6, {});
  lathe(G, 6, V3(f.x, f.y + 1.62, f.z), [[0.5, 0], [0.3, 0.1], [0.04, 0.26]], 8, {});
  const p0 = V3(f.x + 0.35, f.y + 2.6, fz + 0.5), p1 = V3(f.x + 0.75, -1.2, fz - 1.9), mid = p0.clone().lerp(p1, 0.5), len = p0.distanceTo(p1);
  // the pole: a thin iron box laid along p0 -> p1
  const d = p1.clone().sub(p0).normalize(), s1 = V3().crossVectors(d, V3(1, 0, 0)).normalize().multiplyScalar(0.06), s2 = V3().crossVectors(d, s1).normalize().multiplyScalar(0.06);
  const ring = (c) => [c.clone().add(s1), c.clone().add(s2), c.clone().sub(s1), c.clone().sub(s2)].map((p) => vtx(p, 0, 0, 1));
  const r0 = ring(p0), r1 = ring(p1);
  for (let j = 0; j < 4; j++) quad(G, 3, r0[j], r1[j], r1[(j + 1) % 4], r0[(j + 1) % 4]);
  return { L, W, mid, len };
}
// the lizard at true size, 2.4 m, skinned in shards, head down (local -Y), belly toward -X, back toward +X
function lizard(G) {
  const spine = [], N = 22, Ltot = 2.4;
  for (let i = 0; i <= N; i++) { const k = i / N; spine.push(V3(0.2 + 0.05 * Math.sin(k * 3.1), -0.15 + Ltot * k - 1.0, 0.2 * Math.sin(k * 6.5 + 0.4) * (0.4 + k))); }
  const rad = (k) => k < 0.08 ? lerp(0.07, 0.17, k / 0.08) : k < 0.2 ? lerp(0.17, 0.13, (k - 0.08) / 0.12) : k < 0.5 ? 0.13 + 0.12 * Math.sin((k - 0.2) / 0.3 * Math.PI) : lerp(0.13, 0.015, Math.pow((k - 0.5) / 0.5, 0.8));
  const rows = [];
  for (let i = 0; i <= N; i++) {
    const k = i / N, c = spine[i], t = spine[Math.min(i + 1, N)].clone().sub(spine[Math.max(i - 1, 0)]).normalize(), sx = V3(1, 0, 0), sz = V3().crossVectors(t, sx).normalize(), r = rad(k), row = [];
    sx.crossVectors(sz, t).normalize();
    for (let j = 0; j <= 8; j++) { const th = j / 8 * Math.PI * 2, cr = Math.cos(th), sr = Math.sin(th);
      // flattened below, a crest along the back
      const out = cr > 0 ? 1 + 0.25 * Math.pow(cr, 6) : 0.75;
      row.push(vtx(c.clone().addScaledVector(sx, cr * r * out * 1.3).addScaledVector(sz, sr * r * 1.7), th * 0.3, k * Ltot * 0.9, 1)); }
    rows.push(row);
  }
  grid(G, 2, rows, true, false);
  // four legs gripping the stone: thigh out sideways, shin back to the column, a splayed foot
  for (const [k, s, fwd] of [[0.22, 1, -1], [0.22, -1, -1], [0.47, 1, 1], [0.47, -1, 1]]) {
    const i = Math.round(k * N), a = spine[i].clone(), knee = V3(a.x + 0.1, a.y + fwd * 0.12, a.z + s * 0.36), foot = V3(0.03, a.y + fwd * 0.3, a.z + s * 0.5);
    const seg = (p, q, r0, r1) => { const d = q.clone().sub(p).normalize(), e1 = V3().crossVectors(d, V3(0, 1, 0.3)).normalize(), e2 = V3().crossVectors(d, e1).normalize(), R = [];
      for (const [c, r, v] of [[p, r0, 0], [q, r1, 0.3]]) { const row = []; for (let j = 0; j <= 5; j++) { const th = j / 5 * Math.PI * 2; row.push(vtx(c.clone().addScaledVector(e1, Math.cos(th) * r).addScaledVector(e2, Math.sin(th) * r), th * 0.06, v, 1)); } R.push(row); }
      grid(G, 2, R, true, false); };
    seg(a, knee, 0.085, 0.06); seg(knee, foot, 0.06, 0.04);
    for (let t = -1; t <= 1; t++) tri(G, 2, vtx(foot.clone().add(V3(0.05, 0, 0)), 0, 0, 1), vtx(V3(0.02, foot.y + fwd * 0.16 + t * 0.03, foot.z + s * 0.1 + t * 0.09), 0.1, 0.1, 1), vtx(V3(0.02, foot.y + fwd * 0.04, foot.z + t * 0.07), 0.1, 0, 1));
  }
  // iron eyes
  for (const s of [-1, 1]) lathe(G, 3, V3(0.3, -1.08, s * 0.09 + spine[1].z), [[0.045, -0.02], [0.03, 0.03], [0.005, 0.05]], 5, {});
  return { mouth: spine[0].clone() };
}

// ---------------------------------------------------------------------------------------------------------------
export default {
  id: 'chains-turned-to-stone',
  name: 'What the Chains Decided',
  category: 'artists',
  placeKind: 'city',
  after: 'Antoni Gaudí, 1852 to 1926',
  weirdness: 0.45,
  media: ['air', 'interior'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1), dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();

    // ---------- variations, chosen once: hour and weather, colourway, cast, the rare unbuilt bay ----------
    const rare = !!vary.rare;
    const hour = rare ? 'day' : vary.hour === 'golden' ? 'golden' : vary.hour === 'night' ? 'moon' : (vary.hour === 'day' || vary.hour === 'dawn') ? 'day'
      : (() => { const r = rng(); return r < 0.42 ? 'day' : r < 0.66 ? 'golden' : r < 0.82 ? 'rain' : 'moon'; })();
    const colourway = (() => { const r = rng(); return r < 0.72 ? 'all' : r < 0.9 ? 'whiteCobalt' : 'white'; })();
    const cast = rng.chance(0.62) ? 0 : 1;                       // helmet chimneys, or twisted cones under mushroom caps
    const lay = makeRng(926), heroRng = makeRng(1852);                                   // the hall itself is the same every visit: the route is checked against it

    const shared = makeShared(PALETTE);
    const C = (h) => new THREE.Color(h), P = PALETTE.map(C);
    const sky = { zen: P[2].clone(), hor: P[2].clone().lerp(P[1], 0.5), cloud: P[1].clone(), cloudAmt: 1, hill: P[0].clone().lerp(P[3], 0.3).lerp(P[6], 0.25),
      sea: P[6].clone().lerp(P[2].clone().lerp(P[1], 0.25), 0.5), disc: new THREE.Vector4(1, 0.98, 0.9, 1), clouds: [] };
    shared.uLamp.value = { day: 0.55, golden: 0.85, rain: 0.9, moon: 1.25 }[hour];
    if (hour === 'golden') {                         // evening: the same sun (its discs are set on the throat lattice), the stone gone ochre-sand
      shared.uSand.value.lerp(P[4], 0.26); shared.uWhite.value.lerp(P[4], 0.1);
      sky.zen.lerp(P[6], 0.12); sky.hor = P[4].clone().lerp(P[1], 0.55); sky.cloud = P[1].clone().lerp(P[4], 0.3); sky.disc.set(1, 0.86, 0.55, 1);
      sky.hill.lerp(P[4], 0.2); sky.sea = P[6].clone().lerp(sky.hor, 0.45);
    } else if (hour === 'rain') {
      shared.uSunOn.value = 0; shared.uShade.value = 0.78;
      sky.zen = P[1].clone().multiplyScalar(0.8).lerp(P[2], 0.12); sky.hor = P[1].clone().multiplyScalar(0.97); sky.cloudAmt = 0; sky.disc.set(1, 1, 1, 0);
      sky.hill = P[0].clone().lerp(P[3], 0.2).lerp(P[6], 0.4); sky.sea = P[6].clone().lerp(sky.hor, 0.4);
    } else if (hour === 'moon') {
      shared.uSun.value.set(0.5, 0.74, -0.45).normalize(); shared.uShade.value = 0.5;
      const pale = P[2].clone().lerp(P[1], 0.55);
      shared.uSand.value.lerp(pale, 0.5).multiplyScalar(0.62); shared.uWhite.value.lerp(P[2], 0.14).multiplyScalar(0.9);
      shared.uGreen.value.multiplyScalar(0.62); shared.uOchre.value.lerp(P[2], 0.2).multiplyScalar(0.6); shared.uRed.value.lerp(P[2], 0.2).multiplyScalar(0.55);
      shared.uCobalt.value.multiplyScalar(0.8); shared.uIron.value.multiplyScalar(0.6);
      sky.zen = P[2].clone().multiplyScalar(0.3).lerp(P[6], 0.3); sky.hor = P[2].clone().multiplyScalar(0.62); sky.cloud = P[1].clone().lerp(P[2], 0.4).multiplyScalar(0.55);
      sky.hill = P[6].clone().lerp(P[2], 0.25).multiplyScalar(0.8); sky.sea = P[6].clone().multiplyScalar(0.6).lerp(sky.hor, 0.35); sky.disc.set(0.95, 0.95, 0.9, 1);
    }
    // six authored clouds: azimuth (0 = dead ahead, + to port), base elevation, half width, height (radians)
    const cl0 = [[0.5, 0.15, 0.2, 0.065], [-0.75, 0.2, 0.26, 0.085], [1.9, 0.12, 0.3, 0.07], [-2.3, 0.17, 0.24, 0.08], [2.9, 0.24, 0.2, 0.06], [-1.45, 0.09, 0.17, 0.045]];
    for (const c of cl0) sky.clouds.push(new THREE.Vector4(c[0] + rng.range(-0.25, 0.25), c[1], c[2] * rng.range(0.85, 1.2), c[3]));

    // ---------- the world's own chains: under the viaduct and under the door ----------
    const deckY = (zw) => 22 + (zw + 4) * 0.18;
    const colsV = [], xS = [], xK = [], footRings = [];
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
      const zw = 19 + 22.5 * i + (i === 0 ? 7 : 0), zl = ((i + (s > 0 ? 1 : 0)) % 2 ? 1 : -1) * 1.7, top = deckY(zw) - 0.5, pts = [];
      for (let k = 0; k <= 14; k++) { const q = k / 14, w = 0.7 * q + 0.3 * q * q; pts.push(V3(s * lerp(i === 0 ? 11.5 : 9, 4.4, w), lerp(-0.6, top, q), zw - OZ + lerp(zl, -zl, w))); }
      colsV.push({ s, i, zw, pts, top, seed: lay() });
    }
    const mirS = (p) => V3(p.x, -Math.max(p.y, 0), p.z);
    const sag = (a, b, n, sg) => { const o = []; for (let i = 0; i <= n; i++) { const p = a.clone().lerp(b, i / n); p.y -= sg * Math.sin(Math.PI * i / n); o.push(p); } return o; };
    for (let i = 0; i < 3; i++) {
      const a = colsV[i * 2], b = colsV[i * 2 + 1], ph = lay.range(0, 6.283), dir = lay.range(0, 6.283);
      for (const c of [a, b]) { xS.push({ pts: c.pts.filter((_, k) => k % 2 === 0).map(mirS), tree: ph, dir, w: 2.4, pin: false });
        const h = mirS(c.pts[14]); xK.push({ x: h.x, y: h.y - 0.4, z: h.z, size: lay.range(2.2, 3), phase: ph, dir, own: lay.range(0, 6.283), tint: lay() }); }
      xS.push({ pts: sag(mirS(a.pts[14]), mirS(b.pts[14]), 6, 1.6), tree: ph, dir, w: 1.1, pin: true });
      if (i < 2) { for (const k of [0, 1]) xS.push({ pts: sag(mirS(colsV[i * 2 + k].pts[14]), mirS(colsV[i * 2 + 2 + k].pts[14]), 6, 2.2), tree: ph, dir, w: 1.4, pin: true });
        for (let k = 1; k <= 3; k++) {             // the deck found by hanging: a ladder of garlands between the two files, a sack on each
          const p0 = mirS(a.pts[14]).lerp(mirS(colsV[i * 2 + 2].pts[14]), k / 4), p1 = mirS(b.pts[14]).lerp(mirS(colsV[i * 2 + 3].pts[14]), k / 4); p0.y -= 2.2 * Math.sin(Math.PI * k / 4); p1.y -= 2.2 * Math.sin(Math.PI * k / 4);
          xS.push({ pts: sag(p0, p1, 6, 1.5), tree: ph + k, dir, w: 1.0, pin: true });
          xK.push({ x: 0, y: (p0.y + p1.y) / 2 - 1.7, z: (p0.z + p1.z) / 2, size: lay.range(2, 2.6), phase: ph + k, dir, own: lay.range(0, 6.283), tint: lay() }); } }
    }
    // mooring posts in the open water, before the hall and on the way to the door: leaning stone under a shard cap, each
    // with its chain and sack below (the leaning column once more, at boat scale; the route weaves between them)
    const prng = makeRng(1883), posts = [[-34, -236, 10.5], [-6, -207, 8], [-37, -196, 11], [-31, -174, 8.5], [10, -238, 9], [17, -206, 11], [-48, -216, 9], [-8, 168, 10], [17.5, 172, 8], [-21, 190, 11.5],
      [23, 207, 8.5], [-23, 226, 9.5], [18, 232, 8],
      [72, -50, 14], [81, -37, 10.5], [90, -54, 16], [77, -22, 9.5], [94, -30, 12.5], [70, -74, 11]].map(([x, z, h]) => {
      const a = prng.range(0, 6.283), ln = prng.range(0.14, 0.24), pts = [];
      for (let k = 0; k <= 8; k++) { const q = k / 8, w = 0.7 * q + 0.3 * q * q; pts.push(V3(x + Math.cos(a) * ln * h * w, lerp(-0.6, h, q), z + Math.sin(a) * ln * h * w)); }
      const ph = prng.range(0, 6.283), dir = prng.range(0, 6.283), hd = mirS(pts[8]);
      xS.push({ pts: pts.filter((_, k) => k % 2 === 0).map(mirS), tree: ph, dir, w: 2.3, pin: false });
      xK.push({ x: hd.x, y: hd.y - 0.3, z: hd.z, size: prng.range(2, 2.6), phase: ph, dir, own: prng.range(0, 6.283), tint: prng() });
      return { pts, h, seed: prng(), r: prng.range(1.7, 2.3), lean: [Math.cos(a) * ln * 1.3, Math.sin(a) * ln * 1.3] }; });
    // the door: a catenary 22 m tall inside; below it, its cause: one chain with seven sacks
    const DOOR = { w: 9.2, h: 26.5, k: 2.2, z: 270 };
    const catY = (x) => DOOR.h * (1 - (Math.cosh(DOOR.k * Math.min(Math.abs(x) / DOOR.w, 1.6)) - 1) / (Math.cosh(DOOR.k) - 1));
    { const pts = []; for (let i = 0; i <= 28; i++) { const x = lerp(-DOOR.w, DOOR.w, i / 28); pts.push(V3(x, -Math.max(catY(x), 0) - 0.05, DOOR.z)); }
      xS.push({ pts, tree: 1.3, dir: 1.57, w: 4.4, pin: true });
      for (let j = 0; j < 7; j++) { const x = lerp(-DOOR.w, DOOR.w, (j + 1) / 8); xK.push({ x, y: -catY(x) - 0.2, z: DOOR.z, size: 3.6, phase: 1.3, dir: 1.57, own: j * 1.7, tint: 0.5 }); } }
    // two water gates on the way to the door: a stone catenary standing in the reservoir, and under it the chain it was
    // found from, with its sacks: the idea of the place said once more, plainly, twice, before the door says it last
    const GATES = [{ z: 197, w: 14.5, h: 25, rot: 0.2, lean: 2.4, sg: 1, seed: 0.41 }, { z: 219, w: 12, h: 22.5, rot: -0.16, lean: -1.8, sg: -1, seed: 0.73 }];
    const gatePts = (g, n) => { const pts = []; for (let i = 0; i <= n; i++) { const t = lerp(-1, 1, i / n), x = Math.sign(t) * Math.pow(Math.abs(t), 0.85) * g.w;
      const y = g.h * (1 - (Math.cosh(2.3 * Math.abs(x) / g.w) - 1) / (Math.cosh(2.3) - 1)); pts.push(V3(x, y, g.z + x * Math.tan(g.rot) + g.lean * y / g.h)); } return pts; };
    for (const g of GATES) { const ph = g.seed * 6.283, dir = 1.57 + g.rot, pts = gatePts(g, 28).map((p) => V3(p.x, -Math.max(p.y, 0) - 0.05, p.z));
      xS.push({ pts, tree: ph, dir, w: 3.8, pin: true });
      for (let j = 0; j < 5; j++) { const q = pts[Math.round(lerp(4, 24, j / 4))]; xK.push({ x: q.x, y: q.y - 0.2, z: q.z, size: 3.3, phase: ph, dir, own: j * 2.1 + g.z, tint: 0.4 + 0.1 * j }); } }
    // the wave wall found by hanging: plumb strings at uneven steps, each as long as the wall stands tall over it, a
    // sack where it ends, and from end to end a heavy garland: the wall's crest, hanging under it right across the water
    { const fr = makeRng(1926), wTop = (x) => 9 + 22 * Math.exp(-(x / 13.5) * (x / 13.5)) + 0.9 * Math.sin(x * 0.21 + 1.0);
      for (const sd of [-1, 1]) { const ph = fr.range(0, 6.283), dir = fr.range(0, 6.283); let prev = null;
        for (let x = 12.5; x < 175; x += fr.range(8, 15)) { const xx = sd * x, len = wTop(xx) * 0.88 + fr.range(-0.8, 0.8), zz = DOOR.z - 1.6 + 2.2 * Math.sin(xx * 0.17) * smoothstep(9, 24, x), bot = V3(xx, -len, zz);
          xS.push({ pts: [0, 0.34, 0.67, 1].map((q) => V3(xx, -0.2, zz).lerp(bot, q)), tree: ph, dir, w: 0.8, pin: false });
          xK.push({ x: xx, y: -len, z: zz, size: fr.range(2.4, 3.3), phase: ph, dir, own: fr.range(0, 6.283), tint: fr() });
          if (prev) xS.push({ pts: sag(prev, bot, 8, 0.24 * prev.distanceTo(bot)), tree: ph, dir, w: 2.2, pin: false });
          prev = bot; } } }

    // ties just under the surface, found by hanging like the rest: across the aisle, along the two inner rows, across the
    // open water from the viaduct and on to the door, a sack of shot wherever one takes load (the skim passes over them)
    await ctx.yield();
    const pre = solveTrees(makeRng(1852).fork('trees'));
    await ctx.yield();
    { const foot = (r, c) => pre[r * HALL.nZ + c].foot;
      const tie = (a, b, sg, nS, w) => { const ph = lay.range(0, 6.283), dir = lay.range(0, 6.283), n = Math.max(8, Math.round(a.distanceTo(b) / 5)), pts = [];
        for (let i = 0; i <= n; i++) { const p = a.clone().lerp(b, i / n); p.y = -0.25 - sg * Math.sin(Math.PI * i / n); pts.push(p); }
        xS.push({ pts, tree: ph, dir, w: w * 1.3, pin: true });
        for (let j = 1; j <= nS; j++) { const p = a.clone().lerp(b, j / (nS + 1)); xK.push({ x: p.x, y: -0.4 - sg * Math.sin(Math.PI * j / (nS + 1)), z: p.z, size: lay.range(1.5, 2.2), phase: ph, dir, own: lay.range(0, 6.283), tint: lay() }); } };
      for (let c = 0; c < HALL.nZ; c++) { tie(foot(1, c), foot(2, c), lay.range(6, 8.5), 3, 1.5);
        if (c < HALL.nZ - 1) for (const r of [1, 2]) tie(foot(r, c), foot(r, c + 1), lay.range(8, 10.5), 2, 1.3);
        if (c < HALL.nZ - 1) for (const r of [0, 3]) tie(foot(r, c), foot(r, c + 1), lay.range(7, 9), 2, 1.3);
        if (c > 0 && c < HALL.nZ - 1) for (const r of [0, 2]) tie(foot(r, c), foot(r + 1, c), lay.range(5, 7), 3, 1.3); }      // and across the side aisles
      for (const r of [1, 2]) { const s = r === 1 ? -1 : 1;
        tie(V3(s * 9, 0, -246), foot(r, 0), 15, 4, 1.6); tie(V3(s * 9, 0, -246), foot(r === 1 ? 0 : 3, 0), 18, 5, 1.4); tie(foot(r === 1 ? 0 : 2, 0), foot(r === 1 ? 1 : 3, 0), 6, 3, 1.3); tie(foot(r, HALL.nZ - 1), V3(s * DOOR.w, 0, DOOR.z), 16, 4, 1.6); }
      for (const s of [-1, 1]) {                     // the wall's own web: garlands along its foot and back to the last trunks
        const j = V3(s * DOOR.w, 0, DOOR.z), w1 = V3(s * 34, 0, DOOR.z - 3), w2 = V3(s * 66, 0, DOOR.z - 5);
        tie(j, w1, 7, 3, 1.5); tie(w1, w2, 8, 3, 1.4);
        tie(foot(s < 0 ? 1 : 2, HALL.nZ - 1), w1, 13, 4, 1.4); tie(foot(s < 0 ? 0 : 3, HALL.nZ - 1), w2, 12, 4, 1.3); }
      for (const [z, a, sg] of [[198, 21, 6], [224, 25, 7], [249, 29, 7.5]]) tie(V3(-a, 0, z), V3(a, 0, z), sg, 3, 1.4);
      tie(V3(-21, 0, 198), V3(25, 0, 224), 9, 2, 1.2); tie(V3(25, 0, 224), V3(-29, 0, 249), 9, 2, 1.2);
      for (const t of pre) footRings.push([t.foot.x, t.foot.z]); }
    await ctx.yield();

    // ---------- the hero: the hall and the model it was found from ----------
    shared.uSkyZen.value.copy(sky.zen); shared.uSkyHor.value.copy(sky.hor);
    const hero = await buildHero({ rng: heroRng, yield: () => ctx.yield(), quality: ctx.quality }, { shared, detail, colourway, unbuilt: rare, extraStrands: xS, extraSacks: xK,
      clear: { x: 1400, z0: -1400, z1: 1400, fade: 80 }, mirror: false });      // under the water: the model and nothing else
    hero.object.position.set(0, 0, OZ);
    scene.add(hero.object);
    const A = hero.anchors, root = new THREE.Group(); root.position.set(0, 0, OZ); scene.add(root);   // root: everything authored in hall-local metres
    await ctx.yield();
    const path = makePath(routePoints(A));
    const built = builtMaterial(shared);

    // ---------- the sky ----------
    const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(900, 40, 24), skyMaterial(shared, sky));
    skyMesh.renderOrder = -10; skyMesh.frustumCulled = false; scene.add(skyMesh);
    await ctx.yield();

    // ---------- the viaduct: two files of leaning columns under a climbing conoid brick deck ----------
    const G = makeG(), stoneOut = { pos: [], att: [] };
    for (const c of colsV) {
      await ctx.yield();
      sweepMember(stoneOut, c.pts, (u, s) => lerp(2.05, 1.4, u) + 0.4 * Math.exp(-s * s / 5) + 0.5 * Math.exp(-Math.pow((1 - u) * 14, 2) / 3), 16,
        { depth: (u) => 0.36 * (1 - smoothstep(0.6, 0.97, u)), twist: (u) => u * Math.PI / 5 * (c.seed > 0.5 ? 1 : -1) }, c.seed, (p) => 1 - 0.4 * smoothstep(c.top - 9, c.top, p.y));
      const h = c.pts[13], t = c.pts[14].clone().sub(c.pts[12]);
      lathe(G, 2, V3(h.x, h.y - 2.6, h.z), [[1.5, 0], [2.0, 0.4], [2.25, 1.5], [2.6, 2.6], [1.9, 3.1]], 14, { lean: [t.x / t.y, t.z / t.y], ao: 0.9, uConst: 1.5, uScale: 0.7 });
    }
    { const rows = [];
      for (let zw = -5; zw <= 75.01; zw += 1) { const row = [], y0 = deckY(zw) - 0.55;
        for (let j = 0; j <= 8; j++) { const x = lerp(-5.9, 5.9, j / 8); row.push(vtx(V3(x, y0 + 1.15 * (x / 5.9) * Math.sin((zw - 19) / 22.5 * Math.PI * 2 + 0.6), zw - OZ), x, zw, 0.72)); }
        rows.push(row); }
      grid(G, 0, rows, true, false); await ctx.yield();
      for (const s of [-1, 1]) { const lo = [], mid = [], hi = [];      // the deck's edge: stone below, a wavy shard crest above
        for (const r of rows) { const e = r[s < 0 ? 0 : 8].p, zz = e.z + OZ;
          lo.push(vtx(V3(s * 5.9, e.y - 0.2, e.z), zz, 0, 1)); mid.push(vtx(V3(s * 6.25, e.y + 1.0, e.z), zz, 1.2, 1)); hi.push(vtx(V3(s * 6.0, e.y + 2.3 + 0.35 * Math.sin(zz * 0.8 + s), e.z), zz, 2.6, 1)); }
        grid(G, 6, s < 0 ? [lo, mid] : [mid, lo], true, false); grid(G, 2, s < 0 ? [mid, hi] : [hi, mid], true, false); }
    }
    await ctx.yield();
    let nPost = 0;
    for (const q of posts) {
      sweepMember(stoneOut, q.pts, (u, sm) => lerp(0.8, 0.5, u) + 0.25 * Math.exp(-sm * sm / 4) + 0.18 * Math.exp(-Math.pow((1 - u) * 8, 2) / 2), 16,
        { depth: (u) => 0.3 * (1 - smoothstep(0.6, 0.97, u)), twist: (u) => u * Math.PI / 6 * (q.seed > 0.5 ? 1 : -1) }, q.seed, () => 1, [0, 99, 2]);
      const top = q.pts[8], r = q.r;
      lathe(G, 2, V3(top.x, top.y - 0.25, top.z), [[0.5, -0.05], [r * 0.98, 0.0], [r * 1.08, 0.3], [r * 0.97, 0.8], [r * 0.72, 1.3], [r * 0.38, 1.7], [0.02, 1.86]], 16, { uScale: 0.95, uConst: r, lean: q.lean });
      lathe(G, 8, V3(top.x + q.lean[0] * 1.8, top.y + 1.55, top.z + q.lean[1] * 1.8), [[0.24, 0], [0.32, 0.22], [0.16, 0.46], [0.02, 0.56]], 6, {});
      if (++nPost % 3 === 0) await ctx.yield();
    }
    await ctx.yield();
    let nPlant = 0;
    for (const c of colsV) { planter(G, V3(c.s * 7.2, deckY(c.zw) + 0.2, c.zw - OZ), (nPlant++) % 2, lay, 1.5); if (nPlant % 3 === 0) await ctx.yield(); }
    for (const c of colsV) box(G, 6, V3(c.s * 6.7, deckY(c.zw) - 0.1, c.zw - OZ), 1.8, 0.6, 1.6, 0, 0.9);
    await ctx.yield();

    // ---------- the wave wall and the catenary door ----------
    const WZ = DOOR.z, wallTop = (x) => 9 + 22 * Math.exp(-(x / 13.5) * (x / 13.5)) + 0.9 * Math.sin(x * 0.21 + 1.0);
    const wallZ0 = (x) => WZ + 3.2 * Math.sin(x * 0.17) * smoothstep(9, 24, Math.abs(x)), wallZ1 = (x) => WZ + 3.2 * Math.sin(x * 0.17 + 2.3) * smoothstep(9, 24, Math.abs(x));
    { const xs = []; let x = 0, step = 1.25; while (x < 900) { xs.push(x); if (x > 70) step *= 1.12; x += step; }
      const all = [...xs.slice(1).reverse().map((v) => -v), ...xs], lo = [], mid = [], hi = [], cap = [], midS = [], hiS = [];
      for (const xx of all) {
        const top = wallTop(xx), bot = Math.abs(xx) < DOOR.w ? Math.max(catY(xx), -0.6) : -0.6, body = Math.max(top - 2.0, bot);
        const zAt = (y) => lerp(wallZ0(xx), wallZ1(xx), clamp(y / 9, 0, 1.4));
        lo.push(vtx(V3(xx, bot, zAt(bot)), xx, bot, 1)); mid.push(vtx(V3(xx, body, zAt(body) - 0.05), xx, body, 1));
        hi.push(vtx(V3(xx, top, zAt(top) - 0.3), xx, top, 1)); cap.push(vtx(V3(xx, top - 0.15, zAt(top) + 1.0), xx, top + 1.2, 1));
        midS.push({ ...mid[mid.length - 1], u: xx * 0.6, v: body * 0.6 }); hiS.push({ ...hi[hi.length - 1], u: xx * 0.6, v: top * 0.6 });
      }
      grid(G, 0, [mid, lo], true, false); await ctx.yield(); grid(G, 2, [hiS, midS], true, false); grid(G, 2, [cap, hi], true, false);
    }
    await ctx.yield();
    { // the stone catenary itself (the hero's sandstone), and the two folded iron leaves of the door
      const pts = []; for (let i = 0; i <= 30; i++) { const t = lerp(-1, 1, i / 30), x = Math.sign(t) * Math.pow(Math.abs(t), 0.8) * (DOOR.w + 0.9); pts.push(V3(x, Math.max(catY(x * DOOR.w / (DOOR.w + 0.9)), -0.6) + 0.9 * (1 - Math.abs(t) * 0.5), WZ - 0.5)); }
      sweepMember(stoneOut, pts, () => 1.05, 8, null, 0.37, () => 1);
      { // a band of shards round the arch, proud of the brick: the door's own crest
        const inR = [], outR = []; let sa = 0;
        for (let i = 0; i < pts.length; i++) { const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, pts.length - 1)], c = pts[i];
          let nx = b.y - a.y, ny = -(b.x - a.x); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
          if (nx * c.x + ny * (c.y - 9) < 0) { nx = -nx; ny = -ny; }
          if (i > 0) sa += c.distanceTo(pts[i - 1]);
          const wd = 2.5 + 0.3 * Math.sin(i * 1.3);
          inR.push(vtx(V3(c.x + nx * 0.8, c.y + ny * 0.8, WZ - 0.72), sa, 0, 1)); outR.push(vtx(V3(c.x + nx * wd, c.y + ny * wd, WZ - 0.62), sa, wd - 0.8, 1)); }
        grid(G, 2, [inR, outR], false, false); }
      const xin = (y) => DOOR.w * Math.acosh(1 + (1 - Math.min(y, DOOR.h - 1) / DOOR.h) * (Math.cosh(DOOR.k) - 1)) / DOOR.k;
      for (const s of [-1, 1]) for (const [y, Rf, nB, off] of [[2.2, 6.6, 13, 4.3], [13.5, 4.3, 11, 3.5]]) {     // two leaves a side, folded back flat against the jambs
        const hub = V3(s * (xin(y) + off), y, WZ - 2.7), dir = V3(s * 0.42, 0.9, -0.1).normalize(), side = V3(s * 0.9, -0.42, -0.1).normalize();
        ironFan(G, hub, dir, side, Rf, nB, 1.25);
      }
    }
    for (const g of GATES) {                       // the gates' stone: a star section that twists as it rises, a shard skirt at each foot, a shard cap on the crown
      const pts = gatePts(g, 30); pts[0].y = -0.6; pts[30].y = -0.6;
      sweepMember(stoneOut, pts, (u) => lerp(2.0, 1.15, Math.sin(Math.PI * u)), 16, { depth: (u) => 0.3, twist: (u) => u * Math.PI / 5 * g.sg }, g.seed, () => 1);
      const c = pts[15];
      lathe(G, 2, V3(c.x, c.y + 0.7, c.z), [[1.25, 0], [1.95, 0.45], [1.8, 1.25], [1.15, 2.1], [0.45, 2.75], [0.02, 3.05]], 14, { uScale: 0.95, uConst: 1.6, lean: [0, g.lean * 0.04] });
      lathe(G, 8, V3(c.x, c.y + 3.6, c.z + g.lean * 0.12), [[0.2, 0], [0.34, 0.2], [0.18, 0.46], [0.02, 0.56]], 6, {});
      await ctx.yield(); }
    // chimney groups on the wall beside the door, and planters along its foot ledge
    const chim = [];
    for (const s of [-1, 1]) for (const xx of [15.5, 20.5, 26]) chim.push({ x: s * xx, y: wallTop(s * xx) - 0.5, z: wallZ1(s * xx) + 0.5, h: lay.range(9, 11) });
    for (let i = 0; i < 32; i++) { const s = i % 2 ? 1 : -1, xx = s * (33 + Math.floor(i / 2) * 9.5 + lay.range(-2, 2));
      planter(G, V3(xx, wallTop(xx) - 0.25, lerp(wallZ0(xx), wallZ1(xx), 1) + 0.35), lay.chance(0.55) ? 0 : 1, lay, lay.range(1.2, 1.7)); if (i % 3 === 2) await ctx.yield(); }
    await ctx.yield();

    // ---------- the roof's crowd: chimneys in groups of three and four on the throat lips ----------
    const thr = (i, k) => A.throats[(i + 2) * 8 + k];
    const groups = [[0, 2, [0.7, 1.1, 1.5]], [0, 3, [-0.4, 0.05, 0.5]], [0, 3, [2.9, 3.35, 3.8]], [0, 4, [1.1, 1.57, 2.04]], [0, 4, [-0.35, 0.3]], [0, 4, [2.85, 3.45]],
      [-1, 2, [0.3, 0.8, 1.3, 5.8]], [1, 2, [2.0, 2.5, 3.0]], [-1, 3, [0.9, 1.4, 1.9]], [1, 3, [3.6, 4.1, 4.6, 5.1]], [1, 4, [2.2, 2.7, 3.2]], [-1, 4, [5.6, 6.1, 0.3]], [0, 1, [3.8, 4.3, 4.8]], [-1, 1, [1.1, 1.57, 2.04]], [0, 5, [0.9, 1.5, 2.1]]];
    for (const [i, k, angs] of groups) { const t = thr(i, k);
      for (const a0 of angs) { let a = a0, x = 0, z = 0, h = lay.range(6, 9), ok = false;
        for (let tries = 0; tries < 24 && !ok; tries++) { x = t.x + Math.cos(a) * t.radius * 1.62; z = t.z + Math.sin(a) * t.radius * 1.62; ok = true;
          for (let q = 0; q <= 4; q++) if (path.distanceTo(x, A.roofY(x, z) + h * q / 4, z + OZ) < 6.8) ok = false;
          for (const c of chim) if (Math.hypot(c.x - x, c.z - z) < 3) ok = false;
          if (!ok) a += 0.21; }
        if (ok) chim.push({ x, y: A.roofY(x, z) - 0.2, z, h }); } }
    // two groups stand either side of the low roof pass, tall enough to break the horizon
    for (const [x, z] of [[11, -19], [14, -15.5], [10.5, -12], [15, -22.5], [-6, -15], [-9.5, -18.5], [-8, -11], [-17, -31], [-20, -27], [3, -34], [6.5, -31], [-8.6, -40.5], [-5, -44], [-2.5, -38], [1, -41.5], [-23, -24], [-26.5, -28]]) { const h = lay.range(8.5, 10.5); let ok = true;
      for (let q = 0; q <= 4; q++) if (path.distanceTo(x, A.roofY(x, z) + h * q / 4, z + OZ) < 6.2) ok = false;
      if (ok) chim.push({ x, y: A.roofY(x, z) - 0.2, z, h }); }
    for (let i = 0; i < chim.length; i++) { const c = chim[i]; chimney(G, V3(c.x, c.y, c.z), c.h, lay, cast); if (i % 2 === 1) await ctx.yield(); }
    { // smoke from every third chimney
      const src = chim.filter((c, i) => i % 3 === 1 && path.distanceTo(c.x, c.y + c.h + 4, c.z + OZ) > 16), per = Math.max(4, Math.round(7 * detail)), aS = [], aPh = [];
      for (const c of src) { const w = lay.range(0, 6.283); for (let j = 0; j < per; j++) { aS.push(c.x, c.y + c.h, c.z + OZ, w); aPh.push(j / per + lay.range(-0.03, 0.03) + w); } }
      const pg = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(2, 2);
      pg.index = q.index; pg.setAttribute('position', q.getAttribute('position'));
      pg.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(aS), 4)); pg.setAttribute('aPh', new THREE.InstancedBufferAttribute(new Float32Array(aPh), 1));
      pg.instanceCount = aPh.length;
      const puffs = new THREE.Mesh(pg, puffMaterial(shared)); puffs.frustumCulled = false; scene.add(puffs); }
    await ctx.yield();

    // ---------- the rare event's furniture: timber centring where the last bay is unbuilt, one more sack on a string ----------
    let rareSack = null;
    if (rare) {
      for (const s of [-1, 1]) {                   // two trestle towers where the trunks will stand
        const cx = s * 15, cz = 144;
        for (const [ox, oz] of [[-2.2, -2.2], [2.2, -2.2], [2.2, 2.2], [-2.2, 2.2]]) box(G, 7, V3(cx + ox * 0.8, 29, cz + oz * 0.8), 0.42, 60, 0.42, 0.2);
        for (let y = 6; y < 58; y += 8.5) { box(G, 7, V3(cx, y, cz - 1.8), 4.4, 0.3, 0.3, 0.2); box(G, 7, V3(cx, y, cz + 1.8), 4.4, 0.3, 0.3, 0.2); box(G, 7, V3(cx - 1.8, y + 4, cz), 0.3, 0.3, 4.4, 0.2); box(G, 7, V3(cx + 1.8, y + 4, cz), 0.3, 0.3, 4.4, 0.2); }
      }
      for (let r = 0; r < 4; r++) {                // centring ribs across the open bay
        const z = 146.5 + r * 4.6; let prev = null;
        for (let i = 0; i <= 12; i++) { const x = lerp(-17, 17, i / 12), p = V3(x, 55.5 + 6.5 * (1 - (x / 17) * (x / 17)), z);
          if (prev) box(G, 7, prev.clone().lerp(p, 0.5), 0.34, 0.5, prev.distanceTo(p) + 0.2, Math.PI / 2 + 0.0, 0.9);
          prev = p; }
      }
      const SG = makeG();
      lathe(SG, 9, V3(0, 0, 0), [[0.02, -3.6], [0.7, -3.3], [1.15, -2.4], [0.95, -1.3], [0.28, -0.5], [0.4, -0.25], [0.1, 0]], 8, {});
      box(SG, 3, V3(0, 30, 0), 0.09, 60, 0.09);
      rareSack = new THREE.Mesh(finishG(SG), built); rareSack.frustumCulled = false; rareSack.position.set(6.8, 40, 150); root.add(rareSack);
    }

    // ---------- lanterns: one on every trunk, on an iron palm leaf toward the aisle; four under the viaduct ----------
    { const lr = makeRng(1904); let nL = 0;
      for (const t of A.trees) { if (rare && t.c === HALL.nZ - 1 && (t.r === 1 || t.r === 2)) continue;
        const q = clamp(11.2 / t.f1.y, 0, 1), wq = 0.72 * q + 0.28 * q * q, ax = V3(lerp(t.foot.x, t.f1.x, wq), 11.2, lerp(t.foot.z, t.f1.z, wq));
        const out = V3(-Math.sign(t.foot.x), 0, 0), at = ax.addScaledVector(out, 1.7);
        if (path.distanceTo(at.x + out.x * 2.3, 12, at.z + OZ) < 7.5) continue;
        lantern(G, at, out, lr, 1); if (++nL % 3 === 0) await ctx.yield(); }
      for (const c of colsV) { if (c.i !== 1) continue; const p = c.pts[5].clone().lerp(c.pts[6], 0.3), out = V3(-c.s * 0.6, 0, -0.8);
        lantern(G, p.addScaledVector(out, 1.0), out, lr, 0.8); }
      await ctx.yield(); }

    // ---------- the market: a raft of moored barges under striped awnings where the skim leaves the hall ----------
    { const mr = makeRng(1910), src = [makeG(), makeG()]; barge(src[0], mr); barge(src[1], mr); await ctx.yield();
      const raft = [[-17.5, 95, 0.25, 1], [-19, 121, 0.1, 0], [-18.5, 132, -0.15, 1], [2.5, 100, 0.3, 0], [3.5, 113, -0.2, 1], [1, 126, 0.15, 0], [5.5, 128, 2.9, 1], [9, 114.5, 0.1, 0],
        [-8, -150, 0.5, 1], [-33, -118, 0.2, 1], [8.5, -118, 2.8, 0], [-9, 60, 0.4, 1], [9.5, 66, -0.3, 0], [71, -41, 1.2, 1], [84, -27, 0.9, 0], [76, -62, 1.4, 1], [86, -45, 1.1, 0],
        [-14.5, 236, 0.14, 1], [15.5, 247, -0.12, 0], [-18, 258.5, 0.3, 0], [20.5, 262, -0.28, 1], [22, 188, 0.5, 0], [-26, 176, -0.4, 1],
        [12, -172, 0.4, 0], [20, -183, -0.2, 1], [29, -170, 0.9, 0], [36, -186, 0.2, 1], [6, -191, 1.3, 1], [24, -197, -0.5, 0],
        [-52, -128, 0.5, 1], [-63, -141, -0.3, 0], [-48, -147, 1.1, 0], [-71, -123, 0.2, 1], [-58, -160, 0.8, 1], [-23, -263, 0.6, 1], [-31, -247, -0.3, 0], [-19, -238, 1.2, 0]];       // and a raft at the hall front, port side
      for (let i = 0; i < raft.length; i++) { const [x, z, rot, vr] = raft[i], S = src[i % 2], cs = Math.cos(rot), sn = Math.sin(rot);
        if (path.distanceTo(x, 3, z + OZ) < 6) continue;
        for (let k = 0; k < S.pos.length; k += 3) {
          const px = S.pos[k], pz = S.pos[k + 2], nx = S.nor[k], nz = S.nor[k + 2], j = k / 3 * 4;
          G.pos.push(x + px * cs + pz * sn, S.pos[k + 1] + 0.03, z - px * sn + pz * cs); G.nor.push(nx * cs + nz * sn, S.nor[k + 1], -nx * sn + nz * cs);
          G.am.push(S.am[j], S.am[j + 1], S.am[j + 2], S.am[j] === 5 && vr ? 0.3 : S.am[j + 3]); G.aa.push(S.aa[j], S.aa[j + 1], S.aa[j + 2] + i, S.aa[j + 3]); }
        await ctx.yield(); } }

    await ctx.yield();
    const stoneGeo = new THREE.BufferGeometry();                 // sweepGeometry's work, in short steps
    stoneGeo.setAttribute('position', new THREE.Float32BufferAttribute(stoneOut.pos, 3)); await ctx.yield();
    stoneGeo.setAttribute('aS', new THREE.Float32BufferAttribute(stoneOut.att, 3)); await ctx.yield();
    stoneGeo.computeVertexNormals(); await ctx.yield();
    const stoneMesh = new THREE.Mesh(stoneGeo, stoneMaterial(shared)); stoneMesh.name = 'viaduct-stone'; root.add(stoneMesh);
    await ctx.yield();
    const builtMesh = new THREE.Mesh(await finishBig(G, () => ctx.yield()), built); builtMesh.name = 'built'; builtMesh.frustumCulled = false; root.add(builtMesh);
    await ctx.yield();

    // ---------- the lizard on the second starboard column, head down, spouting a thread of water ----------
    { const LG = makeG(), liz = lizard(LG), col = colsV[4], yy = 9.4;
      let k = 0; while (k < 13 && col.pts[k + 1].y < yy) k++;
      const a = col.pts[k], b = col.pts[k + 1], q = (yy - a.y) / (b.y - a.y), ax = a.clone().lerp(b, q), t = b.clone().sub(a).normalize();
      const m = new THREE.Mesh(finishG(LG), built); m.name = 'lizard';
      const o = V3(0.62, 0, -0.78);                     // it clings to the side we come in on, its back to us
      m.position.set(ax.x + o.x * 1.8, ax.y, ax.z + o.z * 1.8); m.quaternion.setFromUnitVectors(V3(0, 1, 0), t).multiply(new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), Math.atan2(-o.z, o.x))); root.add(m);
      m.updateMatrix();
      const mouth = liz.mouth.clone().applyMatrix4(m.matrix), land = V3(mouth.x + o.x * 2.4, 0.02, mouth.z + o.z * 2.4);
      const curve = new THREE.QuadraticBezierCurve3(mouth, V3(mouth.x + o.x * 1.6, mouth.y + 0.5, mouth.z + o.z * 1.6), land);
      const thread = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.04, 5, false), threadMaterial(shared)); root.add(thread);
      var spoutAt = land; }
    await ctx.yield();

    // ---------- fifteen market barges: eight moored, seven poled slowly ----------
    const bargeGeo = []; for (let i = 0; i < 3; i++) { const BG = makeG(); barge(BG, lay); bargeGeo.push(finishG(BG)); await ctx.yield(); }
    const bargeDefs = [[-20.5, -106, 0.2, 0], [41, -70, 3.0, 0], [-40.5, -2, 0.4, 0], [20.5, 36, 2.9, 0], [-20.5, 74, 0.1, 0], [40, 108, 3.3, 0], [-40, 140, 0.3, 0],
      [-30, -100, 0, 34], [30, 40, Math.PI, 30], [-30, 96, 0, 26], [-92, -190, 0.5, 40], [78, 205, 2.6, 36], [84, -70, 0.15, 38], [108, -20, 2.9, 0], [-86, 30, 3.1, 34], [-6, -111, 0.45, 0], [-37, -158, 0.9, 0], [2.5, 143, 0.25, 0], [3.5, -47, 0.6, 0]];
    const barges = bargeDefs.map(([x, z, rot, amp], i) => { const m = new THREE.Mesh(bargeGeo[i % 3], built); m.position.set(x, 0, z); m.rotation.y = rot; root.add(m);
      return { m, x, z, rot, amp, ph: lay.range(0, 6.283), sp: lay.range(0.035, 0.055) }; });

    // ---------- ripple rings: the spout's landing, where swifts dip to drink, drizzle after rain ----------
    const ringDefs = [[spoutAt.x, spoutAt.z + OZ, 1.3, 1.5, 0]];
    for (const [x, z, R] of [[5, -150, 3.2], [-6, -120, 2.6], [9, -60, 3], [-2, -84, 3.2], [-9, -66, 2.8], [1, -100, 3], [-22, -90, 3.4], [-28, -62, 3], [-6, -44, 3.2], [30, -96, 3], [-34, -78, 2.6], [-4, 70, 3.4], [5, 100, 2.8], [-5, 132, 3.2], [4, 176, 3], [-7, 222, 3.4], [3, -230, 3], [-3, -262, 2.4]]) ringDefs.push([x, z + OZ, lay.range(3.2, 5.5), R, lay()]);
    for (const b of barges) ringDefs.push([b.x, b.z + OZ, 2.6, 0.01, lay()]);
    for (const [x, z] of footRings) ringDefs.push([x, z + OZ, lay.range(6, 9), 8.5, lay()]);      // the water lapping at each trunk            // slots 11.. follow the barge poles in update
    for (const c of colsV) ringDefs.push([c.pts[0].x, c.pts[0].z + OZ, lay.range(5, 7), 6, lay()]);
    for (let i = 0; i < 26; i++) ringDefs.push([lay.range(-110, 110), lay.range(20, 560), lay.range(3.5, 6), lay.range(2.5, 4.5), lay()]);
    // (own rng from here on, so the layout's draws stay as they were) a small quick ring wherever a chain pierces the
    // surface: at each trunk's pin, each viaduct column, each mooring post, the feet of the gates and the door, the wall's strings
    const rr = makeRng(1904);
    for (const [x, z] of footRings) ringDefs.push([x, z + OZ, rr.range(2.2, 3.4), 3.4, rr()]);
    for (const p of posts) { ringDefs.push([p.pts[0].x, p.pts[0].z + OZ, rr.range(3.5, 5), 5.5, rr()]); ringDefs.push([p.pts[0].x, p.pts[0].z + OZ, rr.range(1.8, 2.6), 2.4, rr()]); }
    for (const g of GATES) for (const sd of [-1, 1]) { const x = sd * g.w; ringDefs.push([x, g.z + x * Math.tan(g.rot) + OZ, rr.range(4, 6), 7, rr()]); ringDefs.push([x, g.z + x * Math.tan(g.rot) + OZ, rr.range(2, 3), 3, rr()]); }
    for (const sd of [-1, 1]) ringDefs.push([sd * DOOR.w, DOOR.z + OZ - 1.5, rr.range(4, 6), 6.5, rr()]);
    for (let x = 16; x < 170; x += rr.range(9, 15)) for (const sd of [-1, 1]) ringDefs.push([sd * x, DOOR.z + OZ - 1.6 - rr.range(0.5, 3), rr.range(2.5, 4.5), rr.range(2.5, 4), rr()]);
    for (const c of colsV) ringDefs.push([c.pts[0].x, c.pts[0].z + OZ, rr.range(2, 3), 2.8, rr()]);
    // each barge: the water lapping along its hull, and behind a poled one the wake, three rings left astern (update moves them)
    const wake0 = ringDefs.length;
    for (const b of barges) for (let j = 0; j < 4; j++) ringDefs.push([b.x, b.z + OZ, 2.2 + 0.5 * j, j === 0 ? 6.5 : 3.6 - 0.5 * j, rr()]);
    if (hour === 'rain') { const n = Math.round(170 * detail * dens);
      for (let i = 0; i < n; i++) { const pp = path.pointAt(lay.range(0, 1)); ringDefs.push([pp.x + lay.range(-55, 55), clamp(pp.z + lay.range(-50, 50), 5, 575), lay.range(1.4, 2.8), lay.range(0.7, 1.5), lay()]); } }
    const ringGeo = new THREE.InstancedBufferGeometry(), rq = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
    ringGeo.index = rq.index; ringGeo.setAttribute('position', rq.getAttribute('position'));
    const ringAttr = new THREE.InstancedBufferAttribute(new Float32Array(ringDefs.flatMap((r) => [r[0], r[1], r[2], r[3]])), 4);
    ringGeo.setAttribute('aR', ringAttr); ringGeo.setAttribute('aPh', new THREE.InstancedBufferAttribute(new Float32Array(ringDefs.map((r) => r[4])), 1));
    ringGeo.instanceCount = ringDefs.length;
    const rings = new THREE.Mesh(ringGeo, ringMaterial(shared, { value: 1 })); rings.frustumCulled = false; rings.renderOrder = 4; scene.add(rings);
    await ctx.yield();

    // ---------- swifts: 150 black sickles in screaming parties, faster than we fly ----------
    const NS = Math.max(60, Math.round(150 * detail)), nA = Math.round(NS * 0.27), nB = Math.round(NS * 0.2);
    const swiftGeo = swiftGeometry(), swiftMat = swiftMaterial(shared);
    const swifts = new THREE.InstancedMesh(swiftGeo, swiftMat, NS); swifts.frustumCulled = false; swifts.name = 'swifts';
    const sw = [], phArr = new Float32Array(NS);
    for (let i = 0; i < NS; i++) {
      const a = lay.range(0, 6.283), r = lay.range(1.7, 3.9), ph = lay.range(0, 6.283);
      sw.push({ pool: i < nA ? 0 : i < nA + nB ? 1 : 2, loop: i % 5, lag: lay(), ring: V3(Math.cos(a) * r, Math.sin(a) * r * 0.8, Math.sin(a * 1.7) * r), wide: V3(lay.range(-7, 7), lay.range(-3.5, 3.5), lay.range(-7, 7)), ph });
      phArr[i] = ph;
    }
    swiftGeo.setAttribute('aPh', new THREE.InstancedBufferAttribute(phArr, 1));
    scene.add(swifts);
    await ctx.yield();
    const W = (pts) => pts.map(([x, y, z]) => V3(x, y, z + OZ));
    const loops = [
      new THREE.CatmullRomCurve3(W([[30, 82, -34], [30, 66, -18], [25, 42, -4], [9, 22, 22], [-20, 18, 58], [-30, 42, 84], [-30, 66, 90], [-34, 84, 78], [-12, 92, 28]]), true),
      new THREE.CatmullRomCurve3(W([[-16, 15, -276], [13, 27, -236], [24, 13, -190], [8, 30, -160], [-24, 44, -140], [-40, 20, -200], [-30, 30, -250]]), true),
      new THREE.CatmullRomCurve3(W([[-34, 13, 246], [-8, 22, 258], [26, 12, 244], [14, 34, 204], [-6, 50, 172], [-30, 66, 126], [-36, 82, 150], [-44, 30, 214]]), true),
      new THREE.CatmullRomCurve3(W([[-8, 10, -150], [10, 14, -100], [-9, 22, -50], [8, 12, 0], [-10, 16, 60], [9, 24, 120], [24, 30, 150], [40, 18, 60], [38, 26, -40], [30, 16, -130]]), true),
      new THREE.CatmullRomCurve3(W([[0, 30, -104], [22, 26, -62], [31, 50, -82], [30, 70, -90], [20, 86, -72], [2, 80, -52], [0, 66, -54], [-6, 42, -62], [-20, 24, -92]]), true),
    ];
    await ctx.yield();
    const loopLen = loops.map((c) => c.getLength());
    await ctx.yield();
    const cross = new THREE.CatmullRomCurve3(W([[-52, 13, -152], [-12, 12, -106], [9, 17, -86], [21, 40, -86], [30, 66, -90], [35, 86, -102]]), false);
    const _p = V3(), _p2 = V3(), _f = V3(), _r = V3(), _u = V3(), _cp = V3(), _cf = V3(), _cr = V3(), _cu = V3(), _m = new THREE.Matrix4(), _far = new THREE.Matrix4().makeScale(0, 0, 0).setPosition(0, -900, 0);
    const UP = V3(0, 1, 0);
    function setSwift(i, pos, fwd, roll) {
      _r.crossVectors(UP, fwd); if (_r.lengthSq() < 1e-6) _r.set(1, 0, 0); _r.normalize(); _u.crossVectors(fwd, _r);
      if (roll) { const c = Math.cos(roll), s = Math.sin(roll); _e.copy(_r).multiplyScalar(c).addScaledVector(_u, s); _u.multiplyScalar(c).addScaledVector(_r, -s); _r.copy(_e); }
      _m.makeBasis(_r, _u, fwd).setPosition(pos); swifts.setMatrixAt(i, _m);
    }
    function updateSwifts(time, u, camera) {
      const s1 = u > 0.2 && u < 0.28, s3 = u > 0.612 && u < 0.738, s2 = u > 0.401 && u < 0.501, s4 = u > 0.826;
      for (let i = 0; i < NS; i++) {
        const s = sw[i]; let mode = 0, sig = 0, t = 0;         // 0 ambient loop, 1 along our own path, 2 the crossing party
        if (s.pool === 0) { if (u > 0.275 && u < 0.401) { mode = 3; sig = clamp(u + (s.lag - 0.4) * 0.07, 0.25, 0.418); } else if (s2) { mode = 1; sig = 0.466 + (u - 0.431) * 3.4 - s.lag * 0.035; } else if (s4) { mode = 1; sig = u + Math.min((u - 0.83) * 0.9, 0.05) - s.lag * 0.028; } }
        else if (s.pool === 1) { if (s1) { mode = 2; t = (u - 0.2) / 0.08 * 1.25 - s.lag * 0.25; } else if (u > 0.278 && u < 0.401) { mode = 3; sig = clamp(u + (s.lag - 0.45) * 0.085, 0.25, 0.418); } else if (s3) { mode = 1; sig = 0.588 + (u - 0.627) * 2.6 - s.lag * 0.03; } }
        const wob = 0.7;
        if (mode === 1) {
          if (sig > 1 || sig < 0) { swifts.setMatrixAt(i, _far); continue; }
          path.pointAt(sig, _p); path.pointAt(Math.min(sig + 0.004, 1.01), _p2); _f.subVectors(_p2, _p).normalize();
          _p.add(s.ring);
        } else if (mode === 3) {           // the party that wheels up round the hero trunk with us, inside our own turn
          path.pointAt(sig, _p); path.pointAt(sig + 0.004, _p2); _f.subVectors(_p2, _p).normalize();
          const ax = A.heroTrunk.axisAt(clamp(_p.y, 0, 34)), k = 0.46 + 0.22 * ((s.ph * 7.3) % 1);
          _p.x = ax.x + (_p.x - ax.x) * k; _p.z = ax.z + OZ + (_p.z - ax.z - OZ) * k; _p.y += s.ring.y * 1.1 - 1.5; _p.x += s.ring.x * 0.3; _p.z += s.ring.z * 0.3;
        } else if (mode === 2) {
          if (t > 1 || t < 0) { swifts.setMatrixAt(i, _far); continue; }
          cross.getPoint(t, _p); cross.getPoint(Math.min(t + 0.01, 1), _p2); _f.subVectors(_p2, _p); if (_f.lengthSq() < 1e-8) _f.set(0, 0, 1); _f.normalize();
          _p.addScaledVector(s.wide, 0.55);
        } else {
          const L = s.loop, tt = (time * 30 / loopLen[L] + s.lag * 0.16 + s.pool * 0.37) % 1;
          loops[L].getPoint(tt, _p); loops[L].getPoint((tt + 0.006) % 1, _p2); _f.subVectors(_p2, _p).normalize();
          _p.add(s.wide);
        }
        _p.x += wob * Math.sin(time * 1.3 + s.ph); _p.y += wob * Math.sin(time * 1.7 + s.ph * 2.1); _p.z += wob * Math.cos(time * 1.1 + s.ph * 1.3);
        setSwift(i, _p, _f, 0.5 * Math.sin(time * 1.9 + s.ph));
      }
      // one swift holds station off the lens through the up-throat, flickering and rolling, then is gone ahead
      if (u > 0.415 && u < 0.479) {
        const e = camera.matrixWorld.elements; _cp.setFromMatrixPosition(camera.matrixWorld); _cr.set(e[0], e[1], e[2]); _cu.set(e[4], e[5], e[6]); _cf.set(-e[8], -e[9], -e[10]);
        const a = smoothstep(0.415, 0.428, u), b = smoothstep(0.461, 0.479, u), d = lerp(-2.2, 1.7, a) + 22 * b * b;
        _p.copy(_cp).addScaledVector(_cf, d).addScaledVector(_cr, 0.75 + 0.06 * Math.sin(time * 2.3) - 1.2 * (1 - a)).addScaledVector(_cu, -0.42 + 0.06 * Math.sin(time * 3.1) - 0.5 * (1 - a));
        const ro = 0.5 + 0.45 * Math.sin(time * 2.6);
        _f.copy(_cu).multiplyScalar(0.8).addScaledVector(_cf, 0.6).addScaledVector(_cr, -0.25).normalize();
        _r.copy(_cr).multiplyScalar(Math.cos(ro)).addScaledVector(_cf, Math.sin(ro)); _r.addScaledVector(_f, -_r.dot(_f)).normalize(); _u.crossVectors(_f, _r);
        _m.makeBasis(_r, _u, _f).setPosition(_p); swifts.setMatrixAt(0, _m);
      }
      swifts.instanceMatrix.needsUpdate = true;
    }

    // ---------- the flight ----------
    const bump = (u, a, b, w) => smoothstep(a - w, a + w, u) * (1 - smoothstep(b - w, b + w, u));
    const pace = (u) => 1 - 0.15 * bump(u, 0.04, 0.1, 0.02) + 0.3 * bump(u, 0.19, 0.23, 0.02) - 0.3 * bump(u, 0.27, 0.405, 0.025) - 0.15 * bump(u, 0.42, 0.466, 0.015)
      + 0.5 * bump(u, 0.612, 0.71, 0.025) - 0.27 * bump(u, 0.745, 0.855, 0.025);
    const _cam = V3(), _poi = V3(), size = new THREE.Vector2();
    const lizAt = V3(-6.6, 8.6, 63), hallAt = V3(0, 30, 160), _tg = V3(), trunkPoi = (time, u) => { const uu = clamp(u, 0.25, 0.42); path.pointAt(uu, _poi); const y = _poi.y, ax = A.heroTrunk.axisAt(clamp(y - 3, 0, 34));
      let tx = ax.x - _poi.x, tz = ax.z + OZ - _poi.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      const ph = 0.56 * clamp(tx * 1.6, -1, 1), c = Math.cos(ph), sn = Math.sin(ph);      // the gaze passes the trunk on its down-hall side: the trunk in a third of the frame, the hall and its model beyond
      return _poi.set(_poi.x + (tx * c - tz * sn) * 16, y - 2.6, _poi.z + (tx * sn + tz * c) * 16); };
    const aislePoi = (time, u) => { path.pointAt(clamp(u, 0.19, 0.29), _poi2); _poi2.y += 30; _poi2.z += 62; _poi2.x += 2; return _poi2; }, _poi2 = V3();
    const uShift = shared.uShift.value;
    function update(dt, time, camera, u) {
      hero.setProgress(u);
      hero.update(dt, time, camera);
      _cam.setFromMatrixPosition(camera.matrixWorld);
      skyMesh.position.copy(_cam);
      for (let i = 0; i < barges.length; i++) {
        const b = barges[i], s = b.amp * Math.sin(time * b.sp + b.ph), sn = Math.sin(b.rot), cs = Math.cos(b.rot);
        const x = b.x + sn * s, z = b.z + cs * s;
        b.m.position.set(x, 0.05 * Math.sin(time * 0.9 + b.ph), z); b.m.rotation.z = 0.012 * Math.sin(time * 0.7 + b.ph);
        const k = (19 + i) * 4;
        ringAttr.array[k] = x + 0.75 * cs - 5.2 * sn; ringAttr.array[k + 1] = z + OZ - 0.75 * sn - 5.2 * cs; ringAttr.array[k + 3] = b.amp > 0 ? 1.5 : 0.9;
        const vel = b.amp > 0 ? Math.cos(time * b.sp + b.ph) : 0, back = vel >= 0 ? -1 : 1, w0 = (wake0 + i * 4) * 4;
        ringAttr.array[w0] = x; ringAttr.array[w0 + 1] = z + OZ;
        for (let j = 1; j < 4; j++) { const d = b.amp > 0 ? back * (3.5 + 4.5 * j) * Math.min(Math.abs(vel) * 3, 1) : (j - 2) * 3.6;
          ringAttr.array[w0 + j * 4] = x + sn * d; ringAttr.array[w0 + j * 4 + 1] = z + OZ + cs * d; }
      }
      ringAttr.needsUpdate = true;
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); swiftMat.uniforms.uPx.value = 5 * 2 * Math.tan((camera.fov || 62) * Math.PI / 360) / Math.max(size.y, 1); }
      updateSwifts(time, u, camera);
      if (rareSack) {
        rareSack.position.y = lerp(46, 3.3, smoothstep(0.743, 0.826, u)) + 0.08 * Math.sin(time * 1.7);
        rareSack.rotation.z = 0.03 * Math.sin(time * 1.3) * (1 - smoothstep(0.806, 0.826, u));
        const s = Math.max(u - 0.826, 0) / 0.03, k = u > 0.826 ? 0.4 * (1 - Math.exp(-3.2 * s) * Math.cos(7.5 * s)) : 0;
        uShift.x = k; uShift.y = 0.35 * k;
      }
    }

    const hourName = { day: '', golden: ': Evening', rain: ': After Rain', moon: ': Full Moon' }[hour];
    return {
      scene, path, duration: 42, pace,
      title: rare ? 'What the Chains Decided: The Unbuilt Bay' : 'What the Chains Decided' + hourName,
      ride: 'none', style: 'none', companion: 'none',
      camera: { fov: 62, near: 0.3, far: 7000, lookAhead: 24, sway: 0.3, bank: 0.05 },
      pois: [
        { at: lizAt, from: 0.045, to: 0.105, weight: 0.45 },
        { at: hallAt, from: 0.0, to: 0.21, weight: 0.5, fade: 0.12 },
        { at: aislePoi, from: 0.2, to: 0.285, weight: 0.5, fade: 0.25 },
        { at: trunkPoi, from: 0.275, to: 0.405, weight: 0.86 },
        { at: V3(0, 21, DOOR.z + OZ), from: 0.8, to: 0.97, weight: 0.5, fade: 0.2 },
      ],
      portal: { shape: 'arch', width: 13, height: 16, color: '#F2EEE3', glow: 0.35, revealDistance: 320 },
      post: { exposure: 1, bloom: { strength: 0.12, radius: 0.5, threshold: 0.95 },
        grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0.14, grain: 0.012, aberration: 0 } },
      update,
      dispose() { rq.dispose(); },
    };
  },
};
