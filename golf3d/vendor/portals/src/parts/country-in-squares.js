// HERO SET PIECE for "country-in-squares": the red queen at full run, and the family of chessmen she belongs to.
//
// WHAT IT IS
//   Chess pieces turned and carved like real chessmen grown as tall as churches (king 48 m, queen 45, bishop 37,
//   knight 34, rook 30, pawn 22), in old ivory and red lacquer: the lathe's rings round every turning, rims worn to
//   the wood, grooves dark, hairline cracks in the ivory, a band of green baize under each base, gilding cut in facets. Each is a solid of revolution with a head that
//   turns and nods; the knight is a carved horse that rears on its base with a rider who sways in the saddle.
//   The hero is the red queen at full run: she runs nearly upright on her hem, one arm pointing on, and her skirt
//   is a bell of heavy lacquer cloth in a gale (pressed against her in front, blown out behind, deep folds
//   travelling round it, the back of the hem snapping). She bobs a little with each stride and raises a plume of
//   dust that trails back along her lane; a small white pawn leans along at her side, the grass under her streaks
//   past and a length of hedge keeps pace with her, so that she gets nowhere.
//
// LOCAL SPACE (hero)  origin under the queen at ground level, +Y up, she runs toward +Z.
//
// EXPORTS
//   buildHero(ctx, opts)     the running queen (opts.env: shared light block, opts.family: also stand the six
//                            kinds round her, for the viewer; opts.ground: her streaking ground disc;
//                            opts.pawnAt / opts.hedgeAt: [x, z] of the pawn and the pacing hedge beside her)
//   makeEnv(rng, pause)      async: the light / fog / time uniform block every material here shares
//   makeLit(env, o)          the lit material (ivory, lacquer, gold, gems, paint, glow)
//   Geo                      vertex builder (grids, lathes, tubes, blobs) with the attributes makeLit needs
//   pieceGeometry(kind, d)   one chessman; d = 1 full, 0 far / shadow caster, -1 far shadow (pieceGeometryAsync: in steps)
//   makePieces(env, o)       instanced chessmen of one kind with head, lean and bob animation
//   PIECE_ANIM, PIECES       the vertex animation chunk (for shadow materials) and the kinds' sizes
//
// LIGHT  Self-lit ShaderMaterials: a sun direction and colour, sky and ground ambient, exponential fog, all from
//        the env block. COST  queen 11.6k triangles + pawn 2.1k + hedge 0.2k + streaks 0.1k + dust 1.6k,
//        6 draw calls (alone in the viewer, with her ground and the six kinds stood round her: 33k, 32 draw calls).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

export const TAU = Math.PI * 2;
export const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
export const mulc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export const IVORY = mulc(lin('#f4ead2'), 0.74), RED = mulc(lin('#c2202b'), 0.7), GOLD = lin('#ffd04a');
// the gloss of the two finishes, capped: an old lacquer and an old ivory, not a glaze
export const GLOSS_LACQUER = 0.55, GLOSS_IVORY = 0.3;
// what the shade of each colour turns to: honey under ivory, crimson under lacquer
export const IVORY_SHADE = [1.0, 0.74, 0.42], RED_SHADE = [0.9, 0.16, 0.3];

// ---------------------------------------------------------------- shared noise texture (tileable value noise, 4 channels)
async function noiseChannel(rng, data, N, ch, pause) {
  const acc = new Float32Array(N * N);
  let amp = 1, tot = 0;
  for (let o = 0; o < 4; o++) {
    const G = 8 << o, lat = new Float32Array(G * G);
    for (let i = 0; i < G * G; i++) lat[i] = rng();
    const f = G / N;
    for (let y = 0; y < N; y++) {
      const gy = y * f, y0 = Math.floor(gy), ty = gy - y0, sy = ty * ty * (3 - 2 * ty), ya = (y0 % G) * G, yb = ((y0 + 1) % G) * G;
      for (let x = 0; x < N; x++) {
        const gx = x * f, x0 = Math.floor(gx), tx = gx - x0, sx = tx * tx * (3 - 2 * tx), xa = x0 % G, xb = (x0 + 1) % G;
        const a = lat[ya + xa], b = lat[ya + xb], c = lat[yb + xa], d = lat[yb + xb];
        acc[y * N + x] += amp * (a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy);
      }
    }
    tot += amp; amp *= 0.5;
    if (pause) await pause();
  }
  for (let i = 0; i < N * N; i++) data[i * 4 + ch] = Math.round(clamp(acc[i] / tot, 0, 1) * 255);
}
function noiseTexture(data, N) {
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}

// ---------------------------------------------------------------- the light everything here shares
// `pause` (optional): an async hand-back called between the noise channels, so the build never stalls
export async function makeEnv(rng, pause, size = 128) {
  const data = new Uint8Array(size * size * 4);
  for (let ch = 0; ch < 4; ch++) await noiseChannel(rng, data, size, ch, pause);
  return {
    uTime: { value: 0 },
    uSun: { value: new THREE.Vector3(-0.62, 0.42, 0.5).normalize() },
    uSunCol: { value: new THREE.Color(2.1, 1.8, 1.4) },
    uSky: { value: new THREE.Color(0.42, 0.56, 0.8) },
    uGnd: { value: new THREE.Color(0.3, 0.3, 0.16) },
    uFogCol: { value: new THREE.Color(0.62, 0.78, 0.95) },
    uFogDen: { value: 0.0004 },
    uNight: { value: 0 },
    tNoise: { value: noiseTexture(data, size) },
  };
}

export const CS_COMMON = /* glsl */`
uniform vec3 uSun, uSunCol, uSky, uGnd, uFogCol; uniform float uFogDen, uTime, uNight; uniform sampler2D tNoise;
vec3 csFog(vec3 c, float d){ float f = 1. - exp(-d * d * uFogDen * uFogDen); return mix(c, uFogCol, clamp(f, 0., 1.)); }
vec3 csAmbient(vec3 n){ return mix(uGnd, uSky, clamp(n.y * .5 + .5, 0., 1.)); }
vec3 csEnv(vec3 r){
  float h = clamp(r.y, -1., 1.);
  vec3 sky = mix(uFogCol, uSky * 1.5, smoothstep(0., .7, h));
  return mix(uGnd * 1.3, sky, smoothstep(-.12, .06, h));
}
vec3 csShade(vec3 alb, vec3 shade, vec3 n, vec3 v, float gloss, float ao){
  float ndl = dot(n, uSun), dif = clamp(ndl * .8 + .2, 0., 1.);
  vec3 col = alb * uSunCol * dif * dif * mix(.6, 1., ao) + alb * shade * csAmbient(n) * ao;
  vec3 h = normalize(uSun + v + vec3(0., 1e-5, 0.));
  float ndh = clamp(dot(n, h), 0., 1.), ndv = clamp(dot(n, v), 0., 1.);
  float sp = pow(ndh, mix(10., 120., gloss)) * mix(.05, 1.1, gloss * gloss) * smoothstep(-.1, .15, ndl);
  float fr = pow(1. - ndv, 4.);
  vec3 rt = mix(vec3(1.), alb / max(max(alb.r, max(alb.g, alb.b)), .05), .6 * gloss);
  col += uSunCol * sp * ao * mix(vec3(1.), rt, .4) + csEnv(reflect(-v, n)) * rt * (fr * mix(.04, .5, gloss) + .045 * gloss) * ao;
  return col;
}`;

// The vertex animation of a chessman. aRig = (part, pivotY, pivotZ, w): part 1 = the head (turns by an.x, nods by an.y
// about its pivot), 2 = a horse (rears by an.z about its pivot), 3 = its rider (rears with it and sways by an.y),
// 4 = a skirt (a bell of cloth in the wind of a run of strength an.z), 5 = an ear and 6 = a wing (beat about a
// vertical / a lengthwise hinge by w * (an.x + an.y * sin(time * an.z + an.w))), 7 = a leg (swings about its hip
// by an.z * sin(an.w + w)), 8 = a lower leg (it swings with its thigh and bends at its joint). an = iAnim (x, y, z, phase).
export const PIECE_ANIM = /* glsl */`
void csRotX(inout vec3 p, float a, vec3 piv){ float c = cos(a), s = sin(a); p -= piv; p = vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); p += piv; }
void csRotY(inout vec3 p, float a, vec3 piv){ float c = cos(a), s = sin(a); p -= piv; p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); p += piv; }
void csRotZ(inout vec3 p, float a, vec3 piv){ float c = cos(a), s = sin(a); p -= piv; p = vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z); p += piv; }
// heavy cloth in the wind of a run (k = how hard she runs): pressed against her in front, blown out and lifted
// behind, deep folds travelling round, the back of the hem snapping. The weight grows from the waist to the hem.
vec3 csSkirt(vec3 p, float k, float ph){
  float w = pow(clamp(1. - smoothstep(.9, 21., p.y), 0., 1.), 1.4);
  float ang = atan(p.x, p.z + 1e-4), t = uTime * 5. + ph, back = .5 - .5 * cos(ang), front = 1. - back;
  float fold = sin(ang * 6. - t * .8 + p.y * .25) * .1 + sin(ang * 9. + t * 1.4 - p.y * .4) * .045;
  float snap = sin(ang * 4. - t * 2.2) * .55 + sin(ang * 7. + t * 3.4) * .35;
  float rs = 1. + k * w * (.36 * back * back - .36 * front * front + fold * (.45 + back) + .07 * w * back * snap);
  vec3 q = vec3(p.x * rs, p.y, p.z * rs);
  q.z -= k * w * (1.2 + 4.4 * back * back);
  q.y += k * w * w * (.1 + 1.2 * back * back * back + .45 * back * snap);
  return q;
}
void csAnim(inout vec3 p, inout vec3 n, vec4 rig, vec4 an){
  vec3 piv = vec3(0., rig.y, rig.z), o = vec3(0.);
  if (rig.x > .5 && rig.x < 1.5) { csRotX(p, an.y, piv); csRotX(n, an.y, o); csRotY(p, an.x, piv); csRotY(n, an.x, o); }
  else if (rig.x > 1.5 && rig.x < 2.5) { csRotX(p, -an.z, piv); csRotX(n, -an.z, o); }
  else if (rig.x > 2.5 && rig.x < 3.5) {
    vec3 seat = vec3(0., rig.w, 0.);
    csRotZ(p, an.y, seat); csRotZ(n, an.y, o); csRotX(p, -an.z * .7, piv); csRotX(n, -an.z * .7, o);
  }
  else if (rig.x > 3.5 && rig.x < 4.5) {
    // the bell keeps its volume: the surface is moved as a whole and its normal taken from the moved surface
    vec3 tg = normalize(vec3(p.z, 0., -p.x) + vec3(1e-4, 0., 0.)), bt = normalize(cross(tg, n) + vec3(0., 1e-4, 0.));
    vec3 q = csSkirt(p, an.z, an.w), qa = csSkirt(p + tg * .3, an.z, an.w), qb = csSkirt(p + bt * .3, an.z, an.w);
    n = normalize(n * .02 - cross(qa - q, qb - q) * 11.); p = q;
  }
  else if (rig.x > 4.5 && rig.x < 5.5) {
    float a = rig.w * (an.x + an.y * sin(uTime * an.z + an.w)); vec3 pv = vec3(rig.y, 0., rig.z);
    csRotY(p, a, pv); csRotY(n, a, o);
  }
  else if (rig.x > 5.5 && rig.x < 6.5) {
    float a = rig.w * (an.x + an.y * sin(uTime * an.z + an.w)); vec3 pv = vec3(rig.z, rig.y, 0.);
    csRotZ(p, a, pv); csRotZ(n, a, o);
  }
  else if (rig.x > 6.5 && rig.x < 8.5) {
    // a leg of the fawn. At a walk each leg keeps its own phase (rig.w); in the bound (a wide swing, an.z over 0.5) the
    // forelegs go together and the hind legs against them, so the legs gather under the body and stretch out.
    // Part 7 is the thigh: it swings about the hip. Part 8 is the lower leg and hoof: it swings with its thigh about
    // the hip (2.05 m up, 0.92 m before or behind the middle) and bends at its own joint as the leg comes forward.
    float bound = smoothstep(.5, .8, an.z), ph = an.w + mix(rig.w, rig.z > 0. ? 0. : 3.1416, bound), a = an.z * sin(ph);
    if (rig.x > 7.5) {
      float b = sign(rig.z) * an.z * (1.2 + .7 * bound) * max(0., -cos(ph)); vec3 hip = vec3(0., 2.05, sign(rig.z) * .92);
      csRotX(p, b, piv); csRotX(n, b, o); csRotX(p, a, hip); csRotX(n, a, o);
    } else { csRotX(p, a, piv); csRotX(n, a, o); }
  }
}`;

const LIT_VERT = (anim, inst) => /* glsl */`
attribute vec3 aCol; attribute vec2 aMat; attribute vec4 aRig;
${inst ? 'attribute vec4 iCol, iShade, iAnim;' : 'uniform vec4 uICol, uIShade, uIAnim;'}
uniform float uTime;
varying vec3 vCol, vN, vW, vP; varying vec2 vMat; varying vec4 vICol, vIShade;
${anim}
void main(){
  vec4 ic = ${inst ? 'iCol' : 'uICol'}, ish = ${inst ? 'iShade' : 'uIShade'}, an = ${inst ? 'iAnim' : 'uIAnim'};
  vec3 p = position, n = normal;
  csAnim(p, n, aRig, an);
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
    m = modelMatrix * instanceMatrix;
  #endif
  vec4 w = m * vec4(p, 1.);
  vN = normalize(mat3(m) * n + vec3(0., 1e-6, 0.)); vW = w.xyz; vP = position;
  vCol = aCol; vMat = aMat; vICol = ic; vIShade = ish;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

// material ids (aMat.x): 0 piece body (takes the instance colour), 1 gold, 2 carved dark, 3 paint (vertex colour),
// 4 gem, 5 glow (vertex colour x aMat.y), 6 leaf (vertex colour, mottled by noise), 7 petal (vertex colour x instance tint),
// 8 a coat of hair (vertex colour with a nap; aMat.y 1 where it is dappled)
const LIT_FRAG = (extra) => /* glsl */`
${CS_COMMON}
varying vec3 vCol, vN, vW, vP; varying vec2 vMat; varying vec4 vICol, vIShade;
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-6, 0.)); if (!gl_FrontFacing) n = -n;
  vec3 toCam = cameraPosition - vW; float dist = length(toCam); vec3 v = toCam / max(dist, 1e-3);
  float id = vMat.x, gloss = vMat.y, ao = 1., eng = 1.;
  vec3 alb = vCol, shade = vec3(1.), col;
  ${extra || ''}
  if (id < .5) {
    ao = clamp(max(vCol.r, max(vCol.g, vCol.b)), 0., 1.);
    // A CHESSMAN'S SURFACE, from the piece's own shape (local metres): the lathe's rings round the turning, coarse and
    // fine; rims and beads (where the surface turns fast and stands proud) worn; grooves (where the profile lies
    // inside its neighbours) dark. Red: deep lacquer, darker in the grooves, worn to the wood on the rims. White: old
    // ivory, honey in the hollows, hairline cracks running up it. A band of green baize under every base.
    float white = step(.25, vICol.g), ang = atan(vP.x, vP.z + 1e-4) * .15915, hy = vP.y, nearK = 1. - smoothstep(60., 220., dist);
    vec2 gq = vec2(ang, hy * .11), fq = vec2(ang * 2., hy * .9);
    float gr = texture2D(tNoise, gq).r, grU = texture2D(tNoise, gq + vec2(0., .004)).r, fine = texture2D(tNoise, fq).g, fineU = texture2D(tNoise, fq + vec2(0., .02)).g;
    float curv = length(fwidth(n)) / max(length(fwidth(vP)), 1e-4);
    float edge = smoothstep(.2, .7, curv) * smoothstep(.7, .98, ao), groove = clamp((1. - ao) * 1.8, 0., 1.);
    n = normalize(n + vec3(0., ((gr - grU) * 4. + (fine - fineU) * 2. * nearK), 0.) * .5);
    vec3 base = vICol.rgb;
    if (white > .5) {
      alb = base * (.84 + .24 * gr + .1 * (fine - .5) * nearK);
      alb = mix(alb, base * vec3(.8, .56, .27), groove * .85);
      vec2 cq = vec2(ang * 3., hy * .035); float cn = texture2D(tNoise, cq).b, cf = fwidth(cn);
      float crack = (1. - smoothstep(0., cf + .0015, abs(cn - .5))) * smoothstep(.5, .66, texture2D(tNoise, cq * .37 + .21).a) * (1. - smoothstep(.02, .09, cf));
      alb *= 1. - .5 * crack;
      alb = mix(alb, base * vec3(1.1, 1.06, .98), edge * .5);
      gloss = vICol.a * (1. - .6 * groove);
    } else {
      alb = base * (.78 + .34 * gr);
      alb = mix(alb, base * vec3(.42, .3, .34), groove);
      float worn = edge * smoothstep(.3, .62, fine * .5 + gr * .5);
      alb = mix(alb, vec3(.5, .31, .14) * (.8 + .5 * fine), worn * .8);
      gloss = vICol.a * (1. - .8 * worn) * (.85 + .3 * gr);
    }
    float baize = 1. - smoothstep(.55, .7, hy);
    alb = mix(alb, vec3(.025, .15, .055) * (.7 + .6 * fine), baize); gloss *= 1. - baize;
    shade = vIShade.rgb;
    col = csShade(alb, shade, n, v, gloss, ao);
    // self light at night: white pieces glow all over, red ones (negative glow) stand in lamp light from their feet
    float gl = abs(vIShade.a), lampK = mix(1.5, .3, smoothstep(0., 30., vP.y));
    col += vIShade.a < 0. ? (alb * 1.7 + vec3(.04, .008, .0)) * vec3(1., .5, .3) * gl * lampK : alb * 1.15 * gl * (.55 + .45 * clamp(n.y * .5 + .5, 0., 1.));
    // the low sun catches a bright edge on the side it shines from
    col += (alb * .7 + .12) * uSunCol * pow(1. - clamp(dot(n, v), 0., 1.), 3.) * clamp(dot(n, uSun) + .3, 0., 1.) * .45 * ao * (1. - uNight);
    // no lit face clips to white: what is brighter than 1 is drawn in to a third of its excess
    float pm = max(col.r, max(col.g, col.b)); col *= pm > 1. ? (1. + (pm - 1.) * .33) / pm : 1.;
  } else if (id < 1.5) {
    float pg = 1. - step(.9, vICol.g);                                 // gilding on a chessman, not the crown's own gold
    float faz = (floor(atan(n.x, n.z + 1e-5) / .5236) + .5) * .5236, fel = (floor(asin(clamp(n.y, -1., 1.)) / .5236) + .5) * .5236;
    n = normalize(mix(n, vec3(sin(faz) * cos(fel), sin(fel), cos(faz) * cos(fel)), .6 * pg));
    vec3 r = reflect(-v, n);
    float ndh = clamp(dot(n, normalize(uSun + v + vec3(0., 1e-5, 0.))), 0., 1.);
    float hy = clamp(r.y, -1., 1.), gl = clamp(dot(n, uSun), 0., 1.), hm = texture2D(tNoise, vP.xz * .23 + vP.y * .19).r;
    vec3 envc = mix(uGnd * .5, mix(uFogCol * 1.1, uSky * .8, smoothstep(.05, .75, hy)), smoothstep(-.3, .04, hy + (hm - .5) * .25));
    col = vCol * eng * (envc * 1.15 + uSunCol * (pow(ndh, 50.) * 1.5 + .34 * gl * gl) + csAmbient(n) * .1);
    col += vCol * vec3(1., .55, .2) * pow(1. - clamp(dot(n, v), 0., 1.), 3.) * .25 + vCol * uNight * .25 + uSunCol * pow(ndh, 160.) * 1.2 * pg;
  } else if (id < 2.5) {
    col = csShade(vCol * vICol.rgb * .32, vIShade.rgb, n, v, .3, 1.);
  } else if (id < 3.5) {
    col = csShade(alb, shade, n, v, gloss, 1.) + alb * max(vIShade.a, 0.);
  } else if (id < 4.5) {
    float ndh = clamp(dot(n, normalize(uSun + v + vec3(0., 1e-5, 0.))), 0., 1.);
    float tw = .5 + .5 * sin(uTime * 3. + vP.x * 3.1 + vP.y * 2.3 + vP.z * 1.7);
    col = vCol * (.55 + .5 * clamp(dot(n, uSun), 0., 1.) + .5 * tw) + uSunCol * pow(ndh, 40.) * 1.5 + vCol * pow(1. - clamp(dot(n, v), 0., 1.), 2.) * .8;
  } else if (id < 5.5) {
    col = vCol * gloss;
  } else if (id > 7.5) {
    // a coat with a nap: fine hairs lying along the body, lighter and darker in drifts, pale dapples on the back; no
    // gloss, and a soft fringe of light where the coat turns away
    vec2 hq = vec2(vP.x * 2.3 + vP.y * 1.9, vP.z * .45);
    float nap = texture2D(tNoise, hq * 1.7).r, nap2 = texture2D(tNoise, hq * 6.1).g, drift = texture2D(tNoise, vP.zy * .13).b;
    alb = vCol * (.7 + .4 * nap + .25 * (nap2 - .5)) * (.82 + .36 * drift);
    alb = mix(alb, vec3(.86, .78, .62), smoothstep(.6, .68, texture2D(tNoise, vec2(vP.z * .21 + vP.x * .07, vP.y * .27)).a) * gloss * .75);
    vec3 nn = normalize(n + vec3(nap - .5, 0., nap2 - .5) * .6);
    float ndl = dot(nn, uSun), dif = clamp(ndl * .7 + .3, 0., 1.);
    col = alb * (uSunCol * dif * dif + csAmbient(nn) * 1.15) + alb * (uSunCol * .45 + uSky) * pow(1. - clamp(dot(n, v), 0., 1.), 2.5) * .55 + alb * max(vIShade.a, 0.);
  } else if (id > 6.5) {
    alb = vCol * vICol.rgb;
    col = csShade(alb, vec3(1.), n, v, .22, 1.) + alb * uSunCol * clamp(-dot(n, uSun), 0., 1.) * .4;
    // A WHITE PETAL in this sun would stand three times over the page's white: its light is drawn in above 0.45 so
    // that its brightest face stays under 0.92 (albedo and light together) and its shaded side and its folds still
    // tell; the whiter the petal the more (a red or orange petal keeps its light)
    float pm = max(col.r, max(col.g, col.b)), wh = min(alb.r, min(alb.g, alb.b)) / max(max(alb.r, max(alb.g, alb.b)), 1e-3);
    col *= mix(1., pm > .45 ? (.45 + .47 * (1. - exp(-(pm - .45) / .47))) / pm : 1., smoothstep(.3, .6, wh));
  } else {
    vec2 q = vW.xz + vW.y * vec2(.61, .37);
    float lf = texture2D(tNoise, q * .045).g, lf2 = texture2D(tNoise, q * .21).b, lf3 = texture2D(tNoise, q * .83).r, tuft = lf2 * .55 + lf3 * .45;
    alb = vCol * (.55 + .7 * lf) * mix(.34, 1.3, smoothstep(.3, .66, tuft));
    alb = mix(alb, alb * vec3(1.7, 1.4, .7), smoothstep(.6, .8, lf3) * .45);
    // may blossom on a hawthorn hedge (gloss 1 marks it): white sprays in drifts, a paler cast far off
    float mayK = gloss * smoothstep(.4, .62, lf);
    alb = mix(alb, vec3(.95, .92, .88), mayK * smoothstep(.63, .7, texture2D(tNoise, q * .9).a) * .95);
    vec3 nn = normalize(n + (vec3(lf2, lf3, lf) - .5) * 1.2);
    float ndl = dot(nn, uSun), dif = clamp(ndl * .7 + .3, 0., 1.);
    col = alb * (uSunCol * dif * dif + csAmbient(nn) * .95);
    col += alb * uSunCol * vec3(.5, .7, .2) * clamp(-ndl, 0., 1.) * .25;
  }
  gl_FragColor = vec4(csFog(col, dist), 1.);
}`;

// o: { anim: glsl defining csAnim(p, n, rig, an), instanced: bool, side, fragExtra, uniforms }
export function makeLit(env, o = {}) {
  const inst = o.instanced !== false;
  const uniforms = { ...env, ...(o.uniforms || {}) };
  if (!inst) {
    uniforms.uICol = { value: new THREE.Vector4(1, 1, 1, 0.3) }; uniforms.uIShade = { value: new THREE.Vector4(1, 1, 1, 0) }; uniforms.uIAnim = { value: new THREE.Vector4(0, 0, 0, 0) };
  }
  return new THREE.ShaderMaterial({
    uniforms, vertexShader: LIT_VERT(o.anim || PIECE_ANIM, inst), fragmentShader: LIT_FRAG(o.fragExtra),
    side: o.side ?? THREE.FrontSide,
  });
}

// ---------------------------------------------------------------- vertex builder
const _m3 = new THREE.Matrix3(), _v3 = new THREE.Vector3();
export class Geo {
  constructor() { this.P = []; this.N = []; this.C = []; this.M = []; this.R = []; this.I = []; this.count = 0; this._c = [1, 1, 1]; this._m = [3, 0.2]; this._r = [0, 0, 0, 0]; this._x = null; }
  col(c, k = 1) { this._c = [c[0] * k, c[1] * k, c[2] * k]; return this; }
  mat(id, gloss = 0.2) { this._m = [id, gloss]; return this; }
  rig(part = 0, a = 0, b = 0, w = 0) { this._r = [part, a, b, w]; return this; }
  xf(m) { this._x = m || null; if (m) _m3.setFromMatrix4(m); return this; }
  at(x, y, z, rx = 0, ry = 0, rz = 0, s = 1) { return this.xf(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(s, s, s))); }
  v(x, y, z, nx, ny, nz, k = 1, w) {
    if (this._x) {
      _v3.set(x, y, z).applyMatrix4(this._x); x = _v3.x; y = _v3.y; z = _v3.z;
      _v3.set(nx, ny, nz).applyMatrix3(_m3.setFromMatrix4(this._x)).normalize(); nx = _v3.x; ny = _v3.y; nz = _v3.z;
    }
    const c = this._c, r = this._r;
    this.P.push(x, y, z); this.N.push(nx, ny, nz); this.C.push(c[0] * k, c[1] * k, c[2] * k); this.M.push(this._m[0], this._m[1]);
    this.R.push(r[0], r[1], r[2], w === undefined ? r[3] : w);
    return this.count++;
  }
  // smooth patch: f(u, v) -> [x, y, z, shade = 1, w]; normal = dP/du x dP/dv (o.flip negates), o.wrapU closes u
  grid(nu, nv, f, o = {}) {
    const W = nu + 1, H = nv + 1, Q = new Array(W * H), base = this.count, flip = o.flip ? -1 : 1;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) Q[j * W + i] = f(i / nu, j / nv);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const il = i > 0 ? i - 1 : (o.wrapU ? nu - 1 : 0), ir = i < nu ? i + 1 : (o.wrapU ? 1 : nu);
      const a = Q[j * W + il], b = Q[j * W + ir], c = Q[Math.max(j - 1, 0) * W + i], d = Q[Math.min(j + 1, nv) * W + i], q = Q[j * W + i];
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - c[0], vy = d[1] - c[1], vz = d[2] - c[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz);
      if (l < 1e-12) { nx = 0; ny = o.poleY ?? 1; nz = 0; } else { nx *= flip / l; ny *= flip / l; nz *= flip / l; }
      this.v(q[0], q[1], q[2], nx, ny, nz, q[3] ?? 1, q[4]);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = base + j * W + i, b = a + 1, c = a + W + 1, d = a + W;
      if (o.flip) this.I.push(a, c, b, a, d, c); else this.I.push(a, b, c, a, c, d);
    }
    return this;
  }
  // surface of revolution about the Y axis: prims from a Prof (each one smooth, creased against the next).
  // o.mod(angle, r, y, t) -> [r, y, shade, w] reshapes a ring point (t = 0..1 along the whole profile)
  lathe(P, segs, o = {}) { const it = this.latheSteps(P, segs, o); while (!it.next().done); return this; }
  // the same, one prim per step (a generator: lets a long build hand the page back in between)
  *latheSteps(P, segs, o = {}) {
    const total = P.prims.reduce((s, p) => s + p.pts.length, 0); let seen = 0;
    for (const prim of P.prims) {
      const pts = prim.pts, n = pts.length - 1, s0 = seen; seen += pts.length;
      if (prim.mat) this.mat(prim.mat[0], prim.mat[1]); if (prim.rig) this.rig(...prim.rig);
      const keep = this._c; if (prim.mat && prim.mat[0] === 1) this._c = GOLD;
      this.grid(segs, n, (u, v) => {
        const k = Math.round(v * n), q = pts[k], a = u * TAU;
        let r = q[0], y = q[1], sh = q[2] ?? 1, w;
        if (o.mod) { const m = o.mod(a, r, y, (s0 + k) / total); r = m[0]; y = m[1]; if (m[2] !== undefined) sh *= m[2]; w = m[3]; }
        return [Math.sin(a) * r, y, Math.cos(a) * r, sh, w];
      }, { wrapU: true, poleY: pts[n][0] < 0.05 ? 1 : -1 });
      this._c = keep;
      yield;
    }
  }
  // round tube through points; rad: number or (t) => radius; closed ends are pinched
  tube(pts, rad, sides = 8, o = {}) {
    const n = pts.length - 1, fr = [];
    let up = new THREE.Vector3(0, 0, 1);
    for (let i = 0; i <= n; i++) {
      const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n)], t = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
      if (Math.abs(t.dot(up)) > 0.95) up = new THREE.Vector3(1, 0, 0);
      const s = new THREE.Vector3().crossVectors(up, t).normalize(), q = new THREE.Vector3().crossVectors(t, s).normalize();
      up = q; fr.push([s, q]);
    }
    const R = (t) => (typeof rad === 'function' ? rad(t) : rad);
    return this.grid(sides, n + 2, (u, v) => {
      const k = clamp(Math.round(v * (n + 2)) - 1, 0, n), cap = v === 0 || v === 1, a = u * TAU, r = cap ? 0.001 : R(k / n), p = pts[k], f = fr[k];
      const cx = Math.cos(a) * r, cy = Math.sin(a) * r;
      return [p[0] + f[0].x * cx + f[1].x * cy, p[1] + f[0].y * cx + f[1].y * cy, p[2] + f[0].z * cx + f[1].z * cy, o.shade ?? 1];
    }, { wrapU: true });
  }
  // ellipsoid; o.f(nx, ny, nz) -> radial scale
  blob(c, r, nu = 12, nv = 8, o = {}) {
    return this.grid(nu, nv, (u, v) => {
      const a = u * TAU, b = (clamp(v, 0.004, 0.996) - 0.5) * Math.PI, cb = Math.cos(b), x = Math.sin(a) * cb, y = Math.sin(b), z = Math.cos(a) * cb, k = o.f ? o.f(x, y, z) : 1;
      return [c[0] + x * r[0] * k, c[1] + y * r[1] * k, c[2] + z * r[2] * k, o.shade ? o.shade(x, y, z) : 1];
    }, { wrapU: true });
  }
  // flat-shaded box, centre c, size s
  box(c, s, shade = 1) {
    const hx = s[0] / 2, hy = s[1] / 2, hz = s[2] / 2;
    const F = [[1, 0, 0, 0, 1, 0, 0, 0, 1], [-1, 0, 0, 0, 1, 0, 0, 0, -1], [0, 1, 0, 0, 0, 1, 1, 0, 0], [0, -1, 0, 0, 0, 1, -1, 0, 0], [0, 0, 1, 1, 0, 0, 0, 1, 0], [0, 0, -1, -1, 0, 0, 0, 1, 0]];
    for (const [nx, ny, nz, ux, uy, uz, vx, vy, vz] of F) {
      const h = [hx, hy, hz], N = [nx * h[0], ny * h[1], nz * h[2]], U = [ux * h[0], uy * h[1], uz * h[2]], V = [vx * h[0], vy * h[1], vz * h[2]], id = [];
      for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) id.push(this.v(c[0] + N[0] + su * U[0] + sv * V[0], c[1] + N[1] + su * U[1] + sv * V[1], c[2] + N[2] + su * U[2] + sv * V[2], nx, ny, nz, shade));
      this.I.push(id[0], id[1], id[2], id[0], id[2], id[3]);
    }
    return this;
  }
  // flat polygon fan (points counter-clockwise seen from the normal side)
  poly(pts, shade = 1) {
    const a = pts[0], b = pts[1], c = pts[2];
    const n = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).cross(new THREE.Vector3(c[0] - a[0], c[1] - a[1], c[2] - a[2])).normalize(), id = pts.map((p) => this.v(p[0], p[1], p[2], n.x, n.y, n.z, shade, p[3]));
    for (let i = 1; i < id.length - 1; i++) this.I.push(id[0], id[i], id[i + 1]);
    return this;
  }
  get triangles() { return this.I.length / 3; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.C, 3)); g.setAttribute('aMat', new THREE.Float32BufferAttribute(this.M, 2));
    g.setAttribute('aRig', new THREE.Float32BufferAttribute(this.R, 4));
    g.setIndex(this.count > 65535 ? new THREE.Uint32BufferAttribute(this.I, 1) : new THREE.Uint16BufferAttribute(this.I, 1));
    g.computeBoundingSphere();
    return g;
  }
}

// A lathe profile drawn bottom to top, outward first: lines crease, curves and balls are smooth.
export function Prof(d = 1) {
  const prims = []; let r = 0, y = 0, mat = null, rig = null;
  const steps = (n) => Math.max(1, Math.round(n * (d > 0.5 ? 1 : d < -1.5 ? 0.15 : d < 0 ? 0.25 : 0.4)));
  const push = (pts) => { prims.push({ pts, mat, rig }); const e = pts[pts.length - 1]; r = e[0]; y = e[1]; };
  const P = {
    prims,
    at(r0, y0) { r = r0; y = y0; return P; },
    mat(id, gloss) { mat = [id, gloss]; return P; },
    rig(...a) { rig = a; return P; },
    line(r1, y1) { push([[r, y], [r1, y1]]); return P; },
    // b > 0 bulges outward, b < 0 is a cove
    curve(r1, y1, b, n = 6) {
      const dx = r1 - r, dy = y1 - y, cx = (r + r1) / 2 + dy * b, cy = (y + y1) / 2 - dx * b, k = steps(n), pts = [];
      for (let i = 0; i <= k; i++) { const t = i / k, s = 1 - t; pts.push([Math.max(0.001, s * s * r + 2 * s * t * cx + t * t * r1), s * s * y + 2 * s * t * cy + t * t * y1]); }
      push(pts); return P;
    },
    ball(cy, R, a0, a1, n = 8) {
      const k = steps(n), pts = [];
      for (let i = 0; i <= k; i++) { const a = lerp(a0, a1, i / k); pts.push([Math.max(0.001, R * Math.cos(a)), cy + R * Math.sin(a)]); }
      push(pts); return P;
    },
    // a turned bead: out, round, in
    bead(rOut, h, rIn) { const r0 = r; P.line(rOut, y + h * 0.18); P.curve(rOut, y + h * 0.82, 0.5, 4); P.line(rIn ?? r0, y + h * 0.18); return P; },
    // darken grooves: every point is shaded by how far it sits inside the widest ring near its height
    shade(win = 2.2, k = 0.55) {
      const all = []; for (const p of prims) for (const q of p.pts) all.push(q);
      for (const q of all) { let m = q[0]; for (const o of all) if (Math.abs(o[1] - q[1]) < win) m = Math.max(m, o[0]); q[2] = 1 - k * clamp((m - q[0]) / (win * 1.1), 0, 1); }
      return P;
    },
  };
  return P;
}

// A PROFILE FOR THE DISTANCE: the prims that share a material and a part are joined into one line each, and every
// point that stands less than `tol` off the straight line between the points kept on either side of it is left
// out (the turned rings of a chessman 400 m off run together: its outline is all that is seen of it, and the
// outline moves by less than tol).
function thinProf(P, tol) {
  const same = (a, b) => (a || []).join() === (b || []).join(), out = [];
  for (const p of P.prims) { const last = out[out.length - 1]; if (last && same(last.mat, p.mat) && same(last.rig, p.rig)) last.pts.push(...p.pts.slice(1)); else out.push({ pts: p.pts.slice(), mat: p.mat, rig: p.rig }); }
  const keep = (pts, i0, i1, on) => {
    const a = pts[i0], b = pts[i1], dr = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dr, dy) || 1; let w = 0, wi = -1;
    for (let i = i0 + 1; i < i1; i++) { const d = Math.abs((pts[i][0] - a[0]) * dy - (pts[i][1] - a[1]) * dr) / l; if (d > w) { w = d; wi = i; } }
    if (wi > 0 && w > tol) { keep(pts, i0, wi, on); on[wi] = true; keep(pts, wi, i1, on); }
  };
  for (const p of out) { const on = p.pts.map(() => false); on[0] = on[p.pts.length - 1] = true; keep(p.pts, 0, p.pts.length - 1, on); p.pts = p.pts.filter((q, i) => on[i]); }
  P.prims.length = 0; P.prims.push(...out);
  return P;
}
const DIST_TOL = 0.4, HORIZON_TOL = 0.8;

// ---------------------------------------------------------------- the chessmen
export const PIECES = {
  king: { h: 48, r: 9.5, head: 31.8 }, queen: { h: 45, r: 9, head: 30.2 }, bishop: { h: 37, r: 8, head: 25 },
  knight: { h: 34, r: 8.5, head: 7 }, rook: { h: 30, r: 8.5, head: 22.4 }, pawn: { h: 22, r: 6.5, head: 14.3 },
};
const foot = (P, R) => P.at(0.001, 0).line(R * 0.97, 0).line(R, 0.4).curve(R * 0.97, 2.0, 0.34, 5).line(R * 0.85, 2.35).curve(R * 0.75, 3.5, 0.3, 4).line(R * 0.68, 3.8);
const collars = (P, y, r, s = 1) => P.line(r * 1.85, y + 0.5 * s).curve(r * 1.85, y + 2.3 * s, 0.5, 5).line(r * 1.1, y + 2.8 * s).line(r * 1.42, y + 3.3 * s).curve(r * 1.42, y + 4.4 * s, 0.5, 4).line(r * 1.05, y + 4.8 * s);
// two small carved notches where a face would be: a hint, no more
function eyes(g, y, r, sp = 0.3, s = 1) {
  g.mat(2, 0.3);
  for (const sg of [-1, 1]) g.blob([Math.sin(sg * sp) * r, y, Math.cos(sg * sp) * r], [0.42 * s, 0.62 * s, 0.3 * s], 6, 4);
  g.mat(0, 0);
}

// THE MAKES of a chessman, by d: 1 the fine one (24 sides), 0 the middle one (10), -1 the plain one (6), -2 the
// caster's (5 sides and fewer rows still: it casts the shadow of a piece that stands near), -2.5 the distant one
// (the caster's with its outline thinned to within DIST_TOL: for a piece hundreds of metres off and for the
// shadows of all that stand further away), -3 the horizon's one (4 sides, its outline kept within HORIZON_TOL, a
// horse of the fewest faces and no ears: for the ranks drawn up beyond the board, which stand in the haze as
// churches do).
export function pieceGeometry(kind, d = 1) { const it = pieceSteps(kind, d); for (;;) { const r = it.next(); if (r.done) return r.value; } }
// the same in short steps: `pause` is an async hand-back (the world's ctx.yield)
export async function pieceGeometryAsync(kind, d, pause) { const it = pieceSteps(kind, d); for (;;) { const r = it.next(); if (r.done) return r.value; await pause(); } }
function* pieceSteps(kind, d = 1) {
  const g = new Geo(), hi = d > 0.5, dist = d < -1.5, thin = d < -2.25, hor = d < -2.75, segs = hi ? 24 : hor ? 4 : dist ? 5 : d < 0 ? 6 : 10, K = PIECES[kind], R = K.r, P = Prof(d);
  // (the distant make's profile is thinned to its outline, DIST_TOL = 0.4 m: less than a dot of the picture at
  // 400 m; the horizon's to HORIZON_TOL)
  const lathe = (o) => g.latheSteps(thin ? thinProf(P, hor ? HORIZON_TOL : DIST_TOL) : P, segs, o);
  g.mat(0, 0).rig(0);
  if (kind === 'pawn') {
    foot(P, R).curve(2.4, 12.2, -0.2, 10).line(4.4, 12.6).curve(4.4, 13.9, 0.5, 5).line(2.6, 14.3);
    P.rig(1, K.head, 0, 0).ball(18.2, 3.9, -0.84, 1.565, 12).shade();
    yield* lathe();
    if (hi) { g.rig(1, K.head, 0, 0); eyes(g, 18.9, 3.75, 0.33, 0.9); }
  } else if (kind === 'rook') {
    foot(P, R).curve(5.3, 9, -0.2, 6).line(5.15, 12.4).bead(5.6, 0.9, 5.1).line(5.0, 16.6).bead(5.45, 0.9, 4.95).line(4.9, 20).line(6.6, 20.6).curve(6.6, 22.0, 0.5, 4).line(5.6, 22.4);
    P.rig(1, K.head, 0, 0).curve(7.1, 24.0, -0.18, 4).line(7.1, 26.4).line(5.5, 26.4).line(5.5, 25.6).line(0.001, 25.6).shade(1.6, 0.5);
    yield* lathe();
    g.rig(1, K.head, 0, 0);
    const nM = 6, a = hi ? 4 : 1;                                     // battlements
    for (let i = 0; i < nM; i++) {
      const a0 = (i + 0.2) / nM * TAU, a1 = (i + 0.8) / nM * TAU, pt = (r, y, t) => { const an = lerp(a0, a1, t); return [Math.sin(an) * r, y, Math.cos(an) * r]; };
      g.grid(a, 1, (u, v) => pt(7.1, lerp(26.4, 29.9, v), u));                                   // outer face
      g.grid(a, 1, (u, v) => pt(5.5, lerp(26.4, 29.9, v), u), { flip: true });                    // inner face
      g.grid(a, 1, (u, v) => pt(lerp(7.1, 5.5, v), 29.9, u));                                    // top
      g.poly([pt(7.1, 26.4, 0), pt(5.5, 26.4, 0), pt(5.5, 29.9, 0), pt(7.1, 29.9, 0)]);
      g.poly([pt(5.5, 26.4, 1), pt(7.1, 26.4, 1), pt(7.1, 29.9, 1), pt(5.5, 29.9, 1)]);
    }
    if (hi) {                                                          // arrow slits and a door, carved dark
      g.mat(2, 0.3);
      for (const sg of [-1, 1]) g.blob([Math.sin(sg * 0.34) * 7.0, 25.0, Math.cos(sg * 0.34) * 7.0], [0.34, 1.0, 0.3], 6, 4);
      g.rig(0); g.blob([0, 5.4, R * 0.7], [1.1, 1.9, 0.5], 8, 5); g.mat(0, 0);
    }
  } else if (kind === 'bishop') {
    foot(P, R).curve(2.6, 20.2, -0.2, 12); collars(P, 20.2, 2.6);
    P.rig(1, K.head, 0, 0).curve(4.5, 28.4, 0.2, 6).curve(0.95, 34.3, 0.2, 9).ball(35.6, 1.3, -0.82, 1.565, 6).shade();
    // the mitre's cut: a slanting groove on the front
    yield* lathe({ mod: (a, r, y) => { const z = Math.cos(a) * r, k = y > 26 && y < 33.5 && z > 0 ? Math.abs((y - 28.0) - z * 0.95) : 9; return k < 0.5 ? [r * 0.86, y, 0.12] : [r, y]; } });
    if (hi) { g.rig(1, K.head, 0, 0); eyes(g, 27.4, 4.1, 0.36); }
  } else if (kind === 'king' || kind === 'queen') {
    const kg = kind === 'king', ys = kg ? 27 : 25.4, rs = kg ? 3.2 : 3.0, yh = K.head;
    foot(P, R).curve(rs, ys, -0.2, 12); collars(P, ys, rs);
    P.rig(1, yh, 0, 0).curve(kg ? 5.9 : 5.7, yh + 6.6, -0.13, 7);
    P.mat(1, 0.8).bead(kg ? 6.5 : 6.2, 1.5, kg ? 5.3 : 5.1).mat(0, 0);
    const yr = yh + 6.6 + 1.5 * 0.18 + 0.2;
    if (kg) P.curve(0.9, yr + 2.6, 0.26, 6).line(0.001, yr + 2.6); else P.curve(1.0, yr + 2.9, 0.3, 6).mat(1, 0.8).ball(yr + 4.1, 1.5, -0.8, 1.565, 6).mat(0, 0);
    P.shade();
    yield* lathe();
    g.rig(1, yh, 0, 0);
    if (kg) {                                                          // the cross
      g.mat(1, 0.8).col(GOLD); g.box([0, yr + 4.9, 0], [1.2, 5.6, 1.2]); g.box([0, yr + 5.5, 0], [4.2, 1.2, 1.2]); g.col([1, 1, 1]).mat(0, 0);
    } else {                                                           // the coronet: a ring of points, each tipped with a gold ball
      const nP = hi ? 9 : dist ? 4 : d < 0 ? 5 : 6;
      for (let i = 0; i < nP; i++) {
        const a = (i + 0.5) / nP * TAU, s = Math.sin(a), c = Math.cos(a);
        g.mat(0, 0).tube([[s * 5.5, yr - 0.6, c * 5.5], [s * 6.0, yr + 1.4, c * 6.0], [s * 6.5, yr + 3.2, c * 6.5]], (t) => 0.95 - 0.7 * t, hi ? 6 : dist ? 3 : 4);
        g.mat(1, 0.8).col(GOLD).blob([s * 6.55, yr + 3.5, c * 6.55], [0.62, 0.62, 0.62], hi ? 6 : dist ? 3 : 4, hi ? 4 : dist ? 2 : 3).col([1, 1, 1]);
      }
      g.mat(0, 0);
    }
    if (hi) eyes(g, yh + 3.6, kg ? 4.75 : 4.6, 0.3);
  } else if (kind === 'knight') {
    foot(P, R).curve(6.3, 5.2, -0.15, 4).line(7.1, 5.6).curve(7.1, 6.6, 0.5, 4).line(6.1, 7.0).line(0.001, 7.0).shade(1.5, 0.4);
    yield* lathe();
    yield* horse(g, hi, d);
  }
  return g.build();
}

// A carved horse on the knight's base (facing +Z), hind hooves planted at the pivot, and its rider.
function* horse(g, hi, d = 0) {
  const dist = d < -1.5, thin = d < -2.25, hor = d < -2.75, nu = hi ? 14 : hor ? 3 : dist ? 4 : d < 0 ? 5 : 7, nv = hi ? 9 : hor ? 2 : d < 0 ? 3 : 5, ts = hi ? 8 : d < 0 ? 3 : 5, piv = [2, 7.0, -4.2, 0];
  g.mat(0, 0).rig(...piv);
  const belly = (x, y, z) => 1 - 0.12 * Math.max(0, -y);
  g.blob([0, 15.6, 0], [3.3, 3.5, 6.8], nu, nv, { f: belly, shade: (x, y) => 0.72 + 0.28 * clamp(y + 0.9, 0, 1) });   // barrel
  g.blob([0, 16.4, -4.6], [3.2, 3.6, 3.4], nu, nv);                                                                // croup
  g.blob([0, 16.6, 4.6], [3.0, 3.8, 3.2], nu, nv);                                                                 // chest
  yield;
  for (const sg of [-1, 1]) {
    // (the horizon's horse stands on straight legs: hip to hoof in one length)
    g.tube(hor ? [[sg * 2.0, 15.4, -5.0], [sg * 2.2, 7.15, -4.2]] : [[sg * 2.0, 15.4, -5.0], [sg * 2.3, 11.6, -6.0], [sg * 2.2, 9.4, -4.4], [sg * 2.2, 7.15, -4.2]], (t) => 1.75 - 1.0 * t, ts, { shade: 0.86 });   // hind legs
    g.tube(hor ? [[sg * 1.9, 15.2, 5.0], [sg * 2.0, 7.15, 5.8]] : [[sg * 1.9, 15.2, 5.0], [sg * 2.0, 12.0, 6.4], [sg * 2.0, 9.6, 5.6], [sg * 2.0, 7.15, 5.8]], (t) => 1.5 - 0.85 * t, ts, { shade: 0.86 });      // forelegs
    if (!hor) g.tube([[sg * 0.95, 27.9, 7.5], [sg * 1.25, 29.9, 7.1]], (t) => 0.55 - 0.42 * t, dist ? 3 : 5);                                                        // ears
  }
  yield;
  g.tube([[0, 17.2, 4.8], [0, 20.6, 6.4], [0, 24.2, 7.6], [0, 26.6, 8.6]], (t) => 3.0 - 1.1 * t, ts + 2);                                                  // neck
  g.at(0, 26.6, 9.9, 0.62, 0, 0).blob([0, 0, 0], [1.55, 1.95, 3.5], nu, nv, { f: (x, y, z) => 1 - 0.25 * Math.max(0, z) });                                // head
  g.xf(null);
  if (hi) for (let i = 0; i < 8; i++) {                                                                                                                    // mane: carved locks down the neck
    const t = i / 7, sg = i % 2 ? 1 : -1;
    g.at(sg * 0.5, lerp(27.6, 18.4, t), lerp(7.4, 3.3, t), -0.9, sg * 0.5, 0).blob([0, 0, 0], [0.75, 1.9, 0.6], 6, 4, { shade: (x, y) => 0.5 + 0.35 * clamp(y + 0.5, 0, 1) }); g.xf(null);
  } else if (!hor) { g.at(0, 22.6, 5.2, -0.36, 0, 0).blob([0, 0, 0], [0.55, 4.9, 1.7], dist ? 3 : 5, nv, { shade: () => 0.6 }); g.xf(null); }
  g.tube(hor ? [[0, 17.2, -6.6], [0, 12.6, -10.4], [0, 9.4, -9.8]] : [[0, 17.2, -6.6], [0, 16.4, -9.4], [0, 12.6, -10.4], [0, 9.4, -9.8]], (t) => 1.15 - 0.8 * t, ts, { shade: 0.7 });                                 // tail
  g.mat(1, 0.7).col(GOLD).blob([0, 19.0, -0.9], [3.0, 1.0, 3.0], nu, dist ? 3 : 5).col([1, 1, 1]).mat(0, 0);                                                          // saddle cloth
  if (hi) { g.mat(2, 0.3); for (const sg of [-1, 1]) g.blob([sg * 1.42, 27.5, 9.3], [0.3, 0.42, 0.42], 6, 4); g.mat(0, 0); }
  yield;
  // the rider: a turned figure in the saddle with a helmet ball and a lance
  g.rig(3, piv[1], piv[2], 19.4);
  const P = Prof(hi ? 1 : d).at(0.001, 19.3).line(2.7, 19.3).curve(1.5, 24.3, -0.12, 5).line(2.3, 24.6).curve(2.3, 25.5, 0.5, 3).line(1.35, 25.8).ball(27.6, 2.05, -0.85, 1.565, 7).shade(1.4, 0.5);
  g.at(0, 0, -0.9); yield* g.latheSteps(thin ? thinProf(P, hor ? HORIZON_TOL : DIST_TOL) : P, hi ? 16 : hor ? 4 : dist ? 5 : 7);
  g.mat(1, 0.8).col(GOLD).blob([0, 30.2, 0], [0.7, 0.9, 0.7], dist ? 4 : 6, dist ? 2 : 4).col([1, 1, 1]).mat(0, 0);
  g.tube([[2.9, 19.8, 0.4], [3.2, 27, 1.6], [3.5, 34, 2.8]], (t) => 0.4 - 0.2 * t, dist ? 3 : 5);
  if (hi) eyes(g, 27.9, 1.95, 0.4, 0.55);
  g.xf(null).rig(0);
}

// A GEOMETRY OF ITS OWN ON SHARED VERTICES: the same vertex data (shared, not copied) under a new geometry, so
// that each instanced set built on one make carries its own per-instance attributes. (Set on the make itself, the
// last set built lends its colours, its animation and its count to every other set on that make.)
export function ownGeometry(g) {
  const o = new THREE.BufferGeometry();
  for (const [k, a] of Object.entries(g.attributes)) if (!a.isInstancedBufferAttribute) o.setAttribute(k, a);
  o.setIndex(g.index); o.boundingSphere = g.boundingSphere; o.boundingBox = g.boundingBox; o.userData = g.userData;
  return o;
}

// ---------------------------------------------------------------- instanced chessmen of one kind
const _mat = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _p = new THREE.Vector3(), _s = new THREE.Vector3();
export function makePieces(env, o) {
  const n = o.count, geo = o.geometry || pieceGeometry(o.kind, o.detail ?? 1), K = PIECES[o.kind] || null;
  const iCol = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4), iShade = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4), iAnim = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
  iAnim.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('iCol', iCol); geo.setAttribute('iShade', iShade); geo.setAttribute('iAnim', iAnim);
  const mesh = new THREE.InstancedMesh(geo, o.material || makeLit(env), n);
  mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const api = {
    kind: o.kind, K, mesh, geometry: geo, count: n, iAnim,
    // white: ivory, else lacquer red; glow: self light (night; negative = lit by lamps at its feet)
    color(i, white, glow = 0, k = 1) {
      const c = white ? IVORY : RED, s = white ? IVORY_SHADE : RED_SHADE;
      iCol.setXYZW(i, c[0] * k, c[1] * k, c[2] * k, white ? GLOSS_IVORY : GLOSS_LACQUER); iShade.setXYZW(i, s[0], s[1], s[2], glow);
      iCol.needsUpdate = true; iShade.needsUpdate = true;
    },
    tint(i, c, gloss = 0.3, glow = 0) { iCol.setXYZW(i, c[0], c[1], c[2], gloss); iShade.setXYZW(i, 1, 1, 1, glow); iCol.needsUpdate = true; iShade.needsUpdate = true; },
    // lean: radians about the piece's own X (forward) and Z (sideways); squash: bob as a stretch in Y
    place(i, x, y, z, yaw = 0, leanX = 0, leanZ = 0, squash = 1, scale = 1) {
      _e.set(leanX, yaw, leanZ); _q.setFromEuler(_e);
      const w = scale / Math.sqrt(Math.max(squash, 0.2));
      _mat.compose(_p.set(x, y, z), _q, _s.set(w, scale * squash, w)); mesh.setMatrixAt(i, _mat);
    },
    anim(i, a, b, c, ph = 0) { iAnim.setXYZW(i, a, b, c, ph); },
    commit() { mesh.instanceMatrix.needsUpdate = true; iAnim.needsUpdate = true; },
    // a second instanced mesh on the same matrices and animation (a shadow caster, a mirror image)
    twin(material, detail = 0, g2 = pieceGeometry(o.kind, detail)) {
      const g3 = ownGeometry(g2); g3.setAttribute('iAnim', iAnim);
      const m2 = new THREE.InstancedMesh(g3, material, n); m2.instanceMatrix = mesh.instanceMatrix; m2.frustumCulled = false;
      return m2;
    },
  };
  return api;
}

// THE SKIRT'S LAW IN JS, number for number as csSkirt in the shader above (the two are one law: change them together).
// skirtAt: where a point (x, y, z) of the skirt at rest stands at a run of strength k when the cloth's clock stands
// at t (the shader's uTime * 5 + its phase). skirtReach: how far behind her axis the cloth of a lathe point (radius
// r, height y) is blown at the most: the back of the hem (straight behind her), both folds and both snaps at
// their largest together. The world stands her clear of what lies behind her by it.
const SK_FOLD = [0.1, 0.045], SK_SNAP = [0.55, 0.35];
const skirtW = (y) => Math.pow(clamp(1 - smoothstep(0.9, 21, y), 0, 1), 1.4);
const skirtCore = (x, y, z, k, back, fold, snap) => {
  const w = skirtW(y), front = 1 - back, rs = 1 + k * w * (0.36 * back * back - 0.36 * front * front + fold * (0.45 + back) + 0.07 * w * back * snap);
  return [x * rs, y + k * w * w * (0.1 + 1.2 * back * back * back + 0.45 * back * snap), z * rs - k * w * (1.2 + 4.4 * back * back)];
};
export const skirtAt = (x, y, z, k, t) => {
  const ang = Math.atan2(x, z + 1e-4), back = 0.5 - 0.5 * Math.cos(ang);
  return skirtCore(x, y, z, k, back, Math.sin(ang * 6 - t * 0.8 + y * 0.25) * SK_FOLD[0] + Math.sin(ang * 9 + t * 1.4 - y * 0.4) * SK_FOLD[1], Math.sin(ang * 4 - t * 2.2) * SK_SNAP[0] + Math.sin(ang * 7 + t * 3.4) * SK_SNAP[1]);
};
export const skirtReach = (r, y, k = 1) => -skirtCore(0, y, -r, k, 1, SK_FOLD[0] + SK_FOLD[1], SK_SNAP[0] + SK_SNAP[1])[2];

// soft blob shadows under things (multiply-like dark discs, stretched away from the sun)
export function makeBlobs(env, n) {
  const g = new THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2);
  const m = new THREE.ShaderMaterial({
    uniforms: env, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
    vertexShader: /* glsl */`varying vec2 vQ; varying vec3 vW; void main(){ vQ = position.xz; vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`${CS_COMMON} varying vec2 vQ; varying vec3 vW; void main(){ float a = 1. - smoothstep(.35, 1., length(vQ)); gl_FragColor = vec4(vec3(.03, .05, .12), a * .55 * (1. - clamp(1. - exp(-pow(length(cameraPosition - vW) * uFogDen, 2.)), 0., 1.))); }`,
  });
  const mesh = new THREE.InstancedMesh(g, m, n); mesh.frustumCulled = false; mesh.renderOrder = 0.6;
  return {
    mesh,
    place(i, x, y, z, r, sun) {
      const h = Math.hypot(sun.x, sun.z) || 1, k = clamp(1.2 / Math.max(sun.y, 0.2), 1, 3.2);
      _e.set(0, Math.atan2(-sun.x / h, -sun.z / h), 0); _q.setFromEuler(_e);
      _mat.compose(_p.set(x - sun.x / h * r * (k - 1) * 0.8, y + 0.12, z - sun.z / h * r * (k - 1) * 0.8), _q, _s.set(r, 1, r * k)); mesh.setMatrixAt(i, _mat);
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

// a length of hawthorn hedge along Z: a lumpy loaf, leaf-shaded (mat 6)
export function hedgeGeometry(rng, o = {}) {
  const L = o.length ?? 84, W = o.width ?? 3.6, H = o.height ?? 3.6, nz = o.steps ?? 28, na = o.around ?? 6, g = new Geo();
  const ph = [rng.range(0, 9), rng.range(0, 9), rng.range(0, 9)], c = o.color || [0.032, 0.125, 0.036];
  // a clipped hedge: a swell is drawn only if the hedge's steps can draw it round (six steps to a wave for its whole
  // height, none under three), so that no make of the hedge has a saw-toothed top
  const fine = (w) => clamp((TAU / w / (L / nz) - 3) / 3, 0, 1);
  g.mat(6, 1).col(c).rig(0);
  g.grid(nz, na, (u, v) => {
    const z = (u - 0.5) * L, a = (v - 0.5) * Math.PI, e = Math.min(1, Math.min(u, 1 - u) * nz * 0.9);
    const lump = 1 + 0.2 * fine(0.53) * Math.sin(z * 0.53 + ph[0] + a * 2.1) + 0.16 * fine(1.31) * Math.sin(z * 1.31 + ph[1] - a * 1.7) + 0.12 * fine(2.9) * Math.sin(z * 2.9 + ph[2] + a * 2.6) + 0.08 * fine(5.3) * Math.sin(z * 5.3 + ph[0] * 3 - a * 2.2);
    const r = lump * Math.sqrt(e) + 0.02, sa = Math.sin(a), ca = Math.max(0, Math.cos(a));
    return [Math.sign(sa) * Math.pow(Math.abs(sa), 0.62) * W * 0.5 * r, Math.pow(ca, 0.55) * H * r, z, 0.5 + 0.5 * ca, ca];
  });
  return g.build();
}

// ---------------------------------------------------------------- the red queen at full run
// Her own measures in metres (local space). Four are given: the radius of her hem, the height of the band above it,
// of her waist and of her head's pivot. Her profile is drawn from them once, here, and the lathe turns that same
// profile; the two measures the world's route also reads are read back from the profile's own points: `collar` is the
// top of her widest collar ring, `crown` the highest point of the profile (the top of the ball on her crown).
const RUN_IN = { hem: 11.3, band: 9.6, waist: 24.4, head: 29.2 };
function runnerProfile() {
  const P = Prof(1), yw = RUN_IN.waist, yh = RUN_IN.head;
  // the cloth's last 1.6 m hangs straight to the turf and a little into the grass: no daylight under her hem at a stand
  P.at(RUN_IN.hem + 0.1, -0.7).line(RUN_IN.hem, 0.9).curve(11.0, 2.3, 0.5, 4).line(10.4, 2.6).curve(7.5, RUN_IN.band, -0.1, 7).bead(8.0, 1.0, 7.2).curve(5.0, 17.2, -0.1, 7).bead(5.5, 0.9, 4.8).curve(2.9, yw, -0.08, 7);
  const i0 = P.prims.length;
  collars(P, yw, 2.9);
  const i1 = P.prims.length;
  P.rig(1, yh, 0, 0).curve(5.7, yh + 6.6, -0.13, 7);
  const last = P.prims[P.prims.length - 1].pts, yr = last[last.length - 1][1] + 1.5 * 0.18 + 0.2;       // the root of the coronet's points: the gold ring's first step and 0.2 m
  P.mat(1, 0.8).bead(6.2, 1.5, 5.1).mat(0, 0);
  P.curve(1.0, yr + 2.9, 0.3, 6).mat(1, 0.8).ball(yr + 4.1, 1.5, -0.8, 1.565, 6).mat(0, 0).shade();
  let rMax = 0, collar = yw, crown = 0;
  for (let i = i0; i < i1; i++) for (const q of P.prims[i].pts) rMax = Math.max(rMax, q[0]);
  for (let i = i0; i < i1; i++) for (const q of P.prims[i].pts) if (q[0] > rMax - 1e-6) collar = Math.max(collar, q[1]);
  for (const p of P.prims) for (const q of p.pts) crown = Math.max(crown, q[1]);
  return { P, yr, collar, crown, skirtEnd: i0 };
}
const RUN_PROF = runnerProfile();
export const RUNNER = { ...RUN_IN, collar: RUN_PROF.collar, crown: RUN_PROF.crown };
// the skirt's pleats swell the lathe's radius by PLEAT[0] and PLEAT[1] of the cloth's weight at the most (the two
// waves the lathe lays round her, below)
const PLEAT = [0.05, 0.02];
// lo: the same figure in few triangles (20 round instead of 64, no small parts), for the shadow she casts
function* runningQueenSteps(lo = false) {
  const g = new Geo(), P = RUN_PROF.P, yw = RUNNER.waist, yh = RUNNER.head, yr = RUN_PROF.yr;
  g.mat(0, 0).rig(4, 0, 0, 0);
  // the skirt falls in pleats from the waist (the shader blows it about as cloth)
  yield* g.latheSteps(P, lo ? 20 : 64, { mod: (a, r, y) => { if (y > yw) return [r, y]; const w = Math.pow(1 - smoothstep(0.9, 21, y), 1.4); return [r * (1 + PLEAT[0] * w * Math.sin(a * 10) + PLEAT[1] * w * Math.sin(a * 17 + 1)), y, 1 - 0.16 * w * (0.5 - 0.5 * Math.sin(a * 10)), w]; } });
  // the round foot she stands on, in the shade under the skirt
  const F = Prof(1).at(0.001, 0).line(5.0, 0).line(5.15, 0.45).curve(5.0, 2.0, 0.34, 5).line(4.4, 2.4).curve(3.4, 9.5, -0.12, 6).line(3.0, 17);
  g.mat(0, 0).rig(0);
  yield* g.latheSteps(F, lo ? 8 : 20, { mod: (a, r, y) => [r, y, 0.6] });
  g.rig(1, yh, 0, 0);
  for (let i = 0; i < (lo ? 0 : 9); i++) {
    const a = (i + 0.5) / 9 * TAU, s = Math.sin(a), c = Math.cos(a);
    g.mat(0, 0).tube([[s * 5.5, yr - 0.6, c * 5.5], [s * 6.1, yr + 1.6, c * 6.1], [s * 6.7, yr + 3.8, c * 6.7]], (t) => 1.0 - 0.75 * t, 6);
    g.mat(1, 0.8).col(GOLD).blob([s * 6.75, yr + 4.1, c * 6.75], [0.68, 0.68, 0.68], 6, 4).col([1, 1, 1]);
  }
  g.mat(0, 0); if (!lo) eyes(g, yh + 3.6, 4.6, 0.3);
  // her arms: one pointing on down the lane, one swung back
  g.rig(0).mat(0, 0);
  g.tube([[2.4, yw + 2.9, 0.4], [4.4, yw + 1.6, 5.2], [4.9, yw + 3.6, 10.4]], (t) => 1.05 - 0.4 * t, lo ? 4 : 7).blob([5.0, yw + 4.1, 11.3], [0.85, 0.85, 1.1], lo ? 4 : 7, lo ? 3 : 5);
  g.tube([[-2.4, yw + 2.9, 0.2], [-5.0, yw - 0.6, -1.6], [-5.8, yw - 2.6, -5.6]], (t) => 1.05 - 0.4 * t, lo ? 4 : 7).blob([-5.9, yw - 3.0, -6.4], [0.85, 0.85, 1.0], lo ? 4 : 7, lo ? 3 : 5);
  return g.build();
}

// THE STRAWS THAT STREAM UNDER HER: each runs back along her lane from STREAM_HALF before her axis to STREAM_HALF
// behind it and begins again (the wrap, by the clock); it is whole within STREAM_FADE[0] of her axis and has shrunk
// to nothing, breadth and height, at STREAM_FADE[1]: so nothing of a straw is drawn further before or behind her
// than that and half the longest straw's length (STRAW_LEN), which is STREAM_REACH. Where her lane leaves her less
// room than that (a brook before her or behind her), the one who builds her says how much there is (strawReach) and
// the whole stream is drawn in by that share: where a straw begins, its wrap and its fade alike.
const STREAM_HALF = 45, STREAM_FADE = [26, 44], STRAW_LEN = [3, 7], STREAM_REACH = STREAM_FADE[1] + STRAW_LEN[1] / 2;
const streamAnim = (s) => /* glsl */`
void csAnim(inout vec3 p, inout vec3 n, vec4 rig, vec4 an){
  float zc = mod(rig.y - uTime * rig.w + ${(STREAM_HALF * s).toFixed(3)}, ${(2 * STREAM_HALF * s).toFixed(3)}) - ${(STREAM_HALF * s).toFixed(3)}, k = (1. - smoothstep(${(STREAM_FADE[0] * s).toFixed(3)}, ${(STREAM_FADE[1] * s).toFixed(3)}, abs(zc))) * an.x;
  p.z += zc - rig.y; p.x = rig.z + (p.x - rig.z) * k; p.y *= k;
}`;

// THE DUST OF HER RUN: chalk dust in round billows, pale as the dust of a white road, that leave the rear rim of her
// hem one after another, roll back along her lane swelling to twice their size, lift no higher than her hem's band
// and thin away as they settle; among them clods of turf and straws thrown up from under the hem, which fall back.
// A billow is a body with a clear outline, lit on top and shaded beneath: it is seen as a thing, not as a stain.
// ITS MARGIN, in her own measure: no billow's edge leaves DUST_REACH = one and a half of her hem's sweep from her
// axis (its place at most 0.7 of the sweep, spreading by 0.2 as it rolls, and 5.2 m of its own body), and its tail
// ends DUST_TAIL = 31 m behind her hem's rim at her fastest, and nearer by her pace.
// rig = (phase, x, rise, drift); aMat = (0 puff | 1 clod or straw, a draw of its own for its tempo)
export const DUST_REACH = 1.5, DUST_TAIL = 31;
// HER WAKE at a full run, in metres from her axis, each read from its own make: `skirt` the furthest behind her that
// her cloth is blown (the lathe's own profile points under her waist, the pleats' swell on them, by the skirt's
// law); `dust` the furthest behind her that a billow's middle is carried before it has thinned to nothing (her
// hem's rim and the dust's tail; its last body, clear as air by then, reaches 5.2 m further); `straws` the full
// reach of the stream under her, before her and behind her alike. The world stands her by these.
export const RUN_WAKE = (() => {
  let skirt = 0;
  for (let i = 0; i < RUN_PROF.skirtEnd; i++) for (const q of RUN_PROF.P.prims[i].pts) if (q[1] <= RUNNER.waist) skirt = Math.max(skirt, skirtReach(q[0] * (1 + (PLEAT[0] + PLEAT[1]) * skirtW(q[1])), q[1]));
  return { skirt, dust: RUNNER.hem + DUST_TAIL, straws: STREAM_REACH };
})();
const DUST_VERT = /* glsl */`
attribute vec4 aRig; attribute vec2 aMat; attribute vec3 aCol; uniform float uTime, uK, uTrail; varying vec3 vN, vW, vCol; varying float vA, vKind;
void main(){
  float f = fract(uTime * (.2 + .1 * aMat.y) + aRig.x), s = 1.; vec3 c;
  float rim = sqrt(max(0., ${(RUNNER.hem * RUNNER.hem).toFixed(2)} - aRig.y * aRig.y));
  if (aMat.x < .5) { s = .5 + 1.5 * f; c = vec3(aRig.y * (1. + .2 * f), .8 * s + aRig.z * f * (1.3 - f), -rim - (2. + aRig.w * f) * uTrail - 2. * f); }
  else c = vec3(aRig.y * (1. + .15 * f), .3 + aRig.z * 4. * f * (1. - f), -rim * .8 - (2. + .5 * aRig.w * f) * uTrail);
  vec4 w = modelMatrix * vec4(c + position * s, 1.);
  vA = f; vKind = aMat.x; vCol = aCol; vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.));
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const DUST_FRAG = /* glsl */`
${CS_COMMON}
uniform float uK; varying vec3 vN, vW, vCol; varying float vA, vKind;
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.)), tc = cameraPosition - vW; float d = length(tc), ndv = clamp(dot(n, tc / max(d, 1e-3)), 0., 1.);
  float nz = texture2D(tNoise, vW.xz * .11 + vW.y * .07).r, top = clamp(n.y * .5 + .5, 0., 1.), k = clamp(uK, 0., 1.);
  // lit on top (sun and sky; the sun comes through a puff, so its far side is not black), shaded beneath
  vec3 lit = uSunCol * (.4 + .4 * clamp(dot(n, uSun) * .6 + .4, 0., 1.)) * (.3 + .5 * top) + csAmbient(n) * mix(.5, 1., top);
  // a billow has a body: whole but for its very rim, it thins away only as it settles
  float a = smoothstep(0., .5, ndv) * smoothstep(0., .08, vA) * pow(1. - vA, .9) * (.7 + .3 * nz) * .82 * k;
  if (vKind > .5) a = k * (1. - smoothstep(.85, 1., vA)) * smoothstep(0., .04, vA);
  gl_FragColor = vec4(csFog(vCol * lit, d), a);
}`;

// A NECK: a head follows a thing by `share` of its bearing b (radians from the head's own front), no further than
// `reach`, and as the thing goes round behind (from abeam to dead astern) the head comes back through the front: the
// turn is one continuous function of the bearing, with no jump where the thing crosses behind.
export const neck = (b, share, reach) => clamp(b * share, -reach, reach) * (1 - smoothstep(Math.PI / 2, Math.PI, Math.abs(b)));

export async function buildHero(ctx, opts = {}) {
  const rng = opts.rng || ctx.rng.fork('queen'), solo = !opts.env, env = opts.env || await makeEnv(ctx.rng.fork('env'), () => ctx.yield()), side = opts.side ?? 1;
  const pawnAt = opts.pawnAt || [-15 * side, 5], hedgeAt = opts.hedgeAt || [17 * side, -2];
  const object = new THREE.Group(), runner = new THREE.Group(); object.add(runner);
  // the queen
  const qMat = makeLit(env, { instanced: false, side: THREE.DoubleSide });
  qMat.uniforms.uICol.value.set(RED[0], RED[1], RED[2], GLOSS_LACQUER); qMat.uniforms.uIShade.value.set(RED_SHADE[0], RED_SHADE[1], RED_SHADE[2], 0);
  const qIt = runningQueenSteps(); let qGeo = null;
  for (;;) { const r = qIt.next(); if (r.done) { qGeo = r.value; break; } await ctx.yield(); }
  const queen = new THREE.Mesh(qGeo, qMat); queen.name = 'queen'; queen.frustumCulled = false; runner.add(queen);
  const sIt = runningQueenSteps(true); let queenShadowGeometry = null;
  for (;;) { const r = sIt.next(); if (r.done) { queenShadowGeometry = r.value; break; } await ctx.yield(); }
  await ctx.yield();
  // the white pawn that glides at her side
  const pMat = makeLit(env, { instanced: false });
  pMat.uniforms.uICol.value.set(IVORY[0], IVORY[1], IVORY[2], GLOSS_IVORY); pMat.uniforms.uIShade.value.set(IVORY_SHADE[0], IVORY_SHADE[1], IVORY_SHADE[2], 0);
  const pawn = new THREE.Mesh(await pieceGeometryAsync('pawn', 1, () => ctx.yield()), pMat); pawn.frustumCulled = false; pawn.scale.setScalar(0.62); object.add(pawn);
  // a length of hedge that keeps pace with her
  const hedge = new THREE.Mesh(hedgeGeometry(rng, { length: 34, steps: 28, around: 8, height: 4.6, width: 4.2 }), makeLit(env, { instanced: false, side: THREE.DoubleSide }));
  hedge.frustumCulled = false; object.add(hedge);
  // grass and straw streaming past under her
  const sg = new Geo(), straw = lin('#f1e3a0'), green = lin('#7fb04a');
  // (strawS: the share the stream is drawn in by, so that the far end of its longest straw ends at strawReach)
  const strawS = clamp(((opts.strawReach ?? STREAM_REACH) - STRAW_LEN[1] / 2) / STREAM_FADE[1], 0.25, 1);
  for (let i = 0; i < 40; i++) {
    const x = rng.range(-22, 22), z = rng.range(-STREAM_HALF, STREAM_HALF) * strawS, y = 0.2 + 0.7 * Math.pow(rng(), 2.2), L = rng.range(STRAW_LEN[0], STRAW_LEN[1]), w = rng.range(0.08, 0.16), sp = rng.range(34, 60);
    sg.mat(5, rng.range(0.22, 0.42)).col(rng.chance(0.6) ? straw : green).rig(9, z, x, sp);
    sg.poly([[x - w, y, z - L / 2], [x + w, y, z - L / 2], [x + w, y + 0.02, z + L / 2], [x - w, y + 0.02, z + L / 2]]);
  }
  const streamMat = makeLit(env, { instanced: false, anim: streamAnim(strawS), side: THREE.DoubleSide });
  const stream = new THREE.Mesh(sg.build(), streamMat); stream.frustumCulled = false; object.add(stream);
  await ctx.yield();
  // what her run raises: a plume of dust from under the hem, trailing back along her lane
  const tg = new Geo();
  const dr = opts.dustRng || rng.fork('dust'), DUST = [0.9, 0.85, 0.74], TURF = [0.07, 0.13, 0.04], EARTH = [0.17, 0.11, 0.06];
  for (let i = 0; i < 30; i++) {
    // a billow: a round body with two smaller lobes on it (it reaches 2.6 m from its place, 5.2 m grown)
    tg.mat(0, dr()).col(DUST, dr.range(0.9, 1.08)).rig(i / 30 + dr.range(-0.02, 0.02), dr.range(-0.7, 0.7) * RUNNER.hem, dr.range(2, 5), dr.range(18, 27));
    const r0 = dr.range(1.6, 2.2); tg.blob([0, 0, 0], [r0, r0 * 0.85, r0], 7, 5);
    for (let j = 0; j < 2; j++) { const az = dr.range(0, TAU), r1 = dr.range(0.9, 1.4); tg.blob([Math.sin(az) * 1.2, dr.range(-0.1, 0.6), Math.cos(az) * 1.2], [r1, r1 * 0.9, r1], 6, 4); }
  }
  for (let i = 0; i < 26; i++) {
    // clods of turf and earth (even counts), and straws (odd): thrown 2 to 5 m up from under the hem
    const straw = i % 2 === 1; tg.mat(1, dr()).col(straw ? [0.80, 0.70, 0.36] : dr.chance(0.5) ? TURF : EARTH, dr.range(0.8, 1.2)).rig(i / 26 + dr.range(-0.03, 0.03), dr.range(-0.8, 0.8) * RUNNER.hem, dr.range(2, 5), dr.range(14, 30));
    tg.at(0, 0, 0, dr.range(-1.2, 1.2), dr.range(0, TAU), 0).blob([0, 0, 0], straw ? [0.05, 0.05, dr.range(0.6, 1.1)] : [dr.range(0.22, 0.4), dr.range(0.12, 0.2), dr.range(0.2, 0.36)], 4, 3).xf(null);
  }
  const dustMat = new THREE.ShaderMaterial({ uniforms: { ...env, uK: { value: 1 }, uTrail: { value: 1 } }, vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, transparent: true, depthWrite: false });
  const thrown = new THREE.Mesh(tg.build(), dustMat); thrown.frustumCulled = false; thrown.renderOrder = 1; runner.parent.add(thrown);
  // where she and the pawn touch the ground
  const contact = (opts.contact ?? true) ? makeBlobs(env, 2) : null; if (contact) object.add(contact.mesh);
  // her own streaking ground (the world lays the streaks into its own ground instead)
  let ground = null;
  if (opts.ground ?? solo) {
    ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: env, transparent: true, depthWrite: false,
      vertexShader: /* glsl */`varying vec3 vL, vW; void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`${CS_COMMON} varying vec3 vL, vW;
        void main(){
          float s = texture2D(tNoise, vec2(vL.x * .06, vL.z * .004 + uTime * .55)).r, s2 = texture2D(tNoise, vec2(vL.x * .21, vL.z * .011 + uTime * 1.3)).g;
          vec3 c = mix(vec3(.16, .3, .08), vec3(.62, .58, .26), smoothstep(.35, .7, s * .6 + s2 * .4));
          c = c * (uSunCol * max(uSun.y, .1) * .3 + uSky * .35);
          float a = 1. - smoothstep(22., 58., length(vL.xz));
          gl_FragColor = vec4(csFog(c, length(cameraPosition - vW)), a);
        }`,
    }));
    ground.position.y = 0.15; ground.renderOrder = 0.4; object.add(ground);
  }
  await ctx.yield();
  // the family, stood round her for the viewer
  let family = null, blobs = null;
  if (opts.family ?? solo) {
    const kinds = ['king', 'queen', 'bishop', 'knight', 'rook', 'pawn'];
    family = []; blobs = makeBlobs(env, 6); object.add(blobs.mesh);
    for (let k = 0; k < kinds.length; k++) {
      const set = makePieces(env, { kind: kinds[k], count: 1 }); object.add(set.mesh); family.push(set);
      const a = Math.PI + (k - 2.5) * 0.62, r = 38;
      set.color(0, k % 2 === 0); set.home = [[Math.sin(a) * r, Math.cos(a) * r, a + Math.PI + 0.5]];
      blobs.place(k, Math.sin(a) * r, 0, Math.cos(a) * r, PIECES[kinds[k]].r * 1.25, env.uSun.value);
      await ctx.yield();
    }
  }
  const loc = new THREE.Vector3(), st = { speed: 1, streak: 1, lead: pawnAt[1], pawn: 1 }, ph0 = rng.range(0, TAU), ph1 = rng.range(0, TAU), ph2 = rng.range(0, TAU);
  return {
    object, radius: 40, height: RUNNER.crown, center: new THREE.Vector3(0, 20, -4), ground: true, groundY: 0,
    queen, pawn, hedge, queenMaterial: qMat, pawnMaterial: pMat, env, queenShadowGeometry,
    anchors: { gaze: new THREE.Vector3(0, 24, 0), pawn: new THREE.Vector3(pawnAt[0], 0, pawnAt[1]), hedge: new THREE.Vector3(hedgeAt[0], 0, hedgeAt[1]) },
    // stride: how hard she runs (1 a full run, on the spot too; 0 at a stand); streak: how fast the ground streams
    // under her, as a share of the fastest (the straws streaming under her and the trail of her dust follow it);
    // lead: how far before her the pawn runs, in metres; pawnStride: the pawn's own stride
    setSpeed(stride, streak = stride, lead = pawnAt[1], pawnStride = stride) { st.speed = stride; st.streak = streak; st.lead = lead; st.pawn = pawnStride; },
    // watch: a world point the queen's and the pawn's heads turn to; THE WORLD GIVES NONE (no figure regards the
    // visitor), and with none given the heads look straight down her course. Nothing here reads the camera.
    update(dt, time, camera, watch) {
      if (solo) env.uTime.value = time;
      const k = st.speed, t = time;
      // she leans into it, bobs with each stride and rolls a little from side to side
      const st2 = t * 5.2 + ph0, bob = Math.abs(Math.sin(st2));
      runner.rotation.set((0.05 + 0.012 * Math.cos(st2 * 2)) * k + 0.006 * Math.sin(t * 2.3), 0, 0.022 * Math.sin(st2) * k);
      runner.position.set(0.5 * Math.sin(t * 1.55), 0.3 + 0.3 * bob * k, 0);
      if (watch) { loc.copy(watch); object.worldToLocal(loc); } else loc.set(0, 0, 1);
      qMat.uniforms.uIAnim.value.set(neck(Math.atan2(loc.x, loc.z), 0.55, 0.9) + 0.08 * Math.sin(t * 0.9), (0.13 + 0.05 * Math.cos(st2 * 2)) * k, k, 1.7);
      dustMat.uniforms.uK.value = k; dustMat.uniforms.uTrail.value = st.streak; streamMat.uniforms.uIAnim.value.x = st.streak;
      // the pawn leans after her, almost pulled off its base, on quicker and smaller hops: by its own stride
      const pb = Math.abs(Math.sin(t * 6.4 + ph1)), kp = st.pawn;
      pawn.position.set(pawnAt[0] + 0.8 * Math.sin(t * 1.1), 0.2 + 0.75 * pb * kp, st.lead + 1.6 * Math.sin(t * 0.7));
      pawn.rotation.set((0.36 + 0.07 * pb) * kp, 0.2 * Math.sin(t * 0.8), 0.06 * Math.sin(t * 3.2));
      pMat.uniforms.uIAnim.value.set(neck(Math.atan2(loc.x - pawnAt[0], loc.z - st.lead), 0.6, 0.6), 0.12 + 0.1 * Math.sin(t * 1.9), 0, 0);
      hedge.position.set(hedgeAt[0] + 0.4 * Math.sin(t * 1.3 + ph2), 0.25 * Math.abs(Math.sin(t * 4.3 + ph2)), hedgeAt[1] + 1.2 * Math.sin(t * 0.9 + ph2));
      hedge.rotation.set(0.03 * Math.sin(t * 4.3 + ph2), 0, 0.03 * Math.sin(t * 2.1 + ph2));
      if (contact) contact.place(0, runner.position.x, 0, 0.6, RUNNER.hem * 1.15 - 0.6 * bob * k, env.uSun.value);
      if (contact) contact.place(1, pawn.position.x, 0, pawn.position.z + 0.6, 4.3 - 0.7 * pb * kp, env.uSun.value);
      if (family) for (let i = 0; i < family.length; i++) {
        const set = family[i];
        for (let c = 0; c < 1; c++) {
          const h = set.home[c], ph = i * 1.7 + c * 2.9, dx = loc.x - h[0], dz = loc.z - h[1];
          set.place(c, h[0], 0, h[1], h[2], 0.03 * Math.sin(t * 0.8 + ph), 0.03 * Math.sin(t * 0.63 + ph * 2), 1 + 0.015 * Math.sin(t * 1.7 + ph));
          let look = Math.atan2(dx, dz) - h[2]; look = Math.atan2(Math.sin(look), Math.cos(look));
          if (set.kind === 'knight') { const rear = Math.pow(Math.max(0, Math.sin(t * 0.7 + ph)), 3); set.anim(c, 0, 0.16 * Math.sin(t * 1.9 + ph) + 0.25 * rear * Math.sin(t * 3.3), 0.42 * rear, 0); }
          else set.anim(c, clamp(look, -1.2, 1.2), 0.07 + 0.06 * Math.sin(t * 1.3 + ph), 0, 0);
        }
        set.commit();
      }
    },
    dispose() {},
  };
}
