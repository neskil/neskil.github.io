// Hero set piece of the world hollow-of-the-wave: THE GREAT WAVE and THE WHEEL, cut as a colour woodblock print.
// After Katsushika Hokusai (1760 to 1849): an original place in his manner, copying no single print. Nothing lettered.
//
// THE WAVE'S BEAT, said plainly: the wave's rise and the throw and fall of its lip are ONE function of the metres
// flown (uniform uFlown, set by hero.setFlown(m) or hero.setProgress(u)) and of nothing else. No timer, clock, eye,
// lens or seed's number enters the law (WAVE_GLSL and its JS twin waveProfile / wavePoint). At 0 m flown (the state
// seen through the previous portal) it stands as a plain clawed ridge. Only loops run on the clock (uTime): ribs
// slide up to the lip, FOAM VEINS (long islands of lace lying in the ribs of the hollow's face) are drawn up into the lip
// with them, claws curl and uncurl in a ripple (the hanging claws of the thrown lip by up to 0.58 rad, the standing
// ones by 0.32), dots are flung and fall, the wipes breathe, the wheel runs in.
// THE LAWS OF THE METRES FLOWN in this file, all of them: THE RISE (hwRise / waveRise: the wall 31 m, 36 m by 187 m
// flown, 46 m by 290 m; its tail, the wave's own metres under 190 eased out by 215, 42 m from the first metre and 46 m
// by 290 m) and THE THROW AND FALL OF THE LIP (hwCurl / waveCurl, by the flown point's metres short of or past each
// section). The claws and the lip's dots sit on the section those two laws give; the ridge's end is folded by the
// wave's own metre alone (hwFold), not by the metres flown. The world file's head lists the laws it adds.
// THE EYE IS READ FOR INK ONLY, each the shading of a surface's own material: a line's width against the pixel
// footprint (fwidth), and the SILHOUETTE LINE (hwRim on the sheet, the wheel and printMaterial's bodies, hwClawEdge
// on claws). No program of a dot reads the eye or the lens: the dots are round by their own shape (buildDots).
//
// WHAT IT IS (local space: trough water y 0, open sea y SEA = 10, the entry's course is -Z, the wave's face to +Z/-X):
//   wave sheet  one closed-form sheet 96 x 300, 430 m of wave: tail 120..270 (straight, off to the right of the hills),
//               270..400 laid IN THE FLOWN LINE'S OWN FRAME, 400..end the ridge behind the spit, 34 m right of the
//               line, closing on the wheel's rim; from 518 to 540 m its lip is FOLDED AWAY (hwFold, hwSection: a
//               plain ridge with a round crest) and over its last 16 m it goes down into the water by its height
//               alone. STANDING, a section LEANS toward the flown line and STOOPS: its
//               crest overhangs its foot and the lip's nose hangs 4 to 5 m under the top; the rim breaks into a row
//               of FOAM FANS, one every 16 m of the wave (hwFan: the rim lifted by up to 7 hundredths of the height).
//               THROWN (the hollow, sections 292..414, eased from 262 and to 430): face 12.5 m right of the line,
//               crown 24 m, crest 27 m, lip edge 10.5 m left and 11 m up, then down to the water as a standing arch.
//   claws       456 solid tongues of foam, each curling to a hooked point and bearing three hooked fingers (one
//               geometry, instanced), a HAND of them on every fan and a second shorter row between: 3 to 7 m on the
//               great crest, 2 to 5 m hanging from the lip in the hollow; they stand on the crest and swing down
//               with the throw. 600 paper dots, small solids, fall from the lip.
//   wheel       ring 44 m across, 6 m thick, at the route's end, ribs spiralling in, claws round a paper eye 22 m wide.
//   trough floor (opts.apron) ribbed lanes under the hollow; paper sky with two wipes (opts.sky, default only in the viewer).
// Changed from the brief so its figures fit one another: the rise is 31 / 36 / 46 m (not 18 / 30 / 46) so the clawed
// top clears 11 m hills from the first metre, and the tail's 42 / 46 m so it stands 8 degrees over the horizon at the entry; route length 565 m with its drops (560 in plan); 456 great claws (budget).
// FIX ROUND 2: the line falls 4.6 m as built (knots 25 to 19; it was 12) from the first hill's crest into the valley at 146 m and is over the boats'
// hill by 170 m (HKN), so the gaze is not tipped up out of the sea; the wave's face carries foam veins (WAVE_FRAG, hwVein:
// shading only; the wave's law, its section and its claws' places are as they were); makePlace lays three low crests
// across the trough's floor (TROUGH_CRESTS, foam down their faces) and foam lace in long islands (LACE, laceAt).
//
// opts: palette (7 hex), detail 0.6..1, path (the world's makePath of routeKnots(), in the hero's local space: the
//   hollow is built round it), uniforms (a makePrintUniforms() object to share), flown (initial metres), apron, sky.
// Returns { object, radius 200, height 50, center, anchors, uniforms, path, cols, parts, setFlown(m), setProgress(u),
//   lineAt(m), sectionAt(w, v, flown), update(dt, time, camera), dispose(), ground:false }.
// anchors (local): entry {position, course} | flyThrough [Vector3...] = routeKnots(), the safe line (wave surfaces
//   8 m+ from it in every state, claws 6 m+, dots 4 m+) | portalSeat {position, facing, radius 7} in the wheel's eye |
//   wheel {center, axis, outerRadius 22, eyeRadius 11} | viewpoints {swells, crest, faceOn, trough, hollow, lee,
//   wheel: {metre, position}} named by place | hollow {from 290, to 414} | spit {from 400, to 500, right: 2..36}
//   the room for the lee spit between the line and the ridge's foot | sea (y of the open sea).
// Cost: about 136k triangles (sheet 57,600, claws 46,512, dots 20,000, wheel 12,192), 7 draw calls (8 with the sky),
// build about 60 ms in short steps, no lights, no textures.
// Expects around it: the world's sea meeting the trough floor's edge (46 m left of the line) and the wave's back
// (its foot is 3 m under trough water), hills and swells below the route, the spit inside anchors.spit.
//
// STYLE EXPORTS for the world coder (shade everything with these so the hero is not pasted in):
//   PALETTE, INK, SIZE, overprint(base, ink, k)      inks, size classes, multiply overprint (storm grey, rose, pine green)
//   makePrintUniforms(palette)                       shared uniforms: inks, uTime, uFlown (pass to opts.uniforms)
//   PRINT_GLSL                                       hwInk, hwOver, hwGrain (3 percent streak), hwLine (cut line), hwRim
//   printMaterial(U, opts), PRINT_VERT, PRINT_FRAG   the one unlit print routine for ordinary and instanced meshes
//   WAVE_GLSL, waveRise, waveCurl, waveEase, waveFold, waveProfile, waveSection, wavePoint, layoutWave   the wave's law and its twin
//   clawGeometry(kind), CLAW_EDGE_GLSL, CLAW_FRAG, BODY_FRAG   the claw in its three weights (0 great, 1 swell, 2 far
//                                                    swell), its outline shading and its own fragment routine; BODY_FRAG for dots
//   waveFan(w)                                       the fans of the rim (twin of hwFan)
//   makePaperSky(U, opts)                            far-plane paper dome with the two wipes (uTop, uLow in userData.uniforms)
//   routeKnots(), SEA, ROUTE_LENGTH                  the route in local space
//   makePlace(path)                                  the place round the wave as pure laws: seaY (the valley of two swells, swells by
//                                                    CRESTS, hills, the high hill, trough, lee), the lace (laceAt, fieldAt, LEE), toWorld,
//                                                    routeOf, the horn of the fan of seven, the far cone, lawGLSL (used by the world file and the tools)
//   printMaterial opts hatch, thin
// Post for the world: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } }.
import * as THREE from 'three';

// ---------------------------------------------------------------------------------------------------------
// THE STYLE: seven inks and one unlit print routine
// ---------------------------------------------------------------------------------------------------------
export const PALETTE = ['#E8DCC0', '#14233B', '#1B3A66', '#2B5C8A', '#8DB0C7', '#B4502F', '#D8B56E'];
export const INK = { paper: 0, key: 1, dark: 2, mid: 3, pale: 4, red: 5, yellow: 6 };
// size classes of the print: [key line width m, slip m] (styleNote / techNotes)
export const SIZE = { claw: [0.03, 0.01], boat: [0.06, 0.02], wave: [0.14, 0.06] };

// Overprint of one ink over a base at a strength (the storm grey, the rose, the pine green): multiply, as on paper.
export function overprint(base, ink, k = 1) {
  const b = new THREE.Color(base), i = new THREE.Color(ink);
  return new THREE.Color(b.r * (1 + (i.r - 1) * k), b.g * (1 + (i.g - 1) * k), b.b * (1 + (i.b - 1) * k));
}

// One set of uniforms for the whole world. Pass the object returned here to every print material (hero and world)
// so they share the clock, the metres flown and the inks. uTime is the loop clock (ribs, claws, dots, wipes);
// uFlown is THE LAW OF METRES: metres of route flown, set by hero.setFlown(m) and by nothing else.
export function makePrintUniforms(palette = PALETTE) {
  const c = (i) => ({ value: new THREE.Color(palette[i] || PALETTE[i]) });
  return {
    uPaper: c(0), uKey: c(1), uDark: c(2), uMid: c(3), uPale: c(4), uRed: c(5), uYel: c(6),
    uTime: { value: 0 }, uFlown: { value: 0 },
  };
}

// GLSL shared by every print material (vertex and fragment): inks, hashes, the grain, the cut line, the rim line.
export const PRINT_GLSL = /* glsl */`
uniform vec3 uPaper, uKey, uDark, uMid, uPale, uRed, uYel;
uniform float uTime, uFlown;
float hwHash(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float hwHash2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float hwNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hwHash2(i), hwHash2(i + vec2(1., 0.)), f.x), mix(hwHash2(i + vec2(0., 1.)), hwHash2(i + vec2(1., 1.)), f.x), f.y); }
// ink by index 0..6 (paper, key, dark, mid, pale, red, yellow)
vec3 hwInk(float i){ return i < .5 ? uPaper : i < 1.5 ? uKey : i < 2.5 ? uDark : i < 3.5 ? uMid : i < 4.5 ? uPale : i < 5.5 ? uRed : uYel; }
// overprint: ink laid over base at strength k (multiply, as on paper)
vec3 hwOver(vec3 base, vec3 ink, float k){ return base * mix(vec3(1.), ink, k); }
// WOOD GRAIN: a 3 percent streak in a printed block. along / across are metres on the surface, along the
// authored grain direction and across it; fw is the pixel footprint of 'across' (fwidth, taken by the caller).
// Streaks finer than 3 px fall to their flat average, so nothing shimmers. Paper carries no grain: one hex.
vec3 hwGrain(vec3 ink, float along, float across, float fw){
  float g = hwNoise(vec2(across * 9., along * .22)) * .65 + hwNoise(vec2(across * 31., along * .5)) * .35;
  float vis = 1. - smoothstep(.035, .11, fw);
  return ink * (1. + .06 * (g - .5) * vis);
}
// CUT KEY LINE from an authored edge coordinate e (metres from the edge): hard, width w metres, never under
// 1.5 px (fw = fwidth(e), taken once by the caller outside any branch), never over cap metres (a quarter of the body).
float hwLine(float e, float w, float fw, float cap){
  float W = min(max(w, 1.5 * fw), max(cap, 1.5 * fw));
  return 1. - smoothstep(W - .6 * fw, W + .6 * fw, e);
}
// SILHOUETTE LINE of a curved body (shading of the surface's own material, the one reading of the eye's place
// besides the pixel footprint): ndv = |dot(normal, direction to eye)|, r = the body's radius there (m),
// w = line width (m), pxm = metres per pixel at the fragment, fn = fwidth(ndv).
float hwRim(float ndv, float r, float w, float pxm, float fn){
  float W = min(max(w, 1.5 * pxm), .5 * r), op = clamp(W / (1.5 * pxm), 0., 1.);
  W = max(W, min(1.5 * pxm, r));
  float t = sqrt(clamp(2. * W / max(r, 1e-3), 0., 1.));
  return (1. - smoothstep(t - .7 * fn, t + .7 * fn, ndv)) * op * op;
}
`;

// ---------------------------------------------------------------------------------------------------------
// THE ROUTE (local space). Trough water is y 0; the open sea's mean level is y SEA (10); course at entry is -Z.
// ---------------------------------------------------------------------------------------------------------
export const SEA = 10;            // local y of the mean sea outside the great trough
export const ROUTE_LENGTH = 560;  // nominal metres; the built path is within a metre or two of it
const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mixn = (a, b, t) => a + (b - a) * t;
// heading in radians, left of the entry's course, at nominal metre m
const headingAt = (m) => (40 * sst(205, 300, m) + 35 * sst(280, 400, m) - 30 * sst(395, 490, m)) * Math.PI / 180;
// line height (local y) at nominal metre m: level over the swells, over the crest at 120, a fall down its back (4.6 m as built) to
// the valley at 146, up over the boats' hill by 170 (fix round 2: the fall was 12 m and the climb out of it tipped the
// gaze 15 degrees up; now the eye never sinks under the boats' hill's crest and sees the boats on its face and
// its back), the 16 m drop into the trough, 8 m above trough water through the hollow, up to the lee, 9 m at the wheel
const HKN = [[0, 17], [110, 17], [122, 25], [146, 19], [170, 23.6], [205, 24], [290, 8], [392, 8], [440, 15], [485, 18], [505, 19], [560, 19]];
const heightAt = (m) => { let i = 0; while (i < HKN.length - 2 && m > HKN[i + 1][0]) i++; const a = HKN[i], b = HKN[i + 1]; return mixn(a[1], b[1], sst(a[0], b[0], m)); };
const ORIGIN = { x: 0, z: 0, set: false };
function routeRaw(step) {      // integrate the heading in the route's own frame: x right, z = -forward
  const pts = []; let x = 0, z = 0;
  for (let m = 0; m <= ROUTE_LENGTH + 1e-6; m += step) {
    pts.push([x, heightAt(m), z, m]);
    const h = headingAt(m + step * 0.5); x -= Math.sin(h) * step; z -= Math.cos(h) * step;
  }
  return pts;
}
// The knots of the whole route in the hero's local space, entry first: hand them (through object.matrixWorld if the
// hero is moved or turned) to makePath. Pure: no rng, the same for every seed.
export function routeKnots() {
  const fine = routeRaw(1);
  if (!ORIGIN.set) { const p = fine[300], q = fine[301]; const dx = q[0] - p[0], dz = q[2] - p[2];
    ORIGIN.x = p[0] + (-dz) * 26; ORIGIN.z = p[2] + dx * 26; ORIGIN.set = true; }   // base centre: 26 m right of the line at 300 m
  const out = [];
  for (let m = 0; m <= ROUTE_LENGTH; m += 20) { const p = fine[m]; out.push([p[0] - ORIGIN.x, p[1], p[2] - ORIGIN.z]); }
  return out;
}

// ---------------------------------------------------------------------------------------------------------
// THE WAVE: one closed-form function of (metre along the wave w, profile coordinate v, metres flown).
// NO CLOCK, EYE, LENS OR SEED'S NUMBER ENTERS IT. It is written once here in GLSL (used by the sheet, the claws and
// the dots) and once below as its JS twin (waveProfile / wavePoint), for the count of clear air.
//   rise     H(flown) = 31 m at 0, 36 m at 187, 46 m at 290 and after (above the water at the section's foot); the
//            tail (w under 190, eased out by 215) 42 m at 0 and 46 m at 290 and after
//   curl     d = flown - w. Only sections with w in 292..414 curl in full (ease e from none at 262 and at 430). THE
//            CURL LEADS THE EYE: the lip begins to throw at d -150 (the flown point 150 m short of the section), is
//            fullest from d -70 to d +20 (crown 24 m, crest stooped to 27 m, lip edge 11 m above trough water and
//            10.5 m left of the line), and by d +70 its edge has come straight down to the water where it hung and
//            stands there as an arch. Sections with e under .85 never fall: a standing eave.
//   fans     G(w) = |sin(w * pi / 16)| ^ .7: the rim's foam fans, one every 16 m of the wave, fixed in the world;
//            a standing section's top is lifted by .07 H G^2.857 and its lip hangs 3.2 G m longer; both die out
//            with the throw (1 - C), so the hollow's roof is plain.
//   standing the section at C 0 is a leaning, stooping ellipse (centre 8 m toward the line of its foot, half-axes 9
//            and (H - 2) / 1.848): the crest overhangs and the nose points down at the flown line.
//   section  v 0..1: inner arc from the face's foot over the roof to the lip (0-.42), curtain (.42-.47), the lip
//            roll's nose (.47-.53), curtain (.53-.58), outer arc back to the crest (.58-.8), the back (.8-1).
//            Returned as (a, y, l): a metres right of the section's reference line (the flown line itself for w
//            270..400), y above foot water, l metres along the surface from the lip (the rib coordinate).
// ---------------------------------------------------------------------------------------------------------
export const WAVE_GLSL = /* glsl */`
float hwRise(float m, float w){ return mix(31. + 5. * smoothstep(0., 187., m) + 10. * smoothstep(187., 290., m), 42. + 4. * smoothstep(0., 290., m), 1. - smoothstep(190., 215., w)); }
vec2 hwCurl(float d, float e){ return vec2(e * smoothstep(-150., -70., d), smoothstep(.85, 1., e) * smoothstep(20., 70., d)); }
float hwFan(float w){ return pow(abs(sin(w * .19635)), .7); }
float hwEase(float w){ return smoothstep(262., 292., w) * (1. - smoothstep(414., 430., w)); }
vec3 hwProfile(float v, float H, float C, float F, float G){
  float k = 1. - (1. - C) * (1. - C), Cs = C * sqrt(C);
  float ry0 = max(H - 2., 2.) / 1.848, cy0 = .848 * ry0, dy = .07 * H * pow(G, 2.857) * (1. - Cs);
  float cx = mix(8., 1., k), cy = mix(cy0, 11., Cs), rx = mix(9., 11.5, k), ry = mix(ry0, 13., Cs);
  float C2 = C * C, pb = mix(1.9199, 3.14159, C2 * C2), pa = -1.0123, pe = 1.3963;
  float Ll = 11. * F, L = Ll + 3.2 * G * (1. - C) * (1. - C), R = .5 * (rx + ry);
  vec2 c = vec2(cx, cy), up = vec2(0., dy);
  vec2 pin = c + vec2(rx * cos(pb), ry * sin(pb));
  vec2 pout = c + vec2((rx + 1.5) * cos(pb), (ry + 1.5) * sin(pb));
  vec2 td = normalize(vec2(-rx * sin(pb), ry * cos(pb)));
  if (v < .42) { float q = v / .42, ph = mix(pa, pb, q); return vec3(c + vec2(rx * cos(ph), ry * sin(ph)) + up * smoothstep(.5, 1.5, ph), (pb - ph) * R + Ll + 1.2); }
  if (v < .47) { float q = (v - .42) / .05; return vec3(pin + td * L * q + up, Ll * (1. - q) + 1.2); }
  if (v < .53) { float q = (v - .47) / .06; vec2 u = .5 * (pout - pin); float s = sin(3.14159 * q);
    return vec3(pin + u + td * L - u * cos(3.14159 * q) + td * length(u) * s + up, 1.2 * (1. - s)); }
  if (v < .58) { float q = (v - .53) / .05; return vec3(pout + td * L * (1. - q) + up, Ll * q + 1.2); }
  vec2 p0 = c + vec2((rx + 3.) * cos(pe), (ry + 3.) * sin(pe));
  float lE = (pb - pe) * (R + 2.2) + Ll + 1.2;
  if (v < .8) { float q = (v - .58) / .22, ph = mix(pb, pe, q), t = mix(1.5, 3., q);
    return vec3(c + vec2((rx + t) * cos(ph), (ry + t) * sin(ph)) + up, (pb - ph) * (R + 2.2) + Ll + 1.2); }
  float s = (v - .8) / .2; vec2 pz = vec2(cx + 20. + 1.3 * H, -3.);
  return vec3(mix(p0.x, pz.x, s), p0.y + (pz.y - p0.y) * mix(s, s * s * (3. - 2. * s), .6) + dy * (1. - s), lE + s * 1.05 * distance(p0, pz));
}
// THE RIDGE'S END (the wave's metres 518 to 540, behind the spit, beside the wheel): the lip is FOLDED AWAY. fo 0 is the
// section above; at fo 1 it is a plain ridge with no eave: the face from its foot (2 m left of the reference line, on
// the flown line's side) up to a round crest 8 m right of it and H - 2 m high (the roll's nose lies on the crest), the
// back down to its old foot.
float hwFold(float w){ return smoothstep(518., 540., w); }
vec3 hwSection(float v, float H, float C, float F, float G, float fo){
  vec3 p = hwProfile(v, H, C, F, G * (1. - fo));
  if (fo <= 0.) return p;
  float Hc = max(H - 2., 2.); vec2 r;
  if (v < .5) { float q = v / .5; r = vec2(mix(-2., 8., q), Hc * (.5 - .5 * cos(3.14159 * q))); }
  else { float q = (v - .5) / .5; r = vec2(mix(8., 28. + 1.3 * H, q), mix(Hc, -3., q * q * (3. - 2. * q))); }
  p.xy = mix(p.xy, r, fo); return p;
}
`;
// The JS twin of hwRise / hwCurl / hwProfile / hwFold / hwSection, line for line.
export function waveRise(m, w = 300) { return mixn(31 + 5 * sst(0, 187, m) + 10 * sst(187, 290, m), 42 + 4 * sst(0, 290, m), 1 - sst(190, 215, w)); }
export function waveCurl(d, e) { return [e * sst(-150, -70, d), sst(0.85, 1, e) * sst(20, 70, d)]; }
export function waveFan(w) { return Math.pow(Math.abs(Math.sin(w * 0.19635)), 0.7); }
export function waveEase(w) { return sst(262, 292, w) * (1 - sst(414, 430, w)); }
export function waveProfile(v, H, C, F, G = 0, out = [0, 0, 0]) {
  const k = 1 - (1 - C) * (1 - C), Cs = C * Math.sqrt(C);
  const ry0 = Math.max(H - 2, 2) / 1.848, cy0 = 0.848 * ry0, dy = 0.07 * H * Math.pow(G, 2.857) * (1 - Cs);
  const cx = mixn(8, 1, k), cy = mixn(cy0, 11, Cs), rx = mixn(9, 11.5, k), ry = mixn(ry0, 13, Cs);
  const C2 = C * C, pb = mixn(1.9199, 3.14159, C2 * C2), pa = -1.0123, pe = 1.3963;
  const Ll = 11 * F, L = Ll + 3.2 * G * (1 - C) * (1 - C), R = 0.5 * (rx + ry);
  const pinx = cx + rx * Math.cos(pb), piny = cy + ry * Math.sin(pb);
  const poutx = cx + (rx + 1.5) * Math.cos(pb), pouty = cy + (ry + 1.5) * Math.sin(pb);
  let tdx = -rx * Math.sin(pb), tdy = ry * Math.cos(pb); const tl = Math.hypot(tdx, tdy); tdx /= tl; tdy /= tl;
  if (v < 0.42) { const q = v / 0.42, ph = mixn(pa, pb, q); out[0] = cx + rx * Math.cos(ph); out[1] = cy + ry * Math.sin(ph) + dy * sst(0.5, 1.5, ph); out[2] = (pb - ph) * R + Ll + 1.2; return out; }
  if (v < 0.47) { const q = (v - 0.42) / 0.05; out[0] = pinx + tdx * L * q; out[1] = piny + tdy * L * q + dy; out[2] = Ll * (1 - q) + 1.2; return out; }
  if (v < 0.53) { const q = (v - 0.47) / 0.06, ux = 0.5 * (poutx - pinx), uy = 0.5 * (pouty - piny), ul = Math.hypot(ux, uy), s = Math.sin(3.14159 * q), co = Math.cos(3.14159 * q);
    out[0] = pinx + ux + tdx * L - ux * co + tdx * ul * s; out[1] = piny + uy + tdy * L - uy * co + tdy * ul * s + dy; out[2] = 1.2 * (1 - s); return out; }
  if (v < 0.58) { const q = (v - 0.53) / 0.05; out[0] = poutx + tdx * L * (1 - q); out[1] = pouty + tdy * L * (1 - q) + dy; out[2] = Ll * q + 1.2; return out; }
  const p0x = cx + (rx + 3) * Math.cos(pe), p0y = cy + (ry + 3) * Math.sin(pe);
  const lE = (pb - pe) * (R + 2.2) + Ll + 1.2;
  if (v < 0.8) { const q = (v - 0.58) / 0.22, ph = mixn(pb, pe, q), t = mixn(1.5, 3, q);
    out[0] = cx + (rx + t) * Math.cos(ph); out[1] = cy + (ry + t) * Math.sin(ph) + dy; out[2] = (pb - ph) * (R + 2.2) + Ll + 1.2; return out; }
  const s = (v - 0.8) / 0.2, pzx = cx + 20 + 1.3 * H, pzy = -3;
  out[0] = mixn(p0x, pzx, s); out[1] = p0y + (pzy - p0y) * mixn(s, s * s * (3 - 2 * s), 0.6) + dy * (1 - s); out[2] = lE + s * 1.05 * Math.hypot(p0x - pzx, p0y - pzy); return out;
}
export function waveFold(w) { return sst(518, 540, w); }
export function waveSection(v, H, C, F, G, fo, out = [0, 0, 0]) {
  const p = waveProfile(v, H, C, F, G * (1 - fo), out); if (fo <= 0) return p;
  const Hc = Math.max(H - 2, 2); let rx, ry;
  if (v < 0.5) { const q = v / 0.5; rx = mixn(-2, 8, q); ry = Hc * (0.5 - 0.5 * Math.cos(3.14159 * q)); }
  else { const q = (v - 0.5) / 0.5; rx = mixn(8, 28 + 1.3 * H, q); ry = mixn(Hc, -3, q * q * (3 - 2 * q)); }
  p[0] = mixn(p[0], rx, fo); p[1] = mixn(p[1], ry, fo); return p;
}
// World-space point of the twin: column data {rx, rz, nx, nz, w, hs, foot, e}, profile coordinate v, metres flown.
export function wavePoint(col, v, flown, out = [0, 0, 0]) {
  const cf = waveCurl(flown - col.w, col.e);
  const p = waveSection(v, waveRise(flown, col.w) * col.hs, cf[0], cf[1], waveFan(col.w), waveFold(col.w), out);
  const a = p[0], y = p[1];
  out[0] = col.rx + col.nx * a; out[1] = col.foot + y; out[2] = col.rz + col.nz * a; return out;
}

// Columns of the wave laid in the route's own frame. w is the wave's metre, equal to the route's metre abeam:
//   120..270  the tail: the line of the route at 270 m carried straight back (it runs away to the right of the hills)
//   270..400  the reference line IS the flown line, so the hollow is built round the camera's own path
//   400..end  the ridge behind the spit: the flown line pushed 34 m to the right, closing on the wheel's rim
// path: a makePath() result in local space (opts.path, or one made here from routeKnots()).
export function layoutWave(path, n = 300) {
  const Lp = path.length, wEnd = Lp - 6, P = new THREE.Vector3(), T = new THREE.Vector3();
  const ref = (w, o) => {
    const wc = Math.max(270, w); path.posAtDist(wc, P); path.tangentAtDist(wc, T);
    let tl = Math.hypot(T.x, T.z) || 1; const tx = T.x / tl, tz = T.z / tl;
    const off = 34 * sst(425, 475, w) - 22 * sst(Lp - 75, Lp - 10, w);
    o[0] = P.x + tx * (w - wc) + (-tz) * off; o[1] = P.z + tz * (w - wc) + tx * off; return o;
  };
  // uneven columns: twice as dense (and more) abeam of the hollow and of its two shoulders (246 to 448 m of the wave)
  const dens = (w) => 1 + 2.6 * sst(246, 264, w) * (1 - sst(424, 448, w));
  const ws = [120]; { let acc = 0; const N = 4000, tot = []; let sum = 0;
    for (let i = 0; i < N; i++) { sum += dens(120 + (wEnd - 120) * (i + 0.5) / N); tot.push(sum); }
    let j = 0; for (let c = 1; c < n; c++) { const target = sum * c / n; while (tot[j] < target) j++; ws.push(120 + (wEnd - 120) * (j + 1) / N); } ws.push(wEnd); acc = 0; }
  const cols = [], a = [0, 0], b = [0, 0];
  for (const w of ws) {
    ref(w, a); const r0 = [a[0], a[1]]; ref(w - 0.5, a); ref(w + 0.5, b);
    let dx = b[0] - a[0], dz = b[1] - a[1]; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
    const hs = mixn(0.3, 1, sst(120, 205, w)) * mixn(1, 0.44, sst(405, 445, w)) * mixn(1, 0.45, sst(440, wEnd, w));
    const foot = 8 * (1 - sst(140, 235, w)) + SEA * sst(398, 440, w);
    const e = waveEase(w);
    const k = Math.sqrt(sst(120, 134, w)) * (1 - sst(wEnd - 16, wEnd, w));     // the two ends go down into the water (the far one by its height alone, the lip folded away before it: hwFold)
    cols.push({ w, rx: r0[0], rz: r0[1], nx: -dz, nz: dx, hs, foot, e, k });
  }
  return cols;
}

// rows of the profile: uneven, half of them in roof and roll
function profileRows() {
  const seg = [[0, 0.42, 34], [0.42, 0.47, 4], [0.47, 0.53, 10], [0.53, 0.58, 4], [0.58, 0.8, 26], [0.8, 1, 18]], vs = [];
  for (const [a, b, n] of seg) for (let i = 0; i < n; i++) vs.push(a + (b - a) * i / n);
  vs.push(1); return vs;
}

const WAVE_VERT = /* glsl */`
attribute vec4 aRef, aCol;
varying vec3 vW; varying vec4 vS; varying vec4 vN;
${PRINT_GLSL}
${WAVE_GLSL}
void main(){
  float v = position.x;
  float G = hwFan(aCol.x), H = hwRise(uFlown, aCol.x) * aCol.y;
  vec2 cf = hwCurl(uFlown - aCol.x, aCol.w);
  float fo = hwFold(aCol.x), far = step(300., aCol.x);
  vec3 p = hwSection(v, H, cf.x, cf.y, G, fo);
  // the two ends: the tail's is drawn to a point under the water, the far one sinks by its height alone
  p.xy = mix(mix(vec2(9., -1.), vec2(p.x, -1.2), far), p.xy, position.z);
  vec2 tg = hwSection(min(v + .004, 1.), H, cf.x, cf.y, G, fo).xy - hwSection(max(v - .004, 0.), H, cf.x, cf.y, G, fo).xy;
  tg.y *= mix(1., position.z, far);       // the normal is the sunk section's own
  vec2 n2 = vec2(-tg.y, tg.x) / max(length(tg), 1e-4);
  vec3 wp = vec3(aRef.x + aRef.z * p.x, position.y + p.y, aRef.y + aRef.w * p.x);
  vec4 wpos = modelMatrix * vec4(wp, 1.);
  vW = wpos.xyz; vS = vec4(p.z, aCol.x, v, cf.x); vN = vec4(n2, aRef.zw);
  gl_Position = projectionMatrix * viewMatrix * wpos;
}`;
const WAVE_FRAG = /* glsl */`
varying vec3 vW; varying vec4 vS; varying vec4 vN;
uniform float uSeed; uniform vec2 uVar, uVein;
${PRINT_GLSL}
// one layer of foam veins: metres outside its nearest island (99 where none). x the ribs' own sliding coordinate, w metres
// along the wave, st the ribs' stretch there (1 + l / 25), cx the cell across the ribs (cells 14 to 24 m long, row by row);
// an island is 1.75 m by a third of its cell and more, has its place and size from its cell alone, and grows (g 1) or dwindles (g -1) between 24 and 40 m from the lip
float hwVein(float x, float w, float st, float cx, float salt, float g){
  float rh = hwHash(mod(floor(x / cx), 16.) * 3.71 + salt + 1.3), rl = 19. * (.75 + .5 * rh), r0 = hwHash(rh * 57.3);   // each row of cells: its own measure along the wave, its own start
  vec2 q = vec2(x / cx, w / rl + r0);
  vec2 qc = floor(q), qf = fract(q) - .5;
  float qh = hwHash(mod(qc.x, 16.) * 7.31 + qc.y * 13.7 + salt), qs = .7 + .3 * hwHash(qh * 91.7 + 3.), wc = (qc.y + .5 - r0) * rl;
  qf.y -= (hwHash(qh * 53.1 + 7.) - .5) * 2. * (.36 - .337 * qs);
  float lc = 25. * (st * exp(-qf.x * cx / 25.) - 1.), gr = smoothstep(24., 40., lc); gr = g > 0. ? gr : 1. - gr;
  float on = step(qh, uVein.x * smoothstep(180., 215., wc) * (1. - uVein.y * smoothstep(335., 410., wc))) * step(.08, gr);
  float hm = min(1.75 * pow(st, .6), .31 * cx * st) * qs * max(gr, .08);
  float qr = length(vec2(qf.x * cx * st / max(hm, 1e-3), qf.y / (.337 * qs * sqrt(max(gr, .08))))) + .1 * sin(w * .8 + x * 1.1 + qh * 40.);
  return on > .5 ? (qr - 1.) * hm : 99.;
}
void main(){
  float l = vS.x, w = vS.y, v = vS.z;
  vec3 ddx = dFdx(vW), ddy = dFdy(vW);
  float pxm = sqrt(max(min(dot(ddx, ddx), dot(ddy, ddy)), 1e-10));
  // ribs: bands .5 to .9 m, dark and mid by turns, slanting up into the lip, sliding toward it
  float x = 25. * log(1. + max(l, 0.) / 25.) + uVar.x * w + .3 * sin(w * .21 + l * .13 + uSeed) + 2.2 * uTime;
  float per = 1.5, f = fract(x / per), fw = fwidth(x) / per;
  float outer = step(.5, v);
  float fb = mix(mix(7. + 4. * abs(sin(w * .21 * uVar.y + uSeed)), 2. + 1.2 * abs(sin(w * .37 + uSeed)), vS.w), 3.4 + 3. * abs(sin(w * .23 * uVar.y + 1.7 * sin(w * .031 + uSeed))), outer);
  fb *= 1. - .45 * smoothstep(518., 540., w);          // the folded ridge's end (hwFold) carries a narrower cap of foam
  float e = l - fb, fe = fwidth(e);
  // silhouette in the section's own plane (the wave is a swept body: only its section curves)
  vec3 V = cameraPosition - vW;
  vec2 v2 = vec2(dot(V.xz, vN.zw), V.y); float along = length(v2) / max(length(V), 1e-4); v2 /= max(length(v2), 1e-4);
  vec2 n2 = vN.xy / max(length(vN.xy), 1e-4);
  float ndv = abs(dot(n2, v2)), fn = fwidth(ndv);
  float aw = clamp(fw, 1e-4, 1.);
  float kl = smoothstep(0., aw, f) * (1. - smoothstep(.093, .093 + aw, f));              // the cut line, 14 cm
  float slip = smoothstep(.093, .093 + aw, f) * (1. - smoothstep(.133, .133 + aw, f));   // the ink a finger short
  float dk = smoothstep(.133, .133 + aw, f) * (1. - smoothstep(.56, .56 + aw, f));
  vec3 mid = hwGrain(uMid, w, x, fw * per), dark = hwGrain(uDark, w, x, fw * per);
  vec3 col = mid; col = mix(col, dark, dk); col = mix(col, uPaper, slip); col = mix(col, uKey, kl);
  vec3 avg = uMid * .5 + uDark * .4 + uKey * .07 + uPaper * .03;
  col = mix(col, avg, smoothstep(.22, .5, fw));
  // FOAM VEINS (fix round 2: the trough's count of plain ribs forced it; the wave's law, section and claws are untouched):
  // long islands of lace lie in the ribs of the hollow's face from w 190 on and are drawn up into the lip with the ribs
  // (a loop on the clock: the pattern repeats every 16 cells of 5.25 m at 2.2 m/s), gathering toward the lip and
  // thinning toward the foot and along the hollow; paper to a scalloped edge, its cut line, its pale shadow, pale holes
  float st = 1. + max(l, 0.) / 25., fv = sqrt(dot(ddx, ddx)) + sqrt(dot(ddy, ddy)), far = (1. - outer) * (1. - smoothstep(1.2, 3., fv));
  float vz = min(hwVein(x, w, st, 5.25, 0., -1.), hwVein(x, w, st, 2.625, 5.3, 1.)); vz = mix(99., vz, far); fv = min(fv, max(fwidth(vz), 1e-4));
  col = mix(col, uPale, 1. - smoothstep(.4 - fv, .4 + fv, vz - .12));
  col = mix(col, uKey, hwLine(max(vz, 0.), .12, fv, 1.));
  vec2 hp = vec2(x * 1.2, w * 1.2); hp.x += .5 * mod(floor(hp.y), 2.); vec2 hc = floor(hp), hf = fract(hp) - .5;
  float hw2 = max(fwidth(hp.x) + fwidth(hp.y), 1e-4) * .7, hh = hwHash(mod(hc.x, 63.) * 7.31 + hc.y * 13.7), hd = length(hf) - (.1 + .2 * hh) * step(.3, hh);
  col = mix(col, mix(uPaper, uPale, (1. - smoothstep(-hw2, hw2, hd)) * smoothstep(.3, .55, -vz) * (1. - smoothstep(.25, .6, hw2))), 1. - smoothstep(-fv, fv, vz));
  // foam: bare paper to a scalloped edge, the cut line, the one printed shadow (pale blue) under it
  float sw = .14 * mix(3., 1., smoothstep(0., 7., l));
  float shadow = 1. - smoothstep(.75 - fe, .75 + fe, e - sw);
  col = mix(col, uPale, shadow);        // one printed shadow, a whole block: no rib shows through it
  col = mix(col, uKey, hwLine(max(e, 0.), sw, fe, 1.));
  col = mix(col, uPaper, 1. - smoothstep(-fe, fe, e));
  float fa = max(fwidth(along), 1e-4);   // the silhouette line ends in a cut, not a fade, where the eye looks along the wave
  col = mix(col, uKey, hwRim(ndv, 12., sw, pxm, fn) * smoothstep(.32 - fa, .32 + fa, along) * step(1.2, l));
  // THE LIP'S EDGE: one cut key line round the tip of the roll's nose (a half round of .75 m: v .47 to .53, so 39.27 m
  // of its arc to one of v). On the THROWN lip (the section's own curl, vS.w, over a half) it takes the tip and 60
  // degrees of the round to either side: from within or without the hollow that is .375 m of the lip's hanging edge.
  // On a STANDING section, whose nose looks down at the comer, it is a line .28 m wide along the tip and the rest of
  // the nose is the foam's paper. By the rule of every cut line.
  float tl = abs(v - .5) * 39.27;
  col = mix(col, uKey, hwLine(tl, mix(.14, .785, smoothstep(.5, 1., vS.w)), max(fwidth(tl), 1e-4), 1.));
  gl_FragColor = vec4(col, 1.);
}`;

async function buildSheet(ctx, cols, U, seedPhase, vary) {
  const vs = profileRows(), nr = vs.length, nc = cols.length;
  const pos = new Float32Array(nr * nc * 3), aRef = new Float32Array(nr * nc * 4), aCol = new Float32Array(nr * nc * 4);
  for (let j = 0; j < nc; j++) { const c = cols[j];
    for (let i = 0; i < nr; i++) { const k = j * nr + i;
      pos[k * 3] = vs[i]; pos[k * 3 + 1] = c.foot; pos[k * 3 + 2] = c.k;
      aRef[k * 4] = c.rx; aRef[k * 4 + 1] = c.rz; aRef[k * 4 + 2] = c.nx; aRef[k * 4 + 3] = c.nz;
      aCol[k * 4] = c.w; aCol[k * 4 + 1] = c.hs; aCol[k * 4 + 2] = c.foot; aCol[k * 4 + 3] = c.e; }
    if (j % 60 === 59) await ctx.yield(); }
  const idx = new Uint32Array((nr - 1) * (nc - 1) * 6); let q = 0;
  for (let j = 0; j < nc - 1; j++) { for (let i = 0; i < nr - 1; i++) { const a = j * nr + i, b = a + nr; idx[q++] = a; idx[q++] = b; idx[q++] = a + 1; idx[q++] = a + 1; idx[q++] = b; idx[q++] = b + 1; }
    if (j % 60 === 59) await ctx.yield(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aRef', new THREE.BufferAttribute(aRef, 4));
  g.setAttribute('aCol', new THREE.BufferAttribute(aCol, 4)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  const mat = new THREE.ShaderMaterial({ uniforms: { ...U, uSeed: { value: seedPhase }, uVar: { value: vary }, uVein: { value: new THREE.Vector2(0.95, 0.6) } }, vertexShader: WAVE_VERT, fragmentShader: WAVE_FRAG, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'wave-sheet';
  return mesh;
}
// ---------------------------------------------------------------------------------------------------------
// THE CLAW: a flat tongue of paper foam that curls to a hooked point and bears smaller hooked fingers on its back.
// A solid with thickness (a low three-sided section: two cut edges in the tongue's plane and a ridge), never a card
// turned to the eye; its outline is a smooth curve (ten rings along the great claw). Unit length along +Y, hooking
// toward +X, flat in the XY plane, the ridge toward +Z.
// kind 0 the great claw (three fingers, 102 triangles: the crest, the lip, the wheel) | 1 the swell claw (two fingers,
// 51) | 2 the far swell claw (one finger, 30: crests more than 32 m from the line in plan).
// aHook = (t along the tongue 0..1 for the curl ripple, half-width there per unit length, -1 back edge | 1 hooking
// edge | 0 ridge); normal = the centreline's in-plane normal. The claw's line is its OUTLINE: hwClawEdge works out,
// from the direction to the eye, each corner's place across the tongue as seen (CLAW_FRAG draws the cut line there).
// ---------------------------------------------------------------------------------------------------------
export const CLAW_THICK = 0.3;                // half-thickness of the ridge over the half-width
export function clawGeometry(kind = 0) {
  if (kind === true) kind = 1; if (kind === false) kind = 0;
  const pos = [], nor = [], hook = [], idx = [];
  const tongue = (ox, oy, dir0, len, curl, r0, ts, tBase, tSpan) => {
    const at = (t) => { let x = ox, y = oy; const n = 24; for (let i = 0; i < n; i++) { const tm = (i + 0.5) / n * t, a = dir0 + curl * Math.pow(tm, 1.6); x += Math.sin(a) * len * t / n; y += Math.cos(a) * len * t / n; } return [x, y, dir0 + curl * Math.pow(t, 1.6)]; };
    const rad = (t) => r0 * Math.pow(1 - t, 0.5) * (0.78 + 0.22 * Math.min(1, t * 5));
    const base = pos.length / 3;
    for (let k = 0; k < ts.length; k++) { const t = ts[k], [cx, cy, a] = at(t), r = rad(t), nx = Math.cos(a), ny = -Math.sin(a), tt = tBase + tSpan * t;
      pos.push(cx - nx * r, cy - ny * r, 0, cx + nx * r, cy + ny * r, 0, cx, cy, r * CLAW_THICK);
      nor.push(nx, ny, 0, nx, ny, 0, nx, ny, 0); hook.push(tt, r, -1, tt, r, 1, tt, r, 0); }
    const [tx, ty, ta] = at(1); pos.push(tx, ty, 0); nor.push(Math.cos(ta), -Math.sin(ta), 0); hook.push(tBase + tSpan, 0.004, 0);
    const tip = pos.length / 3 - 1;
    for (let k = 0; k < ts.length - 1; k++) for (let q = 0; q < 3; q++) { const a = base + k * 3 + q, b = base + k * 3 + (q + 1) % 3; idx.push(a, b, a + 3, b, b + 3, a + 3); }
    const last = base + (ts.length - 1) * 3; for (let q = 0; q < 3; q++) idx.push(last + q, last + (q + 1) % 3, tip);
    return { at, rad };
  };
  const nr = [10, 6, 4][kind], top = [0.95, 0.86, 0.75][kind];
  const rings = Array.from({ length: nr }, (_, i) => { const q = i / (nr - 1); return top * (1.15 * q - 0.15 * q * q); });   // rings along the tongue, closer toward the point
  const main = tongue(0, 0, -0.25, 1, 1.9, 0.235, rings, 0, 1);
  const fingers = [[[0.36, 0.33, 0.092], [0.55, 0.28, 0.08], [0.72, 0.22, 0.065]], [[0.4, 0.33, 0.092], [0.62, 0.26, 0.075]], [[0.5, 0.32, 0.09]]][kind];
  for (const [t0, len, r0] of fingers) { const [x, y, a] = main.at(t0), r = main.rad(t0);
    tongue(x - Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45, a - 0.5, len, 1.6, r0, kind === 0 ? [0, 0.45, 0.8] : [0, 0.55], t0, 0.5); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aHook', new THREE.Float32BufferAttribute(hook, 3)); g.setIndex(idx);
  return g;
}

// Paper body with its cut line from an authored edge coordinate: the fragment half of claws and dots.
export const BODY_FRAG = /* glsl */`
varying vec3 vB;                         // signed metres across the body as seen, half-width as seen (m), ink index
uniform float uLineW, uLine;
${PRINT_GLSL}
void main(){
  float fe = fwidth(vB.x), e = vB.y - abs(vB.x);
  vec3 col = hwInk(vB.z);
  float W = min(max(uLineW, 1.8 * fe), .5 * vB.y), op = clamp(W / max(1.8 * fe, 1e-5), .4, 1.);
  W = max(W, min(1.8 * fe, vB.y));
  col = mix(col, uKey, (1. - smoothstep(W - .6 * fe, W + .6 * fe, e)) * op * uLine);
  gl_FragColor = vec4(col, 1.);
}`;
export const CLAW_EDGE_GLSL = /* glsl */`
// (signed metres across the claw as seen from the eye, half-width as seen: the outline lies at +- that). Vg: direction to
// the eye in the claw's own space, nh the in-plane normal, ca the corner (-1 | 1 edge, 0 ridge), r the half-width (m).
vec2 hwClawEdge(vec3 Vg, vec3 nh, float ca, float pz, float r){
  float h = r * ${CLAW_THICK.toFixed(2)};
  vec2 q = vec2(dot(Vg, nh), Vg.z); q /= max(length(q), 1e-4);
  return vec2((1. - abs(ca)) * sign(pz) * h * q.x - ca * r * q.y, max(r * abs(q.y), h * abs(q.x)));
}`;
// The claw's own fragment routine: bare paper, the PRINTED SHADOW (pale blue) along the under side (the hooking
// edge), the cut key line on the outline. vB = (signed metres across as seen, half-width as seen, 0); vS = (the
// tongue's own coordinate across, -1 back edge .. 1 hooking edge, t along). The line is uLineW metres, never under
// 1.5 px, and never more than a fifth of the half-width as seen: a claw a few pixels wide stays paper.
export const CLAW_FRAG = /* glsl */`
varying vec3 vB; varying vec2 vS;
uniform float uLineW;
${PRINT_GLSL}
void main(){
  float fe = max(fwidth(vB.x), 1e-5), e = vB.y - abs(vB.x), fs = max(fwidth(vS.x), 1e-4);
  vec3 col = mix(uPaper, uPale, smoothstep(.66 - fs, .66 + fs, vS.x) * smoothstep(3., 7., vB.y / fe));   // the shadow is left out of a claw under a few pixels wide
  float W = min(max(uLineW, 1.5 * fe), .2 * vB.y);
  col = mix(col, uKey, 1. - smoothstep(W - .6 * fe, W + .6 * fe, e));
  gl_FragColor = vec4(col, 1.);
}`;
// Claws seated on the wave's lip: the vertex half reads the wave's law at its column, so claws ride the throw.
const CLAW_VERT = /* glsl */`
attribute vec4 aRef, aCol, aClaw;      // aClaw: length m, splay rad (its place in the hand), pitch rad, phase
attribute vec2 aClaw2;                 // turn of the flat about the claw's length rad, how far it swings down with the throw rad
attribute vec3 aHook;
varying vec3 vB; varying vec2 vS;
${PRINT_GLSL}
${WAVE_GLSL}
${CLAW_EDGE_GLSL}
void main(){
  float G = hwFan(aCol.x), H = hwRise(uFlown, aCol.x) * aCol.y;
  vec2 cf = hwCurl(uFlown - aCol.x, aCol.w);
  float fo = hwFold(aCol.x);
  vec2 a = hwSection(.47, H, cf.x, cf.y, G, fo).xy, b = hwSection(.53, H, cf.x, cf.y, G, fo).xy, m = hwSection(.5, H, cf.x, cf.y, G, fo).xy;
  vec2 td = m - .5 * (a + b); td /= max(length(td), 1e-4);
  vec2 inw = vec2(-td.y, td.x);          // square to the throw, toward the section's middle
  float pit = aClaw.z - aClaw2.y * cf.x;    // standing on the crest, hanging from the thrown lip
  float cp = cos(pit), sp = sin(pit);
  vec2 t2 = td * cp - inw * sp, i2 = inw * cp + td * sp;
  vec3 Nw = vec3(aRef.z, 0., aRef.w), Sw = vec3(-aRef.w, 0., aRef.z);
  vec3 Tw = Nw * t2.x + vec3(0., t2.y, 0.), Iw = Nw * i2.x + vec3(0., i2.y, 0.);
  // the hand: the claw leans along the crest by its place in the fan; then its flat turns about its own length
  float cs = cos(aClaw.y), ss = sin(aClaw.y);
  vec3 T1 = Tw * cs + Sw * ss, S1 = Sw * cs - Tw * ss;
  float ct = cos(aClaw2.x), st = sin(aClaw2.x);
  vec3 Ix = Iw * ct + S1 * st, Sx = S1 * ct - Iw * st;
  // the medium moves: curl and uncurl by a fifth of the length, in a ripple along the crest
  float t = aHook.x, ang = mix(.32, .58, cf.x) * sin(uTime * 1.3 + aCol.x * .35 + aClaw.w) * t * sqrt(t);   // the hanging claws of the thrown lip curl and uncurl more
  float ca = cos(ang), sa = sin(ang);
  vec3 p = vec3(position.x * ca + position.y * sa, -position.x * sa + position.y * ca, position.z);
  vec2 root = mix(.5 * (a + b), m, .6);
  vec3 wp = vec3(aRef.x + aRef.z * root.x, aCol.z + root.y, aRef.y + aRef.w * root.x) + (Ix * p.x + T1 * p.y + Sx * p.z) * aClaw.x;
  vec4 wpos = modelMatrix * vec4(wp, 1.);
  vec3 Vw = (cameraPosition - wpos.xyz) * mat3(modelMatrix);
  vec3 Vl = vec3(dot(Vw, Ix), dot(Vw, T1), dot(Vw, Sx));
  vB = vec3(hwClawEdge(vec3(Vl.x * ca - Vl.y * sa, Vl.x * sa + Vl.y * ca, Vl.z), normal, aHook.z, position.z, aHook.y * aClaw.x), 0.);
  vS = vec2(aHook.z, aHook.x);
  gl_Position = projectionMatrix * viewMatrix * wpos;
}`;

// THE CREST'S AND THE LIP'S CLAWS, fixed in the world: on every fan of the rim (one each 16 m of the wave, hwFan) a HAND
// of claws splayed along the crest, and a second row of shorter claws between them that reach forward over the face.
//   the great crest (outside the hollow)   3 to 7 m long (less only where the wave itself stands under two fifths of its height)
//   the lip inside the hollow (e over .5)  2 to 5 m long, hanging from the thrown lip; none nearer the line than 6.0 m (counted)
//   where the flown line comes down past the standing crest (the wave's 228 to 268 m) no claw is longer than 5 m (the same count)
// All draws from rng happen here, in order; a slower machine (detail) keeps every claw's place and drops some.
function buildClaws(rng, cols, U, detail) {
  const g = clawGeometry(0);
  const wA = cols[0].w, wB = cols[cols.length - 1].w, rows = [], list = [];
  const colAt = (w) => { let lo = 0, hi = cols.length - 1; while (hi - lo > 1) { const md = (lo + hi) >> 1; if (cols[md].w <= w) lo = md; else hi = md; }
    const A = cols[lo], B = cols[hi], t = Math.min(1, Math.max(0, (w - A.w) / Math.max(B.w - A.w, 1e-6))), o = {};
    for (const k of ['w', 'rx', 'rz', 'nx', 'nz', 'hs', 'foot', 'e']) o[k] = mixn(A[k], B[k], t); const nl = Math.hypot(o.nx, o.nz) || 1; o.nx /= nl; o.nz /= nl; return o; };
  let n = 0;
  for (let wc = 8 + 16 * Math.ceil((wA + 8) / 16); wc < wB - 10; wc += 16) { const hol = colAt(wc).e > 0.5, lean = rng.range(-0.12, 0.12);
    for (let row = 0; row < 2; row++) { const cnt = row ? 8 : hol ? 11 : 9;
      for (let k = 0; k < cnt; k++, n++) { const u = (k + (row ? 0.5 : 0) + rng.range(-0.18, 0.18)) / (row ? cnt : cnt - 1) - 0.5, c = colAt(wc + u * 14.6), mid = 1 - Math.pow(Math.min(1, Math.abs(2 * u)), 1.3);
        const big = 0.55 + 0.45 * Math.min(1, c.hs * 1.15), r1 = rng.range(0.86, 1), r2 = rng(), r3 = rng(), ph = rng.range(0, 6.283);
        let len = hol ? (row ? mixn(2, 3.2, r2) : mixn(2.3, 5, mid)) * r1 : (row ? mixn(3, 4.4, r2) : mixn(3.2, 7, mid)) * r1 * big;
        len = hol ? Math.max(2, len) : c.hs >= 0.4 ? Math.max(3, len) : len;
        len *= 1 - 0.4 * waveFold(c.w);       // small claws on the folded ridge's top
        if (c.w > 228 && c.w < 268) len = Math.min(len, 5);   // where the flown line comes down past the standing crest (its 228 to 268 m)
        const keep = c.w > wA + 12 && ((n * 0.61803) % 1 < detail || (!row && k === (cnt >> 1)));
        if (keep) { rows.push([c, len, row ? u * 0.7 + lean : u * 1.5 + lean, row ? mixn(0.95, 1.45, r3) : mixn(2.0, 2.45, r3) - 0.25 * Math.abs(u), ph, hol ? -0.85 + (r2 - 0.5) * 0.7 : 1.5708 + (r2 - 0.5) * 0.9, row ? 1.15 : 1.95]);
          list.push({ col: c, len, splay: rows[rows.length - 1][2], pitch: rows[rows.length - 1][3] }); } } } }
  const N = rows.length, aRef = new Float32Array(N * 4), aCol = new Float32Array(N * 4), aClaw = new Float32Array(N * 4), aClaw2 = new Float32Array(N * 2);
  rows.forEach(([c, len, splay, pitch, ph, tw, K], i) => { aRef.set([c.rx, c.rz, c.nx, c.nz], i * 4); aCol.set([c.w, c.hs, c.foot, c.e], i * 4); aClaw.set([len, splay, pitch, ph], i * 4); aClaw2.set([tw, K], i * 2); });
  const ig = new THREE.InstancedBufferGeometry(); ig.index = g.index; ig.attributes.position = g.attributes.position; ig.attributes.aHook = g.attributes.aHook; ig.attributes.normal = g.attributes.normal;
  ig.setAttribute('aRef', new THREE.InstancedBufferAttribute(aRef, 4)); ig.setAttribute('aCol', new THREE.InstancedBufferAttribute(aCol, 4)); ig.setAttribute('aClaw', new THREE.InstancedBufferAttribute(aClaw, 4));
  ig.setAttribute('aClaw2', new THREE.InstancedBufferAttribute(aClaw2, 2)); ig.instanceCount = N;
  const mat = new THREE.ShaderMaterial({ uniforms: { ...U, uLineW: { value: 0.07 } }, vertexShader: CLAW_VERT, fragmentShader: CLAW_FRAG, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(ig, mat); mesh.frustumCulled = false; mesh.name = 'wave-claws';
  return { mesh, list };
}
// ---------------------------------------------------------------------------------------------------------
// THE DOT: a round of bare paper, a small solid (never a card), flung from a claw's tip and falling to the water.
// Born at nothing, dies at nothing. Its lane is a law of the section's state: abeam of the flown line a section
// sheds dots only when its lip hangs at its fullest, 10 m and more to the left of the line; never while it throws.
// ---------------------------------------------------------------------------------------------------------
const DOT_VERT = /* glsl */`
attribute vec4 aRef, aCol, aDot;       // aDot: reach along the throw m, drift out m, drift along m, phase
attribute vec3 aDot2;                  // radius m, period s, 1 where the section may shed while standing
varying vec3 vB;
${PRINT_GLSL}
${WAVE_GLSL}
void main(){
  float G = hwFan(aCol.x), H = hwRise(uFlown, aCol.x) * aCol.y;
  vec2 cf = hwCurl(uFlown - aCol.x, aCol.w);
  float fo = hwFold(aCol.x);
  vec2 a = hwSection(.47, H, cf.x, cf.y, G, fo).xy, b = hwSection(.53, H, cf.x, cf.y, G, fo).xy, m = hwSection(.5, H, cf.x, cf.y, G, fo).xy;
  vec2 td = m - .5 * (a + b); td /= max(length(td), 1e-4);
  float gate = max(smoothstep(.9, 1., cf.x), (1. - smoothstep(0., .05, cf.x)) * aDot2.z);
  float tau = fract(uTime / max(aDot2.y, .5) + aDot.w);
  float sz = aDot2.x * sqrt(max(sin(3.14159 * tau), 0.)) * gate;
  vec2 tip = m + td * aDot.x;
  float y = max(tip.y, 0.) + 3. * tau - (max(tip.y, 0.) + 3.) * tau * tau;
  float aa = min(tip.x, m.x) - aDot.y * tau;
  vec3 wp = vec3(aRef.x + aRef.z * aa, aCol.z + y, aRef.y + aRef.w * aa) + vec3(-aRef.w, 0., aRef.z) * aDot.z * tau + position * sz;
  vec4 wpos = modelMatrix * vec4(wp, 1.);
  vB = vec3(0., 9., 0.);
  gl_Position = projectionMatrix * viewMatrix * wpos;
}`;
// Two solids, round by their own shape (no program of a dot reads the eye or the lens): a dot of radius over 8 cm is a
// round of 120 faces (twelve-sided or finer from every side; at most DOT_BALLS of them, a dot beyond that count is made
// 8 cm), a smaller one the twenty-faced solid. Shown dots stand 9 m and more from the flown line.
export const DOT_BALLS = 80;
function buildDots(rng, clawList, U, detail) {
  const N = Math.round(600 * detail), rows = [[], []], lanes = [];
  for (let i = 0; i < N; i++) { const cl = clawList[Math.floor(rng() * clawList.length) % clawList.length], c = cl.col;
    const d = [cl.len * rng.range(0.5, 0.9), rng.range(0.3, 2.6), rng.range(-1.5, 1.5), rng()]; let r = rng.range(0.03, 0.15) * (rng.chance(0.25) ? 1 : 0.6);
    const free = (c.w < 226 || c.w > 456) ? 1 : 0, per = rng.range(4, 7.5), ball = r > 0.08 && rows[0].length < DOT_BALLS; if (!ball) r = Math.min(r, 0.08);
    rows[ball ? 0 : 1].push({ c, d, r, per, free }); lanes.push({ col: c, reach: d[0], out: d[1], along: d[2], r, free }); }
  const mat = new THREE.ShaderMaterial({ uniforms: { ...U, uLineW: { value: 0.01 }, uLine: { value: 0 } }, vertexShader: DOT_VERT, fragmentShader: BODY_FRAG });
  const meshes = rows.map((list, ci) => { const g = ci ? new THREE.IcosahedronGeometry(1, 0) : new THREE.SphereGeometry(1, 12, 6), n = Math.max(list.length, 1);
    const aRef = new Float32Array(n * 4), aCol = new Float32Array(n * 4), aDot = new Float32Array(n * 4), aDot2 = new Float32Array(n * 3);
    list.forEach((q, i) => { const c = q.c; aRef.set([c.rx, c.rz, c.nx, c.nz], i * 4); aCol.set([c.w, c.hs, c.foot, c.e], i * 4); aDot.set(q.d, i * 4); aDot2.set([q.r, q.per, q.free], i * 3); });
    if (!list.length) aDot2.set([0, 5, 0]);
    const ig = new THREE.InstancedBufferGeometry(); ig.index = g.index; ig.attributes.position = g.attributes.position;
    ig.setAttribute('aRef', new THREE.InstancedBufferAttribute(aRef, 4)); ig.setAttribute('aCol', new THREE.InstancedBufferAttribute(aCol, 4));
    ig.setAttribute('aDot', new THREE.InstancedBufferAttribute(aDot, 4)); ig.setAttribute('aDot2', new THREE.InstancedBufferAttribute(aDot2, 3));
    ig.instanceCount = n;
    const mesh = new THREE.Mesh(ig, mat); mesh.frustumCulled = false; mesh.name = ci ? 'wave-dots' : 'wave-dots-ball'; return mesh; });
  return { meshes, lanes };
}

// ---------------------------------------------------------------------------------------------------------
// THE SKY of the print: bare paper with two wipes, both streaked level with wood grain. A far-plane dome that
// needs no update (it reads only the view's rotation). uLow (the low wipe's ink, already overprinted on paper
// by the world: buff, storm grey, rose by the metres flown) and uTop are in the shared uniforms' extras.
// ---------------------------------------------------------------------------------------------------------
export function makePaperSky(U, opts = {}) {
  const top = opts.top || U.uMid.value, low = opts.low || overprint(U.uPaper.value, U.uYel.value, 0.5);
  const uni = { ...U, uTop: { value: new THREE.Color(top) }, uLow: { value: new THREE.Color(low) } };
  const mat = new THREE.ShaderMaterial({ uniforms: uni, side: THREE.BackSide, depthWrite: false, depthTest: false,
    vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.);
      if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */`varying vec3 vD; uniform vec3 uTop, uLow;
${PRINT_GLSL}
void main(){
  vec3 d = vD / max(length(vD), 1e-4);
  float el = degrees(asin(clamp(d.y, -1., 1.)));
  float az = atan(d.z, abs(d.x) + 1e-4);
  // level streaks of the block's grain; they breathe a little, as a wipe does from pull to pull
  float g = hwNoise(vec2(az * 3., el * 2.2 + 17.)) * .6 + hwNoise(vec2(az * 9., el * 7. + 3.)) * .4;
  float br = .6 * sin(uTime * .21 + az * 2.);
  float t = smoothstep(18., 40., el + (g - .5) * 5. + br);
  float l = 1. - smoothstep(1.5, 9., el + (g - .5) * 2.5 + .5 * br);
  vec3 col = uPaper;
  col = mix(col, uLow, l);                 // uLow is the low wipe's ink already laid over paper
  col = hwOver(col, uTop / max(uPaper, vec3(.05)), t);  // the top wipe: mid blue reached at full strength
  gl_FragColor = vec4(col, 1.);
}` });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat); mesh.renderOrder = opts.renderOrder ?? -10; mesh.frustumCulled = false; mesh.name = 'paper-sky';
  mesh.userData.uniforms = uni;
  return mesh;
}
// ---------------------------------------------------------------------------------------------------------
// THE WHEEL: the wave's far end rolled upright. A ring 44 m across and 6 m thick along the course, in the
// darkest blue, ribs spiralling in (a whole number of bands to the turn, so no seam), paper claws turned
// inward round an eye of bare paper 22 m wide whose 14 m opening is the exit. Local: axis +Z, toward the comer.
// ---------------------------------------------------------------------------------------------------------
const WHEEL_VERT = /* glsl */`
varying vec3 vW, vN, vL;
void main(){ vL = position; vec4 wpos = modelMatrix * vec4(position, 1.); vW = wpos.xyz; vN = mat3(modelMatrix) * normal;
  gl_Position = projectionMatrix * viewMatrix * wpos; }`;
const WHEEL_FRAG = /* glsl */`
varying vec3 vW, vN, vL;
uniform float uSeed;
${PRINT_GLSL}
void main(){
  float r = length(vL.xy), th = atan(vL.y, vL.x + step(r, 1e-4));
  vec3 ddx = dFdx(vW), ddy = dFdy(vW);
  float pxm = sqrt(max(min(dot(ddx, ddx), dot(ddy, ddy)), 1e-10));
  // spiral ribs: 15 bands to the turn; the seam of atan is hidden by taking the footprint from r alone
  float per = 1.5, x = (r - 11.) + abs(vL.z) * .6 + 3.58099 * th + 2.2 * uTime;
  float f = fract(x / per), fw = clamp(1.6 * pxm / per, 1e-4, 1.);
  float isEye = step(r, 11.45) * step(abs(vL.z), .2);
  float fb = .9 + 1.1 * abs(sin(th * 11. + uSeed));
  float e = (r - 11.) + abs(vL.z) * .5 - fb, fe = max(1.6 * pxm, 1e-4);
  vec3 V = cameraPosition - vW; V /= max(length(V), 1e-4);
  vec3 n = vN / max(length(vN), 1e-4);
  float ndv = abs(dot(n, V)), fn = fwidth(ndv);
  float kl = smoothstep(0., fw, f) * (1. - smoothstep(.093, .093 + fw, f));
  float slip = smoothstep(.093, .093 + fw, f) * (1. - smoothstep(.133, .133 + fw, f));
  float md = smoothstep(.62, .62 + fw, f);
  vec3 dark = hwGrain(uDark, th * r, x, fw * per), mid = hwGrain(uMid, th * r, x, fw * per);
  vec3 col = mix(dark, mid, md); col = mix(col, uPaper, slip); col = mix(col, uKey, kl);
  col = mix(col, uDark * .62 + uMid * .28 + uKey * .07 + uPaper * .03, smoothstep(.22, .5, fw));
  col = mix(col, uPale, 1. - smoothstep(.6 - fe, .6 + fe, e - .14));
  col = mix(col, uKey, hwLine(max(e, 0.), .14, fe, 1.));
  col = mix(col, uPaper, 1. - smoothstep(-fe, fe, e));
  // the rim's own foam: paper to a scalloped edge, the cut line, the printed shadow
  float eo = (22. - r) - abs(vL.z) * .15 - (.5 + 1.1 * abs(sin(th * 9. + uSeed * 2.)));
  col = mix(col, uPale, 1. - smoothstep(.5 - fe, .5 + fe, eo - .14));
  col = mix(col, uKey, hwLine(max(eo, 0.), .14, fe, 1.));
  col = mix(col, uPaper, 1. - smoothstep(-fe, fe, eo));
  col = mix(col, uKey, hwRim(ndv, 3., .3, pxm, fn));
  // the eye: bare paper, a cut line round the opening
  vec3 eye = mix(uPaper, uKey, hwLine(max(r - 7., 0.), .14, fe, .5));
  gl_FragColor = vec4(mix(col, eye, isEye), 1.);
}`;
const WCLAW_VERT = /* glsl */`
attribute vec4 aW;                     // angle, phase, length m, 0 fixed round the eye | 1 running inward
attribute vec3 aHook;
varying vec3 vB; varying vec2 vS;
${PRINT_GLSL}
${CLAW_EDGE_GLSL}
void main(){
  float run = step(.5, aW.w) * (1. - step(1.5, aW.w)), outr = step(1.5, aW.w), tau = fract(uTime / 9. + aW.y);
  float r = mix(mix(11.5, mix(21.2, 11.8, tau), run), 21.4, outr), th = aW.x + 2.65 * tau * run;
  float len = aW.z * mix(1., sin(3.14159 * tau), run);      // born small at the rim, gone to nothing at the eye
  float rr = clamp((r - 16.5) / 5.5, -1., 1.), z = mix(mix(1.3, 3. * sqrt(max(1. - rr * rr, 0.)) + .1, run), .7, outr) * sign(aW.z);
  vec3 rh = vec3(cos(th), sin(th), 0.), thh = vec3(-rh.y, rh.x, 0.), zh = vec3(0., 0., sign(aW.z));
  vec3 T = normalize(mix(-rh * .85 + thh * .4, rh * .8 - thh * .55, outr) + zh * .28 * run), hd = mix(thh, -thh, outr), X = normalize(hd - T * dot(hd, T)), S = cross(T, X);
  float t = aHook.x, ang = .32 * sin(uTime * 1.3 + aW.x * 5. + aW.y * 6.283) * t * sqrt(t);
  float ca = cos(ang), sa = sin(ang);
  vec3 p = vec3(position.x * ca + position.y * sa, -position.x * sa + position.y * ca, position.z);
  vec3 lp = rh * r + vec3(0., 0., z) + (X * p.x + T * p.y + S * p.z) * abs(len);
  vec4 wpos = modelMatrix * vec4(lp, 1.);
  vec3 Vw = (cameraPosition - wpos.xyz) * mat3(modelMatrix);
  vec3 Vl = vec3(dot(Vw, X), dot(Vw, T), dot(Vw, S));
  vB = vec3(hwClawEdge(vec3(Vl.x * ca - Vl.y * sa, Vl.x * sa + Vl.y * ca, Vl.z), normal, aHook.z, position.z, aHook.y * abs(len)), 0.);
  vS = vec2(aHook.z, aHook.x);
  gl_Position = projectionMatrix * viewMatrix * wpos;
}`;
function buildWheel(rng, U, detail, seedPhase) {
  const grp = new THREE.Group(); grp.name = 'wheel';
  // ring: an oval section swept round (radial half-width 5.5, half-thickness 3), plus the flat paper eye
  const pos = [], nor = [], idx = [], NT = 96, NS = 20;
  for (let i = 0; i <= NT; i++) { const th = i / NT * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
    for (let j = 0; j <= NS; j++) { const ps = j / NS * Math.PI * 2, cr = Math.cos(ps), sz = Math.sin(ps);
      const sq = Math.sign(cr) * Math.pow(Math.abs(cr), 0.75), sq2 = Math.sign(sz) * Math.pow(Math.abs(sz), 0.75), r = 16.5 + 5.5 * sq;
      pos.push(c * r, s * r, 3 * sq2); const nl = Math.hypot(cr / 5.5, sz / 3) || 1; nor.push(c * cr / 5.5 / nl, s * cr / 5.5 / nl, sz / 3 / nl); } }
  for (let i = 0; i < NT; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = a + NS + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const eb = pos.length / 3;
  for (let i = 0; i <= NT; i++) { const th = i / NT * Math.PI * 2, c = Math.cos(th), s = Math.sin(th); pos.push(c * 7, s * 7, 0, c * 11.4, s * 11.4, 0); nor.push(0, 0, 1, 0, 0, 1); }
  for (let i = 0; i < NT; i++) { const a = eb + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  const ring = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...U, uSeed: { value: seedPhase } }, vertexShader: WHEEL_VERT, fragmentShader: WHEEL_FRAG, side: THREE.DoubleSide }));
  ring.frustumCulled = false; grp.add(ring);
  // claws: fixed ones round the eye on both faces (2 m, tips 9.3 m and more from the axis), and runners on the near face
  const cg = clawGeometry(1), nFix = Math.round(64 * detail), nRun = Math.round(40 * detail), nOut = Math.round(56 * detail), N = nFix + nRun + nOut, aW = new Float32Array(N * 4), list = [];
  for (let i = 0; i < N; i++) { const fixed = i < nFix, outer = i >= nFix + nRun;
    const th = fixed ? (i / nFix) * Math.PI * 2 + rng.range(-0.03, 0.03) : outer ? ((i - nFix - nRun) / nOut) * Math.PI * 2 + rng.range(-0.04, 0.04) : rng.range(0, Math.PI * 2);
    const len = (fixed ? rng.range(1.4, 2.0) : outer ? rng.range(3.0, 5.0) : rng.range(1.6, 2.5)) * ((fixed || outer) && i % 3 === 2 ? -1 : 1);
    aW.set([th, rng(), len, fixed ? 0 : outer ? 2 : 1], i * 4); list.push({ th, len, kind: fixed ? 0 : outer ? 2 : 1 }); }
  const ig = new THREE.InstancedBufferGeometry(); ig.index = cg.index; ig.attributes.position = cg.attributes.position; ig.attributes.aHook = cg.attributes.aHook; ig.attributes.normal = cg.attributes.normal;
  ig.setAttribute('aW', new THREE.InstancedBufferAttribute(aW, 4)); ig.instanceCount = N;
  const cm = new THREE.Mesh(ig, new THREE.ShaderMaterial({ uniforms: { ...U, uLineW: { value: SIZE.claw[0] } }, vertexShader: WCLAW_VERT, fragmentShader: CLAW_FRAG, side: THREE.DoubleSide }));
  cm.frustumCulled = false; grp.add(cm);
  return { group: grp, list };
}
// ---------------------------------------------------------------------------------------------------------
// printMaterial: THE ONE PRINT ROUTINE for every other body of the world (swells, hills, boats, rock, pines,
// plovers, cone, cloud lobes). Unlit, flat ink, cut line, slip, grain, optional ribs and silhouette line.
// Geometry carries: position, normal, and aPrint (vec4) = ( ink index 0..6 | metres to the nearest authored
// edge (99 = none) | rib coordinate in metres (bands lie across it and slide along it) | grain-across in metres ).
// opts: size 'claw' | 'boat' | 'wave' (line width and slip), ribs 0|1, ribInk (index of the second band's ink),
// period m (two bands), speed m/s (ribs slide), rim m (radius of the curved body for the silhouette line; 0 none),
// overInk + over (an overprint laid on the whole block: index and strength, e.g. key at 1/3 for storm-grey rock),
// thin 0|1 (a many-faced body far off: cut lines narrower than 1.5 px weaken toward the block's average tint),
// hatch 0|1 (short cut strokes down a rock face: aPrint.z is the height, aPrint.w the metres across the face).
// All switches are uniforms: every printMaterial is the same program. Change them only at build.
// ---------------------------------------------------------------------------------------------------------
export const PRINT_VERT = /* glsl */`
attribute vec4 aPrint;
varying vec3 vW, vN; varying vec4 vP;
void main(){
  vec4 lp = vec4(position, 1.);
  #ifdef USE_INSTANCING
  lp = instanceMatrix * lp;
  #endif
  vec4 wpos = modelMatrix * lp; vW = wpos.xyz; vP = aPrint;
  #ifdef USE_INSTANCING
  vN = mat3(modelMatrix) * (mat3(instanceMatrix) * normal);
  #else
  vN = mat3(modelMatrix) * normal;
  #endif
  gl_Position = projectionMatrix * viewMatrix * wpos;
}`;
export const PRINT_FRAG = /* glsl */`
varying vec3 vW, vN; varying vec4 vP;
uniform float uLineW, uSlip, uRibs, uRibInk, uPer, uSpeed, uRimR, uOverInk, uOver, uHatch, uThin;
${PRINT_GLSL}
void main(){
  vec3 ddx = dFdx(vW), ddy = dFdy(vW);
  float pxm = sqrt(max(min(dot(ddx, ddx), dot(ddy, ddy)), 1e-10));
  float e = vP.y, fe = fwidth(e);
  float per = max(uPer, .05), x = vP.z + uSpeed * uTime, fx = clamp(fwidth(vP.z) / per, 1e-4, 1.), f = fract(x / per);
  float fg = fwidth(vP.w);
  vec3 V = cameraPosition - vW; V /= max(length(V), 1e-4);
  vec3 n = vN / max(length(vN), 1e-4);
  float ndv = abs(dot(n, V)), fn = fwidth(ndv);
  vec3 a = hwInk(vP.x), b = hwInk(uRibInk);
  float band = smoothstep(.5, .5 + fx, f) * (1. - smoothstep(1. - fx, 1., f));
  vec3 col = mix(a, mix(mix(a, b, band), .5 * (a + b), smoothstep(.22, .5, fx)), uRibs);
  col = hwOver(col, hwInk(uOverInk), uOver);
  col = mix(col, hwGrain(col, vP.z, vP.w, fg), step(.5, vP.x));        // paper carries no grain
  // hatching (rock): short cut strokes down the face, in patches; strokes finer than 3 px are left out
  float hx = vP.w * 1.9, hc = floor(hx), hfw = clamp(fwidth(hx), 1e-4, 1.);
  float hon = step(.42, hwHash(hc)) * step(fract(vP.z * .21 + hwHash(hc + 7.)), .36);
  col = mix(col, uKey, (1. - smoothstep(.11, .11 + hfw, abs(fract(hx) - .5))) * hon * (1. - smoothstep(.3, .6, hfw)) * uHatch);
  float W = max(uLineW, 1.5 * fe);
  col = mix(col, uPaper, (1. - smoothstep(W + uSlip - fe, W + uSlip + fe, e)) * step(fe, uSlip * 2.));   // the slip
  col = mix(col, uKey, hwLine(e, uLineW, fe, 4.) * mix(1., clamp(uLineW / max(1.5 * fe, 1e-5), .22, 1.), uThin));
  col = mix(col, uKey, hwRim(ndv, max(uRimR, .01), uLineW, pxm, fn) * step(.001, uRimR));
  gl_FragColor = vec4(col, 1.);
}`;
export function printMaterial(U, opts = {}) {
  const sz = SIZE[opts.size || 'boat'];
  return new THREE.ShaderMaterial({ vertexShader: PRINT_VERT, fragmentShader: PRINT_FRAG, side: opts.side ?? THREE.DoubleSide,
    uniforms: { ...U, uLineW: { value: opts.lineWidth ?? sz[0] }, uSlip: { value: opts.slip ?? sz[1] }, uRibs: { value: opts.ribs ? 1 : 0 },
      uRibInk: { value: opts.ribInk ?? INK.dark }, uPer: { value: opts.period ?? 1.4 }, uSpeed: { value: opts.speed ?? 0 }, uRimR: { value: opts.rim ?? 0 },
      uOverInk: { value: opts.overInk ?? INK.key }, uOver: { value: opts.over ?? 0 }, uHatch: { value: opts.hatch ?? 0 }, uThin: { value: opts.thin ?? 0 } } });
}

// The trough's floor under the hollow: level lanes of mid and dark blue drawn toward the wave's foot.
function buildApron(cols, U) {
  const pos = [], nor = [], pr = [], idx = [], as = [-46, -24, -6, 14]; let n = 0;
  for (let j = 0; j < cols.length; j += 3) { const c = cols[j]; if (c.w < 215 || c.w > 436) continue;
    for (const a of as) { pos.push(c.rx + c.nx * a, c.foot + 0.02, c.rz + c.nz * a); nor.push(0, 1, 0); pr.push(INK.mid, 46 + a, a, c.w); }
    if (n > 0) { const b = (n - 1) * 4, d = n * 4; for (let k = 0; k < 3; k++) idx.push(b + k, d + k, b + k + 1, b + k + 1, d + k, d + k + 1); }
    n++; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aPrint', new THREE.Float32BufferAttribute(pr, 4)); g.setIndex(idx);
  const m = new THREE.Mesh(g, printMaterial(U, { size: 'wave', ribs: 1, ribInk: INK.dark, period: 2.6, speed: 1.2, lineWidth: 0, slip: 0 })); m.name = 'trough-floor'; m.frustumCulled = false;
  return m;
}





// ---------------------------------------------------------------------------------------------------------
// buildHero
// ---------------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('hollow-hero') : ctx.rng;
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const U = opts.uniforms || makePrintUniforms(opts.palette || PALETTE);
  const knots = routeKnots();
  const path = opts.path || ctx.core.makePath(knots);
  const cols = layoutWave(path);
  const seedPhase = rng.range(0, 6.283);
  const object = new THREE.Group(); object.name = 'hollow-of-the-wave-hero';
  // posing for a look alone: opts.flown (metres), opts.zoom, opts.look (wave metre to centre on)
  const flown0 = opts.flown ?? 0, zoom = opts.zoom ?? 1, lookW = opts.look ?? 0;
  U.uFlown.value = flown0;
  await ctx.yield();
  const vary = new THREE.Vector2(rng.range(0.42, 0.68), rng.range(0.8, 1.25));   // per seed: the ribs' slant, the scallops' measure
  const sheet = await buildSheet(ctx, cols, U, seedPhase, vary); object.add(sheet);
  await ctx.yield();
  const claws = buildClaws(rng, cols, U, detail); object.add(claws.mesh);
  await ctx.yield();
  const dots = buildDots(rng, claws.list, U, detail); for (const m of dots.meshes) object.add(m);
  if (opts.sky ?? !opts.path) object.add(makePaperSky(U, { renderOrder: -0.5 }));     // the world lays its own; the viewer gets paper
  await ctx.yield();
  const wheel = buildWheel(rng, U, detail, seedPhase);
  { const m = path.frameAt(1, new THREE.Matrix4()); wheel.group.applyMatrix4(m); }
  wheel.group.updateMatrixWorld(true); object.add(wheel.group);
  await ctx.yield();
  if (opts.apron ?? true) object.add(buildApron(cols, U));
  const V3 = (m) => path.posAtDist(m, new THREE.Vector3());
  const center = lookW ? V3(lookW) : new THREE.Vector3(0, 20, 0);
  const endT = path.tangentAtDist(path.length, new THREE.Vector3());
  const vp = (m) => ({ metre: m, position: V3(m) });
  const anchors = {
    entry: { position: V3(0), course: path.tangentAtDist(0, new THREE.Vector3()) },
    flyThrough: knots.map((k) => new THREE.Vector3(k[0], k[1], k[2])),
    portalSeat: { position: V3(path.length), facing: endT.clone().negate(), radius: 7 },
    wheel: { center: V3(path.length), axis: endT.clone(), outerRadius: 22, eyeRadius: 11, thickness: 6 },
    viewpoints: { swells: vp(60), crest: vp(120), faceOn: vp(187), trough: vp(250), hollow: vp(340), lee: vp(440), wheel: vp(500) },
    hollow: { from: 290, to: 414, face: 12.5, crown: 24, lipEdge: [-10.5, 11] },
    spit: { from: 400, to: 500, right: [2, 36] },
    sea: SEA,
  };
  return {
    object, radius: 200 * zoom, height: 50 * (lookW ? zoom * 3 : 1), center, anchors, uniforms: U, path, cols,
    parts: { claws: claws.list, dots: dots.lanes, wheel: wheel.list },
    setFlown(m) { U.uFlown.value = m; },                       // THE LAW OF METRES: call every frame with u * path.length
    setProgress(u) { U.uFlown.value = u * path.length; },
    lineAt(m, out = new THREE.Vector3()) { return path.posAtDist(m, out); },
    // a point of the wave's surface (local): w wave metre 120..end, v profile 0..1, flown metres (the JS twin)
    sectionAt(w, v, flown, out = [0, 0, 0]) { let j = 0; while (j < cols.length - 2 && cols[j + 1].w < w) j++; return wavePoint(cols[j], v, flown, out); },
    update(dt, time, camera) { U.uTime.value = time; },        // loops only; nothing is made or switched here
    dispose() {},
    ground: false, groundY: 0,
  };
}

// ---------------------------------------------------------------------------------------------------------
// THE PLACE round the wave (pure laws, no rng, no clock; used by the world file and by the print-only tools
// tmp/plan.mjs and tmp/clear.mjs). Route coordinates: m = metres of route abeam, a = metres right of the line.
// World coordinates of the open sea: X = metres right of the entry's axis, M = metres ahead of the entry.
//   swells   crests along q = 10, 22, ... 94 (q = M bent a little by X), 3 m high at the line, taller horns beside
//   hills    crest q 120 (10 m) with a 12 m back, the boats' hill crest q 192 (8 m), its back falling to the trough
//   basin    the great trough (water y 0) from 290 to 392 m of route, the seaward hill on its left to 350 m; three low crests
//            cross its floor slantwise at 229, 252 and 273 m; foam lace lies on it in long islands (laceAt)
//   lee      flat water at SEA from 438 m
// ---------------------------------------------------------------------------------------------------------
export function makePlace(path) {
  const p0 = path.posAtDist(0, new THREE.Vector3()), L = path.length;
  const P = new THREE.Vector3(), T = new THREE.Vector3();
  const lineY = (m) => path.posAtDist(Math.min(Math.max(m, 0), L), P).y;
  // route coordinates -> world (x, z)
  const toWorld = (m, a, out = [0, 0]) => { path.posAtDist(m, P); path.tangentAtDist(m, T); const tl = Math.hypot(T.x, T.z) || 1;
    out[0] = P.x + (-T.z / tl) * a; out[1] = P.z + (T.x / tl) * a; return out; };
  const qOf = (X, M) => M - 0.22 * X + 5 * (Math.sin(X * 0.023 + 1.1) - Math.sin(1.1));
  const bell = (x, c, w) => { const t = (x - c) / w; return Math.exp(-t * t); }, VO = {};
  const HORN = { X: 5.8, k: 2, amp: 2.7, sig: 3.0 };          // the horn of water that bears the fan of seven (crest q 34)
  // swell amplitude (m) at a place: 3 m at the line, taller lumps beside it, the one horn, none in basin and lee
  // THE OPEN SEA'S CRESTS ARE NOT ALIKE (fix round 3), by place: [height against the common swell, length of its claws
  // against the class, share of its claws that stand] for the crests q 10, 22, ... 106. A crest taller than the common one
  // is so only from 4 m off the line outward (the line keeps its 4 m over every crest); the sixth lies nearly flat under
  // the field of foam lace.
  const CRESTS = [[1, 1, 1], [1, 1, 1], [1, 1, 1], [0.75, 0.6, 0.8], [1.35, 1, 1], [0.35, 0.5, 0.4], [1.15, 0.85, 1], [0.8, 0.7, 0.8], [1, 1, 1]];
  const crestOf = (k) => CRESTS[k] || CRESTS[0];
  const swellAmp = (X, k, m, a) => {
    const side = sst(9, 34, Math.abs(a)), lump = Math.max(0, Math.sin(X * 0.071 + k * 2.4)) * Math.max(0, Math.sin(X * 0.029 - k * 1.3 + 0.6)), ch = crestOf(k)[0];
    let A = (3 + 3.6 * side * lump * lump - 0.5 * side) * (ch > 1 ? 1 + (ch - 1) * sst(4, 14, Math.abs(a)) : ch);
    if (k === HORN.k) A += HORN.amp * bell(X, HORN.X, HORN.sig);
    return A;
  };
  // the trough's crests [crest line m + 0.45 a, height m] and its lace islands [along, across, half-length, half-width, 0 lying
  // along a crest line | 1 lying along the route]: metres outside the nearest island, under zero inside it
  const TROUGH_CRESTS = [[229, 3.4], [252, 3.2], [273, 2.8]];
  const LACE0 = [[217, -16, 2.6, 9, 0], [219, 5, 2.2, 6, 0], [240, -24, 2.8, 11, 0], [241, 2, 2.4, 7, 0], [262, -14, 2.8, 10, 0], [263, -38, 2.6, 8, 0], [262.5, 6, 2.2, 5, 0],
    [284, -9, 9, 2.4, 1], [287, -24, 11, 3, 1], [291, 5.5, 8, 2, 1], [309, -16, 10, 2.6, 1], [313, 3.5, 8, 2, 1],
    [207, -12, 2.4, 8, 0], [228.5, -44, 2.4, 7, 0], [250, -48, 2.6, 7, 0], [274, 3, 2.2, 5, 0], [300, -32, 10, 3, 1], [322, -8, 8, 2.2, 1], [325.5, -26, 4.5, 2.6, 1],
    [240.5, 11, 2.2, 4, 0], [218.5, 12.5, 2, 3, 0], [239.5, -46, 2.6, 8, 0],
    [297, 10.5, 9, 2.2, 1], [317, 11.5, 8, 2, 1], [299, -7, 6, 2, 1]];
  // THE LEE'S LACE (fix round 3): long islands on the lee water on the way to the wheel (458 to 552 m of route), beside
  // the line and never under it (the nearest edge 3 m off), and two along the foot of the ridge's folded end
  const LEE = [[462, -9, 8, 2.2, 1], [488, -14, 9, 2.6, 1], [503, 6.8, 8, 2, 1], [512, -8, 9, 2.4, 1], [527, -17, 8, 2.4, 1], [534, 7.6, 7, 2, 1], [546, -7.6, 6, 2, 1],
    [528, 15.5, 7, 2.2, 1], [545, 10.4, 6, 1.8, 1]];
  const laceAt = (m, a) => { let e = 99; const lee = m > 440 && m < 562 && a > -24 && a < 22; if (!lee && (m < 196 || m > 330 || a < -56 || a > 16)) return e;
    const LACE = lee ? LEE : LACE0;
    for (let i = 0; i < LACE.length; i++) { const I = LACE[i], du = ((I[4] ? m : m + 0.45 * a) - I[0]) / I[2], dv = (a - I[1] - (I[4] ? 1.2 * Math.sin(m * 0.21 + i) : 0)) / I[3], r = Math.sqrt(du * du + dv * dv) + 0.16 * Math.sin(a * 0.9 + m * 0.6 + i * 1.7);
      e = Math.min(e, (r - 1) * Math.min(I[2], I[3])); }
    return e; };
  // THE VALLEY OF TWO SWELLS (fix round 3): the line enters between two great swells that run along the course, one to
  // port (crest 9.3 to 11.8 m off, full from 9 m ahead of the entry, falling from 33 m, gone by 47 m) and one to starboard
  // (10.3 to 12 m off, drawing off as it goes, full from 9 m, falling from 22 m, gone by 35 m): crests 12 to 14 m over
  // the mean sea (5 to 7 m above the line), a steep face 7.8 m wide toward the line, a back 15 m long away from it.
  // Behind the entry there is nothing of them. VALLEY[i] = [side, crest's metres off, its sway, sway's measure,
  // sway's phase, height, begins, full, falls from, gone]
  const VALLEY = [[-1, 10.4, 1.2, 0.13, 0.6, 12.6, 0.5, 9, 33, 47], [1, 10.9, 1.1, 0.075, -1.2, 13.2, 0.5, 9, 22, 35]];
  const valleyAt = (X, M, o) => { let y = 0, pf = 0, foam = 99, di = 99;
    for (const V of VALLEY) { if (X * V[0] < -2 || M < V[6] || M > V[9]) continue;
      const xc = V[1] + V[2] * Math.sin(V[3] * M + V[4]), d = xc - X * V[0], pr = d > 0 ? 1 - sst(0, 7.8, d) : 1 - sst(0, 15, -d);
      const A = V[5] * sst(V[6], V[7], M) * (1 - sst(V[8], V[9], M)) * (1 + 0.07 * Math.sin(0.31 * M + 1));
      if (A * pr > y) { y = A * pr; pf = pr; foam = A * (1 - pr) + Math.max(0, 4 - A) * 4; di = d; } }
    if (o) { o.vy = y; o.vpf = pf; o.vfoam = foam; o.vd = di; } return y; };
  // THE HIGH HILL of the open sea, to port: a dome of water 7.6 m over the mean sea, 31 m left of the entry's axis, 80 m ahead
  const HIGH = { X: -31, M: 80, h: 7.6, rx: 15, rm: 10 };
  // THE FIELD OF FOAM LACE on the open sea, where the sixth crest lies flat (61 to 78 m ahead of the entry, from 34 m to
  // port to 16 m to starboard): islands [M, X, half-length along M, half-width along X], metres outside the nearest
  // and the islands that lie on the first hill's face (102 to 116 m ahead), under and beside the line
  const FIELD = [[66, -24, 3.2, 9], [70, -6, 3.6, 10], [64.5, 8, 2.6, 7], [74, 9, 2.8, 6.5], [75.5, -20, 2.6, 8], [62, -9, 2.2, 6],
    [108, -15, 2.4, 8], [111.5, 4, 2.4, 7.5], [105.5, 20, 2.2, 6.5], [113, -34, 2.4, 7], [104, -3, 1.8, 4.5], [112, 27, 2, 5]];
  const fieldAt = (X, M) => { let e = 99; if (M < 54 || M > 122 || X < -48 || X > 38) return e;
    for (let i = 0; i < FIELD.length; i++) { const I = FIELD[i], du = (M - I[0] - 0.22 * (X - I[1])) / I[2], dv = (X - I[1]) / I[3], r = Math.sqrt(du * du + dv * dv) + 0.16 * Math.sin(X * 0.9 + M * 0.6 + i * 1.7);
      e = Math.min(e, (r - 1) * Math.min(I[2], I[3])); }
    return e; };
  const basinMask = (m, a) => sst(196, 236, m) * (1 - sst(394, 436, m)) * sst(-150, -100, a) * (1 - sst(70, 110, a));
  const leeMask = (m, a) => sst(394, 436, m) * sst(-90, -40, a);
  // the whole law. Returns y; fills o = { foam: metres below the governing crest (large where there is none),
  // lane: weight of level lanes (trough floor, lee), amp, k, q } when given.
  const seaY = (m, a, x, z, o) => {
    const X = x - p0.x, M = p0.z - z, q = qOf(X, M);
    const hr = 1 - sst(84, 126, Math.abs(X));
    const bm = basinMask(m, a), lm = leeMask(m, a);
    // swells
    const ph = (q - 10) / 12, k = Math.floor(ph), p = ph - k;
    const b = p < 0.6 ? 1 - p / 0.6 : (p - 0.6) / 0.4, prof = b * b * (3 - 2 * b);
    const kc = p < 0.6 ? k : k + 1;                                  // the crest this place belongs to
    const hillZone = hr * sst(98, 110, q) * (1 - sst(250, 290, q) * (1 - sst(-140, -90, a)));
    const sAmp = swellAmp(X, kc, m, a) * (1 - 0.55 * hillZone) * (1 - bm) * (1 - lm) * (1 - sst(96, 127, -a)) * (1 - sst(66, 98, a));
    const vy = valleyAt(X, M, VO);
    const foam0 = Math.max(sAmp, 3) * (1 - prof) + Math.max(0, 1.25 - sAmp) * 4 + 6 * VO.vpf;      // the common swell's own foam (the valley's is VO.vfoam)
    let y = SEA + sAmp * prof * (1 - 0.8 * VO.vpf) + vy, foam = foam0;
    const hg = bell(X, HIGH.X, HIGH.rx) * bell(M, HIGH.M, HIGH.rm); y += HIGH.h * hg; if (hg > 0.02) foam = Math.min(foam + 30 * sst(0.1, 0.5, hg), HIGH.h * (1 - hg));
    // hill one: crest q 120, face 108..120, back to 150 and a valley 2.5 m under the sea at 152
    const lat1 = (1 + 0.16 * sst(8, 30, Math.abs(X)) * Math.sin(X * 0.05 + 0.7)) * (1 - 0.42 * sst(10, 44, X));
    const a1 = 9.3 * lat1 * hr, s1 = sst(106, 120, q) * (1 - sst(120, 149, q));
    const f1 = a1 * (1 - s1) + Math.max(0, 4 - a1) * 4; y += a1 * s1 - 2.6 * hr * bell(q, 151, 13); foam = Math.min(foam + 6 * sst(0.75, 0.92, s1), f1);      // on a hill's top the common swell's foam gives way to the hill's own one cap
    // hill two (the boats' hill): crest q 192, long face from 157, back falling to the trough
    const lat2 = 1 + 0.14 * sst(8, 30, Math.abs(X)) * Math.sin(X * 0.043 + 2.1);
    const a2 = 7.6 * lat2 * hr, s2 = sst(156, 192, q) * (1 - sst(192, 246, q));
    const f2 = a2 * (1 - s2) + Math.max(0, 4 - a2) * 4 + 30 * sst(192, 200, q); y += a2 * s2 * (1 - 0.6 * bm * sst(-60, -20, a)); foam = Math.min(foam, f2);
    // the great trough: water y 0 abeam of 290..392 m, the seaward hill on its left
    const drop = sst(222, 292, m) * (1 - sst(402, 448, m)) * sst(-80, -44, a) * (1 - sst(60, 100, a));
    y -= SEA * drop;
    const ar = 9.5 * sst(212, 245, m) * (1 - sst(318, 362, m)), sr = sst(-128, -68, a) * (1 - sst(-68, -40, a));
    y += ar * sr; foam = Math.min(foam, ar * (1 - sr) + Math.max(0, 4 - ar) * 4);
    // THE TROUGH IS A SEA (fix round 2): three low crests cross the floor ahead of the line, slantwise (crest lines
    // m + 0.45 a = 229, 252, 273), 3.4 to 2.8 m high, steep toward the comer, long-backed; none under the great wave
    const sC = m + 0.45 * a, wC = sst(-64, -40, a) * (1 - sst(9, 24, a)); let tc = 0;
    for (let i = 0; i < 3; i++) { const d = sC - TROUGH_CRESTS[i][0], pr = d < 0 ? sst(-4.5, 0, d) : 1 - sst(0, 7.5, d), hh = TROUGH_CRESTS[i][1] * wC * (1 + 0.22 * Math.sin(a * 0.13 + i * 2.1));
      y += hh * pr; tc += hh * pr; foam = Math.min(foam, Math.max(1.25 * hh, 3) * (1 - pr) ** 3 + Math.max(0, 2.2 - hh) * 4); }
    // lee ripples: long low lanes
    const rip = 0.25 * lm * Math.sin(a * 0.9 + m * 0.11) * (1 - sst(60, 98, Math.abs(a))); y += rip;
    const foamNoV = foam; foam = Math.min(foam, VO.vfoam);
    if (o) { o.foam = foam; o.foamNoV = foamNoV; o.hill = Math.min(f1, VO.vfoam, hg > 0.02 ? HIGH.h * (1 - hg) : 99) < 3 || f2 <= foam + 1e-9 ? 1 : 0; o.rip = rip; o.vfoam = VO.vfoam; o.sfoam = foam0; o.lace = Math.min(laceAt(m, a), fieldAt(X, M)); o.vy = vy; o.vd = VO.vd; o.tc = tc; o.lane = Math.max(drop * sst(250, 285, m), lm); o.amp = sAmp; o.k = kc; o.q = q; o.X = X; o.M = M; }
    return y;
  };
  const seaAt = (m, a, o) => { const w = toWorld(m, a); return seaY(m, a, w[0], w[1], o); };
  // route coordinates of a world point (coarse search, then fine): { m, a }
  const NS = Math.ceil(L), sx = new Float64Array(NS + 1), sz = new Float64Array(NS + 1);
  for (let i = 0; i <= NS; i++) { path.posAtDist(i * L / NS, P); sx[i] = P.x; sz[i] = P.z; }
  const routeOf = (x, z) => { let bi = 0, bd = 1e18; for (let i = 0; i <= NS; i += 4) { const d = (sx[i] - x) ** 2 + (sz[i] - z) ** 2; if (d < bd) { bd = d; bi = i; } }
    for (let i = Math.max(0, bi - 4); i <= Math.min(NS, bi + 4); i++) { const d = (sx[i] - x) ** 2 + (sz[i] - z) ** 2; if (d < bd) { bd = d; bi = i; } }
    let m = bi * L / NS; path.tangentAtDist(m, T); const tl = Math.hypot(T.x, T.z) || 1, tx = T.x / tl, tz = T.z / tl;
    const dx = x - sx[bi], dz = z - sz[bi]; let along = dx * tx + dz * tz; if (bi > 0 && bi < NS) along = Math.max(-1, Math.min(1, along));
    return { m: m + along, a: dx * (-tz) + dz * tx }; };
  // the far cone: 3,200 m off, 67 degrees left of the entry's course (it stands in the hollow's mouth from 340 m of
  // route), 580 m high and 620 m across: its summit 10.3 degrees over the horizon from the line, whole over the lee's water
  const coneDir = 67 * Math.PI / 180;
  const cone = { x: p0.x - Math.sin(coneDir) * 3200, z: p0.z - Math.cos(coneDir) * 3200, height: 580, base: 620 };
  // THE SAME LAWS IN GLSL, written out from the tables above, for the sea's own program: the valley's two swells (height,
  // metres below the crest) by (X, M), the trough's three crests and the lee's ripple by (m, a). The sea's rib lines and
  // foam edges are drawn from these at every point of the water, not carried from corner to corner of its mesh.
  const f = (v) => { const t = String(+v.toFixed(5)); return /[.e]/.test(t) ? t : t + '.'; };
  const lawGLSL = `
vec2 seaValley(float X, float M){ vec2 r = vec2(0., 99.);
${VALLEY.map((V) => `  if (X * ${f(V[0])} > -2. && M > ${f(V[6])} && M < ${f(V[9])}) { float d = ${f(V[1])} + ${f(V[2])} * sin(${f(V[3])} * M + ${f(V[4])}) - X * ${f(V[0])}, pr = d > 0. ? 1. - smoothstep(0., 7.8, d) : 1. - smoothstep(0., 15., -d);
    float A = ${f(V[5])} * smoothstep(${f(V[6])}, ${f(V[7])}, M) * (1. - smoothstep(${f(V[8])}, ${f(V[9])}, M)) * (1. + .07 * sin(.31 * M + 1.));
    if (A * pr > r.x) r = vec2(A * pr, A * (1. - pr) + max(0., 4. - A) * 4.); }`).join('\n')}
  return r; }
float seaTrough(float m, float a){ float sC = m + .45 * a, wC = smoothstep(-64., -40., a) * (1. - smoothstep(9., 24., a)), tc = 0., d, pr;
${TROUGH_CRESTS.map((C, i) => `  d = sC - ${f(C[0])}; pr = d < 0. ? smoothstep(-4.5, 0., d) : 1. - smoothstep(0., 7.5, d); tc += ${f(C[1])} * wC * (1. + .22 * sin(a * .13 + ${f(i * 2.1)})) * pr;`).join('\n')}
  return tc; }
float seaRipple(float m, float a){ return .25 * smoothstep(394., 436., m) * smoothstep(-90., -40., a) * sin(a * .9 + m * .11) * (1. - smoothstep(60., 98., abs(a))); }
`;
  return { lawGLSL, p0, L, lineY, toWorld, qOf, seaY, seaAt, routeOf, swellAmp, HORN, cone, basinMask, leeMask, TROUGH_CRESTS, laceAt, LEE, CRESTS, crestOf, VALLEY, valleyAt, HIGH, FIELD, fieldAt };
}
