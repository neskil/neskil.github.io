// railway-under-the-sea: the railcar (film worlds D; written by the lead). A REAL KIND, ours in every line: the
// two-axle rural rail-bus of the 1950s branch lines. ONE car, 12.6 m by 2.7 m, both ends alike and rounded in plan,
// chrome yellow with a pale silver-grey roof, a charcoal waist line, skirt and underframe. Its glass shows NOTHING
// inside: by day a dark sheen that takes the horizon's colour, by night an even warm light. No figure, no seat, no
// strap, no plate, no number, nothing lettered.
// Returns { object, length, place(noseZ), setNight(n), dispose() }. The object's origin is on the line under the
// car's middle at sea level; its nose points to -Z. place(noseZ) is a pure function of noseZ (no clock, no memory):
// each axle's centre stands on the line at its own z, the body on the chord between them, and the wheels are
// turned by the distance run. Four draw calls, about 9,000 triangles.
// WHAT READS THE EYE: only footprint filtering of the painted windows (fwidth) and the sheen on the glass (a
// reflection's law: it depends on the angle of view).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CAR, LEVEL, lineX } from './railway-under-the-sea-line.js';

const HALF = CAR.length / 2, HW = CAR.width / 2;          // 6.3, 1.35
const CORNER = 1.0, FLAT = HW - CORNER, STRAIGHT = HALF - CORNER;   // plan: corner radius, half flat of the end, half straight side
const N_RING = 96;

// one ring of the body's plan outline, inset by d (a parallel curve): N_RING points [x, z], from the nose's centre
// round the +x side to the tail and back along the -x side
function ringPoint(k, d) {
  const r = Math.max(CORNER - d, 0), w = d <= CORNER ? FLAT : Math.max(FLAT - (d - CORNER), 0);
  const cz = d <= CORNER ? STRAIGHT : HALF - d, q = Math.PI / 2;
  if (k < 2) return [w * (k / 2), -cz - r];
  if (k < 14) { const b = (k - 2) / 12 * q; return [w + r * Math.sin(b), -cz - r * Math.cos(b)]; }
  if (k < 34) return [w + r, -cz + (k - 14) / 20 * 2 * cz];
  if (k < 46) { const b = (k - 34) / 12 * q; return [w + r * Math.cos(b), cz + r * Math.sin(b)]; }
  if (k < 50) return [w - (k - 46) / 4 * 2 * w, cz + r];
  if (k < 62) { const b = (k - 50) / 12 * q; return [-w - r * Math.sin(b), cz + r * Math.cos(b)]; }
  if (k < 82) return [-w - r, cz - (k - 62) / 20 * 2 * cz];
  if (k < 94) { const b = (k - 82) / 12 * q; return [-w - r * Math.cos(b), -cz - r * Math.sin(b)]; }
  return [-w + (k - 94) / 2 * w, -cz - r];
}
// a skin through rings at the given [inset, height] levels (smooth normals; faces outward)
function skin(levels) {
  const pos = [], idx = [];
  for (const [d, y] of levels) for (let k = 0; k < N_RING; k++) { const p = ringPoint(k, d); pos.push(p[0], y, p[1]); }
  for (let l = 0; l < levels.length - 1; l++) for (let k = 0; k < N_RING; k++) {
    const a = l * N_RING + k, b = l * N_RING + (k + 1) % N_RING, c = a + N_RING, e = b + N_RING;
    idx.push(a, c, b, b, c, e);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const ROOF_Y = (d) => 3.05 + 0.33 * Math.sqrt(Math.max(1 - (1 - d / HW) * (1 - d / HW), 0));
function shellGeometry() {
  const levels = [[0.075, 0.62], [0.03, 0.86], [0.004, 1.2], [0, 1.4], [0, 2.2], [0, 2.95], [0.004, 3.05]];
  for (const d of [0.02, 0.05, 0.1, 0.18, 0.3, 0.46, 0.66, 0.88, 1.1, 1.26, HW]) levels.push([d, ROOF_Y(d)]);
  return skin(levels);
}
// paint a geometry one colour (for the merged "bits" mesh)
function tint(g, hex) {
  const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  const out = g.index ? g.toNonIndexed() : g; if (out !== g) g.dispose();
  for (const k of Object.keys(out.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'color') out.deleteAttribute(k);
  return out;
}
const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const tubeX = (r, len, x, y, z, seg = 14) => new THREE.CylinderGeometry(r, r, len, seg).rotateZ(Math.PI / 2).translate(x, y, z);
const tubeZ = (r0, r1, len, x, y, z, seg = 14) => new THREE.CylinderGeometry(r0, r1, len, seg).rotateX(Math.PI / 2).translate(x, y, z);

export async function buildRailcar(ctx, opts) {
  const group = new THREE.Group(); group.name = 'railcar';
  const made = [];
  const keep = (x) => { made.push(x); return x; };
  const uniforms = { uCarNight: { value: 0 } };

  // ---- the body shell: one skin; paint, window glass, frames and the doors are drawn in its material by place
  const shellMat = keep(new THREE.MeshStandardMaterial({ color: '#e3ab1c', roughness: 0.42, metalness: 0 }));
  shellMat.onBeforeCompile = (shader) => {
    shader.uniforms.uCarNight = uniforms.uCarNight;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vCarP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCarP = position;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n' + CAR_GLSL)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + CAR_PAINT);
  };
  shellMat.customProgramCacheKey = () => 'railway-under-the-sea-railcar-shell';
  const shell = new THREE.Mesh(keep(shellGeometry()), shellMat); shell.name = 'shell';
  group.add(shell);
  await ctx.yield();

  // ---- the bits: skirt, underframe, boxes and tanks, buffers, hooks, steps, vents, horns, lamp housings (one mesh)
  const bits = buildBits(); made.push(bits.geometry);
  const bitsMat = keep(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0 }));
  group.add(new THREE.Mesh(bits.geometry, bitsMat));
  await ctx.yield();

  // ---- the wheels: two axles, one instanced mesh, turned by the distance run
  const wheelGeo = keep(buildAxle());
  const wheelMat = keep(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.15 }));
  const wheels = new THREE.InstancedMesh(wheelGeo, wheelMat, 2); wheels.name = 'wheels'; wheels.frustumCulled = false;
  group.add(wheels);

  // ---- the lamps' lenses: plain light, not lit by the sun (front: three warm; tail: two small red)
  const lampMat = keep(new THREE.MeshBasicMaterial({ vertexColors: true }));
  group.add(new THREE.Mesh(keep(buildLamps()), lampMat));

  const m4 = new THREE.Matrix4(), rot = new THREE.Matrix4(), axleY = LEVEL.railHead + CAR.wheelRadius;
  function place(noseZ) {
    const zm = noseZ + HALF, za = zm + CAR.axles[0], zb = zm + CAR.axles[1];
    const xa = lineX(za), xb = lineX(zb);
    group.position.set((xa + xb) / 2, 0, zm);
    group.rotation.y = Math.atan((xa - xb) / (za - zb));
    const turn = (noseZ - 40) / CAR.wheelRadius;                 // rolls toward -Z as noseZ falls
    rot.makeRotationX(turn);
    for (let i = 0; i < 2; i++) { m4.copy(rot).setPosition(0, axleY, CAR.axles[i]); wheels.setMatrixAt(i, m4); }
    wheels.instanceMatrix.needsUpdate = true;
  }
  function setNight(n) {
    const v = n < 0 ? 0 : n > 1 ? 1 : n;
    uniforms.uCarNight.value = v; lampMat.color.setScalar(0.8 + 1.1 * v);
  }
  place(40); setNight(0);
  return { object: group, length: CAR.length, place, setNight, dispose() { for (const x of made) x.dispose(); } };
}

// PLACEHOLDERS (filled below in this file)
const CAR_GLSL = makeCarGlsl(), CAR_PAINT = makeCarPaint();

// a point of the body's skin at the END of the car: t metres along the plan outline from the nose's centre (signed:
// +x side positive), at height y. Returns [x, y, z, nx, nz] for the nose end (-Z); the tail is its mirror.
function endPoint(t, y) {
  const d = y < 0.86 ? 0.075 + (0.03 - 0.075) * (y - 0.62) / 0.24 : y < 1.2 ? 0.03 + (0.004 - 0.03) * (y - 0.86) / 0.34 : 0;
  const r = CORNER - d, a = Math.abs(t), s = t < 0 ? -1 : 1;
  if (a <= FLAT) return [t, y, -(STRAIGHT + r), 0, -1];
  const b = (a - FLAT) / CORNER;
  return [s * (FLAT + r * Math.sin(b)), y, -(STRAIGHT + r * Math.cos(b)), s * Math.sin(b), -Math.cos(b)];
}
// a short round thing set on the skin at an end point, its axis along the skin's normal (end = -1 nose, +1 tail)
function onSkin(geo, t, y, end, out = 0) {
  const p = endPoint(t, y), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(p[3], 0, p[4]));
  geo.applyQuaternion(q).translate(p[0] + p[3] * out, p[1], p[2] + p[4] * out);
  if (end > 0) geo.rotateY(Math.PI);
  return geo;
}
const LAMPS = [[-0.62, 1.05, 0.11], [0.62, 1.05, 0.11], [0, 2.9, 0.085]];      // [t, y, radius] of the three lamps of an end
const TAILS = [[-0.9, 1.05, 0.05], [0.9, 1.05, 0.05]];                          // the two small red lamps of an end

function buildBits() {
  const dark = '#232527', steel = '#3a3d40', grey = '#b4b9bd', bright = '#c9cdd0', G = [];
  G.push(tint(skin([[0.085, 0.36], [0.07, 0.64]]), dark));                       // the skirt
  G.push(tint(box(2.5, 0.04, 12.2, 0, 0.6, 0), dark));                           // the floor's underside
  for (const e of [-1, 1]) {
    G.push(tint(box(2.1, 0.18, 0.14, 0, 0.55, e * 6.06), dark));                 // headstock
    for (const x of [-0.875, 0.875]) {
      G.push(tint(tubeZ(0.05, 0.05, 0.46, x, 0.72, e * 6.3, 10), steel));        // buffer stem
      G.push(tint(tubeZ(0.16, 0.16, 0.045, x, 0.72, e * 6.54, 16), steel));      // buffer head
    }
    G.push(tint(box(0.07, 0.13, 0.24, 0, 0.7, e * 6.38), steel));                // the hook
    for (const z of [-4.0, -1.4, 1.4, 4.0]) if (e < 0) G.push(tint(new THREE.CylinderGeometry(0.11, 0.135, 0.1, 12).translate(0, 3.42, z), grey));   // roof vents
    for (const x of [-0.2, 0.2]) G.push(tint(tubeZ(e < 0 ? 0.07 : 0.03, e < 0 ? 0.03 : 0.07, 0.3, x, 3.4, e * 4.75, 10), grey));                  // the horns
    for (const [t, y, r] of LAMPS) G.push(tint(onSkin(new THREE.CylinderGeometry(r + 0.025, r + 0.035, 0.07, 18).rotateX(Math.PI / 2), t, y, e, 0.03), bright));
    for (const [t, y, r] of TAILS) G.push(tint(onSkin(new THREE.CylinderGeometry(r + 0.015, r + 0.02, 0.05, 12).rotateX(Math.PI / 2), t, y, e, 0.02), dark));
  }
  // under the floor between the axles: engine, tanks, battery box, exhaust
  G.push(tint(box(1.5, 0.34, 1.0, 0.25, 0.43, 0.3), dark));
  G.push(tint(tubeZ(0.17, 0.17, 1.5, -0.72, 0.43, -0.7, 14), steel));
  G.push(tint(box(0.5, 0.3, 0.9, -0.75, 0.45, 1.25), dark));
  G.push(tint(tubeZ(0.12, 0.12, 1.0, 0.75, 0.47, -1.6, 12), steel));
  G.push(tint(tubeZ(0.04, 0.04, 2.4, 0.2, 0.3, -1.3, 8), steel));
  // axle boxes and leaf springs, steps under the two doors
  for (const z of CAR.axles) for (const x of [-0.98, 0.98]) {
    G.push(tint(box(0.16, 0.2, 0.3, x, LEVEL.railHead + CAR.wheelRadius, z), steel));
    G.push(tint(box(0.08, 0.05, 1.1, x, 0.55, z), dark));
  }
  for (const s of [-1, 1]) {
    G.push(tint(box(0.22, 0.035, 1.3, s * 1.37, 0.42, s * 2.2), steel));
    for (const dz of [-0.6, 0.6]) G.push(tint(box(0.03, 0.2, 0.03, s * 1.32, 0.52, s * 2.2 + dz), steel));
  }
  const geometry = mergeGeometries(G, false); for (const g of G) g.dispose();
  return { geometry };
}
function buildAxle() {
  const G = [];
  for (const s of [-1, 1]) {
    G.push(tint(tubeX(CAR.wheelRadius, 0.13, s * 0.75, 0, 0, 30), '#4b4f53'));           // the wheel
    G.push(tint(tubeX(CAR.wheelRadius + 0.035, 0.03, s * 0.67, 0, 0, 30), '#3c3f42'));   // its flange (inside)
    G.push(tint(tubeX(0.13, 0.2, s * 0.75, 0, 0, 12), '#2a2c2e'));                        // the hub
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; G.push(tint(box(0.02, 0.05, 0.05, s * 0.82, 0.24 * Math.cos(a), 0.24 * Math.sin(a)), '#1c1d1f')); }   // bolts, so a turn shows
  }
  G.push(tint(tubeX(0.065, 1.5, 0, 0, 0, 10), '#2a2c2e'));
  const g = mergeGeometries(G, false); for (const x of G) x.dispose();
  return g;
}
function buildLamps() {
  const G = [];
  for (const e of [-1, 1]) {
    for (const [t, y, r] of LAMPS) G.push(tint(onSkin(new THREE.CircleGeometry(r, 18), t, y, e, 0.068), e < 0 ? new THREE.Color(1.5, 1.28, 0.85) : '#191c1f'));
    for (const [t, y, r] of TAILS) G.push(tint(onSkin(new THREE.CircleGeometry(r, 12), t, y, e, 0.048), e > 0 ? new THREE.Color(1.35, 0.1, 0.06) : '#2a0806'));
  }
  const g = mergeGeometries(G, false); for (const x of G) x.dispose();
  return g;
}

// ---- the shell's paint and glass, drawn by place on the skin (u: metres round the plan outline from the nose's
// centre, the same on both sides by the car's half-turn symmetry; y: height)
function makeCarGlsl() {
  return /* glsl */`
varying vec3 vCarP;
uniform float uCarNight;
float carBox(vec2 p, vec2 c, vec2 h, float r) { vec2 d = abs(p - c) - h + r; return length(max(d, 0.) + 1e-5) + min(max(d.x, d.y), 0.) - r; }
float carPeri(vec2 q) {
  float x = q.x, z = q.y, ax = max(x - 0.35, 0.);
  if (z < -5.3) return x <= 0.35 ? x : 0.35 + atan(ax, max(-(z + 5.3), 1e-4));
  if (z > 5.3) return x <= 0.35 ? 14.4416 - x : 12.5208 + atan(max(z - 5.3, 0.), max(ax, 1e-4));
  return 7.2208 + z;
}
// distance to the nearest pane of glass (negative inside): the wrapped three-pane screens of both ends, four big
// side windows, the two glazed door leaves, a fifth window, and the row of small roof-edge lights above them
float carGlass(float u, float y) {
  vec2 p = vec2(u, y);
  float d = carBox(p, vec2(0., 2.16), vec2(0.6, 0.56), 0.1);
  d = min(d, carBox(p, vec2(14.4416, 2.16), vec2(0.6, 0.56), 0.1));
  d = min(d, carBox(p, vec2(1.17, 2.16), vec2(0.45, 0.56), 0.1));
  d = min(d, carBox(p, vec2(13.2716, 2.16), vec2(0.45, 0.56), 0.1));
  float j = clamp(floor((u - 3.42) / 1.47 + 0.5), 0., 3.);
  d = min(d, carBox(p, vec2(3.42 + 1.47 * j, 2.135), vec2(0.625, 0.585), 0.12));
  d = min(d, carBox(p, vec2(11.02, 2.135), vec2(0.625, 0.585), 0.12));
  d = min(d, carBox(p, vec2(9.05, 2.03), vec2(0.27, 0.67), 0.07));
  d = min(d, carBox(p, vec2(9.8, 2.03), vec2(0.27, 0.67), 0.07));
  float i = clamp(floor((u - 3.42) / 1.52 + 0.5), 0., 5.);
  d = min(d, carBox(p, vec2(3.42 + 1.52 * i, 3.15), vec2(0.5, 0.058), 0.05));
  return d;
}
// distance to the double door's gaps (its outline and the line between its two leaves)
float carDoor(float u, float y) {
  float d = abs(carBox(vec2(u, y), vec2(9.425, 1.76), vec2(0.75, 1.1), 0.03));
  return (y > 0.66 && y < 2.86) ? min(d, abs(u - 9.425)) : d;
}`;
}
function makeCarPaint() {
  return /* glsl */`
{
  vec2 cq = vCarP.x >= 0. ? vCarP.xz : -vCarP.xz;
  float cu = carPeri(cq), cy = vCarP.y;
  float gd = carGlass(cu, cy), aa = fwidth(gd) + 1e-4, ay = fwidth(cy) + 1e-4;
  float glass = 1. - smoothstep(-aa, aa, gd);
  float frame = (1. - smoothstep(0.034 - aa, 0.034 + aa, gd)) * (1. - glass);
  vec3 paint = diffuseColor.rgb;
  paint = mix(paint, vec3(0.045, 0.047, 0.05), smoothstep(1.4 - ay, 1.4 + ay, cy) * (1. - smoothstep(1.455 - ay, 1.455 + ay, cy)));
  paint *= mix(0.8, 1., smoothstep(0.62, 1.2, cy));
  paint *= 0.96 + 0.04 * sin(cu * 6.1 + cy * 2.3) * sin(cy * 3.7);
  float roof = smoothstep(3.035 - ay, 3.035 + ay, cy);
  paint = mix(paint, vec3(0.6, 0.63, 0.65) * (0.93 + 0.07 * sin(vCarP.z * 9.)), roof);
  paint = mix(paint, vec3(0.05, 0.05, 0.055), (1. - smoothstep(0.012, 0.012 + ay, abs(cy - 3.015))) * 0.8);
  float dg = carDoor(cu, cy), ag = fwidth(dg) + 1e-4;
  paint = mix(paint, vec3(0.03), (1. - smoothstep(0.007, 0.007 + ag, dg)) * 0.9);
  paint = mix(paint, vec3(0.74, 0.76, 0.78), frame);
  diffuseColor.rgb = mix(paint, vec3(0.035, 0.05, 0.065), glass);
  roughnessFactor = mix(mix(mix(roughnessFactor, 0.6, roof), 0.3, frame), 0.06, glass);
  float fz = 1. - clamp(dot(normalize(vViewPosition), normal), 0., 1.);
  vec3 sheen = vec3(0.1);
  #ifdef USE_FOG
    sheen = fogColor * (0.1 + 0.75 * fz * fz * fz);
  #endif
  totalEmissiveRadiance += glass * (sheen * (1. - 0.6 * uCarNight) + uCarNight * vec3(1.55, 1.3, 0.86));
}`;
}
