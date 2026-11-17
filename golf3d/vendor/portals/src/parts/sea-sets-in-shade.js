// The Standing Breaker: hero set piece of "The Sea Sets in Shade", and the home of the world's ENCAUSTIC STYLE.
// A wave 30 m high and ~435 m long set in the act of breaking: cream wax wall with pour lumps and flutes in the geometry,
// brush ridges, stylus grooves, scraped amber and buried layers in its material, a thrown lip (thin: honey in sun) hung with
// ~5,000 instanced drips, a round arch melted through the hook with a honey rim of running ropes, the heaped swell of clear
// wax under it and a painted fish in the melting foot.
//
// HOW THE STYLE IS MADE (use these for the whole world, so nothing looks pasted in):
//   createWaxStyle(ctx, { palette, exposure, sun }) -> style: shared uniforms + style.material(o), ONE wax routine for everything.
//     style.material({ clearM, groove, grooveW, refl, bodyBias, detail, tint, side, instanced, uniforms, vertexDecl, vertexPos, fragDecl, fragPre, fragMid, fragPost })
//       geometry attributes: position, normal, uv = surface METRES (x across the flow, y along it), aTan (world tangent of uv.x),
//       aThin 0..1 (lips, necks, sail: honey when sunlit), aHollow 0..1 (shows buried amber), aForce 0..1 (always molten).
//       vertexPos may edit p, n, tg, thin, hollow, force, s (M = model matrix); clearM = metres of sun before glossy cream turns
//       clear turquoise (sea 3, breaker 20); groove = stylus-groove spacing in metres (0 none); tint 'uCream' | 'uCoral' | ...
//     style.setField(tex, size), style.setFieldXf(angle, ox, oz) (the world sets ox = 320*u every frame), style.setSun(v), style.update(time).
//   bakeWaxField(ctx, sd(u, v) -> signed metres (+ in shade), { res, size }) -> the RGBA shadow field (R m into shade, G m before
//     the trailing edge, B m into sun, all /100; A shade mask) in the shadows' frame (they travel toward -U). Yields in strips.
//   WAX_FIELD_GLSL: waxField(worldPos) (points above the sea are shifted down-sun, so gloss climbs), waxSet, waxSunM, waxSag: both stages.
//   WAX_SHADE_GLSL: waxShade(...) (cold: matte cream, frost, pinholes, buried amber that slides in parallax, no highlight at all;
//     warm: clear turquoise by depth, sky-band reflection, tight glint; thin + sun = honey with running ropes), waxSky(dir)
//     (the six poured bands, for the dome and for reflections), waxVeil(col, dist) (five stepped milky veils: the only distance
//     rule, no fog), waxGroove, waxFish (painted fish decal), wxN / wxF noise.
//   material options added for the world: grooveW (stylus width scale), refl (how much sky a molten surface mirrors, default 0.6;
//     the sea uses 0.17 so the lanes land on turquoise), bodyBias (pushes clear wax from the deep teal toward turquoise).
//   WAX_WEED_GLSL: seaWeed(q, e), weed painted on a buried layer (the world's sea and the heaped swell under the arch use it).
//   dripGeometry / instAttrs / DRIP_DECL are exported for the world's own fringes.
//   waxToScene(hex) = exact colour: display hex -> scene value under the engine's tone map; every pigment uniform goes through it,
//     so lit set wax lands on #F3E6C4. Scene cream is therefore ~1.9, glint ~9, honey ~2-3: use WAX_POST (bloom threshold 2.6,
//     strength 0.25) so only glint and sunlit thin wax bloom. WAX_PALETTE is the brief's palette.
//   Fix round 3: the style's darks are used. A hollow (aHollow near 1) shows the buried amber broad and deep (waxShade's "deep of a hollow"),
//     the breaker's face is hollow from 10 m up to the lip and under it; wet wax between the gloss line and the clear front carries slump
//     folds; the clear front is one line with short tongues; honey ropes are warped smooth bands; the vertex stage may set `xv`
//     (varying vX) and fragMid may set `clearM` (the world clears a live crest as fast as the sea).
//
// buildHero(ctx, opts): opts.swellDecl / swellUniforms / swellFrag (GLSL the world hands in so the heaped swell under the arch is shaded as
//   the world's own sea: the snippet may replace `col` where `heap` > 0); opts.palette (7 hex), opts.detail 0.6-1 (thins drips and drops), opts.style (the world's style: then the
//   world owns field, sun and time; without it the piece bakes a preview field and a level preview sea of its own), opts.sea,
//   opts.progress. Returns the contract plus: style, setProgress(u) (standalone only: slides the preview lane), fish (uniform
//   array of six vec4: s along the wave, arc up the section, length, heading; five in the clear foot of the face, one in the heap; update() glides them).
// Frame: origin at the foot of the straight face, +Y up, the face looks toward +Z (the boat's side). The straight face runs
//   from x = +210 to x = -70; the hook turns toward +Z round (-70, 95). Place it with anchors.worldPlacement (position
//   (-165, 0, 540), rotation.y = PI/2) to match the brief's map. True size in the returned `size` (radius ~230 m, height ~30); radius / height / center are what the viewer orbits.
// anchors (local): portalSeat { position (arch centre, 9.5 m up, mid wall), facing (toward the arriving camera), direction, radius 7,
//   hole 7.5 }; archAxis { point, dir, waxY: top of the heaped swell }; flyThrough: nine points, the boat's eye line along the face
//   (20 m out closing to 9.5), out round the hook and 70 m straight up the swell into the arch, never nearer than 6 m to wax
//   or fringe; viewpoints.{wall, face, lip, arch} { eye, look }; fringeLine: 41 points along the lip's edge; footLine(s); length.
// Motion: everything follows the field (uniforms only): gloss climbs, ridges soften, the lip sags 3 m, drips stretch to threads and
//   let go in turn, then bead and drip on time; drops loop where sun is recent; ropes run round the arch; the fish swims.
// Cost: ~166k triangles (wall 43k: face rows doubled 2..25 m, columns 1 m where the boat runs and 2 m on the far shoulders; fringe 49k, near
//   fringe 25k, three-sided teardrop drops 29k; the far fringe has 2,730 drips), 5 draw calls (wall, arch + swell, fringe, near fringe, drops), 3 programs, no lights, no textures but the
//   field. Expects around it: the world's sea at y = 0 right up to the foot of the face (the apron lies 0.5 to 2.4 m UNDER it, so no seam shows), sun in the field
//   at the arch (the arch itself is forced molten), and the path keeping outside the fringe line (7 m off the foot).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

export const WAX_PALETTE = ['#F3E6C4', '#E0A93E', '#9C6A2B', '#18A7B0', '#0B5C74', '#E5533D', '#3B2A20'];
export const WAX_POST = { exposure: 1, bloom: { strength: 0.25, radius: 0.5, threshold: 2.6 }, grade: { saturation: 1, contrast: 1, vignette: 0.12, grain: 0.01 } };

// ---------- exact colour: display colour -> scene-linear value (inverse of exposure/0.6 + ACES), computed once per pigment ----------
const M_IN = [0.59719, 0.076, 0.0284, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777];
const M_OUT = [1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602];
const _inI = new THREE.Matrix3().fromArray(M_IN).invert(), _outI = new THREE.Matrix3().fromArray(M_OUT).invert();
export function waxToScene(hex, exposure = 1, out = new THREE.Color()) {
  const c = new THREE.Color(hex);
  const v = new THREE.Vector3(Math.min(c.r, 0.95), Math.min(c.g, 0.95), Math.min(c.b, 0.95)).applyMatrix3(_outI);
  const q = (y) => { y = clamp(y, 0.0004, 0.97); const A = 0.983729 * y - 1, B = 0.432951 * y - 0.0245786, C = 0.238081 * y + 0.000090537; return (-B - Math.sqrt(Math.max(B * B - 4 * A * C, 0))) / (2 * A); };
  v.set(q(v.x), q(v.y), q(v.z)).applyMatrix3(_inI);
  const g = 0.6 / exposure;
  return out.setRGB(Math.max(v.x, 0) * g, Math.max(v.y, 0) * g, Math.max(v.z, 0) * g);
}

// ---------- the shadow field: shared by vertex and fragment stages ----------
// waxField(worldPos) -> (metres into shade behind the leading edge, metres left before the trailing edge, metres into sun, shade 0..1)
export const WAX_FIELD_GLSL = /* glsl */`
uniform sampler2D uField; uniform vec4 uFieldXf; uniform float uFieldSize; uniform vec2 uSunShift; uniform float uTime;
vec4 waxField(vec3 wp){
  vec2 q = wp.xz + uSunShift*max(wp.y, 0.);
  vec2 f = vec2(uFieldXf.x*q.x - uFieldXf.y*q.y, uFieldXf.y*q.x + uFieldXf.x*q.y) + uFieldXf.zw;
  vec4 t = textureLod(uField, f/uFieldSize + .5, 0.);
  return vec4(t.rgb*100., t.a);
}
float waxSet(vec4 f, float force){ return smoothstep(.25, .75, f.a)*(1. - force); }      // 1 = set (cold), 0 = molten
float waxSunM(vec4 f, float force){ return mix(f.b*(1. - smoothstep(.25, .75, f.a)), 60., force); }   // metres of sun received
float waxSag(float sunM){ float t = clamp(sunM/34., 0., 1.); return t*(1.6 - .6*t); }    // lip sag / slump 0..1: steadily with the metres into sun, whole by 34 m (the lane's width)
`;

// ---------- the wax itself (fragment stage) ----------
export const WAX_SHADE_GLSL = /* glsl */`
uniform vec3 uSun, uCream, uHoney, uAmber, uTurq, uDeep, uCoral, uUmber, uBlue, uVeil, uGlint;
uniform float uBandCreep, uGrooveSp, uGrooveW, uRefl, uBodyBias;
float wxH(vec2 p){ p = fract(p*vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.y); }
float wxN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(wxH(i), wxH(i + vec2(1., 0.)), f.x), mix(wxH(i + vec2(0., 1.)), wxH(i + vec2(1., 1.)), f.x), f.y); }
float wxF(vec2 p){ return wxN(p)*.55 + wxN(p*2.13 + 17.)*.3 + wxN(p*4.7 + 41.)*.15; }
// brush ridges: bristle furrows running along s.y (the flow), -1..1
float wxRidge(vec2 s){
  float w = wxN(s*vec2(.8, .09))*2.6 + wxN(s*vec2(.21, .04) + 9.)*6.;
  return sin(s.x*14.96 + w*3.)*.55 + sin(s.x*3.7 + w*1.3 + 2.)*.45;
}
// the sky as wax sees it: six level poured bands, cream and let-down blue, creeping down
vec3 waxSky(vec3 d){
  float el = asin(clamp(d.y, -1., 1.))*3.8197 + uBandCreep;        // one band = 15 degrees
  float b = abs(fract(el*.5) - .5)*2.;                             // 0..1 triangle over two bands
  return mix(uCream, uBlue, smoothstep(.3, .7, b));
}
// five stepped milky veils: the style's only distance rule
vec3 waxVeil(vec3 c, float d){
  float k = smoothstep(144., 156., d)*.13 + smoothstep(288., 312., d)*.13 + smoothstep(480., 520., d)*.13
          + smoothstep(770., 830., d)*.13 + smoothstep(1150., 1250., d)*.13;
  return mix(c, uVeil, k);
}
// stylus grooves filled umber: long strokes along s.y, spaced ~sp metres in s.x, each of uneven length (they overshoot)
float waxGroove(vec2 s, float sp, vec2 fw){
  sp = max(sp, .05);
  float gx = s.x/sp + wxN(s*vec2(.05, .06))*1.4;
  float id = floor(gx), fx = abs(fract(gx) - .5)*sp;
  float len = 9. + 22.*wxH(vec2(id, 3.)), off = 40.*wxH(vec2(id, 7.));
  float seg = fract((s.y + off)/(len*1.6))*1.6;                    // 0..1 drawn, 1..1.6 gap
  float w = (.045 + .03*wxH(vec2(id, 11.)))*uGrooveW;
  float px = max(fw.x, 1e-4);
  float line = 1. - smoothstep(max(w, px*.75), max(w, px*.75) + px, fx);
  line *= smoothstep(0., .04, seg)*(1. - smoothstep(.96, 1., seg));
  return line*min(1., w/(px*.75));                                  // thinner than a pixel: fade to its average
}
// a painted fish on a buried layer: umber outline (a stylus groove, never thinner than a pixel and a half), filled coral, honey belly and bars, dorsal and
// belly fins, a forked tail, eye and gill stroke. q metres from its middle, nose toward +x; e = pixel size / len
vec4 waxFish(vec2 q, float len, float t, float e){
  vec2 p = q/max(len, .1);
  if (abs(p.x) > .62 || abs(p.y) > .42) return vec4(0.);
  p.y += sin(p.x*5. - t*1.6)*.03*(.6 - p.x);
  e = max(e, 1e-4);
  float bx = (p.x - .1)/.4, body = .17*sqrt(max(1. - bx*bx, 0.));
  float tl = clamp((-.18 - p.x)/.32, 0., 1.), tail = step(p.x, -.18)*(.03 + tl*.19);
  float dfin = max(0., 1. - abs(p.x - .08)/.22)*.085, vfin = max(0., 1. - abs(p.x - .16)/.1)*.06;
  float top = max(body + step(0., p.y)*dfin, tail), bot = max(body + step(p.y, 0.)*vfin, tail);
  float d = p.y > 0. ? p.y - top : -p.y - bot;
  d = max(d, abs(p.x) - .5);
  d = max(d, ((-.4 - p.x)*.9 - abs(p.y))*.7);                                                     // the tail is forked
  float lw = clamp(1.6*e, .016, .03), lk = 1. - .75*smoothstep(.015, .05, e);      // far off the drawn line thins away: a coral shape with honey bars
  float fill = 1. - smoothstep(-e, e, d), line = 1. - smoothstep(lw, lw + e, abs(d));
  line = max(line, 1. - smoothstep(.02, .02 + e, length(p - vec2(.37, .05))));                    // eye
  line = max(line, (1. - smoothstep(lw*.6, lw*.6 + e, abs(p.x - .22 + p.y*p.y*3.)))*fill*step(abs(p.y), body));     // gill stroke
  float inBody = step(abs(p.y), body)*step(-.18, p.x);
  vec3 c = mix(uCoral, uHoney, 1. - smoothstep(-.08, -.02, p.y));
  float bar = (1. - smoothstep(.028, .028 + e, abs(fract(p.x*5.2 + .15) - .5)*.19))*step(-.14, p.x)*step(p.x, .18)*inBody;
  c = mix(c, uHoney, bar*.9);
  c = mix(c, mix(uCoral, uUmber, .35), (1. - inBody)*.6);                                           // fins and tail a darker coral
  c = mix(c, mix(uUmber, uCoral, .2), line*lk);
  return vec4(c, max(fill, line*lk));
}
// tint: cold pigment (cream, or coral for the sail). thin 0..1, hollow 0..1, s = surface metres (x across flow, y along flow),
// T = world tangent along s.x, clearM = metres of sun needed to go from glossy cream to clear turquoise, detail 0/1.
vec3 waxShade(vec3 wp, vec3 N, vec3 T, vec3 V, vec4 fld, float force, float thin, float hollow, vec2 s, vec3 tint, float clearM, float detail, float dist){
  float set = waxSet(fld, force), sunM = waxSunM(fld, force);
  float deepH = clamp(hollow - 1., 0., 1.); hollow = min(hollow, 1.);      // (a hollow attribute above 1 is a deep, closed hollow: under an overhang)
  float soft = 1. - smoothstep(0., 22., sunM)*.85;                 // ridges soften and slump in sun
  vec2 fw = fwidth(s) + 1e-5;
  float fine = (1. - smoothstep(.07, .2, max(fw.x, fw.y)))*detail;  // brush ridges resolved?
  float fwm = max(fw.x, fw.y), mid = 1. - smoothstep(.5, 1.6, fwm);
  float broad = (1. - smoothstep(.45, 1.3, fwm))*detail;           // the loaded brush's own furrows, a hand deep: resolved from far off and along the face
  float bw = wxN(s*vec2(.8, .09))*2.6 + wxN(s*vec2(.21, .04) + 9.)*6.;
  float bph = (s.x*7.4 + bw*.55)*.5, bsn = sin(bph), bg = abs(bsn);  // 0 in the furrow, 1 on the land between
  float bfw = max(fw.x, 1e-4), blw = max(.055, bfw*.8);
  float furrow = (1. - smoothstep(blw, blw + bfw, bg*.27))*min(1., .055/(bfw*.8))*broad;
  float bslope = cos(bph)*(bsn < 0. ? -1. : 1.)*(1. - smoothstep(.6, 1., bg));
  float h = wxRidge(s), e = .03;
  float dh = (wxRidge(s + vec2(e, 0.)) - wxRidge(s - vec2(e, 0.)))/(2.*e);
  vec3 B = cross(N, T);
  float bl = wxF(s*.35 + 3.) - .5;                                  // pour overlaps: broad lumps
  float dby = (wxF((s + vec2(0., .2))*.35 + 3.) - .5 - bl)/.2;
  vec3 Nn = normalize(N - T*(dh*.085*fine + bslope*.3*broad)*soft - B*dby*.5*mid*soft);
  float NV = max(dot(Nn, V), 0.);
  vec2 par = vec2(dot(V, T), dot(V, B))/max(dot(V, N), .35);        // buried layers slide as the eye moves
  // ---- cold wax: matte, frosted, cloudy to a depth, amber buried under pale layers
  float a1 = wxF(s*.11 - par*.3), a2 = wxF(s*.034 - par*1.2*.034 + 7.);
  float bur = smoothstep(.46, .78, a1*.55 + a2*.45 + hollow*.5 - h*.06*fine);
  float scq = wxF(s*vec2(.15, .085) + 23.) + (wxN(s*vec2(1.3, .22) + 3.) - .5)*.03*broad;     // scraped back: a hard-edged patch a couple of metres across, scored along the stroke
  float scl = smoothstep(.35, .6, wxN(s*vec2(5.5, .16) + 5.)), sce = .008 + .03*smoothstep(.2, 1., fwm);
  float scr = smoothstep(.655, .655 + sce, scq)*(.72 + .28*scl*(1. - smoothstep(.1, .4, fw.x)))*detail*(1. - smoothstep(1.2, 3., fwm));
  vec3 cold = mix(tint, mix(tint, uHoney, .5), bur*.38);
  float hle = max(fwm*.9, .035);
  float hol2 = mix(hollow, smoothstep(.5 - hle, .5 + hle, hollow*1.2 + (wxF(s*vec2(.3, .19) + 77.) - .5)*.62)*(.55 + .45*hollow), .8*detail);
  cold = mix(cold, uAmber, clamp(scr*.8 + hol2*.8 + bur*bur*.25, 0., 1.));
  { float dq = hollow*1.25 + (wxN(s*vec2(.3, .19) + 131.) - .5)*.5, de = max(fwm*.9, .03);         // the deep of a hollow: the buried layer itself, dark and broad, with a made edge
    cold = mix(cold, mix(uAmber, uUmber, .3)*.86, smoothstep(.78 - de, .78 + de, dq)*.72*step(.5, detail)); }
  cold = mix(cold, uAmber, clamp(-h, 0., 1.)*.26*fine);
  cold += uCream*clamp(h, 0., 1.)*.05*fine;             // furrows show the layer under
  cold = mix(cold, mix(uAmber, uHoney, .25), furrow*.46);
  float chq = wxF(s*vec2(1.1, .42) + 51.), cha = max(fwm*1.1, .02);
  float chalk = smoothstep(.56 - cha, .56 + cha, chq)*(1. - smoothstep(.35, 1.1, fwm))*detail;       // chalk bloom: pale patches with a made edge
  cold = mix(cold*(1. - .055*broad), tint*1.01, chalk*.75);
  float wrap = .5 + .5*dot(Nn, normalize(uSun*.55 + vec3(0., .8, 0.)));
  cold *= .78 + .22*wrap;
  float fr = wxN(s*23.)*wxN(s*61. + 5.);                            // chalky frost, and pinholes
  float frK = 1. - smoothstep(.02, .06, max(fw.x, fw.y));
  cold += (fr - .25)*.10*frK*uCream;
  float pin = smoothstep(.93, .97, wxH(floor(s*3.1)))*(1. - smoothstep(.0, .11, length(fract(s*3.1) - .5)))*frK;
  cold = mix(cold, uUmber, pin*.7);
  { vec2 pc = floor(s*2.1), pf = fract(s*2.1) - .5 - (vec2(wxH(pc + 3.), wxH(pc + 47.)) - .5)*.5; float pr = .11 + .1*wxH(pc + 19.), pa = max(fwm*2.1, 1e-3);    // the larger pinholes: seen from ten metres
    cold = mix(cold, mix(uUmber, uAmber, .25), step(.86, wxH(pc + 9.))*(1. - smoothstep(pr - pa*.6, pr + pa*.6, length(pf)))*(1. - smoothstep(.09, .22, fwm))*detail*.8*(1. - smoothstep(.1, .4, thin))); }
  { vec2 bc = floor(s*vec2(1.25, .9)), bf = fract(s*vec2(1.25, .9)) - .5; float bh = wxH(bc + 71.), br = .07 + .09*wxH(bc + 13.);     // trapped bubbles, burst: a dark pit with a pale rim
    vec2 bo = (bf - (vec2(wxH(bc + 5.), wxH(bc + 29.)) - .5)*.6)/vec2(1.25, .9);
    float bd = length(bo), ba = max(fwm, 1e-3), bK = step(.74, bh)*(1. - smoothstep(.07, .2, fwm))*detail*(1. - smoothstep(.1, .4, thin));
    cold = mix(cold, tint*1.02, (1. - smoothstep(br + .03, br + .03 + ba, bd))*bK*.8);
    cold = mix(cold, mix(uAmber, uUmber, .5), (1. - smoothstep(br - ba*.5, br + ba*.5, bd))*bK*.85); }
  cold = min(cold, uCream*1.02);
  // ---- warm wax: glossy, clear, running
  float cfg = clearM*(.5 + .26*wxF(vec2(s.x*.33, s.y*.035) + 31.) + .16*wxN(vec2(s.x*1.15, s.y*.1) + 57.));      // the clear front is one line across the flow, running down in short tongues (not a field of fingers)
  float clear = smoothstep(cfg, cfg + .5 + clearM*.07, sunM);
  float run = wxF(s*vec2(.5, .16) + vec2(0., uTime*.55))*2. - 1.;   // slow runs down the flow
  // ropes of thicker wax running down the flow: smooth warped bands (no cell of the noise can show as a bar or a right angle)
  float rpw = wxN(vec2(s.x*.45, s.y*.12 - uTime*.05) + 13.)*5.2 + wxN(vec2(s.x*1.1 + 7., s.y*.31 - uTime*.11))*1.7;
  float rpn = .5 + .5*sin(s.x*4.2 + rpw + .7*sin(s.y*.5 + s.x*.8));
  vec3 Nw = normalize(mix(Nn, N, .5) + T*(run*.10 + thin*(rpn - .5)*.4*(1. - smoothstep(.06, .25, fwm)))*mid);
  float NVw = max(dot(Nw, V), 0.);
  vec3 body = mix(uDeep, uTurq, clamp(.25 + .75*NVw - a2*.3 + thin*.6 + uBodyBias, 0., 1.));
  { vec2 sb = s - par*2.2;                                           // clear wax has depth: a darker layer and painted strokes two metres down, sliding as the eye moves
    float dp1 = wxF(vec2(sb.x*.16, sb.y*.05) + 13.), dp2 = wxF(vec2(sb.x*.6 + .4*sin(sb.y*.09), sb.y*.06) + 71.), ea = max(fw.x*.6, .012), thk = 1. - smoothstep(.1, .34, thin);
    body = mix(body, uDeep, smoothstep(.42, .62, dp1)*.7*detail*thk);
    body = mix(body, mix(uAmber, uUmber, .3), smoothstep(.57 - ea, .57 + ea, dp2)*(.4 + .3*smoothstep(.4, .6, dp1))*detail*thk*(1. - smoothstep(1., 2.5, fwm))); }
  body = mix(body, mix(cold, uHoney, .38)*.92, (1. - clear)*.9);        // gloss arrives first, over wax still cream: wet, a tone deeper and warmer
  vec3 R = reflect(-V, Nw);
  float om1 = clamp(1. - NVw, 0., 1.), fres = .04 + .96*om1*om1*om1*om1*om1;
  vec3 warm = mix(body, mix(waxSky(R), uBlue, .45), fres*uRefl);
  { float ska = max(fw.x*1.6, .02), skq = wxF(vec2(s.x*2.1, s.y*.08 + uTime*.02) + 61.) + run*.04;
    float streak = smoothstep(.655 - ska, .655 + ska, skq)*(1. - smoothstep(.5, 1.4, fwm));
    warm = mix(warm, mix(uBlue, uCream, .25), streak*.3*(1. - clear)*(1. - smoothstep(0., .3, thin)));
    { float sl = s.y*.62 + 1.1*sin(s.x*.55 + wxN(s*vec2(.2, .1) + 3.)*4.) + wxN(s*vec2(.45, .3) + 7.)*2.4, sf = abs(fract(sl) - .5)*2., sw = max(fw.y*1.1, .075);
      float fold = (1. - smoothstep(sw, sw*1.8, sf))*(1. - clear)*(1. - smoothstep(0., .2, thin))*detail*(1. - smoothstep(.35, .9, fwm))*smoothstep(1.5, 5., sunM);
      warm = mix(warm, mix(uHoney, uAmber, .55), fold*.5); }        // wet wax slumps: sagging folds across the flow, between the gloss line and the clear front
    float mk = wxF(vec2(s.x*1.1 + .35*sin(s.y*.13), s.y*.03 + uTime*.012) + 91.), ma = max(fw.x*.8, .015);      // the mirror in clear wax: long smooth pale strokes down the flow
    warm = mix(warm, mix(uBlue, uCream, .2), smoothstep(.6 - ma, .6 + ma, mk)*.3*clear*detail*(1. - smoothstep(0., .3, thin))*(1. - smoothstep(.6, 1.6, fwm))); }
  float sp = max(dot(R, uSun), 0.);
  float sp2 = sp*sp; sp2 *= sp2; sp2 *= sp2; sp2 *= sp2; sp2 *= sp2; sp2 *= sp2;      // ^64
  warm += uGlint*(sp2*sp2*sp2*sp2*sp2*sp2*1.0 + sp2*.06);
  // thin wax in sun passes light as honey (edges, necks, lips), brightest seen from below and beside
  float back = .55 + .45*clamp(1. - NVw + .5*max(-V.y, 0.), 0., 1.);
  float rth = .74 + .2*(wxN(vec2(s.x*.37 + 5., s.y*.08)) - .5);      // ropes of thicker wax, running slowly: threads with a beginning and an end, never a regular stripe or a bar
  float rope = smoothstep(rth - .08, rth + .08, rpn)*smoothstep(.34, .52, wxN(vec2(s.x*.9 + 3., s.y*.3 - uTime*.07) + 71.))*(1. - smoothstep(.06, .25, fwm));   // (too far off to hold a rope: plain honey)
  vec3 honey = mix(uHoney*(.95 + .55*back), mix(uHoney, uAmber, .5)*(.85 + .25*back), rope*.62);
  honey += uGlint*(sp2*sp2*sp2*.5 + rope*(1. - rope)*.12);
  warm = mix(warm, honey, smoothstep(0., .34, thin));
  vec3 col = mix(warm, cold, set);
  { // shadow is the darker layer buried under the pale ones: the deeper and more closed a hollow, the more of it shows, in two made steps down to the dark of
    // the stylus grooves. No cast shadow: a rule of the place (the hollow attribute), the same in sun and shade; thin lit wax above it stays honey.
    float dn = (wxF(s*vec2(.22, .11) + 151.) - .5)*.34 + (wxN(s*vec2(1.7, .3) + 9.) - .5)*.08, de = max(fwm*.8, .02);
    float d1 = smoothstep(.22 - de, .22 + de, deepH + dn), d2 = smoothstep(.7 - de, .7 + de, deepH + dn*.8);
    float keep = 1. - smoothstep(.12, .5, thin)*(1. - set);
    col = mix(col, mix(uAmber, uUmber, .45)*(.8 - .12*furrow), d1*.8*keep);
    col = mix(col, mix(uAmber, uUmber, .82)*(.62 - .08*furrow), d2*.86*keep); }
  // ---- stylus grooves
  float gK = (1. - smoothstep(170., 250., dist))*detail;
  if (gK > 0. && uGrooveSp > 0.) col = mix(col, uUmber*(1. + .6*(1. - set)), waxGroove(s, uGrooveSp, fw)*gK*(.9 - .5*(1. - set)*clear)*(1. - smoothstep(.05, .34, thin)*(1. - set)));      // molten honey holds no groove
  return waxVeil(col, dist);
}
`;

// weed painted on a buried layer (the sea's, and the heaped swell's): seaWeed(q metres, e = pixel size in metres) -> rgba
export const WAX_WEED_GLSL = /* glsl */`
        // weed painted on the buried layer: single loaded strokes, amber and umber, swaying slowly
        vec4 seaWeed(vec2 q, float e){
          vec2 c = floor(q/7.), f = q - c*7.; vec4 o = vec4(0.);
          for (int i = 0; i < 3; i++) {
            float fi = float(i), h1 = wxH(c + fi*17.3), h2 = wxH(c*1.7 + fi*5.1 + 3.);
            vec2 root = vec2(1.2 + 4.6*h1, .6 + 1.6*h2); float len = 2.6 + 2.2*h2;
            float b = (f.y - root.y)/len;
            float a0 = root.x + sin(b*3.2 + uTime*(.4 + .3*h1) + h1*40.)*.42*b + (h2 - .5)*1.4*b*b;
            float w = mix(.2, .035, clamp(b, 0., 1.));
            float al = (1. - smoothstep(w, w + e, abs(f.x - a0)))*step(0., b)*step(b, 1.)*step(.3, h1 + h2*.5);
            o = mix(o, vec4(mix(uAmber, uUmber, step(.6, h2)*.7), 1.), al);
          }
          return o;
        }
`;

// ---------- the shadow field bake: one RGBA texture over `size` metres, in the shadows' own frame (they travel toward -U) ----------
// sd(u, v) -> signed metres, positive in shade. R = metres into shade behind the leading (-U) edge, G = metres left before the
// trailing (+U) edge, B = metres into sun since the last shadow left, all /100; A = shade mask, soft over 6 m.
export async function bakeWaxField(ctx, sd, o = {}) {
  const res = o.res || 512, size = o.size || 1600, tx = size / res, data = new Uint8Array(res * res * 4);
  const row = new Float32Array(res), dl = new Float32Array(res), dr = new Float32Array(res);
  for (let j = 0; j < res; j++) {
    const v = (j + 0.5) * tx - size / 2;
    for (let i = 0; i < res; i++) { row[i] = sd((i + 0.5) * tx - size / 2, v); if (i === (res >> 1)) await ctx.yield(); }
    let last = -1e3;                                    // position (texels) of the last sign change seen from the left
    for (let i = 0; i < res; i++) { if (i > 0 && (row[i] > 0) !== (row[i - 1] > 0)) last = i - 1 + row[i - 1] / (row[i - 1] - row[i]); dl[i] = (i - last) * tx; }
    last = 1e3 + res;
    for (let i = res - 1; i >= 0; i--) { if (i < res - 1 && (row[i] > 0) !== (row[i + 1] > 0)) last = i + row[i] / (row[i] - row[i + 1]); dr[i] = (last - i) * tx; }
    for (let i = 0; i < res; i++) {
      const k = (j * res + i) * 4, sh = row[i] > 0;
      data[k] = sh ? clamp(dl[i] * 2.55, 0, 255) : 0;
      data[k + 1] = sh ? clamp(dr[i] * 2.55, 0, 255) : 0;
      data[k + 2] = sh ? 0 : clamp(dl[i] * 2.55, 0, 255);
      data[k + 3] = clamp(0.5 + row[i] / 6, 0, 1) * 255;
    }
    await ctx.yield();
  }
  const tex = new THREE.DataTexture(data, res, res, THREE.RGBAFormat);
  tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.generateMipmaps = false; tex.needsUpdate = true;
  return tex;
}

// ---------- the style: shared uniforms + material factory. One wax routine shades everything. ----------
export function createWaxStyle(ctx, opts = {}) {
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : WAX_PALETTE, ex = opts.exposure ?? 1;
  const S = (hex) => waxToScene(hex, ex);
  const mixS = (a, b, t) => { const h = (x, i) => parseInt(x.slice(1 + i * 2, 3 + i * 2), 16); let o = '#'; for (let i = 0; i < 3; i++) o += Math.round(lerp(h(a, i), h(b, i), t)).toString(16).padStart(2, '0'); return o; };   // mix as the eye sees it
  const blue = opts.blue || (pal === WAX_PALETTE ? '#B9D9DC' : mixS(pal[0], pal[3], 0.3));
  const blank = new THREE.DataTexture(new Uint8Array([255, 255, 0, 255]), 1, 1, THREE.RGBAFormat); blank.needsUpdate = true;   // all shade until a field is given
  const sun = new THREE.Vector3(Math.sin(1.309) * Math.cos(0.838), Math.sin(0.838), Math.cos(1.309) * Math.cos(0.838));   // 75 deg right of +Z, 48 deg up
  const U = {
    uTime: { value: 0 }, uField: { value: blank }, uFieldXf: { value: new THREE.Vector4(1, 0, 0, 0) }, uFieldSize: { value: 1600 },
    uSunShift: { value: new THREE.Vector2() }, uSun: { value: sun }, uBandCreep: { value: 0 },
    uCream: { value: S(pal[0]) }, uHoney: { value: S(pal[1]) }, uAmber: { value: S(pal[2]) }, uTurq: { value: S(pal[3]) }, uDeep: { value: S(pal[4]) },
    uCoral: { value: S(pal[5]) }, uUmber: { value: S(pal[6]) }, uBlue: { value: S(blue) }, uVeil: { value: S(mixS(pal[0], '#ffffff', 0.4)) },
    uGlint: { value: S('#fbf6ea').multiplyScalar(2.5) },
  };
  const style = {
    palette: pal, uniforms: U, blue,
    setSun(v) { U.uSun.value.copy(v).normalize(); const y = Math.max(U.uSun.value.y, 0.2); U.uSunShift.value.set(-U.uSun.value.x / y, -U.uSun.value.z / y); },
    // the field texture and how world xz maps into its frame: f = rot(angle)*xz + (ox, oz); the world sets ox = 320*u each frame
    setField(tex, size = 1600) { U.uField.value = tex; U.uFieldSize.value = size; },
    setFieldXf(angle, ox, oz) { U.uFieldXf.value.set(Math.cos(angle), Math.sin(angle), ox, oz); },
    update(time) { U.uTime.value = time; U.uBandCreep.value = time / 900; },                      // bands creep one degree a minute
    // o: { instanced, vertexDecl, vertexPos, fragDecl, fragPre, fragPost, tint: 'uCream'|'uCoral'|..., clearM, detail, side, uniforms }
    //   vertexPos may edit: vec3 p, n, tg (object space; tg = tangent along uv.x), float thin, hollow, force, vec2 s (surface metres); M is the model matrix
    material(o = {}) {
      const uni = { ...U, uClearM: { value: o.clearM ?? 3 }, uGrooveSp: { value: o.groove ?? 0 }, uGrooveW: { value: o.grooveW ?? 1 }, uRefl: { value: o.refl ?? 0.6 }, uBodyBias: { value: o.bodyBias ?? 0 }, uDetail: { value: o.detail ?? 1 }, ...(o.uniforms || {}) };
      return new THREE.ShaderMaterial({
        uniforms: uni, side: o.side ?? THREE.FrontSide,
        vertexShader: /* glsl */`
          attribute float aThin, aHollow, aForce; attribute vec3 aTan;
          varying vec3 vW, vN, vT; varying vec2 vS; varying vec3 vK; varying float vX;
          ${WAX_FIELD_GLSL}
          ${o.vertexDecl || ''}
          void main(){
            vec3 p = position, n = normal, tg = aTan; float thin = aThin, hollow = aHollow, force = aForce, xv = 0.; vec2 s = uv;
            ${o.instanced ? 'mat4 M = modelMatrix*instanceMatrix;' : 'mat4 M = modelMatrix;'}
            ${o.vertexPos || ''}
            vec4 wxP = M*vec4(p, 1.);
            vW = wxP.xyz; vN = mat3(M)*n; vT = mat3(M)*tg; vS = s; vK = vec3(thin, hollow, force); vX = xv;
            gl_Position = projectionMatrix*viewMatrix*wxP;
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vW, vN, vT; varying vec2 vS; varying vec3 vK; varying float vX;
          uniform float uClearM, uDetail;
          ${WAX_FIELD_GLSL}
          ${WAX_SHADE_GLSL}
          ${o.fragDecl || ''}
          void main(){
            ${o.fragPre || ''}
            vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
            vec3 T = vT - N*dot(vT, N); T = normalize(T + vec3(1e-4, 0., 2e-4));
            vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv/max(dist, 1e-4);
            vec4 fld = waxField(vW);
            float thin = vK.x, hollow = vK.y, force = vK.z, detail = uDetail, clearM = uClearM; vec2 s = vS; vec3 tint = ${o.tint || 'uCream'};
            ${o.fragMid || ''}
            vec3 col = waxShade(vW, N, T, V, fld, force, thin, hollow, s, tint, clearM, detail, dist);
            ${o.fragPost || ''}
            gl_FragColor = vec4(col, 1.);
          }`,
      });
    },
  };
  style.setSun(opts.sun || sun);
  return style;
}

// ---------- the Standing Breaker: spine, cross-section, wall ----------
// Local frame: the straight face runs along -X from x = +210 to x = -70 at z = 0 and faces +Z (the boat's side); the hook
// turns toward +Z round (-70, 95), radius 95. s = metres along the spine from the far (entry) end.
function makeBreakerShape(ctx, o) {
  const rng = ctx.rng, n = ctx.noise;
  const straight = 280, R = 95, sweep = o.sweep, Ltot = straight + R * sweep;
  const archPhi = 1.225, sArch = straight + R * archPhi;                   // 70.2 degrees round the hook
  const seedA = rng.range(0, 100), seedB = rng.range(0, 100), Hmax = o.height;
  const spine = (s, out) => {
    if (s <= straight) { out.x = 210 - s; out.z = 0; out.tx = -1; out.tz = 0; out.nx = 0; out.nz = 1; }
    else { const p = (s - straight) / R, sn = Math.sin(p), cs = Math.cos(p); out.x = -70 - R * sn; out.z = 95 - R * cs; out.tx = -cs; out.tz = sn; out.nx = sn; out.nz = cs; }
    return out;
  };
  // height along the wave: a shoulder rising out of the sea at the far end, full height, a dying shoulder past the arch
  const Hof = (s) => {
    const a = smoothstep(0, 46, s), b = 1 - smoothstep(Ltot - 46, Ltot, s);
    const wob = 1 + 0.06 * n.n2(s * 0.012 + seedA, 3.1) + 0.025 * n.n2(s * 0.05, seedB);
    const hook = 1 + 0.14 * smoothstep(straight - 20, straight + 50, s) * (1 - smoothstep(Ltot - 95, Ltot - 40, s));      // round the hook, before the arch, the wall stands its highest
    return Math.max(1.2, Hmax * (0.04 + 0.96 * a) * (0.04 + 0.96 * b) * wob * hook);
  };
  const nearArch = (s) => 1 - smoothstep(14, 60, Math.abs(s - sArch));    // 1 at the arch: the wall stands thin and upright there
  const leanOf = (s) => lerp(1, 0.3, nearArch(s)), thickOf = (s) => lerp(1, 0.12, nearArch(s));
  const faceOff = (y, lean) => 1.0 - 8.8 * lean * Math.sin(Math.PI * Math.pow(clamp(y / 27, 0, 1), 0.8));         // y in 30 m units
  const backOff = (y, lean, th) => Math.min(faceOff(Math.min(y, 26), lean), -3) - (2.5 + 12 * th * (1 - y / 30));
  // rows of the cross-section, bottom of the apron -> up the face -> round the lip -> down the back
  const rows = [];
  for (const [off, y] of [[15, -2.4], [10.5, -2.0], [6.4, -1.4], [3.3, -0.5]]) rows.push({ k: 0, off, y, thin: 0, sag: 0, hol: 0 });   // the apron stays UNDER the world's sea, which owns the surface to the foot of the face
  const faceY = []; { const y0 = [1.2, 2.2, 3.3, 4.5, 5.8, 7.2, 8.6, 10, 11.4, 12.8, 14.2, 15.6, 17, 18.4, 19.8, 21.2, 22.5, 23.7, 24.8, 25.6, 26.2];
    for (let i = 0; i < y0.length; i++) { faceY.push(y0[i]); if (i > 0 && i < y0.length - 3) faceY.push((y0[i] + y0[i + 1]) / 2); } }
  for (const y of faceY) rows.push({ k: 1, y, thin: 0, sag: smoothstep(21, 26, y) * 0.25, hol: smoothstep(10.5, 19.5, y), deep: smoothstep(14.5, 25, y) });      // the hollow of the face, under the thrown lip: the buried amber shows, broad and deep, and deepest right under the overhang
  const lip = [[2.6, 26.5, 0.3, 0.45, 1], [4.6, 26.1, 0.6, 0.7, 0.9], [6.0, 25.4, 0.9, 0.9, 0.5], [7.0, 24.5, 1, 1, 0], [6.95, 25.5, 1, 1, 0], [6.1, 27.0, 0.75, 0.85, 0], [4.3, 28.3, 0.45, 0.6, 0], [1.6, 29.4, 0.2, 0.3, 0], [-1.4, 30, 0.05, 0.1, 0]];
  for (const [off, y, thin, sag, hol] of lip) rows.push({ k: 2, off, y, thin, sag, hol, deep: hol > 0.4 ? (thin < 0.5 ? 1 : 0.75) : 0 });
  for (const y of [29.2, 26, 19, 10, 1.5, -1.0]) rows.push({ k: 3, y, thin: 0, sag: 0, hol: 0 });
  const tipWob = (s) => 0.9 * n.n2(s * 0.09, seedA + 9) + 0.45 * n.n2(s * 0.37, seedB + 4);
  const sp = {};
  // point r of the cross-section at s -> out {x, y, z, off}; disp = false gives the smooth surface (for anchors)
  const point = (s, r, out, disp = true) => {
    const row = rows[r]; spine(s, sp);
    const H = Hof(s), h = H / 30, lean = leanOf(s), th = thickOf(s);
    let off, y;
    if (row.k === 0) { off = row.off + 1.0 * (h - 1) * 0; y = row.y; }
    else if (row.k === 1) { off = faceOff(row.y, lean) * Math.max(h, 0.25); y = row.y * h; }
    else if (row.k === 2) { off = row.off * Math.max(h, 0.25); y = row.y * h; const w = row.thin; off += w * 0.5 * tipWob(s + 31) * h; y += w * tipWob(s) * h; }
    else { off = backOff(row.y, lean, th) * Math.max(h, 0.25); y = row.y * h; }
    if (disp && row.k > 0) {
      const flute = 0.36 * Math.sin(s * 0.62 + 1.6 * n.n2(s * 0.05, y * 0.03 + seedA)) + 0.26 * n.n2(s * 0.13 + seedB, y * 0.07);
      const pour = 0.34 * n.n2(s * 0.035 + seedA, y * 0.11);
      const k = row.k === 2 ? 0.35 : 1;
      off += (flute + pour) * k * Math.min(1, h * 1.5); y += row.k === 2 ? 0 : 0.1 * n.n2(s * 0.11, y * 0.07 + seedB);
    }
    out.x = sp.x + sp.nx * off; out.z = sp.z + sp.nz * off; out.y = y; out.off = off;
    return out;
  };
  return { Hmax, straight, R, Ltot, sArch, archPhi, spine, Hof, rows, point, nearArch, faceOff, backOff, leanOf, thickOf, tipRow: 7, rootRow: 4 };
}

// smooth vertex normals in strips with a yield between them (the same sums as computeVertexNormals: no step of the build holds the page)
export async function waxNormals(ctx, g) {
  const pos = g.getAttribute('position').array, idx = g.index.array, nv = pos.length / 3, nor = new Float32Array(nv * 3);
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    const cx = pos[c] - pos[b], cy = pos[c + 1] - pos[b + 1], cz = pos[c + 2] - pos[b + 2], ax = pos[a] - pos[b], ay = pos[a + 1] - pos[b + 1], az = pos[a + 2] - pos[b + 2];
    const nx = cy * az - cz * ay, ny = cz * ax - cx * az, nz = cx * ay - cy * ax;
    nor[a] += nx; nor[a + 1] += ny; nor[a + 2] += nz; nor[b] += nx; nor[b + 1] += ny; nor[b + 2] += nz; nor[c] += nx; nor[c + 1] += ny; nor[c + 2] += nz;
    if (i % 9000 === 8997) await ctx.yield();
  }
  for (let i = 0; i < nv; i++) {
    const k = i * 3, l = Math.hypot(nor[k], nor[k + 1], nor[k + 2]) || 1; nor[k] /= l; nor[k + 1] /= l; nor[k + 2] /= l;
    if (i % 20000 === 19999) await ctx.yield();
  }
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return g;
}

async function buildWallGeometry(ctx, shape, arch) {
  const colS = []; { let s = 0; while (s < shape.Ltot - 0.6) { colS.push(s); s += (s > 92 && s < shape.sArch + 26) ? 1 : 2; } colS.push(shape.Ltot); }
  const cols = colS.length - 1, nr = shape.rows.length, nv = (cols + 1) * nr;
  const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), tan = new Float32Array(nv * 3);
  const thin = new Float32Array(nv), hol = new Float32Array(nv), force = new Float32Array(nv), sag = new Float32Array(nv);
  const curl = new Float32Array(nv), Q = {};                              // the curl depth of each point of the wall (the amber belly), and the row's smooth point it is measured against
  const P = {}, sp = {}, n = ctx.noise;
  for (let c = 0; c <= cols; c++) {
    const s = colS[c]; shape.spine(s, sp);
    let arc = 0, px = 0, py = 0, pz = 0;
    for (let r = 0; r < nr; r++) {
      const i = c * nr + r, row = shape.rows[r]; shape.point(s, r, P);
      if (r > 0) arc += Math.hypot(P.x - px, P.y - py, P.z - pz);
      px = P.x; py = P.y; pz = P.z;
      pos[i * 3] = P.x; pos[i * 3 + 1] = P.y; pos[i * 3 + 2] = P.z;
      uv[i * 2] = s; uv[i * 2 + 1] = arc;
      tan[i * 3] = sp.tx; tan[i * 3 + 1] = 0; tan[i * 3 + 2] = sp.tz;
      // distance from the arch axis: the wall round the arch is thin, honey-bright and still running
      const dx = P.x - arch.p.x, dy = P.y - arch.p.y, dz = P.z - arch.p.z, al = dx * arch.d.x + dy * arch.d.y + dz * arch.d.z;
      const ra = Math.hypot(dx - arch.d.x * al, dy - arch.d.y * al, dz - arch.d.z * al);
      const ar = Math.abs(al) < 26 ? 1 - smoothstep(arch.r + 0.8, arch.r + 5.4 + 2.2 * n.n2(s * 0.2, P.y * 0.2), ra) : 0;      // (thin for some four metres round the rim, ending in lobes: beyond it the breaker's own cream face)
      thin[i] = Math.max(row.thin, ar * 0.9);
      hol[i] = (clamp(row.hol * (0.78 + 0.3 * n.n2(s * 0.045, P.y * 0.05)) + (row.k === 1 ? 0.3 * smoothstep(0.35, 0.7, n.n2(s * 0.021 + 5, P.y * 0.09)) : 0), 0, 1) + (row.deep || 0) * Math.min(shape.Hof(s) / shape.Hmax, 1)) * (1 - ar);      // (above 1: the deep of the hollow, under the thrown lip; a low shoulder has no deep)
      force[i] = Math.abs(al) < 26 ? 1 - smoothstep(arch.r + 1.5, arch.r + 6, ra) : 0;
      sag[i] = row.sag;
      // the curl depth (the amber belly): how deep this point lies in the hollow under the thrown lip, by the section alone (the same from every eye; it reads
      // neither the sun nor the camera). On the face 0 at 8.6 and 1 at 17.6 of the section's 30 m units (9.4 m and 19.1 m above the sea where the wave stands
      // 32.6 m); 1 on the lip's underside; a quarter more down a flute's channel and a quarter less on the land between (how far the row's point lies behind
      // its smooth point, over 0.6 m); then the factors of the deep above: the wave's height and the arch's rim, and the lean (the upright wall by the arch has no hollow)
      const c0 = row.k === 1 ? clamp((row.y - 8.6) / 9.0, 0, 1) : (row.k === 2 && row.hol > 0.4 ? 1 : 0);
      if (c0 > 0) { shape.point(s, r, Q, false); curl[i] = (c0 + 0.25 * clamp((Q.off - P.off) / 0.6, -1, 1)) * Math.min(shape.Hof(s) / shape.Hmax, 1) * (1 - ar) * smoothstep(0.3, 0.5, shape.leanOf(s)); }
    }
    if (c % 2 === 1) await ctx.yield();
  }
  await ctx.yield();
  const idx = new Uint32Array(cols * (nr - 1) * 6); let k = 0;
  for (let c = 0; c < cols; c++) for (let r = 0; r < nr - 1; r++) { const a = c * nr + r, b = a + nr; idx[k++] = a; idx[k++] = a + 1; idx[k++] = b; idx[k++] = b; idx[k++] = a + 1; idx[k++] = b + 1; }
  const g = new THREE.BufferGeometry();
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('aTan', new THREE.BufferAttribute(tan, 3)); g.setAttribute('aThin', new THREE.BufferAttribute(thin, 1));
  g.setAttribute('aHollow', new THREE.BufferAttribute(hol, 1)); g.setAttribute('aForce', new THREE.BufferAttribute(force, 1));
  g.setAttribute('aSag', new THREE.BufferAttribute(sag, 1));
  g.setAttribute('aCurl', new THREE.BufferAttribute(curl, 1));
  await ctx.yield();
  await waxNormals(ctx, g);
  return g;
}

// the arch liner (a rounded rim joining face and back round the melted hole) and the heaped swell under it
async function buildArchGeometry(ctx, shape, arch) {
  const n = ctx.noise, seg = 64, prof = 9, pos = [], uv = [], tan = [], thin = [], hol = [], force = [], sag = [], idx = [];
  const P = {}, sp = {}; shape.spine(shape.sArch, sp);
  const H = shape.Hof(shape.sArch), h = H / 30, d = arch.d, rt = arch.right, up = arch.up, r0 = arch.r;
  const offAt = (s, y, back) => (back ? shape.backOff(y / h, shape.leanOf(s), shape.thickOf(s)) : shape.faceOff(y / h, shape.leanOf(s))) * h;
  for (let i = 0; i <= seg; i++) {
    const th = (i / seg) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
    const wob = 1 + 0.03 * n.n2(c * 2.2 + 7, sn * 2.2) + 0.018 * n.n2(c * 7 + 3, sn * 7);
    for (let j = 0; j < prof; j++) {
      const rad = (r0 + [2.7, 1.5, 0.35, 0.0, 0.15, 0.0, 0.35, 1.5, 2.7][j]) * (j === 1 || j === 7 ? 1 + (wob - 1) * 2.5 : wob);
      const l = -rad * c, y = arch.p.y + rad * sn, s = shape.sArch + l, bend = (l * l) / (2 * shape.R);
      const fo = offAt(s, y, false) + bend, bo = offAt(s, y, true) + bend;
      const off = [fo - 0.7, fo + 1.0, fo + 1.25, fo - 0.1, (fo + bo) / 2, bo + 0.1, bo - 1.25, bo - 1.0, bo + 0.7][j];
      const a = -(off - arch.seatOff);                                   // metres along the axis (d is about -normal)
      pos.push(arch.p.x + rt.x * rad * c + up.x * rad * sn + d.x * a, arch.p.y + rt.y * rad * c + up.y * rad * sn + d.y * a, arch.p.z + rt.z * rad * c + up.z * rad * sn + d.z * a);
      uv.push(a + 300, r0 * Math.acos(clamp(sn, -1, 1)) + 500); tan.push(d.x, d.y, d.z);
      thin.push(j === 0 || j === 8 ? 0.85 : 1); hol.push(0); force.push(2); sag.push(0);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < prof - 1; j++) { const a = i * prof + j, b = a + prof; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  await ctx.yield();
  // the heaped swell: clear wax climbing 4 degrees to 7.1 m at the wall, under and through the arch
  const base = pos.length / 3, na = 60, nl = 36, tanA = Math.tan(arch.climb), dh = new THREE.Vector3(d.x, 0, d.z).normalize();
  const g0 = new THREE.Vector3(arch.p.x, 0, arch.p.z), top = arch.p.y - 2.4;
  for (let i = 0; i <= na; i++) {
    const a = -118 + (i / na) * 126;
    const crest = a > -70 ? top + Math.min(a, 2.5) * tanA - smoothstep(2.5, 8, a) * 9 : (top - 70 * tanA) * smoothstep(-118, -70, a) ** 1.4;
    const sig = lerp(21, 11.5, smoothstep(-110, -8, a));
    for (let j = 0; j <= nl; j++) {
      const l = (j / nl - 0.5) * 2 * 36, lw = l + (4.2 * n.n2(a * 0.085, l * 0.03 + 3.1) + 2.2 * n.n2(a * 0.21 + 9, l * 0.05)) * smoothstep(5, 14, Math.abs(l)), e = Math.exp(-(lw * lw) / (sig * sig));      // the flanks run out in tongues
      const edge = Math.max(smoothstep(24, 36, Math.abs(l)), 1 - smoothstep(-118, -100, a));
      const y = crest * e + 0.35 * n.n2(a * 0.06, l * 0.08) * e - 1.1 * edge;
      pos.push(g0.x + dh.x * a + rt.x * l, y, g0.z + dh.z * a + rt.z * l);
      uv.push(l + 700, a + 900); tan.push(rt.x, 0, rt.z); thin.push(0); hol.push(0); force.push(2); sag.push(0);
    }
    if (i % 12 === 11) await ctx.yield();
  }
  for (let i = 0; i < na; i++) for (let j = 0; j < nl; j++) { const a = base + i * (nl + 1) + j, b = a + nl + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  await ctx.yield();
  const g = new THREE.BufferGeometry(); g.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1));
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aTan', new THREE.Float32BufferAttribute(tan, 3)); g.setAttribute('aThin', new THREE.Float32BufferAttribute(thin, 1));
  g.setAttribute('aHollow', new THREE.Float32BufferAttribute(hol, 1)); g.setAttribute('aForce', new THREE.Float32BufferAttribute(force, 1));
  g.setAttribute('aSag', new THREE.Float32BufferAttribute(sag, 1));
  g.setAttribute('aCurl', new THREE.BufferAttribute(new Float32Array(sag.length), 1));      // (the liner and the heaped swell share the wall's material: no curl depth, all zeros)
  await ctx.yield();
  await waxNormals(ctx, g);
  return g;
}

// one teardrop: xz = ring direction * profile radius (in widths), y = t along (0 root .. 1 tip); the shader gives it its length
export function dripGeometry(sides, rings) {
  const pos = [], nor = [], idx = [], nr = rings.length;
  for (let r = 0; r < nr; r++) for (let k = 0; k < sides; k++) {
    const a = (k / sides) * Math.PI * 2 + r * 0.4, [t, rad] = rings[r];
    pos.push(Math.cos(a) * rad, t, Math.sin(a) * rad);
    const sl = r === 0 ? 0.6 : (r === nr - 1 ? -0.5 : 0); const m = Math.hypot(1, sl);
    nor.push(Math.cos(a) / m, sl / m, Math.sin(a) / m);
  }
  pos.push(0, 1, 0); nor.push(0, -1, 0);
  for (let r = 0; r < nr - 1; r++) for (let k = 0; k < sides; k++) { const a = r * sides + k, b = r * sides + (k + 1) % sides; idx.push(a, b, a + sides, b, b + sides, a + sides); }
  const tip = nr * sides; for (let k = 0; k < sides; k++) idx.push((nr - 1) * sides + k, (nr - 1) * sides + (k + 1) % sides, tip);
  const g = new THREE.InstancedBufferGeometry(); g.setIndex(idx);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}

// drips and drops share the wax material; these are their vertex stages (per-instance: iPos anchor, iA = length, width, phase, sag weight; iB = rnd, -, -, force)
export const DRIP_DECL = /* glsl */`attribute vec3 iPos; attribute vec4 iA, iB;`;
const DRIP_VERT = /* glsl */`
  vec3 aw = (M*vec4(iPos, 1.)).xyz; vec4 f0 = waxField(aw + vec3(-uSunShift.x, 0., -uSunShift.y)*14.);
  float fz = iB.w, sunM = waxSunM(f0, fz), sg = waxSag(sunM), ph = iA.z;
  float grow = max(clamp(f0.r/40., 0., 1.), 1. - smoothstep(.25, .75, f0.a));      // lengthens for five seconds behind the edge, then hardens; in sun it is as long as the shade left it
  float thr = step(iB.x, .45)*(1. - fz);                             // a share of the fringe does not let go for a long while: it draws out to a thread, a bead at its tip
  float t1 = clamp((sunM - 2. - ph*16.)/9., 0., 1.), t2 = clamp((sunM - mix(11., 70., thr) - ph*mix(16., 50., thr))/mix(3., 9., thr), 0., 1.);   // in sun: stretch to a thread, let go
  float cyc = fract(uTime*(.16 + .12*iB.x) + ph*7.);
  float cg = min(cyc/.85, (1. - cyc)/.15);                           // a molten stub beads, lengthens and lets go, eased
  float Lm = mix(iA.x*(.22 + .42*cg*cg), iA.x*(.74 + .26*sin(uTime*(.5 + .4*iB.x) + ph*40.)), fz);   // the arch's ropes stay long, breathing
  float L = mix(iA.x*(.22 + .78*grow)*(1. + (.8 + .7*thr)*t1*t1), Lm, t2);
  float pix = distance(aw, cameraPosition)*.0011;                    // never thinner than a pixel and a half
  float w = max(iA.y, pix), bead = w*(1. + .35*t1)*mix(1., .55 + .6*cg, t2);
  float bl = min(bead*2.6, L*.75), t = position.y, isB = step(.6, t);
  float yl = mix((t/.6)*(L - bl), (L - bl) + (t - .6)/.4*bl, isB);
  float rr = mix(max(w*(1. - (.6 + .15*thr)*t1*(1. - t2)), pix*1.2), bead*(1. + .25*thr*t1), isB);
  p = iPos + vec3(position.x*rr, -yl - 3.*iA.w*sg, position.z*rr);
  float sw = (1. - waxSet(f0, fz))*t*t*L;
  p.x += sin(uTime*1.3 + ph*40.)*.05*sw; p.z += cos(uTime*1.1 + ph*31.)*.05*sw;
  thin = mix(.85, .35, isB); hollow = 0.; force = fz; tg = vec3(1., 0., 0.);
  s = vec2(ph*97. + position.x, yl + iB.x*31.);
`;
const DROP_VERT = /* glsl */`
  vec3 aw = (M*vec4(iPos, 1.)).xyz; vec4 f0 = waxField(aw + vec3(-uSunShift.x, 0., -uSunShift.y)*14.);
  float fz = iB.w, sunM = waxSunM(f0, fz), sg = waxSag(sunM), ph = iA.z;
  float show = smoothstep(3., 12., sunM - ph*16.)*(1. - smoothstep(70., 110., sunM)*.75);
  float cyc = fract(uTime/(2.4 + 1.6*iB.x) + ph*5.);
  float tf = max(cyc - .25, 0.)/.75;
  float pix = distance(aw, cameraPosition)*.0011;
  float sc = smoothstep(0., .25, cyc)*(1. - smoothstep(.92, 1., cyc))*show*max(iA.y, pix);
  p = iPos + vec3(position.x*sc, -position.y*sc*2.6*(1. + 1.8*tf) - .3 - 3.*iA.w*sg - iA.x*tf*tf, position.z*sc);
  thin = .9; hollow = 0.; force = 1.; tg = vec3(1., 0., 0.); s = vec2(ph*97., position.y);
`;

export function instAttrs(g, list, count) {
  const n = list.length, P = new Float32Array(n * 3), A = new Float32Array(n * 4), B = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const d = list[i]; P.set(d.p, i * 3); A.set(d.a, i * 4); B.set(d.b, i * 4); }
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(P, 3)); g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4));
  g.instanceCount = Math.min(n, count);
  return g;
}

// where the drips hang: the lip's thrown edge and underside along the whole wave, the arch's front rim; returns { far, near, drops }
async function placeDrips(ctx, shape, arch, detail) {
  const rng = ctx.rng.fork ? ctx.rng.fork('drips') : ctx.rng, n = ctx.noise, P = {}, far = [], near = [], drops = [];
  const tip = shape.rows.findIndex((r) => r.thin === 1), Hm = shape.Hmax;
  const one = (s, nearK) => {
    const hK = shape.Hof(s) / Hm, u = rng(), row = u < 0.62 ? tip : (u < 0.8 ? tip - 1 : (u < 0.92 ? tip - 2 : tip + 1));
    shape.point(s, row, P);
    const stretch = 0.35 + 0.65 * smoothstep(-0.5, 0.6, n.n2(s * 0.045, 17.3)) + 0.25 * n.n2(s * 0.4, 3.3);   // the fringe runs long and short in stretches
    const len = (0.5 + 3.5 * Math.pow(rng(), 1.25)) * clamp(stretch, 0.42, 1.15) * Math.max(hK, 0.3) * (row === tip ? 1 : 0.6);
    const width = (0.085 + 0.12 * rng() + len * 0.03) * (nearK ? 1 : 1.15);
    return { p: [P.x + rng.range(-0.15, 0.15), P.y + 0.12, P.z + rng.range(-0.15, 0.15)], a: [len, width, rng(), shape.rows[row].sag], b: [rng(), 0, 0, 0], y: P.y };
  };
  const nFar = 2730, nNearLip = 300;
  for (let i = 0; i < nFar; i++) {
    let s = rng.range(22, shape.Ltot - 6); if (rng() > shape.Hof(s) / Hm + 0.15) s = rng.range(70, shape.Ltot - 40);
    far.push(one(s, false)); if (i % 60 === 59) await ctx.yield();
  }
  for (let i = 0; i < nNearLip; i++) near.push(one(rng.range(120, 235), true));
  await ctx.yield();
  // the arch: ropes and beads on the upper front rim, still running
  const h = shape.Hof(shape.sArch) / 30, rimAt = (th, radAdd) => {
    const rad = arch.r + radAdd, c = Math.cos(th), sn = Math.sin(th), l = -rad * c, y = arch.p.y + rad * sn, s = shape.sArch + l;
    const fo = shape.faceOff(y / h, shape.leanOf(s)) * h + (l * l) / (2 * shape.R), a = -(fo + 1.32 - arch.seatOff);
    return [arch.p.x + arch.right.x * rad * c + arch.up.x * rad * sn + arch.d.x * a, arch.p.y + arch.right.y * rad * c + arch.up.y * rad * sn + arch.d.y * a, arch.p.z + arch.right.z * rad * c + arch.up.z * rad * sn + arch.d.z * a];
  };
  for (let i = 0; i < 250; i++) {
    const th = rng.range(0.04, Math.PI - 0.04), side = Math.abs(Math.cos(th)), p = rimAt(th, rng.range(-0.05, 1.2));
    const len = 0.5 + Math.pow(rng(), 1.3) * lerp(1.9, 4.2, side * side);   // short over the opening, long ropes down the sides
    near.push({ p, a: [len, 0.08 + 0.1 * rng() + len * 0.015, rng(), 0], b: [rng(), 0, 0, 1], y: p[1] });
  }
  for (let i = 0; i < 950; i++) { const d = one(rng() < 0.84 ? rng.range(140, 332) : rng.range(40, shape.Ltot - 20), false); d.a = [Math.max(d.y - 3.4, 2) * (0.35 + 0.65 * rng()), 0.17 + 0.16 * rng(), rng(), d.a[3]]; drops.push(d); if (i % 60 === 59) await ctx.yield(); }      // caught at every height of the fall, big enough to count from the boat
  for (let i = 0; i < 110; i++) { const sd = rng() < 0.5 ? -1 : 1, th = Math.PI / 2 + sd * rng.range(0.62, 1.25), p = rimAt(th, rng.range(0, 0.8)); drops.push({ p, a: [Math.max(p[1] - 6.6, 1.5), 0.06 + 0.05 * rng(), rng(), 0], b: [rng(), 0, 0, 1] }); }
  const sh = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; };
  return { far: sh(far), near: sh(near), drops: sh(drops), counts: [Math.round(nFar * detail), Math.round(near.length * detail), Math.round(drops.length * detail)] };
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = clamp(opts.detail ?? 1, 0.5, 1);
  const own = !opts.style, style = opts.style || createWaxStyle(ctx, { palette: opts.palette });
  const U = style.uniforms;
  const shape = makeBreakerShape(ctx, { sweep: rng.range(1.6, 1.76), height: rng.range(31.5, 34) });
  // the arch: melted through the hook 70 degrees round, met head-on, climbing 4 degrees
  const sp = shape.spine(shape.sArch, {}), climb = 4 * Math.PI / 180, seatOff = -4.0;
  const d = new THREE.Vector3(-sp.nx * Math.cos(climb), Math.sin(climb), -sp.nz * Math.cos(climb));
  const right = new THREE.Vector3(-d.z, 0, d.x).normalize(), up = new THREE.Vector3().crossVectors(right, d).normalize();
  const arch = { p: new THREE.Vector3(sp.x + sp.nx * seatOff, 9.5, sp.z + sp.nz * seatOff), d, right, up, r: 7.5, climb, seatOff };
  await ctx.yield();

  const object = new THREE.Group(); object.name = 'standing-breaker';
  // painted fish in the clear foot of the face (the sea climbing it): each keeps its own stretch of the foot, gliding to and fro; seen only where the foot has
  // gone clear. (s along the wave, arc up the section, length, heading +1/-1); their own stream. The last one lies in the heaped swell under the arch.
  const NWF = 6, fishRng = ctx.core ? ctx.core.makeRng(ctx.core.hashSeed('foot-fish:' + ctx.seed)) : rng, fishHome = [];
  { const P = {}; let arc = 0, px = 0, py = 0, pz = 0, arcFoot = 19; const hS = shape.Hof(150) / 30;
    for (let r = 0; r < shape.rows.length; r++) { shape.point(150, r, P, false); if (r > 0) arc += Math.hypot(P.x - px, P.y - py, P.z - pz); px = P.x; py = P.y; pz = P.z; if (shape.rows[r].k === 1 && P.y <= 2.3 * hS) arcFoot = arc; }
    for (let i = 0; i < NWF - 1; i++) fishHome.push([55 + (i + fishRng.range(0.2, 0.8)) * 220 / (NWF - 1), arcFoot + fishRng.range(-0.3, 0.3), fishRng.range(6, 9), fishRng() < 0.75 ? -1 : 1, fishRng.range(0, 6.28)]);
    fishHome.push([700 + fishRng.range(-7, 3), 900 - fishRng.range(38, 62), fishRng.range(6, 8), 1, fishRng.range(0, 6.28)]); }
  const fish = { value: fishHome.map((f) => new THREE.Vector4(f[0], f[1], f[2], f[3])) };
  const archP = { value: arch.p.clone() }, archD = { value: arch.d.clone() };
  const wallMat = style.material({
    clearM: 15, detail: 1, groove: 2.3, grooveW: 1.9, refl: 0.32, bodyBias: 0.08, uniforms: { uArchP: archP, uArchD: archD, uFish: fish, ...(opts.swellUniforms || {}) },
    vertexDecl: 'attribute float aSag; attribute float aCurl;',
    vertexPos: 'vec4 fv = waxField((M*vec4(p, 1.)).xyz + vec3(-uSunShift.x, 0., -uSunShift.y)*(14.*thin)); p.y -= 3.*aSag*waxSag(waxSunM(fv, min(force, 1.))); xv = aCurl;',
    fragDecl: 'uniform vec3 uArchP, uArchD; uniform vec4 uFish[' + NWF + '];' + WAX_WEED_GLSL + (opts.swellDecl || ''),
    fragPre: 'if (vK.z < 1.5) { vec3 q = vW - uArchP; float al = dot(q, uArchD); if (abs(al) < 26. && length(q - uArchD*al) < 7.62) discard; }',
    fragMid: 'if (force > 1.5) detail = 0.; force = min(force, 1.); if (thin > .01) fld = waxField(vW + vec3(-uSunShift.x, 0., -uSunShift.y)*(14.*smoothstep(0., .5, thin))); fld.a = smoothstep(.435, .565, fld.a);'
      // only the foot of the face goes clear (the sea climbing it): below a crisp poured line with short tongues; above it the wall is thick wax, which glosses and slumps but never clears
      + ' float footY = 3.7 + 1.3*(wxF(vec2(s.x*.19, 3.7)) - .5) + .5*(wxN(vec2(s.x*1.1, 9.)) - .5), footW = max(fwidth(vW.y)*.8, .02), footK = vK.z < 1.5 ? 1. - smoothstep(-footW, footW, vW.y - footY) : 0.; if (vK.z < 1.5) clearM = mix(400., 7., footK);'
      // the far shoulder (past the arch, seen beside the sail on the run in): its wall keeps cold down to the sea, as the wall on the other side of the arch stands, so no
      // sheet of clear wax and no shadow line ruled across it; the honey of the surround and of the lip ends in a poured, lobed edge (not a fade across vertices)
      + /* glsl */` float hw = max(fwidth(vK.x)*.75, .02);
      if (vK.z < 1.5 && s.x > ${(shape.sArch - 1).toFixed(3)}) {
        float hn = wxF(s*vec2(.3, .21) + 5.) - .5, far = smoothstep(-.4, .4, s.x - ${(shape.sArch + 5).toFixed(3)} + hn*4.);
        float hq = thin - .22 + hn*.5, he = smoothstep(-hw, hw, hq), ht = smoothstep(-hw, hw, hq + 3.*hw);
        if (far*ht > .5 && thin < .34) { fld = waxField(vW + vec3(-uSunShift.x, 0., -uSunShift.y)*(14.*smoothstep(0., .5, .34))); fld.a = smoothstep(.435, .565, fld.a); }   // inside the edge the wax is all honey-thin: it looks as far up-sun as thin wax does
        float hold = far*(1. - he);
        thin = mix(thin, max(thin, .34)*ht, far);
        fld.a = max(fld.a, hold); force *= 1. - hold; }`,
    fragPost: /* glsl */`
      { float heap = step(1.5, vK.z)*(1. - smoothstep(.15, .4, thin));     // the heaped swell under the arch: a world may shade it as its own sea (opts.swellFrag)
        ${opts.swellFrag || ''}
        vec3 Bq = cross(N, T); vec2 par = vec2(dot(V, T), dot(V, Bq))/max(dot(V, N), .35);
        float ew = fwidth(s.x) + fwidth(s.y), stW = waxSet(fld, force), sunW = waxSunM(fld, force), fcA = 0.;
        { // the amber belly: the hollow shows the buried amber more fully the deeper a point lies in the curl (vX: the curl depth, by the section alone), in three
          // poured steps whose made, lobed edges run down the flutes as tongues. On set wax only (where the lane has melted the wall it ends as the set wax ends);
          // not on a stylus groove (each runs on through it as an umber line), not where the first umber step stands (worked here as waxShade works it), not on
          // thin wax, not on the heaped swell. Nothing here is darker than the amber itself; on the third step each brush land carries the furrows' paler tone.
          vec2 cfw = fwidth(s) + 1e-5; float cfm = max(cfw.x, cfw.y), cq = vX + (wxF(s*vec2(.21, .13) + 211.) - .5)*.2, ce = max(fwidth(cq)*.8, .004);
          if (vX > 0. && vK.z < 1.5) {
            float b1 = smoothstep(.2 - ce, .2 + ce, cq), b2 = smoothstep(.5 - ce, .5 + ce, cq), b3 = smoothstep(.8 - ce, .8 + ce, cq);
            float dn = (wxF(s*vec2(.22, .11) + 151.) - .5)*.34 + (wxN(s*vec2(1.7, .3) + 9.) - .5)*.08, de = max(cfm*.8, .02);
            float d1 = smoothstep(.22 - de, .22 + de, clamp(hollow - 1., 0., 1.) + dn);
            float gl = uGrooveSp > 0. ? waxGroove(s, uGrooveSp, cfw)*(1. - smoothstep(170., 250., dist))*detail : 0.;
            float cbw = wxN(s*vec2(.8, .09))*2.6 + wxN(s*vec2(.21, .04) + 9.)*6., cbg = abs(sin((s.x*7.4 + cbw*.55)*.5)), cpe = max(cfw.x*1.4, .02);
            float crn = smoothstep(.88 - cpe, .88 + cpe, cbg)*(1. - smoothstep(.45, 1.3, cfm))*detail*b3;
            col = mix(col, waxVeil(mix(uAmber, mix(uAmber, uHoney, .25), crn*.5), dist), (.35*b1 + .35*b2 + .3*b3)*(1. - gl)*(1. - d1)*(1. - smoothstep(.07, .3, thin))*stW); } }
        // the gloss line: where the lane's light has just reached the wall the first film of melt is thin and the sun stands in it: one bright honey line climbing the face
        col = mix(col, waxVeil(mix(uHoney, uCream, .22)*1.3, dist), 4.*stW*(1. - stW)*.9*(1. - smoothstep(0., .3, thin))*(1. - step(1.5, vK.z)));
        if (vK.z < 1.5 && thin > .2) {                                       // round the arch the thin wax still runs: slow ropes round the rim, standing in relief (a crease, a lit shoulder), and beads on them, each with its glint
          vec3 qa = vW - uArchP; float ala = dot(qa, uArchD); vec3 rv = qa - uArchD*ala; float ra = length(rv);
          if (abs(ala) < 26. && ra < 20.) {
            float ang = atan(dot(rv, normalize(cross(uArchD, vec3(0., 1., 0.)))), rv.y), pe = max(fwidth(ra), 1e-3);
            float ph = (ra - 7.6)*1.15 + (wxN(vec2(ang*3., ra*.4) + 5.) - .5)*1.4 - uTime*.05, rl = fract(ph) - .5;
            float rK = smoothstep(.2, .45, thin)*(1. - smoothstep(.5, 1.6, pe));
            col = mix(col, waxVeil(mix(uAmber, uUmber, .22), dist), (1. - smoothstep(.07, .07 + pe*1.2, abs(rl + .3)))*.6*rK);
            col = mix(col, waxVeil(mix(uHoney, uCream, .6)*1.15, dist), (1. - smoothstep(.06, .06 + pe*1.2, abs(rl - .1)))*.5*rK);
            vec2 bq = vec2(ang*ra*.8, ph), bc = floor(bq), bf = fract(bq) - .5 - (vec2(wxH(bc + 3.), wxH(bc + 17.)) - .5)*.4;
            float br = .2 + .14*wxH(bc + 7.), bon = step(.5, wxH(bc + 29.))*rK;
            col = mix(col, waxVeil(mix(uHoney, uAmber, .6), dist), (1. - smoothstep(br - pe, br + pe, length(bf)))*bon*.75);
            col = mix(col, waxVeil(uGlint*.6, dist), (1. - smoothstep(.05, .05 + pe, length(bf - vec2(.07, .08))))*bon); } }
        { float visF = max(footK, heap)*(1. - stW)*smoothstep(2.5, 8., sunW)*(1. - thin);
          if (visF > .003) {
            // the top of the clear foot: thin clear wax over the cream, pale, then deep at once
            col = mix(col, waxVeil(mix(uTurq, uBlue, .55), dist), footK*visF*smoothstep(footY - .5, footY - .08, vW.y)*.75);
            for (int i = 0; i < ${NWF}; i++) { vec4 fi = uFish[i]; vec2 fq = s - fi.xy - par*.6; fq.x *= fi.w;
              vec4 fc = waxFish(fq, fi.z, uTime + float(i)*1.7, ew/max(fi.z, .1));
              col = mix(col, waxVeil(fc.rgb, dist), fc.a*visF*.94); fcA = max(fcA, fc.a); } } }
        if (vK.z > 1.5 && thin < .4 && ${opts.swellFrag ? 'false' : 'true'}) {                                   // the heaped swell is clear to its painted layer: weed under the boat as it climbs
          vec4 wd = seaWeed(s - par*1.6, ew);
          col = mix(col, waxVeil(wd.rgb, dist), wd.a*.6*(1. - smoothstep(.25, .9, ew))*(1. - fcA)*(1. - thin*2.5)); } }`,
  });
  const wall = new THREE.Mesh(await buildWallGeometry(ctx, shape, arch), wallMat); wall.name = 'wall';
  await ctx.yield();
  const archMesh = new THREE.Mesh(await buildArchGeometry(ctx, shape, arch), wallMat); archMesh.name = 'arch';
  object.add(wall, archMesh);
  await ctx.yield();

  const dr = await placeDrips(ctx, shape, arch, detail);
  await ctx.yield();
  const dripMat = style.material({ clearM: 6, detail: 0, side: THREE.DoubleSide, vertexDecl: DRIP_DECL, vertexPos: DRIP_VERT });
  const dropMat = style.material({ clearM: 3, detail: 0, side: THREE.DoubleSide, vertexDecl: DRIP_DECL, vertexPos: DROP_VERT });
  const mk = (geo, list, count, mat, name) => { const m = new THREE.Mesh(instAttrs(geo, list, count), mat); m.frustumCulled = false; m.name = name; object.add(m); return m; };
  mk(dripGeometry(3, [[0, 1.5], [0.6, 0.5], [0.85, 1.0]]), dr.far, dr.counts[0], dripMat, 'fringe');
  await ctx.yield();
  mk(dripGeometry(5, [[0, 1.5], [0.14, 0.8], [0.6, 0.5], [0.76, 0.9], [0.88, 1.0]]), dr.near, dr.counts[1], dripMat, 'fringe-near');
  await ctx.yield();
  mk(dripGeometry(3, [[0, 0.05], [0.42, 0.4], [0.68, 0.93], [0.84, 0.93], [0.95, 0.55]]), dr.drops, dr.counts[2], dropMat, 'drops');      // a teardrop: round below, a tail above
  await ctx.yield();

  // standalone: the piece bakes a field of its own (all shade but the lane arriving along the face); a world passes opts.style and owns the field
  const U0 = 0.6; let prog = opts.progress ?? U0;
  if (own) {
    style.setSun(new THREE.Vector3(-0.173, 0.743, 0.646));          // the world's sun, in this piece's own frame
    const tex = await bakeWaxField(ctx, (fu, fv) => {
      const x = -fv, z = fu, uA = 0.44 + ((210 - x) / 280) * 0.32;
      const z0 = 320 * (uA - U0) - 11 + 420 * smoothstep(-50, -105, x);
      return Math.max(z0 - z, z - (z0 + 64));
    });
    style.setField(tex, 1600);
    style.setFieldXf(-Math.PI / 2, 320 * (prog - U0), 0);
  }

  if (opts.sea ?? own) {                                             // a level preview sea so the piece can be judged alone; a world passes sea: false
    const sg = new THREE.PlaneGeometry(1600, 1600, 1, 1); sg.rotateX(-Math.PI / 2);
    const suv = sg.getAttribute('uv'), sp2 = sg.getAttribute('position');
    for (let i = 0; i < suv.count; i++) suv.setXY(i, sp2.getX(i), sp2.getZ(i));
    sg.setAttribute('aTan', new THREE.Float32BufferAttribute([1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0], 3));
    const sea = new THREE.Mesh(sg, style.material({ clearM: 3, detail: 1 })); sea.position.y = -0.35; sea.name = 'preview-sea'; object.add(sea);
  }

  const L = (x, y, z) => new THREE.Vector3(x, y, z);
  const seat = arch.p.clone(), back = d.clone().multiplyScalar(-1);
  const anchors = {
    worldPlacement: { position: L(-165, 0, 540), rotationY: Math.PI / 2 },
    portalSeat: { position: seat, facing: back, direction: d.clone(), radius: 7, hole: 7.5 },
    archAxis: { point: seat.clone(), dir: d.clone(), waxY: seat.y - 2.4 },
    flyThrough: [L(196, 2.4, 20), L(140, 2.4, 15), L(70, 2.4, 9.5), L(20, 2.4, 10.5), L(-25, 2.5, 22), L(-62, 3.1, 52), seat.clone().addScaledVector(d, -70), seat.clone().addScaledVector(d, -35), seat.clone()],
    viewpoints: {
      wall: { eye: L(260, 2.4, 60), look: L(60, 16, 0) },
      face: { eye: L(70, 2.4, 9.5), look: L(52, 9, -5) },
      lip: { eye: L(40, 2.4, 10), look: L(15, 26, 4) },
      arch: { eye: seat.clone().addScaledVector(d, -42), look: seat.clone() },
    },
    fringeLine: Array.from({ length: 41 }, (_, i) => { const P = {}; shape.point(shape.Ltot * (0.03 + 0.94 * i / 40), shape.rows.findIndex((r) => r.thin === 1), P, false); return L(P.x, P.y, P.z); }),
    footLine: (s, out = new THREE.Vector3()) => { const q = shape.spine(clamp(s, 0, shape.Ltot), {}); return out.set(q.x, 0, q.z); },
    length: shape.Ltot,
  };

  const view = { center: L(50, 11, 0), radius: 62, height: 16 };         // what the set-piece viewer orbits: the lit stretch of the face (true size in `size`)

  const _m = new THREE.Matrix3();
  return {
    object, radius: view.radius, height: view.height, center: view.center, anchors, style, fish, size: { length: shape.Ltot, radius: 230, height: shape.Hmax }, ground: false, groundY: 0,
    setProgress(u) { prog = u; if (own) style.setFieldXf(-Math.PI / 2, 320 * (u - U0), 0); },
    update(dt, time) {
      if (own) style.update(time);
      for (let i = 0; i < NWF; i++) {                                       // each glides head first along its own 44 m of the foot, going down under the sea's line at the stretch's ends (the one in the heap hovers)
        const f = fishHome[i], ph = (time * 0.45 + f[4] * 7) / 44, pos = i < NWF - 1 ? (ph - Math.floor(ph) - 0.5) * 44 : 1.2 * Math.sin(time * 0.19 + f[4]);
        fish.value[i].x = f[0] + pos * f[3]; fish.value[i].y = f[1] + 0.22 * Math.sin(time * 0.31 + f[4] * 2) - (i < NWF - 1 ? 4.5 * (1 - smoothstep(0, 5, 22 - Math.abs(pos))) : 0);
      }
      object.updateWorldMatrix(true, false);
      archP.value.copy(arch.p).applyMatrix4(object.matrixWorld);
      archD.value.copy(arch.d).applyMatrix3(_m.setFromMatrix4(object.matrixWorld)).normalize();
    },
    dispose() { if (own) U.uField.value.dispose(); },
  };
}
