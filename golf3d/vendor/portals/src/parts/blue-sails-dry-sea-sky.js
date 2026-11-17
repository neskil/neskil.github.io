// BLUE SAILS ON A DRY SEA: the sea bottom, the two moons, the blue hills, the flame birds with their canopy and
// ribbons, and the old ones (globes of blue fire). Everything here is driven by uniforms the world sets.
import * as THREE from 'three';
import { BS_NOISE, BS_COMMON, lin, instanced, makeAcc, vtx, tube, loft, finish, litMaterial } from './blue-sails-dry-sea.js';

export const MAX_SHIPS = 24;

// ---------------------------------------------------------------- the dry sea bottom
// One big sheet at y = 0, shaded per pixel: bone-pale sand under the two moons, tonal drifts, ripple marks with a
// lit and a shadowed side, the twin tracks behind every runner (along each ship's own course), the blue light
// under every sail, sand streamers sliding downwind, a low haze. (Bones, shells and stones are built: makeBones.)
export function makeSand(SH, o = {}) {
  const uniforms = {
    ...SH,
    uShips: { value: Array.from({ length: MAX_SHIPS }, () => new THREE.Vector4(0, 9999, 0, 0)) },      // x, z, course, track
    uSandA: { value: new THREE.Color(o.sand ?? '#A89A88') }, uSandB: { value: new THREE.Color(o.sandPale ?? '#F1E6D0') },
    uBone: { value: new THREE.Color('#F2EEE6') }, uHaze: { value: new THREE.Color(o.haze ?? '#A898A6') },
    uShore: { value: o.shoreZ ?? -430 }, uMoonPath: { value: o.moonPath ?? 0.3 }, uStairs: { value: new THREE.Vector4(0, -400, 1.0, 0) },
  };
  const g = new THREE.BufferGeometry();
  const X = 7000, Z0 = (o.shoreZ ?? -430) - 2, Z1 = 2500;
  g.setAttribute('position', new THREE.Float32BufferAttribute([-X, 0, Z1, X, 0, Z1, X, 0, Z0, -X, 0, Z0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vW = position; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
${BS_COMMON}
${BS_NOISE}
uniform vec4 uShips[${MAX_SHIPS}]; uniform vec4 uStairs;
uniform vec3 uSandA, uSandB, uBone, uHaze; uniform float uShore, uMoonPath;
varying vec3 vW;
void main(){
  vec2 p = vW.xz; float t = uTime;
  vec3 Vv = cameraPosition - vW; float d = length(Vv); vec3 V = Vv/max(d, 1e-3);
  float fp = max(length(dFdx(p)), length(dFdy(p)));
  // tone: slow drifts of paler and darker sand, old shorelines as long sinuous bands
  float big = bsF3(p/230.0 + 3.0), med = bsF2(p/41.0 + 11.0);
  vec2 sw = vec2(bsF2(p/310.0), bsF2(p/310.0 + 4.1));
  float band = bsF2(vec2(p.x/260.0, p.y/70.0) + 2.2*sw);
  float veins = 1.0 - smoothstep(0.0, 0.05 + 0.002*fp, abs(band - 0.5));
  vec3 alb = mix(uSandA, uSandB, clamp(0.55*big + 0.3*med - 0.1, 0.0, 1.0));
  alb *= 1.0 - 0.16*veins*(1.0 - smoothstep(20.0, 90.0, fp));
  alb *= 0.94 + 0.12*bsN(p*0.9)*(1.0 - smoothstep(0.3, 1.2, fp));                       // grain close by: coarse, fine, and the sand's own sparkle
  alb *= 0.9 + 0.2*bsN(p*7.3 + 1.7)*(1.0 - smoothstep(0.04, 0.3, fp));
  alb *= 0.88 + 0.24*bsH(floor(p*34.0))*(1.0 - smoothstep(0.012, 0.05, fp));
  // shell fragments and small pale stones lie scattered over the bed
  // (few, in loose drifts, no two alike: a cell in eleven holds one, and whole stretches hold none)
  vec2 pc = p*1.3 + 3.0*(vec2(bsN(p*0.21), bsN(p*0.21 + 5.0)) - 0.5), pcI = floor(pc); float pcH = bsH(pcI + 17.0), pcG = bsH(pcI + 41.0);
  vec2 pcJ = fract(pc) - 0.5 - (vec2(bsH(pcI + 3.0), bsH(pcI + 9.0)) - 0.5)*0.8;
  float pcA = pcG*6.2832; pcJ = vec2(cos(pcA)*pcJ.x - sin(pcA)*pcJ.y, sin(pcA)*pcJ.x + cos(pcA)*pcJ.y)*vec2(1.0, 1.5 + 1.5*pcG);
  float speck = step(0.91, pcH)*smoothstep(0.3, 0.6, bsN(p/23.0 + 9.0))*(1.0 - smoothstep(0.025 + 0.05*pcG, 0.05 + 0.07*pcG + fp*1.5, length(pcJ)))*(1.0 - smoothstep(0.03, 0.2, fp));
  alb = mix(alb, mix(uSandB*1.25, uBone*vec3(0.95, 0.82, 0.72), 0.3 + 0.5*pcG), 0.7*speck);
  float fine = 1.0 - smoothstep(0.03, 0.14, fp);
  // relief: broad swells 20 to 70 m long, undulations of 8 m, and ripple marks 1.3 m apart running across the wind;
  // every scale is lit by the low afterglow, and each fades by its own footprint so the bed keeps its grain far out
  float e = 2.0;
  float u0 = bsF2(p/52.0 + 1.3), ux = bsF2((p + vec2(e, 0.0))/52.0 + 1.3), uz = bsF2((p + vec2(0.0, e))/52.0 + 1.3);
  float v0 = bsN(p/9.0 + 5.0), vx = bsN((p + vec2(e, 0.0))/9.0 + 5.0), vz = bsN((p + vec2(0.0, e))/9.0 + 5.0);
  float nearK = 1.0 - smoothstep(2.0, 12.0, fp);
  vec3 N = vec3(-(ux - u0)/e*9.0 - (vx - v0)/e*1.1*nearK, 1.0, -(uz - u0)/e*9.0 - (vz - v0)/e*1.1*nearK);
  alb *= 0.86 + 0.28*u0;
  N.xz += (vec2(bsN(p*5.3), bsN(p*5.3 + 4.7)) - 0.5)*0.22*fine + (vec2(bsN(p*17.0), bsN(p*17.0 + 2.9)) - 0.5)*0.16*fine;      // pocked, grainy close by
  // ripple marks at three sizes (1.3 m, 5 m and 19 m from crest to crest), each fading where a pixel grows wider than its wave
  vec2 rd = normalize(vec2(uWind.x, uWind.y)), rd2 = normalize(rd + vec2(0.35, 0.1)), rd3 = normalize(rd - vec2(0.3, -0.25));
  vec2 rw = p + 6.0*(vec2(bsN(p/13.0), bsN(p/13.0 + 7.3)) - 0.5);
  float patchy = smoothstep(0.1, 0.4, bsN(p/61.0 + 3.0));
  float ra = dot(rw, rd)*4.8 + 2.2*bsN(p/6.0 + 2.0);
  float rm = (1.0 - smoothstep(0.3, 1.1, fwidth(ra)))*(0.45 + 0.55*patchy);
  float rs = ra + 0.6*sin(ra), rcA = cos(rs)*(1.0 + 0.6*cos(ra));                        // a steep lee and a long windward slope
  vec2 rw2 = p + 14.0*(vec2(bsN(p/53.0 + 2.0), bsN(p/53.0 + 9.3)) - 0.5);
  float rb = dot(rw2, rd2)*1.25 + 3.2*bsN(p/19.0 + 4.0);
  float rm2 = (1.0 - smoothstep(0.3, 1.1, fwidth(rb)))*(0.45 + 0.55*patchy);
  vec2 rw3 = p + 50.0*(vec2(bsN(p/190.0 + 6.0), bsN(p/190.0 + 1.3)) - 0.5);
  float rc = dot(rw3, rd3)*0.33 + 2.0*bsN(p/90.0 + 8.0);
  float rm3 = 1.0 - smoothstep(0.3, 1.1, fwidth(rc));
  N.xz -= rd*rcA*0.42*rm + rd2*cos(rb)*0.2*rm2 + rd3*cos(rc)*0.13*rm3;
  alb *= 1.0 - 0.24*rm*(0.5 - 0.5*sin(rs)) - 0.1*rm2*(0.5 - 0.5*sin(rb));

  // the twin tracks of every runner and the blue light under every sail
  float track = 0.0; vec3 sail = vec3(0.0); float glint = 0.0; vec2 gpx = dFdx(p), gpy = dFdy(p);
  for (int i = 0; i < ${MAX_SHIPS}; i++) {
    vec4 sh = uShips[i];
    float cc = cos(sh.z), sc = sin(sh.z); vec2 rel = p - sh.xy;
    float dx = rel.x*cc + rel.y*sc, dz = rel.y*cc - rel.x*sc;                            // across and astern of this ship
    float line = abs(abs(dx) - 3.0), lw = (abs(gpx.x*cc + gpx.y*sc) + abs(gpy.x*cc + gpy.y*sc))*1.2;
    float tr = (1.0 - smoothstep(0.14, 0.3 + lw, line))*smoothstep(-9.0, -5.0, dz)*(1.0 - smoothstep(60.0, 300.0, dz))*min(1.0, 0.3/(lw + 0.05));
    float rim = (1.0 - smoothstep(0.1, 0.25 + lw, abs(line - 0.42)))*smoothstep(-9.0, -5.0, dz)*(1.0 - smoothstep(40.0, 260.0, dz));
    track = max(track, tr*sh.w*(0.6 + 0.4*bsN(vec2(dz*0.35, sh.x))));
    glint += rim*sh.w*(1.0 - smoothstep(0.02, 0.2, lw));
    vec2 gv = vec2(dx - uTack*3.5, dz - 1.5)/vec2(12.0, 15.0);
    sail += uSailB*exp(-dot(gv, gv));
  }
  alb *= (1.0 - 0.34*track)*(1.0 + 0.3*min(glint, 1.0));
  // the thread of water from the stairs sinks into a dark wet fan
  vec2 wq = (p - uStairs.xy)/vec2(5.0, 9.0); float wet = (1.0 - smoothstep(0.3, 1.0, length(wq)))*step(uStairs.y - 2.0, p.y + 2.0)*uStairs.z;
  alb *= 1.0 - 0.45*wet;
  N = normalize(N);
  // the afterglow lies almost flat along the bed, so every slope that leans toward it lights and every lee goes blue
  float sl = dot(N.xz, normalize(uKeyDir.xz));
  // (the bed is dust, not snow: the afterglow on it is a rose-ochre light that reaches the flats too, and the blue of
  // the sky and the moons is left to the lee slopes, the hollows and the ground under the sails)
  vec3 keyS = mix(uKeyCol, dot(uKeyCol, vec3(0.3333))*vec3(1.25, 1.05, 0.55), 0.8)*1.05;
  vec3 Lg = uSkyCol*(0.29 + 0.12*N.y) + uGndCol*0.25 + keyS*clamp(0.55 + 2.1*sl, 0.05, 1.5) + uMoonCol*0.6*clamp(dot(N, uMoonDir), 0.0, 1.0);
  vec3 col = alb*Lg;
  col += alb*sail*1.0;
  // the moons' light lies on the sand as a long soft path, and wet sand and ripple crests glint in it
  vec3 R = reflect(-V, N);
  float mg = clamp(dot(R, uMoonDir), 0.0, 1.0); float mg2 = mg*mg; mg2 *= mg2; mg2 *= mg2;
  col += uMoonCol*alb*(mg2*1.6*uMoonPath + mg2*mg2*mg2*4.0*wet);
  // sand streamers: thin pale veils sliding over the bed downwind
  vec2 wd = normalize(uWind), wn = vec2(-wd.y, wd.x);
  float al = dot(p, wd), ac = dot(p, wn);
  float sn = bsN(vec2(ac/2.6 + 3.0*bsN(vec2(al/31.0 - t*0.21, ac/17.0)), al/38.0 - t*0.42));
  float spatch = smoothstep(0.35, 0.7, bsF2(vec2(al/120.0 - t*0.05, ac/90.0) + 6.0));
  float streak = smoothstep(0.5, 0.82, sn)*spatch*(1.0 - smoothstep(0.5, 3.0, fwidth(ac/2.6)));
  // and close to the eye the finer drift: quick thin veils of sand smoking along the bed
  float sn2 = bsN(vec2(ac/0.8 + 2.4*bsN(vec2(al/9.0 - t*0.9, ac/4.0)), al/12.0 - t*1.5));
  float sn3 = bsN(vec2(ac/0.31 + 1.7*bsN(vec2(al/5.0 - t*1.3, ac/2.0 + 7.0)), al/7.0 - t*2.3));
  float drift = (smoothstep(0.52, 0.9, sn2)*(1.0 - smoothstep(0.03, 0.3, fp)) + 0.7*smoothstep(0.6, 0.95, sn3)*(1.0 - smoothstep(0.01, 0.1, fp)))*(0.3 + 0.7*spatch);
  col = mix(col, (uSandB*1.1)*(uSkyCol*0.5 + keyS*0.9 + uMoonCol*0.4), clamp(0.36*streak + 0.42*drift, 0.0, 0.8));
  // a low haze lies on the bed: more of it the longer the line of sight runs near the ground, rose toward the afterglow
  float west = clamp(dot(normalize(-Vv.xz + vec2(1e-4)), normalize(uKeyDir.xz)), 0.0, 1.0);
  float hz = 1.0 - exp(-d*0.0034*(0.65 + 0.35*bsN(p/140.0 + vec2(t*0.02, 0.0))));
  vec3 hazeCol = mix(uFog.rgb, uHaze*(0.5 + 0.9*west*west), 0.6);
  col = mix(col, hazeCol, hz*0.36);
  col = mix(col, uFog.rgb, bsFogF(d));
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return { object: mesh, uniforms, material: mat };
}

// ---------------------------------------------------------------- the two hurrying moons
// Two discs on the far plane around whichever camera draws them; gibbous, lit from the left (the sun has gone
// down in the west-north-west). The world moves them along their arcs with the flight.
export function makeMoons(SH, o = {}) {
  const uniforms = {
    uDir: { value: [new THREE.Vector3(0, 0.2, -1), new THREE.Vector3(0, 0.4, -1)] },
    uCol: { value: [new THREE.Color('#FFF1D8'), new THREE.Color('#CFE0FF')] },
    uPhase: { value: new THREE.Vector2(o.phaseA ?? 0.72, o.phaseB ?? 0.6) }, uGain: { value: o.gain ?? 2.5 }, uTime: SH.uTime,
  };
  const pos = [], idx = [], which = [];
  for (let m = 0; m < 2; m++) { const b = m * 4; pos.push(-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0); which.push(m, m, m, m); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aWhich', new THREE.Float32BufferAttribute(which, 1)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
uniform vec3 uDir[2]; attribute float aWhich; varying vec2 vQ; varying float vM;
void main(){
  vec3 dir = normalize(aWhich < 0.5 ? uDir[0] : uDir[1]);
  float rad = aWhich < 0.5 ? 0.0218 : 0.0131;                       // 1.25 and 0.75 degrees
  vec3 rt = normalize(cross(dir, vec3(0.0, 1.0, 0.0))), up = cross(rt, dir);
  float halo = 5.0;
  vec3 wp = cameraPosition + (dir + (rt*position.x + up*position.y)*rad*halo)*2600.0;
  vQ = position.xy*halo; vM = aWhich;
  vec4 c = projectionMatrix*viewMatrix*vec4(wp, 1.0);
  gl_Position = c;
}`,
    fragmentShader: /* glsl */`
uniform vec3 uCol[2]; uniform vec2 uPhase; uniform float uGain, uTime; varying vec2 vQ; varying float vM;
float h2(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.x); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); return mix(mix(h2(i), h2(i + vec2(1., 0.)), f.x), mix(h2(i + vec2(0., 1.)), h2(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  float r2 = dot(vQ, vQ), r = sqrt(r2);
  vec3 col = vM < 0.5 ? uCol[0] : uCol[1]; float ph = vM < 0.5 ? uPhase.x : uPhase.y;
  float disc = 1.0 - smoothstep(0.94, 1.0, r);
  float z = sqrt(max(1.0 - r2, 0.0));
  vec3 n = vec3(vQ, z);
  float a = (ph - 0.5)*3.1416;                                        // the sun stands to the left: gibbous, waxing
  vec3 L = normalize(vec3(-cos(a), 0.22, sin(a)));
  float lit = smoothstep(-0.04, 0.12, dot(n, L))*(0.55 + 0.45*clamp(dot(n, L), 0.0, 1.0));
  float maria = 0.72 + 0.28*n2(vQ*2.6 + vM*17.0) + 0.14*n2(vQ*7.0 + 3.0) - 0.1;
  float crat = smoothstep(0.55, 0.8, n2(vQ*4.4 + 9.0 + vM*5.0));
  vec3 c = col*uGain*disc*(lit*maria*(1.0 - 0.18*crat) + 0.02);
  float halo = exp(-max(r - 0.9, 0.0)*1.9)*0.07*(1.0 - disc*0.9);
  c += col*halo*uGain*0.5;
  gl_FragColor = vec4(c, 1.0);
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = -0.5;
  return { object: mesh, uniforms };
}

// ---------------------------------------------------------------- the land round the town: bluffs and blue hills
// A coarse sheet. Under the town it drops into a pit (the town's own stone stands over it, and the canal's mirror
// needs the space below the water empty); beside and behind the town it rises into rounded hills to 140 m.
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function hillHeight(noise, x, z) {
  const ax = Math.abs(x);
  if (ax <= 300 && z <= -450 && z >= -850) return -120;
  const zc = ax <= 352 ? -432 : -432 + 0.3 * (ax - 352), dc = zc - z;
  if (dc <= 0) return -3;
  const tp = 10 + 35 * sstep(40, 240, ax), side = sstep(300, 352, ax);
  const base = (tp + (46 - tp) * side) * sstep(0, 70, dc);
  const far = Math.max(sstep(900, 1500, -z), sstep(352, 800, ax));
  const mound = Math.pow(0.5 + 0.5 * noise.fbm2(x / 520 + 3.1, z / 520 - 1.7, 3), 1.5);
  return base + (18 + 125 * mound) * far * sstep(0, 220, dc) + 9 * noise.n2(x / 170, z / 170) * sstep(40, 220, dc);
}
export function makeHills(SH, noise, o = {}) {
  const X0 = -2400, X1 = 2400, Z0 = -2600, Z1 = -350, ST = 50, nx = (X1 - X0) / ST, nz = (Z1 - Z0) / ST;
  const pos = [], idx = [];
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const x = X0 + i * ST, z = Z0 + j * ST; pos.push(x, hillHeight(noise, x, z), z); }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i; idx.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...SH, uHillA: { value: new THREE.Color(o.hill ?? '#6C6AA8') }, uHillB: { value: new THREE.Color(o.hillPale ?? '#B79AA8') } },
    vertexShader: /* glsl */`varying vec3 vW, vN; void main(){ vW = position; vN = normal; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
${BS_COMMON}
${BS_NOISE}
uniform vec3 uHillA, uHillB;
varying vec3 vW, vN;
void main(){
  if (vW.y < -2.5) discard;
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  float d = length(cameraPosition - vW);
  float n = bsF3(vW.xz/60.0) , m = bsF2(vW.xz/13.0 + 4.0);
  N = normalize(N + vec3(n - 0.5, 0.0, m - 0.5)*0.35);
  vec3 alb = mix(uHillA, uHillB, clamp(0.25 + 0.5*n + 0.2*m - 0.4*smoothstep(10.0, 120.0, vW.y), 0.0, 1.0))*0.55;
  // dry gullies running down the slopes
  float gul = smoothstep(0.42, 0.5, abs(bsF2(vec2(vW.x/34.0 + n*1.5, vW.z/90.0)) - 0.5));
  alb *= 0.8 + 0.2*gul;
  vec3 c = alb*bsLight(N);
  gl_FragColor = vec4(bsFog(c, d*1.25), 1.0);
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return { object: mesh, triangles: idx.length / 3 };
}

// ---------------------------------------------------------------- the flame birds, their canopy and their ribbons
// Up to two flocks. Each is a fan of small birds of fire, 70 m long, flying ahead of a white canopy that every
// bird draws by a pale green ribbon. The world moves uCanopy (xyz, how far it has settled) and uHead along the
// flock's route with the flight; wing beats, wheeling and ribbon flutter run on the clock.
const BIRD_GLSL = /* glsl */`
uniform vec4 uCanopy[2]; uniform vec3 uHead[2];
vec3 birdPos(vec4 sd, float fl, out vec3 fwd){
  vec4 cn = fl < 0.5 ? uCanopy[0] : uCanopy[1]; vec3 hd = fl < 0.5 ? uHead[0] : uHead[1];
  vec3 side = normalize(cross(hd, vec3(0.0, 1.0, 0.0)) + vec3(1e-5, 0.0, 0.0));
  float a = sd.x, t = uTime;
  vec3 fan = cn.xyz + hd*(11.0 + 59.0*a) + side*(sd.y*(3.0 + 34.0*a)) + vec3(0.0, 2.5 + 4.0*a + sd.w*(1.5 + 11.0*a), 0.0);
  fan += side*1.3*sin(t*0.9 + sd.z*6.0) + vec3(0.0, 0.9*sin(t*1.3 + sd.z*9.0), 0.0) + hd*1.6*sin(t*0.6 + sd.z*4.0);
  // settled, they wheel slowly round the canopy as a wide flat ring of sparks
  float th = t*(0.22 + 0.2*a)*(sd.y > 0.0 ? 1.0 : -1.0) + sd.z*6.283, rr = 9.0 + 22.0*a*a;
  vec3 ring = cn.xyz + vec3(cos(th)*rr, 1.5 + 5.0*abs(sd.w)*(0.4 + a) + 1.6*sin(th*2.0 + sd.z*5.0), sin(th)*rr);
  vec3 tang = vec3(-sin(th), 0.0, cos(th))*(sd.y > 0.0 ? 1.0 : -1.0);
  fwd = normalize(mix(hd, tang, cn.w) + vec3(0.0, 1e-4, 0.0));
  return mix(fan, ring, cn.w);
}`;
export function makeFlameBirds(SH, o = {}) {
  const rng = o.rng, flocks = o.flocks ?? 1, per = o.count ?? 900, n = per * flocks, group = new THREE.Group();
  const uniforms = { ...SH, uCanPh: { value: new THREE.Vector2(o.phase?.[0] ?? 0, o.phase?.[1] ?? 0) }, uCanopy: { value: [new THREE.Vector4(0, 60, -300, 0), new THREE.Vector4(0, -500, 0, 0)] }, uHead: { value: [new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0)] } };
  const SD = new Float32Array(n * 4), FL = new Float32Array(n);
  for (let i = 0; i < n; i++) { const a = Math.pow(rng(), 0.7); SD.set([a, (rng() * 2 - 1) * (0.35 + 0.65 * rng()), rng(), rng() * 2 - 1], i * 4); FL[i] = i < per ? 0 : 1; }
  // one bird: a body with a tail of flame, two wings (6 triangles)
  const bp = [0, 0, 0.3, -0.05, 0, 0, 0.05, 0, 0, 0, 0, -0.75, /* wings */ -0.04, 0, 0.12, -0.04, 0, -0.1, -0.3, 0, -0.06, -0.26, 0, 0.1, 0.04, 0, 0.12, 0.04, 0, -0.1, 0.3, 0, -0.06, 0.26, 0, 0.1];
  const bw = [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1], bh = [1, 1, 1, -0.4, 0.5, 0.5, 0.15, 0.15, 0.5, 0.5, 0.15, 0.15];
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute('aW', new THREE.Float32BufferAttribute(bw, 1)); bg.setAttribute('aHot', new THREE.Float32BufferAttribute(bh, 1));
  bg.setIndex([0, 1, 2, 1, 3, 2, 4, 5, 6, 4, 6, 7, 8, 10, 9, 8, 11, 10]);
  const birds = new THREE.Mesh(instanced(bg, n, [['aSeed', SD, 4], ['aFlock', FL, 1]]), new THREE.ShaderMaterial({
    uniforms, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
${BS_COMMON}
${BIRD_GLSL}
attribute vec4 aSeed; attribute float aFlock, aW, aHot; varying vec3 vC; varying float vD;
void main(){
  vec3 fwd; vec3 c = birdPos(aSeed, aFlock, fwd);
  vec3 sx = cross(fwd, vec3(0.0, 1.0, 0.0)); float sxl = length(sx);                      // (a bird that heads straight up or down has no such side: it takes a fixed one)
  vec3 side = sxl > 1e-4 ? sx/sxl : vec3(1.0, 0.0, 0.0), up = cross(side, fwd);
  float d = length(cameraPosition - c), k = max(1.0, 2.6*uPx*d/0.6);                       // never less than a few pixels of wing
  float flap = sin(uTime*(9.0 + 4.0*aSeed.z) + aSeed.z*40.0);
  vec3 lp = position; lp.y += aW*flap*0.24; lp.x *= 1.0 - 0.3*aW*flap*flap;
  vec3 wp = c + (side*lp.x + up*lp.y + fwd*lp.z)*k;
  float hot = clamp(aHot, 0.0, 1.0);
  vC = mix(vec3(1.0, 0.24, 0.03), vec3(1.0, 0.56, 0.16), hot)*(aHot < 0.0 ? 0.9 : 1.5 + 1.6*hot)*(0.75 + 0.25*flap)*min(1.0, 1.5/k + 0.12);
  vD = d;
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`,
    fragmentShader: /* glsl */`
${BS_COMMON}
varying vec3 vC; varying float vD;
void main(){ gl_FragColor = vec4(mix(max(vC, 0.0), uFog.rgb, 0.5*bsFogF(max(vD, 0.0))), 1.0); }`,
  }));
  birds.frustumCulled = false; group.add(birds);
  // ribbons: one from every bird to the canopy's rim
  const NR = 6, rp = [], ri = []; for (let i = 0; i <= NR; i++) rp.push(i / NR, -1, 0, i / NR, 1, 0); for (let i = 0; i < NR; i++) { const a = i * 2; ri.push(a, a + 2, a + 3, a, a + 3, a + 1); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setIndex(ri);
  const ribbons = new THREE.Mesh(instanced(rg, n, [['aSeed', SD, 4], ['aFlock', FL, 1]]), new THREE.ShaderMaterial({
    uniforms, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
${BS_COMMON}
${BIRD_GLSL}
attribute vec4 aSeed; attribute float aFlock; varying float vA;
void main(){
  vec3 fwd; vec3 b = birdPos(aSeed, aFlock, fwd);
  vec4 cn = aFlock < 0.5 ? uCanopy[0] : uCanopy[1];
  float k = aSeed.z*6.283 + aSeed.y*2.0, s = position.x;
  vec3 at = cn.xyz + vec3(cos(k)*6.6, -0.2, sin(k)*6.6);
  float len = length(b - at);
  vec3 wp = mix(at, b, s) - vec3(0.0, sin(3.1416*s)*len*(0.05 + 0.25*cn.w), 0.0);
  wp += vec3(sin(uTime*1.7 + s*9.0 + aSeed.z*20.0), cos(uTime*1.3 + s*7.0 + aSeed.z*11.0), 0.0)*0.35*sin(3.1416*s);
  vec3 Vv = cameraPosition - wp; float d = length(Vv);
  vec3 sd = normalize(cross(b - at, Vv) + vec3(0.0, 1e-4, 0.0));
  float w = max(0.05, 0.6*uPx*d);
  wp += sd*position.y*w;
  vA = 0.22*min(1.0, 0.05/w)*(0.4 + 0.6*s)*(1.0 - 0.8*cn.w)*(1.0 - bsFogF(d));
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`,
    fragmentShader: /* glsl */`
${BS_COMMON}
varying float vA;
void main(){ vec3 c = vec3(0.55, 0.9, 0.66)*(uSkyCol*1.0 + uKeyCol*0.6 + uMoonCol*0.4 + uGold*0.3); float a = clamp(vA, 0.0, 1.0); gl_FragColor = vec4(c*a, a); }`,
  }));
  ribbons.frustumCulled = false; ribbons.renderOrder = 5; group.add(ribbons);
  // the canopy: a shallow white dome 14 m across whose rim ripples
  const cp = [], cu = [], ci = [], RS = 20, RR = 5;
  for (let j = 0; j <= RR; j++) for (let i = 0; i <= RS; i++) { cp.push(0, 0, 0); cu.push(i / RS, j / RR); }
  for (let j = 0; j < RR; j++) for (let i = 0; i < RS; i++) { const a = j * (RS + 1) + i; ci.push(a, a + 1, a + RS + 2, a, a + RS + 2, a + RS + 1); }
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setAttribute('uv', new THREE.Float32BufferAttribute(cu, 2)); cg.setIndex(ci);
  const canopy = new THREE.Mesh(instanced(cg, flocks, [['aFlock', new Float32Array(flocks === 2 ? [0, 1] : [0]), 1]]), new THREE.ShaderMaterial({
    uniforms, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
${BS_COMMON}
${BIRD_GLSL}
attribute float aFlock; varying vec3 vN, vW; varying float vR;
uniform vec2 uCanPh; float cph = 0.0;                              // where in its ripple and bob this canopy starts (the world draws it)
vec3 dome(float a, float r, vec4 cn){
  float rip = (0.35*sin(a*5.0 + uTime*2.3 + cph) + 0.22*sin(a*9.0 - uTime*3.1 + cph*1.7))*r*r*(1.0 - 0.6*cn.w);
  return vec3(cos(a)*r*7.0, 1.9*(1.0 - r*r) - 0.3 + rip + 0.25*sin(uTime*1.1 + cph*0.6)*(1.0 - r), sin(a)*r*7.0);
}
void main(){
  vec4 cn = aFlock < 0.5 ? uCanopy[0] : uCanopy[1]; cph = aFlock < 0.5 ? uCanPh.x : uCanPh.y;
  float a = uv.x*6.2832, r = uv.y;
  vec3 p = dome(a, r, cn), px = dome(a + 0.05, r, cn), pr = dome(a, r + 0.05, cn);
  vN = normalize(cross(pr - p, px - p) + vec3(0.0, 1e-4, 0.0)); vW = cn.xyz + p; vR = r;
  gl_Position = projectionMatrix*viewMatrix*vec4(vW, 1.0);
}`,
    fragmentShader: /* glsl */`
${BS_COMMON}
varying vec3 vN, vW; varying float vR;
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0)); if (!gl_FrontFacing) N = -N;
  vec3 alb = vec3(0.78, 0.76, 0.74)*(0.92 + 0.08*sin(clamp(vR, 0.0, 1.0)*40.0));
  vec3 c = alb*bsLight(N) + alb*uGold*0.5*clamp(-N.y*0.5 + 0.5, 0.0, 1.0);             // the birds' fire lights it from ahead and below
  gl_FragColor = vec4(bsFog(c, length(cameraPosition - vW)), 1.0);
}`,
  }));
  canopy.frustumCulled = false; group.add(canopy);
  return { object: group, uniforms, count: n };
}

// ---------------------------------------------------------------- the old ones: globes of blue fire
// places: [{ x, y, z, r, ph, roam }]; they drift and pulse on the clock.
export function makeGlobes(SH, places) {
  const n = places.length, P = new Float32Array(n * 4), S = new Float32Array(n * 4);
  places.forEach((g, i) => { P.set([g.x, g.y, g.z, g.r], i * 4); S.set([g.ph, g.roam, (i * 0.618) % 1, (i * 0.383) % 1], i * 4); });
  const qg = new THREE.BufferGeometry(); qg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); qg.setIndex([0, 1, 2, 0, 2, 3]);
  const mesh = new THREE.Mesh(instanced(qg, n, [['iP', P, 4], ['iS', S, 4]]), new THREE.ShaderMaterial({
    uniforms: SH, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
${BS_COMMON}
attribute vec4 iP, iS; varying vec2 vQ; varying vec3 vK;
void main(){
  float t = uTime, ph = iS.x;
  vec3 wp = iP.xyz + vec3(sin(t*0.09 + ph)*iS.y + sin(t*0.31 + ph*2.0)*2.0, sin(t*0.21 + ph*3.0)*(2.0 + iS.y*0.08), cos(t*0.07 + ph*1.7)*iS.y);
  vec4 mv = viewMatrix*vec4(wp, 1.0);
  float d = -mv.z, r = max(iP.w, 3.0*uPx*d), halo = 4.0;
  mv.xy += position.xy*r*halo;
  vQ = position.xy*halo; vK = vec3(ph, sqrt(min(1.0, iP.w/r))*(0.75 + 0.25*sin(t*(0.7 + iS.z) + ph*4.0))*(1.0 - 0.8*bsFogF(d)), iS.w);
  gl_Position = projectionMatrix*mv;
}`,
    fragmentShader: /* glsl */`
${BS_COMMON}
${BS_NOISE}
varying vec2 vQ; varying vec3 vK;
void main(){
  float r = length(vQ), t = uTime;
  float ang = atan(vQ.y, vQ.x + 1e-5);
  float fl = bsN(vec2(ang*2.5 + vK.x*9.0, r*3.0 - t*1.4)) ;
  float core = 1.0 - smoothstep(0.55 + 0.3*fl, 1.0 + 0.25*fl, r);
  float inner = exp(-r*r*2.2);
  float halo = exp(-r*1.3)*0.3;
  vec3 c = vec3(0.07, 0.3, 1.0)*(1.5*core + 0.9*halo) + vec3(0.22, 0.5, 1.0)*0.5*inner*core;
  gl_FragColor = vec4(c*max(vK.y, 0.0)*1.3, 1.0);
}`,
  }));
  mesh.frustumCulled = false; mesh.renderOrder = 4;
  return { object: mesh };
}

// ---------------------------------------------------------------- the bones of the dead sea
// Built, never drawn on the sand: great rib cages lying half sunk, coiled shells as big as a boat, tusks and long
// bones standing out of the bed, loose vertebrae; each lies in a dark hollow of its own shadow.
// places: [{ x, z, kind (0 cage, 1 shell, 2 tusks, 3 vertebrae), s, rot, tilt, roll, sink }]
const BONE = lin('#F2EEE6');
const bk = (k) => [BONE[0] * k, BONE[1] * k * 0.98, BONE[2] * k];
function boneCage(A, r) {
  const NP = 7;
  // the spine: a row of thick vertebrae
  const sp = [], sr = [];
  for (let j = 0; j <= 20; j++) { sp.push([0.1 * Math.sin(j * 0.5), 0.1, -4.4 + j * 0.44]); sr.push(j % 2 ? 0.36 : 0.2); }
  tube(A, sp, sr, 5, bk(0.8), 0.1);
  for (let k = 0; k < NP; k++) {
    const z = -3.9 + k * 7.8 / (NP - 1), size = 0.6 + 0.4 * Math.sin(Math.PI * (k + 0.6) / (NP + 0.2));
    for (const sgn of [-1, 1]) {
      const broken = r() < 0.4, top = broken ? 1 + Math.floor(r() * 4) : 5, pts = [], rad = [];
      for (let j = 0; j <= top; j++) {
        const t = j / 5, a = t * 2.35;
        pts.push([sgn * (0.2 + 2.5 * size * Math.sin(a) * (1 - 0.15 * t)), 0.1 + 2.9 * size * (1 - Math.cos(a)) * 0.6, z + 0.5 * t * (k / (NP - 1) - 0.5) + 0.1 * Math.sin(k * 2.1 + j)]);
        rad.push(0.26 * (1 - 0.62 * t) + 0.05);
      }
      tube(A, pts, rad, 5, pts.map((q, j) => bk(0.78 + 0.22 * j / 5)), 0.1);
    }
  }
}
function boneShell(A, r) {
  // a coiled shell: a horn wound two and a half times, ribbed, thick as a man at the mouth
  const pts = [], rad = [], col = [], n = 38, turns = 2.4 + r() * 0.5;
  for (let j = 0; j <= n; j++) {
    const t = j / n, a = t * turns * 6.283, R = 0.16 * Math.exp(0.17 * a);
    pts.push([Math.cos(a) * R, 0, Math.sin(a) * R]); rad.push(Math.max(0.04, 0.46 * R * (j % 2 ? 1.0 : 0.86)) * (j === n ? 0.7 : 1)); col.push(bk(0.72 + 0.28 * (j % 2) - 0.1 * t));
  }
  tube(A, pts, rad, 7, col, 0.1);
}
function boneTusks(A, r) {
  const nt = 2 + Math.floor(r() * 3);
  for (let i = 0; i < nt; i++) {
    const x0 = (r() - 0.5) * 3.2, z0 = (r() - 0.5) * 3.2, lean = (r() - 0.5) * 1.6, len = 2.2 + r() * 2.4, curl = 0.5 + r() * 0.9, hd = r() * 6.283, pts = [], rad = [];
    for (let j = 0; j <= 6; j++) { const t = j / 6, a = lean * 0.4 + curl * t; pts.push([x0 + Math.cos(hd) * Math.sin(a) * len * t, -0.3 + Math.cos(a) * len * t, z0 + Math.sin(hd) * Math.sin(a) * len * t]); rad.push(0.3 * (1 - 0.8 * t) + 0.04); }
    tube(A, pts, rad, 6, pts.map((q, j) => bk(0.74 + 0.26 * j / 6)), 0.1);
  }
}
function boneVerts(A, r) {
  const nv = 4 + Math.floor(r() * 4);
  for (let i = 0; i < nv; i++) {
    const x = (i - nv / 2) * 0.95 + (r() - 0.5) * 0.5, z = Math.sin(i * 0.8) * 0.7 + (r() - 0.5) * 0.6, w = 0.3 + r() * 0.2, hd = r() * 3.14, dx = Math.cos(hd) * 0.3, dz = Math.sin(hd) * 0.3;
    tube(A, [[x - dx, 0.12, z - dz], [x - dx * 0.6, 0.16, z - dz * 0.6], [x + dx * 0.6, 0.16, z + dz * 0.6], [x + dx, 0.12, z + dz]], [w * 0.5, w, w, w * 0.5], 6, bk(0.8 + 0.2 * r()), 0.1);
    if (r() < 0.6) tube(A, [[x, 0.2, z], [x + (r() - 0.5) * 0.5, 0.9 + r() * 0.5, z + (r() - 0.5) * 0.5]], [0.12, 0.04], 4, bk(0.9), 0.1);
  }
}
export function makeBones(SH, places, rng) {
  const A = makeAcc(), group = new THREE.Group(), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const R = [4.6, 2.2, 2.6, 2.6], H = [2.6, 1.2, 3.6, 0.9];        // each kind's reach and height at scale 1
  for (const pl of places) {
    const T = makeAcc();
    [boneCage, boneShell, boneTusks, boneVerts][pl.kind](T, rng);
    e.set(pl.tilt || 0, pl.rot || 0, pl.roll || 0, 'YXZ'); q.setFromEuler(e); m.compose(v.set(pl.x, -(pl.sink || 0) * pl.s, pl.z), q, sc.set(pl.s, pl.s, pl.s));
    const base = A.n;
    for (let i = 0; i < T.n; i++) { v.set(T.p[i * 3], T.p[i * 3 + 1], T.p[i * 3 + 2]).applyMatrix4(m); vtx(A, v.x, v.y, v.z, [T.c[i * 3], T.c[i * 3 + 1], T.c[i * 3 + 2]], T.g[i]); }
    for (const ix of T.i) A.i.push(base + ix);
  }
  const geo = finish(A), mesh = new THREE.Mesh(geo, litMaterial(SH, { mode: 'plain', bounce: 0.5 })); mesh.frustumCulled = false; group.add(mesh);
  // the hollow each lies in: a soft dark patch on the sand, drawn out long on the side away from the afterglow
  const n = places.length, P = new Float32Array(n * 4), S = new Float32Array(n * 4);
  places.forEach((pl, i) => { P.set([pl.x, pl.z, R[pl.kind] * pl.s, H[pl.kind] * pl.s * Math.max(1 - (pl.sink || 0), 0.3)], i * 4); S.set([pl.rot || 0, i * 1.7, 0, 0], i * 4); });
  const qg = new THREE.BufferGeometry(); qg.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1], 3)); qg.setIndex([0, 2, 1, 0, 3, 2]);
  const shade = new THREE.Mesh(instanced(qg, n, [['iP', P, 4], ['iS', S, 4]]), new THREE.ShaderMaterial({
    uniforms: SH, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: /* glsl */`
${BS_COMMON}
attribute vec4 iP, iS; varying vec2 vQ; varying vec3 vW; varying float vL;
void main(){
  vec2 away = -normalize(uKeyDir.xz), side = vec2(-away.y, away.x);
  float len = iP.z + min(iP.w*2.6, 9.0);                                // the shadow runs out from under it, away from the low light
  vec2 c = iP.xy + away*(len - iP.z)*0.5;
  vec2 w = c + side*position.x*iP.z*1.25 + away*position.z*(len*0.5 + iP.z*0.25);
  vQ = position.xz; vW = vec3(w.x, 0.03, w.y); vL = (len - iP.z)/max(len, 1e-3);
  gl_Position = projectionMatrix*viewMatrix*vec4(vW, 1.0);
}`,
    fragmentShader: /* glsl */`
${BS_COMMON}
varying vec2 vQ; varying vec3 vW; varying float vL;
void main(){
  vec2 q = clamp(vQ, -1.0, 1.0); float r = length(q);
  float a = (1.0 - smoothstep(0.35, 1.0, r))*0.5;
  float d = length(cameraPosition - vW);
  gl_FragColor = vec4(uSkyCol*0.16*(1.0 - bsFogF(d)) + uFog.rgb*bsFogF(d), a*(1.0 - bsFogF(d)));
}`,
  }));
  shade.frustumCulled = false; shade.renderOrder = 1; group.add(shade);
  return { object: group, triangles: geo.userData.triangles };
}

// ---------------------------------------------------------------- loose stones and shell shards on the bed
// places: [{ x, z, s, rot, flat, tone }]; one instanced draw of a rough eight-faced stone
export function makeStones(SH, places) {
  // a worn slab: an uneven six-sided foot, a smaller uneven top
  const A = makeAcc(), c = bk(0.8), c2 = bk(0.95), foot = [], top = [], RA = [1.0, 0.8, 1.1, 0.9, 1.15, 0.75], RB = [0.55, 0.7, 0.5, 0.75, 0.6, 0.62];
  for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 + (k % 2) * 0.25; foot.push([Math.cos(a) * RA[k], -0.1, Math.sin(a) * RA[k], c]); top.push([Math.cos(a) * RB[k], 0.8 + 0.2 * (k % 3) * 0.5, Math.sin(a) * RB[k], c2]); }
  loft(A, [foot, top], true, true);
  const t0 = top.map((q) => vtx(A, q[0], q[1], q[2], c2, 0)); for (let k = 1; k < 5; k++) A.i.push(t0[0], t0[k + 1], t0[k]);
  const geo = finish(A, true), mesh = new THREE.InstancedMesh(geo, litMaterial(SH, { mode: 'plain', bounce: 0.4 }), places.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  places.forEach((pl, i) => { e.set(0, pl.rot, 0); q.setFromEuler(e); m.compose(v.set(pl.x, -0.02, pl.z), q, sc.set(pl.s, pl.s * pl.flat, pl.s * (0.7 + 0.6 * pl.tone))); mesh.setMatrixAt(i, m); });
  mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false;
  return { object: mesh };
}
