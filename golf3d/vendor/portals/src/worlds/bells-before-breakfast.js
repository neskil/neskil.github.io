// BELLS BEFORE BREAKFAST: the world file. A great house of pale stone at first light is being woken from the bottom up.
// The flight comes in on a slant from high over a misty park, goes in at the open front door, through a great hall
// and a row of three state rooms whose doors stand in one line, out over a vaulted kitchen and down a white passage
// to a wall of sprung bells round the way out.
//
// THREE SOURCE FILES, joined only at two planes:
//   src/parts/bells-before-breakfast.js        buildHero(ctx, opts)    the outside: everything south of z -12.5 and the sky
//   src/parts/bells-before-breakfast-below.js  buildBelow(ctx, {z0})   below stairs: everything north of z0
//   this file: the route, pace, looks, post, THE GREAT HALL, THE ROW OF THREE STATE ROOMS (rooms of the kit), the joining,
//   fog and light by the lens's place, visibility by place, update and dispose.
// AXES: x runs east, y up, z south; the flight goes north toward minus z. Lawn y 0, state floor y 3.
// The world sets neither portal.drawWithin nor portal.drawIn: the arch of the way out is whole at every metre.
// WHAT STANDS BY PLACE: the front door and every door of the row stand open from build on, each leaf folded back flat
// against the wall beside its doorway; no leaf moves and none reads the lens, the clock or metres flown. Every shutter
// stands as it stands (open in the hall and saloon, the drawing room's last pair shut, about half the library's shut:
// the library wakes last, by its shutters); fires, lamps, clocks and the globe run on the world's clock. update()
// reads the lens's place for fog and light across the front door and for what is drawn (a thing goes off behind the
// lens beyond a wall; the near group of below stairs comes on where no straight line through the library's north
// doorway reaches any of it), never metres flown, never the clock.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as INT from '../kit/interior.js';

import { buildHero } from '../parts/bells-before-breakfast.js';
import { buildBelow } from '../parts/bells-before-breakfast-below.js';

const PI = Math.PI, TAU = PI * 2, V3 = THREE.Vector3;
// levels and the planes of the design's plan (metres): the hall from z -12.5 to z -52, x -17 to 17, 17 m to the wall
// head and 26 m to the ridge; its north wall 4 m thick, z -52 to z -56, with the first door through it
const FLOOR = 3, DOOR_Z = -12.5, HALL_L = 39.5, HALL_W = 34, HALL_WALL = 17, HALL_RIDGE = 26, HALL_TH = 4;
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, seg = 8, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
const sph = (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);
const lathe = (pts, seg = 12) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(Math.max(p[0], 1e-4), p[1])), seg);
const S_WOOD = INT.surf(1, 0.4), S_WOODM = INT.surf(1, 0.18), S_BRASS = INT.surf(0, 0.78, 1), S_GILT = INT.surf(0, 0.6, 1), S_STONE = INT.surf(3, 0.14);
const S_MATTE = INT.surf(0, 0.06), S_FABRIC = INT.surf(2, 0.04), S_PEWTER = INT.surf(0, 0.6, 0.85), S_ENAMEL = INT.surf(0, 0.7);
const OAK = '#6a4e38', OAK_D = '#463224', OAK_L = '#8c6c4c', STONE = '#cfc3a8', STONE_D = '#a89c84', GILT = '#c9a148', PLASTER = '#e9e0cc';

// what each hour gives the state floor (the look is first light by design; the others are honoured plainly)
const HOURS = {
  dawn: { sun: '#ffc27a', sunI: 17, el: [13, 17], amb: 2.5, skyI: 5.5, sky: '#c6d4ee', ambSky: '#8f8a92', ambGround: '#d8a878', lamp: 1, pane: { zenith: '#9fc0e8', horizon: '#f4c9a4', ground: '#44605f', cloud: '#f29a8c' } },
  day: { sun: '#fff0d8', sunI: 15, el: [28, 34], amb: 2.7, skyI: 7, sky: '#cfe0ff', ambSky: '#a0a8b4', ambGround: '#d8c0a0', lamp: 0.7, pane: { zenith: '#8fb4e8', horizon: '#dfeaf6', ground: '#5a7a52', cloud: '#ffffff' } },
  golden: { sun: '#ffb060', sunI: 0, el: [12, 16], amb: 3.0, skyI: 7.5, sky: '#f0cfa8', ambSky: '#a89484', ambGround: '#e0a870', lamp: 1.3, pane: { zenith: '#9aa8d0', horizon: '#ffcf96', ground: '#4c5c44', cloud: '#ffc890' } },
  night: { sun: '#c8d4ff', sunI: 0, el: [20, 24], amb: 2.5, skyI: 2.4, sky: '#5870b0', ambSky: '#4a4f6a', ambGround: '#c08858', lamp: 1.9, pane: { zenith: '#0c1430', horizon: '#243460', ground: '#101820', cloud: '#40507a' } },
};

// THE EAST WINDOWS, one law for the hall and every state room.
// An open window shows the park painted in its panes (the law of the park in the panes, below); the kit's own pane
// lies behind that view at PANE of the hour's sky colour, its sun's glow GLOW at most. The glazing bars stand in dark
// lead (their width is the kit's, so the sun pools on the floor keep the bars' shadows as they were). A stone mullion (MULLION wide, MULLION_D deep, against the glass) stands at each division
// of the window's width and a stone transom at TRANSOM of its height. A shaft adds SHAFT at most (of full white,
// before the lens's exposure), and that only along a line that runs straight up it into the sun: the kit's beam at
// its greatest is gain x sun x 3.42 (streak 1.45, dust 1.18, forward scatter 2.0); across the sun's line it adds
// 0.15 of that. DENS makes it an even soft beam. The blades through a shut window's cracks are the same beams,
// thinner. The sun pools on the floor are the rig's own and are not touched.
const PANE = 1.1, GLOW = 0.4, SHAFT = 0.25, DENS = 0.25, LEAD = '#2a2824', MULLION = 0.24, MULLION_D = 0.3, TRANSOM = 2 / 3;
function eastLight(H, skyI, sunK, dust) {
  const c = new THREE.Color(H.sun), sun = Math.max(c.r, c.g, c.b) * H.sunI * sunK;
  return { outdoor: H.pane, frost: 0.22, scroll: 0.02, frameColor: LEAD, paneGain: PANE / skyI, glare: sun > 0 ? GLOW / (0.22 * sun) : 0,
    shaftGain: sun > 0 ? SHAFT / (3.42 * sun) : 0, shaftDensity: DENS, ...dust };
}
// a flat piece: corner o, edges u and v, its face turned to the side n points to
function piece(b, o, u, v, n, c, surf) {
  const p1 = [o[0] + u[0], o[1] + u[1], o[2] + u[2]], p3 = [o[0] + v[0], o[1] + v[1], o[2] + v[2]], p2 = [p1[0] + v[0], p1[1] + v[1], p1[2] + v[2]];
  const cx = u[1] * v[2] - u[2] * v[1], cy = u[2] * v[0] - u[0] * v[2], cz = u[0] * v[1] - u[1] * v[0];
  if (cx * n[0] + cy * n[1] + cz * n[2] >= 0) b.quad(o, p1, p2, p3, c, surf); else b.quad(o, p3, p2, p1, c, surf);
}
// a flat four-cornered piece given by its corners in order, its face turned to the side n points to
function face(b, p0, p1, p2, p3, n, c, surf) {
  const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p3[0] - p0[0], vy = p3[1] - p0[1], vz = p3[2] - p0[2];
  if ((uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2] >= 0) b.quad(p0, p1, p2, p3, c, surf); else b.quad(p0, p3, p2, p1, c, surf);
}

// THE PARK IN THE PANES, one law for every open window of the hall and the row. Just inside the glass each window
// carries a painted view of the park by the hour, in flat pieces made once at build. Above the horizon the hour's own
// sky colours in four bands, deepest at the top and palest at the horizon, the lowest two warmed with the sun's colour
// by how squarely the window faces the sun. Below it the park in two quiet tones: lawn nearer, darker woods further,
// and along the horizon a skyline of tree crowns dealt once for the window from a stream named by the window's own
// place. The horizon stands at HORIZON above the state floor in every window. The view glows by itself at VIEW of its
// colours as painted, whatever light the room takes: under white, and under the lens's bloom (threshold 0.95), so no
// pane blooms. Over it the glazing bars at the kit's own divisions and width, in lead; before it the window's stone.
const VIEW = 0.8, HORIZON = 2.5, UNLIT = 0.03;
function paneView(b, sr, c, k) {
  const win = sr.win, H = sr.hour, ax = win.axis, nrm = win.normal, hw = win.w / 2, D = sr.openRow.depth ?? 0, n = [nrm.x, 0, nrm.z];
  const y0 = c.y - win.h / 2, y1 = c.y + win.h / 2, yh = clamp(HORIZON, y0, y1), hs = y1 - yh, GLOWS = INT.surf(0, 0, 0, VIEW / UNLIT);
  const pt = (u, y, d) => [c.x + ax.x * u - nrm.x * (D - d), y, c.z + ax.z * u - nrm.z * (D - d)], C = (hex) => new THREE.Color(hex);
  const F = (uL, uR, ya, yb, d, col, sf) => { if (yb > ya && uR > uL) face(b, pt(uL, ya, d), pt(uR, ya, d), pt(uR, yb, d), pt(uL, yb, d), n, col, sf); };
  const L = sr.rig.state.sunDir, warm = H.sunI > 0 ? 0.4 * clamp(-(L.x * nrm.x + L.z * nrm.z), 0, 1) : 0;
  const zen = C(H.pane.zenith), hor = C(H.pane.horizon), gnd = C(H.pane.ground), sun = C(H.sun), tone = (col) => col.clone().multiplyScalar(UNLIT);
  // the sky: four bands up from the horizon
  F(-hw, hw, yh, yh + 0.14 * hs, 0.04, tone(hor.clone().lerp(sun, warm)), GLOWS);
  F(-hw, hw, yh + 0.14 * hs, yh + 0.38 * hs, 0.04, tone(hor.clone().lerp(zen, 0.33).lerp(sun, warm / 2)), GLOWS);
  F(-hw, hw, yh + 0.38 * hs, yh + 0.68 * hs, 0.04, tone(hor.clone().lerp(zen, 0.69)), GLOWS);
  F(-hw, hw, yh + 0.68 * hs, y1, 0.04, tone(zen), GLOWS);
  // the park: lawn nearer, woods further
  F(-hw, hw, y0, yh - 0.5, 0.04, tone(gnd.clone().lerp(hor, 0.18)), GLOWS);
  F(-hw, hw, Math.max(y0, yh - 0.5), yh, 0.04, tone(gnd.clone().multiplyScalar(0.6)), GLOWS);
  // the skyline: round crowns side by side, each two pieces; every draw is taken for every crown. A crown rises 0.9 to
  // 2.4 m over the horizon: park trees 18 to 24 m tall, 150 to 300 m from the house, as they stand in a pane from the
  // room's middle line, 15 m within the glass
  const rng = sr.paneRng(k), N = Math.max(3, Math.round(win.w / 1.2)), cell = win.w / N;
  for (let i = 0; i < N; i++) {
    const u = -hw + (i + 0.5 + rng.range(-0.3, 0.3)) * cell, a = rng.range(0.55, 0.95) * cell, r = rng.range(0.9, 2.4), t = rng.range(0.45, 0.75);
    const uL = Math.max(-hw, u - a), uR = Math.min(hw, u + a), wd = uR - uL, top = Math.min(y1, yh + r), mid = yh + (top - yh) * 0.6, col = tone(gnd.clone().multiplyScalar(t));
    if (wd <= 0 || top <= yh) continue;
    face(b, pt(uL, yh, 0.09), pt(uR, yh, 0.09), pt(uR - 0.12 * wd, mid, 0.09), pt(uL + 0.12 * wd, mid, 0.09), n, col, GLOWS);
    face(b, pt(uL + 0.12 * wd, mid, 0.09), pt(uR - 0.12 * wd, mid, 0.09), pt(uR - 0.33 * wd, top, 0.09), pt(uL + 0.33 * wd, top, 0.09), n, col, GLOWS);
  }
  // the glazing bars across, at the kit's own divisions and of the kit's own width (the bars up are the stone's)
  const m = sr.openRow.mullions[1], bar = sr.openRow.bar;
  for (let q = 1; q < m; q++) F(-hw, hw, y0 + q * win.h / m - bar, y0 + q * win.h / m + bar, 0.14, LEAD, S_MATTE);
}

// THE RECESS OF A WINDOW, one law for every window of the hall and the row. The recess's own faces (its two sides,
// its sill and its head) are the house's stone in shade: thin faces of this file, 0.05 m inside the kit's, from dn
// (the glass, or a shut window's leaves) to the room's wall face. Like the view they glow by themselves,
// at SHADE of the view's level, in the stone's colour under the hour's horizon sky: half the painted sky at most,
// whatever light the room takes. They darken toward the glass (by 0.4 over the wall's depth, a step to each metre)
// and carry the ashlar's joints: a bed joint at each COURSE up the sides, a cross joint to each 1.2 m of the sill
// and of a flat head; a round head is told in voussoirs. Made once at build; it reads no lens and no clock.
const SHADE = 0.5, COURSE = 0.6, JOINT = 0.03;
function recess(b, sr, c, dn) {
  const win = sr.win, ax = win.axis, nrm = win.normal, hw = win.w / 2 - 0.05, D = sr.openRow.depth ?? 0;
  if (D - dn < 0.05) return;
  const y0 = c.y - win.h / 2 + 0.05, y1 = c.y + win.h / 2 - 0.05, ys = sr.arch === 1 ? c.y + win.h / 2 - win.w / 2 : y1;
  const pt = (u, y, d) => [c.x + ax.x * u - nrm.x * (D - d), y, c.z + ax.z * u - nrm.z * (D - d)], GLOWS = INT.surf(0, 0, 0, VIEW / UNLIT);
  const stone = new THREE.Color(STONE).multiply(new THREE.Color(sr.hour.pane.horizon)).multiplyScalar(UNLIT * SHADE), joint = stone.clone().multiplyScalar(0.45);
  const nd = Math.max(1, Math.round(D - dn)), step = (D - dn) / nd;
  // a face along the depth between two points [u, y] of the recess's outline, turned to n, in nd steps of tone
  const run = (p, q, n, k) => { for (let i = 0; i < nd; i++) { const d0 = dn + i * step, d1 = d0 + step;
    face(b, pt(p[0], p[1], d0), pt(q[0], q[1], d0), pt(q[0], q[1], d1), pt(p[0], p[1], d1), n, stone.clone().multiplyScalar(k * (1 - 0.4 * (1 - (d0 + d1) / 2 / D))), GLOWS); } };
  const line = (p, q, n) => face(b, pt(p[0], p[1], dn), pt(q[0], q[1], dn), pt(q[0], q[1], D), pt(p[0], p[1], D), n, joint, GLOWS);
  for (const e of [-1, 1]) {
    const n = [-e * ax.x, 0, -e * ax.z];
    run([e * hw, y0], [e * hw, ys], n, 1);
    for (let y = y0 + COURSE; y < ys - JOINT; y += COURSE) line([e * (hw - 0.05), y], [e * (hw - 0.05), y + JOINT], n);
  }
  const N = Math.max(2, Math.round(win.w / 1.2));
  run([-hw, y0], [hw, y0], [0, 1, 0], 1);
  for (let q = 1; q < N; q++) { const u = -hw + q * 2 * hw / N; line([u - JOINT / 2, y0 + 0.05], [u + JOINT / 2, y0 + 0.05], [0, 1, 0]); }
  if (sr.arch === 1) for (let i = 0; i < 24; i++) {
    const a0 = i * PI / 24, a1 = a0 + PI / 24, am = (a0 + a1) / 2;
    run([Math.cos(a0) * hw, ys + Math.sin(a0) * hw], [Math.cos(a1) * hw, ys + Math.sin(a1) * hw], [-Math.cos(am) * ax.x, -Math.sin(am), -Math.cos(am) * ax.z], (i >> 1) % 2 ? 0.9 : 1);
  } else {
    run([-hw, y1], [hw, y1], [0, -1, 0], 1);
    for (let q = 1; q < N; q++) { const u = -hw + q * 2 * hw / N; line([u - JOINT / 2, y1 - 0.05], [u + JOINT / 2, y1 - 0.05], [0, -1, 0]); }
  }
}

// A DOORWAY OF THE HALL OR THE ROW, one rule. The wall stands from zf (the face of the room its leaves open into) to
// zf - dep. THE REVEAL belongs to the room the doorway leads into and is cased as that room's own door case is: pale
// painted joinery in that room's door-case colour (o.pale), three tall raised panels a side (one column to each 2 m
// of the wall's depth), each told only by a thin bevel of light and shade (field and rail within a tenth of each
// other) and a slender gilt bead round it; the soffit the same, three across. No dark rail, no chequer. Where the
// doorway passes a screen of oak (o.oak) the lining is oak for the screen's own thickness and pale behind it. All of
// it flat pieces 0.03 m off the wall's own reveal, so nothing stands in the opening. THE ARCHITRAVE is moulded:
// a raised bead along the outer edge of the door's casing (cx its outer edge, cz its front, ch its top, cc its
// colour) and, where the casing has a head board of its own (hz its front), across that; where an entablature is
// the head, that is its moulding. THE LEAVES are made with the room's works: each lies folded right back, flat on
// the face zf, a half turn from shut, clear of the opening by the casing (three tall panels and a knob: a leaf is
// known by them); no leaf stands in a doorway or beside the flown line.
function doorway(b, o) {
  const { hw, h, zf, dep } = o, lap = o.lap ?? 0, xr = hw - 0.03, zA = zf + lap, zB = zf - dep - lap, zP = o.oak ? zf : zA, P = new THREE.Color(o.pale);
  const nc = Math.max(1, Math.round((zP - zB) / 2)), light = P.clone().lerp(new THREE.Color('#ffffff'), 0.5), shade = P.clone().multiplyScalar(0.8), field = P.clone().multiplyScalar(0.96);
  // one cased face of U by V (corner og, edges along eu and ev, turned to n): the pale board and cu by cv raised panels,
  // each a slender gilt bead, a thin bevel (light on its upper and its first side, shade on the two others) and its field
  const cased = (og, eu, ev, n, U, V, cu, cv) => {
    const R = (u0, u1, v0, v1, up, c, sf) => piece(b, [og[0] + eu[0] * u0 + ev[0] * v0 + n[0] * up, og[1] + eu[1] * u0 + ev[1] * v0 + n[1] * up, og[2] + eu[2] * u0 + ev[2] * v0 + n[2] * up],
      [eu[0] * (u1 - u0), eu[1] * (u1 - u0), eu[2] * (u1 - u0)], [ev[0] * (v1 - v0), ev[1] * (v1 - v0), ev[2] * (v1 - v0)], n, c, sf);
    R(0, U, 0, V, 0, P, S_MATTE);
    const m = 0.2, g = 0.03, bv = 0.06;
    for (let i = 0; i < cu; i++) for (let j = 0; j < cv; j++) {
      const u0 = i * U / cu + m, u1 = (i + 1) * U / cu - m, v0 = j * V / cv + m, v1 = (j + 1) * V / cv - m;
      R(u0 - g, u1 + g, v0 - g, v0, 0.01, GILT, S_GILT); R(u0 - g, u1 + g, v1, v1 + g, 0.01, GILT, S_GILT); R(u0 - g, u0, v0, v1, 0.01, GILT, S_GILT); R(u1, u1 + g, v0, v1, 0.01, GILT, S_GILT);
      R(u0, u1, v1 - bv, v1, 0.02, light, S_MATTE); R(u0, u0 + bv, v0 + bv, v1 - bv, 0.02, light, S_MATTE); R(u0, u1, v0, v0 + bv, 0.02, shade, S_MATTE); R(u1 - bv, u1, v0 + bv, v1 - bv, 0.02, shade, S_MATTE);
      R(u0 + bv, u1 - bv, v0 + bv, v1 - bv, 0.03, field, S_MATTE);
    }
  };
  for (const s of [-1, 1]) {
    cased([s * xr, 0, zP], [0, 0, -1], [0, 1, 0], [-s, 0, 0], zP - zB, h, nc, 3);
    if (o.oak) piece(b, [s * xr, 0, zf], [0, 0, zA - zf], [0, h, 0], [-s, 0, 0], OAK, S_WOOD);
  }
  cased([-hw, h - 0.03, zP], [1, 0, 0], [0, 0, -1], [0, -1, 0], 2 * hw, zP - zB, 3, nc);
  if (o.oak) piece(b, [-hw, h - 0.03, zf], [2 * hw, 0, 0], [0, 0, zA - zf], [0, -1, 0], OAK, S_WOOD);
  // the bead of the architrave: 0.12 wide, 0.06 proud of the casing: its face and its two cheeks
  const bw = 0.12, bp = 0.06, zc = o.cz, F = [0, 0, 1];
  for (const s of [-1, 1]) {
    const x0 = s * (o.cx - bw), x1 = s * o.cx;
    piece(b, [x0, 0, zc + bp], [x1 - x0, 0, 0], [0, o.ch, 0], F, o.cc, S_WOODM);
    piece(b, [x0, 0, zc], [0, 0, bp], [0, o.ch, 0], [-s, 0, 0], o.cc, S_WOODM); piece(b, [x1, 0, zc], [0, 0, bp], [0, o.ch, 0], [s, 0, 0], o.cc, S_WOODM);
  }
  if (o.hz == null) return;
  piece(b, [-o.cx, o.ch, zc + bp], [2 * o.cx, 0, 0], [0, bw, 0], F, o.cc, S_WOODM);
  piece(b, [-o.cx, o.ch, o.hz], [2 * o.cx, 0, 0], [0, 0, zc + bp - o.hz], [0, -1, 0], o.cc, S_WOODM); piece(b, [-o.cx, o.ch + bw, o.hz], [2 * o.cx, 0, 0], [0, 0, zc + bp - o.hz], [0, 1, 0], o.cc, S_WOODM);
}

// AN OVERMANTEL LOOKING-GLASS, one rule for any in the row. A dim silvered plate on a chimney breast, facing the room:
// the silvering's own tone, darker toward the edges in two steps (to 0.3 m and to 0.7 m from the frame). It carries a
// likeness of the lights that face it, all at one scale about its own middle: the scale at which one who stands on
// the room's long axis gets the window wall in it (the plate's distance from that axis over the sum of that and its
// distance from the window wall). Each east window that falls within its clear field: an open one in the hour's sky
// colour at the pane's brightness less what the silvering keeps back (SILVERED), its stone mullions and transom dark
// across it; a shut one dark in its leaves' colour with its bright seam. And every candle flame of the room's
// chandeliers that falls within it: a small glint of the flame's own size at that scale. Flat pieces made once at
// build: it reads no lens and no clock.
// o: { x, y, z: the plate's middle; w, h; win, shut: the room's east windows; lights: an open window's lights across;
// sky: the hour's sky colour; leaf: the shutters' colour; items: the room's placed furniture }
const SILVERED = 0.5;
function overmantelGlass(b, o) {
  const f = o.x < 0 ? 1 : -1, N = [f, 0, 0], SILVER = INT.surf(0, 0.9, 0.7), y0 = o.y - o.h / 2, y1 = o.y + o.h / 2, z0 = o.z - o.w / 2, z1 = o.z + o.w / 2;
  const P = (d, ya, yb, za, zb, c, sf) => { if (yb > ya && zb > za) piece(b, [o.x + f * d, ya, za], [0, 0, zb - za], [0, yb - ya, 0], N, c, sf); };
  P(0.05, y0, y1, z0, z1, '#22272a', SILVER); P(0.055, y0 + 0.3, y1 - 0.3, z0 + 0.3, z1 - 0.3, '#333c42', SILVER); P(0.06, y0 + 0.7, y1 - 0.7, z0 + 0.7, z1 - 0.7, '#454f56', SILVER);
  // the clear field inside the dark edge: every likeness is cut to it
  const ya = y0 + 0.3, yb = y1 - 0.3, za = z0 + 0.3, zb = z1 - 0.3, win = o.win, a = Math.abs(o.x), K = win ? a / (a + Math.abs(win.first.x - o.x)) : 0.5;
  const iy = (y) => o.y + K * (y - o.y), iz = (z) => o.z + K * (z - o.z), dim = (c, k) => new THREE.Color(c).multiplyScalar(k);
  const C = (d, a0, a1, c0, c1, c, sf) => P(d, Math.max(ya, a0), Math.min(yb, a1), Math.max(za, c0), Math.min(zb, c1), c, sf);
  const isShut = new Set((o.shut || []).map((q) => q.k));
  if (win) for (let k = 0; k < win.n; k++) {
    const c = win.first.clone().addScaledVector(win.axis, k * win.sp), hw = K * win.w / 2, hh = K * win.h / 2, cy = iy(c.y), cz = iz(c.z), t = K * MULLION / 2;
    if (isShut.has(k)) { C(0.065, cy - hh, cy + hh, cz - hw, cz + hw, dim(o.leaf, SILVERED), SILVER); C(0.07, cy - hh, cy + hh, cz - K * 0.025, cz + K * 0.025, '#ffd9a0', INT.surf(0, 0.1, 0, 5 * SILVERED)); continue; }
    C(0.065, cy - hh, cy + hh, cz - hw, cz + hw, dim(o.sky, 0.2), INT.surf(0, 0.9, 0, VIEW * SILVERED / 0.2));
    for (let q = 1; q < o.lights; q++) { const u = cz - hw + q * 2 * hw / o.lights; C(0.07, cy - hh, cy + hh, u - t, u + t, dim(STONE_D, SILVERED), SILVER); }
    C(0.07, cy + (TRANSOM - 0.5) * 2 * hh - t, cy + (TRANSOM - 0.5) * 2 * hh + t, cz - hw, cz + hw, dim(STONE_D, SILVERED), SILVER);
  }
  const GLINT = INT.surf(0, 0.1, 0, 6 * SILVERED);
  for (const it of o.items || []) {
    if (it.kind !== 'chandelier' || !it.userData.flames) continue;
    const cs = Math.cos(it.rotation), sn = Math.sin(it.rotation);
    for (const fl of it.userData.flames) {
      const fy = iy(it.position[1] + fl[1]), fz = iz(it.position[2] - fl[0] * sn + fl[2] * cs), gh = K * fl[3], gw = gh / 4;
      if (fy >= ya && fy + gh <= yb && fz - gw >= za && fz + gw <= zb) P(0.075, fy, fy + gh, fz - gw, fz + gw, '#ffd890', GLINT);
    }
  }
}

// The kit cuts a room's side walls with their faces wound toward the room but their stored normals pointing out of it,
// so a side wall takes no light from the rig. Here every wall triangle's stored normal is turned to its own face.
function faceWallNormals(object) {
  const A = new V3(), B = new V3(), C = new V3(), N = new V3();
  object.traverse((m) => {
    if (!m.isMesh || m.name !== 'walls') return;
    const g = m.geometry, p = g.attributes.position, nn = g.attributes.normal, idx = g.index, done = new Uint8Array(p.count), tri = (idx ? idx.count : p.count) / 3;
    for (let t = 0; t < tri; t++) {
      const i0 = idx ? idx.getX(t * 3) : t * 3, i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
      A.fromBufferAttribute(p, i0); B.fromBufferAttribute(p, i1).sub(A); C.fromBufferAttribute(p, i2).sub(A); N.crossVectors(B, C);
      for (const i of [i0, i1, i2]) { if (done[i]) continue; done[i] = 1; if (nn.getX(i) * N.x + nn.getY(i) * N.y + nn.getZ(i) * N.z < 0) nn.setXYZ(i, -nn.getX(i), -nn.getY(i), -nn.getZ(i)); }
    }
    nn.needsUpdate = true;
  });
}

// ---------------------------------------------------------------------------------------------
// One room of the kit lit from the EAST. o.open = [a, b]: which of its east windows stand OPEN, counted from the
// north end (the kit's own order). Every other window is SHUT: the wall is cut and cased like the others, a pair of
// oak shutter leaves closes it, and the sun reaches the room only through the cracks between the leaves' boards:
// a row of thin slits in the light rig, so each crack is a gold blade on the glass side, a thin shaft in the dusty
// air and a bar on the floor. A standing state by place: nothing here moves but the dust.
// ---------------------------------------------------------------------------------------------
async function stateRoom(ctx, o) {
  const S = o.scale, H = o.hour;
  const rig = INT.makeLightRig({ scale: S, sunDir: o.sunDir, sunColor: H.sun, sunIntensity: H.sunI * (o.sunK ?? 1), ambient: o.ambient ?? H.amb, ambientSky: H.ambSky, ambientGround: H.ambGround,
    bounceColor: o.bounceColor ?? '#a8825a', bounce: o.bounce ?? 4.5, dapple: o.dapple });
  const shut = []; let patched = false, openRow = null, win = null;
  const patch = () => {
    const row = rig.rows[0]; if (!row) return;
    patched = true; openRow = row;
    const n = row.count, sp = n > 1 ? row.spacing : 0, a = clamp(o.open[0], 0, n - 1), b = clamp(o.open[1], a, n - 1);
    win = { w: row.width, h: row.height, n, sp, axis: row.axis.clone(), normal: row.normal.clone(), first: row.origin.clone() };
    for (let k = 0; k < n; k++) if (k < a || k > b) shut.push({ k, centre: row.origin.clone().addScaledVector(row.axis, k * sp) });
    row.origin.addScaledVector(row.axis, a * sp); row.count = b - a + 1; if (row.count === 1) row.spacing = 1e5;
    for (const s of shut) {
      // the cracks: slits stacked up the window, each as wide as the leaves
      const ns = Math.max(3, Math.floor(row.height / (1.25 * S * 0.62))), gap = (row.height - 1.2) / (ns - 1);
      const r2 = rig.addWindowRow({ origin: s.centre.clone().add(new V3(0, -row.height / 2 + 0.6, 0)), axis: [0, 1, 0], up: row.axis, normal: row.normal, width: 0.05 * S, height: row.width * 0.92,
        spacing: gap, count: ns, arch: 0, mullions: [1, 1], bar: 1e-4, sky: '#ffb648', skyIntensity: 15 });
      if (r2) { r2.depth = 0.2 * S; r2.paneGain = 0.8; r2.noCurtain = true; s.row = r2; s.ns = ns; s.gap = gap; }
    }
    rig.refresh();
  };
  const room = await INT.makeRoomAsync({ ...o.room, windowLight: eastLight(H, o.room.light.sky, o.sunK ?? 1, o.dust), scale: S, rig, rng: o.rng, sun: { side: 1, elevation: 15, ahead: 0.5, ...(o.room.sun || {}) } },
    async () => { if (!patched) patch(); await ctx.yield(); }, 0);
  faceWallNormals(room.object);
  room.object.position.set(0, FLOOR, o.z);
  // a window's own stream, named by its room's place and its number in the kit's order
  const paneRng = (k) => ctx.core.makeRng(ctx.core.hashSeed('bbb-world-pane:' + o.z + ':' + k + ':' + ctx.seed));
  return { room, rig, shut, openRow, win, S, z: o.z, th: o.room.thickness * S, hour: H, paneRng, arch: o.room.windows?.arch ?? 0 };
}

// shutter leaves for one room: closed pairs across the shut windows (boards between the cracks, a bright seam where the
// two leaves meet), folded pairs flat on the wall either side of every open window. Room-local; one builder for all.
function addShutters(b, sr, color) {
  const { win, shut, S } = sr; if (!win) return;
  const ax = win.axis, nrm = win.normal, hw = win.w / 2, h = win.h, dark = new THREE.Color(color).multiplyScalar(0.72);
  const at = (c, u, y, d) => [c.x + ax.x * u + nrm.x * d, c.y + y, c.z + ax.z * u + nrm.z * d];
  const ry = Math.atan2(ax.x, ax.z) - PI / 2;
  const isShut = new Set(shut.map((s) => s.k));
  for (let k = 0; k < win.n; k++) {
    const c = win.first.clone().addScaledVector(ax, k * win.sp);
    if (isShut.has(k)) {
      const s = shut.find((q) => q.k === k), d = -0.24 * S;
      // boards between the cracks, in two leaves
      for (let i = 0; i <= s.ns; i++) {
        const y0 = i === 0 ? -h / 2 : -h / 2 + 0.6 + (i - 1) * s.gap + 0.06 * S, y1 = i === s.ns ? h / 2 : -h / 2 + 0.6 + i * s.gap - 0.06 * S;
        if (y1 - y0 < 0.05) continue;
        for (const e of [-1, 1]) {
          b.add(box(hw - 0.05, y1 - y0, 0.1 * S), { p: at(c, e * (hw / 2 + 0.025), (y0 + y1) / 2, d), r: [0, ry, 0], c: color, surf: S_WOOD });
          b.add(box(hw * 0.62, (y1 - y0) * 0.62, 0.04 * S), { p: at(c, e * (hw / 2 + 0.025), (y0 + y1) / 2, d + 0.06 * S), r: [0, ry, 0], c: dark, surf: S_WOODM });
        }
      }
      // the seam between the leaves and the iron bar across them
      b.add(box(0.05, h, 0.02), { p: at(c, 0, 0, d - 0.02), r: [0, ry, 0], c: '#ffd9a0', surf: INT.surf(0, 0.1, 0, 5) });
      b.add(box(win.w * 0.96, 0.09 * S, 0.05 * S), { p: at(c, 0, -h * 0.08, d + 0.09 * S), r: [0, ry, 0], c: '#2a2622', surf: INT.surf(0, 0.4, 0.6) });
      // the recess before the shut leaves, in the same shaded stone
      recess(b, sr, c, (sr.openRow.depth ?? 0) - 0.19 * S);
    } else {
      // the window's stone against the glass: a mullion at each division of its width, a transom at TRANSOM of its
      // height (the front and the two cheeks of each, nothing that cannot be met by a line from the room)
      const m = sr.openRow.mullions[0], d0 = -((sr.openRow.depth ?? 0) - MULLION_D), hm = MULLION / 2, yt = (TRANSOM - 0.5) * h, nr = [nrm.x, 0, nrm.z], axv = [ax.x, 0, ax.z], back = [-nrm.x * MULLION_D, 0, -nrm.z * MULLION_D];
      for (let q = 1; q < m; q++) {
        const u = -hw + q * win.w / m;
        piece(b, at(c, u - hm, -h / 2, d0), [ax.x * MULLION, 0, ax.z * MULLION], [0, h, 0], nr, STONE_D, S_STONE);
        for (const e of [-1, 1]) piece(b, at(c, u + e * hm, -h / 2, d0), back, [0, h, 0], [e * axv[0], 0, e * axv[2]], STONE_D, S_STONE);
      }
      piece(b, at(c, -hw, yt - hm, d0), [ax.x * win.w, 0, ax.z * win.w], [0, MULLION, 0], nr, STONE_D, S_STONE);
      for (const e of [-1, 1]) piece(b, at(c, -hw, yt + e * hm, d0), [ax.x * win.w, 0, ax.z * win.w], back, [0, e, 0], STONE_D, S_STONE);
      // the park in its panes, and the recess before them in shaded stone
      paneView(b, sr, c, k);
      recess(b, sr, c, 0);
      // folded back: two leaves of two boards each, flat on the wall beside the casing
      for (const e of [-1, 1]) for (let j = 0; j < 2; j++) {
        const u = e * (hw + 0.34 * S + (j + 0.5) * hw * 0.5);
        b.add(box(hw * 0.5 - 0.04, h, 0.07 * S), { p: at(c, u, 0, 0.05 * S), r: [0, ry, 0], c: color, surf: S_WOOD });
        // its three raised panels: each the one face that is turned to the room, where it stood before (0.11 S off the wall),
        // set through the kit's own turning like the board under it, so that board and panel take the same light
        for (let q = 0; q < 3; q++) b.add(new THREE.PlaneGeometry(hw * 0.5 - 0.3 * S, h * 0.26), { p: at(c, u, (q - 1) * h * 0.31, 0.11 * S), r: [0, ry, 0], c: dark, surf: S_WOODM });
      }
    }
  }
}

// ---------------------------------------------------------------------------------------------
// PAINTED THINGS of the rooms, in flat pieces of one builder (the room's own material lights them).
// A carpet: a border, guard lines, a deep quiet field strewn with small lozenges, a middle medallion and four corner
// pieces; `plain` leaves the field plain. pal: [field, border, cream, gold]. r: { position, width, length }.
// ---------------------------------------------------------------------------------------------
function paintRug(b, r, pal, plain) {
  const cx = r.position[0], cz = r.position[2], hw = r.width / 2, hl = r.length / 2, C = (h) => new THREE.Color(h);
  const field = C(pal[0]), border = C(pal[1]), cream = C(pal[2]), gold = C(pal[3]), deep = field.clone().multiplyScalar(0.7), soft = border.clone().lerp(field, 0.5);
  let y = 0.016;
  const rect = (ax, az, c) => { b.quad([cx - ax, y, cz + az], [cx + ax, y, cz + az], [cx + ax, y, cz - az], [cx - ax, y, cz - az], c, S_FABRIC); y += 0.007; };
  const loz = (px, pz, ax, az, c) => b.quad([px - ax, y, pz], [px, y, pz + az], [px + ax, y, pz], [px, y, pz - az], c, S_FABRIC);
  const bw = Math.min(0.62, hw * 0.24), fw = hw - bw, fl = hl - bw;
  // the fringe at the two ends, the border, a cream line, a dark band, a gold line, the field
  rect(hw - 0.05, hl + 0.14, cream.clone().multiplyScalar(0.85));
  rect(hw, hl, border); rect(hw - bw * 0.3, hl - bw * 0.3, cream); rect(hw - bw * 0.42, hl - bw * 0.42, deep); rect(hw - bw * 0.86, hl - bw * 0.86, gold); rect(fw, fl, field);
  if (plain) return;
  const nx = Math.max(2, Math.round(fw * 2)), nz = Math.max(3, Math.round(fl * 2));
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) loz(cx - fw + (i + 0.5) * fw * 2 / nx, cz - fl + (j + 0.5) * fl * 2 / nz, 0.17, 0.21, (i + j) % 2 ? soft : deep);
  y += 0.007;
  const ma = Math.min(fw * 0.66, 2.1), mz = Math.min(fl * 0.42, ma * 1.5);
  loz(cx, cz, ma, mz, border); y += 0.007; loz(cx, cz, ma * 0.82, mz * 0.82, cream); y += 0.007; loz(cx, cz, ma * 0.7, mz * 0.7, deep); y += 0.007; loz(cx, cz, ma * 0.3, mz * 0.3, gold);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const K = [cx + sx * fw, y, cz + sz * fl], A = [K[0] - sx * ma * 0.6, y, K[2]], B = [K[0], y, K[2] - sz * mz * 0.6];
    if (sx * sz < 0) b.quad(K, A, B, B, soft, S_FABRIC); else b.quad(K, B, A, A, soft, S_FABRIC);
  }
}

// A landscape in a gilt frame, painted in flat pieces with slanting edges: a sky in three bands over far hills,
// nearer hills, land in three tones, a pale water, clouds, clumps of trees with a lit side. Land and sky only.
// p: { position (its middle, on the wall), normal [x, 0, z], width, height }.
function paintLandscape(b, p, rng) {
  const c0 = p.position, n = p.normal, w = p.width, h = p.height, ax = [n[2], 0, -n[0]], nu = 22, fw = 0.085 * Math.sqrt(w * h), d = 0.07;
  const P = (u, v, dd) => [c0[0] + ax[0] * (u - 0.5) * w + n[0] * dd, c0[1] + (v - 0.5) * h, c0[2] + ax[2] * (u - 0.5) * w + n[2] * dd];
  const varnish = new THREE.Color('#6a5636'), C = (hx) => new THREE.Color(hx).lerp(varnish, 0.14), mix = (a, c, k) => a.clone().lerp(c, k);
  const hz = rng.range(0.36, 0.5), a1 = rng.range(3, 7), p1 = rng.range(0, 6), a2 = rng.range(8, 14), p2 = rng.range(0, 6), evening = rng.chance(0.35);
  const skyTop = C(evening ? '#8f9aa6' : '#8fb0c8'), skyLow = C(evening ? '#f0cf9a' : '#e9e2c6'), cloud = C('#f4eee0'), hillFar = C('#8497a4'), hillNear = C('#6f8468'), landFar = C('#a3a66c'), landNear = C('#4d5a32'),
    water = C('#b9cbd0'), tree = C('#2f4a2c'), treeLit = C('#5d7a3c');
  const far = (u) => hz + 0.08 + 0.06 * Math.sin(u * a1 + p1) + 0.025 * Math.sin(u * a2 + p2), near = (u) => hz + 0.022 + 0.022 * Math.sin(u * a2 * 0.6 + p1);
  const Q = (u0, v00, v01, u1, v10, v11, c, dd) => b.quad(P(u0, v00, dd), P(u1, v10, dd), P(u1, v11, dd), P(u0, v01, dd), c, S_MATTE);
  for (let i = 0; i < nu; i++) {
    const u0 = i / nu, u1 = (i + 1) / nu, f0 = far(u0), f1 = far(u1), n0 = near(u0), n1 = near(u1);
    for (let k = 0; k < 3; k++) Q(u0, hz * k / 3, hz * (k + 1) / 3, u1, hz * k / 3, hz * (k + 1) / 3, mix(landNear, landFar, 0.12 + k * 0.38), d);
    Q(u0, hz, n0, u1, hz, n1, hillNear, d); Q(u0, n0, f0, u1, n1, f1, mix(hillFar, skyLow, 0.2), d);
    for (let k = 0; k < 3; k++) Q(u0, f0 + (1 - f0) * k / 3, f0 + (1 - f0) * (k + 1) / 3, u1, f1 + (1 - f1) * k / 3, f1 + (1 - f1) * (k + 1) / 3, mix(skyLow, skyTop, k * 0.45), d);
  }
  // six-sided flat pieces laid a hair proud of the canvas: clouds, the water, the clumps and their lit sides
  const hex = (uc, vc, ru, rv, c, dd) => { Q(uc - ru, vc, vc + rv, uc + ru, vc, vc + rv, c, dd); b.quad(P(uc - ru * 0.55, vc - rv, dd), P(uc + ru * 0.55, vc - rv, dd), P(uc + ru, vc, dd), P(uc - ru, vc, dd), c, S_MATTE); };
  for (let i = 0, N = 2 + Math.floor(rng() * 2); i < N; i++) hex(rng.range(0.15, 0.85), rng.range(0.74, 0.92), rng.range(0.08, 0.16), rng.range(0.02, 0.04), cloud, d + 0.004);
  { const lake = rng.chance(0.65), wu = rng.range(0.3, 0.7), wr = rng.range(0.14, 0.24); if (lake) hex(wu, hz * 0.7, wr, hz * 0.09, water, d + 0.004); }
  for (let i = 0, N = 2 + Math.floor(rng() * 3); i < N; i++) {
    const uc = rng.range(0.12, 0.88), ru = rng.range(0.045, 0.09), rv = rng.range(0.07, 0.15), vc = hz + rv * 0.6;
    hex(uc, vc, ru, rv, tree, d + 0.008); hex(uc + ru * 0.3, vc + rv * 0.2, ru * 0.5, rv * 0.55, treeLit, d + 0.012);
    hex(uc - ru * 0.9, vc - rv * 0.35, ru * 0.6, rv * 0.5, tree, d + 0.008);
  }
  // the gilt frame: four bars standing proud of the canvas
  const along = Math.abs(n[0]) > 0.5, bar = (lu, lv, cu, cv) => b.add(along ? box(d * 2.4, lv, lu) : box(lu, lv, d * 2.4), { p: P(cu, cv, d), c: GILT, surf: S_GILT });
  bar(w + fw * 2, fw, 0.5, 1 + fw / 2 / h); bar(w + fw * 2, fw, 0.5, -fw / 2 / h); bar(fw, h, -fw / 2 / w, 0.5); bar(fw, h, 1 + fw / 2 / w, 0.5);
}

export default {
  id: 'bells-before-breakfast',
  name: 'Bells Before Breakfast',
  category: 'screen',
  placeKind: 'interior',
  screen: 'Downton Abbey',
  screenYear: '2010',
  screenKind: 'series',
  media: ['air'],
  weirdness: 0.08,
  async build(ctx) {
    const core = ctx.core, stream = (name) => core.makeRng(core.hashSeed('bbb-world-' + name + ':' + ctx.seed));
    // every random stream of this file, taken once, here, in this order
    const R = {};
    for (const n of ['look', 'hall', 'hall-set', 'roof', 'tapestry', 'saloon', 'saloon-set', 'drawing', 'drawing-set', 'library', 'library-set', 'shutters', 'weave', 'drawing-fire']) R[n] = stream(n);
    const vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1, density = vary.density ?? 1, rare = !!vary.rare;
    const hourName = HOURS[vary.hour] ? vary.hour : 'dawn', H = HOURS[hourName];
    const scene = new THREE.Scene();

    // ---------------- the outside (the part): made first, its env gives the sun's bearing
    const hctx = Object.create(ctx);
    const outside = await buildHero(hctx, { hour: vary.hour, rare, density, detail });
    scene.add(outside.object);
    await ctx.yield();
    const env = outside.env, eSun = new V3().fromArray(env.sunDir);
    // indoors the sun keeps the outside's bearing where it stands in the east; its height is the state floor's own
    // (a sun on the horizon would lay pools without end): long pools right across the rooms
    // (the bearing for an hour without an eastern sun is drawn on every seed and used or not)
    const spare = R.look.range(0.5, 0.9), east = eSun.x > 0.15 && H.sunI > 0, bearing = east ? Math.atan2(-eSun.z, eSun.x) : spare;
    const el = R.look.range(H.el[0], H.el[1]) * PI / 180, ah = clamp(Math.sin(bearing), 0.25, 0.72);
    const sunDir = new V3(Math.cos(el) * Math.sqrt(1 - ah * ah), Math.sin(el), -Math.cos(el) * ah).normalize();
    if (!east) sunDir.x *= -1;
    const dapple = { amount: 0.5, size: R.look.range(1.6, 2.4), speed: R.look.range(1.1, 1.6) };
    // one law of dust for the hall and every room
    const dust = { motesPerWindow: Math.round(320 * detail), maxMotes: 1000, moteSize: 0.03, moteGain: 1.5, moteDrift: 0.7 };

    // ---------------- THE GREAT HALL: the kit's shell (walls, floor, the three great east windows, pools, shafts, dust)
    const HS = 2;
    const hallR = await stateRoom(ctx, { scale: HS, hour: H, sunDir, dapple, dust, rng: R.hall, z: DOOR_Z, open: [0, 2], bounceColor: '#b89a78', ambient: H.amb * 0.85, sunK: 0.6,
      room: { style: 'room', bays: 3, length: HALL_L / HS, width: HALL_W / HS, height: HALL_WALL / HS, thickness: HALL_TH / HS, chunks: 1,
        ceiling: { type: 'glass', rise: (HALL_RIDGE - HALL_WALL) / HS }, floor: 'tile', floorPattern: [1.0, 0.006, 1, 1], floorGloss: 0.5, wall: 'plaster', wainscot: 9 / HS,
        windows: { w: 7.4 / HS, h: 13.6 / HS, sill: 2 / HS, arch: 0, mull: [4, 8], sides: 1 }, exit: { w: 8 / HS, h: 10.5 / HS, arch: 0 }, entry: { w: 8.4 / HS, h: 12 / HS, arch: 0 },
        skyColor: H.sky, light: { sky: H.skyI },
        palette: { floorA: '#e8dcc4', floorB: '#2a2622', floorC: '#8a8070', floorD: '#1a1612', wallA: PLASTER, wallB: '#d8ccb4', wainscot: '#694b34', wallD: '#523a26', trim: OAK_D, trimSurf: 'wood',
          ceiling: OAK_D, beam: OAK_D, frame: STONE, reveal: STONE, door: OAK_D } } });
    const hall = hallR.room;
    scene.add(hall.object);
    await ctx.yield();

    // ---------------- THE ROW OF THREE STATE ROOMS, door to door on x 0
    // the design's plan: three rooms of three bays, 30 m long and 30 m wide, with walls of 2 m between
    const SS = 1.6, LS = 1.5, RW = 30, RL = 30, TH = 2;
    const door = (S) => ({ w: 8.4 / S, h: 10.6 / S, arch: 0 });
    // which shutters stand open is the house's hour, by place: all in the saloon; in the drawing room all but the last
    // (the north one); in the library about half, the seed says which
    const libOpen = R.shutters.pick([[1, 2], [1, 2], [2, 2]]);
    let z = DOOR_Z - HALL_L - HALL_TH;
    const saloonR = await stateRoom(ctx, { scale: SS, hour: H, sunDir, dapple, dust, rng: R.saloon, z, open: [0, 2], bounceColor: '#c8a880', ambient: H.amb * 0.23, bounce: 1.2, sunK: 0.9,
      room: { style: 'gallery', bays: 3, length: RL / SS, width: RW / SS, height: 13 / SS, thickness: TH / SS, chunks: 1, ceiling: { rise: 3.6 / SS, longRibs: 5 }, floor: 'chevron', wall: 'damask', wainscot: 1.3,
        windows: { w: 5.4 / SS, h: 10.2 / SS, sill: 1.1 / SS, arch: 1, mull: [3, 6], sides: 1 }, exit: door(SS), entry: 'open', skyColor: H.sky, light: { sky: H.skyI * 0.55 },
        palette: { wallA: '#7ba297', wallB: '#98b9ae', wainscot: '#d2c9b4', wallD: '#70958a', trim: GILT, ceiling: '#8eafb5', rib: GILT, frame: '#e2d6bc', reveal: '#d8ccb2', floorA: '#99693c', floorB: '#684626' } } });
    scene.add(saloonR.room.object); await ctx.yield();
    z -= RL + TH;
    const drawingR = await stateRoom(ctx, { scale: SS, hour: H, sunDir, dapple, dust, rng: R.drawing, z, open: [1, 2], bounceColor: '#b0a070', ambient: H.amb * 0.85, sunK: 0.85,
      room: { style: 'room', bays: 3, length: RL / SS, width: RW / SS, height: 14.5 / SS, thickness: TH / SS, chunks: 1, ceiling: { type: 'vault', kind: 'segmental', rise: 2.2 / SS, longRibs: 3, seg: 10 }, floor: 'parquet', wall: 'damask', wainscot: 1.2,
        windows: { w: 5 / SS, h: 9.6 / SS, sill: 1.2 / SS, arch: 0, mull: [3, 6], sides: 1 }, exit: door(SS), entry: 'open', skyColor: H.sky, light: { sky: H.skyI },
        palette: { wallA: '#7b8f6a', wallB: '#93a583', wainscot: '#e9e0cc', wallD: '#b99a5a', trim: '#efe7d6', ceiling: '#efe7d6', rib: '#d9cdb0', beam: '#d9cdb0', frame: '#efe6d2', reveal: '#e6dcc6' } } });
    scene.add(drawingR.room.object); await ctx.yield();
    z -= RL + TH;
    const libraryR = await stateRoom(ctx, { scale: LS, hour: H, sunDir, dapple, dust, rng: R.library, z, open: libOpen, bounceColor: '#b08a5a', ambient: H.amb * (libOpen[0] === 2 ? 3.4 : 2.9), bounce: 6.5,
      room: { style: 'library', bays: 3, length: RL / LS, width: RW / LS, thickness: TH / LS, chunks: 1, ceiling: { kind: 'segmental', rise: 2.4 / LS, cross: false, seg: 10 },
        windows: { w: 4.6 / LS, h: 6.2 / LS, sill: 0.9 / LS, arch: 0, mull: [3, 5], sides: 1 }, exit: { w: 8 / LS, h: 10 / LS, arch: 0 }, entry: 'open', skyColor: H.sky, light: { sky: H.skyI * 1.2 } } });
    scene.add(libraryR.room.object); await ctx.yield();
    // z0: the library's north door plane (the outer face of its north wall); below stairs begins there
    const z0 = z - RL - TH;
    const rooms = [hallR, saloonR, drawingR, libraryR];

    // ---------------- below stairs (the part)
    const bctx = Object.create(ctx);
    const below = await buildBelow(bctx, { z0, hour: vary.hour, rare, density, detail });
    scene.add(below.object);
    await ctx.yield();

    // ---------------- THE ROUTE: the design's points; geometry and places decide the length and where every u falls
    const zS = saloonR.room.object.position.z, zD = drawingR.room.object.position.z, zL = libraryR.room.object.position.z;
    // the first door's plane: the middle of the hall's north wall (the design: z -54)
    const zFirst = DOOR_Z - HALL_L - HALL_TH / 2;
    const mid = { hall: DOOR_Z - HALL_L / 2, saloon: zS - RL / 2, drawing: zD - RL / 2, library: zL - RL / 2 };
    // the hall's chimneypiece stands at the hall's middle on the west wall
    const FIRE_Z = mid.hall;
    const ws = R.weave.sign(), wa = [R.weave.range(0.8, 1.1), R.weave.range(0.95, 1.15), R.weave.range(0.95, 1.15)];
    // the approach, the porch's south arch (z 2), the front door (z -11), the hall under its chandelier (z -30); then
    // every door wall is crossed dead on x 0: one point on each of its two faces (the first door's at the design's y 9.2)
    const Z_PORCH = 2;
    const pts = [[-48.9, 26, 115.0], [-31.7, 26, 90.5], [-14.5, 26, 65.9], [-8.3, 21.9, 55.4], [-3.7, 17.7, 44.1], [-0.9, 13.6, 32.2],
      [0, 9.4, 20], [0, 9.3, Z_PORCH], [0, 9.6, -11], [0, 10, -30], [0, 9.2, DOOR_Z - HALL_L], [0, 9.2, zS]];
    // the row of rooms: a slow weave of about a metre at each room's middle, none in a doorway
    pts.push([ws * wa[0], 9.3, mid.saloon], [0, 9.3, zS - RL], [0, 9.3, zD]);
    pts.push([wa[1], 9.3, mid.drawing], [0, 9.3, zD - RL], [0, 9.3, zL]);
    pts.push([-wa[2], 9.3, mid.library], [0, 9.3, zL - RL]);
    for (const p of below.routePoints) pts.push([p[0], p[1], p[2]]);
    const path = makePath(pts), LEN = path.length, _v = new V3();
    const uM = (m) => clamp(m / LEN, 0, 1), uFore = path.nearestXZ(0, 20).u;
    // from the forecourt on the route runs north without a turn: the u of a plane z
    const uAtZ = (zq) => { let a = uFore, b = 1; for (let i = 0; i < 44; i++) { const m = (a + b) / 2; if (path.pointAt(m, _v).z > zq) a = m; else b = m; } return (a + b) / 2; };
    // places below stairs, read from the part: the high arch, the kitchen's north arch, and where the dive levels (the
    // first point of the part's route that has come down to the north arch's height)
    const zArch = below.anchors.highArch[2], kan = below.anchors.kitchenArchNorth, zLevel = (below.routePoints.find((q) => q[1] <= kan[1] + 1e-6) || kan)[2];
    // pace, keyed at places only: 1.25 over the park to the end of the straight (60 m flown), 1.0 at the porch's arch,
    // 0.9 from the front door to z0, 1.0 at the high arch, 0.8 from where the dive levels to the kitchen's north arch
    // (across the kitchen floor), 0.85 at the bell hall's mouth where the part gives that anchor, 1.0 at the end
    const K = [[0, 1.25], [uM(60), 1.25], [uAtZ(Z_PORCH), 1.0], [uAtZ(outside.anchors.door[2]), 0.9], [uAtZ(z0), 0.9], [uAtZ(zArch), 1.0], [uAtZ(zLevel), 0.8], [uAtZ(kan[2]), 0.8]];
    if (below.anchors.hallMouth) K.push([uAtZ(below.anchors.hallMouth[2]), 0.85]);
    K.push([1, 1.0]);
    const pace = (u) => { for (let i = 1; i < K.length; i++) if (u <= K[i][0]) return lerp(K[i - 1][1], K[i][1], smoothstep(K[i - 1][0], K[i][0], u)); return K[K.length - 1][1]; };

    // ---------------- the looks: one pull at a time, each a place, each under 0.6
    // every fire's anchor is its own fireplace at its mantel's height, given by the room's set when it is furnished
    const fireAt = { hall: new V3(), saloon: new V3(), drawing: new V3(), library: new V3() };
    const fireAnchor = (key, sr, set) => { const f = set.fur.items.find((it) => it.kind === 'fireplace'); fireAt[key].set(f.position[0], FLOOR + f.top, sr.room.object.position.z + f.position[2]); };
    // one rule for every state room: from its south door plane to its north door plane the gaze is drawn to its fire;
    // the pull rises to the room's middle, where the fire stands abeam, and falls from there
    const roomLook = (key, zSouth) => ({ at: fireAt[key], from: uAtZ(zSouth), to: uAtZ(zSouth - RL), weight: 0.3, fade: 0.5 });
    const dres = below.anchors.dresser, rangeAt = new V3().fromArray(below.anchors.range), dresAt = new V3(), zDive = (zArch + zLevel) / 2;
    const pois = [
      // the house front's lit middle, from 30 m to 95 m flown
      { at: new V3().fromArray(outside.anchors.front), from: uM(30), to: uM(95), weight: 0.5, fade: 0.3 },
      // the hall's fire, while the lens is between z -16 and z -34 (the design's places)
      { at: fireAt.hall, from: uAtZ(-16), to: uAtZ(-34), weight: 0.37, fade: 0.5 },
      roomLook('saloon', zS), roomLook('drawing', zD), roomLook('library', zL),
      // the range, from the high arch to the middle of the dive
      { at: rangeAt, from: uAtZ(zArch), to: uAtZ(zDive), weight: 0.38, fade: 0.45 },
      // the dresser: a point of its face 16 m north of the lens, sliding north by place; taken up 3 m before the middle of
      // the dive (the two pulls meet only in their fades) and let go where the dive levels and the route runs straight
      { at: (t, u) => { path.pointAt(u, _v); return dresAt.set(dres[0], dres[1], clamp(_v.z - 16, dres[2] - 22, dres[2] + 22)); }, from: uAtZ(zDive + 3), to: uAtZ(zLevel), weight: 0.42, fade: 0.4 },
    ];

    // ---------------- furnishing: the kit's furniture by a plan in real metres of each room, one draw call a room
    const routeX = (zw) => path.pointAt(uAtZ(clamp(zw, z0, 19)), _v).x;
    const RAD = { table: 0.8, chair: 0.42, sofa: 1.1, fireplace: 1.1, plant: 0.45, vase: 0.16, candle: 0.14, lamp: 0.25, clock: 0.3, globe: 0.42, bookshelf: 0.55, staircase: 1.25, bookStack: 0.2, fruitBowl: 0.2, plate: 0.15 };
    const updaters = [], sets = [];
    // a door wall's candle branch on its bracket (the kit's candles: flames that move, a light that flickers). One law
    // for every door wall: the light's strength follows the room's wall height (1.2 for each metre), one flicker for all
    const wallLight = (I, x, y, z, sc, wallM) => I('candle', x, y, z, 0, { holder: 'candelabra' }, { scale: sc, wall: true, light: { intensity: 1.2 * wallM * H.lamp, range: 26, priority: 9, flicker: 0.6 } });
    // one soft fill a state room, at the same place in each: a quarter of the width west of the axis at the room's
    // middle, 9 m over the floor (the daylight the west wall throws back); its strength is the room's own
    const fill = (sr, strength) => sr.rig.addLight({ position: [-RW / 4, 9, -RL / 2], color: '#ffe8c8', intensity: strength, range: 36 });
    const setRoom = async (sr, rng, plan, o = {}) => {
      const S = sr.S, room = sr.room, zr = room.object.position.z, items = [], pics = [], rugs = [];
      // THE LANE: nothing that stands on a floor comes within 3.4 m of the route's line in plan (the weave counted), by
      // place, the same for every thing; what is fixed to a wall or hangs from a roof (wall: true) is counted by height
      const I = (kind, x, y, z, ry = 0, opts, extra = {}) => {
        const sc = extra.scale ?? 1, r = (extra.r ?? RAD[kind] ?? 0.4) * sc * S, xw = x * S, zw = zr + z * S;
        if (!extra.wall && Math.abs(xw - routeX(zw)) - r < 3.4) return false;
        items.push({ kind, position: [xw, y * S, z * S], rotation: ry, opts, ...extra }); return true;
      };
      const pic = (x, y, z, nx, nz, pw, ph, extra) => pics.push({ position: [x * S, y * S, z * S], normal: [nx, 0, nz], width: pw * S, height: ph * S, ...(extra || {}) });
      const rug = (x, z, rw, rl, rot = 0) => rugs.push({ position: [x * S, 0, z * S], width: rw * S, length: rl * S, rotation: rot });
      plan(I, pic, rug);
      await ctx.yield();
      const fur = await INT.makeFurnitureAsync({ rig: sr.rig, rng: rng.fork('furniture'), scale: S, items, chunks: 1, lights: true, occluders: true, maxLights: o.maxLights ?? 5, maxOccluders: 6,
        flameGain: (o.flameGain ?? 1) * H.lamp, sway: { amp: 0.05, freq: 0.9 } }, ctx.yield);
      room.object.add(fur.object); await ctx.yield();
      // NOTHING OF A ROOM'S SET COMES OUT IN THE NEXT ROOM. A palm's fronds reach further than its corner gives them
      // room: so every vertex of the set that lies past the middle of one of the room's two end walls is laid back on
      // that middle, inside the wall, where the wall's two faces hide it; nothing of a set comes out on an end wall's
      // far side. (Past the east wall nothing is laid back: a frond there lies in a window's recess up to the glass,
      // and the glass and the wall hide what is beyond them.) Made once at build, by place, the same for every room.
      {
        const zs = sr.th / 2, zn = -room.size.length - sr.th / 2;
        fur.object.traverse((m) => {
          if (!m.isMesh || m.name !== 'furniture') return;
          const p = m.geometry.attributes.position; let laid = 0;
          for (let i = 0; i < p.count; i++) { const z = p.getZ(i), cz = clamp(z, zn, zs); if (cz !== z) { p.setZ(i, cz); laid++; } }
          if (laid) { p.needsUpdate = true; m.geometry.computeBoundingSphere(); m.geometry.computeBoundingBox(); }
        });
      }
      let tris = fur.triangles, calls = fur.drawCalls;
      // the paintings (land and sky only) and the carpets are made here in flat pieces: one mesh a room
      if (pics.length || rugs.length) {
        const pb = INT.makeBuilder(), pr = rng.fork('painted');
        for (const r of rugs) paintRug(pb, r, o.rugColors, o.rugPlain);
        await ctx.yield();
        for (const q of pics) paintLandscape(pb, q, pr);
        await ctx.yield();
        const pm = new THREE.Mesh(pb.build(), room.materials.prop); pm.name = 'painted'; room.object.add(pm); tris += pb.triangles; calls += 1; await ctx.yield();
      }
      if (o.curtain && sr.openRow && H.sunI >= 0) {
        const cc = INT.makeCurtains({ rig: sr.rig, rng: rng.fork('curtains'), rows: [sr.openRow], scale: S, color: o.curtain, cover: 0.3, segments: [12, 9] });
        room.object.add(cc.object); tris += cc.triangles; calls += cc.drawCalls; await ctx.yield();
      }
      updaters.push({ room, update: (dt, t, cam) => fur.update(dt, t, cam) });
      const set = { sr, fur, tris, calls }; sets.push(set); return set;
    };
    // a round table with flowers and gilt chairs about it; two settees facing over a low table
    const roundGroup = (I, rng, cx, cz, m, cols) => {
      // every draw is taken whether or not the table finds room
      const turn = rng.range(0, 6), jar = rng.pick(['#e8e2d4', '#2c5a8a', '#d8b25a']), skew = [0, 1, 2, 3].map(() => rng.range(-0.2, 0.2));
      if (!I('table', cx, 0, cz, 0, { round: true, width: 1.5, color: cols.wood }, { scale: m })) return;
      I('vase', cx, 0.76 * m, cz, turn, { height: 0.42, flowers: 8, color: jar }, { scale: m * 1.5 });
      for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + 0.7; I('chair', cx + Math.cos(a) * 1.25 * m, 0, cz + Math.sin(a) * 1.25 * m, Math.atan2(-Math.cos(a), -Math.sin(a)) + skew[i], { style: 'dining', color: cols.frame, seatColor: cols.seat }, { scale: m }); }
    };
    const setteeGroup = (I, rng, cx, cz, m, cols) => {
      for (const s of [-1, 1]) I('sofa', cx, 0, cz + s * 1.9 * m, s > 0 ? PI : 0, { width: 2.3, color: s > 0 ? cols.silk : cols.silk2, pillowColors: cols.pillows }, { scale: m, r: 1.25 });
      I('table', cx, 0, cz, 0, { width: 1.5, depth: 0.8, height: 0.46, legs: 'square', color: cols.wood }, { scale: m });
      I('bookStack', cx - 0.3 * m, 0.46 * m, cz, 0.4, { count: 3 }, { scale: m * 1.3 });
      I('candle', cx + 0.35 * m, 0.46 * m, cz, 0, { holder: 'candelabra' }, { scale: m * 1.6, light: false });
    };
    // ---- THE SALOON: pale silk and gilt, landscapes, flowers, the fire well up
    {
      const rng = R['saloon-set'], X = RW / SS / 2, Lm = RL / SS, bm = Lm / 3, zc = -Lm / 2, fs = 2.7, wallH = 13 / SS;
      const cols = { wood: '#c9a148', frame: '#c9a148', seat: '#e6dcc4', silk: '#e2d6bc', silk2: '#d9c6c0', pillows: ['#c9a148', '#b9c4b0', '#cdb9a0'] };
      const set = await setRoom(saloonR, rng, (I, pic, rug) => {
        I('fireplace', -(X - 0.22 * fs), 0, zc, PI / 2, { width: 2.2, breast: wallH / fs - 1.4, color: '#efe6d2', breastColor: '#e6dcc6' }, { scale: fs, wall: true, light: { intensity: 21 * H.lamp, range: 30 } });
        pic(-(X - 0.31 * fs - 0.03), 1.34 * fs + 1.55, zc, 1, 0, 3.3, 2.2, { frame: 'gilt', frameWidth: 0.12 });
        for (const s of [-1, 1]) {
          I('candle', -(X - 0.3 * fs), 1.34 * fs, zc + s * 1.9, 0, { holder: 'candelabra' }, { scale: 2.2, wall: true, light: s > 0 ? { intensity: 4 * H.lamp, range: 12 } : false });
          I('sofa', -(X - 0.75), 0, zc + s * 5.0, PI / 2, { width: 2.5, color: s > 0 ? cols.silk : cols.silk2, pillowColors: cols.pillows }, { scale: 1.45, wall: true });
          I('table', -(X - 0.45), 0, zc + s * 7.9, PI / 2, { width: 1.5, depth: 0.6, height: 0.9, color: '#c9a148' }, { scale: 1.35, wall: true });
          I('vase', -(X - 0.45), 0.9 * 1.35, zc + s * 7.9, s, { height: 0.5, flowers: 9 }, { scale: 2.3, wall: true });
          pic(-(X - 0.02), 5.1, zc + s * 6.0, 1, 0, 2.7, 1.9, { frame: 'gilt', frameWidth: 0.1 });
          pic(-(X - 0.02), 2.9, zc + s * 5.0, 1, 0, 1.5, 1.05, { frame: 'gilt', frameWidth: 0.08 });
          // the north wall either side of the door
          pic(s * 6.1, 4.7, -Lm + 0.02, 0, 1, 2.9, 2.1, { frame: 'gilt', frameWidth: 0.11 });
          pic(s * 6.1, 2.4, -Lm + 0.02, 0, 1, 1.6, 1.1, { frame: 'gilt', frameWidth: 0.08 });
          I('table', s * 6.1, 0, -(Lm - 0.45), 0, { width: 2.1, depth: 0.62, height: 0.9, drawers: 3, color: '#7a4a2a' }, { scale: 1.35, wall: true });
          for (const e of [-1, 1]) I('vase', s * 6.1 + e * 0.95, 0.9 * 1.35, -(Lm - 0.45), e, { height: 0.5, flowers: 0, color: e * s > 0 ? '#2c5a8a' : '#e8e2d4' }, { scale: 1.7, wall: true });
          I('clock', s * 6.1, 0.9 * 1.35, -(Lm - 0.45), 0, { kind: 'mantel' }, { scale: 1.5, wall: true });
          wallLight(I, s * 13.3 / SS, 6.1 / SS, -(Lm - 0.2), 2.0, wallH * SS);
          for (const e of [-1, 1]) I('chair', s * 6.1 + e * 2.5, 0, -(Lm - 0.6), 0, { style: 'arm', color: '#c9a148', seatColor: '#e6dcc4' }, { scale: 1.3 });
          // groups on the floor either side of the lane
          roundGroup(I, rng, s * (5.3 + rng.range(0, 0.5)), zc + s * rng.range(2.6, 3.4), 1.4, cols);
          setteeGroup(I, rng, s * (5.6 + rng.range(0, 0.4)), zc - s * rng.range(3.2, 4.0), 1.35, cols);
        }
        // the east wall: pier tables with great vases between the windows, palms in the corners, chairs in the bays
        for (let k = 1; k < 3; k++) { I('table', X - 0.5, 0, -k * bm, -PI / 2, { width: 1.7, depth: 0.62, height: 0.92, color: '#c9a148' }, { scale: 1.4, wall: true }); I('vase', X - 0.5, 0.92 * 1.4, -k * bm, k, { height: 0.6, flowers: 9 }, { scale: 2.5, wall: true }); }
        for (const zz of [-0.7, -Lm + 0.7]) I('plant', X - 0.8, 0, zz, zz, { kind: 'palm', height: 2.6, potColor: '#e6dfd0' }, { scale: 2.0 });
        for (let k = 0; k < 3; k++) for (const e of [-1, 1]) I('chair', X - 0.7, 0, -(k + 0.5) * bm + e * 1.9, -PI / 2 + e * 0.25, { style: 'dining', color: '#c9a148', seatColor: '#dccdb0' }, { scale: 1.3 });
        for (const k of [1, 2]) I('chandelier', 0, wallH + 3.5 / SS - 0.15, -k * bm, k, { arms: 10, tiers: 2, radius: 0.85, drop: 1.0 }, { scale: 1.7, wall: true });
        rug(0, zc, 3.2, 15); for (const s of [-1, 1]) rug(s * 5.7, zc, 4.6, 12);
      }, { curtain: '#d9c48a', flameGain: 1.8, rugColors: ['#5e2428', '#26344e', '#c4b898', '#96783e'] });
      fill(saloonR, 1.4);
      saloonR.set = set; fireAnchor('saloon', saloonR, set);
    }
    await ctx.yield();
    // ---- THE DRAWING ROOM: soft green, a carpet, card tables, clocks, the fire and its tall glass; no sofa in it, and
    // every seat in green or old gold
    {
      const rng = R['drawing-set'], X = RW / SS / 2, Lm = RL / SS, bm = Lm / 3, zc = -Lm / 2, fs = 2.7, wallH = 14.5 / SS;
      const cols = { wood: '#6a3a1e', frame: '#5a321a', seat: '#b9965a' }, GREEN = '#5e7a5a', OLD_GOLD = '#b9965a';
      const set = await setRoom(drawingR, rng, (I, pic, rug) => {
        I('fireplace', -(X - 0.22 * fs), 0, zc, PI / 2, { width: 2.2, breast: wallH / fs - 1.4, color: '#e9e0cc', breastColor: '#8a9c78' }, { scale: fs, wall: true, light: { intensity: 14 * H.lamp, range: 30 } });
        I('clock', -(X - 0.3 * fs), 1.34 * fs, zc, PI / 2, { kind: 'mantel' }, { scale: 2.6, wall: true });
        for (const s of [-1, 1]) {
          I('candle', -(X - 0.3 * fs), 1.34 * fs, zc + s * 2.0, 0, { holder: 'candelabra' }, { scale: 2.2, wall: true, light: s < 0 ? { intensity: 4 * H.lamp, range: 12 } : false });
          pic(-(X - 0.02), 4.9, zc + s * 6.1, 1, 0, 2.6, 1.9, { frame: 'gilt', frameWidth: 0.1 });
          I('bookshelf', -(X - 0.3), 0, zc + s * 6.4, PI / 2, { width: 1.5, height: 2.3, color: '#5a321a' }, { scale: 1.5, wall: true });
          I('plant', -(X - 0.7), 0, zc + s * 8.6, s, { kind: s > 0 ? 'ficus' : 'fig', height: 2.2 }, { scale: 1.8 });
          pic(s * 6.2, 4.8, -Lm + 0.02, 0, 1, 2.8, 2.0, { frame: 'gilt', frameWidth: 0.1 });
          I('table', s * 7.4, 0, -(Lm - 0.5), 0, { width: 1.6, depth: 0.6, height: 0.9, color: '#5a321a', drawers: 2 }, { scale: 1.35, wall: true });
          I('vase', s * 7.4 - 0.5, 0.9 * 1.35, -(Lm - 0.5), s, { height: 0.5, flowers: 8 }, { scale: 2.1, wall: true });
          I(s > 0 ? 'clock' : 'vase', s * 7.4 + 0.55, 0.9 * 1.35, -(Lm - 0.5), 0, s > 0 ? { kind: 'mantel' } : { height: 0.45, flowers: 0, color: '#2c5a8a' }, { scale: s > 0 ? 1.4 : 1.6, wall: true });
          wallLight(I, s * 13.3 / SS, 6.1 / SS, -(Lm - 0.2), 2.0, wallH * SS);
        }
        I('clock', -5.0, 0, -(Lm - 0.4), 0, { kind: 'longcase' }, { scale: 2.5, wall: true });
        // before the fire: a round table with flowers and its four chairs (a stream of its own), an arm chair either side
        roundGroup(I, R['drawing-fire'], -(X - 4.3), zc, 1.4, cols);
        // card tables on the window side, each with its four chairs
        for (const zz of [zc + 3.6, zc - 3.6]) {
          const cx = 5.6 + rng.range(-0.3, 0.3);
          if (I('table', cx, 0, zz, PI / 4, { width: 1.0, depth: 1.0, height: 0.74, legs: 'square', color: '#2f5a3a' }, { scale: 1.45 }))
            for (let i = 0; i < 4; i++) { const a = i * TAU / 4; I('chair', cx + Math.cos(a) * 1.3, 0, zz + Math.sin(a) * 1.3, Math.atan2(-Math.cos(a), -Math.sin(a)), { style: 'dining', color: '#5a321a', seatColor: GREEN }, { scale: 1.3 }); }
        }
        for (const k of [1, 2]) { I('table', X - 0.5, 0, -k * bm, -PI / 2, { width: 1.6, depth: 0.6, height: 0.9, color: '#5a321a' }, { scale: 1.35, wall: true }); I('lamp', X - 0.5, 0.9 * 1.35, -k * bm, 0, { kind: 'table', shadeColor: '#e8c890' }, { scale: 2.4, wall: true, light: k === 1 ? { intensity: 5 * H.lamp, range: 14 } : false }); }
        for (const zz of [-0.7, -Lm + 0.7]) I('plant', X - 0.8, 0, zz, zz, { kind: 'palm', height: 2.5 }, { scale: 2.0 });
        I('chair', -(X - 3.0), 0, zc + 4.4, 2.2, { style: 'arm', seatColor: GREEN }, { scale: 1.45 }); I('chair', -(X - 3.0), 0, zc - 4.4, 0.9, { style: 'arm', seatColor: OLD_GOLD }, { scale: 1.45 });
        for (const k of [1, 2]) I('chandelier', 0, wallH + 2.1 / SS - 0.15, -k * bm, k, { arms: 8, tiers: 2, radius: 0.8, drop: 1.0 }, { scale: 1.6, wall: true });
        rug(0, zc, 9.2, 13.5);
      }, { curtain: '#b9605e', flameGain: 1.8, rugColors: ['#4e181c', '#1c2844', '#bcae8e', '#8c6e36'] });
      fill(drawingR, 5.5);
      drawingR.set = set; fireAnchor('drawing', drawingR, set);
    }
    await ctx.yield();
    // ---- THE LIBRARY: reading tables and their green lamps, a globe turning, a fire newly lit, the stair to the gallery
    {
      const rng = R['library-set'], X = RW / LS / 2, Lm = RL / LS, bm = Lm / 3, zc = -Lm / 2, fs = 2.3, top = libraryR.room.size.height / LS;
      const set = await setRoom(libraryR, rng, (I, pic, rug) => {
        I('fireplace', -(X - 0.22 * fs), 0, zc, PI / 2, { width: 2.0, color: '#b8ab92', hearthColor: '#2c2a2c' }, { scale: fs, wall: true, light: { intensity: 12 * H.lamp, range: 26 } });
        I('clock', -(X - 0.3 * fs), 1.34 * fs, zc, PI / 2, { kind: 'mantel', color: '#3a2314' }, { scale: 2.2, wall: true });
        for (const s of [-1, 1]) I('chair', -(X - 3.1), 0, zc + s * 2.3, PI / 2 - s * 0.7, { style: 'arm', seatColor: s > 0 ? '#4a3a22' : '#2f4a3a' }, { scale: 1.5 });
        I('table', -(X - 3.3), 0, zc, 0, { round: true, width: 0.8, height: 0.62 }, { scale: 1.4 });
        I('bookStack', -(X - 3.3), 0.62 * 1.4, zc, 0.5, { count: 4 }, { scale: 1.8 });
        // reading tables in two rows, each with two lit green lamps
        for (let k = 0; k < 3; k++) for (const s of [-1, 1]) {
          const tx = s * 5.0, tz = -(k + 0.5) * bm + (s > 0 ? 0 : (k === 1 ? 99 : 0));
          if (tz > 50 || !I('table', tx, 0, tz, PI / 2, { width: 4.0, depth: 1.3, height: 0.78, legs: 'square', color: '#8a5a30' }, { scale: 1, r: 0.7 })) continue;
          for (const e of [-1, 1]) I('lamp', tx, 0.78, tz + e * 1.1, s > 0 ? PI / 2 : -PI / 2, { kind: 'desk', shadeColor: '#1c7a48' }, { scale: 1.6, light: e > 0 && (k + (s > 0 ? 1 : 0)) % 2 === 0 ? { priority: 7, intensity: 6 * H.lamp, range: 14 } : false });
          // every draw is taken; a chair or a second pile stands or not by its own draw
          for (const q of [-1, 1]) for (const e of [-1, 1]) { const stands = rng.chance(0.7), dz = rng.range(-0.1, 0.1), turn = rng.range(-0.25, 0.25);
            if (stands) I('chair', tx + q * 1.0, 0, tz + e * 1.15 + dz, Math.atan2(-q, 0) + turn, { style: 'dining', seatColor: '#2f4a3a', color: '#8a5a30' }, { scale: 1.15 }); }
          I('bookStack', tx + rng.range(-0.2, 0.2), 0.78, tz + rng.range(-0.5, 0.5), rng.range(0, 3), { count: rng.int(3, 7) }, { scale: 1.5 });
          { const stands = rng.chance(0.7), dx = rng.range(-0.3, 0.3), dz = rng.range(-1.8, -1.4), turn = rng.range(0, 3), count = rng.int(2, 5);
            if (stands) I('bookStack', tx + dx, 0.78, tz + dz, turn, { count }, { scale: 1.5 }); }
        }
        // the great globe by the window, a smaller one by the stair
        I('globe', 6.6, 0, -bm, 0.4, { radius: 0.62, spin: 0.22, detail: 56 }, { scale: 1.9 });
        I('globe', -6.6, 0, -2 * bm - 1.2, 2, { radius: 0.4, spin: -0.3, detail: 48 }, { scale: 1.6 });
        I('staircase', -(X - 1.55 - 1.3), 0, -(Lm - 2.2), 0, { kind: 'spiral', height: 5.24, width: 1.15, turns: 1.6 }, { scale: 1, wall: true, occluder: false });
        for (const zz of [-0.9, -Lm + 0.9]) I('plant', X - 2.4, 0, zz, zz, { kind: 'palm', height: 2.4 }, { scale: 1.9 });
        for (const s of [-1, 1]) wallLight(I, s * 9.2 / LS, 6.1 / LS, -(Lm - 0.3), 2.5, top * LS);
        I('chandelier', 0, top - 0.25, -bm, 1, { arms: 12, tiers: 2, radius: 0.9, drop: 1.6, crystals: false }, { scale: 2.0, wall: true });
        I('chandelier', 0, top - 0.25, -2 * bm, 2, { arms: 12, tiers: 2, radius: 0.9, drop: 1.6, crystals: false }, { scale: 2.0, wall: true });
        rug(0, zc, 3.2, 16); for (const s of [-1, 1]) rug(s * 5.6, zc, 4.2, 11);
      }, { maxLights: 5, flameGain: 1.7, rugPlain: true, rugColors: ['#173a2e', '#141c30', '#a89a7a', '#7a5e2c'] });
      fill(libraryR, 11);
      libraryR.set = set; fireAnchor('library', libraryR, set);
    }
    await ctx.yield();
    // ---- THE GREAT HALL's movables: the log fire in its stone chimneypiece, the clock, the long table, the chandelier, rugs
    {
      const rng = R['hall-set'], X = HALL_W / HS / 2, Lm = HALL_L / HS, zf = (FIRE_Z - DOOR_Z) / HS, fs = 9 / (2.1 * HS);
      const set = await setRoom(hallR, rng, (I, pic, rug) => {
        I('fireplace', -(X - 0.22 * fs), 0, zf, PI / 2, { width: 2.1, breast: 12 / HS / fs - 1.36, color: '#d6cab0', breastColor: '#cfc3a8', hearthColor: '#3a3632' }, { scale: fs, wall: true, light: { intensity: 22 * H.lamp, range: 44 } });
        I('clock', -(X - 0.3), 0, zf + 3.6, PI / 2, { kind: 'longcase', color: '#4e2c1a' }, { scale: 1.55, wall: true });
        // the long oak table against the panelling, north of the fire: candlesticks, pewter, two great bowls of flowers
        const tz = zf - 4.95, tl = 4.2, tx = -(X - 1.0);
        I('table', tx, 0, tz, PI / 2, { width: tl, depth: 1.25, height: 0.84, legs: 'turned', color: '#6e4526' }, { scale: 1.15, wall: true });
        for (const e of [-1, 1]) {
          I('vase', tx, 0.84 * 1.15, tz + e * 1.5, e, { height: 0.42, flowers: 10, color: '#9a9a9e' }, { scale: 2.6, wall: true });
          I('candle', tx + 0.25, 0.84 * 1.15, tz + e * 2.1, 0, { holder: 'candelabra' }, { scale: 2.4, wall: true, light: e > 0 ? { intensity: 5 * H.lamp, range: 14 } : false });
          I('candle', tx + 0.3, 0.84 * 1.15, tz + e * 0.5, 0, { holder: 'stick' }, { scale: 2.6, wall: true, light: false });
          for (let i = 0; i < 3; i++) I('plate', tx - 0.25, 0.84 * 1.15, tz + e * (0.9 + i * 0.55), 0, { radius: 0.2, color: '#a4a4a8', band: '#8a8a90' }, { scale: 1.6, wall: true });
        }
        // oak chests under the east windows, tall chairs in pairs along the walls
        for (let k = 0; k < 3; k++) { const zz = -(k + 0.5) * Lm / 3; I('table', X - 0.7, 0, zz, -PI / 2, { width: 2.6, depth: 0.8, height: 0.7, legs: 'square', drawers: 3, color: '#6e4526' }, { scale: 1.2, wall: true });
          for (const e of [-1, 1]) I('chair', X - 0.6, 0, zz + e * 2.5, -PI / 2, { style: 'dining', color: '#5a3420', seatColor: '#7a1f2a' }, { scale: 1.5 }); }
        for (const zz of [zf + 2.9, zf + 4.4]) I('chair', -(X - 0.6), 0, zz, PI / 2, { style: 'dining', color: '#5a3420', seatColor: '#7a1f2a' }, { scale: 1.5 });
        I('chandelier', 0, HALL_RIDGE / HS - 0.3, (-30 - DOOR_Z) / HS, 0.3, { arms: 12, tiers: 2, radius: 0.9, drop: 1.25, crystals: false }, { scale: 2.0, wall: true, light: { intensity: 14 * H.lamp, range: 40 } });
        // candle branches on brackets on the screen either side of the first door: their flames move, their light plays on the oak
        for (const s of [-1, 1]) wallLight(I, s * 9.6 / HS, 5.4 / HS, -(Lm - 0.5), 2.3, HALL_WALL);
        rug(0, -Lm / 2, 3.6, 13); rug(-4.6, zf, 3.4, 5.2); rug(4.9, -Lm * 0.3, 3.0, 4.6); rug(4.9, -Lm * 0.72, 3.0, 4.6);
      }, { maxLights: 6, flameGain: 1.3, rugColors: ['#4c161a', '#1a2642', '#b8aa88', '#8a6c34'] });
      hallR.set = set; fireAnchor('hall', hallR, set);
    }
    await ctx.yield();
    // ---- THE GREAT HALL's own works (hall-local metres: x east, y over the floor, z from the front door's inner face north)
    {
      const rng = R.roof, b = INT.makeBuilder(), L = HALL_L, X = HALL_W / 2, yw = HALL_WALL, yr = HALL_RIDGE, pitch = Math.atan2(yr - yw, X), slope = Math.hypot(X, yr - yw);
      const bar = (x0, y0, x1, y1, z, t, d, c = OAK, sf = S_WOOD) => { const l = Math.hypot(x1 - x0, y1 - y0); b.add(box(l, t, d), { p: [(x0 + x1) / 2, (y0 + y1) / 2, z], r: [0, 0, Math.atan2(y1 - y0, x1 - x0)], c, surf: sf }); };
      // the open oak roof: boarded slopes on purlins and common rafters
      for (const s of [-1, 1]) {
        for (let k = 0; k < 8; k++) { const za = -L * k / 8, zb = -L * (k + 1) / 8, lo = [s * X, yw, 0], hi = [0, yr, 0];
          const q = [[lo[0], lo[1], za], [lo[0], lo[1], zb], [hi[0], hi[1], zb], [hi[0], hi[1], za]]; if (s < 0) b.quad(q[0], q[1], q[2], q[3], '#5a3620', S_WOODM); else b.quad(q[3], q[2], q[1], q[0], '#5a3620', S_WOODM); }
        for (const f of [0.3, 0.64]) b.add(box(0.5, 0.6, L), { p: [s * X * (1 - f), yw + (yr - yw) * f - 0.42, -L / 2], r: [0, 0, s * -pitch], c: OAK_D, surf: S_WOOD });
        const nr = 30; for (let i = 0; i < nr; i++) b.add(box(slope, 0.22, 0.2), { p: [s * X / 2, (yw + yr) / 2 - 0.16, -(i + 0.5) * L / nr], r: [0, 0, s * -pitch], c: '#5e4530', surf: S_WOODM });
      }
      b.add(box(0.6, 0.7, L), { p: [0, yr - 0.5, -L / 2], c: OAK_D, surf: S_WOOD });
      await ctx.yield();
      // seven trusses: wall posts on stone corbels, hammerbeams on curved braces, hammer posts, a collar on a great arch
      // of braces, a king post; carved pendants with gilt bosses under the hammerbeam ends and the arch's crown
      const NT = 7, hb = 4.9, yc = 22.6, pend = lathe([[0.02, -1.9], [0.2, -1.75], [0.34, -1.5], [0.16, -1.3], [0.3, -1.05], [0.42, -0.7], [0.24, -0.45], [0.4, -0.2], [0.46, 0]], 10);
      for (let i = 0; i < NT; i++) {
        const z = -(i + 0.5) * L / NT, c = i % 2 ? OAK : '#73553a';
        for (const s of [-1, 1]) {
          bar(s * X, yw - 0.45, 0, yr - 0.45, z, 0.85, 0.7, c);
          b.add(box(hb, 0.8, 0.72), { p: [s * (X - hb / 2), yw, z], c, surf: S_WOOD });
          b.add(box(0.72, 5.2, 0.72), { p: [s * (X - 0.4), yw - 2.6, z], c, surf: S_WOOD });
          b.add(box(0.95, 0.7, 1.0), { p: [s * (X - 0.45), yw - 5.5, z], c: STONE, surf: S_STONE });
          for (let k = 0; k < 5; k++) { const a0 = k / 5 * PI / 2, a1 = (k + 1) / 5 * PI / 2, r = hb - 0.7;
            bar(s * (X - 0.5 - r * (1 - Math.cos(a0))), yw - 0.4 - r * (1 - Math.sin(a0)) * 0.95, s * (X - 0.5 - r * (1 - Math.cos(a1))), yw - 0.4 - r * (1 - Math.sin(a1)) * 0.95, z, 0.5, 0.5, c); }
          const xh = X - hb + 0.35, yh = yw + (X - xh) * (yr - yw) / X;
          b.add(box(0.7, yh - yw - 0.3, 0.7), { p: [s * xh, (yw + yh) / 2 - 0.2, z], c, surf: S_WOOD });
          b.add(pend, { p: [s * xh, yw - 0.4, z], c: OAK_L, surf: S_WOOD });
          b.add(sph(0.3, 8, 6), { p: [s * xh, yw - 2.45, z], c: GILT, surf: S_GILT });
          // the great arch: from the hammer post's foot up to the collar's middle
          for (let k = 0; k < 7; k++) { const a0 = k / 7 * PI / 2, a1 = (k + 1) / 7 * PI / 2;
            bar(s * xh * Math.cos(a0), yw + 0.3 + (yc - 0.5 - yw - 0.3) * Math.sin(a0), s * xh * Math.cos(a1), yw + 0.3 + (yc - 0.5 - yw - 0.3) * Math.sin(a1), z, 0.6, 0.55, c); }
        }
        const xc = X * (yr - yc) / (yr - yw);
        b.add(box(xc * 2, 0.7, 0.66), { p: [0, yc, z], c, surf: S_WOOD });
        b.add(box(0.6, yr - yc - 0.6, 0.6), { p: [0, (yc + yr) / 2 - 0.1, z], c, surf: S_WOOD });
        b.add(pend, { p: [0, yc - 0.35, z], s: [0.8, 0.7, 0.8], c: OAK_L, surf: S_WOOD });
        b.add(sph(0.26, 8, 6), { p: [0, yc - 1.75, z], c: GILT, surf: S_GILT });
        if (i % 2 === 1) await ctx.yield();
      }
      // oak panelling to 9 m on the long walls: rails and stiles over the kit's wainscot colour, a cornice
      const wins = [0, 1, 2].map((k) => -(k + 0.5) * L / 3), inWin = (z) => wins.some((w) => Math.abs(z - w) < 4.4);
      for (const s of [-1, 1]) {
        for (const y of [0.35, 3.1, 6.0, 8.85]) {
          if (s < 0 || y < 1.9) b.add(box(0.12, y > 8 ? 0.5 : 0.3, L), { p: [s * (X - 0.06), y, -L / 2], c: y > 8 ? OAK_L : OAK, surf: S_WOOD });
          else for (let k = 0; k <= 3; k++) { const za = k === 0 ? 0 : wins[k - 1] - 4.4, zb = k === 3 ? -L : wins[k] + 4.4; b.add(box(0.12, y > 8 ? 0.5 : 0.3, za - zb), { p: [s * (X - 0.06), y, (za + zb) / 2], c: y > 8 ? OAK_L : OAK, surf: S_WOOD }); }
        }
        const ns = 26; for (let i = 0; i <= ns; i++) { const z = -i * L / ns; if (s > 0 && inWin(z)) b.add(box(0.1, 1.6, 0.26), { p: [s * (X - 0.05), 0.95, z], c: OAK, surf: S_WOOD }); else b.add(box(0.1, 8.7, 0.26), { p: [s * (X - 0.05), 4.5, z], c: OAK, surf: S_WOOD }); }
      }
      await ctx.yield();
      hallR.works = b;
    }
    // ---- the hall's carved oak screen with its cresting (no gallery on it), the first door's leaves folded right back
    // flat on the screen (the hall's face of that wall), its doorway by the one rule of doorways, the overmantel, the verdure tapestries (leaves and flowers, never a figure) and the shutters of the three great windows
    {
      const rng = R.tapestry, b = hallR.works, L = HALL_L, X = HALL_W / 2, zs = -L + 0.45, dw = 4.0, dh = 10.5, top = 12;
      // the screen: a panelled oak front before the north wall, pilasters, a strapwork frieze, a cornice and a cresting
      for (const s of [-1, 1]) {
        b.add(box(X - dw, top, 0.5), { p: [s * (X + dw) / 2, top / 2, zs - 0.2], c: '#64482f', surf: S_WOOD });
        const np = 5; for (let i = 0; i <= np; i++) { const x = s * (dw + 0.7 + i * (X - dw - 1.2) / np);
          b.add(box(0.8, top - 0.6, 0.5), { p: [x, top / 2 - 0.3, zs + 0.15], c: OAK, surf: S_WOOD }); b.add(box(1.1, 0.7, 0.7), { p: [x, 0.35, zs + 0.2], c: OAK_D, surf: S_WOOD }); b.add(box(1.05, 0.5, 0.7), { p: [x, top - 1.9, zs + 0.2], c: OAK_L, surf: S_WOOD });
          if (i < np) { const xm = x + s * (X - dw - 1.2) / np / 2, pw = (X - dw - 1.2) / np - 1.1;
            for (const [y, h] of [[2.5, 3.4], [6.6, 3.6]]) { b.add(box(pw, h, 0.12), { p: [xm, y, zs + 0.1], c: '#73553a', surf: S_WOOD }); b.add(box(pw * 0.6, h * 0.62, 0.1), { p: [xm, y, zs + 0.2], c: '#5a3420', surf: S_WOODM });
              const ring = new THREE.TorusGeometry(Math.min(pw, h) * 0.2, 0.07, 5, 14); b.add(ring, { p: [xm, y, zs + 0.27], c: OAK_L, surf: S_WOOD }); }
            // strapwork in the frieze: a lozenge between two rings, bands between
            b.add(box(0.75, 0.75, 0.12), { p: [xm, top - 1.0, zs + 0.3], r: [0, 0, PI / 4], c: OAK_L, surf: S_WOOD });
            for (const e of [-1, 1]) b.add(new THREE.TorusGeometry(0.34, 0.08, 5, 12), { p: [xm + e * pw * 0.32, top - 1.0, zs + 0.3], c: OAK_L, surf: S_WOOD });
            b.add(box(pw, 0.12, 0.1), { p: [xm, top - 1.0, zs + 0.26], c: OAK_L, surf: S_WOOD });
            // the cresting: a scrolled arch and an obelisk, turn about
            const arc = new THREE.TorusGeometry(pw * 0.3, 0.13, 5, 12, PI); b.add(arc, { p: [xm, top + 0.25, zs], c: OAK, surf: S_WOOD });
            b.add(sph(0.3, 8, 6), { p: [xm, top + 0.25 + pw * 0.3 + 0.2, zs], c: GILT, surf: S_GILT });
          }
          b.add(cyl(0.02, 0.3, 1.9, 4), { p: [x, top + 1.2, zs], r: [0, PI / 4, 0], c: OAK, surf: S_WOOD }); b.add(sph(0.2, 6, 5), { p: [x, top + 2.2, zs], c: GILT, surf: S_GILT });
        }
        b.add(box(X - dw + 0.2, 0.55, 0.9), { p: [s * (X + dw) / 2, top - 0.1, zs + 0.2], c: OAK_L, surf: S_WOOD });
        // the leaf of the first door: folded right back, flat on the screen, a half turn from shut, clear of the doorcase
        b.add(box(dw - 0.3, dh - 0.2, 0.22), { p: [s * (dw + 0.4 + (dw - 0.3) / 2), dh / 2, zs + 0.62], c: '#7a4a2a', surf: S_WOOD });
        for (let q = 0; q < 3; q++) for (const e of [-1, 1]) b.add(box(dw * 0.34, dh * 0.24, 0.1), { p: [s * (dw + 0.4 + (dw - 0.3) / 2) + e * dw * 0.22, 1.8 + q * dh * 0.3, zs + 0.76], c: '#5a3420', surf: S_WOODM });
        b.add(sph(0.16, 8, 6), { p: [s * (dw + 0.75), dh * 0.45, zs + 0.85], c: '#c9a44a', surf: S_BRASS });
      }
      // the doorcase: oak posts, a deep head and a strapwork panel over it (rings and a lozenge, no arms)
      for (const s of [-1, 1]) b.add(box(0.5, dh + 0.3, 0.9), { p: [s * (dw + 0.2), dh / 2, zs - 0.1], c: OAK_D, surf: S_WOOD });
      b.add(box(dw * 2 + 1.0, 1.5, 0.8), { p: [0, dh + 0.75, zs - 0.1], c: '#64482f', surf: S_WOOD });
      b.add(box(1.5, 1.5, 0.14), { p: [0, dh + 0.75 + 1.6, zs + 0.1], r: [0, 0, PI / 4], c: OAK_L, surf: S_WOOD });
      for (const e of [-1, 1]) b.add(new THREE.TorusGeometry(0.6, 0.1, 5, 14), { p: [e * 2.2, dh + 0.75, zs + 0.34], c: OAK_L, surf: S_WOOD });
      b.add(new THREE.TorusGeometry(1.25, 0.14, 5, 16, PI), { p: [0, top + 0.3, zs], c: OAK, surf: S_WOOD });
      // the first door's doorway through the 4 m wall, by the one rule: it leads into the saloon, so its reveal is the
      // saloon's pale joinery; oak only for the screen's own thickness, before the wall's face (the lining runs 0.25 m
      // past both faces of the wall, to the doorcase's own depth); a moulded architrave on the doorcase
      doorway(b, { hw: dw, h: dh, zf: -L, dep: HALL_TH, lap: 0.25, oak: true, pale: '#efe6d2', cx: dw + 0.45, cz: zs + 0.35, ch: dh + 0.3, hz: zs + 0.3, cc: OAK_L });
      {
        // brackets on the screen for the two candle branches
        for (const s of [-1, 1]) { b.add(box(0.8, 0.12, 0.7), { p: [s * 9.6, 5.34, zs + 0.45], c: OAK_D, surf: S_WOOD }); b.add(box(0.14, 0.9, 0.5), { p: [s * 9.6, 4.88, zs + 0.35], c: OAK_D, surf: S_WOOD }); }
      }
      await ctx.yield();
      // overmantel of the stone chimneypiece: panels in strapwork, a cornice (the kit's hearth stands under it)
      const zf = FIRE_Z - DOOR_Z, xm = -X + 0.31 * 9 / 2.1 + 0.1;
      for (const e of [-1, 0, 1]) { b.add(box(0.14, 3.2, 2.2), { p: [xm, 9.2, zf + e * 2.9], c: STONE_D, surf: S_STONE }); b.add(new THREE.TorusGeometry(0.75, 0.12, 5, 14), { p: [xm + 0.1, 9.2, zf + e * 2.9], r: [0, PI / 2, 0], c: STONE, surf: S_STONE }); }
      b.add(box(1.4, 0.6, 9.9), { p: [xm - 0.4, 12.1, zf], c: STONE, surf: S_STONE }); b.add(box(1.0, 0.4, 9.5), { p: [xm - 0.3, 7.0, zf], c: STONE, surf: S_STONE });
      for (const e of [-1, 1]) b.add(box(0.5, 5.2, 0.6), { p: [xm - 0.1, 9.5, zf + e * 4.5], c: STONE, surf: S_STONE });
      // verdure tapestries: woven grounds of leaves and flowers in the palette's greens and golds, each dealt by the seed
      const greens = ['#7b8f6a', '#5a7a52', '#8a9a5a', '#46664e', '#9aa878'], blooms = ['#e6d8b0', '#c98a7a', '#b99a5a', '#d8c070'];
      const tapestry = (cx, cy, cz, w, h, nx, nu, nv) => {
        const leaves = [], N = Math.round(w * h * 0.9); for (let i = 0; i < N; i++) leaves.push([rng(), rng() * 0.86, rng.range(0.035, 0.085), rng.range(0, PI), rng.pick(greens), rng()]);
        const flowers = []; for (let i = 0; i < N * 0.35; i++) flowers.push([rng(), rng() * 0.8, rng.range(0.012, 0.022), rng.pick(blooms)]);
        const ground = new THREE.Color('#2c4a44'), far = new THREE.Color('#8fa2a0'), border = new THREE.Color('#b99a5a'), bd = new THREE.Color('#6a2f2a'), col = new THREE.Color(), tmp = new THREE.Color(), asp = w / h;
        const paint = (u, v) => {
          if (u < 0.06 || u > 0.94 || v < 0.07 || v > 0.93) { const k = Math.floor(u * nu * 0.5) + Math.floor(v * nv * 0.5); return col.copy(k % 3 ? border : bd); }
          col.copy(ground).lerp(far, smoothstep(0.7, 0.92, v) * 0.8);
          for (const lf of leaves) { const dx = (u - lf[0]) * asp, dy = v - lf[1], c = Math.cos(lf[3]), sn = Math.sin(lf[3]), a = (dx * c + dy * sn) / lf[2], q = (-dx * sn + dy * c) / (lf[2] * 0.45), d = a * a + q * q;
            if (d < 1) col.lerp(tmp.set(lf[4]), (1 - d * 0.6) * (0.55 + 0.45 * lf[5])); }
          for (const f of flowers) { const dx = (u - f[0]) * asp, dy = v - f[1]; if (dx * dx + dy * dy < f[2] * f[2]) col.set(f[3]); }
          return col;
        };
        for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
          const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv, P = (u, v) => [cx + nx * (0.16 + 0.05 * Math.sin(u * 19)), cy + (v - 0.5) * h, cz + (u - 0.5) * w * (nx > 0 ? -1 : 1)];
          const c = paint((u0 + u1) / 2, (v0 + v1) / 2).clone();
          if (nx > 0) b.quad(P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1), c, S_FABRIC); else b.quad(P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1), c, S_FABRIC);
        }
        b.add(cyl(0.09, 0.09, w + 0.6, 6), { p: [cx + nx * 0.2, cy + h / 2 + 0.1, cz], r: [PI / 2, 0, 0], c: GILT, surf: S_BRASS });
      };
      tapestry(-X, 12.9, zf + 10.2, 8.6, 6.0, 1, Math.round(46 * Math.sqrt(detail)), 30); await ctx.yield();
      tapestry(-X, 12.9, zf - 10.6, 8.6, 6.0, 1, Math.round(46 * Math.sqrt(detail)), 30); await ctx.yield();
      for (const k of [1, 2]) { tapestry(X, 12.4, -k * L / 3, 4.6, 7.0, -1, 24, 34); await ctx.yield(); }
      // two landscapes in gilt frames high on the screen wall (land and sky only)
      for (const s of [-1, 1]) paintLandscape(b, { position: [s * 9.2, 18.6, -L + 0.06], normal: [0, 0, 1], width: 6.2, height: 4.2 }, R.tapestry);
      addShutters(b, hallR, '#64482f');
      await ctx.yield();
      for (const st of b.tessellateSteps ? b.tessellateSteps(5, 1.5) : []) await ctx.yield();
      const mesh = new THREE.Mesh(b.build(), hall.materials.prop); mesh.name = 'hall-works'; hall.object.add(mesh);
      hallR.worksTris = b.triangles;
      await ctx.yield();
    }
    await ctx.yield();
    // ---- each state room's own works: its shutters (folded open, or shut with their cracks), the leaves of its north door
    // folded back (the saloon's pair; the drawing room's pair of panelled oak with brass knobs, the leaves of the library's
    // south doorway; the library's one baize-green leaf with three padded panels), and what the kit has no generator for.
    // ONE RULE for every open leaf of the row: folded in two and right back, flat on the wall face of the room it opens
    // into, a half turn from shut, clear of the opening by the casing; none stands in a doorway. Every doorway of the
    // row takes the one rule of doorways (a pale cased reveal in the next room's joinery, a moulded architrave)
    // the door wall of the saloon and of the drawing room: an architrave, fluted pilasters, an entablature with gilt
    // studs and a pediment with a gilt cartouche; brackets for the candle branches; a deep cornice with a gilt moulding
    // and a dado rail round the room; pelmets over the east windows; plaster roses over the chandeliers; urns of flowers.
    // o.plain (the library's north doorway, plain by the design): an oak architrave and an oak cornice over it, and
    // plain oak brackets for the two candle branches: nothing else on that wall, nothing gilded
    const dress = (b, sr, o) => {
      const room = sr.room, L = room.size.length, X = room.size.width / 2, ew = room.exit.width, eh = room.exit.height, zw = -L, px = o.px, cc = o.color, gl = o.gilt ?? GILT;
      if (o.plain) {
        for (const s of [-1, 1]) b.add(box(0.45, eh + 0.2, 0.3), { p: [s * (ew / 2 + 0.23), eh / 2, zw + 0.15], c: cc, surf: S_WOODM });
        b.add(box(ew + 0.92, 0.5, 0.3), { p: [0, eh + 0.45, zw + 0.15], c: cc, surf: S_WOODM });
        b.add(box(ew + 1.5, 0.3, 0.6), { p: [0, eh + 0.85, zw + 0.3], c: cc, surf: S_WOODM });
        for (const s of [-1, 1]) for (const yy of o.sy) { b.add(box(0.5, 1.0, 0.08), { p: [s * o.sx, yy, zw + 0.06], c: cc, surf: S_WOODM }); b.add(box(0.7, 0.08, 0.5), { p: [s * o.sx, yy - 0.5, zw + 0.3], c: cc, surf: S_WOODM }); }
        return;
      }
      for (const s of [-1, 1]) {
        b.add(box(0.45, eh + 0.2, 0.3), { p: [s * (ew / 2 + 0.23), eh / 2, zw + 0.15], c: cc, surf: S_WOODM });
        b.add(box(0.6, eh + 0.5, 0.36), { p: [s * px, (eh + 0.5) / 2, zw + 0.18], c: cc, surf: S_WOODM });
        b.add(box(0.9, 0.7, 0.5), { p: [s * px, 0.35, zw + 0.25], c: cc, surf: S_WOODM });
        b.add(box(0.9, 0.5, 0.5), { p: [s * px, eh + 0.25, zw + 0.25], c: gl, surf: S_GILT });
        for (let q = 0; q < 3; q++) b.add(box(0.1, eh - 2.2, 0.06), { p: [s * px + (q - 1) * 0.16, eh / 2 + 0.2, zw + 0.38], c: gl, surf: S_GILT });
      }
      const ww = px + 0.6, y0 = eh + 0.5, y1 = y0 + 1.2, rise = o.rise ?? 1.7, a = Math.atan2(rise, ww), len = Math.hypot(ww, rise);
      b.add(box(ww * 2, 0.9, 0.34), { p: [0, y0 + 0.45, zw + 0.17], c: cc, surf: S_WOODM });
      for (let i = -5; i <= 5; i++) b.add(sph(0.14, 6, 4), { p: [i * ww / 5.6, y0 + 0.45, zw + 0.38], c: gl, surf: S_GILT });
      b.add(box(ww * 2 + 0.5, 0.3, 0.7), { p: [0, y0 + 1.05, zw + 0.35], c: cc, surf: S_WOODM });
      for (const s of [-1, 1]) b.add(box(len + 0.3, 0.3, 0.7), { p: [s * ww / 2, y1 + rise / 2, zw + 0.35], r: [0, 0, -s * a], c: cc, surf: S_WOODM });
      b.quad([-ww, y1, zw + 0.1], [ww, y1, zw + 0.1], [0, y1 + rise, zw + 0.1], [0, y1 + rise, zw + 0.1], o.field ?? cc, S_MATTE);
      b.add(box(0.8, 0.8, 0.14), { p: [0, y1 + rise * 0.42, zw + 0.2], r: [0, 0, PI / 4], c: gl, surf: S_GILT });
      for (const s of [-1, 1]) b.add(new THREE.TorusGeometry(0.3, 0.07, 5, 12), { p: [s * 1.3, y1 + rise * 0.3, zw + 0.2], c: gl, surf: S_GILT });
      // wall lights either side: a gilt back plate, two arms, two candles alight
      if (o.sx) for (const s of [-1, 1]) for (const yy of o.sy) {
        const x = s * o.sx;
        b.add(box(0.5, 1.0, 0.08), { p: [x, yy, zw + 0.06], c: gl, surf: S_GILT });
        b.add(box(0.36, 0.36, 0.1), { p: [x, yy + 0.62, zw + 0.07], r: [0, 0, PI / 4], c: gl, surf: S_GILT });
        for (const e of [-1, 1]) {
          b.add(box(0.34, 0.08, 0.5), { p: [x + e * 0.17, yy - 0.5, zw + 0.3], c: gl, surf: S_GILT });
        }
      }
      // the cornice (broken at the pediment) and the dado rail
      if (o.H) {
        const H = o.H, cut = y1 + rise > H - 0.9 ? ww + 0.4 : 0;
        b.add(box(X * 2, 0.55, 0.6), { p: [0, H - 0.3, -0.3], c: cc, surf: S_WOODM }); b.add(box(X * 2, 0.16, 0.75), { p: [0, H - 0.7, -0.3], c: gl, surf: S_GILT });
        if (cut) for (const s of [-1, 1]) { b.add(box(X - cut, 0.55, 0.6), { p: [s * (X + cut) / 2, H - 0.3, zw + 0.3], c: cc, surf: S_WOODM }); b.add(box(X - cut, 0.16, 0.75), { p: [s * (X + cut) / 2, H - 0.7, zw + 0.3], c: gl, surf: S_GILT }); }
        else { b.add(box(X * 2, 0.55, 0.6), { p: [0, H - 0.3, zw + 0.3], c: cc, surf: S_WOODM }); b.add(box(X * 2, 0.16, 0.75), { p: [0, H - 0.7, zw + 0.3], c: gl, surf: S_GILT }); }
        for (const s of [-1, 1]) { b.add(box(0.6, 0.55, L), { p: [s * (X - 0.3), H - 0.3, -L / 2], c: cc, surf: S_WOODM }); b.add(box(0.75, 0.16, L), { p: [s * (X - 0.3), H - 0.7, -L / 2], c: gl, surf: S_GILT }); }
      }
      if (o.dado) { b.add(box(0.14, 0.18, L), { p: [-(X - 0.07), o.dado, -L / 2], c: cc, surf: S_WOODM }); for (const s of [-1, 1]) b.add(box(X - ww, 0.18, 0.14), { p: [s * (X + ww) / 2, o.dado, zw + 0.07], c: cc, surf: S_WOODM }); }
      // pelmets over the east windows: a deep valance under a gilt cornice
      if (o.pelmet && sr.win) {
        const w = sr.win, ry = Math.atan2(w.axis.x, w.axis.z) - PI / 2;
        for (let k = 0; k < w.n; k++) {
          const c = w.first.clone().addScaledVector(w.axis, k * w.sp), at = (y, d) => [c.x + w.normal.x * d, c.y + y, c.z + w.normal.z * d];
          b.add(box(w.w + 2.2, 1.1, 0.5), { p: at(w.h / 2 + 0.8, 0.3), r: [0, ry, 0], c: o.pelmet, surf: S_FABRIC });
          b.add(box(w.w + 2.5, 0.26, 0.66), { p: at(w.h / 2 + 1.46, 0.33), r: [0, ry, 0], c: gl, surf: S_GILT });
        }
      }
      // plaster roses on the ceiling over the chandeliers
      for (const zz of o.roses || []) {
        const y = o.crown - 0.1;
        b.add(new THREE.TorusGeometry(1.8, 0.14, 5, 24), { p: [0, y, zz], r: [PI / 2, 0, 0], c: cc, surf: S_MATTE });
        b.add(new THREE.TorusGeometry(1.05, 0.1, 5, 20), { p: [0, y, zz], r: [PI / 2, 0, 0], c: gl, surf: S_GILT });
        for (let i = 0; i < 10; i++) { const an = i / 10 * PI * 2; b.add(sph(0.32, 6, 4), { p: [Math.cos(an) * 1.42, y + 0.02, zz + Math.sin(an) * 1.42], r: [0, -an, 0], s: [1, 0.25, 0.5], c: cc, surf: S_MATTE }); }
        b.add(sph(0.45, 8, 5), { p: [0, y + 0.05, zz], s: [1, 0.4, 1], c: gl, surf: S_GILT });
      }
      // great urns of flowers on pedestals by the door wall
      if (o.urns) for (const s of [-1, 1]) {
        const x = s * o.urns, z = zw + 1.0, st = '#e9e2d2', rr = o.rng;
        b.add(box(0.95, 0.3, 0.95), { p: [x, 0.15, z], c: st, surf: S_STONE }); b.add(box(0.68, 1.5, 0.68), { p: [x, 1.05, z], c: st, surf: S_STONE }); b.add(box(0.95, 0.2, 0.95), { p: [x, 1.9, z], c: st, surf: S_STONE });
        b.add(lathe([[0.2, 0], [0.26, 0.08], [0.12, 0.2], [0.34, 0.5], [0.46, 0.85], [0.4, 1.1], [0.22, 1.25], [0.3, 1.36]], 10), { p: [x, 2.0, z], c: '#2c4f7c', surf: S_ENAMEL });
        b.add(sph(0.62, 8, 6), { p: [x, 3.75, z], s: [1, 0.8, 1], c: '#3d6a38', surf: S_MATTE });
        for (let i = 0; i < 12; i++) { const an = rr.range(0, PI * 2), el = rr.range(0.1, 1.3), r0 = 0.66; b.add(sph(rr.range(0.13, 0.2), 6, 4), { p: [x + Math.cos(an) * Math.cos(el) * r0, 3.75 + Math.sin(el) * r0 * 0.85, z + Math.sin(an) * Math.cos(el) * r0], c: rr.pick(['#f2e6ea', '#e8a8b4', '#d86a7c', '#f4e3a0', '#ffffff']), surf: S_MATTE }); }
      }
    };
    const roomWorks = async (sr, color, leaf, extra, dr) => {
      const b = INT.makeBuilder(), room = sr.room, L = room.size.length, ew = room.exit.width, eh = room.exit.height;
      addShutters(b, sr, color);
      for (const s of leaf.sides) {
        const lw = leaf.w ?? ew / 4, x = s * (ew / 2 + 0.55 + lw / 2);
        b.add(box(lw, eh - 0.2, 0.2), { p: [x, eh / 2, -L + 0.3], c: leaf.color, surf: leaf.surf ?? S_WOOD });
        if (leaf.panel) for (let q = 0; q < 3; q++) piece(b, [x - lw * 0.35, 1.7 + q * eh * 0.3 - eh * 0.125, -L + 0.415], [lw * 0.7, 0, 0], [0, eh * 0.25, 0], [0, 0, 1], leaf.panel, S_WOODM);
        b.add(sph(0.14, 8, 6), { p: [x - s * lw * 0.38, eh * 0.45, -L + 0.48], c: leaf.knob ?? '#c9a44a', surf: leaf.knob ? S_PEWTER : S_BRASS });
      }
      if (dr) dress(b, sr, dr);
      doorway(b, { hw: ew / 2, h: eh, zf: -L, dep: TH, pale: dr.reveal, cx: ew / 2 + 0.455, cz: -L + 0.3, ch: eh + 0.2, hz: dr.plain ? -L + 0.3 : null, cc: dr.color });
      await ctx.yield();
      if (extra) extra(b);
      await ctx.yield();
      const mesh = new THREE.Mesh(b.build(), room.materials.prop); mesh.name = 'room-works'; room.object.add(mesh);
      sr.worksTris = b.triangles;
      await ctx.yield();
    };
    await roomWorks(saloonR, '#e2d6bc', { sides: [-1, 1], color: '#e2d6bc', panel: '#c9b996' }, null,
      { px: 7.15, color: '#efe6d2', reveal: '#efe7d6', field: '#b9cfc6', H: 13, dado: 1.3 * SS, pelmet: '#c9ae6a', crown: 16.6, roses: [-RL / 3, -2 * RL / 3], sx: 13.3, sy: [6.6], urns: 12.5, rng: R.saloon.fork('urns') });
    await roomWorks(drawingR, '#e6dcc6', { sides: [-1, 1], color: OAK, panel: OAK_D }, (b) => {
      const X = RW / 2, zc = -RL / 2, xb = -X + 0.308 * 2.7 * SS + 0.06;
      // the tall looking-glass over the fire in its gilt frame, by the one rule of overmantel glasses
      overmantelGlass(b, { x: xb, y: 9.4, z: zc, w: 4.0, h: 6.2, win: drawingR.win, shut: drawingR.shut, lights: drawingR.openRow.mullions[0], sky: H.sky, leaf: '#e6dcc6', items: drawingR.set.fur.items });
      for (const e of [-1, 1]) { b.add(box(0.3, 6.8, 0.36), { p: [xb + 0.05, 9.4, zc + e * 2.15], c: GILT, surf: S_GILT }); b.add(box(0.3, 0.36, 4.66), { p: [xb + 0.05, 9.4 + e * 3.25, zc], c: GILT, surf: S_GILT }); }
      b.add(new THREE.TorusGeometry(0.7, 0.12, 5, 14, PI), { p: [xb + 0.05, 12.8, zc], r: [0, PI / 2, 0], c: GILT, surf: S_GILT });
      // the pianoforte, a square one, its lid closed
      const px = -8.9, pz = -RL + 6.2, m = new THREE.Matrix4().makeRotationY(0.35).setPosition(px, 0, pz), wood = '#5e2415';
      b.add(box(3.4, 0.62, 1.6), { p: [0, 1.5, 0], pre: m, c: wood, surf: INT.surf(1, 0.75) });
      b.add(box(3.5, 0.08, 1.7), { p: [0, 1.85, 0], pre: m, c: '#6e2c1a', surf: INT.surf(1, 0.8) });
      b.add(box(2.2, 0.3, 0.12), { p: [-0.3, 1.5, 0.84], pre: m, c: '#4a1c10', surf: INT.surf(1, 0.7) });
      for (const ex of [-1.5, 0, 1.5]) for (const ez of [-0.62, 0.62]) b.add(lathe([[0.09, 0], [0.13, 0.12], [0.07, 0.3], [0.12, 0.7], [0.1, 1.05], [0.15, 1.19]], 8), { p: [ex, 0, ez], pre: m, c: wood, surf: INT.surf(1, 0.6) });
      b.add(box(0.5, 0.06, 0.2), { p: [-0.3, 0.12, 0.78], pre: m, c: '#c9a44a', surf: S_BRASS });
    }, { px: 7.15, color: '#efe7d6', reveal: PLASTER, field: '#93a583', H: 14.5, dado: 1.2 * SS, pelmet: '#a2504e', crown: 16.7, roses: [-RL / 3, -2 * RL / 3], sx: 13.3, sy: [6.6] });
    await roomWorks(libraryR, '#4a2c18', { sides: [-1], w: 4.0, color: '#213f2b', surf: S_FABRIC, knob: '#4a4038', panel: '#2d5239' }, null, { plain: true, color: OAK_D, reveal: PLASTER, sx: 9.2, sy: [6.6] });

    // ---------------- fog, light and what is drawn: each a pure function of the lens's z
    const fogOut = new THREE.Color(env.fogColor), fogIn = new THREE.Color('#2a2018'), fog = new THREE.Fog(fogOut.clone(), env.fogNear, env.fogFar);
    scene.fog = fog;
    // the scene's own ground colour (the outside part draws its sky over it; indoors every opening gives on a place that is drawn)
    scene.background = new THREE.Color('#b98a5c');
    // the outside's lights stay in the scene (dimmed to zero indoors, never hidden): only its meshes are hidden
    for (const l of outside.lights) if (l.parent !== scene) scene.attach(l);
    // a thing goes off when the lens is OFF metres north of the door plane that closes it behind
    const _cp = new V3(), OFF = 6;
    const setPlace = () => {
      const cz = _cp.z;
      // 0 outdoors, 1 indoors: across the front door, z -8 to z -14 (3 m either side of the door at z -11)
      const inside = 1 - smoothstep(-14, -8, cz);
      fog.color.copy(fogOut).lerp(fogIn, inside); fog.near = lerp(env.fogNear, 90, inside); fog.far = lerp(env.fogFar, 620, inside);
      for (let i = 0; i < outside.lights.length; i++) outside.lights[i].intensity = outside.lightBase[i] * (1 - inside);
      // WHAT IS DRAWN. From the entry on: the saloon, the drawing room, the library and the far group of below stairs
      // (the row of open doors shows them from the porch); the part's own group is never switched. The near group of
      // below stairs comes on at the drawing room's south door plane: south of it no straight line through the
      // library's north doorway reaches any of it (the part's own count makes the two groups); never off again.
      // Going off, each lies wholly behind the lens beyond a wall: the outside beyond the hall's south wall, the hall
      // beyond the first door's wall, the saloon beyond its north wall, the drawing room and the library beyond the
      // library's north wall (z0)
      outside.object.visible = cz > DOOR_Z - OFF;
      hall.object.visible = cz > zFirst - OFF;
      saloonR.room.object.visible = cz > zS - RL - OFF;
      drawingR.room.object.visible = cz > z0 - OFF;
      libraryR.room.object.visible = cz > z0 - OFF;
      below.near.visible = cz < zD;
    };

    return {
      scene, path, duration: 44, pace,
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 16, sway: 0.45, bank: 0.35 },
      pois,
      portal: { shape: 'arch', width: 7, height: 8.6, color: '#ffe2b8' },
      // one post for the whole flight (the engine reads it once): brightness by place is the rigs' and the parts' own
      post: { exposure: 1.1, bloom: { strength: 0.42, radius: 0.7, threshold: 0.95 },
        grade: { saturation: 1.05, contrast: 1.04, tint: '#fff6ea', shadowTint: '#140c06', vignette: 0.3, grain: 0.02, aberration: 0 } },
      update(dt, time, camera) {
        _cp.setFromMatrixPosition(camera.matrixWorld);
        setPlace();
        if (outside.object.visible) outside.update(dt, time, camera);
        below.update(dt, time, camera);
        for (const r of rooms) if (r.room.object.visible) r.room.update(dt, time, camera);
        for (let i = 0; i < updaters.length; i++) if (updaters[i].room.object.visible) updaters[i].update(dt, time, camera);
      },
      dispose() { outside.dispose(); below.dispose(); },
    };
  },
};
