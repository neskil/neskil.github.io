// SIX ARMS: inside a winter cloud one ice crystal grows from a clear hexagonal plate into a sixty-metre star; we skim
// along an arm as it grows, climb over the finished star and fall with it out of the cloud base into low gold light
// over a dark sea.
//
// Map of this file (in order)
//   HOURS            the four palettes (golden, dawn, day, night): cloud colours, hollow, key, sun, band, ceiling, sea.
//   mono()           smooth interpolation for every timeline table.
//   GLSL             NOISE, the DOME (cloud billows, the hidden sun's glow and the hollow above the base: seen from
//                    outside, in the opening, it is a round WELL: a break in the cloud with depth, the lit cloud
//                    curling in through a wide blue-grey shaded band of billows to deep blue air, no outline; three
//                    small blue clearings, U.uHo: behind the plate, the column and under the far fern star; ceiling, band, sun, veils, sea,
//                    lighthouse beam and surf below the base; the two are joined by the ragged tear in the base. The
//                    SEA is three crossing wave trains of 60, 38 and 23 m standing in short lens-shaped crests, each
//                    coming and going in patches and fading out by its pixel footprint (gone by two pixels a wave,
//                    measured from the drawing buffer) so the far sea is smooth tone and nothing weaves; warm glints
//                    on the crests and the slopes turned to the sun, a fine sparkle on the sun's road, whitecaps in
//                    rough weather; the beam is a faint wide wedge), the depth-only FLOOR that hides the world below
//                    until the tear opens (wisps fade out above it, so it never shows as a line), DROPLETS (glass
//                    globes with a broad dark rim: far field, near field, a few at the lens; a clear lane to the
//                    opening plate and, off the tip, to the fern star and then the broken plate), WISPS (fog rags,
//                    kept out of the well and the clearings), GLINTS (one on a corner of the hub hexagon in the
//                    opening, one on each growing tip with a flash at every burst, one on each of six companions),
//                    THREADS (about 80 soft wisps of vapour, each a short bent ribbon the colour of the fog, drawn in
//                    to the growing tips: seen only between 4 and 24 m, so on the skim, never as scratches from afar,
//                    and only while the star grows in the cloud: U.uThread) and FLAKES (the falling crowd below the
//                    base; a big plate flashes along its ribs only; far ones are small six-rayed sparks; from inside
//                    the cloud they and the rippled sea show through the tear once it is wide, and a small tear
//                    shows clean blue depth). All fog comes from the part's SIX_ARMS_FOG_GLSL.
//   build()          1 seeded mood (hour, habit, rime, weather, rare)   2 hero   3 PATH: PTS = [x, y, z, brief second],
//                    and the tables DIP, NBW, SPIN (the star's turn), NB (the neighbour's track)
//                    4 timelines: sec(u), grow (the crystal's own clock), starY, spin, tear, nbX/nbY/nbZ   5 uniforms U
//                    6 dome + floor   7 droplets, glints   8 wisps   9 companions (a bundle of hollow needles, capped
//                    columns, fern stars, small stars; five are staged: the needle bundle on the left of the well at
//                    4 s, CO15 the capped column beside the low orbit, CO30 a fern star face-on beyond the tip (the
//                    subject at 30-31 s), CO33 the broken sector plate at the centre of the turn off the tip, CO31 a
//                    fern star low on the hollow there)   10 flakes, the near neighbour `nbr` and the exit's
//                    neighbour `nbr2` (finished stars from the part's makeCrystal)   11 lighthouse   12 pois,
//                    apply(), post, update, dispose.
// Where things are set
//   path and beats   PTS (section 3); the brief second of each control point gives sec(u) and pace(u). The orbit sinks
//                    to a low raking view by 15 s; off the tip (30 s) the path turns hard left, nearly level, then
//                    climbs to 24 m over the star as the base tears (37 s).
//   hero placement   apply(): position (0, starY(s), 0), yaw spin(s), tilt about world Z, a small rock; in the opening
//                    the crystal is a plain hexagonal plate shown larger than life (the whole 1.8 times, its hub
//                    plate up to 2.35 times more: hero.setHubBoost), tumbling face-on to the entry in its well; it
//                    widens in two bursts, the arms start at 1 s and stand clear of the enlarged plate's corners by
//                    3 s, then the star grows burst by burst (every 1.3 s of its own clock) with a flash each;
//                    it settles flat and to its true size between 2 and 9 s (grow and burstS, section 4); the exit line
//                    runs through the hero's pruned notch (anchors.notch), the portal 36 m beyond it.
//   pois             section 12: hub on the approach and orbit, with a nod down to the nucleus at 22 s; the arm tip on
//                    the skim; off the tip the gaze leads the turn (next arm, then hub) and dips toward the ring as
//                    the base tears (37-41 s, DIP); the sunward horizon in the fall (40-46 s) with a lean to the
//                    neighbour (NBW); the hub again until the exit line.
//   seeded moods     section 1.   exposure, bloom, grade: `post` in the return.   fog: U.uSaAtm (x cloud density,
//                    y haze density, z base height, w tear radius) and U.uSaHub (xyz crystal, w hollow radius).
//   scripted moments (all keyed to u through sec(u)): hero.setSeconds(grow(s)) growth; U.uSaAtm.w the tear; U.uSaBelow
//                    cloud light to low sun; U.uTips globes shrinking round the twelve growing tips; U.uGl the glints
//                    (x hexagon, y tips, z burst flash, w tips on); U.uSaOpen, U.uLane, U.uLaneP, U.uHollow the opening
//                    (pale hub, round well, clear lane, hollow colour); U.uThread the vapour threads; nbr the
//                    neighbour's fall, nbr2 the exit's neighbour sliding in beside the ring; U.uLamp.w the beam.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, makeCrystal, makeIceMaterial, makeSegmentGeometryAsync, SIX_ARMS_ENV_GLSL, SIX_ARMS_FOG_GLSL } from '../parts/six-arms.js';

const HOURS = {
  golden: { mid: '#C4D6EC', hi: '#EFF8FF', lo: '#2F4A73', hollow: '#6F97CC', key: '#EFF8FF', sun: '#F0B35A', band: '#F0B35A', ceil: '#27405F', sea: '#0A1420', air: '#A9896C', elev: 6, lamp: 0.35, fog: [0.9, 0.8], seaMix: [3.0, 0.45, 0.015], sheen: 0.1 },
  dawn: { mid: '#D0C6EA', hi: '#F6F0FF', lo: '#3B3A72', hollow: '#8582CC', key: '#F4ECFF', sun: '#FF9DAA', band: '#F2A0A8', ceil: '#39335E', sea: '#0C1226', air: '#B08398', elev: 5, lamp: 0.5, fog: [0.9, 0.8], seaMix: [3.0, 0.4, 0.015], sheen: 0.1 },
  day: { mid: '#D2E1F2', hi: '#F2F8FF', lo: '#3C5F8E', hollow: '#6FA4DA', key: '#FFFFFF', sun: '#EEF3F8', band: '#C4D7E8', ceil: '#566F8E', sea: '#14304A', air: '#AFC4D6', elev: 12, lamp: 0.15, fog: [0.82, 0.74], seaMix: [1.7, 0.12, 0.0], sheen: 0.1 },
  night: { mid: '#52639C', hi: '#8194CC', lo: '#0E1433', hollow: '#2B3A78', key: '#C9D6FF', sun: '#DCE6FF', band: '#3D4E7C', ceil: '#141B36', sea: '#03060C', air: '#2A375C', elev: 11, lamp: 1, fog: [0.9, 0.8], seaMix: [6.0, 0.6, 0.02], sheen: 0.3 },
};
const NUCLEUS = '#17120E';

// smooth monotone curve through [[x, y], ...]
function mono(T) {
  const n = T.length, m = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const a = i > 0 ? (T[i][1] - T[i - 1][1]) / (T[i][0] - T[i - 1][0]) : 0, b = i < n - 1 ? (T[i + 1][1] - T[i][1]) / (T[i + 1][0] - T[i][0]) : 0;
    m[i] = (i === 0) ? b : (i === n - 1) ? a : (a * b <= 0 ? 0 : 2 * a * b / (a + b));
  }
  return (x) => {
    if (x <= T[0][0]) return T[0][1]; if (x >= T[n - 1][0]) return T[n - 1][1];
    let i = 1; while (T[i][0] < x) i++;
    const h = T[i][0] - T[i - 1][0], t = (x - T[i - 1][0]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * T[i - 1][1] + (t3 - 2 * t2 + t) * h * m[i - 1] + (-2 * t3 + 3 * t2) * T[i][1] + (t3 - t2) * h * m[i];
  };
}

const NOISE = /* glsl */`
float h21(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.y); }
float h31(vec3 p){ p = fract(p*0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y)*p.z); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(mix(h31(i), h31(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h31(i + vec3(0.0, 1.0, 0.0)), h31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
             mix(mix(h31(i + vec3(0.0, 0.0, 1.0)), h31(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h31(i + vec3(0.0, 1.0, 1.0)), h31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
// 1 inside the ragged tear in the cloud base
float tearAt(vec2 pb){
  float rg = (vn2(pb*0.045) - 0.5)*uSaAtm.w*0.5;
  return (1.0 - smoothstep(uSaAtm.w*0.70, uSaAtm.w*1.05 + 0.01, length(pb - uSaHub.xz) + rg))*step(0.01, uSaAtm.w);
}
`;
const HEAD = SIX_ARMS_ENV_GLSL + SIX_ARMS_FOG_GLSL + 'uniform float uT, uSec, uSeaY, uTipR, uLane, uSheen, uThread;\nuniform vec2 uRes;\nuniform vec3 uGlP, uSunDir, uSunCol, uBand, uHollow, uSaCobalt, uSaPale, uSaMid, uSeaMix;\nuniform vec4 uLamp, uWx, uGl, uLaneP, uHo[3];\n' + NOISE;

const DOME_VERT = /* glsl */`
varying vec3 vW;
void main(){ vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }
`;
const DOME_FRAG = /* glsl */`
varying vec3 vW;
${HEAD}
vec3 cloudBg(vec3 d){
  vec3 c = saCloudCol(d);
  // slow billows drifting upward in three sizes, the darker ones a little bluer, and the hidden sun's glow up to the left
  float b0 = vn3(d*1.1 + vec3(5.0, -uT*0.11, 2.0));
  float b = vn3(d*2.3 + vec3(0.0, -uT*0.2, 0.0))*0.6 + vn3(d*5.1 + vec3(3.0, -uT*0.36, 1.0))*0.4;
  float kd = max(dot(d, uSaKeyDir), 0.0), k4 = kd*kd*kd*kd;
  c *= 0.60 + 0.80*b + 0.34*(b0 - 0.5);
  c = mix(vec3(dot(c, vec3(0.3333))), c, 1.3);
  c = mix(c*vec3(0.82, 0.93, 1.10), c, smoothstep(0.36, 0.66, b*0.6 + b0*0.4));
  c += uSaKeyCol*(0.17*k4 + 0.05*kd*kd)*(0.5 + b);
  // (in the opening the plate stands on edge, face-on to the entry, so its clearing is round: uLane 1)
  vec3 sc = vec3(1.0, mix(2.0, 1.1, uLane), 1.0);
  vec3 oc = (cameraPosition - uSaHub.xyz)*sc, dd = d*sc; dd /= max(length(dd), 1e-4);
  // a ragged clearing, not an oval: the billows push its rim in and out
  float b9 = vn3(d*9.0 + vec3(1.0, -uT*0.5, 4.0));
  float R = uSaHub.w*1.1*(0.72 + 0.28*b0 + 0.26*b + 0.16*b9), bq = dot(oc, dd), h = bq*bq - (dot(oc, oc) - R*R), sq = sqrt(max(h, 0.0));
  float chord = max(-bq + sq, 0.0) - max(-bq - sq, 0.0);
  float cr = chord/R, hol = (1.0 - exp(-cr*cr*0.9))*smoothstep(0.0, 0.5, h/(R*R));
  hol = max(hol, (1.0 - smoothstep(0.7, 1.05, length(oc)/R))*(1.0 - smoothstep(-0.25, 0.08, d.y)));   // from inside, the hollow deepens downward
  float b2 = b*0.7 + 0.3*b9;
  vec3 hcol = uHollow*(0.62 + 0.8*b2)*mix(0.5, 1.0, smoothstep(-0.6, 0.0, d.y));
  vec3 inC = mix(c, hcol, hol*0.92);
  // every staged companion has eaten a small clearing of its own: a soft patch of the hollow's blue behind it
  for (int i = 0; i < 3; i++) {
    vec3 o2 = cameraPosition - uHo[i].xyz; float r2 = uHo[i].w*(0.75 + 0.5*b), q2 = dot(o2, d), h2 = q2*q2 - (dot(o2, o2) - r2*r2);
    // (THE PLATE'S, the first, is a ball of clear air about the plate's own place, and its blue goes by the length of
    // clear air the eye's ray crosses AHEAD of the eye: true distances from the plate and nothing else. Seen from
    // outside that is the chord through the ball, as it always was; from inside it is the way on to the ball's far
    // side, long toward the plate and short away from it, so the blue thins smoothly all round the eye as it leaves
    // and no plane through the eye cuts it. The other two keep the whole chord where the ball's middle is ahead)
    float s2 = sqrt(max(h2, 0.0)), c2 = (i == 0 ? s2 - clamp(q2, -s2, s2) : 2.0*s2*step(q2, 0.0))/max(r2, 0.1);
    inC = mix(inC, uHollow*(0.95 + 0.5*b2) + uSaMid*0.05, (1.0 - exp(-c2*c2*0.8))*0.86*step(0.5, uHo[i].w)*(1.0 - smoothstep(18.0, 45.0, length(o2))));
  }
  // Seen from outside (the opening) the clearing is a WELL in the cloud, a break with depth and no outline. Three
  // tones, each feathering into the next over a wide band whose edge the billows push in and out (two different
  // edges, so they never run parallel): the lit cloud; the cloud curling into the well, shaded blue-grey (darker
  // between its billows, and where it is the underside above the pit; the tops of the billows below it take the
  // light); the clear deep-blue air in the middle, where the far wall's billows drift a tone lighter. Wisps reach
  // across the inner edge. (rn: how far across the clearing the eye's ray passes, 0 through its middle, 1 at its rim)
  float rn = sqrt(max(dot(oc, oc) - bq*bq, 0.0))/max(uSaHub.w*1.177, 1.0) + 2.0*smoothstep(-0.30, 0.25, bq/max(length(oc), 1e-3));
  float bm = vn3(d*3.3 + vec3(7.0, -uT*0.16, 2.5));
  float r1 = rn - 0.24*(b - 0.5) - 0.10*(bm - 0.5), r2 = rn + 0.22*(bm - 0.5) + 0.12*(b - 0.5) + 0.05*(b9 - 0.5);
  float shade = 1.0 - smoothstep(0.95, 1.80, r1), deep = 1.0 - smoothstep(0.70, 1.36, r2);
  float bandK = 4.0*deep*(1.0 - deep), bandS = 4.0*shade*(1.0 - shade);
  vec3 hc = uSaHub.xyz - cameraPosition; hc /= max(length(hc), 1.0);
  vec3 e = d - hc*dot(d, hc);
  float under = clamp(0.5 - 0.9*e.y/max(length(e), 1e-4), 0.0, 1.0);
  vec3 cs = mix(c, c*vec3(0.58, 0.70, 0.93), shade*(1.0 - 0.5*under));
  cs *= mix(1.0, 0.74 + 0.52*b, 0.8*max(bandS, bandK));
  cs += uSaKeyCol*0.06*bandK*under*(0.4 + b);
  float wsp = smoothstep(0.45, 0.85, vn3(d*vec3(6.0, 11.0, 6.0) + vec3(uT*0.05, -uT*0.12, 3.0)))*bandK;
  vec3 outC = mix(cs, uHollow*(0.28 + 0.20*b2*b2) + uSaMid*0.04, deep*(1.0 - 0.45*wsp));
  return mix(inC, outC, uLane);
}
vec3 skyBelow(vec3 d){
  vec2 dh = normalize(d.xz + vec2(1e-5, 0.0)), sh = normalize(uSunDir.xz);
  float front = dot(dh, sh), sd = max(front, 0.0);
  vec3 band = uBand*(0.5 + 0.95*sd*sd);
  float t = (max(uSaAtm.z - cameraPosition.y, 0.0) + 60.0)/max(d.y, 1e-3);   // the ceiling lifts away as we drop out
  vec2 p = cameraPosition.xz + d.xz*t, ps = p + sh*45.0;
  float n = vn2(p*0.006)*0.6 + vn2(p*0.017 + 3.0)*0.4, n2 = vn2(ps*0.006)*0.6 + vn2(ps*0.017 + 3.0)*0.4;
  vec3 c = uSaCeil*(0.55 + 0.9*n) + uSunCol*0.6*clamp((n - n2)*3.5, 0.0, 1.0);
  c = mix(c, band, max(1.0 - exp(-t*0.0011), 0.92*exp(-d.y*12.0)));
  float az = atan(d.x, d.z + 1e-5);
  float v = smoothstep(0.5, 0.8, vn2(vec2(az*3.0 + sin(uT*0.2 + d.y*6.0)*0.06, 1.7)))*smoothstep(0.015, 0.1, d.y)*(1.0 - smoothstep(0.12, 0.45, d.y))*uWx.x;
  v *= 0.7 + 0.3*vn2(vec2(az*40.0, d.y*3.0 - uT*0.1));
  c = mix(c, uSaCeil*0.9 + band*0.12, v*0.6);
  float sdot = max(dot(d, uSunDir), 0.0), s8 = sdot*sdot; s8 *= s8; s8 *= s8;
  c += uSunCol*(4.0*smoothstep(0.9993, 0.9997, sdot) + 0.5*pow(sdot, 60.0) + 0.16*s8);
  float ang = acos(clamp(sdot, -1.0, 1.0)), hq = (ang - 0.384)*24.0, halo = exp(-hq*hq), dy = d.y - uSunDir.y, side = dh.x*sh.y - dh.y*sh.x;
  c += uSunCol*uWx.z*(0.25*halo + 1.3*halo*exp(-dy*dy*700.0) + 0.6*exp(-side*side*500.0)*step(0.0, front)*smoothstep(0.0, 0.04, dy)*exp(-max(dy, 0.0)*7.0));
  return c;
}
vec3 seaCol(vec3 d){
  float t = max(cameraPosition.y - uSeaY, 1.0)/max(-d.y, 1e-3);
  vec2 p = cameraPosition.xz + d.xz*t, sh = normalize(uSunDir.xz);
  float foot = t*(1.35/max(uRes.y, 240.0))/max(-d.y, 0.05), aa = clamp(11.0/foot, 0.0, 1.0);   // metres of sea under one pixel, along the view
  // three wave trains (60, 38 and 23 m) crossing at an angle: where they add up the sea stands in short lens-shaped
  // crests, never long ribbons; each train fades out before its wavelength nears the size of a pixel (gone by two
  // pixels a wave, so the far sea is smooth tone and nothing is left to weave), and the sea runs higher where the gusts are
  vec2 w1 = vec2(0.82, 0.57), w2 = vec2(0.30, 0.954), w3 = vec2(0.97, -0.24);
  float wa = vn2(p*0.0040)*5.0 + vn2(p*0.017 + 3.0)*1.6, wb = vn2(p*0.0062 + 9.0)*5.0 + vn2(p*0.021 + 13.0)*1.6;
  // (no train is everywhere: each comes and goes in patches, so the crossing never settles into a weave)
  float e1 = 0.25 + 0.75*smoothstep(0.2, 0.8, vn2(p*0.0085 + 21.0)), e2 = 0.12 + 0.88*smoothstep(0.3, 0.85, vn2(p*0.011 + 37.0)), e3 = 0.12 + 0.88*smoothstep(0.3, 0.85, vn2(p*0.014 + 53.0));
  float ph1 = dot(p, w1)*0.105 + wa - uT*0.55, ph2 = dot(p, w2)*0.165 + wb - uT*0.70, ph3 = dot(p, w3)*0.27 + wa*0.7 + wb*0.6 - uT*0.9;
  float gust = 0.5 + 0.5*smoothstep(0.25, 0.75, vn2(p*0.0025 + 5.0));
  float a1 = 0.58*clamp(10.0/foot, 0.0, 1.0)*smoothstep(2.0, 4.5, 59.8/foot)*e1, a2 = 0.36*clamp(6.3/foot, 0.0, 1.0)*smoothstep(2.0, 4.5, 38.1/foot)*e2*gust, a3 = 0.26*clamp(3.9/foot, 0.0, 1.0)*smoothstep(2.0, 4.5, 23.3/foot)*e3*gust;
  float hgt = a1*sin(ph1) + a2*sin(ph2) + a3*sin(ph3);
  vec2 g = (a1*cos(ph1)*w1*0.105 + a2*cos(ph2)*w2*0.165 + a3*cos(ph3)*w3*0.27)*2.5;
  vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
  // wind chop: a fine grain in the normal (the glitter) and in the brightness
  vec2 pr = vec2(p.x*0.8 - p.y*0.6, p.x*0.6 + p.y*0.8);
  vec2 ch = vec2(vn2(pr*0.083 + uT*0.3)*0.6 + vn2(p*0.21 + 7.0)*0.4, vn2(pr.yx*0.107 + 5.0 - uT*0.27)*0.6 + vn2(pr*0.19 + 2.0)*0.4) - 0.5;
  float fch = clamp(5.0/foot, 0.0, 1.0);
  vec3 ng = normalize(n + vec3(ch.x, 0.0, ch.y)*0.55*clamp(22.0/foot, 0.0, 1.0));
  vec3 r = reflect(d, n);
  float fres = 0.03 + 0.97*pow(clamp(1.0 - dot(-d, n), 0.0, 1.0), 5.0);
  float rs = max(dot(normalize(r.xz + vec2(1e-5, 0.0)), sh), 0.0);
  vec3 skyr = mix(uBand*(0.4 + 0.8*rs*rs), uSaCeil*0.7, smoothstep(0.05, 0.5, r.y));
  vec3 c = (uSaSea*uSeaMix.x + uSaCeil*uSeaMix.y + uBand*uSeaMix.z)*(0.86 + 0.30*hgt)*(0.6 + 0.8*vn2(p*0.0016 + 2.0));
  c *= 1.0 + 0.30*ch.x*fch;
  c = mix(c, skyr, fres*0.9);
  // the slopes turned to the low sun take a little of its colour, and each crest where the trains meet carries a short glint
  c += uBand*(0.06*clamp(-dot(g, sh)*3.0, 0.0, 1.0) + 0.12*smoothstep(0.42, 0.9, hgt))*aa;
  float sp = pow(max(dot(reflect(d, ng), uSunDir), 0.0), 110.0), sp2 = max(dot(r, uSunDir), 0.0); sp2 *= sp2; sp2 *= sp2; sp2 *= sp2*sp2;
  c += uSunCol*(sp*(0.4 + 1.2*vn2(p*0.3 + uT*1.3))*4.0 + uSheen*sp2);
  // whitecaps where a crest breaks, and a scatter of small foam flecks lying along the wind
  float wc = smoothstep(0.62, 0.92, hgt + 0.35*(vn2(p*0.05 + vec2(uT*0.05, 0.0)) - 0.5))*smoothstep(0.3, 0.6, vn2(p*0.013 + 4.0));
  c = mix(c, uBand*0.2 + uSaCeil*0.5 + 0.1, wc*aa*uWx.y*0.6);
  // the skerry's surf: one thin unbroken white ring, breathing in and out, and the lighthouse beam as a faint wide wedge
  vec2 lp = p - uLamp.xz; float lr = length(lp), la = atan(lp.x, lp.y + 1e-4);
  float sr = abs(lr - 19.0 - 2.5*sin(uT*0.7 + la*3.0) - 1.5*sin(la*7.0 + 1.0));
  float surf = (1.0 - smoothstep(1.0, 5.0, sr))*smoothstep(0.25, 0.45, 0.35 + vn2(lp*0.16 + vec2(uT*0.1, 0.0))*0.6 + vn2(lp*0.45 - uT*0.2)*0.4);
  c = mix(c, vec3(0.34, 0.38, 0.42) + uBand*0.15, surf*0.8);
  float ba = la - uLamp.w; ba = atan(sin(ba), cos(ba));
  c += vec3(0.75, 0.82, 0.9)*exp(-ba*ba*14.0)*smoothstep(14.0, 50.0, lr)*(1.0 - smoothstep(110.0, 270.0, lr))*(0.04 + 0.13*uWx.w);
  float sd = max(dot(normalize(d.xz + vec2(1e-5, 0.0)), sh), 0.0);
  return mix(c, uBand*(0.35 + 0.75*sd*sd), 1.0 - exp(-t*t*5.0e-9));
}
vec3 belowBg(vec3 d){
  vec3 c = mix(seaCol(vec3(d.x, min(d.y, -1e-3), d.z)), skyBelow(vec3(d.x, max(d.y, 1e-3), d.z)), step(0.0, d.y));
  vec3 ld = uLamp.xyz - cameraPosition; float ll = length(ld); ld /= max(ll, 1.0);
  float toUs = atan(-ld.x, -ld.z) - uLamp.w; toUs = 0.5 + 0.5*cos(toUs); toUs *= toUs; toUs *= toUs; toUs *= toUs; toUs *= toUs;
  c += vec3(1.0, 0.93, 0.8)*exp(-(1.0 - max(dot(d, ld), 0.0))*5.0e4)*(1.2 + 5.0*toUs)*(0.5 + uWx.w);
  return c;
}
void main(){
  vec3 d = normalize(vW - cameraPosition);
  float cy = cameraPosition.y - uSaAtm.z;
  vec3 below = belowBg(d), cloud = cloudBg(d);
  // (while the tear is still small the sea through it is clean blue depth, not a speckled patch; as it widens the
  // rippled sea itself comes through)
  below = mix(below, uHollow*0.85 + uSaSea*1.5, 0.42*smoothstep(0.0, 8.0, cy)*(1.0 - smoothstep(30.0, 70.0, uSaAtm.w)));
  float hole = step(cy, 0.0);
  if (cy > 0.0 && d.y < -0.002) hole = tearAt(cameraPosition.xz + d.xz*(cy/(-d.y)));
  gl_FragColor = vec4(mix(cloud, below, hole), 1.0);
}
`;
const FLOOR_FRAG = /* glsl */`
varying vec3 vW;
${HEAD}
void main(){   // the mask lies under the rags of the base; its hole is the dome's tear, projected along the view ray
  float cy = cameraPosition.y - uSaAtm.z;
  vec3 d = normalize(vW - cameraPosition);
  if (cy <= 0.0 || d.y > -0.002) discard;
  if (tearAt(cameraPosition.xz + d.xz*(cy/(-d.y))) > 0.5) discard;
  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

// quads: position = a seed, aC = corner x, corner y, seed, aK = kind or size
const DROP_VERT = /* glsl */`
attribute vec3 aC; attribute float aK;
uniform vec3 uTips[12];
varying vec2 vUv; varying vec3 vCen; varying float vPx, vA;
${HEAD}
void main(){
  float box = aK < 0.5 ? 120.0 : (aK < 1.5 ? 26.0 : 9.0), nearK = min(aK, 1.0);   // far field, near field, at the lens
  vec3 p = position*box;
  p.y += uT*2.5; p.x += sin(uT*0.7 + position.z*40.0)*0.5; p.z += cos(uT*0.6 + position.x*37.0)*0.5;
  p = cameraPosition + mod(p - cameraPosition + box*0.5, box) - box*0.5;
  float dc = distance(p, cameraPosition);
  float s = smoothstep(0.8, 1.7, dc)*(1.0 - smoothstep(box*0.40, box*0.49, dc));
  for (int i = 0; i < 12; i++) s *= smoothstep(1.0, 4.0, distance(p, uTips[i]));
  vec2 hq = p.xz - uSaHub.xz; float hy = p.y - uSaHub.y, hr = length(hq);
  s *= 1.0 - (1.0 - smoothstep(uTipR*0.8, uTipR*1.05 + 1.5, hr))*(1.0 - smoothstep(mix(3.2, 1.0, nearK), mix(5.5, 2.2, nearK), abs(hy)));
  s *= 1.0 - (1.0 - smoothstep(28.0, 38.0, hr))*step(0.0, hy)*(1.0 - smoothstep(4.0, 10.0, p.y))*(1.0 - nearK);
  s *= smoothstep(uSaAtm.z - 1.0, uSaAtm.z + 7.0, p.y + sin(p.x*0.13)*3.0);
  // the opening: a clear lane from the eye to the plate, widening with distance, so no globe sits in front of it
  // (and again on the rise off the tip, to the broken plate: uLaneP = where, how much)
  vec3 la = uLaneP.xyz - cameraPosition; float ll = max(length(la), 1.0); la /= ll;
  float al = clamp(dot(p - cameraPosition, la), 0.0, ll + 14.0);
  s *= mix(1.0, smoothstep(0.15*al + 0.3, 0.26*al + 0.75, length(p - cameraPosition - la*al)), uLaneP.w);
  float rad = mix(0.15, 0.30, aC.z)*s;
  vec4 mv = viewMatrix*vec4(p, 1.0);
  float px = rad*projectionMatrix[1][1]/max(-mv.z, 0.1)*uRes.y*0.5;
  float grow = clamp(1.3/max(px, 1e-3), 1.0, 5.0);
  mv.xy += aC.xy*rad*grow;
  vUv = aC.xy; vCen = p; vPx = px*grow; vA = step(0.02, s)/(grow*grow);
  gl_Position = projectionMatrix*mv;
}
`;
const DROP_FRAG = /* glsl */`
varying vec2 vUv; varying vec3 vCen; varying float vPx, vA;
${HEAD}
void main(){
  float r2 = dot(vUv, vUv); if (r2 > 1.0) discard;
  float z = sqrt(max(1.0 - r2, 0.0));
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]), back = vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]);
  vec3 N = normalize(right*vUv.x + up*vUv.y + back*z);
  vec3 V = normalize(cameraPosition - vCen);
  vec3 D = refract(-V, N, 0.75); if (dot(D, D) < 0.01) D = -V;
  vec3 N2 = normalize(N + D*(-2.0*dot(D, N)) + vec3(0.0, 1e-5, 0.0));
  vec3 Do = refract(D, -N2, 1.333); if (dot(Do, Do) < 0.01) Do = reflect(D, -N2);
  vec3 env = saCloudCol(Do);
  float tt = (uSaHub.y - vCen.y)/(abs(Do.y) > 1e-3 ? Do.y : 1e-3);
  vec2 q = vCen.xz + Do.xz*tt - uSaHub.xz; float rr = length(q);
  float a6 = abs(fract(atan(q.x, q.y + 1e-5)/1.0471976 + 0.5) - 0.5)*1.0471976;
  float seen = step(0.0, tt);
  env = mix(env, uHollow, (1.0 - smoothstep(uSaHub.w*0.6, uSaHub.w*1.2, rr))*seen*0.6);
  float arm = (1.0 - smoothstep(0.9, 2.4, rr*sin(a6)))*(1.0 - smoothstep(uTipR*0.9, uTipR + 0.2, rr))*seen;
  env = mix(env, uSaCobalt*0.6 + uSaPale*0.3, arm*0.8);
  float rim = 1.0 - z;
  vec3 col = mix(env*0.94, uSaCobalt*0.36, smoothstep(0.08, 0.62, rim)*0.92);   // (a broad dark rim: a globe reads against the brightest cloud)
  vec3 R = reflect(-V, N);
  col += saCloudCol(R)*(0.04 + 0.45*rim*rim*rim*rim);
  col += uSaKeyCol*2.4*smoothstep(0.984, 0.997, dot(R, uSaKeyDir));
  float a = clamp((1.0 - sqrt(r2))*vPx/1.5, 0.0, 1.0)*vA;
  vec4 f = saFogCA(vCen);
  col = mix(col, f.rgb, f.a);
  a *= 1.0 - 0.9*f.a*f.a;
  gl_FragColor = vec4(col*a, a);
}
`;
const WISP_VERT = /* glsl */`
attribute vec3 aC; attribute float aK;
varying vec2 vUv; varying vec3 vP; varying float vA, vS, vWy;
${HEAD}
void main(){
  vec3 p; float size, a;
  if (aK < 0.5) {
    vec3 box = vec3(150.0, 90.0, 150.0); p = position*box; p.y += uT*4.5*(0.6 + aC.z);
    p = cameraPosition + mod(p - cameraPosition + box*0.5, box) - box*0.5; size = mix(9.0, 22.0, aC.z);
    float dc = distance(p, cameraPosition);
    a = 0.55*smoothstep(3.0, 14.0, dc)*(1.0 - smoothstep(55.0, 72.0, dc))*smoothstep(uSaAtm.z - 13.0, uSaAtm.z - 3.0, p.y);
    a *= 1.0 - 0.7*(1.0 - smoothstep(uSaHub.w*0.6, uSaHub.w*1.1, length(p.xz - uSaHub.xz)))*(1.0 - smoothstep(6.0, 16.0, abs(p.y - uSaHub.y)));
    vec3 sq = vec3(1.0, mix(2.0, 1.1, uLane), 1.0), ld = (p - cameraPosition)*sq, hc = (uSaHub.xyz - cameraPosition)*sq; float ll = max(length(ld), 1e-3); ld /= ll;
    float th = dot(hc, ld);
    a *= 1.0 - 0.95*(1.0 - smoothstep(uSaHub.w*0.72 + size*0.6, uSaHub.w*1.05 + size*0.9, length(hc - ld*th)))*step(0.0, th);   // (clear of the star itself; wisps may cross the feathered rim of the well)
    vec3 l2 = (p - cameraPosition)/max(dc, 1e-3);
    for (int i = 0; i < 3; i++) {   // (and of each staged companion's own small clearing)
      vec3 h2 = uHo[i].xyz - cameraPosition; float t2 = dot(h2, l2);
      a *= 1.0 - 0.94*(1.0 - smoothstep(uHo[i].w*0.7 + size*0.5, uHo[i].w*1.2 + size, length(h2 - l2*t2)))*step(0.0, t2)*step(0.5, uHo[i].w)*(1.0 - smoothstep(18.0, 45.0, length(h2)));
    }
  } else {
    vec2 bx = vec2(260.0); p.xz = position.xz*bx; p.xz = cameraPosition.xz + mod(p.xz - cameraPosition.xz + bx*0.5, bx) - bx*0.5;
    p.y = uSaAtm.z + (position.y - 0.5)*14.0 + sin(uT*0.2 + position.x*30.0)*1.5; size = mix(14.0, 34.0, aC.z);
    float dc = distance(p, cameraPosition);
    a = 0.5*smoothstep(2.0, 12.0, dc)*(1.0 - smoothstep(100.0, 128.0, dc));
    a *= smoothstep(34.0, 50.0, length(p.xz - uSaHub.xz));
    // in the opening no rag of the far base may stand behind the plate: the hollow stays a dark shape
    vec3 sq = vec3(1.0, mix(2.0, 1.1, uLane), 1.0), ld = (p - cameraPosition)*sq, hc = (uSaHub.xyz - cameraPosition)*sq; ld /= max(length(ld), 1e-3);
    float th = dot(hc, ld);
    a *= 1.0 - (1.0 - smoothstep(uSaHub.w*0.6 + size*0.5, uSaHub.w*1.15 + size, length(hc - ld*th)))*step(0.0, th)*(1.0 - smoothstep(5.0, 9.0, uSec));
  }
  vec4 mv = viewMatrix*vec4(p, 1.0);
  vec2 off = aC.xy*size*vec2(1.0, aK > 0.5 ? 0.45 : 0.8);
  mv.xy += off;
  vWy = p.y + viewMatrix[1][0]*off.x + viewMatrix[1][1]*off.y;
  vUv = aC.xy; vP = p; vA = a; vS = aC.z + aK;
  gl_Position = projectionMatrix*mv;
}
`;
const WISP_FRAG = /* glsl */`
varying vec2 vUv; varying vec3 vP; varying float vA, vS, vWy;
${HEAD}
void main(){
  float r = length(vUv);
  float n = vn2(vUv*2.2 + vS*17.0 + vec2(0.0, -uT*0.05))*0.6 + vn2(vUv*5.0 + vS*5.0)*0.4;
  float a = smoothstep(0.0, 0.55, (1.0 - r) - n*0.55)*(1.0 - smoothstep(0.6, 1.0, max(abs(vUv.x), abs(vUv.y))))*vA;
  // seen from above, every wisp dissolves before it meets the depth floor under the base: no line in the cloud
  a *= mix(smoothstep(uSaAtm.z - 12.5, uSaAtm.z - 5.0, vWy), 1.0, 1.0 - smoothstep(uSaAtm.z - 1.0, uSaAtm.z + 2.0, cameraPosition.y));
  if (a < 0.003) discard;
  vec3 d = normalize(vP - cameraPosition);
  float seed = fract(vS*7.31);
  float kd = max(dot(d, uSaKeyDir), 0.0);
  vec3 c = saCloudCol(d)*(0.74 + 0.52*seed)*(1.0 + 0.5*kd*kd);
  float below = 1.0 - smoothstep(uSaAtm.z - 4.0, uSaAtm.z + 4.0, cameraPosition.y);
  vec2 sh = normalize(uSunDir.xz);
  vec3 cb = uSaCeil*(0.8 + 0.5*n) + uSunCol*0.45*smoothstep(0.2, 0.9, r)*max(dot(vUv, vec2(0.0, -1.0)), 0.0) + uSunCol*0.12*max(dot(normalize(d.xz + vec2(1e-5, 0.0)), sh), 0.0);
  c = mix(c, cb, below);
  gl_FragColor = vec4(c*a, a);
}
`;
// hard glints: quad 0 rides a corner of the opening hexagon, quads 1-12 the twelve growing tips, 13-18 one facet of
// each of six companion crystals. aK = which
const GLINT_VERT = /* glsl */`
attribute vec3 aC; attribute float aK;
uniform vec3 uTips[12];
uniform vec4 uCo[6];
varying vec2 vUv; varying float vI; varying vec3 vP;
${HEAD}
void main(){
  vec3 p = uGlP; float size = 2.6, I = uGl.x, far = 0.03;
  if (aK > 12.5) {
    vec4 co = uCo[int(aK - 12.5)];
    p = co.xyz; size = 1.0; I = co.w; far = 0.05;
  } else if (aK > 0.5) {
    p = uTips[int(aK - 0.5)];
    float spine = step(aK, 6.5), tw = 0.7 + 0.3*sin(uT*2.3 + aK*1.7);
    size = mix(0.75, 1.25, spine); I = (uGl.y*tw + uGl.z)*mix(0.55, 1.0, spine)*uGl.w; far = 0.035;
  }
  vec4 mv = viewMatrix*vec4(p, 1.0);
  mv.xyz *= 1.0 - 0.6/max(length(mv.xyz), 1.2);   // a hand's width toward the eye, clear of the facet it sits on
  size *= max(1.0, -mv.z*far);                 // never under a few pixels far off
  mv.xy += aC.xy*size;
  vUv = aC.xy; vI = I; vP = p;
  gl_Position = projectionMatrix*mv;
}
`;
const GLINT_FRAG = /* glsl */`
varying vec2 vUv; varying float vI; varying vec3 vP;
${HEAD}
void main(){
  float r = length(vUv); vec2 q = abs(vUv);
  float v = 3.0*exp(-r*r*70.0) + 0.9*(exp(-q.x*42.0 - q.y*5.5) + exp(-q.y*42.0 - q.x*5.5)) + 0.02*exp(-r*r*7.0);
  v *= (1.0 - smoothstep(0.65, 1.0, r))*vI;
  if (v < 0.004) discard;
  vec4 f = saFogCA(vP);
  gl_FragColor = vec4(mix(uSaKeyCol, uSunCol*1.2, uSaBelow)*v*(1.0 - 0.7*f.a), 0.0);
}
`;

// vapour wisps: faint commas of vapour drawn in to the growing tips (the crystal eating the cloud). Each wisp is a
// bent ribbon of three quads that share a seed (aK = tip + 16*piece): it starts a few metres out on its own direction
// and slides in along a bowed line, under a metre long, soft across and tapered at both ends, the colour of the fog and
// hardly brighter; it fades in, fades out before it lands, and is gone beyond 24 m (from afar a wisp would be a scratch)
const THREAD_VERT = /* glsl */`
attribute vec3 aC; attribute float aK;
uniform vec3 uTips[12];
varying vec2 vUv; varying vec3 vP; varying float vA;
${HEAD}
vec3 thAt(vec3 tip, vec3 dir, vec3 side, float len, float f){ float q = 1.0 - f; return tip + dir*(0.35 + len*q) + side*(len*0.30*sin(f*3.1416)) + vec3(0.0, 0.5*q*q, 0.0); }
void main(){
  float seed = aC.z, piece = floor(aK/16.0 + 0.01), w = (piece + (aC.x > 0.0 ? 1.0 : 0.0))/3.0;   // 0 at the wisp's tail, 1 at its head
  vec3 tip = uTips[int(clamp(aK - piece*16.0, 0.0, 11.0))];
  vec3 dir = normalize(position*2.0 - 1.0 + vec3(0.0, 0.25, 1e-3));
  vec3 side = cross(dir, vec3(0.0, 1.0, 0.0)) + vec3(1e-3, 0.0, 0.0); side /= max(length(side), 1e-4);
  float len = mix(2.6, 4.6, seed), cyc = uT*mix(0.22, 0.34, fract(seed*13.0)) + seed*7.0, f = fract(cyc);
  float fa = clamp(f - (1.0 - w)*mix(0.14, 0.22, fract(seed*29.0)), 0.0, 1.0);
  vec3 p = thAt(tip, dir, side, len, fa), p2 = thAt(tip, dir, side, len, fa + 0.03);
  vec4 mv = viewMatrix*vec4(p, 1.0), mv2 = viewMatrix*vec4(p2, 1.0);
  vec3 pe = cross(mv2.xyz - mv.xyz, mv.xyz); pe /= max(length(pe), 1e-5);
  float px = max(-mv.z, 0.1)/(projectionMatrix[1][1]*max(uRes.y, 1.0)*0.5);   // metres under a pixel here
  mv.xyz += pe*aC.y*max(0.08, 1.6*px);   // never under three pixels across: it thins by fading, not by narrowing
  vUv = vec2(w, aC.y); vP = p;
  vA = 0.26*smoothstep(0.0, 0.25, f)*(1.0 - smoothstep(0.78, 1.0, f))*uThread*(1.0 - uSaBelow)*smoothstep(4.0, 9.0, -mv.z)*(1.0 - smoothstep(15.0, 24.0, -mv.z))*min(1.0, 0.05/px)
    *step(0.4, fract(seed*37.0 + floor(cyc)*0.37));   // (never at the lens; on each pass some rest while others stream)
  gl_Position = projectionMatrix*mv;
}
`;
const THREAD_FRAG = /* glsl */`
varying vec2 vUv; varying vec3 vP; varying float vA;
${HEAD}
void main(){
  float e = 1.0 - abs(vUv.y);
  float a = vA*e*e*smoothstep(0.0, 0.6, vUv.x)*(1.0 - smoothstep(0.8, 1.0, vUv.x));
  if (a < 0.003) discard;
  vec4 f = saFogCA(vP);
  a *= 1.0 - 0.8*f.a;
  vec3 d = normalize(vP - cameraPosition);
  vec3 fc = saCloudCol(d);   // (a little of the key on top, in proportion to the fog's own brightness: never white needles at night)
  gl_FragColor = vec4(mix(fc*1.1 + uSaKeyCol*0.30*clamp(dot(fc, vec3(0.5)), 0.2, 1.0), f.rgb, f.a)*a, a);
}
`;

// the crowd below the base: flat six-fold plates (big, lying flat and turning) and far glitter (small, facing the eye)
const FLAKE_VERT = /* glsl */`
attribute vec3 aC; attribute float aK;
varying vec2 vUv; varying vec3 vP; varying float vS, vBig;
${HEAD}
void main(){
  vec3 p = position; float big = step(9.0, aK), seed = aC.z;
  p.y += sin(uT*0.3 + seed*40.0)*1.5;
  vec4 mv;
  if (big > 0.5) {
    float an = uT*0.12*(seed - 0.5)*4.0 + seed*6.283, c = cos(an), s = sin(an);
    vec2 q = vec2(aC.x*c - aC.y*s, aC.x*s + aC.y*c)*aK;
    p += vec3(q.x, sin(uT*0.5 + seed*31.0)*0.04*q.x, q.y);
    mv = viewMatrix*vec4(p, 1.0);
  } else {
    mv = viewMatrix*vec4(p, 1.0);
    float px = aK*projectionMatrix[1][1]/max(-mv.z, 0.1)*uRes.y*0.5;
    mv.xy += aC.xy*aK*max(1.0, 1.6/max(px, 1e-3));
  }
  vUv = aC.xy; vP = p; vS = seed; vBig = big;
  gl_Position = projectionMatrix*mv;
}
`;
const FLAKE_FRAG = /* glsl */`
varying vec2 vUv; varying vec3 vP; varying float vS, vBig;
${HEAD}
void main(){
  float r = length(vUv), an = atan(vUv.x, vUv.y + 1e-5);
  float a6 = abs(fract(an/1.0471976 + 0.5) - 0.5)*1.0471976;
  float along = r*cos(a6), across = r*sin(a6);
  float fw = fwidth(r)*1.5 + 1e-4;
  float kind = fract(vS*13.7);
  float spine = 1.0 - smoothstep(0.012 + 0.016*kind, 0.012 + 0.016*kind + fw, across);
  float k = mix(5.0, 9.0, fract(vS*5.3)), cell = fract(along*k) - 0.5;
  float br = 1.0 - smoothstep(0.013, 0.013 + fw, abs(across - (0.5 - abs(cell))*0.9/k*mix(1.0, 2.6, kind)));
  br *= step(0.12, along)*(1.0 - smoothstep(0.1, max(0.34*(1.15 - along), 0.11), across));
  float sector = 1.0 - smoothstep(0.16*kind + 0.02, 0.16*kind + 0.02 + fw, across - along*0.18*kind);
  float plate = 1.0 - smoothstep(0.3 + 0.3*kind, 0.3 + 0.3*kind + fw, along);
  float web = (1.0 - smoothstep(0.03, 0.16, across - (0.93 - along)*0.5))*step(0.25, kind);   // the thin glass between the ribs
  float edge = (1.0 - smoothstep(0.012, 0.012 + fw, abs(along - 0.3 - 0.3*kind)))*step(across, 0.5);
  spine = max(spine, edge*0.8);
  float m = max(max(max(spine, br), web), max(plate, sector*step(0.55, kind)))*(1.0 - smoothstep(0.93, 0.93 + fw, along*mix(1.0, 1.12, a6)));
  // (far glitter: a small six-rayed star, never a round disc)
  float sm = max(1.0 - smoothstep(0.16, 0.34, r), 0.85*(1.0 - smoothstep(0.05, 0.13 + fw*1.2, across))*(1.0 - smoothstep(0.55, 1.0, r)));
  m = mix(sm, m, vBig);
  if (m < 0.01) discard;
  // thin glass: a dark, see-through body with pale ribs, flaring as the plate turns through the sun's mirror angle
  vec3 V = normalize(cameraPosition - vP);
  vec3 N = normalize(vec3(sin(uT*0.7 + vS*40.0)*0.45, 1.0, cos(uT*0.6 + vS*31.0)*0.45));
  if (dot(N, V) < 0.0) N = -N;
  float gl = max(dot(reflect(-V, N), uSunDir), 0.0); gl *= gl; gl *= gl; gl *= gl;
  float rib = max(spine, br)*vBig;
  vec3 col = mix(uSaCobalt*0.3 + uSaMid*0.08 + uBand*0.05, uSaPale*0.5 + uSunCol*0.14, rib*0.85);
  // (a big plate flashes along its ribs only, a thin six-rayed line drawing in the sun's colour, never a filled blob)
  // (and a plate too far off for its ribs to be a pixel wide hardly flashes at all: it would be a white speckle)
  col += uSunCol*min(2.4*gl*gl + 0.5*gl, mix(2.9, 1.2, vBig))*(mix(0.35, 0.03, vBig) + mix(0.65, 0.97, vBig)*rib + 0.4*(1.0 - vBig))*mix(1.0, clamp(0.016/fw, 0.12, 1.0), vBig);
  // (the far glitter is cool and pale until a flake turns through the sun: then one short flash of its colour)
  col += (1.0 - vBig)*(uSaPale*0.34 + uSaMid*0.10 + uSunCol*1.5*smoothstep(0.75, 1.0, sin(uT*1.7 + vS*90.0)));
  vec4 f = saFogCA(vP);
  col = mix(col, f.rgb, f.a);
  float a = m*mix(0.85, clamp(0.42 + 0.4*rib, 0.0, 0.95), vBig)*(1.0 - 0.6*f.a);
  a *= 1.0 - 0.92*smoothstep(uSaAtm.z + 1.0, uSaAtm.z + 9.0, cameraPosition.y)*(1.0 - smoothstep(30.0, 70.0, uSaAtm.w));   // from inside the cloud a small tear shows clean sea, not specks
  gl_FragColor = vec4(col*a, a);
}
`;

const Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const BASE = -10;   // height of the cloud base; the crystal grows at the origin

export default {
  id: 'six-arms',
  name: 'Six Arms',
  category: 'sky',
  weirdness: 0.35,
  media: ['air', 'tiny'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    // ---- 1 seeded mood
    const hourPick = rng.pick(['golden', 'golden', 'dawn', 'day', 'night', 'golden', 'dawn']);
    const habit = rng.pick(['fern', 'fern', 'sector', 'plate']);
    const rimeHeavy = rng.chance(0.5), ragged = rng.chance(0.55), plates = rng.chance(0.5);
    const H = HOURS[HOURS[vary.hour] ? vary.hour : hourPick], rare = !!vary.rare, density = clamp(vary.density ?? 1, 0.7, 1.3);
    const col = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
    const scene = new THREE.Scene();
    scene.background = col(H.mid, 0.8);
    scene.fog = new THREE.FogExp2(col(H.mid), 0.018);   // only for a ride or companion the viewer adds; the world fogs itself
    const cMid = col(H.mid), cAir = col(H.air);

    // ---- 2 hero
    const hero = await buildHero(ctx, { palette: [H.mid, H.hollow, H.lo, H.key, NUCLEUS, H.sun, H.sea], habit, rime: rimeHeavy ? 'heavy' : 'clean' });
    scene.add(hero.object);
    await ctx.yield();
    const el = H.elev * Math.PI / 180;
    const sunDir = new THREE.Vector3(-0.087 * Math.cos(el), Math.sin(el), 0.996 * Math.cos(el)).normalize();   // 95 degrees right of the exit heading (+X)
    const keyDir = new THREE.Vector3(0.35, 0.77, -0.55).normalize();                                           // the hidden sun in the cloud: up and to the left of the entry
    hero.setEnv({ fogHi: col(H.hi, H.fog[1]), fogLo: col(H.lo, 0.8), keyDir, keyCol: col(H.key), goldDir: sunDir, goldCol: col(H.sun), sea: col(H.sea), ceil: col(H.ceil) });
    hero.uniforms.uSaAir.value.set(H.air); hero.uniforms.uSaFogMid.value.set(H.mid).multiplyScalar(H.fog[0]);
    hero.uniforms.uSaHollow.value.set(H.hollow).multiplyScalar(0.42);

    // ---- 3 path: the exit runs straight through the hero's pruned notch once the star has sunk, spun 60 degrees and tilted 30
    const YC = -105;
    const DIP = 0.08, NBW = 0.3;   // how far the gaze dips to the ring as the base tears; how far it leans to the neighbour
    // the star's turn (radians at brief second): quick at first, so that as the base tears the ring far below shows through
    // the pruned notch (as it will at the exit), then held at 60 degrees for the exit line
    const SPIN = [[34, 0], [35, 0.05], [38.4, 0.78], [39.7, 1.05], [40.6, 1.14], [43, 1.06], [46, Math.PI / 3]];
    const NB = [[27, -52, 60, -14], [36, -50, 12.5, -12], [40, -46, -10.5, -10], [42.47, -31, -24.5, -3], [44.66, -26, -41, 0], [46.42, -34, -52, 5], [48.17, -45, -62, 8], [50.5, -58, -76, 11], [58.1, -85, -118, 18]];   // the neighbour: second, x, y, z
    const qEnd = new THREE.Quaternion().setFromAxisAngle(Z, Math.PI / 6).multiply(new THREE.Quaternion().setFromAxisAngle(Y, Math.PI / 3));
    const NOTCH = hero.anchors.notch.position.clone().applyQuaternion(qEnd).add(new THREE.Vector3(0, YC, 0));
    const EX = hero.anchors.notch.normal.clone().applyQuaternion(qEnd).negate();
    const onLine = (m) => NOTCH.clone().addScaledVector(EX, 36 - m).toArray();   // m metres before the portal
    const PTS = [   // x, y, z, brief second
      // 0 FOG: level, the hexagon ahead   3 REVEAL: up and over the star as the arms punch out, then a widening left-hand orbit
      [-63.5, 5, 3, 0], [-34, 5, 5.5, 4.0], [-17.5, 9, 10.5, 6.3], [-8, 13.5, 16, 7.6], [3, 17.5, 22, 9.4], [16, 17, 17, 11.2], [23, 14.5, 5.5, 13.1], [23.5, 11, -7, 15.0],
      [16, 8, -15.5, 16.8], [8.5, 6.8, -19.5, 18.4], [3, 6.2, -19.5, 19.4], [-0.5, 5, -15.5, 20.4], [0, 4.2, -8.5, 21.45], [0, 2.9, -3, 22.35],
      // 14 THE SKIM along arm 0   19 RISE
      [0, 2.75, 0, 22.9], [0, 2.7, 6, 24.4], [0, 2.55, 14, 26.4], [0, 2.4, 22, 28.3], [0, 2.35, 29, 30.15],
      [0.5, 2.8, 33.5, 31.25], [4, 3.7, 37.2, 32.5], [10, 5.6, 38.6, 33.8], [16.5, 10.5, 35.5, 35.1], [20.5, 19.5, 24.5, 36.6], [20, 24.5, 11.5, 38.0],
      // 25 THE FALL: out of the base at about 42 s, the sun ahead from 43 to 46 s   32 EXIT
      [26.1, 5, -4.6, 40.2], [16.7, -12, -19.9, 42.35], [-0.9, -23, -24.5, 44.4], [-15.1, -31.5, -16.7, 46.2], [-18.5, -36.5, -6.5, 47.37], [-14.5, -40, -1.2, 48.1], [-9, -44, 0, 48.75],
      [...onLine(76), 50.5], [...onLine(60), 52.1], [...onLine(36), 54.5], [...onLine(0), 58.1],
    ];
    await ctx.yield();
    const path = makePath(PTS.map((p) => [p[0], p[1], p[2]]));
    await ctx.yield();
    const us = []; { const M = 2400, v = new THREE.Vector3(); let j0 = 0;
      for (const p of PTS) { await ctx.yield(); let best = 1e9, bj = j0; for (let j = j0; j <= M; j++) { path.pointAt(j / M, v); const d = (v.x - p[0]) ** 2 + (v.y - p[1]) ** 2 + (v.z - p[2]) ** 2; if (d < best) { best = d; bj = j; } else if (d > best + 900) break; } us.push(bj / M + us.length * 1e-7); j0 = bj; } }
    us[us.length - 1] = 1;
    await ctx.yield();

    // ---- 4 timelines, all in brief seconds s = sec(u)
    await ctx.yield();
    const S_END = PTS[PTS.length - 1][3];
    const secT = mono(us.map((u, i) => [u, PTS[i][3]])), sec = (u) => secT(clamp(u, 0, 1));
    const pace = (u) => { const a = Math.max(0, u - 0.004), b = Math.min(1, u + 0.004); return clamp((b - a) * S_END / Math.max(sec(b) - sec(a), 1e-4), 0.35, 2.5); };
    const uOf = (s) => { let a = 0, b = 1; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (sec(m) < s) a = m; else b = m; } return (a + b) / 2; };
    const starY = mono([[34, 0], [37.7, -4], [40.2, -17], [42.35, -31], [44.4, -46], [46.2, -61], [48.75, -86], [50.5, -102], [51.8, YC]]);
    const spin = mono(SPIN);
    // the crystal's own clock (the part's growth second at each brief second). We arrive on a plain hexagonal plate; it
    // widens once in a burst (0.25-0.6 s), its six corners outrun its faces and the six arms punch out at once (1-2 s,
    // the spikes just clear of the corners at 1.2 s), then a burst every 1.2 s while we close in (2.3, 3.5, 4.7 s), each
    // firing a mirrored pair of branches; it grows slowly while we wind over it and orbit (a burst every 2 to 3 s, so
    // the whole star stays inside the frame),
    // and 1.3 times as fast on the skim, so every burst is its own event with a held beat before the next and the tip
    // stays ahead of us; from the rise on it is the brief second again
    const grow = mono([[0, 2.9], [0.25, 3.4], [0.6, 3.9], [1.0, 8.0], [1.17, 8.45], [2.0, 8.9], [2.3, 9.3], [3.5, 10.6], [4.7, 11.95], [7.4, 13.2], [9.85, 13.9], [13.0, 14.6], [15.7, 15.6], [19.0, 17.2], [22.9, 20.4], [30.15, 29.85], [31.5, 31.5], [S_END, S_END]]);
    // the brief second at which each event of the growth lands (the plate's two widenings, the punch, the bursts)
    const burstS = [1.4, 3.4, ...hero.burstTimes].map((g) => { let lo = 0, hi = S_END; for (let i = 0; i < 26; i++) { const m = (lo + hi) / 2; if (grow(m) < g) lo = m; else hi = m; } return hi; });
    // the near neighbour's fall: it comes in from the sunward side as we drop out of the base, lies 30 m off and a
    // little above the hero's plane at 45 s, then slides away to the right, clear of the exit line
    const nbX = mono(NB.map((q) => [q[0], q[1]])), nbY = mono(NB.map((q) => [q[0], q[2]])), nbZ = mono(NB.map((q) => [q[0], q[3]]));
    await ctx.yield();
    const tear = mono([[36.2, 0], [37.3, 28], [38.4, 56], [40.5, 82], [42, 150], [43, 500], [44, 4000]]);

    // ---- 5 uniforms shared by every shader of the world (the uSa* ones are the hero's own objects)
    const SEA_Y = onLine(0)[1] - 520, LAMP = new THREE.Vector3(560, SEA_Y + 40, -250);   // 24 degrees up and left of the ring on the exit line
    const tips = []; for (let i = 0; i < 12; i++) tips.push(new THREE.Vector3(0, 0, 3));
    const glintAt = []; for (let i = 0; i < 6; i++) glintAt.push(new THREE.Vector4(0, 0, 0, 0));
    const U = { ...hero.uniforms, uT: { value: 0 }, uSec: { value: 0 }, uSeaY: { value: SEA_Y }, uTipR: { value: 3 }, uRes: { value: new THREE.Vector2(800, 450) },
      uLane: { value: 1 }, uThread: { value: 0 }, uHo: { value: [new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0)] }, uLaneP: { value: new THREE.Vector4(0, 0, 0, 1) }, uSheen: { value: H.sheen }, uGlP: { value: new THREE.Vector3() }, uCo: { value: glintAt },
      uSunDir: { value: sunDir }, uSunCol: { value: col(H.sun) }, uBand: { value: col(H.band) }, uHollow: { value: col(H.hollow, 0.42) },
      uLamp: { value: new THREE.Vector4(LAMP.x, LAMP.y, LAMP.z, 0) }, uWx: { value: new THREE.Vector4(ragged ? 1 : 0.25, ragged ? 1 : 0.2, rare ? 1 : 0, H.lamp) }, uTips: { value: tips },
      uSeaMix: { value: new THREE.Vector3(...H.seaMix) }, uGl: { value: new THREE.Vector4(0, 0, 0, 0) } };
    const sprite = (vs, fs, order) => new THREE.ShaderMaterial({ uniforms: U, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide });
    // (yields every five hundred quads: each fill draws only from its own private fork, so the draw order is unchanged)
    const quads = async (n, fill) => {
      const pos = new Float32Array(n * 12), c = new Float32Array(n * 12), k = new Float32Array(n * 4), idx = new Uint32Array(n * 6), o = [0, 0, 0, 0, 0];
      for (let i = 0; i < n; i++) {
        if (i % 500 === 499) await ctx.yield();
        fill(i, o);
        for (let j = 0; j < 4; j++) { const v = i * 4 + j; pos[v * 3] = o[0]; pos[v * 3 + 1] = o[1]; pos[v * 3 + 2] = o[2]; c[v * 3] = j & 1 ? 1 : -1; c[v * 3 + 1] = j & 2 ? 1 : -1; c[v * 3 + 2] = o[3]; k[v] = o[4]; }
        const q = i * 4, t = i * 6; idx[t] = q; idx[t + 1] = q + 1; idx[t + 2] = q + 2; idx[t + 3] = q + 2; idx[t + 4] = q + 1; idx[t + 5] = q + 3;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aC', new THREE.BufferAttribute(c, 3)); g.setAttribute('aK', new THREE.BufferAttribute(k, 1));
      g.setIndex(new THREE.BufferAttribute(idx, 1)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);
      return g;
    };
    const addQuads = (g, mat, order) => { const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = order; scene.add(m); return m; };

    // ---- 6 dome (cloud above the base, dusk and sea below it) and the depth-only floor that hides the lower world
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 20), new THREE.ShaderMaterial({ uniforms: U, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false }));
    dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(3600, 48).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: U, vertexShader: DOME_VERT, fragmentShader: FLOOR_FRAG, side: THREE.DoubleSide, colorWrite: false }));
    floor.position.y = BASE - 13; floor.renderOrder = -9; floor.frustumCulled = false; scene.add(floor);
    await ctx.yield();

    // ---- 7 droplets: a far field and a near field of glass globes that wrap round the camera
    const rd = rng.fork('drops'), nLens = 100, nNear = Math.round(700 * detail) + nLens, nDrop = Math.round(5000 * detail * density) + nNear;
    addQuads(await quads(nDrop, (i, o) => { o[0] = rd(); o[1] = rd(); o[2] = rd(); o[3] = rd(); o[4] = i < nLens ? 2 : (i < nNear ? 1 : 0); }), sprite(DROP_VERT, DROP_FRAG), 3);
    await ctx.yield();

    addQuads(await quads(19, (i, o) => { o[0] = 0; o[1] = 0; o[2] = 0; o[3] = 0; o[4] = i; }), sprite(GLINT_VERT, GLINT_FRAG), 4);   // the hard glints

    // ---- 8 wisps streaming upward, and the rags of the cloud base
    const rw = rng.fork('wisps'), nStream = Math.round(380 * detail), nWisp = nStream + (ragged ? 150 : 80);
    addQuads(await quads(nWisp, (i, o) => { o[0] = rw(); o[1] = rw(); o[2] = rw(); o[3] = rw(); o[4] = i < nStream ? 0 : 1; }), sprite(WISP_VERT, WISP_FRAG), 2);
    await ctx.yield();

    // ---- 9 companions: small clear crystals in the hero's glass (dark edges against bright fog, bright edges against
    // the dark of the hollow, one glint each on the first six): a bundle of hollow needles, a capped column, a broken
    // sector plate, fern stars and small stars
    const rc = rng.fork('company');
    const iceMat = makeIceMaterial({ ...hero.uniforms, uSaHubS: { value: 1 }, uSaRod: { value: 1 }, uSaOpen: { value: 0 } });
    await ctx.yield();
    const seg = (ox, oz, dx, dz, rings, tip, profile, level) => ({ ox, oz, dx, dz, rings, tip, profile, birth: -100, dur: 1, seed: rc(), level });
    // geometry built face by face with the attributes the ice shader reads (see makeIceMaterial in the part): each quad
    // gives metres along and -1..1 across at its four corners, a half thickness, a half width, a level and a seed
    const iceGeo = () => {
      const P = [], O = [], A = [], S = [], L = [], I = []; let n = 0;
      return {
        quad(a, b, c, d, al, ac, h, w, level, seed) {
          [a, b, c, d].forEach((q, i) => { P.push(q[0], q[1], q[2]); O.push(0, 0, -100, 1); A.push(0, 1, seed, level); S.push(al[i], ac[i], h, w); L.push(0, 0, 1); });
          I.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4;
        },
        geo() {
          const g = new THREE.BufferGeometry(), f = (arr, k) => new THREE.BufferAttribute(new Float32Array(arr), k);
          g.setAttribute('position', f(P, 3)); g.setAttribute('aOrg', f(O, 4)); g.setAttribute('aAx', f(A, 4)); g.setAttribute('aSeg', f(S, 4)); g.setAttribute('aPl', f(L, 3));
          g.setIndex(I); return g;
        },
      };
    };
    const HEXA = [0, 1, 2, 3, 4, 5, 6].map((j) => [Math.cos(j * Math.PI / 3), Math.sin(j * Math.PI / 3)]), Z4 = [0, 0, 0, 0];
    // a bundle of hollow needles: seven separate six-sided needles of different lengths, one in the middle and six
    // round it, splayed a hair apart, each end a pale rim round a dark mouth (the bundle lies along local Z)
    const needleGeo = () => { const B = iceGeo(), r = 0.42;
      for (let i = 0; i < 7; i++) {
        const ring = i ? 1 : 0, a = i * Math.PI / 3 + 0.3, gap = 2 * r * rc.range(1.05, 1.5);
        const cx = ring * Math.cos(a) * gap, cy = ring * Math.sin(a) * gap * 0.9, sx = ring * Math.cos(a) * rc.range(0.02, 0.11), sy = ring * Math.sin(a) * rc.range(0.02, 0.11);
        const len = i ? rc.range(4, 9) : 10, zm = i ? rc.range(-2, 2) : 0, sd = rc(), rr = r * rc.range(0.8, 1.05), z0 = zm - len / 2, z1 = zm + len / 2, hh = rr * 0.87;
        const pt = (j, z, k) => [cx + sx * (z - zm) + HEXA[j][0] * rr * k, cy + sy * (z - zm) + HEXA[j][1] * rr * k, z];
        for (let j = 0; j < 6; j++) {
          B.quad(pt(j, z0, 1), pt(j + 1, z0, 1), pt(j + 1, z1, 1), pt(j, z1, 1), [0, 0, len, len], [-1, 1, 1, -1], hh, 0.3, 1, sd);
          for (const [ze, dr] of [[z1, -1], [z0, 1]]) { const zi = ze + dr * 0.9;
            B.quad(pt(j, ze, 1), pt(j + 1, ze, 1), pt(j + 1, ze, 0.6), pt(j, ze, 0.6), Z4, [0.1, 0.1, 0.7, 0.7], hh, 0.3, 1, sd);
            B.quad(pt(j, ze, 0.6), pt(j + 1, ze, 0.6), pt(j + 1, zi, 0.6), pt(j, zi, 0.6), [0, 0, 0.9, 0.9], [0.8, 0.8, 1, 1], hh, 0.3, 1, sd);
            B.quad(pt(j, zi, 0.6), pt(j + 1, zi, 0.6), pt(0, zi, 0), pt(0, zi, 0), Z4, [1, 1, 1, 1], hh, 0.3, 1, sd); }
        }
      }
      return B.geo(); };
    // a capped column: a six-sided post (along local Y) with a six-sided plate on each end; the plates are small copies
    // of the hero's hub (its ring pattern, a dark rim, the post seen through the middle as a dark grain)
    const columnGeo = (L = 4.6, R = 1.5, rp = 0.42, tp = 0.34) => { const B = iceGeo(), sp = rc();
      const hp = (j, y, r) => [HEXA[j][1] * r, y, HEXA[j][0] * r];   // corners on the local Z axis, as on the hub
      for (const sgn of [1, -1]) { const y1 = sgn * L / 2, yb = y1 - sgn * 0.07, y0 = y1 - sgn * tp, sd = rc();
        for (let j = 0; j < 6; j++) {
          B.quad(hp(j, y1, R * 0.93), hp(j + 1, y1, R * 0.93), [0, y1, 0], [0, y1, 0], Z4, Z4, tp / 2, R, 3, sd);
          B.quad(hp(j, y1, R * 0.93), hp(j + 1, y1, R * 0.93), hp(j + 1, yb, R), hp(j, yb, R), Z4, Z4, tp / 2, R, 3, sd);
          B.quad(hp(j, yb, R), hp(j + 1, yb, R), hp(j + 1, y0, R), hp(j, y0, R), Z4, Z4, tp / 2, R, 3, sd);
          B.quad(hp(j, y0, R), hp(j + 1, y0, R), [0, y0, 0], [0, y0, 0], Z4, Z4, tp / 2, R, 3, sd);
        } }
      const ya = -L / 2 + tp, yb = L / 2 - tp;
      for (let j = 0; j < 6; j++) B.quad(hp(j, ya, rp), hp(j + 1, ya, rp), hp(j + 1, yb, rp), hp(j, yb, rp), [0, 0, yb - ya, yb - ya], [-1, 1, 1, -1], rp, 0.4, 1, sp);
      return B.geo(); };
    // a small crystal of the company. kind 0: a fern dendrite (slim ridged arms, seven mirrored pairs of 60 degree branches
    // inside a diamond envelope, twigs parallel to the arm); kind 1: a sectored plate (six broad ridged sectors with a
    // prong off each shoulder); kind 2: a plain star with two pairs of branches. `broken` snaps two arms short
    const flakeList = async (R, kind, broken) => { const L = [], hh = Math.max(0.07, R * 0.024), hr = R * (kind === 1 ? 0.22 : 0.14);
      L.push(seg(0, -hr, 0, 1, [{ a: 0, w: 0.02, h: hh * 1.15 }, { a: hr * 0.5, w: hr * 0.866, h: hh * 1.15 }, { a: hr * 1.5, w: hr * 0.866, h: hh * 1.15 }], hr * 2, 1, 1));
      for (let k = 0; k < 6; k++) { const th = k * Math.PI / 3, dx = Math.sin(th), dz = Math.cos(th), len = R * (broken && k === 2 ? 0.45 : broken && k === 4 ? 0.72 : 1), o = hr * 0.7, la = len - o;
        if (kind === 1) {
          L.push(seg(dx * o, dz * o, dx, dz, [{ a: 0, w: R * 0.08, h: hh }, { a: la * 0.32, w: R * 0.19, h: hh }, { a: la * 0.6, w: R * 0.19, h: hh * 0.9 }, { a: la * 0.74, w: R * 0.11, h: hh * 0.8 }], la, 1, 0));
          if (len > R * 0.8) for (const sgn of [-1, 1]) { const a2 = th + sgn * Math.PI / 3, f = 0.62, pw = R * 0.15;
            L.push(seg(dx * R * f + dz * sgn * pw, dz * R * f - dx * sgn * pw, Math.sin(a2), Math.cos(a2), [{ a: 0, w: R * 0.035, h: hh * 0.7 }, { a: R * 0.09, w: R * 0.03, h: hh * 0.65 }], R * 0.17, 2, 1)); }
          continue;
        }
        const w0 = R * (kind === 2 ? 0.05 : 0.036);
        L.push(seg(dx * o, dz * o, dx, dz, [{ a: 0, w: w0, h: hh }, { a: la * 0.84, w: w0 * 0.8, h: hh * 0.9 }, { a: la * 0.9, w: w0 * 1.35, h: hh * 0.85 }], la, 1, 0));
        for (const f of (kind === 2 ? [0.4, 0.64] : [0.2, 0.31, 0.42, 0.53, 0.64, 0.75, 0.86])) if (len > R * (f + 0.1)) for (const sgn of [-1, 1]) {
          const a2 = th + sgn * Math.PI / 3, bx = Math.sin(a2), bz = Math.cos(a2), bl = R * Math.min(0.85 * f, 0.62 * (1.02 - f)) * (kind === 2 ? 0.8 : 1), px = dx * R * f, pz = dz * R * f;
          L.push(seg(px, pz, bx, bz, [{ a: 0, w: w0 * 0.62, h: hh * 0.8 }, { a: bl * 0.78, w: w0 * 0.5, h: hh * 0.7 }, { a: bl * 0.86, w: w0 * 0.82, h: hh * 0.7 }], bl, 2, 1));
          if (kind === 0 && bl > R * 0.19) for (const g of [0.42, 0.7]) { const tl = Math.min(bl * 0.36, R * 0.085);
            L.push(seg(px + bx * bl * g, pz + bz * bl * g, dx, dz, [{ a: 0, w: w0 * 0.42, h: hh * 0.6 }, { a: tl * 0.7, w: w0 * 0.36, h: hh * 0.55 }], tl, 2, 2)); }
        } } await ctx.yield(); const g = await makeSegmentGeometryAsync(ctx, L); await ctx.yield(); return g; };
    // where the staged ones hang: CO15 the capped column over the far side of the star on the orbit; CO30 a fern star
    // beyond the tip, on the heading as we leave it; CO33 the broken sector plate at the centre of the turn off the
    // tip; CO31 a fern star low on the hollow there
    const CO15 = [11, 10, -10.5], CO30 = [11, 4.6, 48.5], CO33 = [10.5, 7.8, 30.5], CO31 = [14.5, 0.6, 32.5];
    const company = [], tv = new THREE.Vector3(), hv = new THREE.Vector3(), gv = new THREE.Vector3(), rv = new THREE.Vector3();
    // a place in view at brief second s: so far ahead along the gaze, so far to the right, so far up
    const stage = (s, ahead, right, up, w, clear) => {
      const u = uOf(s), p = path.pointAt(u, new THREE.Vector3()); path.tangentAt(u, tv);
      hv.set(0, starY(s), 0).sub(p).normalize(); gv.copy(tv).multiplyScalar(1 - w).addScaledVector(hv, w).normalize(); rv.crossVectors(gv, Y).normalize();
      p.addScaledVector(gv, ahead).addScaledVector(rv, right).addScaledVector(Y, up);
      for (let i = 0; i < 14 && path.distanceTo(p.x, p.y, p.z) < clear; i++) p.addScaledVector(rv, Math.sign(right || 1) * 1.2).addScaledVector(Y, 0.5);
      return p;
    };
    // the way a staged plate's flat is turned so that it is square-on to the eye at brief second s
    const faceTo = (at, s) => path.pointAt(uOf(s), new THREE.Vector3()).sub(tv.set(...at)).normalize().toArray();
    // gl = the facet (local) that carries the crystal's glint
    // (face = the way a staged plate's flat is turned: it spins in its own plane; the others tumble)
    const addIce = (geo, p, rx, ry, rz, spinRate, gl, face, tag) => { const m = new THREE.Mesh(geo, iceMat); m.position.copy(p); m.rotation.set(rx, ry, rz); m.userData.tag = tag; scene.add(m);
      company.push({ m, y: p.y, spin: spinRate, ph: rc.range(0, 6.28), gl: new THREE.Vector3(...gl), q: face ? new THREE.Quaternion().setFromUnitVectors(Y, new THREE.Vector3(...face).normalize()) : null }); return m; };
    const G_NEEDLE = [0, 0.42, 1.2], G_COLUMN = [0, 2.34, 1.3], gStar = (R) => [0, R * 0.04, R * 0.5];
    // the needle bundle (or a small star) drifts by on the left at 4 s, against the blue of the well
    addIce(plates ? await flakeList(2.2, 2, false) : needleGeo(), stage(4.0, 3, -14, 5, 0, 7), 0.35, 1.9, 1.1, 0.11, plates ? gStar(2.2) : G_NEEDLE, null, 'needles');
    await ctx.yield();
    // the capped column (or a broken star) turns over the far side of the star at 15-16 s
    addIce(plates ? await flakeList(2.8, 0, true) : columnGeo(), new THREE.Vector3(...CO15), 0.5, 0.4, 0.9, 0.22, plates ? gStar(2.8) : G_COLUMN, null, 'column');
    await ctx.yield();
    // the broken sector plate, 7 m across: it hangs at the centre of the left-hand turn off the tip, square-on to the
    // eye at 32.4 s, in a small blue clearing of its own, while the finished star comes in below it
    addIce(await flakeList(3.5, 1, true), new THREE.Vector3(...CO33), 0, 0, 0, 0.5, gStar(3.5), faceTo(CO33, 32.4), 'plate');
    await ctx.yield();
    // a fern star, 7 m across, face-on beyond the tip: the subject of the frame as we leave the arm (31 s)
    addIce(await flakeList(3.5, 0, false), new THREE.Vector3(...CO30), 0, 0, 0, 0.1, gStar(3.5), faceTo(CO30, 31.0), 'fern30');
    await ctx.yield();
    // a fern star, 7 m across, just beyond the hero's rim and level with it, inside that turn: it comes in from the left
    // as the gaze leaves the tip and stands on the deep blue of the hollow, low in the frame, at 32 s
    addIce(await flakeList(3.5, 0, false), new THREE.Vector3(...CO31), 0.9, 0.3, 0.4, 0.14, gStar(3.5), [-0.85, 0.5, 0.1], 'fern31');
    await ctx.yield();
    addIce(await flakeList(2.2, 0, false), stage(27.5, 12, 6, 4.5, 0, 6.5), 0.7, 0.5, 0.5, 0.16, gStar(2.2), null, 'skimstar');   // a small star over the far end of the skim
    await ctx.yield();
    for (let i = 0; i < 6; i++) {
      const a = rc.range(0, 6.28), r = rc.range(24, 46), p = new THREE.Vector3(Math.sin(a) * r, rc.range(6, 26), Math.cos(a) * r);
      for (let j = 0; j < 10 && (path.distanceTo(p.x, p.y, p.z) < 8 || p.distanceTo(tv.set(...CO33)) < 9 || p.distanceTo(tv.set(...CO31)) < 10 || p.distanceTo(tv.set(...CO30)) < 10 || p.distanceTo(tv.set(...CO15)) < 8); j++) p.y += 2.5;
      const R = rc.range(1.6, 2.8);
      addIce(i % 3 === 0 ? columnGeo(3.4, 1.1, 0.32, 0.26) : (i % 3 === 1 ? needleGeo() : await flakeList(R, i === 5 ? 1 : 2, i === 5)), p, rc.range(-0.8, 0.8), rc.range(0, 6.28), rc.range(-0.8, 0.8), rc.range(0.08, 0.3), i % 3 === 0 ? G_COLUMN : (i % 3 === 1 ? G_NEEDLE : gStar(R)), null, 'rnd' + i);
      await ctx.yield();
    }
    U.uHo.value[0].set(CO33[0], CO33[1], CO33[2], 9);
    if (!plates) U.uHo.value[1].set(CO15[0], CO15[1], CO15[2], 6.5);
    U.uHo.value[2].set(CO30[0] + 1, CO30[1] - 8, CO30[2] + 4, 7.5);   // (the blue of the hollow under the fern star beyond the tip)
    // vapour wisps: about 80, each a ribbon of three quads sharing one seed, most of them on the six spine tips
    const rt = rc;
    addQuads(await quads(Math.round(80 * detail) * 3, (i, o) => { const pc = i % 3, th = (i - pc) / 3; if (pc === 0) { o[0] = rt(); o[1] = rt(); o[2] = rt(); o[3] = rt(); } o[4] = (th % 3 === 2 ? 6 + (th % 6) : th % 6) + 16 * pc; }), sprite(THREAD_VERT, THREAD_FRAG), 3);
    await ctx.yield();

    // ---- 10 the crowd below the base: 60 flat plates and stars, and the far glitter
    const rf = rng.fork('flakes'), nBig = 60, nFlake = nBig + Math.round(2600 * detail * density), P0 = new THREE.Vector3().fromArray(onLine(76));
    addQuads(await quads(nFlake, (i, o) => {
      const big = i < nBig;
      for (let t = 0; t < 12; t++) {
        const a = rf.range(0, 6.283), r = big ? rf.range(70, 520) : 40 + 900 * Math.sqrt(rf());
        o[0] = Math.sin(a) * r; o[2] = Math.cos(a) * r; o[1] = big ? rf.range(-45, -380) : rf.range(-28, -560);
        tv.set(o[0], o[1], o[2]).sub(P0); const along = tv.dot(EX);
        if (along > 0 && tv.angleTo(EX) < 0.5) continue;                 // nothing in front of the ring
        if (!big || path.distanceTo(o[0], o[1], o[2]) > 60) break;
      }
      o[3] = rf(); o[4] = big ? rf.range(9, 25) : rf.range(0.8, 2.4);
    }), sprite(FLAKE_VERT, FLAKE_FRAG), 1);
    await ctx.yield();
    // the nearest neighbour below the base: a second finished star of another habit, 36 m across, lying nearly flat
    // (a touch toward us), built by the part from its own plan
    const nbrHabit = habit === 'sector' ? 'plate' : 'sector';
    const nbr = await makeCrystal(ctx, rng.fork('nbr'), nbrHabit, hero.uniforms);
    nbr.name = 'nbr'; nbr.userData.tag = 'nbr'; nbr.scale.setScalar(0.6); nbr.visible = false; scene.add(nbr);
    const qNb = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(-0.7071, 0, -0.7071), 0.13);
    await ctx.yield();
    // a second neighbour of the third habit, 36 m across, for the exit: it drifts in on the sunward side and lies flat
    // beyond the gate of the hero's arms, to the right of the ring and above it in the frame (never nearer the exit
    // line than 12 m, never in front of the ring), as we go through the notch (52 s); by the last 30 m it has slid out
    // of frame and the ring is alone on the water
    const nbr2 = await makeCrystal(ctx, rng.fork('nbr2'), ['fern', 'sector', 'plate'].find((h) => h !== habit && h !== nbrHabit), hero.uniforms);
    nbr2.userData.tag = 'nbr2'; nbr2.scale.setScalar(0.6); nbr2.visible = false; scene.add(nbr2);
    const rS = new THREE.Vector3().crossVectors(EX, Y).normalize(), upS = new THREE.Vector3().crossVectors(rS, EX).normalize();
    const G2 = new THREE.Vector3().fromArray(onLine(21.5)).addScaledVector(rS, 30).addScaledVector(upS, 14);
    const qNb2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0.6, 0, 0.8), 0.1);
    await ctx.yield();

    // ---- 11 the lighthouse on its skerry (the beam, the lamp and the surf are drawn by the dome's sea)
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 4.2, 36, 10), new THREE.MeshBasicMaterial({ color: col(H.band).lerp(col('#9aa0aa'), 0.7).multiplyScalar(0.9), fog: false }));
    tower.position.set(LAMP.x, SEA_Y + 22, LAMP.z); scene.add(tower);
    const skerry = new THREE.Mesh(new THREE.ConeGeometry(13, 7, 7), new THREE.MeshBasicMaterial({ color: col(H.sea, 1.5).lerp(col(H.ceil), 0.25), fog: false }));
    skerry.position.set(LAMP.x, SEA_Y + 3.5, LAMP.z); scene.add(skerry);

    await ctx.yield();

    // ---- 12 gaze, the frame-by-frame script, post
    const hubV = new THREE.Vector3(0, 0.75, 0), tipV = new THREE.Vector3(0, 0.4, 20), camP = new THREE.Vector3();
    const qA = new THREE.Quaternion(), qB = new THREE.Quaternion(), tipsL = [];
    const rockAxis = new THREE.Vector3(0.5, 0, 0.8660254), X = new THREE.Vector3(1, 0, 0);
    const sunV = new THREE.Vector3(), ringV = new THREE.Vector3().fromArray(onLine(0)), cHol = col(H.hollow);
    const tip1V = new THREE.Vector3(22, 0.5, 13);   // out along the next arm (arm 1): where the gaze goes first as we leave the tip
    const hubAt = (t, u) => hubV.set(0, starY(sec(u)) + 0.75, 0);
    // as the base tears (37-41 s) the gaze dips from the hub toward the ring, far below on the sea, so both are in frame
    const hubRing = (t, u) => { const s = sec(u); return hubV.set(0, starY(s) + 0.75, 0).lerp(ringV, DIP * smoothstep(36.6, 38.0, s) * (1 - smoothstep(39.8, 41.2, s))); };
    const pois = [   // the hub on the approach and the orbit, held until we are almost over it (a nod down to the nucleus and
      // its rings at 22 s); the tip on the skim; off the tip the path turns hard left and nearly level, and the gaze leads
      // the turn: first out along the next arm, then the hub (at most 53 degrees a second; the hero is out of frame for
      // about a second, and the star's near arms are back in the lower left by 31.5 s); in the fall the gaze lifts to the
      // sunward horizon (band, veils, sun, sea) with the star in the lower half and leans a little to the near neighbour
      // as it passes; then the hub until the exit line
      { at: hubAt, from: 0, to: uOf(22.85), weight: 0.82, fade: 0.04 },
      { at: (t, u) => tipV.set(0, 0.4, hero.tipRadius(grow(sec(u))) + 6), from: uOf(22.9), to: uOf(30.15) + 0.012, weight: 0.5, fade: 0.25 },
      { at: () => tip1V, from: uOf(30.2), to: uOf(34.4), weight: 0.42, fade: 0.25 },
      { at: hubRing, from: uOf(31.2), to: uOf(41.8), weight: 0.78, fade: 0.2 },
      { at: (t, u) => sunV.set(-6, starY(sec(u)) + 6, 75), from: uOf(40.4), to: uOf(46.3), weight: 0.8, fade: 0.3 },
      { at: () => nbr.position, from: uOf(43.6), to: uOf(46.6), weight: NBW, fade: 0.4 },
      { at: hubAt, from: uOf(45.2), to: uOf(50.5), weight: 0.7, fade: 0.3 },
    ];
    const apply = (time, u, cam) => {
      const s = sec(u), gs = grow(s), y = starY(s), o = hero.object;
      hero.setSeconds(gs);
      // the opening: a plain hexagonal plate, shown larger than life (the whole crystal 1.8 times, its hub plate 2.35
      // times more), standing face-on to us in a deep blue well in the cloud; the arms punch out of its corners, and as
      // the star grows burst by burst it comes down to its true size and settles flat (the plate by 9 s)
      const open = 1 - smoothstep(2.0, 6.0, s), k = lerp(1, 1.8, open), hb = lerp(1, 2.35, 1 - smoothstep(2.0, 9.0, s));
      hero.setHubBoost(hb);
      o.scale.set(k, lerp(1, 1.5, open), k);
      o.position.set(0, y, 0);
      o.quaternion.setFromAxisAngle(Z, Math.PI / 6 * smoothstep(43.5, 51, s)).multiply(qA.setFromAxisAngle(Y, spin(s)));
      o.quaternion.multiply(qA.setFromAxisAngle(rockAxis, 0.02 * Math.sin(time * 0.8) * smoothstep(46, 51, s)));
      const e = 1 - smoothstep(2.5, 7.0, s), wt = time * Math.PI / 2;   // the tumble: its face swings through square-on to us every 2 s
      if (e > 0) o.quaternion.multiply(qA.setFromAxisAngle(Z, e * (Math.PI / 2 + 0.7 * Math.sin(wt)))).multiply(qB.setFromAxisAngle(X, e * 0.3 * Math.sin(time * 0.9 + 1))).multiply(qA.setFromAxisAngle(Y, e * 0.9 * Math.sin(time * 0.7 + 0.5)));
      o.updateMatrixWorld(true);
      const below = smoothstep(39.5, 43.5, s);
      hero.setBelow(below);
      const rHub = hero.hubRadius(gs) * hb, tr = Math.max(hero.tipRadius(gs), rHub) * k;
      U.uT.value = time; U.uSec.value = s; U.uTipR.value = tr; U.uSaClock.value = time;
      U.uSaHub.value.set(0, y, 0, Math.max(lerp(32, 26, smoothstep(0, 7, s)), 1.4 * tr));   // the hollow: the well of the first frame
      U.uSaAtm.value.set(0.018, 0.0012, BASE, tear(s));
      U.uSaOpen.value = 1 - smoothstep(4.0, 8.5, s);
      U.uLane.value = 1 - smoothstep(4.5, 6.5, s);
      // the clear lane: to the plate in the opening; off the tip to the fern star beyond it (29.6-31.6 s), then to the
      // broken plate (31.6-35.2 s)
      const l30 = smoothstep(29.6, 30.2, s) * (1 - smoothstep(31.2, 31.6, s)), l33 = smoothstep(31.6, 32.2, s) * (1 - smoothstep(34.4, 35.2, s));
      if (l33 > 0) U.uLaneP.value.set(CO33[0], CO33[1], CO33[2], l33); else if (l30 > 0) U.uLaneP.value.set(CO30[0], CO30[1], CO30[2], l30); else U.uLaneP.value.set(0, y, 0, U.uLane.value);
      U.uHollow.value.copy(cHol).multiplyScalar(lerp(0.34, 0.42, smoothstep(3, 8, s))); U.uSaHollow.value.copy(U.uHollow.value);
      hero.getTips(gs, tipsL);
      for (let i = 0; i < 12; i++) {   // (a tip still under the enlarged plate rides the plate's corner)
        const t = tipsL[i], j = i % 6;
        if (Math.hypot(t.x, t.z) < rHub) t.set(Math.sin(j * Math.PI / 3) * rHub, 0, Math.cos(j * Math.PI / 3) * rHub);
        tips[i].copy(t).applyMatrix4(o.matrixWorld);
      }
      // glints: one on a corner of the tumbling hexagon, never out, flaring (eased) each time the face swings square-on,
      // and a spark on each of its six corners; every event of the growth (a widening of the plate, the punch, a burst)
      // puts a flash on every tip that rises in a tenth of a second and decays before the next; below the base the tips
      // keep a low gold spark; one steady twinkle on a facet of each of six companions
      const cw = Math.cos(wt), c4 = cw * cw * cw * cw;
      let ph = 9; if (gs < 30.6) for (let i = 0; i < burstS.length && burstS[i] <= s; i++) ph = s - burstS[i];
      U.uGl.value.set((1 - smoothstep(4.4, 6.2, s)) * (0.8 + 1.5 * c4 * c4), 0.5 - 0.2 * below, 1.5 * Math.exp(-ph * 2.6) * smoothstep(0, 0.1, ph), 1);
      U.uGlP.value.set(0, 0.9, rHub * 0.8).applyMatrix4(o.matrixWorld);
      U.uThread.value = smoothstep(8.8, 9.6, gs) * (1 - smoothstep(29.3, 30.0, gs)) * smoothstep(4.0, 7.0, s);
      nbr.visible = s > 27 && s < 51.5;   // (a ghost high in the cloud until it falls out of the base beside us; behind us on the exit line)
      nbr2.visible = s > 36;
      nbr2.position.copy(G2).addScaledVector(rS, 16 * (1 - smoothstep(47.5, 52.4, s))); nbr2.position.y += (52.2 - s) * 1.2;
      nbr2.quaternion.copy(qNb2).multiply(qA.setFromAxisAngle(Y, 0.9 + s * 0.03));
      nbr.position.set(nbX(s), nbY(s), nbZ(s)); nbr.quaternion.copy(qNb).multiply(qA.setFromAxisAngle(Y, 0.4 + s * 0.05));
      U.uLamp.value.w = time * (Math.PI * 2 / 6);
      dome.position.copy(cam);
      const kf = 1 - smoothstep(BASE - 6, BASE + 6, cam.y);
      scene.fog.density = lerp(0.018, 0.0012, kf); scene.fog.color.copy(cMid).lerp(cAir, kf);
      for (let i = 0; i < company.length; i++) {
        const c = company[i];
        if (c.q) c.m.quaternion.copy(c.q).multiply(qA.setFromAxisAngle(Y, c.ph + time * c.spin)).multiply(qB.setFromAxisAngle(X, 0.14 * Math.sin(time * 0.5 + c.ph)));
        else c.m.rotation.y = c.ph + time * c.spin;
        c.m.position.y = c.y + Math.sin(time * 0.4 + c.ph) * 0.5;
        if (c.m.userData.tag === 'plate') U.uHo.value[0].set(c.m.position.x, c.m.position.y, c.m.position.z, 9);   // (the plate's clearing rides the plate's own place)
        if (i < 6) { c.m.updateMatrixWorld(true); tv.copy(c.gl).applyMatrix4(c.m.matrixWorld); glintAt[i].set(tv.x, tv.y, tv.z, (0.75 + 0.35 * Math.sin(time * 1.7 + c.ph * 3)) * (1 - below)); }
      }
    };
    await ctx.yield();
    apply(0, 0, path.pointAt(0, camP));
    await ctx.yield();

    return {
      scene, path, duration: S_END, pace,
      camera: { fov: 75, near: 0.2, far: 4500, lookAhead: 12, sway: 0.6, bank: 0.4 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#CFEFFF', glow: 1, tilt: true, revealDistance: 330 },
      post: { exposure: 1.0, bloom: { strength: 0.35, radius: 0.6, threshold: 1.0 },
        grade: { saturation: 1.08, contrast: 1.05, tint: '#ffffff', shadowTint: '#0a1226', vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update(dt, time, camera, u) {
        camera.getWorldPosition(camP);
        if (ctx.renderer && ctx.renderer.getDrawingBufferSize) ctx.renderer.getDrawingBufferSize(U.uRes.value);
        apply(time, u, camP);
      },
      dispose() { if (hero.dispose) hero.dispose(); },
    };
  },
};
