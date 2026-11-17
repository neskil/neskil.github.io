// HOUSES ON STRINGS, part: the table mountain (its sheer walls and its top), the forest floor far below, the one
// fall, the far table mountains and the floor of the cloud sea. The mountain's plan and heights are plain functions
// of place (no three.js), so the count of clear air reads the same rock the page draws.
import * as THREE from 'three';

export const TOP = 170, FLOOR = -430, WEST = -120, SOUTH = -420, NORTH = -900;   // the plan's three lines by the route: the bay's west wall, the west block's south face, the north wall
export const LIP = [WEST, TOP, -700], RING = [-60, 190, -1300];
// the plan of the walls, walked from the far west round the bay to the far east: places with their outward normals
export function planCurve() {
  const P = [], add = (x, z, nx, nz) => { const q = P[P.length - 1]; P.push({ x, z, nx, nz, s: q ? q.s + Math.hypot(x - q.x, z - q.z) : 0 }); };
  const step = (x, z) => (Math.hypot(x + 50, z + 700) < 560 ? 6 : 30);
  const run = (x0, z0, x1, z1, nx, nz) => { const L = Math.hypot(x1 - x0, z1 - z0); for (let d = 0; d < L;) { const x = x0 + (x1 - x0) * d / L, z = z0 + (z1 - z0) * d / L; add(x, z, nx, nz); d += step(x, z); } };
  const arc = (cx, cz, r, a0, a1, sgn) => { for (let k = 0; k <= 6; k++) { const a = a0 + (a1 - a0) * k / 6; add(cx + Math.cos(a) * r * sgn, cz + Math.sin(a) * r * sgn, Math.cos(a), Math.sin(a)); } };
  run(-1400, -2000, -1400, SOUTH - 40, -1, 0); arc(-1360, SOUTH - 40, 40, Math.PI, Math.PI / 2, 1);
  run(-1360, SOUTH, WEST - 40, SOUTH, 0, 1); arc(WEST - 40, SOUTH - 40, 40, Math.PI / 2, 0, 1);
  run(WEST, SOUTH - 40, WEST, NORTH + 40, 1, 0); arc(WEST + 40, NORTH + 40, 40, 0, Math.PI / 2, -1);
  run(WEST + 40, NORTH, 340, NORTH, 0, 1); arc(340, NORTH - 40, 40, Math.PI / 2, 0, 1);
  run(380, NORTH - 40, 380, -2000, 1, 0);
  return P;
}
const hsh = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const sst = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
// a vertical joint of the rock: a steep-sided cleft cut in from the face, open from its foot up; joints of one
// family stand W metres apart (each in its own cell, dealt its place, width, depth and foot by the cell's number)
function joint(s, y, W, so, half0, half1, deep0, deep1, share) {
  const c = Math.floor(s / W), r1 = hsh(c * 1.37 + so), r2 = hsh(c * 2.71 + so + 5.1), r3 = hsh(c * 3.19 + so + 9.3), r4 = hsh(c * 4.43 + so + 2.7);
  if (r4 > share) return 0;
  const d = Math.abs(s - (c + 0.3 + 0.4 * r1) * W), half = half0 + (half1 - half0) * r2, foot = -260 + 360 * r3;
  return (deep0 + (deep1 - deep0) * (0.5 * r1 + 0.5 * r4 / share)) * (1 - sst(half - 3.5, half + 2.5, d)) * sst(foot - 50, foot + 20, y);
}
// a tower split off the face: between two deep slots a block stands a little proud; above its own flat top the face steps back
function tower(s, y, so) {
  const W = 230, c = Math.floor(s / W), r1 = hsh(c * 1.91 + so + 3.3), r2 = hsh(c * 2.33 + so + 7.9), r3 = hsh(c * 3.77 + so + 1.3), r4 = hsh(c * 5.21 + so + 6.1);
  if (r4 > 0.78) return [0, 0];
  const d = Math.abs(s - (c + 0.3 + 0.4 * r1) * W), hw = 13 + 9 * r2, yt = TOP - 14 - 40 * r3, foot = -220 + 200 * r1;
  return [(1 - sst(hw - 2, hw + 2, d)) * (8 - 34 * sst(yt - 3, yt + 3, y)), (44 + 16 * r2) * (1 - sst(4, 7.5, Math.abs(d - hw - 6))) * sst(foot - 40, foot + 20, y)];
}
const LIP_S = (() => { let b = 1e9, ls = 0; for (const q of planCurve()) { const d = Math.hypot(q.x - LIP[0], q.z - LIP[2]); if (d < b) { b = d; ls = q.s; } } return ls; })();   // a constant of the plan: the arc of the fall's lip
// how far the wall's skin stands out from its plan line at arc s and height y, and how deep in a cleft it lies (0 to 1):
// slow bulges and buttresses, great ledges that overhang, clefts 20 to 60 m deep that split towers off the face
export function wallRelief(noise, s, y, crossS) {                    // crossS: the arc where the route goes out over the rim, found at build from the path
  const up = (y - FLOOR) / (TOP - FLOOR), bed = Math.floor((y - FLOOR) / 14), bh = Math.sin(bed * 12.9898) * 43758.5453, bo = (bh - Math.floor(bh) - 0.5), so = 40 * noise.n2(0.37, 0.71);
  let o = 22 * noise.n2(s / 170, 3.1) + 15 * Math.abs(noise.n2(s / 44, 7.7 + up * 0.9)) - 6 + 6 * noise.n2(s / 63, up * 3 + 20) + 7 * bo + 2 * noise.n2(s / 9, y / 12);
  o += 9 * noise.n2(Math.floor((y - FLOOR) / 62) * 3.3 + 0.5, s / 240);                          // great ledges, overhangs
  const tw = tower(s, y, so); o += tw[0];
  let cut = Math.max(joint(s, y, 110, so, 9, 19, 26, 58, 0.8), joint(s + 23, y, 47, so + 50, 4, 7, 14, 30, 0.55), tw[1]);
  const lk = sst(16, 64, Math.abs(s - LIP_S)); cut *= lk * sst(20, 70, Math.abs(s - crossS));   // no cleft at the fall's ledge, none where the route goes out over the rim
  o = (o - cut) * lk + (2 - 12 * (1 - up) ** 0.7) * (1 - lk);                                    // the fall's ledge: solid rock, a little proud, undercut below
  if (o > 0) o *= sst(14, 60, Math.abs(s - crossS));                                            // where the route goes out over the rim nothing stands proud of the plan's line
  o = Math.min(Math.max(o, -28 - 40 * sst(TOP, TOP - 50, y)), 26);   // the rim keeps within the band of top that follows it; no bulge crowds the way under the rim
  if (y < -300) o += (-300 - y) * 1.1;                              // the scree apron in the forest
  return [o, Math.min(1, cut / 34)];
}
export function wallOff(noise, s, y, crossS) { return wallRelief(noise, s, y, crossS)[0]; }
const riverZ = (x) => -700 + 11 * Math.sin(x / 70) * Math.min(1, Math.max(0, (-135 - x) / 80));
// the top's height at a place, d metres in from the rim; path: the route (the rock keeps 9.5 m under its last stretch)
export function topHeight(noise, x, z, d, path, pads = []) {
  const fade = Math.min(1, Math.max(0, d / 30));
  const v = (3.2 * noise.n2(x / 90, z / 90) + 1.6 * noise.n2(x / 23, z / 23 + 9)) / 1.5 + 0.3 * noise.n2(x / 11 + 3, z / 11), kf = Math.floor(v);
  let h = TOP + fade * 1.5 * (kf + sst(0.78, 1, v - kf));                                      // level slabs in low stepped ledges, 1.5 m each
  for (const p of pads) { const pd = Math.hypot(x - p[0], z - p[1]); if (pd < p[2] + 10) h += (p[3] - h) * (1 - sst(p[2], p[2] + 10, pd)); }   // level rock under a landed raft
  const m = Math.hypot(x - RING[0], z - RING[2]);
  h += 5.2 * Math.max(0, 1 - m / 150) ** 1.5 * fade;                                            // the ground rises to the ring's table
  if (m < 30) h = Math.max(h, RING[1] - 10 - Math.max(0, m - 14) * 0.5);                        // the ring's table of rock, clear and higher: its top 10 m under the ring's middle
  const rv = Math.abs(z - riverZ(x)); if (x < -110 && rv < 60) h = Math.min(h, 168.9 + Math.max(0, rv - 9) * 0.12);   // the river's bed
  if (path) { const q = path.nearestXZ(x, z); if (q.dist < 40 && z < -880) { h = Math.min(h, q.y - 9.6 + q.dist * 0.05); h += fade * Math.max(0, q.y - 15.5 - q.dist * 0.2 - h); } }   // the way runs 10 to 15 m over the rock
  return h;
}
export const riverCourse = () => [-760, -620, -480, -340, -220, -150, -119].map((x) => [x, 169.75, riverZ(x)]);

const LAND_VERT = /* glsl */`
attribute vec3 aSK; varying vec3 vW, vN, vSK;
#include <fog_pars_vertex>
void main(){ vec4 mvPosition = viewMatrix*vec4(position, 1.); gl_Position = projectionMatrix*mvPosition; vW = position; vN = normal; vSK = aSK;
  #include <fog_vertex>
}`;
const NOISE = /* glsl */`
float h1(vec2 p){ vec3 q = fract(vec3(p.xyx)*.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y)*q.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f); return mix(mix(h1(i), h1(i + vec2(1., 0.)), f.x), mix(h1(i + vec2(0., 1.)), h1(i + vec2(1., 1.)), f.x), f.y); }
float fb(vec2 p){ return .5*vn(p) + .3*vn(p*2.03 + 7.) + .2*vn(p*4.1 + 19.); }`;
const LAND_FRAG = /* glsl */`
uniform vec3 uSun, uSunCol, uSkyCol, uGroundCol; uniform float uTime; uniform vec4 uBun[16], uRing; uniform vec3 uBunC[16];
varying vec3 vW, vN, vSK;
#include <fog_pars_fragment>
${NOISE}
// the wall's quartzite at a place: s runs along the face, y up; ny is the face's upward lean
vec3 wallRock(float s, float y, float fw, float ny){
    // beds 4 to 24 m thick. The sum always rises with height (by .03 a metre at the least: the noise's steepest slope is 1.5 a cell), so a bed is a
    // level band that waves a little and never closes into a loop
    float by = y/6.5 + 1.5*vn(vec2(1.3, y*.05)) + .6*vn(vec2(s*.007, y*.006)) + .2*vn(vec2(s*.045, y*.02)), bed = floor(by), fy = by - bed, hb = h1(vec2(bed, 5.));
    float big = fb(vec2(s*.0045, y*.0042)), mid = fb(vec2(s*.021 + 5., y*.027));
    vec3 rock = mix(vec3(.45, .28, .25), vec3(.54, .37, .17), smoothstep(.3, .7, hb*.2 + big*.92));      // pink-grey and ochre, in great patches
    rock = mix(rock, vec3(.33, .29, .3), smoothstep(.5, .8, vn(vec2(s*.011, y*.016 + 9.)))*.8);          // grey weathered faces
    rock = mix(rock, mix(vec3(.6, .4, .34), vec3(.66, .55, .38), h1(vec2(bed, 2.))), .42*h1(vec2(bed, 7.)));   // bed by bed a change of colour: rose, cream
    rock *= (.76 + .48*mid)*(.88 + .24*hb)*(.8 + .4*fb(vec2(s*.09, y*.13)));
    float keepM = 1. - smoothstep(3., 16., fw), keepN = 1. - smoothstep(.2, 1.3, fw);
    rock *= 1. + (.13*smoothstep(.78, .97, fy) - .36*(1. - smoothstep(0., .13 + fw*.2, fy)))*keepM;    // each bed's lit rim, and the dark seam under the bed
    // upright joints, two families. The wide ones (6 to 16 m apart: the spacing wanders) run through four beds at a stroke and end at a seam,
    // set off from those of the four beds above and below, with a small lean; half of them are open. The narrow ones (1.5 to 5 m apart, one in
    // five open) stand within one bed and show only where the wall is near. A joint is a straight crack, never the outline of a noise (such
    // outlines close into loops), and no two courses bond like brickwork
    float gb = floor(by*.25), hg = h1(vec2(gb, 17.));
    float j1 = (s + 6.*vn(vec2(s*.045, gb*1.3)))/11. + hg*7.3 + .1*vn(vec2(gb*1.7, y*.035)), j2 = (s + 2.4*vn(vec2(s*.13, bed*3.7 + 2.)))/3.1 + hb*3.1 + .06*vn(vec2(bed*2.3 + 5., y*.3));
    float c1 = abs(fract(j1) - .5)*11., c2 = abs(fract(j2) - .5)*3.1;                                    // about the metres to the nearest joint of each family
    float on1 = step(.5, h1(vec2(floor(j1), gb + 11.))), on2 = step(.8, h1(vec2(floor(j2), bed + 23.)));
    rock *= 1. - .5*max((1. - smoothstep(.03, .1 + fw*1.2, c1))*on1*keepM, (1. - smoothstep(.015, .05 + fw*1.2, c2))*on2*(1. - smoothstep(.1, .5, fw))*.45);
    float fl = fract(y/.9 + .7*vn(vec2(s*.05, y*.2)) + hb*3.);
    rock *= mix(1., (.8 + .4*fb(vec2(s*.6, y*.9)))*(.62 + .38*smoothstep(0., .34, fl))*(.8 + .4*vn(vec2(s*3.1, y*4.3))), keepN);   // near: thin laminations, grain
    float keepP = 1. - smoothstep(.3, 2.2, fw), py = y/2.4 + 1.6*vn(vec2(s*.013, y*.03)) + 1.1*vn(vec2(s*.004 + 3., y*.1)) + .5*vn(vec2(s*.06, y*.08)) + hb*5., hp = h1(vec2(floor(py), 9.));   // rises with height everywhere (.12 a metre at the least): partings wave, none loops
    rock *= (1. - (.06 + .3*hp*hp)*(1. - smoothstep(0., .12 + fw*.35, py - floor(py)))*keepP)*mix(1., .8 + .4*hp, keepP);   // near and middle: partings within a bed, each its own shade
    float grp = smoothstep(.48, .7, vn(vec2(s*.013, 4.3))), thr = smoothstep(.6, .82, vn(vec2(s*.2, 1.7)))*(.45 + .55*vn(vec2((s + hb*1.1)*1.3, y*.01)))*(.6 + .4*h1(vec2(bed, 31.)));   // each bed takes the stain its own way: a thread is broken at the seams
    float ylen = 150. - 480.*vn(vec2(s*.33, 9.1));
    float wet = grp*thr*smoothstep(ylen - 70., ylen + 40., y)*(.6 + .4*vn(vec2(s*.6, y*.035)));          // black where water runs: narrow threads, each its own length
    wet = max(wet, (1. - smoothstep(4., 16., abs(vW.z + 700.)))*step(vW.x, -100.)*.95);                  // the dark ledge of the fall
    rock = mix(rock, vec3(.04, .04, .045), clamp(wet*1.15, 0., .88));
    float lm = smoothstep(.3, .52, vn(vec2(s*.03, bed*3.1)))*smoothstep(.22, .5, vn(vec2(s*.12, bed*1.7 + y*.03)));   // where a ledge carries a garden, and the green that trails down from it
    float ledge = max(max(smoothstep(.66, .92, fy), smoothstep(.2, .7, fy)*smoothstep(.45, .7, vn(vec2(s*.8, bed*1.3))))*lm, smoothstep(.3, .62, ny)*smoothstep(.26, .54, vn(vec2(s*.12, bed*1.7 + y*.03))));
    rock = mix(rock, mix(rock*1.3, vec3(.055, .15, .04)*(.6 + .8*vn(vec2(s*.7, y*.5)))*mix(1., .5 + h1(floor(vec2(s, y)*2.5)), keepN*.8), smoothstep(.25, .5, vn(vec2(s*.21, bed)))), ledge*.9);   // pale ledges, hanging gardens (tufts when near)
    float fringe = smoothstep(138., 169., y)*smoothstep(.4, .66, vn(vec2(s*.045, 7.3)))*smoothstep(.38, .75, vn(vec2(s*.9, y*.07)) + .4*smoothstep(158., 170., y));
    rock = mix(rock, vec3(.07, .2, .05)*(.65 + .7*vn(vec2(s*1.3, y*.8))), fringe*.85);                                    // gardens that trail down from the rim, in stretches
    rock = mix(rock, vec3(.3, .16, .1)*(.7 + .6*vn(vW.xz*.08)), 1. - smoothstep(-360., -300., y));                        // red-brown scree
  return rock;
}
void main(){
  vec3 n = normalize(vN), V = normalize(cameraPosition - vW), col; float s = vW.x - vW.z, y = vW.y, fw = length(fwidth(vW)), ft = sqrt(max(length(dFdx(vW))*length(dFdy(vW)), 1e-8)), pool = 0., topK = step(.5, vSK.y), rimD = (vSK.y - 1.)*1000.;
  if(vSK.y < .5){
    vec3 fc = cross(dFdx(vW), dFdy(vW)); fc = fc/max(length(fc), 1e-9); if(dot(fc, V) < 0.) fc = -fc;
    n = normalize(mix(n, fc, .22));                                                          // planes of rock, not folds of cloth                                                   // the wall: quartzite in level beds of uneven thickness
    vec3 an = abs(normalize(vN)); float wx = an.x*an.x*an.x*an.x, wz = an.z*an.z*an.z*an.z; wx = wx/max(wx + wz, 1e-5); wz = 1. - wx;
    float ny = normalize(vN).y; col = vec3(0.);                       // by three axes, nothing stretched: a face that looks east or west is drawn by z and height, one that looks
    if(wx > .03) col += wx*wallRock(vW.z + 37., y, fw, ny);             // north or south by x and height (blended where it turns), and what lies level is a ledge, drawn in plan
    if(wz > .03) col += wz*wallRock(vW.x, y, fw, ny);
    float lvl = smoothstep(.4, .75, max(ny, fc.y));                    // a face that lies near level is a shelf: it is drawn in plan, as the top is, so that no bed is stretched across it
    if(lvl > 0.){ vec2 q = vW.xz; vec3 sh = mix(vec3(.47, .3, .24), vec3(.58, .41, .24), vn(q*.09))*(.82 + .36*vn(q*.21));
      sh = mix(sh, vec3(.1, .22, .06)*(.7 + .6*vn(q*1.3)), smoothstep(.5, .72, vn(q*.06 + 21.))*.85); col = mix(col, sh, lvl); }
  } else {                                                          // the top: bare sandstone of the wall's own warm colours, a few wandering fissures, sand and moss beside them, many still pools
    vec2 p = vW.xz;                                                 // level ground seen low: ft is the mean of a pixel's two reaches, so its drawing holds far out
    float keep = 1. - smoothstep(.5, 4., ft), keepB = 1. - smoothstep(2., 14., ft), keepN = 1. - smoothstep(.06, .5, ft);
    float t5 = vn(p*.022 + 9.)*5. + .35*vn(p*.07), st = fract(t5), plate = h1(vec2(floor(t5), 3.));
    float edge = (1. - smoothstep(0., .03 + ft*.2, st))*keepB;                                           // a slab's edge
    float f1 = abs(vn(p*.031 + 3.) - .5), f2 = abs(vn(p*.012 + 41.) - .5);                               // two families of fissures that wander, each of uneven width
    float w1 = .003 + .016*vn(p*.09 + 2.), w2 = .002 + .01*vn(p*.05 + 8.);
    float fis = max(1. - smoothstep(w1*.5, w1 + ft*.012, f1), 1. - smoothstep(w2*.5, w2 + ft*.005, f2))*keepB;
    float along = max(1. - smoothstep(w1, w1*4. + .02, f1), 1. - smoothstep(w2, w2*4. + .012, f2));        // the ground beside a fissure
    vec3 rock = mix(vec3(.47, .3, .24), vec3(.58, .41, .24), plate)*(.82 + .36*vn(p*.21))*(.9 + .2*vn(p*.045 + 5.));   // rose and ochre, slab by slab
    rock = mix(rock, vec3(.36, .32, .3), smoothstep(.55, .8, vn(p*.03 + 12.))*.5);                       // grey weathered rock
    rock *= 1. - .5*smoothstep(.76, .82, vn(p*.33 + 40.))*keep;                                          // potholes
    rock *= mix(1., .84 + .32*h1(floor(p*4.)), keepN*.5);                                                // near: grain
    float riser = 1. - smoothstep(.9, .985, n.y); rock = mix(rock, vec3(.16, .11, .09), riser*.6);       // the face of a low step
    float sand = max(along*smoothstep(.45, .7, vn(p*.07 + 4.)), smoothstep(.8, .84, vn(p*.05 + 3.) + .1*vn(p*.21)))*(1. - riser);   // pink sand: small drifts beside fissures and in hollows
    float rip = sin(dot(p, vec2(.8, .6))*5.5 + 6.*vn(p*.4));
    rock = mix(rock, vec3(.74, .5, .45)*mix(1., 1. + .1*rip, keepN), sand*.9);
    float moss = along*smoothstep(.5, .75, vn(p*.13 + 21.))*(1. - sand);                                 // moss in drifts along the fissures
    rock = mix(rock, vec3(.12, .24, .07)*(.7 + .6*vn(p*1.7)), moss*.8);
    rock = mix(rock, vec3(.06, .045, .04), max(fis*.85, edge*.5));
    float q = step(.988, h1(floor(p*2.2)))*keep*(1. - sand*.5);                                          // quartz that glints
    col = rock + q*2.2*pow(max(dot(reflect(-V, n), uSun), 1e-4), 6.);
    float riv = (1. - smoothstep(6., 13., abs(vW.z - vSK.z)))*step(vW.x, -112.), lev = smoothstep(.975, .995, n.y);
    col = mix(col, vec3(.11, .075, .045), riv);                                                          // the tea river's wet bed
    float rm = length(p - uRing.xz), pf = vn(p*.014 + 77.) + .1*vn(p*.09 + 5.), pf2 = vn(p*.047 + 13.) + .12*vn(p*.2 + 3.);   // many still pools, large and small, with crisp shores
    pf += .16*(1. - smoothstep(22., 30., abs(rm - 44.)))*step(.45, vn(p*.05 + 31.));
    float feet = 0.;                                                                                     // one more at each low bunch's feet, on the side of the avenue's axis
    for(int i = 0; i < 16; i++){ vec2 c = uBun[i].xz + vec2(sign(uRing.x + 8. - uBun[i].x)*12., 0.); feet = max(feet, (1. - smoothstep(5., 6.5, length((p - c)*vec2(1.5, .8)) + 1.5*vn(p*.3)))*step(.5, uBun[i].w)*step(uBun[i].w, 20.)); }
    float rill = (1. - smoothstep(w2*.3, w2*.8 + ft*.004, f2))*keepB;                                    // rills: water standing in the long fissures
    float wat = max(max(smoothstep(.7, .712 + fw*.02, pf), smoothstep(.74, .755 + fw*.02, pf2)), max(feet, rill));
    float deepK = max(smoothstep(.722, .74, pf), smoothstep(.765, .78, pf2));                             // well inside a large pool the water covers a low step of the slabs too (a tilt under about 20 degrees): one sheet, never a dry facet standing in it; steeper rock (the ring's table, a pad's flank) stays dry
    pool = wat*max(lev, deepK*smoothstep(.925, .955, n.y))*(1. - riv)*smoothstep(10., 24., rimD)*smoothstep(17., 20., rm);
    col *= 1. - .45*max(smoothstep(.672, .7, pf), smoothstep(.71, .74, pf2))*lev;                        // a wet dark shore
    col += (rock + .1)*vec3(1., .84, .58)*uRing.w*4.5/(1. + rm*rm*.0022)*(1. - smoothstep(70., 130., rm));   // the ring's glow lying on the rock
  }
  float ndl = max(dot(n, uSun), 0.), rec = (1. - topK)*clamp(vSK.z, 0., 1.);
  col = col*(uSunCol*(ndl + .12*topK)*(1. - .75*rec) + mix(uGroundCol*.7, uSkyCol*(1. + .5*topK), n.y*.5 + .5)*(1. - .5*rec)
    + uSkyCol*vec3(.7, .84, 1.08)*.45*(1. - topK)*(1. - smoothstep(0., .3, ndl))*(1. - .4*rec))*.3183;      // rock in shade takes the sky's blue light: its beds still read
  float gz = 1. - max(V.y, 0.), g2 = gz*gz;
  vec3 mirror = mix(uSkyCol*.2, mix(uSkyCol*.34, uSkyCol*.46 + uSunCol*.07, g2*g2), .06 + .94*g2*g2);   // a pool takes the sky's colour
  mirror += uSunCol*pow(max(dot(reflect(-V, vec3(0., 1., 0.)), uSun), 1e-4), 500.)*1.5;
  float shd = 0.;                                                    // the low bunches' shadows lie long across the top (a disc each, thrown down the sun)
  for(int i = 0; i < 16; i++){ float w = uBun[i].w; vec2 sc = uBun[i].xz - uSun.xz*max(uBun[i].y - y, 0.)/max(uSun.y, .08); shd = max(shd, (1. - smoothstep(w*.5, max(w*1.05, w*.5 + .01), length(vW.xz - sc)))*step(.5, w)); }
  col = mix(col, col*vec3(.36, .43, .6), shd*topK);
  col = mix(col, mirror, pool);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// the rim as drawn, the distance in from it, and the top's height for standing things on (plain numbers)
export function makeLandPlan(noise, path) {
  const pads = [];                                                  // [x, z, radius, height]: this build's level pads, filled by the plan as buildings land
  const inset = (x, z) => Math.min(Math.max(Math.min(WEST - x, SOUTH - z), NORTH - z), x + 1400, 380 - x);
  // the rim crossing, found at build from the path and the plan's lines: the first route metre whose plan place lies inside the walls
  let crossAt = Math.floor(path.length); for (let s = 0; s <= path.length; s += 1) { const p = path.posAtDist(s); if (inset(p.x, p.z) > 0) { crossAt = s; break; } }
  const cp = path.posAtDist(crossAt), cross = [cp.x, cp.z], P = planCurve();
  let crossS = 0, cb = 1e9; for (const q of P) { const d = Math.hypot(q.x - cross[0], q.z - cross[1]); if (d < cb) { cb = d; crossS = q.s; } }
  const rim = P.map((q) => { const o = wallOff(noise, q.s, TOP, crossS); return [q.x + q.nx * o, q.z + q.nz * o]; });
  const rimDist = (x, z) => {
    if (inset(x, z) > 115) return 99;
    let b = 1e9;
    for (let i = 0; i < rim.length - 1; i++) { const a = rim[i], c = rim[i + 1], dx = c[0] - a[0], dz = c[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz + 1e-9))), d = Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); if (d < b) b = d; }
    return b;
  };
  const topAt = (x, z) => { const d = rimDist(x, z); return topHeight(noise, x, z, d, path, pads) - (d > 75 ? 0.5 : 0); };
  return { P, rim, inset, rimDist, topAt, pads, cross, crossS, crossAt };
}

const tensor = (a, b, dense, coarse) => { const L = []; for (let v = a; v < b;) { L.push(v); let st = coarse; for (const [lo, hi, s] of dense) if (v >= lo - s && v < hi) st = s; v += st; } L.push(b); return L; };
// the mountain as drawn: walls (plan curve by rows of height), a band of top that follows the rim, and the inner top
export async function makeMountain(plan, noise, path, light, yieldFn, mirrors = []) {
  const { P } = plan, rows = [];
  for (let y = TOP; y > 110; y -= 6) rows.push(y); for (let y = 110; y > -100; y -= 11) rows.push(y); for (let y = -100; y > -330; y -= 26) rows.push(y); rows.push(-340, -385, FLOOR - 8);
  const pos = [], sk = [], idx = [], nP = P.length, nR = rows.length;
  for (let i = 0; i < nP; i++) { const q = P[i]; for (const y of rows) { const [o, rec] = wallRelief(noise, q.s, y, plan.crossS); pos.push(q.x + q.nx * o, y, q.z + q.nz * o); sk.push(q.s, 0, rec); } if (i % 40 === 0) await yieldFn(); }
  for (let i = 0; i < nP - 1; i++) for (let j = 0; j < nR - 1; j++) { const a = i * nR + j, b = a + nR; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const band = [0, 3, 7, 12, 19, 28, 40, 56, 75], nB = band.length, b0 = pos.length / 3;
  for (let i = 0; i < nP; i++) { const q = P[i], r = plan.rim[i]; for (const d of band) { const x = r[0] - q.nx * d, z = r[1] - q.nz * d; pos.push(x, d ? topHeight(noise, x, z, plan.rimDist(x, z), path, plan.pads) : TOP, z); sk.push(q.s, 1 + d / 1000, -700 + 11 * Math.sin(x / 70) * Math.min(1, Math.max(0, (-135 - x) / 80))); } if (i % 20 === 0) await yieldFn(); }
  for (let i = 0; i < nP - 1; i++) for (let j = 0; j < nB - 1; j++) { const a = b0 + i * nB + j, b = a + nB; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const xs = tensor(-1400, 380, [[-205, 85, 5]], 60), zs = tensor(-2000, -385, [[-1410, -905, 5], [-735, -665, 5]], 40), g0 = pos.length / 3, nx = xs.length, nz = zs.length;
  for (let j = 0; j < nz; j++) { for (let i = 0; i < nx; i++) { const x = xs[i], z = zs[j], d = plan.rimDist(x, z); pos.push(x, topHeight(noise, x, z, Math.max(d, 30), path, plan.pads) - 0.5, z); sk.push(0, 1.2, -700 + 11 * Math.sin(x / 70) * Math.min(1, Math.max(0, (-135 - x) / 80))); } if (j % 6 === 0) await yieldFn(); }
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    if (plan.inset((xs[i] + xs[i + 1]) / 2, (zs[j] + zs[j + 1]) / 2) < 38 || plan.inset(xs[i], zs[j]) < 30 || plan.inset(xs[i + 1], zs[j + 1]) < 30 || plan.inset(xs[i + 1], zs[j]) < 30 || plan.inset(xs[i], zs[j + 1]) < 30) continue;
    const a = g0 + j * nx + i, b = a + nx; idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  await yieldFn();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); await yieldFn(); g.setAttribute('aSK', new THREE.Float32BufferAttribute(sk, 3)); g.setIndex(idx);
  await yieldFn(); g.computeVertexNormals(); await yieldFn(); g.computeBoundingSphere();
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]);
  Object.assign(uniforms, { uTime: { value: 0 }, uSun: { value: light.sun }, uSunCol: { value: light.sunCol }, uSkyCol: { value: light.sky }, uGroundCol: { value: light.ground } });
  const bun = [], bunC = [];                                        // up to 16 bunches for the pools to mirror: [x, y, z, reach, r, g, b]
  for (let i = 0; i < 16; i++) { const m = mirrors[i] || [0, 0, 0, 0, 0, 0, 0]; bun.push(new THREE.Vector4(m[0], m[1], m[2], m[3])); bunC.push(new THREE.Vector3(m[4], m[5], m[6])); }
  uniforms.uBun = { value: bun }; uniforms.uBunC = { value: bunC }; uniforms.uRing = { value: new THREE.Vector4(RING[0], RING[1], RING[2], 0.6) };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ name: 'hosMountain', uniforms, vertexShader: LAND_VERT, fragmentShader: LAND_FRAG, fog: true, side: THREE.DoubleSide }));   // both sides: no fold of the skin may open a hole
  mesh.name = 'tableMountain';
  return { object: mesh, uniforms, triangles: idx.length / 3 };
}

// the forest floor 600 m down (canopy, one brown river with sandbanks, mist in the hollows) and the cloud sea's own
// floor, which ends in shreds toward the bay so that beside the mountain one looks straight down
export function makeFloors(noise, light, cloud) {
  const fg = new THREE.PlaneGeometry(5200, 5200, 40, 40); fg.rotateX(-Math.PI / 2); fg.translate(200, 0, -900);
  const fp = fg.attributes.position; for (let i = 0; i < fp.count; i++) fp.setY(i, FLOOR + 30 * noise.n2(fp.getX(i) / 420, fp.getZ(i) / 420));
  fg.computeVertexNormals();
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]);
  Object.assign(uniforms, { uTime: { value: 0 }, uSun: { value: light.sun }, uSunCol: { value: light.sunCol }, uSkyCol: { value: light.sky }, uGroundCol: { value: light.ground },
    uLit: { value: cloud.lit }, uShade: { value: cloud.shade } });
  const vert = /* glsl */`varying vec3 vW;
    #include <fog_pars_vertex>
    void main(){ vec4 mvPosition = viewMatrix*vec4(position, 1.); gl_Position = projectionMatrix*mvPosition; vW = position;
    #include <fog_vertex>
    }`;
  const forest = new THREE.Mesh(fg, new THREE.ShaderMaterial({ name: 'hosForest', uniforms, fog: true, vertexShader: vert, fragmentShader: /* glsl */`
    uniform vec3 uSun, uSunCol, uSkyCol; uniform float uTime; varying vec3 vW;
    #include <fog_pars_fragment>
    ${NOISE}
    float crown(vec2 p){ return .6*vn(p*.075) + .4*vn(p*.19 + 13.); }
    void main(){
      vec2 p = vW.xz; float fw = length(fwidth(p)), keep = 1. - smoothstep(4., 30., fw);
      float c = crown(p), e = 2.5;
      vec3 n = normalize(vec3((crown(p - vec2(e, 0.)) - crown(p + vec2(e, 0.)))*9.*keep, 1., (crown(p - vec2(0., e)) - crown(p + vec2(0., e)))*9.*keep));
      vec3 col = mix(vec3(.035, .11, .03), vec3(.16, .3, .07), smoothstep(.25, .8, c))*(.75 + .5*vn(p*.011));
      col = mix(col, vec3(.3, .4, .1), smoothstep(.78, .9, vn(p*.03 + 50.))*keep*.8);                    // emergent crowns
      float rv = abs(fb(p*.0011 + 2.) - .5), w = .012 + .008*vn(p*.004);
      col = mix(col, vec3(.6, .5, .32), 1. - smoothstep(w*1.6, w*2.3, rv));                               // sandbanks
      col = mix(col, vec3(.3, .2, .1) + .25*uSkyCol*.3183, 1. - smoothstep(w*.8, w*1.1, rv));              // the brown river
      col = col*(uSunCol*max(dot(n, uSun), 0.)*(.55 + .45*c) + uSkyCol*.9)*.3183;
      float mist = smoothstep(.52, .75, fb(p*.0035 + vec2(uTime*.004, 0.)))*(1. - smoothstep(.3, .62, vn(p*.0016 + 9.)));
      col = mix(col, (uSunCol*.5 + uSkyCol)*.26, mist*.8);                                                 // morning mist in the hollows
      col = mix(col, uSkyCol*.3, .28);                                                                     // 600 m of air
      gl_FragColor = vec4(col, 1.);
      #include <fog_fragment>
    }` }));
  forest.name = 'forestFloor';
  const cg = new THREE.PlaneGeometry(9000, 9000, 1, 1); cg.rotateX(-Math.PI / 2); cg.translate(0, cloud.y, 0);
  const floor = new THREE.Mesh(cg, new THREE.ShaderMaterial({ name: 'hosCloudFloor', uniforms, fog: true, transparent: true, depthWrite: false, vertexShader: vert, fragmentShader: /* glsl */`
    uniform vec3 uSun, uSunCol, uLit, uShade; uniform float uTime; varying vec3 vW;
    #include <fog_pars_fragment>
    ${NOISE}
    void main(){
      vec2 p = vW.xz + vec2(uTime*2., uTime*.8); float b = fb(p*.006), b2 = fb(p*.021 + 5.);
      float d1 = length(max(vec2(vW.x + 120., vW.z + 420.), 0.)), d2 = length(max(vec2(vW.x - 380., vW.z + 900.), 0.)), dBay = max(vW.z + 520., vW.x - 520.) + 70.*(fb(vW.xz*.009) - .5);
      float open = min(min(smoothstep(20., 95., d1 - 60.*b2), smoothstep(20., 95., d2 - 60.*b2)), smoothstep(-30., 60., dBay - 50.*b2));      // shreds, then nothing, toward the walls
      float a = open*smoothstep(.12, .5, b + .5*b2 - .15 + .6*open)*(1. - smoothstep(3200., 4400., length(vW.xz - vec2(-50., -700.))));
      vec3 col = mix(uShade, uLit, smoothstep(.3, .75, b*.6 + b2*.5));
      gl_FragColor = vec4(col, a);
      #include <fog_fragment>
    }` }));
  floor.name = 'cloudFloor'; floor.renderOrder = 1; floor.frustumCulled = false;
  return { forest, floor, uniforms };
}

// the one fall: three sheets that leave the lip, lean out, widen, fray into veils and are all mist before the forest
export function makeFall(light) {
  const N = 46, P = [], U = [], I = [];
  for (let s = 0; s < 3; s++) for (let k = 0; k <= N; k++) {
    const t = k / N, y = LIP[1] - 0.4 - 560 * t ** 1.45, x = LIP[0] + 2 + s * 2.2 + (26 + s * 7) * (1 - Math.exp(-t * 2.6)), w = 5.5 + 34 * t ** 1.1 + s * 1.5;
    P.push(x, y, LIP[2] - w, x, y, LIP[2] + w); U.push(-1, t, s, 1, t, s);
    if (k < N) { const a = (s * (N + 1) + k) * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aU', new THREE.Float32BufferAttribute(U, 3)); g.setIndex(I); g.computeBoundingSphere();
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]);
  Object.assign(uniforms, { uTime: { value: 0 }, uSun: { value: light.sun }, uSunCol: { value: light.sunCol }, uSkyCol: { value: light.sky } });
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ name: 'hosFall', uniforms, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec3 aU; varying vec3 vU, vW;
      #include <fog_pars_vertex>
      void main(){ vec4 mvPosition = viewMatrix*vec4(position, 1.); gl_Position = projectionMatrix*mvPosition; vU = aU; vW = position;
      #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSun, uSunCol, uSkyCol; uniform float uTime; varying vec3 vU, vW;
      #include <fog_pars_fragment>
      ${NOISE}
      void main(){
        float t = clamp(vU.y, 0., 1.), x = vU.x;
        // the seconds a drop has fallen to this height (it falls faster as it goes: 26 m a second at the lip, 86 at the foot). The strands are
        // drawn on that clock and ride down with the water, so they keep their drawing however long the world's clock has run: nothing shears
        float fu = sqrt(clamp((${LIP[1].toFixed(1)} - vW.y)/560., 0., 1.)), tau = 18.667*(fu - .43333*log(1. + 2.3077*fu));
        float nstr = mix(9. + vU.z*3., 3.5, smoothstep(.12, .8, t));                                 // its strands gather into a few wide veils
        float st = vn(vec2(x*nstr + vU.z*17., (tau - uTime)*.8 + 80.)), st2 = vn(vec2(x*23. + vU.z*5., (tau - uTime)*3.3 + 300.));
        float rag = .5 + .45*vn(vec2(vW.y*.03 + vU.z*7., uTime*.2));                                 // a ragged, fraying edge
        float body = st*.65 + st2*.35, edge = 1. - smoothstep(.2, .95, abs(x) + .5*(rag - .7) + .3*(vn(vec2(x*4. + vU.z*3., vW.y*.09)) - .5));
        float strands = smoothstep(.3, .72, st*.55 + st2*.6);
        float water = edge*mix(strands, 1., .6*(1. - smoothstep(0., .5, t)))*(1. - smoothstep(.5, .88, t))*mix(.95, .6, t);
        float mist = edge*smoothstep(.2, .6, t)*(1. - smoothstep(.8, 1., t))*(.22 + .45*st)*.6;      // and all of it is mist before the forest
        float a = max(water, mist);
        vec3 V = normalize(cameraPosition - vW); float back = pow(max(dot(-V, uSun), 1e-4), 3.);
        vec3 col = mix(vec3(.6, .4, .2), mix(vec3(.62, .68, .76), vec3(.97), smoothstep(.3, .75, st2*.6 + st*.5)), smoothstep(0., .06, t + body*.03))*(uSunCol*(.6 + .7*back) + uSkyCol)*.3183;
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }` }));
  mesh.name = 'theFall'; mesh.renderOrder = 1.5;
  return { object: mesh, uniforms };
}

// soft mist with no edge (a medium, dealt clear of the route by the world file: the plume that stands in the bay under the fall, shreds
// that cling to the walls): camera-facing veils, one instanced draw. list: [x, y, z, half width, half height, alpha, phase]
export function makeVeils(list, light) {
  const g = new THREE.InstancedBufferGeometry(), n = list.length, A = new Float32Array(n * 4), S = new Float32Array(n * 4), box = new THREE.Box3(), v = new THREE.Vector3();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  list.forEach((q, i) => { A.set([q[0], q[1], q[2], q[6]], i * 4); S.set([q[3], q[4], q[5], q[7] || 0], i * 4); box.expandByPoint(v.set(q[0], q[1], q[2])); });
  g.setAttribute('aC', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(S, 4)); g.instanceCount = n;
  g.boundingSphere = box.getBoundingSphere(new THREE.Sphere()); g.boundingSphere.radius += 260;
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]);
  Object.assign(uniforms, { uTime: { value: 0 }, uSunCol: { value: light.sunCol }, uSkyCol: { value: light.sky } });
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ name: 'hosVeils', uniforms, fog: true, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`attribute vec4 aC, aS; uniform float uTime; varying vec2 vUv; varying float vA, vPh;
      #include <fog_pars_vertex>
      void main(){
        vec3 c = aC.xyz + vec3(14.*sin(uTime*.11 + aC.w), 4.*sin(uTime*.07 + aC.w*1.7), 10.*sin(uTime*.09 + aC.w*2.3));   // a bounded drift along the walls
        float h = mod(uTime*aS.w + aC.w*3.5, 22.), sm = step(.001, aS.w), grow = mix(1., .35 + h*.09, sm);                // smoke (aS.w > 0): it rises 22 m from its stack, widens, thins, and begins again
        c = mix(c, aC.xyz + vec3(1.2*sin(h*.3 + aC.w) + h*.28, h, 1.*sin(h*.23 + aC.w*2.)), sm);
        vec4 mvPosition = viewMatrix*vec4(c, 1.);
        vA = aS.z*mix(smoothstep(.6, 2.5, length(mvPosition.xyz)), smoothstep(0., 2.5, h)*(1. - h/22.), sm); vUv = position.xy; vPh = aC.w;   // a veil thins only by true distance, inside 0.6 to 2.5 m of the eye (none is dealt where the route comes)
        mvPosition.xy += position.xy*aS.xy*grow;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`uniform vec3 uSunCol, uSkyCol; uniform float uTime; varying vec2 vUv; varying float vA, vPh;
      #include <fog_pars_fragment>
      ${NOISE}
      void main(){
        float r = length(vUv), nz = fb(vUv*1.6 + vec2(vPh*3.1 + uTime*.012, vPh*1.7));
        float a = vA*(1. - smoothstep(.1, 1., r + .55*(nz - .5)))*(.5 + .7*nz);
        gl_FragColor = vec4((uSunCol*.5 + uSkyCol*.9)*.3183*vec3(.96, .98, 1.), a);
        #include <fog_fragment>
      }` }));
  mesh.name = 'mistVeils'; mesh.renderOrder = 2;
  return { object: mesh, uniforms };
}

// three or four more table mountains, far off, pale in the air
export function makeFarTepuis(rng, noise) {
  const geos = [];
  for (const [x, z, r, top] of [[3100, -1500, 620, 200], [1900, -3300, 520, 250], [3000, 900, 700, 170], [-700, -4600, 800, 230], [1500, 2600, 560, 190]]) {
    const g = new THREE.CylinderGeometry(r * 0.92, r * 1.12, top + 120, 30, 4, false), p = g.attributes.position, ph = rng() * 9;
    for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), k = 1 + 0.2 * noise.n2(Math.cos(a) * 1.6 + ph, Math.sin(a) * 1.6) + 0.06 * noise.n2(a * 5 + ph, p.getY(i) / 90); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k * 1.25); }
    g.translate(x, (top - 120) / 2, z); geos.push(g.toNonIndexed());
  }
  const n = geos.reduce((s, g) => s + g.attributes.position.count, 0), pos = new Float32Array(n * 3); let o = 0;
  for (const g of geos) { pos.set(g.attributes.position.array, o); o += g.attributes.position.count * 3; g.dispose(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: '#8f8690' })); mesh.name = 'farTableMountains';
  return mesh;
}
