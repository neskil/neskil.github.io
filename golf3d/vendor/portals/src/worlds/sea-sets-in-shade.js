// The Sea Sets in Shade: an encaustic sea. Cloud shadow sets the wax swell solid (matte cream, sharpened, fringed with drips);
// sun melts it clear turquoise and running. One shadow field crosses the sea; a wax boat with a coral sail rides a lane of light
// to the Standing Breaker (src/parts/sea-sets-in-shade.js, which also owns the wax style: createWaxStyle / waxShade).
// Everything here is shaded by that one routine. No lights, no fog, no textures but the baked shadow field.
// The darks: deep amber slab undersides with rolled beaded rims, deep amber in every hollow (under every curl the buried layer itself), the lane
// deep in its troughs and under the hull. The boat is rigged (mast stepped at the thwart, yard lashed at the port bow, boom, sheet).
// Rules of place (fix round 4c): the field's crests, the lips, stacks, hoops, drops, the cast and the painted fish are each dealt by one rule from
// a stream of their own (mkStream: the world's seed and a name), at metres flown along the course and metres off it; looks begin and end at metres
// flown (worked from world z, from the brief's seconds through the pace, or from where a thing stands); every set crest and lip that the lane
// reaches follows ONE rule, its metres into the sun (waxSag, crestK, FRINGE_VERT: sag, drips to threads, each let go once); nothing is held in the
// sun and nothing reads the eye. The eye leaves its seat once (SWING): out to the +X side and back along the breaker's face, by metres flown.
// Handedness note: heading +Z in three.js, +X is screen LEFT. The brief's map is kept in world coordinates (breaker at x = -165,
// shadows drifting toward -X, sun from +X), so on screen the breaker stands to the right and the sail is carried on the left.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, createWaxStyle, bakeWaxField, waxToScene, waxNormals, WAX_PALETTE, WAX_POST, WAX_WEED_GLSL, dripGeometry, instAttrs, DRIP_DECL } from '../parts/sea-sets-in-shade.js';

const SWING = 1;                    // the one swing of the eye off its seat in the boat (0 takes it out entirely; nothing else depends on it)
const DRIFT = 170;                 // metres the shadow field travels toward -X over the whole flight (field x = world x + DRIFT*u)
const T_FROZEN = 3.7;              // the phase at which set swell stands

// ---------- the swell: one height function, on the GPU (sea, fringes, standing terns) and on the CPU (boat, anchors) ----------
// the swell runs toward -Z and +X, against our course, so set crests throw their lips (and hang their fringes) toward the boat
const WAVES = [[0.5, -0.866, 28, 0.42, 1.05, 0.0], [-0.2, -0.98, 19, 0.20, 1.4, 1.3], [0.85, -0.527, 41, 0.25, 0.8, 4.1], [0.2, -0.98, 11, 0.08, 2.1, 2.2]];
const W_SUM = 0.95, SET_H = 2.5, SET_LEAN = 2.7, RUN_H = 0.78;
const seaM = (x, z, t) => { let h = 0; for (const w of WAVES) h += w[3] * Math.sin((x * w[0] + z * w[1]) * (6.2831853 / w[2]) - t * w[4] + w[5]); return h / W_SUM; };
const mSet = (x, z) => {
  const wx = x + 4.2 * Math.sin(z * 0.17 + 1.1 * Math.sin(x * 0.07)), wz = z + 3.4 * Math.sin(x * 0.21 + 2.0);
  const g = 2.6 * seaM(wx, wz, T_FROZEN), lobe = 0.74 + 0.26 * Math.sin((x * 0.866 + z * 0.5) * 0.29 + 1.9 * Math.sin((x * 0.5 - z * 0.866) * 0.224));
  return clamp(0.5 + 0.625 * g / Math.sqrt(1 + g * g), 0, 1) * lobe;
};   // crest-ness of the standing swell, 0..1
const setY = (m) => SET_H * Math.pow(clamp(m, 0, 1), 2.25) - 0.45, setLean = (m) => SET_LEAN * Math.pow(clamp(m, 0, 1), 6);   // set swell stands sharper and is thrown forward: a lip to hang drips from
const SEA_GLSL = /* glsl */`
float seaM(vec2 p, float t){
  float h = 0.;
${WAVES.map((w) => `  h += ${w[3].toFixed(3)}*sin(dot(p, vec2(${w[0].toFixed(4)}, ${w[1].toFixed(4)}))*${(6.2831853 / w[2]).toFixed(5)} - t*${w[4].toFixed(3)} + ${w[5].toFixed(2)});`).join('\n')}
  return h/${W_SUM.toFixed(3)};
}
float seaSetM(vec2 p){
  vec2 w = p + vec2(4.2*sin(p.y*.17 + 1.1*sin(p.x*.07)), 3.4*sin(p.x*.21 + 2.));
  float g = 2.6*seaM(w, ${T_FROZEN.toFixed(2)}), lobe = .74 + .26*sin((p.x*.866 + p.y*.5)*.29 + 1.9*sin((p.x*.5 - p.y*.866)*.224));
  return clamp(.5 + .625*g/sqrt(1. + g*g), 0., 1.)*lobe;
}
// offset of the sea point at p (world xz): running swell in sun, standing sharpened swell (thrown toward its travel) in shade.
// calm = (how much running swell this vertex carries, how much set swell, how tall set swell may stand here: low along our own track)
vec4 seaDisp(vec2 p, vec3 calm){
  vec4 fl = waxField(vec3(p.x, 0., p.y));
  float s = waxSet(fl, 0.), old = smoothstep(2., 7.5, fl.r);      // wax set a second ago keeps the round back of the running swell; it sharpens, stands up and is thrown over the next metres of shade
  float r = seaM(p, uTime), m = seaSetM(p);
  float m2 = m*m, ys = ${SET_H.toFixed(2)}*m2*sqrt(sqrt(max(m, 1e-4))) - .45;      // ~ m^2.25
  vec2 lean = vec2(${WAVES[0][0].toFixed(4)}, ${WAVES[0][1].toFixed(4)})*${SET_LEAN.toFixed(2)}*m2*m2*m2;
  vec3 fresh = vec3(0., (1.15*m*sqrt(max(m, 1e-4)) - .4)*calm.z*calm.y, 0.);      // the round back the running swell had, no lip yet
  vec3 d = mix(vec3(0., ${RUN_H.toFixed(2)}*r, 0.)*calm.x, mix(fresh, vec3(lean.x, ys, lean.y)*calm.z*calm.y, old), s);
  return vec4(d, s*m);
}`;

// hex helpers (colour variations are mixed as the eye sees them)
const hx = (c, i) => parseInt(c.slice(1 + i * 2, 3 + i * 2), 16);
const mixHex = (a, b, t) => { let o = '#'; for (let i = 0; i < 3; i++) o += Math.round(lerp(hx(a, i), hx(b, i), t)).toString(16).padStart(2, '0'); return o; };

const EDITIONS = {
  noon:    { name: 'broken noon', cover: 0.55, laneL: 20, laneR: 7, sunEl: 48, bands: 0.5, fringe: 1 },
  closing: { name: 'closing in', cover: 0.8, laneL: 12, laneR: 6, sunEl: 48, bands: 0.33, fringe: 1.5 },
  late:    { name: 'late honey', cover: 0.55, laneL: 20, laneR: 7, sunEl: 27, bands: 0.5, fringe: 1.1 },
};

export default {
  id: 'sea-sets-in-shade',
  name: 'The Sea Sets in Shade',
  category: 'ocean',
  weirdness: 0.6,
  media: ['water', 'open'],
  async build(ctx) {
    let rng = ctx.rng; const noise = ctx.noise, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1;
    // ----- variations: weather and hour, colourway, cast (all chosen once, here; everything after is uniforms) -----
    const hour = vary.hour || 'any';
    const wr = rng();
    const edKey = hour === 'golden' || hour === 'dawn' ? 'late' : (hour === 'day' ? (wr < 0.6 ? 'noon' : 'closing') : (wr < 0.42 ? 'noon' : (wr < 0.72 ? 'closing' : 'late')));
    const ed = EDITIONS[edKey];
    const boneR = rng(), castR = rng(), bone = boneR < 0.3, fishCast = castR < 0.3, rare = !!vary.rare;
    let pal = WAX_PALETTE.slice();
    if (bone) pal = ['#EEEADB', '#DDAE48', '#B07F25', '#3466DA', '#1B2F9A', '#E5533D', '#3B2A20'];
    if (edKey === 'late') { pal[0] = mixHex(pal[0], pal[1], 0.2); pal[3] = mixHex(pal[3], pal[4], 0.45); pal[4] = mixHex(pal[4], '#041a26', 0.35); }
    // the let-down blue of the bands is mixed from the cold white and the lane's blue as they stand at noon, in every edition (the late hour warms the wax, not the sky: no grey card)
    const blue = bone ? mixHex('#EEEADB', '#3466DA', 0.27) : '#B9D9DC';
    const underHex = mixHex(pal[0], pal[2], 0.88), underRimHex = mixHex(pal[0], pal[1], 0.5);      // a slab's underside is the buried amber layer, its beaded rim honey-pale
    const style = createWaxStyle(ctx, { palette: pal, blue });
    const U = style.uniforms;
    const az = 1.309, el = ed.sunEl * Math.PI / 180;
    const sun = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    style.setSun(sun);
    if (edKey === 'late') U.uSunShift.value.multiplyScalar(0.62);       // shadows run long, but the gloss must still climb the wall as we pass
    const scene = new THREE.Scene();
    scene.background = waxToScene(pal[0]).clone();
    await ctx.yield();

    const NFISH = 6, fishU = { value: Array.from({ length: NFISH }, () => new THREE.Vector4(0, 0, 0, 6)) };
    // what the molten wax mirrors: the poured bands, the slabs overhead (the same field the cloud shader reads), the stacks and the breaker's face
    const NSTK = 4, stkU = { value: Array.from({ length: NSTK }, () => new THREE.Vector4(0, 0, 1, 0)) };
    const mirU = { uFishes: fishU, uStk: stkU, uCover: { value: ed.cover }, uBandMode: { value: ed.bands < 0.4 ? 1 : 0 }, uUnder: { value: waxToScene(underHex) },
      uWallH: { value: 30 }, uHookEnd: { value: 1.7 }, uHull: { value: new THREE.Vector3(37, 0, 260) } };
    const MIRROR_GLSL = /* glsl */`
      uniform vec4 uFishes[${NFISH}]; uniform vec4 uStk[${NSTK}]; uniform float uCover, uBandMode, uWallH, uHookEnd; uniform vec3 uUnder, uHull;
      float seaRip(vec2 p){ return wxN(p*1.3 + vec2(uTime*.45, uTime*.3)) + .5*wxN(p*3.1 + vec2(-uTime*.5, uTime*.62)); }
      // the world as molten wax mirrors it, from the surface point o along R (R.y > 0)
      vec3 seaMirror(vec3 o, vec3 R){
        float elD = asin(clamp(R.y, -1., 1.))*57.2958;
        vec2 hd = R.xz/max(length(R.xz), 1e-3);
        float eb = elD/15. + uBandCreep + (wxN(hd*9. + 40.) - .5)*.09;
        float k = floor(eb), f = eb - k;
        float two = mod(k + 60., 2.), three = mod(k + 60., 3.);
        vec3 c = mix(uCream, uBlue, mix(1. - step(.5, two), 1. - step(.5, three), uBandMode));
        c = mix(c, mix(c, uAmber, .34), 1. - smoothstep(0., .034, f));
        // slabs at 420 m
        float t = min(420./max(R.y, .03), 4000.);
        vec2 q = o.xz + R.xz*t, qs = q + uSunShift*420.;
        vec2 ff = vec2(uFieldXf.x*qs.x - uFieldXf.y*qs.y, uFieldXf.y*qs.x + uFieldXf.x*qs.y) + uFieldXf.zw;
        vec2 uvf = ff/uFieldSize + .5;
        float fa = textureLod(uField, uvf, 0.).a;
        float inside = min(min(uvf.x, uvf.y), min(1. - uvf.x, 1. - uvf.y));
        float far = wxN(qs/520. + 3.)*.55 + wxN(qs/210.)*.45;
        float dlm = length(q - vec2(-50., 340.));
        float af = smoothstep(-.06, .06, far - mix(.62, .38, smoothstep(.5, .8, uCover)) - .26*smoothstep(550., 1150., dlm))*(1. - smoothstep(1000., 1200., dlm + 240.*(wxN(qs/260. + 9.) - .5)));
        float a = mix(af, fa, smoothstep(0., .05, inside)) + (wxN(qs/11.) - .5)*.4*(1. - smoothstep(.75, 1., fa));
        vec3 slab = mix(uUnder, uCream, clamp(.25*(wxN(qs/90.) - .3) + .2*(wxN(qs/30. + 7.) - .5), 0., 1.));
        c = mix(c, waxVeil(slab, t*.5), smoothstep(.47, .53, a));
        { vec3 vd = o - cameraPosition; float vl = max(length(vd), 1e-3); vec3 Rf = vec3(vd.x, abs(vd.y) + .012*vl, vd.z)/vl; R = normalize(mix(Rf, R, .22)); hd = R.xz/max(length(R.xz), 1e-3); }
        float tBlk = 1e5, lr = max(length(R.xz), 1e-3);
        // a mirror image in running wax wavers and breaks: the point the image is looked up from wanders across the ray with the ripples
        // (more the further the eye is from it), and away from a thing's foot its image thins to dashes and is gone
        vec2 hp = vec2(-hd.y, hd.x); float jal = dot(o.xz, hd), jac = dot(o.xz, hp), dC = length(o.xz - cameraPosition.xz);
        float jn = (wxN(vec2(jac*.33, jal*.8) + vec2(uTime*.3, -uTime*.5)) - .5)*2. + (wxN(vec2(jac*.9, jal*2.1) + vec2(-uTime*.4, uTime*.7)) - .5);
        vec3 oj = o + vec3(hp.x, 0., hp.y)*jn*(1.5 + .045*dC);
        float dsh = wxN(vec2(jac*.5, jal*1.7) + vec2(0., uTime*.6)), fl = max(6., .32*dC);
        // the breaker's face: a cream wall along x = -165
        if (R.x < -.02) {
          float tw = max((-163. - oj.x)/R.x, 0.), wz = oj.z + R.z*tw, wy = R.y*tw;      // (a point already under the leaning face mirrors the face)
          float hw = uWallH*smoothstep(330., 376., wz)*(1. - smoothstep(600., 640., wz));
          float twh = tw*lr, in1 = smoothstep(0., 2.5, hw - wy)*smoothstep(322., 346., wz);
          float brk = (1. - smoothstep(.3*fl, fl, twh))*smoothstep(mix(-.3, .62, smoothstep(0., fl, twh)), mix(-.1, .82, smoothstep(0., fl, twh)), dsh);
          float hr = clamp(wy/max(hw, 1.), 0., 1.);
          vec4 fw = waxField(vec3(-165. - 8.*sin(3.1416*hr), wy, wz));
          float setw = smoothstep(.25, .75, fw.a), clr = smoothstep(3., 20., fw.b*(1. - setw));
          vec3 wc = mix(uCream, uAmber, .5*smoothstep(.5, .75, hr)*(1. - smoothstep(.8, .93, hr)))*.94;
          wc = mix(mix(mix(wc, uHoney, .3*(1. - setw)), mix(uDeep, uTurq, .7), clr), wc, setw);
          c = mix(c, waxVeil(wc, tw), in1*brk*(1. - smoothstep(540., 630., wz)*.8));
          if (in1 > .5) tBlk = tw*lr;
        }
        { vec2 oc = oj.xz - vec2(-70., 610.); float bq = dot(oc, hd), dq = bq*bq - dot(oc, oc) + 9025.;       // the hook, turning across the bow round (-70, 610)
          if (dq > 0.) { float sq = sqrt(dq);
            vec2 th = vec2(-bq - sq, -bq + sq); vec2 qa = oc + hd*th.x, qb = oc + hd*th.y;
            vec2 ph = vec2(atan(qa.y, -qa.x), atan(qb.y, -qb.x));
            vec2 hh = uWallH*step(0., ph)*(1. - smoothstep(uHookEnd - .5, uHookEnd, ph));
            vec2 hit = step(0., th)*step(R.y*th/lr + .5, hh);
            float tk = min(mix(1e5, th.x, hit.x), mix(1e5, th.y, hit.y));
            if (tk < tBlk) { float hr = clamp(R.y*tk/lr/max(uWallH, 1.), 0., 1.);
              float fk = smoothstep(0., fl, tk), brk = (1. - smoothstep(.3*fl, fl, tk))*smoothstep(mix(-.3, .62, fk), mix(-.1, .82, fk), dsh);
              c = mix(c, waxVeil(mix(uCream, uAmber, .4*smoothstep(.45, .75, hr)*(1. - smoothstep(.8, .93, hr)))*.94, tk), brk); tBlk = tk; } } }
        // stacks: slim piled pours
        for (int i = 0; i < ${NSTK}; i++) {
          vec4 sk = uStk[i]; vec2 dc = sk.xy - oj.xz; float tc = dot(dc, hd), dp = abs(dc.x*hd.y - dc.y*hd.x);
          float hy = R.y*tc/max(length(R.xz), 1e-3), rr = sk.z*(1. - .55*clamp(hy/max(sk.w, 1.), 0., 1.));
          float fk = smoothstep(0., fl*1.6, tc), in2 = step(0., tc)*step(tc, tBlk)*(1. - smoothstep(rr - 1.2, rr + 1.2, dp))*(1. - smoothstep(sk.w - 4., sk.w, hy))*(1. - smoothstep(.5*fl, fl*1.6, tc))*smoothstep(mix(-.3, .62, fk), mix(-.1, .82, fk), dsh);
          c = mix(c, waxVeil(mix(uCream, uAmber, .18 + .22*step(.5, fract(hy/4.3))), tc), in2);
        }
        return c;
      }
      // molten wax as the eye sees it: clear depth over the painted layer, the mirror, small steady highlights. e = metres per pixel at wp
      vec3 seaMolten(vec3 wp, vec3 N, vec3 V, float dist, float e){
            float rk = 1. - smoothstep(.12, .7, e);
            float r0 = seaRip(wp.xz); vec2 rg = vec2(seaRip(wp.xz + vec2(.12, 0.)) - r0, seaRip(wp.xz + vec2(0., .12)) - r0)/.12;
            vec3 Nr = normalize(N + vec3(-rg.x, 0., -rg.y)*(.03*rk));                // ripples only where a pixel can hold them: beyond, the swell alone bends the mirror
            float NVg = max(dot(Nr, V), 0.), om = 1. - NVg, F = (.03 + .97*om*om*om*om*om)*.86;
            vec3 R = reflect(-V, Nr); R.y = abs(R.y) + .012; R = normalize(R);
            vec3 mir = seaMirror(wp, R);
            // clear depth: thin and bright on the crests of the running swell, deep in its troughs and over the painted layer's pools
            vec2 q = wp.xz - V.xz/max(V.y, .2)*3.;                    // where the eye's line meets the painted layer 3 m down
            float sw = seaM(wp.xz, uTime), pool = wxF(q*.06 + 3.);
            float under = (1. - smoothstep(3., 30., wp.x + 165.))*smoothstep(330., 372., wp.z)*(1. - smoothstep(560., 625., wp.z));
            float dep = clamp(.41 + 1.05*sw - (pool - .45)*1.7 - .25*NVg - .85*under - .34*(1. - smoothstep(.05, .17, V.y)), -.4, 1.4);      // the deep tone is plainly there: in every trough, over the pools, at the foot of the face, and wherever the line of sight lies too flat on the wax to reach the painted layer
            dep -= .18*(1. - smoothstep(2.5, 10., length(wp.xz - uHull.xz)));                 // deep under the hull (the hull's own place)
            vec3 body = mix(uDeep, uTurq, smoothstep(.12, .86, dep));
            body = mix(mix(uDeep, uUmber, .32)*.8, body, smoothstep(-.3, .42, dep));      // the deepest places: deep wax over the dark of the buried layer
            body = mix(body, mix(uTurq, uBlue, .5), smoothstep(.66, 1.05, dep)*.8);      // thin and pale over the crests
            float see = smoothstep(.03, .2, V.y)*(1. - smoothstep(.25, .9, e));
            if (see > .003) {
              vec4 wd = seaWeed(q, e);
              vec3 lay = wd.rgb; float la = wd.a*.7;
              for (int i = 0; i < ${NFISH}; i++) {
                vec4 fi = uFishes[i]; vec2 r = q - fi.xy; float cs = cos(fi.z), sn = sin(fi.z);
                vec4 fc = waxFish(vec2(r.x*sn + r.y*cs, r.x*cs - r.y*sn), fi.w, uTime + float(i)*1.7, e/max(fi.w, 1.));
                lay = mix(lay, fc.rgb, fc.a); la = mix(la, .92, fc.a);
              }
              body = mix(body, lay, la*see);
            }
            float ml = dot(mir, vec3(.3, .5, .2))/max(dot(uCream, vec3(.3, .5, .2)), 1e-3);
            float mb = smoothstep(.62, .78, ml);                                // the bands lie on the wax toward the horizon: cream and let-down blue mirrored pale, the slabs' amber bellies as the lane's own deep tone
            vec3 m = mix(body, mix(mix(uDeep, uTurq, .55), mix(uBlue, uCream, .3), mb), mix(F, max(F, .8), smoothstep(45., 150., dist)));      // the mirror is wax too: it keeps the lane's own colour family (far off the lane is all mirror)
            { // the sun on molten wax: many small tight glints along the running swell's crests, on their sun side; each stands still on the sea while its crest passes (no streak, no flash)
              vec2 sd2 = uSun.xz/max(length(uSun.xz), 1e-3); float lit = smoothstep(.0, .06, dot(N.xz, sd2))*smoothstep(.1, .55, sw);
              vec2 gq = wp.xz*1.7, gc = floor(gq), gf = fract(gq) - .5 - (vec2(wxH(gc + 3.), wxH(gc + 11.)) - .5)*.6; float gh = wxH(gc + 29.), gr = .07 + .09*wxH(gc + 5.), ge = max(e*1.7, 1e-3);
              float spot = (1. - smoothstep(gr - ge*.5, gr + ge*.5, length(gf)))*min(1., gr/ge)*step(.66, gh);
              m += uGlint*.5*lit*mix(spot, .012, smoothstep(.12, .4, e)); }
            float sp = max(dot(R, uSun), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
            sp *= sp; m += uGlint*sp*sp*sp*sp*.8;                       // the sun itself: one tight glint
            { float bandR = (1. - smoothstep(5., 9.5, abs(wp.x + 154.5)))*smoothstep(335., 352., wp.z)*(1. - smoothstep(588., 608., wp.z)), litR = 0.;      // drops ring the clear wax: under the breaker's lit lip, round the boat,
              if (bandR > .01) { vec4 fl2 = waxField(vec3(-158., 27., wp.z)); float sm2 = waxSunM(fl2, 0.); litR = smoothstep(1., 6., sm2)*(1. - smoothstep(60., 110., sm2)*.75); }
              vec4 fl3 = waxField(wp); float sm3 = waxSunM(fl3, 0.);                                                                        // and wherever the lane has just taken a fringed crest of the set sea (its drops are still landing)
              float rgK = max(bandR*litR, smoothstep(1.5, 5., sm3)*(1. - smoothstep(14., 28., sm3))*smoothstep(.42, .7, seaSetM(wp.xz)));
              if (rgK > .01) {
                vec2 cl = floor(wp.xz/2.6); float h = wxH(cl + 7.), tr = fract(uTime*(.42 + .3*h) + h*9.), rad = .12 + 1.05*tr, wr = max(.04, e*.7);
                float r = length(wp.xz - (cl + .5 + (vec2(wxH(cl + 3.), wxH(cl + 11.)) - .5)*.3)*2.6);
                float ring = (1. - smoothstep(wr*.5, wr, abs(r - rad)))*(1. - tr)*(1. - tr)*step(.4, wxH(cl + 19.));
                m = mix(m, mix(uBlue, uCream, .5), ring*rgK*.6*(1. - smoothstep(.1, .28, e))); } }
            return waxVeil(m, dist);
      }`;
    // ----- the hero, placed on the brief's map -----
    // the heaped swell under the arch is the same sea: the hero shades it with the world's own molten routine, so no edge shows where they meet
    const hero = await buildHero(ctx, { style, sea: false, detail, palette: pal, swellDecl: SEA_GLSL + MIRROR_GLSL, swellUniforms: mirU,
      swellFrag: /* glsl */`float eS = fwidth(vW.x) + fwidth(vW.z);
        if (heap > 0.) col = mix(col, seaMolten(vW, N, V, dist, eS), heap);
        else {                                                           // the clear foot of the face is the sea climbing it: the same wax, the same mirror, no line where they meet
          float ft = footK*(1. - waxSet(fld, force))*smoothstep(2.5, 8., waxSunM(fld, force))*(1. - thin);
          if (ft > .003) { vec2 nh = N.xz/max(length(N.xz), 1e-3); vec3 wq = vec3(vW.x - nh.x*vW.y, vW.y, vW.z - nh.y*vW.y); float eQ = max(eS, fwidth(vW.y));      // (the foot unfolded onto the sea's plane: the same wax, drawn at the same scale)
            col = mix(col, seaMolten(wq, normalize(mix(vec3(0., 1., 0.), N, smoothstep(0., 4.5, vW.y))), V, dist, eQ), ft); }
        }` });
    mirU.uWallH.value = hero.size.height; mirU.uHookEnd.value = (hero.anchors.length - 280) / 95;
    const wp = hero.anchors.worldPlacement;
    hero.object.position.copy(wp.position); hero.object.rotation.y = wp.rotationY; hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    const toW = (v) => v.clone().applyMatrix4(hero.object.matrixWorld);
    const toWd = (v) => v.clone().transformDirection(hero.object.matrixWorld);
    await ctx.yield();
    // ----- the path: the lane comes in on the diagonal (so the breaker's face stands across the bow from the first frame, not end-on),
    // an S through the field, a left turn onto the face, out round the hook, the arch -----
    const seat = toW(hero.anchors.portalSeat.position), axis = toWd(hero.anchors.portalSeat.direction);
    const fly = hero.anchors.flyThrough.map(toW);
    const E = seat.clone().addScaledVector(axis, -62);
    // The approach is one long diagonal at about 50 degrees to the face, so the breaker stands ACROSS the bow from the first frame
    // (200 m off, the whole wall inside the middle half of the picture) and grows until we turn to run along it.
    const pts = [
      [37, 2.4, 260], [5, 2.4, 293], [-30, 2.4, 322], [-66, 2.4, 346], [-100, 2.4, 369], [-124, 2.4, 390], [-141, 2.4, 410], [-151.5, 2.4, 438],
      fly[2], [-155.2, 2.4, 484], [-152, 2.4, 505], [-149.5, 2.4, 526],
      [-147, 2.4, 546], [-124, 2.7, 580], [-95, 3.5, 612], [E.x, E.y, E.z], seat.clone().addScaledVector(axis, -31), seat.clone(),
    ];
    const path = makePath(pts);
    const PL = path.length;
    // the flight's one pace, and the brief's seconds through it: secAtU(u) = seconds flown at u, uAtSec(s) its inverse (the engine scales the pace so the flight lasts DUR seconds)
    const DUR = 40, pace = (u) => 1.22 - 0.5 * smoothstep(0.34, 0.47, u) + 0.3 * smoothstep(0.72, 0.84, u);
    const secTab = [0]; { const n = 400; let acc = 0; for (let i = 1; i <= n; i++) { acc += 1 / clamp(pace((i - 0.5) / n), 0.35, 2.5) / n; secTab.push(acc); } for (let i = 0; i <= n; i++) secTab[i] *= DUR / acc; }
    const secAtU = (u) => { const f = clamp(u, 0, 1) * 400, i = Math.min(Math.floor(f), 399); return lerp(secTab[i], secTab[i + 1], f - i); };
    const uAtSec = (sec) => { let a = 0, b = 400; while (b - a > 1) { const m = (a + b) >> 1; if (secTab[m] <= sec) a = m; else b = m; } return (a + (sec - secTab[a]) / Math.max(secTab[b] - secTab[a], 1e-6)) / 400; };
    const mAtSec = (sec) => uAtSec(sec) * PL;                          // metres flown at the brief's second
    // the breaker's lip in world space, by metres along the wave (from the hero's fringe line)
    const lipPts = hero.anchors.fringeLine.map(toW), lipLen = hero.anchors.length;
    const lipAt = (sM, out) => { const f = clamp((sM / lipLen - 0.03) / 0.94, 0, 1) * 40, i = Math.min(Math.floor(f), 39); return out.lerpVectors(lipPts[i], lipPts[i + 1], f - i); };
    const CUR_S0 = 280 + 95 * 0.36, CUR_S1 = 280 + 95 * 1.09;             // the stretch of the hook that lets go in the rare event (20 to 62 degrees round)
    // lane table: path x and u as functions of world z (the path never turns back in z), extended in straight lines past both ends
    const laneTab = []; { const v = new THREE.Vector3(); for (let d = -260; d <= PL + 320; d += 2) { path.posAtDist(d, v); laneTab.push([v.z, v.x, d / PL, 1]); }
      for (let i = 0; i < laneTab.length; i++) { const a = laneTab[Math.max(i - 4, 0)], b = laneTab[Math.min(i + 4, laneTab.length - 1)], m = ((b[1] + DRIFT * b[2]) - (a[1] + DRIFT * a[2])) / Math.max(b[0] - a[0], 0.5); laneTab[i][3] = Math.min(Math.sqrt(1 + m * m), 1.7); } }
    const laneAt = (z, out) => {
      let a = 0, b = laneTab.length - 1;
      if (z <= laneTab[0][0]) { out.x = laneTab[0][1]; out.u = laneTab[0][2]; out.k = laneTab[0][3]; return out; }
      if (z >= laneTab[b][0]) { out.x = laneTab[b][1]; out.u = laneTab[b][2]; out.k = laneTab[b][3]; return out; }
      while (b - a > 1) { const m = (a + b) >> 1; if (laneTab[m][0] <= z) a = m; else b = m; }
      const t = (z - laneTab[a][0]) / Math.max(laneTab[b][0] - laneTab[a][0], 1e-4);
      out.x = lerp(laneTab[a][1], laneTab[b][1], t); out.u = lerp(laneTab[a][2], laneTab[b][2], t); out.k = lerp(laneTab[a][3], laneTab[b][3], t); return out;
    };
    // the lane's two edges, metres off the boat: laneL toward -X (the melt edge), laneR toward +X (the setting edge).
    // Along the breaker's face the melt edge runs 11 m behind the foot, so the gloss reaches the wall as we do.
    const _lt = { x: 0, u: 0, k: 1 };
    const _lz = { x: 0, u: 0, k: 1 }, mAtZ = (z) => laneAt(z, _lz).u * PL;      // metres flown where the course crosses world z
    // the brief's map on this course: the run along the face begins where the course is 20 m out from it ("20 m out closing to 9"); before that, lane and field
    // share the approach as the brief's 180 m and 185 m do
    let mFace = PL * 0.5; { const v = new THREE.Vector3(); for (let d = 0; d < PL; d += 1) { path.posAtDist(d, v); if (v.x + 165 <= 20) { mFace = d; break; } } }
    const mLane = mFace * 180 / 365, zLane = path.posAtDist(mLane).z;
    // ----- the one swing of the eye off its seat (the designer's amendment): out to the sea side (+X here: the side away from the breaker's face) and back,
    // one smooth function of metres flown. The eye is back on its seat before the boat is at z 470; it left it SWING_S seconds of flight earlier.
    const SWING_S = 6.4, swM1 = mAtZ(468), swT0 = secAtU(swM1 / PL) - SWING_S, swM0 = mAtSec(swT0);
    const ease5 = (x) => { x = clamp(x, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };
    const swingW = (m) => { const p = (secAtU(m / PL) - swT0) / SWING_S; return ease5(p / 0.344) * (1 - ease5((p - 0.656) / 0.344)); };      // out over 2.2 s, held 2 s, back over 2.2 s
    // (the eye drops astern first and comes forward last, so the boat stays ahead of it while it is near: the astern part of the offset runs 1.8 times as fast)
    const swingA = (m) => { const p = (secAtU(m / PL) - swT0) / SWING_S; return ease5(1.8 * p / 0.344) * (1 - ease5(((p - 0.656) / 0.344 - 0.444) * 1.8)); };
    const SW_ABEAM = 24, SW_ASTERN = 8, SW_EYE = 3.6;                     // at its widest: metres abeam of the hull on the sea side, metres astern of the seat, the eye's height over the sea's datum
    const _sw = new THREE.Vector3(), _swt = new THREE.Vector3();
    // the eye's offset from its seat when the boat has flown m metres
    const swingOff = (m, o) => {
      const w = swingW(m), wa = swingA(m); o.set(0, 0, 0);
      if (w > 0 || wa > 0) { path.posAtDist(m, _swp); path.tangentAtDist(m, _swt); const hl = Math.hypot(_swt.x, _swt.z) || 1, tx = _swt.x / hl, tz = _swt.z / hl; o.set(tz * SW_ABEAM * w - tx * SW_ASTERN * wa, (SW_EYE - _swp.y) * w, -tx * SW_ABEAM * w - tz * SW_ASTERN * wa); }
      return o;
    };
    const _swp = new THREE.Vector3(), _swo = new THREE.Vector3(), swNow = new THREE.Vector3();
    const eyeAt = (d, out) => { swingOff(d, _swo); return path.posAtDist(d, out).add(_swo); };       // where the eye is when the boat has flown d metres
    const swZ0 = path.posAtDist(swM0).z - 30, swZ1 = path.posAtDist(swM1).z + 30;
    const eyeTrack = []; for (let d = swM0; d <= swM1; d += 1.5) { eyeAt(d, _sw); eyeTrack.push(_sw.x, _sw.z); }
    const eyeDist = (x, z) => { let b = 1e9; for (let i = 0; i < eyeTrack.length; i += 2) { const dx = eyeTrack[i] - x, dz = eyeTrack[i + 1] - z, q = dx * dx + dz * dz; if (q < b) b = q; } return Math.sqrt(b); };
    // RULE OF THE PLACE (the breaker's falling drops): a falling drop of this size is a body, and a body is kept off the lens by its place. No drop of the standing
    // breaker is laid where the eye's built track (the course and its one swing, eyeAt, walked in metres: a point every 0.25 m, made once, here) comes within 2 m of
    // the drop's REACH: all the room its skin can take up at any clock and in any state of the field. By the part's DROP_VERT that is an upright round column under
    // the berth: its top 0.3 m under the berth (the drop's root while it swells, the lip not yet sagged); its foot at the end of the fall (iA.x) under the lip's whole
    // sag (3 m by its weight iA.w), with the drop's longest length (2.6 * 2.8 widths) below that; 0.93 of a width round the fall line. The width is iA.y, or 0.0011
    // of the metres from the berth to the eye's place where that is more (the program's own least width). 2.05 m is asked at every point of the track (the 0.05 m is
    // for the 0.25 m between two points; a point that stands further off than that lets the walk pass over the points after it that cannot be nearer: the eye moves
    // eyeStep at most from one point to the next, and the column grows by less than a hundredth of the eye's move). Places in world metres only: no camera, no u,
    // no clock, no seed, no detail, no picture size. A drop that is not laid keeps its slot in the part's list, and every draw of the part's dealer was taken as it
    // always is; only its own numbers are written here: width 0 and phase 8 (iA.y, iA.z). With that phase the program's `show` is 0 in any sun (it asks 3 m of sun
    // and 16 m more for each unit of phase; the field holds 100 m), so the drop's size is 0, all its vertices stand on one point and no triangle of it is drawn.
    // Nothing is moved, shrunk, hidden or turned by where the eye is.
    await ctx.yield();
    const eyeLine = []; let eyeStep = 0.25;
    for (let k = 0; (k - 1) * 0.25 < PL; k++) { eyeAt(Math.min(k * 0.25, PL), _sw); if (k) eyeStep = Math.max(eyeStep, Math.hypot(_sw.x - eyeLine[k * 3 - 3], _sw.y - eyeLine[k * 3 - 2], _sw.z - eyeLine[k * 3 - 1])); eyeLine.push(_sw.x, _sw.y, _sw.z); }
    await ctx.yield();
    { const dg = hero.object.getObjectByName('drops').geometry, dP = dg.getAttribute('iPos'), dA = dg.getAttribute('iA').array;
      for (let i = 0; i < dP.count; i++) {
        _sw.fromBufferAttribute(dP, i).applyMatrix4(hero.object.matrixWorld);
        const top = _sw.y - 0.3, foot = top - 3 * dA[i * 4 + 3] - dA[i * 4], wd = dA[i * 4 + 1];
        for (let k = 0; k < eyeLine.length;) {
          const dx = eyeLine[k] - _sw.x, ey = eyeLine[k + 1], dz = eyeLine[k + 2] - _sw.z, w = Math.max(wd, 0.0011 * Math.hypot(dx, ey - _sw.y, dz));
          const off = Math.hypot(Math.max(Math.hypot(dx, dz) - 0.93 * w, 0), Math.max(ey - top, foot - 7.28 * w - ey, 0));      // metres from this point of the track to the column
          if (off < 2.05) { dA[i * 4 + 1] = 0; dA[i * 4 + 2] = 8; break; }
          k += 3 * Math.max(1, Math.floor((off - 2.05) / (1.01 * eyeStep)));
        }
      } }
    await ctx.yield();
    // what the engine flies: the course itself, or (SWING) the course moved bodily by the eye's offset as it stands now (swNow: update() sets it from the metres
    // flown), so the eye is where eyeAt puts it and the way ahead keeps the course's own heading (the swing itself turns nothing); length, ends and tangents are the course's
    const eyePath = SWING ? { ...path, posAtDist: (d, out = new THREE.Vector3()) => path.posAtDist(d, out).add(swNow), pointAt: (u, out = new THREE.Vector3()) => path.pointAt(u, out).add(swNow) } : path;
    // "At 5 s the edge clips the sail" (the brief's second, through the flight's pace); through the field the melt edge keeps 24 m off, so each crest melts as we reach it
    const zClip = path.pointAt(uAtSec(5)).z, zF0 = path.posAtDist(mLane - 40).z, zF1 = zLane;
    // Along the face the melt edge runs 19 m behind the foot, opening to 41 m by z 515: there the sun has the lip for 80 m ahead of us and the gloss front crosses the face on a long diagonal.
    const laneLAt = (z, px, k) => lerp(lerp(ed.laneL, Math.max(ed.laneL, 24), smoothstep(zF0, zF1, z)) * k, px + 165 + lerp(19, 26, smoothstep(440, 495, z)) + 8 * smoothstep(500, 535, z), smoothstep(335, 400, z) * (1 - smoothstep(548, 600, z)));
    const _la = new THREE.Vector3(), _lb = new THREE.Vector3(); lipAt(CUR_S0, _la); lipAt(CUR_S1, _lb);
    const curZ0 = _la.z, curZ1 = _lb.z, curX0 = _la.x + U.uSunShift.value.x * _la.y, curX1 = _lb.x + U.uSunShift.value.x * _lb.y;
    const FOX = 50, FOZ = -340;                                        // field frame = world xz + (FOX + DRIFT*u, FOZ)
    const nSeed = rng.range(0, 50), thr = lerp(0.02, -0.3, smoothstep(0.55, 0.8, ed.cover));
    const fieldSd = (fu, fv) => {
      const z = fv - FOZ; laneAt(z, _lt);
      const dl = fu - (_lt.x + DRIFT * _lt.u + FOX);
      const corr = Math.min(dl + 270, 175 - dl);
      const nz = (noise.fbm2(fu / 340 + nSeed, fv / 340, 3) - thr) * 300 + 22 * noise.n2(fu / 60, fv / 60 + nSeed);
      const shade = Math.max(Math.min(corr, 60), nz);
      const clip = Math.exp(-((z - zClip) * (z - zClip)) / (26 * 26));        // at the brief's fifth second the setting edge swings in and clips the sail
      const scK = 1 - 0.8 * smoothstep(335, 400, z) * (1 - smoothstep(548, 600, z));
      const L = Math.max(laneLAt(z, _lt.x, _lt.k) + scK * (3.6 * noise.n2(z / 13, nSeed + 7) + 2.4 * noise.n2(z / 31, nSeed + 3)), 7.5), R = Math.max(lerp(ed.laneR + 2.5 * noise.n2(z / 37, nSeed), 2.5, clip), 2.4) * _lt.k;
      let sd = Math.min(shade, Math.max(-L - dl, dl - R));
      if (rare && z > curZ0 - 12 && z < curZ1 + 12) {                     // the rare beam: sun on that stretch of lip from u 0.625 until the next shadow's edge crosses it at u 0.7
        const t = clamp((z - curZ0) / (curZ1 - curZ0), 0, 1), b = lerp(curX0, curX1, t) + FOX + DRIFT * 0.7;
        sd = Math.min(sd, Math.max(b - 16.5 - fu, fu - b, curZ0 - z, z - curZ1));
      }
      return sd;
    };
    const fieldTex = await bakeWaxField(ctx, fieldSd, { res: 512, size: 1600 });
    style.setField(fieldTex, 1600);
    style.setFieldXf(0, FOX, FOZ);
    await ctx.yield();
    // CPU reads of the field for things that follow it (anchors, the sail's frost): signed metres at world (x, z) and progress u
    const sdAt = (x, z, u) => fieldSd(x + FOX + DRIFT * u, z + FOZ);
    // ----- the sea: one grid in rows of constant z, columns measured from the path, dense within 120 m of it -----
    const hm = hero.object.matrixWorld.clone().invert();
    const _hl = new THREE.Vector3(), sweepMax = (hero.anchors.length - 280) / 95;
    const breakerDist = (x, z) => {                                   // metres from the breaker's spine (straight + hook)
      _hl.set(x, 0, z).applyMatrix4(hm);
      const lx = _hl.x, lz = _hl.z;
      let d = Math.hypot(clamp(lx, -70, 210) - lx, lz);               // the straight face, local x -70..210 at z = 0
      const rx = lx + 70, rz = lz - 95, rho = Math.hypot(rx, rz), p = Math.atan2(-rx, -rz);
      if (p >= 0 && p <= sweepMax) d = Math.min(d, Math.abs(rho - 95));
      else { const pe = sweepMax; d = Math.min(d, Math.hypot(lx - (-70 - 95 * Math.sin(pe)), lz - (95 - 95 * Math.cos(pe)))); }
      return d;
    };
    const axH = new THREE.Vector3(axis.x, 0, axis.z).normalize(), axR = new THREE.Vector3(-axH.z, 0, axH.x);
    const heapK = (x, z) => {                                         // 1 over the heaped swell under the arch (the hero's own clear wax)
      const dx = x - seat.x, dz = z - seat.z, a = dx * axH.x + dz * axH.z, l = Math.abs(dx * axR.x + dz * axR.z);
      return (1 - smoothstep(26, 50, l)) * smoothstep(-135, -105, a) * (1 - smoothstep(6, 22, a));
    };
    const heapS = (x, z) => {                                         // the same, for the sea's own swell: it dies only under the heap's crown, and stands against its flanks
      const dx = x - seat.x, dz = z - seat.z, a = dx * axH.x + dz * axH.z, l = Math.abs(dx * axR.x + dz * axR.z);
      return (1 - smoothstep(5, 14 + 3 * noise.n2(a * 0.11, 4.4), l)) * smoothstep(-135, -105, a) * (1 - smoothstep(6, 22, a));
    };
    const zRows = []; { let z = 150, st = 2.6; while (z > -470) { zRows.unshift(z); st *= 1.22; z -= st; } for (z = 150 + 2.6; z < 742; z += 2.6) zRows.push(z); st = 2.6; while (z < 1180) { zRows.push(z); st *= 1.16; z += st; } }
    const xOff = [0]; { let o = 0.65, st = 1.3; for (let i = 0; i < 56; i++) { xOff.push(o); xOff.unshift(-o); st *= 1.074; o += st; } }
    const nzr = zRows.length, nxc = xOff.length;
    const seaGeo = new THREE.BufferGeometry();
    {
      const pos = new Float32Array(nzr * nxc * 3), suv = new Float32Array(nzr * nxc * 2), calm = new Float32Array(nzr * nxc * 3);
      for (let j = 0; j < nzr; j++) {
        const z = zRows[j]; laneAt(z, _lt);
        const dzr = j > 0 ? z - zRows[j - 1] : 30;
        for (let i = 0; i < nxc; i++) {
          const k = j * nxc + i, x = _lt.x + xOff[i], sp = Math.max(dzr, i > 0 ? xOff[i] - xOff[i - 1] : 30);
          pos[k * 3] = x; pos[k * 3 + 1] = 0; pos[k * 3 + 2] = z; suv[k * 2] = x * WAVES[0][0] + z * WAVES[0][1]; suv[k * 2 + 1] = x * WAVES[0][1] - z * WAVES[0][0];   // uv.x across the crests, uv.y along them
          const bd = breakerDist(x, z), hs = heapS(x, z);
          calm[k * 3] = smoothstep(13, 30, bd) * (1 - 0.88 * hs) * (1 - smoothstep(4.5, 11, sp));
          calm[k * 3 + 1] = smoothstep(1.5, 7, bd) * (1 - 0.88 * hs) * (1 - smoothstep(4.5, 11, sp));   // set swell stands right up to the foot of the face; the sea owns the surface there (the hero's apron lies under it)
          calm[k * 3 + 2] = lerp(0.3, 1, xOff[i] > 0 ? smoothstep(3.4, 6.6, xOff[i]) : smoothstep(3.2, 9, -xOff[i])) + 0.4 * smoothstep(12, 36, Math.abs(xOff[i])) + 0.75 * smoothstep(565, 625, z) * (1 - smoothstep(45, 95, bd)) * smoothstep(13, 20, Math.abs(xOff[i]));      // how tall set swell may stand: low along our own track, full beyond 9 m, taller far out
        }
        if (j % 2 === 1) await ctx.yield();
      }
      await ctx.yield();
      const idx = new Uint32Array((nzr - 1) * (nxc - 1) * 6); let q = 0;
      for (let j = 0; j < nzr - 1; j++) { for (let i = 0; i < nxc - 1; i++) { const a = j * nxc + i, b = a + nxc; idx[q++] = a; idx[q++] = b; idx[q++] = a + 1; idx[q++] = a + 1; idx[q++] = b; idx[q++] = b + 1; } if (j % 60 === 59) await ctx.yield(); }
      await ctx.yield();
      seaGeo.setIndex(new THREE.BufferAttribute(idx, 1));
      seaGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); seaGeo.setAttribute('uv', new THREE.BufferAttribute(suv, 2));
      seaGeo.setAttribute('aCalm', new THREE.BufferAttribute(calm, 3));
    }
    await ctx.yield();
    const seaMat = style.material({
      clearM: 3, detail: 1, groove: 5.2, grooveW: 1.25, refl: 0.17, bodyBias: 0.6, side: THREE.DoubleSide, uniforms: mirU,
      vertexDecl: 'attribute vec3 aCalm;\n' + SEA_GLSL,
      vertexPos: /* glsl */`
        vec2 q0 = position.xz; vec4 d0 = seaDisp(q0, aCalm);
        vec3 dA = vec3(1.2, 0., 0.) + seaDisp(q0 + vec2(1.2, 0.), aCalm).xyz - d0.xyz;
        vec3 dB = vec3(0., 0., 1.2) + seaDisp(q0 + vec2(0., 1.2), aCalm).xyz - d0.xyz;
        p = position + d0.xyz;
        n = normalize(cross(dB, dA) + vec3(0., 1e-4, 0.)); tg = vec3(${WAVES[0][0].toFixed(4)}, 0., ${WAVES[0][1].toFixed(4)}); thin = 0.; force = 0.;
        hollow = d0.w > 0. ? clamp(1.15 - n.y*1.7, 0., 1.)*step(.02, d0.w) : 0.;          // the steep face under a thrown lip shows the buried amber`,
      fragDecl: SEA_GLSL + WAX_WEED_GLSL + MIRROR_GLSL,
      fragMid: /* glsl */`
        float ripL = 0., ripC = 0., ripV = 0.;
        { fld.a = smoothstep(.43, .57, fld.a + (wxF(vW.xz*.21 + 5.) - .5)*.34);       // the two finishes meet in a line, not a shore: colour and gloss flip inside a metre, along a poured, lobed edge
          float st = waxSet(fld, 0.), mf = seaSetM(vW.xz), old = smoothstep(2., 7.5, fld.r);
          // just set: the same swell stopped in mid-roll: matte, frosted, its frozen ripples, pinholes and scrapes there at once (waxShade's cold marks), amber only in the troughs
          float lipF = smoothstep(.5, .8, mf)*smoothstep(.04, .22, dot(N.xz, vec2(${WAVES[0][0].toFixed(4)}, ${WAVES[0][1].toFixed(4)})));      // under each crest's small edge, on the face the swell was rolling toward: the buried amber
          hollow = st*mix(max((1. - mf)*(1. - mf)*.6, lipF*.95), max(hollow*.85, mix((1. - mf)*(1. - mf)*.8, .2, smoothstep(140., 420., dist))), old); detail = st;
          // frozen ripples: the running wax's own small ripples stopped where they stood, across the swell's travel: each a crisp little crest with a thin line of the buried
          // amber on its lee; every few metres a broader ridge where a later pour ran over and stopped. Set swell is swell stopped in mid-roll, never a dune.
          { vec2 wd = vec2(${WAVES[0][0].toFixed(4)}, ${WAVES[0][1].toFixed(4)}), rq = vec2(dot(vW.xz, wd), dot(vW.xz, vec2(-wd.y, wd.x)));
            float wob = .6*wxN(vec2(rq.y*.17, rq.x*.06) + 3.) + .3*sin(rq.y*.33 + 2.2*wxN(rq.yx*vec2(.05, .08) + 9.));
            float rp1 = rq.x/1.85 + wob, rf1 = fract(rp1), rw1 = max(fwidth(rq.x)/1.85, 1e-4), rp2 = rq.x/7.4 + wob*.5 + .3, rf2 = fract(rp2), rw2 = max(fwidth(rq.x)/7.4, 1e-4);
            float rpk = .3 + .7*smoothstep(.3, .55, wxN(rq.yx*vec2(.11, .23) + 7.));
            float l1 = smoothstep(0., rw1*.7, rf1)*(1. - smoothstep(.11, .11 + rw1, rf1))*(1. - smoothstep(.22, .55, rw1))*rpk;
            float l2 = smoothstep(0., rw2*.7, rf2)*(1. - smoothstep(.06, .06 + rw2, rf2))*(1. - smoothstep(.14, .36, rw2));
            ripV = st*smoothstep(.55, .85, N.y)*(1. - smoothstep(60., 140., dist));
            ripL = max(l1*.85, l2); ripC = max(smoothstep(.78, 1., rf1)*(1. - smoothstep(.22, .55, rw1))*rpk*.8, smoothstep(.88, 1., rf2)*(1. - smoothstep(.14, .36, rw2)));
            N = normalize(N + vec3(wd.x, 0., wd.y)*((ripC*.3 - ripL*.45)*ripV)); } }`,
      fragPost: /* glsl */`
        { float mol = 1. - waxSet(fld, 0.), eS = fwidth(vW.x) + fwidth(vW.z);
          if (mol > .003) col = mix(col, seaMolten(vW, N, V, dist, eS), mol);
          col = mix(col, waxVeil(mix(uAmber, uUmber, .22)*.92, dist), ripL*ripV*.8); col = mix(col, waxVeil(uCream*1.02, dist), ripC*ripV*.42);
          col = mix(col, waxVeil(uHoney*1.08, dist), 4.*mol*(1. - mol)*.85*(1. - smoothstep(50., 130., dist))); }`,      // where set wax meets molten it is thin, and the sun stands in it: a honey line along every edge
    });
    const sea = new THREE.Mesh(seaGeo, seaMat); sea.frustumCulled = false; sea.name = 'sea'; scene.add(sea);
    await ctx.yield();
    // ----- the sky: poured wax, six level bands with beaded lower lips, creeping down; the sun a plain pale disc -----
    const WAX_FIELD = /* glsl */`uniform sampler2D uField; uniform vec4 uFieldXf; uniform float uFieldSize; uniform vec2 uSunShift; uniform float uTime;`;
    const SKY_COMMON = /* glsl */`
      uniform vec3 uSun, uCream, uHoney, uAmber, uBlue, uVeil, uGlint, uUmber; uniform float uBandCreep, uBandMode, uCover; uniform vec3 uUnder, uUnderRim;
      float wxH(vec2 p){ p = fract(p*vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.y); }
      float wxN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
        return mix(mix(wxH(i), wxH(i + vec2(1., 0.)), f.x), mix(wxH(i + vec2(0., 1.)), wxH(i + vec2(1., 1.)), f.x), f.y); }
      vec3 waxVeil(vec3 c, float d){
        float k = smoothstep(144., 156., d)*.13 + smoothstep(288., 312., d)*.13 + smoothstep(480., 520., d)*.13 + smoothstep(770., 830., d)*.13 + smoothstep(1150., 1250., d)*.13;
        return mix(c, uVeil, k); }`;
    const skyU = { uSun: U.uSun, uCream: U.uCream, uHoney: U.uHoney, uAmber: U.uAmber, uBlue: U.uBlue, uVeil: U.uVeil, uGlint: U.uGlint, uUmber: U.uUmber, uBandCreep: U.uBandCreep, uBandMode: { value: ed.bands < 0.4 ? 1 : 0 }, uTime: U.uTime, uCover: { value: ed.cover }, uUnder: { value: waxToScene(underHex) }, uUnderRim: { value: waxToScene(underRimHex) } };
    const skyMat = new THREE.ShaderMaterial({
      uniforms: skyU, depthWrite: false, depthTest: false, side: THREE.BackSide,
      vertexShader: /* glsl */`varying vec3 vD;
        void main(){ vD = position; vec4 p = projectionMatrix*viewMatrix*vec4(position + cameraPosition, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`varying vec3 vD; uniform float uTime;
        ${SKY_COMMON}
        vec3 bandCol(float k){
          float two = mod(k + 60., 2.), three = mod(k + 60., 3.);
          float isBlue = mix(1. - step(.5, two), 1. - step(.5, three), uBandMode);          // the lowest band is blue: cream wax stands against it
          return mix(uCream, uBlue, isBlue); }
        void main(){
          vec3 d = normalize(vD + vec3(1e-5, 0., 0.));
          float az = atan(d.z, d.x + 1e-5), elD = asin(clamp(d.y, -1., 1.))*57.2958;
          float wob = sin(az*5. + elD*.11 + 1.3)*.55 + sin(az*13. - elD*.2 + 4.)*.25 + (wxN(vec2(az*9. + 40., elD*.12)) - .5)*1.3;   // degrees: pours end unevenly
          float e = elD/15. + uBandCreep + wob/15.;
          float aa = max(fwidth(e)*15., 1e-3);                              // degrees per pixel
          float k = floor(e), f = e - k;
          vec3 col = bandCol(k), below = col, above = bandCol(k + 1.);
          col *= 1. + (wxN(vec2(az*24., e*7.)) - .5)*.035 + (wxN(vec2(az*5. + 9., e*2.3)) - .5)*.03;      // the pour's own cloudiness
          // the lip: this band overlapped the one below and stopped in a thick rounded edge
          float t = clamp(f/.075, 0., 1.);
          col = mix(col, mix(col, uAmber, .34), (1. - smoothstep(0., .45, t)));
          col *= 1. + .045*sin(t*3.1416)*(1. - step(1., t));
          // under the lip above: the buried shade line, then its beads hanging into this band
          float dd = (1. - f)*15.;                                           // degrees below the lip above
          col = mix(col, mix(below, uAmber, .5), (1. - smoothstep(0., .5, dd))*.5);
          float elB = (k + 1. - uBandCreep)*.2618;                            // the lip's own elevation, radians
          float n = max(floor(120.*cos(clamp(elB, 0., 1.45))), 6.), cx = az/6.28319*n + k*.37, c = floor(cx), fx = cx - c - .5;
          float h1 = wxH(vec2(c, k*7. + 1.)), h2 = wxH(vec2(c*3.1, k + 5.)), h3 = wxH(vec2(c + 11., k*3.));
          float cell = 360./n*max(cos(clamp(elB, 0., 1.45)), .08);            // degrees across one bead cell
          float drop = (.34 + 1.05*h1*h1)*(.85 + .15*sin(uTime*.5 + h2*40.)), r = .22 + .2*h2;
          float px = (fx - (h3 - .5)*.4)*cell, py = dd - drop;
          float tn = clamp(dd/max(drop, 1e-3), 0., 1.), nw = mix(r*1.5, r*.52, smoothstep(0., .75, tn));       // the neck flares where it joins the lip
          float bead = 1. - smoothstep(r - aa, r + aa, length(vec2(px, py*.85)));
          float neck = (1. - smoothstep(nw - aa*.5, nw + aa*.5, abs(px)))*step(dd, drop);
          float on = step(.3, h3 + h1*.3)*clamp(r/aa, 0., 1.);
          vec3 bc = mix(above, uHoney, .22)*(1. - .1*smoothstep(-r, r, px));
          float lipT = .2 + .09*sin(az*n*.5 + k) + .1*wxN(vec2(cx*.7, k));                                   // the lip itself: a rounded roll of the pour above, standing proud of the band below
          col = mix(col, mix(above, uHoney, .22)*(1. - .07*smoothstep(0., lipT, dd)), 1. - smoothstep(lipT - aa, lipT + aa, dd));
          col = mix(col, bc, max(bead, neck)*on);
          // the sun: a plain pale disc
          float sd = acos(clamp(dot(d, uSun), -1., 1.))*57.2958;
          col = mix(col, uGlint*.45, 1. - smoothstep(2.6 - aa, 2.6 + aa, sd));
          if (d.y < 0.) col = uVeil;
          gl_FragColor = vec4(col, 1.);
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), skyMat); sky.frustumCulled = false; sky.renderOrder = -10; sky.name = 'sky'; scene.add(sky);
    // ----- the clouds: slabs of cream wax at 420 m, each exactly the shape of the shadow it throws (they read the same field, up-sun) -----
    const cloudGeo = new THREE.BufferGeometry();
    { const P = [], L = []; for (const [y, l] of [[452, 1], [420, 0]]) { const a = 2600; P.push(-a, y, -a, a, y, -a, a, y, a, -a, y, a); L.push(l, l, l, l); }
      cloudGeo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); cloudGeo.setAttribute('aLayer', new THREE.Float32BufferAttribute(L, 1)); cloudGeo.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]); }
    const cloudMat = new THREE.ShaderMaterial({
      uniforms: { ...skyU, uField: U.uField, uFieldXf: U.uFieldXf, uFieldSize: U.uFieldSize, uSunShift: U.uSunShift }, side: THREE.DoubleSide,
      vertexShader: /* glsl */`attribute float aLayer; varying vec3 vW; varying float vL;
        void main(){ vL = aLayer; vW = position + vec3(-50., 0., 340.); gl_Position = projectionMatrix*viewMatrix*vec4(vW, 1.); }`,
      fragmentShader: /* glsl */`varying vec3 vW; varying float vL;
        ${WAX_FIELD}
        ${SKY_COMMON}
        void main(){
          vec2 sdir = normalize(uSun.xz + vec2(1e-4));
          vec2 q = vW.xz + uSunShift*420. + sdir*vL*-22.;                                      // the upper pour sits a little up-sun: the slab's lit flank
          vec2 f = vec2(uFieldXf.x*q.x - uFieldXf.y*q.y, uFieldXf.y*q.x + uFieldXf.x*q.y) + uFieldXf.zw;
          vec2 uvf = f/uFieldSize + .5;
          float ta = texture2D(uField, uvf).a;
          float dl = length(vW.xz - vec2(-50., 340.));                                          // metres from the middle of the field's own ground (a place of the world, not the eye)
          float inside = min(min(uvf.x, uvf.y), min(1. - uvf.x, 1. - uvf.y)) + (wxN(q/170. + 5.) - .5)*.07;      // the field's own border is no line in the sky
          // the rim is beaded: a round bulge every thirty-odd metres
          vec2 bq = q/34., bc = floor(bq), bf = fract(bq) - .5 - (vec2(wxH(bc + 3.), wxH(bc + 17.)) - .5)*.5;
          float bead = 1. - smoothstep(0., .52, length(bf));
          float qe = fwidth(q.x) + fwidth(q.y);
          float scal = (bead - .3)*.3*(1. - smoothstep(8., 24., qe));      // (beads too small for the picture are not drawn: no grit on a far rim)
          float far = wxN(q/520. + 3.)*.55 + wxN(q/210.)*.45;                                  // beyond the field the slabs go on, poured by the same hand,
          float thr = mix(.62, .38, smoothstep(.5, .8, uCover)) + .26*smoothstep(550., 1150., dl);   // fewer and smaller far out from the field (no lid, no cut edge): the lowest band stays clear
          float farM = far - thr, af = smoothstep(-.06, .06, farM)*(1. - smoothstep(1000., 1200., dl + 240.*(wxN(q/260. + 9.) - .5)));
          float afw = .5 + .5*smoothstep(0., .16, farM);
          float wf = smoothstep(0., .08, inside);
          float a = mix(af, ta, wf) + scal*(1. - smoothstep(.75, 1., ta)*wf);
          if (a < .5) discard;
          float inD = clamp(mix(afw, ta, wf) + scal*.5, 0., 1.);                               // .5 at the rim, 1 in the slab's heart (a slab is thick: its edge is a wide rounded roll, not a cut)
          float rim = 1. - smoothstep(.52, .7, inD);
          float dist = length(vW - cameraPosition);
          // the underside: the buried amber layer, deep, poured in overlapping rounds with a made edge between them
          float pr = wxN(q/95.)*.6 + wxN(q/38. + 7.)*.4, pw = max(fwidth(pr), 1e-4);
          vec3 under = mix(mix(uAmber, uUmber, .16), mix(uAmber, uUmber, .44), smoothstep(.36, .64, pr));
          under = mix(under, mix(uAmber, uUmber, .62), (1. - smoothstep(0., pw*1.5 + .012, abs(pr - .5)))*.7*(1. - rim));
          under *= .96 + .08*wxN(q/23. + 4.);
          // the rim: a thick rounded roll, honey where the sun comes through its thin edge, a dark crease where the roll meets the belly
          float roll = rim*rim*(3. - 2.*rim);
          under = mix(under, mix(uHoney, uCream, .12), roll*.9);
          under = mix(under, mix(uAmber, uUmber, .5), (1. - smoothstep(0., .12, abs(rim - .22)))*.6);
          under = mix(under, uCream, smoothstep(.75, 1., rim)*.4*bead*(1. - smoothstep(8., 24., qe)));
          vec3 top = mix(uCream*(1.02 + .03*wxN(q/31.)), mix(uCream, uHoney, .35), (1. - rim)*.5);
          vec3 col = mix(under, top, vL);
          gl_FragColor = vec4(waxVeil(col, dist*.22), 1.);
        }`,
    });
    const clouds = new THREE.Mesh(cloudGeo, cloudMat); clouds.frustumCulled = false; clouds.renderOrder = -5; clouds.name = 'clouds'; scene.add(clouds);
    await ctx.yield();
    // ----- fringes: one teardrop, instanced. iPos = where it hangs (set state), iA = length, width, phase, sag weight; iB = rnd, base x, base z, kind -----
    // kind 0: hangs from set swell (anchor fixed, gone in sun); kind 1: from a field crest that sinks in sun; kind 2: from a live crest or a stack (never sinks)
    const CREST_GLSL = /* glsl */`
      // a field crest's or a lip's height in its present state, by ONE rule: its metres into sun. At the shadow's edge it stands whole; from there it sags
      // steadily, the brief's three metres (or half its height, whichever is less) by 34 m of sun, the lane's width; far out in open sun it goes on down
      // into the sea. A live crest (live 1) rolls in sun and stands where the shade caught it; live 2 = a stack, 3 = a hoop: neither.
      float crestK(vec2 base, float live, float H, out float sunM){
        vec4 fc = waxField(vec3(base.x, 0., base.y)); sunM = waxSunM(fc, 0.);
        float lv = max(live, 0.), old = max(1. - lv, 0.), sagF = min(3., .5*H)/max(H, 1.)*waxSag(sunM);
        float sink = (sagF + (1. - sagF)*.94*smoothstep(34., 100., sunM))*old, roll = (1. - waxSet(fc, 0.))*lv*max(2. - lv, 0.);
        float up = mix(1., smoothstep(4.5, 8., fc.r), waxSet(fc, 0.)*step(lv, .5));      // behind a setting edge a lip is not there at once: it stands up over the first metres of shade
        return (1. - max(sink, .94*(1. - up)))*(1. - roll*(.2 - .07*sin(uTime*.9 + base.x*.3)));
      }`;
    const FRINGE_VERT = /* glsl */`
      float kind = iB.w, sunB = 0., kc = 1., kf = fract(kind + 1e-4), isC = step(.5, kind)*step(kind, 2.9); if (isC > .5) kc = crestK(iB.yz, floor(kind + 1e-4) - 1., kf*100., sunB);   // (kind = 1 + H/100 on an old crest or lip, 2 + H/100 on a live crest, 3 on a stack or hoop, 0 on the swell)
      vec3 an = iPos; an.y = an.y*kc - (kind > .5 && kind < 2. ? 2.4*smoothstep(34., 100., sunB) : 0.);
      float oldF = 1.;
      if (kind < .5) { vec2 ln = vec2(${WAVES[0][0].toFixed(4)}, ${WAVES[0][1].toFixed(4)})*iB.y; float old = smoothstep(2., 7.5, waxField(vec3(an.x - ln.x, 0., an.z - ln.y)).r);
        an.xz -= ln*(1. - old); an.y = mix(iB.z, an.y, old); oldF = old; }        // on wax set a second ago the lip is not thrown yet: the drip starts as the lip is thrown, and hangs from it
      vec4 f0 = waxField(an); float st = waxSet(f0, 0.), sunM = waxSunM(f0, 0.), ph = iA.z;
      float sw0 = kind < .5 ? smoothstep(.2, .7, st)*smoothstep(.15, .9, oldF) : 1.; an.y = mix(0., an.y, mix(1., st, step(kind, .5)));     // swell fringes go with the swell that carried them
      float grow = max(clamp((f0.r - .5)/9., 0., 1.), 1. - smoothstep(.25, .75, f0.a));      // lengthens over the first metres behind the setting edge (a bead, a stub, a drip), then hardens; the sun finds it as long as the shade left it
      float t1 = clamp((sunM - .5 - ph*20.)/8., 0., 1.), t2 = clamp((sunM - 8. - ph*22.)/4., 0., 1.);   // in sun, by its metres into it: each stretches to a thread and lets go once, in turn; by 34 m the fringe is gone
      float L = iA.x*(.18 + .82*grow)*(1. + 1.6*t1*t1)*(1. - t2)*sw0;
      if (kind > .5) L = min(L, max(an.y - .35 - 1.5*iA.w*waxSag(sunM), .12));      // a drip stops short of the sea under it
      float pix = distance(an, cameraPosition)*.0011;
      float w = max(iA.y, pix)*(1. - t2)*smoothstep(0., .12, grow + (1. - st))*sw0, bead = w*(1. + .4*t1);
      float bl = min(bead*2.6, L*.75), t = position.y, isB = step(.6, t);
      float yl = mix((t/.6)*(L - bl), (L - bl) + (t - .6)/.4*bl, isB);
      float rr = mix(w*(1. - .6*t1), bead, isB);
      vec3 vd = cameraPosition - an; vec2 rg = normalize(vec2(vd.z, -vd.x) + vec2(1e-4, 0.));        // turned to the eye in plan (the swell's fringe is a ribbon)
      p = an + vec3((rg.x*position.x - rg.y*position.z)*rr, -yl - 1.5*iA.w*waxSag(sunM), (rg.y*position.x + rg.x*position.z)*rr);
      n = vec3(rg.x*normal.x - rg.y*normal.z, normal.y, rg.y*normal.x + rg.x*normal.z);
      float sw = (1. - st)*t*t*L; p.x += sin(uTime*1.3 + ph*40.)*.06*sw; p.z += cos(uTime*1.1 + ph*31.)*.06*sw;
      thin = mix(.85, .35, isB); hollow = 0.; force = 0.; tg = vec3(1., 0., 0.);
      s = vec2(ph*97. + position.x, yl + iB.x*31.);`;
    const fringe = [], seaFringe = [];                                    // crest and stack fringes (round drips; the nearest get the 45-triangle one), and the swell's (ribbons)
    {
      // swell fringes hang from the sea grid's own thrown edges: a vertex whose lean drops sharply to the next row is a lip, and
      // the grid edges joining neighbouring lip vertices are where the wax ran over and stopped
      const d1x = WAVES[0][0], d1z = WAVES[0][1], want = Math.round(3700 * detail * Math.min(ed.fringe, 1.2));
      const sp = seaGeo.getAttribute('position').array, sc = seaGeo.getAttribute('aCalm').array, edges = [];
      const iLo = xOff.findIndex((o) => o > -150), iHi = xOff.length - 1 - iLo;
      const jLo = zRows.findIndex((z) => z > -45), jHi = zRows.findIndex((z) => z > 742), fwd = d1z > 0 ? 1 : -1, nI = iHi - iLo + 1;
      const mG = new Float32Array((jHi - jLo + 1) * nI), lip = new Uint8Array(mG.length);
      for (let j = jLo; j <= jHi; j++) { for (let i = iLo; i <= iHi; i++) { const k = (j * nxc + i) * 3; mG[(j - jLo) * nI + i - iLo] = mSet(sp[k], sp[k + 2]); } if (j % 6 === 5) await ctx.yield(); }
      const vAt = (i, j, m, out) => { const k = j * nxc + i, c = sc[k * 3 + 1], ss = sc[k * 3 + 2], ln = setLean(m) * c * ss; out[0] = sp[k * 3] + d1x * ln; out[1] = setY(m) * c * ss; out[2] = sp[k * 3 + 2] + d1z * ln; out[3] = ln; out[4] = (1.15 * Math.pow(clamp(m, 0, 1), 1.5) - 0.4) * c * ss; return out; };
      const zEdge = zLane;                                                // on the setting side of the lane (to the lane's end), at arm's length, every crest gets its row (there the swell is seen being set)
      for (let j = jLo + 1; j < jHi; j++) for (let i = iLo; i <= iHi; i++) { const q = (j - jLo) * nI + i - iLo, strip = xOff[i] > 8.5 && xOff[i] < 25 && zRows[j] < zEdge;
        lip[q] = (strip ? mG[q] > 0.2 : setLean(mG[q]) - setLean(mG[q + fwd * nI]) > 0.8 && sc[(j * nxc + i) * 3 + 2] > 0.6) && sc[(j * nxc + i) * 3 + 1] > 0.9 ? 1 : 0; }      // (in the strip: the whole back of each crest beads as the shade takes it)
      await ctx.yield();
      for (let j = jLo + 1; j < jHi - 1; j++) for (let i = iLo; i < iHi; i++) {
        const q = (j - jLo) * nI + i - iLo;
        if (lip[q] && lip[q + 1]) edges.push([i, j, mG[q], i + 1, j, mG[q + 1]]);
        else if (lip[q + 1] && lip[q + nI]) edges.push([i + 1, j, mG[q + 1], i, j + 1, mG[q + nI]]);
      }
      await ctx.yield();
      const A = [0, 0, 0, 0, 0], B = [0, 0, 0, 0, 0], frng = ctx.core.makeRng(ctx.core.hashSeed('swell-fringe:' + ctx.seed));
      const nearE = edges.filter((e) => Math.abs(xOff[e[0]]) < 46), farE = edges.filter((e) => Math.abs(xOff[e[0]]) >= 46);
      const edgeE = edges.filter((e) => xOff[e[0]] > 8.5 && xOff[e[0]] < 25 && zRows[e[1]] < zEdge), nBead = Math.round(2300 * detail);
      await ctx.yield();
      for (let n = 0; n < want + nBead && edges.length; n++) {
        if (n % 100 === 99) await ctx.yield();
        const pool = ((n % 6 === 3 || n >= want) && edgeE.length) ? edgeE : ((n % 6 < 5 && nearE.length) ? nearE : (farE.length ? farE : nearE)), e = pool[Math.floor(frng() * pool.length)], t = frng();
        vAt(e[0], e[1], e[2], A); vAt(e[3], e[4], e[5], B);
        let ln = lerp(A[3], B[3], t), x = lerp(A[0], B[0], t) + d1x * 0.12, y = lerp(A[1], B[1], t) - 0.07, z = lerp(A[2], B[2], t) + d1z * 0.12, yF = lerp(A[4], B[4], t);   // yF: where it sits while the wax under it is still round
        if (pool === edgeE) {                                               // on the backs that are being set: anywhere on the back, more toward the crest line (no rows along the grid)
          const k0 = e[1] * nxc + e[0], cs = sc[k0 * 3 + 1] * sc[k0 * 3 + 2], bx = lerp(sp[k0 * 3], sp[(e[4] * nxc + e[3]) * 3], t), bz = sp[k0 * 3 + 2] + (frng() - 0.5) * 2.6, m = mSet(bx, bz);
          if (frng() > m * m * 1.6) continue;
          ln = setLean(m) * cs; x = bx + d1x * (ln + 0.12); z = bz + d1z * (ln + 0.12); y = setY(m) * cs - 0.07; yF = (1.15 * Math.pow(m, 1.5) - 0.4) * cs;
        }
        const wk = pool === edgeE ? 1.45 : 1;
        const off = x - laneAt(z, _lt).x; if ((off > -6.2 && off < 5.2) || (z > swZ0 && z < swZ1 && eyeDist(x, z) < 3)) continue;                 // clear of our own track (measured across the lane table: no path search per drip) and of the eye's swing
        const len = (0.7 + 1.7 * Math.pow(frng(), 1.3)) * Math.min(ed.fringe, 1.3) * lerp(0.85, 1.15, smoothstep(0.7, 1.3, density)) * sc[(e[1] * nxc + e[0]) * 3 + 2];
        seaFringe.push({ p: [x, y, z], a: [len, (0.06 + 0.06 * frng() + len * 0.02) * wk, frng(), 0], b: [frng(), ln, yF, 0] });
      }
    }
    await ctx.yield();
    // ----- the field: older set crests 8-14 m high, curled over; stacks of piled pours. One merged geometry, one material -----
    const pour = { pos: [], uv: [], tan: [], thin: [], hol: [], base: [], idx: [] };
    const PROF = [[1.45, -0.06, 0, 0], [1.0, 0.02, 0, 0.2], [0.6, 0.16, 0, 0.5], [0.34, 0.36, 0, 1.3], [0.22, 0.56, 0, 1.7], [0.24, 0.72, 0, 1.7], [0.4, 0.85, 0, 1.2], [0.66, 0.9, 0.1, 0.4],
      [0.9, 0.86, 1, 0], [0.88, 0.93, 0.7, 0], [0.62, 1.0, 0.12, 0], [0.3, 1.0, 0, 0], [0.0, 0.93, 0, 0], [-0.4, 0.7, 0, 0], [-0.8, 0.38, 0, 0], [-1.2, 0.08, 0, 0], [-1.45, -0.06, 0, 0]];
    // the same pour, drawn with twice the rows (a rounded curl, no facets): Catmull-Rom between the hand-set rows
    { const P0 = PROF.slice(); PROF.length = 0;
      for (let i = 0; i < P0.length; i++) {
        PROF.push(P0[i]); if (i === P0.length - 1) break;
        const a = P0[Math.max(i - 1, 0)], b = P0[i], c = P0[i + 1], d = P0[Math.min(i + 2, P0.length - 1)];
        PROF.push([0, 1].map((k) => (-a[k] + 9 * b[k] + 9 * c[k] - d[k]) / 16).concat([(b[2] + c[2]) / 2, (b[3] + c[3]) / 2]));
      } }
    const TIP = 16;
    // point of crest c at tt (0..1 along it), profile row r -> [x, y, z]
    const crestPoint = (c, tt, r, out) => {
      const sA = (tt - 0.5) * c.len, hK = Math.pow(Math.max(Math.sin(Math.PI * tt), 0), 0.55) * (1 + 0.14 * noise.n2(sA * 0.07 + c.sd, 1.7)), wK = Math.max(hK, 0.3);
      const pr = PROF[r], bow = c.bow * (1 - (2 * tt - 1) * (2 * tt - 1));
      let off = pr[0] * c.H * wK + bow, y = pr[1] * c.H * hK;
      if (r > 0 && r < PROF.length - 1) { off += 0.05 * c.H * noise.n2(sA * 0.16 + c.sd, y * 0.2) + 0.03 * c.H * Math.sin(sA * 1.3 + c.sd); y += pr[2] * 0.06 * c.H * noise.n2(sA * 0.22, c.sd + 5); }
      out[0] = c.x + c.tx * sA + c.nx * off; out[1] = y; out[2] = c.z + c.tz * sA + c.nz * off; return out;
    };
    const addCrest = (c) => {
      const cols = Math.max(8, Math.round(c.len / (c.far ? (c.lip ? 2.0 : 2.6) : (c.lip ? 1.0 : 1.1)))), nr = PROF.length, b0 = pour.pos.length / 3, P = [0, 0, 0];
      for (let i = 0; i <= cols; i++) {
        let arc = 0, px = 0, py = 0, pz = 0;
        for (let r = 0; r < nr; r++) {
          crestPoint(c, i / cols, r, P);
          if (r > 0) arc += Math.hypot(P[0] - px, P[1] - py, P[2] - pz); px = P[0]; py = P[1]; pz = P[2];
          pour.pos.push(P[0], P[1], P[2]); pour.uv.push((i / cols) * c.len + c.sd * 40, arc + c.sd * 13); pour.tan.push(c.tx, 0, c.tz);
          pour.thin.push(PROF[r][2]); pour.hol.push(clamp(PROF[r][3] * (0.95 + 0.3 * noise.n2(i * 0.3 + c.sd, r * 0.6)), 0, 2)); if (c.lip) { const sA = (i / cols - 0.5) * c.len; pour.base.push(c.x + c.tx * sA + c.nx * c.H * 0.5, c.z + c.tz * sA + c.nz * c.H * 0.5, 0, c.H); }      // a lip melts along its length as the edge crosses it
          else pour.base.push(c.x + c.nx * c.H * 0.5, c.z + c.nz * c.H * 0.5, c.live, c.H);
        }
      }
      for (let i = 0; i < cols; i++) for (let r = 0; r < nr - 1; r++) { const a = b0 + i * nr + r, b = a + nr; pour.idx.push(a, a + 1, b, b, a + 1, b + 1); }
    };
    // a stack: pours piled one on another, each overhanging the shoulder below; returns the lips drips hang from
    const addStack = async (sx, sz, H, R0, sd) => {
      const sides = 20, lips = []; let y = -0.8, r = R0, ox = 0, oz = 0, k = 0;
      while (y < H) {
        const h = lerp(5.5, 3.2, y / H) * (0.8 + 0.4 * stk()), b0 = pour.pos.length / 3;
        const rows = [[0.78, -0.35, 0, 1.7], [1.0, 0.14, 0.45, 0], [1.03, 0.5, 0, 0.1], [0.9, 1.0, 0, 1.3]];       // under each overhanging shoulder the buried layer shows, deep (a hollow above 1)
        for (let j = 0; j < rows.length; j++) for (let i = 0; i <= sides; i++) {
          const a = (i / sides) * Math.PI * 2, wob = 1 + 0.09 * noise.n2(Math.cos(a) * 1.3 + sd + k, Math.sin(a) * 1.3 + k * 3.1);
          const rr = r * rows[j][0] * wob, yy = y + h * rows[j][1] + (j === 1 ? 0.5 * noise.n2(a * 2 + sd, k) : 0);
          pour.pos.push(sx + ox + Math.cos(a) * rr, yy, sz + oz + Math.sin(a) * rr); pour.uv.push(a * r + sd * 9, yy + sd * 5); pour.tan.push(-Math.sin(a), 0, Math.cos(a));
          pour.thin.push(rows[j][2]); pour.hol.push(rows[j][3]); pour.base.push(sx, sz, 2, 0);
          if (j === 1 && i < sides && k > 0) lips.push([sx + ox + Math.cos(a) * rr, yy - 0.1, sz + oz + Math.sin(a) * rr, h]);
        }
        for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < sides; i++) { const a = b0 + j * (sides + 1) + i, b = a + sides + 1; pour.idx.push(a, b, a + 1, a + 1, b, b + 1); }
        y += h; r = Math.max(r * (0.8 + 0.17 * stk()), 1.3); ox += stk.range(-0.25, 0.25) * r; oz += stk.range(-0.25, 0.25) * r; k++;
        if (k % 3 === 0) await ctx.yield();
      }
      return lips;
    };
    // ----- the field's set crests and the set swell's lips: each kind is dealt by ONE rule from a stream of its own (made from the world's seed and a
    // name: none draws from another). Places are metres flown along the course and metres off it; every crest and lip lies as the swell lies.
    const mkStream = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    const MARGIN = 8;                                                    // metres: no crest, lip or stack stands nearer the course (or the eye's one swing off it) than this
    const courseDist = (x, z) => Math.min(path.nearestXZ(x, z).dist, eyeDist(x, z));
    const crests = [], nCrest = Math.round(clamp(24 * density, 18, 30)), _p = new THREE.Vector3(), _t = new THREE.Vector3(), cp = [0, 0, 0];
    const besideCourse = (m, side, lat, out) => { path.posAtDist(m, _p); path.tangentAtDist(m, _t); _t.y = 0; _t.normalize(); out.x = _p.x + _t.z * side * lat; out.z = _p.z - _t.x * side * lat; out.rx = _t.z * side; out.rz = -_t.x * side; return out; };   // side +1 = toward +X (the setting side), -1 = the wall's side
    const _bc = { x: 0, z: 0, rx: 0, rz: 0 };
    // seen from the entry the breaker stands across the bow: no crest may reach more than 0.6 of the way up to its lip line there
    const P0x = pts[0][0], P0z = pts[0][2];
    const capH = (x, z, H) => {
      const dx = P0x - x, dz = z - P0z, d = Math.hypot(dx, dz), sb = dx / Math.max(d, 1);
      if (dz < -20 || sb < 0.46 || sb > 0.96) return H;
      return Math.min(H, 0.6 * hero.size.height * sb * d / (P0x + 165));
    };
    // ----- stacks, placed first (the tallest things: crests and lips keep clear of them): three among the field's crests (one slides by 18 m off on the
    // open side, one stands on the wall's side of the lane, one far out), six beyond the hook to z 900 -----
    const stackAt = [], stk = mkStream('stacks');
    const mField = mAtSec(5);                                            // the field begins where the brief's fifth second falls on the course (the lane bends into it)
    { const add = (m, side, off, H, R0) => { besideCourse(m, side, off + R0, _bc); stackAt.push([_bc.x, _bc.z, H, R0]); };
      add(lerp(mField, mFace, (2.5 + stk.range(-0.15, 0.15)) / 6), 1, 18, stk.range(34, 46), 6.5);      // (the near row of crests takes every other sixth of the field on each side: this one stands in an open sixth)
      add(mField * (0.8 + stk.range(-0.1, 0.1)), -1, 30, stk.range(34, 44), 6.5);
      add(lerp(mLane, mFace, stk.range(0.2, 0.9)), 1, stk.range(90, 150), stk.range(40, 58), 8.5);
      for (let i = 0; i < 6; i++) stackAt.push([lerp(-285, 40, (i + stk.range(0.15, 0.85)) / 6), stk.range(745, 900), stk.range(30, 60), stk.range(6, 10)]); }
    const clearOfStacks = (c) => { for (const st of stackAt) { const dx = st[0] - c.x, dz = st[1] - c.z; if (Math.abs(dx * c.nx + dz * c.nz) < 1.45 * c.H + st[3] + 2 && Math.abs(dx * c.tx + dz * c.tz) < c.len * 0.5 + st[3] + 2) return false; } return true; };
    const clearOfCourse = (c, n, baseM) => {                             // every row of the pour that stands a metre or more above the sea keeps the margin; its low foot keeps baseM
      for (let k = 0; k <= n; k++) for (let r = 0; r < PROF.length; r += 2) { crestPoint(c, k / n, r, cp); if (courseDist(cp[0], cp[2]) < (cp[1] > 1 ? MARGIN : baseM)) return false; }
      return true;
    };
    {
      // crests 8 to 14 m high: a near row through the field (one in each sixth of it, from its beginning to the face, sides in turn, the lip 8 m off and fringes
      // overhead as we pass), and a scatter beyond 42 m on both sides (none between the course and the breaker's face)
      const cr = mkStream('field-crests'), nNear = 6, mOpen = mAtZ(470);
      for (let slot = 0, guard = 0; crests.length < nCrest && guard < 420; guard++) {
        await ctx.yield();
        const nearRow = slot < nNear * 12, kq = Math.floor(slot / 12), side = nearRow ? (kq % 2 ? 1 : -1) : (cr() < 0.5 ? 1 : -1);
        const m = nearRow ? lerp(mField, mFace, (kq + 0.5 + cr.range(-0.2, 0.2)) / nNear) : cr.range(0, side > 0 ? mOpen : mFace);
        const H0 = cr.range(8, 14), len = cr.range(28, 50), yaw = cr.range(-0.22, 0.22) + (nearRow ? 0 : cr.range(-0.5, 0.5));
        const lat = nearRow ? MARGIN + 0.9 * H0 + cr.range(0.6, 3.4) : cr.range(42, 150);
        besideCourse(m, side, lat, _bc);
        // the face looks back at the course: n = -r, turned by yaw; t = (-n.z, 0, n.x) keeps the winding outward
        const cy = Math.cos(yaw), sy = Math.sin(yaw), nx = -(_bc.rx * cy - _bc.rz * sy), nz = -(_bc.rx * sy + _bc.rz * cy);
        const H = capH(_bc.x, _bc.z, H0);
        const c = { x: _bc.x, z: _bc.z, nx, nz, tx: -nz, tz: nx, H, len, bow: cr.range(-0.1, 0.25) * H, sd: cr.range(0, 60), live: side > 0 ? 1 : 0, far: !nearRow && lat > 62, near: nearRow, side, m };
        let ok = H >= 6.5 && breakerDist(c.x, c.z) > (nearRow ? 30 : 60) && heapK(c.x, c.z) < 0.01;
        for (const o of crests) if (Math.hypot(o.x - c.x, o.z - c.z) < (o.len + c.len) * 0.36) ok = false;
        ok = ok && clearOfStacks(c) && clearOfCourse(c, 8, 3);
        if (nearRow) slot += ok ? 12 - (slot % 12) : 1;
        if (!ok) continue;
        crests.push(c); addCrest(c);
        const nd = Math.round(c.len * 1.9 * detail * Math.min(ed.fringe, 1.15) * (nearRow ? 1 : 0.55));
        for (let k = 0; k < nd; k++) {
          const tt = cr.range(0.06, 0.94), row = cr() < 0.7 ? TIP : (cr() < 0.5 ? TIP - 2 : TIP + 2); crestPoint(c, tt, row, cp);
          const hK = cp[1] / c.H, len2 = (0.5 + 3.4 * Math.pow(cr(), 1.3)) * clamp(hK * 1.3, 0.25, 1) * (0.75 + 0.5 * noise.n2(tt * c.len * 0.08, c.sd)) * (row === TIP ? 1 : 0.6);
          fringe.push({ p: [cp[0], cp[1] - 0.05, cp[2]], a: [len2, 0.08 + 0.1 * cr() + len2 * 0.025, cr(), row === TIP ? 1 : 0.5], b: [cr(), c.x + c.nx * c.H * 0.5, c.z + c.nz * c.H * 0.5, c.live + 1 + c.H / 100] });
        }
        if (crests.length % 4 === 0) await ctx.yield();
      }
    }
    // ----- the set swell's own lips: where shade has stood, a swell crest near the lane is a thrown lip 4 to 7 m high, a boat's length or three long, lying
    // along the sea's own frozen crest line and thrown the way the swell was running (toward the boat that comes up the lane, since the swell runs against
    // our course). Each column melts by its own point of the field, so a lip the edge is crossing stands half set, half sagging. -----
    const lips = [], nLip = Math.round(clamp(42 * lerp(0.85, 1.1, smoothstep(0.7, 1.3, density)), 34, 46)), wdx = WAVES[0][0], wdz = WAVES[0][1];
    // one lip: at m metres flown, lat metres to one side of the course, lying as the swell lies there; one of a row stands where it is asked for, one of the
    // scatter is laid on the nearest frozen crest line of the set swell
    const tryLip = (lr, m, side, lat, len, H, o = {}) => {
      besideCourse(m, side, lat, _bc);
      let best = -1, bk = 0;
      if (o.row) best = 1; else for (let k = -28; k <= 28; k++) { const ms = mSet(_bc.x + wdx * k * 0.5, _bc.z + wdz * k * 0.5); if (ms > best) { best = ms; bk = k; } }
      const yaw = lr.range(-0.2, 0.2), cy = Math.cos(yaw), sy = Math.sin(yaw), nx = wdx * cy - wdz * sy, nz = wdx * sy + wdz * cy, fo = 2.2 - 0.45 * H;
      const c = { x: _bc.x + wdx * bk * 0.5 + nx * fo, z: _bc.z + wdz * bk * 0.5 + nz * fo, nx, nz, tx: -nz, tz: nx, H, len, bow: lr.range(-0.05, 0.3) * H, sd: lr.range(0, 60), live: 0, lip: true, far: lat > 38 };
      let ok = best > 0.8 && breakerDist(c.x, c.z) > (o.wallM || 26) && (o.onHeap || heapK(c.x, c.z) < 0.01) && Math.hypot(c.x - P0x, c.z - P0z) > 24;
      for (const q of lips) if (ok && Math.hypot(q.x - c.x, q.z - c.z) < (q.len + c.len) * 0.33) ok = false;
      for (const q of crests) if (ok) { const dx = c.x - q.x, dz = c.z - q.z; if (Math.abs(dx * q.tx + dz * q.tz) < q.len * 0.5 + 8 && Math.abs(dx * q.nx + dz * q.nz) < 1.45 * q.H + c.len * 0.5) ok = false; }   // not through an old crest: beyond its ends
      ok = ok && clearOfStacks(c) && clearOfCourse(c, 6, 4);
      if (!ok) return false;
      lips.push(c); addCrest(c);
      const nd = Math.round(c.len * (o.fringe || 2.7) * detail * Math.min(ed.fringe, 1.15)), fk = o.thick || 1;
      for (let k = 0; k < nd; k++) {
        const tt = lr.range(0.05, 0.95), row = lr() < 0.8 ? TIP : TIP + 1; crestPoint(c, tt, row, cp);
        const sA = (tt - 0.5) * c.len, lk = 0.45 + 0.55 * smoothstep(-0.4, 0.5, noise.n2(sA * 0.21 + c.sd, 2.2));        // the fringe runs long and short in stretches
        const len2 = (0.3 + 1.7 * Math.pow(lr(), 1.6)) * lk * clamp(cp[1] / c.H * 1.4, 0.3, 1) * Math.min(ed.fringe, 1.3) * (o.long || 1);
        fringe.push({ p: [cp[0], cp[1] - 0.04, cp[2]], a: [len2, (0.07 + 0.07 * lr() + len2 * 0.03) * fk, lr(), 1], b: [lr(), c.x + c.tx * sA + c.nx * c.H * 0.5, c.z + c.tz * sA + c.nz * c.H * 0.5, 1 + c.H / 100], rain: o.rain });
      }
      return true;
    };
    {
      const lr = mkStream('lane-lips');
      // a row up the wall-side edge of the lane and field, one lip every 16 m of course (their near ends lie in the lane and are melting)
      for (let k = 0; 16 * (k + 1) < mFace + 16; k++) { tryLip(lr, 16 * (k + 0.5 + lr.range(-0.25, 0.25)), -1, lr.range(22, 26), lr.range(18, 24), lr.range(4.6, 5.8), { row: 1 }); await ctx.yield(); }
      // a row on the setting side of the lane, one every half swell length (14 m) to the lane's end: low and round where the shade has just taken them, thrown and fringed further in
      for (let k = 0; 14 * (k + 1) < mLane + 14; k++) { tryLip(lr, 14 * (k + 0.5 + lr.range(-0.25, 0.25)), 1, lr.range(15, 17.5), lr.range(12, 15), lr.range(3.6, 4.8), { row: 1 }); await ctx.yield(); }
      // then a scatter along the sea's own crest lines further out, over the whole approach
      for (let guard = 0; lips.length < nLip && guard < 500; guard++) {
        const side = lr() < 0.66 ? -1 : 1;
        tryLip(lr, lr.range(0, mFace + 18), side, side < 0 ? lr.range(30, 62) : lr.range(10, 26), lr.range(13, 27), lr.range(4.4, 6.2));
        await ctx.yield();
      }
    }
    const potV0 = pour.pos.length / 3;                                    // the pot shade: the vertices of the run-in lips (both sides) are those the next block lays, from this one on
    {
      // the run in: from where the course eases out from the face (the brief's z 540) to the arch, one lip every half swell length (14 m) of course, 13 to 16 m
      // to the hook's side and every other one 6 m further out, standing against the heap's flanks; long thick fringes. Their state is the field's, like any lip's.
      const lr = mkStream('run-in-lips'), mEase = mAtZ(540);
      for (let k = 0; mEase + 14 * (k + 1) < PL; k++) { tryLip(lr, mEase + 14 * (k + 0.5 + lr.range(-0.25, 0.25)), -1, lr.range(13, 16) + 6 * (k % 2), lr.range(12, 16), lr.range(5.6, 7.2), { row: 1, wallM: 11, onHeap: true, fringe: 4.1, thick: 1.3, long: 1.5, rain: 0.45 }); await ctx.yield(); }
      // and on the open side, where the shade has just retaken the sea: one every swell length (28 m), 15 to 17.5 m off, as beside the lane
      for (let k = 0; mEase + 28 * (k + 1) < PL - 62; k++) { tryLip(lr, mEase + 28 * (k + 0.5 + lr.range(-0.25, 0.25)), 1, lr.range(15, 17.5), lr.range(12, 15), lr.range(3.6, 4.8), { row: 1, wallM: 11, onHeap: true }); await ctx.yield(); }
    }
    const potV1 = pour.pos.length / 3;                                    // (to this one: the run-in lips are marked by where they are built; nothing is dealt for it)
    // stacks: slim piled pours 25 to 60 m tall; their pours and fringes from the stacks' own stream
    for (let i = 0; i < NSTK; i++) { const k = [0, 1, 3, 5][i], st = stackAt[k]; stkU.value[i].set(st[0], st[1], st[3], st[2]); }
    for (const [sx, sz, H, R0] of stackAt) {
      const slips = await addStack(sx, sz, H, R0, stk.range(0, 40));
      for (const l of slips) if (stk() < 0.45 * detail) { const len = (0.5 + 3 * Math.pow(stk(), 1.5)) * Math.min(l[3] / 4, 1); fringe.push({ p: [l[0], l[1], l[2]], a: [len, 0.09 + 0.1 * stk() + len * 0.03, stk(), 0], b: [stk(), sx, sz, 3] }); }
      await ctx.yield();
    }
    if (fishCast) {                                                       // fish that crossed into shade at the top of the leap: cream hoops standing on the set swell beside the lane, dripping
      const hr = mkStream('hoops'), m0 = mAtSec(1.5);
      // the eye's track through its one swing once more, finer: a point every 0.1 m of flight (the hoops' own; the swing's track of a point every 1.5 m stays as it is)
      const eyeFine = []; for (let d = swM0; d <= swM1; d += 0.1) { eyeAt(d, _sw); eyeFine.push(_sw.x, _sw.z); }
      const eyeFineDist = (x, z) => { let b = 1e9; for (let i = 0; i < eyeFine.length; i += 2) { const dx = eyeFine[i] - x, dz = eyeFine[i + 1] - z, q = dx * dx + dz * dz; if (q < b) b = q; } return Math.sqrt(b); };
      for (let h = 0; h < 14; h++) {
        const mH = lerp(m0, mFace, (h + hr()) / 14); let latH = hr.range(MARGIN + 3, 27);
        const R = hr.range(1.5, 2.5), yaw = hr.range(0, Math.PI), b0 = pour.pos.length / 3;
        // a hoop stands further out to sea, a metre at a time, until its middle is 3.35 m and its own radius off the swing's track (a point every 1.5 m of flight),
        // and then until no part of it (wax and drips reach its radius and 0.11 m from its middle) is within 3.05 m of the eye by the finer track (a point every
        // 0.1 m of flight, between which the eye moves 0.3 m at most): so no part of a hoop is within 3 m of the eye's one swing off the course
        besideCourse(mH, 1, latH, _bc); while (eyeDist(_bc.x, _bc.z) < 3.35 + R && latH < 70) { latH += 1; besideCourse(mH, 1, latH, _bc); }
        while (eyeFineDist(_bc.x, _bc.z) < 3.05 + R + 0.11 && latH < 70) { latH += 1; besideCourse(mH, 1, latH, _bc); }
        const hx = _bc.x, hz = _bc.z;
        const seg = 14, sides = 6, y0 = Math.max(setY(mSet(hx, hz)), 0) * 0.8 - 0.2, dx = Math.cos(yaw), dz = Math.sin(yaw), ex = -dz, ez = dx;
        for (let i = 0; i <= seg; i++) {
          const a = Math.PI * (i / seg), ca = Math.cos(a), sa = Math.sin(a), tube = 0.1 + 0.13 * sa, cxp = hx + dx * ca * R, cyp = y0 + sa * R * 1.15, czp = hz + dz * ca * R;
          for (let k = 0; k <= sides; k++) {
            const kk = (k / sides) * Math.PI * 2, c1 = Math.cos(kk) * tube, c2 = Math.sin(kk) * tube;
            pour.pos.push(cxp + dx * ca * c1 + ex * c2, cyp + sa * c1, czp + dz * ca * c1 + ez * c2); pour.uv.push(k / sides * 0.9 + h * 7, a * R + h * 3); pour.tan.push(ex, 0, ez);
            pour.thin.push(0.2); pour.hol.push(0.15 + 0.3 * (1 - sa)); pour.base.push(hx, hz, 3, 0);
          }
          if (i > 2 && i < seg - 2 && hr() < 0.8 * detail) { const len = 0.3 + 0.9 * hr(); fringe.push({ p: [cxp, cyp - tube * 0.8, czp], a: [len, 0.035 + 0.03 * hr(), hr(), 0], b: [hr(), hx, hz, 3] }); }
        }
        for (let i = 0; i < seg; i++) for (let k = 0; k < sides; k++) { const a = b0 + i * (sides + 1) + k, b = a + sides + 1; pour.idx.push(a, b, a + 1, a + 1, b, b + 1); }
      }
    }
    const pourGeo = new THREE.BufferGeometry();
    await ctx.yield();
    pourGeo.setIndex(new THREE.BufferAttribute(new Uint32Array(pour.idx), 1));
    await ctx.yield();
    pourGeo.setAttribute('position', new THREE.Float32BufferAttribute(pour.pos, 3));
    await ctx.yield();
    pourGeo.setAttribute('uv', new THREE.Float32BufferAttribute(pour.uv, 2));
    await ctx.yield();
    pourGeo.setAttribute('aTan', new THREE.Float32BufferAttribute(pour.tan, 3));
    await ctx.yield();
    pourGeo.setAttribute('aThin', new THREE.Float32BufferAttribute(pour.thin, 1)); pourGeo.setAttribute('aHollow', new THREE.Float32BufferAttribute(pour.hol, 1));
    await ctx.yield();
    pourGeo.setAttribute('aBase', new THREE.Float32BufferAttribute(pour.base, 4));
    { const pot = new Float32Array(pour.pos.length / 3); pot.fill(1, potV0, potV1); pourGeo.setAttribute('aPot', new THREE.BufferAttribute(pot, 1)); }      // 1 on the run-in lips' own vertices, 0 on every other pour
    await ctx.yield();
    await waxNormals(ctx, pourGeo);
    await ctx.yield();
    const pourMat = style.material({
      clearM: 40, detail: 1, groove: 1.7, refl: 0.3, side: THREE.DoubleSide,
      // a live crest in the lane is a wave of clear wax: it clears as fast as the sea does. On every pour the two finishes meet in a poured, lobed line (nothing between)
      fragMid: 'if (vX > .5 && vX < 1.5) clearM = 5.; if (vX > 1.5) clearM = 400.; fld.a = smoothstep(.44, .56, fld.a + (wxF(s*vec2(.3, .21) + 5.) - .5)*.3);',
      vertexDecl: 'attribute vec4 aBase; attribute float aPot; varying float vPot;\n' + CREST_GLSL,
      vertexPos: /* glsl */`
        float sunC = 0., kc = crestK(aBase.xy, aBase.z, aBase.w, sunC);
        p.y = p.y*kc - (aBase.z < .5 ? 2.4*smoothstep(34., 100., sunC) : 0.) - 1.5*thin*waxSag(sunC)*step(aBase.z, .5); force = 0.; xv = aBase.z;
        if (aBase.z > 2.5) { vec4 fh = waxField(vec3(aBase.x, 0., aBase.y)); p = mix(vec3(aBase.x, .3, aBase.y), p, waxSet(fh, 0.)*smoothstep(0., 5., fh.r)); }   // a hoop exists only where the shade has caught it
        vPot = aPot;`,
      // the pot shade: the arch is the brightest honey thing of the run in, so on the run-in lips (vPot 1) the honey of thin sunlit wax is let down toward the
      // palette's amber by 0.4, at the brightness it has there; the lane's lips, the crests, the stacks and the hoops (vPot 0) keep the honey as it is
      fragDecl: 'varying float vPot;',
      fragPost: 'col = mix(col, uAmber*(dot(col, vec3(.3, .5, .2))/dot(uHoney, vec3(.3, .5, .2))), .4*vPot*smoothstep(0., .34, thin)*(1. - waxSet(fld, force)));',
    });
    const pours = new THREE.Mesh(pourGeo, pourMat); pours.frustumCulled = false; pours.name = 'crests-and-stacks'; scene.add(pours);
    // the fringe meshes: the nearest drips to our line get the 45-triangle teardrop, the rest the 15-triangle one
    const fringeMat = style.material({ clearM: 5, detail: 0, side: THREE.DoubleSide, vertexDecl: DRIP_DECL + '\n' + CREST_GLSL, vertexPos: FRINGE_VERT,
      fragMid: 'tint = mix(mix(uHoney, uAmber, .12), uCream, smoothstep(3., 10., fld.r));' });      // a drip that has just started is still honey; it pales as it hardens
    const nearF = [], farF = [];
    for (let i = 0; i < fringe.length; i++) { const f = fringe[i]; (path.distanceTo(f.p[0], f.p[1], f.p[2]) < 30 && nearF.length < 1000 ? nearF : farF).push(f); if (i % 50 === 49) await ctx.yield(); }
    const mkF = (geo, list, mat, name) => { const m = new THREE.Mesh(instAttrs(geo, list, list.length), mat); m.frustumCulled = false; m.name = name; scene.add(m); return m; };
    mkF(dripGeometry(3, [[0, 1.5], [0.6, 0.5], [0.85, 1.0]]), farF, fringeMat, 'fringe');
    { const rg = new THREE.InstancedBufferGeometry();                     // the swell's fringe: a 5-triangle ribbon of the same outline, turned to the eye
      rg.setAttribute('position', new THREE.Float32BufferAttribute([-1.5, 0, 0, 1.5, 0, 0, -0.5, 0.6, 0, 0.5, 0.6, 0, -1, 0.85, 0, 1, 0.85, 0, 0, 1, 0], 3));
      rg.setAttribute('normal', new THREE.Float32BufferAttribute([-0.7, 0, 0.7, 0.7, 0, 0.7, -0.7, 0, 0.7, 0.7, 0, 0.7, -0.7, 0, 0.7, 0.7, 0, 0.7, 0, -0.5, 0.86], 3));
      rg.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6]);
      mkF(rg, seaFringe, fringeMat, 'swell-fringe'); }
    mkF(dripGeometry(4, [[0, 1.5], [0.14, 0.8], [0.6, 0.5], [0.76, 0.9], [0.88, 1.0]]), nearF, fringeMat, 'fringe-near');
    await ctx.yield();
    // falling drops: where the lane takes a fringe it lets go as beads, looping on time while the sun is recent
    const dropList = [];
    let dropN = 0;
    const dps = mkStream('drops');
    for (const f of fringe.concat(seaFringe)) { const k = f.b[3]; if (++dropN % 400 === 0) await ctx.yield(); if ((k > 1 && k < 2 && dps() < (f.rain || 0.24)) || (k === 0 && dps() < 0.03) || (k >= 2 && k < 3 && dps() < 0.1)) dropList.push({ p: f.p, a: [f.a[0], f.a[1], dps(), 0], b: [dps(), f.b[1], f.b[2], k] }); }
    const dropMat = style.material({
      clearM: 3, detail: 0, side: THREE.DoubleSide, vertexDecl: DRIP_DECL + '\n' + CREST_GLSL,
      vertexPos: /* glsl */`
        float kind = iB.w, sunB = 0., kc = 1., kf = fract(kind + 1e-4); if (kind > .5 && kind < 2.9) kc = crestK(iB.yz, floor(kind + 1e-4) - 1., kf*100., sunB);
        vec3 an = iPos; an.y = an.y*kc - (kind > .5 && kind < 2. ? 2.4*smoothstep(34., 100., sunB) : 0.);
        vec4 f0 = waxField(an); float sunM = waxSunM(f0, 0.), ph = iA.z;
        float show = smoothstep(.5, 4., sunM - ph*8.)*(1. - smoothstep(30., 46., sunM))*step(.6, an.y);      // the rain of drops: while the fringe above is letting go (its first 34 m of sun)
        float cyc = fract(uTime/(1.5 + 1.1*iB.x) + ph*5.), tf = max(cyc - .2, 0.)/.8;
        float pix = distance(an, cameraPosition)*.0011;
        float sc = smoothstep(0., .2, cyc)*(1. - smoothstep(.93, 1., cyc))*show*max(iA.y*1.3, pix);
        p = an + vec3(position.x*sc, -position.y*sc*2.6*(1. + 1.8*tf) - .2 - (an.y + .4)*tf*tf, position.z*sc);
        thin = .9; hollow = 0.; force = 1.; tg = vec3(1., 0., 0.); s = vec2(ph*97., position.y);`,
    });
    mkF(dripGeometry(3, [[0, 0.05], [0.42, 0.4], [0.68, 0.93], [0.84, 0.93], [0.95, 0.55]]), dropList, dropMat, 'drops');      // a rounded bead with a tail, not a diamond
    await ctx.yield();
    // ----- the wax boat, carried at the camera: x = left (the sail's side, toward the sun), y = up, z = forward; the eye is its origin -----
    const boat = new THREE.Group(); boat.name = 'wax-boat'; scene.add(boat);
    const SET_FRAG = 'fld = vec4(40., 40., 0., 1.);';                     // made things stay set wax: matte, frosted, grooved
    {
      const B = { pos: [], uv: [], tan: [], thin: [], hol: [], idx: [] };
      const ns = 18, half = (z) => 1.22 * Math.pow(Math.max(1 - Math.pow(Math.max(z - 1.2, 0) / 4.3, 2.2), 0), 0.75) * lerp(0.72, 1, smoothstep(-1, 1.2, z));
      const sheer = (z) => -1.6 + 0.22 * Math.pow(Math.max(z - 1.5, 0) / 4, 2) - 0.04 * Math.sin(z * 9.1) * 0.5;
      for (const sg of [1, -1]) {
        const b0 = B.pos.length / 3;
        for (let i = 0; i <= ns; i++) {
          const z = lerp(-1.0, 5.5, i / ns), b = Math.max(half(z), 0.02), yg = sheer(z) + 0.02 * noise.n2(z * 2.1, sg * 3), yd = yg - 0.42;
          const rows = [[0, -2.95], [0.6 * b, -2.8], [0.93 * b, -2.35], [b, yg - 0.1], [b - 0.02, yg], [b - 0.12, yg], [b - 0.15, yd], [0, yd + 0.05]];
          let arc = 0;
          for (let r = 0; r < rows.length; r++) {
            if (r > 0) arc += Math.hypot(rows[r][0] - rows[r - 1][0], rows[r][1] - rows[r - 1][1]);
            B.pos.push(sg * rows[r][0], rows[r][1], z); B.uv.push(arc * sg + 20, z + 50); B.tan.push(sg, 0, 0); B.thin.push(0); B.hol.push(r === 5 || r === 6 ? 0.55 : (r < 2 ? 0.4 : 0.08));
          }
        }
        for (let i = 0; i < ns; i++) for (let r = 0; r < 7; r++) { const a = b0 + i * 8 + r, b = a + 8; if (sg > 0) B.idx.push(a, b, a + 1, a + 1, b, b + 1); else B.idx.push(a, a + 1, b, a + 1, b + 1, b); }
      }
      // the stem post, the raked mast and the long yard: tapered sticks of dark honey wax
      const stick = (p0, p1, r0, r1, n = 6) => {
        const b0 = B.pos.length / 3, d = new THREE.Vector3().subVectors(p1, p0), len = d.length(); d.normalize();
        const u1 = new THREE.Vector3(0, 1, 0).cross(d); if (u1.lengthSq() < 1e-4) u1.set(1, 0, 0); u1.normalize(); const u2 = new THREE.Vector3().crossVectors(d, u1);
        for (let j = 0; j <= 4; j++) for (let k = 0; k <= n; k++) {
          const a = (k / n) * Math.PI * 2, r = lerp(r0, r1, j / 4), c = Math.cos(a) * r, sn = Math.sin(a) * r, t = j / 4;
          B.pos.push(p0.x + d.x * len * t + u1.x * c + u2.x * sn, p0.y + d.y * len * t + u1.y * c + u2.y * sn, p0.z + d.z * len * t + u1.z * c + u2.z * sn);
          B.uv.push(a * r + 80, len * t + 90); B.tan.push(u1.x, u1.y, u1.z); B.thin.push(0); B.hol.push(0.75);
        }
        for (let j = 0; j < 4; j++) for (let k = 0; k < n; k++) { const a = b0 + j * (n + 1) + k, b = a + n + 1; B.idx.push(a, b, a + 1, a + 1, b, b + 1); }
      };
      const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
      stick(V3(0, -1.75, 5.3), V3(0, -1.05, 5.78), 0.11, 0.06);
      stick(V3(-1.02, -1.78, 3.5), V3(1.02, -1.78, 3.5), 0.1, 0.1, 4);          // a thwart
      // the rig: the mast stepped against the thwart, the lateen yard lashed down at the port bow and crossing the masthead, a boom along the foot, a sheet from the boom's end in to the helm
      stick(V3(0.55, -1.86, 3.62), V3(1.44, 1.16, 4.09), 0.07, 0.045);
      stick(V3(0.62, -1.7, 4.53), V3(1.79, 2.45, 3.93), 0.055, 0.03);
      stick(V3(0.62, -1.5, 4.56), V3(1.97, -1.31, 3.41), 0.042, 0.03);
      stick(V3(1.88, -1.33, 3.5), V3(0.1, -1.8, 2.1), 0.016, 0.016, 4);
      stick(V3(0.68, -1.47, 4.5), V3(0.7, -1.62, 4.44), 0.05, 0.05, 4);           // the tack lashing on the gunwale
      const hullGeo = new THREE.BufferGeometry(); hullGeo.setIndex(B.idx);
      hullGeo.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3)); hullGeo.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
      hullGeo.setAttribute('aTan', new THREE.Float32BufferAttribute(B.tan, 3)); hullGeo.setAttribute('aThin', new THREE.Float32BufferAttribute(B.thin, 1));
      hullGeo.setAttribute('aHollow', new THREE.Float32BufferAttribute(B.hol, 1));
      hullGeo.computeVertexNormals();
      const hullMat = style.material({ clearM: 3, detail: 1, groove: 0.31, grooveW: 0.42, tint: 'mix(uHoney, uCream, .12)', side: THREE.DoubleSide, vertexPos: 'force = 0.;', fragMid: SET_FRAG });
      const hull = new THREE.Mesh(hullGeo, hullMat); hull.frustumCulled = false; hull.name = 'hull'; boat.add(hull);
    }
    // the lateen sail: coral wax thin enough that the sun stands in it; when the shadow's edge clips it, wax frost creeps in from the peak over its outer third (a ragged front; matte, chalky, a paler coral)
    const sailU = { uFrost: { value: 0 }, uPatch: { value: new THREE.Vector3(30.8, 31.5, 0.62) }, uPatchCol: { value: waxToScene('#F9A877').multiplyScalar(1.2) }, uSeam: { value: waxToScene(mixHex(pal[5], pal[6], 0.72)) } };
    const sailT = new THREE.Vector3(0.68, -1.47, 4.5), sailP = new THREE.Vector3(1.75, 2.3, 3.95), sailC = new THREE.Vector3(1.88, -1.3, 3.5);
    {
      const n = 16, pos = [], uv = [], tan = [], idx = [], row0 = [];
      const e1 = new THREE.Vector3().subVectors(sailP, sailT), e2 = new THREE.Vector3().subVectors(sailC, sailT), nrm = new THREE.Vector3().crossVectors(e1, e2).normalize();
      if (nrm.x > 0) nrm.negate();                                        // belly toward the eye's side
      const tdir = e2.clone().normalize();
      for (let i = 0; i <= n; i++) { row0.push(pos.length / 3); for (let j = 0; j <= n - i; j++) {
        const a = i / n, b = j / n, bel = 0.3 * Math.sin(Math.PI * Math.min(a * 1.15, 1)) * Math.sin(Math.PI * b / Math.max(1 - a, 0.05) * 0.5 + 0.2) * (1 - a);
        pos.push(sailT.x + e1.x * a + e2.x * b + nrm.x * bel, sailT.y + e1.y * a + e2.y * b + nrm.y * bel, sailT.z + e1.z * a + e2.z * b + nrm.z * bel);
        uv.push(b * e2.length() + 30, a * e1.length() + 30); tan.push(tdir.x, tdir.y, tdir.z);
      } }
      for (let i = 0; i < n; i++) for (let j = 0; j < n - i; j++) { const a = row0[i] + j, b = row0[i + 1] + j; idx.push(a, a + 1, b); if (j < n - i - 1) idx.push(a + 1, b + 1, b); }
      const sailGeo = new THREE.BufferGeometry(); sailGeo.setIndex(idx);
      sailGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sailGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); sailGeo.setAttribute('aTan', new THREE.Float32BufferAttribute(tan, 3));
      sailGeo.computeVertexNormals();
      const sailMat = style.material({
        clearM: 3, detail: 1, groove: 0.85, grooveW: 0.5, tint: 'uCoral', side: THREE.DoubleSide, uniforms: sailU,
        vertexPos: 'thin = 1.; hollow = 0.; force = 0.; p += n*sin(uTime*1.7 + uv.y*1.3 + uv.x*.7)*.035*smoothstep(30., 32., uv.x);',
        fragDecl: 'uniform float uFrost; uniform vec3 uPatch, uPatchCol, uSeam;',
        fragMid: SET_FRAG + ' float fzY = mix(34.5, 32.4, uFrost) + (wxN(vec2(s.x*3.3, s.y*.7 + 4.)) - .5)*.62 + (wxN(s*9.) - .5)*.12; float fz = smoothstep(-.03, .05, s.y - fzY)*smoothstep(0., .08, uFrost); tint = mix(uCoral, mix(uCoral, uCream, .2), fz);',
        fragPost: /* glsl */`
          { vec2 pd = (s - uPatch.xy)/uPatch.z; float g = exp(-dot(pd, pd)), lit = 1. - fz;            // the sun standing in thin wax: a soft bright patch
            float sx = s.x + .05*sin(s.y*1.3), fwx = max(fwidth(s.x), 1e-4);
            float seam = 1. - smoothstep(.02, .02 + fwx, abs(fract(sx/.5) - .5)*.5);                 // cloths joined in stylus-cut seams
            col = mix(col, uSeam, seam*.85*(1. - .5*fz));
            col = mix(col, uPatchCol, clamp(g*.9 + .06, 0., 1.)*lit*(.85 + .15*wxF(s*.8)));
            col = mix(col, mix(uCoral, uCream, .26), fz*(.3 + .4*smoothstep(.45, .8, wxN(s*13.))));            // wax frost: matte, chalky, a paler coral (never white, never clear)
            col = mix(col, mix(uCoral, uCream, .36), (1. - smoothstep(0., .07, abs(s.y - fzY)))*smoothstep(.05, .2, uFrost)*.6); }`,
      });
      const sail = new THREE.Mesh(sailGeo, sailMat); sail.frustumCulled = false; sail.name = 'sail'; boat.add(sail);
    }
    // a row of drips that starts on the yard while the sail is frosted
    {
      const list = [];
      const yr = mkStream('yard-drips');
      for (let i = 0; i < 46; i++) { const a = yr.range(0.42, 0.98); list.push({ p: [lerp(sailT.x, sailP.x, a) - 0.02, lerp(sailT.y, sailP.y, a) - 0.05, lerp(sailT.z, sailP.z, a)], a: [0.12 + 0.5 * yr() * a, 0.02 + 0.016 * yr(), yr(), a], b: [yr(), 0, 0, 0] }); }
      const ydMat = style.material({
        clearM: 3, detail: 0, side: THREE.DoubleSide, uniforms: sailU, vertexDecl: DRIP_DECL + '\nuniform float uFrost;',
        vertexPos: /* glsl */`
          float g = clamp(uFrost*1.6 - (1. - iA.w)*1.2 - iA.z*.25, 0., 1.), L = iA.x*g, w = iA.y*smoothstep(0., .15, g);
          float t = position.y, isB = step(.6, t), bl = min(w*2.6, L*.75);
          float yl = mix((t/.6)*(L - bl), (L - bl) + (t - .6)/.4*bl, isB);
          p = iPos + vec3(position.x*w, -yl, position.z*w); thin = .5; hollow = 0.; force = 0.; tg = vec3(1., 0., 0.); s = vec2(iA.z*97., yl);`,
        fragMid: SET_FRAG,
      });
      const yd = new THREE.Mesh(instAttrs(dripGeometry(4, [[0, 1.4], [0.6, 0.5], [0.85, 1.0]]), list, list.length), ydMat); yd.frustumCulled = false; yd.name = 'yard-drips'; boat.add(yd);
    }
    await ctx.yield();
    // ----- the cast: wax terns (cream, stylus-cut wing lines, 2.4 m across) or flying fish (coral and honey). One instanced mesh. -----
    // local frame of a flyer: +Z = its heading, +X = its left wing, +Y up. aWing = (span position signed, part: 0 body, 1 wing, 2 wingtip drip)
    const flyerGeo = (() => {
      const P = [], UV = [], TG = [], HO = [], WG = [], IX = [];
      const v = (x, y, z, u, w, hol, span, part) => { P.push(x, y, z); UV.push(u, w); TG.push(1, 0, 0); HO.push(hol); WG.push(span, part, 0); return P.length / 3 - 1; };
      const spindle = (len, rad, z0, sides, rings, flat) => {              // body: nose at z0 + len
        const b0 = P.length / 3;
        for (let j = 0; j <= rings; j++) { const t = j / rings, r = rad * Math.pow(Math.sin(Math.PI * Math.min(t * 0.92 + 0.04, 1)), 0.7) * (t > 0.8 ? lerp(1, 0.55, (t - 0.8) / 0.2) : 1);
          for (let k = 0; k <= sides; k++) { const a = (k / sides) * Math.PI * 2; v(Math.sin(a) * r, Math.cos(a) * r * flat, z0 + len * t, k / sides, t * len * 3, 0.1, 0, 0); } }
        for (let j = 0; j < rings; j++) for (let k = 0; k < sides; k++) { const a = b0 + j * (sides + 1) + k, b = a + sides + 1; IX.push(a, a + 1, b, a + 1, b + 1, b); }
      };
      if (!fishCast) {
        spindle(0.95, 0.12, -0.5, 6, 7, 0.85);
        const bk = v(0, 0.0, 0.62, 0.5, 9, 1, 0, 0), b1 = v(0.035, 0.0, 0.44, 0.4, 9, 1, 0, 0), b2 = v(-0.035, 0.0, 0.44, 0.6, 9, 1, 0, 0), b3 = v(0, 0.05, 0.44, 0.5, 9, 1, 0, 0); IX.push(bk, b1, b3, bk, b3, b2, bk, b2, b1);   // the beak, scraped to amber
        for (const sg of [1, -1]) {                                         // wings: a long pointed blade, swept, cambered; uv.x across the feathers
          const st = [[0.06, 0.3, -0.38], [0.3, 0.37, -0.36], [0.55, 0.4, -0.27], [0.8, 0.3, -0.22], [1.02, 0.1, -0.22], [1.2, -0.2, -0.3]], b0 = P.length / 3;
          for (let i = 0; i < st.length; i++) { const [sp, le, te] = st[i];
            v(sg * sp, 0.02, le, 3.03, sp + 5, 0.05, sg * sp, 1); v(sg * sp, 0.05, (le + te) / 2, 3.03 + (le - te) / 2, sp + 5, 0, sg * sp, 1); v(sg * sp, 0.0, te, 3.03 + (le - te), sp + 5, 0.62, sg * sp, 1); }   // uv.y along the span: the stylus lines follow the feathers
          for (let i = 0; i < st.length - 1; i++) for (let r = 0; r < 2; r++) { const a = b0 + i * 3 + r, b = a + 3; if (sg > 0) IX.push(a, a + 1, b, a + 1, b + 1, b); else IX.push(a, b, a + 1, a + 1, b, b + 1); }
          const d0 = P.length / 3;                                          // the drip a set tern carries at each wingtip
          for (let j = 0; j < 3; j++) for (let k = 0; k < 4; k++) { const a = k * 1.5708, r = [0.02, 0.012, 0.035][j]; v(sg * 1.16 + Math.cos(a) * r, -[0, 0.2, 0.3][j], -0.26 + Math.sin(a) * r, k / 4, j, 0, sg * 1.16, 2); }
          for (let j = 0; j < 2; j++) for (let k = 0; k < 4; k++) { const a = d0 + j * 4 + k, b = d0 + j * 4 + (k + 1) % 4; IX.push(a, b, a + 4, b, b + 4, a + 4); }
        }
        const t0 = v(0, 0.02, -0.42, 0.5, 2, 0, 0, 0), t1 = v(0.13, 0.02, -0.92, 0.3, 3, 0.4, 0, 0), t2 = v(0, 0.02, -0.66, 0.5, 3, 0, 0, 0), t3 = v(-0.13, 0.02, -0.92, 0.7, 3, 0.4, 0, 0); IX.push(t0, t1, t2, t0, t2, t3);   // forked tail
      } else {
        spindle(1.7, 0.2, -0.85, 8, 9, 1.25);
        for (const sg of [1, -1]) {                                         // long pectoral fins held out like wings
          const st = [[0.1, 0.42, 0.2], [0.45, 0.36, -0.05], [0.8, 0.16, -0.3], [1.0, -0.12, -0.42]], b0 = P.length / 3;
          for (let i = 0; i < st.length; i++) { const [sp, le, te] = st[i]; v(sg * sp, 0.03, le, sp * sg + 3, 0, 0.3, sg * sp, 1); v(sg * sp, 0.03, te, sp * sg + 3, 0.4, 0.5, sg * sp, 1); }
          for (let i = 0; i < st.length - 1; i++) { const a = b0 + i * 2, b = a + 2; if (sg > 0) IX.push(a, a + 1, b, a + 1, b + 1, b); else IX.push(a, b, a + 1, a + 1, b, b + 1); }
        }
        const t0 = v(0, 0, -0.8, 0.5, 2, 0.2, 0, 0), t1 = v(0, 0.36, -1.25, 0.3, 3, 0.6, 0, 0), t2 = v(0, 0, -1.02, 0.5, 3, 0.2, 0, 0), t3 = v(0, -0.5, -1.3, 0.7, 3, 0.6, 0, 0); IX.push(t0, t1, t2, t0, t2, t3);
      }
      const g = new THREE.BufferGeometry(); g.setIndex(IX);
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aTan', new THREE.Float32BufferAttribute(TG, 3));
      g.setAttribute('aHollow', new THREE.Float32BufferAttribute(HO, 1)); g.setAttribute('aWing', new THREE.Float32BufferAttribute(WG, 3));
      g.computeVertexNormals();
      return g;
    })();
    const NFLY = 60, flyT = new THREE.InstancedBufferAttribute(new Float32Array(NFLY * 4), 4); flyT.setUsage(THREE.DynamicDrawUsage);
    flyerGeo.setAttribute('iT', flyT);                                     // phase, beat amplitude, fold (1 = standing, wings half open), gloss
    const flyerMat = style.material({
      instanced: true, clearM: 3, detail: 1, groove: fishCast ? 0.23 : 0.15, grooveW: fishCast ? 0.4 : 0.55, side: THREE.DoubleSide,
      tint: fishCast ? 'mix(uHoney, uCoral, smoothstep(.2, .34, abs(fract(s.x) - .5)))' : 'uCream',
      vertexDecl: 'attribute vec3 aWing; attribute vec4 iT;',
      vertexPos: /* glsl */`
        { float sp = abs(aWing.x), sg = sign(aWing.x), ph = uTime*${fishCast ? '19.' : '7.5'} + iT.x;
          float a1 = iT.y*${fishCast ? '.12' : '.7'}*sin(ph) + mix(${fishCast ? '.12' : '.1'}, .95, iT.z), a2 = iT.y*${fishCast ? '.1' : '.85'}*sin(ph - 1.) + mix(-.12, -1.75, iT.z);
          float inner = min(sp, .55), outer = max(sp - .55, 0.);
          float tipX = sg*(cos(a1)*.55 + cos(a1 + a2)*.61), tipY = sin(a1)*.55 + sin(a1 + a2)*.61;
          if (aWing.y > 1.5) { float f = iT.z; p.x = tipX + (position.x - sg*1.16)*f; p.y = tipY + position.y*f; p.z = mix(-.26, position.z, f); }
          else if (aWing.y > .5) {
            p.x = sg*(cos(a1)*inner + cos(a1 + a2)*outer); p.y = position.y + sin(a1)*inner + sin(a1 + a2)*outer;
            float an = a1 + step(.55, sp)*a2; n = vec3(-sg*sin(an)*normal.y + normal.x*cos(an), cos(an)*normal.y, normal.z);
          }
          force = 0.; thin = 0.; }`,
      fragMid: SET_FRAG,
    });
    const flyers = new THREE.InstancedMesh(flyerGeo, flyerMat, NFLY); flyers.frustumCulled = false; flyers.name = fishCast ? 'flying-fish' : 'terns'; flyers.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(flyers);
    // roles: 0 the one that keeps station by the boat through the lane (terns only) and then flies off ahead as one of the forty; 1..39 fly the lanes;
    // 40..59 stand set in the shade (twelve on the field's old crests, the near row first; eight along the breaker's lip) and lift off when the melt edge reaches them
    const flyRole = [], cst = mkStream('cast');
    { const oldC = crests.filter((c) => !c.live), nearOld = oldC.filter((c) => c.near), perchOn = nearOld.concat(nearOld, oldC.filter((c) => !c.near)), lp = new THREE.Vector3();
      for (let i = 0; i < NFLY; i++) {
        const r = { ph: cst.range(0, 6.28), du: cst.range(fishCast ? 0.024 : 0.034, fishCast ? 0.17 : 0.3), lat: cst.range(-15, 4.5), h: cst.range(2.2, 10), w: cst.range(0.25, 0.6), sc: cst.range(0.85, 1.15), perch: null };
        if (i >= 52 || (i >= 40 && !perchOn.length)) {                    // on the breaker's lip, along the stretch of face we run
          lipAt(cst.range(60, 270), lp);
          r.perch = [lp.x, lp.y + 1.2, lp.z, lp.x, lp.z, 2, Math.PI / 2 + cst.range(-0.6, 0.6), 0];
        } else if (i >= 40) {
          const c = perchOn[(i - 40) % perchOn.length]; crestPoint(c, cst.range(0.3, 0.7), 22, cp);
          r.perch = [cp[0], cp[1] + 0.12, cp[2], c.x + c.nx * c.H * 0.5, c.z + c.nz * c.H * 0.5, c.live, Math.atan2(c.nx, c.nz) + cst.range(-0.5, 0.5), c.H];
        }
        flyRole.push(r);
      } }
    const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s3 = new THREE.Vector3(), _fp = new THREE.Vector3();
    await ctx.yield();
    // ----- the rare event, caught falling: a 70 m stretch of the hook's lip lets go as a clear curtain and the next shadow sets it in mid-fall -----
    // The mesh is always there (so its program is compiled with the rest); without the event its length stays zero.
    const curtU = { uCurtain: { value: new THREE.Vector2(0, 0) } };
    {
      const nC = 72, nR = 14, pos = [], uv = [], tan = [], dr = [], idx = [], a = new THREE.Vector3(), b = new THREE.Vector3(), q = new THREE.Vector3();
      for (let i = 0; i <= nC; i++) {
        lipAt(lerp(CUR_S0, CUR_S1, i / nC), a); lipAt(lerp(CUR_S0, CUR_S1, Math.min(i + 1, nC) / nC) + 0.5, b); q.subVectors(b, a).setY(0).normalize();
        const lenK = 0.6 + 0.3 * (0.5 + 0.5 * noise.n2(i * 0.13, 3.3)) + 0.16 * noise.n2(i * 1.9, 7.7) - 0.25 * Math.pow(Math.abs(i / nC - 0.5) * 2, 3), delay = 0.35 * (0.5 + 0.5 * noise.n2(i * 0.06, 9.1));
        for (let r = 0; r <= nR; r++) { pos.push(a.x, a.y - 0.3, a.z); uv.push(i * 1.0 + 200, (r / nR) * 20 * lenK + 300); tan.push(q.x, 0, q.z); dr.push(r / nR, lenK, delay); }
      }
      for (let i = 0; i < nC; i++) for (let r = 0; r < nR; r++) { const k = i * (nR + 1) + r, k2 = k + nR + 1; idx.push(k, k + 1, k2, k + 1, k2 + 1, k2); }
      const g = new THREE.BufferGeometry(); g.setIndex(idx);
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aTan', new THREE.Float32BufferAttribute(tan, 3));
      g.setAttribute('aDrop', new THREE.Float32BufferAttribute(dr, 3));
      const curtMat = style.material({
        clearM: 30, detail: 0, tint: 'mix(uHoney, uCream, .3)', side: THREE.DoubleSide, uniforms: curtU,
        vertexDecl: 'attribute vec3 aDrop; uniform vec2 uCurtain;',
        vertexPos: /* glsl */`
          { float fall = clamp((uCurtain.x - aDrop.z)/(1. - .35), 0., 1.); fall = fall*fall*(3. - 2.*fall);
            float len = 20.*aDrop.y*fall, ph = uv.x*.55 + aDrop.x*5.;
            float wob = mix(sin(ph - uTime*2.4), sin(ph + 1.7), uCurtain.y)*(.25 + .5*aDrop.x)*aDrop.x*min(len*.2, 1.);
            vec3 side = vec3(-aTan.z, 0., aTan.x);
            p = position + vec3(0., -aDrop.x*len, 0.) + side*wob; n = normalize(side + aTan*cos(ph - uTime*2.4*(1. - uCurtain.y))*.5*aDrop.x);
            thin = mix(.55, 1., aDrop.x); hollow = 0.; force = 1. - uCurtain.y; }`,
        fragDecl: 'uniform vec2 uCurtain;',
        fragMid: 'fld = vec4(6., 40., 30.*(1. - uCurtain.y), uCurtain.y); force = 1. - uCurtain.y;',
        fragPost: /* glsl */`
          { float rp = wxF(vec2(s.x*1.9, s.y*.07 + 3.)), rope = smoothstep(.38, .6, rp), fine2 = wxN(vec2(s.x*9., s.y*.3));      // set in mid-fall: ropes of thick amber in a sheet of honey
            vec3 sheet = mix(uHoney*1.12, mix(uHoney, uAmber, .7), rope*.85);
            sheet = mix(sheet, mix(uHoney, uCream, .45), (1. - rope)*smoothstep(.55, .8, fine2)*.6);
            sheet *= .9 + .12*dot(N, normalize(uSun*.55 + vec3(0., .8, 0.)));
            sheet += uCream*(wxN(s*17.) - .4)*.05;
            col = mix(col, waxVeil(sheet, dist), uCurtain.y); }`,
      });
      const curtain = new THREE.Mesh(g, curtMat); curtain.frustumCulled = false; curtain.name = 'caught-curtain'; scene.add(curtain);
    }
    await ctx.yield();
    // BUILD-PART-K
    // ----- painted fish on the buried layer, from their own stream. One passes under the hull at the brief's fifth second, crossing the course on a slant
    // (so it is seen broadside over the bow as it comes); each of the others keeps a line of its own in the lane's clear wax beside the course and is
    // overtaken at its own place. Where a fish is follows from the metres flown. -----
    const pf = mkStream('painted-fish'), fishTracks = [];
    for (let i = 0; i < NFISH; i++) {
      const m = i === 0 ? mAtSec(5) : (i - 0.5 + pf.range(-0.3, 0.3)) / (NFISH - 1) * mAtZ(548);
      path.posAtDist(m, _p); path.tangentAtDist(m, _t);
      const a = i === 0 ? 0.6 : pf.range(-0.45, 0.45), off = i === 0 ? 0 : (pf() < 0.7 ? -1 : 1) * pf.range(4, 11);      // (- = the wall's side, where the lane is wide)
      fishTracks.push({ m, x: _p.x + _t.z * off, z: _p.z - _t.x * off, h: Math.atan2(_t.x, _t.z) + a, len: i === 0 ? 8 : pf.range(5.5, 9), sp: pf.range(0.25, 0.45) });
    }
    const _wall = new THREE.Vector3(), _c = new THREE.Vector3(), _lk = new THREE.Vector3(), EYE_X = 0.9;   // the eye rides the starboard quarter: the stem stands left of centre, the sail beyond it
    const _t2 = new THREE.Vector3();
    // a point beside the course, worked out from u: `ahead` metres on along it, `lat` metres to one side (+ = toward +X, the setting side), at height y
    const beside = (ahead, lat, y) => (time, u) => { const d = clamp(u * PL + ahead, 0, PL - 3); path.posAtDist(d, _wall); path.tangentAtDist(d, _t2); const hl = Math.hypot(_t2.x, _t2.z) || 1; _wall.x += _t2.z * lat / hl; _wall.z -= _t2.x * lat / hl; _wall.y = y; return _wall; };
    // a look: on its thing from m0 to m1 metres flown (both set by where the course stands to the thing), eased over `ease` seconds of flight at each end
    const look = (at, m0, m1, weight, ease = 1.3) => { const from = clamp(m0 / PL, 0, 1), to = clamp(m1 / PL, 0, 1), T = Math.max(secAtU(to) - secAtU(from), 0.1); return { at, from, to, weight, fade: clamp(ease / T, 0.05, 0.5) }; };
    // the crest whose melting the field look follows: the last old crest of the near row (the wall's side), the one nearest the breaker
    let sagC = null; for (const c of crests) if (c.near && !c.live && (!sagC || c.m > sagC.m)) sagC = c;
    const sagAt = sagC ? new THREE.Vector3(sagC.x + sagC.nx * sagC.H * 0.6, sagC.H * 0.55, sagC.z + sagC.nz * sagC.H * 0.6) : null;
    const mEase = mAtZ(540);
    const pois = [
      // the lane: the setting edge at arm's length on the +X side (running swell, wax set a second ago, old set swell behind it), over the brief's first seconds until the edge has clipped the sail
      look(beside(8, ed.laneR + 5.5, 0.6), mAtSec(0.9), mAtSec(5.7), 0.6),
      // along the face: the gloss front climbing it ahead of us, from the turn onto the face until the pass at 9 m
      look((time, u) => { path.pointAt(u, _wall); _wall.set(-171, 10, _wall.z + 20); return _wall; }, mFace - 30, mAtZ(470) + 12, 0.75),
      // down to the clear foot (and the fish in it) as the gloss passes, along the pass at 9 m
      look((time, u) => { path.pointAt(u, _wall); _wall.set(-164.5, 0.8, _wall.z + 12); return _wall; }, mAtZ(462), mAtZ(516), 0.7),
      // up to the lip as it lights, well ahead along it (the stem stays in the picture)
      look((time, u) => { path.pointAt(u, _wall); lipAt(_wall.z - 330 + 84, _lk); return _wall.copy(_lk); }, mAtZ(505), mAtZ(556), 0.6),
      // the run in: the first lips of the row, standing against the heap as the lane takes them
      look(beside(17, -27, 3), mEase + 14, mEase + 98, 0.45),
      // from where the course eases out from the face, the hook and its arch are ahead and stay there
      { at: seat.clone(), from: mEase / PL, to: 1, weight: 0.5, fade: 0.3 },
    ];
    // the one swing: on the boat and the hollow of the curl above it (a point worked from the boat's place and the lip over it: on the boat alone at the seat,
    // a third of the way up to the lip when the eye is furthest out)
    // (it stands in the place of the look along the face, which the seat alone would make there: one pull at a time)
    if (SWING) pois[1] = look((time, u) => { const m = u * PL; path.posAtDist(Math.min(m + 15, PL), _wall); lipAt(_wall.z - 330, _lk); return _wall.lerp(_lk, 0.35 * swingW(m)); }, swM0, swM1, 0.97, 2.2);
    // the field: the old crest to the wall's side as the lane takes it (sagging, raining drops, its tern lifting off), from 90 m short of it until it is nearly abeam;
    // it never begins before the lane's look has let go
    if (sagAt) { const m0 = Math.max(sagC.m - 90, mAtSec(4.5)), m1 = sagC.m - 4; if (secAtU(m1 / PL) - secAtU(m0 / PL) >= 4.6) pois.splice(1, 0, look(sagAt, m0, m1, 0.55)); }      // (a look holds two seconds or it is not made)
    await ctx.yield();
    return {
      scene, path: eyePath, duration: DUR, pace,
      title: `The Sea Sets in Shade: ${ed.name}`,
      camera: { fov: 62, near: 0.3, far: 3600, lookAhead: 34, sway: 0.35, bank: 0.35, nearThrough: 0.3 },      // the eye rides 2.4 m over the wax: through the previous portal the lane must run from the opening's bottom rim
      pois,
      portal: { shape: 'circle', radius: 7, tilt: true, color: pal[1], glow: 0.5, revealDistance: 300 },
      post: { exposure: 1, bloom: { ...WAX_POST.bloom }, grade: { ...WAX_POST.grade } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        boat.visible = !ctx.through;                                    // seen through the previous portal the boat would be sliced by the opening (no light hangs on it)
        style.setFieldXf(0, FOX + DRIFT * u, FOZ);
        style.update(time);
        hero.update(dt, time, camera);
        const mNow = u * PL;                                            // metres flown
        if (SWING) swingOff(mNow, swNow);
        for (let i = 0; i < NFISH; i++) {
          const f = fishTracks[i], d = (mNow - f.m) * f.sp + Math.sin(time * 0.31 + i * 2.1) * 1.2, h = f.h + Math.sin(time * 0.23 + i) * 0.12;
          fishU.value[i].set(f.x + Math.sin(f.h) * d, f.z + Math.cos(f.h) * d, h, f.len);
        }
        // the boat: a thing of the world at the course's point for the metres flown (the eye sits in it but for its one swing), on the course's heading,
        // heeling in turns and riding the running swell
        path.pointAt(u, _c);
        path.tangentAt(u, _t); const climb = Math.asin(clamp(_t.y, -1, 1));
        camera.getWorldDirection(_fp);
        // she keeps the course's heading while the gaze goes to the wall's side of it (sail and stem swing across the frame), but turns with a gaze that goes to
        // the sail's side, so the whole sail with its mast and boom stays in the picture; over the last turn into the arch she bears off a little. While the eye
        // is off its seat she keeps her course.
        const yaw0 = Math.atan2(_t.x, _t.z), seatK = 1 - SWING * Math.min(swingW(mNow) * 4, 1);
        let yaw = yaw0; { let rel = Math.atan2(_fp.x, _fp.z) - yaw; rel = Math.atan2(Math.sin(rel), Math.cos(rel)) * seatK; const lim = rel > 0 ? 0.44 : 0.05, tl = Math.tanh(rel / lim) * lim; yaw += rel - tl + 0.07 * smoothstep(PL - 95, PL - 40, mNow); }
        path.tangentAt(Math.min(u + 0.012, 1), _p); const tx1 = _p.x, tz1 = _p.z; path.tangentAt(Math.max(u - 0.012, 0), _p);
        const turn = _p.z * tx1 - _p.x * tz1;
        const fx = Math.sin(yaw), fz = Math.cos(yaw), k = RUN_H * 0.3, hx0 = Math.sin(yaw0), hz0 = Math.cos(yaw0);
        const hB = seaM(_c.x + fx * 4.5, _c.z + fz * 4.5, time), hS = seaM(_c.x - fx * 1.5, _c.z - fz * 1.5, time), hL = seaM(_c.x + fz * 1.5, _c.z - fx * 1.5, time), hR = seaM(_c.x - fz * 1.5, _c.z + fx * 1.5, time);
        boat.position.set(_c.x + fz * EYE_X, _c.y + k * (hB + hS) * 0.5, _c.z - fx * EYE_X);
        mirU.uHull.value.copy(boat.position);
        boat.rotation.set(-climb - Math.atan2(k * (hB - hS), 6), yaw, clamp(turn * 1.5, -0.2, 0.2) + Math.atan2(k * (hL - hR), 3) * 0.6, 'YXZ');
        { const rel = 1.309 - yaw; sailU.uPatch.value.set(30.75 + 0.5 * (rel - 1.2), 31.5 + 0.15 * Math.sin(time * 0.6), 0.62); }
        sailU.uFrost.value = smoothstep(-1.2, 1.4, sdAt(_c.x + fz * 3.0, _c.z - fx * 3.0, u));
        // the cast
        const ssx = U.uSunShift.value.x, ssz = U.uSunShift.value.y;
        for (let i = 0; i < NFLY; i++) {
          const r = flyRole[i]; let sc = r.sc, amp = 1, fold = 0, yawF = yaw, pitchF = 0, rollF = 0, kk = 1;
          if (r.perch && !fishCast) {                                       // stands set on a crest or on the breaker's lip; when the melt edge reaches it, it shakes and lifts off
            const pc = r.perch, sd = sdAt(pc[0] + ssx * pc[1], pc[2] + ssz * pc[1], u), q = Math.max(-sd, 0) / 11, sun = Math.max(-sdAt(pc[3], pc[4], u), 0);
            const sg = Math.min(sun / 34, 1), sagF = pc[7] > 0 ? Math.min(3, 0.5 * pc[7]) / pc[7] * sg * (1.6 - 0.6 * sg) : 0, py = pc[1] * (1 - sagF * (1 - Math.min(pc[5], 1)));
            const qq = Math.min(q, 1), fl = qq * qq * (3 - 2 * qq);
            path.tangentAt(clamp(u + 0.05, 0, 1), _t);
            _fp.set(pc[0] + _t.x * 26 * q * q, Math.max(py, 0.6) + 7 * fl + 1.5 * Math.max(q - 1, 0), pc[2] + _t.z * 26 * q * q);
            fold = 1 - smoothstep(0, 0.22, q); amp = lerp(smoothstep(-2.5, 0, -sd) * 0.3, 1, smoothstep(0, 0.2, q));
            yawF = lerp(pc[6], Math.atan2(_t.x, _t.z), smoothstep(0, 0.6, q)); pitchF = -0.5 * fl * (1 - smoothstep(1, 1.6, q));
          } else {
            const uu = u + r.du + 0.006 * Math.sin(time * 0.13 + r.ph), mm = uu * PL, nearW = smoothstep(mFace - 10, mFace + 35, mm);      // along the face the lane is narrow: they close up
            path.pointAt(Math.min(uu, 1), _fp); path.tangentAt(Math.min(uu, 1), _t);
            const lx = _t.z, lz = -_t.x, wv = time * r.w + r.ph;
            if (!fishCast) {
              const lat = lerp(r.lat, r.lat * 0.28 + 1.2, nearW) + 2.4 * Math.sin(wv) * (1 - 0.6 * nearW), hh = lerp(r.h, 2.4 + (r.h - 2.2) * 0.3, nearW) + 0.9 * Math.sin(wv * 1.3 + r.ph);
              _fp.x += lx * lat; _fp.z += lz * lat; _fp.y += hh - 2.4;
              yawF = Math.atan2(_t.x, _t.z) + 0.28 * Math.cos(wv); rollF = -0.45 * Math.cos(wv); pitchF = -0.1 * Math.cos(wv * 1.3 + r.ph);
              amp = 0.65 + 0.35 * Math.sin(time * 0.4 + r.ph * 3);
            } else {                                                        // flying fish: out of the lane in an arc, and back into it
              const T = 2.6 + r.w * 2.2, tau = (time / T + r.ph) % 1, dir = i % 2 ? 1 : -1, span = 8 + r.h, hgt = 1.3 + r.h * 0.22;
              const lat = lerp(r.lat, r.lat * 0.28 + 1.2, nearW) * 0.6 + dir * span * (tau - 0.5) * 0.8, along = span * (tau - 0.5) * 0.6;
              _fp.x += lx * lat + _t.x * along; _fp.z += lz * lat + _t.z * along; _fp.y += -2.9 + hgt * 4 * tau * (1 - tau) * 1.25;
              yawF = Math.atan2(_t.x * 0.6 + lx * dir * 0.8, _t.z * 0.6 + lz * dir * 0.8); pitchF = -Math.atan2(hgt * 5 * (1 - 2 * tau), span);
              rollF = 0.2 * Math.sin(time * 3 + r.ph); amp = 1; sc *= 1.15;
            }
            sc *= 1 - smoothstep(PL - 14, PL - 3, mm);                  // (into the arch)
            if (i === 0 && !fishCast) {                                    // the station tern: through the lane she keeps station off the bow quarter, on the course's own heading at the boat's
              // place (metres ahead of the seat and to starboard of the course, not on the gaze: when the look turns she slides in the picture as a thing of the
              // world does); from the lane's end she flies off ahead and is one of the forty that fly the lanes
              kk = smoothstep(mLane, mLane + 70, mNow);
              const tq = time + r.ph * 7, ax = -1.55 + 0.3 * Math.sin(tq * 0.6), ay = -1.42 + 0.14 * Math.sin(tq * 0.9), az = 5.7 + 0.3 * Math.sin(tq * 0.43);
              _fp.set(lerp(_c.x + hx0 * az + hz0 * ax, _fp.x, kk), lerp(_c.y + ay, _fp.y, kk), lerp(_c.z + hz0 * az - hx0 * ax, _fp.z, kk));
              rollF = lerp(0.34 + 0.22 * Math.sin(tq * 0.52) + 0.1 * Math.sin(tq * 1.7), rollF, kk); yawF = lerp(yaw0 + 0.22 + 0.1 * Math.sin(tq * 0.37), yawF, kk); pitchF = lerp(-0.3 - 0.06 * Math.cos(tq * 0.9), pitchF, kk) - 0.25 * kk * (1 - kk) * 4;
              amp = lerp(0.75 + 0.25 * Math.sin(tq * 0.31), amp, kk); sc = lerp(1, sc, kk);
            }
          }
          _e.set(pitchF, yawF, rollF, 'YXZ'); _q.setFromEuler(_e); _s3.setScalar(Math.max(sc, 1e-4));
          flyers.setMatrixAt(i, _m4.compose(_fp, _q, _s3));
          flyT.setXYZW(i, r.ph, amp, fold, 0);
        }
        flyers.instanceMatrix.needsUpdate = true; flyT.needsUpdate = true;
        if (rare) curtU.uCurtain.value.set(smoothstep(0.625, 0.705, u), smoothstep(0.698, 0.715, u));
        // UPDATE-MORE
      },
      dispose() { fieldTex.dispose(); hero.dispose(); },
    };
  },
};
