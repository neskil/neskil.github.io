// Stone Face: the device. Five hazard rigs and one false front, each a rigid mesh whose matrix is a closed
// form in u, solved backwards from where the lens will be so that it misses by its margin. One hat is the ruler.
// Axes: the camera travels -Z at y 1.7 on x 0; d (metres travelled) = 490 u; the gale blows +Z (at us).
import * as THREE from 'three';

export const LEN = 490, DUR = 41, EYE = 1.7, SPEED = LEN / DUR;
// (flight5) The round's two things, each behind one number of its own: 1 is on, 0 leaves the live version (flight4) exactly
export const HELD_POLE = 0;    // the pole that held: one standing telegraph pole where the last span ends (heldPole, called by makePoles)
export const CABLE_BODY = 0;   // the cable's body: the six wires 0.09 m thick, lit from the sky side (makeRibbon's tones, makePoles' widths)
// (cure1) THE LENS CURE, a third switch: 1 is on, 0 leaves every strand exactly where it is. The last span's two strands must cross the
// route's vertical plane (their pole falls across the street) and crossed it at the lens's height, whipping: LENS_CLEAR keeps their fall,
// whip, timing and ends and changes only how near the route's line (x 0, y EYE) a strand's body lies: see curve() in makeRibbon and makePoles
export const LENS_CLEAR = 1;
export const CLEAR_X = 2.5;    // metres from the route's plane over which the whip grows from nothing (a node on our line) to whole, and the lift dies
export const CLEAR_Y = 0.9;    // metres over or under the lens's height at which a strand of the last span crosses the route's plane at rest (0.6 m and 0.3 for the whip's residue and the pole's settling)
const D2R = Math.PI / 180, TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sat = (x) => clamp(x, 0, 1);
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const col = (h) => new THREE.Color(h);

// (flight3, the owner's cure) THE END OF THE WIND IS ONE RULE, CALLED AND NOT COPIED: 1 while the gale blows, falling to 0 as it dies and
// staying there. gale() takes its lull from this function and so do the telegraph wires, which hang still from the end of the wind
export function lullOf(u) { return 1 - sstep(0.67, 0.69, u); }
// gale strength from u alone: rises 0.35 -> 1 by 0.66, dies 0.67 -> 0.69, returns to 0.15 after 0.90
export function gale(u) {
  const rise = lerp(0.35, 1.0, sstep(0.0, 0.66, u));
  const lull = lullOf(u);
  return rise * lull + 0.15 * sstep(0.895, 0.915, u);
}

// GLSL shared by every material of the world: one sun, a hemisphere, a hand bounce on faces turned to the lens, fog
export const GLSL_COMMON = /* glsl */`
uniform vec3 uSun; uniform vec3 uSunC; uniform vec3 uSkyC; uniform vec3 uGndC; uniform vec3 uFogC; uniform float uFogD;
vec3 sfLit(vec3 alb, vec3 n, float sh) {
  float nl = max(dot(n, uSun), 0.) * sh;
  // sky fill: strongest on walls, half on the road (lit by hand: shade is blue, never grey)
  vec3 hemi = uSkyC * (n.y > 0. ? mix(1., .5, n.y) : mix(1., .25, -n.y));
  // the pale road throws warm light back up at faces turned to the lens, and a little at every wall
  vec3 bounce = uGndC * (max(n.z, 0.) * 2. + abs(n.x) * .7 + max(-n.y, 0.) * 1.2);
  return alb * (uSunC * nl + hemi + bounce);
}
vec3 sfFog(vec3 c, float d) { float f = 1. - exp(-uFogD * uFogD * d * d); return mix(c, uFogC, f); }
`;

export function makeShared(sunDir) {
  return {
    uSun: { value: sunDir.clone().normalize() },
    uSunC: { value: col('#FFF0D6').multiplyScalar(1.05) },   // (a shade warmer than the brief's #FFF6E2, so sun and blue shade part more decidedly)
    uSkyC: { value: col('#A9CBEE').multiplyScalar(0.9) },
    uGndC: { value: col('#E9DFC8').multiplyScalar(0.2) },
    uFogC: { value: col('#C9DDF2').multiplyScalar(0.92) },
    uFogD: { value: 0.00134 },
    uShadeC: { value: col('#8595AD').multiplyScalar(0.64) },   // what the road becomes in shadow
  };
}

// ---- rigid rig: boxes and cylinders merged into one geometry, with the same boxes kept for exact distance ----
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);
const _v = new THREE.Vector3(), _n3 = new THREE.Matrix3();
export class Rig {
  constructor() { this.pos = []; this.nor = []; this.colr = []; this.idx = []; this.boxes = []; this.inv = new THREE.Matrix4(); this.loc = []; this.ext = []; this.g = 1; }
  // gi (optional): [grain axis 0|1|2, half sizes x, y, z]: the surface shader draws sawn grain along that axis, end grain on its ends and a rubbed arris on every edge
  addGeo(geo, m, c, gi) {
    const P = geo.attributes.position, N = geo.attributes.normal, base = this.pos.length / 3;
    _n3.getNormalMatrix(m);
    for (let i = 0; i < P.count; i++) {
      _v.fromBufferAttribute(P, i).applyMatrix4(m); this.pos.push(_v.x, _v.y, _v.z);
      _v.fromBufferAttribute(N, i).applyMatrix3(_n3).normalize(); this.nor.push(_v.x, _v.y, _v.z);
      this.colr.push(c.r, c.g, c.b);
      if (gi) { const a = gi[0], x = P.getX(i), y = P.getY(i), z = P.getZ(i);
        if (a === 0) { this.loc.push(x, y, z); this.ext.push(gi[1], gi[2], gi[3], this.g); }
        else if (a === 1) { this.loc.push(y, z, x); this.ext.push(gi[2], gi[3], gi[1], this.g); }
        else { this.loc.push(z, x, y); this.ext.push(gi[3], gi[1], gi[2], this.g); }
      } else { this.loc.push(0, 0, 0); this.ext.push(9, 9, 9, 0); }
    }
    const I = geo.index; for (let i = 0; i < I.count; i++) this.idx.push(base + I.getX(i));
    geo.dispose();
  }
  mat(x, y, z, rx = 0, ry = 0, rz = 0) { return new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s); }
  box(w, h, d, c, x, y, z, rx = 0, ry = 0, rz = 0, solid = true) {
    const m = this.mat(x, y, z, rx, ry, rz);
    this.addGeo(new THREE.BoxGeometry(w, h, d), m, c, [w >= h && w >= d ? 0 : (h >= d ? 1 : 2), w / 2, h / 2, d / 2]);
    if (solid) this.boxes.push({ inv: m.clone().invert(), hx: w / 2, hy: h / 2, hz: d / 2 });
    return this;
  }
  // cylinder along local Y before the rotation
  cyl(r, h, c, x, y, z, rx = 0, ry = 0, rz = 0, seg = 12, solid = true) {
    const m = this.mat(x, y, z, rx, ry, rz);
    this.addGeo(new THREE.CylinderGeometry(r, r, h, seg), m, c, [1, 9, h / 2, 9]);
    if (solid) this.boxes.push({ inv: m.clone().invert(), hx: r, hy: h / 2, hz: r });
    return this;
  }
  build(litMat, shadowMat) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.colr, 3));
    g.setAttribute('aL', new THREE.Float32BufferAttribute(this.loc, 3)); g.setAttribute('aE', new THREE.Float32BufferAttribute(this.ext, 4));
    g.setIndex(this.idx);
    this.mesh = new THREE.Mesh(g, litMat); this.mesh.matrixAutoUpdate = false; this.mesh.frustumCulled = false;
    this.shadow = new THREE.Mesh(g, shadowMat); this.shadow.matrixAutoUpdate = false; this.shadow.frustumCulled = false; this.shadow.renderOrder = 2;
    this.pos = this.nor = this.colr = this.idx = this.loc = this.ext = null;
    return this;
  }
  set(m) { this.mesh.matrix.copy(m); this.shadow.matrix.copy(m); this.mesh.matrixWorldNeedsUpdate = true; this.shadow.matrixWorldNeedsUpdate = true; }
  // exact distance from a world point to the nearest box of the rig posed by matrix m
  distTo(m, wx, wy, wz) {
    this.inv.copy(m).invert(); let best = 1e9;
    const lx0 = _v.set(wx, wy, wz).applyMatrix4(this.inv).x, ly0 = _v.y, lz0 = _v.z;
    for (const b of this.boxes) {
      _p.set(lx0, ly0, lz0).applyMatrix4(b.inv);
      const dx = Math.max(Math.abs(_p.x) - b.hx, 0), dy = Math.max(Math.abs(_p.y) - b.hy, 0), dz = Math.max(Math.abs(_p.z) - b.hz, 0);
      const dd = Math.sqrt(dx * dx + dy * dy + dz * dz); if (dd < best) best = dd;
    }
    return best;
  }
}

// the smallest gap between a rig and the lens while it crosses: sampled over u around uc
export function missOf(rig, poseFn, uc, half = 0.012, n = 97) {
  let best = 1e9, bu = uc; const m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    const u = uc - half + (2 * half * i) / (n - 1); poseFn(u, m);
    const dd = rig.distTo(m, 0, EYE, -LEN * u); if (dd < best) { best = dd; bu = u; }
  }
  return { miss: best, u: bu };
}
// bisection on one parameter p in [a,b] so that f(p) = target (f monotone on the bracket)
export function solve(f, a, b, target, it = 26) {
  let fa = f(a) - target; const fb = f(b) - target;
  if (fa * fb > 0) return Math.abs(fa) < Math.abs(fb) ? a : b;
  for (let i = 0; i < it; i++) { const mid = (a + b) / 2, fm = f(mid) - target; if (fa * fm <= 0) b = mid; else { a = mid; fa = fm; } }
  return (a + b) / 2;
}

export function makeMaterials(shared) {
  const lit = new THREE.ShaderMaterial({
    uniforms: { ...shared },
    vertexShader: /* glsl */`
      attribute vec3 color; attribute vec3 aL; attribute vec4 aE; varying vec3 vC; varying vec3 vN; varying float vD; varying vec3 vL; varying vec4 vE;
      void main() { vC = color; vL = aL; vE = aE;
        #ifdef USE_INSTANCING
          mat4 mm = modelMatrix * instanceMatrix;
        #else
          mat4 mm = modelMatrix;
        #endif
        vN = normalize(mat3(mm) * normal + vec3(0., 1e-6, 0.));
        vec4 mv = viewMatrix * mm * vec4(position, 1.); vD = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      varying vec3 vC; varying vec3 vN; varying float vD; varying vec3 vL; varying vec4 vE;
      float sfH(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float sfN(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(mix(sfH(i), sfH(i + vec3(1., 0., 0.)), f.x), mix(sfH(i + vec3(0., 1., 0.)), sfH(i + vec3(1., 1., 0.)), f.x), f.y),
                   mix(mix(sfH(i + vec3(0., 0., 1.)), sfH(i + vec3(1., 0., 1.)), f.x), mix(sfH(i + vec3(0., 1., 1.)), sfH(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }
      void main() { vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) n = -n;
        // the things that miss us are made of something: close to, every board shows its sawn grain running down its length (long fibres, fine
        // hairs, a darker band now and then), rings on its sawn ends, and an arris rubbed pale along every edge. Iron and black stay plain
        float close = 1. - smoothstep(5., 24., vD), k = min(vE.w, 1.) * close, wd = smoothstep(.012, .07, dot(vC, vec3(.3, .5, .2)));
        float fib = sfN(vec3(vL.x * 1.6, vL.y * 46., vL.z * 46.)), hair = sfN(vec3(vL.x * 9., vL.y * 170., vL.z * 170.)), band = sfN(vec3(vL.x * .7 + 5., vL.y * 11., vL.z * 11.));
        vec3 alb = vC * (1. + ((fib - .5) * .62 + (hair - .5) * .2 * (1. - smoothstep(3., 9., vD)) + (band - .5) * .22) * k * wd);
        vec3 d3 = vE.xyz - abs(vL); float mid = d3.x + d3.y + d3.z - max(d3.x, max(d3.y, d3.z)) - min(d3.x, min(d3.y, d3.z));
        float endG = (1. - step(.0015, d3.x)) * k * wd;
        alb *= 1. - endG * (.22 + .2 * sin(length(vL.yz) * 260. + fib * 4.));
        float ar = (1. - smoothstep(.004, .012, mid)) * k * wd * (1. - smoothstep(4., 13., vD));
        alb = mix(alb, mix(alb * 1.45, vec3(.56, .47, .35), .45), ar * (.4 + .6 * sfN(vL * vec3(6., 40., 40.) + 3.)));
        // paint is worn: where it is thin (in patches, and most along the edges) the grey-brown board shows through
        float mx = max(vC.r, max(vC.g, vC.b)), sat = (mx - min(vC.r, min(vC.g, vC.b))) / max(mx, 1e-3);
        float wear = smoothstep(.62, .84, sfN(vec3(vL.x * 2.3, vL.y * 13., vL.z * 13.) + 9.) + .32 * (1. - smoothstep(0., .06, mid))) * smoothstep(.3, .55, sat) * k * wd * step(1.5, vE.w);   // (only on rigs marked as painted: g = 2)
        alb = mix(alb, vec3(.4, .33, .24) * (.75 + .5 * fib), wear * .62);
        // the pale road throws its light up under whatever hangs over it
        vec3 c = sfLit(alb, n, 1.) + alb * uGndC * max(-n.y, 0.) * 2.6;
        gl_FragColor = vec4(sfFog(c, vD), 1.); }`,
    side: THREE.DoubleSide,
  });
  // the same mesh flattened onto the ground along the sun; MIN blending, so overlapping parts never double up
  const shadow = () => new THREE.ShaderMaterial({
    // (second pass) a thing's own shadow is a darker blue than the shade of the street (0.15, 0.19, 0.27): under MIN blending a warm sunlit rut or
    // plank can then never show through it as olive; the brief's hazard shadows are the darkest thing on the road but the hat's
    uniforms: { ...shared, uShadeC: { value: new THREE.Color(0.105, 0.13, 0.2) }, uY: { value: 0.012 } },
    vertexShader: /* glsl */`
      uniform vec3 uSun; uniform float uY; varying float vD;
      void main() { vec4 w = modelMatrix * vec4(position, 1.);
        float t = max(w.y - uY, 0.) / max(uSun.y, 1e-3); w.xz -= uSun.xz * t; w.y = uY;
        vec4 mv = viewMatrix * w; vD = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uShadeC; uniform vec3 uFogC; uniform float uFogD; varying float vD;
      void main() { float f = 1. - exp(-uFogD * uFogD * vD * vD); gl_FragColor = vec4(mix(uShadeC, uFogC, f), 1.); }`,
    side: THREE.DoubleSide, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.MinEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  return { lit, shadow };
}

// ---- THE HAT: the ruler. A straw boater rolling on the rim of its brim, 5.0 m ahead on the centre line ----
// Restaged so that it reads as a hat from the first frame: seen three-quarter on (about 47 degrees off its axis, not down
// the crown), a tall pale crown standing out of a wide brim, the black band a ring round the side of the crown, two ribbon tails.
const HAT_R = 0.27;
function makeHat(mats, frontInfo, sunSide = -1) {
  const straw = col('#D9B25A').multiplyScalar(0.95), strawD = col('#A47A30'), pale = col('#F2E2B0').multiplyScalar(0.95), black = col('#16181C');
  const r = new Rig(); r.g = 0;
  r.cyl(HAT_R, 0.024, straw, 0, 0, 0, 0, 0, 0, 30);                      // the brim
  r.cyl(HAT_R - 0.004, 0.006, strawD, 0, -0.014, 0, 0, 0, 0, 30);        // its underside, darker
  r.cyl(HAT_R - 0.012, 0.004, strawD, 0, 0.0135, 0, 0, 0, 0, 30, false); r.cyl(HAT_R - 0.035, 0.005, straw, 0, 0.0145, 0, 0, 0, 0, 30, false);   // one dark plait near the brim's edge
  r.cyl(0.146, 0.17, pale.clone().multiplyScalar(0.9), 0, 0.097, 0, 0, 0, 0, 26);   // the crown
  r.cyl(0.151, 0.075, black, 0, 0.055, 0, 0, 0, 0, 26);                  // the band: a ring round the side of the crown
  r.cyl(0.147, 0.006, pale, 0, 0.184, 0, 0, 0, 0, 26);                   // the crown top, the palest thing on the hat
  r.box(0.07, 0.085, 0.13, black, 0.15, 0.056, 0, 0, 0, 0);              // the bow
  r.box(0.15, 0.006, 0.045, black, 0.22, 0.016, 0.045, 0, 0.3, 0, false); r.box(0.13, 0.006, 0.045, black, 0.21, 0.016, -0.045, 0, -0.35, 0, false);   // two ribbon tails over the brim's edge
  r.build(mats.lit, mats.shadow());
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), qa = new THREE.Quaternion(), ax = new THREE.Vector3(), pos = new THREE.Vector3();
  const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0);
  const state = { ahead: 5, y: 0, pos }, uL = frontInfo.uLand;
  const trueSun = r.shadow.material.uniforms.uSun.value, hatSun = trueSun.clone(); r.shadow.material.uniforms.uSun = { value: hatSun };
  r.shadow.material.uniforms.uShadeC = { value: new THREE.Color(0.055, 0.07, 0.115) };   // the ruler's own shadow is the darkest on the road: hard, round, under it in every frame
  r.pose = (u, time) => {
    // lift at the wall: the air picks it up from u 0.822 and draws it 1.3 m toward the wall, so that its shadow falls inside the
    // window's patch of sun; by the gasp (0.842) it hangs turning just under eye level on the line
    // between the window and its patch of sun; it is 2.0 m ahead as the window passes, and drops back when the front lands
    const up = sstep(0.822, 0.8405, u) * (1 - sstep(uL + 0.0005, uL + 0.0085, u));
    const ahead = lerp(5.0 - 0.8 * sstep(0.822, 0.84, u), 2.0, sstep(0.8445, uL - 0.004, u)) + (5.0 - 2.0) * sstep(uL + 0.001, uL + 0.017, u);
    const dHat = LEN * u + ahead;
    const gy = (u > uL && dHat > LEN - 60 - frontInfo.H && dHat < LEN - 60) ? frontInfo.thick : 0;
    const psi = TAU * 1.1 * time, cone = lerp(15, 16, up) * D2R, tilt = lerp(20, 34, up) * D2R, az = sunSide * 14 * up * D2R;
    // mean axis nearly upright, tipped 20 degrees toward the lens; a 15 degree cone about it, the contact point circling the brim
    // 1.1 times a second (the spun coin that never settles): the lens sees the hat's profile, 38 to 68 degrees off its axis; then the spin
    q.setFromAxisAngle(Y, az).multiply(qa.setFromAxisAngle(X, tilt));
    q.multiply(qa.setFromAxisAngle(Y, psi)).multiply(qa.setFromAxisAngle(X, cone)).multiply(qa.setFromAxisAngle(Y, -psi + time * 2.6 + up * 2.5));
    ax.set(0, 1, 0).applyQuaternion(q);
    const rest = gy + HAT_R * Math.sqrt(Math.max(1 - ax.y * ax.y, 0)) + 0.012;
    const tl = Math.max(u - (uL + 0.0085), 0) * DUR;                       // a tiny hop when it drops back
    const hop = 0.12 * Math.exp(-tl * 5) * Math.abs(Math.sin(tl * 9));
    const yUp = lerp(2.1, EYE, sstep(0.8445, uL - 0.004, u)) + 0.05 * Math.sin(time * 3.1);
    pos.set(0, lerp(rest, yUp, up) + hop, -dHat);
    m.compose(pos, q, _s); r.set(m);
    r.shadow.material.uniforms.uY.value = gy + 0.014;
    // while it hangs in the pushed air its shadow is thrown from nearly overhead, so that it lies in the window's patch of sun right under it
    { const k = sstep(0.822, 0.8405, u) * (1 - sstep(0.847, 0.857, u)); hatSun.set(lerp(trueSun.x, trueSun.x * 0.3, k), lerp(trueSun.y, 1, k), lerp(trueSun.z, 0.62, k)); }
    state.ahead = ahead; state.y = pos.y;
  };
  r.state = state;
  return r;
}

// ---- one white feather for the lull: it comes down past the lens 0.66 m to the right (its sway's inner end 0.50 m off the line, clear of a 21 to 9 frame's near plane; it was 0.5 and 0.34, then 0.61 and 0.45) ----
function makeFeather(mats, side) {
  const w = col('#F4F1E8').multiplyScalar(0.9), r = new Rig(); r.g = 0;
  r.box(0.012, 0.004, 0.13, w, 0, 0, 0, 0, 0, 0, false);
  r.box(0.034, 0.003, 0.1, w, 0, 0, 0.012, 0, 0, 0.25, false);
  r.box(0.022, 0.003, 0.05, w, 0.004, 0, -0.03, 0, 0, -0.3, false);
  r.build(mats.lit, mats.shadow());
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), e = new THREE.Euler();
  r.pose = (u, time) => {
    const s = (u - 0.752) * DUR;                       // seconds until the lens passes it (negative before)
    const rock = Math.sin(time * 2.3), fall = sat((u - 0.695) / 0.057);
    pos.set(side * (0.66 + 0.16 * rock), lerp(6.5, 1.72, fall) + 0.05 * Math.cos(time * 4.6) - Math.max(s, 0) * 0.5, -LEN * 0.752 - 0.3);
    q.setFromEuler(e.set(0.35 * rock, time * 0.9, 0.5 * Math.cos(time * 2.3)));
    m.compose(pos, q, _s.set(1, 1, 1).multiplyScalar(u > 0.69 && u < 0.77 ? 1 : 0.0001)); _s.set(1, 1, 1); r.set(m);
  };
  return r;
}

// ---- DUST: soft sprites, every burst a closed form in u (age = (u - u0) * 41 s), laid out at build ----
function makeDust(shared, cap) {
  const N = cap, org = new Float32Array(N * 3), vel = new Float32Array(N * 3), par = new Float32Array(N * 4);
  const geo = new THREE.InstancedBufferGeometry(); geo.copy(new THREE.PlaneGeometry(1, 1));
  let used = 0;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...shared, uU: { value: 0 }, uGale: { value: 0.35 }, uCol: { value: col('#E9DFC8').multiplyScalar(0.8) } },
    vertexShader: /* glsl */`
      attribute vec3 aOrg; attribute vec3 aVel; attribute vec4 aPar;   // u0, life s, size m, seed
      uniform float uU; uniform float uGale; varying vec2 vUv; varying vec3 vA; varying float vD;
      void main() {
        float age = (uU - aPar.x) * ${DUR.toFixed(1)}; float k = clamp(age / max(aPar.y, .01), 0., 1.);
        float on = step(0., age) * step(age, aPar.y);
        vec3 c = aOrg + aVel * (1. - exp(-2.4 * max(age, 0.))) / 2.4;
        c.y += .25 * max(age, 0.); c.z += (uGale * 5. + .4) * max(age, 0.) * (.6 + .4 * aPar.w);
        float sz = aPar.z * (.35 + 1.5 * sqrt(k)) * on;
        vec4 mv = viewMatrix * vec4(c, 1.); mv.xy += position.xy * sz;
        vUv = uv; vD = length(mv.xyz);
        // a puff is a body, not a veil: it stays whole for most of its life and then is eaten away from its edges (vA.y); close to the lens it thins out,
        // so that no landing ever lays a flat haze over the frame
        vA = vec3(on * smoothstep(0., .08, k) * (1. - k * k * k) * smoothstep(1.6, 7., vD), k, aPar.w);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      uniform vec3 uCol; varying vec2 vUv; varying vec3 vA; varying float vD;
      float dH2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float dVn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(dH2(i), dH2(i + vec2(1., 0.)), f.x), mix(dH2(i + vec2(0., 1.)), dH2(i + vec2(1., 1.)), f.x), f.y); }
      void main() { vec2 p = vUv - .5; float r2 = dot(p, p) * 4.;
        // a billow: lobes round a core, ragged at the edge, eaten away as it ages
        vec2 q = p * 4.2 + vA.z * 37.; float n1 = dVn(q), n2 = dVn(q * 2.3 + 11.), n = n1 * .62 + n2 * .38;
        float body = 1. - r2 - (1. - n) * (.7 + .55 * vA.y);
        float a = smoothstep(0., .34, body);
        // backlit by the sun ahead: every lobe has a lit crown and a blue belly (shade here is blue, never grey), the core a little deeper
        float up = p.y * 2. + (n1 - .5) * 1.5 + (n2 - .5) * .7;
        float lit = smoothstep(-.5, .45, up);
        vec3 c = uCol * mix(vec3(.42, .47, .6), uSunC * vec3(1.36, 1.3, 1.16), lit) * (1. - .16 * smoothstep(.25, .8, body) * (1. - lit));
        gl_FragColor = vec4(sfFog(c, vD), a * clamp(vA.x, 0., .86)); }`,
    transparent: true, depthWrite: false,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, N); mesh.frustumCulled = false; mesh.renderOrder = 5;
  const dust = {
    mesh, mat,
    // n sprites from (x,y,z) at u0; (dx,dy,dz) is the throw, spread the scatter of origins, speed m/s, life s, size m
    burst(rng, u0, x, y, z, n, o = {}) {
      const sp = o.speed ?? 2.5, life = o.life ?? 1.6, size = o.size ?? 0.9, sx = o.sx ?? 0.4, sz = o.sz ?? 0.4, d = o.dir || [0, 0.5, 0];
      for (let i = 0; i < n && used < N; i++, used++) {
        const a = rng() * TAU, rr = Math.sqrt(rng());
        org[used * 3] = x + Math.cos(a) * rr * sx; org[used * 3 + 1] = y + rng() * 0.2; org[used * 3 + 2] = z + Math.sin(a) * rr * sz;
        vel[used * 3] = (Math.cos(a) * 0.8 + d[0]) * sp * (0.5 + rng()); vel[used * 3 + 1] = (0.25 + d[1]) * sp * (0.4 + rng()); vel[used * 3 + 2] = (Math.sin(a) * 0.8 + d[2]) * sp * (0.5 + rng());
        par[used * 4] = u0 + rng() * 0.002; par[used * 4 + 1] = life * (0.7 + 0.6 * rng()); par[used * 4 + 2] = size * (0.7 + 0.6 * rng()); par[used * 4 + 3] = rng();
      }
    },
    finish() {
      for (let i = used; i < N; i++) par[i * 4] = 9;     // never born
      geo.setAttribute('aOrg', new THREE.InstancedBufferAttribute(org, 3));
      geo.setAttribute('aVel', new THREE.InstancedBufferAttribute(vel, 3));
      geo.setAttribute('aPar', new THREE.InstancedBufferAttribute(par, 4));
    },
  };
  return dust;
}

// ---- CHIPS: flecks of paint shaken loose, and grit the colour of the road's dust kicked up by whatever tears off, lets go or stamps; each a
// closed form in u. (lead6) Nothing breaks: there are no splinters of raw wood, the grit is the dust's own colour (CHIP_DUST) ----
const CHIP_DUST = col('#E9DFC8').multiplyScalar(0.8);
const hq2 = (i) => { const x = Math.sin(i * 12.9898 + 31.7) * 43758.5453; return x - Math.floor(x); };
function makeChips(P, cap) {
  const N = cap, o = new Float32Array(N * 3), v = new Float32Array(N * 3), q = new Float32Array(N * 4), c = new Float32Array(N * 3);
  let used = 0;
  const geo = new THREE.InstancedBufferGeometry(); geo.copy(new THREE.PlaneGeometry(1, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...P.shared, uRes: P.uRes, uU: { value: 0 }, uTime: { value: 0 }, uGale: { value: 0.35 } },
    vertexShader: /* glsl */`
      attribute vec3 aO; attribute vec3 aV; attribute vec4 aQ; attribute vec3 aC;   // u0, seed, size m, life s
      uniform float uU; uniform float uTime; uniform float uGale; uniform vec2 uRes;
      varying vec3 vC; varying float vLit; varying float vD; varying float vA;
      void main() {
        float age = (uU - aQ.x) * ${DUR.toFixed(1)}, a = max(age, 0.), sd = aQ.y;
        vec3 p = aO + aV * (1. - exp(-1.7 * a)) / 1.7;
        p.y -= 2.6 * a * a; p.z += uGale * 2.5 * a * a;
        p += vec3(sin(uTime * 3.1 + sd * 40.), .5 * sin(uTime * 4.3 + sd * 23.), cos(uTime * 2.7 + sd * 17.)) * .05 * min(a * 4., 1.);
        p.y = max(p.y, .025);
        float on = step(0., age) * step(age, aQ.w);
        vLit = .5 + .5 * sin(uTime * (7. + 6. * sd) + sd * 60.);
        vec4 mv = viewMatrix * vec4(p, 1.); float d = max(-mv.z, .05);
        float px = aQ.z * uRes.y * .5 * projectionMatrix[1][1] / d, sz = clamp(px, 1.7, 11.);
        vA = clamp(px / 1.7, .4, 1.) * smoothstep(0., .04, a) * (1. - smoothstep(aQ.w * .7, aQ.w, a)) * smoothstep(.5, 1.6, d);
        vec4 cp = projectionMatrix * mv; float rot = uTime * (3. + 6. * sd) + sd * 9.; vec2 e = vec2(cos(rot), sin(rot));
        vec2 off = (position.x * e * 1.7 + position.y * vec2(-e.y, e.x) * (.3 + .6 * abs(sin(rot * 1.7)))) * sz * on * 2.;
        cp.xy += off / uRes * cp.w; vC = aC; vD = d; gl_Position = cp; }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      varying vec3 vC; varying float vLit; varying float vD; varying float vA;
      void main() { vec3 c = vC * (uSkyC * .75 + uGndC + uSunC * 1.25 * vLit); gl_FragColor = vec4(sfFog(c, vD), vA); }`,
    transparent: true, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 4;
  return { mesh, mat,
    add(u0, x, y, z, vx, vy, vz, size, life, colr) { if (used >= N) return; const i = used++;
      o.set([x, y, z], i * 3); v.set([vx, vy, vz], i * 3); q.set([u0, hq2(i * 3.7), size, life], i * 4); c.set([colr.r, colr.g, colr.b], i * 3); },
    finish() { for (let i = used; i < N; i++) { q[i * 4] = 9; q[i * 4 + 3] = 1; }
      geo.setAttribute('aO', new THREE.InstancedBufferAttribute(o, 3)); geo.setAttribute('aV', new THREE.InstancedBufferAttribute(v, 3));
      geo.setAttribute('aQ', new THREE.InstancedBufferAttribute(q, 4)); geo.setAttribute('aC', new THREE.InstancedBufferAttribute(c, 3)); geo.instanceCount = N; } };
}

const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _qc = new THREE.Quaternion(), _pa = new THREE.Vector3(), _pb = new THREE.Vector3();
const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1), ONE = new THREE.Vector3(1, 1, 1);
const settle = (t) => (t <= 0 ? 1 : Math.exp(-6 * t) * Math.cos(22 * t));     // the brief's rebound, t in seconds

// ---- 1 SIGN: swings harder, one hook lets go, it tears off and scythes across between hat and lens ----
function makeSign(P, sx, uc, margin) {
  const red = col('#B8402E'), dark = col('#16181C'), cream = col('#F4F1E8').multiplyScalar(0.8);
  const r = new Rig();
  // a made thing: four planks with open joints and worn red paint, a raised pale moulding round the edge (proud of both faces, so the board
  // has a lit top and a shaded underside), a painted device of plain shapes (a lozenge between bars, no letters), two iron eyes, and the
  // hook that came out of the bracket still in one of them (whole: nothing is broken). The solid it is solved against holds all of it
  const iron = col('#2A2F38'), redD = red.clone().multiplyScalar(0.7); r.g = 2;
  r.boxes.push({ inv: new THREE.Matrix4(), hx: 1.2, hy: 0.4, hz: 0.056 });
  [1, 0.84, 1.1, 0.92].forEach((k, i) => r.box(2.38, 0.192, 0.06, red.clone().multiplyScalar(k), i % 2 ? 0.005 : -0.005, -0.3 + i * 0.2, 0, 0, 0, 0, false));
  r.box(2.36, 0.78, 0.03, dark, 0, 0, 0, 0, 0, 0, false);                               // the dark in the joints
  for (const y of [-0.364, 0.364]) r.box(2.4, 0.072, 0.11, cream, 0, y, 0, 0, 0, 0, false);
  for (const x of [-1.164, 1.164]) r.box(0.072, 0.8, 0.11, cream, x, 0, 0, 0, 0, 0, false);
  r.box(0.3, 0.3, 0.068, cream, 0, 0, 0, 0, 0, Math.PI / 4, false); r.box(0.16, 0.16, 0.074, redD, 0, 0, 0, 0, 0, Math.PI / 4, false);
  for (const s of [-1, 1]) { r.box(0.6, 0.06, 0.068, cream, s * 0.66, 0.075, 0, 0, 0, 0, false); r.box(0.4, 0.06, 0.068, cream, s * 0.56, -0.075, 0, 0, 0, 0, false);
    r.box(0.09, 0.09, 0.068, cream, s * 0.98, -0.075, 0, 0, 0, Math.PI / 4, false);
    r.box(0.026, 0.08, 0.026, iron, s * 1.0, 0.43, 0, 0, 0, 0, false); r.addGeo(new THREE.TorusGeometry(0.046, 0.012, 5, 12), r.mat(s * 1.0, 0.505, 0), iron); }
  r.box(0.018, 0.15, 0.018, iron, sx * 1.02, 0.6, 0, 0, 0, -sx * 0.35, false); r.box(0.075, 0.018, 0.018, iron, sx * 1.075, 0.675, 0, 0, 0, sx * 0.4, false);
  r.build(P.mats.lit, P.mats.shadow());
  const uT = uc - 0.010, uH = uc - 0.017, tc = (uc - uT) * DUR, dB = LEN * uc + 6.5;
  const hookL = new THREE.Vector3(sx * 1.0, 0.55, 0), hookW = new THREE.Vector3(sx * 6.7, 3.75, -dB);
  // the bracket it hung from stays on the wall
  { const armC = col('#F4F1E8').multiplyScalar(0.84);   // a white timber arm with a knee brace and a wall plate, like every other sign's in the street
    P.fx.box(3.0, 0.13, 0.13, armC, sx * 5.6, 3.82, -dB, 0, 0, 0, false).box(1.6, 0.1, 0.1, armC, sx * 6.4, 3.3, -dB, 0, 0, sx * 0.82, false)
      .box(0.1, 1.6, 0.16, armC, sx * 6.95, 3.3, -dB, 0, 0, 0, false).box(0.16, 0.2, 0.16, armC, sx * 4.08, 3.82, -dB, 0, 0, 0, false); }
  const wind = (u, pos, q) => {
    const A = lerp(60, 72, sstep(0.0, uH, u)) * D2R, ph = TAU * 1.25 * DUR * u;
    const th = A * (0.5 + 0.5 * Math.sin(ph)), dang = sstep(uH, uH + 0.0035, u);
    const phi = sx * dang * (58 + 14 * Math.sin((u - uH) * DUR * 13)) * D2R;
    q.setFromAxisAngle(AX, th * (1 - 0.5 * dang)).multiply(_qa.setFromAxisAngle(AZ, phi));
    pos.copy(hookL).negate().applyQuaternion(q).add(hookW);
  };
  const p0 = new THREE.Vector3(), q0 = new THREE.Quaternion(), qFlat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + 0.02, 0.5 * sx, 0));
  wind(uT, p0, q0);
  let ahead = 3;                                           // metres ahead of the lens where its centre crosses our line
  const g = 9.81, yc = 1.75;
  const pos = new THREE.Vector3(), q = new THREE.Quaternion();
  let tb = 1, vx = 0, vy = 0, vz = 0;
  const aim = () => { vx = (0 - p0.x) / tc; vz = (-(LEN * uc + ahead) - p0.z) / tc; vy = (yc - p0.y + 0.5 * g * tc * tc) / tc;
    tb = (vy + Math.sqrt(vy * vy + 2 * g * (p0.y - 0.5))) / g; };
  const pose = (u, m) => {
    if (u <= uT) wind(u, pos, q);
    else {
      const t = (u - uT) * DUR, tf = Math.min(t, tb), ts = Math.max(t - tb, 0);
      const slide = (1 - Math.exp(-3.2 * ts)) / 3.2;
      pos.set(p0.x + vx * tf + vx * 0.55 * slide, p0.y + vy * tf - 0.5 * g * tf * tf, p0.z + vz * tf + vz * 0.4 * slide);
      if (ts > 0) pos.y = 0.07 + 0.43 * Math.exp(-5 * ts) * Math.abs(Math.cos(ts * 7.5));
      pos.x = clamp(pos.x, -5.4, 5.4);
      q.setFromAxisAngle(AY, -sx * TAU * tf / tc).multiply(q0);          // one full turn by the crossing (2.4 turns a second): it crosses face on
      if (ts > 0) q.slerp(qFlat, sstep(0, 0.3, ts));
    }
    m.compose(pos, q, ONE);
  };
  aim(); ahead = solve((a) => { ahead = a; aim(); return missOf(r, pose, uc).miss; }, 2.0, 6.5, margin); aim();
  const land = new THREE.Vector3(clamp(p0.x + vx * tb, -5, 5), 0.1, p0.z + vz * tb);
  P.dust.burst(P.rng, uT + tb / DUR, land.x, 0.1, land.z, Math.round(9 * P.detail), { speed: 2.2, life: 1.3, size: 0.8, dir: [-sx * 0.6, 0.4, 0.2] });
  // what it sheds: a kick of dust and paint where the hook comes out of the bracket, and flecks of its red paint all the way across, left hanging in its wake
  { const mm = new THREE.Matrix4(), w0 = new THREE.Vector3(), w1 = new THREE.Vector3(), n = Math.round(46 * P.detail);
    for (let i = 0; i < Math.round(14 * P.detail); i++) P.chips.add(uT + 0.0006 * i / 14, hookW.x, hookW.y + 0.05, hookW.z, -sx * (0.6 + 2.2 * hq2(i * 5.1)), 0.4 + 2 * hq2(i * 7.3), 0.6 + 1.6 * hq2(i * 9.7), 0.03 + 0.03 * hq2(i * 2.9), 1.5, i % 3 ? CHIP_DUST : red);
    for (let i = 0; i < n; i++) { const tt = tc * (0.04 + 0.98 * (i + hq2(i * 3.3)) / n), uu = uT + tt / DUR, lx = (hq2(i * 4.7) - 0.5) * 2.3, ly = (hq2(i * 6.1) - 0.5) * 0.76;
      pose(uu, mm); w0.set(lx, ly, 0).applyMatrix4(mm); pose(uu + 0.0004, mm); w1.set(lx, ly, 0).applyMatrix4(mm);
      w1.sub(w0).multiplyScalar(0.3 / (0.0004 * DUR));
      P.chips.add(uu, w0.x, w0.y, w0.z, w1.x + (hq2(i * 8.3) - 0.5) * 1.6, w1.y + 0.5 + hq2(i * 10.9), w1.z + (hq2(i * 12.7) - 0.5) * 1.6, 0.022 + 0.034 * hq2(i * 14.1), 1.1 + 0.8 * hq2(i * 15.7), i % 5 === 4 ? cream : (i % 5 === 2 ? CHIP_DUST : red)); } }
  const m = new THREE.Matrix4();
  return { rig: r, uc, name: 'sign', miss: () => missOf(r, pose, uc), update(u) { pose(u, m); r.set(m); } };
}

// ---- 2 CARTS: two hand carts rock, roll out of the facing alleys and cross, the second between hat and lens ----
function makeCartRig(P, tint) {
  const wood = col('#B08A5A').multiplyScalar(0.8), paint = col(tint), dark = col('#16181C'), sack = col('#E9DFC8').multiplyScalar(0.8);
  const body = new Rig(), wheels = new Rig(); body.g = 2;
  // open railed sides, not panels: when the cart is between the hat and the lens the hat is seen THROUGH it
  body.box(2.2, 0.1, 0.9, paint, 0, 0.14, 0).box(2.2, 0.07, 0.06, paint, 0, 0.52, 0.45).box(2.2, 0.07, 0.06, paint, 0, 0.52, -0.45);
  body.box(0.06, 0.07, 0.9, paint, -1.1, 0.52, 0).box(0.06, 0.07, 0.9, paint, 1.1, 0.52, 0);
  for (const z of [0.45, -0.45]) for (let i = 0; i < 5; i++) body.box(0.06, 0.34, 0.06, paint, -1.07 + i * 0.535, 0.34, z, 0, 0, 0, false);
  body.box(1.4, 0.07, 0.07, wood, 1.8, 0.14, 0.38).box(1.4, 0.07, 0.07, wood, 1.8, 0.14, -0.38).box(0.07, 0.07, 0.83, wood, 2.45, 0.14, 0);
  body.box(0.08, 0.08, 1.16, dark, 0, 0, 0, 0, 0, 0, false);
  body.box(0.5, 0.42, 0.6, sack, -0.8, 0.41, 0.02, 0, 0.2, 0);   // the load sits at the tail: ahead of the wheels the cart is open
  for (const z of [0.54, -0.54]) {
    wheels.addGeo(new THREE.TorusGeometry(0.51, 0.045, 6, 22), wheels.mat(0, 0, z), dark);
    wheels.boxes.push({ inv: wheels.mat(0, 0, z).invert(), hx: 0.55, hy: 0.55, hz: 0.045 });
    for (let k = 0; k < 4; k++) wheels.box(1.0, 0.045, 0.04, wood, 0, 0, z, 0, 0, k * Math.PI / 4, false);
    wheels.cyl(0.08, 0.12, dark, 0, 0, z, Math.PI / 2, 0, 0, 8, false);
  }
  body.build(P.mats.lit, P.mats.shadow()); wheels.build(P.mats.lit, P.mats.shadow());
  return { body, wheels };
}
function makeCarts(P, sx, uc, margin) {
  const A = makeCartRig(P, '#8FA3BD'), B = makeCartRig(P, '#8FA3BD');   // (lead6) both carts slate: straw yellow is the hat's alone
  const uGo = uc - 0.045, x0 = 9.3, R = 0.55, kerb = 4.5 - R;      // the wheels strike the far kerb, the shafts go on over the boardwalk
  // cart k: from side s (start x = s * x0), crosses our line at time tX (s from uc) on the line d = dz
  const mk = (cart, s, tX, getD) => {
    const tGo = (uGo - uc) * DUR, T = tX - tGo, v = 2 * x0 / T, tK = tX + kerb / v;   // constant acceleration from rest, then coast to the kerb
    const pos = new THREE.Vector3(), q = new THREE.Quaternion();
    const st = { spin: 0 };
    const pose = (u, m) => {
      const t = (u - uc) * DUR, ta = clamp(t - tGo, 0, T), tb = clamp(t - tX, 0, tK - tX), ts = t - tK;
      const run = x0 * (ta / T) * (ta / T) + v * tb;                      // metres rolled
      const rockW = sstep(uGo - 0.034, uGo - 0.03, u) * (1 - sstep(uGo - 0.002, uGo + 0.004, u));
      let pitch = rockW * 9 * D2R * Math.sin(TAU * 2 * (u - (uGo - 0.034)) / 0.034), hop = 0;
      const going = sat(ta / 0.3) * (ts > 0 ? 0 : 1);                   // rattling while it rolls
      pitch += going * (3.2 * Math.sin(t * 31 + s) + 2.2 * Math.sin(t * 53)) * D2R; hop = going * 0.05 * Math.abs(Math.sin(t * 23 + s));
      // it strikes the far kerb, rebounds, and tips back onto its tail: shafts in the air (34 degrees is the tail on the road)
      if (ts > 0) { pitch = Math.min(34 * (1 - Math.exp(-5 * ts) * Math.cos(11 * ts)), 35.5) * D2R; hop = 0.2 * Math.exp(-5 * ts) * Math.abs(Math.sin(ts * 9)); }
      const back = ts > 0 ? 0.55 * (1 - Math.exp(-4 * ts)) : 0;          // thrown back off the kerb
      st.spin = -(run / R) - (ts > 0 ? (v / R) * (1 - Math.exp(-0.45 * ts)) / 0.45 : 0);
      pos.set(s * (x0 - run + back), R + hop, -getD());
      q.setFromAxisAngle(AY, s > 0 ? Math.PI : 0).multiply(_qa.setFromAxisAngle(AZ, pitch));
      m.compose(pos, q, ONE);
    };
    const m = new THREE.Matrix4(), mw = new THREE.Matrix4();
    P.dust.burst(P.rng, uc + tK / DUR, -s * 4.3, 0.1, -getD(), Math.round(12 * P.detail), { speed: 2.6, life: 1.6, size: 1.1, dir: [s * 0.5, 0.5, 0.2] });
    // road dust from the wheels, all the way back to the alley mouth it came out of
    for (let run = 1.2; run < x0 + kerb; run += 1.3) {
      if (Math.abs(x0 - run + 0.3) < 1.4) continue;                     // none on the centre line: nothing veils the hat
      const tr = run <= x0 ? tGo + T * Math.sqrt(run / x0) : tX + (run - x0) / v;
      P.dust.burst(P.rng, uc + tr / DUR, s * (x0 - run + 0.3), 0.08, -getD(), Math.max(2, Math.round(3 * P.detail)), { speed: 1.5, life: 1.5, size: 0.8, sx: 0.3, sz: 0.6, dir: [s * 0.7, 0.25, 0] });
    }
    return { pose, tK, update(u) { pose(u, m); cart.body.set(m); mw.copy(m).multiply(_m.makeRotationZ(st.spin)); cart.wheels.set(mw); } };
  };
  let dB = LEN * uc + 2.3;
  const tA = -0.5, dA = LEN * (uc + tA / DUR) + 5 + 4.0 + 0.6;   // 4.0 m beyond the hat: tipped at the far kerb and still in frame as the second crosses                    // 2.0 m beyond the hat (1.5 would have the carts touch)
  const b = mk(B, -sx, 0, () => dB);
  // both body and wheels count for the miss
  const missB = () => { const a = missOf(B.body, b.pose, uc), w = missOf(B.wheels, b.pose, uc); return a.miss < w.miss ? a : w; };
  dB = solve((d) => { dB = d; return missB().miss; }, LEN * uc + 1.2, LEN * uc + 4.5, margin);
  const a = mk(A, sx, tA, () => dA);
  return { rigs: [A.body, A.wheels, B.body, B.wheels], uc, name: 'carts', miss: missB, update(u) { a.update(u); b.update(u); } };
}

// ---- 3 LADDER: slides off a gantry, lands on end, cartwheels down the centre line; the lens goes through one bay ----
function makeLadder(P, sx, uc, margin) {
  const wood = col('#C9A56A').multiplyScalar(0.85), woodD = col('#8C6A3F'), r = new Rig();
  const half = 4.5, bay = [0.64, 0.64 + 2 * margin + 0.12];                 // the bay the lens uses: clear gap 2 * margin
  r.box(0.12, 9, 0.12, wood, -(margin + 0.06), 0, 0).box(0.12, 9, 0.12, wood, margin + 0.06, 0, 0);   // rails clear the lens by the margin too
  for (const y of [bay[0], bay[1], 4.5, 9 - bay[1], 9 - bay[0]]) r.box(2 * margin, 0.12, 0.1, woodD, 0, y - half, 0);
  // where each rung meets a rail: an iron bolt right through (a head on each face) and the rung's tenon showing on the outside; iron shoes on the rail ends
  { const ironL = col('#2A2F38'), tenon = woodD.clone().multiplyScalar(1.5);
    for (const y of [bay[0], bay[1], 4.5, 9 - bay[1], 9 - bay[0]]) for (const s of [-1, 1]) {
      r.box(0.05, 0.05, 0.15, ironL, s * (margin + 0.075), y - half, 0, 0, 0, 0, false);
      r.box(0.016, 0.1, 0.08, tenon, s * (margin + 0.122), y - half, 0, 0, 0, 0, false); }
    for (const s of [-1, 1]) for (const e of [-1, 1]) r.box(0.135, 0.22, 0.135, ironL, s * (margin + 0.06), e * (half - 0.11), 0, 0, 0, 0, false); }
  r.build(P.mats.lit, P.mats.shadow());
  const tFlat = -0.43, tF = tFlat - 1, tEnd = tFlat - 0.5, tS = (uc - 0.066 - uc) * DUR, hT = 4.0;   // seconds from the crossing
  let p = 0.1;
  const dC = LEN * uc, slideLen = 6 * (tF - tS) / 2;
  const pos = new THREE.Vector3(), q = new THREE.Quaternion();
  const pose = (u, m) => {
    const t = (u - uc) * DUR;
    let d, phi, h;
    if (t >= tF) { d = dC + p - 6 * t; phi = Math.PI * (t - tFlat); }
    else { const k = sat((t - tS) / (tF - tS)); d = dC + p - 6 * tF + slideLen * (1 - k * k); phi = -Math.PI; }
    const slip = sstep(uc - 0.083, uc - 0.080, u);                           // one visible slip before it goes
    d += 0.45 * (1 - slip) * (t < tF ? 1 : 0) * (1 - sat((t - tS) / (tF - tS)));
    const rockA = (sstep(uc - 0.12, uc - 0.07, u)) * (t < tS ? 1 : Math.max(0, 1 - (t - tS) * 2));
    phi += rockA * 3.2 * D2R * Math.sin(TAU * 1.3 * DUR * u) + (slip - sstep(uc - 0.080, uc - 0.074, u)) * 4 * D2R;
    const drop = 1 - sstep(tF, tEnd, t), stamp = Math.exp(-Math.max(t - tEnd, 0) * 7) * (t > tEnd ? 1 : 0);
    h = 0.08 + 4.42 * Math.abs(Math.sin(phi)) + hT * drop + 0.25 * stamp * Math.abs(Math.sin((t - tEnd) * 16));
    pos.set(0, h, -d); q.setFromAxisAngle(AX, phi - Math.PI / 2);
    m.compose(pos, q, ONE);
  };
  // solve p so that the lens goes through the ladder's plane exactly in the middle of the bay
  const mm = new THREE.Matrix4(), inv = new THREE.Matrix4(), lp = new THREE.Vector3();
  const off = (pp) => { p = pp; let pz = 0, py = 0, first = true;
    for (let i = 0; i <= 240; i++) { const u = uc - 0.008 + 0.014 * i / 240; pose(u, mm); inv.copy(mm).invert(); lp.set(0, EYE, -LEN * u).applyMatrix4(inv);
      if (!first && pz * lp.z <= 0) { const k = pz / (pz - lp.z + 1e-9); return lerp(py, lp.y, k) + half - (bay[0] + bay[1]) / 2; }
      pz = lp.z; py = lp.y; first = false; }
    return lp.y + half - (bay[0] + bay[1]) / 2; };
  p = solve(off, -1.2, 1.6, 0);
  // the gantry it lay on: two frames 4 m high, legs at the kerbs
  const dRest = dC + p - 6 * tF + slideLen;
  const pale = col('#D8CBB0').multiplyScalar(0.82);
  for (const dz of [-2.6, 2.6]) { P.fx.box(9.0, 0.14, 0.14, pale, 0, hT - 0.07, -(dRest + dz));
    for (const s of [-1, 1]) { P.fx.box(0.14, hT, 0.14, pale, s * 4.4, hT / 2, -(dRest + dz)); P.fx.box(0.1, 2.2, 0.1, pale, s * 3.75, hT - 0.75, -(dRest + dz), 0, 0, s * 0.7, false); } }
  const n = Math.round(10 * P.detail);
  P.dust.burst(P.rng, uc + tEnd / DUR, 0, 0.1, -(dC + p - 6 * tEnd), n, { speed: 2.6, life: 1.5, size: 1.0 });
  P.dust.burst(P.rng, uc + tFlat / DUR, 0, 0.1, -(dC + p - 6 * tFlat + 3.5), n, { speed: 3, life: 1.2, size: 0.9, sx: 1.0, sz: 2.5 });
  P.dust.burst(P.rng, uc + (tFlat + 1) / DUR, 0, 0.1, -(dC + p - 6 * (tFlat + 1)), n, { speed: 3, life: 1.2, size: 0.9, sx: 1.0, sz: 2.5 });
  // each stamp of a rail end kicks dust off the road, and the gale carries it down the street past the rails and past us (clear of the middle)
  { const mm2 = new THREE.Matrix4(), e0 = new THREE.Vector3(), e1 = new THREE.Vector3();
    for (const tt of [-0.43, -0.36, -0.29, -0.22, -0.15, -0.08]) for (const s of [-1, 1]) {
      pose(uc + tt / DUR, mm2); e0.set(s * (margin + 0.06), -half, 0).applyMatrix4(mm2); e1.set(s * (margin + 0.06), half, 0).applyMatrix4(mm2);
      const lo = e0.y < e1.y ? e0 : e1;
      P.dust.burst(P.rng, uc + tt / DUR, lo.x + s * 0.25, 0.1, lo.z, Math.max(2, Math.round(3 * P.detail)), { speed: 1.5, life: 1.25, size: 0.75, sx: 0.2, sz: 0.3, dir: [s * 0.35, 0.3, 2.6] });
      for (let i = 0; i < 2; i++) P.chips.add(uc + tt / DUR, lo.x, 0.1, lo.z, s * (0.3 + hq2(tt * 31 + i + s)), 1.2 + 1.5 * hq2(tt * 17 + i * 3 + s), 1 + 2 * hq2(tt * 23 + i * 7), 0.025 + 0.02 * hq2(i + tt * 9), 1.1, CHIP_DUST); } }
  for (const s of [-1, 1]) for (let j = 0; j < 5; j++)
    P.dust.burst(P.rng, uc + (tFlat + 0.03 * j) / DUR, s * 1.5, 0.08, -(dC + p - 6 * tFlat - 0.8 + j * 1.3), 2, { speed: 1.3, life: 1.3, size: 0.95, sx: 0.15, sz: 0.5, dir: [s * 0.6, 0.45, 1.2] });
  const m = new THREE.Matrix4();
  return { rig: r, uc, name: 'ladder', miss: () => missOf(r, pose, uc, 0.008, 161), update(u) { pose(u, m); r.set(m); } };
}

// ---- BARRELS (takes the carts' slot on some seeds): nine roll out of the alley in a train; the lens goes between the 4th and 5th ----
function makeBarrels(P, sx, uc, margin) {
  const wood = col('#A9793F').multiplyScalar(0.85), hoop = col('#16181C'), pale = col('#E9DFC8').multiplyScalar(0.8);
  const R = 0.45, v = 6.5, gap = 2 * (margin + R), dt = gap / v, acc = 5, dLine = LEN * uc + 0.0;
  const items = [];
  for (let k = 0; k < 9; k++) {
    const r = new Rig();
    r.cyl(R, 0.9, wood, 0, 0, 0, Math.PI / 2, 0, 0, 14);
    r.cyl(R + 0.015, 0.07, hoop, 0, 0, 0.3, Math.PI / 2, 0, 0, 14, false).cyl(R + 0.015, 0.07, hoop, 0, 0, -0.3, Math.PI / 2, 0, 0, 14, false);
    r.box(0.5, 0.06, 0.92, pale, 0.2, 0, 0, 0, 0, 0, false);               // a pale stave and head mark: the roll is visible
    r.build(P.mats.lit, P.mats.shadow());
    const xq = 6.4 + k * (2 * R + 0.12), tX = (k - 3.5) * dt, tGo = tX - (xq / v + v / (2 * acc));
    items.push({ r, xq, tX, tGo, m: new THREE.Matrix4() });
  }
  const uGo = uc + items[0].tGo / DUR;
  const poseK = (it, u, m) => {
    const t = (u - uc) * DUR, ta = Math.max(t - it.tGo, 0), tAcc = v / acc;
    const run = ta < tAcc ? 0.5 * acc * ta * ta : 0.5 * acc * tAcc * tAcc + v * (ta - tAcc);
    const rock = sstep(uGo - 0.03, uGo - 0.02, u) * (t < it.tGo ? 1 : 0) * 0.06 * Math.sin(TAU * 1.5 * DUR * u + it.xq);
    const x = sx * (it.xq - run + rock), hopT = (it.xq - run) < -4.6 ? 0 : 0;
    _pa.set(x, R + hopT, -dLine); _qa.setFromAxisAngle(AZ, sx * (run - rock) / R);
    m.compose(_pa, _qa, ONE);
  };
  const lead = items[3], pose = (u, m) => poseK(lead, u, m);
  return { rigs: items.map((i) => i.r), uc, name: 'barrels',
    miss: () => { const a = missOf(items[3].r, (u, m) => poseK(items[3], u, m), uc), b = missOf(items[4].r, (u, m) => poseK(items[4], u, m), uc); return a.miss < b.miss ? a : b; },
    update(u) { for (const it of items) { poseK(it, u, it.m); it.r.set(it.m); } } };
}

// ---- ribbons (rope, wires): a curve between two world points, never thinner than 1.5 pixels ----
export function makeRibbon(P, seg = 16) {
  const geo = new THREE.BufferGeometry(), t = [], sd = [], idx = [];
  for (let i = 0; i <= seg; i++) { t.push(i / seg, i / seg); sd.push(-1, 1); if (i < seg) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((seg + 1) * 6), 3));
  geo.setAttribute('aT', new THREE.Float32BufferAttribute(t, 1)); geo.setAttribute('aSide', new THREE.Float32BufferAttribute(sd, 1)); geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...P.shared, uRes: P.uRes, uA: { value: new THREE.Vector3() }, uB: { value: new THREE.Vector3(0, 1, 0) }, uSag: { value: 0 }, uBow: { value: 0 }, uWhip: { value: 0 }, uPh: { value: 0 }, uW: { value: 0.04 }, uMinCov: { value: 0.22 }, uBody: { value: 0 }, ...(LENS_CLEAR ? { uClear: { value: 0 }, uOver: { value: 0 } } : {}),
      uCol: { value: col('#16181C') }, ...(CABLE_BODY ? { uGalv: { value: col('#AEB9C6') }, uGlint: { value: col('#F4F1E8') }, uSlate: { value: col('#3A424E') } } : {}) },
    vertexShader: /* glsl */`
      attribute float aT; attribute float aSide; uniform vec3 uA; uniform vec3 uB; uniform float uSag; uniform float uBow; uniform float uWhip; uniform float uPh; uniform float uW; uniform float uMinCov; uniform vec2 uRes; varying float vD; varying float vCov; varying float vUp; varying float vLay; varying float vPx;
${LENS_CLEAR ? `      // (cure1) LENS_CLEAR: kc is the whip's share at this point, by its whip-free distance from the route's plane (x 0): 0 on our line, 1 from CLEAR_X out (and 1 everywhere while uClear is 0); uOver lifts or lowers the strand on the line and dies with the same curve
      uniform float uClear; uniform float uOver;
      vec3 curve(float t) { vec3 p = mix(uA, uB, t); float s = 4. * t * (1. - t); p.y -= uSag * s; p.z += uBow * s; float kc = 1. + uClear * (smoothstep(0., ${CLEAR_X.toFixed(2)}, abs(p.x)) - 1.); p.y += uOver * (1. - kc); p.x += uWhip * kc * t * sin(t * 7. + uPh); p.y += uWhip * kc * .6 * t * cos(t * 5. + uPh * 1.3); return p; }` : `      vec3 curve(float t) { vec3 p = mix(uA, uB, t); float s = 4. * t * (1. - t); p.y -= uSag * s; p.z += uBow * s; p.x += uWhip * t * sin(t * 7. + uPh); p.y += uWhip * .6 * t * cos(t * 5. + uPh * 1.3); return p; }`}
      void main() {
        vec4 c0 = projectionMatrix * viewMatrix * vec4(curve(aT), 1.), c1 = projectionMatrix * viewMatrix * vec4(curve(aT + .03), 1.);
        vec2 d = (c1.xy / max(abs(c1.w), 1e-3) - c0.xy / max(abs(c0.w), 1e-3)) * uRes; float l = length(d);
        d = l > 1e-5 ? d / l : vec2(1., 0.); vec2 nrm = vec2(-d.y, d.x);
        float tp = uW * uRes.y * .5 * projectionMatrix[1][1] / max(abs(c0.w), 1e-3); float px = max(tp, 1.6); vCov = clamp(tp / 1.6, uMinCov, 1.);
        vPx = tp; vUp = aSide * (nrm.y < 0. ? -1. : 1.); vLay = aT * length(uB - uA) / max(uW, 1e-3) + aSide * .5;   // which edge is uppermost on screen; and the lay of the strands, in cable widths
        c0.xy += nrm * aSide * px / uRes * c0.w; vD = abs(c0.w); gl_Position = c0; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCol; uniform vec3 uFogC; uniform float uFogD; uniform float uBody; varying float vD; varying float vCov; varying float vUp; varying float vLay; varying float vPx;${CABLE_BODY ? ' uniform vec3 uGalv; uniform vec3 uGlint; uniform vec3 uSlate;' : ''}
      // a line too thin for its 1.6 pixels is drawn paler, toward the air behind it: far off it is a hair, not a bar
      // (flight1) uBody 1: a cable is round and laid up of strands. Where it is 3 pixels wide or more (only close to the lens) its upper
      // side takes the sky, its underside the pale road, its core stays dark, and the strands show as a twist along it; far off it is the same hair as before
      void main() { float f = 1. - exp(-uFogD * uFogD * vD * vD);
        vec3 c = uCol * .25, near = c + uBody * (vec3(.2, .26, .36) * smoothstep(-.1, .85, vUp) + vec3(.1, .085, .06) * smoothstep(.35, 1., -vUp));
${CABLE_BODY ? `        // (flight5) THE CABLE'S BODY, only where uBody is 1 (the six wires; the piano's rope and the far goalposts have uBody 0 and keep the line above):
        // a round thing lit from the sky side shows three bands across its width (vUp: -1 its under edge, +1 its upper): the lower third its belly,
        // #16181C with the road's bounce as above; the middle third its turned-away flank, slate; the upper third galvanised, with a glint a tenth
        // of the width wide centred .7 of the way from the axis to the upper edge (sin 45: the facet turned to the sun and sky). Bands blend over .08
        { vec3 cab = mix(uCol + vec3(.1, .085, .06) * smoothstep(.35, 1., -vUp), uSlate, smoothstep(-.373, -.293, vUp));
          cab = mix(cab, uGalv, smoothstep(.293, .373, vUp)); cab = mix(cab, uGlint, smoothstep(.56, .64, vUp) * (1. - smoothstep(.76, .84, vUp)));
          near = mix(near, cab, uBody); }
` : ''}        near *= 1. - uBody * ${CABLE_BODY ? '.35' : '.18'} * step(.5, fract(vLay * 2.5)) * smoothstep(5., 9., vPx);   // five strands to every two widths of cable, laid at a slant
        c = mix(c, near, smoothstep(1.6, 3., vPx));
        gl_FragColor = vec4(mix(mix(uFogC * .9, c, vCov), uFogC, f), 1.); }`,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false;
  return { mesh, u: mat.uniforms };
}

// ---- 4 PIANO: a true pendulum along the street from frame one; at the bottom of its swing, coming at us, as we pass under ----
function makePiano(P, uc, margin) {
  const black = col('#16181C').multiplyScalar(1.3), ivory = col('#F4F1E8').multiplyScalar(0.85), wood = col('#8C6A3F');
  const r = new Rig();
  const brown = col('#8A5E38'), brownD = col('#6A462A'), brass = col('#D9B25A'), cream = col('#F4F1E8').multiplyScalar(0.9);
  r.box(1.5, 1.3, 0.65, black, 0, 0, 0);
  // the keyboard is what says piano: a thick ivory slab across the front, white on its front AND its underside (we see it from
  // below as it comes over), with the sharps wrapped round it as black bars in twos and threes
  r.box(1.4, 0.11, 0.3, ivory, 0, 0.0, 0.475).box(0.07, 0.19, 0.34, black, -0.735, 0.02, 0.47).box(0.07, 0.19, 0.34, black, 0.735, 0.02, 0.47);
  for (let i = 0; i < 19; i++) if ([0, 1, 3, 4, 5].includes(i % 7)) r.box(0.036, 0.125, 0.215, black, -0.7 + (i + 1) * 0.07, 0.0, 0.525, 0, 0, 0, false);
  r.box(1.34, 0.42, 0.02, brown, 0, 0.36, 0.335, 0, 0, 0, false);            // the upper panel, warm brown so the black case has a face
  r.box(0.56, 0.3, 0.02, cream, 0, 0.3, 0.35, -0.12, 0, 0, false);            // sheet music on the desk
  r.box(1.34, 0.44, 0.02, brownD, 0, -0.36, 0.335, 0, 0, 0, false);           // the lower panel
  for (const x of [-0.09, 0.09]) r.box(0.06, 0.03, 0.16, brass, x, -0.62, 0.4, 0, 0, 0, false);   // two brass pedals
  r.box(0.1, 0.56, 0.1, black, -0.68, -0.34, 0.5, 0, 0, 0, false).box(0.1, 0.56, 0.1, black, 0.68, -0.34, 0.5, 0, 0, 0, false);
  r.box(1.2, 0.5, 0.02, wood, 0, 0.3, -0.335, 0, 0, 0, false);              // the pale back board, seen as it swings away
  // the lid, hinged along the back of the top: it flaps open in the gale
  const lid = new Rig(); lid.box(1.56, 0.05, 0.74, black, 0, 0.025, 0.37, 0, 0, 0, false).box(1.4, 0.012, 0.62, brown, 0, -0.004, 0.37, 0, 0, 0, false);
  lid.build(P.mats.lit, P.mats.shadow());
  const lidM = new THREE.Matrix4(), lidL = new THREE.Matrix4();
  r.build(P.mats.lit, P.mats.shadow());
  const T = 5.75, dP = LEN * uc, pivot = new THREE.Vector3(0, EYE + margin + 0.65 + 8.2, -dP), tc = uc * DUR;
  // the masts and beam
  // a tarred timber hoist, not two black bars: knee braces under the beam, raking shores at each foot, an iron pulley block at the pivot
  const mastC = col('#1F1812'), tar = col('#9A7446'), tarD = col('#7A5A36'), ironM = col('#2A2F38');   // (lead7) the hoist stays warm tarred timber: strangers preferred it 4 of 4 to dark tar on stills and on midpoints (an amendment)
  for (const s of [-1, 1]) { P.fx.box(0.34, 12.6, 0.34, tar, s * 5.6, 6.3, -dP);
    P.fx.box(0.24, 3.1, 0.24, tarD, s * 4.55, pivot.y - 0.92, -dP, 0, 0, s * 0.78, false);       // knee brace
    P.fx.box(0.2, 3.4, 0.2, tarD, s * 5.6, 1.5, -dP - 0.95, 0.6, 0, 0, false).box(0.2, 3.4, 0.2, tarD, s * 5.6, 1.5, -dP + 0.95, -0.6, 0, 0, false);   // shores along the kerb
    P.fx.box(0.46, 0.2, 0.46, ironM, s * 5.6, 12.6, -dP, 0, 0, 0, false).box(0.5, 0.36, 0.5, tarD, s * 5.6, 0.18, -dP, 0, 0, 0, false); }
  P.fx.box(12.3, 0.34, 0.34, tar, 0, pivot.y + 0.2, -dP);
  P.fx.box(0.3, 0.5, 0.42, ironM, 0, pivot.y - 0.15, -dP, 0, 0, 0, false);
  const rope = makeRibbon(P, 2); rope.u.uW.value = 0.05;
  // from the far end of the street the masts and beam would be half a pixel wide: three ribbons stand over them (never thinner than 1.6 px,
  // near-black), and while far the whole goalpost is drawn half as tall and wide again; all of it eases onto the true timbers by u 0.30
  const posts = [makeRibbon(P, 1), makeRibbon(P, 1), makeRibbon(P, 1)];
  for (const g of posts) { g.u.uW.value = 0.34; g.u.uCol.value.copy(mastC).multiplyScalar(2.2); }
  const pivD = new THREE.Vector3(), nr = { M: 1, lz: 0 };
  const near = (v) => v.set(v.x / nr.M, EYE + (v.y - EYE) / nr.M, nr.lz + (v.z - nr.lz) / nr.M);
  const st = { off: 0, th: 0, L: 8.2, q: new THREE.Quaternion() }, mTrue = new THREE.Matrix4();
  const angle = (u, off) => {
    const A = lerp(42, 50, sstep(0.0, 0.42, u)) * D2R;
    return A * Math.sin(TAU * (u * DUR - tc) / T + off * (1 - sstep(0, 0.1, u)));
  };
  const len = (u) => { const t = Math.max(u - 0.44, 0) * DUR; return 7.8 + 0.4 * sstep(0.44, 0.4425, u) + (u > 0.44 ? 0.13 * Math.exp(-5 * t) * Math.sin(20 * t) : 0); };
  const pos = new THREE.Vector3(), q = new THREE.Quaternion();
  // Far off the piano would be two pixels bobbing on our sight line, behind every washing line in the street. So while it is far (and only
  // then) it hangs on a shorter rope and swings in an ellipse (a gust-driven pendulum does), and it is DRAWN nearer along the line of sight
  // (M times nearer, so M times larger and in front of the far washing, the way a thin line is widened to a pixel and a half): from the
  // lens's place on the path, never from the camera. All of it eases out to nothing by u 0.335, long before the solved crossing; its shadow
  // stays where the true piano is
  const truePose = (u, off) => { const th = angle(u, off), farK = 1 - sstep(0.02, 0.30, u), L = len(u) * (1 - 0.5 * farK); st.th = th; st.L = L; st.farK = farK;
    const ph = TAU * (u * DUR - tc) / T + off * (1 - sstep(0, 0.1, u));
    pos.set(4.4 * farK * Math.cos(ph), pivot.y - L * Math.cos(th), pivot.z + L * Math.sin(th)); q.setFromAxisAngle(AX, -th + 0.05 * Math.sin(u * DUR * 3.1)); st.q.copy(q); };
  // drawn at 50 m while it is far, creeping to 38 m by u 0.41 where the true piano takes over (never receding, never jumping)
  const pose = (u, m, off = 0) => { truePose(u, off); const D = dP - LEN * u, M = Math.max(D / (50 - 12 * sstep(0, 0.41, u)), 1);
    if (M > 1) { const lz = -LEN * u, sy = 1 + 0.5 * st.farK; pos.set(pos.x / M, EYE + (pos.y - EYE) * sy / M, lz + (pos.z - lz) / M); }
    m.compose(pos, q, ONE); };
  // 52 keys shake loose on the downswing; each one a closed-form fall with two bounces
  const NK = 52, keyGeo = new THREE.BoxGeometry(0.2, 0.035, 0.045), cArr = new Float32Array(keyGeo.attributes.position.count * 3);
  for (let i = 0; i < cArr.length; i += 3) { cArr[i] = ivory.r; cArr[i + 1] = ivory.g; cArr[i + 2] = ivory.b; }
  keyGeo.setAttribute('color', new THREE.BufferAttribute(cArr, 3));
  { const nv = keyGeo.attributes.position.count, e = new Float32Array(nv * 4); for (let i = 0; i < nv; i++) e.set([9, 9, 9, 0], i * 4);
    keyGeo.setAttribute('aL', new THREE.BufferAttribute(new Float32Array(nv * 3), 3)); keyGeo.setAttribute('aE', new THREE.BufferAttribute(e, 4)); }
  const keys = new THREE.InstancedMesh(keyGeo, P.mats.lit, NK); keys.frustumCulled = false;
  const K = [], mm = new THREE.Matrix4(), v0 = new THREE.Vector3(), v1 = new THREE.Vector3();
  for (let k = 0; k < NK; k++) {
    const tr = lerp(-1.35, -0.3, (k + 0.5) / NK), ur = uc + tr / DUR, lx = ((k * 7) % NK) / (NK - 1) * 1.3 - 0.65;
    pose(ur, mm); v0.set(lx, 0.05, 0.5).applyMatrix4(mm); pose(ur + 0.0005, mm); v1.set(lx, 0.05, 0.5).applyMatrix4(mm);
    const side = lx >= 0 ? 1 : -1, x0 = side * Math.max(Math.abs(lx), 0.4);
    const vel = v1.sub(v0).multiplyScalar(1 / (0.0005 * DUR)).multiplyScalar(0.75);
    vel.x = side * (0.5 + P.rng() * 1.6); vel.y += 0.6 + P.rng() * 1.2;
    const g = 9.81, y0 = v0.y - 0.03, tf = (vel.y + Math.sqrt(vel.y * vel.y + 2 * g * y0)) / g;
    K.push({ ur, x0, y0, z0: v0.z, vx: vel.x, vy: vel.y, vz: vel.z + 1.5, tf, spin: 6 + P.rng() * 10, ph: P.rng() * 6 });
  }
  const km = new THREE.Matrix4(), ke = new THREE.Euler(), kq = new THREE.Quaternion(), kp = new THREE.Vector3(), kHome = new THREE.Vector3(0, 0, 0);
  const keysUpdate = (u, pm) => {
    for (let k = 0; k < NK; k++) {
      const c = K[k], t = (u - c.ur) * DUR;
      if (t <= 0) { kp.set(((k + 0.5) / NK - 0.5) * 1.36, 0.058, 0.44).applyMatrix4(pm); km.compose(kp, st.q, _s.set(0.12, 0.6, 3.2)); _s.set(1, 1, 1); }   // still on the keyboard (as a short key seen end on)
      else {
        const g = 9.81; let y, tt = Math.min(t, c.tf), run = tt;
        y = c.y0 + c.vy * tt - 0.5 * g * tt * tt;
        if (t > c.tf) { const tb = t - c.tf, v1b = 2.6, T1 = 2 * v1b / g, v2b = 1.2, T2 = 2 * v2b / g;
          if (tb < T1) { y = 0.03 + v1b * tb - 0.5 * g * tb * tb; run = c.tf + tb * 0.5; }
          else if (tb < T1 + T2) { const t2 = tb - T1; y = 0.03 + v2b * t2 - 0.5 * g * t2 * t2; run = c.tf + T1 * 0.5 + t2 * 0.25; }
          else { y = 0.03; run = c.tf + T1 * 0.5 + T2 * 0.25; } }
        kp.set(c.x0 + c.vx * run, Math.max(y, 0.03), c.z0 + c.vz * run);
        const sp = t > c.tf + 0.9 ? 0 : 1;
        kq.setFromEuler(ke.set(sp * (c.ph + c.spin * run), c.ph, sp * c.spin * 0.7 * run));
        km.compose(kp, kq, ONE);
      }
      keys.setMatrixAt(k, km);
    }
    keys.instanceMatrix.needsUpdate = true;
  };
  const m = new THREE.Matrix4();
  return { rig: r, rigs: [lid], extra: [rope.mesh, keys, ...posts.map((g) => g.mesh)], uc, name: 'piano', miss: () => missOf(r, (u, mx) => pose(u, mx, 0), uc),
    update(u, time) {
      if (u <= 0) { st.off = ((TAU * time / T) % TAU); if (st.off > Math.PI) st.off -= TAU; }   // through the previous portal u is 0: it swings on the clock
      pose(u, m, st.off); r.set(m);
      truePose(u, st.off); mTrue.compose(pos, q, ONE); r.shadow.matrix.copy(mTrue);
      const la = (30 + 20 * Math.sin(time * 5.3) + 9 * Math.sin(time * 9.1)) * (0.35 + 0.65 * gale(u)) * D2R;      // the lid flaps with the gale
      lidL.compose(_pa.set(0, 0.65, -0.34), _qa.setFromAxisAngle(AX, -la), ONE); lidM.multiplyMatrices(m, lidL); lid.set(lidM); lid.shadow.matrix.multiplyMatrices(mTrue, lidL);
      { const fk = st.farK, sc = 1 + 0.5 * fk, yb = EYE + (pivot.y + 0.2 - EYE) * sc;
        // the goalpost and the rope's top are drawn nearer along the sight line exactly as the piano is: in front of the far washing
        nr.lz = -LEN * u; nr.M = Math.max((dP + nr.lz) / (50 - 12 * sstep(0, 0.41, u)), 1);
        pivD.set(0, EYE + (pivot.y - EYE) * sc, pivot.z); near(pivD);
        for (let i = 0; i < 3; i++) { const g = posts[i], sg = i === 0 ? -1 : 1; g.u.uMinCov.value = lerp(0.22, 0.92, fk);
          if (i < 2) { g.u.uA.value.set(sg * 5.6 * sc, 0, -dP); g.u.uB.value.set(sg * 5.6 * sc, yb + 1.0 * sc, -dP); }
          else { g.u.uA.value.set(-5.95 * sc, yb, -dP); g.u.uB.value.set(5.95 * sc, yb, -dP); }
          near(g.u.uA.value); near(g.u.uB.value); g.u.uW.value = 0.34 / nr.M;
          if (fk <= 0) { g.u.uA.value.set(0, -60, -dP); g.u.uB.value.set(0, -60, -dP); } }   // from u 0.30 the true timbers are wide enough: the ribbons fold away to nothing
        rope.u.uMinCov.value = lerp(0.22, 0.8, fk); }
      rope.u.uA.value.copy(pivD); rope.u.uB.value.set(0, 0.65, 0).applyMatrix4(m);
      keysUpdate(u, m);
    } };
}

// (flight5) THE POLE THAT HELD (the lead's amendment of the cast: "one more telegraph pole stands where the last span ends, stayed to the
// wall: the pole that held; it never moves"). THE RULE: THE LAST SPAN ENDS ON THE HEAD OF A STANDING POLE. It is built once, from farEnd's own
// expression and sx (so it mirrors with the deal), as static furniture in P.fx like the hoist; it reads no u, gale, clock or random number.
// All figures are world metres: "out" is the distance from our line on the poles' side, heights are above the road.
// - axis 6.5 m out: 0.5 m off the wall face (7.0), so the shaft (radius 0.2, to 6.7) is clear of the cornice slab (from 6.78); foot on the
//   boardwalk (0.3), at farEnd's own place down the street. No yaw: it has no plane of fall
// - shaft, butt, iron band, tar, whitewash, tar ring, plate, straps, pegs: the falling three's own recipe (makePoles), number for number, heights
//   from the foot; the pegs stand on the STREET side (a peg reaches 0.54 m from the axis and the wall is 0.5 m away on the other): to 5.94 m out
// - one street-side arm at 8.8 m, the top arm's section (0.16), across the shaft's face turned to the entry (0.2, as the falling arms) from
//   5.3 m out to the shaft's far side (6.7); an iron knee brace from the shaft 0.6 m under the arm to the arm 0.8 m out from the axis; three
//   glass insulators on pins (the falling poles' own) at 5.4, 5.75 and 6.1 m out: 0.35 m apart, the first 0.1 m in from the tip
// - the rack: two iron plates from inside the shaft (6.6) to farEnd (7.05), over and under two glass spools of radius 0.16, 0.2 tall (the two
//   strands end 0.264 m apart: 6 cm of iron between the spools), at the strands' own heights farEnd.y -+ 0.132, on one iron pin. Spool axis
//   6.835 m out: the 0.3 m between shaft and wall is narrower than a spool, so it is let 2.5 cm into the shaft and ends 5 mm short of the wall
// - two iron stays, 0.07 m rod, level at 5.2 m (over an awning's root, 3.42 m and its lift; under the lowest dealt frieze, 6.0 - 0.52), from an
//   iron collar on the shaft to iron wall plates 0.3 m square, 1.5 m up the street and 1.5 m down it (the plates' backs 1 cm inside the wall)
// Nothing of it is nearer our line than 5.3 m in plan (the arm's tip, 8.8 m up); it never rocks, sways or falls
function heldPole(P, sx, farEnd) {
  const wood = col('#7A5C3A'), woodD = col('#5E452B'), glass = col('#BFE3E6').multiplyScalar(1.25), iron = col('#2A2F38');
  const tar = col('#22262E'), wash = col('#F4F1E8').multiplyScalar(0.86), galv = col('#AEB9C6').multiplyScalar(0.8);
  const F = P.fx, L = 10, Y = 0.3, Z = farEnd.z, X = (out) => sx * out, AX = X(6.5);
  F.cyl(0.2, L, wood, AX, Y + L / 2, Z, 0, 0, 0, 12).cyl(0.23, 0.5, woodD, AX, Y + 0.25, Z, 0, 0, 0, 12, false).cyl(0.215, 0.06, iron, AX, Y + L - 0.5, Z, 0, 0, 0, 12, false);
  F.cyl(0.212, 1.25, tar, AX, Y + 0.9, Z, 0, 0, 0, 12, false).cyl(0.209, 0.55, wash, AX, Y + 1.8, Z, 0, 0, 0, 12, false).cyl(0.213, 0.07, tar, AX, Y + 2.1, Z, 0, 0, 0, 12, false);
  F.box(0.24, 0.32, 0.03, wash, AX, Y + 2.75, Z + 0.2, 0, 0, 0, false).box(0.14, 0.05, 0.035, tar, AX, Y + 2.8, Z + 0.2, 0, 0, 0, false).box(0.14, 0.05, 0.035, tar, AX, Y + 2.7, Z + 0.2, 0, 0, 0, false);
  for (const y of [3.6, 5.7, 7.6]) F.cyl(0.208, 0.09, galv, AX, Y + y, Z, 0, 0, 0, 12, false);
  for (let j = 0; j < 12; j++) { const y = Y + 3.05 + j * 0.46, dz = j % 2 ? 0.07 : -0.07;
    F.box(0.36, 0.045, 0.045, iron, X(6.5 - 0.36), y, Z + dz, 0, 0, 0, false).box(0.045, 0.1, 0.045, iron, X(6.5 - 0.52), y + 0.04, Z + dz, 0, 0, 0, false); }
  // the arm, its knee brace, its three insulators
  const aY = 8.8;
  F.box(1.4, 0.16, 0.16, woodD, X(6.0), aY, Z + 0.2, 0, 0, 0, false);
  F.box(0.05, Math.hypot(0.6, 0.52), 0.05, iron, X(6.0), aY - 0.34, Z + 0.2, 0, 0, Math.atan2(sx * 0.6, 0.52), false);   // from (6.3 out, 0.6 under the arm) up to (5.7 out, the arm's underside)
  for (const o of [5.4, 5.75, 6.1]) F.cyl(0.07, 0.2, glass, X(o), aY + 0.18, Z + 0.2, 0, 0, 0, 8, false).cyl(0.03, 0.1, iron, X(o), aY + 0.08, Z + 0.2, 0, 0, 0, 6, false);
  // the rack and its two spools: the two strands end on glass
  const sp = 0.132, sh = 0.2;
  for (const s of [-1, 1]) { F.cyl(0.16, sh, glass, X(6.835), farEnd.y + s * sp, Z, 0, 0, 0, 12, false);
    F.box(0.45, 0.03, 0.36, iron, X(6.825), farEnd.y + s * (sp + sh / 2 + 0.015), Z, 0, 0, 0, false); }
  F.cyl(0.03, 2 * sp + sh + 0.12, iron, X(6.835), farEnd.y, Z, 0, 0, 0, 6, false);
  // the two stays to the wall
  const sY = 5.2;
  F.cyl(0.215, 0.08, iron, AX, sY, Z, 0, 0, 0, 12, false);
  for (const s of [-1, 1]) { const dx = sx * 0.35, dz = s * 1.5;
    F.box(Math.hypot(dx, dz), 0.07, 0.07, iron, X(6.825), sY, Z + dz / 2, 0, Math.atan2(-dz, dx), 0, false);
    F.box(0.035, 0.3, 0.3, iron, X(6.9925), sY, Z + dz, 0, 0, 0, false); }
}

// ---- 5 POLES: three telegraph poles fall across the street like crossing barriers, each lower over the lens ----
export const POLE_YAW = 20 * D2R, POLE_DZ = 5.5 * Math.tan(POLE_YAW);   // each pole stands this far beyond where it crosses our line, and falls a little toward us
function makePoles(P, sx, ucs, margins) {
  const wood = col('#7A5C3A'), woodD = col('#5E452B'), glass = col('#BFE3E6').multiplyScalar(1.25), iron = col('#2A2F38');
  // restaged: a thicker, taller pole (10 m, 0.2 m radius) with two crossarms ACROSS the street (the wires run along it), falling in a plane
  // turned 20 degrees toward us and by a gentler law (exp 1.4 s over 3.6 s), so that it is in frame, coming down over the hat, for the
  // whole last second; the margins are solved exactly as before
  const L = 10, KP = 1.4, spanS = 3.6, span = spanS / DUR, E = Math.exp(KP) - 1, list = [];
  const qYaw = new THREE.Quaternion().setFromAxisAngle(AY, sx * POLE_YAW);
  ucs.forEach((uc, k) => {
    const r = new Rig();
    r.cyl(0.2, L, wood, 0, L / 2, 0, 0, 0, 0, 12).cyl(0.23, 0.5, woodD, 0, 0.25, 0, 0, 0, 0, 12, false).cyl(0.215, 0.06, iron, 0, L - 0.5, 0, 0, 0, 0, 12, false);
    r.box(2.5, 0.16, 0.16, woodD, 0, L - 1.0, 0.2).box(1.7, 0.14, 0.14, woodD, 0, L - 1.8, 0.2);
    for (const s of [-1, 1]) r.box(0.05, 0.9, 0.05, iron, s * 0.42, L - 1.38, 0.2, 0, 0, s * 0.75, false);          // two iron braces under the top arm
    for (const x of [-1.1, -0.55, 0.55, 1.1]) r.cyl(0.07, 0.2, glass, x, L - 0.82, 0.2, 0, 0, 0, 8, false).cyl(0.03, 0.1, iron, x, L - 0.92, 0.2, 0, 0, 0, 6, false);
    for (const x of [-0.7, 0.7]) r.cyl(0.07, 0.2, glass, x, L - 1.63, 0.2, 0, 0, 0, 8, false);
    // (polish4) a TELEGRAPH pole, not a beam, even when only its lower half is in frame: a tarred butt, a whitewashed band and a numbered
    // plate, iron climbing pegs up the shaft, a galvanised strap every few metres. All of it is paint or stands on the side turned AWAY from
    // the lens's line as the pole comes down (none of it is solid: the margin is solved on the shaft and the arms exactly as before)
    { const tar = col('#22262E'), wash = col('#F4F1E8').multiplyScalar(0.86), galv = col('#AEB9C6').multiplyScalar(0.8);
      r.cyl(0.212, 1.25, tar, 0, 0.9, 0, 0, 0, 0, 12, false).cyl(0.209, 0.55, wash, 0, 1.8, 0, 0, 0, 0, 12, false).cyl(0.213, 0.07, tar, 0, 2.1, 0, 0, 0, 0, 12, false);
      r.box(0.24, 0.32, 0.03, wash, 0, 2.75, 0.2, 0, 0, 0, false).box(0.14, 0.05, 0.035, tar, 0, 2.8, 0.2, 0, 0, 0, false).box(0.14, 0.05, 0.035, tar, 0, 2.7, 0.2, 0, 0, 0, false);
      for (const y of [3.6, 5.7, 7.6]) r.cyl(0.208, 0.09, galv, 0, y, 0, 0, 0, 0, 12, false);
      for (let j = 0; j < 12; j++) { const y = 3.05 + j * 0.46;
        r.box(0.36, 0.045, 0.045, iron, sx * 0.36, y, j % 2 ? 0.07 : -0.07, 0, 0, 0, false).box(0.045, 0.1, 0.045, iron, sx * 0.52, y + 0.04, j % 2 ? 0.07 : -0.07, 0, 0, 0, false); } }
    r.build(P.mats.lit, P.mats.shadow());
    const foot = new THREE.Vector3(sx * 5.5, 0.3, -LEN * uc - POLE_DZ), o = { r, uc, foot, uS: uc - 0.7 * span, m: new THREE.Matrix4(), ang: 0 };
    o.angle = (u) => {
      const s = (u - o.uS) / span, tw = (u - (o.uS - 1.3 / DUR)) * DUR / 1.3;         // tw 0..1: the two rocks before it goes
      if (s <= 0) return (tw > 0 ? 6 * Math.abs(Math.sin(TAU * tw)) * sstep(0, 0.1, tw) : 0) + 1.2 * gale(u) * Math.sin(u * DUR * 2.2 + k * 2);
      if (s < 1) return 90 * (Math.exp(KP * s) - 1) / E;
      const t = (s - 1) * spanS; return 91.7 - 4.2 * Math.exp(-4 * t) * Math.abs(Math.sin(9 * t)) - 1.7 * Math.exp(-30 * t);
    };
    o.pose = (u, m) => { o.ang = o.angle(u) * D2R; _qa.copy(qYaw).multiply(_qb.setFromAxisAngle(AZ, sx * o.ang)); m.compose(foot, _qa, ONE); };
    o.uS = solve((us) => { o.uS = us; return missOf(r, o.pose, uc, 0.006, 121).miss; }, uc - 0.94 * span, uc - 0.3 * span, margins[k]);
    const uL = o.uS + span, n = Math.round(10 * P.detail);
    // the foot lets go (it pivots, it does not break): its dust streams down the street in the gale and past the lens; and the landing, behind us by then
    P.dust.burst(P.rng, o.uS + 0.004, sx * 4.9, 0.4, foot.z + 0.3, Math.round(14 * P.detail), { speed: 2.6, life: 2.4, size: 1.3, sx: 0.7, sz: 0.5, dir: [-sx * 0.75, 0.35, 1.5] });
    for (let i = 0; i < Math.round(12 * P.detail); i++) P.chips.add(o.uS + 0.003 + 0.004 * hq2(i * 3.9 + k), foot.x, 0.45, foot.z, -sx * (0.4 + 2.4 * hq2(i * 5.7 + k)), 1 + 3 * hq2(i * 7.9 + k), 0.5 + 3 * hq2(i * 9.3 + k), 0.03 + 0.035 * hq2(i * 11.1), 1.5, CHIP_DUST);
    P.dust.burst(P.rng, uL, -sx * 1.0, 0.1, foot.z + POLE_DZ * 0.5, n, { speed: 3.2, life: 1.6, size: 1.1, sx: 3.5, sz: 0.8, dir: [0, 0.3, 1.2] });
    list.push(o);
  });
  const wires = [];
  for (let k = 0; k < 3; k++) for (const x of [-1.1, 1.1]) { const w = makeRibbon(P, 22); w.k = k; w.x = x; w.u.uW.value = CABLE_BODY ? 0.09 : 0.05; w.u.uBody.value = 1; wires.push(w); }   // (flight5) a cable 0.09 m thick; where it is stays as it was
  // (flight1) THE WIRES ARE CABLES, WITH SHADOWS. Their curves, ends, sag and whip are exactly what they were. Each wire's shadow is the
  // same ribbon on the same curve, carried down the sun onto the road (the other shadows' blue, never thinner than 1.6 pixels and fainter
  // where it would be, and fainter the higher the wire: see its shader). (flight1 repair) Nothing hangs on a wire: the cast ends "Nothing
  // else", so the washing and the loose glass insulators the first round tied on them are gone; the wires keep only their own body and shadow
  const wshadows = wires.map((w) => { const m = new THREE.Mesh(w.mesh.geometry, new THREE.ShaderMaterial({
    uniforms: { uSun: P.shared.uSun, uFogC: P.shared.uFogC, uFogD: P.shared.uFogD, uRes: P.uRes, uA: w.u.uA, uB: w.u.uB, uSag: w.u.uSag, uBow: w.u.uBow, uWhip: w.u.uWhip, uPh: w.u.uPh, ...(LENS_CLEAR ? { uClear: w.u.uClear, uOver: w.u.uOver } : {}), uW: CABLE_BODY ? { value: 0.05 } : w.u.uW, uShadeC: { value: new THREE.Color(0.105, 0.13, 0.2) } },
    vertexShader: /* glsl */`
      attribute float aT; attribute float aSide; uniform vec3 uA; uniform vec3 uB; uniform vec3 uSun; uniform float uSag; uniform float uBow; uniform float uWhip; uniform float uPh; uniform float uW; uniform vec2 uRes; varying float vD; varying float vCov;
${LENS_CLEAR ? `      uniform float uClear; uniform float uOver;
      vec3 curve(float t) { vec3 p = mix(uA, uB, t); float s = 4. * t * (1. - t); p.y -= uSag * s; p.z += uBow * s; float kc = 1. + uClear * (smoothstep(0., ${CLEAR_X.toFixed(2)}, abs(p.x)) - 1.); p.y += uOver * (1. - kc); p.x += uWhip * kc * t * sin(t * 7. + uPh); p.y += uWhip * kc * .6 * t * cos(t * 5. + uPh * 1.3); return p; }` : `      vec3 curve(float t) { vec3 p = mix(uA, uB, t); float s = 4. * t * (1. - t); p.y -= uSag * s; p.z += uBow * s; p.x += uWhip * t * sin(t * 7. + uPh); p.y += uWhip * .6 * t * cos(t * 5. + uPh * 1.3);
        return p; }`}
      vec3 laid(vec3 p) { float k = max(p.y - .014, 0.) / max(uSun.y, 1e-3); p.xz -= uSun.xz * k; p.y = .014; return p; }
      void main() {
        vec3 w0 = curve(aT);
        vec4 c0 = projectionMatrix * viewMatrix * vec4(laid(w0), 1.), c1 = projectionMatrix * viewMatrix * vec4(laid(curve(aT + .03)), 1.);
        vec2 d = (c1.xy / max(abs(c1.w), 1e-3) - c0.xy / max(abs(c0.w), 1e-3)) * uRes; float l = length(d);
        d = l > 1e-5 ? d / l : vec2(1., 0.); vec2 nrm = vec2(-d.y, d.x);
        float tp = uW * uRes.y * .5 * projectionMatrix[1][1] / max(abs(c0.w), 1e-3); float px = max(tp, 1.6); vCov = clamp(tp / 1.6, .3, 1.);
        // the sun is a disc half a degree across (.0093 rad): a cable uW wide stops all of it only while it is nearer the ground than uW / .0093
        // along the ray; higher than that its shadow is that much fainter. So a wire on the ground or dragged low lays a hard line, and the
        // same wire 9 m up on the poles a faint one
        vCov *= clamp(uW * uSun.y / (.0093 * max(w0.y, .05)), 0., 1.);
        c0.xy += nrm * aSide * px / uRes * c0.w; vD = abs(c0.w); gl_Position = c0; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uShadeC; uniform vec3 uFogC; uniform float uFogD; varying float vD; varying float vCov;
      void main() { float f = 1. - exp(-uFogD * uFogD * vD * vD); gl_FragColor = vec4(mix(uShadeC, uFogC, f), vCov); }`,
    side: THREE.DoubleSide, transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  })); m.frustumCulled = false; m.renderOrder = 2; return m; });
  const farEnd = new THREE.Vector3(sx * 7.05, 7.6, -LEN * ucs[2] - POLE_DZ - 31);   // the last span runs on to a bracket on a cornice down the street
  if (HELD_POLE) heldPole(P, sx, farEnd);   // (flight5) and that end is the head of a standing pole
  // (cure1) THE LAST SPAN RIDES OVER OR UNDER OUR WAY, NEVER THROUGH IT. Its far end is on the poles' side and its pole's arm comes to rest
  // on the other side of our line, so each strand crosses the route's plane. g is the height over the lens at which its resting, whip-free
  // curve crosses that plane (from the pole's resting pose, the bracket and the resting sag: geometry only, once, at build); the strand
  // is carried the rest of the way to CLEAR_Y on the side it already passes, and its whip has a node on the line (curve(), uClear)
  if (LENS_CLEAR) { const mr = new THREE.Matrix4(); list[2].pose(1, mr);
    for (const w of wires) if (w.k === 2) { const ax = farEnd.x, ay = farEnd.y + 0.12 * w.x; _pa.set(w.x, L - 0.72, 0.2).applyMatrix4(mr);
      w.u.uClear.value = 1;
      if (ax * _pa.x < 0) { const t0 = ax / (ax - _pa.x), g = lerp(ay, _pa.y, t0) - (1.9 + 0.5 * w.x) * 4 * t0 * (1 - t0) - EYE;
        w.u.uOver.value = (g < 0 ? -1 : 1) * Math.max(0, CLEAR_Y - Math.abs(g)); } } }
  return { rigs: list.map((o) => o.r), extra: [...wires.map((w) => w.mesh), ...wshadows], uc: ucs[2], name: 'poles', list,
    miss: () => missOf(list[2].r, list[2].pose, ucs[2], 0.006, 121),
    update(u, time) {
      for (const o of list) { o.pose(u, o.m); o.r.set(o.m); }
      // (flight2 repair) A LOOSE WIRE WHIPS IN THE WIND AND HANGS WHEN IT STOPS: the brief counts what moves in the lull (the hat, the feather,
      // the washing coming to rest, the street) and a wire is not among them. Its whip had a floor that the wind did not own (0.3, 0.5) and
      // went on through the lull; the whole whip now dies with the gale's own fall, u 0.67 to 0.69 (gale()'s lull term), and stays dead
      // (flight3, the owner's cure) The whip reads the gale's own function: lullOf(u) is the very term gale() multiplies by, called
      // here, not typed a second time
      const still = lullOf(u);
      for (const w of wires) {
        // each wire runs from one pole's top arm to the next; when the nearer pole goes it parts at the far one and whips loose, downwind
        const a = list[w.k], b = list[w.k + 1], snap = sstep(a.uS - 0.004, a.uS + 0.012, u);
        if (!b) {   // the last span stays on its bracket down the street: the falling pole drags it down across the frame, slack and whipping
          const fall = sstep(a.uS, a.uS + 0.02, u);
          w.u.uA.value.copy(farEnd).setY(farEnd.y + 0.12 * w.x); w.u.uB.value.set(w.x, L - 0.72, 0.2).applyMatrix4(a.m);
          w.u.uSag.value = lerp(0.5, 1.9 + 0.5 * w.x, fall); w.u.uWhip.value = fall * (0.3 + 0.7 * gale(u)) * still; w.u.uPh.value = time * 6 + w.x * 3;
          continue;
        }
        w.u.uA.value.set(w.x, L - 0.72, 0.2).applyMatrix4(a.m); _pa.set(w.x, L - 0.72, 0.2).applyMatrix4(b.m);
        _pb.copy(w.u.uA.value).add(_v.set(-sx * (0.8 + 0.5 * w.x), -2.6 - 0.6 * w.x, 7.5));
        w.u.uB.value.lerpVectors(_pa, _pb, snap);
        w.u.uSag.value = lerp(0.5, 0.3, snap); w.u.uWhip.value = snap * (0.5 + 1.1 * gale(u)) * still; w.u.uPh.value = time * 7 + w.x * 3;
      }
    } };
}

// (flight4) THE FRONT'S HEAD, one table of metres of the wall (x out from its centre line, y up the wall, z off its face) from which the
// relief (makeFront) and the shadow's outline (sfCrown, in GLSL_HOLE) are both written. The cornice: wall height 12.3 to 13.0 (where the
// live face paints its cornice), 7.9 m a side (the set-back fronts' cornices begin 7.98 m out), 0.9 m off the face, on four brackets a
// side 1.7 m apart from 2.55 m out (the first clears the window's 1.9 m by half a bracket and more; the last ends 7.85 m out).
// The crown, never beyond 7.9 m out: HOTEL a stepped parapet: a centre block 8.0 m wide (half the wall) and 2.3 m tall, a shoulder each
// side from the block's edge to 7.2 m out (3.2 m wide) and 1.1 m tall, a cap board 0.2 m thick that oversails the block by 0.2 m a side
// (top 15.5 m). OPERA a half-round lunette of radius 4.3 m on the cornice (top 17.3 m) with a raised rim 0.55 m wide, and a ball finial
// of radius 0.35 m on a plinth 0.6 m wide and 0.7 m tall, 6.9 m out each side. BANK a triangular pediment on the whole cornice (base
// 15.8 m), its apex 3.0 m up (top 16.0 m), raking cornices 0.46 m deep, one blind slate disc of radius 0.95 m in the tympanum.
// The uprights: wall height 3.2 (above the lower string course, 3.0) to 10.6 (under the name board, 10.8); an inner pair centred 2.3 m
// out and a corner pair centred 7.4 m out, each within 0.4 m of its centre (the inner pair keeps 1.9 m off the centre line: the window
// and its casing; the corner pair 7.0 to 7.8 m out). They stand 0.24 m off the face: the most the corner pair may (see makeFront: SIZING)
const CROWN = { y: 13, hw: 7.9, corn: { y0: 12.3, z: 0.9, br: [2.55, 4.25, 5.95, 7.65], brW: 0.4, brY: 11.75, brZ: 0.8 },
  up: { y0: 3.2, y1: 10.6, xs: [2.3, 7.4], hw: 0.4, z: 0.24, cap: 0.3 },
  hotel: { hw: 4.0, hh: 2.3, capW: 4.2, capH: 0.2, shX: 7.2, shH: 1.1 },
  opera: { r: 4.3, rim: 0.55, fx: 6.9, pw: 0.3, ph: 0.7, br: 0.35 },
  bank: { hw: 7.9, apex: 3.0, rake: 0.46, disc: 0.95 } };
const CROWN_DEF = { CR_Y: CROWN.y, CR_HW: CROWN.hotel.hw, CR_HH: CROWN.hotel.hh, CR_HCW: CROWN.hotel.capW, CR_HCH: CROWN.hotel.capH, CR_HSX: CROWN.hotel.shX, CR_HSH: CROWN.hotel.shH,
  CR_OR: CROWN.opera.r, CR_OFX: CROWN.opera.fx, CR_OPW: CROWN.opera.pw, CR_OPH: CROWN.opera.ph, CR_OBR: CROWN.opera.br, CR_BA: CROWN.bank.apex, CR_BHW: CROWN.bank.hw };
// the one real hole in the front, in wall coordinates (x across, y up the wall): rect, round or arched. Negative inside.
export const GLSL_HOLE = /* glsl */`
uniform vec4 uHole;   // centre y, half width, half height, type (0 rect, 1 round, 2 arch)
float sfHole(vec2 p) {
  float rect = max(abs(p.x) - uHole.y, abs(p.y - uHole.x) - uHole.z);
  float circ = length(p - vec2(0., uHole.x)) - uHole.y;
  float top = uHole.x + uHole.z - uHole.y;
  float arch = p.y < top ? max(abs(p.x) - uHole.y, (uHole.x - uHole.z) - p.y) : length(p - vec2(0., top)) - uHole.y;
  return uHole.w < .5 ? rect : (uHole.w < 1.5 ? circ : arch);
}` + /* glsl */`
// (flight4) THE FRONT'S CROWN, by kind, as an outline above the 13 m plane in the same wall coordinates: 1 inside it. Every test that asks
// whether a ray down the sun meets the wall (the road's shadow of the front, the flecks, the skirt) adds this to the wall's rectangle, so
// the shadow that runs down the road has the building's head. The numbers are CROWN's (below), written into the shader from that one table
uniform float uCrownK;   // 0 hotel, 1 opera, 2 bank
float sfCrown(vec2 p) { float q = p.y - CR_Y, ax = abs(p.x);
  float hotel = max(max(step(ax, CR_HW) * step(q, CR_HH), step(ax, CR_HCW) * step(CR_HH, q) * step(q, CR_HH + CR_HCH)), step(ax, CR_HSX) * step(q, CR_HSH));
  float opera = max(step(length(vec2(ax, q)), CR_OR), max(step(abs(ax - CR_OFX), CR_OPW) * step(q, CR_OPH), step(length(vec2(ax - CR_OFX, q - CR_OPH - CR_OBR)), CR_OBR)));
  float bank = step(q, CR_BA * (1. - ax / CR_BHW));
  return step(0., q) * (uCrownK < .5 ? hotel : (uCrownK < 1.5 ? opera : bank)); }
`.replace(/CR_[A-Z]+/g, (k) => CROWN_DEF[k].toFixed(3));

// ---- 6 THE FRONT: one plane 16 by 13 m hinged on the ground at d 430; the lens goes through its one open window ----
function makeFront(P, sx, kind, rare) {
  const W = 16, H = 13, dH = LEN - 60, hy = 0.05, span = 3.6 / DUR, KF = 2.6, E = Math.exp(KF) - 1, E32 = Math.exp(3.2) - 1;
  // hole per kind: [centre y, half width, half height, type]; the lens passes 0.4 m inside its top
  // (restaged: the hole sits in the top row of the window grid, 1.6 m lower and wider than the brief's attic window, so that at the gasp it is whole in the upper third of a 62 degree frame)
  const hole = kind === 'opera' ? [8.4, 1.5, 1.5, 1] : kind === 'bank' ? [7.9, 1.0, 2.1, 2] : [8.5, 1.1, 1.5, 0];
  const rLens = hole[0] + hole[2] - 0.4;
  const Dx = Math.sqrt(rLens * rLens - (EYE - hy) * (EYE - hy)), uX = (dH - Dx) / LEN, thX = Math.atan2(Dx, EYE - hy);
  const sX = Math.log(1 + thX / (Math.PI / 2) * E) / KF, uS = uX - sX * span, uLand = uS + span;
  const theta = (u) => {
    const s = (u - uS) / span;
    if (s <= 0) { const k = sat((u - (uS - 0.013)) / 0.013); return -1.5 * D2R * Math.sin(Math.PI * k) * Math.sin(Math.PI * k) + 0.25 * D2R * gale(u) * Math.sin(u * DUR * 2.4); }
    if (s < 1) return (Math.PI / 2) * (Math.exp(KF * s) - 1) / E;
    const t = (s - 1) * 3.6; return Math.PI / 2 - 2.2 * D2R * Math.exp(-4.5 * t) * Math.abs(Math.sin(8 * t));
  };
  const U = { uTheta: { value: 0 }, uHinge: { value: new THREE.Vector2(hy, -dH) }, uWall: { value: new THREE.Vector2(W / 2, H) }, uHole: { value: new THREE.Vector4(...hole) }, uSunF: { value: P.shared.uSun.value.clone() } };
  U.uCrownK = { value: kind === 'opera' ? 1 : kind === 'bank' ? 2 : 0 };   // (flight4) which crown stands on the wall: read by sfCrown wherever the wall's outline is tested
  const geo = new THREE.PlaneGeometry(W, H); geo.translate(0, H / 2, 0);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...P.shared, ...U, uKind: { value: kind === 'opera' ? 1 : kind === 'bank' ? 2 : 0 },
      uTop: { value: col('#7F95B4').multiplyScalar(0.62) }, uFoot: { value: col('#B9C2CC').multiplyScalar(0.66) }, uWarm: { value: col('#A9A8A4').multiplyScalar(0.7) },
      uPine: { value: new THREE.Color(0.545, 0.425, 0.28) }, uShut: { value: col('#5F7896').multiplyScalar(0.8) } },
    vertexShader: /* glsl */`
      varying vec2 vP; varying vec3 vN; varying float vD;
      void main() { vP = position.xy; vN = normalize(mat3(modelMatrix) * vec3(0., 0., 1.));
        vec4 mv = modelViewMatrix * vec4(position, 1.); vD = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: GLSL_COMMON + GLSL_HOLE + /* glsl */`
      uniform float uTheta; uniform float uKind; uniform vec3 uTop; uniform vec3 uFoot; uniform vec3 uWarm; uniform vec3 uPine; uniform vec3 uShut;
      varying vec2 vP; varying vec3 vN; varying float vD;
      float box(vec2 p, vec2 c, vec2 h) { vec2 d = abs(p - c) - h; return max(d.x, d.y); }
      void main() {
        float hd = sfHole(vP); if (hd < 0.) discard;
        vec3 c;
        if (gl_FrontFacing) {
          c = mix(uFoot, uTop, clamp(vP.y / 13., 0., 1.)) * vec3(.8, .84, .92);   // deep in its own blue shade: the white trim and the one window of sky stand out of it
          c = mix(c, uWarm, smoothstep(.7, 1.35, uTheta));
          c = mix(c, vec3(.8, .82, .86), .6 * smoothstep(150., 320., vD));     // from the far end of the street it closes the view as a small pale rectangle
          float far = smoothstep(40., 90., vD), nearK = 1. - far, over = smoothstep(.3, .95, uTheta);
          // painted clapboard: every board a tone of its own, a butt edge and the shadow it throws on the board below, staggered joints,
          // weather streaks under the cornice and the sills. Standing, the butt edges are dark lines (lit from the sky); as the front comes
          // over us they turn to the pale road and light up, a rule of bright lines across the dark face
          float by = vP.y / .24, bi = floor(by), bf = fract(by), bh = fract(sin(bi * 91.7 + 3.1) * 4375.85);
          float butt = smoothstep(.85, .9, bf), under = smoothstep(.45, .85, bf) * (1. - butt);
          float jx = fract(vP.x / 3.4 + bh * 7.3), joint = 1. - smoothstep(.0, .006, abs(jx - .5));
          float sk = fract(sin(floor(vP.x * 5.) * 12.9898) * 43758.5453), sk2 = fract(sin(floor(vP.x * 1.7 + 3.) * 78.233) * 43758.5453);
          float streak = sk * sk2 * (1. - smoothstep(0., 3.2, 12.3 - vP.y));
          vec3 paint = c * (.93 + .14 * bh) * (1. - .1 * streak * nearK);
          c = paint * mix(1., (1. - .2 * under) * (1. - .42 * butt * (1. - over)) * (1. - .3 * joint * step(bf, .8)) * (.96 + .08 * bf), nearK);
          // shuttered windows (three rows of three, the top middle place is the one real hole): two louvred leaves in a pale casing
          vec2 cell = vec2(vP.x / 5. + .5, 0.); float cx = clamp(floor(cell.x) * 5., -5., 5.);
          float w = min(min(box(vP, vec2(cx, 1.5), vec2(.75, 1.2)), box(vP, vec2(cx, 4.6), vec2(.75, 1.05))), box(vP, vec2(cx, 8.4), vec2(.85, 1.35)) + (1. - step(1., abs(cx))) * 99.);
          float lf = fract(vP.y / .16);
          float lou = mix(.9, (.62 + .55 * lf) * (1. - .45 * (1. - smoothstep(.0, .2, lf)) * (1. - over)), nearK);
          float stile = max(step(-.085, w), step(abs(vP.x - cx), .05));
          vec3 leaf = uShut * .82 * mix(lou, 1.2, stile) * (1. - .5 * step(abs(vP.x - cx), .012));
          c = mix(c, leaf, step(w, 0.));
          float casing = step(0., w) * step(w, .13);
          c = mix(c, paint * 1.95, casing);
          c *= 1. - .28 * step(.13, w) * step(w, .19) * step(vP.y, 99.) * nearK * (1. - smoothstep(.13, .19, w));   // the casing's shadow on the boards
          float sill = step(abs(vP.x - cx), 1.08) * (step(abs(vP.y - .22), .07) + step(abs(vP.y - 3.47), .07) + step(abs(vP.y - 6.97), .07)) * step(1., abs(cx) + step(vP.y, 6.));
          c = mix(c, paint * 1.85, clamp(sill, 0., 1.));
          // two moulded string courses between the storeys: a pale board with a shadow under it
          float sc1 = abs(vP.y - 6.45), sc2 = abs(vP.y - 3.0);
          c = mix(c, paint * 1.9, step(sc1, .13) + step(sc2, .1));
          c *= 1. - .3 * (step(.13, sc1) * step(sc1, .2) * step(vP.y, 6.45) + step(.1, sc2) * step(sc2, .16) * step(vP.y, 3.0));
          // (polish2, second pass) a plain name board under the cornice (no letters): a pale grey-blue board in a thin moulding, three lozenges a
          // tone darker; quieter than the shutter casings, so the one open window under it stays the brightest and the only coloured thing on the wall
          { float sb = box(vP, vec2(0., 11.2), vec2(4.7, .4));
            vec3 nb = paint * 1.32;
            float lz = min(min(abs(vP.x) / .5 + abs(vP.y - 11.2) / .26, abs(vP.x - 2.7) / .5 + abs(vP.y - 11.2) / .26), abs(vP.x + 2.7) / .5 + abs(vP.y - 11.2) / .26);
            nb = mix(paint * 1.02, nb, step(1., lz));
            c = mix(c, nb, step(sb, 0.)); c = mix(c, paint * 1.6, step(0., sb) * step(sb, .07));
            c *= 1. - .22 * step(.07, sb) * step(sb, .13) * step(vP.y, 11.2) * nearK; }
          // the face darkens as it comes over: the hole is the one bright thing. The road it hangs over lights every downward edge
          // and it leans: dark at its top edge, paler and warmer toward its foot where the road throws its light up into it
          float gy = clamp(vP.y / 13., 0., 1.);
          float dk = mix(1., .46, over) * mix(1., mix(1.7, .62, gy), over);
          c *= dk; c += vec3(.1, .085, .055) * over * (1. - gy) * (1. - gy) * (1. - gy);
          vec3 roadL = vec3(.62, .6, .52) * over * nearK;
          c += roadL * (.4 * butt + .32 * step(w, 0.) * (1. - stile) * smoothstep(.72, .95, lf) + .3 * casing * step(vP.y, 99.));
          // the one open window: a pale casing, and the arris of its opening caught by the sun that comes through it
          vec2 hq = (vP - vec2(0., uHole.x)) / vec2(uHole.y, uHole.z); vec2 he = hq / max(length(hq), 1e-4);
          if (uHole.w < .5) he = abs(hq.x) > abs(hq.y) ? vec2(sign(hq.x), 0.) : vec2(0., sign(hq.y));
          vec2 s2 = vec2(uSun.x, uSun.y * cos(uTheta) + uSun.z * sin(uTheta));
          float rim = max(dot(-he, s2 / max(length(s2), 1e-4)), 0.);
          c = mix(c, uFoot * mix(1.55, 1.95, over), 1. - smoothstep(.2, .22, hd));
          c *= 1. - .3 * smoothstep(.22, .24, hd) * (1. - smoothstep(.24, .34, hd)) * nearK;
          c = mix(c, uSunC * vec3(1., .95, .82) * (.5 + 1.9 * rim), 1. - smoothstep(.05, .065, hd));
          // pale cornice (with a shadow line under it) and corner boards: a light rim round the dark face
          float cor = step(12.3, vP.y), cb = step(7.72, abs(vP.x)) * (1. - cor);
          c *= 1. - .35 * step(12.12, vP.y) * (1. - cor) * nearK;
          c = mix(c, mix(uFoot * 1.75 * (1. - .12 * step(abs(vP.y - 12.62), .04)), uSunC * vec3(.98, .95, .88), step(12.84, vP.y) * (1. - over)), cor);   // its top edge takes the sun that stands behind it
          c = mix(c, uFoot * 1.7 * (1. - .1 * step(abs(abs(vP.x) - 7.76), .012)), cb);
        } else {
          // (second pass) THE HOTEL WAS A STAGE FLAT: its back is raw pale pine, weathered silver in places. Sheathing boards run across (each a tone
          // of its own, a dark joint, knots), weathered darker than the frame; studs every 0.8 m, a plate at each storey and two raking braces stand
          // 10 cm proud of them (no noggings: a lattice of them read as paving): each has a sunlit top, a paler arris toward the sun and a hard blue shadow thrown on the boards on its far side
          float sx_ = (fract(vP.x / .8) - .5) * .8, py_ = (fract(vP.y / 3.25) - .5) * 3.25, bay = floor(vP.x / .8);
          float ny_ = 9.;
          float bd = abs(abs(vP.x) - vP.y * .55 - .4);
          float stud = step(abs(sx_), .055), plate = step(abs(py_), .075), nog = step(abs(ny_), .05), brace = step(bd, .075);
          float fr = max(max(stud, plate), max(nog, brace));
          float bi = floor(vP.y / .24), bf = fract(vP.y / .24);
          float gr = sin(vP.x * 55. + sin(vP.y * 3.1 + bi) * 3.) * .5 + .5, gr2 = fract(sin(bi * 91.7 + floor(vP.x / 2.6 + bi * .37) * 7.3) * 4375.85);
          vec3 pineB = vec3(.33, .26, .17), pineT = vec3(.66, .55, .37), silver = vec3(.34, .33, .3);
          float wth = smoothstep(.45, .75, fract(sin(floor(vP.x / .8) * 12.9 + bi * 3.7) * 437.5) * .6 + gr2 * .5);
          vec3 alb = mix(pineB, silver, wth * .6) * (.74 + .4 * gr2) * (1. - .45 * step(bf, .09)) * (.94 + .1 * gr);
          vec2 kc = vec2(fract(vP.x / 1.9 + gr2 * .7) - .5, bf - .5); alb *= 1. - .35 * (1. - smoothstep(.02, .06, length(kc * vec2(1.9, .24))));
          // shadows: the wall lies flat (or hangs over us); the sun stands ahead and to one side, so each timber's shadow lies on its side away from the sun
          vec2 sdir = vec2(sign(uSun.x), 1.) * vec2(.085, .11);
          float shS = step(abs(sx_ + sdir.x), .09) * (1. - stud) + step(abs(py_ + sdir.y), .11) * (1. - plate) + step(abs(ny_ + sdir.y * .8), .08) * (1. - nog) + step(abs(bd - .1), .08) * (1. - brace);
          shS = clamp(shS, 0., 1.) * (1. - fr);
          vec3 tim = pineT * (.9 + .14 * sin(vP.y * 37. + vP.x * 3.) * sin(vP.x * 9.)) * (.92 + .1 * gr);
          tim *= 1. + .16 * (step(abs(sx_ - sdir.x * .5), .014) * stud + step(abs(py_ - sdir.y * .5), .02) * plate);          // the arris that takes the sun
          tim = mix(tim, tim * .86, max(nog, brace) * (1. - max(stud, plate)));
          alb = mix(alb, tim, fr);
          alb = mix(alb, alb * vec3(.4, .56, 1.05), shS);
          // its foot is drifted over with the lot's dust once it is down: no ruled edge where the wall ends
          float de = .5 + .3 * sin(vP.x * 1.7 + 1.3) + .18 * sin(vP.x * 4.3) + .1 * sin(vP.x * 11.);
          float drift = (1. - smoothstep(de * .5, de * 1.5 + .35, vP.y + .12 * gr)) * smoothstep(1.3, 1.55, uTheta);
          alb = mix(alb, uPine * (.94 + .1 * gr) * mix(vec3(1.), vec3(.4, .52, .86), shS), drift * .92 * (1. - .85 * fr));          // the dust lies in the bays; the timbers stand out of it, each with its shadow
          c = sfLit(alb, -vN, 1.);
        }
        gl_FragColor = vec4(sfFog(c, vD), 1.); }`,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.matrixAutoUpdate = false; mesh.frustumCulled = false;
  // (flight4) THE FRONT HAS A HEAD: the building that falls on us reads as a building, on all three deals. One mesh of relief, a child of
  // the front's own mesh (so it is rigid with the wall for the whole flight and has no matrix of its own), shaded only by the front's
  // own angle (uTheta, the rig's uniform): it reads no u, no gale, no clock and no random number. Its numbers are CROWN's (above).
  // SIZING, in metres: a point r up the wall and z off its face is y = hy + r cos(th) - z sin(th) above the road. The lens goes through
  // the window at thX, where tan(thX) = Dx / (EYE - hy) (5.7 to 5.8 on the three kinds), so anything with z under r / tan(thX), 0.17 r,
  // is still off the road then: the rule kept here is z at most 0.16 r over the road, and 0.26 m less over the set-back boardwalk
  // (0.3 m high, from 5.7 m out: 0.25 m of height at that angle is 0.26 m of stand-off). The uprights begin at r 3.2, so the inner pair
  // (over the road) may stand 0.51 m off and the corner pair (over the boardwalk) 0.25 m: all four stand 0.24 m. headRule (in the
  // report) is the least room any piece has under that rule; it must not be negative
  const hd = { P: [], N: [], K: [], I: [], bb: [] };
  const hGeo = (g, k, tone = 1) => { const p = g.attributes.position, n = g.attributes.normal, b0 = hd.P.length / 3, ix = g.index;
    for (let i = 0; i < p.count; i++) { hd.P.push(p.getX(i), p.getY(i), p.getZ(i)); hd.N.push(n.getX(i), n.getY(i), n.getZ(i)); hd.K.push(k, tone); }
    // (flight4, repair) NOTHING OF THE HEAD LIES IN THE WALL'S OWN PLANE WITHIN THE WALL: a triangle whose three corners are on the plane
    // z = 0 at wall height 13 or under is left out (the back of a box, which once the wall is down and the lens is behind it was
    // painted over the pine back: the head is drawn after the face at equal depth). Above 13 m there is no wall, and the crown keeps its back
    const inWall = (i) => Math.abs(p.getZ(i)) < 1e-6 && p.getY(i) <= CROWN.y + 1e-6;
    for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i), b = ix.getX(i + 1), c = ix.getX(i + 2); if (!(inWall(a) && inWall(b) && inWall(c))) hd.I.push(b0 + a, b0 + b, b0 + c); }
    g.computeBoundingBox(); hd.bb.push(g.boundingBox.clone()); g.dispose(); };
  // one flat four-cornered face (corners in order round it), turned to face along n
  const hQuad = (q, n, k, tone = 1) => { const b0 = hd.P.length / 3, [a, b, c] = q;
    const f = ((b[1] - a[1]) * (c[2] - b[2]) - (b[2] - a[2]) * (c[1] - b[1])) * n[0] + ((b[2] - a[2]) * (c[0] - b[0]) - (b[0] - a[0]) * (c[2] - b[2])) * n[1] + ((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) * n[2];
    for (const v of f < 0 ? [q[3], q[2], q[1], q[0]] : q) { hd.P.push(v[0], v[1], v[2]); hd.N.push(n[0], n[1], n[2]); hd.K.push(k, tone); }
    hd.I.push(b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3); };
  // kinds of surface: 0 an upright in the face's paint, 1 pale trim, 2 a top edge that takes the sun, 3 the crown's clapboard, 4 slate
  const hBox = (x0, x1, y0, y1, z0, z1, k, tone = 1, rz = 0) => { const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    if (rz) g.rotateZ(rz); hGeo(g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), k, tone); };
  { const C = CROWN, co = C.corn, up = C.up, TR = 0.86, kd = kind === 'opera' ? C.opera : kind === 'bank' ? C.bank : C.hotel;
    // where the cornice's top is open to the sky (no crown standing on it) its upper band takes the sun, as the live face paints it
    const open = kind === 'opera' ? [[kd.r, kd.fx - kd.pw], [kd.fx + kd.pw, C.hw]] : kind === 'bank' ? [] : [[kd.shX, C.hw]];
    hBox(-C.hw, C.hw, co.y0, 12.84, 0, co.z, 1);                                               // the cornice (12.84: where the live face's sunlit band begins)
    let xa = 0; for (const [a, b] of [...open, [C.hw, C.hw]]) { if (a > xa) for (const s of [-1, 1]) hBox(Math.min(s * xa, s * a), Math.max(s * xa, s * a), 12.84, C.y, 0, co.z, 1);
      if (b > a) for (const s of [-1, 1]) hBox(Math.min(s * a, s * b), Math.max(s * a, s * b), 12.84, C.y, 0, co.z, 2); xa = b; }
    for (const x of co.br) for (const s of [-1, 1]) hBox(s * x - co.brW / 2, s * x + co.brW / 2, co.brY, co.y0, 0, co.brZ, 1, TR);   // brackets: above the name board (10.8 to 11.6 and its moulding)
    for (const x of up.xs) for (const s of [-1, 1]) { const c = s * x;
      hBox(c - up.hw, c + up.hw, up.y0, up.y0 + up.cap, 0, up.z, 1, TR); hBox(c - up.hw, c + up.hw, up.y1 - up.cap, up.y1, 0, up.z, 1, TR);   // a pale base and a pale cap
      if (kind === 'opera') hBox(c - 0.35, c + 0.35, up.y0 + up.cap, up.y1 - up.cap, 0, 0.1, 0, 1.2);                                  // the opera: flat pilasters
      else if (kind === 'bank') hGeo(new THREE.CylinderGeometry(0.3, 0.3, up.y1 - up.y0 - 2 * up.cap, 8, 1, true, -Math.PI / 2, Math.PI).scale(1, 1, up.z / 0.3).translate(c, (up.y0 + up.y1) / 2, 0), 0, 1.2);   // the bank: half-round columns
      else hBox(c - 0.25, c + 0.25, up.y0 + up.cap, up.y1 - up.cap, 0, up.z, 0, 1.2); }                                              // the hotel: square posts
    if (kind === 'opera') {
      // (flight4, repair) the lunette's face is ONE plane, 0.26 m off the wall's, in three parts that lie beside one another and never over
      // one another (field, rim, the rim's sunlit edge): three layers 5 to 15 mm apart are under one step of the depth buffer from the
      // entry to within 225 m of the wall and would flicker there. The drum is its curved wall and its back; nothing is behind the face
      hGeo(new THREE.CylinderGeometry(kd.r, kd.r, 0.26, 20, 1, true, Math.PI / 2, Math.PI).rotateX(Math.PI / 2).translate(0, C.y, 0.13), 1, TR);    // the lunette: a half drum
      hGeo(new THREE.CircleGeometry(kd.r, 20, 0, Math.PI).rotateY(Math.PI).translate(0, C.y, 0), 1, TR);                               // its back (above 13 m: there is no wall behind it)
      hGeo(new THREE.CircleGeometry(kd.r - kd.rim, 20, 0, Math.PI).translate(0, C.y, 0.26), 3);                                       // its field, in the wall's clapboard
      hGeo(new THREE.RingGeometry(kd.r - kd.rim, kd.r - 0.16, 20, 1, 0, Math.PI).translate(0, C.y, 0.26), 1, TR);                      // the rim
      hGeo(new THREE.RingGeometry(kd.r - 0.16, kd.r, 20, 1, 0, Math.PI).translate(0, C.y, 0.26), 2);                                   // the rim's top edge takes the sun
      for (const s of [-1, 1]) { hBox(s * kd.fx - kd.pw, s * kd.fx + kd.pw, C.y, C.y + kd.ph, 0, 2 * kd.pw, 1, TR);
        hGeo(new THREE.SphereGeometry(kd.br, 10, 8).translate(s * kd.fx, C.y + kd.ph + kd.br, kd.pw), 1, TR); }
    } else if (kind === 'bank') { const a = Math.atan2(kd.apex, kd.hw), ca = Math.cos(a), sa = Math.sin(a);
      { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-kd.hw, C.y, 0.12, kd.hw, C.y, 0.12, 0, C.y + kd.apex, 0.12], 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3)); g.setIndex([0, 1, 2]); hGeo(g, 3); }   // the tympanum
      // (flight4, repair) each raking cornice is MITRED: cut level on the cornice's top (wall height 13) and plumb on the centre line, where
      // it meets the other. A square-ended box dipped 0.43 m under 13 at the corner, so that its back lay in the wall's plane within the
      // wall, and the two overlapped in one plane under the apex. Seen from the street the outline and the bands are what the boxes showed.
      // A band t0 to t1 under the raking edge meets the cornice's top xb(t) out and the centre line ya(t) up; its faces: front, back, and
      // the raking top (the outer band) or the soffit (the inner band). Its two cut ends lie on the cornice and on the other rake
      const xb = (t) => kd.hw * (1 - t / (ca * kd.apex)), ya = (t) => C.y + kd.apex - t / ca;
      for (const s of [-1, 1]) for (const [t0, t1, k] of [[0.16, kd.rake, 1], [0, 0.16, 2]]) {   // a raking cornice: its outer 0.16 m takes the sun
        const A = [s * xb(t0), C.y], B = [s * xb(t1), C.y], Ci = [0, ya(t1)], D = [0, ya(t0)], at = (v, z) => [v[0], v[1], z];
        hQuad([at(A, 0.5), at(D, 0.5), at(Ci, 0.5), at(B, 0.5)], [0, 0, 1], k, TR); hQuad([at(A, 0), at(D, 0), at(Ci, 0), at(B, 0)], [0, 0, -1], k, TR);
        if (t0 === 0) hQuad([at(A, 0), at(A, 0.5), at(D, 0.5), at(D, 0)], [s * sa, ca, 0], k, TR); else hQuad([at(B, 0), at(B, 0.5), at(Ci, 0.5), at(Ci, 0)], [-s * sa, -ca, 0], k, TR);
        hd.bb.push(new THREE.Box3(new THREE.Vector3(Math.min(A[0], 0), C.y, 0), new THREE.Vector3(Math.max(A[0], 0), D[1], 0.5))); }
      // the block that closes the apex: a plate on the mitre's face, 6 cm off it (one step of the depth buffer is 37 mm at the entry, 430 m off:
      // the plate's face must stand more than a step in front of the rakes' face for the whole flight; it stood 2 cm off)
      hBox(-0.25, 0.25, C.y + kd.apex - 0.4, C.y + kd.apex, 0.5, 0.56, 2);
      hGeo(new THREE.CylinderGeometry(kd.disc, kd.disc, 0.1, 20).rotateX(Math.PI / 2).translate(0, C.y + 1.3, 0.17), 4);               // one blind slate disc, 1.3 m up: its rim is 0.48 m inside the rakes' sunlit band and 0.18 m clear of their soffit
    } else { hBox(-kd.hw, kd.hw, C.y, C.y + kd.hh, 0, 0.15, 3); hBox(-kd.capW, kd.capW, C.y + kd.hh, C.y + kd.hh + kd.capH, 0, 0.3, 2);
      for (const s of [-1, 1]) { hBox(Math.min(s * kd.hw, s * kd.shX), Math.max(s * kd.hw, s * kd.shX), C.y, C.y + kd.shH - 0.12, 0, 0.15, 3);
        hBox(Math.min(s * kd.hw, s * kd.shX), Math.max(s * kd.hw, s * kd.shX), C.y + kd.shH - 0.12, C.y + kd.shH, 0, 0.3, 2); } } }
  const hGeom = new THREE.BufferGeometry();
  hGeom.setAttribute('position', new THREE.Float32BufferAttribute(hd.P, 3)); hGeom.setAttribute('normal', new THREE.Float32BufferAttribute(hd.N, 3));
  hGeom.setAttribute('aK', new THREE.Float32BufferAttribute(hd.K, 2)); hGeom.setIndex(hd.I);
  // TONE: every piece is what the face's own shader would paint there. An upright is the face's paint at its height, a tone up (1.2: under
  // the name board's 1.32), warmed, blended far off and darkened as the wall comes over by the face's own three lines; the crown's body
  // is the same paint with the same clapboard; trim is the live cornice's pale (uFoot x 1.75), and a top edge takes the sun exactly as
  // the live cornice's does (and loses it as the wall comes over). Caps, brackets and the crown's trim are 0.86 of the cornice's pale:
  // 1.5, under the window casing's 1.55, so the casing and the sky in the hole stay the brightest things on the wall. A side turned
  // across the street is a tone down and an underside two (the sun is behind the wall; both are lit by the sky only), and as the wall
  // comes over the road lights every underside, as it lights the face's butt edges
  const hMat = new THREE.ShaderMaterial({
    uniforms: { ...P.shared, uTheta: U.uTheta, uTop: mat.uniforms.uTop, uFoot: mat.uniforms.uFoot, uWarm: mat.uniforms.uWarm, uShut: mat.uniforms.uShut },
    vertexShader: /* glsl */`
      attribute vec2 aK; varying vec3 vP; varying vec3 vNl; varying vec2 vK; varying float vD;
      void main() { vP = position; vNl = normal; vK = aK; vec4 mv = modelViewMatrix * vec4(position, 1.); vD = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      uniform float uTheta; uniform vec3 uTop; uniform vec3 uFoot; uniform vec3 uWarm; uniform vec3 uShut;
      varying vec3 vP; varying vec3 vNl; varying vec2 vK; varying float vD;
      void main() {
        vec3 n = normalize(vNl + vec3(0., 0., 1e-5));
        float over = smoothstep(.3, .95, uTheta), nearK = 1. - smoothstep(40., 90., vD), gy = clamp(vP.y / 13., 0., 1.), farK = .6 * smoothstep(150., 320., vD);
        vec3 c = mix(uFoot, uTop, gy) * vec3(.8, .84, .92);
        c = mix(c, uWarm, smoothstep(.7, 1.35, uTheta));
        c = mix(c, vec3(.8, .82, .86), farK);
        float by = vP.y / .24, bi = floor(by), bf = fract(by), bh = fract(sin(bi * 91.7 + 3.1) * 4375.85);
        float butt = smoothstep(.85, .9, bf), under = smoothstep(.45, .85, bf) * (1. - butt);
        float front = step(.5, n.z), top = step(.5, n.y), bot = step(.5, -n.y), side = (1. - front) * (1. - top) * (1. - bot);
        float dk = mix(1., .46, over) * mix(1., mix(1.7, .62, gy), over);
        vec3 glow = vec3(.1, .085, .055) * over * (1. - gy) * (1. - gy) * (1. - gy), roadL = vec3(.62, .6, .52) * over * nearK;
        float form = 1. - .22 * side - .4 * bot * (1. - over);
        vec3 trim = mix(uFoot * 1.75, vec3(.8, .82, .86), farK) * vK.y;
        vec3 col;
        if (vK.x < .5) col = c * vK.y * (1. - .3 * (1. - n.z) * (1. - top)) * dk + glow + roadL * .3 * bot;
        else if (vK.x < 1.5) col = trim * (1. - .12 * step(abs(vP.y - 12.62), .04) * front * step(.95, vK.y)) * form + roadL * .25 * bot;
        else if (vK.x < 2.5) col = mix(trim, uSunC * vec3(.98, .95, .88), (1. - over) * max(front, top)) * form + roadL * .25 * bot;
        else if (vK.x < 3.5) col = c * (.93 + .14 * bh) * mix(1., (1. - .2 * under) * (1. - .42 * butt * (1. - over)) * (.96 + .08 * bf), nearK * front) * form * dk + glow + roadL * .4 * butt * front;
        else col = uShut * .82 * form * dk + glow;
        gl_FragColor = vec4(sfFog(col, vD), 1.); }`,
  });
  const head = new THREE.Mesh(hGeom, hMat); head.matrixAutoUpdate = false; head.frustumCulled = false; mesh.add(head);
  // the red curtain hangs to world-down from the lintel, to one side of the hole
  const cur = new Rig(); cur.g = 0; const red = col('#B8402E');
  const cx0 = hole[3] < 0.5 ? 0.6 : 0.47, nC = hole[3] < 0.5 ? 6 : 5;
  for (let i = 0; i < nC; i++) cur.box(0.085, 1.5 - 0.06 * (i % 3), 0.03, i % 2 ? red : red.clone().multiplyScalar(0.8), -sx * (cx0 + i * 0.085), -0.75 + 0.03 * (i % 3), i % 2 ? 0.02 : -0.01, 0, 0, 0, false);
  cur.build(P.mats.lit, P.mats.shadow());
  // one shutter that drops off in the lull (30.6 s)
  const sh = new Rig(); sh.box(0.8, 2.6, 0.05, col('#5F7896'), 0, 0, 0).build(P.mats.lit, P.mats.shadow());
  const uSh = 0.746, shX = sx * 5.43, shY = 8.4, tFall = Math.sqrt(2 * (shY - 0.45) / 9.81);
  P.dust.burst(P.rng, uSh + tFall / DUR, shX, 0.1, -dH + 0.9, Math.round(4 * P.detail), { speed: 1.2, life: 1.2, size: 0.6 });
  // four props that held it up; on the rare visit they fold flat one after another, each 0.4 m ahead of us
  const wood = col('#B08A5A').multiplyScalar(0.9), props = [];
  for (let k = 0; k < 4; k++) {
    const r = new Rig(), dk = dH + 1.6 + k * 1.5, side = k % 2 ? 1 : -1, top = 2.5 + k * 0.3, L = Math.hypot(dk - dH - 0.2, top), lean = Math.atan2(dk - dH - 0.2, top);
    r.box(0.14, L, 0.14, wood, 0, L / 2, 0).box(0.5, 0.1, 0.5, wood, 0, 0.05, 0, 0, 0, 0, false).build(P.mats.lit, P.mats.shadow());
    props.push({ r, dk, side, lean, m: new THREE.Matrix4(), uL: (dk - 0.4) / LEN });
  }
  // dust sheet when it lands: up both sides and out from under the edges
  const nD = Math.round(26 * P.detail);
  for (const s of [-1, 1]) P.dust.burst(P.rng, uLand, s * 8.2, 0.1, -dH + 6.5, nD, { speed: 4.2, life: 2.0, size: 1.5, sx: 0.5, sz: 6.5, dir: [s * 0.9, 0.5, 0] });
  P.dust.burst(P.rng, uLand, 0, 0.1, -dH - 0.6, Math.round(18 * P.detail), { speed: 3, life: 1.5, size: 0.95, sx: 7.5, sz: 0.5, dir: [0, 0.35, -1.4] });
  // the sheet: the air squeezed out through the sheathing jumps up across the whole width a few metres ahead of us, lit, with a slot left down the middle for the hat
  for (const s of [-1, 1]) {
    P.dust.burst(P.rng, uLand - 0.0005, s * 5.6, 0.15, -dH + 1.5, Math.round(22 * P.detail), { speed: 4.6, life: 1.0, size: 1.7, sx: 2.6, sz: 2.2, dir: [s * 0.45, 1.0, -0.2] });
    P.dust.burst(P.rng, uLand + 0.001, s * 6.4, 0.15, -dH - 2.5, Math.round(12 * P.detail), { speed: 3.6, life: 1.9, size: 2.0, sx: 3.0, sz: 1.2, dir: [s * 0.5, 0.7, -0.9] });
  }
  // a veil of dust off the cornice as it comes, and loose flecks of paint shaken off the face: the air the wall pushes ahead of it blows
  // them at us. Each fleck is a closed form in u; in the wall's shadow it is a pale blue speck, in the beam of sun through the window it blazes
  const hf = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
  for (let i = 0; i < 9; i++) { const u0 = 0.797 + i * 0.006, th = theta(u0);
    P.dust.burst(P.rng, u0, 0, hy + H * Math.cos(th) + 0.2, -dH + H * Math.sin(th), Math.round(7 * P.detail), { speed: 2.2, life: 0.9, size: 0.75, sx: 7.6, sz: 0.2, dir: [0, 0.2, -1.1] }); }
  // the wind-up's one visible slip, seen from the far end of the lull: from the rock-back the front tears loose of its neighbours, and dust
  // pours out of both seams and off the cornice (its own little generator: the device's rng, and so every solved margin, is left as it was)
  { let q = 9173; const r2 = () => ((q = (q * 16807) % 2147483647) / 2147483647);
    // (polish2) one falling streak per seam, not a chain of round puffs up it: small puffs let go one under another from the top of each seam,
    // each falling fast and gone by u 0.795; nothing off the cornice
    for (let i = 0; i < 9; i++) { const u0 = 0.7705 + i * 0.0018, th = theta(u0), sw = 12.2 - i * 0.9 - 0.5 * r2();
      for (const s of [-1, 1]) P.dust.burst(r2, u0, s * 7.75, hy + sw * Math.cos(th), -dH + sw * Math.sin(th) + 0.6, Math.max(1, Math.round(2 * P.detail)), { speed: 1.2, life: 0.62, size: 0.42, sx: 0.12, sz: 0.1, dir: [-s * 0.04, -6, 0.12] }); } }
  const nF = Math.round(520 * P.detail), fO = new Float32Array(nF * 3), fN = new Float32Array(nF * 3), fQ = new Float32Array(nF * 4);
  for (let i = 0; i < nF; i++) {
    const u0 = lerp(0.796, uLand - 0.002, Math.pow(hf(i * 3.1), 0.7)), th = theta(u0), dth = (theta(u0 + 0.0005) - th) / (0.0005 * DUR);
    const top = hf(i * 5.3) < 0.25, yw = top ? H - 0.7 * hf(i * 7.7) : lerp(1.5, H, Math.sqrt(hf(i * 7.7))), xw = (hf(i * 9.1) - 0.5) * (W - 0.2);
    const ny = -Math.sin(th), nz = Math.cos(th);
    fO.set([xw, hy + yw * Math.cos(th) + ny * 0.06, -dH + yw * Math.sin(th) + nz * 0.06], i * 3);
    fN.set([(hf(i * 13.7) - 0.5) * 0.5, ny, nz], i * 3);
    fQ.set([u0, hf(i * 17.9), 0.045 + 0.07 * hf(i * 23.3), 1.5 + dth * yw * (1.1 + 0.8 * hf(i * 29.9))], i * 4);
  }
  const fGeo = new THREE.InstancedBufferGeometry(); fGeo.copy(new THREE.PlaneGeometry(1, 1));
  fGeo.setAttribute('aO', new THREE.InstancedBufferAttribute(fO, 3)); fGeo.setAttribute('aN', new THREE.InstancedBufferAttribute(fN, 3));
  fGeo.setAttribute('aQ', new THREE.InstancedBufferAttribute(fQ, 4)); fGeo.instanceCount = nF;
  const fMat = new THREE.ShaderMaterial({
    uniforms: { ...P.shared, ...U, uRes: P.uRes, uU: { value: 0 }, uTime: { value: 0 } },
    vertexShader: GLSL_HOLE + /* glsl */`
      attribute vec3 aO; attribute vec3 aN; attribute vec4 aQ;
      uniform float uU; uniform float uTime; uniform float uTheta; uniform vec2 uHinge; uniform vec2 uWall; uniform vec3 uSunF; uniform vec2 uRes;
      varying float vLit; varying float vD; varying float vA;
      void main() {
        float age = (uU - aQ.x) * ${DUR.toFixed(1)}, a = max(age, 0.), sd = aQ.y;
        vec3 p = aO + aN * aQ.w * (1. - exp(-2.6 * a)) / 2.6;
        p.y -= 1.3 * a + .5 * a * a; p.z += .7 * a;
        p += vec3(sin(uTime * 2.9 + sd * 40.), .4 * sin(uTime * 4.1 + sd * 23.), cos(uTime * 2.3 + sd * 17.)) * .07 * min(a * 3., 1.);
        p.y = max(p.y, .03);
        float st = sin(uTheta), ct = cos(uTheta); vec3 n = vec3(0., -st, ct), w = vec3(0., ct, st), H = vec3(0., uHinge.x, uHinge.y);
        float front = dot(p - H, n), up = dot(p - H, w);
        float on = step(0., age) * step(age, 2.6) * max(step(.03, front), step(uWall.y, up));
        float dn = min(dot(uSunF, n), -1e-4), t = dot(H - p, n) / dn; vec3 q = p + t * uSunF; vec2 wc = vec2(q.x, dot(q - H, w));
        float shade = step(0., t) * step(abs(wc.x), uWall.x) * step(0., wc.y) * max(step(wc.y, uWall.y), sfCrown(wc)) * step(0., sfHole(wc));
        vLit = (1. - shade) * (.55 + .45 * sin(uTime * (7. + 6. * sd) + sd * 60.));
        vec4 mv = viewMatrix * vec4(p, 1.); float d = max(-mv.z, .05);
        float px = aQ.z * uRes.y * .5 * projectionMatrix[1][1] / d, sz = clamp(px, 1.7, 7.);
        vA = clamp(px / 1.7, .45, 1.) * smoothstep(0., .1, a) * (1. - smoothstep(2., 2.6, a)) * smoothstep(.6, 2.2, d);
        vec4 c = projectionMatrix * mv; float rot = uTime * (2. + 5. * sd) + sd * 9.; vec2 e = vec2(cos(rot), sin(rot));
        vec2 o = (position.x * e + position.y * vec2(-e.y, e.x) * (.35 + .65 * abs(sin(rot * 1.7)))) * sz * on * 2.;
        c.xy += o / uRes * c.w; vD = d; gl_Position = c; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunC; uniform vec3 uFogC; uniform float uFogD; varying float vLit; varying float vD; varying float vA;
      void main() { vec3 c = mix(vec3(.4, .47, .62), uSunC * vec3(2.3, 2.1, 1.6), vLit);
        float f = 1. - exp(-uFogD * uFogD * vD * vD); gl_FragColor = vec4(mix(c, uFogC, f), vA); }`,
    transparent: true, depthWrite: false,
  });
  const flecks = new THREE.Mesh(fGeo, fMat); flecks.frustumCulled = false; flecks.renderOrder = 4;
  // THE SKIRT: the air the wall pushes out from under itself drives a knee-high skirt of pale dust down the road at us, across the whole
  // width but for the middle 3 m (the hat, the patch of sun and the ruts stay clean). Every puff is a closed form in u; a slow loop on the
  // clock keeps it streaming while u is held. Blue-pale in the wall's shadow, warm where it crosses the beam of sun through the window
  const nS = Math.round(420 * P.detail), sA = new Float32Array(nS * 4), sB = new Float32Array(nS * 3);
  for (let i = 0; i < nS; i++) {
    const side = i % 2 ? 1 : -1, hx = hf(i * 2.3 + 500);
    sA.set([side * (1.85 + 5.9 * hx), lerp(0.799, uLand - 0.004, Math.pow(hf(i * 4.1 + 900), 0.9)), 12 + 15 * hf(i * 6.7 + 1300), hf(i * 8.9 + 1700)], i * 4);
    sB.set([hf(i * 10.3 + 2100), hf(i * 12.1 + 2500), 2.3 + 1.0 * hf(i * 14.9 + 2900)], i * 3);
  }
  const sGeo = new THREE.InstancedBufferGeometry(); sGeo.copy(new THREE.PlaneGeometry(1, 1));
  sGeo.setAttribute('aS', new THREE.InstancedBufferAttribute(sA, 4)); sGeo.setAttribute('aT', new THREE.InstancedBufferAttribute(sB, 3)); sGeo.instanceCount = nS;
  const sMat = new THREE.ShaderMaterial({
    uniforms: { ...P.shared, ...U, uU: fMat.uniforms.uU, uTime: fMat.uniforms.uTime },
    vertexShader: GLSL_HOLE + /* glsl */`
      attribute vec4 aS; attribute vec3 aT;   // x0, u0, speed, seed | seeds, life
      uniform float uU; uniform float uTime; uniform float uTheta; uniform vec2 uHinge; uniform vec2 uWall; uniform vec3 uSunF;
      varying vec2 vUv; varying vec3 vW; varying float vD; varying float vA; varying float vSd;
      void main() {
        float age = (uU - aS.y) * ${DUR.toFixed(1)}, a = max(age, 0.), sd = aS.w, life = aT.z;
        float ph = fract(uTime * .42 + sd * 7.);
        float run = aS.z * (1. - exp(-.85 * a)) / .85 + ph * 3.8;
        float sgn = aS.x < 0. ? -1. : 1.;
        float wd = (1.2 + 1.1 * aT.x) * (.6 + .5 * min(a, 2.)), hg = wd * .2 * (.75 + .6 * aT.y);
        vec3 p = vec3(sgn * max(abs(aS.x) + .05 * run * (aT.x - .35), 1.85), hg * .5 + .03 * a + .02 * sin(uTime * 2.7 + sd * 40.), uHinge.y + .7 + run);
        float st = sin(uTheta), ct = cos(uTheta); vec3 n = vec3(0., -st, ct), w = vec3(0., ct, st), H = vec3(0., uHinge.x, uHinge.y);
        float front = dot(p - H, n);
        float on = step(0., age) * step(age, life) * step(.12, front);
        vec3 cr = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), cu = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        vW = p + (cr * position.x * wd + cu * position.y * hg) * on;
        vec4 mv = viewMatrix * vec4(vW, 1.);
        vUv = uv; vSd = sd; vD = length(mv.xyz);
        vA = on * smoothstep(0., .18, a) * (1. - smoothstep(life * .6, life, a)) * smoothstep(0., .2, ph) * (1. - smoothstep(.65, 1., ph)) * smoothstep(.7, 2.4, vD);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: GLSL_COMMON + GLSL_HOLE + /* glsl */`
      uniform float uTheta; uniform vec2 uHinge; uniform vec2 uWall; uniform vec3 uSunF; uniform vec3 uShadeC;
      varying vec2 vUv; varying vec3 vW; varying float vD; varying float vA; varying float vSd;
      float kH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float kN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(kH(i), kH(i + vec2(1., 0.)), f.x), mix(kH(i + vec2(0., 1.)), kH(i + vec2(1., 1.)), f.x), f.y); }
      void main() { vec2 q = vUv - .5; float r2 = dot(q, q) * 4.;
        // in the wall's shadow unless this bit of the puff stands in the beam that comes through the window (or out past the wall's edge)
        float st = sin(uTheta), ct = cos(uTheta); vec3 n = vec3(0., -st, ct), w = vec3(0., ct, st), H = vec3(0., uHinge.x, uHinge.y);
        float dn = min(dot(uSunF, n), -1e-4), t = dot(H - vW, n) / dn; vec3 hp = vW + t * uSunF; vec2 wc = vec2(hp.x, dot(hp - H, w));
        float vLit = 1. - step(0., t) * step(abs(wc.x), uWall.x) * step(0., wc.y) * max(step(wc.y, uWall.y), sfCrown(wc)) * step(0., sfHole(wc));
        // a low mound with a ragged crest: soft all round, fuller along the ground
        float dome = clamp(1. - q.x * q.x * 4. - vUv.y * vUv.y * (1. + .25 * sin(vUv.x * 11. + vSd * 50.)), 0., 1.);
        // (flight1) ROLLING DUST, NOT PALE BLOTS: each bank is five times as long as it is high, so its billows are laid out in those proportions
        // (round in the world): lobes along the crest, eaten away from the top, whole along the ground, as the landing's puffs are. And in the
        // wall's shadow it is the shade's own blue, 1.5 times the shaded road at its foot to 2.2 times on its crest (dust in the air is lit by
        // the whole sky, the road by half of it): it was up to 3.5 times, and read as light patches painted on the shadow
        vec2 bq = vec2(vUv.x * 5., vUv.y) * 2.4 + vSd * 37.; float n1 = kN(bq), n2 = kN(bq * 2.3 + 11.), nz = n1 * .62 + n2 * .38;
        float body = dome - (1. - nz) * .55 * (.35 + vUv.y);
        float a = dome * smoothstep(0., .3, body) * smoothstep(0., .07, vUv.y);
        float crest = smoothstep(.15, .7, vUv.y + .2 * (1. - dome) + (n1 - .5) * .5);
        vec3 shade = uShadeC * mix(vec3(1.5), vec3(2.2, 2.2, 2.1), crest);
        vec3 sun = mix(vec3(.8, .7, .52), uSunC * vec3(1.7, 1.5, 1.12), crest);
        gl_FragColor = vec4(sfFog(mix(shade, sun, vLit), vD), a * clamp(vA, 0., 1.) * mix(.46, .85, vLit)); }`,
    transparent: true, depthWrite: false,
  });
  const skirt = new THREE.Mesh(sGeo, sMat); skirt.frustumCulled = false; skirt.renderOrder = 5;
  const m = new THREE.Matrix4(), mc = new THREE.Matrix4(), ms = new THREE.Matrix4(), hinge = new THREE.Vector3(0, hy, -dH), sc = new THREE.Vector3();
  const info = { H, W, dH, uS, uLand, uX, thick: hy + 0.02, U, theta };
  // (flight4) MEASURED, not solved: the nearest the new relief comes to the lens while the wall falls (the wall's own miss, the lintel's
  // 0.4 m, is typed and unchanged; the relief only has to stay well outside it). The lens is carried into the wall's own coordinates at
  // 2,001 moments from the rock-back's end to the landing and its distance taken to every piece's box (a curved piece's bounding box:
  // never further than the piece). Also printed: the least height any piece has over the ground under it at the angle the lens goes
  // through the window (clear), the least room under the 0.16 r rule (rule), and whether the two kept-clear places are empty
  { let best = 1e9, bu = 0, rule = 1e9, clear = 1e9, zoneA = true, zoneB = true; const inv = new THREE.Matrix4(), lp = new THREE.Vector3();
    for (let i = 0; i <= 2000; i++) { const u = uS + (uLand - uS) * i / 2000; inv.compose(hinge, _qa.setFromAxisAngle(AX, theta(u)), ONE).invert(); lp.set(0, EYE, -LEN * u).applyMatrix4(inv);
      for (const b of hd.bb) { const d = b.distanceToPoint(lp); if (d < best) { best = d; bu = u; } } }
    for (const b of hd.bb) { const bw = Math.max(Math.abs(b.min.x), Math.abs(b.max.x)) > 5.7;        // over the set-back boardwalk (0.3 m high, from 5.7 m out)
      rule = Math.min(rule, 0.16 * b.min.y - (bw ? 0.26 : 0) - b.max.z); clear = Math.min(clear, hy + b.min.y * Math.cos(thX) - b.max.z * Math.sin(thX) - (bw ? 0.3 : 0));
      if (b.min.x < 1.9 - 1e-4 && b.max.x > -1.9 + 1e-4 && b.max.y > 5 && b.min.y < 12.3 - 1e-4) zoneA = false;            // the window and its casing
      if (Math.max(sx * b.min.x, sx * b.max.x) > 4.8 && Math.min(sx * b.min.x, sx * b.max.x) < 6.1 && b.min.y < 9.8 && b.max.z > 0.05) zoneB = false; }   // the column the dropped shutter falls through
    info.head = { miss: +best.toFixed(3), at: +bu.toFixed(4), clear: +clear.toFixed(3), rule: +rule.toFixed(3), windowClear: zoneA, shutterClear: zoneB, pieces: hd.bb.length, tris: hd.I.length / 3 }; }
  return { info, mesh, flecks, skirt, rigs: [cur, sh, ...props.map((p) => p.r)], uc: uX, name: 'front',
    update(u, time) {
      const th = theta(u); U.uTheta.value = th; fMat.uniforms.uU.value = u; fMat.uniforms.uTime.value = time;
      { const sv = P.shared.uSun.value, k = 1 - 0.8 * sstep(0.8, 0.838, u) * (1 - sstep(uLand, uLand + 0.01, u)), hx = sv.x * k;
        U.uSunF.value.set(hx, sv.y, -Math.sqrt(Math.max(sv.x * sv.x + sv.z * sv.z - hx * hx, 0))); }   // the patch of sun slides onto the centre line as the wall comes over
      m.compose(hinge, _qa.setFromAxisAngle(AX, th), ONE); mesh.matrix.copy(m); mesh.matrixWorldNeedsUpdate = true;
      // curtain: from the lintel, world-down, a little sway; it shortens as the lintel nears the ground
      _pa.set(0, hole[0] + hole[2] - (hole[3] > 0.5 ? 0.35 : 0), -0.03).applyMatrix4(m);
      const lenK = clamp((_pa.y - 0.05) / 1.5, 0.04, 1), g = gale(u);
      _qb.setFromAxisAngle(AX, (0.06 + 0.3 * g) * Math.sin(time * 2.1) + 0.25 * g).multiply(_qc.setFromAxisAngle(AZ, 0.05 * Math.sin(time * 1.3)));
      mc.compose(_pa, _qb, sc.set(1, lenK, 1)); cur.set(mc);
      // shutter
      const ts = (u - uSh) * DUR, tf = Math.min(Math.max(ts, 0), tFall), tb = Math.max(ts - tFall, 0);
      const hang = ts < 0 ? 0.12 * sstep(-1.2, 0, ts) * Math.sin(ts * 9) : 0;
      _pb.set(shX, shY - 0.5 * 9.81 * tf * tf + 0.3 * Math.exp(-5 * tb) * Math.abs(Math.sin(tb * 8)) * (tb > 0 ? 1 : 0), 0.06 + tf * 0.7 + (tb > 0 ? 0.35 * (1 - Math.exp(-4 * tb)) : 0));
      _pb.applyMatrix4(m);
      if (ts > 0) _pb.set(shX, Math.max(shY - 0.5 * 9.81 * tf * tf, 0.42) + 0.3 * Math.exp(-5 * tb) * Math.abs(Math.sin(tb * 8)) * (tb > 0 ? 1 : 0), -dH + 0.06 + tf * 0.7 + (tb > 0 ? 0.35 * (1 - Math.exp(-4 * tb)) : 0));
      _qb.setFromAxisAngle(AX, ts > 0 ? Math.min(tf * 1.2 + tb * 3, 1.45) : 0).multiply(_qc.setFromAxisAngle(AZ, hang));
      ms.compose(_pb, _qb, ONE); sh.set(ms);
      // props
      for (const p of props) {
        const shud = Math.exp(-Math.max(u - uLand, 0) * DUR * 3) * (u > uLand ? 0.05 * Math.sin((u - uLand) * DUR * 24) : 0);
        let fold = 0;
        if (rare) { const s = (u - (p.uL - 1.5 / DUR)) / (1.5 / DUR); fold = s <= 0 ? 0 : s < 1 ? (Math.PI / 2) * (Math.exp(3.2 * s) - 1) / E32 : Math.PI / 2 - 0.04 * Math.exp(-5 * (s - 1) * 1.5) * Math.abs(Math.sin((s - 1) * 1.5 * 9)); }
        const k = fold / (Math.PI / 2);
        _pa.set(p.side * 2.4, 0, -p.dk);
        _qb.setFromAxisAngle(AZ, p.side * fold * 0.985).multiply(_qc.setFromAxisAngle(AX, (p.lean + shud) * (1 - k)));
        p.m.compose(_pa, _qb, ONE); p.r.set(p.m);
      }
    } };
}

// ---- the whole device. opts: { shared, uRes, sx (-1 brief, +1 mirrored), slot2 ('carts'|'barrels'), kind ('hotel'|'opera'|'bank'), rare } ----
// ---- (flight2) THE LOT'S DUST: billows that lie on the ground. The landings' puffs (makeDust) are round bodies thrown into the air; what the
// slam throws back into the lot and what the light breeze lifts there is a different thing, dust rolling along the ground, and drawn as round
// puffs it stood over the picket runs as cream blobs. Each billow here is a card that stands on the road (its foot dies into the ground: see the repair in its shader),
// wider than it is high, with a ragged skyline of lobes, a crown lit by the sun ahead and a belly in the shade's blue, eaten away from the top
// as it ages; its lobes roll forward with the air. Every billow is a closed form in u, laid out at build; the air that carries it is makeDust's ----
function makeLotDust(shared, cap, door) {
  const N = Math.max(1, cap), org = new Float32Array(N * 3), vel = new Float32Array(N * 3), par = new Float32Array(N * 4);
  // two quads to a billow: its shadow on the road (position.z = 1: drawn first, under the card) and the card that stands on the road (z = 0)
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 1, 0.5, 0, 1, 0.5, 1, 1, -0.5, 1, 1, -0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
  geo.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  let used = 0;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...shared, uU: { value: 0 }, uGale: { value: 0.35 }, uCol: { value: col('#E9DFC8').multiplyScalar(0.8) } },
    vertexShader: /* glsl */`
      attribute vec3 aOrg; attribute vec3 aVel; attribute vec4 aPar;   // aOrg: x, final height m, z; aVel: throw x, 0, throw z (m/s); aPar: u0, life s, final width m, seed
      uniform float uU; uniform float uGale; uniform vec3 uSun; varying vec2 vUv; varying vec4 vA; varying float vD; varying float vSh; varying float vH; varying vec3 vW; varying float vN;
      void main() {
        float age = (uU - aPar.x) * ${DUR.toFixed(1)}; float k = clamp(age / max(aPar.y, .01), 0., 1.);
        float on = step(0., age) * step(age, aPar.y), ag = max(age, 0.);
        vec3 c = vec3(aOrg.x, 0., aOrg.z) + vec3(aVel.x, 0., aVel.z) * (1. - exp(-2.4 * ag)) / 2.4;
        c.z += (uGale * 5. + .4) * ag * (.6 + .4 * aPar.w);                                   // the same air as the landings' dust
        float gr = sqrt(k), w = aPar.z * (.4 + .6 * gr) * on, h = aOrg.y * (.5 + .5 * gr) * on;
        vec3 rt = normalize(vec3(viewMatrix[0][0], 0., viewMatrix[2][0]) + vec3(1e-5, 0., 0.));
        vec3 p = c + rt * position.x * w + vec3(0., position.y * h, 0.);
        // its shadow: the card laid down the sun onto the road (a point h up lands h * sun.xz / sun.y nearer us), 1.6 cm over the dust
        if (position.z > .5) p = c + vec3(position.x * w, .016, 0.) - vec3(uSun.x, 0., uSun.z) * (position.y * h / max(uSun.y, .2));
        vec4 mv = viewMatrix * vec4(p, 1.);
        vUv = vec2(position.x * 2., position.y); vD = length((viewMatrix * vec4(c, 1.)).xyz); vSh = position.z; vH = aOrg.y * (.5 + .5 * gr);
        // (flight2 repair) A BILLOW NEAR THE LENS THINS FROM ITS OUTLINE, NOT AS A PANE: vN goes 0 to 1 as it comes from two of its own
        // widths away to one (aPar.z is its width full grown), and the fragment shader takes vN off its body, so its edge goes first; the
        // last of it is let go between one width and half a width. (It was one fade of the whole card with distance, 1.6 to 7 m.)
        vW = p; vN = 1. - smoothstep(aPar.z, 2. * aPar.z, vD);
        vA = vec4(on * smoothstep(0., .08, k) * (1. - k * k * k) * smoothstep(.5 * aPar.z, aPar.z, vD), k, aPar.w, ag);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      uniform vec3 uCol; varying vec2 vUv; varying vec4 vA; varying float vD; varying float vSh; varying float vH; varying vec3 vW; varying float vN;
      // (flight2 repair) DUST THAT STANDS IN THE DOOR-CASE'S SHADOW IS IN SHADE. The point is carried up the sun to the plane the door-case
      // stands in (as the road carries its own to the falling front) and tested against the door-case's outline, mirrored about the line:
      // each part is a span of |x| and of height, its top falling by a slope for the pediment. A cloud is a body a metre or two deep, so
      // the edge of a shadow on it is blurred: a quarter of a metre either way
      float lBx(float a, float lo, float hi) { return smoothstep(lo - .25, lo + .25, a) * (1. - smoothstep(hi - .25, hi + .25, a)); }
      float lDoor(vec3 p) { float t = (p.z - (${door.z.toFixed(2)})) / max(-uSun.z, .2); vec2 h = vec2(abs(p.x + uSun.x * t), p.y + uSun.y * t); float s = 0.;
${door.parts.map((q) => `        s = max(s, lBx(h.x, ${q[0].toFixed(3)}, ${q[1].toFixed(3)}) * lBx(h.y, ${q[2].toFixed(3)}, ${q[3].toFixed(3)} - ${(q[4] || 0).toFixed(3)} * h.x));`).join('\n')}
        return s * smoothstep(0., .5, t); }
      float lH2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float lVn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(lH2(i), lH2(i + vec2(1., 0.)), f.x), mix(lH2(i + vec2(0., 1.)), lH2(i + vec2(1., 1.)), f.x), f.y); }
      void main() { float x = vUv.x, y = vUv.y, sd = vA.z * 37., roll = vA.w * .22;
        // the skyline: a low dome broken into three or four lobes that roll forward (toward us) as the billow ages
        // (flight2 repair) its flanks die into the ground: the half-circle rose sheer from the card's two ends (a straight flank);
        // the shoulder now comes off the ground at no slope and joins the same dome by 0.74 of the half width (1 - x x = 0.45)
        float e = clamp(1. - x * x, 0., 1.), dome = sqrt(e) * smoothstep(0., .45, e);
        float sky = dome * (.5 + .5 * lVn(vec2(x * 2.1 + sd + roll, sd * .3 + roll * .6))) + .16 * dome * (lVn(vec2(x * 5.3 - sd + roll * 1.7, sd)) - .5);
        // the body under it, eaten away from its edge by two scales of noise, more as it ages (the foot is not eaten by this: its own fade is below)
        vec2 q = vec2(x * 2.6, y * 3.4) + vec2(sd + roll, -roll * 1.3);
        float n1 = lVn(q), n2 = lVn(q * 2.4 + 9.), n = n1 * .5 + n2 * .3 + lVn(q * 5.1 + 3.) * .2;
        float body = sky - y - (1. - n) * (.12 + .34 * vA.y) * smoothstep(.0, .25, y);
        body -= vN * (.3 + .9 * (1. - n));                                                 // near the lens: eaten from its outline (see vN)
        float a = smoothstep(0., .14 + .2 * y, body);                                      // a soft torn crest
        // (flight2 repair) THE FOOT DIES INTO THE GROUND: dust lying on a road has no edge along the ground. The card's own bottom edge
        // was drawn at full strength (a ruler line, and a train of cards a flight of terraces); now nothing is drawn at the ground, the
        // billow comes in over its lowest 0.25 m, and where that begins wanders up to 0.2 m with the crest's own noise (in metres: vH)
        a *= smoothstep(0., .25, y * vH - .2 * lVn(vec2(x * 4.3 + sd * 1.7, roll * 2. + sd)));
        // light: dust in the air is lit through by the sun ahead, so a billow is bright; it is in its own shade along the ground (its
        // lowest 0.2 to 0.4 m, whatever its height: vH is its height in metres) and under each lobe, and that shade is the pale blue
        // of shade on this road, never grey
        float ym = y * vH + (n1 - .5) * .5;
        float lit = smoothstep(0., .42, ym) * mix(.72, 1., smoothstep(.3, .62, n1 * .6 + n2 * .4));
        vec3 c = uCol * mix(vec3(.44, .5, .68), uSunC * vec3(1.36, 1.3, 1.16), lit) * (1. - .1 * (1. - lit));
        float dsh = lDoor(vW); c = mix(c, uCol * vec3(.44, .5, .68) * .9, dsh);              // in the door-case's shadow: its own shade's blue all over, no sunlit crown
        // the shadow quad: the same skyline laid on the road, soft, in the blue of the rigs' shadows; dust is thin, so it is half as deep as theirs
        if (vSh > .5) { gl_FragColor = vec4(sfFog(vec3(.105, .13, .2), vD), smoothstep(-.05, .3, sky - y - vN) * .3 * clamp(vA.x, 0., 1.) * (1. - dsh)); return; }   // (repair) no shadow of its own on road the door-case already shades; it thins with the billow
        gl_FragColor = vec4(sfFog(c, vD), a * clamp(vA.x, 0., .86)); }`,
    transparent: true, depthWrite: false,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, N); mesh.frustumCulled = false; mesh.renderOrder = 5;
  return { mesh, mat,
    // n billows in a train sz long from (x, z) at u0: final width wd and height ht (m), life s, the throw (vx, vz) in m/s; hr is the caller's own hash
    burst(hr, u0, x, z, n, o) {
      for (let i = 0; i < n && used < N; i++, used++) { const f = n > 1 ? i / (n - 1) - 0.5 : 0;
        org[used * 3] = x + (hr() - 0.5) * 2 * o.sx; org[used * 3 + 1] = o.ht * (0.75 + 0.25 * hr()); org[used * 3 + 2] = z + f * o.sz + (hr() - 0.5) * 0.4;
        vel[used * 3] = o.vx * (0.6 + 0.8 * hr()); vel[used * 3 + 1] = 0; vel[used * 3 + 2] = o.vz * (0.6 + 0.8 * hr());
        par[used * 4] = u0 + hr() * 0.002; par[used * 4 + 1] = o.life * (0.7 + 0.6 * hr()); par[used * 4 + 2] = o.wd * (0.8 + 0.2 * hr()); par[used * 4 + 3] = hr(); } },
    finish() { for (let i = used; i < N; i++) par[i * 4] = 9;     // never born
      geo.setAttribute('aOrg', new THREE.InstancedBufferAttribute(org, 3)); geo.setAttribute('aVel', new THREE.InstancedBufferAttribute(vel, 3));
      geo.setAttribute('aPar', new THREE.InstancedBufferAttribute(par, 4)); } };
}
export async function buildDevice(ctx, opts = {}) {
  const sx = opts.sx ?? -1, detail = ctx.quality?.detail ?? 1, rng = ctx.rng.fork ? ctx.rng.fork('stone-face-device') : ctx.rng;
  const shared = opts.shared || makeShared(new THREE.Vector3(-0.19, 0.788, -0.586));
  const uRes = opts.uRes || { value: new THREE.Vector2(800, 450) };
  const mats = makeMaterials(shared), group = new THREE.Group();
  const dust = makeDust(shared, Math.max(560, Math.round(1000 * detail)));
  const lotRun = opts.lotRun || { x0: 10.67, d0: 438, x1: 4.62, d1: 470.75, paling: 471, side: 13, door: { z: -490.1, parts: [[2.64, 6.09, 0, 4.55], [2.64, 4.785, 4.55, 5.42], [-1, 3.84, 4.96, 5.84], [-1, 3.99, 5.84, 7.61, 0.444], [3.3, 6.7, 5.4, 11.2], [3.95, 6.05, 11.2, 11.95]] } };   // (the set-piece viewer builds the device without the world: the world's own LOT_RUN, copied)
  const lot = makeLotDust(shared, Math.round(5 * detail) * 8 + Math.round(6 * detail) * 18, lotRun.door);   // (flight2) all the lot's dust (eight heaps of five billows, eighteen gusts of six) has a pool of its own; the landings' pool is no longer enlarged for it
  const P = { mats, shared, uRes, dust, rng, detail, fx: new Rig() };
  P.chips = makeChips(P, Math.round(170 * detail) + 8);
  const Y = ctx.yield ? () => ctx.yield() : async () => {};
  const front = makeFront(P, sx, opts.kind || 'hotel', !!opts.rare); await Y();
  const hat = makeHat(mats, front.info, Math.sign(shared.uSun.value.x) || -1), feather = makeFeather(mats, 1); await Y();
  const hazards = [];
  hazards.push(makeSign(P, sx, 0.122, 2.0)); await Y();
  hazards.push(opts.slot2 === 'barrels' ? makeBarrels(P, sx, 0.245, 1.5) : makeCarts(P, sx, 0.245, 1.5)); await Y();
  hazards.push(makeLadder(P, sx, 0.366, 1.0)); await Y();
  hazards.push(makePiano(P, 239 / LEN, 0.7)); await Y();
  hazards.push(makePoles(P, sx, [0.590, 0.620, 0.649], [3.0, 1.5, 0.5])); await Y();
  // (flight1) THE WALL'S DUST IS STILL IN THE LOT: the slam throws a bank of dust back over the hinge as well as out to the sides; it rolls into
  // the lot and hangs there (no wind until the breeze returns), and we go through it for the 14 m beyond the hinge, billows passing on both
  // hands; gone by about u 0.907 as the journey says. Then the breeze's low gusts (above) are joined by as many again, further out and
  // further on, so dust is rolling somewhere in the lot until the gate.
  // (flight2) All the lot's dust is ground billows now (makeLotDust), laid BY A RULE IN METRES: DUST HIGHER THAN A FENCE STANDS ONLY BEYOND
  // THAT FENCE, NEVER BEFORE IT, AND NO BILLOW STANDS ON A FENCE'S LINE. So from the line every fence is whole and in front of its dust:
  // - LOW gusts roll between the line and the picket runs: 1.1 m at their highest lobe, under the lowest picket top (1.14 m), so the
  //   pickets' heads and the dark fence stand clear above them. A low gust's body keeps 0.3 m off the run's line for its whole life:
  //   he is its half width with the scatter of its train, out the most it travels outward (throw / 2.4, the drag of the dust's law),
  //   and the run's place is taken where it is nearest any billow of the train (the train's far end);
  // - beyond the cross paling (d 471) a gust is TALL (3 m: it shows over the paling, which stands whole in front of it), and none lies
  //   across the paling at any moment of its life: one dealt there is moved along the street to the nearer side (near is the most it
  //   travels toward us: throw / 2.4 plus the breeze over its longest life). (third repair) Beyond the paling the nearest a train's
  //   centre may be laid is the paling + near + half a train + the scatter along the train (0.2 m) + 0.3 m, so that the billow born
  //   nearest us, having travelled the most a billow can, is still 0.3 m beyond the paling;
  // - where the runs have closed in and there is no room for a low gust (less than 2.6 m clear of the line), the gust rises beyond the
  //   paling instead, tall.
  // (third repair) ONE LAW FOR THE MOMENT OF ALL EIGHTEEN: a gust's place is settled first (both moves), and it rises when the lens is
  // its own "short" metres short of that final place, wherever that is. No gust takes its moment from a place it does not have.
  // Each gust's own numbers are a closed hash of its index, so the layout is the same on a phone and a desktop; the billows of the heaps'
  // and of flight1's trains take theirs from the stream hr, those of the builders' nine from the visit's rng (see below).
  { let hk = 0; const hr = () => { const x = Math.sin((hk++) * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
    const hq = (i) => { const x = Math.sin(i * 39.3467 + 11.1) * 24634.6345; return x - Math.floor(x); };
    const dH = front.info.dH ?? 430, uLand = front.info.uLand, n5 = Math.round(5 * detail), n6 = Math.round(6 * detail);
    const run = lotRun;
    const xr = (d) => run.x0 + (run.x1 - run.x0) * Math.min(1, Math.max(0, (d - run.d0) / (run.d1 - run.d0)));          // how far out the picket run stands at d
    // four heaps a side thrown back over the hinge by the slam, 3.2 m apart from 2 m beyond it, 4.6 m out and further: 3 m wide full
    // grown and 1.6 m high, 0.2 m lower for each 3.2 m further it is thrown (the fourth, by the first pickets, is 1 m); thrown into the
    // lot at 2.56 m/s and outward at 1.12 (flight1's throw). A heap keeps inside the run by its half width and scatter (1.5 + 0.5), its
    // outward travel (1.12 x 1.4 / 2.4 = 0.65) and 0.3 m, measured where the run is nearest any billow of its train: 2.5 m further on
    // (its travel into the lot, 2.56 x 1.4 / 2.4 = 1.5, half its train, 0.8, and the scatter along it, 0.2)
    for (const s of [-1, 1]) for (let j = 0; j < 4; j++) { const d = dH + 2 + 3.2 * j, c = Math.min(4.6 + 1.9 * j, xr(d + 2.5) - 2.0 - 0.65 - 0.3);
      lot.burst(hr, uLand + 0.002 * j, s * c, -d, n5, { wd: 3.0, ht: 1.6 - 0.2 * j, sx: 0.5, sz: 1.6, life: 1.9 + 0.35 * j, vx: s * 1.12, vz: -2.56 }); }
    // A GUST is a train of six billows 3.6 m long, thrown toward us at 4.4 m/s and outward at 0.4 (the builders' throw), alive 2.6 s.
    // Low: each billow 2.4 m wide full grown (each overlaps the next by more than half: one rolling bank), he = 1.2 + 0.3, out = 0.4 x 1.4 / 2.4.
    // Tall: 4 m wide and 3 m high full grown (its lobes stand 1.5 to 3 m, the paling is 2.1 m: its higher lobes show over it).
    // near = 4.4 x 1.4 / 2.4 + 1.15 m/s of breeze for 3.4 s = 6.5 m; half a train is 1.8 m; ALONG is burst's scatter of a billow along its train, +-0.2 m
    const NEAR = 6.5, HALF = 1.8, HE = 1.5, ALONG = 0.2;
    const gust = (i, d0, c0, short, far, sd, sc) => { let d = d0, c = c0, tall = true; const beyond = run.paling + NEAR + HALF + ALONG + 0.3;   // (third repair) the nearest a train may be laid beyond the paling: its nearest-born billow (half a train and the scatter nearer us than its centre), after the most it can travel toward us, is still 0.3 m beyond the paling (d 479.8)
      if (d + HALF + 0.3 > run.paling && d < beyond) d = d - (run.paling - HALF - 0.3) <= beyond - d ? run.paling - HALF - 0.3 : beyond;
      if (d < run.paling) { const xin = xr(d + HALF + 0.2) - HE - 0.25 - 0.3;             // the furthest out a low gust may lie at d: (second repair) measured where the run is nearest any billow of its train, half a train and the scatter along it (0.2 m) further on; a gust is thrown toward us, so none of it is ever further on than it was born
        if (xin >= 2.6 + HE) { tall = false; c = Math.min(c0, xin); }                    // room between the line and the run: low, and inside
        else d = beyond + 4 * far; }                                                     // no room: it rises beyond the paling instead, at the nearest place or up to 4 m further on (its own hash). That is a place, not a margin from the door-case (z -490.1): a train laid the whole 4 m further on (d 483.8) has its centre 6.3 m and its furthest-born billow (half a train and the scatter further on) 4.3 m short of the door-case
      const rise = (d - short) / LEN;                                                    // (third repair) one law for all eighteen: the place is settled above (both moves), and the gust rises when the lens is "short" metres short of that final place
      if (tall) c = Math.min(c, run.side - 2.0 - 0.5 - 0.25 - 0.3);                    // (flight2 repair) no billow on the side fence's line either: a tall one keeps inside it by its half width, 2 m, its scatter, 0.5, its outward travel, 0.25, and 0.3 m
      lot.burst(sc, rise, sd * c, -d, n6, tall ? { wd: 4.0, ht: 3.0, sx: 0.5, sz: 3.6, life: 2.6, vx: 0.4 * sd, vz: 4.4 } : { wd: 2.4, ht: 1.1, sx: 0.3, sz: 3.6, life: 2.6, vx: 0.4 * sd, vz: 4.4 }); };
    // flight1's nine gusts: every 4.4 m from d 449, 4.8 to 10.8 m out, risen when we are 24 to 30 m short of them
    // (flight2 repair) their three numbers come from the builders' own hash hq at the next three offsets of its series: the builders'
    // nine below read hq(i), hq(i + 20), hq(i + 40); these read hq(i + 60), hq(i + 80), hq(i + 100). No salt of this round's choosing
    for (let i = 0; i < 9; i++) gust(i, 449 + i * 4.4, 4.8 + 6 * hq(i + 60), 24 + 6 * hq(i + 80), hq(i + 100), i % 2 ? -1 : 1, hr);
    // the builders' nine, on the other hand of each: the light breeze in the lot, the last of the dust lifting off the ground and blowing
    // past us clear of the centre line. Their places and moments are the builders' own law (the hash hq: every 5.2 m from d 446, 2.6 to
    // 9.6 m out, risen when we are 26 to 32 m short), now under the same rule and drawn as the same billows.
    // (second repair) THEIR SCATTER IS DEALT FROM THE VISIT'S RNG, on the device's fork, where the builders dealt it: the billows of
    // these nine trains take their nine numbers each from rng, not from hr, so they differ from visit to visit as the builders' puffs
    // did. They are the last draws taken on that fork (nothing is dealt after them): 9 a billow, 6 detail billows a train, 9 trains
    // (486 at detail 1, 324 on a phone; the builders' puffs took 10 a sprite: 540 and 360). The fence rule holds for every value a
    // draw can take, because each of its margins is the scatter's own bound (see gust and burst): nothing here depends on the deal
    for (let i = 0; i < 9; i++) gust(i, 446 + i * 5.2, 2.6 + 7 * hq(i + 20), 26 + 6 * hq(i), hq(i + 40), i % 2 ? 1 : -1, rng); }
  lot.finish();
  P.fx.build(mats.lit, mats.shadow()); P.fx.set(new THREE.Matrix4()); dust.finish(); P.chips.finish(); group.add(P.chips.mesh);
  const add = (r) => { group.add(r.mesh, r.shadow); };
  for (const h of hazards) { if (h.rig) add(h.rig); if (h.rigs) h.rigs.forEach(add); if (h.extra) h.extra.forEach((e) => group.add(e)); }
  front.rigs.forEach(add); group.add(front.mesh, front.flecks, front.skirt); add(hat); add(feather); add(P.fx); group.add(dust.mesh, lot.mesh);
  await Y();
  const report = hazards.map((h) => { const r = h.miss(); return { name: h.name, uc: +h.uc.toFixed(4), miss: +r.miss.toFixed(3), at: +r.u.toFixed(4) }; });
  report.push({ name: 'front', uc: +front.info.uX.toFixed(4), miss: 0.4, uS: +front.info.uS.toFixed(4), uLand: +front.info.uLand.toFixed(4), head: front.info.head });   // (flight4) head: the relief's measured nearest approach and its sizing
  const size = new THREE.Vector2();
  return {
    object: group, front: front.info, frontU: front.info.U, hat, shared, uRes, report, gale,
    update(dt, time, camera, u) {
      const g = gale(u);
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); uRes.value.copy(size); }
      for (const h of hazards) h.update(u, time);
      front.update(u, time); hat.pose(u, time); feather.pose(u, time);
      dust.mat.uniforms.uU.value = u; dust.mat.uniforms.uGale.value = g; lot.mat.uniforms.uU.value = u; lot.mat.uniforms.uGale.value = g;
      { const cu = P.chips.mat.uniforms; cu.uU.value = u; cu.uTime.value = time; cu.uGale.value = g; }
      return g;
    },
    dispose() {},
  };
}

// set-piece viewer entry (tools/shot.mjs _part): the device alone, frozen at the gasp
export async function buildHero(ctx, opts = {}) {
  const dev = await buildDevice(ctx, opts);
  dev.object.position.set(0, 0, LEN - 60 - 8);
  return { object: dev.object, radius: 14, height: 13, center: new THREE.Vector3(0, 5, 0), anchors: {}, ground: true, groundY: 0,
    update(dt, time, camera) { dev.update(dt, time, camera, 0.80 + 0.06 * (0.5 + 0.5 * Math.sin(time * 0.5))); }, dispose() {} };
}
