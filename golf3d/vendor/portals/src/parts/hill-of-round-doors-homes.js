// hill-of-round-doors: THE HOMES WITH ROUND DOORS (the homes builder's part). Twenty fronts set into the green hill
// on the plan's front lines: an arched wall 0.5 m thick whose outline is the plan's frontTop, a course edging the
// arch, a turf lip of the look's own grass colour roofing the gap to the mound with a ragged fringe, ONE ROUND DOOR
// in a plain strong colour deep in its reveal (a brass knob in its very middle, strap hinges, no mark of any kind),
// round windows whose rooms glow by look.lit, a stubby chimney above. The lip wears the ground's own sward and sinks
// into the mound behind it; the mound has tufts, wild flowers and small things at its flanks (…-homes-mound.js).
// Everything is laid by PLACE: how rich a home is built follows the plan's distance of the home from the flown
// line over the ground (hill-of-round-doors-homes-deal.js, tierOf), never the lens. Nothing here reads the camera,
// the frame or the wall clock; update(dt, time, u) moves only what the wind and the flames move, by the clock.
// THE GARDENS lie on the plan's ground and ask the flown line's clear air before anything stands (8 m and a margin,
// measured on the plan's own route); the last home's forecourt keeps low things 1.5 m and taller ones 4 m in plan
// from the line, and 2 m of clear air round the line itself.
// THE GREEN DOOR is hinged on its left as one comes to it and swings inward by PLACE, by the plan's DOOR_SWING: shut
// until its shutUntil metres of the route are still to fly (as the flight turns onto the last lane), open and at
// rest at its openAt, so that the lane is flown toward the open, glowing doorway (the hall, its lamps and its
// hearth: hill-of-round-doors-homes-hall.js).
// STREAMS OF THE SEED (o.rngFor): 'door-paints' the door colours in lane order (no two neighbours alike);
// 'home-<n>' each front's wall, course, rim, windows, chimney; 'fringe-<n>' the blades of its lip; 'dress-<n>' its
// window boxes; 'mound-<n>' the tufts, wild flowers and small things of its mound; 'garden-<n>' its fence, beds, vegetables, washing, cat and hens' places (at the last home: its
// forecourt, hill-of-round-doors-homes-top.js, under the lead's own rule of clear air there; 'banks-<n>' the flowers
// up the banks either side of it); 'smoke' the puffs' times;
// 'hens' each hen's colour and pecking time.
// This part adds no light: its lit material takes the scene's sun, fill and fog (the land casts no shadow map, so
// the shade of reveals and corners is baked into the colours at the building, from the look's sun).
import { makePath } from '../kit/core.js';
import { HOMES, ROUTE, TOP, groundY, DOOR_SWING } from './hill-of-round-doors-plan.js';
import { makeGeo, lin } from './hill-of-round-doors-homes-geo.js';
import { makeSolidMaterial } from './hill-of-round-doors-homes-mat.js';
import { layWall, layDoor, layWindow, layFringe, layChimney } from './hill-of-round-doors-homes-front.js';
import { dealPaints, dealHome, readLook } from './hill-of-round-doors-homes-deal.js';
import { layGarden, layWallDress } from './hill-of-round-doors-homes-garden.js';
import { layTopGarden } from './hill-of-round-doors-homes-top.js';
import { layMound } from './hill-of-round-doors-homes-mound.js';
import { makeSmoke, makeHens } from './hill-of-round-doors-homes-life.js';
import { makeHallMaterial, layHallShell, laySideRoom, layHallThings, layHallExtras, layLeaf, layRoof, HINGE, ARCHWAY } from './hill-of-round-doors-homes-hall.js';

// the homes are baked each alone by the line and in groups that stand together farther off, so that a home out of
// the picture is not drawn and no step of the building is long
const GROUPS = [[0], [1], [2], [3], [4], [5], [6], [7], [8], [9, 10], [13, 14], [16], [11, 12], [15, 17, 18], [19]];

// the ground's height over a home's garden level, read from a small table by place: the gardens lie on the plan's ground
function liftOf(h, pad = 3, zb = 1, nz = 10) {
  const nx = Math.ceil(h.w + pad) * 2, t = new Float32Array((nx + 1) * (nz + 1));
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const lx = i - nx / 2, lz = j - zb; t[j * (nx + 1) + i] = groundY(h.x + h.fz * lx + h.fx * lz, h.z - h.fx * lx + h.fz * lz) - h.y; }
  return (wx, wz) => {
    const rx = wx - h.x, rz = wz - h.z, lx = Math.min(nx - 0.001, Math.max(0, rx * h.fz - rz * h.fx + nx / 2)), lz = Math.min(nz - 0.001, Math.max(0, rx * h.fx + rz * h.fz + zb));
    const i = Math.floor(lx), j = Math.floor(lz), a = lx - i, b = lz - j, k = j * (nx + 1) + i;
    return (t[k] * (1 - a) + t[k + 1] * a) * (1 - b) + (t[k + nx + 1] * (1 - a) + t[k + nx + 2] * a) * b;
  };
}

export async function buildHomes(ctx, o) {
  const { THREE, rngFor } = o, look = readLook(THREE, o.look);
  const object = new THREE.Group(); object.name = 'hill-homes';
  const made = [], solid = makeSolidMaterial(THREE, look); made.push(solid.material);
  const path = makePath(ROUTE), routeLength = path.length;
  await ctx.yield();
  const paints = dealPaints(THREE, HOMES, rngFor('door-paints'));
  const deals = HOMES.map((h, i) => dealHome(THREE, h, i, rngFor('home-' + i), look, paints[i]));
  const smokeAt = [], hensAt = [];
  let triangles = 0, drawCalls = 0;
  await ctx.yield();
  for (const list of GROUPS) {
    const G = makeGeo(THREE);
    for (const i of list) {
      const h = HOMES[i], d = deals[i];
      G.pushYaw(h.x, h.y, h.z, h.fx, h.fz);
      const sun = { x: look.sun.x * h.fz - look.sun.z * h.fx, y: look.sun.y, z: look.sun.x * h.fx + look.sun.z * h.fz };
      const O = layWall(G, h, d, look, d.n);
      layDoor(G, d, sun, d.tier === 'top' ? { leaf: false, depth: 0.5 } : {});
      if (d.tier === 'top') { await ctx.yield(); layRoof(G, h, d.sward); await ctx.yield(); }
      for (const w of d.windows) layWindow(G, d, w, d.tier !== 'far');
      layFringe(G, O, d, rngFor('fringe-' + i), d.tier === 'far' ? 36 : d.tier === 'mid' ? 90 : 190);
      for (const t of layChimney(G, h, d)) smokeAt.push([h.x + h.fz * t[0] + h.fx * t[2], h.y + t[1], h.z - h.fx * t[0] + h.fz * t[2]]);
      await ctx.yield();
      // the garden, laid on the plan's ground; whatever stands is asked of the flown line first (8 m and a margin)
      const lift = d.tier === 'top' ? liftOf(h, 10, 6, 15) : liftOf(h), wx = (lx, lz) => h.x + h.fz * lx + h.fx * lz, wz = (lx, lz) => h.z - h.fx * lx + h.fz * lz;
      const clear = (lx, ly, lz) => { const x = wx(lx, lz), z = wz(lx, lz); return path.distanceTo(x, h.y + ly + lift(x, z), z) >= 8.9; };
      // the mound's own dress, so that the home is whole from its sides and its back (the last home's lip and mound
      // stand over its door: there the hard law of clear air round the line is asked, with a margin)
      const far = d.tier === 'top' ? 3.5 : 8.9;
      layMound(G, h, d, rngFor('mound-' + i), d.tier, (lx, ly, lz) => path.distanceTo(wx(lx, lz), h.y + ly, wz(lx, lz)) >= far);
      await ctx.yield();
      if (d.tier === 'top') {
        // the last home's forecourt, by the lead's rule: under 1 m beyond 1.5 m in plan of the line, to 2.4 m beyond 4 m
        const pts = [], v = new THREE.Vector3(); for (let s = 0; s <= 900; s++) { path.posAtDist(routeLength - 90 + s * 0.1, v); pts.push(v.x, v.z); }
        const plan = (lx, lz) => { const x = wx(lx, lz), z = wz(lx, lz); let b = 1e9; for (let k = 0; k < pts.length; k += 2) { const dx = pts[k] - x, dz = pts[k + 1] - z, q = dx * dx + dz * dz; if (q < b) b = q; } return Math.sqrt(b); };
        layWallDress(G, d, rngFor('dress-' + i), (lx, ly, lz) => (ly <= 2.4 ? plan(lx, lz) > 4.1 : clear(lx, ly, lz)), 4.15);
        await ctx.yield();
        G.lift = lift; layTopGarden(G, h, d, rngFor('garden-' + i), plan, look.density, rngFor('banks-' + i)); G.lift = null;
      } else {
        if (d.tier !== 'far') layWallDress(G, d, rngFor('dress-' + i), clear);
        G.lift = lift;
        for (const p of layGarden(G, h, d, rngFor('garden-' + i), clear, d.tier, d.tier === 'mid' ? look.density * 0.75 : look.density)) { const x = wx(p[0], p[1]), z = wz(p[0], p[1]); hensAt.push([x, h.y + lift(x, z), z, p[2] + Math.atan2(h.fx, h.fz)]); }
        G.lift = null;
      }
      G.pop();
      await ctx.yield();
    }
    const geo = G.build(); made.push(geo);
    const mesh = new THREE.Mesh(geo, solid.material); mesh.castShadow = true; mesh.name = 'homes-' + list.join('-');
    object.add(mesh); triangles += G.triangles; drawCalls += 1;
    await ctx.yield();
  }
  // ---- what moves: the smoke of every chimney pot and the hens of the gardens
  const smoke = makeSmoke(THREE, look, smokeAt, path, rngFor('smoke')); object.add(smoke.mesh); made.push(smoke); triangles += smoke.triangles; drawCalls += 1;
  const hens = makeHens(THREE, solid.material, hensAt, rngFor('hens')); if (hens) { object.add(hens.mesh); made.push(hens); triangles += hens.triangles; drawCalls += 1; }
  await ctx.yield();
  // ---- the last home: the hall behind the green door (its own lit shader) and the leaf on its pivot
  const ti = HOMES.indexOf(TOP), td = deals[ti];
  const sunTop = { x: look.sun.x * TOP.fz - look.sun.z * TOP.fx, y: look.sun.y, z: look.sun.x * TOP.fx + look.sun.z * TOP.fz };
  const top = new THREE.Group(); top.position.set(TOP.x, TOP.y, TOP.z); top.rotation.y = Math.atan2(TOP.fx, TOP.fz); object.add(top);
  const hall = makeHallMaterial(THREE, look, sunTop); made.push(hall.material);
  const C = { wood: lin(THREE, '#a06c36'), rib: lin(THREE, '#e4c48e'), plaster: lin(THREE, '#ece1c2'), stone: lin(THREE, '#b9ad98'), door: lin(THREE, '#7c4622'), brass: td.brass, rug: lin(THREE, '#7c1410') };
  {
    const G = makeGeo(THREE);
    layHallShell(G, C, ARCHWAY); await ctx.yield();
    laySideRoom(G, C); layHallThings(G, C); layHallExtras(G, C); await ctx.yield();
    const geo = G.build(); made.push(geo);
    top.add(new THREE.Mesh(geo, hall.material)); triangles += G.triangles; drawCalls += 1;
  }
  const pivot = new THREE.Group(); pivot.position.set(HINGE.x, 0, HINGE.z); top.add(pivot);
  {
    const G = makeGeo(THREE); layLeaf(G, td, sunTop);
    const geo = G.build(); made.push(geo);
    pivot.add(new THREE.Mesh(geo, solid.material)); triangles += G.triangles; drawCalls += 1;
  }
  await ctx.yield();
  // THE GREEN DOOR'S SWING, by place and by the plan's DOOR_SWING: shut until shutUntil metres of route are still to
  // fly, open and at rest at openAt (eased in and out); the hall's glow spills out for as long as the leaf is open
  // (THE FIRELIGHT ON THE FORECOURT, uSpill, is keyed to the leaf's angle th and so to the metres of route still to
  // fly, exactly as the swing is: uSpill = (1 - max(0, cos th)) * (0.5 + 0.9 * look.lit); 0 while the leaf is shut,
  // full from 90 degrees. Its slow breathing alone goes by the world's clock, in the material.)
  const swing = (u) => {
    const left = (1 - u) * routeLength, k = Math.min(1, Math.max(0, (DOOR_SWING.shutUntil - left) / (DOOR_SWING.shutUntil - DOOR_SWING.openAt))), th = HINGE.open * k * k * (3 - 2 * k);
    pivot.rotation.y = -HINGE.side * th;
    hall.uniforms.uLeaf.value.z = -HINGE.side * Math.cos(th); hall.uniforms.uLeaf.value.w = -Math.sin(th);
    hall.uniforms.uOpen.value = 1 - Math.max(0, Math.cos(th));
    solid.uniforms.uSpill.value = (1 - Math.max(0, Math.cos(th))) * (0.5 + 0.9 * look.lit);
  };
  solid.uniforms.uDoorAt.value.set(TOP.x, TOP.y + td.door.y, TOP.z); solid.uniforms.uDoorN.value.set(TOP.fx, 0, TOP.fz);
  swing(0);
  return {
    object, triangles, drawCalls, routeLength, smokeAt,
    update(dt, time, u) { solid.uniforms.uTime.value = time; hall.uniforms.uTime.value = time; smoke.uniforms.uTime.value = time; if (hens) hens.update(time); swing(u); },
    dispose() { for (const m of made) m.dispose(); },
  };
}
