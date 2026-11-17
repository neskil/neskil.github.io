// MOON IN EVERY PADDY: a spring night printed as a living woodblock.
// A lantern walk along a cedar ridge, a right turn to the brink, then a leaf-fall down a mountainside of
// flooded terraces (each paddy holding its own full moon) to a bench with a round pond and a stone moon
// gate. The hero (src/parts/moon-in-every-paddy.js) is the bowl, the pond and the gate; this file adds the
// sky print, far ridges and mist, the ridge avenue, the farm on the bench and everything that lives here.
// Frame: hero local space == world space. The fall line runs along +Z, the ridge is at -Z.
// Everything is flat palette tones in ShaderMaterials (no lights): the world has its own art style.
//
// VARIATIONS (seed + ctx.vary): hour = midnight | moonrise (huge low amber moon) | predawn (rose-grey horizon,
// thick mist, sometimes a crescent in every paddy); season = spring | rain | summer | autumn; cast swaps =
// cranes for egrets, a fox for the owl, a boatman for the procession, a firework for the ox cart.
// RARE (ctx.vary.rare): a lunar eclipse; a shadow crosses the printed moon and every paddy moon turns amber.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero } from '../parts/moon-in-every-paddy.js';

const TAU = Math.PI * 2;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// triangle soup with flat per-face colour, a sway weight and a glow flag per vertex
function makeSoup() {
  const p = [], c = [], sw = [], gl = [];
  const S = {
    tri(a, b, d, col, s0 = 0, s1 = s0, s2 = s0, g = 0) {
      p.push(a.x, a.y, a.z, b.x, b.y, b.z, d.x, d.y, d.z);
      for (let i = 0; i < 3; i++) { c.push(col.r, col.g, col.b); gl.push(g); }
      sw.push(s0, s1, s2);
    },
    quad(a, b, d, e, col, s0 = 0, s1 = s0, g = 0) { S.tri(a, b, d, col, s0, s0, s1, g); S.tri(a, d, e, col, s0, s1, s1, g); },
    // upright prism between two centres; tone(nx, nz) picks the face colour from its outward direction
    prism(b, t, r0, r1, n, tone, s0 = 0, s1 = 0, rot = 0, g = 0) {
      for (let i = 0; i < n; i++) {
        const a0 = rot + i * TAU / n, a1 = a0 + TAU / n, am = a0 + Math.PI / n;
        const x0 = Math.sin(a0), z0 = Math.cos(a0), x1 = Math.sin(a1), z1 = Math.cos(a1);
        S.quad(V(b.x + x0 * r0, b.y, b.z + z0 * r0), V(b.x + x1 * r0, b.y, b.z + z1 * r0), V(t.x + x1 * r1, t.y, t.z + z1 * r1), V(t.x + x0 * r1, t.y, t.z + z0 * r1), tone(Math.sin(am), Math.cos(am)), s0, s1, g);
      }
    },
    cone(b, tip, r, n, tone, s0 = 0, s1 = 0, rot = 0, g = 0) {
      for (let i = 0; i < n; i++) {
        const a0 = rot + i * TAU / n, a1 = a0 + TAU / n, am = a0 + Math.PI / n;
        S.tri(V(b.x + Math.sin(a0) * r, b.y, b.z + Math.cos(a0) * r), V(b.x + Math.sin(a1) * r, b.y, b.z + Math.cos(a1) * r), tip, tone(Math.sin(am), Math.cos(am)), s0, s0, s1, g);
      }
    },
    // box in a local frame: centre c, half sizes, yaw; tones = { px, nx, pz, nz, top }
    box(cx, cy, cz, hx, hy, hz, yaw, t, g = 0) {
      const cs = Math.cos(yaw), sn = Math.sin(yaw);
      const P = (x, y, z) => V(cx + x * cs + z * sn, cy + y, cz - x * sn + z * cs);
      const k = [P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, -hy, hz), P(-hx, -hy, hz), P(-hx, hy, -hz), P(hx, hy, -hz), P(hx, hy, hz), P(-hx, hy, hz)];
      S.quad(k[3], k[2], k[6], k[7], t.pz, 0, 0, g); S.quad(k[1], k[0], k[4], k[5], t.nz, 0, 0, g);
      S.quad(k[2], k[1], k[5], k[6], t.px, 0, 0, g); S.quad(k[0], k[3], k[7], k[4], t.nx, 0, 0, g);
      S.quad(k[7], k[6], k[5], k[4], t.top, 0, 0, g);
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
      g.setAttribute('aSway', new THREE.Float32BufferAttribute(sw, 1)); g.setAttribute('aGlow', new THREE.Float32BufferAttribute(gl, 1));
      return g;
    },
    async buildAsync(y) {          // the same geometry, its four attributes made in separate short steps
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); await y(); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); await y();
      g.setAttribute('aSway', new THREE.Float32BufferAttribute(sw, 1)); g.setAttribute('aGlow', new THREE.Float32BufferAttribute(gl, 1));
      return g;
    },
    get tris() { return p.length / 9; },
  };
  return S;
}

export default {
  id: 'moon-in-every-paddy',
  name: 'Moon in Every Paddy',
  category: 'wilderness',
  weirdness: 0.15,
  media: ['air', 'open'],
  async build(ctx) {
    const { rng, noise } = ctx;
    const vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 };
    const detail = ctx.quality?.detail ?? 1, dens = clamp(vary.density ?? 1, 0.7, 1.3);

    // ---------------- which night is it ----------------
    const vr = rng.fork('night');
    const hour = vary.hour === 'night' ? 'midnight' : vary.hour === 'golden' ? 'moonrise' : vary.hour === 'dawn' ? 'predawn'
      : vr.pick(['midnight', 'midnight', 'moonrise', 'predawn']);
    const season = vr.pick(['spring', 'spring', 'rain', 'summer', 'autumn']);
    const cast = { cranes: vr.chance(0.4), fox: vr.chance(0.4), boatman: vr.chance(0.35), firework: vr.chance(0.4) };
    const eclipse = !!vary.rare && season !== 'rain';
    const crescent = hour === 'predawn' && !eclipse && vr.chance(0.6);
    const rain = season === 'rain';

    const pal = ['#061417', '#0F2B30', '#1F4A4C', '#5E857A', '#A9C2B4', '#F5EBC8', '#F2A03D'];
    let horizonHex = '#A9C2B4', moonHex = '#F5EBC8';
    if (hour === 'moonrise') { pal[1] = '#122B2D'; pal[2] = '#244B49'; pal[3] = '#69876F'; pal[4] = '#B1C3AC'; pal[5] = '#F6DBA2'; horizonHex = '#BAC2A3'; moonHex = '#F4C98A'; }
    if (hour === 'predawn') { pal[1] = '#102D33'; pal[2] = '#255052'; pal[3] = '#688A82'; pal[4] = '#B6C4BC'; horizonHex = '#C9A9A6'; }
    if (season === 'summer') pal[3] = hour === 'moonrise' ? '#6A9366' : '#5C9070';
    if (season === 'autumn') { pal[3] = '#6E8A84'; pal[4] = '#C2D2CC'; }
    const C = pal.map((h) => new THREE.Color(h));
    const [cInk, cDeep, cTeal, cSage, cMist, cCream, cAmber] = C;
    const mix = (a, b, t) => a.clone().lerp(b, t);
    const cHorizon = new THREE.Color(horizonHex), cMoon = new THREE.Color(moonHex);

    const scene = new THREE.Scene();
    scene.background = cInk.clone();
    const fogCol = mix(cTeal, cMist, hour === 'predawn' ? 0.42 : 0.22).multiplyScalar(0.62);
    const thick = (hour === 'predawn' ? 1 : 0) + (rain ? 1 : 0);
    scene.fog = new THREE.Fog(fogCol, [260, 150, 90][thick], [3600, 1900, 1300][thick]);

    // ---------------- the hero: bowl, pond, gate ----------------
    const hero = await buildHero(ctx, {
      palette: pal, cedars: Math.round(1800 * detail * dens), moonGain: 2.1, minMoonPx: 0.007,
      keepOut: (x, z, R, dr) => { const ph = Math.atan2(x, -z); return Math.abs(ph) < 0.36 && dr < (Math.abs(ph) > 0.17 ? 50 : 22); },
    });
    scene.add(hero.object);
    const A = hero.anchors, U = hero.uniforms, K = A.topLevel, kb = A.benchLevel;
    const seat = A.portalSeat.position, pond = A.pondCenter, waterY = A.waterY, benchY = A.benchY, gateZ = A.gateBase.z;
    const RIDGE_Y = A.levels[K], rimR = A.radiusAt(0, K);
    if (crescent) U.uCres.value = 0.5;
    if (ctx.through) { U.uMinPx.value = 0.014; U.uOv.value.set(28, 70); }
    if (rain) U.uRain.value = 1;
    if (season === 'spring' || rain) { const g = mix(cTeal, cSage, 0.3); U.uRice.value.set(g.r, g.g, g.b, 1); }
    if (season === 'summer') { const g = mix(cTeal, cSage, 0.9); U.uRice.value.set(g.r, g.g, g.b, 1.05); }
    if (season === 'autumn') { const g = mix(cSage, cAmber, 0.25).multiplyScalar(0.7); U.uRice.value.set(g.r, g.g, g.b, 0.8); U.uFrost.value = 0.32; }
    const moonBase = U.uMoonCol.value.clone(), moonAmber = mix(cAmber, cCream, 0.16).multiplyScalar(2.3);
    await ctx.yield();

    // ---------------- the flight ----------------
    // along the crest (heading +X, the bowl on the right), a right turn through the last trunks to the brink,
    // down the fall line 5-6 m above each terrace, level on the bench, out over the pond and through the ring
    const pts = [];
    const side = rng.chance(0.5) ? -1 : 1;                       // which arm of the ridge we walk in on
    for (const [ph, lat, h] of [[0.192, 9.5, 3.2], [0.156, 4.0, 3.2], [0.125, 4.8, 2.9], [0.095, 7.0, 2.6], [0.064, 4.4, 3.4]]) { const q = A.contour(-side * ph, K, lat); pts.push(V(q.x, RIDGE_Y + h, q.z)); }   // drifting up and out to the rim
    // the previous world looks in from up to ~60 m behind the entry, along the entry tangent: that line comes in over the outer edge of the
    // crest and aims about 25 degrees into the bowl, so the far wall's moons and the shrine gate sit on the entry axis
    const backFar = A.contour(-side * 0.31, K, 44); backFar.y = RIDGE_Y + 3.2;
    const backDir = pts[0].clone().sub(backFar).normalize();
    pts.splice(1, 0, pts[0].clone().addScaledVector(backDir, 7));
    pts.push(V(-side * 12.5, RIDGE_Y + 4.5, -(rimR + 1.2)), V(-side * 3.2, RIDGE_Y + 5.2, -(rimR - 4.5)));     // rising to the brink so the eye is over the lip
    const fly = A.flyThrough;
    const iSlope = pts.length;
    // THE LEAF-FALL SWINGS (a change of path in space; the clock is untouched): it no longer drops straight down the fall line. It leaves the
    // brink still carrying the avenue's heading, swings out about 15 m to that side (past the stilt house and its wheel), comes back across
    // the fall line to about 8 m on the other side (the bund the lanterns walk), and is back on the line where the bench begins.
    const slopeLat = [[0.08, 3.5], [0.22, 10.5], [0.36, 15.5], [0.5, 12], [0.64, 2], [0.78, -7.5], [0.92, -3.5]];
    const slopeAt = (f, lat, out = V(0, 0, 0)) => {                 // a point of the slope: f = 0 under the brink .. 1 at the bench wall, lat metres to the avenue's far side
      const r = lerp(A.radiusAt(0, K - 1) + 3, A.radiusAt(0, kb + 1) + 3, f), ph = side * lat / r;
      return out.set(r * Math.sin(ph), 0, -r * Math.cos(ph));
    };
    for (const [f, lat] of slopeLat) {
      const q = slopeAt(f, lat), rr = Math.hypot(q.x, q.z), g = Math.max(A.heightAt(q.x, q.z), A.heightAt(q.x * (1 + 2.5 / rr), q.z * (1 + 2.5 / rr)));
      q.y = g + (f > 0.15 && f < 0.45 ? 4.7 : 5.4); pts.push(q);
    }
    // the bench is 74-88 m deep by seed: the approach is taken from the terrain, never from a fixed distance. One point over the lowest
    // terrace above the bench, then the bench point at least 9 m out from that terrace's wall.
    const rWall = A.radiusAt(0, kb + 1), zLast = pts[pts.length - 1].z;
    if (-(rWall + 3) - zLast > 2.5) pts.push(V(0.8, A.levels[kb + 1] + 5.5, -(rWall + 3)));
    pts.push(V(4.4, benchY + 6.2, Math.max(pond.z - A.pondRadius - 30, -(rWall - 9))), V(3.4, benchY + 8.4, pond.z - A.pondRadius - 13), V(1.2, waterY + 10.4, pond.z - A.pondRadius + 2), V(0, waterY + 10.9, pond.z - 12),
      V(0, waterY + 10.1, pond.z + 3), V(0, seat.y + 0.35, gateZ - 13), seat.clone());       // over the bench and the pond at roof height, then easing down to the ring: the pond, its broken moon and the arms of the bowl fill the frame
    await ctx.yield();
    let path = makePath(pts);
    await ctx.yield();
    // guard: from the brink to the pond the eye never comes within 3 m of a dyke top. Where a sample is short, the two control
    // points either side of it (by z: the descent only ever runs downhill) are raised by the shortfall, and the curve is rebuilt.
    {
      const q = V(0, 0, 0), iEnd = pts.length - 4, zEnd = pond.z - A.pondRadius;
      for (let pass = 0; pass < 4; pass++) {
        const lift = new Float32Array(pts.length); let bad = false;
        for (let i = 0; i <= 400; i++) {
          if (i % 100 === 99) await ctx.yield();
          path.pointAt(i / 400, q); if (q.z < pts[iSlope].z || q.z > zEnd) continue;
          let g = -1e9; for (const [dx, dz] of [[0, 0], [1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2]]) g = Math.max(g, A.heightAt(q.x + dx, q.z + dz));
          const short = 3 - (q.y - (g + 1.0)); if (short <= 0) continue;
          let j = iSlope; while (j < iEnd && pts[j + 1].z <= q.z) j++;
          lift[j] = Math.max(lift[j], short + 0.5); if (j < iEnd) lift[j + 1] = Math.max(lift[j + 1], short + 0.5); bad = true;
        }
        if (!bad) break;
        for (let j = iSlope; j <= iEnd; j++) pts[j].y += lift[j];
        path = makePath(pts);
      }
    }
    await ctx.yield();
    const duration = 46;
    const uOfZ = (z, from = 0.3) => { let best = from, bd = 1e9; const q = V(0, 0, 0); for (let i = 0; i <= 200; i++) { const u = from + (1 - from) * i / 200; path.pointAt(u, q); const d = Math.abs(q.z - z); if (d < bd) { bd = d; best = u; } } return best; };
    const uBrink = path.nearestXZ(0, -(rimR - 0.5)).u, uBench = uOfZ(pond.z - A.pondRadius - 27), uPond = uOfZ(pond.z - A.pondRadius);
    const pathDist = (x, z) => {
      const s = clamp((x - backFar.x) * backDir.x + (z - backFar.z) * backDir.z, 0, pts[0].distanceTo(backFar));
      return Math.min(path.nearestXZ(x, z).dist, Math.hypot(x - backFar.x - backDir.x * s, z - backFar.z - backDir.z * s));
    };

    await ctx.yield();
    // ---------------- the lantern walk: where the paper lanterns hang (known before the trunks, which take their light) ----------------
    // wk is this walk's own generator, so nothing the seed chose before it is redrawn
    const wk = ctx.core.makeRng(ctx.core.hashSeed('lantern-walk:' + ctx.seed));
    const dBrink = uBrink * path.length;
    const _wq = V(0, 0, 0), _wt = V(0, 0, 0);
    // a point of the walk: d metres along the path, lat metres toward the bowl (negative = the outer, cedar side), on the crest ground
    const walkAt = (d, lat, y = 0) => {
      path.posAtDist(d, _wq); path.tangentAtDist(d, _wt); const l = Math.hypot(_wt.x, _wt.z) || 1;
      return V(_wq.x - _wt.z / l * side * lat, RIDGE_Y + y, _wq.z + _wt.x / l * side * lat);
    };
    const walkDir = (d) => { path.tangentAtDist(d, _wt); const l = Math.hypot(_wt.x, _wt.z) || 1; return { tx: _wt.x / l, tz: _wt.z / l, bx: -_wt.z / l * side, bz: _wt.x / l * side }; };
    const onGround = (x, z) => { const rr = Math.hypot(x, z), ki = 1 - 1.2 / Math.max(rr, 1); return A.heightAt(x * ki, z * ki) >= RIDGE_Y - 0.01; };
    const lamps = [];                                                 // { p: lantern centre, foot, d, bowl }
    for (let d = 12, i = 0; d < dBrink - 5; d += 6.2, i++) {
      const bowl = i % 2 === 1, lat = bowl ? 3.3 : -3.5, foot = walkAt(d, lat);
      if (bowl && !onGround(foot.x, foot.z)) continue;
      const p = walkAt(d, lat * 0.8, 2.55 + 0.5 * wk()); lamps.push({ p, foot, d, bowl });
    }
    const lampNear = (x, z, r) => { let best = null, bd = r * r; for (const L of lamps) { const dd = (L.p.x - x) ** 2 + (L.p.z - z) ** 2; if (dd < bd) { bd = dd; best = L; } } return best; };

    await ctx.yield();
    // ---------------- shared flat-tone material ----------------
    const HEAD = /* glsl */`
      uniform float uTime, uFront, uLanK; uniform vec4 uLantern; uniform vec3 cTeal, cAmber;
      float breezeAmp(float z){ float tau = (uFront - z) / 25.; return smoothstep(0., .3, tau) * (1. - smoothstep(1., 3.2, tau)); }
      // the lantern's pool: a hard-edged one-step tone lift that keeps the hue, cut by eight swinging rib shadows
      vec3 lanternPool(vec3 col, vec3 wp, float keep){
        vec3 dl = wp - uLantern.xyz;
        if (uLantern.w > 0. && dot(dl.xz, dl.xz) < uLantern.w * uLantern.w && abs(dl.y) < 3.5) {
          float rib = step(.82, fract(atan(dl.x, abs(dl.z) < 1e-4 ? 1e-4 : dl.z) * 1.2732 + .3 * sin(uTime * .9)));
          col = mix(col, col * 1.5 + cAmber * (.012 + .2 * dot(col, vec3(.333))), (1. - rib) * keep * uLanK);
        }
        return col;
      }
      // static paper fibre: short horizontal strands hashed on the pixel, no time term
      float paper(vec2 fc){ vec2 q = floor(fc * vec2(.34, 1.)); float h = fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453); return .962 + .07 * h; }
    `;
    const FRAG = HEAD + /* glsl */`
      varying vec3 vCol, vW; varying float vGlow;
      #include <fog_pars_fragment>
      void main(){
        vec3 col = vCol; float keep = 1. - clamp(vGlow, 0., 1.);
        col = mix(col, mix(col, cTeal, .45), smoothstep(300., 440., distance(vW, cameraPosition)) * keep);
        col = lanternPool(col, vW, keep) * paper(gl_FragCoord.xy);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
        gl_FragColor.rgb = mix(gl_FragColor.rgb, col, clamp(vGlow, 0., 1.) * .7);
      }`;
    const mkU = (extra = {}) => ({ ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: U.uTime, uFront: U.uFront, uLantern: U.uLantern, uLanK: U.uLanK, cTeal: U.cTeal, cAmber: U.cAmber, ...extra });
    // body: GLSL that turns `vec3 p` (object space) into a world-space `vec4 wp`
    const flatMat = (body, extra = {}, decl = '') => new THREE.ShaderMaterial({
      uniforms: mkU(extra), fog: true, side: THREE.DoubleSide, vertexColors: true,
      vertexShader: HEAD + /* glsl */`
        attribute float aSway, aGlow; ${decl}
        varying vec3 vCol, vW; varying float vGlow;
        #include <fog_pars_vertex>
        void main(){
          vec3 p = position; vCol = color; vGlow = aGlow; vec4 wp;
          ${body}
          vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: FRAG,
    });
    const SWAY = /* glsl */`
      p.x += aSway * (.5 * sin(uTime * .9 + p.x * .05 + p.z * .08) + .25 * sin(uTime * 2.3 + p.z * .3 + p.x * .2));
      p.z += aSway * (2.2 * breezeAmp(p.z) + .2 * sin(uTime * 1.4 + p.x * .21));
      wp = modelMatrix * vec4(p, 1.);`;
    const propMat = flatMat(SWAY);
    const big = (mesh, y = 150, r = 1200) => { mesh.geometry.boundingSphere = new THREE.Sphere(V(0, y, 0), r); return mesh; };

    // tones by face direction: the moon is over +Z, so +Z faces carry the pale edge
    const tBark = (nx, nz) => (nz > 0.72 ? mix(cTeal, cSage, 0.8) : nz > 0.1 ? mix(cDeep, cTeal, 0.5) : mix(cInk, cDeep, nx * side < 0 ? 0.55 : 0.2));
    const tLeaf = (nx, nz) => (nz > 0.45 ? mix(cDeep, cTeal, 0.42) : nz > -0.3 ? mix(cInk, cDeep, 0.8) : mix(cInk, cDeep, 0.3));          // crowns in three printed steps, the moon side one tone up
    const tStone = { pz: mix(cMist, cCream, 0.15).multiplyScalar(0.85), nz: mix(cTeal, cSage, 0.75), px: mix(cTeal, cSage, 0.55), nx: mix(cSage, cMist, 0.3), top: mix(cSage, cMist, 0.6) };
    const tWood = { pz: mix(cSage, cMist, 0.3), nz: mix(cInk, cDeep, 0.5), px: mix(cDeep, cTeal, 0.4), nx: mix(cDeep, cTeal, 0.75), top: mix(cTeal, cSage, 0.5) };
    const tDark = { pz: mix(cDeep, cTeal, 0.6), nz: cInk.clone(), px: mix(cInk, cDeep, 0.5), nx: mix(cInk, cDeep, 0.8), top: mix(cDeep, cTeal, 0.3) };
    const glowAmber = cAmber.clone().multiplyScalar(3.2), glowCream = cCream.clone().multiplyScalar(1.5);
    const tGlow = { pz: glowAmber, nz: glowAmber, px: glowAmber, nx: glowAmber, top: glowAmber };

    const props = makeSoup();          // everything static or wind-swayed
    const halos = [];                  // printed halos round every warm light: x, y, z, radius

    // ---------------- the ridge avenue: trunks, canopy, ferns, path stones, shrine gate ----------------
    const crestR = (ph) => A.radiusAt(ph, K);
    const onCrest = (ph, lat) => { const r = crestR(ph) + 8 + lat; return V(r * Math.sin(ph), RIDGE_Y, -r * Math.cos(ph)); };
    const trunks = [];
    {
      const tr = rng.fork('trunks');
      const cWarm = mix(mix(cTeal, cSage, 0.5), cAmber, 0.3), cWarm2 = mix(cDeep, cAmber, 0.14), cWarm3 = mix(cInk, cAmber, 0.14);   // the lantern's light, in flat steps
      const C7 = Math.cos(Math.PI / 7);
      const cedar = (b, h, full) => {
        const r0 = full ? tr.range(0.5, 0.68) : 0.4, top = V(b.x + tr.range(-0.5, 0.5), b.y + h * 0.62, b.z + tr.range(-0.5, 0.5));
        const rot0 = tr.range(0, 1), base = V(b.x, b.y - 0.4, b.z), rb = r0 * 1.25, rt = r0 * 0.45;
        const L = full ? lampNear(b.x, b.z, 9) : null;
        let tLit = tBark;
        if (L) {                                                     // the lower trunk takes the lantern on its near flank
          const f = 6.6 / (h * 0.62 + 0.4), mid = base.clone().lerp(top, f), rm = lerp(rb, rt, f);
          const lx = L.p.x - b.x, lz = L.p.z - b.z, ll = Math.hypot(lx, lz) || 1;
          tLit = (nx, nz) => { const k = (nx * lx + nz * lz) / ll; return k > 0.7 ? cWarm : k > 0.15 ? cWarm2 : tBark(nx, nz); };
          props.prism(base, mid, rb, rm, 7, tLit, 0, 0.02, rot0); props.prism(mid, top, rm, rt, 7, tBark, 0.02, 0.15, rot0);
        } else props.prism(base, top, rb, rt, 7, tBark, 0, 0.15, rot0);
        props.cone(V(b.x, b.y + 0.9, b.z), base, r0 * 1.9, 7, (nx, nz) => (L ? tLit(nx, nz) : nz > 0.1 ? mix(cTeal, cSage, 0.62) : mix(cDeep, cTeal, 0.45)));          // root flare, mossed
        if (full) {                                                  // printed bark: long ink strokes down every face, moss tongues at the foot
          const pt = (f, am, o) => { const r = lerp(rb, rt, f) * C7 + 0.02; return V(lerp(base.x, top.x, f) + Math.sin(am) * r + Math.cos(am) * o, lerp(base.y, top.y, f), lerp(base.z, top.z, f) + Math.cos(am) * r - Math.sin(am) * o); };
          const H = h * 0.62 + 0.4;
          for (let i = 0; i < 7; i++) {
            const am = rot0 + (i + 0.5) * TAU / 7, nx = Math.sin(am), nz = Math.cos(am), lit = nz > 0.72, mid = nz > 0.1, fw = rb * 0.42;
            const cLine = lit ? mix(cDeep, cTeal, 0.7) : mid ? mix(cInk, cDeep, 0.4) : mix(cDeep, cTeal, 0.5);
            for (let j = 0; j < 3; j++) {
              const o = (j - 1) * fw * 0.62 + wk.range(-0.05, 0.05), f0 = (0.5 + wk() * 3) / H, f1 = Math.min(1, f0 + wk.range(2.5, 9) / H), w = 0.028 + 0.02 * wk();
              const k0 = lerp(rb, rt, f0) / rb, k1 = lerp(rb, rt, f1) / rb;
              props.quad(pt(f0, am, (o - w) * k0), pt(f0, am, (o + w) * k0), pt(f1, am, (o + w * 0.6) * k1), pt(f1, am, (o - w * 0.6) * k1), cLine);
            }
            if (wk() < 0.7) {
              const cM = lit ? mix(cSage, cMist, 0.3) : mid ? mix(cTeal, cSage, 0.75) : mix(cTeal, cSage, 0.3), mh = wk.range(0.9, 2.4) / H, o = wk.range(-0.25, 0.25) * fw;
              props.tri(pt(0.02, am, o - fw * 0.5), pt(0.02, am, o + fw * 0.5), pt(0.02 + mh, am, o + wk.range(-0.1, 0.1)), cM);
            }
          }
        }
        const R = h * tr.range(0.17, 0.22), rot = tr.range(0, 6.28), y0 = full ? 8.5 + tr.range(0, 3) : h * 0.16;
        for (let t = 0; t < 3; t++) {
          const yb = b.y + y0 + (h - y0) * 0.27 * t, yt = t === 2 ? b.y + h : yb + (h - y0) * 0.5;
          const s0 = Math.pow((yb - b.y) / h, 2), s1 = Math.pow((yt - b.y) / h, 2), Rt = R * (1 - 0.26 * t);
          props.cone(V(b.x, yb, b.z), V(top.x, yt, top.z), Rt, 5, L && t === 0 ? (nx, nz) => mix(tLeaf(nx, nz), cWarm3, 0.3) : tLeaf, s0, s1, rot + t);
          for (let q = 0; q < 5; q++) {                              // needle sprays hanging off each bough tier: the crowns are layered, never one black mass
            const a = rot + t + q * TAU / 5, ex = Math.sin(a), ez = Math.cos(a), sx = Math.cos(a) * Rt * 0.3, sz = -Math.sin(a) * Rt * 0.3;
            const c = L && t === 0 ? mix(cDeep, cAmber, 0.09) : ez > 0.2 ? mix(cDeep, cTeal, 0.75) : mix(cDeep, cTeal, 0.2);
            props.tri(V(b.x + ex * Rt * 0.92 - sx, yb + Rt * 0.12, b.z + ez * Rt * 0.92 - sz), V(b.x + ex * Rt * 0.92 + sx, yb + Rt * 0.12, b.z + ez * Rt * 0.92 + sz), V(b.x + ex * Rt * 1.12, yb - Rt * 0.22, b.z + ez * Rt * 1.12), c, s0, s0, s0 + 0.03);
          }
        }
      };
      let n = 0;
      for (let i = 0; i < 900 && n < 74; i++) {
        if ((i & 3) === 3) await ctx.yield();
        const ph = -side * tr.range(-0.11, 0.3), inner = tr.chance(0.5), lat = inner ? -tr.range(3.4, 7.2) : tr.range(3.4, 9.5);
        const b = onCrest(ph, lat), d = pathDist(b.x, b.z);
        if (d < (-side * ph > 0.185 ? 7 : 3.5) || (Math.abs(b.x) < 7.5 && inner)) continue;          // a wider gap where the previous world looks in
        if (inner && -side * ph > 0.192 - 60 / rimR) continue;          // the entry stretch: the bowl side stands open for 60 m, so the far wall's moons fill that half of the first view
        if (trunks.some((q) => (q.x - b.x) ** 2 + (q.z - b.z) ** 2 < 10)) continue;
        trunks.push(b); cedar(b, tr.range(24, 34), true); n++;
      }
      await ctx.yield();
      // the outer slope behind the avenue: plain stacked-triangle cedars so the skyline stays closed
      for (let i = 0; i < 70; i++) {
        const ph = -side * tr.range(-0.16, 0.34), dr = tr.range(11, 34), b = onCrest(ph, dr); if (pathDist(b.x, b.z) < 9) continue;
        b.y = RIDGE_Y + 0.3 - Math.max(0, dr - 8) * 0.45; cedar(b, tr.range(22, 34), false);
      }
      await ctx.yield();
      for (let i = 0; i < 46; i++) {                                 // the other arm of the crest, seen from the brink
        const b = onCrest(side * tr.range(0.1, 0.37), tr.range(-5, 13)); b.y = RIDGE_Y + 0.3; if (pathDist(b.x, b.z) > 9) cedar(b, tr.range(22, 34), false);
      }
    }
    await ctx.yield();

    const shrineLamp = V(0, 0, 0);
    {
      const fr = rng.fork('ridge');
      // stepping stones down the middle of the walk
      const q = V(0, 0, 0), t = V(0, 0, 0), cStone = mix(cTeal, cSage, 0.3), cStone2 = mix(cTeal, cSage, 0.62);
      for (let d = -3; d < uBrink * path.length - 3; d += 1.5) {
        path.posAtDist(d, q); path.tangentAtDist(d, t); const nx = -t.z, nz = t.x, o = fr.range(-0.3, 0.3), w = fr.range(0.4, 0.62), l = fr.range(0.42, 0.6), y = RIDGE_Y + 0.07;
        const cx = q.x + nx * o, cz = q.z + nz * o, rr = Math.hypot(cx, cz), ki = 1 - 1.0 / Math.max(rr, 1);
        if (A.heightAt(cx * ki, cz * ki) < RIDGE_Y - 0.01) continue;          // no stone may hang out over the brink
        props.quad(V(cx - nx * w - t.x * l, y, cz - nz * w - t.z * l), V(cx + nx * w - t.x * l, y, cz + nz * w - t.z * l), V(cx + nx * w + t.x * l, y, cz + nz * w + t.z * l), V(cx - nx * w + t.x * l, y, cz - nz * w + t.z * l), ((pale, warm) => (warm ? mix(pale ? cStone2 : cStone, cAmber, pale ? 0.5 : 0.38) : pale ? cStone2 : cStone))(fr.chance(0.3), lampNear(cx, cz, 2.3)));
      }
      // ferns and low scrub: closes the bowl side at knee height so only glints show between the trunks
      const fern = (b, h, pale) => {
        const n = 5 + fr.int(0, 3), rot = fr.range(0, 6.28);
        for (let i = 0; i < n; i++) {
          const a = rot + i * TAU / n, r = h * fr.range(0.9, 1.5), tipv = V(b.x + Math.sin(a) * r, b.y + h * fr.range(0.5, 1), b.z + Math.cos(a) * r);
          const sx = Math.cos(a) * h * 0.22, sz = -Math.sin(a) * h * 0.22;
          props.tri(V(b.x - sx, b.y, b.z - sz), V(b.x + sx, b.y, b.z + sz), tipv, Math.cos(a) > 0.4 && pale ? mix(cTeal, cSage, 0.4) : mix(cDeep, cTeal, fr.range(0.2, 0.7)), 0, 0, 0.14 * h);
        }
      };
      for (let i = 0; i < 380 * detail; i++) {
        const ph = -side * fr.range(-0.1, 0.3), lat = fr.range(-8, 8), b = onCrest(ph, lat), d = pathDist(b.x, b.z);
        if ((i & 63) === 63) await ctx.yield();
        if (d < 1.5) continue;
        const fh = lat < -5.5 ? fr.range(0.9, 1.7) : fr.range(0.35, 0.8) * (d < 3 ? 0.7 : 1);
        fern(b, Math.abs(b.x) < 17 || -side * ph > 0.12 ? Math.min(fh, 0.5) : fh, true);      // knee high at the brink and by the entry
      }
      // the shrine gate with two stone lanterns, bowl side, a few seconds in
      let best = null, bs = -1;
      for (let i = 0; i < 40; i++) {
        const ph = -side * (0.158 - i * 0.0006), b = onCrest(ph, -7.1); let m = 99;
        for (const tk of trunks) m = Math.min(m, Math.hypot(tk.x - b.x, tk.z - b.z));
        if (m > bs) { bs = m; best = { ph, b }; }
      }
      {
        const { ph, b } = best, yaw = -ph + Math.PI / 2;           // posts stand along the contour; we look through it into the bowl
        const tx = Math.cos(ph), tz = Math.sin(ph), rx = Math.sin(ph), rz = -Math.cos(ph);
        const at = (a, r, y) => V(b.x + tx * a + rx * r, RIDGE_Y + y, b.z + tz * a + rz * r);
        for (const s of [-1, 1]) {
          const f = at(s * 1.6, 0, 0); props.prism(f, V(f.x - tx * s * 0.12, f.y + 3.9, f.z - tz * s * 0.12), 0.2, 0.16, 6, (nx, nz) => (nz > 0.5 ? mix(cSage, cMist, 0.7) : nz > -0.2 ? mix(cTeal, cSage, 0.7) : mix(cDeep, cTeal, 0.6)));
          const e = at(s * 2.75, 0, 4.42);
          props.box(e.x, e.y, e.z, 0.5, 0.11, 0.26, yaw, tWood);                                             // upturned lintel ends
        }
        const l1 = at(0, 0, 4.12), l2 = at(0, 0, 3.3), l3 = at(0, 0, 4.36);
        props.box(l1.x, l1.y, l1.z, 2.5, 0.17, 0.2, yaw, tWood); props.box(l2.x, l2.y, l2.z, 1.9, 0.11, 0.12, yaw, tWood);
        props.box(l3.x, l3.y, l3.z, 2.7, 0.07, 0.3, yaw, { ...tWood, top: mix(cSage, cMist, 0.75), nz: mix(cTeal, cSage, 0.5) });
        // paper streamers on the tie beam, nodding
        for (let i = -3; i <= 3; i++) { const a = at(i * 0.45 - 0.1, 0, 3.2), c = at(i * 0.45 + 0.1, 0, 3.2), d = at(i * 0.45 + 0.05, 0, 2.72); props.tri(a, c, d, mix(cMist, cCream, 0.5).multiplyScalar(0.8), 0, 0, 0.12); }
        const stoneLantern = (c0, lit) => {
          props.box(c0.x, c0.y + 0.15, c0.z, 0.42, 0.15, 0.42, yaw, tStone); props.box(c0.x, c0.y + 0.8, c0.z, 0.15, 0.5, 0.15, yaw, tStone);
          props.box(c0.x, c0.y + 1.36, c0.z, 0.36, 0.07, 0.36, yaw, tStone);
          props.box(c0.x, c0.y + 1.66, c0.z, 0.24, 0.23, 0.24, yaw, lit ? tGlow : tDark, lit ? 1 : 0);
          for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) props.box(c0.x + dx * 0.24 * Math.cos(yaw) + dz * 0.24 * Math.sin(yaw), c0.y + 1.66, c0.z - dx * 0.24 * Math.sin(yaw) + dz * 0.24 * Math.cos(yaw), 0.05, 0.24, 0.05, yaw, tStone);
          props.cone(V(c0.x, c0.y + 1.9, c0.z), V(c0.x, c0.y + 2.32, c0.z), 0.6, 4, (nx, nz) => (nz > 0.3 ? mix(cSage, cMist, 0.7) : mix(cTeal, cSage, 0.45)), 0, 0, yaw + Math.PI / 4);
        };
        stoneLantern(at(-side * 2.9, 0.5, 0), true); stoneLantern(at(side * 2.9, 0.5, 0), false);          // the lit one stands nearer the entry
        shrineLamp.copy(at(-side * 2.9, 0.5, 1.66));
        const hl = at(0, 0, 2.55); props.box(hl.x, hl.y + 0.36, hl.z, 0.02, 0.36, 0.02, yaw, tDark);            // a paper lantern hung under the tie beam: the warm point the entry axis finds
        props.box(hl.x, hl.y - 0.1, hl.z, 0.24, 0.3, 0.24, yaw, { pz: glowAmber, nz: glowAmber, px: glowAmber, nx: glowAmber, top: glowCream }, 1);
        props.box(hl.x, hl.y + 0.22, hl.z, 0.28, 0.035, 0.28, yaw, tDark); props.box(hl.x, hl.y - 0.42, hl.z, 0.28, 0.035, 0.28, yaw, tDark);
      }
    }
    await ctx.yield();

    // ---------------- the lantern walk: paper lanterns on posts, their pools of light, three torii ----------------
    const cRed = new THREE.Color(cAmber.r * 0.8, cAmber.g * 0.42, cAmber.b * 0.55);                // the walk's vermilion: the print's amber, burnt
    const cVerm = mix(cRed, cInk, 0.22), cVermM = mix(cRed, cInk, 0.45), cVermD = mix(cRed, cInk, 0.68), cVermT = mix(cRed, cAmber, 0.45).multiplyScalar(0.8);
    const tVerm = { pz: cVerm, nz: cVermD, px: cVermM, nx: cVermM, top: cVermT };
    const glowAmber2 = cAmber.clone().multiplyScalar(2.3), glowPale = mix(cAmber, cCream, 0.45).multiplyScalar(3.0);
    const paperLantern = (S, c, sc = 1, sway = 0.1) => {             // a chochin: three hexagonal courses of lit paper between dark hoops, a tassel under it
      const r = 0.28 * sc, hh = 0.36 * sc, tone = (nx, nz) => (nz > 0.4 ? glowPale : nx > 0.3 ? glowAmber : glowAmber2);
      S.prism(V(c.x, c.y - hh, c.z), V(c.x, c.y - hh * 0.4, c.z), r * 0.6, r, 6, tone, sway, sway, 0, 1);
      S.prism(V(c.x, c.y - hh * 0.4, c.z), V(c.x, c.y + hh * 0.4, c.z), r, r, 6, tone, sway, sway, 0, 1);
      S.prism(V(c.x, c.y + hh * 0.4, c.z), V(c.x, c.y + hh, c.z), r, r * 0.6, 6, tone, sway, sway, 0, 1);
      S.box(c.x, c.y + hh + 0.04 * sc, c.z, r * 0.66, 0.045 * sc, r * 0.66, 0, tDark); S.box(c.x, c.y - hh - 0.04 * sc, c.z, r * 0.66, 0.045 * sc, r * 0.66, 0, tDark);
      S.tri(V(c.x - 0.04 * sc, c.y - hh - 0.08 * sc, c.z), V(c.x + 0.04 * sc, c.y - hh - 0.08 * sc, c.z), V(c.x, c.y - hh - 0.5 * sc, c.z), cVerm, sway, sway, sway * 2.2);
    };
    {
      const poolA = mix(mix(cDeep, cTeal, 0.5), cAmber, 0.15), poolB = mix(cTeal, cAmber, 0.3);
      for (const L of lamps) {
        const { tx, tz, bx, bz } = walkDir(L.d), yaw = Math.atan2(bx, bz), f = L.foot, s = L.bowl ? -1 : 1;
        props.box(f.x, RIDGE_Y + 1.85, f.z, 0.075, 1.85, 0.075, yaw, tWood); props.box(f.x, RIDGE_Y + 0.12, f.z, 0.2, 0.12, 0.2, yaw, tStone);
        const ax = (f.x + L.p.x) / 2, az = (f.z + L.p.z) / 2, al = Math.hypot(f.x - L.p.x, f.z - L.p.z) / 2 + 0.25;
        props.box(ax, RIDGE_Y + 3.62, az, 0.045, 0.045, al, yaw, tWood); props.box(f.x, RIDGE_Y + 3.76, f.z, 0.3, 0.04, 0.3, yaw, { ...tWood, top: mix(cSage, cMist, 0.6) });
        props.box(L.p.x, (L.p.y + 0.42 + RIDGE_Y + 3.6) / 2, L.p.z, 0.012, (RIDGE_Y + 3.6 - L.p.y - 0.42) / 2, 0.012, yaw, tDark);
        paperLantern(props, L.p, 1.0, 0.1); halos.push(L.p.x, L.p.y, L.p.z, 1.35);
        // the pool on the ground: two flat steps of warm tone, pulled in where the brink is near
        const N = 14, rim = [], inn = [], c0 = V(L.p.x, RIDGE_Y + 0.035, L.p.z);
        for (let i = 0; i < N; i++) {
          const a = i * TAU / N, wob = 1 + 0.12 * Math.sin(a * 3 + L.d); let r = 2.4 * wob;
          while (r > 0.4 && !onGround(c0.x + Math.sin(a) * r, c0.z + Math.cos(a) * r)) r -= 0.3;
          rim.push(V(c0.x + Math.sin(a) * r, c0.y, c0.z + Math.cos(a) * r)); inn.push(V(c0.x + Math.sin(a) * r * 0.52, c0.y + 0.01, c0.z + Math.cos(a) * r * 0.52));
        }
        for (let i = 0; i < N; i++) { const j = (i + 1) % N; props.quad(rim[i], rim[j], inn[j], inn[i], poolA); props.tri(inn[i], inn[j], V(c0.x, c0.y + 0.01, c0.z), poolB); }
      }
      await ctx.yield();
      // three torii across the walk, receding: vermilion in the print's own amber, darkened
      const torii = (d0) => {
        let best = null, bs = -1;
        for (let k = -4; k <= 4; k++) {
          const d = d0 + k * 0.5, a = walkAt(d, -3.7), b = walkAt(d, 3.7); if (!onGround(b.x, b.z)) continue; let m = 99;
          for (const tk of trunks) m = Math.min(m, Math.hypot(tk.x - a.x, tk.z - a.z), Math.hypot(tk.x - b.x, tk.z - b.z));
          if (m > bs) { bs = m; best = d; }
        }
        if (best === null) return;
        const { bx, bz } = walkDir(best), yaw = Math.atan2(bx, bz), c = walkAt(best, 0), at = (lat, y) => V(c.x + bx * lat, RIDGE_Y + y, c.z + bz * lat);
        const tPost = (nx, nz) => (nz > 0.4 ? cVerm : nz > -0.3 ? cVermM : cVermD);
        for (const s of [-1, 1]) {
          props.prism(at(s * 3.7, 0.35), at(s * 3.55, 5.45), 0.27, 0.22, 8, tPost); const f = at(s * 3.7, 0.2); props.box(f.x, f.y, f.z, 0.42, 0.2, 0.42, yaw, tDark);
          const e = at(s * 5.05, 6.02); props.box(e.x, e.y, e.z, 0.24, 0.13, 0.42, yaw, { ...tVerm, top: mix(cInk, cDeep, 0.6) });          // upturned ends of the top beam
        }
        const k1 = at(0, 5.72), k2 = at(0, 5.98), k3 = at(0, 4.6), k4 = at(0, 5.16);
        props.box(k1.x, k1.y, k1.z, 0.24, 0.16, 4.7, yaw, tVerm); props.box(k2.x, k2.y, k2.z, 0.3, 0.1, 4.95, yaw, { ...tDark, top: mix(cTeal, cSage, 0.5), pz: mix(cDeep, cTeal, 0.7) });
        props.box(k3.x, k3.y, k3.z, 0.16, 0.14, 4.25, yaw, tVerm); props.box(k4.x, k4.y, k4.z, 0.14, 0.42, 0.16, yaw, tVerm);
        for (const sl of [-1, 1]) { const hl = at(sl * 2.35, 3.98); paperLantern(props, hl, 0.9, 0.12); halos.push(hl.x, hl.y, hl.z, 1.2); }          // a lantern under each end of the tie beam, clear of the eye's own line
      };
      for (const d0 of [21, 32.5, 44]) if (d0 < dBrink - 14) torii(d0);
      if (!cast.fox) {                                               // the owl, before its one crossing: perched on the second gate's top beam, eyes lit
        const { bx, bz, tx, tz } = walkDir(32.5), c = walkAt(32.5, 1.7, 6.08), cO = mix(cSage, cMist, 0.6), cOd = mix(cTeal, cSage, 0.6), ey = { pz: glowPale, nz: glowPale, px: glowPale, nx: glowPale, top: glowPale };
        props.prism(c, V(c.x, c.y + 0.62, c.z), 0.2, 0.24, 6, (nx, nz) => (nx * tx + nz * tz < -0.2 ? mix(cMist, cCream, 0.5).multiplyScalar(0.85) : nz > 0 ? cO : cOd));
        props.cone(V(c.x, c.y + 0.62, c.z), V(c.x, c.y + 0.8, c.z), 0.24, 6, (nx, nz) => (nz > 0 ? cO : cOd));
        for (const l of [-1, 1]) {
          props.tri(V(c.x + bx * l * 0.08, c.y + 0.7, c.z + bz * l * 0.08), V(c.x + bx * l * 0.22, c.y + 0.68, c.z + bz * l * 0.22), V(c.x + bx * l * 0.2, c.y + 0.95, c.z + bz * l * 0.2), cOd);
          props.box(c.x + bx * l * 0.1 - tx * 0.235, c.y + 0.5, c.z + bz * l * 0.1 - tz * 0.235, 0.035, 0.035, 0.035, Math.atan2(bx, bz), ey, 1);
        }
      }
      await ctx.yield();
      // a wayside shrine on the cedar side: plinth, a lit cupboard under a gabled roof, rope and streamers, a bell rope, offerings
      {
        let best = 36, bs = -1;
        for (let d = 33; d <= 40; d += 0.5) { const c = walkAt(d, -6.3); let m = 99; for (const tk of trunks) m = Math.min(m, Math.hypot(tk.x - c.x, tk.z - c.z)); if (m > bs) { bs = m; best = d; } }
        const { tx, tz, bx, bz } = walkDir(best), yaw = Math.atan2(bx, bz), c = walkAt(best, -6.3);
        const at = (a, r, y) => V(c.x + tx * a + bx * r, RIDGE_Y + y, c.z + tz * a + bz * r);          // a along the walk, r toward the walk
        const bx_ = (a, r, y, ha, hy, hr, t, g = 0) => { const q = at(a, r, y); props.box(q.x, q.y, q.z, ha, hy, hr, yaw, t, g); };
        bx_(0, 0, 0.3, 1.5, 0.3, 1.2, tStone); bx_(0, 0.15, 0.72, 1.2, 0.12, 0.95, tStone);
        bx_(0, 0, 1.75, 0.95, 0.95, 0.7, { pz: mix(cDeep, cTeal, 0.7), nz: cInk, px: mix(cDeep, cTeal, 0.35), nx: mix(cDeep, cTeal, 0.35), top: cInk });
        bx_(0, 0.71, 1.8, 0.62, 0.72, 0.02, tGlow, 1);                                                // the open front, lit from inside
        for (const a of [-0.31, 0, 0.31]) bx_(a, 0.74, 1.8, 0.025, 0.72, 0.02, tDark); bx_(0, 0.74, 2.1, 0.62, 0.025, 0.02, tDark); bx_(0, 0.74, 1.5, 0.62, 0.025, 0.02, tDark);          // lattice
        for (const a of [-0.95, 0.95]) bx_(a, 0.75, 1.5, 0.09, 1.3, 0.09, tVerm);                      // vermilion porch posts
        const e = (sa, sr) => at(sa * 1.75, sr * 1.45 + 0.1, 2.85), rg = (sa) => at(sa * 1.9, 0.1, 3.95);
        props.quad(e(-1, 1), e(1, 1), rg(1), rg(-1), mix(cSage, cMist, 0.45)); props.quad(e(1, -1), e(-1, -1), rg(-1), rg(1), mix(cInk, cDeep, 0.7));
        props.tri(e(-1, -1), e(-1, 1), rg(-1), mix(cTeal, cSage, 0.5)); props.tri(e(1, 1), e(1, -1), rg(1), mix(cDeep, cTeal, 0.6));
        for (let i = 0; i < 6; i++) { const f = (i + 0.5) / 6, a0 = e(-1, 1).lerp(rg(-1), f), b0 = e(1, 1).lerp(rg(1), f); a0.y += 0.03; b0.y += 0.03; const a1 = a0.clone(), b1 = b0.clone(); a1.y -= 0.09; b1.y -= 0.09; props.quad(a1, b1, b0, a0, mix(cTeal, cSage, 0.55)); }   // shingle courses
        bx_(0, 0.1, 4.0, 2.0, 0.09, 0.14, { ...tDark, top: mix(cSage, cMist, 0.6), pz: mix(cTeal, cSage, 0.7) });
        bx_(0, 1.5, 2.72, 1.5, 0.06, 0.06, { ...tStone, pz: mix(cMist, cCream, 0.4).multiplyScalar(0.8) });          // the straw rope, and its paper streamers nodding
        for (let i = -2; i <= 2; i++) { const a = at(i * 0.55 - 0.1, 1.56, 2.68), b = at(i * 0.55 + 0.1, 1.56, 2.68), d = at(i * 0.55 + 0.04, 1.58, 2.18); props.tri(a, b, d, mix(cMist, cCream, 0.6).multiplyScalar(0.85), 0, 0, 0.1); }
        { const a = at(0.03, 1.5, 2.66), b = at(-0.03, 1.5, 2.66), d = at(-0.03, 1.52, 1.2), f = at(0.03, 1.52, 1.2); props.quad(a, b, d, f, cVerm, 0, 0.06); bx_(0, 1.5, 2.55, 0.09, 0.11, 0.09, { ...tGlow, pz: glowAmber2, top: glowAmber2 }, 1); }          // bell and its rope
        bx_(-0.5, 1.15, 0.92, 0.22, 0.08, 0.14, tWood); bx_(0.45, 1.2, 0.95, 0.12, 0.11, 0.12, { ...tStone, top: mix(cMist, cCream, 0.5) });   // offering tray, rice cakes
        for (const a of [-0.2, 0.15]) { bx_(a, 1.22, 0.95, 0.03, 0.11, 0.03, tStone); bx_(a, 1.22, 1.11, 0.035, 0.05, 0.035, tGlow, 1); const h = at(a, 1.22, 1.11); halos.push(h.x, h.y, h.z, 0.5); }   // two candles
        const hc = at(0, 0.9, 1.8); halos.push(hc.x, hc.y, hc.z, 2.1);
        const pc = at(0, 2.6, 0.04), N = 12, poolA = mix(mix(cDeep, cTeal, 0.5), cAmber, 0.15), poolB = mix(cTeal, cAmber, 0.3);
        for (let i = 0; i < N; i++) { const a0 = i * TAU / N, a1 = a0 + TAU / N, P = (a, r) => V(pc.x + Math.sin(a) * r, pc.y + (r < 1.5 ? 0.01 : 0), pc.z + Math.cos(a) * r); props.quad(P(a0, 2.4), P(a1, 2.4), P(a1, 1.3), P(a0, 1.3), poolA); props.tri(P(a0, 1.3), P(a1, 1.3), pc, poolB); }
        for (const sa of [-1, 1]) {                                  // the pair of stone foxes keeping it
          const f = at(sa * 2.1, 1.6, 0);
          props.box(f.x, f.y + 0.25, f.z, 0.3, 0.25, 0.3, yaw, tStone); props.prism(V(f.x, f.y + 0.5, f.z), V(f.x + bx * 0.1, f.y + 1.2, f.z + bz * 0.1), 0.22, 0.13, 5, (nx, nz) => (nz > 0.2 ? mix(cSage, cMist, 0.6) : mix(cTeal, cSage, 0.6)));
          const hd = V(f.x + bx * 0.16, f.y + 1.3, f.z + bz * 0.16); props.cone(V(hd.x, hd.y - 0.12, hd.z), V(hd.x + bx * 0.36, hd.y - 0.02, hd.z + bz * 0.36), 0.15, 4, (nx, nz) => (nz > 0.2 ? mix(cSage, cMist, 0.75) : mix(cTeal, cSage, 0.7)));
          for (const l of [-1, 1]) props.tri(V(hd.x + tx * l * 0.05, hd.y, hd.z + tz * l * 0.05), V(hd.x + tx * l * 0.14, hd.y, hd.z + tz * l * 0.14), V(hd.x + tx * l * 0.1, hd.y + 0.24, hd.z + tz * l * 0.1), mix(cSage, cMist, 0.5));
          props.tri(V(f.x - bx * 0.2, f.y + 0.5, f.z - bz * 0.2), V(f.x - bx * 0.34, f.y + 0.5, f.z - bz * 0.34), V(f.x - bx * 0.36, f.y + 1.15, f.z - bz * 0.36), mix(cTeal, cSage, 0.8));   // tail up
          const bib = V(f.x + bx * 0.2, f.y + 0.98, f.z + bz * 0.2); props.tri(V(bib.x - tx * 0.12, bib.y, bib.z - tz * 0.12), V(bib.x + tx * 0.12, bib.y, bib.z + tz * 0.12), V(bib.x, bib.y - 0.26, bib.z + 0.01), cVerm);
        }
      }
    }
    await ctx.yield();

    // ---------------- where the avenue opens: a railing along the brink, and the old tree that leans out over it ----------------
    {
      const edgeLat = (d) => { for (let l = 1; l < 14; l += 0.25) { const q = walkAt(d, l); if (!onGround(q.x, q.z)) return l - 0.25; } return 14; };
      let prev = null;
      for (let d = 42; d < dBrink - 7; d += 2.3) {
        const el = edgeLat(d); if (el < 2.4) { prev = null; continue; }
        const q = walkAt(d, el - 0.45), { bx, bz } = walkDir(d), yaw = Math.atan2(bx, bz);
        props.box(q.x, RIDGE_Y + 0.6, q.z, 0.07, 0.6, 0.07, yaw, tWood); props.box(q.x, RIDGE_Y + 1.24, q.z, 0.11, 0.04, 0.11, yaw, { ...tWood, top: mix(cSage, cMist, 0.7) });
        if (prev) for (const y of [0.62, 1.05]) {
          const a = V(prev.x, RIDGE_Y + y, prev.z), b = V(q.x, RIDGE_Y + y, q.z);
          props.quad(V(a.x, a.y - 0.045, a.z), V(b.x, b.y - 0.045, b.z), V(b.x, b.y + 0.045, b.z), V(a.x, a.y + 0.045, a.z), y > 1 ? mix(cSage, cMist, 0.45) : mix(cTeal, cSage, 0.6));
        }
        prev = q;
      }
      // blossom in spring and rain, full leaf in summer, turned leaf in autumn
      const cBl = season === 'summer' ? [mix(cTeal, cSage, 0.9), mix(cTeal, cSage, 0.45), mix(cSage, cMist, 0.35)]
        : season === 'autumn' ? [mix(cRed, cAmber, 0.5), mix(cRed, cInk, 0.35), mix(cAmber, cCream, 0.25).multiplyScalar(0.85)]
          : [mix(cCream, cRed, 0.34).multiplyScalar(0.62), mix(cSage, cRed, 0.42).multiplyScalar(0.6), mix(cCream, cMist, 0.2).multiplyScalar(0.74)];
      const blossom = (c, r, sw) => {                                // a cluster: flat five-sided flowers turned every way
        const n = 10 + Math.floor(wk() * 5);
        for (let i = 0; i < n; i++) {
          const o = V(c.x + wk.range(-r, r), c.y + wk.range(-r * 0.5, r * 0.6), c.z + wk.range(-r, r)), rr = r * wk.range(0.16, 0.33), ya = wk.range(0, 6.28), tilt = wk.range(-0.9, 0.9);
          const ux = Math.cos(ya), uz = -Math.sin(ya), vy = Math.cos(tilt), vh = Math.sin(tilt), vx = Math.sin(ya) * vh, vz = Math.cos(ya) * vh, col = cBl[i % 3 === 0 ? 2 : o.z > c.z ? 0 : 1], rot = wk.range(0, 6);
          const P = (k) => { const a = rot + k * TAU / 5, ca = Math.cos(a) * rr, sa = Math.sin(a) * rr; return V(o.x + ux * ca + vx * sa, o.y + vy * sa, o.z + uz * ca + vz * sa); };
          if (o.y < RIDGE_Y + 6.6 && pathDist(o.x, o.z) < 3.2) continue;          // no flower hangs in the eye's own line
          for (let k = 0; k < 5; k++) props.tri(o, P(k), P(k + 1), col, sw, sw, sw);
        }
      };
      const bough = (a, b, r0, r1) => props.prism(a, b, r0, r1, 5, (nx, nz) => (nz > 0.3 ? mix(cTeal, cSage, 0.6) : nx * side < 0 ? mix(cDeep, cTeal, 0.75) : mix(cDeep, cTeal, 0.35)), 0, 0.05);
      // it is rooted on the first shelf under the brink and stands up past the railing: its crown is at the eye's height, its trunk out of the way
      const oldTree = (d, sc) => {
        const el = edgeLat(d); if (el < 2.4) return;
        const b = walkAt(d, el + 2.4), { tx, tz, bx, bz } = walkDir(d), g = Math.max(A.heightAt(b.x, b.z), RIDGE_Y - 14);
        const pt = (a, r, y) => V(b.x + tx * a * sc + bx * r * sc, b.y + y * sc, b.z + tz * a * sc + bz * r * sc);          // a along the walk, r toward the bowl
        const fork = pt(0.2, -0.3, 2.6), foot = V(b.x, g - 0.3, b.z); bough(foot, fork, 0.5 * sc, 0.3 * sc);
        for (const [a, r, y, n] of [[-4.6, -1.5, 6.3, 7], [4.3, -1.1, 6.9, 7], [-2.6, 2.6, 5.4, 6], [2.1, 3.3, 4.6, 5], [0.3, -0.5, 8.1, 6]]) {
          const tip = pt(a, r, y), mid = fork.clone().lerp(tip, 0.55); mid.y += 0.7 * sc;
          bough(fork, mid, 0.2 * sc, 0.12 * sc); bough(mid, tip, 0.12 * sc, 0.04 * sc);
          for (let i = 0; i < n; i++) { const f = 0.25 + 0.75 * (i + wk()) / n, q = f < 0.55 ? fork.clone().lerp(mid, f / 0.55) : mid.clone().lerp(tip, (f - 0.55) / 0.45); q.y += wk.range(-0.3, 0.5); blossom(q, (1.25 - 0.4 * f) * sc, 0.06 + 0.12 * f); }
        }
      };
      oldTree(Math.min(61, dBrink - 22), 1); oldTree(Math.min(78, dBrink - 10), 0.85);
    }
    await ctx.yield();

    // ---------------- the bench: stream, farmhouse, camphor, bamboo, wheel frame ----------------
    const flat = (x, z) => Math.abs(A.heightAt(x, z) - benchY) < 0.01;
    const footOK = (x, z, r) => flat(x, z) && flat(x + r, z) && flat(x - r, z) && flat(x, z + r) && flat(x, z - r) && Math.hypot(x - pond.x, z - pond.z) > A.pondRadius + r + 3;
    const zWall = -(A.outerAt(0, kb) - 0.6), zPond = pond.z - A.pondRadius - 0.9, zWheel = lerp(zWall, zPond, 0.76);
    const streamX = (z) => -3.4 * Math.pow(Math.sin(Math.PI * clamp((z - zWall) / (zPond - zWall), 0, 1)), 1.3) - 0.4;
    const farm = footOK(31, pond.z - 47, 9) ? V(31, benchY, pond.z - 47) : A.farmhouseSeat.clone();
    const camphor = footOK(farm.x + 13, farm.z + 15, 4) ? V(farm.x + 13, benchY, farm.z + 15) : A.camphorSeat.clone();
    const smokeAt = V(farm.x - 3.3, benchY + 7.4, farm.z);          // the chimney end away from the camphor: the puffs rise against the sky, not across the crown
    {
      const br = rng.fork('bench');
      // farmhouse: plaster walls, a deep thatch hip roof, amber windows toward the path and the uphill side
      const hw = 6, hd = 3.5, wy = 2.7, cPl = mix(cSage, cMist, 0.35), cPlD = mix(cTeal, cSage, 0.6);
      props.box(farm.x, benchY + wy / 2, farm.z, hw, wy / 2, hd, 0, { pz: mix(cMist, cCream, 0.2).multiplyScalar(0.85), nz: cPlD, px: cPlD, nx: cPl, top: cInk });
      for (const x of [-hw, -hw / 3, hw / 3, hw]) props.box(farm.x + x, benchY + wy / 2, farm.z, 0.14, wy / 2 + 0.02, hd + 0.05, 0, tDark);   // timber frame
      props.box(farm.x, benchY + 0.9, farm.z, hw + 0.06, 0.07, hd + 0.06, 0, tDark);
      const e = (sx, sz) => V(farm.x + sx * (hw + 1.1), benchY + wy - 0.25, farm.z + sz * (hd + 1.1)), rg = (sx) => V(farm.x + sx * 3.1, benchY + 7.0, farm.z);
      const thA = mix(cDeep, cTeal, 0.75), thB = mix(cSage, cMist, 0.3), thC = mix(cTeal, cSage, 0.35), thD = mix(cInk, cDeep, 0.8);
      props.quad(e(-1, -1), e(1, -1), rg(1), rg(-1), thA); props.quad(e(1, 1), e(-1, 1), rg(-1), rg(1), thB);
      props.tri(e(-1, 1), e(-1, -1), rg(-1), thC); props.tri(e(1, -1), e(1, 1), rg(1), thD);
      props.box(farm.x, benchY + 7.1, farm.z, 3.5, 0.22, 0.45, 0, { ...tDark, top: mix(cSage, cMist, 0.5), pz: mix(cTeal, cSage, 0.6) });      // ridge cap
      for (let i = 0; i < 9; i++) {                                    // thatch courses as flat darker bands
        const f = (i + 0.5) / 9, a = e(-1, -1).lerp(rg(-1), f), b = e(1, -1).lerp(rg(1), f); a.y += 0.03; b.y += 0.03; a.z -= 0.03; b.z -= 0.03;
        const a2 = a.clone(), b2 = b.clone(); a2.y -= 0.13; b2.y -= 0.13; a2.z -= 0.1; b2.z -= 0.1; props.quad(a2, b2, b, a, thD);
      }
      const win = (x, y, z, hx, hz) => { props.box(x, y, z, hx + 0.1, 0.62, hz + 0.1, 0, tDark); props.box(x, y, z, hx ? hx : 0.13, 0.5, hz ? hz : 0.13, 0, tGlow, 1); };
      win(farm.x - hw - 0.02, benchY + 1.55, farm.z + 0.8, 0, 0.5); win(farm.x - 2.2, benchY + 1.55, farm.z - hd - 0.02, 0.5, 0); win(farm.x + 2.6, benchY + 1.55, farm.z - hd - 0.02, 0.5, 0);
      // the old camphor: a forked trunk and five scalloped masses
      {
        const tk = (a, b, r0, r1) => props.prism(a, b, r0, r1, 7, tBark, 0, 0);
        const c0 = camphor, f0 = V(c0.x - 0.6, c0.y + 6.5, c0.z + 0.3);
        tk(V(c0.x, c0.y - 0.3, c0.z), f0, 1.5, 0.95); props.cone(V(c0.x, c0.y + 1.6, c0.z), V(c0.x, c0.y - 0.3, c0.z), 2.6, 7, tBark);
        const masses = [[-5.5, 13.5, -2.5, 8.2], [5.2, 14.5, -3.5, 7.6], [0.5, 17.6, 1.5, 9], [-4, 15.5, 5.5, 7.2], [6.2, 13.2, 4.5, 6.8]];
        for (const [mx, my, mz, mr] of masses) {
          const cm = V(c0.x + mx, c0.y + my, c0.z + mz); tk(f0, V(cm.x, cm.y - 1, cm.z), 0.6, 0.25);
          const N = 14, ph0 = br.range(0, 6.28), rim = [], mid = [];
          for (let i = 0; i < N; i++) {
            const a = i * TAU / N, sc = 0.82 + 0.2 * Math.abs(Math.sin(a * 2.5 + ph0));
            rim.push(V(cm.x + Math.sin(a) * mr * sc, cm.y - 1.2 + 0.6 * Math.sin(a * 3 + ph0), cm.z + Math.cos(a) * mr * sc));
            mid.push(V(cm.x + Math.sin(a) * mr * 0.62, cm.y + mr * 0.3, cm.z + Math.cos(a) * mr * 0.62));
          }
          const topV = V(cm.x, cm.y + mr * 0.42, cm.z), botV = V(cm.x, cm.y - 2.2, cm.z);
          for (let i = 0; i < N; i++) {
            const j = (i + 1) % N, a = (i + 0.5) * TAU / N, nz = Math.cos(a);
            props.quad(rim[i], rim[j], mid[j], mid[i], nz > 0.35 ? mix(cDeep, cTeal, 0.75) : nz > -0.4 ? mix(cInk, cDeep, 0.9) : mix(cInk, cDeep, 0.35), 0.18, 0.28);
            props.tri(mid[i], mid[j], topV, nz > 0 ? mix(cDeep, cTeal, 0.95) : mix(cDeep, cTeal, 0.35), 0.28, 0.28, 0.32);
            props.tri(rim[j], rim[i], botV, cInk.clone().multiplyScalar(i % 2 ? 0.75 : 1), 0.18, 0.18, 0.1);
          }
        }
      }
      await ctx.yield();
      // bamboo along the stream: leaning canes with leaf tufts, all swaying
      const bamboo = (b, n, h) => {
        for (let i = 0; i < n; i++) {
          const a = br.range(0, 6.28), lean = br.range(0.6, 2.6), hh = h * br.range(0.7, 1.1), bx = b.x + Math.sin(a) * br.range(0, 0.7), bz = b.z + Math.cos(a) * br.range(0, 0.7);
          const tp = V(bx + Math.sin(a) * lean, b.y + hh, bz + Math.cos(a) * lean), w = 0.075, ct = br.chance(0.35) ? mix(cSage, cMist, 0.35) : mix(cTeal, cSage, br.range(0.3, 0.8));
          props.quad(V(bx - w, b.y, bz), V(bx + w, b.y, bz), V(tp.x + w * 0.5, tp.y, tp.z), V(tp.x - w * 0.5, tp.y, tp.z), ct, 0, 0.55);
          props.quad(V(bx, b.y, bz - w), V(bx, b.y, bz + w), V(tp.x, tp.y, tp.z + w * 0.5), V(tp.x, tp.y, tp.z - w * 0.5), mix(cDeep, cTeal, 0.6), 0, 0.55);
          for (let j = 0; j < 7; j++) {
            const f = br.range(0.45, 1), o = V(lerp(bx, tp.x, f), lerp(b.y, tp.y, f), lerp(bz, tp.z, f)), la = br.range(0, 6.28), ll = br.range(0.9, 1.7);
            props.tri(V(o.x, o.y + 0.1, o.z), V(o.x, o.y - 0.14, o.z), V(o.x + Math.sin(la) * ll, o.y - ll * 0.45, o.z + Math.cos(la) * ll), br.chance(0.3) ? mix(cTeal, cSage, 0.6) : mix(cDeep, cTeal, br.range(0.4, 0.9)), 0.55 * f * f, 0.55 * f * f, 0.55 * f * f + 0.12);
          }
          for (let j = 0; j < 4; j++) {                              // the top is a drooping tuft of broad leaves, never a bare spike
            const la = a + j * 1.57 + (i * 0.7 % 1), ll = 1.5 + 0.25 * ((i + j) % 3), cl = j === 0 ? mix(cTeal, cSage, 0.7) : mix(cDeep, cTeal, 0.55 + 0.15 * j);
            const sx = Math.cos(la) * 0.28, sz = -Math.sin(la) * 0.28;
            props.tri(V(tp.x - sx, tp.y + 0.1, tp.z - sz), V(tp.x + sx, tp.y + 0.1, tp.z + sz), V(tp.x + Math.sin(la) * ll, tp.y - ll * 0.55, tp.z + Math.cos(la) * ll), cl, 0.55, 0.55, 0.7);
          }
        }
      };
      for (let i = 0; i < 9; i++) {
        const z = lerp(zWall + 5, zPond - 4, (i + br.range(0.1, 0.9)) / 9); if (Math.abs(z - zWheel) < 6) continue;
        const x = streamX(z) - br.range(4.5, 8.5); if (pathDist(x, z) < 9 || !flat(x, z)) continue;
        bamboo(V(x, benchY, z), Math.round(br.range(6, 10)), 8);
      }
      for (let i = 0; i < 4; i++) { const x = br.range(9, 16), z = lerp(zWall + 8, zPond - 6, (i + br.range(0.2, 0.8)) / 4); if (flat(x, z) && pathDist(x, z) > 9) bamboo(V(x, benchY, z), 6, 7); }
      await ctx.yield();
      // the bench is lived on: stepping stones under the path, tufts, two stone lanterns at the pond's edge
      {
        const q = V(0, 0, 0), t = V(0, 0, 0), cS1 = mix(cTeal, cSage, 0.5), cS2 = mix(cSage, cMist, 0.2);
        for (let d = uBench * path.length - 26; d < uPond * path.length - 2; d += 1.6) {
          path.posAtDist(d, q); path.tangentAtDist(d, t); if (!flat(q.x, q.z)) continue;
          const nx = -t.z, nz = t.x, o = br.range(-0.35, 0.35), w = br.range(0.4, 0.65), l = br.range(0.42, 0.62), y = benchY + 0.06, cx = q.x + nx * o, cz = q.z + nz * o;
          props.quad(V(cx - nx * w - t.x * l, y, cz - nz * w - t.z * l), V(cx + nx * w - t.x * l, y, cz + nz * w - t.z * l), V(cx + nx * w + t.x * l, y, cz + nz * w + t.z * l), V(cx - nx * w + t.x * l, y, cz - nz * w + t.z * l), br.chance(0.3) ? cS2 : cS1);
        }
        for (let i = 0; i < 700 * detail; i++) {
          if ((i & 127) === 127) await ctx.yield();
          const x = br.range(-46, 52), z = br.range(zWall + 1, zPond + 26); if (!flat(x, z) || Math.hypot(x - pond.x, z - pond.z) < A.pondRadius + 1.6 || Math.abs(x - streamX(z)) < 1.6 || pathDist(x, z) < 1.2) continue;
          const h = br.range(0.25, 0.6), n = 3 + br.int(0, 2), rot = br.range(0, 6.28);
          for (let j = 0; j < n; j++) { const a = rot + j * 2.1, r = h * 0.9; props.tri(V(x - 0.07, benchY, z), V(x + 0.07, benchY, z), V(x + Math.sin(a) * r, benchY + h, z + Math.cos(a) * r), j ? mix(cDeep, cTeal, br.range(0.5, 1)) : mix(cTeal, cSage, 0.5), 0, 0, 0.12 * h); }
        }
        for (const sx of [-1, 1]) {
          const x = 1.6 + sx * 7.4, z = zPond - 1.6, lit = sx < 0 || br.chance(0.5);
          props.box(x, benchY + 0.15, z, 0.45, 0.15, 0.45, 0, tStone); props.box(x, benchY + 0.85, z, 0.16, 0.55, 0.16, 0, tStone); props.box(x, benchY + 1.45, z, 0.4, 0.07, 0.4, 0, tStone);
          props.box(x, benchY + 1.77, z, 0.25, 0.25, 0.25, 0, lit ? tGlow : tDark, lit ? 1 : 0);
          props.cone(V(x, benchY + 2.02, z), V(x, benchY + 2.5, z), 0.66, 4, (nx, nz) => (nz > 0.3 ? mix(cSage, cMist, 0.7) : mix(cTeal, cSage, 0.45)), 0, 0, 0.785);
        }
      }
      // wheel frame, a plank bridge, the yard fence, stacked sheaves
      const wx = streamX(zWheel) - 0.2;
      for (const s of [-1, 1]) { props.box(wx + s * 1.35, benchY + 1.45, zWheel, 0.14, 1.45, 0.16, 0, tWood); props.box(wx + s * 1.35, benchY + 0.9, zWheel, 0.1, 0.9, 1.3, 0, tWood); }
      props.box(wx, benchY + 2.9, zWheel, 1.7, 0.09, 0.09, 0, tWood);
      for (const s of [-1, 1]) { const l = V(wx + s * 2.25, benchY + 2.3, zWheel - 0.2); props.box(l.x, benchY + 1.55, l.z, 0.06, 1.55, 0.06, 0, tWood); props.box(wx + s * 1.95, benchY + 3.06, l.z, 0.4, 0.04, 0.04, 0, tWood); paperLantern(props, l, 1.0, 0.12); halos.push(l.x, l.y, l.z, 1.5); }   // the wheel is lit: a lantern either side of it
      for (let i = 0; i < 16; i++) {
        const a = -0.5 + i * 0.14, x = farm.x - 12.5 + 2.2 * Math.cos(a * 3), z = farm.z - 9 + i * 1.5; if (!flat(x, z) || pathDist(x, z) < 6.5) continue;
        props.box(x, benchY + 0.55, z, 0.07, 0.55, 0.07, 0, tWood); props.box(x, benchY + 0.8, z + 0.75, 0.04, 0.05, 0.75, 0.1 * Math.sin(i), tWood);
      }
      for (let i = 0; i < 5; i++) { const x = farm.x - 9.5 + br.range(-1, 1), z = farm.z + 6.5 + i * 2.3; if (flat(x, z)) props.cone(V(x, benchY, z), V(x + 0.1, benchY + 2.0, z), 0.75, 6, (nx, nz) => (nz > 0.3 ? mix(cSage, cMist, 0.35) : mix(cTeal, cSage, nx < 0 ? 0.55 : 0.2))); }
    }
    await ctx.yield();

    // ---------------- half way down: a house on a stilted stage built out over the terraces, lit from inside ----------------
    const stilt = { c: V(0, 0, 0), yaw: 0, y0: 0, ph: 0, look: V(0, 0, 0) };
    {
      // it stands where the swing is widest, on the outside of the bend, and it stands TALL: the slope falls at 45 degrees, so anything low ahead
      // of us shows only its roof. The deck is set level with the terrace we are passing some 14 m before we reach it, and is joined to that
      // terrace by a plank bridge; so we come down toward lit screens at eye height, and then pass under its floor among the stilts.
      let lat = 20; const q = slopeAt(0.56, lat); while (pathDist(q.x, q.z) < 10.5 && lat < 40) { lat += 1; slopeAt(0.56, lat, q); }
      const ph = Math.atan2(q.x, -q.z); let rC = Math.hypot(q.x, q.z);
      const yWant = path.pointAt(Math.max(0, path.nearestXZ(q.x, q.z).u - 0.045)).y - 3.6; let kH = kb + 2, bd = 1e9;
      for (let k = kb + 2; k < K; k++) { const d = Math.abs(A.levels[k] - yWant); if (d < bd) { bd = d; kH = k; } }
      const rE = A.radiusAt(ph, kH), y0 = A.levels[kH] + 0.75;
      for (let i = 0; i < 6 && A.heightAt((rC + 3.8) * Math.sin(ph), -(rC + 3.8) * Math.cos(ph)) > y0 - 1.2; i++) rC -= 1.5;          // the deck stands clear of the wall behind it
      const tnx = Math.cos(ph) * side, tnz = Math.sin(ph) * side, dnx = -Math.sin(ph), dnz = Math.cos(ph), cx = rC * Math.sin(ph), cz = -rC * Math.cos(ph), yaw = -ph;
      const at = (a, r, y = 0) => V(cx + tnx * a + dnx * r, y0 + y, cz + tnz * a + dnz * r);          // a along the contour, r downhill, y above the deck
      const bx = (a, r, y, ha, hy, hr, t, g = 0) => { const o = at(a, r, y); props.box(o.x, o.y, o.z, ha, hy, hr, yaw, t, g); };
      stilt.c.set(cx, y0, cz); stilt.yaw = yaw; stilt.y0 = y0; stilt.ph = ph; stilt.look.copy(at(0, 0.5, 2.2));
      const tStilt = { pz: mix(cSage, cMist, 0.25), nz: mix(cTeal, cSage, 0.3), px: mix(cTeal, cSage, 0.5), nx: mix(cDeep, cTeal, 0.8), top: mix(cTeal, cSage, 0.5) };   // the stilts are pale timber, read against the dark walls
      // the stage: deck, a forest of posts down to whatever terrace is under each, two courses of tie beams
      bx(0, 0, -0.12, 5.0, 0.12, 3.6, { ...tWood, top: mix(cTeal, cSage, 0.62), pz: mix(cSage, cMist, 0.25) });
      const cols = [-4.6, -1.55, 1.55, 4.6], rows = [-2.4, 0.4, 3.2];
      for (const a of cols) for (const r of rows) {
        const f = at(a, r), g = A.heightAt(f.x, f.z), hl = (y0 - 0.24 - g) / 2; if (hl < 0.3) continue;
        props.box(f.x, g + hl, f.z, 0.16, hl, 0.16, yaw, tStilt);
      }
      for (const dy of [2.3, 5.2, 8.1]) {
        for (const r of rows) { const f = at(0, r), g = Math.max(A.heightAt(at(-4.6, r).x, at(-4.6, r).z), A.heightAt(at(4.6, r).x, at(4.6, r).z)); if (y0 - dy > g + 0.6) props.box(f.x, y0 - dy, f.z, 4.9, 0.09, 0.07, yaw, tStilt); }
        for (const a of cols) { const f = at(a, 1.6), g = A.heightAt(at(a, 0.4).x, at(a, 0.4).z); if (y0 - dy - 0.3 > g + 0.6) props.box(f.x, y0 - dy - 0.3, f.z, 0.07, 0.09, 1.9, yaw, tStilt); }
      }
      // the house: plaster and timber, paper screens glowing on three sides, a deep hipped roof
      const hw = 2.9, hd = 1.9, wy = 2.5, hr0 = -0.9, cPl = mix(cSage, cMist, 0.3), cPlD = mix(cTeal, cSage, 0.55);
      bx(0, hr0, wy / 2, hw, wy / 2, hd, { pz: mix(cMist, cCream, 0.2).multiplyScalar(0.8), nz: cPlD, px: cPlD, nx: cPl, top: cInk });
      for (const a of [-hw, -hw / 3, hw / 3, hw]) bx(a, hr0, wy / 2, 0.1, wy / 2 + 0.02, hd + 0.04, tDark);
      bx(0, hr0, 0.3, hw + 0.05, 0.06, hd + 0.05, tDark); bx(0, hr0, wy - 0.25, hw + 0.05, 0.06, hd + 0.05, tDark);
      const screen = (a, r, ha, hr) => { bx(a, r, 1.32, ha, 0.86, hr, tGlow, 1); if (ha > 0.1) { bx(a, r, 1.32, 0.02, 0.86, hr + 0.012, tDark); bx(a, r, 1.32, ha, 0.02, hr + 0.012, tDark); bx(a, r, 1.75, ha, 0.02, hr + 0.012, tDark); } else { bx(a, r, 1.32, ha + 0.012, 0.86, 0.02, tDark); bx(a, r, 1.32, ha + 0.012, 0.02, hr, tDark); } };
      for (const a of [-1.94, 0, 1.94]) screen(a, hr0 + hd + 0.02, 0.82, 0.012);
      screen(-hw - 0.02, hr0 + 0.2, 0.012, 1.1); screen(hw + 0.02, hr0 + 0.2, 0.012, 1.1);
      for (const a of [-1.94, 0, 1.94]) screen(a, hr0 - hd - 0.02, 0.82, 0.012);                       // and on the side we come down toward
      { const hb = at(0, hr0 - hd, 1.3); halos.push(hb.x, hb.y, hb.z, 3.0); }
      const e = (sa, sr) => at(sa * (hw + 1.2), hr0 + sr * (hd + 1.2), wy - 0.2), rg = (sa) => at(sa * 1.5, hr0, wy + 3.0);
      const thA = mix(cDeep, cTeal, 0.75), thB = mix(cSage, cMist, 0.32), thC = mix(cTeal, cSage, 0.4), thD = mix(cInk, cDeep, 0.8);
      props.quad(e(-1, 1), e(1, 1), rg(1), rg(-1), thB); props.quad(e(1, -1), e(-1, -1), rg(-1), rg(1), thA);
      props.tri(e(-1, -1), e(-1, 1), rg(-1), thC); props.tri(e(1, 1), e(1, -1), rg(1), thD);
      for (let i = 0; i < 8; i++) { const f = (i + 0.5) / 8, a0 = e(-1, 1).lerp(rg(-1), f), b0 = e(1, 1).lerp(rg(1), f); a0.y += 0.03; b0.y += 0.03; const a1 = a0.clone(), b1 = b0.clone(); a1.y -= 0.11; b1.y -= 0.11; props.quad(a1, b1, b0, a0, mix(cTeal, cSage, 0.7)); }
      bx(0, hr0, wy + 3.08, 1.9, 0.2, 0.36, { ...tDark, top: mix(cSage, cMist, 0.55), pz: mix(cTeal, cSage, 0.65) });
      // the plank bridge back to the terrace it is level with, on trestles, with a rail and two lanterns
      {
        const span = Math.max(1, rE - rC - 3.5), n = Math.max(1, Math.round(span / 3.2));
        bx(3.4, -3.6 - span / 2, -0.1, 0.75, 0.07, span / 2 + 0.1, { ...tWood, top: mix(cTeal, cSage, 0.62) });
        for (const sa of [-1, 1]) { bx(3.4 + sa * 0.72, -3.6 - span / 2, 0.85, 0.035, 0.035, span / 2, tVerm); for (let i = 0; i <= n; i++) bx(3.4 + sa * 0.72, -3.6 - span * i / n, 0.42, 0.04, 0.45, 0.04, tVerm); }
        for (let i = 1; i < n; i++) for (const sa of [-1, 1]) { const f = at(3.4 + sa * 0.6, -3.6 - span * i / n), g = A.heightAt(f.x, f.z), hl = (y0 - 0.2 - g) / 2; if (hl > 0.3) props.box(f.x, g + hl, f.z, 0.09, hl, 0.09, yaw, tWood); }
        const l = at(3.4 - 0.72, -3.6 - span * 0.5, 1.75); paperLantern(props, l, 0.9, 0.14); halos.push(l.x, l.y, l.z, 1.3); bx(3.4 - 0.72, -3.6 - span * 0.5, 1.5, 0.04, 0.75, 0.04, tVerm);
      }
      // lanterns hung under the floor, among the stilts we pass
      for (const [a, r] of [[-3.1, 1.8], [0, 3.2], [3.1, 1.8], [-4.6, -1], [1.5, -1]]) { const l = at(a, r, -1.6); paperLantern(props, l, 1.0, 0.16); halos.push(l.x, l.y, l.z, 1.5); bx(a, r, -0.7, 0.012, 0.5, 0.012, tDark); }
      // a vermilion rail round the stage, eave lanterns, the lamplight laid on the boards
      for (const [a0, r0_, a1, r1] of [[-5, 3.5, 5, 3.5], [-5, -3.5, -5, 3.5], [5, -3.5, 5, 3.5], [-5, -3.5, 2.6, -3.5]]) {
        for (const y of [0.55, 0.95]) { const m = at((a0 + a1) / 2, (r0_ + r1) / 2, y); props.box(m.x, m.y, m.z, Math.abs(a1 - a0) / 2 + 0.03, 0.04, Math.abs(r1 - r0_) / 2 + 0.03, yaw, tVerm); }
        for (let i = 0; i <= 6; i++) { const m = at(lerp(a0, a1, i / 6), lerp(r0_, r1, i / 6), 0.5); props.box(m.x, m.y, m.z, 0.05, 0.5, 0.05, yaw, tVerm); }
      }
      for (const sa of [-1, 1]) { const l = at(sa * 3.75, hr0 + hd + 0.95, 1.75); paperLantern(props, l, 1.0, 0.14); halos.push(l.x, l.y, l.z, 1.5); bx(sa * 3.75, hr0 + hd + 0.95, 2.22, 0.012, 0.1, 0.012, tDark); }
      { const wq = (a0, a1, r0_, r1, c) => props.quad(at(a0, r0_, 0.012), at(a1, r0_, 0.012), at(a1, r1, 0.012), at(a0, r1, 0.012), c); wq(-3.4, 3.4, hr0 + hd, 3.3, mix(mix(cTeal, cSage, 0.5), cAmber, 0.22)); wq(-2.6, 2.6, hr0 + hd, 2.4, mix(cSage, cAmber, 0.4)); }
      const hc = at(0, hr0 + hd, 1.3); halos.push(hc.x, hc.y, hc.z, 3.4);
      // washing on a line out to a pole, nodding
      { const a = at(hw + 0.1, hr0 + hd, 2.2), b = at(4.9, 3.3, 2.5); props.box(b.x, y0 + 1.25, b.z, 0.05, 1.25, 0.05, yaw, tWood); props.quad(V(a.x, a.y - 0.015, a.z), V(b.x, b.y - 0.015, b.z), V(b.x, b.y + 0.015, b.z), V(a.x, a.y + 0.015, a.z), tDark.px);
        const cl = [mix(cMist, cCream, 0.5).multiplyScalar(0.8), mix(cDeep, cTeal, 0.9), cVerm, mix(cSage, cMist, 0.5)];
        for (let i = 0; i < 4; i++) { const f0 = 0.14 + i * 0.2, f1 = f0 + 0.15, p0 = a.clone().lerp(b, f0), p1 = a.clone().lerp(b, f1), h = 0.7 + 0.25 * (i % 2); props.quad(V(p0.x, p0.y - h, p0.z), V(p1.x, p1.y - h, p1.z), p1, p0, cl[i], 0.16, 0); } }
      // the pine at the stage's other end: a leaning trunk and three cloud pads
      { const b0 = at(6.6, -2.6, -0.6), f0 = at(7.3, -0.6, 3.6), tk = (a, b, ra, rb) => props.prism(a, b, ra, rb, 6, tBark, 0, 0.04);
        tk(b0, f0, 0.42, 0.26);
        for (const [a, r, y, pr] of [[9.4, 1.6, 4.6, 3.3], [5.6, -2.4, 6.3, 2.9], [8.2, 3.6, 7.5, 2.4]]) {
          const cm = at(a, r, y); tk(f0, V(cm.x, cm.y - 0.5, cm.z), 0.2, 0.08); const N = 10;
          for (let i = 0; i < N; i++) { const a0 = i * TAU / N, a1 = a0 + TAU / N, sc0 = 0.8 + 0.2 * Math.abs(Math.sin(a0 * 2.5)), sc1 = 0.8 + 0.2 * Math.abs(Math.sin(a1 * 2.5)), nz = Math.cos(a0 + 0.3);
            const P = (an, sc, yy) => V(cm.x + Math.sin(an) * pr * sc, cm.y + yy, cm.z + Math.cos(an) * pr * sc * 0.8);
            props.tri(P(a0, sc0, -0.25), P(a1, sc1, -0.25), V(cm.x, cm.y + pr * 0.34, cm.z), nz > 0.2 ? mix(cDeep, cTeal, 0.85) : mix(cInk, cDeep, 0.85), 0.1, 0.1, 0.16);
            props.tri(P(a1, sc1, -0.25), P(a0, sc0, -0.25), V(cm.x, cm.y - 0.7, cm.z), mix(cInk, cDeep, i % 2 ? 0.35 : 0.55), 0.1, 0.1, 0.06); } } }
    }
    await ctx.yield();

    // ---------------- on the terraces: rice blades, iris on the dykes, persimmons in autumn ----------------
    const slopePaddies = A.paddies.filter((q) => q.level > kb).map((q) => ({ q, d: pathDist(q.x, q.z), ph: Math.atan2(q.x, -q.z) })).sort((a, b) => a.d - b.d);
    {
      const gr = rng.fork('green');
      if (season !== 'autumn') {
        const hB = season === 'summer' ? 0.62 : 0.3, cB = season === 'summer' ? mix(cTeal, cSage, 0.85) : mix(cTeal, cSage, 0.3), cB2 = season === 'summer' ? mix(cSage, cMist, 0.3) : mix(cTeal, cSage, 0.7);
        let left = Math.round((season === 'summer' ? 14000 : 10500) * detail);
        for (const { q, ph } of slopePaddies.slice(0, season === 'summer' ? 26 : 20)) {
          await ctx.yield();
          const rx = Math.sin(ph), rz = -Math.cos(ph), tx = Math.cos(ph), tz = Math.sin(ph), hr = q.wid * 0.5 - 0.7, ht = Math.min(q.len * 0.5 - 1.2, 9);
          for (let r = -hr; r <= hr && left > 0; r += 0.55) for (let t = -ht; t <= ht && left > 0; t += 0.5) {
            const x = q.x + rx * r + tx * (t + gr.range(-0.08, 0.08)), z = q.z + rz * r + tz * t, w = 0.045, h0 = hB * gr.range(0.75, 1.2), tipX = x + gr.range(-0.08, 0.08), pale = gr.chance(0.25);
            const pd = pathDist(x, z); left--; if (pd < 3.5) continue;                    // nothing spikes up at the lens: bare water under the eye, short blades beside it
            const h = Math.min(h0, lerp(0.34, 0.8, smoothstep(5, 12, pd)));
            props.tri(V(x - tx * w, q.y, z - tz * w), V(x + tx * w, q.y, z + tz * w), V(tipX, q.y + h, z + 0.06), pale ? cB2 : cB, 0, 0, 0.12 * h);
          }
        }
      }
      if (season === 'autumn') {                                     // stubble islands: short pale tufts in rows
        const cS = mix(cSage, cAmber, 0.3), cS2 = mix(cSage, cMist, 0.45); let left = Math.round(11000 * detail);
        for (const { q, ph } of slopePaddies.slice(0, 16)) {
          await ctx.yield();
          const rx = Math.sin(ph), rz = -Math.cos(ph), tx = Math.cos(ph), tz = Math.sin(ph), hr = q.wid * 0.5 - 0.7, ht = Math.min(q.len * 0.5 - 1.2, 9);
          for (let r = -hr; r <= hr && left > 0; r += 0.5) for (let t = -ht; t <= ht && left > 0; t += 0.5) {
            if (noise.n2((q.x + tx * t) * 0.16 + q.level * 3.7, (q.z + rx * r) * 0.16) < -0.25) continue;      // bare water between the islands
            const x = q.x + rx * r + tx * (t + gr.range(-0.06, 0.06)), z = q.z + rz * r + tz * t, w = 0.07, h = 0.12 * gr.range(0.8, 1.5);
            props.tri(V(x - tx * w, q.y, z - tz * w), V(x + tx * w, q.y, z + tz * w), V(x + gr.range(-0.05, 0.05), q.y + h, z + 0.03), gr.chance(0.3) ? cS2 : cS, 0, 0, 0.02); left--;
          }
        }
      }
      const iris = (b, sc) => {
        for (let i = 0; i < 3; i++) {
          const a = gr.range(0, 6.28), h = sc * gr.range(0.5, 0.85), o = 0.22 * sc;
          props.tri(V(b.x - 0.05, b.y, b.z), V(b.x + 0.05, b.y, b.z), V(b.x + Math.sin(a) * o, b.y + h, b.z + Math.cos(a) * o), i ? mix(cTeal, cSage, 0.6) : mix(cSage, cMist, 0.3), 0, 0, 0.1 * h);
        }
        const fy = b.y + sc * 0.8, cF = mix(cSage, cMist, season === 'autumn' ? 0.6 : 0.85);
        props.tri(V(b.x - 0.13 * sc, fy, b.z), V(b.x + 0.13 * sc, fy, b.z), V(b.x, fy + 0.2 * sc, b.z + 0.05), cF, 0.08, 0.08, 0.1);
        props.tri(V(b.x - 0.1 * sc, fy, b.z), V(b.x + 0.1 * sc, fy, b.z), V(b.x, fy - 0.15 * sc, b.z + 0.08), cF, 0.08, 0.08, 0.07);
      };
      await ctx.yield();
      for (const { q, ph, d } of slopePaddies) {
        if (d > 30) break;
        const r = A.radiusAt(ph, q.level);
        for (let t = -q.len * 0.5 + 1; t < q.len * 0.5 - 1; t += gr.range(1.6, 4.2)) { const ib = A.contour(ph + t / r, q.level, gr.range(0.25, 0.6)), isc = gr.range(0.9, 1.5), ipd = pathDist(ib.x, ib.z); iris(ib, ipd < 3.5 ? 0.0001 : ipd < 8 ? isc * 0.67 : isc); }
      }
      await ctx.yield();
      for (let i = 0; i < 60; i++) { const a = gr.range(0, 6.28), r = A.pondRadius + gr.range(1.1, 2.4), x = pond.x + Math.sin(a) * r, z = pond.z + Math.cos(a) * r; if (flat(x, z) && Math.abs(x) > 11.5 && pathDist(x, z) > 2.5) iris(V(x, benchY + 0.02, z), gr.range(1, 1.6)); }
      for (let i = 0; i < 26; i++) { const z = lerp(zWall + 1, zPond, gr()), x = streamX(z) + gr.sign() * gr.range(1.3, 2); iris(V(x, benchY, z), gr.range(1, 1.5)); }
      if (season === 'autumn') {
        const persimmon = (b) => {
          const top = V(b.x + gr.range(-0.3, 0.3), b.y + 2.6, b.z); props.prism(b, top, 0.24, 0.13, 5, tBark);
          const tw = (a, c, w) => { props.quad(V(a.x - w, a.y, a.z), V(a.x + w, a.y, a.z), V(c.x + w * 0.5, c.y, c.z), V(c.x - w * 0.5, c.y, c.z), mix(cInk, cDeep, 0.5), 0, 0.04); props.quad(V(a.x, a.y, a.z - w), V(a.x, a.y, a.z + w), V(c.x, c.y, c.z + w * 0.5), V(c.x, c.y, c.z - w * 0.5), mix(cDeep, cTeal, 0.5), 0, 0.04); };
          for (let i = 0; i < 7; i++) {
            const a = i * 0.9 + gr.range(0, 0.5), l = gr.range(1.6, 2.8), e = V(top.x + Math.sin(a) * l, top.y + gr.range(0.6, 2.2), top.z + Math.cos(a) * l), o = V(lerp(b.x, top.x, 0.75), b.y + gr.range(1.6, 2.6), b.z);
            tw(o, e, 0.06);
            for (let j = 0; j < 3; j++) {
              const f = gr.range(0.45, 1), c = V(lerp(o.x, e.x, f) + gr.range(-0.3, 0.3), lerp(o.y, e.y, f) - gr.range(0.15, 0.4), lerp(o.z, e.z, f) + gr.range(-0.3, 0.3)), s = 0.11;
              props.quad(V(c.x - s, c.y, c.z), V(c.x, c.y - s, c.z), V(c.x + s, c.y, c.z), V(c.x, c.y + s, c.z), cAmber.clone().multiplyScalar(1.5), 0.04, 0.04, 0.6);
              props.quad(V(c.x, c.y, c.z - s), V(c.x, c.y - s, c.z), V(c.x, c.y, c.z + s), V(c.x, c.y + s, c.z), cAmber.clone().multiplyScalar(1.1), 0.04, 0.04, 0.6);
            }
          }
        };
        let n = 0;
        for (let i = 0; i < 200 && n < 9; i++) { const x = gr.range(-34, 30), z = gr.range(zWall + 4, zPond + 20); if (footOK(x, z, 2) && pathDist(x, z) > 9 && Math.abs(x - streamX(z)) > 3 && Math.hypot(x - farm.x, z - farm.z) > 10) { persimmon(V(x, benchY - 0.1, z)); n++; } }
        for (const { q, ph, d } of slopePaddies.slice(0, 60)) if (d > 9 && d < 40 && gr.chance(0.18)) persimmon(A.contour(ph, q.level, 0.4));
      }
    }
    await ctx.yield();
    // ---------------- the festival ground on the bench, west of the pond: a drum tower under a star of lantern strings ----------------
    // (the valley floor's one lit subject: seen from the brink as a warm star beside the pond, passed at roof height on the bench)
    const fk = ctx.core.makeRng(ctx.core.hashSeed('festival:' + ctx.seed));
    const poolA_ = mix(mix(cDeep, cTeal, 0.5), cAmber, 0.16), poolB_ = mix(cTeal, cAmber, 0.32), poolC_ = mix(cSage, cAmber, 0.45);
    const warmPool = (c, r, ok = flat, N = 16, ph = 0) => {         // lamplight laid on the ground: two flat steps of warm tone, pulled in where the ground ends
      const rim = [], inn = [];
      for (let i = 0; i < N; i++) {
        const a = i * TAU / N, wob = 1 + 0.1 * Math.sin(a * 3 + ph); let rr = r * wob;
        while (rr > 0.4 && !ok(c.x + Math.sin(a) * rr, c.z + Math.cos(a) * rr)) rr -= 0.3;
        rim.push(V(c.x + Math.sin(a) * rr, c.y, c.z + Math.cos(a) * rr)); inn.push(V(c.x + Math.sin(a) * rr * 0.55, c.y + 0.01, c.z + Math.cos(a) * rr * 0.55));
      }
      for (let i = 0; i < N; i++) { const j = (i + 1) % N; props.quad(rim[i], rim[j], inn[j], inn[i], poolA_); props.tri(inn[i], inn[j], V(c.x, c.y + 0.01, c.z), poolB_); }
    };
    const lanternString = (a, b, n, sag, sc, hr) => {               // a rope between two points with n paper lanterns hung along it, swaying
      const P = (f) => V(lerp(a.x, b.x, f), lerp(a.y, b.y, f) - sag * 4 * f * (1 - f), lerp(a.z, b.z, f)), SEG = 6, cR = mix(cInk, cDeep, 0.7);
      for (let i = 0; i < SEG; i++) { const p0 = P(i / SEG), p1 = P((i + 1) / SEG); props.quad(V(p0.x, p0.y - 0.045, p0.z), V(p1.x, p1.y - 0.045, p1.z), V(p1.x, p1.y + 0.045, p1.z), V(p0.x, p0.y + 0.045, p0.z), cR); }
      for (let i = 0; i < n; i++) { const q = P((i + 0.5) / n); q.y -= 0.5 * sc; paperLantern(props, q, sc, 0.12 + 0.05 * (i % 3)); halos.push(q.x, q.y, q.z, hr); }
    };
    const FS = 1.4, fest = { c: V(-50, benchY, pond.z - 2), R: 9.6, N: 16, mesh: null };
    {
      for (const [dx, dz] of [[0, 0], [-4, -4], [-6, 2], [-10, -2], [-4, 8], [-12, 6], [-16, 0]]) if (footOK(-50 + dx, pond.z - 2 + dz, 19)) { fest.c.set(-50 + dx, benchY, pond.z - 2 + dz); break; }
      const c = fest.c, by = benchY, B = (x, y, z, hx, hy, hz, t, g = 0) => props.box(c.x + x * FS, by + y * FS, c.z + z * FS, hx * FS, hy * FS, hz * FS, 0, t, g);
      const okF = (x, z) => flat(x, z) && Math.hypot(x - pond.x, z - pond.z) > A.pondRadius + 0.6;
      // the lit ground: a wide warm disc with a paler heart, the dancers' ring trodden pale
      warmPool(V(c.x, by + 0.03, c.z), 24, okF, 24, 1.3); warmPool(V(c.x, by + 0.045, c.z), 13.5, okF, 20, 0.4);
      { const N = 20; for (let i = 0; i < N; i++) { const a0 = i * TAU / N, a1 = a0 + TAU / N, P = (a, r) => V(c.x + Math.sin(a) * r, by + 0.06, c.z + Math.cos(a) * r); props.quad(P(a0, 11.2), P(a1, 11.2), P(a1, 8.0), P(a0, 8.0), poolC_); } }
      await ctx.yield();
      // the tower: four tall posts, a stage with a striped curtain, a drum, a vermilion rail, a pyramid roof with a great lantern under it
      const tPale = { ...tWood, pz: mix(cSage, cMist, 0.5), top: mix(cSage, cMist, 0.4), nx: mix(cTeal, cSage, 0.7) };
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(sx * 2.2, 3.6, sz * 2.2, 0.17, 3.6, 0.17, tPale);
      B(0, 3.0, 0, 2.7, 0.1, 2.7, { ...tWood, top: mix(cSage, cAmber, 0.4), pz: mix(cSage, cMist, 0.4) });
      const cCur = [cVerm, mix(cMist, cCream, 0.6).multiplyScalar(0.9)], cCurD = [cVermD, mix(cSage, cMist, 0.5)];
      for (let i = 0; i < 8; i++) {                                  // the curtain: vermilion and cream panels, lit warm on the moon side
        const o = -2.36 + i * 0.675, k = i % 2;
        B(o, 2.2, 2.72, 0.335, 0.72, 0.02, { pz: cCur[k], nz: cCur[k], px: cCur[k], nx: cCur[k], top: cCur[k] }, 0.35); B(o, 2.2, -2.72, 0.335, 0.72, 0.02, { pz: cCurD[k], nz: cCurD[k], px: cCurD[k], nx: cCurD[k], top: cCurD[k] });
        B(2.72, 2.2, o, 0.02, 0.72, 0.335, { pz: cCurD[1 - k], nz: cCurD[1 - k], px: cCurD[1 - k], nx: cCurD[1 - k], top: cCurD[1 - k] }); B(-2.72, 2.2, o, 0.02, 0.72, 0.335, { pz: cCur[1 - k], nz: cCur[1 - k], px: cCur[1 - k], nx: cCur[1 - k], top: cCur[1 - k] }, 0.2);
      }
      for (const s of [-1, 1]) { B(0, 3.95, s * 2.6, 2.6, 0.05, 0.05, tVerm); B(s * 2.6, 3.95, 0, 0.05, 0.05, 2.6, tVerm); for (let i = -2; i <= 2; i++) { B(i * 1.1, 3.55, s * 2.6, 0.04, 0.42, 0.04, tVerm); B(s * 2.6, 3.55, i * 1.1, 0.04, 0.42, 0.04, tVerm); } }
      props.prism(V(c.x, by + 3.5 * FS, c.z), V(c.x, by + 4.5 * FS, c.z), 0.78 * FS, 0.78 * FS, 10, (nx, nz) => (nz > 0.3 ? cVerm : cVermD)); B(0, 4.53, 0, 0.56, 0.03, 0.56, { ...tStone, top: mix(cMist, cCream, 0.7) });   // the drum
      B(0, 3.3, 0, 0.9, 0.2, 0.2, tWood);
      const ro = (sx, sz) => V(c.x + sx * 3.9 * FS, by + 7.0 * FS, c.z + sz * 3.9 * FS), ap = V(c.x, by + 9.3 * FS, c.z);
      props.tri(ro(-1, 1), ro(1, 1), ap, mix(cSage, cMist, 0.45)); props.tri(ro(1, -1), ro(-1, -1), ap, mix(cInk, cDeep, 0.8)); props.tri(ro(1, 1), ro(1, -1), ap, mix(cDeep, cTeal, 0.7)); props.tri(ro(-1, -1), ro(-1, 1), ap, mix(cTeal, cSage, 0.45));
      props.quad(ro(-1, -1), ro(1, -1), ro(1, 1), ro(-1, 1), mix(mix(cDeep, cTeal, 0.5), cAmber, 0.35));          // the roof's underside takes the lamp
      B(0, 9.45, 0, 0.16, 0.3, 0.16, { ...tDark, pz: mix(cTeal, cSage, 0.6) });
      { const l = V(c.x, by + 5.9 * FS, c.z); paperLantern(props, l, 2.3 * FS, 0.05); halos.push(l.x, l.y, l.z, 6.2, c.x, by + 4.4, c.z, 10.5); }
      // eight strings of lanterns out to poles: the star seen from the brink
      for (let i = 0; i < 8; i++) {
        await ctx.yield();
        const a = (i + 0.5) * TAU / 8 + 0.12, R = 21 + 2 * (i % 2), px = c.x + Math.sin(a) * R, pz = c.z + Math.cos(a) * R; if (!okF(px, pz)) continue;
        props.box(px, by + 3.3, pz, 0.11, 3.3, 0.11, a, tPale);
        lanternString(V(c.x + Math.sin(a) * 3.6 * FS, by + 7.0 * FS, c.z + Math.cos(a) * 3.6 * FS), V(px, by + 6.5, pz), 6, 1.3, 1.6, 2.4);
      }
    }
    await ctx.yield();
    {
      // the farmhouse is awake: paper screens lit along the two walls we see, lanterns under the eaves, its light on the yard, a rope of lanterns out to a pole by the pond
      const fx = farm.x, fz = farm.z, by = benchY, scr = (x, z, hx, hz) => props.box(x, by + 1.45, z, hx, 0.85, hz, 0, tGlow, 1), okY = (x, z) => flat(x, z) && Math.hypot(x - pond.x, z - pond.z) > A.pondRadius + 0.6;
      scr(fx - 6.05, fz - 1.6, 0.02, 1.3); for (const dz of [-1.3, -0.43, 0.43, 1.3]) props.box(fx - 6.08, by + 1.45, fz - 1.6 + dz, 0.02, 0.85, 0.03, 0, tDark); props.box(fx - 6.08, by + 1.75, fz - 1.6, 0.02, 0.03, 1.3, 0, tDark);
      for (const dx of [-4.6, 0.2, 4.7]) { scr(fx + dx, fz - 3.55, 0.9, 0.02); props.box(fx + dx, by + 1.45, fz - 3.58, 0.03, 0.85, 0.02, 0, tDark); props.box(fx + dx, by + 1.75, fz - 3.58, 0.9, 0.03, 0.02, 0, tDark); }
      halos.push(fx - 6.3, by + 1.5, fz - 1.2, 3.6, fx, by + 1.5, fz - 3.8, 4.4);
      warmPool(V(fx - 9, by + 0.035, fz - 1), 4.6, okY, 14, 2); warmPool(V(fx - 0.5, by + 0.035, fz - 7), 5, okY, 14, 1);
      for (const [dx, dz] of [[-7.0, -4.3], [-7.0, 4.3], [7.0, -4.3]]) { const l = V(fx + dx, by + 1.85, fz + dz); paperLantern(props, l, 1.25, 0.14); halos.push(l.x, l.y, l.z, 1.9); props.box(l.x, by + 2.42, l.z, 0.012, 0.12, 0.012, 0, tDark); }
      for (const [px, pz] of [[fx - 20, fz - 3], [fx - 18, fz - 8], [fx - 22, fz - 12]]) if (okY(px, pz) && pathDist(px, pz) > 6) {
        props.box(px, by + 2.6, pz, 0.09, 2.6, 0.09, 0, tWood); lanternString(V(fx - 7.1, by + 2.7, fz - 1.2), V(px, by + 5.1, pz), 5, 0.9, 1.35, 2.0); break;
      }
    }
    {
      // three lit stalls on the edge of the ground, facing the tower: a counter, a glowing back, a striped awning
      const c = fest.c, by = benchY;
      await ctx.yield();
      for (const ia of [1, 3.5, 6]) {
        const a = ia * TAU / 8 + 0.12, R = 15.5, sx = Math.sin(a), sz = Math.cos(a), o = V(c.x + sx * R, by, c.z + sz * R); if (!footOK(o.x, o.z, 3)) continue;
        const yaw = a, at = (t, r, y) => V(o.x + Math.cos(a) * t + sx * r, by + y, o.z - Math.sin(a) * t + sz * r);          // t along the front, r outward from the tower
        const bx = (t, r, y, ht, hy, hr, tn, g = 0) => { const q = at(t, r, y); props.box(q.x, q.y, q.z, ht, hy, hr, yaw, tn, g); };
        bx(0, 0.6, 1.3, 1.9, 1.3, 0.06, tGlow, 1); bx(0, -0.5, 0.5, 1.9, 0.5, 0.3, tWood); bx(0, -0.5, 1.03, 2.0, 0.04, 0.38, { ...tWood, top: mix(cSage, cAmber, 0.45) });
        for (const s of [-1, 1]) { bx(s * 1.95, -0.9, 1.3, 0.07, 1.3, 0.07, tVerm); bx(s * 1.95, 0.6, 1.5, 0.07, 1.5, 0.07, tVerm); }
        for (let i = 0; i < 6; i++) {                                // the awning in stripes, sloping down toward the tower
          const t0 = -2.2 + i * 0.733, t1 = t0 + 0.733, col = i % 2 ? mix(cMist, cCream, 0.5).multiplyScalar(0.85) : cVerm;
          props.quad(at(t0, -1.5, 2.45), at(t1, -1.5, 2.45), at(t1, 0.75, 3.15), at(t0, 0.75, 3.15), col);
        }
        for (const t of [-1.1, 0, 1.1]) bx(t, -0.5, 1.2, 0.13, 0.13, 0.13, { ...tStone, top: mix(cMist, cCream, 0.6), pz: mix(cAmber, cCream, 0.3).multiplyScalar(0.7) });   // wares
        const l = at(0, -1.55, 2.0); paperLantern(props, l, 0.95, 0.14); halos.push(l.x, l.y, l.z, 1.5, at(0, 0.5, 1.4).x, by + 1.4, at(0, 0.5, 1.4).z, 2.6);
      }
      await ctx.yield();
      // the lantern stair: a pair of post lanterns on the dyke either side of our line, every few metres from the brink to the pond,
      // each doubled in its paddy as stacked amber bars. The way down is drawn in warm light; the eye always has one near.
      const q = V(0, 0, 0), t = V(0, 0, 0), L = path.length, cBar = cAmber.clone().multiplyScalar(1.5);
      const levelOf = (h) => { let k = kb, bd = 1e9; for (let i = kb; i <= K; i++) { const d = Math.abs(A.levels[i] - h); if (d < bd) { bd = d; k = i; } } return k; };
      const post = (x, z, y, sc) => {
        props.box(x, y + 1.5 * sc, z, 0.07 * sc, 1.5 * sc, 0.07 * sc, 0, tWood); props.box(x, y + 0.1, z, 0.2 * sc, 0.1, 0.2 * sc, 0, tStone); props.box(x, y + 3.02 * sc, z, 0.3 * sc, 0.04, 0.3 * sc, 0, { ...tWood, top: mix(cSage, cMist, 0.6) });
        const l = V(x, y + 2.35 * sc, z + 0.34 * sc); props.box(x, y + 2.9 * sc, z + 0.17 * sc, 0.03, 0.03, 0.2 * sc, 0, tWood); paperLantern(props, l, 1.15 * sc, 0.1); halos.push(l.x, l.y, l.z, 1.6 * sc);
      };
      // and overhead, a rope of lanterns strung from bamboo pole to bamboo pole down either side of the way, a little under the eye:
      // the leaf-fall runs between two falling lines of light (they stop short of the stilt house and where the kanto cross)
      const tPole = { pz: mix(cTeal, cSage, 0.35), nz: mix(cInk, cDeep, 0.8), px: mix(cDeep, cTeal, 0.7), nx: mix(cDeep, cTeal, 0.7), top: mix(cTeal, cSage, 0.3) };          // dark bamboo: the lanterns are the line, not the poles
      const hang = (s, u0, u1) => {
        let prev = null;
        for (let d = u0 * L; d <= u1 * L + 0.1; d += 8.2) {
          path.posAtDist(d, q); path.tangentAtDist(d, t); const hl = Math.hypot(t.x, t.z) || 1, x = q.x - t.z / hl * s * 5.6, z = q.z + t.x / hl * s * 5.6, g = A.heightAt(x, z), y = Math.max(q.y - 1.7, g + 3.2);
          if (y - g > 0.5) { props.box(x, (g + y) / 2 + 0.2, z, 0.075, (y - g) / 2 + 0.2, 0.075, 0, tPole); props.tri(V(x - 0.25, y + 0.35, z), V(x + 0.25, y + 0.35, z), V(x, y + 0.95, z + 0.1), mix(cTeal, cSage, 0.7), 0.1, 0.1, 0.4); }
          if (pathDist(x, z) < 4.6) { prev = null; continue; }          // inside a tight bend the offset line would come back toward the eye: the rope breaks there
          const node = V(x, y, z); if (prev) lanternString(prev, node, 3, 0.75, 1.4, 1.45); prev = node;
        }
      };
      const uS0 = uBrink + 0.02, uS1 = uBench - 0.035;
      hang(-side, uS0, 0.365); await ctx.yield(); hang(-side, 0.585, uS1); await ctx.yield(); hang(side, uS0, 0.495); await ctx.yield(); hang(side, 0.585, uS1);
      await ctx.yield();
      const seen = new Set();
      for (let d = (uBrink + 0.012) * L, di = 0; d < uPond * L - 3; d += 5.6, di++) {
        if ((di & 3) === 3) await ctx.yield();
        path.posAtDist(d, q); path.tangentAtDist(d, t); const hl = Math.hypot(t.x, t.z) || 1, nx = -t.z / hl, nz = t.x / hl;
        for (const s of [-1, 1]) {
          const lat = s * (5.6 + 1.2 * fk()), x0 = q.x + nx * lat, z0 = q.z + nz * lat, h = A.heightAt(x0, z0);
          if (Math.abs(h - benchY) < 0.01) {                         // on the bench: on the ground, with its pool
            if (Math.abs(x0 - streamX(z0)) < 2 || Math.hypot(x0 - pond.x, z0 - pond.z) < A.pondRadius + 1.5 || pathDist(x0, z0) < 4) continue;
            post(x0, z0, benchY, 1.15); warmPool(V(x0, benchY + 0.035, z0 + 0.4), 2.7, (x, z) => flat(x, z) && Math.hypot(x - pond.x, z - pond.z) > A.pondRadius + 0.5, 12, d); continue;
          }
          const k = levelOf(h), ph = Math.atan2(x0, -z0), b = A.contour(ph, k, 0.3);          // on the terraces: out on the dyke top
          const key = Math.round(b.x / 3) + ':' + Math.round(b.z / 3); if (pathDist(b.x, b.z) < 4.4 || seen.has(key)) continue; seen.add(key);
          post(b.x, b.y, b.z, 1.3);
          const rx = Math.sin(ph), rz = -Math.cos(ph), tx = Math.cos(ph), tz = Math.sin(ph);          // its light on the water behind the dyke: bars, widest nearest the post
          for (let i = 0; i < 4; i++) { const r = 1.5 + i * 0.5, hw = 0.5 - i * 0.1, m = V(b.x + rx * r, A.levels[k] + 0.03, b.z + rz * r); if (Math.abs(A.heightAt(m.x, m.z) - A.levels[k]) > 0.01) break;
            props.quad(V(m.x - tx * hw - rx * 0.14, m.y, m.z - tz * hw - rz * 0.14), V(m.x + tx * hw - rx * 0.14, m.y, m.z + tz * hw - rz * 0.14), V(m.x + tx * hw + rx * 0.14, m.y, m.z + tz * hw + rz * 0.14), V(m.x - tx * hw + rx * 0.14, m.y, m.z - tz * hw + rz * 0.14), cBar, 0, 0, 1); }
        }
      }
    }
    await ctx.yield();
    const propGeo = await props.buildAsync(ctx.yield); await ctx.yield();
    const propMesh = big(new THREE.Mesh(propGeo, propMat)); propMesh.name = 'props'; scene.add(propMesh);
    // printed halos: two flat rings of warm tone round every lantern and window, always turned to the eye
    const haloMesh = (list, name) => {
      const n = list.length / 4, pos = new Float32Array(n * 12), aH = new Float32Array(n * 16), aQ = new Float32Array(n * 8), ix = [];
      for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) {
        pos.set([list[i * 4], list[i * 4 + 1], list[i * 4 + 2]], (i * 4 + k) * 3); aH.set([list[i * 4], list[i * 4 + 1], list[i * 4 + 2], list[i * 4 + 3]], (i * 4 + k) * 4);
        aQ.set([k === 0 || k === 3 ? -1 : 1, k < 2 ? -1 : 1], (i * 4 + k) * 2);
        if (k === 0) ix.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aH', new THREE.BufferAttribute(aH, 4)); g.setAttribute('aQ', new THREE.BufferAttribute(aQ, 2)); g.setIndex(ix);
      const m = big(new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: { uTime: U.uTime, cH: { value: mix(cAmber, cCream, 0.12) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
        vertexShader: /* glsl */`attribute vec4 aH; attribute vec2 aQ; uniform float uTime; varying vec2 vQ; varying float vF;
          void main(){ vQ = aQ; vec4 mv = viewMatrix * modelMatrix * vec4(aH.xyz, 1.);
            mv.xy += aQ * aH.w * (1. + .05 * sin(uTime * 1.7 + aH.x * 1.3 + aH.z)); vF = (1. - smoothstep(160., 520., -mv.z)) * (.45 + .55 * smoothstep(3., 9., -mv.z));
            gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`uniform vec3 cH; varying vec2 vQ; varying float vF;
          void main(){ float d = length(vQ); float a = (.05 * step(d, 1.) + .07 * step(d, .64)) * vF; gl_FragColor = vec4(cH * a, 1.); }`,
      })), 150, 1400);
      m.renderOrder = 5; m.name = name; scene.add(m); return m;
    };
    haloMesh(halos, 'lantern-halos');
    await ctx.yield();

    // ---------------- bench stream + the wheel (scrolling cream stripes: the hero's falls material) ----------------
    const wheel = new THREE.Group();
    {
      const fallsMat = hero.object.getObjectByName('falls').material;
      const pos = [], uv = [], ix = []; let dist = 0, px = streamX(zWall), pz = zWall;
      const N = 28;
      for (let i = 0; i <= N; i++) {
        const z = lerp(zWall, zPond, i / N), x = streamX(z); dist += Math.hypot(x - px, z - pz); px = x; pz = z;
        const w = 1.15 + 0.25 * Math.sin(i * 1.7); pos.push(x + w, benchY + 0.05, z, x - w, benchY + 0.05, z); uv.push(0, dist, 1, dist);
        if (i) { const n = i * 2; ix.push(n - 2, n - 1, n, n - 1, n + 1, n); }
      }
      const wx = streamX(zWheel) - 0.2, n0 = pos.length / 3;                 // the buckets' spill, downstream side of the wheel
      pos.push(wx - 0.5, benchY + 3.9, zWheel + 2.2, wx + 0.5, benchY + 3.9, zWheel + 2.2, wx + 0.6, benchY + 0.06, zWheel + 2.75, wx - 0.6, benchY + 0.06, zWheel + 2.75);
      uv.push(0.2, 0, 0.8, 0, 0.8, 5, 0.2, 5); ix.push(n0, n0 + 1, n0 + 2, n0, n0 + 2, n0 + 3);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ix);
      const stream = new THREE.Mesh(g, fallsMat); stream.name = 'bench-stream'; scene.add(stream);
      const ws = makeSoup(), R = 2.55, hx = 0.48, NS = 16, P = (x, a, r) => V(x, Math.cos(a) * r, Math.sin(a) * r);
      for (let i = 0; i < NS; i++) {
        const a0 = i * TAU / NS, a1 = a0 + TAU / NS;
        for (const s of [-1, 1]) ws.quad(P(s * hx, a0, R - 0.3), P(s * hx, a1, R - 0.3), P(s * hx, a1, R), P(s * hx, a0, R), s < 0 ? mix(cTeal, cSage, 0.75) : mix(cDeep, cTeal, 0.6));
        ws.quad(P(-hx, a0, R - 0.42), P(hx, a0, R - 0.42), P(hx, a0 + 0.12, R + 0.16), P(-hx, a0 + 0.12, R + 0.16), i % 2 ? mix(cSage, cMist, 0.4) : mix(cTeal, cSage, 0.5));   // bucket boards
        if (i % 2 === 0) for (const s of [-1, 1]) ws.quad(P(s * hx, a0 - 0.035, 0.1), P(s * hx, a0 + 0.035, 0.1), P(s * hx, a0 + 0.02, R - 0.2), P(s * hx, a0 - 0.02, R - 0.2), mix(cDeep, cTeal, 0.8));
      }
      ws.box(0, 0, 0, hx + 0.9, 0.16, 0.16, 0, tDark);
      const wm = new THREE.Mesh(ws.build(), propMat); wheel.add(wm); wheel.position.set(wx, benchY + 2.4, zWheel); scene.add(wheel);
    }

    await ctx.yield();

    // ---------------- the sky print: bokashi, the moon and its ring, forty stars, two scalloped cloud bands ----------------
    const moonEl = (hour === 'moonrise' ? 14 : 23) * Math.PI / 180, moonRad = (hour === 'moonrise' ? 5.4 : 2.6) * Math.PI / 180;
    const moonAz = hour === 'moonrise' ? -side * 0.3 : 0;               // the huge low moon hangs beside the ring, not behind it
    const moonDir = V(Math.sin(moonAz) * Math.cos(moonEl), Math.sin(moonEl), Math.cos(moonAz) * Math.cos(moonEl));
    U.uSkyMoon.value.set(moonDir.x, moonDir.y, moonDir.z, Math.sin(moonRad));          // the pond mirrors this moon as a column of bars
    const sr = rng.fork('sky');
    const stars = Array.from({ length: 40 }, () => { const e = sr.range(0.16, 1.25), a = sr.gauss() * 1.3; return V(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)); });
    const skyU = {
      cTop: { value: cInk.clone() }, cMid: { value: mix(cDeep, cTeal, 0.75) }, cHor: { value: (hour === 'moonrise' ? mix(cTeal, cMist, 0.55) : mix(cTeal, cHorizon, hour === 'midnight' ? 0.62 : 0.8)).multiplyScalar(rain ? 0.5 : 0.72) },
      cBand: { value: mix(cTeal, cSage, 0.45) }, cHalo: { value: mix(cTeal, cSage, 0.35) }, cStar: { value: cCream.clone().multiplyScalar(1.1) }, cShadow: { value: cAmber.clone().multiplyScalar(0.42) },
      uMoonDir: { value: moonDir }, uMoonR: { value: Math.sin(moonRad) }, uMoonCol: { value: cMoon.clone().multiplyScalar(rain ? 0.75 : 1.3) },
      uEcl: { value: 0 }, uCres: { value: crescent ? 0.5 : 0 }, uStars: { value: stars }, uStarAmt: { value: rain ? 0 : hour === 'predawn' ? 0.55 : 1 }, uTime: U.uTime,
      uCloud: { value: new THREE.Vector4(sr.range(0.42, 0.62) * sr.sign(), sr.range(0.1, 0.2), -sr.range(0.5, 0.8), sr.range(0.2, 0.34)) }, uCloudAmt: { value: rain ? 1 : 0.8 }, uCloud3: { value: new THREE.Vector3(sr.range(0.45, 0.8) * sr.sign(), sr.range(0.62, 0.74), sr.range(0, 6)) },
    };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20), new THREE.ShaderMaterial({
      uniforms: skyU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
      vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; vec4 mv = viewMatrix * vec4(cameraPosition + position * 4000., 1.); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`
        uniform vec3 cTop, cMid, cHor, cBand, cHalo, cStar, cShadow, uMoonDir, uMoonCol, uStars[40]; uniform float uMoonR, uEcl, uCres, uStarAmt, uTime, uCloudAmt; uniform vec4 uCloud; uniform vec3 uCloud3;
        varying vec3 vDir;
        float band(float az, float e, float a0, float e0, float seed, float len, float th){
          float x = (az - a0 - uTime * .0022) / len, tp = sqrt(max(1. - x * x, 0.));
          float top = e0 + .011 * th * tp, bot = e0 - .03 * th * tp * (.4 + .6 * abs(sin(az * 34. / th + seed + uTime * .02)));
          return step(abs(x), 1.) * step(bot, e) * step(e, top);
        }
        void main(){
          vec3 d = normalize(vDir); float e = asin(clamp(d.y, -1., 1.)), az = atan(d.x, abs(d.z) < 1e-5 ? 1e-5 : d.z);
          vec3 col = mix(cHor, cMid, smoothstep(-.03, .32, e)); col = mix(col, cTop, smoothstep(.55, 1., e) * .75);        // bokashi: ink only across the very top, and never to black
          col = mix(col, cHor * .8, step(e, -.035));
          float cl = max(band(az, e, uCloud.x, uCloud.y, 1.3, .22, 1.), band(az, e, uCloud.z, uCloud.w, 4.1, .27, 1.));
          float cl3 = band(az, e, uCloud3.x, uCloud3.y, uCloud3.z, .5, 2.4);                // a third, higher band, off the moon's azimuth
          cl = max(cl, (uCloudAmt - .8) * 5. * max(band(az, e, .05, .5, 2.2, .5, 1.), band(az, e, -.2, .36, 5.2, .6, 1.)));
          vec3 rt = normalize(cross(uMoonDir, vec3(0., 1., 0.))), up = cross(rt, uMoonDir);
          vec2 mq = vec2(dot(d, rt), dot(d, up)) / uMoonR; float lm0 = length(mq), aa = fwidth(lm0) * .75, lm = lm0 + step(dot(d, uMoonDir), 0.) * 99.;      // (the derivative is taken before the step: its jump drew a dotted great circle)
          float disc = 1. - smoothstep(1. - aa, 1. + aa, lm);
          disc *= mix(1., smoothstep(1. - aa, 1. + aa, length(mq - vec2(uCres, .3 * uCres) * 1.3)), step(.001, uCres));
          float halo = step(1.3, lm) * step(lm, 1.52);
          float s = 0.; for (int i = 0; i < 40; i++) s = max(s, smoothstep(.9999958, .9999985, dot(d, uStars[i])));
          col = mix(col, cStar, s * uStarAmt);
          col = mix(col, mix(cMid, cBand, .7), cl3 * .8 * (1. - cl));
          col = mix(col, cBand, cl * .85);
          col = mix(col, mix(col, cHalo, .55), halo * (1. - cl));
          float ms = max(max(step(length(mq - vec2(-.34, .30)), .30), step(length(mq - vec2(.12, .46)), .21)), max(step(length(mq - vec2(.30, -.02)), .27), step(length(mq - vec2(-.12, -.38)), .19)));      // the printed moon's seas, one flat step
          vec3 mc = mix(uMoonCol * (1. - .3 * ms), cShadow, (1. - smoothstep(1.02 - aa, 1.02 + aa, length(mq - vec2(mix(-2.4, .12, uEcl), .22)))) * step(.001, uEcl));
          col = mix(col, mc, disc * (1. - cl * (uCloudAmt - .2)));
          col *= .962 + .07 * fract(sin(dot(floor(gl_FragCoord.xy * vec2(.34, 1.)), vec2(12.9898, 78.233))) * 43758.5453);     // paper fibre, static
          gl_FragColor = vec4(col, 1.);
        }`,
    }));
    sky.renderOrder = -10; sky.frustumCulled = false; sky.name = 'sky-print'; scene.add(sky);
    await ctx.yield();

    // ---------------- far layers: valley floor, three stacked ridges, a village, the river ----------------
    const village = V(rng.range(-260, 260), -4, rng.range(700, 900));
    {
      const far = makeSoup(), fr = rng.fork('far');
      far.quad(V(-3800, -7, -60), V(3800, -7, -60), V(3800, -7, 2900), V(-3800, -7, 2900), mix(cInk, cDeep, 0.75));
      const ridges = [[1350, 70, 150, 0.0016, mix(cInk, cDeep, 0.8)], [1900, 150, 190, 0.0011, mix(cDeep, cTeal, 0.45)], [2600, 230, 250, 0.0008, mix(cDeep, cTeal, 0.95)]];
      ridges.forEach(([z, base, amp, f, col], ri) => {
        const o = fr.range(0, 99), N = 110; let pa = null, pb = null;
        for (let i = 0; i <= N; i++) {
          const x = -3800 + 7600 * i / N, y = base + amp * (0.5 + 0.5 * noise.fbm2(x * f + o, ri * 7.3, 4)) + amp * 0.5 * Math.exp(-(((x - (ri - 1) * 500 * side) / 700) ** 2)) * (ri ? 1 : -0.6);
          const a = V(x, -8, z + 40 * Math.sin(x * 0.002 + ri)), b = V(x, y, a.z);
          if (pa) far.quad(pa, a, b, pb, col);
          pa = a; pb = b;
        }
      });
      for (let i = 0; i < 22; i++) {                                // village roofs
        const x = village.x + fr.gauss() * 70, z = village.z + fr.gauss() * 45, r = fr.range(5, 9);
        far.cone(V(x, -7 + r * 0.5, z), V(x, -7 + r * 1.15, z), r, 4, (nx, nz) => (nz > 0.3 ? mix(cDeep, cTeal, 0.9) : mix(cInk, cDeep, 0.3)), 0, 0, 0.785);
        far.box(x, -7 + r * 0.25, z, r * 0.62, r * 0.25, r * 0.62, 0, tDark);
      }
      const fm = big(new THREE.Mesh(far.build(), propMat), 100, 5000); fm.name = 'far-ridges'; scene.add(fm);
      // the river: wide sliding cream bars (same material as the falls)
      const pos = [], uv = [], ix = [], ro = fr.range(0, 6);
      for (let i = 0; i <= 40; i++) {
        const z = 240 + i * 52, x = 170 * Math.sin(z * 0.0042 + ro) + (village.x - 60) * smoothstep(300, 800, z) * (1 - smoothstep(900, 1500, z)), w = 8 + i * 0.75;
        pos.push(x + w, -6.6, z, x - w, -6.6, z); uv.push(0, i * 2.2, 1, i * 2.2);
        if (i) { const n = i * 2; ix.push(n - 2, n - 1, n, n - 1, n + 1, n); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ix);
      // one continuous pale ribbon with a few long cream bars sliding downstream (not the falls' dashes, which broke up into dots at this range)
      const river = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: mkU({ cA: { value: mix(cTeal, cMist, 0.5).multiplyScalar(0.8) }, cB: { value: cCream.clone().multiplyScalar(1.15) } }), fog: true, side: THREE.DoubleSide,
        vertexShader: /* glsl */`varying vec2 vUv;
          #include <fog_pars_vertex>
          void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`uniform float uTime; uniform vec3 cA, cB; varying vec2 vUv;
          #include <fog_pars_fragment>
          void main(){
            float lane = floor(vUv.x * 3.), fx = fract(vUv.x * 3.);
            float run = step(fract(vUv.y * .21 - uTime * (.05 + .015 * lane) + lane * .41), .34);
            float on = step(abs(fx - .5), .2) * run * step(abs(vUv.x - .5), .45);
            gl_FragColor = vec4(mix(cA, cB, on), 1.);
            #include <fog_fragment>
            gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(cA, cB, on), .45);
          }`,
      })); river.name = 'river'; scene.add(river);
    }

    await ctx.yield();

    // ---------------- mist: flat scalloped bands, sliding north ----------------
    {
      const pos = [], uv = [], ab = [], an = [], ix = [], mr = rng.fork('mist');
      const sheet = (cx, y, cz, L, W, tone, alpha) => {
        const n = pos.length / 3, s = mr.range(0, 6), k = mr.range(0.016, 0.024);
        pos.push(cx - L / 2, y, cz - W / 2, cx + L / 2, y, cz - W / 2, cx + L / 2, y, cz + W / 2, cx - L / 2, y, cz + W / 2);
        uv.push(0, 0, L, 0, L, 1, 0, 1); an.push(-1, 1, 1, -1); for (let i = 0; i < 4; i++) ab.push(tone, alpha, s, k); ix.push(n, n + 2, n + 1, n, n + 3, n + 2);
      };
      const card = (z, y0, y1, L, tone, alpha, kk = 0) => {
        const n = pos.length / 3, s = mr.range(0, 6), k = -(kk || mr.range(0.005, 0.008));
        pos.push(-L / 2, y0, z, L / 2, y0, z, L / 2, y1, z, -L / 2, y1, z);
        uv.push(0, 0, L, 0, L, 1, 0, 1); an.push(-1, 1, 1, -1); for (let i = 0; i < 4; i++) ab.push(tone, alpha, s, k); ix.push(n, n + 1, n + 2, n, n + 2, n + 3);
      };
      const am = thick ? 0.72 : 0.6;
      {                                                              // behind the ridge avenue: a low band the trunks stand against
        const s = mr.range(0, 6), N = 40; let dist = 0, prev = null;
        for (let i = 0; i <= N; i++) {
          const pv = lerp(-0.2, 0.36, i / N), ph = -side * pv, b = onCrest(ph, 10.5), n = pos.length / 3, al = 0.4 * (1 - 0.55 * smoothstep(0.1, 0.2, pv));   // thinner beside the entry, where it stands close
          if (prev) dist += prev.distanceTo(b); prev = b;
          pos.push(b.x, RIDGE_Y - 5, b.z, b.x, RIDGE_Y + 13, b.z); uv.push(dist, 0, dist, 1); an.push(i / N * 2 - 1, i / N * 2 - 1); for (let j = 0; j < 2; j++) ab.push(0.7, Math.min(al, 0.4), s, -0.11);          // broad scallops like the valley bands, never a flat wall
          if (i) ix.push(n - 2, n, n - 1, n - 1, n, n + 1);
        }
      }
      card(2450, -10, 330, 7600, 0.75, am); card(1780, -10, 235, 7600, 0.55, am); card(1250, -10, 130, 7600, 0.35, am);   // far to near
      sheet(mr.range(-200, 200), 62, 1050, 3400, 420, 0.8, am); sheet(mr.range(-200, 200), 46, 760, 2800, 360, 0.6, am); sheet(mr.range(-150, 150), 34, 520, 2200, 300, 0.75, am);
      if (thick) { sheet(0, 58, 300, 1500, 520, 0.7, 0.66); sheet(mr.range(-80, 80), 86, 130, 900, 300, 0.9, 0.5); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute('aB', new THREE.Float32BufferAttribute(ab, 4)); g.setAttribute('aN', new THREE.Float32BufferAttribute(an, 1)); g.setIndex(ix);
      const mist = big(new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: U.uTime, cA: { value: cSage }, cB: { value: hour === 'moonrise' ? mix(cMist, cTeal, 0.12) : mix(cMist, cHorizon, hour === 'predawn' ? 0.5 : 0.15) } },
        fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`attribute vec4 aB; attribute float aN; varying vec4 vB; varying vec2 vUv; varying float vN;
          #include <fog_pars_vertex>
          void main(){ vB = aB; vUv = uv; vN = aN; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`uniform float uTime; uniform vec3 cA, cB; varying vec4 vB; varying vec2 vUv; varying float vN;
          #include <fog_pars_fragment>
          void main(){
            float k = abs(vB.w), x = vUv.x + uTime * 3.;
            float sc = .6 * abs(sin(x * k + vB.z)) + .3 * abs(sin(x * k * 2.7 + vB.z * 1.7));
            float edge = vB.w > 0. ? min(vUv.y, 1. - vUv.y) * 2. : 1. - vUv.y;
            float lim = .1 + .34 * sc + smoothstep(.72, 1., abs(vN));
            if (edge < lim) discard;
            float core = smoothstep(lim, lim + .42, edge);          // bokashi: a hard scalloped edge, the tone wiped softly away from it
            gl_FragColor = vec4(mix(cA, cB, vB.x) * (.36 + .16 * core), vB.y * (.62 + .38 * core));
            #include <fog_fragment>
          }`,
      })), 60, 5000); mist.renderOrder = 4; mist.name = 'mist-bands'; scene.add(mist);
    }
    await ctx.yield();

    // ---------------- fireflies (blink in waves running downstream), their water glints, village lamps ----------------
    const bufSize = new THREE.Vector2();
    const flyU = { uTime: U.uTime, uH: { value: 900 }, cA: { value: cAmber.clone().multiplyScalar(2.6) }, cB: { value: mix(cAmber, cCream, 0.6).multiplyScalar(3.2) } };
    {
      const fr = rng.fork('flies'), pos = [], ap = [];
      const nF = Math.min(9000, Math.round(4000 * detail * dens * (season === 'summer' ? 2.4 : rain ? 0.5 : season === 'autumn' ? 0.6 : 1)));
      const SL = A.streamLine, zTop = SL[0].z;
      const add = (x, y, z, kind, size, r = fr()) => { pos.push(x, y, z); ap.push(z - zTop, r, kind, size); };
      for (let i = 0; i < nF; i++) {
        if ((i & 511) === 511) await ctx.yield();
        const pick = fr();
        if (pick < 0.22) {                                         // among the ridge cedars
          const b = onCrest(-side * fr.range(-0.1, 0.3), fr.range(-8, 8)); add(b.x, RIDGE_Y + 0.3 + fr() * fr() * 6, b.z, 0, 0.1);
        } else if (pick < 0.44) {                                  // along the bench stream and round the pond
          const z = lerp(zWall, zPond + 40, fr()), x = (z < zPond ? streamX(z) : 0) + fr.gauss() * (z < zPond ? 4 : 20);
          if (Math.hypot(x - pond.x, z - pond.z) < A.pondRadius) { const y = waterY + 0.3 + fr() * 2.5; add(x, y, z, 0, 0.1); if (fr.chance(0.5)) add(x, waterY + 0.06, z, 1, 0.09); }
          else add(x, benchY + 0.3 + fr() * fr() * 4, z, 0, 0.1);
        } else {                                                   // down the falls
          const j = Math.min(SL.length - 2, Math.floor((pick < 0.82 ? fr() * (K - kb) : (K - kb) + fr() * fr() * kb))), t = fr();
          const x = lerp(SL[j].x, SL[j + 1].x, t) + fr.gauss() * (6 + 10 * fr()), z = lerp(SL[j].z, SL[j + 1].z, t) + fr.gauss() * 2.5;
          const g = A.heightAt(x, z), y = g + 0.35 + fr() * fr() * 4.5; add(x, y, z, 0, 0.11); if (fr.chance(0.3)) add(x, g + 0.06, z, 1, 0.09);
        }
      }
      for (let i = 0; i < 46; i++) add(village.x + fr.gauss() * 75, -4 + fr() * 6, village.z + fr.gauss() * 48, 2, fr.range(1.6, 3.2));
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aP', new THREE.Float32BufferAttribute(ap, 4));
      const flies = big(new THREE.Points(g, new THREE.ShaderMaterial({
        uniforms: flyU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
        vertexShader: /* glsl */`attribute vec4 aP; uniform float uTime, uH; varying float vA, vK;
          void main(){
            vec3 p = position; float r = aP.y, k = aP.z; vK = k;
            if (k < 1.5) { p.x += sin(uTime * (.3 + r * .4) + r * 40.) * 1.2; p.z += cos(uTime * (.25 + r * .3) + r * 27.) * 1.2; p.y += step(k, .5) * sin(uTime * (.5 + r) + r * 13.) * .35; }
            float blink = k > 1.5 ? .7 + .3 * sin(uTime * (1.5 + r * 3.) + r * 50.) : smoothstep(.1, .8, sin(6.2832 * (uTime * .5 - aP.x / 12.) + r * 1.3));
            vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
            float px = aP.w * uH * projectionMatrix[1][1] * .5 / max(-mv.z, .5) * 2.2;
            gl_PointSize = clamp(px, 2., 13.);
            vA = blink * (k > .5 && k < 1.5 ? .45 : 1.) * clamp(px / 2., .25, 1.) * smoothstep(.7, 2.5, -mv.z) * (1. - .55 * smoothstep(250., 900., -mv.z) * step(k, 1.5));
          }`,
        fragmentShader: /* glsl */`uniform vec3 cA, cB; varying float vA, vK;
          void main(){ float d = length(gl_PointCoord - .5) * 2.; float a = 1. - smoothstep(.25, 1., d); gl_FragColor = vec4(mix(cA, cB, (1. - smoothstep(.1, .7, d)) * step(vK, 1.5)) * a * vA, 1.); }`,
      })), 120, 1600); flies.renderOrder = 6; flies.name = 'fireflies'; scene.add(flies);
    }
    await ctx.yield();

    // ---------------- sky lanterns let go from the terraces: paper boxes of amber light rising slowly over the bowl ----------------
    {
      const s = makeSoup(), tone = (nx, nz) => (nz > 0.4 ? glowPale : nx > 0.3 ? glowAmber : glowAmber2);
      s.prism(V(0, -0.5, 0), V(0, 0.35, 0), 0.34, 0.46, 6, tone, 0, 0, 0, 1); s.prism(V(0, 0.35, 0), V(0, 0.6, 0), 0.46, 0.3, 6, (nx, nz) => (nz > 0.3 ? glowAmber2 : cVerm), 0, 0, 0, 1);
      s.box(0, -0.52, 0, 0.36, 0.03, 0.36, 0, tDark); s.box(0, -0.42, 0, 0.1, 0.07, 0.1, 0, { pz: glowPale, nz: glowPale, px: glowPale, nx: glowPale, top: glowPale }, 1);
      const base = s.build(), g = new THREE.InstancedBufferGeometry(); for (const k of ['position', 'color', 'aSway', 'aGlow']) g.setAttribute(k, base.getAttribute(k));
      const iA = [], iB = [], q = V(0, 0, 0), want = Math.round(64 * detail * clamp(dens, 0.85, 1.2));
      for (let i = 0; i < 4000 && iA.length / 4 < want; i++) {
        const far = iA.length / 4 >= want - 12, u = far ? wk.range(0.86, 1) : wk.range(uBrink + 0.02, 0.84); path.pointAt(u, q);
        const lat = (far ? wk.range(20, 90) : wk.range(6.5, 46) * (wk() < 0.5 ? 1 : 0.55)) * (wk() < 0.5 ? -1 : 1), fwd = far ? wk.range(20, 190) : wk.range(-6, 22);
        const x = q.x + lat, z = q.z + fwd; if (pathDist(x, z) < 6.5) continue;
        const g0 = Math.max(A.heightAt(x, z), far ? benchY - 40 : -1e9), span = wk.range(26, 44), y = far ? q.y + wk.range(-26, 4) : Math.max(g0 + 1.5, q.y + wk.range(-16, 2) - span * 0.5);
        iA.push(x, y, z, wk()); iB.push(wk.range(0.7, 1.3), wk.range(0.5, 1.6), (far ? 2.6 : 1.25) * wk.range(0.85, 1.25), span);
      }
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(iA), 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(iB), 4)); g.instanceCount = iA.length / 4;
      const sl = new THREE.Mesh(g, flatMat(/* glsl */`
        float t = fract(iA.w + uTime * iB.x / iB.w), sc = iB.z * smoothstep(0., .07, t) * (1. - smoothstep(.88, 1., t));
        vec3 c = iA.xyz + vec3(sin(uTime * .21 + iA.w * 40.) * iB.y + t * 3., t * iB.w, cos(uTime * .17 + iA.w * 23.) * iB.y);
        float tl = .12 * sin(uTime * .9 + iA.w * 31.); p = vec3(p.x + p.y * tl, p.y, p.z) * sc;
        wp = modelMatrix * vec4(c + p, 1.);`, {}, 'attribute vec4 iA, iB;'));
      sl.frustumCulled = false; sl.name = 'sky-lanterns'; scene.add(sl);
    }
    await ctx.yield();

    // ---------------- egrets (or cranes): sixty stand one-legged; twenty-four lift off in turn, keyed to u ----------------
    // the lifters stand in one band of paddies 60-90 m down the slope from the brink; they rise 0.3 s apart, far bird first, and each
    // takes its slot on one shared curve (uCh: z0, speed, x0; uCl: the slope line the curve follows), so they read as a chain
    const uLift = uBrink + 0.02, egVz = 6, egGap = 3.0;
    const egL = path.pointAt(uLift), egB = path.pointAt(uBench), zBand = egL.z + 62;
    const egU2 = { uEg: { value: -1 }, uEgSide: { value: 1 }, uCh: { value: new THREE.Vector4() }, uCl: { value: new THREE.Vector4() } }, uLift2 = 0.27;
    const egU3 = { uEg: { value: -1 }, uEgSide: { value: 1 }, uCh: { value: new THREE.Vector4() }, uCl: { value: new THREE.Vector4() } }, uLift3 = uBrink - 0.05;
    const egU = { uEg: { value: -1 }, uEgSide: { value: 1 }, uCh: { value: new THREE.Vector4(zBand + 28, egVz, -18, 0) },
      uCl: { value: new THREE.Vector4(egL.y, (egB.y - egL.y) / Math.max(egB.z - egL.z, 1), egL.z, benchY + 9) } };
    {
      const er = rng.fork('egrets'), b = makeSoup();
      const cTop = mix(cMist, cCream, 0.85).multiplyScalar(1.02), cUnder = mix(cSage, cMist, 0.75), cDark = cast.cranes ? cInk.clone() : mix(cSage, cMist, 0.5), cLeg = mix(cInk, cDeep, 0.6);
      const tail = V(0, 0.98, -0.5), chest = V(0, 1.02, 0.3), back = V(0, 1.16, -0.05), belly = V(0, 0.84, -0.05);
      for (const s of [-1, 1]) { const sd = V(s * 0.15, 1.0, -0.05); b.tri(tail, sd, back, cTop); b.tri(sd, chest, back, cTop); b.tri(tail, belly, sd, cUnder); b.tri(sd, belly, chest, cUnder); }
      const neck = [V(0, 1.06, 0.26), V(0, 1.3, 0.42), V(0, 1.52, 0.36), V(0, 1.62, 0.46)], cNeck = cast.cranes ? cInk.clone() : cTop;
      for (let i = 0; i < 3; i++) { const a = neck[i], c = neck[i + 1], w = 0.05; b.quad(V(-w, a.y, a.z), V(w, a.y, a.z), V(w, c.y, c.z), V(-w, c.y, c.z), cNeck, 3, 3); b.quad(V(0, a.y, a.z - w), V(0, a.y, a.z + w), V(0, c.y, c.z + w), V(0, c.y, c.z - w), cNeck, 3, 3); }
      b.tri(V(-0.06, 1.66, 0.44), V(0.06, 1.66, 0.44), V(0, 1.6, 0.86), cast.cranes ? mix(cSage, cMist, 0.5) : mix(cAmber, cCream, 0.4).multiplyScalar(0.8), 3, 3, 3);
      b.tri(V(0, 1.7, 0.42), V(0, 1.58, 0.42), V(0, 1.6, 0.86), cDark, 3, 3, 3);
      if (cast.cranes) b.quad(V(-0.06, 1.66, 0.36), V(0.06, 1.66, 0.36), V(0.06, 1.7, 0.5), V(-0.06, 1.7, 0.5), cAmber.clone().multiplyScalar(1.2), 3, 3);
      b.quad(V(-0.02, 0.9, -0.05), V(0.03, 0.9, -0.05), V(0.03, 0, -0.05), V(-0.02, 0, -0.05), cLeg, 2, 2); b.quad(V(0, 0.9, -0.08), V(0, 0.9, -0.02), V(0, 0, -0.02), V(0, 0, -0.08), cLeg, 2, 2);
      b.quad(V(0.05, 0.9, -0.05), V(0.09, 0.9, -0.05), V(0.09, 0.55, 0.05), V(0.05, 0.55, 0.05), cLeg, 2, 2);
      for (const s of [-1, 1]) {
        const W = (f, z) => V(s * (0.12 + 1.25 * f), 1.1, z);
        b.tri(W(0, 0.22), W(0, -0.32), W(0.55, 0.16), cTop, s * 0.001, s * 0.001, s * 0.55); b.tri(W(0, -0.32), W(0.55, -0.3), W(0.55, 0.16), cUnder, s * 0.001, s * 0.55, s * 0.55);
        b.tri(W(0.55, 0.16), W(0.55, -0.3), W(1, -0.12), cast.cranes ? cInk.clone() : cTop, s * 0.55, s * 0.55, s * 1);
      }
      const base = b.build(), g = new THREE.InstancedBufferGeometry(), egChains = [];
      for (const k of ['position', 'color', 'aSway', 'aGlow']) g.setAttribute(k, base.getAttribute(k));
      const iA1 = [], iB1 = [], sc = cast.cranes ? 2.8 : 2.4, nBirds = Math.round(60 * clamp(dens, 0.85, 1.2));
      const stand = (q, ph, delay, slot = 0, iA = iA1, iB = iB1, rg = er) => {
        const t = rg.range(-0.3, 0.3) * q.len, r = rg.range(-0.22, 0.22) * q.wid;
        iA.push(q.x + Math.cos(ph) * t + Math.sin(ph) * r, q.y - 0.08, q.z + Math.sin(ph) * t - Math.cos(ph) * r, rg.range(-1.4, 1.4)); iB.push(delay, rg(), sc * rg.range(0.9, 1.1), slot);
      };
      let egPool = slopePaddies.filter((s) => s.d > 5 && s.d < 40 && s.q.wid > 2.2 && s.q.z > zBand - 5 && s.q.z < zBand + 28);
      if (egPool.length < 3) egPool = slopePaddies.filter((s) => s.d > 6 && s.d < 34 && s.q.level < K - 2 && s.q.wid > 2.2).slice(0, 24);
      const lifters = []; for (let i = 0; i < 24 && egPool.length; i++) lifters.push(egPool[i % egPool.length]);
      lifters.sort((a, c) => c.q.z - a.q.z).forEach((s, i) => stand(s.q, s.ph, i * 0.3, i * egGap / egVz));
      const rest = A.paddies.filter((q) => q.wid > 2.4 && Math.abs(q.x) < 120 && (q.level > kb ? Math.abs(q.x) > 30 : q.level > kb - 9));
      for (let i = lifters.length; i < nBirds && rest.length; i++) { const q = er.pick(rest); stand(q, Math.atan2(q.x, -q.z), -1); }
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(iA1), 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(iB1), 4));
      g.instanceCount = iA1.length / 4;
      const EG_BODY = /* glsl */`
        float tau = iB.x < 0. ? 0. : max(uEg - iB.x, 0.), fl = smoothstep(0., 1., tau), w = aSway;
        if (abs(w) > .0005 && abs(w) < 1.5) {
          float sg = sign(w), span = abs(w), flap = sin(uTime * 6.2 + iB.y * 20. - span * 1.2) * (.8 - .3 * smoothstep(5., 10., tau));
          p.x = mix(sg * (.13 + span * .05), p.x, fl); p.y = mix(1.06 - span * .16, p.y, fl);
          p.y += span * flap * 1.0 * fl; p.x -= sg * span * abs(flap) * .28 * fl;
        } else if (w > 1.5 && w < 2.5) { float h = .9 - p.y; p.z -= h * fl * .9; p.y += h * fl * .92; }
        else if (w > 2.5) { p.y -= (p.y - 1.06) * .45 * fl; p.z += (1.66 - p.y) * .2 * fl; }
        p.y += (1. - fl) * .025 * sin(uTime * 1.3 + iB.y * 30.) * step(.95, p.y);
        p *= iB.z;
        float cs = max(uEg - iB.w, -8.), cz = uCh.x + uCh.y * cs, cx = uEgSide * (uCh.z + 2.4 * cs + .1 * cs * abs(cs));
        float cy = max(uCl.x + uCl.y * (cz - uCl.z), uCl.w) + 3.5;
        vec3 at = mix(iA.xyz + vec3(0., 3.2 * smoothstep(0., 2.5, tau), 0.), vec3(cx, cy, cz), smoothstep(.2, 4.5, tau));
        at.y += .25 * sin(uTime * 6.2 + iB.y * 20. + 1.6) * fl + (iB.y - .5) * 2.2 * fl; at.x += (fract(iB.y * 7.) - .5) * 2. * fl;      // a hand-drawn chain, not a ladder
        float hd = mix(iA.w, atan(uEgSide * (2.4 + .2 * abs(cs)), uCh.y), fl), c = cos(hd), s = sin(hd);
        vec3 toC = cameraPosition - at; float dC = length(toC), py = 1.1 * iB.z;
        float bk = .58 * smoothstep(5., 8.5, tau) * sign(toC.x * c - toC.z * s), cb = cos(bk), sb = sin(bk), yy = p.y - py;      // the wing plane tips toward the eye: a chain of white shapes, not a scribble seen edge-on
        p = vec3(p.x * cb + yy * sb, yy * cb - p.x * sb, p.z) * (1. + fl * max(dC / 240. - 1., 0.)) + vec3(0., py, 0.);
        wp = modelMatrix * vec4(at + vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c), 1.);`, EG_DECL = 'attribute vec4 iA, iB; uniform float uEg, uEgSide; uniform vec4 uCh, uCl;';
      const birds = new THREE.Mesh(g, flatMat(EG_BODY, egU, EG_DECL)); birds.frustumCulled = false; birds.name = cast.cranes ? 'cranes' : 'egrets'; scene.add(birds); egChains.push([g, egU, uLift]);
      // nine more stand in the paddies right under the top of the fall: they rise beside us as we come over the brink and fly down the slope
      // just ahead of the eye, at its own height, across the lit house and the bowl (the same shader on a second curve)
      {
        const p34 = path.pointAt(0.34), p56 = path.pointAt(0.56), iA2 = [], iB2 = [], g2 = new THREE.InstancedBufferGeometry();
        for (const k of ['position', 'color', 'aSway', 'aGlow']) g2.setAttribute(k, base.getAttribute(k));
        let pool = slopePaddies.filter((s) => s.d > 3.5 && s.d < 17 && s.q.wid > 2 && s.q.z > p34.z + 3 && s.q.z < p34.z + 26);
        if (pool.length < 2) pool = slopePaddies.filter((s) => s.d > 3.5 && s.d < 26 && s.q.z > p34.z).slice(0, 6);
        for (let i = 0; i < 9 && pool.length; i++) { const sp = pool[i % pool.length]; stand(sp.q, sp.ph, i * 0.3, i * 0.5, iA2, iB2, wk); }
        g2.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(iA2), 4)); g2.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(iB2), 4)); g2.instanceCount = iA2.length / 4;
        egU2.uEgSide.value = side; egU2.uCh.value.set(p34.z + 2, 5, -5.3, 0); egU2.uCl.value.set(p34.y + 6.5, (p56.y - p34.y) / Math.max(p56.z - p34.z, 1), p34.z, benchY + 9);
        const near = new THREE.Mesh(g2, flatMat(EG_BODY, egU2, EG_DECL)); near.frustumCulled = false; near.name = 'near-flight'; scene.add(near); egChains.push([g2, egU2, uLift2]);
      }
      // and a dozen in the first paddies under the brink: they are lifting, wings wide, as the eye comes to the lip and looks down,
      // and peel away down the slope on the side away from the house (the same shader on a third curve)
      {
        const pB = path.pointAt(uBrink + 0.02), p56 = path.pointAt(0.56), iA3 = [], iB3 = [], g3 = new THREE.InstancedBufferGeometry();
        for (const k of ['position', 'color', 'aSway', 'aGlow']) g3.setAttribute(k, base.getAttribute(k));
        let pool = slopePaddies.filter((s) => s.d > 2.5 && s.d < 20 && s.q.wid > 1.8 && s.q.z > pB.z - 3 && s.q.z < pB.z + 17);
        if (pool.length < 2) pool = slopePaddies.filter((s) => s.d > 2.5 && s.d < 28).slice(0, 6);
        pool.sort((a, c) => c.q.z - a.q.z);
        for (let i = 0; i < 12 && pool.length; i++) { const sp = pool[i % pool.length]; stand(sp.q, sp.ph, i * 0.16, i * 0.42, iA3, iB3, fk); }
        g3.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(iA3), 4)); g3.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(iB3), 4)); g3.instanceCount = iA3.length / 4;
        egU3.uEgSide.value = -side; egU3.uCh.value.set(pB.z + 7, 5.5, -3, 0); egU3.uCl.value.set(pB.y + 1.5, (p56.y - pB.y) / Math.max(p56.z - pB.z, 1), pB.z, benchY + 9);
        const brinkBirds = new THREE.Mesh(g3, flatMat(EG_BODY, egU3, EG_DECL)); brinkBirds.frustumCulled = false; brinkBirds.name = 'brink-flight'; scene.add(brinkBirds); egChains.push([g3, egU3, uLift3]);
      }
      // (cure) a lifter rises and takes its place in its chain with the flight, so each has one course against our pass. No lifter's
      // skin as EG_BODY draws it (the wings at every point of their beat, the wing plane tipped either way, the body's bob) comes
      // within 2 m of our line's point of the same moment: one that would takes another place along its chain, half the chain's
      // gap at a time, the nearest first and the earlier of two: the first that is clear, half a gap from the place of every
      // other lifter of its chain, and where the point its wings tip about (its body's middle to within 0.4 m) keeps 2 m from
      // that of every other lifter of its chain all the way from its lift (or as much as it had in its own place when its turn
      // came, a neighbour standing beside it at its lift counted), so that it does not rise inside its neighbour; if none of
      // the twelve places either way has that room (nine lifters on 240 worlds counted), the first that is clear.
      // It stands where it stood and lifts when it did; nobody is taken out; a lifter this count gives its 2 m flies as before.
      // The pose and the course below are EG_BODY's own, line for line: change both or neither. Looked at every twentieth of a
      // metre of our line and at sixty-four points of the beat, with what the skin can move between two such looks taken off
      // and three hundredths of a metre over; a bird further off than a look can bring it is not looked at until it can be near
      {
        const bp = base.getAttribute('position').array, bw = base.getAttribute('aSway').array, fr = (x) => x - Math.floor(x);
        const isWing = (j) => Math.abs(bw[j]) > 0.0005 && Math.abs(bw[j]) < 1.5, wingT = [], restT = [];
        for (let t = 0; t < bp.length / 9; t++) (isWing(t * 3) || isWing(t * 3 + 1) || isWing(t * 3 + 2) ? wingT : restT).push(t);
        const TR = new Float64Array(restT.length * 9), TW = new Float64Array(wingT.length * 9), spanW = wingT.map((t) => Math.max(...[0, 1, 2].map((e) => (isWing(t * 3 + e) ? Math.abs(bw[t * 3 + e]) : 0))));
        const pose = (j, fl, flap, T, o) => {                          // corner j as EG_BODY poses it, before the bird's scale and the tip of its wing plane
          let x = bp[j * 3], y = bp[j * 3 + 1], z = bp[j * 3 + 2]; const w = bw[j], a = Math.abs(w);
          if (a > 0.0005 && a < 1.5) { const sg = Math.sign(w); x = lerp(sg * (0.13 + a * 0.05), x, fl); y = lerp(1.06 - a * 0.16, y, fl) + a * flap * fl; x -= sg * a * Math.abs(flap) * 0.28 * fl; }
          else if (w > 1.5 && w < 2.5) { const h = 0.9 - y; z -= h * fl * 0.9; y += h * fl * 0.92; }
          else if (w > 2.5) { y -= (y - 1.06) * 0.45 * fl; z += (1.66 - y) * 0.2 * fl; }
          T[o] = x; T[o + 1] = y; T[o + 2] = z;
        };
        const triD = (px, py, pz, T, o) => {                           // from a point to a triangle, the nearest
          const ax = T[o], ay = T[o + 1], az = T[o + 2], abx = T[o + 3] - ax, aby = T[o + 4] - ay, abz = T[o + 5] - az, acx = T[o + 6] - ax, acy = T[o + 7] - ay, acz = T[o + 8] - az;
          const apx = px - ax, apy = py - ay, apz = pz - az, d1 = abx * apx + aby * apy + abz * apz, d2 = acx * apx + acy * apy + acz * apz;
          let v = 0, w = 0;
          if (!(d1 <= 0 && d2 <= 0)) {
            const d3 = d1 - (abx * abx + aby * aby + abz * abz), d4 = d2 - (abx * acx + aby * acy + abz * acz);
            if (d3 >= 0 && d4 <= d3) v = 1;
            else {
              const vc = d1 * d4 - d3 * d2;
              if (vc <= 0 && d1 >= 0 && d3 <= 0) v = d1 / (d1 - d3);
              else {
                const d5 = d1 - (abx * acx + aby * acy + abz * acz), d6 = d2 - (acx * acx + acy * acy + acz * acz);
                if (d6 >= 0 && d5 <= d6) w = 1;
                else {
                  const vb = d5 * d2 - d1 * d6;
                  if (vb <= 0 && d2 >= 0 && d6 <= 0) w = d2 / (d2 - d6);
                  else {
                    const va = d3 * d6 - d5 * d4;
                    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { w = (d4 - d3) / (d4 - d3 + d5 - d6); v = 1 - w; }
                    else { const dn = 1 / (va + vb + vc); v = vb * dn; w = vc * dn; }
                  }
                }
              }
            }
          }
          return Math.hypot(apx - abx * v - acx * w, apy - aby * v - acy * w, apz - abz * v - acz * w);
        };
        const N5 = Math.ceil(path.length / 0.05), PH = 64, eye = V(0, 0, 0);
        let looks = 0, flR = -1;
        const clear = async ([g, U, uL], i, slot) => {                  // does bird i keep its 2 m over its whole course in this place of its chain
          const A = g.getAttribute('iA').array, B = g.getAttribute('iB').array, ch = U.uCh.value, cl = U.uCl.value, sd = U.uEgSide.value;
          const dl = B[i * 4], hy = B[i * 4 + 1], scl = B[i * 4 + 2], py = 1.1 * scl;
          for (let j = Math.max(0, Math.ceil((uL + dl / duration) * N5)); j <= N5;) {
            const uEg = (j / N5 - uL) * duration, tau = Math.max(uEg - dl, 0), fl = smoothstep(0, 1, tau), cs = Math.max(uEg - slot, -8), k2 = smoothstep(0.2, 4.5, tau);
            const cz = ch.x + ch.y * cs, cx = sd * (ch.z + 2.4 * cs + 0.1 * cs * Math.abs(cs)), cy = Math.max(cl.x + cl.y * (cz - cl.z), cl.w) + 3.5;
            path.pointAt(j / N5, eye);
            const ex = eye.x - (lerp(A[i * 4], cx, k2) + (fr(hy * 7) - 0.5) * 2 * fl), ey = eye.y - (lerp(A[i * 4 + 1] + 3.2 * smoothstep(0, 2.5, tau), cy, k2) + (hy - 0.5) * 2.2 * fl), ez = eye.z - lerp(A[i * 4 + 2], cz, k2);
            let d = Math.hypot(ex, ey - py, ez) - 1.62 * scl - 0.25;      // (no point of the skin is further from the body's middle than that)
            if (d < 2.03) {
              const hd = lerp(A[i * 4 + 3], Math.atan2(sd * (2.4 + 0.2 * Math.abs(cs)), ch.y), fl), c0 = Math.cos(hd), s0 = Math.sin(hd), lx = ex * c0 - ez * s0, lz = (ex * s0 + ez * c0) / scl;
              const bk = 0.58 * smoothstep(5, 8.5, tau), amp = 0.8 - 0.3 * smoothstep(5, 10, tau), off = 0.025 * scl * (1 - fl);
              if (fl !== flR) { for (let t = 0; t < restT.length; t++) for (let e = 0; e < 3; e++) pose(restT[t] * 3 + e, fl, 0, TR, t * 9 + e * 3); flR = fl; }
              d = 1e9;
              for (const bs of bk > 0 ? [1, -1] : [1]) {
                const cb = Math.cos(bk * bs), sb = Math.sin(bk * bs);
                for (let q = -2; q <= 2; q++) {                            // body, neck and legs at five heights of the bob
                  const Y = ey - 0.125 * q * fl - py, qx = (lx * cb - Y * sb) / scl, qy = (py + lx * sb + Y * cb) / scl;
                  for (let t = 0; t < restT.length; t++) { const dd = scl * triD(qx, qy, lz, TR, t * 9) - 0.0625 * fl - off; if (dd < d) d = dd; }
                }
                for (let k = 0; k < PH; k++) {                             // the wings round their beat
                  const ph = k * 2 * Math.PI / PH, Y = ey - 0.25 * Math.sin(ph + 1.6) * fl - py, qx = (lx * cb - Y * sb) / scl, qy = (py + lx * sb + Y * cb) / scl;
                  for (let t = 0; t < wingT.length; t++) {
                    for (let e = 0; e < 3; e++) { const jv = wingT[t] * 3 + e; pose(jv, fl, Math.sin(ph - Math.abs(bw[jv]) * 1.2) * amp, TW, t * 9 + e * 3); }
                    const dd = scl * triD(qx, qy, lz, TW, t * 9) - (Math.PI / PH) * (scl * spanW[t] * amp * 1.04 + 0.25) * fl - off; if (dd < d) d = dd;
                  }
                }
                if (d < 2.03) return false;
              }
              await ctx.yield();                                            // (after every near look: the first of a build run slow)
            } else if (++looks % 96 === 0) await ctx.yield();
            j += Math.max(1, Math.floor((d - 2.03) / 0.6));                // (between two looks no point of a bird moves 0.6 m against our line)
          }
          return true;
        };
        const mid = ([g, U], i, slot, uEg, o) => {                      // the point bird i's wings tip about (its body's middle to within 0.4 m) at that moment of its chain's flight (the course as in clear)
          const A = g.getAttribute('iA').array, B = g.getAttribute('iB').array, ch = U.uCh.value, cl = U.uCl.value, sd = U.uEgSide.value;
          const hy = B[i * 4 + 1], tau = Math.max(uEg - B[i * 4], 0), fl = smoothstep(0, 1, tau), cs = Math.max(uEg - slot, -8), k2 = smoothstep(0.2, 4.5, tau);
          const cz = ch.x + ch.y * cs, cx = sd * (ch.z + 2.4 * cs + 0.1 * cs * Math.abs(cs)), cy = Math.max(cl.x + cl.y * (cz - cl.z), cl.w) + 3.5;
          o[0] = lerp(A[i * 4], cx, k2) + (fr(hy * 7) - 0.5) * 2 * fl; o[1] = lerp(A[i * 4 + 1] + 3.2 * smoothstep(0, 2.5, tau), cy, k2) + (hy - 0.5) * 2.2 * fl + 1.1 * B[i * 4 + 2]; o[2] = lerp(A[i * 4 + 2], cz, k2);
        };
        const m1 = [0, 0, 0], m2 = [0, 0, 0];
        const room = async (c, i, slot, lift) => {                      // the least from bird i's middle to that of another lifter of its chain, from its lift to the end of our flight, every tenth of a second
          const B = c[0].getAttribute('iB').array, n = Math.floor(((1 - c[2]) * duration - B[i * 4]) / 0.1); let d = 1e9;
          for (const o of lift) {
            if (o === i) continue;
            for (let q = 0; q <= n; q++) { const t = B[i * 4] + q * 0.1; mid(c, i, slot, t, m1); mid(c, o, B[o * 4 + 3], t, m2); d = Math.min(d, Math.hypot(m1[0] - m2[0], m1[1] - m2[1], m1[2] - m2[2])); }
            await ctx.yield();
          }
          return d;
        };
        for (const c of egChains) {
          const at = c[0].getAttribute('iB'), B = at.array, nb = c[0].instanceCount, lift = [];
          for (let i = 0; i < nb; i++) if (B[i * 4] >= 0) lift.push(i);
          let gap = 0.5; { const sl = lift.map((i) => B[i * 4 + 3]).sort((x, y) => x - y); let m = 1e9; for (let k = 1; k < sl.length; k++) if (sl[k] - sl[k - 1] > 1e-4) m = Math.min(m, sl[k] - sl[k - 1]); if (m < 1e9) gap = m; }
          for (const i of lift) {
            await ctx.yield();
            const own = B[i * 4 + 3]; if (await clear(c, i, own)) continue;
            const want = Math.min(2, await room(c, i, own, lift)); let first = null, got = null;
            for (let k = 0; k < 12 && got === null; k++) for (const way of [-1, 1]) {                // (at most twelve places either way; one that found none would keep its own)
              const sl = own + way * (k + 0.5) * gap;
              if (!lift.every((o) => o === i || Math.abs(B[o * 4 + 3] - sl) > 0.49 * gap)) continue;
              await ctx.yield();
              if (!(await clear(c, i, sl))) continue;
              if (first === null) first = sl;
              if ((await room(c, i, sl, lift)) >= want) { got = sl; break; }
            }
            if (got === null) got = first;
            if (got !== null) B[i * 4 + 3] = got;
          }
          at.needsUpdate = true;
        }
      }
    }
    await ctx.yield();

    // ---------------- lantern procession along the dykes (or one boatman poling across the round paddy) ----------------
    const INST = /* glsl */`
      if (aGlow > .5 && p.y < 0.) p.z += .14 * sin(uTime * 3. + p.x * 5. + instanceMatrix[3].x);
      p.x += aSway * .5 * sin(uTime * 2.4 + instanceMatrix[3].x * .9 + instanceMatrix[3].z * .7);
      wp = modelMatrix * instanceMatrix * vec4(p, 1.);`;
    const instMat = flatMat(INST);
    const tCoat = (nx, nz) => (nz > 0.3 ? mix(cDeep, cTeal, 0.55) : mix(cInk, cDeep, 0.45)), tHat = (nx, nz) => (nz > 0.3 ? mix(cSage, cMist, 0.45) : nx > 0 ? mix(cTeal, cSage, 0.55) : mix(cTeal, cSage, 0.2));
    const figure = (s, x, z, lamp) => {                           // a carrier: flat dark shape under a conical hat, lantern on a pole
      s.prism(V(x, 0, z), V(x, 1.45, z), 0.3, 0.2, 5, tCoat); s.cone(V(x, 1.4, z), V(x, 1.8, z), 0.55, 6, tHat);
      if (lamp) {
        s.box(x - 0.32, 1.85, z + 0.25, 0.03, 0.95, 0.03, 0, tDark); s.box(x - 0.32, 2.82, z + 0.25, 0.17, 0.22, 0.17, 0, tGlow, 1);
      }
    };
    const reflBars = (s, x0, y, z, n = 4) => {                     // the lantern doubled in the water: stacked amber bars
      const col = cAmber.clone().multiplyScalar(1.5);
      for (let i = 0; i < n; i++) { const x = x0 + i * 0.46, hz = 0.36 - i * 0.075; s.quad(V(x - 0.15, y, z - hz), V(x + 0.15, y, z - hz), V(x + 0.15, y, z + hz), V(x - 0.15, y, z + hz), col, 0, 0, 1); }
    };
    const _m = new THREE.Matrix4(), _x = V(0, 0, 0), _y = V(0, 1, 0), _z = V(0, 0, 0), _p = V(0, 0, 0), _q = V(0, 0, 0), _f = V(0, 0, 0), _r = V(0, 0, 0);
    let procession = null, boat = null;
    if (!cast.boatman) {
      const s = makeSoup(); figure(s, 0, 0, true);
      for (const l of [-1, 1]) s.box(l * 0.1, 0.25, 0, 0.06, 0.25, 0.07, 0, tDark);
      reflBars(s, 0.95, -0.39, 0.25);
      const N = 30, mesh = new THREE.InstancedMesh(s.build(), instMat, N); mesh.frustumCulled = false; mesh.name = 'procession'; scene.add(mesh);
      const kp = K - Math.max(3, Math.round((K - kb) * 0.42)), phN = 25 / A.radiusAt(0, kp), phF = Math.min(0.62, A.phiEnd(kp) - 0.08), route = [], cum = [0];
      for (let ph = -phF; ph < -phN; ph += 0.012) route.push(A.contour(ph, kp, 0.3));
      const legA = route.length;
      for (let ph = -phN; ph > -phF; ph -= 0.012) route.push(A.contour(ph, kp - 1, 0.3));
      for (let i = 1; i <= route.length; i++) cum.push(cum[i - 1] + route[i - 1].distanceTo(route[i % route.length]));
      const L = cum[route.length]; let hint = 0;
      const at = (d, out, tan) => {
        d = ((d % L) + L) % L; let i = hint; if (cum[i] > d) i = 0; while (i < route.length - 1 && cum[i + 1] < d) i++; hint = i;
        const a = route[i], b = route[(i + 1) % route.length], f = (d - cum[i]) / Math.max(cum[i + 1] - cum[i], 1e-3);
        out.lerpVectors(a, b, f); tan.subVectors(b, a); tan.y = 0; tan.normalize();
      };
      const uMeet = path.nearestXZ(0, -A.radiusAt(0, kp)).u;
      procession = { mesh, N, at, sMeet: cum[legA] + 58, uMeet };
    } else {
      const s = makeSoup(), cH = mix(cInk, cDeep, 0.6), cG = mix(cSage, cMist, 0.35);
      const hull = [V(0, 0.5, 3.1), V(0.62, 0.34, 1.2), V(0.6, 0.3, -1.6), V(0, 0.42, -2.7), V(-0.6, 0.3, -1.6), V(-0.62, 0.34, 1.2)], keel = V(0, -0.1, 0);
      for (let i = 0; i < 6; i++) { const a = hull[i], b = hull[(i + 1) % 6]; s.tri(a, b, keel, i < 3 ? cH : mix(cDeep, cTeal, 0.5)); s.tri(a, b, V(0, 0.2, 0), i % 2 ? cG : mix(cTeal, cSage, 0.6)); }
      figure(s, 0, -1.5, false);
      s.quad(V(0.3, 2.9, -2.3), V(0.36, 2.9, -2.3), V(0.74, -0.6, -0.4), V(0.68, -0.6, -0.4), cG, 0.05, 0);                               // the pole
      s.box(0, 1.0, 2.5, 0.03, 0.55, 0.03, 0, tDark); s.box(0, 1.65, 2.5, 0.2, 0.25, 0.2, 0, tGlow, 1);
      for (let i = 0; i < 5; i++) { const z = 3.4 + i * 0.5, hx = 0.42 - i * 0.07; s.quad(V(-hx, 0.02, z - 0.16), V(hx, 0.02, z - 0.16), V(hx, 0.02, z + 0.16), V(-hx, 0.02, z + 0.16), cAmber.clone().multiplyScalar(1.5), 0, 0, 1); }
      boat = new THREE.Mesh(s.build(), propMat); boat.name = 'boatman'; scene.add(boat);
    }

    await ctx.yield();

    // ---------------- the party on the lantern walk: four carriers and a palanquin coming the other way, bowl side ----------------
    const party = { lat: 1.85, d0: 36.6, speed: 1.0, offs: [0, 2.3, 8.0, 10.3], kago: null, mesh: null };
    {
      const s = makeSoup(); figure(s, 0, 0, true);
      for (const l of [-1, 1]) s.box(l * 0.1, 0.25, 0, 0.06, 0.25, 0.07, 0, tDark);
      party.mesh = new THREE.InstancedMesh(s.build(), instMat, 4); party.mesh.frustumCulled = false; party.mesh.name = 'walk-carriers'; scene.add(party.mesh);
      const k = makeSoup();                                          // the palanquin: a lacquered box slung from one long pole, a bearer at each end
      figure(k, 0, 1.9, false); figure(k, 0, -1.9, false);
      for (const z of [1.9, -1.9]) for (const l of [-1, 1]) k.box(l * 0.1, 0.25, z, 0.06, 0.25, 0.07, 0, tDark);
      k.box(0.24, 1.5, 0, 0.045, 0.045, 2.6, 0, tWood);
      k.box(0.24, 0.92, 0, 0.42, 0.4, 0.62, 0, tVerm); k.box(0.24, 1.36, 0, 0.5, 0.05, 0.72, 0, { ...tDark, top: mix(cSage, cMist, 0.5) });
      for (const sx of [-1, 1]) k.box(0.24 + sx * 0.425, 0.98, 0, 0.01, 0.2, 0.34, 0, tGlow, 1);          // lit paper windows
      k.box(0.24, 0.5, 0, 0.44, 0.03, 0.64, 0, tDark);
      for (const z of [-0.5, 0.5]) k.box(0.24, 1.42, z, 0.02, 0.08, 0.02, 0, tDark);
      paperLantern(k, V(0.24, 1.05, 2.75), 0.6, 0.25); k.box(0.24, 1.38, 2.75, 0.01, 0.1, 0.01, 0, tDark);          // a small lantern swinging from the pole's nose
      party.kago = new THREE.Mesh(k.build(), propMat); party.kago.name = 'palanquin'; party.kago.scale.setScalar(1.2); scene.add(party.kago);
    }

    // ---------------- lanterns on the bund: a second party files along the dyke we cross two thirds of the way down, near enough to read ----------------
    const bund = { mesh: null, kago: null, N: 8, k: kb + 2, ph0: 0, r: 1, uX: 0.535, gap: 2.9 };
    {
      const pX = path.pointAt(bund.uX), tX = path.tangentAt(bund.uX), hl = Math.hypot(tX.x, tX.z) || 1, x = pX.x + tX.x / hl * 8, z = pX.z + tX.z / hl * 8, h = A.heightAt(x, z);
      let bd = 1e9; for (let k = kb + 1; k < K; k++) { const d = Math.abs(A.levels[k] - h); if (d < bd) { bd = d; bund.k = k; } }
      bund.ph0 = Math.atan2(x, -z); bund.r = A.radiusAt(bund.ph0, bund.k);
      const s = makeSoup(); figure(s, 0, 0, true);
      for (const l of [-1, 1]) s.box(l * 0.1, 0.25, 0, 0.06, 0.25, 0.07, 0, tDark);
      reflBars(s, 0.95, -0.39, 0.25);
      bund.mesh = new THREE.InstancedMesh(s.build(), instMat, bund.N); bund.mesh.frustumCulled = false; bund.mesh.name = 'bund-carriers'; scene.add(bund.mesh);
      bund.kago = new THREE.Mesh(party.kago.geometry, propMat); bund.kago.name = 'bund-palanquin'; bund.kago.scale.setScalar(1.5); scene.add(bund.kago);
    }
    bund.slots = Array.from({ length: bund.N + 1 }, (_, i) => (i < 4 ? i : i === 4 ? 4.6 : i + 1.2));          // the places of the file (some move on, below the rigs)

    // ---------------- kanto: tall bamboo rigs hung with rows of lanterns, carried in the bund party; we come down between two of them ----------------
    const kanto = { mesh: null, slots: [] };
    {
      // which places in the file the rigs take: the path swings back along this bund while the party walks the other way, so every place is
      // tried against the whole pass, and only those that never come within 6.5 m of the eye are used (nearest first: we come down between them)
      const cq = V(0, 0, 0), kq = V(0, 0, 0), cand = [];
      for (let sl = -4; sl <= 14; sl += 0.25) {
        let clear = 1e9; if (sl % 2 === 0) await ctx.yield();
        for (let i = 0; i <= 80; i++) {
          const u = bund.uX - 0.3 + 0.6 * i / 80, ph = bund.ph0 + side * ((u - bund.uX) * duration * 1.1 + bund.gap * 4.5 - sl * bund.gap) / bund.r;
          path.pointAt(clamp(u, 0, 1), cq); A.contour(ph, bund.k, 0.3, kq);
          if (cq.y < kq.y + 13 && cq.y > kq.y - 4) clear = Math.min(clear, Math.hypot(cq.x - kq.x, cq.z - kq.z));
        }
        if (clear >= 6.5) cand.push({ sl, clear });
      }
      cand.sort((a, b) => a.clear - b.clear);
      for (const c of cand) { if (kanto.slots.length >= 4) break; if (kanto.slots.every((o) => Math.abs(o - c.sl) >= 1.75)) kanto.slots.push(c.sl); }
      while (kanto.slots.length < 4) kanto.slots.push(20 + kanto.slots.length * 2);          // (never in practice: far along the bund)
      const s = makeSoup(), tB = { pz: mix(cSage, cMist, 0.3), nz: mix(cTeal, cSage, 0.4), px: mix(cTeal, cSage, 0.7), nx: mix(cTeal, cSage, 0.7), top: mix(cSage, cMist, 0.3) };
      s.box(0, 3.7, 0, 0.045, 3.7, 0.045, 0, tB); figure(s, 0.45, 0, false);
      for (const [y, hw, n] of [[3.3, 1.55, 5], [4.4, 1.55, 5], [5.5, 1.2, 4], [6.5, 0.8, 3]]) {
        s.box(0, y, 0, 0.03, 0.03, hw, 0, tB);
        for (let i = 0; i < n; i++) { const z = n > 1 ? lerp(-hw + 0.12, hw - 0.12, i / (n - 1)) : 0; paperLantern(s, V(0, y - 0.42, z), 0.72, 0.1 + 0.04 * (i % 2)); }
      }
      for (const l of [-1, 1]) s.tri(V(0, 7.4, 0), V(0, 7.25, l * 0.1), V(0, 7.9, l * 0.5), mix(cMist, cCream, 0.6).multiplyScalar(0.9), 0.1, 0.1, 0.4);          // paper streamers at the tip
      kanto.mesh = new THREE.InstancedMesh(s.build(), instMat, kanto.slots.length); kanto.mesh.frustumCulled = false; kanto.mesh.name = 'kanto'; scene.add(kanto.mesh);
    }
    // (cure) the file walks with the flight, so each place in it has one walk against our pass. No carrier of it walks within
    // 2 m of our line's point of the same moment: one that would moves on along the dyke, a quarter place at a time, away from
    // the palanquin, to the first place that is clear of our line and half a place from every rig (so it walks through no rig's
    // bearer), and the carriers beyond it move on with it to keep a place apart. So where we come down across the dyke the file
    // opens for us. Nobody is taken out; the palanquin, the rigs and every carrier that need not move walk as before. Counted
    // with a carrier: every corner of it and its edges every half metre (the lantern on its pole), the step's lift, the wobble
    // of its doubled light, and three hundredths of a metre for what lies between such points and between two points of our line
    // a quarter metre apart
    {
      const g = bund.mesh.geometry, gp = g.attributes.position, gs = g.attributes.aSway, gg = g.attributes.aGlow, ix = g.index, nt = ix ? ix.count : gp.count;
      const n = Math.ceil(path.length / 0.25), rt = new Float32Array((n + 1) * 3), q = V(0, 0, 0), pts = [], had = new Set();
      for (let i = 0; i <= n; i++) { path.pointAt(i / n, q); rt[i * 3] = q.x; rt[i * 3 + 1] = q.y; rt[i * 3 + 2] = q.z; }
      let reach = 0;
      const wobOf = (j) => 1.5 * (0.5 * Math.abs(gs.getX(j)) + (gg.getX(j) > 0.5 && gp.getY(j) < 0 ? 0.14 : 0));
      const add = (x, y, z, wob) => { const key = Math.round(x * 100) + ',' + Math.round(y * 100) + ',' + Math.round(z * 100) + ',' + Math.round(wob * 100); if (had.has(key)) return; had.add(key); pts.push(x, y, z, wob); reach = Math.max(reach, Math.hypot(x, y, z) + wob + 0.06); };
      for (let j = 0; j < gp.count; j++) add(gp.getX(j) * 1.5, gp.getY(j) * 1.5, gp.getZ(j) * 1.5, wobOf(j));
      for (let k = 0; k < nt; k++) {
        const a = ix ? ix.getX(k) : k, k1 = k - k % 3 + (k + 1) % 3, b = ix ? ix.getX(k1) : k1, wob = Math.max(wobOf(a), wobOf(b));
        const ax = gp.getX(a) * 1.5, ay = gp.getY(a) * 1.5, az = gp.getZ(a) * 1.5, bx = gp.getX(b) * 1.5, by = gp.getY(b) * 1.5, bz = gp.getZ(b) * 1.5, m = Math.ceil(Math.hypot(bx - ax, by - ay, bz - az) / 0.5);
        for (let i = 1; i < m; i++) add(lerp(ax, bx, i / m), lerp(ay, by, i / m), lerp(az, bz, i / m), wob);
      }
      const far = (reach + 2.03 + 0.5) ** 2, np = pts.length / 4;
      const clearAt = (slot) => {                                    // the nearest any counted point of a carrier in this place comes to our line's point of the same moment
        let m = 1e9;
        for (let i = 0; i <= n; i++) {
          const ph = bund.ph0 + side * ((i / n - bund.uX) * duration * 1.1 + bund.gap * 4.5 - slot * bund.gap) / bund.r;
          A.contour(ph, bund.k, 0.3, q);
          const ex = rt[i * 3] - q.x, ey = rt[i * 3 + 1] - q.y, ez = rt[i * 3 + 2] - q.z; if (ex * ex + ey * ey + ez * ez > far) continue;
          const zx = Math.cos(ph) * side, zz = Math.sin(ph) * side;
          for (let j = 0; j < np; j++) {
            const x = pts[j * 4], z = pts[j * 4 + 2], dx = ex - (x * zz + z * zx), dz = ez - (z * zz - x * zx), dy = Math.max(0, Math.abs(ey - pts[j * 4 + 1] - 0.03) - 0.03);
            m = Math.min(m, Math.sqrt(dx * dx + dy * dy + dz * dz) - pts[j * 4 + 3]);
          }
        }
        return m;
      };
      const offRigs = (slot) => kanto.slots.every((o) => Math.abs(o - slot) > 0.499);
      for (const [from, to, way] of [[5, bund.N + 1, 1], [3, -1, -1]]) for (let i = from; i !== to; i += way) {
        const own = bund.slots[i];
        let sl = way > 0 ? Math.max(own, bund.slots[i - 1] + 1) : Math.min(own, bund.slots[i + 1] - 1);
        await ctx.yield();
        for (let k = 0; k < 48 && ((sl !== own && !offRigs(sl)) || clearAt(sl) < 2.03); k++) { sl += 0.25 * way; await ctx.yield(); }          // (at most twelve places: never neared)
        bund.slots[i] = sl;
      }
    }

    // ---------------- the dancers round the drum tower, and the lanterns set afloat on the round pond ----------------
    {
      const s = makeSoup(), cFan = mix(cMist, cCream, 0.7).multiplyScalar(0.95); figure(s, 0, 0, false);
      for (const l of [-1, 1]) s.box(l * 0.1, 0.25, 0, 0.06, 0.25, 0.07, 0, tDark);
      s.quad(V(0.2, 1.2, 0.05), V(0.26, 1.2, 0.05), V(0.62, 1.78, 0.2), V(0.56, 1.78, 0.2), mix(cDeep, cTeal, 0.7), 0, 0.3);          // an arm raised, a round fan in the hand
      for (let i = 0; i < 6; i++) { const a0 = i * TAU / 6, a1 = a0 + TAU / 6; s.tri(V(0.62, 1.95, 0.2), V(0.62 + Math.cos(a0) * 0.3, 1.95 + Math.sin(a0) * 0.3, 0.2), V(0.62 + Math.cos(a1) * 0.3, 1.95 + Math.sin(a1) * 0.3, 0.2), cFan, 0.3, 0.3, 0.3); }
      s.box(-0.02, 0.98, 0.21, 0.2, 0.07, 0.02, 0, { pz: cVerm, nz: cVerm, px: cVerm, nx: cVerm, top: cVerm });          // the sash
      fest.mesh = new THREE.InstancedMesh(s.build(), instMat, fest.N); fest.mesh.frustumCulled = false; fest.mesh.name = 'dancers'; scene.add(fest.mesh);
    }
    {
      // toro nagashi: paper box lanterns on little rafts, let go where the stream comes in and drifting toward the gate, each with its light laid on the water
      const s = makeSoup(), tone = (nx, nz) => (nz < -0.4 ? glowPale : nx > 0.3 ? glowAmber : glowAmber2);
      s.box(0, 0.035, 0, 0.42, 0.035, 0.42, 0, tDark);
      s.prism(V(0, 0.07, 0), V(0, 0.72, 0), 0.3, 0.36, 4, tone, 0, 0, Math.PI / 4, 1);
      s.quad(V(-0.25, 0.725, -0.25), V(0.25, 0.725, -0.25), V(0.25, 0.725, 0.25), V(-0.25, 0.725, 0.25), glowPale, 0, 0, 1);
      for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) s.box(x * 0.3, 0.4, z * 0.3, 0.02, 0.36, 0.02, 0, tDark);
      { const col = cAmber.clone().multiplyScalar(1.5); for (let i = 0; i < 4; i++) { const z = -0.72 - i * 0.42, hx = 0.4 - i * 0.075; s.quad(V(-hx, 0.012, z - 0.13), V(hx, 0.012, z - 0.13), V(hx, 0.012, z + 0.13), V(-hx, 0.012, z + 0.13), col, 0, 0, 1); } }
      const base = s.build(), g = new THREE.InstancedBufferGeometry(); for (const k of ['position', 'color', 'aSway', 'aGlow']) g.setAttribute(k, base.getAttribute(k));
      const iA = [], iB = [], want = Math.round(58 * detail * clamp(dens, 0.85, 1.2)), R = A.pondRadius - 2.2;
      for (let i = 0; i < 3000 && iA.length / 4 < want; i++) {
        const f = fk(), z = lerp(-R, R, Math.pow(f, 0.8)), x = fk.gauss() * (5 + 13 * Math.sin(Math.PI * clamp(0.12 + 0.8 * f, 0, 1))); if (Math.hypot(x, z) > R - 1.5) continue;
        iA.push(pond.x + x, waterY + 0.02, pond.z + z, fk()); iB.push(fk.range(0.05, 0.12) * (fk() < 0.5 ? -1 : 1), fk.range(0.5, 1.3), fk.range(1.0, 1.55), fk());
      }
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(iA), 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(iB), 4)); g.instanceCount = iA.length / 4;
      const fl = new THREE.Mesh(g, flatMat(/* glsl */`
        float a = iA.w * 40. + uTime * iB.x;
        vec3 c = iA.xyz + vec3(sin(a) * iB.y, 0., cos(a * .7 + iB.w * 6.) * iB.y);
        float lit = step(.05, p.y); p *= iB.z;
        p.x += lit * p.y * .05 * sin(uTime * 1.1 + iA.w * 31.); p.y += lit * .025 * sin(uTime * 1.6 + iA.w * 17.);
        p.z *= mix(1. + .25 * sin(uTime * 2.3 + iA.w * 50. + p.z * 3.), 1., lit);
        wp = modelMatrix * vec4(c + p, 1.);`, {}, 'attribute vec4 iA, iB;'));
      fl.frustumCulled = false; fl.name = 'pond-lanterns'; scene.add(fl);
    }
    await ctx.yield();

    // ---------------- frogs on the dykes along the path: each leaps as the lantern nears, and plops ----------------
    const frogs = [];
    let frogMesh = null;
    const uFrog = lerp(uBrink, uBench, 0.62);
    {
      const fr = rng.fork('frogs'), s = makeSoup(), cT = mix(cSage, cMist, 0.55), cS = mix(cTeal, cSage, 0.7), cD = mix(cDeep, cTeal, 0.5);
      const f = V(0, 0.12, 0.22), bk = V(0, 0.07, -0.2), tp = V(0, 0.26, 0), bt = V(0, 0, 0);
      for (const l of [-1, 1]) { const sd = V(l * 0.17, 0.1, 0); s.tri(f, sd, tp, cT); s.tri(sd, bk, tp, cS); s.tri(f, bt, sd, cD); s.tri(sd, bt, bk, cD); s.tri(V(l * 0.07, 0.22, 0.1), V(l * 0.13, 0.2, 0.06), V(l * 0.1, 0.31, 0.07), mix(cMist, cCream, 0.5)); s.tri(V(l * 0.15, 0.1, -0.05), V(l * 0.3, 0, 0.02), V(l * 0.16, 0, -0.22), cS); }
      const want = Math.round(40 * clamp(dens, 0.8, 1.2));
      for (const { q, ph, d } of slopePaddies) {
        if (frogs.length >= want) break; if (d > 48 || q.wid < 2.4) continue;
        for (let k = 0; k < 4 && frogs.length < want; k++) {
          const r = A.radiusAt(ph, q.level), pp = ph + fr.range(-0.47, 0.47) * q.len / r, home = A.contour(pp, q.level, 0.35), n = path.nearestXZ(home.x, home.z);
          if (n.dist > 15 || n.dist < 1.2) continue;
          const land = A.contour(pp, q.level, 2.0); land.y = q.y;
          frogs.push({ home, land, uLeap: n.u - 2.4 / duration + fr.range(-0.01, 0.01), yaw: Math.atan2(land.x - home.x, land.z - home.z), done: false, sc: fr.range(1.5, 2.1), ph: fr.range(0, 6) });
        }
      }
      // the one the lens is waiting for: nearest the path at the slow pass
      const pf = path.pointAt(uFrog), star = frogs.slice().sort((a, b) => a.home.distanceTo(pf) - b.home.distanceTo(pf))[0];
      if (star) { star.uLeap = uFrog - 1.6 / duration; star.sc = 2.4; }
      frogMesh = new THREE.InstancedMesh(s.build(), instMat, Math.max(1, frogs.length)); frogMesh.count = frogs.length; frogMesh.frustumCulled = false; frogMesh.name = 'frogs'; scene.add(frogMesh);
    }

    await ctx.yield();

    // ---------------- bats round the camphor, smoke from the farmhouse ----------------
    {
      const br = rng.fork('bats'), s = makeSoup(), cb = cInk.clone().multiplyScalar(0.55);
      for (const l of [-1, 1]) { s.tri(V(0, 0, 0.12), V(0, 0, -0.14), V(l * 0.3, 0.02, 0.05), cb, 0, 0, l * 0.5); s.tri(V(l * 0.3, 0.02, 0.05), V(0, 0, -0.14), V(l * 0.62, 0, -0.1), cb, l * 0.5, 0, l); }
      const base = s.build(), g = new THREE.InstancedBufferGeometry(); for (const k of ['position', 'color', 'aSway', 'aGlow']) g.setAttribute(k, base.getAttribute(k));
      const n = Math.round(30 * clamp(dens, 0.8, 1.3)), ia = [];
      for (let i = 0; i < n; i++) ia.push(br.range(7, 24), br.range(5, 19), br.range(0.5, 1.1) * br.sign(), br.range(0, 6.28));
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(ia), 4)); g.instanceCount = n;
      const bats = new THREE.Mesh(g, flatMat(/* glsl */`
        float a = iA.w + uTime * iA.z, r = iA.x * (1. + .3 * sin(uTime * .7 + iA.w * 3.));
        vec3 c = uBat + vec3(sin(a) * r, iA.y + 1.8 * sin(uTime * 1.9 + iA.w * 5.), cos(a) * r * .8);
        p *= 1.7; p.y += abs(aSway) * sin(uTime * 19. + iA.w * 9.) * .55;
        float hd = a + 1.5708 * sign(iA.z), cs = cos(hd), sn = sin(hd);
        wp = modelMatrix * vec4(c + vec3(p.x * cs + p.z * sn, p.y, -p.x * sn + p.z * cs), 1.);`, { uBat: { value: V(camphor.x - 4, benchY, camphor.z - 4) } }, 'attribute vec4 iA; uniform vec3 uBat;'));
      bats.frustumCulled = false; bats.name = 'bats'; scene.add(bats);

      const ps = [], pi = [];
      // each puff is a printed cloud: three round lobes over a flattened base (a = 0 is the top)
      const puffR = (a, i) => 0.66 + 0.34 * Math.abs(Math.cos(a * 1.5 + 0.25 * (i - 1)));
      for (let i = 0; i < 3; i++) for (let pl = 0; pl < 2; pl++) for (let k = 0; k < 24; k++) {
        const a0 = k * TAU / 24, a1 = a0 + TAU / 24, r0 = puffR(a0, i), r1 = puffR(a1, i);
        const P = (a, r) => { const y = Math.cos(a) * r * (Math.cos(a) > 0 ? 0.85 : 0.42); return pl ? [0, y, Math.sin(a) * r * 0.8] : [Math.sin(a) * r * 1.15, y, 0]; };
        ps.push(0, 0, 0, ...P(a0, r0), ...P(a1, r1)); pi.push(i, i, i);
      }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(ps, 3)); sg.setAttribute('aI', new THREE.Float32BufferAttribute(pi, 1));
      const smoke = new THREE.Mesh(sg, new THREE.ShaderMaterial({
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: U.uTime, uAt: { value: smokeAt }, uCol: { value: mix(cSage, cMist, 0.6).multiplyScalar(0.5) } },
        transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
        vertexShader: /* glsl */`attribute float aI; uniform float uTime; uniform vec3 uAt; varying float vF;
          #include <fog_pars_vertex>
          void main(){ float f = fract(uTime * .075 + aI / 3.); vF = f; vec3 p = position * (.8 + 2.6 * f);
            p.y += f * 12.; p.x += -f * (2.5 + 6.5 * f) + sin(uTime * .5 + aI * 2.) * .5 * f; p.z += sin(aI * 4.) * f * 1.5;
            vec4 mvPosition = viewMatrix * vec4(p + uAt, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`uniform vec3 uCol; varying float vF;
          #include <fog_pars_fragment>
          void main(){ gl_FragColor = vec4(uCol, .8 * smoothstep(0., .08, vF) * (1. - smoothstep(.55, 1., vF)));
            #include <fog_fragment>
          }`,
      }));
      smoke.frustumCulled = false; smoke.renderOrder = 5; smoke.name = 'smoke'; scene.add(smoke);
    }
    await ctx.yield();

    // ---------------- one silent crossing: the owl (or a fox trotting a dyke) ----------------
    const crosser = new THREE.Group(); crosser.visible = false; scene.add(crosser);
    const wings = [];
    const owlLine = path.pointAt(Math.min(uFrog + 0.045, uBench - 0.02));
    let foxRoute = null;
    if (!cast.fox) {
      const s = makeSoup(), cT = mix(cSage, cMist, 0.7), cU = mix(cTeal, cSage, 0.7), cF = mix(cMist, cCream, 0.6);
      const nose = V(0, 0, 0.42), tl = V(0, 0.02, -0.5), tp = V(0, 0.2, 0.05), bt = V(0, -0.2, 0.05);
      for (const l of [-1, 1]) { const sd = V(l * 0.24, 0, 0.1); s.tri(nose, sd, tp, cF); s.tri(sd, tl, tp, cT); s.tri(nose, bt, sd, cF); s.tri(sd, bt, tl, cU); }
      crosser.add(new THREE.Mesh(s.build(), propMat));
      for (const l of [-1, 1]) {
        const w = makeSoup();
        w.quad(V(0, 0, 0.3), V(0, 0, -0.3), V(l * 0.85, 0, -0.36), V(l * 0.85, 0, 0.26), cT); w.tri(V(l * 0.85, 0, 0.26), V(l * 0.85, 0, -0.36), V(l * 1.55, 0, -0.2), cU);
        for (let i = 0; i < 4; i++) w.tri(V(l * (0.3 + i * 0.3), 0.005, -0.3), V(l * (0.5 + i * 0.3), 0.005, -0.34), V(l * (0.42 + i * 0.3), 0.005, -0.1), cU);
        const m = new THREE.Mesh(w.build(), propMat); m.position.set(l * 0.2, 0.05, 0); crosser.add(m); wings.push(m);
      }
      crosser.scale.setScalar(2.1);
    } else {
      const s = makeSoup(), cT = mix(cSage, cMist, 0.55), cU = mix(cTeal, cSage, 0.55), cW = mix(cMist, cCream, 0.7);
      s.box(0, 0.42, 0, 0.11, 0.12, 0.36, 0, { pz: cT, nz: cU, px: cU, nx: cT, top: cT });
      s.cone(V(0, 0.5, 0.3), V(0, 0.52, 0.72), 0.13, 4, () => cT, 0, 0); s.tri(V(-0.1, 0.56, 0.38), V(-0.03, 0.56, 0.42), V(-0.08, 0.76, 0.36), cU); s.tri(V(0.1, 0.56, 0.38), V(0.03, 0.56, 0.42), V(0.08, 0.76, 0.36), cU);
      s.cone(V(0, 0.44, -0.36), V(0, 0.52, -0.95), 0.12, 4, () => cT, 0, 0.12); s.cone(V(0, 0.5, -0.8), V(0, 0.55, -1.08), 0.09, 4, () => cW, 0.1, 0.14);
      for (const [x, z] of [[-0.08, 0.26], [0.08, 0.2], [-0.08, -0.26], [0.08, -0.32]]) s.box(x, 0.16, z, 0.03, 0.16, 0.03, 0, tDark);
      crosser.add(new THREE.Mesh(s.build(), propMat)); crosser.scale.setScalar(1.7);
      const kf = clamp(Math.round(lerp(K, kb, 0.66)), kb + 2, K - 2);
      foxRoute = (f, out) => A.contour(lerp(-0.1, 0.12, f), kf, 0.3, out);
    }

    await ctx.yield();

    // ---------------- far off: the ox cart with its swinging lantern (or a firework over the village) ----------------
    let cart = null, firework = null;
    const kc = K - Math.max(2, Math.round((K - kb) * 0.25));
    if (!cast.firework) {
      const s = makeSoup(), cO = mix(cInk, cDeep, 0.7);
      s.box(0, 1.0, 1.9, 0.38, 0.42, 0.85, 0, { pz: mix(cDeep, cTeal, 0.6), nz: cO, px: cO, nx: mix(cDeep, cTeal, 0.3), top: mix(cDeep, cTeal, 0.7) });   // the ox
      s.cone(V(0, 1.1, 2.7), V(0, 0.95, 3.25), 0.26, 4, () => cO); for (const l of [-1, 1]) { s.tri(V(l * 0.1, 1.3, 2.85), V(l * 0.16, 1.26, 2.9), V(l * 0.42, 1.6, 2.95), mix(cSage, cMist, 0.6)); for (const z of [1.3, 2.5]) s.box(l * 0.25, 0.3, z, 0.07, 0.3, 0.07, 0, tDark); }
      s.box(0, 1.15, -0.4, 0.62, 0.38, 1.05, 0, tWood); s.box(0, 1.0, 0.85, 0.05, 0.04, 0.45, 0, tDark);
      for (const l of [-1, 1]) s.prism(V(l * 0.7, 0.62, -0.4), V(l * 0.78, 0.62, -0.4), 0.62, 0.62, 8, () => mix(cDeep, cTeal, 0.5));
      s.box(0.5, 2.0, -1.3, 0.03, 0.6, 0.03, 0, tDark); s.box(0.5, 2.5, -1.3, 0.2, 0.26, 0.2, 0, tGlow, 1);
      reflBars(s, 1.3, -0.22, -1.3, 5);
      cart = new THREE.Group(); const cm = new THREE.Mesh(s.build(), propMat); cart.add(cm);
      const ls = makeSoup(); ls.box(0, -0.45, 0, 0.26, 0.32, 0.26, 0, tGlow, 1);
      const lm = new THREE.Mesh(ls.build(), propMat); lm.position.set(0.5, 2.25, -1.3); cart.add(lm); cart.userData.lamp = lm;
      cart.scale.setScalar(1.8); cart.name = 'ox-cart'; scene.add(cart);
    } else {
      const fr = rng.fork('firework'), n = 110, pos = [], av = [];
      for (let i = 0; i < n; i++) { const a = fr.range(0, 6.28), e = Math.asin(fr.range(-1, 1)), sp = fr.range(0.75, 1); pos.push(0, 0, 0); av.push(Math.cos(e) * Math.cos(a) * sp, Math.sin(e) * sp, Math.cos(e) * Math.sin(a) * sp, i < 6 ? -1 : fr()); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aV', new THREE.Float32BufferAttribute(av, 4));
      firework = new THREE.Points(g, new THREE.ShaderMaterial({
        uniforms: { uTime: U.uTime, uH: flyU.uH, uAt: { value: V(village.x, 0, village.z) }, cA: { value: cAmber.clone().multiplyScalar(2.4) }, cB: { value: cCream.clone().multiplyScalar(2.2) } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`attribute vec4 aV; uniform float uTime, uH; uniform vec3 uAt; varying float vA, vM;
          void main(){
            float cyc = uTime / 9., n = floor(cyc), f = fract(cyc), hs = fract(sin(n * 12.9898) * 43758.5453);
            vec3 c = uAt + vec3((hs - .5) * 260., 150. + 90. * hs, (fract(hs * 7.) - .5) * 120.), p; float a;
            if (aV.w < 0.) { float r = clamp(f / .22, 0., 1.); p = vec3(c.x, mix(0., c.y, 1. - (1. - r) * (1. - r)) - fract(aV.x * 9.) * 10., c.z); a = step(f, .22) * smoothstep(0., .03, f); }
            else { float x = clamp((f - .22) / .5, 0., 1.), e = 1. - exp(-4.5 * x); p = c + aV.xyz * (48. + 30. * hs) * e - vec3(0., 34. * x * x, 0.); a = smoothstep(0., .08, x) * (1. - smoothstep(.45, 1., x)) * step(.22, f) * (.6 + .4 * sin(uTime * 9. + aV.w * 40.)); }
            vM = step(.5, fract(aV.w * 3. + hs)); vA = a;
            vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(2.6 * uH * projectionMatrix[1][1] * .5 / max(-mv.z, 1.) * 2., 2., 9.);
          }`,
        fragmentShader: /* glsl */`uniform vec3 cA, cB; varying float vA, vM; void main(){ float d = length(gl_PointCoord - .5) * 2.; gl_FragColor = vec4(mix(cA, cB, vM) * (1. - smoothstep(.3, 1., d)) * vA, 1.); }`,
      }));
      firework.frustumCulled = false; firework.renderOrder = 6; firework.name = 'firework'; scene.add(firework);
    }

    // ---------------- soft rain: fine diagonal keylines over the whole print ----------------
    let rainU = null;
    if (rain) {
      rainU = { uTime: U.uTime, uRes: { value: new THREE.Vector2(800, 450) }, uCol: { value: mix(cSage, cMist, 0.7).multiplyScalar(0.6) } };
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
      const rm = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: rainU, transparent: true, depthWrite: false, depthTest: false, fog: false,
        vertexShader: /* glsl */`void main(){ gl_Position = vec4(position.xy, 0., 1.); }`,
        fragmentShader: /* glsl */`uniform float uTime; uniform vec2 uRes; uniform vec3 uCol;
          float h1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
          float layer(vec2 p, float s, float sp){
            float x = (p.x + p.y * .3) * s, c = floor(x), h = h1(c);
            float y = fract(p.y * (1.3 + h) + uTime * sp * (.7 + .6 * h) + h * 7.);
            return step(abs(fract(x) - .5), .8 * s / uRes.y) * step(y, .14 + .18 * h) * step(.5, h1(c + 31.));
          }
          void main(){ vec2 p = gl_FragCoord.xy / uRes.y; float a = max(layer(p, 46., 2.4), .6 * layer(p + 3.7, 83., 3.1)); gl_FragColor = vec4(uCol, a * .24); }`,
      }));
      rm.frustumCulled = false; rm.renderOrder = 30; rm.name = 'rain-lines'; scene.add(rm);
    }
    await ctx.yield();

    // ---------------- gaze, breeze timing ----------------
    const stiltGaze = V(0, 0, 0);
    const lowTerraces = V(-12, seat.y - 34, gateZ + 70);          // (a little toward the festival ground, so the drum tower stands whole in the frame)
    const uHouse = path.nearestXZ(stilt.c.x, stilt.c.z).u;
    const pois = [
      { at: V(side * 30, RIDGE_Y - 62, -170), from: uBrink - 0.2, to: uBrink - 0.02, weight: 0.7, fade: 0.4 },                    // the avenue opens: the eye goes out between the last trunks to the far wall of moons
      { at: V(seat.x, seat.y + 38, seat.z - 60), from: uBrink - 0.13, to: uBrink + 0.05, weight: 0.8, fade: 0.4 },                 // the reveal: the gaze turns before the feet do
      { at: (time, u) => stiltGaze.copy(stilt.look).setY(stilt.look.y + 11 * (1 - smoothstep(0.33, 0.42, u))), from: uBrink + 0.02, to: uHouse + 0.015, weight: 0.55, fade: 0.36 },   // (held above the roof at first, so the far ridges and the mist stand level over the sweep of terraces)                       // the leaf-fall, one picture after another: first the lit house on its stage, come down to and passed at the height of its screens
      { at: lowTerraces, from: uHouse - 0.02, to: uPond, weight: 0.5, fade: 0.2 },                                 // then out across the bowl, not at our toes
      { at: V(farm.x - 6, benchY + 3, farm.z + 4), from: uBench - 0.08, to: uPond - 0.01, weight: 0.36 },
      { at: V(seat.x, seat.y - 7, seat.z + 30), from: uPond - 0.05, to: 0.97, weight: 0.45 },                                // the ring, held a little low so the arms of the bowl and their moons fill the frame sides
    ];
    const uHit = uOfZ(pond.z - A.pondRadius - 9), zHit = path.pointAt(uHit).z, rate = 25 * duration;

    const gTab = new Float32Array(129);                               // ground height under the path, for the lantern pool
    { const q = V(0, 0, 0); for (let i = 0; i <= 128; i++) { path.pointAt(i / 128, q); gTab[i] = A.heightAt(q.x, q.z); } }

    const update = (dt, time, camera, u) => {
      hero.update(dt, time);
      // the breeze: idles in loops while we are only a picture in a portal, then one front, timed to overtake us on the pond
      // (it reaches us at the pond's near edge and then runs on only a little faster than we do, so the pond, the gate's mirror and the
      // arms of the bowl beside the ring break in turn, in view, all the way to the ring)
      U.uIdle.value = u > 0.015 ? 1 - smoothstep(uHit - 0.10, uHit - 0.04, u) : 1;          // catspaws shiver patches of moons all the way down; the bowl holds its breath just before the real breeze
      {          // seen through a portal the moons are printed larger and whole over their dykes (the world's signature in a small opening); after the crossing they settle back into their paddies
        const k = Math.min(1, dt * 0.9), th = ctx.through;
        U.uMinPx.value += ((th ? 0.014 : 0.007) - U.uMinPx.value) * k; U.uOv.value.x += ((th ? 28 : 90) - U.uOv.value.x) * k; U.uOv.value.y += ((th ? 70 : 170) - U.uOv.value.y) * k;
      }
      if (u > 0.015) { const du = u - uHit; hero.setBreezeFront(zHit + (du > 0 ? 0.85 * du : du) * rate); }
      else hero.setBreezeFront(A.breeze.zStart + ((time * 25) % (A.breeze.zEnd - A.breeze.zStart + 300)));
      // our own lantern's tone pool, a little ahead and to the right of the eye
      // (read straight from matrixWorld: the portal camera has no local matrix, so nothing here may ask it to update)
      _f.setFromMatrixColumn(camera.matrixWorld, 2).negate(); _r.setFromMatrixColumn(camera.matrixWorld, 0);
      _z.setFromMatrixColumn(camera.matrixWorld, 1); _x.copy(_f).addScaledVector(_z, -0.42).addScaledVector(_r, 0.44).normalize();
      _p.setFromMatrixPosition(camera.matrixWorld);
      const gi = clamp(u, 0, 1) * 128, g0 = Math.min(127, Math.floor(gi)), gh = lerp(gTab[g0], gTab[g0 + 1], gi - g0);
      const lt = clamp((_p.y - gh) / Math.max(-_x.y, 0.3), 2.5, 9.5);                 // where the lower-right sight line meets the ground
      _p.addScaledVector(_x, lt);
      hero.setLantern(_p, clamp(0.26 * lt, 1.0, 1.6)); U.uLanK.value = smoothstep(2.5, 4.5, lt);          // a low eye gets no fan of light across the frame
      ctx.renderer.getDrawingBufferSize(bufSize); flyU.uH.value = bufSize.y; if (rainU) rainU.uRes.value.copy(bufSize);
      wheel.rotation.x = -time * 0.55;
      egU.uEg.value = (u - uLift) * duration; egU2.uEg.value = (u - uLift2) * duration; egU3.uEg.value = (u - uLift3) * duration;
      if (eclipse) { const e = smoothstep(uBrink - 0.03, uBrink + 0.2, u); skyU.uEcl.value = e; U.uMoonCol.value.copy(moonBase).lerp(moonAmber, smoothstep(0.5, 1, e)); }

      {                                                              // the party walks toward the entry, keyed to u: it passes us a few seconds in
        const head = party.d0 - u * duration * party.speed;
        for (let i = 0; i < 4; i++) {
          const d = head + party.offs[i]; path.posAtDist(d, _p); path.tangentAtDist(d, _z); _z.y = 0; _z.normalize();
          _p.x += -_z.z * side * party.lat; _p.z += _z.x * side * party.lat; _p.y = RIDGE_Y + 0.02 + 0.05 * Math.abs(Math.sin(d * 2.3 + time * 2.6 + i));
          _z.negate(); _x.set(_z.z, 0, -_z.x); _m.makeBasis(_x, _y, _z).scale(_q.set(1.2, 1.2, 1.2)).setPosition(_p); party.mesh.setMatrixAt(i, _m);
        }
        party.mesh.instanceMatrix.needsUpdate = true;
        const d = head + 5.15; path.posAtDist(d, _p); path.tangentAtDist(d, _z);
        party.kago.position.set(_p.x - _z.z * side * party.lat, RIDGE_Y + 0.02 + 0.03 * Math.abs(Math.sin(time * 2.6)), _p.z + _z.x * side * party.lat);
        party.kago.rotation.set(0, Math.atan2(-_z.x, -_z.z), 0.02 * Math.sin(time * 2.6));
      }
      {                                                              // the bund party: its middle is under our line as we come over it
        const head = (u - bund.uX) * duration * 1.1 + bund.gap * 4.5;
        for (let i = 0; i <= bund.N; i++) {
          const slot = bund.slots[i], ph = bund.ph0 + side * (head - slot * bund.gap) / bund.r;
          A.contour(ph, bund.k, 0.3, _p); _z.set(Math.cos(ph) * side, 0, Math.sin(ph) * side); _x.set(_z.z, 0, -_z.x);
          if (i === 4) { bund.kago.position.set(_p.x, _p.y + 0.03 * Math.abs(Math.sin(time * 2.6)), _p.z); bund.kago.rotation.set(0, Math.atan2(_z.x, _z.z), 0.02 * Math.sin(time * 2.6)); continue; }
          _p.y += 0.06 * Math.abs(Math.sin(slot * 2.3 + time * 2.6));
          _m.makeBasis(_x, _y, _z).scale(_q.set(1.5, 1.5, 1.5)).setPosition(_p); bund.mesh.setMatrixAt(i < 4 ? i : i - 1, _m);
        }
        bund.mesh.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < kanto.slots.length; i++) {               // the rigs walk with them, leaning as they are balanced
          const ph = bund.ph0 + side * (head - kanto.slots[i] * bund.gap) / bund.r, ln = 0.05 * Math.sin(time * 0.9 + i * 2.1);
          A.contour(ph, bund.k, 0.3, _p); _z.set(Math.cos(ph) * side, 0, Math.sin(ph) * side); _x.set(_z.z, 0, -_z.x);
          _f.set(_z.x * ln, 1, _z.z * ln).normalize(); _r.crossVectors(_f, _z).normalize(); _z.crossVectors(_r, _f);
          _m.makeBasis(_r, _f, _z).scale(_q.set(1.3, 1.3, 1.3)).setPosition(_p); kanto.mesh.setMatrixAt(i, _m);
        }
        kanto.mesh.instanceMatrix.needsUpdate = true;
      }
      for (let i = 0; i < fest.N; i++) {                             // the dance: a slow ring round the tower, a step and a sway, keyed to the clock
        const a = time * 0.16 + i * TAU / fest.N, rr = fest.R + 0.5 * Math.sin(time * 0.8 + i * 2.1);
        _p.set(fest.c.x + Math.sin(a) * rr, benchY + 0.03 + 0.07 * Math.abs(Math.sin(time * 2.2 + i * 1.3)), fest.c.z + Math.cos(a) * rr);
        _z.set(Math.cos(a), 0, -Math.sin(a)); _x.set(_z.z, 0, -_z.x); _m.makeBasis(_x, _y, _z).scale(_q.set(1.9, 1.9, 1.9)).setPosition(_p); fest.mesh.setMatrixAt(i, _m);
      }
      fest.mesh.instanceMatrix.needsUpdate = true;
      if (procession) {
        const head = procession.sMeet + (u - procession.uMeet) * duration * 1.35;          // keyed to u alone, so the overtaking beat holds at any flight speed
        for (let i = 0; i < procession.N; i++) {
          const d = head - i * 3.4; procession.at(d, _p, _z);
          const ph = Math.atan2(_p.x, -_p.z); _x.set(Math.sin(ph), 0, -Math.cos(ph)); _p.y += 0.05 * Math.abs(Math.sin(d * 2.3 + time * 2.6 + i));
          _m.makeBasis(_x, _y, _z).setPosition(_p); procession.mesh.setMatrixAt(i, _m);
        }
        procession.mesh.instanceMatrix.needsUpdate = true;
      }
      if (boat) {
        const f = 0.5 + 0.5 * Math.sin(time * 0.05 + u * 2.4 - 1.3);
        boat.position.set(pond.x + lerp(-21, -13, f), waterY + 0.02, pond.z + lerp(-13, 11, f));
        boat.rotation.set(0.02 * Math.sin(time * 0.9), 0.35 + 0.1 * Math.sin(time * 0.21), 0.035 * Math.sin(time * 1.2));
      }
      for (let i = 0; i < frogs.length; i++) {
        const fg = frogs[i], tu = (u - fg.uLeap) * duration; let sc = fg.sc;
        if (tu <= 0) { _p.copy(fg.home); sc *= 1 + 0.07 * Math.sin(time * 3 + fg.ph); }
        else if (tu < 0.7) { const f = tu / 0.7; _p.lerpVectors(fg.home, fg.land, f); _p.y += 0.8 * Math.sin(Math.PI * f); }
        else { _p.copy(fg.land); sc = 0.0001; if (!fg.done) { fg.done = true; if (tu < 4.5) hero.plop(fg.land.x, fg.land.z, time - (tu - 0.7)); } }
        _m.makeRotationY(fg.yaw).scale(_q.set(sc, sc, sc)).setPosition(_p); frogMesh.setMatrixAt(i, _m);
      }
      if (frogMesh.count) frogMesh.instanceMatrix.needsUpdate = true;

      if (foxRoute) {
        const f = clamp((u - (uFrog - 0.14)) / 0.3, 0, 1) + time * 0.0015;
        crosser.visible = u > uBrink - 0.05 && u < uBench + 0.03;
        foxRoute(f, crosser.position); const ph = Math.atan2(crosser.position.x, -crosser.position.z);
        crosser.position.y += 0.05 * Math.abs(Math.sin(time * 9)); crosser.rotation.set(0.05 * Math.sin(time * 9), Math.atan2(Math.cos(ph), Math.sin(ph)), 0);
      } else {
        const f = (u - (uFrog - 0.055)) / 0.13; crosser.visible = f > 0 && f < 1;
        if (crosser.visible) {
          crosser.position.set(owlLine.x + lerp(-58, 58, f) * side, owlLine.y + 4.5 - 3 * Math.sin(Math.PI * f), owlLine.z - 6 + 14 * f);
          const fl = 0.12 + 0.42 * Math.sin(time * 4.2); crosser.rotation.set(0, side * Math.PI / 2, 0.12 * Math.sin(time * 0.8));
          wings[0].rotation.z = -fl; wings[1].rotation.z = fl;
        }
      }
      if (cart) {
        const ph = 0.78 - ((time * 0.0026 + u * 0.1) % 0.34);
        A.contour(ph, kc, 0.3, _p); _x.set(Math.sin(ph), 0, -Math.cos(ph)); _z.set(-Math.cos(ph), 0, -Math.sin(ph));
        _p.y += 0.03 * Math.abs(Math.sin(time * 2.2));
        cart.quaternion.setFromRotationMatrix(_m.makeBasis(_x, _y, _z)); cart.position.copy(_p);
        cart.userData.lamp.rotation.x = 0.4 * Math.sin(time * 2.1); cart.userData.lamp.rotation.z = 0.15 * Math.sin(time * 1.3);
      }
    };

    return {
      scene, path, duration,
      title: eclipse ? 'Moon in Every Paddy: Eclipse' : 'Moon in Every Paddy',
      ride: 'firefly-lantern', style: 'none',
      camera: { fov: 62, near: 0.3, far: 6500, lookAhead: 15, sway: 1, bank: 0 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#F5EBC8', glow: 0.75, revealDistance: 240 },
      post: {
        exposure: 1.05, bloom: { strength: 0.3, radius: 0.5, threshold: 0.92 },
        grade: { saturation: 1.02, contrast: 1.05, tint: '#ffffff', shadowTint: '#02080a', vignette: 0.22, grain: 0.04, aberration: 0 },
      },
      update,
      dispose() {},
    };
  },
};
