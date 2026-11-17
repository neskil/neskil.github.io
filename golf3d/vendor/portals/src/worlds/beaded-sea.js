// THE BEADED SEA: an ocean that never pooled. It hangs in bright air as trembling globes of seawater,
// each a lens holding the sky upside down, high above a white dry seabed. Built round the Mother Globe
// (src/parts/beaded-sea.js): up her eastern flank, through the Lantern, along the liquid bridge as it
// parts into beads, round the Daughter and into the Pearl.
import * as THREE from 'three';
import { makePath, smoothstep as sstep, clamp, lerp } from '../kit/core.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildHero, makeWaterMat, GLSL_COMMON, icoGeo } from '../parts/beaded-sea.js';

const HERO_AT = new THREE.Vector3(-330, 0, 560);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const C = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);

// Hours: sky, light and exposure. sun = direction TOWARD the light (the moon at night).
const HOURS = {
  day: { sun: [0.567, 0.788, -0.234], zen: '#5C86C4', mid: '#BFF3EA', haze: '#EDEBDD', gSun: '#D8D4C6', gShade: '#8E9CC6', sunCol: ['#F7D774', 1.6],
    fog: '#CFEDE6', fogD: 0.00030, exposure: 1.0, water: 1, stars: 0, tint: '#ffffff', shadowTint: '#0a1030' },
  golden: { sun: [0.93, 0.21, -0.30], zen: '#4F6FB2', mid: '#F3C7A2', haze: '#FFD2A0', gSun: '#E6B58C', gShade: '#84699C', sunCol: ['#FFA050', 2.2],
    fog: '#F6C9A2', fogD: 0.00034, exposure: 0.98, water: 0.92, stars: 0, tint: '#fff1e0', shadowTint: '#1a0c30' },
  dawn: { sun: [0.97, 0.13, 0.12], zen: '#7B91C8', mid: '#E6BCCB', haze: '#F2D3CE', gSun: '#D6C1C2', gShade: '#8F88B8', sunCol: ['#FFC2A6', 1.3],
    fog: '#E9C9D0', fogD: 0.00034, exposure: 0.9, water: 0.95, stars: 0, tint: '#fff4f4', shadowTint: '#140e30' },
  night: { sun: [0.62, 0.72, -0.31], zen: '#0E1840', mid: '#1F3162', haze: '#384A82', gSun: '#7682AE', gShade: '#2C3562', sunCol: ['#CFE0FF', 0.9],
    fog: '#2F4074', fogD: 0.00030, exposure: 1.6, water: 0.34, stars: 1, tint: '#eaf0ff', shadowTint: '#060a24' },
};
// Water: [turquoise, deep, pale, cream, heart colour, gold, indigo] in the brief's palette order.
const WATERS = {
  turquoise: ['#19B5B0', '#0E6F8E', '#BFF3EA', '#F4F1E6', '#FF8A5C', '#F7D774', '#3B4A7A'],
  glass: ['#2FB592', '#0E6A5E', '#CBF3DE', '#F4F1E6', '#D9C24E', '#F7D774', '#35507A'],
  jade: ['#63CDB2', '#2A8C88', '#DDF7EC', '#F4F1E6', '#FF7FA6', '#F7D774', '#4A4A86'],
};
const CASTS = {
  sailfish: { len: 1.6, sail: 1.0, body: 0.16, fins: 0, col: '#DCE8EE', sailCol: '#9FD8E8' },
  squid: { len: 1.5, sail: 0.25, body: 0.2, fins: 1, col: '#F3D3CC', sailCol: '#FF9E88' },
  needle: { len: 2.1, sail: 0.3, body: 0.08, fins: 0, col: '#CFE6F2', sailCol: '#8FC3E6' },
};

export default {
  id: 'beaded-sea',
  name: 'The Beaded Sea',
  category: 'alien',
  weirdness: 0.7,
  media: ['air'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const plenty = (n) => Math.max(1, Math.round(n * detail * (0.75 + 0.25 * dens)));
    // ---- the seeded look ----
    const vr = rng.fork('look');
    const hourPick = rng.fork('beads').pick(['day', 'day', 'day', 'golden', 'golden', 'dawn', 'night']);
    const hourId = ({ dawn: 'dawn', day: 'day', golden: 'golden', night: 'night' })[vary.hour] || hourPick;
    const H = HOURS[hourId];
    const waterId = vr.pick(['turquoise', 'turquoise', 'glass', 'jade']);
    const pal = WATERS[waterId];
    const breeze = vr.chance(0.5);
    const castId = vr.pick(['sailfish', 'sailfish', 'squid', 'needle']);
    const cast = CASTS[castId];
    const pelicans = vr.chance(0.35);
    const sailHex = vr.pick(['#F4F1E6', '#F4F1E6', '#F2B544', '#4A5AA0']);
    const nBoats = vr.int(8, 12);
    const rare = !!vary.rare;
    const scene = new THREE.Scene();
    const fogCol = C(H.fog);
    scene.fog = new THREE.FogExp2(fogCol.clone(), H.fogD);
    scene.background = fogCol.clone();
    const ups = [];            // (dt, time, camera, u) => void
    const camW = new THREE.Vector3();      // the rendering camera's world position, refreshed at the top of update()
    const toDispose = [];

    // ---- the path (world space = the brief's coordinates) ----
    // Past the Moon, up the Mother's flank, through the Lantern, north across open air to meet the 320 m bridge with
    // its beads ahead, round the Daughter 20 m off her skin and straight into the Pearl. The length is held at
    // 1,316.7 m, so every moment before the Lantern keeps its u.
    const PEARL = V3(162.9, 415.4, 1175.8), PEARL_R = 15;
    const exitDir = V3(0.766, 0.052, 0.643).normalize();
    const S1 = PEARL.clone().addScaledVector(exitDir, -130), S2 = PEARL.clone().addScaledVector(exitDir, -65);
    const path = makePath([
      [0, 340, 0], [1, 340, 65], [5, 341, 130], [-6, 346, 195], [-22, 355, 265], [-31, 357, 410], [-46, 357, 545],
      [-64, 380, 655], [-95, 398, 735], [-95.9, 409, 825.8], [-101.3, 411, 879.6], [-100.5, 411, 927.8], [-80.6, 410, 976], [-46.8, 409, 1020.3], [6.2, 409, 1049.8], [54, 408, 1084.4],
      S1, S2, PEARL,
    ]);
    const SUN = V3(...H.sun).normalize();

    // ---- the hero ----
    await ctx.yield();
    const hero = await buildHero(ctx, { palette: pal, detail, boats: nBoats, sail: sailHex, breeze, bellyGain: 0.6 + 0.75 * H.water,
      timing: { thin: [0.565, 0.66], bead: [0.575, 0.665], recoil: [0.635, 0.72] } });
    hero.object.position.copy(HERO_AT);
    scene.add(hero.object);
    hero.setSun(SUN);
    const S = hero.uniforms;
    S.uSkyZen.value.copy(C(H.zen)); S.uSkyMid.value.copy(C(H.mid)); S.uSkyHaze.value.copy(C(H.haze));
    S.uGroundSun.value.copy(C(H.gSun)); S.uGroundShade.value.copy(C(H.gShade)); S.uSunCol.value.copy(C(H.sunCol[0], H.sunCol[1]));
    if (H.water < 1) {      // dusk and night: the water itself darkens toward indigo, the reef's glow stays
      const ind = C(pal[6], 0.5);
      for (const k of ['uShallow', 'uDeep', 'uPale']) S[k].value.lerp(ind, (1 - H.water) * 0.75).multiplyScalar(lerp(0.75, 1, H.water));
    }
    const A = hero.anchors;
    const W = (v) => v.clone().add(HERO_AT);
    const MOTHER_C = W(A.motherCentre), LANTERN_C = W(A.lanternCentre), DAUGHTER_C = W(A.daughterCentre);
    const BR_A = W(A.bridgeA), BR_B = W(A.bridgeB);
    // The fleet is keyed to u, not to the clock (6 m/s at the flight's own pace): one boat is always 60 m ahead of the
    // lens on her equator at u 0.43, in profile, whatever the world time was at the entry. The gaze can then follow it calmly.
    const BC = A.boatCircle, ph0 = BC.phases.slice(), U_BOAT = 0.43, BOAT_RATE = BC.angularSpeed * 44;
    let boatK = 0, boatC = 0;
    { const pc = path.pointAt(U_BOAT).sub(HERO_AT).sub(BC.centre), want = Math.atan2(pc.dot(BC.v), pc.dot(BC.u)) - 70 / BC.radius;
      let best = 9;
      for (let i = 0; i < nBoats; i++) { let d = (want - ph0[i]) % 6.2831853; if (d > Math.PI) d -= 6.2831853; if (d < -Math.PI) d += 6.2831853; if (Math.abs(d) < best) { best = Math.abs(d); boatK = i; boatC = d; } } }
    const fleetLon = (u) => boatC + BOAT_RATE * (u - U_BOAT);
    const boatAt = (u, out) => { const lo = ph0[boatK] + fleetLon(u);
      return out.copy(BC.u).multiplyScalar(Math.cos(lo)).addScaledVector(BC.v, Math.sin(lo)).multiplyScalar(BC.radius + 9).add(BC.centre).add(HERO_AT); };
    ups.push((dt, time, camera, u) => { hero.setFleetLongitude(fleetLon(u) + 0.004 * Math.sin(time * 0.5)); hero.setProgress(u); hero.update(dt, time, camera); });
    await ctx.yield();

    // ---- sky dome: the very sky the globes hold upside down ----
    const skyMat = new THREE.ShaderMaterial({
      uniforms: { uTime: S.uTime, uSun: S.uSun, uSunCol: S.uSunCol, uSkyZen: S.uSkyZen, uSkyMid: S.uSkyMid, uSkyHaze: S.uSkyHaze,
        uGroundSun: S.uGroundSun, uGroundShade: S.uGroundShade, uStars: { value: H.stars } },
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: GLSL_COMMON + /* glsl */`
        uniform float uStars; varying vec3 vD;
        void main(){
          vec3 d = normalize(vD);
          vec3 c = skyCol(normalize(vec3(d.x, max(d.y, 0.002), d.z)));
          float s = max(dot(d, uSun), 0.);
          float s4 = s * s * s * s; float s16 = s4 * s4 * s4 * s4;
          c += uSunCol * (s16 * s16 * 0.10 + s4 * 0.03);
          vec2 sp = d.xz / max(d.y + 0.35, 0.05) * 170.;
          float st = step(0.985, h21(floor(sp))) * (1. - smoothstep(0.1, 0.45, length(fract(sp) - .5)));
          c += vec3(0.8, 0.9, 1.2) * st * uStars * smoothstep(0.05, 0.4, d.y) * (0.6 + 0.4 * sin(uTime * 2. + h21(floor(sp) + 7.) * 40.));
          gl_FragColor = vec4(c, 1.);
        }`,
      side: THREE.BackSide, depthWrite: false, depthTest: true, fog: false,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(6000, 32, 20), skyMat);
    sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
    ups.push(() => { sky.position.copy(camW); });

    // ---- the dry seabed: a salt plain crazed into polygons, terraces, drifting salt veils ----
    S.uSkyHaze.value.copy(fogCol);
    const GROUND_GLSL = /* glsl */`
      vec2 h22(vec2 p){ return vec2(h21(p), h21(p + 17.31)); }
      vec3 vor(vec2 x, out vec2 en){                     // x = edge distance, y = cell id, z = centre distance; en = unit normal of the nearest edge
        vec2 n = floor(x), f = fract(x), mg = vec2(0.), mr = vec2(0.); float md = 8.; en = vec2(1., 0.);
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 g = vec2(float(i), float(j)); vec2 r = g + h22(n + g) - f; float d = dot(r, r);
          if (d < md) { md = d; mr = r; mg = g; } }
        float me = 8.;
        for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
          vec2 g = mg + vec2(float(i), float(j)); vec2 r = g + h22(n + g) - f; vec2 dr = r - mr;
          float l = dot(dr, dr);
          if (l > 1e-4) { vec2 dn = dr / sqrt(l); float e = dot(0.5 * (mr + r), dn); if (e < me) { me = e; en = dn; } } }
        return vec3(me, h21(n + mg), sqrt(max(md, 1e-8)));
      }`;
    const seabedMat = new THREE.ShaderMaterial({
      fog: true,
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: S.uTime, uSun: S.uSun, uSunCol: S.uSunCol, uSkyZen: S.uSkyZen, uSkyMid: S.uSkyMid,
        uSkyHaze: S.uSkyHaze, uGroundSun: S.uGroundSun, uGroundShade: S.uGroundShade, uWind: { value: breeze ? 1 : 0.45 } },
      vertexShader: /* glsl */`varying vec3 vW; varying float vFogDepth;
        void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vec4 mv = viewMatrix * w; vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: GLSL_COMMON + GROUND_GLSL + /* glsl */`
        uniform float uWind; uniform vec3 fogColor; uniform float fogDensity;
        varying vec3 vW; varying float vFogDepth;
        void main(){
          vec2 p = vW.xz;
          float fw = max(fwidth(p.x), fwidth(p.y));
          vec2 q = p + (vec2(vn(p * 0.006), vn(p * 0.006 + 31.7)) - 0.5) * 60.;
          float cell = 26.; vec2 en1, en2;
          vec3 v = vor(q / cell, en1);
          float e = v.x * cell;                                   // metres to the nearest polygon edge
          float w = 0.7 + fw * 1.3;
          float crack = (1. - smoothstep(0., w, e)) * min(1., 0.9 / max(w, 1e-3) + 0.25);
          float lip = (1. - smoothstep(w, w * 4. + 2., e)) * (1. - crack);
          // the great polygons: pressure ridges 120 m apart, a bright rim on the side that faces the sun and a
          // shadow lying off the other, so the plain reads as relief from 400 m up
          vec3 vb = vor(q / 118. + 11.7, en2);
          float eb = vb.x * 118.;
          vec2 sxz = uSun.xz / max(length(uSun.xz), 1e-3);
          float low = clamp(1. - uSun.y * 1.15, 0., 1.);
          float face = dot(-en2, sxz);                            // +1 where this flank of the ridge faces the sun
          float wB = 1.6 + fw * 1.2;
          float rim = (1. - smoothstep(0., wB * 1.6, eb)) * smoothstep(-0.25, 0.5, face);
          float lee = (1. - smoothstep(wB, wB + 6. + 30. * low, eb)) * smoothstep(0.05, 0.6, -face);
          float trough = 1. - smoothstep(0., wB * 0.7, eb);
          float tone = fbm2(p * 0.0016 + 3.1);                    // big salt drifts
          float mott = fbm2(p * 0.021);
          vec3 col = uGroundSun * (0.86 + 0.16 * tone + 0.06 * (v.y - 0.5) + 0.07 * (vb.y - 0.5) + 0.05 * (mott - 0.5));
          col = mix(col, uGroundSun * vec3(1.0, 0.985, 0.95) * 1.06, lip * 0.6);
          col = mix(col, uGroundShade * 0.8, crack * 0.75);
          col = mix(col, uGroundShade * 0.86, lee * (0.34 + 0.3 * low));
          col = mix(col, uGroundShade * 0.7, trough * (1. - rim) * 0.45);
          col += (uGroundSun * 0.22 + uSunCol * 0.05) * rim;
          // five dry reef terraces curving for kilometres: a sunlit lip and a periwinkle shadow band, each step a shade paler
          float r = length(p - vec2(2300., 380.)) + (fbm2(p * 0.004) - 0.5) * 90.;
          float sunSide = clamp(uSun.x / max(uSun.y, 0.12), -6., 6.);
          for (int i = 0; i < 5; i++) {
            float d = r - (1300. + float(i) * 270. + float(i * i) * 12.);       // high side is d < 0 (toward the sun)
            float bw = 12. * abs(sunSide) + 10.;
            float band = smoothstep(0., 3., d) * (1. - smoothstep(bw * 0.55, bw, d));
            col = mix(col, uGroundShade * 0.88, band * 0.85);
            col *= 1. + 0.26 * smoothstep(-26., -1., d) * (1. - smoothstep(-1., 1., d));
            col *= 1. - 0.07 * smoothstep(-260., 0., d) * step(d, 0.);
          }
          // lilac shade pooled in the hollows, salt veils blowing along the wind
          col = mix(col, uGroundShade, (1. - smoothstep(0.2, 0.52, tone)) * 0.22);
          vec2 wp = vec2(p.x * 0.0045 - uTime * 0.05 * uWind, p.y * 0.022 + vn(p * 0.003) * 3.);
          float veil = smoothstep(0.52, 0.85, fbm2(wp)) * (0.5 + 0.5 * vn(p * 0.012 - vec2(uTime * 0.6 * uWind, 0.)));
          col += uGroundSun * veil * 0.16 * (0.6 + uWind);
          col *= 0.9 + 0.1 * clamp(uSun.y * 1.6, 0., 1.);
          col += uSunCol * 0.035 * clamp(uSun.y, 0., 1.);
          float fogF = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          gl_FragColor = vec4(mix(col, fogColor, fogF), 1.);
        }`,
    });
    const seabed = new THREE.Mesh(new THREE.PlaneGeometry(13600, 13600).rotateX(-Math.PI / 2), seabedMat);
    seabed.frustumCulled = false; seabed.renderOrder = 0; scene.add(seabed);
    ups.push(() => { seabed.position.set(camW.x, 0, camW.z); });
    // Decals on the plain (shadows multiply, caustics add). Filled as globes and wrecks are placed.
    const shadowList = [], causticList = [];      // [x, z, radius, strength, seed]
    await ctx.yield();

    //@@SEABED
    // ---- the globes: one water shader family (the hero's), instanced in five size classes ----
    const wobK = breeze ? 1.7 : 0.55;
    const wob = (amp, speed) => new THREE.Vector4(amp * wobK, speed * (breeze ? 1.3 : 1), rng.range(0, 6.28), 0);
    wob(0.02, 0.7);                 // (the Moon's draw: the Moon is built by the hero now)
    // stand: painted flecks and blushes fade out within 190 m of the lens, where the water turns clear instead
    const matReef = makeWaterMat(S, 'solid', { wob: wob(0.02, 0.6), abs: 1 / 110, rip: 0.07, thinTeal: 0.4, fleck: 1, heart: 0.6, heartR: 20, stand: 1 });
    const matDark = makeWaterMat(S, 'solid', { wob: wob(0.018, 0.5), abs: 1 / 34, rip: 0.08, thinTeal: 0.2, fleck: 1, bodyGain: 0.5, tiMax: 0.3, ghost: 0.05, stand: 1 });
    const matMid = makeWaterMat(S, 'solid', { wob: wob(0.022, 1.3), abs: 1 / 42, rip: 0.08, thinTeal: 0.5, fleck: 1, stand: 1, near: 1, nearA: 10, nearB: 150, nearTi: 0.62 });
    const matSmall = makeWaterMat(S, 'solid', { wob: wob(0.03, 2.6), abs: 1 / 9, ghost: 0.3, tiMax: 0.55, bodyGain: 1.2, thinTeal: 0.85, spec: 0.6, rip: 0.06, clear: true, steep: 1.8, life: 1, rings: true });
    const matFar = makeWaterMat(S, 'solid', { wob: wob(0.02, 0.5), abs: 1 / 75, rip: 0.03, thinTeal: 0.4, heart: 0.12, heartR: 30 });
    const geo5k = icoGeo(15);
    await ctx.yield();
    const geo1k = icoGeo(7), geo320 = icoGeo(3),
      geo180 = icoGeo(2), geo80 = icoGeo(1), geo720 = icoGeo(5);
    const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
    const instanced = (geo, mat, list, order = 3) => {       // list of [x, y, z, R]
      const mesh = new THREE.InstancedMesh(geo, mat, Math.max(list.length, 1));
      list.forEach((g, i) => {
        _q.setFromEuler(_e.set(rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0, 6.28)));
        mesh.setMatrixAt(i, _m4.compose(_p.set(g[0], g[1], g[2]), _q, _s.setScalar(g[3])));
      });
      mesh.count = list.length; mesh.frustumCulled = false; mesh.renderOrder = order; scene.add(mesh);
      return mesh;
    };
    // keep-out spheres: the hero's bodies, the bridge, the Pearl and its necklace, and everything already placed
    const DARK_C = PEARL.clone().addScaledVector(exitDir, 330).add(V3(10 + 16, 14, -19)), DARK_R = 110;       // (a little east of the line, so it stays clear of the frame while the lens looks along the bead row)
    const rareC = V3(-97, 760, 1152);                                   // where the rare event's two globes become one
    const MOON_C = V3(-62, 345, 150), MOON_R = 45;
    const solids = [[MOTHER_C.x, MOTHER_C.y, MOTHER_C.z, 250], [LANTERN_C.x, LANTERN_C.y, LANTERN_C.z, 30], [DAUGHTER_C.x, DAUGHTER_C.y, DAUGHTER_C.z, 60],
      [PEARL.x, PEARL.y, PEARL.z, 34], [DARK_C.x - 16, DARK_C.y, DARK_C.z + 19, 120], [MOON_C.x, MOON_C.y, MOON_C.z, MOON_R]];       // (the Dark Globe's keep-out as first laid out)
    for (let i = 0; i <= 10; i++) { _p.copy(BR_A).lerp(BR_B, i / 10); solids.push([_p.x, _p.y, _p.z, 26]); }
    const brLen0 = BR_A.distanceTo(BR_B), brDir0 = BR_B.clone().sub(BR_A).normalize();
    const rareA = rareC.clone().add(V3(-90, -7, -45)), rareB = rareC.clone().add(V3(90, 8, 45));       // the two 150 m globes of the rare event
    if (rare) { solids.push([rareC.x, rareC.y, rareC.z, 185]); const k = 512 / Math.max(SUN.y, 0.15); shadowList.push([rareC.x - SUN.x * k, rareC.z - SUN.z * k, 94, 0.8, 0.12]); }
    const free = (x, y, z, R, margin = 8, gap = 3) => {
      if (path.distanceTo(x, y, z) < R + margin) return false;
      for (let i = 0; i < solids.length; i++) {
        const s = solids[i], dx = s[0] - x, dy = s[1] - y, dz = s[2] - z, rr = s[3] + R + gap;
        if (dx * dx + dy * dy + dz * dz < rr * rr) return false;
      }
      // keep the Mother's eastern face and the last straight to the Pearl open
      if (R > 5) {
        const dm = Math.hypot(x - MOTHER_C.x, y - MOTHER_C.y, z - MOTHER_C.z);
        if (dm < 250 + 150 && x > MOTHER_C.x - 60) return false;
        // open sky round the beads and round the Daughter, so the row and her reef are seen against air
        _p.set(x, y, z).sub(BR_A); const ta = clamp(_p.dot(brDir0), 30, brLen0); _p.addScaledVector(brDir0, -ta);
        if (_p.length() < R + 62) return false;
        if (Math.hypot(x - DAUGHTER_C.x, y - DAUGHTER_C.y, z - DAUGHTER_C.z) < 60 + R + 48) return false;
        _p.set(x, y, z).sub(S1); const t = clamp(_p.dot(exitDir), -200, 420); _p.addScaledVector(exitDir, -t);
        if (_p.length() < R + 26) return false;
      }
      return true;
    };
    const gr = rng.fork('globes');
    const place = (n, gen, margin, gap) => {
      const out = [];
      for (let i = 0, tries = 0; i < n && tries < n * 30; tries++) {
        const g = gen(); if (!g || !free(g[0], g[1], g[2], g[3], margin, gap)) continue;
        out.push(g); if (g[3] > 4) solids.push(g); i++;
      }
      return out;
    };
    await ctx.yield();
    // named and near: the entry trio, then companions 9-26 m off the lens the whole way
    const nearList = [[9, 343.5, 17, 3.4], [-12.5, 336, 27, 5], [11.5, 333, 41, 6.4]];
    for (const g of nearList) solids.push(g);
    const _t3 = new THREE.Vector3(), _n3 = new THREE.Vector3();
    const beside = (u, side, off, dy, R) => {                 // a point beside the path: side +1 right, -1 left
      path.pointAt(u, _p); path.tangentAt(u, _t3); _n3.set(_t3.z, 0, -_t3.x).normalize();
      return [_p.x - _n3.x * side * off, _p.y + dy, _p.z - _n3.z * side * off, R];
    };
    // the six scripted shoals: each leaps between two small globes placed for it, bowing over (or under) the lens
    const arcs = [];           // { A, B, H, u0, n, lag }
    const scriptArc = (u0, ahead, len, lift, bowH, flip, endR = 4.4) => {
      const uc = clamp(u0 + ahead / path.length, 0, 1), a = beside(uc, flip, len * 0.5, lift - bowH, endR), b = beside(uc, -flip, len * 0.5, lift - bowH * 0.8, endR * 0.85);
      nearList.push(a, b); solids.push(a, b);
      arcs.push({ A: V3(a[0], a[1], a[2]), B: V3(b[0], b[1], b[2]), H: bowH, u0, n: 74, rA: a[3], rB: b[3] });
    };
    scriptArc(0.03, 14, 40, 6.5, 9, -1);       // entry: left to right just ahead
    scriptArc(0.215, 14, 44, 6.5, 10, 1);
    scriptArc(0.34, 12, 42, 6.8, 11, -1);        // over the lens along the Mother's flank
    scriptArc(0.872, 13, 40, 6.6, 9, -1);       // just past the Daughter
    scriptArc(0.9, 14, 44, -6, -7, 1);         // the last shoal dips under the lens before the Pearl
    { // out of the Lantern toward us, landing in a globe beside the path
      const b = beside(0.487, -1, 15, -3, 4.2); nearList.push(b); solids.push(b);
      const B = V3(b[0], b[1], b[2]), A = LANTERN_C.clone().add(B.clone().sub(LANTERN_C).setLength(27));
      arcs.push({ A, B, H: 7, u0: 0.505, n: 74, rA: 0, rB: b[3] }); }
    const ternTargets = [];      // two small globes 18 m off the path that the scripted terns punch clean through
    for (const [u0, dy, hx] of [[0.44, 1, 0.8], [0.485, -1, -0.8]]) {       // one crosses right to left ahead of the lens, one left to right
      const g = beside(u0 + 16 / path.length, 1, hx > 0 ? 21 : 10.5, dy, 3.4); nearList.push(g); solids.push(g);      // (the first stoops in front of the Mother's wall: a white bird on teal)
      path.tangentAt(u0, _t3);
      ternTargets.push({ u0, c: V3(g[0], g[1], g[2]), r: g[3], reach: hx > 0 ? 60 : 30, dir: V3(-_t3.x * 0.2 + _t3.z * hx, -0.35, -_t3.z * 0.2 - _t3.x * hx).normalize() });
    }
    // nothing hangs between the lens and the outrigger it comes up beside (u 0.42 to 0.45)
    const sight = [0.42, 0.432, 0.444].map((u) => [path.pointAt(u), boatAt(u, new THREE.Vector3())]);
    const clearBoat = (g) => { for (const [a, b] of sight) { _t3.copy(b).sub(a); const L = _t3.length(); _t3.divideScalar(L); _n3.set(g[0], g[1], g[2]).sub(a);
      const sAx = clamp(_n3.dot(_t3), 0, L + 14); if (_n3.addScaledVector(_t3, -sAx).length() < g[3] + 7) return false; } return true; };
    const nNamed = nearList.length;
    nearList.push(...place(plenty(30), () => {
      const u = gr.range(0.03, 0.97), heroSide = u > 0.07 && u < 0.87, right = gr.chance(heroSide ? 0.3 : 0.5);
      const R = gr.range(2.2, 6.2) * (heroSide && right ? 0.6 : 1);     // nothing big between the lens and the Mother
      return beside(u, right ? 1 : -1, R + gr.range(9.5, 26), heroSide && right ? -gr.range(R + 5, 20) : gr.range(-16, 9), R);
    }, 8.5, 2).filter(clearBoat));
    // under-storey: small globes hanging within 40 m below the path the whole way
    const underList = place(plenty(120), () => {
      const R = gr.range(1.4, 6) * (gr.chance(0.15) ? 1.6 : 1), u = gr.range(0, 1);
      return beside(u, gr.chance(0.5) ? 1 : -1, gr.range(0, 38), -gr.range(R + 9, 42), R);
    }, 8, 1.5).filter(clearBoat);
    // Two shoals before the Pearl. The dipping one (u 0.9) keeps the two globes it was laid out with. A second, wide one
    // leaps over the Pearl at u 0.94 between two globes put there after the random fields were laid out, so nothing
    // else in the layout shifts. nearPick is the list the ambient shoals choose from: it is kept as it was laid out
    // first, so their choices do not shift either (movedNear: the two entries of it that are no longer in the air).
    let nearPick = nearList; const movedNear = [], lateArcs = [];
    { const arc = arcs[4], uc = 0.94 + 30 / path.length, na = beside(uc, 1, 23, -3.5, 4.4), nb = beside(uc, -1, 23, -1.7, 3.7);
      const ga = nearList.find((g) => g[0] === arc.A.x && g[2] === arc.A.z), gb = nearList.find((g) => g[0] === arc.B.x && g[2] === arc.B.z);
      if (ga && gb) {
        const rnd = new Set(nearList.slice(nNamed)), ga0 = ga.slice(), gb0 = gb.slice();
        ga[0] = na[0]; ga[1] = na[1]; ga[2] = na[2]; gb[0] = nb[0]; gb[1] = nb[1]; gb[2] = nb[2];
        const hit = (g) => g !== ga && g !== gb && (Math.hypot(g[0] - na[0], g[1] - na[1], g[2] - na[2]) < g[3] + 7 || Math.hypot(g[0] - nb[0], g[1] - nb[1], g[2] - nb[2]) < g[3] + 7);
        for (const L of [nearList, underList]) for (let i = L.length - 1; i >= 0; i--) if (hit(L[i])) L.splice(i, 1);
        nearPick = nearList.slice();
        const nearest = (c, not) => { let best = null, bd = 1e9; for (const g of nearList) { if (!rnd.has(g) || g === not) continue; const d = Math.hypot(g[0] - c[0], g[1] - c[1], g[2] - c[2]); if (d < bd) { bd = d; best = g; } } return best; };
        const m1 = nearest(na, null), m2 = nearest(nb, m1);
        if (m1 && m2) {
          nearList[nearList.indexOf(ga)] = ga0; nearList[nearList.indexOf(gb)] = gb0;         // the dipping shoal's globes, back where they were
          nearList[nearList.indexOf(m1)] = ga; nearList[nearList.indexOf(m2)] = gb; movedNear.push(m1, m2);
          lateArcs.push({ A: V3(na[0], na[1], na[2]), B: V3(nb[0], nb[1], nb[2]), H: 9, u0: 0.94, n: 62, late: true },
            { A: arcs[3].A, B: arcs[3].B, H: arcs[3].H, u0: arcs[3].u0, n: 16, late: true }, { A: arc.A, B: arc.B, H: arc.H, u0: arc.u0, n: 16, late: true });
        } else { ga[0] = ga0[0]; ga[1] = ga0[1]; ga[2] = ga0[2]; gb[0] = gb0[0]; gb[1] = gb0[1]; gb[2] = gb0[2]; }
      } }
    await ctx.yield();
    // eight great reef globes, the mid field and the far field
    const reefList = place(8, () => { const a = gr.range(0, 6.28), d = gr.range(520, 1500), R = gr.range(42, 105);
      return [120 + Math.cos(a) * d, gr.range(R + 60, 820), 620 + Math.sin(a) * d, R]; }, 60, 30);
    const midList = place(plenty(170), () => { const R = gr.range(4, 15) * (gr.chance(0.3) ? 1.9 : 1), a = gr.range(0, 6.28), d = 60 + 900 * Math.sqrt(gr());
      return [Math.cos(a) * d * 0.8, clamp(390 + gr.gauss() * 110 - d * 0.05, R + 50, 900), 560 + Math.sin(a) * d * 1.1, R]; }, 10, 4);
    await ctx.yield();
    const farList = place(plenty(300), () => { const R = gr.range(14, 60) * (gr.chance(0.18) ? 2.6 : 1), a = gr.range(0, 6.28), d = 900 + 3600 * gr();
      return [Math.cos(a) * d, gr.range(R + 50, 900 + d * 0.08), 600 + Math.sin(a) * d, R]; }, 40, 10);
    await ctx.yield();
    // six kissing pairs: two globes that touch, merge a little and part again on a 14 s loop
    const pairs = place(6, () => { const R = gr.range(7, 12), u = gr.range(0.05, 0.95), b = beside(u, gr.chance(0.7) ? -1 : 1, gr.range(45, 110), gr.range(-30, 30), R * 2.4); b.push(R, gr.range(0, 6.28), gr.range(0, 6.28)); return b; }, 12, 4);
    const pairMesh = new THREE.InstancedMesh(geo320, matMid, 12); pairMesh.frustumCulled = false; pairMesh.renderOrder = 3; pairMesh.count = pairs.length * 2; scene.add(pairMesh);
    ups.push((dt, time) => {
      pairs.forEach((g, i) => {
        const R = g[4], k = 0.5 - 0.5 * Math.cos((time / 14 + g[6]) * 6.2832), sep = R * (1.32 - 0.62 * sstep(0.25, 0.8, k)), ax = Math.cos(g[5]), az = Math.sin(g[5]);
        for (let e = 0; e < 2; e++) { const sg = e ? 1 : -1; pairMesh.setMatrixAt(i * 2 + e, _m4.compose(_p.set(g[0] + ax * sep * sg, g[1] + sg * 0.15 * sep, g[2] + az * sep * sg), _q.identity(), _s.setScalar(R * (1 + 0.06 * sstep(0.5, 0.9, k))))); }
      });
      pairMesh.instanceMatrix.needsUpdate = true;
    });
    await ctx.yield();
    const bigList = [[MOON_C.x, MOON_C.y, MOON_C.z, A.moonRadius]];        // the Moon itself is the hero's (a shell with a reef and a school in it)
    rng(); rng(); rng();
    instanced(geo5k, matDark, [[DARK_C.x, DARK_C.y, DARK_C.z, DARK_R]]);
    instanced(geo1k, matReef, reefList);
    const nearMesh = instanced(geo720, matSmall, nearList), underMesh = instanced(geo320, matSmall, underList.filter((g) => g[3] >= 3.4)), underMesh2 = instanced(geo180, matSmall, underList.filter((g) => g[3] < 3.4));
    await ctx.yield();
    const midFarFn = (g) => path.distanceTo(g[0], g[1], g[2]) > 230 + g[3] * 6;
    const midMesh = instanced(geo320, matMid, midList.filter((g) => !midFarFn(g))), midMesh2 = instanced(geo180, matMid, midList.filter(midFarFn));
    instanced(geo320, matFar, farList.filter((g) => g[3] > 55)); instanced(geo80, matFar, farList.filter((g) => g[3] <= 55));
    ups.push((dt, time) => {            // the near field drifts as one body; the corridor margin allows for it
      nearMesh.position.set(Math.sin(time * 0.17) * 0.7, Math.sin(time * 0.23 + 1) * 0.6, 0);
      underMesh.position.set(Math.sin(time * 0.13 + 2) * 1.2, Math.sin(time * 0.19) * 0.9, Math.cos(time * 0.11) * 1.2); underMesh2.position.copy(underMesh.position);
      midMesh.position.y = midMesh2.position.y = Math.sin(time * 0.09) * 2.5;
    });
    await ctx.yield();
    await ctx.yield();
    // droplet strings: beads of spray hanging in curved lines among the under-storey
    const dropList = [];
    { const NSTR = plenty(130);
      for (let k = 0; k < NSTR; k++) {
        const u = gr.range(0, 1), side = gr.chance(0.5) ? 1 : -1;
        const b = beside(u, side, gr.range(7, 34), gr.range(-30, 12), 0), n = gr.int(7, 18);
        const dir = V3(gr.range(-1, 1), gr.range(-0.5, 0.5), gr.range(-1, 1)).normalize(), bow = V3(gr.range(-1, 1), gr.range(-1, 0.3), gr.range(-1, 1)).multiplyScalar(0.05);
        let r = gr.range(0.35, 1.0), x = b[0], y = b[1], z = b[2];
        for (let i = 0; i < n; i++) {
          if (path.distanceTo(x, y, z) > r + 6.5) dropList.push([x, y, z, r * (i % 3 === 1 ? 0.5 : 1)]);
          const st = r * gr.range(2.6, 4.4); x += dir.x * st; y += dir.y * st; z += dir.z * st; dir.add(bow).normalize(); r = Math.max(r * gr.range(0.78, 1.0), 0.12);
        }
      } }
    // droplets are lens impostors: a billboard that shades as a tiny ball of water (rim, glint, inverted sky)
    const dropMat = new THREE.ShaderMaterial({
      fog: true,
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: S.uTime, uSun: S.uSun, uSunCol: S.uSunCol, uSkyZen: S.uSkyZen, uSkyMid: S.uSkyMid, uSkyHaze: S.uSkyHaze,
        uGroundSun: S.uGroundSun, uGroundShade: S.uGroundShade, uPale: S.uPale, uShallow: S.uShallow },
      vertexShader: /* glsl */`attribute vec4 aPR; attribute float aPh; uniform float uTime;
        varying vec2 vUv; varying vec3 vW; varying vec3 vRt; varying vec3 vUp; varying vec3 vBk; varying float vFogDepth;
        void main(){
          vRt = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]); vUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
          vBk = vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]);
          vec4 c = modelMatrix * vec4(aPR.xyz, 1.);
          float dist = distance(c.xyz, cameraPosition);
          float r = max(aPR.w, dist * 0.0011);
          vec2 q = position.xy * (1. + 0.07 * vec2(sin(uTime * 5.1 + aPh), -sin(uTime * 5.1 + aPh)));     // quiver
          vUv = position.xy;
          vW = c.xyz + (vRt * q.x + vUp * q.y) * r;
          vec4 mv = viewMatrix * vec4(vW, 1.); vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: GLSL_COMMON + /* glsl */`uniform vec3 uPale, uShallow, fogColor; uniform float fogDensity;
        varying vec2 vUv; varying vec3 vW; varying vec3 vRt; varying vec3 vUp; varying vec3 vBk; varying float vFogDepth;
        void main(){
          float r2 = dot(vUv, vUv); if (r2 > 1.) discard;
          float z = sqrt(max(1. - r2, 1e-6)), b = min(sqrt(max(r2, 1e-8)), 0.999);
          vec3 ev = vRt * vUv.x + vUp * vUv.y; vec3 e = ev / max(b, 1e-3);
          vec3 N = normalize(ev + vBk * max(z, 0.02));
          vec3 D = normalize(vW - cameraPosition);
          float del = 2. * (asin(b) - asin(b / 1.333));
          vec3 col = skyCol(normalize(D * cos(del) - e * sin(del))) * mix(vec3(1.), uPale * 0.8 + uShallow * 0.25, 0.5) * 0.9;
          float om = 1. - z; float F = 0.03 + 0.97 * om * om * om * om;
          vec3 Rf = reflect(D, N);
          col = mix(col, skyCol(normalize(Rf + vec3(0., 1e-3, 0.))) * 1.1, F);
          col += uSunCol * pow(max(dot(Rf, uSun), 1e-4), 260.) * 5.;
          float fogF = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          gl_FragColor = vec4(mix(col, fogColor, fogF), 1.);
        }`,
    });
    const quadGeo = new THREE.PlaneGeometry(2, 2);
    const makeDrops = (list, dynamic) => {          // list of [x, y, z, r] or a count for a dynamic set
      const n = typeof list === 'number' ? list : list.length, a = new Float32Array(Math.max(n, 1) * 4), ph = new Float32Array(Math.max(n, 1));
      if (typeof list !== 'number') list.forEach((d, i) => a.set(d, i * 4));
      for (let i = 0; i < n; i++) ph[i] = rng.range(0, 6.28);
      const g = new THREE.InstancedBufferGeometry(); g.index = quadGeo.index; g.setAttribute('position', quadGeo.attributes.position);
      const attr = new THREE.InstancedBufferAttribute(a, 4); if (dynamic) attr.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('aPR', attr); g.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 1)); g.instanceCount = n;
      const mesh = new THREE.Mesh(g, dropMat); mesh.frustumCulled = false; mesh.renderOrder = 3; scene.add(mesh);
      return { mesh, attr, array: a, n };
    };
    const dropMesh = makeDrops(dropList).mesh;
    ups.push((dt, time) => { dropMesh.position.set(Math.sin(time * 0.21) * 0.8, Math.sin(time * 0.31 + 2) * 0.5, Math.cos(time * 0.17) * 0.8); });
    // the Pearl: a clear small globe with the portal at its centre, and its necklace of sixteen droplets
    const pearlBack = new THREE.Mesh(geo1k, makeWaterMat(S, 'back', { wob: wob(0.02, 1.6), shrink: 0.99, abs: 1 / 26, rip: 0.04, thinTeal: 0.7, tiMax: 0.5 }));
    const pearlFront = new THREE.Mesh(geo1k, makeWaterMat(S, 'front', { wob: pearlBack.material.uniforms.uWob.value, rip: 0.09 }));
    for (const m of [pearlBack, pearlFront]) { m.position.copy(PEARL); m.scale.setScalar(PEARL_R); m.frustumCulled = false; scene.add(m); }
    pearlBack.renderOrder = 2; pearlFront.renderOrder = 23;
    const NECK = 16, neckMesh = new THREE.InstancedMesh(geo320, matSmall, NECK);
    neckMesh.frustumCulled = false; neckMesh.renderOrder = 3; scene.add(neckMesh);
    const nkU = V3(exitDir.z, 0, -exitDir.x).normalize(), nkV = V3().crossVectors(exitDir, nkU).normalize();
    nkU.addScaledVector(exitDir, 0.3).normalize();           // the ring is tipped a little toward the lens
    ups.push((dt, time) => {
      for (let i = 0; i < NECK; i++) {
        const a = i / NECK * Math.PI * 2 + time * 0.16, rr = 24 + Math.sin(time * 0.5 + i * 2.4) * 0.8;
        _p.copy(PEARL).addScaledVector(nkU, Math.cos(a) * rr).addScaledVector(nkV, Math.sin(a) * rr);
        neckMesh.setMatrixAt(i, _m4.compose(_p, _q.identity(), _s.setScalar(1.5 + 0.35 * Math.sin(i * 1.7))));
      }
      neckMesh.instanceMatrix.needsUpdate = true;
    });
    await ctx.yield();
    // shadows and caustic nets under every globe, slid down the sun line onto the plain
    for (const L of [nearList, underList, midList, farList, reefList, bigList, [[DARK_C.x, DARK_C.y, DARK_C.z, DARK_R], [DAUGHTER_C.x, DAUGHTER_C.y, DAUGHTER_C.z, 60], [LANTERN_C.x, LANTERN_C.y, LANTERN_C.z, 30], [PEARL.x, PEARL.y, PEARL.z, PEARL_R]]]) {
      for (const g of L) {
        if (g[3] < 3.5) continue;
        const k = g[1] / Math.max(SUN.y, 0.15), x = g[0] - SUN.x * k, z = g[2] - SUN.z * k, hr = g[1] / g[3];
        shadowList.push([x, z, g[3], clamp(1.25 - hr * 0.012, 0.45, 1), clamp(g[1] * 0.012 / g[3], 0.05, 0.6)]);
        if (g[3] >= 6) causticList.push([x, z, g[3] * clamp(Math.abs(hr - 2) * 0.22, 0.5, 0.86), clamp(1.9 / (0.6 + Math.abs(hr - 2) * 0.1), 0.75, 1.7), gr.range(0, 50)]);       // a writhing net in every shadow
      }
    }
    await ctx.yield();
    const decalGeo = new THREE.PlaneGeometry(2, 2);
    const makeDecals = (list, caustic) => {
      const g = new THREE.InstancedBufferGeometry(); g.index = decalGeo.index; g.setAttribute('position', decalGeo.attributes.position);
      const a = new Float32Array(list.length * 4), b = new Float32Array(list.length);
      list.forEach((d, i) => { a.set([d[0], d[1], d[2], d[3]], i * 4); b[i] = d[4]; });
      g.setAttribute('aCS', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(b, 1));
      g.instanceCount = list.length;
      const stretch = 1 / Math.max(SUN.y, 0.15), sx = Math.hypot(SUN.x, SUN.z) || 1;
      const ratio = C(H.gShade); const gs = C(H.gSun); ratio.r = clamp(ratio.r / gs.r, 0, 1); ratio.g = clamp(ratio.g / gs.g, 0, 1); ratio.b = clamp(ratio.b / gs.b, 0, 1);
      const mat = new THREE.ShaderMaterial({
        fog: true, transparent: true, depthWrite: false,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
        blendSrc: caustic ? THREE.OneFactor : THREE.DstColorFactor, blendDst: caustic ? THREE.OneFactor : THREE.ZeroFactor,
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: S.uTime, uAxis: { value: new THREE.Vector2(SUN.x / sx, SUN.z / sx) }, uStretch: { value: stretch },
          uTint: { value: caustic ? C(pal[2]).lerp(C(pal[5]), 0.3).multiplyScalar(0.36 * H.water + 0.05) : ratio }, uSunCol: S.uSunCol },
        vertexShader: /* glsl */`attribute vec4 aCS; attribute float aK; uniform vec2 uAxis; uniform float uStretch;
          varying vec2 vUv; varying vec2 vP; varying float vK; varying float vStr; varying float vFogDepth;
          void main(){
            vUv = position.xy * 1.45; vK = aK; vStr = aCS.w;
            vec2 perp = vec2(-uAxis.y, uAxis.x);
            vec2 xz = aCS.xy + (uAxis * (vUv.y * uStretch) + perp * vUv.x) * aCS.z;
            vP = vec2(vUv.x, vUv.y * uStretch) * aCS.z / clamp(aCS.z * 0.34, 5., 30.);      // world metres over the net's cell size
            float dc = distance(xz, cameraPosition.xz);
            vec4 mv = viewMatrix * vec4(xz.x, ${caustic ? '1.1' : '0.8'} + dc * dc * 2.5e-6, xz.y, 1.);
            vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`uniform float uTime; uniform vec3 uTint; uniform vec3 fogColor; uniform float fogDensity;
          varying vec2 vUv; varying vec2 vP; varying float vK; varying float vStr; varying float vFogDepth;
          float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
          float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
            return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
          void main(){
            float d = length(vUv);
            float fogF = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
            ${caustic ? `
            vec2 cp = vP + vK; float t = uTime * 0.35;
            float net = (1. - smoothstep(0.0, 0.13, abs(vn(cp + t) - vn(cp * 1.7 - t * 0.7 + 5.)))) + 0.35 * (1. - smoothstep(0.0, 0.2, abs(vn(cp * 2.3 - t) - 0.5)));
            float a = (1. - smoothstep(0.15, 1.05, d)) * vStr;
            gl_FragColor = vec4(uTint * (net * 1.7 + 0.22) * a * (1. - fogF), 1.);` : `
            float a = (1. - smoothstep(1. - vK, 1. + vK, d)) * vStr * (1. - fogF);
            gl_FragColor = vec4(mix(vec3(1.), uTint, a), 1.);`}
          }`,
      });
      const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = caustic ? 1.2 : 1.1; scene.add(mesh);
      return mesh;
    };
    // bleached coral heads and stranded hulls on the plain (far below: they are texture for the lower frame)
    const groundMat = (groove, hex) => new THREE.ShaderMaterial({
      fog: true, side: THREE.DoubleSide,
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uSun: S.uSun, uSunCol: S.uSunCol, uGroundSun: S.uGroundSun, uGroundShade: S.uGroundShade,
        uGroove: { value: groove }, uCol: { value: C(hex) } },
      vertexShader: /* glsl */`varying vec3 vN; varying vec3 vL; varying float vFogDepth;
        void main(){ vL = position; vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.);
          vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal + vec3(0., 1e-4, 0.));
          vec4 mv = viewMatrix * w; vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`uniform vec3 uSun, uSunCol, uGroundSun, uGroundShade, uCol, fogColor; uniform float uGroove, fogDensity;
        varying vec3 vN; varying vec3 vL; varying float vFogDepth;
        void main(){
          vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
          float gr = sin(vL.x * 9. + sin(vL.z * 7. + vL.y * 5.) * 2.2) * sin(vL.z * 8. + sin(vL.x * 6.) * 2.) ;
          float groove = mix(1., 0.72 + 0.28 * smoothstep(-0.25, 0.3, gr), uGroove);
          float l = clamp(dot(n, uSun), 0., 1.);
          l = mix(l, clamp(dot(n, uSun) * 0.62 + 0.36 + 0.26 * n.y, 0., 1.), uGroove);      // bleached heads: lit crowns, a bright sun side, a blue lee
          vec3 col = uCol * (uGroundShade * (0.5 + 0.22 * n.y) + (uGroundSun * 0.9 + uSunCol * 0.2) * l) * groove * 1.25;
          float fogF = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          gl_FragColor = vec4(mix(col, fogColor, fogF), 1.);
        }`,
    });
    await ctx.yield();
    { const cr = rng.fork('seabed'), heads = [], NH = plenty(60);
      const headGeo = new THREE.IcosahedronGeometry(1, 1); headGeo.scale(1, 0.55, 1);
      // the lens rides 350 to 410 m up, so the nearest plain in frame is 800 m off: at each waypoint of the ride six great
      // bleached heads (50 to 90 m across) stand in the lower frame, where the lens will be looking, each with its long shadow
      const ST = [[0.02, 1, 0], [0.08, -13, 2], [0.16, -25, 9], [0.25, -31, 7], [0.34, -43, 9], [0.43, -27, 1], [0.52, -23, 10], [0.61, 0, 6], [0.70, 1, -2], [0.79, 35, -3], [0.88, 51, 1], [0.94, 50, 3]];
      const addHead = (x, z, R) => { heads.push([x, -R * 0.12, z, R]);
        shadowList.push([x - SUN.x / Math.max(SUN.y, 0.15) * R * 0.3, z - SUN.z / Math.max(SUN.y, 0.15) * R * 0.3, R * 0.95, 0.9, 0.25]); };
      for (const [u, yaw, pit] of ST) for (let k = 0; k < 6; k++) {
        path.pointAt(u, _p);
        const dh = _p.y / Math.tan((29 - pit) / 57.2958) * cr.range(1.04, 1.5), bb = (yaw + cr.range(-38, 38)) / 57.2958;
        addHead(_p.x + Math.sin(bb) * dh, _p.z + Math.cos(bb) * dh, cr.range(24, 36) * (dh > 1100 ? 1.25 : 1));
      }
      for (let i = 0; i < NH; i++) {
        const u = cr.range(-0.1, 1.1), a = cr.range(0, 6.28), d = 220 + 1050 * cr();
        path.pointAt(clamp(u, 0, 1), _p);
        addHead(_p.x + Math.cos(a) * d + (u < 0 ? -200 : 0), _p.z + Math.sin(a) * d, cr.range(8, 22) * (cr.chance(0.3) ? 1.5 : 1));
      }
      const hm = instanced(headGeo, groundMat(1, '#F2EEE6'), heads, 0.5);
      for (let i = 0; i < heads.length; i++) {      // squat, upright, turned about Y only
        hm.setMatrixAt(i, _m4.compose(_p.set(heads[i][0], heads[i][1], heads[i][2]), _q.setFromEuler(_e.set(0, cr.range(0, 6.28), 0)), _s.set(heads[i][3] * cr.range(0.8, 1.3), heads[i][3] * cr.range(0.7, 1.3), heads[i][3])));
      }
      await ctx.yield();
      // hulls: keel, ribs and two stringers, lying on their sides in the salt
      const parts = [], tube = (pts, r, seg = 3) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, 3, false);
      parts.push(tube([V3(0, 0.3, -16), V3(0, 0, -8), V3(0, 0, 8), V3(0, 1.2, 16)], 0.55, 4));
      for (let k = -5; k <= 5; k++) { const z = k * 2.7, w = 5.2 * Math.sqrt(Math.max(1 - (k / 6.2) * (k / 6.2), 0.05)), h = 4.6 + Math.abs(k) * 0.12;
        for (const sd of [-1, 1]) if (!(sd > 0 && (k + 5) % 4 === 1)) parts.push(tube([V3(0, 0, z), V3(sd * w * 0.7, h * 0.25, z), V3(sd * w, h * 0.7, z), V3(sd * w * 0.96, h, z)], 0.28)); }
      for (const sd of [-1, 1]) parts.push(tube([V3(sd * 1.5, 3.6, -13), V3(sd * 5, 3.3, -4), V3(sd * 5, 3.3, 5), V3(sd * 1.8, 4, 13)], 0.22));
      { // the planking still on the side she lies on: a lofted half shell, so a hull is a dark shape and not only a comb
        const NSt = 9, NV = 4, pp = [], ii = [];
        for (let k = 0; k < NSt; k++) { const z = (k / (NSt - 1) * 2 - 1) * 13.5, kk = z / 2.7, w = 5.2 * Math.sqrt(Math.max(1 - (kk / 6.2) * (kk / 6.2), 0.05)), h = 4.6 + Math.abs(kk) * 0.12;
          for (let j = 0; j < NV; j++) { const t = j / (NV - 1); pp.push(-w * (0.7 * Math.min(t * 3, 1) + 0.3 * Math.max(t * 1.5 - 0.5, 0)) - 0.3, h * (0.02 + 0.98 * t * t) - 0.2, z); } }
        for (let k = 0; k < NSt - 1; k++) for (let j = 0; j < NV - 1; j++) { const a = k * NV + j, b = a + NV; ii.push(a, b, a + 1, a + 1, b, b + 1); }
        const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); hg.setIndex(ii);
        const hn = hg.toNonIndexed(); hn.computeVertexNormals();
        const uvs = new Float32Array(hn.attributes.position.count * 2); hn.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); hg.dispose(); parts.push(hn); }
      await ctx.yield();
      const hullGeo = mergeGeometries(parts.map((g) => g.index ? g.toNonIndexed() : g));
      parts.forEach((g) => g.dispose());
      await ctx.yield();
      const hulls = [];
      for (let i = 0; i < 14; i++) { const u = (i + cr.range(0.1, 0.9)) / 14, sd = i % 2 ? 1 : -1; hulls.push(beside(u, sd, cr.range(180, 620), 0, cr.range(0.75, 1.5) * 1.5)); }       // 36 to 72 m
      const hullMesh = instanced(hullGeo, groundMat(0, '#5A3C34'), hulls, 0.5);
      hulls.forEach((h, i) => {
        hullMesh.setMatrixAt(i, _m4.compose(_p.set(h[0], 1.5 * h[3], h[2]), _q.setFromEuler(_e.set(cr.range(-0.08, 0.08), cr.range(0, 6.28), (cr.chance(0.5) ? 1 : -1) * cr.range(0.9, 1.25))), _s.setScalar(h[3])));
        shadowList.push([h[0] - SUN.x / Math.max(SUN.y, 0.15) * 3, h[2] - SUN.z / Math.max(SUN.y, 0.15) * 3, 11 * h[3], 0.8, 0.5]);
      });
    }
    await ctx.yield();
    makeDecals(shadowList, false);
    await ctx.yield();
    makeDecals(causticList, true);
    await ctx.yield();
    //@@DECALS
    //@@GLOBES2
    //@@GLOBES
    // ---- sail-fish (or flying squid, or needlefish): shoals leaping between globes along bowed arcs ----
    { const fr = rng.fork('shoals');
      for (let k = 0, tries = 0; k < plenty(40) && tries < 900; tries++) {       // ambient shoals between neighbouring globes
        const g1 = fr.pick(midList), g2 = fr.pick(tries % 3 ? midList : nearPick);
        if (!g1 || !g2 || g1 === g2) continue;
        const d = Math.hypot(g1[0] - g2[0], g1[1] - g2[1], g1[2] - g2[2]) - g1[3] - g2[3];
        if (d < 14 || d > 75) continue;
        const A = V3(g1[0], g1[1], g1[2]), B = V3(g2[0], g2[1], g2[2]), dir = B.clone().sub(A).normalize();
        A.addScaledVector(dir, g1[3] * 0.9); B.addScaledVector(dir, -g2[3] * 0.9);
        const H = d * fr.range(0.16, 0.3); let ok = true;
        for (let i = 1; i < 8 && ok; i++) { const s = i / 8; _p.copy(A).lerp(B, s); if (path.distanceTo(_p.x, _p.y + H * 4 * s * (1 - s), _p.z) < 9) ok = false; }
        if (!ok) continue;
        arcs.push({ A, B, H, u0: -1, n: 35, g2 }); k++;
      }
      await ctx.yield();
      // one fish: lofted body, forked tail, tall dorsal sail. +Z is the nose. aPart: 0 body, 1 sail, 2 tail and fins
      const fishGeo = (hi) => {
        const P = [], part = [], idx = [], L = cast.len * 0.5, bw = cast.body;
        const v = (x, y, z, k) => { P.push(x, y, z); part.push(k); return part.length - 1; };
        const rings = hi ? [[0.74, 0.5], [0.38, 1], [-0.08, 0.96], [-0.48, 0.55], [-0.78, 0.17]] : [[0.15, 1], [-0.72, 0.15]];
        const NS = hi ? 6 : 4, nose = v(0, 0, L, 0), base = part.length;
        for (const [z, r] of rings) for (let j = 0; j < NS; j++) { const a = j / NS * Math.PI * 2; v(Math.sin(a) * bw * 0.62 * r, Math.cos(a) * bw * 1.15 * r - bw * 0.1 * (1 - r), z * L, 0); }
        for (let j = 0; j < NS; j++) { idx.push(nose, base + j, base + (j + 1) % NS);
          for (let k = 0; k < rings.length - 1; k++) { const a = base + k * NS + j, b = base + k * NS + (j + 1) % NS; idx.push(a, a + NS, b, b, a + NS, b + NS); } }
        const tz = rings[rings.length - 1][0] * L, t0 = v(0, 0, tz + 0.06, 2);
        idx.push(t0, v(0, bw * 1.9, -L * 1.02, 2), v(0, 0.02, -L * 0.86, 2), t0, v(0, -0.02, -L * 0.86, 2), v(0, -bw * 1.7, -L, 2));
        const sh = 0.66 * cast.sail, prof = hi ? [[0.5, 0.15], [0.3, 1], [0.08, 0.86], [-0.14, 0.95], [-0.36, 0.7], [-0.56, 0.12]] : [[0.45, 0.1], [0.2, 1], [-0.25, 0.85], [-0.55, 0.1]];
        let pb = -1, pt = -1;
        for (const [z, h] of prof) { const b = v(0, bw * 0.95, z * L, 1), t = v(0, bw + sh * h, z * L - sh * 0.18 * h, 1); if (pb >= 0) idx.push(pb, pt, b, b, pt, t); pb = b; pt = t; }
        for (const sd of [-1, 1]) {
          if (hi && !cast.fins) idx.push(v(sd * bw * 0.5, -bw * 0.3, L * 0.42, 2), v(sd * bw * 2.4, -bw * 0.9, L * 0.05, 2), v(sd * bw * 0.5, -bw * 0.4, L * 0.2, 2));     // pectorals
          if (cast.fins) { idx.push(v(sd * bw * 0.4, 0, L * 0.92, 2), v(sd * bw * 2.4, 0, L * 0.5, 2), v(sd * bw * 0.5, 0, L * 0.25, 2));        // squid: mantle fins, trailing arms
            idx.push(v(sd * bw * 0.25, 0, tz, 2), v(sd * bw * 0.9, 0.05, -L * 1.7, 2), v(sd * bw * 0.1, 0, -L * 0.9, 2)); }
        }
        const g = new THREE.InstancedBufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
        g.setIndex(idx); g.computeVertexNormals();
        return g;
      };
      const fishMeshes = [];
      const shoalMesh = (list, hi) => {
        const NF = list.reduce((s, a) => s + a.n, 0), fg = fishGeo(hi);
        const aA = new Float32Array(NF * 3), aB = new Float32Array(NF * 3), aOff = new Float32Array(NF * 4), aPrm = new Float32Array(NF * 4);
        let o = 0;
        for (const a of list) for (let i = 0; i < a.n; i++, o++) {
          aA.set([a.A.x, a.A.y, a.A.z], o * 3); aB.set([a.B.x, a.B.y, a.B.z], o * 3);
          const th = a.u0 >= 0 ? 1.8 : 1.4;
          aOff.set([fr.gauss() * th * 0.5, fr.gauss() * th * 0.5, fr.gauss() * th * 0.5, a.H], o * 4);
          const T = (a.A.distanceTo(a.B) + Math.abs(a.H)) / 17;                          // seconds in the air at ~17 m/s
          // scripted shoals stream without a gap; ambient shoals leap in bursts with quiet water between
          aPrm.set([a.u0 >= 0 ? i / a.n + fr.range(-0.02, 0.02) : fr.range(0, 0.36) + (i % 2) * 0.5, a.u0 >= 0 ? 1 / T : 1 / (T * 1.5), a.u0, fr.range(0.82, 1.2)], o * 4);
        }
        fg.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 3)); fg.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 3));
        fg.setAttribute('aOff', new THREE.InstancedBufferAttribute(aOff, 4)); fg.setAttribute('aPrm', new THREE.InstancedBufferAttribute(aPrm, 4));
        fg.instanceCount = NF; fishMeshes.push(fg);
      };
      shoalMesh(arcs.filter((a) => a.u0 >= 0), true); await ctx.yield(); shoalMesh(arcs.filter((a) => a.u0 < 0 && !movedNear.includes(a.g2)), false);
      if (lateArcs.length) shoalMesh(lateArcs, true);        // made last, so the fish of every other shoal keep their draws
      const fishMat = new THREE.ShaderMaterial({
        fog: true, side: THREE.DoubleSide,
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: S.uTime, uU: { value: 0 }, uSun: S.uSun, uSunCol: S.uSunCol, uSkyZen: S.uSkyZen, uSkyHaze: S.uSkyHaze,
          uCol: { value: C(cast.col) }, uSail: { value: C(cast.sailCol) } },
        vertexShader: /* glsl */`attribute vec3 aA, aB; attribute vec4 aOff, aPrm; attribute float aPart;
          uniform float uTime, uU; varying vec3 vN; varying float vPart; varying float vFogDepth; varying float vS;
          void main(){
            float s = fract(uTime * aPrm.y + aPrm.x);
            float air = aPrm.z >= 0. ? 1. : step(s, 0.667);          // ambient: a third of each cycle is spent under water
            s = aPrm.z >= 0. ? s : min(s * 1.5, 1.);
            float gate = aPrm.z < 0. ? 1. : smoothstep(aPrm.z - 0.05, aPrm.z - 0.035, uU) * (1. - smoothstep(aPrm.z + 0.035, aPrm.z + 0.05, uU));
            vec3 ab = aB - aA;
            vec3 c = mix(aA, aB, s) + vec3(0., aOff.w * 4. * s * (1. - s), 0.) + aOff.xyz * (0.35 + 0.65 * sin(3.14159 * s));
            vec3 f = normalize(ab + vec3(0., aOff.w * 4. * (1. - 2. * s), 0.) + vec3(1e-4));
            vec3 r = normalize(cross(vec3(0., 1., 0.), f) + vec3(1e-4, 0., 0.)); vec3 up = cross(f, r);
            vec3 p = position * aPrm.w;
            float tail = clamp(0.5 - p.z, 0., 1.5);
            p.x += sin(uTime * 17. + aPrm.x * 60. + p.z * 2.5) * 0.09 * tail;
            if (aPart > 0.5 && aPart < 1.5) p.y *= 0.72 + 0.28 * sin(uTime * 8. + aPrm.x * 90.);       // the sail flickers
            float sc = air * gate * smoothstep(0., 0.05, s) * (1. - smoothstep(0.95, 1., s));
            vec3 w = c + (r * p.x + up * p.y + f * p.z) * sc;
            vN = normalize(r * normal.x + up * normal.y + f * normal.z + vec3(0., 1e-4, 0.)); vPart = aPart; vS = aPrm.x;
            vec4 mv = viewMatrix * vec4(w, 1.); vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`uniform vec3 uSun, uSunCol, uSkyZen, uSkyHaze, uCol, uSail, fogColor; uniform float fogDensity, uTime;
          varying vec3 vN; varying float vPart; varying float vFogDepth; varying float vS;
          void main(){
            vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
            float l = clamp(dot(n, uSun), 0., 1.), back = clamp(-dot(n, uSun), 0., 1.);
            vec3 amb = mix(uSkyHaze, uSkyZen, n.y * 0.5 + 0.5) * 0.55;
            vec3 body = uCol * (amb + uSunCol * 0.55 * l) * (0.75 + 0.5 * step(0., n.y));
            body += uSunCol * 1.6 * smoothstep(0.93, 1., l) * (0.5 + 0.5 * sin(uTime * 11. + vS * 70.));      // silver flash
            vec3 sail = uSail * (amb * 1.1 + uSunCol * (0.35 * l + 0.6 * back));
            vec3 col = vPart > 0.5 ? mix(sail, body * 0.8, step(1.5, vPart)) : body;
            float fogF = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
            gl_FragColor = vec4(mix(col, fogColor, fogF), 1.);
          }`,
      });
      for (const fg of fishMeshes) { const fish = new THREE.Mesh(fg, fishMat); fish.frustumCulled = false; fish.renderOrder = 4; scene.add(fish); }
      ups.push((dt, time, camera, u) => { fishMat.uniforms.uU.value = u; });
    }
    await ctx.yield();
    await ctx.yield();
    // ---- needle terns (or pelicans in lines): sixty circling in gyres, two that fold and punch through small globes ----
    const spray = makeDrops(620, true);           // dynamic droplets: crowns, tern trails, the Lantern burst
    for (let i = 0; i < spray.n; i++) spray.array[i * 4 + 1] = -1000;
    const setDrop = (i, x, y, z, r) => { const a = spray.array, o = i * 4; a[o] = x; a[o + 1] = y; a[o + 2] = z; a[o + 3] = r; };
    { const br = rng.fork('birds'), bp = [], bw = [], big = pelicans ? 1.35 : 1;
      const tri = (a, b, c, w) => { bp.push(...a, ...b, ...c); bw.push(...w); };
      const bl = 0.75 * big, bt = 0.13 * big * (pelicans ? 1.5 : 1);
      const nose = [0, 0, bl * (pelicans ? 1.5 : 1.1)], tl = [0, 0, -bl], q = [[0, bt, 0.1], [bt, 0, 0.1], [0, -bt, 0.1], [-bt, 0, 0.1]];
      for (let i = 0; i < 4; i++) { tri(nose, q[i], q[(i + 1) % 4], [0, 0, 0]); tri(tl, q[(i + 1) % 4], q[i], [0, 0, 0]); }
      for (const sd of [-1, 1]) {        // wing: inner panel and a swept, pointed outer panel. aW = span fraction
        const r0 = [sd * bt, 0, 0.32 * big], r1 = [sd * bt, 0, -0.18 * big], m0 = [sd * 0.75 * big, 0, 0.22 * big], m1 = [sd * 0.75 * big, 0, -0.2 * big], tip = [sd * 1.5 * big, 0, -0.38 * big];
        tri(r0, m0, r1, [0, 0.5, 0]); tri(r1, m0, m1, [0, 0.5, 0.5]); tri(m0, tip, m1, [0.5, 1, 0.5]);
      }
      tri([0, 0, -bl * 0.7], [0.16 * big, 0, -bl * 1.45], [-0.16 * big, 0, -bl * 1.45], [0, 0, 0]);       // tail
      const bg = new THREE.InstancedBufferGeometry();
      bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute('aW', new THREE.Float32BufferAttribute(bw, 1));
      const NBIRD = 62, bPos = new Float32Array(NBIRD * 4), bDir = new Float32Array(NBIRD * 4);
      const aPos = new THREE.InstancedBufferAttribute(bPos, 4).setUsage(THREE.DynamicDrawUsage), aDir = new THREE.InstancedBufferAttribute(bDir, 4).setUsage(THREE.DynamicDrawUsage);
      bg.setAttribute('aPos', aPos); bg.setAttribute('aDir', aDir); bg.instanceCount = NBIRD;
      const birdMat = new THREE.ShaderMaterial({
        fog: true, side: THREE.DoubleSide,
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: S.uTime, uSun: S.uSun, uSunCol: S.uSunCol, uSkyZen: S.uSkyZen, uSkyHaze: S.uSkyHaze, uFlap: { value: pelicans ? 3.2 : 6.5 } },
        vertexShader: /* glsl */`attribute float aW; attribute vec4 aPos, aDir;        // aPos.w = flap phase, aDir.w = fold 0..1 (+2 = banking sign)
          uniform float uTime, uFlap; varying float vShade; varying float vFogDepth; varying float vBig;
          void main(){
            float big = step(1.5, aDir.w), fold = aDir.w - 2. * big; vBig = big;
            vec3 f = normalize(aDir.xyz + vec3(1e-4, 0., 0.));
            vec3 r = normalize(cross(vec3(0., 1., 0.), f) + vec3(1e-4, 0., 0.)); vec3 up = cross(f, r);
            vec3 p = position * (1. + 0.9 * big);
            float fl = sin(uTime * uFlap + aPos.w) * (1. - fold);
            p.y += aW * (fl * 0.62 + 0.12) - aW * aW * 0.2 * (1. - fl);
            p.x *= 1. - 0.78 * fold * step(0.01, aW); p.z -= aW * fold * 0.9;
            vec3 w = aPos.xyz + r * p.x + up * p.y + f * p.z;
            vShade = (0.72 + 0.28 * aW * fl + 0.12 * step(0.01, aW)) * mix(1., 0.22, smoothstep(0.7, 1., aW));      // dark wingtips
            vec4 mv = viewMatrix * vec4(w, 1.); vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`uniform vec3 uSunCol, uSkyZen, uSkyHaze, fogColor; uniform float fogDensity; varying float vShade; varying float vFogDepth; varying float vBig;
          void main(){
            vec3 col = mix(uSkyHaze * 0.72 + uSkyZen * 0.1 + uSunCol * 0.3, vec3(1.02, 1.0, 0.96) + uSunCol * 0.06, vBig * 0.85) * vShade * (gl_FrontFacing ? 1.15 : 0.82);
            float fogF = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
            gl_FragColor = vec4(mix(col, fogColor, fogF), 1.); }`,
      });
      const birds = new THREE.Mesh(bg, birdMat); birds.frustumCulled = false; birds.renderOrder = 4; scene.add(birds);
      const gyres = [];
      for (const [u, sd, off, dy] of [[0.06, -1, 46, 16], [0.2, -1, 60, 26], [0.33, -1, 48, 8], [0.47, -1, 55, 22], [0.67, 1, 60, 24], [0.86, -1, 52, 20]]) {
        const c = beside(u, sd, off, dy, 0); gyres.push({ c: V3(c[0], c[1], c[2]), R: br.range(16, 30) * (pelicans ? 1.7 : 1), w: br.range(0.32, 0.5) * (br.chance(0.5) ? 1 : -1) * (pelicans ? 0.5 : 1) });
      }
      const info = [];
      for (let i = 0; i < 60; i++) { const g = gyres[i % gyres.length], k = Math.floor(i / gyres.length);
        info.push({ g, a0: pelicans ? k * 0.2 : br.range(0, 6.28), dr: pelicans ? 0 : br.range(-7, 7), dy: pelicans ? k * 0.5 : br.range(-6, 6), ph: br.range(0, 6.28) }); bPos[i * 4 + 3] = info[i].ph; }
      ups.push((dt, time, camera, u) => {
        for (let i = 0; i < 60; i++) {
          const b = info[i], g = b.g, a = b.a0 + time * g.w, R = g.R + b.dr + Math.sin(time * 0.3 + b.ph) * 2, o = i * 4, sg = Math.sign(g.w);
          bPos[o] = g.c.x + Math.cos(a) * R; bPos[o + 1] = g.c.y + b.dy + Math.sin(time * 0.4 + b.ph) * 1.5; bPos[o + 2] = g.c.z + Math.sin(a) * R;
          bDir[o] = -Math.sin(a) * sg; bDir[o + 1] = Math.cos(time * 0.4 + b.ph) * 0.06; bDir[o + 2] = Math.cos(a) * sg; bDir[o + 3] = 0;
        }
        // the two that punch through: a straight stoop keyed to u, wings folded near the globe, drops flung out behind
        for (let k = 0; k < 2; k++) {
          const t = ternTargets[k], qq = (u - (t.u0 - 0.048)) / 0.09, o = (60 + k) * 4, d = (qq - 0.5) * 100;
          bPos[o] = t.c.x + t.dir.x * d; bPos[o + 1] = t.c.y + t.dir.y * d + (qq < 0 || qq > 1 || d > t.reach ? -2000 : 0); bPos[o + 2] = t.c.z + t.dir.z * d; bPos[o + 3] = k * 2.1;
          bDir[o] = t.dir.x; bDir[o + 1] = t.dir.y; bDir[o + 2] = t.dir.z; bDir[o + 3] = 1 - sstep(2.5, 7.5, Math.abs(d)) + 2;      // +2 marks the two big scripted birds
          const age = (qq - 0.53) * 0.09 * 44;
          for (let j = 0; j < 24; j++) {
            const h1 = (j * 0.618034) % 1, h2 = (j * 0.381966 + 0.3) % 1, h3 = (j * 0.7548) % 1, v = 6 + 16 * h1, i = 168 + k * 24 + j;
            if (age <= 0) { setDrop(i, 0, -1000, 0, 0.1); continue; }
            const tt = (1 - Math.exp(-age * 1.4)) / 1.4;
            setDrop(i, t.c.x + t.dir.x * (t.r + v * tt) + (h2 - 0.5) * 5 * tt, t.c.y + t.dir.y * (t.r + v * tt) + (h3 - 0.5) * 5 * tt - 0.6 * age * age,
              t.c.z + t.dir.z * (t.r + v * tt) + (h1 - 0.5) * 4 * tt, (0.1 + 0.3 * h2) * (1 - sstep(2.5, 6, age)));
          }
        }
        // crowns of droplets where the scripted shoals break out and go in
        for (let k = 0; k < 6; k++) { const arc = arcs[k], on = u > arc.u0 - 0.05 && u < arc.u0 + 0.05;
          for (let e = 0; e < 2; e++) { const E = e ? arc.B : arc.A, rr = e ? arc.rB : arc.rA, sgn = e ? -1 : 1;
            _p.copy(arc.B).sub(arc.A).normalize().multiplyScalar(sgn * (rr + 0.2)); _p.y += arc.H > 0 ? rr * 0.5 : -rr * 0.5;
            for (let j = 0; j < 14; j++) { const i = k * 28 + e * 14 + j, ph = (time * 1.2 + j * 0.618034) % 1, an = j * 2.39996;
              if (!on) { setDrop(i, 0, -1000, 0, 0.1); continue; }
              setDrop(i, E.x + _p.x + Math.cos(an) * ph * 1.9, E.y + _p.y + (arc.H > 0 ? 1 : -1) * (3.2 * ph - 3.4 * ph * ph), E.z + _p.z + Math.sin(an) * ph * 1.9, 0.07 + 0.2 * (1 - ph) * ((j * 0.37) % 1)); } } }
        aPos.needsUpdate = true; aDir.needsUpdate = true; spray.attr.needsUpdate = true;
      });
    }
    //@@LIFE2
    //@@LIFE
    await ctx.yield();
    // ---- through the Lantern: water fog while inside, a meniscus line wiping the lens at each skin, the exit burst ----
    { const fogAir = fogCol.clone(), fogWater = C(pal[0], 0.42 * H.water + 0.08).lerp(C(pal[1], 0.7 * H.water + 0.1), 0.45);
      let uOut = 0.592;          // where the lens leaves the Lantern's skin
      for (let k = 0; k < 60; k++) { const uu = 0.575 + k * 0.0008; if (path.pointAt(uu, _p).distanceTo(LANTERN_C) > 30) { uOut = uu; break; } }
      const E = path.pointAt(uOut), T = path.tangentAt(uOut), R1 = V3(T.z, 0, -T.x).normalize(), U1 = V3().crossVectors(T, R1);
      hero.setLanternWindow(E.clone().sub(LANTERN_C).normalize(), 0.40);        // the round window: 23 degrees about the way out
      const menMat = new THREE.ShaderMaterial({
        transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
        uniforms: { uY: { value: 2 }, uCol: { value: C(pal[2], 0.9 * H.water + 0.15) }, uTime: S.uTime },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: /* glsl */`uniform float uY, uTime; uniform vec3 uCol; varying vec2 vUv;
          void main(){
            float y = vUv.y - uY - 0.05 * sin(vUv.x * 5. + uTime * 9.) - 0.02 * sin(vUv.x * 17. - uTime * 13.);
            float line = exp(-y * y * 420.) + 0.35 * exp(-y * y * 30.);
            gl_FragColor = vec4(uCol * line * (1. - smoothstep(0.9, 1.25, abs(uY))), 1.); }`,
      });
      const men = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), menMat); men.frustumCulled = false; men.renderOrder = 40; men.visible = false; scene.add(men);
      const camF = new THREE.Vector3();
      ups.push((dt, time, camera, u) => {
        const d = camW.distanceTo(LANTERN_C) - 30, inside = 1 - sstep(-1, 1, d);
        scene.fog.color.copy(fogAir).lerp(fogWater, inside * 0.8);
        scene.fog.density = H.fogD * (1 + 7 * inside);                       // under water the far world sinks into teal
        // the meniscus: a bright wavering line that crosses the lens as the skin passes (about 0.2 s, eased, no full-frame flash)
        men.visible = Math.abs(d) < 3.4 && u > 0.5 && u < 0.64;
        if (men.visible) {
          const h = Math.tan(camera.fov * Math.PI / 360) * 0.8;
          camera.getWorldDirection(camF); men.position.copy(camW).addScaledVector(camF, 0.8); camera.getWorldQuaternion(men.quaternion);
          men.scale.set(h * camera.aspect * 1.05, h * 1.05, 1);
          menMat.uniforms.uY.value = (u < 0.57 ? 1 : -1) * clamp(d / 3, -1.3, 1.3) * 1.25;
        }
        // 400 droplets burst out through the skin ahead of us, slow and hang
        const age = (u - (uOut - 0.004)) * 44;
        for (let j = 0; j < 400; j++) {
          const i = 216 + j;
          if (age <= 0) { setDrop(i, 0, -1000, 0, 0.1); continue; }
          const h1 = (j * 0.618034) % 1, h2 = (j * 0.754877) % 1, h3 = (j * 0.569840) % 1, an = h2 * 6.2832, cone = 0.07 + 0.5 * h3 * h3;
          const tt = (1 - Math.exp(-age * 1.25)) / 1.25, v = 26 + 46 * h1, sx = Math.cos(an) * cone, sy = Math.sin(an) * cone;
          const lat = 1.6 + v * tt * 0.9;       // every droplet leaves the axis, so the lens passes through the middle of the spray
          setDrop(i, E.x + T.x * v * tt + (R1.x * sx + U1.x * sy) * lat * 1.5 + R1.x * Math.cos(an) * 1.6 + U1.x * Math.sin(an) * 1.6,
            E.y + T.y * v * tt + (R1.y * sx + U1.y * sy) * lat * 1.5 + U1.y * Math.sin(an) * 1.6 - 0.25 * Math.min(age, 6) * Math.min(age, 6) * h3,
            E.z + T.z * v * tt + (R1.z * sx + U1.z * sy) * lat * 1.5 + R1.z * Math.cos(an) * 1.6 + U1.z * Math.sin(an) * 1.6,
            (0.06 + 0.3 * h2 * h2) * sstep(0, 0.25, age));
        }
      });
    }
    // ---- rare event: two 150 m globes touch at u 0.3, a bridge snaps open, and the one globe rings on in slow lobes ----
    if (rare) {
      const mid = rareA.clone().add(rareB).multiplyScalar(0.5), axis = rareB.clone().sub(rareA).normalize(), half = rareA.distanceTo(rareB) * 0.5;
      const rw = new THREE.Vector4(0.012, 0.55, 2, 0);
      const mk = (sign) => { const bulge = new THREE.Vector4(axis.x * sign, axis.y * sign, axis.z * sign, 0);
        const m = makeWaterMat(S, 'solid', { wob: rw, abs: 1 / 100, rip: 0.09, thinTeal: 0.4, fleck: 1, heart: 0.5, heartR: 22, bulge, bulgeK: 60, stand: 1, near: 1, nearA: 40, nearB: 220, nearTi: 0.5 });
        const mesh = new THREE.Mesh(geo5k, m); mesh.frustumCulled = false; mesh.renderOrder = 3; scene.add(mesh); return { mesh, bulge, m }; };
      const gA = mk(1), gB = mk(-1), NBEAD = 14, beads = new THREE.InstancedMesh(geo320, matSmall, NBEAD);
      beads.frustumCulled = false; beads.renderOrder = 3; scene.add(beads);
      const bu = V3(0, 1, 0).cross(axis).normalize(), bv = V3().crossVectors(axis, bu);
      const beadOut = [];        // how far each bead is flung: shortened until its resting place is well clear of the flight
      for (let i = 0; i < NBEAD; i++) { const a = i / NBEAD * 6.2832 + 0.4 * Math.sin(i * 3.1); let out = 95 + 40 * ((i * 0.618) % 1);
        for (let k = 0; k < 8; k++) { _p.copy(mid).addScaledVector(bu, Math.cos(a) * (20 + out)).addScaledVector(bv, Math.sin(a) * (20 + out)); if (path.distanceTo(_p.x, _p.y - 6, _p.z) > 45) break; out *= 0.72; }
        beadOut.push(out); }
      ups.push((dt, time, camera, u) => {
        const near = sstep(0.06, 0.3, u), merge = sstep(0.3, 0.42, u), age = Math.max(u - 0.3, 0) * 44;
        const sep = lerp(lerp(half, 75, near), 0, merge), R = lerp(75, 94.5, merge);
        gA.mesh.position.copy(mid).addScaledVector(axis, -sep); gB.mesh.position.copy(mid).addScaledVector(axis, sep);
        gA.mesh.scale.setScalar(R); gB.mesh.scale.setScalar(R);
        const snap = sstep(0.285, 0.3, u) * (1 - sstep(0.3, 0.4, u));           // the meniscus reaching across, then swallowed
        gA.bulge.w = gB.bulge.w = 0.16 * snap; gA.m.uniforms.uBulgeK.value = gB.m.uniforms.uBulgeK.value = lerp(90, 14, sstep(0.29, 0.36, u));
        rw.x = 0.012 + (0.085 * Math.exp(-age * 0.045) + 0.02) * sstep(0.3, 0.34, u); rw.y = 0.55 + 0.5 * sstep(0.3, 0.34, u);
        for (let i = 0; i < NBEAD; i++) {
          const a = i / NBEAD * 6.2832 + 0.4 * Math.sin(i * 3.1), out = 20 + beadOut[i] * (1 - Math.exp(-age * 0.42)), s = age > 0 ? (3 + 3.5 * ((i * 0.382) % 1)) * sstep(0, 0.6, age) : 1e-4;
          _p.copy(mid).addScaledVector(bu, Math.cos(a) * out).addScaledVector(bv, Math.sin(a) * out); _p.y -= 0.12 * age * age * 0.1;
          beads.setMatrixAt(i, _m4.compose(_p, _q.identity(), _s.setScalar(s)));
        }
        beads.instanceMatrix.needsUpdate = true;
      });
    }
    //@@EVENTS

    // The gaze is a pure, smooth function of u: her heart up the flank, then the one boat keyed to u, the Lantern,
    // a point 50 m ahead on the bridge, the Daughter's reef, the Pearl. It never turns past 45 degrees off the course.
    const brAxis = BR_B.clone().sub(BR_A).normalize();
    const pois = [
      // the Moon whole in the frame as the lens comes up to her (u 0.08), then across to the Mother: a designed heading,
      // a pure function of u, that never turns faster than 8 degrees in a hundredth of the flight
      { at: (time, u) => { const yw = (lerp(1, -43, sstep(0.0, 0.1, u)) + 18 * sstep(0.1, 0.155, u)) / 57.2958, pt = lerp(2.5, 9, sstep(0.07, 0.16, u)) / 57.2958;
        return path.pointAt(u, _mp).add(_mq.set(Math.sin(yw), Math.tan(pt), Math.cos(yw)).multiplyScalar(300)); }, from: 0.0, to: 0.16, weight: 1, fade: 0.12 },        // into the Moon: her reef and school
      { at: MOTHER_C.clone().add(V3(40, -6, 0)), from: 0.085, to: 0.5, weight: rare ? 0.52 : 0.62, fade: 0.3 },
      { at: (time, u) => boatAt(u, _bt), from: 0.36, to: 0.48, weight: 0.42, fade: 0.38 },
      ...(rare ? [{ at: rareC.clone(), from: 0.24, to: 0.36, weight: 0.2 }] : []),
      { at: LANTERN_C.clone(), from: 0.43, to: 0.5, weight: 0.25, fade: 0.5 },          // (an early, gentle turn toward the Lantern: the release from the flank is never abrupt)
      { at: LANTERN_C.clone(), from: 0.455, to: 0.545, weight: 0.5 },
      { at: (time, u) => { path.pointAt(u, _poi); const a = _poi.sub(BR_A).dot(brAxis); _poi.addScaledVector(brAxis, -a); const lat = _poi.length();
        return _poi.copy(BR_A).addScaledVector(brAxis, clamp(a + (lerp(0.62, 0.93, sstep(0.61, 0.70, u)) + 2.5 * sstep(0.70, 0.79, u)) * lat, 96, 300)); }, from: 0.565, to: 0.78, weight: 0.6, fade: 0.24 },
      { at: DAUGHTER_C.clone().add(V3(0, -4, 0)), from: 0.73, to: 0.875, weight: 0.36, fade: 0.36 },
      { at: PEARL.clone(), from: 0.84, to: 1.0, weight: 0.5 },
    ];
    const _mp = new THREE.Vector3(), _mq = new THREE.Vector3();
    const _poi = new THREE.Vector3(), _bp = new THREE.Vector3(), _bt = new THREE.Vector3(), _boatPoi = new THREE.Vector3();
    return {
      scene, path, duration: 44, title: 'The Beaded Sea',
      pace: (u) => 1 - 0.27 * sstep(0.52, 0.56, u) * (1 - sstep(0.76, 0.82, u)),      // linger in the Lantern and along the beads
      camera: { fov: 62, near: 0.3, far: 7000, lookAhead: 22, sway: 0.6, bank: 0.8 },
      pois,
      portal: { shape: 'circle', radius: 7, tilt: true, color: '#FFF4E0', glow: 1, revealDistance: 520 },
      post: { exposure: H.exposure, bloom: { strength: 0.32, radius: 0.6, threshold: 1.0 },
        grade: { saturation: 1.06, contrast: 1.04, tint: H.tint, shadowTint: H.shadowTint, vignette: 0.26, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update(dt, time, camera, u) { camera.getWorldPosition(camW); for (let i = 0; i < ups.length; i++) ups[i](dt, time, camera, u); },
      dispose() { for (const d of toDispose) d.dispose(); decalGeo.dispose(); quadGeo.dispose(); },
    };
  },
};
