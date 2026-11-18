// THE GOLD-WIRE HARBOUR (cloisonne-typhoon): an hour before a typhoon, seen from the prow of a junk made of
// cloisonne enamel. Everything in the picture is a flat glassy cell bounded by raised gold wire, drawn with the one
// enamel-and-wire material that the hero set piece exports (src/parts/cloisonne-typhoon.js); no kit material is used.
//
// World space: X east, Z south, heights above still water. Open sea south of z = -50; the harbour mouth lies between
// a rock spit (-50,-50) and the breakwater head (40,-50) where the pagoda light stands; the basin runs north to the
// stone beam bridge at z = -325, whose central span holds the portal. The storm (the hero) stands 1.7 km to the east.
//
// Flight (475 m, 46 s, level): open sea with the storm spiral ahead and the fleet strung under it -> a steady left
// turn to the mouth, pagoda passing on the right, surf on the stones -> the harbour between sampans, nets and fish
// racks while the dark-cell front floods past -> the straight run to the bridge under one shaft of storm sun.
//
// Looks by seed / ctx.vary.hour: storm afternoon (turquoise ground), night (lapis-black ground, lanterns), dawn (white
// ground, blue-and-white). Weather: an hour out, rain already over the harbour, or the eye (a pale still sky, the
// scroll wall standing all round the horizon, the sea in long slow arcs). Season: plain, New Year (lantern strings),
// laver harvest (drying racks). Cast: sails oxblood / white / turquoise; sampans or bamboo rafts.
// Rare event (ctx.vary.rare): a gold-wire dragon (antlered head, mane, whiskers, pearl, dorsal fins, four legs) is on
// the crest of the storm at the entry, runs the wall and crosses over the bridge in profile as the junk reaches it.
// The town comes out to the fairway on two jetties and two stone hards (HARDS) 30-45 m from the path; the fleet's
// east moorings, the companion junks and the channel clutter are laid out around them.
// Our own junk (one group, hidden while the world is seen through the previous portal): the prow along the bottom of
// the frame, the forestay with its flags top left, and a short lantern mast on the starboard rail, whole inside the
// frame; the sail is kept just outside the frame's right edge at every shape of screen (update() slides it).
// Scripted to progress: lightning at u 0.066 (beside the hub), 0.155 (behind the pagoda light), 0.33, 0.585 (under the
// cloud arm, left of the bridge), 0.78 (behind the bridge), 0.9; the second companion junk cuts across our starboard
// bow by u 0.085 and surfs ahead through the mouth; the port companion leads us in 60 m ahead, anchors off the west
// jetty and is passed close at u 0.7; a skein of cranes overtakes us and crosses the bow between u 0.16 and 0.34; the
// cloud arm swells down in three billows from u 0.36 to 0.74; the sun shaft settles on the central span at 0.8 and
// holds to 0.9.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, makeJunkGeometries } from '../parts/cloisonne-typhoon.js';

const MOUTH_Z = -50, BRIDGE_Z = -325, EYE = 3.2, TRIP = 46;
const PORTAL_R = 6, PORTAL_Y = 6.5;      // the portal stands clear of the water under the central span (lower edge 0.5 m up)
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------------------------------------
// Cell builder: writes the enamel attributes directly. Every quad / triangle / fan is one flat cell with a gold wire
// on its border (mask bits open edges); uv is laid out in metres on the face so the pattern materials can use it.
// ---------------------------------------------------------------------------------------------------------------
function makeCells() {
  const P = [], N = [], C = [], E = [], CL = [], UV = [], SW = [];
  let tx = 0, ty = 0, tz = 0, rc = 1, rs = 0, sk = 1, cid = 0;
  const X = (p) => [tx + (p[0] * rc + p[2] * rs) * sk, ty + p[1] * sk, tz + (-p[0] * rs + p[2] * rc) * sk];
  function raw(A, B, Cc, col, mask, cc, id, uvs, sws) {
    if (b.mute) return;                               // a muted builder takes the calls and keeps nothing
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = Cc[0] - A[0], vy = Cc[1] - A[1], vz = Cc[2] - A[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz); if (l < 1e-9) return;
    nx /= l; ny /= l; nz /= l;
    const V = [A, B, Cc], base = E.length;
    for (let i = 0; i < 9; i++) E.push(1e3);
    for (let e = 0; e < 3; e++) {
      if (!((mask >> e) & 1)) continue;
      const p = V[e], q = V[(e + 1) % 3], len = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]), h = l / Math.max(len, 1e-6), opp = (e + 2) % 3;
      for (let v = 0; v < 3; v++) E[base + v * 3 + e] = v === opp ? h : 0;
    }
    let t0 = nz, t2 = -nx; const tl = Math.hypot(t0, t2);
    if (tl < 0.3) { t0 = 1; t2 = 0; } else { t0 /= tl; t2 /= tl; }
    const bx = ny * t2, by = nz * t0 - nx * t2, bz = -ny * t0;
    for (let v = 0; v < 3; v++) {
      const p = V[v];
      P.push(p[0], p[1], p[2]); N.push(nx, ny, nz); C.push(col[0], col[1], col[2]); CL.push(cc[0], cc[1], cc[2], id);
      if (uvs) UV.push(uvs[v][0], uvs[v][1]); else UV.push(p[0] * t0 + p[2] * t2, p[0] * bx + p[1] * by + p[2] * bz);
      SW.push(sws ? (typeof sws === 'number' ? sws : sws[v]) : 0);
    }
  }
  const b = {
    mute: false,
    at(x = 0, y = 0, z = 0, ry = 0, s = 1) { tx = x; ty = y; tz = z; rc = Math.cos(ry); rs = Math.sin(ry); sk = s; return b; },
    tri(a, b2, c, col, o) {
      const A = X(a), B = X(b2), Cc = X(c), id = (++cid * 0.6180339) % 1;
      raw(A, B, Cc, col, o?.mask ?? 7, [(A[0] + B[0] + Cc[0]) / 3, (A[1] + B[1] + Cc[1]) / 3, (A[2] + B[2] + Cc[2]) / 3], id, o?.uv, o?.sw);
    },
    // quad a,b,c,d (counter-clockwise seen from outside). mask bits: 1 ab, 2 bc, 4 cd, 8 da
    quad(a, b2, c, d, col, o) {
      const A = X(a), B = X(b2), Cc = X(c), D = X(d), id = (++cid * 0.6180339) % 1, m = o?.mask ?? 15, uv = o?.uv, sw = o?.sw;
      const cc = o?.cc ? X(o.cc) : [(A[0] + B[0] + Cc[0] + D[0]) / 4, (A[1] + B[1] + Cc[1] + D[1]) / 4, (A[2] + B[2] + Cc[2] + D[2]) / 4];
      const s3 = (i, j, k) => (sw == null || typeof sw === 'number' ? sw : [sw[i], sw[j], sw[k]]);
      raw(A, B, Cc, col, (m & 1) | (m & 2), cc, id, uv && [uv[0], uv[1], uv[2]], s3(0, 1, 2));
      raw(A, Cc, D, col, ((m & 4) >> 1) | ((m & 8) >> 1), cc, id, uv && [uv[0], uv[2], uv[3]], s3(0, 2, 3));
    },
    // a closed polygon as one cell: centre c, rim points pts (counter-clockwise)
    fan(c, pts, col, o) {
      const Cc = X(c), id = (++cid * 0.6180339) % 1, n = pts.length, T = pts.map(X), sw = o?.sw;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        raw(Cc, T[i], T[j], col, 2, Cc, id, null, sw == null ? 0 : (typeof sw === 'number' ? [0, sw, sw] : [sw[0], sw[1], sw[1]]));
      }
    },
    // box centred at (cx, cy, cz). o: taper (top scale), top (colour, or false), bottom, mask
    box(cx, cy, cz, sx, sy, sz, col, o) {
      const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2, t = o?.taper ?? 1;
      const hx = sx / 2 * t, hz = sz / 2 * t, m = o?.mask;
      const A = [x0, y0, z0], B = [x1, y0, z0], Cc = [x1, y0, z1], D = [x0, y0, z1];
      const Ee = [cx - hx, y1, cz - hz], F = [cx + hx, y1, cz - hz], G = [cx + hx, y1, cz + hz], H = [cx - hx, y1, cz + hz];
      const oo = m == null ? o : { ...o, mask: m };
      b.quad(A, Ee, F, B, col, oo); b.quad(B, F, G, Cc, col, oo); b.quad(Cc, G, H, D, col, oo); b.quad(D, H, Ee, A, col, oo);
      if (o?.top !== false) b.quad(Ee, H, G, F, o?.top || col, oo);
      if (o?.bottom) b.quad(A, B, Cc, D, col, oo);
    },
    // n-sided frustum about Y from y0 (radius r0) to y0 + h (radius r1). o: rot, sx, sz (stretch), cap (colour | false), mask
    prism(cx, y0, cz, r0, r1, h, n, col, o) {
      const rot = o?.rot ?? 0, sx = o?.sx ?? 1, sz = o?.sz ?? 1, top = [];
      for (let i = 0; i < n; i++) {
        const a0 = rot + i / n * TAU, a1 = rot + (i + 1) / n * TAU;
        const p0 = [cx + Math.sin(a0) * r0 * sx, y0, cz + Math.cos(a0) * r0 * sz], p1 = [cx + Math.sin(a1) * r0 * sx, y0, cz + Math.cos(a1) * r0 * sz];
        const q0 = [cx + Math.sin(a0) * r1 * sx, y0 + h, cz + Math.cos(a0) * r1 * sz], q1 = [cx + Math.sin(a1) * r1 * sx, y0 + h, cz + Math.cos(a1) * r1 * sz];
        if (r1 > 1e-4) b.quad(p0, p1, q1, q0, col, o); else b.tri(p0, p1, q0, col, o);
        top.push(q0);
      }
      if (o?.cap !== false && r1 > 1e-4) b.fan([cx, y0 + h, cz], top, o?.cap || col);
    },
    // a cord from a to b as two crossed cards whose uv.y is the distance from the centre line (pattern 'line')
    line(a, b2, w = 0.3, sw) {
      const A = X(a), B = X(b2), dx = B[0] - A[0], dy = B[1] - A[1], dz = B[2] - A[2], L = Math.hypot(dx, dy, dz) || 1;
      let px = -dz, pz = dx; const pl = Math.hypot(px, pz);
      if (pl < 1e-4 * L) { px = 1; pz = 0; } else { px /= pl; pz /= pl; }
      const ux = (dy * pz) / L, uy = (dz * px - dx * pz) / L, uz = (-dy * px) / L;       // second axis: d x p
      const s0 = sw == null ? 0 : (typeof sw === 'number' ? sw : sw[0]), s1 = sw == null ? 0 : (typeof sw === 'number' ? sw : sw[1]);
      const id = (++cid * 0.6180339) % 1, cc = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2], col = [1, 1, 1];
      for (const [ox, oy, oz] of [[px * w, 0, pz * w], [ux * w, uy * w, uz * w]]) {
        const a0 = [A[0] - ox, A[1] - oy, A[2] - oz], a1 = [A[0] + ox, A[1] + oy, A[2] + oz], b0 = [B[0] - ox, B[1] - oy, B[2] - oz], b1 = [B[0] + ox, B[1] + oy, B[2] + oz];
        raw(a0, b0, b1, col, 0, cc, id, [[0, -w], [L, -w], [L, w]], [s0, s1, s1]);
        raw(a0, b1, a1, col, 0, cc, id, [[0, -w], [L, w], [0, w]], [s0, s1, s0]);
      }
    },
    // a sagging cord through n segments; returns the points
    cord(a, b2, sag, n = 6, w = 0.3, sw = 0) {
      const pts = [];
      for (let i = 0; i <= n; i++) { const f = i / n, k = 4 * f * (1 - f); pts.push([lerp(a[0], b2[0], f), lerp(a[1], b2[1], f) - sag * k, lerp(a[2], b2[2], f), k]); }
      for (let i = 0; i < n; i++) b.line(pts[i], pts[i + 1], w, [sw * pts[i][3], sw * pts[i + 1][3]]);
      return pts;
    },
    get count() { return P.length / 9; },
    geo() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aEdge', new THREE.Float32BufferAttribute(E, 3));
      g.setAttribute('aCell', new THREE.Float32BufferAttribute(CL, 4));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
      g.setAttribute('aSway', new THREE.Float32BufferAttribute(SW, 1));
      return g;
    },
  };
  return b;
}

// outline of a ruyi head (the storm's own motif) as rim points, for leaf clumps and cloud-shaped cells
function ruyiRim(n = 14) {
  const sdf = (x, y) => Math.min(Math.hypot(x, y - 0.40) - 0.52, Math.hypot(Math.abs(x) - 0.52, y + 0.02) - 0.43, Math.hypot(x, y + 0.42) - 0.5);
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = -i / n * TAU, dx = Math.sin(a), dy = Math.cos(a);
    let r = 1.6; while (r > 0.05 && sdf(dx * r, dy * r) > 0) r -= 0.02;
    out.push([dx * r, dy * r]);
  }
  return out;
}
const RIM = ruyiRim(14);

// the sea's swell, as in the enamel vertex shader (VMODE 4)
function swellAt(x, z, t, amp) {
  const a = amp * lerp(0.12, 1, smoothstep(MOUTH_Z - 45, MOUTH_Z + 30, z));
  return a * (0.55 * Math.sin(z * 0.105 + t) + 0.3 * Math.sin((z * 0.95 - x * 0.3) * 0.19 + t * 1.35 + 1.7) + 0.12 * Math.sin((z * 0.9 + x * 0.44) * 0.41 + t * 2 + 4.1));
}

const LOOKS = {
  storm: { title: 'The Gold-Wire Harbour', pal: ['#17A3A8', '#1C3F94', '#8C1D18', '#F4EFE0', '#E9B949', '#0C1A3A', '#C4502F'], exposure: 1.0, bloom: 0.38, lamp: 3.2, portal: '#ffb840' },
  night: { title: 'The Gold-Wire Harbour by Lantern', pal: ['#11566A', '#17327A', '#8C1D18', '#8FA2C8', '#E9B949', '#060D24', '#8A3B28'], exposure: 1.22, bloom: 0.55, lamp: 5.5, portal: '#ffbe55' },
  dawn: { title: 'The Blue-and-White Harbour', pal: ['#3F74C8', '#1C3F94', '#8C1D18', '#F4EFE0', '#E9B949', '#0C1A3A', '#C4502F'], exposure: 0.96, bloom: 0.34, lamp: 2.6, portal: '#ffb347' },
};

export default {
  id: 'cloisonne-typhoon',
  name: 'The Gold-Wire Harbour',
  category: 'city',
  weirdness: 0.35,
  media: ['water', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {}, vr = rng.fork('ct-variant');
    const detail = ctx.quality?.detail ?? 1, dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const many = (n) => Math.max(1, Math.round(n * detail * dens));
    // ---- the looks: hour, weather, season, cast ----
    const hourPick = vr.pick(['storm', 'storm', 'night', 'dawn']);
    const hour = vary.hour === 'night' ? 'night' : vary.hour === 'dawn' ? 'dawn' : (vary.hour === 'day' || vary.hour === 'golden') ? 'storm' : hourPick;
    const look = LOOKS[hour], night = hour === 'night', dawn = hour === 'dawn';
    const raining = vr.chance(0.3), season = vr.pick(['plain', 'plain', 'newyear', 'laver']), sailPick = vr.pick(['ox', 'ox', 'white', 'turq']);
    const sailCast = dawn && sailPick === 'white' ? 'ox' : sailPick;      // on the white ground of dawn the sails are never white: the red is the picture's accent
    const rafts = vr.chance(0.3), rare = !!vary.rare;
    const hueShift = vr.range(-0.018, 0.018);
    const eye = !raining && vr.chance(0.22);          // weather: the eye, a pale still ring of sky inside the scroll wall
    const xr = vr.fork('ct-extra');                   // later additions draw from here, so the older layout keeps its numbers
    const zr = vr.fork('ct-fix4');                    // and the newest ones from here (drawn after everything else of vr)
    const wr = vr.fork('ct-fix5');                    // (and the round after that)
    const palHex = look.pal.map((h, i) => { const c = new THREE.Color(h); if (i === 0) c.offsetHSL(hueShift, 0, 0); return '#' + c.getHexString(); });
    const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
    const mul = (c, m) => [c[0] * m, c[1] * m, c[2] * m];
    const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
    const [T, L, R, W0, G, NV, BR] = palHex.map(lin);
    const W = mul(W0, 0.8), CEL = mul(mix(T, W0, 0.5), 0.9);
    const GREEN = mix(mul(T, 0.72), mul(G, 0.55), night ? 0.1 : 0.24), GREEN2 = mix(mul(T, 0.9), mul(G, 0.7), 0.42), WOOD = mul(mix(G, R, 0.45), 0.5), STRAW = mul(mix(G, W0, 0.45), 0.72);
    const STONE = night ? mul(mix(W, L, 0.35), 0.8) : mul(mix(W, CEL, 0.35), 0.86), STONE2 = mul(mix(STONE, L, 0.3), 0.8);
    const jit = (c, r, a = 0.12) => mul(c, 1 + r.range(-a, a));

    // ---- path: an even left-hand arc from the open sea to the mouth, a soft S up the basin, due north to the bridge ----
    const pts = [];
    {
      const R0 = 225, th0 = 12 * Math.PI / 180, cx = -150 - R0 * Math.sin(th0), cz = 62 - R0 * Math.cos(th0);
      for (let i = 0; i <= 5; i++) { const th = th0 + (60 - 12) * Math.PI / 180 * i / 5; pts.push([cx + R0 * Math.sin(th), EYE, cz + R0 * Math.cos(th)]); }
      pts.push([20, EYE, -110], [8, EYE, -175], [0, EYE, -240], [0, 3.8, -265], [0, 5.2, -288], [0, 6.2, -308], [0, PORTAL_Y, BRIDGE_Z]);
    }
    const path = makePath(pts), PL = path.length;
    const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpC = new THREE.Vector3();
    // a point beside the path: d metres along, lat metres to the right
    const beside = (d, lat, out) => {
      path.posAtDist(d, tmpA); path.tangentAtDist(d, tmpB);
      const l = Math.hypot(tmpB.x, tmpB.z) || 1;
      return out.set(tmpA.x - tmpB.z / l * lat, 0, tmpA.z + tmpB.x / l * lat);
    };

    const scene = new THREE.Scene();
    let skyTop = night ? lin('#070D26') : dawn ? [0.80, 0.73, 0.57] : mul(T, 0.93);
    let skyHor = night ? mul(L, 0.62) : dawn ? [0.84, 0.80, 0.70] : mul(mix(T, W0, 0.58), 0.9);
    if (eye) { skyTop = mix(skyTop, night ? mul(L, 0.9) : mul(W0, 0.86), 0.42); skyHor = mix(skyHor, night ? mul(L, 1.1) : mul(W0, 0.9), 0.3); }
    scene.background = new THREE.Color(skyHor[0], skyHor[1], skyHor[2]);

    // ---- the hero: the storm front, seated as its header asks; the world flies its own fleet ----
    const sun = new THREE.Vector3(-0.879, 0.309, 0.364).normalize();
    const hero = await buildHero(ctx, { palette: palHex, fleet: false, sun, advance: 300, fogAmount: 0, armEnd: -0.5, armHeight: 0.42 });
    hero.object.position.set(1530, 0, 330); hero.object.rotation.y = Math.atan2(-1680, -268);
    hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    const en = hero.enamel, U = en.uniforms;
    const off4 = () => ({ value: new THREE.Vector4(1, 0, 0, 0) });
    hero.object.traverse((o) => { const u = o.material?.uniforms; if (u && u.uFront) { u.uFront = off4(); u.uShaft = off4(); } });   // the storm does not flood or take the shaft
    const hubW = hero.anchors.hub.clone().applyMatrix4(hero.object.matrixWorld);
    const paleTone = night ? mul(L, 0.55) : dawn ? mul(W0, 0.84) : mul(mix(T, W0, 0.62), 0.9);
    const uPale = { value: new THREE.Vector4(paleTone[0], paleTone[1], paleTone[2], 620) };
    const emat = (o) => { const m = en.material(o); m.uniforms.uPale = uPale; return m; };
    U.uSea.value.set(eye ? 0.4 : night ? 0.9 : 1.05, MOUTH_Z, 0.12, 0);
    // at dawn the dark front floods to cobalt, and cell by cell: a cell goes blue or stays white (porcelain)
    if (dawn) { const cb = lin('#2F5FC0'); U.uFlood.value.set(cb[0] * 0.95, cb[1] * 0.95, cb[2] * 0.95, 0.6); U.uFloodB.value.set(0.12, 0.95, 1, 0); }
    await ctx.yield();

    // ---- sky: an enamel ground in four flat tones, packed with small wire scrolls that drift west ----
    let skyMesh, skyMat;
    {
      const pos = [], col = [], uv = [], nrm = [], seg = 48, bands = [[-9, 5], [5, 15], [15, 34], [34, 90]];
      const dir = (e, a) => [Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)];
      bands.forEach(([e0, e1], bi) => {
        const c = mix(skyHor, skyTop, [0.12, 0.5, 0.82, 1][bi]), nr = bi === 3 ? 6 : 2;
        for (let r = 0; r < nr; r++) for (let j = 0; j < seg; j++) {
          const ea = lerp(e0, e1, r / nr) * Math.PI / 180, eb = lerp(e0, e1, (r + 1) / nr) * Math.PI / 180, a0 = j / seg * TAU, a1 = (j + 1) / seg * TAU;
          const A = dir(ea, a0), B = dir(ea, a1), Cc = dir(eb, a1), D = dir(eb, a0);
          for (const p of [A, D, Cc, A, Cc, B]) {
            pos.push(p[0] * 7000, p[1] * 7000, p[2] * 7000); col.push(c[0], c[1], c[2]); nrm.push(0, 1, 0);
            uv.push(p[0] / (1 + p[1]) * 1000, p[2] / (1 + p[1]) * 1000);
          }
        }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      skyMat = en.material({ pattern: 'filler', patScale: 78, wire: 1.5, spec: 2.5, side: THREE.FrontSide });
      skyMat.uniforms.uFront = off4(); skyMat.uniforms.uShaft = off4(); skyMat.depthWrite = false;
      if (dawn) skyMat.uniforms.uGold = { value: new THREE.Vector3(L[0] * 1.5, L[1] * 1.5, L[2] * 1.6) };          // blue wire on a white ground
      if (night) skyMat.uniforms.uGold = { value: new THREE.Vector3(G[0] * 0.55, G[1] * 0.55, G[2] * 0.6) };
      skyMesh = new THREE.Mesh(g, skyMat); skyMesh.renderOrder = -1; skyMesh.frustumCulled = false; scene.add(skyMesh);
    }

    // ---- weather 'the eye': the scroll wall stands all round the horizon, a ring of ruyi heads that follows the camera ----
    let eyeRing = null;
    if (eye) {
      const seg = 24, RR = 5200, kU = 0.2, pos = [], uv = [], col = [], nr = [], idx = [];
      for (let q = 0; q < 4; q++) for (let j = 0; j <= seg; j++) {
        const a = (q + j / seg) * Math.PI / 2 + 0.6, v0 = pos.length / 3;
        for (let r = 0; r < 2; r++) { pos.push(Math.sin(a) * RR, r ? 1090 : -60, Math.cos(a) * RR); uv.push(-1150 + j / seg * Math.PI / 2 * RR * kU, r * 1150 * kU); col.push(1, 1, 1); nr.push(-Math.sin(a), 0, -Math.cos(a)); }
        if (j < seg) idx.push(v0, v0 + 2, v0 + 3, v0, v0 + 3, v0 + 1);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nr, 3));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const m = en.material({ pattern: 'ruyi', wire: 0.5, spec: 3, lay: [36, 190, -20, -4.5] });
      m.uniforms.uFront = off4(); m.uniforms.uShaft = off4(); m.uniforms.uDrift = { value: 0 }; m.depthWrite = false;
      eyeRing = new THREE.Mesh(g, m); eyeRing.renderOrder = -0.5; eyeRing.frustumCulled = false; scene.add(eyeRing);
    }

    // ---- sea: one radial grid that follows the camera; swell in the vertex shader, scale-arcs marching north ----
    let seaMesh, seaMat;
    {
      const seg = 96, rings = Math.round(80 * (detail < 1 ? 0.85 : 1)), pos = [0, 0, 0], idx = [];
      for (let i = 1; i <= rings; i++) { const r = 1.5 * i * Math.pow(1.052, i * 80 / rings); for (let j = 0; j < seg; j++) { const a = j / seg * TAU; pos.push(Math.sin(a) * r, 0, Math.cos(a) * r); } }
      for (let j = 0; j < seg; j++) idx.push(0, 1 + j, 1 + (j + 1) % seg);
      for (let i = 0; i < rings - 1; i++) for (let j = 0; j < seg; j++) {
        const a = 1 + i * seg + j, b = 1 + i * seg + (j + 1) % seg, c = a + seg, d = b + seg;
        idx.push(a, c, d, a, d, b);
      }
      const n = pos.length / 3, seaC = night ? mul(mix(T, L, 0.45), 0.55) : dawn ? mul(mix(W0, T, 0.34), 0.8) : mul(T, 0.84);
      const col = new Float32Array(n * 3), nr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { col[i * 3] = seaC[0]; col[i * 3 + 1] = seaC[1]; col[i * 3 + 2] = seaC[2]; nr[i * 3 + 1] = 1; }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nr, 3));
      g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
      g.setIndex(idx);
      seaMat = emat({ pattern: 'scales', vmode: 4, patScale: eye ? 10 : 6.5, wire: 0.1, foam: night ? 0.08 : 0.15, spec: 5, side: THREE.FrontSide });
      seaMesh = new THREE.Mesh(g, seaMat); seaMesh.frustumCulled = false; scene.add(seaMesh);
    }
    await ctx.yield();

    // ---- the lie of the land ----
    const halfW = (z) => (z > BRIDGE_Z ? lerp(130, 90, clamp((MOUTH_Z - z) / 275, 0, 1)) : z > -625 ? lerp(90, 62, (BRIDGE_Z - z) / 300) : lerp(62, -30, clamp((-625 - z) / 110, 0, 1)));
    const coastZ = (x) => MOUTH_Z - 0.22 * Math.max(0, Math.abs(x) - 190) + 16 * noise.n2(x * 0.006, 3.3) * smoothstep(140, 260, Math.abs(x));
    const inland = (x, z) => Math.min(Math.abs(x) - halfW(z), coastZ(x) - z);
    const groundH = (x, z) => {
      const d = inland(x, z);
      if (d < 28) return Math.max(-4, Math.min(2.15, (d - 20) * 0.4));
      const hill = smoothstep(88, 340, d) * (44 + 84 * (0.5 + 0.5 * noise.fbm2(x * 0.0032 + 7, z * 0.0032, 3)));
      return 2.15 + smoothstep(28, 40, d) * 4.3 + smoothstep(60, 72, d) * 4.5 + hill;
    };
    const QY = 2.25;                                  // quay level
    const st = makeCells(), wl = makeCells(), rf = makeCells(), pr = makeCells(), sw = makeCells(), nt = makeCells(), ln = makeCells();
    const lanterns = [];                              // [x, y, z, size, litFrom, swing]
    const sr = rng.fork('ct-stone');

    // terrain: one smooth grid, drawn as contour bands
    {
      const x0 = -736, z0 = -888, step = 16, nx = 92, nz = 54, pos = [], col = [], nr = [], idx = [];
      const low = mix(STONE, GREEN, 0.45), top = mix(GREEN2, CEL, 0.35);
      for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
        const x = x0 + i * step, z = z0 + j * step, h = groundH(x, z);
        const hx = groundH(x + 3, z) - groundH(x - 3, z), hz = groundH(x, z + 3) - groundH(x, z - 3), l = Math.hypot(hx, 6, hz);
        pos.push(x, h, z); nr.push(-hx / l, 6 / l, -hz / l);
        const k = smoothstep(11, 30, h), c = mix(mix(low, GREEN, k), top, smoothstep(55, 120, h) * (0.6 + 0.4 * noise.n2(x * 0.01, z * 0.01)));
        col.push(c[0], c[1], c[2]);
      }
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, d, a, d, b); }
      // far islands in the west gap and the south, so the open sea has a horizon with shapes on it
      const isl = rng.fork('ct-isles');
      for (const [ix, iz, ir, ih] of [[-1500, -380, 300, 190], [-1750, 420, 240, 120], [-1150, 900, 200, 90], [-2300, -900, 420, 260], [-300, 1700, 260, 110]]) {
        const v0 = pos.length / 3, seg = 14, rr = ir * isl.range(0.85, 1.2), hh = ih * isl.range(0.8, 1.25);
        pos.push(ix, hh, iz); nr.push(0, 1, 0); col.push(GREEN[0], GREEN[1], GREEN[2]);
        for (let r = 1; r <= 3; r++) for (let s = 0; s < seg; s++) {
          const a = s / seg * TAU, f = r / 3, wob = 1 + 0.25 * Math.sin(a * 3 + ix) + 0.15 * Math.sin(a * 5 + iz);
          pos.push(ix + Math.sin(a) * rr * f * wob, hh * (1 - f) * (1 - 0.35 * f) - (r === 3 ? 3 : 0), iz + Math.cos(a) * rr * f * wob * 0.7);
          nr.push(Math.sin(a) * 0.6, 0.8, Math.cos(a) * 0.6); col.push(GREEN[0], GREEN[1], GREEN[2]);
        }
        for (let s = 0; s < seg; s++) idx.push(v0, v0 + 1 + s, v0 + 1 + (s + 1) % seg);
        for (let r = 0; r < 2; r++) for (let s = 0; s < seg; s++) { const a = v0 + 1 + r * seg + s, b = v0 + 1 + r * seg + (s + 1) % seg; idx.push(a, a + seg, b + seg, a, b + seg, b); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nr, 3));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
      const m = new THREE.Mesh(g, emat({ pattern: 'contour', coords: 'worldXZ', patScale: 9, wire: 0.3, spec: 3 })); m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // a swept roof (four concave faces, corners lifted) into the tile builder; returns nothing
    const sweptRoof = (cx, y, cz, w, d, rise, o = {}) => {
      const ov = o.overhang ?? 1.2, lift = o.lift ?? 0.9, top = o.top ?? 0.5, nu = o.nu ?? 6, nv = o.nv ?? 3, col = o.col || T, ry = o.ry ?? 0;
      for (let f = 0; f < 4; f++) {
        const fw = f % 2 ? d : w, fd = f % 2 ? w : d;
        rf.at(cx, y, cz, ry + f * Math.PI / 2);
        const pt = (s, t) => { const hw = lerp(fw / 2 + ov, fw / 2 * top, t); return [s * hw, rise * Math.pow(t, 1.5) + lift * (1 - t) * (1 - t) * s * s, lerp(fd / 2 + ov, fd / 2 * top, t)]; };
        const sl = Math.hypot(rise, fd / 2 * (1 - top) + ov);
        for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
          const s0 = -1 + 2 * i / nu, s1 = -1 + 2 * (i + 1) / nu, t0 = j / nv, t1 = (j + 1) / nv;
          const A = pt(s0, t0), B = pt(s1, t0), Cc = pt(s1, t1), D = pt(s0, t1);
          const mask = (j === 0 ? 1 : 0) | (i === nu - 1 ? 2 : 0) | (j === nv - 1 ? 4 : 0) | (i === 0 ? 8 : 0);
          rf.quad(A, B, Cc, D, (i + j + f) % 3 ? col : mul(col, 0.86), { mask, uv: [[A[0], t0 * sl], [B[0], t0 * sl], [Cc[0], t1 * sl], [D[0], t1 * sl]] });
        }
      }
      rf.at();
    };

    // ---- stone: quay aprons and walls, landings, breakwater, spit ----
    for (const s of [-1, 1]) {
      for (let z = MOUTH_Z; z > -430; z -= 11) {
        const za = z, zb = Math.max(z - 11, -430), xa = halfW(za) - 0.6, xb = halfW(zb) - 0.6;
        if (zb < BRIDGE_Z + 4 && za > BRIDGE_Z - 4) continue;
        const cuts = [0, 7, 18, 31];
        for (let k = 0; k < 3; k++) {
          const c = jit(k === 0 ? STONE2 : STONE, sr, 0.1);
          const A = [s * (xa + cuts[k]), QY, za], B = [s * (xa + cuts[k + 1]), QY, za], Cc = [s * (xb + cuts[k + 1]), QY, zb], D = [s * (xb + cuts[k]), QY, zb];
          if (s > 0) st.quad(A, B, Cc, D, c); else st.quad(A, D, Cc, B, c);
        }
        const wc = jit(mul(STONE2, 0.82), sr, 0.08), A = [s * xa, -1.4, za], B = [s * xb, -1.4, zb], Cc = [s * xb, QY, zb], D = [s * xa, QY, za];
        if (s > 0) st.quad(A, B, Cc, D, wc); else st.quad(A, D, Cc, B, wc);
        if (sr.chance(0.2) && z < -70 && (z > -300 || z < -350)) {                     // a stepped landing
          const zm = (za + zb) / 2, xm = (xa + xb) / 2;
          for (let q = 0; q < 4; q++) st.box(s * (xm - 0.8 - q * 1.1), QY - 0.45 - q * 0.5 - 1, zm, 1.2, 2.0, 6, jit(STONE, sr, 0.1));
        }
      }
      // the end of the quay on the sea side, and the pavement behind the bridge heads
      const xe = halfW(MOUTH_Z) - 0.6;
      st.quad([s * xe, -1.4, MOUTH_Z], [s * (xe + 31), -1.4, MOUTH_Z], [s * (xe + 31), QY, MOUTH_Z], [s * xe, QY, MOUTH_Z], mul(STONE2, 0.8));
      const xbr = halfW(BRIDGE_Z) - 0.6;
      st.quad([s * xbr, QY, BRIDGE_Z + 4], [s * (xbr + 31), QY, BRIDGE_Z + 4], [s * (xbr + 31), QY, BRIDGE_Z - 4], [s * xbr, QY, BRIDGE_Z - 4], STONE);
      st.quad([s * xbr, -1.4, BRIDGE_Z + 4], [s * xbr, -1.4, BRIDGE_Z - 4], [s * xbr, QY, BRIDGE_Z - 4], [s * xbr, QY, BRIDGE_Z + 4], mul(STONE2, 0.8));
    }
    const rock = (x, z, r, h, c) => st.prism(x, -1.6, z, r, r * sr.range(0.45, 0.7), h + 1.6, 5, jit(c, sr, 0.14), { rot: sr.range(0, 6), sx: sr.range(0.8, 1.3), sz: sr.range(0.8, 1.3) });
    const surfSpots = [];                             // where the swell breaks: [x, z, toward-sea x, toward-sea z]
    // breakwater: a dressed stone mole from the east quay to its round head under the pagoda light
    for (let x = 128; x > 46; x -= 9) {
      const xa = x, xb = Math.max(x - 9, 46), c = jit(STONE, sr, 0.1), zc = MOUTH_Z;
      st.quad([xa, 2.6, zc + 3.5], [xa, 2.6, zc - 3.5], [xb, 2.6, zc - 3.5], [xb, 2.6, zc + 3.5], c);
      st.quad([xa, -1.5, zc + 7.5], [xa, 2.6, zc + 3.5], [xb, 2.6, zc + 3.5], [xb, -1.5, zc + 7.5], jit(STONE2, sr, 0.1));
      st.quad([xa, 2.6, zc - 3.5], [xa, -1.5, zc - 7], [xb, -1.5, zc - 7], [xb, 2.6, zc - 3.5], jit(STONE2, sr, 0.1));
      for (let q = 0; q < 2; q++) { const rx = sr.range(xb, xa), rz = zc + sr.range(7, 11); rock(rx, rz, sr.range(1.3, 2.4), sr.range(0.8, 2.2), STONE2); if (q === 0) surfSpots.push([rx, rz + 1.5, 0, 1]); }
    }
    st.prism(40, -1.5, MOUTH_Z, 11.5, 9.6, 4.9, 12, STONE, { cap: mul(STONE, 1.06) });
    for (let q = 0; q < 12; q++) {
      const a = -0.6 + q / 11 * 4.0, rx = 40 - Math.cos(a) * 12.6, rz = MOUTH_Z + Math.sin(a) * 12.6;
      if (rx > 44 && Math.abs(rz - MOUTH_Z) < 6) continue;
      rock(rx, rz, sr.range(1.3, 2.3), sr.range(0.6, 1.8), STONE2); if (q % 2 === 0 && rz > MOUTH_Z - 3) surfSpots.push([rx - Math.cos(a) * 1.6, rz + Math.sin(a) * 1.6, -Math.cos(a), Math.sin(a)]);
    }
    // the spit: tumbled rock from the west quay to its tip at (-50, -50)
    for (let x = -128; x < -51; x += 5.5) {
      const k = (x + 128) / 77, zc = MOUTH_Z + Math.sin(x * 0.11) * 2.5;
      rock(x, zc, sr.range(2.6, 4.2) * (1 - 0.25 * k), sr.range(1.4, 3.2) * (1 - 0.3 * k), STONE);
      rock(x + sr.range(-2, 2), zc + sr.range(3.5, 6), sr.range(1.2, 2.4), sr.range(0.5, 1.6), STONE2);
      rock(x + sr.range(-2, 2), zc - sr.range(3.5, 6), sr.range(1.2, 2.2), sr.range(0.4, 1.3), STONE2);
      if (sr.chance(0.6)) surfSpots.push([x, zc + 6.5, 0, 1]);
    }
    surfSpots.push([-48, MOUTH_Z + 3, 0.7, 0.7]);
    // under every burst a standing foam cell in the storm's own ruyi shape (white, wire-rimmed), washing with the swell
    for (const [fx, fz, fdx, fdz] of surfSpots) {
      const sz = xr.range(1.3, 1.9), back = xr.range(0.3, 0.55), cb = Math.cos(back), sb = Math.sin(back);
      sw.at(fx, -0.7, fz, Math.atan2(fdx, fdz) + xr.range(-0.3, 0.3));
      sw.fan([0, sz * 0.8 * cb, -sz * 0.8 * sb], RIM.map((p) => [p[0] * sz, (p[1] + 0.8) * sz * cb, -(p[1] + 0.8) * sz * sb]), mul(W0, 1.02), { sw: [0.04, 0.2] });
      const s2 = sz * 0.6, ox2 = (xr.chance(0.5) ? 1 : -1) * sz * 0.85;
      sw.fan([ox2, s2 * 0.8 * cb, 0.4 - s2 * 0.8 * sb], RIM.map((p) => [ox2 + p[0] * s2, (p[1] + 0.8) * s2 * cb, 0.4 - (p[1] + 0.8) * s2 * sb]), mul(mix(W0, CEL, 0.3), 1.0), { sw: [0.04, 0.16] });
    }
    sw.at();
    // stone oyster posts standing in the shallows either side of the mouth
    for (let q = 0; q < many(26); q++) {
      const west = q % 2 === 0, x = west ? sr.range(-49, -38) : sr.range(26.5, 31), z = MOUTH_Z + sr.range(-34, 26);
      if (path.nearestXZ(x, z).dist < 9) continue;
      st.box(x, sr.range(-0.4, 0.3), z, 0.55, 3.2, 0.55, jit(STONE2, sr, 0.15), { taper: 0.8 });
    }
    await ctx.yield();

    // lanterns light in a wave that runs up the quay ahead of the junk (all lit at night)
    const litAt = (z, r) => (night ? -1 : 0.33 + 0.5 * clamp((MOUTH_Z - z) / 275, -0.2, 1) + r.range(-0.035, 0.035));

    // ---- the bridge: stone beams on 26 boat-shaped piers, stepping up on corbels to the central span ----
    {
      const BZ = BRIDGE_Z, pierX = (k) => 10 + 12.5 * k, deckH = (k) => [16, 13, 10.2, 8.2][k] ?? 7;
      const slab = (xa, Ha, xb, Hb) => {
        const c = jit(STONE, sr, 0.08), c2 = jit(STONE2, sr, 0.08);
        st.quad([xa, Ha, BZ + 3.2], [xb, Hb, BZ + 3.2], [xb, Hb, BZ - 3.2], [xa, Ha, BZ - 3.2], c);
        st.quad([xa, Ha - 1.1, BZ + 3.2], [xa, Ha - 1.1, BZ - 3.2], [xb, Hb - 1.1, BZ - 3.2], [xb, Hb - 1.1, BZ + 3.2], mul(c2, 0.8));
        for (const sz of [1, -1]) {
          st.quad([xa, Ha - 1.1, BZ + 3.2 * sz], [xb, Hb - 1.1, BZ + 3.2 * sz], [xb, Hb, BZ + 3.2 * sz], [xa, Ha, BZ + 3.2 * sz], c2);
          st.quad([xa, Ha, BZ + 3.2 * sz], [xb, Hb, BZ + 3.2 * sz], [xb, Hb + 0.95, BZ + 3.2 * sz], [xa, Ha + 0.95, BZ + 3.2 * sz], c);
        }
        const n = Math.abs(xb - xa) > 15 ? 3 : 1;      // the central span: three large lanterns over the portal
        for (let q = 0; q < n; q++) { const f = n === 3 ? 0.25 + 0.25 * q : 0.5; lanterns.push([lerp(xa, xb, f), lerp(Ha, Hb, f) - 1.15, BZ + 3.45, n === 3 ? 1.45 : 0.62, litAt(BZ + 40, sr), n === 3 ? 0.16 : 0.3]); }
      };
      slab(-10, 16, 10, 16);
      for (const s of [-1, 1]) for (let k = 0; k <= 12; k++) {
        const x = s * pierX(k), H = deckH(k), top = H - 1.1, c = jit(STONE, sr, 0.1);
        st.prism(x, -1.6, BZ, 1, 1, top + 0.4, 6, c, { sx: 1.5, sz: 4.6, cap: false });
        st.box(x, top - 0.9, BZ, 3.4, 0.6, 7.4, jit(STONE2, sr, 0.1)); st.box(x, top - 0.3, BZ, 4.6, 0.6, 8.0, c);
        if (k < 12) slab(x, H, s * pierX(k + 1), deckH(k + 1)); else slab(x, H, s * (pierX(k) + 14), QY + 1.2);
        // a stone lion on the balustrade over every pier, and weed swinging at the waterline
        pr.at(x, H + 0.95, BZ + 3.2, s > 0 ? -0.4 : 0.4, 1.5);
        pr.box(0, 0.12, 0, 0.95, 0.24, 1.1, STONE); pr.box(0, 0.5, -0.16, 0.6, 0.56, 0.66, W, { taper: 0.82 });
        pr.prism(0, 0.26, 0.16, 0.25, 0.21, 0.72, 5, mul(W, 0.94));
        pr.fan([0, 1.16, 0.1], RIM.map((p) => [p[0] * 0.5, 1.1 + p[1] * 0.46, 0.1]), CEL);
        pr.prism(0, 0.94, 0.26, 0.27, 0.2, 0.4, 6, W, { cap: mul(W, 1.08) }); pr.box(0, 1.06, 0.52, 0.24, 0.2, 0.2, mul(W, 1.05));
        pr.box(0.2, 0.52, 0.5, 0.13, 0.13, 0.4, W); pr.prism(0.2, 0.24, 0.62, 0.17, 0.1, 0.2, 6, mul(G, 0.8));
        pr.tri([0, 0.3, -0.5], [0.1, 1.0, -0.62], [-0.1, 0.5, -0.5], CEL);
        pr.at();
        if (Math.abs(x) < halfW(BZ)) for (let q = 0; q < 6; q++) sr();      // (keeps the stone's random sequence as it was)
        // the pier's face is broken up: projecting string courses, a carved cutwater with a pointed cap at each
        // end, and dark weed hanging in points at the waterline
        for (const cy of [3, 9]) if (top > cy + 2.2) {
          st.prism(x, cy - 0.3, BZ, 1.02, 1.2, 0.34, 6, jit(STONE2, xr, 0.08), { sx: 1.5, sz: 4.6, cap: false });
          st.prism(x, cy + 0.04, BZ, 1.2, 1.02, 0.22, 6, jit(STONE, xr, 0.08), { sx: 1.5, sz: 4.6, cap: false });
        }
        if (Math.abs(x) < halfW(BZ)) {
          for (const sz of [1, -1]) {
            const cw = Math.min(top - 2.4, 4.6 + (k < 3 ? 1.6 : 0)), cc = jit(STONE2, xr, 0.1);
            st.prism(x, -1.6, BZ + sz * 4.75, 1.15, 0.95, cw + 1.6, 4, cc, { sx: 1, sz: 1.55, cap: false });
            st.prism(x, cw, BZ + sz * 4.75, 1.12, 0.03, 1.5, 4, jit(STONE, xr, 0.08), { sx: 1, sz: 1.55, cap: false });
            st.prism(x, cw - 0.05, BZ + sz * 4.75, 1.05, 1.2, 0.2, 4, mul(STONE2, 0.85), { sx: 1, sz: 1.55, cap: false });
          }
          // weed grows on the stone itself: along every face of the pier and of the two cutwaters
          const weedOn = (ax, az, bx, bz, f) => {
            const px = lerp(ax, bx, f), pz = lerp(az, bz, f), l = Math.hypot(bx - ax, bz - az) || 1, dx = (bx - ax) / l, dz = (bz - az) / l;
            let nx = dz, nz = -dx; if (nx * px + nz * pz < 0) { nx = -nx; nz = -nz; }
            const hw = xr.range(0.4, 0.75), dp = xr.range(0.9, 1.7), ox = x + px + nx * 0.07, oz = BZ + pz + nz * 0.07;
            sw.tri([ox - dx * hw, 0.8, oz - dz * hw], [ox + dx * hw, 0.8, oz + dz * hw], [ox + nx * 0.3 + dx * xr.range(-0.2, 0.2), 0.8 - dp, oz + nz * 0.3], jit(mul(GREEN, 0.35), xr, 0.25), { sw: [0, 0, 0.2] });
          };
          for (let e = 0; e < 6; e++) {
            const a0 = e / 6 * TAU, a1 = (e + 1) / 6 * TAU;
            for (const f of [0.3, 0.72]) weedOn(Math.sin(a0) * 1.5, Math.cos(a0) * 4.6, Math.sin(a1) * 1.5, Math.cos(a1) * 4.6, f + xr.range(-0.08, 0.08));
          }
          for (const sz of [1, -1]) for (const sx of [1, -1]) weedOn(0, sz * 6.53, sx * 1.15, sz * 4.75, xr.range(0.35, 0.65));
        }
        if (k === 0) {                                // a lantern on a bracket on the inner face of each central pier
          pr.box(x - s * 1.75, 9.6, BZ + 2.0, 1.0, 0.14, 0.14, WOOD);
          lanterns.push([x - s * 2.15, 9.5, BZ + 2.0, 0.95, litAt(BZ + 30, xr), 0.24]);
        }
        if (k === 0) {                                // a stone pagoda finial on each of the two central piers
          for (let t = 0; t < 3; t++) {
            st.prism(x + s * 1.9, 16.95 + t * 1.55, BZ, 0.85 - 0.16 * t, 0.75 - 0.16 * t, 1.15, 6, STONE);
            st.prism(x + s * 1.9, 18.1 + t * 1.55, BZ, 1.5 - 0.22 * t, 0.55 - 0.1 * t, 0.42, 6, STONE2);
          }
          st.prism(x + s * 1.9, 21.6, BZ, 0.22, 0.02, 1.4, 5, mul(G, 0.8), { cap: false });
        }
      }
      // the small pavilion over the central span
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) pr.box(sx * 4.0, 18.6, BZ + sz * 2.2, 0.42, 3.4, 0.42, mul(L, 1.1));
      pr.box(0, 20.45, BZ, 9.0, 0.3, 5.2, WOOD);
      sweptRoof(0, 20.5, BZ, 8.6, 4.8, 2.5, { overhang: 1.5, lift: 1.1, top: 0.1, col: T });
      pr.prism(0, 22.9, BZ, 0.5, 0.05, 1.3, 6, G, { cap: false });
      // the finish in colour: an oxblood banner with a gold roundel down the south face of each of the four central
      // piers, swaying, and an enamel roundel (lapis and turquoise cells, oxblood studs) set round the portal
      for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
        const x = s * pierX(k), yt = deckH(k) - 1.75, len = k === 0 ? 6.4 : 4.3, bw = 1.15, z = BZ + 5.75, sway = (y) => 0.02 + 0.11 * (yt - y) / len;
        pr.box(x, yt + 0.08, z, 2.7, 0.12, 0.12, mul(G, 0.9));
        for (const e of [-1, 1]) pr.box(x + e * 1.2, yt + 0.08, BZ + 4.85, 0.1, 0.1, 1.8, WOOD);
        const row = (ya, yb, c, wa = bw, wb = bw) => sw.quad([x - wa, ya, z], [x - wb, yb, z], [x + wb, yb, z], [x + wa, ya, z], c, { sw: [sway(ya), sway(yb), sway(yb), sway(ya)] });
        row(yt, yt - 0.45, mul(L, 1.25)); row(yt - 0.45, yt - len * 0.52, mul(R, 1.55)); row(yt - len * 0.52, yt - len * 0.82, mul(R, 1.3));
        for (const e of [-1, 1]) sw.tri([x + e * bw, yt - len * 0.82, z], [x, yt - len * 0.82, z], [x + e * bw * 0.8, yt - len, z], mul(R, 1.55), { sw: [sway(yt - len * 0.82), sway(yt - len * 0.82), sway(yt - len)] });
        const cy = yt - len * 0.3, oct = [0, 1, 2, 3, 4, 5, 6, 7].map((q) => [x + Math.sin(-q / 8 * TAU) * 0.62, cy + Math.cos(q / 8 * TAU) * 0.62, z + 0.04]);
        sw.fan([x, cy, z + 0.04], oct, mul(G, 1.25), { sw: [sway(cy), sway(cy)] });
        sw.fan([x, yt - len * 0.66, z + 0.04], RIM.map((p) => [x + p[0] * 0.5, yt - len * 0.66 + p[1] * 0.5, z + 0.04]), mul(W0, 1.0), { sw: [sway(yt - len * 0.66), sway(yt - len * 0.66)] });
      }
      {
        const nR = 24, zr0 = BZ + 0.35, P = (r, a, dz = 0) => [Math.sin(a) * r, PORTAL_Y + Math.cos(a) * r, zr0 + dz];
        for (let q = 0; q < nR; q++) {
          const a0 = q / nR * TAU, a1 = (q + 1) / nR * TAU, am = (a0 + a1) / 2;
          pr.quad(P(6.42, a0), P(6.42, a1), P(6.82, a1), P(6.82, a0), q % 2 ? mul(W, 1.05) : mul(G, 0.95));
          pr.quad(P(6.82, a0), P(6.82, a1), P(7.42, a1), P(7.42, a0), q % 2 ? mul(L, 1.2) : T);
          if (q % 2 === 0) pr.quad(P(6.92, am, 0.05), P(7.12, am + 0.035, 0.05), P(7.32, am, 0.05), P(7.12, am - 0.035, 0.05), mul(R, 1.7));
        }
      }
    }

    await ctx.yield();

    // ---- the pagoda light on the breakwater head: seven tiers of white and oxblood under turquoise roofs ----
    const lampY = { y: 0 };
    {
      const px = 40, pz = MOUTH_Z; let y = 3.4, tw = 9.4;
      for (let i = 0; i < 7; i++) {
        const wh = 3.5 * Math.pow(0.95, i), rise = 2.0 * Math.pow(0.95, i), wc = i % 2 ? mul(R, 1.15) : W;
        pr.box(px, y + wh / 2, pz, tw, wh, tw, wc, { top: false });
        pr.box(px, y + 0.18, pz, tw + 1.5, 0.36, tw + 1.5, WOOD);
        for (let f = 0; f < 4; f++) {                 // a dark doorway with a gold lintel on every face
          pr.at(px, y, pz, f * Math.PI / 2);
          const dw = tw * 0.17;
          pr.quad([-dw, 0.4, tw / 2 + 0.05], [dw, 0.4, tw / 2 + 0.05], [dw, wh * 0.72, tw / 2 + 0.05], [-dw, wh * 0.72, tw / 2 + 0.05], i === 6 ? mul(G, 1.4) : NV);
          pr.box(0, wh * 0.72 + 0.14, tw / 2 + 0.1, dw * 2.5, 0.28, 0.2, mul(G, 0.8));
          for (const sx of [-1, 1]) pr.box(sx * (tw / 2 + 0.55), 0.85, tw / 2 + 0.55, 0.16, 1.0, 0.16, WOOD);
        }
        pr.at();
        const ov = 1.3 + tw * 0.12, lift = 0.7 + tw * 0.07;
        sweptRoof(px, y + wh, pz, tw, tw, rise, { overhang: ov, lift, top: i === 6 ? 0.06 : 0.66, col: i % 2 ? mul(T, 0.9) : T });
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {             // a bell on every eave corner
          const bx = px + sx * (tw / 2 + ov - 0.15), bz = pz + sz * (tw / 2 + ov - 0.15), by = y + wh + lift - 0.1;
          sw.tri([bx - 0.28, by - 0.75, bz], [bx + 0.28, by - 0.75, bz], [bx, by, bz], mul(G, 1.3), { sw: [0.14, 0.14, 0] });
          sw.tri([bx, by - 0.75, bz - 0.28], [bx, by - 0.75, bz + 0.28], [bx, by, bz], mul(G, 1.1), { sw: [0.14, 0.14, 0] });
        }
        if (i === 6) lampY.y = y + wh * 0.5;
        y += wh + rise * 0.72; tw *= 0.87;
      }
      const prof = [0.5, 0.2, 0.75, 0.2, 0.6, 0.18, 0.42, 0.14, 0.05];
      for (let q = 0; q < prof.length - 1; q++) pr.prism(px, y + 0.4 + q * 0.75, pz, prof[q], prof[q + 1], 0.75, 6, mul(G, q % 2 ? 0.8 : 1.1), { cap: false });
      st.box(px, 3.1, pz + 6.4, 4, 0.6, 2.4, STONE); st.box(px, 2.8, pz + 8.0, 4, 0.5, 1.6, STONE2);
    }
    await ctx.yield();

    // ---- the town: red-brick houses with swallowtail ridges, in three rows up both sides of the basin ----
    const hr = rng.fork('ct-town');
    const house = (x, y0, z, ry, r, big) => {
      const w = r.range(11, 15.5), d = r.range(7.5, 10), two = big || r.chance(0.28), h = two ? r.range(8.2, 9.4) : r.range(5.2, 6.6), rise = r.range(2.7, 3.5);
      const brick = jit(BR, r, 0.16), shell = jit(mix(W, STONE, 0.4), r, 0.08), roofC = jit(r.chance(0.25) ? mix(T, L, 0.3) : T, r, 0.12), hw = w / 2, hd = d / 2;
      wl.at(x, y0, z, ry); rf.at(x, y0, z, ry); pr.at(x, y0, z, ry); sw.at(x, y0, z, ry); ln.at(x, y0, z, ry);
      const corners = [[-hw, hd], [hw, hd], [hw, -hd], [-hw, -hd]];
      for (let f = 0; f < 4; f++) {
        const [ax, az] = corners[f], [bx, bz] = corners[(f + 1) % 4];
        wl.quad([ax, -2.6, az], [bx, -2.6, bz], [bx, 1.4, bz], [ax, 1.4, az], shell);
        wl.quad([ax, 1.4, az], [bx, 1.4, bz], [bx, h, bz], [ax, h, az], f % 2 ? mul(brick, 0.9) : brick);
      }
      for (const sx of [-1, 1]) wl.tri([sx * hw, h, hd], [sx * hw, h, -hd], [sx * hw, h + rise, 0], mul(brick, 0.9));
      const ey = h - 0.4, ez = hd + 1.0, ex = hw + 0.5, ry2 = h + rise;
      rf.quad([-ex, ey, ez], [ex, ey, ez], [ex, ry2, 0], [-ex, ry2, 0], roofC);
      rf.quad([ex, ey, -ez], [-ex, ey, -ez], [-ex, ry2, 0], [ex, ry2, 0], mul(roofC, 0.9));
      // swallowtail ridge: a white strip that sweeps up to forked points
      const rx = hw + 1.3, rdg = (s) => ry2 + 0.2 + 1.35 * Math.pow(Math.abs(s), 2.4), nR = 6;
      for (let i = 0; i < nR; i++) {
        const s0 = -1 + 2 * i / nR, s1 = -1 + 2 * (i + 1) / nR;
        pr.quad([s0 * rx, rdg(s0) - 0.5, 0], [s1 * rx, rdg(s1) - 0.5, 0], [s1 * rx, rdg(s1), 0], [s0 * rx, rdg(s0), 0], W, { mask: 5 | (i === 0 ? 8 : 0) | (i === nR - 1 ? 2 : 0) });
      }
      for (const sx of [-1, 1]) {
        const xe = sx * rx, ye = rdg(1);
        pr.tri([xe, ye, 0], [xe + sx * 1.0, ye + 1.15, 0], [xe, ye - 0.3, 0], W);
        pr.tri([xe, ye - 0.2, 0], [xe + sx * 1.25, ye + 0.35, 0], [xe, ye - 0.5, 0], W);
      }
      // door, lintel, windows with shutters
      const fz = hd + 0.06, dc = r.chance(0.5) ? NV : mul(R, 0.62);
      pr.quad([-0.95, 0, fz], [0.95, 0, fz], [0.95, 2.6, fz], [-0.95, 2.6, fz], dc);
      pr.box(0, 2.78, fz + 0.1, 2.6, 0.32, 0.3, WOOD);
      pr.box(0, -0.12, hd + 0.9, 2.8, 0.3, 1.5, STONE);
      const nWin = two ? 4 : 2;
      for (let q = 0; q < nWin; q++) {
        const wx = (q % 2 ? 1 : -1) * hw * 0.58, wy = q < 2 ? (two ? 5.4 : 2.3) : 1.9, shut = r.chance(0.5) ? 0.75 : 0.35, sc = r.chance(0.5) ? CEL : mul(T, 0.8);
        pr.quad([wx - 0.8, wy, fz], [wx + 0.8, wy, fz], [wx + 0.8, wy + 1.6, fz], [wx - 0.8, wy + 1.6, fz], mul(L, 0.7));
        for (const sx of [-1, 1]) sw.quad([wx + sx * 0.8, wy, fz + 0.05], [wx + sx * 0.02, wy, fz + 0.05], [wx + sx * 0.02, wy + 1.6, fz + 0.05], [wx + sx * 0.8, wy + 1.6, fz + 0.05], mul(sc, 0.6 + shut * 0.5), { sw: sx > 0 ? -1 : -2, cc: [wx + sx * 0.8, wy + 0.8, fz + 0.05] });
      }
      if (two) {                                       // a timber balcony across the upper floor
        pr.box(0, 4.6, hd + 0.75, w * 0.9, 0.22, 1.5, WOOD);
        pr.quad([-w * 0.45, 4.7, hd + 1.5], [w * 0.45, 4.7, hd + 1.5], [w * 0.45, 5.6, hd + 1.5], [-w * 0.45, 5.6, hd + 1.5], mul(WOOD, 1.25));
        for (const sx of [-1, 1]) pr.box(sx * w * 0.44, 2.3, hd + 1.4, 0.2, 4.6, 0.2, WOOD);
      } else if (r.chance(0.6)) {                      // a striped cloth awning over the door
        const aw = 4.2, c1 = r.chance(0.5) ? L : mul(T, 0.7);
        for (let q = 0; q < 4; q++) { const a0 = -aw / 2 + q * aw / 4, a1 = a0 + aw / 4; sw.quad([a0, 3.5, hd + 0.1], [a1, 3.5, hd + 0.1], [a1, 2.7, hd + 2.6], [a0, 2.7, hd + 2.6], q % 2 ? W : c1, { sw: [0, 0, 0.06, 0.06] }); }
        for (const sx of [-1, 1]) pr.box(sx * aw / 2, 1.35, hd + 2.6, 0.14, 2.7, 0.14, WOOD);
      }
      // by the door: a lantern, pots with kumquats, baskets, crates; some laundry on a line
      const wp = (lx, ly, lz) => [x + lx * Math.cos(ry) + lz * Math.sin(ry), y0 + ly, z - lx * Math.sin(ry) + lz * Math.cos(ry)];
      const lp = wp(1.7, 3.3, hd + 0.5); lanterns.push([lp[0], lp[1], lp[2], 0.62, litAt(z, r), 0.22]);
      for (let q = 0; q < 3; q++) {
        const cx = r.range(-hw, hw), cz = hd + r.range(1.2, 3.4), kind = r.int(0, 2);
        if (Math.abs(cx) < 1.4) continue;
        if (kind === 0) { pr.prism(cx, 0, cz, 0.42, 0.55, 0.8, 6, jit(mul(L, 0.9), r, 0.2)); sw.fan([cx, 1.9, cz], RIM.map((p) => [cx + p[0] * 0.95, 1.7 + p[1] * 0.95, cz]), jit(GREEN2, r, 0.15), { sw: 0.05 }); sw.fan([cx, 1.75, cz + 0.05], [[cx - 0.2, 1.6, cz + 0.05], [cx + 0.15, 1.55, cz + 0.05], [cx + 0.25, 1.9, cz + 0.05], [cx - 0.1, 1.95, cz + 0.05]], mul(G, 1.2), { sw: 0.05 }); }
        else if (kind === 1) pr.prism(cx, 0, cz, 0.5, 0.68, 0.7, 7, jit(STRAW, r, 0.15), { cap: r.chance(0.5) ? mul(W, 1.1) : mul(STRAW, 0.7) });
        else pr.box(cx, 0.45, cz, r.range(0.8, 1.3), 0.9, r.range(0.8, 1.2), jit(WOOD, r, 0.2));
      }
      if (r.chance(0.55)) {
        const lx0 = -hw + 0.5, lx1 = lx0 + r.range(5, 7.5), lz = hd + r.range(3.6, 5), cols = [W, CEL, mul(L, 1.2), W, mul(T, 0.9), mul(R, 1.1)];
        pr.box(lx0, 1.6, lz, 0.14, 3.2, 0.14, WOOD); pr.box(lx1, 1.6, lz, 0.14, 3.2, 0.14, WOOD);
        ln.cord([lx0, 3.1, lz], [lx1, 3.1, lz], 0.25, 4, 0.3, 0.05);
        for (let cx = lx0 + 0.5; cx < lx1 - 1; cx += r.range(1.0, 1.5)) {
          const cw = r.range(0.6, 1.0), ch = r.range(0.9, 1.7);
          sw.quad([cx, 2.95, lz], [cx + cw, 2.95, lz], [cx + cw, 2.95 - ch, lz], [cx, 2.95 - ch, lz], jit(r.pick(cols), r, 0.1), { sw: [0, 0, 0.22, 0.22] });
        }
      }
      wl.at(); rf.at(); pr.at(); sw.at(); ln.at();
      return { w, d, h: h + rise };
    };
    let nHouse = 0;
    for (const s of [-1, 1]) for (let row = 0; row < 3; row++) {
      for (let z = -62 - row * 5 - hr.range(0, 6); z > -425; z -= hr.range(17.5, 22)) {
        if (Math.abs(z - BRIDGE_Z) < 24 + row * 4 || hr.chance(0.1)) continue;
        const dIn = [17, 50, 81][row] + hr.range(-1.5, 1.5), x = s * (halfW(z) + dIn), y0 = row === 0 ? QY : groundH(x, z);
        house(x, y0, z, (s < 0 ? 1 : -1) * Math.PI / 2 + hr.range(-0.07, 0.07), hr, false);
        if (++nHouse % 8 === 0) await ctx.yield();
      }
    }
    await ctx.yield();
    // a small temple on the western hill, and its stair
    {
      const tx = -252, tz = -205, ty = groundH(tx, tz) + 0.5;
      st.box(tx, ty - 2.5, tz, 24, 6, 17, STONE);
      pr.box(tx, ty + 3.0, tz, 16, 5, 10, W, { top: false });
      for (let q = 0; q < 6; q++) pr.box(tx + 9.2, ty + 3.0, tz - 5 + q * 2, 0.5, 5, 0.5, mul(R, 1.1));
      sweptRoof(tx, ty + 5.5, tz, 19, 13, 3.2, { overhang: 1.8, lift: 1.4, top: 0.6, col: mul(T, 0.85), ry: 0 });
      pr.box(tx, ty + 9.6, tz, 10.5, 2.0, 6.4, mul(R, 1.1), { top: false });
      sweptRoof(tx, ty + 10.6, tz, 11, 7, 3.4, { overhang: 1.7, lift: 1.5, top: 0.08, col: T });
      lanterns.push([tx + 9.8, ty + 4.4, tz - 2, 1.1, litAt(-120, hr), 0.15], [tx + 9.8, ty + 4.4, tz + 2, 1.1, litAt(-130, hr), 0.15]);
    }
    await ctx.yield();

    // ---- harbour clutter close to the channel: sampans at their poles, nets, fish racks, buoys ----
    const cr = rng.fork('ct-clutter');
    const critters = [], corms = [], ducks = [];      // [x, y, z, heading, speed, range, phase, kind, size, flapRate, flapAmp, colour]
    const pole = (x, z, top, r = 0.11, c = STRAW) => pr.prism(x, -1.2, z, r, r * 0.8, top + 1.2, 4, jit(c, cr, 0.15), { rot: cr.range(0, 1.5), cap: false });
    const sampanGeo = (r, alt) => {
      const b = makeCells(), hullC = jit(alt ? mix(WOOD, L, 0.45) : WOOD, r, 0.15), deckC = jit(STRAW, r, 0.1);
      if (rafts) {                                   // a bamboo raft with an upturned bow and a cormorant perch
        for (let q = 0; q < 7; q++) {
          const x = (q - 3) * 0.33, c = jit(q % 2 ? STRAW : mul(STRAW, 0.82), r, 0.08);
          b.quad([x - 0.15, 0.25, -4.2], [x + 0.15, 0.25, -4.2], [x + 0.15, 0.25, 2.6], [x - 0.15, 0.25, 2.6], c);
          b.quad([x - 0.15, 0.25, 2.6], [x + 0.15, 0.25, 2.6], [x + 0.13, 1.25, 4.5], [x - 0.13, 1.25, 4.5], c);
        }
        b.box(0, 0.36, -1.5, 2.5, 0.12, 0.25, WOOD); b.box(0, 0.36, 1.2, 2.5, 0.12, 0.25, WOOD);
        b.box(0.7, 1.1, -2.6, 0.1, 1.6, 0.1, WOOD); b.box(0.7, 1.9, -2.6, 1.5, 0.1, 0.1, WOOD);
        b.prism(-0.5, 0.3, -0.4, 0.42, 0.55, 0.6, 7, jit(STRAW, r, 0.1), { cap: mul(W, 1.15) });
        b.fan([0.1, 1.55, -2.6], [[-0.1, 1.55, -2.6], [0.1, 1.24, -2.6], [0.3, 1.55, -2.6], [0.1, 1.8, -2.6]], night ? mul(mix(R, G, 0.45), 6) : mul(R, 1.7));
      } else {
        const secs = [[-4.2, 0.55, 0.85], [-2.6, 1.08, 0.55], [0, 1.22, 0.45], [2.4, 1.02, 0.55], [4.3, 0.22, 1.05]];
        for (let i = 0; i < 4; i++) {
          const [za, ba, ga] = secs[i], [zb, bb, gb] = secs[i + 1];
          for (const s of [-1, 1]) {
            b.quad([s * ba, ga, za], [s * bb, gb, zb], [s * bb * 0.45, -0.3, zb], [s * ba * 0.45, -0.3, za], i % 2 ? hullC : mul(hullC, 1.2));
            b.quad([s * ba, ga, za], [s * bb, gb, zb], [s * bb * 0.82, gb + 0.04, zb], [s * ba * 0.82, ga + 0.04, za], mul(W, 0.95), { mask: 5 });
          }
          b.quad([-ba * 0.82, ga - 0.12, za], [ba * 0.82, ga - 0.12, za], [bb * 0.82, gb - 0.12, zb], [-bb * 0.82, gb - 0.12, zb], i % 2 ? deckC : mul(deckC, 0.86));
        }
        b.quad([-0.55, 0.85, -4.2], [0.55, 0.85, -4.2], [0.25, -0.3, -4.2], [-0.25, -0.3, -4.2], mul(hullC, 0.8));
        // the arched mat awning amidships
        const n = 6, z0 = -1.9, z1 = 1.3, mat = jit(alt ? mul(STRAW, 0.8) : STRAW, r, 0.1);
        for (let q = 0; q < n; q++) {
          const a0 = -1.25 + 2.5 * q / n, a1 = -1.25 + 2.5 * (q + 1) / n;
          b.quad([Math.sin(a0) * 1.2, 0.45 + Math.cos(a0) * 1.25, z0], [Math.sin(a1) * 1.2, 0.45 + Math.cos(a1) * 1.25, z0], [Math.sin(a1) * 1.2, 0.45 + Math.cos(a1) * 1.25, z1], [Math.sin(a0) * 1.2, 0.45 + Math.cos(a0) * 1.25, z1], q % 2 ? mat : mul(mat, 0.82));
        }
        b.fan([0, 0.9, z0], [[-1.13, 0.85, z0], [-0.6, 1.5, z0], [0, 1.7, z0], [0.6, 1.5, z0], [1.13, 0.85, z0]], night ? mul(G, 2.2) : mul(NV, 1.6));
        b.fan([0, 1.95, z1 + 0.5], [[-0.2, 1.95, z1 + 0.5], [0, 1.62, z1 + 0.5], [0.2, 1.95, z1 + 0.5], [0, 2.22, z1 + 0.5]], night ? mul(mix(R, G, 0.45), 6) : mul(R, 1.7));
        // a kumquat in a pot on the bow, a basket of fish, the sculling oar
        b.prism(0, 0.55, 2.7, 0.2, 0.28, 0.4, 5, mul(L, 0.9));
        b.fan([0, 1.5, 2.7], RIM.map((p) => [p[0] * 0.6, 1.4 + p[1] * 0.6, 2.7]), GREEN2);
        b.fan([0.05, 1.4, 2.76], [[-0.12, 1.3, 2.76], [0.16, 1.28, 2.76], [0.2, 1.5, 2.76], [-0.08, 1.55, 2.76]], mul(G, 1.25));
        b.prism(-0.35, 0.45, -2.9, 0.3, 0.4, 0.45, 6, jit(STRAW, r, 0.1), { cap: mul(W, 1.15) });
        b.quad([0.5, 1.5, -2.8], [0.62, 1.5, -2.8], [0.95, -0.4, -6.2], [0.7, -0.4, -6.2], WOOD);
        if (season === 'newyear') for (let q = 0; q < 3; q++) b.fan([0, 2.25, z0 + 0.6 + q * 1.0], [[-0.2, 2.25, z0 + 0.6 + q], [0, 1.95, z0 + 0.6 + q], [0.2, 2.25, z0 + 0.6 + q], [0, 2.5, z0 + 0.6 + q]], mul(R, 2.2));
      }
      return b.geo();
    };
    const ISLETS = [[-45, -152, 1], [30, -268, 0.9]];
    // jetties and stone hards that bring the town out to the channel: [x0, x1, z0, z1]
    const HARDS = [[-(halfW(-193) + 1), -36, -201, -185], [40, halfW(-258) + 1, -265, -250], [32, 54, -232, -198], [-54, -32, -266, -232]];
    const offHard = (x, z, m) => { for (const h of HARDS) if (x > h[0] - m && x < h[1] + m && z > h[2] - m && z < h[3] + m) return false; return true; };
    const sampans = [], sampanSpots = [];
    const farFrom = (x, z, list, min) => { for (const p of list) if (Math.hypot(p[0] - x, p[1] - z) < min) return false; return true; };
    // the lane the port companion sails up to her anchorage off the west jetty (update(), kind 1): 28 m to port of our
    // path, from the first nets to path distance 360. What the layout puts in it is still drawn from the same random
    // numbers, in the same order, and then left out (the builders are muted), so nothing else in the harbour moves.
    const lnP = new THREE.Vector3(), lnT = new THREE.Vector3();
    const inLane = (x, z) => {
      const dd = path.nearestXZ(x, z).u * PL; if (dd < 226 || dd > 360) return false;
      path.posAtDist(dd, lnP); path.tangentAtDist(dd, lnT);
      const l = Math.hypot(lnT.x, lnT.z) || 1, lat = ((x - lnP.x) * -lnT.z + (z - lnP.z) * lnT.x) / l;
      return lat < -20 && lat > -36.5;
    };
    const muteAll = (on) => { pr.mute = sw.mute = nt.mute = ln.mute = st.mute = on; };
    for (let i = 0, tries = 0; i < 40 && tries < 400; tries++) {
      const d = cr.range(236, 428), side = cr.chance(0.5) ? 1 : -1, near = cr.chance(0.8), lat = side * (near ? cr.range(8.4, 10.5) : cr.range(14, 24));
      beside(d, lat, tmpC);
      if (!farFrom(tmpC.x, tmpC.z, sampanSpots, near ? 9.5 : 7.5) || !farFrom(tmpC.x, tmpC.z, ISLETS, 15) || !offHard(tmpC.x, tmpC.z, 7)) continue;
      path.tangentAtDist(d, tmpB);
      const yaw = Math.atan2(tmpB.x, tmpB.z) + (cr.chance(0.5) ? Math.PI : 0) + cr.range(-0.3, 0.3);
      const out = inLane(tmpC.x, tmpC.z), sp = { x: tmpC.x, z: tmpC.z, yaw, ph: cr.range(0, 6.28), alt: i % 2 };
      sampanSpots.push([tmpC.x, tmpC.z]); if (!out) sampans.push(sp); i++;
      // its mooring pole (always on the far side from the channel), a lantern on it and the painter
      beside(d + Math.cos(yaw - Math.atan2(tmpB.x, tmpB.z)) * 5.2, lat + side * 1.6, tmpA.copy(tmpC));
      const px = tmpA.x, pz = tmpA.z;
      muteAll(out);
      pole(px, pz, 3.6);
      const lit = litAt(pz, cr); if (!out) lanterns.push([px, 3.55, pz, 0.6, lit, 0.34]);
      ln.cord([px, 1.6, pz], [lerp(px, tmpC.x, 0.72), 0.9, lerp(pz, tmpC.z, 0.72)], 0.35, 3, 0.3, 0.04);
      muteAll(false);
    }
    // six cormorants on taller poles right beside the channel
    for (let q = 0; q < 6; q++) {
      const d = 250 + q * 29 + cr.range(-6, 6), side = q % 2 ? 1 : -1;
      beside(d, side * cr.range(6.9, 7.6), tmpC); pole(tmpC.x, tmpC.z, 4.4, 0.13, WOOD);
      path.tangentAtDist(d, tmpB);
      corms.push([tmpC.x, 4.42, tmpC.z, Math.atan2(tmpB.x, tmpB.z) + (side > 0 ? -1.5 : 1.5) + cr.range(-0.4, 0.4), 0, 1, cr(), 5, 1.35, 0, 0, 0]);
    }
    await ctx.yield();
    // drying nets swagged between bamboo poles, each a diamond lattice of wire
    for (let q = 0, n = many(30); q < n; q++) {
      const d = cr.range(228, 424), side = q % 2 ? 1 : -1, lat = side * cr.range(12.5, 30), yaw = cr.range(0, Math.PI), len = cr.range(6.5, 9.5);
      beside(d, lat, tmpC);
      const ax = tmpC.x - Math.sin(yaw) * len / 2, az = tmpC.z - Math.cos(yaw) * len / 2, bx = tmpC.x + Math.sin(yaw) * len / 2, bz = tmpC.z + Math.cos(yaw) * len / 2;
      if (path.nearestXZ(ax, az).dist < 8.5 || path.nearestXZ(bx, bz).dist < 8.5 || !farFrom(tmpC.x, tmpC.z, sampanSpots, 6.5) || !farFrom(tmpC.x, tmpC.z, ISLETS, 15) || !offHard(tmpC.x, tmpC.z, 6)) continue;
      muteAll(inLane(ax, az) || inLane(bx, bz) || inLane(tmpC.x, tmpC.z));
      const top = cr.range(4.2, 5.4);
      for (const [qx, qz] of [[ax, az], [bx, bz]]) {                                   // tall poles that carry a pennant above the eye line
        const pt = cr.range(7.6, 10.2), pc = cr.chance(0.5) ? mul(R, 1.8) : cr.chance(0.5) ? mul(W, 1.15) : mul(G, 1.1);
        pole(qx, qz, pt, 0.13);
        sw.tri([qx, pt - 0.05, qz], [qx + 0.3, pt - 0.5, qz - 1.9], [qx, pt - 0.95, qz], pc, { sw: [0, 0.42, 0] });
      }
      const NETC = mul(STRAW, 0.55), nu = 4, P = (f, v) => [lerp(ax, bx, f), lerp(top - 0.5 * Math.sin(f * Math.PI), 0.9, v), lerp(az, bz, f)], bel = (f, v) => Math.sin(f * Math.PI) * (0.25 + 0.75 * v) * 0.55;
      for (let i = 0; i < nu; i++) for (let j = 0; j < 2; j++) {
        const f0 = i / nu, f1 = (i + 1) / nu, v0 = j / 2, v1 = (j + 1) / 2;
        nt.quad(P(f0, v0), P(f1, v0), P(f1, v1), P(f0, v1), NETC, { mask: (j === 0 ? 1 : 0) | (i === nu - 1 ? 2 : 0) | (j === 1 ? 4 : 0) | (i === 0 ? 8 : 0), sw: [bel(f0, v0), bel(f1, v0), bel(f1, v1), bel(f0, v1)], uv: [[f0 * len, v0 * 4], [f1 * len, v0 * 4], [f1 * len, v1 * 4], [f0 * len, v1 * 4]] });
      }
      muteAll(false);
    }
    // fish racks: split fish hung on bamboo frames, on stake platforms by the channel and along the quay edge
    const fishRack = (x, y, z, yaw, r) => {
      pr.at(x, y, z, yaw); sw.at(x, y, z, yaw);
      for (const sx of [-1.7, 1.7]) { pr.box(sx, 1.55, -0.5, 0.1, 3.1, 0.1, STRAW, { taper: 0.6 }); pr.box(sx, 1.55, 0.5, 0.1, 3.1, 0.1, STRAW, { taper: 0.6 }); }
      for (const [by, bz] of [[2.9, 0], [2.0, -0.32], [2.0, 0.32]]) pr.box(0, by, bz, 3.9, 0.09, 0.09, STRAW);
      for (const [by, bz] of [[2.86, 0], [1.96, -0.32], [1.96, 0.32]]) for (let fx = -1.45; fx < 1.5; fx += r.range(0.42, 0.6)) {
        const fl = r.range(0.55, 0.8), c = jit(mul(W, 1.12), r, 0.08);
        sw.quad([fx, by, bz], [fx + 0.17, by - fl * 0.45, bz], [fx, by - fl, bz], [fx - 0.17, by - fl * 0.45, bz], c, { sw: [0, 0.05, 0.11, 0.05] });
      }
      pr.at(); sw.at();
    };
    for (let q = 0; q < 24; q++) {
      if (q < 11) {
        const d = 240 + q * 17 + cr.range(-5, 5), side = q % 2 ? -1 : 1; beside(d, side * cr.range(11.5, 19), tmpC);
        if (!farFrom(tmpC.x, tmpC.z, sampanSpots, 5.5) || !farFrom(tmpC.x, tmpC.z, ISLETS, 13) || !offHard(tmpC.x, tmpC.z, 5)) continue;
        path.tangentAtDist(d, tmpB); const yaw = Math.atan2(tmpB.x, tmpB.z) + cr.range(-0.5, 0.5);
        pr.at(tmpC.x, 0, tmpC.z, yaw); pr.box(0, 0.95, 0, 4.4, 0.16, 2.0, jit(WOOD, cr, 0.15));
        for (const sx of [-1.9, 1.9]) for (const sz of [-0.8, 0.8]) pr.box(sx, 0, sz, 0.14, 1.9, 0.14, STRAW);
        pr.at(); fishRack(tmpC.x, 1.03, tmpC.z, yaw, cr);
      } else {
        const s = q % 2 ? 1 : -1, z = cr.range(-70, -300); fishRack(s * (halfW(z) + cr.range(3, 8)), QY, z, cr.range(-0.3, 0.3), cr);
      }
    }
    // laver drying on racks along the quays (the whole quay in the harvest season)
    for (let q = 0, n = season === 'laver' ? many(70) : 16; q < n; q++) {
      const s = q % 2 ? 1 : -1, z = cr.range(-62, -312), x = s * (halfW(z) + cr.range(2.5, 10.5)), c = jit(mix(mul(NV, 1.7), GREEN, 0.3), cr, 0.2);
      pr.at(x, QY, z, s * Math.PI / 2 + cr.range(-0.2, 0.2));
      pr.quad([-1.5, 0.5, 0.8], [1.5, 0.5, 0.8], [1.5, 1.7, -0.5], [-1.5, 1.7, -0.5], c); pr.quad([-1.4, 0.56, 0.73], [0, 0.56, 0.73], [0, 1.64, -0.43], [-1.4, 1.64, -0.43], mul(c, 1.25));
      for (const sx of [-1.5, 1.5]) pr.box(sx, 0.85, -0.5, 0.09, 1.7, 0.09, STRAW);
    }
    pr.at();
    await ctx.yield();
    // ---- the town comes out to the channel: a jetty from each quay and two stone hards beside the fairway, each with
    //      houses, fish racks, pennant posts and a string of lanterns that lights in the same wave as the quay ----
    {
      const jt = hr.fork('ct-jetty');
      const lstring = (a, b, n) => { const p = ln.cord(a, b, Math.hypot(b[0] - a[0], b[2] - a[2]) * 0.07, n + 1, 0.3, 0.04); for (let q = 1; q <= n; q++) lanterns.push([p[q][0], p[q][1] - 0.05, p[q][2], 0.55, litAt(p[q][2], jt), 0.3]); };
      const post = (x, z, h) => {
        pr.box(x, QY + h / 2, z, 0.2, h, 0.2, WOOD); pr.prism(x, QY + h, z, 0.28, 0.02, 0.5, 4, mul(G, 0.9), { cap: false });
        sw.tri([x, QY + h - 0.1, z], [x + 0.3, QY + h - 0.6, z - 2.0], [x, QY + h - 1.1, z], jt.chance(0.6) ? mul(R, 1.8) : mul(W, 1.15), { sw: [0, 0.45, 0] });
        return [x, QY + h - 1.3, z];
      };
      HARDS.forEach(([x0, x1, z0, z1], hi) => {
        const nx = Math.max(1, Math.round((x1 - x0) / 8)), nz = Math.max(1, Math.round((z1 - z0) / 8)), wallC = () => jit(mul(STONE2, 0.82), jt, 0.08);
        for (let i = 0; i < nx; i++) {
          const xa = lerp(x0, x1, i / nx), xb = lerp(x0, x1, (i + 1) / nx);
          for (let j = 0; j < nz; j++) { const za = lerp(z0, z1, j / nz), zb = lerp(z0, z1, (j + 1) / nz); st.quad([xa, QY, zb], [xb, QY, zb], [xb, QY, za], [xa, QY, za], jit((i + j) % 3 ? STONE : STONE2, jt, 0.1)); }
          for (const z of [z0, z1]) st.quad([xa, -1.4, z], [xb, -1.4, z], [xb, QY, z], [xa, QY, z], wallC());
        }
        for (let j = 0; j < nz; j++) { const za = lerp(z0, z1, j / nz), zb = lerp(z0, z1, (j + 1) / nz); for (const x of [x0, x1]) st.quad([x, -1.4, za], [x, -1.4, zb], [x, QY, zb], [x, QY, za], wallC()); }
        const west = x1 < 0, xi = west ? x1 : x0, din = west ? 1 : -1, zc = (z0 + z1) / 2;      // xi: the edge on the fairway
        if (hi < 2) {
          // a jetty: a row of houses facing south down the basin, then an open end with racks and lanterns
          const hz = z0 + 5.3, xs = hi === 0 ? [-98, -81, -64] : [93, 76, 59];
          xs.forEach((hx, q) => house(hx, QY, hz, jt.range(-0.04, 0.04), jt, q === 1));
          const xe = xs[2] + din * 9.5;
          const pa = post(xi - din * 0.9, z1 - 0.9, 7.2), pb = post(xi - din * 0.9, z0 + 0.9, 6.4), pc = post(xe, z1 - 0.9, 6.4);
          lstring(pa, pb, 4); lstring(pc, pa, Math.max(2, Math.round(Math.abs(xi - xe) / 3.2)));
          for (let q = 0, n = Math.floor(Math.abs(xi - xe) / 5.2); q < n; q++) fishRack(xi - din * (3.2 + q * 5.0), QY, zc - 1.5, Math.PI / 2 + jt.range(-0.15, 0.15), jt);
          for (let q = 0; q < 3; q++) st.box(xi + din * (0.7 + q * 1.1), QY - 0.45 - q * 0.5 - 1, zc + 3, 1.2, 2.0, 5, jit(STONE, jt, 0.1));
        } else {
          // a hard: two houses with their doors to the fairway, racks and a lantern string along the edge
          const hx = xi - din * 14;
          [z0 + 8, z1 - 8].forEach((hz, q) => house(hx, QY, hz, din * Math.PI / 2 + jt.range(-0.05, 0.05), jt, q === (hi === 2 ? 0 : 1)));
          const pa = post(xi - din * 0.9, z1 - 0.9, 6.6), pb = post(xi - din * 0.9, zc, 7.4), pc = post(xi - din * 0.9, z0 + 0.9, 6.6);
          lstring(pa, pb, 4); lstring(pb, pc, 4);
          fishRack(xi - din * 2.6, QY, zc + 4.5, jt.range(-0.15, 0.15), jt); fishRack(xi - din * 2.6, QY, zc - 4.5, jt.range(-0.15, 0.15), jt);
          for (let q = 0; q < 3; q++) st.box(xi + din * (0.7 + q * 1.1), QY - 0.45 - q * 0.5 - 1, zc, 1.2, 2.0, 6, jit(STONE, jt, 0.1));
          for (let q = 0; q < 5; q++) rock(lerp(x0, x1, jt()) , z0 - 1.2, jt.range(0.9, 1.5), jt.range(0.3, 0.9), STONE2);
        }
      });
    }
    // fish-trap buoys with red pennants, in a line 8 m off the port bow across the open sea
    for (let d = 26; d < 176; d += cr.range(11, 16)) {
      beside(d, -cr.range(8.2, 9.6), tmpC);
      pr.prism(tmpC.x, -0.3, tmpC.z, 0.4, 0.3, 0.8, 6, jit(STRAW, cr, 0.1)); pr.box(tmpC.x, 1.6, tmpC.z, 0.09, 3.6, 0.09, STRAW);
      sw.tri([tmpC.x, 3.4, tmpC.z], [tmpC.x + 0.25, 2.95, tmpC.z - 1.25], [tmpC.x, 2.6, tmpC.z], mul(R, 1.8), { sw: [0, 0.3, 0] });
    }
    // the marks carry on through the mouth on both hands, 8 to 10 m off (path distance 178 to 236): bamboo withies on
    // floats, the taller ones with a gold pennant and a lantern that lights as we come up to it
    for (const side of [1, -1]) for (let d = side > 0 ? 178 : 186, q = 0; d < (side > 0 ? 238 : 228); d += wr.range(10.5, 13.5), q++) {
      beside(d, side * wr.range(8.4, 9.8), tmpC);
      const tall = (q + (side > 0 ? 0 : 1)) % 2 === 0, h = tall ? wr.range(4.7, 5.5) : 3.4, x = tmpC.x, z = tmpC.z;
      pr.prism(x, -0.3, z, 0.42, 0.3, 0.8, 6, jit(STRAW, wr, 0.1)); pr.box(x, h / 2 - 0.2, z, 0.09, h + 0.2, 0.09, STRAW);
      sw.tri([x, h, z], [x + 0.3, h - 0.5, z - 1.5], [x, h - 0.95, z], tall ? mul(G, 1.2) : mul(R, 1.8), { sw: [0, 0.34, 0] });
      if (tall) { pr.box(x + 0.22, h - 1.25, z, 0.5, 0.06, 0.06, WOOD); lanterns.push([x + 0.42, h - 1.4, z, 0.55, litAt(z, wr) - 0.05, 0.32]); }
    }
    await ctx.yield();

    // ---- flora: banyans of ruyi leaf clumps, trees on the hills, bamboo behind the houses ----
    const fr = rng.fork('ct-flora');
    const clump = (x, y, z, ry, size, c, amp) => { sw.at(x, y, z, ry); sw.fan([0, 0, 0], RIM.map((p) => [p[0] * size, p[1] * size, 0]), c, { sw: [0, amp] }); sw.at(); };
    const leafC = () => (fr.chance(0.18) ? jit(mix(GREEN2, CEL, 0.55), fr, 0.1) : jit(fr.chance(0.5) ? GREEN : GREEN2, fr, 0.14));
    const banyan = (x, y, z, s) => {
      pr.prism(x, y, z, 1.6 * s, 1.0 * s, 5.2 * s, 7, mul(WOOD, 0.8), { cap: false });
      for (let q = 0; q < 5; q++) { const a = q * 1.26 + fr.range(0, 0.6), rr = fr.range(2.2, 4.2) * s; pr.prism(x + Math.sin(a) * rr, y, z + Math.cos(a) * rr, 0.3 * s, 0.22 * s, fr.range(4.5, 6.5) * s, 5, mul(WOOD, 0.7), { cap: false }); }
      for (let q = 0; q < 9; q++) { const a = fr.range(0, TAU), rr = fr.range(3, 7.5) * s, rx = x + Math.sin(a) * rr, rz = z + Math.cos(a) * rr; ln.line([rx, y + 6.5 * s, rz], [rx + 0.3, y + fr.range(1.8, 3.4) * s, rz], 0.3, [0, 0.16]); }
      for (let q = 0; q < 46; q++) {
        const a = fr.range(0, TAU), e = fr.range(-0.2, 1.25), rr = (q < 12 ? 0.55 : 1) * 8.4 * s;
        clump(x + Math.cos(e) * Math.sin(a) * rr, y + (8.2 + Math.sin(e) * 4.6) * s, z + Math.cos(e) * Math.cos(a) * rr, a + fr.range(-0.5, 0.5), fr.range(2.5, 3.7) * s, leafC(), fr.range(0.22, 0.4));
      }
    };
    // two stone mooring islets inside the basin bring a banyan, a shrine and lanterns into the middle distance
    for (const [ix, iz, s] of ISLETS) {
      st.prism(ix, -1.5, iz, 8, 7, 3.6, 11, STONE, { cap: mul(STONE, 1.05) });
      for (let q = 0; q < 7; q++) rock(ix + Math.sin(q * 0.9) * 8.6, iz + Math.cos(q * 0.9) * 8.6, sr.range(0.9, 1.6), sr.range(0.3, 1.0), STONE2);
      banyan(ix + 1.5, 2.1, iz - 1, s);
      const sx = ix - 4.2, sz = iz + 3.4;
      pr.box(sx, 2.9, sz, 1.8, 1.6, 1.5, W); sweptRoof(sx, 3.7, sz, 1.9, 1.6, 0.9, { overhang: 0.5, lift: 0.35, top: 0.1, nu: 2, nv: 2, col: T });
      pr.quad([sx - 0.4, 2.2, sz + 0.78], [sx + 0.4, 2.2, sz + 0.78], [sx + 0.4, 3.3, sz + 0.78], [sx - 0.4, 3.3, sz + 0.78], mul(R, 1.2));
      for (const q of [-1, 1]) { pr.box(sx + q * 2.2, 3.5, sz + 1.6, 0.12, 3.0, 0.12, WOOD); lanterns.push([sx + q * 2.2, 4.9, sz + 1.6, 0.7, litAt(iz, fr), 0.3]); }
    }
    banyan(-(halfW(-296) + 9), QY, -296, 1.05);
    await ctx.yield();
    for (let q = 0, n = many(120); q < n; q++) {
      const x = fr.range(-420, 420), z = fr.range(-560, -70), d = inland(x, z);
      if (d < 94 || d > 330) continue;
      const y = groundH(x, z), s = fr.range(3.6, 6.5), a = fr.range(0, TAU), c = leafC();
      pr.box(x, y + s * 0.4, z, 0.5, s * 0.9, 0.5, mul(WOOD, 0.75), { top: false });
      clump(x, y + s * 1.25, z, a, s, c, 0.16); clump(x, y + s * 1.25, z, a + Math.PI / 2, s, mul(c, 0.88), 0.16);
    }
    for (let q = 0, n = many(26); q < n; q++) {
      const s = q % 2 ? 1 : -1, z = fr.range(-70, -410), x = s * (halfW(z) + fr.range(94, 112)), y = groundH(x, z);
      for (let k = 0; k < 7; k++) {
        const bx = x + fr.range(-2.5, 2.5), bz = z + fr.range(-2.5, 2.5), h = fr.range(9, 14), lx = fr.range(-2.5, 2.5), lz = fr.range(-2.5, 2.5), c = jit(GREEN2, fr, 0.2);
        sw.tri([bx - 0.22, y, bz], [bx + 0.22, y, bz], [bx + lx, y + h, bz + lz], c, { sw: [0, 0, 0.6] });
        sw.tri([bx + lx * 0.6 - 1.6, y + h * 0.62, bz + lz * 0.6], [bx + lx * 0.7, y + h * 0.8, bz + lz * 0.7], [bx + lx * 0.6 + 1.6, y + h * 0.66, bz + lz * 0.6], mul(c, 1.15), { sw: [0.5, 0.35, 0.5] });
      }
    }
    // New Year: strings of lanterns along both quays, down the breakwater and across the bridge
    if (season === 'newyear') {
      const string = (a, b, n, r) => { const p = ln.cord(a, b, Math.hypot(b[0] - a[0], b[2] - a[2]) * 0.06, n + 1, 0.3, 0.04); for (let q = 1; q <= n; q++) lanterns.push([p[q][0], p[q][1] - 0.05, p[q][2], 0.5, litAt(p[q][2], r), 0.3]); };
      for (const s of [-1, 1]) for (let z = -60; z > -306; z -= 24) {
        const xa = s * (halfW(z) + 1.2), xb = s * (halfW(z - 24) + 1.2);
        pr.box(xa, QY + 2.2, z, 0.16, 4.4, 0.16, WOOD); string([xa, QY + 4.3, z], [xb, QY + 4.3, z - 24], 5, fr);
      }
      for (let x = 124; x > 60; x -= 21) { pr.box(x, 4.7, MOUTH_Z, 0.16, 4.2, 0.16, WOOD); string([x, 6.7, MOUTH_Z], [x - 21, x - 21 < 62 ? 9 : 6.7, MOUTH_Z], 5, fr); }
      for (const s of [-1, 1]) string([s * 10, 17.2, BRIDGE_Z + 3.4], [s * 60, 8.2, BRIDGE_Z + 3.4], 9, fr);
    }
    await ctx.yield();

    // ---- bake the builders: seven draws for the whole town and its furniture ----
    const addMesh = (b, m) => { if (!b.count) return null; const mesh = new THREE.Mesh(b.geo(), m); mesh.frustumCulled = false; scene.add(mesh); return mesh; };
    addMesh(st, emat({ pattern: 'brick', edge: true, patScale: 2.3, wire: 0.07, cellSize: 4, spec: 3 }));
    addMesh(wl, emat({ pattern: 'brick', edge: true, patScale: 2.7, wire: 0.07, cellSize: 5, spec: 3 }));
    addMesh(rf, emat({ pattern: 'tile', edge: true, patScale: 1.15, wire: 0.07, cellSize: 4, spec: 5 }));
    await ctx.yield();
    addMesh(pr, emat({ edge: true, wire: 0.05, cellSize: 0.9, spec: 4 }));
    addMesh(sw, emat({ edge: true, sway: true, wire: 0.05, cellSize: 0.9, spec: 4, emissive: 0.05 }));
    addMesh(nt, emat({ pattern: 'net', edge: true, sway: true, patScale: 0.42, wire: 0.035, cellSize: 4 }));
    addMesh(ln, emat({ pattern: 'line', sway: true, wire: 0.05 }));
    await ctx.yield();

    // instanced geometry helper for the enamel shader's own instancing modes (critters, beads, lanterns)
    const instGeo = (cells, iA, iB, iC) => {
      const src = cells.geo(), g = new THREE.InstancedBufferGeometry();
      for (const k in src.attributes) g.setAttribute(k, src.attributes[k]);
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(iA), 4));
      g.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(iB), 4));
      g.setAttribute('iC', new THREE.InstancedBufferAttribute(new Float32Array(iC), 4));
      g.instanceCount = iA.length / 4;
      return g;
    };
    const instMesh = (g, m, order) => { const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; if (order) mesh.renderOrder = order; scene.add(mesh); return mesh; };

    // ---- lanterns: oxblood paper on gold wire, swinging, lit in a wave ----
    {
      const b = makeCells(), half = (y) => 0.5 * Math.sqrt(Math.max(0, 1 - Math.pow((y + 0.72) / 0.54, 2)));
      const cA = mul(mix(R, G, 0.2), 1.5), cB = mul(mix(R, G, 0.45), 1.9), rows = 4;
      b.quad([-0.2, -0.16, 0], [0.2, -0.16, 0], [0.2, 0, 0], [-0.2, 0, 0], mul(G, 0.9));
      for (let r = 0; r < rows; r++) {
        const y0 = -0.19 - 1.06 * r / rows, y1 = -0.19 - 1.06 * (r + 1) / rows, h0 = Math.max(half(y0), 0.2), h1 = Math.max(half(y1), 0.2);
        [[-1, -0.34, cA], [-0.34, 0.34, cB], [0.34, 1, cA]].forEach(([a, c, col]) => b.quad([a * h1, y1, 0], [c * h1, y1, 0], [c * h0, y0, 0], [a * h0, y0, 0], col, { mask: 10 | (r === rows - 1 ? 1 : 0) | (r === 0 ? 4 : 0) }));
      }
      b.tri([-0.12, -1.25, 0], [0.12, -1.25, 0], [0, -1.7, 0], mul(G, 1.1));
      const iA = [], iB = [], iC = [], lr = rng.fork('ct-lant');
      for (const l of lanterns) { iA.push(l[0], l[1], l[2], lr()); iB.push(l[4], l[5], l[3], 1); iC.push(0, 0, 0, 0); }
      const m = emat({ edge: true, vmode: 7, wire: 0.05, cellSize: 0.35, spec: 4, emissive: look.lamp });
      m.uniforms.uFront = off4();
      instMesh(instGeo(b, iA, iB, iC), m);
    }

    // soft additive sheets (the lamp beams, the sun shaft): aQ = (along 0..1, across -1..1); they fade in and out along
    // their length, to nothing at both long edges, and close to the camera, so no edge is ever drawn
    const softSheet = (color, ends, nearFar) => new THREE.ShaderMaterial({
      uniforms: { uColor: { value: color }, uOp: { value: 1 }, uEnds: { value: new THREE.Vector2(ends[0], ends[1]) }, uNearFar: { value: new THREE.Vector2(nearFar[0], nearFar[1]) } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`
        attribute vec2 aQ; varying vec2 vQ; varying float vD;
        void main(){ vQ = aQ; vec4 wp = modelMatrix * vec4(position, 1.); vD = distance(wp.xyz, cameraPosition); gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor; uniform float uOp; uniform vec2 uEnds, uNearFar; varying vec2 vQ; varying float vD;
        void main(){
          float across = max(1. - vQ.y * vQ.y, 0.); across *= across;
          float a = smoothstep(0., uEnds.x, vQ.x) * (1. - smoothstep(uEnds.y, 1., vQ.x)) * across * smoothstep(uNearFar.x, uNearFar.y, vD) * uOp;
          gl_FragColor = vec4(max(uColor, 0.), clamp(a, 0., 1.));
        }`,
    });
    const sheetGeo = (quads) => {                     // quads: [nearLow, nearHigh, farHigh, farLow] corner points
      const pos = [], q = [];
      for (const [a, b, c, d] of quads) { pos.push(...a, ...b, ...c, ...a, ...c, ...d); q.push(0, -1, 0, 1, 1, 1, 0, -1, 1, 1, 1, -1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(q, 2));
      return g;
    };

    // ---- the pagoda lamp: two soft beams turning in the top tier (each a pair of crossed wedges that fade out by 70 m) ----
    const lampBeams = new THREE.Group();
    {
      const quads = [];
      for (const sd of [1, -1]) quads.push([[0, -0.5, 0], [0, 0.5, 0], [sd * 70, 5.5, 0], [sd * 70, -5.5, 0]], [[0, 0, -0.5], [0, 0, 0.5], [sd * 70, 0, 5.5], [sd * 70, 0, -5.5]]);
      const m = softSheet(new THREE.Color(G[0], G[1], G[2]), [0.03, 0.12], [0, 0.01]); m.uniforms.uOp.value = night ? 0.22 : 0.1;
      const mesh = new THREE.Mesh(sheetGeo(quads), m); mesh.frustumCulled = false; mesh.renderOrder = 2; lampBeams.add(mesh);
      lampBeams.position.set(40, lampY.y, MOUTH_Z); scene.add(lampBeams);
    }

    // ---- sampans (or bamboo rafts) rocking at their poles ----
    const sampanMeshes = [0, 1].map((alt) => {
      const list = sampans.filter((s) => s.alt === alt), mesh = new THREE.InstancedMesh(sampanGeo(cr, alt), emat({ edge: true, wire: 0.05, cellSize: 0.8, spec: 4, emissive: night ? 0.16 : 0.04 }), Math.max(list.length, 1));
      mesh.count = list.length; mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.userData.list = list; scene.add(mesh);
      return mesh;
    });
    await ctx.yield();

    // ---- creatures: gulls streaming inland, swallows over the basin, ducks, flying fish (cormorants are above) ----
    {
      const b = makeCells(), wh = [1.15, 1.15, 1.15], br = rng.fork('ct-birds');
      b.quad([0, 0, 0.9], [-0.16, 0, 0], [0, 0, -0.7], [0.16, 0, 0], wh);
      for (const s of [-1, 1]) b.tri([s * 0.14, 0, 0.32], [s * 1.0, 0, -0.12], [s * 0.14, 0, -0.3], mul(wh, 0.92));
      b.tri([0, 0, -0.6], [-0.2, 0, -1.05], [0.2, 0, -1.05], mul(wh, 0.85));
      const inl = Math.atan2(-0.34, -0.94);
      for (let q = 0, n = Math.max(40, many(80)); q < n; q++) {                        // the skein: three loose groups
        const grp = q % 3, k = (q / n - 0.5);
        critters.push([-10 + k * 260 + br.range(-18, 18), br.range(16, 52) + grp * 9, 20 + Math.abs(k) * 150 + br.range(-20, 20), inl + br.range(-0.06, 0.06), br.range(10, 12.5), 640, grp / 3 + br.range(0, 0.16), 0, br.range(1.25, 1.75), br.range(5, 7), 0.75, 0]);
      }
      for (let q = 0; q < 18; q++) {                                                  // swallows hunting low between the sampans
        const rad = br.range(7, 15); beside(br.range(225, 430), (q % 2 ? 1 : -1) * (rad + br.range(5, 16)), tmpC);
        critters.push([tmpC.x, br.range(1.4, 3.6), tmpC.z, 0, br.range(11, 15) * (q % 3 ? 1 : -1), rad, br(), 1, 0.55, 17, 0.8, 1]);
      }
      for (let q = 0; q < 9; q++) {                                                   // a raft of ducks paddling out of the way
        beside(318 + br.range(-9, 9), 9 + br.range(0, 7), tmpC); path.tangentAtDist(318, tmpB);
        ducks.push([tmpC.x, 0.04, tmpC.z, Math.atan2(tmpB.x, tmpB.z) - 1.2 + br.range(-0.25, 0.25), br.range(0.4, 0.6), 80, br.range(0, 0.04), 6, 1.5, 0, 0, 0]);
      }
      for (let q = 0, n = many(60); q < n; q++) {                                     // flying fish breaking from the wave faces
        const d = br.range(6, 188); beside(d, (q % 2 ? 1 : -1) * br.range(5.5, 15), tmpC); path.tangentAtDist(d, tmpB);
        critters.push([tmpC.x, 0.1, tmpC.z, Math.atan2(tmpB.x, tmpB.z) + br.range(-0.5, 0.5), br.range(0.3, 0.46), br.range(7, 11), br(), 4, 0.5, 0, 0, 0]);
      }
      for (let q = 0, n = many(18); q < n; q++) {                                     // gulls crossing the basin above the eye line
        const east = q % 3 !== 0;
        critters.push([br.range(-40, 40), br.range(7, 21), -120 - q / n * 185 + br.range(-8, 8), (east ? 1.45 : -1.75) + br.range(-0.3, 0.3), br.range(8.5, 11.5), 300, br(), 0, br.range(1.1, 1.5), br.range(5, 7), 0.75, 0]);
      }
      for (let q = 0; q < 10; q++) {                                                  // and wheeling over the jetties and hards
        const h = HARDS[q % 4], rad = br.range(11, 20);
        critters.push([(h[0] + h[1]) / 2 + br.range(-8, 8), br.range(11, 20), (h[2] + h[3]) / 2 + br.range(-6, 6), 0, br.range(7, 9.5) * (q % 2 ? 1 : -1), rad, br(), 1, br.range(1.0, 1.3), 5.5, 0.7, 0]);
      }
      const bake = (cells, list, cellSize) => {
        const iA = [], iB = [], iC = [];
        for (const c of list) { iA.push(c[0], c[1], c[2], c[3]); iB.push(c[4], c[5], c[6], c[7]); iC.push(c[8], c[9], c[10], c[11]); }
        const m = emat({ edge: true, vmode: 5, wire: 0.03, cellSize, spec: 3, emissive: night ? 0.25 : 0.08 });
        m.uniforms.uFront = off4();
        instMesh(instGeo(cells, iA, iB, iC), m);
      };
      for (let q = 0; q < 16; q++) {                                                  // larger gulls high over the basin, driven inland
        const east = q % 4 === 0;
        critters.push([zr.range(-90, 90), zr.range(19, 46), -140 - q / 16 * 190 + zr.range(-10, 10), (east ? 1.3 : -1.9) + zr.range(-0.3, 0.3), zr.range(9, 12.5), 340, zr(), 0, zr.range(1.9, 2.7), zr.range(4.2, 5.6), 0.7, 0]);
      }
      bake(b, critters, 0.6);
      // the cormorant, modelled: upright on its pole, S-neck, hooked bill, two wing fans of four feather cells each
      // that the shader keeps tucked until the junk comes near (critter kind 5)
      {
        const c = makeCells(), body = mul(mix(NV, L, 0.4), night ? 2.4 : 1.5), dark = mul(mix(NV, L, 0.15), night ? 2.4 : 1.4), wingA = mul(mix(NV, L, 0.75), night ? 1.8 : 1.25), gold = mul(G, 1.1);
        c.prism(0, 0.04, 0, 0.12, 0.19, 0.42, 5, body, { cap: false }); c.prism(0, 0.46, 0.02, 0.19, 0.09, 0.3, 5, dark, { cap: false });
        c.tri([-0.11, 0.14, -0.09], [0.11, 0.14, -0.09], [0, -0.2, -0.34], dark);
        c.box(0, 0.88, 0.05, 0.085, 0.3, 0.085, body, { top: false }); c.box(0, 1.06, 0.1, 0.085, 0.13, 0.16, dark);
        c.box(0, 1.13, 0.2, 0.11, 0.1, 0.2, body); c.tri([0.06, 0.98, 0.12], [-0.06, 0.98, 0.12], [0, 0.86, 0.1], mul(W, 1.1));
        c.quad([-0.035, 1.13, 0.3], [0.035, 1.13, 0.3], [0.02, 1.1, 0.52], [-0.02, 1.1, 0.52], gold); c.tri([0, 1.12, 0.3], [0, 1.11, 0.54], [0, 1.02, 0.5], gold);
        c.fan([0.058, 1.15, 0.24], [[0.058, 1.12, 0.24], [0.058, 1.15, 0.27], [0.058, 1.18, 0.24], [0.058, 1.15, 0.21]], mul(W, 1.3)); c.fan([-0.058, 1.15, 0.24], [[-0.058, 1.12, 0.24], [-0.058, 1.15, 0.21], [-0.058, 1.18, 0.24], [-0.058, 1.15, 0.27]], mul(W, 1.3));
        const yT = (t) => 0.68 + 0.14 * t, yB = (t) => 0.2 + 0.32 * t * t;
        for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) {
          const t0 = k / 4, t1 = (k + 1) / 4, xa = sd * (0.19 + 0.78 * t0), xb = sd * (0.19 + 0.78 * t1);
          c.quad([xa, yT(t0), -0.03], [xb, yT(t1), -0.03], [xb, yB(t1) + 0.05, -0.05], [xa, yB(t0), -0.05], k % 2 ? wingA : dark);
        }
        bake(c, corms, 0.3);
      }
      // the duck, modelled: a boat-shaped body, a green head, a gold bill, a white wing cell each side (critter kind 6)
      {
        const c = makeCells(), brown = mul(mix(WOOD, STRAW, 0.45), 1.15), headC = mul(GREEN, night ? 1.6 : 1.0);
        c.prism(0, -0.04, 0, 0.17, 0.14, 0.2, 6, brown, { sx: 1, sz: 2.1, cap: mul(brown, 0.85) });
        c.box(0, 0.2, 0.27, 0.09, 0.14, 0.1, mul(W, 1.1), { top: false }); c.box(0, 0.32, 0.3, 0.13, 0.13, 0.17, headC);
        c.quad([-0.04, 0.31, 0.38], [0.04, 0.31, 0.38], [0.03, 0.29, 0.52], [-0.03, 0.29, 0.52], mul(G, 1.2));
        for (const sd of [-1, 1]) c.quad([sd * 0.168, 0.15, 0.16], [sd * 0.168, 0.15, -0.24], [sd * 0.15, 0.02, -0.3], [sd * 0.17, 0.02, 0.1], mul(W, 1.15));
        c.tri([-0.08, 0.16, -0.3], [0.08, 0.16, -0.3], [0, 0.3, -0.46], mul(brown, 0.8));
        bake(c, ducks, 0.25);
      }
    }

    // ---- a skein of enamel cranes: it overtakes us on the starboard side, crosses the bow in a V between u = 0.16 and
    //      0.34 (20 to 33 m ahead, 9 to 13 m above the eye, against the sky over the cloud bank) and flies on up the harbour, out over the port quay by
    //      u = 0.6. White cells, navy flight feathers and neck, an oxblood crown, a gold bill. The same shader as the
    //      gulls (critter kind 0 with no speed of its own); update() writes each bird's place from the progress.
    //      Parked under the sea outside that window, so the mesh itself is never switched ----
    const NCR = 9;
    let craneAttr = null;
    {
      const c = makeCells(), wh = night ? [0.6, 0.66, 0.8] : [1.12, 1.12, 1.1], dk = mul(mix(NV, L, 0.35), night ? 2.2 : 1.5);
      // seen mostly from astern and below, so the bird is built to read from there: a body with a cross-section, and
      // wings set in a shallow M (shoulder, raised wrist, drooping tip) with the leading edge high, which the shader
      // then beats from a V to an arch (it lifts each vertex by its distance from the centre line)
      c.quad([0, 0, 0.6], [-0.22, 0, 0.05], [0, 0, -0.65], [0.22, 0, 0.05], wh);                                // body, from above
      c.quad([0, 0.2, 0.1], [-0.22, 0, 0.1], [0, -0.17, 0.1], [0.22, 0, 0.1], mul(wh, 0.94));                   // from astern
      c.fan([0, 0.02, 0.05], [[0, 0.1, 0.6], [0, 0.2, 0.1], [0, 0.06, -0.65], [0, -0.17, -0.2], [0, -0.14, 0.3]], mul(wh, 0.97));   // from abeam
      c.quad([-0.06, 0, 0.5], [0.06, 0, 0.5], [0.05, 0.04, 1.45], [-0.05, 0.04, 1.45], dk);                    // neck
      c.quad([0, -0.05, 0.5], [0, 0.07, 0.5], [0, 0.1, 1.45], [0, 0, 1.45], dk);
      c.quad([-0.08, 0.05, 1.45], [0.08, 0.05, 1.45], [0.07, 0.05, 1.66], [-0.07, 0.05, 1.66], mul(R, 2.0));   // crown
      c.tri([-0.05, 0.05, 1.66], [0.05, 0.05, 1.66], [0, 0.03, 2.05], mul(G, 1.25));                           // bill
      for (const s of [-1, 1]) {
        // the wing is pitched about 35 degrees nose-up, and a skirt of feathers 0.3 deep hangs from its trailing edge:
        // from astern and below (where we are) the wing shows a face, not an edge
        const TE = [[s * 0.18, -0.18, -0.34], [s * 1.0, 0.28, -0.24], [s * 1.42, 0.2, -0.27], [s * 1.8, 0.1, -0.3]];
        c.quad([s * 0.18, 0.2, 0.36], [s * 1.0, 0.72, 0.3], TE[1], TE[0], wh);
        c.quad([s * 1.0, 0.72, 0.3], [s * 1.5, 0.6, 0.2], TE[2], TE[1], mul(wh, 0.96));
        c.quad([s * 1.5, 0.6, 0.2], [s * 1.95, 0.44, 0.06], TE[3], TE[2], dk);   // navy flight feathers at the tip
        for (let q = 0; q < 3; q++) {
          const a = TE[q], e = TE[q + 1], dp = q === 2 ? 0.22 : 0.3;
          c.quad(a, e, [e[0], e[1] - dp, e[2] - 0.05], [a[0], a[1] - dp, a[2] - 0.05], q === 2 ? dk : mul(wh, q ? 0.9 : 0.94));
        }
      }
      c.tri([0, 0, -0.55], [-0.18, 0, -0.95], [0.18, 0, -0.95], dk);                                           // tail
      c.quad([-0.035, 0, -0.65], [0.035, 0, -0.65], [0.025, -0.03, -1.6], [-0.025, -0.03, -1.6], dk);          // legs
      const iA = [], iB = [], iC = [];
      for (let k = 0; k < NCR; k++) { iA.push(0, -80, 0, 0); iB.push(0, 0, 0.3 + k * 0.008, 0); iC.push(zr.range(1.35, 1.6) * 1.2, zr.range(3.0, 3.6), 0.9, 0); }
      const g = instGeo(c, iA, iB, iC);
      craneAttr = g.attributes.iA; craneAttr.setUsage(THREE.DynamicDrawUsage);
      const m = emat({ edge: true, vmode: 5, wire: 0.03, cellSize: 0.6, spec: 3, emissive: night ? 0.12 : 0.08 });
      m.uniforms.uFront = off4();
      instMesh(g, m);
    }

    // ---- the fleet: sixty junks. A file from under the storm to the mouth and on to the east moorings, two
    //      companions off our bows, eight already moored. All keyed to progress; pitch only, never roll. ----
    const jr = rng.fork('ct-fleet'), NJ = 60;
    const jg = makeJunkGeometries(jr, palHex);
    if (sailCast !== 'ox') {
      const arr = jg.sails.attributes.aCol.array;
      for (let i = 0; i < arr.length; i += 3) {
        const k = arr[i] / Math.max(R[0], 1e-4); if (k > 1.5) continue;
        const c = sailCast === 'white' ? (k > 1.1 ? mul(W0, 0.82) : mul(mix(W0, L, 0.42), 0.8)) : (k > 1.1 ? mul(T, 1.05) : mul(T, 0.78));
        arr[i] = c[0]; arr[i + 1] = c[1]; arr[i + 2] = c[2];
      }
    }
    const hullMesh = new THREE.InstancedMesh(jg.hull, emat({ edge: true, wire: 0.14, spec: 4, cellSize: 3 }), NJ);
    const sailMat = emat({ edge: true, sway: true, wire: 0.14, spec: 4, cellSize: 3, emissive: night ? 0.2 : 0.12 }); sailMat.uniforms.uFront = off4();
    const sailMesh = new THREE.InstancedMesh(jg.sails, sailMat, NJ);
    for (const m of [hullMesh, sailMesh]) { m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m); }
    const LN = 640, laneX = new Float32Array(LN + 1), laneZ = new Float32Array(LN + 1);
    let laneLen = 0, sMouth = 0;
    {
      const lane = new THREE.CatmullRomCurve3([[1050, 760], [850, 560], [650, 380], [470, 230], [310, 110], [170, 25], [70, -22], [13, -46], [40, -95], [76, -140], [84, -196], [82, -226]].map((p) => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal');
      laneLen = lane.getLength(); let best = 1e9;
      for (let i = 0; i <= LN; i++) { lane.getPointAt(i / LN, tmpA); laneX[i] = tmpA.x; laneZ[i] = tmpA.z; const dd = Math.hypot(tmpA.x - 13, tmpA.z + 46); if (dd < best) { best = dd; sMouth = i / LN * laneLen; } }
    }
    const junks = [];
    {
      const list = [];
      for (let i = 0; i < 80 && list.length < 50; i++) {
        const s0 = 30 + (laneLen - 60) * (i + jr.range(0.15, 0.85)) / 80, uAt = (sMouth - s0) / PL;
        if (uAt > 0.08 && uAt < 0.58) continue;                    // nobody shares the mouth with us
        list.push(s0);
      }
      list.sort((a, b) => b - a);
      list.forEach((s0, rank) => {
        const moor = rank < 7, stop = moor ? laneLen - 4 - rank * 28 : Math.min(sMouth - 45 - (rank - 7) * 30, s0 + PL);
        junks.push({ kind: 0, s0: Math.min(s0, stop), stop, moor, latFar: (rank % 2 ? 1 : -1) * jr.range(6, 28), latNear: (rank % 2 ? 1 : -1) * jr.range(4, 8), spd: jr.range(0.9, 1.04), scale: jr.range(1.15, 1.55), ph: jr.range(0, 6.28), yaw: jr.range(-0.07, 0.07) });
      });
      junks.push({ kind: 1, scale: 1.3, ph: 1.1, yaw: 0 }, { kind: 2, scale: 1.2, ph: 4.2, yaw: 0 });
      for (const [x, z] of [[-72, -108], [-84, -160], [-74, -228], [-86, -284], [-52, -298], [104, -96], [-104, -138], [-97, -226]]) junks.push({ kind: 3, x, z, scale: jr.range(1.1, 1.3), ph: jr.range(0, 6.28), yaw: (jr.chance(0.5) ? Math.PI : 0) + jr.range(-0.12, 0.12) });
    }
    hullMesh.count = sailMesh.count = Math.min(junks.length, NJ);
    await ctx.yield();

    // ---- our junk: the prow, the luff of the sail and the forestay, parented to the camera. Ride space: eye at the
    //      origin looking down -Z. Everything stays in the bottom 15%, the right 15% or the top-left corner. ----
    // Two parts: the hull (deck, stem, its pennant, the spray), which stays on the water when the eye rises to meet the
    // portal, and the rig (sail luff, sheets, forestay and flags), which stays where it is in the frame.
    const prow = new THREE.Group(); prow.name = 'our-junk';
    const hullGrp = new THREE.Group(); prow.add(hullGrp);
    // The sail (luff, batten ends, sheets) is its own group: update() slides it sideways so that its inner edge stays
    // just outside the frame at every shape of screen (a strip cut off by the frame's edge reads as a fault). What
    // the starboard side shows instead is whole: a short lacquered lantern mast on the rail, inside the frame.
    const sailGrp = new THREE.Group(), mastGrp = new THREE.Group(); prow.add(sailGrp); hullGrp.add(mastGrp);
    {
      const pb = makeCells(), ps = makeCells(), pl = makeCells(), pp = makeCells(), qr = rng.fork('ct-prow');
      const sa = makeCells(), sl = makeCells(), mb = makeCells(), ms = makeCells();
      // the deck runs aft past the eye (level abaft z = -4.2), so a tall, wide-angle frame looks down on a whole foredeck
      const deckY = (z) => -2.5 - 0.13 * Math.max(0, -z - 4.2), hw = (z) => 2.05 * Math.pow(clamp((5.9 + z) / 2.6, 0, 1), 0.62);
      const rail = (z) => 0.24 * clamp((z + 5.95) / 2.65, 0.03, 1);
      const zs = [1.7, 0.4, -0.9, -2.1, -3.3, -4.2, -4.8, -5.3, -5.65, -5.9];
      for (let i = 0; i < zs.length - 1; i++) {
        const za = zs[i], zb = zs[i + 1], ya = deckY(za), yb = deckY(zb), wa = hw(za), wb = hw(zb);
        for (let k = 0; k < 6; k++) {                       // deck planks
          const f0 = -1 + k / 3, f1 = -1 + (k + 1) / 3;
          pb.quad([f0 * wa, ya, za], [f1 * wa, ya, za], [f1 * wb, yb, zb], [f0 * wb, yb, zb], jit(k % 2 ? STRAW : mul(STRAW, 0.84), qr, 0.06), { mask: 10 | (i === 0 ? 1 : 0) });
        }
        for (const s of [-1, 1]) {                          // bulwark: a white strake over a lapis one
          const ra = rail(za), rb = rail(zb);
          pb.quad([s * wa, ya, za], [s * wb, yb, zb], [s * (wb + 0.05), yb + rb, zb], [s * (wa + 0.05), ya + ra, za], mul(W, 1.05));
          pb.quad([s * (wa + 0.05), ya + ra, za], [s * (wb + 0.05), yb + rb, zb], [s * (wb + 0.3), yb - 0.5, zb], [s * (wa + 0.3), ya - 0.5, za], mul(L, 1.1));
        }
      }
      pb.box(0, -3.0, -5.92, 0.26, 1.06, 0.3, mul(R, 1.5));                                        // the red stem post
      pp.tri([0, -2.49, -5.95], [0.95, -2.78, -6.55], [0.04, -2.68, -6.0], mul(R, 2.0), { sw: [0, 0.12, 0.02] });   // its pennant
      // a wooden grapnel anchor, a coiled rope, a basket of silver fish
      pb.at(-0.95, deckY(-4.7), -4.7, 0.5);
      pb.box(0, 0.09, 0, 0.14, 0.18, 1.3, WOOD); pb.box(0, 0.09, -0.6, 0.9, 0.16, 0.14, WOOD);
      for (const s of [-1, 1]) pb.quad([s * 0.45, 0.02, -0.6], [s * 0.62, 0.2, -0.95], [s * 0.5, 0.2, -1.0], [s * 0.36, 0.02, -0.68], mul(WOOD, 0.8));
      pb.at(0.15, deckY(-4.6), -4.6);
      for (let q = 0; q < 3; q++) pb.prism(0, q * 0.07, 0, 0.42 - q * 0.09, 0.4 - q * 0.09, 0.08, 9, jit(STRAW, qr, 0.1), { cap: mul(STRAW, 0.6) });
      pb.at(1.05, deckY(-4.75), -4.75);
      pb.prism(0, 0, 0, 0.3, 0.42, 0.34, 8, mul(STRAW, 0.9), { cap: mul(L, 0.8) });
      for (let q = 0; q < 6; q++) { const a = q * 1.05, fx = Math.sin(a) * 0.17, fz = Math.cos(a) * 0.17; pb.quad([fx - 0.2, 0.36, fz], [fx, 0.39, fz + 0.07], [fx + 0.2, 0.37, fz], [fx, 0.38, fz - 0.07], mul(W, 1.3)); }
      // abaft the anchor (seen only in tall frames): a hatch with its coaming, a second rope coil, the mast partner
      // under the sail's luff, a bucket, and the bitts the sheets come down to
      pb.at(-0.55, deckY(-2.6), -2.6, 0.06);
      pb.box(0, 0.11, 0, 1.5, 0.22, 1.3, WOOD); pb.quad([-0.6, 0.23, 0.5], [0.6, 0.23, 0.5], [0.6, 0.23, -0.5], [-0.6, 0.23, -0.5], mul(STRAW, 0.7));
      for (const q of [-0.3, 0, 0.3]) pb.box(q, 0.26, 0, 0.1, 0.05, 1.0, mul(WOOD, 1.3));
      pb.at(1.15, deckY(-3.3), -3.3);
      for (let q = 0; q < 3; q++) pb.prism(0, q * 0.07, 0, 0.46 - q * 0.1, 0.44 - q * 0.1, 0.08, 9, jit(STRAW, qr, 0.1), { cap: mul(STRAW, 0.6) });
      pb.at(1.5, deckY(-1.9), -1.9);
      pb.box(0, 0.2, 0, 0.7, 0.4, 0.7, WOOD); pb.prism(0, 0.4, 0, 0.2, 0.17, 0.5, 8, mul(R, 1.2), { cap: mul(WOOD, 0.8) });
      pb.at(-1.45, deckY(-1.4), -1.4);
      pb.prism(0, 0, 0, 0.2, 0.26, 0.36, 7, mul(L, 1.0), { cap: mul(CEL, 1.05) });
      pb.at(0, deckY(-0.6), -0.6);
      for (const q of [-0.9, 0.9]) pb.box(q, 0.25, 0, 0.16, 0.5, 0.16, WOOD); pb.box(0, 0.4, 0, 2.2, 0.12, 0.14, mul(WOOD, 1.2));
      pb.at();
      // the luff of the batten sail down the right edge, five batten ends, the sheets
      const sy = [-2.3, -1.38, -0.46, 0.46, 1.38, 2.3], sc = sailCast === 'white' ? mul(W0, 0.82) : sailCast === 'turq' ? T : mul(R, 1.25);
      for (let i = 0; i < 5; i++) {
        const lx = (y) => 2.62 + 0.03 * y * y, c = mul(sc, i % 2 ? 1 : 0.82);
        sa.quad([lx(sy[i]), sy[i], -2.62], [lx(sy[i]) + 1.0, sy[i] - 0.05, -1.85], [lx(sy[i + 1]) + 1.0, sy[i + 1] - 0.05, -1.85], [lx(sy[i + 1]), sy[i + 1], -2.62], c, { sw: [0.012, 0.035, 0.035, 0.012] });
        sa.quad([lx(sy[i]) + 1.0, sy[i] - 0.05, -1.85], [lx(sy[i]) + 2.3, sy[i] - 0.1, -0.7], [lx(sy[i + 1]) + 2.3, sy[i + 1] - 0.1, -0.7], [lx(sy[i + 1]) + 1.0, sy[i + 1] - 0.05, -1.85], mul(c, 0.9), { sw: 0.035 });
        if (i > 0) { sa.quad([lx(sy[i]) - 0.15, sy[i] + 0.04, -2.74], [lx(sy[i]) + 0.97, sy[i] - 0.01, -1.87], [lx(sy[i]) + 0.97, sy[i] - 0.09, -1.87], [lx(sy[i]) - 0.15, sy[i] - 0.04, -2.74], STRAW, { sw: [0.012, 0.035, 0.035, 0.012] }); sl.cord([lx(sy[i]) - 0.08, sy[i], -2.66], [2.75, -2.9, -1.3], 0.25, 3, 0.2, 0.02); }
      }
      // the forestay across the top-left corner with three small flags
      const fa = [-3.2, 1.0, -3.0], fb = [-1.5, 3.6, -5.2];
      pl.line(fa, fb, 0.2, 0.006);
      [[0.3, mul(R, 1.9)], [0.48, mul(G, 1.2)], [0.66, mul(W, 1.2)]].forEach(([t, c]) => {
        const p = [lerp(fa[0], fb[0], t), lerp(fa[1], fb[1], t), lerp(fa[2], fb[2], t)];
        ps.tri(p, [p[0] + 0.2, p[1] + 0.31, p[2] - 0.26], [p[0] + 0.42, p[1] - 0.2, p[2] + 0.1], c, { sw: [0, 0, 0.06] });
      });
      // the lantern mast on the starboard rail: an oxblood-lacquered pole with gold bands and a gold finial, a paper
      // lantern under a bracket on its outboard side, a gold-and-red pennant whipping forward from its top (y = 0.25, just above the horizon, so the lantern hangs against the sea)
      {
        const mx = 2.05, mz = -2.6, my = deckY(mz), lac = mul(R, 1.2), sv = 0.015, lx = mx + 0.27, TOP = 0.25, ly = TOP - 0.42;
        const cA = mul(R, night ? 5 : 1.55), cB = mul(mix(R, G, 0.12), night ? 7 : 2.1);
        mb.prism(mx, my, mz, 0.15, 0.11, 0.22, 6, WOOD);
        mb.prism(mx, my + 0.2, mz, 0.05, 0.035, TOP - my - 0.2, 6, lac, { cap: false });
        for (const by of [-1.55, -0.55, TOP - 0.36]) mb.prism(mx, by, mz, 0.065, 0.065, 0.07, 6, G, { cap: mul(G, 0.8) });
        mb.prism(mx, TOP, mz, 0.07, 0, 0.17, 6, mul(G, 1.1), { cap: false });
        mb.box(mx + 0.15, ly + 0.03, mz, 0.36, 0.05, 0.05, mul(G, 0.9));
        ms.prism(lx, ly - 0.08, mz, 0.05, 0.05, 0.08, 6, G, { sw: sv, cap: false });                 // the lantern: gold caps, oxblood paper
        ms.prism(lx, ly - 0.18, mz, 0.125, 0.055, 0.1, 8, cA, { sw: sv, cap: false });
        ms.prism(lx, ly - 0.36, mz, 0.125, 0.125, 0.18, 8, cB, { sw: sv, cap: false });
        ms.prism(lx, ly - 0.46, mz, 0.055, 0.125, 0.1, 8, cA, { sw: sv, cap: false });
        ms.prism(lx, ly - 0.52, mz, 0.05, 0.05, 0.06, 6, G, { sw: sv, cap: false });
        ms.tri([lx - 0.04, ly - 0.52, mz], [lx + 0.04, ly - 0.52, mz], [lx, ly - 0.8, mz], mul(G, 1.1), { sw: [sv, sv, sv + 0.03] });
        ms.quad([mx, TOP - 0.02, mz], [mx, TOP - 0.26, mz], [mx + 0.4, TOP - 0.22, mz - 0.28], [mx + 0.4, TOP - 0.06, mz - 0.28], mul(G, 1.25), { sw: [0, 0, 0.06, 0.06] });
        ms.tri([mx + 0.4, TOP - 0.06, mz - 0.28], [mx + 0.4, TOP - 0.22, mz - 0.28], [mx + 0.92, TOP - 0.18, mz - 0.66], mul(R, 1.9), { sw: [0.06, 0.06, 0.16] });
      }
      const add = (b, m, to = prow) => { const mesh = new THREE.Mesh(b.geo(), m); mesh.frustumCulled = false; to.add(mesh); };
      const hm = emat({ edge: true, wire: 0.014, cellSize: 0.5, spec: 5 });
      add(pb, hm, hullGrp); add(mb, hm, mastGrp);
      const sm = emat({ edge: true, sway: true, wire: 0.014, cellSize: 0.5, spec: 5, emissive: 0.08 }); sm.uniforms.uFront = off4(); add(ps, sm); add(pp, sm, hullGrp); add(sa, sm, sailGrp); add(ms, sm, mastGrp);
      const lm = emat({ pattern: 'line', sway: true, wire: 0.016 });
      add(pl, lm); add(sl, lm, sailGrp);
      scene.add(prow);
    }

    // ---- beads: spray flying from our stem (in ride space) and surf bursting in fans on the stones ----
    const bead = makeCells();
    bead.fan([0, 0, 0], [0, 1, 2, 3, 4, 5, 6, 7].map((q) => [Math.sin(-q / 8 * TAU), Math.cos(q / 8 * TAU), 0]), [1.25, 1.25, 1.2]);
    const beadMat = emat({ edge: true, vmode: 6, wire: 0.02, cellSize: 0.3, spec: 6, emissive: night ? 0.3 : 0.1 }); beadMat.uniforms.uFront = off4();
    let sprayMesh;
    {
      const r = rng.fork('ct-beads'), iA = [], iB = [], iC = [];
      for (let q = 0, n = many(44); q < n; q++) {
        const s = q % 2 ? 1 : -1;
        iA.push(s * r.range(0.05, 0.5), -3.0, -5.9 + r.range(-0.3, 0.5), r()); iB.push(s * r.range(0.6, 2.6), r.range(2.0, 3.3), r.range(0.4, 2.4), r.range(0.7, 1.1)); iC.push(r.range(0.035, 0.08), 8.5, 1, 0);
      }
      sprayMesh = new THREE.Mesh(instGeo(bead, iA, iB, iC), beadMat); sprayMesh.frustumCulled = false; hullGrp.add(sprayMesh);
      const jA = [], jB = [], jC = [];
      for (const [x, z, dx, dz] of surfSpots) {
        const ph = r(), life = r.range(1.5, 2.1);
        for (let q = 0, n = Math.max(8, Math.round(20 * detail)); q < n; q++) {
          const a = r.range(-1.1, 1.1), up = r.range(3.5, 7.5), out = r.range(-0.6, 1.6);
          jA.push(x + r.range(-0.8, 0.8), 0.2, z + r.range(-0.8, 0.8), ph + r.range(0, 0.07)); jB.push(dx * out + dz * Math.sin(a) * 2.4, up, dz * out - dx * Math.sin(a) * 2.4, life); jC.push(r.range(0.3, 0.7), 9.8, 0.82, 0);
        }
      }
      instMesh(instGeo(bead, jA, jB, jC), beadMat);
    }

    // ---- rain: slanting gold wires wrapped around the camera; arrives from astern at 85 percent (or is there all along) ----
    let rainMat;
    {
      const n = many(800), r = rng.fork('ct-rain'), iR = new Float32Array(n * 4);
      for (let i = 0; i < n * 4; i++) iR[i] = r();
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('iR', new THREE.InstancedBufferAttribute(iR, 4)); g.instanceCount = n;
      rainMat = new THREE.ShaderMaterial({
        uniforms: { uTime: U.uTime, uGlint: U.uGlint, uGold: U.uGold, uAmt: { value: 0 }, uBox: { value: new THREE.Vector3(84, 46, 84) } },
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute vec4 iR; uniform float uTime, uAmt; uniform vec3 uBox;
          varying vec2 vA; varying vec3 vWp; varying float vHalf, vFade;
          void main(){
            vec3 fall = vec3(9., -24., -5.);
            vec3 p = iR.xyz * uBox + fall * uTime * (.8 + .45 * iR.w);
            p = mod(p - cameraPosition + .5 * uBox, uBox) - .5 * uBox + cameraPosition;
            vec3 dir = normalize(fall);
            float len = 3. + 4. * iR.w;
            vec3 c = p - dir * position.y * len;
            float d = distance(c, cameraPosition);
            vec3 side = normalize(cross(dir, cameraPosition - c) + vec3(1e-5, 0., 0.));
            vHalf = max(.03, d * .0022);
            c += side * position.x * vHalf;
            vA = vec2(position.x, position.y); vWp = c;
            vFade = smoothstep(6., 14., d) * (1. - smoothstep(34., 42., d)) * step(iR.w * .999, uAmt) * step(.02, c.y);
            gl_Position = projectionMatrix * viewMatrix * vec4(c, 1.);
          }`,
        fragmentShader: /* glsl */`
          uniform float uTime; uniform vec3 uGold; uniform vec4 uGlint;
          varying vec2 vA; varying vec3 vWp; varying float vHalf, vFade;
          void main(){
            float fa = max(fwidth(vA.x), 1e-5);
            float hw = max(.012 / max(vHalf, 1e-3), .75 * fa);
            float m = (1. - smoothstep(hw - .6 * fa, hw + .6 * fa, abs(vA.x))) * clamp(1. / hw, 0., 1.);
            m *= smoothstep(0., .12, vA.y) * (1. - smoothstep(.75, 1., vA.y)) * vFade;
            if (m < .01) discard;
            float band = mod(dot(vWp.xz, uGlint.xy) - uTime * uGlint.z, max(uGlint.w, 1.)) - .5 * uGlint.w;
            float glint = exp(-band * band / 3600.);
            gl_FragColor = vec4(max(uGold * (1.0 + 1.4 * glint) + vec3(.3, .25, .15) * glint, 0.), clamp(m * .8, 0., 1.));
          }`,
      });
      const mesh = new THREE.Mesh(g, rainMat); mesh.frustumCulled = false; mesh.renderOrder = 3; scene.add(mesh);
    }

    // ---- the shaft of storm sun: the lit stripe on the enamel (uShaft) is the statement; above it two faint slanted
    //      bands of light come down from the west. They start well short of the span, have no hard edge, and are
    //      gone before the final approach, so nothing lies between the camera and the portal ----
    const shaft = new THREE.Group(), shaftN = new THREE.Vector2(0.383, 0.924);
    const shaftMat = softSheet(night ? new THREE.Color(0.42, 0.5, 0.75) : new THREE.Color(1, 0.86, 0.52), [0.05, 0.4], [20, 90]);
    shaftMat.uniforms.uOp.value = 0;
    {
      const quads = [], far = 760;
      for (const o of [-6, 5]) {
        const ox = shaftN.x * o, oz = shaftN.y * o, tx = sun.x * far, ty = sun.y * far, tz = sun.z * far;
        quads.push([[ox, -1, oz], [ox, 17 + o, oz], [ox + tx, ty + 30 + o, oz + tz], [ox + tx, ty - 6, oz + tz]]);
      }
      const mesh = new THREE.Mesh(sheetGeo(quads), shaftMat); mesh.frustumCulled = false; mesh.renderOrder = 2; shaft.add(mesh); scene.add(shaft);
    }
    // the shaft drawn the cloisonne way: six slanting gold wires that come down from the west at the sun's elevation
    // and stop 30 m and more short of the span (so nothing crosses the portal); ribbons at least 1.5 px wide
    let rayMat;
    {
      const iA = [], iB = [], nR = 6, pos = [], idx = [], nS = 8;
      for (let k = 0; k < nR; k++) {
        const ex = -30 - k * 11 - xr.range(0, 5), ey = [15.5, 8, 1.5, 11.5, 4.5, 18][k], ez = [1, 5, 9, 3, 7, -1][k] + xr.range(-1, 1), L = xr.range(105, 150);
        iA.push(ex + sun.x * L, ey + sun.y * L, ez + sun.z * L, xr()); iB.push(ex, ey, ez, 0);
      }
      for (let q = 0; q <= nS; q++) { pos.push(-1, q / nS, 0, 1, q / nS, 0); if (q < nS) idx.push(q * 2, q * 2 + 1, q * 2 + 3, q * 2, q * 2 + 3, q * 2 + 2); }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(iA), 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(iB), 4));
      g.instanceCount = nR;
      rayMat = new THREE.ShaderMaterial({
        uniforms: { uTime: U.uTime, uGold: { value: night ? new THREE.Vector3(0.32, 0.38, 0.6) : new THREE.Vector3(G[0], G[1], G[2]) }, uOp: { value: 0 } },
        transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
        vertexShader: /* glsl */`
          attribute vec4 iA, iB; uniform float uTime;
          varying vec3 vA; varying float vHalf, vFade;
          void main(){
            vec3 a = (modelMatrix * vec4(iA.xyz, 1.)).xyz, b = (modelMatrix * vec4(iB.xyz, 1.)).xyz;
            vec3 c = mix(a, b, position.y), dir = normalize(b - a + vec3(0., 1e-5, 0.));
            float d = distance(c, cameraPosition);
            vec3 side = normalize(cross(dir, cameraPosition - c) + vec3(1e-5, 0., 0.));
            vHalf = max(.3, d * .0042);
            c += side * position.x * vHalf;
            vA = vec3(position.x, position.y, iA.w); vFade = smoothstep(18., 60., d);
            gl_Position = projectionMatrix * viewMatrix * vec4(c, 1.);
          }`,
        fragmentShader: /* glsl */`
          uniform float uTime, uOp; uniform vec3 uGold;
          varying vec3 vA; varying float vHalf, vFade;
          void main(){
            float fa = max(fwidth(vA.x), 1e-5);
            float hw = max(.09 / max(vHalf, 1e-3), 1.05 * fa);
            float m = (1. - smoothstep(hw - .6 * fa, hw + .6 * fa, abs(vA.x))) * clamp(1. / hw, 0., 1.);
            m *= smoothstep(0., .6, vA.y) * (1. - smoothstep(.94, 1., vA.y)) * vFade * uOp;
            if (m < .01) discard;
            float run = .5 + .5 * sin(vA.y * 9. - uTime * 2.2 + vA.z * 6.2831853);
            gl_FragColor = vec4(max(uGold * (1.3 + 1.6 * run * run), 0.), clamp(m, 0., 1.));
          }`,
      });
      const mesh = new THREE.Mesh(g, rayMat); mesh.frustumCulled = false; mesh.renderOrder = 3; shaft.add(mesh);
    }

    // ---- rare: one scroll on the crest uncoils into a gold-wire dragon 400 m long. It is on the crest above the hub
    //      at the entry, runs the top of the wall, comes down behind the town and crosses over the bridge in profile,
    //      east to west, as the junk reaches it; a pale crack lingers along its track ----
    let dragon = null;
    if (rare) {
      const wallW = (s, y) => hero.object.localToWorld(new THREE.Vector3(1370 * Math.sin(s / 1500), y, 1500 - 1370 * Math.cos(s / 1500)));
      const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
      const curve = new THREE.CatmullRomCurve3([wallW(520, 600), wallW(60, 720), wallW(-480, 730), wallW(-950, 660), wallW(-1300, 570), V3(880, 470, -930), V3(640, 380, -890), V3(450, 270, -740), V3(300, 170, -580), V3(190, 100, -460), V3(100, 52, -377), V3(0, 36, -346), V3(-130, 46, -332), V3(-320, 130, -255), V3(-800, 380, -100)], false, 'centripetal');
      const DN = 900, dx = new Float32Array(DN + 1), dy = new Float32Array(DN + 1), dz = new Float32Array(DN + 1), len = curve.getLength();
      let sBridge = 0, best = 1e9;
      for (let i = 0; i <= DN; i++) { curve.getPointAt(i / DN, tmpA); dx[i] = tmpA.x; dy[i] = tmpA.y; dz[i] = tmpA.z; const dd = tmpA.distanceTo(tmpB.set(0, 36, -346)); if (dd < best) { best = dd; sBridge = i / DN * len; } }
      // body: a flat ribbon and an upright one (gold back, pale belly) that taper to the tail, a row of dorsal fins and
      // four clawed legs, all in one buffer rebuilt each frame from the spine
      const SEG = 64, SL = 6.25, nF = 31, FB = (SEG + 1) * 7, LB = FB + nF * 3, nV = LB + 4 * 21;
      const w0 = new Float32Array(SEG + 1); for (let i = 0; i <= SEG; i++) w0[i] = Math.max(0.45, 3.5 * Math.pow(1 - i / SEG, 0.7));
      const pos = new Float32Array(nV * 3), uv = new Float32Array(nV * 2), col = new Float32Array(nV * 3), nr = new Float32Array(nV * 3), ed = new Float32Array(nV * 3).fill(1e3), cl = new Float32Array(nV * 4), idx = [];
      const gold = mul(G, 1.15), belly = mul(mix(G, W0, 0.3), 1.0), finC = mul(W0, 0.95), legC = mul(G, 0.8);
      const setV = (v, c, u0, u1, e0, e1, e2, id) => { col[v * 3] = c[0]; col[v * 3 + 1] = c[1]; col[v * 3 + 2] = c[2]; uv[v * 2] = u0; uv[v * 2 + 1] = u1; ed[v * 3] = e0; ed[v * 3 + 1] = e1; ed[v * 3 + 2] = e2; nr[v * 3 + 1] = 1; cl[v * 4 + 3] = id; };
      for (let i = 0; i <= SEG; i++) {
        const w = w0[i], a = i * 7, id = (i * 0.618) % 1;
        setV(a, gold, w, i * SL, 0, 1e3, 1e3, id); setV(a + 1, gold, 0, i * SL, w, 1e3, 1e3, id); setV(a + 2, gold, -w, i * SL, 0, 1e3, 1e3, id);
        setV(a + 3, gold, w, i * SL, 0, w, 1e3, id); setV(a + 4, gold, 0, i * SL, w, 0, 1e3, id); setV(a + 5, belly, 0, i * SL, w, 0, 1e3, id); setV(a + 6, belly, -w, i * SL, 0, w, 1e3, id);
        if (i < SEG) for (const [o1, o2] of [[0, 1], [1, 2], [3, 4], [5, 6]]) idx.push(a + o1, a + 7 + o1, a + 7 + o2, a + o1, a + 7 + o2, a + o2);
      }
      const triV = (v, c, h) => { setV(v, c, 0, 0, h, 0, 0, 0.3); setV(v + 1, c, SL, 0, 0, h, 0, 0.3); setV(v + 2, c, SL, 3, 0, 0, h, 0.3); idx.push(v, v + 1, v + 2); };
      for (let j = 0; j < nF; j++) triV(FB + j * 3, finC, 2.2);
      // one leg in spine space (side, up, forward), as seven triangles: thigh, shin, three claws
      const Hh1 = [0.3, -0.8, 0.9], Hh2 = [0.3, -0.8, -0.9], K1 = [2.7, -4.8, -0.3], K2 = [2.7, -4.8, -1.7], F1 = [2.0, -8.4, 1.5], F2 = [2.0, -8.4, 0.4];
      const legT = [Hh1, Hh2, K2, Hh1, K2, K1, K1, K2, F2, K1, F2, F1, F1, F2, [0.8, -10.0, 3.2], F1, F2, [2.0, -10.2, 3.4], F1, F2, [3.2, -10.0, 3.2]].flat();
      for (let l = 0; l < 4; l++) for (let t = 0; t < 7; t++) triV(LB + l * 21 + t * 3, t < 4 ? legC : finC, 1.2);
      const g = new THREE.BufferGeometry();
      const pa = new THREE.BufferAttribute(pos, 3); pa.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('position', pa); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nr, 3));
      g.setAttribute('aEdge', new THREE.BufferAttribute(ed, 3)); g.setAttribute('aCell', new THREE.BufferAttribute(cl, 4)); g.setIndex(idx);
      const dm = en.material({ pattern: 'tile', edge: true, patScale: 1.7, wire: 0.3, cellSize: 4, spec: 6, emissive: night ? 1.1 : 0.5 }); dm.uniforms.uFront = off4(); dm.uniforms.uShaft = off4();
      const body = new THREE.Mesh(g, dm); body.frustumCulled = false; scene.add(body);
      // the head, 22 m of it: a wedge snout over an open lower jaw, teeth, a red mouth, eyes under white brows, two
      // branching antlers, a mane of ruyi clumps, a beard, two long whiskers that sway, and the pearl it chases
      const hb = makeCells(), hc = mul(G, 1.2), wc = mul(W0, 0.95);
      const S = [[0, 2.7, 2.9, -1.0], [6.5, 2.5, 3.3, -0.7], [12.5, 1.7, 1.9, 0.0], [19, 1.15, 1.5, 0.45]];        // z, half width, top, jaw line
      for (let k = 0; k < 3; k++) {
        const [za, ha, ta, ja] = S[k], [zb, hb2, tb, jb] = S[k + 1];
        for (const sd of [-1, 1]) hb.quad([sd * ha, ja, za], [sd * hb2, jb, zb], [sd * hb2 * 0.8, tb, zb], [sd * ha * 0.8, ta, za], k % 2 ? hc : mul(hc, 0.86));
        hb.quad([-ha * 0.8, ta, za], [ha * 0.8, ta, za], [hb2 * 0.8, tb, zb], [-hb2 * 0.8, tb, zb], mul(hc, 1.1));
        if (k > 0) hb.quad([-ha, ja, za], [ha, ja, za], [hb2, jb, zb], [-hb2, jb, zb], mul(R, 1.1));
      }
      hb.quad([-1.15, 0.45, 19], [1.15, 0.45, 19], [0.92, 1.5, 19], [-0.92, 1.5, 19], mul(hc, 0.9));
      const J = [[3, 2.0, -1.2, -2.8], [10, 1.5, -3.0, -4.3], [16.5, 0.8, -4.6, -5.3]];                              // z, half width, upper, lower
      for (let k = 0; k < 2; k++) {
        const [za, ha, ua, la] = J[k], [zb, hb2, ub, lb] = J[k + 1];
        for (const sd of [-1, 1]) hb.quad([sd * ha, la, za], [sd * hb2, lb, zb], [sd * hb2, ub, zb], [sd * ha, ua, za], mul(hc, 0.8));
        hb.quad([-ha * 0.9, ua, za], [ha * 0.9, ua, za], [hb2 * 0.9, ub, zb], [-hb2 * 0.9, ub, zb], mul(R, 1.5));
        hb.quad([-ha, la, za], [ha, la, za], [hb2, lb, zb], [-hb2, lb, zb], mul(hc, 0.7));
      }
      hb.tri([0, -5.3, 15.5], [0, -4.6, 11.5], [0, -9.0, 10.5], wc, { sw: [0, 0, 0.5] });
      for (const sd of [-1, 1]) {
        for (const [tz, th, tj] of [[10, 2.05, -0.3], [12.5, 1.7, 0.0], [15, 1.48, 0.18], [17.2, 1.28, 0.33]]) hb.tri([sd * th, tj, tz], [sd * th, tj, tz + 1.2], [sd * th, tj - 1.4, tz + 0.6], mul(W0, 1.2));
        hb.tri([sd * 2.0, 3.3, 6.5], [sd * 2.4, 4.9, 4.2], [sd * 1.4, 3.2, 9.8], wc);
        const ex = sd * 2.42;
        hb.fan([ex, 1.8, 8.4], (sd > 0 ? [[1.0, 8.4], [1.8, 9.6], [2.6, 8.4], [1.8, 7.2]] : [[1.0, 8.4], [1.8, 7.2], [2.6, 8.4], [1.8, 9.6]]).map((q) => [ex, q[0], q[1]]), mul(W0, 1.3));
        hb.fan([ex + sd * 0.06, 1.8, 8.5], (sd > 0 ? [[1.4, 8.5], [1.8, 9.0], [2.2, 8.5], [1.8, 8.0]] : [[1.4, 8.5], [1.8, 8.0], [2.2, 8.5], [1.8, 9.0]]).map((q) => [ex + sd * 0.06, q[0], q[1]]), mul(R, 2.2));
        // antler: a beam in two lengths and two tines
        hb.quad([sd * 1.5, 3.0, 5.5], [sd * 1.9, 3.0, 4.2], [sd * 3.3, 8.8, -2.4], [sd * 3.0, 9.3, -1.2], wc);
        hb.quad([sd * 3.0, 9.3, -1.2], [sd * 3.3, 8.8, -2.4], [sd * 4.5, 12.6, -9.2], [sd * 4.3, 13.2, -8.6], wc);
        hb.tri([sd * 2.6, 7.4, 0.3], [sd * 2.9, 8.5, -0.9], [sd * 3.9, 12.6, 3.2], wc); hb.tri([sd * 3.5, 10.4, -4.0], [sd * 3.8, 11.3, -5.3], [sd * 5.0, 15.6, -2.4], wc);
        // whisker: a tapering ribbon 25 m long that trails back past the mane
        const WP = [[sd * 1.1, 0.7, 18.2, 0.42, 0], [sd * 4.6, 2.7, 15, 0.34, 0.5], [sd * 8.2, 2.2, 7, 0.22, 1.3], [sd * 10.8, -0.4, -5, 0.05, 2.5]];
        for (let k = 0; k < 3; k++) { const a = WP[k], b = WP[k + 1]; hb.quad([a[0], a[1] - a[3], a[2]], [b[0], b[1] - b[3], b[2]], [b[0], b[1] + b[3], b[2]], [a[0], a[1] + a[3], a[2]], mul(G, 1.5), { sw: [a[4], b[4], b[4], a[4]] }); }
      }
      for (let q = 0; q < 7; q++) {                                 // the mane
        const ang = -2.0 + q * 0.667, rx = Math.sin(ang), ry = Math.cos(ang), cz = -1.0 - (q % 2) * 1.8, size = 3.5 - (q % 2) * 0.5;
        const Bv = [rx * 0.55, ry * 0.55, -0.84], Nv = [rx * 0.84, ry * 0.84, 0.55], C = [rx * 2.6, ry * 2.6 + 0.6, cz];
        hb.fan(C, RIM.map((p) => [C[0] + (Bv[0] * p[1] + Nv[0] * p[0]) * size, C[1] + (Bv[1] * p[1] + Nv[1] * p[0]) * size, C[2] + (Bv[2] * p[1] + Nv[2] * p[0]) * size]), q % 2 ? CEL : wc, { sw: [0, 0.5] });
      }
      {                                                              // the pearl, with three small flames
        const pc = [2.8, 2.5, 1.7], oct = [0, 1, 2, 3, 4, 5, 6, 7].map((q) => [Math.sin(q / 8 * TAU) * 2.3, Math.cos(q / 8 * TAU) * 2.3]);
        hb.fan([0, 1.2, 30], oct.map((q) => [q[0], 1.2 + q[1], 30]), pc); hb.fan([0, 1.2, 30], oct.map((q) => [0, 1.2 + q[1], 30 + q[0]]), pc); hb.fan([0, 1.2, 30], oct.map((q) => [q[0], 1.2, 30 + q[1]]), pc);
        for (const [fy, fz] of [[3.0, 29.2], [2.2, 27.6], [0.6, 27.2]]) hb.tri([0, fy, fz], [0, fy - 1.2, fz - 0.9], [0, fy + 2.0, fz - 3.4], mul(R, 2.2), { sw: [0, 0, 0.6] });
      }
      const hm = en.material({ edge: true, sway: true, wire: 0.2, cellSize: 2.5, spec: 6, emissive: night ? 1.0 : 0.45 }); hm.uniforms.uFront = off4(); hm.uniforms.uShaft = off4();
      const head = new THREE.Mesh(hb.geo(), hm); head.frustumCulled = false; head.rotation.order = 'YXZ'; scene.add(head);
      // the crack it leaves: a pale ribbon revealed behind the tail, hair-thin where the track comes low over the bridge
      const TN = 220, tp = new Float32Array((TN + 1) * 6), ti = [];
      for (let i = 0; i <= TN; i++) { const f = Math.round(i / TN * DN), hw = 5 * clamp(dy[f] / 300, 0.1, 1) * (0.4 + 0.6 * Math.abs(Math.sin(i * 1.7))); for (let k = 0; k < 2; k++) { tp[(i * 2 + k) * 3] = dx[f]; tp[(i * 2 + k) * 3 + 1] = dy[f] + (k ? hw : -hw); tp[(i * 2 + k) * 3 + 2] = dz[f]; } if (i < TN) ti.push(i * 2, i * 2 + 2, i * 2 + 3, i * 2, i * 2 + 3, i * 2 + 1); }
      const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(tp, 3)); tg.setIndex(ti); tg.setDrawRange(0, 0);
      const trail = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ color: new THREE.Color(0.95, 0.93, 0.82).multiplyScalar(night ? 0.8 : 1.0), transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      trail.frustumCulled = false; trail.renderOrder = 1; scene.add(trail);
      const R1 = () => new Float32Array(SEG + 1);
      dragon = { dx, dy, dz, DN, len, sBridge, SEG, SL, pos, pa, head, tg, TN, w0, nF, FB, LB, legT, legRing: [8, 11, 30, 33], rx: R1(), ry: R1(), rz: R1(), rw: R1(), rsx: R1(), rsz: R1(), rf: R1() };
    }
    await ctx.yield();

    // ---- per-frame state (nothing below allocates) ----
    const PN = 512, pX = new Float32Array(PN + 1), pY = new Float32Array(PN + 1), pZ = new Float32Array(PN + 1);
    for (let i = 0; i <= PN; i++) { path.posAtDist(i / PN * PL, tmpA); pX[i] = tmpA.x; pY[i] = tmpA.y; pZ[i] = tmpA.z; }
    const pAt = (d, out) => {                         // path position at distance d (clamped), without allocating
      const f = clamp(d / PL, 0, 1) * PN, i = Math.min(PN - 1, Math.floor(f)), k = f - i;
      return out.set(lerp(pX[i], pX[i + 1], k), lerp(pY[i], pY[i + 1], k), lerp(pZ[i], pZ[i + 1], k));
    };
    const frontDir = new THREE.Vector2(-0.45, -0.89).normalize();
    pAt(0.55 * PL, tmpA); const front0 = tmpA.x * frontDir.x + tmpA.z * frontDir.y;
    const dummy = new THREE.Object3D(); dummy.rotation.order = 'YXZ';
    const mS = new THREE.Matrix4(), mT = new THREE.Matrix4(), vP = new THREE.Vector3(), vQ = new THREE.Vector3();
    const foldSteps = (k) => { const q = clamp(k, 0, 1) * 5, f = Math.min(4, Math.floor(q)); return (f + smoothstep(0.5, 1, q - f)) / 5; };   // batten by batten
    const swellAmp = U.uSea.value.x;
    const softMin = (a, b) => -18 * Math.log(Math.exp(-a / 18) + Math.exp(-b / 18));
    const placeJunk = (i, x, z, yaw, scale, ph, fold, time) => {
      const k = smoothstep(MOUTH_Z - 45, MOUTH_Z + 30, z);
      dummy.position.set(x, swellAt(x, z, time, swellAmp) * 0.55 - 0.2, z);
      dummy.rotation.set(Math.sin(time * 0.8 + ph) * (0.012 + 0.04 * k), yaw + Math.sin(time * 0.21 + ph) * 0.035, 0);
      dummy.scale.setScalar(scale); dummy.updateMatrix();
      hullMesh.setMatrixAt(i, dummy.matrix);
      mS.makeScale(1, fold, 1); mS.elements[13] = 3.4 * (1 - fold);
      mT.multiplyMatrices(dummy.matrix, mS); sailMesh.setMatrixAt(i, mT);
    };
    const alongPath = (d, lat, out) => {              // a point beside the path and the heading there (returned), no allocation
      pAt(d, vP); pAt(d + 2, vQ);
      let tx = vQ.x - vP.x, tz = vQ.z - vP.z; const l = Math.hypot(tx, tz);
      if (l < 1e-4) { pAt(d - 2, vQ); tx = vP.x - vQ.x; tz = vP.z - vQ.z; }
      const ll = Math.hypot(tx, tz) || 1;
      out.set(vP.x - tz / ll * lat, 0, vP.z + tx / ll * lat);
      return Math.atan2(tx, tz);
    };

    // the second companion: early on it cuts in across our starboard bow (72 m ahead and 46 m off at the entry, 50 m and
    // 24 m by u = 0.085), holds there, then surfs ahead to its old station between u = 0.15 and 0.26: it crosses the
    // line of the pagoda light while that is still small and is entering the mouth on our side of it, to the left of
    // the tower, while the tower grows (from u = 0.25 the tower stands clear). x = distance along the path, y = offset to starboard
    const c2a = new THREE.Vector2(), c2b = new THREE.Vector2();
    const comp2 = (uu, out) => {
      const a = smoothstep(0, 0.085, uu), b = 1 - smoothstep(0.15, 0.26, uu), dn = softMin(uu * PL + 85, 300 + 20 * smoothstep(0.4, 0.8, uu));
      const lat0 = 52 - 34 * smoothstep(105, 170, dn) + 29 * smoothstep(215, 330, dn);
      return out.set(dn - (13 + 22 * a) * b, lerp(lat0, 24, a * b) - 6 * (1 - a));
    };
    const vCam = new THREE.Vector3(), qCam = new THREE.Quaternion();
    function update(dt, time, camera, u) {
      // the camera behind a portal may have its world matrix set directly: read it in world space
      if (camera.isObject3D) { camera.getWorldPosition(vCam); camera.getWorldQuaternion(qCam); } else { vCam.copy(camera.position); qCam.copy(camera.quaternion); }
      const cp = vCam, d = u * PL;
      hero.setProgress(u); hero.update(dt, time, camera);
      U.uCam.value.set(cp.x, cp.z, u, 0);
      U.uFront.value.set(frontDir.x, frontDir.y, front0 + (u - 0.55) * 1300, 1);
      const sU = smoothstep(0.46, 0.8, u), sOn = smoothstep(0.44, 0.56, u), cx = lerp(-190, 0, sU);
      U.uShaftB.value.set(cx, BRIDGE_Z, 260, 0); U.uShaft.value.set(shaftN.x, shaftN.y, sOn, 24);
      shaft.position.set(cx, 0, BRIDGE_Z); shaftMat.uniforms.uOp.value = (night ? 0.2 : dawn ? 0.3 : 0.45) * sOn * (1 - smoothstep(0.9, 0.97, u));
      rayMat.uniforms.uOp.value = (night ? 0.2 : 0.85) * sOn * (1 - smoothstep(0.9, 0.97, u));
      skyMesh.position.copy(cp); skyMat.uniforms.uPatOffset.value.x = time * 3.2;
      if (eyeRing) eyeRing.position.set(cp.x, 0, cp.z);
      seaMesh.position.set(cp.x, 0, cp.z); seaMat.uniforms.uPatOffset.value.y = -time * (eye ? 1.1 : 2.6);
      rainMat.uniforms.uAmt.value = raining ? 1 : eye ? 0 : smoothstep(0.8, 0.92, u) * 0.9;
      lampBeams.rotation.y = time * 0.85;

      // our junk rides with the camera: a slow heave and a breath of pitch, never roll
      const seaK = smoothstep(MOUTH_Z - 45, MOUTH_Z + 30, cp.z);
      prow.position.copy(cp); prow.quaternion.copy(qCam);
      // seen through the previous portal (u is exactly 0 there) the junk is left out: the portal's plane would slice it
      prow.visible = u > 0;
      // the sail's inner edge sits 12 percent outside the frame's right edge whatever the shape of the screen; the
      // lantern mast sits at about four fifths of the half-width, and all of it inside the frame
      const hx = 1 / Math.max(camera.projectionMatrix ? camera.projectionMatrix.elements[0] : 0.936, 0.05);
      sailGrp.position.x = 1.12 * 2.74 * hx - 2.47;
      mastGrp.position.x = Math.min(0.8 * hx, 0.95 * hx - 0.17) * 2.6 - 2.05;
      mastGrp.visible = hx > 0.7;                       // a tall, narrow frame has the whole foredeck for a foreground: no mast there (meshes only)
      // the path climbs a little to meet the portal: the eye rises as if standing up, the hull stays nearer the water
      // (a third of the rise, so the deck keeps its place along the bottom of the frame); the rig does not move
      prow.position.y += Math.sin(time * 1.26) * (0.02 + 0.05 * seaK);
      hullGrp.position.y = -clamp(cp.y - EYE, 0, 1.8) * 0.3;
      prow.rotateX(Math.sin(time * 1.26 + 1.1) * (0.002 + 0.006 * seaK));
      sprayMesh.visible = seaK > 0.25;

      // the fleet
      for (let i = 0; i < hullMesh.count; i++) {
        const j = junks[i];
        if (j.kind === 0) {
          const s = Math.min(j.s0 + u * PL * j.spd, j.stop), f = clamp(s / laneLen, 0, 1) * LN, i0 = Math.min(LN - 1, Math.floor(f)), k = f - i0;
          const tx = laneX[i0 + 1] - laneX[i0], tz = laneZ[i0 + 1] - laneZ[i0], tl = Math.hypot(tx, tz) || 1;
          const lat = j.latFar * smoothstep(sMouth - 60, sMouth - 420, s) + j.latNear * smoothstep(sMouth + 25, sMouth + 95, s);
          const fold = j.moor ? 1 - 0.78 * foldSteps(smoothstep(j.stop - 95, j.stop - 6, s)) : 1;
          placeJunk(i, lerp(laneX[i0], laneX[i0 + 1], k) - tz / tl * lat, lerp(laneZ[i0], laneZ[i0 + 1], k) + tx / tl * lat, Math.atan2(tx, tz) + j.yaw, j.scale, j.ph, fold, time);
        } else if (j.kind === 1) {
          // the port companion: 60 m ahead of us all the way in through the mouth and up the harbour, 24 to 28 m to port
          // (whole in the left third of the frame), until she comes to anchor off the west jetty at path distance 340.
          // We close on her from u = 0.55, pass her close at 0.7, and her sails come down batten by batten as we do
          // (she draws 15 m further ahead while the path bends left round the mouth, u 0.38 to 0.6, so the bend does not carry her to the frame's edge)
          const dA = softMin(d + 60 + 15 * smoothstep(0.38, 0.48, u) * (1 - smoothstep(0.56, 0.64, u)), 340);
          const yaw = alongPath(dA, -(36 - 12 * smoothstep(110, 175, dA) + 4 * smoothstep(215, 250, dA)), tmpC);
          placeJunk(i, tmpC.x, tmpC.z, yaw, j.scale, j.ph, 1 - 0.78 * foldSteps(smoothstep(0.6, 0.78, u)), time);
        } else if (j.kind === 2) {
          comp2(u, c2a); comp2(u + 0.004, c2b);
          const yaw = alongPath(c2a.x, c2a.y, tmpC) - 0.7 * Math.atan2(c2b.y - c2a.y, Math.max(c2b.x - c2a.x, 0.3));   // it heads the way it moves
          placeJunk(i, tmpC.x, tmpC.z, yaw, j.scale, j.ph, 1 - 0.78 * foldSteps(smoothstep(0.56, 0.76, u)), time);
        } else placeJunk(i, j.x, j.z, j.yaw, j.scale, j.ph, 0.22, time);
      }
      hullMesh.instanceMatrix.needsUpdate = true; sailMesh.instanceMatrix.needsUpdate = true;

      // the cranes: they come up on the starboard side, cross the bow in a V behind their leader and fly on up the
      // harbour (13 m ahead rising to 55, 25 m to starboard sliding to port, climbing); parked under the sea otherwise
      {
        const A = craneAttr.array, t = (u - 0.14) / 0.22, on = t > 0 && t < 2.1, ex = Math.max(0, t - 1);
        const cl = 13 + 22 * t, ct = 25 - 49 * t - 30 * ex * ex, chd = Math.atan2(49 + 60 * ex, 126.3);
        for (let k = 0; k < NCR; k++) {
          const r = (k + 1) >> 1, sd = k % 2 ? 1 : -1;
          if (on) {
            const yaw = alongPath(d + cl - r * 3.2, ct + sd * r * 3.8, tmpC);
            A[k * 4] = tmpC.x; A[k * 4 + 1] = EYE + 9 + 4 * t + sd * r * 0.3; A[k * 4 + 2] = tmpC.z; A[k * 4 + 3] = yaw + chd;
          } else A[k * 4 + 1] = -80;
        }
        craneAttr.needsUpdate = true;
      }

      // sampans rocking at their moorings
      for (let m = 0; m < sampanMeshes.length; m++) {
        const mesh = sampanMeshes[m], list = mesh.userData.list;
        for (let i = 0; i < list.length; i++) {
          const s = list[i];
          dummy.position.set(s.x, swellAt(s.x, s.z, time, swellAmp) * 0.6 + 0.02, s.z);
          dummy.rotation.set(Math.sin(time * 0.9 + s.ph) * 0.03, s.yaw + Math.sin(time * 0.17 + s.ph) * 0.05, Math.sin(time * 1.25 + s.ph * 2) * 0.07);
          dummy.scale.setScalar(1); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }

      // the dragon: on the crest at the entry, fast along the wall, then slower over the bridge as we reach it
      if (dragon) {
        const D = dragon, P = D.pos, rx = D.rx, ry = D.ry, rz = D.rz, rw = D.rw, rsx = D.rsx, rsz = D.rsz, rf = D.rf;
        const sHead = lerp(420 + (D.sBridge - 720) * u / 0.7, D.sBridge - 300 + 2500 * (u - 0.7), smoothstep(0.6, 0.8, u));
        for (let i = 0; i <= D.SEG; i++) {
          const s = clamp(sHead - i * D.SL, 0, D.len - 1), f = s / D.len * D.DN, i0 = Math.min(D.DN - 1, Math.floor(f)), k = f - i0;
          const tx = D.dx[i0 + 1] - D.dx[i0], tz = D.dz[i0 + 1] - D.dz[i0], tl = Math.hypot(tx, tz) || 1, wave = i * 0.42 - time * 2.4;
          const bx = lerp(D.dx[i0], D.dx[i0 + 1], k), by = lerp(D.dy[i0], D.dy[i0 + 1], k), bz = lerp(D.dz[i0], D.dz[i0 + 1], k);
          const far = clamp(Math.hypot(bx - cp.x, by - cp.y, bz - cp.z) / 420, 1, 4.5);   // it stays readable while it is still on the wall
          const amp = Math.min(1, i / 6) * far, sl = Math.sin(wave) * 7 * amp, sv = Math.cos(wave * 0.8) * 4.5 * amp, sxn = tz / tl, szn = -tx / tl;
          const x = bx + sxn * sl, y = by + sv, z = bz + szn * sl, w = D.w0[i] * far, o = i * 21;
          P[o] = x + sxn * w; P[o + 1] = y; P[o + 2] = z + szn * w; P[o + 3] = x; P[o + 4] = y; P[o + 5] = z; P[o + 6] = x - sxn * w; P[o + 7] = y; P[o + 8] = z - szn * w;
          P[o + 9] = x; P[o + 10] = y + w; P[o + 11] = z; P[o + 12] = x; P[o + 13] = y; P[o + 14] = z; P[o + 15] = x; P[o + 16] = y; P[o + 17] = z; P[o + 18] = x; P[o + 19] = y - w; P[o + 20] = z;
          rx[i] = x; ry[i] = y; rz[i] = z; rw[i] = w; rsx[i] = sxn; rsz[i] = szn; rf[i] = far;
          if (i === 0) {
            D.head.position.set(x, y, z); D.head.scale.setScalar(far);
            D.head.rotation.set(-Math.atan2(D.dy[i0 + 1] - D.dy[i0], tl) * 0.8 + Math.sin(time * 1.3) * 0.05, Math.atan2(tx, tz) + Math.sin(time * 0.9) * 0.06, 0);
          }
        }
        for (let j = 0; j < D.nF; j++) {                    // dorsal fins, swept back
          const i = 1 + j * 2, o = (D.FB + j * 3) * 3;
          P[o] = rx[i]; P[o + 1] = ry[i] + rw[i] * 0.9; P[o + 2] = rz[i];
          P[o + 3] = rx[i + 1]; P[o + 4] = ry[i + 1] + rw[i + 1] * 0.9; P[o + 5] = rz[i + 1];
          P[o + 6] = rx[i + 1]; P[o + 7] = ry[i + 1] + rw[i + 1] + (1.4 + 0.9 * D.w0[i]) * rf[i]; P[o + 8] = rz[i + 1];
        }
        for (let l = 0; l < 4; l++) {                       // legs, paddling a little
          const i = D.legRing[l], sd = l % 2 ? -1 : 1, o = (D.LB + l * 21) * 3, fk = rf[i], fx = -rsz[i], fz = rsx[i], pd = Math.sin(time * 2.4 + l * 1.7) * 1.2;
          for (let v = 0; v < 21; v++) {
            const a = D.legT[v * 3] * sd * fk, b2 = D.legT[v * 3 + 1] * fk, c = (D.legT[v * 3 + 2] + pd * Math.min(1, -D.legT[v * 3 + 1] / 8)) * fk;
            P[o + v * 3] = rx[i] + rsx[i] * a + fx * c; P[o + v * 3 + 1] = ry[i] + b2; P[o + v * 3 + 2] = rz[i] + rsz[i] * a + fz * c;
          }
        }
        D.pa.needsUpdate = true;
        D.tg.setDrawRange(0, clamp(Math.floor((sHead - 410) / D.len * D.TN), 0, D.TN) * 6);
      }
    }
    update(0, 0, { position: path.start, quaternion: new THREE.Quaternion() }, 0);

    return {
      scene, path, duration: TRIP,
      // the surge through the mouth on a following sea, then slower among the sampans; near 1 over the approach
      pace: (uu) => 1 + 0.28 * Math.exp(-Math.pow((uu - 0.32) / 0.09, 2)) - 0.08 * smoothstep(0.42, 0.55, uu) * (1 - smoothstep(0.75, 0.88, uu)),
      title: look.title + (rare ? ': the Dragon' : raining ? ' in Rain' : eye ? ': the Eye' : season === 'newyear' ? ' at New Year' : ''),
      ride: 'none', style: 'none',
      // nearThrough: the path starts 3.2 m above the sea, lower than the opening is tall: seen through the previous
      // portal the sea in front of the entry is drawn too (the sea follows the camera; our junk is hidden while u is 0)
      camera: { fov: 62, near: 0.3, nearThrough: 0.3, far: 9000, lookAhead: 22, sway: 0.3, bank: 0 },
      pois: [
        { at: hubW, from: -0.06, to: 0.15, weight: 0.55, fade: 0.3 },             // the storm spiral (already full at the entry)
        { at: [40, 27, MOUTH_Z], from: 0.11, to: 0.38, weight: 0.6, fade: 0.3 },   // the pagoda light, from the turn toward it
        { at: [0, PORTAL_Y, BRIDGE_Z], from: 0.58, to: 1, weight: 0.7, fade: 0.25 },      // the bridge and the portal
      ],
      portal: { shape: 'circle', radius: PORTAL_R, color: look.portal, glow: 1.15 },
      post: {
        exposure: look.exposure,
        bloom: { strength: look.bloom, radius: 0.6, threshold: 1.0 },
        grade: { saturation: 1.08, contrast: 1.05, tint: '#ffffff', shadowTint: night ? '#04081c' : '#000000', vignette: 0.28, grain: 0.015, aberration: 0 },
      },
      update,
      dispose() { hero.dispose?.(); },
    };
  },
};
