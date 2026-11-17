// comet-over-the-lake-town, part TOWN: the built things. One material shades every built surface by its kind (pan
// tiles, cap tiles, plaster over charred boards, lattice windows, stone, paving, timber, tilled rows), with the
// pattern in metres and filtered by the pixel's footprint; one builder merges everything into a few meshes.
import * as THREE from 'three';
import { SKY_GLSL } from './comet-over-the-lake-town-sky.js';
import { FIELD, ISLET } from './comet-over-the-lake-town-land.js';

export const KIND = { TILE: 0, CAP: 1, WALL: 2, WINDOW: 3, STONE: 4, PAVE: 5, TIMBER: 6, ROWS: 7, PLASTER: 8, WOOD: 9, BARK: 10, LAMP: 11, RED: 12 };

export function makeBuiltMaterial(U, fog, L) {
  const uniforms = { ...U, uFogColor: { value: fog.color }, uFogDensity: { value: fog.density },
    uHemiSky: { value: L.hemiSky }, uHemiGround: { value: L.hemiGround }, uGlowDir: { value: L.glowDir }, uGlowCol: { value: L.glowCol },
    uFillDir: { value: L.fillDir }, uFillCol: { value: L.fillCol }, uLampGain: { value: L.lampGain },
    uCoolDir: { value: L.coolDir || new THREE.Vector3(0, 1, 0) }, uCoolCol: { value: L.coolCol || new THREE.Color(0, 0, 0) } };
  return new THREE.ShaderMaterial({
    name: 'LakeTownBuilt', uniforms, side: THREE.DoubleSide, fog: false,
    vertexShader: /* glsl */`
      attribute float aKind; attribute vec3 aTint;
      varying vec3 vW, vN, vTint; varying vec2 vUv; varying float vKind;
      void main() { vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz; vN = normal; vUv = uv; vKind = aKind; vTint = aTint; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform vec3 uFogColor, uHemiSky, uHemiGround, uGlowDir, uGlowCol, uFillDir, uFillCol, uCoolDir, uCoolCol; uniform float uFogDensity, uLampGain;
      varying vec3 vW, vN, vTint; varying vec2 vUv; varying float vKind;
      ${SKY_GLSL}
      float bh(vec2 p) { vec3 q = fract(vec3(p.xyx)*0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y)*q.z); }
      // a line pattern of period 1 in x, filtered: the share of a pixel of width w that lies in the dark part [0, d)
      float bn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); return mix(mix(bh(i), bh(i + vec2(1.0, 0.0)), f.x), mix(bh(i + vec2(0.0, 1.0)), bh(i + 1.0), f.x), f.y); }
      float band(float x, float d, float w) { w = max(w, 1e-4); float a = x - 0.5*w, b = x + 0.5*w; return ((floor(b)*d + min(fract(b), d)) - (floor(a)*d + min(fract(a), d)))/w; }
      void main() {
        vec3 N = normalize(vN); vec3 E = cameraPosition - vW; float dist = length(E); vec3 V = E/max(dist, 1e-3);
        if (dot(N, V) < 0.0) N = -N;
        vec2 uv = vUv, fw = fwidth(vUv);
        float k = floor(vKind + 0.5), sheen = 0.0;
        vec3 alb = vec3(0.5), emit = vec3(0.0);
        if (k < 0.5) {                                             // pan tiles: columns of rounded tiles, rows down the slope
          float cu = uv.x/0.27, rv = uv.y/0.29, wv = 0.5 + 0.5*cos(6.2831853*cu);
          float fade = 1.0 - smoothstep(0.3, 0.75, fw.x/0.27);
          float rowL = 1.0 - band(rv, 0.16, fw.y/0.29);
          float tone = 0.86 + 0.28*bh(floor(vec2(cu, rv)) + vTint.xy*91.0)*fade;
          alb = vec3(0.1, 0.092, 0.078)*(0.55 + 0.45*mix(0.5, wv, fade))*(0.42 + 0.58*rowL)*tone*(0.75 + 0.5*vTint.z);
          sheen = 0.16 + 0.26*mix(0.5, wv, fade);
        } else if (k < 1.5) {                                      // cap tiles along a ridge
          alb = vec3(0.15, 0.14, 0.12)*(0.55 + 0.45*(1.0 - band(uv.x/0.32, 0.14, fw.x/0.32))); sheen = 0.3;
        } else if (k < 2.5) {                                      // a wall: charred cedar boards under white plaster, a beam on top
          float boards = 1.0 - smoothstep(1.2, 1.24, uv.y);
          float bl = 1.0 - band(uv.x/0.2, 0.1, fw.x/0.2);
          vec3 cedar = vec3(0.05, 0.043, 0.04)*(0.6 + 0.4*bl)*(0.8 + 0.5*bh(vec2(floor(uv.x/0.2), 3.0)));
          vec3 plaster = vec3(0.56, 0.54, 0.48)*(0.84 + 0.2*bn(uv*1.7 + vTint.xz*9.0))*(0.86 + 0.14*smoothstep(1.2, 2.2, uv.y));
          plaster = mix(plaster, vec3(0.1, 0.078, 0.06), band(uv.x/0.91 + 0.07, 0.14, fw.x/0.91)*step(1.24, uv.y));   // the frame's posts stand in the plaster
          float timber = step(0.5, vTint.y)*step(vTint.y, 1.5);                                             // some walls are dark timber to the eaves
          cedar = mix(cedar, vec3(0.15, 0.105, 0.075)*(0.6 + 0.4*bl)*(0.8 + 0.5*bh(vec2(floor(uv.x/0.2), 3.0))), timber);
          plaster = mix(plaster, vec3(0.5, 0.375, 0.21)*(0.88 + 0.12*bh(floor(uv*3.0))), step(1.5, vTint.y));   // and some are ochre earth
          alb = mix(plaster, cedar, max(boards, timber));
          alb = mix(alb, vec3(0.09, 0.07, 0.055), smoothstep(vTint.x - 0.16, vTint.x - 0.13, uv.y));       // the beam under the eaves
        } else if (k < 3.5) {                                      // a lattice window: fine upright bars, paper behind, lit or not
          float bars = band(uv.x/0.075, 0.42, fw.x/0.075);
          float rails = band(uv.y/0.42, 0.1, fw.y/0.42);
          float wood = clamp(bars + rails, 0.0, 1.0);
          float lit = vTint.x*(0.85 + 0.15*sin(uSkyTime*(0.6 + vTint.y) + vTint.y*50.0));
          alb = mix(vec3(0.32, 0.3, 0.26), vec3(0.06, 0.045, 0.035), wood);
          emit = vec3(1.0, 0.62, 0.26)*lit*(1.0 - wood)*2.6*uLampGain*(0.75 + 0.25*bh(floor(uv/vec2(0.6, 0.42))));
        } else if (k < 4.5) {                                      // stone: coursed blocks
          float row = floor(uv.y/0.36), cx = uv.x/0.62 + 0.5*mod(row, 2.0);
          float joint = max(band(uv.y/0.36, 0.1, fw.y/0.36), band(cx, 0.07, fw.x/0.62));
          alb = vec3(0.29, 0.27, 0.235)*(0.75 + 0.4*bh(vec2(floor(cx), row)))*(1.0 - 0.5*joint)*(0.85 + 0.3*vTint.z);
        } else if (k < 5.5) {                                      // paving: small worn setts, moss in the joints, a wet sheen that holds the sky's light
          float row = floor(uv.y/0.34), cx = uv.x/0.46 + 0.37*row;
          float joint = max(band(uv.y/0.34, 0.1, fw.y/0.34), band(cx, 0.08, fw.x/0.46));
          float far = smoothstep(0.3, 1.0, max(fw.x/0.46, fw.y/0.34));
          float tone = mix(bh(vec2(floor(cx), row)), 0.5, far), worn = bh(vec2(floor(cx*0.2), floor(row*0.2)));
          alb = mix(mix(vec3(0.3, 0.27, 0.22), vec3(0.21, 0.205, 0.19), tone)*(0.74 + 0.36*worn), vec3(0.09, 0.15, 0.06), joint*0.85*(1.0 - 0.6*far));
          sheen = 0.6*(1.0 - joint);
        } else if (k < 6.5) { alb = vec3(0.1, 0.075, 0.055)*(0.8 + 0.4*bh(floor(uv*vec2(8.0, 1.0))));       // dark timber
        } else if (k < 7.5) {                                      // tilled rows with young greens
          float r = band(uv.y/0.7, 0.45, fw.y/0.7);
          float cf = 1.0 - smoothstep(0.15, 0.5, max(fw.x/0.35, fw.y/0.7));   // the plants' own tones fade to their mean with distance
          alb = 0.85*mix(vec3(0.13, 0.1, 0.075), vec3(0.1, 0.17, 0.065)*(0.6 + 0.8*mix(0.5, bh(floor(uv/vec2(0.35, 0.7))), cf)), r);
        } else if (k < 8.5) { alb = vec3(0.58, 0.56, 0.5)*(0.8 + 0.26*bn(uv*1.3 + vTint.xy*7.0))*(0.9 + 0.1*bh(floor(uv*2.0)));   // lime-washed plaster, weathered
        } else if (k < 9.5) { alb = vTint*(0.7 + 0.3*(1.0 - band(uv.x/0.16, 0.12, fw.x/0.16)));              // weathered boards, tinted
        } else if (k < 10.5) { alb = vTint*(0.75 + 0.5*bh(floor(uv*vec2(14.0, 2.0))));                       // bark, moss, rough things
        } else if (k < 11.5) { alb = vec3(0.3); emit = vTint*uLampGain*(0.86 + 0.14*sin(uSkyTime*6.0 + vW.x*3.1 + vW.z*1.7));                                      // a lamp's own light
        } else if (k < 12.5) { alb = vec3(0.56, 0.1, 0.06)*(0.7 + 0.4*bh(floor(uv*vec2(3.0, 7.0))));         // weathered vermilion
        } else {                                                   // turf on an earth bank: clumps and blades
          float n1 = bn(uv*1.1 + vTint.xy*7.0), n2 = bn(uv*5.3), bl = bh(floor(vec2(uv.x*38.0, uv.y*2.5)));
          alb = vTint*(0.86 + 0.22*n1)*(0.88 + 0.24*n2)*(0.85 + 0.3*mix(0.5, bl, 1.0 - smoothstep(0.3, 0.8, fw.x*38.0)));
        }
        float up = N.y*0.5 + 0.5;
        vec3 light = mix(uHemiGround, uHemiSky, up) + uGlowCol*max(dot(N, uGlowDir), 0.0) + uFillCol*max(dot(N, uFillDir), 0.0) + uCoolCol*max(dot(N, uCoolDir), 0.0);
        vec3 col = alb*light*0.3183 + emit;
        vec3 R = reflect(-V, N); R.y = abs(R.y);
        float fr = 1.0 - max(dot(N, V), 0.0); fr = 0.05 + 0.6*fr*fr*fr;
        vec3 gz = twSky(normalize(R)); col += mix(vec3(dot(gz, vec3(0.3, 0.5, 0.2))), gz, 0.4)*sheen*fr*0.8;   // glazed tiles carry the sky, greyed
        float f = uFogDensity*dist;
        gl_FragColor = vec4(mix(col, uFogColor, 1.0 - exp(-f*f)), 1.0);
      }` });
}

// ------------------------------------------------------------------ the builder: quads and boxes in a house's own frame
export class Builder {
  constructor() { this.P = []; this.N = []; this.T = []; this.K = []; this.C = []; this.I = []; this.m = new THREE.Matrix4(); this.v = new THREE.Vector3(); this.skins = []; this.marks = []; }
  mark(name) { this.marks.push([name, this.I.length]); return this; }       // for the count of clear air: where each kind of thing ends in the index
  frame(x, y, z, yaw) { this.m.makeRotationY(yaw).setPosition(x, y, z); return this; }
  w(p) { return this.v.set(p[0], p[1], p[2]).applyMatrix4(this.m).toArray(); }
  // a flat polygon (fan from its first corner); uv in metres: u along its first edge, v across it in its own plane
  poly(pts, kind, tint = [0.5, 0.5, 0.5], uvo = [0, 0]) {
    const q = pts.map((p) => this.w(p)), a = new THREE.Vector3(...q[0]), e = new THREE.Vector3(...q[1]).sub(a), l = new THREE.Vector3(...q[q.length - 1]).sub(a);
    const n = new THREE.Vector3().crossVectors(e, l).normalize(); e.normalize(); const f = new THREE.Vector3().crossVectors(n, e), i0 = this.P.length / 3, d = new THREE.Vector3();
    for (const p of q) { d.set(p[0], p[1], p[2]).sub(a); this.P.push(p[0], p[1], p[2]); this.N.push(n.x, n.y, n.z); this.T.push(d.dot(e) + uvo[0], d.dot(f) + uvo[1]); this.K.push(kind); this.C.push(tint[0], tint[1], tint[2]); }
    for (let i = 1; i < q.length - 1; i++) this.I.push(i0, i0 + i, i0 + i + 1);
    return this;
  }
  // an upright box from (x0,y0,z0) to (x1,y1,z1) in the frame; kinds for sides and top
  box(x0, y0, z0, x1, y1, z1, kind, tint, top = kind, bottom = false) {
    this.poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], kind, tint); this.poly([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], kind, tint);
    this.poly([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], kind, tint); this.poly([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], kind, tint);
    this.poly([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], top, tint);
    if (bottom) this.poly([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], kind, tint);
    return this;
  }
  // an upright pole of n sides
  pole(x, z, y0, y1, r, kind, tint, n = 6, r1 = r) {
    for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832, b = ((i + 1) / n) * 6.2832;
      this.poly([[x + Math.cos(a) * r, y0, z + Math.sin(a) * r], [x + Math.cos(b) * r, y0, z + Math.sin(b) * r], [x + Math.cos(b) * r1, y1, z + Math.sin(b) * r1], [x + Math.cos(a) * r1, y1, z + Math.sin(a) * r1]], kind, tint); }
    return this;
  }
  // a body for the count of clear air: a ball round a point of the frame
  skin(x, y, z, r, name) { const p = this.w([x, y, z]); this.skins.push({ x: p[0], y: p[1], z: p[2], r, name }); return this; }
  mesh(material, name) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.T, 2)); g.setAttribute('aKind', new THREE.Float32BufferAttribute(this.K, 1));
    g.setAttribute('aTint', new THREE.Float32BufferAttribute(this.C, 3)); g.setIndex(this.I);
    const m = new THREE.Mesh(g, material); m.name = name; return m;
  }
}

// ------------------------------------------------------------------ a house of the lake country, in its own frame
// x along the ridge, z across (the front, with the pent roof and the door, looks down +z), y up from its floor.
// o: { w, d, type: 'gable' | 'hip' | 'store' | 'shed', lit: [bools], r: a few draws 0..1, drop: metres of stone under the floor, apron: on the lane }
export function addHouse(B, o) {
  const { w, d, type, r } = o, hw = w / 2, hd = d / 2, store = type === 'store', shed = type === 'shed';
  const h1 = shed ? 2.3 : 2.55, h2 = shed ? h1 : store ? 5.4 : 4.85, ov = store ? 0.45 : 0.95, pitch = store ? 0.62 : 0.52, t3 = [r[0], r[1], r[2]];
  const wallK = store ? 8 : 2, lit = o.lit || [], style = store ? 0 : r[1] < 0.3 ? 1 : r[1] < 0.56 ? 2 : 0;
  B.box(-hw - 0.25, -o.drop, -hd - 0.25, hw + 0.25, 0.02, hd + 0.25, 4, t3);                       // the stone the house stands on
  if (o.apron) B.box(-hw - 0.55, -o.drop, hd + 0.25, hw + 0.55, 0.02, hd + 1.4, 4, t3, 5);           // on the lane: a flagged apron under the pent roof, level with the floor
  const wall = (x0, z0, x1, z1, y0, y1) => B.poly([[x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0]], wallK, [y1 - y0, style, r[2]]);
  const ring = (x0, z0, x1, z1, y0, y1) => { wall(x0, z1, x1, z1, y0, y1); wall(x1, z1, x1, z0, y0, y1); wall(x1, z0, x0, z0, y0, y1); wall(x0, z0, x0, z1, y0, y1); };
  ring(-hw, -hd, hw, hd, 0, h1 + 0.25);
  const win = (x0, x1, y0, y1, z, on, face = 1) => { if (on && o.glows) o.glows.push(B.w([(x0 + x1) / 2, (y0 + y1) / 2, z + 0.3 * face]));   // a lit window's place, for its soft halo
    return B.poly(face > 0 ? [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]] : [[x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z]], 3, [on ? 1 : 0, r[1], 0]); };
  if (!store && !shed) {
    const f = 0.3;                                                                                   // the upper floor stands a little back
    ring(-hw + 0.15, -hd + 0.1, hw - 0.15, hd - f, h1 + 0.25, h2);
    // the pent roof over the ground floor, front and back, with its own row of tiles
    for (const s of [1, -1]) { const z0 = s * (hd - (s > 0 ? f : 0.1)), z1 = s * (hd + 1.15);
      B.poly(s > 0 ? [[-hw - 0.5, h1 + 0.02, z1], [hw + 0.5, h1 + 0.02, z1], [hw + 0.5, h1 + 0.62, z0], [-hw - 0.5, h1 + 0.62, z0]] : [[hw + 0.5, h1 + 0.02, z1], [-hw - 0.5, h1 + 0.02, z1], [-hw - 0.5, h1 + 0.62, z0], [hw + 0.5, h1 + 0.62, z0]], 0, t3);
      B.poly(s > 0 ? [[-hw - 0.5, h1 - 0.1, z1], [hw + 0.5, h1 - 0.1, z1], [hw + 0.5, h1 + 0.02, z1], [-hw - 0.5, h1 + 0.02, z1]] : [[hw + 0.5, h1 - 0.1, z1], [-hw - 0.5, h1 - 0.1, z1], [-hw - 0.5, h1 + 0.02, z1], [hw + 0.5, h1 + 0.02, z1]], 6, t3); }
    for (const sx of [-1, 1]) { B.pole(sx * (hw + 0.3), hd + 1.0, 0, h1, 0.07, 6, t3, 4); }      // posts under the pent roof's corners
    // lattice windows and the door, front and back; a long window band upstairs
    const dx = (r[0] - 0.5) * (w - 4.5);
    win(dx - 0.9, dx + 0.9, 0.05, 1.95, hd + 0.04, lit[2]);
    win(-hw + 0.5, dx - 1.5, 0.75, 1.95, hd + 0.04, lit[0]); win(dx + 1.5, hw - 0.5, 0.75, 1.95, hd + 0.04, lit[1]);
    win(-hw + 0.8, hw - 0.8, h1 + 1.15, h2 - 0.45, hd - f + 0.04, lit[3]);
    win(-hw + 0.9, -0.4, 0.8, 1.9, -hd - 0.04, lit[4], -1); win(0.6, hw - 0.9, h1 + 1.2, h2 - 0.5, -hd + 0.1 - 0.04, lit[5], -1);
  } else if (store) {
    win(-0.45, 0.45, 3.4, 4.3, hd + 0.04, false); B.box(-0.9, 0, hd, 0.9, 2.1, hd + 0.18, 6, t3);
    B.box(-hw - 0.12, 0, -hd - 0.12, hw + 0.12, 1.1, hd + 0.12, 4, t3);                              // a skirt of flat stones round the store
  } else { win(-hw + 0.6, hw - 1.6, 0.8, 1.8, hd + 0.04, lit[0]); }
  addRoof(B, hw, hd, h2, ov, pitch, type === 'hip', t3, store);
  B.skin(0, h2 + (hd + ov) * pitch * 0.5, 0, Math.hypot(hw + ov, hd + ov, (hd + ov) * pitch * 0.5 + 0.5) , 'roof');
  return h2 + (hd + ov) * pitch + 0.45;                                                              // the ridge's top over the floor
}

// the roof: gabled, or hip-and-gable; slopes of pan tiles with a real edge, a ridge of cap tiles with end pieces
function addRoof(B, hw, hd, yE, ov, pitch, hip, t3, black) {
  const X = hw + (hip ? ov : 0.6), Z = hd + ov, yR = yE + Z * pitch, e0 = yE - 0.02, th = 0.16, tt = black ? [t3[0], t3[1], 0.15] : t3;
  if (!hip) {
    for (const s of [1, -1]) {
      const A = [-s * X, e0, s * Z], Bq = [s * X, e0, s * Z], Cq = [s * X, yR, 0], D = [-s * X, yR, 0];
      B.poly([A, Bq, Cq, D], 0, tt);
      B.poly([[A[0], e0 - th, A[2]], [Bq[0], e0 - th, Bq[2]], Bq, A], 6, t3);                            // the eave's edge
    }
    for (const sx of [1, -1]) {                                                                        // the gable walls and the verge
      B.poly([[sx * hw, yE - 0.3, sx * hd], [sx * hw, yE - 0.3, -sx * hd], [sx * hw, yR - 0.25, 0]], black ? 8 : 2, [9, 0, t3[2]]);
      B.poly([[sx * X, e0 - th, Z], [sx * X, e0, Z], [sx * X, yR, 0], [sx * X, yR - th, 0]], 6, t3); B.poly([[sx * X, e0 - th, -Z], [sx * X, yR - th, 0], [sx * X, yR, 0], [sx * X, e0, -Z]], 6, t3);
    }
    B.box(-X - 0.1, yR - 0.08, -0.2, X + 0.1, yR + 0.3, 0.2, 1, t3);                                   // the ridge of cap tiles
    for (const sx of [1, -1]) B.box(sx * (X + 0.02) - 0.14, yR - 0.1, -0.28, sx * (X + 0.02) + 0.14, yR + 0.52, 0.28, 1, t3);
    for (const sx of [1, -1]) for (const s of [1, -1]) {                                              // the descending ridges beside each verge
      const x0 = sx * (X - 0.55), x1 = sx * (X - 0.25);
      B.poly([[x0, e0 + 0.14, s * Z], [x1, e0 + 0.14, s * Z], [x1, yR + 0.14, 0], [x0, yR + 0.14, 0]], 1, t3);
    }
  } else {
    const xg = X - Z / 2, yG = (e0 + yR) / 2, zg = Z / 2;
    for (const s of [1, -1]) {
      B.poly([[-s * X, e0, s * Z], [s * X, e0, s * Z], [s * xg, yG, s * zg], [-s * xg, yG, s * zg]], 0, tt);       // the main slope in two convex pieces: eave to shoulders,
      B.poly([[-s * xg, yG, s * zg], [s * xg, yG, s * zg], [s * xg, yR, 0], [-s * xg, yR, 0]], 0, tt);          // and shoulders to ridge
      B.poly([[-s * X, e0 - th, s * Z], [s * X, e0 - th, s * Z], [s * X, e0, s * Z], [-s * X, e0, s * Z]], 6, t3);
    }
    for (const sx of [1, -1]) {
      B.poly([[sx * X, e0, sx * Z], [sx * X, e0, -sx * Z], [sx * xg, yG, -sx * zg], [sx * xg, yG, sx * zg]], 0, tt);
      B.poly([[sx * X, e0 - th, sx * Z], [sx * X, e0 - th, -sx * Z], [sx * X, e0, -sx * Z], [sx * X, e0, sx * Z]], 6, t3);
      B.poly([[sx * xg, yG, sx * zg], [sx * xg, yG, -sx * zg], [sx * xg, yR - 0.1, 0]], 8, t3);            // the little gable of white plaster
      for (const s of [1, -1]) B.poly([[sx * (X - 0.12), e0 + 0.1, s * (Z - 0.12)], [sx * (X + 0.12), e0 + 0.1, s * (Z - 0.3)], [sx * xg + 0.12 * sx, yG + 0.14, s * zg - 0.1 * s], [sx * xg - 0.12 * sx, yG + 0.14, s * zg + 0.1 * s]], 1, t3);
    }
    B.box(-xg - 0.1, yR - 0.08, -0.2, xg + 0.1, yR + 0.3, 0.2, 1, t3);
    for (const sx of [1, -1]) B.box(sx * xg - 0.14, yR - 0.1, -0.28, sx * xg + 0.14, yR + 0.52, 0.28, 1, t3);
  }
}

// ------------------------------------------------------------------ the town's plan: lanes, lots, houses
// Lanes follow the slope's contours (six) and climb across them (five: the fifth is THE LANE, laid on the route's own
// line); houses stand on both hands of THE LANE with their fronts 6.2 to 8.8 m from its middle (stream handed in as
// laneRng), and lots stand either side of the contour lanes. Every draw of a lot is taken before any test.
export async function planTown(G, path, rng, dn, surfaceAt, deep, yieldFn, laneRng = null) {
  const SH = -320, lanes = [], lots = [], XA = -185, XB = 185, DL = [12, 50, 88, 128, 170, 214], NL = DL.length;
  const contour = (k) => { const z0 = SH - DL[k], ph = k * 1.7; return (x) => z0 + (k ? 7 : 2.5) * Math.sin(x / 70 + ph) + (k ? 4.5 : 0) * Math.sin(x / 29 + ph * 2.3) + 5 * Math.sin(x / 60 + 1.3); };
  const rx = [], rv = new THREE.Vector3(); for (let m = 0; m <= path.length; m += 2) { path.posAtDist(m, rv); rx.push([rv.z, rv.x]); }
  const routeX = (z) => { for (let i = 1; i < rx.length; i++) if (rx[i][0] <= z) { const a = rx[i - 1], b = rx[i]; return a[1] + (b[1] - a[1]) * ((z - a[0]) / Math.min(-1e-6, b[0] - a[0])); } return rx[rx.length - 1][1]; };
  // four side lanes climb the slope, and the MAIN lane (the fifth) is the route's own line: the eye flies up it between the houses
  const climb = (j) => { if (j === 4) return routeX; const x0 = [-128, -52, 44, 132][j], ph = j * 2.1; return (z) => x0 + 11 * Math.sin((z - SH) / 55 + ph) + 4 * Math.sin((z - SH) / 23 + ph * 1.9); };
  for (let k = 0; k < NL; k++) { const f = contour(k), pts = []; for (let x = XA; x <= XB + 0.1; x += 2.5) pts.push([x, f(x)]); lanes.push({ pts, w: k ? 2.3 : 3.2, k }); }
  for (let j = 0; j < 5; j++) { const f = climb(j), pts = []; for (let z = SH - (j === 4 ? 4 : 12); z >= SH - (j === 1 ? 262 : j === 2 ? 296 : j === 4 ? 236 : 222); z -= 2.5) pts.push([f(z), z]); lanes.push({ pts, w: j === 4 ? 5.6 : 2.0, j, climb: true }); }
  const nearClimb = (x, z) => { let m = 1e9; for (let j = 0; j < 5; j++) m = Math.min(m, Math.abs(x - climb(j)(z))); return m; };
  const want = Math.round(88 + 34 * dn); let made = 0;
  const cand = [], placed = [], doorLamps = [], lanePines = [], lanePersimmons = [], gapWalls = [];
  // lit windows stand on a house's front only: one alone, or three (the two below and the long band above), so that no face shows a pair
  const litFront = (a, b) => (a < 0.24 ? [b < 0.5, false, false, b >= 0.5, false, false] : [true, true, false, true, false, false]);
  const tanAt = (z) => { const dx = routeX(z - 1.5) - routeX(z + 1.5), l = Math.hypot(dx, 3); return [dx / l, -3 / l]; };   // the lane's heading, uphill
  let leat = null;
  if (laneRng) {
    // THE LANE THE ROUTE FOLLOWS, from the waterfront lane to the meadow's edge: houses stand on both hands with their fronts 6.2 to 8.8 m
    // from its middle line, dealt from a stream of their own; the crossing lanes and the leat keep their way between them. In the gap above
    // a house: a garden wall on the fronts' line and, by the dice, a lamp at the lane's side, a pruned pine or a persimmon behind the wall.
    const lr = laneRng, kk = 1 + Math.floor(lr() * 3.99), za = contour(kk)(routeX(SH - DL[kk])), zb = contour(kk + 1)(routeX(SH - DL[kk + 1])), zL = (za + zb) / 2 + lr.range(-2.5, 2.5);
    leat = [routeX(zL), zL, 26, 2.4];                                // the leat: still water in a stone channel along the contour, between two of the cross lanes; the lane crosses it by one small stone bridge
    for (const side of [1, -1]) {
      if (yieldFn) await yieldFn();
      for (let z = SH - 7 - lr.range(0, 4), n = 0; z > SH - 226 && n < 140; n++) {
        const w0 = lr.range(7.2, 11.6), d0 = lr.range(5.4, 7.6), gap = lr.range(1.6, 7), set = lr.range(6.2, 8.8), tr = lr(), r = [lr(), lr(), lr()], la = lr(), lb = lr(), yawJ = lr.range(-0.06, 0.06), lampR = lr(), treeR = lr();
        const type = tr < 0.5 ? 'gable' : tr < 0.78 ? 'hip' : tr >= 0.9 ? 'shed' : Math.abs(z - zL) < 24 ? 'gable' : 'store';   // (no plastered store stands by the leat)
        const w = type === 'store' ? 5.2 + r[0] : type === 'shed' ? 5 + 2 * r[0] : w0, d = type === 'store' ? 4.4 + r[1] * 0.8 : type === 'shed' ? 3.6 + r[1] : d0;
        const zc = z - w / 2, x0 = routeX(zc), t = tanAt(zc), off = set + d / 2;
        let blocked = Math.abs(zc - zL) < w / 2 + 6.2;
        for (let k = 0; k < NL && !blocked; k++) blocked = Math.abs(contour(k)(x0 + side * off) - zc) < w / 2 + 2.8;
        if (blocked) { z -= 2.5; continue; }
        const xc = x0 - side * t[1] * off, zcc = zc + side * t[0] * off, yaw = Math.atan2(side * t[1], -side * t[0]) + yawJ, cs = Math.cos(yaw), sn = Math.sin(yaw);
        let lo = 1e9, hi = -1e9;
        for (const [ax, az] of [[-1, -1], [1, -1], [1, 1.4], [-1, 1.4], [0, 0]]) { const h = surfaceAt(xc + cs * ax * w / 2 + sn * az * d / 2, zcc - sn * ax * w / 2 + cs * az * d / 2); lo = Math.min(lo, h); hi = Math.max(hi, h); }
        placed.push([xc, zcc, Math.hypot(w, d) / 2 + 1.2]); made++;
        lots.push({ k: -1, side, xc, zc: zcc, yaw, w, d, tr, keep: 0, r, type, house: true, floor: hi + 0.25, lo, lit: litFront(la, lb), near: true, garden: false, lane: true, lz: zc, set });
        const zg = zc - w / 2 - gap / 2, xg = routeX(zg), tg = tanAt(zg), at = (m) => [xg - side * tg[1] * m, zg + side * tg[0] * m];
        let free = Math.abs(zg - zL) > gap / 2 + 6; for (let k = 0; k < NL && free; k++) free = Math.abs(contour(k)(xg + side * set) - zg) > gap / 2 + 2.4;
        if (free && gap > 2.6) {
          gapWalls.push([...at(set - 0.15), Math.atan2(-tg[1], tg[0]), gap - 0.5, r]);
          if (gap > 3.4) doorLamps.push([...at(2.45), lampR]);
          if (treeR < 0.5 && gap > 4) lanePines.push([...at(set + 2.4), r[1]]); else if (treeR > 0.84 && gap > 4.4) lanePersimmons.push([...at(set + 4.2), 0.78 + 0.3 * r[2]]);
        }
        z -= w + gap;
      }
    }
  }
  if (lanePines.length % 2 === 0) lanePines.pop(); if (lanePersimmons.length % 2 === 0) lanePersimmons.pop();   // (an odd number of each, or none)
  for (let k = 0; k < NL; k++) for (const side of (k ? [1, -1] : [-1])) {                      // the waterfront lane has houses on its inland side only
    if (yieldFn) await yieldFn();
    const f = contour(k);
    for (let x = XA + 10 + rng.range(0, 6); x < XB - 8;) {
      const w = rng.range(7.6, 14.5), d = rng.range(5.4, 8.4), gap = rng.range(1.2, 5.5), tr = rng(), keep = rng(), r = [rng(), rng(), rng()], yawJ = rng.range(-0.3, 0.3), back = rng.range(1.8, 7), turn = rng() < 0.24, litR = [rng(), rng(), rng()];
      const front = turn ? d : w, depth = turn ? w : d;                                          // one house in four stands end-on to its lane
      const xc = x + front / 2, zl = f(xc), slope = (f(xc + 2) - f(xc - 2)) / 4;
      cand.push({ k, side, xc, zc: zl + side * (1.3 + back + depth / 2), yaw: -Math.atan(slope) + yawJ + (side > 0 ? Math.PI : 0) + (turn ? Math.PI / 2 : 0), w, d, tr, keep, r, litR });
      x += front + gap;
    }
  }
  const order = cand.map((c, i) => [c.keep * 0.5 + 0.5 * Math.min(1, Math.abs(c.xc + 15) / 185), i]).sort((a, b) => a[0] - b[0]);
  for (const [, i] of order) {
    const c = cand[i]; let type = c.tr < 0.46 ? 'gable' : c.tr < 0.74 ? 'hip' : c.tr < 0.88 ? 'store' : 'shed';
    if (type === 'store' && (c.k === 0 || (leat && Math.hypot(c.xc - leat[0], c.zc - leat[1]) < 34))) type = 'gable';   // no plastered store at the water's edge, none by the leat
    let w = c.w, d = c.d; if (type === 'store') { w = 5.2 + c.r[0]; d = 4.4 + c.r[1] * 0.8; } if (type === 'shed') { w = 5 + 2 * c.r[0]; d = 3.6 + c.r[1]; }
    const cs = Math.cos(c.yaw), sn = Math.sin(c.yaw); let lo = 1e9, hi = -1e9;
    for (const [ax, az] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0]]) { const px = c.xc + cs * ax * w / 2 + sn * az * d / 2, pz = c.zc - sn * ax * w / 2 + cs * az * d / 2, h = surfaceAt(px, pz); lo = Math.min(lo, h); hi = Math.max(hi, h); }
    const floor = hi + 0.25, np = path.nearestXZ(c.xc, c.zc), top = floor + (type === 'shed' ? 4.4 : type === 'store' ? 8.9 : 8.2), rad = Math.hypot(w, d) / 2 + 1.2;
    const clear = Math.hypot(Math.max(0, np.dist - rad), Math.max(0, np.y - top));               // no house of the cross lanes comes nearer the route's line than the lane's own
    let free = true; for (const q of placed) if (Math.hypot(q[0] - c.xc, q[1] - c.zc) < (q[2] + rad) * 0.68) { free = false; break; }
    const offLeat = !leat || Math.abs(c.xc - leat[0]) > leat[2] / 2 + rad || Math.abs(c.zc - leat[1]) > rad + 4;
    const ok = made < want && free && offLeat && clear > 9.5 && nearClimb(c.xc, c.zc) > Math.max(w, d) / 2 + 2.2 && lo > 0.6 && Math.abs(c.xc) < 178;
    if (ok) { made++; placed.push([c.xc, c.zc, rad]); }
    const nearRoute = np.dist < 80, lit = c.litR[2] < (deep ? 0.66 : 0.52) || nearRoute ? litFront(c.litR[0], c.litR[1]) : [false, false, false, false, false, false];   // amber windows on half the houses and more, and on all near the route
    lots.push({ ...c, w, d, type, house: ok, floor, lo, lit, near: nearRoute, garden: !ok && free && offLeat && lo > 0.8 && nearClimb(c.xc, c.zc) > 4 && np.dist > 12 });
  }
  return { lanes, lots, contour, climb, houses: made, doorLamps, lanePines, lanePersimmons, gapWalls, leat, foot: routeX(SH) };
}

// a lake boat: long, low and pointed at both ends, the bow (toward +x of its frame) lifted a little; three thwarts and a stem post
function addBoat(B, len, beam, tint) {
  const S = 10, hb = (t) => beam * 0.5 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t * 2 - 1), 2.3)), 0.75), top = (t) => 0.4 + 0.3 * Math.pow(Math.abs(t * 2 - 1), 2.2) + 0.1 * t;
  const dk = [tint[0] * 0.7, tint[1] * 0.7, tint[2] * 0.7];
  for (let i = 0; i < S; i++) {
    const t0 = i / S, t1 = (i + 1) / S, x0 = (t0 - 0.5) * len, x1 = (t1 - 0.5) * len, b0 = hb(t0), b1 = hb(t1), y0 = top(t0), y1 = top(t1);
    for (const s of [1, -1]) B.poly(s > 0 ? [[x0, -0.12, s * b0 * 0.5], [x1, -0.12, s * b1 * 0.5], [x1, y1, s * b1], [x0, y0, s * b0]] : [[x1, -0.12, s * b1 * 0.5], [x0, -0.12, s * b0 * 0.5], [x0, y0, s * b0], [x1, y1, s * b1]], 9, tint);
    if (i > 0 && i < S - 1) B.poly([[x0, 0.04, -b0 * 0.5], [x0, 0.04, b0 * 0.5], [x1, 0.04, b1 * 0.5], [x1, 0.04, -b1 * 0.5]], 9, dk);
  }
  for (const t of [0.26, 0.5, 0.72]) { const x = (t - 0.5) * len, b = hb(t) * 0.96; B.box(x - 0.13, 0.3, -b, x + 0.13, 0.36, b, 9, [tint[0] * 1.35, tint[1] * 1.35, tint[2] * 1.35], 9, true); }
  B.box(len / 2 - 0.14, 0.3, -0.05, len / 2 + 0.08, top(1) + 0.3, 0.05, 9, dk, 9, true);
}

// a plastered wall under a little roof of cap tiles, from a to b on the ground, following its slope
function wallOn(B, heightAt, ax, az, bx, bz, h, tint) {
  const l = Math.hypot(bx - ax, bz - az) || 1, nx = (-(bz - az) / l) * 0.15, nz = ((bx - ax) / l) * 0.15, ya = heightAt(ax, az), yb = heightAt(bx, bz);
  for (const s of [1, -1]) {
    B.poly([[ax + s * nx, ya - 0.5, az + s * nz], [bx + s * nx, yb - 0.5, bz + s * nz], [bx + s * nx, yb + h, bz + s * nz], [ax + s * nx, ya + h, az + s * nz]], 8, tint);
    B.poly([[ax + s * nx * 2.3, ya + h - 0.03, az + s * nz * 2.3], [bx + s * nx * 2.3, yb + h - 0.03, bz + s * nz * 2.3], [bx, yb + h + 0.2, bz], [ax, ya + h + 0.2, az]], 1, tint);
  }
  B.poly([[ax - nx, ya - 0.5, az - nz], [ax + nx, ya - 0.5, az + nz], [ax + nx, ya + h, az + nz], [ax - nx, ya + h, az - nz]], 8, tint);
  B.poly([[bx - nx, yb - 0.5, bz - nz], [bx + nx, yb - 0.5, bz + nz], [bx + nx, yb + h, bz + nz], [bx - nx, yb + h, bz - nz]], 8, tint);
}

// ------------------------------------------------------------------ build the town's meshes
// opts.stream(name): the world's named streams. Boats, stakes, lamps and the quay's things each deal from a stream of their own.
export async function buildTown(plan, G, path, rng, surfaceAt, material, opts) {
  const B = new Builder(), lamps = [], smokes = [], gardens = [], boats = [], bushes = [], stakes = [], winGlows = [], pools = [];
  const own = opts.stream, waterZ = (x) => -320 + 5 * Math.sin(x / 60 + 1.3), lip = (x) => waterZ(x) + 1.6, xF = plan.foot, QA = -150, QB = 110, QD = 6;
  const clearOf = (x, y, z) => { const np = path.nearestXZ(x, z); return Math.hypot(np.dist, Math.max(0, np.y - y)); };     // metres of air between a point and the route's line
  // houses (the work is handed back every thirty lots, so that no step of the build is long)
  let li = 0;
  for (const lot of plan.lots) {
    if (opts.yield && ++li % 30 === 0) await opts.yield();
    if (lot.house) {
      B.frame(lot.xc, lot.floor, lot.zc, lot.yaw);
      const top = addHouse(B, { w: lot.w, d: lot.d, type: lot.type, r: lot.r, lit: lot.lit, drop: lot.floor - lot.lo + 0.9, glows: winGlows, apron: !!lot.lane });
      if (lot.type !== 'store' && lot.r[1] < 0.3 && path.nearestXZ(lot.xc, lot.zc).dist > 46) smokes.push([lot.xc, lot.floor + top - 0.6, lot.zc]);
      const cs = Math.cos(lot.yaw), sn = Math.sin(lot.yaw), ax = lot.r[1] < 0.5 ? -0.62 : 0.66, az = lot.lane ? 0.8 : 0.92;
      if (lot.r[2] > 0.38) bushes.push([lot.xc + cs * ax * lot.w + sn * az * lot.d, lot.zc - sn * ax * lot.w + cs * az * lot.d, lot.r[2]]);
      if (!lot.lane && lot.type !== 'store' && lot.type !== 'shed' && lot.r[2] > 0.3) {              // a garden wall with a tiled coping before the house
        const z0 = lot.d / 2 + 2.3, x0 = -lot.w / 2 - 0.6, x1 = lot.r[0] > 0.5 ? -1.3 : lot.w / 2 + 0.6, x2 = lot.r[0] > 0.5 ? 1.3 : x1;
        B.box(x0, -0.6, z0, x1, 1.25, z0 + 0.28, 8, lot.r); B.box(x0 - 0.06, 1.25, z0 - 0.12, x1 + 0.06, 1.4, z0 + 0.4, 1, lot.r);
        if (x2 < lot.w / 2) { B.box(x2, -0.6, z0, lot.w / 2 + 0.6, 1.25, z0 + 0.28, 8, lot.r); B.box(x2 - 0.06, 1.25, z0 - 0.12, lot.w / 2 + 0.66, 1.4, z0 + 0.4, 1, lot.r); }
      }
      // stacked firewood: under the front eave of a house on the lane, under the back eave of the others
      if (lot.lane ? lot.type !== 'store' && lot.r[0] > 0.3 : lot.r[0] > 0.45) { const zf = lot.lane ? lot.d / 2 + 0.12 : -lot.d / 2 - 0.75; B.box(-lot.w / 2 + 0.3, 0.02, zf, -lot.w / 2 + 2.0 + lot.r[2], lot.lane ? 1.05 : 1.25, zf + 0.45, 10, [0.3, 0.2, 0.12]); }
    } else if (lot.garden) {
      B.frame(0, 0, 0, 0);
      const cs = Math.cos(lot.yaw), sn = Math.sin(lot.yaw), w = lot.w * 0.9, d = lot.d * 0.9, c = (ax, az) => { const x = lot.xc + cs * ax * w / 2 + sn * az * d / 2, z = lot.zc - sn * ax * w / 2 + cs * az * d / 2; return [x, surfaceAt(x, z) + 0.12, z]; };
      B.poly([c(-1, -1), c(0, -1), c(0, 1), c(-1, 1)], 7, [0.5, 0.5, 0.5]); B.poly([c(0, -1), c(1, -1), c(1, 1), c(0, 1)], 7, [0.5, 0.5, 0.5], [w / 2, 0]);
      gardens.push([lot.xc + sn * (d / 2 + 1.5), lot.zc + cs * (d / 2 + 1.5), lot.r[0]]);
    }
  }
  B.mark('houses');
  if (opts.yield) await opts.yield();
  // along THE LANE: a plastered garden wall with a tiled coping closes each gap between the houses, on the fronts' line, following the slope
  B.frame(0, 0, 0, 0);
  for (const [x, z, yaw, len, r] of plan.gapWalls) {
    const cx = (Math.cos(yaw) * len) / 2, cz = (-Math.sin(yaw) * len) / 2, n = Math.max(1, Math.round(len / 2.2));
    for (let i = 0; i < n; i++) wallOn(B, surfaceAt, x - cx + (2 * cx * i) / n, z - cz + (2 * cz * i) / n, x - cx + (2 * cx * (i + 1)) / n, z - cz + (2 * cz * (i + 1)) / n, 1.2 + 0.25 * r[0], r);
  }
  // THE LANE'S SIDES: a plastered wall under a tiled coping runs along each hand of the lane 3 m from its middle, open at every house's gateway, at the
  // crossing lanes and where the leat passes under. Behind it, out to 6 m from the middle, the ground is a forecourt of flat stones before each house and a
  // kitchen plot of tilled rows before each gap
  if (plan.leat) {
    const rw = own('lanewalls'), laneX = plan.climb(4), zL = plan.leat[1], NL = plan.lanes.filter((l) => !l.climb).length;
    const tanAt = (z) => { const dx = laneX(z - 1.5) - laneX(z + 1.5), l = Math.hypot(dx, 3); return [dx / l, -3 / l]; };
    const at = (z, side, m) => { const t = tanAt(z), x = laneX(z); return [x - side * t[1] * m, z + side * t[0] * m]; };
    const G3 = (z, side, m) => { const p = at(z, side, m); return [p[0], surfaceAt(p[0], p[1]) + 0.1, p[1]]; };
    for (const side of [1, -1]) {
      const mine = plan.lots.filter((q) => q.lane && q.side === side);
      for (let z = -326, i = 0; z > -548; z -= 2.4, i++) {
        const tone = [rw(), rw(), rw()], zm = z - 1.2, pm = at(zm, side, 4.5);                                  // (the dice first)
        let cross = Math.abs(zm - zL) < plan.leat[3] / 2 + 1.9;
        for (let k = 0; k < NL && !cross; k++) cross = Math.abs(plan.contour(k)(pm[0]) - zm) < 3.6;
        if (cross) continue;
        const front = mine.find((q) => Math.abs(q.lz - zm) < q.w / 2 + 0.3);
        B.poly([G3(z, side, 3.15), G3(z, side, 6.0), G3(z - 2.4, side, 6.0), G3(z - 2.4, side, 3.15)], front ? 5 : 7, front ? [0.5, 0.5, 0.5] : tone, [0, 2.4 * i]);
        if (front && Math.abs(front.lz - zm) < 1.5) continue;                                                    // the gateway
        const a = at(z, side, 3.0), b = at(z - 2.4, side, 3.0);
        wallOn(B, surfaceAt, a[0], a[1], b[0], b[1], 1.35 + 0.2 * tone[0], tone);
      }
    }
  }
  B.mark('garden walls');
  // lanes: ribbons of paving laid on the ground
  for (const lane of plan.lanes) {
    let s = 0;
    for (let i = 0; i < lane.pts.length - 1; i++) {
      const a = lane.pts[i], b = lane.pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), nx = -dz / l * lane.w / 2, nz = dx / l * lane.w / 2;
      if (lane.j === 4 && plan.leat && (a[1] + b[1]) / 2 < plan.leat[1] + plan.leat[3] / 2 + 5.35 && (a[1] + b[1]) / 2 > plan.leat[1] - plan.leat[3] / 2 - 2.55) { s += l; continue; }   // (the bridge and its aprons carry the lane over the leat)
      const P = (p, sg) => { const x = p[0] + sg * nx, z = p[1] + sg * nz; return [x, surfaceAt(x, z) + 0.15, z]; };
      B.poly([P(a, -1), P(a, 1), P(b, 1), P(b, -1)], 5, [0.5, 0.5, 0.5], [0, s]); s += l;
    }
  }
  B.mark('lanes');
  if (opts.yield) await opts.yield();
  // THE QUAY: coursed stone standing in the water, a paved top six metres deep with a line of big coping stones on its lip. Its things are
  // set out from THE LANE'S FOOT (xF, where the route's line crosses the shore line): the slip 30 m west of it, the jetty 16 m east of it,
  // the breakwater from 58 m east of it. The slip is one sloping face of stone (no treads) let into the quay, running down under the water.
  const cS = Math.round((xF - 30 - QA) / 6 - 0.5), xS = QA + cS * 6;                                   // the slip takes one six-metre bay of the quay
  for (let x = QA, c = 0; x < QB; x += 6, c++) {
    const z0 = lip(x), z1 = lip(x + 6);
    if (c === cS) {
      B.poly([[x, 1.25, z0 - QD], [x + 6, 1.25, z1 - QD], [x + 6, -0.95, z1 + 4.6], [x, -0.95, z0 + 4.6]], 4, [0.5, 0.5, 0.8], [0, 0]);
      for (const [xe, ze] of [[x, z0], [x + 6, z1]]) B.poly([[xe, -2, ze - QD], [xe, -2, ze], [xe, 1.37, ze], [xe, 1.37, ze - QD]], 4, [0.5, 0.5, 0.4]);
      continue;
    }
    B.poly([[x, -2, z0], [x + 6, -2, z1], [x + 6, 1.37, z1], [x, 1.37, z0]], 4, [0.5, 0.5, 0.4], [x - QA, 0]);
    B.poly([[x, 1.37, z0], [x + 6, 1.37, z1], [x + 6, 1.37, z1 - 0.9], [x, 1.37, z0 - 0.9]], 4, [0.5, 0.5, 0.75], [x - QA, 0]);
    B.poly([[x, 1.25, z0 - 0.9], [x + 6, 1.25, z1 - 0.9], [x + 6, 1.37, z1 - 0.9], [x, 1.37, z0 - 0.9]], 4, [0.5, 0.5, 0.4], [x - QA, 0]);
    B.poly([[x, 1.25, z0 - 0.9], [x + 6, 1.25, z1 - 0.9], [x + 6, 1.25, z1 - QD], [x, 1.25, z0 - QD]], 5, [0.5, 0.5, 0.5], [x - QA, 0]);
    B.poly([[x + 6, -1, z1 - QD], [x, -1, z0 - QD], [x, 1.25, z0 - QD], [x + 6, 1.25, z1 - QD]], 4, [0.5, 0.5, 0.4], [x - QA, 0]);
  }
  for (const [x, sg] of [[QA, -1], [QB, 1]]) { const z = lip(x); B.poly(sg > 0 ? [[x, -2, z - QD], [x, -2, z], [x, 1.37, z], [x, 1.37, z - QD]] : [[x, -2, z], [x, -2, z - QD], [x, 1.37, z - QD], [x, 1.37, z]], 4, [0.5, 0.5, 0.4]); }
  const bw = [[xF + 58, lip(xF + 58)], [xF + 61, -300], [xF + 70, -284], [xF + 83, -274]];
  for (let i = 0; i < bw.length - 1; i++) { const a = bw[i], b = bw[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    B.frame((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2, Math.atan2(-(b[1] - a[1]), b[0] - a[0])); B.box(-l / 2 - 0.8, -3, -1.6, l / 2 + 0.8, 1.0, 1.6, 4, [0.5, 0.5, 0.3], 5); }
  // the timber jetty (five piles, unevenly) and seven stone bollards along the lip, unevenly
  const xJ = xF + 16;
  B.frame(xJ, 0, lip(xJ), 0); B.box(-0.95, 0.8, -0.3, 0.95, 1.0, 12.5, 9, [0.25, 0.2, 0.15], 9, true);
  for (const [px, pz] of [[-0.85, 2.0], [0.85, 4.4], [-0.85, 7.3], [0.85, 9.5], [-0.85, 12.2]]) B.pole(px, pz, -2.6, 1.45, 0.12, 10, [0.16, 0.12, 0.09], 6);
  B.skin(0, 0.9, 6.2, 6.8, 'jetty');
  B.frame(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) { const xb = xF - 88 + i * 26 + 7 * Math.sin(i * 2.3), x = xb > xS - 0.6 && xb < xS + 6.6 ? xS - 1.4 : xb, z = lip(x) - 0.45; B.pole(x, z, 1.37, 1.98, 0.17, 4, [0.5, 0.5, 0.4], 6, 0.13); B.box(x - 0.2, 1.98, z - 0.2, x + 0.2, 2.06, z + 0.2, 4, [0.5, 0.5, 0.4]); }
  B.mark('quay');
  // BOATS: three or five afloat (never a pair), long and low. The first lies nosed onto the slip; the others are moored along the quay, none within 14 m of the
  // route's line, 8 m of the jetty, 9 m of the slip or 10 m of another boat (every draw of a try is taken before its tests; 60 tries a boat at most)
  const rb = own('town-boats'), nBoats = rb() < 0.5 ? 3 : 5, berths = [];
  for (let tries = 0; berths.length < nBoats && tries < 60 * nBoats; tries++) {
    const len = rb.range(6.4, 8.2), beam = rb.range(1.25, 1.5), tint = [0.2 + 0.1 * rb(), 0.14 + 0.06 * rb(), 0.09], xr = rb.range(xF - 118, xF + 50), out = rb.range(2.6, 7.5), turn = rb.range(-0.3, 0.3), flip = rb() < 0.5;
    const first = berths.length === 0, x = first ? xS + 3 : xr, z = first ? lip(x) + 0.5 + len / 2 : lip(x) + out, yaw = first ? Math.PI / 2 + turn * 0.4 : (flip ? Math.PI : 0) + turn;
    if (!first && (Math.abs(x - xJ) < 8 || Math.abs(x - xS - 3) < 9 || path.nearestXZ(x, z).dist < 14 || berths.some((b) => Math.abs(b.x - x) < 10))) continue;
    berths.push({ x, z, yaw, len, beam, tint });
  }
  if (berths.length % 2 === 0) berths.pop();
  for (const b of berths) { B.frame(b.x, 0.02, b.z, b.yaw); addBoat(B, b.len, b.beam, b.tint); boats.push({ x: b.x, z: b.z }); B.skin(0, 0.3, 0, b.len / 2, 'boat'); }
  B.mark('boats');
  // SEVEN FISHING STAKES on the shoal that runs out from the islet's foot toward the town: a line of the lake's own, from 24 m north of the islet's middle,
  // bearing some 20 degrees west of north; they stand unevenly along it, and a stake that would stand within 14 m of the route's line is stepped on along the shoal
  const rs = own('town-stakes'), bear = ((-20 + rs.range(-4, 4)) * Math.PI) / 180, sdx = Math.sin(bear), sdz = -Math.cos(bear);
  for (let i = 0, s = 0; i < 7; i++) {
    const gapS = rs.range(7, 14), off = rs.range(-1.3, 1.3), h = rs.range(2.8, 4.6), lean = rs.range(-0.25, 0.25), turn = rs.range(0, 6);
    s += gapS; let x = 0, z = 0;
    for (let k = 0; k < 12; k++) { x = ISLET.x - 4 + sdx * s - sdz * off; z = ISLET.z - 24 + sdz * s + sdx * off; if (path.nearestXZ(x, z).dist >= 14) break; s += 4; }
    B.frame(x, 0, z, turn); B.poly([[-0.13, -3, 0], [0.13, -3, 0], [0.11 + lean, h, 0], [-0.11 + lean, h, 0]], 10, [0.16, 0.12, 0.09]); B.poly([[0, -3, -0.13], [0, -3, 0.13], [lean, h, 0.11], [lean, h, -0.11]], 10, [0.16, 0.12, 0.09]);
    stakes.push({ x, z, h }); B.skin(0, h / 2, 0, h / 2 + 0.3, 'stake');
  }
  B.mark('stakes');
  // LAMP POSTS, by rows, each row an odd number. THREE on the quay's lip, unevenly apart (two dealt gaps, 5.5 to 7.5 m and 9.5 to 12.5 m), seen together: one row, dealt as one, 23 m and more from the slip
  // (the plan builds no plastered store on the waterfront, and the boat shed stands beyond the quay's west end). THREE on each of the five cross lanes above the
  // waterfront, 36 m and more apart, none in a house. And by THE LANE an odd number of low lamps at doors, each in a gap between two houses, at the paving's edge
  // before the wall (2.45 m from the lane's middle) and 14 m and more from the next. A place that fails a test is dealt again (40 tries at most, each try's draw before its tests), never dropped.
  const rl = own('town-lamps'), spots = [];
  const rq = own('quay-lamps'), qOff = [-rq.range(5.5, 7.5), 0, rq.range(9.5, 12.5)];   // the quay's three stand unevenly: its two gaps are dealt, the one always the shorter
  let xq = xF - 60;
  for (let t = 0; t < 40; t++) { const x = rl.range(xF - 100, xF - 44); if (Math.abs(x - (xS + 3)) < 23 || qOff.some((e) => clearOf(x + e, 5.6, lip(x + e) - 0.75) < 10.5)) continue; xq = x; break; }
  for (const e of qOff) spots.push([xq + e, lip(xq + e) - 0.75, true]);
  const inHouse = (x, z) => plan.lots.some((q) => q.house && Math.hypot(q.xc - x, q.zc - z) < Math.max(q.w, q.d) / 2 + 0.8);
  for (let k = 1; k < 6; k++) { const row = [];
    for (let j = 0; j < 3; j++) { let x = -150 + 38 * j + 3 * k;
      for (let t = 0; t < 40; t++) { const xt = rl.range(-160, 150), zt = plan.contour(k)(xt) + 1.9; if (row.some((q) => Math.abs(q - xt) < 36) || inHouse(xt, zt) || clearOf(xt, surfaceAt(xt, zt) + 4.3, zt) < 10.5) continue; x = xt; break; }
      row.push(x); spots.push([x, plan.contour(k)(x) + 1.9, false]); } }
  const cands = plan.doorLamps.slice().sort((a, b) => a[2] - b[2]), n0 = cands.filter((c) => c[2] < 0.36).length, wantD = Math.max(3, n0 + 1 - (n0 % 2)), doors = [];
  for (const c of cands) { if (doors.length >= wantD) break; if (doors.some((q) => Math.hypot(q[0] - c[0], q[1] - c[1]) < 14) || clearOf(c[0], surfaceAt(c[0], c[1]) + 3, c[1]) < 3.2) continue; doors.push(c); }
  if (doors.length % 2 === 0) doors.pop();
  for (const [x, z, shore] of spots) {
    const y = shore ? 1.37 : surfaceAt(x, z) + 0.1;
    B.frame(x, y, z, 0); B.pole(0, 0, 0, 3.6, 0.1, 6, [0.3, 0.3, 0.3], 5, 0.08); B.box(-0.27, 3.6, -0.27, 0.27, 4.12, 0.27, 11, [6.5, 3.8, 1.5], 6, true); B.box(-0.4, 4.12, -0.4, 0.4, 4.2, 0.4, 6, [0.3, 0.3, 0.3]);
    lamps.push([x, y + 3.88, z]); pools.push({ x, y, z, shore }); B.skin(0, 2.1, 0, 2.2, 'lamp');
  }
  for (const [x, z] of doors) {                                   // a door lamp: a low timber post, a small lit head under a cap
    const y = surfaceAt(x, z) + 0.05;
    B.frame(x, y, z, 0); B.pole(0, 0, 0, 2.35, 0.07, 6, [0.3, 0.3, 0.3], 5); B.box(-0.2, 2.35, -0.2, 0.2, 2.8, 0.2, 11, [5.2, 3.0, 1.2], 6, true); B.box(-0.34, 2.8, -0.34, 0.34, 2.88, 0.34, 6, [0.3, 0.3, 0.3]);
    lamps.push([x, y + 2.58, z]); pools.push({ x, y, z, r: 4.6 }); B.skin(0, 1.5, 0, 1.6, 'door lamp');
  }
  B.mark('lamps');
  // the boat shed beyond the quay's west end
  { const x = QA - 16, z = waterZ(x) - 11.5; B.frame(x, surfaceAt(x, z) + 0.3, z, 0.12); addHouse(B, { w: 8.2, d: 5.2, type: 'shed', r: [0.3, 0.6, 0.2], lit: [], drop: 1.6 }); }
  // in the meadow at the town's upper edge: three farmhouses, each with three lit windows on its front; three vegetable plots
  // of tilled rows with bean poles (five, seven, five, unevenly set) hung with vines
  FIELD.houses.forEach(([x, z, turn], i) => {
    let hi = -1e9, lo = 1e9; for (const [ax, az] of [[-5, -3.5], [5, -3.5], [5, 3.5], [-5, 3.5], [0, 0]]) { const h = surfaceAt(x + ax, z + az); hi = Math.max(hi, h); lo = Math.min(lo, h); }
    B.frame(x, hi + 0.25, z, turn); addHouse(B, { w: 9.6 + i * 0.7, d: 6.2 + 0.4 * i, type: i === 1 ? 'hip' : 'gable', r: [0.35 + 0.2 * i, 0.62 - 0.25 * i, 0.3 + 0.2 * i], lit: [true, true, false, true, false, false], drop: hi - lo + 1.1, glows: winGlows });
    B.skin(0, 3, 0, 7, 'house');
  });
  B.frame(0, 0, 0, 0);
  FIELD.plots.forEach(([x, z, w, d, n], i) => {
    const c = (ax, az) => { const px = x + (ax * w) / 2, pz = z + (az * d) / 2; return [px, surfaceAt(px, pz) + 0.14, pz]; };
    B.poly([c(-1, -1), c(-1, 1), c(1, 1), c(1, -1)], 7, [0.5, 0.5, 0.5]);
    for (let k = 0; k < n; k++) {
      const px = x - w / 2 + 0.8 + ((k + (0.5 * ((k * 7 + i) % 3)) / 3) * (w - 1.6)) / n, pz = z + (i === 1 ? -1 : 1) * d * 0.22, g = surfaceAt(px, pz);
      B.pole(px, pz, g, g + 2.1 + 0.15 * (k % 2), 0.035, 9, [0.3, 0.24, 0.16], 5); B.box(px - 0.2, g + 0.25, pz - 0.2, px + 0.2, g + 1.5 + 0.2 * ((k * 3) % 2), pz + 0.2, 13, [0.13, 0.27, 0.08]);
    }
  });
  B.mark('meadow');
  // three net racks on the grass behind the quay (three poles, a rail, a net hung to dry), set out from the lane's foot
  for (const [x, yaw] of [[xF - 133, 0.2], [xF - 75, -0.35], [xF + 40, 0.1]]) {
    const z = waterZ(x) - 9.2; B.frame(x, surfaceAt(x, z), z, yaw);
    for (const px of [-2.3, 0.2, 2.3]) B.pole(px, 0, -0.2, 2.5, 0.06, 10, [0.2, 0.15, 0.1], 5, 0.05);
    B.box(-2.5, 2.42, -0.05, 2.5, 2.52, 0.05, 10, [0.2, 0.15, 0.1], 10, true);
    B.poly([[-2.3, 0.55, 0.03], [2.3, 0.75, 0.03], [2.3, 2.42, 0.03], [-2.3, 2.42, 0.03]], 9, [0.4, 0.35, 0.24]);
    B.poly([[2.3, 0.75, -0.03], [-2.3, 0.55, -0.03], [-2.3, 2.42, -0.03], [2.3, 2.42, -0.03]], 9, [0.4, 0.35, 0.24]);
    B.skin(0, 1.3, 0, 2.8, 'rack');
  }
  B.mark('racks');
  return { mesh: B.mesh(material, 'town'), lamps, posts: lamps.length, doorLamps: doors.length, quayRow: qOff.map((e) => xq + e), smokes, gardens, boats, bushes, stakes, pools, winGlows, skins: B.skins, marks: B.marks, triangles: B.I.length / 3, lipAt: lip };
}

// the warm pool each lamp lays on the paving or the ground under it: light added to what lies there (no shadow cast). The pool is a small net laid on
// the ground itself, so that on a slope it neither floats nor cuts into what stands there
export function makeLampPools(pools, surfaceAt, color, gain, time = { value: 0 }, rng = null) {
  const P = [], Q = [], I = [], H = [];
  for (const o of pools) {
    const N = o.n || 4, R = o.r || 5.2, i0 = P.length / 3, ph = rng ? rng.range(0, 6.283) : 0, sp = rng ? rng.range(6.5, 10) : 0;   // each flame flickers at a dealt speed and phase
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
      const ax = ((i / N) * 2 - 1) * R, az = Math.min(((j / N) * 2 - 1) * R, o.shore ? 0.72 : R), x = o.x + ax, z = o.z + az;   // on the quay the pool stops at the stone's lip
      P.push(x, o.shore ? o.y + 0.07 : surfaceAt(x, z) + 0.2, z); Q.push(ax / R, az / R); H.push(ph, sp);
    }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = i0 + j * (N + 1) + i; I.push(a, a + N + 2, a + 1, a, a + N + 1, a + N + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 2)); g.setAttribute('aPh', new THREE.Float32BufferAttribute(H, 2)); g.setIndex(I);
  const m = new THREE.ShaderMaterial({ name: 'LakeTownPools', uniforms: { uTime: time, uCol: { value: new THREE.Color(color).multiplyScalar(gain) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: /* glsl */`attribute vec2 aQ; attribute vec2 aPh; uniform float uTime; varying vec2 vQ; varying float vFl; void main() { vQ = aQ; vFl = 1.0 + 0.14*sin(uTime*aPh.y + aPh.x)*sin(uTime*aPh.y*0.37 + aPh.x*1.7); gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`precision highp float; uniform vec3 uCol; varying vec2 vQ; varying float vFl; void main() { float a = max(0.0, 1.0 - dot(vQ, vQ)); gl_FragColor = vec4(uCol*a*a*a*(0.5 + 0.5*a)*vFl, 1.0); }` });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'lamp pools'; mesh.renderOrder = 3;
  return mesh;
}
