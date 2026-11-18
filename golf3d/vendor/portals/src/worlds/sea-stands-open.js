// Seabed Street: a summer noon; a straight dry slot stands cut through a level sea from the beach to the
// lighthouse island, and the town uses the seabed between the two sheer faces of water as a street.
// WHAT IS LAID OR PLACED TO BE SEEN FROM THE WAY (each by place, in metres of the street, the same on every visit; nothing here
// reads a still's position, a seed or a share of the flight, nothing is timed, and nothing is built, shown, hidden or moved by
// where the lens is: only the held reach's one look, as every look does, is laid from the lens's own place on the route):
//  - THE HELD REACH (HELD): from x 250 to x 400 the line itself is laid 5.5 to 6 m from the south face and about half way down
//    it; from the yawl's mooring (x 200) to the fishing boat (x 425) the gaze is held turned into that face (whole from about
//    x 265 to x 430), its aim 20 m in toward the face for every 30 m on (the gaze then some 31 degrees off the street's line),
//    so that in a broad picture the street and its far end have a place beside the wall of water; and the flight goes slowly
//    (at its slowest from about x 265 until the line has crossed the street).
//  - THE LION'S MANE (JELLY_AT) hangs behind the south face beside that reach, 5 m behind the face's plane and 10.9 m from the
//    line, so it is seen whole as the lens comes up to it; no dealt mooring lies before it or close behind it, and no stipe
//    stands within 6 m of it. Its bell's shadow falls through the face onto the sand at the face's foot.
import * as THREE from 'three';
import { makePath, bell } from '../kit/core.js';
import { makeSky, makeCloudFieldAsync } from '../kit/sky.js';
import * as S from '../parts/sea-stands-open.js';

const HALF = S.HALF, C = S.C, bedD = S.bedD;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// the island's rock: a sheer wall at the slot's end, a rounded top 18 m over the sea
function islandY(x, z, noise) {
  const r = Math.hypot((x - 1062) / 92, z / 96);
  const dome = sstep(1.0, 0.3, r);
  const wall = sstep(S.SLOT_END, S.SLOT_END + 7 - 5.5 * sstep(19, 22, Math.abs(z)), x);          // sheer where the sea stands against it, stepped back where the stairs climb
  const crag = 4.5 * (noise.fbm2(x * 0.045, z * 0.045, 3) - 0.1) + 1.2 * noise.n2(x * 0.21, z * 0.21);
  return -14.5 + (14.5 + 16 + 3 * noise.n2(x * 0.04, z * 0.04) + crag * sstep(1004, 1016, x)) * Math.min(dome * 1.25, 1) * wall;
}
// the ground everywhere: seabed, ramp, beach, promenade
function groundY(x, z) {
  if (x >= 0) return -bedD(x);
  const land = Math.min(3, -x * 0.25);                 // the beach rises to the promenade's edge 12 m back
  const ramp = Math.min(3, -x * 0.1);                  // the high street comes down to the waterline as a ramp
  return ramp + (land - ramp) * sstep(17, HALF, Math.abs(z));
}

const GROUND_ALBEDO = /* glsl */`
  float az = abs(P.z);
  float near = 1. / (1. + length(P - cameraPosition) * 0.025);
  float inSlot = step(az, 5.) * step(-400., P.x) * step(P.x, 1000.);
  // the causeway's paving: slabs in a running bond, each a shade of its own, weathered; a kerb of paler stone either side
  vec2 sl = vec2(P.x * 0.5, P.z * 0.5 + floor(P.x * 0.5) * 0.5);
  float jx = abs(fract(sl.x) - 0.5), jz = abs(fract(sl.y) - 0.5);
  float joint = max(smoothstep(0.455, 0.5, jx), smoothstep(0.455, 0.5, jz)) * near;
  vec3 pave = vec3(0.44, 0.42, 0.385) * (0.84 + 0.24 * h21(floor(sl))) * (1. - 0.4 * joint) * (0.82 + 0.36 * fbm2(P.xz * 0.55));
  float kerb = smoothstep(4.4, 4.5, az) * step(az, 5.);
  pave = mix(pave, vec3(0.63, 0.61, 0.56) * (1. - 0.45 * smoothstep(0.44, 0.5, abs(fract(P.x * 0.8) - 0.5)) * near) * (0.9 + 0.2 * grain), kerb);
  // the sand: ripples, lighter and darker reaches, the grain of it
  float rp = sin(P.x * 4.2 + 1.6 * sin(P.z * 0.9) + 0.9 * sin(P.x * 0.31 + P.z * 0.2)) * near;
  float rp2 = sin(P.x * 11. + 2.3 * sin(P.z * 2.1 + P.x * 0.4)) * near * near;
  float reach = fbm2(P.xz * 0.085);
  vec3 sand = alb * (0.87 + 0.11 * rp + 0.05 * rp2) * (0.8 + 0.36 * reach) * (1. + (grain - 0.5) * 0.3 * nearG);
  sand = mix(sand, sand * vec3(1.08, 1.0, 0.86), smoothstep(0.45, 0.75, fbm2(P.xz * 0.31 + 9.)));
  // wet places left on the street's sand: a broad patch of damp, darker sand with a ragged edge, and in the middle of a few
  // of them a finger's depth of water lying on the sand: small, the sand seen through it
  float pn = fbm2(P.xz * vec2(0.075, 0.115) + 3.7) + 0.05 * (vnoise(P.xz * 0.9 + 7.) - 0.5) + 0.022 * (vnoise(P.xz * 3.7) - 0.5);
  float zone = smoothstep(6.3, 8.3, az) * (1. - smoothstep(15.5, 18., az)) * step(24., P.x) * step(P.x, 984.);
  float damp = smoothstep(0.55, 0.65, pn) * zone;
  float pool = smoothstep(0.665, 0.70, pn) * zone;
  sand *= mix(vec3(1.), vec3(0.66, 0.64, 0.60), damp);
  sand = mix(sand, sand * vec3(0.66, 0.72, 0.72), pool * 0.9);
  // the tide's wrack: a broken dark line of weed some way out from each face, and shells
  float wr = smoothstep(0.55, 0.9, fbm2(vec2(P.x * 0.9, P.z * 3.) + 20.)) * (1. - smoothstep(0.0, 0.7, abs(az - 16.9 - 1.2 * (fbm2(vec2(P.x * 0.06, 2.)) - 0.5)))) * step(30., P.x);
  sand = mix(sand, vec3(0.10, 0.11, 0.05), wr * 0.8 * (1. - pool));
  float shell = step(0.992, h21(floor(P.xz * 7.))) * near * step(5., az) * step(az, HALF);
  sand = mix(sand, vec3(0.8, 0.76, 0.7), shell * (1. - pool));
  alb = mix(sand, pave, inSlot * step(vC.g, 0.9));
  // the promenade: pale flags from wall to wall, the high street's paving running through them to the ramp
  vec2 fl = vec2(P.x * 0.4 + floor(P.z * 0.4) * 0.5, P.z * 0.4);
  float fj = max(smoothstep(0.46, 0.5, abs(fract(fl.x) - 0.5)), smoothstep(0.46, 0.5, abs(fract(fl.y) - 0.5))) * near;
  vec3 flag = vec3(0.56, 0.53, 0.47) * (0.85 + 0.22 * h21(floor(fl))) * (1. - 0.35 * fj) * (0.84 + 0.3 * fbm2(P.xz * 0.4));
  flag = mix(flag, vec3(0.5, 0.31, 0.24) * (0.85 + 0.3 * grain), step(17., az) * step(az, 17.6) * step(az, 60.));       // a band of brick where the street meets the houses' pavement
  alb = mix(alb, mix(flag, pave, step(az, 5.)), step(P.x, -12.5) * step(2.5, P.y));
  // the island's rock: bedded stone, lichen, turf on its top, dark and weedy where the sea wets it
  float isle = smoothstep(1000.3, 1001.5, P.x);
  float bedding = fbm2(vec2(P.x * 0.1 + P.z * 0.08, P.y * 1.2));
  vec3 rockA = vec3(0.37, 0.345, 0.30) * (0.55 + 0.9 * bedding) * (0.85 + 0.3 * grain);
  rockA = mix(rockA, vec3(0.62, 0.57, 0.40), smoothstep(0.6, 0.78, fbm2(P.xz * 0.45 + P.y * 0.4)) * 0.55);
  float turf = smoothstep(0.62, 0.9, N.y) * smoothstep(5., 10., P.y) * smoothstep(0.14, 0.42, fbm2(P.xz * 0.11 + 2.));
  rockA = mix(rockA, vec3(0.19, 0.31, 0.09) * (0.75 + 0.5 * grain), turf);
  // the island's west shoulder, over the landing, is walled in small fields one over another: a dry-stone wall along each level,
  // the strips between them grass, hay or kitchen garden by turns
  float fy = P.y / 2.2 + 0.25 * (fbm2(P.xz * 0.07 + 6.) - 0.5), strip = floor(fy);
  float fields = isle * smoothstep(8.2, 9.6, P.y) * (1. - smoothstep(1036., 1052., P.x)) * (1. - smoothstep(0.93, 0.99, N.y) * step(15.5, P.y)) * smoothstep(0.3, 0.55, N.y);
  vec3 fieldC = mix(vec3(0.17, 0.33, 0.08), mix(vec3(0.42, 0.44, 0.13), vec3(0.24, 0.36, 0.16), step(0.5, h21(vec2(strip, 3.)))), step(0.4, h21(vec2(strip, 9.)))) * (0.8 + 0.4 * grain) * (0.85 + 0.3 * fbm2(P.xz * 0.5));
  rockA = mix(rockA, fieldC, fields * 0.85);
  rockA = mix(rockA, vec3(0.62, 0.58, 0.48) * (0.8 + 0.4 * grain), fields * smoothstep(0.40, 0.47, abs(fract(fy) - 0.5)));
  rockA *= mix(1., 0.45, (1. - smoothstep(-0.2, 1.4, P.y)) * step(HALF, az));
  rockA *= 1. - 0.5 * smoothstep(17.5, 19.5, az) * (1. - smoothstep(22., 24., az)) * (1. - smoothstep(0., 1.5, P.y));      // the corners where each face ends against the rock, dark with wet
  // the rock's face over the landing is the islanders' gardens: dry-stone walls one over another, each with its strip of green
  // hanging over the wall below it
  float tz = (1. - smoothstep(18.6, 19.8, az)) * (1. - smoothstep(1007.2, 1010.5, P.x)) * smoothstep(-13.6, -12.6, P.y);
  float tb = fract((P.y + 13.33) / 3.1);
  float hang = smoothstep(0.5, 0.62, tb + 0.3 * (fbm2(vec2(P.z * 0.9, P.y * 0.5) + 11.) - 0.5) + 0.12 * (vnoise(vec2(P.z * 5., 3.)) - 0.5));
  vec2 dq = vec2(P.z * 1.6 + floor(P.y * 3.3) * 0.5, P.y * 3.3);
  vec3 dry = vec3(0.60, 0.56, 0.47) * (0.78 + 0.34 * h21(floor(dq))) * (1. - 0.35 * max(smoothstep(0.42, 0.5, abs(fract(dq.x) - 0.5)), smoothstep(0.4, 0.5, abs(fract(dq.y) - 0.5))) * near);
  vec3 grow = mix(vec3(0.10, 0.23, 0.055), vec3(0.28, 0.40, 0.10), smoothstep(0.3, 0.7, fbm2(vec2(P.z * 1.3, P.y * 1.7) + 4.))) * (0.75 + 0.5 * grain);
  grow = mix(grow, vec3(0.80, 0.30, 0.45), step(0.955, h21(floor(vec2(P.z, P.y) * 3.))) * near);
  rockA = mix(rockA, mix(dry, grow, hang), tz);
  alb = mix(alb, rockA, isle);
  // the open beach either side of the town: wet where the sea has just been
  float beachWet = step(HALF, az) * smoothstep(-7., -1.5, P.x + 0.8 * sin(P.z * 0.21 + uT * 0.35)) * step(P.x, 2.);
  alb *= 1. - 0.38 * beachWet;
  // the town sweeps its street; the sea's own bed beyond the faces is wild. In the shallows it is a meadow of dark sea grass from
  // the beach out; in the deep the grass thins to drifts. Beside the cut the stream keeps the sand clean and pale the whole
  // length: rippled, with the light of the swell crawling over it, stones lying on it; in the shallows that clean strip is
  // narrower and its edge ragged, the meadow beginning beyond it, so the clear water of a low face stands over pale sand
  float wild = step(HALF, az) * smoothstep(0., 14., P.x) * step(P.x, 1000.5);
  float Dw = max(-P.y, 0.);
  float meadow = 1. - smoothstep(7., 13., Dw);
  float scourDeep = (1. - smoothstep(5., 15., az - HALF)) * (1. - meadow);
  float ragged = fbm2(vec2(P.x * 0.13, P.z * 0.3) + 17.);
  float scourShoal = (1. - smoothstep(3.5 + 5. * ragged, 7. + 7. * ragged, az - HALF)) * meadow;
  float scour = scourDeep + scourShoal;                         // (shares of one whole: together never over 1)
  float drift = fbm2(P.xz * vec2(0.11, 0.16) + 5.);
  float grassy = smoothstep(0.26, 0.5, drift + 0.4 * meadow - 0.2 * scourDeep - 0.9 * scourShoal);
  vec3 bare = alb * mix(vec3(0.30, 0.37, 0.36), vec3(0.80, 0.86, 0.80), scour);
  bare *= 1. + scour * 0.55 * (seaNet(P.xz * 0.8 + uSun.xz * Dw) - 0.75);
  // the grass lies in tufts and worn places of its own, not in the sand's ripples
  float tuft = fbm2(P.xz * vec2(0.9, 1.3) + 41.);
  vec3 wildC = mix(bare, vec3(0.06, 0.115, 0.075) * (0.5 + 0.7 * tuft + 0.4 * grain), grassy * 0.92);
  wildC = mix(wildC, vec3(0.2, 0.19, 0.16), smoothstep(0.7, 0.76, fbm2(P.xz * 0.37 + 31.)) * 0.8);
  alb = mix(alb, wildC, wild);
  float wetb = smoothstep(18.0, 19.5, az) * step(az, HALF) * step(0., P.x);
  alb *= 1. - 0.42 * wetb;
  // the standing water's cool light lies on the sand at each face's foot, wider where the face is taller
  float foot = smoothstep(HALF - 1.2 - 0.14 * max(-P.y, 0.), HALF, az) * step(az, HALF) * step(0., P.x);
  alb *= mix(vec3(1.), vec3(0.56, 0.80, 0.84), foot);
`;
// dressed stone: courses of blocks in a running bond, each block a shade of its own, weathered; green and dark where the sea stands on it
const MASONRY_ALBEDO = /* glsl */`
  vec2 mq = abs(N.y) > 0.6 ? Q.xz * 0.8 : vec2((abs(N.x) > abs(N.z) ? Q.z : Q.x) * 0.7 + floor(Q.y / 0.62) * 0.5, Q.y / 0.62);
  vec2 mf = abs(fract(mq) - 0.5);
  float mj = max(smoothstep(0.45, 0.5, mf.x), smoothstep(0.43, 0.5, mf.y)) * nearG * 1.6;
  float pale = step(0.42, alb.g) * step(alb.r - alb.b, 0.25);          // only the stone itself is coursed, not paint or iron
  alb *= mix(1., (0.84 + 0.26 * h21(floor(mq))) * (1. - 0.4 * clamp(mj, 0., 1.)) * (0.8 + 0.4 * fbm2(gq * 0.6)), pale);
  alb *= 1. + (grain - 0.5) * 0.2 * nearG;
  // the breakwater's arches are turned in ring stones, one pale and one warm by turns
  float zcA = clamp(floor(P.z / 13.3 + 0.5), -1., 1.) * 13.3;
  vec2 ar = vec2(P.z - zcA, P.y + 8.5); float rA = length(ar);
  float ringA = step(6.0, rA) * step(rA, 6.95) * step(-8.5, P.y) * step(abs(P.x - 790.), 2.75) * step(0.6, abs(N.x));
  float vous = floor(atan(ar.y, abs(ar.x) + 1e-4) * 5.1);
  alb = mix(alb, mix(vec3(0.78, 0.74, 0.64), vec3(0.62, 0.50, 0.38), step(0.5, fract(vous * 0.5))) * (0.88 + 0.24 * grain), ringA * pale);
  // where the sea stands on stone it is dark with weed and slime, almost black-green; above the swell a wet dark band, then a
  // crust of barnacles, paler, uneven
  float wetS = inWater(P);
  float overS = P.y - eta(P.xz), seaSide = step(HALF, abs(P.z));
  float wetBand = seaSide * (1. - wetS) * (1. - smoothstep(0.15, 0.9 + 0.8 * fbm2(gq * 0.7), overS));
  alb *= 1. - 0.55 * wetBand * pale;
  float crust = seaSide * (1. - wetS) * smoothstep(0.5, 0.9, overS) * (1. - smoothstep(1.0, 1.5 + 0.5 * vnoise(gq * 1.3), overS)) * smoothstep(0.35, 0.6, fbm2(gq * 2.1));
  alb = mix(alb, vec3(0.50, 0.49, 0.43), crust * 0.6 * pale);
  vec3 weedS = mix(vec3(0.03, 0.06, 0.035), vec3(0.11, 0.16, 0.05), smoothstep(0.35, 0.7, fbm2(gq * 0.7 + 3.))) * (0.7 + 0.6 * grain);
  alb = mix(alb, weedS, wetS * 0.93);
  alb *= 1. - 0.22 * smoothstep(0.55, 0.85, vnoise(vec2(gq.x * 1.3, 3.))) * (1. - wetS) * pale * smoothstep(-0.5, 0.5, N.y + 0.3);
  // the walk's parapets: weathered darker toward the foot, rain marks under the coping
  float parapet = step(2.02, P.y) * step(P.y, 2.9) * step(abs(P.x - 790.), 2.75) * step(abs(P.z), 70.4) * step(abs(N.y), 0.5);
  alb *= 1. - parapet * (0.26 * (1. - smoothstep(2.05, 2.7, P.y)) + 0.16 * smoothstep(0.45, 0.8, vnoise(vec2((abs(N.x) > abs(N.z) ? P.z : P.x) * 2.3, 7.))) * smoothstep(2.3, 2.75, P.y));
`;
// a boat's skin: her strakes faintly seen, weed and slime along the waterline on what the sea wets
const BOAT_ALBEDO = /* glsl */`
  float sideB = step(abs(N.y), 0.9);
  alb *= 1. - 0.2 * smoothstep(0.38, 0.5, abs(fract(Q.y * 4.2) - 0.5)) * sideB * nearG;
  alb *= 1. + (grain - 0.5) * 0.2 * nearG;
  float slimeB = (1. - smoothstep(0.0, 0.6, abs(Q.y + 0.22))) * step(Q.y, 0.12) * (0.35 + 0.65 * vnoise(vec2(Q.x * 1.3 + Q.z * 1.3, Q.y * 3.)));
  alb = mix(alb, vec3(0.13, 0.25, 0.1), slimeB * 0.5 * sideB);
`;
// a town's skins: roofs in courses of tiles, plaster walls weathered and darker at the foot, boards on the huts
const TOWN_ALBEDO = /* glsl */`
  float roofS = step(0.25, N.y) * step(N.y, 0.93) * step(5.1, Q.y);
  vec2 tq = vec2(Q.x * 1.9 + floor(Q.y * 2.6) * 0.5, Q.y * 2.6);
  alb *= mix(1., (0.8 + 0.34 * h21(floor(tq))) * (1. - 0.45 * smoothstep(0.3, 0.5, abs(fract(tq.y) - 0.5)) * nearG) * (1. - 0.25 * smoothstep(0.42, 0.5, abs(fract(tq.x) - 0.5)) * nearG) * (0.85 + 0.3 * fbm2(Q.xz * 0.4)), roofS);
  float wallS = step(abs(N.y), 0.25);
  alb *= mix(1., (0.86 + 0.24 * fbm2(gq * 0.5)) * (0.76 + 0.24 * smoothstep(3.0, 4.4, Q.y)), wallS);
  float hut = wallS * step(Q.y, 5.25) * step(-16., Q.x);                              // the beach huts: broad painted stripes, boards
  alb = mix(alb, vec3(0.80, 0.82, 0.78), hut * step(0.5, fract(gq.x * 1.15 + 0.25)));
  alb *= 1. - 0.22 * hut * smoothstep(0.4, 0.5, abs(fract(gq.x * 3.) - 0.5)) * nearG;
  alb *= 1. + (grain - 0.5) * 0.2 * nearG;
`;
// an old iron hull: rust in scabs and runs, shreds of her paint, her plating's seams; weed and dark slime where she lies in the sea
const WRECK_ALBEDO = /* glsl */`
  float rustN = fbm2(vec2(Q.x * 0.45 + Q.z * 0.45, Q.y * 0.9));
  alb *= 0.5 + 1.0 * rustN;
  alb = mix(alb, vec3(0.50, 0.21, 0.07), smoothstep(0.42, 0.66, fbm2(gq * 0.9 + 4.)) * 0.8);
  alb = mix(alb, vec3(0.66, 0.36, 0.14), smoothstep(0.6, 0.8, fbm2(gq * 2.3 + 9.)) * 0.5);
  alb = mix(alb, vec3(0.10, 0.05, 0.035), smoothstep(0.66, 0.76, fbm2(gq * 0.3 + 17.)) * step(abs(N.y), 0.7) * 0.7);      // where her black paint holds yet, dulled to brown
  vec2 wpl = abs(fract(vec2(gq.x / 2.4 + floor(gq.y / 1.0) * 0.5, gq.y / 1.0)) - 0.5);
  alb *= 1. - 0.3 * max(smoothstep(0.46, 0.5, wpl.x), smoothstep(0.45, 0.5, wpl.y)) * step(abs(N.y), 0.8) * nearG;
  alb *= 1. - 0.3 * smoothstep(0.55, 0.9, vnoise(vec2(gq.x * 1.7, 5.)));
  alb *= 1. + (grain - 0.5) * 0.4;
  // in the sea she is darker and browner than the water about her: rust under a brown slime, olive weed on her in patches
  float wetW = inWater(P);
  alb = mix(alb, alb * vec3(2.3, 0.74, 0.42) + vec3(0.07, 0.0, 0.0), wetW);          // (the water takes the red out of the light: her rust must be the redder for it, and no brighter)
  alb = mix(alb, vec3(0.085, 0.10, 0.035) * (0.7 + 0.6 * grain), wetW * smoothstep(0.5, 0.68, fbm2(gq * 0.6 + 2.)) * 0.45);
`;
// living rock: bedded and cracked, pale where it has dried in the sun. Under the tide line a pale crust of barnacles a metre or
// two deep, mussels close-packed at its foot; below that the wet rock, dark, with weed in patches and crusts of pink
const ROCK_ALBEDO = /* glsl */`
  float bedding = fbm2(vec2(Q.x * 0.13 + Q.z * 0.1, Q.y * 1.5));
  float strata = 0.5 + 0.5 * sin(Q.y * 4.6 + 2.6 * fbm2(vec2(Q.x * 0.21, Q.z * 0.21)) + Q.x * 0.07);
  alb *= (0.66 + 0.6 * bedding) * (0.72 + 0.5 * strata * step(abs(N.y), 0.85)) * (1. + (grain - 0.5) * 0.45);
  float joint = smoothstep(0.455, 0.5, abs(fract(Q.x * 0.31 + 0.37 * floor(Q.y * 0.55) + 0.2 * vnoise(vec2(Q.y * 0.8, Q.x * 0.3))) - 0.5)) * step(abs(N.y), 0.8);
  alb *= 1. - 0.45 * joint;
  float wetR = inWater(P);
  float under = eta(P.xz) - P.y;                                                    // metres under the sea's top at this moment
  float rim = 1.1 + 1.4 * vnoise(vec2(Q.x * 0.55, Q.z * 0.3 + 2.));                 // how deep the barnacles go here
  float crustR = wetR * (1. - smoothstep(rim, rim + 0.5, under)) * smoothstep(0.24, 0.5, fbm2(gq * 1.9 + 5.) + 0.12);
  vec3 wetRock = alb * vec3(0.6, 0.6, 0.62);
  wetRock = mix(wetRock, vec3(0.085, 0.13, 0.05) * (0.7 + 0.6 * grain), smoothstep(0.56, 0.7, fbm2(Q.xz * 0.5 + Q.y * 0.35)) * 0.8 * smoothstep(2., 5., under));   // weed in patches, below the crust
  wetRock = mix(wetRock, vec3(0.60, 0.33, 0.40) * (0.8 + 0.4 * grain), smoothstep(0.66, 0.74, fbm2(gq * 2.6 + 21.)) * 0.5);                       // pink crusts
  float musselBand = (1. - smoothstep(0.5, 1.3, abs(under - rim - 0.8))) * smoothstep(0.45, 0.6, fbm2(gq * 0.9 + 13.));
  wetRock = mix(wetRock, vec3(0.035, 0.045, 0.075) * (0.6 + 0.9 * h21(floor(gq * 9.))), musselBand * 0.9);                                      // mussels, shell by shell
  wetRock = mix(wetRock, vec3(0.66, 0.63, 0.53) * (0.72 + 0.5 * h21(floor(gq * 14.))) * (0.85 + 0.3 * grain), crustR * 0.92);                    // barnacles
  alb = mix(alb, wetRock, wetR);
  alb *= 1. - 0.5 * (1. - wetR) * (1. - smoothstep(0.1, 0.55 + 0.4 * vnoise(vec2(Q.x * 0.9, Q.z * 0.9)), -under));                             // the wet band the swell leaves above itself
  alb = mix(alb, vec3(0.74, 0.72, 0.66), (1. - wetR) * smoothstep(1.2, 1.8, P.y) * smoothstep(0.66, 0.8, fbm2(Q.xz * 0.9 + 11.)) * 0.7);   // the birds' white on its dry top
`;
// what is wet shines: a pool holds the sky and winks in the sun, the wet band at a face's foot glints
const GROUND_AFTER = /* glsl */`
  vec3 Vg = (cameraPosition - P) / max(length(cameraPosition - P), 1e-3);
  float gz = 1. - clamp(Vg.y, 0., 1.); float fr = 0.07 + 0.93 * gz * gz * gz;
  vec3 skyc = mix(vec3(0.70, 0.84, 0.94), vec3(0.22, 0.50, 0.82), clamp(Vg.y * 1.3, 0., 1.));
  float dryAir = 1. - inWater(P);
  float riff = 0.5 + 0.5 * sin(P.x * 9. + uT * 1.7 + 3. * sin(P.z * 6. - uT * 0.9));
  vec3 poolC = mix(c, skyc * (0.72 + 0.1 * riff), clamp(0.05 + 0.42 * fr, 0., 0.45));          // a thin sheen: it takes a little of the sky, more the lower the eye
  float wink = step(0.99, h21(floor(P.xz * 14.) + floor(uT * 3.) * 0.37)) * near * 1.2;
  c = mix(c, poolC + uSunC * wink * slotSun(P), pool * dryAir);
  float sheen = (wetb + 0.3 * damp * (1. - pool) + beachWet) * dryAir * fr;
  c = mix(c, skyc, clamp(sheen * 0.55, 0., 0.6));
  c = mix(c, uHaze, (1. - exp(-length(P - cameraPosition) * 0.00058)) * pool * dryAir * 0.4);
  // far behind a face the bed is lost in the deep water's own colour before it reaches the last of the sight
  vec3 deepC = mix(seaGlowK(Dw + 9., P, shaftK(waterLen(P, cameraPosition))) * 0.8, uHaze, 1. - exp(-length(P - cameraPosition) * 0.00058));
  c = mix(c, deepC, smoothstep(HALF + 13., HALF + 29., az) * wild * (1. - dryAir));
`;

async function buildGround(ctx, sea, noise) {
  const g = new S.Geo();
  const sandC = C('#D9C29A', 0.86), stoneC = C('#B9B2A4', 0.8), rockC = C('#7E786E', 0.8);
  const grid = (xs, zs, yf, cf) => {
    const rows = xs.map((x) => zs.map((z) => [x, yf(x, z), z]));
    g.skin(rows, cf ? (i, j) => cf(xs[i], zs[j]) : sandC, false, true);
  };
  const range = (a, b, s) => { const o = []; for (let v = a; v <= b + 1e-6; v += s) o.push(v); return o; };
  // the slot's floor from the ramp's head to the island
  for (let x0 = -30; x0 < 1000; x0 += 103) { grid(range(x0, x0 + 103, 2.575), range(-HALF, HALF, 2.5), groundY); await ctx.yield(); }
  // the seabed under water, as far as the deep-water backdrops
  grid(range(0, 1000, 5), range(HALF, HALF + 32, 4), groundY);
  await ctx.yield();
  grid(range(0, 1000, 5), range(-HALF - 32, -HALF, 4), groundY);
  await ctx.yield();
  // the beach and the town's ground
  const lx = [-1500, -300, -100, -50, -30, -20, -14, -12, -10, -8, -6, -4, -2, 0];
  const lz = [HALF, 25, 30, 40, 60, 100, 200, 400, 1000, 4000];
  const landC = (x) => (x < -12.5 ? stoneC : sandC);
  grid(lx, lz, groundY, landC); grid(lx, lz.map((z) => -z).reverse(), groundY, landC);
  grid([-1500, -300, -100, -50, -30], range(-HALF, HALF, 5), () => 3, () => stoneC);
  await ctx.yield();
  // the island
  grid(range(1000, 1160, 2.5), range(-105, 105, 2.5), (x, z) => islandY(x, z, noise), () => rockC);
  await ctx.yield();
  const geo = g.geometry();
  await ctx.yield();
  const mesh = new THREE.Mesh(geo, sea.solid({ albedo: GROUND_ALBEDO, after: GROUND_AFTER, noLine: true }));
  mesh.name = 'ground'; mesh.frustumCulled = false;
  return mesh;
}

// ---- every thing that floats, with its underwater half, and the things that hang or stand in the water ----
async function buildAfloat(ctx, sea, cast, o) {
  const rng = ctx.rng, bed = o.bed, g = new S.Geo();
  g.line = o.line;                                        // (a chain far from the flown line is built lighter: the part's Geo.chain)
  const hulls = [C('#EFE6CC', 0.8), C('#2F6B4A', 0.8), C('#1E2226', 1), C('#EFE6CC', 0.8), C('#F4FBF7', 0.8)];
  const bots = [C('#C8432B', 0.8), C('#7A2E22', 0.9), C('#2B4E5A', 0.9)];
  const rope = C('#CDBB8A', 0.8);
  // THE SLOOP moored at the north lip 62 m out: her keel in the low face, her chain to an anchor on the sand
  S.addBoat(g, 'sloop', 62, -27, 0.12, { hull: rng.pick(hulls), bottom: bots[0] });
  S.addChain(g, [66.5, -0.1, -27.5], [74, bed(74), -24.5], { sag: 0.5 });
  cast.looks.push({ 0: 62, 1: -2, 2: -24, early: 60 });                                 // from over the promenade on: the first thing in a face
  // THE RED BUOY at the south lip on its chain and sinker
  S.addBuoy(g, 150, 23, bed(150));
  cast.looks.push([150, -5, 23]);
  S.addBuoy(g, 468, 23.2, bed(468), C('#2F6B4A', 0.9)); S.addBuoy(g, 586, -23.2, bed(586), C('#2F6B4A', 0.9));
  // a black sloop lying to her anchor at the north lip over the deepest reach, her chain down the whole face to the sand
  S.addBoat(g, 'sloop', 558, -26.2, 0.06, { hull: hulls[2], bottom: bots[0] });
  S.addChain(g, [562.6, -0.1, -26.1], [572, bed(572), -23.6], { sag: 1.4 });
  cast.looks.push([566, -9, -24]);
  // THE YAWL in the south face: keel, rudder, chain slanting to her anchor
  S.addBoat(g, 'yawl', 200, 24.5, 3.1, { hull: rng.pick(hulls), bottom: bots[0] });
  S.addChain(g, [194.6, -0.1, 24.6], [184, bed(184), 23], { sag: 1.0 });
  cast.looks.push({ 0: 200, 1: -2.8, 2: 24.5, weight: 0.7, lead: 55 });                  // her bottom, keel and chain, with the lip over them
  await ctx.yield();
  // THE BATHERS and their raft: six treading water, the raft's chain down to its block
  S.addRaft(g, 275, 25, bed(275));
  const suits = [C('#C8432B', 0.8), C('#0B5A7A', 0.9), C('#F4FBF7', 0.8), C('#1E2226', 1), C('#D9A85A', 0.8), C('#2F6B4A', 0.8)];
  const nBath = o.marketDay ? 10 : 16;
  for (let i = 0; i < nBath; i++) S.addBather(g, 265 + (i % 6) * 3.6 + rng.range(-0.6, 0.6), 22.6 + ((i * 7) % 5) * 0.9 + [0, 4.5, 2.2][Math.floor(i / 6)], rng.range(0, 6.28), suits[i % 6]);
  cast.dives = [{ x: 275.6, z: 25.4, top: -0.9, deep: bed(275) + 2.6, period: 18 }, { x: 269.5, z: 24.2, top: -0.9, deep: -6.5, period: 13 }, { x: 281.5, z: 23.8, top: -0.9, deep: -8.5, period: 15 },
    { x: 266.2, z: 26.6, top: -0.9, deep: -5.5, period: 11 }, { x: 285.2, z: 26.3, top: -0.9, deep: -7.5, period: 16 }, { x: 272.3, z: 22.9, top: -0.9, deep: -4.6, period: 9.5 }];   // swimmers diving and coming up, each on its own closed loop (its phase is dealt with the other clocks)
  cast.risers.push([275.9, bed(275) + 3, 25.6, bedD(275) - 3.4]);
  await ctx.yield();
  // a ROWING BOAT over the market, oars dipping
  for (const [rx, rz, ry, hc] of [[356, 23.6, 0.05, 4], [346.5, 26.4, 0.5, 0], [365.5, 26.0, -0.4, 1], [351.5, 30.2, 2.9, 3]]) {      // and three more of the hired boats about her
    S.addBoat(g, 'row', rx, rz, ry, { hull: hulls[hc], bottom: bots[1] });
    for (const s of [-1, 1]) { g.at(rx, 0, rz, ry).move(rx, rz, 5, 0, (px, py, pz) => Math.min(1, Math.max(0, (Math.abs(pz) - 0.7) / 2.0))); g.bar([0.2, 0.55, s * 0.7], [0.0, -0.35, s * 2.7], 0.04, 0.04, rope, 5); g.box(0.0, -0.35, s * 2.75, 0.45, 0.06, 0.6, rope); }
  }
  g.at().move();
  await ctx.yield();
  // THE LION'S MANE beside them: a great jellyfish, its bell 3 m across, its hair as much as 10.4 m down the face (the motion law's
  // kind 10). A mesh of its own, in the plain skin: a boat's strakes are not for it
  cast.mane = new S.Geo(); S.addJelly(cast.mane, JELLY_AT[0], JELLY_AT[1], JELLY_AT[2]);
  await ctx.yield();
  // THE FISHING BOAT, four lines down to the bait, and the great shoal turning round it
  S.addBoat(g, 'fisher', 425, 25.5, 0.0, { hull: hulls[1], bottom: bots[0] });
  const baitY = -11.5;
  for (let i = 0; i < 4; i++) { const lx = 421.5 + i * 2.2; g.bar([lx, 1.3, 23.8], [lx, 0.0, 23.7], 0.035, 0.035, rope, 4); g.rope([lx, 0.0, 23.7], [lx + 0.4, baitY + 0.3 * i, 23.6 - 0.25 * i], rope, 0.04, 0.9 + 0.2 * i); g.ball(lx + 0.4, baitY + 0.3 * i - 0.25, 23.6 - 0.25 * i, 0.22, 0.3, 0.22, C('#C8432B', 0.9), 6, 4); }
  cast.shoals.push({ c: [425, -7.2, 26.2], r: [7.5, 3.6, 3.6], n: 900, period: 23 });                  // (the ball stands 2.6 m and more behind the face's plane, its top 3.6 m under the level)
  S.addChain(g, [430.2, -0.2, 26], [441, bed(441), 28], { sag: 1.2 });
  // off the island: a yacht lying to her anchor at the north lip, a launch at the south one
  // (she lies head to the breeze, her bow west: her chain leads west down the face to her anchor at x 928, clear of the way to the landing)
  S.addBoat(g, 'yawl', 942, -25.5, 3.05, { hull: hulls[2], bottom: bots[0] });
  S.addChain(g, [936.6, -0.1, -25.9], [928, bed(928), -23.5], { sag: 1.0 });
  S.addBoat(g, 'fisher', 952, 25.6, 3.0, { hull: hulls[0], bottom: bots[0] });
  S.addChain(g, [946.9, -0.2, 25.5], [936, bed(936), 23.6], { sag: 1.0 });
  await ctx.yield();                                      // (a far chain's faces are tried against the whole route: hand back between them)
  cast.looks.push([942, -5, -25.5]);
  // a white sloop lying to her anchor at the north lip a little short of the wreck, her chain down the whole face to the sand
  S.addBoat(g, 'sloop', 476, -24.6, 0.05, { hull: hulls[4], bottom: bots[0] });
  S.addChain(g, [480.6, -0.1, -24.5], [491, bed(491), -23.2], { sag: 1.3 });
  // and a yawl at the north lip between the keeper's station and the breakwater, her chain down 22 m of face
  S.addBoat(g, 'yawl', 742, -24.6, 0.06, { hull: hulls[1], bottom: bots[0] });
  S.addChain(g, [747.4, -0.1, -24.5], [760, bed(760), -23.2], { sag: 1.5 });
  S.addBuoy(g, 722, -23.4, bed(722));
  // a black yawl lying to her anchor at the north lip between the breakwater and the seal reef, her chain down the face to the sand
  S.addBoat(g, 'yawl', 818, -24.8, 0.08, { hull: hulls[2], bottom: bots[0] });
  S.addChain(g, [823.4, -0.1, -24.7], [834, bed(834), -23.2], { sag: 1.4 });
  cast.looks.push({ 0: 818, 1: 2, 2: -24.8, lead: 45, weight: 0.55 });                      // (as every fixed look: it opens 65 m of route before the lens is abeam of her and lets go 20 m before)
  // shoals in the south face between its named things, close behind the face
  for (const [sx, sy, per] of [[237, -5.2, 21], [314, -6.2, -25], [391, -7, 28]]) { cast.shoals.push({ c: [sx, sy, 26.6], r: [7, 2.6, 3.2], n: 560, period: per }); }
  await ctx.yield();
  // THE WRECK lying through the north face: stem dry on the sand beside the street, stern under water yet
  const rust = C('#4A3A30', 0.9), rust2 = C('#6E3324', 0.9), iron2 = C('#2A2622', 1), wkPale = C('#B8A88E', 0.8);
  const wk = cast.wreck = new S.Geo();
  wk.at(528.5, bed(528) + 2.3, -24, -2.356, 0.3).move();
  S.addHull(wk, { L: 30, B: 6.5, free: 2.6, draft: 2.4, hull: rust, bottom: rust2, boot: C('#A8905A', 0.8), full: 0.8, n: 18, m: 10, deck: C('#7A7060', 0.85) });
  wk.bar([15.0, -2.3, 0], [15.25, 3.7, 0], 0.16, 0.14, iron2, 5);                                                   // her stem bar, plumb
  for (let k = 0; k < 9; k++) for (const sd of [-1, 1]) wk.box(-12.5 + k * 3.1, 1.3, sd * (2.2 + 0.9 * Math.sin((k + 0.5) / 9 * Math.PI)), 0.5, 0.5, 0.06, iron2);   // ports along her side
  // her deck house, astern in the water: rusted plate with its ports and a door standing open; of the wheelhouse over it only the
  // corner posts, the sills and the roof are left
  const house = C('#5E4636', 0.9), hole = C('#0E0B09', 1);
  wk.box(-4, 3.9, 0, 6, 2.4, 4, house, rust2);
  for (const sd of [-1, 1]) { for (let k = 0; k < 4; k++) wk.box(-6.1 + k * 1.4, 4.25, sd * 2.01, 0.75, 0.8, 0.05, hole); wk.box(-1.6, 3.75, sd * 2.01, 0.8, 1.9, 0.05, hole); }
  wk.box(-0.99, 4.2, 0, 0.05, 0.9, 1.6, hole); wk.box(-7.01, 4.2, 0.6, 0.05, 0.9, 1.0, hole);
  for (const hx of [-5.9, -2.1]) for (const hz of [-1.4, 1.4]) wk.bar([hx, 5.1, hz], [hx, 6.25, hz], 0.07, 0.07, iron2, 4);
  wk.box(-4, 6.3, 0, 4.3, 0.12, 3.3, rust2, house); wk.box(-4, 5.3, 1.45, 3.9, 0.4, 0.08, house); wk.box(-4, 5.3, -1.45, 3.9, 0.4, 0.08, house); wk.box(-5.95, 5.3, 0, 0.08, 0.4, 2.9, house);
  wk.bar([-6, 3.2, 0], [-6.9, 8.6, 0.4], 0.8, 0.7, rust, 9);                                                         // her funnel, leaning
  wk.bar([7.5, 2.6, 0], [8.6, 11.5, 0.6], 0.2, 0.1, C('#5A4A3A', 0.9), 6); wk.bar([8.3, 9.0, -1.6], [8.3, 9.0, 1.8], 0.08, 0.08, C('#5A4A3A', 0.9), 5);   // her foremast stands yet: its foot dry, the rest of it leaning through the face's plane into the water (its top at z -21.0, 5.4 m under the level)
  wk.bar([7.7, 4.0, 0], [12.6, 6.4, -1.9], 0.12, 0.08, C('#5A4A3A', 0.9), 5);                                        // a derrick, swung out and left so
  wk.bar([-11, 2.9, 0], [-11.6, 9.4, 0.5], 0.17, 0.09, C('#5A4A3A', 0.9), 6);                                        // the mainmast, in the water
  wk.box(3, 2.9, 0, 3.4, 0.5, 2.6, C('#6A5A48', 0.9), iron2); wk.box(11.2, 3.6, 0, 1.2, 0.8, 1.6, C('#4A4038', 0.9)); // an open hatch, the windlass
  for (const sd of [-1, 1]) {
    wk.bar([13.4, 3.4, sd * 1.0], [14.4, 1.2, sd * 0.5], 0.09, 0.09, iron2, 5);                                      // hawse pipes
    for (let k = 0; k < 12; k++) { const lx = 13.2 - k * 2.2, bz = sd * (0.4 + 2.75 * Math.pow(Math.max(1 - Math.pow(Math.abs(lx - 0) / 15, lx > 0 ? 1.7 : 5), 0), 0.75)); wk.bar([lx, 2.75, bz], [lx, 3.75, bz], 0.045, 0.045, wkPale, 4); if (k) wk.bar([lx, 3.7, bz], [lx + 2.2, 3.7, sd * (0.4 + 2.75 * Math.pow(Math.max(1 - Math.pow(Math.abs(lx + 2.2) / 15, lx + 2.2 > 0 ? 1.7 : 5), 0), 0.75))], 0.04, 0.04, wkPale, 4); }   // what is left of her rail
  }
  // HER STERN, in the water. She broke her back abaft the deck house; her after body lies cocked up out of the sand: a raised poop
  // on a round counter, the sternpost and the rudder swung hard over under it, her frames bare where the plating is gone, what
  // is left of the poop rail
  {
    const brk = new THREE.Vector3(-9, 0, 0).applyMatrix4(wk.M), M = 10;
    wk.at(brk.x, brk.y, brk.z, -2.356, -0.2).move();
    const st = [0, -1.2, -2.4, -3.5, -4.5, -5.5, -5.6, -6.2, -6.9, -7.5, -8.0, -8.4, -8.6];
    const hbAt = (x) => (x > -3.5 ? 3.25 : 3.25 * Math.sqrt(Math.max(1 - Math.pow((-3.5 - x) / 5.1, 2), 0.0004)));
    const rimAt = (x) => 4.6 - 0.12 * x, botAt = (x) => (x > -5.55 ? -1.9 : 0.6 + (rimAt(x) - 1.9) * sstep(-5.6, -8.0, x));
    const ring = st.map((x) => { const hb = hbAt(x), ys = rimAt(x), yb = botAt(x), row = []; for (let j = 0; j <= M; j++) { const ph = Math.PI * j / M, cs = Math.cos(ph); row.push([x, ys - (ys - yb) * Math.pow(Math.sin(ph), 0.55), hb * Math.sign(cs) * Math.pow(Math.abs(cs), 0.6)]); } return row; });
    const gone = new Set(['1:8', '1:9', '2:8', '2:9', '3:8', '2:7', '8:8', '9:8', '3:1', '4:1', '9:2']);   // the plates that are gone: station, strake
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    for (let i = 0; i < st.length - 1; i++) for (let j = 0; j < M; j++) {
      const a = ring[i][j], b = ring[i + 1][j], c = ring[i + 1][j + 1], d = ring[i][j + 1];
      if (gone.has(i + ':' + j)) { wk.bar(a, d, 0.085, 0.085, iron2, 4); wk.bar(b, c, 0.085, 0.085, iron2, 4); wk.bar(mid(a, b), mid(d, c), 0.07, 0.07, iron2, 4); wk.bar(d, c, 0.05, 0.05, iron2, 4); continue; }   // her frames, and a stringer
      wk.quad(a, b, c, d, j < 2 || j > M - 3 ? rust : rust2);
    }
    const deckC = C('#6A5E50', 0.85);
    for (let i = 0; i < st.length - 1; i++) {
      const x0 = st[i], x1 = st[i + 1], y0 = rimAt(x0) - 0.55, y1 = rimAt(x1) - 0.55, h0 = hbAt(x0) * 0.96, h1 = hbAt(x1) * 0.96;
      if (i === 2 || i === 7) { wk.bar([x0, y0, -h0], [x0, y0, h0], 0.08, 0.08, iron2, 4); wk.bar([(x0 + x1) / 2, (y0 + y1) / 2, -(h0 + h1) / 2], [(x0 + x1) / 2, (y0 + y1) / 2, (h0 + h1) / 2], 0.08, 0.08, iron2, 4); continue; }   // the deck gone, its beams left
      wk.quad([x0, y0, h0], [x0, y0, -h0], [x1, y1, -h1], [x1, y1, h1], deckC);
    }
    wk.quad([0, 2.4, 3.25], [0, 2.4, -3.25], [0, rimAt(0) - 0.55, -3.25], [0, rimAt(0) - 0.55, 3.25], rust); wk.box(0.03, 3.3, 0.9, 0.06, 1.7, 0.8, hole);   // the poop's front, its door
    // what is left of the poop rail: stanchions, some bent, and the top bar in broken lengths
    const kept = { '-1': [1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1], 1: [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1] };
    for (const sd of [-1, 1]) for (let i = 0; i < st.length - 1; i++) {
      if (i === 5) continue;
      const P = (k, up) => { const x = st[k], lean = k % 4 === 3 ? 0.45 : 0.05; return [x, rimAt(x) + up * 0.95 * Math.cos(lean), sd * (hbAt(x) * 0.98 + up * 0.95 * Math.sin(lean))]; };
      if ((i + (sd > 0 ? 1 : 0)) % 5 !== 4) wk.bar(P(i, 0), P(i, 1), 0.045, 0.045, wkPale, 4);
      if (kept[sd][i]) wk.bar(P(i, 1), P(i + 1, 1), 0.04, 0.04, wkPale, 4);
    }
    // the sternpost, and the rudder hung on it under the counter, swung to starboard: its blade, three straps, its head
    wk.bar([-5.58, -1.9, 0], [-5.58, 1.0, 0], 0.17, 0.15, iron2, 5);
    const ca = Math.cos(0.6), sa = Math.sin(0.6), R = (d, y, off = 0) => [-5.7 - d * ca + off * sa, y, -d * sa - off * ca];
    for (const off of [-0.05, 0.05]) { const blade = [R(0, -1.8, off), R(1.7, -1.8, off), R(1.95, -0.6, off), R(1.5, 0.42, off), R(0, 0.5, off)]; for (let k = 1; k < 4; k++) wk.tri(blade[0], off > 0 ? blade[k] : blade[k + 1], off > 0 ? blade[k + 1] : blade[k], rust2); }
    for (const ry of [-1.3, -0.5, 0.25]) wk.bar(R(-0.1, ry), R(1.3, ry), 0.075, 0.05, iron2, 4);
    wk.bar(R(0, -1.9), R(0, 0.9), 0.1, 0.1, iron2, 5);
    // weed grown on her poop and her deck house (dealt by a stream of its own; rooted on her, 8.6 m and more behind the face's plane)
    const ww = ctx.core.makeRng(ctx.core.hashSeed('wreck-weed:' + ctx.seed)), root = new THREE.Vector3();
    for (let i = 0; i < 8; i++) {
      const x = -0.6 - 7.2 * (i + ww()) / 8, sd = i % 3 === 0 ? 0 : (i % 2 ? 1 : -1);
      root.set(x, rimAt(x) - (sd ? 0.05 : 0.5), sd * hbAt(x) * (sd ? 0.95 : 0)).applyMatrix4(wk.M);
      S.addKelp(cast.kelp, root.x, root.z, root.y, ww.range(1.2, 2.6), ww, i % 4 === 1 ? 1 : 0);
    }
  }
  wk.at().move();
  // her bower anchor's chain, run out from the end of one of her hawse pipes: it leads straight ahead of her and down beside her
  // stem (0.49 m from the stem bar's middle line at the nearest, 0.89 m at the bar's foot), comes to the dry sand some 3 m short of
  // its anchor and from there lies sanded over (as much as 0.2 m under); a ladder against her bow
  S.addChain(wk, [518.67, -13.53, -14.87], [511.5, bed(511), -7.6], { sag: 2.6, thick: 0.22 });
  wk.at(519.8, bed(520), -11.2, 0.8).move(); for (const sd of [-1, 1]) wk.bar([sd * 0.3, 0, 0], [sd * 0.3, 4.6, -1.7], 0.05, 0.05, C('#C9A46A', 0.8), 4); for (let k = 1; k < 10; k++) wk.bar([-0.3, k * 0.46, -k * 0.17], [0.3, k * 0.46, -k * 0.17], 0.035, 0.035, C('#C9A46A', 0.8), 4);
  wk.at().move();
  cast.looks.push({ 0: 523, 1: -15, 2: -18.5, weight: 0.7 });                            // her dry bow, mast and derrick, across the slot
  S.addBoat(g, 'dinghy', 536, -27.5, 0.6, { hull: C('#F4FBF7', 0.8), bottom: bots[0] });
  cast.weed = [[535, -30, 6, 60], [541, -35, 5, 30]];                                  // weed grown on her stern: x, z, spread, stipes
  // THE DRIFT NET hung in swags from cork floats in the north face, silver fish hung before it, pots on the sand below
  const cork = C('#C8432B', 0.85), silver = C('#E6F2F2', 1.0), nz = -24.5;
  for (let x = 598; x <= 632.01; x += 5.667) { g.at(x, 0, nz).move(x, nz, 1, 1); g.ball(0, 0.05, 0, 0.45, 0.34, 0.45, cork, 7, 4); }
  g.at().move();
  cast.net = S.buildNet(sea, 598, 632, nz, 9, 5.667);
  for (let i = 0; i < 30; i++) {                                                       // silver fish hung before the net, on the face's side of it: they hang unmoving in the plane z -24.0, the net's folds stirring 0.3 to 2.9 m behind them (they are not meshed in it)
    const fx = 599.5 + i * 1.05 + rng.range(-1, 1), fy = -1.8 - 6.4 * rng() * rng(), a = rng.range(-1.3, 1.3), c = Math.cos(a), sn = Math.sin(a), n = [0, 0.4, 0.9];
    g.at(fx, fy, nz + 0.5, 0, a).move();                                              // a round silver body and a forked tail
    g.ball(0, 0, 0, 0.3, 0.085, 0.05, silver, 6, 3); g.tri([-0.24, 0, 0], [-0.44, 0.13, 0], [-0.44, -0.13, 0], C('#9FB4BA', 1), n, n, n);
  }
  g.at().move();
  for (let i = 0; i < 14; i++) {
    const px = 596 + i * 2.9 + rng.range(-0.5, 0.5), pz = -22.6 - (i % 3) * 2.4, by = bed(px);
    g.at(px, by, pz, rng.range(0, 3)).move(); g.box(0, 0.36, 0, 1.25, 0.72, 0.85, C('#C09450', 0.9), C('#E0BC78', 0.9)); for (const hx of [-0.4, 0, 0.4]) g.box(hx, 0.37, 0, 0.07, 0.78, 0.9, C('#5A4028', 0.9)); g.at().move();   // a creel of pale withies, three dark hoops
    g.rope([px, by + 0.7, pz], [px + 0.5, -0.1, pz - 0.3], C('#D8CCA4', 0.85), 0.028, 1.6 + rng() * 1.2, 12);
    g.at(px + 0.5, 0, pz - 0.3).move(px + 0.5, pz - 0.3, 1, 1); g.ball(0, 0.05, 0, 0.2, 0.2, 0.2, i % 2 ? cork : C('#F4FBF7', 0.85), 6, 4); g.at().move();
  }
  cast.looks.push([617, -12, -24]);
  cast.shoals.push({ c: [612, -12, -32], r: [9, 3, 4], n: 700, period: -27 });                     // (behind the net: its nearest fish swim 1.1 m and more beyond the net's foot)
  await ctx.yield();
  // RARE: a helmet diver at work on the bottom at the north face's foot, between the black sloop's anchor and the green buoy, his
  // air hose rising to a launch above him. (The launch lies x 574.6 .. 581.8: 56 m and more of water west of the keeper's rudder
  // at her westmost, 638.1; 11 m east of the sloop; 3.3 m west of the buoy.) He stands; his hands work slowly before him
  if (o.rare) {
    const dx = 579, dz = -22.7, by = bed(dx), k = 1.4, canvas = C('#E6D8AC', 0.95), brass = [1.5, 0.92, 0.2], lead = C('#3A3F44', 0.9), hose = C('#F0E6C4', 1.0);
    g.at(dx, by, dz, 0.5).move();
    for (const sgn of [-1, 1]) {
      g.box(0.1 * k, 0.09 * k, sgn * 0.17 * k, 0.42 * k, 0.18 * k, 0.2 * k, lead);                                              // lead-soled boots
      g.bar([0, 0.18 * k, sgn * 0.17 * k], [0, 0.95 * k, sgn * 0.13 * k], 0.13 * k, 0.15 * k, canvas, 6);
      // an arm, bent before him: from the shoulder down it moves more and more, the hand slowly to and fro and up and down
      // (the kite's weaving law at a third of its strength: a closed sum of slow sines; the hand moves 0.25 m at the most)
      g.move(dx, dz, 6, 0, (px, py) => 0.34 * Math.min(1, Math.max(0, (1.42 * k - py) / (0.42 * k))));
      g.bar([0, 1.42 * k, sgn * 0.3 * k], [0.28 * k, 1.0 * k, sgn * 0.42 * k], 0.1 * k, 0.085 * k, canvas, 5); g.ball(0.3 * k, 0.96 * k, sgn * 0.43 * k, 0.09 * k, 0.09 * k, 0.09 * k, C('#D9A07A', 0.85), 5, 3);
      g.move();
    }
    g.ball(0, 1.22 * k, 0, 0.3 * k, 0.42 * k, 0.26 * k, canvas, 8, 5);
    g.box(0.24 * k, 1.3 * k, 0, 0.1 * k, 0.24 * k, 0.26 * k, lead); g.box(-0.24 * k, 1.3 * k, 0, 0.1 * k, 0.24 * k, 0.26 * k, lead);   // chest and back weights
    g.turn(0, 1.5 * k, 0, [[0.34 * k, 0], [0.3 * k, 0.1 * k], [0.2 * k, 0.16 * k]], brass, 9);                                  // the corselet
    g.ball(0, 1.86 * k, 0, 0.25 * k, 0.26 * k, 0.25 * k, brass, 9, 6);                                                          // the helmet, its three lights
    g.box(0.24 * k, 1.88 * k, 0, 0.04 * k, 0.17 * k, 0.17 * k, C('#0E1E28', 1)); for (const sgn of [-1, 1]) g.box(0.06 * k, 1.9 * k, sgn * 0.24 * k, 0.14 * k, 0.14 * k, 0.04 * k, C('#0E1E28', 1));
    g.at().move();
    // his air hose and his lifeline, bellying down the tide from the launch that tends him
    g.rope([dx + 0.2, 0.45, dz - 0.9], [dx - 0.25, by + 2.25 * k, dz], hose, 0.11, 2.6, 14);
    g.rope([dx + 1.0, 0.45, dz - 0.9], [dx + 0.1, by + 1.5 * k, dz + 0.1], C('#B08A52', 0.9), 0.05, 1.5, 10);
    S.addBoat(g, 'launch', dx - 0.8, dz - 0.9, 0.1, { hull: hulls[0], bottom: bots[0] });
    for (const off of [0, 0.3, -0.25, 0.15, -0.1]) cast.risers.push([dx + off, by + 2.4 * k, dz + off * 0.6, bedD(dx) - 3.4, 2.4]);   // his breath, a broad column of large bubbles
    cast.looks.push({ 0: dx, 1: by + 3.5, 2: dz, weight: 0.7 });
    cast.diver = [dx, dz];                                                              // (no kelp is laid within 6 m of him or of his launch, and no sea grass and no stone where he stands)
  }
  // the other boats of the day, dealt along both lips clear of the named ones (by a stream of their own: their count follows
  // the visit's density, and nothing dealt after them shifts with it)
  const moor = ctx.core.makeRng(ctx.core.hashSeed('moorings:' + ctx.seed));
  const keepOut = { '-1': [[40, 85], [462, 555], [560, 960]], 1: [[135, 220], [255, 295], [335, 380], [405, 480], [700, 842], [930, 965]] };   // (the named moorings; the breakwater's reach, where its gulls fly low)
  const kinds = ['sloop', 'launch', 'dinghy', 'yawl', 'row', 'fisher'];
  let chains = 0;
  for (let i = 0, n = Math.round(26 * o.density); i < n; i++) {
    const side = i % 2 ? 1 : -1, x = 95 + (i + moor()) * (860 / n), z = side * (24.5 + 30 * moor() * moor()), kind = moor.pick(kinds), ry = moor.range(-0.4, 0.4) + (moor.chance(0.5) ? Math.PI : 0), hc = moor.pick(hulls), bc = moor.pick(bots);
    if (keepOut[side].some(([a, b]) => x > a - 8 && x < b + 8)) continue;
    // (and none whose hull or chain would hang before the lion's mane or behind it: none near enough the lip to carry a chain,
    // from 8 m west of its station to 23.5 m east of it, where the market's own reach begins)
    if (side > 0 && z < 38 && x > JELLY_AT[0] - 8 && x < JELLY_AT[0] + 23.5) continue;
    S.addBoat(g, kind, x, z, ry, { hull: hc, bottom: bc });
    if (Math.abs(z) < 38 && chains++ < 9) { S.addChain(g, [x + Math.cos(ry) * 3.2, -0.15, z - Math.sin(ry) * 3.2], [x + Math.cos(ry) * 11, bed(x + Math.cos(ry) * 11), z - Math.sin(ry) * 4], { sag: 1.0 }); await ctx.yield(); }
    if (i % 4 === 3) await ctx.yield();
  }
  // the regatta: forty far white sails to the south, every one making way round a long closed loop of its own (the motion law's
  // kind 9: a loop 120 to 240 m long east and west and 12 m wide, sailed at 2.4 to 3.9 m/s along its long sides, slow round
  // its ends where she goes about; one round in 97 to 314 s). Each sails in a lane of her own, north and south: a lane is 21.3 m
  // and more wide, a sail keeps within 6.9 m of her loop's middle north and south (the loop's 6 m and her own reach as she lies
  // to her course) and that middle within 1 m of her lane's: 5.5 m and more of water between any two. No sail leaves the water x 100 .. 1500, z 240 .. 1100. A stream of their own
  // deals them: their count follows the quality tier's detail, and nothing dealt after them shifts with it
  const white = C('#F4FBF7', 0.85), fleet = ctx.core.makeRng(ctx.core.hashSeed('regatta:' + ctx.seed));
  for (let i = 0, n = Math.min(40, Math.round(40 * ctx.quality.detail)); i < n; i++) {
    const A = fleet.range(60, 120), x = fleet.range(104 + A, 1496 - A), z = 244 + (i + 0.5) * 852 / n + fleet.range(-1, 1), h = fleet.range(9, 13), way = fleet.chance(0.5) ? 1 : -1;
    g.at(x, 0, z).move(x, z, 9, way * A); g.tri([0.5, 0.8, 0], [-3.4, 0.9, 0.3], [0.5, h, 0], white); g.tri([0.8, 0.8, 0], [3.6, 0.8, 0], [0.8, h * 0.85, 0], white); g.box(0, 0.3, 0, 7, 0.6, 1.6, hulls[i % 5]);
  }
  g.at().move();
  cast.afloat = g;
}

// ---- plain things of the town, each into the builder g at the builder's present place ----
const SHIRTS = ['#C8432B', '#F4FBF7', '#0B5A7A', '#D9A85A', '#2F6B4A', '#8CC8EE', '#E8B8A0', '#3A3F44'].map((h) => C(h, 0.8));
const SKINS = ['#D9A07A', '#B8805A', '#E8C0A0', '#8A5A3A'].map((h) => C(h, 0.85));
const BUNTING = ['#E2452E', '#F4FBF7', '#F2C040', '#3F8FD8', '#3FA060'].map((h) => C(h, 1.0)), SUNWARD = [0, 0.866, 0.5];   // bright cloth; the way to the noon sun
// the blue shadow a thing throws on the ground north of it: a footprint w by d, from height h0 up to h; round for round things.
// (each corner carries its place within the shadow, so the edge can be soft)
function shadow(g, x, z, w, d, h, h0 = 0, round = 0) {
  const sh = g.shade; if (!sh) return;
  const ox = sh.off[0], oz = sh.off[1], pad = 1.25;
  const P = (px, pz) => [px, groundY(px, pz) + 0.05, pz];
  const a = P(x - w * pad / 2 + ox * h0, z + d * pad / 2 + oz * h0), b = P(x + w * pad / 2 + ox * h0, z + d * pad / 2 + oz * h0), c = P(x + w * pad / 2 + ox * h, z - d * pad / 2 + oz * h), e = P(x - w * pad / 2 + ox * h, z - d * pad / 2 + oz * h);
  const put = (q, u, v) => sh._vert(q[0], q[1], q[2], 0, 1, 0, [u, v, round]);
  put(a, 0, 0); put(b, 1, 0); put(c, 1, 1); put(a, 0, 0); put(c, 1, 1); put(e, 0, 1);
}
const HAIR = ['#2A2622', '#5A4030', '#C9A46A', '#8A8A86'].map((h) => C(h, 0.9));
function person(g, x, y, z, ry, sit, rng) {
  shadow(g, x, z, 0.5, 0.36, sit ? 1.3 : 1.75);
  const shirt = rng.pick(SHIRTS), legs = rng.pick(SHIRTS), skin = rng.pick(SKINS), h = sit ? 0.5 : 0.9, hat = rng.chance(0.4);
  g.at(x, y, z, ry).move();
  g.ball(0, h + 0.33, 0, 0.2, 0.36, 0.14, shirt, 6, 4); g.ball(0, h + 0.83, 0, 0.12, 0.13, 0.12, skin, 6, 3);
  if (hat) g.turn(0, h + 0.9, 0, [[0.27, 0], [0.13, 0.03], [0.1, 0.13], [0.02, 0.15]], C('#E8D8A8', 0.85), 7);        // a straw hat
  else g.ball(-0.02, h + 0.88, 0, 0.125, 0.1, 0.125, rng.pick(HAIR), 6, 3);
  for (const s of [-1, 1]) g.bar([0, h + 0.56, s * 0.2], [sit ? 0.22 : 0.05, h + 0.12, s * 0.24], 0.055, 0.045, s > 0 || rng.chance(0.5) ? skin : shirt, 4);   // arms
  if (sit) { for (const s of [-1, 1]) { g.bar([0, h, s * 0.1], [0.42, h, s * 0.1], 0.08, 0.07, legs, 4); g.bar([0.42, h, s * 0.1], [0.44, 0.02, s * 0.1], 0.07, 0.06, skin, 4); } }
  else for (const s of [-1, 1]) { g.bar([0, h + 0.02, s * 0.09], [0, 0.45, s * 0.1], 0.09, 0.075, legs, 4); g.bar([0, 0.45, s * 0.1], [0, 0.02, s * 0.11], 0.065, 0.055, skin, 4); }
  g.at();
}
function parasol(g, x, y, z, rng, r = 1.5) {
  shadow(g, x, z, r * 2, r * 2, 2.3, 2.0, 1);
  const a = rng.pick(SHIRTS), b = C('#F4FBF7', 0.85);
  g.at(x, y, z).move(); g.bar([0, 0, 0], [0, 2.3, 0], 0.035, 0.035, C('#E8E2D2', 0.8), 4);
  g.move(0, 0, 3, 0, (px, py) => (py < 2.1 ? 1 : 0));
  g.turn(0, 2.0, 0, [[r, 0], [r * 0.5, 0.33], [0.03, 0.5]], (i, j) => (j % 2 ? a : b), 10);
  g.at().move();
}
function stall(g, x, y, z, ry, rng) {
  shadow(g, x, z, 3.4, 2.3, 2.9, 2.5); shadow(g, x, z, 3.2, 1.3, 1.0);
  const a = rng.pick(SHIRTS), b = C('#F4FBF7', 0.85), wood = C('#8A6A42', 0.8);
  g.at(x, y, z, ry).move();
  g.box(0, 0.5, 0, 3.2, 1.0, 1.3, wood, C('#D9C29A', 0.8));
  for (let i = 0; i < 6; i++) g.ball(-1.3 + i * 0.52, 1.12, 0.1, 0.2, 0.16, 0.2, rng.pick(SHIRTS), 5, 3);
  for (const sx of [-1.6, 1.6]) for (const sz of [-0.9, 1.1]) g.bar([sx, 0, sz], [sx, sz < 0 ? 3.2 : 2.5, sz], 0.045, 0.045, wood, 4);
  for (let i = 0; i < 8; i++) {                                      // the striped awning, its front edge free in the breeze
    const x0 = -1.7 + i * 0.425, x1 = x0 + 0.425;
    g.move(0, 0, 3, 0, (px, py, pz) => (pz > 0.5 ? 1 : 0));
    g.quad([x0, 3.2, -1.0], [x0, 2.5, 1.3], [x1, 2.5, 1.3], [x1, 3.2, -1.0], i % 2 ? a : b);
    g.quad([x0, 2.5, 1.3], [x0, 2.15, 1.34], [x1, 2.15, 1.34], [x1, 2.5, 1.3], i % 2 ? a : b);
  }
  g.at().move();
}
// a deckchair: a striped sling on low wooden legs, facing +x in its own turn
function deckchair(g, x, y, z, ry, col) {
  const wood = C('#B89868', 0.8);
  g.at(x, y, z, ry).move();
  g.quad([-0.3, 0.25, -0.3], [-0.3, 0.25, 0.3], [0.5, 0.35, 0.3], [0.5, 0.35, -0.3], col); g.quad([-0.3, 0.25, -0.3], [-0.75, 1.0, -0.3], [-0.75, 1.0, 0.3], [-0.3, 0.25, 0.3], col);
  for (const s of [-1, 1]) { g.bar([-0.85, 1.08, s * 0.32], [0.3, 0.0, s * 0.32], 0.025, 0.025, wood, 4); g.bar([-0.55, 0.0, s * 0.32], [0.55, 0.38, s * 0.32], 0.025, 0.025, wood, 4); }
  g.at().move();
}
// a boulder: a squat stone, every one a little different, half sunk in the sand
const ROCKS = ['#6E6A5E', '#5A574E', '#7C7566', '#4E5046'].map((h) => C(h, 0.85));
function boulder(g, x, y, z, r, rng) {
  const sides = 7, rings = 4, sq = rng.range(0.45, 0.8), el = rng.range(0.8, 1.5), col = rng.pick(ROCKS), lump = [];
  for (let j = 0; j < sides; j++) lump.push(rng.range(0.75, 1.2));
  const rows = [];
  for (let i = 0; i <= rings; i++) { const a = -0.5 + 2.07 * i / rings, cr = Math.max(Math.cos(a), 0.03), row = []; for (let j = 0; j < sides; j++) { const an = j / sides * 6.2832, l = lump[j] * (0.85 + 0.3 * rng()); row.push([Math.cos(an) * r * el * cr * l, Math.sin(a) * r * sq, Math.sin(an) * r * cr * l]); } rows.push(row); }
  g.at(x, y, z, rng.range(0, 6.28)).move(); g.skin(rows, col, true, false); g.at().move();
}
// a tuft of sea grass rooted on the bed: a few long blades that lean with the stream and sway
const GRASS = ['#3E7A34', '#5A8E38', '#7A9A3C', '#3A6A44'].map((h) => C(h, 1.0));
function tuft(g, x, y, z, h, rng) {
  g.at(x, y, z, rng.range(0, 6.28)).move(x, z, 2, 0, (px, py) => py * 0.6);
  for (let k = 0, n = 4 + Math.floor(rng() * 3); k < n; k++) {
    const a = k * 2.1 + rng(), out = 0.12 + 0.3 * rng(), hh = h * (0.6 + 0.4 * rng()), wd = 0.08 + 0.08 * rng(), c = rng.pick(GRASS), dx = Math.cos(a), dz = Math.sin(a);
    g.tri([dx * 0.05 - dz * wd, 0, dz * 0.05 + dx * wd], [dx * 0.05 + dz * wd, 0, dz * 0.05 - dx * wd], [dx * out, hh, dz * out], c);
  }
  g.at().move();
}
function bus(g) {                                                     // a red bus, 9 m long, 3.2 m tall, nose toward +x, standing on y 0
  const red = C('#C8432B', 0.85), glass = C('#1E3440', 1), cream = C('#EFE6CC', 0.85), tyre = C('#1E2226', 1), lampC = C('#F4E8B0', 1);
  g.box(0, 1.2, 0, 9, 1.4, 2.5, red); g.box(0, 2.45, 0, 9, 1.1, 2.5, cream, cream); g.box(0, 3.1, 0, 8.6, 0.2, 2.3, cream);       // red below the waist, cream above, a cream roof
  g.box(0, 1.92, 0, 9.04, 0.08, 2.54, cream);                                                                                    // the waist rail
  for (const s of [-1, 1]) {
    for (let k = 0; k < 6; k++) g.box(-3.3 + k * 1.3, 2.45, s * 1.26, 1.05, 0.8, 0.04, glass);
    for (const wx of [-2.9, 2.9]) { g.bar([wx, 0.5, s * 0.95], [wx, 0.5, s * 1.28], 0.5, 0.5, tyre, 9); g.bar([wx, 0.5, s * 1.28], [wx, 0.5, s * 1.3], 0.2, 0.2, cream, 7); }
    g.ball(4.52, 0.95, s * 0.9, 0.05, 0.13, 0.13, lampC, 6, 3);
  }
  g.box(4.51, 2.4, 0, 0.04, 0.95, 2.2, glass); g.box(-4.51, 2.45, 0, 0.04, 0.75, 1.9, glass); g.box(4.52, 3.0, 0, 0.04, 0.22, 1.2, tyre);
  g.box(4.52, 0.75, 0, 0.06, 0.5, 1.0, tyre);                                                                                    // the radiator
}
function cyclist(g, rng) {                                            // a plain figure on a bicycle, nose toward +x
  const dark = C('#1E2226', 1), shirt = rng.pick(SHIRTS);
  for (const wx of [-0.55, 0.55]) g.bar([wx, 0.36, -0.03], [wx, 0.36, 0.03], 0.36, 0.36, dark, 8);
  g.bar([-0.55, 0.36, 0], [0.1, 0.85, 0], 0.035, 0.035, dark, 4); g.bar([0.1, 0.85, 0], [0.55, 0.36, 0], 0.035, 0.035, dark, 4); g.bar([0.45, 0.6, 0], [0.4, 1.1, 0], 0.03, 0.03, dark, 4);
  g.ball(-0.1, 1.3, 0, 0.2, 0.36, 0.15, shirt, 6, 4); g.ball(0.02, 1.8, 0, 0.12, 0.13, 0.12, rng.pick(SKINS), 6, 3);
  for (const s of [-1, 1]) g.bar([-0.1, 1.0, s * 0.1], [0.05, 0.4, s * 0.12], 0.07, 0.06, C('#27404E', 1), 4);
}

// ---- the town, the street on the seabed, the stone things ----
async function buildLand(ctx, cast, o) {
  const rng = ctx.rng, bed = o.bed, g = new S.Geo();
  g.shade = cast.shade;
  const white = C('#F4FBF7', 0.85), red = C('#C8432B', 0.85), stone = C('#CFC6B2', 0.8), iron = C('#3A3F44', 0.9), wood = C('#8A6A42', 0.8);
  const walls = ['#EFE6CC', '#F4D8C8', '#CFE2EE', '#F4FBF7', '#E8D8A8'].map((h) => C(h, 0.8)), roofs = ['#A8482E', '#6A7480', '#8A5A42'].map((h) => C(h, 0.8));
  const tw = cast.town = new S.Geo();
  cast.houses = [];                                                                   // every house's and hut's footprint: [x0, x1, z0, z1]
  // houses either side of the high street (none on it), roofs under y 11; the helter-skelter's plot is left open
  for (const side of [-1, 1]) for (let row = 0; row < 2; row++) for (let x = -20; x > -150; ) {
    const w = rng.range(7, 11), d = rng.range(8, 10), h = rng.range(3.6, 5.2), z = side * (22.5 + d / 2 + row * 14), cx = x - w / 2;
    x -= w + rng.range(0.5, 2.5);
    if (side < 0 && cx > -34 && cx < -8) continue;
    const wc = rng.pick(walls), rc = rng.pick(roofs);
    const tall = rng.chance(0.45), hh = tall ? 5.6 : h, dk = C('#27404E', 1), fr = C('#F4FBF7', 0.85), face = -side * (d / 2 + 0.02);
    tw.at(cx, 3, z).move(); tw.box(0, hh / 2, 0, w, hh, d, wc); cast.houses.push([cx - w / 2, cx + w / 2, z - d / 2, z + d / 2]);
    tw.quad([-w / 2 - 0.3, hh - 0.15, d / 2 + 0.4], [w / 2 + 0.3, hh - 0.15, d / 2 + 0.4], [w / 2 + 0.3, hh + 2.3, 0], [-w / 2 - 0.3, hh + 2.3, 0], rc); tw.quad([w / 2 + 0.3, hh - 0.15, -d / 2 - 0.4], [-w / 2 - 0.3, hh - 0.15, -d / 2 - 0.4], [-w / 2 - 0.3, hh + 2.3, 0], [w / 2 + 0.3, hh + 2.3, 0], rc);
    tw.tri([-w / 2, hh, d / 2], [-w / 2, hh + 2.3, 0], [-w / 2, hh, -d / 2], wc); tw.tri([w / 2, hh, -d / 2], [w / 2, hh + 2.3, 0], [w / 2, hh, d / 2], wc);
    tw.box(w * 0.28, hh + 2.2, d * 0.1, 0.8, 1.6, 0.8, C('#B9B2A4', 0.8), C('#A8482E', 0.8));                       // a chimney
    // the front that looks on the street: a door, windows in white surrounds on each floor, a striped blind over the shop
    for (let fl = 0; fl < (tall ? 2 : 1); fl++) for (let k = -1; k <= 1; k++) { if (fl === 0 && k === 0) { tw.box(0, 1.05, face, 1.0, 2.1, 0.06, rng.pick(SHIRTS)); continue; } tw.box(k * w * 0.3, 1.75 + fl * 2.35, face, 1.3, 1.5, 0.05, fr); tw.box(k * w * 0.3, 1.75 + fl * 2.35, face - side * 0.03, 1.0, 1.2, 0.05, dk); }
    if (rng.chance(0.5)) { const a = rng.pick(SHIRTS); for (let k = 0; k < 6; k++) { const x0 = -w * 0.45 + k * w * 0.15; tw.quad([x0, 3.0, face], [x0 + w * 0.15, 3.0, face], [x0 + w * 0.15, 2.5, face - side * 1.3], [x0, 2.5, face - side * 1.3], k % 2 ? a : fr); } }
    for (const k of [-1, 1]) { tw.box(k * w * 0.25, hh * 0.5, -face, 1.1, 1.3, 0.05, dk); }
    await ctx.yield();
  }
  await ctx.yield();
  await ctx.yield();
  // beach huts along the promenade's edge, striped
  for (const side of [-1, 1]) for (let i = 0; i < 30; i++) {
    const z = side * (23.5 + i * 3.1), a = rng.pick(SHIRTS);
    tw.at(-14.5, 3, z).move(); tw.box(0, 1.1, 0, 2.2, 2.2, 2.6, a); cast.houses.push([-15.6, -13.4, z - 1.3, z + 1.3]); tw.box(1.11, 0.95, 0, 0.04, 1.7, 0.8, C('#27404E', 1)); tw.box(0, 3.05, 0, 2.5, 0.08, 0.12, white);
    tw.quad([-1.2, 2.2, 1.4], [1.2, 2.2, 1.4], [1.2, 3.0, 0], [-1.2, 3.0, 0], a); tw.quad([1.2, 2.2, -1.4], [-1.2, 2.2, -1.4], [-1.2, 3.0, 0], [1.2, 3.0, 0], a);
  }
  await ctx.yield();
  // THE HELTER-SKELTER on a round stone bastion of the promenade at the head of the north beach: striped, a slide winding down it
  g.at(-6.5, 0, -33).move();
  g.turn(0, 0, 0, [[5.7, 0.2], [5.5, 2.75], [5.65, 2.8], [5.65, 3.0], [0.02, 3.0]], stone, 20);
  for (let k = 0; k < 20; k++) { const a = (k + 0.5) / 20 * 6.2832; g.bar([Math.cos(a) * 5.4, 3.0, Math.sin(a) * 5.4], [Math.cos(a) * 5.4, 3.9, Math.sin(a) * 5.4], 0.07, 0.07, white, 4); }
  g.at(-6.5, 3, -33).move();
  g.turn(0, 0, 0, [[3.6, 0], [3.1, 3.6], [2.65, 7.2], [2.15, 10.8], [1.85, 13.2]], (i, j) => ((j + i * 2) % 4 < 2 ? red : white), 16);
  g.turn(0, 13.2, 0, [[2.5, 0], [2.3, 0.18], [0.06, 3.6]], red, 12); g.turn(0, 11.5, 0, [[2.4, 0], [2.4, 1.7]], C('#E8D8A8', 0.8), 12);
  const slide = []; for (let k = 0; k <= 60; k++) { const a = k * 0.3, y = 12 - k * 0.19, r = 1.9 + (12 - y) * 0.14; slide.push([[Math.cos(a) * (r + 0.1), y, Math.sin(a) * (r + 0.1)], [Math.cos(a) * (r + 1.3), y - 0.18, Math.sin(a) * (r + 1.3)], [Math.cos(a) * (r + 1.42), y + 0.42, Math.sin(a) * (r + 1.42)]]); }
  g.skin(slide, C('#D9A85A', 0.85), false, true);
  g.bar([0, 16.8, 0], [0, 18.7, 0], 0.06, 0.06, white, 4); g.move(0, 0, 3, 1); g.tri([0, 18.7, 0], [0, 18.0, 0], [1.6, 18.35, 0], red); g.move();
  for (let i = 0; i < 5; i++) person(g, -6.5 + Math.cos(i * 1.3 + 0.4) * 4.5, 3, -33 + Math.sin(i * 1.3 + 0.4) * 4.5, i * 1.3, false, rng);
  // the bus at the promenade's stop, its shelter and people waiting
  g.at(-29, groundY(-29, 4), 4.1); bus(g); shadow(g, -29, 4.1, 9, 2.5, 3.2); g.at(-31.2, 3, 7.5); g.box(0, 1.2, 0, 3, 0.1, 0.1, iron); g.box(0, 2.4, 0.3, 3.2, 0.1, 1.4, C('#27404E', 1)); for (const lx of [-1.5, 1.5]) g.box(lx, 1.2, 0.9, 0.08, 2.4, 0.08, iron);
  for (const [px, pz] of [[-32.7, 6.8], [-32.0, 6.3], [-30.6, 6.9], [-29.9, 6.3], [-29.2, 6.8]]) person(g, px, 3, pz, rng.range(2.6, 3.6), false, rng);   // (a pair and three, in no file)
  await ctx.yield();
  // the street's lamp standards, 5 m, every 40 m either side from the ramp's head on the promenade to the island; benches by them
  const benchRng = ctx.core.makeRng(ctx.core.hashSeed('benches:' + ctx.seed));        // (the bench sitters are dealt by a stream of their own)
  for (let x = -20; x <= 980; x += 40) for (const s of [-1, 1]) {
    const y = groundY(x, 5.5);
    shadow(g, x, s * 5.5, 0.22, 0.2, 4.9);
    g.at(x, y, s * 5.5).move(); g.bar([0, 0, 0], [0, 4.6, 0], 0.09, 0.06, C('#27504A', 0.9), 5); g.ball(0, 4.8, 0, 0.22, 0.22, 0.22, white, 6, 4);
    cast.stands.push([x, s * 5.5, 0.15]);
    // a bench by every second lamp, on alternate sides, 6 m on from it (none where the breakwater's pier or the landing stands)
    const bx = x + 6, yb = groundY(bx, 6.4);
    if (((x + 20) / 40) % 2 === (s > 0 ? 0 : 1) && Math.abs(bx - 790) > 8 && bx < 975) {
      cast.stands.push([bx, s * 6.4, 1.0]); shadow(g, bx, s * 6.4, 1.8, 0.6, 1.0);
      g.at(bx, yb, s * 6.4, s > 0 ? 0 : Math.PI); g.box(0, 0.45, 0, 1.8, 0.08, 0.5, wood); g.box(0, 0.75, -0.25, 1.8, 0.5, 0.06, wood); for (const lx of [-0.8, 0.8]) g.box(lx, 0.22, 0, 0.08, 0.44, 0.5, iron);
      for (const k of [-0.45, 0.45]) if (benchRng.chance(0.6)) person(g, bx + k + benchRng.range(-0.15, 0.15), yb, s * 6.4, s > 0 ? -1.57 : 1.57, true, benchRng);
    }
  }
  await ctx.yield();
  // the ramp: two flagstaffs where the high street leaves the promenade, and bathing tents down both its sides at the faces' feet,
  // the first of them taller than the water beside it, the later ones under it
  for (const sd of [-1, 1]) {
    const blue = C('#0B5A7A', 0.9), gold = C('#D9A85A', 0.9), mh = 15;
    g.at(-12.5, 3, sd * 18.5).move(); g.bar([0, 0, 0], [0, mh, 0], 0.16, 0.08, white, 6); g.ball(0, mh + 0.15, 0, 0.22, 0.22, 0.22, gold, 6, 3);
    g.box(0, 0.35, 0, 1.1, 0.7, 1.1, stone); g.bar([0, mh * 0.7, -1.4], [0, mh * 0.7, 1.4], 0.06, 0.05, white, 5);                       // a stone foot, a yard
    // the great flag at the masthead, flying down the breeze (it sets north-east, as the steamer's smoke lies): three broad bands
    g.at(-12.5, 3, sd * 18.5, 1.0).move(0, 0, 3, 0, (px) => Math.min(1.6, px * 0.55));
    for (let k = 0; k < 6; k++) for (let b = 0; b < 3; b++) g.quad([0.12 + k * 0.6, mh - 0.1 - b * 0.7, 0], [0.12 + k * 0.6, mh - 0.8 - b * 0.7, 0], [0.72 + k * 0.6, mh - 0.8 - b * 0.7, 0], [0.72 + k * 0.6, mh - 0.1 - b * 0.7, 0], b === 1 ? white : (sd > 0 ? red : blue));
    // strings of pennants from the masthead and from the yard's outer end down to the promenade's edge, away from the street
    g.at(-12.5, 3, sd * 18.5);
    for (const [top, z0, run] of [[mh, 0, 13], [mh * 0.7, 1.4, 8.5]]) {
      const n = Math.round(Math.hypot(top, run) / 0.6);
      for (let k = 1; k < n; k++) { const f = k / n, py = top * (1 - f) - 2.4 * f * (1 - f), pz = sd * (z0 + (run - z0) * f); g.move(0, 0, 3, 0, (qx, qy) => (qy < py - 0.1 ? 1.1 : 0)); g.tri([0, py, pz - 0.21], [0, py, pz + 0.21], [0, py - 0.52, pz], SHIRTS[k % 5]); }
    }
    g.at().move();
  }
  // the ramp's head, where the town sits down by its sea: parasols and deckchairs south of the paving, three more under the north lip's beach
  for (let i = 0; i < 15; i++) {
    const north = i >= 12, x = north ? -22 + (i - 12) * 9 : -26 + (i % 6) * 7 + rng.range(-1.5, 1.5), z = north ? -15.2 : 9.6 + Math.floor(i / 6) * 4.4 + rng.range(-1, 1), y = groundY(x, z);
    parasol(g, x, y, z, rng, 1.5); person(g, x + 0.8, y, z + 0.2, rng.range(0, 6.28), true, rng);
    if (i % 2) person(g, x - 0.9, y, z - 0.5, rng.range(0, 6.28), i % 4 === 1, rng);
    g.at(x - 0.3, y, z + 1.3, 1.57).move(); g.quad([-0.3, 0.25, -0.3], [-0.3, 0.25, 0.3], [0.5, 0.35, 0.3], [0.5, 0.35, -0.3], i % 2 ? red : white); g.quad([-0.3, 0.25, -0.3], [-0.75, 1.0, -0.3], [-0.75, 1.0, 0.3], [-0.3, 0.25, 0.3], i % 2 ? red : white);
  }
  g.at().move();
  for (let i = 0; i < 10; i++) {
    const sd = i % 2 ? 1 : -1, x = 34 + i * 13.5, z = sd * (15.6 + (i % 3) * 0.7), y = bed(x), a = rng.pick(SHIRTS);
    shadow(g, x, z, 2.2, 2.2, 1.6, 0.4, 1); cast.stands.push([x, z, 1.2]);
    g.at(x, y, z, rng.range(-0.3, 0.3)).move(); g.turn(0, 0, 0, [[1.1, 0], [1.1, 1.6], [0.05, 2.6]], (i2, j) => (j % 2 ? a : white), 8);
    person(g, x + rng.range(1.6, 2.6), y, z - sd * rng.range(0.5, 2.5), rng.range(0, 6.28), rng.chance(0.5), rng); person(g, x - rng.range(1.6, 2.6), y, z - sd * rng.range(0.5, 3.5), rng.range(0, 6.28), false, rng);
  }
  await ctx.yield();
  // and all down the ramp, close either side of the paving: big parasols, deckchairs, windbreaks of striped cloth, people
  const rampRng = ctx.core.makeRng(ctx.core.hashSeed('ramp:' + ctx.seed));
  for (let i = 0; i < 34; i++) {
    const sd = i % 2 ? 1 : -1, x = 4 + i * 5.1 + rampRng.range(-1.2, 1.2), z = sd * rampRng.range(8.5, 12.4), y = groundY(x, z), col = rampRng.pick(SHIRTS);
    cast.stands.push([x, z, 1.6]);
    if (i % 3 < 2) {
      parasol(g, x, y, z, rampRng, rampRng.range(1.6, 2.1));
      for (const k of [-1, 1]) { deckchair(g, x + k * 1.1, y, z + sd * 0.4, k * 0.5 + 1.57 * (1 - sd), k > 0 ? col : white); if (rampRng.chance(0.7)) person(g, x + k * 1.1, y - 0.18, z + sd * 0.4, rampRng.range(0, 6.28), true, rampRng); }
    } else {
      g.at(x, y, z, rampRng.range(-0.4, 0.4)).move();                                   // a windbreak: striped cloth on four stakes, a family behind it
      for (let k = 0; k < 6; k++) { g.move(0, 0, 3, 0, (px, py) => (py > 0.9 ? 0.5 : 0)); g.quad([-1.8 + k * 0.6, 0.1, 0], [-1.2 + k * 0.6, 0.1, 0], [-1.2 + k * 0.6, 1.25, 0], [-1.8 + k * 0.6, 1.25, 0], k % 2 ? col : white); }
      g.move(); for (let k = 0; k < 4; k++) g.bar([-1.8 + k * 1.2, 0, 0], [-1.8 + k * 1.2, 1.4, 0], 0.03, 0.03, wood, 4);
      shadow(g, x, z, 3.6, 0.5, 1.25);
      for (let k = 0; k < 3; k++) person(g, x + rampRng.range(-1.4, 1.4), y, z + 0.9 + rampRng.range(0, 0.8), rampRng.range(0, 6.28), rampRng.chance(0.7), rampRng);
    }
    if (i % 12 === 11) await ctx.yield();
  }
  g.at().move();
  await ctx.yield();
  // THE MARKET at the south face's foot, its stalls and parasols under the light net; people at the stalls
  const nStall = o.marketDay ? 16 : 9;
  for (let i = 0; i < nStall; i++) {
    const x = 331 + i * 6.2, z = 16.6;                             // one row along the face's foot; on a market day it runs on eastward
    stall(g, x, bed(x), z, Math.PI, rng);
    for (let k = 0; k < 2; k++) person(g, x + rng.range(-1.4, 1.4), bed(x), z - 2.1 - rng.range(0, 0.8), rng.range(-0.4, 0.4) - 1.57, false, rng);
    person(g, x + rng.range(-0.8, 0.8), bed(x), z + 0.9, 1.57, false, rng);
    if (i % 4 === 3) await ctx.yield();
  }
  await ctx.yield();
  for (let i = 0; i < 12; i++) { const x = 322 + i * 6.1 + rng.range(-1, 1), z = rng.range(7.2, 9.6); parasol(g, x, bed(x), z, rng); person(g, x + 0.7, bed(x), z, rng.range(0, 6.28), true, rng); }
  await ctx.yield();
  // bathing tents, deckchairs and people on the wet sand under the yawl and the bathers
  const nTent = o.marketDay ? 7 : 14;
  for (let i = 0; i < nTent; i++) {
    const x = 176 + i * (120 / nTent) + rng.range(-1.5, 1.5), z = rng.range(9, 16.5), y = bed(x), a = rng.pick(SHIRTS);
    shadow(g, x, z, 2.2, 2.2, 1.6, 0.4, 1); cast.stands.push([x, z, 1.2]);
    g.at(x, y, z, rng.range(-0.3, 0.3)).move(); g.turn(0, 0, 0, [[1.1, 0], [1.1, 1.6], [0.05, 2.6]], (i2, j) => (j % 2 ? a : white), 8);
    for (let k = 0; k < 2; k++) person(g, x + rng.range(-3, 3), y, z + rng.range(-2.5, 2), rng.range(0, 6.28), rng.chance(0.5), rng);
  }
  await ctx.yield();
  for (let i = 0; i < 10; i++) { const x = 262 + i * 2.6, z = 13 + (i % 3) * 1.6, y = bed(x); g.at(x, y, z, 1.57).move(); g.quad([-0.3, 0.25, -0.3], [-0.3, 0.25, 0.3], [0.5, 0.35, 0.3], [0.5, 0.35, -0.3], i % 2 ? red : white); g.quad([-0.3, 0.25, -0.3], [-0.75, 1.0, -0.3], [-0.75, 1.0, 0.3], [-0.3, 0.25, 0.3], i % 2 ? red : white); if (i % 2) person(g, x, y - 0.15, z, 0, true, rng); }
  g.at().move();
  await ctx.yield();
  await buildFair(ctx, g, cast);
  cast.land = g;
}

// ---- the promenade's own life at the head of the ramp, and the kites the town flies from its beaches ----
// (a stream of its own deals it all)
async function buildFair(ctx, g, cast) {
  const fr = ctx.core.makeRng(ctx.core.hashSeed('promenade:' + ctx.seed));
  const white = C('#F4FBF7', 0.85), red = C('#C8432B', 0.85), gold = C('#D9A85A', 0.9), stone = C('#CFC6B2', 0.8), iron = C('#3A3F44', 0.9), wood = C('#8A6A42', 0.8), green = C('#2F6B4A', 0.8);
  const things = [], fairScrap = new S.Geo();                         // [x, z, radius] of what stands on the promenade
  await ctx.yield();
  // a bandstand on the open plot north of the high street: eight posts, a red roof, a gilt ball
  g.at(-22, 3, -33).move(); things.push([-22, -33, 5]);
  g.turn(0, 0, 0, [[3.9, 0], [3.9, 0.7], [0.02, 0.7]], stone, 8);
  for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * 6.2832; g.bar([Math.cos(a) * 3.5, 0.7, Math.sin(a) * 3.5], [Math.cos(a) * 3.5, 4.0, Math.sin(a) * 3.5], 0.09, 0.08, white, 5); g.box(Math.cos(a) * 3.5, 1.25, Math.sin(a) * 3.5, 0.5, 0.08, 0.5, white); }
  g.turn(0, 4.0, 0, [[4.3, 0], [4.1, 0.25], [1.2, 1.7], [0.5, 2.1], [0.08, 2.9]], (i, j) => (i === 0 ? white : red), 8); g.ball(0, 7.0, 0, 0.28, 0.28, 0.28, gold, 6, 4);
  for (let i = 0; i < 6; i++) person(g, -22 + Math.cos(i * 1.05) * 1.9, 3.7, -33 + Math.sin(i * 1.05) * 1.9, i * 1.05 + 3.14, i % 3 === 0, fr);
  // its hearers stand and sit round it on the open plot; one whose dealt place falls within 0.6 m of a house's or a hut's wall is left out
  // (the same numbers are drawn for him), so on no visit does a figure stand in a wall
  const inHouse = (x, z) => cast.houses.some(([x0, x1, z0, z1]) => x > x0 - 0.6 && x < x1 + 0.6 && z > z0 - 0.6 && z < z1 + 0.6);
  for (let i = 0; i < 14; i++) { const a = fr.range(0, 6.28), r = fr.range(5.2, 8.5), px = -22 + Math.cos(a) * r, pz = -33 + Math.sin(a) * r; person(inHouse(px, pz) ? fairScrap : g, px, 3, pz, a + 3.14, fr.chance(0.25), fr); }
  await ctx.yield();
  // a round kiosk under a striped cone north of the paving: two at its hatch and three standing by in a knot (nobody waits in a file)
  const ky = groundY(-25, -13.5);
  g.at(-25, ky, -13.5).move(); things.push([-25, -13.5, 2.6]); shadow(g, -25, -13.5, 3.6, 3.6, 3.4, 0, 1);
  g.turn(0, 0, 0, [[1.5, 0], [1.5, 2.3]], (i, j) => (j % 2 ? red : white), 12); g.turn(0, 2.3, 0, [[2.2, 0], [2.0, 0.25], [0.05, 1.5]], (i, j) => (j % 2 ? white : red), 12); g.ball(0, 3.95, 0, 0.2, 0.2, 0.2, gold, 6, 3);
  for (const [ox, oz, ry] of [[2.0, -0.35, 3.14], [2.05, 0.45, 3.14], [3.9, 1.6, -1.87], [3.2, 2.35, 0.36], [4.1, 2.5, 2.38]]) person(g, -25 + ox, groundY(-25 + ox, -13.5 + oz), -13.5 + oz, ry, false, fr);
  // round beds of flowers in stone kerbs along the high street
  const petals = ['#C8432B', '#E8B03A', '#F4FBF7', '#D06A9A', '#E87A3A'].map((h) => C(h, 0.9));
  for (const [bx, bz] of [[-54, -8.5], [-45, -8.5], [-36, -8.5], [-54, 8.5], [-47.5, 18], [-36, 18.2], [-52, -17], [-40, -17.5]]) {
    g.at(bx, 3, bz).move(); things.push([bx, bz, 2.2]);
    g.turn(0, 0, 0, [[1.7, 0], [1.7, 0.4], [1.45, 0.42], [1.4, 0.3]], stone, 12); g.turn(0, 0.3, 0, [[1.4, 0], [0.02, 0.25]], green, 12);
    for (let k = 0; k < 16; k++) { const a = fr.range(0, 6.28), r = 1.2 * Math.sqrt(fr()); g.ball(Math.cos(a) * r, 0.52 + 0.1 * fr(), Math.sin(a) * r, 0.2, 0.15, 0.2, fr.pick(petals), 5, 3); }
  }
  await ctx.yield();
  // benches under the house fronts, turned to the street, and the town taking the air: pairs and knots of people standing about
  for (let i = 0; i < 8; i++) {
    const sd = i % 2 ? 1 : -1, bx = -56 + Math.floor(i / 2) * 7.5 + (sd > 0 ? 3 : 0), bz = sd * 19.2; if (sd < 0 && bx > -34) continue;
    g.at(bx, 3, bz, sd > 0 ? Math.PI : 0).move(); things.push([bx, bz, 1.3]); shadow(g, bx, bz, 1.8, 0.6, 1.0);
    g.box(0, 0.45, 0, 1.8, 0.08, 0.5, wood); g.box(0, 0.75, -0.25, 1.8, 0.5, 0.06, wood); for (const lx of [-0.8, 0.8]) g.box(lx, 0.22, 0, 0.08, 0.44, 0.5, iron);
    for (const k of [-0.45, 0.45]) if (fr.chance(0.7)) person(g, bx + k, 3, bz, sd > 0 ? -1.57 : 1.57, true, fr);
  }
  g.at().move();
  await ctx.yield();
  // a roundabout of painted horses under a striped canopy, south of the paving (a mesh of its own: it turns)
  const rb = cast.roundabout = new S.Geo();
  rb.turn(0, 0, 0, [[4.0, 0], [4.0, 0.35], [0.02, 0.35]], C('#B89868', 0.8), 14); rb.turn(0, 0.35, 0, [[0.5, 0], [0.5, 4.2]], (i, j) => (j % 2 ? red : white), 8);
  rb.turn(0, 4.2, 0, [[4.3, 0], [4.3, 0.5], [1.4, 1.6], [0.1, 2.2]], (i, j) => (i === 0 ? gold : j % 2 ? red : white), 14); rb.ball(0, 6.55, 0, 0.25, 0.25, 0.25, gold, 6, 3);
  for (let k = 0; k < 10; k++) {
    const a = k / 10 * 6.2832, r = k % 2 ? 3.2 : 2.3, hx = Math.cos(a) * r, hz = Math.sin(a) * r, hy = 1.25 + 0.3 * Math.sin(k * 2.4), col = k % 3 === 0 ? white : k % 3 === 1 ? C('#D9A85A', 0.9) : C('#5A4030', 0.9);
    rb.bar([hx, 0.35, hz], [hx, 4.3, hz], 0.035, 0.035, gold, 4);
    rb.at(hx, hy, hz, -a - 1.5708).ball(0, 0, 0, 0.62, 0.3, 0.24, col, 6, 3); rb.ball(0.6, 0.38, 0, 0.26, 0.2, 0.16, col, 5, 3); for (const lx of [-0.35, 0.35]) rb.bar([lx, -0.1, 0], [lx + 0.12, -0.7, 0], 0.07, 0.05, col, 4);
    if (k % 2) person(rb, hx, hy - 0.45, hz, -a - 1.5708, true, fr);
    rb.at();
  }
  shadow(g, -39, 13, 8.4, 8.4, 5.2, 4.4, 1);
  await ctx.yield();
  things.push([-39, 13, 5.2], [-29, 4.1, 5.6], [-31.5, 7.3, 2.4], [-20, 5.5, 0.8], [-20, -5.5, 0.8], [-12.5, 18.5, 1.2], [-12.5, -18.5, 1.2]);   // the roundabout, the bus and its stop, the lamps, the flag masts
  const free = (x, z, r) => !things.some(([tx, tz, tr]) => Math.hypot(x - tx, z - tz) < tr + r);
  // (the knots are dealt by a stream of their own: their count follows the quality tier's detail, and the kites dealt after them do not shift with it)
  const kn = ctx.core.makeRng(ctx.core.hashSeed('promenade-knots:' + ctx.seed));
  for (let i = 0, n = Math.round(34 * ctx.quality.detail); i < n; i++) {
    const x = kn.range(-58, -15), z = kn.range(-19, 19) * (kn.chance(0.3) ? 0.3 : 1), a = kn.range(0, 6.28), knot = 1 + Math.floor(kn() * 3), ok = free(x, z, 1.2) && (x < -30.5 || Math.abs(z) < 6.2);
    for (let k = 0; k < knot; k++) { const px = x + Math.cos(a + k * 2.1) * 0.55, pz = z + Math.sin(a + k * 2.1) * 0.55; person(ok ? g : fairScrap, px, groundY(px, pz), pz, a + k * 2.1 + 3.14, false, kn); }
    if (i % 8 === 7) await ctx.yield();
  }
  await ctx.yield();
  // lines of pennants across the high street from pole to pole, well under the roofs' ridges
  for (const lx of [-44, -30]) {
    const y0 = groundY(lx, 17.6), top = 3 + 6.6 - y0;
    for (const sd of [-1, 1]) { g.at(lx, y0, sd * 17.6).move(); g.bar([0, 0, 0], [0, top, 0], 0.1, 0.06, white, 5); g.ball(0, top + 0.12, 0, 0.16, 0.16, 0.16, gold, 5, 3); }
    g.at(lx, 0, 0);
    for (let k = 1; k < 59; k++) { const f = k / 59, pz = -17.6 + 35.2 * f, py = 9.6 - 1.7 * 4 * f * (1 - f); g.move(0, 0, 3, 0, (qx, qy) => (qy < py - 0.1 ? 1.2 : 0)); g.tri([0, py, pz - 0.26], [0, py, pz + 0.26], [0, py - 0.62, pz], SHIRTS[k % 5]); }
    g.move(); for (let k = 0; k < 12; k++) { const f0 = k / 12, f1 = (k + 1) / 12, yy = (f) => 9.6 - 1.7 * 4 * f * (1 - f); g.bar([0, yy(f0), -17.6 + 35.2 * f0], [0, yy(f1), -17.6 + 35.2 * f1], 0.025, 0.025, white, 4); }
  }
  g.at().move();
  await ctx.yield();
  // KITES: flown from the high street's edges and from both beaches; each stands down the breeze (north-east) of its flyer,
  // weaves about its station on its string and streams a long tail of bows
  const wx = 0.83, wz = -0.55;
  const stations = [[-27, 27.5, -24.5, 1], [-24, 29.5, 9, 1], [10, 19, -25.5, 0], [24, 27, -45, 0], [15, 23, -55, 0], [8, 18, 24.5, 0], [26, 28, 34, 0], [16, 22.5, 47, 0]];
  for (const [sx, sy, sz, town] of stations) {
    const kx = sx + fr.range(-2, 2), ky = sy + fr.range(-1, 1), kz = sz + (sz > 0 ? fr.range(0, 2.5) : -fr.range(0, 2.5)), size = fr.range(1.25, 1.6) * (town ? 1.3 : 1.15);
    const fx = town ? (kz < 0 ? kx - 7 : -35.5) : -fr.range(2.5, 5), fz = town ? (kz < 0 ? -18.7 : 7) : kz + fr.range(2, 4), fy = groundY(fx, fz);   // (a flyer in the town stands on a clear flag of the street's edge)
    person(g, fx, fy, fz, Math.atan2(-(kz - fz), kx - fx), false, fr);
    const a = fr.pick(SHIRTS), b = fr.chance(0.5) ? white : fr.pick(SHIRTS), hand = [fx + 0.3, fy + 1.45, fz];
    g.at().move(kx, kz, 6, 0, (px, py) => Math.min(1, Math.max(0, (py - hand[1]) / (ky - hand[1]))));
    for (let k = 0; k < 8; k++) { const f0 = k / 8, f1 = (k + 1) / 8, pt = (f) => [hand[0] + (kx - hand[0]) * f + 1.6 * wx * 4 * f * (1 - f), hand[1] + (ky - hand[1]) * f - 1.2 * 4 * f * (1 - f) * (1 - f), hand[2] + (kz - hand[2]) * f]; g.bar(pt(f0), pt(f1), 0.035, 0.035, white, 4); }
    // the sail: a diamond leaning back on the breeze, two colours; then the tail
    const n = [-wx * 0.8, 0.6, -wz * 0.8], up = [wx * 0.6, 0.8, wz * 0.6], sdv = [-wz, 0, wx], P = (u, v) => [kx + up[0] * u + sdv[0] * v, ky + up[1] * u + sdv[1] * v, kz + up[2] * u + sdv[2] * v];
    g.move(kx, kz, 6, 1);
    g.tri(P(1.5 * size, 0), P(0.35 * size, -1.15 * size), P(0.35 * size, 0), a, n, n, n); g.tri(P(1.5 * size, 0), P(0.35 * size, 0), P(0.35 * size, 1.15 * size), b, n, n, n);
    g.tri(P(-1.9 * size, 0), P(0.35 * size, 0), P(0.35 * size, -1.15 * size), b, n, n, n); g.tri(P(-1.9 * size, 0), P(0.35 * size, 1.15 * size), P(0.35 * size, 0), a, n, n, n);
    const foot = P(-1.9 * size, 0), tl = town ? fr.range(5.5, 6.5) : fr.range(8, 11), T = (q) => [foot[0] + wx * 0.72 * q, foot[1] - 0.5 * q - 0.012 * q * q, foot[2] + wz * 0.72 * q];
    for (let q = 0; q < tl; q += 0.9) {
      g.move(kx, kz, 6, 0, () => 1 + q);
      const t0 = T(q), t1 = T(q + 0.9), tm = T(q + 0.45); g.quad([t0[0], t0[1] + 0.07, t0[2]], [t0[0], t0[1] - 0.07, t0[2]], [t1[0], t1[1] - 0.07, t1[2]], [t1[0], t1[1] + 0.07, t1[2]], white);
      g.tri([tm[0], tm[1], tm[2]], [tm[0] + 0.1, tm[1] + 0.42, tm[2] + 0.3], [tm[0] - 0.1, tm[1] + 0.42, tm[2] - 0.3], q % 1.8 < 0.9 ? a : b); g.tri([tm[0], tm[1], tm[2]], [tm[0] + 0.1, tm[1] - 0.42, tm[2] - 0.3], [tm[0] - 0.1, tm[1] - 0.42, tm[2] + 0.3], q % 1.8 < 0.9 ? a : b);
    }
    g.move();
    await ctx.yield();
  }
  g.at().move();
}

// the seal reef's rock: it stands wholly in the water behind the north face, its foot 3 m behind the face's plane, its crown
// a humped dome (reefCrown), its backs dry, its low rim awash at the crests. Its flank is rock in section: six ledges and steps from the sand to the tide line, clefts cut back into it.
// reefY0 is its plain mound (the plan by which everything near it was dealt); reefY is the rock as it stands, never outside that mound's foot
function reefY0(x, z) {
  const r = Math.hypot((x - 875) / 30, (z + 35) / 12);
  return -bedD(x) + (bedD(x) + 1.8) * sstep(1.0, 0.45, r);
}
const REEF_CLEFTS = [[848.5, 1.3, 0.10], [856, 0.9, 0.16], [864.5, 1.5, 0.12], [871, 0.8, 0.18], [879.5, 1.2, 0.14], [887, 1.6, 0.11], [894.5, 0.9, 0.17], [901, 1.2, 0.10]];   // each cleft: its x, half its width, how far it is cut back (a share of the mound's reach)
// the crown's own height over the level, by its law: a humped dome, low and broken at its rim (about 0.4 to 1.7 m), its backs to 2.2 m
// in the middle, no level line anywhere. The skin as drawn adds its own roughness (tenths of a metre), and the swell's crests
// (to 0.8 m there) wash over the low rim: only the backs are dry. (The ledges under the sea's reach, by which the reef's kelp
// and its small life were dealt, are as they were.)
function reefCrown(x, z, r) {
  const dome = sstep(0.5, 0.12, r);
  return 1.0 + 1.5 * dome * (0.8 + 0.3 * Math.sin(x * 0.19 + 1.1)) + 0.38 * Math.sin(x * 0.23 + 0.7) * Math.cos(z * 0.31 + x * 0.05) + 0.24 * Math.sin(x * 0.61 + z * 0.4 + 2.0);
}
function reefForm(x, z, out) {
  const r = Math.hypot((x - 875) / 30, (z + 35) / 12), flank = sstep(0.5, 0.62, r);
  let cleft = 0; for (const [cx, w, d] of REEF_CLEFTS) cleft = Math.max(cleft, d * Math.pow(Math.max(0, 1 - Math.abs(x - cx + 0.5 * Math.sin(z * 0.9 + cx)) / w), 0.8));
  const rr = r + (cleft + 0.035 * (1 + Math.sin(x * 0.83 + z * 0.61) * Math.sin(x * 0.29 - z * 0.47))) * flank;
  const s = sstep(1.0, 0.45, rr), t = s * 6 + (0.4 * Math.sin(x * 0.21 + 1.3) + 0.22 * Math.sin(x * 0.53 + z * 0.2)) * 4 * s * (1 - s), k = Math.floor(t), f = t - k;
  out.t = t; out.f = f; out.cleft = cleft * flank;
  out.y = -bedD(x) + (bedD(x) + 1.8) * Math.min(1, Math.max(0, (k + 0.1 * f + 0.9 * sstep(0.68, 0.96, f)) / 6));
  out.y += (reefCrown(x, z, r) - 1.8) * (k >= 6 ? 1 : k === 5 ? sstep(0.55, 0.98, f) : 0);
  return out;
}
const _rf = { y: 0, t: 0, f: 0, cleft: 0 };
function reefY(x, z) { return reefForm(x, z, _rf).y; }
// a place on the reef's flank at x: going in from the face, the first that stands on ledge number `level`, `frac` of the way across its tread
function reefLedge(x, level, frac) {
  for (let z = -22.9; z > -34; z -= 0.05) if (reefForm(x, z, _rf).t >= level + frac) return [z, _rf.y];
  return null;
}
// the breakwater's toe under the sea: tumbled stone heaped against the wall on both hands from 0.6 m behind each face's plane
// outward, its crest 3 m under the level, falling to the bed 24 m east and west of the wall's middle
const MOLE = { x: 790, half: 2.6, reach: 72 };
function moleY(x, z) {
  const az = Math.abs(z), dx = Math.abs(x - MOLE.x);
  if (az < HALF + 0.5 || dx > 24) return -1e3;
  return -bedD(x) + (bedD(x) - 3.0) * sstep(24, 3.2, dx) * sstep(HALF + 0.6, HALF + 5, az);
}
async function buildStone(ctx, cast, o) {
  const rng = ctx.rng, bed = o.bed, g = new S.Geo(), ms = cast.masonry = new S.Geo(), rk = cast.rock = new S.Geo();
  g.shade = cast.shade;
  const pale = C('#D8D0BC', 0.82), pale2 = C('#C4BBA6', 0.82), white = C('#F4FBF7', 0.85), red = C('#C8432B', 0.85), wood = C('#8A6A42', 0.8);
  // THE BREAKWATER across the slot 790 m out: pale stone, three open arches, the sea lapping both its ends
  const bx0 = 787.4, bx1 = 792.6, crest = 2, by = bed(790) - 0.3, spring = -8.5, crown = -2.5, rad = crown - spring, tier = -2.05, slab = 1.15;
  for (const [z0, z1] of [[-MOLE.reach, -19.3], [-7.3, -6.0], [6.0, 7.3], [19.3, MOLE.reach]]) ms.box(790, (by + spring) / 2, (z0 + z1) / 2, bx1 - bx0, spring - by, z1 - z0, pale, pale2);
  for (const [z0, z1] of [[-MOLE.reach, -19.3], [19.3, MOLE.reach]]) ms.box(790, (spring + crest) / 2, (z0 + z1) / 2, bx1 - bx0, crest - spring, z1 - z0, pale, pale2);
  for (const zc of [-13.3, 0, 13.3]) {
    const n = 12, pts = []; for (let k = 0; k <= n; k++) { const a = Math.PI * k / n; pts.push([zc - Math.cos(a) * 6.0, spring + Math.sin(a) * rad]); }
    for (let k = 0; k < n; k++) {
      const [za, ya] = pts[k], [zb, yb] = pts[k + 1];
      ms.quad([bx1, ya, za], [bx1, yb, zb], [bx1, tier, zb], [bx1, tier, za], pale); ms.quad([bx0, yb, zb], [bx0, ya, za], [bx0, tier, za], [bx0, tier, zb], pale);
      ms.quad([bx0, ya, za], [bx0, yb, zb], [bx1, yb, zb], [bx1, ya, za], pale2);
    }
    ms.quad([bx0, tier, zc - 6.65], [bx0, tier, zc + 6.65], [bx1, tier, zc + 6.65], [bx1, tier, zc - 6.65], pale2);
    for (const e of [-6.65, 6.0]) { ms.quad([bx1, spring, zc + e], [bx1, spring, zc + e + 0.65], [bx1, tier, zc + e + 0.65], [bx1, tier, zc + e], pale); ms.quad([bx0, spring, zc + e + 0.65], [bx0, spring, zc + e], [bx0, tier, zc + e], [bx0, tier, zc + e + 0.65], pale); }
  }
  // the arcade: a slab under the walk, two rows of short stout columns under it on the great arches' backs, open to the light
  ms.box(790, (slab + crest) / 2, 0, bx1 - bx0, crest - slab, 38.6, pale, pale2);
  for (let z = -18; z <= 18.01; z += 3) for (const px of [bx0 + 0.45, bx1 - 0.45]) { ms.box(px, (tier + slab) / 2, z, 0.62, slab - tier, 0.62, pale); ms.box(px, slab - 0.14, z, 0.9, 0.28, 0.9, pale2); ms.box(px, tier + 0.12, z, 0.9, 0.24, 0.9, pale2); }
  // the breakwater's own shadow lies on the street under it, a little north of its foot
  { const sh = cast.shade, ox = sh.off[0], oz = sh.off[1], yb = by + 0.36, hm = 21, put = (x, z, u, v) => sh._vert(x, yb, z, 0, 1, 0, [u, v, 0]);
    const zs = Math.min(19.5, HALF + oz * hm), xa = bx0 - 0.7 + ox * hm, xb = bx1 + 0.7 + ox * hm;
    put(xa, zs, 0, 0.3); put(xb, zs, 1, 0.3); put(xb, -19.5, 1, 0.7); put(xa, zs, 0, 0.3); put(xb, -19.5, 1, 0.7); put(xa, -19.5, 0, 0.7); }
  await ctx.yield();
  // the crest is a walk between two low parapets, each pierced every few metres to let the spray drain
  // (each length of parapet: a plinth course, a sunk panel in either face, a coping stone that oversails it)
  const panel = C('#B3AA94', 0.8), cope = C('#E2DBC8', 0.84);
  for (let z = -69; z <= 69; z += 3) for (const px of [bx0 + 0.2, bx1 - 0.2]) { ms.box(px, crest + 0.355, z, 0.4, 0.71, 2.5, pale, pale2); ms.box(px, crest + 0.1, z, 0.47, 0.2, 2.56, pale2); ms.box(px, crest + 0.42, z, 0.42, 0.34, 1.9, panel); ms.box(px, crest + 0.78, z, 0.54, 0.14, 2.62, cope, cope); }
  // a string course under the coping, and a cutwater on each face of the two middle piers
  ms.box(790, crest - 0.45, 0, bx1 - bx0 + 0.5, 0.3, 2 * MOLE.reach, pale2);
  // each end is a round head standing out of the open sea, a small banded beacon on it
  for (const sd of [-1, 1]) { ms.turn(790, 0, sd * MOLE.reach, [[5.2, by], [4.6, -3], [4.4, crest], [4.6, crest + 0.1], [4.6, crest + 0.5], [0.02, crest + 0.5]], pale, 14); ms.turn(790, crest + 0.5, sd * MOLE.reach, [[0.7, 0], [0.55, 1.5], [0.5, 3.0], [0.75, 3.1], [0.75, 3.3], [0.02, 4.2]], (i) => (i === 1 ? (sd > 0 ? red : C('#2F6B4A', 0.85)) : white), 8); }
  // the toe of tumbled stone under the sea on both hands, out past where sight ends
  { const xs = [], zs = []; for (let x = MOLE.x - 25; x <= MOLE.x + 25.01; x += 1.25) xs.push(x); for (let z = HALF + 0.5; z <= HALF + 37.01; z += 1.25) zs.push(z);
    const lump = (x, z) => { const y = moleY(x, z), up = sstep(0, 2.5, y + bedD(x)); return y + up * (1.2 * (o.noise.fbm2(x * 0.19 + 40, z * 0.19, 3) - 0.1) + 0.45 * o.noise.n2(x * 0.8, z * 0.8)); };
    for (const sd of [-1, 1]) { rk.skin(xs.map((x) => zs.map((z) => [x, lump(x, sd * z), sd * z])), C('#5A564C', 0.9), false, sd > 0); await ctx.yield(); } }
  cast.weed.push([779, 26.8, 2.6, 9], [801, 26.8, 2.6, 9], [777, -27, 2.4, 8]);       // kelp rooted on the toe's slopes
  for (const zc of [-6.65, 6.65]) for (const sd of [-1, 1]) { const xf = sd > 0 ? bx1 : bx0; ms.quad([xf, by, zc - 0.65], [xf + sd * 1.3, by, zc], [xf + sd * 1.3, spring, zc], [xf, spring, zc - 0.65], pale); ms.quad([xf + sd * 1.3, by, zc], [xf, by, zc + 0.65], [xf, spring, zc + 0.65], [xf + sd * 1.3, spring, zc], pale2); ms.tri([xf, spring, zc - 0.65], [xf + sd * 1.3, spring, zc], [xf, spring, zc + 0.65], pale2); }
  const shadeGeo = g.shade; g.shade = null;                                             // (their shadows would fall on the water)
  for (const [az, sd] of [[-25, 1], [-30.5, -1], [-36, 1], [24.5, -1], [30, 1], [36.5, -1]]) {
    person(g, 790 + sd * 1.9, crest, az, sd > 0 ? 0 : Math.PI, true, rng);
    g.at().move(); g.bar([790 + sd * 2.2, crest + 1.0, az], [790 + sd * 6.0, crest + 3.4, az], 0.035, 0.02, C('#5A4A32', 0.9), 4);
    g.rope([790 + sd * 6.0, crest + 3.4, az], [790 + sd * 6.6, -2.2, az], C('#E8E2D2', 0.9), 0.03, 0.5, 5); g.ball(790 + sd * 6.6, -0.05, az, 0.12, 0.16, 0.12, C('#C8432B', 1), 5, 3);
  }
  for (const lz of [-30, -13.3, 13.3, 30]) { g.at(790.9, crest, lz).move(); g.bar([0, 0, 0], [0, 2.5, 0], 0.08, 0.05, C('#27504A', 0.9), 5); g.ball(0, 2.7, 0, 0.2, 0.2, 0.2, white, 6, 4); g.at().move(); }
  const crestRng = ctx.core.makeRng(ctx.core.hashSeed('crest:' + ctx.seed));
  // a line of pennants from lamp to lamp along the walk's east side, and parasols where the town takes its tea on the breakwater
  for (let k = 0; k < 96; k++) {
    const z = -29.7 + k * 0.625, span = z < -13.3 ? (z + 30) / 16.7 : z < 13.3 ? (z + 13.3) / 26.6 : (z - 13.3) / 16.7, y = crest + 2.45 - 1.5 * span * (1 - span) * (z < -13.3 || z > 13.3 ? 1 : 1.6);
    // (thin cloth: the sun comes through it, so a pennant is as bright from one side as from the other: it is lit as if it faced the sun)
    g.at(790.9, y, z).move(0, 0, 3, 0, (px, py) => (py < -0.1 ? 1.2 : 0)); g.tri([0, 0, -0.24], [0, 0, 0.24], [0, -0.62, 0], BUNTING[k % 5], SUNWARD, SUNWARD, SUNWARD);
  }
  g.at().move();
  await ctx.yield();
  for (const pz of [-34, -26.5, -16.5, 3.5, 17, 27.5, 35]) { parasol(g, 789.6, crest, pz, crestRng, 1.35); person(g, 790.5, crest, pz + 0.5, crestRng.range(0, 6.28), true, crestRng); }
  for (let i = 0; i < 16; i++) {                                                      // the town on its breakwater: standing at the parapet, sitting on it, looking down into the street
    const z = -37 + i * 4.9 + crestRng.range(-1.2, 1.2), sd = crestRng.chance(0.5) ? 1 : -1, sit = crestRng.chance(0.35), two = crestRng.chance(0.5);
    if (Math.abs(z) > 21 && i % 2) continue;                                          // (the anglers' reaches)
    person(g, 790 + sd * (sit ? 2.2 : 1.55), crest + (sit ? 0.42 : 0), z, sd > 0 ? 0 : Math.PI, sit, crestRng);
    if (two) person(g, 790 + sd * 1.5, crest, z + 0.8, (sd > 0 ? 0 : Math.PI) + crestRng.range(-0.5, 0.5), false, crestRng);
  }
  g.shade = shadeGeo;
  cast.looks.push({ 0: 754, 1: -10, 2: -23.4, until: [742, -24.6] });                 // the yawl's chain down the north face, from over the lip, until the lens is abeam of her mooring
  cast.looks.push({ 0: MOLE.x, 2: 0, aim: [834, -19, -15], lead: 55, weight: 0.5 });   // the street beyond the breakwater at the north face's foot, seen over its crest and through its arches; it lets go 20 m of route before the lens is over the crest, as every fixed look lets go 20 m before the lens is abeam of its thing
  await ctx.yield();
  // THE SEAL REEF in the north face: rock from the sand to the surface, seals hauled out on the backs of its crown (its low rim is awash at the crests)
  // (its skin is cut fine where the flank faces the cut, and every facet is flat: stone, not dough. A cleft and the back of a ledge are darker.)
  const xs = [], zs = []; for (let x = 842; x <= 908.01; x += 0.6) xs.push(x); for (let z = -49; z < -31.1; z += 1.5) zs.push(z); for (let z = -31; z <= -20.99; z += 0.2) zs.push(z);
  const rockC = C('#A69D8A', 0.85), form = { y: 0, t: 0, f: 0, cleft: 0 }, rpts = [], rdim = [];
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i], row = [], drow = [];
    for (const z of zs) {
      reefForm(x, z, form);
      const up = sstep(0, 3, form.y + bedD(x)) * sstep(2.2, 0.6, form.y);
      row.push([x, form.t < 0.02 ? -bedD(x) - 0.5 : form.y + up * (0.55 * (o.noise.fbm2(x * 0.16, z * 0.16, 3) - 0.1) + 0.22 * o.noise.n2(x * 0.7, z * 0.7)), z]);
      // a tread lies open to the light, its lip worn pale; its back and the riser over it are in the ledge's own shade; a cleft is dark
      const tread = 1 - sstep(0.62, 0.72, form.f), top = form.t > 5.97 ? 1 : 0;
      drow.push(top ? 1.1 : (1 - Math.min(0.66, 3.8 * form.cleft)) * (0.62 + 0.62 * tread) * (1 - 0.5 * sstep(0.3, 0.62, form.f) * tread) * (1 + 0.3 * (1 - sstep(0, 0.12, form.f))));
    }
    rpts.push(row); rdim.push(drow);
    if (i % 40 === 39) await ctx.yield();
  }
  await ctx.yield();
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < zs.length - 1; j++) {
      const a = rpts[i][j], b = rpts[i + 1][j], c = rpts[i + 1][j + 1], d = rpts[i][j + 1], k1 = (rdim[i][j] + rdim[i + 1][j] + rdim[i + 1][j + 1]) / 3, k2 = (rdim[i][j] + rdim[i][j + 1] + rdim[i + 1][j + 1]) / 3;
      rk.tri(a, c, b, [rockC[0] * k1, rockC[1] * k1, rockC[2] * k1]); rk.tri(a, d, c, [rockC[0] * k2, rockC[1] * k2, rockC[2] * k2]);
    }
    if (i % 22 === 21) await ctx.yield();
  }
  await ctx.yield();
  // six seals hauled out on the crown's dry backs
  for (let i = 0; i < 5; i++) rng.range(-0.5, 0.5);                                 // (the five draws the first seals took: every later deal stands)
  // the rock AS DRAWN under a place: the height of this very skin's facet over (x, z) (a cell's two facets meet along its a to c edge)
  const rockAt = (x, z) => {
    let i = Math.min(xs.length - 2, Math.max(0, Math.floor((x - xs[0]) / 0.6))), j = 0;
    while (i < xs.length - 2 && xs[i + 1] <= x) i++; while (i > 0 && xs[i] > x) i--; while (j < zs.length - 2 && zs[j + 1] <= z) j++;
    const u = Math.min(1, Math.max(0, (x - xs[i]) / (xs[i + 1] - xs[i]))), v = Math.min(1, Math.max(0, (z - zs[j]) / (zs[j + 1] - zs[j])));
    const a = rpts[i][j][1], b = rpts[i + 1][j][1], c = rpts[i + 1][j + 1][1], d = rpts[i][j + 1][1];
    return u >= v ? a + (b - a) * u + (c - b) * v : a + (d - a) * v + (c - d) * u;
  };
  // each lies as a seal lies hauled out, on the crown's backs, this way and that: its belly on the rock as drawn (its height and its
  // pitch are read from the skin under it, so on no seed does it hover or sink), its fore end and its hind flippers lifted, a fore
  // flipper out at each side, rooted in its shoulder, its tip on the rock where a flipper can reach it. Its fore end moves by its own
  // law (kind 12, in the part): for something under half of every 13 to 22 seconds it lifts its head and looks round, slowly; the
  // third waves the fore flipper of its seaward side (toward the cut).
  const SEALS = [[874.2, -35.4, 2.2, 3.0, 0, 1.0], [870.2, -34.4, -0.75, 3.3, 1, 0.5], [873.0, -31.4, 2.45, 2.5, 2, 0.8], [886.2, -35.4, -1.3, 3.1, 3, 1.1], [883.2, -32.6, 2.0, 2.4, 0, 0.3], [878.4, -35.4, -0.55, 2.9, 1, 0.9]];   // x, z, heading, length (m), coat, how high it holds its fore end
  const coats = [[C('#6E7272', 0.9), C('#BDB5A2', 0.9)], [C('#7C6A54', 0.9), C('#C9B796', 0.9)], [C('#8C8F8C', 0.9), C('#D2CCBC', 0.9)], [C('#5C5A56', 0.9), C('#A39A88', 0.9)]];
  // how far the belly's line is lifted at the share s of its length (0 the hind end, 1 the nose): the hind end a little, the fore end as it is held
  const lifted = (s, L, held) => L * (0.12 * Math.pow(Math.max(0, 1 - s / 0.3), 1.5) + (0.14 + 0.2 * held) * sstep(0.5, 0.92, s));
  SEALS.forEach(([x, z, yaw, L, coat, held], n) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), QS = [-0.42, -0.3, -0.18, -0.08, 0.02, 0.14, 0.26, 0.38];
    const place = (lx, lz) => [x + cy * lx + sy * lz, z - sy * lx + cy * lz];              // a point of its own plan, on the reef's
    // the rock under its belly at eight stations along it (at each the highest of three across); its pitch is the rock's own slope
    // along it (12 degrees at most), and it is let down until its belly's line meets the rock
    const under = QS.map((q) => Math.max(...[-0.1, 0, 0.1].map((e) => rockAt(...place(q * L, e * L)))));
    const qm = QS.reduce((t, q) => t + q, 0) / QS.length, um = under.reduce((t, u) => t + u, 0) / QS.length;
    const slope = QS.reduce((t, q, k) => t + (q - qm) * (under[k] - um), 0) / QS.reduce((t, q) => t + (q - qm) * (q - qm), 0) / L;
    const pitch = Math.max(-0.21, Math.min(0.21, Math.atan(slope))), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const y = Math.max(...QS.map((q, k) => under[k] - q * L * sp - lifted(q + 0.48, L, held) * cp)) - 0.03;
    const px = x + cy * L * 0.07, pz = z - sy * L * 0.07, fore = (lx) => Math.min(1, Math.max(0, (lx / L - 0.07) / 0.45));
    g.at(x, y, z, yaw, pitch).move(px, pz, 12, 0, (lx) => fore(lx));
    // its body by stations from its hind end to its nose: thickest at the chest, a neck, a round head, a short blunt muzzle (dark only at
    // its tip); a small last ring closes each end
    const SS = [-0.012, 0, 0.08, 0.18, 0.3, 0.42, 0.54, 0.64, 0.74, 0.82, 0.9, 0.96, 1.0, 1.012], RR = [0.004, 0.035, 0.06, 0.1, 0.145, 0.18, 0.2, 0.2, 0.165, 0.115, 0.108, 0.088, 0.03, 0.004];
    const [back, belly] = coats[coat], R = SS.length - 1, N = 8, rows = [], hs = (q) => Math.abs(Math.sin(q * 12.9898 + n * 7.31) * 43758.5453) % 1;
    for (let i = 0; i <= R; i++) {
      const s = SS[i], r = L * RR[i], mid = L * RR[i === 0 ? 1 : i === R ? R - 1 : i] * 0.92, up = lifted(s, L, held), row = [];
      for (let j = 0; j < N; j++) { const th = j / N * 6.2832; row.push([(s - 0.48) * L, up + mid + Math.cos(th) * r * 0.92, Math.sin(th) * r * 1.18]); }
      rows.push(row);
    }
    g.skin(rows, (i, j) => { const top = Math.cos((j + 0.5) / N * 6.2832), spot = hs(i * 9 + j) > 0.7 ? 0.72 : 1, m = sstep(-0.25, 0.5, top); return i >= R - 2 ? C('#2E2C2A', 0.9) : [0, 1, 2].map((q) => (belly[q] * (1 - m) + back[q] * m * spot)); }, true, true);
    const ty = L * 0.12 + L * 0.03, tx = -0.48 * L;
    // a flipper is one flat fin, wound so that its face is the side that looks up (a lifted hind flipper stands nearly on edge)
    const fin = (a, b, c) => { const up = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]) >= 0; g.tri(a, up ? b : c, up ? c : b, back); };
    for (const sd of [-1, 1]) {
      g.move(px, pz, 12, 0);
      fin([tx + 0.05, ty, sd * 0.03], [tx - 0.13 * L, ty + 0.07 * L, sd * 0.07 * L], [tx - 0.12 * L, ty - 0.02 * L, sd * 0.02 * L]);                    // a hind flipper, lifted
      const fx = 0.1 * L, fz = sd * L * 0.19, wave = n === 2 && sd < 0;                                                                              // (the third seal waves the fore flipper of its seaward side)
      // a fore flipper, out at its side: its fore root is carried up with the lifted chest (it stays inside the flank); its tip lies on
      // the rock as drawn under it where it can reach: no lower than 0.08 and no higher than 0.1 of its length from the belly's own
      // line (where the rock lies beyond that, the tip is held there and does not touch)
      const tipY = Math.max(-0.08 * L, Math.min(0.1 * L, (rockAt(...place(fx - 0.02 * L, fz * 1.75)) - y - (fx - 0.02 * L) * sp) / cp + 0.02));
      g.move(px, pz, 12, 0, wave ? (lx, ly, lz) => -Math.min(1, Math.max(0, (Math.abs(lz) - Math.abs(fz) * 0.95) / (Math.abs(fz) * 0.8))) : null);
      fin([fx + 0.08 * L, 0.1 * L + lifted(fx / L + 0.56, L, held), fz * 0.9], [fx - 0.02 * L, tipY, fz * 1.75], [fx - 0.12 * L, 0.08 * L, fz * 0.95]);
    }
  });
  g.at().move();
  cast.looks.push({ 0: 872, 1: 0.5, 2: -29, lead: 70, weight: 0.5 });
  cast.weed.push([875, -35, 0, 230]);                                                  // the reef's kelp wall (rooted on the rock)
  // what holds to the reef's ledges under the tide: anemones, starfish, urchins, beds of mussels (a stream of their own deals them),
  // and a loose shoal of small fish passing before the rock
  const life = ctx.core.makeRng(ctx.core.hashSeed('reef-life:' + ctx.seed));
  const anemC = ['#F0562A', '#F2A0B0', '#F4E9D0', '#E83E5A', '#F0A030'].map((h) => C(h, 1.0)), starC = ['#F28A22', '#E2452E', '#C0529A', '#F2C040'].map((h) => C(h, 1.0)), urchC = ['#6A3288', '#8A3252', '#4A3470'].map((h) => C(h, 1.0)), shellC = ['#232A40', '#2E3852', '#181E2E'].map((h) => C(h, 1.0));
  for (let i = 0; i < 76; i++) {
    const x = 846 + 58 * (i + life()) / 76, spot = reefLedge(x, life.int(0, 4), life.range(0.16, 0.5)), kind = i % 4, sz = life.range(1.0, 1.6), a0 = life.range(0, 6.28), many = 1 + life.int(0, 2);
    if (!spot || spot[1] > -1.0) continue;
    const z = spot[0], y = spot[1] - 0.04;
    for (let m = 0; m < (kind === 1 ? 1 : many); m++) {
      const ox = m ? life.range(-0.7, 0.7) : 0, s1 = sz * (m ? 0.75 : 1), px = x + ox, col = life.pick(kind === 0 ? anemC : kind === 1 ? starC : urchC);
      g.at(px, y, z + (m ? life.range(-0.2, 0.2) : 0), a0 + m).move();
      if (kind === 0) {                                                               // an anemone: a short column, its crown of arms stirring
        g.turn(0, 0, 0, [[0.14 * s1, 0], [0.18 * s1, 0.22 * s1], [0.1 * s1, 0.28 * s1]], col, 6);
        g.move(px, z, 2, 0, (qx, qy) => Math.max(0, qy - 0.25 * s1) * 1.5);
        for (let k = 0; k < 9; k++) { const a = k * 0.698, ca = Math.cos(a), sa = Math.sin(a); g.tri([ca * 0.1 * s1 + sa * 0.05 * s1, 0.26 * s1, sa * 0.1 * s1 - ca * 0.05 * s1], [ca * 0.1 * s1 - sa * 0.05 * s1, 0.26 * s1, sa * 0.1 * s1 + ca * 0.05 * s1], [ca * 0.42 * s1, 0.5 * s1, sa * 0.42 * s1], k % 2 ? col : C('#F4E9D0', 1)); }
      } else if (kind === 1) {                                                        // a starfish lying on the ledge
        const cen = [0, 0.09 * s1, 0];
        for (let k = 0; k < 5; k++) { const a = k * 1.2566, P = (an, r, hh) => [Math.cos(an) * r * s1, hh, Math.sin(an) * r * s1], tip = P(a, 0.5, 0.03); g.tri(cen, tip, P(a - 0.63, 0.15, 0.04), col); g.tri(cen, P(a + 0.63, 0.15, 0.04), tip, col); }
      } else if (kind === 2) {                                                        // an urchin: a dark ball of spines
        g.ball(0, 0.15 * s1, 0, 0.2 * s1, 0.16 * s1, 0.2 * s1, col, 6, 3);
        for (let k = 0; k < 8; k++) { const a = k * 0.785 + 0.3, up = k % 2 ? 0.34 : 0.2, ca = Math.cos(a), sa = Math.sin(a); g.tri([ca * 0.15 * s1 + sa * 0.04, 0.2 * s1, sa * 0.15 * s1 - ca * 0.04], [ca * 0.15 * s1 - sa * 0.04, 0.2 * s1, sa * 0.15 * s1 + ca * 0.04], [ca * 0.4 * s1, up * s1, sa * 0.4 * s1], col); }
      } else break;
    }
    if (kind === 3) for (let k = 0, n = 9 + life.int(0, 5); k < n; k++) {             // a bed of mussels, shell by shell
      const mx = x + life.range(-0.6, 0.6), mz = z + life.range(-0.22, 0.22);
      g.at(mx, y + 0.03, mz, life.range(0, 6.28), life.range(0.3, 1.1)).move(); g.ball(0, 0.05, 0, 0.16, 0.08, 0.08, life.pick(shellC), 4, 2);
    }
    if (i % 20 === 19) await ctx.yield();
  }
  g.at().move();
  cast.shoals.push({ c: [876, -7.5, -24.3], r: [15, 3.5, 1.2], n: 240, period: 34 });   // (z -25.5 .. -23.1 with their own length: 2.8 m and more behind the face's plane)
  await ctx.yield();
  // THE STAND: a parked bus and a tea stall of eight parasols on the causeway's north side, under the keeper. (The parasols' near row
  // stands at z -6.4: its rim comes no nearer the paving than z -4.78, and a cyclist on the lane at 4.1 reaches z -4.25; the cloth's
  // flap moves the rim up and down and along the street, not toward the lane)
  g.at(672, bed(672), -7.5).move(); bus(g); shadow(g, 672, -7.5, 9, 2.5, 3.2);
  for (let i = 0; i < 8; i++) { const x = 684 + (i % 4) * 4.2, z = -9.8 + (i > 3 ? 3.4 : 0); parasol(g, x, bed(x), z, rng, 1.7); person(g, x + 0.8, bed(x), z + 0.3, rng.range(0, 6.28), true, rng); person(g, x - 0.7, bed(x), z - 0.4, rng.range(0, 6.28), true, rng); }
  stall(g, 703, bed(703), -8, 0, rng);
  for (let i = 0; i < 6; i++) person(g, 664 + rng.range(-2, 16), bed(670), -10.4 - rng.range(0, 1.2), rng.range(0, 6.28), false, rng);
  await ctx.yield();
  // a tea garden on the sand south of the paving, over against the seal reef: twelve big parasols, deckchairs, a stall
  for (let i = 0; i < 12; i++) { const x = 850 + (i % 6) * 4.6, z = 9.2 + Math.floor(i / 6) * 3.7, y = bed(x); parasol(g, x, y, z, rng, 1.75); cast.stands.push([x, z, 1.8]); person(g, x + 0.8, y, z + 0.3, rng.range(0, 6.28), true, rng); if (i % 3) person(g, x - 0.8, y, z - 0.3, rng.range(0, 6.28), true, rng); deckchair(g, x + 0.2, y, z + 1.5, 1.57, i % 2 ? red : white); }
  stall(g, 879.5, bed(879.5), 11, 1.57, rng); cast.stands.push([879.5, 11, 2.4]);
  await ctx.yield();
  // cafe tables at the wreck's dry bow
  for (let i = 0; i < 7; i++) { const x = 505 + (i % 4) * 3.4 + rng.range(-0.4, 0.4), z = -9.2 - Math.floor(i / 4) * 3.0, y = bed(x); g.at(x, y, z).move(); g.turn(0, 0, 0, [[0.06, 0], [0.06, 0.72], [0.5, 0.74], [0.5, 0.78]], white, 8); parasol(g, x, y, z, rng, 1.25); person(g, x + 0.75, y, z, 3.14, true, rng); if (i % 2) person(g, x - 0.75, y, z, 0, true, rng); }
  await ctx.yield();
  // THE FACES' FEET, all the way out: the town sits down by its sea here as on any beach. Every 26 m or so of either foot
  // a parasol with deckchairs, a bench turned to the street, or a heap of wet rocks with someone at its pool
  const taken = (x, sd) => x < 165 || (x > 776 && x < 804) || (sd > 0 ? (x > 165 && x < 300) || (x > 322 && x < 440) || (x > 844 && x < 885) : (x > 498 && x < 524));
  for (let i = 0; i < 66; i++) {
    const sd = i % 2 ? 1 : -1, x = 120 + i * 13 + rng.range(-3, 3), z = sd * rng.range(14.9, 17.0), y = bed(x), kind = rng.int(0, 2), col = rng.pick(SHIRTS);
    if (taken(x, sd)) continue;
    if (kind === 0) {
      parasol(g, x, y, z, rng, 1.5); cast.stands.push([x, z - sd * 0.9, 1.5]);
      for (const k of [-1, 1]) { deckchair(g, x + k * 1.0, y, z - sd * 0.9, -sd * 1.57 + k * 0.25, k > 0 ? col : white); shadow(g, x + k * 1.0, z - sd * 0.9, 0.7, 0.9, 0.9); if (rng.chance(0.75)) person(g, x + k * 1.0, y - 0.18, z - sd * 0.8, -sd * 1.57 + 3.14, true, rng); }
    } else if (kind === 1) {
      g.at(x, y, z, sd > 0 ? Math.PI : 0).move(); g.box(0, 0.45, 0, 2.2, 0.08, 0.5, wood); g.box(0, 0.78, -0.25, 2.2, 0.5, 0.06, wood); for (const lx of [-0.95, 0.95]) g.box(lx, 0.22, 0, 0.08, 0.44, 0.5, C('#3A3F44', 0.9)); g.at().move();
      shadow(g, x, z, 2.2, 0.6, 1.0); cast.stands.push([x, z, 1.2]);
      for (const k of [-0.6, 0.1, 0.75]) if (rng.chance(0.7)) person(g, x + k, y, z, sd > 0 ? -1.57 : 1.57, true, rng);
    } else {
      for (let k = 0; k < 4; k++) { const r = rng.range(0.35, 0.95), bz = sd * (19.4 - r * 1.9 - rng.range(0, 1.2)), bx = x + rng.range(-2.6, 2.6); boulder(g, bx, bed(bx) - 0.08, bz, r, rng); shadow(g, bx, bz, r * 2, r * 1.6, r * 0.9, 0, 1); cast.stands.push([bx, bz, r * 1.3]); }
      person(g, x + rng.range(-1, 1), y, z, rng.range(0, 6.28), false, rng); person(g, x + rng.range(1.2, 2.4), y, z - sd * 0.6, rng.range(0, 6.28), rng.chance(0.5), rng);
    }
    if (i % 10 === 9) await ctx.yield();
  }
  await ctx.yield();
  // people about the street: sitting on the sand, standing at the causeway's edge (nobody walks the slot in a body). Each is dealt a
  // place by a stream of its own; one whose place falls inside a thing that stands there (the wreck's bow, a pier, the STAND, a
  // stall, a tent, a boulder, a bench) is left out
  const folk = ctx.core.makeRng(ctx.core.hashSeed('street-folk:' + ctx.seed)), scrap = new S.Geo();
  const boxes = [[506, 533, -20, -6.5], [785.2, 794.8, -7.9, -5.4], [785.2, 794.8, 5.4, 7.9], [658, 718, -12.2, -5.6], [328, 331 + (o.marketDay ? 16 : 9) * 6.2, 14.2, 18.8], [318, 398, 6.2, 10.6],
    [901.8, 919.8, 6.4, 13.4], [919, 936, -10.9, -6.4], [885, 902.5, -13.3, -7.2], [891, 896.2, 8.8, 12]];   // (the last four: the bandstand and its deckchairs, the stalls, the tea tables and the children's game of the street's last reach)
  cast.folk = [];
  const inThing = (x, z) => boxes.some(([x0, x1, z0, z1]) => x > x0 && x < x1 && z > z0 && z < z1) || cast.stands.some(([sx, sz, r]) => Math.hypot(x - sx, z - sz) < r + 0.45);
  for (let i = 0, n = Math.round(46 * o.density * ctx.quality.detail); i < n; i++) {
    const x = folk.range(70, 948), sd = folk.chance(0.5) ? 1 : -1, z = sd * folk.range(5.8, 17), ry = folk.range(0, 6.28), sit = folk.chance(0.6), out = inThing(x, z);
    person(out ? scrap : g, x, groundY(x, z), z, ry, sit, folk);
    if (!out) cast.folk.push([x, z]);
  }
  await ctx.yield();
  // THE ISLAND: the landing step at the slot's end, stairs up the rock, the lighthouse 30 m above
  const ly = bed(992) + 1.0;
  ms.box(993, ly - 1.5, 0, 15, 3, 2 * HALF - 1, pale, pale2);
  // three flights of stairs cut up the rock's wall from the landing to the island's top, a post at every landing
  const climb = islandY(1010, 0, o.noise) - ly, nStep = Math.round(climb / 0.6);
  for (let k = 0; k < nStep; k++) {
    const f = k / nStep, flight = Math.floor(f * 3), t = f * 3 - flight, z = (flight % 2 ? 1 : -1) * (13 - 26 * t) * 0.8, x = 1000.4 + 7.2 * f;
    ms.box(x + 0.9, ly + f * climb, z, 3.0, 0.4, 1.5, k % 2 ? pale : pale2);
    if (k % 6 === 0) g.bar([x - 0.4, ly + f * climb, z], [x - 0.4, ly + f * climb + 1.2, z], 0.07, 0.07, white, 4);
  }
  // the landing's gate: two stone pillars on the landing's edge at the head of the street, 17 m apart, a ball on each and a burgee over it.
  // (No way on foot is laid through it: the landing stands a metre over the street and its low sea wall runs unbroken behind the pillars)
  for (const gz of [-15.5, 1.5]) {
    for (let k = 0; k < 4; k++) ms.box(986.4, ly + 0.7 + 1.65 * k + 0.825, gz, 1.2, 1.65, 1.2, k % 2 ? red : white);                // banded like the light above them
    ms.box(986.4, ly + 0.35, gz, 1.7, 0.7, 1.7, pale2); ms.box(986.4, ly + 7.45, gz, 1.6, 0.3, 1.6, pale2);
    ms.ball(986.4, ly + 8.1, gz, 0.5, 0.5, 0.5, white, 8, 5);
    g.at(986.4, ly + 8.4, gz).move(); g.bar([0, 0, 0], [0, 2.6, 0], 0.05, 0.04, white, 4); g.move(0, 0, 3, 1); for (let k = 0; k < 4; k++) g.quad([0.05 + k * 0.4, 2.55 - k * 0.06, 0], [0.05 + k * 0.4, 1.85 + k * 0.06, 0], [0.45 + k * 0.4, 1.91 + k * 0.06, 0], [0.45 + k * 0.4, 2.49 - k * 0.06, 0], k % 2 ? white : red); g.at().move();
  }
  ms.box(987.2, ly + 0.5, 0, 0.5, 1.0, 2 * HALF - 6, pale2, pale);                        // the landing's low sea wall, unbroken from side to side
  stall(g, 996, ly, 12, 1.57, rng); parasol(g, 994, ly, -12, rng, 1.6); parasol(g, 990.5, ly, -15, rng, 1.6);
  for (let i = 0; i < 16; i++) person(g, 989 + rng.range(0, 9), ly, rng.range(-17, 17), rng.range(0, 6.28), rng.chance(0.3), rng);
  const iy = islandY(1062, 0, o.noise) - 0.6;
  // the lighthouse: a banded tower on a stone plinth, a railed gallery, the lantern's glazing and its cap
  ms.at(1062, iy, 0);
  ms.turn(0, -1.5, 0, [[5.4, 0], [5.4, 2.2], [4.5, 2.4]], pale2, 16);
  ms.turn(0, 0.9, 0, [[4.2, 0], [3.75, 4.6], [3.4, 9.2], [3.05, 13.8], [2.75, 18.4], [2.5, 23.0], [3.3, 23.5], [3.3, 23.9]], (i) => (i === 1 || i === 3 ? red : white), 18);
  for (let k = 0; k < 14; k++) { const a = k / 14 * 6.2832; ms.bar([Math.cos(a) * 3.25, 24.8, Math.sin(a) * 3.25], [Math.cos(a) * 3.25, 25.9, Math.sin(a) * 3.25], 0.05, 0.05, C('#27404E', 1), 4); }
  ms.turn(0, 25.85, 0, [[3.3, 0], [3.3, 0.1]], C('#27404E', 1), 14);
  ms.turn(0, 24.8, 0, [[2.0, 0], [2.0, 3.0]], C('#BFE0EE', 1.0), 12); ms.turn(0, 27.8, 0, [[2.4, 0], [2.2, 0.5], [0.12, 2.1], [0.1, 3.0]], red, 12);
  for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832; ms.bar([Math.cos(a) * 2.02, 24.8, Math.sin(a) * 2.02], [Math.cos(a) * 2.02, 27.8, Math.sin(a) * 2.02], 0.07, 0.07, C('#27404E', 1), 4); }
  for (const [wy, wa] of [[5, 3.3], [10.5, 2.6], [16, 3.5], [20.5, 2.9]]) { const r = 4.2 - wy * 0.075 + 0.04; ms.at(1062 + Math.cos(wa) * r, iy + wy, Math.sin(wa) * r, -wa); ms.box(0, 0, 0, 0.12, 1.3, 0.7, C('#27404E', 1)); }
  ms.at(1062 - 4.25, iy + 2.0, 0); ms.box(0, 0, 0, 0.2, 2.2, 1.2, C('#27504A', 0.9));
  // the keeper's cottage beside it, a pitched roof and a chimney
  ms.at(1052, islandY(1052, 12, o.noise), 12);
  ms.box(0, 1.6, 0, 7, 3.2, 5, white);
  ms.quad([-3.8, 3.2, 2.8], [3.8, 3.2, 2.8], [3.8, 5.0, 0], [-3.8, 5.0, 0], red); ms.quad([3.8, 3.2, -2.8], [-3.8, 3.2, -2.8], [-3.8, 5.0, 0], [3.8, 5.0, 0], red);
  ms.tri([-3.5, 3.2, 2.5], [-3.5, 5.0, 0], [-3.5, 3.2, -2.5], white); ms.tri([3.5, 3.2, -2.5], [3.5, 5.0, 0], [3.5, 3.2, 2.5], white);
  ms.box(2.2, 5.0, 0.8, 0.7, 1.6, 0.7, pale2);
  for (const wx of [-2.2, 0, 2.2]) ms.box(-3.52, 1.7, wx * 0.8, 0.06, 1.0, 0.8, C('#27404E', 1));
  ms.at();
  cast.looks.push([1004, -4, 6]);
  cast.stone = g;
}

// ---- the bathing beach's own life in the two faces beside the ramp, from the waterline out to 10 m of water: every thing of
// it stands or floats BEHIND a face's plane (abs z 21 and more with its whole reach) and is cut by the face: legs under, bodies over ----
// a plain bather of height 1.75 k standing on (x, y, z); up: both arms raised, waving a little
function bather(g, x, y, z, ry, k, rng, up = false) {
  const suit = rng.pick(SHIRTS), skin = rng.pick(SKINS), h = 0.9 * k;
  g.at(x, y, z, ry).move();
  g.ball(0, h + 0.33 * k, 0, 0.2 * k, 0.36 * k, 0.14 * k, rng.chance(0.5) ? suit : skin, 6, 4); g.ball(0, h + 0.83 * k, 0, 0.12 * k, 0.13 * k, 0.12 * k, skin, 6, 3);
  g.ball(-0.02 * k, h + 0.88 * k, 0, 0.125 * k, 0.1 * k, 0.125 * k, rng.pick(HAIR), 6, 3);
  for (const s of [-1, 1]) {
    if (up) { g.move(0, 0, 3, 0, (px, py) => Math.max(0, py - (h + 0.6 * k)) * 2.2); g.bar([0, h + 0.56 * k, s * 0.2 * k], [0.12 * k, h + 1.05 * k, s * 0.34 * k], 0.055 * k, 0.045 * k, skin, 4); g.move(); }
    else g.bar([0, h + 0.56 * k, s * 0.2 * k], [0.08 * k, h + 0.1 * k, s * 0.27 * k], 0.055 * k, 0.045 * k, skin, 4);
    g.bar([0, h + 0.02, s * 0.09 * k], [0, 0.45 * k, s * 0.1 * k], 0.09 * k, 0.075 * k, suit, 4); g.bar([0, 0.45 * k, s * 0.1 * k], [0, 0.02, s * 0.11 * k], 0.065 * k, 0.055 * k, skin, 4);
  }
  g.at().move();
}
// a swimmer going round the place (cx, cz) at R metres from it, one round in per seconds (its sign the way round): head up, body along the sea's top, legs trailing under it
function swimmer(g, cx, cz, R, per, rng) {
  const suit = rng.pick(SHIRTS), skin = rng.pick(SKINS);
  g.at(cx + R, 0, cz, per > 0 ? 1.5708 : -1.5708).move(cx, cz, 7, per);
  g.ball(0.55, 0.08, 0, 0.13, 0.14, 0.13, skin, 6, 3); g.ball(0.52, 0.14, 0, 0.13, 0.09, 0.13, rng.pick(HAIR), 6, 3);
  g.ball(0, -0.16, 0, 0.42, 0.15, 0.2, suit, 6, 4);
  for (const s of [-1, 1]) {
    g.bar([0.3, -0.12, s * 0.2], [0.75, -0.2, s * 0.5], 0.05, 0.045, skin, 4);
    g.bar([-0.38, -0.2, s * 0.1], [-0.85, -0.36, s * 0.24], 0.085, 0.07, skin, 4); g.bar([-0.85, -0.36, s * 0.24], [-1.25, -0.3, s * 0.2], 0.065, 0.05, skin, 4);
  }
  g.at().move();
}
// a dog swimming round and round: its head held up out of the water, its legs paddling under it
function dogSwim(g, cx, cz, R, per) {
  const coat = C('#8A5A32', 0.85), dark = C('#3A2A1E', 0.9);
  g.at(cx + R, 0, cz, per > 0 ? 1.5708 : -1.5708).move(cx, cz, 7, per);
  g.ball(0, -0.17, 0, 0.42, 0.16, 0.15, coat, 6, 4); g.ball(0.48, 0.08, 0, 0.17, 0.13, 0.12, coat, 6, 3); g.ball(0.66, 0.05, 0, 0.1, 0.07, 0.07, dark, 5, 3);
  for (const s of [-1, 1]) { g.tri([0.42, 0.17, s * 0.08], [0.36, 0.02, s * 0.2], [0.5, 0.1, s * 0.1], dark); for (const lx of [0.25, -0.25]) g.bar([lx, -0.25, s * 0.1], [lx + 0.12, -0.62, s * 0.1], 0.045, 0.035, coat, 4); }
  g.bar([-0.4, -0.12, 0], [-0.72, 0.02, 0], 0.04, 0.02, coat, 4);
  g.at().move();
}
// an air bed riding the swell, someone lying on it propped on the elbows
function airBed(g, x, z, ry, rng) {
  const a = rng.pick(SHIRTS), b = C('#F4FBF7', 0.85), suit = rng.pick(SHIRTS), skin = rng.pick(SKINS);
  g.at(x, 0, z, ry).move(x, z, 1, 1);
  for (let k = 0; k < 5; k++) g.box(-0.76 + k * 0.38, 0.06, 0, 0.38, 0.17, 0.72, k % 2 ? a : b);
  g.box(0.96, 0.1, 0, 0.3, 0.24, 0.72, a);
  g.ball(-0.05, 0.27, 0, 0.42, 0.13, 0.19, suit, 6, 3); g.ball(0.52, 0.42, 0, 0.12, 0.13, 0.12, skin, 6, 3); g.ball(0.5, 0.48, 0, 0.125, 0.08, 0.125, rng.pick(HAIR), 6, 3);
  for (const s of [-1, 1]) { g.bar([-0.4, 0.24, s * 0.1], [-1.05, 0.2, s * 0.13], 0.07, 0.05, skin, 4); g.bar([0.3, 0.3, s * 0.2], [0.6, 0.18, s * 0.34], 0.05, 0.04, skin, 4); }
  g.at().move();
}
// a pedal boat: two floats whose bottoms show in the face, a deck across them, a striped canopy on four posts, two sitting in it
function pedalBoat(g, x, z, ry, rng) {
  const white = C('#F4FBF7', 0.85), col = C('#E8B03A', 0.9), bot = C('#2B4E5A', 0.9), post = C('#E8E2D2', 0.8);
  for (const s of [-1, 1]) { g.at(x + Math.sin(ry) * s * 0.62, 0, z + Math.cos(ry) * s * 0.62, ry).move(x, z, 1, 1); S.addHull(g, { L: 3.4, B: 0.62, free: 0.28, draft: 0.3, hull: col, bottom: bot, full: 0.5, n: 6, m: 5, deck: white }); }
  g.at(x, 0, z, ry).move(x, z, 1, 1);
  g.box(0, 0.36, 0, 2.3, 0.08, 1.75, white); g.box(-0.2, 0.52, 0, 0.6, 0.1, 1.5, col); g.box(-0.52, 0.8, 0, 0.1, 0.55, 1.5, col); g.box(0.78, 0.56, 0, 0.9, 0.42, 0.46, col);
  for (const px of [-0.9, 0.9]) for (const s of [-1, 1]) g.bar([px, 0.4, s * 0.8], [px, 1.72, s * 0.8], 0.03, 0.03, post, 4);
  for (let k = 0; k < 6; k++) g.quad([-1.05 + k * 0.35, 1.74, -0.9], [-1.05 + k * 0.35, 1.74, 0.9], [-0.7 + k * 0.35, 1.74, 0.9], [-0.7 + k * 0.35, 1.74, -0.9], k % 2 ? col : white);
  for (const s of [-1, 1]) {
    const suit = rng.pick(SHIRTS), skin = rng.pick(SKINS);
    g.ball(-0.25, 0.9, s * 0.4, 0.19, 0.34, 0.14, suit, 6, 4); g.ball(-0.25, 1.38, s * 0.4, 0.12, 0.13, 0.12, skin, 6, 3); g.ball(-0.27, 1.43, s * 0.4, 0.125, 0.1, 0.125, rng.pick(HAIR), 6, 3);
    g.bar([-0.2, 0.62, s * 0.4], [0.3, 0.62, s * 0.4], 0.08, 0.07, suit, 4); g.bar([0.3, 0.62, s * 0.4], [0.45, 0.42, s * 0.4], 0.065, 0.055, skin, 4);
  }
  g.at().move();
}
async function buildRampLife(ctx, cast, bed) {
  const rl = ctx.core.makeRng(ctx.core.hashSeed('ramp-life:' + ctx.seed)), g = cast.land, shade = g.shade;
  g.shade = null;                                                                     // (nothing here throws a shadow: it all stands in the water)
  const ballC = [C('#E2452E', 1), C('#F4FBF7', 0.9), C('#F2C040', 1)];
  for (const sd of [-1, 1]) {
    // children with a ball in the shallows: two throwing it to and fro along the lip, one more looking on
    const x0 = sd < 0 ? 8.6 : 9.6, zc = sd * 21.9;
    bather(g, x0, bed(x0), zc, 0, 0.72, rl, true); bather(g, x0 + 2.5, bed(x0 + 2.5), zc + sd * 0.2, Math.PI, 0.8, rl, true); bather(g, x0 + 1.0, bed(x0 + 1), zc + sd * 1.7, sd * 1.57, 0.66, rl, false);
    g.at(x0 + 1.25, bed(x0 + 1.25) + 1.75, zc + sd * 0.1).move(x0 + 1.25, zc + sd * 0.1, 8, 0.95);
    g.turn(0, 0, 0, [[0.02, -0.21], [0.15, -0.15], [0.21, 0], [0.15, 0.15], [0.02, 0.21]], (i, j) => ballC[j % 3], 9);
    g.at().move();
    // waders standing waist deep and chest deep, the sea's top lapping round them
    for (let i = 0; i < 6; i++) { const x = 11.5 + i * 1.7 + rl.range(-0.5, 0.5), z = sd * (21.5 + rl.range(0, 3.4)); bather(g, x, bed(x), z, rl.range(0, 6.28), rl.range(0.92, 1.06), rl, i % 3 === 1); }
    // stones on the bed under it all
    for (let i = 0; i < 9; i++) { const x = 14 + i * 13.5 + rl.range(-3, 3), r = rl.range(0.25, 0.5), z = sd * rl.range(22.3, 25.6); boulder(g, x, bed(x) - 0.06, z, r, rl); }
    await ctx.yield();
  }
  // a dog swimming, air beds, swimmers: each goes round its own place at the sea's top (north: all inside x 86; the day's boats lie beyond)
  dogSwim(g, 27, -23.5, 1.5, 8); dogSwim(g, 96, 23.6, 1.6, -9);
  airBed(g, 30, 22.6, 0.3, rl); airBed(g, 40, -22.8, 2.9, rl);
  swimmer(g, 46, -24.4, 2.0, -13, rl); swimmer(g, 82, -24.8, 2.3, 15, rl); swimmer(g, 74, 24.9, 2.4, -17, rl); swimmer(g, 118, 25.4, 3.0, 20, rl);
  // bathers out of their depth, treading water, their legs working under them
  const suits = [C('#C8432B', 0.8), C('#0B5A7A', 0.9), C('#F4FBF7', 0.8), C('#1E2226', 1), C('#D9A85A', 0.8), C('#2F6B4A', 0.8)];
  for (const [sd, list] of [[-1, [20.5, 33, 36.5, 52.5, 71, 75.5]], [1, [21, 25, 37, 41.5, 60, 64.5, 84, 88]]]) for (const x of list) S.addBather(g, x + rl.range(-0.6, 0.6), sd * (22.0 + rl.range(0, 2.0)), rl.range(0, 6.28), rl.pick(suits), rl.pick(SKINS));
  await ctx.yield();
  pedalBoat(cast.afloat, 52, 23.6, 0.15, rl);
  // small shoals over the stones
  for (const [x, z] of [[45, 24.6], [88, 24.8], [128, 25.0], [40, -24.6], [84, -24.8], [122, -25.0]]) { const d = bedD(x); cast.shoals.push({ c: [x, -0.58 * d, z], r: [5, 0.16 * d + 0.1, 1.5], n: 80, period: (x % 3 > 1 ? 1 : -1) * (15 + (x % 7)) }); }
  g.shade = shade;
}

// ---- THE ARRIVAL: the street's last reach, from the breakwater to the island, and the island's landing. All of it is dealt by a
// stream of its own. West of the landing nothing of it stands taller than 5.5 m over the street nor nearer the paving than abs z 6.4 ----
// a plain figure for a crowd, lighter than person(): k is its size (a child 0.62)
function figure(g, x, y, z, ry, sit, rng, k = 1) {
  shadow(g, x, z, 0.5 * k, 0.36 * k, (sit ? 1.3 : 1.75) * k);
  const shirt = rng.pick(SHIRTS), legs = rng.pick(SHIRTS), skin = rng.pick(SKINS), h = (sit ? 0.5 : 0.9) * k, hat = rng.chance(0.35);
  g.at(x, y, z, ry).move();
  g.ball(0, h + 0.33 * k, 0, 0.2 * k, 0.36 * k, 0.14 * k, shirt, 5, 3); g.ball(0, h + 0.83 * k, 0, 0.12 * k, 0.13 * k, 0.12 * k, skin, 5, 3);
  if (hat) g.turn(0, h + 0.9 * k, 0, [[0.27 * k, 0], [0.1 * k, 0.05 * k], [0.02, 0.15 * k]], C('#E8D8A8', 0.85), 6);
  else g.ball(-0.02 * k, h + 0.88 * k, 0, 0.125 * k, 0.1 * k, 0.125 * k, rng.pick(HAIR), 5, 2);
  for (const s of [-1, 1]) g.bar([0, h + 0.56 * k, s * 0.2 * k], [(sit ? 0.22 : 0.05) * k, h + 0.12 * k, s * 0.24 * k], 0.055 * k, 0.045 * k, s > 0 ? skin : shirt, 3);
  if (sit) for (const s of [-1, 1]) { g.bar([0, h, s * 0.1 * k], [0.42 * k, h, s * 0.1 * k], 0.08 * k, 0.07 * k, legs, 3); g.bar([0.42 * k, h, s * 0.1 * k], [0.44 * k, 0.02, s * 0.1 * k], 0.07 * k, 0.06 * k, skin, 3); }
  else for (const s of [-1, 1]) g.bar([0, h + 0.02, s * 0.09 * k], [0, 0.02, s * 0.11 * k], 0.09 * k, 0.06 * k, legs, 3);
  g.at().move();
}
const LEAVES = ['#2F6B2A', '#4A8A30', '#3A7A44', '#6A9A3A'].map((h) => C(h, 0.95)), PETALS = ['#E2452E', '#F2C040', '#F4FBF7', '#E06AA0', '#F08A3A'].map((h) => C(h, 1.0)), GROWN = [-0.3, 0.8, 0.3];
// a tub of flowers: an earthen pot, a mound of green, a few bright heads
function tub(g, x, y, z, rng, k = 1) {
  g.at(x, y, z).move();
  g.turn(0, 0, 0, [[0.24 * k, 0], [0.34 * k, 0.46 * k], [0.26 * k, 0.46 * k]], C('#B8643A', 0.85), 6); g.ball(0, 0.62 * k, 0, 0.38 * k, 0.26 * k, 0.38 * k, rng.pick(LEAVES), 5, 2);
  const pc = rng.pick(PETALS);
  for (let i = 0; i < 6; i++) {
    const a = i * 1.047 + 0.4, c = Math.cos(a) * 0.25 * k, s = Math.sin(a) * 0.25 * k;
    if (i % 2) g.tri([c, 0.78 * k, s - 0.09 * k], [c, 0.78 * k, s + 0.09 * k], [c - 0.05 * k, 0.97 * k, s], pc, SUNWARD, SUNWARD, SUNWARD);
    else g.tri([c - 0.09 * k, 0.86 * k, s - 0.05 * k], [c + 0.09 * k, 0.86 * k, s - 0.05 * k], [c, 0.88 * k, s + 0.1 * k], pc, SUNWARD, SUNWARD, SUNWARD);
  }
  g.at().move();
}
async function buildArrival(ctx, cast, bed, noise) {
  const ar = ctx.core.makeRng(ctx.core.hashSeed('arrival:' + ctx.seed)), g = cast.stone, ms = cast.masonry, af = cast.afloat, shadeGeo = g.shade, scrap = new S.Geo();
  const white = C('#F4FBF7', 0.85), red = C('#C8432B', 0.85), gold = C('#D9A85A', 0.9), stone = C('#CFC6B2', 0.8), pale = C('#D8D0BC', 0.82), pale2 = C('#C4BBA6', 0.82), wood = C('#8A6A42', 0.8), blue = C('#2A6FA8', 0.9), dk = C('#27404E', 1), green = C('#2F6B4A', 0.9), amber = C('#D9A040', 0.9);
  // what this reach now holds: [x0, x1, z0, z1]; a knot of people is left out where its place is not free
  const taken = [[901.8, 919.8, 6.4, 13.4], [919, 936, -10.9, -6.4], [885, 902.5, -13.3, -7.2], [975, 983, 6.6, 12.7]];
  const free = (x, z, r) => !taken.some(([x0, x1, z0, z1]) => x > x0 - r && x < x1 + r && z > z0 - r && z < z1 + r) && !cast.stands.some(([sx, sz, sr]) => Math.hypot(x - sx, z - sz) < sr + r) && !cast.folk.some(([fx, fz]) => Math.hypot(x - fx, z - fz) < r + 0.3);
  // a string of pennants from a to b, hanging by sag: thin cloth, lit as if it faced the sun
  const pennants = (a, b, sag, n) => {
    const pt = (f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f - sag * 4 * f * (1 - f), a[2] + (b[2] - a[2]) * f];
    const L = Math.hypot(b[0] - a[0], b[2] - a[2]), ux = (b[0] - a[0]) / L, uz = (b[2] - a[2]) / L;
    g.at().move(); for (let i = 0; i < 6; i++) g.bar(pt(i / 6), pt((i + 1) / 6), 0.015, 0.015, white, 3);
    for (let i = 0; i < n; i++) { const p = pt((i + 0.5) / n); g.at(p[0], p[1], p[2]).move(0, 0, 3, 0, (px, py) => (py < -0.1 ? 1.2 : 0)); g.tri([-ux * 0.24, 0, -uz * 0.24], [ux * 0.24, 0, uz * 0.24], [0, -0.62, 0], BUNTING[i % 5], SUNWARD, SUNWARD, SUNWARD); }
    g.at().move();
  };
  // A BAND on a small bandstand south of the paving, and the town in deckchairs before it
  { const bx = 916, bz = 10.2, by = bed(bx);
    shadow(g, bx, bz, 5.8, 5.8, 0.6, 0, 1); shadow(g, bx, bz, 6.4, 6.4, 3.4, 3.2, 1);
    g.at(bx, by, bz).move();
    g.turn(0, 0, 0, [[2.8, 0], [2.8, 0.6], [0.02, 0.6]], stone, 8);
    for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * 6.2832, a2 = (k + 1.5) / 8 * 6.2832, c = Math.cos(a) * 2.5, s = Math.sin(a) * 2.5; g.bar([c, 0.6, s], [c, 3.2, s], 0.07, 0.06, white, 4); if (k !== 3) g.bar([c, 1.4, s], [Math.cos(a2) * 2.5, 1.4, Math.sin(a2) * 2.5], 0.035, 0.035, blue, 3); }
    g.turn(0, 3.2, 0, [[3.2, 0], [3.0, 0.2], [0.9, 1.2], [0.3, 1.45], [0.06, 1.9]], (i) => (i === 0 ? white : red), 8); g.ball(0, 5.2, 0, 0.2, 0.2, 0.2, gold, 5, 3);
    g.shade = null;
    for (let i = 0; i < 6; i++) {                                                       // the band sits in an arc, turned to the deckchairs
      const a = -1.25 + i * 0.5, px = bx + Math.cos(a) * 1.55, pz = bz + Math.sin(a) * 1.55; figure(g, px, by + 0.6, pz, Math.PI, true, ar);
      g.at(px, by + 0.6, pz, Math.PI).move();
      if (i % 3 === 0) g.bar([0.2, 1.0, 0], [0.34, 1.75, 0], 0.05, 0.2, gold, 5);       // a bass horn, its bell up
      else if (i % 3 === 1) g.bar([0.16, 1.28, 0], [0.7, 1.22, 0], 0.025, 0.11, gold, 5);   // a cornet
      else g.turn(0.45, 0.55, 0, [[0.26, 0], [0.26, 0.3], [0.02, 0.3]], white, 7);      // a drum
    }
    figure(g, bx - 1.5, by + 0.6, bz, 0, false, ar);                                    // the bandmaster, his stick beating
    g.at(bx - 1.5, by + 0.6, bz).move(0, 0, 3, 0, (px, py) => Math.max(0, py - 1.45) * 2.5); g.bar([0.05, 1.45, 0.2], [0.4, 1.95, 0.3], 0.045, 0.03, white, 3); g.bar([0.4, 1.95, 0.3], [0.62, 2.2, 0.3], 0.012, 0.012, white, 3);
    g.at().move(); g.shade = shadeGeo;
    const stripes = [red, blue, white, gold];
    for (let i = 0; i < 15; i++) {
      const row = Math.floor(i / 5), cx = 904.6 + row * 2.2, cz = 7.0 + (i % 5) * 1.35 + (row % 2) * 0.35, cy = bed(cx);
      deckchair(g, cx, cy, cz, 0, stripes[(i * 3 + row) % 4]); shadow(g, cx, cz, 0.9, 0.7, 0.9);
      if (ar.chance(0.78)) figure(g, cx, cy - 0.18, cz, 0, true, ar, ar.chance(0.2) ? 0.62 : 1);
    }
    // more of its hearers stand behind the deckchairs, in two small knots, turned to the band (nobody stands in a rank or a file)
    for (const [hx, hz] of [[902.8, 8.3], [902.9, 11.9]]) {
      const a0 = ar.range(0, 6.28);
      for (let i = 0; i < 3; i++) { const a = a0 + i * 2.094 + ar.range(-0.3, 0.3), r = ar.range(0.45, 0.6); figure(g, hx + Math.cos(a) * r, bed(hx), hz + Math.sin(a) * r, ar.range(-0.5, 0.5), false, ar, i === 2 && hz < 10 ? 0.62 : 1); }
    }
  }
  await ctx.yield();
  // three STALLS north of the paving, their keepers behind them and the town at their counters: one, two or three at each, where
  // each happens to stand (0.64 m and more apart along the counter, anywhere in 0.75 m of depth before it, turned to it more or less)
  for (const sx of [921, 927.5, 934]) {
    const sy = bed(sx); stall(g, sx, sy, -8.9, 0, ar);
    figure(g, sx + ar.range(-0.6, 0.6), sy, -10.5, -1.5708, false, ar);
    for (let k = 0, n = ar.int(1, 3); k < n; k++) figure(g, sx - 1.2 + (k + ar.range(0.4, 0.6)) * 2.4 / n, sy, -7.45 + ar.range(0, 0.75), 1.5708 + ar.range(-0.6, 0.6), false, ar, k && ar.chance(0.4) ? 0.62 : 1);
  }
  // TEA at six round tables under parasols, north of the paving over against the reef's east end
  for (let i = 0; i < 6; i++) {
    const row = Math.floor(i / 3), x = 887 + (i % 3) * 5.2 + row * 2.6, z = -8.7 - row * 3.1, y = bed(x);
    g.at(x, y, z).move(); g.turn(0, 0, 0, [[0.06, 0], [0.06, 0.72], [0.5, 0.74], [0.5, 0.78]], white, 7); parasol(g, x, y, z, ar, 1.3);
    figure(g, x + 0.8, y, z, 3.1416, true, ar); if (i % 3 !== 1) figure(g, x - 0.8, y, z, 0, true, ar); if (i === 4) figure(g, x, y, z + 0.85, 1.5708, true, ar, 0.62);
  }
  await ctx.yield();
  // A ROUND KIOSK by the south kerb near the street's end: two or three of the town at its counter, and a knot of five to seven
  // standing about it on the sand in no order. (Nobody stands in a file on this street and no posts mark a way along it:
  // the island is not come to on foot.)
  { const kx = 979, kz = 8.8, ky = bed(kx);
    g.at(kx, ky, kz).move(); shadow(g, kx, kz, 3.2, 3.2, 3.2, 0, 1);
    g.turn(0, 0, 0, [[1.25, 0], [1.25, 2.2]], (i, j) => (j % 2 ? blue : white), 10); g.turn(0, 2.2, 0, [[1.9, 0], [1.7, 0.22], [0.05, 1.3]], (i, j) => (j % 2 ? white : blue), 10); g.ball(0, 3.65, 0, 0.18, 0.18, 0.18, gold, 5, 3);
    g.box(-1.27, 1.45, 0, 0.06, 0.8, 0.9, dk);                                          // its hatch, to the west
    g.at().move();
    // at the counter: two abreast before the hatch and, sometimes, a third at their side, each turned to it
    const counter = [[-1.95, -0.48], [-1.9, 0.44], [-2.2, 1.3]];
    for (let i = 0, n = ar.int(2, 3); i < n; i++) { const px = kx + counter[i][0] + ar.range(-0.08, 0.08), pz = kz + counter[i][1] + ar.range(-0.08, 0.08); figure(g, px, bed(px), pz, Math.atan2(pz - kz, kx - 1.27 - px) + ar.range(-0.2, 0.2), false, ar, i === 2 && ar.chance(0.5) ? 0.62 : 1); }
    // the knot about it: on its east, south and south-west sides, 2.3 to 3.4 m from its middle (z 7.1 and more: clear of the paving
    // and of the lamp at (980, 5.5)), each turned to the kiosk or half away to a neighbour
    for (let i = 0, n = ar.int(5, 7), a0 = ar.range(-0.5, -0.25); i < n; i++) {
      const a = a0 + (i + ar.range(0.35, 0.65)) * 2.5 / n, r = i % 2 ? ar.range(2.95, 3.4) : ar.range(2.3, 2.7), px = kx + Math.cos(a) * r, pz = kz + Math.sin(a) * r;
      figure(g, px, bed(px), pz, Math.PI - a + ar.range(-0.9, 0.9), false, ar, ar.chance(0.2) ? 0.62 : 1);
    }
  }
  await ctx.yield();
  // CHILDREN at a ball, two throwing it to and fro and one looking on
  const ballC = [C('#E2452E', 1), C('#F4FBF7', 0.9), C('#F2C040', 1)];
  for (const [cx, cz] of [[893.6, 10.4], [952.5, -9.6]]) {
    const cy = bed(cx); taken.push([cx - 2.6, cx + 2.6, cz - 1.6, cz + 1.6]);
    figure(g, cx - 1.5, bed(cx - 1.5), cz, 0, false, ar, 0.62); figure(g, cx + 1.5, bed(cx + 1.5), cz, 3.1416, false, ar, 0.62); figure(g, cx + ar.range(-0.5, 0.5), cy, cz + 1.2, 1.5708, false, ar, 0.55);
    g.at(cx, cy + 0.75, cz).move(cx, cz, 8, 1.2); g.ball(0, 0, 0, 0.17, 0.17, 0.17, (i, j) => ballC[j % 3], 6, 4); g.at().move();
  }
  // KNOTS of people standing and talking on the sand either side
  for (const [kx0, kz0] of [[806, -9.5], [824, -11], [843, -8.6], [862, -11.2], [874, -8.8], [910, -10.8], [944, -10.4], [963, -9.2], [974, -11], [805, 9.2], [822, 11.2], [838, 8.8], [888, 8.2], [930, 9.4], [942, 11.6]]) {
    const kx = kx0 + ar.range(-1.5, 1.5), kz = kz0 + ar.range(-0.6, 0.6), n = ar.int(3, 4), a0 = ar.range(0, 6.28), into = free(kx, kz, 1.5) ? g : scrap;
    for (let i = 0; i < n; i++) { const a = a0 + i * 6.2832 / n + ar.range(-0.25, 0.25), r = ar.range(0.55, 0.85); figure(into, kx + Math.cos(a) * r, bed(kx), kz + Math.sin(a) * r, Math.PI - a, false, ar, ar.chance(0.18) ? 0.62 : 1); }
  }
  await ctx.yield();
  // pennants across the paving from lamp to lamp at the last three pairs of lamps
  for (const lx of [900, 940, 980]) pennants([lx, bed(lx) + 4.95, -5.4], [lx, bed(lx) + 4.95, 5.4], 0.5, 18);
  await ctx.yield();
  // THE LANDING AND THE ROCK OVER IT. (Nothing here throws a shade on the street: it all stands on the landing or on the rock.)
  g.shade = null;
  const ly = bed(992) + 1.0, climb = islandY(1010, 0, noise) - ly, nStep = Math.round(climb / 0.6);
  // where the rock's skin (its facets are 2.5 m long) comes up to the height y, at z
  const faceX = (y, z) => { let h0 = islandY(1000, z, noise); for (let x = 1000; x < 1015; x += 2.5) { const h1 = islandY(x + 2.5, z, noise); if (y <= h1) return x + 2.5 * Math.min(1, Math.max(0, (y - h0) / Math.max(h1 - h0, 1e-3))); h0 = h1; } return 1015; };
  const step = (k) => { const f = k / nStep, flight = Math.floor(f * 3), t = f * 3 - flight; return [1000.4 + 7.2 * f, ly + f * climb, (flight % 2 ? 1 : -1) * (13 - 26 * t) * 0.8, flight]; };
  // the stairs' open side is railed: white balusters, two rails painted blue
  g.at().move();
  for (let k = 0; k < nStep; k++) {
    const [x, y, z, fl] = step(k); if (k % 2 === 0) g.bar([x - 0.5, y + 0.2, z], [x - 0.5, y + 1.2, z], 0.035, 0.035, white, 3);
    if (k + 1 < nStep) { const [x1, y1, z1, fl1] = step(k + 1); if (fl1 === fl) for (const h of [1.2, 0.7]) g.bar([x - 0.5, y + h, z], [x1 - 0.5, y1 + h, z1], h > 1 ? 0.045 : 0.03, h > 1 ? 0.045 : 0.03, blue, 3); }
  }
  await ctx.yield();
  // WHITE COTTAGES on the rock: each a whitewashed box under a pitched roof, a painted door, a shuttered window, a chimney. Those on
  // the face stand on a bastion built out from it; those on the island's top stand on the turf
  const roofs = [red, C('#5A7488', 0.85), amber], doors = [blue, green, red, amber], cots = [], lime = C('#FFFBF0', 1.18);   // (limewash, fresh every spring)
  const cottage = (xf, y0, zc, w, i, hung) => {
    ms.at();
    if (hung) { cots.push([zc, y0, w]); ms.box(xf + 2.3, y0 - 0.8, zc, 6.0, 1.6, w + 1.2, pale2, pale); }
    ms.box(xf + 2.5, y0 + 1.3, zc, 5.0, 2.6, w, lime);
    const e = y0 + 2.5, r = y0 + 4.2, z0 = zc - w / 2 - 0.3, z1 = zc + w / 2 + 0.3, rc = roofs[i % 3], sg = i % 2 ? 1 : -1, dc = doors[i % 4], X = xf - 0.06;
    ms.quad([xf - 0.35, e, z1], [xf + 1.6, r, z1], [xf + 1.6, r, z0], [xf - 0.35, e, z0], rc); ms.quad([xf + 1.6, r, z1], [xf + 3.55, e, z1], [xf + 3.55, e, z0], [xf + 1.6, r, z0], rc);
    ms.tri([xf, y0 + 2.6, zc + w / 2], [xf + 3.2, y0 + 2.6, zc + w / 2], [xf + 1.6, r - 0.05, zc + w / 2], lime); ms.tri([xf, y0 + 2.6, zc - w / 2], [xf + 1.6, r - 0.05, zc - w / 2], [xf + 3.2, y0 + 2.6, zc - w / 2], lime);
    const pane = (zm, ym, ww, hh, col) => ms.quad([X, ym - hh / 2, zm + ww / 2], [X, ym + hh / 2, zm + ww / 2], [X, ym + hh / 2, zm - ww / 2], [X, ym - hh / 2, zm - ww / 2], col);
    pane(zc + sg * w * 0.27, y0 + 1.0, 0.9, 2.0, dc); pane(zc - sg * w * 0.2, y0 + 1.5, 1.1, 1.0, dk); for (const s of [-1, 1]) pane(zc - sg * w * 0.2 + s * 0.72, y0 + 1.5, 0.3, 1.1, dc);
    ms.box(xf + 1.6, y0 + 4.45, zc - sg * w * 0.3, 0.6, 1.0, 0.6, pale2, red);
    if (hung) for (const s of [-1, 1]) tub(g, xf - 0.35, y0, zc + s * (w / 2 + 0.25), ar);
    if (hung && i % 3 === 0) {                                                          // a line of washing before it, blowing
      const yl = y0 + 1.95, xl = xf - 0.5; g.at().move();
      for (const s of [-1, 1]) g.bar([xl, y0, zc + s * w * 0.46], [xl, yl + 0.1, zc + s * w * 0.46], 0.03, 0.03, white, 3);
      g.bar([xl, yl, zc - w * 0.46], [xl, yl, zc + w * 0.46], 0.012, 0.012, white, 3);
      for (let q = 0; q < 5; q++) { const zq = zc - w * 0.36 + q * w * 0.18, hh = 0.5 + 0.35 * ar(), col = ar.pick(BUNTING), a = [xl, yl, zq - 0.28], b = [xl, yl, zq + 0.28], c = [xl, yl - hh, zq + 0.28], d = [xl, yl - hh, zq - 0.28]; g.move(0, 0, 3, 0, (px, py) => (yl - py) * 1.6); g.tri(a, b, c, col, SUNWARD, SUNWARD, SUNWARD); g.tri(a, c, d, col, SUNWARD, SUNWARD, SUNWARD); }
      g.move();
    }
  };
  [[-15.6, 0.24, 5.4], [-15.4, 0.55, 5.6], [-15.6, 0.86, 5.2], [15.6, 0.38, 5.6], [15.5, 0.70, 5.4], [-5.5, 0.31, 5.0], [5.5, 0.62, 5.0]].forEach(([zc, f, w], i) => {
    const y0 = ly + f * climb; cottage(Math.min(faceX(y0 + 0.4, zc - w / 2), faceX(y0 + 0.4, zc), faceX(y0 + 0.4, zc + w / 2)) - 2.7, y0, zc, w, i, true);
  });
  [[1014.5, -8], [1017.5, 4], [1013.5, 18.5], [1022, -19], [1026, 11]].forEach(([cx, cz], i) => {
    cottage(cx - 2.5, Math.min(islandY(cx - 2.5, cz - 2.8, noise), islandY(cx - 2.5, cz + 2.8, noise), islandY(cx + 2.5, cz, noise)) - 0.2, cz, 5.2, i + 1, false);
  });
  await ctx.yield();
  // GREEN TERRACES: a ledge of stone every 3.1 m up the face, turf on it, bushes, what grows there hanging over its edge, flowers;
  // none where the stairs pass nor where a cottage stands
  const zStair = (y) => { const f = (y - ly) / climb; if (f <= 0 || f >= 1) return 99; const fl = Math.floor(f * 3), t = f * 3 - fl; return (fl % 2 ? 1 : -1) * (13 - 26 * t) * 0.8; };
  for (let j = 1; j <= 8; j++) {
    const y = ly + 3.1 * j, zs = zStair(y);
    for (let z = -18; z <= 18.01; z += 2.4) {
      const xr = faceX(y, z); if (xr > 1008.6) continue;
      if (Math.abs(z - zs) < 3.6 || cots.some(([zc, y0, w]) => Math.abs(z - zc) < w / 2 + 2.0 && y > y0 - 2.2 && y < y0 + 4.8)) continue;
      ms.at().box(xr - 0.15, y - 0.22, z, 1.5, 0.45, 2.4, pale2, LEAVES[(j + Math.round(z + 18)) % 4]);
      for (let q = 0; q < 2; q++) g.ball(xr - 0.45 + ar.range(-0.2, 0.2), y + 0.28, z + (q - 0.5) * 1.2 + ar.range(-0.3, 0.3), 0.5, ar.range(0.32, 0.55), 0.6, ar.pick(LEAVES), 5, 2);
      for (let q = 0; q < 3; q++) { const zq = z + ar.range(-1.05, 1.05), len = ar.range(0.5, 1.5), xe = xr - 0.92; g.tri([xe, y - 0.1, zq - 0.3], [xe, y - 0.1, zq + 0.3], [xe - 0.03, y - 0.1 - len, zq + ar.range(-0.15, 0.15)], ar.pick(LEAVES), GROWN, GROWN, GROWN); }
      for (let q = 0; q < 2; q++) { const zq = z + ar.range(-1.0, 1.0), xe = xr - 0.7; g.tri([xe, y + 0.3, zq - 0.14], [xe, y + 0.3, zq + 0.14], [xe - 0.06, y + 0.55, zq], ar.pick(PETALS), SUNWARD, SUNWARD, SUNWARD); }
    }
    await ctx.yield();
  }
  // STRIPED AWNINGS along the rock's foot, a counter of wares under each
  const awn = [red, blue, amber, green];
  [[1.0, 4.2], [5.6, 4.2], [10.2, 4.2], [14.8, 4.2], [-19.0, 3.5], [-15.3, 3.5]].forEach(([z0, len], i) => {
    const n = Math.round(len / 0.525), dz = len / n, xb = faceX(ly + 3.1, z0 + len / 2) + 0.15, a = awn[i % 4];
    g.at().move(0, 0, 3, 0, (px) => (px < 998.8 ? 1 : 0));
    for (let k = 0; k < n; k++) {
      const za = z0 + k * dz, zb = za + dz, col = k % 2 ? a : white;
      g.quad([xb, ly + 3.1, za], [998.3, ly + 2.45, za], [998.3, ly + 2.45, zb], [xb, ly + 3.1, zb], col); g.quad([998.3, ly + 2.45, za], [998.27, ly + 2.12, za], [998.27, ly + 2.12, zb], [998.3, ly + 2.45, zb], col);
    }
    g.move(); g.box(999.7, ly + 0.5, z0 + len / 2, 1.0, 1.0, len - 0.9, wood, C('#D9C29A', 0.8));
    for (let k = 0; k < 5; k++) g.ball(999.6 + ar.range(-0.2, 0.2), ly + 1.12, z0 + 0.8 + k * (len - 1.6) / 4, 0.2, 0.16, 0.2, ar.pick(PETALS), 5, 2);
  });
  await ctx.yield();
  // two tall staffs at the landing's corners, a long banded flag streaming from each; pennants from them to the gate's pillars and to the rock
  for (const s of [-1, 1]) {
    g.at(986.3, ly, s * 18.4).move(); g.bar([0, 0, 0], [0, 9.2, 0], 0.09, 0.05, white, 5); g.ball(0, 9.3, 0, 0.14, 0.14, 0.14, gold, 5, 3);
    g.move(0, 0, 3, 0, (px) => 0.4 + px * 0.5);
    for (let k = 0; k < 5; k++) { const x0 = 0.06 + k * 0.52, x1 = x0 + 0.52, y1 = 9.0 - k * 0.05, y0 = 7.7 + k * 0.05, col = k % 2 ? white : (s > 0 ? blue : amber); g.tri([x0, y1, 0], [x0, y0, 0], [x1, y0 + 0.05, 0], col, SUNWARD, SUNWARD, SUNWARD); g.tri([x0, y1, 0], [x1, y0 + 0.05, 0], [x1, y1 - 0.05, 0], col, SUNWARD, SUNWARD, SUNWARD); }
    g.at().move(); tub(g, 988.3, ly, s * 18.7, ar);
  }
  pennants([986.3, ly + 8.7, 18.4], [986.4, ly + 8.6, 1.5], 1.1, 26);
  pennants([986.3, ly + 8.7, -18.4], [986.4, ly + 8.6, -15.5], 0.2, 5);
  pennants([986.4, ly + 8.6, 1.5], [step(Math.round(nStep / 3))[0] - 0.5, ly + climb / 3 + 1.25, 10.4], 1.0, 24);
  pennants([986.3, ly + 8.7, -18.4], [faceX(ly + 7.2, -18.6) + 0.1, ly + 7.2, -18.6], 0.9, 22);
  // flower tubs on the landing's low sea wall and at the stairs' foot
  for (const tz of [4.2, 7.4, 10.6, 13.8, 16.6]) tub(g, 987.2, ly + 1.0, tz, ar);
  tub(g, 999.25, ly, -12.3, ar, 1.2); tub(g, 999.25, ly, -8.2, ar, 1.2);
  await ctx.yield();
  // SMALL BOATS lying off the landing at either lip, their bottoms in the faces: four dinghies, and two rowing boats with their oars dipping
  const hullC = [C('#F4FBF7', 0.8), C('#3F8FD8', 0.8), C('#EFE6CC', 0.8), C('#2F6B4A', 0.8), C('#E8B03A', 0.8), C('#C8432B', 0.8)], botC = [C('#C8432B', 0.8), C('#7A2E22', 0.9), C('#2B4E5A', 0.9)], oar = C('#D8B880', 0.85);
  [['dinghy', 970, -23.5, 0.3], ['row', 980, -26.4, 0.12], ['dinghy', 991.5, -23.6, -0.25], ['dinghy', 969, 23.5, 0.3], ['row', 980, 26.2, 3.25], ['dinghy', 992, 23.4, -0.2]].forEach(([kind, x, z, ry], i) => {
    S.addBoat(af, kind, x, z, ry, { hull: hullC[i], bottom: botC[i % 3], shirt: ar.pick(SHIRTS) });
    if (kind === 'row') for (const s of [-1, 1]) { af.at(x, 0, z, ry).move(x, z, 5, 0, (px, py, pz) => Math.min(1, Math.max(0, (Math.abs(pz) - 0.7) / 2.0))); af.bar([0.2, 0.55, s * 0.7], [0.0, -0.35, s * 2.7], 0.04, 0.04, oar, 5); af.box(0.0, -0.35, s * 2.75, 0.45, 0.06, 0.6, oar); }
    af.at().move();
  });
  g.at().move(); g.shade = shadeGeo;
}
// the keeper's station: she stems the stream and holds her ground off the landing
const SHIP = { x: 672, swing: 12, period: 240, z: -30 };
// THE HELD REACH beside the south face, from the yawl's mooring to the fishing boat: the gaze is held turned into the wall of water
// (gaze: metres from the lens's own place, on along the street, a little up, in toward the face: 20 m in for its 30 m on, so that the
// gaze lies some 31 degrees off the street's line and, in a broad picture, the street's far end stands clear of the edge; the less
// the turn, the less it should read as the flight leaving its course), from `before` metres of route short of
// the lens's coming abeam of the yawl until `after` metres beyond its coming abeam of the fishing boat, rising and letting go over
// `ease` metres; and the flight goes at `pace` of its speed elsewhere from the same beginning until `slowOn` metres beyond the look's
// end, losing and gathering way over `gather` metres: where the line crosses the street (x 479) the gaze comes round from one face
// to the other, and the flight is yet at its slowest as it does. Beyond the crossing it gathers the way it always had
// (the pace is whole again at x 577; the flight's own speed, within half a hundredth, from x 606, 32 m short of the keeper's rudder at
// its westmost): the keeper is passed as she always was, and the first 56 m of her look are flown a little slower than they were
const HELD = { gaze: [30, 2.5, 20], weight: 0.9, before: 30, after: 100, ease: 95, pace: 0.55, slowOn: 55, gather: 100 };
// THE LION'S MANE's station: behind the south face beside the held reach, between the bathers' raft and the market, 5 m behind the
// face's plane (its bell never nearer the plane than 3.08 m), its bell's rim 3.3 m under the level at rest, its hair ending 1.37 m
// and more over the bed. Fixed: the same on every visit. Its bell's shadow, carried down the world's own sun ray, wanders over the
// sand at the face's foot from x 298 to 309, between z 15.3 and the face: no tent, stall, lamp or seat stands there on any visit
// (a stroller of the street may, and a dealt boulder at the face's foot may touch its east edge). It is the one thing in the water
// whose shadow is laid on the street
const JELLY_AT = [303.5, -3.3, 25];
const SPEED = 25.06;                 // metres a second where the pace is 1: the speed the flight always had (1,052.6 m in 42 s before the line was relaid; the seconds are rounded to a tenth, so it is 25.04 to 25.08)
const shipX = (t) => SHIP.x + SHIP.swing * Math.sin(6.2832 * t / SHIP.period);
// the causeway's loop: east along its south lane, west along its north lane
const LOOP = { x0: 40, x1: 960, lane: 2.6 };
function loopPlace(s, lane, out) {
  const run = LOOP.x1 - LOOP.x0, arc = Math.PI * lane, total = 2 * run + 2 * arc, m = ((s % total) + total) % total;
  if (m < run) { out.x = LOOP.x0 + m; out.z = lane; out.ry = 0; }
  else if (m < run + arc) { const a = (m - run) / lane; out.x = LOOP.x1 + Math.sin(a) * lane; out.z = Math.cos(a) * lane; out.ry = a; }
  else if (m < 2 * run + arc) { out.x = LOOP.x1 - (m - run - arc); out.z = -lane; out.ry = Math.PI; }
  else { const a = (m - 2 * run - arc) / lane; out.x = LOOP.x0 - Math.sin(a) * lane; out.z = -Math.cos(a) * lane; out.ry = Math.PI + a; }
  return out;
}

// ---- the meshes of the cast, and the living things that need the whole plan first ----
async function finishCast(ctx, sea, world, cast, o) {
  const rng = ctx.rng, mat = sea.solid();
  const boatMat = sea.solid({ albedo: BOAT_ALBEDO });
  for (const k of ['afloat', 'land', 'stone']) { const geo = await cast[k].geometrySlow(ctx); const m = new THREE.Mesh(geo, k === 'afloat' ? boatMat : mat); m.frustumCulled = false; m.name = k; world.add(m); await ctx.yield(); }
  // what floats is painted a second time through the closed ceiling, after the sea's top (order 4) and before the faces' film (order 5):
  // THE SECOND PAINTING in the part
  { const afloat = world.getObjectByName('afloat'); const m = new THREE.Mesh(S.overGeometry(afloat.geometry, sea.bare), sea.solid({ albedo: BOAT_ALBEDO, over: true })); m.frustumCulled = false; m.renderOrder = 4.5; m.name = 'afloat-over'; world.add(m); }
  // (the masonry carries no foam line of its own: the sea's top draws its wash round the breakwater's stone)
  for (const [k, alb] of [['masonry', MASONRY_ALBEDO], ['rock', ROCK_ALBEDO], ['wreck', WRECK_ALBEDO], ['town', TOWN_ALBEDO]]) { const geo = cast[k].geometry(); await ctx.yield(); const m = new THREE.Mesh(geo, sea.solid({ albedo: alb, noLine: k === 'masonry' })); m.frustumCulled = false; m.name = k; world.add(m); await ctx.yield(); }
  { const m = new THREE.Mesh(cast.mane.geometry(), mat); m.frustumCulled = false; m.name = 'mane'; world.add(m); }
  world.add(cast.net);
  const shade = new THREE.Mesh(cast.shade.geometry(), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.MultiplyBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: 'varying vec3 vC; void main(){ vC = color; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }', vertexColors: true,
    fragmentShader: /* glsl */`varying vec3 vC;
      void main(){ vec2 d = abs(vC.xy * 2. - 1.); float box = (1. - smoothstep(0.62, 1., d.x)) * (1. - smoothstep(0.62, 1., d.y)); float rnd = 1. - smoothstep(0.6, 1., length(d));
        float a = mix(box, rnd, step(0.5, vC.z)); gl_FragColor = vec4(mix(vec3(1.), vec3(0.36, 0.5, 0.7), a), 1.); }` }));
  shade.frustumCulled = false; shade.renderOrder = 1; shade.name = 'shadows'; world.add(shade);
  // kelp: on the wreck's stern, as the reef's wall, and in dealt beds along both faces (no stipe rooted nearer a face's plane than 4.2 m)
  const kg = cast.kelp, beds = cast.weed.slice();
  for (let i = 0; i < 22; i++) {
    const s = i % 2 ? 1 : -1, x = 120 + i * 38 + rng.range(-12, 12); if (s < 0 && x > 585 && x < 720) continue;
    const bz = s * rng.range(30, 42), spread = rng.range(2.5, 5), n = Math.round(rng.range(12, 20));
    if (s < 0 && x > 832 && x < 918) continue;                                         // (the seal reef's rock stands there; its own kelp is rooted on it)
    beds.push([x, bz, spread, n]);
  }
  // kelp stands thick just behind both faces where the street comes down the ramp, as tall as the water there, and behind the
  // north face from the keeper's station to the breakwater's foot: seen from over the lips, the cut's wall is dark with it
  for (let x = 46; x <= 200; x += 22) for (const s of [-1, 1]) beds.push([x + (s > 0 ? 11 : 0), s * 26.2, 3.2, 9]);
  for (const [x, n] of [[716, 12], [731, 14], [752, 12], [768, 16], [781, 12], [803, 10], [833, 12]]) beds.push([x, -26.4, 2.6, n]);
  // and stands of it close behind the south face between its named things, so that face is never bare water
  for (const x of [224, 248, 302, 322, 340, 363, 384, 402, 448, 500]) beds.push([x, 27, 2.6, 10]);
  // and a forest of it over the deepest reach of the north bed, behind the net and the pots and under the keeper's station:
  // its crowns stand 7 m and more under the sea's level, well under her keel
  for (const x of [590, 604, 619, 634, 650, 666, 682, 698, 712]) beds.push([x, -33.5, 3.4, 9]);
  const inMole = (x) => x > 785.6 && x < 794.4, scrap = new S.Geo();
  // the named moorings: no stipe stands within 6 m of a hull lying there
  const berths = [[62, -27], [200, 24.5], [275, 25], [356, 23.6], [425, 25.5], [476, -24.6], [536, -27.5], [558, -26.2], [742, -24.6], [818, -24.8], [942, -25.5], [952, 25.6], [931, -24.6], [JELLY_AT[0], JELLY_AT[2]]];   // (the last but one: the run of the island yawl's chain; the last: the lion's mane's station, its hair hanging where stipes would stand)
  // nor in the wreck's after body, nor between it and the face (she lies along the line from (528.5, -24) north-east; her stern shows against the weed beyond her)
  const atWreck = (x, z) => { const al = (x - 528.5) * 0.7071 - (z + 24) * 0.7071, ac = (x - 528.5) * 0.7071 + (z + 24) * 0.7071; return al > -5 && al < 21 && ac > -4.5 && ac < 10; };
  if (cast.diver) berths.push(cast.diver, [cast.diver[0] - 0.8, cast.diver[1] - 0.9]);   // (on a rare visit: the helmet diver's place and his launch's)
  const atBerth = (x, z) => berths.some(([bx, bz]) => Math.hypot(x - bx, z - bz) < 6) || atWreck(x, z);
  let stipes = 0;
  const kelpRng = ctx.core.makeRng(ctx.core.hashSeed('weed-kinds:' + ctx.seed));     // (the three kinds of weed are dealt by a stream of their own)
  for (const [bx, bz, spread, n] of beds) for (let i = 0; i < n; i++) {
    let x, z, y;
    if (spread === 0) {                                                               // (dealt by the mound's plan; then each is rooted on the ledge of the rock nearest its place)
      x = rng.range(846, 904); z = rng.range(-46, -24.2); if (reefY0(x, z) > -4) continue;
      const led = z > -31 ? reefLedge(x, Math.min(5, Math.floor(reefForm(x, z, _rf).t)), 0.3) : null; if (led && led[0] <= -24.2) z = led[0];
      y = reefY(x, z);
    }
    else { x = bx + rng.gauss() * spread; z = bz + rng.gauss() * spread * 0.6; z = Math.sign(bz) * Math.max(24.2, Math.min(47, Math.abs(z))); y = Math.max(-bedD(x), moleY(x, z)); }
    const tall = Math.min(rng.range(8, 14), -y - 1.2);
    S.kelpDealt(rng);
    // three kinds, mixed: each bed leans to one of them; where the water is shallow the tall stipes give way to ribbons and wrack
    const lot = kelpRng(), bias = Math.floor(Math.abs(bx * 0.37 + bz * 0.11)) % 3, kind = lot < 0.5 ? (bias === 1 && tall < 2.5 ? 0 : bias) : lot < 0.72 ? 0 : lot < (tall < 2.5 ? 0.78 : 0.9) ? 1 : 2;
    S.addKelp(inMole(x) || atBerth(x, z) || tall < 1.2 ? scrap : kg, x, z, y, Math.max(tall, 1.2), kelpRng, kind);   // (no plant is rooted in the breakwater's stone, or where the water is too shallow to hold one)
    if (++stipes % 30 === 0) await ctx.yield();
  }
  await ctx.yield();
  // the sea's own bed behind each face: sea grass in tufts and stones, thick along the whole of both faces. The tufts' count follows
  // the quality tier's detail, so they are dealt by a stream of their own and the stones by another: no tier shifts a stone
  const tuftRng = ctx.core.makeRng(ctx.core.hashSeed('wild-tufts:' + ctx.seed)), wildRng = ctx.core.makeRng(ctx.core.hashSeed('wild-bed:' + ctx.seed));
  for (let i = 0, n = Math.round(1700 * o.detail); i < n; i++) {
    const sd = i % 2 ? 1 : -1, x = 25 + tuftRng() * 965, z = sd * (21.3 + 12 * tuftRng() * tuftRng()), y = -bedD(x), h = Math.min(0.7 + 2.0 * tuftRng(), bedD(x) - 0.6);
    if (h < 0.4 || (sd < 0 && reefY0(x, z) > y + 0.3) || moleY(x, z) > y + 0.3) continue;
    const onDiver = cast.diver && Math.hypot(x - cast.diver[0], z - cast.diver[1]) < 1.9;   // (a tuft's reach is 0.8 m at the most with its sway, the diver's 1.1 m)
    tuft(onDiver || (sd < 0 && reefY(x, z) > y + 0.3) ? scrap : kg, x, y, z, h, tuftRng);
    if (i % 120 === 119) await ctx.yield();
  }
  for (let i = 0; i < 170; i++) {
    const sd = i % 2 ? 1 : -1, x = 40 + wildRng() * 945, r = 0.35 + 0.9 * wildRng() * wildRng(), z = sd * (20.4 + r * 2.2 + 10 * wildRng() * wildRng());
    if (bedD(x) < r + 1 || (sd < 0 && reefY0(x, z) > -bedD(x) + 0.3) || moleY(x, z) > -bedD(x) + 0.3) continue;
    const onDiver = cast.diver && Math.hypot(x - cast.diver[0], z - cast.diver[1]) < 2.1 * r + 1.1;   // (a stone's reach is 2.1 r at the most, the diver's 1.1 m)
    boulder(onDiver || (sd < 0 && reefY(x, z) > -bedD(x) + 0.3) ? scrap : kg, x, -bedD(x) - 0.08, z, r, wildRng);
    if (i % 40 === 39) await ctx.yield();
  }
  await ctx.yield();
  const kelp = new THREE.Mesh(await kg.geometrySlow(ctx), mat); kelp.frustumCulled = false; kelp.name = 'kelp'; world.add(kelp);
  await ctx.yield();
  // fish: the named shoals and six more dealt ones, each turning about its own fixed centre. A shoal's count follows the quality
  // tier's detail, so every shoal's fish are dealt by a stream of that shoal's own: no tier shifts another shoal, or any thing dealt later
  for (let i = 0; i < 6; i++) { const s = i % 2 ? -1 : 1, x = [235, 745, 560, 330, 915, 130][i] + rng.range(-12, 12); cast.shoals.push({ c: [x, Math.min(-bedD(x) * rng.range(0.35, 0.6), -5.5), s * rng.range(28, 31)], r: [8, 2.6, 4], n: 520, period: (rng.chance(0.5) ? 1 : -1) * rng.range(19, 31) }); }
  cast.shoals.forEach((sh, i) => { sh.n = Math.round(sh.n * o.detail); sh.rng = ctx.core.makeRng(ctx.core.hashSeed('shoal-' + i + ':' + ctx.seed)); });
  world.add(S.buildFish(sea, cast.shoals));
  await ctx.yield();
  // seals: three about the reef, one at the wreck, one by the net, two in the south face; each on its own closed loop
  const sl = [[860, -9, -23.6, 9, 3, 0.9], [889, -12, -23.6, 8, 3, 0.9], [906, -7, -27, 4.5, 2.5, 2], [540, -9, -31, 9, 3, 5], [610, -15, -33, 14, 2.5, 5], [470, -9, 30, 14, 4, 5], [320, -7, 29, 12, 3, 4.5]];
  world.add(S.buildSeals(sea, sl.map((a, i) => ({ c: [a[0], a[1], a[2]], r: [a[3], a[4], a[5]], period: (i % 2 ? -1 : 1) * rng.range(23, 37), phase: rng.range(0, 6.28) }))));
  // gulls: each wheels inside a box of its own, laid outside the lips. Boats lie moored under them, so a gull's lowest pass is laid
  // from the tallest moored masthead there, a yawl's: 11.5 m, plus the swell's rise at the masts' own place, 4.5 m outside a lip
  // (0.98 m on the heaviest sea), plus what her hull's tilt lifts a masthead that stands 1.4 m before her middle (0.14 m): 12.62 m;
  // plus 1.0 m of clear air, plus the dip of a wing tip under the bird (0.47 m): 14.09 m; its loop goes 1.5 m under its centre, so
  // no centre flies under 15.59 m. (The keeper's foremast, 12 m, stands under the loops about x 660 and 710 too: she rides 0.12 of
  // the swell and her head is at 12.44 m at the highest, under the yawl's 12.62.)
  const gl = [], gullLow = 11.5 + 0.98 + 0.14 + 1.0 + 0.47, gullY = (y) => gullLow + 1.5 + (y - 14) * (22 - gullLow - 1.5) / 8;
  for (let i = 0; i < 36; i++) { const s = i % 2 ? 1 : -1; gl.push({ c: [60 + i * 25 + rng.range(-8, 8), gullY(rng.range(14, 22)), s * rng.range(36, 70)], r: [rng.range(4, 9), 1.5, rng.range(4, 9)], period: (rng.chance(0.5) ? 1 : -1) * rng.range(9, 16), phase: rng.range(0, 6.28) }); }
  // and a company of them about the breakwater's two ends, where the anglers are
  for (let i = 0; i < 22; i++) { const s = i % 2 ? 1 : -1; gl.push({ c: [rng.range(722, 830), rng.range(8.2, 14), s * rng.range(32.5, 46)], r: [rng.range(3, 7), 1.2, rng.range(2.5, 4.5)], period: (rng.chance(0.5) ? 1 : -1) * rng.range(8, 14), phase: rng.range(0, 6.28) }); }
  // and gulls in the near air over the south side of the high street and of the ramp's head (inside the flag mast's line, over every
  // roof and lamp), and down in the slot's own air over the south half of the street between the breakwater and the seal reef, below the sea's level and well over the lamps
  const gr = ctx.core.makeRng(ctx.core.hashSeed('near-gulls:' + ctx.seed));
  // (the street's gulls keep east of the south town kite's string: their centres from x -12, their loops and wings from x -22.1; the string stands west of x -25.4 at their heights)
  for (let i = 0; i < 9; i++) gl.push({ c: [-12 + (gr.range(-38, 40) + 38) * (52 / 78), gr.range(14.4, 16.4), gr.range(5, 9.5)], r: [gr.range(5, 9), 1.2, gr.range(2.5, 4)], period: (gr.chance(0.5) ? 1 : -1) * gr.range(9, 15), phase: gr.range(0, 6.28) });
  for (let i = 0; i < 8; i++) gl.push({ c: [gr.range(808, 852), gr.range(-5, 3), gr.range(5, 10)], r: [gr.range(4, 8), 1.2, gr.range(2.5, 4)], period: (gr.chance(0.5) ? 1 : -1) * gr.range(9, 15), phase: gr.range(0, 6.28) });
  world.add(S.buildGulls(sea, gl));
  await ctx.yield();
  // the keeper
  const ship = S.buildSteamer(sea); world.add(ship.group); cast.ship = ship;
  await ctx.yield();
  // (the small things are dealt by streams of their own: the motes, whose count follows the quality tier's detail, by one; the spray, bubbles and smoke by another)
  cast.specks = S.buildSpecks(ctx, sea, { rng: ctx.core.makeRng(ctx.core.hashSeed('specks:' + ctx.seed)), motes: ctx.core.makeRng(ctx.core.hashSeed('motes:' + ctx.seed)), detail: o.detail, ship: new THREE.Vector4(SHIP.x, SHIP.swing, SHIP.period, SHIP.z), shipT: o.clock.ship, risers: cast.risers });
  world.add(cast.specks.object);
  // sailing boats on closed loops outside the lips; the looping bus; six cyclists; the swimmer on the raft's chain
  const sg = new S.Geo(); S.addBoat(sg, 'sloop', 0, 0, 0, { sails: true, pivot: [0, 0], hull: C('#EFE6CC', 0.8) });
  const sgeo = sg.geometry();
  cast.sailers = [];
  // each sails an ellipse of her own outside a lip. Its middle lies at abs z 90 .. 104 and it is 14 .. 22 m wide either way, so her
  // course keeps abs z 68 and more; with her own reach about her middle (4.97 m) and her masthead's heel (1.10 m) she keeps
  // abs z 61.9 and more: beyond the outermost reach of any dealt mooring (58.6) and of the breakwater's gulls (51.6).
  // The courses: [middle x, how far that is dealt either way, the half length east and west from .. to]. The fourth sails
  // wholly east of the breakwater: never west of x 810 (870 - 55 - 4.97), where its round heads end at x 795.2
  const courses = [[180, 30, 40, 60], [390, 30, 40, 60], [600, 30, 40, 60], [880, 10, 40, 55]];
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(sgeo, boatMat); m.frustumCulled = false; world.add(m); const s = i % 2 ? 1 : -1, [mx, dx, a0, a1] = courses[i]; cast.sailers.push({ m, cx: mx + rng.range(-dx, dx), cz: s * rng.range(90, 104), a: rng.range(a0, a1), b: rng.range(14, 22), period: rng.range(80, 110) * s, phase: rng.range(0, 6.28) }); }
  // the blue shadows of what moves on the causeway: one soft patch each, lying north of its thing
  const patch = (w, d, round = 0) => { const sg = new S.Geo(), put = (x, z, u, v) => sg._vert(x, 0, z, 0, 1, 0, [u, v, round]); put(-w / 2, d / 2, 0, 0); put(w / 2, d / 2, 1, 0); put(w / 2, -d / 2, 1, 1); put(-w / 2, d / 2, 0, 0); put(w / 2, -d / 2, 1, 1); put(-w / 2, -d / 2, 0, 1); const m = new THREE.Mesh(sg.geometry(), shade.material); m.frustumCulled = false; m.renderOrder = 1; m.rotation.order = 'YXZ'; world.add(m); return m; };
  cast.round = new THREE.Mesh(cast.roundabout.geometry(), mat); cast.round.frustumCulled = false; cast.round.position.set(-39, 3, 13); world.add(cast.round);
  cast.busShade = patch(11, 4.6);
  cast.jellyShade = patch(2.6 * S.JELLY.bell, 2.6 * S.JELLY.bell, 1);                  // the lion's mane's: the noon sun stands behind the south water, so its bell's shadow falls through the face onto the street's sand
  const bg = new S.Geo(); bus(bg); cast.bus = new THREE.Mesh(bg.geometry(), mat); cast.bus.frustumCulled = false; world.add(cast.bus);
  cast.cyclists = [];
  for (let i = 0; i < 6; i++) { const cg = new S.Geo(); cyclist(cg, rng); const m = new THREE.Mesh(cg.geometry(), mat); m.frustumCulled = false; world.add(m); cast.cyclists.push({ m, sh: patch(2.2, 1.5), phase: i * 307 + rng.range(0, 60), speed: rng.range(4.5, 6) }); }
  const wg = new S.Geo(); S.addBather(wg, 0, 0, 0, C('#0B5A7A', 0.9)); const wgeo = wg.geometry();
  for (const d of cast.dives) { d.phase = o.clock.rng.range(0, 6.2832); d.m = new THREE.Mesh(wgeo, mat); d.m.frustumCulled = false; world.add(d.m); }
}

export default {
  id: 'sea-stands-open',
  name: 'Seabed Street',
  category: 'ocean',
  media: ['open', 'water'],
  weirdness: 0.55,
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise;
    const scene = new THREE.Scene();
    // ---- what this visit is dealt ----
    const state = rng.pick(['calm', 'breeze', 'swell']);
    const sunAz = rng.range(165, 195);
    const marketDay = rng.chance(0.5);
    const density = ctx.vary.density, rare = ctx.vary.rare, detail = ctx.quality.detail;

    // ---- the route (metres; the faces are the planes z -20 and z +20). Along the held reach (x 250 to 400) it runs 6 m from the
    // south face and about half way down it, 6 m and more over the street ----
    const path = makePath([
      [-60, 13, -8], [0, 12, -9], [100, 3.5, -6], [190, -3, 11], [250, -7, 14], [325, -8.6, 14], [400, -9.6, 14], [445, -10.4, 9], [505, -12, -6],
      [620, -11, -13], [700, 3, -13], [745, 5.5, -13], [790, 8.5, -9.5], [832, 4.5, -11.5], [868, 1.5, -11.5], [918, -5.6, -7.6], [935, -6, -7.4], [985, -6, -7],
    ]);
    // the flown line as places about 2 m apart (2.06 at the most; x y z by turns), with 100 m of straight run before its start
    // and after its end (before the start is about where the lens stands while this world is seen through a portal; the run
    // after the end is spare): for what is built by how it lies to the whole route (a far chain's lighter links: the part's
    // CHAIN.far)
    const line = []; for (let i = 0, n = Math.ceil(path.length / 2); i <= n; i++) { const p = path.pointAt(i / n); line.push(p.x, p.y, p.z); }
    for (const [a, b] of [[0, 3], [line.length - 3, line.length - 6]]) { const d = [line[a] - line[b], line[a + 1] - line[b + 1], line[a + 2] - line[b + 2]], k = 2 / Math.hypot(d[0], d[1], d[2]), o = [line[a], line[a + 1], line[a + 2]]; for (let s = 1; s <= 50; s++) line.push(o[0] + d[0] * k * s, o[1] + d[1] * k * s, o[2] + d[2] * k * s); }

    // ---- sky and sun ----
    const sky = makeSky({ rng, preset: 'day', sunElevation: 60, sunAzimuth: sunAz, clouds: false, clouds2: false,
      zenith: '#2470C8', horizon: '#B6D8EF', horizonPow: 6, sunIntensity: 10 });
    scene.add(sky.object);
    await ctx.yield();
    scene.fog = new THREE.FogExp2(new THREE.Color('#CFE6F2'), 0.00058);
    // fair-weather cumulus standing round the horizon, heaped tall over the far sea, none overhead (they hold their stations: no wind is given them)
    const cloudAt = [];
    for (let i = 0; i < 10; i++) { const a = (i + rng()) / 10 * 6.2832, r = rng.range(2600, 3300); cloudAt.push([500 + Math.cos(a) * r, rng.range(170, 320), Math.sin(a) * r, rng.range(900, 1350)]); }
    const clouds = await makeCloudFieldAsync({ rng, sky, at: cloudAt, wind: [0, 0, 0], puffs: Math.round(46 * detail), height: 0.6, farFade: [5200, 5800] }, ctx.yield);   // (the field bakes its own noise, in short steps: a sky's noise is white and sprays a cloud with dots)
    scene.add(clouds.object);
    await ctx.yield();
    const sea = S.makeSea(ctx, { state, sun: sky.sunDirection, mole: [MOLE.x, MOLE.half, MOLE.reach] });
    const world = new THREE.Group(); scene.add(world);
    await ctx.yield();
    world.add(await S.buildSeaTop(ctx, sea, (x) => (x > S.SLOT_END ? 16 : bedD(Math.max(x, 0)))));
    await ctx.yield();
    world.add(await S.buildFaces(ctx, sea));
    await ctx.yield();
    world.add(await buildGround(ctx, sea, noise));
    await ctx.yield();
    const bed = (x) => -bedD(x);
    const cast = { shoals: [], risers: [], kelp: new S.Geo(), looks: [], shade: new S.Geo(), stands: [] };   // stands: [x, z, radius] of each small thing standing on the street
    cast.shade.off = [-sea.sun.x / sea.sun.y, -sea.sun.z / sea.sun.y];             // where a metre of height throws its shadow
    await buildAfloat(ctx, sea, cast, { bed, marketDay, density, rare, line });
    await ctx.yield();
    await buildLand(ctx, cast, { bed, marketDay });
    await ctx.yield();
    await buildStone(ctx, cast, { bed, marketDay, density, noise });
    await ctx.yield();
    await buildRampLife(ctx, cast, bed);
    await ctx.yield();
    await buildArrival(ctx, cast, bed, noise);
    await ctx.yield();
    // where each thing on a long loop of its own stands when the clock is at nought: dealt, by a stream of its own
    const clockRng = ctx.core.makeRng(ctx.core.hashSeed('clock:' + ctx.seed));
    const clock = { rng: clockRng, ship: clockRng.range(0, SHIP.period), bus: clockRng.range(0, 1900) };
    const shipAt = (t) => shipX(t + clock.ship);
    await finishCast(ctx, sea, world, cast, { detail, clock });

    // ---- looks: each aims at a subject's own place while the lens comes up to it, and LETS GO 20 m of route before the lens is
    // abeam of it (the thing then passes through the picture by itself under the standing lean: the gaze never swings round
    // after a thing that is going by, which at this speed is a turn of fifty degrees a second and more) ----
    // the keeper's look rides with her on her station: the gaze holds her screw from well astern of her; as the lens comes up under her
    // counter it runs forward along her bottom, some way ahead of the lens and about level with it, so her red bottom lies on the near
    // hand, the face's foot and the STAND on the street under her on the other, to her stem
    const keeperAt = new THREE.Vector3(), lensAt = new THREE.Vector3();
    cast.looks.push({ ship: (time, u) => {
      const sx = shipAt(time); path.pointAt(u, lensAt);
      const tx = Math.min(Math.max(lensAt.x + 26, sx - 19.6), sx + 21), run = sstep(0, 12, tx - (sx - 19.6));
      return keeperAt.set(tx, -3.1 + run * (0.5 * lensAt.y - 3.3 + 3.1), SHIP.z + 3.5 * run);
    }, 0: SHIP.x, 2: SHIP.z, early: 20 + SHIP.swing + 19.6, past: 30 + SHIP.swing, weight: 0.55 });
    // (a fixed look's span: from lead + go metres of route before the lens is abeam of its thing (lead 70 unless it says) until go
    // metres before abeam (go 20 unless it says), or until the lens is abeam of another place it names, at 0.85 of its weight;
    // the keeper's riding look alone keeps its own span past abeam)
    const lead = 70 / path.length, abeam = (x, z) => path.nearestXZ(x, z).u;
    const pois = cast.looks.map((p) => { const n = abeam(p[0], p[2]); const at = p.ship || (p.aim ? new THREE.Vector3(p.aim[0], p.aim[1], p.aim[2]) : new THREE.Vector3(p[0], p[1], p[2])); const sh = p.ship ? 0 : (p.go ?? 20); return { at, from: n - ((p.lead ?? 70) + (p.early || 0) + sh) / path.length, to: p.until ? abeam(p.until[0], p.until[1]) : n + ((p.ship ? (p.past ?? 25) : -sh)) / path.length, weight: (p.weight || 0.6) * (p.ship ? 1 : 0.85), fade: 0.25 }; });
    // THE HELD REACH (HELD, above): one look, laid from the lens's own place, and the slow pace that goes with it
    const heldAt = new THREE.Vector3(), heldGaze = new THREE.Vector3(HELD.gaze[0], HELD.gaze[1], HELD.gaze[2]);
    const heldFrom = abeam(200, 24.5) - HELD.before / path.length, heldTo = abeam(425, 25.5) + HELD.after / path.length, heldEase = HELD.ease / ((heldTo - heldFrom) * path.length);
    pois.push({ at: (time, u) => path.pointAt(u, heldAt).add(heldGaze), from: heldFrom, to: heldTo, weight: HELD.weight, fade: heldEase, arc: true });   // (arc: it rises and lets go evenly along the angle, a wide one here)
    const slowTo = heldTo + HELD.slowOn / path.length;
    const pace = (u) => 1 - (1 - HELD.pace) * bell(u, heldFrom, slowTo, HELD.gather / ((slowTo - heldFrom) * path.length));
    // the flight's seconds: where the pace is 1 it keeps the speed it always had (SPEED); the held reach adds its own seconds
    // (summed as the engine sums a pace: 64 pieces of the route)
    let slow = 0; for (let i = 0; i < 64; i++) slow += 2 / (pace(i / 64) + pace((i + 1) / 64)) / 64;
    const duration = Math.round(path.length / SPEED * slow * 10) / 10;
    // (no gap between looks: each begins no later than the last of those begun before it ends; they are laid on in the order of their ends)
    pois.sort((a, b) => a.from - b.from);
    for (let i = 1, end = pois[0].to; i < pois.length; i++) { pois[i].from = Math.min(pois[i].from, end); end = Math.max(end, pois[i].to); }
    pois.sort((a, b) => a.to - b.to);
    // and one standing look for the whole visit: while the lens is under the sea's level the gaze leans to the nearer face,
    // at a point of that face some 18 m on, so the face, its lip and the street at its foot are all in the gaze; where the line
    // crosses the slot the lean changes hands slowly (over 8 m of the line's z either way), never at a step
    const faceAt = new THREE.Vector3(), ahead = new THREE.Vector3();
    pois.unshift({ at: (time, u) => {
      path.pointAt(Math.min(u + 62 / path.length, 1), ahead);                         // the face the line is making for
      const side = Math.tanh(ahead.z / 8);
      path.pointAt(Math.min(u + 18 / path.length, 1), ahead);
      const under = sstep(1, -4, ahead.y), over = sstep(0.5, 4, ahead.y);
      faceAt.set(ahead.x, ahead.y + (1.5 + 0.4 * Math.max(-ahead.y, 0)) * under, ahead.z + (side * (HALF + 1) - ahead.z) * under);   // (lifted toward that face's lip, the more the deeper the line runs)
      // while the line runs well over the sea's level the gaze leans down into the slot instead: at the foot of the face it is making for,
      // some 50 m on, so the face's whole height, its lip and the street under it are in the gaze
      path.pointAt(Math.min(u + (50 + 5 * Math.max(ahead.y - 6, 0)) / path.length, 1), ahead);   // (the higher the line, the further on)
      const sx = Math.min(Math.max(ahead.x, 30), 985);
      return faceAt.lerp(ahead.set(sx, 1 - bedD(sx), side * (HALF - 3)), over);
    }, from: path.nearestXZ(-300, 0).u - lead, to: path.nearestXZ(1300, 0).u + lead, weight: 0.6, fade: 0.02 });   // from behind the town to beyond the island: the whole visit
    const size = new THREE.Vector2(), lp = { x: 0, z: 0, ry: 0 };
    await sky.prewarm(ctx.renderer, null, scene);
    return {
      scene, path, duration, pace, ride: 'none', style: 'none',
      camera: { fov: 62, near: 0.3, far: 6000, bank: 0, sway: 0 },      // the lens is upright throughout: the level sea is the witness
      pois,
      portal: { shape: 'circle', radius: 7, color: '#FFD98A', glow: 1.0 },
      post: { exposure: 1.0, bloom: { strength: 0.25, radius: 0.6, threshold: 1.0 },
        grade: { saturation: 1.1, contrast: 1.08, vignette: 0.22, grain: 0.02 } },
      update(dt, time, camera, u) {
        sea.uniforms.uT.value = time;
        sky.update(dt, time, camera); clouds.update(dt, time, camera);
        cast.specks.uniforms.uPx.value = ctx.renderer.getDrawingBufferSize(size).y;
        // the keeper holds her ground against the stream; her screw always turns ahead
        cast.ship.group.position.set(shipAt(time), 0, SHIP.z);
        cast.ship.screw.rotation.x = -time * 1.4 * 6.2832;
        cast.round.rotation.y = -time * 0.5;                                           // the roundabout turns, one round in 12.6 s
        for (const s of cast.sailers) { const a = s.phase + 6.2832 * time / s.period, sg = Math.sign(s.period); s.m.position.set(s.cx + Math.cos(a) * s.a, 0, s.cz + Math.sin(a) * s.b); s.m.rotation.y = Math.atan2(-Math.cos(a) * s.b * sg, -Math.sin(a) * s.a * sg); }
        const off = cast.shade.off;
        const lay = (m, h) => { const x = lp.x + off[0] * h, y0 = groundY(x - 1, 0), y1 = groundY(x + 1, 0); m.position.set(x, (y0 + y1) / 2 + 0.07, lp.z + off[1] * h); m.rotation.set(0, lp.ry, Math.atan((y1 - y0) / 2) * Math.cos(lp.ry)); };
        loopPlace(clock.bus + 8 * time, LOOP.lane, lp); cast.bus.position.set(lp.x, groundY(lp.x, 0), lp.z); cast.bus.rotation.y = lp.ry; lay(cast.busShade, 1.6);
        for (const c of cast.cyclists) { loopPlace(c.phase + c.speed * time, 4.1, lp); c.m.position.set(lp.x, groundY(lp.x, 0), lp.z); c.m.rotation.y = lp.ry; lay(c.sh, 0.9); }
        { const j = S.jellyAt(time); lp.x = JELLY_AT[0] + j[0]; lp.z = JELLY_AT[2] + j[2]; lp.ry = 0; lay(cast.jellyShade, JELLY_AT[1] + 0.5 * S.JELLY.high + j[1] - groundY(lp.x, 0)); cast.jellyShade.scale.setScalar(1 - 0.2 * j[3]); }
        for (const dv of cast.dives) { const ph = dv.phase + 6.2832 * time / dv.period; dv.m.position.set(dv.x, dv.top + (dv.deep - dv.top) * (0.5 - 0.5 * Math.cos(ph)), dv.z); dv.m.rotation.z = -1.35 * Math.sin(ph); }
      },
      dispose() { sky.dispose(); },
    };
  },
};
