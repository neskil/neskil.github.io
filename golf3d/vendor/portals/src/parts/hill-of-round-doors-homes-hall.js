// hill-of-round-doors, the homes: THE HALL behind the green door and the door's LEAF, in the last home's own space
// (x along the front, y up from the garden's level, z out of the hill: the hall runs toward -z). The hall is a
// passage with upright walls and a round vault, closed all round: floor of tiles at the plan's sill, walls and
// vault panelled in honey wood, ribs, round-headed side doors (shut), a peg rail with nothing on it, a bench, a
// runner, two hanging lamps alight and the glow of a hearth from a side room. It is lit in its own shader by its
// lamps and hearth and by the day that comes in at the round door as the leaf swings: no light is added to the scene.
// CLEAR AIR (the flown line enters at the door's middle, 2.6 m over the floor, and climbs 0.79 m to the exit 9 m
// in): walls 4.1 m either hand, ribs 3.9 m, the ribs' crown 3.71 m over the line at the exit, the first lantern's foot 3.64 m over it; the leaf, open
// at 96.5 degrees, 2.66 m (its knob), 2.9 m (its hinge edge).
import { DOOR, HALL, groundY, frontTop } from './hill-of-round-doors-plan.js';
import { KIND, mul } from './hill-of-round-doors-homes-geo.js';
import { layKnob } from './hill-of-round-doors-homes-front.js';
import { PATTERN_GLSL } from './hill-of-round-doors-homes-mat.js';
import { GLSL_FOG_PARS_VERT, GLSL_FOG_VERT, GLSL_FOG_PARS_FRAG } from '../kit/fx.js';

export const HW = 4.1, FLOOR = DOOR.sill, SPRING = 3.7, BACK = -HALL.depth, FRONT = -0.5;
// the leaf hangs on the side where the evening sun falls into the hall (x < 0), behind the wall's back face
export const HINGE = { side: -1, x: -3.0, z: -0.725, open: 96.5 * Math.PI / 180, thick: 0.15 };
export const RIBS = [-1.3, -4.1, -6.9, -9.7, -12.5];
// the lanterns hang from two ribs: [x, y of the flame, z, half height, radius]
export const LAMPS = [[0, 7.26, -4.1, 0.15, 0.13], [0, 6.9, -12.5, 0.36, 0.26]], HEARTH = [7.3, 1.35, -7.0];
// the archway to the side room in the right wall: the gap left in the wall, the opening's jambs, springing and radius
// the side room's round window, in the wall that faces the comer: [x, y, z] of its middle, in the hall's space
export const WINDOW = [6.3, 2.5, -9.0];
export const ARCHWAY = { z0: -8.4, z1: -5.6, top: 3.5, a: -8.2, b: -5.8, spring: 2.1, r: 1.2, deep: 0.5, room: 3.6 };

export function makeHallMaterial(THREE, look, sunLocal) {
  const night = look.hour === 'night' ? 0.3 : look.hour === 'dawn' ? 0.8 : 1;
  // the evening's cool blue, as bright as the look's sky: the pane of the side room's window and the light it lets in
  const sk = look.skyColor, luma = 0.2126 * sk.r + 0.7152 * sk.g + 0.0722 * sk.b, cool = new THREE.Color(0.32, 0.52, 1.0).multiplyScalar(0.35 + 1.1 * luma);
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uTime: { value: 0 }, uOpen: { value: 0 }, uGain: { value: 1.1 + 0.4 * look.lit },
    uSun: { value: new THREE.Vector3(sunLocal.x, sunLocal.y, sunLocal.z) }, uSunCol: { value: look.sunColor.clone().multiplyScalar(2.4 * night) },
    uSkyCol: { value: look.skyColor.clone().lerp(cool, 0.45).multiplyScalar(0.9) }, uSky: { value: cool.clone() }, uGlow: { value: new THREE.Color(1.0, 0.76, 0.5) },
    uWin: { value: new THREE.Vector3(WINDOW[0], WINDOW[1], WINDOW[2] + 0.5) }, uWinCol: { value: cool.clone().multiplyScalar(2.2) },
    uLampA: { value: new THREE.Vector3(LAMPS[0][0], LAMPS[0][1], LAMPS[0][2]) }, uLampB: { value: new THREE.Vector3(LAMPS[1][0], LAMPS[1][1], LAMPS[1][2]) }, uHearth: { value: new THREE.Vector3(...HEARTH) },
    uDoor: { value: new THREE.Vector4(0, DOOR.sill + DOOR.topR, DOOR.topR, 0) }, uLeaf: { value: new THREE.Vector4(HINGE.x, HINGE.z, -HINGE.side, 0) },
    uLeafC: { value: new THREE.Vector2(Math.abs(HINGE.x), DOOR.topR) },
  }]);
  const material = new THREE.ShaderMaterial({
    uniforms, fog: true, vertexColors: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 surf; varying vec4 vSurf; varying vec3 vCol, vP, vN;
      ${GLSL_FOG_PARS_VERT}
      void main(){ vSurf = surf; vCol = color; vP = position; vN = normal;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        ${GLSL_FOG_VERT} }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uOpen, uGain; uniform vec3 uSun, uSunCol, uSkyCol, uSky, uGlow, uLampA, uLampB, uHearth, uWin, uWinCol; uniform vec4 uDoor, uLeaf; uniform vec2 uLeafC;
      varying vec4 vSurf; varying vec3 vCol, vP, vN;
      ${PATTERN_GLSL}
      ${GLSL_FOG_PARS_FRAG}
      vec3 lampLight(vec3 p, vec3 n, vec3 lp, float power, float reach){
        vec3 d = lp - p; float r2 = dot(d, d), nl = dot(n, d) * inversesqrt(max(r2, 1e-4));
        return vec3((max(nl, 0.) * .85 + .15) * power / (1.9 + r2 * reach));
      }
      void main(){
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        float fw = max(fwidth(vSurf.y), fwidth(vSurf.z)) + 1e-4, rough; vec3 emit;
        vec3 base = hillPattern(floor(vSurf.x + .5), vSurf.yz, vSurf.w, vP, vCol, fw, uTime, uSky, uGlow, rough, emit);
        // each lamp flickers by itself, its phase by its own place; the hearth by its own noise; none of the three
        // brightens and dims more than twice a second
        float pa = dot(uLampA, vec3(1.3, 2.1, 1.7)), pb = dot(uLampB, vec3(1.3, 2.1, 1.7));
        float flA = .9 + .1 * sin(uTime * 7.3 + pa) * sin(uTime * 3.1 + 1.), flB = .9 + .1 * sin(uTime * 6.1 + pb) * sin(uTime * 2.3 + 4.);
        float fh = .5 + .5 * vnoise(vec2(uTime * 3.4, 3.3));
        vec3 L = vec3(.05, .052, .062);
        L += uGlow * (lampLight(vP, n, uLampA, 7.4, .13) * flA + lampLight(vP, n, uLampB, 9., .12) * flB) * uGain;
        L += vec3(1., .42, .12) * lampLight(vP, n, uHearth, 10., .2) * (fh * uGain);
        L += uWinCol * lampLight(vP, n, uWin, 1.7, .14);              // the evening through the side room's round window
        // the day through the round door: the sky's fill from the opening, and the sun where its rays come in at it
        vec3 dd = vec3(uDoor.xy, 0.) - vP; float r2 = dot(dd, dd); vec3 dn = dd * inversesqrt(max(r2, 1e-4));
        float area = uDoor.z * uDoor.z;
        L += uSkyCol * uOpen * (max(dot(n, dn), 0.) * .8 + .2) * max(dn.z, 0.) * area / (r2 + area);
        if (uSun.z > .05) {
          float t = -vP.z / uSun.z; vec2 q = vP.xy + uSun.xy * t - uDoor.xy;
          float inDoor = 1. - smoothstep(uDoor.z - .05 - .012 * t, uDoor.z + .03 + .012 * t, length(q));
          vec2 ld = uLeaf.zw, ln = vec2(-ld.y, ld.x); float den = dot(ln, uSun.xz), num = dot(ln, uLeaf.xy - vP.xz);
          float tl = num / (abs(den) > 1e-4 ? den : 1e-4); vec3 hit = vP + uSun * tl;
          float onLeaf = step(0.02, tl) * (1. - smoothstep(uLeafC.y - .04, uLeafC.y + .04, length(vec2(dot(hit.xz - uLeaf.xy, ld) - uLeafC.x, hit.y - uDoor.y))));
          L += uSunCol * (inDoor * (1. - onLeaf) * max(dot(n, uSun), 0.));
          L += uSunCol * (.035 * uOpen * uSun.z);                 // what the sunlit floor and wall throw back
        }
        vec3 col = base * L + emit;
        gl_FragColor = vec4(fxApplyFog(col), 1.);
      }`,
  });
  return { material, uniforms };
}

const ARC = 16;
// the hall's section from the left wall's foot over the vault to the right wall's foot: [x, y, outward nx, ny, s]
function section(inset = 0) {
  const r = HW - inset, pts = [[-r, FLOOR, -1, 0, 0], [-r, SPRING, -1, 0, SPRING - FLOOR]];
  for (let i = 1; i <= ARC; i++) { const a = Math.PI - Math.PI * i / ARC; pts.push([Math.cos(a) * r, SPRING + Math.sin(a) * r, Math.cos(a), Math.sin(a), SPRING - FLOOR + r * Math.PI * i / ARC]); }
  pts.push([r, FLOOR, 1, 0, (SPRING - FLOOR) * 2 + r * Math.PI]);
  return pts;
}

// The shell: tiled floor, boarded walls and vault, the boarded end wall, the inner face round the door; and the
// joinery that stands proud of it: skirting, dado and cornice rails, stiles, ribs. C: the colours (linear).
export function layHallShell(G, C, arch) {
  const S = section(), wood = C.wood, dark = mul(wood, 0.62), rib = C.rib || dark;
  G.poly([[-HW, FLOOR, FRONT], [HW, FLOOR, FRONT], [HW, FLOOR, BACK], [-HW, FLOOR, BACK]], [1, 1, 1], KIND.TILE, 0, { out: [0, 1, 0], uv: [[-HW, FRONT], [HW, FRONT], [HW, BACK], [-HW, BACK]] });
  for (let i = 0; i < S.length - 1; i++) {
    const a = S[i], b = S[i + 1], wall = i === 0 || i === S.length - 2, right = i === S.length - 2;
    // the right wall is left open where the side room's archway stands
    const runs = wall && right ? [[FRONT, arch.z1], [arch.z0, BACK]] : [[FRONT, BACK]];
    for (const [z1, z0] of runs) G.poly([[a[0], a[1], z1], [a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1]], wall ? wood : mul(wood, 1.14), KIND.BOARDS, wall ? 0.44 : 0.52,
      { out: [-a[2] - b[2], -a[3] - b[3], 0], uv: wall ? [[z1, a[1]], [z0, a[1]], [z0, b[1]], [z1, b[1]]] : [[a[4], z1], [a[4], z0], [b[4], z0], [b[4], z1]] });
  }
  if (arch) {      // the right wall over the archway
    G.poly([[HW, arch.top, arch.z1], [HW, arch.top, arch.z0], [HW, SPRING, arch.z0], [HW, SPRING, arch.z1]], wood, KIND.BOARDS, 0.44, { out: [-1, 0, 0], uv: [[arch.z1, arch.top], [arch.z0, arch.top], [arch.z0, SPRING], [arch.z1, SPRING]] });
  }
  // the two end walls: the far one whole, the near one with the round door cut out of it
  const outline = S.map((p) => [p[0], p[1]]);
  G.face(outline, [], BACK, mul(wood, 1.4), KIND.BOARDS, 0.44);       // the end wall: upright boards from floor to vault (its rails and stiles in layHallThings)
  G.box(-HW, FLOOR, BACK, HW, FLOOR + 0.42, BACK + 0.1, dark, KIND.BOARDS, 3, { skip: 'k' });
  G.push(new G.THREE.Matrix4().makeRotationY(Math.PI));
  G.face(outline, [G.circle(0, DOOR.sill + DOOR.topR, DOOR.topR + 0.02, 40)], -FRONT, dark, KIND.BOARDS, 0.5);
  G.pop();
  // joinery on both walls: skirting, dado rail, cornice; stiles between; all standing proud
  for (const sx of [-1, 1]) {
    const x0 = sx * HW, runs = sx > 0 && arch ? [[FRONT, arch.z1 + 0.3], [arch.z0 - 0.3, BACK]] : [[FRONT, BACK]];
    const bar = (y0, y1, proud, col, z1, z0) => G.box(Math.min(x0, x0 - sx * proud), y0, z0, Math.max(x0, x0 - sx * proud), y1, z1, col, KIND.BOARDS, 3, { skip: sx > 0 ? 'r' : 'l' });
    for (const [z1, z0] of runs) {
      bar(FLOOR, FLOOR + 0.42, 0.1, dark, z1, z0); bar(2.05, 2.22, 0.11, mul(wood, 0.8), z1, z0); bar(SPRING - 0.12, SPRING + 0.12, 0.16, mul(wood, 0.78), z1, z0);
      for (let z = z1 - 0.65; z > z0 + 0.3; z -= 1.3) { bar(FLOOR + 0.42, 2.05, 0.05, mul(wood, 0.86), z + 0.09, z - 0.09); bar(2.22, SPRING - 0.12, 0.05, mul(wood, 0.86), z + 0.09, z - 0.09); }
    }
  }
  // ribs: round arches of paler timber standing 0.2 m into the hall, on posts down the walls
  const Si = section(0.2);
  for (const z of RIBS) {
    const za = z + 0.16, zb = z - 0.16;
    for (let i = 0; i < S.length - 1; i++) {
      const a = Si[i], b = Si[i + 1], ao = S[i], bo = S[i + 1];
      if (i === S.length - 2 && arch && z < arch.z1 + 0.4 && z > arch.z0 - 0.4) continue;
      G.poly([[a[0], a[1], za], [a[0], a[1], zb], [b[0], b[1], zb], [b[0], b[1], za]], rib, KIND.BOARDS, 3, { out: [-a[2] - b[2], -a[3] - b[3], 0] });
      G.poly([[ao[0], ao[1], za], [a[0], a[1], za], [b[0], b[1], za], [bo[0], bo[1], za]], mul(rib, 0.85), KIND.BOARDS, 3, { out: [0, 0, 1] });
      G.poly([[ao[0], ao[1], zb], [a[0], a[1], zb], [b[0], b[1], zb], [bo[0], bo[1], zb]], mul(rib, 0.7), KIND.BOARDS, 3, { out: [0, 0, -1] });
    }
  }
}

// The archway's own wall face and jambs, and the side room behind it with its hearth (the fire is not seen
// straight on from the flown line: its glow is, on the room's walls and out over the hall's floor).
export function laySideRoom(G, C) {
  const A = ARCHWAY, wood = C.wood, zc = (A.a + A.b) / 2, pl = C.plaster;
  const notch = [[A.z1, FLOOR], [A.z1, A.top], [A.z0, A.top], [A.z0, FLOOR], [A.a, FLOOR], [A.a, A.spring]], head = [];
  for (let i = 1; i < 12; i++) { const t = Math.PI - Math.PI * i / 12; head.push([zc + Math.cos(t) * A.r, A.spring + Math.sin(t) * A.r]); }
  notch.push(...head, [A.b, A.spring], [A.b, FLOOR]);
  G.pushYaw(HW, 0, 0, -1, 0);                                  // local x runs along the hall, local z out of the wall into the hall
  G.face(notch, [], 0, wood, KIND.BOARDS, 0.44);
  const edge = [[A.a, FLOOR], [A.a, A.spring], ...head, [A.b, A.spring], [A.b, FLOOR]], trim = mul(wood, 0.7);
  const k = 1 + 0.2 / A.r, last = edge.length - 1;
  const outer = edge.map((p, j) => (j === 0 ? [p[0] - 0.2, p[1]] : j === last ? [p[0] + 0.2, p[1]] : [zc + (p[0] - zc) * k, A.spring + (p[1] - A.spring) * k]));
  for (let i = 0; i < last; i++) {                             // the jambs and the soffit through the wall, and a proud architrave
    const p = edge[i], q = edge[i + 1], mx = (p[0] + q[0]) / 2 - zc, my = (p[1] + q[1]) / 2 - A.spring;
    const o = i === 0 ? [1, 0, 0] : i === last - 1 ? [-1, 0, 0] : [-mx, -my, 0];
    G.poly([[p[0], p[1], 0.08], [p[0], p[1], -A.deep], [q[0], q[1], -A.deep], [q[0], q[1], 0.08]], [trim, mul(trim, 0.6), mul(trim, 0.6), trim], KIND.BOARDS, 3, { out: o });
    G.poly([[p[0], p[1], 0.08], [q[0], q[1], 0.08], [outer[i + 1][0], outer[i + 1][1], 0.08], [outer[i][0], outer[i][1], 0.08]], trim, KIND.BOARDS, 3, { out: [0, 0, 1] });
    G.poly([[outer[i][0], outer[i][1], 0], [outer[i][0], outer[i][1], 0.08], [outer[i + 1][0], outer[i + 1][1], 0.08], [outer[i + 1][0], outer[i + 1][1], 0]], mul(trim, 0.8), KIND.BOARDS, 3, { out: [-o[0], -o[1], 0] });
  }
  // the room: floor, three walls, ceiling (local z from -deep to -room)
  const x0 = zc - 2.0, x1 = zc + 2.0, zf = -A.deep, zb = -A.room, top = 3.5;
  G.poly([[x0, FLOOR, zf], [x1, FLOOR, zf], [x1, FLOOR, zb], [x0, FLOOR, zb]], [1, 1, 1], KIND.TILE, 0, { out: [0, 1, 0] });
  // the threshold through the wall's thickness, between the hall's tiles and the room's: slabs of stone
  G.poly([[A.a - 0.2, FLOOR, 0], [A.b + 0.2, FLOOR, 0], [A.b + 0.2, FLOOR, zf], [A.a - 0.2, FLOOR, zf]], C.stone, KIND.STONE, 2, { out: [0, 1, 0] });
  G.poly([[x0, top, zf], [x1, top, zf], [x1, top, zb], [x0, top, zb]], mul(wood, 0.8), KIND.BOARDS, 0.5, { out: [0, -1, 0] });
  G.poly([[x0, FLOOR, zb], [x1, FLOOR, zb], [x1, top, zb], [x0, top, zb]], pl, KIND.PLASTER, 0, { out: [0, 0, 1] });
  G.poly([[x0, FLOOR, zf], [x0, FLOOR, zb], [x0, top, zb], [x0, top, zf]], pl, KIND.PLASTER, 0, { out: [1, 0, 0] });
  G.poly([[x1, FLOOR, zf], [x1, FLOOR, zb], [x1, top, zb], [x1, top, zf]], pl, KIND.PLASTER, 0, { out: [-1, 0, 0] });
  for (const [xa, xb] of [[x0, A.z0], [A.z1, x1]]) G.poly([[xa, FLOOR, zf], [xb, FLOOR, zf], [xb, top, zf], [xa, top, zf]], pl, KIND.PLASTER, 0, { out: [0, 0, -1] });
  G.poly([[A.z0, A.top, zf], [A.z1, A.top, zf], [A.z1, top, zf], [A.z0, top, zf]], pl, KIND.PLASTER, 0, { out: [0, 0, -1] });
  // the hearth on the room's far wall: stone jambs and lintel, a dark firebox, embers and flames
  const st = C.stone, hx = zc, hw = 0.95;
  G.box(hx - hw - 0.4, FLOOR, zb, hx - hw, FLOOR + 1.9, zb + 0.45, st, KIND.STONE, 0.8, { skip: 'k' });
  G.box(hx + hw, FLOOR, zb, hx + hw + 0.4, FLOOR + 1.9, zb + 0.45, st, KIND.STONE, 0.8, { skip: 'k' });
  G.box(hx - hw - 0.55, FLOOR + 1.9, zb, hx + hw + 0.55, FLOOR + 2.35, zb + 0.55, mul(st, 1.05), KIND.STONE, 0.8, { skip: 'k' });
  G.poly([[hx - hw, FLOOR, zb + 0.02], [hx + hw, FLOOR, zb + 0.02], [hx + hw, FLOOR + 1.9, zb + 0.02], [hx - hw, FLOOR + 1.9, zb + 0.02]], [0.02, 0.015, 0.012], KIND.PAINT, 0, { out: [0, 0, 1] });
  G.poly([[hx - hw * 0.8, FLOOR + 0.05, zb + 0.4], [hx + hw * 0.8, FLOOR + 0.05, zb + 0.4], [hx + hw * 0.8, FLOOR + 0.35, zb + 0.1], [hx - hw * 0.8, FLOOR + 0.35, zb + 0.1]], [1, 0.5, 0.2], KIND.FLAME, 0.3, { out: [0, 1, 1] });
  for (let k = 0; k < 5; k++) { const fx = hx + (k - 2) * 0.3, fh = 0.6 + 0.35 * ((k * 3) % 4) / 3; G.poly([[fx - 0.16, FLOOR + 0.25, zb + 0.24], [fx + 0.16, FLOOR + 0.25, zb + 0.24], [fx + 0.03 * (k - 2), FLOOR + 0.25 + fh, zb + 0.2]], [1, 0.62, 0.22], KIND.FLAME, 0.1 * k, { out: [0, 0, 1] }); }
  G.pop();
}

// What stands in the hall: round-headed side doors (shut), a peg rail with nothing on it, a bench, a runner down
// the floor, two lanterns hanging from the vault's crown with their flames, and the far wall's boards and rails.
export function layHallThings(G, C) {
  const wood = C.wood, dark = mul(wood, 0.6), door = C.door, brass = C.brass;
  // side doors: [wall side, z of the middle]
  for (const [sx, zc] of [[-1, -8.3], [-1, -11.1], [1, -11.1]]) {
    G.pushYaw(sx * HW, 0, zc, -sx, 0);
    const hw = 0.8, bw = 0.16, sp = FLOOR + 1.9, zs = 0.14, za = 0.2, pts = [[hw, FLOOR], [hw, sp]];
    for (let i = 1; i < 10; i++) { const t = Math.PI * i / 10; pts.push([Math.cos(t) * hw, sp + Math.sin(t) * hw]); }
    pts.push([-hw, sp], [-hw, FLOOR]);
    const k = 1 + bw / hw, last = pts.length - 1;
    const out = pts.map((p, j) => (j === 0 ? [hw + bw, FLOOR] : j === last ? [-hw - bw, FLOOR] : [p[0] * k, sp + (p[1] - sp) * k]));
    G.poly(pts.map((p) => [p[0], p[1], zs]), door, KIND.BOARDS, 0.4, { out: [0, 0, 1] });
    for (let i = 0; i < last; i++) {                           // the architrave, standing proud of the door and of the wall's joinery
      const a = pts[i], b = pts[i + 1], ao = out[i], bo = out[i + 1], o = [(ao[0] + bo[0]) / 2, i === 0 || i === last - 1 ? 0 : (ao[1] + bo[1]) / 2 - sp, 0];
      G.poly([[a[0], a[1], za], [b[0], b[1], za], [bo[0], bo[1], za], [ao[0], ao[1], za]], dark, KIND.BOARDS, 3, { out: [0, 0, 1] });
      G.poly([[a[0], a[1], zs], [a[0], a[1], za], [b[0], b[1], za], [b[0], b[1], zs]], mul(dark, 0.7), KIND.BOARDS, 3, { out: [-o[0], -o[1], 0] });
      G.poly([[ao[0], ao[1], 0], [ao[0], ao[1], za], [bo[0], bo[1], za], [bo[0], bo[1], 0]], mul(dark, 0.85), KIND.BOARDS, 3, { out: o });
    }
    layKnob(G, sx * 0.48, FLOOR + 1.5, zs, brass, 0.1, true);
    G.pop();
  }
  // the peg rail and the bench under it, on the right wall between two ribs
  G.pushYaw(HW, 0, -2.7, -1, 0);
  G.box(-0.95, 2.72, 0, 0.95, 2.94, 0.07, mul(wood, 0.75), KIND.BOARDS, 3, { skip: 'k' });
  for (let k = 0; k < 5; k++) { const x = -0.72 + k * 0.36; G.tube([x, 2.83, 0.07], [x, 2.92, 0.36], 0.04, 0.05, 7, dark, KIND.PAINT, 0, { caps: true }); }
  G.box(-0.95, FLOOR + 0.92, 0.04, 0.95, FLOOR + 1.04, 0.78, wood, KIND.BOARDS, 0.26);
  for (const lx of [-0.8, 0.8]) for (const lz of [0.12, 0.68]) G.box(lx - 0.07, FLOOR, lz - 0.07, lx + 0.07, FLOOR + 0.92, lz + 0.07, dark, KIND.BOARDS, 3, { skip: 'bt' });
  G.box(-0.8, FLOOR + 0.3, 0.36, 0.8, FLOOR + 0.4, 0.44, dark, KIND.BOARDS, 3);
  G.pop();
  // the runner
  G.poly([[-1.15, FLOOR + 0.03, -1.6], [1.15, FLOOR + 0.03, -1.6], [1.15, FLOOR + 0.03, -11.6], [-1.15, FLOOR + 0.03, -11.6]], C.rug, KIND.RUG, 1.15,
    { out: [0, 1, 0], uv: [[-1.15, -1.6], [1.15, -1.6], [1.15, -11.6], [-1.15, -11.6]] });
  // the far wall (boarded upright from floor to vault in the shell), dressed as the side walls are: a dado rail,
  // a cornice and stiles between, all straight; nothing round stands on this wall
  const stile = mul(wood, 0.86);
  G.box(-HW, 2.05, BACK, HW, 2.22, BACK + 0.11, mul(wood, 0.8), KIND.BOARDS, 3, { skip: 'k' });
  G.box(-HW, SPRING - 0.12, BACK, HW, SPRING + 0.12, BACK + 0.16, mul(wood, 0.78), KIND.BOARDS, 3, { skip: 'k' });
  for (let x = -3.25; x < 3.3; x += 1.3) {
    G.box(x - 0.09, FLOOR + 0.42, BACK, x + 0.09, 2.05, BACK + 0.07, stile, KIND.BOARDS, 3, { skip: 'k' });
    G.box(x - 0.09, 2.22, BACK, x + 0.09, SPRING - 0.12, BACK + 0.07, stile, KIND.BOARDS, 3, { skip: 'k' });
  }
  // the lanterns: a chain from the crown, a cap, a foot, six thin posts, the flame
  const crown = SPRING + HW - 0.2;
  for (const [x, y, z, h, r] of LAMPS) {
    G.tube([x, y + h + 0.06, z], [x, crown, z], 0.025, 0.025, 5, mul(brass, 0.5), KIND.BRASS);
    G.tube([x, y + h, z], [x, y + h + 0.16, z], r * 1.15, 0.03, 8, brass, KIND.BRASS, 0, { caps: true });
    G.tube([x, y - h - 0.05, z], [x, y - h, z], r * 0.8, r * 1.1, 8, mul(brass, 0.7), KIND.BRASS, 0, { caps: true });
    for (let k = 0; k < 6; k++) { const t = k / 6 * Math.PI * 2, px = x + Math.cos(t) * r, pz = z + Math.sin(t) * r; G.tube([px, y - h, pz], [px, y + h, pz], 0.018, 0.018, 4, mul(brass, 0.8), KIND.BRASS); }
    G.ball(x, y - h * 0.15, z, r * 0.55, 8, 6, [1, 0.72, 0.3], KIND.FLAME, y, 0.75, 1.5, 0.75);
  }
}

// THE LEAF of the green door, laid about its hinge line (the pivot stands at HINGE.x, HINGE.z in the home's space
// and turns about y): a round slab 5.2 m across of broad boards in plain deep green, a brass knob in its very
// middle, two strap hinges on the hinge side. NO MARK of any kind on it. sun: the way to the sun in the home's
// space, for the shade the deep reveal lays on the shut leaf.
export function layLeaf(G, d, sun) {
  const r = DOOR.topR, cx = -HINGE.x, cy = DOOR.sill + r, t2 = HINGE.thick / 2, seg = 48, paint = d.paint, inner = mul(paint, 0.8);
  const depth = 0.16 - HINGE.z - t2, ox = sun.z > 0.12 ? sun.x / sun.z * depth : 0, oy = sun.z > 0.12 ? sun.y / sun.z * depth : 0;
  const rings = [0.5, 0.8, 0.92, 0.97, 1], ao = [1, 1, 0.92, 0.78, 0.6];
  const shade = (x, y, k) => { const m = Math.min(1, Math.max(0, (r - Math.hypot(x + ox, y + oy)) / 0.35)); return mul(paint, k * (0.5 + 0.5 * m * m * (3 - 2 * m))); };
  for (const [z, nz, own] of [[t2, 1, true], [-t2, -1, false]]) {
    const c0 = G.vert(cx, cy, z, 0, 0, nz, own ? shade(0, 0, 1) : inner, KIND.BOARDS, 0, 0, 1.04), first = G.vertices;
    for (let j = 0; j < rings.length; j++) for (let i = 0; i <= seg; i++) {
      const t = i / seg * Math.PI * 2, x = Math.cos(t) * r * rings[j], y = Math.sin(t) * r * rings[j];
      G.vert(cx + x, cy + y, z, 0, 0, nz, own ? shade(x, y, ao[j]) : inner, KIND.BOARDS, x, y, 1.04);
    }
    for (let i = 0; i < seg; i++) G.tri(c0, first + i, first + i + 1);
    for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < seg; i++) { const a = first + j * (seg + 1) + i, b = a + seg + 1; G.tri(a, b, a + 1); G.tri(a + 1, b, b + 1); }
  }
  G.barrel(cx, cy, r, -t2, t2, seg, mul(paint, 0.55), mul(paint, 0.7), KIND.PAINT, 0, false);
  layKnob(G, cx, cy, t2, d.brass, 0.24, true);
  // the straps run from the hinge line over the leaf's outer face
  const iron = d.iron, lit = mul(iron, 1.5), z1 = t2 + 0.06;
  for (const dy of [0.45 * r, -0.45 * r]) {
    const y = cy + dy, xt = cx + HINGE.side * r * 0.1, h0 = 0.21, h1 = 0.1;
    G.poly([[0.02, y - h0, z1], [xt, y - h1, z1], [xt, y + h1, z1], [0.02, y + h0, z1]], lit, KIND.PAINT, 0, { out: [0, 0, 1] });
    G.poly([[0.02, y + h0, t2], [0.02, y + h0, z1], [xt, y + h1, z1], [xt, y + h1, t2]], iron, KIND.PAINT, 0, { out: [0, 1, 0] });
    G.poly([[0.02, y - h0, t2], [0.02, y - h0, z1], [xt, y - h1, z1], [xt, y - h1, t2]], mul(iron, 0.6), KIND.PAINT, 0, { out: [0, -1, 0] });
    G.ring(xt, y, z1 + 0.004, 0, h1 * 2.3, 12, lit, lit, KIND.PAINT);
    G.tube([0, y - h0 * 1.6, 0], [0, y + h0 * 1.6, 0], 0.09, 0.09, 8, iron, KIND.PAINT, 0, { caps: true });
  }
}

// THE TURF OVER THE HALL: the land leaves its ground out over the plan's hall footprint, so the mound's own turf is
// laid there by this part: on the plan's ground, at the mound's full height from the front back, and nowhere less
// than 0.6 m over the hall's vault (behind the mound's crest the plan's ground falls away on the uphill side of
// the lane's line, and the hall's far end would stand out of it: there this turf is the hall's own barrow). It
// meets the plan's ground again inside its own edges, a hand's breadth proud of the land's mesh.
export function layRoof(G, home, turf) {
  const step = 0.5, nu = Math.ceil((HALL.half + 0.7) / step), v0 = 0.5, nv = Math.ceil((HALL.depth + 2 - v0) / step);
  const cover = (u, v) => {
    if (v > -BACK + 0.3) return -9;
    const a = Math.abs(u); return a <= HW ? SPRING + 0.6 + Math.sqrt(HW * HW - a * a) : SPRING + 0.6 - (a - HW) * 4;
  };
  const yAt = (u, v) => {
    const wx = home.x + home.fz * u - home.fx * v, wz = home.z - home.fx * u - home.fz * v;
    return Math.max(groundY(wx, wz) - home.y, v < 8 ? frontTop(home, u) : 0, cover(u, v)) + 0.05;
  };
  const wide = nu * 2 + 3, H = new Float32Array(wide * (nv + 3));          // heights, one cell wider all round for the slopes
  for (let j = -1; j <= nv + 1; j++) for (let i = -nu - 1; i <= nu + 1; i++) H[(j + 1) * wide + i + nu + 1] = yAt(i * step, v0 + j * step);
  const first = G.vertices;
  for (let j = 0; j <= nv; j++) for (let i = -nu; i <= nu; i++) {
    const k = (j + 1) * wide + i + nu + 1;
    G.vert(i * step, H[k], -(v0 + j * step), -(H[k + 1] - H[k - 1]) / (2 * step), 1, (H[k + wide] - H[k - wide]) / (2 * step), turf, KIND.TURF);
  }
  const row = nu * 2 + 1;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu * 2; i++) { const a = first + j * row + i, b = a + row; G.tri(a, a + 1, b); G.tri(a + 1, b + 1, b); }
}

// More of the hall's own things: the side room's round window (a pane of cool evening sky, its frame and glazing
// bars), a side table against the right wall with a bowl of fruit and a jug, and a shelf of plain crocks over it.
// Everything stands 3.4 m or more from the flown line.
export function layHallExtras(G, C) {
  const wood = C.wood, dark = mul(wood, 0.6), frame = C.plaster, [wx, wy, wz] = WINDOW;
  G.ring(wx, wy, wz + 0.02, 0, 0.64, 20, [1, 1, 1], [1, 1, 1], KIND.FLAME, -1);
  G.ring(wx, wy, wz + 0.07, 0.62, 0.82, 20, frame, mul(frame, 0.85), KIND.PAINT);
  G.barrel(wx, wy, 0.62, wz + 0.02, wz + 0.07, 20, mul(frame, 0.5), frame, KIND.PAINT, 0, true);
  G.box(wx - 0.63, wy - 0.03, wz + 0.03, wx + 0.63, wy + 0.03, wz + 0.07, frame, KIND.PAINT, 0, { skip: 'k' });
  G.box(wx - 0.03, wy - 0.63, wz + 0.03, wx + 0.03, wy + 0.63, wz + 0.07, frame, KIND.PAINT, 0, { skip: 'k' });
  // the side table: z from -5.47 to -4.43 along the right wall, its top 1.5 m over the floor
  const x0 = 3.42, x1 = 3.97, z0 = -5.47, z1 = -4.43, top = FLOOR + 1.5;
  G.box(x0, top - 0.08, z0, x1, top, z1, wood, KIND.BOARDS, 0.3);
  G.box(x0 + 0.05, top - 0.24, z0 + 0.05, x1 - 0.03, top - 0.08, z1 - 0.05, dark, KIND.BOARDS, 3, { skip: 't' });
  for (const lx of [x0 + 0.06, x1 - 0.1]) for (const lz of [z0 + 0.06, z1 - 0.13]) G.box(lx, FLOOR, lz, lx + 0.07, top - 0.24, lz + 0.07, dark, KIND.BOARDS, 3, { skip: 'bt' });
  G.box(x0 + 0.08, FLOOR + 0.3, z0 + 0.08, x1 - 0.06, FLOOR + 0.36, z1 - 0.08, mul(wood, 0.8), KIND.BOARDS, 0.3);
  // the bowl of fruit: a cream bowl, apples, pears and an orange heaped in it
  const bx = 3.7, bz = -4.72, cream = [0.78, 0.7, 0.52];
  G.tube([bx, top, bz], [bx, top + 0.15, bz], 0.11, 0.29, 10, mul(cream, 0.8), KIND.PAINT, 0, { cb: cream, caps: true });
  const fruit = [[0, 0.2, 0, [0.62, 0.07, 0.04]], [0.13, 0.17, 0.05, [0.42, 0.55, 0.1]], [-0.12, 0.17, 0.07, [0.85, 0.36, 0.04]], [0.02, 0.17, -0.13, [0.8, 0.62, 0.12]], [-0.06, 0.29, -0.02, [0.66, 0.1, 0.05]], [0.09, 0.28, -0.05, [0.5, 0.6, 0.14]]];
  for (const [fx, fy, fz, col] of fruit) G.ball(bx + fx, top + fy, bz + fz, 0.095, 7, 5, col, KIND.PAINT, 0, 1, 1, 1, mul(col, 0.6));
  // the jug: a round belly, a neck, a lip and a handle, in a blue-grey glaze
  const jx = 3.72, jz = -5.16, glaze = [0.2, 0.3, 0.46];
  G.ball(jx, top + 0.2, jz, 0.17, 9, 6, glaze, KIND.PAINT, 0, 1, 1.15, 1, mul(glaze, 0.6));
  G.tube([jx, top + 0.36, jz], [jx, top + 0.52, jz], 0.085, 0.11, 9, glaze, KIND.PAINT, 0, { cb: mul(glaze, 1.3) });
  G.tube([jx, top + 0.47, jz - 0.1], [jx, top + 0.4, jz - 0.27], 0.022, 0.022, 4, glaze, KIND.PAINT);
  G.tube([jx, top + 0.4, jz - 0.27], [jx, top + 0.18, jz - 0.17], 0.022, 0.022, 4, glaze, KIND.PAINT);
  // the shelf over it, on two brackets, with plain crocks: no mark on any of them
  const sy = 3.0;
  G.box(3.76, sy - 0.05, z0, HW, sy, z1, mul(wood, 0.85), KIND.BOARDS, 0.3, { skip: 'r' });
  for (const bz2 of [z0 + 0.14, z1 - 0.2]) G.poly([[HW, sy - 0.05, bz2], [3.8, sy - 0.05, bz2], [HW, sy - 0.38, bz2]], dark, KIND.BOARDS, 3, { out: [0, 0, 1] });
  const crocks = [[-5.28, 0.12, 0.3, [0.76, 0.68, 0.5]], [-5.0, 0.14, 0.22, [0.34, 0.2, 0.1]], [-4.74, 0.1, 0.36, [0.26, 0.36, 0.5]], [-4.52, 0.115, 0.26, [0.62, 0.42, 0.14]]];
  for (const [cz, cr, ch, col] of crocks) {
    G.tube([3.93, sy, cz], [3.93, sy + ch, cz], cr, cr * 0.92, 9, mul(col, 0.75), KIND.PAINT, 0, { cb: col, caps: true });
    G.ball(3.93, sy + ch + 0.03, cz, 0.04, 5, 4, mul(col, 1.2), KIND.PAINT);
  }
}
