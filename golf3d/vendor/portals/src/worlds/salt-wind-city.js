// The City That Turns: a gale on the salt coast, ridden on a bicycle down the Great Dyke through hundreds of carousel
// windmills, over a humpback bridge where a gust overtakes us, and up a causeway into the moon gate of the Wind Pagoda.
// Built 1.6 times life size (pagoda 1.4). X west (right), Y up, Z north; we ride south toward -Z.
// The gale carries us: we set off down the dyke and are lifted off it at once: out over the jade pan and under the turning
// frame of a great sweep mill, low across the salt hard among the cones and the workers, on past the hamlet's gables with the
// ducks bursting across our bow, up over the canal beside the humpback bridge for the whole quilt from above as the gust
// overtakes us, down in a dive under the rim of the great mill, out over the moat past the junks, up and round to the
// north-west of the tower and down onto the causeway for the gate. The bicycle is in the picture as in the version before: only while its wheels are on the ground.
// (road = the ground route everything is laid out along, path = what the camera flies).
// In a harvest year the dry raked pans lie beyond 60 m of the flight: every pan under it and beside the first dyke holds brine.
// By seed: the hour (golden gale, first light, a blue afternoon; night when asked for), one of four years (brine, harvest
// crust, red seepweed, a quartering north-east wind), ducks or geese on the dyke, one barge or a convoy on the canal.
// Rare: forty red-crowned cranes overtake us at the bridge crest and wheel round the pagoda.
// The canal is worked: salt barges under tall battened lugsails run down the wind along it, one after another or in convoys
// of three, by the world clock; each drops its sail and lays its mast forward to pass under the bridge and sets them again
// once it is through and a hull's length past the line the flight crosses the canal on (the fold is the arch's and, east of it, that line's: see THE FOLD below; the fleet keeps the lane the flight tops with room
// to spare). A rank of tall banner masts stands along the canal's south quay. The hamlet beside the dyke keeps its yard out of doors: long washing lines, racks of peeled persimmons on
// strings, persimmon trees, baskets, jars, a ladder, pennant poles on its rim and at the bridge's foot.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed } from '../kit/core.js';
import { makeSky, makeLightRig, makeCloudField } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import * as flora from '../kit/flora.js';
import { buildHero, GB, ONE, carouselGeometry, boatGeometry, makeSailUniforms, makeSailMaterial, instanceCarousels } from '../parts/salt-wind-city.js';

const H = (h) => new THREE.Color(h);
const LOOKS = {
  golden: { sun: [0.937, 0.259, -0.234], zenith: '#4E7FB4', mid: '#9DB7C9', horizon: '#F2C686', sunColor: '#FFC88A', fog: '#EDC690', dens: 0.0011, key: 3.4, amb: 1.2,
    exposure: 1.0, cloudLit: '#F6EAD2', cloudShade: '#8B88A6', straw: 1.6, pan: 1.0, shadow: 0.5, tow: 0.5, cloudK: 0.36, side: 0.42, skyAmb: '#9DB9E0', groundAmb: '#B8906A', lamp: 0, win: 0, sea: '#FFF1D2' },
  // day: mid-afternoon after the front. The sun stands 20 degrees up, ahead and to the right, under a deep blue sky: every
  // west face is warm, every east face blue shade, the sails against the light glow straw, and each mill lays a shadow more
  // than twice its height across the dyke and the left-hand pans
  day: { sun: [0.857, 0.342, -0.385], zenith: '#2C62B4', mid: '#7FA9D6', horizon: '#F2D6AC', sunColor: '#FFD09A', fog: '#E0CFB4', dens: 0.001, key: 4.0, amb: 1.0,
    exposure: 0.97, cloudLit: '#FFEFD2', cloudShade: '#8B90B0', straw: 1.5, pan: 1.2, shadow: 0.56, tow: 0.36, cloudK: 0.4, hard: 0.45, side: 0.4, cloudE: [0.5, 0.6, 0.2, 1.5], skyAmb: '#9DB9E0', groundAmb: '#B8906A', lamp: 0, win: 0, sea: '#FFF4DC' },
  dawn: { sun: [-0.9, 0.14, -0.41], zenith: '#6E8FC0', mid: '#C8B8C8', horizon: '#F6C9A8', sunColor: '#FFB98A', fog: '#F0C8B0', dens: 0.0014, key: 3.0, amb: 1.1,
    exposure: 1.0, cloudLit: '#FBE0CC', cloudShade: '#8A86A8', straw: 1.9, pan: 0.9, shadow: 0.36, tow: 0.5, cloudK: 0.36, skyAmb: '#9DB9E0', groundAmb: '#B8906A', lamp: 0.22, win: 1, sea: '#FFE0C4' },
  night: { sun: [0.567, 0.743, -0.355], zenith: '#040a1c', mid: '#0c1c3e', horizon: '#1d3764', sunColor: '#B9CBFF', fog: '#16243f', dens: 0.0009, key: 1.5, amb: 2.1,
    exposure: 1.08, cloudLit: '#8498cc', cloudShade: '#1c2a4e', straw: 0.3, pan: 0.6, shadow: 0.24, tow: 0.6, cloudK: 0.18, skyAmb: '#5672b4', groundAmb: '#232f58', lamp: 1, win: 1.6, sea: '#5f78b0' },
};

const PAN_VS = /* glsl */`
varying vec3 vW;
void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const PAN_FS = /* glsl */`
uniform float uTime, uFrontZ, uFogDens, uSeed, uWeed, uPan, uHarvest, uLamp, uTowK, uShK, uCloudK;
uniform vec3 uSun, uSunCol, uSky, uGround, uZen, uHor, uFogCol, uShadowCol; uniform vec4 uCloudE; uniform vec2 uWind;
varying vec3 vW;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
void main() {
  vec2 p = vW.xz;
  vec2 pw = vec2(-p.x * uWind.y + p.y * uWind.x, -p.x * uWind.x - p.y * uWind.y);   // across the wind, and up it
  vec3 dv = cameraPosition - vW; float dist = length(dv); vec3 V = dv / max(dist, 1e-4);
  float near = 1.0 - smoothstep(60.0, 420.0, dist);
  vec2 g = vec2(p.x / 64.0, (p.y - 26.0) / 44.0);
  vec2 id = floor(g), f = fract(g);
  float e = min(min(f.x, 1.0 - f.x) * 64.0, min(f.y, 1.0 - f.y) * 44.0);
  float dc = abs(p.y - 36.0) - 12.0;
  float dm = max(abs(p.x) - 130.0, max(p.y + 100.0, -330.0 - p.y));
  float dO = min(dc, dm);
  float open = step(dO, 0.0);
  e = mix(min(e, dO), 1.7 - dO, open);
  float wob = (vn(p * 0.35) - 0.5) * 0.9 * near;
  float dyke = 1.0 - smoothstep(1.2, 1.7, e + wob * 0.5);
  float crust = (1.0 - smoothstep(1.7, 3.6 + wob * 2.0, e)) * (1.0 - dyke);
  // which brine: drifts of a few pans
  vec2 gid = floor(id * 0.5 + (vn(id * 0.37 + uSeed) - 0.5) * 1.6);
  float r = h21(gid + 3.7 + uSeed);
  float h = h21(id + 9.1);
  float along = 0.0;                                                  // pans whose brine is chosen: by the first dyke, and under the flight
  if (p.y > 100.0 && abs(p.x) < 64.0) { r = p.x < 0.0 ? 0.66 + 0.3 * h : 0.12 + 0.4 * h; along = 1.0; }
  // south of the canal, where we are carried low over them, the pans alternate rose and jade like a chequerboard
  if (p.y < 24.0 && p.y > -106.0 && p.x > -64.0 && p.x < 128.0) { r = mod(id.x + id.y, 2.0) < 0.5 ? 0.62 + 0.3 * h : 0.3 + 0.28 * h; along = 1.0; }
  if (p.x < -700.0) r = 0.1;
  r = mix(r, 0.1, open * step(dm, 0.0)); r = mix(r, 0.4, open * step(0.0, dm));
  // seen from any height a pan's crust rim is a white shore of its own shape: wide lobes where the salt has dried in
  float lobe = smoothstep(0.42, 0.8, vn(p * 0.05 + h * 3.0) * 0.6 + vn(p * 0.19 + 9.0) * 0.4);
  crust = max(crust, (1.0 - smoothstep(1.7, 3.6 + 6.0 * lobe, e + (vn(p * 0.9) - 0.5) * 1.6)) * (1.0 - dyke) * (1.0 - open) * 0.8);
  vec3 tint = r < 0.25 ? vec3(0.40, 0.49, 0.56) : r < 0.6 ? vec3(0.16, 0.39, 0.33) : r < 0.82 ? vec3(0.69, 0.25, 0.27) : vec3(0.70, 0.29, 0.20);
  tint *= 0.9 + 0.2 * h;
  // water: a tinted mirror with ripples running down the wind
  // (the wavelets' crests lie across the wind: flown down the wind they come toward the eye as ripples, never as streaks)
  vec2 rp = pw * vec2(0.34, 0.8) + vec2(0.0, uTime * 2.4);
  float n1 = vn(rp), n2 = vn(rp * 2.3 + 7.0);
  float d = p.y - uFrontZ;
  float band = smoothstep(0.0, 6.0, d) * (1.0 - smoothstep(34.0, 120.0, d));
  float chop = smoothstep(34.0, 120.0, d) * 0.5;
  float rough = (0.05 + 0.24 * band + 0.1 * chop) * (0.35 + 0.65 * near);
  vec3 N = normalize(vec3((n1 - 0.5) * rough, 1.0, (n2 - 0.5) * rough * 1.6));
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  vec3 skyc = mix(uHor, uZen, pow(clamp(R.y, 0.0, 1.0), 0.5));
  float fres = 0.03 + 0.97 * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 5.0);
  float nearC = 1.0 - smoothstep(8.0, 52.0, dist);                      // close under the eye: the raked bed, drifting crust, fine ripples
  float ridge = 0.9 + (0.1 + 0.1 * nearC) * sin(p.x * 3.3 + h * 20.0 + (vn(p * 0.45) - 0.5) * 2.4 * nearC) * near;
  // the rake's lines on the bed, each pan raked its own way: they read from the top of the climb as well as from the dyke
  float rkq = mix(p.x, p.y, step(0.5, fract(h * 7.3))) * 1.5 + h * 40.0 + (vn(p * 0.07 + h * 5.0) - 0.5) * 3.0;
  float rakeL = mix(0.5, 0.5 + 0.5 * sin(rkq), 1.0 - smoothstep(0.7, 2.0, fwidth(rkq)));
  ridge *= 1.0 + 0.36 * (rakeL - 0.5) * (0.35 + 0.65 * step(0.3, fract(h * 3.1)));
  vec3 bed = tint * ridge * (uSky + uSunCol * uSun.y * 1.6) * uPan;
  vec3 water = mix(bed, skyc * mix(vec3(1.0), tint * 2.0, mix(0.8, 0.6, min(uLamp, 1.0))), 0.22 + 0.5 * fres * (0.5 + 0.5 * near));   // the sky in each pan takes the pan's own colour, and far pans keep more of theirs
  float sr = max(dot(R, uSun), 0.0);
  float tw = vn(pw * vec2(5.0, 6.5) + vec2(uTime * 1.7, uTime * 5.0));     // fine: the glitter is flecks, not patches
  vec3 lit = uSky + uSunCol * (uSun.y * 1.7 / (0.75 + uSun.y));
  vec3 ruffle = vec3(0.10, 0.12, 0.20) * lit;
  // the sun on the brine: a broad sheen (half as strong under a higher sun, and never allowed to burn out: it keeps the
  // pan's colour), and on top of it the glitter, which is the only thing brighter than the salt
  float lobeK = mix(1.0, 0.5, smoothstep(0.24, 0.34, uSun.y));
  float lowSun = 1.0 - smoothstep(0.27, 0.32, uSun.y);                  // the golden gale and first light
  water += uSunCol * (pow(sr, 20.0) * mix(0.3, 0.16, lowSun) + pow(sr, 7.0) * 0.09) * lobeK * (1.0 - 0.7 * band);
  float cp = vn(vec2(pw.x * 0.045, pw.y * 0.018 + uTime * 0.8));
  float stk = vn(vec2(pw.x * 0.8, pw.y * 0.045 + uTime * 1.5));
  float nearK = 1.0 - smoothstep(30.0, 150.0, dist);
  water *= (0.74 + 0.5 * cp * cp) * (0.97 + (stk - 0.5) * 0.16 * nearK);
  water *= 1.0 + ((vn(vec2(pw.x * 0.9, pw.y * 2.7 + uTime * 2.6)) - 0.5) * 0.3 + (n1 - 0.5) * 0.32 + (n2 - 0.5) * 0.2) * nearC;
  // wave trains running down every pan, broad enough to read from the top of the climb
  water *= 1.0 + (vn(vec2(pw.x * 0.11, pw.y * 0.5 + uTime * 1.1)) - 0.5) * 0.3 * near;
  // salt blooming on the bed of the crystallisers: pale blush patches, thicker in the rose pans than the jade
  float bloom = smoothstep(0.56, 0.72, vn(p * 0.13 + h * 7.0) * 0.62 + vn(p * 0.6 + 3.0) * 0.38) * (1.0 - smoothstep(70.0, 230.0, dist));
  water = mix(water, mix(water, vec3(0.80, 0.76, 0.70) * lit, 0.55), bloom * (r > 0.6 ? 0.42 : 0.2) * (1.0 - open));
  // flecks and threads of crust drifting down the wind (they gather thicker toward each pan's rim)
  // pale patches where a pan is drying out: tens of metres across, on six pans in ten, at any distance
  float dry = smoothstep(0.58, 0.8, vn(p * 0.035 + h * 11.0) * 0.7 + vn(p * 0.13 + 2.0) * 0.3) * step(0.4, fract(h * 5.3)) * (1.0 - open);
  water = mix(water, mix(water, vec3(0.80, 0.77, 0.72) * lit, 0.5), dry * (0.55 + 0.45 * vn(p * 0.8 + 7.0)));
  float fleck = smoothstep(0.64, 0.8, vn(vec2(pw.x * 1.5, pw.y * 1.0 + uTime * 1.3)) * 0.62 + vn(vec2(pw.x * 4.6, pw.y * 2.8 + uTime * 1.3)) * 0.38);
  water = mix(water, vec3(0.78, 0.76, 0.72) * lit * 0.9, fleck * nearC * (0.3 + 0.3 * (1.0 - smoothstep(3.0, 14.0, e))));
  float wl = max(water.r, max(water.g, water.b));
  water *= min(1.0, 0.95 / max(wl, 1e-3));
  water += uSunCol * (pow(sr, 220.0) * (mix(1.2, 0.2, lowSun) + mix(9.0, 6.0, lowSun) * smoothstep(mix(0.6, 0.68, lowSun), 0.9, tw)) * lobeK + pow(sr, 34.0) * smoothstep(0.76, 0.93, tw) * 2.3 * lobeK * (0.3 + 0.7 * near) * (1.0 - 0.7 * band));
  // a sun glint on every pan in the sun's half of the view: sparse sparks that crawl with the ripples
  water += uSunCol * pow(sr, 5.0) * smoothstep(0.9, 0.985, vn(pw * vec2(2.1, 3.4) + vec2(uTime * 0.9, uTime * 3.1) + 13.0)) * 1.3 * lobeK * (0.3 + 0.7 * near) * (1.0 - 0.7 * band);
  // the gust: a dark ruffled band behind a bright running edge
  water = mix(water * (1.0 - 0.3 * band * (0.8 + 0.2 * stk)), ruffle * (0.7 + 0.6 * stk), 0.5 * band);
  float edge = exp(-abs(d - 3.0) * 0.26) * step(-5.0, d);                 // a line of sparkles, not a white band
  water += uSunCol * edge * (0.12 + smoothstep(0.6, 0.78, vn(p * 4.3 + uTime * 4.0)) * 1.6);
  // the moat: mirror-silver to rose, warm toward the sun, gusts running south and glitter
  float mo = 1.0 - smoothstep(-10.0, 0.0, dm);
  vec2 vh = -V.xz / max(length(V.xz), 1e-3);
  float sw = smoothstep(-0.5, 0.5, dot(vh, uSun.xz / max(length(uSun.xz), 1e-3)));
  // (under a low sun the moat is a gold and lilac mirror, not a pale sheet)
  vec3 skyM = mix(skyc, mix(uHor * vec3(1.10, 0.94, 0.74), uZen * vec3(0.66, 0.80, 1.16), pow(clamp(R.y, 0.0, 1.0), 0.6)), lowSun * (1.0 - min(uLamp * 4.0, 1.0)));
  vec3 moatC = skyM * mix(vec3(0.66, 0.74, 0.92), vec3(1.05, 0.70, 0.52), sw * (1.0 - smoothstep(0.3, 0.6, uSun.y))) * mix(0.8, 0.86, lowSun);
  float gust = smoothstep(0.3, 0.8, vn(vec2(pw.x * 0.03 + uTime * 0.25, pw.y * 0.12 + uTime * 1.6)));
  moatC *= (0.80 + 0.42 * gust * (0.6 + 0.4 * n2)) * mix(1.0, 0.86, smoothstep(0.28, 0.36, uSun.y));   // deeper under the higher sun
  moatC += (uSunCol * 0.5 + uSky) * gust * (1.0 - gust) * smoothstep(0.45, 0.85, vn(pw * vec2(1.3, 3.0) + vec2(0.0, uTime * 4.0))) * mix(0.6, 0.4, lowSun) * near;
  moatC += uSunCol * pow(sr, mix(10.0, 18.0, lowSun)) * smoothstep(mix(0.72, 0.77, lowSun), 0.9, vn(pw * vec2(1.6, 4.0) + vec2(uTime * 1.3, uTime * 6.0))) * mix(2.2, 1.8, lowSun) * near;
  // the moat is the same brine as the pans: jade over its shallows along every shore, wave trains crossing it down the
  // wind, sparks of sun on the ripples
  float shal = 1.0 - smoothstep(0.0, 34.0, -dm + (vn(p * 0.045 + 5.0) - 0.5) * 30.0);
  moatC = mix(moatC, moatC * vec3(0.60, 1.04, 0.96) + vec3(0.02, 0.07, 0.06) * lit, 0.42 * shal);
  moatC *= 1.0 + (vn(vec2(pw.x * 0.11, pw.y * 0.5 + uTime * 1.1)) - 0.5) * 0.42 * near + (vn(vec2(pw.x * 0.9, pw.y * 2.7 + uTime * 2.6)) - 0.5) * 0.24 * nearC;
  moatC += uSunCol * pow(sr, 5.0) * smoothstep(0.9, 0.985, vn(pw * vec2(2.1, 3.4) + vec2(uTime * 0.9, uTime * 3.1) + 13.0)) * 1.3 * lobeK * (0.3 + 0.7 * near);
  moatC = mix(moatC * (1.0 - 0.3 * band), ruffle * (0.7 + 0.6 * stk), 0.5 * band); moatC += uSunCol * edge * 0.4;
  // the image of the white base and the tower: where the mirrored ray meets the wall plane z = -290
  float tt = max(p.y + 290.0, 0.0) / max(V.z, 0.02);
  float hx = p.x - V.x * tt + (n1 - 0.5) * 0.05 * tt, hy = V.y * tt * (1.0 + (n2 - 0.5) * 0.12);
  float front = step(0.0, p.y + 290.0) * step(0.02, V.z);
  float wallM = (1.0 - smoothstep(21.0, 23.0, abs(hx))) * (1.0 - smoothstep(22.5, 25.0, hy)) * front;
  float towM = (1.0 - smoothstep(18.0, 24.0, abs(hx))) * (1.0 - smoothstep(100.0, 126.0, hy)) * front;
  vec3 wallC = vec3(0.84, 0.80, 0.74) * lit * 0.8;
  wallC = mix(wallC, wallC * vec3(1.25, 1.05, 0.7), 1.0 - smoothstep(6.0, 7.6, length(vec2(hx, hy - 7.0))));
  wallC = mix(wallC, vec3(0.16, 0.17, 0.19) * lit, smoothstep(21.3, 22.3, hy));
  moatC = mix(moatC, wallC, wallM * 0.7);
  // the moon gate's light lies on the ruffled moat as a long path of gold dashes toward whoever looks at it: the round of
  // the gate drawn out down the water, the way a low lamp is
  float gateS = (1.0 - smoothstep(5.0, 26.0, abs(hx))) * smoothstep(-3.0, 5.0, hy) * (1.0 - smoothstep(26.0, 84.0, hy)) * front;
  float gd = vn(pw * vec2(0.7, 3.2) + vec2(0.0, uTime * 3.0)) * 0.7 + stk * 0.3;
  moatC += vec3(1.0, 0.70, 0.36) * gateS * smoothstep(0.38, 0.66, gd) * (0.75 + 0.5 * min(uLamp, 1.0)) * (1.0 - 0.5 * band);
  // the tower's own light on the ruffled water: a broad shimmering column of nine bands either side of the deck
  // (spread four times wider than a true mirror would show it: the causeway we ride on hides the true image)
  float sm = (stk - 0.5) * 0.08 * tt;
  float hyS = V.y * tt * (1.0 + 0.035 * sin(pw.x * 0.83 + uTime * 1.9) + 0.02 * sin(pw.x * 2.1 - uTime * 2.7 + pw.y * 0.3));
  float towG = (1.0 - smoothstep(6.0, 34.0, abs(hx * 0.22 + sm))) * smoothstep(21.0, 30.0, hyS) * (1.0 - smoothstep(92.0, 126.0, hyS)) * front;
  float bf = fract((hyS - 24.0) / 10.0);
  vec3 towC = mix(vec3(0.14, 0.12, 0.13) * lit, vec3(0.88, 0.60, 0.25) * (uSky + uSunCol * 1.05) + vec3(1.0, 0.56, 0.2) * uLamp * 0.6, smoothstep(0.0, 0.25, bf) * (1.0 - smoothstep(0.45, 0.75, bf)));
  moatC = mix(moatC, towC, towG * uTowK * (0.3 + 0.7 * (vn(rp * 0.37 + 3.0) * 0.6 + stk * 0.4)));
  // rafts of crust drifting down the wind, and two pale shoals left of the causeway
  float raft = smoothstep(0.55, 0.9, vn(vec2(pw.x * 0.30, (pw.y + uTime * 2.2) * 0.028))) * smoothstep(0.3, 0.8, vn(vec2(pw.x * 1.8, (pw.y + uTime * 2.2) * 0.22)));
  moatC = mix(moatC, vec3(0.80, 0.78, 0.74) * lit * (0.8 + 0.2 * n2), raft * 0.3 * (0.35 + 0.65 * near));
  float s1 = length((p - vec2(-27.0, -140.0)) / vec2(12.0, 7.0)) + (vn(p * 0.21) - 0.5) * 0.5;
  float s2 = length((p - vec2(-29.0, -222.0)) / vec2(13.0, 6.5)) + (vn(p * 0.21 + 9.0) - 0.5) * 0.5;
  float sd = min(s1, s2);
  vec3 shoalC = mix(vec3(0.44, 0.38, 0.31), vec3(0.78, 0.76, 0.72), smoothstep(0.72, 0.96, sd) + 0.25 * n2 * n2) * lit * 0.8;
  moatC = mix(moatC, shoalC, 1.0 - smoothstep(0.92, 1.06, sd));
  water = mix(water, moatC, mo);
  // harvest: a third of the pans stand dry, crusted white and raked into ridges with little heaps along them
  float hv = uHarvest * step(h21(gid + 17.3), 0.33) * (1.0 - along) * (1.0 - open);
  // each pan raked its own way (along it or across it), at its own pitch, the lines wandering and breaking off, the rake
  // lifted between strips; lines too fine for a pixel melt into the crust's own tone
  float hd = step(0.5, fract(h * 7.3)), pitch = 3.6 + 1.6 * fract(h * 3.7);
  vec2 rq = mix(p, p.yx, hd);
  float rph = rq.x * pitch + sin(rq.y * 0.21 + h * 9.0) * 1.3 + (vn(p * 0.12 + h * 31.0) - 0.5) * 1.2;
  float rkK = 1.0 - smoothstep(0.9, 2.4, fwidth(rph));
  float brokeN = vn(p * 0.35 + h * 5.0);
  float strip = smoothstep(0.03, 0.10, abs(fract(rq.y / (9.0 + 6.0 * fract(h * 5.1)) + h) - 0.5));
  float rs = 0.5 + 0.5 * sin(rph); rs = rs * rs * (3.0 - 2.0 * rs);                                           // crests sharper than the furrows are wide
  float tine = (0.5 + 0.5 * sin(rph * 6.0 + brokeN * 9.0)) * (1.0 - smoothstep(0.15, 0.4, fwidth(rph)));      // the rake's own teeth, close to
  float rk = mix(0.42, (rs * (0.82 + 0.18 * tine) + 0.08 * tine) * (0.75 + 0.25 * brokeN) * (0.45 + 0.55 * strip), rkK);
  float heaps = smoothstep(0.55, 0.9, vn(vec2(p.x * 0.6, p.y * 0.6))) * step(0.5, fract(rq.x / 7.0 + h));
  float near2 = 1.0 - smoothstep(150.0, 600.0, dist);
  vec3 crustBed = vec3(0.80, 0.74, 0.62) * (uSky * 1.1 + uSunCol * (uSun.y / (0.4 + 1.9 * uSun.y)) * (0.85 + 1.0 * rk * near2 + 1.0 * heaps * near)) * (0.9 + 0.1 * n2);
  crustBed *= mix(vec3(1.0), tint * 2.2 + 0.25, 0.5);                                                       // the crust keeps a blush of its brine: rose-white, mint-white
  crustBed *= mix(vec3(1.0), mix(uShadowCol * 2.0 + 0.25, vec3(1.0), rk), 0.26 * near2);                     // lilac in the furrows
  crustBed *= 0.86 + 0.24 * vn(p * 0.07 + h * 13.0);                                                          // damp and dry patches
  crustBed *= mix(vec3(1.0), vec3(1.04, 0.98, 0.88), smoothstep(0.3, 0.6, uSun.y));                           // warm under a high sun
  water = mix(water, crustBed, hv);
  // dyke shadows on the brine to the east and north of every bank
  float sh = (1.0 - open) * max((1.0 - smoothstep(5.0, 6.5, (1.0 - f.x) * 64.0)) * step(1.5, (1.0 - f.x) * 64.0), (1.0 - smoothstep(2.6, 3.6, f.y * 44.0)) * step(1.5, f.y * 44.0));
  water = mix(water, water * uShadowCol * 2.0, 0.5 * sh * uSun.y / max(uSun.y, 0.26));
  // crust, seepweed and earth
  float foam = smoothstep(0.55, 0.9, vn(pw * 1.3 + vec2(0.0, uTime * 0.6))) * near;
  vec3 crustC = vec3(0.78, 0.76, 0.72) * lit * (0.86 + 0.14 * n2 + 0.1 * foam);
  float weed = smoothstep(0.45, 0.7, vn(p * 0.22 + 3.0)) * smoothstep(0.5, 1.4, e);
  vec3 earth = mix(vec3(0.36, 0.26, 0.15), vec3(0.50, 0.40, 0.25), vn(p * 0.8)) * (0.85 + 0.3 * vn(p * 3.1));
  earth = mix(earth, mix(vec3(0.40, 0.09, 0.12), vec3(0.62, 0.08, 0.10), uWeed), weed * 0.8);
  // close under the eye a bank is trodden earth: grit and pebbles, a paler worn line along its crown, salt in the hollows
  earth *= 1.0 + nearC * ((vn(p * 9.0) - 0.5) * 0.5 + (vn(p * 27.0) - 0.5) * 0.4);
  earth = mix(earth, vec3(0.60, 0.50, 0.36), 0.5 * nearC * (1.0 - smoothstep(0.25, 0.7, e + wob * 0.5)) * (0.5 + 0.5 * vn(p * vec2(2.0, 0.6))));
  earth = mix(earth, vec3(0.72, 0.70, 0.66), nearC * smoothstep(0.7, 0.86, vn(p * 5.3 + 2.0) * 0.6 + vn(p * 14.0) * 0.4) * 0.7);
  vec3 col = mix(water, crustC, crust * (0.75 + 0.25 * n1));
  float wb = uWeed * (1.0 - smoothstep(3.0, 4.8 + wob * 3.0, e)) * smoothstep(1.3, 2.0, e) * (0.5 + 0.5 * vn(p * 0.8 + 5.0)) * (1.0 - open);
  col = mix(col, vec3(0.50, 0.06, 0.10) * lit * (0.7 + 0.5 * vn(p * 4.0)), wb * 0.62);
  col = mix(col, earth * lit, dyke);
  // cloud shadows racing down the wind
  vec2 cwp = vec2(pw.x, pw.y + uTime * 18.0) * uCloudE.w;
  float cs = smoothstep(uCloudE.x, uCloudE.y, vn(cwp * 0.0042) * 0.7 + vn(cwp * 0.011) * 0.3 + (vn(cwp * 0.034) - 0.5) * uCloudE.z);
  col = mix(col, col * uShadowCol * 2.4, uCloudK * cs);
  // the Yellow Sea beyond the seawall: a silver strip that the haze only half takes
  float sea = smoothstep(4.0, 10.0, dot(p - vec2(-900.0, 420.0), vec2(-0.918, -0.396)));
  vec3 seaC = (uHor * 0.75 + uZen * 0.45) * 1.35 + uSunCol * smoothstep(0.6, 0.9, vn(vec2(pw.x * 0.06, pw.y * 0.5 + uTime * 0.8))) * 0.9;
  col = mix(col, seaC, sea);
  float fog = 1.0 - exp(-uFogDens * uFogDens * dist * dist);
  // the pagoda's shadow, worked out here so that it is one layer deep: the base, the core, nine still eaves and between
  // them the sails of each ring sliding through, alternate rings the other way
  float sunH = max(length(uSun.xz), 1e-3); vec2 sd2 = uSun.xz / sunH; vec2 tp = p - vec2(0.0, -305.0);
  float sa = -dot(tp, sd2), sl = dot(tp, vec2(-sd2.y, sd2.x)), asl = abs(sl), ty = sa * uSun.y / sunH, pen = 0.7 + max(sa, 0.0) * 0.012;
  float kf = clamp((ty - 24.0) / 10.0, 0.0, 8.999), kk = floor(kf), fr = fract(kf), Rk = 17.0 - kk;
  float coreS = 1.0 - smoothstep(-pen, pen, asl - (8.0 - 0.043 * (ty - 24.0)));
  float eaveS = (1.0 - smoothstep(-pen, pen, asl - (Rk + 2.6))) * smoothstep(0.78, 0.86, fr);
  float th = acos(clamp(sl / (Rk + 1.5), -1.0, 1.0));
  float ph = kk * 1.37 + (mod(kk, 2.0) < 0.5 ? 1.0 : -1.0) * 6.2832 / (16.0 - 0.875 * kk) * uTime;
  float sailS = (1.0 - smoothstep(-pen, pen, asl - (Rk + 1.5))) * smoothstep(-0.2, 0.5, max(cos(8.0 * (th - ph)), cos(8.0 * (-th - ph)))) * 0.8 * smoothstep(0.02, 0.1, fr);
  float tsh = max(coreS, max(eaveS, sailS)) * step(23.5, ty) * (1.0 - smoothstep(113.0, 115.0, ty));
  tsh = max(tsh, (1.0 - smoothstep(-pen, pen, asl - 1.3)) * step(113.0, ty) * (1.0 - smoothstep(124.0, 127.0, ty)));
  float bLen = 22.0 * abs(sd2.x) + 15.0 * abs(sd2.y) + 23.5 * sunH / max(uSun.y, 0.05);
  tsh = max(tsh, (1.0 - smoothstep(-pen, pen, asl - (22.0 * abs(sd2.y) + 15.0 * abs(sd2.x)))) * (1.0 - smoothstep(-2.0 * pen, 2.0 * pen, sa - bLen)));
  col *= mix(vec3(1.0), uShadowCol * 1.6, uShK * tsh * step(0.0, sa) * (1.0 - fog));
  // (far off the plain goes into a haze a shade deeper and bluer than the sky's rim, so the horizon stays a drawn line)
  col = mix(col, mix(uFogCol, uFogCol * vec3(0.80, 0.85, 1.0), 0.7 * smoothstep(300.0, 1400.0, dist) * (1.0 - sea)), fog * (1.0 - 0.45 * sea));
  float mirror = (1.0 - smoothstep(-8.0, -2.0, dm)) * (1.0 - smoothstep(260.0, 520.0, dist)) * (1.0 - 0.6 * band) * smoothstep(-282.0, -268.0, p.y);
  mirror *= smoothstep(1.06, 1.3, sd) * (1.0 - 0.8 * raft);
  gl_FragColor = vec4(col, 1.0 - 0.9 * mirror * max(wallM * 0.5, towM) * (0.82 + 0.18 * n1));
}`;

const CLOUD_FN = /* glsl */`
uniform float uTime, uCloudK; uniform vec2 uWind; uniform vec3 uShadowCol, uSun; uniform vec4 uCloudE;
vec3 cloudShade(vec3 w) {
  vec2 cq = w.xz - uSun.xz * (max(w.y, 0.0) / max(uSun.y, 0.2));
  vec2 cw = vec2(-cq.x * uWind.y + cq.y * uWind.x, -cq.x * uWind.x - cq.y * uWind.y + uTime * 18.0) * uCloudE.w;
  float cs = smoothstep(uCloudE.x, uCloudE.y, rvn(cw * 0.0042) * 0.7 + rvn(cw * 0.011) * 0.3 + (rvn(cw * 0.034) - 0.5) * uCloudE.z);
  return mix(vec3(1.0), uShadowCol * 2.4, uCloudK * cs);
}`;
const ROAD_FN = /* glsl */`
varying vec3 vRW;
float rh21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float rvn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(rh21(i), rh21(i + vec2(1.0, 0.0)), f.x), mix(rh21(i + vec2(0.0, 1.0)), rh21(i + vec2(1.0, 1.0)), f.x), f.y); }`;
const ROAD_FS = /* glsl */`
{
  float lat = (vColor.x - 0.5) * 12.0, slope = vColor.z;
  float n1 = rvn(vRW.xz * 3.1), n2 = rvn(vRW.xz * 0.31 + 7.0), n3 = rvn(vRW.xz * vec2(11.0, 0.9));
  float rd = length(cameraPosition - vRW), rnear = 1.0 - smoothstep(30.0, 110.0, rd), rclose = 1.0 - smoothstep(7.0, 26.0, rd);
  vec3 rc;
  if (vColor.y > 0.5) {
    vec2 q = slope > 0.3 ? vec2(vRW.y * 0.7 + vRW.x, vRW.z * 0.5) : vRW.xz;
    vec2 sp = q / (slope > 0.3 ? vec2(1.05, 0.56) : vec2(0.42, 0.24));
    vec2 fw = fwidth(sp);
    sp.x += 0.5 * floor(sp.y);
    vec2 cell = floor(sp), f = fract(sp), e = min(f, 1.0 - f);
    float hj = rh21(cell);
    float joint = smoothstep(0.0, 0.06 + fw.x, e.x) * smoothstep(0.0, 0.09 + fw.y, e.y);
    float aa = clamp(1.0 - max(fw.x, fw.y) * 0.8, 0.0, 1.0);
    rc = vec3(0.30, 0.285, 0.26) * (0.8 + 0.2 * n2) * (1.0 + (hj - 0.5) * 0.5 * aa);
    rc *= mix(1.0, mix(0.42, 1.0, joint), aa);
    rc *= 1.0 + rclose * (rvn(vRW.xz * 31.0) - 0.5) * 0.35;
    float ax = abs(lat) - 0.72; rc *= 1.0 + 0.22 * exp(-ax * ax * 9.0) * (0.5 + 0.5 * n3);
    rc = mix(rc, vec3(0.70, 0.67, 0.61), 0.5 * smoothstep(0.58, 0.82, n2 * 0.55 + n1 * 0.45) * (1.0 - step(0.3, slope)));
    rc *= 1.0 + 0.75 * slope;                                             // the walls and kerbs are paler dressed stone
  } else {
    rc = mix(vec3(0.33, 0.20, 0.09), vec3(0.47, 0.32, 0.16), n2) * (0.82 + 0.3 * n1 * rnear + 0.15 * (1.0 - rnear));
    float ar = (abs(lat) - 0.78) / 0.24; float rut = exp(-ar * ar);
    rc *= 1.0 - 0.45 * rut * (0.55 + 0.45 * n3);
    rc = mix(rc, vec3(0.56, 0.42, 0.24), 0.55 * exp(-lat * lat * 6.0) * (0.6 + 0.4 * n1));
    rc *= 0.9 + 0.2 * rvn(vRW.xz * vec2(23.0, 2.5)) * rnear;
    // close to the wheel: pebbles, grit and damp in the ruts
    float peb = rvn(vRW.xz * 40.0), peb2 = rvn(vRW.xz * 13.0 + 3.0);
    rc *= 1.0 + rclose * ((peb - 0.5) * 0.55 + (peb2 - 0.5) * 0.35);
    rc = mix(rc, vec3(0.66, 0.61, 0.52), rclose * smoothstep(0.74, 0.86, peb2 * 0.65 + peb * 0.35) * 0.7);
    rc = mix(rc, rc * 0.5 + vec3(0.07, 0.085, 0.12), rut * (0.35 + 0.65 * rclose) * smoothstep(0.42, 0.7, n2) * 0.75);
    float hard = step(0.2, vColor.y);
    float sc = max(smoothstep(0.3, 0.85, slope + (n1 - 0.5) * 0.5) * (1.0 - hard), smoothstep(1.15, 1.7, abs(lat)) * smoothstep(0.45, 0.75, n2 * 0.5 + n1 * 0.5) * 0.8);
    rc = mix(rc, vec3(0.74, 0.71, 0.65) * (0.9 + 0.1 * n3), sc * 0.9);
    if (hard > 0.5) {
      // the salt hard: trampled earth under a thin swept crust, cart ruts and barrow lines worn through it
      float hm = rvn(vRW.xz * 0.9) * 0.6 + rvn(vRW.xz * 4.0) * 0.4;
      vec3 hc = mix(vec3(0.44, 0.33, 0.20), vec3(0.56, 0.47, 0.34), n2) * (0.9 + 0.2 * rvn(vRW.xz * 9.0) * rnear);
      hc = mix(hc, vec3(0.72, 0.69, 0.63) * (0.92 + 0.12 * rvn(vRW.xz * vec2(2.0, 14.0))), smoothstep(0.42, 0.72, hm) * 0.7);
      float t1 = abs(fract((vRW.x + 1.4 * sin(vRW.z * 0.11)) / 4.6) - 0.5) * 4.6;
      float rutH = (1.0 - smoothstep(0.08, 0.26, abs(t1 - 0.62))) * smoothstep(0.3, 0.6, rvn(vec2(vRW.x * 0.3, vRW.z * 0.07)));
      float t2 = abs(fract((vRW.z * 0.8 + vRW.x * 0.6 + sin(vRW.x * 0.2) * 1.2) / 7.0) - 0.5) * 7.0;
      float rutB = (1.0 - smoothstep(0.05, 0.16, t2)) * smoothstep(0.35, 0.6, rvn(vRW.xz * 0.11 + 5.0));
      hc = mix(hc, vec3(0.30, 0.24, 0.17) * (0.8 + 0.4 * n3), max(rutH, rutB) * 0.6);
      hc *= 1.0 + rclose * (rvn(vRW.xz * 40.0) - 0.5) * 0.4;
      rc = hc;
    }
  }
  // the two great cones on the hard lay long shadows over it and over the track
  vec2 sdr = uSun.xz / max(length(uSun.xz), 1e-3); float sln = max(8.0 * length(uSun.xz) / max(uSun.y, 0.08), 1e-3);
  vec2 q1 = vRW.xz - vec2(-13.0, 182.0), q2 = vRW.xz - vec2(15.0, 158.0);
  float a1 = -dot(q1, sdr), a2 = -dot(q2, sdr);
  float c1 = step(0.0, a1) * (1.0 - smoothstep(-0.5, 0.5, abs(q1.x * sdr.y - q1.y * sdr.x) - 5.6 * (1.0 - clamp(a1 / sln, 0.0, 1.0)))) * (1.0 - smoothstep(0.9, 1.0, a1 / sln));
  float c2 = step(0.0, a2) * (1.0 - smoothstep(-0.5, 0.5, abs(q2.x * sdr.y - q2.y * sdr.x) - 5.6 * (1.0 - clamp(a2 / sln, 0.0, 1.0)))) * (1.0 - smoothstep(0.9, 1.0, a2 / sln));
  rc = mix(rc, rc * uShadowCol * 2.2, 0.46 * max(c1, c2) * step(vRW.y, 1.75) * step(140.0, vRW.z));
  diffuseColor.rgb = rc * cloudShade(vRW);
}
`;

// the cloud field's noise sheet (the kit's own recipe), built here in two halves so the build can yield between them
async function cloudNoise(rng, ctx, size = 256) {
  await ctx.yield();
  const N = size * size, f = [new Float32Array(N), new Float32Array(N)];
  const ix0 = new Int32Array(size), ix1 = new Int32Array(size), wx = new Float32Array(size);
  for (let ch = 0; ch < 2; ch++) {
    const acc = f[ch];
    for (let o = 0, per = ch ? 16 : 4, amp = 0.5; o < 4; o++, per *= 2, amp *= 0.55) {
      const lat = new Float32Array(per * per); for (let i = 0; i < lat.length; i++) lat[i] = rng();
      for (let x = 0; x < size; x++) { const fx = x / size * per, i = Math.floor(fx), t = fx - i; ix0[x] = i % per; ix1[x] = (i + 1) % per; wx[x] = t * t * (3 - 2 * t); }
      for (let y = 0; y < size; y++) {
        if ((y & 7) === 7) await ctx.yield();
        const r0 = ix0[y] * per, r1 = ix1[y] * per, wy = wx[y];
        for (let x = 0, p = y * size; x < size; x++, p++) {
          const a = lat[r0 + ix0[x]], b = lat[r0 + ix1[x]], c = lat[r1 + ix0[x]], d = lat[r1 + ix1[x]], w = wx[x];
          acc[p] += amp * (a + (b - a) * w + (c + (d - c) * w - a - (b - a) * w) * wy);
        }
      }
      await ctx.yield();
    }
  }
  const norm = 0.5 * (1 + 0.55 + 0.55 ** 2 + 0.55 ** 3), data = new Uint8Array(N * 4), m = size - 1;
  const px = (v) => Math.max(0, Math.min(255, ((v / norm - 0.5) * 1.75 + 0.5) * 255));
  await ctx.yield();
  for (let y = 0; y < size; y++) {
    if ((y & 7) === 7) await ctx.yield();
    for (let x = 0; x < size; x++) {
      const p = y * size + x, s2 = ((y + 89) & m) * size + ((x + 151) & m), s3 = ((y + 33) & m) * size + ((x + 201) & m);
      data[p * 4] = px(f[0][p]); data[p * 4 + 1] = px(f[1][p]); data[p * 4 + 2] = px(f[0][s2]); data[p * 4 + 3] = px(f[0][s3]);
    }
  }
  await ctx.yield();
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  tex.generateMipmaps = true; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  await ctx.yield();
  return tex;
}

// the flight (see the header): entry on the dyke, under the sweep mill, the hard, the hamlet, the climb over the canal, the
// drop down the line of the Great Dyke toward the great mill (out of the east-north-east: the sun stands behind its sails),
// under its south-east rim, the raked jade pan, the moat, the high turn, the causeway
const PATH_PTS = [[0, 4, 290], [0, 4, 268], [4, 4, 250], [13, 3.8, 234], [21, 3.7, 218], [22, 3.7, 204], [16, 3.9, 193], [8, 4, 183], [4.5, 4, 170], [0, 4, 150],
  [-10, 3.9, 134], [-21, 3.7, 118], [-29, 3.6, 100], [-32, 5.5, 78], [-35, 13, 58], [-33, 21, 38], [-29, 23.5, 18], [-23, 21.5, -2], [-18, 14, -20], [-11.5, 8.6, -35], [1, 7.6, -42.5],
  [11, 7.2, -50], [17, 6.6, -60], [22, 5.8, -73], [27, 5, -87], [34, 4.4, -101], [42, 4.1, -115], [48, 4, -127], [51, 4.2, -139], [55, 7, -158], [60, 13, -176], [61, 20, -192], [54, 24, -205], [38, 22, -214], [24, 17.5, -219], [11, 12.2, -225],
  [2.4, 8.7, -232.5], [0, 7.3, -242], [0, 7, -262], [0, 7, -292]];

export default {
  id: 'salt-wind-city',
  name: 'The City That Turns',
  category: 'city',
  weirdness: 0.35,
  media: ['air'],
  // (the page is handed back before any work, so the task that loaded this module ends here; the world itself is made by
  // raise() below, which the engine has read whole with the module instead of at this first call)
  async build(ctx) {
    await ctx.yield();
    return raise(ctx);
  },
};
// THE WORLD: everything build() makes. It is written as a function expression in brackets so that it is compiled along with
// the module and not in the first step of the build; nothing in it runs before build() calls it.
const raise = (async function (ctx) {
    await ctx.yield();
    const rng = ctx.rng, vary = ctx.vary || {}, vr = rng.fork('swc-variant');
    const density = vary.density ?? 1, mood = vary.mood ?? 0.5, detail = ctx.quality?.detail ?? 1;
    const weedDraw = vr.chance(0.3), panSeed = vr.range(0, 40), rare = !!vary.rare;
    // by seed: the hour (unless the viewer asked for one), the year, the cast
    const hp = vr(), look = vr.pick(['brine', 'harvest', 'weed', 'quarter']), geese = vr.chance(0.4), convoy = vr.chance(0.45);
    // everything added in round twelve draws from this stream, forked from one that is finished with: nothing older moves
    const nx = vr.fork('round12');
    // what round seventeen adds draws from streams of its own, each made from the world's seed and a name: no older stream is touched
    const own = (name) => makeRng(hashSeed(name + ':' + ctx.seed));
    // (the golden gale is the brief's own hour: 60 visits in a hundred that ask for none get it; first light and the blue noon are the rarer ones)
    const hour = ['day', 'dawn', 'night', 'golden'].includes(vary.hour) ? vary.hour : hp < 0.6 ? 'golden' : hp < 0.8 ? 'dawn' : 'day';
    const L = LOOKS[hour], night = hour === 'night';
    const weedYear = look === 'weed' || (look === 'brine' && weedDraw) ? 1 : 0, harvest = look === 'harvest' ? 1 : 0;
    const windA = look === 'quarter' ? 35 * Math.PI / 180 : 0;       // the wind backed north-east: it blows toward the south-west
    const WX = Math.sin(windA), WZ = -Math.cos(windA);
    const DUR = 50, tmpV = new THREE.Vector3();
    const scene = new THREE.Scene();
    scene.userData.swc = { hour, look, geese, convoy, rare };

    // ---- sky and light -------------------------------------------------------------------------------------------
    const cloudWind = [WX * 0.06, WZ * 0.06];
    const sky = night
      ? makeSky({ rng, preset: 'night', zenith: L.zenith, mid: L.mid, horizon: L.horizon, fogColor: L.fog,
        bodies: [{ elevation: 48, azimuth: 58, size: 2.6, phase: 0.96, intensity: 1.0, dark: 0.03, glow: 0.22, glowColor: '#9db8ff' }],
        lightColor: L.sunColor, lightIntensity: L.key, ambientColor: L.skyAmb, groundLight: L.groundAmb, ambientIntensity: L.amb,
        clouds: { coverage: 0.3, wind: cloudWind, lit: L.cloudLit, shade: L.cloudShade, scale: 1.3, detail: 0.7 } })
      : makeSky({ rng, preset: hour === 'day' ? 'day' : 'goldenHour', sunDirection: new THREE.Vector3(...L.sun).normalize(), zenith: L.zenith, mid: L.mid, horizon: L.horizon,
        sunColor: L.sunColor, sunGlow: hour === 'day' ? 0.4 : 0.6, lightColor: L.sunColor, lightIntensity: L.key, ambientColor: L.skyAmb, groundLight: L.groundAmb, ambientIntensity: L.amb, fogColor: L.fog,
        clouds: { coverage: 0.35, wind: cloudWind, lit: L.cloudLit, shade: L.cloudShade, scale: 1.3, detail: 0.7 },
        clouds2: { coverage: 0.35, stretch: 1, wind: [WX * 0.012, WZ * 0.012], opacity: 0.3 } });
    scene.add(sky.object);
    const sunDir = night ? sky.lightDirection.clone().normalize() : new THREE.Vector3(...L.sun).normalize();
    scene.fog = new THREE.FogExp2(H(L.fog), L.dens);
    await ctx.yield();
    const rig = makeLightRig(sky, { bounce: 0.4, ambient: 1.5 }); scene.add(rig.object);
    await ctx.yield();
    // six low cumulus beyond the town, lit by this sky, drifting slowly down the wind
    const cuRng = rng.fork('cumulus'), cuNoise = await cloudNoise(cuRng.fork('noise'), ctx);
    const cumulus = makeCloudField({ rng: cuRng, sky, bottomColor: L.cloudShade, bump: 1.1, fogFade: hour === 'golden' || hour === 'dawn' ? 0.2 : 0.35, opacity: hour === 'golden' || hour === 'dawn' ? 0.64 : 0.72, wind: [WX * 3, 0, WZ * 3], noiseTexture: cuNoise,
      at: [[-560, 250, -900, 330], [640, 265, -1050, 400], [-1000, 255, -380, 320], [960, 250, -560, 360], [-760, 290, -1500, 440], [-250, 300, 520, 330]] });
    scene.add(cumulus.object);
    await ctx.yield();

    const shared = makeSailUniforms();
    shared.uSun.value.copy(sunDir); shared.uDur.value = DUR; shared.uGale.value = 0.85 + 0.3 * mood; shared.uWind.value.set(WX, WZ);
    shared.uSunCol.value.copy(H(L.sunColor)).multiplyScalar(L.key / Math.PI);
    shared.uSky.value.copy(H(L.skyAmb)).multiplyScalar(L.amb / Math.PI * 1.25);
    shared.uGround.value.copy(H(L.groundAmb)).multiplyScalar(L.amb / Math.PI * 1.25);
    shared.uFogCol.value.copy(H(L.fog)); shared.uFogDens.value = L.dens; shared.uStraw.value.copy(H('#E8C078')).multiplyScalar(L.straw);
    shared.uHard.value = L.hard ?? 0; shared.uSide.value = L.side ?? (night ? 0.2 : 0.3); if (L.cloudE) shared.uCloudE.value.set(...L.cloudE);
    shared.uLamp.value = L.lamp; shared.uCloudK.value = L.cloudK; shared.uSeed.value = panSeed; shared.uHarvest.value = harvest;
    if (night) shared.uShadowCol.value.copy(H('#56608c'));
    if (hour === 'day') shared.uShadowCol.value.copy(H('#34437e'));  // under a clear blue sky the shade is bluer
    const T = shared.uTime;

    // ---- the ride ------------------------------------------------------------------------------------------------
    // road: the ground route (the Great Dyke, the bridge, the causeway), which everything on the ground is laid out along.
    // path: what the camera flies. We ride the road as far as the bridge crest; there the gust lifts the bicycle off the setts
    // and carries it west of the dyke: low under the rim of the great mill by the hamlet, south over the raked pans and out
    // over the moat past a mill and a junk, up and round to the north-west of the tower for the whole of it, and down onto
    // the causeway for the gate.
    await ctx.yield();
    const road = makePath([[0, 4, 290], [0, 4, 248], [0, 4, 206], [4.5, 4, 172], [0, 4, 146], [-7, 4, 104], [-12, 4.2, 72], [-13.6, 7.6, 52], [-14, 9.2, 36], [-14, 7.6, 20], [-14, 4.2, 0],
      [-18, 4, -40], [-9, 4, -74], [0, 4, -98], [0, 5.5, -144], [0, 7, -190], [0, 7, -240], [0, 7, -292]]);
    await ctx.yield();
    const path = makePath(PATH_PTS);
    await ctx.yield();
    // where things happen along the flight: the bridge crest (uC), the gust passing us just beyond it (U0), wheels down on the causeway (uL)
    // (uC: where we cross the canal beside the bridge, climbing. U0: when the gust front crosses the canal behind us; it
    // overtakes us at the foot of the dive, as we come under the great mill, so the quilt is still a mirror from the top)
    const uC = path.nearestXZ(-33, 36).u, U0 = path.nearestXZ(24, -52).u - 0.066, uL = path.nearestXZ(0.5, -238).u, uDuck = path.nearestXZ(-16, 126).u;
    // the sweep mill we fly under, the hard (wheels down at uH0, off again at uH1), the hamlet, the top of the climb, the
    // great mill at the foot of the dive, the junks, the top of the last turn
    const uSweep = path.nearestXZ(22, 211).u, uH0 = path.nearestXZ(16, 193).u, uH1 = path.nearestXZ(0, 149).u, uHam = path.nearestXZ(-29, 100).u, uTop = path.nearestXZ(-29, 18).u,
      uMillA = path.nearestXZ(24, -52).u, uJunk = path.nearestXZ(50, -132).u, uHigh = path.nearestXZ(54, -205).u;
    shared.uGust0.value = U0;
    // THE FLIGHT, WALKED ONCE IN TWO-METRE STEPS (the eye's x, y, z). Every rule that places a thing by the flight asks this
    // walk, for the whole of the route from the arrival to the gate: the working clutter (within 45 m of where the eye is
    // low), the mills (none close under where the eye is high), the boats' berths (a clear distance all the way).
    const RTN = Math.ceil(path.length / 2), rtX = new Float32Array(RTN + 1), rtY = new Float32Array(RTN + 1), rtZ = new Float32Array(RTN + 1);
    for (let i = 0; i <= RTN; i++) { path.pointAt(i / RTN, tmpV); rtX[i] = tmpV.x; rtY[i] = tmpV.y; rtZ[i] = tmpV.z; }
    // how near the flight comes to (x, z) on the level, counting only the stretches where the eye is between yLo and yHi
    const flightDist = (x, z, yLo = -1e9, yHi = 1e9) => {
      let b = 1e12;
      for (let i = 0; i <= RTN; i++) { if (rtY[i] < yLo || rtY[i] > yHi) continue; const dx = rtX[i] - x, dz = rtZ[i] - z, d = dx * dx + dz * dz; if (d < b) b = d; }
      return Math.sqrt(b);
    };
    // the bean geese cross high over us as the eye passes the cart on the hard
    const uGoose = path.nearestXZ(-5.2, 170).u;
    // the camera's x at a given z while it runs south over the first dyke (z 300 down to 60): what must be kept clear of it
    const cxT = new Float32Array(241);
    { let j = 0; const q = new THREE.Vector3(); for (let i = 0; i <= 240; i++) { const z = 300 - i; while (j < 1200 && path.pointAt(j / 1200, q).z > z) j++; cxT[i] = q.x; } }
    const camX = (z) => cxT[Math.max(0, Math.min(240, Math.round(300 - z)))];
    await ctx.yield();
    const pxT = new Float32Array(201), pzT = new Float32Array(201);
    for (let i = 0; i <= 200; i++) { const q = road.pointAt(i / 200, tmpV); pxT[i] = q.x; pzT[i] = q.z; }
    const pathX = (z) => { let best = 0, bd = 1e9; for (let i = 0; i <= 200; i++) { const d = Math.abs(pzT[i] - z); if (d < bd) { bd = d; best = pxT[i]; } } return best; };
    const CANAL_Z = 36, bridgeX = pathX(CANAL_Z), bridgePosts = [];                   // the canal's line, and where the humpback bridge crosses it
    shared.uBridge.value.set(bridgeX, CANAL_Z, 12);
    // NOTHING TALLER THAN A METRE STANDS SO NEAR THE FLIGHT THAT THE EYE LOOKS DOWN ITS FOOT OR UP PAST ITS HEAD: a thing whose
    // foot is at `base` and whose head is at `top` keeps, from every two-metre step of the walked flight, a level distance of
    // 6.5 m and of 1.54 times the eye's height above its foot and of 1.54 times its head's height above the eye (1.54 is one
    // over the tangent of half the field of view: at that distance a level look holds it from foot to head)
    const clearOfEye = (x, z, base, top) => {
      for (let i = 0; i <= RTN; i++) { const dx = rtX[i] - x, dz = rtZ[i] - z, need = Math.max(6.5, (rtY[i] - base) * 1.54, (top - rtY[i]) * 1.54); if (dx * dx + dz * dz < need * need) return false; }
      return true;
    };
    // A THING THE FLIGHT PASSES OVER MAY STAND UNDER IT: a mast, a pole or a rig whose head is at `top` may stand at (x, z)
    // if every two-metre step of the walked flight is either 5 m or more higher than its head, or further off on the level
    // than 6.5 m and than 1.54 times its head's height above the eye there. (No foot term: the eye that tops a thing by
    // five metres looks down on it whole, or it passes under the eye whatever stands on it.) `reach` is how far a thing
    // streams from its head on the level (a long pennant): that much is added to the distance it must keep.
    const passOver = (x, z, top, reach = 0) => {
      for (let i = 0; i <= RTN; i++) { if (rtY[i] - top >= 5) continue; const dx = rtX[i] - x, dz = rtZ[i] - z, need = Math.max(6.5, (top - rtY[i]) * 1.54) + reach; if (dx * dx + dz * dz < need * need) return false; }
      return true;
    };
    await ctx.yield();

    // ---- the brine quilt: one sheet, every pan drawn in the shader ----------------------------------------------------
    const panU = { uTime: T, uFrontZ: { value: 1000 }, uFogDens: shared.uFogDens, uSeed: { value: panSeed }, uWeed: { value: weedYear }, uPan: { value: L.pan }, uHarvest: { value: harvest }, uLamp: shared.uLamp, uTowK: { value: L.tow }, uShK: { value: L.shadow }, uCloudK: shared.uCloudK, uCloudE: shared.uCloudE,
      uSun: shared.uSun, uSunCol: shared.uSunCol, uSky: shared.uSky, uGround: shared.uGround, uZen: { value: night ? H('#1c2c58') : sky.zenithColor.clone().lerp(H(L.mid), 0.35) }, uWind: shared.uWind,
      uHor: { value: night ? H('#62769f') : H(L.horizon).lerp(H(L.mid), 0.35) }, uFogCol: shared.uFogCol, uShadowCol: shared.uShadowCol };
    const panMat = new THREE.ShaderMaterial({ uniforms: panU, vertexShader: PAN_VS, fragmentShader: PAN_FS, transparent: true });
    const pans = new THREE.Mesh(new THREE.PlaneGeometry(5200, 5200, 1, 1).rotateX(-Math.PI / 2), panMat);
    pans.position.set(0, 0, -100); pans.renderOrder = 1; pans.frustumCulled = false; scene.add(pans);
    const under = new THREE.Mesh(new THREE.BoxGeometry(1500, 300, 1500), new THREE.MeshBasicMaterial({ color: H(L.mid).lerp(H(L.horizon), 0.4), fog: false, side: THREE.BackSide }));
    under.position.set(0, -151, -215); under.frustumCulled = false; scene.add(under);
    await ctx.yield();

    // ---- dyke, bridge, causeway, hard, hamlets: one merged static mesh --------------------------------------------------
    const g = new GB();
    const earth = H('#a8875c'), sett2 = H('#7c7973'), salt = H('#F3EFE6').multiplyScalar(0.8), saltSh = H('#cfc6b6').multiplyScalar(0.8), saltRake = H('#d3c8b0').multiplyScalar(0.8);
    const orangeC = H('#EE6A1C');
    const salt2 = salt.clone().multiplyScalar(0.94);
    // round things, for what stands near the eye: a persimmon (a squat ball of three rings, r its radius, n its sides) and a jar
    // with a belly and a lip (s its height)
    const FRUIT_P = [[0.05, -0.7], [0.95, -0.2], [0.8, 0.38], [0.05, 0.62]];
    const ball = (gb, x, y, z, r, n, col, top = col) => { for (let k = 0; k < 3; k++) gb.prism(n, FRUIT_P[k][0] * r, FRUIT_P[k + 1][0] * r, y + FRUIT_P[k][1] * r, y + FRUIT_P[k + 1][1] * r, k === 2 ? top : col, x, z, false, k * 0.3); };
    const JAR_P = [[0.30, 0], [0.47, 0.22], [0.55, 0.5], [0.47, 0.78], [0.30, 0.96], [0.36, 1.06], [0.05, 1.02]];
    const roundJar = (gb, x, z, y, s, col) => { for (let k = 0; k < 6; k++) gb.prism(10, JAR_P[k][0] * s, JAR_P[k + 1][0] * s, y + JAR_P[k][1] * s, y + JAR_P[k + 1][1] * s, k === 5 ? col.clone().multiplyScalar(0.55) : k % 2 ? col : col.clone().multiplyScalar(0.9), x, z, false, k * 0.2); };
    const lime = H('#F3EFE6').multiplyScalar(0.66), limeFoot = H('#aaa59b'), tile = H('#33373c'), plank = H('#5a4530'), matC = H('#b8965c'), jar = H('#6b4a32');
    {
      const M = 300, P = [], S = [], rp = [], rn = [], rc = [];
      const rq = (a, b, c, d) => {                                   // a road quad; each corner is [x, y, z, lateral m, stone, slope]
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
        const o = ny < 0 ? [a, d, c, a, c, b] : [a, b, c, a, c, d], sg = ny < 0 ? -1 : 1;
        for (const v of o) { rp.push(v[0], v[1], v[2]); rn.push(sg * nx / l, sg * ny / l, sg * nz / l); rc.push(v[3] / 12 + 0.5, v[4], v[5]); }
      };
      for (let i = 0; i <= M; i++) { const q = road.pointAt(i / M, new THREE.Vector3()), t = road.tangentAt(i / M, new THREE.Vector3()); t.y = 0; t.normalize(); P.push(q); S.push([-t.z, t.x]); }
      const sec = (z, yd) => {
        if (z <= -98) { const a = ((-98 - z) / 17.6) % 1; return { half: 1.7, out: 1.72, yb: z < -272 ? 0 : Math.max(0, (yd - 1.0) * Math.sin(Math.PI * a) ** 0.6), stone: 1 }; }
        if (z < 70 && z > 2) { const k = (z - 36) / 12; return { half: 2.5, out: 2.52, yb: Math.abs(k) < 1 ? Math.min(yd - 0.8, 0.2 + 5.2 * Math.sqrt(1 - k * k)) : 0, stone: 1 }; }
        return { half: 1.7, out: 4.9, yb: 0, stone: 0 };
      };
      for (let i = 0; i < M; i++) {
        if (i % 10 === 9) await ctx.yield();
        const A = P[i], B = P[i + 1], ya = A.y - 2.4, yb = B.y - 2.4, sa = sec(A.z, ya), sb = sec(B.z, yb);
        const st = sa.stone;
        const pa = (lat, y, sl = 0) => [A.x + S[i][0] * lat, y, A.z + S[i][1] * lat, lat, st, sl], pb = (lat, y, sl = 0) => [B.x + S[i + 1][0] * lat, y, B.z + S[i + 1][1] * lat, lat, st, sl];
        const la = [-sa.out, -sa.half, -0.6, 0.6, sa.half, sa.out], lb = [-sb.out, -sb.half, -0.6, 0.6, sb.half, sb.out];
        const yA = [sa.yb, ya, ya, ya, ya, sa.yb], yB = [sb.yb, yb, yb, yb, yb, sb.yb], sl = [1, 0, 0, 0, 0, 1];
        for (let j = 0; j < 5; j++) rq(pa(la[j], yA[j], sl[j]), pa(la[j + 1], yA[j + 1], sl[j + 1]), pb(lb[j + 1], yB[j + 1], sl[j + 1]), pb(lb[j], yB[j], sl[j]));
        if (sa.yb > 0.02 || sb.yb > 0.02) rq(pa(-sa.out, sa.yb, 1), pa(sa.out, sa.yb, 1), pb(sb.out, sb.yb, 1), pb(-sb.out, sb.yb, 1));
        if (st) for (const sd of [-1, 1]) {
          rq(pa(sd * sa.half, ya, 0.6), pa(sd * sa.half, ya + 0.5, 0.6), pb(sd * sb.half, yb + 0.5, 0.6), pb(sd * sb.half, yb, 0.6));
          rq(pa(sd * (sa.half + 0.3), ya, 0.6), pa(sd * (sa.half + 0.3), ya + 0.5, 0.6), pb(sd * (sb.half + 0.3), yb + 0.5, 0.6), pb(sd * (sb.half + 0.3), yb, 0.6));
          rq(pa(sd * sa.half, ya + 0.5, 0.5), pa(sd * (sa.half + 0.3), ya + 0.5, 0.5), pb(sd * (sb.half + 0.3), yb + 0.5, 0.5), pb(sd * sb.half, yb + 0.5, 0.5));
        }
      }
      {                                                              // the dyke runs on 70 m behind the entry: the portal's camera stands over it
        const lt = [-4.9, -1.7, -0.6, 0.6, 1.7, 4.9], ly = [0, 1.6, 1.6, 1.6, 1.6, 0], lsl = [1, 0, 0, 0, 0, 1];
        for (let k = 0; k < 7; k++) for (let j = 0; j < 5; j++) { const z0 = 290 + k * 10, z1 = z0 + 10;
          rq([lt[j], ly[j], z0, lt[j], 0, lsl[j]], [lt[j + 1], ly[j + 1], z0, lt[j + 1], 0, lsl[j + 1]], [lt[j + 1], ly[j + 1], z1, lt[j + 1], 0, lsl[j + 1]], [lt[j], ly[j], z1, lt[j], 0, lsl[j]]); }
      }
      rq([-17, 1.545, 150, 4, 0.3, 0.5], [17, 1.545, 150, 4, 0.3, 0.5], [17, 1.545, 190, 4, 0.3, 0.5], [-17, 1.545, 190, 4, 0.3, 0.5]);   // the salt hard: trampled earth and crust
      const rg = new THREE.BufferGeometry();
      rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setAttribute('normal', new THREE.Float32BufferAttribute(rn, 3)); rg.setAttribute('color', new THREE.Float32BufferAttribute(rc, 3));
      const roadMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, side: THREE.DoubleSide });
      roadMat.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRW;').replace('#include <project_vertex>', '#include <project_vertex>\nvRW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + ROAD_FN + CLOUD_FN).replace('#include <color_fragment>', ROAD_FS);
        Object.assign(sh.uniforms, { uTime: T, uCloudK: shared.uCloudK, uWind: shared.uWind, uShadowCol: shared.uShadowCol, uSun: shared.uSun, uCloudE: shared.uCloudE });
      };
      roadMat.customProgramCacheKey = () => 'swc-road';
      const roadMesh = new THREE.Mesh(rg, roadMat); roadMesh.name = 'road'; roadMesh.frustumCulled = false; scene.add(roadMesh);
      g.box(0, 4.3, -298, 3.4, 0.6, 14, sett2);
      // carved post caps on the bridge kerbs and the causeway parapet, none inscribed
      for (let i = 4; i < M; i += 6) {
        const A = P[i], st = sec(A.z, A.y - 2.4);
        if (!st.stone || A.z < -284) continue;
        for (const sd of [-1, 1]) {
          const x = A.x + S[i][0] * sd * (st.half + 0.15), z = A.z + S[i][1] * sd * (st.half + 0.15), y = A.y - 2.4;
          g.box(x, y + 0.45, z, 0.42, 0.9, 0.42, sett2); g.prism(4, 0.32, 0.06, y + 0.9, y + 1.22, H('#96928a'), x, z, false, Math.PI / 4);
          if (A.z < 70 && A.z > 2) bridgePosts.push([x, y, z]);     // (the humpback bridge's own kerb posts, for the staffs set on them later)
        }
      }
    }
    await ctx.yield();
    // the salt hard, its cones and the cart
    const wg = new GB();                                            // window panes
    const tg = new GB();                                            // what the carousel shader textures: lime walls, tiles, planks, raked salt
    const fl = tg;                                                  // streaming cloth (washing, tarpaulin): the same shader, the same mesh
    g.box(0, 0.7, 170, 34, 1.4, 40, H('#b9ac94').multiplyScalar(0.8));
    for (let r = 0; r < 10; r++) for (let q = 0; q < 9; q++) {       // raked windrows
      const x = (r % 2 ? -1 : 1) * (6.2 + Math.floor(r / 2) * 2.4), z = 152.5 + q * 4;
      if (Math.hypot(x + 13, z - 180) < 8 || Math.hypot(x - 15, z - 160) < 8 || Math.hypot(x + 5.2, z - 168) < 4.5 || Math.abs(x - pathX(z + 1.8)) < 3.6 || Math.abs(x - camX(z + 1.8)) < 4.2 || (Math.abs(x - 13.2) < 2.6 && Math.abs(z - 175.7) < 5) || (x > 15 && z > 160)) continue;
      g.quad([x - 0.5, 1.54, z], [x - 0.5, 1.54, z + 3.6], [x, 1.76, z + 3.5], [x, 1.76, z + 0.1], salt2); g.quad([x + 0.5, 1.54, z], [x + 0.5, 1.54, z + 3.6], [x, 1.76, z + 3.5], [x, 1.76, z + 0.1], salt);
    }
    await ctx.yield();
    const saltTones = [salt, salt2, saltRake, salt2, salt];
    const cone = (x, z, y, r, hh, thatch = false, n = 24, rings = 5) => {   // raked in rings, some under mat thatch
      for (let i = 0; i < rings; i++) {
        const t0 = i / rings, t1 = (i + 1) / rings, r0 = r * (1 - t0) ** 0.92, r1 = i === rings - 1 ? 0.06 : r * (1 - t1) ** 0.92;
        const cap = thatch && t0 >= 0.59, k = cap ? 1.07 : 1;
        tg.th = cap ? 6 : 12;
        tg.prism(n, r0 * k + (cap ? 0.12 : 0), r1 * k + (cap ? 0.12 : 0), y + hh * t0, y + hh * t1, cap ? (i % 2 ? matC : matC.clone().multiplyScalar(0.8)) : saltTones[i % 5], x, z, false, i * 0.13);
      }
      tg.th = 12;
      if (rings > 2) tg.prism(n, r * 1.12, r, y, y + 0.12, saltSh, x, z, false);
    };
    cone(-13, 182, 1.5, 5.5, 8, false, 24, 10);
    await ctx.yield();
    cone(15, 158, 1.5, 5.5, 8, true, 24, 10);
    await ctx.yield();
    // the cart: plank body on two spoked wheels, shafts down, a tarpaulin lashed over the load
    g.box(-5.2, 2.55, 170, 1.9, 0.9, 3.6, plank); g.box(-5.2, 3.25, 170, 2.0, 0.55, 3.2, H('#77745f')); g.box(-5.2, 3.6, 170, 1.5, 0.3, 2.6, H('#85826c'));
    for (const sx of [-1, 1]) {
      for (let s = 0; s < 6; s++) { const a = s * Math.PI / 3; g.beam([-5.2 + sx * 1.12, 2.5, 170], [-5.2 + sx * 1.12, 2.5 + Math.sin(a) * 0.95, 170 + Math.cos(a) * 0.95], 0.045, plank); }
      for (let s = 0; s < 12; s++) { const a0 = s * Math.PI / 6, a1 = a0 + Math.PI / 6; g.beam([-5.2 + sx * 1.12, 2.5 + Math.sin(a0) * 0.98, 170 + Math.cos(a0) * 0.98], [-5.2 + sx * 1.12, 2.5 + Math.sin(a1) * 0.98, 170 + Math.cos(a1) * 0.98], 0.06, H('#3a2e22'), 0.07); }
      g.beam([-5.2 + sx * 0.7, 2.3, 171.8], [-5.2 + sx * 0.6, 1.62, 175.2], 0.06, plank);
    }
    fl.pen(-4.3, 3.3, 168.5, 1.5, 0.3, H('#8f8c76'), 0.2, 3); fl.pen(-6.1, 3.3, 168.5, 1.2, 0.26, H('#8f8c76'), 0.2, 3);
    await ctx.yield();
    const hd = rng.fork('hard'), hardSpots = []; let heapTools = 0;   // hardSpots: where these stand, for the clutter rule to sow round
    for (let i = 0; i < 22; i++) {                                   // raked heaps, baskets and plank runs on the hard
      const z = hd.range(152, 188), side = hd.chance(0.5) ? -1 : 1, x = pathX(z) + side * hd.range(5.5, 14), r = hd.range(0.7, 1.7);
      if (Math.hypot(x + 13, z - 182) < 7 || Math.hypot(x - 15, z - 158) < 7 || Math.hypot(x + 5.2, z - 170) < 3 || Math.abs(x - camX(z)) < 4.6 || Math.hypot(x - 12.2, z - 168) < 4.6 || Math.hypot(x - 13.2, z - 177.5) < 4.4 || (x > 14.6 && z > 162)) continue;
      const close = Math.min(Math.abs(x - camX(z)), Math.abs(x - pathX(z))) < 14;
      hardSpots.push([x, z, i % 3 === 0 ? 3.6 : r + 1.3]);
      if (i % 3 === 0) g.box(x, 1.58, z, hd.range(4, 7), 0.08, 0.5, plank, hd.range(0, 3)); else cone(x, z, 1.5, r, r * 1.05, false, close ? 18 : 12, close ? 5 : 2);
      if (i % 3 !== 0 && close && heapTools < 3) {                   // a rake left standing in the heap and a basket beside it
        heapTools++;
        tg.th = 6; tg.beam([x + r * 0.55, 1.56, z + r * 0.5], [x + r * 0.1, 1.5 + r * 1.9, z + r * 0.05], 0.035, plank); tg.box(x + r * 0.62, 1.6, z + r * 0.56, 0.9, 0.07, 0.09, plank, 0.6);
        tg.th = 0; tg.prism(8, 0.4, 0.5, 1.55, 2.1, H('#8a6230'), x - r * 0.9 - 0.5, z + r * 0.4, false); tg.prism(8, 0.48, 0.14, 2.1, 2.4, salt, x - r * 0.9 - 0.5, z + r * 0.4, true);
        tg.th = 12;
      }
      if (i % 4 === 1 && Math.abs(x + 1.6 - pathX(z + 0.8)) > 7.5) { g.prism(8, 0.45, 0.55, 1.54, 2.2, H('#8a6230'), x + 1.6, z + 0.8); g.beam([x + 2.4, 1.56, z - 0.6], [x + 3.0, 1.62, z + 1.9], 0.04, plank); }
    }
    await ctx.yield();
    const coneSpots = [];
    const cr = rng.fork('cones');
    for (let i = 0; i < Math.round(26 * density * (harvest ? 2 : 1)); i++) {
      const x = (cr.int(-6, 6)) * 64 + cr.pick([-9, 9]), z = 26 + cr.int(-7, 9) * 44 + cr.pick([-8, 8]), th = cr.chance(0.5);
      const dp = road.nearestXZ(x, z).dist;
      if (dp < 26 || (Math.abs(x) < 140 && z < -90 && z > -340) || Math.abs(z - 36) < 22 || (Math.abs(x) < 70 && z > 284) || path.nearestXZ(x, z).dist < 24) continue;
      cone(x, z, 0, 4.6, 7, th, dp < 150 ? 20 : 12, dp < 150 ? 5 : 3); coneSpots.push([x, z]);
      if (coneSpots.length % 6 === 0) await ctx.yield();
    }
    await ctx.yield();
    // three hamlets on earth platforms: lime walls, black tile roofs, horse-head gables, yards, jars, racks and washing
    const hr = rng.fork('houses'), shut = H('#2b2622');
    const house = (x, z, y, w, d, hh, ry, yard) => {
      const cs = Math.cos(ry), sn = Math.sin(ry), Pt = (lx, ly, lz) => [x + lx * cs + lz * sn, y + ly, z - lx * sn + lz * cs], S = (id) => { tg.th = id; };
      S(11); tg.box(x, y + hh / 2, z, w, hh, d, lime, ry); tg.box(x, y + 0.5, z, w + 0.06, 1.0, d + 0.06, limeFoot, ry);
      const rh = d * 0.3, ov = 0.5;
      S(5);
      for (const sd of [-1, 1]) {                                    // roof slopes in two tones, with a ridge roll
        const zm = sd * (d / 4 + ov / 2), ym = hh + rh * 0.5 - 0.1;
        tg.quad(Pt(-w / 2, hh + rh, 0), Pt(w / 2, hh + rh, 0), Pt(w / 2, ym, zm), Pt(-w / 2, ym, zm), tile);
        tg.quad(Pt(-w / 2, ym, zm), Pt(w / 2, ym, zm), Pt(w / 2, hh - 0.2, sd * (d / 2 + ov)), Pt(-w / 2, hh - 0.2, sd * (d / 2 + ov)), tile.clone().multiplyScalar(1.25));
        S(6); tg.quad(Pt(-w / 2, hh - 0.2, sd * (d / 2 + ov)), Pt(w / 2, hh - 0.2, sd * (d / 2 + ov)), Pt(w / 2, hh - 0.05, sd * d / 2), Pt(-w / 2, hh - 0.05, sd * d / 2), plank); S(5);   // the eave's underside
      }
      S(0); tg.box(x, y + hh + rh + 0.1, z, w + 0.5, 0.3, 0.4, tile.clone().multiplyScalar(0.8), ry);
      for (const e of [-1, 1]) {                                     // stepped gable walls with tile caps
        const [ex, , ez] = Pt(e * (w / 2 + 0.2), 0, 0);
        S(11); tg.box(ex, y + (hh + rh * 0.55) / 2, ez, 0.5, hh + rh * 0.55, d + 0.5, lime, ry); tg.box(ex, y + hh + rh * 0.85, ez, 0.5, rh * 0.9, d * 0.56, lime, ry);
        S(0); tg.box(ex, y + hh + rh * 0.55 + 0.12, ez, 0.75, 0.24, d + 0.9, tile, ry); tg.box(ex, y + hh + rh * 1.3 + 0.12, ez, 0.75, 0.24, d * 0.56 + 0.5, tile, ry);
        for (const q of [-1, 1]) {                                   // upturned tile caps at the ends of each step
          const [ux, , uz] = Pt(e * (w / 2 + 0.2), 0, q * (d / 2 + 0.5)), [vx, , vz] = Pt(e * (w / 2 + 0.2), 0, q * (d * 0.28 + 0.3));
          tg.box(ux, y + hh + rh * 0.55 + 0.34, uz, 0.6, 0.3, 0.5, tile, ry); tg.box(vx, y + hh + rh * 1.3 + 0.34, vz, 0.6, 0.3, 0.5, tile, ry);
        }
      }
      const [dx, , dz] = Pt(0, 0, d / 2 + 0.03);
      S(6); tg.box(dx, y + 1.5, dz, 1.6, 3.0, 0.1, plank, ry); S(11); tg.box(dx, y + 3.1, dz, 2.0, 0.2, 0.3, limeFoot, ry);
      for (const wx of [-w * 0.3, w * 0.3]) {
        const [qx, , qz] = Pt(wx, 0, d / 2 + 0.03); S(0); tg.box(qx, y + 3.0, qz, 1.3, 1.3, 0.1, shut, ry);
        wg.quad(Pt(wx - 0.5, 2.5, d / 2 + 0.1), Pt(wx + 0.5, 2.5, d / 2 + 0.1), Pt(wx + 0.5, 3.5, d / 2 + 0.1), Pt(wx - 0.5, 3.5, d / 2 + 0.1), H('#ffffff'));
        tg.box(qx, y + 3.0, qz, 0.08, 1.3, 0.2, shut, ry); tg.box(qx, y + 3.0, qz, 1.3, 0.08, 0.2, shut, ry);
        S(11); tg.box(qx, y + 2.28, qz, 1.6, 0.14, 0.3, limeFoot, ry);                                        // sill
      }
      for (const wx of [-w * 0.28, w * 0.28]) {                       // the back wall: two small shuttered windows on stone sills
        const [qx, , qz] = Pt(wx, 0, -d / 2 - 0.03); S(0); tg.box(qx, y + 3.1, qz, 1.0, 1.0, 0.1, shut, ry); S(11); tg.box(qx, y + 2.5, qz, 1.3, 0.14, 0.26, limeFoot, ry);
      }
      for (const e of [-1, 1]) {                                     // a vent under each gable, a rake or a ladder leaning on one end
        const [vx, , vz] = Pt(e * (w / 2 + 0.47), 0, 0); S(0); tg.box(vx, y + hh * 0.86, vz, 0.1, 0.7, 0.7, shut, ry);
        if (e > 0) { S(6); const a = Pt(w / 2 + 1.5, 0, 1.2), b = Pt(w / 2 + 0.5, hh * 0.7, 1.2), c = Pt(w / 2 + 1.5, 0, 1.8), f = Pt(w / 2 + 0.5, hh * 0.7, 1.8);
          tg.beam([a[0], y, a[2]], b, 0.045, plank); tg.beam([c[0], y, c[2]], f, 0.045, plank);
          for (let r = 1; r < 6; r++) { const t = r / 6; tg.beam([a[0] + (b[0] - a[0]) * t, y + (b[1] - y) * t, a[2] + (b[2] - a[2]) * t], [c[0] + (f[0] - c[0]) * t, y + (f[1] - y) * t, c[2] + (f[2] - c[2]) * t], 0.035, plank); } }
      }
      for (const e of [-1, 1]) {                                     // no gable end is a blank wall: a plank door on a stone step under the vent, a small window, and things left leaning
        const gx = e * (w / 2 + 0.47), zw = -e * d * 0.29;
        const [ax, , az] = Pt(gx, 0, 0); S(6); tg.box(ax, y + 1.3, az, 0.12, 2.6, 1.4, plank, ry);
        S(11); tg.box(ax, y + 2.72, az, 0.2, 0.22, 1.9, limeFoot, ry);
        const [sx2, , sz2] = Pt(gx + e * 0.45, 0, 0); tg.box(sx2, y + 0.1, sz2, 0.9, 0.2, 2.0, limeFoot, ry);
        const [qx, , qz] = Pt(gx, 0, zw); S(0); tg.box(qx, y + 3.55, qz, 0.1, 0.9, 0.9, shut, ry); tg.box(qx, y + 3.55, qz, 0.2, 0.9, 0.07, shut, ry); tg.box(qx, y + 3.55, qz, 0.2, 0.07, 0.9, shut, ry);
        S(11); tg.box(qx, y + 3.02, qz, 0.26, 0.12, 1.2, limeFoot, ry);
        const o = gx + e * 0.07;
        wg.quad(Pt(o, 3.2, zw + e * 0.35), Pt(o, 3.2, zw - e * 0.35), Pt(o, 3.9, zw - e * 0.35), Pt(o, 3.9, zw + e * 0.35), H('#ffffff'));
        if (e > 0) {                                                 // a reed mat drying on a leaning frame
          const z0 = -d / 2 + 0.5, z1 = -1.25, b0 = Pt(gx + 1.5, 0.05, z0), b1 = Pt(gx + 1.5, 0.05, z1), t1 = Pt(gx + 0.25, 2.5, z1), t0 = Pt(gx + 0.25, 2.5, z0);
          S(13); tg.quad(b0, b1, t1, t0, matC); S(6); tg.beam(b0, t0, 0.05, plank); tg.beam(b1, t1, 0.05, plank); tg.beam(t0, t1, 0.05, plank);
        } else {                                                     // two jars, a basket and a rake against the wall
          S(0);
          for (let j = 0; j < 2; j++) { const [a, , b] = Pt(gx - 0.7 - j * 0.25, 0, 1.5 + j * 1.0); tg.prism(8, 0.36, 0.52, y, y + 0.6, jar, a, b, false); tg.prism(8, 0.52, 0.3, y + 0.6, y + 1.05, jar, a, b, true); }
          const [bx2, , bz2] = Pt(gx - 0.8, 0, -1.7); tg.prism(8, 0.42, 0.55, y, y + 0.7, H('#8a6230'), bx2, bz2, true);
          S(6); const r0 = Pt(gx - 1.3, 0, -2.6), r1 = Pt(gx - 0.2, 3.3, -2.3); tg.beam([r0[0], y, r0[2]], r1, 0.04, plank);
        }
      }
      const [cx, , cz] = Pt(-w * 0.28, 0, -d * 0.12); S(11); tg.box(cx, y + hh + rh * 0.8, cz, 0.8, 1.9, 0.8, limeFoot, ry); S(0); tg.box(cx, y + hh + rh * 0.8 + 1.0, cz, 1.0, 0.16, 1.0, tile, ry);
      if (yard) {                                                    // a walled yard with jars and a mat drying on a rack
        const yw = w * 0.5 + 1.2, yd = d / 2 + 5.2;
        for (const e of [-1, 1]) { const [a, , b] = Pt(e * yw, 0, d / 2 + 2.6); S(11); tg.box(a, y + 0.8, b, 0.4, 1.6, 5.2, lime, ry); S(0); tg.box(a, y + 1.68, b, 0.62, 0.16, 5.4, tile, ry); }
        for (const e of [-1, 1]) { const [a, , b] = Pt(e * (yw * 0.5 + 0.9), 0, yd); S(11); tg.box(a, y + 0.8, b, yw - 1.8, 1.6, 0.4, lime, ry); S(0); tg.box(a, y + 1.68, b, yw - 1.6, 0.16, 0.62, tile, ry); }
        S(0);
        for (let j = 0; j < 3; j++) { const [a, , b] = Pt(-yw + 1.2 + j * 1.1, 0, d / 2 + 1.0 + (j % 2) * 0.8); tg.prism(8, 0.34, 0.5, y, y + 0.55, jar, a, b, false); tg.prism(8, 0.5, 0.3, y + 0.55, y + 1.0, jar, a, b, true); }
        const r0 = Pt(yw - 3.4, 0.9, d / 2 + 1.4), r1 = Pt(yw - 1.0, 0.9, d / 2 + 1.4), r2 = Pt(yw - 1.0, 1.5, d / 2 + 3.6), r3 = Pt(yw - 3.4, 1.5, d / 2 + 3.6);
        S(13); tg.quad(r0, r1, r2, r3, matC); S(6);
        for (const q of [r0, r1, r2, r3]) tg.beam([q[0], y, q[2]], q, 0.05, plank);
      }
    };
    const hamlets = [[-58, 100], [70, -40], [-90, -70]], fruit = [], chimneys = [];
    const houseAt = [], treeAt = [];                                 // every house as [x, z, w, d, ry, yard, wall height] and every tree's foot, for what is set down among them later
    for (const [hx, hz] of hamlets) {
      const toPath = hx < pathX(hz) ? 1 : -1;
      tg.th = 4; tg.box(hx, 0.9, hz, 46, 1.8, 36, H('#a39274')); tg.box(hx, 0.5, hz, 48, 1.0, 38, H('#8d8a84').multiplyScalar(0.85));
      {
        const ex = hx + toPath * 21.2, wick = H('#8a6230');
        // a mat drying on a leaning rack, jars, baskets heaped with salt, sacks, a rake against the rack
        const b0 = [ex + toPath * 0.9, 1.85, hz + 6], b1 = [ex + toPath * 0.9, 1.85, hz + 10.5], t1 = [ex - toPath * 0.5, 4.3, hz + 10.5], t0 = [ex - toPath * 0.5, 4.3, hz + 6];
        tg.th = 13; tg.quad(b0, b1, t1, t0, matC); tg.th = 6; tg.beam(b0, t0, 0.05, plank); tg.beam(b1, t1, 0.05, plank); tg.beam(t0, t1, 0.05, plank);
        tg.beam([ex - toPath * 1.6, 1.8, hz + 6.2], t0, 0.05, plank); tg.beam([ex - toPath * 1.6, 1.8, hz + 10.3], t1, 0.05, plank);
        tg.beam([ex + toPath * 1.0, 1.8, hz + 12.2], [ex - toPath * 0.2, 4.6, hz + 11.0], 0.04, plank);
        tg.th = 0;
        for (let j = 0; j < 4; j++) { const a = ex + (j % 2) * 0.8 * toPath, b = hz + 0.4 + j * 1.15;
          if (flightDist(a, b, -1e9, 12) < 16) roundJar(tg, a, b, 1.8, 1.05, jar);                                // (where the flight passes within 16 m the jars are round)
          else { tg.prism(8, 0.36, 0.52, 1.8, 2.4, jar, a, b, false); tg.prism(8, 0.52, 0.3, 2.4, 2.85, jar, a, b, true); } }
        for (let j = 0; j < 5; j++) { const a = ex + (j % 2) * 0.7 * toPath, b = hz - 3.2 - j * 1.2; tg.prism(8, 0.42, 0.52, 1.8, 2.4, j % 3 ? wick : H('#6f4d24'), a, b, false); tg.prism(8, 0.5, 0.12, 2.4, 2.75, salt, a, b, true); }
        for (let j = 0; j < 3; j++) tg.box(ex - toPath * 1.4, 2.05 + (j === 2 ? 0.5 : 0), hz - 9.6 - (j % 2) * 1.0 - (j === 2 ? 0.5 : 0), 1.5, 0.5, 0.9, j % 2 ? H('#b7a27c') : H('#a18f6c'), 0.1 * j);
      }
      for (let i = 0; i < 5; i++) {
        const lx = (i % 3 - 1) * 14 + hr.range(-1.5, 1.5), lz = (i < 3 ? -8 : 8) + hr.range(-1.5, 1.5);
        const w = hr.range(9, 12), d = hr.range(6, 7.5), hh = hr.range(4.6, 6.2), ry = hr.pick([0, 0, Math.PI / 2]) + hr.range(-0.06, 0.06);
        house(hx + lx, hz + lz, 1.8, w, d, hh, ry, i >= 3); houseAt.push([hx + lx, hz + lz, w, d, ry, i >= 3, hh]);
        if (i === 0 || i === 4) chimneys.push([hx + lx, 1.8 + hh + d * 0.3 + 2.2, hz + lz]);
        await ctx.yield();
      }
      for (let t = 0; t < 2; t++) {                                  // leafless persimmon trees hung with fruit
        const tx = hx + (t ? 19 : -20) + hr.range(-1, 1), tz = hz + hr.range(-12, 12);
        g.beam([tx, 1.8, tz], [tx + 0.4, 5.2, tz - 0.6], 0.22, plank); treeAt.push([tx, tz]);
        for (let b = 0; b < 7; b++) {
          const a = b * 0.9 + hr.range(0, 0.5), len = hr.range(2.2, 3.6), by = 4.2 + b * 0.25;
          const e = [tx + 0.4 + Math.cos(a) * len, by + len * 0.7, tz - 0.6 + Math.sin(a) * len - len * 0.25];
          g.beam([tx + 0.4, by, tz - 0.6], e, 0.07, plank);
          for (let k = 0; k < 4; k++) fruit.push([e[0] + hr.range(-0.9, 0.9), e[1] - hr.range(0, 1.4), e[2] + hr.range(-0.9, 0.9)]);
        }
      }
      // washing streaming from a line on the side we pass
      const lx0 = hx + toPath * 14.5, lx1 = hx + toPath * 21.5, lz = hz - 15;
      g.beam([lx0, 1.8, lz], [lx0, 5.2, lz], 0.07, plank); g.beam([lx1, 1.8, lz], [lx1, 5.2, lz], 0.07, plank); g.beam([lx0, 5.1, lz], [lx1, 5.1, lz], 0.03, plank);
      for (let c = 0; c < 6; c++) fl.pen(lx0 + (lx1 - lx0) * (c + 0.6) / 7, 4.55 - (c % 3) * 0.08, lz, 1.5 + (c % 2) * 0.5, 0.52, [H('#e9e6de'), H('#2f4a86'), H('#e9e6de'), H('#b9c4d8'), H('#2f4a86'), H('#d98a8c')][c].clone().multiplyScalar(0.85), 0.08, 3);
      await ctx.yield();
    }
    const fg = new GB(), orange = H('#EE6A1C');
    // (fruit on a tree the flight passes within 40 m of is round, with a calyx; further off it stays the five-sided lantern)
    for (const [x, y, z] of fruit) { if (flightDist(x, z, -1e9, 12) < 40) ball(fg, x, y, z, 0.27, 7, orange, H('#5a6a2a')); else fg.prism(5, 0.24, 0.24, y - 0.2, y + 0.2, orange, x, z); }
    // fishing stakes in the moat, cormorants drying their wings on some and gulls on others
    const sk = rng.fork('stakes'), stakeC = H('#4a4034'), corm = H('#24262b'), gullC = H('#e8e6e0').multiplyScalar(0.8);
    const STAKE_ROWS = [[-24, -122, -76, -152, 13], [-38, -248, -94, -206, 13], [30, -112, 42, -146, 10], [40, -252, 98, -272, 10]];
    for (const [x0, z0, x1, z1, n] of STAKE_ROWS) {
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), x = x0 + (x1 - x0) * t + sk.range(-0.7, 0.7), z = z0 + (z1 - z0) * t + sk.range(-0.7, 0.7), hgt = sk.range(2.0, 3.3), lx = sk.range(-0.3, 0.3), lz = sk.range(-0.2, 0.2);
        g.beam([x, -0.3, z], [x + lx, hgt, z + lz], 0.1, stakeC);
        const bird = sk();
        if (bird < 0.3) {
          const bx = x + lx, bz = z + lz, sp = sk.chance(0.5);
          g.prism(5, 0.12, 0.2, hgt, hgt + 0.55, corm, bx, bz, true); g.beam([bx, hgt + 0.5, bz], [bx + 0.1, hgt + 0.95, bz - 0.12], 0.05, corm); g.box(bx + 0.12, hgt + 1.0, bz - 0.22, 0.09, 0.09, 0.3, corm);
          if (sp) for (const sd of [-1, 1]) g.quad([bx, hgt + 0.52, bz], [bx + sd * 0.4, hgt + 0.62, bz + 0.1], [bx + sd * 0.7, hgt + 0.02, bz + 0.2], [bx + sd * 0.1, hgt + 0.08, bz], corm);   // wings half open, hanging to dry
        } else if (bird < 0.45) { g.prism(5, 0.1, 0.16, hgt, hgt + 0.3, gullC, x + lx, z + lz, true); g.box(x + lx, hgt + 0.36, z + lz - 0.14, 0.12, 0.12, 0.16, gullC); }
      }
    }
    await ctx.yield();
    // the far layer: long salt stockpile ridges west, east and south, the seawall running away south-east
    const ridge = (x0, z0, x1, z1, hgt, wid, seed) => {
      // a long heap with a wandering crest of several humps, tapering to the ground at both ends; six facets across, the
      // skirts greyer than the crest
      const N = 20, dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz), px = -dz / l, pz = dx / l; let prev = null;
      const prof = [[1, 0], [0.74, 0.3], [0.4, 0.72], [0, 1], [-0.4, 0.72], [-0.74, 0.3], [-1, 0]], tone = [saltSh, saltRake, salt, salt, saltRake, saltSh];
      for (let i = 0; i <= N; i++) {
        const t = i / N, env = Math.sin(Math.PI * t) ** 0.7, hh = hgt * env * (0.74 + 0.2 * Math.sin(seed + t * 9) + 0.09 * Math.sin(seed * 3.1 + t * 23)), w = wid * (0.12 + 0.88 * env);
        const off = Math.sin(seed * 2 + t * 5) * wid * 0.18 + Math.sin(seed * 5 + t * 17) * wid * 0.06, cx = x0 + dx * t + px * off, cz = z0 + dz * t + pz * off;
        const cur = prof.map(([a, b]) => [cx + px * w * a, hh * b, cz + pz * w * a]);
        if (prev) for (let k = 0; k < 6; k++) g.quad(prev[k], prev[k + 1], cur[k + 1], cur[k], (i + k) % 5 === 0 ? saltSh : tone[k]);
        prev = cur;
      }
    };
    // RIDGES0 is the ground the first ridges took (the mills were laid out round it); RIDGES is what stands now: the three
    // southern ones raised and one more to the south-east, so a line of salt hills stands behind the far mills on the causeway leg
    const RIDGES0 = [[640, 300, 655, -90, 56, 44, 1.3], [-650, 180, -665, -180, 52, 42, 0.4], [270, -650, 640, -570, 54, 42, 3.3], [470, -830, 880, -720, 60, 46, 4.1],
      [-110, -720, -330, -650, 46, 36, 6.0], [300, 520, 620, 600, 48, 40, 2.2]];
    const RIDGES = [[640, 300, 655, -90, 56, 44, 1.3], [-650, 180, -665, -180, 52, 42, 0.4], [250, -650, 660, -565, 74, 62, 3.3], [450, -835, 900, -715, 88, 72, 4.1],
      [-90, -725, -350, -645, 62, 52, 6.0], [300, 520, 620, 600, 48, 40, 2.2], [-250, -600, -420, -500, 50, 46, 5.2]];
    for (const r of RIDGES) ridge(...r);
    g.beam([-900, 0.6, 420], [-330, 0.6, -900], 7, H('#5d5a55'), 1.1);
    await ctx.yield();
    // six small crystalliser pans on stone kerbs either side of the causeway's last arches, rose and jade by turns, each with
    // a crust rim, raked windrows and a row of little heaps: colour and work close under the deck on the way in
    {
      const rose = new THREE.Color(0.56, 0.21, 0.23), jade = new THREE.Color(0.14, 0.36, 0.31), kerb = H('#8d8a84').multiplyScalar(0.9);
      for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {
        const xc = sd * 8.4, zc = -248 - i * 10.6, w = 9.6, d = 9.4, col = (i + (sd > 0 ? 1 : 0)) % 2 ? jade : rose;
        tg.th = 4; tg.box(xc, 0.2, zc, w + 0.9, 0.5, d + 0.9, kerb);
        tg.th = 0; tg.quad([xc - w / 2, 0.47, zc - d / 2], [xc + w / 2, 0.47, zc - d / 2], [xc + w / 2, 0.47, zc + d / 2], [xc - w / 2, 0.47, zc + d / 2], salt);
        tg.th = 9.5; tg.quad([xc - w / 2 + 0.4, 0.49, zc - d / 2 + 0.4], [xc + w / 2 - 0.4, 0.49, zc - d / 2 + 0.4], [xc + w / 2 - 0.4, 0.49, zc + d / 2 - 0.4], [xc - w / 2 + 0.4, 0.49, zc + d / 2 - 0.4], col);
        tg.th = 12;
        for (let r = 0; r < 3; r++) { const x = xc - w / 2 + 2.4 + r * 2.4; tg.box(x, 0.53, zc + 0.8, 0.16, 0.07, d - 4.4, r % 2 ? salt : salt2); }
        for (let r = 0; r < 3; r++) cone(xc - sd * (w / 2 - 1.3), zc - d / 2 + 1.6 + r * 2.4, 0.47, 0.75, 0.8, false, 8, 2);
      }
      tg.th = 0;
    }
    await ctx.yield();
    // the hard at work: reed mats laid out with salt drying on them, rows of baskets (two heaped with persimmons), sacks, a
    // water jar, three poles flying red and blue cloth
    {
      const sack = H('#b7a27c'), wick = H('#8a6230');
      for (const [x, z, ry] of [[-9.5, 187, 0.2], [13.2, 177.5, -0.15], [-10.5, 157, 0.1]]) {
        const cs = Math.cos(ry), sn = Math.sin(ry), P = (lx, lz) => [x + lx * cs + lz * sn, 1.575, z - lx * sn + lz * cs];
        tg.th = 13; tg.quad(P(-1.9, -2.8), P(1.9, -2.8), P(1.9, 2.8), P(-1.9, 2.8), matC);
        for (let r = 0; r < 6; r++) { const [ax, , az] = P(-0.9 + (r % 2) * 1.8, -1.8 + Math.floor(r / 2) * 1.8); cone(ax, az, 1.58, 0.62, 0.5, false, 8, 2); }
      }
      tg.th = 0;
      for (let i = 0; i < 7; i++) {
        const x = 12.05 + (i % 2) * 0.3, z = 164.5 + i * 1.2;
        tg.prism(8, 0.42, 0.52, 1.55, 2.15, i % 3 ? wick : H('#6f4d24'), x, z, false);
        if (i === 2 || i === 5) tg.prism(8, 0.5, 0.2, 2.15, 2.42, orangeC, x, z, true); else tg.prism(8, 0.5, 0.12, 2.15, 2.5, salt, x, z, true);
      }
      for (let i = 0; i < 5; i++) tg.box(-8.6 + (i % 3) * 0.95, 1.85 + Math.floor(i / 3) * 0.55, 165.2 + (i % 2) * 0.3, 0.9, 0.5, 1.5, i % 2 ? sack : sack.clone().multiplyScalar(0.88), 0.1 * i);
      tg.prism(8, 0.5, 0.7, 1.55, 2.3, jar, -14.6, 166, false); tg.prism(8, 0.7, 0.36, 2.3, 2.9, jar, -14.6, 166, true);
      for (const [x, z, c] of [[-15.8, 172.5, '#d0481a'], [15.5, 151.5, '#d0481a'], [-15.5, 151.5, '#35507c'], [-7.5, 153, '#35507c']]) {
        g.beam([x, 1.5, z], [x, 7.4, z], 0.07, plank); fl.pen(x, 7.0, z, 2.8, 0.42, H(c), 0.5, 4);
      }
    }
    await ctx.yield();
    // a straw hat and a blue jacket left on a peg at the great mill's post
    tg.th = 8; tg.beam([23.62, 4.95, -51.8], [23.05, 4.95, -51.5], 0.035, plank); tg.prism(8, 0.52, 0.06, 4.86, 5.1, H('#d2b06a'), 22.98, -51.46, true);
    tg.box(23.14, 4.3, -51.54, 0.66, 1.0, 0.13, H('#35507c'), -1.08);
    tg.th = 0;
    await ctx.yield();
    // ---- the mills ------------------------------------------------------------------------------------------------
    const mr = rng.fork('mills'), near = [], far = [], shad = [];
    const omega0 = Math.PI * 2 / 7.5;
    // size: a set size (the two great mills in the moat); ghost: draw this mill's numbers and build nothing, so that taking
    // a mill away leaves every other mill as it was
    const skySeed = nx.fork('skyline').range(0, 97);
    const skyH = (x, z, k) => { const v = Math.sin(x * 0.129898 + z * 0.78233 + k * 37.719 + skySeed) * 43758.5453; return v - Math.floor(v); };
    // NO MILL OF THE RANKS STANDS CLOSE UNDER THE HIGH FLIGHT: where the eye is above the mills' heads (16.5 m) a mill nearer
    // than 46 m on the level would be looked down on with the frame cutting through it, so the ranks (the grid's junctions
    // and the dyke's left-hand stations) leave that ground clear, along the whole route. The mills set by hand for the flight
    // (sweep mills, great mills, the stand-ins by the bridge) are the route's own.
    const underHigh = (x, z) => flightDist(x, z, 16.5) < 46;
    const addMill = (x, z, y = 0, forceNear = false, size = 0, ghost = false) => {
      const d = road.nearestXZ(x, z).dist;
      // beyond 350 m the mills come in drifts of size (0.8 to 2.2 times), so the far ranks never close into one level line;
      // where the drifts run highest beyond 450 m a few giants stand up to three times the size and break the skyline
      const dn = ctx.noise.n2(x * 0.0037 + 5.1, z * 0.0037 - 2.3), far01 = Math.min(1, Math.max(0, (d - 350) / 150));
      const giant = Math.min(1, Math.max(0, (d - 450) / 100)) * Math.min(1, Math.max(0, (dn - 0.45) / 0.25));
      const s = size || 1 + far01 * (-0.2 + 1.4 * Math.min(1, Math.max(0, dn * 1.3 + 0.35)) ** 1.5) + 0.8 * giant;
      const m = { x, y, z, R: 7 * s, y0: 6.4 * s, w: 3.4 * s, h: 8.1 * s, phase: mr.range(0, 6.283), omega: omega0 * mr.range(0.88, 1.12) / s, arrive: U0 + (26 - z) / 2070 + 0.012, seed: mr() };
      if (ghost) return;
      // THE FAR RANKS ARE NOT ONE MILL REPEATED: from 140 m off the dyke each mill is its own height (0.7 to 1.65 times),
      // one in five is tall and narrow, one in six broad and low, one in eight carries its sails reefed to half their
      // width, and each stands up to 19 m off its junction: by seed, the same for every seed's whole plain
      if (!forceNear && !size && d > 140) {
        const k = Math.min(1, (d - 140) / 80), h1 = skyH(x, z, 1), h2 = skyH(x, z, 2), s2 = 1 + k * (-0.3 + 0.95 * h1 * h1);
        m.R *= s2; m.y0 *= s2; m.w *= s2; m.h *= s2; m.omega /= s2;
        if (h2 < 0.2) { m.R *= 1 - 0.22 * k; m.h *= 1 + 0.22 * k; m.w *= 1 - 0.15 * k; }
        else if (h2 > 0.83) { m.R *= 1 + 0.3 * k; m.h *= 1 - 0.2 * k; }
        else if (h2 > 0.7) m.w *= 1 - 0.5 * k;
        const jx = (skyH(x, z, 3) - 0.5) * 38 * k, jz = (skyH(x, z, 4) - 0.5) * 26 * k;
        if (!coneSpots.some(([qx, qz]) => Math.hypot(qx - x - jx, qz - z - jz) < 17)) { m.x += jx; m.z += jz; }   // (never onto a salt cone)
      }
      (forceNear || d < 100 ? near : far).push(m); if (d < 520) shad.push(m);
    };
    for (let k = -2; k <= 6; k++) {
      if (k === 0) continue;
      const z = 26 + 44 * k, cx = pathX(z), off = (z < 195 && z > 145) ? 21 : k === 1 ? 27 : 13;   // (the pair at the bridge foot stands wide of the willows)
      // no pair at z 290: it would stand 13 m either side of the entry point and be cut by the portal we arrive through
      if (k === 6) { addMill(cx - off, z, 0, true, 0, true); addMill(cx + off, z, 0, true, 0, true); continue; }
      if (k === 1) addMill(-60, 73, 0, true); else addMill(cx - (k === 4 ? 28 : off), z, 0, true, 0, k === 2 || underHigh(cx - (k === 4 ? 28 : off), z));   // (none under the high flight: see underHigh; none at z 114: the second sweep mill stands there alone, and we pass between it and the hamlet)
      // on the right the first sweep mill stands in for the mill at z 246, and the next one stands wider: the first sight of
      // the pagoda down the dyke stays clear of sails; so do the two southern right-hand mills
      // (south of the bridge the right-hand pair stands where the flight passes: one wide, and the great mill A at (24, -52),
      // 1.6 times the size, whose rim we go under)
      if (k !== 5) addMill(z < 0 ? (z < -40 ? 24 : 14) : k === 3 ? 37 : cx + off, z < -40 ? -52 : k === 3 ? 150 : k === -1 ? -8 : z, 0, true, z < -40 ? 1.6 : 0, k === 4 || k === 1);   // (no right-hand mill by the first sweep mill, nor at the bridge foot)
    }
    addMill(16, 211, -0.9, true, 1.3); addMill(-9 + pathX(104), 104, -0.9, true); addMill(-57, -30, -0.9, true);   // on the left, so the crest keeps a clear sight of the pagoda
    const moatMills = [[-50, -322], [50, -322]];                    // two great mills on footings in the moat, either side of the island
    for (let i = -17; i <= 17; i++) {
     if ((i + 17) % 5 === 4) await ctx.yield();
     for (let j = -23; j <= 20; j++) {
      const x = 64 * i, z = 26 + 44 * j;
      const keep = mr() < (Math.abs(x) <= 256 ? 1 : 1.5 - Math.abs(x) / 1000);
      if (!keep) continue;
      const dp = road.nearestXZ(x, z).dist;
      if (dp < 30) continue;
      if ((Math.abs(x) < 150 && z < -80 && z > -350) || Math.abs(z - 36) < 20) continue;
      if (hamlets.some(([hx, hz]) => Math.abs(x - hx) < 34 && Math.abs(z - hz) < 28)) continue;
      if ((x + 900) * -0.918 + (z - 420) * -0.396 > -34) continue;   // the sea
      // far out the ranks break into groups, with ridges, haze and sky between them
      if (dp > 380 && ctx.noise.n2(x * 0.004 + 1.7, z * 0.004 - 3.1) < -0.22) continue;
      const onRidge = (list) => list.some(([x0, z0, x1, z1, , wd]) => { const dx = x1 - x0, dz = z1 - z0, t = Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - x0 - dx * t, z - z0 - dz * t) < wd + 12; });
      if (onRidge(RIDGES0)) continue;
      // (the raised and the new ridges clear their own ground; so does the dyke behind the entry, which the portal looks along)
      addMill(x, z, 0, false, 0, onRidge(RIDGES) || (Math.abs(x) < 70 && z > 290 && z < 480) || underHigh(x, z));   // (and none close under the high flight)
     }
    }
    for (const [x, z] of moatMills) addMill(x, z, -0.5, true, 1.5);  // drawn last: every mill before them keeps its numbers
    addMill(78, -128, -0.5, true, 1.5);                             // a third great mill at the moat's north-west shore, where we come out over the water
    await ctx.yield();
    // rakers: [x, y, z, facing]
    const rakeAt = [[-5.5, 1.56, 178, 2.2], [-9.5, 1.56, 162, 0.6], [14.3, 1.56, 169.5, -1.9], [14.4, 1.56, 173.4, 3.1], [-3.8, 1.56, 156.5, 1.2], [9.2, 1.56, 152.5, -0.7], [-12, 1.56, 172, 2.9],
      [36, 0.03, -74, 0.4], [40, 0.03, -88, -2.5], [48, 0.03, -80, 1.9], [52, 0.03, -94, -0.9], [46, 0.03, -100, 2.6], [12, 0.03, -84, 0.2], [14, 0.03, -34, -1.2], [5, 0.03, -58, 0.8], [10, 0.03, -70, 1.0],
      [-7.2, 0.49, -249, 1.4], [-9.2, 0.49, -263.4, -0.4], [-7, 0.49, -270, 2.0], [7.4, 0.49, -248, -1.5], [9.2, 0.49, -259, 0.5], [7.2, 0.49, -270.4, -2.2]];
    // carriers: [x0, z0, x1, z1, y or null for the causeway deck, pace]
    const carryAt = [[-11, 177, -7.5, 160, 1.56, 1], [16.2, 162.5, 16.2, 178, 1.56, 0.9], [47.9, -54, 47.9, -28, 1.8, 1], [48.3, -30, 48.3, -50, 1.8, 0.8],
      [0.7, -112, 0.7, -160, null, 1], [-0.7, -150, -0.7, -196, null, 0.9], [0.7, -170, 0.7, -214, null, 1.1], [-0.7, -118, -0.7, -142, null, 0.8],
      [-13.5, -286.6, -5.2, -287.2, 1.12, 0.7], [-6, -287.4, -12.6, -286.8, 1.12, 0.8], [13.5, -286.6, 5.2, -287.2, 1.12, 0.75], [6, -287.4, 12.6, -286.8, 1.12, 0.65]];
    // A BOAT'S BERTH KEEPS ITS DISTANCE FROM THE FLIGHT ALONG THE WHOLE ROUTE. A berth is [x at u 0, z, metres sailed along x
    // by u 1]. No point of a boat's track lies nearer the flight on the level, anywhere from the arrival to the gate, than
    // `clear` metres (a barge's own half length and a little more): a berth that is nearer is moved straight away from the
    // flight until it is not.
    const berth = (x, z, drift, clear) => {
      for (let n = 0; n < 60; n++) {
        let bd = 1e12, px = 0, pz = 0;
        for (let k = 0; k <= 4; k++) for (let i = 0; i <= RTN; i++) { const dx = x + drift * k / 4 - rtX[i], dz = z - rtZ[i], d = dx * dx + dz * dz; if (d < bd) { bd = d; px = dx; pz = dz; } }
        const d = Math.sqrt(bd); if (d >= clear) break;
        x += px / Math.max(d, 1e-3) * 2; z += pz / Math.max(d, 1e-3) * 2;
      }
      return [x, z, drift];
    };
    // the moat's barges: one broadside on our right as we drift down the moat, one beyond the causeway, one far out on the
    // eastern moat, one off the island's east side; two more in the moat's far corners; six salt lighters lying to; and
    // a junk under full sail between the flight and the tower, which crosses the tower as we come down the moat
    const moatB = [[80, -162, -6], [-50, -186, 30], [-100, -150, 12], [-106, -275, 5]].map(([x, z, dr]) => berth(x, z, dr, 17));
    const farB = [[-112, -318, 9], [116, -282, -9]].map(([x, z, dr]) => berth(x, z, dr, 17));
    const crossB = berth(44, -186, -22, 19);
    const lighters = [[104, -214, 0.11], [-27, -236, 0.47], [-62, -272, 0.83], [70, -197, 0.29], [-27, -262, 0.61], [31, -167, 0.37]].map(([x, z, sd]) => { const b = berth(x, z, 0, 9.5); return [b[0], b[1], sd]; });
    await ctx.yield();

    // ---- THE WORKING CLUTTER: ONE RULE FOR THE WHOLE FLIGHT -------------------------------------------------------------
    // Wherever the eye flies lower than 10 m, the ground within 45 m of it on both sides is at work, from the arrival to the
    // gate: every pan, the hard, every shore and the open water. Sites lie on an even lattice (10.5 m in the pans, twice as thick within
    // 24 m of the flight, every other one on the water, 4.2 m on the hard) and along the shores of the moat and the canal (every 9 m), each
    // shifted by a seeded jitter; what stands at a site is drawn by seed from the kinds that belong to its ground: raked
    // heaps and cones, drying racks with mats and baskets, barrows on plank runs, rakers at work, and on the water stake rows
    // hung with nets, cormorants drying their wings on them or diving beside them, and stilt stages with a fisherman. A
    // worker stands at the pump of every mill the low flight passes. Nothing here is placed by hand and no place on the
    // route is named: the only tests are the distance to the flight, the eye's height there, the ground, and what already
    // stands on it.
    const work = { heaps: [], racks: [], barrows: [], stakes: [], corms: [], stages: [], n: 0 };
    const SK = [[-4.5, 0.2, 2.4], [-1.5, -0.3, 3.1], [1.5, 0.25, 2.7], [4.5, -0.1, 3.3]];   // a stake row's four stakes: x, z, height
    const WADE = [41, 178];                                         // the waders' place in the pan beside the hard
    {
      const wSeed = nx.fork('work').range(0, 97);
      const wh = (i, j, k) => { const v = Math.sin(i * 127.1 + j * 311.7 + k * 74.7 + wSeed) * 43758.5453; return v - Math.floor(v); };
      // what already stands, as circles [x, z, r]: a site is sown only on free ground and then takes its own
      const occ = [];
      const take = (x, z, r) => { occ.push(x, z, r); };
      const free = (x, z, r) => { for (let i = 0; i < occ.length; i += 3) { const dx = occ[i] - x, dz = occ[i + 1] - z, rr = occ[i + 2] + r; if (dx * dx + dz * dz < rr * rr) return false; } return true; };
      const line = (x0, z0, x1, z1, r) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / r)); for (let i = 0; i <= n; i++) take(x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n, r); };
      take(-13, 182, 6.8); take(15, 158, 6.8); take(-5.2, 170.6, 3.8);                                        // the hard: its two cones, the cart,
      for (const [x, z] of [[-9.5, 187], [13.2, 177.5], [-10.5, 157]]) take(x, z, 3.7);                          // its mats, baskets, sacks, jar and poles,
      line(12.2, 164.5, 12.2, 171.7, 1.4); take(-7.9, 165.4, 2.1); take(-14.6, 166, 1.4);
      for (const [x, z] of [[-15.8, 172.5], [15.5, 151.5], [-15.5, 151.5], [-7.5, 153]]) take(x, z, 0.9);
      for (const o of hardSpots) take(o[0], o[1], o[2]);                                                       // its heaps and plank runs
      for (const r of rakeAt) take(r[0] - Math.sin(r[3]) * 1.2, r[2] - Math.cos(r[3]) * 1.2, 2.9);                // the rakers and carriers there already
      for (const c of carryAt) line(c[0], c[1], c[2], c[3], 1.5);
      for (const m of near) take(m.x, m.z, 7.2 * m.R / 7);                                                     // every mill with its pump
      for (const m of far) if (flightDist(m.x, m.z) < 90) take(m.x, m.z, 4.2 * m.R / 7);
      for (const [x, z] of coneSpots) take(x, z, 6.2);
      take(-47, 55, 5); take(-2, 50.5, 5); line(-64, 51.2, -19, 51.2, 2.4); line(45, -57, 45, -23, 2.4); line(21.2, 153, 21.2, 187, 2.2);   // willows and reed belts
      take(-34, 228, 11); take(-23, 121, 10.5); take(-27, 62, 8.5); take(-27, -140, 14); take(-29, -222, 14); take(WADE[0], WADE[1], 10);   // where the waders feed
      for (const [x0, z0, x1, z1] of STAKE_ROWS) line(x0, z0, x1, z1, 5);
      for (const [x, z, dr] of [...moatB, ...farB, crossB]) line(Math.min(x, x + dr) - 16, z, Math.max(x, x + dr) + 16, z, 7.5);
      for (const [x, z] of lighters) line(x - 11, z, x + 11, z, 5.5);
      await ctx.yield();
      // the ground at (x, z): null where nothing may be sown, else [kind, y, the rim runs north-south]. Kinds: 'hard', 'pan',
      // 'rim' (the white crust strip at a pan's edge or a shore), 'water' (the moat or the canal, clear of the barges' fairway)
      const groundAt = (x, z) => {
        if (Math.abs(x) <= 15.4 && z >= 151.4 && z <= 188.6) return Math.abs(x - pathX(z)) < 2.2 ? null : ['hard', 1.56, false];
        if (Math.abs(x) < 19.8 && z > 147.2 && z < 192.8) return null;                    // the quay's own walls and posts
        if (road.nearestXZ(x, z).dist < 7) return null;                                   // the dyke we set out on, the bridge, the causeway
        if (hamlets.some(([hx, hz]) => Math.abs(x - hx) < 25.5 && Math.abs(z - hz) < 20.5)) return null;
        if (Math.abs(x) < 36 && z < -240 && z > -336) return null;                        // the island, its steps and its six little pans
        const gx = x / 64, gz = (z - 26) / 44, ex = Math.min(gx - Math.floor(gx), 1 - gx + Math.floor(gx)) * 64, ez = Math.min(gz - Math.floor(gz), 1 - gz + Math.floor(gz)) * 44;
        const dC = Math.abs(z - 36) - 12, dM = Math.max(Math.abs(x) - 130, Math.max(z + 100, -330 - z)), dO = Math.min(dC, dM);
        if (dO <= 0) return dO > -3.5 || (dC <= 0 && Math.abs(z - 36.5) < 6.5) ? null : ['water', 0, false];
        const e = Math.min(ex, ez, dO);
        return e < 2.1 ? null : [e < 4.4 ? 'rim' : 'pan', 0.03, dO < Math.min(ex, ez) ? (dM < dC && Math.abs(x) > 130) : ex < ez];
      };
      const heap = (x, z, y, r, hh, rot) => { work.heaps.push({ x, y: y - 1.5, z, R: r, y0: 1.5, w: 1, h: hh, phase: rot, omega: 0, arrive: 9, seed: 0 }); };
      const kit = (list, x, z, y, s, rot) => { list.push({ x, y: y - 1.5, z, R: s, y0: 1.5, w: 1, h: s, phase: rot, omega: 0, arrive: 9, seed: 0 }); };
      // one site. (i, j) name it for the seeded draws; lowD is how near the low flight passes (nothing is sown under the
      // eye, nothing nearer it than its own reach and a clear stride, and nothing taller than a heap within 6.5 m of it)
      const site = (x, z, i, j) => {
        const gnd = groundAt(x, z); if (!gnd) return;
        if (flightDist(x, z, -1e9, gnd[0] === 'water' ? 1e9 : 10) > 45) return;       // (the moat is fished under the high turn as well)
        const lowD = flightDist(x, z, -1e9, 12); if (lowD < 2.4) return;       // (each kind keeps its own reach clear of the eye as well)
        const tall = lowD >= 6.5, [kind, y, ns] = gnd, v = wh(i, j, 2), rot = wh(i, j, 3) * 6.2832, a = wh(i, j, 4), b = wh(i, j, 5);
        if (kind === 'water') {
          if (!tall || ((i + j) & 1)) return;                         // (every other lattice site on the water)
          const cs0 = Math.cos(rot), sn0 = Math.sin(rot), nx0 = x - 7.4 * sn0, nz0 = z - 7.4 * cs0;   // where a stage's net would hang
          if (v < 0.22 && free(x, z, 5.4) && free(nx0, nz0, 2.8) && groundAt(nx0, nz0)?.[0] === 'water' && flightDist(nx0, nz0, -1e9, 12) >= 6.5) {   // a stilt stage, its fisherman sorting the catch
            take(x, z, 5.4); take(nx0, nz0, 2.8); work.stages.push([x, z, rot]);
            const cs = cs0, sn = sn0, P = (lx, ly, lz) => [x + lx * cs + lz * sn, ly, z - lx * sn + lz * cs];
            tg.th = 6; tg.box(x, 1.3, z, 2.3, 0.12, 4.8, plank, rot);
            for (const [lx, lz] of [[-1, -2.2], [1, -2.2], [-1, 2.2], [1, 2.2]]) tg.beam(P(lx * 1.35, -0.4, lz * 1.08), P(lx, 1.26, lz), 0.07, stakeC);
            tg.th = 0; tg.beam(P(0.7, 1.36, -1.6), P(0.2, 4.4, -7.4), 0.06, stakeC);                              // the lift net's boom,
            for (const [lx, lz] of [[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]]) tg.beam(P(0.2, 4.4, -7.4), P(0.2 + lx, 0.9, -7.4 + lz), 0.022, stakeC);
            tg.quad(P(-1.3, 0.9, -8.9), P(1.7, 0.9, -8.9), P(1.7, 0.9, -5.9), P(-1.3, 0.9, -5.9), H('#6a6252'));   // and its square of net
            { const [bx, , bz] = P(-0.6, 0, 1.9); tg.prism(6, 0.4, 0.5, 1.36, 1.95, H('#8a6230'), bx, bz, false); tg.prism(6, 0.47, 0.1, 1.95, 2.2, H('#b9b4aa'), bx, bz, false); }
            const [fx, , fz] = P(0.1, 0, 1.0); rakeAt.push([fx, 1.37, fz, rot]);
          } else {                                                    // a row of stakes hung with net, a cormorant or two
            const sc = 0.85 + 0.4 * a, r2 = Math.abs(z - 36) < 12 ? 0 : rot, cs = Math.cos(r2), sn = Math.sin(r2);
            if (!free(x, z, 5.6 * sc) || !free(x + cs * 4 * sc, z + sn * 4 * sc, 2) || !free(x - cs * 4 * sc, z - sn * 4 * sc, 2)) return;
            take(x, z, 5.6 * sc); kit(work.stakes, x, z, y, sc, r2);
            const top = (q) => [x + sc * (SK[q][0] * cs - SK[q][1] * sn), y + sc * SK[q][2], z + sc * (SK[q][0] * sn + SK[q][1] * cs)];
            if (b < 0.8) { const q = Math.floor(wh(i, j, 6) * 4), t = top(q); work.corms.push([t[0], t[1], t[2], wh(i, j, 7) * 6.2832, 0, wh(i, j, 8) * 9]);
              if (b < 0.35) { const t2 = top((q + 2) % 4); work.corms.push([t2[0], t2[1], t2[2], wh(i, j, 9) * 6.2832, 0, wh(i, j, 10) * 9]); } }
            const dx2 = x - sn * 6.5 * sc, dz2 = z + cs * 6.5 * sc;                                              // one fishing beside the row
            if (wh(i, j, 11) < 0.5 && free(dx2, dz2, 3) && groundAt(dx2, dz2)?.[0] === 'water' && flightDist(dx2, dz2, -1e9, 12) >= 6.5) { take(dx2, dz2, 3); work.corms.push([dx2, y, dz2, rot, 1, wh(i, j, 12) * 9]); }
          }
          work.n++; return;
        }
        const fxd = -Math.sin(rot), fzd = -Math.cos(rot);            // the way a raker at this site faces
        if (kind === 'rim') {                                         // the crust strip: cones in a row along it, a rack, low heaps
          const ax = ns ? 0 : 1, az = ns ? 1 : 0, rr = ns ? 0 : Math.PI / 2;
          if (v < 0.5 && tall) {
            const r = 1.1 + 0.7 * a, d = r * 1.9 + 0.5; if (!free(x, z, r + d * 0.5 + 0.4)) return; take(x, z, r + d * 0.5 + 0.4);
            heap(x - ax * d * 0.5, z - az * d * 0.5, y, r, r * (1.2 + 0.25 * b), rot); heap(x + ax * d * 0.5, z + az * d * 0.5, y, r * 0.8, r * (0.85 + 0.2 * a), rot + 1);
          } else if (v < 0.74) { if (lowD < 3.2 || !free(x, z, 2.6)) return; take(x, z, 2.6); kit(work.racks, x, z, y, 0.66, rr); }
          else { const r = 0.6 + 0.4 * a; if (lowD < r + 2 || !free(x, z, 2.4)) return; take(x, z, 2.4); heap(x - ax * 1.1, z - az * 1.1, y, r, r * 1.05, rot); heap(x + ax * 1.1, z + az * 1.1, y, r * 0.8, r * 0.8, rot + 2); }
          work.n++; return;
        }
        // a pan's bed or the hard
        const hard = kind === 'hard', vv = hard ? (v < 0.66 ? v * 0.9 : 0.8) : v, scR = hard ? (lowD < 4.5 ? 0.48 + 0.12 * a : 0.6 + 0.2 * a) : 0.85 + 0.3 * a;   // (no tall cones among the hard's own two)
        if (vv < 0.36 && tall) {                                      // a raker at work on a heap
          const hx = x + fxd * 3.3, hz = z + fzd * 3.3;
          if (!free(x + fxd * 1.6, z + fzd * 1.6, 3.3) || flightDist(hx, hz, -1e9, 12) < 3.2 || (hard && !groundAt(hx, hz))) return;
          take(x + fxd * 1.6, z + fzd * 1.6, 3.3); rakeAt.push([x, y, z, rot]); heap(hx, hz, y, 0.7 + 0.3 * a, 0.6 + 0.4 * b, rot);
        } else if (vv < 0.5 && lowD >= 3.4 * scR + 0.8) { const sc = scR; if (!free(x, z, 3.4 * sc)) return; take(x, z, 3.4 * sc); kit(work.racks, x, z, y, sc, rot); }
        else if (vv < 0.6 && lowD >= 3.2) {
          const cs = Math.cos(rot), sn = Math.sin(rot);
          if (!free(x, z, 2.6) || !free(x + cs * 3, z + sn * 3, 2.2) || !free(x - cs * 3, z - sn * 3, 2.2) || (hard && !(groundAt(x + cs * 3.6, z + sn * 3.6) && groundAt(x - cs * 3.6, z - sn * 3.6)))) return;
          take(x, z, 2.6); take(x + cs * 3, z + sn * 3, 2.2); take(x - cs * 3, z - sn * 3, 2.2); kit(work.barrows, x, z, y, 1, rot);
        } else if (vv < 0.78 && tall) {                               // a raked cone, a small heap or two beside it
          const r = 1.5 + 0.8 * a; if (!free(x, z, r + 1.7)) return; take(x, z, r + 1.7);
          heap(x, z, y, r, r * (1.25 + 0.2 * b), rot); heap(x + Math.cos(rot) * (r + 0.9), z + Math.sin(rot) * (r + 0.9), y, 0.7, 0.7, rot);
          if (b > 0.5) heap(x + Math.cos(rot + 2.2) * (r + 0.8), z + Math.sin(rot + 2.2) * (r + 0.8), y, 0.55, 0.5, rot);
        } else {                                                      // one to three low heaps
          const r = 0.75 + 0.9 * b, n = 1 + Math.floor(a * 2.7); if (lowD < r + 1.6 || !free(x, z, r + 1.6)) return; take(x, z, r + 1.6);
          heap(x, z, y, r, r * 1.05, rot);
          for (let q = 1; q < n; q++) heap(x + Math.cos(rot + q * 2.3) * (r + 0.8), z + Math.sin(rot + q * 2.3) * (r + 0.8), y, r * 0.6, r * 0.55, rot + q);
        }
        work.n++;
      };
      // and a worker at the pump of every mill the low flight passes within 30 m of (not the mills that stand in the moat)
      for (const m of near) {
        if (flightDist(m.x, m.z, -1e9, 10) > 30) continue;
        if (Math.max(Math.abs(m.x) - 130, Math.max(m.z + 100, -330 - m.z)) < 0) continue;
        const sc = m.R / 7;
        for (const [ox, oz, ry] of [[-7.3, 5.6, -0.34], [5.6, 7.3, 0.654], [-5.6, -7.3, -2.487], [7.3, -5.6, 2.225]]) {   // at the pump, else round the foot, facing the gear
          const x = m.x + ox * sc, z = m.z + oz * sc, gnd = groundAt(x, z);
          if ((gnd && gnd[0] === 'water') || road.nearestXZ(x, z).dist < 4 || flightDist(x, z, -1e9, 12) < 5.5 || !free(x, z, 1.2)) continue;
          take(x, z, 2); rakeAt.push([x, gnd && gnd[0] === 'hard' ? 1.56 : 0.03, z, ry]); work.n++; break;
        }
      }
      await ctx.yield();
      // the lattice: every 10.5 m (4.2 m across the hard) over the ground the low flight comes within 45 m of
      let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9;
      for (let i = 0; i <= RTN; i++) { bx0 = Math.min(bx0, rtX[i]); bx1 = Math.max(bx1, rtX[i]); bz0 = Math.min(bz0, rtZ[i]); bz1 = Math.max(bz1, rtZ[i]); }
      const PITCH = 10.5;
      for (let i = Math.floor((bx0 - 45) / PITCH); i <= Math.ceil((bx1 + 45) / PITCH); i++) {
        for (let j = Math.floor((bz0 - 45) / PITCH); j <= Math.ceil((bz1 + 45) / PITCH); j++)
        {
          site((i + 0.5 + (wh(i, j, 0) - 0.5) * 0.6) * PITCH, (j + 0.5 + (wh(i, j, 1) - 0.5) * 0.6) * PITCH, i, j);
          // (twice as thick beside the flight: within 24 m of the low route the lattice's corners are sown as well as its cells)
          const x = (i + (wh(i + 2000, j, 0) - 0.5) * 0.6) * PITCH, z = (j + (wh(i + 2000, j, 1) - 0.5) * 0.6) * PITCH;
          if (flightDist(x, z, -1e9, 10) <= 24) site(x, z, i + 2000, j);
        }
        if ((i & 3) === 3) await ctx.yield();
      }
      for (let i = -4; i <= 3; i++) for (let j = 36; j <= 45; j++) {   // the hard's own finer lattice (its sites are named apart from the pans')
        const x = (i + 0.5 + (wh(i + 500, j, 0) - 0.5) * 0.6) * 4.17, z = (j + 0.5 + (wh(i + 500, j, 1) - 0.5) * 0.6) * 4.17;
        if (groundAt(x, z)?.[0] === 'hard') site(x, z, i + 500, j);
      }
      await ctx.yield();
      // the shores of the moat and of the canal, walked every 9 m: the crust strip three metres back from the water
      [[-130, -97, 130, -97], [133, -100, 133, -330], [-133, -100, -133, -330], [-130, -333, 130, -333], [-300, 51, 300, 51], [-300, 21, 300, 21]].forEach(([x0, z0, x1, z1], n) => {
        const cnt = Math.floor(Math.hypot(x1 - x0, z1 - z0) / 9);
        for (let q = 0; q < cnt; q++) { const t = (q + 0.5 + (wh(900 + n, q, 0) - 0.5) * 0.5) / cnt; site(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, 900 + n, q); }
      });
      await ctx.yield();
      // ---- THE HAMLET'S YARD IN THE GALE, AND THE PENNANT POLES (round seventeen) --------------------------------------
      // The hamlet the dyke passes on its left between the hard and the bridge lives out of doors in the wind: washing
      // streams flat down the gale from long lines along the platform's rim toward the dyke and along its side toward
      // the canal; drying racks stand in its open ground hung with strings of peeled persimmons (each string swings in
      // its own time); persimmon trees in fruit, baskets heaped with fruit, jars and a ladder stand among them; and the
      // same racks stand on plank floors in the pan beside it, in the strip from 26 to 50 m left of the dyke's crown
      // between the hard's south wall and the bridge's foot. Tall pennant poles stand on the platform's rim toward
      // the canal and either side of the dyke where it meets the bridge. Every one of these is set down by the same
      // tests: free ground (the houses, the trees and what the yard already holds; in the pans the working clutter's own
      // list), and the stand-off from the walked flight for its height (clearOfEye). What is nearest the flight is set first.
      {
        const yr = own('gale-yard'), [hx, hz] = hamlets[0], PT = 1.8, toP = hx < pathX(hz) ? 1 : -1;
        const cloth = ['#e9e6de', '#2f4a86', '#e9e6de', '#b9c4d8', '#c84a22', '#d98a8c', '#e9e6de', '#d9b25a', '#2f4a86'].map((c) => H(c).multiplyScalar(0.85));
        const rope = H('#3d3226'), pole = H('#6b543a'), wick = H('#8a6230'), fruitC = [H('#EE6A1C'), H('#d95a14'), H('#f0862a')], calyx = H('#5a6a2a');
        const yardOcc = [], did = { lines: 0, racks: 0, trees: 0, heaps: 0, panRacks: 0, poles: 0, staffs: 0 }; let strings = 0;
        const inHouse = (x, z, m) => houseAt.some(([cx, cz, w, d, ry, yard]) => { const dx = x - cx, dz = z - cz, cs = Math.cos(ry), sn = Math.sin(ry), lx = dx * cs - dz * sn, lz = dx * sn + dz * cs;
          return Math.abs(lx) < w / 2 + 2.3 + m && lz > -d / 2 - 1.0 - m && lz < d / 2 + (yard ? 5.9 : 1.6) + m; });
        // (what the platform's rim toward the dyke already holds: the mat on its rack, the jars, the baskets, the sacks; and the old washing line)
        const liveEdge = (x, z, m) => (toP * (x - hx) > 17.6 - m && z > hz - 11.9 - m && z < hz + 13.1 + m) || (toP * (x - hx) > 13.3 - m && toP * (x - hx) < 22.7 + m && z > hz - 17.8 - m && z < hz - 13.8 + m);
        const yFree = (x, z, r) => Math.abs(x - hx) <= 22.5 - Math.min(r, 0.6) && Math.abs(z - hz) <= 17.5 - Math.min(r, 0.6) && !inHouse(x, z, r) && !liveEdge(x, z, r)
          && !treeAt.some(([tx, tz]) => Math.hypot(tx - x, tz - z) < 3.2 + r) && !yardOcc.some(([ox, oz, rr]) => Math.hypot(ox - x, oz - z) < rr + r);
        // washing on a line strung from pole to pole (4.5 m poles): sheets and shirts pegged along it, each streaming down the wind
        const washing = (pts, base) => {
          const top = base + 4.5;
          for (let q = 0; q < pts.length; q++) {
            const [x, z] = pts[q]; tg.th = 6; tg.prism(5, 0.1, 0.07, base, top, pole, x, z, false);
            if (!q) continue;
            const [x0, z0] = pts[q - 1], mx = (x0 + x) / 2, mz = (z0 + z) / 2, seg = Math.hypot(x - x0, z - z0), nc = Math.floor((seg - 0.8) / 1.75);
            tg.th = 0; tg.beam([x0, top - 0.12, z0], [mx, top - 0.38, mz], 0.035, rope); tg.beam([mx, top - 0.38, mz], [x, top - 0.12, z], 0.035, rope);
            for (let c = 0; c < nc; c++) {
              const tt = (0.6 + c * 1.75 + yr.range(0, 0.5)) / seg, big = yr() < 0.45, hh = big ? yr.range(0.62, 0.85) : yr.range(0.36, 0.5), ln = big ? yr.range(2.3, 3.1) : yr.range(1.3, 1.9), col = yr.pick(cloth);
              fl.pen(x0 + (x - x0) * tt, top - 0.12 - 0.26 * Math.sin(Math.PI * tt) - hh - 0.04, z0 + (z - z0) * tt, ln, hh, col, big ? 0.12 : 0.3, 4);
            }
          }
          tg.th = 0;
        };
        // a drying rack running north and south, its middle at (x, z): three trestles under a rail, twelve strings of peeled persimmons
        const rack = (x, z, base, sides) => {
          const L = 6.2, top = base + 3.5;
          tg.th = 6;
          for (const e of [-1, 0, 1]) { const zz = z + e * L / 2; tg.beam([x - 0.95, base, zz], [x, top, zz], 0.07, pole); tg.beam([x + 0.95, base, zz], [x, top, zz], 0.07, pole); }
          tg.beam([x, top, z - L / 2 - 0.3], [x, top, z + L / 2 + 0.3], 0.07, pole); tg.beam([x - 0.6, base + 1.3, z - L / 2], [x - 0.6, base + 1.3, z + L / 2], 0.045, pole);
          tg.kind = 8;
          for (let q = 0; q < 12; q++) {
            const zz = z - L / 2 + 0.35 + q * 0.5, nf = 4 + Math.floor(yr() * 2.2), col = fruitC[q % 3]; strings++;
            for (let k = 0; k < nf; k++) { const hs = 0.36 + k * 0.46; tg.th = hs + 16 * (strings % 48); ball(tg, x, top - hs, zz, 0.2, sides, col); }
          }
          tg.kind = 2; tg.th = 0;
        };
        const rackFits = (x, z, base, r, fr) => { for (let dz = -3.3; dz <= 3.31; dz += 1.1) if (!fr(x, z + dz, r)) return false; return clearOfEye(x, z - 3.4, base, base + 3.6) && clearOfEye(x, z + 3.4, base, base + 3.6); };
        // the platform's open ground, a point every 1.3 m, nearest the low flight first
        const cand = [];
        for (let i = -17; i <= 17; i++) for (let j = -13; j <= 13; j++) { const x = hx + i * 1.3, z = hz + j * 1.3; cand.push([x, z, flightDist(x, z, -1e9, 12)]); }
        cand.sort((a, b) => a[2] - b[2]);
        const place = (fits) => { for (const c of cand) if (fits(c[0], c[1], c[2])) return c; return null; };
        await ctx.yield();
        // the long lines first: along the rim toward the dyke from its north corner southward for as long as the stand-off
        // holds, and along the side toward the canal
        {
          const rim = [], xr = hx + toP * 22.6;
          for (let z = hz + 17; z > hz - 17 && clearOfEye(xr, z, PT, PT + 4.5); z -= 5.6) rim.push([xr, z]);
          if (rim.length > 1) { washing(rim, PT); did.lines++; }
          let run = [];
          for (let q = 0; q <= 4; q++) {
            const x = hx - toP * 21.6 + toP * q * 8.45, z = hz - 16.6;
            if (!inHouse(x, z, 0.4) && !liveEdge(x, z, 0.3) && clearOfEye(x, z, PT, PT + 4.5)) { run.push([x, z]); yardOcc.push([x, z, 0.8]); } else { if (run.length > 1) { washing(run, PT); did.lines++; } run = []; }
          }
          if (run.length > 1) { washing(run, PT); did.lines++; }
        }
        await ctx.yield();
        const trees = [];
        for (const kind of ['rack', 'rack', 'tree', 'baskets', 'jars', 'tree', 'baskets', 'rack']) {
          await ctx.yield();
          if (kind === 'rack') {
            const c = place((x, z, d) => d >= 9 && rackFits(x, z, PT, 1.3, yFree)); if (!c) continue;
            for (let dz = -3.3; dz <= 3.31; dz += 1.1) yardOcc.push([c[0], c[1] + dz, 1.3]);
            rack(c[0], c[1], PT, 6); did.racks++;
          } else if (kind === 'tree') {
            const c = place((x, z, d) => d >= 9 && yFree(x, z, 1.7) && clearOfEye(x, z, PT, PT + 6.6)); if (!c) continue;
            const [tx, , tz] = [c[0], 0, c[1]]; yardOcc.push([tx, tz, 3.4]); trees.push([tx, tz]); did.trees++;
            g.beam([tx, PT, tz], [tx + 0.4, PT + 3.5, tz - 0.6], 0.24, plank);
            for (let b = 0; b < 8; b++) {
              const a = b * 0.8 + yr.range(0, 0.5), len = yr.range(2.3, 3.7), by = PT + 2.5 + b * 0.26, e = [tx + 0.4 + Math.cos(a) * len, by + len * 0.7, tz - 0.6 + Math.sin(a) * len - len * 0.25];
              g.beam([tx + 0.4, by, tz - 0.6], e, 0.075, plank);
              for (let k = 0; k < 3; k++) { const t = 1 - k * 0.22 * yr(); ball(fg, tx + 0.4 + (e[0] - tx - 0.4) * t + yr.range(-0.5, 0.5), by + (e[1] - by) * t - yr.range(0.15, 1.1), tz - 0.6 + (e[2] - tz + 0.6) * t + yr.range(-0.5, 0.5), 0.27, 7, orange, calyx); }
            }
          } else {
            const c = place((x, z, d) => d >= 4 && yFree(x, z, 1.6)); if (!c) continue;
            yardOcc.push([c[0], c[1], 1.6]); did.heaps++;
            for (let q = 0; q < 3; q++) {
              const a = q * 2.1 + yr.range(0, 0.6), x = c[0] + Math.cos(a) * 0.75, z = c[1] + Math.sin(a) * 0.75;
              if (kind === 'jars') roundJar(tg, x, z, PT, 0.95 + 0.2 * yr(), jar);
              else { tg.th = 0; tg.prism(10, 0.42, 0.55, PT, PT + 0.62, q % 2 ? wick : H('#6f4d24'), x, z, false); fg.prism(10, 0.52, 0.36, PT + 0.6, PT + 0.8, orange, x, z, false); fg.prism(10, 0.36, 0.04, PT + 0.8, PT + 0.93, fruitC[2], x, z, false, 0.3); }
            }
          }
        }
        if (trees.length) {                                          // a ladder left leaning in the first of the new trees
          const [tx, tz] = trees[0]; tg.th = 6;
          const a0 = [tx + 1.7, PT, tz + 0.9], a1 = [tx + 0.6, PT + 3.6, tz - 0.3], b0 = [tx + 1.5, PT, tz + 1.45], b1 = [tx + 0.4, PT + 3.6, tz + 0.25];
          tg.beam(a0, a1, 0.045, plank); tg.beam(b0, b1, 0.045, plank);
          for (let r = 1; r < 7; r++) { const t = r / 7; tg.beam([a0[0] + (a1[0] - a0[0]) * t, PT + 3.6 * t, a0[2] + (a1[2] - a0[2]) * t], [b0[0] + (b1[0] - b0[0]) * t, PT + 3.6 * t, b0[2] + (b1[2] - b0[2]) * t], 0.035, plank); }
          tg.th = 0;
        }
        await ctx.yield();
        // racks on plank floors in the pan: the strip 26 to 50 m left of the crown, from the hard's south wall to the bridge's foot
        {
          const sites = [];
          for (let z = 147.5; z >= 71; z -= 3.5) for (let lat = 26; lat <= 50; lat += 3.5) { const x = pathX(z) - lat; sites.push([x, z, flightDist(x, z, -1e9, 12)]); }
          sites.sort((a, b) => a[2] - b[2]);
          const panFree = (x, z, r) => groundAt(x, z)?.[0] === 'pan' && free(x, z, r);
          let n = 0;
          for (const [x, z, d] of sites) {
            if (n >= 3) break;
            if (d >= 9 && panFree(x, z, 2.0)) await ctx.yield();
            if (d < 9 || !rackFits(x, z, 0.34, 2.0, panFree)) continue;
            for (const dz of [-3.3, 0, 3.3]) take(x, z + dz, 2.0);
            tg.th = 6; tg.box(x, 0.2, z, 3.3, 0.28, 7.8, plank); tg.th = 0;
            rack(x, z, 0.34, 5); n++; did.panRacks++;
          }
        }
        await ctx.yield();
        // pennant poles: a timber mast on a stone foot, a persimmon-red pennant and a pale streamer rigid in the gale
        const pennantPole = (x, z, base, hgt, len) => {
          tg.th = 4; tg.box(x, base + 0.35, z, 0.9, 0.7, 0.9, H('#8d8a84'));
          tg.th = 6; tg.prism(6, 0.17, 0.09, base + 0.7, base + hgt, pole, x, z, false);
          tg.th = 0; tg.prism(6, 0.2, 0.2, base + hgt, base + hgt + 0.3, H('#b08a3c'), x, z, true);
          fl.pen(x, base + hgt - 0.75, z, len, 0.5, H('#d0481a'), 0.5, 5); fl.pen(x, base + hgt - 1.8, z, len * 0.5, 0.15, H('#f0e2c0'), 0.3, 4);
          tg.th = 0;
        };
        // (either side of the dyke at each foot of the bridge, wherever the stand-off allows; the bridge's setts run from z 70 to z 2)
        // (a pole stands where the flight keeps the yard's stand-off from it, or where the flight passes over it with room: see passOver)
        for (const zf of [71, 1]) for (const sd of [-1, 1]) { const x = pathX(zf) + sd * 4.7; if (clearOfEye(x, zf, 0, 13.4) || passOver(x, zf, 13.5)) { pennantPole(x, zf, 0, 13.2, 4.6); did.poles++; } }
        // (and along the platform's rim toward the canal, every 12.5 m from the corner nearest the dyke)
        for (let q = 0; q < 4; q++) { const x = hx + toP * (22.4 - q * 12.5), z = hz - 17.5; if (!liveEdge(x, z, 0.2) && clearOfEye(x, z, PT, PT + 11.4)) { pennantPole(x, z, PT, 11.3, 4.2); did.poles++; } }
        // (and a slim staff with a short pennant on every kerb post of the bridge that the stand-off allows)
        for (const [x, y, z] of bridgePosts) if (clearOfEye(x, z, y, y + 4.2) || passOver(x, z, y + 4.2)) {
          tg.th = 6; tg.prism(4, 0.055, 0.035, y + 1.1, y + 4.1, pole, x, z, false); tg.th = 0;
          fl.pen(x, y + 3.85, z, 1.9, 0.22, H('#d0481a'), 0.5, 3); did.staffs++;
        }
        await ctx.yield();
        // THE CANAL'S SOUTH QUAY: A RANK OF TALL BANNER MASTS. On the crown of the canal's south bank, a metre back from the
        // water, a mast stands every 22 m from 20 to 110 m east of the humpback bridge and from 10 to 54 m west of it: 18 to
        // 20 m of timber on a stone foot under a gilt ball, a 6 m persimmon pennant streaming from its head, and a yard
        // across the wind from which a long persimmon banner on a batten and a pale streamer hang and are blown out and
        // swung by the gale (the rack strings' own motion: each in its own time). A mast stands at its station if the
        // bank there is free of everything set down before it and the flight passes it with room (passOver); else at the
        // nearest such place along the quay within a quarter of the spacing; else not at all. Its own stream.
        // THE HEAD PENNANT'S REACH IS PART OF THE ROOM: wherever the walked flight is less than 5 m above a mast's head
        // it keeps, on the level, the pass-over distance and the pennant's own 6 m beyond it. A mast whose bank is free
        // within the quarter spacing but which only the pennant's reach keeps from standing there takes the nearest
        // station that has that room, up to half the spacing along the quay; the others stand where they stood.
        {
          const qr = own('quay-masts'), zq = CANAL_Z - 13.1, gilt = H('#b08a3c'), red = H('#d0481a'), pale = H('#f0e2c0').multiplyScalar(0.85), stations = [];
          for (let d = 20; d <= 110; d += 22) stations.push(bridgeX - d);
          for (let d = 10; d <= 54; d += 22) stations.push(bridgeX + d);
          // cloth hung from a rail between x0 and x1 at height y: `len` metres long, in `seg` pieces; no is its string number
          // (its last piece is a forked tail in the second colour when `fork` is set)
          const hang = (x0, x1, y, z, len, seg, no, col, col2, fork) => {
            const V = (x, hs, c) => { tg.p.push(x, y - hs, z); tg.n.push(0, 0, 1); tg.c.push(c.r, c.g, c.b); tg.k.push(8, hs + 16 * no); }, xm = (x0 + x1) / 2;
            for (let q = 0; q < seg; q++) {
              const h0 = len * q / seg, h1 = len * (q + 1) / seg, last = q === seg - 1, c = last ? col2 : q % 2 ? col : col.clone().multiplyScalar(0.9);
              if (last && fork) for (const [a, b, d] of [[x0, h0, 0], [xm, h0, 0], [x0, h1, 0], [xm, h0, 0], [x1, h0, 0], [x1, h1, 0]]) V(a, b, c);
              else for (const [a, b] of [[x0, h0], [x1, h0], [x1, h1], [x0, h0], [x1, h1], [x0, h1]]) V(a, b, c);
            }
          };
          let no = 0; did.masts = 0; const mastX = did.mastX = [];
          for (const x0 of stations) {
            const hgt = qr.range(18, 20), drop = qr.range(5.6, 7.0), side = qr() < 0.5 ? -1 : 1;
            let x = null, reachOnly = false;
            for (let q = 0; q <= 20 && x === null; q++) {
              if (q > 10 && !reachOnly) break;
              const xc = x0 + (q % 2 ? 1 : -1) * Math.ceil(q / 2) * 1.1; if (!free(xc, zq, 1.4) || road.nearestXZ(xc, zq).dist < 7) continue;
              if (passOver(xc, zq, hgt + 0.5, 6.0)) x = xc; else if (passOver(xc, zq, hgt + 0.5)) reachOnly = true;
            }
            if (x === null) continue;
            mastX.push(Math.round(x * 10) / 10);
            take(x, zq, 1.4); did.masts++;
            tg.th = 4; tg.box(x, 0.45, zq, 1.3, 0.9, 1.3, H('#8d8a84'));
            tg.th = 6; tg.prism(6, 0.24, 0.11, 0.9, hgt, pole, x, zq, false); tg.beam([x - 1.75, hgt - 1.5, zq], [x + 1.75, hgt - 1.5, zq], 0.06, pole);
            tg.th = 0; tg.prism(5, 0.27, 0.27, hgt, hgt + 0.42, gilt, x, zq, true);
            fl.pen(x, hgt - 0.6, zq, 6.0, 0.6, red, 0.5, 6);
            hang(x + side * 0.4, x + side * 1.6, hgt - 1.56, zq, 0.5, 1, ++no, gilt, gilt, false);
            { const V2 = tg.p.length; hang(x + side * 0.4, x + side * 1.6, hgt - 2.06, zq, drop, 5, no, red, pale, true); for (let q = V2 / 3 * 2 + 1; q < tg.k.length; q += 2) tg.k[q] += 0.5; }
            tg.kind = 8; tg.th = drop * 0.8 + 0.5 + 16 * no; tg.beam([x + side * 0.34, hgt - 2.06 - drop * 0.8, zq], [x + side * 1.66, hgt - 2.06 - drop * 0.8, zq], 0.045, pole); tg.kind = 2;
            hang(x - side * 0.65, x - side * 1.1, hgt - 1.56, zq, drop * 0.7, 3, ++no, pale, pale, true);
            tg.th = 0;
          }
        }
        scene.userData.swc.yard = did;
      }
      await ctx.yield();
    }
    // THE HARD IS A QUAY, not a slab: a plank revetment down all four sides, a tarred edge beam, a planked walk along its
    // west and east edges, mooring posts with rope turns every five metres, a ladder down to the brine on each long side
    {
      const tar = H('#3a2e22'), rope = H('#b9a27c'), plank2 = H('#6b543a');
      for (const sd of [-1, 1]) {
        tg.th = 6; tg.box(sd * 17.07, 0.7, 170, 0.16, 1.5, 40.3, plank2); tg.box(sd * 16.72, 1.57, 170, 0.9, 0.05, 39.6, plank);
        tg.th = 0; tg.box(sd * 17.1, 1.56, 170, 0.34, 0.3, 40.5, tar);
        for (let q = 0; q < 9; q++) { const z = 151 + q * 4.75; tg.th = 6; tg.prism(6, 0.2, 0.17, -0.3, 2.5, plank2, sd * 17.42, z, false); tg.th = 0; tg.prism(6, 0.24, 0.24, 1.8, 2.02, rope, sd * 17.42, z, false); }
        tg.th = 6; tg.beam([sd * 17.5, 1.6, 166.6], [sd * 18.1, -0.2, 166.6], 0.05, plank); tg.beam([sd * 17.5, 1.6, 167.5], [sd * 18.1, -0.2, 167.5], 0.05, plank);
        for (let q = 0; q < 4; q++) { const t = (q + 0.5) / 4; tg.beam([sd * (17.5 + 0.6 * t), 1.6 - 1.8 * t, 166.6], [sd * (17.5 + 0.6 * t), 1.6 - 1.8 * t, 167.5], 0.04, plank); }
      }
      for (const [z, sz] of [[190.07, 1], [149.93, -1]]) for (const sd of [-1, 1]) {
        tg.th = 6; tg.box(sd * 11.2, 0.7, z, 11.9, 1.5, 0.16, plank2);
        tg.th = 0; tg.box(sd * 11.2, 1.56, z + sz * 0.03, 11.9, 0.3, 0.34, tar);
        for (let q = 0; q < 3; q++) { const x = sd * (6.6 + q * 4.6); tg.th = 6; tg.prism(6, 0.2, 0.17, -0.3, 2.5, plank2, x, z + sz * 0.35, false); tg.th = 0; tg.prism(6, 0.24, 0.24, 1.8, 2.02, rope, x, z + sz * 0.35, false); }
      }
      tg.th = 0;
    }
    scene.userData.swc.work = { sites: work.n, heaps: work.heaps.length, racks: work.racks.length, barrows: work.barrows.length, stakes: work.stakes.length, cormorants: work.corms.length, rakers: rakeAt.length };
    await ctx.yield();
    const yieldBuild = () => ctx.yield();
    const stdMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, side: THREE.DoubleSide });
    stdMat.onBeforeCompile = (sh) => {                               // the same cloud shadows cross the platforms, heaps, ridges and the ducks
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRW;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvec4 swcW = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nswcW = instanceMatrix * swcW;\n#endif\nvRW = (modelMatrix * swcW).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + ROAD_FN + CLOUD_FN).replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= cloudShade(vRW);');
      Object.assign(sh.uniforms, { uTime: T, uCloudK: shared.uCloudK, uWind: shared.uWind, uShadowCol: shared.uShadowCol, uSun: shared.uSun, uCloudE: shared.uCloudE });
    };
    stdMat.customProgramCacheKey = () => 'swc-std';
    const town = new THREE.Mesh(await g.buildAsync(yieldBuild), stdMat); town.name = 'town'; town.frustumCulled = false; scene.add(town);
    await ctx.yield();
    const townMat = makeSailMaterial(shared);
    const tgGeo = await tg.buildAsync(yieldBuild);
    await ctx.yield();
    const houses = new THREE.Mesh(instanceCarousels(tgGeo, ONE), townMat); houses.name = 'houses'; houses.frustumCulled = false; scene.add(houses);
    await ctx.yield();
    // the clutter's four kits, each drawn once for all its sites (instanced; the town's own textured shader: raked salt,
    // woven mat, planks), and the cormorants
    {
      const kitGeo = (fn) => { const k = new GB(); k.kind = 1; fn(k); return k.build(); };
      const wick = H('#8a6230'), wick2 = H('#6f4d24'), tar = H('#3a2e22'), netC = H('#5d5648');
      const heapGeo = kitGeo((k) => {                                // a raked heap, radius 1 and height 1: each site gives it its own
        k.th = 12;
        for (let i = 0; i < 3; i++) k.prism(8, (1 - i / 3) ** 0.92, i === 2 ? 0.05 : (1 - (i + 1) / 3) ** 0.92, i / 3, (i + 1) / 3, saltTones[i], 0, 0, false, i * 0.2);
        k.prism(8, 1.12, 1.0, 0, 0.1, saltSh, 0, 0, false);
      });
      const rackGeo = kitGeo((k) => {                                // a low drying rack: a reed mat with salt heaped on it, two baskets beside it
        k.th = 6; k.box(0, 0.17, 0, 3.5, 0.3, 4.7, plank);
        k.th = 13; k.quad([-1.7, 0.33, -2.3], [1.7, 0.33, -2.3], [1.7, 0.33, 2.3], [-1.7, 0.33, 2.3], matC);
        k.th = 12;
        for (let r = 0; r < 4; r++) { const x = -0.8 + (r % 2) * 1.6, z = -1.1 + Math.floor(r / 2) * 2.2; k.prism(6, 0.62, 0.34, 0.33, 0.58, salt, x, z, false); k.prism(6, 0.34, 0.03, 0.58, 0.84, salt2, x, z, false); }
        k.th = 0;
        k.prism(6, 0.42, 0.52, 0, 0.6, wick, 2.5, -1.2, false); k.prism(6, 0.5, 0.1, 0.6, 0.9, salt, 2.5, -1.2, false);
        k.prism(6, 0.42, 0.52, 0, 0.6, wick2, 2.7, 0.1, false); k.prism(6, 0.47, 0.03, 0.5, 0.46, tar, 2.7, 0.1, false);
      });
      const barrowGeo = kitGeo((k) => {                              // a barrow with its load on a plank run
        k.th = 6; k.box(0, 0.06, 0, 7.6, 0.09, 0.5, plank); k.box(4.6, 0.06, 1.3, 5.2, 0.09, 0.5, plank, 0.5);
        k.box(-1.6, 0.8, 0, 1.5, 0.34, 0.95, wick2);
        for (let q = 0; q < 3; q++) { const a = q * Math.PI / 3; k.beam([-2.6 - Math.cos(a) * 0.42, 0.55 - Math.sin(a) * 0.42, 0], [-2.6 + Math.cos(a) * 0.42, 0.55 + Math.sin(a) * 0.42, 0], 0.05, tar, 0.05); }
        for (const sd of [-1, 1]) { k.beam([-2.6, 0.55, sd * 0.14], [0.5, 1.02, sd * 0.46], 0.04, plank); k.beam([-0.9, 0.7, sd * 0.42], [-0.8, 0.1, sd * 0.46], 0.04, plank); }
        k.th = 12; k.prism(6, 0.62, 0.08, 0.97, 1.5, salt, -1.6, 0, false);
      });
      const stakeGeo = kitGeo((k) => {                               // four stakes in the water, a net's headline sagging between them
        k.th = 0;
        SK.forEach(([x, z, hh], i) => {
          k.beam([x - 0.1, -0.4, z], [x, hh, z], 0.1, stakeC);
          if (i < 3) { const [x1, z1, h1] = SK[i + 1], mx = (x + x1) / 2, mz = (z + z1) / 2, my = Math.min(hh, h1) - 1.25;
            k.beam([x, hh - 0.45, z], [mx, my, mz], 0.03, netC, 0.13); k.beam([mx, my, mz], [x1, h1 - 0.45, z1], 0.03, netC, 0.13); }
        });
      });
      await ctx.yield();
      for (const [geo, list, name] of [[heapGeo, work.heaps, 'work-heaps'], [rackGeo, work.racks, 'work-racks'], [barrowGeo, work.barrows, 'work-barrows'], [stakeGeo, work.stakes, 'work-stakes']]) {
        const m = new THREE.Mesh(instanceCarousels(geo, list), townMat); m.name = name; m.frustumCulled = false; scene.add(m);
      }
      await ctx.yield();
    }
    const cormGeo = (() => {
      const c = new GB(), col = H('#24262b'), col2 = H('#3a3c40');
      c.prism(5, 0.13, 0.22, 0, 0.6, col, 0, 0, true); c.beam([0, 0.55, 0], [0, 1.02, -0.14], 0.055, col); c.box(0, 1.07, -0.26, 0.1, 0.1, 0.32, col2); c.box(0, 1.05, -0.48, 0.05, 0.05, 0.16, H('#b08a3c'));
      for (const sd of [-1, 1]) c.quad([0, 0.56, 0], [sd * 0.42, 0.66, 0.1], [sd * 0.74, 0.02, 0.22], [sd * 0.1, 0.08, 0], col2);   // wings half open, hanging to dry
      return c.build();
    })();
    const NCM = work.corms.length, cormMesh = new THREE.InstancedMesh(cormGeo, stdMat, Math.max(1, NCM)), cdum = new THREE.Object3D();
    cdum.rotation.order = 'YXZ'; cormMesh.count = NCM; cormMesh.frustumCulled = false; cormMesh.name = 'cormorants'; scene.add(cormMesh);
    await ctx.yield();
    const fruitMesh = new THREE.Mesh(fg.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, emissive: H('#EE6A1C'), emissiveIntensity: 0.25 })); scene.add(fruitMesh);
    const winMesh = new THREE.Mesh(wg.build(), new THREE.MeshBasicMaterial({ color: L.win > 0 ? new THREE.Color(2.4, 1.3, 0.5).multiplyScalar(L.win) : H('#15130f') })); winMesh.frustumCulled = false; scene.add(winMesh);
    await ctx.yield();

    const sailMat = makeSailMaterial(shared, { haze: 1 }), shadowMat = makeSailMaterial(shared, { shadow: true, planeY: 0.07, strength: hour === 'day' ? 0.5 : night ? 0.4 : hour === 'dawn' ? 0.36 : 0.5 });
    const nearGeo = carouselGeometry({ post: true, sx: 2, sy: 6, spokes: true, rich: true, lamps: 8 });
    await ctx.yield();
    const farGeo = carouselGeometry({ post: true, sx: 1, sy: 1, spokes: false, lamps: 1, lite: true });
    await ctx.yield();
    const millNear = new THREE.Mesh(instanceCarousels(nearGeo, near), sailMat); millNear.frustumCulled = false; scene.add(millNear);
    // WHAT IS FAR PAYS FOR WHAT ROUND SEVENTEEN ADDS NEAR. A far mill's lantern keeps its four sides and loses its two end
    // caps; a mill beyond the haze (further from the whole flight than 73 times its radius: about 510 m for a mill of the
    // common size) is its sails, its lantern, its post and its pennant, without the masts and rings that are thinner
    // than half a pixel there; and the flattened shadow leaves out the lantern (a dot) and the upper ring, which the
    // shadow's own fade with height had already taken to a tenth. The images in the pans are drawn from the level they had.
    const farLean = carouselGeometry({ post: true, sx: 1, sy: 1, spokes: false, lamps: 1, lite: true, lampCap: false });
    await ctx.yield();
    // (and, in the hours when no lantern is lit, without its lantern: a third of a metre of dull horn half a kilometre off)
    const hazeGeo = carouselGeometry({ post: true, sx: 1, sy: 1, spokes: false, lamps: L.lamp > 0 ? 1 : 0, lite: true, lampCap: false, rings: [], masts: false, foot: false });
    const shadeGeo = carouselGeometry({ post: true, sx: 1, sy: 1, spokes: false, lamps: 0, lite: true, rings: [0.0] });
    await ctx.yield();
    const beyondHaze = (m) => flightDist(m.x, m.z) > 73 * m.R;       // (a mast or a ring is 0.044 R wide: under half a pixel at 1080 lines from here on)
    const millFar = new THREE.Mesh(instanceCarousels(farLean, far.filter((m) => !beyondHaze(m))), sailMat); millFar.frustumCulled = false; scene.add(millFar);
    await ctx.yield();
    const millHaze = new THREE.Mesh(instanceCarousels(hazeGeo, far.filter(beyondHaze)), sailMat); millHaze.name = 'mills-beyond-the-haze'; millHaze.frustumCulled = false; scene.add(millHaze);
    await ctx.yield();
    const millShadow = new THREE.Mesh(instanceCarousels(shadeGeo, shad), shadowMat); millShadow.frustumCulled = false; millShadow.renderOrder = 2; scene.add(millShadow);
    const crownMat = makeSailMaterial(shared, { shadow: true, planeY: 1.63, clip: [-1.7, 1.7, 206, 300] });
    const crownShadow = new THREE.Mesh(instanceCarousels(farGeo, near.filter((m) => m.z > 190)), crownMat); crownShadow.frustumCulled = false; crownShadow.renderOrder = 2; scene.add(crownShadow);
    // and the mills round the hard lay theirs across it
    const hardShadow = new THREE.Mesh(instanceCarousels(farGeo, near.filter((m) => m.z > 140 && m.z < 225)), makeSailMaterial(shared, { shadow: true, planeY: 1.6, clip: [-17, 17, 150, 190] }));
    hardShadow.frustumCulled = false; hardShadow.renderOrder = 2; scene.add(hardShadow);
    await ctx.yield();
    // every mill within 260 m of the route hangs doubled in its pan: the far-level carousel drawn again as an image on the brine
    const mirrorMat = makeSailMaterial(shared, { haze: 1, mirror: true });
    const millMirror = new THREE.Mesh(instanceCarousels(farGeo, near.concat(far.filter((m) => Math.min(road.nearestXZ(m.x, m.z).dist, path.nearestXZ(m.x, m.z).dist) < 260))), mirrorMat);
    millMirror.name = 'mill-mirror'; millMirror.frustumCulled = false; millMirror.renderOrder = 3; scene.add(millMirror);
    scene.userData.swc.mills = near.length + far.length;
    await ctx.yield();
    // washing, the cart's tarpaulin: cloth that streams in the same wind

    // ---- the Wind Pagoda, its shadow and its image in the moat -------------------------------------------------------
    const hero = await buildHero(ctx, { uniforms: shared, gustU0: U0 });
    hero.object.position.set(0, 0, -305); scene.add(hero.object);
    await ctx.yield();
    const mirror = hero.object.clone(); mirror.scale.y = -1; mirror.position.set(0, -0.02, -305); scene.add(mirror);
    mirror.traverse((o) => { o.frustumCulled = false; if (o.name === 'pagoda-rings') o.visible = false; });
    // the nine rings hang in the moat as an image drawn on the water (the way the mills hang in their pans), spread sideways
    // as ruffled water spreads a reflection, so the gold bands show either side of the causeway we ride on
    // (its own mesh, sixteen quads up each sail, so the ripple bends each image smoothly)
    const ringMirrorBase = carouselGeometry({ post: false, sx: 4, sy: 16, spokes: false, lamps: 8 });
    await ctx.yield();
    const ringMirrorGeo = instanceCarousels(ringMirrorBase, hero.rings);
    await ctx.yield();
    const ringMirror = new THREE.Mesh(ringMirrorGeo, makeSailMaterial(shared, { tan: '#C39248', fogK: 0.3, mirror: 2.1, cloud: 0.45 }));
    ringMirror.position.set(0, 0, -305); ringMirror.scale.x = 5.0; ringMirror.frustumCulled = false; ringMirror.renderOrder = 3; ringMirror.name = 'ring-mirror'; scene.add(ringMirror);
    await ctx.yield();

    // ---- boats: barges under sail on the moat and the canal, junks on the far sea, two sampans at the island steps -----------
    const arriveAt = (z) => U0 + (26 - z) / 2070 + 0.012;
    const tallBoat = (x, z, s, sail = 1) => ({ x, y: 0, z, R: 7 * s, y0: 1.97 * s, w: 10.4 * s * sail, h: 11.2 * s * (sail > 0.5 ? 1 : 0.001), phase: Math.PI, omega: 0, arrive: arriveAt(z), seed: (x * 0.013 + z * 0.007) % 1 });
    const NJ = Math.max(4, Math.round(6 * density)), seaP = (t, off, out) => out.set(-900 + 570 * t - 0.918 * off, 0, 420 - 1320 * t - 0.396 * off);
    const tallItems = [...moatB.map(([x, z]) => tallBoat(x, z, 1.3)), tallBoat(14.1, -277.6, 0.36, 0.001), tallBoat(-14.1, -277.6, 0.36, 0.001)];
    // the junks on the far sea are no two alike: each its own size (1.4 to 3.4 times a barge), its own place along the wall and off it
    const seaJ = []; for (let j = 0; j < NJ; j++) seaJ.push([(skyH(j, 3, 6) - 0.5) * 0.09, skyH(j, 9, 7) * 150, 2.3 * (0.62 + 0.85 * skyH(j, 7, 5))]);
    for (const [x, z] of farB) tallItems.push(tallBoat(x, z, 1.3));
    tallItems.push(tallBoat(crossB[0], crossB[1], 1.45));          // the junk that crosses ahead of us (see crossB)
    // THE CANAL'S BARGES UNDER MAT SAIL, BY A RULE OF THE CANAL. Salt barges, each with one battened mat lugsail on a
    // mast that stands above the bridge's parapet, a deck load of white salt under matting and someone at the sculling
    // oar, sail east along the canal from the lee of the western stockpile ridge to behind the eastern one, for ever: so
    // many of them, evenly spaced in time round that loop, driven by the gale on the world's clock and by nothing else.
    // THE FOLD IS THE ARCH'S AND THE CROSSING'S. A barge lowers its sail and lays its mast forward over the bow for the
    // humpback bridge, and keeps them laid until it is a hull's length past the line on which the flight crosses the
    // canal just east of the arch (the folding is the carousel shader's, from where the boat is along the canal: see the
    // hero part): coming to the bridge the rig is down before the laid mast's head would reach the parapet; beyond the
    // arch and that line the mast rises, and the sail after it (see rigE below).
    // THE FLEET'S LANE IS A RULE OF THE CANAL, BUILT ONCE: one line of z for the whole of it. The canal's own low barges
    // keep its middle (lowZ), from the western end of their run to the eastern, and a barge that changed sides anywhere
    // along that run would sail through one of them: so through the whole of it the fleet keeps ONE side of them. It
    // takes the water south of them (the line the flight tops by the most, where the tallest build has the flight's room)
    // if nothing stands in that line: no fisherman's stake row with its nets, no stilt stage with its boom and lift net,
    // no fishing cormorant's circle (each a box on the water, see `things`; a hull must clear every one by 0.4 m). Else
    // it takes the water north of them, as near them as a hull and 0.3 m allow, if that line is clear. Where both
    // lines hold a thing (no seed of the first forty; a few convoy years beyond them) NO FLEET SAILS THE CANAL THAT YEAR:
    // the canal carries its low barges alone, so that no barge ever sails through a thing or through another barge.
    // The build is the largest, from the 24 m barge down by twentieths to the 19 m
    // one, that clears every thing along the line it sails and whose masthead has the flight's room there (passOver at
    // every two metres of it); its rig stands whatever the build. What the record keeps: `least`, the least clear water
    // between the hull's swept band and any thing along the lane sailed, and `through` (always 0: a year with no clear line has no fleet).
    // IN A YEAR THE FLEET SAILS, THE REACH BEYOND THE ARCH ALWAYS HOLDS TWO SAILS. On the open reaches the barges run at 7.7 m/s; within two hundred
    // metres of the bridge they hold back, to the speed at which the reach east of the arch where the sail stands whole
    // (from the end of the fold to the end of the slow water, 110 m out and `past` more: see the fold below) is never without two of them: one barge (or one
    // convoy's last) and the next lie half that reach apart. In a convoy year they come in threes, two lengths apart.
    const lowZ = (j) => 36 + (j % 2) * 3 - 1, NC = convoy ? 3 : 1;      // the canal's low barges: each one's line, and how many
    const canal = (() => {
      const cr = own('canal-barges'), xAt = (r) => r[0] + (r[2] - r[0]) * (CANAL_Z - r[1]) / (r[3] - r[1]);      // where a ridge's axis crosses the canal
      const xW = xAt(RIDGES[0]), xE = xAt(RIDGES[1]), len = Math.floor(xW - xE), tau = new Float32Array(len + 1);
      const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
      // what stands in the canal, as boxes [x, z, half length along the canal, half width across it]
      const things = [];
      for (const k of work.stakes) if (Math.abs(k.z - CANAL_Z) < 13) { const c = Math.abs(Math.cos(k.phase)), sn = Math.abs(Math.sin(k.phase)); things.push([k.x, k.z, (4.7 * c + 0.45 * sn) * k.R, (4.7 * sn + 0.45 * c) * k.R]); }
      for (const [x, z, rot] of work.stages) {
        if (Math.abs(z - CANAL_Z) > 22) continue;
        let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; const cs = Math.cos(rot), sn = Math.sin(rot);
        for (const [lx, lz] of [[-1.5, -2.5], [1.5, -2.5], [-1.5, 2.5], [1.5, 2.5], [-1.4, -9], [1.8, -9]]) { const px = x + lx * cs + lz * sn, pz = z - lx * sn + lz * cs; x0 = Math.min(x0, px); x1 = Math.max(x1, px); z0 = Math.min(z0, pz); z1 = Math.max(z1, pz); }
        if (z1 > CANAL_Z - 12 && z0 < CANAL_Z + 12) things.push([(x0 + x1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (z1 - z0) / 2]);
      }
      for (const k of work.corms) if (k[4] === 1 && Math.abs(k[2] - CANAL_Z) < 15) things.push([k[0], k[2], 2.9, 2.9]);
      const HB = 2.392, HL = 14.3, CL = 0.4;                         // a barge of build 1: half its beam, half its length with the oar and the laid mast; the clear water it keeps
      const head = (build) => (13.6 + 0.56) * build;                 // a masthead and its pennant above the water, for a barge of that build
      // (the flight's room along a line: asked at every two metres of the canal that lie within 20 m of the walked flight's
      // own span of x; further off no step of the walk is near enough to matter)
      let fx0 = 1e9, fx1 = -1e9; for (let i = 0; i <= RTN; i++) { fx0 = Math.min(fx0, rtX[i]); fx1 = Math.max(fx1, rtX[i]); }
      const room = (z0, build) => { for (let x = xE + 2 * Math.max(0, Math.ceil((fx0 - 20 - xE) / 2)); x <= Math.min(xW, fx1 + 20); x += 2) if (!passOver(x, z0, head(build))) return false; return true; };
      let lowS = 1e9, lowN = -1e9; for (let j = 0; j < NC; j++) { lowS = Math.min(lowS, lowZ(j) - HB); lowN = Math.max(lowN, lowZ(j) + HB); }
      const lineS = () => CANAL_Z - 6.2, lineN = (b) => lowN + 0.3 + HB * b;
      // the clear water a straight line leaves between the hull and the nearest thing; whether it lies in open water
      const clearOf = (z0, b) => { let m = 99; for (const t of things) m = Math.min(m, Math.abs(t[1] - z0) - t[3] - HB * b); return m; };
      const fits = (z0, b) => clearOf(z0, b) >= CL && z0 - HB * b >= CANAL_Z - 9.8 && z0 + HB * b <= CANAL_Z + 9.8 && (z0 + HB * b <= lowS || z0 - HB * b >= lowN);
      const BUILDS = [1.1, 1.05, 1.0, 0.95, 0.9, 0.85];
      // south of the low barges the line is one; north of them it is the nearest to them, a quarter of a metre at a time, on
      // which the build has the flight's room (the largest build first; if none has that room anywhere, the smallest on its nearest line)
      const pick = (line, side, wide) => {
        let last = null;
        for (const b of BUILDS) for (let z = line(b), first = true; first || (wide && z + HB * b <= CANAL_Z + 9.8); z += 0.25, first = false) {
          if (!fits(z, b)) continue; if (room(z, b)) return { z, build: b, side }; if (!last || b < last.build) last = { z, build: b, side };
        }
        return last;
      };
      let lane = pick(lineS, 'south', false) || pick(lineN, 'north', true); const through = 0, sails = !!lane;
      if (!lane) lane = { z: lineS(), build: 0.85, side: 'none' };      // both lines hold a thing: no fleet sails that year (see above); this line and build stand in the record only
      const build = lane.build;
      // the least clear water between the hull's swept band and any thing, along the lane sailed
      let least = 99;
      for (const k of things) for (let i = 0; i <= len; i++) { const x = xW - i; if (Math.abs(x - k[0]) <= k[2] + HL * build) least = Math.min(least, Math.abs(lane.z - k[1]) - k[3] - HB * build); }
      const hull = 22 * build;
      // the fold, in metres of canal from the bridge's middle (the parapets stand 2.8 m either side of it; the mast's heel
      // is 1.6 m forward of the barge's middle and the mast lies forward at 84 degrees)
      // East of the arch the rig stays laid until the barge is a hull's length (22 m) past THE LINE THE FLIGHT CROSSES THE
      // CANAL ON (the walked route's step nearest the canal's line: a keep-clear of the route laid once at build time, the same at
      // every clock and on every seed, whether or not the eye is there; it is NOT passOver and narrower than it: it reads that one step and has no height term, and passOver itself passes there): a sail set under that line stood so near under the
      // flight that the frame's bottom cut it. `past` is how far that moves the end of the fold east of the arch's own.
      let iF = 0; for (let i = 1; i <= RTN; i++) if (Math.abs(rtZ[i] - CANAL_Z) < Math.abs(rtZ[iF] - CANAL_Z)) iF = i;
      const heel = 1.6 * build, laid = 12 * build * Math.sin(1.466), rigA = 2.8 + 2 - heel, rigE = Math.max(rigA, bridgeX - rtX[iF] + 22 - 6.5), past = rigE - rigA, rigW = 2.8 + 1 + heel + laid;
      const reach = 110 + past - (rigE + 17), groups = !sails ? 0 : convoy ? 6 : 16, each = convoy ? 3 : 1, follow = 2 * hull;
      // one lap of the loop at speed v near the bridge, a metre at a time (and, given t, the seconds from the western ridge);
      // east of the arch the slow water begins `past` metres further out, so the reach that holds two sails keeps its length
      const lap = (v, t) => { let a = 0; for (let i = 0; i < len; i++) { if (t) t[i] = a; const dx = xW - i - 0.5 - bridgeX; a += 1 / (v + (7.7 - v) * sm(110, 200, dx >= 0 ? dx : Math.max(0, -dx - past))); } if (t) t[len] = a; return a; };
      let lo = 1.2, hi = 7.7;
      for (let q = 0; q < 24; q++) { const v = (lo + hi) / 2; if (v * lap(v) / groups > reach / 2 + (each - 1) * follow) hi = v; else lo = v; }
      const period = lap(lo, tau), phase = cr(), seeds = [];
      for (let i = 0; i < groups * each; i++) seeds.push(cr());
      return { xW, len, tau, period, groups, each, phase, seeds, z: lane.z, side: lane.side, build, room: room(lane.z, build), rigE, rigW, speed: lo, followT: follow / lo, first: tallItems.length, n: groups * each,
        things: things.length, least: sails && things.length ? Math.round(least * 100) / 100 : null, through, lowGap: Math.round(Math.min(Math.abs(lane.z - HB * build - lowN), Math.abs(lowS - lane.z - HB * build)) * 100) / 100 };
    })();
    for (let i = 0; i < canal.n; i++) { const b = tallBoat(canal.xW, canal.z, canal.build); b.seed = canal.seeds[i]; tallItems.push(b); }
    // (the junks on the far sea come last of the instances: beyond a kilometre they throw no shadow and hang no image that
    // can be seen, so the two passes that draw shadows and images stop short of them)
    const seaFirst = tallItems.length;
    for (let j = 0; j < NJ; j++) tallItems.push(tallBoat(-600, -600, seaJ[j][2]));
    shared.uRigE.value = canal.rigE; shared.uRigW.value = canal.rigW;
    scene.userData.swc.canal = { lane: Math.round(canal.z * 100) / 100, side: canal.side, bent: false, build: Math.round(canal.build * 100) / 100, room: canal.room, things: canal.things, least: canal.least, through: canal.through, lowGap: canal.lowGap,
      speed: canal.speed, period: canal.period, sailWholeFrom: canal.rigE + 17, barges: canal.n };
    await ctx.yield();
    // (the sail has eight columns and a row for every batten panel, so its belly is a curve from luff to leech)
    const tallGeo = instanceCarousels(boatGeometry({ sx: 8, sy: 6, fold: true }), tallItems);
    tallGeo.attributes.iPos.setUsage(THREE.DynamicDrawUsage);
    const boatMat = makeSailMaterial(shared);
    const tallBoats = new THREE.Mesh(tallGeo, boatMat); tallBoats.frustumCulled = false; scene.add(tallBoats);
    // (the shadows and the images are drawn from the same instances with the boat's plainer geometry: no figure, sheets or wake)
    const tallImage = new THREE.InstancedBufferGeometry();
    { const ib = boatGeometry({ sx: 2, sy: 6, fold: true, image: true }); for (const k in ib.attributes) tallImage.setAttribute(k, ib.attributes[k]);
      for (const k of ['iPos', 'iDim', 'iSpin']) tallImage.setAttribute(k, tallGeo.attributes[k]); tallImage.instanceCount = seaFirst; }
    const tallShadow = new THREE.Mesh(tallImage, shadowMat); tallShadow.frustumCulled = false; tallShadow.renderOrder = 2; scene.add(tallShadow);
    // every sail on the moat hangs doubled in it, as the mills hang in their pans
    const tallMirror = new THREE.Mesh(tallImage, makeSailMaterial(shared, { mirror: 1.2 })); tallMirror.frustumCulled = false; tallMirror.renderOrder = 3; tallMirror.name = 'boat-mirror'; scene.add(tallMirror);
    await ctx.yield();
    const lowItems = [];
    for (let j = 0; j < NC; j++) lowItems.push({ x: 70 + j * 36, y: 0, z: lowZ(j), R: 7, y0: 2.2, w: 7.0, h: 2.7, phase: Math.PI, omega: 0, arrive: U0, seed: 0.3 + j * 0.21 });
    // and salt lighters lying to along the last of the causeway and out in the moat under the flight
    for (const [x, z, sd] of lighters) lowItems.push({ x, y: 0, z, R: 7, y0: 2.2, w: 7.0, h: 2.7, phase: Math.PI, omega: 0, arrive: arriveAt(z), seed: sd });
    const lowGeo = instanceCarousels(boatGeometry({ sx: 2, sy: 3, mast: 5.3, boom: 2.4 }), lowItems);
    lowGeo.attributes.iPos.setUsage(THREE.DynamicDrawUsage);
    const lowBoats = new THREE.Mesh(lowGeo, boatMat); lowBoats.frustumCulled = false; scene.add(lowBoats);
    const lowShadow = new THREE.Mesh(lowGeo, shadowMat); lowShadow.frustumCulled = false; lowShadow.renderOrder = 2; scene.add(lowShadow);
    const tallP = tallGeo.attributes.iPos.array, lowP = lowGeo.attributes.iPos.array, bargeGaze = new THREE.Vector3(70, 2, 36);
    await ctx.yield();

    // ---- life: reeds, grass, seepweed, willows, birds, blown salt, smoke ----------------------------------------------
    const wind = flora.makeWind({ direction: [WX, WZ], strength: 1.8, speed: 1.5 });
    const onDyke = (z) => (z > 74 && !(z < 194 && z > 146)) || (z < -4 && z > -96);
    // the distance to the road, as road.nearestXZ(x, z).dist gives it (the same samples, the same arithmetic, the same number)
    // but looking only at the samples near in z: the road runs steadily south, so a sample further off in z than the best
    // distance so far cannot be nearer. The kit asks for the ground height tens of thousands of times while it sows.
    const RN = 320, rsx = new Float32Array(RN + 1), rsz = new Float32Array(RN + 1);
    for (let i = 0; i <= RN; i++) { road.curve.getPointAt(i / RN, tmpV); rsx[i] = tmpV.x; rsz[i] = tmpV.z; }
    let roadSouth = true; for (let i = 1; i <= RN; i++) if (rsz[i] > rsz[i - 1]) roadSouth = false;
    const roadDist = (x, z) => {
      if (!roadSouth) return road.nearestXZ(x, z).dist;
      let lo = 0, hi = RN + 1; while (lo < hi) { const m = (lo + hi) >> 1; if (rsz[m] > z) lo = m + 1; else hi = m; }
      let best = Infinity;
      for (let i = lo; i <= RN; i++) { const dz = rsz[i] - z, dz2 = dz * dz; if (dz2 >= best) break; const dx = rsx[i] - x, d = dx * dx + dz2; if (d < best) best = d; }
      for (let i = lo - 1; i >= 0; i--) { const dz = rsz[i] - z, dz2 = dz * dz; if (dz2 >= best) break; const dx = rsx[i] - x, d = dx * dx + dz2; if (d < best) best = d; }
      return Math.sqrt(best);
    };
    const dykeY = (x, z) => Math.max(0, Math.min(1.6, 1.6 * (4.9 - roadDist(x, z)) / 3.2));
    await ctx.yield();
    // the leaf atlas is drawn by the kit in short steps and kept, so makeLeafTexture itself does no pixel work
    const yieldNow = () => ctx.yield(), leafOpts = { size: 256, seed: 3 };
    await flora.prepareLeafTexture(leafOpts, yieldNow, 1);
    const leafMap = flora.makeLeafTexture(leafOpts);
    await ctx.yield();
    const floraMat = flora.windMaterial({ wind, map: leafMap, backlightTint: '#f0d890' });
    await ctx.yield();
    // the reeds in four sowings and the grass in nine, so that no one kit call holds the page for long
    const reedOpts = (r) => ({ rng: r, path: road, count: Math.round(132 * detail), radius: 8.5, corridor: 3.7, wind, material: floraMat, scale: [1.0, 1.7],
      heightAt: dykeY, density: (x, z) => (onDyke(z) && !(z > 60 && Math.abs(x - camX(z)) < 4.2) && !(z > 274 && Math.abs(x) < 6.5) && !(z < -5 && z > -46 && path.nearestXZ(x, z).dist < 4.6) ? 1 : 0), colors: ['#C9A24E', '#b8923e', '#d9bd70'] });
    // (each sowing's three reed shapes are made here, one at a time, exactly as the kit would make them from the same
    // random stream, and handed in as variants: the same reeds, with the page handed back between the pieces)
    const reedShapes = async (r) => { const v = r.fork('variants'), out = []; for (let i = 0; i < 3; i++) { out.push(flora.reedGeometry({ rng: v })); await ctx.yield(); } return out; };
    const reedRngA = rng.fork('reeds'), reedVarA = await reedShapes(reedRngA);
    const reeds = flora.makeReeds({ ...reedOpts(reedRngA), variants: reedVarA });
    scene.add(reeds.object);
    await ctx.yield();
    const reedRngB = rng.fork('reeds-b'), reedVarB = await reedShapes(reedRngB);
    const reeds2 = flora.makeReeds({ ...reedOpts(reedRngB), variants: reedVarB });
    scene.add(reeds2.object);
    await ctx.yield();
    const reedRngC = reedRngB.fork('c'), reedVarC = await reedShapes(reedRngC);
    const reeds3 = flora.makeReeds({ ...reedOpts(reedRngC), variants: reedVarC });
    scene.add(reeds3.object);
    await ctx.yield();
    const reedRngD = reedRngB.fork('d'), reedVarD = await reedShapes(reedRngD);
    const reeds4 = flora.makeReeds({ ...reedOpts(reedRngD), variants: reedVarD });
    scene.add(reeds4.object);
    await ctx.yield();
    // and a belt at the foot of the western hamlet's platform, which the dive brings us past (its own random stream, forked
    // from one that is finished with)
    const reeds5 = flora.makeReeds({ rng: reedRngD.fork('hamlet'), bounds: [43.3, -57, 46.7, -23], count: Math.round(44 * detail), corridor: 0, wind, material: floraMat, scale: [0.9, 1.45],
      heightAt: () => 0, variants: reedVarD, colors: ['#C9A24E', '#b8923e', '#d9bd70'] });
    scene.add(reeds5.object);
    await ctx.yield();
    const reeds6 = flora.makeReeds({ rng: reedRngD.fork('canal'), bounds: [-64, 49.2, -19, 53.2], count: Math.round(70 * detail), corridor: 0, wind, material: floraMat, scale: [0.9, 1.4],
      heightAt: () => 0, variants: reedVarC, colors: ['#C9A24E', '#b8923e', '#d9bd70'] });
    scene.add(reeds6.object);
    await ctx.yield();
    // dry tawny grass along the crown edges, laid over by the wind
    const grRng = rng.fork('grass'), grassOpts = (r, n) => ({ rng: r, path: road, count: Math.round(n * detail), radius: 4.9, bias: 1, heightAt: dykeY, heightStep: 1,
      density: (x, z, lat) => (onDyke(z) && lat > 1.85 && lat < 4.6 ? 1 : 0), wind, map: leafMap, root: '#6b5630', tip: '#d6ba70', dry: '#e2cc88', dryAmount: 0.6,
      flowers: 0, chunks: 2, fade: [60, 90], height: [0.35, 0.8], width: [0.7, 1.3] });
    // the first sowing is small because it also carries what the kit sets up once; each is built by the kit in short steps
    // (the same carpet, the same random draws) so that a cold first call cannot hold the page
    const grasses = [];
    for (const [fk, n] of [['', 300], ['b', 520], ['c', 520], ['d', 520], ['e', 520], ['f', 520], ['g', 520], ['h', 520], ['i', 520]]) {
      const gr = await flora.makeGrassAsync(grassOpts(fk ? grRng.fork(fk) : grRng, n), yieldNow, 1);
      scene.add(gr.object); grasses.push(gr);
      await ctx.yield();
    }
    // seepweed in low wine-rose mats on the shoulders (crimson and twice as thick in a red year)
    const weedGeo = flora.grassTuftGeometry({ rng: rng.fork('weedgeo'), cards: 3, width: 1.5, height: 0.42, root: weedYear ? '#4a1520' : '#4a2230', tip: weedYear ? '#9a2c3c' : '#8a4656' });
    const seepweed = flora.makeScatter({ rng: rng.fork('seepweed'), path: road, variants: [weedGeo], count: Math.round((weedYear ? 1300 : 650) * detail), radius: 6.6, corridor: 3.3, clear: 0,
      heightAt: dykeY, density: (x, z) => (onDyke(z) ? 1 : 0), material: floraMat, scale: [0.8, 1.7], tint: 0.2, falloff: 0 });
    scene.add(seepweed.object);
    await ctx.yield();
    // two old willows streaming at the foot of the bridge
    const willowGeo = flora.willowGeometry({ rng: rng.fork('willow'), height: 11, detail: 1, flex: 2.2, leaf: '#b9a246', leafLight: '#e2cf78', leafDark: '#80702c' });
    for (const [wx, wz, ws] of [[-47, 55, 1.25], [-2, 50.5, 1.1]]) { const w = new THREE.Mesh(willowGeo, floraMat); w.position.set(wx, 0.2, wz); w.scale.setScalar(ws); w.rotation.y = wx; scene.add(w); }
    await ctx.yield();
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('gulls'), species: 'gulls', count: Math.max(8, Math.round(16 * density)), center: [-24, 12, 46], radius: 22, size: 2.0, lod: 'low' }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('gulls2'), species: 'gulls', count: Math.max(8, Math.round(14 * density)), center: [84, 17, -176], radius: 44, size: 1.7, lod: 'low' }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('avocets'), species: 'gulls', count: Math.round(50 * density), size: 0.9, lod: 'low', body: '#f4f4f0', wingC: '#17171b', tip: '#101014',
      spread: [14, 5, 30], cross: { path, u: U0 + 0.04, lead: 46, height: 2, angle: 16, side: -1, span: 280, duration: DUR } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('geese'), species: 'geese', count: 17, size: 1.5, cross: { path, u: uGoose, lead: 120, height: 42, angle: 12, side: -1, span: 700, duration: DUR } }));
    await ctx.yield();
    fauna.add(F.makeWaders({ rng: rng.fork('egrets'), species: 'egret', count: 8, size: 1.5, center: [-34, 0, 228], radius: 16, level: 0 }));
    await ctx.yield();
    fauna.add(F.makeWaders({ rng: rng.fork('feeders'), species: 'egret', count: Math.round(40 * density), size: 0.75, center: [-23, 0, 121], radius: 9.5, level: 0, wing: '#15151a', cap: '#15151a' }));
    await ctx.yield();
    fauna.add(F.makeWaders({ rng: reedRngD.fork('bank'), species: 'egret', count: 7, size: 1.7, center: [-27, 0, 62], radius: 7.5, level: 0 }));
    await ctx.yield();
    // the pan beside the quay: egrets stalking it, a thin belt of reed at the quay's foot
    fauna.add(F.makeWaders({ rng: nx.fork('quay-waders'), species: 'egret', count: 9, size: 1.25, center: [WADE[0], 0, WADE[1]], radius: 9.5, level: 0 }));
    await ctx.yield();
    const reeds7 = flora.makeReeds({ rng: nx.fork('quay-reeds'), bounds: [19.7, 153, 22.6, 187], count: Math.round(24 * detail), corridor: 0, wind, material: floraMat, scale: [0.8, 1.25],
      heightAt: () => 0, variants: [reedVarD[0]], colors: ['#C9A24E', '#b8923e', '#d9bd70'] });
    scene.add(reeds7.object);
    await ctx.yield();
    // gulls put up from the moat ahead of us for as long as we fly over its water (the moat's own bounds, clear of the
    // causeway): one small lot every 30 m of the flight there, each rising from the water, passing close under the eye
    // and on up behind us, from the right and the left by turns. The walk of the flight (two-metre steps) says where.
    { const gA = nx.fork('moat-gulls'), gB = nx.fork('turn-gulls'), gw = 30 / path.length; let wet = 0, k = 0;
      for (let i = 0; i <= RTN; i++) {
        if (Math.abs(rtX[i]) >= 130 || rtZ[i] >= -100 || rtZ[i] <= -330 || road.nearestXZ(rtX[i], rtZ[i]).dist < 7) continue;
        if (++wet % 15 !== 8) continue;
        const yEye = rtY[Math.min(RTN, i + 11)], odd = k++ % 2;
        fauna.add(F.makeFlock({ rng: (odd ? gB : gA).fork('lot' + k), species: 'gulls', form: 'loose', count: Math.max(4, Math.round(5 * density)), size: odd ? 2.1 : 1.5, lod: 'low', spread: [7, 2, 9],
          cross: { path, u: i / RTN, window: gw, lead: 22, height: -1.5, angle: 46, side: odd ? -1 : 1, span: 140, rise: 2 * Math.max(0.5, yEye - 2.3), bow: 0 } }));
        await ctx.yield();
      } }
    // avocets and egrets wading on the two shoals left of the causeway
    fauna.add(F.makeWaders({ rng: rng.fork('shoalA'), species: 'egret', count: Math.round(16 * density), size: 0.8, center: [-27, 0, -140], radius: 6, level: 0.02, wing: '#15151a', cap: '#15151a' }));
    await ctx.yield();
    fauna.add(F.makeWaders({ rng: rng.fork('shoalB'), species: 'egret', count: Math.round(11 * density), size: 1.45, center: [-29, 0, -222], radius: 6, level: 0.02 }));
    await ctx.yield();
    if (rare) {
      const craneLook = { species: 'geese', form: 'line', size: 2.2, body: '#f6f6f2', belly: '#ffffff', wingC: '#f0f0ec', tip: '#111114', neckC: '#15151a', head: '#c0202a' };
      fauna.add(F.makeFlock({ rng: rng.fork('cranes'), ...craneLook, count: 40,
        spacing: 1.1, cross: { path, u: uC + 0.03, lead: 34, height: 1, angle: 8, side: 1, offset: -30, bow: 0, span: 520, duration: DUR } }));
      await ctx.yield();
      // sixteen of them wheel once round storeys three to five as we come down the moat (timed from the place on the route abreast of the moat's great mill): a bowed route round the tower
      const round = { length: 1, posAtDist: (d, out) => out.set(0, 0, -305), tangentAtDist: (d, out) => out.set(-1, 0, 0) };
      fauna.add(F.makeFlock({ rng: rng.fork('cranes2'), ...craneLook, size: 3.4, count: 16,
        cross: { path: round, u: uJunk, window: 0.15, lead: 0, height: 44, angle: 0, side: 1, offset: 36, bow: -100, span: 190, rise: -14 } }));
      await ctx.yield();
    }
    const saltAir = fx.makeParticles({ rng: rng.fork('salt'), preset: 'dust', time: T, count: Math.round(2600 * density * detail), box: [54, 2.4, 76], follow: 'xz', center: [0, 2.4, 0], velocity: [WX * 17, 0.05, WZ * 17],
      mode: 'streak', stretch: 0.028, near: [3, 8], size: [0.022, 0.055], colors: night ? ['#aab8e0', '#8fa0d0', '#c8d2f0'] : ['#fff6e6', '#ffe8c4', '#ffffff'], opacity: 0.2 });
    scene.add(saltAir.object);
    await ctx.yield();
    const straw = fx.makeParticles({ rng: reedRngD.fork('straw'), preset: 'dust', time: T, count: Math.round(520 * density * detail), box: [76, 5, 96], follow: 'xz', center: [0, 3.0, 0], velocity: [WX * 25, 0.3, WZ * 25],
      turbulence: [1.4, 0.9, 0.5], mode: 'streak', stretch: 0.022, near: [5, 12], size: [0.05, 0.12], colors: night ? ['#8a94b8', '#737da0', '#a0a8c8'] : ['#E8C078', '#c99a4a', '#f4dc9c'], opacity: 0 });
    scene.add(straw.object);
    await ctx.yield();
    // salt smoking off the crests of the two big cones on the hard, smoke torn flat from two chimneys, a sheet of salt behind the gust front
    const puffC = night ? '#8c9ac4' : '#fff3e0';
    const mists = [
      fx.makeMist({ rng: rng.fork('plumeA'), time: T, count: 10, center: [-13 + WX * 13, 10.3, 182 + WZ * 13], area: [5, 2.5, 26], size: [3, 6.5], color: puffC, opacity: 0.2, drift: [WX * 7, 0, WZ * 7], flatten: 0.6 }),
      fx.makeMist({ rng: rng.fork('plumeB'), time: T, count: 10, center: [15 + WX * 13, 10.3, 158 + WZ * 13], area: [5, 2.5, 26], size: [3, 6.5], color: puffC, opacity: 0.2, drift: [WX * 7, 0, WZ * 7], flatten: 0.6 }),
    ];
    await ctx.yield();
    for (const c of [chimneys[1], chimneys[2]]) {
      mists.push(fx.makeMist({ rng: rng.fork('smoke'), time: T, count: 9, center: [c[0] + WX * 9, c[1] + 0.5, c[2] + WZ * 9], area: [2.6, 1.4, 18], size: [1.6, 4.4], color: night ? '#6a7498' : '#cdc6be', opacity: 0.34,
        drift: [WX * 6, 0.15, WZ * 6], flatten: 0.6 }));
      await ctx.yield();
    }
    {                                                               // (the chimney of the hamlet beside the dyke smokes too)
      const c = chimneys[0];
      mists.push(fx.makeMist({ rng: own('hamlet-smoke'), time: T, count: 9, center: [c[0] + WX * 9, c[1] + 0.5, c[2] + WZ * 9], area: [2.6, 1.4, 18], size: [1.6, 4.4], color: night ? '#6a7498' : '#cdc6be', opacity: 0.34,
        drift: [WX * 6, 0.15, WZ * 6], flatten: 0.6 }));
      await ctx.yield();
    }
    const gustMist = fx.makeMist({ rng: rng.fork('gust'), time: T, count: 30, center: [-10, 2.4, 1000], area: [170, 3.6, 52], size: [7, 16], color: puffC, opacity: 0.1, drift: [0, 0, -16], flatten: 0.5 });
    gustMist.object.frustumCulled = false; mists.push(gustMist);
    for (const m of mists) scene.add(m.object);
    await ctx.yield();
    // lamps (first light and night): halos at the gate lanterns, on the mill posts along the dyke and in the hamlets
    let glows = null;
    if (L.lamp > 0) {
      const gp = [[10.6, 4.2, -284.8], [-10.6, 4.2, -284.8]];
      for (const m of near) gp.push([m.x, m.y + 5.4, m.z]);
      for (const c of chimneys) gp.push([c[0], 4.6, c[2] + 4.5]);
      glows = fx.makeGlows({ rng: rng.fork('lamps'), time: T, positions: gp, color: '#ffab58', size: 3.2, intensity: 0.5 + 1.6 * L.lamp, flicker: 0.15 });
      scene.add(glows.object);
      await ctx.yield();
    }

    // the file of ducks (or, some years, a gaggle of grey geese) on the dyke
    const dg = new GB(), duckW = (geese ? H('#8f8676') : H('#f1efe8')).multiplyScalar(0.8), bill = H('#e08a1c'), rump = H('#f1efe8').multiplyScalar(0.8);
    if (geese) {
      dg.prism(6, 0.2, 0.36, 0.3, 0.6, duckW); dg.prism(6, 0.36, 0.24, 0.6, 0.92, duckW); dg.beam([0, 0.85, -0.32], [0, 1.5, -0.5], 0.07, duckW); dg.box(0, 1.56, -0.6, 0.16, 0.16, 0.3, duckW); dg.box(0, 1.55, -0.82, 0.1, 0.07, 0.2, bill);
      dg.box(0.62, 0.74, 0.05, 0.84, 0.05, 0.5, duckW); dg.box(-0.62, 0.74, 0.05, 0.84, 0.05, 0.5, duckW); dg.box(0, 0.62, 0.46, 0.28, 0.2, 0.34, rump);
    } else {
      dg.prism(6, 0.16, 0.3, 0.2, 0.42, duckW); dg.prism(6, 0.3, 0.2, 0.42, 0.66, duckW); dg.box(0, 0.78, -0.3, 0.2, 0.36, 0.22, duckW); dg.box(0, 0.82, -0.5, 0.16, 0.07, 0.22, bill);
      dg.box(0.55, 0.56, 0.05, 0.7, 0.05, 0.42, duckW); dg.box(-0.55, 0.56, 0.05, 0.7, 0.05, 0.42, duckW); dg.box(0, 0.5, 0.4, 0.24, 0.14, 0.3, duckW);
    }
    const stdMat2 = stdMat;
    const ND = geese ? 24 : 40, COLS = geese ? 6 : 10, GAP = geese ? 0.95 : 0.62, ducks = new THREE.InstancedMesh(dg.build(), stdMat2, ND); ducks.frustumCulled = false; scene.add(ducks);
    const dr = rng.fork('ducks'), duck = new Float32Array(ND * 6), dummy = new THREE.Object3D();
    const dx0 = pathX(112);
    for (let i = 0; i < ND; i++) duck.set([dx0 + (i % COLS - (COLS - 1) / 2) * GAP + dr.range(-0.15, 0.15), 112 + Math.floor(i / COLS) * (geese ? 1.5 : 1.1) + dr.range(-0.3, 0.3), dr(), dr(), dr(), dr() < 0.15 ? 1 : 0], i * 6);
    // once they are off the ground the kit's birds take over (real wings, a shoulder and a wrist): the file on the crown shrinks
    // away as it bursts and a flock of the same number crosses our bow low over the rose pan, keyed to u like the file
    const duckAir = { length: 1, posAtDist: (d, out) => out.set(dx0 - 20, 0, 112.5), tangentAtDist: (d, out) => out.set(0, 0, -1) };
    fauna.add(F.makeFlock({ rng: dr.fork('air'), species: geese ? 'geese' : 'gulls', form: 'loose', count: ND, size: geese ? 1.25 : 0.85, lod: 'low', flap: geese ? 4.6 : 6.5, glide: 0, wander: [0.7, 0.45, 0.7, 1.3],
      ...(geese ? {} : { body: '#f1efe8', belly: '#f6f4ee', wingC: '#e6e2d8', tip: '#6a5038' }), spread: [2.6, 0.9, 8],
      cross: { path: duckAir, u: uDuck - 0.012, window: 0.036, lead: 0, height: 2.4, angle: 84, side: -1, span: 46, rise: 1.8, bow: 0 } }));
    await ctx.yield();
    if (ducks.instanceColor === null) { const cw = new THREE.Color(1, 1, 1), cb = geese ? new THREE.Color(0.8, 0.78, 0.74) : new THREE.Color(0.45, 0.3, 0.18); for (let i = 0; i < ND; i++) ducks.setColorAt(i, duck[i * 6 + 5] ? cb : cw); }

    // ---- the salt workers: straw hats and indigo jackets (built 1.6 times life size like the town). Rakers rock at their
    // rakes on the hard, in the pans under the flight and in the little pans by the causeway; carriers walk to and fro with
    // a shoulder pole and two baskets on the hard, the hamlet's edge, the causeway and the island's forecourt
    const figure = (wg2, carrier) => {
      const skin = H('#c89a6c'), hat = H('#d8b872'), hat2 = H('#b8965c'), jacket = H('#4668a4'), jacket2 = H('#36528a'), trousers = H('#50556a'), wood = H('#6b543a'), wick = H('#8a6230');
      const towel = H('#e6e2d6').multiplyScalar(0.82), shoe = H('#2e2b28');
      wg2.prism(6, 0.13, 0.17, 0.08, 1.27, trousers, -0.19, 0, false); wg2.prism(6, 0.13, 0.17, 0.08, 1.27, trousers, 0.19, 0.08, false);
      wg2.box(-0.19, 0.06, -0.06, 0.22, 0.12, 0.42, shoe); wg2.box(0.19, 0.06, 0.02, 0.22, 0.12, 0.42, shoe);
      wg2.prism(8, 0.37, 0.31, 1.26, 2.16, jacket, 0, 0, false, Math.PI / 8); wg2.prism(8, 0.39, 0.37, 1.18, 1.3, jacket2, 0, 0, false, Math.PI / 8);
      wg2.box(0, 2.1, 0, 0.8, 0.2, 0.36, jacket); wg2.box(0, 1.52, -0.3, 0.1, 0.5, 0.04, jacket2);                // shoulders, and the jacket's front band
      wg2.prism(6, 0.1, 0.09, 2.14, 2.26, skin, 0, 0, false); wg2.box(0, 2.2, 0, 0.42, 0.1, 0.34, towel);         // neck and towel
      wg2.prism(8, 0.17, 0.155, 2.24, 2.52, skin, 0, -0.02, true, Math.PI / 8);
      wg2.prism(12, 0.72, 0.1, 2.46, 2.8, hat, 0, 0, true); wg2.prism(12, 0.74, 0.72, 2.43, 2.46, hat2, 0, 0, false);
      wg2.beam([-0.17, 2.46, -0.02], [0, 2.22, -0.17], 0.012, wood); wg2.beam([0.17, 2.46, -0.02], [0, 2.22, -0.17], 0.012, wood);
      const arm = (sh, el, ha) => { wg2.beam(sh, el, 0.075, jacket); wg2.beam(el, ha, 0.065, jacket); wg2.box(ha[0], ha[1], ha[2], 0.13, 0.13, 0.13, skin); };
      if (carrier) {
        wg2.beam([0.2, 2.22, -1.5], [0.2, 2.22, 1.5], 0.035, wood);
        arm([0.38, 2.08, 0], [0.46, 1.74, -0.3], [0.22, 2.16, -0.52]); arm([-0.38, 2.08, 0], [-0.46, 1.62, 0.06], [-0.4, 1.26, -0.1]);
        for (const z of [-1.45, 1.45]) {
          wg2.beam([0.2, 2.2, z], [0.2, 1.42, z - 0.25], 0.012, wood); wg2.beam([0.2, 2.2, z], [0.2, 1.42, z + 0.25], 0.012, wood);
          wg2.prism(8, 0.3, 0.4, 0.86, 1.42, wick, 0.2, z, false); wg2.prism(8, 0.38, 0.06, 1.42, 1.74, salt, 0.2, z, true);
        }
      } else {
        arm([-0.38, 2.08, 0], [-0.36, 1.64, -0.24], [0.0, 1.53, -0.5]); arm([0.38, 2.08, 0], [0.42, 1.56, -0.36], [0.09, 1.32, -0.78]);
        wg2.beam([0.05, 1.7, -0.3], [0.05, 0.06, -2.5], 0.03, wood); wg2.box(0.05, 0.07, -2.54, 1.0, 0.07, 0.09, wood);
        for (let t = -3; t <= 3; t++) { const x = 0.05 + t * 0.15; wg2.quad([x - 0.015, 0.06, -2.52], [x + 0.015, 0.06, -2.52], [x + 0.015, 0, -2.68], [x - 0.015, 0, -2.68], wood); }
      }
      return wg2.build();
    };
    const deckY = (z) => (z > -98 ? 1.6 : z > -190 ? 1.6 + 3.0 * (-98 - z) / 92 : 4.6);
    const rakers = new THREE.InstancedMesh(figure(new GB(), false), stdMat, rakeAt.length), carriers = new THREE.InstancedMesh(figure(new GB(), true), stdMat, carryAt.length);
    {
      const tints = [new THREE.Color(1, 1, 1), new THREE.Color(1.0, 0.9, 0.8), new THREE.Color(0.86, 0.9, 1.0), new THREE.Color(1.05, 0.8, 0.7)];
      for (let i = 0; i < rakeAt.length; i++) rakers.setColorAt(i, tints[i % 4]);
      for (let i = 0; i < carryAt.length; i++) carriers.setColorAt(i, tints[(i + 1) % 4]);
      for (const m of [rakers, carriers]) { m.frustumCulled = false; scene.add(m); }
    }
    await ctx.yield();

    // ---- the bicycle: grips, levers and bell on the bars, a basket of persimmons; placed from the camera every frame ---------
    const kg = new GB(), rubber = H('#3b3631'), steel = H('#8c8f94'), brass = H('#c9a23a'), wicker = H('#8a6230'), wicker2 = H('#6f4d24'), leaf = H('#4f7a2a');
    const rubberHi = H('#8c837a');
    let bk = kg;
    const cylX = (x0, x1, r0, r1, cy, cz, c0, c1) => {              // a 10-sided tube along X, paler on its upper facets
      for (let i = 0; i < 10; i++) {
        const a0 = i / 10 * Math.PI * 2, a1 = (i + 1) / 10 * Math.PI * 2, sh = Math.max(0, Math.cos((a0 + a1) / 2 - 0.5));
        bk.quad([x0, cy + r0 * Math.cos(a0), cz + r0 * Math.sin(a0)], [x1, cy + r1 * Math.cos(a0), cz + r1 * Math.sin(a0)], [x1, cy + r1 * Math.cos(a1), cz + r1 * Math.sin(a1)], [x0, cy + r0 * Math.cos(a1), cz + r0 * Math.sin(a1)], c0.clone().lerp(c1, sh * sh));
      }
    };
    for (const sx of [-1, 1]) {
      cylX(sx * 0.80, sx * 1.12, 0.05, 0.052, -0.74, -1.35, rubber, rubberHi); cylX(sx * 1.12, sx * 1.16, 0.052, 0.066, -0.74, -1.35, rubber, rubberHi); cylX(sx * 1.16, sx * 1.175, 0.066, 0.03, -0.74, -1.35, steel, H('#c8ccd2'));
      for (let r = 0; r < 4; r++) cylX(sx * (0.84 + r * 0.07), sx * (0.86 + r * 0.07), 0.056, 0.056, -0.74, -1.35, rubber, rubberHi);
      cylX(sx * 0.36, sx * 0.80, 0.026, 0.026, -0.75, -1.36, steel, H('#c8ccd2'));
      kg.box(sx * 0.92, -0.80, -1.44, 0.34, 0.022, 0.035, steel); kg.box(sx * 0.42, -0.86, -1.42, 0.05, 0.22, 0.05, steel);
    }
    cylX(-0.36, 0.36, 0.026, 0.026, -0.75, -1.36, steel, H('#c8ccd2')); kg.box(0, -0.765, -1.345, 0.1, 0.07, 0.12, H('#5c5f66'));   // the bar's centre and its clamp
    kg.prism(12, 0.078, 0.072, -0.725, -0.695, brass, -0.66, -1.36, false); kg.prism(12, 0.072, 0.052, -0.695, -0.668, H('#dcb548'), -0.66, -1.36, false); kg.prism(12, 0.052, 0.018, -0.668, -0.652, H('#f0d478'), -0.66, -1.36); kg.prism(6, 0.014, 0.01, -0.652, -0.636, steel, -0.66, -1.36); kg.box(-0.74, -0.7, -1.3, 0.02, 0.02, 0.09, steel);
    const bg = new GB(); bk = bg;
    const BX = 0, BY = -1.08, BZ = -2.0;
    bg.box(BX, BY - 0.18, BZ, 0.9, 0.04, 0.52, wicker2);
    for (let r = 0; r < 4; r++) {
      const y = BY - 0.14 + r * 0.075, c = r % 2 ? wicker : wicker2, k = 1 + r * 0.02;
      bg.box(BX, y, BZ + 0.26 * k, 0.92 * k, 0.07, 0.035, c); bg.box(BX, y, BZ - 0.26 * k, 0.92 * k, 0.07, 0.035, c);
      bg.box(BX - 0.45 * k, y, BZ, 0.035, 0.07, 0.52 * k, c); bg.box(BX + 0.45 * k, y, BZ, 0.035, 0.07, 0.52 * k, c);
    }
    for (let s = 0; s < 9; s++) { bg.box(BX - 0.4 + s * 0.1, BY - 0.03, BZ + 0.283, 0.022, 0.3, 0.02, wicker); bg.box(BX - 0.4 + s * 0.1, BY - 0.03, BZ - 0.283, 0.022, 0.3, 0.02, wicker); }
    const kr = rng.fork('persimmons');
    for (let i = 0; i < 12; i++) {
      const x = BX + (i % 4 - 1.5) * 0.2 + kr.range(-0.02, 0.02), z = BZ + (Math.floor(i / 4) - 1) * 0.16 + kr.range(-0.02, 0.02), y = BY + 0.1 + ((i % 4 === 1 || i % 4 === 2) ? 0.05 : 0) + kr.range(-0.01, 0.02), r = 0.1;
      bg.prism(9, r * 0.55, r, y - 0.08, y - 0.03, orange.clone().multiplyScalar(0.8), x, z); bg.prism(9, r, r * 0.97, y - 0.03, y + 0.03, orange, x, z); bg.prism(9, r * 0.97, r * 0.5, y + 0.03, y + 0.075, orange.clone().lerp(H('#ffb060'), 0.3), x, z);
      bg.prism(5, 0.05, 0.02, y + 0.075, y + 0.092, leaf, x, z);
    }
    bg.quad([BX + 0.12, BY + 0.24, BZ + 0.05], [BX + 0.3, BY + 0.27, BZ + 0.0], [BX + 0.34, BY + 0.25, BZ + 0.12], [BX + 0.16, BY + 0.23, BZ + 0.14], leaf);
    const bikeMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide, emissive: H('#2a241e'), emissiveIntensity: night ? 0.2 : 0.35 });
    const bars = new THREE.Mesh(kg.build(), bikeMat), basket = new THREE.Mesh(bg.build(), bikeMat);
    for (const m of [bars, basket]) { m.matrixAutoUpdate = false; m.frustumCulled = false; m.matrix.makeScale(1e-4, 1e-4, 1e-4); scene.add(m); }
    const mRide = new THREE.Matrix4(), mFit = new THREE.Matrix4(), eul = new THREE.Euler();
    const YN = 64, yawTab = new Float32Array(YN + 1), ta = new THREE.Vector3(), tb = new THREE.Vector3();
    for (let i = 0; i <= YN; i++) { path.tangentAt(Math.min(0.985, i / YN), ta); path.tangentAt(Math.min(1, i / YN + 0.015), tb); yawTab[i] = Math.max(-0.16, Math.min(0.16, (ta.z * tb.x - ta.x * tb.z) * 1.6)); }
    const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const seaV = new THREE.Vector3(), towerGaze = new THREE.Vector3(0, 36, -305);   // (the gaze on the tower: low at first, over the stakes and the water, then up for the whole of it)
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration: DUR, ride: 'none',
      // even on the way out, lingering over the canal for the view from the top, quick down the dive, unhurried for the gate
      pace: (u) => 1 - 0.22 * ss(uC - 0.02, uC + 0.02, u) * (1 - ss(uTop + 0.005, uTop + 0.045, u)) + 0.12 * ss(uTop + 0.02, uTop + 0.06, u) * (1 - ss(uMillA + 0.02, uMillA + 0.08, u)) - 0.08 * ss(0.86, 0.93, u),
      camera: { fov: 66, near: 0.3, nearThrough: 0.3, far: 5200, lookAhead: 24, sway: 0.5, bank: 0.4 },
      pois: [
        { at: [16, 12, 211], from: 0.03, to: uSweep - 0.012, weight: 0.6 },                    // up into the sweep mill's turning frame as we come under it
        { at: [30, 5, 165], from: uSweep - 0.027, to: uSweep + 0.011, weight: 0.4 },              // under the rim: eyes ahead down the jade pan to the hard, the post left behind out of frame
        { at: [-6, 3, 172], from: uH0 - 0.035, to: uH0 + 0.03, weight: 0.55 },                    // the hard: the cart, the white cone and the rakers
        { at: [pathX(158) - 21, 4.5, 158], from: uH0 + 0.022, to: uH1 - 0.008, weight: 0.42 },     // the mill at the hard's left edge, whole, as we ride past its foot
        { at: [8, 9, 114], from: uH1 - 0.036, to: uH1 + 0.026, weight: 0.3 },                     // leaving the hard: the mill ahead on the right, whole, before the eyes go left to the hamlet
        { at: [-52, 6, 98], from: uH1 - 0.005, to: uHam + 0.015, weight: 0.5 },                  // the hamlet's gables, washing and persimmon trees over the rose pan
        { at: (time, u) => bargeGaze.set(Math.max(-110, Math.min(70, -28 + 300 * (uC - 0.068 - u))), 2, 36), from: uHam + 0.01, to: uC - 0.03, weight: 0.25 },   // the barge sliding out from under the arch
        { at: [0, 0, -120], from: uC - 0.04, to: uTop + 0.035, weight: 0.68, fade: 0.25 },       // from the top: the whole quilt below, the pagoda entire beyond it
        { at: [24, 18, -52], from: uTop + 0.04, to: uMillA - 0.004, weight: 0.42 },              // the great mill against the light, all of it, then up into its frame as we pass under the rim
        { at: [0, 50, -305], from: uMillA - 0.01, to: uMillA + 0.09, weight: 0.22 },
        { at: [78, 14, -128], from: uJunk - 0.088, to: uJunk - 0.008, weight: 0.27 },             // the moat's great mill, whole, while it still stands ahead on the right
        { at: [62, 36, -230], from: uJunk - 0.07, to: uJunk + 0.06, weight: 0.36 },              // eyes up down the moat: the junk on the right, the whole tower on the left
        // the whole tower over its moat from the high turn (the gaze lifts between two places on the route: from halfway past the junk to the top of the last turn)
        { at: (time, u) => towerGaze.set(0, 36 + 21 * ss(uJunk + 0.5 * (uHigh - uJunk), uHigh, u), -305), from: uJunk, to: uHigh + 0.04, weight: 0.72, fade: 0.25 },
        { at: [0, 54, -305], from: uHigh - 0.03, to: uL - 0.02, weight: 0.8 },                   // nearer, the gate and its forecourt come up under the lower rings
        { at: [0, 8, -290], from: uL - 0.05, to: 1, weight: 0.6 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#FFE2B0', glow: 1, revealDistance: 340 },
      post: { exposure: L.exposure, bloom: { strength: 0.4, radius: 0.7, threshold: 0.92 },
        grade: { saturation: 1.06, contrast: 1.05, shadowTint: '#0A0D1C', vignette: 0.3, grain: 0.02 } },
      update(dt, time, camera, u) {
        T.value = time; shared.uU.value = u;
        const frontZ = 26 - 2070 * (u - U0);
        panU.uFrontZ.value = frontZ;
        const gustHere = ss(U0 - 0.005, U0 + 0.02, u) * (1 - 0.6 * ss(U0 + 0.1, U0 + 0.24, u));
        wind.set({ strength: 1.8 + 1.4 * gustHere });
        sky.update(dt, time, camera); rig.update(dt, time, camera); wind.update(time); cumulus.update(dt, time, camera);
        reeds.update(dt, time, camera); reeds2.update(dt, time, camera); reeds3.update(dt, time, camera); reeds4.update(dt, time, camera); reeds5.update(dt, time, camera); reeds6.update(dt, time, camera); reeds7.update(dt, time, camera); seepweed.update(dt, time, camera);
        for (let i = 0; i < grasses.length; i++) grasses[i].update(dt, time, camera);
        fauna.update(dt, time, camera, u); saltAir.update(dt, time, camera);
        gustMist.uniforms.uCenter.value.z = frontZ + 30;
        for (let i = 0; i < mists.length; i++) mists[i].update(dt, time, camera);
        if (glows) glows.update(dt, time, camera);
        saltAir.setOpacity(0.15 + 0.45 * gustHere);
        straw.update(dt, time, camera); straw.setOpacity(0.85 * gustHere);
        // the blown salt streams along the crown, the pans and the decks: below the eye when we are low, far below when we are high
        { const cy = camera.matrixWorld.elements[13] - 1.75; saltAir.uniforms.uCenter.value.y = cy + (Math.min(cy, 2.5) - cy) * (1 - ss(uL - 0.05, uL - 0.005, u)); }
        // the bicycle is in the picture only while its wheels are on the ground: across the hard and up the causeway. Then all
        // of it shows: the bar and its grips low across the bottom, the whole basket above it. It rides with the direction of
        // travel, not with the gaze, so it slides toward a side when we look aside. In the air it hangs below the frame.
        // On a tall narrow screen the field of view widens, so the basket sinks and shrinks and the grips move inward.
        const ride = Math.max(ss(uH0 - 0.022, uH0 - 0.004, u) * (1 - ss(uH1 - 0.004, uH1 + 0.014, u)), ss(uL - 0.012, uL + 0.006, u));
        if (u <= 0 || ctx.through || ride < 0.002) { bars.matrix.makeScale(1e-4, 1e-4, 1e-4); basket.matrix.copy(bars.matrix); }
        else {
          const pe = camera.projectionMatrix.elements, tanV = 1 / Math.max(pe[5], 1e-3), tanH = 1 / Math.max(pe[0], 1e-3);
          const wide = Math.max(0, tanV - 0.6494), kx = Math.min(1, tanH / 1.068), kb = Math.max(0.72, Math.min(1, kx * 1.55)) * 0.8;
          const ped = ss(uH0, uH0 + 0.01, u) * (1 - ss(uH1 - 0.01, uH1, u));
          const fi = Math.min(YN - 1e-3, u * YN), i0 = Math.floor(fi), yaw = yawTab[i0] + (yawTab[i0 + 1] - yawTab[i0]) * (fi - i0);
          const setts = ss(uL, uL + 0.01, u) * (1 - ss(0.97, 1, u));
          const ce = camera.matrixWorld.elements;
          path.tangentAt(Math.min(1, Math.max(0, u)), ta);
          const camPitch = Math.asin(Math.max(-1, Math.min(1, -ce[9])));
          eul.set(camPitch * 0.4, Math.atan2(-ta.x, -ta.z) + yaw * 0.6, Math.sin(time * 9.42) * 0.021 * ped + yaw * 0.35, 'YXZ');
          mRide.makeRotationFromEuler(eul); mRide.elements[12] = ce[12]; mRide.elements[13] = ce[13]; mRide.elements[14] = ce[14];
          const lift = -1.5 * (1 - ride) + Math.sin(time * 61) * 0.006 * setts + Math.sin(time * 18.84) * 0.004 * ped;
          mFit.makeScale(kx, 1, 1); mFit.elements[13] = lift - 1.35 * 0.9 * wide; bars.matrix.multiplyMatrices(mRide, mFit);
          mFit.makeScale(kb, kb, kb); mFit.elements[13] = lift + 0.065 - 1.74 * 0.82 * wide - 1.0 * (1 - kb); mFit.elements[14] = -2.0 * (1 - kb);
          basket.matrix.multiplyMatrices(mRide, mFit);
        }
        bars.matrixWorldNeedsUpdate = true; basket.matrixWorldNeedsUpdate = true;
        // boats, all keyed to u: the canal barge slides out from under the bridge as we come to the canal; the moat barges never reach the causeway
        const bx = Math.max(-110, Math.min(70, -28 + 300 * (uC - 0.068 - u)));   // it comes out from under the arch on our side as we turn for the canal
        for (let j = 0; j < NC; j++) { lowP[j * 3] = bx + j * 36; lowP[j * 3 + 1] = Math.sin(time * 1.3 + j * 2.1) * 0.06; }
        for (let i = 0; i < 4; i++) { tallP[i * 3] = moatB[i][0] + moatB[i][2] * u; tallP[i * 3 + 1] = Math.sin(time * 1.1 + i * 2) * 0.08; }
        tallP[13] = -0.12 + Math.sin(time * 1.7) * 0.07; tallP[16] = -0.12 + Math.sin(time * 1.5 + 2) * 0.07;
        for (let j = 0; j < NJ; j++) {
          seaP(0.2 + j * 0.86 / NJ + ((j * 7) % 3) * 0.03 + seaJ[j][0] + 0.035 * u, 70 + ((j * 5) % 4) * 38 + seaJ[j][1], seaV);
          const o = (seaFirst + j) * 3; tallP[o] = seaV.x; tallP[o + 1] = Math.sin(time * 0.6 + j) * 0.25; tallP[o + 2] = seaV.z;
        }
        for (let i = 0; i < farB.length; i++) { const o = (6 + i) * 3; tallP[o] = farB[i][0] + farB[i][2] * u; tallP[o + 1] = Math.sin(time * 1.0 + i * 3) * 0.08; }
        { const o = 8 * 3; tallP[o] = crossB[0] + crossB[2] * u; tallP[o + 1] = Math.sin(time * 1.2 + 4) * 0.1; }
        // the canal's sailing barges: each is where its own time round the loop puts it (the gale's clock; nothing of u)
        for (let g = 0, i = 0; g < canal.groups; g++) for (let m = 0; m < canal.each; m++, i++) {
          let tq = (time * shared.uGale.value + (g + canal.phase) * canal.period / canal.groups - m * canal.followT) % canal.period; if (tq < 0) tq += canal.period;
          let lo = 0, hi = canal.len; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (canal.tau[mid] <= tq) lo = mid; else hi = mid; }
          const o = (canal.first + i) * 3, f = (tq - canal.tau[lo]) / (canal.tau[lo + 1] - canal.tau[lo]);
          tallP[o] = canal.xW - lo - f; tallP[o + 1] = Math.sin(time * 1.2 + i * 2.3) * 0.07; tallP[o + 2] = canal.z;
        }
        tallGeo.attributes.iPos.needsUpdate = true; lowGeo.attributes.iPos.needsUpdate = true;
        // the ducks: waddling in a file, then bursting into the left-hand pan
        for (let i = 0; i < ND; i++) {
          const o = i * 6, r1 = duck[o + 2], r2 = duck[o + 3], r3 = duck[o + 4];
          const s = ss(uDuck - 0.045 + 0.02 * r1, uDuck + 0.02 + 0.02 * r1, u), air = Math.sin(Math.PI * s);
          const x = duck[o] + Math.sin(time * 0.7 + i) * 0.12 - s * (12 + 20 * r2), z = duck[o + 1] - s * (6 + 16 * r3);
          const y = 1.6 - 1.55 * s + air * (1.4 + 2.2 * r2);
          dummy.position.set(x, y, z);
          dummy.rotation.set(-air * 0.5, 1.2 + (r3 - 0.5) + s * 0.6, Math.sin(time * (7 + 24 * air) + i * 1.7) * (0.12 + 0.55 * air));
          const grounded = 1 - ss(0.05, 0.24, s);
          dummy.scale.set((0.5 + 0.5 * air + 0.5 * air * Math.abs(Math.sin(time * 26 + i))) * grounded, 0.85 * grounded, 0.85 * grounded);
          dummy.updateMatrix(); ducks.setMatrixAt(i, dummy.matrix);
        }
        ducks.instanceMatrix.needsUpdate = true;
        // the workers: rakers rock forward and back on their rakes; carriers walk their beat, turning at each end
        for (let i = 0; i < rakeAt.length; i++) {
          const r = rakeAt[i], ph = time * (1.5 + (i % 3) * 0.2) + i * 1.9, sw = Math.sin(ph);
          dummy.position.set(r[0] - Math.sin(r[3]) * sw * 0.22, r[1], r[2] - Math.cos(r[3]) * sw * 0.22);
          dummy.rotation.set(-0.1 - 0.09 * sw, r[3], 0); const fs = 0.92 + 0.16 * ((i * 0.618) % 1); dummy.scale.set(fs, fs, fs); dummy.updateMatrix(); rakers.setMatrixAt(i, dummy.matrix);
        }
        rakers.instanceMatrix.needsUpdate = true;
        // the cormorants: those on the stakes hold their wings out to dry, turning a little and now and then shaking them
        // out; the others fish, riding low in the water, tipping under and coming up again further round
        for (let i = 0; i < NCM; i++) {
          const c = work.corms[i], ph = c[5];
          if (c[4] === 0) {
            const shake = Math.max(0, Math.sin(time * 0.31 + ph * 5) - 0.6) * 2.5;
            cdum.position.set(c[0], c[1], c[2]); cdum.rotation.set(0, c[3] + Math.sin(time * 0.6 + ph) * 0.14, Math.sin(time * 2.1 + ph) * 0.05);
            cdum.scale.set(1 + 0.16 * Math.sin(time * 1.4 + ph) + 0.4 * shake * Math.sin(time * 12 + ph), 1, 1);
          } else {
            const q = time / 8 + ph, t = q - Math.floor(q), ang = c[3] + q * 1.5, under = ss(0.52, 0.62, t) * (1 - ss(0.88, 0.97, t));
            cdum.position.set(c[0] + Math.cos(ang) * 2.2, c[1] - 0.4 - 1.3 * under + Math.sin(time * 2.3 + ph) * 0.03, c[2] + Math.sin(ang) * 2.2);
            cdum.rotation.set(-1.3 * ss(0.5, 0.58, t) * (1 - ss(0.9, 1, t)), Math.PI - ang, 0);
            cdum.scale.set(0.34, 0.85, 1);
          }
          cdum.updateMatrix(); cormMesh.setMatrixAt(i, cdum.matrix);
        }
        if (NCM) cormMesh.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < carryAt.length; i++) {
          const c = carryAt[i], dx = c[2] - c[0], dz = c[3] - c[1], len = Math.hypot(dx, dz), q = (time * 2.1 * c[5] + i * 7.3) / len, k = q - 2 * Math.floor(q / 2), t = k < 1 ? k : 2 - k, back = k < 1 ? 0 : Math.PI;
          const x = c[0] + dx * t, z = c[1] + dz * t, st = time * 5.2 * c[5] + i;
          dummy.position.set(x, (c[4] === null ? deckY(z) : c[4]) + Math.abs(Math.sin(st)) * 0.07, z);
          dummy.rotation.set(0, Math.atan2(-dx, -dz) + back, Math.sin(st) * 0.035); const fs = 0.93 + 0.14 * ((i * 0.618 + 0.4) % 1); dummy.scale.set(fs, fs, fs); dummy.updateMatrix(); carriers.setMatrixAt(i, dummy.matrix);
        }
        carriers.instanceMatrix.needsUpdate = true;
      },
      dispose() { sky.dispose?.(); cuNoise.dispose(); },
    };
});
