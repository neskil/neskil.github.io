// SHELVES OF LIT MEMORIES: THE RIDE (the route's builder). Three things, all typed in the plan part and all moved by the clock alone:
//  (a) SIX GLASS TUBES (the plan's TUBES) from the shelves to the tower's crown, 1.9 m in radius: glass that reads as a tube (bright
//      rims at the grazing edges, a brighter sheen along the top; far off it is drawn no thinner than a fine line and
//      gathers into one soft line of light), and ORBS RACING through each in single
//      file, 46 m a second, about 24 m apart: to the tower in tubes A, C, E and F, from it in B and D (F, the near one at the entry, carries twice as many, 12 m apart). An orb is a glowing ball 2 m
//      across in one of the plan's five colours (ORB_SHARE; stream tube-orbs), drawn with the sums of the shelves' own orbs (the
//      part -shelfmat's orbMat sets a ball by an instance's place and cannot run a course, so the ball is drawn here on a square
//      turned to the eye, set on its course in the vertex shader); it shrinks to nothing in the last metres at either end, inside
//      the wall's top and inside the crown.
//  (b) THE TRAINS: three small trains (an engine and three cars, lit windows, nobody in them) evenly spaced on the plan's TRACK, one
//      closed loop 1,493 m round, 16 m a second (a train passes a place every 31 s). The track is two rails of light with ties (far
//      off the rails are drawn wider, unbroken lines of light, and the ties melt away); it
//      glows faintly all round and LAYS ITSELF brightly ahead of each engine (90 m) and dims again behind the last car (260 m).
//      The flown line passes 21 m OVER the track 14 m beyond the lane's mouth; everywhere else the track is further off.
//  (c) MOTES: fine warm specks, sparse and slow, in the route's lane (stream motes-lane) and over the chasm about the way from the
//      mouth to the tower, level with the eye and below it (stream motes-chasm); each drifts on a small closed course of its own
//      (a bound), is gone within 8 m of the eye, fading in to 15 m by true distance (a medium), and is not drawn beyond 62 m (so the sky
//      holds no specks). Far off a racing orb is drawn larger and only three in ten are drawn: beads of light, never a row of dots.
// CLEAR AIR (counted in node from the plan, the glass's radius taken off): tube A's skin comes no nearer the flown line than 10.4 m
// (beside the dive) and crosses the lane 29 m over it; the other tubes keep 82 m and more; a train's roof lies 16 m
// under the line where it crosses the track (the track's middle line 21.9 m under it).
// Seen near, a tube's glass is CLEAR (about 3 parts in 100 of fill and a soft band of light along its top third): two crisp bright
// edge lines and one fine bright line along its top say glass, and the orbs inside are bright, round and sharp (tube F's larger by a third and brighter: the tube the way passes closest); the trains have roofs worth seeing from above (told at the trains' kinds).
// Triangles (counted from the plan at full detail, six tubes): the glass 23,496, the track 7,470, the trains 2,232, the orbs 598, the motes 3,320: 37,116.
import * as THREE from 'three';
import { makeRng, hashSeed } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import { TUBES, TUBE, TRACK, RAIL, courseAt, spineAt, LANE, CHASM, TOWER, ORB, ORB_SHARE, MOUTH, RING } from './shelves-of-lit-memories-plan.js';

const FOG_V = /* glsl */`
#ifdef USE_FOG
  varying float vFogDepth;
#endif`;
// the haze by distance, for a thing that adds its light: its light sinks into the haze (never a pale veil over what is behind)
const FOG_F = /* glsl */`
#ifdef USE_FOG
  uniform vec3 fogColor; uniform float fogDensity; varying float vFogDepth;
  float rideHaze(){ return 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth); }
#else
  float rideHaze(){ return 0.; }
#endif`;
const fogUniforms = () => ({ fogColor: { value: new THREE.Color(0x261a50) }, fogDensity: { value: 0.0005 }, fogNear: { value: 1 }, fogFar: { value: 4000 } });
// a course's points as one flat list for a shader, and the plain Catmull-Rom sum over them (open: ends held; closed: wrapping)
const CR_GLSL = (n, closed) => /* glsl */`
uniform vec3 uP[${n}];
vec3 rideAt(float base, float cnt, float t, out vec3 tang){
  float tc = ${closed ? 'mod(t, cnt)' : 'clamp(t, 0., cnt - 1.001)'}, i = floor(tc), u = tc - i;
  ${closed
    ? 'int i0 = int(base + mod(i - 1. + cnt, cnt)), i1 = int(base + i), i2 = int(base + mod(i + 1., cnt)), i3 = int(base + mod(i + 2., cnt));'
    : 'int i0 = int(base + max(i - 1., 0.)), i1 = int(base + i), i2 = int(base + min(i + 1., cnt - 1.)), i3 = int(base + min(i + 2., cnt - 1.));'}
  vec3 p0 = uP[i0], p1 = uP[i1], p2 = uP[i2], p3 = uP[i3];
  vec3 b = p2 - p0, c = 2.*p0 - 5.*p1 + 4.*p2 - p3, d = 3.*p1 - p0 - 3.*p2 + p3;
  tang = .5*(b + 2.*c*u + 3.*d*u*u);
  return .5*(2.*p1 + b*u + c*u*u + d*u*u*u);
}`;
const flat = (courses) => { const out = []; for (const c of courses) for (const p of c.points) out.push(new THREE.Vector3(p[0], p[1], p[2])); return out; };
// a frame on a course (never upright: the plan's courses are at most 36 degrees steep): the tangent, the level right hand, the up
const frameAt = (c, t) => { const s = courseAt(c, t), T = new THREE.Vector3(s[3], s[4], s[5]).normalize(), R = new THREE.Vector3(-T.z, 0, T.x).normalize(), U = new THREE.Vector3().crossVectors(T, R).negate();
  return { P: new THREE.Vector3(s[0], s[1], s[2]), T, R, U: U.y < 0 ? U.negate() : U }; };

// ---------------- (a) the glass of the six tubes: one mesh; a ring every 5.6 m or so of a course, 16 round on tubes A and F (the two the way passes close), 10 on the others
function tubeGlass(shared) {
  const pos = [], nor = [], tan = [], uv = [], idx = [];
  for (const c of TUBES) {
    const n = c.points.length, rings = Math.round(c.length / 5.6), base = pos.length / 3, RAD = (c === TUBES[0] || c === TUBES[5]) ? 16 : 10;
    for (let i = 0; i <= rings; i++) {
      const f = frameAt(c, (i / rings) * (n - 1));
      for (let j = 0; j <= RAD; j++) { const a = (j / RAD) * Math.PI * 2, cx = Math.cos(a), sy = Math.sin(a);
        const N = f.R.clone().multiplyScalar(cx).addScaledVector(f.U, sy);
        pos.push(f.P.x + N.x * TUBE.r, f.P.y + N.y * TUBE.r, f.P.z + N.z * TUBE.r); nor.push(N.x, N.y, N.z); tan.push(f.T.x, f.T.y, f.T.z); uv.push((i / rings) * c.length, j / RAD); }
    }
    for (let i = 0; i < rings; i++) for (let j = 0; j < RAD; j++) { const a = base + i * (RAD + 1) + j, b = a + RAD + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(tan, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new THREE.ShaderMaterial({ name: 'slmGlass', transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: { ...fogUniforms(), uTime: shared.uTime },
    vertexShader: /* glsl */`attribute vec3 aT; varying vec3 vN, vW, vT; varying vec2 vUv; ${FOG_V}
      void main(){ vUv = uv; vN = normal; vT = aT; vec3 ctr = position - normal*${TUBE.r.toFixed(2)};      // the tube's middle line
        float dist = length((modelMatrix*vec4(ctr, 1.)).xyz - cameraPosition), rr = max(${TUBE.r.toFixed(2)}, dist*.0032);      // far off the glass is drawn wider, never a hairline (a level of detail by where the eye is)
        vec4 w = modelMatrix*vec4(ctr + normal*rr, 1.); vW = w.xyz; vec4 mv = viewMatrix*w; gl_Position = projectionMatrix*mv;
      #ifdef USE_FOG
        vFogDepth = -mv.z;
      #endif
      }`,
    fragmentShader: /* glsl */`precision highp float; varying vec3 vN, vW, vT; varying vec2 vUv; uniform float uTime; ${FOG_F}
      void main(){
        vec3 n = vN*inversesqrt(max(dot(vN, vN), 1e-6)), v = cameraPosition - vW; float d2 = dot(v, v); v *= inversesqrt(max(d2, 1e-6));
        vec3 tg = vT*inversesqrt(max(dot(vT, vT), 1e-6)), vp = v - tg*dot(v, tg); vp *= inversesqrt(max(dot(vp, vp), 1e-4));      // the sight line across the tube: looked along, a tube still shows its two edges and a clear middle
        float f = 1. - abs(dot(n, vp));                    // the glass shows at its grazing edges
        float far = smoothstep(1.5e4, 2.5e5, d2);      // from 120 m to 500 m off the glass gathers into one soft line of light (a level of detail by where the eye is)
        float ew = max(.52, 2.4*fwidth(f)), edge = smoothstep(1. - ew, 1. - .3*ew, f), rim = mix(edge, f*f*(.35 + .65*f), far);      // seen near: two crisp bright lines at the grazing edges and a clear body between them (never under a pixel and a half); far off the soft rim
        float tw = max(.012, 1.8*fwidth(n.y)), hl = smoothstep(1. - tw, 1. - .3*tw, n.y);      // seen near: one fine bright line along the top
        float sheen = mix(hl, smoothstep(.72, 1., n.y)*.92, far) + smoothstep(.55, 1., -n.y)*.14*far;      // far off the dome's light along the top, the brighter upper edge, and the lanes' glow under it
        vec3 col = vec3(.74, .72, 1.)*(.012 + .9*rim) + vec3(.96, .93, 1.)*sheen*mix(.95, .55, far) + vec3(.74, .7, 1.)*far*.4;      // almost no fill: what lies behind shows through
        float a = clamp(.012 + .9*rim + mix(.85, .38, far)*sheen + .34*far, 0., .94), k = 1. - rideHaze();
        float body = (1. - far)*(.016 + .045*smoothstep(.35, .9, n.y));      // seen near, a faint presence (each of the two walls adds half of it): about 3 parts in 100 of fill, and a soft band of light along the top third
        gl_FragColor = vec4((col*a + vec3(.82, .8, 1.)*body)*k, (a*.5 + .3*body)*k);
      }` });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'tubes'; mesh.renderOrder = 6; mesh.frustumCulled = false;
  return { mesh, triangles: idx.length / 3 };
}
// ---------------- (a) the orbs racing through the tubes: one small square each, turned to the eye in the vertex shader (a ball looks the
// same from every side) and drawn as a glowing ball with a slow swirl inside; each runs its course by the clock alone
const premul = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };
function quad() { const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; }
function tubeOrbs(ctx, shared) {
  const rng = makeRng(hashSeed('shelves-of-lit-memories:tube-orbs:' + ctx.seed));
  const kinds = Object.keys(ORB_SHARE), colours = kinds.map((k) => new THREE.Color(ORB[k]).multiplyScalar(k === 'grey' ? 0.4 : 1));
  const SPEED = 46, GAP = 24, aCourse = [], aRun = [], aCol = []; let base = 0, ti = 0;
  for (const c of TUBES) {
    const near = c === TUBES[5];      // tube F, the near one at the entry: always to the tower, and twice as many orbs (12 m apart)
    const n = c.points.length, per = Math.max(4, Math.round(c.length / (near ? GAP / 2 : GAP))), dir = near ? 1 : (ti++ % 2 ? -1 : 1);      // tubes A, C and E carry to the tower, B and D from it
    for (let i = 0; i < per; i++) {
      const jit = rng.range(-0.3, 0.3), pick = rng(), sd = rng();      // every orb's dice, in order, before anything is made of them
      let k = 0, acc = pick; for (; k < kinds.length - 1; k++) { acc -= ORB_SHARE[kinds[k]]; if (acc < 0) break; }
      aCourse.push(base, n, c.length); aRun.push((i + 0.5 + jit) / per, dir, near ? 1 : 0, sd); aCol.push(colours[k].r, colours[k].g, colours[k].b);
    }
    base += n;
  }
  const g = quad(), count = aRun.length / 4;
  g.setAttribute('aCourse', new THREE.InstancedBufferAttribute(new Float32Array(aCourse), 3)); g.setAttribute('aRun', new THREE.InstancedBufferAttribute(new Float32Array(aRun), 4));
  g.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(aCol), 3)); g.instanceCount = count;
  const m = new THREE.ShaderMaterial({ name: 'slmTubeOrb', ...premul, fog: true, uniforms: { ...fogUniforms(), uTime: shared.uTime, uP: { value: flat(TUBES) } },
    vertexShader: /* glsl */`attribute vec3 aCourse, aCol; attribute vec4 aRun; uniform float uTime; varying vec2 vQ; varying vec3 vCol, vMv; varying float vSeed, vNear; ${FOG_V}
      ${CR_GLSL(base, false)}
      void main(){
        float s = fract(aRun.x + aRun.y*uTime*${SPEED.toFixed(1)}/aCourse.z);      // the share of its course run, by the clock
        vec3 tg; vec3 c = rideAt(aCourse.x, aCourse.y, s*(aCourse.y - 1.), tg);
        float ends = smoothstep(0., 12., s*aCourse.z)*smoothstep(0., 12., (1. - s)*aCourse.z);      // nothing at either end of the tube
        vec4 mv = viewMatrix*vec4(c, 1.); float dist = length(mv.xyz);
        float big = max(1., dist/200.), share = mix(1., .3, smoothstep(220., 900., dist)), seen = 1. - smoothstep(share - .06, share + .06, aRun.w*.9 + .05);      // far off fewer beads and larger ones, never a row of dots (a level of detail by where the eye is)
        mv.xy += position.xy*ends*big*seen*(1. + .34*aRun.z);      // tube F's balls (aRun.z 1) are larger by a third: the tube the way passes closest
        gl_Position = projectionMatrix*mv; vQ = position.xy; vCol = aCol; vSeed = aRun.w; vMv = mv.xyz; vNear = aRun.z;
      #ifdef USE_FOG
        vFogDepth = -mv.z;
      #endif
      }`,
    // the ball as the shelves' orbs are drawn (the sums of orbMat in the part -shelfmat, on a square turned to the eye): a glow of one
    // colour from within, deeper where the ball is thicker; a slow swirl; a rim of its colour; one clear highlight
    fragmentShader: /* glsl */`precision highp float; varying vec2 vQ; varying vec3 vCol, vMv; varying float vSeed, vNear; uniform float uTime; ${FOG_F}
      ${fx.GLSL_HASH}${fx.GLSL_VALUE_NOISE}
      void main(){
        float r2 = dot(vQ, vQ), thick = sqrt(max(1. - r2, 0.)), r = sqrt(max(r2, 1e-6)), seed = vSeed, foot = max(fwidth(r), 1e-4);
        vec3 n = vec3(vQ, thick), rd = vMv*inversesqrt(max(dot(vMv, vMv), 1e-6)), q = n + rd*(.55*thick);
        float ang = uTime*(.20 + .22*seed) + seed*40. + q.y*1.7, ca = cos(ang), sa = sin(ang);
        vec3 qs = vec3(ca*q.x - sa*q.z, q.y, sa*q.x + ca*q.z);
        float keep = 1. - smoothstep(.10, .45, foot);
        float sw = mix(.5, smoothstep(.30, .74, .62*vnoise(qs*2.2 + seed*17.) + .38*vnoise(qs*4.6 + vec3(0., uTime*.06, 0.) + seed*5.)), keep);
        vec3 col = vCol*(.34 + .52*thick)*(.50 + 1.30*sw) + mix(vCol, vec3(1.), .6)*(sw*sw*.60*thick);
        float f1 = 1. - clamp(-dot(n, rd), 0., 1.), fres = f1*f1*f1;
        col += vCol*fres*.55 + vec3(.15, .13, .34)*fres*.6;
        float hl = max(dot(reflect(rd, n), mat3(viewMatrix)*vec3(0., .75, .66)), 0.), h2 = hl*hl, h8 = h2*h2*h2*h2, h64 = h8*h8*h8*h8*h8*h8*h8*h8;
        col += vec3(1., .97, .92)*(1.5*h64 + .10*h8)*keep;
        float a = (1. - smoothstep(1. - 1.5*foot, 1., r))*(1. - rideHaze());
        gl_FragColor = vec4(col*(1.55 + .65*smoothstep(4e4, 6.4e5, dot(vMv, vMv)))*(1. + .3*vNear)*a, a);      // a little brighter than on a shelf: it is seen through the glass; brighter still far off, a bead of light
        if (r2 > 1.) discard;
      }` });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'tube-orbs'; mesh.renderOrder = 5; mesh.frustumCulled = false;
  return { mesh, triangles: count * 2 };
}
// ---------------- (b) the track: two rails of light and the ties between them, laid along the plan's TRACK (a step every 3.6 m or so).
// A rail is a four-sided bar 0.34 m thick; far off it is drawn wider and as much dimmer, so that it stays a line (a level of detail
// by where the eye is). The ties are a pattern on a strip between the rails, filtered by the pixel's footprint.
const TRAIN_LEN = 44, CAR_STEP = 11.2;
const TRACK_GLSL = /* glsl */`
float rideLaid(float along){      // how brightly the track is laid at a place: faint all round, bright ahead of an engine, dimming behind a last car
  float g = 0.;
  for (int k = 0; k < 3; k++) { float d = mod(along - uTime*${RAIL.speed.toFixed(1)} - float(k)*${(TRACK.length / 3).toFixed(2)}, ${TRACK.length.toFixed(2)});      // metres ahead of the engine's front
    float back = ${TRACK.length.toFixed(2)} - d;
    g = max(g, max(1. - smoothstep(55., 90., d), 1. - smoothstep(${TRAIN_LEN.toFixed(1)}, ${(TRAIN_LEN + 260).toFixed(1)}, back))); }
  return g;
}`;
function trackMesh(shared) {
  const n = TRACK.points.length, steps = Math.round(TRACK.length / 3.6), pos = [], off = [], uv = [], idx = [];
  const half = RAIL.gauge / 2, D = Math.SQRT1_2;
  for (let i = 0; i <= steps; i++) {
    const f = frameAt(TRACK, (i / steps) * n), along = (i / steps) * TRACK.length;
    for (const side of [-1, 1]) for (const [a, b] of [[D, D], [-D, D], [-D, -D], [D, -D], [D, D]]) {      // a rail: four corners round its middle (the first again to close it)
      pos.push(f.P.x + f.R.x * half * side, f.P.y, f.P.z + f.R.z * half * side); off.push(f.R.x * a + f.U.x * b, f.R.y * a + f.U.y * b, f.R.z * a + f.U.z * b); uv.push(along, 0); }
    for (const side of [-1, 1]) { pos.push(f.P.x + f.R.x * (half + 0.45) * side - f.U.x * 0.16, f.P.y - f.U.y * 0.16, f.P.z + f.R.z * (half + 0.45) * side - f.U.z * 0.16); off.push(0, 0, 0); uv.push(along, side); }      // the ties' strip
  }
  for (let i = 0; i < steps; i++) { const a = i * 12, b = a + 12;
    for (const r of [0, 5]) for (let j = 0; j < 4; j++) idx.push(a + r + j, b + r + j, a + r + j + 1, a + r + j + 1, b + r + j, b + r + j + 1);
    idx.push(a + 10, b + 10, a + 11, a + 11, b + 10, b + 11); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aOff', new THREE.Float32BufferAttribute(off, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new THREE.ShaderMaterial({ name: 'slmTrack', ...premul, side: THREE.DoubleSide, fog: true, uniforms: { ...fogUniforms(), uTime: shared.uTime },
    vertexShader: /* glsl */`attribute vec3 aOff; varying vec2 vUv; varying float vRail, vThin, vNear; ${FOG_V}
      void main(){ vUv = uv; float rail = step(.5, dot(aOff, aOff));
        vec3 c = (modelMatrix*vec4(position, 1.)).xyz; float dist = length(c - cameraPosition), w = max(.24, dist*.0024);      // half the bar's width across its corners: far off a rail is drawn wider, an unbroken line
        vec4 mv = viewMatrix*vec4(c + aOff*w*rail, 1.); gl_Position = projectionMatrix*mv; vRail = rail; vNear = .24/w; vThin = max(vNear, .45);
      #ifdef USE_FOG
        vFogDepth = -mv.z;
      #endif
      }`,
    fragmentShader: /* glsl */`precision highp float; varying vec2 vUv; varying float vRail, vThin, vNear; uniform float uTime; ${FOG_F}
      ${TRACK_GLSL}
      void main(){
        float g = rideLaid(vUv.x), k = 1. - rideHaze();
        float u = vUv.x/2.4, fw = fwidth(u)*2.4, w = .34 + fw, dd = abs(fract(u) - .5)*2.4;      // a tie every 2.4 m
        float tie = (1. - smoothstep(w*.5, w, dd))*min(.34/w*1.5, 1.)*(1. - smoothstep(.78, .98, abs(vUv.y)))*smoothstep(.2, .6, vNear);      // the ties melt away far off (from about 110 m, gone by 330 m)
        float a = mix(tie*.55, clamp(vThin, 0., 1.), step(.5, vRail));
        vec3 col = mix(vec3(.7, .6, 1.)*(.1 + .5*g), vec3(1., .86, .6)*(.22 + .64*g), step(.5, vRail));
        gl_FragColor = vec4(col*a*k, a*k*mix(.4, .85, step(.5, vRail)));
      }` });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'track'; mesh.renderOrder = 4; mesh.frustumCulled = false;
  return { mesh, triangles: idx.length / 3 };
}
// ---------------- (b) the trains: an engine and three cars each, one instanced shape for the engines and one for the cars; every
// vehicle is set on the track in the vertex shader by the clock (its middle on the course, its length along the course's tangent)
function shape(parts) {
  const pos = [], nor = [], kind = [], idx = [], AX = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const box = (c, s, k) => { for (let a = 0; a < 3; a++) for (const sg of [-1, 1]) { const u = AX[(a + 1) % 3], v = AX[(a + 2) % 3], b = pos.length / 3;
    for (const [i, j] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { for (let q = 0; q < 3; q++) pos.push(c[q] + (AX[a][q] * sg + u[q] * i + v[q] * j) * s[q] / 2); nor.push(AX[a][0] * sg, AX[a][1] * sg, AX[a][2] * sg); kind.push(k); }
    if (sg > 0) idx.push(b, b + 1, b + 2, b, b + 2, b + 3); else idx.push(b, b + 2, b + 1, b, b + 3, b + 2); } };
  const drum = (c, r, len, axis, k, seg = 12) => {      // a round drum along z (axis 2) or y (axis 1), with its two ends
    const p = (a, e) => { const ca = Math.cos(a) * r, sa = Math.sin(a) * r; return axis === 2 ? [c[0] + ca, c[1] + sa, c[2] + e * len / 2] : [c[0] + ca, c[1] + e * len / 2, c[2] - sa]; };
    const nn = (a) => (axis === 2 ? [Math.cos(a), Math.sin(a), 0] : [Math.cos(a), 0, -Math.sin(a)]);
    const b = pos.length / 3;
    for (let i = 0; i <= seg; i++) { const a = (i / seg) * Math.PI * 2; for (const e of [-1, 1]) { pos.push(...p(a, e)); nor.push(...nn(a)); kind.push(k); } }
    for (let i = 0; i < seg; i++) { const q = b + i * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
    for (const e of [-1, 1]) { const m = pos.length / 3, en = axis === 2 ? [0, 0, e] : [0, e, 0]; pos.push(...(axis === 2 ? [c[0], c[1], c[2] + e * len / 2] : [c[0], c[1] + e * len / 2, c[2]])); nor.push(...en); kind.push(k);
      for (let i = 0; i <= seg; i++) { pos.push(...p((i / seg) * Math.PI * 2, e)); nor.push(...en); kind.push(k); }
      for (let i = 0; i < seg; i++) { if (e > 0) idx.push(m, m + 1 + i, m + 2 + i); else idx.push(m, m + 2 + i, m + 1 + i); } } };
  for (const p of parts) (p[0] === 'box' ? box(p[1], p[2], p[3]) : drum(p[1], p[2], p[3], p[4], p[5], p[6]));
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1)); g.setIndex(idx);
  return g;
}
// kinds: 0 the painted body (with windows), 1 the dark trim, 2 the frame and the wheels, 3 a lamp, 4 a painted roof (a row of small warm lamps along
// both its edges), 5 the hopper's heap of glowing orbs, 6 the hopper's painted body (no windows). Metres: x across, y up from the rails, z forward.
// SEEN FROM ABOVE (the track runs under the flown line at the rim; where a train is when a visitor passes is by the world's clock): the engine red, its funnel's mouth and its headlamp lit; each car its own
// strong colour (the plan's orb colours) under a rounded roof; the last car an open hopper heaped with softly glowing orbs.
const wheels = (zs) => zs.flatMap((z) => [['box', [-1.2, 0.6, z], [0.3, 1.2, 1.2], 2], ['box', [1.2, 0.6, z], [0.3, 1.2, 1.2], 2]]);
const ENGINE = [['box', [0, 0.85, 0], [2.6, 0.5, 9.6], 2], ['box', [0, 2.65, -3.1], [3.3, 3.1, 3.4], 0], ['box', [0, 4.35, -3.1], [3.7, 0.3, 4], 4], ['drum', [0, 2.35, 1.3], 1.3, 5.6, 2, 0], ['drum', [0, 4.9, 3.2], 0.5, 0.14, 1, 3],
  ['drum', [0, 4.15, 3.2], 0.42, 1.4, 1, 1], ['box', [0, 3.8, 1.1], [0.9, 0.5, 0.9], 1], ['box', [0, 2.35, 4.25], [1.2, 1.2, 0.3], 3], ['box', [0, 1, 4.7], [3, 0.5, 0.4], 2], ...wheels([-3, 0, 3])];
const CAR = [['box', [0, 2.5, 0], [3.3, 3.2, 10], 0], ['drum', [0, 3.05, 0], 1.9, 10.3, 2, 4, 20], ['box', [0, 0.75, 0], [2.6, 0.3, 9.4], 2], ...wheels([-3.2, 3.2])];      // the roof: a round back, 0.85 m over the walls
const HOPPER = [['box', [0, 2, 0], [3.3, 2.2, 10], 6], ['drum', [0, 2.35, 0], 1.75, 9.6, 2, 5, 20], ['box', [0, 0.75, 0], [2.6, 0.3, 9.4], 2], ...wheels([-3.2, 3.2])];      // the last car: open, heaped with orbs
const TINTS = [ORB.red, ORB.blue, ORB.green, ORB.violet];      // the engine, then the three cars (the last the hopper): the plan's orb colours
function trains(shared) {
  const n = TRACK.points.length, L = TRACK.length;
  const m = new THREE.ShaderMaterial({ name: 'slmTrain', fog: true, uniforms: { ...fogUniforms(), uTime: shared.uTime, uP: { value: flat([TRACK]) } },
    vertexShader: /* glsl */`attribute vec3 aTint; attribute vec4 aCar; attribute float aKind; uniform float uTime; varying vec3 vL, vNl, vNw, vTint; varying vec2 vCar; varying float vKind; ${FOG_V}
      ${CR_GLSL(n, true)}
      void main(){
        float s = mod(uTime*${RAIL.speed.toFixed(1)} + aCar.y*${(L / 3).toFixed(2)} - aCar.x, ${L.toFixed(2)});      // metres round the loop, by the clock
        vec3 tg; vec3 P = rideAt(0., ${n.toFixed(1)}, s/${L.toFixed(2)}*${n.toFixed(1)}, tg);
        vec3 T = tg*inversesqrt(max(dot(tg, tg), 1e-6)), R = vec3(T.z, 0., -T.x); R *= inversesqrt(max(dot(R, R), 1e-4)); vec3 U = cross(T, R);
        vec3 w = P + R*position.x + U*(position.y + .17) + T*position.z;
        vL = position; vNl = normal; vNw = R*normal.x + U*normal.y + T*normal.z; vTint = aTint; vKind = aKind; vCar = aCar.zw;
        vec4 mv = viewMatrix*vec4(w, 1.); gl_Position = projectionMatrix*mv;
      #ifdef USE_FOG
        vFogDepth = -mv.z;
      #endif
      }`,
    fragmentShader: /* glsl */`precision highp float; varying vec3 vL, vNl, vNw, vTint; varying vec2 vCar; varying float vKind; ${FOG_F}
      #ifdef USE_FOG
        vec3 rideFogged(vec3 c){ return mix(c, fogColor, rideHaze()); }
      #else
        vec3 rideFogged(vec3 c){ return c; }
      #endif
      void main(){
        vec3 n = vNw*inversesqrt(max(dot(vNw, vNw), 1e-6));
        vec3 base = vKind < .5 ? vTint : vKind < 1.5 ? vec3(.2, .16, .28) : vKind < 2.5 ? vec3(.11, .1, .15) : vKind < 3.5 ? vec3(1., .92, .7) : vKind < 4.5 ? mix(vTint, vec3(1.), .14) : vTint;
        float up = .5 + .5*n.y;
        vec3 col = base*(vec3(.5, .44, .8)*(.3 + .95*up) + vec3(1., .8, .5)*.4*(1. - up))*1.3;      // the dome's light from above, the warm glow from below
        float side = step(.5, abs(vNl.x))*step(vKind, .5), fz = fwidth(vL.z);
        vec2 gh = vec2(vL.x, vL.z)/.92; float fwh = clamp((fwidth(gh.x) + fwidth(gh.y))*1.2, 0., 1.);      // the heap's footprint, taken here before any branch, from the unstepped coordinates
        float wy = mix(smoothstep(1.95, 2.05, vL.y)*(1. - smoothstep(3.4, 3.5, vL.y)), smoothstep(2.75, 2.85, vL.y)*(1. - smoothstep(3.75, 3.85, vL.y)), vCar.y);
        float cz = fract((vL.z + 5.)/2.), wc = mix(smoothstep(.14, .2, cz)*(1. - smoothstep(.8, .86, cz)), .66, clamp(fz*1.5, 0., 1.));      // a car's windows, one every 2 m
        float we = smoothstep(-4.5, -4.4, vL.z)*(1. - smoothstep(-1.95, -1.85, vL.z));      // the engine's cab
        float lit = side*wy*mix(wc, we, vCar.y);
        if (vKind < .5 || vKind > 3.5) col += base*.26;      // what is painted keeps its own strong colour under the violet dome
        col = mix(col, vec3(1., .8, .46)*(2.1 + .5*sin(floor((vL.z + 5.)/2.)*2.7 + vCar.x*9.)), lit);      // lit windows, nobody in them
        if (vKind > 3.5 && vKind < 4.5) {      // a roof: a row of small warm lamps along both edges, one every 1.25 m (far off the row is one soft line)
          float ex = abs(vL.x) - 1.46, cz2 = (fract(vL.z/1.25) - .5)*1.25;
          float lamp = mix(1. - smoothstep(.13, .2, length(vec2(cz2, ex))), (1. - smoothstep(.13, .2, abs(ex)))*.3, clamp(fz*2.5, 0., 1.));
          col = mix(col, vec3(1., .8, .45)*3., lamp);
        }
        if (vKind > 4.5 && vKind < 5.5) {      // the hopper's heap: round softly glowing orbs in the plan's colours and shares, row beside row
          vec2 g = vec2(vL.x, vL.z)/.92; g.x += .5*mod(floor(g.y), 2.); vec2 id = floor(g), q = fract(g) - .5;
          float h = fract(sin(dot(id + vCar.x*31., vec2(12.9898, 78.233)))*43758.5453), r = length(q), fw = fwh;
          vec3 oc = h < .52 ? vec3(1., .79, .29) : h < .66 ? vec3(.29, .62, 1.) : h < .76 ? vec3(1., .33, .28) : h < .86 ? vec3(.44, .86, .42) : h < .96 ? vec3(.69, .48, 1.) : vec3(.5, .5, .56);
          oc = mix(oc, vec3(.86, .68, .4), fw);
          col = mix(vec3(.06, .05, .1), oc*(.75 + 1.1*(1. - 2.*r)), mix(1. - smoothstep(.36, .47, r), .6, fw));
        }
        if (vKind > 2.5 && vKind < 3.5) col = vec3(1., .93, .7)*3.2;
        gl_FragColor = vec4(rideFogged(col), 1.);
      }` });
  const mk = (parts, list) => { const g = shape(parts);
    g.setAttribute('aCar', new THREE.InstancedBufferAttribute(new Float32Array(list.flatMap((c) => c.car)), 4)); g.setAttribute('aTint', new THREE.InstancedBufferAttribute(new Float32Array(list.flatMap((c) => c.tint)), 3));
    g.instanceCount = list.length; const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; return mesh; };
  const tint = (i) => { const c = new THREE.Color(TINTS[i]); return [c.r, c.g, c.b]; }, eng = [], cars = [], hops = [];
  for (let k = 0; k < 3; k++) { eng.push({ car: [5, k, k / 3, 1], tint: tint(0) }); for (let j = 1; j <= 3; j++) (j < 3 ? cars : hops).push({ car: [5 + CAR_STEP * j, k, (k * 3 + j) / 9, 0], tint: tint(j) }); }
  const a = mk(ENGINE, eng), b = mk(CAR, cars), h = mk(HOPPER, hops); a.name = 'engines'; b.name = 'cars'; h.name = 'hoppers';
  return { meshes: [a, b, h], material: m, triangles: (a.geometry.index.count / 3) * 3 + (b.geometry.index.count / 3) * 6 + (h.geometry.index.count / 3) * 3 };
}
// ---------------- (c) the motes: one small square each, turned to the eye; a mote drifts on a small closed course of its own about its
// home (a bound), twinkles slowly, is drawn no smaller than the pixel and as much dimmer, and is gone within 8 m of the eye
function motes(ctx, shared) {
  const lane = makeRng(hashSeed('shelves-of-lit-memories:motes-lane:' + ctx.seed)), chasm = makeRng(hashSeed('shelves-of-lit-memories:motes-chasm:' + ctx.seed));
  const detail = Math.min(Math.max(ctx.quality ? ctx.quality.detail : 1, 0.5), 1);      // fewer motes on a low detail (the first of each stream, so the rest stand where they stood)
  const home = [], mote = [], LANE_N = Math.round(760 * detail), CHASM_N = Math.round(900 * detail), halfLane = LANE.lane / 2 - 1.2;
  for (let i = 0; i < LANE_N; i++) { const t = lane.range(5.2, 13), o = lane.range(-halfLane, halfLane), y = lane.range(2.5, LANE.wallH - 3), ph = lane(), sz = lane.range(0.04, 0.08), sp = lane.range(0.6, 1.4), br = lane.range(0.5, 1);
    const s = spineAt(t); home.push(s[0] + s[3] * o, Math.min(y, 21), s[1] - s[2] * o); mote.push(ph, sz, sp, br); }      // level with the eye and under it: against the walls, not the sky
  for (let i = 0; i < CHASM_N; i++) { const f = chasm(), side = chasm.range(-75, 75), dy = chasm.range(-44, 12), ph = chasm(), sz = chasm.range(0.04, 0.09), sp = chasm.range(0.6, 1.4), br = chasm.range(0.5, 1);
    const z = MOUTH[2] + 4 + f * (TOWER.z - TOWER.r - 30 - MOUTH[2]), k = Math.min(Math.max((z - MOUTH[2]) / (RING.z - MOUTH[2]), 0), 1), ky = k * k * (3 - 2 * k);      // about the way from the mouth to the ring and a little beyond
    home.push(MOUTH[0] + (RING.x - MOUTH[0]) * k + side, Math.max(MOUTH[1] + (RING.y - MOUTH[1]) * ky + dy, -20), z); mote.push(ph, sz, sp, br); }
  const g = quad(), count = mote.length / 4;
  g.setAttribute('aHome', new THREE.InstancedBufferAttribute(new Float32Array(home), 3)); g.setAttribute('aMote', new THREE.InstancedBufferAttribute(new Float32Array(mote), 4)); g.instanceCount = count;
  const m = new THREE.ShaderMaterial({ name: 'slmMote', ...premul, fog: true, uniforms: { ...fogUniforms(), uTime: shared.uTime },
    vertexShader: /* glsl */`attribute vec3 aHome; attribute vec4 aMote; uniform float uTime; varying vec2 vQ; varying float vA; ${FOG_V}
      void main(){
        float ph = aMote.x*6.283, t = uTime*.21*aMote.z;
        vec3 c = aHome + vec3(sin(t + ph), .7*sin(t*.77 + ph*1.7), cos(t*.9 + ph*2.3))*1.6;
        vec4 mv = viewMatrix*vec4(c, 1.); float dist = length(mv.xyz), h = max(aMote.y, dist*.0013), thin = aMote.y/h;
        mv.xy += position.xy*h; gl_Position = projectionMatrix*mv; vQ = position.xy;
        vA = aMote.w*(.62 + .38*sin(uTime*1.1*aMote.z + ph*3.1))*thin*thin*smoothstep(8., 15., dist)*(1. - smoothstep(30., 62., dist));
      #ifdef USE_FOG
        vFogDepth = -mv.z;
      #endif
      }`,
    fragmentShader: /* glsl */`precision highp float; varying vec2 vQ; varying float vA; ${FOG_F}
      void main(){ float r = 1. - smoothstep(0., 1., dot(vQ, vQ)), a = r*r*vA*(1. - rideHaze()); gl_FragColor = vec4(vec3(1., .84, .58)*.9*a, 0.); }` });      // a soft round disc: nothing at the square's edge
  const mesh = new THREE.Mesh(g, m); mesh.name = 'motes'; mesh.renderOrder = 7; mesh.frustumCulled = false;
  return { mesh, triangles: count * 2 };
}

export async function buildRide(ctx, shared) {
  const object = new THREE.Group(); object.name = 'ride';
  const glass = tubeGlass(shared); object.add(glass.mesh);
  await ctx.yield();
  const orbs = tubeOrbs(ctx, shared); object.add(orbs.mesh);
  await ctx.yield();
  const track = trackMesh(shared); object.add(track.mesh);
  await ctx.yield();
  const train = trains(shared); object.add(...train.meshes);
  await ctx.yield();
  const dust = motes(ctx, shared); object.add(dust.mesh);
  await ctx.yield();
  const made = [glass.mesh, orbs.mesh, track.mesh, ...train.meshes, dust.mesh];
  return { object, triangles: glass.triangles + orbs.triangles + track.triangles + train.triangles + dust.triangles,
    update() {},      // everything of the ride moves in its shaders by shared.uTime, which the world sets every frame
    dispose() { for (const o of made) { o.geometry.dispose(); o.material.dispose(); } } };
}
