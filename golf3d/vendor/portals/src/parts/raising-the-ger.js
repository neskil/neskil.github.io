// THE RAISING OF THE GER: hero set piece
// A ger 60 m across (built 10x life size) that assembles itself in one take, in the order a ger is really raised.
// Local space: ground at y 0, x east, z south, the ger's centre at the origin, the door facing south (+z).
// Everything exists from build() and is only moved: one progress value u (0..1 on the brief's beat scale, on which the
// door's threshold is 0.87: the world maps its flight onto it) drives
//   lattice   six concertina sections (three per side) that scissor open from the door jambs and meet in the north
//   poles     81 poles lying on the grass like rays, picked up onto the wall head as the lattice arrives, then swung
//             up and over one after another into the sockets of the crown, each seating with a shiver
//   crown     the orange wheel, propped face-on to the north between its leaning pillars, carried up to 24 m while
//             the camera is still on its way in, so that it is seen whole from below
//   felts     two wall felts laid round the lattice behind travelling rolls, a roof felt climbing from the eaves
//             behind a rising hem, three girth ropes that whip round and bite
//   door      a painted frame with two leaves that open outward
//   beam      the oblique cylinder of sunlight through the roof ring, as a hard-edged additive volume (works with the
//             eye inside it) and as a lit oval in every material of the family (GER_GLSL, gerMaterial). opts.beamDir
//             lets it fall more steeply than the sun stands outside, so that its oval lies on the bed
// The world shares this module's light: hero.light (uniforms), GER_GLSL and gerMaterial() give every piece of
// furniture the same sun, felt glow, beam oval and fog, eased from open sky to felt-lit as the shell closes.
// update(dt, time, camera, u): u is optional; without it (the set-piece viewer) the raising plays on a 40 s loop.
// anchors: crown, ring, door, threshold, portalSeat, hitchPosts, beamFoot. timeline: the u of every scripted beat.
import * as THREE from 'three';

export const GER = { R: 30, WALL_H: 16, RING_Y: 24, RING_R: 6, POLES: 81, POLE_LEN: 25.4, DOOR_W: 7.3, DOOR_Z: 29.6, GATE_Z: 116, POST_X: 6.3, POST_S: 0.74 };
const R = GER.R, WALL_H = GER.WALL_H, RING_Y = GER.RING_Y, NP = GER.POLES;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------- shared light
export const GER_GLSL = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol, uFeltWarm, uFeltCool, uFogCol, uBeamDir, uBeamFoot, uLampCol, uLampC;
uniform vec4 uLamp[7];
uniform float uWallC, uRoofC, uFogDen, uTime, uCloudAmt, uCloudSpd, uSunGate, uBeamOn, uBeamK, uFeltT;
float gHash(vec2 p){ p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
float gNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(gHash(i), gHash(i + vec2(1., 0.)), f.x), mix(gHash(i + vec2(0., 1.)), gHash(i + vec2(1., 1.)), f.x), f.y); }
float gFbm(vec2 p){ return gNoise(p) * .55 + gNoise(p * 2.13 + 7.1) * .3 + gNoise(p * 4.7 + 3.3) * .15; }
float gerCloud(vec2 xz){ float n = gFbm(xz * .0032 + uTime * uCloudSpd * vec2(.011, .004)); return 1. - uCloudAmt * smoothstep(.46, .7, n); }
// the beam: the roof ring carried down the beam's own direction (a little steeper than the sun stands outside, so that
// it lands on the bed and not high on the wall); a soft penumbra, so that its oval has a glowing rim
float gerBeam(vec3 P){ float t = (24.2 - P.y) / max(uBeamDir.y, .05); vec2 q = P.xz + uBeamDir.xz * t;
  return smoothstep(6.25, 4.7, length(q)) * step(P.y, 24.2); }
float gerInside(vec3 P){ return smoothstep(31.6, 30.7, length(P.xz)); }
// the butter lamps: seven small warm pools (xyz the flame, w its flicker) and the soft glow of the whole row
vec3 gerLamps(vec3 N, vec3 P){
  vec3 dc = uLampC - P; float c2 = dot(dc, dc), s = 0.;
  if (c2 > 520.) return vec3(0.);
  for (int i = 0; i < 7; i++) {
    vec3 d = uLamp[i].xyz - P; float d2 = dot(d, d), q = d2 * .36;
    s += uLamp[i].w * (.25 + .75 * max(dot(N, d * inversesqrt(d2 + .01)), 0.)) / (1. + q * q);
  }
  s += .5 * (.35 + .65 * max(dot(N, dc * inversesqrt(c2 + .01)), 0.)) / (1. + c2 * c2 * .0011);
  return uLampCol * (s * (1. - smoothstep(380., 520., c2)));
}
// Outdoors: sun and sky. Indoors, as the felts close: the glow of the felt (warm and strong from the sun's side and the
// roof, cool and softer from the far side, so every object has a lit and a shaded face but none stands in the dark: the
// room is a white shell and its light goes round), the one beam, the warm light thrown back by the beam's oval, and
// the butter lamps.
vec3 gerAmb(vec3 N, vec3 P, float ins){
  vec2 h = normalize(uSunDir.xz + vec2(1e-5, 0.));
  float clo = ins * (.45 * uWallC + .55 * uRoofC);
  vec3 hemi = mix(uGndCol, uSkyCol, N.y * .5 + .5);
  float w = clamp(.5 + .5 * dot(N.xz, h) + .24 * N.y, 0., 1.); w = w * w * (3. - 2. * w);
  float bb = clamp(dot(P.xz, h) / 30., -1., 1.);                         // nearer the sun's wall: more of its warm light, a little less of the far wall's cool
  vec3 felt = mix(uFeltCool * (.94 - .16 * bb), uFeltWarm * (.8 + .3 * bb), w);
  return mix(hemi, felt, clo);
}
vec3 gerDirect(vec3 N, vec3 P, float ao, float ins){
  vec2 h = normalize(uSunDir.xz + vec2(1e-5, 0.));
  float b = dot(P.xz, h), disc = max(b * b - dot(P.xz, P.xz) + 900., 0.);
  float hW = P.y + (sqrt(disc) - b) * uSunDir.y / max(length(uSunDir.xz), .05);
  float wallSh = smoothstep(17., 15., hW) * uWallC;
  float roofIn = ins * uRoofC;
  float vis = mix(1., mix(1. - wallSh, gerBeam(P), uRoofC), ins);
  float cl = mix(gerCloud(P.xz), gerCloud(vec2(0.)), ins);
  float ndl = mix(max(dot(N, uSunDir), 0.), max(dot(N, uBeamDir), 0.) * uBeamK, roofIn);
  vec3 tf = uBeamFoot - P; float d2 = dot(tf, tf);
  float bnc = uBeamOn * ins * (.3 + .7 * max(dot(N, tf * inversesqrt(d2 + .01)), 0.)) / (1. + d2 / 110.);
  // indoors the sun reaches things only as the beam: gold, and held low enough that its oval keeps its colour
  vec3 key = uSunCol * mix(vec3(1.), vec3(.74, .58, .37), roofIn);
  return key * (ndl * vis * cl * uSunGate) + uSunCol * vec3(.2, .14, .075) * (bnc * cl * ao) + gerLamps(N, P);
}
vec3 gerLightIn(vec3 alb, vec3 N, vec3 P, float ao, float ins){
  return alb * (gerAmb(N, P, ins) * ao + gerDirect(N, P, ao, ins));
}
vec3 gerLight(vec3 alb, vec3 N, vec3 P, float ao){ return gerLightIn(alb, N, P, ao, gerInside(P)); }
vec3 gerFog(vec3 c, float d){ return mix(uFogCol, max(c, vec3(0.)), exp(-max(d, 0.) * uFogDen)); }      // max: multisampling can extrapolate the depth below zero on an edge-on triangle
`;

export function makeGerLight() {
  const V3 = (x, y, z) => ({ value: new THREE.Vector3(x, y, z) }), F = (v) => ({ value: v });
  return {
    uSunDir: V3(-0.9135, 0.4067, 0), uSunCol: V3(3.2, 2.3, 1.2), uSkyCol: V3(0.5, 0.62, 0.9), uGndCol: V3(0.4, 0.33, 0.2),
    uFeltWarm: V3(0.86, 0.72, 0.5), uFeltCool: V3(0.6, 0.6, 0.68), uFogCol: V3(0.8, 0.7, 0.5),
    uLampCol: V3(1.5, 0.74, 0.22), uLampC: V3(0, -500, 0), uLamp: { value: Array.from({ length: 7 }, () => new THREE.Vector4(0, -500, 0, 0)) },
    uBeamDir: V3(-0.8192, 0.5736, 0), uBeamFoot: V3(29, 4, 0), uBeamOn: F(0), uBeamK: F(1.2), uFeltT: F(1),
    uWallC: F(0), uRoofC: F(0), uFogDen: F(0.0006), uTime: F(0), uCloudAmt: F(0.5), uCloudSpd: F(1), uSunGate: F(1),
  };
}

const STD_VERT = /* glsl */`
varying vec3 vW, vN, vC, vL, vNl; varying vec2 vUv; varying float vD;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
  vL = position; vNl = normal;                                    // the paint and the planks belong to the piece: they travel with it
  vC = color; vUv = uv; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv;
}`;
const STD_FRAG = /* glsl */`
uniform sampler2D uMap; uniform float uGrain, uGloss;
varying vec3 vW, vN, vC, vL, vNl; varying vec2 vUv; varying float vD;
${GER_GLSL}
void main(){
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 alb = vC * texture2D(uMap, vUv).rgb;
  float em = step(1.6, max(vC.r, max(vC.g, vC.b)));
  float pnt = step(.126, vUv.y);                                   // painted ornament from the atlas
  float soft = step(.06, vUv.x) * (1. - pnt);                      // cloth, hide, fur, iron, brass, clay: no planks
  float wood = (1. - soft) * (1. - em);
  // breakup: long grain along the dominant axis, soft blotches, fine speckle, so nothing is a flat CAD colour up close
  vec3 q = vL * uGrain; vec3 an = abs(vNl);
  vec2 g2 = an.y > .6 ? q.xz : (an.x > an.z ? q.zy : q.xy);
  float grain = gNoise(g2 * vec2(1.3, 9.)) * .6 + gNoise(g2 * vec2(7., 2.3) + 5.) * .4;
  float blot = gFbm(g2 * .35 + 11.), fine = gNoise(g2 * 23.);
  // planks: every board its own tone (some redder, some sun-bleached), a dark joint between two boards
  float bw = 1.3, bi = floor(g2.y / bw), bh = gHash(vec2(bi, floor(g2.x / 12. + bi * .37) + 3.));
  float sd = abs(fract(g2.y / bw) - .5) * bw, joint = smoothstep(bw * .5 - .06, bw * .5 - .012, sd);
  alb *= mix(1., .78 + .4 * bh, wood * (1. - .5 * pnt));
  alb = mix(alb, alb * vec3(1.1, .93, .8), wood * (1. - pnt) * smoothstep(.55, .8, bh) * .7);
  alb = mix(alb, alb * vec3(.93, 1., 1.08) + .02, wood * (1. - pnt) * smoothstep(.3, .1, bh) * .5);
  alb *= 1. - wood * joint * mix(.55, .25, pnt);
  alb *= mix(1., (.74 + .3 * grain) * (.84 + .28 * blot) * (.92 + .16 * fine), 1. - em);
  // wear: old paint rubbed thin in patches (darker wood shows through), and dirt gathered low down
  float rub = smoothstep(.56, .84, gFbm(g2 * .9 + 3.) * .72 + .28 * grain);
  alb = mix(alb, alb * vec3(.56, .46, .4), wood * .5 * rub);
  alb = mix(alb, alb * vec3(.5, .42, .36), (1. - em) * .5 * smoothstep(.62, .9, gFbm(g2 * 1.7 + 3.)) * smoothstep(7., 0., vW.y));
  float gi = gerInside(vW), clo = gi * (.45 * uWallC + .55 * uRoofC);
  // things stand in their own shade: the nearer the floor, the less of the room's glow reaches them
  float ao = mix(1., .34 + .66 * smoothstep(0., 5.5, vW.y), clo) * mix(1., .72, (1. - clo) * (1. - smoothstep(0., 3., vW.y)));
  vec3 c = gerLightIn(alb, N, vW, ao, gi);
  // lacquer: painted wood, brass and iron catch the glowing wall (indoors) or the sun (outdoors): a broad soft sheen
  // and a small hard highlight, both dulled where the paint is rubbed
  vec3 V = normalize(cameraPosition - vW); float fr = 1. - max(dot(N, V), 0.); fr *= fr;
  c += alb * fr * .2 * mix(uSkyCol, uFeltWarm, gi * uRoofC);
  vec2 h = normalize(uSunDir.xz + vec2(1e-5, 0.));
  vec3 Lg = normalize(mix(uSunDir, vec3(h.x, .45, h.y), gi * uRoofC));
  float rv = max(dot(reflect(-V, N), Lg), 0.), rv2 = rv * rv, rv8 = rv2 * rv2 * rv2 * rv2;
  float sp = (rv8 * rv2 * .7 + rv8 * rv8 * rv8 * rv8 * rv8 * 1.1) * uGloss * (1. - .6 * rub * wood) * (1. - .5 * soft);
  c += (alb * .55 + .1) * mix(uSunCol * .5 * (1. - uWallC * gi), uFeltWarm * 1.5, gi * uRoofC) * sp * mix(1., ao, .6);
  c = mix(c, vC * .5, em);
  gl_FragColor = vec4(gerFog(c, vD), 1.);
}`;

// One family of materials: vertex colour x atlas, lit by the shared uniforms.
export function gerMaterial(light, map, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...light, uMap: { value: map }, uGrain: { value: o.grain ?? 1 }, uGloss: { value: o.gloss ?? 0.42 } },
    vertexShader: STD_VERT, fragmentShader: STD_FRAG, vertexColors: true, side: o.side ?? THREE.FrontSide,
  });
}

// ---------------------------------------------------------------- geometry helpers
const _c = new THREE.Color(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _n3 = new THREE.Matrix3(), _v = new THREE.Vector3();
export const WHITE_UV = [0.03, 0.04], SOFT_UV = [0.09, 0.04];           // two white texels: planked wood, and everything else
// Merges parts into one BufferGeometry with position, normal, color and uv (atlas). add(geo, { p, r, s, c, uv:[u0,v0,u1,v1],
// grad:[y0,y1,k0,k1] (brightness by local height), keep:true (multiply the part's own colours), m:1 (not wood: cloth, hide,
// metal, clay: no planks or joints are drawn on it) }). A part with a 'shade' attribute (cbox) has its edges darkened.
export function makeGB() {
  const P = [], N = [], C = [], U = [], I = []; let n = 0, ni = 0;       // one typed block per added part, joined at the end
  const join = (A, T, len) => { const out = new T(len); let o = 0; for (const a of A) { out.set(a, o); o += a.length; } return out; };
  const gb = {
    add(geo, o = {}) {
      const pos = geo.attributes.position, nor = geo.attributes.normal, col = geo.attributes.color, uv = geo.attributes.uv, idx = geo.index, sh = geo.attributes.shade, wuv = o.m ? SOFT_UV : WHITE_UV;
      const p = o.p || [0, 0, 0], r = o.r || [0, 0, 0], s = o.s == null ? [1, 1, 1] : (typeof o.s === 'number' ? [o.s, o.s, o.s] : o.s);
      _m.compose(_p.set(p[0], p[1], p[2]), _q.setFromEuler(_e.set(r[0], r[1], r[2])), _s.set(s[0], s[1], s[2])); _n3.getNormalMatrix(_m);
      if (Array.isArray(o.c)) _c.setRGB(o.c[0], o.c[1], o.c[2]); else _c.set(o.c ?? '#ffffff');
      const cr = _c.r, cg = _c.g, cb = _c.b, g = o.grad, ur = o.uv, k = o.gain ?? 1, cnt = pos.count;
      const pa = pos.array, na = nor.array, ca = col && o.keep ? col.array : null, cs = col ? col.itemSize : 3, ua = uv ? uv.array : null, sa = sh ? sh.array : null;
      const e = _m.elements, q = _n3.elements, gk = g ? 1 / (g[1] - g[0]) : 0;
      const Pn = new Float32Array(cnt * 3), Nn = new Float32Array(cnt * 3), Cn = new Float32Array(cnt * 3), Un = new Float32Array(cnt * 2);
      for (let i = 0, j = 0; i < cnt; i++, j += 3) {
        const x = pa[j], ly = pa[j + 1], z = pa[j + 2], a = na[j], b = na[j + 1], c = na[j + 2];
        Pn[j] = e[0] * x + e[4] * ly + e[8] * z + e[12]; Pn[j + 1] = e[1] * x + e[5] * ly + e[9] * z + e[13]; Pn[j + 2] = e[2] * x + e[6] * ly + e[10] * z + e[14];
        const nx = q[0] * a + q[3] * b + q[6] * c, ny = q[1] * a + q[4] * b + q[7] * c, nz = q[2] * a + q[5] * b + q[8] * c, il = 1 / (Math.sqrt(nx * nx + ny * ny + nz * nz) || 1);
        Nn[j] = nx * il; Nn[j + 1] = ny * il; Nn[j + 2] = nz * il;
        let f = k; if (g) { const t = (ly - g[0]) * gk; f *= g[2] + (g[3] - g[2]) * (t < 0 ? 0 : t > 1 ? 1 : t); } if (sa) f *= sa[i];
        if (ca) { const m = i * cs; Cn[j] = ca[m] * cr * f; Cn[j + 1] = ca[m + 1] * cg * f; Cn[j + 2] = ca[m + 2] * cb * f; } else { Cn[j] = cr * f; Cn[j + 1] = cg * f; Cn[j + 2] = cb * f; }
        const m2 = i * 2;
        if (ur && ua) { Un[m2] = ur[0] + (ur[2] - ur[0]) * ua[m2]; Un[m2 + 1] = ur[1] + (ur[3] - ur[1]) * ua[m2 + 1]; } else if (o.keep && ua) { Un[m2] = ua[m2]; Un[m2 + 1] = ua[m2 + 1]; } else { Un[m2] = wuv[0]; Un[m2 + 1] = wuv[1]; }
      }
      let In;
      if (idx) { const ia = idx.array, m = ia.length; In = new Uint32Array(m); for (let i = 0; i < m; i++) In[i] = ia[i] + n; } else { In = new Uint32Array(cnt); for (let i = 0; i < cnt; i++) In[i] = i + n; }
      P.push(Pn); N.push(Nn); C.push(Cn); U.push(Un); I.push(In);
      n += cnt; ni += In.length; geo.dispose();
      return gb;
    },
    get triangles() { return ni / 3; },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(join(P, Float32Array, n * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(join(N, Float32Array, n * 3), 3));
      g.setAttribute('color', new THREE.BufferAttribute(join(C, Float32Array, n * 3), 3)); g.setAttribute('uv', new THREE.BufferAttribute(join(U, Float32Array, n * 2), 2));
      g.setIndex(new THREE.BufferAttribute(join(I, Uint32Array, ni), 1)); g.computeBoundingSphere();
      return g;
    },
    async buildAsync(pause) {                                  // the same geometry, made in short steps
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(join(P, Float32Array, n * 3), 3)); await pause();
      g.setAttribute('normal', new THREE.BufferAttribute(join(N, Float32Array, n * 3), 3)); await pause();
      g.setAttribute('color', new THREE.BufferAttribute(join(C, Float32Array, n * 3), 3)); g.setAttribute('uv', new THREE.BufferAttribute(join(U, Float32Array, n * 2), 2)); await pause();
      g.setIndex(new THREE.BufferAttribute(join(I, Uint32Array, ni), 1)); await pause();
      g.computeBoundingSphere(); await pause();
      return g;
    },
  };
  return gb;
}
// chamfered box: every face keeps a raised field and its border ring drops by b, so edges catch the light
export function cbox(w, h, d, b = 0.12) {
  const g = new THREE.BoxGeometry(w, h, d, 3, 3, 3).toNonIndexed(), pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
  const H = [w / 2, h / 2, d / 2], a = [0, 0, 0], shade = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    a[0] = pos.getX(i); a[1] = pos.getY(i); a[2] = pos.getZ(i);
    const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i)), ax = nx > 0.5 ? 0 : ny > 0.5 ? 1 : 2;
    let edge = false;
    for (let k = 0; k < 3; k++) {
      if (k === ax) continue;
      const bb = Math.min(b, H[k] * 0.45), t = a[k] / H[k];                      // grid lines sit at -1, -1/3, 1/3, 1
      if (Math.abs(t) > 0.9) edge = true; else a[k] = Math.sign(t) * (H[k] - bb);
    }
    if (edge) a[ax] -= Math.sign(a[ax]) * Math.min(b, H[ax] * 0.45);
    pos.setXYZ(i, a[0], a[1], a[2]); shade[i] = edge ? 0.5 : 1;                 // handled, grimy edges: the paint is darker and worn there
  }
  g.setAttribute('shade', new THREE.BufferAttribute(shade, 1));
  // uv: stretch the raised field over the whole 0..1 square so a painted panel fills the face
  for (let i = 0; i < uv.count; i++) { const f = (t) => (t < 0.2 ? 0 : t > 0.8 ? 1 : (t - 1 / 3) * 3); uv.setXY(i, Math.min(1, Math.max(0, f(uv.getX(i)))), Math.min(1, Math.max(0, f(uv.getY(i))))); }
  g.computeVertexNormals();
  return g;
}
export const cyl = (rt, rb, h, seg = 10, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
export const lathe = (prof, seg = 12) => new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p[0], p[1])), seg);

// ---------------------------------------------------------------- painted ornament atlas (offscreen canvas)
export const ATLAS = { medallion: [0, 0.5, 0.5, 1], door: [0.5, 0.5, 1, 1], band: [0, 0.375, 1, 0.5], quilt: [0, 0.125, 0.5, 0.375], lid: [0.5, 0.125, 1, 0.375] };
export function makeAtlas(pal) {
  const S = 1024, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d'), { wood, woodDark, blue, green, white, gold, red } = pal;
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, S, S);
  const stroke = (col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); };
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  // a woven 3 x 3 endless knot inside a turned square, with an outline so the strands read as over and under
  const knot = (cx, cy, r, colA, colB) => {
    g.save(); g.translate(cx, cy); g.rotate(Math.PI / 4);
    const s = r * 0.42, w = r * 0.13;
    for (let pass = 0; pass < 2; pass++) for (let i = -1; i <= 1; i++) for (let k = 0; k < 2; k++) {
      g.beginPath();
      if (k === 0) { g.moveTo(-r * 0.92, i * s); g.lineTo(r * 0.92, i * s); } else { g.moveTo(i * s, -r * 0.92); g.lineTo(i * s, r * 0.92); }
      stroke(pass === 0 ? woodDark : (k === 0 ? colA : colB), pass === 0 ? w * 1.7 : w);
    }
    for (let k = 0; k < 4; k++) {                          // loops joining the strand ends in pairs
      g.rotate(Math.PI / 2);
      for (const i of [-0.5, 0.5]) { g.beginPath(); g.arc(i * s, -r * 0.92, s / 2, Math.PI, 0); stroke(woodDark, w * 1.7); g.beginPath(); g.arc(i * s, -r * 0.92, s / 2, Math.PI, 0); stroke(k % 2 ? colA : colB, w); }
    }
    g.restore();
  };
  const corner = (x, y, sx, sy, col) => {                   // cloud-scroll corner piece
    g.save(); g.translate(x, y); g.scale(sx, sy);
    g.beginPath(); g.moveTo(0, 70); g.bezierCurveTo(0, 20, 20, 0, 70, 0); stroke(col, 9);
    g.beginPath(); g.arc(34, 34, 16, 0.6, 5.4); stroke(col, 7);
    g.beginPath(); g.arc(66, 20, 9, 1.2, 6.4); stroke(col, 5); g.beginPath(); g.arc(20, 66, 9, 0, 5.2); stroke(col, 5);
    g.restore();
  };
  const panel = (x0, y0, w, h, kind) => {
    g.fillStyle = wood; g.fillRect(x0, y0, w, h);
    const gr = g.createRadialGradient(x0 + w / 2, y0 + h / 2, w * 0.1, x0 + w / 2, y0 + h / 2, w * 0.75);
    gr.addColorStop(0, 'rgba(255,200,120,0.22)'); gr.addColorStop(1, 'rgba(60,10,0,0.28)'); g.fillStyle = gr; g.fillRect(x0, y0, w, h);
    rr(x0 + 14, y0 + 14, w - 28, h - 28, 10); stroke(blue, 16);
    rr(x0 + 29, y0 + 29, w - 58, h - 58, 8); stroke(white, 3);
    rr(x0 + 40, y0 + 40, w - 80, h - 80, 8); stroke(green, 4);
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) corner(x0 + w / 2 - sx * (w / 2 - 62), y0 + h / 2 - sy * (h / 2 - 62), sx, sy, gold);
    const cx = x0 + w / 2, cy = y0 + h / 2;
    if (kind === 0) {
      g.beginPath(); g.arc(cx, cy, w * 0.3, 0, 6.2832); g.fillStyle = blue; g.fill(); stroke(gold, 10);
      g.beginPath(); g.arc(cx, cy, w * 0.255, 0, 6.2832); stroke(white, 4);
      knot(cx, cy, w * 0.15, gold, green);
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.beginPath(); g.arc(cx + Math.cos(a) * w * 0.345, cy + Math.sin(a) * w * 0.345, 9, 0, 6.2832); g.fillStyle = i % 2 ? gold : white; g.fill(); }
    } else if (kind === 1) {
      for (const dy of [-0.2, 0.2]) {
        g.save(); g.translate(cx, cy + dy * h); g.rotate(Math.PI / 4); g.fillStyle = blue; g.fillRect(-w * 0.14, -w * 0.14, w * 0.28, w * 0.28);
        g.beginPath(); g.rect(-w * 0.14, -w * 0.14, w * 0.28, w * 0.28); stroke(gold, 8); g.restore();
        knot(cx, cy + dy * h, w * 0.085, gold, white);
      }
      g.beginPath(); g.moveTo(x0 + 60, cy); g.lineTo(x0 + w - 60, cy); stroke(gold, 7);
      g.beginPath(); g.arc(cx, cy, 20, 0, 6.2832); g.fillStyle = red; g.fill(); stroke(gold, 5);
    } else {
      rr(x0 + 70, y0 + 60, w - 140, h - 120, 30); stroke(gold, 6);
      knot(cx, cy, h * 0.2, blue, green);
    }
  };
  panel(0, 0, 512, 512, 0); panel(512, 0, 512, 512, 1); panel(512, 640, 512, 256, 2);
  // meander band between ruled stripes, tiles in x
  g.fillStyle = wood; g.fillRect(0, 512, S, 128);
  g.fillStyle = blue; g.fillRect(0, 512, S, 18); g.fillRect(0, 622, S, 18);
  g.fillStyle = white; g.fillRect(0, 530, S, 4); g.fillRect(0, 618, S, 4);
  g.fillStyle = green; g.fillRect(0, 536, S, 4); g.fillRect(0, 612, S, 4);
  for (let i = 0; i < 16; i++) {
    const x = i * 64, y = 552; g.beginPath();
    g.moveTo(x, y + 48); g.lineTo(x, y); g.lineTo(x + 48, y); g.lineTo(x + 48, y + 34); g.lineTo(x + 16, y + 34); g.lineTo(x + 16, y + 17); g.lineTo(x + 32, y + 17);
    g.moveTo(x, y + 48); g.lineTo(x + 64, y + 48);
    stroke(gold, 6);
  }
  // quilt: broad stripes with stitched lines
  const qc = [white, wood, white, gold, red, white, blue, white, wood, gold, white, red];
  for (let i = 0; i < 12; i++) { g.fillStyle = qc[i]; g.fillRect(i * 512 / 12, 640, 512 / 12 + 1, 256); }
  g.fillStyle = 'rgba(70,40,20,0.18)'; g.fillRect(0, 640, 512, 256);
  g.fillStyle = 'rgba(40,20,10,0.3)'; for (let i = 1; i < 12; i++) g.fillRect(i * 512 / 12 - 1, 640, 2, 256);
  g.fillStyle = 'rgba(40,20,10,0.35)'; for (let j = 0; j < 9; j++) for (let i = 0; i < 64; i++) g.fillRect(i * 8 + (j % 2) * 4, 652 + j * 29, 4, 2);
  g.fillStyle = '#ffffff'; g.fillRect(0, 896, S, 128);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping; tex.anisotropy = 4; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

// ---------------------------------------------------------------- lattice: willow rods that scissor, wrapped on the wall circle
const LAT = { ARC0: 7.8, S0: 1.087, NJE: 28, NJW: 25, LEN: 20.3, SIN: 0.6157, FOLD: 0.1, XTR: 6 };
LAT.ENDE = LAT.ARC0 + 3 * LAT.NJE * LAT.S0; LAT.ENDW = LAT.ARC0 + 3 * LAT.NJW * LAT.S0;
const VARY = /* glsl */`varying vec3 vW, vN; varying vec3 vT; varying float vD;`;
async function latticeMesh(light, pause) {
  const SEG = 6, SIDES = 5, P = [], A = [], I = []; let n = 0;
  // the laths of a section all have one length, so its last 6 m would carry only one family above and the other below:
  // six more laths each way at the jamb end and at the far end (cut off at the end post, like the short laths of a real
  // khana) complete the diamonds there. fam 0 is the end post itself: an upright that travels with the section's end.
  const laths = [];
  for (const side of [1, -1]) {
    const nj = side > 0 ? LAT.NJE : LAT.NJW;
    for (let sec = 0; sec < 3; sec++) for (let j = sec === 0 ? -LAT.XTR : 0, j1 = sec === 2 ? nj + LAT.XTR : nj; j < j1; j++) for (const fam of [1, -1]) laths.push([side, sec, j, fam]);
    laths.push([side, 0, -100, 0], [side, 2, 100, 0]);
  }
  let li = 0;
  for (const [side, sec, j, fam] of laths) {
    if ((++li & 63) === 0) await pause();
    for (let k = 0; k <= SEG; k++) for (let s = 0; s < SIDES; s++) { const a = s / SIDES * 6.2832; P.push(Math.cos(a), k / SEG, Math.sin(a)); A.push(side, sec, j, fam); }
    for (let k = 0; k < SEG; k++) for (let s = 0; s < SIDES; s++) { const a = n + k * SIDES + s, b = n + k * SIDES + (s + 1) % SIDES; I.push(a, a + SIDES, b, b, a + SIDES, b + SIDES); }
    n += (SEG + 1) * SIDES;
  }
  // the inner girth band: a woven wool belt tied round the lattice at the wall head, a strip of quads that opens with each
  // section (fam 2; position.y 0 its lower edge, 1 its upper)
  for (const side of [1, -1]) {
    const nj = side > 0 ? LAT.NJE : LAT.NJW;
    for (let sec = 0; sec < 3; sec++) for (let q = 0; q < nj; q++) {
      P.push(0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0); A.push(side, sec, q, 2, side, sec, q, 2, side, sec, q + 1, 2, side, sec, q + 1, 2);
      I.push(n, n + 2, n + 1, n + 1, n + 2, n + 3); n += 4;
    }
  }
  await pause();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aL', new THREE.Float32BufferAttribute(A, 4)); await pause(); g.setIndex(I);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 10, 0), 40);
  const uniforms = { ...light, uOpenE: { value: new THREE.Vector3(0.1, 0.1, 0.1) }, uOpenW: { value: new THREE.Vector3(0.1, 0.1, 0.1) }, uWood: { value: new THREE.Color('#b99a68') } };
  const mat = new THREE.ShaderMaterial({ uniforms, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec4 aL; uniform vec3 uOpenE, uOpenW; ${VARY}
void main(){
  float side = aL.x, sec = aL.y, j = aL.z, fam = aL.w;
  vec3 op = side > 0. ? uOpenE : uOpenW; float nj = side > 0. ? ${LAT.NJE}. : ${LAT.NJW}.;
  float f = sec < .5 ? op.x : (sec < 1.5 ? op.y : op.z);
  float prev = (sec > .5 ? op.x : 0.) + (sec > 1.5 ? op.y : 0.);
  float s0 = ${LAT.ARC0} + (prev * nj + (j + .5) * f) * ${LAT.S0};
  float sinT = ${LAT.SIN} * f, cosT = sqrt(1. - sinT * sinT);
  float t = (position.y - .5) * ${LAT.LEN};
  float lim = ${LAT.ARC0} + (op.x + op.y + op.z) * nj * ${LAT.S0};          // where this side ends now (it grows as the sections open)
  float post = 1. - abs(fam), famS = fam + post;
  float arc = s0 + fam * t * sinT, arcC = clamp(arc, ${LAT.ARC0}, lim);
  t += (arcC - arc) / (famS * max(sinT, .02));
  if (post > .5) { arcC = j < 0. ? ${LAT.ARC0} - .16 : lim + .16; t = (position.y - .5) * ${LAT.LEN} * 1.03; sinT = 0.; }
  float y = (t + ${(LAT.LEN / 2).toFixed(2)}) * cosT, ang = side * arcC / 30.;
  vec3 rad = vec3(sin(ang), 0., cos(ang)), tn = vec3(cos(ang), 0., -sin(ang)) * side;
  vec3 wid = tn * mix(cosT, 1., post) - vec3(0., fam * sinT, 0.);
  vec3 nn = wid * position.x + rad * position.z;
  vec3 P = rad * (30. + fam * .15 - post * .12) + vec3(0., max(y, 0.), 0.) + (wid * (position.x * 1.25) + rad * position.z) * (.085 + .1 * post);
  vW = P; vN = normalize(nn + vec3(0., 1e-4, 0.)); vT = vec3(t, j + sec * 31. + fam * 7., side * (1. + post));
  if (fam > 1.5) {
    // the belt lies inside the laths at the wall head; it is drawn out from the line of the heads, up and down, as its
    // section comes fully open, and its weave is laid by the cloth's own length, so it travels with the laths
    float sb = ${LAT.ARC0} + (prev * nj + j * f) * ${LAT.S0}, top = ${LAT.LEN} * cosT, tight = smoothstep(.9, 1., f);
    float ab = side * sb / 30.;
    vec3 rb = vec3(sin(ab), 0., cos(ab));
    P = rb * 29.6 + vec3(0., top + (0.5 - (1. - position.y) * 1.2) * tight, 0.);
    vW = P; vN = -rb; vT = vec3(${LAT.ARC0} + (sec * nj + j) * ${LAT.S0}, position.y, side * 3.);
  }
  vec4 mv = viewMatrix * vec4(P, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: /* glsl */`
uniform vec3 uWood; ${VARY}
${GER_GLSL}
void main(){
  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW); if (dot(N, V) < 0.) N = -N;
  float h = gHash(vec2(vT.y, vT.z * 3.1));
  vec3 alb = uWood * (.72 + .5 * h) * (.85 + .3 * gNoise(vec2(vT.x * 5., vT.y)));
  float tie = abs(fract(vT.x / .883 + .5) - .5) * .883;                  // hide ties at every crossing
  alb = mix(vec3(.2, .12, .07), alb, smoothstep(.07, .13, tie));
  // the end posts: a stouter, darker upright, bound to its neighbour with wide bands of hide
  float post = step(1.5, abs(vT.z));
  alb = mix(alb, uWood * vec3(.6, .5, .42) * (.8 + .4 * gNoise(vec2(vT.x * 3., 1.))), post);
  alb = mix(alb, vec3(.5, .4, .28) * (.7 + .3 * step(.5, fract(vT.x * 9.))), post * smoothstep(.42, .34, abs(fract(vT.x / 2.65) - .5) * 2.65));
  // the inner girth band: red wool with a run of lozenges, cream outlines, blue hearts, blue and cream selvedges. The run
  // has 99 lozenges to the whole round (the two sides' arcs together, 188.43 m), so it is unbroken where the sides meet
  float belt = step(2.5, abs(vT.z));
  if (belt > .5) {
    float s = vT.x, v = vT.y, m = abs(fract(s / 1.9034) - .5) * 2., z = abs(v - .5) * 2., d = z * .62 + m;
    vec3 col = vec3(.5, .09, .07);
    col = mix(col, vec3(.82, .74, .58), smoothstep(.08, .03, abs(d - .62)));
    col = mix(col, vec3(.09, .13, .4), smoothstep(.36, .3, d));
    col = mix(col, vec3(.72, .5, .16), smoothstep(.13, .09, d));
    col = mix(col, vec3(.09, .13, .4), step(.78, z));
    col = mix(col, vec3(.82, .74, .58), step(.78, z) * step(z, .86));
    alb = col * (.82 + .18 * gNoise(vec2(s * 37., v * 23.))) * (.92 + .08 * step(.5, fract(v * 19.)));
  }
  // indoors the laths stand against the glowing felt: a net of dark diamonds
  gl_FragColor = vec4(gerFog(gerLight(alb, N, vW, mix(1., mix(.5, .8, belt), .45 * uWallC + .55 * uRoofC)), vD), 1.);
}` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'lattice';
  return { mesh, uniforms, triangles: I.length / 3 };
}

// ---------------------------------------------------------------- poles: hinged at the wall head, swung over into the crown
const POLE = { RH: 30.25, PSI1: Math.PI - 0.3217, DU: 0.03 };
function poleMesh(light, seat, pal) {
  const RINGS = [0, 0.03, 0.14, 0.38, 0.62, 0.86, 0.97, 1], SIDES = 7, P = [], A = [], I = []; let n = 0;
  for (let i = 0; i < NP; i++) {
    let a = (i + 0.5) / NP * 6.2832; if (a > Math.PI) a -= 6.2832;                 // bearing from south, east positive
    const arc = Math.max(0, Math.abs(a) * R - LAT.ARC0);
    for (let k = 0; k < RINGS.length; k++) for (let s = 0; s < SIDES; s++) { const b = s / SIDES * 6.2832; P.push(Math.cos(b), RINGS[k], Math.sin(b)); A.push(a, seat[i], arc, a >= 0 ? 1 : -1); }
    for (let k = 0; k < RINGS.length - 1; k++) for (let s = 0; s < SIDES; s++) { const p = n + k * SIDES + s, q = n + k * SIDES + (s + 1) % SIDES; I.push(p, q, p + SIDES, q, q + SIDES, p + SIDES); }
    n += RINGS.length * SIDES;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aP', new THREE.Float32BufferAttribute(A, 4)); g.setIndex(I);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 10, 0), 70);
  const C = (h) => ({ value: new THREE.Color(h) });
  const uniforms = { ...light, uU: { value: 0 }, uReachE: { value: 0 }, uReachW: { value: 0 }, uWood: C(pal.wood), uBlue: C(pal.blue), uGreen: C(pal.green), uWhite: C(pal.white) };
  const mat = new THREE.ShaderMaterial({ uniforms,
    vertexShader: /* glsl */`
attribute vec4 aP; uniform float uU, uReachE, uReachW, uTime, uRoofC; ${VARY}
void main(){
  float a = aP.x, seat = aP.y, reach = aP.w > 0. ? uReachE : uReachW;
  float lift = smoothstep(aP.z + 2., aP.z + 8., reach);
  float hy = mix(.95, 16.35, lift);                                       // lying, they rest on the trodden grass
  float psi0 = -asin(clamp((hy - .95) / ${GER.POLE_LEN}, 0., .99));
  float tt = clamp((uU - seat + ${POLE.DU}) / ${POLE.DU}, 0., 1.);
  // up and over quickly from a short run-up, then a slow settle onto the crown that ends in a soft knock
  float w = tt * tt / (tt + .12 * (1. - tt)), q = 1. - w;
  float s = w * (1. + .75 * q * (1. + q));
  float psi = mix(psi0, ${POLE.PSI1.toFixed(4)}, s);
  float tau = max(uU - seat, 0.) * 90.;
  float shiver = step(seat, uU) * .5 * exp(-tau * 2.2) * sin(tau * 16.);
  float t = position.y, rr = mix(.3, .19, t);
  // seated poles thrum in the wind (they only ever sag inward, never up into the felt) until the roof felt weighs them down
  float loose = step(seat, uU) * (1. - .88 * uRoofC), gust = .55 + .45 * sin(uTime * .8 + a * 2.);
  float hum = loose * gust * .13 * (.5 + .5 * sin(uTime * (2.4 + 1.7 * fract(a * 7.31)) + a * 23.));
  float humT = loose * gust * .09 * sin(uTime * (2.0 + 1.3 * fract(a * 3.77)) + a * 41.);
  vec2 d = vec2(cos(psi), sin(psi)), nn = vec2(-d.y, d.x);
  vec2 pr = vec2(${POLE.RH}, hy) + d * (t * ${GER.POLE_LEN}) + nn * ((shiver + hum) * sin(3.1416 * t) + position.x * rr);
  vec3 rad = vec3(sin(a), 0., cos(a)), tn = vec3(cos(a), 0., -sin(a));
  vec3 P = rad * pr.x + vec3(0., pr.y, 0.) + tn * (position.z * rr + humT * sin(3.1416 * t));
  vW = P; vN = normalize((rad * nn.x + vec3(0., nn.y, 0.)) * position.x + tn * position.z); vT = vec3(t, a * 13., seat);
  vec4 mv = viewMatrix * vec4(P, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: /* glsl */`
uniform vec3 uWood, uBlue, uGreen, uWhite; ${VARY}
${GER_GLSL}
void main(){
  vec3 N = normalize(vN); float t = vT.x;
  // every pole its own paint: most orange, some rubbed back to red-brown, none of them quite the same
  float ph = gHash(vec2(vT.y, 2.));
  vec3 alb = uWood * vec3(.95, .87, .8) * (.8 + .32 * gNoise(vec2(t * 60., vT.y))) * (.86 + .22 * ph);
  alb = mix(alb, alb * vec3(.8, .56, .5), smoothstep(.62, .9, gHash(vec2(vT.y, 5.))) * .8);
  alb = mix(alb, alb * vec3(.7, .6, .56), .6 * smoothstep(.5, .85, gFbm(vec2(t * 5., vT.y * 1.7))));
  // painted bands at the foot and under the crown
  // painted cuffs at the foot and under the crown: ultramarine, edged with a thin ochre line; the rest is orange
  float e = t < .5 ? t : 1. - t, b = (e - .03) * 25.4;                    // metres into the cuff
  if (e > .03 && e < .086) {
    vec3 cuff = uBlue;
    float ed = min(b, 1.42 - b);
    cuff = mix(cuff, vec3(.6, .36, .1), smoothstep(.11, .08, abs(ed - .1)));          // a thin ochre line near each edge
    cuff = mix(cuff, uBlue * .55, smoothstep(.05, .03, abs(b - .71)));               // and a darker line round the middle
    alb = cuff * (.85 + .2 * gNoise(vec2(t * 200., vT.y)));
  }
  float ring = max(smoothstep(.004, .002, abs(t - .3)), smoothstep(.004, .002, abs(t - .7)));
  alb = mix(alb, vec3(.72, .46, .14), ring);
  // worn paint and soot toward the crown, where the smoke goes
  alb *= 1. - .22 * smoothstep(.55, .85, gFbm(vec2(t * 9., vT.y * 3.))) - .25 * uRoofC * smoothstep(.72, 1., t);
  alb *= .8 + .2 * smoothstep(-.6, .3, N.y);
  // under the roof the poles take the light thrown up from the rugs as well, so they stay orange against the felt
  float gi = gerInside(vW) * uRoofC;
  // under the felt the poles are orange only where the sun's side of the roof glows through onto them; round the far
  // half they fall to ox-blood and brown, each pole a little different, with a soft sheen along its length
  vec2 hs = normalize(uSunDir.xz + vec2(1e-5, 0.));
  float ss = dot(normalize(vW.xz + vec2(1e-4, 0.)), hs), lit = smoothstep(-.3, .8, ss + .35 * (gHash(vec2(vT.y, 7.)) - .5));
  vec3 ox = vec3(dot(alb, vec3(.5, .35, .15))) * vec3(.62, .2, .17);
  // a paint that is not red (the blue-green woodwork) has no ox-blood in it: its far half falls to a deep shade of its own colour
  ox = mix(ox, alb * .7, smoothstep(0., .1, max(uWood.g, uWood.b) - uWood.r));
  // (raised and not yet under felt they already do this: the fan is never one loud orange)
  float gs = max(gi, .8 * smoothstep(9., 16.5, vW.y) * gerInside(vW));
  // under the closed felt the far half stands in the white room's own light: a deep shade of its paint, never black against the felt
  vec3 deep = mix(ox, mix(ox, alb, .45), gi);
  alb = mix(alb, mix(deep, alb * vec3(.92, .8, .74), lit), gs);
  vec3 V = normalize(cameraPosition - vW);
  float sheen = pow(max(1. - abs(dot(N, V)), 0.), 2.5) * (.5 + .5 * gNoise(vec2(t * 30., vT.y)));
  vec3 c = gerLight(alb, N, vW, mix(1., mix(mix(.62, .85, gi), 1., lit), gs)) + alb * uFeltWarm * (gi * (.34 * lit * (1. - .5 * N.y) + .22 * sheen)) + alb * uFeltCool * (.2 * gi * (1. - lit)) + uFeltCool * (.05 * gi * sheen * (1. - lit));
  gl_FragColor = vec4(gerFog(c, vD), 1.);
}` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'poles';
  return { mesh, uniforms, triangles: I.length / 3 };
}

// ---------------------------------------------------------------- felts: laid, never faded in
const FELT_FRAG_HEAD = /* glsl */`
uniform vec3 uFelt; uniform float uRope; ${VARY}
${GER_GLSL}
// felt: pressed wool with thick and thin places, stray fibres, and rows of quilting stitches that pucker it
vec3 feltBody(float a, float b){
  float thick = gFbm(vec2(a, b) * .21), fib = gNoise(vec2(a * 2.3, b * 7.)), fine = gNoise(vec2(a * 13., b * 11.)) * .6 + gNoise(vec2(a * 31. + 5., b * 4.)) * .4;
  float qa = abs(fract((a + b) / 2.9) - .5) * 2.9, qb = abs(fract((a - b) / 2.9) - .5) * 2.9, qd = min(qa, qb);
  float stitch = smoothstep(.07, .03, qd) * step(.45, fract((a * .7 + b * .3) * 2.4));
  float pucker = smoothstep(0., .5, qd);
  return uFelt * (.8 + .2 * thick + .08 * fib + .08 * fine) * (.9 + .1 * pucker) * (1. - .24 * stitch);
}`;
function wallFelt(light, pal) {
  const NA = 84, NV = 12, A = [], I = [], P = []; let n = 0;
  const A0 = LAT.ARC0 / R - 0.012;
  for (const side of [1, -1]) {
    const a1 = (side > 0 ? LAT.ENDE : LAT.ENDW) / R + 0.02;
    for (let i = 0; i <= NA; i++) for (let j = 0; j <= NV; j++) { const a = lerp(A0, a1, i / NA); A.push(side, a, j / NV); P.push(Math.sin(side * a) * R, j / NV * 16.6, Math.cos(a) * R); }
    for (let i = 0; i < NA; i++) for (let j = 0; j < NV; j++) { const p = n + i * (NV + 1) + j, q = p + NV + 1; I.push(p, q, p + 1, p + 1, q, q + 1); }
    n += (NA + 1) * (NV + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aF', new THREE.Float32BufferAttribute(A, 3)); g.setIndex(I);
  const uniforms = { ...light, uFelt: { value: new THREE.Color(pal.felt) }, uRollE: { value: A0 }, uRollW: { value: A0 }, uRollR: { value: 1.7 }, uRope: { value: 0 }, uWind: { value: 1 } };
  const mat = new THREE.ShaderMaterial({ uniforms, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec3 aF; uniform float uRollE, uRollW, uRollR, uRope, uWind, uTime; ${VARY}
void main(){
  float side = aF.x, roll = side > 0. ? uRollE : uRollW;
  float a = min(aF.y, roll), y = aF.z * 16.6, laid = 1. - step(roll, aF.y);
  float rip = sin(a * 17. + y * .4 + uTime * 2.3) * sin(a * 5.3 - uTime * 1.1 + y * .13);
  float ropeOn = smoothstep(0., .15, uRope * 3.5 - a);
  float dr = min(abs(y - 4.15), min(abs(y - 8.3), abs(y - 12.45)));
  float rad = 30.46 + laid * (uWind * .17 * rip * sin(3.1416 * aF.z) * (1. - .6 * ropeOn) - .14 * ropeOn * (1. - smoothstep(0., .8, dr))) + (1. - laid) * uRollR;
  float ang = side * a;
  vec3 P = vec3(sin(ang) * rad, y, cos(ang) * rad);
  vW = P; vN = vec3(sin(ang), 0., cos(ang)); vT = vec3(a * 30., y, rip * laid);
  vec4 mv = viewMatrix * vec4(P, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: FELT_FRAG_HEAD + /* glsl */`
void main(){
  vec3 No = normalize(vN), V = normalize(cameraPosition - vW);
  float inside = step(dot(No, V), 0.), arc = vT.x, y = vT.y;
  vec3 alb = feltBody(arc, y);
  // overlapping seams laced with cord, sag folds under the wall head, dust and damp along the foot
  float seam = abs(fract(arc / 23.5 + .25) - .5) * 23.5;
  alb *= .7 + .3 * smoothstep(.04, .3, seam);
  alb *= 1. - .4 * smoothstep(.62, .5, seam) * smoothstep(.3, .4, seam) * step(.55, fract(y * 1.3));
  // soft folds: the felt hangs from the wall head in shallow swags, deeper toward the top, and sags between the ropes
  float fold = .5 + .5 * sin(arc * 2.9 + 2.5 * gNoise(vec2(arc * .3, y * .2)));
  float swag = .5 + .5 * sin(arc * .82 + 1.7 * gNoise(vec2(arc * .11, 7.)) + y * .18);
  float folds = 1. - .16 * smoothstep(7., 16.6, y) * fold - .13 * swag * smoothstep(0., 9., y);
  alb *= folds;
  alb *= mix(vec3(.66, .6, .52), vec3(1.), smoothstep(0., 3.2, y + 1.6 * gNoise(vec2(arc * .4, 3.)) - .8));
  float ropeOn = smoothstep(0., .15, uRope * 3.5 - arc / 30.);
  float dr = min(abs(y - 4.15), min(abs(y - 8.3), abs(y - 12.45)));
  float ropeShade = 1. - ropeOn * .32 * (1. - smoothstep(.05, 1.1, dr));
  // the horsehair girth ropes themselves, seen from outside: a dark twisted line
  float ropeLine = ropeOn * (1. - inside) * smoothstep(.16, .1, dr) * (.75 + .25 * step(.5, fract(arc * 3. + y)));
  alb = mix(alb, vec3(.16, .12, .09), ropeLine);
  alb *= mix(.5, mix(.66, 1., uRoofC), inside);                            // in open sun felt is a soft cream, not a white-out
  vec2 h = normalize(uSunDir.xz + vec2(1e-5, 0.)); float sunSide = dot(No.xz, h);
  float d1 = abs(fract((arc + y * .7813) / 1.087) - .5), d2 = abs(fract((arc - y * .7813) / 1.087) - .5);
  float net = 1. - .3 * smoothstep(-.2, .8, sunSide) * (smoothstep(.36, .46, d1) + smoothstep(.36, .46, d2));
  float T = smoothstep(-.6, .9, sunSide); T *= sqrt(T);
  float thick = .62 + .76 * gFbm(vec2(arc, y) * .11 + 5.);
  float drift = 1. - uCloudAmt * .7 * smoothstep(.36, .7, gFbm(vW.xz * .022 + vec2(y * .012) + uTime * (.6 + .4 * uCloudSpd) * vec2(.07, .03)));
  float roofIn = inside * uRoofC;
  // inside: the felt is lit by the whole white room (warm round the sun's side, cooler and a little dimmer opposite, never
  // dark), takes all of the beam's oval and the lamps, and glows with what comes through it
  vec3 Ni = inside > .5 ? -No : No;
  vec3 glow = mix(uFeltCool * 1.02, uFeltWarm * .8, smoothstep(-.6, .7, sunSide)) * mix(.8, .42, smoothstep(.15, 1., sunSide)) * mix(.8, 1., smoothstep(-1., -.35, sunSide));
  vec3 c = alb * (mix(gerAmb(Ni, vW, inside), glow, roofIn) + gerDirect(Ni, vW, mix(1., .5, roofIn), inside));
  // what comes through: warm where the sun lies on the outside, strongest at mid height, blue sky on the far side
  float band = mix(.55, 1., smoothstep(0., 7., y)) * mix(1., .8, smoothstep(11., 16.6, y));
  // (amber, deepest in the folds and along the seams where the felt lies double)
  vec3 amber = mix(vec3(1., .46, .13), vec3(1., .33, .06), .6 * (1. - folds * folds) + .4 * (1. - smoothstep(.04, .5, seam)));
  c += inside * alb * (uSunCol * amber * (.52 * uFeltT * T * net * thick * drift * uSunGate) + uSkyCol * (.1 * (.7 + .3 * drift)) * smoothstep(.2, -.8, sunSide) * (1. - uRoofC)) * band;
  c *= mix(1., .46 + .54 * smoothstep(0., 3.2, y), roofIn);               // the wall stands in its own shade at the floor
  c *= 1. + .22 * vT.z * inside;
  c *= ropeShade;
  gl_FragColor = vec4(gerFog(c, vD), 1.);
}` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'wall-felt';
  return { mesh, uniforms, A0, triangles: I.length / 3 };
}

function roofFelt(light, pal, cart) {
  const NA = 96, NK = 10, A = [], I = [], P = [];
  for (let i = 0; i <= NA; i++) for (let j = 0; j <= NK; j++) { const a = i / NA * 6.2832, k = j / NK, r = lerp(30.75, 6.25, k); A.push(a, k); P.push(Math.sin(a) * r, lerp(16.7, 24.75, k), Math.cos(a) * r); }
  for (let i = 0; i < NA; i++) for (let j = 0; j < NK; j++) { const p = i * (NK + 1) + j, q = p + NK + 1; I.push(p, q, p + 1, p + 1, q, q + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aRf', new THREE.Float32BufferAttribute(A, 2)); g.setIndex(I);
  const uniforms = { ...light, uFelt: { value: new THREE.Color(pal.felt) }, uHem: { value: 0 }, uArrive: { value: 0 }, uCart: { value: new THREE.Vector3(cart[0], cart[1], cart[2]) }, uRope: { value: 0 }, uWind: { value: 1 } };
  const mat = new THREE.ShaderMaterial({ uniforms, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec2 aRf; uniform float uHem, uArrive, uWind, uTime; ${VARY}
void main(){
  float k = min(aRf.y, uHem), a = aRf.x, hem = step(uHem + 1e-4, aRf.y);
  float rip = sin(a * 9. + k * 7. + uTime * 1.3) * sin(a * 4. - uTime * .6);
  float w = (aRf.y - uHem) * 12.566;
  float r = mix(30.75, 6.25, k) - hem * .55 * sin(w), y = mix(16.7, 24.75, k) + hem * .55 * (1. - cos(w)) + (1. - hem) * uWind * .1 * rip * sin(3.1416 * k);
  vec3 P = vec3(sin(a) * r, y, cos(a) * r);
  // until it is thrown over, the roof felt lies rolled in a hoop on the grass round the site
  float rr0 = mix(33.8, r, uArrive), yy0 = mix(.5, y, uArrive);
  P = vec3(sin(a) * rr0, yy0, cos(a) * rr0);
  vW = P; vN = normalize(vec3(sin(a) * .316, .949, cos(a) * .316)); vT = vec3(a, k, rip * (1. - hem));
  vec4 mv = viewMatrix * vec4(P, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: FELT_FRAG_HEAD + /* glsl */`
void main(){
  vec3 No = normalize(vN), V = normalize(cameraPosition - vW);
  float inside = step(dot(No, V), 0.), a = vT.x, k = vT.y, r = mix(30.75, 6.25, k);
  vec3 alb = feltBody(a * r, k * 25.);
  float seam = min(abs(fract(a / 1.5708 + .3) - .5) * 1.5708 * r, abs(k - .52) * 25.);
  alb *= .7 + .3 * smoothstep(.04, .3, seam);
  alb *= 1. - .34 * inside * smoothstep(.66, 1., k + .1 * gNoise(vec2(a * 6., k * 9.)));       // smoke has browned the felt round the ring
  alb *= mix(.5, 1., inside * uRoofC);
  float T = max(dot(No, uSunDir), 0.);
  float thick = .62 + .76 * gFbm(vec2(a * r, k * 25.) * .11 + 9.);
  float drift = 1. - uCloudAmt * .7 * smoothstep(.36, .7, gFbm(vW.xz * .022 + uTime * (.6 + .4 * uCloudSpd) * vec2(.07, .03)));
  float roofIn = inside * uRoofC;
  vec3 Ni = inside > .5 ? -No : No;
  float sg = smoothstep(0., .6, T);
  vec3 glow = mix(uFeltCool * 1.02, uFeltWarm * .8, sg) * mix(.8, .46, sg);
  vec3 c = alb * (mix(gerAmb(Ni, vW, inside), glow, roofIn) + gerDirect(Ni, vW, mix(1., .5, roofIn), inside));
  c += inside * alb * (uSunCol * vec3(1., .48, .15) * (.44 * uFeltT * T * thick * drift * uSunGate) + uSkyCol * (.08 * (.7 + .3 * drift)));
  c *= 1. + .22 * vT.z * inside;
  gl_FragColor = vec4(gerFog(c, vD), 1.);
}` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'roof-felt';
  return { mesh, uniforms, triangles: I.length / 3 };
}

// ---------------------------------------------------------------- the beam: an oblique cylinder of sunlight, solved analytically
function beamVolume(light, sunDir, color) {
  const SEG = 28, P = [], I = [], L = 46;
  for (let k = 0; k < 2; k++) for (let i = 0; i < SEG; i++) { const a = i / SEG * 6.2832; P.push(Math.cos(a) * 7 - sunDir.x * L * k, 24.3 - sunDir.y * L * k, Math.sin(a) * 7 - sunDir.z * L * k); }
  for (let i = 0; i < SEG; i++) { const j = (i + 1) % SEG; I.push(i, j, i + SEG, j, j + SEG, i + SEG); }
  for (let i = 1; i < SEG - 1; i++) { I.push(0, i + 1, i); I.push(SEG, SEG + i, SEG + i + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
  const uniforms = { ...light, uBeamCol: { value: new THREE.Color(color) }, uBeamGain: { value: 0 }, uSigma: { value: 0.062 } };
  const mat = new THREE.ShaderMaterial({ uniforms, side: THREE.BackSide, depthTest: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
uniform vec3 uBeamCol; uniform float uBeamGain, uSigma; varying vec3 vW;
${GER_GLSL}
void main(){
  vec3 O = cameraPosition, Dv = normalize(vW - O + vec3(1e-5)), S = uBeamDir; float k = 1. / max(S.y, .05);
  vec2 q0 = O.xz + S.xz * (k * (24.2 - O.y)), qd = Dv.xz - S.xz * (k * Dv.y);
  float a = dot(qd, qd), b = dot(q0, qd), c = dot(q0, q0) - 31.4, disc = b * b - a * c, len = 0., tm = 0.;
  if (disc > 0. && a > 1e-6) {
    float sq = sqrt(disc), t0 = max((-b - sq) / a, 0.), t1 = (-b + sq) / a;
    float dy = abs(Dv.y) > 1e-4 ? Dv.y : 1e-4, tp = (24.2 - O.y) / dy;
    if (dy > 0.) t1 = min(t1, tp); else { t0 = max(t0, tp); t1 = min(t1, -O.y / dy); }
    float a2 = max(dot(Dv.xz, Dv.xz), 1e-5), b2 = dot(O.xz, Dv.xz), c2 = dot(O.xz, O.xz) - 918., d2 = b2 * b2 - a2 * c2;
    if (d2 > 0.) t1 = min(t1, (-b2 + sqrt(d2)) / a2);
    len = max(t1 - t0, 0.); tm = (t0 + t1) * .5;
  }
  // smoke hangs in the beam in slow curls: dense, so the blade has a hard edge and a bright body
  vec3 M = O + Dv * tm, M1 = O + Dv * (tm - .22 * len), M2 = O + Dv * (tm + .22 * len);
  float n = .5 * (gFbm(M1.xz * .16 + vec2(M1.y * .21 - uTime * .13, uTime * .05)) + gFbm(M2.xz * .16 + vec2(M2.y * .21 - uTime * .13, uTime * .05)));
  float n2 = gNoise(M.xz * .5 + vec2(uTime * .2, M.y * .6 - uTime * .35));
  n = smoothstep(.22, .78, n);
  // the blade is brightest under the ring and thins toward its foot
  float along = clamp((24.2 - M.y) / max(24.2 - uBeamFoot.y, 1.), 0., 1.);
  // seen lengthwise the blade is no brighter than seen across (the lit air is counted for 14 m at most), and its
  // edge is soft: a chord near the rim carries little light
  float lenC = min(len, 14.), rim = smoothstep(0., 5.5, len);
  float I = .52 * rim * (1. - exp(-lenC * uSigma * 1.7 * (.3 + 1.4 * n + .4 * n2) * mix(1.25, .6, along)));
  // the beam is a thing seen across the room: where it begins close to the lens, and with the eye inside it, the lit
  // air thins away so that the room is never veiled
  float eyeIn = smoothstep(19., 8., length(q0)) * step(O.y, 24.2) * step(dot(O.xz, O.xz), 918.);
  float t0n = max((-b - sqrt(max(disc, 0.))) / max(a, 1e-6), 0.);
  I *= mix(mix(.1, 1., smoothstep(2.5, 17., t0n)), .1, eyeIn);
  // shafts: the light comes down in streaks that keep their place across the ring
  vec2 qs = M.xz + S.xz * (k * (24.2 - M.y));
  I *= .66 + .68 * gNoise(qs * 1.25 + vec2(uTime * .03, 0.)) * (.6 + .4 * gNoise(qs * 3.1 + 4.));
  gl_FragColor = vec4(uBeamCol * (I * uBeamGain * gerCloud(vec2(0.)) * uSunGate), 1.);
}` });
  // the hull is wound outward and only its back faces are drawn: one fragment per pixel, with the eye inside or outside
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 6; mesh.name = 'beam';
  return { mesh, uniforms };
}

// ---------------------------------------------------------------- rigid parts: crown, pillars, door, felt rolls
async function crownGeometry(pal, pause) {
  const b = makeGB(), band = ATLAS.band;
  b.add(lathe([[5.5, -0.5], [6.3, -0.5], [6.48, -0.2], [6.48, 0.2], [6.3, 0.5], [5.5, 0.5], [5.36, 0.2], [5.36, -0.2], [5.5, -0.5]], 54), { c: '#ffffff', uv: [0, band[1], 6, band[3]] });
  await pause();
  for (let i = 0; i < NP; i++) { const a = (i + 0.5) / NP * 6.2832; b.add(new THREE.BoxGeometry(0.3, 0.3, 0.22), { p: [Math.sin(a) * 6.5, 0.02, Math.cos(a) * 6.5], r: [0, a, 0], c: '#2a160c' }); if ((i & 15) === 0) await pause(); }   // the sockets in short steps
  await pause();
  const tor = (r, t, y, c, seg) => { const g = new THREE.TorusGeometry(r, t, 6, seg); g.rotateX(Math.PI / 2); b.add(g, { p: [0, y, 0], c }); };
  tor(4.0, 0.26, 1.15, pal.blue, 36); tor(1.35, 0.3, 2.45, pal.wood, 18); tor(1.35, 0.12, 2.8, pal.gold, 18);
  for (let i = 0; i < 8; i++) {                                // eight curved spokes arching up to the hub, alternately coloured
    const a = i / 8 * 6.2832, a2 = a + 0.42, c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.sin(a) * 5.6, 0.1, Math.cos(a) * 5.6), new THREE.Vector3(Math.sin(a + 0.1) * 4.4, 0.95, Math.cos(a + 0.1) * 4.4),
      new THREE.Vector3(Math.sin(a + 0.3) * 2.8, 1.9, Math.cos(a + 0.3) * 2.8), new THREE.Vector3(Math.sin(a2) * 1.45, 2.45, Math.cos(a2) * 1.45)]);
    const g = new THREE.TubeGeometry(c, 10, 0.24, 6, false);
    b.add(g, { c: i % 2 ? pal.wood : pal.woodLight, grad: [0, 2.5, 0.85, 1.1] });
    b.add(new THREE.SphereGeometry(0.34, 7, 5), { p: [Math.sin(a + 0.1) * 4.4, 0.95, Math.cos(a + 0.1) * 4.4], c: pal.gold });
    await pause();                                             // one spoke at a time
  }
  await pause();
  for (const sx of [-1, 1]) b.add(cbox(1.5, 0.5, 1.5, 0.12), { p: [sx * 4, 0.55, 0], c: pal.green });   // seats for the pillar heads
  await pause();
  return b.buildAsync(pause);
}
// a box that carries the meander band along its length (local x) without stretching it: the atlas band is 8 times as
// long as it is tall
const bandBox = (len, h, d, bv = 0.06) => ({ geo: cbox(len, h, d, bv), uv: [0, ATLAS.band[1], Math.max(0.05, len / ((h - 2 * bv) * 8)), ATLAS.band[3]] });
async function pillarGeometry(pal, pause) {
  const b = makeGB(), H = 24;
  b.add(cbox(1.9, 0.5, 1.9, 0.12), { p: [0, 0.25, 0], c: pal.woodDark });
  b.add(cbox(1.6, 0.6, 1.6, 0.14), { p: [0, 0.8, 0], c: pal.blue });
  b.add(cbox(1.3, 0.3, 1.3, 0.08), { p: [0, 1.25, 0], c: pal.gold });
  // an eight-sided orange shaft, a little stouter at the foot
  b.add(new THREE.CylinderGeometry(0.44, 0.52, H - 2.6, 8, 6), { p: [0, 1.4 + (H - 2.6) / 2, 0], r: [0, Math.PI / 8, 0], c: pal.wood, grad: [-(H - 2.6) / 2, (H - 2.6) / 2, 0.84, 1.06] });
  await pause();
  // painted cuffs: a meander band between thin ultramarine and gold rings
  for (const y of [4.4, 11.6, 18.8]) {
    for (let k = 0; k < 4; k++) { const bb = bandBox(1.06, 0.84, 0.1, 0.03), a = k * Math.PI / 2; b.add(bb.geo, { p: [Math.sin(a) * 0.5, y, Math.cos(a) * 0.5], r: [0, a, 0], c: '#ffffff', uv: bb.uv }); }
    await pause();
    for (const s of [-1, 1]) { b.add(cbox(1.2, 0.2, 1.2, 0.05), { p: [0, y + s * 0.54, 0], c: pal.blue }); b.add(cbox(1.12, 0.1, 1.12, 0.03), { p: [0, y + s * 0.7, 0], c: pal.gold }); }
    await pause();
  }
  await pause();
  for (const y of [8.0, 15.2]) b.add(new THREE.TorusGeometry(0.5, 0.07, 5, 12), { p: [0, y, 0], r: [Math.PI / 2, 0, 0], c: pal.gold });
  b.add(cbox(3.4, 0.7, 1.05, 0.14), { p: [0, H - 0.75, 0], c: pal.wood });                // bracket head
  b.add(cbox(2.2, 0.5, 1.2, 0.12), { p: [0, H - 0.25, 0], c: pal.blue });
  b.add(cbox(1.5, 0.24, 1.5, 0.06), { p: [0, H - 1.25, 0], c: pal.gold });
  await pause();
  for (const s of [-1, 1]) { b.add(cbox(0.4, 2.3, 0.6, 0.08), { p: [s * 1.05, H - 1.9, 0], r: [0, 0, s * 0.72], c: pal.woodLight }); b.add(new THREE.SphereGeometry(0.22, 7, 5), { p: [s * 1.72, H - 1.05, 0], c: pal.gold }); }
  await pause();
  return b.buildAsync(pause);
}
async function doorFrameGeometry(pal, pause) {
  const b = makeGB(), Z = GER.DOOR_Z, W = GER.DOOR_W;
  for (const s of [-1, 1]) {
    const X = s * (W + 0.55);
    b.add(cbox(1.1, 16.4, 1.5, 0.14), { p: [X, 8.2, Z], c: pal.wood, grad: [-8, 8, 0.86, 1.06] });
    { const bb = bandBox(14, 1.2, 0.5); b.add(bb.geo, { p: [X, 8.2, Z + 0.62], r: [0, 0, Math.PI / 2], c: '#ffffff', uv: bb.uv }); }
    // the reveal (the face that looks across the doorway): a painted band between blue beads, gold bosses, a carved foot and head
    { const bb = bandBox(13.2, 0.8, 0.12, 0.04); b.add(bb.geo, { p: [s * (W - 0.03), 8.4, Z - 0.3], r: [0, Math.PI / 2, Math.PI / 2], c: '#ffffff', uv: bb.uv }); }
    for (const dz of [-0.74, 0.14]) b.add(cbox(0.14, 13.6, 0.16, 0.04), { p: [s * (W - 0.04), 8.4, Z + dz], c: pal.blue });
    await pause();
    for (const y of [1.5, 15.3]) { b.add(cbox(0.3, 0.5, 0.96, 0.08), { p: [s * (W - 0.06), y, Z - 0.3], c: pal.gold }); b.add(cbox(0.24, 0.9, 0.9, 0.08), { p: [s * (W - 0.05), y + (y < 8 ? -0.6 : 0.6), Z - 0.3], c: pal.blue }); }
    for (let i = 0; i < 6; i++) b.add(new THREE.SphereGeometry(0.15, 6, 4), { p: [s * (W - 0.1), 3 + i * 2.16, Z - 0.3], c: pal.gold });
    // the same band on the face that looks into the room
    { const bb = bandBox(14, 0.9, 0.3); b.add(bb.geo, { p: [X, 8.2, Z - 0.66], r: [0, 0, Math.PI / 2], c: '#ffffff', uv: bb.uv }); }
    b.add(cbox(1.5, 0.8, 1.9, 0.16), { p: [X, 0.4, Z], c: pal.blue });
    b.add(cbox(1.36, 0.22, 1.76, 0.06), { p: [X, 0.92, Z], c: pal.gold });
    await pause();
  }
  { const bb = bandBox(W * 2 + 3.2, 1.3, 1.7, 0.16); b.add(bb.geo, { p: [0, 16.85, Z], c: '#ffffff', uv: bb.uv }); }
  { const bb = bandBox(W * 2 - 0.2, 0.9, 0.1, 0.03); b.add(bb.geo, { p: [0, 16.2, Z], r: [Math.PI / 2, 0, 0], c: '#ffffff', uv: bb.uv }); }     // under the lintel
  b.add(cbox(W * 2 + 4.2, 0.5, 2.3, 0.14), { p: [0, 17.75, Z], c: pal.blue });
  b.add(cbox(W * 2 + 3.4, 0.35, 2.0, 0.1), { p: [0, 18.15, Z], c: pal.gold });
  b.add(cbox(W * 2 + 2.2, 0.45, 1.6, 0.14), { p: [0, 0.22, Z], c: pal.woodDark });
  b.add(cbox(W * 2 - 0.1, 0.12, 0.5, 0.03), { p: [0, 0.5, Z], c: '#b08a48' });                                      // brass tread on the threshold
  for (let i = -5; i <= 5; i++) b.add(new THREE.ConeGeometry(0.34, 0.8, 4), { p: [i * 1.6, 18.72, Z], r: [0, Math.PI / 4, 0], c: i % 2 ? pal.blue : pal.wood });
  await pause();
  return b.buildAsync(pause);
}
async function doorLeafGeometry(pal, pause) {                              // hinge on the y axis, leaf along +x: stiles, rails and sunk painted panels
  const b = makeGB(), W = GER.DOOR_W - 0.08, H = 15.2, Y0 = 0.6, ST = 0.95;
  for (const x of [ST / 2, W - ST / 2]) b.add(cbox(ST, H, 0.6, 0.1), { p: [x, Y0 + H / 2, 0], c: pal.wood, grad: [-H / 2, H / 2, 0.86, 1.05] });
  for (const y of [Y0 + 0.5, Y0 + H / 2, Y0 + H - 0.5]) { const bb = bandBox(W - 2 * ST + 0.1, 1.0, 0.62, 0.08); b.add(bb.geo, { p: [W / 2, y, 0], c: '#ffffff', uv: bb.uv }); }
  await pause();
  const PH = H / 2 - 1.5, PW = W - 2 * ST;
  for (let k = 0; k < 2; k++) {
    const y = Y0 + 1.0 + PH / 2 + k * (H / 2 - 0.5);
    b.add(cbox(PW + 0.1, PH + 0.1, 0.26, 0.06), { p: [W / 2, y, 0], c: pal.woodDark });
    for (const z of [0.15, -0.15]) { const g = new THREE.PlaneGeometry(PW - 0.1, PH - 0.1); if (z < 0) g.rotateY(Math.PI); b.add(g, { p: [W / 2, y, z], c: '#ffffff', uv: ATLAS.door }); }
    for (const z of [0.2, -0.2]) for (const s of [-1, 1]) {                                     // beads round the panel
      b.add(cbox(0.16, PH, 0.12, 0.04), { p: [W / 2 + s * (PW / 2 - 0.02), y, z], c: pal.blue });
      b.add(cbox(PW, 0.16, 0.12, 0.04), { p: [W / 2, y + s * (PH / 2 - 0.02), z], c: pal.blue });
    }
  }
  await pause();
  // the edges of the leaf: a blue bead with brass nail heads, so the thickness of the door is painted too
  for (const x of [-0.02, W + 0.02]) {
    b.add(cbox(0.1, H - 0.3, 0.3, 0.04), { p: [x, Y0 + H / 2, 0], c: pal.blue });
    for (let i = 0; i < 8; i++) b.add(new THREE.SphereGeometry(0.11, 6, 4), { p: [x + Math.sign(x) * 0.05, Y0 + 1 + i * 1.9, 0], c: pal.gold });
  }
  await pause();
  for (const z of [0.31, -0.31]) for (const x of [ST / 2, W - ST / 2]) for (let i = 0; i < 5; i++) b.add(new THREE.SphereGeometry(0.13, 6, 4), { p: [x, Y0 + 1.6 + i * 3.0, z], c: pal.gold });
  for (const z of [0.4, -0.4]) { b.add(new THREE.TorusGeometry(0.5, 0.09, 6, 14), { p: [W - 1.0, 7.4, z], c: pal.gold }); b.add(new THREE.SphereGeometry(0.22, 8, 6), { p: [W - 1.0, 7.95, z], c: pal.gold }); b.add(cbox(0.7, 0.9, 0.08, 0.03), { p: [W - 1.0, 7.95, z * 0.82], c: '#8a6a30' }); }
  for (const y of [2.5, 8.2, 13.9]) { b.add(cbox(2.4, 0.36, 0.7, 0.06), { p: [1.15, y, 0], c: '#3a2a20' }); b.add(cyl(0.2, 0.2, 0.9, 8), { p: [-0.04, y, 0], c: '#2a2019' }); }   // iron hinge straps and knuckles
  await pause();
  return b.buildAsync(pause);
}
function rollGeometry(pal) {                                   // unit felt roll: radius 1, height 1, axis y, spiral ends, cord ties
  const b0 = makeGB(), b = { add: (g, o) => b0.add(g, { ...o, m: 1 }), build: () => b0.build() }, felt = new THREE.Color(pal.felt).multiplyScalar(0.27), fc = [felt.r, felt.g, felt.b];
  const body = new THREE.CylinderGeometry(1, 1, 1, 24, 8, true), bp = body.attributes.position;
  for (let i = 0; i < bp.count; i++) { const a = Math.atan2(bp.getZ(i), bp.getX(i)), k = 1 + 0.035 * Math.sin(a * 3 + bp.getY(i) * 9) + 0.02 * Math.sin(bp.getY(i) * 31 + a); bp.setX(i, bp.getX(i) * k); bp.setZ(i, bp.getZ(i) * k); }
  body.computeVertexNormals();
  b.add(body, { p: [0, 0.5, 0], c: fc, grad: [-0.5, 0.5, 0.86, 1.06] });
  for (const y of [0, 1]) for (let k = 0; k < 7; k++) { const g = new THREE.RingGeometry(k / 7, k / 7 + 0.115, 24); g.rotateX(y ? -Math.PI / 2 : Math.PI / 2); b.add(g, { p: [0, y + (y ? 0.002 : -0.002) * k, 0], c: fc, gain: (k % 2 ? 0.5 : 0.92) * (0.6 + 0.4 * k / 6) }); }
  for (const y of [0.16, 0.5, 0.84]) b.add(cyl(1.05, 1.05, 0.022, 24, true), { p: [0, y, 0], c: '#4a3828' });      // cord ties
  { const g = new THREE.PlaneGeometry(0.5, 1, 1, 6); b.add(g, { p: [1.02, 0.5, 0.24], r: [0, Math.PI / 2 - 0.5, 0], c: fc, gain: 0.8 }); }   // the loose end
  return b.build();
}

export const GER_PALETTE = { wood: '#e47326', woodLight: '#ee9848', woodDark: '#6e2a0e', blue: '#1e4fa0', green: '#3a7048', white: '#e6d8bc', gold: '#d9a044', red: '#9c2c1a', felt: '#ded6c8' };

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const pal = { ...GER_PALETTE, ...(opts.palette || {}) };
  const light = opts.light || makeGerLight();
  const sunDir = (opts.sunDir ? new THREE.Vector3().copy(opts.sunDir) : new THREE.Vector3(-0.9135, 0.4067, 0)).normalize();
  light.uSunDir.value.copy(sunDir);
  const beamDir = (opts.beamDir ? new THREE.Vector3().copy(opts.beamDir) : sunDir.clone()).normalize();          // towards the sun, as the beam runs
  light.uBeamDir.value.copy(beamDir);
  const uC = opts.uCross ?? 0.15;                             // where the camera crosses the wall circle (the gap closes just after)
  // the crown goes up while the camera is still coming in from the north (it is seen whole, from the front, and stands
  // on its pillars before the camera passes under it); the felts follow the last poles closely
  const TL = { lattice: [0.008, uC + 0.04], crown: [0.045, 0.135], poles: [0.245, 0.425], rolls: [0.25, 0.35], wallFelt: [0.35, 0.415],
    roofArrive: [0.405, 0.43], roof: [0.43, 0.508], ropes: [0.5, 0.54], beam: [0.47, 0.535], door: [0.70, 0.83], ...(opts.timeline || {}) };
  const seat = opts.poleSeat || (() => {                      // the crest starts south-west and runs anticlockwise (south, east, north)
    const s = new Float32Array(NP);
    for (let i = 0; i < NP; i++) { let a = (i + 0.5) / NP * 360; if (a > 180) a -= 360; const d = ((a + 60) % 360 + 360) % 360; s[i] = lerp(TL.poles[0], TL.poles[1], d / 360); }
    return s;
  })();
  const object = new THREE.Group(); object.name = 'raising-the-ger';
  const atlas = opts.atlas || makeAtlas(pal), ownAtlas = !opts.atlas;
  const mat = gerMaterial(light, atlas, { grain: 1 }), mat2 = gerMaterial(light, atlas, { grain: 1, side: THREE.DoubleSide });
  await ctx.yield();

  const lattice = await latticeMesh(light, ctx.yield); object.add(lattice.mesh);
  await ctx.yield();
  const poles = poleMesh(light, seat, pal); object.add(poles.mesh);
  await ctx.yield();
  const wall = wallFelt(light, pal);
  await ctx.yield();
  const cart = opts.cart || [50, 2.2, 6];
  const roof = roofFelt(light, pal, cart);
  object.add(wall.mesh, roof.mesh);
  await ctx.yield();

  const crown = new THREE.Mesh(await crownGeometry(pal, ctx.yield), mat); crown.name = 'crown'; object.add(crown);
  await ctx.yield();
  const pillarGeo = await pillarGeometry(pal, ctx.yield), pillars = [-1, 1].map((sx) => { const m = new THREE.Mesh(pillarGeo, mat); m.position.set(sx * 4, 0, 0); m.name = 'pillar'; object.add(m); return m; });
  await ctx.yield();
  const frame = new THREE.Mesh(await doorFrameGeometry(pal, ctx.yield), mat); frame.name = 'door-frame'; object.add(frame);
  await ctx.yield();
  const leafGeo = await doorLeafGeometry(pal, ctx.yield), leaves = [-1, 1].map((sx) => { const m = new THREE.Mesh(leafGeo, mat2); m.position.set(sx * GER.DOOR_W, 0, GER.DOOR_Z + 0.5); m.name = 'door-leaf'; object.add(m); return m; });
  await ctx.yield();
  const rollGeo = rollGeometry(pal), rolls = [0, 1].map((i) => { const m = new THREE.Mesh(rollGeo, mat2); m.name = 'felt-roll'; object.add(m); return m; });
  for (const m of [crown, frame, ...pillars, ...leaves, ...rolls]) m.frustumCulled = false;
  await ctx.yield();
  const beam = beamVolume(light, beamDir, opts.beamColor || '#ffc66b'); object.add(beam.mesh);

  // where the beam's axis meets the wall or the floor
  const beamFoot = new THREE.Vector3(); {
    const hx = Math.hypot(beamDir.x, beamDir.z), tWall = 29.5 / hx, tFloor = (RING_Y - 2.5) / beamDir.y, t = Math.min(tWall, tFloor);
    beamFoot.set(-beamDir.x * t, RING_Y - beamDir.y * t, -beamDir.z * t);
    light.uBeamFoot.value.copy(beamFoot);
  }
  const eNJ = 3 * LAT.NJE * LAT.S0, wNJ = 3 * LAT.NJW * LAT.S0, FO = LAT.FOLD;
  const _jamb = new THREE.Vector3(), _a = new THREE.Vector3();
  const state = { u: 0, closure: 0, beam: 0, doorOpen: 0, crownUp: 0, hem: 0 };

  function setProgress(u, time = 0) {
    state.u = u;
    // lattice: three sections a side, opened one after another; a slow breathing while it waits folded
    const br = 0.012 * Math.sin(time * 0.9), L0 = TL.lattice[0], L1 = TL.lattice[1], span = L1 - L0;
    const f = [sstep(L0, L0 + span * 0.42, u), sstep(L0 + span * 0.2, L0 + span * 0.74, u), sstep(L0 + span * 0.46, L1, u)];
    for (const U of [lattice.uniforms.uOpenE, lattice.uniforms.uOpenW]) U.value.set(FO + (1 - FO) * f[0] + br * (1 - f[0]), FO + (1 - FO) * f[1] + br * (1 - f[1]), FO + (1 - FO) * f[2] + br * (1 - f[2]));
    // poles are picked up onto the wall head 8 m behind the lattice's leading edge; the last ones by the seam only
    // once the gap has closed behind the camera
    const prog = (f[0] + f[1] + f[2]) / 3, late = 17 * sstep(L1 - 0.01, L1 + 0.03, u);
    poles.uniforms.uReachE.value = prog * eNJ + late; poles.uniforms.uReachW.value = prog * wNJ + late;
    poles.uniforms.uU.value = u;
    // crown and pillars: one arc from propped on the grass to 24 m
    const ce = sstep(TL.crown[0], TL.crown[1], u), al = (1 - ce) * 1.309 + 0.004 * Math.sin(time * 0.7) * (1 - ce), ga = al * (90 / 75);
    state.crownUp = ce;
    crown.position.set(0, 24 * Math.cos(al), -24 * Math.sin(al)); crown.rotation.x = -ga;
    for (const p of pillars) p.rotation.x = -al;
    // felt rolls: from the cart to the jambs, then round the wall; the roof rolls dwindle into the hoop
    const rt = sstep(TL.rolls[0], TL.rolls[1], u), we = sstep(TL.wallFelt[0], TL.wallFelt[1], u), ra = sstep(TL.roofArrive[0], TL.roofArrive[1], u);
    const rr = lerp(1.7, 0.24, we);
    wall.uniforms.uRollR.value = rr;
    for (let i = 0; i < 2; i++) {
      const side = i ? -1 : 1, aEnd = (side > 0 ? LAT.ENDE : LAT.ENDW) / R + 0.02, a = lerp(wall.A0, aEnd, we), m = rolls[i];
      (side > 0 ? wall.uniforms.uRollE : wall.uniforms.uRollW).value = a;
      _jamb.set(Math.sin(side * a) * (30.46 + rr), 0, Math.cos(a) * (30.46 + rr));
      _a.set(cart[0] + (i ? 4 : 0), 0, cart[2] - 9 + i * 4.5);
      const k = rt * rt * (3 - 2 * rt);
      // the west roll goes round by the south: bow its way out past the door
      m.position.lerpVectors(_a, _jamb, k); if (i) m.position.z += Math.sin(Math.PI * k) * 26;
      else { const g = Math.max(0, k - 0.2), w = g * g * (1 - k); m.position.x += 40 * w; m.position.z += 93 * w; }   // the east roll bows out round the wall too: its straight way cut through the lattice
      m.position.y += Math.sin(Math.PI * k) * 5 + (1 - k) * 1.7;
      m.rotation.set((1 - sstep(0, 0.6, rt)) * Math.PI / 2, time * 0.0 + a * 6 * we, 0);
      m.scale.set(rr, 16.6, rr);
    }
    roof.uniforms.uArrive.value = ra;
    const hem = sstep(TL.roof[0], TL.roof[1], u); state.hem = hem;
    roof.uniforms.uHem.value = hem;
    const rope = sstep(TL.ropes[0], TL.ropes[1], u);
    wall.uniforms.uRope.value = rope; roof.uniforms.uRope.value = rope;
    light.uWallC.value = sstep(TL.wallFelt[0] + 0.005, TL.wallFelt[1], u);
    light.uRoofC.value = sstep(TL.roof[0] + 0.005, TL.roof[1], u);
    state.closure = 0.45 * light.uWallC.value + 0.55 * light.uRoofC.value;
    // door leaves swing outward
    const de = sstep(TL.door[0], TL.door[1], u), da = de * 1.78 + 0.012 * Math.sin(time * 1.3) * (1 - de);
    state.doorOpen = de;
    leaves[0].rotation.y = -da; leaves[1].rotation.y = Math.PI + da;
    // beam: born as the roof closes, gone once the camera has left by the door
    state.beam = sstep(TL.beam[0], TL.beam[1], u) * (1 - sstep(0.885, 0.91, u));
    beam.uniforms.uBeamGain.value = state.beam * (opts.beamGain ?? 1); beam.mesh.visible = state.beam > 0.001;
    light.uBeamOn.value = state.beam;
  }
  setProgress(0, 0);

  return {
    object, radius: 60, height: 27, center: new THREE.Vector3(0, 12, 0), ground: true, groundY: 0,
    light, atlas, material: mat, materialDouble: mat2, palette: pal, timeline: TL, state, seat, beamDir,
    parts: { lattice, poles, wall, roof, crown, pillars, frame, leaves, rolls, beam },
    triangles: lattice.triangles + poles.triangles + wall.triangles + roof.triangles,
    anchors: {
      crown: new THREE.Vector3(0, RING_Y, 0), crownStart: new THREE.Vector3(0, 6.2, -23.2), ring: { center: new THREE.Vector3(0, RING_Y, 0), radius: GER.RING_R },
      door: new THREE.Vector3(0, 8, GER.DOOR_Z), threshold: new THREE.Vector3(0, 9, GER.DOOR_Z), portalSeat: new THREE.Vector3(0, 9, GER.GATE_Z),
      hitchPosts: [new THREE.Vector3(-GER.POST_X, 0, GER.GATE_Z), new THREE.Vector3(GER.POST_X, 0, GER.GATE_Z)], beamFoot, seam: new THREE.Vector3(Math.sin(LAT.ENDE / R) * R, 0, Math.cos(LAT.ENDE / R) * R),
    },
    setProgress,
    update(dt, time, camera, u) {
      light.uTime.value = time;
      setProgress(u == null ? Math.min(1, (time % 46) / 40) * 0.9 : u, time);
    },
    dispose() { if (ownAtlas) atlas.dispose(); },
  };
}
