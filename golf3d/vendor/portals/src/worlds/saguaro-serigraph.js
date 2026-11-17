// Monsoon over the Saguaros: a 1930s national-park silkscreen of the Sonoran desert, alive.
// Everything is flat ink: unlit ShaderMaterials cut into light / mid / shadow shapes by two hard thresholds on one
// sun direction (the hero's SERI_GLSL), violet overprint shadows, cream keylines. No fog, no lights, no textures.
// North is -Z, east +X; the sun stands in the west (left of the flight) and every cast shadow lies to the right.
// Beats are keyed to u: grazing herd and hawk stack (0), the zigzag and the bolt (0.01-0.05), the stack breaks across
// the path (0.053-0.09), the gallop between hand-set fluted trunks (0.1-0.33), the cell's shadow edge (0.345), rain
// (0.38+), the wash with the flood wall and its plume coming on (0.60-0.72), the gaze swinging to the gate (0.735+),
// hand-set trunks close on both sides up the rise (0.76-0.89), gold again (0.815), the herd streaming past both sides
// of the arch with two does close on either hand (0.9+).
// Added to that: old armed saguaros of 11 to 14 m on both hands, the stand round the towering one (eight of its heights
// back along the way, on to the wash; placed by tests of the ground only; the herd runs as it did), and the towering saguaro, 23 m, 85 m on from the point
// of the route where the bolt strikes it on every visit (U_STRIKE): the stroke from the cell, the trunk lit by it, the
// arm it takes off, the charred crown, the doves that burst from it. All of that runs in metres and in seconds.
// Everything that stands or lies on the land takes its height from the apron MESH (heightAt -> meshH), and every cast
// shadow bar is cut into patches that lie on that mesh, so nothing floats or sinks on the granite rise.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, SERI_GLSL } from '../parts/saguaro-serigraph.js';

const PALETTE = ['#E3A23A', '#C4603A', '#3F7D5A', '#4FA39B', '#5A4689', '#6B4630', '#D93A2B'];
const EYE = 1.8, TH = 0.89, DUR = 40;
// the brief's amendment: on every visit one bolt strikes the towering saguaro as we pass this share of the route
const U_STRIKE = 0.45;

// fragment chunk shared by every ink in the world: the hero's serigraph family plus the three small cloud shadows
const WG = SERI_GLSL + /* glsl */`
uniform vec4 uPuff0, uPuff1, uPuff2;
float puff(vec2 p, vec4 c){
  vec2 q = p - c.xy; q.y *= 1.55;
  float d = length(q) - c.z * (1. + .16 * sin(q.x * .19 + c.x) + .12 * sin(q.y * .27 + c.y));
  return (1. - aastep(0., d)) * c.w;
}
float shadeAll(vec2 p){ return max(cellShade(p), max(puff(p, uPuff0), max(puff(p, uPuff1), puff(p, uPuff2)))); }
vec3 ink3(vec3 L, vec3 M, vec3 D, float ndl, float sh){ return tone3(mix(L, M, sh), mix(M, mix(M, D, .6), sh), D, ndl); }
vec3 mottle(vec3 c, vec3 op){ vec3 fw = fwidth(op); return c * (1. + clamp(1. - (fw.x + fw.y + fw.z) * 4., 0., 1.) * .09 * (vn3(op * 5.) - .5)); }
`;
// vertex chunk: the outflow gust that arrives with the shadow (0 in sun, 1 under the cell), and a planar sun shadow
const VG = /* glsl */`
uniform vec4 uShadow; uniform vec3 uSun; uniform float uTime;
float gustAt(vec2 p){ return (.25 + .75 * smoothstep(-30., 25., dot(uShadow.xy, p) + uShadow.z) * uShadow.w); }
vec3 flatten(vec3 w, float gy){ float k = (w.y - gy) / max(uSun.y, .12); return vec3(w.x - uSun.x * k, gy + .04, w.z - uSun.z * k); }
`;

class Buf {
  constructor(spec) { this.spec = spec; this.a = {}; for (const k in spec) this.a[k] = []; this.idx = []; this.n = 0; }
  v(o) { for (const k in this.spec) { const s = o[k], n = this.spec[k], a = this.a[k]; for (let i = 0; i < n; i++) a.push(s[i] ?? 0); } return this.n++; }
  tri(a, b, c) { this.idx.push(a, b, c); }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  geo() {
    const g = new THREE.BufferGeometry();
    for (const k in this.spec) g.setAttribute(k, new THREE.BufferAttribute(new Float32Array(this.a[k]), this.spec[k]));
    g.setIndex(new THREE.BufferAttribute(this.n > 65535 ? new Uint32Array(this.idx) : new Uint16Array(this.idx), 1));
    return g;
  }
}
const col = (h) => new THREE.Color(h);
const mixc = (a, b, t) => a.clone().lerp(b, t);
const hd = (deg) => { const a = (deg * Math.PI) / 180; return [Math.sin(a), -Math.cos(a)]; };

export default {
  id: 'saguaro-serigraph',
  name: 'Monsoon over the Saguaros',
  category: 'wilderness',
  weirdness: 0.35,
  media: ['open'],
  async build(ctx) {
    const { core, noise } = ctx;
    const { clamp, lerp, smoothstep, bell } = core;
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const scene = new THREE.Scene();

    // ---- which print is pulled today: hour x weather x season, by seed ------------------------------------------
    const vr = rng.fork('look');
    const pick = vr();
    const looks = [['noon', 'virga', 'may'], ['golden', 'cell', 'july'], ['golden', 'haboob', 'august'], ['night', 'cell', 'july'], ['golden', 'cell', 'may'], ['night', 'haboob', 'august'], ['noon', 'cell', 'august'], ['golden', 'virga', 'july']];
    let [hour, weather, season] = looks[Math.floor(pick * looks.length) % looks.length];
    if (vary.hour === 'night') hour = 'night'; else if (vary.hour === 'day') hour = 'noon'; else if (vary.hour === 'golden' || vary.hour === 'dawn') hour = 'golden';
    const night = hour === 'night', noon = hour === 'noon', rare = !!vary.rare, density = clamp(vary.density ?? 1, 0.7, 1.3);
    const sunW = (noon ? new THREE.Vector3(-0.42, 0.86, -0.12) : night ? new THREE.Vector3(-0.72, 0.6, -0.22) : new THREE.Vector3(-0.85, 0.5, 0.12)).normalize();
    const sunL = sunW.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -TH);

    // ---- the hero: the monsoon cell and the flood it sends ----------------------------------------------------
    const hero = await buildHero(ctx, { palette: PALETTE, hour, weather, season, ground: false, sky: false, sunDir: sunL.toArray(),
      cellBearing: 0.58 + rng.range(-0.05, 0.05), lightning: true, rain: 0 });
    await ctx.yield();
    const W = hero.wash, AP = W.bankHeight, ink = hero.serigraph.inks, HU = hero.uniforms;
    hero.setSun(sunW);

    // ---- frames: the hero's wash frame in the world, the path, the saddle ---------------------------------------
    const cT = Math.cos(TH), sT = Math.sin(TH), ft = hero.anchors.flyThrough;
    const Hx = -101 - (ft[0].x * cT + ft[0].z * sT), Hz = -421 - (-ft[0].x * sT + ft[0].z * cT);
    const toW = (lx, lz) => [lx * cT + lz * sT + Hx, -lx * sT + lz * cT + Hz];
    const _l2 = [0, 0];                                         // scratch: toL is called every frame
    const toL = (x, z) => { const dx = x - Hx, dz = z - Hz; _l2[0] = dx * cT - dz * sT; _l2[1] = dx * sT + dz * cT; return _l2; };
    hero.object.position.set(Hx, 0, Hz); hero.object.rotation.y = TH; hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    const cellDirW = hero.anchors.cellDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), TH).normalize();

    const pts = [[0, AP + EYE, 0], [-9, AP + EYE, -52], [-13, AP + EYE, -120], [-16, AP + EYE, -198], [-24, AP + EYE, -275], [-58, AP + EYE, -340]];
    const ftW = ft.map((p) => toW(p.x, p.z));
    ft.forEach((p, i) => pts.push([ftW[i][0], (p.y < 2 ? 0 : AP) + EYE, ftW[i][1]]));
    const h1 = hd(346), h2 = hd(3), h3 = hd(15);
    const B1 = [ftW[6][0] + 18 * h1[0], ftW[6][1] + 18 * h1[1]], B2 = [B1[0] + 22 * h2[0], B1[1] + 22 * h2[1]];
    const E1x = B2[0] + 152 * h3[0], E1z = B2[1] + 152 * h3[1], aX = h3[0], aZ = h3[1], rX = -aZ, rZ = aX;   // portal seat, travel axis, its right
    const CREST = AP + 4.2;
    const axisPt = (t, q = 0) => [E1x - aX * t + rX * q, E1z - aZ * t + rZ * q];
    // ---- the land: an outwash apron, the cut wash (the hero's profile), the granite rise and its saddle ---------
    // The rise begins 200 m out and tops out 100 m out, so we are already level with its crest when the straight
    // begins and the gate (the two giants and the arch) stands clear above it for the whole approach.
    const SZ0 = -400, SZ1 = 300;                                // the wash strip's reach along the hero's z
    const apron = (x, z) => {
      const l = toL(x, z), wd = Math.abs(l[0] - W.centerX(l[1])), far = smoothstep(45, 95, wd);
      if (far <= 0) return AP;
      const t = -((x - E1x) * aX + (z - E1z) * aZ), q = (x - E1x) * rX + (z - E1z) * rZ, aq = Math.abs(q);
      const r = (4.2 * smoothstep(200, 100, t) - 3.4 * smoothstep(58, 0, t) - 6 * smoothstep(0, -110, t)) * (1 - smoothstep(150, 320, aq));
      const m = 7.5 * smoothstep(15, 27, aq) * (1 - smoothstep(70, 130, aq)) * bell(t, -44, 64, 0.4) * (0.75 + 0.35 * noise.n2(x * 0.045, z * 0.045));
      return AP + far * (r + m + 0.4 * noise.n2(x * 0.011, z * 0.011));
    };
    for (const b of [B1, B2]) pts.push([b[0], apron(b[0], b[1]) + EYE, b[1]]);
    { const p = axisPt(127); pts.push([p[0], Math.min(apron(p[0], p[1]), CREST) + EYE, p[1]]); }
    for (const t of [100, 62, 30, 0]) { const p = axisPt(t); pts.push([p[0], CREST + EYE, p[1]]); }
    const path = makePath(pts);
    const L = path.length, uPass = path.nearestXZ(ftW[5][0], ftW[5][1]).u;
    let meshH = null;                                           // the apron mesh's own surface, once it is built
    const endFade = (lz) => 1 - smoothstep(SZ0, SZ0 + 40, lz) * (1 - smoothstep(SZ1 - 40, SZ1, lz));
    const heightAt = (x, z) => {
      const l = toL(x, z);
      if (l[1] > SZ0 && l[1] < SZ1) { const bd = W.bankDist(l[0], l[1]); if (bd > 0) return lerp(W.cut(bd), AP, endFade(l[1])); if (bd > -24) return AP; }
      return meshH ? meshH(x, z) : apron(x, z);   // the faceted mesh, not the smooth function: nothing floats or sinks on the rise
    };
    const pathFrame = (d, out) => { // position, tangent and right vector (xz) at distance d along the path
      path.posAtDist(d, _a); path.tangentAtDist(d, _b);
      const l = Math.hypot(_b.x, _b.z) || 1; out.x = _a.x; out.y = _a.y; out.z = _a.z; out.tx = _b.x / l; out.tz = _b.z / l; return out;
    };
    const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
    const fr = { x: 0, y: 0, z: 0, tx: 0, tz: 0 };

    // ---- the hand-set saguaros: placed before anything else so that the herd's tracks bend round them -----------
    // kind 0..3 gallop specimens (left ones lay their shadow bars across the lane), 4 the hawks' perch, 5 the two giants
    const spec = [];
    const specAt = (s, lat, kind, r = 2.5) => { pathFrame(s, fr); const q = { s, lat, kind, r, x: fr.x - fr.tz * lat, z: fr.z + fr.tx * lat, tx: fr.tx, tz: fr.tz }; spec.push(q); return q; };
    const HAWK_S = 0.05 * L + 13.6, hawkSpec = specAt(HAWK_S, 7.9, 4, 2.2);
    [[102, -6.6, 0], [116, 7.2, 1], [138, -7.2, 2], [146, 8.0, 3], [161.5, -6.5, 1], [166.5, 6.9, 0], [180, -7.6, 3], [190, 7.0, 2], [201.5, -6.6, 0],
      [212, 7.4, 1], [226, -7.0, 2], [240, 6.8, 0], [256, -7.5, 1]].forEach(([s, lat, k]) => specAt(s * (L / 767.65), lat, k));
    specAt(0.62 * L + 9.5, -7.0, 2); specAt(0.4 * L + 11, -6.8, 0); specAt(0.47 * L, 7.3, 1); specAt(0.55 * L + 12, 7.2, 2);   // under the cell, and at the bank where we drop in
    // up the apron to the gate: fluted trunks close on both sides again, their bars across the gold (two stand in the u 0.84 frame)
    specAt(0.762 * L, 7.5, 1); specAt(0.795 * L, -7.3, 2); specAt(0.84 * L + 13, -7.4, 0); specAt(0.84 * L + 24.5, 7.9, 2); specAt(0.84 * L + 42, -7.6, 3);
    specAt(L - 0.5, -7.8, 5, 2.3); specAt(L - 0.5, 7.8, 5, 2.3);
    // THE TOWERING SAGUARO (the brief's amendment): the tallest thing on the bajada, 85 m on from the point of the route
    // where the stroke falls (U_STRIKE x L) and 10.5 m to the left of the route. Within one and a half times its height
    // nothing taller than half its height stands. It is NOT entered in the list above: that list is read by position
    // further down (nest holes, woodpeckers, perches), and every plant that asks about the herd's tracks would be dealt
    // anew. The herd's tracks are bent round its foot by the same law in a pass of their own, once they are baked.
    const TOWER_H = 23, TOWER_R = 0.78, TOWER_BEND = 4.4, sStrike = U_STRIKE * L;
    const tower = { s: sStrike + 85, lat: -10.5, x: 0, z: 0, y: 0, top: 0, perches: [] };
    { pathFrame(tower.s, fr); tower.x = fr.x - fr.tz * tower.lat; tower.z = fr.z + fr.tx * tower.lat; }
    const inClearing = (x, z) => (x - tower.x) ** 2 + (z - tower.z) ** 2 < (1.5 * TOWER_H) ** 2;

    // ---- shared uniforms and the ink factory --------------------------------------------------------------------
    const PU = { uPuff0: { value: new THREE.Vector4(0, 0, 1, 0) }, uPuff1: { value: new THREE.Vector4(0, 0, 1, 0) }, uPuff2: { value: new THREE.Vector4(0, 0, 1, 0) } };
    const SH = { uTime: HU.uTime, uSun: HU.uSun, uShadow: HU.uShadow, uShadowB: HU.uShadowB, uPaper: HU.uPaper, uOver: HU.uOver, ...PU };
    const mat = (vs, fs, extra = {}, o = {}) => {
      const u = { ...SH }; for (const k in extra) u[k] = extra[k] && extra[k].value !== undefined && !extra[k].isColor ? extra[k] : { value: extra[k] };
      return new THREE.ShaderMaterial({ uniforms: u, vertexShader: vs, fragmentShader: fs, side: o.side ?? THREE.FrontSide, transparent: !!o.transparent,
        depthWrite: o.depthWrite ?? !o.transparent, depthTest: o.depthTest ?? true, alphaToCoverage: !!o.a2c, polygonOffset: !!o.offset, polygonOffsetFactor: o.offset ? -o.offset : 0, polygonOffsetUnits: o.offset ? -o.offset * 2 : 0 });
    };
    const add = (geo, material, order) => { const m = new THREE.Mesh(geo, material); m.frustumCulled = false; if (order !== undefined) m.renderOrder = order; scene.add(m); return m; };
    const WHITE = new THREE.Color(1, 1, 1);
    const followers = [];                                       // sky things re-centred on the camera every frame
    // the bar ink: what a cast shadow prints on sunlit ground
    const barInk = night ? mixc(ink.groundM, ink.violet, 0.5) : mixc(ink.groundSh, ink.violet, 0.32);
    const farInk = night ? mixc(ink.skyBot, ink.violet, 0.3) : mixc(mixc(ink.violet, ink.turq, 0.35), ink.paper, 0.62);

    // ---- the paper sky: the split fountain (the only gradient), flat sun or half moon, five ridge inks ----------
    {
      const rp = []; for (let i = 0; i < 15; i++) rp.push(rng());
      // the low volcanic hill (its crest lies 78.5 degrees off this bearing) stands right behind the gate, so the pale arch
      // and the two giants are read against its ink and not against bare paper
      const HILL_B = Math.atan2(aX, -aZ) + 1.37 + 0.08 * (rp[0] - 0.5);
      const ridge = (k) => mixc(mixc(mixc(ink.violet, ink.terra, 0.42 - 0.1 * k), ink.turq, 0.07 * k), ink.skyBot, 0.2 + 0.15 * k);
      const dome = add(new THREE.SphereGeometry(3600, 40, 20), mat(/* glsl */`
        varying vec3 vD;
        void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p; }`, WG + /* glsl */`
        uniform vec3 uTop, uBot, uSunInk, uGL, uGSh, uR0, uR1, uR2, uR3, uR4, uMoonCut; uniform float uGroundY, uDisc; uniform vec3 uRa, uRb, uRc, uRd, uRe;
        varying vec3 vD;
        float tri(float x){ return abs(fract(x) - .5) * 2.; }
        float saw(vec2 n, vec3 r, float f){ return .5 * tri(n.x * 2.3 * f + r.x) + .32 * tri(n.y * 4.1 * f + r.y) + .18 * tri((n.x + n.y) * 7.7 * f + r.z); }
        void main(){
          vec3 d = normalize(vD + vec3(0., 1e-6, 0.));
          float hl = max(length(d.xz), 1e-4), el = d.y / hl; vec2 n = d.xz / hl;
          vec3 c = mix(uBot, uTop, smoothstep(.0, .62, el));
          float sd = dot(d, uSun);
          float disc = aastep(uDisc, sd) * (1. - aastep(uDisc, dot(d, normalize(uSun + uMoonCut))) * step(.001, length(uMoonCut)));
          c = mix(c, uSunInk, disc);
          c = mix(c, uR4, 1. - aastep(.012 + .020 * saw(n, uRe, 1.9), el));
          c = mix(c, uR3, 1. - aastep(.010 + .030 * saw(n, uRd, 1.3), el));
          c = mix(c, uR2, 1. - aastep(.008 + .044 * saw(n, uRc, 1.), el));
          c = mix(c, uR1, 1. - aastep(.004 + .050 * saw(n, uRb, .62), el));
          float hill = .07 * (1. - smoothstep(0., .5, abs(n.x * uRa.x + n.y * uRa.y - .2))) * step(0., n.x * uRa.y - n.y * uRa.x + 2.) + .012 * tri(n.x * 5. + uRa.z);
          c = mix(c, uR0, 1. - aastep(hill, el));
          float t = (cameraPosition.y - uGroundY) / max(-d.y, 1e-4);
          float sh = shadeAll(cameraPosition.xz + d.xz * min(t, 60000.));
          c = mix(c, mix(uGL, uGSh, sh), 1. - aastep(0., el));
          gl_FragColor = vec4(c, 1.);
        }`, { uTop: ink.skyTop, uBot: ink.skyBot, uSunInk: ink.sun, uGL: ink.groundL, uGSh: ink.groundSh, uGroundY: AP,
        uR0: ridge(0), uR1: ridge(1), uR2: ridge(2), uR3: ridge(3), uR4: ridge(4), uDisc: night ? 0.9992 : 0.99915,
        uMoonCut: night ? new THREE.Vector3(0.022, 0.006, 0.01) : new THREE.Vector3(0, 0, 0),
        uRa: new THREE.Vector3(Math.sin(HILL_B), -Math.cos(HILL_B), rp[1]), uRb: new THREE.Vector3(rp[2], rp[3], rp[4]), uRc: new THREE.Vector3(rp[5], rp[6], rp[7]),
        uRd: new THREE.Vector3(rp[8], rp[9], rp[10]), uRe: new THREE.Vector3(rp[11], rp[12], rp[13]) }, { side: THREE.BackSide, depthWrite: false }), -2);
      followers.push(dome);
    }
    await ctx.yield();

    // ---- the ground: one ink family for the apron mesh and for the cut wash strip that lies in it ---------------
    const GROUND_VS = /* glsl */`
      attribute vec2 aAc; varying vec3 vW; varying vec3 vN; varying vec2 vAc;
      void main(){ vW = position; vN = normal; vAc = aAc; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`;
    const GROUND_FS = WG + /* glsl */`
      uniform vec3 uGL, uGM, uGSh, uSand, uSandSh, uCocoa, uBankX; uniform float uStrip, uBankH, uBar, uBarSide;
      varying vec3 vW; varying vec3 vN; varying vec2 vAc;
      void main(){
        vec2 q = vW.xz; float sh = shadeAll(q);
        float n = vn3(vec3(q * .15, 1.7)) + .5 * vn3(vec3(q * .41, 5.));
        float blot = aastep(1.12, n);
        float pf = clamp(1. - fwidth(q.x * 1.3) * 2.2, 0., 1.), pf2 = clamp(1. - (fwidth(q.x) + fwidth(q.y)) * 7., 0., 1.);
        float peb = aastep(.78, vn3(vec3(q * 1.3, 9.))) * pf;
        float tick = aastep(.80, vn3(vec3(q * 5.1 + 11., 7.))) * pf2;
        float fleck = aastep(.82, vn3(vec3(q.yx * 4.3, 3.))) * pf2;
        float rill = vn3(vec3(q.x * .06 + q.y * .22, q.y * .05 - q.x * .2, 2.)) + .4 * vn3(vec3(q * .9, 4.));
        float rl = aastep(.92, rill) * (1. - aastep(1.0, rill)) * pf;
        vec3 gL = mix(uGL, uGSh, sh), gM = mix(uGM, mix(uGSh, uGSh * uOver, .6), sh), gD = gM * mix(vec3(1.), uOver, .8);
        float ndl = dot(normalize(vN), uSun);
        vec3 apron = tone3(gL, gM, gD, ndl + .1);
        apron = mix(apron, gM, max(blot, max(peb * step(.86, n), rl)));
        apron = mix(apron, mix(gM, gD, .5), tick * (1. - blot) * .9);
        apron = mix(apron, mix(uPaper, gL, .3 + .45 * sh), fleck * .9);
        vec3 c = apron;
        if (uStrip > .5) {
          float y = vW.y, top = aastep(uBankH - .07, y), bed = 1. - aastep(.07, y), m = min(vAc.x, vAc.y), along = q.x * uBankX.z - q.y * uBankX.x;
          float r = vn3(vec3(m * .55, (q.x + q.y) * .05, 3.)) + .35 * vn3(vec3(m * 1.7, (q.x - q.y) * .14, 8.));
          float streak = aastep(.80, r) * (1. - aastep(.90, r)) + aastep(1.14, r);
          vec3 sand = mix(uSand, uSandSh, sh);
          vec3 sandD = mix(uSand * mix(vec3(1.), uOver, .5), uSandSh * mix(vec3(1.), uOver, .62), sh), sandL = mix(sand, uPaper, .6);
          vec3 bedc = mix(sand, gL, clamp(streak, 0., 1.) * (.62 - .4 * sh));
          // ripple marks across the flow, in patches: a dark lee band and a pale crest line each
          float ra = along * 2.3 + 2.4 * vn3(vec3(q * .17, 4.)) + .9 * sin(m * .45);
          float rb = sin(ra), rfade = clamp(1.5 - fwidth(ra) * 1.5, 0., 1.) * aastep(.5, vn3(vec3(q * .05, 12.)) + .25 * sin(m * .21));
          bedc = mix(bedc, sandD, aastep(.42, rb) * rfade * .9);
          bedc = mix(bedc, sandL, aastep(.84, -rb) * rfade * .9);
          // long cocoa drift lines down the flow, and printed cobbles between the standing ones
          float dl = vn3(vec3(m * .8, along * .035, 21.)) + .25 * vn3(vec3(m * 2.6, along * .11, 5.));
          bedc = mix(bedc, mix(sand, uCocoa, .5), aastep(.80, dl) * (1. - aastep(.845, dl)) * clamp(1.3 - fwidth(m) * 5., 0., 1.) * .85);
          float cob = vn3(vec3(q * 1.7, 15.));
          bedc = mix(bedc, mix(mix(uGM, uPaper, .32), sandD, .55 * sh), aastep(.83, cob) * pf);
          float rip = sin(m * 1.9 + 5. * vn3(vec3(m * .21, (q.x - q.y) * .09, 6.)) + (q.x + q.y) * .12);
          bedc = mix(bedc, mix(sand, uSandSh * mix(vec3(1.), uOver, .25 + .3 * sh), .45), aastep(.8, rip) * pf);
          bedc = mix(bedc, mix(sand, uCocoa, .35), tick * .55);
          bedc = mix(bedc, mix(uPaper, sand, .4 * sh), fleck * .6);
          float bd = uBarSide > 0. ? vAc.x : vAc.y;
          float barM = aastep(.3, bd) * (1. - aastep(uBar + .3 * sin(along * .8) + .15 * sin(along * 2.3), bd)) * (1. - sh);
          bedc *= mix(vec3(1.), uOver, barM);
          vec3 nb = normalize(uBankX * (vAc.x < vAc.y ? 1. : -1.) + vec3(0., .3, 0.));
          vec3 bank = tone3(mix(uGM, uGL, .28), uGM, uGM * uOver, dot(nb, uSun));
          bank = mix(bank, uGM * mix(vec3(1.), uOver, .75), sh);
          float yy = y / uBankH + .05 * sin(along * .7) + .03 * sin(along * 2.9);
          float strata = aastep(.34, yy) * (1. - aastep(.41, yy)) + aastep(.70, yy) * (1. - aastep(.75, yy));
          bank = mix(bank, uCocoa, strata * .85);
          c = mix(mix(bank, apron, top), bedc, bed);
        }
        gl_FragColor = vec4(grain(c, vW), 1.);
      }`;
    const barLen = Math.min(6, (AP * Math.abs(sunL.x)) / Math.max(sunL.y, 0.15));
    const groundU = { uGL: ink.groundL, uGM: ink.groundM, uGSh: ink.groundSh, uSand: ink.sand, uSandSh: ink.sandSh, uCocoa: ink.cocoa,
      uBankX: new THREE.Vector3(cT, 0, -sT), uBankH: AP, uBar: barLen, uBarSide: sunL.x < 0 ? 1 : -1 };
    {
      // apron: a tensor grid, 4.6 m cells round the path, stretching to the horizon
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[2]); z1 = Math.max(z1, p[2]); }
      const lines = (a, b) => {
        const v = []; for (let x = a; x <= b; x += 4.6) v.push(x);
        let s = 4.6, x = v[v.length - 1]; while (x < b + 3300) { s *= 1.45; x += s; v.push(x); }
        s = 4.6; x = a; while (x > a - 3300) { s *= 1.45; x -= s; v.unshift(x); }
        return v;
      };
      const xs = lines(x0 - 72, x1 + 72), zs = lines(z0 - 96, z1 + 44), nx = xs.length, nzz = zs.length;
      const pos = new Float32Array(nx * nzz * 3), ac = new Float32Array(nx * nzz * 2).fill(-50);
      for (let j = 0, k = 0; j < nzz; j++) {
        for (let i = 0; i < nx; i++, k += 3) {
          const x = xs[i], z = zs[j], l = toL(x, z);
          let h = apron(x, z);
          if (l[1] > SZ0 && l[1] < SZ1) { const out = -W.bankDist(l[0], l[1]); if (out < 15) h -= 2.6 * (1 - smoothstep(4, 15, out)) * (1 - endFade(l[1])); }
          pos[k] = x; pos[k + 1] = h; pos[k + 2] = z;
        }
        if (j % 40 === 0) await ctx.yield();
      }
      const idx = new Uint32Array((nx - 1) * (nzz - 1) * 6);
      for (let j = 0, k = 0; j < nzz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + nx; idx[k++] = a; idx[k++] = b; idx[k++] = a + 1; idx[k++] = a + 1; idx[k++] = b; idx[k++] = b + 1; }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aAc', new THREE.BufferAttribute(ac, 2));
      g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
      add(g, mat(GROUND_VS, GROUND_FS, { ...groundU, uStrip: 0 }), -1);
      // the same triangles, sampled: everything that stands or lies on the land asks this
      const cellOf = (arr, v) => { let lo = 0, hi = arr.length - 2; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (arr[m] <= v) lo = m; else hi = m - 1; } return lo; };
      meshH = (x, z) => {
        const i = cellOf(xs, x), j = cellOf(zs, z), fx = clamp((x - xs[i]) / (xs[i + 1] - xs[i]), 0, 1), fz = clamp((z - zs[j]) / (zs[j + 1] - zs[j]), 0, 1);
        const a = (j * nx + i) * 3 + 1, b = a + nx * 3, ha = pos[a], ha1 = pos[a + 3], hb = pos[b], hb1 = pos[b + 3];
        return fx + fz <= 1 ? ha + fx * (ha1 - ha) + fz * (hb - ha) : hb1 + (1 - fx) * (hb - hb1) + (1 - fz) * (ha1 - hb1);
      };
      await ctx.yield();
      // the wash strip, rows across the hero's bank lines so the cut is crisp
      const b = new Buf({ position: 3, normal: 3, aAc: 2 });
      const offs = [-24, -13, -6, -2.5, -0.7, 0, 0.14, 0.3, 0.5, 0.9, 1.4, 2.1, 4, 8];
      const rows = Math.round((SZ1 - SZ0) / 2.5), cols = offs.length * 2 + 1;
      for (let j = 0; j <= rows; j++) {
        const z = SZ0 + ((SZ1 - SZ0) * j) / rows, c = W.centerX(z), xl = c - 100 - W.bankDist(c - 100, z), xr = c + 100 + W.bankDist(c + 100, z), xv = [], ef = endFade(z);
        for (const o of offs) xv.push(xl + o);
        xv.push((xl + xr) / 2);
        for (let i = offs.length - 1; i >= 0; i--) xv.push(xr - offs[i]);
        for (const x of xv) { const dl = x - xl, dr = xr - x, m = Math.min(dl, dr), w = toW(x, z); b.v({ position: [w[0], m > 0 ? lerp(W.cut(m), AP, ef) : AP, w[1]], normal: [0, 1, 0], aAc: [dl, dr] }); }
      }
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols - 1; i++) { const a = j * cols + i; b.quad(a, a + cols, a + cols + 1, a + 1); }
      add(b.geo(), mat(GROUND_VS, GROUND_FS, { ...groundU, uStrip: 1 }, { offset: 1 }), -1);
    }
    await ctx.yield();

    // ---- cast shadows: flat violet bars lying to the right of everything (instanced capsules on the ground) -----
    const sunXZ = Math.hypot(sunW.x, sunW.z) || 1e-3, shDX = -sunW.x / sunXZ, shDZ = -sunW.z / sunXZ, shK = Math.min(3.2, sunXZ / Math.max(sunW.y, 0.12));
    const bars = [];                                             // x, z, length, half width, ground y, kind (0 capsule, 1 ellipse)
    const bar = (x, z, h, hw, gy, kind = 0) => bars.push(x, z, Math.max(h * shK, hw * 1.2), hw, gy, kind);
    const SHADOW_FS = WG + /* glsl */`
      uniform vec3 uBar; varying vec3 vW;
      void main(){ if (shadeAll(vW.xz) > .5) discard; gl_FragColor = vec4(uBar, 1.); }`;

    // ---- where things may stand: clear of the path, of the wash bed and of every animal's track ------------------
    const trackHash = new Map();
    const hkey = (x, z) => Math.floor(x / 4) * 4096 + Math.floor(z / 4);
    const markTrack = (x, z) => { const k = hkey(x, z); let a = trackHash.get(k); if (!a) trackHash.set(k, a = []); a.push(x, z); };
    const nearTrack = (x, z, r) => {
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const a = trackHash.get(hkey(x + i * 4, z + j * 4)); if (a) for (let k = 0; k < a.length; k += 2) if ((a[k] - x) ** 2 + (a[k + 1] - z) ** 2 < r * r) return true; }
      return false;
    };
    const washOut = (x, z) => { const l = toL(x, z); return l[1] > SZ0 - 20 && l[1] < SZ1 + 20 ? -W.bankDist(l[0], l[1]) : 99; };   // metres outside the bank line
    const saddleQ = (x, z) => { const t = -((x - E1x) * aX + (z - E1z) * aZ); return t > -30 && t < 70 ? Math.abs((x - E1x) * rX + (z - E1z) * rZ) : 99; };

    // ---- the herd: every pronghorn runs a baked track; gait phase is a function of distance along it -----------
    // Track distance s is measured along the camera path; the animal stands at s0 until the bolt, then
    // s(D) = s0 + f(D - Db) + a correction that lets it outrun us to its place in the gallop (D = camera distance).
    const hr = rng.fork('herd');
    const NH = clamp(Math.round(14 * density), 9, 18), TS = Math.ceil(L) + 60;
    const sWash = path.nearestXZ(ftW[1][0], ftW[1][1]).u * L, sOutW = uPass * L;
    const herd = [];
    // where each of the six near animals runs on the final straight: [metres ahead of us, metres to the side]
    const END = { 1: [9.6, -5.6], 5: [7.2, -2.4], 3: [16.5, -6.2], 2: [7.7, 2.4], 4: [11.6, 7.0], 6: [14.5, 6.0] };   // 5 and 2 run close in on either hand
    for (let i = 0; i < NH; i++) {
      const side = i % 2 ? -1 : 1, lead = i === 0, rear = i === NH - 1;
      const kind = rear || i === 4 ? 1 : i % 5 === 3 ? 2 : 0;       // 0 doe, 1 buck, 2 fawn
      const near = i >= 1 && i <= 6;
      const a = {
        kind, seed: hr(), scale: kind === 1 ? 1.08 : kind === 2 ? hr.range(0.6, 0.7) : hr.range(0.94, 1.02),
        s0: lead ? 28 : near ? 13.5 + 2.1 * i + hr.range(-0.8, 0.8) : hr.range(27, 44),
        Db: hr.range(7.5, 11.5), T: hr.range(6, 8),
        lat0: lead ? 3.4 : side * (near ? 3.6 + ((i * 1.9) % 5.5) : hr.range(2.5, 13)),
        leadG: lead ? 5.6 : rear ? 3.2 : near ? hr.range(4.5, 12) : hr.range(7, 17),
        latG: lead ? 2.7 : rear ? -6.4 : side * hr.range(3.8, 12.5),
        latW: lead ? 3.3 : hr.range(1.4, 10.5), latE: (lead ? 1 : side) * hr.range(10, 14.5), endLead: hr.range(12, 34),
        wob: hr.range(0, 6.28), graze: lead ? 0 : hr.chance(0.7) ? 1 : 0,
      };
      a.out = 9.7 + 2.6 * ((i * 0.37) % 1);                       // how wide it passes the giant on its side
      const lw = rear ? 0 : i === 2 ? 1 : i === 5 ? 2 : -1;      // three cross last, up-wash of us, with the flood behind them
      if (lw >= 0) { a.latW = -(3.2 + 1.9 * lw); a.leadG = 3.4 + 2.6 * lw; }
      if (END[i]) { a.latE = END[i][1]; a.endLead = END[i][0] - a.leadG; }   // (after the wash lead is settled, so the end place is exact)
      else if (lead) { a.latE = 4.6; a.endLead = 13; }
      else if (rear) { a.latE = -6.4; a.endLead = 2.2; }
      a.corr = a.leadG - (a.s0 - a.Db - a.T);
      a.sOf = (D) => {
        const x = D - a.Db, f = x <= 0 ? 0 : x - a.T * (1 - Math.exp(-x / a.T));
        return a.s0 + f + a.corr * smoothstep(a.Db + 8, a.Db + 115, D) + 1.3 * Math.sin(D * 0.013 + a.wob) * smoothstep(a.Db + 110, a.Db + 170, D) * (1 - smoothstep(L - 200, L - 110, D)) + a.endLead * smoothstep(L - 200, L - 84, D);
      };
      const lat0 = (s) => {
        let l = lerp(a.lat0, a.latG, smoothstep(a.s0 + 4, a.s0 + 62, s));
        l = lerp(l, a.latW, smoothstep(sWash - 85, sWash - 25, s) * (1 - smoothstep(sOutW + 8, sOutW + 60, s)));
        l += 1.1 * Math.sin(s * 0.021 + a.wob * 2) * smoothstep(a.s0 + 30, a.s0 + 90, s) * (1 - smoothstep(L - 150, L - 90, s));
        l = lerp(l, a.latE, smoothstep(L - 150, L - 78, s));
        return lerp(l, (a.latE < 0 ? -1 : 1) * Math.max(Math.abs(l), a.out), smoothstep(L - 34, L - 5, s));
      };
      const pass = spec.map((o) => (lat0(o.s) >= o.lat ? 1 : -1));   // which side of each hand-set trunk this one takes
      const lat = (s) => {
        let l = lat0(s);
        for (let k = 0; k < spec.length; k++) {
          const o = spec[k], ds = Math.abs(s - o.s); if (ds > 17) continue;
          l += pass[k] * Math.max(0, o.r - pass[k] * (l - o.lat)) * smoothstep(17, 4, ds);
        }
        return l;
      };
      const X = new Float32Array(TS), Z = new Float32Array(TS), Y = new Float32Array(TS), PH = new Float32Array(TS), AIR = new Float32Array(TS), bed = new Uint8Array(TS);
      let sIn = -1, sOut = -1, ph = 0;
      for (let s = 0; s < TS; s++) {
        pathFrame(s, fr); const l = lat(s);
        X[s] = fr.x - fr.tz * l; Z[s] = fr.z + fr.tx * l; Y[s] = heightAt(X[s], Z[s]);
        bed[s] = washOut(X[s], Z[s]) < 0 ? 1 : 0;
        if (bed[s]) { if (sIn < 0) sIn = s; sOut = s; }
        const run = s - a.s0; if (run > 0) ph += 1 / ((2.2 + 4.8 * (1 - Math.exp(-run / 18))) * (kind === 2 ? 0.8 : 1)); PH[s] = ph;
        if (s >= a.s0 - 1) markTrack(X[s], Z[s]);
      }
      const arc = (sa, sb, ya, yb, up) => { for (let s = Math.max(0, Math.floor(sa)); s <= Math.min(TS - 1, Math.ceil(sb)); s++) { const t = clamp((s - sa) / (sb - sa), 0, 1); Y[s] = lerp(ya, yb, t) + 4 * up * t * (1 - t); AIR[s] = Math.sin(t * Math.PI); } };
      if (sIn > 0) { arc(sIn - 3.2, sIn + 3.4, AP, 0, 0.5); arc(sOut - 2.6, sOut + 3.2, 0, AP, 0.75); }
      a.X = X; a.Z = Z; a.Y = Y; a.PH = PH; a.AIR = AIR; a.sIn = sIn; a.sOut = sOut;
      herd.push(a);
      if (i % 4 === 3) await ctx.yield();
    }
    const sample = (arr, s) => { const i = clamp(Math.floor(s), 0, TS - 2), f = clamp(s - i, 0, 1); return arr[i] + (arr[i + 1] - arr[i]) * f; };
    await ctx.yield();
    // the herd parts round the towering saguaro's foot, by the law of the hand-set trunks above: each animal keeps the
    // side of it that it runs on at the trunk's station and is pushed out to TOWER_BEND metres from it, eased over 17 m
    // of the way either side. Only these metres of track change; the bent points are kept (bendPts), and what would
    // stand on them is taken off the land further down.
    const bendPts = [];
    const nearBend = (x, z, r) => { for (let k = 0; k < bendPts.length; k += 2) if ((bendPts[k] - x) ** 2 + (bendPts[k + 1] - z) ** 2 < r * r) return true; return false; };
    for (const a of herd) {
      const latAt = (s) => { pathFrame(s, fr); return (a.X[s] - fr.x) * -fr.tz + (a.Z[s] - fr.z) * fr.tx; };
      const pass = latAt(Math.round(tower.s)) >= tower.lat ? 1 : -1;
      for (let s = Math.max(1, Math.ceil(tower.s - 17)); s <= Math.min(TS - 2, Math.floor(tower.s + 17)); s++) {
        const l = latAt(s), push = pass * Math.max(0, TOWER_BEND - pass * (l - tower.lat)) * smoothstep(17, 4, Math.abs(s - tower.s));
        if (push === 0) continue;
        a.X[s] = fr.x - fr.tz * (l + push); a.Z[s] = fr.z + fr.tx * (l + push);
        if (a.AIR[s] === 0) a.Y[s] = heightAt(a.X[s], a.Z[s]);
        bendPts.push(a.X[s], a.Z[s]);
      }
    }

    // ---- animals: flat shapes with one shadow tone and a cream keyline, posed in the vertex shader --------------
    // rings: [x, y, z, rx, ry] along a spine lying in a plane x = const; aB = (bone, ink, v along the loft, sin of the ring angle)
    const ASPEC = { position: 3, normal: 3, aB: 4, aPv: 3 };
    const loft = (b, rings, seg, bone, inkId, pv) => {
      const n = rings.length, base = [];
      for (let i = 0; i < n; i++) {
        const p = rings[i], q0 = rings[Math.max(0, i - 1)], q1 = rings[Math.min(n - 1, i + 1)];
        let ty = q1[1] - q0[1], tz = q1[2] - q0[2]; const tl = Math.hypot(ty, tz) || 1; ty /= tl; tz /= tl;
        base.push(b.n);
        for (let k = 0; k <= seg; k++) {
          const a = (k / seg) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
          const nx = ca / p[3], ny = (tz * sa) / p[4], nzz = (-ty * sa) / p[4], nl = Math.hypot(nx, ny, nzz) || 1;
          b.v({ position: [p[0] + ca * p[3], p[1] + tz * sa * p[4], p[2] - ty * sa * p[4]], normal: [nx / nl, ny / nl, nzz / nl], aB: [bone, inkId, i / (n - 1), sa], aPv: pv });
        }
      }
      for (let i = 0; i < n - 1; i++) for (let k = 0; k < seg; k++) { const a = base[i] + k, c = base[i + 1] + k; b.quad(a, a + 1, c + 1, c); }
      for (const e of [0, n - 1]) {
        const p = rings[e], q = rings[e ? n - 2 : 1]; let ty = p[1] - q[1], tz = p[2] - q[2]; const tl = Math.hypot(ty, tz) || 1; ty /= tl; tz /= tl;
        const r = Math.min(p[3], p[4]) * 0.6, c = b.v({ position: [p[0], p[1] + ty * r, p[2] + tz * r], normal: [0, ty, tz], aB: [bone, inkId, e ? 1 : 0, 0], aPv: pv });
        for (let k = 0; k < seg; k++) { if (e) b.tri(c, base[e] + k, base[e] + k + 1); else b.tri(c, base[e] + k + 1, base[e] + k); }
      }
    };
    const CRIT_VS = VG + /* glsl */`
      attribute vec4 aB; attribute vec3 aPv; attribute vec4 aI0, aI1, aI2, aI3;
      uniform float uMode; uniform vec3 uHipF, uHipH, uNeck, uHeadJ, uCg;
      varying vec3 vN; varying vec3 vO; varying vec4 vB; varying vec3 vW; varying vec2 vK;
      vec3 rX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, p.y * c - p.z * s, p.z * c + p.y * s); }
      float legAng(float s, out float flex){
        float st = .24, A = .62;
        if (s < st) { flex = 0.; return mix(A, -A, s / st); }
        float k = (s - st) / (1. - st); flex = sin(k * 3.14159); return mix(-A, A, k * k * (3. - 2. * k));
      }
      void main(){
        float bone = aB.x, ph = aI2.x, gw = aI2.y, bw = aI2.z, np = aI2.w, kind = aI1.w;
        vec3 p = position, n = normal;
        if (bone > 2.5 && bone < 10.5) {
          float li = floor((bone - 3.) / 2. + .01), lower = bone - 3. - 2. * li;
          bool hind = li > 1.5;
          float off = li < .5 ? .5 : li < 1.5 ? .42 : li < 2.5 ? 0. : .08;
          float flex = 0.; float a = legAng(fract(ph + off), flex) * gw; flex *= gw * (1. - bw);
          a = mix(a, hind ? -.95 : 1.05, bw);
          float sx = aPv.x < 0. ? -1. : 1.;
          vec3 hip = (hind ? uHipH : uHipF) * vec3(sx, 1., 1.);
          if (lower > .5) { float fa = flex * (hind ? 1. : 1.5); p = aPv + rX(p - aPv, fa); n = rX(n, fa); }
          p = hip + rX(p - hip, -a); n = rX(n, -a);
        } else if ((bone > .5 && bone < 2.5) || bone > 11.5) {
          float na = np < 0. ? mix(-.1, 1.3, -np) : mix(-.1, .5, np);
          if (bone > 11.5) p = aPv + (p - aPv) * (kind > .5 && kind < 1.5 ? 1. : .22);
          if (bone > 1.5) { p = uHeadJ + rX(p - uHeadJ, -na * .55); n = rX(n, -na * .55); }
          p = uNeck + rX(p - uNeck, na); n = rX(n, na);
        }
        float rock = gw * (1. - bw) * .07 * sin(ph * 6.2832 + 1.2) + aI1.x;
        p = uCg + rX(p - uCg, rock); n = rX(n, rock);
        p.y += gw * (1. - bw) * uCg.y * .07 * sin(ph * 12.566 + .6);
        p *= aI1.y;
        float cy = cos(aI0.w), sy = sin(aI0.w);
        vec3 w = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy) + aI0.xyz;
        vec3 wn = normalize(vec3(n.x * cy + n.z * sy, n.y, -n.x * sy + n.z * cy));
        if (uMode > 1.5) w = flatten(w, aI3.x);
        else if (uMode > .5) w += wn * min(.008 + distance(w, cameraPosition) * .0034, .05);
        vN = wn; vO = position; vB = aB; vW = w; vK = vec2(kind, aI1.z);
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
      }`;
    const CRIT_FS = WG + /* glsl */`
      uniform vec3 uL, uM, uD, uDark, uBar; uniform float uMode, uSpecies;
      varying vec3 vN; varying vec3 vO; varying vec4 vB; varying vec3 vW; varying vec2 vK;
      void main(){
        if (uMode > 1.5) { if (shadeAll(vW.xz) > .5) discard; gl_FragColor = vec4(uBar, 1.); return; }
        if (uMode > .5) { gl_FragColor = vec4(uPaper, 1.); return; }
        float sh = shadeAll(vW.xz), ndl = dot(normalize(vN), uSun), id = vB.y, cr = 0., dk = 0.;
        vec3 c = ink3(uL, uM, uD, ndl, sh);
        vec3 cream = tone3(uPaper, uPaper, mix(uPaper, uPaper * uOver, .85), ndl + .3);
        if (uSpecies < .5) {
          bool buck = vK.x > .5 && vK.x < 1.5;
          if (id < .5) {
            float belly = 1. - aastep(.70 + .03 * sin(vO.z * 9.), vO.y);
            float rr = length(vec2(vO.x, (vO.y - .84) * .85));
            cr = max(belly, (1. - aastep(.105 + .12 * vK.y, rr)) * (1. - aastep(-.36, vO.z)));
          } else if (id < 1.5) cr = (aastep(.18, vB.z) * (1. - aastep(.40, vB.z)) + aastep(.56, vB.z) * (1. - aastep(.80, vB.z))) * (1. - aastep(.15, vB.w));
          else if (id < 2.5) { cr = (1. - aastep(-.3, vB.w)) * aastep(.2, vB.z); dk = max(aastep(.84, vB.z), buck ? (1. - aastep(.1, vB.w)) * (1. - aastep(.42, vB.z)) * aastep(.08, vB.z) : 0.); }
          else if (id < 3.5) c = ink3(mix(uL, uPaper, .32), mix(uM, uPaper, .22), uD, ndl, sh);
          else if (id < 4.5) dk = 1.;
          else if (id > 5.5) cr = 1.;
        } else if (uSpecies < 1.5) {
          if (id < .5) cr = 1. - aastep(.15, vO.y);
          else if (id > 4.5 && id < 5.5) dk = aastep(.8, vB.z);
          else if (id > 5.5) cr = 1.;
        } else {
          if (id < .5) { float st = sin(vO.z * 70. + vO.x * 40.); cr = max(1. - aastep(.165, vO.y), aastep(.55, st) * (1. - aastep(.0, vO.z)) * .0 + aastep(.3, st) * aastep(-.02, vO.z) * (1. - aastep(.2, vO.y))); dk = aastep(.5, vB.w) * (1. - aastep(-.05, vO.z)); }
          else if (id > 3.5 && id < 4.5) dk = 1.;
          else if (id > 2.5 && id < 3.5) cr = .6;
        }
        c = mix(mix(c, cream, cr), uDark, dk);
        gl_FragColor = vec4(c, 1.);
      }`;
    const NIGHT = mixc(WHITE, mixc(ink.violet, ink.turq, 0.3), 0.6);
    const nt = (c) => (night ? c.clone().multiply(NIGHT) : c);   // local inks under the moon
    const critters = [];
    const makeCritter = (buf, count, species, rig, L3) => {
      const g0 = buf.geo(), g = new THREE.InstancedBufferGeometry();
      g.index = g0.index; for (const k in g0.attributes) g.setAttribute(k, g0.attributes[k]);
      const I = [0, 1, 2, 3].map((k) => { const at = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4); at.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aI' + k, at); return at; });
      g.instanceCount = count;
      const U = { uHipF: new THREE.Vector3(...rig.hipF), uHipH: new THREE.Vector3(...rig.hipH), uNeck: new THREE.Vector3(...rig.neck), uHeadJ: new THREE.Vector3(...rig.headJ), uCg: new THREE.Vector3(...rig.cg),
        uL: L3[0], uM: L3[1], uD: L3[2], uDark: nt(mixc(ink.cocoa, ink.violet, 0.55).multiplyScalar(0.42)), uBar: barInk, uSpecies: species };
      add(g, mat(CRIT_VS, CRIT_FS, { ...U, uMode: 2 }, { offset: 2 }), 1);
      add(g, mat(CRIT_VS, CRIT_FS, { ...U, uMode: 1 }, { side: THREE.BackSide }), 2);
      add(g, mat(CRIT_VS, CRIT_FS, { ...U, uMode: 0 }), 2);
      const c = { I, count, tris: g0.index.count / 3,
        // i, x, y, z, yaw, pitch, scale, flare, kind, phase, gallop, bound, neck, groundY
        set(i, x, y, z, yaw, pitch, sc, flare, kind, ph, gw, bw, np, gy) {
          const o = i * 4; I[0].array[o] = x; I[0].array[o + 1] = y; I[0].array[o + 2] = z; I[0].array[o + 3] = yaw;
          I[1].array[o] = pitch; I[1].array[o + 1] = sc; I[1].array[o + 2] = flare; I[1].array[o + 3] = kind;
          I[2].array[o] = ph; I[2].array[o + 1] = gw; I[2].array[o + 2] = bw; I[2].array[o + 3] = np; I[3].array[o] = gy;
        },
        flush() { for (const at of I) at.needsUpdate = true; } };
      critters.push(c); return c;
    };
    const legs = (b, x, zf, zh, yj, yk, up, lo, hoof, t) => { // four two-bone legs: bones 3..10 (FL, FR, HL, HR)
      [[-1, zf, 3, up[0]], [1, zf, 5, up[0]], [-1, zh, 7, up[1]], [1, zh, 9, up[1]]].forEach(([sg, z, bone, fat]) => {
        const X = sg * x, hindK = bone > 6 ? t : 0;
        loft(b, [[X, yj + 0.04, z, fat * 0.75, fat * 1.25], [X, (yj + yk) / 2, z + 0.01 - hindK * 0.3, fat * 0.55, fat * 0.72], [X, yk, z - hindK, lo * 1.25, lo * 1.4]], 6, bone, 3, [X, yj, z]);
        loft(b, [[X, yk, z - hindK, lo * 1.2, lo * 1.3], [X, yk * 0.4, z - hindK * 0.4, lo, lo * 1.05], [X, hoof, z, lo, lo * 1.15]], 6, bone + 1, 3, [X, yk, z - hindK]);
        loft(b, [[X, hoof, z, lo * 1.15, lo * 1.4], [X, 0, z + hoof * 0.35, lo * 1.3, lo * 1.7]], 6, bone + 1, 4, [X, yk, z - hindK]);
      });
    };
    let prong, hare, runner;
    {
      const b = new Buf(ASPEC), O = [0, 0, 0];
      loft(b, [[0, 0.80, -0.67, 0.05, 0.07], [0, 0.80, -0.59, 0.13, 0.17], [0, 0.79, -0.40, 0.165, 0.21], [0, 0.76, -0.10, 0.17, 0.2], [0, 0.75, 0.18, 0.17, 0.22], [0, 0.77, 0.40, 0.15, 0.22], [0, 0.82, 0.55, 0.10, 0.15], [0, 0.86, 0.62, 0.05, 0.07]], 10, 0, 0, O);
      loft(b, [[0, 0.86, 0.47, 0.09, 0.13], [0, 1.0, 0.58, 0.07, 0.092], [0, 1.13, 0.67, 0.06, 0.076], [0, 1.25, 0.745, 0.055, 0.07]], 8, 1, 1, O);
      loft(b, [[0, 1.285, 0.70, 0.05, 0.062], [0, 1.27, 0.78, 0.064, 0.076], [0, 1.23, 0.88, 0.05, 0.06], [0, 1.19, 0.96, 0.036, 0.042], [0, 1.175, 1.0, 0.022, 0.026]], 8, 2, 2, O);
      for (const sg of [-1, 1]) {
        loft(b, [[sg * 0.05, 1.31, 0.715, 0.03, 0.012], [sg * 0.085, 1.40, 0.70, 0.04, 0.014], [sg * 0.105, 1.48, 0.69, 0.008, 0.005]], 5, 2, 5, O);
        const hp = [sg * 0.042, 1.31, 0.80];
        loft(b, [[hp[0], 1.31, 0.80, 0.017, 0.022], [hp[0] * 1.3, 1.45, 0.79, 0.014, 0.024], [hp[0] * 1.5, 1.57, 0.76, 0.009, 0.013], [hp[0] * 1.2, 1.615, 0.71, 0.003, 0.004]], 5, 12, 4, hp);
        loft(b, [[hp[0] * 1.3, 1.44, 0.80, 0.008, 0.016], [hp[0] * 1.35, 1.47, 0.875, 0.003, 0.005]], 4, 12, 4, hp);
      }
      loft(b, [[0, 0.86, -0.64, 0.035, 0.03], [0, 0.82, -0.72, 0.012, 0.012]], 5, 0, 6, O);
      legs(b, 0.105, 0.40, -0.46, 0.62, 0.34, [0.062, 0.085], 0.021, 0.045, 0.045);
      const TL = nt(mixc(ink.terra, ink.gold, 0.05)), TM = nt(mixc(ink.terra, ink.cocoa, 0.36)), TD = nt(mixc(ink.cocoa, ink.violet, 0.25));   // the back is flat terracotta: redder and a step darker than the gold it runs on
      prong = makeCritter(b, NH, 0, { hipF: [0.105, 0.62, 0.40], hipH: [0.105, 0.62, -0.46], neck: [0, 0.9, 0.5], headJ: [0, 1.24, 0.72], cg: [0, 0.7, 0] }, [TL, TM, TD]);
    }
    {
      const b = new Buf(ASPEC), O = [0, 0, 0];
      loft(b, [[0, 0.17, -0.22, 0.045, 0.06], [0, 0.2, -0.1, 0.085, 0.11], [0, 0.2, 0.06, 0.075, 0.095], [0, 0.22, 0.18, 0.05, 0.06]], 8, 0, 0, O);
      loft(b, [[0, 0.26, 0.15, 0.04, 0.046], [0, 0.3, 0.24, 0.046, 0.05], [0, 0.275, 0.33, 0.024, 0.028]], 7, 2, 2, O);
      for (const sg of [-1, 1]) loft(b, [[sg * 0.025, 0.33, 0.22, 0.02, 0.009], [sg * 0.04, 0.46, 0.2, 0.03, 0.01], [sg * 0.045, 0.57, 0.18, 0.009, 0.005]], 5, 2, 5, O);
      loft(b, [[0, 0.2, -0.2, 0.035, 0.035], [0, 0.22, -0.27, 0.02, 0.02]], 5, 0, 6, O);
      legs(b, 0.05, 0.13, -0.13, 0.15, 0.08, [0.024, 0.05], 0.013, 0.02, -0.05);
      hare = makeCritter(b, 6, 1, { hipF: [0.05, 0.15, 0.13], hipH: [0.05, 0.15, -0.13], neck: [0, 0.2, 0.14], headJ: [0, 0.26, 0.18], cg: [0, 0.18, 0] },
        [nt(mixc(ink.cocoa, ink.paper, 0.52)), nt(mixc(ink.cocoa, ink.paper, 0.22)), nt(mixc(ink.cocoa, ink.violet, 0.3))]);
    }
    {
      const b = new Buf(ASPEC), O = [0, 0, 0];
      loft(b, [[0, 0.215, -0.40, 0.022, 0.005], [0, 0.205, -0.2, 0.034, 0.012], [0, 0.19, -0.06, 0.05, 0.05], [0, 0.19, 0.06, 0.055, 0.06], [0, 0.21, 0.14, 0.035, 0.04]], 7, 0, 0, O);
      loft(b, [[0, 0.21, 0.12, 0.03, 0.03], [0, 0.255, 0.2, 0.024, 0.026]], 6, 1, 3, O);
      loft(b, [[0, 0.262, 0.185, 0.026, 0.028], [0, 0.268, 0.25, 0.022, 0.022], [0, 0.262, 0.34, 0.006, 0.007]], 6, 2, 3, O);
      loft(b, [[0, 0.285, 0.21, 0.01, 0.022], [0, 0.325, 0.15, 0.004, 0.012]], 4, 2, 4, O);
      [[-1, 3], [1, 7]].forEach(([sg, bone]) => {
        const X = sg * 0.03;
        loft(b, [[X, 0.17, 0, 0.016, 0.02], [X, 0.085, 0.01, 0.008, 0.009]], 5, bone, 4, [X, 0.15, 0]);
        loft(b, [[X, 0.085, 0.01, 0.008, 0.009], [X, 0.0, 0.0, 0.008, 0.022]], 5, bone + 1, 4, [X, 0.085, 0.01]);
      });
      runner = makeCritter(b, 1, 2, { hipF: [0.03, 0.15, 0], hipH: [0.03, 0.15, 0], neck: [0, 0.2, 0.12], headJ: [0, 0.25, 0.2], cg: [0, 0.18, 0] },
        [nt(mixc(ink.cocoa, ink.paper, 0.35)), nt(ink.cocoa), nt(mixc(ink.cocoa, ink.violet, 0.4))]);
    }
    await ctx.yield();

    // ---- plants and stones: one instanced ink family (light and mid ink per vertex, shadow = mid overprinted) ---
    // aR = (rib coordinate, special ink: 2 scarlet 3 cream, sway weight in metres, keyline strength or -thin radius)
    const PSPEC = { position: 3, normal: 3, aL: 3, aM: 3, aR: 4 };
    const V3 = THREE.Vector3, c3 = (c) => [c.r, c.g, c.b];
    const PLANT_VS = VG + /* glsl */`
      attribute vec3 aL, aM; attribute vec4 aR; attribute float aFar;
      varying vec3 vN; varying vec3 vW; varying vec3 vO; varying vec3 vL; varying vec3 vM; varying vec4 vR; varying float vFar;
      void main(){
        vec4 w = instanceMatrix * vec4(position, 1.);
        vec3 n = normalize(mat3(instanceMatrix) * normal);
        vec2 base = vec2(instanceMatrix[3].x, instanceMatrix[3].z);
        float g = gustAt(base), ph = base.x * .37 + base.y * .23;
        w.xz += aR.z * g * (-uShadow.xy * (.55 + .4 * sin(uTime * 1.3 + ph)) + vec2(.16, .12) * sin(uTime * 3.1 + ph * 1.7 + w.y));
        if (aR.w < 0.) w.xyz += n * max(0., distance(w.xyz, cameraPosition) * .0017 + aR.w);
        vN = n; vW = w.xyz; vO = position; vL = aL; vM = aM; vR = aR; vFar = aFar;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`;
    const PLANT_FS = WG + /* glsl */`
      uniform vec3 uScar, uFarInk, uHole;
      uniform vec3 uChar; uniform vec4 uStrike; uniform vec2 uStrikeY;
      varying vec3 vN; varying vec3 vW; varying vec3 vO; varying vec3 vL; varying vec3 vM; varying vec4 vR; varying float vFar;
      void main(){
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        float sh = shadeAll(vW.xz), nd0 = dot(n, uSun), ndl = nd0 + .2;
        // flutes: every groove is its own ink, one step darker than the rib beside it, in sun and under the cell alike
        float ribbed = step(.001, vR.x), fwr = fwidth(vR.x), cr = cos(vR.x * 6.2832);
        float gf = clamp(1.7 - fwr * 3.4, 0., 1.) * ribbed, groove = (1. - aastep(-.22, cr)) * gf;
        vec3 D = vM * uOver, DD = D * mix(vec3(1.), uOver, .6);
        vec3 c = ink3(vL, vM, D, ndl, sh);
        c = mix(mix(c, mix(c, vL, .3), gf), ink3(vM, D, DD, ndl, sh), groove);
        // areole ticks down the rib crests and a dark foot where the trunk meets the ground
        float tick = aastep(.84, cr) * aastep(.5, cos(vO.y * 20.)) * clamp(1.5 - fwr * 6., 0., 1.) * ribbed;
        c = mix(c, mix(c, uPaper, .7), tick);
        float foot = (1. - aastep(.34 + .13 * sin(vR.x * 4.83), vO.y)) * ribbed;
        c = mix(c, DD, foot * .9);
        // the cream unprinted keyline down the sunward silhouette: about 2.6 px at any distance, kept under the shadow
        float nv = dot(n, normalize(cameraPosition - vW)), sx = sqrt(max(1. - nv * nv, 0.)), fws = fwidth(sx);
        float rw = clamp(max(.085, 2.6 * fws), 0., .36);
        float rim = aastep(1. - rw, sx) * max(vR.w, 0.) * (1. - smoothstep(.34, .7, fws)) * (1. - smoothstep(60., 105., distance(cameraPosition, vW)));   // far trunks print solid: no paper line eating a six-pixel post
        c = mix(c, uPaper, min(rim, 1.) * (vR.w > 1.5 ? 1. : aastep(0., nd0)));
        c = mix(c, uScar, step(1.5, vR.y) * step(vR.y, 2.5));
        c = mix(c, uPaper, step(2.5, vR.y) * step(vR.y, 3.5));
        c = mix(c, uHole, step(3.5, vR.y));
        // the bolt on the towering saguaro: while it holds, what stands within 7 m of it prints bare paper with dark
        // grooves, lit by the stroke; afterwards the crown stays charred down to where the stroke ran out
        float gz = 1. - step(7., distance(vW.xz, uStrike.xy));
        c = mix(c, mix(uPaper, uHole * 1.6, max(groove, foot) * .9), uStrike.z * gz * .95 * (1. - step(1.5, vR.y)));
        float ch = gz * uStrike.w * aastep(uStrikeY.x - uStrikeY.y * uStrike.w + .7 * sin(vR.x * 2.1 + vO.y * .8), vW.y);
        c = mix(c, mix(mix(uChar, uChar * uOver, groove), uPaper, tick * .6), ch * .94);
        c = mix(mottle(c, vO), uFarInk, vFar);
        gl_FragColor = vec4(c, 1.);
      }`;
    const plantMat = mat(PLANT_VS, PLANT_FS, { uScar: nt(ink.scarlet), uFarInk: farInk, uHole: nt(mixc(ink.cocoa, ink.violet, 0.5).multiplyScalar(0.42)) }, { side: THREE.DoubleSide });
    // (the stroke on the towering saguaro: its place, how strongly it lights what stands by it, how far the char has run; the crown's height and the char's reach)
    const strikeU = { value: new THREE.Vector4(tower.x, tower.z, 0, 0) }, strikeYU = { value: new THREE.Vector2(1000, 6.5) };
    plantMat.uniforms.uStrike = strikeU; plantMat.uniforms.uStrikeY = strikeYU; plantMat.uniforms.uChar = { value: nt(mixc(ink.cocoa, ink.violet, 0.3)) };
    const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new V3();
    const stats = { tris: 0 };
    // list rows: [x, y, z, yaw, scale, far, scaleY?, tilt?]
    const plantMesh = (buf, list) => {
      if (!list.length) return null;
      const g = buf.isBufferGeometry ? buf : buf.geo(), m = new THREE.InstancedMesh(g, plantMat, list.length), far = new Float32Array(list.length);
      list.forEach((r, i) => {
        _e.set(r[7] || 0, r[3], 0, 'YXZ'); _q.setFromEuler(_e); _s.set(r[4], r[4] * (r[6] || 1), r[4]);
        _m4.compose(_a.set(r[0], r[1], r[2]), _q, _s); m.setMatrixAt(i, _m4); far[i] = r[5] || 0;
      });
      g.setAttribute('aFar', new THREE.InstancedBufferAttribute(far, 1));
      m.frustumCulled = false; scene.add(m); stats.tris += (g.index.count / 3) * list.length; return m;
    };
    const ptube = (b, P, rad, seg, ribs, Lc, Mc, o = {}) => {
      const n = P.length, ring = [], Lv = c3(Lc), Mv = c3(Mc), tg = new V3(), side = new V3();
      let up = new V3(0.13, 0.2, 1).normalize();
      for (let i = 0; i < n; i++) {
        tg.subVectors(P[Math.min(n - 1, i + 1)], P[Math.max(0, i - 1)]).normalize();
        side.crossVectors(tg, up); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize();
        up = new V3().crossVectors(side, tg).normalize();
        ring.push(b.n);
        const sw = lerp(o.sway0 ?? 0, o.sway1 ?? 0, i / (n - 1));
        for (let k = 0; k <= seg; k++) {
          const th = (k / seg) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th), r = rad[i];
          const nx = side.x * c + up.x * s, ny = side.y * c + up.y * s, nzz = side.z * c + up.z * s;
          b.v({ position: [P[i].x + nx * r, P[i].y + ny * r, P[i].z + nzz * r], normal: [nx, ny, nzz], aL: Lv, aM: Mv, aR: [ribs ? (k / seg) * ribs + 0.01 : 0, o.ink ?? 0, sw, o.key ?? 0] });
        }
      }
      for (let i = 0; i < n - 1; i++) for (let k = 0; k < seg; k++) { const a = ring[i] + k, c = ring[i + 1] + k; b.quad(a, c, c + 1, a + 1); }
      if (o.cap !== false) {
        const i = n - 1; tg.subVectors(P[i], P[i - 1]).normalize();
        const c = b.v({ position: [P[i].x + tg.x * rad[i] * 0.7, P[i].y + tg.y * rad[i] * 0.7, P[i].z + tg.z * rad[i] * 0.7], normal: [tg.x, tg.y, tg.z], aL: Lv, aM: Mv, aR: [0, o.capInk ?? o.ink ?? 0, o.sway1 ?? 0, o.key ?? 0] });
        for (let k = 0; k < seg; k++) b.tri(ring[i] + k, c, ring[i] + k + 1);
      }
    };
    // ellipsoid (hemi: upper half only); lump > 0 roughens it into a boulder
    const pell = (b, c, r, seg, rings, Lc, Mc, o = {}) => {
      const Lv = c3(Lc), Mv = c3(Mc), base = b.n, cy = Math.cos(o.yaw || 0), sy = Math.sin(o.yaw || 0), top = o.hemi ? Math.PI / 2 : Math.PI;
      for (let j = 0; j <= rings; j++) for (let k = 0; k <= seg; k++) {
        const la = (j / rings) * top, lo = (k / seg) * Math.PI * 2;
        let x = Math.sin(la) * Math.cos(lo), y = Math.cos(la), z = Math.sin(la) * Math.sin(lo);
        const lump = o.lump ? 1 + o.lump * noise.n3(x * 1.7 + c[0], y * 1.7 + c[1] * 3.1, z * 1.7 + c[2]) : 1;
        const px = x * r[0] * lump, pz = z * r[2] * lump, nx = x / r[0], ny = y / r[1], nzz = z / r[2], nl = Math.hypot(nx, ny, nzz) || 1;
        b.v({ position: [c[0] + px * cy + pz * sy, c[1] + y * r[1] * lump, c[2] - px * sy + pz * cy], normal: [(nx * cy + nzz * sy) / nl, ny / nl, (-nx * sy + nzz * cy) / nl], aL: Lv, aM: Mv,
          aR: [0, o.ink ?? 0, (o.sway ?? 0) * (o.swayTop ? Math.cos(la * 0.5) : 1), o.key ?? 0] });
      }
      for (let j = 0; j < rings; j++) for (let k = 0; k < seg; k++) { const a = base + j * (seg + 1) + k, d = a + seg + 1; b.quad(a, a + 1, d + 1, d); }
    };
    // the light ink of a saguaro, per band: near ones pale enough for the flute stripes to read, the plain middle band a
    // full mid-green so that front-lit trunks never print as mint ghosts on the paper sky; the two giants are older and darker
    const GL_ = nt(mixc(ink.green, ink.paper, 0.15)), GLmid = nt(mixc(ink.green, ink.paper, 0.065)), GM_ = nt(ink.green);   // (inks mix in linear light: a little paper goes a long way)
    const GLold = nt(mixc(ink.green, ink.paper, 0.035)), GMold = nt(mixc(ink.green, mixc(ink.cocoa, ink.violet, 0.5), 0.35));
    const fruitInk = season === 'may' ? 3 : 2;
    // saguaro: fluted trunk, upturned arms, fruit (or blossom) crowns. arms: [height frac, azimuth, reach, top frac]
    // lod 1: plain (to 150 m), 0: near, -1: a hand-set specimen (round, long elbows, a Gila woodpecker's hole on its +x side)
    const sagBuf = (h, r, arms, lod, GLc = lod > 0 ? GLmid : GL_, GMc = GM_, nRib = 13) => {
      const hi = lod < 0, lo = lod > 0, b = new Buf(PSPEC), seg = lo ? 4 : hi ? 14 : 8, aseg = lo ? 3 : hi ? 9 : 6, nR = lo ? 2 : hi ? 9 : 5, P = [], rad = [], tips = [[0, h, 0, r]];
      for (let i = 0; i <= nR; i++) { const u = i / nR; P.push(new V3(0, h * u - (i ? 0 : 0.3), 0)); rad.push(r * (0.84 + 0.2 * Math.sin(Math.PI * (0.12 + 0.72 * u))) * (i === nR ? 0.8 : 1) * (hi ? 1 + 0.025 * Math.sin(u * 19 + h) : 1)); }
      if (hi) { P.push(new V3(0, h + r * 0.42, 0)); rad.push(r * 0.5); }
      ptube(b, P, rad, seg, lo ? 9 : nRib, GLc, GMc, { key: 1, capInk: lo ? fruitInk : 0 });
      for (const [f, az, out, top] of arms) {
        const ar = r * 0.74, ca = Math.cos(az), sa = Math.sin(az), y0 = f * h, y1 = Math.max(top * h, y0 + out + 0.8), Q = [], qr = [];
        const el = lo ? [0, 1] : hi ? [0, 0.2, 0.4, 0.6, 0.8, 1] : [0, 0.35, 0.7, 1];
        for (const e of el) { const a = (e * Math.PI) / 2, d = r * 0.5 + out * Math.sin(a); Q.push(new V3(ca * d, y0 - 0.12 + out * (1 - Math.cos(a)), sa * d)); qr.push(ar * (e === 0 ? 1.08 : 1)); }
        const d1 = r * 0.5 + out, nv = lo ? 1 : hi ? 3 : 2;
        for (let i = 1; i <= nv; i++) { Q.push(new V3(ca * d1, y0 - 0.12 + out + ((y1 - y0 - out) * i) / nv, sa * d1)); qr.push(ar * (i === nv ? 0.82 : 1)); }
        ptube(b, Q, qr, aseg, lo ? 7 : 10, GLc, GMc, { key: 1, capInk: lo ? fruitInk : 0 });
        tips.push([ca * d1, y1 - 0.12, sa * d1, ar, y0 + out]);
      }
      if (!lo) for (const t of tips) {
        const nf = season === 'august' ? 2 : hi ? 6 : 4;
        for (let k = 0; k < nf + 1; k++) { const a = k * (6.283 / (nf + 1)) + t[0], rr = t[3] * 0.62; pell(b, [t[0] + Math.cos(a) * rr, t[1] + t[3] * 0.42, t[2] + Math.sin(a) * rr], [0.11, 0.14, 0.11], 3, 2, GL_, GM_, { ink: k === nf ? 3 : fruitInk }); }
      }
      if (hi) { // the nest hole: a dark oval in a cream ring, set into the trunk
        const hy = h * 0.57, hr = r * 1.035;
        pell(b, [hr * 0.955, hy, 0], [0.17, 0.215, 0.03], 8, 3, GL_, GM_, { ink: 3, yaw: Math.PI / 2 });
        pell(b, [hr * 0.985, hy, 0], [0.115, 0.155, 0.03], 8, 3, GL_, GM_, { ink: 4, yaw: Math.PI / 2 });
      }
      return { buf: b, h, r, tips };
    };
    const sr = rng.fork('saguaro');
    const armSet = (n) => { const a = [], a0 = sr.range(0, 6.28); for (let i = 0; i < n; i++) a.push([sr.range(0.28, 0.58), a0 + (i * 6.283) / n + sr.range(-0.4, 0.4), sr.range(0.85, 1.35), sr.range(0.62, 0.96)]); return a; };
    const SV = [[4.6, 0.3, 0], [7.6, 0.36, 0], [8.6, 0.38, 1], [9.8, 0.4, 2], [11.2, 0.42, 3], [12.6, 0.44, 5], [13.4, 0.46, 7]].map(([h, r, n]) => {
      const arms = armSet(n); return { near: sagBuf(h, r, arms, 0), mid: sagBuf(h, r, arms, 1), list: [[], []], h, r };
    });
    await ctx.yield();
    // the hand-set specimens (their own stream of chance, so the forest stays as it was): four for the gallop, the
    // hawks' seven-armed one with a low arm reaching toward the path, and the giant that stands either side of the arch
    const hs = core.makeRng(core.hashSeed('specimens:' + ctx.seed));
    const far3 = (n, f0, f1) => { const a = []; for (let i = 0; i < n; i++) a.push([hs.range(f0, f1), 1.75 + (2.8 * (i + 0.5)) / n + hs.range(-0.18, 0.18), hs.range(0.95, 1.35), hs.range(0.66, 0.96)]); return a; };
    const SPEC = [
      [10.4, 0.43, [[0.42, 1.5, 1.25, 0.86], [0.5, 3.4, 1.1, 0.93], [0.36, 4.9, 1.0, 0.7]]],
      [8.4, 0.4, [[0.5, 4.6, 1.1, 0.9], [0.63, 2.0, 0.7, 0]]],
      [12.2, 0.45, [[0.33, 1.6, 1.3, 0.8], [0.44, 2.9, 1.2, 0.95], [0.52, 4.2, 1.0, 0.84], [0.4, 5.1, 1.15, 0.66]]],
      [6.6, 0.37, []],
      [12.8, 0.46, [[0.2, 0, 2.5, 0.4], ...far3(6, 0.46, 0.64)]],
      [15, 0.52, far3(5, 0.3, 0.55)],
    ].map(([h, r, arms], k) => { const near = k === 5 ? sagBuf(h, r, arms, -1, GLold, GMold) : sagBuf(h, r, arms, -1); return { near, mid: near, list: [[], []], h, r }; });
    await ctx.yield();
    // the towering saguaro's shape (six arms; its +x side carries the arm the bolt takes, a separate piece, so no other
    // arm stands there), on a stream of its own: the bearing of that arm (any, by seed) and the side it comes down on
    // (the arm comes down outward from where it hung, swung 20 to 50 degrees to one side or the other; a fall that
    // would lie within the route's clear corridor or across an animal's track is drawn again: a test of the ground)
    const tw = core.makeRng(core.hashSeed('towering:' + ctx.seed));
    let armAz = 0, armFall = 0;
    for (let k = 0; k < 24; k++) {
      armAz = tw.range(0, 6.2832); armFall = armAz + tw.sign() * tw.range(0.35, 0.87);
      let ok = true;
      for (let r = 1.6; r < 11 && ok; r += 0.9) { const x = tower.x + Math.sin(armFall) * r, z = tower.z - Math.cos(armFall) * r; ok = path.nearestXZ(x, z).dist > 6.7 && washOut(x, z) > 2 && !nearTrack(x, z, 1.4) && !nearBend(x, z, 1.4); }
      if (ok) break;
    }
    // metres from the line the fallen arm lies along
    const armLie = (x, z) => { const bx = Math.sin(armFall), bz = -Math.cos(armFall), t = clamp((x - tower.x) * bx + (z - tower.z) * bz, 1, 10.8); return Math.hypot(x - tower.x - bx * t, z - tower.z - bz * t); };
    const TOWER = { near: sagBuf(TOWER_H, TOWER_R, [[0.3, 1.25, 2.2, 0.6], [0.38, 2.3, 1.9, 0.8], [0.46, 3.2, 2.1, 0.93], [0.34, 4.1, 2.4, 0.72], [0.52, 5.0, 1.7, 0.88], [0.6, 2.75, 1.4, 0.97]], -1, GL_, GM_, 19), list: [[], []], h: TOWER_H, r: TOWER_R };
    await ctx.yield();
    // THE OLD SAGUAROS of the middle of the flight (the brief's tall, armed kinds, 11 to 14 m, three to seven arms): three
    // shapes made as the hand-set specimens are, their arms dealt from the old ones' own stream
    const os = core.makeRng(core.hashSeed('old-saguaros:' + ctx.seed));
    const oldArms = (n) => { const a = [], a0 = os.range(0, 6.2832); for (let i = 0; i < n; i++) a.push([os.range(0.3, 0.56), a0 + (i * 6.2832) / n + os.range(-0.35, 0.35), os.range(0.9, 1.35), os.range(0.66, 0.96)]); return a; };
    const OLD = [];
    for (const [h, r, n0, n1] of [[11.4, 0.43, 3, 4], [12.5, 0.45, 4, 6], [13.4, 0.47, 5, 7]]) { const near = sagBuf(h, r, oldArms(os.int(n0, n1)), -1); OLD.push({ near, mid: near, list: [[], []], h, r }); await ctx.yield(); }
    // one saguaro standing: instance row, shadow bars for the trunk and every arm
    const perches = [];                                          // crowns near the path: where doves feed
    const standSaguaro = (S, x, z, yaw, sc, far, lod) => {
      const y = heightAt(x, z);
      S.list[lod].push([x, y, z, yaw, sc, far]);
      if (far > 0.3) return y;
      bar(x, z, S.h * sc, S.r * sc * 0.95, y);
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      S.near.tips.forEach((t, i) => {
        const wx = x + (t[0] * cy + t[2] * sy) * sc, wz = z + (-t[0] * sy + t[2] * cy) * sc;
        if (i) { bars.push(wx + shDX * t[4] * sc * shK, wz + shDZ * t[4] * sc * shK, Math.max((t[1] - t[4]) * sc * shK, 0.5), t[3] * sc, y, 0); }
        if (!lod) perches.push([wx, y + (t[1] + 0.25) * sc, wz, x, z]);
      });
      return y;
    };

    // ---- the saguaro forest: detailed within 34 m, plain to 170 m, flat cards beyond, each band paler and bluer --
    const farBand = (d) => (d < 90 ? 0 : d < 160 ? 0.1 : d < 230 ? 0.24 : d < 350 ? 0.4 : d < 600 ? 0.55 : 0.68);
    const cards = [];
    // every hand-set one turns its +x side (the nest hole; on the hawks' one the perch arm) toward where we come from
    const holes = [];
    const hawkSag = { x: hawkSpec.x, z: hawkSpec.z, y: 0, tip: null };
    for (const q of spec) {
      const back = q.kind === 4 ? 0 : q.kind === 5 ? 26 : 9, dx = -q.tz * -q.lat - q.tx * back, dz = q.tx * -q.lat - q.tz * back, yaw = Math.atan2(-dz, dx);
      const S = SPEC[q.kind], sc = q.kind < 4 ? 0.94 + 0.12 * ((q.s * 0.137) % 1) : 1, y = standSaguaro(S, q.x, q.z, yaw, sc, 0, 0), dl = Math.hypot(dx, dz) || 1;
      holes.push({ x: q.x + (dx / dl) * (S.r * 1.07 * sc + 0.1), y: y + S.h * 0.57 * sc - 0.3, z: q.z + (dz / dl) * (S.r * 1.07 * sc + 0.1), yaw: Math.atan2(-dx, -dz), near: q.kind < 4 });
      if (q.kind === 4) { const t = S.near.tips[1], cy = Math.cos(yaw), sy = Math.sin(yaw); hawkSag.y = y; hawkSag.tip = [q.x + t[0] * cy + t[2] * sy, y + t[1] + 0.3, q.z - t[0] * sy + t[2] * cy]; }
    }
    const giants = spec.filter((q) => q.kind === 5).map((q) => [q.x, q.z]);
    const strikeSag = { x: 0, z: 0, y: 0, top: 0, s: 0.8 * L + 46 };    // the one the rare bolt finds, ahead and to the right at u 0.8
    { pathFrame(strikeSag.s, fr); strikeSag.x = fr.x - fr.tz * 21; strikeSag.z = fr.z + fr.tx * 21; strikeSag.y = heightAt(strikeSag.x, strikeSag.z); strikeSag.top = strikeSag.y + SV[4].h * 1.15; standSaguaro(SV[4], strikeSag.x, strikeSag.z, 1.1, 1.15, 0, 0); }
    // the towering saguaro stands, as live's near saguaros stand: its crowns are kept apart from the perches above
    // (tower.perches), so that list stays as it was and every dove keeps the crown it is dealt
    tower.dx = Math.sin(armAz); tower.dz = -Math.cos(armAz); tower.yaw = Math.atan2(-tower.dz, tower.dx);
    tower.dxB = Math.sin(armFall); tower.dzB = -Math.cos(armFall); tower.yawB = Math.atan2(-tower.dzB, tower.dxB);
    { const n0 = perches.length; tower.y = standSaguaro(TOWER, tower.x, tower.z, tower.yaw, 1, 0, 0); tower.perches = perches.splice(n0); }
    tower.top = tower.y + TOWER_H; tower.armY = tower.y + 0.44 * TOWER_H; strikeYU.value.x = tower.top + 0.6;
    // a forest saguaro that the towering one's ground does not carry (taller than half its height inside its clearing,
    // at its very foot, or on a stretch of track bent round it) is dealt exactly as it was (its draws made, its crowns
    // counted among the perches and marked) and then taken off the land again
    const unstand = (S, x, z, yaw, sc) => { const nb = bars.length, np = perches.length; standSaguaro(S, x, z, yaw, sc, 0, 0); S.list[0].pop(); bars.length = nb; for (let k = np; k < perches.length; k++) perches[k][5] = 1; };
    const towerBars = (h, x, z, d) => (h > 0.5 * TOWER_H && inClearing(x, z)) || (x - tower.x) ** 2 + (z - tower.z) ** 2 < 36 || armLie(x, z) < 2 || (d < 30 && nearBend(x, z, 2.4));
    // nothing tall may stand behind the hawks as we come up on them: they are to be seen dark against the paper sky
    const hawkEyes = [0.03, 0.04, 0.05, 0.058].map((uu) => { pathFrame(uu * L, fr); const dx = hawkSag.tip[0] - fr.x, dz = hawkSag.tip[2] - fr.z, l = Math.hypot(dx, dz) || 1; return [fr.x, fr.z, dx / l, dz / l, l]; });
    const hidesHawks = (x, z) => { for (const e of hawkEyes) { const vx = x - e[0], vz = z - e[1], al = vx * e[2] + vz * e[3]; if (al > e[4] + 3 && al < 150 && Math.abs(vx * e[3] - vz * e[2]) < 2 + al * 0.13) return true; } return false; };
    const nearSpec = (x, z, r) => { for (const q of spec) if ((x - q.x) ** 2 + (z - q.z) ** 2 < r * r) return true; return false; };
    {
      const Gc = 14.5; let row = 0;
      for (let gx = -1060; gx < 900; gx += Gc) {
        for (let gz = -1600; gz < 900; gz += Gc) {
          const x = gx + sr() * Gc * 0.82, z = gz + sr() * Gc * 0.82, vv = sr(), yaw = sr() * 6.283, sc = 0.84 + sr() * 0.32, keep = sr();
          const pn = path.nearestXZ(x, z), d = pn.dist;
          if (d > 900 || d < 8.6 || x * x + z * z < 260) continue;
          if (washOut(x, z) < 3 || saddleQ(x, z) < 14) continue;
          if (nearSpec(x, z, 9) || (d < 170 && hidesHawks(x, z))) continue;
          if (Math.hypot(x - strikeSag.x, z - strikeSag.z) < 10) continue;
          const v = vv < 0.2 ? 0 : vv < 0.36 ? 1 : vv < 0.52 ? 2 : vv < 0.72 ? 3 : vv < 0.87 ? 4 : vv < 0.96 ? 5 : 6;
          if (towerBars(SV[v].h * sc, x, z, d)) { if (d < 30 && !nearTrack(x, z, 2.4)) unstand(SV[v], x, z, yaw, sc); continue; }
          if (d < 30) { if (!nearTrack(x, z, 2.4)) standSaguaro(SV[v], x, z, yaw, sc, 0, 0); }
          else if (d < 110) standSaguaro(SV[v], x, z, yaw, sc, farBand(d), 1);
          else if (keep < (d < 260 ? 0.6 : d < 400 ? 0.27 : 0.075) * detail) { path.pointAt(pn.u, _c); cards.push([x, apron(x, z), z, Math.atan2(_c.x - x, _c.z - z), (SV[v].h * sc) / 10, farBand(d)]); }
        }
        if (++row % 24 === 0) await ctx.yield();
      }
      for (const S of SV) { plantMesh(S.near.buf, S.list[0]); plantMesh(S.mid.buf, S.list[1]); }
      for (const S of SPEC) plantMesh(S.near.buf, S.list[0]);
      const b = new Buf(PSPEC), q = (x0, y0, x1, y1) => { const i = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map((p) => b.v({ position: [p[0], p[1], 0], normal: [0, 0, 1], aL: c3(GM_), aM: c3(GM_), aR: [0, 0, 0, 0] })); b.quad(i[0], i[1], i[2], i[3]); };
      q(-0.5, 0, 0.5, 10); q(-2.1, 4.2, -0.5, 5); q(-2.1, 5, -1.35, 8.3);
      plantMesh(b, cards);
    }
    await ctx.yield();

    // ---- ocotillo, cholla, prickly pear, brush, palo verde and ironwood, granite boulders -----------------------
    const pr = rng.fork('plants');
    const solidA = bars.length;                                 // (from here to solidB the bars are the ocotillo's, the cholla's and the prickly pear's own feet)
    const alongPath = (latMin, latMax, pw = 1) => { const s = pr.range(-20, L + 40), lat = pr.sign() * (latMin + (latMax - latMin) * Math.pow(pr(), pw)); pathFrame(s, fr); return [fr.x - fr.tz * lat, fr.z + fr.tx * lat, Math.abs(lat)]; };
    const okSpot = (x, z, clear, trackR) => path.nearestXZ(x, z).dist > clear && washOut(x, z) > 1.2 && x * x + z * z > 170 && !(trackR && nearTrack(x, z, trackR));
    {
      const august = season === 'august';
      const OL = nt(august ? mixc(ink.green, ink.gold, 0.4) : mixc(ink.violet, ink.paper, 0.55)), OM = nt(august ? ink.green : mixc(ink.cocoa, ink.violet, 0.5));
      for (let v = 0; v < 2; v++) {
        const b = new Buf(PSPEC), nW = 7 + v * 2, list = [];
        for (let w = 0; w < nW; w++) {
          const az = (w / nW) * 6.283 + pr.range(-0.3, 0.3), lean = pr.range(0.12, 0.5), Lw = pr.range(3.6, 5.8), P = [], rad = [];
          for (let i = 0; i <= 2; i++) { const u = i / 2, o = Math.sin(lean) * Lw * (u + 0.35 * u * u) * 0.75; P.push(new V3(Math.cos(az) * o, Math.cos(lean) * Lw * u, Math.sin(az) * o)); rad.push(0.05 - 0.022 * u); }
          ptube(b, P, rad, 3, 0, OL, OM, { key: -0.05, sway0: 0, sway1: 0.6, cap: false });
          const d = new V3().subVectors(P[2], P[1]).normalize();
          ptube(b, [P[2].clone(), P[2].clone().addScaledVector(d, 0.5)], [0.06, 0.035], 3, 0, OL, OM, { key: -0.06, sway0: 0.6, sway1: 0.66, ink: pr.chance(august ? 0.35 : 0.7) ? 2 : 0 });
        }
        const n = Math.round(40 * (0.6 + 0.4 * density));
        for (let i = 0; i < n * 3 && list.length < n; i++) { const p = alongPath(8, 46, 1.4); if (!okSpot(p[0], p[1], 8, 2)) continue; const y = heightAt(p[0], p[1]), sc = pr.range(0.8, 1.15); list.push([p[0], y, p[1], pr() * 6.28, sc, 0]); bar(p[0], p[1], 4.4 * sc, 0.1, y); }
        plantMesh(b, list);
      }
    }
    {
      const b = new Buf(PSPEC), CL = nt(mixc(ink.paper, ink.gold, 0.4)), CM = nt(mixc(ink.green, ink.gold, 0.5)), TK = nt(mixc(ink.cocoa, ink.green, 0.3)), list = [];
      ptube(b, [new V3(0, -0.1, 0), new V3(0.03, 0.5, 0), new V3(0, 0.95, 0.02)], [0.085, 0.07, 0.06], 4, 0, TK, TK, { cap: false });
      // teddy-bear cholla: stubby straw joints that leave the trunk, elbow and stand up; a leader joint; dropped joints
      for (let j = 0; j < 5; j++) {
        const a = j * 2.5 + 0.4, y0 = 0.44 + 0.1 * (j % 4), o = 0.3 + 0.06 * (j % 3), h = 0.4 + 0.09 * ((j * 2) % 3), cx = Math.cos(a), sz = Math.sin(a);
        ptube(b, [new V3(cx * 0.03, y0, sz * 0.03), new V3(cx * o * 0.8, y0 + h * 0.28, sz * o * 0.8), new V3(cx * o, y0 + h, sz * o)], [0.07, 0.1, 0.085], 4, 0, CL, CM, { key: 1 });
      }
      pell(b, [0, 1.1, 0.02], [0.105, 0.24, 0.105], 5, 3, CL, CM, { key: 1 });
      for (let j = 0; j < 2; j++) pell(b, [Math.cos(j * 2.3 + 1) * (0.5 + 0.12 * j), 0.07, Math.sin(j * 2.3 + 1) * (0.5 + 0.12 * j)], [0.08, 0.1, 0.13], 4, 2, CL, CM);
      const n = Math.round(84 * density);
      for (let i = 0; i < n * 3 && list.length < n; i++) { const p = alongPath(4.4, 34, 1.5); if (!okSpot(p[0], p[1], 4.4, 1.3)) continue; const y = heightAt(p[0], p[1]), sc = pr.range(0.85, 1.25); list.push([p[0], y, p[1], pr() * 6.28, sc, 0]); bar(p[0], p[1], 0.85 * sc, 0.42 * sc, y, 1); }
      plantMesh(b, list);
    }
    {
      const b = new Buf(PSPEC), PL = nt(mixc(mixc(ink.green, ink.turq, 0.4), ink.paper, 0.3)), PM = nt(mixc(ink.green, ink.turq, 0.3)), list = [];
      [[0, 0.22, 0, 0.3], [0.26, 0.46, 0.04, 1.2], [-0.24, 0.5, -0.03, 2.3], [0.1, 0.78, 0.02, 0.6], [-0.42, 0.24, 0.1, 1.8]].forEach(([x, y, z, yaw], i) => {
        pell(b, [x, y, z], [0.2, 0.27, 0.045], 7, 2, PL, PM, { yaw, key: 1 });
        if (season !== 'may' && i % 2) pell(b, [x + 0.08, y + 0.28, z], [0.045, 0.06, 0.045], 4, 2, PL, PM, { ink: 2 });
      });
      const n = Math.round(46 * density);
      for (let i = 0; i < n * 3 && list.length < n; i++) { const p = alongPath(4.6, 22, 1.3); if (!okSpot(p[0], p[1], 4.6, 1)) continue; const y = heightAt(p[0], p[1]), sc = pr.range(0.9, 1.5); list.push([p[0], y, p[1], pr() * 6.28, sc, 0]); bar(p[0], p[1], 0.5 * sc, 0.5 * sc, y, 1); }
      plantMesh(b, list);
    }
    const solidB = bars.length;
    await ctx.yield();
    { // ground cover as printed scallop shapes: creosote, bursage, brittlebush, stones. One upright card each, turned to
      // the viewer; the shape, its light crescent, its shadow crescent and its cream sunward keyline are cut in the shader.
      const N = Math.round(6000 * (0.75 + 0.25 * density) * detail), NS = Math.round(460 * detail), NX = Math.round(900 * detail), NL = Math.round(2700 * detail), NE = Math.round(650 * detail);
      const NCAP = N + NS + NX + NL + NE + Math.round(1300 * detail) + 8, c0 = new Float32Array(NCAP * 4), c1 = new Float32Array(NCAP * 4);
      let n = 0;
      const cobble = (lx, lz, size, clear = 1.3) => {
        const w = toW(lx, lz);
        if (path.nearestXZ(w[0], w[1]).dist < clear + size || W.bankDist(lx, lz) < 1) return;
        c0.set([w[0], -0.02, w[1], size], n * 4); c1.set([3, pr(), 0, 0], n * 4); n++;
        bar(w[0] - shDX * size * 0.3, w[1] - shDZ * size * 0.3, size * 0.22, size * 0.6, 0, 1);
      };
      for (let i = 0; i < NS; i++) { // cobbles and drift on the wash bed (the flood rolls over them)
        const lz = pr.range(-75, 125), lx = W.centerX(lz) + pr.range(-13.3, 13.3);
        cobble(lx, lz, pr.range(0.14, 0.5) * (pr.chance(0.1) ? 1.8 : 1));
      }
      const xr = core.makeRng(core.hashSeed('near-cover:' + ctx.seed));                          // everything added under the camera draws from its own stream
      for (let i = 0; i < NX; i++) { // three times the cobbles where we cross: strewn in drifts along our line through the bed
        pathFrame(xr.range(sWash - 4, sOutW + 2), fr); const lat = xr.sign() * (1.4 + 11 * Math.pow(xr(), 1.5)), l = toL(fr.x - fr.tz * lat, fr.z + fr.tx * lat);
        if (noise.n2(l[0] * 0.09, l[1] * 0.045) < -0.25) continue;
        cobble(l[0], l[1], xr.range(0.1, 0.42) * (xr.chance(0.08) ? 1.9 : 1), 1.1);
      }
      const nBed = n;
      const coverAt = (x, z, type, size, far) => {
        const y = heightAt(x, z), hw = size * [0.3, 0.62, 0.5, 0.6][type];
        c0.set([x, y - 0.03, z, size], n * 4); c1.set([type, xr(), far, 0], n * 4); n++;
        bar(x - shDX * hw * 0.5, z - shDZ * hw * 0.5, size * [0.75, 0.3, 0.42, 0.22][type], hw, y, 1);
      };
      for (let i = 0; i < NL; i++) { // the lane itself: pebbles, low bursage and brittlebush right under the eye, so no bare runway
        pathFrame(xr.range(4, L + 30), fr); const lat = xr.sign() * 4.6 * Math.pow(xr(), 0.8), x = fr.x - fr.tz * lat, z = fr.z + fr.tx * lat, tr = xr();
        if (washOut(x, z) < 1.2) continue;
        if (tr < 0.5) coverAt(x, z, 3, xr.range(0.1, 0.3), 0); else if (tr < 0.82) coverAt(x, z, 1, xr.range(0.2, 0.42), 0); else coverAt(x, z, 2, xr.range(0.18, 0.34), 0);
      }
      for (let i = 0; i < NE; i++) { // and thicker brush down the last straight to the arch
        pathFrame(xr.range(L - 175, L + 26), fr); const lat = xr.sign() * (1.8 + 12 * Math.pow(xr(), 1.2)), x = fr.x - fr.tz * lat, z = fr.z + fr.tx * lat, tr = xr();
        const type = tr < 0.26 ? 0 : tr < 0.6 ? 1 : tr < 0.8 ? 2 : 3, size = type === 0 ? xr.range(0.7, 1.2) : type === 1 ? xr.range(0.4, 0.75) : type === 2 ? xr.range(0.45, 0.8) : xr.range(0.2, 0.55);
        if (washOut(x, z) < 1.2 || (type === 0 && (Math.abs(lat) < 3.2 || nearTrack(x, z, 0.8))) || nearSpec(x, z, 1.6)) continue;
        coverAt(x, z, type, size, 0);
      }
      const NT = Math.round(1300 * detail);
      for (let i = 0; i < NT; i++) { // and under the eye itself on the last straight: low bursage, brittlebush and stones with their shadow ellipses
        pathFrame(xr.range(L - 188, L + 12), fr); const lat = xr.sign() * (0.25 + 2.5 * Math.pow(xr(), 1.5)), x = fr.x - fr.tz * lat, z = fr.z + fr.tx * lat, tr = xr(), sz = xr(), k = 0.55 + 0.45 * Math.min(1, Math.abs(lat) / 1.8);
        const type = tr < 0.28 ? 1 : tr < 0.54 ? 2 : 3;
        if (type < 3 && nearTrack(x, z, 0.75)) continue;
        coverAt(x, z, type, (type === 1 ? 0.4 + 0.24 * sz : type === 2 ? 0.38 + 0.24 * sz : 0.26 + 0.3 * sz) * k, 0);
      }
      const nNear = n - nBed;
      for (let i = 0; i < N * 2 && n < N + nBed + nNear; i++) {
        if (i % 500 === 499) await ctx.yield();
        const nearB = pr() < 0.7, p = nearB ? alongPath(1.7, 11, 1.25) : alongPath(11, 78, 1.3), tr = pr(), type = tr < 0.3 ? 0 : tr < 0.6 ? 1 : tr < 0.78 ? 2 : 3;
        const size = type === 0 ? pr.range(0.8, 1.45) : type === 1 ? pr.range(0.45, 0.8) : type === 2 ? pr.range(0.5, 0.85) : pr.range(0.22, 0.6), sd = pr();
        if (!okSpot(p[0], p[1], type === 0 ? 3.1 : 1.6, type === 0 ? 0.8 : 0)) continue;
        const y = heightAt(p[0], p[1]);
        c0.set([p[0], y - 0.03, p[1], size], n * 4); c1.set([type, sd, p[2] > 60 ? 0.12 : 0, 0], n * 4); n++;
        const hw = size * [0.3, 0.62, 0.5, 0.6][type];
        if (p[2] < 40) bar(p[0] - shDX * hw * 0.5, p[1] - shDZ * hw * 0.5, size * [0.75, 0.3, 0.42, 0.22][type], hw, y, 1);
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aC0', new THREE.InstancedBufferAttribute(c0, 4)); g.setAttribute('aC1', new THREE.InstancedBufferAttribute(c1, 4)); g.instanceCount = n;
      const cols = (a) => a.map((c) => nt(c));
      add(g, mat(VG + /* glsl */`
        attribute vec4 aC0, aC1; varying vec2 vQ; varying vec3 vT; varying vec2 vS; varying vec3 vW;
        void main(){
          float type = aC1.x;
          vec2 dims = type < .5 ? vec2(.62, 1.06) : type < 1.5 ? vec2(1.3, .62) : type < 2.5 ? vec2(1.0, 1.0) : vec2(1.15, .56);
          vec3 r = normalize(vec3(viewMatrix[0][0], 0., viewMatrix[2][0]) + vec3(1e-5, 0., 0.));
          float g = gustAt(aC0.xz), ph = aC1.y * 40.;
          float sway = type > 2.5 ? 0. : position.y * position.y * ((.035 + .05 * g) * sin(uTime * 2.3 + ph) + .02 * sin(uTime * 5.1 + ph * 1.7));
          vec3 w = aC0.xyz + (r * (position.x * dims.x + sway) + vec3(0., position.y * dims.y, 0.)) * aC0.w;
          w.xz -= uShadow.xy * g * position.y * position.y * (type > 2.5 ? 0. : .1) * aC0.w;
          vQ = vec2(position.x * dims.x * (aC1.y > .5 ? 1. : -1.), position.y * dims.y); vT = vec3(type, aC1.y, aC1.z);
          vS = normalize(vec2(dot(uSun, r) * (aC1.y > .5 ? 1. : -1.), uSun.y) + vec2(0., 1e-4)); vW = aC0.xyz;
          gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
        }`, WG + /* glsl */`
        uniform vec3 uCL[4]; uniform vec3 uCM[4]; uniform vec3 uGold, uFarInk; uniform float uFlowers;
        varying vec2 vQ; varying vec3 vT; varying vec2 vS; varying vec3 vW;
        float ell(vec2 q, vec2 c, vec2 r, float a){ vec2 d = q - c; float ca = cos(a), sa = sin(a); d = vec2(d.x * ca - d.y * sa, d.y * ca + d.x * sa); return (length(d / r) - 1.) * min(r.x, r.y); }
        float shape(vec2 q, float type, float sd){
          float d;
          if (type < .5) {
            d = ell(q, vec2(0., .5), vec2(.13, .5), 0.);
            d = min(d, ell(q, vec2(-.2, .46), vec2(.12, .46), -.42 - .1 * sd)); d = min(d, ell(q, vec2(.2, .44), vec2(.12, .45), .42 + .1 * sd));
            d = min(d, ell(q, vec2(-.38, .3), vec2(.1, .34), -.95)); d = min(d, ell(q, vec2(.38, .28), vec2(.1, .33), .95 - .2 * sd));
          } else if (type < 1.5) {
            d = min(length(q - vec2(-.62, .2)) - .42, min(length(q - vec2(.08, .26 + .06 * sd)) - .5, length(q - vec2(.74, .16)) - .36));
          } else if (type < 2.5) {
            d = min(length(q - vec2(0., .2)) - .54, min(length(q - vec2(-.55, .12)) - .3, length(q - vec2(.52, .1)) - .32));
          } else d = ell(q, vec2(0., .14 + .05 * sd), vec2(.95, .36), .12 * (sd - .5));
          return max(d, .02 - q.y);
        }
        void main(){
          float type = vT.x, sd = vT.y;
          float d = shape(vQ, type, sd), al = 1. - aastep(0., d);
          float fl = 0.;
          if (type > 1.5 && type < 2.5 && uFlowers > .5) { vec2 f = vec2(abs(vQ.x) - .3 - .22 * step(.5, fract(vQ.y * 3.1 + sd)), vQ.y - .86 + .2 * step(.42, abs(vQ.x))); fl = 1. - aastep(0., min(length(f) - .075, length(vQ - vec2(.04, .92)) - .075)); }
          bool cut = max(al, fl) < .02;                       // decided here, made after the last filtered edge below: no filter width is defined once a pixel is discarded
          float sh = shadeAll(vW.xz);
          float dS = shape(vQ - vS * .2, type, sd), dL = shape(vQ + vS * .26, type, sd), dK = shape(vQ + vS * .055, type, sd);
          int ti = int(type + .5);
          vec3 L = uCL[ti], M = uCM[ti], D = M * uOver;
          vec3 c = mix(M, mix(M, D, .6), sh);
          c = mix(c, mix(L, M, sh), aastep(0., dL));
          c = mix(c, D, aastep(0., dS));
          c = mix(c, uPaper, aastep(0., dK) * (type > 2.5 ? .0 : .9));
          if (cut) discard;
          c = mix(c, uGold, fl * (1. - al * .0));
          c = mix(c, uFarInk, vT.z);
          gl_FragColor = vec4(c, max(al, fl));
        }`, { uCL: cols([mixc(ink.green, ink.gold, 0.5), mixc(ink.paper, ink.green, 0.42), mixc(ink.paper, ink.turq, 0.3), mixc(ink.paper, ink.terra, 0.25)]),
        uCM: cols([mixc(ink.green, ink.cocoa, 0.25), mixc(ink.green, mixc(ink.paper, ink.violet, 0.55), 0.5), mixc(ink.turq, ink.violet, 0.35), mixc(mixc(ink.terra, ink.violet, 0.45), ink.paper, 0.15)]),
        uGold: nt(ink.gold), uFarInk: farInk, uFlowers: season === 'may' ? 1 : 0 }, { side: THREE.DoubleSide, a2c: true }), 1);
      stats.tris += n * 2;
    }
    await ctx.yield();
    const printU = { value: 0 };                                // camera distance along the path: a print shows once its animal has passed
    { // hoof prints in the sand of the bed, stamped where each animal's track crosses it
      const aP = [], aY = [];
      const whenAt = (a, s) => { let lo = 0, hi = L; for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2; if (a.sOf(m) < s) lo = m; else hi = m; } return hi; };
      for (const a of herd) {
        if (a.sIn < 0) continue;
        for (let s0 = a.sIn + 3.6; s0 < a.sOut - 2.2; s0 += 6.6 * (a.kind === 2 ? 0.78 : 1)) {
          [[0, -0.12], [0.55, 0.1], [2.5, -0.1], [3.1, 0.13]].forEach(([ds, dl]) => {
            const s = s0 + ds; if (s > a.sOut - 1.5 || sample(a.AIR, s) > 0.04) return;
            const x0 = sample(a.X, s), z0 = sample(a.Z, s), tx = sample(a.X, s + 0.6) - x0, tz = sample(a.Z, s + 0.6) - z0, tl = Math.hypot(tx, tz) || 1;
            const x = x0 + (tz / tl) * dl * a.scale, z = z0 - (tx / tl) * dl * a.scale;
            aP.push(x, z, Math.atan2(tx, tz), whenAt(a, s)); aY.push(heightAt(x, z) + 0.045, a.scale);
          });
        }
      }
      const n = aP.length / 4, g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(aP), 4)); g.setAttribute('aY', new THREE.InstancedBufferAttribute(new Float32Array(aY), 2)); g.instanceCount = n;
      add(g, mat(/* glsl */`
        attribute vec4 aP; attribute vec2 aY; uniform float uD; varying vec2 vQ; varying vec3 vW;
        void main(){
          float on = step(aP.w, uD), c = cos(aP.z), s = sin(aP.z);
          vec2 l = position.xy * vec2(.2, .31) * aY.y * on;
          vW = vec3(aP.x + l.x * c + l.y * s, aY.x, aP.y - l.x * s + l.y * c); vQ = position.xy;
          gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
        }`, WG + /* glsl */`
        uniform vec3 uSand, uSandSh, uCocoa; varying vec2 vQ; varying vec3 vW;
        void main(){
          float sh = shadeAll(vW.xz);
          float dk = 1. - aastep(0., length(vec2(abs(vQ.x) - .42, vQ.y + .12) / vec2(.3, .7)) - 1.);   // the two toes
          float lip = (1. - aastep(0., length(vec2(vQ.x, vQ.y - .22) / vec2(.95, .74)) - 1.)) * aastep(.12, vQ.y);  // sand thrown ahead
          vec3 dark = mix(mix(uSand * mix(vec3(1.), uOver, .62), uSandSh * mix(vec3(1.), uOver, .66), sh), uCocoa, .4);
          vec3 lite = mix(mix(uSand, uPaper, .65), mix(uSandSh, uPaper, .45), sh);
          gl_FragColor = vec4(mix(lite, dark, dk), max(dk, lip * .9));
        }`, { uSand: ink.sand, uSandSh: ink.sandSh, uCocoa: ink.cocoa, uD: printU }, { transparent: true, side: THREE.DoubleSide, offset: 3 }), 0);
      stats.tris += n * 2; stats.prints = n;
    }
    { // foothill palo verde and ironwood along the wash only: green-barked, flat-crowned, tossing in the outflow
      for (let v = 0; v < 2; v++) {
        const b = new Buf(PSPEC), list = [];
        const BL = nt(mixc(ink.green, ink.gold, v ? 0.2 : 0.55)), BM = nt(v ? mixc(ink.green, ink.cocoa, 0.4) : ink.green);
        const KL = nt(v ? mixc(mixc(ink.green, ink.turq, 0.3), ink.paper, 0.25) : mixc(mixc(ink.green, ink.gold, 0.6), ink.paper, 0.12)), KM = nt(v ? mixc(ink.green, ink.violet, 0.3) : mixc(ink.green, ink.gold, 0.2));
        ptube(b, [new V3(0, -0.2, 0), new V3(0.12, 0.9, 0.05), new V3(0.05, 1.7, 0)], [0.24, 0.19, 0.16], 5, 0, BL, BM, { cap: false, key: 0.6 });
        for (let k = 0; k < 4; k++) {
          const a = k * 1.571 + pr.range(-0.4, 0.4), o = pr.range(1.5, 2.6), top = pr.range(3.6, 5.2);
          ptube(b, [new V3(0.05, 1.5, 0), new V3(Math.cos(a) * o * 0.5, 2.5, Math.sin(a) * o * 0.5), new V3(Math.cos(a) * o, top - 0.3, Math.sin(a) * o)], [0.13, 0.09, 0.05], 4, 0, BL, BM, { cap: false, sway1: 0.2 });
          pell(b, [Math.cos(a) * o, top, Math.sin(a) * o], [pr.range(1.5, 2.2), pr.range(0.6, 0.9), pr.range(1.5, 2.2)], 7, 4, KL, KM, { sway: 0.34, key: 0.9 });
        }
        pell(b, [0, 5.3, 0], [2.3, 0.8, 2.3], 7, 4, KL, KM, { sway: 0.4, key: 0.9 });
        const n = Math.round(27 * density);
        for (let i = 0; i < n * 4 && list.length < n; i++) {
          const lz = pr.range(SZ0 + 40, SZ1 - 40), sd = pr.sign(), c = W.centerX(lz), edge = sd < 0 ? c - 100 - W.bankDist(c - 100, lz) : c + 100 + W.bankDist(c + 100, lz);
          const w = toW(edge + sd * pr.range(2.5, 9), lz);
          if (path.nearestXZ(w[0], w[1]).dist < 14 || nearTrack(w[0], w[1], 3.2)) continue;
          const sc = pr.range(0.9, 1.35); list.push([w[0], AP, w[1], pr() * 6.28, sc, 0]); bar(w[0] + shDX * 3.5 * sc * shK * 0.6, w[1] + shDZ * 3.5 * sc * shK * 0.6, 3.2 * sc, 2.5 * sc, AP, 1);
        }
        plantMesh(b, list);
      }
      // granite: rounded boulders heaped on the rise both sides of the saddle, a few strays on the apron
      const RL = nt(mixc(ink.paper, ink.terra, 0.42)), RM = nt(mixc(mixc(ink.terra, ink.violet, 0.4), ink.paper, 0.18));
      for (let v = 0; v < 3; v++) {
        const b = new Buf(PSPEC), list = [];
        pell(b, [v * 7.1, 0.35, v * 3.3], [1, 0.72 + 0.1 * v, 0.86], 8, 5, RL, RM, { lump: 0.2, key: 0.9 });
        b.a.position.forEach((_, i) => { if (i % 3 === 0) b.a.position[i] -= v * 7.1; else if (i % 3 === 2) b.a.position[i] -= v * 3.3; });
        const n = Math.round(74 * (0.8 + 0.2 * density));
        for (let i = 0; i < n * 5 && list.length < n; i++) {
          const stray = pr.chance(0.12), t = stray ? pr.range(80, 300) : pr.range(-55, 78), q = pr.sign() * (stray ? pr.range(9, 60) : 13.5 + 70 * Math.pow(pr(), 1.6)), p = axisPt(t, q);
          const sc = stray ? pr.range(0.5, 1.3) : pr.range(0.8, 3.6) * (1 - 0.5 * smoothstep(40, 80, Math.abs(q)));
          if (path.nearestXZ(p[0], p[1]).dist < 7 + sc || washOut(p[0], p[1]) < 2 || nearTrack(p[0], p[1], sc + 1)) continue;
          const y = heightAt(p[0], p[1]); list.push([p[0], y - 0.1 * sc, p[1], pr() * 6.28, sc, 0, pr.range(0.75, 1.15), pr.range(-0.2, 0.2)]); bar(p[0], p[1], 0.9 * sc, 0.95 * sc, y, 1);
        }
        plantMesh(b, list);
      }
    }
    await ctx.yield();
    // ---- THE OLD SAGUAROS, close on both hands through the middle of the flight -----------------------------------
    // They are the stand round the towering one. Their stretch of the way reaches back from the towering one's own
    // station by OLD_REACH (eight of its heights) and forward to the near bank of the wash, the bank it stands on. On each
    // hand about one to every 25 to 40 m of the way: its station and its distance from the route's line (6.5 to 9 m, the
    // journey's 'trunks pass 6 to 9 m away') are drawn from the old ones' own stream. Every test is one of place, the
    // same along the whole stretch: its trunk and every arm keep the route's clear corridor of 6 m; it stands 12 m or
    // more from every hand-set saguaro and from every other old one, outside the towering saguaro's clearing, 12 m or
    // more outside the bank (where the palo verde stand), 4.5 m from a forest saguaro, clear of an ocotillo's, a
    // cholla's or a prickly pear's foot, and off every animal's track by OLD_TRACK metres (the room the herd is given
    // round a cholla, a plant of the same girth). The herd's lanes fill most of the 6 to 9 m band, and the herd runs
    // as it did: so where the drawn place is taken, the old one stands at the nearest free ground outward from it on
    // the same station (in half-metre steps, to OLD_OUT metres further out), and a station with none is drawn again.
    const olds = [], OLD_TRACK = 1.3, OLD_OUT = 9;
    const OLD_REACH = 8 * TOWER_H;
    {
      const sA = Math.max(0, tower.s - OLD_REACH);
      let sB = sA; for (; sB < L; sB += 0.5) { pathFrame(sB, fr); if (washOut(fr.x, fr.z) < 0) break; }
      const forest = []; for (const S of SV) for (const r of S.list[0]) forest.push(r[0], r[2]);
      const free = (x, z, S, yaw, sc) => {
        if (path.nearestXZ(x, z).dist - S.r * sc < 6 || washOut(x, z) < 12 || inClearing(x, z) || nearTrack(x, z, OLD_TRACK)) return false;
        if (nearSpec(x, z, 12) || Math.hypot(x - strikeSag.x, z - strikeSag.z) < 12) return false;
        for (const o of olds) if ((x - o.x) ** 2 + (z - o.z) ** 2 < 144) return false;
        for (let k = 0; k < forest.length; k += 2) if ((x - forest[k]) ** 2 + (z - forest[k + 1]) ** 2 < 20.25) return false;
        for (let k = solidA; k < solidB; k += 6) if ((x - bars[k]) ** 2 + (z - bars[k + 1]) ** 2 < (1.5 + bars[k + 3]) ** 2) return false;
        const y = heightAt(x, z), cy = Math.cos(yaw), sy = Math.sin(yaw);
        for (let i = 1; i < S.near.tips.length; i++) { const t = S.near.tips[i]; if (path.distanceTo(x + (t[0] * cy + t[2] * sy) * sc, y + t[4] * sc, z + (-t[0] * sy + t[2] * cy) * sc) - t[3] * sc < 6) return false; }
        return true;
      };
      for (const side of [-1, 1]) {
        for (let s = sA + os.range(8, 30); s < sB; s += os.range(25, 40)) {
          for (let k = 0, done = false; k < 4 && !done; k++) {
            const sj = s + (k ? os.range(-7, 7) : 0), d0 = os.range(6.5, 9), S = OLD[os.int(0, 2)], yaw = os.range(0, 6.2832), sc = os.range(0.97, 1.03);
            pathFrame(sj, fr);
            for (let dd = 0; dd <= OLD_OUT && !done; dd += 0.5) {
              const lat = side * (d0 + dd), x = fr.x - fr.tz * lat, z = fr.z + fr.tx * lat;
              if (!free(x, z, S, yaw, sc)) continue;
              const n0 = perches.length; standSaguaro(S, x, z, yaw, sc, 0, 0); perches.length = n0;   // (their crowns are not perches: every dove keeps the crown it is dealt)
              olds.push({ x, z, s: sj, lat, h: S.h * sc, dist: path.nearestXZ(x, z).dist }); done = true;
            }
          }
          await ctx.yield();
        }
      }
      for (const S of OLD) plantMesh(S.near.buf, S.list[0]);
    }
    await ctx.yield();
    { // the towering saguaro's ground: whatever was planted at its very foot, where its arm comes down or on a stretch
      // of track bent round it is taken off the land, whatever its kind and whatever the seed. It is taken out of its
      // mesh's instances (those after it move up one and the count is lowered, so that nothing of it is sent to be
      // drawn; no instance of these meshes is read by its index further down, and the dealt lists keep every row), and
      // every shadow bar it laid is taken out of the bars. Then the towering one's own mesh is made.
      // Where each kind lays its bars: at the plant's own place (an ocotillo, a cholla, a prickly pear, a boulder, a
      // saguaro's trunk; a saguaro's arms' bars follow its trunk's in the list, one to an arm); 0.6 x 3.5 x its scale
      // x shK down the shadow's line from its place (the crown of a palo verde or an ironwood); half the bar's own half
      // width up that line (a creosote card). A far saguaro card lays none.
      const barAt = (x, z) => { for (let k = 0; k < bars.length; k += 6) if (Math.abs(bars[k] - x) < 0.01 && Math.abs(bars[k + 1] - z) < 0.01) return k; return -1; };
      const armsAt = (x, z) => { for (const S of [...SV, ...SPEC, ...OLD]) for (const l of S.list) for (const r of l) if (Math.abs(r[0] - x) < 0.01 && Math.abs(r[2] - z) < 0.01) return S.near.tips.length - 1; return 0; };
      for (const m of scene.children) {
        if (!m.isInstancedMesh || m.material !== plantMat) continue;
        const e = m.instanceMatrix.array, far = m.geometry.attributes.aFar.array;
        let n = 0;
        for (let i = 0; i < m.count; i++) {
          const x = e[i * 16 + 12], z = e[i * 16 + 14];
          if ((x - tower.x) ** 2 + (z - tower.z) ** 2 < 6.25 || armLie(x, z) < 1.5 || nearBend(x, z, 1.3)) {
            const down = 0.6 * 3.5 * Math.hypot(e[i * 16], e[i * 16 + 1], e[i * 16 + 2]) * shK;
            let k = barAt(x, z);
            if (k >= 0) bars.splice(k, 6 * (1 + armsAt(x, z)));
            else if ((k = barAt(x + shDX * down, z + shDZ * down)) >= 0) bars.splice(k, 6);
            continue;
          }
          if (n < i) { e.copyWithin(n * 16, i * 16, i * 16 + 16); far[n] = far[i]; }
          n++;
        }
        stats.tris -= (m.geometry.index.count / 3) * (m.count - n); m.count = n;
      }
      for (const m of scene.children) {
        const A = m.geometry && m.geometry.attributes.aC0; if (!A) continue;
        const a = A.array, c = m.geometry.attributes.aC1.array;
        let n = 0;
        for (let i = 0; i < m.geometry.instanceCount; i++) {
          const x = a[i * 4], z = a[i * 4 + 2];
          if (c[i * 4] < 0.5 && (nearBend(x, z, 0.8) || armLie(x, z) < 1 || (x - tower.x) ** 2 + (z - tower.z) ** 2 < 2.6)) {
            for (let k = 0; k < bars.length; k += 6) if (Math.abs(bars[k] + shDX * 0.5 * bars[k + 3] - x) < 0.01 && Math.abs(bars[k + 1] + shDZ * 0.5 * bars[k + 3] - z) < 0.01) { bars.splice(k, 6); break; }
            continue;
          }
          if (n < i) { a.copyWithin(n * 4, i * 4, i * 4 + 4); c.copyWithin(n * 4, i * 4, i * 4 + 4); }
          n++;
        }
        stats.tris -= 2 * (m.geometry.instanceCount - n); m.geometry.instanceCount = n;
      }
      plantMesh(TOWER.near.buf, TOWER.list[0]);
    }
    await ctx.yield();
    { // all the cast shadow bars in one draw. Each bar is laid ON the land: its four corners take the height of the
      // apron mesh under them, and where the ground bends inside it (the rise, the saddle, the boulder heaps) the bar
      // is cut into smaller patches until every patch lies within 7 cm of the ground. Nothing hangs in the air.
      const nb = bars.length / 6, oS = [], oR = [], oH = [], oK = [];
      let bx = 0, bz = 0, bl = 0, bw = 0, bk = 0;
      const hAt = (a, q) => heightAt(bx + shDX * a - shDZ * q, bz + shDZ * a + shDX * q);
      const patch = (a0, a1, b0, b1, h00, h10, h11, h01, depth) => {
        const la = a1 - a0, lb = b1 - b0, ext = Math.max(la, lb);
        const bend = Math.max(Math.abs(h00 - h10), Math.abs(h01 - h11), Math.abs(h00 - h01), Math.abs(h10 - h11));
        if (depth < 7 && ext > 0.45 && (ext > 3 || bend > 0.02 + 0.03 * ext)) {
          const am = (a0 + a1) / 2, bm = (b0 + b1) / 2;
          const hA0 = hAt(am, b0), hA1 = hAt(am, b1), h0B = hAt(a0, bm), h1B = hAt(a1, bm), hc = hAt(am, bm);
          const da = Math.max(Math.abs(hA0 - (h00 + h10) / 2), Math.abs(hA1 - (h01 + h11) / 2)), db = Math.max(Math.abs(h0B - (h00 + h01) / 2), Math.abs(h1B - (h10 + h11) / 2));
          const dc = Math.max(Math.abs(hc - (h00 + h10 + h11 + h01) / 4), Math.abs(hc - (h00 + h11) / 2));
          if (Math.max(da, db, dc) > 0.07) {
            if ((da >= db || lb < 0.45) && la >= 0.45) { patch(a0, am, b0, b1, h00, hA0, hA1, h01, depth + 1); patch(am, a1, b0, b1, hA0, h10, h11, hA1, depth + 1); }
            else { patch(a0, a1, b0, bm, h00, h10, h1B, h0B, depth + 1); patch(a0, a1, bm, b1, h0B, h1B, h11, h01, depth + 1); }
            return;
          }
        }
        oS.push(bx, bz, bl, bw); oR.push(a0, a1, b0, b1); oH.push(h00, h10, h11, h01); oK.push(bk);
      };
      for (let i = 0; i < nb; i++) {
        bx = bars[i * 6]; bz = bars[i * 6 + 1]; bl = bars[i * 6 + 2]; bw = bars[i * 6 + 3]; bk = bars[i * 6 + 5];
        const a0 = -bw, a1 = bl + bw;
        patch(a0, a1, -bw, bw, hAt(a0, -bw), hAt(a1, -bw), hAt(a1, bw), hAt(a0, bw), 0);
        if (i % 1500 === 1499) await ctx.yield();
      }
      const n = oK.length, g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(oS), 4)); g.setAttribute('aR', new THREE.InstancedBufferAttribute(new Float32Array(oR), 4));
      g.setAttribute('aH', new THREE.InstancedBufferAttribute(new Float32Array(oH), 4)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(new Float32Array(oK), 1)); g.instanceCount = n;
      add(g, mat(/* glsl */`
        attribute vec4 aS, aR, aH; attribute float aK; uniform vec2 uDir; varying vec2 vQ; varying vec3 vP; varying vec3 vW;
        void main(){
          float a = mix(aR.x, aR.y, position.x), bq = mix(aR.z, aR.w, position.y);
          vec2 xz = aS.xy + uDir * a + vec2(-uDir.y, uDir.x) * bq;
          float y = mix(mix(aH.x, aH.y, position.x), mix(aH.w, aH.z, position.x), position.y);
          vW = vec3(xz.x, y + .08, xz.y); vQ = vec2(a, bq); vP = vec3(aS.z, aS.w, aK);
          gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
        }`, WG + /* glsl */`
        uniform vec3 uBar; varying vec2 vQ; varying vec3 vP; varying vec3 vW;
        void main(){
          float d = vP.z < .5 ? length(vec2(vQ.x - clamp(vQ.x, 0., vP.x), vQ.y)) - vP.y
                              : (length(vec2((vQ.x - vP.x * .5) / (vP.x * .5 + vP.y), vQ.y / max(vP.y, 1e-3))) - 1.) * vP.y;
          float al = (1. - aastep(0., d)) * (1. - shadeAll(vW.xz));
          gl_FragColor = vec4(uBar, al);
        }`, { uBar: barInk, uDir: new THREE.Vector2(shDX, shDZ) }, { transparent: true, side: THREE.DoubleSide, offset: 2 }), 0);
      stats.tris += n * 2; stats.bars = n;
    }

    // ---- three small flat cumulus drifting east (their shadows slide over the bajada as uPuff0..2) --------------
    const cumulus = [], puffV = [PU.uPuff0.value, PU.uPuff1.value, PU.uPuff2.value];
    {
      const cr = rng.fork('cumulus'), body = night ? mixc(ink.violet, ink.skyBot, 0.55) : mixc(ink.paper, ink.violet, 0.2), rim = night ? mixc(ink.paper, ink.violet, 0.4) : ink.cream;
      const cm = mat(/* glsl */`
        attribute vec3 color; varying vec3 vC;
        void main(){ vC = color; vec3 p = position; p.y = max(p.y, 0.); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`, /* glsl */`
        varying vec3 vC; void main(){ gl_FragColor = vec4(vC, 1.); }`, {}, { side: THREE.DoubleSide, depthWrite: false });
      for (let i = 0; i < 3; i++) {
        const b = new Buf({ position: 3, color: 3 }), lumps = [];
        const disc = (x, y, r, z, c) => { const o = b.v({ position: [x, y, z], color: c3(c) }); for (let k = 0; k < 16; k++) b.v({ position: [x + Math.cos(k * 0.3927) * r, y + Math.sin(k * 0.3927) * r, z], color: c3(c) }); for (let k = 0; k < 16; k++) b.tri(o, o + 1 + k, o + 1 + ((k + 1) % 16)); };
        const n = cr.int(4, 6), w = cr.range(95, 150);
        for (let k = 0; k < n; k++) { const t = n > 1 ? k / (n - 1) : 0.5; lumps.push([(t - 0.5) * 2 * w, cr.range(0, 16) + 34 * Math.sin(t * Math.PI), cr.range(38, 62) * (0.7 + 0.5 * Math.sin(t * Math.PI))]); }
        for (const l of lumps) disc(l[0] - 9, l[1] + 6, l[2], -2, rim);
        for (const l of lumps) disc(l[0], l[1], l[2], 0, body);
        const m = add(b.geo(), cm, -1.5);
        cumulus.push({ m, az: ((18 + i * 17 + cr.range(-5, 5)) * Math.PI) / 180, el: ((8 + cr.range(0, 9)) * Math.PI) / 180, r: cr.range(15, 24), ph: cr.range(0, 160), s: 55 + i * 95 + cr.range(-15, 15) });
      }
    }

    // ---- birds: Harris's hawks, white-winged doves (bats at night), Gila woodpeckers ----------------------------
    const NDOVE = Math.round(30 * clamp(density, 0.8, 1.2)), NB = 5 + NDOVE + 6 + 8;   // (+ 8: the towering saguaro's doves)
    const birdI = [0, 1, 2].map(() => new THREE.InstancedBufferAttribute(new Float32Array(NB * 4), 4));
    {
      const b = new Buf({ position: 3, normal: 3, aW: 2 });
      const ell = (c, r, seg, rings, id) => { const base = b.n; for (let j = 0; j <= rings; j++) for (let k = 0; k <= seg; k++) { const la = (j / rings) * Math.PI, lo = (k / seg) * 6.2832, x = Math.sin(la) * Math.cos(lo), y = Math.sin(la) * Math.sin(lo), z = Math.cos(la); b.v({ position: [c[0] + x * r[0], c[1] + y * r[1], c[2] + z * r[2]], normal: [x, y, z], aW: [0, id] }); } for (let j = 0; j < rings; j++) for (let k = 0; k < seg; k++) { const a = base + j * (seg + 1) + k, d = a + seg + 1; b.quad(a, d, d + 1, a + 1); } };
      const flat = (P, w, id) => { const i = P.map((p) => b.v({ position: p, normal: [0, 1, 0], aW: [w, id] })); b.quad(i[0], i[1], i[2], i[3]); };
      ell([0, 0, 0], [0.075, 0.075, 0.2], 6, 4, 0); ell([0, 0.03, 0.2], [0.052, 0.052, 0.065], 5, 3, 1);
      flat([[-0.05, 0, -0.16], [0.05, 0, -0.16], [0.13, 0, -0.44], [-0.13, 0, -0.44]], 0, 4);
      for (const sg of [-1, 1]) {
        flat([[sg * 0.05, 0.02, 0.12], [sg * 0.3, 0.02, 0.13], [sg * 0.3, 0.02, -0.1], [sg * 0.05, 0.02, -0.12]], sg, 2);
        flat([[sg * 0.3, 0.02, 0.13], [sg * 0.56, 0.02, 0.04], [sg * 0.53, 0.02, -0.07], [sg * 0.3, 0.02, -0.1]], sg * 2, 3);
      }
      const g0 = b.geo(), g = new THREE.InstancedBufferGeometry(); g.index = g0.index; for (const k in g0.attributes) g.setAttribute(k, g0.attributes[k]);
      birdI.forEach((at, k) => { at.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aI' + k, at); }); g.instanceCount = NB;
      const HD = nt(mixc(ink.cocoa, ink.violet, 0.45).multiplyScalar(0.55));
      add(g, mat(/* glsl */`
        attribute vec2 aW; attribute vec4 aI0, aI1, aI2; varying vec3 vN; varying vec3 vO; varying vec3 vK;
        vec3 rX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, p.y * c - p.z * s, p.z * c + p.y * s); }
        vec3 rZ(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x * c - p.y * s, p.y * c + p.x * s, p.z); }
        void main(){
          vec3 p = position, n = normal; float sg = aW.x < 0. ? -1. : 1., wt = abs(aW.x), fold = aI1.y;
          if (wt > .5) {
            float A = mix(aI1.x * (wt > 1.5 ? 1.7 : 1.), -1.3, fold), c = cos(A), s = sin(A) * sg;
            vec2 sh = vec2(sg * .05, 0.), q = p.xy - sh;
            p.xy = sh + vec2(q.x * c - q.y * s, q.y * c + q.x * s); n.xy = vec2(n.x * c - n.y * s, n.y * c + n.x * s);
            p.x = mix(p.x, sg * .075, fold * .75); p.z -= fold * (wt - .5) * .1;
          }
          p = rZ(rX(p, aI2.x), aI2.y) * aI1.z; n = rZ(rX(n, aI2.x), aI2.y);
          float cy = cos(aI0.w), sy = sin(aI0.w);
          vec3 w = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy) + aI0.xyz;
          vN = vec3(n.x * cy + n.z * sy, n.y, -n.x * sy + n.z * cy); vO = position; vK = vec3(aI1.w, aW.y, 0.);
          gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
        }`, SERI_GLSL + /* glsl */`
        uniform vec3 uHawk, uChest, uDove, uTan, uScar, uBat; varying vec3 vN; varying vec3 vO; varying vec3 vK;
        void main(){
          vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
          float id = vK.y, kind = vK.x; vec3 c;
          if (kind < .5) { c = id > 1.5 && id < 2.5 ? uChest : uHawk; if (id > 3.5) c = mix(c, uPaper, max(aastep(-.25, vO.z), 1. - aastep(-.40, vO.z))); }
          else if (kind < 1.5) { c = id > 2.5 && id < 3.5 ? uHawk : uDove; if (id > 1.5 && id < 2.5) c = mix(c, uPaper, 1. - aastep(.0, vO.z)); if (id > 3.5) c = mix(uHawk, uPaper, 1. - aastep(-.38, vO.z)); }
          else if (kind < 2.5) c = uBat;
          else { c = uTan; if (id > 1.5) c = mix(uHawk, uPaper, aastep(0., sin(vO.x * 60.))); if (id > .5 && id < 1.5) c = mix(c, uScar, aastep(.045, vO.y)); }
          c *= mix(uOver, vec3(1.), aastep(-.05, dot(n, uSun) + .25));
          gl_FragColor = vec4(c, 1.);
        }`, { uHawk: HD, uChest: nt(mixc(ink.terra, ink.cocoa, 0.35)), uDove: nt(mixc(ink.paper, mixc(ink.cocoa, ink.violet, 0.5), 0.72)), uTan: nt(mixc(ink.paper, ink.gold, 0.4)), uScar: nt(ink.scarlet), uBat: mixc(ink.violet, ink.cocoa, 0.4).multiplyScalar(0.35) }, { side: THREE.DoubleSide }), 3);
    }
    // the perched stack: three hawks printed in profile, one upright card each, turned to the viewer; when the stack
    // breaks each card gives way to its flying bird
    const perchI = [0, 1].map(() => new THREE.InstancedBufferAttribute(new Float32Array(12), 4));
    {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      perchI.forEach((at, k) => { at.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aH' + k, at); }); g.instanceCount = 3;
      add(g, mat(/* glsl */`
        attribute vec4 aH0, aH1; varying vec2 vQ; varying float vLift;
        void main(){
          vec3 r = normalize(vec3(viewMatrix[0][0], 0., viewMatrix[2][0]) + vec3(1e-5, 0., 0.));
          vec3 w = aH0.xyz + r * aH1.z + (r * position.x * aH1.x + vec3(0., position.y, 0.)) * aH0.w;
          vQ = position.xy; vLift = aH1.y;
          gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
        }`, SERI_GLSL + /* glsl */`
        uniform vec3 uHawk, uChest, uLeg; varying vec2 vQ; varying float vLift;
        float ell(vec2 p, vec2 c, vec2 r, float a){ vec2 d = p - c; float ca = cos(a), sa = sin(a); d = vec2(d.x * ca - d.y * sa, d.y * ca + d.x * sa); return (length(d / r) - 1.) * min(r.x, r.y); }
        void main(){
          vec2 q = vQ; float lift = vLift;
          float body = ell(q, vec2(-.04, -.06), vec2(.26, .47), -.2);
          float head = length(q - vec2(.13, .5)) - .17;
          float beak = ell(q, vec2(.32, .45), vec2(.1, .05), .6);
          float tail = ell(q, vec2(-.25, -.62), vec2(.1, .36), -.32);
          float wing = ell(q, vec2(-.13 - .1 * lift, -.1 + .3 * lift), vec2(.15 + .05 * lift, .43), -.28 - 1.1 * lift);
          float legs = max(abs(abs(q.x - .03) - .07) - .03, abs(q.y + .6) - .14);
          float d = min(min(min(body, head), min(beak, tail)), min(wing, legs));
          float al = 1. - aastep(.05, d);
          bool cut = al < .02;                                // decided here, made after the last filtered edge (it is in the line that writes the colour)
          vec3 c = uHawk;
          c = mix(c, uLeg, (1. - aastep(0., min(legs, beak))) * aastep(0., min(body, head)));
          c = mix(c, uHawk * .6, 1. - aastep(0., wing));
          c = mix(c, uChest, 1. - aastep(0., ell(q, vec2(-.03 - .1 * lift, .12 + .3 * lift), vec2(.13, .2), -.25 - 1.1 * lift)));
          c = mix(c, uPaper, (1. - aastep(0., tail)) * aastep(0., min(body, wing)) * min(1. - aastep(-.84, q.y) + aastep(-.5, q.y), 1.));
          c = mix(c, uPaper, 1. - aastep(0., length(q - vec2(.2, .54)) - .035));
          gl_FragColor = vec4(mix(uPaper, c, 1. - aastep(0., d)), al);
          if (cut) discard;
        }`, { uHawk: nt(mixc(ink.cocoa, ink.violet, 0.45).multiplyScalar(0.55)), uChest: nt(mixc(ink.terra, ink.cocoa, 0.3)), uLeg: nt(ink.gold) }, { side: THREE.DoubleSide, a2c: true }), 3);
    }
    const setBird = (i, x, y, z, yaw, flap, fold, sc, kind, pitch, bank) => {
      const o = i * 4; birdI[0].array[o] = x; birdI[0].array[o + 1] = y; birdI[0].array[o + 2] = z; birdI[0].array[o + 3] = yaw;
      birdI[1].array[o] = flap; birdI[1].array[o + 1] = fold; birdI[1].array[o + 2] = sc; birdI[1].array[o + 3] = kind; birdI[2].array[o] = pitch; birdI[2].array[o + 1] = bank;
    };
    const br = rng.fork('birds');
    // doves: ten on the two giants' crowns, the rest on crowns along the way (never the hawks' saguaro)
    const doves = [], peckers = [];
    {
      const cand = perches.filter((p) => Math.hypot(p[3] - hawkSag.x, p[4] - hawkSag.z) > 3 && Math.hypot(p[3] - giants[0][0], p[4] - giants[0][1]) > 3 && Math.hypot(p[3] - giants[1][0], p[4] - giants[1][1]) > 3);
      const gp = perches.filter((p) => Math.hypot(p[3] - giants[0][0], p[4] - giants[0][1]) < 3 || Math.hypot(p[3] - giants[1][0], p[4] - giants[1][1]) < 3);
      for (let i = 0; i < NDOVE; i++) {
        const p = i < 12 && gp.length ? gp[i % gp.length] : cand.length ? cand[br.int(0, cand.length - 1)] : gp[i % Math.max(1, gp.length)] || [0, 20, 0, 0, 0];
        const s = path.nearestXZ(p[0], p[2]).u * L;
        doves.push({ p, s, off: [br.range(-0.22, 0.22), br.range(-0.22, 0.22)], yaw: br.range(0, 6.28), at: br.range(30, 46), dir: br.range(-0.9, 0.9), sp: br.range(9, 14), ph: br.range(0, 6.28), up: br.range(2.2, 4.2) });
      }
      const hn = holes.filter((h) => h.near);                    // Gila woodpeckers bob at the nest holes of the hand-set trunks
      for (let i = 0; i < 6; i++) { const h = hn[(i * 2 + (i > 2 ? 1 : 0)) % hn.length]; peckers.push({ x: h.x, y: h.y, z: h.z, yaw: h.yaw, ph: br.range(0, 6.28) }); }
    }
    // the towering saguaro's doves: eight feed on its crowns and burst from them at the stroke (seconds after it, t0),
    // dealt from the towering one's own stream. A dove whose crown stood on a forest saguaro that the towering one's
    // ground no longer carries (a marked perch) feeds on the towering one instead, and leaves it at the stroke too.
    const towerDoves = [];
    {
      const tp = tower.perches; let k = 0;
      for (const d of doves) if (d.p[5]) { d.p = tp[k++ % tp.length]; d.s = path.nearestXZ(d.p[0], d.p[2]).u * L; d.at = d.s - sStrike; }
      pathFrame(tower.s, fr);
      for (let j = 0; j < 8; j++) towerDoves.push({ p: tp[(j + k) % tp.length], fx: fr.tx, fz: fr.tz, off: [tw.range(-0.22, 0.22), tw.range(-0.22, 0.22)], yaw: tw.range(0, 6.28), dir: tw.range(-0.9, 0.9), sp: tw.range(3, 9), ph: tw.range(0, 6.28), up: tw.range(2.6, 5.2), t0: tw.range(0.02, 0.3) });
    }

    // ---- hoof dust (scalloped puffs that swell and thin) and the rare bolt's steam --------------------------------
    const NPUFF = NH * 6 + 4 + 9 + 9, puffI = [0, 1].map(() => new THREE.InstancedBufferAttribute(new Float32Array(NPUFF * 4), 4));
    {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      puffI.forEach((at, k) => { at.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aD' + k, at); }); g.instanceCount = NPUFF;
      add(g, mat(/* glsl */`
        attribute vec4 aD0, aD1; varying vec2 vQ; varying vec3 vD; varying vec3 vW;
        void main(){
          vec3 r = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
          float near = smoothstep(1.2, 5.5, distance(aD0.xyz, cameraPosition));
          vec3 w = aD0.xyz + (r * position.x + vec3(0., 1., 0.) * (position.y + .55)) * aD0.w * near;
          vQ = position.xy * vec2(aD1.y > .5 ? 1. : -1., 1.); vD = aD1.xzw; vW = aD0.xyz;
          gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
        }`, WG + /* glsl */`
        uniform vec3 uDust, uDustSh; varying vec2 vQ; varying vec3 vD; varying vec3 vW;
        void main(){
          float d = min(min(length(vQ - vec2(-.44, -.3)) - .44, length(vQ - vec2(.42, -.34)) - .42), min(length(vQ - vec2(-.08, .18)) - .52, length(vQ - vec2(.05, -.42)) - .5));
          d = max(d, -(vQ.y + .82));
          float thin = vD.x * vD.x * .5, al = 1. - aastep(0., d + thin);
          float rim = aastep(-.11, d + thin);
          float hole = (1. - aastep(.0, length(vQ - vec2(.1, -.1)) - thin * 1.5)) * step(.3, vD.x);
          vec3 c = mix(mix(uDust, uDustSh, shadeAll(vW.xz)), uPaper, max(rim, vD.y));
          gl_FragColor = vec4(c, al * (1. - hole));
        }`, { uDust: nt(mixc(ink.gold, ink.paper, 0.45)), uDustSh: nt(mixc(ink.groundSh, ink.paper, 0.3)) }, { transparent: true, side: THREE.DoubleSide }), 4);
    }
    const devil = { x: 0, y: 0, z: 0 };                          // a far dust devil: a stack of turning scallops
    { pathFrame(330, fr); devil.x = fr.x - fr.tz * 115; devil.z = fr.z + fr.tx * 115; devil.y = heightAt(devil.x, devil.z); }
    { // wind-borne chaff: flat ink specks drifting through the air round the camera
      const n = Math.round(220 * detail), g = new THREE.InstancedBufferGeometry(), sp = new Float32Array(n * 4), sr2 = rng.fork('chaff');
      for (let i = 0; i < n * 4; i++) sp[i] = sr2();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aP', new THREE.InstancedBufferAttribute(sp, 4)); g.instanceCount = n;
      add(g, mat(VG + /* glsl */`
        attribute vec4 aP; varying vec2 vQ; varying float vK;
        void main(){
          vec3 box = vec3(32., 9., 32.);
          float gst = gustAt(cameraPosition.xz);
          vec3 p = aP.xyz * box + vec3(-uShadow.x * 2. + 1.6, 0., -uShadow.y * 2. + .7) * uTime * (.7 + .8 * aP.w) * (.6 + 1.2 * gst);
          p.y += .5 * sin(uTime * (.6 + aP.w) + aP.x * 40.);
          p = mod(p - cameraPosition + box * .5, box) - box * .5 + cameraPosition + vec3(0., 2.2, 0.);
          vec4 mv = viewMatrix * vec4(p, 1.);
          float dist = -mv.z, sz = (.022 + .03 * aP.w + dist * .0013) * smoothstep(1.2, 3., dist);
          mv.xy += position.xy * sz; vQ = position.xy; vK = aP.w;
          gl_Position = projectionMatrix * mv;
        }`, /* glsl */`
        uniform vec3 uA, uB; varying vec2 vQ; varying float vK;
        void main(){ if (dot(vQ, vQ) > 1.) discard; gl_FragColor = vec4(vK > .55 ? uB : uA, 1.); }`, { uA: ink.cream, uB: nt(mixc(ink.terra, ink.paper, 0.35)) }, { side: THREE.DoubleSide }), 4);
    }
    // the rare bolt: one held cream zigzag from the cloud to the crown of a saguaro on our right, and the arm it drops
    let boltMesh = null, armMesh = null;
    {
      // one unbroken ribbon, zigzagging in the plane that faces us at u 0.8, with a dark keyline behind the cream
      const b = new Buf({ position: 3, aO: 4 }), rr = rng.fork('rare'), N = 13, P = [];
      pathFrame(0.805 * L, fr);
      let vx = strikeSag.x - fr.x, vz = strikeSag.z - fr.z; const vl = Math.hypot(vx, vz) || 1; vx /= vl; vz /= vl;
      const sx = -vz, sz = vx, end = new V3(strikeSag.x + cellDirW.x * 420, 620, strikeSag.z + cellDirW.z * 420);
      P.push([strikeSag.x, strikeSag.top - 0.6, strikeSag.z, 0, 0.26]);
      for (let i = 0; i < N; i++) {
        const t = Math.pow((i + 1) / N, 1.9), zg = i < N - 1 ? (i % 2 ? 1 : -1) * rr.range(0.6, 1) * (2.4 + 1.5 * i + 46 * t) : 0;
        P.push([lerp(strikeSag.x, end.x, t) + sx * zg, lerp(strikeSag.top, end.y, t), lerp(strikeSag.z, end.z, t) + sz * zg, zg, 0.3 + 0.1 * i + 4.4 * t]);
      }
      for (const [k, wm, back] of [[1, 2.1, 1.2], [0, 1, 0]]) {
        const base = b.n;
        for (let i = 0; i <= N; i++) {
          const a = P[Math.max(0, i - 1)], c = P[Math.min(N, i + 1)], p = P[i];
          // the ribbon's width lies across the stroke, in the plane of the zigzag (side, up)
          let ds = (c[0] - a[0]) * sx + (c[2] - a[2]) * sz, dy = c[1] - a[1]; const dl = Math.hypot(ds, dy) || 1; ds /= dl; dy /= dl;
          const w = p[4] * wm, ox = sx * dy * w, oy = -ds * w, oz = sz * dy * w;
          b.v({ position: [p[0] + vx * back, p[1], p[2] + vz * back], aO: [-ox, -oy, -oz, k] }); b.v({ position: [p[0] + vx * back, p[1], p[2] + vz * back], aO: [ox, oy, oz, k] });
        }
        for (let i = 0; i < N; i++) { const q = base + i * 2; b.quad(q, q + 1, q + 3, q + 2); }
      }
      boltMesh = add(b.geo(), mat(/* glsl */`
        attribute vec4 aO; uniform float uF; varying float vK;
        void main(){ vK = aO.w; gl_Position = projectionMatrix * viewMatrix * vec4(position + aO.xyz * (.3 + .7 * uF), 1.); }`, /* glsl */`
        uniform vec3 uInk, uInk2; varying float vK; void main(){ gl_FragColor = vec4(mix(uInk, uInk2, step(.5, vK)), 1.); }`, { uF: { value: 0 }, uInk: ink.cream, uInk2: mixc(ink.violet, ink.cocoa, 0.25) }, { side: THREE.DoubleSide }), 5);
      boltMesh.visible = false;
      const ab = new Buf(PSPEC);
      ptube(ab, [new V3(0, 0, 0), new V3(0.75, 0.15, 0), new V3(1.25, 0.7, 0), new V3(1.3, 1.7, 0), new V3(1.3, 3.1, 0)], [0.36, 0.34, 0.34, 0.34, 0.28], 7, 10, GL_, GM_, { key: 1 });
      armMesh = plantMesh(ab, [[strikeSag.x, strikeSag.y + 5.2, strikeSag.z, 2.4, 1.15, 0]]);
      armMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    }
    await ctx.yield();
    // THE BOLT ON THE TOWERING SAGUARO (every visit): one held cream zigzag from the cell down to its crown, a printed
    // burst at the crown, the trunk printed cream while it holds, the arm it takes off, and afterwards a charred crown,
    // steam off the crown and dust where the arm lands. All of it is placed in metres from the trunk and timed in
    // seconds from the stroke; the flight flies at one speed, so the seconds at u are (u - U_STRIKE) x DUR.
    let strokeMesh = null, towerArm = null, burstMesh = null;
    {
      // The stroke is a line fixed in the world. Its corners are places, in metres from the crown, on three axes: up;
      // c, the cell's bearing in plan (cellDirW, levelled, of length one); a, the level direction square to c. Nothing
      // of the route is read. A corner is [metres along c, metres up, metres along a, half breadth].
      // From the crown it climbs 21.5 m by the typed zigzag (main, with two dead-end forks), leaning toward the cell.
      // Every corner but the foot is also set off ACROSS, along a, by STROKE_ACROSS (0.8 to 1.6 m, drawn from the
      // towering one's own stream), two corners to one hand and the next two to the other, the first hand by chance:
      // a swing of 1.6 to 3.2 m from hand to hand, within the typed zigzag's own steps along c (1.0 to 3.8 m). The
      // zigzag along c turns at every corner and the one along a at every second, so the two never fall in step and
      // from no side do they close into one straight line. A fork runs off to the hand its root stands on, each of
      // its corners STROKE_ACROSS further across than the one before, so that it leaves the stroke on every side.
      // Then it runs on up to the cell, to where the rare bolt's upper end is from its own crown: 420 m along cellDirW
      // and 620 m up. The corners of that run jog along c and along a by 0.6 to 1 times STROKE_JOG of their height
      // above the crown: the stroke's one law of height (a sixteenth: what the typed zigzag's last corners stand off
      // their own line, 1.3 m at 21.5 m).
      // The ink: every stretch is its own quad with square ends that overlap at the corners, the dark keyline behind
      // the cream. A vertex carries its corner's place, the stretch's direction in the world, its side, its end and
      // its half breadth; the vertex shader lays the breadth square to the stretch and to the line from the eye's
      // place (cameraPosition, nothing else of the eye) to the corner, so the ink turns its breadth to wherever it is
      // seen from. The half breadth is the corner's typed one, in metres (the keyline's is 1.5 times it): a fork
      // tapers to its typed point, and the run up to the cell keeps the breadth of the zigzag's last corner.
      // The keyline lies behind the cream by being pushed further from the eye's place along the line from it, by
      // STROKE_BEHIND of its distance: a quarter, more than the stroke is deep wherever two of its stretches meet on
      // the sheet (the typed zigzag reaches 10 m along c, the run's jogs a sixteenth of their height), so that no
      // stretch's keyline lies over another's cream.
      // position = the corner's place from the crown; aD = the stretch's direction; aO = (side, end, half breadth,
      // 1 for the keyline); aK = (the keyline's times, its share of the distance behind)
      const STROKE_ACROSS = [0.8, 1.6], STROKE_JOG = 1 / 16, STROKE_BEHIND = 0.25;
      const b = new Buf({ position: 3, aD: 3, aO: 4, aK: 2 });
      const cp = Math.hypot(cellDirW.x, cellDirW.z) || 1, cx = cellDirW.x / cp, cz = cellDirW.z / cp, ax = -cz, az = cx;
      const J = () => tw.range(-0.3, 0.3);
      const main = [[0, -0.5, 0, 0.52], [1.5 + J(), 3.0, 0, 0.6], [-0.6 + J(), 4.6, 0, 0.7], [2.4, 8.2, 0, 0.8], [1.0 + J(), 9.8, 0, 0.9], [4.4 + J(), 13.0, 0, 1.0], [3.2 + J(), 14.6, 0, 1.08], [7.0, 17.6, 0, 1.17], [6.0 + J(), 19.2, 0, 1.26], [9.5, 21.5, 0, 1.35]];
      const forkA = [[2.4, 8.2, 0, 0.42], [5.2, 7.4, 0, 0.34], [4.8, 6.0, 0, 0.26], [7.4, 4.8, 0, 0.18], [8.4, 5.0, 0, 0.1]], forkB = [[7.0, 17.6, 0, 0.48], [4.2, 18.2, 0, 0.39], [4.4, 16.6, 0, 0.3], [1.8, 15.8, 0, 0.21], [1.0, 16.4, 0, 0.12]];
      const hand = tw.sign(), pair = (n) => hand * (((n + 1) >> 1) % 2 ? 1 : -1);
      for (let n = 1; n < main.length; n++) main[n][2] = pair(n) * tw.range(STROKE_ACROSS[0], STROKE_ACROSS[1]);
      for (const [pl, root] of [[forkA, 3], [forkB, 7]]) { pl[0][2] = main[root][2]; for (let n = 1; n < pl.length; n++) pl[n][2] = pl[n - 1][2] + pair(root) * tw.range(STROKE_ACROSS[0], STROKE_ACROSS[1]); }
      const eC = 420 * cp, eY = 620 - tower.top, NU = 7;
      for (let i = 1; i <= NU; i++) {
        const t = Math.pow(i / NU, 1.7), h = lerp(21.5, eY, t), n = main.length;
        const jc = i < NU ? (i % 2 ? -1 : 1) * tw.range(0.6, 1) * STROKE_JOG * h : 0, ja = i < NU ? pair(n) * tw.range(0.6, 1) * STROKE_JOG * h : 0;
        main.push([lerp(9.5, eC, t) + jc, h, ja, 1.35]);
      }
      const place = (p) => [cx * p[0] + ax * p[2], p[1], cz * p[0] + az * p[2]];
      const stroke = (pl, k, wm, back) => {
        for (let i = 0; i < pl.length - 1; i++) {
          const p = pl[i], q = pl[i + 1], P = place(p), Q = place(q), dl = Math.hypot(Q[0] - P[0], Q[1] - P[1], Q[2] - P[2]) || 1;
          const D = [(Q[0] - P[0]) / dl, (Q[1] - P[1]) / dl, (Q[2] - P[2]) / dl], K = [wm, back];
          const i0 = b.v({ position: P, aD: D, aO: [-1, -1, p[3], k], aK: K }), i1 = b.v({ position: P, aD: D, aO: [1, -1, p[3], k], aK: K }), i2 = b.v({ position: Q, aD: D, aO: [1, 1, q[3], k], aK: K }), i3 = b.v({ position: Q, aD: D, aO: [-1, 1, q[3], k], aK: K });
          b.quad(i0, i1, i2, i3);
        }
      };
      for (const [k, wm, back] of [[1, 1.5, STROKE_BEHIND], [0, 1, 0]]) { stroke(main, k, wm, back); stroke(forkA, k, wm, back); stroke(forkB, k, wm, back); }
      strokeMesh = add(b.geo(), mat(/* glsl */`
        attribute vec3 aD; attribute vec4 aO; attribute vec2 aK; uniform float uF; uniform vec3 uAt; varying float vK;
        void main(){
          vK = aO.w; vec3 p = uAt + position, e = p - cameraPosition;
          float hw = aO.z * aK.x * (.3 + .7 * uF) * step(.004, uF);
          vec3 n = cross(aD, e); n /= max(length(n), 1e-5);
          vec3 w = p + aD * (aO.y * .5 * hw) + n * (aO.x * hw);
          w += (w - cameraPosition) * aK.y;
          gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
        }`, /* glsl */`
        uniform vec3 uInk, uInk2; varying float vK; void main(){ gl_FragColor = vec4(mix(uInk, uInk2, step(.5, vK)), 1.); }`, { uF: { value: 0 }, uAt: new V3(tower.x, tower.top, tower.z), uInk: ink.cream, uInk2: mixc(ink.violet, ink.cocoa, 0.3).multiplyScalar(0.7) }, { side: THREE.DoubleSide }), 5);
      // the arm: its own piece, standing on the +x side of the trunk until the stroke takes it
      const ab = new Buf(PSPEC), ar = 0.5;
      ptube(ab, [new V3(0, 0, 0), new V3(1.2, 0.12, 0), new V3(2.05, 0.85, 0), new V3(2.35, 2.2, 0), new V3(2.35, 4.4, 0), new V3(2.35, 6.4, 0)], [ar * 1.08, ar, ar, ar, ar * 0.97, ar * 0.82], 11, 11, GL_, GM_, { key: 1 });
      for (let k = 0; k < 7; k++) { const a = k * 0.9, rr2 = ar * 0.62; pell(ab, [2.35 + Math.cos(a) * rr2, 6.4 + ar * 0.42, Math.sin(a) * rr2], [0.13, 0.16, 0.13], 3, 2, GL_, GM_, { ink: k === 6 ? 3 : fruitInk }); }
      towerArm = plantMesh(ab, [[tower.x + tower.dx * 0.3, tower.armY, tower.z + tower.dz * 0.3, tower.yaw, 1.3, 0]]);
      towerArm.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      // the printed burst at the crown: one upright card turned to the viewer, an eight-pointed star cut in the shader
      // (cream with a gold heart and a dark keyline, no wider than the cactus)
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      burstMesh = add(g, mat(/* glsl */`
        uniform vec3 uAt; uniform float uB; varying vec2 vQ;
        void main(){
          vec3 r = normalize(vec3(viewMatrix[0][0], 0., viewMatrix[2][0]) + vec3(1e-5, 0., 0.));
          vec3 w = uAt + vec3(0., .3, 0.) + (r * position.x + vec3(0., position.y, 0.)) * 3.3 * step(.004, uB);
          vQ = position.xy; gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
        }`, SERI_GLSL + /* glsl */`
        uniform float uB; uniform vec3 uGold, uKey; varying vec2 vQ;
        void main(){
          float r = length(vQ); vec2 n = vQ / max(r, 1e-4);
          float c2 = (n.x * n.x - n.y * n.y) * .921 - 2. * n.x * n.y * .389, s2 = 2. * n.x * n.y * .921 + (n.x * n.x - n.y * n.y) * .389;
          float ray = .24 + .74 * pow(clamp(abs(c2), 0., 1.), 9.) + .36 * pow(clamp(abs(s2), 0., 1.), 9.), R = ray * uB;
          float al = 1. - aastep(R, r);
          bool cut = al < .02;                                // decided here, made after the last filtered edge below
          vec3 c = mix(uKey, uPaper, 1. - aastep(R - .05, r));
          c = mix(c, uGold, 1. - aastep(.17 * uB, r));
          c = mix(c, uPaper, 1. - aastep(.09 * uB, r));
          if (cut) discard;
          gl_FragColor = vec4(c, al);
        }`, { uAt: new V3(tower.x, tower.top, tower.z), uB: { value: 0 }, uGold: nt(ink.gold), uKey: mixc(ink.violet, ink.cocoa, 0.25) }, { side: THREE.DoubleSide, a2c: true }), 5);
    }
    const beat = (t, rise, hold, fade) => smoothstep(0, rise, t) * (1 - smoothstep(hold, hold + fade, t));   // an envelope in seconds
    await ctx.yield();

    // ---- the script: everything below is a function of u (ambient loops of time) --------------------------------
    const lobeA = (a) => 9 * Math.sin(a * 0.043 + 1.3) + 4 * Math.sin(a * 0.117 + 4.1) + 1.6 * Math.sin(a * 0.31);
    const lobeB = (a) => 7 * Math.sin(a * 0.051 + 2.1) + 3 * Math.sin(a * 0.137 + 0.7) + 1.2 * Math.sin(a * 0.37);
    const edgeD = (uu, ahead, nx, nz, lobe) => { pathFrame(uu * L, fr); const px = fr.x + fr.tx * ahead, pz = fr.z + fr.tz * ahead; return -(nx * px + nz * pz + lobe(-nz * px + nx * pz)); };
    const cl = Math.hypot(cellDirW.x, cellDirW.z) || 1, nAx = cellDirW.x / cl, nAz = cellDirW.z / cl;
    const U_SHADOW = 0.345, U_GOLD = 0.815;
    const dA0 = edgeD(U_SHADOW - 0.005, 9, nAx, nAz, lobeA), dB0 = edgeD(U_GOLD, 10, aX, aZ, lobeB);
    const hares = [0.075, 0.17, 0.262, 0.44, 0.765, 0.875].map((u0, i) => ({ D0: (u0 + br.range(-0.008, 0.008)) * L, side: i % 2 ? -1 : 1, ahead: br.range(7, 10) * 0.62, zig: br.range(0, 1) }));
    const tri = (x) => Math.abs(((x % 1) + 1) % 1 - 0.5) * 4 - 1;
    const harePos = (h, D, out) => {
      const run = Math.max(0, D - h.D0), lat = h.side * (2.5 + run * 0.13 + 1.3 * tri(run / 8 + h.zig) * Math.min(1, run / 3));
      pathFrame(h.D0 + h.ahead + run * 0.74, fr); out.x = fr.x - fr.tz * lat; out.z = fr.z + fr.tx * lat; return run;
    };
    for (const d of doves) { pathFrame(d.s, fr); d.fx = fr.tx; d.fz = fr.tz; d.giant = Math.abs(d.s - L) < 6; if (d.giant) { d.at = br.range(46, 70); d.sp = br.range(-3, 4); d.up = br.range(1.6, 4.4); d.dir = ((d.p[3] - E1x) * rX + (d.p[4] - E1z) * rZ < 0 ? -1 : 1) * (0.2 + Math.abs(d.dir)); } }
    const hawkF = { x: hawkSpec.tx, z: hawkSpec.tz }, HB = 0.05 * L + 2.4;   // the stack breaks 2.4 m after the u 0.05 frame
    const camP = new V3(), hp0 = { x: 0, z: 0 }, hp1 = { x: 0, z: 0 };
    const frontW = new V3(), hawkW = new V3(hawkSag.tip[0], hawkSag.tip[1] + 1.0, hawkSag.tip[2]);
    // the wall comes down the bed at a bore's 3.8 m/s, so it stands 60 m off as we drop in (u 0.645) and is abeam,
    // mid-channel, just as we top the far bank (uPass); its near edge trails 6 m, which keeps it 8 m clear of us
    const V_FRONT = 3.8, frontZ = (u) => -2 + V_FRONT * DUR * (u - uPass);
    const frontAt = (time, u) => { const fz = clamp(frontZ(u), -150, 60), lx = W.centerX(fz); return frontW.set(lx * cT + fz * sT + Hx, 3.6, -lx * sT + fz * cT + Hz); };
    const hawkAt = () => hawkW, gateW = new V3(E1x, CREST + EYE + 1.5, E1z);
    const rainBase = weather === 'virga' ? 0.14 : season === 'may' ? 0 : 1;
    const angLerp = (a, b, t) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * t; };

    const update = (dt, time, camera, uIn) => {
      const u = clamp(uIn ?? 0, 0, 1), D = u * L;
      camP.setFromMatrixPosition(camera.matrixWorld);
      // the hero: flood front, rain, anvil, the zigzag that starts the bolt, and the two edges of the cell's shadow
      hero.setFrontZ(frontZ(u)); printU.value = D;
      const rainA = rainBase * (0.66 * smoothstep(0.38, 0.56, u) - 0.2 * bell(u, 0.57, 0.76, 0.3) - 0.3 * smoothstep(0.74, 0.92, u));
      hero.setRain(rainA); hero.setAnvil(0.3 + 0.6 * u);
      const zz = smoothstep(0.007, 0.012, u) * (1 - smoothstep(0.026, 0.038, u));
      hero.setBolt(zz > 0.01 ? zz : -1, 1);
      hero.setShadow(nAx, nAz, dA0 + 470 * (u - U_SHADOW), 1);
      hero.setShadowB(aX, aZ, dB0 + 300 * (u - U_GOLD), 1);
      hero.update(dt, time, camera);
      for (const f of followers) { f.position.copy(camP); f.updateMatrixWorld(); }
      cumulus.forEach((c, i) => {
        const az = c.az + time * 0.0012, ce = Math.cos(c.el);
        c.m.position.set(camP.x + Math.sin(az) * ce * 2600, camP.y + Math.sin(c.el) * 2600 - 40, camP.z - Math.cos(az) * ce * 2600); c.m.lookAt(camP); c.m.updateMatrixWorld();
        const drift = ((time * 5 + c.ph) % 170) - 85, pv = puffV[i];
        if (i === 2 && u > 0.66) pv.set(E1x + aX * 75 + rX * drift, E1z + aZ * 75 + rZ * drift, c.r * 1.3, 1);
        else { pathFrame(c.s, fr); pv.set(fr.x + drift, fr.z + 12 * Math.sin(i * 2.1), c.r, 1); }
      });

      // the herd
      const dry = 1 - 0.85 * smoothstep(0.1, 0.5, rainA);
      for (let i = 0; i < NH; i++) {
        const a = herd[i], s = a.sOf(D), run = s - a.s0;
        const x = sample(a.X, s), z = sample(a.Z, s), y = sample(a.Y, s), air = sample(a.AIR, s);
        const gw = smoothstep(0.2, 5, run), alert = smoothstep(a.Db - 7, a.Db - 2.5, D);
        const yawT = Math.atan2(sample(a.X, s + 0.7) - x, sample(a.Z, s + 0.7) - z), yaw = angLerp(a.wob * 2.2 - 1.5, yawT, smoothstep(0, 3.5, run));
        const pitch = -Math.atan2(sample(a.Y, s + 0.7) - sample(a.Y, s - 0.7), 1.4) * (air > 0.01 ? 1 : 0.5);
        const npStand = a.graze ? -(1 - alert) * (0.8 + 0.2 * Math.sin(time * 1.3 + a.wob * 5)) : 0.05 * Math.sin(time * 0.8 + a.wob);
        prong.set(i, x, y, z, yaw, pitch, a.scale, Math.max(alert, gw), a.kind, sample(a.PH, s), gw, air, lerp(npStand, 1, gw), air > 0.01 ? (s < a.sIn || s > a.sOut ? AP : 0) : y);
        const k0 = Math.floor((s - 0.8) / 3.5);
        for (let j = 0; j < 6; j++) {
          const sj = (k0 - j) * 3.5, o = (i * 6 + j) * 4, age = (s - sj) / 21, ok = sj > a.s0 + 2 && sample(a.AIR, sj) < 0.05 && gw > 0.5;
          const hsh = Math.abs(Math.sin(sj * 12.9898 + i * 78.233) * 43758.5453) % 1;
          puffI[0].array[o] = ok ? sample(a.X, sj) + (hsh - 0.5) * 0.5 : 0; puffI[0].array[o + 1] = ok ? sample(a.Y, sj) : -50; puffI[0].array[o + 2] = ok ? sample(a.Z, sj) : 0;
          puffI[0].array[o + 3] = ok ? (0.3 + 0.62 * Math.sqrt(age)) * a.scale * dry * (0.8 + 0.4 * hsh) : 0;
          puffI[1].array[o] = age; puffI[1].array[o + 1] = hsh; puffI[1].array[o + 2] = 0;
        }
      }
      prong.flush();
      // jackrabbits flushing from the bursage, and the roadrunner across the start
      hares.forEach((h, i) => {
        const run = harePos(h, D, hp0); harePos(h, D + 0.6, hp1);
        const gone = run > 62 || D < h.D0 - 70, gw = run > 0 ? 1 : 0, ph = run / 1.7, y = heightAt(hp0.x, hp0.z);
        const yaw = run > 0 ? Math.atan2(hp1.x - hp0.x, hp1.z - hp0.z) : h.zig * 6;
        hare.set(i, hp0.x, y + 0.26 * Math.abs(Math.sin(ph * Math.PI)) * gw, hp0.z, yaw, -0.25 * Math.cos(ph * Math.PI * 2) * gw, gone ? 0 : 1.6, 1, 0, ph, gw, 0.35 * gw, run > 0 ? 0.3 : 0, y);
      });
      hare.flush();
      {
        pathFrame(9 + 0.263 * D, fr); const lat = -5 + 0.351 * D, x = fr.x - fr.tz * lat, z = fr.z + fr.tx * lat, y = heightAt(x, z), gw = smoothstep(0, 1.5, D);
        runner.set(0, x, y, z, Math.atan2(fr.tx * 0.6 - fr.tz * 0.8, fr.tz * 0.6 + fr.tx * 0.8), 0, D > 48 ? 0 : 1.25, 0, 0, (D * 0.5) / 0.42, gw, 0, 0.6, y);
        runner.flush();
      }
      // hawks: three back-stand in a stack on the low arm; as we come up they break across the path ahead of us
      let hx = 0, hy = 0, hz = 0;
      for (let i = 0; i < 3; i++) {
        const t = hawkSag.tip, x = D - HB - i * 1.3, o = i * 4, yc = t[1] + 0.34 + i * 0.66;
        let px = t[0], py = yc, pz = t[2];
        perchI[0].array[o] = px; perchI[0].array[o + 1] = yc + (i === 2 ? 0.015 * Math.sin(time * 2.3) : 0); perchI[0].array[o + 2] = pz; perchI[0].array[o + 3] = x <= 0 ? 0.64 : 0;
        perchI[1].array[o] = -1; perchI[1].array[o + 1] = i === 2 ? Math.max(0, Math.sin(time * 0.9)) ** 4 * 0.7 : 0; perchI[1].array[o + 2] = 0.09 * i;
        if (x <= 0) setBird(i, px, py, pz, 0, 0, 1, 0, 0, 0, 0);
        else {
          // keyed to our own advance x: forward faster than we come, across the path to the left, a stoop and then a climb
          const f = 1.34 * x + 2.2 * (1 - Math.exp(-x / 3)), cross = (13 + 3.5 * i) * (1 - Math.exp(-x / (10.5 - 1.5 * i))), k = Math.min(1, x / 2.5);
          const rise = -0.3 * Math.sin(Math.min(x / 4, 1) * Math.PI) * (1 - 0.3 * i) + 2.3 * (1 - Math.exp(-x / 6)) + 0.0022 * x * x + 0.03 * x;
          px = t[0] + hawkF.x * f + hawkF.z * cross; pz = t[2] + hawkF.z * f - hawkF.x * cross; py = yc + rise;
          const vf = 1.34 + 0.73 * Math.exp(-x / 3), vc = ((13 + 3.5 * i) / (10.5 - 1.5 * i)) * Math.exp(-x / (10.5 - 1.5 * i));
          const amp = 0.2 + 0.5 * Math.exp(-x / 4);   // they leave the arm climbing steeply, backs and spread wings to us
          setBird(i, px, py, pz, Math.atan2(hawkF.x * vf + hawkF.z * vc, hawkF.z * vf - hawkF.x * vc), amp * Math.sin(time * 8 + i * 2.1) + 0.14, 0, x > 150 ? 0 : 2.8, 0, -0.12 - 1.0 * Math.min(1, x / 3) * Math.exp(-Math.max(0, x - 9) / 8), -Math.min(0.38, 0.7 * vc) * k);
        }
        hx += px / 3; hy += py / 3; hz += pz / 3;
      }
      hawkW.set(hx, hy, hz);
      for (const at of perchI) at.needsUpdate = true;
      for (let i = 3; i < 5; i++) {
        pathFrame(D + 36, fr); const an = time * 0.5 + i * Math.PI, cx = fr.x - fr.tz * 13, cz = fr.z + fr.tx * 13;
        setBird(i, cx + Math.cos(an) * 9, camP.y + 11 + (i - 3) * 3.5, cz + Math.sin(an) * 9, Math.atan2(-Math.sin(an), Math.cos(an)), 0.16 + 0.1 * Math.sin(time * 2.2 + i), 0, 1.35, 0, 0, -0.4);
      }
      doves.forEach((d, k) => {
        const i = 5 + k, p = d.p;
        if (night) { setBird(i, p[0] + Math.cos(time * 2.1 + d.ph) * 1.7, p[1] + 0.7 + 0.5 * Math.sin(time * 3.3 + d.ph), p[2] + Math.sin(time * 1.7 + d.ph * 2) * 1.7, time * 2 + d.ph, 0.9 * Math.sin(time * 24 + d.ph), 0, 0.42, 2, 0, 0); return; }
        if (k >= 12 && k < 20) { // a loose flock always on the wing near us
          pathFrame(D + 24 + d.up * 2, fr); const an = time * (0.8 + 0.25 * d.dir) + d.ph, rr = 5 + d.up, lat = d.dir * 15;
          setBird(i, fr.x - fr.tz * lat + Math.cos(an) * rr, camP.y + 1.2 + d.up + Math.sin(an * 2) * 0.6, fr.z + fr.tx * lat + Math.sin(an) * rr, Math.atan2(-Math.sin(an), Math.cos(an)), 0.95 * Math.sin(time * 16 + d.ph), 0, 0.8, 1, -0.1, -0.5); return;
        }
        const tau = Math.min((D - (d.s - d.at)) / 18.25, 8);
        if (tau <= 0) setBird(i, p[0] + d.off[0], p[1] + 0.06, p[2] + d.off[1], d.yaw, 0, 1, 0.5, 1, 0.35 + 0.4 * Math.sin(time * 3 + d.ph), 0);
        else {
          const f = d.sp * tau, sd = d.dir * 5 * tau, rx = -d.fz, rz = d.fx;
          setBird(i, p[0] + d.fx * f + rx * sd, p[1] + d.up * tau - 0.2 * tau * tau, p[2] + d.fz * f + rz * sd, Math.atan2(d.fx * d.sp + rx * d.dir * 5, d.fz * d.sp + rz * d.dir * 5), 0.95 * Math.sin(time * 17 + d.ph), 0, d.giant ? 1.7 : 1.1, 1, -0.3, 0);
        }
      });
      peckers.forEach((w, k) => { const pk = Math.max(0, Math.sin(time * 6 + w.ph)) * (Math.sin(time * 0.7 + w.ph) > 0 ? 1 : 0); setBird(5 + NDOVE + k, w.x, w.y, w.z, w.yaw, 0, 1, 0.95, 3, -1.35 + 0.3 * pk, 0); });
      // the towering saguaro's doves: on its crowns until the stroke, off them t0 seconds after it, away down the route
      const ts = (u - U_STRIKE) * DUR;
      towerDoves.forEach((d, j) => {
        const i = 5 + NDOVE + 6 + j, p = d.p;
        if (night) { setBird(i, p[0] + Math.cos(time * 2.1 + d.ph) * 1.7, p[1] + 0.7 + 0.5 * Math.sin(time * 3.3 + d.ph), p[2] + Math.sin(time * 1.7 + d.ph * 2) * 1.7, time * 2 + d.ph, 0.9 * Math.sin(time * 24 + d.ph), 0, 0.42, 2, 0, 0); return; }
        const tau = ts - d.t0;
        if (tau <= 0) setBird(i, p[0] + d.off[0], p[1] + 0.06, p[2] + d.off[1], d.yaw, 0, 1, 0.5, 1, 0.35 + 0.4 * Math.sin(time * 3 + d.ph), 0);
        else {
          const tv = Math.min(tau, d.up / 0.4), f = d.sp * tau, sd = d.dir * 5 * tau, rx = -d.fz, rz = d.fx;
          setBird(i, p[0] + d.fx * f + rx * sd, p[1] + d.up * tv - 0.2 * tv * tv, p[2] + d.fz * f + rz * sd, Math.atan2(d.fx * d.sp + rx * d.dir * 5, d.fz * d.sp + rz * d.dir * 5), 0.95 * Math.sin(time * 17 + d.ph), 0, tau > 14 ? 0 : 2.0, 1, -0.3, 0);
        }
      });
      for (const at of birdI) at.needsUpdate = true;
      // the rare bolt
      const rf = rare ? smoothstep(0.786, 0.793, u) * (1 - smoothstep(0.816, 0.836, u)) : 0, g = rare ? clamp((u - 0.796) / 0.035, 0, 1) : 0;
      boltMesh.visible = rf > 0.01; boltMesh.material.uniforms.uF.value = rf;
      _e.set(0, 2.4, -g * 1.45, 'YXZ'); _q.setFromEuler(_e); _s.set(1.15, 1.15, 1.15);
      _m4.compose(_a.set(strikeSag.x + g * 0.8, strikeSag.y + 5.2 - (5.0 * g * g), strikeSag.z + g * 0.6), _q, _s); armMesh.setMatrixAt(0, _m4); armMesh.instanceMatrix.needsUpdate = true;
      for (let j = 0; j < 4; j++) {
        const o = (NH * 6 + j) * 4, age = rare ? clamp((u - 0.796 - j * 0.004) / 0.05, 0, 1) : 0, on = age > 0 && age < 1;
        puffI[0].array[o] = strikeSag.x + (j - 1.5) * 0.9 * (1 + age); puffI[0].array[o + 1] = on ? strikeSag.top - 2.4 + j * 0.5 + age * 2.2 : -50; puffI[0].array[o + 2] = strikeSag.z + (j % 2) * 1.0;
        puffI[0].array[o + 3] = on ? 1.7 + 2.6 * Math.sqrt(age) : 0; puffI[1].array[o] = age * 0.9; puffI[1].array[o + 1] = j * 0.37; puffI[1].array[o + 2] = 1;
      }
      // THE BOLT on the towering saguaro, in seconds from the stroke (ts): the zigzag rises in 0.1 s, holds a quarter of
      // a second and fades in 0.4 (the design's clock for its lightning; never a full-frame flash), and the burst at the
      // crown lives on the same envelope; the trunk is printed cream while the stroke shows, the crown charred after; the arm
      // cracks at 0.15 s, hinges over until 0.9 s and is down by 2.2 s; steam rolls off the crown, then dust where the arm lands
      {
        const hold = beat(ts, 0.1, 0.35, 0.4), bf = hold * (0.82 + 0.18 * Math.cos(ts * 16.5));
        strokeMesh.material.uniforms.uF.value = bf;
        strikeU.value.z = bf * 0.9; strikeU.value.w = smoothstep(0.1, 0.7, ts);
        burstMesh.material.uniforms.uB.value = hold * (0.85 + 0.15 * Math.cos(ts * 16.5));
        const g1 = clamp((ts - 0.15) / 0.75, 0, 1), g2 = clamp((ts - 0.9) / 1.3, 0, 1), e1 = g1 * g1 * (3 - 2 * g1), gy = smoothstep(0, 1, g2);
        const adx = lerp(tower.dx, tower.dxB, gy), adz = lerp(tower.dz, tower.dzB, gy), out = 0.3 + 1.3 * g2;
        _e.set(0, angLerp(tower.yaw, tower.yawB, gy), -(0.95 * e1 + 0.62 * g2 + 0.05 * Math.sin(g1 * 9) * (1 - g2)), 'YXZ'); _q.setFromEuler(_e); _s.set(1.3, 1.3, 1.3);
        _m4.compose(_a.set(tower.x + adx * out, tower.armY - (tower.armY - tower.y - 3.6) * g2 * g2, tower.z + adz * out), _q, _s); towerArm.setMatrixAt(0, _m4); towerArm.instanceMatrix.needsUpdate = true;
        for (let j = 0; j < 9; j++) {
          const o = (NH * 6 + 13 + j) * 4; let x = 0, y = -50, z = 0, sz = 0, age = 0, cream = 0;
          if (j < 4) { // steam rolling off the crown, down the wind
            age = clamp((ts - 0.3 - j * 0.25) / 2.6, 0, 1);
            if (age > 0 && age < 1) { x = tower.x + (j - 1.5) * 1.1 * (1 + age) - nAx * age * 6; y = tower.top - 3 + j * 0.8 + age * 4.5; z = tower.z + (j % 2) * 1.2 - nAz * age * 6; sz = 1.0 + 1.7 * Math.sqrt(age); cream = 1; }
          } else { // dust where the arm comes down
            const k = j - 4; age = clamp((ts - 2.15 - k * 0.07) / 1.3, 0, 1);
            if (age > 0 && age < 1) { const r = 1.6 + 1.5 * k; x = tower.x + tower.dxB * r + (k % 2 ? 0.9 : -0.9) * age; y = tower.y; z = tower.z + tower.dzB * r + (k % 2 ? -0.7 : 0.7) * age; sz = 0.8 + 1.4 * Math.sqrt(age); }
          }
          puffI[0].array[o] = x; puffI[0].array[o + 1] = y; puffI[0].array[o + 2] = z; puffI[0].array[o + 3] = sz;
          puffI[1].array[o] = age * 0.9; puffI[1].array[o + 1] = (j * 0.37) % 1; puffI[1].array[o + 2] = cream;
        }
      }
      for (let k = 0; k < 9; k++) {
        const o = (NH * 6 + 4 + k) * 4;
        puffI[0].array[o] = devil.x + Math.sin(time * 1.1 + k * 0.7) * (0.5 + k * 0.4) + 8 * Math.sin(time * 0.05); puffI[0].array[o + 1] = devil.y + k * 3.1 - 1; puffI[0].array[o + 2] = devil.z + Math.cos(time * 0.9 + k) * (0.4 + k * 0.3);
        puffI[0].array[o + 3] = 2.3 + k * 0.9; puffI[1].array[o] = 0.12; puffI[1].array[o + 1] = (Math.floor(time * 2.5 + k * 0.37) % 2) * 0.9; puffI[1].array[o + 2] = 0;
      }
      for (const at of puffI) at.needsUpdate = true;
    };
    // (round 15, third pass) THE HEAP'S DARK INK: one rule for all eight looks. The flood's dark ink (the shade of the
    // heap's domes, the dark ripple band of the ribbon and of the water laid over it, and the flotsam's sticks; the
    // hero's ink table: by day cocoa under six tenths of the violet overprint, by night cocoa times violet times 1.6,
    // which came out blacker than anything else in the night's print) is never darker than the darkest ink the look
    // prints anywhere else. Now that every
    // material of the look is made, the darkest ink among all their ink uniforms is found (by luminance; the flood's
    // dark itself aside, and unset black aside), and if the flood's dark is darker it is lifted to that luminance,
    // its hue kept. By day the look prints darker inks than the flood's dark (the bats', the plants' holes), so
    // nothing changes; by night the darkest other ink is the plants' hole ink and the dark comes up by about six tenths.
    {
      const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
      let darkest = Infinity;
      scene.traverse((o) => {
        for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) {
          for (const k in m.uniforms || {}) { const v = m.uniforms[k].value; if (v && v.isColor && v !== ink.floodDark && lum(v) > 0) darkest = Math.min(darkest, lum(v)); }
        }
      });
      const l = lum(ink.floodDark);
      if (l > 0 && l < darkest && darkest < Infinity) ink.floodDark.multiplyScalar(darkest / l);
    }
    update(0, 0, { matrixWorld: new THREE.Matrix4().makeTranslation(pts[0][0], pts[0][1], pts[0][2]) }, 0);

    return {
      scene, path, duration: DUR, ride: 'none', style: 'none',
      title: night ? 'Monsoon Night over the Saguaros' : weather === 'haboob' ? 'Haboob over the Saguaros' : 'Monsoon over the Saguaros',
      camera: { fov: 62, near: 0.3, far: 6000, lookAhead: 24, sway: 0.5, bank: 0.5 },
      pois: [{ at: hawkAt, from: 0, to: 0.1, weight: 0.46 }, { at: frontAt, from: 0.53, to: 0.77, weight: 0.6 }, { at: gateW, from: 0.735, to: 0.94, weight: 0.5 }],
      portal: { shape: 'arch', width: 10, height: 10, color: '#F2E4C4', glow: 0.55, revealDistance: 300 },
      post: { exposure: 1, bloom: { strength: 0.05, radius: 0.3, threshold: 1 },
        grade: { saturation: 1.06, contrast: 1.02, tint: '#ffffff', shadowTint: '#000000', vignette: 0.12, grain: 0.03, aberration: 0 } },
      update,
      dispose() { trackHash.clear(); },
    };
  },
};
