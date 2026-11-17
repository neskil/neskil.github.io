// BROUGHT IN: the hash sh12 follows "Hash without Sine", Copyright (c)2014 David Hoskins, MIT License (shadertoy.com, view 4djSRW), the same form as the kit's fx.js.
// doors-in-transit: THE SHED (the joiner's part). A great iron-and-glass hall and everything fixed in it: brick side walls
// with piers, stone bands and blind arches (one arch of each long wall is a gated doorway: the floor's through track
// comes in by one and leaves by the other); three-hinged riveted iron arch ribs every 20 m, purlins, a roof all of glass;
// in each brick end wall a great half-round glazed screen with radiating bars (the sun's blaze stands behind the -z one);
// a twelve-sided lantern over the tower; a wood-block floor in a herringbone with a sheen; and the quiet bay.
// Everything stands where the plan module puts it. Four materials serve it all (brick and stone, iron, glass, floor);
// brick, iron and floor are lit by the scene's own lights. Nothing reads the lens but a sheen and a filter by footprint.
// THE CLOSER VERSION adds: in the floor's own material paving courses square across the hall and the soft shadows of
// the door trains, both by place; on the far deck more of the works' gear (the deck's piece); and in the -z end wall,
// behind the bay, THE MOUTH TO THE FAR STORE (the mouth's piece): the wall open between the plan's FAR.x0 and FAR.x1
// up to FAR.top under an iron lattice girder, a stone sill in the floor, the hall's light dying on that sill.
//
// A vertex of the shed carries aP = (u, v, kind, w): pattern coordinates in metres, the kind of surface inside its
// material, and one free number (a tint, a depth).
import { SHED, TOWER, BAY, TURNTABLE, STRAIGHT, TIERS, DOOR, FAR, tierRadius, tierRail } from './doors-in-transit-plan.js';
import { SHED_SUN_GLSL, shedSunUniform, shedBarsUniform, FAN } from './doors-in-transit-shed-sun.js';     // FAN: the end screens' half-round
import { buildBay, BAY_RIB_STEP, rod } from './doors-in-transit-shed-bay.js';
import { furnishYard, TRACKS, ARCADE } from './doors-in-transit-shed-yard.js';
import { furnishDeck } from './doors-in-transit-shed-deck.js';
import { buildMouth, MOUTH } from './doors-in-transit-shed-mouth.js';

// a number written into shader text (the plan's and the pieces' own constants, never typed twice)
const G = (v) => Number(v).toFixed(4);
export { SHED_SUN_GLSL, shedSunUniform, shedBarsUniform };      // the low sun's bars of light and shade, for every material in the hall

const HALF = (SHED.x1 - SHED.x0) / 2, RISE = SHED.crown - SHED.spring;
const RIB_Z = []; for (let z = SHED.z0 + 10; z < SHED.z1; z += SHED.ribStep) RIB_Z.push(z);     // -140 .. 140

// the roof's line across the hall: full at the haunches, a little pointed at the crown
export function roofY(x) {
  const s = Math.min(1, Math.abs(x) / HALF), e = 2.6;
  return SHED.spring + RISE * (0.85 * Math.pow(Math.max(0, 1 - Math.pow(s, e)), 1 / e) + 0.15 * (1 - s));
}
// the same line as n equal steps of arc from the +x springing over the crown to the -x springing:
// [{ x, y, nx, ny (toward the hall), s (metres from the +x springing) }]
function roofLine(n) {
  const fine = [], M = 600; let len = 0;
  for (let i = 0; i <= M; i++) {
    const a = i / M * Math.PI, x = HALF * Math.cos(a), y = roofY(x);
    if (i) len += Math.hypot(x - fine[i - 1].x, y - fine[i - 1].y);
    fine.push({ x, y, s: len });
  }
  const out = []; let j = 0;
  for (let i = 0; i <= n; i++) {
    const s = len * i / n;
    while (j < M - 1 && fine[j + 1].s < s) j++;
    const a = fine[j], b = fine[j + 1], t = (s - a.s) / Math.max(1e-6, b.s - a.s);
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, s });
  }
  out[0].x = HALF; out[0].y = SHED.spring; out[n].x = -HALF; out[n].y = SHED.spring;
  for (let i = 0; i <= n; i++) {
    const a = out[Math.max(0, i - 1)], b = out[Math.min(n, i + 1)], tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1;
    out[i].nx = -ty / l; out[i].ny = tx / l;               // the tangent runs toward -x: its left-hand normal looks into the hall
  }
  out.length_ = len;
  return out;
}

// ---- a mesh builder: flat quads with aP ------------------------------------------------------------------------------------
function makeMesh() {
  const P = [], N = [], A = [], I = [];
  const st = { kind: 0, w: 1 };
  const m = {
    st,
    set(o) { Object.assign(st, o); return m; },
    // a flat polygon, counter-clockwise seen from outside; uv = pattern coordinates per corner (default: by the face's lie)
    poly(pts, uv) {
      const a = pts[0], c = pts[1], d = pts[2];
      let nx = (c[1] - a[1]) * (d[2] - a[2]) - (c[2] - a[2]) * (d[1] - a[1]);
      let ny = (c[2] - a[2]) * (d[0] - a[0]) - (c[0] - a[0]) * (d[2] - a[2]);
      let nz = (c[0] - a[0]) * (d[1] - a[1]) - (c[1] - a[1]) * (d[0] - a[0]);
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const i0 = P.length / 3, ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i]; P.push(p[0], p[1], p[2]); N.push(nx, ny, nz);
        if (uv) A.push(uv[i][0], uv[i][1], st.kind, uv[i].length > 2 ? uv[i][2] : st.w);
        else if (ay > 0.7) A.push(p[0], p[2], st.kind, st.w);
        else if (ax > az) A.push(p[2], p[1], st.kind, st.w);
        else A.push(p[0], p[1], st.kind, st.w);
      }
      for (let i = 1; i < pts.length - 1; i++) I.push(i0, i0 + i, i0 + i + 1);
      return m;
    },
    quad(p0, p1, p2, p3, uv) { return m.poly([p0, p1, p2, p3], uv); },
    // a box; skip = letters of the faces left out: l (-x) r (+x) d (-y) u (+y) f (+z) k (-z)
    box(x0, x1, y0, y1, z0, z1, skip = '') {
      if (!skip.includes('f')) m.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
      if (!skip.includes('k')) m.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
      if (!skip.includes('r')) m.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]);
      if (!skip.includes('l')) m.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
      if (!skip.includes('u')) m.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]);
      if (!skip.includes('d')) m.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
      return m;
    },
    triangles() { return I.length / 3; },
    geometry(THREE) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('aP', new THREE.Float32BufferAttribute(A, 4));
      g.setIndex(P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
      g.computeBoundingBox(); g.computeBoundingSphere();
      return g;
    },
  };
  return m;
}
// ---- materials -----------------------------------------------------------------------------------------------------------
const SHED_NOISE = /* glsl */`
// sh12: hash12 of "Hash without Sine" (David Hoskins, MIT), brought in
float sh12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float svn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(sh12(i), sh12(i + vec2(1., 0.)), f.x), mix(sh12(i + vec2(0., 1.)), sh12(i + vec2(1., 1.)), f.x), f.y); }
`;
const SHED_VERT_PARS = 'attribute vec4 aP; varying vec4 vP; varying vec3 vWp;\n';
const SHED_VERT_BEGIN = '#include <begin_vertex>\n vP = aP; vWp = (modelMatrix * vec4(position, 1.)).xyz;\n';
// a lit material (the scene's lights) whose colour is drawn by a piece of GLSL from vP and vWp
function litMaterial(THREE, key, opts, pars, colour, uniforms, extra) {
  const m = new THREE.MeshStandardMaterial(opts);
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms || {});
    sh.vertexShader = sh.vertexShader.replace('#include <common>', SHED_VERT_PARS + '#include <common>').replace('#include <begin_vertex>', SHED_VERT_BEGIN);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', 'varying vec4 vP; varying vec3 vWp;\n' + SHED_NOISE + (pars || '') + '#include <common>')
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + colour)
      .replace('void main() {', 'void main() {\n vec3 shedGlow = vec3(0.);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += shedGlow;');
    if (extra) extra(sh);
  };
  m.customProgramCacheKey = () => 'doors-in-transit-shed-' + key;
  return m;
}
// brick (kind 0) and stone (kind 1): courses, every brick its own tone, mortar, soot and weather; w = a tint. The bay's
// own brick (kind 2) and its glazed tiles (kind 3 in bands, kind 4 plain) are told where they are drawn
const BRICK_GLSL = /* glsl */`
{
  vec2 uv = vP.xy; vec3 base; float px;
  if (vP.z < .5) {
    float bh = .36, bw = 1.08, row = floor(uv.y / bh), uo = uv.x / bw + .5 * mod(row, 2.), vo = uv.y / bh;
    vec2 id = vec2(floor(uo), row), f = vec2(fract(uo), fract(vo)), fw = fwidth(vec2(uo, vo)) + 1e-5;
    float h = sh12(id), h2 = sh12(id + 17.3);
    vec3 brick = mix(vec3(.34, .135, .06), vec3(.47, .235, .095), h);
    brick = mix(brick, vec3(.2, .085, .05), step(.88, h2) * .75);
    vec2 e = min(f, 1. - f), jw = vec2(.036 / bw, .036 / bh), j = 1. - smoothstep(jw, jw + fw, e);
    px = max(fw.x * 1.4, fw.y);
    base = mix(vec3(.385, .18, .08), mix(brick, vec3(.42, .37, .3), max(j.x, j.y)), 1. - smoothstep(.1, .3, px));
    float bq = uv.y / 5.76, bf = fract(bq), bwd = fwidth(bq) + 1e-5, bandw = .125;
    float band = smoothstep(0., bwd, bf) * (1. - smoothstep(bandw, bandw + bwd, bf)) * min(1., bandw / bwd);
    base = mix(base, vec3(.125, .088, .07) * (.8 + .4 * h), band * .72);
  } else if (vP.z < 1.5) {
    float bh = 1.3, bw = 2.7, row = floor(uv.y / bh), uo = uv.x / bw + .5 * mod(row, 2.), vo = uv.y / bh;
    vec2 id = vec2(floor(uo), row), f = vec2(fract(uo), fract(vo)), fw = fwidth(vec2(uo, vo)) + 1e-5;
    vec2 e = min(f, 1. - f), jw = vec2(.03 / bw, .03 / bh), j = 1. - smoothstep(jw, jw + fw, e);
    px = max(fw.x, fw.y);
    vec3 stone = vec3(.46, .42, .34) * (.86 + .26 * sh12(id));
    base = mix(vec3(.445, .405, .33), stone * (1. - .45 * max(j.x, j.y)), 1. - smoothstep(.12, .34, px));
  } else if (vP.z < 2.5) {
    // the bay's brick: an even red in Flemish bond (a stretcher, a header), bands of blue-black and cream every fourteenth course
    float bh = .36, P = 1.62, row = floor(uv.y / bh), uo = uv.x / P + .5 * mod(row, 2.), vo = uv.y / bh;
    vec2 f = vec2(fract(uo), fract(vo)), fw = fwidth(vec2(uo, vo)) + 1e-5; float hd = step(.6667, f.x), h = sh12(vec2(floor(uo) * 2. + hd, row));
    float ex = min(min(f.x, abs(f.x - .6667)), 1. - f.x), ey = min(f.y, 1. - f.y);
    float jn = max(1. - smoothstep(.011, .011 + fw.x, ex), 1. - smoothstep(.05, .05 + fw.y, ey));
    px = max(fw.x * 2., fw.y);
    float bq = uv.y / (14. * bh), bf = fract(bq), bw = fwidth(bq) * .5 + 1e-5;
    float band3 = smoothstep(5. / 14. - bw, 5. / 14. + bw, bf) - smoothstep(8. / 14. - bw, 8. / 14. + bw, bf);
    float cream = smoothstep(6. / 14. - bw, 6. / 14. + bw, bf) - smoothstep(7. / 14. - bw, 7. / 14. + bw, bf), dark = max(band3 - cream, 0.);
    vec3 far = mix(mix(vec3(.39, .168, .082), vec3(.6, .52, .37), cream), vec3(.062, .092, .135), dark);
    vec3 near = mix(mix(vec3(.405, .17, .082) * (.93 + .14 * h) * (1. - .1 * hd), vec3(.62, .54, .38) * (.93 + .14 * h), cream), vec3(.055, .085, .13) * (.85 + .3 * h), dark);
    base = mix(far, mix(near, vec3(.47, .42, .34), jn), 1. - smoothstep(.1, .3, px));
  } else {
    // glazed tiles (the bay's dado, panels and friezes): rows half a metre high. Kind 3 in bands: of every eight rows five
    // are cream, one blue-black, one a zigzag of deep green on cream, one blue-black. Kind 4 plain: every row cream
    float th = .5, row = floor(uv.y / th), bnd = vP.z > 3.5 ? 0. : mod(row, 8.), uo = uv.x / th + .5 * mod(row, 2.);
    vec2 f = vec2(fract(uo), fract(uv.y / th)), fw = fwidth(vec2(uv.x / th, uv.y / th)) + 1e-5, e = min(f, 1. - f);
    float jn = max(1. - smoothstep(.03, .03 + fw.x, e.x), 1. - smoothstep(.03, .03 + fw.y, e.y)), h = sh12(vec2(floor(uo), row));
    px = max(fw.x, fw.y);
    vec3 cream = vec3(.66, .6, .45), dark = vec3(.03, .055, .09), green = vec3(.05, .25, .2);
    float zig = step(abs(fract(uv.x / th * .5) - .5) * 2., f.y);
    vec3 t = bnd < 4.5 ? cream : bnd < 5.5 ? dark : bnd < 6.5 ? mix(cream, green, zig) : dark;
    vec3 far = bnd < 4.5 ? cream : bnd < 5.5 ? dark : bnd < 6.5 ? mix(cream, green, .5) : dark;
    base = mix(far, t * (.93 + .14 * h) * (1. - .45 * jn), 1. - smoothstep(.12, .34, px));
  }
  float soot = svn(uv * vec2(.045, .11)) * .6 + svn(uv * vec2(.37, .23) + 9.) * .4;
  float sk = vP.z > 1.5 ? .1 : .4;
  base *= (1. - .55 * sk + sk * soot) * mix(1. - .65 * sk, 1., smoothstep(0., 5., vWp.y)) * vP.w;
  // shade drawn into the stuff itself (the hall's own light is even): what faces down (a soffit, the underside of a
  // cornice or a string course) lies in shade
  vec3 nW = (vec4(vNormal, 0.) * viewMatrix).xyz; nW /= max(length(nW), 1e-4);
  base *= 1. - .5 * smoothstep(.25, .8, -nW.y);
  // the low sun on the hall's own walls: the same bars of light and shade as on the floor and the doors (never in the bay).
  // Brick in shade is a good deal darker and redder; a wall turned from the sun is darker again, most at its foot
  if (abs(vWp.x) > ${G(HALF - 8)} || abs(vWp.z) > ${G(SHED.z1 - 10)}) {
    float lit = smoothstep(.45, .95, shedSunShade(vWp, uSun)), turned = 1. - smoothstep(-.3, .25, dot(nW, uSun));
    vec3 shade = vec3(.64, .55, .49) * (1. - turned * (.14 + .2 * (1. - smoothstep(2., 30., vWp.y))));
    base *= mix(vec3(1.), mix(shade, vec3(1.12, 1.1, 1.06), lit), uPool);
  }
  diffuseColor.rgb = base;
  if (vP.w > 1.05) shedGlow = base * uSunCol * .085;            // an inside face of the bay: sunlit, a shade warmer
}
`;
// the floor: wood blocks in a herringbone (kind 0), boards (kind 1); darker along the walks
const FLOOR_GLSL = /* glsl */`
{
  vec2 p = vWp.xz; vec3 base, tile = vec3(0.); float tone, joint, px, pave = 0., tsh = 0.;
  if (vP.z < .5) {
    vec2 q = vec2(p.x + p.y, p.y - p.x) * (.7071 / .36), c = floor(q), f = fract(q), bid, l;
    float m = mod(c.x - c.y, 4.);
    if (m < .5) { bid = c; l = f; } else if (m < 1.5) { bid = c - vec2(1., 0.); l = vec2(f.x + 1., f.y); }
    else if (m < 2.5) { bid = c - vec2(0., 1.) + 100.; l = vec2(f.y + 1., f.x); } else { bid = c + 100.; l = vec2(f.y, f.x); }
    vec2 fw = fwidth(q) + 1e-5; px = max(fw.x, fw.y);
    float e = min(min(l.x, 2. - l.x), min(l.y, 1. - l.y));
    joint = 1. - smoothstep(.03, .03 + px, e);
    tone = .7 + .6 * sh12(bid) + .25 * (svn(vec2(l.x * 1.5 + bid.x * 3.1, l.y * 14. + bid.y * 7.3)) - .5);
  } else if (vP.z > 1.5) {
    // the bay's floor: one pattern from wall to wall: plain tiles on the diagonal, terracotta and cream, a small black tile at every meeting
    vec2 q = vec2(p.x + p.y, p.y - p.x) * (.7071 / .95), c = floor(q), f = fract(q), fw = fwidth(q) + 1e-5; px = max(fw.x, fw.y);
    float chk = mod(c.x + c.y, 2.), cx = min(f.x, 1. - f.x), cy = min(f.y, 1. - f.y);
    float corner = 1. - smoothstep(.17, .17 + px, max(cx, cy)), jt = 1. - smoothstep(.012, .012 + px, min(cx, cy));
    vec3 t = mix(vec3(.43, .165, .078), vec3(.63, .54, .37), chk) * (.92 + .16 * sh12(c));
    t = mix(t, vec3(.055, .055, .06), corner); t *= 1. - .35 * jt * (1. - corner);
    t = mix(vec3(.47, .31, .2), t, 1. - smoothstep(.12, .34, px));
    tile = t; joint = 0.; tone = 1.;
  } else {
    vec2 q = vec2(p.x / .9, p.y / 7.), c = floor(q), f = fract(q); vec2 fw = fwidth(q) + 1e-5; px = fw.x;
    joint = 1. - smoothstep(.03, .03 + fw.x, min(f.x, 1. - f.x));
    tone = .75 + .5 * sh12(vec2(c.x, 3.)) + .25 * (svn(vec2(p.x * 9., p.y * .8)) - .5);
  }
  float keep = 1. - smoothstep(.3, 1.1, px);
  base = vec3(.25, .165, .095) * mix(1., tone * (1. - .55 * joint), keep);
  if (vP.z > 1.5) base = tile;
  if (vP.z < .5) {
    float pw = max(fwidth(p.x), fwidth(p.y)) + 1e-5;
    // every rib bay of the paving its own tone from wall to wall (so no kerb and no joint between two pavings runs
    // along the hall); here and there a patch of newer blocks; wear and old stains
    float rb = ${G(SHED.ribStep)}, zr = p.y - ${G(RIB_Z[0])};
    base *= .88 + .24 * sh12(vec2(3.7, floor(zr / rb)) + uSeed.y);
    vec2 cid = floor(p / vec2(12., 10.)), cp = (p - cid * vec2(12., 10.)); cid += uSeed.y; float hp = sh12(cid + 41.3);
    vec2 pc = vec2(3.5 + 5. * sh12(cid + 7.1), 3. + 4. * sh12(cid + 19.9)), ph = vec2(1.4 + 2.6 * sh12(cid + 2.3), 1.2 + 2. * sh12(cid + 11.7));
    vec2 dq = abs(cp - pc) - ph; float fresh = step(.7, hp) * (1. - smoothstep(0., pw + .02, max(dq.x, dq.y)));
    base = mix(base, base * vec3(1.42, 1.3, 1.02), fresh);
    float wear = svn(p * .028) * .6 + svn(p * .11 + 5.) * .4;
    base = mix(base, vec3(.3, .25, .19) * (.8 + .4 * wear), .4 * smoothstep(.45, .8, wear));
    base *= 1. - .3 * smoothstep(.62, .85, svn(p * .045 + 31.));
    // PAVING COURSES, by place in metres: the blocks are laid in courses square across the hall from wall to wall (no
    // joint of them runs lengthwise). Midway between two ribs a band of dark paving brick, two courses breaking joint,
    // with small iron gullies 12 m apart, set off from band to band; at the quarters a narrow strip of stone. A fine
    // line is widened to a pixel by the footprint only and fades as it widens; far off the courses go into the paving.
    float cb = rb * .25, ci = floor(zr / cb + .5), zs = zr - ci * cb, zb = abs(zs), kb = mod(ci, 4.), pz = fwidth(p.y) + 1e-5;
    float isB = step(1.5, kb) * step(kb, 2.5), nearC = 1. - smoothstep(.3 * cb, cb, pz);
    float cov = lineCov(zb, mix(.13, .45, isB), pz) * nearC * (1. - step(kb, .5));
    float crs = step(0., zs), bx = abs(fract(p.x / .5 + .5 * crs) - .5) * .5, fineC = (1. - smoothstep(.1, .45, pw)) * (1. - smoothstep(.1, .6, pz));
    float bjn = max(lineCov(bx, .02, pw), max(lineCov(zb, .02, pz), lineCov(abs(zb - .45), .03, pz))) * fineC;
    vec3 brk = vec3(.15, .136, .128) * (.82 + .36 * sh12(vec2(floor(p.x / .5 + .5 * crs), ci * 2. + crs)) * fineC + .18 * (1. - fineC)) * (1. - .5 * bjn);
    vec3 strip = vec3(.34, .32, .275) * (.85 + .3 * sh12(vec2(floor(p.x / 1.7), ci))) * (1. - .4 * lineCov(abs(fract(p.x / 1.7) - .5) * 1.7, .02, pw) * fineC);
    base = mix(base, mix(strip, brk, isB), cov);
    float gx = abs(fract((p.x + 6. * mod(floor(ci * .25), 2.)) / 12. + .5) - .5) * 12.;
    float gul = lineCov(gx, .32, pw) * lineCov(zb, .32, pz) * isB * (1. - smoothstep(.2, 1.2, max(pw, pz)));
    base = mix(base, vec3(.04, .044, .05) * (1. + 1.5 * step(.5, fract(p.x / .11)) * fineC), gul);
    pave = cov * mix(.35, .7, isB);
    // rails set flush in the paving, both through the turntable, never along the flown line: a cross track square
    // across the hall toward both streets, and a through track from a gated doorway in one long wall to the doorway
    // opposite in the other (its angle follows from the two doorways); a bed of stone setts between and beside the rails
    vec2 tt = p - vec2(${G(TURNTABLE.x)}, ${G(TURNTABLE.z)}), sd = vec2(${G(Math.sin(TRACKS.slant))}, ${G(Math.cos(TRACKS.slant))}); float rt = length(tt), tw = ${G(TURNTABLE.r)};
    float sa = dot(tt, sd), sc = abs(sd.x * tt.y - sd.y * tt.x), hg = ${G(TRACKS.gauge / 2)}, hb = ${G(TRACKS.bed)};
    float onB = step(abs(tt.x), ${G(TRACKS.reach)}), onC = step(${G(-TRACKS.slantReach[1])}, sa) * step(sa, ${G(TRACKS.slantReach[0])}), tab = 1. - smoothstep(tw, tw + pw, rt);
    float bed = max(onB * (1. - smoothstep(hb, hb + pw, abs(tt.y))), onC * (1. - smoothstep(hb, hb + pw, sc)));
    vec2 sq = vec2(p.x / .8 + .5 * mod(floor(p.y / .5), 2.), p.y / .5), sf = fract(sq);
    float sjn = 1. - smoothstep(.06, .06 + pw * 2., min(min(sf.x, 1. - sf.x), min(sf.y, 1. - sf.y)));
    base = mix(base, vec3(.33, .31, .27) * (.8 + .4 * sh12(floor(sq) + 7.)) * (1. - .45 * sjn * (1. - smoothstep(.08, .3, pw))), bed);
    // a stone kerb beside each rib's line, an iron drain channel on the line itself, square across the hall; where the
    // through track meets them they run on across its bed (its rails are let into the kerb and bridge the drain)
    float zc = abs(fract(zr / rb + .5) - .5) * rb, kerb = 1. - smoothstep(1.3, 1.3 + pw, zc);
    float sj = 1. - smoothstep(.03, .03 + pw, abs(fract(p.x / 2.6 + .5) - .5) * 2.6);
    vec3 stone = vec3(.36, .34, .29) * (.82 + .3 * sh12(vec2(floor(p.x / 2.6 + .5), floor(zr / rb + .5)))) * (1. - .4 * sj * (1. - smoothstep(.05, .4, pw)));
    base = mix(base, stone, kerb);
    float drain = 1. - smoothstep(.42, .42 + pw, zc), slot = step(.5, fract(p.x / .5)) * (1. - smoothstep(.1, .45, pw));
    base = mix(base, vec3(.045, .05, .055) * (1. + 1.6 * slot), drain);
    // the turntable: a round deck of boards in an iron ring; over all, the rails: a groove and a steel head
    float bj = 1. - smoothstep(.03, .03 + pw, abs(fract(tt.y / .45 + .5) - .5) * .45);
    base = mix(base, vec3(.3, .215, .13) * (.75 + .5 * sh12(vec2(floor(tt.y / .45 + .5), 5.))) * (1. - .5 * bj * (1. - smoothstep(.08, .3, pw))), tab);
    base = mix(base, vec3(.05, .055, .06), 1. - smoothstep(.18, .18 + pw, abs(rt - tw)));
    float dr = min(mix(99., abs(abs(tt.y) - hg), max(onB, tab)), mix(99., abs(sc - hg), max(onC, tab)));
    base = mix(base, vec3(.04, .042, .046), 1. - smoothstep(.2, .2 + pw, dr));
    base = mix(base, vec3(.42, .43, .45), (1. - smoothstep(.07, .07 + pw, dr)) * (1. - smoothstep(.2, .6, pw)));
    // THE MOUTH'S SILL (the far store begins beyond it): past the end wall's face the floor is one course of long
    // stones, flush with the paving, a fine joint where the two meet
    float sill = 1. - smoothstep(-pw, 0., p.y - ${G(FAR.wallZ)}), sfine = 1. - smoothstep(.1, .5, max(pw, pz));
    float sjl = max(lineCov(abs(fract(p.x / 3.2 + .5) - .5) * 3.2, .02, pw) * sill, lineCov(abs(p.y - ${G(FAR.wallZ)}), .025, pz)) * sfine;
    base = mix(base, vec3(.36, .34, .29) * (.84 + .28 * sh12(vec2(floor(p.x / 3.2 + .5), 77.))), sill) * (1. - .4 * sjl);
    pave = max(pave, .7 * sill);
  }
  // the walk: a slightly more worn band inside the lowest street
  float oval = abs(length(vec2(p.x, max(abs(p.y) - ${G(STRAIGHT)}, 0.))) - ${G(tierRadius(0) - 7)});
  float walk = 1. - smoothstep(2.2, 3.6, oval);
  base *= vP.z > 1.5 ? 1. : mix(1., .96, walk) * (.84 + .3 * svn(p * .07));
  // the long light: sun through the great screen lies on the floor as a half-round pool crossed by the shadows of its
  // bars; further up the hall it comes through the roof, crossed by the long shadows of the ribs
  float lit = shedSunShade(vec3(p.x, 0., p.y), uSun);
  lit *= smoothstep(${G(FAR.wallZ - MOUTH.depth)}, ${G(FAR.wallZ)}, p.y);          // the hall's light dies on the mouth's sill: none of it lies beyond
  // THE DOOR TRAINS' SHADOWS, by place: every street of doors hangs as a ribbon under its oval rail, from its sills to
  // its heads, and the plan's sun lays that ribbon on the floor as a soft band: broad where the sun crosses a street,
  // narrow where it runs along one (a single door's own sharp shadow is the shadow map's). Only where the sun falls.
  if (vP.z < 1.5) {
    vec2 sw = uSun.xz / max(uSun.y, .1);
${Array.from({ length: TIERS }, (_, k) => `    tsh = max(tsh, trainBand(p, sw, ${G(tierRadius(k))}, ${G(tierRail(k) - DOOR.drop)}, ${G(tierRail(k) - DOOR.drop + DOOR.frameH)}));
`).join('')}    tsh *= smoothstep(.15, 1., lit) * uPool;
    base *= 1. - .3 * tsh;
  }
  base *= mix(1., vP.z > 1.5 ? .54 + .6 * lit : .4 + .78 * smoothstep(.15, 1., lit), uPool);
  if (vP.z > 1.5) {                              // the bay's glass roof lays a faint ladder of light on the tiles, rib by rib
    float rs = ${G(BAY_RIB_STEP)}, rung = smoothstep(.08, .42, abs(fract((p.y - ${G(BAY.zBack)}) / rs + .5) - .5) * rs);
    base *= mix(.94, 1.12, rung * smoothstep(0., 1.6, ${G(BAY.x1)} - abs(p.x)));
  }
  diffuseColor.rgb = base * vP.w;
  // the sheen: the end screen and the roof's light mirrored softly in the worn wood (a pale even light, never the sky's blue)
  vec3 V = vWp - cameraPosition; V /= max(length(V), 1e-3);
  vec3 R = vec3(V.x, abs(V.y) + 1e-3, V.z); float c1 = 1. - clamp(R.y, 0., 1.), fr = c1 * c1; fr = .03 + .97 * fr * fr * c1;
  float tr = (uEnd * ${G(SHED.z1)} - vWp.z) / (abs(R.z) < 1e-3 ? 1e-3 : R.z); vec3 glow = uSkyCol * .34;
  if (tr > 0.) {
    vec2 hp = vec2(vWp.x + R.x * tr, vWp.y + R.y * tr - ${G(FAN.cy)}), ds = hp - uSpot.xy; float blur = 4. + tr * .07;
    float m = smoothstep(-blur, blur, ${G(FAN.r)} - length(hp)) * smoothstep(-blur, blur, hp.y);
    glow = mix(glow, uSunCol * (.27 + .5 * exp(-dot(ds, ds) / (2. * uSpot.z * uSpot.z))), m);
  }
  // (brick and stone courses are matt, and a street's shade takes a little of the sheen: the far deck keeps its lines)
  shedGlow = glow * fr * uSheen * (.55 + .9 * svn(p * .9)) * (1. - pave) * (1. - .3 * tsh);
}
`;
const FLOOR_PARS = /* glsl */`
uniform vec3 uSun, uSunCol, uSkyCol, uSpot; uniform float uEnd, uPool, uSheen; uniform vec2 uSeed;
// how much of a pixel px wide, its middle d from a line's middle, a line of half width hw covers: a fine line is
// widened to a pixel by the footprint only, and fades as it widens
float lineCov(float d, float hw, float px){ return clamp((hw - d) / px + .5, 0., 1.) - clamp((-hw - d) / px + .5, 0., 1.); }
// a street of doors under one oval rail (radius R, straights to the plan's length) as a ribbon from the height h0 to
// h1: 1 where the line from the floor's place p toward the sun (sw: metres across per metre up) goes through it
float ovalD(vec2 q, float R){ vec2 c = vec2(q.x, max(abs(q.y) - ${G(STRAIGHT)}, 0.)); return sqrt(dot(c, c) + 1e-6) - R; }
float trainBand(vec2 p, vec2 sw, float R, float h0, float h1){
  float fa = ovalD(p + sw * h0, R), fb = ovalD(p + sw * h1, R), fm = ovalD(p + sw * (.5 * (h0 + h1)), R);
  float lo = min(fa, min(fm, fb)), hi = max(fa, max(fm, fb)), e = .5 + .02 * h1;
  return smoothstep(-e, e, hi) * (1. - smoothstep(-e, e, lo));
}
` + SHED_SUN_GLSL;
// iron: plates and flanges with rows of rivets (kind 0); a rib's laced web (kind 1: u along the rib in metres, v from the
// outer chord 0 to the inner 1, w the web's depth): between the lacing the roof's glass shows
const IRON_GLSL = /* glsl */`
{
  vec2 uv = vP.xy; vec3 paint = vec3(.03, .115, .072), base = paint * (.72 + .56 * svn(uv * .35));
  if (vP.z > 2.5) {
    // the yard's things: w picks the stuff: 1 black iron, 2 bare rail steel, 3 timber, 4 grey-blue paint, 5 buff paint, 6 grey primer
    base = (vP.w < 1.5 ? vec3(.035, .037, .04) : vP.w < 2.5 ? vec3(.2, .17, .15) : vP.w < 3.5 ? vec3(.36, .26, .15) : vP.w < 4.5 ? vec3(.16, .27, .34) : vP.w < 5.5 ? vec3(.5, .42, .24) : vec3(.4, .4, .37)) * (.8 + .4 * svn(uv * 1.3));
  } else if (vP.z > 1.5) {
    base = paint * .9;
    // (w over 1: the bay's gates. A leaf's own tone, and the sky's fill on it, so that the bars are seen in shade too)
    if (vP.w > 1.03) { base = paint * vP.w; shedGlow = base * uSkyCol * .5; }
  } else if (vP.z > .5) {
    float d = max(vP.w, .6), cell = 3.2, ft = fract(uv.x / cell), k = d * cell / sqrt(cell * cell + d * d);
    float px = max(fwidth(uv.x), fwidth(uv.y) * d) + 1e-5;
    float dd = min(abs(uv.y - ft), abs(uv.y - (1. - ft))) * k, dv = min(ft, 1. - ft) * cell, de = min(uv.y, 1. - uv.y) * d;
    float solid = max(max(1. - smoothstep(.16 - px * .5, .16 + px * .5, dd), 1. - smoothstep(.13 - px * .5, .13 + px * .5, dv)), 1. - smoothstep(.32 - px * .5, .32 + px * .5, de));
    solid = max(solid, 1. - smoothstep(1.5, 1.9, d));                       // near the pins the web is plate
    solid = mix(solid, max(solid, .5), smoothstep(.5, 1.6, px));
    vec2 c = fract(vec2(uv.x, uv.y * d) / .7) - .5; float rv = (1. - smoothstep(.09, .09 + px, length(c) * .7)) * (1. - smoothstep(.12, .5, px));
    base = mix(base, paint * 2.3 + .015, rv * step(d, 1.7)) * solid;
    vec3 Vw = vWp - cameraPosition; Vw /= max(length(Vw), 1e-3); float upw = clamp(Vw.y, 0., 1.);
    float sw = .5 + .5 * dot(Vw, uSun);
    shedGlow = mix(mix(mix(uSkyZen, vec3(.8, .86, .95), .28), uSkyHor, sw * sw), uSkyZen, smoothstep(0., .6, upw)) * mix(.78, 1.14, sw) * (1. - solid) * .96;
  } else {
    float px = max(fwidth(uv.x), fwidth(uv.y)) + 1e-5;
    vec2 c = fract(uv / .7) - .5; float rv = 1. - smoothstep(.09, .09 + px, length(c) * .7);
    float seam = 1. - smoothstep(.03, .03 + px, abs(fract(uv.x / 5.6 + .5) - .5) * 5.6);
    base = mix(base, paint * 2.3 + .015, rv * (1. - smoothstep(.12, .5, px)) + .16 * smoothstep(.12, .5, px));
    base *= 1. - .5 * seam * (1. - smoothstep(.05, .3, px));
  }
  diffuseColor.rgb = base;
}
`;
// glass: lit from behind by the sky. kind 0 the roof (u along the hall, v across), kind 1 an end screen (u, v from the
// fan's middle; w = 1 at the sun's end), kinds 2 and 3 the bay's obscured panes (its window, its roof), kind 4 the tower's
// lantern. Never a hard disc: a blaze in the frosting.
const GLASS_FRAG = /* glsl */`
uniform float uTime, uRain, uCloud; uniform vec3 uSun, uSunCol, uSkyCol, uSpot, uSkyZen, uSkyHor, uCloudCol; uniform vec2 uCover, uSeed, uLantern;
varying vec4 vP; varying vec3 vWp;
#ifdef USE_FOG
uniform vec3 fogColor; varying float vFogDepth; uniform float fogDensity; uniform float fogNear; uniform float fogFar;
#endif
` + SHED_NOISE + /* glsl */`
float bar(float d, float hw, float px){ return (1. - smoothstep(hw, hw + px, d)) * clamp(2. * hw / (px + 1e-4), 0., 1.); }
// a row of bars, cell metres apart, hw their half width; e = the distance to the nearest in cells (0..0.5); px = metres to
// a pixel: under a few pixels to a cell they fade to their even tone (never dots)
float bars(float e, float cell, float hw, float px){ return mix(bar(e * cell, hw, px), 2. * hw / cell, smoothstep(.16 * cell, .42 * cell, px)); }
// the sky as seen through clear glass, by the direction of sight alone (it stands at the far plane): a clear blue, deeper
// overhead and away from the sun, paling to white-gold only round the sun's place; a few slow clouds whose forms are
// seen, their fine grain fading by its footprint (no shimmer at a low angle); never a disc
vec3 skyThrough(vec3 V, float lobe){
  float up = clamp(V.y, 0., 1.), sunw = .5 + .5 * dot(V, uSun), t = smoothstep(0., .6, up);
  // the horizon takes its own colour toward the sun and a pale one of the zenith's away from it; between a warm horizon
  // and the blue above lies a pale band (never a mauve one)
  vec3 hz = mix(mix(uSkyZen, vec3(.8, .86, .95), .28), uSkyHor, sunw * sunw);
  vec3 sky = mix(hz, uSkyZen, t) * mix(.78, 1.14, sunw);
  sky += vec3(.9, .9, .85) * max(uSkyHor.r - uSkyHor.b, 0.) * 1.6 * t * (1. - t) * sunw;
  vec2 c = V.xz / max(V.y, .16) * 1.7 + vec2(uTime * .012, uTime * .005), cw = fwidth(c);
  float fine = 1. - smoothstep(.2, .8, max(cw.x, cw.y));
  float n = svn(c) * .56 + mix(.22, svn(c * 2.1 + 4.7) * .28 + svn(c * 4.3 + 9.1) * .16, fine);
  float cl = smoothstep(uCover.x, uCover.y, n) * smoothstep(.16, .34, V.y), thick = smoothstep(uCover.y, uCover.y + .16, n);
  sky = mix(sky, uCloudCol * (.84 + .22 * svn(c * 1.7 + 2.) - .2 * thick), cl * .95);
  float l2 = lobe * lobe;
  return sky + uSunCol * (l2 * .1 + l2 * l2 * .25);
}
void main(){
  vec3 V = vWp - cameraPosition; V /= max(length(V), 1e-3);
  float s = max(dot(V, uSun), 0.), s2 = s * s, lobe = s2 * s2; lobe *= lobe;
  vec3 col; float iron = 0.;
  float cloud = svn(vWp.xz * .011 + vec2(uTime * .016, uTime * .007)) * .6 + svn(vWp.zx * .029 - uTime * .011) * .4;
  if (vP.z < .5) {
    // the roof: panes 1.25 by 3.3 between fine bars. Most are clear and show the day outside; one in sixteen is old
    // obscured glass, a few are dusty or mended; an obscured pane takes the colour of the sky behind it, paler (never a white sheet)
    vec2 q = vec2(vP.x / 1.25, vP.y / 3.3), id = floor(q) + uSeed.x, f = fract(q), fw = fwidth(q) + 1e-5, e = min(f, 1. - f);
    iron = max(bars(e.x, 1.25, .055, fw.x * 1.25), bars(e.y, 3.3, .1, fw.y * 3.3));
    float h1 = sh12(id), h2 = sh12(id + 31.7), far = smoothstep(.16, .42, max(fw.x, fw.y));
    float frostK = mix(.03, .22, h1 * h1); frostK = mix(frostK, .62, step(.94, h2)); frostK = mix(frostK, .12, far);
    float streak = svn(vec2(vP.x * 2.6, vP.y * .22 - uTime * uRain * .8)), grime = svn(vP.xy * .35);
    vec3 thru = skyThrough(V, lobe);
    vec3 milk = mix(thru, uSkyCol, .5) * (1. - uCloud * .3 + uCloud * .6 * cloud) * (.9 + .16 * grime + .08 * streak);
    milk = mix(milk, milk * vec3(.92, .86, .72), step(.96, h2));                          // a dusty pane
    col = mix(thru, milk, frostK) * mix(.93 + .14 * sh12(id + 5.3), 1., far);
    float mend = step(.94, sh12(id + 13.9)) * (1. - far);                                // a mended pane: a lead across it, two glasses
    iron = max(iron, mend * bar(abs(f.y - .45) * 3.3, .05, fw.y * 3.3) * (1. - far));
    col = mix(col, col * vec3(.84, .96, .9), mend * step(.45, f.y));
    col *= mix(vec3(1.08, 1.03, .95), vec3(.86, .93, 1.), smoothstep(${G(SHED.z0)}, ${G(SHED.z1)}, vWp.z * sign(-uSun.z)));     // deeper toward the end away from the sun
    col += uSunCol * (lobe * .1 + lobe * lobe * .3) * frostK;
    col = mix(col, col * (.7 + .5 * streak), uRain * .6);
  } else if (vP.z < 1.5) {
    float r = length(vP.xy), a = atan(vP.y, abs(vP.x) < 1e-4 ? 1e-4 : vP.x), sec = a / (3.14159265 / 24.), pr = fwidth(r) + 1e-5;
    float dsec = abs(fract(sec + .5) - .5) * (3.14159265 / 24.) * r, heavy = step(abs(fract(sec / 4. + .5) - .5), .13);
    float dring = abs(fract((r - 14.) / 12. + .5) - .5) * 12.;
    iron = max(bar(dsec, mix(.16, .42, heavy), pr), bar(dring, .3, pr) * step(13., r));
    iron = max(iron, 1. - smoothstep(3.2, 3.2 + pr, r));
    iron = max(iron, bar(vP.y, .5, pr));
    vec2 dsp = vP.xy - uSpot.xy; float g = exp(-dot(dsp, dsp) / (2. * uSpot.z * uSpot.z));
    float frost = .88 + .2 * svn(vP.xy * .6);
    vec3 sunny = uSunCol * (.16 + g * .32 + lobe * .04) * frost;
    vec2 pid = vec2(floor(sec), floor((r - 14.) / 12.)); float ph = sh12(pid + 3.3);
    vec3 thru = skyThrough(V, lobe), shady = mix(thru, mix(thru, uSkyCol * (1.05 + .15 * cloud), .55) * frost, mix(.08, .5, ph));
    col = mix(shady, sunny, vP.w) * (.92 + .16 * sh12(pid + 9.9));
  } else if (vP.z > 3.5) {
    // the lantern: evenly bright frosted glass. Its top (w 2) has twelve facets: bars radiate in three ranks (twelve ribs that
    // taper to nothing at the apex, twelve bars between them, twenty-four fine ones further out) so that they never crowd
    // into a hub, crossed by fine twelve-sided rings, all alike; its walls (w 1) are small panes
    float face = 1.;
    if (vP.w > 1.5) {
      float r = length(vP.xy) + 1e-4, a = atan(vP.y, abs(vP.x) < 1e-4 ? 1e-4 : vP.x), pr = fwidth(r) + 1e-5;
      float lan = mod(a + .2618, .5236) - .2618, al = abs(lan), rp = r * cos(lan), gap = .2618 * r;
      float rib = bar((.2618 - al) * r, .12 * clamp(r / 3., 0., 1.), pr);
      float mid = bar(al * r, .07, pr) * smoothstep(4.2, 5.2, r);
      float fine = mix(bar(abs(al - .1309) * r, .045, pr), .09 / max(gap, .1), smoothstep(.12 * gap, .3 * gap, pr)) * smoothstep(6.3, 7.3, r);
      float ring = bars(abs(fract(rp / 2.1 + .5) - .5), 2.1, .05, pr) * smoothstep(3., 3.2, rp);
      iron = max(max(rib, mid), max(fine, ring)) * .86;
      face = 1. + .06 * cos(a - lan - atan(uSun.z, abs(uSun.x) < 1e-4 ? 1e-4 : uSun.x));
    } else {
      vec2 ps = vec2(.84, 1.9), q = vP.xy / ps, f = fract(q), fw = fwidth(q) + 1e-5, e = min(f, 1. - f);
      iron = max(bars(e.x, ps.x, .04, fw.x * ps.x), bars(e.y, ps.y, .05, fw.y * ps.y)) * .86;
    }
    col = uSkyCol * 1.16 * face + uSunCol * lobe * .15;
  } else {
    vec2 ps = vP.z > 2.5 ? vec2(.9167, 2.667) : vec2(1.7); float hw = vP.z > 2.5 ? .035 : .07;
    vec2 q = vP.xy / ps, f = fract(q), fw = fwidth(q) + 1e-5, e = min(f, 1. - f);
    iron = max(bars(e.x, ps.x, hw, fw.x * ps.x), bars(e.y, ps.y, hw, fw.y * ps.y));
    col = uSkyCol * 1.06 * vP.w + uSunCol * lobe * .1;                       // obscured glass: no picture of the sky in it
  }
  col = mix(col, vec3(.012, .013, .016), iron);
  gl_FragColor = vec4(col, 1.);
#ifdef USE_FOG
  #ifdef FOG_EXP2
  float ff = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
  float ff = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, ff * .55);
#endif
  vec2 ld = vWp.xz - uLantern; float lan = mod(atan(ld.y, abs(ld.x) < 1e-4 ? 1e-4 : ld.x) + .2618, .5236) - .2618;      // the roof's glass is open in a twelve-sided round
  if (vP.z < .5 && length(ld) * cos(lan) < 12.3) discard;
}
`;
const GLASS_VERT = /* glsl */`
attribute vec4 aP; varying vec4 vP; varying vec3 vWp;
#ifdef USE_FOG
varying float vFogDepth;
#endif
void main(){
  vP = aP; vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
#ifdef USE_FOG
  vFogDepth = -mvPosition.z;
#endif
}
`;
// what the hour deals: the sun's blaze, the sky in the glass, rain, the floor's sheen
function hourLook(hour) {
  // sun: the blaze in the -z screen; sky: the frosted glass's own light; zen, hor, cloud, cover: the sky seen through clear panes
  if (hour === 'golden') return { sun: [4.6, 2.9, 1.25], sky: [0.74, 0.66, 0.55], zen: [0.1, 0.22, 0.55], hor: [1.0, 0.72, 0.4], cloudCol: [1.0, 0.8, 0.58], cover: [0.6, 0.7], rain: 0, cloud: 0.5, sheen: 1.1, pool: 1 };
  if (hour === 'dawn') return { sun: [3.6, 2.7, 2.5], sky: [0.7, 0.64, 0.68], zen: [0.16, 0.28, 0.6], hor: [0.98, 0.76, 0.5], cloudCol: [1.0, 0.88, 0.76], cover: [0.58, 0.69], rain: 0, cloud: 0.4, sheen: 1, pool: 0.8 };
  if (hour === 'night') return { sun: [1.5, 1.6, 1.75], sky: [0.6, 0.65, 0.71], zen: [0.5, 0.55, 0.62], hor: [0.66, 0.7, 0.75], cloudCol: [0.74, 0.78, 0.84], cover: [0.0, 0.42], rain: 1, cloud: 0.7, sheen: 1.9, pool: 0 };
  return { sun: [4.2, 3.4, 2.3], sky: [0.66, 0.72, 0.8], zen: [0.04, 0.17, 0.62], hor: [0.2, 0.44, 0.9], cloudCol: [0.96, 0.95, 0.92], cover: [0.65, 0.73], rain: 0, cloud: 0.5, sheen: 1, pool: 1 };
}
// ---- walls: a kit in a wall's own frame (a along the wall to the right as seen from inside, y up, d out of the wall
// toward the hall); W(a, y, d) gives the place in the hall -------------------------------------------------------------
function wallKit(mesh, W) {
  const q = (p0, p1, p2, p3) => mesh.quad(W(p0[0], p0[1], p0[2]), W(p1[0], p1[1], p1[2]), W(p2[0], p2[1], p2[2]), W(p3[0], p3[1], p3[2]));
  const arc = (ac, ys, r, n) => { const o = []; for (let i = 0; i <= n; i++) { const t = Math.PI * i / n; o.push([ac + r * Math.cos(t), ys + r * Math.sin(t)]); } return o; };
  const k = {
    rect(a0, a1, y0, y1, d = 0) { q([a0, y0, d], [a1, y0, d], [a1, y1, d], [a0, y1, d]); },
    // a block standing out of the wall from depth d0 to d1: its front, sides, top and underside
    block(a0, a1, y0, y1, d0, d1, skip = '') {
      q([a0, y0, d1], [a1, y0, d1], [a1, y1, d1], [a0, y1, d1]);
      if (!skip.includes('r')) q([a1, y0, d1], [a1, y0, d0], [a1, y1, d0], [a1, y1, d1]);
      if (!skip.includes('l')) q([a0, y0, d0], [a0, y0, d1], [a0, y1, d1], [a0, y1, d0]);
      if (!skip.includes('u')) q([a0, y1, d1], [a1, y1, d1], [a1, y1, d0], [a0, y1, d0]);
      if (!skip.includes('d')) q([a0, y0, d0], [a1, y0, d0], [a1, y0, d1], [a0, y0, d1]);
    },
    // the wall's face over [a0, a1] x [yb, yt] with round-headed recesses: arches = [[middle, half width, springing]]
    // (each foot at yb; a fourth number is that recess's own tint); dep = their depth; glassAt: a callback that glazes
    // the back of a recess instead of bricking it; tint: how dark the brick of a recess's back is
    arched(a0, a1, yb, yt, arches, dep, n = 8, glassAt, tint = 0.4) {
      let a = a0;
      for (const [ac, hw, ys, own] of arches) {
        if (ac - hw > a) k.rect(a, ac - hw, yb, yt);
        a = ac + hw;
        const A = arc(ac, ys, hw, n), B = arc(ac, ys, hw + 0.9, n), keep = Object.assign({}, mesh.st);
        for (let i = 0; i < n; i++) {
          q([A[i + 1][0], A[i + 1][1], 0], [A[i][0], A[i][1], 0], [A[i][0], yt, 0], [A[i + 1][0], yt, 0]);                 // the spandrel
          q([A[i][0], A[i][1], -dep], [A[i][0], A[i][1], 0], [A[i + 1][0], A[i + 1][1], 0], [A[i + 1][0], A[i + 1][1], -dep]);   // the soffit
        }
        q([ac + hw, yb, -dep], [ac + hw, yb, 0], [ac + hw, ys, 0], [ac + hw, ys, -dep]);
        q([ac - hw, yb, 0], [ac - hw, yb, -dep], [ac - hw, ys, -dep], [ac - hw, ys, 0]);
        mesh.set({ kind: 1, w: 1 });                                                                 // a stone ring round the head
        for (let i = 0; i < n; i++) {
          q([A[i][0], A[i][1], 0.4], [B[i][0], B[i][1], 0.4], [B[i + 1][0], B[i + 1][1], 0.4], [A[i + 1][0], A[i + 1][1], 0.4]);
          q([B[i][0], B[i][1], 0.4], [B[i][0], B[i][1], 0], [B[i + 1][0], B[i + 1][1], 0], [B[i + 1][0], B[i + 1][1], 0.4]);
        }
        k.block(ac - 0.6, ac + 0.6, ys + hw - 0.3, ys + hw + 1.7, 0, 0.8);                           // a keystone, two imposts
        k.block(ac + hw - 0.3, ac + hw + 1.1, ys - 0.7, ys + 0.2, 0, 0.7); k.block(ac - hw - 1.1, ac - hw + 0.3, ys - 0.7, ys + 0.2, 0, 0.7);
        mesh.set(keep);
        const back = [[ac - hw, yb], [ac + hw, yb]].concat(A);
        if (glassAt) glassAt(back.map((p) => W(p[0], p[1], -dep)), back.map((p) => [p[0] - ac, p[1] - yb]));
        else { mesh.set({ w: keep.w * (own || tint) }); mesh.poly(back.map((p) => W(p[0], p[1], -dep))); mesh.set(keep); }
      }
      if (a < a1) k.rect(a, a1, yb, yt);
    },
  };
  return k;
}
// a long wall dressed: a stone plinth, piers with stone caps, blind arches between them, a string course, a cornice.
// o.doorways (places along the wall): the arch at each is a doorway: its back the dark of a passage, the plinth cut
// before it. Returns the doorways' arches [[middle, half width, springing]].
function dressWall(mesh, W, len0, len1, piers, top, o) {
  const k = wallKit(mesh, W), cuts = [len0].concat(piers, [len1]), doors = [];
  const isDoor = (ac) => (o.doorways || []).some((d) => Math.abs(d - ac) < 0.5);
  for (let i = 0; i < cuts.length - 1; i++) {
    const a0 = cuts[i], a1 = cuts[i + 1], mid = (a0 + a1) / 2, clear = a1 - a0 - o.pierW, arches = [];
    if (clear > 2 * o.hw * 2 + 3 && o.two) arches.push([mid - clear / 4 - o.gap, o.hw, o.ys], [mid + clear / 4 + o.gap, o.hw, o.ys]);
    else { const hw = Math.min(o.hw, clear / 2 - 1.4); if (hw > 1.5) arches.push([mid, hw, o.ys - (o.hw - hw)]); }
    mesh.set({ kind: 0, w: 1 });
    for (const A of arches) if (isDoor(A[0])) { A.push(0.1); doors.push(A); }
    k.arched(a0, a1, 0, o.band, arches, o.dep);
    k.rect(a0, a1, o.band, top);
  }
  for (const pa of piers) {
    mesh.set({ kind: 0, w: 1 }); k.block(pa - o.pierW / 2, pa + o.pierW / 2, 2.4, top - 2.8, 0, o.pierD, 'ud');
    mesh.set({ kind: 1 }); k.block(pa - o.pierW / 2 - 0.3, pa + o.pierW / 2 + 0.3, 0, 2.4, 0, o.pierD + 0.4, 'd');
    k.block(pa - o.pierW / 2 - 0.5, pa + o.pierW / 2 + 0.5, top - 2.8, top, 0, o.pierD + 0.9);
    k.block(pa - o.pierW / 2 - 0.2, pa + o.pierW / 2 + 0.2, o.band, o.band + 1.4, 0, o.pierD + 0.5);
  }
  mesh.set({ kind: 1, w: 1 });
  let pa = len0;                                                 // the plinth, cut at every doorway
  for (const [ac, hw] of doors.concat([[len1, 0]])) { k.block(pa, ac - hw, 0, 2.4, 0, 0.7, 'd' + (pa === len0 ? 'l' : '') + (ac - hw === len1 ? 'r' : '')); pa = ac + hw; }
  k.block(len0, len1, o.band, o.band + 1.4, 0, 0.9, 'lr');       // the string course
  k.block(len0, len1, top - 1.3, top, 0, 1.2, 'lru');            // the cornice, on a row of corbels
  for (let a = len0 + 1.2; a < len1 - 0.6; a += 2.4) k.block(a - 0.4, a + 0.4, top - 2.4, top - 1.3, 0, 0.9, 'u');
  mesh.set({ kind: 0, w: 1 });
  return doors;
}
// where the sun's blaze stands in the glass of its end screen: (metres across from the fan's middle, metres over the
// springing, its width): the place where the line from the middle of the hall toward the sun crosses the screen, drawn in
// until it lies well inside the fan
function blazeSpot(THREE, sun) {
  const reach = SHED.z1 / Math.max(Math.abs(sun.z), 0.2), far = 0.7 * FAN.r;
  let x = sun.x * reach, y = Math.max(8, 12 + sun.y * reach - SHED.spring);
  const r = Math.hypot(x, y);
  if (r > far) { x *= far / r; y *= far / r; }
  return new THREE.Vector3(x, y, 14);
}
// ---- the build -----------------------------------------------------------------------------------------------------------
export async function buildShed(ctx, o) {
  const THREE = o.THREE, object = new THREE.Group(); object.name = 'doors-in-transit-shed';
  const sd = o.sunDir && o.sunDir.isVector3 ? o.sunDir.toArray() : (o.sunDir || [0.15, 0.5, -0.85]);
  const sun = new THREE.Vector3(sd[0], sd[1], sd[2]).normalize(), sunEnd = sun.z <= 0 ? -1 : 1;
  const look = hourLook(ctx.vary && ctx.vary.hour);
  const U = { uTime: { value: 0 }, uRain: { value: look.rain }, uCloud: { value: look.cloud }, uSun: { value: sun },
    uSunCol: { value: new THREE.Vector3(look.sun[0], look.sun[1], look.sun[2]) }, uSkyCol: { value: new THREE.Vector3(look.sky[0], look.sky[1], look.sky[2]) },
    uSpot: { value: blazeSpot(THREE, sun) },
    uSkyZen: { value: new THREE.Vector3(look.zen[0], look.zen[1], look.zen[2]) }, uSkyHor: { value: new THREE.Vector3(look.hor[0], look.hor[1], look.hor[2]) },
    uCloudCol: { value: new THREE.Vector3(look.cloudCol[0], look.cloudCol[1], look.cloudCol[2]) }, uCover: { value: new THREE.Vector2(look.cover[0], look.cover[1]) },
    uLantern: { value: new THREE.Vector2(TOWER.x, TOWER.z) }, uSeed: { value: new THREE.Vector2(0, 0) } };
  // two streams of the seed: which panes of the roof are clear, dusty or mended; how the floor's panels and newer patches fall
  if (o.rngFor) { U.uSeed.value.set(Math.floor(o.rngFor('shed-glass')() * 900), Math.floor(o.rngFor('shed-floor')() * 900)); }
  shedSunUniform.value = sun; shedBarsUniform.value = look.pool;
  const brickM = litMaterial(THREE, 'brick', { roughness: 0.9, metalness: 0 }, 'uniform vec3 uSunCol, uSun; uniform float uPool;\n' + SHED_SUN_GLSL, BRICK_GLSL, U);
  U.uEnd = { value: sunEnd }; U.uPool = { value: look.pool }; U.uSheen = { value: 0.55 * look.sheen };
  const floorM = litMaterial(THREE, 'floor', { roughness: 0.6, metalness: 0 }, FLOOR_PARS, FLOOR_GLSL, U);
  const ironM = litMaterial(THREE, 'iron', { roughness: 0.46, metalness: 0.3, side: THREE.DoubleSide }, 'uniform vec3 uSkyCol, uSkyZen, uSkyHor, uSun;\n', IRON_GLSL, U);
  const glassM = new THREE.ShaderMaterial({ uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), U), vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, fog: true });
  const floor = makeMesh(), brick = makeMesh(), iron = makeMesh(), glass = makeMesh(), yard = makeMesh();
  const z0 = SHED.z0, z1 = SHED.z1, n = 56, L = roofLine(n);
  await ctx.yield();

  // the floor
  floor.quad([-HALF, 0, z1], [HALF, 0, z1], [HALF, 0, z0], [-HALF, 0, z0]);
  // the side walls, to the springing; in each, the through track's doorway: a threshold of the hall's own paving,
  // and before the dark of the passage an iron gate in the hall's green (rails, uprights, the meeting stiles)
  const sideDress = { pierW: ARCADE.pierW, pierD: 2.1, hw: ARCADE.hw, ys: 15.5, band: 23, dep: ARCADE.dep, gap: ARCADE.gap, two: true };
  for (const sx of [1, -1]) {
    const W = sx > 0 ? (a, y, d) => [HALF - d, y, a] : (a, y, d) => [-HALF + d, y, -a];
    const ways = dressWall(brick, W, z0, z1, RIB_Z, SHED.spring, Object.assign({ doorways: [sx * TRACKS.doorZ[sx > 0 ? 0 : 1]] }, sideDress));
    for (const [ac, hw, ys] of ways) {
      const dep = ARCADE.dep, at = (a, y) => W(a, y, 0.3 - dep), head = (a) => ys + Math.sqrt(Math.max(0, hw * hw - (a - ac) * (a - ac))) - 0.1;
      floor.set({ kind: 0, w: 1 }).poly([W(ac - hw, 0, 0), W(ac + hw, 0, 0), W(ac + hw, 0, -dep), W(ac - hw, 0, -dep)]);
      iron.set({ kind: 2, w: 1.05 });
      for (const y of [0.45, 5.6, 10.8, ys]) rod(iron, at(ac - hw, y), at(ac + hw, y), 0.07, 0.2);
      for (let i = -4; i <= 4; i++) rod(iron, at(ac + i * 0.66, 0.45), at(ac + i * 0.66, head(ac + i * 0.66)), 0.06, i ? 0.11 : 0.2);
      iron.set({ kind: 0, w: 1 });
    }
    await ctx.yield();
  }
  // the end walls: brick to the roof's line, a half-round screen high in each
  const F = []; for (let i = 0; i <= n; i++) { const a = Math.PI * i / n; F.push([FAN.r * Math.cos(a), FAN.cy + FAN.r * Math.sin(a)]); }
  let mouth = null;
  for (const e of [-1, 1]) {
    const z = e < 0 ? z0 : z1, zg = z + e * 1.6, flip = e > 0;
    const q = (a, b, c, d, mesh) => (flip ? mesh.quad(d, c, b, a) : mesh.quad(a, b, c, d));
    brick.set({ kind: 0, w: 1 });
    const WE = e < 0 ? (a, y, d) => [a, y, z + d] : (a, y, d) => [-a, y, z - d], PIERS = [-84, -60, -36, -12, 12, 36, 60, 84];
    const endDress = { pierW: 3.4, pierD: 2.3, hw: 7.6, ys: 12.5, band: 23, dep: 2.6, two: false };
    if (e > 0) dressWall(brick, WE, -HALF, HALF, PIERS, SHED.spring, endDress);
    else {
      // THE MOUTH TO THE FAR STORE: the -z wall is dressed only outside the plan's opening; between, the mouth's piece
      // builds the jambs (the wall's piers at the opening's two ends), the lattice girder over it and the sill in the floor
      // (its blind arches are as deep as the mouth's sill is wide, so that nothing of the shed stands beyond the sill's far edge)
      const flank = Object.assign({}, endDress, { dep: MOUTH.depth });
      dressWall(brick, WE, -HALF, FAR.x0, PIERS.filter((a) => a < FAR.x0), SHED.spring, flank);
      dressWall(brick, WE, FAR.x1, HALF, PIERS.filter((a) => a > FAR.x1), SHED.spring, flank);
      mouth = buildMouth(brick, iron, floor, wallKit, WE, endDress, SHED.spring);
    }
    brick.set({ kind: 1, w: 1 });                              // a stone ring round the great screen, a deep sill under it
    for (let i = 0; i < n; i++) {
      const f0 = F[i], f1 = F[i + 1], g = 1 + 3.2 / FAN.r, c0 = [f0[0] * g, FAN.cy + (f0[1] - FAN.cy) * g], c1 = [f1[0] * g, FAN.cy + (f1[1] - FAN.cy) * g], zr = z - e * 1.0;
      q([f0[0], f0[1], zr], [c0[0], c0[1], zr], [c1[0], c1[1], zr], [f1[0], f1[1], zr], brick);
      q([c0[0], c0[1], zr], [c0[0], c0[1], z], [c1[0], c1[1], z], [c1[0], c1[1], zr], brick);
      q([f0[0], f0[1], z], [f0[0], f0[1], zr], [f1[0], f1[1], zr], [f1[0], f1[1], z], brick);
    }
    { const k = wallKit(brick, e < 0 ? (a, y, d) => [a, y, z + d] : (a, y, d) => [-a, y, z - d]); k.block(-FAN.r - 5, FAN.r + 5, SHED.spring - 0.2, SHED.spring + 2.2, 0, 1.9); }
    {
      const k = wallKit(brick, e < 0 ? (a, y, d) => [a, y, z + d] : (a, y, d) => [-a, y, z - d]);
      const fanX = (y) => Math.sqrt(Math.max(0, (FAN.r + 3.2) * (FAN.r + 3.2) - (y - FAN.cy) * (y - FAN.cy)));
      const roofX = (y) => { let a = 0, b = HALF; for (let i = 0; i < 24; i++) { const m = (a + b) / 2; if (roofY(m) > y) a = m; else b = m; } return a; };
      for (const sx of [-1, 1]) {
        for (const xa of [72, 84]) {
          const top = roofY(xa + 1.7) - 1.4, c = sx * xa;
          brick.set({ kind: 0, w: 1 }); k.block(c - 1.7, c + 1.7, SHED.spring + 2.2, top - 1.6, 0, 1.3, 'ud');
          brick.set({ kind: 1, w: 1 }); k.block(c - 2.1, c + 2.1, top - 1.6, top, 0, 1.8);
        }
        brick.set({ kind: 1, w: 1 });
        for (const y of [46, 58, 70, 82, 94]) {
          const xi = fanX(y + 0.65) + 0.2, xo = roofX(y + 1.3) - 0.4;
          if (xo - xi > 2) k.block(Math.min(sx * xi, sx * xo), Math.max(sx * xi, sx * xo), y, y + 1.3, 0, 0.8, 'lr');
        }
      }
      const zr = z - e * 0.9;
      for (let i = 0; i < n; i++) {
        const p0 = L[i], p1 = L[i + 1], i0 = [p0.x + p0.nx * 2.4, p0.y + p0.ny * 2.4], i1 = [p1.x + p1.nx * 2.4, p1.y + p1.ny * 2.4];
        q([i0[0], i0[1], zr], [p0.x, p0.y, zr], [p1.x, p1.y, zr], [i1[0], i1[1], zr], brick);
        q([i0[0], i0[1], z], [i0[0], i0[1], zr], [i1[0], i1[1], zr], [i1[0], i1[1], z], brick);
      }
    }
    brick.set({ kind: 0, w: 1 });
    for (let i = 0; i < n; i++) {
      const f0 = F[i], f1 = F[i + 1], p0 = L[i], p1 = L[i + 1];
      q([f0[0], f0[1], z], [p0.x, p0.y, z], [p1.x, p1.y, z], [f1[0], f1[1], z], brick);
      brick.set({ kind: 1 }); q([f0[0], f0[1], zg], [f0[0], f0[1], z], [f1[0], f1[1], z], [f1[0], f1[1], zg], brick); brick.set({ kind: 0 });   // the screen's stone reveal
    }
    glass.set({ kind: 1, w: e === sunEnd ? 1 : 0 });
    for (let i = 0; i < n; i++) {
      const f0 = F[i], f1 = F[i + 1], uv = [[0, 0], [f0[0], f0[1] - FAN.cy], [f1[0], f1[1] - FAN.cy]];
      if (flip) glass.poly([[0, FAN.cy, zg], [f1[0], f1[1], zg], [f0[0], f0[1], zg]], [uv[0], uv[2], uv[1]]);
      else glass.poly([[0, FAN.cy, zg], [f0[0], f0[1], zg], [f1[0], f1[1], zg]], uv);
    }
  }
  await ctx.yield();
  // the roof: glass along the whole line
  glass.set({ kind: 0, w: 1 });
  for (let i = 0; i < n; i++) {
    const a = L[i], b = L[i + 1];
    glass.quad([a.x, a.y, z0], [a.x, a.y, z1], [b.x, b.y, z1], [b.x, b.y, z0], [[z0, a.s], [z1, a.s], [z1, b.s], [z0, b.s]]);
  }
  // the ribs: three-hinged arches, each half deepest at its haunch, slender at the pins
  const depth = (i) => { const t = i <= n / 2 ? i / (n / 2) : (n - i) / (n / 2); return 0.9 + 4.3 * Math.pow(Math.sin(Math.PI * Math.min(1, t)), 0.85); };
  const O = L.map((p) => [p.x + p.nx * 0.3, p.y + p.ny * 0.3]), C = L.map((p, i) => [p.x + p.nx * (0.3 + depth(i)), p.y + p.ny * (0.3 + depth(i))]);
  const lip = (pt, c, h) => [c[0] + pt.nx * h, c[1] + pt.ny * h];
  for (const z of RIB_Z) {
    for (let i = 0; i < n; i++) {
      const o0 = O[i], o1 = O[i + 1], c0 = C[i], c1 = C[i + 1], s0 = L[i].s, s1 = L[i + 1].s, d0 = depth(i), d1 = depth(i + 1);
      iron.set({ kind: 1, w: 1 });
      iron.quad([o0[0], o0[1], z], [c0[0], c0[1], z], [c1[0], c1[1], z], [o1[0], o1[1], z], [[s0, 0, d0], [s0, 1, d0], [s1, 1, d1], [s1, 0, d1]]);
      iron.set({ kind: 0, w: 1 });
      iron.quad([c0[0], c0[1], z - 0.6], [c0[0], c0[1], z + 0.6], [c1[0], c1[1], z + 0.6], [c1[0], c1[1], z - 0.6], [[s0, 0.05], [s0, 1.25], [s1, 1.25], [s1, 0.05]]);
      iron.quad([o0[0], o0[1], z - 0.5], [o0[0], o0[1], z + 0.5], [o1[0], o1[1], z + 0.5], [o1[0], o1[1], z - 0.5], [[s0, 0.15], [s0, 1.15], [s1, 1.15], [s1, 0.15]]);
      const cu0 = lip(L[i], c0, -0.5), cu1 = lip(L[i + 1], c1, -0.5), od0 = lip(L[i], o0, 0.42), od1 = lip(L[i + 1], o1, 0.42);
      for (const sz of [-1, 1]) {                                         // the flanges' lips: they catch the long light
        iron.quad([c0[0], c0[1], z + sz * 0.6], [c1[0], c1[1], z + sz * 0.6], [cu1[0], cu1[1], z + sz * 0.6], [cu0[0], cu0[1], z + sz * 0.6], [[s0, 0.1], [s1, 0.1], [s1, 0.6], [s0, 0.6]]);
        iron.quad([o0[0], o0[1], z + sz * 0.5], [o1[0], o1[1], z + sz * 0.5], [od1[0], od1[1], z + sz * 0.5], [od0[0], od0[1], z + sz * 0.5], [[s0, 0.14], [s1, 0.14], [s1, 0.56], [s0, 0.56]]);
      }
    }
    const cr = L[n / 2], pin = [];                                        // the crown's pin plate, the shoes on the piers
    for (let a = 0; a < 8; a++) pin.push([cr.x + 1.5 * Math.cos(a * Math.PI / 4), cr.y + 0.9 + 1.5 * Math.sin(a * Math.PI / 4), z + 0.08]);
    iron.poly(pin); iron.poly(pin.map((q) => [q[0], q[1], z - 0.08]).reverse());
    for (const sx of [-1, 1]) iron.box(Math.min(sx * (HALF - 2.6), sx * (HALF - 0.1)), Math.max(sx * (HALF - 2.6), sx * (HALF - 0.1)), SHED.spring, SHED.spring + 1.7, z - 0.95, z + 0.95, 'd');
    await ctx.yield();
  }
  // the purlins: light trussed girders along the hall on every fourth step of the roof's line
  for (let i = 4; i < n; i += 4) {
    const p = L[i], tx = -p.ny, ty = p.nx, h = 0.3;
    const c = (dn, dt) => [p.x + p.nx * dn + tx * dt, p.y + p.ny * dn + ty * dt];
    const a = c(0.3, -h), b = c(0.3, h), d = c(1.5, -h), e = c(1.5, h);
    iron.set({ kind: 0, w: 1 });
    iron.quad([d[0], d[1], z0], [d[0], d[1], z1], [e[0], e[1], z1], [e[0], e[1], z0], [[z0, 0.05], [z1, 0.05], [z1, 0.65], [z0, 0.65]]);
    iron.set({ kind: 1, w: 1.2 });
    iron.quad([a[0], a[1], z0], [a[0], a[1], z1], [d[0], d[1], z1], [d[0], d[1], z0], [[z0, 0], [z1, 0], [z1, 1], [z0, 1]]);
    iron.quad([e[0], e[1], z0], [e[0], e[1], z1], [b[0], b[1], z1], [b[0], b[1], z0], [[z0, 1], [z1, 1], [z1, 0], [z0, 0]]);
  }
  // wind bracing: crossed tie rods under the glass in five bays; four long ties from rib to rib at the haunches
  iron.set({ kind: 2, w: 1 });
  const rodAt = (pt, off, sg, hw, z) => [pt.x + pt.nx * off - pt.ny * sg * hw, pt.y + pt.ny * off + pt.nx * sg * hw, z];
  for (const bi of [0, 3, 7, 10, 13]) for (const [ja, jb] of [[2, 9], [9, 16], [n - 9, n - 2], [n - 16, n - 9]]) for (const [j0, j1] of [[ja, jb], [jb, ja]]) {
    const za = RIB_Z[bi], zb = RIB_Z[bi + 1], pa = L[j0], pb = L[j1];
    iron.quad(rodAt(pa, 0.95, -1, 0.17, za), rodAt(pa, 0.95, 1, 0.17, za), rodAt(pb, 0.95, 1, 0.17, zb), rodAt(pb, 0.95, -1, 0.17, zb));
  }
  for (const j of [10, 20, n - 20, n - 10]) {
    const pt = L[j], off = 0.5 + depth(j);
    iron.quad(rodAt(pt, off, -1, 0.16, z0), rodAt(pt, off, 1, 0.16, z0), rodAt(pt, off, 1, 0.16, z1), rodAt(pt, off, -1, 0.16, z1));
    iron.quad(rodAt(pt, off - 0.16, 0, 0, z0), rodAt(pt, off + 0.16, 0, 0, z0), rodAt(pt, off + 0.16, 0, 0, z1), rodAt(pt, off - 0.16, 0, 0, z1));
  }
  // the lantern over the tower: twelve-sided, evenly bright frosted glass in many fine bars; its top a rosette of fine
  // radial bars and rings with no hub; only a slim kerb and slender corner posts of iron (never a bold ring, never a dark middle)
  {
    const N = 12, ap = 12.6, R = ap / Math.cos(Math.PI / N), cx = TOWER.x, cz = TOWER.z, y0 = roofY(R) - 0.4, yt = SHED.crown + 9, side = 2 * R * Math.sin(Math.PI / N), ring = [];
    for (let i = 0; i <= N; i++) { const a = (i + 0.5) / N * Math.PI * 2; ring.push([cx + R * Math.cos(a), cz + R * Math.sin(a), i * side]); }
    for (let i = 0; i < N; i++) {
      const p = ring[i], q2 = ring[i + 1], k2 = 1 - 0.3 / R;
      glass.set({ kind: 4, w: 1 });
      glass.quad([p[0], y0, p[1]], [q2[0], y0, q2[1]], [q2[0], yt, q2[1]], [p[0], yt, p[1]], [[p[2], 0], [q2[2], 0], [q2[2], yt - y0], [p[2], yt - y0]]);
      glass.set({ kind: 4, w: 2 });
      glass.poly([[p[0], yt, p[1]], [q2[0], yt, q2[1]], [cx, yt + 3.2, cz]], [[p[0] - cx, p[1] - cz], [q2[0] - cx, q2[1] - cz], [0, 0]]);
      iron.set({ kind: 2, w: 1 });
      iron.quad([p[0], y0, p[1]], [q2[0], y0, q2[1]], [q2[0], y0 + 0.4, q2[1]], [p[0], y0 + 0.4, p[1]]);
      iron.quad([p[0], y0, p[1]], [cx + (p[0] - cx) * k2, y0, cz + (p[1] - cz) * k2], [cx + (p[0] - cx) * k2, yt, cz + (p[1] - cz) * k2], [p[0], yt, p[1]]);
    }
    iron.set({ kind: 0, w: 1 });
  }
  await ctx.yield();
  buildBay(brick, iron, glass, floor, wallKit);
  await ctx.yield();
  const stood = await furnishYard(yard, ctx);      // the yard's standing things: a mesh of their own, the only one of the shed that throws a shadow
  await ctx.yield();
  const deck = await furnishDeck(yard, ctx);       // the far deck's things (the ends and sides of the floor), in the same mesh
  stood.standing += deck.standing; stood.leftOut += deck.leftOut;
  await ctx.yield();
  const parts = [[floor, floorM, true], [brick, brickM, true], [iron, ironM, false], [glass, glassM, false], [yard, ironM, true, true]];
  let triangles = 0, drawCalls = 0; const made = [];
  for (const [mesh, mat, shadow, casts] of parts) {
    const g = mesh.geometry(THREE), obj = new THREE.Mesh(g, mat); obj.receiveShadow = shadow; obj.castShadow = !!casts; object.add(obj);
    triangles += mesh.triangles(); drawCalls++; made.push(g, mat);
    await ctx.yield();
  }
  return {
    object, triangles, drawCalls, roofY, yard: stood, mouth,   // yard: { standing, leftOut }, the count of the yard's things; mouth: { triangles } of the mouth's piece
    update(dt, time, u) { U.uTime.value = time; },
    dispose() { for (const x of made) x.dispose(); },
  };
}
