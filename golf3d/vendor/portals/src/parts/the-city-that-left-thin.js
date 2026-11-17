// THE CITY THAT LEFT, shared makers of thin and falling things, used on the town (the hero part) and on the land:
//   Strands + makeStrandMaterial   ribbons that face the camera, swing as pendulums, never thinner than the screen draws
//   Sheets + makeFallMaterial      falls of water, dust and drips: sheets bent into the fall in the vertex shader
//   tunnelInto                     the stub of a cut tunnel, added to a prop accumulator
import * as THREE from 'three';
import { sharedU, GLSL_COMMON } from './the-city-that-left-common.js';

// Everything thin is a ribbon that turns to face the camera, never narrower than a pixel and a half on screen (it fades
// instead), with its edges softened by fwidth. Each vertex carries its lever arm from the point it hangs by, so the
// whole thing swings as a pendulum in the vertex shader: a closed form of the clock.
export class Strands {
  constructor() { this.P = []; this.T = []; this.S = []; this.W = []; this.C = []; this.I = []; this.n = 0; }
  // pts [[x, y, z]...]; hw half width (m); col linear rgb; swing(i) -> [lever arm (m), phase, amplitude (rad), rate (rad/s)]
  line(pts, hw, col, swing) {
    const base = this.n, m = pts.length;
    for (let i = 0; i < m; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(m - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1, sw = swing(i);
      for (const side of [-1, 1]) {
        this.P.push(pts[i][0], pts[i][1], pts[i][2]); this.T.push((b[0] - a[0]) / l, (b[1] - a[1]) / l, (b[2] - a[2]) / l);
        this.S.push(side, hw); this.W.push(sw[0], sw[1], sw[2], sw[3]); this.C.push(col[0], col[1], col[2]); this.n++;
      }
      if (i > 0) { const k = base + (i - 1) * 2; this.I.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
  }
  get triangles() { return this.I.length / 3; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('aTan', new THREE.Float32BufferAttribute(this.T, 3));
    g.setAttribute('aSide', new THREE.Float32BufferAttribute(this.S, 2)); g.setAttribute('aSw', new THREE.Float32BufferAttribute(this.W, 4));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3)); g.setIndex(this.I);
    g.computeBoundingSphere(); g.boundingSphere.radius += 12;
    return g;
  }
}
// A strand is never drawn thinner than this many metres for each metre it is from the eye (0.0017: what one line of a
// 720-line picture covers at one metre with this world's lens), so far cables stay whole lines instead of breaking
// into dots; it thins in alpha instead. By distance alone: nothing here reads the lens.
const STRAND_LEAST = 0.0017;
export function makeStrandMaterial(S) {
  return new THREE.ShaderMaterial({
    uniforms: sharedU(S, { uPix: { value: STRAND_LEAST } }), transparent: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aTan, color; attribute vec2 aSide; attribute vec4 aSw;
      uniform float uTime, uPix; uniform vec2 uGlowAz;
      varying vec3 vWorld, vCol; varying float vAcross, vCover, vRim;
      void main(){
        vec3 p = position;
        // the pendulum: mostly along the rim, a little in and out
        vec2 rad = p.xz / max(length(p.xz), 1e-3), tg = vec2(-rad.y, rad.x);
        float th = aSw.z*(sin(uTime*aSw.w + aSw.y) + .35*sin(uTime*aSw.w*2.3 + aSw.y*1.7));
        p.xz += (tg*.92 + rad*.4*sin(aSw.y*5.))*th*aSw.x;
        vec4 wp = modelMatrix*vec4(p, 1.);
        vec3 toCam = cameraPosition - wp.xyz; float dist = max(length(toCam), 1e-3);
        vec3 sd = cross(aTan, toCam); sd = sd / max(length(sd), 1e-5);
        float hw = max(aSide.y, dist*uPix*.75);
        vCover = aSide.y / hw; vAcross = aSide.x; vCol = color;
        vRim = dot(sd.xz, uGlowAz)*aSide.x;                       // the edge that faces the afterglow
        wp.xyz += sd*aSide.x*hw; vWorld = wp.xyz;
        gl_Position = projectionMatrix*viewMatrix*wp;
      }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      varying vec3 vWorld, vCol; varying float vAcross, vCover, vRim;
      void main(){
        float fw = fwidth(vAcross), a = (1. - smoothstep(1. - min(fw*1.5, .9), 1., abs(vAcross)))*clamp(vCover, 0., 1.);
        if (a < .01) discard;
        float rim = clamp(vRim, 0., 1.)*smoothstep(.1, .9, abs(vAcross));
        vec3 col = vCol*(mix(uHemiGnd, uHemiSky, .5 + .3*vAcross) + uBand*rim*1.6);
        gl_FragColor = vec4(ctlFog(col, vWorld - cameraPosition), a);
      }`,
  });
}


// A sheet's vertex knows its place along the lip, how far along the fall it is (t) and the sheet's numbers.
export class Sheets {
  constructor() { this.P = []; this.U = []; this.F = []; this.O = []; this.I = []; this.n = 0; }
  // top(k) -> [x, y, z] for k = 0..na (points along the lip); o: { len, out (m travelled outward by the bottom), dir [x, z],
  //   width (billboards: half width in m; 0 = not a billboard), seed, kind, nd, spread }
  sheet(na, top, o) {
    const base = this.n, nd = o.nd;
    for (let k = 0; k <= na; k++) {
      const p = top(k);
      for (let i = 0; i <= nd; i++) {
        this.P.push(p[0], p[1], p[2]); this.U.push(na ? (k / na) * 2 - 1 : 0, i / nd);
        this.F.push(o.len, o.out, o.seed, o.kind); this.O.push(o.dir[0], o.dir[1], o.width || 0, o.spread ?? 0.3); this.n++;
      }
    }
    for (let k = 0; k < na; k++) for (let i = 0; i < nd; i++) { const a = base + k * (nd + 1) + i, b = a + 1, c = a + nd + 2, d = a + nd + 1; this.I.push(a, b, c, a, c, d); }
  }
  get triangles() { return this.I.length / 3; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('aUV', new THREE.Float32BufferAttribute(this.U, 2));
    g.setAttribute('aFall', new THREE.Float32BufferAttribute(this.F, 4)); g.setAttribute('aOut', new THREE.Float32BufferAttribute(this.O, 4));
    g.setIndex(this.I); g.computeBoundingSphere(); g.boundingSphere.center.y -= 90; g.boundingSphere.radius += 130;
    return g;
  }
}

// the one material of every fall: water (kind 0), dust (1), drips (2)
export function makeFallMaterial(S) {
  return new THREE.ShaderMaterial({
    uniforms: sharedU(S, { uFlow: { value: 1 } }), transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec2 aUV; attribute vec4 aFall, aOut;
      uniform float uTime, uFlow;
      varying vec3 vWorld; varying vec2 vUV; varying vec4 vFall; varying float vAcross;
      void main(){
        float t = aUV.y, len = aFall.x, kind = aFall.w;
        vec3 p = position;
        float drop = len*t*t, flow = mix(1., uFlow, step(kind, .5));
        // it leaves the lip going outward and keeps that speed; the lower part wavers in the air
        vec2 out2 = aOut.xy*aFall.y*t*(.6 + .4*flow), perp = vec2(-aOut.y, aOut.x);
        float wav = sin(uTime*(kind > .5 && kind < 1.5 ? .35 : .8) + aFall.z*7. + t*4.)*t*t*(kind > .5 && kind < 1.5 ? 6. : 2.5)*step(kind, 1.5);
        p.xz += out2 + perp*wav + perp*aUV.x*aOut.w*t*len*.06*step(aOut.z, .001);
        p.y -= drop;
        vec4 wp = modelMatrix*vec4(p, 1.);
        // billboards: a narrow sheet that turns about the vertical to face the camera
        vec3 toCam = cameraPosition - wp.xyz; vec2 rt = vec2(toCam.z, -toCam.x); rt = rt / max(length(rt), 1e-4);
        float halfW = aOut.z*(1. + aOut.w*t*3.);
        wp.xz += rt*aUV.x*halfW;
        vAcross = step(aOut.z, .001)*aUV.x*10.5 + aUV.x*halfW;      // metres across, more or less
        vWorld = wp.xyz; vUV = aUV; vFall = aFall;
        gl_Position = projectionMatrix*viewMatrix*wp;
      }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      uniform float uFlow;
      varying vec3 vWorld; varying vec2 vUV; varying vec4 vFall; varying float vAcross;
      void main(){
        float t = clamp(vUV.y, 0., 1.), x = vUV.x, kind = vFall.w, seed = vFall.z;
        vec3 toP = vWorld - cameraPosition; float dist = length(toP);
        vec2 h = toP.xz / max(length(toP.xz), 1e-4);
        float back = clamp(dot(h, uGlowAz), 0., 1.); back *= back;      // looking through it toward the afterglow
        float edge = 1. - smoothstep(.55, 1., abs(x));
        vec3 col; float a;
        if (kind < .5) {
          // water: streaks that stretch as they fall (the pattern rides the time of flight), thinning to rain
          float flow = uFlow;
          float q = t*42. - uTime*3.1;
          float s1 = cN(vec2(vAcross*1.7 + seed*13., q)), s2 = cN(vec2(vAcross*5.3 + seed*29., q*1.9 + 3.)), s3 = cN(vec2(vAcross*.45 + seed*5., q*.5));
          float body = s1*.55 + s2*.3 + s3*.35;
          float thin = mix(.16, .78, smoothstep(.04, .85, t)) + (1. - flow)*.22;
          a = smoothstep(thin, thin + .3, body)*edge*(1. - smoothstep(.62, 1., t))*(.5 + .5*flow);
          a = max(a, (1. - smoothstep(0., .06, t))*edge*.85*flow);            // the smooth tongue at the lip
          float white = smoothstep(.5, .9, body);
          // pale grey-blue water, with only a thin warm edge on the side toward the afterglow
          col = mix(vec3(.1, .125, .17), vec3(.36, .41, .5), white) + uBand*.3*back*smoothstep(.45, .9, abs(x))*white;
        } else if (kind < 1.5) {
          // dust and soil: slower, softer, in threads of grains that catch the afterglow when the eye looks through them
          float q = t*9. - uTime*.9;
          float s1 = cF(vec2(vAcross*.33 + seed*13., q)), s2 = cN(vec2(vAcross*1.9 + seed*29., q*3.1)), s3 = cN(vec2(vAcross*7. + seed*3., q*5.3 + 1.7));
          a = smoothstep(.36, .8, s1*.7 + s2*.5)*(.3 + .45*smoothstep(.45, .8, s3))*edge*(1. - smoothstep(.4, 1., t))*smoothstep(0., .08, t);
          col = vec3(.11, .09, .072)*(1. + uHemiSky*.5) + (uBand*.45 + uRose*.2)*back*(.4 + .6*s3);
        } else {
          // drips: single drops with long tails, faster the further they have fallen
          float q = t*11. - uTime*1.25 + seed;
          float f = fract(q), id = floor(q);
          float on = step(.45, cH(vec2(id, seed*7.)));
          a = on*smoothstep(.0, .12, f)*(1. - smoothstep(.12, .2 + .5*t, f))*edge*(1. - smoothstep(.7, 1., t))*.8;
          col = vec3(.2, .24, .32) + uBand*.06*back;
        }
        // a narrow fall close to the eye fades out before it fills the frame (the river's own sheets, the long ones, do not)
        a *= smoothstep(1.5, 6., dist)*mix(smoothstep(9., 34., dist)*mix(1., smoothstep(30., 80., dist), step(.5, kind)*step(kind, 1.5)), 1., step(205., vFall.x));
        if (a < .004) discard;
        float f = ctlFogF(toP);
        gl_FragColor = vec4(mix(col, uFogCol, f)*a, a);
      }`,
  });
}

// Tunnel stubs: the concrete lining of a cut subway or sewer standing a few metres proud of the broken rock, lit inside.
// place: { p: [x, y, z] floor centre of the mouth, d: [dx, dz] unit, the way it opens, out: metres it stands proud }
export function tunnelInto(acc, T, rng, glow = 1) {
  const [px, py, pz] = T.p, dx = T.d[0], dz = T.d[1];
  // local frame: z along the axis (outward), x across, y up
  const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(dz, 0, -dx), new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, 0, dz)).setPosition(px, py, pz);
  acc.set(m);
  const W = 2.7, H = 2.5, n = 8, prof = [[-W, 0], [-W, H]];
  for (let k = 1; k < n; k++) { const a = Math.PI * (1 - k / n); prof.push([Math.cos(a) * W, H + Math.sin(a) * W]); }
  prof.push([W, H], [W, 0]);
  const zs = [-17, -9, -3, T.out], conc = [0.13, 0.125, 0.115], dark = [0.035, 0.034, 0.034], lipC = [0.2, 0.19, 0.175];
  for (let s = 0; s < zs.length - 1; s++) {
    const z0 = zs[s], z1 = zs[s + 1], e0 = (0.2 - 0.05 * s) * glow, e1 = (0.2 - 0.05 * (s + 1)) * glow;
    for (let k = 0; k < prof.length - 1; k++) {
      const a = prof[k], b = prof[k + 1];
      acc.quad([b[0], b[1], z0], [a[0], a[1], z0], [a[0], a[1], z1], [b[0], b[1], z1], dark, e0, e1);                // inside, lit by its lamps
      if (z1 > -3) acc.quad([a[0] * 1.16, a[1] * 1.12 - 0.3, z0], [b[0] * 1.16, b[1] * 1.12 - 0.3, z0], [b[0] * 1.16, b[1] * 1.12 - 0.3, z1], [a[0] * 1.16, a[1] * 1.12 - 0.3, z1], conc);   // the lining, outside
    }
    acc.quad([-W, 0, z1], [W, 0, z1], [W, 0, z0], [-W, 0, z0], [0.05, 0.048, 0.045], e1 * 0.8, e0 * 0.8);      // track bed
    if (z1 > -3) acc.quad([-W * 1.16, -0.3, z0], [W * 1.16, -0.3, z0], [W * 1.16, -0.3, z1], [-W * 1.16, -0.3, z1], conc);
  }
  // the broken lip, the dark far end with a light a long way in
  for (let k = 0; k < prof.length - 1; k++) { const a = prof[k], b = prof[k + 1], z = T.out; acc.quad([a[0], a[1], z], [b[0], b[1], z], [b[0] * 1.16, b[1] * 1.12 - 0.3, z], [a[0] * 1.16, a[1] * 1.12 - 0.3, z], lipC); }
  acc.quad([-W, 0, -17], [W, 0, -17], [W, H + W, -17], [-W, H + W, -17], dark, 0.22 * glow, 0.4 * glow);
  // lamps along the crown, two rails that run out over the brink and droop
  for (const z of [-13, -8.5, -4, -0.6]) acc.box(0.9, H + W - 0.55, z, 0.5, 0.18, 0.9, [0.3, 0.28, 0.2], 2.6 * glow);
  const droop = rng.range(0.25, 0.7), reach = T.out + rng.range(2, 7);
  for (const sx of [-0.75, 0.75]) {
    acc.box(sx, 0.12, (T.out - 17) / 2, 0.14, 0.2, T.out + 17, [0.06, 0.055, 0.05]);
    acc.cyl([sx, 0.15, T.out], [sx + rng.range(-0.4, 0.4), 0.15 - droop * (reach - T.out) * 0.5, reach], 0.11, 0.09, 4, [0.07, 0.06, 0.05], 0, 1);
  }
  acc.set(null);
}

