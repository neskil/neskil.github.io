// THE GREAT FALL: hero set piece for the world "valley-of-falls".
//
// A 660 m wide granite head wall (horseshoe plan, wings curling toward +Z) with a 500 m, three-tier
// waterfall at its centre: a free-falling 25 m ribbon off the lip, a fan that spreads to ~60 m over
// the upper bench, and a bottom tier ~90 m wide whose foot is lost in a spray cloud. The water is heavy: a solid, sunlit
// white column from rim to rim, streaked with falling comet heads, blue-grey in the threads between them and at its ragged
// rims; each tier dies out on its bench and the next begins at its own lip as separate strands, the lips uneven column by
// column. The rock round it is a dark, soaked amphitheatre, so the column is the brightest thing on the wall. The spray is
// composed and lit as ONE cloud: a white boil at the foot, two shoulders that climb either side of the column (sunlit on the
// left, slate blue in the cloud's own shade on the right), a few towers, a skirt that rolls down-valley (+Z), a thin high
// veil, and a lane of clear air in front of the column and of the wet rock that flanks it. The world tells the cloud how
// near the traveller has come (uniforms.near, from the traveller's place on the route): close under the fall the lane is
// wider and starts lower, the boil squats and the spray
// streaming off the bottom tier thins, so the column comes down between the two shoulders against dark rock. A rainbow lives
// in that spray: it is computed from the real antisolar geometry and multiplied by the spray along each view ray, so it is a
// scrap of colour from far away and grows into an arch as the camera closes, with a ghost of a wider, paler, colour-reversed
// outer bow where the spray is thick and low; its feet come down into mist banks along the pool's two shores, and a cone of
// clear air opens from the portal's face. The bow is drawn on a curtain that stands in the spray (two planes that
// meet behind the column) and is depth-tested, so trees and boulders nearer than the spray hide it. hero.addBow() puts a
// second, small bow of the same kind into another spray (the valley's side fall). Plunge pool with foam and glints, an
// outflow river stub, conifers on the benches and talus, boulders round the pool.
//
// SPACE     origin = base centre at the foot of the fall, +Y up, front (the lit face, the side the
//           camera arrives from) = +Z. The camera comes up-valley travelling toward -Z.
// SIZE      radius ~300 m (wall spans x -330..330, z -430..+200; river stub runs out to z = 340), height ~590 m.
//           The wing ends taper to the ground and the back is a plain slope: bury both in the valley terrain.
// COST      ~90k triangles, 7 draw calls (+1 and 4.8k per extra bow), no lights, no render targets, no textures. Build ~250 ms in
//           steps of a few ms (buildHero is async and yields inside its loops). The mesh 'trees-and-boulders' carries the
//           boulderMaterial that the valley reuses for its talus and far trees (one shader program).
// SHARED    Also exported for the valley, so all three walls are one rock and all the falls one water: GLSL_NOISE (with rstep,
//           the falling smoothstep), GLSL_GRANITE + GRANITE (the granite paint and the JS twin of its bed field), GLSL_WATER
//           (gfWater; its last argument makes the water solid), boulderBuilder, boulderMaterial.
// RANDOM    One stream ('great-fall') for the wall, the pool, the boulders and the ribbons, in that order; the bench trees
//           ('bench-trees') and the spray ('plume') each draw from a fork of their own, so their counts move nothing else.
// LIGHT     Rock, trees and boulders are MeshStandardMaterial and take the scene's lights (wants a warm
//           key from behind the camera, i.e. from +Z, and a cool hemisphere fill). Water, mist and the
//           rainbow are unlit shaders that need the sun vector: pass opts.sunDir (WORLD space, pointing
//           TOWARD the sun) or leave it out and the piece adopts the first DirectionalLight it finds in
//           the scene it is added to. Brief default: 22 deg up, behind the camera, 15 deg left.
//           The rainbow only shows when the sun is behind the camera. All shaders honour scene fog.
//
// OPTS      palette   array of 7 hex strings (brief order: sky blue, haze, granite, white, green, yellow, pink)
//           sunDir    [x,y,z] or Vector3, world space, toward the sun (see LIGHT)
//           sunColor  hex, default '#fff1d6';  skyColor hex, default palette[0]
//           rainbow   0..2 overall rainbow gain (default 1)
//           mist      0..1.5 plume opacity gain (default 1)
//           detail    0.5..1 thins the plume's puffs (ctx.quality.detail)
//
// PROGRESS  hero.setProgress(u) with the world's path u: fades the rainbow in as the design has it (0 before u=0.35, full by
//           0.55), and nothing else. If it is never called the rainbow is fully on. hero.uniforms exposes { time, bow, second, gust, ceil, veil,
//           reach, near, sunDir, sunColor } for fine control (gust = plume opacity, ceil = height in metres above which the plume
//           fades out, veil = opacity of the thin drifting veil alone, reach = 0..1 how far the cloud rolls down-valley, near = 0..2
//           how near the traveller has come, from the traveller's place on the route (see above; 1 = close under the fall, 2 = at the portal), second = strength of the outer
//           bow as a share of the inner one: the world sets it ONCE at build, never per frame: 0.07 as live has it, 0.08 on the rare dewy morning).
//           hero.addBow({ center: [x, y, z], radius: [rx, ry, rz], gain, strength }) (local space, during the build): a small bow in
//           another spray volume, drawn on the upright plane z = center.z; one more draw call, the same shader program.
//
// ANCHORS   (all local space)
//           portalSeat   { position, facing, radius }: centre of the 14 m portal, 12 m above the pool,
//                        90 m in front of the foot of the fall at the near edge of the plume; facing is
//                        the direction the portal faces (toward the arriving camera, +Z).
//           flyThrough   ordered Vector3 list, a safe camera line up the outflow river to the portal
//                        (>= 10 m clear of every solid; last 120 m straight and level at y = 12).
//           viewpoints   { far, mid, close }: good camera positions (600 m, 330 m, 150 m out).
//           lookAt       where the camera should gaze (mid-height of the fall).
//           lip, ledgeUpper, ledgeLower, foot: where each tier starts / lands (for extra mist, birds).
//           poolCenter, poolRadius, riverStart { position, direction, width }: join your river here.
//           plumeCenter, plumeSize: the spray volume (do not plant anything tall inside it).
//           tiers { lip, upper, lower }: heights of the three lips; sprayReach { veil, skirt }: how far in front of the foot the
//                        high veil and the low skirt drift (the valley shapes the cloud from the traveller's place on the route with these).
//           rainbowApex  approximate top of the arch as seen from viewpoints.close with the brief's sun.
//           sunDirDefault  the sun vector the piece was art-directed for.
//           pool { x, z, rx, rz, level }, riverCourse { xAt(z), z0, z1, w0, w1, level }, footZ, wing, halfWidth:
//                        numbers the valley terrain needs to stay under the water and to bury the wing ends.
import * as THREE from 'three';
import { clamp, lerp, smoothstep as sst } from '../kit/core.js';

const DEFAULT_PALETTE = ['#3f78c9', '#cfe2f2', '#8d949c', '#f4f7fa', '#3f7a3a', '#d9c24a', '#ff6fa8'];
const HW = 330, LIP = 500, G = 9.81;

const GLSL_NOISE = /* glsl */`
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fb(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
float rstep(float hi, float lo, float x){ return 1.0 - smoothstep(lo, hi, x); }   // a falling smoothstep (edges in the wrong order are undefined in GLSL and break on Direct3D)
`;
export { GLSL_NOISE };
// GRANITE, one rock for the head wall, the valley walls and the near cliff. The wall is read as stacked beds 15 m thick whose
// boundaries wander (gnWarp); a boundary is a roof (the bed above overhangs it), a ledge (the bed below stands proud) or
// nothing (gnKind), and comes and goes along the wall (gnStr). The same three functions exist in JS (GRANITE below), so a
// mesh can be given the real relief and the paint lands on it: soft shadow under each roof, a lit lip, pale ledge tops,
// dark water streaks that hang from the breaks and taper downward, jointed blocks of slightly different warm and cool tone,
// lichen, mottling at 6 m and 1.5 m, speckle. Every layer fades before it gets thinner than a few pixels (px = metres per
// pixel on the face). geo = 1 where the mesh itself carries the beds (then the paint leaves their relief and most of their
// shadow to the mesh). al is the coordinate along the wall that the beds, their breaks and the joints are laid on (the mesh
// uses the same one); alF is a second one that never stands still on a face turned toward the camera, and carries every
// layer that would otherwise smear sideways there (mottling, grain, speckle, lichen, the streak cells). skK scales the
// streaks. Returns the colour; hOut is the relief in metres for a bump. Needs h21 / vn / fb.
export const GLSL_GRANITE = /* glsl */`
float gnWarp(float al, float y){ return 20.0 * sin(al * 0.0113 + 1.7) + 12.0 * sin(al * 0.0271 + y * 0.0043 + 0.6) + 5.0 * sin(al * 0.063 + 4.1) + al * 0.05; }
float gnStr(float bi, float al){ return smoothstep(-0.25, 0.35, sin(al * 0.019 + bi * 2.4) + 0.5 * sin(al * 0.047 + bi * 5.3))
    * smoothstep(-0.55, -0.15, sin(al * 0.13 + bi * 3.7) + 0.6 * sin(al * 0.29 + bi * 1.9)); }   // (a break runs 20-50 m, then dies out: broken ledges, not contour lines)
float gnKind(float bi){ float c = cos(bi * 2.399 + 0.7); return step(0.25, c) - step(c, -0.35); }
// 3D value noise for the fine mottling: a 2D pattern laid along the wall has one direction in which it stands still, and a
// face that runs that way (the far side of a slot, a buttress flank) is combed with sideways strokes; in 3D no face is
float gnH3(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float gnN3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(gnH3(i), gnH3(i + vec3(1.0, 0.0, 0.0)), f.x), mix(gnH3(i + vec3(0.0, 1.0, 0.0)), gnH3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
             mix(mix(gnH3(i + vec3(0.0, 0.0, 1.0)), gnH3(i + vec3(1.0, 0.0, 1.0)), f.x), mix(gnH3(i + vec3(0.0, 1.0, 1.0)), gnH3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
float gnF3(vec3 p){ return (0.5 * gnN3(p) + 0.25 * gnN3(p * 2.03 + 17.1) + 0.125 * gnN3(p * 4.12 + 51.8)) * 1.0714; }
vec3 gnGranite(vec3 base, float al, float alF, vec3 wp, float y, float px, float geo, float skK, out float hOut){
  float yb = y + gnWarp(al, y);
  float by = yb / 15.0, bi = floor(by), bf = by - bi;
  float kA = gnKind(bi), kB = gnKind(bi + 1.0), sA = gnStr(bi, al), sB = gnStr(bi + 1.0, al);
  float roofA = max(kA, 0.0) * sA, ledgeA = max(-kA, 0.0) * sA, roofB = max(kB, 0.0) * sB, ledgeB = max(-kB, 0.0) * sB;
  float f1 = 1.0 - smoothstep(1.5, 5.0, px), f2 = 1.0 - smoothstep(0.3, 1.1, px), f3 = 1.0 - smoothstep(0.07, 0.3, px);
  float e = clamp(px * 0.2, 0.12, 0.35), b1 = 1.0 - bf;
  float prof = roofA * b1 * sqrt(b1) * smoothstep(0.0, e, bf) + ledgeB * bf * sqrt(bf) * rstep(1.0, 1.0 - e, bf);
  float fw = smoothstep(0.4, 2.0, px);                                              // far away a shadow is a broad soft band, never a hairline
  float under = smoothstep(0.68 - 0.3 * fw, 1.0, bf); under *= under * roofB;       // the soft shadow a roof throws on the bed below it
  float lip = (1.0 - smoothstep(0.0, 0.12, bf)) * roofA;                            // the lit lower edge of an overhanging shell
  float top = smoothstep(0.86, 1.0, bf) * ledgeB;                                   // pale debris on a ledge
  float foot = (1.0 - smoothstep(0.0, 0.2, bf)) * ledgeA;                           // the wall just above a ledge
  // jointed blocks, two beds tall, staggered course by course
  float course = floor(bi * 0.5), bw = 24.0 * (1.0 + 0.35 * sin(course * 1.7 + 0.4));
  float jx = (al + 17.0 * sin(course * 2.399) + 3.5 * sin(y * 0.045 + course) + 1.3 * sin(y * 0.19 + course * 1.3) + 0.55 * sin(y * 0.47 + course * 4.1)) / bw, ji = floor(jx), jf = jx - ji;   // (a joint wanders a metre or two as it climbs: never a ruled line. The JS twin carries the same sines, so a real block's side wanders with its paint)
  float jb = ji + step(0.5, jf);
  float jd = min(jf, 1.0 - jf) * bw + (vn(vec2(y * 0.5, jb * 3.1)) - 0.5) * 0.7 * (1.0 - geo);   // (a ragged crack only where the joint is paint: where the blocks are real the side of a niche lies in the joint, and the ragged edge striped it like a comb)
  float jw = 0.3 + px * 1.3;
  float joint = (1.0 - smoothstep(jw * 0.3, jw, jd)) * step(0.4, h21(vec2(jb, course + 5.0))) * min(1.0, 0.45 / jw) * f1;
  float bt = h21(vec2(ji, course)) - 0.5, bh = h21(vec2(ji + 3.7, course + 1.3)) - 0.5;
  float big = fb(vec2(alF * 0.011 + 3.0, y * 0.013)), mid = fb(vec2(alF * 0.045 + 9.0, y * 0.06));
  float m6 = gnF3(wp * 0.17 + 11.0) - 0.5, m1 = gnF3(wp * vec3(0.7, 0.84, 0.7) + 5.0) - 0.5;
  float sp = gnN3(wp * 3.3) * gnN3(wp * 5.9 + 9.0);
  float gr = gnF3(wp * vec3(0.9, 0.1, 0.9) + 31.0) - 0.5;                             // weathering grain: fine, and it runs down the face
  // exfoliation arches: a wide soft shadow under each arc and a paler, fresher scar below it
  float ay = (y + 46.0 * cos(alF * 0.0105 + big * 5.0) + big * 120.0) / 74.0, ai = floor(ay), af = ay - ai;
  float aOn = step(0.45, h21(vec2(ai, 2.3))) * smoothstep(0.35, 0.55, vn(vec2(alF * 0.006 + ai * 5.1, ai * 2.3))) * (1.0 - smoothstep(3.0, 9.0, px));
  float aSh = smoothstep(0.8, 1.0, af); aSh *= aSh * aOn;
  float scar = smoothstep(0.25, 0.9, af) * (1.0 - aSh) * aOn;
  // water streaks: each hangs from a real break above this point and tapers to nothing below it
  float streak = 0.0, alw = alF + (vn(vec2(alF * 0.3, y * 0.08)) - 0.5) * 1.6;
  for (int k = 0; k < 4; k++) {
    float b = bi + 1.0 + float(k);
    float dn = b * 15.0 - yb, cx = alw / 6.5 + b * 0.37, ci = floor(cx), cf = cx - ci;
    float r1 = h21(vec2(ci, b * 1.3 + 2.0)), r2 = h21(vec2(ci + 9.0, b));
    float t = dn / (16.0 + 80.0 * r2 * r2), w = (0.14 + 0.3 * r2) * max(1.0 - t, 0.0);
    float d = abs(cf - 0.5 - (r1 - 0.5) * 0.4);
    streak = max(streak, step(0.42, r1) * abs(gnKind(b)) * gnStr(b, al) * (1.0 - smoothstep(w * 0.3, w + 0.02, d)) * clamp(1.0 - t, 0.0, 1.0) * step(t, 1.0));
  }
  float farS = smoothstep(0.55, 0.8, vn(vec2(alF * 0.11, y * 0.004 + 5.0)) * 0.65 + vn(vec2(alF * 0.27 + 3.0, y * 0.009)) * 0.35) * smoothstep(0.3, 0.62, mid);
  float sk = max(streak * (1.0 - smoothstep(1.2, 3.5, px)), farS * 0.6 * smoothstep(0.8, 3.0, px)) * skK;
  float lichen = smoothstep(0.56, 0.74, mid + 0.25 * m6) * f1;
  float m = 1.0 + (0.36 * bt * (1.0 - smoothstep(0.5, 1.6, px)) + 0.07 * sin(bi * 2.1 + 0.3) * (1.0 - smoothstep(0.8, 2.4, px)) + 0.26 * (big - 0.5) + 0.2 * (mid - 0.5)) * f1 + (0.34 * m6 + 0.28 * m1 + 0.3 * gr) * f2 + 0.5 * (sp - 0.25) * f3;
  m *= (1.0 - (0.46 - 0.14 * fw) * (1.0 - 0.6 * geo) * under * f1) * (1.0 + 0.2 * lip * f1 * (1.0 - 0.6 * geo)) * (1.0 + 0.16 * top * f1) * (1.0 - 0.22 * foot * f1) * (1.0 - mix(0.35, 0.5, smoothstep(0.2, 0.6, px)) * joint) * (1.0 - 0.36 * aSh);   // (a joint seen from under 80 m, a fifth of a metre to the pixel, is a soft seam: at full strength it was an ink line)
  vec3 c = base * max(m, 0.2);
  c *= mix(vec3(1.0), mix(vec3(0.92, 1.0, 1.1), vec3(1.09, 1.0, 0.89), clamp(0.5 + 1.2 * bh * (1.0 - smoothstep(0.5, 1.6, px)) + 1.5 * (big - 0.5), 0.0, 1.0)), 0.8 * f1);   // (a block's own tone only close up: from across the valley it tiles the wall into panels)
  c = mix(c, c * vec3(1.2, 1.17, 1.12) + 0.02, scar * 0.5);
  c *= mix(vec3(1.0), vec3(0.74, 0.78, 0.76), lichen * 0.55);
  c *= mix(vec3(1.0), vec3(0.42, 0.45, 0.53), sk * 0.8 * (1.0 - 0.6 * scar));
  hOut = 3.2 * prof * f1 * (1.0 - geo) - 0.9 * joint - 1.4 * aSh + (0.8 * m6 + 0.24 * m1) * f2;
  return c;
}`;
// The JS twin of the bed field above (the same constants: change both or neither).
export const GRANITE = {
  H: 15, D: 3.2,
  warp: (al, y) => 20 * Math.sin(al * 0.0113 + 1.7) + 12 * Math.sin(al * 0.0271 + y * 0.0043 + 0.6) + 5 * Math.sin(al * 0.063 + 4.1) + al * 0.05,
  str: (bi, al) => sst(-0.25, 0.35, Math.sin(al * 0.019 + bi * 2.4) + 0.5 * Math.sin(al * 0.047 + bi * 5.3)) * sst(-0.55, -0.15, Math.sin(al * 0.13 + bi * 3.7) + 0.6 * Math.sin(al * 0.29 + bi * 1.9)),
  kind: (bi) => { const c = Math.cos(bi * 2.399 + 0.7); return c >= 0.25 ? 1 : c <= -0.35 ? -1 : 0; },
  // the jointed blocks of bed bi at (al, y): { ji, course, jd (metres to the nearest joint), jb (that joint's index) }
  block(al, y, bi, out) {
    const course = Math.floor(bi * 0.5), bw = 24 * (1 + 0.35 * Math.sin(course * 1.7 + 0.4));
    const jx = (al + 17 * Math.sin(course * 2.399) + 3.5 * Math.sin(y * 0.045 + course) + 1.3 * Math.sin(y * 0.19 + course * 1.3) + 0.55 * Math.sin(y * 0.47 + course * 4.1)) / bw, ji = Math.floor(jx), jf = jx - ji;
    out.ji = ji; out.course = course; out.jd = Math.min(jf, 1 - jf) * bw; out.jb = ji + (jf >= 0.5 ? 1 : 0);
    return out;
  },
};

// Falling water, shared by the Great Fall and the valley's side falls. A = (across -1..1, metres across, fall time),
// B = (drop within the tier, free 0..1, fade, shelf 0..1). Comets: clumps with a hard leading (lower) edge and a thinning tail
// that ride down with the water; between them the dark wet rock shows. The rim is ragged and blue-grey, the core white.
// solid = 1 is heavy water (the Great Fall, the side fall the camera passes): an opaque white column from rim to rim at any
// distance, the comets brighter heads on it, blue-grey only in the threads between them and at the rim away from the key.
// Needs h21 / vn / fb / rstep from the caller (GLSL_NOISE).
export const GLSL_WATER = /* glsl */`
float gfComet(vec2 q, float seed){
  float ci = floor(q.x), cf = q.x - ci;
  float r1 = h21(vec2(ci, seed)), r2 = h21(vec2(ci, seed + 7.3));
  float ph = q.y * (0.7 + 0.6 * r1) + r2 * 9.0;
  float pi = floor(ph), pf = ph - pi;
  float on = step(0.3, h21(vec2(ci * 1.7 + pi, seed + 3.1)));
  float len = 0.35 + 0.5 * h21(vec2(pi, ci + seed));
  float k = clamp(pf / len, 0.0, 1.0);
  float head = smoothstep(0.0, 0.05, pf) * (1.0 - k) * sqrt(max(1.0 - k, 0.0));
  float wd = mix(1.0, 0.35, k);
  float xs = (cf - 0.5) * 2.0 + (r2 - 0.5) * 0.3;
  return head * on * rstep(wd * 0.7, wd * 0.2, abs(xs));
}
vec4 gfWater(vec3 A, vec4 B, float sun, float t, float dist, vec3 sunCol, vec3 skyCol, float solid){
  float e = t - A.z;
  A.x = clamp(A.x, -1.0, 1.0);                                    // (antialiasing can carry the across coordinate past the ribbon's edge)
  float edge = 1.0 - abs(A.x);
  float fray = clamp(B.x / 140.0, 0.0, 1.0);                     // water breaks up as it falls
  float nearK = 1.0 - smoothstep(180.0, 520.0, dist);
  float nE = fb(vec2(A.y * 0.09 + 3.0, e * 0.8));                 // slow surges, ten metres across
  float nT = fb(vec2(A.y * 0.55 + 7.0, e * 2.6));                 // threads
  float cA = gfComet(vec2(A.y / 7.5 + 11.0, e * 0.55), 1.0);
  float cB = gfComet(vec2(A.y / 3.3 + 5.0, e * 0.8), 2.0) * nearK;
  float rim = edge - (0.02 + 0.1 * fray) + (nE - 0.5) * (0.2 + 0.3 * fray) + cA * 0.15;     // the rim moves in and out with the surges
  float body = smoothstep(0.0, 0.24, rim);
  float dens = body * (mix(1.05, 0.68, fray) + 0.7 * cA + 0.4 * cB + (nT - 0.5) * 0.6 * nearK + (nE - 0.5) * 0.65);
  float a = smoothstep(0.2, 0.72, dens);
  float core = smoothstep(0.02, 0.42, edge);
  float farA = smoothstep(0.0, 0.75, edge) * mix(0.5, 0.85, sun) * smoothstep(160.0, 560.0, dist) * clamp(0.62 + 1.3 * (nE - 0.4) + 0.5 * cA, 0.12, 1.0);   // from across the valley: a soft thread with gaps in it, rounded across its width, dimmer in shade
  a = max(a, farA);
  a = mix(a, max(a, smoothstep(-0.03, 0.2, rim) * (0.9 + 0.1 * cA)), solid);
  float runnel = 0.1 + 0.9 * smoothstep(0.42, 0.62, vn(vec2(A.y * 0.21 + 40.0, 3.3)) + 0.3 * (nE - 0.5));
  a *= mix(1.0, runnel, B.w) * B.z * (0.62 + 0.38 * B.y);        // on a bench, and just below its lip: separate strands; water that slides on rock is a thin film
  float white = max(clamp(dens * 0.95 + cA * 0.35, 0.0, 1.0), farA) * mix(0.45, 1.0, core) * (1.0 - 0.3 * smoothstep(-0.3, 1.0, A.x));   // the side away from the key is in shade
  float thr = clamp(0.6 * cA + 0.45 * cB + (nT - 0.32) * 0.9 * nearK + 0.34 * (1.0 - nearK) + (nE - 0.5) * 0.6, 0.0, 1.0);
  white = mix(white, max(white, (0.6 + 0.4 * thr) * mix(0.5, 1.0, core) * (1.0 - 0.24 * smoothstep(-0.2, 1.0, A.x))), solid);
  float cF = gfComet(vec2(A.y / 16.0 + 3.0, e * 0.3), 5.0);       // from 300 m and more the fine comets are under a pixel: broad pulses, fifty metres and more long, ride down the column instead
  white *= mix(1.0, 0.87 + 0.3 * cF, solid * smoothstep(250.0, 500.0, dist));
  white *= mix(1.0, 0.4 + 0.6 * smoothstep(0.0, 9.0, B.x + 3.0 * (nE - 0.5)), solid);   // over the brink the water is still glassy and blue-grey: the white column grows out of it and has no hard top edge
  vec3 cShade = vec3(0.52, 0.66, 0.86) * (skyCol * 0.95 + sunCol * 0.2 * sun);
  vec3 cLit = skyCol * 0.66 + sunCol * (0.08 + 0.84 * sun);        // white water in shade is still pale under the sky: a fall on the shaded wall reads as a blue-white ribbon
  vec3 c = mix(cShade, cLit, white);
  float n3 = vn(vec2(A.y * 1.3 + 3.0, e * 5.5));
  c += sunCol * sun * n3 * n3 * n3 * n3 * n3 * 0.8 * nearK;      // sparkle in the threads
  c *= mix(0.6, 1.0, smoothstep(0.0, 0.7, sun));                 // a fall in shade is never the brightest thing on its wall
  return vec4(c, a);
}`;
// additive materials fade to black in fog instead of to the fog colour
const GLSL_FOG_FADE = /* glsl */`
float fogFade(){
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      return exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      return 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #else
    return 1.0;
  #endif
}`;

// Boulders: a subdivided icosahedron displaced by two octaves of noise, smooth-shaded, with a dark wet foot and a
// mossy crown. Indexed. Appends to the caller's arrays (o.P, o.C, o.N, o.I) or its own; also used by the valley for its talus.
//   boulderBuilder({ rng, noise, base, moss, dark, detail: 2, wet: 0.8 }) -> { add(x, y, z, radius, wetHeight = 1.5), geometry(), count }
export function boulderBuilder(o) {
  const rng = o.rng, N = o.noise, wetK = o.wet ?? 0.8, base = new THREE.Color(o.base ?? '#555a5f'), moss = new THREE.Color(o.moss ?? '#2c4a26'), dark = new THREE.Color(o.dark ?? '#1b222b');
  const ico = new THREE.IcosahedronGeometry(1, o.detail ?? 2).attributes.position.array, nv = ico.length / 3;
  const id = new Uint16Array(nv), uq = [], seen = new Map();
  for (let v = 0; v < nv; v++) {
    const key = Math.round(ico[v * 3] * 200) + ',' + Math.round(ico[v * 3 + 1] * 200) + ',' + Math.round(ico[v * 3 + 2] * 200);
    if (!seen.has(key)) { seen.set(key, uq.length / 3); uq.push(ico[v * 3], ico[v * 3 + 1], ico[v * 3 + 2]); }
    id[v] = seen.get(key);
  }
  const nu = uq.length / 3, p = new Float32Array(nu * 3), nr = new Float32Array(nu * 3), cl = new Float32Array(nu * 3);
  const P = o.P || [], C = o.C || [], Nn = o.N || [], I = o.I || [], c = new THREE.Color(), tint = new THREE.Color();
  const api = {
    count: 0, P, C, N: Nn, I,
    add(x, y, z, r, wetH = 1.5) {
      const ox = rng() * 50, sy = rng.range(0.6, 0.9), sx = rng.range(0.8, 1.35), yaw = rng() * 6.28, cy = Math.cos(yaw), sn = Math.sin(yaw), mossy = rng.range(0.25, 0.8);
      tint.copy(base).multiplyScalar(rng.range(0.78, 1.12)); tint.r *= rng.range(0.97, 1.06); tint.b *= rng.range(0.95, 1.04);
      for (let u = 0; u < nu; u++) {
        const ax = uq[u * 3], ay = uq[u * 3 + 1], az = uq[u * 3 + 2];
        const n2_ = N.n3(ax * 2.9 + ox, ay * 2.9 + 7, az * 2.9), d = 1 + 0.38 * N.n3(ax * 1.2 + ox, ay * 1.2, az * 1.2) + 0.2 * n2_;   // (lumpy enough that a rock beside the camera is not a clay ball)
        const lx = ax * d * r * sx, ly = Math.max(ay * d, -0.4) * r * sy, lz = az * d * r;
        p[u * 3] = x + lx * cy - lz * sn; p[u * 3 + 1] = y + ly; p[u * 3 + 2] = z + lx * sn + lz * cy;
        nr[u * 3] = nr[u * 3 + 1] = nr[u * 3 + 2] = 0;
        c.copy(tint).multiplyScalar((0.6 + 0.4 * sst(-0.6, 0.7, ay)) * (0.86 + 0.5 * (d - 1)));          // hollows darker than bosses
        c.lerp(moss, sst(0.35, 0.9, ay * d) * mossy * (0.6 + 0.4 * n2_));
        c.lerp(dark, wetK * sst(wetH, wetH * 0.35, ly + r * sy * 0.4));                                   // wet waterline
        cl[u * 3] = c.r; cl[u * 3 + 1] = c.g; cl[u * 3 + 2] = c.b;
      }
      for (let t = 0; t < nv; t += 3) {
        const a = id[t] * 3, b = id[t + 1] * 3, e = id[t + 2] * 3;
        const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2], vx = p[e] - p[a], vy = p[e + 1] - p[a + 1], vz = p[e + 2] - p[a + 2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        nr[a] += nx; nr[a + 1] += ny; nr[a + 2] += nz; nr[b] += nx; nr[b + 1] += ny; nr[b + 2] += nz; nr[e] += nx; nr[e + 1] += ny; nr[e + 2] += nz;
      }
      for (let u = 0; u < nu; u++) { const l = Math.hypot(nr[u * 3], nr[u * 3 + 1], nr[u * 3 + 2]) || 1; nr[u * 3] /= l; nr[u * 3 + 1] /= l; nr[u * 3 + 2] /= l; }
      const b0 = P.length / 3;                                 // indexed: 162 vertices for the 320-triangle rock, not 960
      for (let u = 0; u < nu * 3; u += 3) { P.push(p[u], p[u + 1], p[u + 2]); Nn.push(nr[u], nr[u + 1], nr[u + 2]); C.push(cl[u], cl[u + 1], cl[u + 2]); }
      for (let v = 0; v < nv; v++) I.push(b0 + id[v]);
      api.count++;
    },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); g.setIndex(I);
      return g;
    },
  };
  return api;
}

// The material for boulders (and the hero's bench trees, which share its mesh): vertex colours plus, on grey rock only,
// mottling, speckle and a few cracks from object-space noise, so a rock near the camera is not a smooth lump.
export function boulderMaterial(params = {}) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94, metalness: 0, ...params });
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vDp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvDp = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vDp;\n' + GLSL_NOISE)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        {
          float rockK = 1.0 - smoothstep(0.015, 0.06, diffuseColor.g - max(diffuseColor.r, diffuseColor.b));   // trees and moss keep their own colour
          float lod = clamp(max(fwidth(vDp.y), max(fwidth(vDp.x), fwidth(vDp.z))) * 4.0, 0.0, 1.0);
          vec2 pa = vDp.xz * 0.9 + vDp.y * vec2(0.37, 0.53), pb = vDp.xy * 0.9 + vDp.z * vec2(0.41, 0.29);
          float g1 = vn(pa) * 0.6 + vn(pa * 2.3 + 4.0) * 0.4, g2 = vn(pb * 2.2 + 9.0) * 0.6 + vn(pb * 4.7) * 0.4, sp = vn(pa * 3.6) * vn(pb * 4.4);
          float crack = rstep(0.04, 0.0, abs(vn(pa * 0.7 + 3.0) * 0.7 + vn(pa * 1.6) * 0.3 - 0.5)) * smoothstep(0.3, 0.6, g2);
          diffuseColor.rgb *= mix(1.0, (0.76 + 0.5 * g1) * (0.86 + 0.3 * g2) * (1.0 - 0.5 * crack) * (0.9 + 0.5 * sp), rockK * (1.0 - lod));
        }`)
      ;
  };
  return mat;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('great-fall');
  const N = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 5 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  while (pal.length < 7) pal.push(new THREE.Color(DEFAULT_PALETTE[pal.length]));
  const [cSky, cHaze, cRock, cWhite, cGreen] = pal;

  // ---------- per-seed character ----------
  const P = {
    y1: 150 + rng.range(-14, 14),          // lower bench (bottom tier lip)
    y2: 330 + rng.range(-18, 18),          // upper bench (top tier lands, middle tier lip)
    s1: rng.range(38, 50), s2: rng.range(32, 42),   // bench depths
    wing: rng.range(165, 205),             // how far the wings curl forward
    lean: rng.range(0.035, 0.06),          // wall batter
    strataH: rng.range(19, 27),
    crestAmp: rng.range(40, 70),
    tilt: rng.range(-0.6, 0.6),            // which wing is taller
    fx0: rng.range(-10, 10),               // top ribbon x
    fx1: 0, fx2: 0,
    wTop: 25, wMid: rng.range(54, 64), wBot: rng.range(84, 98),   // (the top tier is the design's 25 m ribbon; the bottom tier is wide enough to be the subject from 800 m)
    twin: rng.chance(0.45),                // a second thin ribbon beside the top tier
    warm: rng.range(0, 1),                 // granite warmth
    o: [rng.range(0, 90), rng.range(0, 90), rng.range(0, 90), rng.range(0, 90), rng.range(0, 90)],
  };
  P.fx1 = P.fx0 + rng.range(-9, 9); P.fx2 = P.fx1 + rng.range(-10, 10);   // each tier steps sideways, so the three read apart

  // ---------- the wall as a function ----------
  function column(s) {
    const x = s * HW, as = Math.abs(s);
    const zc = P.wing * Math.pow(as, 2.1);
    const dz = P.wing * 2.1 * Math.pow(as, 1.1) * Math.sign(s);
    const l = Math.hypot(HW, dz), nx = -dz / l, nz = HW / l;
    let raw = 550 + P.crestAmp * N.fbm2(s * 2.1 + P.o[0], 3.3, 4) + 45 * as * (1 + P.tilt * Math.sign(s)) + 22 * N.ridged2(s * 9 + P.o[1], 1.7, 3);
    raw = lerp(raw, LIP + 30, 0.78 * Math.exp(-((x / 125) ** 2)));
    raw = lerp(raw, LIP, Math.exp(-(((x - P.fx0) / 38) ** 4)));
    const crest = raw * (1 - Math.pow(sst(0.62, 1, as), 1.25));
    const cen = Math.exp(-((x / 175) ** 2)), wav = 1 - Math.exp(-((x / 75) ** 2));
    return {
      s, x, zc, nx, nz, crest,
      y1s: P.y1 + 30 * wav * N.fbm2(s * 3 + 11, 5.5, 2), y2s: P.y2 + 34 * wav * N.fbm2(s * 3 + 31, 7.5, 2),
      b1: P.s1 * (0.3 + 0.7 * cen) * (1 + 0.3 * N.n2(s * 4, 2.2)), b2: P.s2 * (0.3 + 0.7 * cen) * (1 + 0.3 * N.n2(s * 4, 6.2)),
      side: 1 - Math.exp(-((x / 100) ** 2)), mid: 0.35 + 0.65 * (1 - Math.exp(-((x / 62) ** 2))),
    };
  }
  const hsh = (i, j, k) => { const t = Math.sin(i * 127.1 + j * 311.7 + k * 74.7 + P.o[3]) * 43758.5453; return t - Math.floor(t); };
  const _w = { d: 0, ao: 0, tal: 0, tone: 0 };
  // (the slab cells' six hashed numbers are worked out once and kept: disp runs for every vertex of the wall and of the ribbons)
  const DCW = 40, DCH = 28, dCell = new Float64Array((DCW * DCH + 1) * 6).fill(NaN);
  const dCellAt = (ci, cj) => {
    const ix = ci + 20, iy = cj + 10, inside = ix >= 0 && ix < DCW && iy >= 0 && iy < DCH, k = inside ? (iy * DCW + ix) * 6 : DCW * DCH * 6;
    if (inside && dCell[k] === dCell[k]) return k;
    dCell[k] = ci + 0.5 + 0.8 * (hsh(ci, cj, 1) - 0.5); dCell[k + 1] = cj + 0.5 + 0.8 * (hsh(ci, cj, 2) - 0.5);
    dCell[k + 2] = hsh(ci, cj, 3); dCell[k + 3] = 26 * (hsh(ci, cj, 4) - 0.5); dCell[k + 4] = 44 * 0.75 * (hsh(ci, cj, 5) - 0.5); dCell[k + 5] = 150 * 0.14 * (hsh(ci, cj, 6) - 0.5);
    return k;
  };
  function disp(c, y) {
    const s = c.s;
    const tal = y < 75 ? (1 - Math.max(y, 0) / 75) ** 2 : 0;
    const sw = s + 0.045 * N.n2(s * 2.6 + 50, y * 0.0042);            // slant the joints so nothing is ruler-vertical
    const butt = 44 * N.fbm2(sw * 2.4 + P.o[2], y * 0.0012, 2) * c.mid;   // (two octaves: broad buttresses; a third crumples the wall into folds)
    // granite slabs: tall jittered cells, each a tilted plane, so faces are flat and meet in sharp corners and flakes
    const su = sw * (HW / 44), sv = y / 150 + sw * 0.9, iu = Math.floor(su), iv = Math.floor(sv);
    let best = 1e9, cu = 0, cv = 0, tone = 0, slabOff = 0, tU = 0, tV = 0;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const k = dCellAt(iu + a, iv + b), gx = dCell[k], gy = dCell[k + 1];
      const dd = (su - gx) * (su - gx) + (sv - gy) * (sv - gy);
      if (dd < best) { best = dd; cu = gx; cv = gy; tone = dCell[k + 2]; slabOff = dCell[k + 3]; tU = dCell[k + 4]; tV = dCell[k + 5]; }
    }
    const wingK = 1 - sst(0.62, 0.9, Math.abs(s));                     // the wing ends are seen edge-on from the valley: plain rock there, no saw-teeth
    const pill = (slabOff + (su - cu) * tU + (sv - cv) * tV
      + 5 * (N.ridged2(sw * 5.6 + P.o[3], y * 0.0026, 2) - 0.4)) * c.mid * lerp(0.2, 1, wingK);
    const yy = y + 16 * N.n2(s * 5, y * 0.004 + 9);
    const f = yy / P.strataH, fl = Math.floor(f), fr = f - fl;
    const strata = 6 * (Math.pow(fr, 1.6) - 0.4) * (0.5 + 0.5 * N.n2(s * 7, fl * 1.7));
    const bxi = Math.floor(sw * 21 + 0.4 * N.n2(fl * 0.9, 3.1));       // jointed blocks, staggered bed by bed
    const blk = 1.6 * N.n2(bxi * 1.37 + 20, fl * 2.31) + 0.8 * N.n2(Math.floor(sw * 55 + fl * 0.37) * 1.91, Math.floor(f * 2) * 1.13);
    const fine = 1.0 * N.fbm2(s * 42, y * 0.035, 2);
    const rough = (pill + (strata + blk) * wingK) * (1 - tal * 0.85) + fine * wingK;
    const sb = c.b1 * sst(c.y1s - 7, c.y1s + 7, y) + c.b2 * sst(c.y2s - 7, c.y2s + 7, y) + P.lean * y;
    _w.d = butt + rough + tal * 62 * c.side - sb;
    _w.ao = clamp(slabOff / 26 + (strata / 10 + blk / 12) * wingK, -1, 1);
    _w.tone = tone;
    _w.tal = tal;
    return _w;
  }
  let cols = null;
  const _c = {}, CK = ['x', 'zc', 'nx', 'nz', 'crest', 'y1s', 'y2s', 'b1', 'b2', 'side', 'mid'];
  function colLerp(x) {                       // interpolated column data (cheap) once the wall columns exist
    const f = clamp((x / HW + 1) * 0.5, 0, 1) * (cols.length - 1), i = Math.min(Math.floor(f), cols.length - 2), t = f - i;
    const a = cols[i], b = cols[i + 1];
    for (const k of CK) _c[k] = a[k] + (b[k] - a[k]) * t;
    _c.s = x / HW; return _c;
  }
  const faceZ = (x, y) => { const c = colLerp(x); return c.zc + c.nz * disp(c, y).d; };

  const root = new THREE.Group(); root.name = 'great-fall';

  // ---------- head wall mesh (front grid + coarse back slope) ----------
  const NS = 144, NT = 112, NB = 22, BACK = 430;
  const nFront = (NS + 1) * (NT + 1), nBack = (NS / 4 + 1) * (NB + 1);
  const pos = new Float32Array((nFront + nBack) * 3), col = new Float32Array((nFront + nBack) * 3);
  const aoA = new Float32Array(nFront), talA = new Float32Array(nFront), dA = new Float32Array(nFront), toneA = new Float32Array(nFront);
  cols = [];
  for (let i = 0; i <= NS; i++) cols.push(column((i / NS) * 2 - 1));
  await ctx.yield();
  for (let i = 0, k = 0; i <= NS; i++) {
    const c = cols[i];
    for (let j = 0; j <= NT; j++, k++) {
      const y = -8 + (c.crest + 8) * (j / NT);
      const w = disp(c, y);
      pos[k * 3] = c.x + c.nx * w.d; pos[k * 3 + 1] = y; pos[k * 3 + 2] = c.zc + c.nz * w.d;
      aoA[k] = w.ao; talA[k] = w.tal; dA[k] = w.d; toneA[k] = w.tone;
    }
    await ctx.yield();
  }
  const NSB = NS / 4;
  for (let i = 0, k = nFront; i <= NSB; i++) {
    const c = cols[i * 4], top = (i * 4) * (NT + 1) + NT;
    const chan = Math.exp(-(((c.x - P.fx0) / 40) ** 4));
    for (let r = 0; r <= NB; r++, k++) {
      const q = r / NB, e = Math.pow(sst(lerp(0.0, 0.22, chan), 1, q), 1.35);
      const bump = r === 0 ? 0 : 26 * N.fbm2(c.s * 4 + 40, q * 3, 3) * (1 - chan) * Math.sin(q * Math.PI);
      pos[k * 3] = pos[top * 3] - c.nx * q * BACK * 0.6;
      pos[k * 3 + 1] = (pos[top * 3 + 1] + 8) * (1 - e) - 8 + bump;
      pos[k * 3 + 2] = pos[top * 3 + 2] - q * BACK * (0.75 + 0.25 * c.nz);
    }
  }
  await ctx.yield();
  const idx = new Uint32Array((NS * NT + NSB * NB) * 6); let ii = 0;
  for (let i = 0; i < NS; i++) {
    for (let j = 0; j < NT; j++) {
      const a = i * (NT + 1) + j, b = a + NT + 1;
      idx[ii++] = a; idx[ii++] = b; idx[ii++] = a + 1; idx[ii++] = b; idx[ii++] = b + 1; idx[ii++] = a + 1;
    }
    if (i % 40 === 39) await ctx.yield();
  }
  for (let i = 0; i < NSB; i++) for (let r = 0; r < NB; r++) {
    const a = nFront + i * (NB + 1) + r, b = a + NB + 1;
    idx[ii++] = a; idx[ii++] = b; idx[ii++] = a + 1; idx[ii++] = b; idx[ii++] = b + 1; idx[ii++] = a + 1;
  }
  const wallGeo = new THREE.BufferGeometry();
  wallGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  wallGeo.setIndex(new THREE.BufferAttribute(idx, 1));
  await ctx.yield();
  {
    // vertex normals, summed face by face like computeVertexNormals() but in slices (36,000 faces in one call was the build's longest step)
    const nr = new Float32Array(pos.length);
    for (let t = 0; t < idx.length; t += 3) {
      const ia = idx[t] * 3, ib = idx[t + 1] * 3, ic = idx[t + 2] * 3;
      const ux = pos[ic] - pos[ib], uy = pos[ic + 1] - pos[ib + 1], uz = pos[ic + 2] - pos[ib + 2];
      const vx = pos[ia] - pos[ib], vy = pos[ia + 1] - pos[ib + 1], vz = pos[ia + 2] - pos[ib + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      nr[ia] += nx; nr[ia + 1] += ny; nr[ia + 2] += nz; nr[ib] += nx; nr[ib + 1] += ny; nr[ib + 2] += nz; nr[ic] += nx; nr[ic + 1] += ny; nr[ic + 2] += nz;
      if (t % 6000 === 5997) await ctx.yield();
    }
    for (let k = 0; k < nr.length; k += 3) {
      const l = Math.hypot(nr[k], nr[k + 1], nr[k + 2]) || 1;
      nr[k] /= l; nr[k + 1] /= l; nr[k + 2] /= l;
    }
    wallGeo.setAttribute('normal', new THREE.BufferAttribute(nr, 3));
  }
  await ctx.yield();

  // ---------- wall colour bake: granite tones, varnish streaks, wet rock, moss on benches, AO ----------
  const nor = wallGeo.attributes.normal.array;
  const granite = cRock.clone().lerp(cHaze, 0.03).multiply(new THREE.Color(0.93, 0.875, 0.8));   // shaded-stage granite: the water must be the brightest thing on it
  const warmRock = granite.clone().multiply(new THREE.Color(1.16, 1.02, 0.84)).lerp(new THREE.Color('#b9a58c'), 0.25 * P.warm);
  const paleRock = granite.clone().lerp(cWhite, 0.14);
  const darkRock = granite.clone().multiplyScalar(0.34).lerp(new THREE.Color('#141c26'), 0.42);
  const moss = cGreen.clone().multiplyScalar(0.62), scree = granite.clone().lerp(new THREE.Color('#a39a8c'), 0.5).multiplyScalar(0.92);
  const tc = new THREE.Color();
  const fallX = (y) => (y > P.y2 + 7 ? P.fx0 : y > P.y1 + 7 ? lerp(P.fx1, P.fx0, sst(P.y2 - 8, P.y2 + 7, y)) : lerp(P.fx2, P.fx1, sst(P.y1 - 8, P.y1 + 7, y)));   // each tier steps sideways on its bench
  const fallW = (y) => (y > P.y2 + 6 ? lerp(P.wTop * 1.35, P.wTop, sst(P.y2, LIP, y)) : y > P.y1 + 6 ? lerp(P.wMid * 1.15, P.wTop * 1.25, sst(P.y1, P.y2, y) ** 0.75) : lerp(P.wBot, P.wMid * 0.9, sst(0, P.y1, y) ** 1.3));
  for (let i = 0, k = 0; i <= NS; i++) {
    const c = cols[i];
    for (let j = 0; j <= NT; j++, k++) {
      const x = pos[k * 3], y = pos[k * 3 + 1], ny = nor[k * 3 + 1];
      const i0 = Math.max(i - 2, 0), i1 = Math.min(i + 2, NS), j0 = Math.max(j - 2, 0), j1 = Math.min(j + 2, NT);
      const cav = clamp((dA[k] - 0.25 * (dA[i0 * (NT + 1) + j] + dA[i1 * (NT + 1) + j] + dA[i * (NT + 1) + j0] + dA[i * (NT + 1) + j1])) / 5, -1, 1);
      const big = N.fbm2(c.s * 2.6 + P.o[4], y * 0.004, 2);
      tc.copy(granite).lerp(warmRock, sst(-0.5, 0.5, big)).lerp(paleRock, sst(0.0, 0.7, N.n2(c.s * 9 + 5, y * 0.011)) * 0.85);
      // dark vertical varnish / seep streaks below ledges
      const streak = sst(0.12, 0.6, N.fbm2(c.s * 58 + 3, y * 0.0035, 2)) * sst(0.25, -0.35, N.n2(c.s * 6, y * 0.006 + 20));
      tc.lerp(darkRock, 0.66 * streak);
      tc.lerp(darkRock, 0.42 * sst(0.15, 0.6, N.n2(c.s * 6.5 + 80, y * 0.009)));   // lichen-dark panels
      // wet, dark rock behind and beside the water
      const dx = Math.abs(x - fallX(y)) / (fallW(y) * 0.5 + 16);
      const wetN = N.n2(c.s * 46 + 9, y * 0.003);                              // the wet zone frays into streaks either side of the fall
      tc.lerp(darkRock, 0.92 * sst(3.1, 0.75, dx + 0.9 * wetN) * sst(LIP + 10, LIP - 10, y));
      tc.lerp(darkRock, 0.55 * sst(95, 18, y + 30 * wetN) * (1 - talA[k] * 0.5));   // spray-soaked lowest 80 m
      tc.lerp(darkRock, 0.56 * sst(230, 80, Math.abs(x - fallX(y)) + 70 * wetN) * sst(LIP + 40, LIP - 30, y));   // the amphitheatre round the fall is soaked, lichen-dark rock: the white water stands against something clearly darker than itself
      // talus apron and moss / turf on anything flat
      tc.lerp(scree, talA[k] * 0.85);
      const flat = sst(0.42, 0.78, ny);
      tc.lerp(moss, flat * (0.55 + 0.35 * N.n2(c.s * 30, y * 0.05)) * sst(1.2, 2.2, dx + 0.6));
      tc.multiplyScalar(clamp(0.74 + 0.2 * aoA[k] + (cav < 0 ? 0.4 : 0.16) * cav + 0.22 * toneA[k] * (1 - talA[k]), 0.36, 1.15));
      col[k * 3] = tc.r; col[k * 3 + 1] = tc.g; col[k * 3 + 2] = tc.b;
      if (j === 56) await ctx.yield();
    }
    await ctx.yield();
  }
  await ctx.yield();
  for (let k = nFront; k < nFront + nBack; k++) {
    const y = pos[k * 3 + 1], ny = nor[k * 3 + 1];
    tc.copy(granite).lerp(moss, sst(0.55, 0.9, ny) * 0.8).lerp(scree, sst(120, 0, y) * 0.5)
      .multiplyScalar(0.8 + 0.2 * N.n2(pos[k * 3] * 0.02, pos[k * 3 + 2] * 0.02));
    col[k * 3] = tc.r; col[k * 3 + 1] = tc.g; col[k * 3 + 2] = tc.b;
  }
  wallGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  await ctx.yield();

  const rockMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0});
  rockMat.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vHp;\nvarying float vSteep;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHp = position;\nvSteep = 1.0 - smoothstep(0.45, 0.75, abs(normal.y));');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vHp;\nvarying float vSteep;\nfloat gfH;\n' + GLSL_NOISE + GLSL_GRANITE)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        {
          float along = vHp.x + vHp.z * 0.6 * clamp(vHp.x / 70.0, -1.0, 1.0);   // (mirrored about the fall: on either wing, which runs toward the camera, the paint keeps moving along the face and never smears)
          float lod = clamp(max(fwidth(vHp.y) * 0.22, fwidth(along) * 0.1), 0.0, 1.0);   // fade detail that would alias, up the wall or along it (a wing seen at a grazing angle)
          float warp = fb(vec2(along * 0.006, vHp.y * 0.01)) * 34.0;
          float by = (vHp.y + warp) / 7.5, bi = floor(by), bf = by - bi;      // bedding: sawtooth ledges
          float bedTone = h21(vec2(bi, 3.0));
          float course = floor(by / 3.0);
          float jx = (along + h21(vec2(course, 9.0)) * 40.0 + warp * 0.3) / 12.0, ji = floor(jx), jf = jx - ji;
          float blockTone = h21(vec2(ji, course)) * (1.0 - lod);              // jointed blocks
          float jl = rstep(0.07, 0.0, min(jf, 1.0 - jf)) * step(0.35, h21(vec2(ji, course + 5.0))) * (1.0 - lod);
          float bedMask = step(0.42, h21(vec2(bi, 7.0)));                        // only some beds form a real ledge
          float under = (1.0 - smoothstep(0.0, 0.14, bf)) * bedMask * (1.0 - lod);         // shadow line under each ledge
          float grain = fb(vec2(along, vHp.y) * 0.8) * 0.6 + fb(vec2(along * 0.21 + 31.0, vHp.y * 0.09)) * 0.4;
          float nearK = 0.45 + 0.55 * smoothstep(120.0, 420.0, length(vViewPosition));        // bedding and joints fade at close range (no brick courses)
          float stain = fb(vec2(along * 0.045, vHp.y * 0.0028 + 5.0));                         // vertical mineral stains
          float fx_ = along / 37.0 + fb(vec2(along * 0.012, vHp.y * 0.017)) * 1.6;
          float frac = rstep(0.06, 0.0, abs(fract(fx_) - 0.5)) * step(0.4, h21(vec2(floor(fx_), 4.0))) * (1.0 - lod);   // wandering vertical fractures
          float detail = (0.95 + 0.05 * bedTone * nearK) * (0.98 + 0.03 * blockTone * nearK) * (1.0 - 0.1 * under * nearK) * (1.0 - 0.07 * jl * nearK)
            * (0.88 + 0.24 * grain) * (0.8 + 0.34 * stain) * (1.0 - 0.3 * frac);
          float ledgeH = smoothstep(0.0, 0.16, bf) - smoothstep(0.78, 1.0, bf);    // continuous, so the bump has no spikes
          gfH = (ledgeH * bedMask * 0.4 * nearK + grain * 0.45 + stain * 0.3) * (1.0 - lod) * vSteep;      // bedding only on cliff faces, not on benches, talus or the back slope
          diffuseColor.rgb *= mix(0.95, detail, (1.0 - lod) * (0.25 + 0.75 * vSteep)) * mix(vec3(0.5, 0.56, 0.66), vec3(1.0), smoothstep(-10.0, 150.0, vHp.y + warp));   // spray-wet foot
          // the valley's granite (roofs, ledges, streaks, warm and cool blocks) carried onto the head wall, so the three walls are one rock
          float gnPx = max(length(vec2(dFdx(along), dFdx(vHp.y))), length(vec2(dFdy(along), dFdy(vHp.y)))), gnHh = 0.0;
          vec3 gnC = gnGranite(vec3(1.0), along, along, vHp, vHp.y, gnPx, 0.0, 1.0, gnHh);
          float gnK = vSteep * (1.0 - smoothstep(4.0, 9.0, gnPx)) * smoothstep(0.0, 60.0, vHp.y);
          diffuseColor.rgb *= mix(vec3(1.0), gnC, 0.85 * gnK);
          gfH += 0.3 * gnHh * gnK;
        }`)
      .replace('#include <normal_fragment_maps>', /* glsl */`#include <normal_fragment_maps>
        {
          vec3 dpx = dFdx(-vViewPosition), dpy = dFdy(-vViewPosition);
          float hx = dFdx(gfH), hy = dFdy(gfH);
          vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx);
          float det = dot(dpx, r1);
          vec3 grad = sign(det) * (hx * r1 + hy * r2);
          float fadeB = 1.0 - smoothstep(140.0, 600.0, length(vViewPosition));
          vec3 nb = abs(det) * normal - 1.0 * fadeB * grad;
          if (dot(nb, nb) > 1e-16) normal = normalize(nb);
        }`);
  };
  const wall = new THREE.Mesh(wallGeo, rockMat); wall.name = 'head-wall';
  root.add(wall);

  // ---------- dressing: conifers on benches, talus and crest; boulders round the pool ----------
  const dP = [], dC = [], dN = [], dI = [];
  const tri = (ax, ay, az, bx, by, bz, cx, cy, cz, ca, cb, cc) => {     // (plain numbers, no little arrays: this runs 8000 times and the garbage would be collected inside a build step)
    const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;   // geometric normal (the material is double-sided)
    nx /= l; ny /= l; nz /= l;
    const b0 = dP.length / 3; dI.push(b0, b0 + 1, b0 + 2);
    dP.push(ax, ay, az, bx, by, bz, cx, cy, cz); dC.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b, cc.r, cc.g, cc.b);
    dN.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
  };
  const treeDark = new THREE.Color('#2f5a33').multiplyScalar(0.34).lerp(new THREE.Color('#0d2417'), 0.4), treeLite = new THREE.Color('#2f5a33').multiplyScalar(0.8).lerp(cGreen, 0.2);
  const tA = new THREE.Color(), tB = new THREE.Color();
  const rt = rng.fork('bench-trees');                                // (the bench trees draw from a stream of their own: how many tries the loop takes never moves the pool, the boulders or the spray)
  function conifer(x, y, z, h) {
    const tiers = 3, sides = 5, yaw = rt() * 6.28, hue = rt(), slim = rt.range(0.13, 0.17);
    tA.copy(treeDark).lerp(treeLite, 0.1 + 0.25 * hue); tB.copy(treeDark).lerp(treeLite, 0.5 + 0.4 * hue);
    for (let t = 0; t < tiers; t++) {
      const y0 = y + h * (0.08 + 0.27 * t), y1 = y + h * (0.5 + 0.25 * t), r = h * slim * (1 - 0.26 * t);
      for (let s = 0; s < sides; s++) {
        const a0 = yaw + (s / sides) * 6.2832 + t * 0.7, a1 = a0 + 6.2832 / sides;
        const d0 = 1 + 0.3 * Math.sin(s * 2.4 + t * 1.7 + hue * 9), d1 = 1 + 0.3 * Math.sin((s + 1) * 2.4 + t * 1.7 + hue * 9);
        tri(x + Math.cos(a0) * r * d0, y0 - (d0 - 1) * h * 0.1, z + Math.sin(a0) * r * d0, x, y1, z, x + Math.cos(a1) * r * d1, y0 - (d1 - 1) * h * 0.1, z + Math.sin(a1) * r * d1, tA, tB, tA);
      }
    }
  }
  const inFall = (x, y, pad) => Math.abs(x - fallX(y)) < fallW(y) * 0.5 + pad;
  let trees = 0;
  for (let n = 0; n < 9000 && trees < 560; n++) {
    if (n % 80 === 79) await ctx.yield();
    const back = rt.chance(0.2);
    const k = back ? nFront + rt.int(0, nBack - 1) : rt.int(0, nFront - 1);
    const x = pos[k * 3], y = pos[k * 3 + 1], z = pos[k * 3 + 2], ny = nor[k * 3 + 1];
    if (y < 4 || ny < (back ? 0.6 : 0.56)) continue;
    if (!back && inFall(x, y, 30)) continue;
    if (!back && y < 60 && Math.hypot(x, z - 40) < 150) continue;      // keep the plume volume clear
    if (N.n2(x * 0.012 + 3, z * 0.012 + y * 0.01) < -0.05) continue;    // dense stands with bare rock between, not an even scatter
    const h = rt.range(10, 17) * (y > 420 ? 0.8 : 1);                 // small against the wall: they are its scale bar
    conifer(x + rt.range(-3, 3), y - 1.2, z + rt.range(-3, 3), h); trees++;
    if (trees % 5 === 4) await ctx.yield();
  }
  await ctx.yield();
  // The wing ends are seen edge-on from the valley with the key grazing them: there the steps from one mesh column to the next
  // (blocks, slabs) lit up as a comb of parallel bright ridges. Normals and baked colour are smoothed along the wall on the wings,
  // so a wing end is plain shaded granite. (Done after the trees are placed: they read the raw normals.)
  {
    const WK = 5, n0 = nor.slice(0, nFront * 3), c0 = col.slice(0, nFront * 3);
    for (let i = 0; i <= NS; i++) {
      const k = sst(0.52, 0.72, Math.abs(cols[i].s)); if (k <= 0) continue;
      for (let j = 0; j <= NT; j++) {
        let ax = 0, ay = 0, az = 0, cr = 0, cg = 0, cb = 0, ws = 0;
        for (let a = -WK; a <= WK; a++) {
          const q = (Math.min(NS, Math.max(0, i + a)) * (NT + 1) + j) * 3, w = WK + 1 - Math.abs(a);
          ax += n0[q] * w; ay += n0[q + 1] * w; az += n0[q + 2] * w; cr += c0[q] * w; cg += c0[q + 1] * w; cb += c0[q + 2] * w; ws += w;
        }
        const v = (i * (NT + 1) + j) * 3, l = Math.sqrt(ax * ax + ay * ay + az * az) || 1;
        const nx = lerp(n0[v], ax / l, k), ny = lerp(n0[v + 1], ay / l, k), nz = lerp(n0[v + 2], az / l, k), ln = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        nor[v] = nx / ln; nor[v + 1] = ny / ln; nor[v + 2] = nz / ln;
        col[v] = lerp(c0[v], cr / ws, k); col[v + 1] = lerp(c0[v + 1], cg / ws, k); col[v + 2] = lerp(c0[v + 2], cb / ws, k);
      }
      if (i % 8 === 7) await ctx.yield();
    }
  }
  await ctx.yield();
  // boulders: smooth, noise-displaced granite with dark wet feet and mossy tops. Round the flight line (the pool's near shore and
  // the outflow) every rock over 2 m is the 320-triangle one; elsewhere only the big ones are.
  const bbO = { rng, noise: N, base: cRock.clone().multiplyScalar(0.8).lerp(new THREE.Color('#b9a58c'), 0.12), moss, dark: darkRock.clone().lerp(cRock, 0.22), wet: 0.6, P: dP, C: dC, N: dN, I: dI };
  const bbL = boulderBuilder(bbO), bbS = boulderBuilder({ ...bbO, detail: 1 });
  const POOL = { x: P.fx2 * 0.6, z: 44, rx: rng.range(96, 112), rz: rng.range(70, 84) };
  const collars = [];                                                   // [x, z, r]: rocks that stand in water get a foam collar
  let nb = 0;
  const bb = { add: async (x, y, z, r, w, wet) => {
    const near = Math.abs(x - POOL.x) < 75 && z > POOL.z + 10;
    (r > (near ? 2.4 : 5.5) ? bbL : bbS).add(x, y, z, r, w);
    if (wet) collars.push([x, z, r]);
    if (++nb % 2 === 1) await ctx.yield();
  } };
  let boulders = 0;
  for (let n = 0; n < 1500 && boulders < 105; n++) {
    const a = rng() * 6.2832, rim = rng.range(0.92, 1.5) ** 1.5;
    const x = POOL.x + Math.cos(a) * POOL.rx * rim + rng.range(-8, 8), z = POOL.z + Math.sin(a) * POOL.rz * rim + rng.range(-8, 8);
    if (Math.abs(x) < 34 && z > 60) continue;                         // river mouth and flight corridor
    if (Math.abs(x) > 300) continue;
    const zf = faceZ(x, 2);
    if (z < zf - 6) continue;                                         // inside the wall
    let r = rng.range(2.2, 6.5) * (rng.chance(0.08) ? 2.1 : 1);
    if (Math.abs(x - POOL.x) < 80 && z > POOL.z) r = Math.min(r, 4.6);   // nothing house-sized beside the flight line
    const up = Math.max(0, z < zf + 30 ? (1 - (z - zf) / 30) * 14 : 0);
    await bb.add(x, up - r * 0.15, z, r, 1.6, up < 0.5 && Math.hypot((x - POOL.x) / POOL.rx, (z - POOL.z) / POOL.rz) < 0.84); boulders++;
  }
  // a few mid-stream rocks in the plunge zone to split the foam
  for (let n = 0; n < 7; n++) await bb.add(P.fx2 + rng.range(-45, 45), -0.5, faceZ(P.fx2, 1) + rng.range(14, 40), rng.range(3, 7), 3.5, true);
  for (let n = 0; n < 46; n++) {                                        // cobble banks along the outflow
    const q = rng() ** 1.4, z = lerp(POOL.z + POOL.rz * 0.8, 330, q), side = rng.sign(), w = lerp(62, 30, Math.sqrt(q)) * 0.5, off = rng.range(-2, 9);
    await bb.add(POOL.x * (1 - q) + side * (w + off), -0.3, z, rng.range(1.2, 3.6) * (rng.chance(0.1) ? 1.8 : 1), 1.3, off < -0.4 && q < 0.8);
  }
  await ctx.yield();
  const dressGeo = new THREE.BufferGeometry();
  dressGeo.setAttribute('position', new THREE.Float32BufferAttribute(dP, 3));
  await ctx.yield();
  dressGeo.setAttribute('color', new THREE.Float32BufferAttribute(dC, 3));
  await ctx.yield();
  dressGeo.setAttribute('normal', new THREE.Float32BufferAttribute(dN, 3));
  dressGeo.setIndex(dI);
  await ctx.yield();
  const dress = new THREE.Mesh(dressGeo, boulderMaterial({ side: THREE.DoubleSide }));
  dress.name = 'trees-and-boulders'; root.add(dress);
  await ctx.yield();

  // ---------- shared uniforms ----------
  const sunDefault = new THREE.Vector3(-Math.sin(0.262) * Math.cos(0.384), Math.sin(0.384), Math.cos(0.262) * Math.cos(0.384)).normalize();
  let sunGiven = false;
  const U = {
    time: { value: 0 }, bow: { value: 1 }, second: { value: 0.02 }, gust: { value: 1 }, ceil: { value: 150 }, veil: { value: 1 }, reach: { value: 1 }, near: { value: 0 },
    sunDir: { value: sunDefault.clone() },
    sunColor: { value: new THREE.Color(opts.sunColor || '#fff1d6') },
    skyColor: { value: opts.skyColor ? new THREE.Color(opts.skyColor) : cSky.clone().lerp(cHaze, 0.6) },
    inv: { value: new THREE.Matrix4() },
  };
  if (opts.sunDir) { const s = opts.sunDir; U.sunDir.value.set(s.x ?? s[0], s.y ?? s[1], s.z ?? s[2]).normalize(); sunGiven = true; }
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

  // ---------- falling water: ribbons draped over the wall function ----------
  // Each tier leaves its own lip: the water lands on a bench, runs across it as thin runnels over dark wet rock, and is thrown
  // clear again from the bench's outer edge, so the three tiers stand apart.
  const wP = [], wA = [], wB = [], wI = [];           // position, (across -1..1, metres across, fall time), (drop in this tier, free, fade, shelf)
  let wCount = 0;
  async function ribbon({ xAt, wAt, yTop, yBot, v0, vLip = 3.4, ncol, benches = [], river = 0, tau0 = 0, thin = 1 }) {
    const base = wCount, dLip = new Float32Array(ncol + 1), offPrev = new Float32Array(ncol + 1), landOff = new Float32Array(ncol + 1);
    const ys = [];
    for (let y = yTop; y > yBot;) { ys.push(y); let st = 4; for (const b of benches) if (Math.abs(y - b) < 12) st = 1.6; y -= st; }
    ys.push(yBot);
    const endFade = yBot > 20 ? 24 : 0;
    const colAt = (y, i) => colLerp(xAt(y) + ((i / ncol) * 2 - 1) * wAt(y) * 0.5);
    let rows = 0;
    // feeder stream on the plateau behind the lip
    for (let r = river; r >= 1; r--) {
      for (let i = 0; i <= ncol; i++) {
        const c = colAt(yTop, i), d = disp(c, yTop).d, cc = (i / ncol) * 2 - 1, back = r * 9;
        wP.push(c.x + c.nx * d, yTop + 1.4, c.zc + c.nz * d - back);
        wA.push(cc, cc * wAt(yTop) * 0.5, tau0 - back / 7); wB.push(0, 0, sst(river, river - 4, r), 0); wCount++;
      }
      rows++;
      if (r % 3 === 0) await ctx.yield();
    }
    let tierTop = yTop, tauBase = tau0, bi = 0, tier = 0, fresh = true, onShelf = false, shelfTop = 0, n = 0, sinceLip = 99;   // (rows since the tier's lip; the top tier leaves the brink whole)
    for (const y of ys) {
      if (!onShelf && bi < benches.length && y < benches[bi] + 7) { onShelf = true; shelfTop = y; tauBase += Math.sqrt((2 * (tierTop - y)) / G); landOff.set(offPrev); }
      if (onShelf && y < benches[bi] - 8) { onShelf = false; tauBase += 2.6; tierTop = y; bi++; tier++; fresh = true; sinceLip = 0; }
      const h = onShelf ? 0 : tierTop - y, tf = Math.sqrt((2 * h) / G), thr = (tier === 0 ? v0 : vLip) * tf;
      const tau = onShelf ? tauBase + 2.6 * (shelfTop - y) / Math.max(1, shelfTop - (benches[bi] - 8)) : tauBase + tf;
      const land = !onShelf && bi < benches.length ? 0.6 * sst(benches[bi] + 24, benches[bi] + 7, y) : 0;
      const shelf = onShelf ? 1 : Math.max(land, tier > 0 ? 0.9 * Math.exp(-h / 38) : 0);
      // (the sheet that lands on a bench dies out on it, and the tier below starts at its own lip as separate strands that
      // thicken over the first ten metres. On the wide fall both edges are set column by column, so a tier ends and begins
      // along a ragged line over dark wet rock, never along a ruled one: from below the three tiers were three stacked slabs)
      const fadeRow = thin * (endFade ? sst(yBot, yBot + endFade, y) : 1), ragged = ncol >= 8 ? 1 : 0;
      for (let i = 0; i <= ncol; i++) {
        const c = colAt(y, i), d = disp(c, y).d, cc = (i / ncol) * 2 - 1;
        const jag = ragged * (0.5 + 0.5 * N.n2(i * 0.83 + 3.1, tier * 7.3 + 11.9)), jag2 = ragged * N.n2(i * 0.71 + 9.7, tier * 5.1 + 2.3);
        const off2 = jag2 > 0 ? 6 * jag2 : 10 * jag2;                  // (the sheet dies on its bench anywhere from 6 m over it to 10 m under its edge, column by column; a tier begins up to seven rows, 28 m, below its lip)
        const fade = fadeRow * (onShelf ? sst(benches[bi] - 7 + off2, benches[bi] + 1 + off2, y) : sst(-0.4, 4.5, sinceLip - 7 * jag));
        if (fresh) dLip[i] = d;
        const off = onShelf ? Math.max(d + 2.4, landOff[i]) : Math.max(d + 2.4, dLip[i] + thr);
        offPrev[i] = off;
        const lift = y === yTop ? 1.4 : y < 1 ? 0.6 : 0;
        wP.push(c.x + c.nx * off, y + lift, c.zc + c.nz * off);
        wA.push(cc, cc * wAt(y) * 0.5, tau);
        wB.push(h, sst(0, 8, off - d - 2.4), fade, shelf); wCount++;
      }
      sinceLip++;
      fresh = false; rows++;
      if (++n % 3 === 2) await ctx.yield();
    }
    for (let r = 0; r < rows - 1; r++) for (let i = 0; i < ncol; i++) {
      const a = base + r * (ncol + 1) + i, b = a + ncol + 1;
      wI.push(a, a + 1, b, a + 1, b + 1, b);
    }
    await ctx.yield();
  }
  await ribbon({ xAt: fallX, wAt: fallW, yTop: LIP, yBot: 0, v0: 4.2, ncol: 16, benches: [P.y2, P.y1], river: 11 });
  await ctx.yield();
  if (P.twin) {
    const tx = P.fx0 + rng.sign() * rng.range(20, 27), tw = rng.range(4, 7);
    await ribbon({ xAt: () => tx, wAt: (y) => tw * (1 + (LIP - y) / 260), yTop: colLerp(tx).crest - 1, yBot: P.y2 - 4, v0: 2.6, ncol: 4, tau0: 3 });
  }
  const strands = [];
  for (let n = rng.int(1, 3), tries = 0; strands.length < n && tries < 30; tries++) {
    const x0 = rng.sign() * rng.range(85, 250);
    if (strands.some((s) => Math.abs(s - x0) < 45)) continue;
    strands.push(x0);
    const c = { ...colLerp(x0) }, w0 = rng.range(2.2, 4.2), top = c.crest - rng.range(2, 60), bot = rng.chance(0.5) ? c.y1s - 6 : 6;
    const wob = rng.range(-5, 5), tau0 = rng() * 9, thin = rng.range(0.42, 0.6);
    await ribbon({ xAt: (y) => x0 + wob * Math.sin(y * 0.006) + 2.5 * N.n2(y * 0.012, x0), wAt: (y) => w0 * (1 + (top - y) / 650), yTop: top, yBot: bot, v0: 1.2, vLip: 1.2, ncol: 3, benches: [c.y2s, c.y1s].filter((b) => b < top - 20 && b > bot + 20), tau0, thin });
  }
  await ctx.yield();
  const fallGeo = new THREE.BufferGeometry();
  fallGeo.setAttribute('position', new THREE.Float32BufferAttribute(wP, 3));
  fallGeo.setAttribute('aA', new THREE.Float32BufferAttribute(wA, 3));
  fallGeo.setAttribute('aB', new THREE.Float32BufferAttribute(wB, 4));
  fallGeo.setIndex(wI);
  const fallMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
    uniforms: { ...fogU(), uTime: U.time, uSun: U.sunDir, uSunCol: U.sunColor, uSkyCol: U.skyColor },
    vertexShader: /* glsl */`
      attribute vec3 aA; attribute vec4 aB;
      varying vec3 vA; varying vec4 vB; varying float vSun, vDist, vFoot;
      uniform vec3 uSun; uniform float uTime;
      #include <fog_pars_vertex>
      void main(){
        vA = aA; vB = aB;
        vec3 n = normalize(mat3(modelMatrix) * vec3(0.0, 0.3, 0.95));
        vSun = clamp(dot(n, uSun) * 1.5 + 0.2, 0.0, 1.0);
        vec3 p = position;
        vFoot = smoothstep(0.0, 20.0, p.y);                                 // the foot of the fall dissolves: the spray cloud takes over
        float swy = aB.y * min(aB.x, 170.0) * 0.02;                       // free-falling water sways in the wind
        p.x += sin(uTime * 0.45 + aB.x * 0.02 + aA.z * 0.3) * swy;
        p.z += (0.5 + 0.5 * sin(uTime * 0.31 + aB.x * 0.013)) * swy * 0.6;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        vDist = length(mvPosition.xyz);
        vec4 mvNear = mvPosition; mvNear.xyz *= 1.0 - min(0.4, 9.0 / max(vDist, 1.0));   // depth only: rock that stands a few metres proud of the sheet must not punch dark shards through it
        gl_Position = projectionMatrix * mvPosition;
        vec4 clipNear = projectionMatrix * mvNear; gl_Position.z = clipNear.z / clipNear.w * gl_Position.w;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uSunCol, uSkyCol;
      varying vec3 vA; varying vec4 vB; varying float vSun, vDist, vFoot;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      ${GLSL_WATER}
      void main(){
        vec4 w = gfWater(vA, vB, vSun, uTime, vDist, uSunCol, uSkyCol, smoothstep(0.62, 0.9, vB.z));   // the Great Fall and its twin are heavy water; the thin strands on the wall stay threads
        w.a *= vFoot;
        if (w.a < 0.01) discard;
        gl_FragColor = w;
        #include <fog_fragment>
      }`,
  });
  const falls = new THREE.Mesh(fallGeo, fallMat); falls.name = 'falls'; falls.renderOrder = 2; root.add(falls);
  await ctx.yield();

  // ---------- plunge pool and outflow river stub ----------
  const footZ = faceZ(P.fx2, 2);
  const pP = [], pE = [], pI = [];
  const RINGS = 10, SEG = 56;
  pP.push(POOL.x, 0.45, POOL.z); pE.push(1);
  for (let r = 1; r <= RINGS; r++) for (let s = 0; s < SEG; s++) {
    const a = (s / SEG) * 6.2832, q = r / RINGS, wob = 1 + 0.16 * N.n2(Math.cos(a) * 1.6 + 9, Math.sin(a) * 1.6) * q;
    pP.push(POOL.x + Math.cos(a) * POOL.rx * q * wob, 0.45, POOL.z + Math.sin(a) * POOL.rz * q * wob); pE.push(r === RINGS ? 0 : 1);
  }
  for (let s = 0; s < SEG; s++) pI.push(0, 1 + (s + 1) % SEG, 1 + s);
  for (let r = 1; r < RINGS; r++) for (let s = 0; s < SEG; s++) {
    const a = 1 + (r - 1) * SEG + s, b = 1 + (r - 1) * SEG + (s + 1) % SEG, c = a + SEG, d = b + SEG;
    pI.push(a, b, c, b, d, c);
  }
  const RIV = { z0: POOL.z + POOL.rz * 0.72, z1: 340, w0: 62, w1: 30, amp: rng.range(4, 9), ph: rng() * 6 };
  const rivX = (z) => { const q = (z - RIV.z0) / (RIV.z1 - RIV.z0); return POOL.x * (1 - q) + RIV.amp * Math.sin(q * 3.3 + RIV.ph) * q; };
  const rb = pP.length / 3, RR = 40, RC = 8;
  for (let r = 0; r <= RR; r++) for (let i = 0; i <= RC; i++) {
    const q = r / RR, z = lerp(RIV.z0, RIV.z1, q), w = lerp(RIV.w0, RIV.w1, Math.sqrt(q)) * (1 + 0.12 * N.n2(q * 5, 3.3));
    pP.push(rivX(z) + ((i / RC) * 2 - 1) * w * 0.5, 0.4, z);
    pE.push((i === 0 || i === RC ? 0 : i === 1 || i === RC - 1 ? 0.55 : 1) * sst(1, 0.86, q));
  }
  for (let r = 0; r < RR; r++) for (let i = 0; i < RC; i++) { const a = rb + r * (RC + 1) + i, b = a + RC + 1; pI.push(a, b, a + 1, a + 1, b, b + 1); }
  const poolGeo = new THREE.BufferGeometry();
  poolGeo.setAttribute('position', new THREE.Float32BufferAttribute(pP, 3));
  poolGeo.setAttribute('aE', new THREE.Float32BufferAttribute(pE, 1));
  poolGeo.setIndex(pI);
  const poolMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: { ...fogU(), uTime: U.time, uSun: U.sunDir, uSunCol: U.sunColor, uSkyCol: U.skyColor,
      uFoot: { value: new THREE.Vector2(P.fx2, footZ + 10) }, uDeep: { value: cSky.clone().multiplyScalar(0.22).lerp(new THREE.Color('#0a3338'), 0.55) } },
    vertexShader: /* glsl */`
      attribute float aE; varying float vE; varying vec3 vHp; varying vec3 vW;
      #include <fog_pars_vertex>
      void main(){
        vE = aE; vHp = position; vW = (modelMatrix * vec4(position, 1.0)).xyz;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uSun, uSunCol, uSkyCol, uDeep; uniform vec2 uFoot;
      varying float vE; varying vec3 vHp; varying vec3 vW;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      void main(){
        vec2 p = vHp.xz; vec2 rel = p - uFoot; float r = length(rel * vec2(0.8, 1.25));
        float near = min(rstep(95.0, 8.0, r), mix(0.45, 0.6, rstep(60.0, 30.0, r)));   // (capped: the boil at the foot is torn foam, not a solid white bar across the far shore)
        float w1 = fb(p * 0.07 + vec2(0.0, uTime * 0.22));
        float ph = r * 0.3 - uTime * 1.9 + w1 * 6.0;
        float rip = sin(ph) * 0.5 + 0.5;
        float flow = fb(vec2(p.x * 0.16, p.y * 0.05 - uTime * 0.38));
        vec3 V = normalize(cameraPosition - vW);
        float fres = pow(max(1.0 - clamp(V.y, 0.0, 1.0), 0.0), 3.0);
        vec3 c = mix(uDeep, uDeep * 2.1 + vec3(0.02, 0.12, 0.11), flow * 0.75 + rip * 0.25 * near);
        // the mirror: dark wet wall low down, sky higher, broken by the swell that the fall drives outward
        float slope = (rip - 0.5) * (0.25 + 0.6 * near) + (fb(p * 0.33 + vec2(uTime * 0.3, -uTime * 0.5)) - 0.5) * 0.7;
        vec3 refl = mix(uSkyCol * vec3(0.3, 0.36, 0.46), uSkyCol * 0.9, smoothstep(-0.25, 0.3, slope));
        c = mix(c, refl, clamp(fres * 0.62 + 0.05, 0.0, 1.0));
        float foamN = fb(p * 0.11 + vec2(w1 * 1.5, uTime * 0.5)) * 0.65 + rip * 0.2 * near + flow * 0.25;
        float foam = smoothstep(0.92 - near * 0.8, 1.02 - near * 0.62, foamN + near * 0.32);
        foam = max(foam, smoothstep(0.62, 0.8, flow) * 0.45 * (0.3 + 0.7 * near));
        // concentric foam rings riding the swell away from the foot of the fall, torn into arcs
        float ringK = rstep(190.0, 30.0, r) * smoothstep(0.3, 0.62, fb(p * 0.06 + vec2(3.0, uTime * 0.1)) + 0.25 * near);
        float ring = smoothstep(0.82, 0.98, rip) * smoothstep(0.32, 0.6, fb(p * 0.45 + vec2(0.0, uTime * 0.25)));
        foam = max(foam, ring * ringK * 0.8);
        // sheets of blown spray scudding over the surface
        float sheet = smoothstep(0.56, 0.8, fb(vec2(p.x * 0.035 + uTime * 0.05, p.y * 0.012 - uTime * 0.16))) * rstep(210.0, 60.0, r);
        foam = max(foam, sheet * 0.3);
        // churned white water streaming out from the foot in long streaks, down the pool and into the outflow (they thin with distance from the foot)
        // (lanes that wander with the swell, torn along their length into rafts a few metres long and frothy inside: foam, not painted strokes)
        float lane = fb(vec2(p.x * 0.42 + w1 * 2.6 + 0.9 * sin(p.y * 0.07 + w1 * 5.0), p.y * 0.06 - uTime * 0.6)), lane2 = fb(vec2(p.x * 0.8 + 7.0, p.y * 0.22 - uTime * 1.3));
        float streaks = smoothstep(0.5, 0.86, lane) * smoothstep(0.34, 0.7, lane2) * (0.45 + 0.55 * fb(p * 1.3 + vec2(w1, -uTime * 0.9))) * rstep(250.0, 50.0, r);
        foam = max(foam, streaks * 0.5);
        float sunUp = clamp(uSun.y * 3.0, 0.0, 1.0);
        vec3 foamC = vec3(0.95, 0.98, 1.0) * (uSkyCol * 0.5 + uSunCol * (0.2 + 0.8 * sunUp));
        c = mix(c, foamC, foam * smoothstep(0.0, 0.55, vE));
        // sun glints: facets of the chop that happen to face the sun (it stands behind the viewer, so no single glitter path)
        float gd = length(cameraPosition - vW), gs = mix(7.0, 2.2, smoothstep(30.0, 300.0, gd));          // finer close up, so a glint is a spark and never a flake
        float gl = vn(p * gs + vec2(uTime * 0.9, -uTime * 2.1)) * vn(p * gs * 0.47 + vec2(-uTime * 0.6, 3.0 + uTime * 0.8));
        float glN = rstep(90.0, 40.0, gd);                               // close to the camera: half as many, so they are sparks on the chop, not scattered salt
        float glK = smoothstep(0.6 + 0.11 * glN, 0.72 + 0.11 * glN, gl) * smoothstep(0.55, 0.9, rip + flow * 0.4) * sunUp * (1.0 - 0.5 * glN);
        c += uSunCol * 1.5 * glK;
        gl_FragColor = vec4(c, smoothstep(0.0, 0.75, vE) * 0.94);
        #include <fog_fragment>
      }`,
  });
  const pool = new THREE.Mesh(poolGeo, poolMat); pool.name = 'plunge-pool'; pool.renderOrder = 1; root.add(pool);
  await ctx.yield();

  // ---------- spray: billboard puffs, composed as ONE lit cloud ----------
  // A white boil at the foot; two shoulders that climb either side of the falling column (the left one takes the sun, the
  // right one is in the cloud's own shade); a few towers; a low skirt that rolls down-valley over the pool; a thin high veil
  // that carries the bow; a bank of mist on each shore where the bow's feet come down. The column itself keeps a lane of
  // clear air above 30 to 60 m, so the white water is seen coming down INTO the cloud, never through a grey ball.
  const mistGain = opts.mist ?? 1;
  const portalL = new THREE.Vector3(POOL.x, 12, footZ + 90);
  const rp = rng.fork('plume');                                      // (the spray's own stream: its counts follow the graphics level and never move anything else)
  function puffSet() {
    const mC = [], mBase = [], mVel = [], mP = [], mQ = [], mI = []; let mN = 0;
    return {
      puff(bx, by, bz, vx, vy, vz, s0, s1, life, alpha, bright, ph = rp()) {
        const seed = rp();
        for (let k = 0; k < 4; k++) {
          mC.push(k === 0 || k === 3 ? -1 : 1, k < 2 ? -1 : 1, 0);
          mBase.push(bx, by, bz); mVel.push(vx, vy, vz); mP.push(s0, s1, ph, 1 / life); mQ.push(alpha, seed, bright);
        }
        mI.push(mN, mN + 1, mN + 2, mN, mN + 2, mN + 3); mN += 4;
      },
      geometry() {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(mC, 3));
        g.setAttribute('aBase', new THREE.Float32BufferAttribute(mBase, 3));
        g.setAttribute('aVel', new THREE.Float32BufferAttribute(mVel, 3));
        g.setAttribute('aP', new THREE.Float32BufferAttribute(mP, 4));
        g.setAttribute('aQ', new THREE.Float32BufferAttribute(mQ, 3));
        g.setIndex(mI);
        return g;
      },
    };
  }
  const plume = puffSet(), puff = plume.puff;
  const fx = P.fx2, g = () => rp.gauss(), dn = clamp(opts.detail ?? 1, 0.5, 1);
  // (alpha < 0 marks a veil puff: U.veil thins those alone on the final approach; alpha > 2 marks the skirt and the shore banks,
  // which thin a little as U.reach draws the cloud in, so the bow's feet still come down into mist)
  // the thin high veil: it carries the bow's arch across the dark wall, and is never thick enough to grey the wall
  for (let i = 0; i < Math.round(90 * dn); i++) puff(fx + g() * 60, rp.range(10, 50), footZ + rp.range(14, 62), g() * 86, rp.range(50, 130), rp.range(40, 140), rp.range(30, 46), rp.range(70, 110), rp.range(16, 28), -rp.range(0.03, 0.055), 1);
  // the boil: small, dense, bright puffs that hide the foot of the fall and stay low
  for (let i = 0; i < Math.round(150 * dn); i++) puff(fx + g() * 30, rp.range(2, 14), footZ + rp.range(9, 34), g() * 26, rp.range(20, 54), rp.range(10, 46), rp.range(11, 17), rp.range(26, 38), rp.range(5, 9), rp.range(0.34, 0.46), 1.1);
  await ctx.yield();
  // the shoulders: each side of the column a mass that climbs and leans outward, so the cloud has a lit side and a shaded side
  for (let i = 0; i < Math.round(140 * dn); i++) {
    const sd = i % 2 ? 1 : -1;
    puff(fx + sd * (30 + Math.abs(g()) * 30), rp.range(3, 26), footZ + rp.range(8, 42), sd * rp.range(8, 52), rp.range(44, 112), rp.range(12, 66), rp.range(15, 22), rp.range(32, 48), rp.range(8, 14), rp.range(0.22, 0.32), sd < 0 ? 1.1 : 1.0);
  }
  // towers: a few billows that climb well above the rest beside the column, so the top of the cloud is ragged and lit, not an even dome
  for (let i = 0; i < 20; i++) { const sd = i % 2 ? 1 : -1; puff(fx + sd * rp.range(26, 70), rp.range(24, 44), footZ + rp.range(8, 36), g() * 14, rp.range(84, 146), rp.range(8, 40), rp.range(15, 21), rp.range(30, 44), rp.range(10, 15), rp.range(0.22, 0.3), 1.14); }
  // the skirt: low spray that rolls out over the pool toward the camera
  for (let i = 0; i < Math.round(60 * dn); i++) puff(fx + g() * 66, rp.range(4, 14), footZ + rp.range(30, 100), g() * 30, rp.range(5, 24), rp.range(80, 190), rp.range(26, 40), rp.range(50, 76), rp.range(20, 32), 2 + rp.range(0.06, 0.1), 0.98);
  // a bank of mist on each shore of the pool, by the pool's own outline: on its rim and just beyond it, along the arc of either side from
  // abreast of the foot round to the shoulder of the river mouth. The bow's feet come down into it, not onto dry rock
  for (let i = 0; i < 44; i++) {
    const sd = i % 2 ? 1 : -1, a = rp.range(-0.5, 0.85), k = rp.range(0.95, 1.4);
    puff(POOL.x + sd * Math.cos(a) * POOL.rx * k, rp.range(3, 12), POOL.z + Math.sin(a) * POOL.rz * k, sd * rp.range(5, 20), rp.range(8, 24), rp.range(16, 56), rp.range(26, 36), rp.range(46, 66), rp.range(18, 28), 2 + rp.range(0.07, 0.11), 1);
  }
  await ctx.yield();
  // each bench has its own small burst where the tier above lands
  const zTop = faceZ(P.fx0, P.y2 + 10) + 22, zMid = faceZ(P.fx1, P.y1 + 10) + 20;
  for (let i = 0; i < 34; i++) puff(lerp(P.fx0, P.fx1, 0.3) + g() * 11, P.y2 + rp.range(-2, 12), zTop + rp.range(-6, 12), g() * 16, rp.range(14, 38), rp.range(10, 26), rp.range(7, 11), rp.range(16, 27), rp.range(4, 8), rp.range(0.16, 0.26), 1.1);
  for (let i = 0; i < 34; i++) puff(lerp(P.fx1, P.fx2, 0.3) + g() * 18, P.y1 + rp.range(-2, 12), zMid + rp.range(-6, 12), g() * 18, rp.range(14, 40), rp.range(12, 30), rp.range(9, 14), rp.range(20, 32), rp.range(4, 8), rp.range(0.16, 0.26), 1.08);
  for (let i = 0; i < 30; i++) { const y = rp.range(P.y2 + 30, LIP - 20), tf = Math.sqrt((2 * (LIP - y)) / G); puff(P.fx0 + g() * 9, y, faceZ(P.fx0, LIP) + 4.2 * tf + rp.range(0, 6), g() * 7, -rp.range(30, 55), rp.range(6, 16), rp.range(7, 11), rp.range(18, 28), rp.range(4, 7), rp.range(0.1, 0.17), 1.05); }
  for (let i = 0; i < 34; i++) { const y = rp.range(40, P.y1 - 10); puff(P.fx2 + g() * 26, y, faceZ(P.fx2, y) + rp.range(10, 24), g() * 12, -rp.range(18, 40), rp.range(14, 34), rp.range(14, 22), rp.range(36, 56), rp.range(5, 9), rp.range(0.1, 0.16), 1.05); }
  await ctx.yield();
  const mistGeo = plume.geometry();
  const mistMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: { ...fogU(), uTime: U.time, uSun: U.sunDir, uSunCol: U.sunColor, uSkyCol: U.skyColor, uGust: U.gust, uCeil: U.ceil, uGain: { value: mistGain }, uPortal: { value: portalL },
      uVeil: U.veil, uReach: U.reach, uNear: U.near, uFall: { value: new THREE.Vector3(fx, footZ, P.wBot) } },
    vertexShader: /* glsl */`
      attribute vec3 aBase, aVel; attribute vec4 aP; attribute vec3 aQ;
      uniform float uTime, uGust, uGain, uCeil, uVeil, uReach, uNear; uniform vec3 uSun, uPortal, uFall;
      varying vec2 vUv, vQ; varying vec4 vS;   // vS: alpha, seed, light, local y of centre
      varying float vY, vSize, vShade; varying vec3 vL, vWp, vCn;
      #include <fog_pars_vertex>
      void main(){
        float p = fract(uTime * aP.w + aP.z);
        float e = 1.0 - pow(max(1.0 - p, 0.0), 1.7);
        float low = 1.0 - step(55.0, aBase.y);                                                                  // the cloud at the foot (the bench bursts higher up are left alone)
        // uNear: 0 with the traveller far down the valley, 1 (and on to 2) close under the fall (the world sets it from the traveller's place on the
        // route). Close up the same cloud is seen from below and from inside its drift: it then climbs a little less and swells less,
        // so the foot is a dense, lumpy boil, and the lane of clear air in front of the column is wider and starts lower
        float nr = min(uNear, 1.0), nr2 = clamp(uNear - 1.0, 0.0, 1.0);                                          // (uNear runs on from 1 to 2 over the last hundred metres to the portal: the boil is then seen from its own edge and is held lower still)
        float squat = mix(1.0, 0.64, nr * low) * mix(1.0, 0.72, nr2 * low);
        vec3 c = aBase + aVel * vec3(1.0, squat, mix(0.5, 1.0, uReach)) * e;           // uReach: how far the cloud rolls down-valley
        c.x += sin(uTime * 0.21 + aQ.y * 40.0) * 5.0 * e;
        float hi = (1.0 - low) * step(aBase.y, 148.0);                                                         // the spray that streams off the bottom tier, in front of the column
        float size = mix(aP.x, aP.y, sqrt(max(p, 0.0))) * mix(1.0, 0.84, nr * low) * mix(1.0, 0.84, nr2 * low) * mix(1.0, 0.62, nr * hi);
        vec4 wc = modelMatrix * vec4(c, 1.0);
        vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        float ang = aQ.y * 6.2832 + (aQ.y - 0.5) * uTime * 0.12, ca = cos(ang), sa = sin(ang);
        vec2 q = vec2(position.x * ca - position.y * sa, position.x * sa + position.y * ca);
        vUv = position.xy; vQ = q;
        vec3 wp = wc.xyz + (right * q.x + up * q.y) * size;
        vY = c.y + up.y * q.y * size; vSize = size; vWp = c + (right * q.x + up * q.y) * size;
        vec3 toCam = cameraPosition - wc.xyz; float dist = max(length(toCam), 0.01);
        float life = smoothstep(0.0, 0.16, p) * (1.0 - smoothstep(0.42, 1.0, p));
        float nearF = smoothstep(size * 0.35, size * 1.6 + 20.0, dist);
        float cf = fract(aQ.y * 7.31);
        float ceilP = uCeil * (0.8 + 0.3 * cf);                                                               // every puff has its own ceiling, so the top of the cloud is lumpy
        float ceilK = 1.0 - low * smoothstep(ceilP * 0.62, ceilP, c.y + size * 0.35);                         // the plume is held under a ceiling so the wall above it stays dark
        // the lane of clear air in front of the falling column and of the wet rock that flanks it: the cloud climbs either side of it as two
        // shoulders, the white water comes down between them into the boil
        float ax = abs(c.x - uFall.x);
        float colK = 1.0 - mix(0.94, 1.0, nr2) * low * (1.0 - smoothstep(uFall.z * (mix(0.32, 0.85, nr) + 0.25 * nr2), uFall.z * (mix(0.66, 1.25, nr) + 0.3 * nr2), ax)) * smoothstep(mix(24.0, 15.0, nr) - 7.0 * nr2, mix(58.0, 38.0, nr) - 16.0 * nr2, c.y + size * 0.25);
        float hiK = 1.0 - 0.85 * nr * hi;                                                                   // ... is thinner and tighter from below: it must not veil the rock beside the column
        float veilK = aQ.x < 0.0 ? uVeil : aQ.x > 1.5 ? mix(0.4, 1.0, uReach) : 1.0;
        float alpha0 = aQ.x > 1.5 ? aQ.x - 2.0 : abs(aQ.x);
        // clear air in front of the ring: a cone that opens from the portal's face at 20 degrees to its axis (the widest angle the opening is
        // ever looked into from), whoever comes and from wherever; the cloud stands behind the ring and round the cone, never in it
        float coneR = 7.0 + 0.36 * max(c.z - uPortal.z, 0.0);
        float lane = smoothstep(coneR + size * 0.5, coneR + size + 16.0, length(c.xy - uPortal.xy));
        lane = mix(1.0, lane, smoothstep(uPortal.z - 8.0, uPortal.z + 6.0, c.z));
        vS = vec4(alpha0 * life * nearF * uGust * uGain * ceilK * colK * hiK * veilK * lane, aQ.y, aQ.z, clamp(c.y / 150.0, 0.0, 1.0));
        vec3 key = normalize(uSun + vec3(-0.5, 0.45, 0.0));                                                    // the key comes from the upper left of the sun
        vL = (viewMatrix * vec4(key, 0.0)).xyz;
        // the cloud as one body: its outward normal at this corner, from a point low in its heart (taller than wide, so the top takes the light)
        vec3 cn = (vWp - vec3(uFall.x, 14.0, uFall.y + 34.0)) * vec3(1.0, 1.5, 1.0);
        vec3 cnn = cn / max(length(cn), 1.0);
        vCn = (viewMatrix * vec4(mat3(modelMatrix) * cnn, 0.0)).xyz;
        // the cloud is seen from in front with the sun behind the camera, and every face of it would be lit: the side away from the key
        // (+X, the right shoulder) stands in the cloud's own shade, and so does its underside
        vShade = low * mix(0.6, 1.0, nr) * (0.46 * smoothstep(-0.15, 0.55, cnn.x) + 0.2 * (1.0 - smoothstep(4.0, 20.0, vWp.y)));
        vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uSunCol, uSkyCol;
      varying vec2 vUv, vQ; varying vec4 vS; varying float vY, vSize, vShade; varying vec3 vL, vWp, vCn;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      void main(){
        float r2 = dot(vUv, vUv);
        if (r2 > 1.0) discard;
        vec2 q = vUv * 1.7 + vS.y * 31.0 + vec2(0.0, -uTime * 0.035);
        float n = vn(q) * 0.55 + vn(q * 2.1 + 9.0) * 0.3 + vn(q * 4.3 + 3.0) * 0.15;
        // one field of billows shared by every puff (it rises and rolls toward +Z), so overlapping puffs agree on where the cloud is thick and lit
        vec2 wq = vec2(vWp.x * 0.021 + vWp.z * 0.013, vWp.y * 0.024 - uTime * 0.11);
        float wn = vn(wq) * 0.6 + vn(wq * 2.3 + vec2(5.0, -uTime * 0.07)) * 0.4;
        float sh = 1.0 - r2; sh = sh * sh * smoothstep(0.4, 0.84, n + sh * 0.42) * smoothstep(0.12, 0.55, wn + sh * 0.3);   // eroded hard enough that the cloud is billows with gaps, not an airbrushed oval
        float a = vS.x * sh * smoothstep(-3.0, 16.0, vY) * (1.0 - 0.5 * smoothstep(46.0, 130.0, vWp.y));        // thinner upward: the column shows through and above it
        if (a < 0.004) discard;
        // lit as ONE volume: the cloud's own normal carries the big light and shade, the puff's ball only the billow on top of it
        vec3 nb = normalize(vec3(vQ * 1.15, sqrt(max(1.0 - r2, 0.0)) + 0.25));
        vec3 nn = normalize(mix(nb, vCn, 0.62) + vec3(0.0, 0.0, 1e-4));
        float l = (0.5 + 0.5 * dot(nn, normalize(vL))) * (0.8 + 0.34 * n) * (0.66 + 0.6 * wn) * vS.z * (1.0 - vShade);
        vec3 shade = uSkyCol * vec3(0.6, 0.7, 0.86) + vec3(0.03, 0.04, 0.06), lit = (uSunCol * 0.42 + 0.58) * 0.98;   // a sunlit side, and slate blue where the cloud shades itself
        vec3 c = mix(shade, lit, smoothstep(0.4, 0.9, l));
        gl_FragColor = vec4(c, a);
        #include <fog_fragment>
      }`,
  });
  const mist = new THREE.Mesh(mistGeo, mistMat); mist.name = 'spray-plume'; mist.frustumCulled = false; mist.renderOrder = 3; root.add(mist);

  // ---------- the rainbow: antisolar bow, masked by the spray it lives in ----------
  const PLUME = { c: new THREE.Vector3(fx * 0.5, 44, footZ + 70), r: new THREE.Vector3(205, 190, 160) };   // the dense plume and its near drift: the bow's limbs break up before they reach bare rock
  const NTH = 22, NPH = 110, bP = [], bI = [];
  for (let j = 0; j <= NPH; j++) for (let i = 0; i <= NTH; i++) bP.push(36 + (i / NTH) * 21, (j / NPH * 2 - 1) * 2.3, 0);
  for (let j = 0; j < NPH; j++) for (let i = 0; i < NTH; i++) { const a = j * (NTH + 1) + i, b = a + NTH + 1; bI.push(a, b, a + 1, a + 1, b, b + 1); }
  const bowGeo = new THREE.BufferGeometry();
  bowGeo.setAttribute('position', new THREE.Float32BufferAttribute(bP, 3));
  bowGeo.setIndex(bI);
  const mkBow = (bu) => new THREE.ShaderMaterial({
    // Masked by the spray volume, and depth-tested where the colour stands: each vertex lies on a curtain that hangs in the spray some
    // 50 m in front of the wall and bends toward the camera with the wings (uCurtain), so the wall behind the spray never cuts the arch
    // while a tree or a boulder on the near shore hides the bow's foot.
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
    // (not purely additive: the bow also takes a share of what is behind it away, so its colours hold against white spray instead of clipping to white)
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: { ...fogU(), uTime: U.time, uSun: U.sunDir, uBow: bu.bow, uSecond: bu.second, uInv: U.inv, uGain: { value: bu.gain },
      uPlumeW: { value: bu.c.clone() }, uPc: { value: bu.c }, uPr: { value: bu.r }, uCurtain: { value: bu.curtain }, uFeet: { value: bu.feet } },
    vertexShader: /* glsl */`
      uniform vec3 uSun, uPlumeW, uCurtain; uniform mat4 uInv; varying vec3 vDir; varying float vTh;
      #include <fog_pars_vertex>
      void main(){
        vec3 A = -normalize(uSun);
        vec3 Uu = normalize(vec3(0.0, 1.0, 0.0) - A * A.y), Rr = cross(A, Uu);
        float th = radians(position.x);
        vec3 dir = A * cos(th) + sin(th) * (Uu * cos(position.y) + Rr * sin(position.y));
        float R = clamp(distance(cameraPosition, uPlumeW) - 110.0, 30.0, 520.0);
        // the curtain z = z0 + k * |x - xc| (two planes): the ray meets one of them
        vec3 o = (uInv * vec4(cameraPosition, 1.0)).xyz, d = mat3(uInv) * dir;
        o.x -= uCurtain.z;
        float dA = d.z - uCurtain.y * d.x, dB = d.z + uCurtain.y * d.x;
        float tA = (uCurtain.x + uCurtain.y * o.x - o.z) / min(dA, -1e-3), tB = (uCurtain.x - uCurtain.y * o.x - o.z) / min(dB, -1e-3);
        if (dA < -0.02 && tA > 0.0 && o.x + d.x * tA >= 0.0) R = clamp(tA, 30.0, 900.0);
        else if (dB < -0.02 && tB > 0.0 && o.x + d.x * tB <= 0.0) R = clamp(tB, 30.0, 900.0);
        vDir = dir; vTh = position.x;
        vec4 mvPosition = viewMatrix * vec4(cameraPosition + dir * R, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uBow, uGain, uSecond; uniform mat4 uInv; uniform vec3 uPc, uPr, uSun; uniform vec2 uFeet;
      varying vec3 vDir; varying float vTh;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      ${GLSL_FOG_FADE}
      vec3 spec(float t){ float h = (1.0 - t) * 0.76;
        vec3 c = clamp(abs(fract(h + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
        c = mix(vec3(1.0), c, 0.86); return c * c; }
      void main(){
        vec3 o = (uInv * vec4(cameraPosition, 1.0)).xyz;
        vec3 d = normalize(mat3(uInv) * normalize(vDir));
        vec3 oo = (o - uPc) / uPr, dd = d / uPr;
        float a = dot(dd, dd), b = dot(oo, dd), c = dot(oo, oo) - 1.0;
        float disc = b * b - a * c;
        if (disc <= 0.0) discard;
        float sq = sqrt(max(disc, 0.0)), t0 = max((-b - sq) / a, 0.0), t1 = (-b + sq) / a;
        if (t1 <= t0) discard;
        vec3 pf = o + d * mix(t0, t1, 0.72);                      // well into the spray along this ray: where the colour seems to stand
        float core = disc / a;                                   // 1 through the middle of the spray, 0 at its edge
        float dens = (1.0 - exp(-(t1 - t0) / 60.0)) * smoothstep(0.0, 0.7, core) * smoothstep(0.0, 0.4, core);
        float brk = 0.62 + 0.38 * smoothstep(0.25, 0.7, fb(vec2(atan(d.x, -d.z) * 6.0, d.y * 8.0) + vec2(uTime * 0.012, -uTime * 0.02)));
        // the feet come down into the mist on the shores and thin out there: never a painted band on dry rock beyond the spray
        float hor = smoothstep(uFeet.x, uFeet.y, pf.y) * (1.0 - 0.8 * smoothstep(uPr.x * 0.5, uPr.x * 0.85, abs(pf.x - uPc.x)));
        vec3 col = vec3(0.0); float dark = 0.0;
        float t = (vTh - 39.6) / 3.3;
        if (t > 0.0 && t < 1.0) col += spec(t) * pow(max(sin(3.14159 * t), 0.0), 0.7);
        // the outer bow is a ghost: wider than the inner one, its colours reversed and paler, a few hundredths of its strength (uSecond), and it
        // stands only where the line of sight runs through the thick of the spray and ends low in it: over the rock above the boil there is none
        float sec = uSecond * smoothstep(0.35, 0.85, core) * (1.0 - smoothstep(0.45, 0.8, (pf.y - uPc.y) / uPr.y));
        float t2 = (vTh - 49.6) / 5.6;
        if (t2 > 0.0 && t2 < 1.0) col += mix(vec3(0.5), spec(1.0 - t2), 0.8) * pow(max(sin(3.14159 * t2), 0.0), 0.7) * sec;
        dark = smoothstep(42.9, 44.0, vTh) * (1.0 - smoothstep(48.8, 49.9, vTh)) * min(sec * 1.6, 0.5);      // the darker band of sky between the two bows
        col += vec3(0.05, 0.055, 0.06) * smoothstep(36.2, 39.5, vTh) * (1.0 - smoothstep(40.2, 41.6, vTh));  // the sky inside the bow is a little brighter
        float k = uBow * uGain * dens * brk * hor * fogFade() * smoothstep(0.0, 0.08, uSun.y);
        float lum = max(col.r, max(col.g, col.b));
        gl_FragColor = vec4(col * k * 1.4, clamp(k * (0.62 * lum + 0.3 * dark), 0.0, 0.8));
      }`,
  });
  const bowMat = mkBow({ bow: U.bow, second: U.second, gain: opts.rainbow ?? 1, c: PLUME.c, r: PLUME.r, curtain: new THREE.Vector3(footZ + 50, 0.55, fx * 0.5), feet: new THREE.Vector2(6, 40) });
  const bow = new THREE.Mesh(bowGeo, bowMat); bow.name = 'rainbow'; bow.frustumCulled = false; bow.renderOrder = 5; root.add(bow);
  // A second, small bow in another spray (the valley's side fall): the same shader and geometry (one program), masked by its own small
  // volume, drawn on the upright plane z = center.z through that spray and depth-tested like the first. Call it during the build.
  const extraBows = [];
  function addBow(o) {
    const c = new THREE.Vector3().fromArray(o.center), r = new THREE.Vector3().fromArray(o.radius);
    const mat = mkBow({ bow: { value: o.strength ?? 1 }, second: { value: 0 }, gain: o.gain ?? 1, c, r, curtain: new THREE.Vector3(c.z, 0, -1e4), feet: new THREE.Vector2(c.y - r.y * 0.8, c.y - r.y * 0.2) });
    const mesh = new THREE.Mesh(bowGeo, mat); mesh.name = 'rainbow-scrap'; mesh.frustumCulled = false; mesh.renderOrder = 5; root.add(mesh);
    extraBows.push({ mat, c });
    return mesh;
  }
  await ctx.yield();

  // ---------- foam collars round the rocks that stand in the pool and the outflow ----------
  {
    const cP = [], cA = [], cI = [], SEG = 14;
    for (const [x, z, r] of collars) {
      const b0 = cP.length / 3, sd = hsh(x, z, 9) * 50, r0 = r * 0.7, r1 = r * 1.14 + 0.4;
      for (let k = 0; k <= SEG; k++) {
        const a = (k / SEG) * 6.2832, ca = Math.cos(a), sa = Math.sin(a), wob = 1 + 0.22 * Math.sin(a * 3 + sd);
        cP.push(x + ca * r0, 0.52, z + sa * r0, x + ca * r1 * wob, 0.5, z + sa * r1 * wob);
        cA.push(0, a, sd, 1, a, sd);
      }
      for (let k = 0; k < SEG; k++) { const a = b0 + k * 2; cI.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.Float32BufferAttribute(cP, 3)); cg.setAttribute('aC', new THREE.Float32BufferAttribute(cA, 3)); cg.setIndex(cI);
    const cm = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
      uniforms: { ...fogU(), uTime: U.time, uSun: U.sunDir, uSunCol: U.sunColor, uSkyCol: U.skyColor },
      vertexShader: /* glsl */`
        attribute vec3 aC; varying vec3 vC;
        #include <fog_pars_vertex>
        void main(){ vC = aC; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform float uTime; uniform vec3 uSun, uSunCol, uSkyCol; varying vec3 vC;
        #include <fog_pars_fragment>
        ${GLSL_NOISE}
        void main(){
          float n = fb(vec2(vC.y * 2.4 + vC.z, vC.x * 2.2 - uTime * 0.3));
          float a = rstep(1.0, 0.3, vC.x) * smoothstep(0.42, 0.7, n + 0.3 * (1.0 - vC.x)) * 0.7;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vec3(0.95, 0.98, 1.0) * (uSkyCol * 0.5 + uSunCol * (0.2 + 0.8 * clamp(uSun.y * 3.0, 0.0, 1.0))), a);
          #include <fog_fragment>
        }`,
    });
    const collar = new THREE.Mesh(cg, cm); collar.name = 'foam-collars'; collar.renderOrder = 1.5; if (collars.length) root.add(collar);
  }

  // ---------- anchors ----------
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const pz = footZ + 90, px = POOL.x;
  let top = 0; for (const c of cols) top = Math.max(top, c.crest);
  const anchors = {
    portalSeat: { position: V(px, 12, pz), facing: V(0, 0, 1), radius: 7 },
    flyThrough: [V(px + 34, 30, pz + 560), V(px + 14, 40, pz + 390), V(px + 2, 27, pz + 240), V(px, 14, pz + 150), V(px, 12, pz + 120), V(px, 12, pz + 60), V(px, 12, pz)],
    viewpoints: { far: V(20, 18, footZ + 690), mid: V(10, 40, footZ + 420), close: V(px, 14, footZ + 240) },
    lookAt: V(P.fx1, 210, footZ - 10),
    lip: V(P.fx0, LIP, faceZ(P.fx0, LIP)),
    ledgeUpper: V(P.fx0, P.y2 + 6, zTop), ledgeLower: V(P.fx1, P.y1 + 6, zMid), foot: V(P.fx2, 0, footZ + 10),
    poolCenter: V(POOL.x, 0.45, POOL.z), poolRadius: Math.max(POOL.rx, POOL.rz),
    riverStart: { position: V(rivX(RIV.z1 - 40), 0.4, RIV.z1 - 40), direction: V(0, 0, 1), width: RIV.w1 },
    plumeCenter: PLUME.c.clone(), plumeSize: V(220, 140, 200),
    tiers: { lip: LIP, upper: P.y2, lower: P.y1 },                     // heights of the three lips
    sprayReach: { veil: 62 + 140, skirt: 100 + 190 },                  // how far in front of the foot the high veil and the low skirt can drift (their launch depth plus their longest run)
    rainbowApex: V(px + 40, 118, footZ + 60),
    sunDirDefault: sunDefault.clone(),
    // extras for the valley terrain: where to keep the ground below the water, and where the wings curl to
    pool: { x: POOL.x, z: POOL.z, rx: POOL.rx, rz: POOL.rz, level: 0.45 },
    riverCourse: { xAt: rivX, z0: RIV.z0, z1: RIV.z1, w0: RIV.w0, w1: RIV.w1, level: 0.4 },
    footZ, wing: P.wing, halfWidth: HW,
  };

  const _m = new THREE.Matrix4(), _a = new THREE.Vector3(), _b = new THREE.Vector3();
  let sunTries = 0;
  const hero = {
    object: root, radius: 300, height: top, center: V(0, 150, footZ + 20), anchors,
    uniforms: U, ground: true, groundY: 0,
    setProgress(u) { U.bow.value = sst(0.35, 0.55, u); },
    addBow,
    update(dt, time) {
      U.time.value = time;
      root.updateWorldMatrix(true, false);
      U.inv.value.copy(root.matrixWorld).invert();
      PLUME.r.y = clamp(90 + (U.ceil.value - 78) * 1.92, 112, 190); PLUME.c.y = PLUME.r.y * 0.38;   // from far away thin spray high on the wall carries the arch; close up it lives only in the low plume
      bowMat.uniforms.uPlumeW.value.copy(PLUME.c).applyMatrix4(root.matrixWorld);
      for (const b of extraBows) b.mat.uniforms.uPlumeW.value.copy(b.c).applyMatrix4(root.matrixWorld);
      if (!sunGiven && sunTries < 5) {            // adopt the scene's sun if the world did not pass one
        sunTries++;
        let s = root; while (s.parent) s = s.parent;
        let light = null; s.traverse((o) => { if (!light && o.isDirectionalLight) light = o; });
        if (light) { light.getWorldPosition(_a); light.target.getWorldPosition(_b); if (_a.sub(_b).lengthSq() > 1e-6) { U.sunDir.value.copy(_a).normalize(); sunGiven = true; } }
      }
    },
    dispose() {},
  };
  return hero;
}
