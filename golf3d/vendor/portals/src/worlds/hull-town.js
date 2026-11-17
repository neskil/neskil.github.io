// Where Ships Go to Live: a winter morning of lifting fog at low tide on a shipbreaking shore that kept its ships.
// Slung in an orange lifeboat under a cable strung from mast to mast we slide past a black bow in the pearl-white,
// drop between two hulls hung with washing, crest the tallest mast as the fog tears, and dive at a 290 m liner
// standing upright on mirror-wet mud, through the arch cut in its rust-red side.
// By seed: the look (winter morning, kite festival, golden afternoon with the tide film returning, moonlit night; ctx.vary.hour
// 'golden' and 'night' are honoured), which paint family leads, rickshaws or buffalo carts in the square, egrets or storks, how early the
// fog tears (mood), how busy (density);
// rare: a white ferry dressed in bunting being hauled up the flat by twenty cables and a crowd.
// THE KIT'S FLOCKS, the cure of a fault in live (the owner's rule texts R, T and U): eight of the nine calls could touch our line. Each is now handed its wander written out (the two wheels the species' own, the escorts and the crossings 2, 1.2, 2), maxSigma 3 (all eight are loose flocks) and a course laid off our line by its own numbers, so that the box of three scatters with the wander and the body stays 2.0 m and more clear of it on every deal. The two escorts and the four crossings are also handed a spread of their own so that they fly near us (rule text U: 14, 5, 14 for the gulls where the kit's own is 34, 12, 34; 15, 5, 15 for the crows where it is 30, 10, 30: the same draws, scaled). keepClear is not called, nothing is added at the build.
// The numbers: the escorts fly 15 and 23 m over our line (up 2 and -6 in live); the mud gulls cross under it at live's own height (-19); the crows over it at 14 (2.5 in live); the reveal gulls and the fourteen under it at -19 and -14.5 (-9 and -6 in live). The two wheels keep the kit's spread: the gulls' centre 74 m up (28 in live), the crows' 37 (30 in live).
// Least from the flown line on forty seeds, in the order of the calls: 4.35, 4.41, 7.44, 5.90, 4.48, 3.76, (the kites 16.31, not touched), 7.94 and 6.13 m; in live all eight were under 2.0 m, seven of them touching. The count rests on maxSigma in live's kit.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, hullGeometry, makeArena, makeBag, makeRibbonBag, makeWindBag, addBunting, addBanana, sagLine, trs, deckEdge, plateBump, lcg, makeWaterMaterial, HAZE_GLSL, airMaterial } from '../parts/hull-town.js';

const col = (h) => new THREE.Color(h);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const PAL = { pearl: '#E9E6DF', rust: '#9B3A26', grey: '#5B544C', tar: '#1D2125', blue: '#86AAC6', teal: '#2E8C86', orange: '#F26A1B', pink: '#E58CA5', yellow: '#E8C04A' };
// The cable sags low through the opening third (deck height between the painted hulls), kicks up to the second mast as the fog tears,
// crests the third, then drops steeply and runs low over the mud furniture to the square.
const PTS = [[7, 18, 697], [46, 18, 651], [70, 18.5, 622], [91, 21, 597], [104, 15.5, 548], [117, 12, 499], [128, 12.5, 458], [135, 20, 433], [130.3, 28, 415.6], [124, 29.5, 392], [113, 30.5, 351],
  [99, 36, 299], [86, 44, 250], [64, 26, 207], [40, 12.5, 166], [14, 8.8, 122], [3.5, 8.6, 98], [0, 8.6, 80], [0, 8.4, 60], [0, 8, 0]];
// the four looks: light, air and colour for each; everything else is shared
const LOOKS = {
  morning: { az: 112, el: 17, sunC: '#FFE2B8', sun: [2.7, 3.8], hemi: [0.9, 0.55], fog: '#DEDCD5', haze: '#B4C8D8', skyZ: '#9DB2C8', skyH: '#EFE7D8', zen: '#6F9CC2', hor: '#B7C9D8', glow: [0.72, 0.5, 0.21],
    amb0: [0.31, 0.325, 0.35], amb1: [0.4, 0.45, 0.54], wamb0: [0.4, 0.415, 0.45], wamb1: [0.3, 0.34, 0.42], sunK: [0.82, 1.15], light: [0.86, 1.1], shadow: '#8b97bd', shOp: [0.6, 1], glit: [1.1, 0.3], refl: [0.3, 0.8, 0.9], hills: '#9db9cf', film: 0.12, mudZ: '#5E90C6',
    mist: '#F3F0E8', bank: '#F6F4EE', smoke: ['#d4d0c8', '#a8a29c'], smokeAmb: ['#b2b0b2', '#5c5c66'], exposure: 0.92, lamp: 1.5, rays: '#ffe6bc',
    a: { preset: 'overcast', zenith: '#819FC2', mid: '#BFCBD6', horizon: '#EEE8DC', ground: '#D6D3CA', scatterColor: '#FFD79C', scatter: 2.1, clouds2: { coverage: 0.5, stretch: 1, opacity: 0.55 } },
    b: { preset: 'day', zenith: '#6F9CC2', horizon: '#D5DCDA', ground: '#C9D2D6', lightColor: '#FFE2B8', clouds2: { coverage: 0.4, stretch: 1, opacity: 0.75 } } },
  golden: { az: 245, el: 12, sunC: '#FFB877', sun: [2.3, 3.6], hemi: [1.0, 0.7], fog: '#DCC6A4', haze: '#DFC8AC', skyZ: '#B9AE9E', skyH: '#F3CF96', zen: '#6E8FB8', hor: '#F4C88E', glow: [0.6, 0.38, 0.12],
    amb0: [0.44, 0.4, 0.35], amb1: [0.42, 0.42, 0.5], wamb0: [0.46, 0.42, 0.37], wamb1: [0.32, 0.33, 0.42], sunK: [0.66, 1.2], light: [0.86, 1.08], shadow: '#a895b4', shOp: [0.66, 1], glit: [0.8, 0.15], refl: [0.6, 0.85, 1.05], hills: '#b9a9b4', film: 0.85,
    mist: '#F6E6CC', bank: '#F8E9D0', smoke: ['#c2b49e', '#9a8a80'], smokeAmb: ['#94897c', '#4c444a'], exposure: 0.92, lamp: 1.8, rays: '#ffd9a0',
    a: { preset: 'overcast', zenith: '#B5ADA6', mid: '#D8C5A8', horizon: '#EFCF9E', ground: '#D6C4A6', scatterColor: '#FFBE6A', scatter: 1.9 },
    b: { preset: 'goldenHour', zenith: '#5F86B6', horizon: '#F6C78C', ground: '#D9C3A6', lightColor: '#FFB877', clouds2: { coverage: 0.5, stretch: 1, opacity: 0.8 } } },
  night: { az: 112, el: 52, sunC: '#BFD0FF', sun: [0.55, 1.5], hemi: [1.5, 1.15], fog: '#3A4658', haze: '#263246', skyZ: '#2A3650', skyH: '#55627C', zen: '#0E1830', hor: '#2C3A56', mudZ: '#2c3c60', mudH: '#5a6c92', glow: [0.16, 0.2, 0.3],
    amb0: [0.14, 0.16, 0.21], amb1: [0.1, 0.125, 0.19], wamb0: [0.1, 0.115, 0.16], wamb1: [0.075, 0.095, 0.15], sunK: [0.12, 0.3], light: [0.2, 0.2], shadow: '#5a6688', shOp: [0.4, 0.9], glit: [0.7, 0.12], refl: [0.4, 0.75, 1], hills: '#1c2a44', film: 0.6,
    mist: '#8E9CB4', bank: '#9AA8C0', smoke: ['#5c6474', '#4a5060'], smokeAmb: ['#343a48', '#222834'], exposure: 1.12, lamp: 3.2, rays: '#aebfe8',
    a: { preset: 'overcast', zenith: '#2A3448', mid: '#3A465C', horizon: '#566278', ground: '#2c3442', scatterColor: '#B4C6F0', scatter: 1.5 },
    b: { preset: 'night', lightColor: '#BFD0FF', bake: true, clouds: false, starDensity: 0.45, clouds2: { coverage: 0.35, stretch: 1, opacity: 0.4 } } },
};

function convex(pts) {
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  lo.pop(); up.pop(); return lo.concat(up);
}

// rickshaw art at ship scale: four rows of hull paint, each 8 units long by 1 high: plating, a white sheer stripe, a row of
// portholes, big painted shapes, a painted eye on every bow. The second canvas holds the portholes that are lit.
async function townAtlas(ctx, rng, fam, litFrac) {
  const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 1024; const g = cv.getContext('2d');
  const ev = document.createElement('canvas'); ev.width = 1024; ev.height = 512; const e = ev.getContext('2d'); e.fillStyle = '#000'; e.fillRect(0, 0, 1024, 512);
  const bases = [PAL.tar, '#8f3a28', '#d6d1c4', fam[0]], acc = [fam[1], '#F2EFE6', fam[2], fam[0], PAL.orange];
  for (let r = 0; r < 4; r++) {
    g.setTransform(256, 0, 0, -256, 0, 1024 - r * 256); e.setTransform(128, 0, 0, -128, 0, 512 - r * 128);
    g.globalAlpha = 1; g.fillStyle = bases[r]; g.fillRect(0, 0, 8, 1);
    for (let i = 0; i < 90; i++) { g.globalAlpha = 0.18; g.fillStyle = i % 2 ? '#7c2c1c' : '#b5573a'; g.beginPath(); g.ellipse(rng() * 8, rng(), 0.1 + rng() * 0.5, 0.03 + rng() * 0.12, 0, 0, 6.3); g.fill(); if (i % 30 === 29) await ctx.yield(); }
    await ctx.yield();
    g.globalAlpha = 0.16; g.fillStyle = '#140c0a';
    for (let y = 0.167, q = 0; y < 0.95; y += 0.167, q++) { g.fillRect(0, y, 8, 0.008); for (let x = (q % 2) * 0.2; x < 8; x += 0.4) g.fillRect(x, y - 0.167, 0.006, 0.167); }
    g.globalAlpha = 0.9;
    await ctx.yield();
    for (let x = 0.15; x < 8; x += 0.3) { g.fillStyle = acc[((x / 0.3) | 0) % 2]; g.beginPath(); g.arc(x, 0.9, 0.15, Math.PI, 0); g.fill(); }
    g.fillStyle = r === 2 ? fam[0] : '#F2EFE6'; g.fillRect(0, 0.9, 8, 0.035);
    for (let k = 0; k < 5; k++) {
      const x = 0.9 + k * 1.25, y = 0.4, R = 0.36, kind = (k + r) % 3;
      if (kind === 0) for (let w = 0; w < 8; w++) { g.fillStyle = acc[(w + k) % 4]; g.beginPath(); g.moveTo(x, y); g.arc(x, y, R, Math.PI * w / 8, Math.PI * (w + 1) / 8); g.closePath(); g.fill(); }
      else if (kind === 1) for (let w = -2; w <= 2; w++) { g.fillStyle = acc[(w + 2) % 3]; g.beginPath(); g.ellipse(x + Math.sin(w * 0.5) * R * 0.5, y + Math.cos(w * 0.5) * R * 0.5, R * 0.22, R * 0.55, -w * 0.5, 0, 6.3); g.fill(); }
      else { for (let q = 3; q >= 1; q--) { g.fillStyle = acc[q % 4]; g.beginPath(); g.moveTo(x, y); g.arc(x, y, R * q / 3, 0.3, Math.PI - 0.3); g.closePath(); g.fill(); } g.fillStyle = acc[4]; g.beginPath(); g.arc(x, y + R * 0.15, R * 0.14, 0, 6.3); g.fill(); }
    }
    await ctx.yield();
    for (let x = 0.22; x < 6.7; x += 0.21) { const on = rng() < litFrac;                       // portholes, a rust run under each
      g.globalAlpha = 0.4; g.fillStyle = '#5a2414'; g.fillRect(x - 0.008, 0.69, 0.016, -0.1 - rng() * 0.12);
      g.globalAlpha = 1; g.fillStyle = '#c9c0ae'; g.beginPath(); g.arc(x, 0.72, 0.03, 0, 6.3); g.fill(); g.fillStyle = on ? '#ffc070' : '#101216'; g.beginPath(); g.arc(x, 0.72, 0.02, 0, 6.3); g.fill();
      if (on) { const q = e.createRadialGradient(x, 0.72, 0, x, 0.72, 0.05); q.addColorStop(0, '#ffd08a'); q.addColorStop(0.5, '#c07a2a'); q.addColorStop(1, 'rgba(0,0,0,0)'); e.fillStyle = q; e.fillRect(x - 0.06, 0.66, 0.12, 0.12); } }
    g.globalAlpha = 0.95;
    g.fillStyle = '#F2EFE6'; g.beginPath(); g.moveTo(6.84, 0.66); g.quadraticCurveTo(7.3, 0.86, 7.76, 0.66); g.quadraticCurveTo(7.3, 0.47, 6.84, 0.66); g.fill();   // the eye: an almond, teal iris, dark pupil
    g.lineWidth = 0.022; g.strokeStyle = '#101216'; g.stroke();
    g.fillStyle = '#17848C'; g.beginPath(); g.ellipse(7.32, 0.66, 0.17, 0.082, 0, 0, 6.3); g.fill();
    g.fillStyle = '#101216'; g.beginPath(); g.ellipse(7.32, 0.66, 0.085, 0.042, 0, 0, 6.3); g.fill();
    g.fillStyle = '#F2EFE6'; g.beginPath(); g.ellipse(7.37, 0.675, 0.025, 0.012, 0, 0, 6.3); g.fill();
    g.lineWidth = 0.035; g.strokeStyle = acc[0]; g.beginPath(); g.ellipse(7.3, 0.69, 0.34, 0.16, 0.1, Math.PI * 0.05, Math.PI * 0.95); g.stroke();
    const gr = g.createLinearGradient(0, 0, 0, 0.42); gr.addColorStop(0, 'rgba(48,70,44,0.95)'); gr.addColorStop(0.25, 'rgba(110,52,38,0.8)'); gr.addColorStop(1, 'rgba(110,52,38,0)');
    g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(0, 0, 8, 0.42);
    await ctx.yield();
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;   // the flanks are passed close and at a slant
  const te = new THREE.CanvasTexture(ev); te.colorSpace = THREE.SRGBColorSpace; return { atlas: t, atlasEmi: te };
}

// ---- the mud, and the mirror in it. One function shades a point of the flat; the mud plane and the y-flipped copies of the
// hulls both call it, so a reflection is the hull's own colour laid over exactly the mud that is there, by wetness and angle.
// The long shadows and the wet round every hull's foot come from one small map of the flat drawn once at build (uMask: red = in shadow,
// green = scoured wet, blue = trodden ground), so a shadow takes the sun off the sand and the glitter off the film but leaves the sky in it, and never stacks.
const MUD_PARS = `uniform float uTime, uTear, uFilm, uShK; uniform vec3 uSun, uSunCol, uAmb, uSkyZ, uSkyH, uGlow, uShC, uGate; uniform vec2 uSunH, uGlit; uniform vec3 uRefl; uniform vec4 uMaskR; uniform sampler2D uMask; float gDeep;
  float h21(vec2 p){ p = fract(p*vec2(0.1031,0.1030)); p += dot(p, p.yx+33.33); return fract((p.x+p.y)*p.y); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h21(i), h21(i+vec2(1.,0.)), f.x), mix(h21(i+vec2(0.,1.)), h21(i+vec2(1.,1.)), f.x), f.y); }
  float fb(vec2 p){ return vn(p)*0.5 + vn(p*2.03+7.1)*0.25 + vn(p*4.1+3.3)*0.125 + vn(p*8.3+1.7)*0.0625; }
  vec3 mudShade(vec3 w, out float mirrorK){
    vec2 p = w.xz;
    vec3 msk = texture2D(uMask, (p - uMaskR.xy)*uMaskR.zw).rgb;
    vec3 toC = cameraPosition - w; float dist = length(toC); vec3 v = -toC/max(dist, 1e-3);
    float nearK = smoothstep(150., 20., dist);
    float big = fb(p*0.011) + 0.22*(fb(p*0.043 + 11.3) - 0.5), fine = mix(0.47, fb(p*0.9), nearK);
    float ch = abs(sin(p.y*0.05 + (fb(p*0.007)-0.5)*9. + p.x*0.004));
    float ch2 = abs(sin(p.x*0.021 + p.y*0.083 + (fb(p*0.013 + 5.3)-0.5)*7.));        // tributaries braiding into the main channels
    float bank = max(1. - smoothstep(0.05, 0.17, ch), 0.7*(1. - smoothstep(0.035, 0.1, ch2)));    // dark, sodden banks
    float chan = max(1. - smoothstep(0.016, 0.04, ch), 1. - smoothstep(0.007, 0.018, ch2));       // the bright thread of water down the middle
    float film = uFilm*smoothstep(0.25, 0.6, fb(p*0.019 + 3.7) + 0.25*smoothstep(160., 20., abs(p.y - 70.))*smoothstep(260., 120., abs(p.x)));
    float bg = big + 0.05*sin(uTime*0.11 + p.x*0.02);
    float scour = smoothstep(0.4, 0.6, msk.g + 0.9*(big - 0.47));                  // the tide scours a pool round every hull's foot
    float wet = clamp(smoothstep(0.495, 0.545, bg) + chan + film + scour, 0., 1.);
    // The whole flat is as the tide left it: mirror-wet mud. A film lies over all of it but the drying bars (pale, crisp-edged, drawn
    // out down the drainage); water stands only in the scour pool at each hull's foot, in the channels and in the rills between the
    // ripples. Z is that ground: the same from the arrival to the liner.
    float Z = 1.;
    vec2 sqd = vec2(35. - abs(p.x), min(p.y - 17.2, 67.5 - p.y)); float sqK = smoothstep(-0.12, 0.12, min(sqd.x, sqd.y));   // the square: deck plate laid on the mud
    chan *= 1. - sqK; bank *= 1. - sqK;
    float bar = fb(vec2(p.x*0.0065, p.y*0.021) + 4.3) + 0.3*(fb(vec2(p.x*0.03, p.y*0.07) + 9.1) - 0.47) + 0.06*(fb(p*0.33 + 2.7) - 0.47);
    float lowK = 1. - smoothstep(410., 480., p.y);                                 // the flat falls toward the liner's berth: from the second mast down it lies low enough to hold the tide between its bars
    bar = mix(bar, 0.5 + 0.6*(bar - 0.5) + 0.42*(fb(vec2(p.x*0.017, p.y*0.055) + 23.1) - 0.47), lowK);   // (and there the bars are more and smaller: spits a ship's length long with a pan between each two)
    float pool = smoothstep(0.5 - 0.2*lowK, 0.535 - 0.2*lowK, msk.g + 1.25*(fb(p*0.055 + 1.3) - 0.47) + 0.3*(fb(p*0.21 + 7.9) - 0.47))*(1. - sqK);   // (on the lower flat the pool is as long as the hull that scoured it)   // the scour pool: a ragged puddle with its own shoreline, never an oval drawn round the hull
    float dryT = mix(0.568, 0.545, uTear);                                                                    // under the veil the bars are only crowns; they dry and spread as the sun comes through
    bar = mix(bar, max(bar, dryT + 0.05), lowK*smoothstep(0.3, 0.62, msk.b + 0.85*(fb(p*0.13 + 3.1) - 0.47)));   // the trodden ground of the lower flat (the duckboard walk, the standing of its stalls, the lie of the boats and gear: the map's blue) stands a hand proud of the pans: dry sand, a spit of it from the second mast to the square
    float dry = smoothstep(dryT, dryT + 0.012, bar)*(1. - chan)*(1. - pool);
    float rillN = abs(sin(p.y*0.31 + (fb(vec2(p.x*0.017, p.y*0.045) + 6.1) - 0.47)*15. + p.x*0.011));
    float rill = (1. - smoothstep(0.05, 0.14, rillN))*(1. - dry)*(1. - sqK)*smoothstep(0.4, 0.56, fb(p*0.045 + 2.9));                               // rills draining seaward between the bars
    float tide = smoothstep(0.562, 0.587, fb(p*0.031 + 23.7) + 0.05*(fb(p*0.21 + 4.1) - 0.47))*(1. - dry)*(1. - sqK);   // tide pools left standing in the hollows of the flat, each with its shoreline
    float pan = lowK*(1. - smoothstep(0.478, 0.512, bar + 0.05*(fb(p*0.11 + 5.9) - 0.47)))*(1. - sqK)*(1. - dry);   // on the lower flat: wide shallow pans standing in the hollows between the bars, drawn out down the drainage as the bars are
    float deep = max(max(max(max(pool, tide), chan), 0.8*rill), pan)*Z;                                    // where water stands: a mirror
    wet = mix(wet, 1. - dry, Z);
    float sea = smoothstep(-420., -445., p.x); wet = max(wet, sea);
    float damp = max(clamp(smoothstep(0.35, 0.5, bg) + bank, 0., 1.), wet);        // dry and warm, then dark and sodden, then a mirror
    damp = mix(damp, max(wet, 1. - smoothstep(dryT + 0.012, dryT + 0.045, bar)), Z);              // (a bar is sodden at its rim, dry and pale on its crown)
    vec3 base = mix(vec3(0.285,0.212,0.132)*(1. + 0.14*Z)*(0.72+0.56*fine)*(0.78 + 0.5*fb(p*0.06 + 9.)), vec3(0.12,0.092,0.07)*(0.8+0.4*fine), damp);
    base = mix(base, mix(vec3(0.066,0.06,0.058), vec3(0.148,0.104,0.066)*(1. - 0.3*bank), Z)*(0.85+0.3*fine), wet*0.9);   // under the film the mud is chocolate, not black
    base *= 1. + 0.24*lowK*smoothstep(dryT + 0.012, dryT + 0.06, bar)*(1. - sqK);     // the crowns of the bars between the pans: dry, pale sand
    base = mix(base, vec3(0.2,0.158,0.108)*(0.9 + 0.2*fine), 0.7*pan);              // the bed of a pan: pale sand a hand's depth under the water
    float rip = 0.5 + 0.5*sin(p.x*2.3 + p.y*0.4*(vn(p*0.03)-0.5) + fb(p*0.15)*14. + vn(p*0.6)*3.);
    base *= 1. - 0.2*nearK*mix(1. - wet, 0.75*(1. - deep + 0.8*pan), Z)*rip*(1. - sqK);      // ripple marks (they show through the film on the lower flat)
    base *= 1. - 0.3*Z*(1. - sqK)*(1. - deep)*smoothstep(50., 12., dist)*step(0.8, vn(p*4.3 + 5.));   // worm casts and shell, close to
    float trail = 1. - smoothstep(0.006, 0.016, abs(vn(p*0.021 + 17.) - 0.5));                         // trodden trails wandering between the hulls, footprint by footprint close to
    trail = max(trail, Z*(1. - smoothstep(0.006, 0.017, abs(vn(p*0.037 + 41.) - 0.5))))*(1. - sqK)*(1. - deep);   // (more of them where the town is thickest; they show in the film too)
    base *= 1. - 0.34*mix(1. - wet, 0.85, Z)*trail*mix(0.75, 0.45 + 0.55*step(0.5, vn(p*3.1)), nearK)*(1. - smoothstep(60., 300., dist));
    // the square's paving: long strakes of deck plate with staggered butts, each plate its own tone of steel and rust, dark seams,
    // tide water lying in the dished ones
    float prow = floor((p.y - 17.2)/1.85); vec2 pq = vec2(p.x/5.2 + 0.5*mod(prow, 2.) + 0.13*prow, (p.y - 17.2)/1.85), pid = floor(pq), pf = fract(pq);
    float seam = min(min(pf.x, 1. - pf.x)*5.2, min(pf.y, 1. - pf.y)*1.85), pt = h21(pid*7.13 + 3.);
    vec3 plate = mix(vec3(0.2,0.165,0.135), vec3(0.2,0.105,0.066), smoothstep(0.38, 0.62, fb(p*0.23 + pt*9.)))*(0.74 + 0.5*pt)*(0.86 + 0.28*fine);
    plate *= 1. - 0.55*(1. - smoothstep(0.03, 0.1, seam));
    plate *= 1. - 0.25*smoothstep(34., 8., dist)*step(0.5, fract(p.x*3.1 + p.y*3.1))*step(0.5, fract(p.x*3.1 - p.y*3.1))*smoothstep(0.1, 0.3, seam);   // the tread of the plate, close to
    float pud = smoothstep(0.515, 0.54, fb(p*0.27 + 31.) + 0.16*(pt - 0.5))*smoothstep(0.08, 0.3, seam)*sqK;
    base = mix(base, plate*(1. - 0.35*pud), sqK); wet = mix(wet, 0.24 + 0.76*pud, sqK); deep = max(deep*(1. - sqK), 0.9*pud);   // (a quarter of a film on the plate, so its seams and rust read; the dished plates hold the mirrors)
    float r1 = vn(p*1.7 + vec2(uTime*0.35, uTime*0.12)) - 0.5, r2 = vn(p*1.9 - vec2(uTime*0.22, uTime*0.05)) - 0.5;
    float nk = 0.07*wet*(0.2 + 0.8*nearK); vec3 n = normalize(vec3(r1*nk + (fine-0.5)*0.04, 1., r2*nk));
    vec3 r = reflect(v, n); r.y = abs(r.y);
    float F = 0.04 + 0.96*pow(1. - clamp(dot(-v, n), 0., 1.), 5.);
    vec3 sky = mix(uSkyH, uSkyZ, pow(clamp(r.y, 0., 1.), uRefl.x))*mix(uRefl.y, uRefl.z, uTear);                 // the film holds the upper sky: bluer and deeper than the haze at the horizon
    vec2 rh = r.xz/max(length(r.xz), 1e-3); float tw0 = max(dot(rh, uSunH), 0.); sky += uGlow*tw0*tw0*tw0*(1. - 0.8*clamp(r.y*1.7, 0., 1.));   // the low sun's glow lying in the wet
    float sh = msk.r*uShK;                                                          // the long shadow of a hull, a mast, a boat
    float cs = smoothstep(0.42, 0.62, fb(p*0.0035 + vec2(uTime*0.042, uTime*0.015)))*(0.5 + 0.5*uTear);   // under the veil the sun comes through in slow soft patches; once the fog has torn they are cloud shadows sliding seaward over the flat
    float sunK = (1. - sh)*(1. - 0.6*cs);
    vec3 lit = base*(uAmb*0.9 + uSunCol*mix(0.78, mix(0.4, 0.84, Z), wet)*sunK);  // (a film leaves the mud its sunlight, so a shadow shows on it)
    // the gate's glow lying in the wet: where the mirrored line of sight passes under the arch and meets the portal at mid-beam
    float gz = min(r.z, -1e-3), gt0 = -w.z/gz, gt1 = (17. - w.z)/gz; vec3 g0 = w + r*gt0, g1 = w + r*gt1;
    float archD = g1.y < 8. ? abs(g1.x) : length(vec2(g1.x, g1.y - 8.)), gd = length(vec2(g0.x, g0.y - 8.));
    float gate = step(17.5, w.z)*step(r.z, -1e-3)*smoothstep(8., 7., archD)*(smoothstep(8.6, 5.4, gd) + 0.22*smoothstep(15., 7., gd));
    sky = mix(sky, uGate, clamp(gate, 0., 1.));
    sky *= (1. - mix(0.4, 0.74, Z)*sh)*(1. - 0.22*cs);
    float refl = wet*(0.26 + 0.62*F) + (1.-wet)*F*(0.1 + 0.26*damp);
    refl = mix(refl, wet*mix(0.07 + 0.05*(1. - uTear) + 0.52*F, 0.46 + 0.46*F, deep) + (1. - wet)*F*0.12, Z);   // a thin film shines at a slant and shows its mud from above; standing water is a mirror from anywhere
    refl = mix(refl, mix(0.5, 0.8, uTear) + 0.16*F, pan);                           // a pan is a mirror from straight above as from a slant (under the veil there is only pearl to hold, and its sand bed shows through)
    float reflM = refl;                                                             // (what the mirrored hulls are laid in: the film and the standing water, not the troughs)
    float trough = (1. - smoothstep(0.1, 0.42, rip))*nearK*wet*(1. - deep)*(1. - sqK)*smoothstep(0.38, 0.6, fb(p*0.083 + 13.7));     // close to, water lies in the troughs of the ripples, in patches, and holds the sky: bright threads between dark ridges
    refl = mix(refl, max(refl, 0.3 + 0.5*F), 0.7*trough);
    refl *= 1. - 0.38*smoothstep(0.5, 0.95, rip)*(1. - smoothstep(30., 260., dist))*(1. - chan)*(1. - sea)*(1. - deep)*(1. - sqK);   // ripple ridges standing proud of the film: wet mud, not open water
    refl *= 1. - 0.6*trail*Z*(1. - smoothstep(60., 300., dist));                    // trodden mud holds no mirror
    float paw = smoothstep(0.43, 0.57, fb(p*0.023 + vec2(uTime*0.4, uTime*0.14)));                          // cat's paws: gusts ruffle the film and sweep seaward with the wind
    float ruf = smoothstep(0.3, 0.7, vn(vec2(p.x*0.52 + uTime*1.5, p.y*0.21 + uTime*0.33)));                  // inside a gust the film is wavelets, crests across the wind, running with it
    ruf = mix(0.5, ruf, smoothstep(340., 110., dist));
    refl *= 1. - 0.62*mix(1., 0.4, Z)*paw*(0.4 + 1.2*ruf)*wet*(1. - sea)*smoothstep(520., 60., dist); lit *= 1. + 0.12*paw*wet;
    vec3 c = mix(lit, sky, refl);
    float rs = mix(refl, 0.3, pan);                                                 // (a shadow lying on a pan takes the sunlit bed and the sparkle out of it and leaves a darker, bluer sky)
    c = mix(c, uShC*(0.6 + 0.5*fine)*(1. + 1.2*rs) + 0.5*sky*gate*refl + 0.55*sky*rs*deep, 0.84*sh*Z);   // the long shadows lie blue-violet and dark on the shining flat
    float sd = max(dot(r, uSun), 0.), s2 = sd*sd, s4 = s2*s2, s8 = s4*s4, s16 = s8*s8;
    float gl = (s16*s16*s16*s16*s16*s16*s16*s16*s16*s16*5. + s8*s4*s2*0.5)*wet*(0.25 + 0.75*uTear);
    float band = uGlit.y + (1. - uGlit.y)*smoothstep(0.42, 0.72, vn(p*0.045 + vec2(uTime*0.06, 0.)));       // glitter comes in slow bands that crawl over the flat
    float tw = (step(0.915, vn(p*3. + vec2(uTime*0.7, uTime*0.4)))*(0.6 + 2.*tw0*tw0) + 0.6*step(0.95, vn(p*1.1 - vec2(uTime*0.5, uTime*0.3)))*smoothstep(60., 200., dist))*wet*mix(1., 0.3 + 0.7*deep, Z)*(0.45 + 0.55*uTear)*band*smoothstep(380., 40., dist);
    c += uSunCol*(gl + tw*uGlit.x)*sunK*(1. - 0.4*cs);
    c += uSunCol*0.05*pan*sunK*uTear;                                               // once the sun is out, the standing water is alight with it wherever no shadow lies
    c += vec3(0.07)*step(0.8, vn(vec2(p.x*0.5 + uTime*0.9, p.y*1.3)))*max(chan, 0.35*rill*Z)*smoothstep(220., 30., dist);   // foam flecks running seaward
    float surf = smoothstep(4., 0., abs(p.x + 432. + 5.*sin(p.y*0.031 + uTime*0.4)));                       // the thin bright line where the sea begins
    c = mix(c, sky*1.04, sea*0.45) + (uAmb + uSunCol*0.5)*surf*0.35;
    float brk = smoothstep(0.3, 0.62, vn(vec2(p.x*0.7 + uTime*0.5, p.y*1.9 - uTime*0.2)));                    // the image in standing water is whole close to and broken into wind-streaks further off
    float mkF = min(refl, reflM)*1.5*(1. + 0.45*sh)*smoothstep(0.15, 0.6, wet);                                          // the image lies only in what is wet: none on a dry bar, a trace on damp plate;
    mirrorK = clamp(mix(mkF*smoothstep(0.16, 0.5, mkF), mkF, deep), 0., 0.94)*(1. - sea)*(1. - 0.55*deep*brk*smoothstep(28., 120., dist)); gDeep = deep;   // a film holds it only at a slant (none under the eye, where it was a faint double of the hull), standing water whole from anywhere
    return c;
  }`;
const AIR0 = `
#ifdef USE_FOG
vFogDepth *= hazeK(0.);
#endif
`;   // (the mud, and the images in it, lie at the foot of the low haze: see HAZE_GLSL in the part)
const MUD_VERT = `varying vec3 vW; ${fx.GLSL_FOG_PARS_VERT} ${HAZE_GLSL}
  void main(){ vec4 wp = modelMatrix*vec4(position,1.); vW = wp.xyz; vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition; ${fx.GLSL_FOG_VERT} ${AIR0} }`;
const MUD_FRAG = `${MUD_PARS} varying vec3 vW; ${fx.GLSL_FOG_PARS_FRAG}
  void main(){ float mk; vec3 c = mudShade(vW, mk); gl_FragColor = vec4(fxApplyFog(c), 1.); }`;
const MIR_VERT = `attribute vec3 color; varying vec3 vW; varying vec3 vC; varying vec2 vUv; varying vec3 vN; ${fx.GLSL_FOG_PARS_VERT} ${HAZE_GLSL}
  uniform float uTime;
  void main(){ vec4 wp = modelMatrix*vec4(position,1.); float dep = clamp(-wp.y, 0., 9.);
    wp.x += sin(uTime*1.7 + wp.z*0.31 + wp.y*0.9)*0.03*dep; wp.z += sin(uTime*1.3 + wp.x*0.27 + wp.y*1.1)*0.025*dep;   // the image trembles more the deeper it lies
    vW = wp.xyz; vC = color; vUv = uv; vN = normal;
    vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition; ${fx.GLSL_FOG_VERT} ${AIR0} }`;
const MIR_FRAG = `${MUD_PARS} uniform sampler2D map, emap; uniform float uUseMap, uEmi; varying vec3 vW; varying vec3 vC; varying vec2 vUv; varying vec3 vN; ${fx.GLSL_FOG_PARS_FRAG}
  void main(){
    if (vW.y > -0.01) discard;                                                     // nothing of the mirror shows above the ground
    vec3 toF = vW - cameraPosition; float k = cameraPosition.y/max(cameraPosition.y - vW.y, 1e-3);
    vec3 g = cameraPosition + toF*k; g.y = 0.;                                     // where this line of sight meets the mud
    float mk; vec3 mudC = mudShade(g, mk);
    vec3 tx = texture2D(map, vUv).rgb, alb = vC*mix(vec3(1.), tx, uUseMap);
    float nl = length(vN); vec3 n = nl > 1e-4 ? vN/nl : vec3(0., 1., 0.);
    float d = 0.35 + 0.65*clamp(dot(n, uSun)*0.5 + 0.5, 0., 1.);
    vec3 img = alb*(uAmb*0.8 + uSunCol*0.8*d) + texture2D(emap, vUv).rgb*uEmi*uUseMap;
    float fade = mix(smoothstep(40., 5., -vW.y), smoothstep(95., 8., -vW.y), gDeep);   // a film of water holds the image of what stands low and near it; standing water holds the whole height
    // The mud under an image is fogged by its own distance, as the mud beside it is, and the image fades with the fog that lies between the
    // wet ground and the thing mirrored (a hull lost in the veil leaves no pale shape of itself on the sand).
    #ifdef FOG_EXP2
      float fM = fxFog(), dg = vFogDepth*k, fG = 1. - exp(-fogDensity*fogDensity*dg*dg), seg = clamp((fM - fG)/max(1. - fG, 1e-3), 0., 1.);
      gl_FragColor = vec4(mix(mix(mudC, img, mk*fade*(1. - seg)*(1. - seg)), fogColor, fG), 1.);
    #else
      gl_FragColor = vec4(fxApplyFog(mix(mudC, img, mk*fade)), 1.);
    #endif
  }`;
// specks that walk between two points: people, rickshaws, goats, baskets on ropes, gulls standing on the mud. uv.x says which
// part a vertex belongs to (1, 2: legs that swing; 3: a head-load only a third carry), uv.y whether it takes the instance colour.
const SPECK_VERT = `attribute vec3 aA; attribute vec3 aB; attribute vec4 aC; attribute vec3 color; uniform float uTime; uniform vec3 uOff, uSun, uAmb, uSunCol; varying vec3 vC; ${fx.GLSL_FOG_PARS_VERT} ${HAZE_GLSL}
  void main(){ float ph = aC.w, th = uTime*0.25*(0.6 + fract(ph*7.3)) + ph*6.283, k = 0.5 - 0.5*cos(th);
    vec3 d = aB - aA; float dl = length(d.xz), mv = step(1e-3, dl); vec2 f = dl > 1e-3 ? d.xz/dl : vec2(cos(ph*40.), sin(ph*40.));
    f *= sin(th) >= 0. ? 1. : -1.;
    vec3 q = position; float sw = sin(uTime*(5. + 2.*fract(ph*3.1)) + ph*40.)*0.55*mv;
    if (uv.x > 0.5 && uv.x < 2.5) { float s = uv.x < 1.5 ? sw : -sw; vec2 r = vec2(q.z, q.y - 0.86); q.z = r.x*cos(s) - r.y*sin(s); q.y = 0.86 + r.x*sin(s) + r.y*cos(s); }
    if (uv.x > 2.5) q = mix(vec3(0., 1.55, 0.), q, step(0.66, fract(ph*13.7)));
    q.y += abs(sw)*0.07;
    vec3 wp = mix(aA, aB, k) + uOff + vec3(q.x*f.y + q.z*f.x, q.y, -q.x*f.x + q.z*f.y);
    vec3 n = vec3(normal.x*f.y + normal.z*f.x, normal.y, -normal.x*f.x + normal.z*f.y);
    vC = color*mix(vec3(1.), aC.rgb, uv.y)*(uAmb + uSunCol*(0.2 + 0.8*clamp(dot(n, uSun)*0.5 + 0.5, 0., 1.)));
    vec4 mvPosition = viewMatrix*vec4(wp,1.); gl_Position = projectionMatrix*mvPosition; ${fx.GLSL_FOG_VERT}
#ifdef USE_FOG
vFogDepth *= hazeK(wp.y);
#endif
  }`;
const SPECK_FRAG = `varying vec3 vC; ${fx.GLSL_FOG_PARS_FRAG} void main(){ gl_FragColor = vec4(fxApplyFog(vC), 1.); }`;

// The whole town is built here. A browser compiles a function when it is first called, and this one is long. So it is written in
// parentheses, which lets the browser compile it with the file while the file loads; build() (at the foot of the file) hands the page
// back once before calling it, and it hands the page back again before its own first line, so that whatever is left of that work is a
// loading step of its own and not part of the step that loads the module.
const buildTown = (async function (ctx) {
    await ctx.yield();
    const rng = ctx.rng, vary = ctx.vary || {}, vr = rng.fork('ht-variant');
    const m0 = vr(), f0 = vr(), l0 = (vr() + 0.63) % 1, density = vary.density ?? 1, mood = vary.mood ?? m0, rare = !!vary.rare, detail = ctx.quality?.detail ?? 1;
    // the look: the viewer's hour first, otherwise by seed (half the visits a winter morning, a quarter the kite festival)
    const look = vary.hour === 'golden' ? 'golden' : vary.hour === 'night' ? 'night' : l0 < 0.5 ? 'morning' : l0 < 0.75 ? 'kite' : l0 < 0.9 ? 'golden' : 'night';
    const festival = look === 'kite', night = look === 'night', LK = LOOKS[festival ? 'morning' : look];
    const fams = [[PAL.teal, PAL.pink, PAL.yellow], ['#d9b23a', '#3f8f4a', '#F2EFE6'], ['#2f62a8', '#F2EFE6', PAL.pink]];
    const fam = fams[Math.floor(f0 * 3) % 3];
    const uT0 = lerp(0.335, 0.385, mood), uT1 = uT0 + 0.115;                     // when the fog tears
    const scene = new THREE.Scene(), T = { value: 0 };
    await ctx.yield();
    const path = makePath(PTS), duration = 45;
    await ctx.yield();
    const tan = new THREE.Vector3(), pp = new THREE.Vector3();
    const frame = (u, side = 0, up = 0) => { path.pointAt(Math.min(1, Math.max(0, u)), pp); path.tangentAt(Math.min(1, Math.max(0, u)), tan); const l = Math.hypot(tan.x, tan.z) || 1; return [pp.x - tan.z / l * side, pp.y + up, pp.z + tan.x / l * side]; };

    // ---- two skies cross-faded by progress: fog first (pearl, gold or silver), the open sky after the tear ----
    await ctx.yield();
    const skyA = makeSky({ rng, sunElevation: Math.min(LK.el, 20), sunAzimuth: LK.az, sunIntensity: 0, clouds: false, clouds2: false, renderer: ctx.renderer, ...LK.a });   // (the morning's pearl sky carries faint combed cloud of its own)
    await ctx.yield();
    const skyB = makeSky({ rng, clouds: false, renderer: ctx.renderer, noiseTexture: skyA.noiseTexture, ...LK.b, ...(night ? { bodyOverrides: { 0: { elevation: LK.el, azimuth: LK.az } } } : { sunElevation: LK.el, sunAzimuth: LK.az }) });
    await ctx.yield();
    skyB.material.transparent = true; if (skyB.materialLow) skyB.materialLow.transparent = true;   // the kit's default dome is drawn without blending (three.js r170), so setOpacity cut the open sky in at full strength in one frame; in the transparent pass it fades as the fog tears
    scene.add(skyA.object, skyB.object); skyB.setOpacity(0);
    const pearl = col(LK.fog), haze = col(LK.haze), pearlZ = col(LK.skyZ), pearlH = col(LK.skyH);
    scene.fog = new THREE.FogExp2(pearl.clone(), 0.0031);
    const rig = makeLightRig(skyB, { shadow: true, shadowSize: 2048, shadowRange: 120, bounce: 0.4 }); scene.add(rig.object);
    const hemi0 = rig.hemi.intensity, SUN = skyB.lightDirection.clone().normalize(), sunArr = [SUN.x, SUN.y, SUN.z];
    const shl = Math.hypot(SUN.x, SUN.z) || 1, SX = -SUN.x / shl, SZ = -SUN.z / shl, SHK = Math.min(3.6, shl / Math.max(SUN.y, 0.1));   // where shadows fall, and how long
    rig.sun.color.set(LK.sunC);
    await ctx.yield();

    // ---- the mud: wet and drying patches, braided channels, sky in the film of water. Drawn first without depth; the mirrors
    // (y-flipped hulls) go on top of it, then an unseen ground plane puts the depth back so nothing below the mud shows ----
    const blackTex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); blackTex.needsUpdate = true;
    const hazeU = { value: 0 }, flagM = [];                                      // hazeU: the fog's own state for the rule of the air (0 under the veil, 1 once it has torn; see HAZE_GLSL in the part). flagM: the flags of the bunting lines over the lower flat and the liner, again, for their image in the standing water
    const mudU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uClear: hazeU, uTime: T, uTear: { value: 0 }, uFilm: { value: LK.film }, uSun: { value: SUN.clone() }, uSunH: { value: new THREE.Vector2(-SX, -SZ) }, uSunCol: { value: col(LK.sunC) },
      uAmb: { value: new THREE.Color(0.7, 0.7, 0.7) }, uSkyZ: { value: pearl.clone() }, uSkyH: { value: pearl.clone() }, uGlow: { value: new THREE.Color(...LK.glow) },
      uShK: { value: LK.shOp[0] }, uShC: { value: new THREE.Color(0.092, 0.106, 0.155) }, uGate: { value: new THREE.Color(2.3, 1.62, 0.86) }, uGlit: { value: new THREE.Vector2(LK.glit[0], LK.glit[1]) }, uRefl: { value: new THREE.Vector3(LK.refl[0], LK.refl[1], LK.refl[2]) }, uMask: { value: blackTex }, uMaskR: { value: new THREE.Vector4(0, 0, 1, 1) } };
    await ctx.yield();
    const mudG = new THREE.PlaneGeometry(3000, 3000, 4, 4).rotateX(-Math.PI / 2);   // (flat, and shaded by the pixel: a few large quads carry it exactly; the 3,536 triangles the finer grid cost, here and in the depth plane, pay for the life added to the lower flat)
    const mud = new THREE.Mesh(mudG, new THREE.ShaderMaterial({ fog: true, depthWrite: false, uniforms: mudU, vertexShader: MUD_VERT, fragmentShader: MUD_FRAG }));
    mud.position.set(0, 0, 300); mud.renderOrder = -0.47; scene.add(mud);   // after the incoming sky, which the kit draws at -0.5 while it fades in (drawn before it, the flat went white for the whole tear)
    await ctx.yield();
    const ground = new THREE.Mesh(mudG, new THREE.MeshBasicMaterial({ colorWrite: false, fog: false })); ground.position.copy(mud.position); ground.renderOrder = -0.4; scene.add(ground);
    const mirrorMat = (map, emap, emi) => new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, vertexShader: MIR_VERT, fragmentShader: MIR_FRAG,
      uniforms: { ...mudU, map: { value: map }, emap: { value: emap }, uUseMap: { value: map ? 1 : 0 }, uEmi: { value: emi } } });
    const mirror = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.scale.y = -1; m.renderOrder = -0.44; m.frustumCulled = false; scene.add(m); return m; };
    await ctx.yield();

    const arena = makeArena(96 * 1048576);                                       // one block of memory for all the merged geometry (see makeArena)
    await ctx.yield();
    const hero = await buildHero(ctx, { palette: PAL, night, time: T, shadeX: SUN.x > 0 ? -1 : 1, arena, air: hazeU, flagSink: flagM });
    scene.add(hero.object);
    const windMat = hero.windMat, ribMat = hero.ribMat, waterMat = hero.waterMat;
    windMat.uniforms.uSun.value.copy(SUN); waterMat.uniforms.uSun.value.copy(SUN);
    const emiK = night ? 3.2 : 0.5;
    mirror(hero.mirror.painted, mirrorMat(hero.texture, hero.hullMat.emissiveMap, emiK)); const plainMirrorMat = mirrorMat(null, blackTex, 0); plainMirrorMat.uniforms.map.value = blackTex;   // (the liner's houses, funnels and masts are mirrored with the town's, below: one mesh)
    await ctx.yield();

    // ---- the town: lived-in hulls with real ship form, standing on raking timber shores ----
    const hr = rng.fork('hulls');
    const { atlas, atlasEmi } = await townAtlas(ctx, rng.fork('atlas'), fam, night ? 0.7 : 0.22); await ctx.yield();
    const bump = plateBump(rng.fork('bump')); bump.repeat.set(14, 12); await ctx.yield();
    const paintedMat = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlasEmi, emissive: col('#ffb060'), emissiveIntensity: night ? 3.4 : 0.7, bumpMap: bump, bumpScale: 1.4, vertexColors: true, roughness: 0.75, metalness: 0.05, side: THREE.DoubleSide });
    const plainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide });
    const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: true });
    for (const m of [paintedMat, plainMat, glowMat]) airMaterial(m, hazeU);
    const painted = makeBag(arena, 200000), paintedFar = makeBag(), plain = makeBag(arena, 600000), core = makeBag(arena, 80000), glow = makeBag(arena, 80000), wind = makeWindBag(arena, 220000), rib = makeRibbonBag(arena, 160000);   // each in one run of the block, sized with room to spare
    const C = { deck: col('#6a5a4a'), white: col('#c6c0b2'), tar: col('#22262a'), timber: col('#7a5c3e'), pale: col('#b4ad9e'), rope: col('#3a3430'), rust: col('#8a3c28'), cream: col('#e6e2d8'),
      teal: col(fam[0]), pink: col(fam[1]), yellow: col(fam[2]), orange: col(PAL.orange).multiplyScalar(0.9), leaf: col('#4f8a34'), leaf2: col('#9fbf4e'), cable: col('#2a2a2c'), marigold: col('#f0901c'),
      bronze: col('#b48a3c'), steel: col('#6d7478'), net: col('#35807c'), net2: col('#2f5f9a'), straw: col('#c9a865'), skin: col('#7a4a30'), earth: col('#6a5a44'), plank: col('#8a7257'), tarp: col('#8a7450') };
    const cloth = [C.teal, C.pink, C.yellow, col('#e6e2d8'), C.orange, col('#3f6fb0'), col('#b03a4a'), col('#7a4a9a')];
    const tins = [C.teal, C.pink, C.yellow, C.white];
    const hulls = [], smokeAt = [], shPoly = [], scourP = [], poolP = [], poolU = [], lampP = [];
    const GLS = col('#1d2a36'), CAP = col('#15171a'), LIT = new THREE.Color(4.2, 2.5, 0.95);
    const mH = new THREE.Matrix4(), mL = new THREE.Matrix4(), mR = new THREE.Matrix4(), v3 = new THREE.Vector3(), qB = new THREE.Quaternion(), XA1 = new THREE.Vector3(1, 0, 0), vS = new THREE.Vector3();
    // shared pieces, expanded once: box, window pane, oval funnel shell, bridge front, mast, propeller, lifeboat
    const ni = (g) => { if (!g.index) return g; const o = g.toNonIndexed(); g.dispose(); return o; };
    const BOXG = ni(new THREE.BoxGeometry(1, 1, 1)), PANE = ni(new THREE.PlaneGeometry(1, 1)), FUNG = ni(new THREE.CylinderGeometry(0.5, 0.56, 1, 12, 1, true)), DISC = ni(new THREE.CircleGeometry(0.5, 12).rotateX(-Math.PI / 2)),
      HALF = ni(new THREE.CylinderGeometry(0.5, 0.5, 1, 9, 1, false, 0, Math.PI)), POLE = ni(new THREE.CylinderGeometry(0.5, 0.5, 1, 6, 1, true)), TANK = ni(new THREE.CylinderGeometry(0.5, 0.5, 1, 8));
    const TOPQ = ni(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)), FRM = col('#d9d3c4'), LITN = new THREE.Color(1.25, 0.62, 0.2), LITD = new THREE.Color(1.9, 1.12, 0.46), HATCH = col('#5a3428'), HAWS = col('#a08a5c'), SHORE = col('#a08260'), SHORE2 = col('#7d6448');
    const PLK = [C.plank, C.plank.clone().multiplyScalar(0.84), col('#9a7f5e'), col('#75614c')], SHUT = [C.teal, C.pink, C.yellow, C.teal.clone().multiplyScalar(0.7)];
    const seedN = typeof ctx.seed === 'number' ? ctx.seed : 7, dq0 = lcg(seedN * 2654435 + 977), nq = lcg(seedN * 48271 + 4201), roofWalk = [], roofStand = []; let dqS = dq0; const dq = () => dqS();   // a private stream for the close-range dress: it never shifts the layout's draws
    await ctx.yield();
    const PROPG = (() => { const b = makeBag(), s = new THREE.SphereGeometry(1, 6, 4); for (let k = 0; k < 4; k++) { mL.makeRotationZ(k * Math.PI / 2).multiply(trs(0, 0.58, 0, 0, 0.6, 0, 0.3, 0.46, 0.05)); b.add(s, mL, C.bronze); } b.add(s, trs(0, 0, 0, 0, 0, 0, 0.17, 0.17, 0.3), C.bronze); s.dispose(); return b.build(); })();
    const BG = hullGeometry({ L: 7, B: 2.4, D: 1.2, stations: 6, ring: 3, box: 2.6, rake: 0.3, capA: true }), BSIDE = ni(BG.side), BDECK = ni(BG.deck);
    const BOATG = (() => { const b = makeBag(); b.add(BSIDE, trs(0, 0, 0), col('#ffffff')); b.add(BDECK, trs(0, -0.12, 0), col('#8a6a4a')); return b.build(); })();
    await ctx.yield();
    const beam = (a, b, w, t, c, bag = plain) => { vS.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const l = vS.length() || 1; qB.setFromUnitVectors(XA1, vS.divideScalar(l)); mL.compose(v3.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), qB, vS.set(l, t, w)); bag.add(BOXG, mL, c); };
    const addHull = async (h) => {                                            // yields inside: no long step while loading
      const { L, B, D, kind } = h, sink = 0.5, o = h.o = { L, B, D, sheer: 0.06, rake: 0.5 };
      const pd = path.nearestXZ(h.x, h.z).dist, near = h.near = h.named || pd < 250, sideBag = near ? painted : paintedFar, cb = near ? core : plain; h.close = h.named || pd < 110; h.rich = h.named || pd < 50;   // the full dress only where the journey can see it, the richest where it passes close
      await ctx.yield();
      const g = hullGeometry({ L, B, D, sheer: 0.06, stations: L > 80 ? 18 : 12, ring: 6, box: kind === 'tug' ? 3 : 5, rake: 0.5 });
      await ctx.yield();
      mH.makeRotationY(h.yaw).multiply(mR.makeRotationX(h.heel)).setPosition(h.x, -sink, h.z);
      await sideBag.addSteps(ctx, g.side, mH, h.tint, [0, h.row / 4 + 0.006, 1, (h.row + 1) / 4 - 0.006], 1200); mH.makeRotationY(h.yaw).multiply(mR.makeRotationX(h.heel)).setPosition(h.x, -sink, h.z);
      if (!h.rich) plain.add(g.deck, mH, C.deck); g.side.dispose(); g.deck.dispose();
      await ctx.yield();
      const lg = (geo, x, y, z, sx, sy, sz, c, rx = 0, ry = 0, rz = 0, bag = plain) => { mL.copy(mH).multiply(trs(x, y, z, rx, ry, rz, sx, sy, sz)); bag.add(geo, mL, c); };
      const lb = (x, y, z, sx, sy, sz, c, rx = 0, rz = 0, bag = plain) => lg(BOXG, x, y, z, sx, sy, sz, c, rx, 0, rz, bag);
      const wpt = (x, y, z) => { v3.set(x, y, z).applyMatrix4(mH); return [v3.x, v3.y, v3.z]; };
      const rail = (pts, y0) => { const w = []; for (const p of pts) w.push(wpt(p[0], p[1], p[2])); rib.add(w, 0.03, C.pale); for (let i = 0; i < pts.length; i++) rib.add([wpt(pts[i][0], y0, pts[i][2]), w[i]], 0.022, C.pale); };
      if (h.rich) {                                                              // the weather deck planked: strips laid fore and aft along the sheer
        const NSt = L > 80 ? 18 : 12, NJ = 8, up = [mH.elements[4], mH.elements[5], mH.elements[6]];
        for (let j = 0; j < NJ; j++) { const f0 = -1 + 2 * j / NJ, f1 = -1 + 2 * (j + 1) / NJ, tone = PLK[(j * 3 + hulls.length) % 4]; let e0 = deckEdge(o, -0.5);
          for (let i = 0; i < NSt; i++) { const e1 = deckEdge(o, -0.5 + (i + 1) / NSt), y0 = e0[1] * 0.985, y1 = e1[1] * 0.985;
            plain.quad(wpt(e0[0], y0, e0[2] * f0), wpt(e0[0], y0, e0[2] * f1), wpt(e1[0], y1, e1[2] * f1), wpt(e1[0], y1, e1[2] * f0), up, tone); e0 = e1; } }
        await ctx.yield(); }
      // a free stretch of weather deck between stations s0 and s1: a duckboard walk, a hatch under its tarpaulin, a coiled hawser, a winch, bollards
      const dress = (s0, s1) => { const e0 = deckEdge(o, s0), e1 = deckEdge(o, s1), em = deckEdge(o, (s0 + s1) / 2), y0 = e0[1] * 0.985, y1 = e1[1] * 0.985, ym = em[1] * 0.985, len = e1[0] - e0[0], nseg = Math.max(1, Math.round(len / 4));
        for (let i = 0; i < nseg; i++) { const a = deckEdge(o, lerp(s0, s1, i / nseg)), b = deckEdge(o, lerp(s0, s1, (i + 1) / nseg)); beam(wpt(a[0], a[1] * 0.985 + 0.07, a[2] * 0.52), wpt(b[0], b[1] * 0.985 + 0.07, b[2] * 0.52), 0.8, 0.07, i % 2 ? C.straw : PLK[2]); }
        if (len > 5) { const hw = Math.min(len * 0.42, 5.5), hb = Math.max(1.2, em[2] * 0.5); lb(em[0], ym + 0.33, -em[2] * 0.2, hw, 0.66, hb, HATCH); lb(em[0], ym + 0.7, -em[2] * 0.2, hw + 0.2, 0.09, hb + 0.2, dq() < 0.5 ? C.tarp : C.steel); }
        lg(TANK, e0[0] + 1.2, y0 + 0.14, -e0[2] * 0.55, 1.3, 0.26, 1.3, HAWS);
        lg(TANK, e1[0] - 1.4, y1 + 0.55, 0, 0.8, 1.3, 0.8, C.steel, Math.PI / 2); lb(e1[0] - 1.4, y1 + 0.12, 0, 1.1, 0.24, 1.7, CAP);
        for (const sg of [1, -1]) for (const e of [e0, e1]) lg(POLE, e[0] + (e === e0 ? 0.7 : -0.7), e[1] * 0.985 + 0.3, sg * e[2] * 0.8, 0.26, 0.6, 0.26, CAP); };
      // a deckhouse tier: plated block with a weathered skirt, its own windows (framed; some shuttered in tin colours, some lit), an
      // overhanging planked roof with a pipe rail and the life of a roof (washing, benches, drums of banana and marigold, skylights),
      // a door aft; the bridge tier gets a rounded front with a wrap of wheelhouse glass. occ: stretches of the roof something stands on
      const hs = async (x, y, z, sx, sy, sz, c, bridge = false, occ = null, lane = 0.3) => {
        lb(x, y, z, sx, sy, sz, c, 0, 0, cb); lb(x, y - sy * 0.5 + 0.22, z, sx + 0.06, 0.44, sz + 0.06, c.clone().lerp(C.rust, 0.45).multiplyScalar(0.8));
        lb(x + (bridge ? sz * 0.12 : 0), y + sy * 0.5 + 0.07, z, sx + 0.8 + (bridge ? sz * 0.26 : 0), 0.14, sz + 0.9, C.pale);
        if (bridge) { lg(HALF, x + sx / 2, y, z, sz * 0.56, sy, sz, c); lg(HALF, x + sx / 2, y + sy * 0.14, z, sz * 0.57, sy * 0.34, sz * 1.012, night ? LIT : GLS, 0, 0, 0, night ? glow : plain); }
        if (!near) { lb(x, y + sy * 0.12, z, sx * 0.94, sy * 0.3, sz + 0.08, GLS); return; }
        const n = Math.max(2, Math.round(sx / 2.3)), ww = Math.min(1.25, sx / n * 0.56), wy = y + sy * 0.13, wh = sy * 0.34, cl = h.close, rich = h.rich && !h.farHouse, oz = Math.sin(h.yaw), ox = Math.cos(h.yaw);
        for (let i = 0; i < n; i++) { if (i % 3 === 2) await ctx.yield(); for (const sg of [1, -1]) { const k = i * 7 + (sg > 0 ? 3 : 0) + ((x * 3) | 0), on = night && (k % 5) < 3, wx = x + ((i + 0.5) / n - 0.5) * sx, ry = sg > 0 ? 0 : Math.PI;
          if (!cl) { lg(PANE, wx, wy, z + sg * (sz / 2 + 0.03), ww, wh, 1, on ? LIT : GLS, 0, ry, 0, on ? glow : plain); continue; }
          const kk = ((k % 15) + 15) % 15, shut = !on && kk % 3 === 0, day = !on && (kk === 1 || kk === 8 || kk === 11);
          lg(PANE, wx, wy, z + sg * (sz / 2 + 0.04), ww + 0.24, wh + 0.24, 1, FRM, 0, ry, 0);
          lg(PANE, wx, wy, z + sg * (sz / 2 + 0.08), ww, wh, 1, on ? LITN : day ? LITD : shut ? SHUT[kk % 4] : GLS, 0, ry, 0, on || day ? glow : plain);
          if (shut || on) lg(PANE, wx, wy, z + sg * (sz / 2 + 0.11), 0.06, wh, 1, FRM, 0, ry, 0);
          if (rich) { if (h.sills) lb(wx, wy - wh / 2 - 0.14, z + sg * (sz / 2 + 0.1), ww + 0.36, 0.07, 0.2, C.pale);
            if (kk === 7 || kk === 13) { lb(wx, wy + 0.16, z + sg * (sz / 2 + 0.95), 0.05, 0.05, 1.9, C.timber);                    // washing pushed out on a pole
              wind.sheet(wpt(wx, wy + 0.13, z + sg * (sz / 2 + 0.3)), [sg * oz * 1.5, 0, sg * ox * 1.5], [0, -1.5, 0], 2, 2, cloth[(i * 3 + kk) % cloth.length], 0.5, wx + kk); } } } }
        if (cl) { const dk = c.clone().multiplyScalar(0.58), belt = c === C.white ? C.teal : C.cream;
          for (const sg of [1, -1]) { const ry = sg > 0 ? 0 : Math.PI; lg(PANE, x, y + sy * 0.5 - 0.15, z + sg * (sz / 2 + 0.035), sx, 0.3, 1, dk, 0, ry, 0); lg(PANE, x, y - sy * 0.19, z + sg * (sz / 2 + 0.035), sx, 0.11, 1, belt, 0, ry, 0); } }
        await ctx.yield();
        lb(x - sx / 2 - 0.04, y - sy * 0.12, z + sz * 0.2, 0.08, sy * 0.68, 0.85, CAP);
        if (cl) { const top = y + sy * 0.5 + 0.2, rw = sz - 0.56, ns = Math.max(2, Math.round(rw / 0.8)), w = rw / ns, m = Math.max(2, Math.round(sx / (rich ? 4.2 : 7)));
          for (let i = 0; i < ns; i++) lg(TOPQ, x, top, z - rw / 2 + (i + 0.5) * w, sx - 0.46, 1, w, PLK[(((i * 5 + ((x * 1.3) | 0)) % 4) + 4) % 4]);   // the planked roof
          for (let i = 0; i < m; i++) { const px = x + ((i + 0.5) / m - 0.5) * sx * 0.86; if (occ && occ.some((r) => px > r[0] - 1.3 && px < r[1] + 1.3)) continue;
            const q = rich ? (dq() * 7) | 0 : (i + ((x * 0.7) | 0)) % 3;
            if (q === 0) { lb(px, top + 0.28, z, 1.7, 0.55, 1.3, C.pale); lb(px, top + 0.58, z, 1.4, 0.05, 1.0, night ? LIT : GLS, 0, 0, night ? glow : plain); }
            else if (q === 1) { lg(TANK, px, top + 0.55, z + sz * 0.1, 0.5, 1.1, 0.5, C.steel); lg(TANK, px, top + 1.05, z + sz * 0.1 + 0.2, 0.62, 0.5, 0.62, C.orange, Math.PI / 2); }
            else if (q === 2 || !rich) lb(px, top + 0.2, z - sz * 0.24, 2, 0.4, 0.55, C.marigold);
            else if (q === 3) { lb(px, top + 0.25, z - sz * 0.12, 2, 0.5, 0.45, C.timber); lb(px + 0.3, top + 0.25, z + sz * 0.1, 0.45, 0.5, 2, C.timber); lb(px - 1.3, top + 0.3, z + sz * 0.06, 1.9, 0.16, 0.9, C.cream); if (roofStand.length < 24) roofStand.push(wpt(px - 0.5, top, z + sz * 0.02)); }
            else if (q === 4) { for (let k = 0; k < 3; k++) { const dx = px - 0.9 + k * 0.9, dz = z - sz * 0.2 + (k % 2) * 0.55; lg(TANK, dx, top + 0.4, dz, 0.62, 0.8, 0.62, [C.rust, C.teal, C.steel][k]);
                if (k === 1) { const p = wpt(dx, top + 0.8, dz); addBanana(wind, p[0], p[1], p[2], 2.3 + dq() * 1.2, dq, C.leaf, C.leaf2); } else lb(dx, top + 0.92, dz, 0.5, 0.26, 0.5, k ? C.marigold : C.leaf2); } }
            else if (q === 5 && sz > 5) { const zz = sz / 2 - 0.75; for (const sg of [1, -1]) lb(px, top + 1.2, z + sg * zz, 0.09, 2.4, 0.09, C.timber);
              const a = wpt(px, top + 2.38, z - zz), b = wpt(px, top + 2.38, z + zz), len = 2 * zz, dx = (b[0] - a[0]) / len, dz = (b[2] - a[2]) / len; rib.add(sagLine(a, b, 0.2, 5), 0.014, C.rope);
              for (let d = 0.5; d < len - 1.3; d += 1.25) { const t = d / len, r0 = dq(), r1 = dq(), r2 = dq(), r3 = dq(); if (r0 < 0.2) continue;
                wind.sheet([a[0] + dx * d, lerp(a[1], b[1], t) - 0.8 * t * (1 - t), a[2] + dz * d], [dx * 1.05, 0, dz * 1.05], [0, -(1.5 + r1 * 0.6), 0], 2, 3, cloth[(r2 * cloth.length) | 0], 0.5, r3 * 6, r3 < 0.35 ? C.cream : null); } }
            else if (roofStand.length < 24) roofStand.push(wpt(px, top, z - sz * 0.1), wpt(px + 0.7, top, z - sz * 0.1 + 0.5)); }
          if (rich && bridge) { const pw = sx * 0.7, pz = sz * 0.36, tc = tins[(dq() * 3) | 0];                                   // a tin shade roof over the wheelhouse top
            for (const dx of [-1, 1]) for (const dz of [-1, 1]) lb(x + dx * pw / 2, top + 1.05, z + dz * pz, 0.09, 2.1, 0.09, C.timber);
            wind.sheet(wpt(x - pw / 2 - 0.3, top + 2.15, z - pz - 0.3), [(pw + 0.6) * ox, 0, -(pw + 0.6) * oz], [(2 * pz + 0.6) * oz, -0.22, (2 * pz + 0.6) * ox], 2, 2, tc, 0.05, x, C.pale); }
          if (rich && !bridge && sx > 9) roofWalk.push([wpt(x - sx * 0.42, top + 0.02, z + sz * lane), wpt(x + sx * 0.42, top + 0.02, z + sz * lane), h.named ? 3 : 1, h.rs ? 1 : 0]);
          await ctx.yield(); }
        const hx = sx / 2 + 0.3, hz = sz / 2 + 0.35, ry = y + sy * 0.5 + 1.1;
        rail([[x - hx, ry, z - hz], [x + hx, ry, z - hz], [x + hx, ry, z + hz], [x - hx, ry, z + hz], [x - hx, ry, z - hz]], y + sy * 0.5 + 0.1);
      };
      // a raked oval funnel with a painted band and a sooted cap
      const fn = (x, y, z, sx, sy, sz, c, band) => { lg(FUNG, x, y, z, sx, sy, sz * 0.75, c, 0, 0, 0.14, cb); lg(FUNG, x - 0.03 * sy, y + sy * 0.2, z, sx * 1.05, sy * 0.16, sz * 0.79, band, 0, 0, 0.14);
        lg(FUNG, x - 0.06 * sy, y + sy * 0.43, z, sx * 1.07, sy * 0.14, sz * 0.8, CAP, 0, 0, 0.14); lg(DISC, x - 0.068 * sy, y + sy * 0.49, z, sx * 0.98, 1, sz * 0.73, CAP, 0, 0, 0.14); return wpt(x - 0.07 * sy, y + sy * 0.5, z); };
      const mast = (x, y0, hh, r = 0.42) => { lg(POLE, x, y0 + hh / 2, 0, r, hh, r, C.pale, 0, 0, 0, cb); lb(x, y0 + hh * 0.8, 0, 0.14, 0.14, hh * 0.22, C.pale); if (near) lampP.push(wpt(x, y0 + hh + 0.2, 0)); return wpt(x, y0 + hh, 0); };
      const cabin = (x, y, z, c) => { lb(x, y, z, 4, 2.6, 3, c); if (!near) return; lb(x, y + 1.42, z, 4.6, 0.1, 3.7, C.pale, 0.1); lb(x - 0.6, y - 0.25, z + 1.52, 0.8, 1.9, 0.06, CAP); lg(PANE, x + 1, y + 0.3, z + 1.53, 0.8, 0.7, 1, night ? LIT : GLS, 0, 0, 0, night ? glow : plain); };
      const hq = h.rs || (h.priv ? dq : hr), tin = () => tins[(hq() * 4) | 0];
      let fun = null, mastTop = null, boatDeck = null;
      if (kind === 'freighter') {
        for (let k = 0; k < 3; k++) { await hs(-0.36 * L, D + 1.5 + k * 3, 0, 0.16 * L - k * 3, 3, B * (0.82 - k * 0.14), k === 1 ? tin() : C.white, k === 2, k < 2 ? [[-0.36 * L - (0.16 * L - k * 3 - 3) / 2, -0.36 * L + (0.16 * L - k * 3 - 3) / 2]] : [[-0.4 * L - 2.4, -0.4 * L + 2.4]], k < 2 ? 0.46 : 0.3); await ctx.yield(); }
        boatDeck = [-0.36 * L, D + 3.1, 0.16 * L, B * 0.82];
        fun = fn(-0.4 * L, D + 12.5, 0, 3.6, 7.5, 3.6, C.tar, C.yellow);
        for (const fx0 of [-0.12, 0.1, 0.3]) { mast(fx0 * L, D, 16, 0.5); lb(fx0 * L + 5.5, D + 7, 0, 13, 0.35, 0.35, C.pale, 0, 0.5); lb(fx0 * L - 9, D + 0.7, 0, 12, 1.4, B * 0.5, C.rust); lb(fx0 * L - 9, D + 1.45, 0, 11.6, 0.12, B * 0.5 - 0.4, fx0 > 0 ? C.steel : C.tarp);
          if (near) rib.add([wpt(fx0 * L, D + 15.5, 0), wpt(fx0 * L + 11.2, D + 10.1, 0)], 0.02, C.rope); await ctx.yield(); }
        h.booms = [-0.12, 0.1, 0.3].map((f) => [f * L - 0.2, D + 3.9, f * L + 11.2, D + 10.1]);
        await ctx.yield();
        for (let k = 0; k < 5; k++) cabin((-0.2 + k * 0.11) * L + 4, D + 1.3, (k % 2 ? 1 : -1) * B * 0.3, tin());
        mastTop = wpt(0.1 * L, D + 16, 0);
      } else if (kind === 'ferry') {
        await hs(-0.03 * L, D + 1.6, 0, 0.64 * L, 3.2, B * 0.86, C.white, false, [[-0.3 * L, 0.2 * L]], 0.455); await ctx.yield(); await hs(-0.05 * L, D + 4.6, 0, 0.5 * L, 2.8, B * 0.7, tin(), false, [[0.09 * L - 0.5, 0.19 * L + 0.14 * B + 1], [-0.2 * L - 2.2, -0.2 * L + 2.2]], 0.34); await ctx.yield(); await hs(0.14 * L, D + 7.3, 0, 0.1 * L, 2.6, B * 0.5, C.white, true); await ctx.yield();
        boatDeck = [-0.05 * L, D + 6.0, 0.5 * L, B * 0.7];
        fun = fn(-0.2 * L, D + 9.0, 0, 3.0, 6, 3.0, C.orange, C.white); mastTop = mast(0.3 * L, D, 10, 0.3);
      } else if (kind === 'trawler') {
        await hs(-0.16 * L, D + 1.4, 0, 0.22 * L, 2.8, B * 0.62, tin(), false, [[-0.2 * L, -0.08 * L + 0.2 * B]], 0.44); await ctx.yield(); await hs(-0.14 * L, D + 3.9, 0, 0.12 * L, 2.2, B * 0.5, C.white, true, [[-0.17 * L - 0.8, -0.17 * L + 0.8]]); await ctx.yield();
        mastTop = mast(0.14 * L, D, 9, 0.3); lb(0.14 * L + 3.2, D + 4.6, 0, 8, 0.25, 0.25, C.pale, 0, 0.55); h.booms = [[0.14 * L - 0.3, D + 2.6, 0.14 * L + 6.6, D + 6.7]];
        const st = fn(-0.17 * L, D + 6.1, 0, 0.9, 2.4, 0.9, C.tar, C.yellow); if (hq() < 0.5) fun = st;
        if (near) { lb(-0.38 * L, D + 2.4, 0, 0.3, 4.6, 0.3, C.pale); lb(-0.38 * L, D + 4.6, 0, 0.3, 0.3, B * 0.7, C.pale); }   // the gallows aft
      } else {
        await hs(0.04 * L, D + 1.3, 0, 0.26 * L, 2.6, B * 0.6, tin(), true, [[0.06 * L - 0.6, 0.06 * L + 0.6]]); await ctx.yield(); const st = fn(-0.14 * L, D + 2.8, 0, 1.6, 3.8, 1.6, C.tar, C.pink); if (hq() < 0.35) fun = st;
        mastTop = mast(0.06 * L, D + 2.6, 3.6, 0.2);
        if (near) for (let i = 0; i < 5; i++) for (const sg of [1, -1]) { const e = deckEdge(o, -0.3 + i * 0.16); lg(TANK, e[0], e[1] - 0.5, sg * (e[2] + 0.1), 1, 0.5, 1, CAP, Math.PI / 2); }   // tyre fenders
      }
      await ctx.yield();
      if (h.rich) { if (kind === 'freighter') dress(0.36, 0.45); else if (kind === 'ferry') { dress(0.31, 0.44); dress(-0.47, -0.37); } else if (kind === 'trawler') dress(0.2, 0.42); else { dress(-0.42, -0.2); dress(0.27, 0.4); } await ctx.yield(); }
      const ns = L > 80 ? 8 : L > 40 ? 5 : 3, sl = Math.hypot(2.8, 0.45 * D);
      for (let i = 0; i < ns; i++) for (const sg of [1, -1]) lb(lerp(-0.36, 0.26, i / (ns - 1)) * L, 0.2 * D + sink, sg * (B / 2 + 0.9), 0.4, sl, 0.4, C.timber, sg * Math.atan2(2.8, 0.45 * D));
      if (h.close) {                                                            // every hull the cable passes stands on the brief's shores: more baulks between the first, each on a wedge pad, bilge blocks, the forefoot on keel blocks with a pair of raking shores under the flare of the bow
        const ne = L > 80 ? 5 : 4, sl2 = Math.hypot(3.4, 0.58 * D), th = 0.42;
        for (let i = 0; i < ne; i++) for (const sg of [1, -1]) { const x = lerp(-0.36, 0.26, (i + 0.5) / ne) * L; lb(x, 0.29 * D + sink * 0.8, sg * (B / 2 + 1.0), th, sl2, th, SHORE, sg * Math.atan2(3.4, 0.58 * D)); lb(x, sink + 0.14, sg * (B / 2 + 2.75), 0.95, 0.3, 0.7, SHORE2); }
        for (const sx of [-0.3, -0.08, 0.14, 0.34]) for (const sg of [1, -1]) lb(sx * L, sink + 0.45, sg * B * 0.3, 1.4, 0.9, 1.0, SHORE2);
        const kb = Math.min(2.2, 1 + D * 0.045); for (const sx of [0.4, 0.445, 0.485]) lb(sx * L, sink + kb * 0.3, 0, kb, kb * 0.6, kb * 1.3, SHORE2);
        for (const sx of [0.38, 0.45]) { const e = deckEdge(o, sx), bt = Math.min(1, Math.max(0, (sx - 0.2) / 0.3)), x = sx * L + 0.5 * D * bt * bt * 0.3, zt = e[2] * 0.6 + 0.15, zf = zt + 0.26 * D + 1.6, tk = Math.min(0.7, 0.36 + D * 0.012);
          for (const sg of [1, -1]) { beam(wpt(x, sink + 0.15, sg * zf), wpt(x, 0.55 * e[1], sg * zt), tk, tk, SHORE); lb(x, sink + 0.16, sg * (zf + 0.2), 1.3, 0.34, 1.0, SHORE2); } }
        await ctx.yield(); }
      if (fun) { h.fun = fun; if (!h.priv) smokeAt.push(fun); }
      // rudder and bare bronze propeller under the stern, an anchor at the bow
      const pr = Math.min(2.4, Math.max(0.8, 0.13 * D)), py = Math.max(pr + 0.9, 0.2 * D);
      lb(-0.5 * L - 1.1, py + 0.1, 0, 1.5, pr * 2.5, 0.16, C.rust); lb(-0.5 * L - 0.2, py, 0, 0.7, 0.3, 0.3, C.steel);
      if (near) { lg(PROPG, -0.5 * L - 0.3, py, 0, pr, pr, pr, C.cream, 0, Math.PI / 2, 0.4);
        const eb = deckEdge(o, 0.44); for (const sg of [1, -1]) lb(eb[0] + 0.6, eb[1] * (D > 20 ? 0.9 : 0.72), sg * (eb[2] + 0.22), 0.3, Math.min(1.5, D * 0.09 + 0.5), Math.min(1.0, D * 0.05 + 0.4), CAP);
        // the bulwark rail round the deck edge, a marigold garland looped on the bow
        for (const sg of [1, -1]) { const pts = []; for (let i = 0; i <= 12; i++) { const e = deckEdge(o, -0.5 + i / 12); pts.push([e[0], e[1] + 1.05, sg * e[2]]); } const w = []; for (let i = 0; i <= 12; i++) w.push(wpt(pts[i][0], pts[i][1], pts[i][2])); rib.add(w, 0.03, C.pale);
          for (let i = 0; i <= 12; i++) rib.add([wpt(pts[i][0], pts[i][1] - 1.05, pts[i][2]), w[i]], 0.022, C.pale);
          const gl = []; for (let i = 0; i <= 16; i++) { const e = deckEdge(o, 0.34 + i * 0.01); gl.push(wpt(e[0] + 0.05, e[1] + 0.2 - 0.55 * Math.abs(Math.sin(i * Math.PI / 4)), sg * (e[2] + 0.12))); } rib.add(gl, 0.07, C.marigold); }
        await ctx.yield();
        // lifeboats left in their davits as balconies
        if (boatDeck) { const [bx, by, bl, bw] = boatDeck, nb = L > 100 ? 2 : 3;
          for (let i = 0; i < nb; i++) for (const sg of [1, -1]) { const x = bx + ((i + 0.5) / nb - 0.5) * bl * 0.8, z = sg * (bw / 2 + 1.5);
            lg(BOATG, x, by + 0.7, z, 1, 1, 1, i === 1 ? C.cream : C.orange); for (const dx of [-2.3, 2.3]) { lb(x + dx, by + 1.6, sg * (bw / 2 + 0.55), 0.14, 3.2, 0.14, C.steel, sg * 0.45); rib.add([wpt(x + dx, by + 2.9, z), wpt(x + dx * 0.9, by + 1.8, z)], 0.014, C.rope); } if (sg < 0) await ctx.yield(); }
          await ctx.yield(); }
        // aft: a tin-roofed pergola and a water tank on legs
        if (L > 34) { const ax = -0.45 * L + 2, ay = deckEdge(o, -0.44)[1], aw = B * 0.26, c = tin();
          for (const dx of [-2, 2]) for (const dz of [-aw, aw]) lb(ax + dx, ay + 1.25, dz, 0.12, 2.5, 0.12, C.timber);
          wind.sheet(wpt(ax - 2.4, ay + 2.6, -aw - 0.4), [4.8 * Math.cos(h.yaw), 0, -4.8 * Math.sin(h.yaw)], [(2 * aw + 0.8) * Math.sin(h.yaw), -0.25, (2 * aw + 0.8) * Math.cos(h.yaw)], 3, 2, c, 0.05, h.x, C.pale);
          lg(TANK, ax + 5, ay + 2.5, aw * 0.5, 1.9, 1.7, 1.9, kind === 'ferry' ? C.steel : C.teal); for (const dx of [-0.7, 0.7]) for (const dz of [-0.7, 0.7]) lb(ax + 5 + dx, ay + 0.85, aw * 0.5 + dz, 0.12, 1.7, 0.12, C.steel); }
        else wind.sheet(wpt(-0.42 * L, D + 2.3, -B * 0.25), [3.6 * Math.cos(h.yaw), 0, -3.6 * Math.sin(h.yaw)], [B * 0.5 * Math.sin(h.yaw), -0.3, B * 0.5 * Math.cos(h.yaw)], 2, 2, tin(), 0.08, h.x, C.cream);
      }
      await ctx.yield();
      // the long blue shadow: the footprint swept down-sun; and the tide-scour pool at the hull's foot
      const cy = Math.cos(h.yaw), sy = Math.sin(h.yaw), sh = SHK * (D + (kind === 'freighter' ? 7 : kind === 'ferry' ? 5 : kind === 'trawler' ? 3.5 : 2.5)), pts = [];
      for (const [a, b] of [[-0.5, -0.4], [-0.5, 0.4], [0.5, -0.12], [0.5, 0.12], [0.3, 0.45], [0.3, -0.45]]) { const x = h.x + cy * a * L + sy * b * B, z = h.z - sy * a * L + cy * b * B; pts.push([x, z], [x + SX * sh, z + SZ * sh]); }
      const hp = convex(pts);
      shPoly.push([hp, h.x, h.z, h.x + SX * (sh + L * 0.3), h.z + SZ * (sh + L * 0.3), 0.62]); if (near) scourP.push([h.x, h.z, h.yaw, L * 0.6 + 4, B * 0.5 + 9]);
      if (near) for (let i = 0; i < 14; i++) { const a0 = i / 14 * 6.2832, a1 = (i + 1) / 14 * 6.2832, ra = L * 0.42 + 1, rb = B * 0.375 + 4;   // (inside the pool the mud itself draws round the hull's foot: nothing of it lies on bare sand)
        for (const [ca, sa] of [[0, 0], [Math.cos(a0), Math.sin(a0)], [Math.cos(a1), Math.sin(a1)]]) { poolP.push(h.x + cy * ca * ra + sy * sa * rb, 0.035, h.z - sy * ca * ra + cy * sa * rb); poolU.push(ca, sa); } }
      h.top = D + (kind === 'freighter' ? 16 : kind === 'ferry' ? 10 : kind === 'trawler' ? 9 : 6); h.mastTop = mastTop; h.wpt = (x, y, z) => { mH.makeRotationY(h.yaw).multiply(mR.makeRotationX(h.heel)).setPosition(h.x, -sink, h.z); return wpt(x, y, z); };
      hulls.push(h);
    };
    const uM3 = path.nearestXZ(86, 250).u;                    // the third cable mast, by its own place
    const samples = (h) => { const o = [], dx = Math.cos(h.yaw), dz = -Math.sin(h.yaw); for (let k = -4; k <= 4; k++) o.push([h.x + dx * h.L * k / 8, h.z + dz * h.L * k / 8]); return o; };
    const fits = (h) => {
      h.s = samples(h);
      for (let a = 0; a < h.s.length; a++) { const sx = h.s[a][0], sz = h.s[a][1];
        if (sz < 100) return false;
        if (rare && sz > 152 && sz < 198 && sx > -175 && sx < 125) return false;          // the arrival's ways are kept clear
        const n = path.nearestXZ(sx, sz); if ((n.dist < h.B / 2 + 14 && h.topGuess > n.y - 13) || (n.u > uM3 && n.dist < h.B / 2 + 24) || Math.hypot(sx - 86, sz - 250) < h.B / 2 + 30) return false;   // (beyond the third mast, where the cable dives for the square, the ranks keep 24 m off its ground line, as the fleet does; and nothing of them stands within 30 m of the mast itself, the reach of its stays. This rule is by the mast's place where it was a typed share of the flight: on a seed where a rank hull near the mast fits differently the ranks after it are dealt anew, once; nothing is burnt or kept to hold the old deal)
        for (let b = 0; b < hulls.length; b++) { const q = hulls[b], qs = q.s, lim = (h.B + q.B) / 2 + 7, lo = lim * lim * (1 - 1e-9), hi = lim * lim * (1 + 1e-9);
          for (let j = 0; j < qs.length; j++) { const dx = sx - qs[j][0], dz = sz - qs[j][1], d2 = dx * dx + dz * dz;       // the squares settle all but a hair's breadth; there Math.hypot decides, as before
            if (d2 < hi && (d2 < lo || Math.hypot(dx, dz) < lim)) return false; } }
      }
      return true;
    };
    const mk = (kind, L, x, z, yaw, heel, row, tintK = 1) => {
      const B = kind === 'freighter' ? L * 0.15 : kind === 'ferry' ? L * 0.18 : kind === 'trawler' ? L * 0.23 : L * 0.28;
      const D = kind === 'freighter' ? 9 + L * 0.035 : kind === 'ferry' ? 6 + L * 0.035 : kind === 'trawler' ? 3.6 + L * 0.05 : 4.4;
      return { kind, L, B, D, x, z, yaw, heel, row, tint: new THREE.Color(tintK, tintK, tintK), topGuess: D + (kind === 'freighter' ? 16 : kind === 'ferry' ? 10 : kind === 'trawler' ? 9 : 6) };
    };
    // the three named hulls: K1 the black bulk carrier whose bow looms at the start, K2 and K3 making the street
    const K1 = mk('freighter', 180, 0, 0, -2.74, 0, 3, 1.12); K1.D = 27.5; K1.B = 28; K1.x = 64 + 0.92 * 111; K1.z = 642 - 0.39 * 111; K1.s = samples(K1); K1.named = true; K1.farHouse = true; await addHull(K1); await ctx.yield();
    const sP = frame(0.305), tK = [tan.x, tan.z], lK = Math.hypot(tK[0], tK[1]), dK = [tK[0] / lK, tK[1] / lK], yawK = Math.atan2(-dK[1], dK[0]);
    const K2 = mk('ferry', 104, sP[0] + dK[1] * 22 + dK[0] * 35, sP[2] - dK[0] * 22 + dK[1] * 35, yawK, 0, 2, 1.05); K2.s = samples(K2); K2.named = true; K2.sills = true; await addHull(K2); await ctx.yield();
    const K3 = mk('freighter', 120, sP[0] - dK[1] * 19 + dK[0] * 44, sP[2] + dK[0] * 19 + dK[1] * 44, yawK, 0, 1, 1); K3.s = samples(K3); K3.named = true; K3.sills = true; await addHull(K3);
    await ctx.yield();
    // placed hulls: two painted ferries close on the sunlit (left) side of the opening third, bows toward the entry so their eyes meet us;
    // four small hulls along the dive and the low run, so the last third has near subjects on both sides. Their paint and tin come from
    // the private stream (h.priv), so the ranks' own draws are not shifted by them.
    const PL = path.length, placed = async (kind, L, d, side, turn, row, tintK, named) => { const q = frame(d / PL, side), yw = Math.atan2(-tan.z, tan.x) + turn;
      const h = mk(kind, L, q[0], q[2], yw, named ? 0 : (dq() - 0.5) * 0.3, row, tintK); h.s = samples(h); h.priv = true; if (named) { h.named = true; h.sills = true; }
      await addHull(h); await ctx.yield(); return h; };
    const KA = await placed('ferry', 56, 100, -25, Math.PI, 1, 1.05, true), KB = await placed('ferry', 58, 178, -23, Math.PI + 0.05, 0, 1.15, true);
    await placed('trawler', 44, 170, 25, 0.22, 3, 1.15, true);                                      // a trawler on the right of the fog leg, her nets and masts against the glow
    // the reveal: painted hulls close under and beside the cable, so the view from the crest has decks and colour in its lower half
    const R1 = await placed('ferry', 66, 0.487 * PL, -31, 0.5, 3, 1.1, false), R2 = await placed('trawler', 42, 0.522 * PL, 25, Math.PI - 0.6, 1, 1.1, false);
    const RT = await placed('tug', 26, 0.548 * PL, -7, 1.2, 2, 1.1, false), R3 = await placed('ferry', 58, 0.578 * PL, -41, Math.PI + 0.3, 2, 1.05, false), R5 = await placed('ferry', 62, 0.668 * PL, 33, 0.3, 1, 1.1, false);
    // the dive and the low run: a tug and a trawler under the dive, then a painted ferry close on the sunlit side of the low run (her bow toward us), a trawler before the square
    const smokeNear = [KA, KB, R1, R3, R5].map((h) => h.fun).filter(Boolean);
    const DV = [await placed('tug', 27, 0.69 * PL, -31, 0.5, 3, 1.05, false), await placed('trawler', 38, 0.752 * PL, 28, Math.PI - 0.4, 2, 1.05, false),
      await placed('ferry', 60, 0.822 * PL, -17.5, 0.05, 3, 1.1, true), await placed('trawler', 34, 0.85 * PL, 34, Math.PI + 0.3, 3, 1.05, false)];
    let nTry = 0;
    for (let zr = 126; zr < 790; zr += 36 + hr() * 10) {
      for (let x = -330 + hr() * 60; x < 320;) {
        const k = hr(), kind = k < 0.3 ? 'tug' : k < 0.64 ? 'trawler' : k < 0.84 ? 'ferry' : 'freighter';
        const L = kind === 'tug' ? 20 + hr() * 10 : kind === 'trawler' ? 25 + hr() * 20 : kind === 'ferry' ? 50 + hr() * 40 : 110 + hr() * 60;
        const h = mk(kind, L, x + L / 2, zr + (hr() - 0.5) * 22, (hr() < 0.5 ? 0 : Math.PI) + (hr() - 0.5) * 0.9, (hr() - 0.5) * (L < 50 ? 0.4 : 0.16),
          kind === 'freighter' ? (hr() < 0.6 ? 0 : 1) : (hr() * 4) | 0, 0.8 + hr() * 0.35);
        const keep = hr() < 0.9 * Math.min(1.1, density);
        if (keep && fits(h)) await addHull(h);
        nTry++; await ctx.yield();
        x += L + 10 + hr() * 8;
      }
      await ctx.yield();
    }
    // ---- the denser fleet of the lower flat: more painted hulls under and beside the cable from the second mast to the dive, bows toward
    // us, in two lines that make a street of the cable's run. They are placed after the ranks and from a stream of their own, each where it
    // stands clear of what is already there, so no other hull, and nothing of the opening, moves. ----
    let crestHull = null; const nOld = hulls.length, fleet = [], tris = () => painted.triangles * 2 + paintedFar.triangles * 2 + plain.triangles + core.triangles * 2 + glow.triangles + wind.triangles, tri0 = tris();
    { const clearOf = (h) => { h.s = samples(h);
        for (const [sx, sz] of h.s) { if (sz < 104 || (rare && sz > 146 && sz < 204 && sx > -180 && sx < 130)) return false;
          const n = path.nearestXZ(sx, sz); if ((n.dist < h.B / 2 + 11 && h.topGuess > n.y - 9.5) || (n.u > uM3 && n.dist < h.B / 2 + 24)) return false;   // (beyond the third mast the fleet keeps 24 m off the cable's ground line)
          for (const q of hulls) { const lim = (h.B + q.B) / 2 + 6.5; if (Math.abs(sx - q.x) > q.L / 2 + lim || Math.abs(sz - q.z) > q.L / 2 + lim) continue; for (const [qx, qz] of q.s) if (Math.hypot(sx - qx, sz - qz) < lim) return false; } }
        return true; };
      // each is given a stretch of the cable's run and a band of ground beside it (and one or two ways to lie), and takes the clear berth nearest the one asked for
      const extra = async (kind, L, u0, u1, s0, s1, turns, row, tintK) => { let best = null, bc = 1e9; const dir = Math.sign(s1 - s0) || 1; if (tris() > Math.min(tri0 + 17000, 230000)) return null;   // (the fleet keeps to a budget of triangles, smaller where the town is already thick)
        for (let ti = 0; ti < turns.length; ti++) for (let u = u0; u <= u1 + 1e-6; u += 0.012) { for (let sd = s0; (s1 - sd) * dir >= -1e-6; sd += 5 * dir) { const cost = ti * 30 + Math.abs(u - u0) * 400 + Math.abs(sd - s0); if (cost >= bc) continue;
            const q = frame(u, sd), h = mk(kind, L, q[0], q[2], Math.atan2(-tan.z, tan.x) + turns[ti], 0, row, tintK); if (clearOf(h)) { best = h; bc = cost; } } await ctx.yield(); }
        if (!best) return null; const h = best; h.heel = (nq() - 0.5) * 0.14; h.s = samples(h);
        h.priv = true; h.rs = nq; h.sills = true; dqS = nq; await addHull(h); dqS = dq0; fleet.push(h); await ctx.yield(); return h; };
      const PI = Math.PI;
      await extra('freighter', 124, 0.5, 0.62, 48, 88, [PI - 0.1, PI / 2 + 0.15], 1, 1.08) || await extra('freighter', 100, 0.47, 0.63, 44, 92, [PI - 0.1, PI / 2 + 0.15], 1, 1.08);   // on the right a red-lead freighter, her eye toward us or toward the street
      await extra('ferry', 66, 0.455, 0.6, 26, 56, [PI + 0.2], 3, 1.12);                  // close under our right hand once the fog has torn
      await extra('ferry', 74, 0.55, 0.64, 36, 76, [PI + 0.12, PI / 2 - 0.1], 2, 1.1);
      await extra('trawler', 42, 0.44, 0.52, -22, -47, [0.3], 0, 1.15);
      await extra('ferry', 70, 0.5, 0.62, -52, -92, [PI - 0.15, -PI / 2 + 0.1], 3, 1.08);
      await extra('trawler', 40, 0.6, 0.65, -20, -45, [0.2], 1, 1.12);
      await extra('tug', 27, 0.5, 0.56, -10, -25, [0.15], 3, 1.1);
      await extra('trawler', 42, 0.56, 0.63, 28, 48, [PI + 0.25], 0, 1.15);
      if (fleet.length < 6) await extra('ferry', 58, 0.45, 0.64, 30, 95, [PI + 0.1, PI / 2], 2, 1.1);
      // the flat below the third mast: one more large painted hull in the middle ground on the seaward side of the dive, her bow and her sunlit
      // side toward the mast. Her berth is a place of the flat (the clear ground nearest to x 8, z 211); she has a stream of her own (her
      // paint, tin, washing and banana all come from it) and is placed last, so no other hull moves.
      { const cq = ctx.core.makeRng(ctx.core.hashSeed('cresthull:' + ctx.seed)), n0 = path.nearestXZ(8, 211); path.tangentAt(n0.u, tan); const yw = Math.atan2(-tan.z, tan.x) + PI; let best = null;
        for (let r = 0; r <= 48 && !best; r += 6) { for (let k = 0; k < (r ? 8 : 1) && !best; k++) { const a = k * PI / 4 + 0.4, h = mk('ferry', 92, 8 + r * Math.cos(a), 211 + r * Math.sin(a), yw, 0, 2, 1.1); if (clearOf(h)) best = h; } await ctx.yield(); }
        if (best) { best.heel = (cq() - 0.5) * 0.1; best.s = samples(best); best.priv = true; best.rs = cq; best.sills = true; best.cq = cq; dqS = cq; await addHull(best); dqS = dq0; crestHull = best; await ctx.yield(); } } }

    // ---- the cableway: masts with bracket arms, the cable we ride, the return line, a crossing line ----
    const fto = (u, side, up, out) => { const uu = Math.min(1, Math.max(0, u)); path.pointAt(uu, out); path.tangentAt(uu, tan); const l = Math.hypot(tan.x, tan.z) || 1; out.x -= tan.z / l * side; out.y += up; out.z += tan.x / l * side; return out; };
    const mastG = new THREE.CylinderGeometry(0.22, 0.55, 1, 6), HZP = col('#c6ccd0');
    const bigLamp = new Set();                                                // the signal lamps on the cable masts: beacons in the fog
    const CK = shl / Math.max(SUN.y, 0.1);                                    // shadow length per metre of height
    const shLine = (x0, z0, x1, z1, w0, w1) => { const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1, px = -dz / l, pz = dx / l;
      shPoly.push([[[x0 + px * w0, z0 + pz * w0], [x0 - px * w0, z0 - pz * w0], [x1 - px * w1, z1 - pz * w1], [x1 + px * w1, z1 + pz * w1]], x0, z0, x1, z1, 0.4]); };
    const mast = (u, side, armTo, extra = 2.6, slim = false) => { const b = frame(u, side, 0), a = frame(u, armTo, 3.25), H = b[1] + 3 + extra, k = slim ? 0.64 : 1;
      shLine(b[0], b[2], b[0] + SX * CK * H, b[2] + SZ * CK * H, 0.55 * k, 0.24 * k);                                            // the mast's long shadow across the flat
      plain.add(mastG, trs(b[0], H / 2, b[2], 0, 0, 0, slim ? 0.42 : k, H, slim ? 0.42 : k), slim ? HZP : C.pale); rib.add([[b[0], a[1], b[2]], a], slim ? 0.05 : 0.09, slim ? HZP : C.pale); if (!slim) rib.add([[b[0], H, b[2]], a], 0.025, C.rope);
      if (!slim) for (let y = 6; y < H - 2; y += 6) plain.box(b[0], y, b[2], 1.5, 0.12, 0.12, C.pale, 0, y * 0.7, 0);     // climbing rungs
      for (const [gx, gz] of slim ? [[side > 0 ? 7 : -7, 8]] : [[9, 4], [-7, 8], [-3, -10]]) rib.add([[b[0], H * 0.82, b[2]], [b[0] + gx, 0.2, b[2] + gz]], slim ? 0.012 : 0.02, slim ? HZP : C.rope);
      lampP.push([b[0], H + 0.3, b[2]]); return [b[0], H, b[2]]; };
    const uM = [path.nearestXZ(91, 597).u, path.nearestXZ(135, 433).u, uM3];
    // the mast pair before the liner (M3) is kept slight, so it does not stand in front of her at the reveal; the others fly a long pennant
    const cmT = [];
    for (let i = 0; i < 3; i++) { const t = mast(uM[i], 9, 3.2, i === 2 ? 0.8 : 2.6, i === 2), tL = mast(uM[i], i === 2 ? -34 : -12.5, -9, i === 2 ? 0.8 : 2.6, i === 2); cmT.push([t, tL]);
      if (i < 2) { wind.sheet([t[0] - 0.15, t[1] - 0.2, t[2] - 0.42], [0.3, 0, 0.85], [-1.4, -3.8, 0.5], 1, 6, i ? C.teal : C.orange, 1.2, i * 2.3, C.cream); lampP.push([t[0], t[1] - 1.1, t[2]], [t[0], t[1] - 2.4, t[2]]);
        const arm = frame(uM[i], 3.2, 3.25); lampP.push([lerp(t[0], arm[0], 0.5), arm[1] - 0.3, lerp(t[2], arm[2], 0.5)], [arm[0], arm[1] - 0.45, arm[2]]); for (let k = 1; k <= 4; k++) bigLamp.add(lampP.length - k); } }
    const M0 = mast(0.09, -12.5, -9, 5);
    await ctx.yield();
    const main = [], ret = [];
    { const a = frame(0, 3.2, 3), b = frame(0, -9, 3); path.tangentAt(0, tan); main.push([a[0] - tan.x * 50, a[1], a[2] - tan.z * 50]); ret.push([b[0] - tan.x * 50, b[1], b[2] - tan.z * 50]); }
    for (let i = 0; i <= 150; i++) { if (i / 150 <= 0.9) main.push(frame(i / 150, 3.2, 3)); if (i / 150 <= uM[2]) ret.push(frame(i / 150, -9, 3)); }
    main.push([3.2, 19, 17.6]);                                               // made fast to a bracket above the crown of the arch
    await ctx.yield();
    const cGrey = col('#A9ADAE'); rib.add(main, 0.011, cGrey); rib.add(ret, 0.011, cGrey);
    // the crossing line: a second cableway strung square across ours above the place (103, 313), where the harbour has always had it
    // (a place in the world's own metres, the one the live version crosses at; it is not moved), hanging in a deep catenary between two
    // pylons that stand in the open mud either side, the nearest clear ground to 78 m out; its rope is tarred, dark against the sky
    const uX = path.nearestXZ(103, 313).u, XSAG = 12, XTOP = frame(uX, 0, 0)[1] + 12 + XSAG;
    const pyl = (sg) => { for (let d = 78; d < 150; d += 4) { const q = frame(uX, sg * d, 0); if (!hulls.some((h) => h.s.some(([qx, qz]) => Math.hypot(q[0] - qx, q[2] - qz) < h.B / 2 + 5 + h.L / 16))) return [q[0], XTOP, q[2]]; } const q = frame(uX, sg * 150, 0); return [q[0], XTOP, q[2]]; };
    const xa = pyl(-1), xb = pyl(1), cross = sagLine(xa, xb, XSAG, 28);
    rib.add(cross, 0.016, C.tar);
    for (const e of [xa, xb]) { plain.add(mastG, trs(e[0], (e[1] + 2.4) / 2, e[2], 0, 0, 0, 1.5, e[1] + 2.4, 1.5), C.pale); shLine(e[0], e[2], e[0] + SX * CK * e[1], e[2] + SZ * CK * e[1], 0.8, 0.35);
      for (let y = 6; y < e[1]; y += 6) plain.box(e[0], y, e[2], 1.7, 0.12, 0.12, C.pale, 0, y * 0.7, 0);
      const dx = (xb[0] - xa[0]), dz = (xb[2] - xa[2]), dl = Math.hypot(dx, dz) || 1; beam([e[0] - dz / dl * 2.2, e[1], e[2] + dx / dl * 2.2], [e[0] + dz / dl * 2.2, e[1], e[2] - dx / dl * 2.2], 0.3, 0.3, C.pale);
      for (const [gx, gz] of [[9, 5], [-8, 7], [-2, -11]]) rib.add([[e[0], e[1] * 0.85, e[2]], [e[0] + gx, 0.2, e[2] + gz]], 0.02, C.rope);
      wind.sheet([e[0] - 0.15, e[1] + 2.2, e[2] - 0.42], [0.3, 0, 0.85], [-1.4, -3.8, 0.5], 1, 6, e === xa ? C.teal : C.orange, 1.2, e[0], C.cream); lampP.push([e[0], e[1] + 2.7, e[2]], [e[0], e[1] - 0.5, e[2]]); bigLamp.add(lampP.length - 2); }
    mastG.dispose();
    await ctx.yield();

    // ---- cloth: saris on lines, bunting, nets drying like curtains, dressed ships; banana on the after decks ----
    const cr0 = rng.fork('cloth'); let crS = cr0; const cr = () => crS(), bright = [C.teal, C.orange, C.pink, C.yellow, col('#b03a4a')];
    const lamps = (pts, every = 2) => { for (let i = 1; i < pts.length - 1; i += every) lampP.push([pts[i][0], pts[i][1] - 0.25, pts[i][2]]); };
    const sariLine = (a, b, sag, every = 1.7, set = cloth) => {
      const pts = sagLine(a, b, sag, 12), len = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1, dx = (b[0] - a[0]) / len, dz = (b[2] - a[2]) / len;
      rib.add(pts, 0.02, C.rope);
      for (let d = 1; d < len - 1.5; d += every + cr() * 0.8) { const t = d / len, y = a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), w = 1.15, c = set[(cr() * set.length) | 0];
        if (cr() < 0.2) continue;
        wind.sheet([a[0] + dx * d, y, a[2] + dz * d], [dx * w, 0, dz * w], [0, -(3.6 + cr() * 1.6), 0], 2, 5, c, 0.85, cr() * 6, cr() < 0.4 ? set[(cr() * set.length) | 0] : null); }
    };
    const netLine = (a, b, drop, c) => { const len = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1, nb = len > 24 ? 4 : 3, ph = cr() * 6;     // hung in scalloped bays from a sagging head rope
      for (let k = 0; k < nb; k++) { const t0 = k / nb, t1 = (k + 1) / nb, top = sagLine([lerp(a[0], b[0], t0), lerp(a[1], b[1], t0), lerp(a[2], b[2], t0)], [lerp(a[0], b[0], t1), lerp(a[1], b[1], t1), lerp(a[2], b[2], t1)], 0.8, 7);
        rib.add(top, 0.03, C.rope); wind.curtain(top, drop * (0.84 + 0.08 * ((k * 5) % 3)), c, 0.9, ph + k * 1.7, len / nb / 0.35, drop / 0.35);
        for (let i = 1; i < 7; i += 2) plain.box(top[i][0], top[i][1] - 0.1, top[i][2], 0.3, 0.22, 0.3, C.orange);
        plain.box(top[0][0], top[0][1] - 0.1, top[0][2], 0.34, 0.26, 0.34, C.cream); } };
    const pole = (p) => { plain.box(p[0], p[1] / 2, p[2], 0.25, p[1], 0.25, C.timber); for (const [gx, gz] of [[5, 3], [-4, 5]]) rib.add([[p[0], p[1] * 0.9, p[2]], [p[0] + gx, 0.2, p[2] + gz]], 0.015, C.rope); };
    { // the opening picture: washing and bunting converging on a mast ghost, a bright line of saris just under the axis, lamp beads on the bunting
      const a = frame(0.035, -8, -3.5), b = frame(0.08, -13.5, -2.5); sariLine(a, b, 0.8, 1.5); pole(a);
      await ctx.yield();
      const c = frame(0.05, 8.5, -6), d = frame(0.085, 15, -9); sariLine(c, d, 0.7, 1.5); pole(c); pole(d);
      await ctx.yield();
      const e0 = frame(0.036, -5.5, -4.2), e1 = frame(0.058, 5.5, -5); sariLine(e0, e1, 0.6, 1.25, bright); pole(e0); pole(e1);
      for (const e of [frame(0.012, -5, 8), frame(0.03, 11, 6.5), frame(0, -22, -4), frame(0.15, -7, 6)]) { const l = sagLine(e, M0, 1.6, 14); rib.add(l, 0.02, C.rope); addBunting(wind, l, cloth, 0.95, 0.85, cr() * 9); lamps(l, 1); await ctx.yield(); }
    }
    { // the fog leg past K1's foredeck: a sari line close on the left, a net curtain close on the right, bunting from the black bow
      const a = frame(0.1, -6.3, -3.4), b = frame(0.15, -7, -3); sariLine(a, b, 0.8, 1.35, bright); pole(a); pole(b);
      await ctx.yield();
      const c = frame(0.115, 6.2, 0.6), d = frame(0.17, 7, 1.6); netLine(c, d, 5.5, C.net); pole([c[0], c[1] + 0.5, c[2]]); pole([d[0], d[1] + 0.5, d[2]]);
      const e = frame(0.165, -11, -5), f = frame(0.215, -7, -6); netLine(e, f, 5, C.net2); pole(e); pole(f);
      await ctx.yield();
      const s2a = frame(0.19, 6.5, -3), s2b = frame(0.235, 8.5, -2.6); sariLine(s2a, s2b, 0.7, 1.4); pole(s2a); pole(s2b);
      for (const sg of [1, -1]) { const l = sagLine(K1.wpt(0.545 * K1.L, K1.D * 1.1 + 1.4, 0), K1.wpt(0.25 * K1.L, K1.D * 1.02 + 1.4, sg * K1.B * 0.47), 0.6, 14); rib.add(l, 0.02, C.rope); addBunting(wind, l, cloth, 1, 1, sg + 2); lamps(l, 2); await ctx.yield(); } }
    await ctx.yield();
    for (let i = 0; i < 8; i++) { // the street between K2 and K3
      const u = 0.288 + i * 0.014, py = frame(u, 0, 0)[1], a = frame(u, -12.5, 0), b = frame(u + 0.006, 10.2, 0); a[1] = Math.min(py - 3.2, 14 + cr() * 6); b[1] = Math.min(py - 3.2, 15 + cr() * 7);
      if (i % 3 === 2) { const l = sagLine(a, b, 1.2, 12); rib.add(l, 0.02, C.rope); addBunting(wind, l, cloth, 0.9, 0.9, i); lamps(l, 2); } else if (i === 3) netLine(a, b, 4.5, C.net); else sariLine(a, b, 1, 1.45);
      await ctx.yield();
    }
    // the crossroads under the reveal: big flags from the tug's mast out to three neighbours and down both sides of the dive, snapping in the wind that tears the fog
    for (const [g, h, k] of [[RT, R1, 0], [RT, R2, 1], [RT, R3, 2], [R5, DV[1], 3], [R3, DV[0], 4]]) { if (!h.mastTop || !g.mastTop) continue; const l = sagLine(g.mastTop, h.mastTop, 2.2, 18); rib.add(l, 0.03, C.rope); addBunting(wind, l, cloth, 1.5, 1.7, k * 5 + 1, flagM); await ctx.yield(); }
    // per hull: dressing lines, washing, nets from the derrick booms, banana, a gangway to the nearest neighbour, a basket on a rope, a goat
    const baskets = [], goats = [], deckWalk = []; let dogWalk = null;
    let hi = 0;
    for (const h of hulls) {
      await ctx.yield();
      if (h === crestHull) crS = h.cq;                                    // (the last of the list: her cloth is dealt from her own stream)
      const { L, B, D } = h, r0 = cr(), r1 = cr();
      if (h.mastTop && (r0 < 0.7 || h.priv)) for (const e of [h.wpt(0.5 * L, D * 1.08, 0), h.wpt(-0.5 * L, D + 0.6, 0)]) { const l = sagLine(h.mastTop, e, 0.8, 8); rib.add(l, 0.02, C.rope); if (r0 < 0.45 || h === K2 || h === K3 || festival || h.priv) { addBunting(wind, l, cloth, 1.2, 0.9, r0 * 20); if (h.near && (night || r0 < 0.2)) lamps(l, 2); } }
      if (r1 < 0.6) sariLine(h.wpt(-0.3 * L, D + 3.6, B * 0.36), h.wpt(0.2 * L, D + 3.6, B * 0.33), 0.5, 1.8);
      await ctx.yield();
      if (L > 50) for (let k = 0; k < 3; k++) { const p = h.wpt((-0.28 + k * 0.05) * L, D, (k % 2 ? -1 : 1) * B * 0.28); plain.add(TANK, trs(p[0], p[1] + 0.45, p[2], 0, 0, 0, 0.7, 0.9, 0.7), k % 2 ? C.rust : C.teal); await ctx.yield(); addBanana(wind, p[0], p[1] + 0.8, p[2], 3 + cr() * 1.5, cr, C.leaf, C.leaf2); await ctx.yield(); }
      if (!h.near) continue;
      hi++;
      if (h.booms) for (let k = 0; k < h.booms.length; k++) if ((hi + k) % 2 === 0) { const bm = h.booms[k], a = h.wpt(bm[0], bm[1], 0.2), b = h.wpt(bm[2], bm[3], 0.2); if (path.distanceTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2) > 5) netLine(a, b, Math.min(5.5, bm[1] - D + 1.2), (hi + k) % 4 ? C.net : C.net2); }
      await ctx.yield();
      // the nearest neighbour, and a plank gangway with pipe rails across to it
      let best = null, bd = 1e9, bd2 = Infinity;                         // bd2: a little over bd squared, so only pairs that can win are measured with Math.hypot
      for (const q of hulls) { if (q === h) continue; const reach = (h.L + q.L) * 0.5 + Math.min(bd, 60); if (Math.abs(q.x - h.x) > reach || Math.abs(q.z - h.z) > reach) continue;   // (a hull further off than this cannot be the nearest that matters)
        for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) { const dx = h.s[i][0] - q.s[j][0], dz = h.s[i][1] - q.s[j][1]; if (dx * dx + dz * dz > bd2) continue;
          const d = Math.hypot(dx, dz); if (d < bd) { bd = d; bd2 = d * d * (1 + 1e-9); best = [q, i, j]; } } }
      await ctx.yield();
      if (best && L > 30 && best[0].L > 30) { const [q, i, j] = best, eh = deckEdge(h.o, (i - 4) / 8 * 0.9), eq = deckEdge(q.o, (j - 4) / 8 * 0.9);
        const hc = h.wpt(eh[0], eh[1], 0), qc = q.wpt(eq[0], eq[1], 0), sh = ((qc[0] - hc[0]) * Math.sin(h.yaw) + (qc[2] - hc[2]) * Math.cos(h.yaw)) > 0 ? 1 : -1, sq = ((hc[0] - qc[0]) * Math.sin(q.yaw) + (hc[2] - qc[2]) * Math.cos(q.yaw)) > 0 ? 1 : -1;
        const a = h.wpt(eh[0], eh[1] + 0.12, sh * eh[2] * 0.96), b = q.wpt(eq[0], eq[1] + 0.12, sq * eq[2] * 0.96), d = Math.hypot(b[0] - a[0], b[2] - a[2]);
        if (d > 4 && d < 30 && Math.abs(b[1] - a[1]) < d * 0.45 && path.distanceTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2) > 8 && !q.gwDone) {
          h.gwDone = true; beam(a, b, 1.1, 0.12, C.timber); const px = -(b[2] - a[2]) / d * 0.55, pz = (b[0] - a[0]) / d * 0.55;
          for (const s of [1, -1]) { rib.add([[a[0] + px * s, a[1] + 1, a[2] + pz * s], [b[0] + px * s, b[1] + 1, b[2] + pz * s]], 0.028, C.pale); for (let t = 0; t <= 1.001; t += 0.25) { const x = lerp(a[0], b[0], t) + px * s, y = lerp(a[1], b[1], t), z = lerp(a[2], b[2], t) + pz * s; rib.add([[x, y, z], [x, y + 1, z]], 0.02, C.pale); } }
          if (d > 14) { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.1, (a[2] + b[2]) / 2]; plain.box(m[0], m[1] / 2, m[2], 0.25, m[1], 0.25, C.timber); }
          if (!dogWalk && h.close) dogWalk = [a, b]; deckWalk.push([a, b]); } }
          await ctx.yield();
      // a basket hauled up the side on a rope from a little boom
      if (baskets.length < 40 && L > 24) { const e = deckEdge(h.o, -0.1 + 0.3 * cr()), sg = cr() < 0.5 ? 1 : -1, top = h.wpt(e[0], e[1] + 2.2, sg * (e[2] + 1.3)), inb = h.wpt(e[0], e[1] + 0.2, sg * (e[2] - 0.4));
        if (path.distanceTo(top[0], top[1], top[2]) > 7) { beam(inb, top, 0.14, 0.14, C.timber); rib.add([top, [top[0], 0.4, top[2]]], 0.012, C.rope); baskets.push([[top[0], 0.5, top[2]], [top[0], top[1] - 1.2, top[2]]]); } }
      if (goats.length < 16 && L > 30 && hi % 2) goats.push([h.wpt(-0.08 * L, D + 0.12, B * 0.2), h.wpt(0.16 * L, D + 0.12 + 0.02 * D, B * 0.16)]);
      if (L > 40) deckWalk.push([h.wpt(-0.3 * L, D + 0.15, -B * 0.3), h.wpt(0.2 * L, D + 0.15, -B * 0.26)]);
    }
    crS = cr0;
    await ctx.yield();
    const inHullN = (x, z, pad, n) => { for (let i = 0; i < n; i++) { const q = hulls[i]; if (Math.abs(x - q.x) > q.L * 0.5 + 16 || Math.abs(z - q.z) > q.L * 0.5 + 16) continue; for (const [qx, qz] of q.s) if (Math.hypot(x - qx, z - qz) < q.B / 2 + pad + q.L / 16) return true; } return false; };
    const inHull = (x, z, pad = 2) => inHullN(x, z, pad, hulls.length), inHull0 = (x, z, pad = 2) => inHullN(x, z, pad, nOld);   // inHull0: the town as it stood before the fleet was added, for the draws that must fall as they always did
    // ---- duckboard paths over the mud: one wandering along the street under the cable, spurs from the square to the nearest hulls ----
    const boardWalk = [], walkAt = [], trodAt = [];                                         // walkAt: the walk's line over the ground, point by point
    { let k = 0; const DUCK = PLK.map((c) => c.clone().multiplyScalar(0.85)), DUCK2 = PLK.map((c) => c.clone().multiplyScalar(1.12)), lay = (a, b, keep) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(d / 5));
        for (let i = 0; i < n; i++) { const p = [lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)], q = [lerp(a[0], b[0], (i + 1) / n), lerp(a[1], b[1], (i + 1) / n)];
          if (inHull((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, 1.5) || inHull(p[0], p[1], 1) || inHull(q[0], q[1], 1)) continue;
          const lo = p[1] < 478; beam([p[0], 0.11, p[1]], [q[0], 0.11, q[1]], lo ? 1.05 : 0.8, 0.09, (lo ? DUCK2 : DUCK)[k++ & 3]); if (keep && k % 3 === 0) boardWalk.push([[p[0], 0.2, p[1]], [q[0], 0.2, q[1]]]); } };
      let prev = null; for (let u = 0.03; u <= 0.83; u += 0.012) { path.pointAt(u, pp); const p = frame(u, -6 + 4 * Math.sin(u * 37) - 11 * sstep(0, 60, 250 - pp.z), 0), c = [p[0], p[2]]; if (prev) lay(prev, c, true); prev = c; walkAt.push(c); await ctx.yield(); }   // (below the third mast, at z 250, the cable dives for the square: over the next 60 m of ground the walk swings 11 m further off the cable's line and keeps there, so the dive and the low run never fly along it)
      const near3 = hulls.slice().sort((a, b) => Math.hypot(a.x, a.z - 70) - Math.hypot(b.x, b.z - 70)).slice(0, 3);
      for (const q of near3) { path.pointAt(path.nearestXZ(q.x, q.z).u, pp); const x0 = (q.x < pp.x ? -1 : 1) * Math.min(31, Math.max(23, Math.abs(q.x) * 0.4)); let tx = q.x, tz = q.z, bd = 1e9;   // each spur leaves the square from its own side of the approach and makes for the hull's nearer end
        for (const [sx, sz] of q.s) { const dd = Math.hypot(sx - x0, sz - 67.8); if (dd < bd) { bd = dd; tx = sx; tz = sz; } }
        const d = Math.hypot(tx - x0, tz - 67.8) || 1, n = Math.max(2, Math.round(d / 9)); let pv = [x0, 67.8];
        for (let i = 1; i <= n; i++) { const t = i / n, w = Math.sin(t * 5 + q.x) * 4 * Math.sin(Math.PI * t), nx = -(tz - 67.8) / d, nz = (tx - x0) / d, c = [lerp(x0, tx, t) + nx * w, lerp(67.8, tz, t) + nz * w]; lay(pv, c, false); pv = c; }
        await ctx.yield(); } }
    // ---- the street under the cable on the lower flat: bunting and washing from mast to mast passing close under the eye, a mooring
    // chain from every bow to its anchor in the mud, and a market of stalls under striped awnings with its own people (specks, never
    // close: the cable rides 20 m and more above them). All from a stream of their own. ----
    const avCrowd = [], avLamps = [], stallAt = [];
    { const aq = lcg(seedN * 9973 + 71), goods = [C.marigold, C.yellow, col('#b8402a'), C.leaf2, col('#7a4a9a'), C.cream], CHAIN = col('#5e3f2c'), mS2 = new THREE.Matrix4();
      const tn = () => { const c = cloth[(aq() * cloth.length) | 0]; return new THREE.Color(c.r * 0.66 + 0.05, c.g * 0.66 + 0.045, c.b * 0.66 + 0.04); };
      const lineOK = (a, b, drop, m) => { for (let t = 0; t <= 1.001; t += 0.1) if (path.distanceTo(lerp(a[0], b[0], t), lerp(a[1], b[1], t) - drop, lerp(a[2], b[2], t)) < m) return false; return true; };
      const bunt = (a, b, sag = 2, size = 1.5) => { if (!a || !b || !lineOK(a, b, sag * 0.6, 5)) return; const l = sagLine(a, b, sag, 18); rib.add(l, 0.03, C.rope); addBunting(wind, l, cloth, size * 0.86, size, (Math.abs(Math.sin(a[0] * 12.9898 + b[2] * 78.233) * 43758.5453) % 1) * 9, flagM); };      // (each line's phase from its own ends, no draw: how many lines are hung shifts nothing else. With this the avenue's stream is dealt anew once: cloth tones, chains, stalls, goods and walkers; nothing burnt or kept)
      // the mastheads of the lower flat near the cable, each with its place along the run and its side of it
      const ms = []; for (let i = 0; i < hulls.length; i++) { const h = hulls[i]; if (!h.mastTop || h === crestHull || h.z > 466 || h.z < 150) continue; const n = path.nearestXZ(h.x, h.z); if (n.dist > 105) continue; path.pointAt(n.u, pp); path.tangentAt(n.u, tan);
        ms.push({ h, m: h.mastTop, u: n.u, sg: ((h.x - pp.x) * -tan.z + (h.z - pp.z) * tan.x) > 0 ? 1 : -1, nw: i >= nOld, used: 0 }); }
      ms.sort((a, b) => a.u - b.u);
      const d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      bunt(cmT[1][0], (ms.find((q) => q.sg > 0 && q.nw) || {}).m, 2.2); bunt(cmT[1][1], (ms.find((q) => q.sg < 0) || {}).m, 2.2); await ctx.yield();
      { let nb = 0; for (let i = 0; i < ms.length && nb < 9; i++) { const a = ms[i]; let bj = -1, bd = 96;                       // bunting hull to hull down each side of the street, wherever a new hull stands
          for (let j = i + 1; j < ms.length; j++) { const b = ms[j]; if (b.sg !== a.sg || !(a.nw || b.nw)) continue; const d = d3(a.m, b.m); if (d > 22 && d < bd) { bd = d; bj = j; } }
          if (bj >= 0) { bunt(a.m, ms[bj].m, 1.4 + bd * 0.015); nb++; } }
        await ctx.yield(); }
      { const far = ms.filter((q) => q.sg > 0 && q.u > uM[2] - 0.11 && q.u < uM[2] + 0.01); for (let i = 0; i < Math.min(2, far.length); i++) bunt(cmT[2][0], far[i].m, 3, 1.8); await ctx.yield(); }   // from the head of the third mast down to the hulls on its right
      { let nw = 0; for (let i = 0; i < ms.length && nw < 4; i++) { const a = ms[i]; if (a.used) continue;                           // washing across the street, mast to mast, 5 m saris bellying under the cable
          for (let j = i + 1; j < ms.length; j++) { const b = ms[j]; if (b.used || b.sg === a.sg || b.u - a.u > 0.07) continue; const d = d3(a.m, b.m); if (d < 42 || d > 125 || !lineOK(a.m, b.m, 2.2 * 0.6 + 2.6, 6.5)) continue;
            sariLine(a.m, b.m, 2.2, 1.9); a.used = b.used = 1; nw++; await ctx.yield(); break; } } }
      for (const h of hulls) { if (!h.close || h.z > 470 || h.L < 30) continue;                                            // mooring chains
        const eb = deckEdge(h.o, 0.46), a = h.wpt(eb[0] + 0.4, eb[1] * 0.8, 0), off = (aq() - 0.5) * 0.9, len = 10 + aq() * 7 + h.D * 0.6, cy = Math.cos(h.yaw + off), sy = Math.sin(h.yaw + off);
        const b = [a[0] + cy * len, 0.3, a[2] - sy * len]; if (inHull(b[0], b[2], 3) || (Math.abs(b[0]) < 39 && b[2] < 72)) continue;
        rib.add(sagLine(a, b, len * 0.12, 9), 0.055, CHAIN); mS2.makeRotationY(h.yaw + off).setPosition(b[0], 0, b[2]);
        for (const [lx, ly, lz, w, hh, d, rx] of [[0.6, 0.45, 0, 2.3, 0.22, 0.22, 0], [-0.4, 0.3, 0.75, 0.3, 0.75, 0.42, 0.5], [-0.4, 0.3, -0.75, 0.3, 0.75, 0.42, -0.5], [1.6, 0.6, 0, 0.18, 0.18, 1.5, 0]]) { mL.copy(mS2).multiply(trs(lx, ly, lz, rx, 0, 0.3, w, hh, d)); plain.add(BOXG, mL, CAP); } }
      await ctx.yield();
      const stall = (x, z, yaw, i) => { const cx = Math.cos(yaw), sx = Math.sin(yaw), c = bright[i % bright.length], P = (lx, ly, lz) => [x + lx * cx + lz * sx, ly, z - lx * sx + lz * cx];
        mS2.makeRotationY(yaw).setPosition(x, 0, z); const bx = (lx, ly, lz, w, hh, d, cc) => { mL.copy(mS2).multiply(trs(lx, ly, lz, 0, 0, 0, w, hh, d)); plain.add(BOXG, mL, cc); };
        bx(0, 0.48, 0, 3.5, 0.96, 1.9, C.timber); bx(0, 1.0, 0, 3.8, 0.08, 2.2, i % 3 ? C.cream : C.pale);
        for (const dx of [-2.1, 2.1]) for (const dz of [-1.6, 1.6]) rib.add([P(dx, 0, dz), P(dx, 3.05, dz)], 0.05, C.timber);
        for (let q = 0; q < 5; q++) for (const sg of [1, -1]) wind.sheet(P(-2.45 + q * 0.98, 3.9, 0), [0.98 * cx, 0, -0.98 * sx], [sg * 2.05 * sx, -0.95, sg * 2.05 * cx], 1, 2, q % 2 ? C.cream : c, 0.07, i * 1.3 + q * 0.3);
        for (let j = 0; j < 4; j++) bx(-1.35 + j * 0.9, 1.2, (aq() - 0.5) * 0.6, 0.66, 0.34, 0.66, goods[(aq() * goods.length) | 0]);
        avLamps.push([x, 3.1, z]); shLine(x, z, x + SX * CK * 3.3, z + SZ * CK * 3.3, 2.6, 2.2);
        for (let j = 0; j < 3; j++) { const p = P(-1.5 + j * 1.5 + (aq() - 0.5) * 0.6, 0.05, (j % 2 ? 1 : -1) * (1.9 + aq() * 0.8)); avCrowd.push([p, [p[0] + 0.01, p[1], p[2]], tn(), aq()]); }
        stallAt.push([x, z]); };
      const rows = []; for (let i = 0; i < 17; i++) rows.push([0.418 + i * 0.0148, i % 2 ? 6.5 + (i % 4) * 1.2 : -15.5 - (i % 3) * 1.4]);    // down both sides of the duckboard walk
      for (let i = 0; i < 17; i++) rows.push([0.418 + (i + 3.5) * 0.0148, i % 2 ? 20 + (i % 4) * 4 : -26 - (i % 3) * 5.5]);          // and an outer row each side at the same spacing, staggered half a step against the inner one, in the open ground between the lines of hulls (a stall that would stand in a hull is left out below)
      for (let i = 0; i < rows.length; i++) { const q = frame(rows[i][0], rows[i][1], 0), yaw = Math.atan2(-tan.z, tan.x) + (aq() - 0.5) * 0.5;
        if (!inHull(q[0], q[2], 5) && !(rare && q[2] > 146 && q[2] < 204 && q[0] < 130)) stall(q[0], q[2], yaw, i); if (i % 4 === 3) await ctx.yield(); }
      for (let i = 0; i + 1 < stallAt.length; i++) for (let j = 0; j < 2; j++) { const a = stallAt[i], b = stallAt[Math.min(stallAt.length - 1, i + 1 + ((aq() * 2) | 0))], o = () => (aq() - 0.5) * 7;          // walkers going from stall to stall
        const pa = [a[0] + o(), 0.05, a[1] + o()], pb = [b[0] + o(), 0.05, b[1] + o()], c = tn(), ph = aq(); if (Math.hypot(pb[0] - pa[0], pb[2] - pa[2]) < 60 && !inHull(pa[0], pa[2], 2) && !inHull(pb[0], pb[2], 2)) avCrowd.push([pa, pb, c, ph]); }
    }
    await ctx.yield();
    // ---- the crest above the second mast, where the fog tears: two long lines of pennants and lamp beads rise from the heads of the mast
    // pair to two tall poles standing in open mud 45 m on toward the third mast, 26 m either side of the line from mast to mast (each on the
    // clear ground nearest that spot), so the pale air of the tear has near things in it on both hands. A stream of their own. ----
    const postAt = [[xa[0], xa[2]], [xb[0], xb[2]]];                              // where a pylon or a tall pole stands in the open mud
    { const lq = ctx.core.makeRng(ctx.core.hashSeed('crestlines:' + ctx.seed)), dx = 86 - 135, dz = 250 - 433, dl = Math.hypot(dx, dz), ax = dx / dl, az = dz / dl, PH = 34;
      for (const sg of [1, -1]) { const wx = 135 + ax * 45 - az * 26 * sg, wz = 433 + az * 45 + ax * 26 * sg, mh = cmT[1][sg > 0 ? 0 : 1]; let spot = null;
        for (let r = 0; r <= 24 && !spot; r += 4) for (let k = 0; k < (r ? 6 : 1) && !spot; k++) { const a = k * Math.PI / 3 + 0.5, x = wx + r * Math.cos(a), z = wz + r * Math.sin(a);
          if (path.nearestXZ(x, z).dist > 19 && !inHull(x, z, 4) && !stallAt.some((q) => Math.hypot(x - q[0], z - q[1]) < 5)) spot = [x, z]; }
        if (!spot) continue; const [x, z] = spot;
        plain.box(x, PH / 2, z, 0.38, PH, 0.38, C.pale); for (let y = 6; y < PH - 2; y += 6) plain.box(x, y, z, 1.4, 0.12, 0.12, C.pale, 0, y * 0.7, 0);
        for (const [gx, gz] of [[8, 5], [-7, 6], [-2, -9]]) rib.add([[x, PH * 0.85, z], [x + gx, 0.2, z + gz]], 0.02, C.rope);
        shLine(x, z, x + SX * CK * PH, z + SZ * CK * PH, 0.5, 0.25);
        const l = sagLine(mh, [x, PH - 0.3, z], 2.6, 22); rib.add(l, 0.03, C.rope); addBunting(wind, l, cloth, 1.5, 1.8, lq() * 9, flagM); lamps(l, 2); postAt.push([x, z]);
        wind.sheet([x - 0.15, PH - 0.2, z - 0.42], [0.3, 0, 0.85], [-1.4, -3.8, 0.5], 1, 6, sg > 0 ? C.yellow : C.pink, 1.2, x, C.cream); lampP.push([x, PH + 0.3, z]);
        await ctx.yield(); } }
    // ---- mud furniture: country boats lying on their bilges, a row of bronze propellers on timber frames, anchors, oil drums in
    // threes, coiled hawsers, bamboo scaffolds against the small hulls; thickest under the dive and the low run, a scatter under the
    // opening third. A private stream, so nothing else moves. ----
    { const mq = lcg((typeof ctx.seed === 'number' ? ctx.seed : 7) * 40503 + 311), BC = [col('#4a4038'), C.teal, C.yellow, C.orange, col('#2f5f9a'), col('#b03a4a'), C.rust], mB = new THREE.Matrix4(), FLOOR = col('#7a6248');
      // a country boat's outside: tarred below the turn of the bilge, her colour above, a painted band under the gunwale and an eye on each bow
      const CSIDE = BSIDE.clone(); { const p = CSIDE.attributes.position, cc = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { const kk = p.getY(i) < 0.3 ? 0.3 : 1; cc[i * 3] = kk; cc[i * 3 + 1] = kk; cc[i * 3 + 2] = kk * (kk < 1 ? 1.1 : 1); } CSIDE.setAttribute('color', new THREE.BufferAttribute(cc, 3)); }
      const free = (x, z, pad) => !inHull(x, z, pad) && !(Math.abs(x) < 39 && z < 72) && !stallAt.some((q) => Math.hypot(x - q[0], z - q[1]) < pad + 3.5);
      const blot = (x, z, r, hgt) => { shLine(x, z, x + SX * CK * hgt, z + SZ * CK * hgt, r, r * 0.85); trodAt.push([x, z, Math.max(5, r * 2.8)]); };   // (and what lies on the flat lies on sand: its place is marked on the mud's map)
      const base = (x, y, z, yaw, rx, sc) => mB.makeRotationY(yaw).multiply(mR.makeRotationX(rx)).scale(v3.set(sc, sc, sc)).setPosition(x, y, z);
      const part = (geo, x, y, z, sx, sy, sz, c, rx = 0, ry = 0, rz = 0) => { mL.copy(mB).multiply(trs(x, y, z, rx, ry, rz, sx, sy, sz)); plain.add(geo, mL, c); };
      const boatAt = (x, z, k) => { const sc = 1.5 + mq() * 0.4, yaw = mq() * 6.283, bdk = mq(), mag = 0.24 + mq() * 0.16; if (!free(x, z, 4)) return;
        path.pointAt(path.nearestXZ(x, z).u, pp); const hl = (pp.x - x) * Math.sin(yaw) + (pp.z - z) * Math.cos(yaw) >= 0 ? mag : -mag, hc = BC[k % BC.length], bd = bdk < 0.35 ? C.yellow : C.cream;   // she lies on her bilge with her open side toward the cable, wherever she lies
        base(x, (0.1 + 0.8 * mag) * sc, z, yaw, hl, sc); plain.add(CSIDE, mB, hc);
        for (const sg of [1, -1]) { part(BOXG, -0.3, 0.84, sg * 1.185, 4.0, 0.13, 0.05, bd); part(BOXG, 2.66, 0.93, sg * 0.75, 0.52, 0.26, 0.04, C.cream, 0, sg * 0.6); part(BOXG, 2.69, 0.93, sg * 0.775, 0.2, 0.17, 0.04, CAP, 0, sg * 0.6); } part(BDECK, 0, -0.62, 0, 0.9, 1, 0.74, FLOOR); part(BOXG, 0.5, 0.86, 0, 0.3, 0.06, 2.1, C.plank); part(BOXG, -1.4, 0.86, 0, 0.3, 0.06, 1.9, C.plank);
        part(BOXG, 2.3, 0.9, 0, 0.9, 0.05, 1.1, C.plank); for (const sg of [1, -1]) part(BOXG, -0.5, 1.19, sg * 1.15, 3.6, 0.1, 0.13, C.cream); blot(x, z, 2.1 * sc, 0.8 * sc); };
      for (let i = 0; i < 16; i++) { const uu = 0.585 + i * 0.0185 + mq() * 0.008, sd = 9 + mq() * 24, q = frame(uu, (i % 2 ? 1 : -1) * Math.max(sd, 17), 0); boatAt(q[0], q[2], i); }   // (none of the low run's boats lies within 17 m of the cable's ground line)
      await ctx.yield();
      for (let i = 0; i < 10; i++) { const q = frame(0.015 + i * 0.034 + mq() * 0.01, (i % 2 ? 1 : -1) * (11 + mq() * 22), 0); boatAt(q[0], q[2], i + 3); }
      CSIDE.dispose(); await ctx.yield();
      { const BRZ = new THREE.Color(0.95, 0.9, 0.8); let p0 = null, p1 = null;                                 // five propellers in a row, leaning on timber frames; one shadow for the row
        for (let k = 0; k < 5; k++) { const q = frame(0.728 + k * 0.0075, -15 - k * 0.6, 0), yaw = Math.atan2(-tan.z, tan.x) + 1.2; if (!free(q[0], q[2], 3)) continue;
          base(q[0], 2.55, q[2], yaw, -0.2, 2.3); plain.add(PROPG, mB, BRZ); part(BOXG, 0, -0.5, -0.5, 0.11, 1.4, 0.11, C.timber, 0.7); part(BOXG, 0.0, -1.02, -0.2, 0.9, 0.1, 1.1, C.timber); if (!p0) p0 = q; p1 = q; trodAt.push([q[0], q[2], 8]); }
        if (p0) { const hx = SX * CK * 2.3, hz = SZ * CK * 2.3; shPoly.push([[[p0[0], p0[2]], [p1[0], p1[2]], [p1[0] + hx * 2, p1[2] + hz * 2], [p0[0] + hx * 2, p0[2] + hz * 2]], p0[0], p0[2], p0[0] + hx * 2, p0[2] + hz * 2, 0.5]); } }
      await ctx.yield();
      for (let i = 0; i < 7; i++) { const q = frame(0.62 + i * 0.036 + mq() * 0.01, (i % 2 ? -1 : 1) * (8 + mq() * 16), 0), yaw = mq() * 6.283; if (!free(q[0], q[2], 3)) continue;   // anchors lying on a fluke
        base(q[0], 0.3, q[2], yaw, 0, 1.25); part(BOXG, 0.9, 0.62, 0, 2.7, 0.24, 0.24, CAP, 0, 0, 0.42); part(BOXG, -0.25, 0.16, 0, 0.3, 0.3, 2.0, CAP); part(BOXG, -0.1, 0.5, 0.86, 0.34, 0.8, 0.44, CAP, 0.5); part(BOXG, -0.1, 0.5, -0.86, 0.34, 0.8, 0.44, CAP, -0.5);
        part(BOXG, 1.95, 1.08, 0, 0.2, 0.2, 1.6, C.rust); part(TANK, 2.25, 1.22, 0, 0.5, 0.09, 0.5, C.steel, Math.PI / 2); blot(q[0], q[2], 1.6, 1.2); }
      await ctx.yield();
      for (let i = 0; i < 12; i++) { const q = frame(i < 8 ? 0.6 + i * 0.033 + mq() * 0.01 : 0.05 + (i - 8) * 0.07, (i % 2 ? 1 : -1) * (7 + mq() * 18), 0), yaw = mq() * 6.283; if (!free(q[0], q[2], 2.5)) continue;   // oil drums in threes
        base(q[0], 0, q[2], yaw, 0, 1); const dc = [C.rust, C.teal, C.steel, C.orange, C.yellow];
        part(TANK, 0, 0.45, 0, 0.62, 0.9, 0.62, dc[i % 5]); part(TANK, 0.7, 0.45, 0.2, 0.62, 0.9, 0.62, dc[(i + 2) % 5]); part(TANK, 0.25, 0.31, 0.85, 0.62, 0.9, 0.62, dc[(i + 3) % 5], 0, 0, Math.PI / 2); blot(q[0], q[2], 0.8, 0.9); }
      for (let i = 0; i < 8; i++) { const q = frame(i < 5 ? 0.63 + i * 0.05 + mq() * 0.01 : 0.08 + (i - 5) * 0.09, (i % 2 ? -1 : 1) * (9 + mq() * 14), 0); if (!free(q[0], q[2], 2.5)) continue;                // coiled hawsers
        base(q[0], 0, q[2], 0, 0, 1); part(TANK, 0, 0.15, 0, 2.1, 0.3, 2.1, HAWS); part(TANK, 0, 0.42, 0, 1.5, 0.26, 1.5, HAWS.clone().multiplyScalar(0.86)); part(TANK, 0, 0.44, 0, 0.7, 0.3, 0.7, C.rope); }
      await ctx.yield();
      for (const [h, sgn] of [[DV[0], 1], [DV[1], 1], [DV[2], 1]]) {                                         // bamboo scaffolds leaning on the small hulls
        const zz = sgn * (h.B / 2 + 1.1), zt = sgn * (h.B / 2 + 0.15), top = h.D + 1.5, xs = [-5, -2.5, 0, 2.5, 5].map((x) => x - 0.12 * h.L);
        for (const x of xs) rib.add([h.wpt(x, 0.5, zz), h.wpt(x, top, zt)], 0.05, C.straw);
        for (let j = 1; j <= 3; j++) { const t = j / 3.4; rib.add([h.wpt(xs[0] - 0.4, 0.5 + (top - 0.5) * t, lerp(zz, zt, t)), h.wpt(xs[4] + 0.4, 0.5 + (top - 0.5) * t, lerp(zz, zt, t))], 0.04, C.straw);
          beam(h.wpt(xs[1], 0.56 + (top - 0.5) * t, lerp(zz, zt, t) + sgn * 0.3), h.wpt(xs[3], 0.56 + (top - 0.5) * t, lerp(zz, zt, t) + sgn * 0.3), 0.6, 0.05, C.plank); }
        rib.add([h.wpt(xs[0], 0.5, zz), h.wpt(xs[4], top, zt)], 0.03, C.straw); await ctx.yield(); }
    }
    // ---- the shore bank inland: palms, banana and tin sheds along x +340 ----
    { const sr = rng.fork('shore'); plain.box(372, 1.1, 440, 70, 2.2, 720, C.earth); plain.box(339, 0.6, 440, 8, 1.2, 716, C.earth.clone().multiplyScalar(0.8));
      for (let i = 0; i < 44; i++) { const z = 110 + i * 15.6 + sr() * 8, x = 344 + sr() * 26;
        if (inHull(x, z, 5)) { sr(); sr(); sr(); continue; }
        if (i % 3 === 1) { const w = 5 + sr() * 6, hgt = 2.6 + sr() * 1.4, c = tins[(sr() * 4) | 0]; plain.box(x, 2.2 + hgt / 2, z, w, hgt, 4 + sr() * 3, c); plain.box(x, 2.3 + hgt, z, w + 1, 0.12, 7.6, C.pale, 0, 0, 0.12); }
        else { const ht = 9 + sr() * 6, lean = (sr() - 0.5) * 3, pts = []; for (let k = 0; k <= 4; k++) { const t = k / 4; pts.push([x + lean * t * t, 2.2 + ht * t, z + lean * 0.4 * t * t]); }
          for (let k = 0; k < 4; k++) beam(pts[k], pts[k + 1], 0.42 - k * 0.05, 0.42 - k * 0.05, C.timber);
          const top = pts[4], n = 9 + ((sr() * 3) | 0), a0 = sr() * 6.28; for (let k = 0; k < n; k++) { const a = a0 + k * 6.283 / n + sr() * 0.3; wind.leaf(top, Math.cos(a), Math.sin(a), 4.2 + sr() * 1.6, 0.55, 0.75 - (k % 3) * 0.3, 1.0 + (k % 3) * 0.25, C.leaf, C.leaf2, 0.6, sr() * 6, 3); } }
        if (i % 4 === 3) await ctx.yield(); }
      // marigold heads drying on mats: two decks of the liner, four more at the festival
      for (const [x, z, w] of festival ? [[-60, 14.4, 16], [44, 14.6, 14], [-118, 14.2, 12], [96, 14.4, 12], [-20, 10.4, 12], [30, 10.4, 10]] : [[-60, 14.4, 16], [44, 14.6, 14]]) plain.box(x, z > 12 ? 24.09 : 27.6, z, w, 0.06, 2.6, C.marigold);
    }
    await ctx.yield();
    // ---- paper kites run from the terraces, each on its string, all riding the same gusts as the washing: nine on a plain day
    // (from a stream of their own), forty at the festival ----
    if (!night) { const NK = festival ? 40 : 9, KS = 1, kr = festival ? rng.fork('kites') : lcg(seedN * 7919 + 13), kc = [C.pink, C.yellow, C.teal, C.orange, col('#e6e2d8'), col('#b03a4a'), col('#7a4a9a'), col('#3f6fb0')];
      for (let i = 0; i < NK; i++) { const ax = -120 + kr() * 240, lv = (kr() * 3) | 0, az = (kr() < 0.7 ? 1 : -1) * ([15, 11, 7][lv]), ay = 25.3 + lv * 3.5, hgt = 20 + kr() * 30, fl = 1.2 + kr() * 1.6, ph = kr() * 20;
        const kx = ax - 8 - kr() * 26 - hgt * (0.15 + kr() * 0.4), ky = ay + hgt, kz = az + (az > 0 ? 1 : -1) * (4 + kr() * 26), s = (1.7 + kr() * 1.3) * KS, c1 = kc[i % kc.length], c2 = kc[(i * 3 + 2) % kc.length];
        const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push([lerp(ax, kx, t), lerp(ay, ky, t) - 5 * Math.sin(Math.PI * t) * (1 - t * 0.5), lerp(az, kz, t)]); }
        if (i % 3 !== 2) rib.add(pts, 0.005, HZP, [0, fl, ph]);
        const T0 = [kx, ky + 0.8 * s, kz], B0 = [kx, ky - 0.8 * s, kz + 0.3 * s], Lf = [kx - 0.62 * s, ky + 0.18 * s, kz + 0.06 * s], Rt = [kx + 0.62 * s, ky + 0.18 * s, kz + 0.06 * s], Mi = [kx, ky + 0.18 * s, kz + 0.12 * s], ff = [fl, fl, fl, fl];
        wind.quad(T0, Lf, Mi, Mi, c1, ff, ph, [-0.3, 0.3, 0.9]); wind.quad(T0, Mi, Rt, Rt, c2, ff, ph, [0.3, 0.3, 0.9]); wind.quad(Lf, B0, Mi, Mi, c2, ff, ph, [-0.3, 0.1, 0.9]); wind.quad(Mi, B0, Rt, Rt, c1, ff, ph, [0.3, 0.1, 0.9]);
        for (let k = 0; k < 4; k++) { const y0 = B0[1] - k * 0.6, f0 = fl + k * 0.1, f1 = f0 + 0.12; wind.quad([kx - 0.07, y0, B0[2]], [kx + 0.07, y0, B0[2]], [kx + 0.07, y0 - 0.6, B0[2]], [kx - 0.07, y0 - 0.6, B0[2]], k % 2 ? c1 : c2, [f0, f0, f1, f1], ph + k * 0.4, [0, 0.2, 1]); }
        if (i % 10 === 9) await ctx.yield(); }
      // double bunting: a second pass from the mastheads to the terraces and across the square
      if (festival) for (const [a, b] of [[[104, 62, 0], [40, 39, 14]], [[-98, 62, 0], [-40, 36, 14]], [[104, 62, 0], [150, 27, 12]], [[-98, 62, 0], [-140, 26, 12]], [[-34, 12, 20], [34, 12, 20]], [[-34, 9, 66], [34, 9, 66]], [[-34, 12, 20], [-34, 9, 66]], [[34, 12, 20], [34, 9, 66]]]) { const l = sagLine(a, b, 2.2, 22); rib.add(l, 0.02, C.rope); addBunting(wind, l, cloth, 1.2, 1, a[0], flagM); lamps(l, 3); await ctx.yield(); }
    }
    await ctx.yield();
    // ---- the life of the lower flat, on the open mud between what stands there already: country boats on their bilges on the sand, nets
    // and sails spread to dry on the crowns of the bars, fish racks and mats of the catch, punts poled across the standing water, files of
    // head-load walkers along the mud streets, a gang hauling a boat. Each is placed by the ground: by the mud's own map (the noise the mud
    // is drawn with, in the same order: bar, pan), on clear mud 3 to 6 m and more from every hull (by its size) and 36 m and more from the
    // cable's ground line (nearer than that the flat has its furniture already), off the square, the stalls, the pylons, the egrets' channel
    // and the arrival's ways, lying along the street it is in (the long axis of the nearest hull). A stream of their own, made from the seed and a name: nothing else is dealt anew. ----
    const flatBoats = []; let flatBoatG = null;
    { const fq = ctx.core.makeRng(ctx.core.hashSeed('flatlife:' + ctx.seed)), fr = (x) => x - Math.floor(x), fd = Math.fround;
      const h21 = (x, y) => { let a = fr(fd(x * 0.1031)), b = fr(fd(y * 0.103)); const d = fd(a * (b + 33.33) + b * (a + 33.33)); a += d; b += d; return fr(fd((a + b) * b)); };
      const vn = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y); let tx = x - ix, ty = y - iy; tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty); return lerp(lerp(h21(ix, iy), h21(ix + 1, iy), tx), lerp(h21(ix, iy + 1), h21(ix + 1, iy + 1), tx), ty); };
      const fb = (x, y) => vn(x, y) * 0.5 + vn(x * 2.03 + 7.1, y * 2.03 + 7.1) * 0.25 + vn(x * 4.1 + 3.3, y * 4.1 + 3.3) * 0.125 + vn(x * 8.3 + 1.7, y * 8.3 + 1.7) * 0.0625;
      const barAt = (x, z) => { const b = fb(x * 0.0065 + 4.3, z * 0.021 + 4.3) + 0.3 * (fb(x * 0.03 + 9.1, z * 0.07 + 9.1) - 0.47) + 0.06 * (fb(x * 0.33 + 2.7, z * 0.33 + 2.7) - 0.47);
        return lerp(b, 0.5 + 0.6 * (b - 0.5) + 0.42 * (fb(x * 0.017 + 23.1, z * 0.055 + 23.1) - 0.47), 1 - sstep(410, 480, z)); };
      const panAt = (x, z) => barAt(x, z) + 0.05 * (fb(x * 0.11 + 5.9, z * 0.11 + 5.9) - 0.47);
      const water = (x, z) => z < 420 && panAt(x, z) < 0.487, sand = (x, z) => panAt(x, z) > 0.518, crown = (x, z) => barAt(x, z) > 0.566;   // standing water, the sand beside it, the dry crown of a bar
      const mine = [], egret = []; for (let i = 0; i < 9; i++) egret.push([23 + i * 12, 323 + 44 * Math.sin(i * 0.8)]);
      const open = (x, z, pad, r) => { const n = path.nearestXZ(x, z); if (n.dist < 36 || n.dist > 185 || z < 84 || z > 440) return false;
        if (inHull(x, z, pad) || (Math.abs(x) < 41 && z < 74) || (rare && z > 144 && z < 206 && x < 132)) return false;
        for (const q of stallAt) if (Math.hypot(x - q[0], z - q[1]) < r + 4) return false; for (const q of postAt) if (Math.hypot(x - q[0], z - q[1]) < r + 5) return false;
        for (const q of egret) if (Math.hypot(x - q[0], z - q[1]) < r + 7) return false; for (const q of mine) if (Math.hypot(x - q[0], z - q[1]) < r + q[2] + 2) return false; return true; };
      const street = (x, z) => { let bd = 1e9, yaw = 0; for (const q of hulls) { if (Math.abs(x - q.x) > q.L * 0.5 + bd || Math.abs(z - q.z) > q.L * 0.5 + bd) continue; for (const [qx, qz] of q.s) { const d = Math.hypot(x - qx, z - qz); if (d < bd) { bd = d; yaw = q.yaw; } } } return yaw; };
      const spot = () => [-150 + fq() * 450, 84 + fq() * 356], mB = new THREE.Matrix4(), FLOOR = col('#7a6248'), BOTTOM = col('#b89a70'), ul = Math.hypot(SUN.x * 0.8, 0.6, SUN.z * 0.8), UP = [SUN.x * 0.8 / ul, 0.6 / ul, SUN.z * 0.8 / ul];   // (UP: what lies spread on the sand takes the light the rippled sand takes, a normal leaning to the sun)
      const BC = [col('#4a4038'), C.teal, C.yellow, C.orange, col('#2f5f9a'), col('#b03a4a'), C.rust, C.cream], tn = () => { const c = cloth[(fq() * cloth.length) | 0]; return new THREE.Color(c.r * 0.66 + 0.05, c.g * 0.66 + 0.045, c.b * 0.66 + 0.04); };
      const put = (geo, x, y, z, sx, sy, sz, c, rx = 0, ry = 0, rz = 0) => { mL.copy(mB).multiply(trs(x, y, z, rx, ry, rz, sx, sy, sz)); plain.add(geo, mL, c); };
      const blot = (x, z, r, hgt) => shLine(x, z, x + SX * CK * hgt, z + SZ * CK * hgt, r, r * 0.85);
      const FSIDE = BSIDE.clone(); { const p = FSIDE.attributes.position, cc = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { const kk = p.getY(i) < 0.3 ? 0.3 : 1; cc[i * 3] = kk; cc[i * 3 + 1] = kk; cc[i * 3 + 2] = kk * (kk < 1 ? 1.1 : 1); } FSIDE.setAttribute('color', new THREE.BufferAttribute(cc, 3)); }   // tarred below the turn of the bilge
      await ctx.yield();
      // country boats lying on their bilges on the sand, their open sides toward the cable
      for (let t = 0, n = 0; t < 520 && n < 22; t++) { const [x, z] = spot(), r1 = fq(), r2 = fq(), r3 = fq(), r4 = fq(); if (t % 24 === 23) await ctx.yield();
        if (!sand(x, z) || !open(x, z, 6, 6)) continue; const sc = 1.5 + r1 * 0.45, yaw = street(x, z) + (r2 - 0.5) * 0.6, mag = 0.24 + r3 * 0.16;
        path.pointAt(path.nearestXZ(x, z).u, pp); const hl = (pp.x - x) * Math.sin(yaw) + (pp.z - z) * Math.cos(yaw) >= 0 ? mag : -mag;
        mB.makeRotationY(yaw).multiply(mR.makeRotationX(hl)).scale(v3.set(sc, sc, sc)).setPosition(x, (0.1 + 0.8 * mag) * sc, z); plain.add(FSIDE, mB, BC[1 + ((r4 * 7) | 0)]);
        put(BDECK, 0, -0.62, 0, 0.9, 1, 0.74, FLOOR); put(TOPQ, 0.5, 0.87, 0, 0.3, 1, 2.1, C.plank); put(TOPQ, -1.4, 0.87, 0, 0.3, 1, 1.9, C.plank); for (const sg of [1, -1]) put(TOPQ, -0.5, 1.21, sg * 1.15, 3.6, 1, 0.16, C.cream);
        blot(x, z, 2.1 * sc, 0.8 * sc); mine.push([x, z, 6]); n++; }
      await ctx.yield();
      // and boats afloat at their stakes in the pans, upright, each with its mooring pole
      for (let t = 0, n = 0; t < 420 && n < 10; t++) { const [x, z] = spot(), r1 = fq(), r2 = fq(), r3 = fq(); if (t % 24 === 23) await ctx.yield();
        if (!water(x, z) || !open(x, z, 6, 6)) continue; const sc = 1.45 + r1 * 0.4, yaw = street(x, z) + (r2 - 0.5) * 1.2;
        mB.makeRotationY(yaw).scale(v3.set(sc, sc, sc)).setPosition(x, -0.24 * sc, z); plain.add(FSIDE, mB, BC[1 + ((r3 * 5) | 0) % 3 + (r3 < 0.5 ? 0 : 4)]);   // (the boats in use are the painted ones)
        put(BDECK, 0, -0.42, 0, 0.97, 1, 0.9, BOTTOM); put(TOPQ, 0.5, 0.87, 0, 0.3, 1, 2.1, C.cream); put(TOPQ, -1.4, 0.87, 0, 0.3, 1, 1.9, C.cream);
        plain.box(x + Math.cos(yaw) * 4.4 * sc, 1.3, z - Math.sin(yaw) * 4.4 * sc, 0.14, 2.6, 0.14, C.timber); blot(x, z, 1.9 * sc, 0.6 * sc); mine.push([x, z, 6]); n++; }
      await ctx.yield();
      // nets and sails spread to dry on the crowns of the bars: a net in three long folds with its float line, a sail laid out flat with its yard
      { const NETC = [col('#3fa39c'), col('#3f78c0'), col('#4f9a6a')], SAILC = [col('#a8452a'), col('#e0b23e'), col('#efe9da'), col('#2f62a8'), col('#b03a4a')];
        for (let t = 0, n = 0; t < 900 && n < 44; t++) { const [x, z] = spot(), r1 = fq(), r2 = fq(), r3 = fq(), r4 = fq(); if (t % 24 === 23) await ctx.yield();
          if (!crown(x, z) || !open(x, z, 5, 6)) continue; const yaw = street(x, z) + (r2 - 0.5) * 0.9, cx = Math.cos(yaw), sx = Math.sin(yaw), W = (lx, lz) => [x + lx * cx + lz * sx, 0.07, z - lx * sx + lz * cx], dry = (lx, lz) => crown(x + lx * cx + lz * sx, z - lx * sx + lz * cx);
          if (!dry(4, 0) || !dry(-4, 0) || !dry(0, 3) || !dry(0, -3)) continue;
          if (r1 < 0.55) { const len = 8 + r3 * 5, c = NETC[(r4 * 3) | 0]; for (let k = -1; k <= 1; k++) plain.quad(W(-len / 2, k * 1.9 - 0.75), W(len / 2, k * 1.9 - 0.75 + 0.3 * k), W(len / 2, k * 1.9 + 0.75 + 0.3 * k), W(-len / 2, k * 1.9 + 0.75), UP, c);
            plain.quad(W(-len / 2, 2.75), W(len / 2, 3.05), W(len / 2, 3.3), W(-len / 2, 3.0), UP, C.orange); }
          else { const len = 8 + r3 * 4.5, wd = 5 + r4 * 2.5, c = SAILC[(r3 * 97 % 5) | 0]; plain.quad(W(-len / 2, -wd / 2), W(len / 2, -wd * 0.36), W(len * 0.36, wd / 2), W(-len / 2, wd * 0.42), UP, c);
            beam(W(-len / 2 - 0.4, -wd / 2 - 0.1).map((v, i) => (i === 1 ? 0.2 : v)), W(len / 2 + 0.5, -wd * 0.36 - 0.1).map((v, i) => (i === 1 ? 0.2 : v)), 0.16, 0.16, C.timber); }
          mine.push([x, z, 6]); n++; } }
      await ctx.yield();
      // fish racks (bamboo frames, three rails hung with the catch) and mats of the catch and of marigold heads laid on the sand beside the boats
      { const FISH = [col('#b4babe'), col('#8f979c'), col('#c9c2b0')], HEAP = [C.marigold, col('#b4babe'), C.yellow, C.leaf2, col('#b8402a')];
        for (let t = 0, n = 0; t < 420 && n < 9; t++) { const [x, z] = spot(), r1 = fq(), r2 = fq(); if (t % 24 === 23) await ctx.yield();
          if (!sand(x, z) || !open(x, z, 5, 5)) continue; const yaw = street(x, z) + Math.PI / 2 + (r1 - 0.5) * 0.5, cx = Math.cos(yaw), sx = Math.sin(yaw), W = (lx, ly, lz) => [x + lx * cx + lz * sx, ly, z - lx * sx + lz * cx];
          for (const lx of [-3.2, 3.2]) for (const lz of [-0.7, 0.7]) beam(W(lx, 0, lz * 1.6), W(lx, 2.5, lz * 0.2), 0.12, 0.12, C.straw);
          for (let k = 0; k < 3; k++) { const y = 2.4 - k * 0.7, lz = (k - 1) * 0.55; beam(W(-3.5, y, lz), W(3.5, y, lz), 0.09, 0.09, C.straw); plain.quad(W(-3.1, y, lz), W(3.1, y, lz), W(3.1, y - 0.55, lz), W(-3.1, y - 0.55, lz), [sx, 0, cx], FISH[(k + ((r2 * 3) | 0)) % 3]); }
          blot(x, z, 3.2, 2.4); mine.push([x, z, 5]); n++; }
        await ctx.yield();
        for (let t = 0, n = 0; t < 520 && n < 22; t++) { const [x, z] = spot(), r1 = fq(), r2 = fq(), r3 = fq(); if (t % 24 === 23) await ctx.yield();
          if (!sand(x, z) || !open(x, z, 4, 3)) continue; const yaw = street(x, z) + (r1 - 0.5), cx = Math.cos(yaw), sx = Math.sin(yaw), W = (lx, lz) => [x + lx * cx + lz * sx, 0.06, z - lx * sx + lz * cx]; mB.makeRotationY(yaw).setPosition(x, 0, z);
          plain.quad(W(-2.3, -1.55), W(2.3, -1.55), W(2.3, 1.55), W(-2.3, 1.55), UP, C.straw); const hc = HEAP[(r2 * HEAP.length) | 0]; put(BOXG, -0.9, 0.26, 0.3, 1.9, 0.4, 1.6, hc); put(BOXG, 1.1, 0.22, -0.4, 1.5, 0.32, 1.3, r3 < 0.5 ? hc : HEAP[(r3 * HEAP.length) | 0]);
          mine.push([x, z, 3]); n++; } }
      await ctx.yield();
      // a line of ground that is free from end to end: clear mud, and for a punt water all the way (walkers wade the pans: they are a hand deep)
      const lineOn = (x, z, dx, dz, len, wet, pad) => { for (let d = 0; d <= len + 0.01; d += 2.5) { const qx = x + dx * d, qz = z + dz * d; if ((wet && !water(qx, qz)) || !open(qx, qz, pad, 1)) return false; } return true; };
      // punts poled across the pans, each with its poler standing amidships (the boat and the figure share one stroke)
      for (let t = 0, n = 0; t < 600 && n < 5; t++) { const [x, z] = spot(), r1 = fq(), r2 = fq(), r3 = fq(), r4 = fq(); if (t % 16 === 15) await ctx.yield();
        const yaw = street(x, z) + (r1 - 0.5) * 0.7, dx = Math.cos(yaw), dz = -Math.sin(yaw), len = 22 + r2 * 24; if (!water(x, z) || !lineOn(x, z, dx, dz, len, true, 5)) continue;
        const ph = (((r3 * 7) | 0) + 0.3 * r4) / 7.3, bx = x + dx * len, bz = z + dz * len;
        flatBoats.push([[x, -0.2, z], [bx, -0.2, bz], BC[(r4 * 89 % BC.length) | 0], ph]); avCrowd.push([[x, 0.5, z], [bx, 0.5, bz], tn(), ph]);
        for (let d = 0; d <= len; d += 8) mine.push([x + dx * d, z + dz * d, 4]); n++; }
      await ctx.yield();
      // files of head-load walkers along the mud streets (each file keeps one step, a pace and a half apart), and a gang hauling a boat up the sand
      { const nf = Math.round(8 * Math.min(1.2, density) * detail);
        for (let t = 0, n = 0; t < 500 && n < nf; t++) { const [x, z] = spot(), r1 = fq(), r2 = fq(), r3 = fq(), r4 = fq(); if (t % 16 === 15) await ctx.yield();
          const yaw = street(x, z) + (r1 - 0.5) * 0.5, dx = Math.cos(yaw), dz = -Math.sin(yaw), m = 4 + ((r2 * 3) | 0), len = 24 + r3 * 26; if (!lineOn(x, z, dx, dz, len + m * 1.7, false, 3)) continue;
          const ph = (((r4 * 13) | 0) + 0.67 + 0.32 * r1) / 13.7;
          for (let i = 0; i < m; i++) { const o = i * 1.7, lat = (fq() - 0.5) * 0.5, ax = x + dx * o - dz * lat, az = z + dz * o + dx * lat; avCrowd.push([[ax, 0.05, az], [ax + dx * len, 0.05, az + dz * len], tn(), ph]); }
          for (let d = 0; d <= len + m * 1.7; d += 10) mine.push([x + dx * d, z + dz * d, 2]); n++; }
        await ctx.yield();
        for (let t = 0, n = 0; t < 400 && n < 1; t++) { const [x, z] = spot(), r1 = fq(), r2 = fq(), r3 = fq(); if (t % 16 === 15) await ctx.yield();
          const yaw = street(x, z) + (r1 - 0.5) * 0.4, dx = Math.cos(yaw), dz = -Math.sin(yaw), len = 28 + r2 * 18; if (water(x, z) || !lineOn(x - dx * 5, z - dz * 5, dx, dz, len + 16, false, 5)) continue;
          const ph = (((r3 * 7) | 0) + 0.12 * r1) / 7.3; flatBoats.push([[x, 0.1, z], [x + dx * len, 0.1, z + dz * len], BC[(r3 * 89 % BC.length) | 0], ph]);
          for (let i = 0; i < 6; i++) { const o = 6.4 + (i >> 1) * 1.5, lat = (i % 2 ? 1 : -1) * 0.9, ax = x + dx * o - dz * lat, az = z + dz * o + dx * lat; avCrowd.push([[ax, 0.05, az], [ax + dx * len, 0.05, az + dz * len], tn(), ph]); }
          for (let d = -4; d <= len + 14; d += 8) mine.push([x + dx * d, z + dz * d, 4]); n++; } }
      // the boat that moves (a punt, the hauled boat): the country boat's hull upright, bow along the way it goes
      { const b = makeBag(), KT = [0, 1, 0, 1], KN = [0, 0, 0, 0]; mB.makeRotationY(Math.PI / 2).scale(v3.set(1.3, 1.3, 1.3));
        mL.copy(mB); b.add(FSIDE, mL, col('#ffffff'), KT); mL.copy(mB).multiply(trs(0, -0.42, 0, 0, 0, 0, 0.97, 1, 0.9)); b.add(BDECK, mL, BOTTOM, KN); flatBoatG = b.build(); }
      FSIDE.dispose(); await ctx.yield(); }
    const paintedGeo = await painted.buildSteps(ctx), townP = new THREE.Mesh(paintedGeo, paintedMat); await ctx.yield();
    const coreGeo = await core.buildSteps(ctx), townC = new THREE.Mesh(coreGeo, plainMat); await ctx.yield();
    const townQ = new THREE.Mesh(await plain.buildSteps(ctx), plainMat); await ctx.yield();
    for (const m of [townP, townC, townQ]) { m.castShadow = m !== townQ; m.receiveShadow = true; scene.add(m); }   // the small dress casts no shadow: the shadow pass stays light
    if (glow.triangles > 0) scene.add(new THREE.Mesh(await glow.buildSteps(ctx), glowMat));
    { const tm = mirrorMat(atlas, atlasEmi, emiK); mirror(paintedGeo, tm);
      // the plain masses in the mirror, as one mesh: the town's deckhouses, the liner's houses, funnels and masts, and the flags of the
      // bunting lines (each flag again as one triangle, so a line of bunting lies in the standing water under it)
      { const srcs = [coreGeo, hero.mirror.plain], nF = flagM.length / 10; let nv = nF * 3, o = 0; for (const g of srcs) nv += g.attributes.position.count;
        const mp = new Float32Array(nv * 3), mn = new Float32Array(nv * 3), mc = new Float32Array(nv * 3), mu = new Float32Array(nv * 2);
        await ctx.yield();
        for (const g of srcs) { const c = g.attributes.position.count; mp.set(g.attributes.position.array.subarray(0, c * 3), o * 3); mn.set(g.attributes.normal.array.subarray(0, c * 3), o * 3); mc.set(g.attributes.color.array.subarray(0, c * 3), o * 3); o += c; await ctx.yield(); }
        for (let i = 0; i < nF; i++) { const c = flagM[i * 10 + 9]; for (let k = 0; k < 3; k++, o++) { mp[o * 3] = flagM[i * 10 + k * 3]; mp[o * 3 + 1] = flagM[i * 10 + k * 3 + 1]; mp[o * 3 + 2] = flagM[i * 10 + k * 3 + 2]; mn[o * 3 + 1] = 0.5; mn[o * 3 + 2] = 0.87; mc[o * 3] = c.r; mc[o * 3 + 1] = c.g; mc[o * 3 + 2] = c.b; } if (i % 400 === 399) await ctx.yield(); }
        const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(mp, 3)); mg.setAttribute('normal', new THREE.BufferAttribute(mn, 3)); mg.setAttribute('color', new THREE.BufferAttribute(mc, 3)); mg.setAttribute('uv', new THREE.BufferAttribute(mu, 2));
        mirror(mg, plainMirrorMat); await ctx.yield(); }
      if (paintedFar.triangles > 0) { const fg = await paintedFar.buildSteps(ctx), townF = new THREE.Mesh(fg, paintedMat); townF.receiveShadow = true; scene.add(townF); mirror(fg, tm); await ctx.yield(); } }   // the far hulls: in the mud's mirror like the rest, out of the shadow pass (they stand beyond its reach)
    for (const g of [PANE, FUNG, DISC, HALF, POLE, TANK, PROPG, BOATG, TOPQ, BSIDE, BDECK]) g.dispose();
    const windMesh = new THREE.Mesh(await wind.buildSteps(ctx), windMat); await ctx.yield();
    const ribMesh = new THREE.Mesh(await rib.buildSteps(ctx), ribMat); await ctx.yield(); windMesh.frustumCulled = false; ribMesh.frustumCulled = false; scene.add(windMesh, ribMesh);
    // the map of the flat that the mud is shaded with: red = the long shadows (one union, each fading down-sun), green = the scoured wet round the hulls
    // (the liner's own long shadow falls behind her and shows west of the stern; the scour along her flanks; what stands in the square)
    { const hp = []; for (const [x, z] of [[-145, -17], [-145, 17], [145, 17], [145, -17], [150, 0], [-150, 0]]) hp.push([x, z], [x + SX * CK * 30, z + SZ * CK * 30]);
      shPoly.push([convex(hp), 0, 0, SX * CK * 36, SZ * CK * 36, 0.7]); scourP.push([0, 0, 0, 180, 36]);
      for (const st of hero.anchors.stalls) shLine(st[0], st[1], st[0] + SX * CK * 3.1, st[1] + SZ * CK * 3.1, 1.9, 1.6);
      const PR = hero.anchors.propeller; shLine(PR.x, PR.z, PR.x + SX * CK * 8, PR.z + SZ * CK * 8, 2.4, 3.3); shLine(PR.x, PR.z, PR.x + SX * 3, PR.z + SZ * 3, 6.3, 6.3); }
    const MX0 = -430, MZ0 = -70, MW = 840, MD = 870, mcv = document.createElement('canvas'); mcv.width = 2048; mcv.height = 1536;
    await ctx.yield();
    { const mg = mcv.getContext('2d'); mg.fillStyle = '#000'; mg.fillRect(0, 0, 2048, 1536);
      await ctx.yield();
      mg.setTransform(2048 / MW, 0, 0, 1536 / MD, -MX0 * 2048 / MW, -MZ0 * 1536 / MD); mg.globalCompositeOperation = 'lighten';
      for (let i = 0; i < shPoly.length; i++) { const q = shPoly[i], pts = q[0], gr = mg.createLinearGradient(q[1], q[2], q[3], q[4]); gr.addColorStop(0, '#ff0000'); gr.addColorStop(0.45, '#ff0000'); gr.addColorStop(1, 'rgb(' + Math.round(255 * q[5]) + ',0,0)');
        mg.fillStyle = gr; mg.beginPath(); mg.moveTo(pts[0][0], pts[0][1]); for (let j = 1; j < pts.length; j++) mg.lineTo(pts[j][0], pts[j][1]); mg.closePath(); mg.fill(); if (i % 24 === 23) await ctx.yield(); }
      await ctx.yield();
      for (let i = 0; i < scourP.length; i++) { const q = scourP[i]; mg.save(); mg.translate(q[0], q[1]); mg.rotate(-q[2]); mg.scale(q[3], q[4]);
        const gr = mg.createRadialGradient(0, 0, 0.5, 0, 0, 1); gr.addColorStop(0, '#00ff00'); gr.addColorStop(1, '#000000'); mg.fillStyle = gr; mg.beginPath(); mg.arc(0, 0, 1, 0, 6.2832); mg.fill(); mg.restore(); if (i % 24 === 23) await ctx.yield(); }
      await ctx.yield();
      // blue = trodden ground: the duckboard walk's line, the standing of every stall of the street, the lie of every boat, anchor and drum of the mud's furniture
      mg.lineCap = 'round'; mg.lineJoin = 'round';
      for (const [w, c] of [[17, '#000070'], [9, '#0000ff']]) { mg.strokeStyle = c; mg.lineWidth = w; mg.beginPath(); for (let i = 0; i < walkAt.length; i++) { if (i) mg.lineTo(walkAt[i][0], walkAt[i][1]); else mg.moveTo(walkAt[i][0], walkAt[i][1]); } mg.stroke(); await ctx.yield(); }
      for (const q of stallAt) trodAt.push([q[0], q[1], 10]);
      for (let i = 0; i < trodAt.length; i++) { const q = trodAt[i], gr = mg.createRadialGradient(q[0], q[1], 0, q[0], q[1], q[2]); gr.addColorStop(0, '#0000ff'); gr.addColorStop(0.5, '#0000ff'); gr.addColorStop(1, '#000000'); mg.fillStyle = gr; mg.beginPath(); mg.arc(q[0], q[1], q[2], 0, 6.2832); mg.fill(); if (i % 24 === 23) await ctx.yield(); } }
    await ctx.yield();
    const maskTex = new THREE.CanvasTexture(mcv); maskTex.flipY = false; maskTex.anisotropy = 8; mudU.uMask.value = maskTex; mudU.uMaskR.value.set(MX0, MZ0, 1 / MW, 1 / MD);
    await ctx.yield();
    const poolGeo = new THREE.BufferGeometry(); poolGeo.setAttribute('position', new THREE.Float32BufferAttribute(poolP, 3)); poolGeo.setAttribute('uv', new THREE.Float32BufferAttribute(poolU, 2));
    const poolMat = makeWaterMaterial(); for (const k of ['uTime', 'uSky', 'uDeep', 'uSunCol', 'uSun']) poolMat.uniforms[k] = waterMat.uniforms[k]; poolMat.uniforms.uA.value = 0.3; poolMat.uniforms.uRing.value = 1;   // the pool is the mud's own mirror; this is only the rings spreading over it
    const pools = new THREE.Mesh(poolGeo, poolMat); pools.renderOrder = 0.5; pools.frustumCulled = false; scene.add(pools);
    // our own boat's shadow, a soft long blot that runs over the mud down-sun of us (placed from the camera every frame)
    const bsU = { uAxis: { value: new THREE.Vector2(1, 0) }, uSweep: { value: new THREE.Vector2(SX, SZ) }, uOp: { value: 0 }, uCol: { value: col(LK.shadow).multiplyScalar(0.085) } };
    const boatShadow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: bsU,   // the lifeboat's plan (pointed at both ends), drawn out down-sun by the depth of its hull
      vertexShader: `varying vec2 vP; void main(){ vP = position.xz*24.; gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position.x*24., 0., position.z*24., 1.); }`,
      fragmentShader: `uniform vec2 uAxis, uSweep; uniform float uOp; uniform vec3 uCol; varying vec2 vP;
        void main(){ float a = 0.;
          for (int i = 0; i < 5; i++) { vec2 q = vP - uSweep*(float(i)*1.6 - 1.2); float al = dot(q, uAxis), ac = dot(q, vec2(-uAxis.y, uAxis.x));
            a = max(a, 1. - smoothstep(0.7, 1.14, abs(ac)/2.1 + al*al/33.6)); }
          gl_FragColor = vec4(uCol, a*uOp); }` }));
    boatShadow.renderOrder = 1.1; boatShadow.frustumCulled = false; boatShadow.matrixAutoUpdate = false; scene.add(boatShadow);
    await ctx.yield();

    // ---- lamps: warm beads on the bunting lines, the mastheads and the booms; brightest at night ----
    for (const p of avLamps) lampP.push(p);
    const lampGlows = fx.makeGlows({ rng: rng.fork('lamps'), time: T, positions: lampP.length ? lampP : [[0, -50, 0]], color: '#ffc27a', size: night ? 1.5 : 1.0, sizes: (lampP.length ? lampP : [0]).map((p, i) => (bigLamp.has(i) ? 3.2 : 1 + 0.3 * Math.sin(i * 12.9898))), intensity: LK.lamp, flicker: 0.3, minAngle: 0.0035, fogAmount: 0.55 });
    scene.add(lampGlows.object);
    await ctx.yield();

    // ---- the other cars: orange lifeboats under the cables, each with a warm lamp ----
    const carBag = makeBag(), boat = hullGeometry({ L: 7.5, B: 2.6, D: 1.3, stations: 8, ring: 4, box: 2.6, rake: 0.3 });
    carBag.add(boat.side, trs(0, -4.4, 0), C.orange); carBag.add(boat.deck, trs(0, -4.75, 0), C.timber); boat.side.dispose(); boat.deck.dispose();
    for (const x of [-2.2, 2.2]) carBag.box(x, -1.6, 0, 0.09, 3.2, 0.09, C.tar);
    carBag.box(0, -0.1, 0, 4.6, 0.12, 0.12, C.tar); carBag.box(0, -3.25, 0, 7.3, 0.07, 2.5, C.orange.clone().multiplyScalar(0.8)); carBag.box(0, -3.9, 0, 1.2, 0.5, 1.6, C.cream);
    { const sg = new THREE.CylinderGeometry(0.28, 0.28, 0.08, 10); for (const x of [-1.6, 1.6]) carBag.add(sg, trs(x, 0.05, 0, Math.PI / 2, 0, 0), C.steel); sg.dispose(); }
    const carQ = ctx.core.makeRng(ctx.core.hashSeed('cars:' + ctx.seed)), carPh = 0.4 + 0.6 * carQ(), xq = frame(uX, 0, 0), sX0 = Math.hypot(xq[0] - xa[0], xq[2] - xa[2]) / Math.hypot(xb[0] - xa[0], xb[2] - xa[2]), crossPh = ((((0.9 * (uX - 40 / path.length) + 0.35 - sX0) / 0.4) % 1) + 1) % 1, NR = 9, CS = uM[2] / 6, NC = NR + 3;   // cars on the return line at one spacing (a sixth of the line apart, so about six ride it at a time; each comes out from under the terminal mast and leaves at the entry), three on the crossing line; the return line has a seeded phase (it leaves the 30 m round the entry point empty at the arrival, as every world must); the crossing line's phase is the brief's: one of its cars is over our cable when we are 40 m of route short of the crossing, on every seed
    const cars = new THREE.InstancedMesh(carBag.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide }), NC);
    const carLamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(7, 3.4, 1.1) }), NC);
    airMaterial(cars.material, hazeU); airMaterial(carLamps.material, hazeU); cars.frustumCulled = false; carLamps.frustumCulled = false; scene.add(cars, carLamps);
    const carGlows = fx.makeGlows({ rng: rng.fork('carlamps'), time: T, count: NC, area: [1, 1, 1], color: '#ffb866', size: 2.6, intensity: 2.4, flicker: 0.15, minAngle: 0.006, fogAmount: 0.45 });
    carGlows.object.frustumCulled = false; scene.add(carGlows.object);
    const XA = new THREE.Vector3(...xa), XB = new THREE.Vector3(...xb);
    await ctx.yield();

    // ---- fog you can see: whiteout rags round the car, white rivers in the channels, the bank over the sea, shafts at the tear ----
    const mistNear = fx.makeMist({ rng: rng.fork('m1'), time: T, count: 64, area: [190, 30, 190], center: [0, 30, 0], size: [20, 44], color: LK.mist, opacity: 0.2, drift: [-3.2, 0, 1], follow: true });
    await ctx.yield();
    const bank = fx.makeMist({ rng: rng.fork('m2'), time: T, count: 60, area: [230, 26, 940], center: [-335, 17, 160], size: [60, 110], color: col(LK.bank).multiplyScalar(night ? 1 : 1.35), opacity: 0.12, drift: [-0.5, 0, 0.25] });
    await ctx.yield();
    const rivers = fx.makeGroundFog({ time: T, layers: 5, size: 800, y: 0.4, height: 4.5, color: LK.bank, opacity: 0.2, coverage: 0.42, wind: [-1.3, 0.4], sunDir: sunArr, sunColor: LK.sunC });
    scene.add(mistNear.object, bank.object, rivers.object);
    const setOp = (s, v) => { if (s.setOpacity) s.setOpacity(v); else if (s.uniforms && s.uniforms.uOpacity) s.uniforms.uOpacity.value = v; };
    await ctx.yield();
    const rayAt = new THREE.Vector3(...frame(Math.min(0.95, uT0 + 0.1) + 70 / 773, -85, 0));          // across the middle distance, well left of the liner, where the tear opens
    const rays = fx.makeGodRays({ rng: rng.fork('rays'), time: T, count: 12, position: [rayAt.x + SUN.x * 110, rayAt.y + SUN.y * 110 + 10, rayAt.z + SUN.z * 110], direction: [-SUN.x, -SUN.y, -SUN.z], radius: 52, length: 240, width: [6, 20], color: LK.rays, intensity: 0, fogAmount: 0 });
    rays.object.frustumCulled = false; scene.add(rays.object);
    await ctx.yield();
    // kitchen smoke from the funnels, leaning west; steam from three tea stalls in the square
    const smokes = [], smk0 = col(LK.smoke[0]), smk1 = col(LK.smoke[1]), sma0 = col(LK.smokeAmb[0]), sma1 = col(LK.smokeAmb[1]);
    if (DV[2].fun) smokeNear.push(DV[2].fun);
    const smokePts = [...hero.anchors.funnelTops.map((v) => [v.x, v.y, v.z]), ...smokeAt.slice(0, 3), ...smokeNear, ...smokeAt.slice(3).filter((p) => { const d = path.nearestXZ(p[0], p[2]).dist; return d > 45 && d < 210; }).slice(0, 6)];
    for (let i = 0; i < smokePts.length; i++) {
      const big = i < 2, s = fx.makeSmokeColumn({ rng: rng.fork('smoke' + i), time: T, position: smokePts[i], height: big ? 46 : 30, radius: big ? [1.6, 9] : [0.6, 5.5], size: big ? [4, 18] : [2, 11], count: big ? 44 : 30,
        color: LK.smoke[0], colorTop: night ? '#6a7284' : '#d6d3cc', shadowColor: night ? '#20242e' : '#9c98a2', ambient: LK.smokeAmb[0], opacity: big || night ? 0.5 : 0.36, wind: [-1, 0, -0.3], bend: 0.7, sunDir: sunArr, sunColor: LK.sunC });
      scene.add(s.object); smokes.push(s); await ctx.yield();
    }
    for (let i = 0, k = 0; i < fleet.length && k < 3; i++) { const h = fleet[i]; if (!h.fun || h.kind === 'trawler' || h.kind === 'tug') continue; k++;   // the fleet's galleys (streams of their own)
      const sm = fx.makeSmokeColumn({ rng: ctx.core.makeRng(seedN * 613 + i * 17 + 5), time: T, position: h.fun, height: 30, radius: [0.6, 5.5], size: [2, 11], count: 30,
        color: LK.smoke[0], colorTop: night ? '#6a7284' : '#d6d3cc', shadowColor: night ? '#20242e' : '#9c98a2', ambient: LK.smokeAmb[0], opacity: night ? 0.5 : 0.36, wind: [-1, 0, -0.3], bend: 0.7, sunDir: sunArr, sunColor: LK.sunC });
      scene.add(sm.object); smokes.push(sm); await ctx.yield(); }
    if (crestHull && crestHull.fun) { const sm = fx.makeSmokeColumn({ rng: ctx.core.makeRng(ctx.core.hashSeed('crestsmoke:' + ctx.seed)), time: T, position: crestHull.fun, height: 30, radius: [0.6, 5.5], size: [2, 11], count: 30,
        color: LK.smoke[0], colorTop: night ? '#6a7284' : '#d6d3cc', shadowColor: night ? '#20242e' : '#9c98a2', ambient: LK.smokeAmb[0], opacity: night ? 0.5 : 0.36, wind: [-1, 0, -0.3], bend: 0.7, sunDir: sunArr, sunColor: LK.sunC });
      scene.add(sm.object); smokes.push(sm); await ctx.yield(); }
    const steams = [];
    for (let i = 0; i < Math.min(3, hero.anchors.stalls.length); i++) { const st = hero.anchors.stalls[i * 3 % hero.anchors.stalls.length];
      const s = fx.makeSmokeColumn({ rng: rng.fork('steam' + i), time: T, position: [st[0] + 0.6, 1.3, st[1]], height: 7, radius: [0.2, 1.5], size: [0.7, 2.8], count: 14, color: night ? '#8a94a8' : '#f2f0ea', colorTop: night ? '#a0aabc' : '#ffffff', shadowColor: night ? '#3a4254' : '#b8bcc8', ambient: night ? '#2a303c' : '#6a6a72', opacity: 0.42, wind: [-0.6, 0, -0.15], bend: 0.5, sunDir: sunArr, sunColor: LK.sunC });
      scene.add(s.object); steams.push(s); await ctx.yield(); }

    // ---- birds: gulls wheeling and escorting, a flock crossing at the tear, gulls lifting off the mud and crows off K1's rail in the fog, kites over the funnels, egrets in the channels ----
    await ctx.yield();
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    const dn = (n) => Math.max(4, Math.round(n * density)), stemK1 = K1.wpt(0.5 * K1.L, 0, 0), uStem = path.nearestXZ(stemK1[0], stemK1[2]).u;
    fauna.add(F.makeFlock({ rng, species: 'gulls', count: dn(34), center: [70, 74, 330], radius: 110, lod: 'low', size: 1.6, wander: [5, 2.5, 4, 0.35], maxSigma: 3 })); await ctx.yield();
    fauna.add(F.makeFlock({ rng, species: 'gulls', count: 14, lod: 'low', size: 1.6, spread: [14, 5, 14], wander: [2, 1.2, 2, 0.35], maxSigma: 3, along: { path, side: -4, up: 15, lead: 26, from: 0, to: 0.26, drift: 6 } })); await ctx.yield();
    fauna.add(F.makeFlock({ rng, species: 'gulls', count: 20, lod: 'low', size: 1.7, spread: [14, 5, 14], wander: [2, 1.2, 2, 0.35], maxSigma: 3, along: { path, side: -9, up: 23, lead: 38, from: uT0 + 0.01, to: uT0 + 0.3, drift: 10 } })); await ctx.yield();
    fauna.add(F.makeFlock({ rng, species: 'gulls', count: dn(10), lod: 'low', size: 1.5, spread: [14, 5, 14], wander: [2, 1.2, 2, 0.35], maxSigma: 3, cross: { path, u: uM[0], lead: 30, angle: 62, side: -1, height: -19, span: 150, rise: 17, duration } })); await ctx.yield();   // gulls lift off the mud and cross as we pass the first mast
    fauna.add(F.makeFlock({ rng, species: 'crows', count: dn(9), lod: 'low', size: 1.3, spread: [15, 5, 15], wander: [2, 1.2, 2, 0.4], maxSigma: 3, cross: { path, u: uStem, lead: 19, angle: 50, side: 1, height: 14, span: 120, rise: 10, duration } })); await ctx.yield();   // crows off the great bow's rail as we pass her stem
    fauna.add(F.makeFlock({ rng: rng.fork('revealgulls'), species: 'gulls', count: dn(20), lod: 'low', size: 1.7, spread: [14, 5, 14], wander: [2, 1.2, 2, 0.35], maxSigma: 3, cross: { path, u: path.nearestXZ(R3.x, R3.z).u, lead: 22, angle: 66, side: 1, height: -19, span: 170, rise: 9, duration } })); await ctx.yield();
    fauna.add(F.makeFlock({ rng, species: 'eagles', count: 5, center: [-12, 80, 0], size: 2.3, body: '#3a2a20', wingC: '#4a3626', belly: '#5a4030' })); await ctx.yield();
    fauna.add(F.makeFlock({ rng, species: 'crows', count: dn(12), center: [14, 37, 62], radius: 38, lod: 'low', wander: [4, 2, 4, 0.4], maxSigma: 3 })); await ctx.yield();
    { const er = rng.fork('egrets'), stork = f0 * 7 % 1 < 0.35, pos = [], pos2 = []; for (let i = 0; i < 9; i++) pos.push([20 + i * 12 + er() * 6, 0, 318 + 44 * Math.sin(i * 0.8) + er() * 10]);
      for (let i = 0; i < 5; i++) { const q = frame(0.13 + i * 0.03, (i % 2 ? 1 : -1) * (16 + er() * 12), 0); pos2.push([q[0], 0, q[2]]); }
      await ctx.yield();
      // the birds in the channels, then the ones along the fog leg: two short steps (the second is told which way to face, so the main stream gives exactly the draws it gave before)
      fauna.add(F.makeWaders({ rng, species: stork ? 'stork' : 'egret', positions: pos, level: 0.03, depth: 0.04, size: 1.25 })); await ctx.yield();
      fauna.add(F.makeWaders({ rng, species: stork ? 'stork' : 'egret', positions: pos2, facing: er() * 6.283, level: 0.03, depth: 0.04, size: 1.25 })); }
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: ctx.core.makeRng(seedN * 31337 + 77), species: 'gulls', count: 14, lod: 'low', size: 1.8, spread: [14, 5, 14], wander: [2, 1.2, 2, 0.35], maxSigma: 3, cross: { path, u: 0.47, lead: 34, angle: 66, side: -1, height: -14.5, span: 170, rise: 9, duration } }));   // the brief's flock of fourteen, crossing from the left as the fog tears
    await ctx.yield();

    // ---- specks: people walking the square, the cut and its galleries, the terraces, decks, gangways and mud streets; rickshaws
    // crossing the square; goats on decks; baskets rising and falling on their ropes; gulls standing on the mud ----
    const speckU = () => ({ ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uClear: hazeU, uTime: T, uOff: { value: new THREE.Vector3() }, uSun: mudU.uSun, uAmb: windMat.uniforms.uAmb, uSunCol: windMat.uniforms.uSunCol });
    const speckMat = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, uniforms: speckU(), vertexShader: SPECK_VERT, fragmentShader: SPECK_FRAG });
    const specks = (geo, list, mat = speckMat) => { const n = list.length, g = new THREE.InstancedBufferGeometry(), A = new Float32Array(n * 3), Bq = new Float32Array(n * 3), Cq = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { const [a, b, c, ph] = list[i]; A.set(a, i * 3); Bq.set(b, i * 3); Cq.set([c.r, c.g, c.b, ph], i * 4); }
      for (const k of ['position', 'normal', 'color', 'uv']) g.setAttribute(k, geo.attributes[k]); g.instanceCount = n;
      g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 3)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(Bq, 3)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(Cq, 4));
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; scene.add(m); return m; };
    const K = (part, tint) => [part, tint, part, tint], WH = col('#ffffff');
    const figG = (() => { const b = makeBag(), leg = new THREE.CylinderGeometry(0.08, 0.06, 0.86, 4, 1, true), tor = new THREE.CylinderGeometry(0.2, 0.16, 0.64, 6, 1, true), hd = new THREE.SphereGeometry(0.115, 6, 4), arm = new THREE.CylinderGeometry(0.05, 0.04, 0.56, 4, 1, true), ld = new THREE.CylinderGeometry(0.27, 0.2, 0.22, 5, 1);
      b.add(leg, trs(-0.09, 0.43, 0), col('#8a8a8a'), K(1, 1)); b.add(leg, trs(0.09, 0.43, 0), col('#8a8a8a'), K(2, 1)); b.add(tor, trs(0, 1.17, 0, 0, 0, 0, 1, 1, 0.62), WH, K(0, 1));
      b.add(arm, trs(-0.25, 1.15, 0, 0, 0, -0.14), C.skin, K(0, 0)); b.add(arm, trs(0.25, 1.15, 0, 0, 0, 0.14), C.skin, K(0, 0)); b.add(hd, trs(0, 1.61, 0), C.skin, K(0, 0)); b.add(ld, trs(0, 1.84, 0), C.straw, K(3, 0));
      for (const g of [leg, tor, hd, arm, ld]) g.dispose(); return b.build(); })();
    await ctx.yield();
    const rickG = (() => { const b = makeBag(), wh = new THREE.CylinderGeometry(0.36, 0.36, 0.05, 9), hood = new THREE.CylinderGeometry(0.62, 0.62, 1.05, 7, 1, true, -Math.PI / 2, Math.PI), tor = new THREE.CylinderGeometry(0.2, 0.16, 0.6, 5, 1), hd = new THREE.SphereGeometry(0.115, 5, 3);
      for (const [x, z] of [[0, 1.05], [-0.5, -0.5], [0.5, -0.5]]) b.add(wh, trs(x, 0.36, z, 0, 0, Math.PI / 2), col('#2a2a2c'), K(0, 0));
      b.box(0, 0.5, 0.2, 0.08, 0.08, 1.9, col('#3a3a3c')); b.add(BOXG, trs(0, 0.66, -0.5, 0, 0, 0, 1.0, 0.24, 0.72), WH, K(0, 1)); b.add(hood, trs(0, 1.0, -0.62, 0, 0, Math.PI / 2), WH, K(0, 1));
      b.add(tor, trs(0, 1.1, 0.42, 0.25, 0, 0, 1, 1, 0.62), col('#d8d4c8'), K(0, 0)); b.add(hd, trs(0, 1.5, 0.52), C.skin, K(0, 0)); b.box(0, 0.98, 0.95, 0.5, 0.05, 0.05, col('#3a3a3c'));
      for (const g of [wh, hood, tor, hd]) g.dispose(); return b.build(); })();
    await ctx.yield();
    const goatG = (() => { const b = makeBag(); b.add(BOXG, trs(0, 0.5, 0, 0, 0, 0, 0.26, 0.32, 0.7), WH, K(0, 1)); b.add(BOXG, trs(0, 0.72, 0.42, 0.5, 0, 0, 0.16, 0.18, 0.3), WH, K(0, 1));
      for (const [x, z] of [[-0.09, 0.26], [0.09, 0.26], [-0.09, -0.26], [0.09, -0.26]]) b.add(BOXG, trs(x, 0.18, z, 0, 0, 0, 0.07, 0.36, 0.07), col('#6a6a6a'), K(0, 1)); return b.build(); })();
    const basketG = (() => { const b = makeBag(), cy = new THREE.CylinderGeometry(0.42, 0.3, 0.42, 8, 1), hp = new THREE.SphereGeometry(0.36, 6, 3); b.add(cy, trs(0, 0.21, 0), C.straw, K(0, 0)); b.add(hp, trs(0, 0.42, 0, 0, 0, 0, 1, 0.55, 1), WH, K(0, 1));
      b.add(BOXG, trs(0, 0.75, 0, 0, 0, 0, 0.03, 0.7, 0.03), C.rope, K(0, 0)); cy.dispose(); hp.dispose(); return b.build(); })();
    const gullG = (() => { const b = makeBag(), sp = new THREE.SphereGeometry(1, 6, 4); b.add(sp, trs(0, 0.24, 0, -0.25, 0, 0, 0.11, 0.1, 0.24), col('#e8e6e0'), K(0, 0)); b.add(sp, trs(0, 0.27, -0.05, -0.3, 0, 0, 0.115, 0.06, 0.25), col('#8f959c'), K(0, 0));
      b.add(sp, trs(0, 0.38, 0.17, 0, 0, 0, 0.055, 0.055, 0.065), col('#5a4638'), K(0, 0)); b.add(BOXG, trs(0, 0.07, 0.02, 0, 0, 0, 0.012, 0.14, 0.012), C.orange, K(0, 0)); sp.dispose(); return b.build(); })();
    await ctx.yield();
    const pr = rng.fork('people'), NP = Math.round(380 * Math.min(1.12, density) * detail), plist = [], archX = (y) => (y <= 8 ? 8 : Math.sqrt(Math.max(0, 64 - (y - 8) * (y - 8))));
    const tone = () => { const c = pr() < 0.3 ? col('#d8d4c8') : cloth[(pr() * cloth.length) | 0]; return new THREE.Color(c.r * 0.62 + 0.05, c.g * 0.62 + 0.045, c.b * 0.62 + 0.04); };
    for (let i = 0; i < NP; i++) {
      const k = i / NP; let a, b;
      if (k < 0.17) { a = [(pr() - 0.5) * 66, 0.1, 19 + pr() * 47]; b = [(pr() - 0.5) * 66, 0.1, 19 + pr() * 47]; if (a[0] * b[0] < 0 || Math.abs(a[0]) < 3.2 || Math.abs(b[0]) < 3.2) { const sg = a[0] < 0 ? -1 : 1; a[0] = sg * (3.2 + Math.abs(a[0])); b[0] = sg * (3.2 + Math.abs(b[0]) * 0.9); } }
      else if (k < 0.22) { const sg = pr() < 0.5 ? 1 : -1; a = [sg * (3.2 + pr() * 3.6), 0.13, -19]; b = [sg * (3.2 + pr() * 3.6), 0.13, 24]; }
      else if (k < 0.29) { const lv = 1 + ((pr() * 4) | 0), sg = pr() < 0.5 ? 1 : -1, x = sg * (archX(lv * 3.2) + 0.8 + pr() * 2.6); a = [x, lv * 3.2 + 0.02, -15 + pr() * 12]; b = [x, lv * 3.2 + 0.02, 3 + pr() * 12]; }
      else if (k < 0.5) { const e = (pr() * 3) | 0, y = 24.1 + e * 3.5, z = (pr() < 0.75 ? 1 : -1) * ([13, 9, 5.5][e] + 0.8 + pr() * 2), x = (pr() - 0.5) * 170; a = [x, y, z]; b = [x + (pr() - 0.5) * 40, y, z]; }
      else if (k < 0.62 && deckWalk.length) { const w = deckWalk[(pr() * deckWalk.length) | 0], t0 = pr() * 0.4, t1 = 0.6 + pr() * 0.4; a = [lerp(w[0][0], w[1][0], t0), lerp(w[0][1], w[1][1], t0) + 0.06, lerp(w[0][2], w[1][2], t0)]; b = [lerp(w[0][0], w[1][0], t1), lerp(w[0][1], w[1][1], t1) + 0.06, lerp(w[0][2], w[1][2], t1)]; }
      else { let x = 0, z = 0; for (let q = 0; q < 6; q++) { z = 112 + pr() * 600; x = lerp(60, 110, pr()) + (pr() - 0.5) * 150; if (!inHull0(x, z, 2)) break; }
        a = [x, 0.05, z]; b = [x + (pr() - 0.5) * 50, 0.05, z + (pr() - 0.5) * 24]; if (inHull0(b[0], b[2], 2)) b = [x + (pr() - 0.5) * 8, 0.05, z + (pr() - 0.5) * 8]; }
      const tc = tone(), tp = pr(); if (!(a[1] === 0.05 && nOld < hulls.length && (inHull(a[0], a[2], 2) || inHull(b[0], b[2], 2)))) (path.distanceTo(a[0], a[1], a[2]) > 30 && path.distanceTo(b[0], b[1], b[2]) > 30 ? avCrowd : plist).push([a, b, tc, tp]); if (i % 16 === 15) await ctx.yield();   // (a walker who never comes within 30 m of the cable is the lighter figure)
    }
    { const tn = () => { const c = cloth[(dq() * cloth.length) | 0]; return new THREE.Color(c.r * 0.62 + 0.05, c.g * 0.62 + 0.045, c.b * 0.62 + 0.04); };   // the roofs and duckboards near the cable have their own people
      for (const [a, b, n, nw] of roofWalk) for (let k = 0; k < (nw ? 0 : n); k++) { const t0 = dq() * 0.3, t1 = 0.7 + dq() * 0.3; plist.push([[lerp(a[0], b[0], t0), lerp(a[1], b[1], t0), lerp(a[2], b[2], t0)], [lerp(a[0], b[0], t1), lerp(a[1], b[1], t1), lerp(a[2], b[2], t1)], tn(), dq()]); }
      for (const p of roofStand) plist.push([p, [p[0] + 0.01, p[1], p[2]], tn(), dq()]);
      for (let i = 0; i + 1 < boardWalk.length; i += 2) { const a = boardWalk[i][0], b = boardWalk[i + 1][1]; if (Math.hypot(b[0] - a[0], b[2] - a[2]) < 26) plist.push([a, b, tn(), dq()]); } }
    await ctx.yield(); specks(figG, plist); await ctx.yield();
    { const tq = () => { const c = cloth[(nq() * cloth.length) | 0]; return new THREE.Color(c.r * 0.62 + 0.05, c.g * 0.62 + 0.045, c.b * 0.62 + 0.04); };   // the fleet's roofs and the market: a lighter figure (they are never nearer than 20 m), in one draw
      for (const [a, b, n, nw] of roofWalk) if (nw) for (let k = 0; k < 2; k++) { const t0 = nq() * 0.3, t1 = 0.7 + nq() * 0.3; avCrowd.push([[lerp(a[0], b[0], t0), lerp(a[1], b[1], t0), lerp(a[2], b[2], t0)], [lerp(a[0], b[0], t1), lerp(a[1], b[1], t1), lerp(a[2], b[2], t1)], tq(), nq()]); }
      const b = makeBag(), leg = new THREE.CylinderGeometry(0.085, 0.065, 0.86, 3, 1, true), tor = new THREE.CylinderGeometry(0.21, 0.17, 0.66, 4, 1, true), hd = new THREE.OctahedronGeometry(0.13), ld = new THREE.CylinderGeometry(0.27, 0.2, 0.22, 4, 1, true);
      b.add(leg, trs(-0.09, 0.43, 0), col('#8a8a8a'), K(1, 1)); b.add(leg, trs(0.09, 0.43, 0), col('#8a8a8a'), K(2, 1)); b.add(tor, trs(0, 1.18, 0, 0, 0.78, 0, 1, 1, 0.66), WH, K(0, 1)); b.add(hd, trs(0, 1.62, 0), C.skin, K(0, 0)); b.add(ld, trs(0, 1.84, 0), C.straw, K(3, 0));
      for (const g of [leg, tor, hd, ld]) g.dispose(); if (avCrowd.length) specks(b.build(), avCrowd); }
    await ctx.yield();
    { const l = []; for (let i = 0; i < 6; i++) { const z = 28 + i * 6.2 + pr() * 3, d = i % 2 ? 1 : -1; l.push([[-33 * d, 0.1, z], [33 * d, 0.1, z + (pr() - 0.5) * 8], bright[i % bright.length], pr()]); }
      if ((f0 * 13) % 1 < 0.5) specks(rickG, l);
      else { rickG.dispose(); const b = makeBag(), wh = new THREE.CylinderGeometry(0.58, 0.58, 0.08, 10), dark = col('#2a2624');                // buffalo carts instead: a plank bed on two big wheels, the load in its own colour, a dark buffalo in the shafts
        for (const x of [-0.78, 0.78]) b.add(wh, trs(x, 0.58, -0.9, 0, 0, Math.PI / 2), col('#4a3a2c'), K(0, 0)); wh.dispose();
        b.add(BOXG, trs(0, 0.9, -0.9, 0, 0, 0, 1.36, 0.14, 2.3), C.timber, K(0, 0)); b.add(BOXG, trs(0, 1.27, -0.95, 0, 0, 0, 1.2, 0.6, 1.9), WH, K(0, 1));
        for (const x of [-0.45, 0.45]) b.add(BOXG, trs(x, 0.88, 1.1, 0, 0, 0, 0.07, 0.07, 2.2), C.timber, K(0, 0));
        b.add(BOXG, trs(0, 0.98, 1.75, 0, 0, 0, 0.66, 0.78, 1.55), dark, K(0, 0)); b.add(BOXG, trs(0, 1.12, 2.72, 0.35, 0, 0, 0.36, 0.38, 0.62), dark, K(0, 0)); b.add(BOXG, trs(0, 1.4, 2.56, 0, 0, 0, 0.95, 0.07, 0.08), col('#8a8478'), K(0, 0));
        for (const [x, z] of [[-0.22, 1.2], [0.22, 1.2], [-0.22, 2.3], [0.22, 2.3]]) b.add(BOXG, trs(x, 0.3, z, 0, 0, 0, 0.13, 0.6, 0.13), dark, K(0, 0));
        b.add(BOXG, trs(0, 1.75, -0.2, 0, 0, 0, 0.36, 0.6, 0.24), col('#d8d4c8'), K(0, 0)); b.add(BOXG, trs(0, 2.16, -0.2, 0, 0, 0, 0.2, 0.2, 0.2), C.skin, K(0, 0));
        for (const e of l) { e[0][0] *= 0.55; e[1][0] *= 0.55; } specks(b.build(), l); } }
    if (goats.length) { const gl = goats.map((g, i) => [g[0], g[1], i % 3 ? col('#d8d0c0') : col('#5a4a3c'), pr()]); if (dogWalk) gl.push([[dogWalk[0][0], dogWalk[0][1] + 0.08, dogWalk[0][2]], [dogWalk[1][0], dogWalk[1][1] + 0.08, dogWalk[1][2]], col('#c08a4a'), 0.37]); specks(goatG, gl); }   // (and the dog, trotting a gangway)
    if (flatBoats.length) specks(flatBoatG, flatBoats);                           // the punts and the hauled boat of the lower flat
    if (baskets.length) specks(basketG, baskets.map((g, i) => [g[0], g[1], [C.marigold, C.yellow, C.leaf2, C.orange][i % 4], pr()]));
    { const l = []; for (let i = 0; i < 34; i++) { const u = 0.02 + pr() * 0.6, q = frame(u, (pr() < 0.5 ? 1 : -1) * (14 + pr() * 60), 0); if (inHull(q[0], q[2], 3)) continue; const p = [q[0], 0.02, q[2]]; l.push([p, p, WH, pr()]); if (pr() < 0.6) { const p2 = [p[0] + 1 + pr() * 2, 0.02, p[2] + pr() * 2]; l.push([p2, p2, WH, pr()]); } }
      specks(gullG, l); }
    await ctx.yield();

    // ---- the welder on K3's hatch: an eased arc, falling sparks, one point light ----
    const WP = new THREE.Vector3(...K3.wpt(22, K3.D + 1.85, -3.4));
    const arc = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(8, 10, 15), fog: false })); arc.position.copy(WP); scene.add(arc);
    const weldLight = new THREE.PointLight('#bcd4ff', 0, 46, 2); weldLight.position.copy(WP); weldLight.position.y += 2.4; scene.add(weldLight);
    const sparks = fx.makeParticles({ rng: rng.fork('sparks'), preset: 'sparks', time: T, count: 200, box: [7, 7, 7], follow: false, center: [WP.x, WP.y - 1.5, WP.z], velocity: [-1.2, -3.5, 0.6] });
    scene.add(sparks.object);
    await ctx.yield();

    // ---- far layer: low blue hills inland and to the north ----
    { const p = [], hn = rng.fork('hills'); let h0 = 60;
      const N = 96, ring = []; for (let i = 0; i <= N; i++) { const a = lerp(-2.6, 2.6, i / N); h0 = lerp(h0, 40 + hn() * 110, 0.35); ring.push([Math.cos(a) * 1900, h0 * Math.sin(Math.PI * i / N) ** 0.5, 300 - Math.sin(a) * 1900]); }
      for (let i = 0; i < N; i++) { const a = ring[i], b = ring[i + 1]; p.push(a[0], -5, a[2], b[0], -5, b[2], a[0], a[1], a[2], b[0], -5, b[2], b[0], b[1], b[2], a[0], a[1], a[2]); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      var hills = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col(LK.hills), transparent: true, opacity: 0, fog: false, depthWrite: false, side: THREE.DoubleSide })); hills.frustumCulled = false; hills.renderOrder = -0.3; scene.add(hills); }

    // ---- the rare arrival: a white ferry dressed stem to stern in bunting, hauled up the flat on twenty cables by a crowd,
    // its funnel smoking for the last time and marigold petals in the air ----
    const arrival = new THREE.Group(); arrival.visible = rare; scene.add(arrival);
    let arrSmoke = null, arrMat = null, petals = null; const AX0 = -110, AZ = 185;   // (her berth lies wholly to the left of the cable's run: the flight passes over the hauling gang and its cables, never over her decks)
    if (rare) { const PETC = frame(0.55, -40, 0), g = hullGeometry({ L: 120, B: 20, D: 10, sheer: 0.06, stations: 18, ring: 6, rake: 0.5, uv: [0, 0.506, 1, 0.744] }), pb = makeBag(), qb = makeBag(), wb = makeWindBag(), rb = makeRibbonBag(), I = new THREE.Matrix4();
      pb.add(g.side, I, col('#ffffff'), true); qb.add(g.deck, I, C.deck); g.side.dispose(); g.deck.dispose();
      qb.box(-4, 11.6, 0, 76, 3.2, 17, C.white); qb.box(-4, 13.3, 0, 77, 0.14, 18, C.pale); qb.box(-6, 14.8, 0, 60, 2.8, 14, C.white); qb.box(-6, 16.3, 0, 61, 0.14, 15, C.pale); qb.box(16, 17.7, 0, 12, 2.6, 10, C.white);
      for (let i = 0; i < 30; i++) for (const sg of [1, -1]) { qb.box(-40 + i * 2.5, 12, sg * 8.55, 1.2, 1.1, 0.06, GLS); if (i < 23) qb.box(-34 + i * 2.5, 15, sg * 7.05, 1.2, 1, 0.06, GLS); }
      { const fg = new THREE.CylinderGeometry(0.5, 0.56, 1, 12, 1, true); qb.add(fg, trs(-24, 19.6, 0, 0, 0, 0.14, 3.2, 7, 2.4), C.orange); qb.add(fg, trs(-24.6, 22.6, 0, 0, 0, 0.14, 3.4, 1.1, 2.56), CAP); fg.dispose(); }
      for (let i = 0; i < 6; i++) qb.box(-52 + i * 20, -0.2, 0, 1.2, 0.5, 30, C.timber);                                       // the greased ways
      await ctx.yield();
      const dress = [sagLine([62, 11.4, 0], [16, 27, 0], 1, 10), sagLine([16, 27, 0], [-24, 25, 0], 1.4, 8), sagLine([-24, 25, 0], [-60, 10.6, 0], 1, 8)];
      qb.box(16, 23, 0, 0.3, 8, 0.3, C.pale); for (let i = 0; i < 3; i++) { rb.add(dress[i], 0.02, C.rope); addBunting(wb, dress[i], cloth, 1.7, 2.2, i * 3); }
      for (const sg of [1, -1]) { const e = []; for (let i = 0; i <= 12; i++) { const d = deckEdge({ L: 120, B: 20, D: 10, sheer: 0.06, rake: 0.5 }, -0.5 + i / 12); e.push([d[0], d[1] + 1 - 0.5 * Math.abs(Math.sin(i * 1.57)), sg * (d[2] + 0.1)]); } rb.add(e, 0.07, C.marigold); addBunting(wb, e, cloth, 1.4, 1.3, sg); addBunting(wb, e.map((p) => [p[0] + 0.7, p[1] + 2.2, p[2] * 0.9]), bright, 1.6, 1.5, sg + 4); }
      const crowd = [];
      // her upper works: planked roofs behind pipe rails, a rounded bridge, boats on the boat deck, a striped awning aft, marigold boxes, and everyone aboard at the rail
      qb.box(-4, 13.4, 0, 75.4, 0.06, 16.4, C.plank); qb.box(-6, 16.4, 0, 59.4, 0.06, 13.4, C.plank); qb.box(16, 19.05, 0, 12.6, 0.12, 10.8, C.pale);
      qb.add(HALF, trs(22, 17.7, 0, 0, 0, 0, 5.6, 2.6, 10), C.white); qb.add(HALF, trs(22, 18.1, 0, 0, 0, 0, 5.7, 0.9, 10.1), GLS); qb.add(HALF, trs(22, 19.05, 0, 0, 0, 0, 6.3, 0.12, 10.8), C.pale);
      for (const [x0, x1, hz, ry] of [[-42.5, 34.5, 9, 13.4], [-36.5, 24.5, 7.5, 16.4]]) for (const sg of [1, -1]) {
        rb.add([[x0, ry + 1, sg * hz], [x1, ry + 1, sg * hz]], 0.035, C.pale); rb.add([[x0, ry + 0.5, sg * hz], [x1, ry + 0.5, sg * hz]], 0.02, C.pale);
        for (let x = x0; x <= x1; x += 3.5) rb.add([[x, ry, sg * hz], [x, ry + 1, sg * hz]], 0.022, C.pale);
        rb.add([[sg > 0 ? x0 : x1, ry + 1, -hz], [sg > 0 ? x0 : x1, ry + 1, hz]], 0.035, C.pale); }
      for (let i = 0; i < 4; i++) for (const sg of [1, -1]) { qb.add(BOATG, trs(-33 + i * 15, 14.25, sg * 8.15, 0, 0, 0, 0.85, 0.85, 0.85), i % 2 ? C.orange : C.white);
        for (const dx of [-2.2, 2.2]) qb.box(-33 + i * 15 + dx, 14.5, sg * 7.5, 0.1, 2.2, 0.1, C.pale, 0, 0, 0); }
      for (let i = 0; i < 7; i++) { const sx = -34 + i * 2; wb.sheet([sx, 19.3, -6], [2, 0, 0], [0, 0.25, 12], 1, 4, i % 2 ? col('#e8e4da') : C.orange, 0.12, i * 0.4); }
      for (const [px, pz] of [[-34, -6], [-34, 6], [-20, -6], [-20, 6]]) qb.box(px, 17.9, pz, 0.12, 3, 0.12, C.pale);
      for (let i = 0; i < 9; i++) qb.box(-14 + i * 4.2, 16.72, (i % 2 ? 1 : -1) * 4.4, 2.6, 0.5, 0.7, i % 3 ? C.marigold : C.leaf);
      { const od = { L: 120, B: 20, D: 10, sheer: 0.06, rake: 0.5 };
        for (let i = 0; i < 64; i++) { let x, y, z; const r = pr(), sg = pr() < 0.5 ? 1 : -1;
          if (i < 30) { x = lerp(-40, 32, r); y = 13.03; z = sg * lerp(7.6, 8.6, pr()); }
          else if (i < 44) { x = lerp(-18, 22, r); y = 16.03; z = sg * lerp(1, 6.6, pr()); }
          else { const e = deckEdge(od, lerp(0.33, 0.47, r)); x = e[0]; y = e[1] - 0.45; z = sg * e[2] * lerp(0.1, 0.8, pr()); }
          crowd.push([[AX0 + x, y, AZ + z], [AX0 + x + 0.01, y, AZ + z], tone(), pr()]); } }
      await ctx.yield();
      for (let i = 0; i < 20; i++) { const sg = i % 2 ? 1 : -1, z = sg * (2 + (i >> 1) * 2.6), x1 = 122 + (i % 5) * 4 + (i >> 1) * 1.2; rb.add(sagLine([61, 9.5, sg * 1.2], [x1, 1.1, z], 2.1, 10), 0.03, HAWS.clone().multiplyScalar(0.8));
        for (let q = 0; q < 6; q++) { const t = 0.5 + q * 0.09, p = [AX0 + lerp(61, x1, t), 0.05, AZ + lerp(sg * 1.2, z, t)]; crowd.push([p, [p[0] + 0.01, 0.05, p[2]], tone().multiplyScalar(1.5), pr()]); } }
      await ctx.yield();
      arrival.add(new THREE.Mesh(pb.build(), paintedMat), new THREE.Mesh(qb.build(), plainMat), new THREE.Mesh(wb.build(), windMat), new THREE.Mesh(rb.build(), ribMat));
      for (const m of arrival.children) m.frustumCulled = false; arrival.position.set(AX0, -0.4, AZ);
      arrMat = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, uniforms: speckU(), vertexShader: SPECK_VERT, fragmentShader: SPECK_FRAG }); specks(figG, crowd, arrMat);
      arrSmoke = fx.makeSmokeColumn({ rng: rng.fork('arrsmoke'), time: T, position: [AX0 - 25, 22.5, AZ], height: 34, radius: [1, 7], size: [3, 13], count: 36, color: LK.smoke[1], colorTop: night ? '#6a7284' : '#d6d3cc', shadowColor: night ? '#20242e' : '#5c5862', ambient: LK.smokeAmb[1], opacity: 0.6, wind: [-1, 0, -0.3], bend: 0.7, sunDir: sunArr, sunColor: LK.sunC });
      scene.add(arrSmoke.object);
      petals = fx.makeParticles({ rng: rng.fork('petals'), preset: 'petals', time: T, count: 1400, follow: false, center: [PETC[0], 20, PETC[2]], box: [230, 36, 150], colors: ['#f0901c', '#f6b23a', '#e8701a'], size: [0.25, 0.6], velocity: [-0.8, -0.6, 0.2] });
      scene.add(petals.object); }
    await ctx.yield();

    // ---- our car, for the whole flight: the forward rim of the open orange lifeboat we sit in, low across the bottom of the frame (chipped
    // gunwale, cream cap rail, the planked inside of the bow, a looped grab line, a marigold garland over the stem and along the port bow, a
    // tin lamp on the port bow), two hanger tubes rising outward from the bow quarters, across the bottom corners of the picture and out of it,
    // to the spreader and the sheaves overhead, which ride the cable above and behind the eye and are never in the picture; the cable
    // itself runs ahead of us to the next mast. The boat hangs under the cable, so its bow keeps to the cable's heading while the gaze
    // wanders (within a few degrees). ----
    const veh = new THREE.Group(); veh.matrixAutoUpdate = false; veh.visible = false; scene.add(veh);   // (our own boat is NOT drawn: the live version keeps its bow below the frame for the whole flight, and blind against it the rim across the bottom of every view lost; its shadow on the mud stays)
    const carShade = new THREE.Group(); carShade.matrixAutoUpdate = false; scene.add(carShade);
    const I4 = new THREE.Matrix4();
    { const vb = makeBag(), rb = makeRibbonBag(), vq = rng.fork('veh'), orange = col(PAL.orange).multiplyScalar(0.92), gold = col('#f0981c'), V = (q) => new THREE.Vector3(q[0], q[1], q[2]), GY = 0.12;
      const gw = new THREE.CatmullRomCurve3([[-1.75, -1.5, 0.9], [-1.6, -1.49, -0.5], [-1.4, -1.47, -1.42], [-0.86, -1.45, -2.12], [0, -1.44, -2.46], [0.86, -1.45, -2.12], [1.4, -1.47, -1.42], [1.6, -1.49, -0.5], [1.75, -1.5, 0.9]].map((q) => V([q[0], q[1] + GY, q[2]])));
      await ctx.yield();
      const tube = new THREE.TubeGeometry(gw, 40, 0.06, 8), tp = tube.attributes.position, tc = [];
      await ctx.yield();
      for (let i = 0; i < tp.count; i++) { const n = ctx.noise.n3(tp.getX(i) * 9, tp.getY(i) * 9, tp.getZ(i) * 9), k = n > 0.42 ? 0.55 : 0.88 + 0.2 * n; tc.push(k, n > 0.42 ? k * 0.8 : k, n > 0.42 ? k * 0.75 : k); }   // chipped paint
      await ctx.yield();
      tube.setAttribute('color', new THREE.Float32BufferAttribute(tc, 3)); vb.add(tube, I4, orange); tube.dispose();
      await ctx.yield();
      const sp = [], NS = 30, q = new THREE.Vector3(), o = [], gl = [];
      for (let i = 0; i <= NS; i++) { gw.getPoint(i / NS, q); const lp = Math.abs(Math.sin(i * Math.PI / 3)); o.push([q.x, q.y - 0.03, q.z, q.x * 0.5, -2.3 + GY, q.z * 0.8 + 0.15]); gl.push([q.x * (1.03 + 0.11 * lp), q.y + 0.02 - 0.04 * lp, q.z * (1.03 + 0.11 * lp) - 0.02]); }
      for (let i = 0; i < NS; i++) { const a = o[i], b = o[i + 1]; sp.push(a[0], a[1], a[2], a[3], a[4], a[5], b[0], b[1], b[2], a[3], a[4], a[5], b[3], b[4], b[5], b[0], b[1], b[2]); }
      const sg = new THREE.BufferGeometry(), sc = []; for (let i = 0; i < NS; i++) { const k = i % 2 ? 0.86 : 1; for (let j = 0; j < 6; j++) sc.push(k, k, k); }                    // the inside of the bow, plank by plank
      sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3)); sg.computeVertexNormals(); vb.add(sg, I4, col('#c9552a')); sg.dispose();
      await ctx.yield();
      rb.add(gl, 0.012, C.cream);                                                                                           // the looped grab line, becketed to the gunwale every third of a metre
      const post = new THREE.CylinderGeometry(0.02, 0.028, 0.09, 6); vb.add(post, trs(0, -1.39 + GY, -2.43), col('#3c3c40')); post.dispose();
      { const cap = []; for (let i = 6; i <= NS - 6; i++) { gw.getPoint(i / NS, q); cap.push([q.x * 0.955, q.y + 0.05, q.z * 0.955]); } rb.add(cap, 0.014, C.cream);                // a cream cap rail inside the gunwale, the breasthook at the stem
        const hk = new THREE.BufferGeometry(); hk.setAttribute('position', new THREE.Float32BufferAttribute([0, -1.432 + GY, -2.42, -0.34, -1.44 + GY, -2.14, 0.34, -1.44 + GY, -2.14], 3)); hk.computeVertexNormals(); vb.add(hk, I4, col('#b84a22')); hk.dispose(); }
      await ctx.yield();
      const mg = new THREE.SphereGeometry(0.02, 5, 3);                                                                     // a marigold garland looped over the stem, and swagged along the inside of the port bow
      for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832; vb.add(mg, trs(0.2 * Math.sin(a), -1.4 + GY - 0.05 * Math.cos(a) - 0.05 * Math.abs(Math.sin(a)), -2.37 + 0.11 * Math.cos(a), 0, 0, 0, 1 + 0.3 * vq(), 1, 1), i % 4 === 3 ? col('#f6c23a') : gold); }
      for (let i = 0; i <= 20; i++) { gw.getPoint(0.47 - i * 0.0085, q); vb.add(mg, trs(q.x * 0.93, q.y - 0.07 - 0.1 * Math.abs(Math.sin(i * Math.PI / 10)), q.z * 0.93, 0, 0, 0, 1.25, 1.25, 1.25), i % 4 === 1 ? col('#f6c23a') : gold); } mg.dispose();
      const tin = col('#7d8388'), LX = -0.5, LZ = -2.22, LY = -1.44 + GY;                                                    // the tin lamp on its bracket, port bow
      vb.box(LX, LY + 0.1, LZ, 0.018, 0.2, 0.018, col('#4a4e52')); vb.box(LX, LY + 0.2, LZ, 0.09, 0.012, 0.09, tin); vb.box(LX, LY + 0.315, LZ, 0.1, 0.014, 0.1, tin); vb.box(LX, LY + 0.345, LZ, 0.04, 0.05, 0.04, col('#4a4e52'));
      for (const [dx, dz] of [[-0.04, -0.04], [0.04, -0.04], [-0.04, 0.04], [0.04, 0.04]]) vb.box(LX + dx, LY + 0.257, LZ + dz, 0.008, 0.1, 0.008, tin);
      await ctx.yield();
      // the hangers: a tube from each gunwale leaning outward to the spreader overhead, a shackle at the foot, marigolds wound round the port one
      const hg = new THREE.CylinderGeometry(0.018, 0.018, 1, 7, 1, true), hang = [], hcol = col(PAL.orange).multiplyScalar(0.78);
      for (const s of [-1, 1]) { const a = [s * 1.26, -1.46 + GY, -1.6], b = [s * 3.0, 0.7, -1.3]; hang.push([a, b]); vS.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const l = vS.length(); qB.setFromUnitVectors(v3.set(0, 1, 0), vS.divideScalar(l));
        mL.compose(v3.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), qB, vS.set(1, l, 1)); vb.add(hg, mL, hcol); vb.box(a[0], a[1] + 0.03, a[2], 0.11, 0.09, 0.11, col('#3a3c40')); }
      hg.dispose();
      { const mg2 = new THREE.SphereGeometry(0.022, 5, 3), [a, b] = hang[0]; for (let i = 0; i < 22; i++) { const t = 0.08 + i * 0.016, an = i * 1.3; vb.add(mg2, trs(lerp(a[0], b[0], t) + 0.038 * Math.cos(an), lerp(a[1], b[1], t), lerp(a[2], b[2], t) + 0.038 * Math.sin(an)), i % 3 === 1 ? col('#f6c23a') : gold); } mg2.dispose(); }
      await ctx.yield();
      const vmat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, side: THREE.DoubleSide });
      const vm = new THREE.Mesh(vb.build(), vmat); vm.frustumCulled = false; veh.add(vm);
      const vrm = new THREE.Mesh(rb.build(), ribMat); vrm.frustumCulled = false; veh.add(vrm);
      await ctx.yield();
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(4.5, 2.4, 0.8), fog: false })); lamp.position.set(LX, LY + 0.255, LZ); lamp.frustumCulled = false; veh.add(lamp);
      // the whole car again, unseen, for the sun: its shadow falls through the shadow map on whatever passes close below and beside (decks, roofs, flanks)
      const cg = hullGeometry({ L: 7.5, B: 2.6, D: 1.3, stations: 6, ring: 3, box: 2.6, rake: 0.3 }), cbag = makeBag(); cbag.add(cg.side, trs(0, -2.55, 0), orange); cbag.add(cg.deck, trs(0, -2.5, 0), orange); cg.side.dispose(); cg.deck.dispose();
      for (const x of [-2.2, 2.2]) cbag.box(x, 0.1, 0, 0.12, 3.6, 0.12, orange); cbag.box(0, 1.9, 0, 4.6, 0.14, 0.14, orange);
      const caster = new THREE.Mesh(cbag.build(), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })); caster.castShadow = true; caster.frustumCulled = false; carShade.add(caster); }
    await ctx.yield();
    await skyA.prewarm(ctx.renderer, null, scene); await ctx.yield(); await skyB.prewarm(ctx.renderer, null, scene); await ctx.yield();

    const sunC = col(LK.sunC), shC = col(LK.shadow).multiplyScalar(0.34), zen = col(LK.mudZ || LK.zen), hor = col(LK.mudH || LK.hor), cA = new THREE.Color();
    const mV = new THREE.Matrix4(), mS = new THREE.Matrix4(), sV = new THREE.Vector3(), cp = new THREE.Vector3(), dummy = new THREE.Object3D();
    const yawX = Math.atan2(-(XB.z - XA.z), XB.x - XA.x), FD0 = 0.0047, L0 = Math.log(FD0), L1 = Math.log(0.0011), COT = shl / Math.max(SUN.y, 0.1);
    const hide = () => { dummy.position.set(0, -500, 0); dummy.scale.setScalar(1e-4); dummy.updateMatrix(); };
    const wU = windMat.uniforms, waU = waterMat.uniforms;
    function update(dt, time, camera, u) {
      T.value = time;
      const tear = sstep(uT0, uT1, u);
      // a soft veil behind the near hulls through the opening third (about 250 m of sight), thickening a little toward the tear so the liner stays hidden until it opens
      scene.fog.density = u < uT0 ? lerp(lerp(0.0031, 0.0037, sstep(0, 0.12, u)), FD0, sstep(0.22, uT0, u)) : u < uT1 ? Math.exp(lerp(L0, L1, Math.min(1, tear * 1.4))) : lerp(0.0011, 0.0008, sstep(uT1, uT1 + 0.08, u));
      scene.fog.color.copy(pearl).lerp(haze, tear);
      skyB.setOpacity(tear); skyA.update(dt, time, camera); skyB.update(dt, time, camera); rig.update(dt, time, camera);
      rig.sun.intensity = lerp(LK.sun[0], LK.sun[1], tear); rig.hemi.intensity = hemi0 * lerp(LK.hemi[0], LK.hemi[1], tear);
      hazeU.value = tear; wU.uClear.value = tear; ribMat.uniforms.uClear.value = tear;   // the air: what is left of the fog lies low once it has torn
      mudU.uTear.value = tear; mudU.uSunCol.value.copy(sunC).multiplyScalar(lerp(LK.sunK[0], LK.sunK[1], tear));
      mudU.uAmb.value.setRGB(lerp(LK.amb0[0], LK.amb1[0], tear), lerp(LK.amb0[1], LK.amb1[1], tear), lerp(LK.amb0[2], LK.amb1[2], tear));
      mudU.uSkyZ.value.copy(pearlZ).lerp(zen, tear); mudU.uSkyH.value.copy(pearlH).lerp(hor, tear); mudU.uGlow.value.setRGB(LK.glow[0], LK.glow[1], LK.glow[2]).multiplyScalar(1 - 0.75 * tear);
      wU.uSunCol.value.copy(sunC).multiplyScalar(lerp(LK.sunK[0], LK.sunK[1], tear) * 1.08);
      wU.uAmb.value.setRGB(lerp(LK.wamb0[0], LK.wamb1[0], tear), lerp(LK.wamb0[1], LK.wamb1[1], tear), lerp(LK.wamb0[2], LK.wamb1[2], tear));
      ribMat.uniforms.uLight.value.setScalar(lerp(LK.light[0], LK.light[1], tear));
      waU.uSky.value.copy(mudU.uSkyH.value).lerp(mudU.uSkyZ.value, 0.45); waU.uSunCol.value.copy(mudU.uSunCol.value); waU.uDeep.value.copy(mudU.uAmb.value).multiplyScalar(0.22);
      hero.arcLight.copy(wU.uAmb.value).add(cA.copy(wU.uSunCol.value).multiplyScalar(0.6));
      mudU.uShK.value = lerp(LK.shOp[0], LK.shOp[1], tear);
      { const a = mudU.uAmb.value, q = mudU.uSunCol.value, k = ((a.r + a.g + a.b) + 0.5 * (q.r + q.g + q.b)) / 2.7; mudU.uShC.value.copy(shC).multiplyScalar(k); }   // the shadow's blue-violet, as bright as the light of the hour
      setOp(mistNear, (0.075 * lerp(0.4, 1, sstep(0.04, 0.14, u)) + 0.07 * sstep(uT0 - 0.07, uT0 + 0.02, u)) * (1 - tear) * (1 - tear));   // rags thicken round the car as the fog tears, and drift off seaward
      setOp(bank, 0.12 + 0.5 * tear); setOp(rivers, lerp(0.08, 0.1, tear));
      if (mistNear.update) mistNear.update(dt, time, camera); if (bank.update) bank.update(dt, time, camera); if (rivers.update) rivers.update(dt, time, camera);
      rays.uniforms.uIntensity.value = (night ? 0.6 : 1.1) * sstep(uT0 - 0.03, uT0 + 0.06, u) * (1 - sstep(uT1 - 0.035, uT1 + 0.045, u)); if (rays.update) rays.update(dt, time, camera);
      for (let i = 0; i < smokes.length; i++) { const s = smokes[i]; s.uniforms.uColor.value.copy(smk0).lerp(smk1, tear); s.uniforms.uAmbient.value.copy(sma0).lerp(sma1, tear); if (s.update) s.update(dt, time, camera); }
      for (let i = 0; i < steams.length; i++) if (steams[i].update) steams[i].update(dt, time, camera);
      lampGlows.uniforms.uIntensity.value = LK.lamp * (night ? 1 : lerp(1, 0.5, tear)); if (lampGlows.update) lampGlows.update(dt, time, camera);
      hills.material.opacity = 0.8 * tear;
      hero.update(dt, time, camera); fauna.update(dt, time, camera, u);
      // cars on the return line and the crossing line, each with its lamp and the lamp's glow
      for (let i = 0; i < NC; i++) {
        let lx = 0, lz = 0;
        if (i < NR) { const uc = (i + carPh) * CS - 0.4 * u;
          if (uc < 0 || uc > uM[2]) hide(); else { fto(uc, -9, 3, cp); const yaw = Math.atan2(-tan.z, tan.x); dummy.position.copy(cp); dummy.rotation.set(Math.sin(time * 0.9 + i) * 0.035, yaw, 0); dummy.scale.setScalar(Math.min(1, (uM[2] - uc) * 90 + 0.02)); dummy.updateMatrix(); lx = Math.cos(yaw) * 3.4; lz = -Math.sin(yaw) * 3.4; }
        } else { const s = 0.9 * u + 0.35 - 0.4 * (i - NR + crossPh);
          if (s <= 0 || s >= 1) hide(); else { cp.lerpVectors(XA, XB, s); cp.y -= 4 * XSAG * s * (1 - s); dummy.position.copy(cp); dummy.rotation.set(Math.sin(time * 0.9 + i) * 0.035, yawX, 0); dummy.scale.setScalar(Math.min(1, s * 30, (1 - s) * 30)); dummy.updateMatrix(); lx = Math.cos(yawX) * 3.4; lz = -Math.sin(yawX) * 3.4; } }
        cars.setMatrixAt(i, dummy.matrix);
        dummy.position.x += lx; dummy.position.y -= 3.3; dummy.position.z += lz; dummy.updateMatrix(); carLamps.setMatrixAt(i, dummy.matrix); carGlows.setPosition(i, dummy.position.x, dummy.position.y, dummy.position.z);
      }
      cars.instanceMatrix.needsUpdate = true; carLamps.instanceMatrix.needsUpdate = true; if (carGlows.update) carGlows.update(dt, time, camera);
      // the welder: eased pulses, never more than about two a second
      const ph = (time * 1.6) % 1, gate = sstep(0.2, 0.25, u) * (1 - sstep(0.39, 0.44, u)), pulse = sstep(0, 0.2, ph) * (1 - sstep(0.3, 0.8, ph)) * gate;
      arc.scale.setScalar((0.25 + pulse) * (night ? 1.4 : 1)); weldLight.intensity = (night ? 110 : 60) * pulse; setOp(sparks, 0.15 + 0.85 * pulse); if (sparks.update) sparks.update(dt, time, camera);
      if (rare) { const ax = AX0 + 30 * sstep(0.4, 0.66, u) + Math.sin(time * 0.05) * 0.5; arrival.position.x = ax; arrMat.uniforms.uOff.value.x = ax - AX0; arrSmoke.uniforms.uBase.value.x = ax - 25.5; if (arrSmoke.update) arrSmoke.update(dt, time, camera); if (petals.update) petals.update(dt, time, camera); }
      // our own shadow on the mud, down-sun of the car; and the car itself, placed from the camera every frame
      const e = camera.matrixWorld.elements, hgt = Math.max(0, e[13] - 1.4), fl = Math.hypot(e[8], e[10]) || 1;
      path.tangentAt(Math.min(1, Math.max(0, u)), tan); { const tl = Math.hypot(tan.x, tan.z) || 1; bsU.uAxis.value.set(tan.x / tl, tan.z / tl); }
      boatShadow.matrix.makeTranslation(e[12] + SX * COT * hgt, 0.13, e[14] + SZ * COT * hgt); boatShadow.matrixWorldNeedsUpdate = true; bsU.uOp.value = u > 0 ? 0.66 * lerp(0.45, 1, tear) * sstep(3, 8, hgt) : 0;
      const on = u > 0 && !ctx.through ? 1 : 1e-4;
      let dip = 0; for (let i = 0; i < 3; i++) { const d = (u - uM[i]) / 0.012; dip -= 0.25 * Math.exp(-d * d); }
      // the boat: its bow keeps to the cable's heading while the gaze wanders (softly limited to about five degrees), it yaws a little
      // under its hangers and rolls with the gusts; it rides a little higher in the frame when we look down over it
      const tl2 = Math.hypot(tan.x, tan.z) || 1, hd = Math.atan2(tan.x / tl2, -tan.z / tl2), dh0 = hd - Math.atan2(-e[8], e[10]), dh = Math.atan2(Math.sin(dh0), Math.cos(dh0));
      mV.makeRotationY(-(0.09 * Math.tanh(dh / 0.09) + Math.sin(time * 0.31) * 0.035 + Math.sin(time * 0.53) * 0.02)).multiply(mS.makeRotationZ(Math.sin(time * 1.32) * 0.028 + Math.sin(time * 4.3) * 0.004)); mV.scale(sV.set(on, on, on));
      mV.setPosition(0, Math.min(0.09, 0.3 * Math.max(0, e[9])) + dip + Math.sin(time * 2.1) * 0.015, 0);
      veh.matrix.copy(camera.matrixWorld).multiply(mV); veh.matrixWorldNeedsUpdate = true;
      // its shadow-caster, level under the cable at the eye's place
      mV.makeRotationY(Math.atan2(-tan.z, tan.x)); mV.scale(sV.set(on, on, on)); mV.setPosition(e[12], e[13], e[14]); carShade.matrix.copy(mV); carShade.matrixWorldNeedsUpdate = true;
    }
    hide(); for (let i = 0; i < NC; i++) { cars.setMatrixAt(i, dummy.matrix); carLamps.setMatrixAt(i, dummy.matrix); }
    veh.matrix.makeScale(1e-4, 1e-4, 1e-4); carShade.matrix.makeScale(1e-4, 1e-4, 1e-4);

    return {
      scene, path, duration,
      pace: (u) => 1 - 0.14 * sstep(0.24, 0.28, u) * (1 - sstep(0.34, 0.38, u)) - 0.28 * sstep(0.42, 0.47, u) * (1 - sstep(0.57, 0.63, u)) + 0.22 * sstep(0.64, 0.68, u) * (1 - sstep(0.73, 0.79, u)),
      ride: 'none',
      camera: { fov: 62, near: 0.3, far: 5000, lookAhead: 26, sway: 0.6, bank: 0.3 },
      pois: [
        { at: frame(0.2, -30, -8), from: 0.03, to: 0.13, weight: 0.28 },                    // up the street of painted hulls: the great bow stands in the right of the frame, not across its middle
        { at: K2.wpt(0.3 * K2.L, K2.D + 1.5, 0), from: 0.29, to: 0.37, weight: 0.2 },     // K2's sunlit foredeck, as we come up the street
        { at: frame(0.56, -6, 0).map((v, i) => (i === 1 ? 2 : v)), from: 0.36, to: 0.5, weight: 0.75 },        // down on the hulls and the wet mud from the crest
        { at: [0, 20, 0], from: 0.46, to: 0.6, weight: 0.5 },
        { at: R5.wpt(0, R5.D + 2, 0).map((v, i) => lerp(v, [0, 30, 0][i], 0.3)), from: 0.555, to: 0.665, weight: 0.55 },             // over the crest: between the ferry smoking under our right hand and the liner standing behind her
        { at: [0, 8, 17], from: 0.62, to: 0.9, weight: 0.7 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#FFD9A0', glow: 1, revealDistance: 480 },
      post: { exposure: LK.exposure, bloom: { strength: night ? 0.5 : 0.35, radius: 0.7, threshold: night ? 0.85 : 0.92 },
        grade: { saturation: 1.1, contrast: 1.06, tint: '#ffffff', shadowTint: '#141A26', vignette: 0.28, grain: 0.02, aberration: 0 } },
      update,
      dispose() { skyA.dispose?.(); skyB.dispose?.(); hero.dispose?.(); blackTex.dispose(); maskTex.dispose(); },
    };
});

export default {
  id: 'hull-town',
  name: 'Where Ships Go to Live',
  category: 'city',
  weirdness: 0.4,
  media: ['cable', 'air'],
  async build(ctx) {
    await ctx.yield();                                                          // (see buildTown: its first call is a step of its own)
    return buildTown(ctx);
  },
};
