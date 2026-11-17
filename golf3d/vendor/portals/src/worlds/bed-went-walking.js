// THE BED WENT WALKING: a Sunday colour page of about 1908 stood up as a place.
// Flat print (post.flat): every colour written is the colour shown; nothing is lit; no inverse tone map anywhere.
// Line is 2 px pen everywhere (hulls, fwidth lines in each material), shade is ruling, tints sit off register.
// +Z is the course. Panels (sky tints) change only at the three black panel gates.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, PALETTE, makeStyle, STYLE_GLSL, tintMaterial, hullMaterial, latheGeo } from '../parts/bed-went-walking.js';

// ---------------------------------------------------------------------------------------------- the plan of the page
const GATES = [                       // z, x centre, width, height: black frames standing in the page gutters
  { z: 260, x: 0, w: 44, h: 90 },
  { z: 760, x: 0, w: 60, h: 210 },
  { z: 1150, x: 81.4, w: 207.8, h: 330 },   // from the port wall to beyond the palace: the bed on the domes walks through it, and no post stands between the lens and the domes
];
const WALL_X = 24, BLOCK_W = 66, COL_PITCH = 90, BLOCK_D = 58, KERB = 17, STOREY = 3.7;
const PANEL_ROWS = [                  // rows of blocks between the gutters: [z of first lot edge, row pitch, rows]
  [-94, 70, 5], [266, 69.7, 7], [766, 75.6, 5], [1156, 70, 10],
];
const PALACE = { z0: 900, z1: 1340, x0: 30, x1: 116, domeX: 78, colY: 30, roofY: 36, spireZ: 1330, spireH: 190 };
const DOMES = [0, 1, 2, 3, 4, 5, 6].map((i) => ({ z: 930 + i * 58, h: [112, 128, 118, 140, 122, 138, 154][i], r: 27 }));
const FORECOURT_Z = 1352, LAND = [0, 0, 1560];
const BED_LAND = [0, 0, 1565];        // the bed comes down astride the last panel, 5 m beyond its centre: from the dive the whole panel shows under the foot rail
const COURT = { x: 44, z: 1672 };   // the forecourt is a closed court: a colonnaded wing along x 44, an end pavilion across z 1672
const panelOfZ = (z) => (z < GATES[0].z ? 0 : z < GATES[1].z ? 1 : z < GATES[2].z ? 2 : 3);

// every block lot of the city: { x, z (centre), w, d, panel, col (signed column, -1 = first to port), row }
function cityLots() {
  const lots = [];
  PANEL_ROWS.forEach(([z0, pitch, rows], panel) => {
    for (let r = 0; r < rows; r++) for (let c = 0; c < 8; c++) for (const s of [-1, 1]) {
      const x = s * (WALL_X + BLOCK_W / 2 + c * COL_PITCH), z = z0 + pitch * r + BLOCK_D / 2;
      if (s > 0 && c === 0 && z + BLOCK_D / 2 > PALACE.z0 - 6) continue;            // the palace and its forecourt
      if (s > 0 && c === 1 && z > FORECOURT_Z) continue;
      lots.push({ x, z, w: BLOCK_W, d: BLOCK_D, panel, col: s * (c + 1), row: r });
    }
  });
  const [z0, pitch, rows] = PANEL_ROWS[3];
  for (let r = 0; r < rows; r++) {
    const z = z0 + pitch * r + BLOCK_D / 2;
    if (z > FORECOURT_Z) lots.push({ x: WALL_X + BLOCK_W / 2 + COL_PITCH, z, w: BLOCK_W, d: BLOCK_D, panel: 3, col: 2, row: r, extra: true });
    if (z - BLOCK_D / 2 > COURT.z + 30) lots.push({ x: WALL_X + BLOCK_W / 2, z, w: BLOCK_W, d: BLOCK_D, panel: 3, col: 1, row: r, extra: true });
  }
  return lots;
}
const hashRng = (x, z) => {            // a tiny stand-in for ctx.rng, fixed by place
  let i = 0; const f = () => { const v = Math.sin(x * 12.9898 + z * 78.233 + (i++) * 37.719) * 43758.5453; return v - Math.floor(v); };
  f.int = (a, b) => a + Math.floor(f() * (b - a + 1)); f.range = (a, b) => a + f() * (b - a); return f;
};

// the camera line: the brief's journey, in metres. The last 70 m are a straight 30 degree dive into the last panel.
// u 0.28 to 0.33 a rising turn at 45 degrees round the fore port knee (from starboard of it, round its back at u 0.315, to port); the bed
// then strides ahead and sinks on folded knees, and from u 0.34 to 0.42 we climb the avenue's centre line between its two hind thighs with
// the bed whole above and ahead; u 0.42 to 0.5 out to port beside the hind port leg to y 188, u 0.5 to 0.565 over the quilt between the
// rails, then down toward the domes.
const ROUTE = [
  [-10, 16, 0], [-10, 16, 34], [-10, 16.5, 66], [-11, 26, 98], [-11.5, 30.5, 128], [-9.5, 25, 176], [-3, 10.5, 232], [0, 9, 262],
  [0, 8.5, 330], [0, 9, 400], [3, 9, 442], [4.5, 9.5, 474],
  [2, 25, 492], [-5.5, 47, 513], [-9.5, 60, 537], [-1, 72, 557], [0, 90, 596],          // the knee: a rising turn round the back of the fore port knee, street to y 60; then under the crouching bed
  [0, 114, 628], [-2.5, 142, 658], [-8.5, 164, 694], [-12.5, 178, 734], [-11.5, 185, 776],      // the climb: straight up the avenue between the hind thighs, then beside the hind port leg, to the top of gate two
  [-5, 189.5, 808], [0, 188, 836], [0, 188, 870], [0, 189.5, 904],                        // over the quilt: the eye 4 m above it, centred between the rails
  [-6, 178, 950], [5, 158, 1012], [30, 198, 1080],
  [38, 200, 1150], [36, 186, 1205], [42, 173, 1258], [38, 176, 1302], [20, 154, 1344], [5, 119, 1388], [0, 83, 1432], [0, 44, 1499.4], [0, 26.5, 1529.7], [0, 9, 1560],
];
const U_LAND = 0.95;                   // the bed comes down astride the last panel

export default {
  id: 'bed-went-walking',
  name: 'The Bed Went Walking',
  category: 'artists',
  placeKind: 'city',
  after: 'Winsor McCay, about 1869 to 1934',
  weirdness: 0.7,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), vary = ctx.vary || {};
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();
    const path = makePath(ROUTE);
    await ctx.yield();
    // ------------------------------------------------------------------------------------------ the edition, chosen once
    const pick = rng();
    const edition = vary.hour === 'night' ? 'late' : pick < 0.34 ? 'sunday' : pick < 0.56 ? 'late' : pick < 0.78 ? 'snow' : 'mirror';
    const rare = !!vary.rare, snow = edition === 'snow', mirror = edition === 'mirror';
    const C = PALETTE.map((h) => new THREE.Color(h));
    const col = { paper: C[0], lemon: C[1], salmon: C[2], green: C[3], powder: C[4], night: C[5], ink: C[6] };
    const skyOrder = edition === 'late' ? [col.salmon, col.powder, col.night, col.lemon] : [col.lemon, col.salmon, col.powder, col.night];
    const nightPanel = skyOrder.indexOf(col.night);
    // walls: never the panel's own sky tint; in the night panel they are night blue with the windows left as paper
    const wallsOf = (p) => (p === nightPanel ? [col.night, col.night, col.night, col.powder]
      : [col.lemon, col.salmon, col.powder, col.green, col.paper].filter((c) => c !== skyOrder[p]));
    const STYLE = makeStyle(PALETTE);                        // this build's own shared uniforms (handed to the hero too)
    const U = {                                              // uniforms every material of the page shares
      ...STYLE, uCamZ: { value: 0 }, uU: { value: 0 }, uSnow: { value: snow ? 1 : 0 }, uMirror: { value: mirror ? 1 : 0 },
      uWalk: { value: new THREE.Vector4(0, 0, 0, 0) },       // rare: lift, z shift, stride phase, on
    };
    const tmp = { v: new THREE.Vector3(), v2: new THREE.Vector3(), m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(1, 1, 1) };
    const disposables = [];
    await ctx.yield();
    // ------------------------------------------------------------------------------------------ the sky: one flat tint per panel
    const gateU = GATES.map((g) => new THREE.Vector4(g.z, g.x, g.w / 2, g.h));
    const skyMat = new THREE.ShaderMaterial({
      uniforms: { ...U, uGate: { value: gateU }, uSky: { value: skyOrder }, uPanel: { value: 0 }, uNight: { value: nightPanel },
        uLemon: { value: col.lemon }, uMoon: { value: new THREE.Vector3(0.5, 0.52, 0.75).normalize() } },
      depthWrite: false, depthTest: false, side: THREE.BackSide,
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main(){
          vDir = position;
          vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
          if (abs(p.w) < 1e-4) p.w = 1e-4;
          gl_Position = p.xyww;
        }`,
      fragmentShader: /* glsl */`
        ${STYLE_GLSL}
        uniform vec4 uGate[3]; uniform vec3 uSky[4]; uniform float uPanel, uNight; uniform vec3 uLemon, uMoon;
        varying vec3 vDir;
        // one gate: does the ray leave the panel it is in through this opening?  cur and alive are carried along
        void gate(vec4 g, float from, float stepTo, vec3 ro, vec3 rd, inout float cur, inout float alive){
          float act = alive * step(abs(cur - from), 0.5);
          float t = (g.x - ro.z) / (abs(rd.z) > 1e-5 ? rd.z : 1e-5);
          vec3 h = ro + rd * t;
          float inside = step(abs(h.x - g.y), g.z) * step(h.y, g.w) * step(0.0, h.y) * step(0.0, t);
          cur += act * inside * stepTo; alive *= 1.0 - act * (1.0 - inside);
        }
        void main(){
          vec3 rd = normalize(vDir + vec3(0.0, 1e-6, 0.0)), ro = cameraPosition;
          float cur = uPanel, alive = 1.0;
          if (rd.z > 0.0) { gate(uGate[0], 0.0, 1.0, ro, rd, cur, alive); gate(uGate[1], 1.0, 1.0, ro, rd, cur, alive); gate(uGate[2], 2.0, 1.0, ro, rd, cur, alive); }
          else { gate(uGate[2], 3.0, -1.0, ro, rd, cur, alive); gate(uGate[1], 2.0, -1.0, ro, rd, cur, alive); gate(uGate[0], 1.0, -1.0, ro, rd, cur, alive); }
          vec3 c = cur < 0.5 ? uSky[0] : cur < 1.5 ? uSky[1] : cur < 2.5 ? uSky[2] : uSky[3];
          float night = step(abs(cur - uNight), 0.5), ink = 0.0;
          // the moon: a flat lemon disc 8 degrees wide in a pen ring, its tint a hair off register
          float ang = acos(clamp(dot(rd, uMoon), -1.0, 1.0)), fa = max(fwidth(ang), 1e-6);
          float dm = (ang - 0.07) / fa;
          vec3 mside = normalize(cross(uMoon, vec3(0.0, 1.0, 0.0)));
          vec3 mup = cross(mside, uMoon);
          float tin = step(length(vec2(dot(rd, mside), dot(rd, mup)) - fa * vec2(2.2, 1.6)), 0.07);
          c = mix(c, mix(uPaper, uLemon, tin), night * step(dm, 0.0));
          ink = max(ink, night * (1.0 - smoothstep(uLine - 0.5, uLine + 0.5, abs(dm))));
          // forty small pen asterisks
          vec2 sp = vec2(atan(rd.x, abs(rd.z) + abs(rd.x) < 1e-5 ? 1.0 : rd.z), asin(clamp(rd.y, -1.0, 1.0))) / 0.15;
          vec2 id = floor(sp), f = fract(sp) - 0.5;
          float hsh = fract(sin(dot(id, vec2(127.1, 311.7))) * 43758.5453), h2 = fract(hsh * 57.31);
          vec2 q = f - (vec2(hsh, h2) - 0.5) * 0.5;
          float fq = max(fwidth(sp.y), 1e-6), r = length(q), star = 0.0;
          for (int k = 0; k < 3; k++) { float a = 1.0472 * float(k) + hsh * 3.0 + uTime * 0.3 * (h2 - 0.8); star = max(star, 1.0 - smoothstep(uLine - 0.5, uLine + 0.5, abs(dot(q, vec2(cos(a), sin(a)))) / fq)); }
          star *= step(r, 0.085 + 0.05 * h2) * step(0.62, h2) * step(0.06, rd.y) * step(ang, 3.0) * step(0.11, ang);
          ink = max(ink, night * star);
          gl_FragColor = vec4(mix(c, uInk, ink), 1.0);
        }`,
    });
    const skyMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(50, 3), skyMat);
    skyMesh.frustumCulled = false; skyMesh.renderOrder = -10; scene.add(skyMesh);

    // ------------------------------------------------------------------------------------------ the ground: ruled flags
    const groundMat = new THREE.ShaderMaterial({
      uniforms: { ...U, uGateZ: { value: new THREE.Vector3(GATES[0].z, GATES[1].z, GATES[2].z) }, uGreen: { value: col.green }, uCheck: { value: col.salmon } },
      vertexShader: /* glsl */`varying vec3 vW; varying float vVz;
        void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vVz = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`
        ${STYLE_GLSL}
        uniform vec3 uGateZ, uGreen, uCheck; varying vec3 vW; varying float vVz;
        const float COURT_X = ${COURT.x.toFixed(1)}, COURT_Z = ${COURT.z.toFixed(1)};
        // a square wave of period 2 that fades to its mean before it can alias
        float sq(float v){ float f = max(fwidth(v), 1e-6); float s = clamp((abs(fract(v * 0.5) - 0.5) - 0.25) / f * 2.0, -0.5, 0.5) * 2.0; return s * (1.0 - smoothstep(0.3, 0.7, f)); }
        float gl(float v){ return mcLine(v) * (1.0 - smoothstep(0.055, 0.1, fwidth(v))); }   // joints only while a flag is over about 12 px: further off the checks alone carry it
        float edge(float d){ float f = max(fwidth(d), 1e-6); return 1.0 - smoothstep(uLine - 0.5, uLine + 0.5, abs(d) / f); }
        void main(){
          vec2 p = vW.xz;
          vec2 pt = p - (dFdx(p) * uReg.x - dFdy(p) * uReg.y);       // where the tint plate reads: a hair up and right
          float ax = abs(p.x), axt = abs(pt.x);
          float gut = min(min(abs(p.y - uGateZ.x), abs(p.y - uGateZ.y)), abs(p.y - uGateZ.z)) - 6.0;
          float gutT = min(min(abs(pt.y - uGateZ.x), abs(pt.y - uGateZ.y)), abs(pt.y - uGateZ.z)) - 6.0;
          float fore = step(${FORECOURT_Z.toFixed(1)}, p.y) * step(-${WALL_X.toFixed(1)}, p.x) * step(p.x, COURT_X) * step(p.y, COURT_Z);
          float foreT = step(${FORECOURT_Z.toFixed(1)}, pt.y) * step(-${WALL_X.toFixed(1)}, pt.x) * step(pt.x, COURT_X) * step(pt.y, COURT_Z);
          // tint plate
          vec3 c = uPaper;
          float av = step(axt, ${KERB.toFixed(1)}) * step(0.0, gutT) * (1.0 - foreT);
          c = mix(c, mix(uPaper, uGreen, 0.5 + 0.5 * sq(pt.x / 4.0 + 0.5) * sq(pt.y / 4.0)), av);
          vec2 d8 = vec2(pt.x + pt.y, pt.x - pt.y) / 8.485;
          c = mix(c, mix(uPaper, uCheck, 0.5 + 0.5 * sq(d8.x) * sq(d8.y)), foreT);
          // line plate
          float ink = 0.0, open = step(0.0, gut);
          float inAv = step(ax, ${KERB.toFixed(1)}) * open * (1.0 - fore);
          ink = max(ink, inAv * max(gl(p.x / 4.0 + 0.5), gl(p.y / 4.0)));
          vec2 e8 = vec2(p.x + p.y, p.x - p.y) / 8.485;
          ink = max(ink, fore * max(gl(e8.x), gl(e8.y)));
          float pave = step(${KERB.toFixed(1)}, ax) * step(ax, ${WALL_X.toFixed(1)}) * open * (1.0 - fore);
          ink = max(ink, pave * gl(p.y / 2.0));
          ink = max(ink, open * (1.0 - fore) * max(edge(ax - ${KERB.toFixed(1)}), edge(ax - ${(KERB + 0.5).toFixed(1)})));
          // the side streets between the columns of blocks: paving ruled, left untinted
          float sx = mod(ax - ${WALL_X.toFixed(1)}, ${COL_PITCH.toFixed(1)});
          float street = step(${WALL_X.toFixed(1)}, ax) * step(${BLOCK_W.toFixed(1)}, sx) * open * (1.0 - fore);
          ink = max(ink, street * max(gl(p.y / 8.0), max(edge(sx - ${(BLOCK_W + 4).toFixed(1)}), edge(sx - ${(COL_PITCH - 4).toFixed(1)}))));
          ink = max(ink, edge(gut) * (1.0 - fore));                    // the gutter of the page, ruled off
          ink = max(ink, edge(p.y - ${FORECOURT_Z.toFixed(1)}) * step(-${WALL_X.toFixed(1)}, p.x) * step(p.x, COURT_X));
          ink *= 1.0 - smoothstep(900.0, 1500.0, vVz);
          gl_FragColor = vec4(mix(c, uInk, clamp(ink, 0.0, 1.0)), 1.0);
        }`,
    });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000).rotateX(-Math.PI / 2), groundMat);
    ground.position.set(0, 0, 1000); scene.add(ground);

    // ------------------------------------------------------------------------------------------ the panel gates: plain black frames
    const blackMat = new THREE.MeshBasicMaterial({ color: col.ink });
    const unitBox = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const gates = GATES.map((g) => {
      const grp = new THREE.Group(); grp.position.set(g.x, 0, g.z);
      const posts = [-1, 1].map((s) => { const m = new THREE.Mesh(unitBox, blackMat); m.position.x = s * (g.w / 2 + 0.75); m.scale.set(1.5, g.h, 1.5); grp.add(m); return m; });
      const top = new THREE.Mesh(unitBox, blackMat); top.scale.set(g.w + 3, 1.5, 1.5); top.position.y = g.h; grp.add(top);
      const sill = new THREE.Mesh(unitBox, blackMat); sill.scale.set(g.w + 3, 0.12, 1.5); grp.add(sill);
      scene.add(grp);
      return { g, posts, top };
    });
    await ctx.yield();
    // ------------------------------------------------------------------------------------------ the blocks: one window, a thousand times
    // one instanced geometry: part 0 the wall box (6 tiers so the mirror edition can bow it), 1 the cornice, 2 the water tank
    const blockGeo = (() => {
      const parts = [], withPart = (g, k) => { const n = g.attributes.position.count; g.setAttribute('part', new THREE.BufferAttribute(new Float32Array(n).fill(k), 1)); g.deleteAttribute('uv'); return g.index ? g.toNonIndexed() : g; };
      parts.push(withPart(new THREE.BoxGeometry(1, 1, 1, 1, 6, 1).translate(0, 0.5, 0), 0));
      parts.push(withPart(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), 1));
      parts.push(withPart(new THREE.CylinderGeometry(1, 1, 1, 8, 1, false).translate(0, 0.5, 0), 2));
      parts.push(withPart(new THREE.ConeGeometry(1.12, 0.45, 8, 1, true).translate(0, 1.22, 0), 2));
      const g = mergeGeometries(parts, false); parts.forEach((p) => p.dispose()); return g;
    })();
    await ctx.yield();
    const lots = cityLots();
    // rare: the street gets up. Port column one: the last lot of panel two and the five of panel three walk four lots on,
    // so the four lots they will sit down in (the first of the night panel) start empty.
    const chain = lots.filter((l) => l.col === -1 && l.panel >= 1 && !(l.panel === 1 && l.row < 6)).sort((a, b) => a.z - b.z);
    const walkers = rare ? chain.slice(0, 6) : [];
    const walkShift = rare ? chain[4].z - chain[0].z : 0;
    const emptied = rare ? new Set(chain.slice(6, 10)) : new Set();
    const blocks = lots.filter((l) => !emptied.has(l));
    const NB = blocks.length;
    const iPos = new Float32Array(NB * 4), iInfo = new Float32Array(NB * 4), iCol = new Float32Array(NB * 3), iAux = new Float32Array(NB * 4);
    const roofs = [];                                        // for smoke, pigeons: { x, z, h, panel, lot }
    for (let i = 0; i < NB; i++) {
      const l = blocks[i], R = l.extra ? hashRng(l.x, l.z) : rng, tall = [[8, 12], [12, 20], [20, 30], [20, 30]][l.panel];
      const near = Math.abs(l.col) === 1;
      const rise = Math.round(lerp(9, 29, smoothstep(40, 790, l.z)));
      let st = clamp(rise + R.int(-2, 2) - (near ? 0 : R.int(0, 3)), tall[0], 30);
      if (near && l.panel === 2) st = 55 + (st % 3);         // the canyon under the high eye: 205 m of ranked windows either side
      // the dream keeps getting taller: behind the palace's end the night blocks stand 230 to 285 m, a wall of ranked paper windows behind the spire
      if (l.panel === 3 && l.col >= 2 && l.col <= 3 && l.z > 1200 && l.z < 1500) st = 62 + ((l.row * 5 + l.col * 3) % 4) * 5;
      if (l.panel === 3 && l.col === -1 && l.z > 1220 && l.z < 1440) st = 44 + ((l.row * 7) % 5) * 6;   // and the port wall of the canyon answers it
      const wl = wallsOf(l.panel); let c = wl[R.int(0, wl.length - 1)];
      if (near && l.z > 470 && c === col.paper) c = wl[(l.row + (l.col > 0 ? 1 : 0)) % (wl.length - 1)];   // beside the lens from the knee on, a wall is a tint: bare paper there read as an empty sheet
      const walker = walkers.indexOf(l) + 1;
      iPos.set([l.x, l.z, l.w, l.d], i * 4);
      iInfo.set([walker ? 24 : st, R.int(19, 23), R.int(17, 20), l.panel], i * 4);
      iCol.set([c.r, c.g, c.b], i * 3);
      iAux.set([R(), walker ? 1 : 0, R.range(-0.3, 0.3), l.panel === 2 && mirror ? 1 : 0], i * 4);
      l.h = (walker ? 24 : st) * STOREY; l.walker = walker; roofs.push(l);
    }
    blockGeo.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 4));
    blockGeo.setAttribute('iInfo', new THREE.InstancedBufferAttribute(iInfo, 4));
    blockGeo.setAttribute('iCol', new THREE.InstancedBufferAttribute(iCol, 3));
    blockGeo.setAttribute('iAux', new THREE.InstancedBufferAttribute(iAux, 4));
    const BLOCK_COMMON = /* glsl */`
      // how many storeys a block has by now: the page stretches ahead of us, a storey at a time
      float storeysNow(float S, float z){ float g = smoothstep(z - 560.0, z - 150.0, uCamZ); return S * (0.58 + 0.42 * g); }
      float heightOf(float sNow){ return ${STOREY.toFixed(2)} * (floor(sNow) + smoothstep(0.0, 0.3, fract(sNow))); }`;
    const blockMat = new THREE.ShaderMaterial({
      uniforms: { ...U, uNightP: { value: nightPanel }, uNightC: { value: col.night } },
      vertexShader: /* glsl */`
        attribute float part; attribute vec4 iPos, iInfo, iAux; attribute vec3 iCol;
        uniform float uCamZ, uMirror, uSnow; uniform vec4 uWalk;
        varying vec2 vUV, vSize; varying vec4 vInfo; varying vec3 vCol, vNw, vVp; varying float vPart, vGrow;
        ${BLOCK_COMMON}
        void main(){
          float sNow = storeysNow(iInfo.x, iPos.y), H = heightOf(sNow);
          vec3 p = position, n = normal; vec2 uv, size; float bays = iInfo.y;
          float w = iPos.z, d = iPos.w;
          if (part < 0.5) {
            float bow = 1.0 + iAux.w * uMirror * 0.36 * sin(position.y * 5.6 + uCamZ * 0.012 + iPos.y * 0.01);
            p = vec3(position.x * w * bow, position.y * H, position.z * d);
            if (abs(normal.x) > 0.5) { uv = vec2((position.z * sign(normal.x) + 0.5) * d, p.y); size = vec2(d, H); bays = iInfo.z; }
            else if (abs(normal.z) > 0.5) { uv = vec2((0.5 - position.x * sign(normal.z)) * w, p.y); size = vec2(w, H); }
            else { uv = (position.xz + 0.5) * vec2(w, d); size = vec2(w, d); }
          } else if (part < 1.5) {
            float bowTop = 1.0 + iAux.w * uMirror * 0.36 * sin(5.6 + uCamZ * 0.012 + iPos.y * 0.01);
            p = vec3(position.x * (w * bowTop + 2.4), H + position.y * 1.7 - 0.2, position.z * (d + 2.4));
            if (abs(normal.x) > 0.5) { uv = vec2((position.z + 0.5) * (d + 2.4), position.y * 1.7); size = vec2(d + 2.4, 1.7); }
            else if (abs(normal.z) > 0.5) { uv = vec2((position.x + 0.5) * (w + 2.4), position.y * 1.7); size = vec2(w + 2.4, 1.7); }
            else { uv = (position.xz + 0.5) * vec2(w + 2.4, d + 2.4); size = vec2(w + 2.4, d + 2.4); }
          } else {
            p = vec3(position.x * 3.2 + iAux.z * w, H + 1.5 + position.y * 5.0, position.z * 3.2 + iAux.z * d * 0.8);
            uv = vec2(atan(position.z, position.x + 1e-5) * 1.2732, position.y); size = vec2(8.0, 1.0);
          }
          p.xz += iPos.xy;
          p.y += iAux.y * uWalk.x; p.z += iAux.y * uWalk.y; p.x += iAux.y * uWalk.x * 0.04 * sin(uWalk.z * 6.283 + iPos.y);
          vec4 mv = viewMatrix * vec4(p, 1.0);
          vUV = uv; vSize = size; vInfo = vec4(floor(sNow), bays, iInfo.w, fract(sNow)); vCol = iCol; vNw = n; vVp = mv.xyz; vPart = part; vGrow = fract(sNow);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        ${STYLE_GLSL}
        uniform float uNightP, uSnow; uniform vec3 uNightC;
        varying vec2 vUV, vSize; varying vec4 vInfo; varying vec3 vCol, vNw, vVp; varying float vPart, vGrow;
        float pen(float dpx){ return 1.0 - smoothstep(uLine - 0.5, uLine + 0.5, abs(dpx)); }
        // ruled shade whose lines sit about px pixels apart ON SCREEN (so a wall seen steeply is not ruled black): lines are added or dropped in powers of two
        float ruleFw(float v, float px){ float f = max(fwidth(v), 1e-7); return mcLine(v * exp2(floor(log2(clamp(1.0 / (px * f), 1.0, 4096.0)) + 0.5))); }
        void main(){
          vec2 fw = max(fwidth(vUV), vec2(1e-6));
          float viewZ = max(-vVp.z, 0.05), shade = mcShadeOf(vNw), ink = 0.0, reg = 1.0;
          float night = step(abs(vInfo.z - uNightP), 0.5);
          vec3 tint = vCol;
          vec2 eb = min(vUV, vSize - vUV) / fw;                         // pixels to the nearest edge of this face
          if (vPart < 0.5 && abs(vNw.y) < 0.5) {
            // a wall: the same window in every bay of every storey, arched on the top storey
            float bw = vSize.x / max(vInfo.y, 1.0), sh = ${STOREY.toFixed(2)};
            vec2 cell = vec2(vUV.x / bw, vUV.y / sh), id = floor(cell), f = fract(cell) - vec2(0.5, 0.5);
            vec2 m = f * vec2(bw, sh), half_ = vec2(bw * 0.27, sh * 0.31);
            float top = step(vInfo.x - 1.5, id.y);
            float born = 1.0 - top * step(vInfo.w * (vInfo.y + 1.0) * 1.3, id.x + 0.5) * step(vInfo.w, 0.76);   // the newest row, a window at a time
            vec2 q = (abs(m) - half_) / fw;
            float sd = max(q.x, q.y);
            vec2 am = vec2(m.x, m.y - (half_.y - half_.x)); float al = max(length(am), 1e-4);
            float sdArc = (al - half_.x) / max(length(am / al * fw), 1e-6);
            sd = mix(sd, max(q.x, max((-m.y - half_.y) / fw.y, sdArc)), top * step(0.0, am.y));
            // what a bay shows by its size on screen, each step lighter than the last, so a wall always reads first as its
            // tint: frame, sash, sill and every storey course (big); a plain hairline rectangle of paper; the same with only
            // its left and lower side inked; every fourth storey line; flat tint.
            float bayPx = min(bw / fw.x, sh / fw.y), shPx = sh / fw.y;
            float v0 = mix(5.0, 4.0, night), vis = smoothstep(v0, v0 + mix(2.5, 1.0, night), bayPx) * born, det = smoothstep(21.0, 30.0, bayPx);
            float full = smoothstep(12.0, 16.0, bayPx), ell = q.x > q.y ? step(m.x, 0.0) : step(m.y, 0.0);
            float pane = step(sd, 0.0) * vis;
            ink = max(ink, pen(sd) * vis * max(full, ell));
            ink = max(ink, det * pane * max(pen(m.y / fw.y), pen(m.x / fw.x) * step(m.y, 0.0)));          // sash bars
            ink = max(ink, det * vis * pen((m.y + half_.y + 0.22) / fw.y) * step(abs(m.x), half_.x + 0.3));  // sill
            float nearest = floor(cell.y + 0.5), fourth = mod(nearest + 2.0, 4.0) < 0.5 ? 1.0 : 0.0;
            ink = max(ink, mcLine(cell.y) * (1.0 - pane) * max(det, fourth * smoothstep(4.5, 6.5, shPx)));   // storey course
            // ornament in the same pen: a band course under the top storey and over the ground floor, quoins up the corners
            float band = max(step(abs(id.y - (vInfo.x - 2.0)), 0.5), step(id.y, 0.5)) * det;
            ink = max(ink, band * (1.0 - pane) * pen((f.y + 0.08) * shPx));
            float cornerD = min(vUV.x, vSize.x - vUV.x), quoin = step(cornerD, 0.9) * det;
            ink = max(ink, max(quoin * mcLine(cell.y * 2.0), det * pen((cornerD - 0.9) / fw.x)));
            float ruleVis = smoothstep(15.0, 22.0, bayPx);                                             // ruled shade only where a bay is big enough to carry it
            ink = max(ink, shade * (1.0 - pane) * ruleVis * ruleFw(vUV.y / (sh * 8.0), 12.5 * uLine));
            tint = mix(tint, uPaper, pane);
            reg = mcEdgeReg(vUV, vSize);
            ink = max(ink, max(pen(eb.x - uLine), pen(eb.y - uLine) * step(sh, vUV.y)));
          } else if (vPart < 1.5) {
            // roof (flat tint, a parapet line) or cornice (bare paper, dentils, ruled underneath)
            float roof = step(vPart, 0.5), flatTop = step(0.5, vNw.y);
            tint = mix(uPaper, mix(vCol, uPaper, uSnow), flatTop);
            ink = max(ink, pen(min(eb.x, eb.y) - uLine));
            ink = max(ink, roof * pen(min(eb.x, eb.y) - 1.4 / max(fw.x, fw.y)));
            float side = (1.0 - roof) * step(abs(vNw.y), 0.5);
            ink = max(ink, side * mcLine(vUV.x / 1.3) * step(vUV.y, 0.9) * smoothstep(3.0, 5.0, 1.3 / fw.x));
            ink = max(ink, side * pen((vUV.y - 0.9) / fw.y));
            ink = max(ink, (1.0 - roof) * shade * mcRule(vUV.x / 16.0, 16.0, viewZ) * step(vNw.y, -0.5));
            reg = mix(mcEdgeReg(vUV, vSize), 1.0, roof * 0.0);
            if (flatTop > 0.5) {
              // skylights: he never left a roof bare. A paper light in a pen frame with one glazing bar, on or off by its size on screen
              vec2 cs = vec2(11.0, 9.5), sc = vUV / cs, si = floor(sc), sm = (fract(sc) - 0.5) * cs, cc = (si + 0.5) * cs;
              float on = step(0.4, fract(sin(dot(si + vec2(vInfo.y, vInfo.x), vec2(12.9898, 78.233))) * 43758.5453));
              vec2 mg = step(vec2(5.0, 4.4), min(cc, vSize - cc));
              vec2 sq = (abs(sm) - vec2(2.9, 1.9)) / fw; float ssd = max(sq.x, sq.y);
              float sPx = min(cs.x / fw.x, cs.y / fw.y), sv = smoothstep(6.5, 7.5, sPx) * on * mg.x * mg.y;
              tint = mix(tint, uPaper, step(ssd, 0.0) * sv);
              ink = max(ink, sv * max(pen(ssd), step(ssd, 0.0) * pen(sm.x / fw.x) * step(16.0, sPx)));
            }
          } else {
            // the water tank: staves, a hoop, a contour
            tint = mix(mix(vCol, uPaper, 0.0), uPaper, max(uSnow, night));
            vec3 N = normalize(vNw + vec3(0.0, 1e-5, 0.0));
            ink = max(ink, mcLine(vUV.x * 1.0) * step(vUV.y, 1.0) * smoothstep(3.0, 6.0, 1.0 / fw.x));
            ink = max(ink, mcLine(vUV.y * 2.0) * step(vUV.y, 1.01));
            ink = max(ink, shade * mcRule(vUV.x / 8.0, 20.0, viewZ));
          }
          gl_FragColor = vec4(mcFinish(tint, ink, reg), 1.0);
        }`,
    });
    await ctx.yield();
    const blockMesh = new THREE.InstancedMesh(blockGeo, blockMat, NB);
    blockMesh.frustumCulled = false; scene.add(blockMesh);
    await ctx.yield();
    const tickers = [];                                      // (u, time, camera, dt, camPos) => void, one per living thing
    // ------------------------------------------------------------------------------------------ the bed
    const pz = (u) => path.pointAt(u, tmp.v).z;
    // how far ahead of the lens the bed walks (m): we draw level with its fore port knee from u 0.31 to 0.35, it strides ahead and above
    // while we climb beside its legs, its quilt is under us from u 0.52 to 0.565, and it is just ahead all through the fall
    const OFF = [[0, 40], [0.03, 38], [0.07, 15], [0.1, 22], [0.15, 40], [0.25, 36], [0.3, -12], [0.31, -11.5], [0.318, -8], [0.325, 3], [0.335, 20], [0.342, 30.5], [0.355, 34], [0.4, 31], [0.43, 24], [0.47, 15], [0.5, 5], [0.535, 5], [0.565, 5], [0.578, 20], [0.59, 30], [0.64, 70], [0.7, 62], [0.75, 60], [0.79, 34], [0.82, 42], [0.86, 30], [0.9, 30], [0.925, 58]];
    const zKeys = OFF.map(([u, o]) => [u, pz(u) + o]); zKeys.push([U_LAND, BED_LAND[2]], [1, BED_LAND[2]]);
    for (let i = 1; i < zKeys.length; i++) zKeys[i][1] = Math.max(zKeys[i][1], zKeys[i - 1][1] + 0.5);
    const linKeys = (keys, u) => { if (u <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (u <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], (u - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])); return keys[keys.length - 1][1]; };
    const bump0 = (a, b, c, d, u) => smoothstep(a, b, u) * (1 - smoothstep(c, d, u));
    const onDomes = (u) => smoothstep(0.575, 0.64, u) * (1 - smoothstep(0.826, 0.868, u));
    const course = (u) => [PALACE.domeX * onDomes(u), linKeys(zKeys, u)];
    // striding out from under the lens it ducks 6 m (its foot rail clears us), then springs: on the domes the bed rides 140 m higher; nearing the spire it crouches (knees out like a giraffe's) so bed and spire share a frame
    // as we come round the knee (u 0.315 to 0.345) it sinks on folded knees by a third of its leg length, the knee joints bending past the lens, and is risen again by u 0.43
    const bodyY = (u, L) => 0.985 * L + 3.5 - 0.36 * L * smoothstep(0.315, 0.345, u) * (1 - smoothstep(0.355, 0.43, u)) - 6 * bump0(0.552, 0.566, 0.574, 0.59, u) + 140 * smoothstep(0.578, 0.615, u) * (1 - 0.76 * smoothstep(0.635, 0.69, u) - 0.1 * smoothstep(0.725, 0.79, u)) * (1 - smoothstep(0.83, 0.868, u));
    const L_KEYS = [[0, 12], [0.1, 30], [0.24, 90], [0.45, 180], [0.82, 180], [0.856, 116], [0.895, 80], [0.925, 48], [0.95, 15], [1, 15]];
    const lengthAt = (u) => { for (let i = 1; i < L_KEYS.length; i++) if (u <= L_KEYS[i][0]) return lerp(L_KEYS[i - 1][1], L_KEYS[i][1], smoothstep(L_KEYS[i - 1][0], L_KEYS[i][0], u)); return 15; };
    // the pillow (0) and the two head knobs (1, 2) come loose at the snag and tumble past the lens: each keeps station a little
    // ahead of us on the dive line, then runs on into the last panel
    const loosePt = new THREE.Vector3();
    const loose = (kind, u, t, pos) => {
      // the pillow tumbles in close ahead of us all the way down the dive, then outruns us into the panel; one knob turns over just
      // to the other side of the line to the bed. Each keeps one station from the snag to the landing: no key inside the fall.
      const lead = kind === 0 ? 17 + 23 * smoothstep(0.82, 1, t) : kind === 1 ? 12 : 10;
      path.posAtDist(Math.min(u * path.length + lead, path.length), loosePt);
      if (kind === 0) loosePt.x += -6.5 * Math.cos(t * 4), loosePt.y += -3.2 + 2.2 * Math.sin(t * 9);
      else loosePt.x += (kind === 1 ? 5.4 : -6.5) * (1 - 0.6 * t), loosePt.y += (kind === 1 ? 2.5 : 2) * Math.cos(t * 4);
      const w = kind === 0 ? smoothstep(0.04, 0.32, t) : smoothstep(0.05, 0.36, t) * (1 - smoothstep(0.82, 1, t));
      pos.lerp(loosePt, w);
    };
    const groundAt = (leg, x, z, u) => {
      if (u > 0.572 && u < 0.836 && z > PALACE.z0 - 4 && z < PALACE.z1 + 6 && x > 36) {
        let best = DOMES[0]; for (const d of DOMES) if (Math.abs(d.z - z) < Math.abs(best.z - z)) best = d;
        return [PALACE.domeX + (leg < 2 ? -2.6 : 2.6), best.h, best.z + (leg % 2 ? 2.4 : -2.4)];
      }
      if (Math.abs(z - 469.2) < 12) z = 469.2 + (z < 469.2 ? -14 : 14);       // the fore feet step over the viaduct
      for (const g of GATES) if (Math.abs(z - g.z) < 4) z = g.z + (z < g.z ? -5 : 5);
      return [x, 0, z];
    };
    const spireTip = [PALACE.domeX, PALACE.spireH, PALACE.spireZ];
    const hero = await buildHero(ctx, { preview: false, palette: PALETTE, detail, course, bodyY, groundAt, uLand: U_LAND, landing: BED_LAND, landHalf: 7.4, snagU: 0.82, snagPoint: spireTip, snow, style: STYLE, lengthAt, loose });
    scene.add(hero.object);
    await ctx.yield();

    // ------------------------------------------------------------------------------------------ shared makers
    // the part's page material and contour, taught to take instances (and, for the spire, to bend)
    const instPatch = (m, extra = '', decl = '') => {
      m.vertexShader = decl + m.vertexShader
        .replace('vec3 p = position;', 'vec3 p = position;' + extra)
        .replace('modelViewMatrix * vec4(p, 1.0)', 'modelViewMatrix * instanceMatrix * vec4(p, 1.0)')
        .replace('vNv = normalMatrix * normal; vNw = mat3(modelMatrix) * normal;', 'vNv = normalMatrix * (mat3(instanceMatrix) * normal); vNw = mat3(modelMatrix) * (mat3(instanceMatrix) * normal);')
        .replace('vec4(normalMatrix * normal, 0.0)', 'vec4(normalMatrix * (mat3(instanceMatrix) * normal), 0.0)');
      return m;
    };
    const iTint = instPatch(tintMaterial({ style: STYLE })), iHull = instPatch(hullMaterial({ style: STYLE }));
    const sTint = tintMaterial({ style: STYLE }), sHull = hullMaterial({ style: STYLE });   // static, uninstanced
    const addPair = (geo, a, b, parent = scene) => { const m1 = new THREE.Mesh(geo, a), m2 = new THREE.Mesh(geo, b); m1.frustumCulled = m2.frustumCulled = false; parent.add(m1, m2); return [m1, m2]; };
    const instPair = (geo, mats) => { const a = new THREE.InstancedMesh(geo, iTint, mats.length), b = new THREE.InstancedMesh(geo, iHull, mats.length); mats.forEach((m, i) => { a.setMatrixAt(i, m); b.setMatrixAt(i, m); }); a.frustumCulled = b.frustumCulled = false; scene.add(a, b); return [a, b]; };
    const mat4 = (x, y, z, sx = 1, sy = 1, sz = 1, ry = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(sx, sy, sz));
    const meridians = (g, n) => { const cr = g.attributes.crease, ru = g.attributes.rule; for (let i = 0; i < cr.count; i++) cr.setX(i, ru.getX(i) * n); return g; };
    // slabs: every hard-edged box of the page (plinths, girders, cars, balustrades), edges and pattern drawn in the face
    const slabMat = new THREE.ShaderMaterial({
      uniforms: { ...U }, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec3 sCol; attribute vec2 sPat;
        varying vec2 vUV, vSize, vPat; varying vec3 vCol, vNw, vVp;
        void main(){
          vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
          vec3 q = (position + 0.5) * sc;
          if (abs(normal.x) > 0.5) { vUV = q.zy; vSize = sc.zy; } else if (abs(normal.z) > 0.5) { vUV = q.xy; vSize = sc.xy; } else { vUV = q.xz; vSize = sc.xz; }
          vec3 n = mat3(modelMatrix) * (mat3(instanceMatrix) * normal);
          vNw = n / max(length(n), 1e-5); vCol = sCol; vPat = sPat;
          vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0); vVp = mv.xyz;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        ${STYLE_GLSL}
        varying vec2 vUV, vSize, vPat; varying vec3 vCol, vNw, vVp;
        float pen(float dpx){ return 1.0 - smoothstep(uLine - 0.5, uLine + 0.5, abs(dpx)); }
        void main(){
          vec2 fw = max(fwidth(vUV), vec2(1e-6)), eb = min(vUV, vSize - vUV) / fw;
          float viewZ = max(-vVp.z, 0.05), wall = step(abs(vNw.y), 0.5), pitch = max(vPat.y, 0.05);
          float ink = pen(min(eb.x, eb.y) - uLine), keep = 1.0, pane = 0.0;
          float shade = mcShadeOf(vNw) * mcRule(vUV.y / 8.0, 8.0, viewZ);
          vec3 tint = vCol;
          if (vPat.x > 0.5 && vPat.x < 1.5) ink = max(ink, wall * mcLine(vUV.x / pitch));
          else if (vPat.x < 2.5 && vPat.x > 1.5) {
            float chord = step(min(vUV.y, vSize.y - vUV.y), 0.5);
            float lat = max(mcLine((vUV.x + vUV.y) / pitch), max(mcLine((vUV.x - vUV.y) / pitch), mcLine(vUV.x / pitch)));
            ink = max(ink, wall * lat); keep = max(max(chord, 1.0 - wall), step(0.3, ink));
            ink = max(ink, wall * chord * pen((min(vUV.y, vSize.y - vUV.y) - 0.5) / fw.y));
          } else if (vPat.x < 3.5 && vPat.x > 2.5) {
            vec2 c = vec2(fract(vUV.x / pitch) - 0.5, vUV.y / vSize.y - 0.64) * vec2(pitch, vSize.y);
            vec2 q = (abs(c) - vec2(pitch * 0.34, vSize.y * 0.17)) / fw; float sd = max(q.x, q.y), vis = wall * smoothstep(4.0, 6.0, pitch / fw.x);
            pane = step(sd, 0.0) * vis; ink = max(ink, pen(sd) * vis); ink = max(ink, wall * pen((vUV.y - vSize.y * 0.36) / fw.y));
          } else if (vPat.x > 3.5) {
            vec2 c = vec2((fract(vUV.x / pitch) - 0.5) * pitch, vUV.y - vSize.y * 0.56);
            float hw = pitch * 0.3, al = max(length(c), 1e-4);
            float sd = c.y > 0.0 ? (al - hw) / max(length(c / al * fw), 1e-6) : (abs(c.x) - hw) / fw.x;
            float vis = wall * smoothstep(4.0, 6.0, pitch / fw.x);
            pane = step(sd, 0.0) * vis; ink = max(ink, pen(sd) * vis);
            ink = max(ink, pane * mcRule(vUV.x / 8.0, 8.0, viewZ)); pane = 0.0;
            ink = max(ink, wall * pen((vUV.y - vSize.y * 0.9) / fw.y));
          }
          if (keep < 0.5) discard;
          ink = max(ink, shade * (1.0 - pane));
          gl_FragColor = vec4(mcFinish(mix(tint, uPaper, pane), ink, mcEdgeReg(vUV, vSize)), 1.0);
        }`,
    });
    const slabGeo = new THREE.BoxGeometry(1, 1, 1); slabGeo.deleteAttribute('uv');
    const makeSlabs = (list, parent = scene) => {            // list: [{ m: Matrix4, c: Color, pat, pitch }]
      const g = slabGeo.clone(), n = list.length, cols = new Float32Array(n * 3), pats = new Float32Array(n * 2);
      const mesh = new THREE.InstancedMesh(g, slabMat, n);
      list.forEach((s, i) => { mesh.setMatrixAt(i, s.m); cols.set([s.c.r, s.c.g, s.c.b], i * 3); pats.set([s.pat || 0, s.pitch || 1], i * 2); });
      g.setAttribute('sCol', new THREE.InstancedBufferAttribute(cols, 3)); g.setAttribute('sPat', new THREE.InstancedBufferAttribute(pats, 2));
      mesh.frustumCulled = false; parent.add(mesh); return mesh;
    };
    const slabs = [], slab = (x, y, z, sx, sy, sz, c, pat = 0, pitch = 1, ry = 0) => slabs.push({ m: mat4(x, y + sy / 2, z, sx, sy, sz, ry), c, pat, pitch });
    await ctx.yield();
    // ------------------------------------------------------------------------------------------ the palace
    const P = PALACE, palWall = edition === 'late' ? col.salmon : col.lemon;
    const pzLen = P.z1 - P.z0, pzMid = (P.z0 + P.z1) / 2;
    slab((P.x0 + P.x1) / 2, 0, pzMid, P.x1 - P.x0 + 6, 1.0, pzLen + 6, col.paper, 1, 3);                 // steps
    slab((P.x0 + P.x1) / 2, 1.0, pzMid, P.x1 - P.x0 + 2, 1.0, pzLen + 2, col.paper, 1, 3);
    slab((P.x0 + P.x1) / 2 + 5, 2, pzMid, P.x1 - P.x0 - 12, P.colY, pzLen - 8, palWall, 4, 12);          // the arcaded wall behind the columns
    slab((P.x0 + P.x1) / 2, 2 + P.colY, pzMid, P.x1 - P.x0, P.roofY - P.colY - 2, pzLen, col.paper, 1, 1.6);   // entablature, dentils
    for (const [x, z, sx, sz] of [[P.x0 + 0.4, pzMid, 0.6, pzLen], [P.x1 - 0.4, pzMid, 0.6, pzLen], [(P.x0 + P.x1) / 2, P.z0 + 0.4, P.x1 - P.x0, 0.6], [(P.x0 + P.x1) / 2, P.z1 - 0.4, P.x1 - P.x0, 0.6]])
      slab(x, P.roofY, z, sx, 2.4, sz, col.paper, 1, 0.9);                                              // balustrade
    {
      const shaft = [], n = 9; for (let i = 0; i <= n; i++) { const t = i / n; shaft.push([1.25 * (1 - 0.14 * t * t), 2.2 + t * (P.colY - 4.4), 0]); }
      const parts = [meridians(latheGeo(shaft, 10, col.paper), 5),
        latheGeo([[0, 0, 0], [1.9, 0, 1], [1.9, 0.8, 1], [1.5, 1.0, 1], [1.7, 1.5, 0], [1.4, 2.2, 1]], 10, col.paper),
        latheGeo([[1.08, P.colY - 2.2, 1], [1.3, P.colY - 1.8, 0], [1.2, P.colY - 1.3, 1], [1.9, P.colY - 0.7, 1], [1.9, P.colY, 1], [0, P.colY, 0]], 10, col.paper)];
      const colGeo = mergeGeometries(parts, false); parts.forEach((p) => p.dispose());
      await ctx.yield();
      const mats = [];
      for (let z = P.z0 + 5; z < P.z1 - 2; z += 12) for (const dz of [-1.9, 1.9]) mats.push(mat4(P.x0 + 2.6, 2, z + dz));
      for (let x = P.x0 + 14; x < P.x1 - 6; x += 12) for (const dx of [-1.9, 1.9]) mats.push(mat4(x + dx, 2, P.z1 - 2.6));
      // the forecourt's wing (along x COURT.x, facing the avenue) and its end pavilion (across z COURT.z, facing us)
      for (let z = FORECOURT_Z + 12; z < COURT.z - 4; z += 12) for (const dz of [-1.9, 1.9]) mats.push(mat4(COURT.x + 3.6, 2, z + dz));
      for (let x = -WALL_X + 8; x < COURT.x - 4; x += 12) for (const dx of [-1.9, 1.9]) mats.push(mat4(x + dx, 2, COURT.z + 3.6));
      instPair(colGeo, mats);
    }
    {
      const wl = COURT.z - FORECOURT_Z - 3, wz = FORECOURT_Z + 3 + wl / 2, ex = (COURT.x + 22 - WALL_X + 1) / 2, ew = COURT.x + 22 + WALL_X - 1;
      slab(COURT.x + 11, 0, wz, 22, 1.0, wl, col.paper, 1, 3); slab(COURT.x + 11, 1.0, wz, 20, 1.0, wl, col.paper, 1, 3);
      slab(COURT.x + 14, 2, wz, 12, P.colY, wl - 6, palWall, 4, 12);
      slab(COURT.x + 11, 2 + P.colY, wz, 20, P.roofY - P.colY - 2, wl, col.paper, 1, 1.6);
      slab(COURT.x + 1.4, P.roofY, wz, 0.6, 2.4, wl, col.paper, 1, 0.9);
      slab(ex, 0, COURT.z + 11, ew, 1.0, 22, col.paper, 1, 3); slab(ex, 1.0, COURT.z + 11, ew - 2, 1.0, 20, col.paper, 1, 3);
      slab(ex, 2, COURT.z + 14, ew - 10, P.colY, 12, palWall, 4, 12);
      slab(ex, 2 + P.colY, COURT.z + 11, ew - 2, P.roofY - P.colY - 2, 20, col.paper, 1, 1.6);
      slab(ex, P.roofY, COURT.z + 1.4, ew - 2, 2.4, 0.6, col.paper, 1, 0.9);
    }
    await ctx.yield();
    {
      const parts = [];
      const domeAt = (cx, cz, r, h, shellC, n = 28) => {      // drum, peristyle, ribbed shell, lantern and finial: returns the lantern's height
        const hs = r * 1.3, yS = h - hs - 12, at = mat4(cx, 0, cz);
        const drum = [[0, P.roofY, 0], [r + 4, P.roofY, 1], [r + 4, P.roofY + 5, 1], [r + 1, P.roofY + 6, 1]];
        const yM = Math.min(P.roofY + 16, yS - 14);
        drum.push([r + 1, yM, 1], [r + 2.2, yM + 0.8, 1], [r + 2.2, yM + 2, 1], [r - 0.5, yM + 2.6, 1]);
        parts.push(latheGeo(drum, n, col.paper, at));
        parts.push(meridians(latheGeo([[r - 0.5, yM + 2.6, 0], [r - 0.5, yS - 4.4, 0]], n, palWall, at), n));   // the peristyle of the drum
        parts.push(latheGeo([[r - 0.5, yS - 4.4, 1], [r + 2.6, yS - 3.6, 1], [r + 2.6, yS - 0.8, 1], [r, yS, 1]], n, col.paper, at));
        const shell = []; for (let k = 0; k <= 12; k++) { const a = (k / 12) * 1.44; shell.push([r * Math.cos(a) , yS + hs * Math.sin(a) / Math.sin(1.44), k === 0 ? 1 : 0]); }
        parts.push(meridians(latheGeo(shell, n, shellC, at), 16));
        const yT = yS + hs, rT = r * Math.cos(1.44);
        parts.push(latheGeo([[rT + 0.8, yT - 0.4, 1], [rT + 0.8, yT + 0.6, 1], [rT - 0.3, yT + 0.9, 1], [rT - 0.3, yT + 6.5, 1], [rT + 0.9, yT + 7, 1], [rT + 0.9, yT + 7.8, 1], [1.0, yT + 10.4, 1], [0.7, yT + 10.6, 0], [1.3, h - 1.5, 0], [1.2, h - 0.5, 0], [0, h, 0]], 14, col.paper, at));
        return yT;
      };
      const shellOf = (pn, i) => (snow ? col.paper : pn === nightPanel ? col.powder : [col.powder, col.green, col.salmon].filter((c) => c !== skyOrder[pn] && c !== palWall)[i % 2]);
      for (let i = 0; i < DOMES.length; i++) {
        const d = DOMES[i];
        await ctx.yield();
        d.lantern = domeAt(P.domeX, d.z, d.r, d.h, shellOf(panelOfZ(d.z), i));
      }
      await ctx.yield();
      domeAt(COURT.x + 14, 1512, 9.5, 86, shellOf(3, 0), 20);                                  // the wing's cupola
      await ctx.yield();
      domeAt((COURT.x - WALL_X) / 2, COURT.z + 14, 11, 96, shellOf(3, 1), 20);               // the end pavilion's, behind the last panel
      await ctx.yield();
      const g = mergeGeometries(parts, false); parts.forEach((p) => p.dispose());
      addPair(g, sTint, sHull);
    }
    await ctx.yield();
    // the end spire: it bends like rubber when a caster snags it, and springs back
    const bendU = { value: new THREE.Vector2() };
    const mkBend = (m) => { m.vertexShader = 'uniform vec2 uBend;\n' + m.vertexShader.replace('vec3 p = position;', 'vec3 p = position; p.xz += uBend * (p.y / 190.0) * (p.y / 190.0);'); m.uniforms.uBend = bendU; return m; };
    {
      const sp = [[0, P.roofY, 0], [9, P.roofY, 1], [9, 58, 1], [10.2, 59, 1], [10.2, 62, 1], [7, 64, 1], [7, 86, 1], [8, 87, 1], [8, 90, 1], [5.2, 93, 1]];
      for (let y = 99; y < 184; y += 6) sp.push([0.5 + 4.7 * (186 - y) / 93, y, y % 12 < 6 ? 1 : 0]);
      sp.push([0.5, 186, 1], [1.2, 187, 0], [1.2, 188.6, 0], [0, 189.4, 0]);
      addPair(latheGeo(sp, 14, col.paper, mat4(P.domeX, 0, P.spireZ)), mkBend(tintMaterial({ style: STYLE })), mkBend(hullMaterial({ style: STYLE })));
      let relX = 0, relZ = 0;
      tickers.push((u) => {
        const hold = smoothstep(0.806, 0.818, u) * (1 - smoothstep(0.84, 0.846, u));
        if (u < 0.846) {
          let bx = hero.feet[2].x - P.domeX, bz = hero.feet[2].z - P.spireZ; const l = Math.hypot(bx, bz);
          if (l > 46) { bx *= 46 / l; bz *= 46 / l; }
          bendU.value.set(bx * hold, bz * hold); if (u > 0.83) { relX = bx; relZ = bz; }
        } else { const t = u - 0.846, k = Math.exp(-t * 42) * Math.cos(t * 300) * 0.8; bendU.value.set(relX * k, relZ * k); }
      });
    }
    await ctx.yield();
    // ------------------------------------------------------------------------------------------ the elevated railway and its train
    const VIA_Z = 469.2, DECK = 18;
    for (const dz of [-3.6, 3.6]) slab(0, DECK - 3.4, VIA_Z + dz, 1500, 3.4, 0.3, col.paper, 2, 6.8);
    slab(0, DECK - 3.9, VIA_Z, 1500, 0.5, 7.5, col.paper, 1, 2);
    for (let x = 21; x < 740; x += 30) for (const s of [-1, 1]) for (const dz of [-3, 3]) slab(s * x, 0, VIA_Z + dz, 1.6, DECK - 3.9, 1.6, col.paper, 2, 3.2);
    const carCol = col.salmon;                              // one black engine and five salmon cars
    const train = new THREE.Group(); train.position.set(-400, DECK, VIA_Z); scene.add(train);
    {
      const L = [], S = (x, y, sx, sy, sz, c, pat = 0, pitch = 1) => L.push({ m: mat4(x, y + sy / 2, 0, sx, sy, sz), c, pat, pitch });
      S(30, 0.5, 8.5, 2.5, 2.5, col.ink); S(24.6, 0.5, 3.4, 3.7, 3.0, col.ink); S(33, 3.0, 0.9, 1.9, 0.9, col.ink); S(30.5, 3.0, 1.3, 0.8, 1.3, col.ink);
      S(35, 0.1, 1.6, 1.1, 2.9, col.ink);
      // so the engine reads as an engine at any size: brass boiler bands and dome, a paper cab window and roof
      for (const x of [27.2, 30, 32.8]) S(x, 0.45, 0.45, 2.6, 2.62, col.lemon);
      S(28.6, 3.0, 1.3, 1.0, 1.3, col.lemon); S(24.6, 2.5, 2.0, 1.1, 3.06, col.paper); S(24.6, 4.2, 4.2, 0.3, 3.4, col.paper);
      for (let k = 0; k < 5; k++) { S(16.6 - k * 11.6, 0.6, 10.6, 3.0, 2.9, carCol, 3, 1.5); S(16.6 - k * 11.6, 3.6, 11.0, 0.35, 3.2, col.paper); }
      for (let x = -32; x <= 34; x += 3.3) S(x, 0, 1.2, 0.6, 2.7, col.ink);
      makeSlabs(L, train);
    }
    // four trolley cars on the kerb lanes
    const TROL = [[13.5, 120, 1500], [13.5, 700, -900], [-13.5, 800, 500], [-13.5, 1500, -700]];
    const trolCol = [col.lemon, col.green, col.salmon, col.powder];
    const trolMesh = (() => {
      const L = [];
      for (let k = 0; k < 4; k++) { L.push({ m: mat4(0, 0, 0), c: trolCol[k], pat: 3, pitch: 1.3 }, { m: mat4(0, 0, 0), c: col.paper, pat: 1, pitch: 0.6 }, { m: mat4(0, 0, 0), c: col.ink }); }
      return makeSlabs(L);
    })();
    tickers.push((u) => {
      train.position.x = (u - 0.25) * 2600;
      for (let k = 0; k < 4; k++) {
        const [x, z0, v] = TROL[k], z = z0 + u * v;
        trolMesh.setMatrixAt(k * 3, tmp.m.compose(tmp.v.set(x, 2.1, z), tmp.q.identity(), tmp.v2.set(2.5, 2.8, 9.5)));
        trolMesh.setMatrixAt(k * 3 + 1, tmp.m.compose(tmp.v.set(x, 3.7, z), tmp.q.identity(), tmp.v2.set(2.8, 0.4, 10.2)));
        trolMesh.setMatrixAt(k * 3 + 2, tmp.m.compose(tmp.v.set(x, 0.45, z), tmp.q.identity(), tmp.v2.set(1.9, 0.5, 7.0)));
      }
      trolMesh.instanceMatrix.needsUpdate = true;
    });
    await ctx.yield();
    // ------------------------------------------------------------------------------------------ sprites: one quad, drawn by pen in its own material
    const quad = (() => { const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0], 3)); g.setIndex([0, 1, 2, 2, 1, 3]); return g; })();
    const spriteMesh = (attrs, n, mat, order = 0) => {
      const g = quad.clone(); for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k], attrs[k].length / n));
      g.instanceCount = n; const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = order; scene.add(m); return m;
    };
    const BILL = /* glsl */`
      // a quad standing at 'base': plumb and turned about the vertical when face is 0, square to the lens when face is 1
      vec3 bill(vec3 base, vec2 size, vec2 uv, float face){
        vec2 t = cameraPosition.xz - base.xz; float l = length(t);
        vec2 r = l > 1e-4 ? vec2(t.y, -t.x) / l : vec2(1.0, 0.0);
        vec3 right = mix(vec3(r.x, 0.0, r.y), vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), face);
        vec3 up = mix(vec3(0.0, 1.0, 0.0), vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]), face);
        right /= max(length(right), 1e-4); up /= max(length(up), 1e-4);
        return base + right * ((uv.x - 0.5) * size.x) + up * (uv.y * size.y);
      }
      // 0 while the eye is level, 1 when it looks steeply down (or up): then the small things are drawn as he drew them from above
      float steep(){ return smoothstep(0.35, 0.8, abs(viewMatrix[1][2])); }`;
    // street trees in tubs: a ruled trunk and one green ball crown in a single contour with three scallops, all alike
    {
      const T = [];
      const lines = [[19.6, 1], [-19.6, 1], [94.5, 0.6], [-94.5, 0.6], [109.5, 0.6], [-109.5, 0.6]];
      for (const [x, share] of lines) for (let z = -72; z < 1348; z += 16) {
        if (GATES.some((g) => Math.abs(z - g.z) < 9) || Math.abs(z - VIA_Z) < 7) continue;
        if (x > 60 && z > P.z0 - 10) continue;
        if (share < 1 && rng() > 0.25 + 0.75 * detail) continue;
        T.push(x, 0, z, rng());
      }
      // the last court is planted too: two ranks of tubs down the forecourt, either side of the last panel (placed by hash: no draw from rng)
      for (const x of [-19.6, 36.5]) for (let z = FORECOURT_Z + 14; z < COURT.z - 8; z += 16) T.push(x, 0, z, (z * 0.3719 + x * 0.113) % 1);
      const n = T.length / 4;
      const treeMat = new THREE.ShaderMaterial({
        uniforms: { ...U, uGreen: { value: col.green }, uTub: { value: col.lemon } },
        vertexShader: /* glsl */`${BILL}
          attribute vec4 iT; varying vec2 vP; varying float vZ, vS;
          void main(){ vS = iT.w; vec3 w = bill(iT.xyz, vec2(7.0, 10.5), position.xy, 0.85 * steep()); vP = (position.xy - vec2(0.5, 0.0)) * vec2(7.0, 10.5);
            vec4 mv = viewMatrix * vec4(w, 1.0); vZ = -mv.z; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`
          ${STYLE_GLSL}
          uniform vec3 uGreen, uTub; uniform float uSnow; varying vec2 vP; varying float vZ, vS;
          float crown(vec2 p){ return min(min(length(p - vec2(-1.25, 6.6)) - 1.75, length(p - vec2(1.25, 6.6)) - 1.75), min(length(p - vec2(0.0, 8.0)) - 1.9, length(p - vec2(0.0, 6.3)) - 1.6)); }
          float seg(vec2 p, vec2 a, vec2 b){ vec2 d = b - a; return length(p - a - d * clamp(dot(p - a, d) / dot(d, d), 0.0, 1.0)); }
          void main(){
            float px = max(fwidth(vP.y), 1e-5), lw = uLine * px;
            vec2 pt = vP - vec2(uReg.x, uReg.y) * px;
            float tub = max(abs(vP.x) - (0.75 + 0.12 * vP.y), abs(vP.y - 0.6) - 0.6);
            float trunk = max(abs(vP.x) - 0.17, abs(vP.y - 3.2) - 2.2);
            vec2 sw = vec2(0.24 * sin(uTime * 1.4 + vS * 6.283) * smoothstep(4.0, 8.5, vP.y), 0.0);   // the ball crowns nod, each in its own time
            float cr = crown(vP - sw), twig = 9.0;
            twig = min(min(seg(vP, vec2(0.0, 5.0), vec2(-1.7, 7.6)), seg(vP, vec2(0.0, 5.0), vec2(1.5, 7.9))), min(seg(vP, vec2(0.0, 5.0), vec2(0.1, 8.8)), min(seg(vP, vec2(-0.9, 6.4), vec2(-0.6, 8.3)), seg(vP, vec2(0.8, 6.5), vec2(2.2, 6.9)))));
            cr = mix(cr, 9.0, uSnow);
            float solid = min(min(tub, trunk), cr);
            float tw = uSnow * step(twig, lw);
            if (solid > lw && tw < 0.5) discard;
            float ink = max(step(abs(solid), lw), tw);
            vec3 c = uPaper;
            c = mix(c, uGreen, step(crown(pt - sw), 0.0) * step(cr, 0.0));
            c = mix(c, uTub, step(tub, 0.0) * step(max(abs(pt.x) - (0.75 + 0.12 * pt.y), abs(pt.y - 0.6) - 0.6), 0.0));
            float far = smoothstep(2.0, 4.0, 1.0 / px);                 // ruling and hoops only while a metre is a few pixels
            ink = max(ink, far * step(cr, 0.0) * step(0.5, vP.x) * mcRule(vP.y / 4.0, 4.0, vZ));
            ink = max(ink, far * step(tub, 0.0) * step(abs(vP.y - 0.75), lw * 0.7));
            gl_FragColor = vec4(mix(c, uInk, clamp(ink, 0.0, 1.0)), 1.0);
          }`,
      });
      spriteMesh({ iT: new Float32Array(T) }, n, treeMat);
    }
    await ctx.yield();
    // smoke and cloud: bare paper inside one scalloped pen line. Smoke unrolls upward from the roofs; clouds drift.
    {
      const A = [], B = [];
      const smokers = roofs.filter((l) => Math.abs(l.col) <= 2 && !l.walker && !l.extra && l.z > -40 && l.z < 1700);
      const nSmoke = Math.min(smokers.length, Math.round(120 * detail * density));
      for (let i = 0; i < nSmoke; i++) {
        const l = smokers[Math.floor((i + 0.5) * smokers.length / nSmoke)];
        A.push(l.x + rng.range(-0.3, 0.3) * l.w, 0, l.z + rng.range(-0.3, 0.3) * l.d, 0); B.push(13, 44, rng() * 50, l.h / STOREY);
      }
      for (let p = 0; p < 4; p++) for (let k = 0; k < 6; k++) {
        const z0 = p === 0 ? 300 : GATES[p - 1].z + 260, side = k % 2 ? 1 : -1;
        const high = k < 3;                                 // the low ones keep to the sides, clear of the path and the bed
        A.push(side * (high ? rng.range(0, 190) : rng.range(230, 640)), high ? rng.range(370, 560) : rng.range(150, 330), z0 + rng.range(0, 700), 1); B.push(rng.range(130, 210), rng.range(48, 70), rng() * 50, 0);
      }
      const n = A.length / 4;
      const puffMat = new THREE.ShaderMaterial({
        uniforms: { ...U },
        vertexShader: /* glsl */`${BILL}
          attribute vec4 iA, iB; uniform float uCamZ, uTime; varying vec2 vP; varying vec4 vK;
          ${BLOCK_COMMON}
          void main(){
            vec3 base = iA.xyz;
            if (iA.w < 0.5) base.y = heightOf(storeysNow(iB.w, iA.z)) + 6.0; else base.x += mod(uTime * 10.0 + iB.z * 40.0, 160.0) - 80.0;
            vec3 w = bill(base, iB.xy, position.xy, iA.w > 0.5 ? 1.0 : 0.6 * steep()); vP = (position.xy - vec2(0.5, 0.0)) * iB.xy; vK = vec4(iB.x, iB.y, iB.z, iA.w);
            gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
          }`,
        fragmentShader: /* glsl */`
          ${STYLE_GLSL}
          varying vec2 vP; varying vec4 vK;
          void main(){
            float px = max(fwidth(vP.y), 1e-5), lw = uLine * px, sd = 1e3, curl = 0.0;
            if (vK.w < 0.5) {
              for (int k = 0; k < 7; k++) {
                float t = fract(float(k) / 7.0 + uTime * 0.08 + vK.z), y = t * (vK.y - 9.0) + 1.0;
                float r = (0.9 + 5.2 * t) * smoothstep(1.0, 0.86, t);
                vec2 c = vec2(sin(y * 0.16 + vK.z + float(k) * 2.4) * (0.6 + 3.0 * t) + 4.0 * t * t, y);
                float d = length(vP - c) - r; sd = min(sd, d);
                vec2 q = vP - c; float a = atan(q.y, q.x + 1e-5) + uTime * 0.6 + float(k);
                curl = max(curl, step(abs(length(q) - r * (0.3 + 0.07 * a)), lw) * step(d, -lw * 2.0) * step(0.5, r) * step(abs(a), 2.6));
              }
            } else {
              for (int k = 0; k < 7; k++) {
                float f = float(k) / 6.0, h = fract(sin(float(k) * 12.9898 + vK.z) * 43758.5453);
                float r = vK.y * (0.2 + 0.2 * sin(f * 3.1416) + 0.08 * h) * (1.0 + 0.07 * sin(uTime * 1.3 + float(k) * 1.7 + vK.z));   // the scallops breathe
                vec2 c = vec2((f - 0.5) * (vK.x - vK.y * 1.2), r + vK.y * 0.02);
                sd = min(sd, length(vP - c) - r);
              }
              sd = max(sd, vK.y * 0.13 - vP.y);                       // a flat base
            }
            float d = sd / px;                                         // one clean even contour: inked from the edge inward, smooth on its inner side
            if (d > uLine) discard;
            float ink = max(d > -0.5 ? 1.0 : 1.0 - smoothstep(0.0, 1.0, -d - 2.0 * uLine + 1.0), curl);
            gl_FragColor = vec4(mix(uPaper, uInk, ink), 1.0);
          }`,
      });
      spriteMesh({ iA: new Float32Array(A), iB: new Float32Array(B) }, n, puffMat);
    }
    await ctx.yield();
    // ------------------------------------------------------------------------------------------ pigeons: paper body, powder wing, four poses
    const falls = hero.anchors.footfalls;
    const NINE = 9, FLOCK = 28, FLOCK2 = 22, bedU = { value: new THREE.Vector3() };
    let pigeonAttr = null;
    {
      const A = [], B = [];                                  // iP: x, y, z, kind (0 sits, 2 keeps station)   iQ: storeys (0 = fixed y), block z, burst u, seed
      const burstU = (x, z) => { for (const f of falls) if (f.u > 0.012 && Math.hypot(f.x - x, f.z - z) < 70) return f.u; return 9; };
      const rows = [];
      for (const l of roofs) if (Math.abs(l.col) === 1 && !l.walker && !l.extra && l.z < 1500) rows.push({ x: Math.sign(l.col) * (WALL_X - 0.7), y: 1.6, z: l.z + rng.range(-0.3, 0.3) * l.d, S: l.h / STOREY, zb: l.z, n: rng.int(4, 7) });
      for (const s of [-1, 1]) rows.push({ x: s * 10, y: DECK + 0.15, z: VIA_Z + s * 3.6, S: 0, zb: 0, n: 9, alongX: true });
      rows.push({ x: P.x0 + 0.4, y: P.roofY + 2.5, z: 1010, S: 0, zb: 0, n: 8 }, { x: P.x0 + 0.4, y: P.roofY + 2.5, z: 1190, S: 0, zb: 0, n: 8 });
      const want = Math.round(291 * (0.5 + 0.5 * detail));
      let total = 0; for (const r of rows) total += r.n;
      for (const r of rows) {
        const n = Math.max(2, Math.round(r.n * Math.min(1.6, want / total)));
        for (let k = 0; k < n; k++) {
          const x = r.alongX ? r.x + (k - n / 2) * 1.5 : r.x, z = r.alongX ? r.z : r.z + (k - n / 2) * 1.5;
          A.push(x, r.y, z, 0); B.push(r.S, r.zb, burstU(x, z) + rng() * 0.004, rng());
        }
      }
      for (let k = 0; k < NINE; k++) { A.push(0, 0, 0, 2); B.push(0, 0, 9, rng()); }
      for (let k = 0; k < FLOCK; k++) { A.push(0, 0, 0, 3); B.push(0, 0, 9, rng()); }   // a loose flock wheels under the bed, always
      for (let k = 0; k < FLOCK2; k++) { A.push(0, 0, 0, 3); B.push(0, 0, 9, (k * 0.6180339 + 0.137) % 1); }   // and more of it (seeded by count: no draw from rng)
      const n = A.length / 4;
      await ctx.yield();
      const pigeonMat = new THREE.ShaderMaterial({
        uniforms: { ...U, uWing: { value: col.powder }, uBed: { value: bedU.value } },
        vertexShader: /* glsl */`
          attribute vec4 iP, iQ; uniform float uCamZ, uU, uTime; uniform vec3 uBed; varying vec2 vP; varying vec2 vPose;
          ${BLOCK_COMMON}
          void main(){
            vec3 c = iP.xyz; float fly = step(1.5, iP.w), sc = 1.5 + 0.5 * fly;
            if (iP.w < 0.5) {
              if (iQ.x > 0.5) c.y += heightOf(storeysNow(iQ.x, iQ.y));
              float t = uU - iQ.z;
              if (t > 0.0) {
                float a = iQ.w * 6.283, k = min(t, 0.12);
                c += vec3(cos(a) * 0.5 - sign(c.x) * 0.6, 0.9 + 0.5 * sin(a * 3.0), sin(a) * 0.5 + 0.5) * (k * 700.0) + vec3(sin(t * 160.0 + a), 0.0, cos(t * 130.0 + a)) * 4.0;
                fly = 1.0; sc *= 1.0 - smoothstep(0.08, 0.115, t);
              }
            }
            if (iP.w > 2.5) {
              float a = uTime * (0.35 + 0.3 * iQ.w) * (fract(iQ.w * 5.0) < 0.5 ? 1.0 : -1.0) + iQ.w * 40.0, R = 15.0 + 15.0 * fract(iQ.w * 7.0);
              c = uBed + vec3(cos(a) * R, -5.0 - 9.0 * fract(iQ.w * 13.0) + 1.5 * sin(a * 2.0), sin(a) * R * 1.25);
              if (fract(iQ.w * 3.0) < 0.5) c.y = min(c.y, 9.0 + 16.0 * fract(iQ.w * 13.0));      // half of them wheel low, among the legs
              sc *= smoothstep(3.0, 8.0, distance(c, cameraPosition));
            }
            vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
            vP = position.xy * 2.0 - 1.0;
            vPose = vec2(fly, floor(fract(uTime * 2.6 + iQ.w * 9.0) * 4.0));
            vec3 w = c + (right * vP.x + up * (vP.y + 0.55 * (1.0 - fly))) * sc * 0.5 * mix(0.75, 1.0, fly);
            gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
          }`,
        fragmentShader: /* glsl */`
          ${STYLE_GLSL}
          uniform vec3 uWing; varying vec2 vP; varying vec2 vPose;
          float wing(vec2 p, vec2 a, vec2 b){ vec2 d = b - a; float t = clamp(dot(p - a, d) / dot(d, d), 0.0, 1.0); return length(p - a - d * t) - mix(0.17, 0.03, t * t); }
          float ell(vec2 p, vec2 r){ return (length(p / r) - 1.0) * min(r.x, r.y); }
          void main(){
            float px = max(fwidth(vP.y), 1e-5), lw = uLine * px, body, wg, feather = 0.0;
            vec2 p = vP;
            if (vPose.x > 0.5) {
              float a = vPose.y < 0.5 ? -0.42 : vPose.y < 1.5 ? -0.08 : vPose.y < 2.5 ? 0.3 : 0.62;
              vec2 tip = vec2(cos(a), sin(a)) * 0.86; p.x = abs(p.x);
              wg = wing(p, vec2(0.1, 0.02), vec2(0.1, 0.02) + tip);
              vec2 ax = tip / 0.86, q = p - vec2(0.1, 0.02);
              feather = step(abs(dot(q, vec2(-ax.y, ax.x)) + 0.05), lw * 0.6) * step(0.2, dot(q, ax)) * step(dot(q, ax), 0.66);
              body = min(ell(p - vec2(0.0, -0.04), vec2(0.14, 0.15)), length(p - vec2(0.0, 0.1)) - 0.085);
              body = min(body, max(abs(p.x) - 0.1 * (-p.y - 0.08) * 3.0, abs(p.y + 0.24) - 0.1));
            } else {
              body = min(ell(p - vec2(0.0, -0.1), vec2(0.42, 0.24)), length(p - vec2(0.36, 0.2)) - 0.15);
              body = min(body, max(abs(p.y - 0.18 + (p.x - 0.5) * 0.5) - 0.05, abs(p.x - 0.56) - 0.08));
              body = min(body, max(abs(p.x + 0.52) - 0.2, abs(p.y + 0.02 - (p.x + 0.5) * 0.3) - 0.07));
              wg = ell(p - vec2(-0.1, -0.06), vec2(0.3, 0.15));
              feather = step(abs(p.y + 0.06 - (p.x + 0.1) * 0.1), lw * 0.6) * step(abs(p.x + 0.12), 0.2);
            }
            float sd = min(body, wg);
            if (sd > lw) discard;
            float ink = max(max(step(abs(body), lw), step(abs(wg), lw) * step(0.0, body)), feather * step(wg, 0.0) * step(0.0, body));
            float wingIn = vPose.x > 0.5 ? step(wg, 0.0) * step(0.0, body) : step(wg, 0.0);
            ink = max(ink, (1.0 - vPose.x) * step(abs(wg), lw));
            gl_FragColor = vec4(mix(mix(uPaper, uWing, wingIn), uInk, clamp(ink, 0.0, 1.0)), 1.0);
          }`,
      });
      const mesh = spriteMesh({ iP: new Float32Array(A), iQ: new Float32Array(B) }, n, pigeonMat, 2);
      pigeonAttr = mesh.geometry.attributes.iP; pigeonAttr.setUsage(THREE.DynamicDrawUsage);
      const base = n - NINE - FLOCK - FLOCK2, pp = new THREE.Vector3(), plen = path.length;
      tickers.push((u, time) => {
        // the loose flock wheels under the bed; when the bed is far off (up on the domes) it wheels 45 m ahead of the lens instead
        path.posAtDist(Math.min(u * plen + 45, plen), pp); pp.y -= 4;
        bedU.value.copy(hero.body.position); bedU.value.lerp(pp, smoothstep(70, 110, bedU.value.distanceTo(pp)));
        // the flight of nine keeps station off our side, then peels away
        const away = Math.max(0, u - 0.14);
        for (let k = 0; k < NINE; k++) {
          path.posAtDist(u * plen + 4.6 + k * 1.15, pp);
          const hide = away > 0.07 ? 1e5 : 0;
          pigeonAttr.setXYZ(base + k, pp.x - (1.9 + 0.62 * ((k * 3) % 5) + 0.2 * k) - away * 260, pp.y - 1.0 + 0.75 * ((k * 2) % 3) + 0.2 * Math.sin(time * 2 + k) + away * 700 + hide, pp.z + away * 300);
        }
        pigeonAttr.needsUpdate = true;
      });
    }
    await ctx.yield();
    // ------------------------------------------------------------------------------------------ the crowd: a hat and a coat, six thousand times
    const fallU = [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 9, 0));
    {
      const n = Math.round(6000 * detail * density), A = new Float32Array(n * 4), B = new Float32Array(n * 4);
      const tints = [col.salmon, col.powder, col.lemon, col.green, col.paper];
      for (let i = 0; i < n; i++) {
        const r = rng(), s = rng() < 0.5 ? -1 : 1;
        const x = r < 0.62 ? s * rng.range(KERB + 0.9, WALL_X - 0.8) : s * rng.range(WALL_X + BLOCK_W + 1, WALL_X + COL_PITCH - 1);
        const c = tints[rng.int(0, 4)];
        A.set([x, rng.range(-80, 1350), (rng() < 0.5 ? -1 : 1) * rng.range(0.9, 1.7), rng()], i * 4); B.set([c.r, c.g, c.b, 0], i * 4);
      }
      await ctx.yield();
      const crowdMat = new THREE.ShaderMaterial({
        uniforms: { ...U, uFall: { value: fallU } },
        vertexShader: /* glsl */`${BILL}
          attribute vec4 iA, iB; uniform float uTime, uPxAng; uniform vec4 uFall[4]; varying vec2 vP; varying vec3 vC;
          void main(){
            vec3 b = vec3(iA.x, 0.0, mod(iA.y + iA.z * uTime + 80.0, 1430.0) - 80.0);
            for (int k = 0; k < 4; k++) {                          // they scatter in a ring from each footfall
              vec2 d = b.xz - uFall[k].xy; float l = length(d), age = uFall[k].z;
              float amp = 15.0 * smoothstep(0.0, 0.004, age) * (1.0 - smoothstep(0.035, 0.07, age)) * (1.0 - smoothstep(6.0, 30.0, l));
              b.xz += (l > 1e-3 ? d / l : vec2(1.0, 0.0)) * amp;
            }
            float show = smoothstep(26.0, 40.0, distance(cameraPosition, b));
            float dot3 = 3.4 * uPxAng * distance(cameraPosition, b) * steep();      // from the high eye each is a dot of tint, never under 3 px
            vec3 w = bill(b, max(vec2(1.3, 2.1), vec2(dot3)) * show, position.xy, steep()); vP = (position.xy - vec2(0.5, 0.0)) * vec2(1.3, 2.1); vC = iB.rgb;
            gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
          }`,
        fragmentShader: /* glsl */`
          ${STYLE_GLSL}
          varying vec2 vP; varying vec3 vC;
          void main(){
            float px = max(fwidth(vP.y), 1e-5), lw = uLine * px;
            float coat = max(abs(vP.x) - (0.2 + 0.18 * (1.5 - vP.y)), abs(vP.y - 0.75) - 0.75);
            float hat = min(max(abs(vP.x) - 0.36, abs(vP.y - 1.62) - 0.05), max(abs(vP.x) - 0.2, abs(vP.y - 1.8) - 0.2));
            float sd = min(coat, hat), fine = smoothstep(9.0, 16.0, 2.1 / px);
            if (sd > lw * fine) discard;
            float ink = step(abs(sd), lw) * fine;
            gl_FragColor = vec4(mix(mix(vC, uPaper, step(hat, 0.0) * fine), uInk, ink), 1.0);
          }`,
      });
      spriteMesh({ iA: A, iB: B }, n, crowdMat, 1);
      const street = falls.filter((f) => f.y < 3);
      tickers.push((u) => {
        let j = 0; while (j < street.length && street[j].u <= u) j++;
        for (let k = 0; k < 4; k++) { const f = street[j - 1 - k]; if (f) fallU[k].set(f.x, f.z, u - f.u, 0); else fallU[k].set(0, -9999, 9, 0); }
      });
    }
    await ctx.yield();
    // ------------------------------------------------------------------------------------------ two flat skyline bands round the page
    {
      const P3 = [], Q = [], I = []; let v = 0;
      const strip = (ax, az, bx, bz, h, band) => { const len = Math.hypot(bx - ax, bz - az); P3.push(ax, 0, az, bx, 0, bz, ax, h, az, bx, h, bz); Q.push(0, 0, band, len, 0, band, 0, h, band, len, h, band); I.push(v, v + 1, v + 2, v + 2, v + 1, v + 3); v += 4; };
      for (const [X, Z, h, band] of [[790, 1960, 170, 0], [900, 2070, 290, 1]]) { strip(-X, -260, -X, Z, h, band); strip(X, -260, X, Z, h, band); strip(-X, Z, X, Z, h, band); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); g.setAttribute('q', new THREE.Float32BufferAttribute(Q, 3)); g.setIndex(I);
      const wl = [0, 1, 2, 3].map((p) => wallsOf(p));
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: { ...U, uGateZ: { value: new THREE.Vector3(GATES[0].z, GATES[1].z, GATES[2].z) }, uA: { value: wl.map((w) => w[0]) }, uB: { value: wl.map((w, p) => (p === nightPanel ? col.powder : w[1])) } },
        side: THREE.DoubleSide,
        vertexShader: /* glsl */`attribute vec3 q; varying vec3 vQ; varying float vWz;
          void main(){ vQ = q; vec4 w = modelMatrix * vec4(position, 1.0); vWz = w.z; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */`
          ${STYLE_GLSL}
          uniform vec3 uGateZ; uniform vec3 uA[4]; uniform vec3 uB[4]; varying vec3 vQ; varying float vWz;
          float roofAt(float c, float band){ float h = fract(sin(c * 91.7 + band * 17.3) * 43758.5453); return (band < 0.5 ? 150.0 : 262.0) * (0.5 + 0.5 * h * h); }
          void main(){
            vec2 fw = max(fwidth(vQ.xy), vec2(1e-5));
            float w = vQ.z < 0.5 ? 19.0 : 27.0, c = floor(vQ.x / w), f = vQ.x - c * w;
            float h = roofAt(c, vQ.z), hl = roofAt(c - 1.0, vQ.z), hr = roofAt(c + 1.0, vQ.z);
            if (vQ.y > h + uLine * fw.y) discard;
            float ink = step(h - vQ.y, uLine * fw.y);
            ink = max(ink, step(f, uLine * fw.x) * step(min(h, hl), vQ.y));
            ink = max(ink, step(w - f, uLine * fw.x) * step(min(h, hr), vQ.y));
            float pn = step(uGateZ.x, vWz) + step(uGateZ.y, vWz) + step(uGateZ.z, vWz);
            vec3 a = pn < 0.5 ? uA[0] : pn < 1.5 ? uA[1] : pn < 2.5 ? uA[2] : uA[3];
            vec3 b = pn < 0.5 ? uB[0] : pn < 1.5 ? uB[1] : pn < 2.5 ? uB[2] : uB[3];
            // ranked windows, left as paper: on when a bay is 3 px or more on screen, off (flat tint) when it is less
            vec2 cw = vec2(w * 0.5, 12.0), wc = vec2(f, vQ.y) / cw, wm = abs(fract(wc) - 0.5);
            float wOn = step(3.2, min(cw.x / fw.x, cw.y / fw.y)) * step(wm.x, 0.27) * step(wm.y, 0.3) * step(floor(wc.y) + 1.0, (h - 5.0) / cw.y) * step(1.0, wc.y);
            gl_FragColor = vec4(mix(mix(vQ.z < 0.5 ? a : b, uPaper, wOn), uInk, ink), 1.0);
          }`,
      }));
      m.frustumCulled = false; scene.add(m);
    }
    // ------------------------------------------------------------------------------------------ snow edition: small open pen rings, falling
    if (snow) {
      const n = Math.round(1500 * detail), A = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) A.set([rng() * 110, rng() * 90, rng() * 110, rng()], i * 4);
      spriteMesh({ iA: A }, n, new THREE.ShaderMaterial({
        uniforms: { ...U },
        vertexShader: /* glsl */`attribute vec4 iA; uniform float uTime; varying vec2 vP;
          void main(){
            vec3 box = vec3(110.0, 90.0, 110.0);
            vec3 p = iA.xyz + vec3(sin(uTime * 0.5 + iA.w * 20.0) * 1.5 + uTime * 1.2, -uTime * (3.5 + 2.5 * iA.w), 0.0);
            p = mod(p - cameraPosition, box) - box * 0.5 + cameraPosition;
            vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
            vP = position.xy * 2.0 - 1.0;
            float sz = (0.13 + 0.12 * iA.w) * smoothstep(2.5, 9.0, distance(p, cameraPosition));
            gl_Position = projectionMatrix * viewMatrix * vec4(p + (right * vP.x + up * vP.y) * sz, 1.0);
          }`,
        fragmentShader: /* glsl */`
          ${STYLE_GLSL}
          varying vec2 vP;
          void main(){ float px = max(fwidth(vP.y), 1e-5), r = length(vP) - (1.0 - 2.5 * px);
            if (abs(r) > uLine * px) { if (r > 0.0) discard; gl_FragColor = vec4(uPaper, 1.0); return; }
            gl_FragColor = vec4(uInk, 1.0); }`,
      }), 3);
    }
    await ctx.yield();
    // ------------------------------------------------------------------------------------------ rare: the street gets up
    if (rare && walkers.length) {
      const LEG = 46, prof = [[0, 0, 0], [1.0, 0, 1], [1.1, 0.5, 0], [1.0, 1.1, 1], [0.5, 1.5, 1]];
      for (let y = 5; y < LEG - 2; y += 5) prof.push([0.5, y - 0.5, 1], [0.8, y - 0.3, 1], [0.8, y + 0.3, 1], [0.5, y + 0.5, 1]);
      prof.push([0.5, LEG, 1]);
      const legGeo = latheGeo(prof, 10, col.lemon), ident = walkers.flatMap(() => [0, 1, 2, 3].map(() => new THREE.Matrix4().makeScale(0, 0, 0)));
      const [la, lb] = instPair(legGeo, ident);
      const ex = new THREE.Vector3(1, 0, 0);
      tickers.push((u) => {
        const lift = 44 * bump(0.545, 0.59, 0.735, 0.775, u), go = smoothstep(0.59, 0.735, u), shift = walkShift * go;
        const ph = shift / 22, striding = bump(0.585, 0.6, 0.725, 0.74, u);
        U.uWalk.value.set(lift, shift, ph, 1);
        let i = 0;
        for (const w of walkers) for (let k = 0; k < 4; k++, i++) {
          const sx = k < 2 ? -1 : 1, sz = k % 2 ? 1 : -1;
          const dz = 8 * striding * Math.sin(ph * 6.283 + ((k === 0 || k === 3) ? 0 : Math.PI));
          const len = Math.hypot(lift, dz), sway = lift * 0.04 * Math.sin(ph * 6.283 + w.z);
          tmp.q.setFromAxisAngle(ex, Math.atan2(-dz, Math.max(lift, 0.01)));
          tmp.m.compose(tmp.v.set(w.x + sx * (w.w / 2 - 3) + sway * 0.5, 0, w.z + sz * (w.d / 2 - 3) + shift + dz), tmp.q, tmp.v2.set(lift > 0.05 ? 2.2 : 0, len / LEG, lift > 0.05 ? 2.2 : 0));
          la.setMatrixAt(i, tmp.m); lb.setMatrixAt(i, tmp.m);
        }
        la.instanceMatrix.needsUpdate = lb.instanceMatrix.needsUpdate = true;
      });
    }
    await ctx.yield();
    makeSlabs(slabs);
    await ctx.yield();
    // ------------------------------------------------------------------------------------------ the last panel: a small black square
    const endFrame = new THREE.Group(); endFrame.matrixAutoUpdate = false; path.frameAt(1, endFrame.matrix, true); endFrame.matrixWorldNeedsUpdate = true; scene.add(endFrame);
    const cube = new THREE.BoxGeometry(1, 1, 1);
    for (const [x, y, w, h] of [[0, 7.4, 16.6, 1.8], [0, -7.4, 16.6, 1.8], [-7.4, 0, 1.8, 13], [7.4, 0, 1.8, 13]]) {
      const m = new THREE.Mesh(cube, blackMat); m.position.set(x, y, 0.3); m.scale.set(w, h, 0.6); endFrame.add(m);
    }
    for (const s of [-1, 1]) {                                // the easel struts it leans on
      const m = new THREE.Mesh(cube, blackMat); m.position.set(s * 7.1, 9.2, LAND[2] + 6.6); m.scale.set(0.5, 13.4, 0.5); m.rotation.x = 0.36; scene.add(m);
    }

    // ------------------------------------------------------------------------------------------ every frame
    const camPos = new THREE.Vector3(), tA = new THREE.Vector3(), tB = new THREE.Vector3();
    const bump = (a, b, c, d, u) => smoothstep(a, b, u) * (1 - smoothstep(c, d, u));
    const bedPoi = new THREE.Vector3(), poiB = new THREE.Vector3();
    // the gaze is worked out before update() runs, from the bed's live joints. In flight those are one frame old (nothing);
    // when the page is opened at a place (a still, a preview) they would be from somewhere else, so the bed is posed first.
    let lastU = 0;
    const live = (u) => { if (Math.abs(u - lastU) > 0.004) hero.setProgress(u); lastU = u; };
    function update(dt, time, camera, u) {
      lastU = u;
      camera.getWorldPosition(camPos);
      const pe = camera.projectionMatrix && camera.projectionMatrix.elements, fovK = pe && pe[5] > 0.2 ? 1.664 / pe[5] : 1;   // 1 at the world's own 62 degrees
      const camZ = pz(u);
      U.uCamZ.value = camZ; U.uU.value = u;
      hero.setProgress(u); hero.update(dt, time, camera);
      const hem = 0.22 * Math.sin(time * 1.5) + 0.1 * Math.sin(time * 2.7);          // the quilt's hem stirs even while the page holds still
      hero.materials.tint.uniforms.uSway.value += hem; hero.materials.hull.uniforms.uSway.value += hem;
      // the tint plate lags the line plate: a hair off always, 3 px more whenever the path turns, and it breathes
      path.tangentAt(Math.min(1, u + 0.006), tA); path.tangentAt(Math.max(0, u - 0.006), tB); tA.sub(tB);
      STYLE.uReg.value.set(1.5 + 3 * clamp(tA.x * 9, -1, 1) + 0.45 * Math.sin(time * 1.7), 1.0 + 3 * clamp(tA.y * 9, -1, 1) + 0.45 * Math.sin(time * 1.3 + 1));
      skyMat.uniforms.uPanel.value = panelOfZ(camPos.z);
      for (let i = 0; i < 3; i++) {                            // each gate stands taller as we near it
        const G = gates[i], h = G.g.h * (0.5 + 0.5 * smoothstep(G.g.z - 520, G.g.z - 60, camZ));
        G.posts[0].scale.y = G.posts[1].scale.y = h; G.top.position.y = h; gateU[i].w = h + 0.75;
        // a panel frame is a bold black border at any size of the page: its bars are 1.5 m thick near, and far off never thinner
        // than about a sixtieth of the frame's height, so from a distance the gate reads as a frame and not as a loose pane
        const bw = Math.max(1.5, 0.018 * fovK * Math.hypot(camPos.z - G.g.z, Math.max(0, Math.abs(camPos.x - G.g.x) - G.g.w / 2)));
        G.posts[0].scale.x = G.posts[1].scale.x = bw; G.top.scale.y = bw; G.top.scale.x = G.g.w + 1.5 + bw;
      }
      for (let i = 0; i < tickers.length; i++) tickers[i](u, time, camera, dt, camPos);
    }
    update(0, 0, { getWorldPosition: (v) => v.copy(path.start), projectionMatrix: null }, 0);

    return {
      scene, path, duration: 44,
      pace: (u) => 1 - 0.3 * bump(0.17, 0.21, 0.29, 0.33, u) + 0.4 * bump(0.34, 0.38, 0.47, 0.5, u) - 0.38 * bump(0.495, 0.525, 0.575, 0.605, u) - 0.3 * bump(0.755, 0.785, 0.83, 0.86, u),
      camera: { fov: 62, near: 0.5, far: 6000, lookAhead: 26, sway: 0.25, bank: 0 },
      pois: [
        { at: (time, u) => { hero.anchors.bedAt(clamp(u, 0, 1), bedPoi); bedPoi.y += 3; bedPoi.z += 9 * bump(0.03, 0.05, 0.09, 0.12, u); return bedPoi; }, from: 0, to: 0.22, weight: 0.5 },
        // round the knee: the gaze climbs the fore port shin to the knee and holds the joint while we rise past it
        { at: (time, u) => { live(u); return bedPoi.lerpVectors(hero.feet[1], hero.knees[1], 0.2 + 0.8 * smoothstep(0.28, 0.315, u)); }, from: 0.27, to: 0.335, fade: 0.2, weight: 0.8 },
        // the climb beside the leg: first the fore port thigh where it passes a little below us, then the bed above and ahead with the ranked windows falling away below it
        { at: (time, u) => { live(u); bedPoi.copy(hero.body.position); bedPoi.y -= 6 * (1 - smoothstep(0.43, 0.48, u)); return bedPoi; }, from: 0.325, to: 0.525, fade: 0.1, weight: 0.8 },
        // over the quilt: quilt and pillow below, and between the rails down the ranked storeys to the street
        { at: (time, u) => { path.pointAt(clamp(u, 0, 1), bedPoi); bedPoi.y = 0; bedPoi.z += 330; return bedPoi; }, from: 0.525, to: 0.602, fade: 0.2, weight: 0.9 },
        { at: (time, u) => { live(u); bedPoi.addVectors(hero.feet[1], hero.feet[3]).multiplyScalar(0.5); return bedPoi.lerp(hero.body.position, 0.88 * smoothstep(0.63, 0.68, u)); }, from: 0.615, to: rare ? 0.655 : 0.755, weight: 0.8 },
        ...(rare && walkers.length ? [{ at: () => bedPoi.set(walkers[3].x + 20, 50 + U.uWalk.value.x, walkers[3].z + U.uWalk.value.y), from: 0.645, to: 0.765, weight: 0.7 }] : []),
        // the snag: bed and spire in one frame; then the falling bed all the way down
        { at: (time, u) => { live(u); const k = smoothstep(0.828, 0.862, u); bedPoi.copy(hero.body.position);
          bedPoi.y = lerp(lerp(spireTip[1], bedPoi.y, 0.45), bedPoi.y - 5, k); bedPoi.x = lerp(lerp(spireTip[0], bedPoi.x, 0.5), bedPoi.x, k); return bedPoi; }, from: 0.765, to: 0.975, fade: 0.14, weight: 0.68 },
      ],
      portal: { shape: 'rect', width: 13, height: 13, tilt: true, frame: 0, color: PALETTE[0], veil: '#' + (skyOrder[0] === col.salmon ? col.powder : skyOrder[0]).getHexString(),   // the last panel holds a flat slab of the first panel's tint, as every gate holds the next one's (never the court's own salmon)
        glow: 0, blendDistance: 30 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() { for (const d of disposables) d.dispose(); },
    };
  },
};
