// THE LONG SWAN: hero set piece and style kit for the world "the-long-swan".
// A photo-finish strip built in the round: +Z is the course and is also time. The swan dawdled over the line,
// so the strip has it 500 m long: a white clapboard ridge, eight tail feathers (wedges with a rachis and barbs), sixteen
// black webbed feet, a herringbone wake and, at the far end, a neck vault leaning over the lane and coming down to a
// head 39 m long, turned back toward the lane, with its eye, lores, knob and a red bill dipping in the river.
// The feet hang against the flank at the waterline: a short shank out of the feathers, the ankle at the top of the fan,
// three white toes spreading down to the water with the soot web between them, two ripple arcs where they meet the river.
//
// LOCAL SPACE: origin on the water under the middle of the bird, +Y up, +Z toward the finish line.
//   tail tips  z -236 .. -170      body ridge  z -190 .. +250, 26 m wide, back 13 m up, centred on x = 0
//   neck vault z +188 .. +248, a swan's S in profile: springs from the breast, crown about 40 m up (the top of the
//              tube about 50 m), comes down to the head at x = -46
//   head       skull centre (-45.5, 17.6, 226), bill tip in the river about 9 m port of the lane; its
//              right cheek (eye, lores) faces back down the lane.   The camera lane is on the -X (port) side.
//   In the world: place at (lane x + 20, 0, 540) so the body runs z 290..790 and the lane is 7..13 m off the flank.
//
// EXPORTS (the whole world is shaded with these, so the hero is not pasted in):
//   INK                     indices of the inks: white sky teal straw willow red soot skyTint riverTint (0..8), and
//                           sootDeep (9: the deeper soot as a face ink; strip and hairline materials only)
//   makeStyle(palette,o)    -> style { uniforms, ink[], deep[], pale, setGust(i,z,amp,width), tick(time) }: ONE per world.
//   STYLE_GLSL              vertex chunk: stripWarp(pos, aWob) = z stretch about a pivot, travelling wobble, gust kink;
//                           fragment chunk: stripInk(ink, deep, normalY) and stripFar(col, dist) = the distance rule.
//   stripMaterial(style,o)  material 1 "strip" (and crossers with o.stretch): flat ink by index, deeper shade where
//                           the normal faces down, distance paling. Geometry attributes: position, normal, aInk, aWob.
//   hairMaterial(style,o)   soot/white hairlines: ribbons widened in the vertex shader to hold 1.5 px. Never move.
//   StripGeo                builder: grid(nu,nv,fn,ink,wob) patches -> geometry with aInk/aWob (hard edges between patches);
//                           build(), or await buildY(ctx) for a large mesh (the same, yielding between its steps).
//   sweep(builder, profile, zs, o)  a constant-section ribbon swept along z with tapered ends (rule two).
//   hairGeo(lines)          ribbons for hairMaterial from polylines (await hairGeoY(lines, ctx) for a long list).
//   filmSwell(zWorld)       the faint width swell every 150 m that every ribbon shares (what the hand gets wrong).
//   deepOf(hex)             the one deeper shade of an ink.   FLOW = 21 (m/s the wobbles stream toward -Z).
//   No tone-map inverse anywhere: the world returns post { flat: 1, bloom 0, grade neutral } and inks are written as is.
//
// opts: palette (7 hex, brief order), detail 0.6..1 (thins boards, chevrons), black (bool; default 1 visit in 5),
//       zWorld (world z of the local origin, default 540: keeps film swell and wobble phases continuous with the world),
//       style (a style from makeStyle to share with the world; else the hero makes its own), autoGust (default true:
//       a demo gust loops on time until setProgress() or style.setGust() is used).
// returns: { object, radius, height, center (viewing hints: an orbit about the neck end), extent {min,max} (the true
//   box: 75 x 52 x 524 m), length, anchors, update, dispose, ground:false, style, info, setProgress(u), setRise(k) }
//   style.setGust(i, zWORLD, amp, halfWidth): gust z is in world metres; each stripMaterial takes o.zOffset = the
//   world z of its mesh origin (the hero uses opts.zWorld), so one kink crosses every ribbon at the same place.
//   setProgress(u): the world passes path u; gusts cross at the brief's 18 s and 26 s (u 0.45, 0.65) and the rare
//   "swan gets up" draw-in runs u 0.6..0.78 if opts.rise is true. setRise(k) drives the draw-in directly (0..1).
// anchors (local): portalSeat {position, facing} (the hoop, 140 m past the breast), flyThrough[] (lane, >= 6 m clear),
//   underNeck (where the camera passes the vault), viewpoints {tail, flank, web, vault}, webs[] (the sixteen feet),
//   bill, eye, neckCrown, flankX (x of the port flank at the waterline), stretchPivot.
// cost: about 60k triangles, 8 draw calls (body+tail, boards, neck+head, hairlines, webs, wake, two wings), 3 shader
//   programs beside the strip one, no lights, no textures, build about 200 ms with no step over 50 ms.
//   Expects a flat river at y = 0 and blue or teal behind (white on white is the risk). Wings exist only for the rise.
//   The black bird: boards in soot and the deeper soot by turns with white ones among them, a white hairline under every
//   other row, each web backed by a slightly larger white fan (its light edge), neck bands of soot, deeper soot and
//   white with white hairlines, a soot head with a white eye-streak and nail and a white bar across the red bill.
//   Each foot is a soot fan hanging from its ankle (see above); anchors.webs are the ankles; anchors.head is the middle
//   of the cheek that faces the lane. Board rows are laid by arclength s from the port waterline UP (side 0 is the lane side).
import * as THREE from 'three';

export const INK = { white: 0, sky: 1, teal: 2, straw: 3, willow: 4, red: 5, soot: 6, skyTint: 7, riverTint: 8, sootDeep: 9 };   // 9: strip and hairline materials only
export const FLOW = 21;
const DEFAULT_PALETTE = ['#FBFAF4', '#6DB7E8', '#4E8C86', '#D9BC6E', '#35704A', '#D9382C', '#23262B'];
const TAU = Math.PI * 2;
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
// a small generator of the hero's own, for lay-outs added later (so the seeded draws of earlier rounds keep their order)
const makeRngLocal = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

// the one deeper shade of an ink (display space): the brief fixes white -> #DCEBF2 and teal -> #3C7772.
export function deepOf(hex) {
  const h = hex.toUpperCase();
  if (h === '#FBFAF4') return '#DCEBF2';
  if (h === '#4E8C86') return '#3C7772';
  const c = new THREE.Color(hex), s = { h: 0, s: 0, l: 0 }; c.getHSL(s, THREE.SRGBColorSpace);
  c.setHSL(s.h, Math.min(1, s.s * 1.05), s.l * 0.82, THREE.SRGBColorSpace);
  return '#' + c.getHexString(THREE.SRGBColorSpace);
}
// the film ran unevenly: every ribbon shares this swell in width (multiply a section by it), period 150 m.
export const filmSwell = (zWorld) => 1 + 0.035 * Math.sin(zWorld * TAU / 150) + 0.012 * Math.sin(zWorld * TAU / 47 + 1.3);

export function makeStyle(palette = DEFAULT_PALETTE, o = {}) {
  const pal = DEFAULT_PALETTE.map((d, i) => (palette && palette[i]) || d);
  const mixHex = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
  const hex = [...pal, deepOf(pal[0]), mixHex(pal[0], pal[2], 0.3), mixHex(pal[6], '#000000', 0.42)];
  const ink = hex.map((h) => new THREE.Color(h));
  const deep = hex.map((h) => new THREE.Color(deepOf(h)));
  deep[INK.skyTint] = new THREE.Color(mixHex(hex[7], pal[1], 0.5)); deep[INK.riverTint] = new THREE.Color(mixHex(hex[8], pal[2], 0.3));
  const pale = new THREE.Color(o.pale || '#EEF4F1');
  const gust = []; for (let i = 0; i < 4; i++) gust.push(new THREE.Vector3(-1e5, 0, 30));
  const uniforms = {
    uTime: { value: 0 }, uFlow: { value: FLOW }, uInk: { value: ink }, uDeep: { value: deep }, uPale: { value: pale },
    uFar: { value: o.far || 950 },            // e-folding distance of the paling: 1/3 gone at 400 m, 2/3 at 1 km
    uGust: { value: gust },                   // xyz = WORLD z of the kink, amplitude (m), half width (m)
    uWobble: { value: o.wobble ?? 1 },        // weather: 1 fair, about 1.8 for the stiff breeze
    uViewH: { value: 720 },                   // drawing-buffer height in px (hairlines); set by the hero each frame
  };
  return {
    uniforms, ink, deep, pale, hex,
    setGust(i, z, amp = 1, width = 30) { gust[i & 3].set(z, amp, Math.max(1, width)); },
    tick(time) { uniforms.uTime.value = time; },
  };
}

export const STYLE_GLSL = {
  vertex: /* glsl */`
    uniform float uTime, uFlow, uWobble, uZOff; uniform vec3 uGust[4];   // uZOff: world z of this object's origin
    // aWob: x,y = amplitude of the wobble in x and y (m), z = wavelength (m), w = phase.
    // stretch: length is film speed over own speed: z is scaled about pivot (1 = a still thing or a true racer).
    vec3 stripWarp(vec3 p, vec4 w, float pivot, float stretch) {
      p.z = pivot + (p.z - pivot) * stretch;
      float zz = p.z + uZOff;
      float k = 6.2831853 / max(w.z, 1.0);
      float s = sin(k * (zz + uFlow * uTime) + w.w) + 0.35 * sin(2.3 * k * (zz + uFlow * uTime) + 1.7 * w.w);
      float g = 0.0;
      for (int i = 0; i < 4; i++) { float d = (zz - uGust[i].x) / max(uGust[i].z, 1.0); g += uGust[i].y * exp(-d * d); }
      p.xy += w.xy * (s * uWobble + g * 3.0);
      return p;
    }`,
  fragment: /* glsl */`
    uniform vec3 uPale; uniform float uFar;
    // one flat ink, or its one deeper shade where the surface turns downward. ny = world normal y, fw = its fwidth.
    vec3 stripInk(vec3 ink, vec3 deep, float ny, float fw) { float f = max(fw, 0.002); return mix(deep, ink, smoothstep(-0.30 - f, -0.30 + f, ny)); }
    // distance is the only atmosphere: every ink mixes evenly (in display space) toward the pale.
    vec3 stripFar(vec3 c, float dist) {
      float f = 1.0 - exp(-max(dist, 0.0) / max(uFar, 1.0));
      vec3 a = pow(max(c, vec3(1e-5)), vec3(0.4545)), b = pow(max(uPale, vec3(1e-5)), vec3(0.4545));
      return pow(max(mix(a, b, f), vec3(1e-5)), vec3(2.2));
    }`,
};

const STRIP_VERT = /* glsl */`
  attribute float aInk; attribute vec4 aWob;
  uniform vec3 uInk[10]; uniform vec3 uDeep[10]; uniform float uPivot, uStretch; uniform vec3 uBump;
  varying vec3 vInk; varying vec3 vDeep; varying float vNy; varying vec3 vWp;
  ${STYLE_GLSL.vertex}
  void main() {
    int i = int(clamp(aInk, 0.0, 9.0) + 0.5);
    vInk = uInk[i]; vDeep = uDeep[i];
    vec3 p = stripWarp(position, aWob, uPivot, uStretch);
    float bd = (p.z + uZOff - uBump.x) / max(uBump.z, 1.0); p.y += uBump.y * exp(-bd * bd) * aWob.y;   // a lift that keeps level with something (the crowd's raised arms)
    #ifdef USE_INSTANCING
      vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0); vec3 n = mat3(modelMatrix) * mat3(instanceMatrix) * normal;
    #else
      vec4 wp = modelMatrix * vec4(p, 1.0); vec3 n = mat3(modelMatrix) * normal;
    #endif
    vNy = n.y / max(length(n), 1e-4);
    vWp = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const STRIP_FRAG = /* glsl */`
  varying vec3 vInk; varying vec3 vDeep; varying float vNy; varying vec3 vWp;
  ${STYLE_GLSL.fragment}
  void main() {
    float ny = gl_FrontFacing ? vNy : -vNy, fw = fwidth(vNy) * 0.75;   // a sheet seen from below shows its deeper shade
    gl_FragColor = vec4(stripFar(stripInk(vInk, vDeep, ny, fw), distance(vWp, cameraPosition)), 1.0);   // per fragment: ribbons have long triangles
  }`;
const shareU = (style, names, own) => { const u = { ...own }; for (const n of names) u[n] = style.uniforms[n]; return u; };
const VERT_U = ['uTime', 'uFlow', 'uWobble', 'uGust', 'uInk', 'uDeep', 'uPale', 'uFar'];

// Material 1 (strip) and 3 (crosser): o.pivot / o.stretch give the z stretch (kept as uniforms .uPivot/.uStretch);
// o.zOffset = world z of the mesh origin (0 for geometry built in world coordinates), so wobbles and gusts line up.
export function stripMaterial(style, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: shareU(style, VERT_U, { uPivot: { value: o.pivot ?? 0 }, uStretch: { value: o.stretch ?? 1 }, uZOff: { value: o.zOffset ?? 0 }, uBump: { value: new THREE.Vector3(0, 0, 30) } }),
    vertexShader: STRIP_VERT, fragmentShader: STRIP_FRAG, side: o.side ?? THREE.DoubleSide,
  });
}

// Material 5 (hairlines): geometry from hairGeo(). Holds at least 1.5 px; scratches never wobble.
export function hairMaterial(style, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: shareU(style, ['uInk', 'uPale', 'uFar', 'uViewH'], { uPivot: { value: o.pivot ?? 0 }, uStretch: { value: o.stretch ?? 1 }, uMinPx: { value: o.minPx ?? 1.5 }, uFade: { value: o.fade ?? 0 } }),
    vertexShader: /* glsl */`
      attribute vec3 aTan; attribute vec3 aHair;   // aHair: side (-1/+1), width in metres, ink index
      uniform vec3 uInk[10]; uniform float uViewH, uPivot, uStretch, uMinPx, uFade;
      varying vec3 vInk; varying float vDist;
      void main() {
        float gi = floor(aHair.z / 16.0 + 1e-3), ii = aHair.z - gi * 16.0;   // ink + 16 * ground ink
        vec3 p = position; p.z = uPivot + (p.z - uPivot) * uStretch;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vec3 t = mat3(modelMatrix) * aTan, v = wp.xyz - cameraPosition;
        vec3 sd = cross(t, v); sd /= max(length(sd), 1e-5);
        vec4 c0 = projectionMatrix * viewMatrix * wp;
        float pxPerM = projectionMatrix[1][1] * uViewH * 0.5 / max(c0.w, 0.05);     // widened in world space, so a line
        float real = aHair.y * pxPerM, px = max(uMinPx, real);                      // passing beside the camera stays a line
        vInk = mix(uInk[int(clamp(gi, 0.0, 9.0) + 0.5)], uInk[int(clamp(ii, 0.0, 9.0) + 0.5)], clamp(real / max(px, 1e-3), 0.0, 1.0) * smoothstep(uFade * 0.5, uFade + 1e-4, real));   // o.fade (px): lines thinner than this are left out altogether (white lines on a soot bird far off)
        wp.xyz += sd * (aHair.x * 0.5 * px / max(pxPerM, 1e-4));
        vDist = length(v);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vInk; varying float vDist;
      ${STYLE_GLSL.fragment}
      void main() { gl_FragColor = vec4(stripFar(vInk, vDist), 1.0); }`,
    side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
  });
}

// Geometry builder: patches of shared vertices (smooth inside a patch, hard edges between patches).
export class StripGeo {
  constructor() { this.pos = []; this.ink = []; this.wob = []; this.idx = []; }
  // fn(i, j, out) writes [x,y,z]; ink: number or (i,j)=>number; wob: [ax,ay,wavelength,phase] or (i,j,out)=>[..]
  grid(nu, nv, fn, ink = 0, wob = null, flip = false) {
    const base = this.pos.length / 3, o = [0, 0, 0], w0 = [0, 0, 100, 0];
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      fn(i, j, o); this.pos.push(o[0], o[1], o[2]);
      this.ink.push(typeof ink === 'function' ? ink(i, j) : ink);
      const w = wob ? (typeof wob === 'function' ? wob(i, j, o) : wob) : w0; this.wob.push(w[0], w[1], w[2], w[3]);
    }
    for (let j = 0; j < nv - 1; j++) for (let i = 0; i < nu - 1; i++) {
      const a = base + j * nu + i, b = a + 1, c = a + nu, d = c + 1;
      if (flip) this.idx.push(a, c, b, b, c, d); else this.idx.push(a, b, c, b, d, c);
    }
    return this;
  }
  get triangles() { return this.idx.length / 3; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('aInk', new THREE.Float32BufferAttribute(this.ink, 1));
    g.setAttribute('aWob', new THREE.Float32BufferAttribute(this.wob, 4));
    g.setIndex(this.pos.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeVertexNormals(); g.computeBoundingSphere();
    return g;
  }
  // the same geometry in small steps with a yield between them, for the large meshes (no step of a build may hold the
  // page long): the arrays are copied, and the normals worked out, a slice at a time
  async buildY(ctx) {
    const nV = this.pos.length / 3, pos = await sliceCopy(ctx, this.pos, Float32Array), ink = await sliceCopy(ctx, this.ink, Float32Array), wob = await sliceCopy(ctx, this.wob, Float32Array);
    const idx = await sliceCopy(ctx, this.idx, nV > 65535 ? Uint32Array : Uint16Array), nor = new Float32Array(nV * 3);
    for (let t = 0; t < idx.length; t += 3) {      // area-weighted face normals summed at the corners, as computeVertexNormals does
      const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
      const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      nor[a] += nx; nor[a + 1] += ny; nor[a + 2] += nz; nor[b] += nx; nor[b + 1] += ny; nor[b + 2] += nz; nor[c] += nx; nor[c + 1] += ny; nor[c + 2] += nz;
      if (t % 6000 === 5997) await ctx.yield();
    }
    await ctx.yield();
    let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
    for (let k = 0; k < nV * 3; k += 3) {
      const l = Math.hypot(nor[k], nor[k + 1], nor[k + 2]) || 1; nor[k] /= l; nor[k + 1] /= l; nor[k + 2] /= l;
      const x = pos[k], y = pos[k + 1], z = pos[k + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z;
      if (k % 18000 === 17997) await ctx.yield();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('aInk', new THREE.BufferAttribute(ink, 1)); g.setAttribute('aWob', new THREE.BufferAttribute(wob, 4)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.boundingSphere = nV ? new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2) : new THREE.Sphere();
    await ctx.yield();
    return g;
  }
}
// a plain array copied into a typed one a slice at a time, yielding between slices
async function sliceCopy(ctx, src, Type) { const out = new Type(src.length), CH = 8000; for (let i = 0; i < src.length; i += CH) { const e = Math.min(src.length, i + CH); for (let k = i; k < e; k++) out[k] = src[k]; await ctx.yield(); } return out; }

// Rule two: a still thing is a ribbon of constant section. profile: [{ pts: [[x,y],...], ink, wob }] (one patch per
// band, so bands meet in hard edges); zs: ring positions; o.taper: metres over which each end closes to o.about [x,y];
// o.scale(z) -> number, o.shift(z) -> [dx,dy]; o.zWorld adds the shared film swell; o.taper0 / o.taper1 override
// the taper of the near / far end (0 = that end is left open: the ribbon issues from its own thing there). List each band's points
// left to right (+x) over the top, right to left underneath, so normals point outward (o.flip reverses).
export function sweep(b, profile, zs, o = {}) {
  const z0 = zs[0], z1 = zs[zs.length - 1], tp = o.taper ?? 20, ab = o.about || [0, 0];
  for (const band of profile) {
    b.grid(band.pts.length, zs.length, (i, j, out) => {
      const z = zs[j], e = Math.min(o.taper0 === 0 ? 1 : sstep(0, 1, (z - z0) / Math.max(o.taper0 ?? tp, 1e-3)), o.taper1 === 0 ? 1 : sstep(0, 1, (z1 - z) / Math.max(o.taper1 ?? tp, 1e-3)));
      const s = Math.sqrt(e) * (o.scale ? o.scale(z) : 1) * (o.zWorld != null ? filmSwell(z + o.zWorld) : 1);
      const sh = o.shift ? o.shift(z) : null, p = band.pts[i];
      out[0] = ab[0] + (p[0] - ab[0]) * s + (sh ? sh[0] : 0); out[1] = ab[1] + (p[1] - ab[1]) * s + (sh ? sh[1] : 0); out[2] = z;
    }, band.ink ?? 0, band.wob || null, !o.flip);
  }
  return b;
}

// Hairlines: lines = [{ pts: [[x,y,z],...], width (m, default 0.05), ink (default soot), ground (ink it lies on:
// a line thinner than 1.5 px keeps 1.5 px and fades into its ground, so its average tint is right; default white) }]
export function hairGeo(lines) { return hairFill(hairArrays(), lines, 0, lines.length).geo(); }
// the same for a long list, yielding as it goes: await hairGeoY(lines, ctx)
export async function hairGeoY(lines, ctx) {
  const A = hairArrays();
  for (let i = 0; i < lines.length; i += 15) { hairFill(A, lines, i, Math.min(lines.length, i + 15)); await ctx.yield(); }
  const nV = A.pos.length / 3, g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(await sliceCopy(ctx, A.pos, Float32Array), 3));
  g.setAttribute('aTan', new THREE.BufferAttribute(await sliceCopy(ctx, A.tan, Float32Array), 3));
  g.setAttribute('aHair', new THREE.BufferAttribute(await sliceCopy(ctx, A.hair, Float32Array), 3));
  g.setIndex(new THREE.BufferAttribute(await sliceCopy(ctx, A.idx, nV > 65535 ? Uint32Array : Uint16Array), 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 4000);      // never culled (frustumCulled is off on every hairline mesh)
  await ctx.yield();
  return g;
}
const hairArrays = () => { const A = { pos: [], tan: [], hair: [], idx: [] }; A.geo = () => hairFinish(A); return A; };
function hairFill(A, lines, i0, i1) {
  const { pos, tan, hair, idx } = A;
  for (let li = i0; li < i1; li++) { const L = lines[li];
    const P = L.pts, n = P.length, base = pos.length / 3, w = L.width ?? 0.05, ink = (L.ink ?? INK.soot) + 16 * (L.ground ?? INK.white);
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], c = P[Math.min(n - 1, i + 1)];
      let tx = c[0] - a[0], ty = c[1] - a[1], tz = c[2] - a[2]; const l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
      for (const s of [-1, 1]) { pos.push(P[i][0], P[i][1], P[i][2]); tan.push(tx, ty, tz); hair.push(s, w, ink); }
      if (i < n - 1) { const k = base + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
  }
  return A;
}
function hairFinish(A) {
  const { pos, tan, hair, idx } = A;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aTan', new THREE.Float32BufferAttribute(tan, 3));
  g.setAttribute('aHair', new THREE.Float32BufferAttribute(hair, 3));
  g.setIndex(pos.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  return g;
}

// ------------------------------------------------------------------------------------------------ the swan
const BW = 13, BH = 13, Z0 = -190, Z1 = 250, NECK_X = -40;

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('long-swan') : ctx.rng;
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const zWorld = opts.zWorld ?? 540;
  const style = opts.style || makeStyle(opts.palette);
  const black = opts.black ?? rng.chance(0.2);
  const BODY = black ? INK.soot : INK.white, TINT_A = black ? INK.sootDeep : INK.skyTint, TINT_B = black ? INK.white : INK.riverTint;
  const LINE = black ? INK.white : INK.soot;
  // per-seed character of the bird: how it dawdled
  const ph = [rng.range(0, TAU), rng.range(0, TAU), rng.range(0, TAU), rng.range(0, TAU)];
  const humpAmp = rng.range(0.04, 0.085), humpLen = rng.range(170, 250), meander = rng.range(0.5, 1.1);
  const shrugZ = rng.range(-60, 90), shrugAmp = rng.range(0.05, 0.1);   // one place where it sat up for a moment
  const root = new THREE.Group(); root.name = 'the-long-swan';

  // --- the body surface S(t, z): t -1 port waterline, 0 ridge, +1 starboard waterline
  const hz = (z) => {
    const tr = Math.pow(sstep(-205, -95, z), 0.85), br = z > 200 ? Math.sqrt(Math.max(0, 1 - ((z - 200) / 50) ** 2)) : 1;
    const und = 1 + humpAmp * Math.sin((z + zWorld) * TAU / humpLen + ph[0]) + shrugAmp * Math.exp(-(((z - shrugZ) / 22) ** 2));
    return (0.1 + 0.9 * tr) * Math.pow(br, 0.8) * und;
  };
  const wz = (z) => {
    const br = z > 200 ? Math.sqrt(Math.max(0, 1 - ((z - 200) / 50) ** 2)) : 1;
    return (0.22 + 0.78 * sstep(-215, -115, z)) * Math.pow(br, 0.62) * filmSwell(z + zWorld);
  };
  const cx = (z) => meander * Math.sin((z + zWorld) * TAU / 260 + ph[1]) * sstep(-190, -60, z) * (1 - sstep(120, 220, z));
  const sec = (t, out) => {            // base section, metres
    const a = t * Math.PI / 2, sx = Math.sin(a), cy = Math.cos(a);
    let x = BW * Math.sign(sx) * Math.pow(Math.abs(sx), 0.72), y = BH * Math.pow(Math.abs(cy), 0.62);
    if (y < 4.5) x *= 1 - 0.17 * ((4.5 - y) / 4.5) ** 2;
    y += 0.95 * Math.exp(-(((Math.abs(x) - 6.2) / 2.6) ** 2)) - 0.55 * Math.exp(-((x / 1.8) ** 2));
    out[0] = x; out[1] = y; return out;
  };
  const S = (t, z, out) => { sec(t, out); out[0] = out[0] * wz(z) + cx(z); out[1] *= hz(z); out[2] = z; return out; };
  const _a = [0, 0, 0], _b = [0, 0, 0];
  const Nrm = (t, z, out) => {         // outward unit normal in the section plane
    S(t - 0.004, z, _a); S(t + 0.004, z, _b);
    const dx = _b[0] - _a[0], dy = _b[1] - _a[1], l = Math.hypot(dx, dy) || 1; out[0] = -dy / l; out[1] = dx / l; return out;
  };
  // arclength table of the base section, so board depths are in metres
  const NT = 400, sT = new Float32Array(NT + 1); { let px = 0, py = 0; for (let i = 0; i <= NT; i++) { sec(-1 + 2 * i / NT, _a); if (i) sT[i] = sT[i - 1] + Math.hypot(_a[0] - px, _a[1] - py); px = _a[0]; py = _a[1]; } }
  const girth = sT[NT];
  const tOfS = (s) => { let lo = 0, hi = NT; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (sT[m] < s) lo = m; else hi = m; } const f = (s - sT[lo]) / Math.max(1e-6, sT[hi] - sT[lo]); return -1 + 2 * (lo + sat(f)) / NT; };

  // --- 1. body loft (hidden under the boards for most of its length, so it is coarse)
  const body = new StripGeo();
  const zs = []; for (let z = Z0; z < 200; z += 5) zs.push(z); for (let k = 0; k <= 14; k++) zs.push(200 + 50 * Math.sin(k / 14 * Math.PI / 2));
  const NS = 49;
  await ctx.yield();
  for (const zz of [zs.slice(0, 31), zs.slice(30, 61), zs.slice(60)]) {     // in three lengths, so that no step is long
    body.grid(NS + 2, zz.length, (i, j, o) => {
      const z = zz[j];
      if (i === 0 || i === NS + 1) { S(i === 0 ? -1 : 1, z, o); o[1] = -1.5; } else S(-1 + 2 * (i - 1) / (NS - 1), z, o);
    }, BODY, null, true);
    await ctx.yield();
  }

  // --- 2. tail: eight feather tips rising from the river as long wedges, each with a roof section and a rachis
  const tailTips = [], tailHairs = [];
  for (let k = 0; k < 8; k++) {
    const f = (k + 0.5) / 8 * 2 - 1, mid = 1 - Math.abs(f);
    const zTip = -236 + (1 - mid) * rng.range(6, 26) + rng.range(0, 8), zRoot = -146 + mid * 16;
    const xr = f * 7.4, xt = f * (13.5 + rng.range(-1, 1.5)), w = rng.range(3.0, 3.8) * (0.8 + 0.2 * mid), rise = 7 + mid * 6.5 + rng.range(-0.6, 0.6);
    const wob = [0, rng.range(0.05, 0.1), rng.range(50, 80), rng.range(0, TAU)];
    tailTips.push([xt, 0, zTip]);
    const NJ = 14, prof = [[-1, 0], [-0.5, 0.3], [0, 0.5], [0.5, 0.3], [1, 0]];
    // px across (-1..1), py roof height, wall 0 = on the roof, 1 = foot of the wall under the water
    const tp = (px, py, wall, j, o) => {
      const u = j / (NJ - 1), ww = w * (0.03 + 0.97 * Math.sin(Math.min(1, u * 1.5) * Math.PI / 2));
      const top = -0.4 + rise * (0.62 * u + 0.38 * u * u) + py * (0.4 + 0.5 * ww) - f * px * ww * 0.28;
      o[0] = lerp(xt, xr, Math.pow(u, 0.8)) + px * ww * (1 - 0.35 * wall); o[2] = lerp(zTip, zRoot, u); o[1] = lerp(top, -0.8, wall);
    };
    body.grid(5, NJ, (i, j, o) => tp(prof[i][0], prof[i][1], 0, j, o), k % 2 ? TINT_A : BODY, wob, true);
    body.grid(2, NJ, (i, j, o) => tp(-1, 0, 1 - i, j, o), k % 3 === 1 ? TINT_B : TINT_A, wob, true);     // port wall
    body.grid(2, NJ, (i, j, o) => tp(1, 0, i, j, o), TINT_A, wob, true);                                   // starboard wall
    for (const e of [-1, 1]) { const pts = []; for (let j = 1; j < NJ; j++) { const o = [0, 0, 0]; tp(e, 0, 0, j, o); o[1] += 0.05; pts.push(o); } tailHairs.push({ pts, width: 0.07, ink: LINE, ground: k % 2 ? TINT_A : BODY }); }
    body.grid(3, NJ, (i, j, o) => tp((i - 1) * 0.11, 0.5 + (i === 1 ? 0.1 : 0.0), 0, j, o), black ? INK.white : INK.soot, wob, true);
    for (let m = 0; m < 7; m++) for (const e of [-1, 1]) { const jb = 2.6 + m * 1.5, pts = [[0.09, 0.5, 0], [0.5, 0.3, 0.3], [1, 0, 0.7]].map((q) => { const o = [0, 0, 0]; tp(e * q[0], q[1], 0, jb - q[2], o); o[1] += 0.06; return o; }); tailHairs.push({ pts, width: 0.13, ink: LINE, ground: k % 2 ? TINT_A : BODY }); }
    if (k % 3 === 2) await ctx.yield();
  }
  await ctx.yield();

  // --- 3. feather boards: clapboard drawn out along z, each ending (toward the tail) in a hooked tick
  const boards = new StripGeo(), hairs = [], halfG = girth / 2, nA = [0, 0], pA = [0, 0, 0];
  let nBoards = 0;
  const board = (side, s0, s1, zTip, zRoot, face, lip, hair, amp, lam, phs, bold = 0, short = false) => {
    const L = zRoot - zTip, e = s1 - s0, lift = (0.15 + 0.2 * Math.min(1.4, e)) * (black ? 1.3 : 1) * (bold ? 1.8 : 1);
    const HKL = Math.min(12, 0.5 * L), ds = [0, 0.5, 1.2, 2.2, 3.4, 4.8, 6.4, 8.2, 10, 12].map((d) => d * HKL / 12);      // the hooked end takes at most half of a short board
    for (let d = HKL + 3; d < L - 2.5; d += (zTip + d > 196 ? 2.5 : 3.5)) ds.push(d);
    if (L - 2.2 > ds[ds.length - 1] + 0.3) ds.push(L - 2.2);
    ds.push(L);
    const n = ds.length, R = new Float64Array(n * 13), sg = side ? -1 : 1, hp = [], hm = [];
    for (let j = 0; j < n; j++) {
      const d = ds[j], z = zTip + d, hk = 1 - sstep(0, HKL, d), nar = sstep(0, HKL * 0.54, d), rootF = Math.max(0.12, sstep(0, 2.4, L - d));
      const lb = (lift + (0.85 + 0.7 * lift) * hk * hk) * rootF, sB = Math.min(halfG - 0.02, s1 + (0.55 + 1.0 * e) * hk * hk), sTp = lerp(sB, s0, nar), lt = 0.03 + lb * (1 - nar);
      const tB = sg * tOfS(sB), tT = sg * tOfS(sTp), k = j * 13;
      S(tT, z, pA); Nrm(tT, z, nA); R[k] = pA[0] + nA[0] * lt; R[k + 1] = pA[1] + nA[1] * lt; R[k + 2] = z;
      S(tB, z, pA); Nrm(tB, z, nA); R[k + 3] = pA[0] + nA[0] * lb; R[k + 4] = pA[1] + nA[1] * lb; R[k + 5] = z;
      R[k + 6] = pA[0] - nA[0] * 0.03; R[k + 7] = pA[1] - nA[1] * 0.03; R[k + 8] = z;
      const a = Math.min(amp, lift * 0.42) * (1 + 1.6 * hk) * rootF; R[k + 9] = nA[0] * a; R[k + 10] = nA[1] * a; R[k + 11] = 1 - nar;
      if (hair || j < 9) hp.push([R[k + 3] + nA[0] * 0.02, R[k + 4] + nA[1] * 0.02 - 0.02, z]);
      if (!side && e > 0.55 && (black ? j > 4 : bold ? j > 1 : short ? (nBoards % 2 === 0 && j > 1 && j < 10) : (e > 1.0 && j > 2 && j < 13))) hm.push([(R[k] + R[k + 3]) / 2 + nA[0] * 0.03, (R[k + 1] + R[k + 4]) / 2 + nA[1] * 0.03, z]);   // a shaft line: down each broad board of the black bird, down the tip of each deep one of the white
    }
    const w = [0, 0, lam, phs];
    const pt = (o, k, q) => { o[0] = R[k + q]; o[1] = R[k + q + 1]; o[2] = R[k + q + 2]; };
    const wb = (k, f) => { w[0] = R[k + 9] * f; w[1] = R[k + 10] * f; return w; };
    // port: i = 0 bottom edge, 1 top edge; starboard the other way round, so that normals point outward
    boards.grid(2, n, (i, j, o) => pt(o, j * 13, (i === 0) !== !!side ? 3 : 0), face, (i, j) => ((i === 0) !== !!side ? wb(j * 13, 1) : wb(j * 13, R[j * 13 + 11])), true);
    boards.grid(2, n, (i, j, o) => pt(o, j * 13, (i === 0) !== !!side ? 6 : 3), lip, (i, j) => ((i === 0) !== !!side ? wb(j * 13, 0) : wb(j * 13, 1)), true);
    hairs.push({ pts: hp, width: bold ? 0.17 : black ? 0.11 : hair ? (short ? 0.1 : 0.08) : 0.05, ink: LINE, ground: face });
    if (hm.length > 2 && (black ? face !== INK.white : true)) hairs.push({ pts: hm, width: 0.06, ink: LINE, ground: face });
    nBoards++;
  };
  const anchorsWebs = [];
  // Rows from the ridge down: the back (narrow rows, white), the folded wing (the deep boards, 1.2 to 1.6 m, in white,
  // sky tint and river tint row by row so that they can be counted, a hairline under each), the wing's lower edge (one
  // bold overlapping line of long boards), and under it the flank, which curves under to the waterline and is in the tint.
  const S_WING = 0.37 * halfG, S_EDGE = 0.735 * halfG;
  // (the draws of the first lay-out are still taken, in their old order, so that everything seeded after the boards,
  // the neck's crown and so the lane, the feet, the wake, stays where it was for every seed)
  for (const side of [0, 1]) {
    let s = 0.5, row = 0, edgeDone = false, nb = 0;
    while (s < halfG - 0.25) {
      const zone = s < S_WING ? 0 : s < S_EDGE ? 1 : 2, wing = zone === 1 ? 1 : 0;
      const isEdge = zone === 2 && !edgeDone; if (isEdge) edgeDone = true;
      let e = (zone === 0 ? lerp(0.55, 0.95, rng()) : zone === 1 ? lerp(1.2, 1.6, rng()) : isEdge ? 0.8 : lerp(0.7, 1.05, rng())) * (side ? 1.8 : 1) / detail;
      if (zone === 1 && s + e > S_EDGE - 0.4) e = Math.max(0.7, S_EDGE - s);
      e = Math.min(e, halfG - s);
      let z = Z0 + 6 + rng.range(0, 34) + (1 - s / halfG) * 10;
      while (z < 246) {
        const L = Math.min((isEdge ? rng.range(60, 100) : wing ? rng.range(38, 78) : rng.range(30, 60)) * (side ? 1.6 : 1), 249 - z); rng();
        if (L > 6) { rng.range(0.04, 0.11); rng.range(18, 60); rng.range(0, TAU); nb++; }
        z += L - rng.range(1, 3);
      }
      s += e; row++;
    }
  }
  // FIX ROUND 3: on the lane side the boards of the wing, its edge and the lower flank are short (14 to 50 m) and their
  // ends are staggered row against row, so that at the closest pass several hooked ends with their deeper under-lips
  // stand inside the frame at arm's length; rows are shallower (the brief's 0.2 to 1.5 m) and go white, sky tint and
  // river tint by turns from the wing down to the waterline, a hairline under each. The far side keeps long boards.
  const brng = makeRngLocal(Math.floor(ph[3] * 1e6) + (black ? 7 : 0));
  for (const side of [0, 1]) {
    let s = 0.5, row = 0, edgeDone = false;
    while (s < halfG - 0.25) {
      const zone = s < S_WING ? 0 : s < S_EDGE ? 1 : 2, wing = zone === 1 ? 1 : 0;
      const isEdge = zone === 2 && !edgeDone; if (isEdge) edgeDone = true;
      let e = (zone === 0 ? (side ? lerp(0.55, 0.95, brng()) : lerp(0.5, 0.9, brng())) : zone === 1 ? (side ? lerp(1.2, 1.6, brng()) : lerp(0.62, 1.0, brng())) : isEdge ? 0.8 : (side ? lerp(0.7, 1.05, brng()) : lerp(0.45, 0.72, brng()))) * (side ? 1.8 : 1) / detail;
      if (zone === 1 && s + e > S_EDGE - 0.4) e = Math.max(0.7, S_EDGE - s);
      e = Math.min(e, halfG - s);
      const lastWing = zone === 1 && s + e > S_EDGE - 0.05;      // the row above the wing's white edge is never white itself
      const rowInk = lastWing ? TINT_A : zone === 0 ? (black || side ? (row % 4 === 2 ? TINT_A : BODY) : [BODY, TINT_A, BODY, TINT_B][row % 4]) : zone === 1 ? (black ? [BODY, TINT_A, BODY, TINT_B][row % 4] : [BODY, TINT_B, TINT_A][row % 3]) : isEdge ? BODY : black ? [TINT_A, BODY, TINT_A][row % 3] : [TINT_B, TINT_A, BODY][row % 3];
      const short = !side;      // (s runs up from the waterline: the rows at arm's length are the first ones)
      let z = Z0 + 6 + brng() * 34 + (1 - s / halfG) * 10 + (short ? (row % 3) * 7 : 0);
      while (z < 246) {
        const near = 1 - sstep(95, 150, Math.abs(z + 10)), L0 = short ? lerp(1, 0.45, near) * (isEdge ? lerp(22, 40, brng()) : wing ? lerp(16, 34, brng()) : zone === 0 ? lerp(15, 30, brng()) : lerp(14, 28, brng())) : (isEdge ? lerp(60, 100, brng()) : wing ? lerp(38, 78, brng()) : lerp(30, 60, brng())) * (side ? 1.6 : 1);
        const L = Math.min(L0, 249 - z), r = brng();
        const face = isEdge ? (black ? INK.white : BODY) : r < (short ? 0.62 : 0.8) ? rowInk : zone === 2 ? (r < 0.9 ? BODY : TINT_B) : (r < 0.9 ? TINT_A : BODY);
        const hair = !side && (black || zone > 0 || (nBoards % 2) === 0);
        const amp = lerp(0.04, 0.11, brng()), lam = lerp(18, 60, brng()), phs = brng() * TAU;
        if (L > 6) board(side, s, s + e, z, z + L, face, black ? (isEdge || nBoards % 3 === 0 ? INK.white : INK.sootDeep) : (face === TINT_A ? TINT_B : TINT_A), hair, amp, lam, phs, isEdge ? 1 : 0, short);
        z += L - lerp(1, 3, brng());
        if (nBoards & 1) await ctx.yield();
      }
      s += e; row++;
    }
  }
  await ctx.yield();

  // --- 4. neck and head. The bird turned its head across the river to dabble, so the strip holds the neck and head in
  // profile in the plane of the line (x-y): an S of neck springing from the breast, leaning over the lane and coming down
  // to port, a head with its eye, lores and knob, and a red bill dipping in the river. What is drawn out along z (time) is
  // the bird's own thickness, cheek to cheek: 60 m of neck, 42 m of head, both closing to knife edges. Seen from the
  // lane behind it is a swan; passed under, a vault with its striations and a long head lying on the water.
  const neck = new StripGeo();
  const crownY = rng.range(39, 41.5), crownX = rng.range(-23.5, -20.5);
  // the head is modelled whole: skull centre HC (x, y) at z HZC, 28 m from nape to bill tip, turned back toward the lane (HPHI from +x toward
  // the line) so that its right cheek, with the eye, faces whoever comes up the lane; HD / HN: the bill's axis and its upper normal in the profile
  const HC = [-45.5, 17.6], HD = [0.74, -0.673], HN = [0.673, 0.74], HR = 8.3, HL = 39, HK = HR / 6.8, HZC = 226, HPHI = 0.62, HCS = Math.cos(HPHI), HSN = Math.sin(HPHI);
  const arch = new THREE.CatmullRomCurve3([[3, 5], [10.5, 16.5], [12, 28], [5, 39.5], [-8, crownY + 4], [crownX, crownY], [-33.5, 33.5], [-41.5, 28], [HC[0] - 3.1, HC[1] + 4.7]].map((p) => new THREE.Vector3(p[0], p[1], 0)), false, 'centripetal');
  const NV = 50, NW = 22, aP = [], aN = [];
  for (let j = 0; j < NV; j++) { const v = j / (NV - 1), p = arch.getPoint(v), t = arch.getTangent(v); aP.push(p); aN.push([t.y, -t.x]); }
  const nkH = (v) => 6.4 - 2.1 * sstep(0, 0.55, v) - 0.4 * sstep(0.6, 1, v);   // half thickness: a thick root, a slim throat
  const nkZ = (v, w) => lerp(lerp(188, 211, v * v * v), lerp(248, 246, v * v * v), w);
  const nkF = (w) => Math.pow(Math.max(0, Math.sin(Math.PI * w)), 0.42);
  const neckPt = (v, w, sgn, o) => {
    const jf = v * (NV - 1), j0 = Math.min(NV - 2, Math.floor(jf)), f = jf - j0, hh = nkH(v) * nkF(w) * sgn;
    o[0] = lerp(aP[j0].x, aP[j0 + 1].x, f) + lerp(aN[j0][0], aN[j0 + 1][0], f) * hh;
    o[1] = lerp(aP[j0].y, aP[j0 + 1].y, f) + lerp(aN[j0][1], aN[j0 + 1][1], f) * hh; o[2] = nkZ(v, w); return o;
  };
  const wOf = (i) => { const w = i / (NW - 1); return 0.5 - 0.5 * Math.cos(Math.PI * w); };   // dense near the knife edges
  // striations: each is one row of neck feathers drawn out along z, a band of its own ink with a hard edge (and under
  // the vault a hairline on every second edge), so the underside is never one flat area
  const nLine = (v, w0, w1, sgn, width, ink, ground) => { const pts = []; for (let m = 0; m <= 22; m++) { const o = [0, 0, 0]; neckPt(v, lerp(w0, w1, m / 22), sgn, o); pts.push(o); } hairs.push({ pts, width, ink, ground }); };
  for (const sgn of [1, -1]) {
    let j0 = 0, k = 0;
    while (j0 < NV - 1) {
      // seen from the lane the whole arch shows its inner face, so that is the bird's own ink in long bands with narrow
      // tinted rows between (the deeper shade comes by itself where it turns downward, overhead)
      const j1 = Math.min(NV - 1, j0 + (sgn > 0 ? 3 + ((k * 5) % 4) : (k % 2 ? 1 : 3 + ((k * 3) % 2)))), r = rng();
      const ink = sgn > 0 ? BODY : (k % 8 === 3 ? TINT_A : k % 8 === 7 ? TINT_B : BODY);
      neck.grid(NW, j1 - j0 + 1, (i, j, o) => neckPt((j0 + j) / (NV - 1), wOf(i), sgn, o), ink, null, sgn > 0);
      if (j1 < NV - 1 && (sgn > 0 ? k % 3 === 0 : (black || k % 2 === 0))) { const a = 0.03 + 0.25 * r, b = 0.97 - 0.25 * rng();
        nLine(j1 / (NV - 1), a, b, sgn * 1.012, sgn > 0 ? 0.1 + 0.16 * r : 0.12 + 0.2 * r, LINE, ink); }
      j0 = j1; k++;
    }
    await ctx.yield();
  }
  for (const w of [0.002, 0.998]) { const pts = []; for (let m = 0; m <= 60; m++) { const o = [0, 0, 0]; neckPt(0.04 + 0.94 * m / 60, w, 0, o); pts.push(o); } hairs.push({ pts, width: 0.12, ink: LINE, ground: BODY }); }

  // head: s 0 nape .. 1 bill tip along the bill's axis, t -1 chin .. +1 crown across it; the near cheek faces -z (us),
  // the far one the line. Inks lie in patches with hard edges: the eye and the lores widening from it to the bill's
  // base, the knob, the red bill, its nail. (The black bird: white eye-streak and nail, a white bar across the bill.)
  const SK = 0.27, hSk = (s) => HR * Math.sqrt(Math.max(0, 1 - ((s - SK) / SK) ** 2));
  const hBl = (s) => HK * lerp(3.9, 2.3, sstep(0.5, 0.95, s)) * Math.sqrt(Math.max(0, 1 - sstep(0.9, 1, s) ** 2)) * sstep(0.25, 0.45, s);
  const hUp = (s) => Math.max(hSk(s), hBl(s)) + (black ? 0 : 2.5 * HK * Math.exp(-(((s - 0.53) / 0.042) ** 2)));
  const hLo = (s) => Math.max(hSk(s), hBl(s));
  const hD = (s) => HK * lerp(4.1, 1.7, sstep(0.36, 0.66, s));       // half thickness, cheek to cheek
  const headPt = (s, t, fc, o) => {
    const a = (s - SK) * HL, w = t >= 0 ? hUp(s) : hLo(s);
    const px = a * HD[0] + t * w * HN[0], q = fc * hD(s) * Math.pow(Math.max(0, 1 - t * t), 0.45);
    o[0] = HC[0] + px * HCS - q * HSN; o[1] = HC[1] + a * HD[1] + t * w * HN[1]; o[2] = HZC + px * HSN + q * HCS; return o;
  };
  const dipW = (s) => [0, 1.3 * sstep(0.3, 1, s) ** 1.5, 95, 0.6];     // the bill dabbles: a slow travelling dip
  const EY = 0.34, hMark = (s) => {          // the mark band [a, b] in t: the eye, then the lores opening toward the bill
    // the eye, and from it at once the lores: a broad wedge opening to the whole base of the bill (a mask, not a keyhole)
    const e = 0.2 * Math.sqrt(Math.max(0, 1 - ((s - 0.315) / 0.045) ** 2)); let a = EY - e, b = EY + e;
    if (black) { if (s > 0.33) { const q = (s - 0.33) / 0.17; a = Math.min(a, lerp(EY - 0.07, 0.14, Math.pow(q, 1.5))); b = Math.max(b, lerp(EY + 0.07, 0.6, Math.pow(q, 1.4))); } }     // the black bird: a white eye-streak
    else if (s > 0.325) { const q = (s - 0.325) / 0.175; a = Math.min(a, lerp(EY - 0.17, -0.12, Math.pow(q, 0.9))); b = Math.max(b, lerp(EY + 0.17, 0.92, Math.pow(q, 0.75))); }
    return [a, b];
  };
  const seq = (a, b, n) => { const r = []; for (let i = 0; i <= n; i++) r.push(lerp(a, b, i / n)); return r; };
  const MASK = black ? INK.white : INK.soot, BILL0 = black ? INK.red : INK.soot;
  const hPatch = (ss, t0, t1, nt, ink) => { for (const fc of [-1, 1]) neck.grid(nt, ss.length, (i, j, o) => { const s = ss[j]; headPt(s, lerp(t0(s), t1(s), i / (nt - 1)), fc, o); }, ink, (i, j) => dipW(ss[j]), fc > 0); };
  const cM = (s) => -1, cP = (s) => 1;
  hPatch([0, 0.006, 0.02, 0.045, 0.08, 0.12, 0.17, 0.22, 0.268], cM, cP, 13, BODY);
  await ctx.yield();
  { const ss = seq(0.268, 0.5, 18);
    hPatch(ss, cM, (s) => hMark(s)[0], 6, BODY); hPatch(ss, (s) => hMark(s)[0], (s) => hMark(s)[1], 5, MASK); hPatch(ss, (s) => hMark(s)[1], cP, 5, BODY); }
  hPatch(seq(0.5, 0.56, 4), cM, (s) => lerp(0.12, 0.42, (s - 0.5) / 0.06), 6, INK.red); hPatch(seq(0.5, 0.56, 4), (s) => lerp(0.12, 0.42, (s - 0.5) / 0.06), cP, 8, BILL0);
  if (black) { hPatch(seq(0.56, 0.8, 5), cM, cP, 13, INK.red); hPatch(seq(0.8, 0.86, 2), cM, cP, 13, INK.white); hPatch(seq(0.86, 0.945, 2), cM, cP, 13, INK.red); }
  else hPatch(seq(0.56, 0.945, 8), cM, cP, 13, INK.red);
  hPatch([0.945, 0.965, 0.982, 0.993, 0.999, 1], cM, cP, 13, MASK);
  // the head's outline and the bill's gape as hairlines on the near cheek (they hold a pixel and a half far off)
  for (const t of [-1, 1]) hairs.push({ pts: seq(0.01, 0.995, 40).map((s) => headPt(s, t, 0, [0, 0, 0])), width: 0.12, ink: LINE, ground: BODY });
  hairs.push({ pts: seq(0.57, 0.94, 12).map((s) => { const o = headPt(s, -0.25, -1, [0, 0, 0]); o[0] += 0.15 * HSN; o[2] -= 0.15 * HCS; return o; }), width: 0.16, ink: INK.soot, ground: INK.red });
  await ctx.yield();

  // --- 5. the one paddling foot, recorded sixteen times along the port waterline (instanced fans)
  const rise = { uPivot: { value: 219 }, uStretch: { value: 1 } };
  // One webbed foot, a soot silhouette: three toes fanning from the ankle with the web between them (its edge
  // scalloped from toe tip to toe tip), a pale line down each toe, and above the ankle a leg with its joint going
  // up into the feathers. It faces astern, as a paddling foot does, so whoever comes up the lane sees it whole. aFan: angle (-1..1 across the fan), radius, kind (0 web, 1 leg, 2 the black bird's light edge, 3 toe line).
  // One webbed foot, held up out of the water as a swan holds it: three toes fanning upward from the ankle (deeper soot,
  // a white hairline down each, a claw past the web), the soot web between them with its edge scalloped from toe tip to
  // toe tip, a knobbed ankle on a short leg going down under the flank, and two white wake ticks where the leg meets the
  // water. It faces the lane and a little astern, so whoever comes up the lane sees it whole.
  // aFan: angle (-1..1 across the fan), radius, kind (0 web, 1 leg, 2 the black bird's light edge, 3 toe line, 4 toe, 5 wake).
  // FIX ROUND 3: the foot hangs from its ankle. A short shank comes out of the flank above the waterline, the ankle is
  // the top of the fan, three white toes spread DOWN from it to the water with the soot web between them (its lower edge
  // scalloped from toe tip to toe tip), and where the toes meet the river two white ripple arcs lie on the water.
  // The fan lies against the flank, turned a little toward the lane, so it is part of the bird and reads as a webbed foot.
  const fan = { pos: [], fan: [], idx: [] }, ANK = 4.75, WYAW = -0.5;
  { const NA = 37, RR = [0, 0.42, 0.78, 1], FR = 4.3, TA = 0.9, TL = [0.93, 1, 0.93];
    const rEdge = (a) => { const q = Math.min(1, Math.abs(a) / TA); return FR * lerp(1, TL[0], q) * (1 - 0.2 * Math.pow(Math.sin(Math.PI * q), 0.7)); };
    const strip = (rows, kind) => { const b0 = fan.pos.length / 3; for (const [a0, a1, r] of rows) { fan.pos.push(0, 0, 0, 0, 0, 0); fan.fan.push(a0, r, kind, a1, r, kind); }
      for (let j = 0; j < rows.length - 1; j++) { const k = b0 + j * 2; fan.idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } };
    for (let j = 0; j < 4; j++) for (let i = 0; i < NA; i++) { const a = -TA + 2 * TA * i / (NA - 1); fan.pos.push(0, 0, 0); fan.fan.push(a, RR[j] * rEdge(a), 0); }
    for (let j = 0; j < 3; j++) for (let i = 0; i < NA - 1; i++) { const k = j * NA + i; fan.idx.push(k, k + 1, k + NA, k + 1, k + NA + 1, k + NA); }
    { const e0 = fan.pos.length / 3;      // the edge fan (the black bird's light edge)
      for (let j = 0; j < 2; j++) for (let i = 0; i < NA; i++) { const a = -TA + 2 * TA * i / (NA - 1); fan.pos.push(0, 0, 0); fan.fan.push(a * 1.07, j ? rEdge(a) + 0.3 : 0, 2); }
      for (let i = 0; i < NA - 1; i++) { const k = e0 + i; fan.idx.push(k, k + 1, k + NA, k + 1, k + NA + 1, k + NA); } }
    for (let t = 0; t < 3; t++) { const ta = (t - 1) * TA, Lt = FR * TL[t] + 0.3;      // the toes: white bones, a claw past the web
      const RT = [0.25, 0.7, 1.5, 2.5, 3.3, Lt - 0.5, Lt], TW = [0.2, 0.25, 0.23, 0.2, 0.17, 0.13, 0];
      strip(RT.map((r, j) => { const da = TW[j] / (1.1 * Math.max(r, 0.5)); return [ta - da, ta + da, r]; }), 4); }
    const quadStrip = (P, kind) => { const b0 = fan.pos.length / 3; for (const q of P) { fan.pos.push(q[0], q[1], q[2], q[3], q[4], q[5]); fan.fan.push(0, 0, kind, 0, 0, kind); }
      for (let j = 0; j < P.length - 1; j++) { const k = b0 + j * 2; fan.idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } };
    const cw = Math.cos(WYAW), sw = Math.sin(WYAW), loc = (hx, hz) => [hx * cw - hz * sw, hx * sw + hz * cw];     // bird axes (x inboard, z ahead) to the foot's own
    // the shank: a knobbed ankle and a short leg going up and inboard into the feathers
    quadStrip([[-0.3, 0.34], [0, 0.5], [0.35, 0.4], [0.8, 0.33], [1.3, 0.3], [1.9, 0.28], [2.5, 0.28]].map(([d, w], j) => { const q = loc(Math.max(0, d) * 0.9, 0), y = d < 0 ? -0.3 : d * 0.62; return [q[0], y, q[1] - w, q[0], y, q[1] + w]; }), 1);
    for (const [R, w0] of [[2.1, 0.17], [3.5, 0.13]]) {      // two ripple arcs on the water, open toward the flank, drawn out along the course
      quadStrip(Array.from({ length: 15 }, (_, i) => { const ph = -1.35 + 2.7 * i / 14, w = w0 * Math.pow(Math.max(0, Math.cos(ph / 1.35 * Math.PI / 2)), 0.6) + 0.01;
        const a = loc(-(R - w) * 0.7 * Math.cos(ph) + 0.4, (R - w) * 1.5 * Math.sin(ph)), b2 = loc(-(R + w) * 0.7 * Math.cos(ph) + 0.4, (R + w) * 1.5 * Math.sin(ph));
        return [a[0], -ANK + 0.07, a[1], b2[0], -ANK + 0.07, b2[1]]; }), 5); } }
  const fanG = new THREE.BufferGeometry();
  fanG.setAttribute('position', new THREE.Float32BufferAttribute(fan.pos, 3)); fanG.setAttribute('aFan', new THREE.Float32BufferAttribute(fan.fan, 3)); fanG.setIndex(fan.idx);
  const WEB_Z = { 13: 177, 14: 233, 15: -195 };     // 28 m apart, but none stands where the gaze has gone to the head (it would be cut by the frame), and one paddles under the tail
  // THE STROKE IS A LAW OF THE ROW. The one foot is recorded sixteen times and each record is the same stroke one step
  // later: a web's phase is its number in the order dealt (k) times 0.29 of a cycle, with a scatter of 0.03 either way.
  // Webs 0 to 14 stand in that order from the tail toward the breast, so the fanning runs down the row that way. The
  // sixteenth (web 15) paddles under the tail, 13 m astern of web 0, and keeps its fifteen steps all the same: 4.35
  // cycles, which is 0.35 of a cycle after web 0 and not one step before it. A web opens, folds and swings by the
  // world's time (uTime) and its own phase and by nothing else: not the eye's place, not the camera, not the metres
  // flown or the share of the flight. So a web is half open or more for half of every cycle, wherever the eye is.
  // PERIOD 2.5 s (uTime * 0.4 in the shader). The brief gives the stroke no time; at 2.5 s a web opens in 0.35 s, stays
  // half open or more for 1.25 s and folds in 0.35 s: slow enough to be seen opening like a fan and folding, not flickering.
  // LENGTH 1 / 0.29 = 3.45 webs, which is 96.6 m where the webs stand the brief's 28 m apart: a crest passes 1.38 webs a
  // second and runs from web 0 to web 14 in 14 * 0.29 * 2.5 = 10.15 s, and four waves stand between those two.
  // The reason for the step: a web is half open or more for half its cycle (c from 0.07 to 0.57 in the shader), so with
  // neighbours 0.29 +- 0.06 apart two neighbours' turns overlap (the fanning RUNS down the row, it does not alternate),
  // and three in a row span 0.58 +- 0.06 of a cycle, never under a half: of any three webs dealt one after the other
  // (for webs 0 to 14, any three that stand side by side) at least one is half open or more at every moment, whatever
  // the scatter deals. A step of 0.28 to 0.44 keeps that; 0.29 is the least step in hundredths (the longest wave) that
  // keeps it with something to spare (0.02 of a cycle at the worst).
  const NWEB = 16, webAttr = new Float32Array(NWEB * 2), webs = new THREE.InstancedMesh(fanG, new THREE.ShaderMaterial({
    uniforms: shareU(style, ['uTime', 'uInk', 'uPale', 'uFar'], { ...rise, uToeInk: { value: style.ink[INK.white] }, uEdge: { value: black ? 1 : 0 } }), side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aFan; attribute vec2 aWeb;   // aWeb: phase along the row, size
      uniform float uTime, uPivot, uStretch, uEdge; uniform vec3 uInk[9]; uniform vec3 uToeInk;
      varying float vDist; varying vec3 vInk;
      void main() {
        vec3 ip = instanceMatrix[3].xyz; float k = aFan.z;
        float posK = (k > 0.5 && k < 1.5) || k > 4.5 ? 1.0 : 0.0, edge = (k > 1.5 && k < 2.5) ? 1.0 : 0.0, line = (k > 2.5 && k < 3.5) ? 1.0 : 0.0, toe = (k > 3.5 && k < 4.5) ? 1.0 : 0.0;
        float c = fract(uTime * 0.4 - aWeb.x);
        float open = smoothstep(0.0, 0.14, c) * (1.0 - smoothstep(0.5, 0.64, c));
        float swing = -0.42 + 0.9 * smoothstep(0.0, 0.56, c) - 0.9 * smoothstep(0.62, 1.0, c);
        float th = aFan.x * mix(0.09, 0.66, open) + swing * 0.45 - 0.1;
        vec3 f = vec3(0.07 * edge - 0.05 * toe - 0.1 * line + 0.05 * aFan.y * (1.0 - aFan.x * aFan.x) * open, -cos(th) * aFan.y, -sin(th) * aFan.y);
        vec3 p = mix(f, position, posK) * aWeb.y;
        vec4 lp = instanceMatrix * vec4(p, 1.0); lp.z += (uStretch - 1.0) * (ip.z - uPivot);
        vec4 wp = modelMatrix * lp; vDist = distance(wp.xyz, cameraPosition); vInk = (k < 0.5 || (posK > 0.5 && k < 4.5)) ? uInk[6] : (k > 4.5 || line > 0.5 ? uInk[0] : (edge > 0.5 ? mix(uInk[6], uInk[0], uEdge) : uToeInk));
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`varying float vDist; varying vec3 vInk; ${STYLE_GLSL.fragment}
      void main() { gl_FragColor = vec4(stripFar(vInk, vDist), 1.0); }`,
  }), NWEB);
  { const m = new THREE.Matrix4(), e = new THREE.Euler(), qn = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1);
    for (let k = 0; k < NWEB; k++) {
      const z = (WEB_Z[k] ?? -182 + k * 28) + rng.range(-1, 1), size = rng.range(0.94, 1.08) * Math.min(1, 0.55 + 0.45 * hz(z) / 0.9);
      v.set(-(BW * wz(z) + 1.0) + cx(z), ANK * size, z); e.set(0, WYAW + 0 * rng.range(-0.05, 0.05), 0); qn.setFromEuler(e);
      webs.setMatrixAt(k, m.compose(v, qn, sc)); webAttr[k * 2] = k * 0.29 + rng.range(-0.03, 0.03); webAttr[k * 2 + 1] = size;
      anchorsWebs.push(v.clone());
    } }
  fanG.setAttribute('aWeb', new THREE.InstancedBufferAttribute(webAttr, 2)); webs.frustumCulled = false;

  // --- 5b. FIX ROUND 11 (V): the feet read as feet. Nothing above is changed; two things are added to each foot.
  // (i) Its toes are told as ribs ON the web: a margin of web outside each outer toe, so that the three white toes lie
  // within the soot and no longer outline it. The margin is a second instanced mesh that uses the webs' own material,
  // their own instance matrices and their own aWeb attribute, so it opens, folds and swings by the very same shader lines
  // as its web, on the stroke's own time and nothing else (nothing of the stroke is repeated here). On the black bird
  // the web keeps its light edge.
  const ribG = new THREE.BufferGeometry();
  { const rp = [], rf = [], ri = [], TA = 0.9, TOE = 4.3 * 0.93, NR = 6;
    for (const e of black ? [] : [-1, 1]) { const b0 = rp.length / 3;
      for (let j = 0; j < NR; j++) { const q = j / (NR - 1); rp.push(0, 0, 0, 0, 0, 0); rf.push(e * TA, TOE * q, 0, e * (TA + 0.2 * Math.sin(Math.PI * Math.min(1, q * 1.15)) + 0.02), TOE * q * 0.97, 0); }
      for (let j = 0; j < NR - 1; j++) { const k = b0 + j * 2; ri.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
    if (!rp.length) { rp.push(0, 0, 0, 0, 0, 0, 0, 0, 0); rf.push(0, 0, 0, 0, 0, 0, 0, 0, 0); ri.push(0, 1, 2); }
    ribG.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); ribG.setAttribute('aFan', new THREE.Float32BufferAttribute(rf, 3)); ribG.setIndex(ri); }
  ribG.setAttribute('aWeb', fanG.getAttribute('aWeb'));
  const webRibs = new THREE.InstancedMesh(ribG, webs.material, NWEB); webRibs.instanceMatrix = webs.instanceMatrix; webRibs.frustumCulled = false;
  // (ii) A leg: a soot shank rising from the web's heel (the ankle the fan hangs from and turns about, which the stroke
  // leaves where it is) up along the flank and a little forward, into the feathers, and a cuff of body feathers where it
  // goes in: a flared skirt with a scalloped rim and a hairline round it. Each is fitted to the flank at its own foot.
  const legs = new StripGeo();
  { const o3 = [0, 0, 0], NL = 7, NC = 21;
    const flankX = (y, z) => { let lo = -1, hi = -0.05; for (let n = 0; n < 24; n++) { const m = (lo + hi) / 2; if (S(m, z, o3)[1] < y) lo = m; else hi = m; } return S((lo + hi) / 2, z, o3)[0]; };
    const frame = (d) => { const l = Math.hypot(d[1], d[2]) || 1, u = [0, d[2] / l, -d[1] / l]; return [u, [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]]]; };
    for (let k = 0; k < NWEB; k++) { const P = anchorsWebs[k], s = webAttr[k * 2 + 1];
      const zT = P.z + 1.3 * s, yT = Math.min(P.y + 3.0 * s, 0.8 * S(-0.05, zT, o3)[1]), T = [flankX(yT, zT), yT, zT];
      const M = [lerp(P.x, T[0], 0.4) - 0.1 * s, lerp(P.y, T[1], 0.45), lerp(P.z, T[2], 0.62)], P0 = [P.x, P.y - 0.25 * s, P.z - 0.1 * s];
      const dT = [T[0] - M[0], T[1] - M[1], T[2] - M[2]], lT = Math.hypot(dT[0], dT[1], dT[2]) || 1; for (let c = 0; c < 3; c++) dT[c] /= lT;
      const [u, v] = frame(dT), C = [P0, [P.x, P.y, P.z], M, T, [T[0] + dT[0] * 0.9 * s, T[1] + dT[1] * 0.9 * s, T[2] + dT[2] * 0.9 * s]], RL = [0.16, 0.34, 0.24, 0.3, 0.3];
      legs.grid(NL, C.length, (i, j, o) => { const a = i / (NL - 1) * TAU, r = RL[j] * s; for (let c = 0; c < 3; c++) o[c] = C[j][c] + r * (Math.cos(a) * u[c] + Math.sin(a) * v[c]); }, INK.soot);
      // the cuff: three lapped tiers of body feathers round the shank where it goes into the flank, each tier's rim a
      // hairline, the last closing over the leg inside the feathers (t: along the upper shank, 0 at its knee, 1 at its top)
      const at = (t, r, a) => [0, 1, 2].map((c) => lerp(M[c], T[c], t) + r * s * (Math.cos(a) * u[c] + Math.sin(a) * v[c]));
      const TIER = [[0.36, 0.36, 0.8, 0.55], [0.66, 0.6, 1.15, 0.75], [1.0, 0.8, 1.5, 0.85]];
      for (const [t0, r0, t1, r1] of TIER) {
        legs.grid(NC, 2, (i, j, o) => { const q = at(j ? t1 : t0, j ? r1 : r0, i / (NC - 1) * TAU); o[0] = q[0]; o[1] = q[1]; o[2] = q[2]; }, BODY);
        hairs.push({ pts: Array.from({ length: NC }, (_, i) => at(t0, r0 + 0.02, i / (NC - 1) * TAU)), width: 0.09, ink: LINE, ground: BODY });
      }
      legs.grid(NC, 2, (i, j, o) => { const q = at(j ? 1.9 : 1.5, j ? 0 : 0.85, i / (NC - 1) * TAU); o[0] = q[0]; o[1] = q[1]; o[2] = q[2]; }, BODY);
      if (black) for (const sgn of [-1, 1]) hairs.push({ pts: C.slice(0, 4).map((c, j) => [c[0] + RL[j] * s * sgn * v[0], c[1] + RL[j] * s * sgn * v[1], c[2] + RL[j] * s * sgn * v[2]]), width: 0.08, ink: LINE, ground: BODY });
    } }

  // --- 6. wake: a herringbone of white chevrons 60 m long sliding back along both flanks
  const chev = { pos: [], idx: [] };
  for (const sg of [-1, 1]) { const b0 = chev.pos.length / 3, NC = 9;
    for (let j = 0; j < NC; j++) { const q = j / (NC - 1), w = 0.24 * Math.pow(Math.sin(Math.PI * (0.04 + 0.92 * q)), 0.7), x = sg * (0.12 + 1.9 * Math.pow(q, 0.8));
      chev.pos.push(x - w, 0, 30 - 60 * q, x + w, 0, 30 - 60 * q); if (j < NC - 1) { const k = b0 + j * 2; chev.idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } } }
  const chevG = new THREE.BufferGeometry(); chevG.setAttribute('position', new THREE.Float32BufferAttribute(chev.pos, 3)); chevG.setIndex(chev.idx);
  const NCH = Math.round(80 * detail), chAttr = new Float32Array(NCH * 4);
  for (let k = 0; k < NCH; k++) { const sd = k & 1 ? 1 : -1, rowi = (k >> 1) & 1;
    chAttr[k * 4] = sd * (BW + 3.2 + rowi * 5.4 + rng.range(-0.5, 0.5)); chAttr[k * 4 + 1] = (k >> 2) / (NCH / 4) * 500 + rowi * 12.5 + rng.range(-3, 3);
    chAttr[k * 4 + 2] = rng.range(0.8, 1.15); chAttr[k * 4 + 3] = rng.range(0, TAU); }
  chevG.setAttribute('aChev', new THREE.InstancedBufferAttribute(chAttr, 4));
  const chevs = new THREE.InstancedMesh(chevG, new THREE.ShaderMaterial({
    uniforms: shareU(style, ['uTime', 'uInk', 'uPale', 'uFar', 'uFlow'], { ...rise }), side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 aChev;   // x of the row, z phase (m), size, wobble phase
      uniform float uTime, uFlow, uPivot, uStretch; uniform vec3 uInk[9];
      varying float vDist; varying vec3 vInk;
      void main() {
        float zc = -245.0 + mod(aChev.y - uTime * uFlow * 0.5, 500.0);
        float life = smoothstep(-245.0, -215.0, zc) * (1.0 - smoothstep(225.0, 255.0, zc));
        vec3 p = position; p.x *= aChev.z * (0.35 + 0.65 * life); p.z *= life;
        p.x += aChev.x + 0.16 * sin(0.21 * (zc + p.z) + aChev.w + uTime * 1.3);
        p.z = uPivot + (zc + p.z - uPivot) * uStretch; p.y = 0.07;
        vec4 wp = modelMatrix * vec4(p, 1.0); vDist = distance(wp.xyz, cameraPosition); vInk = uInk[0];
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`varying float vDist; varying vec3 vInk; ${STYLE_GLSL.fragment}
      void main() { gl_FragColor = vec4(stripFar(vInk, vDist), 1.0); }`,
  }), NCH);
  chevs.frustumCulled = false;
  await ctx.yield();

  // --- 6b. wings for the rare event "the swan gets up": two bands along the back whose beat is a travelling sine.
  // They are scaled from nothing by setRise() (never visible = false) and share the strip material.
  // MEND 13d, THE LIFTED BEAT: the wings are a body, and a body is kept off the lane by its place. The beat keeps its
  // whole depth (amplitude wamp(q) = 12 q^1.3 m, the strip program's wave and gust as they are); the REST shape stands
  // higher instead, a tall V: every vertex is raised by lift * wamp(q), the amplitude's own law, so the root (q 0, no
  // beat) stays on the back, the sheet stays one smooth sheet, and nothing moves in x or z. The lowest a vertex can come
  // is its rest height less wamp(q) * WING_REACH, where WING_REACH = 1.35 (the most the program's wave sum can be:
  // sin + 0.35 sin) * 1.75 (the deepest wobble any weather sets: the breeze) + 3 * 0 (the gusts: the program adds
  // 3 * gust * amplitude and no gust is ever sent with a height under 0, so a gust only LIFTS a wing; its share of the
  // DOWNWARD reach is nothing). lift is the least number for which no vertex, at that lowest, is under WING_FLOOR
  // = 10.6 m above the river + 0.25 m to spare: it is worked out here from the wing's own stations (the narrow fore and
  // aft ends, where the tip rests lowest, decide it). The mesh stands at WING_Y, above the floor, and setRise() only
  // scales it between nothing and 1 about that height, so the floor holds at every stage of the rise as well.
  // FOLDED (every plain run, and a rare run before the rise) the wings stand at 1e-9 of their span, where they stood at
  // 1e-4: a fold of 1e-4 is a sliver some millimetres across that drew a few stray pixels over the back, and the lifted
  // rest shape made that sliver taller. At 1e-9 the fold has no area in the picture's own arithmetic.
  const wingMeshes = [], WING_Y = 14.8, WING_REACH = 1.35 * 1.75 + 3 * 0, WING_FLOOR = 10.6 + 0.25;
  for (const sg of [1, -1]) {
    const wg = new StripGeo(), SPAN = 46, NQ = 7, wz0 = -170, wz1 = 205, NR = 76, wph = ph[2];
    const wpt = (q, j, dy, o) => { const z = lerp(wz0, wz1, j / (NR - 1)), e = Math.pow(Math.max(0, Math.sin(Math.PI * (j + 0.5) / NR)), 0.5), r = q * SPAN * e;
      o[0] = -sg * r; o[1] = r * 0.36 + 2.6 * Math.sin(Math.PI * q) * e + dy; o[2] = z; };
    const wamp = (q) => 12 * Math.pow(q, 1.3), wo = [0, 0, 0];
    let lift = 0; for (let k = 1; k <= NQ; k++) for (let j = 0; j < NR; j++) { wpt(k / NQ, j, 0, wo); lift = Math.max(lift, WING_REACH - (WING_Y + wo[1] - WING_FLOOR) / wamp(k / NQ)); }
    for (let k = 0; k < NQ; k++) {
      const q0 = k / NQ, q1 = (k + 1) / NQ, ink = black ? (k >= 3 ? INK.white : INK.soot) : (k % 2 ? TINT_A : BODY);
      const wb = (i) => [0, wamp(i ? q1 : q0), 30, wph];
      wg.grid(2, NR, (i, j, o) => wpt(i ? q1 : q0, j, lift * wamp(i ? q1 : q0), o), ink, (i) => wb(i), sg > 0);
    }
    const wm = new THREE.Mesh(wg.build(), null); wm.position.set(-sg * 4.5, WING_Y, 0); wm.scale.set(1e-9, 1e-9, 1); wm.frustumCulled = false; wingMeshes.push(wm);
    await ctx.yield();
  }

  // --- 7. scratches: waterline and ridge hairlines (these never move), then the meshes
  for (const h of tailHairs) hairs.push(h);
  for (const t of [-1, 1]) { const pts = []; for (let z = -150; z <= 247; z += 4) { const o = [0, 0, 0]; S(t, z, o); o[0] += t * 0.06; o[1] = 0.08; pts.push(o); } hairs.push({ pts, width: 0.1, ink: LINE, ground: INK.teal }); }
  const stripMat = stripMaterial(style, { zOffset: zWorld }); stripMat.uniforms.uPivot = rise.uPivot; stripMat.uniforms.uStretch = rise.uStretch;
  const hairMat = hairMaterial(style, { fade: black ? 0.5 : 0 }); hairMat.uniforms.uPivot = rise.uPivot; hairMat.uniforms.uStretch = rise.uStretch;
  const mk = (geo, mat, name) => { const m = new THREE.Mesh(geo, mat); m.name = name; m.frustumCulled = false; root.add(m); return m; };
  const tris = { body: body.triangles, boards: boards.triangles, neck: neck.triangles };
  mk(await body.buildY(ctx), stripMat, 'swan-body'); await ctx.yield();
  mk(await boards.buildY(ctx), stripMat, 'swan-boards'); await ctx.yield();
  mk(await neck.buildY(ctx), stripMat, 'swan-neck'); await ctx.yield();
  await ctx.yield();
  const hairMesh = mk(await hairGeoY(hairs, ctx), hairMat, 'swan-hairlines');
  await ctx.yield();
  const _sz = new THREE.Vector2();
  hairMesh.onBeforeRender = (renderer) => { style.uniforms.uViewH.value = renderer.getDrawingBufferSize(_sz).y; };
  for (const wm of wingMeshes) { wm.material = stripMat; wm.name = 'swan-wing'; root.add(wm); }
  webs.name = 'swan-webs'; chevs.name = 'swan-wake'; root.add(webs, chevs);
  webRibs.name = 'swan-web-ribs'; root.add(webRibs); mk(await legs.buildY(ctx), stripMat, 'swan-legs');
  await ctx.yield();

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const laneX = crownX;
  const anchors = {
    portalSeat: { position: V(laneX, 8, 390), facing: V(0, 0, -1), radius: 7 },
    flyThrough: [V(-26, 6.5, -275), V(-25, 6.5, -180), V(-25, 6.5, -100), V(-21.5, 6.5, 10), V(-21.5, 6.5, 150), V(laneX, 8, 219), V(laneX, 8, 300), V(laneX, 8, 390)],
    underNeck: V(laneX, 8, 219), neckCrown: V(crownX, crownY, 219), stretchPivot: V(0, 0, 219),
    bill: V(...headPt(1, 0, 0, [0, 0, 0])).setY(0.3), eye: V(...headPt(0.31, EY, -1, [0, 0, 0])), head: V(...headPt(0.4, 0, -1, [0, 0, 0])), flankX: -BW, webs: anchorsWebs, tailTips: tailTips.map((p) => V(p[0], p[1], p[2])),
    viewpoints: { tail: V(-25, 6.5, -262), flank: V(-21.5, 6.5, 0), web: V(-21.5, 6.5, anchorsWebs[7].z - 12), vault: V(laneX, 8, 170) },
  };
  let driven = false, riseOn = !!opts.rise, lastT = 0; const us = [0.075, 0.45, 0.65];
  const api = {
    // radius / height / center are VIEWING hints (the set-piece viewer orbits `center` at about 2.4 radius, which
    // frames the neck end from the lane side); the true size is in `extent`: the bird is 512 m long.
    object: root, radius: 70, height: 40, center: V(-40, 9, 120), anchors, style, ground: false, groundY: 0,
    extent: { min: V(-60, 0, -262), max: V(15, crownY + 11, 262) }, length: 512,
    info: { black, boards: nBoards, triangles: tris },
    // k 0..1: the swan gets up; because length is slowness the whole ridge draws in toward its neck (to 40 m)
    setRise(k) { rise.uStretch.value = lerp(1, 0.085, sstep(0, 1, k)); const w = Math.max(1e-9, sstep(0.35, 1, k)); for (const wm of wingMeshes) wm.scale.set(w, w, 1); },
    // path u from the world: gusts at the brief's 3, 18 and 26 s; optional draw-in u 0.6..0.78
    setProgress(u) {
      driven = true;
      for (let i = 0; i < 3; i++) { const q = (u - us[i]) / 0.07; style.setGust(i, zWorld + lerp(440, -440, q), q > 0 && q < 1 ? Math.sin(Math.PI * q) : 0, 28); }
      if (riseOn) api.setRise(sat((u - 0.6) / 0.18));
    },
    update(dt, time, camera) {
      lastT = time; style.tick(time);
      if (!driven && opts.autoGust !== false) { const c = (time % 8) / 8; style.setGust(0, zWorld + lerp(330, -330, Math.min(1, c * 1.6)), c < 0.625 ? Math.sin(Math.PI * c * 1.6) : 0, 28); }
    },
    dispose() {},
  };
  return api;
}
