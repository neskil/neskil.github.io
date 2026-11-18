// OLD LIGHT ARRIVING, the sky group: a night dome, the few stars, the far side of the world as a still thread of pearl light, the one new
// star, thin cloud bars and the plate's far range. Everything hangs in one group that is carried with whatever camera draws the frame.
// Bearings: azimuth 0 is the entry heading (-Z), positive to the right; the group is turned left for right with the mirrored layout.
// The thread NEVER moves: no time term reaches it but a faint shimmer of air in the haze of its foot.
import * as THREE from 'three';
import { DEG, STAR_AZ, STAR_EL, skyDir, LIGHT_GLSL, BAND_GLSL } from './old-light-arriving-common.js';

const R = 6200;      // the dome's radius, inside the camera's far plane (7000)
const DIRV = /* glsl */`varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p; }`;
const patch = (az0, az1, el0, el1, na, ne) => {      // a piece of the dome between two bearings and two heights
  const g = new THREE.BufferGeometry(), pos = [], uv = [], idx = [], v = new THREE.Vector3();
  for (let j = 0; j <= ne; j++) for (let i = 0; i <= na; i++) { skyDir(el0 + (el1 - el0) * j / ne, az0 + (az1 - az0) * i / na, v); pos.push(v.x * R, v.y * R, v.z * R); uv.push(i / na, j / ne); }
  for (let j = 0; j < ne; j++) for (let i = 0; i < na; i++) { const a = j * (na + 1) + i; idx.push(a, a + 1, a + na + 1, a + 1, a + na + 2, a + na + 1); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
};
const bandPatch = (half, e0, e1, na, ne) => {      // a strip of the dome 'half' degrees either side of the vertical plane of the entry heading
  const g = new THREE.BufferGeometry(), pos = [], idx = [];
  for (let j = 0; j <= ne; j++) for (let i = 0; i <= na; i++) { const o = (-half + 2 * half * i / na) * DEG, e = (e0 + (e1 - e0) * j / ne) * DEG; pos.push(Math.sin(o) * R, Math.cos(o) * Math.sin(e) * R, -Math.cos(o) * Math.cos(e) * R); }
  for (let j = 0; j < ne; j++) for (let i = 0; i < na; i++) { const a = j * (na + 1) + i; idx.push(a, a + 1, a + na + 1, a + 1, a + na + 2, a + na + 1); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
};
const skyMat = (o) => { const m = new THREE.ShaderMaterial({ depthWrite: false, depthTest: false, side: THREE.DoubleSide, fog: false, ...o }); return m; };
// (the dome is drawn first, behind everything; what is painted on it is tested against the world so that land, walls and the arch hide it)
const PREMULT = { transparent: true, depthTest: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };
const ADD = { transparent: true, depthTest: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor };

// opts: { late (the hour: two hours into night), rare (the slow pale meteors), highCloud, LU (shared lights), streams: { stars, mottle, clouds, meteors, range } }
export function makeSkyGroup(opts) {
  const { late, rare, highCloud, LU, streams: S } = opts;
  const group = new THREE.Group(); group.frustumCulled = false;
  const add = (geo, mat, order) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; group.add(m); return m; };
  const U = { uStar: LU.uStar, uTime: LU.uTime, uFogCol: LU.uFogCol, uLate: { value: late ? 1 : 0 } };

  // ---- the dome: night blue, a dull rose-mauve afterglow six degrees tall on the horizon BEHIND us and nowhere ahead (none at the late hour).
  // It never brightens: the star's strength does not enter the gradient. Nothing else is painted in it: no curtain of light, no pattern.
  add(new THREE.SphereGeometry(R, 32, 20), skyMat({ uniforms: U, vertexShader: DIRV, fragmentShader: /* glsl */`
    uniform vec3 uFogCol; uniform float uLate; varying vec3 vDir;
    void main(){ vec3 d = normalize(vDir); float y = d.y;
      vec3 zen = vec3(.0030,.0060,.0296), mid = vec3(.0110,.0212,.0802), hor = vec3(.0202,.0331,.1022);
      vec3 c = mix(mid, zen, smoothstep(.12,.85,y)); c = mix(hor, c, smoothstep(-.02,.24,y));
      c = mix(c, c*vec3(.62,.66,.8), uLate);
      float back = clamp(d.z, 0., 1.) / max(length(d.xz), 1e-3);                                   // 1 dead astern
      float glow = (1.-uLate) * back*back*back * exp(-max(y,0.)/.1);
      c += vec3(.36,.22,.27) * glow * .55;
      c = mix(uFogCol*1.05, c, smoothstep(-.06,.012,y));                                           // under the horizon: the haze the far plain fades into
      gl_FragColor = vec4(c, 1.); }` }), -1);

  // ---- the stars: all there from the first frame, their number fixed (eighty; three hundred at the late hour). None stands within nine
  // degrees of the new star's place, so that nothing can be taken for it.
  let starTable = null;
  // (the far side is land: no star stands behind it. A star is not dealt within the band's own width and 0.3 of a degree of its plane: 1.15 to 1.75 of its widths, by the height.)
  const behindBand = (v) => { const off = Math.asin(Math.max(-1, Math.min(1, v.x))) / DEG, e = Math.atan2(v.y, -v.z) / DEG, sn = Math.sin(Math.max(0, Math.min(180, e)) * DEG), hw = 0.2 / Math.sqrt(sn * sn + 0.03); return Math.abs(off) < 2 * hw + 0.3; };      // (the band's own width law, BAND_GLSL)
  { const n = late ? 300 : 80, g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(2, 2), sd = new Float32Array(n * 4), sp = new Float32Array(n * 2), v = new THREE.Vector3(), star = skyDir(STAR_EL, STAR_AZ);
    g.index = q.index; g.setAttribute('position', q.getAttribute('position'));
    for (let i = 0; i < n; i++) {
      for (;;) { const y = 0.04 + 0.96 * S.stars(), a = S.stars() * 6.2832, r = Math.sqrt(1 - y * y); v.set(Math.cos(a) * r, y, Math.sin(a) * r); if (v.angleTo(star) > 9 * DEG && !behindBand(v)) break; }
      sd[i * 4] = v.x; sd[i * 4 + 1] = v.y; sd[i * 4 + 2] = v.z; sd[i * 4 + 3] = 0.25 + 0.75 * S.stars() ** 3; sp[i * 2] = S.stars() * 6.2832; sp[i * 2 + 1] = 0.8 + 2.4 * S.stars();
    }
    g.setAttribute('aStar', new THREE.InstancedBufferAttribute(sd, 4)); g.setAttribute('aTw', new THREE.InstancedBufferAttribute(sp, 2)); g.instanceCount = n;
    starTable = { dirs: sd, tw: sp, n };      // (the pool mirrors these same stars)
    add(g, skyMat({ ...ADD, uniforms: U, vertexShader: /* glsl */`
      attribute vec4 aStar; attribute vec2 aTw; uniform float uTime; varying vec2 vQ; varying float vB;
      void main(){ vec3 d = aStar.xyz, a = normalize(cross(d, vec3(0.,1.,.01))), b = cross(a, d); vQ = position.xy;
        vB = aStar.w * (.72 + .28*sin(uTime*aTw.y + aTw.x)) * smoothstep(.03,.2,d.y);
        vec4 p = projectionMatrix*modelViewMatrix*vec4((d + (a*position.x + b*position.y)*.0042)*${R}., 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p; }`,
      fragmentShader: /* glsl */`varying vec2 vQ; varying float vB;
      void main(){ float r2 = dot(vQ,vQ), px = max(fwidth(vQ.x), 1e-4), s = max(.3, 1.1*px);      // never smaller than a pixel across; its light is kept
        gl_FragColor = vec4(vec3(.74,.82,1.) * vB * 1.5 * exp(-r2/(s*s)) * (1. - smoothstep(.6, 1., sqrt(r2))) * pow(min(1., .3/s), 1.2), 1.); }` }), -0.98); }

  // ---- the far side: far land in its own daylight, a band of pearl in the vertical plane of the entry heading, through the zenith.
  // It is drawn by direction alone (e = height within that plane: 0 ahead, 90 overhead, 180 astern; off = angle off the plane), so it is
  // one smooth curve at every height. It has no edge, no base and no source. Its widths, its light and the glow it melts into are the
  // ONE LAW of the common part (BAND_GLSL), which the river's mirror and the pool's read too. Nothing moves along the band; the only
  // life is a shimmer of air in the glow.
  const mott = [S.mottle() * 50, S.mottle() * 50];
  add(bandPatch(44, -2, 182, 22, 72), skyMat({ ...PREMULT, uniforms: { ...U, uMott: { value: new THREE.Vector2(mott[0], mott[1]) } }, vertexShader: DIRV, fragmentShader: /* glsl */`
    float olaHash(vec2 p){ vec3 q = fract(vec3(p.xyx)*.1031); q += dot(q, q.yzx+33.33); return fract((q.x+q.y)*q.z); }
    float olaNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(olaHash(i), olaHash(i+vec2(1.,0.)), f.x), mix(olaHash(i+vec2(0.,1.)), olaHash(i+vec2(1.,1.)), f.x), f.y); }
    uniform float uLate, uTime; uniform vec2 uMott; varying vec3 vDir; ${BAND_GLSL}
    void main(){ vec3 d = normalize(vDir);
      float off = asin(clamp(d.x,-1.,1.)) * 57.29578, e = atan(d.y, -d.z) * 57.29578, el = asin(clamp(d.y,-1.,1.)) * 57.29578;      // degrees
      float hw = olaBandHW(e);                                                                     // half width, degrees
      float px = max(fwidth(off), 1e-4), w = max(hw, .8*px);                                       // never thinner than a pixel and a half; where it is widened its light is cut by as much
      float x = off/w, high = smoothstep(15., 60., min(e, 180. - e));
      float prof = olaBandProf(x, high, olaBandLow(e));                                                           // a ribbon: even across, soft edges, a little crisper high up
      // land seen from far: uneven mottling that the eye can see, in patches of unlike size along it (seas, lands and cloud: a degree
      // or so long, and three or four), still. It is never paler than pearl: its palest patch is the pearl itself, its darkest half that.
      float m = smoothstep(.22, .78, olaNoise(vec2(e*1.1, x*1.1) + uMott)*.5 + olaNoise(vec2(e*.3, x*.4) + uMott.yx)*.5);
      float lit = olaBandLit(e, uLate);
      vec3 pearl = mix(vec3(.66,.75,.95), vec3(.92,.86,.87), m) * (.5 + .5*m);
      float I = olaBandAxis(e, lit) * (hw/w) * prof;
      // its night side: a fifth of the light (BAND_GHOST in the law), blue-grey, with a very few pin lights of its own (each a point; where a point is under a
      // pixel and a half it is widened and its light cut by as much)
      vec2 pc = vec2(e*1.7, x*1.3 + 7.), ci = floor(pc), cf = fract(pc) - .5 - .3*(vec2(olaHash(ci + 3.1), olaHash(ci + 7.7)) - .5);
      float rr = max(.05, .9*px), pd = dot(cf*vec2(1./1.7, w/1.3), cf*vec2(1./1.7, w/1.3));
      float pin = exp(-min(pd/(rr*rr), 40.)) * (.05/rr)*(.05/rr) * step(.93, olaHash(ci)) * (1. - lit) * step(abs(x), .8) * smoothstep(1., 4., e);
      vec3 col = I * mix(vec3(.62,.7,1.), pearl, lit) + vec3(.95,.82,.6) * .5 * pin;
      // (the air about it aloft takes a little of its light, in the haze's blue, twice its width: it has no hard edge. Not below thirty
      // degrees: nothing wraps its foot.)
      vec3 haze = vec3(.30,.38,.84);
      col += haze * olaBandAxis(e, 1.) * (hw/w) * exp(-min(x*x*.38, 40.)) * .12 * smoothstep(12., 30., min(e, 180. - e)) * lit;
            // (it is land seen through the whole depth of the air: its light is added to the sky's own. No star shows through it: the
      // stars' table leaves out any star that stands behind it.)
      // the low level glow along the horizon (uneven as haze is, by a still pattern of its own; a faint shimmer of air)
      float shim = .94 + .06*olaNoise(vec2(off*.5 + uTime*.16, el*.9 - uTime*.06));
      float lump = .75 + .5*olaNoise(vec2(off*.13 + 3., el*.2) + uMott);
      col += haze * olaBandGlow(off, el, uLate) * lump * shim;
      gl_FragColor = vec4(col, 0.); }` }), -0.96);

  return finishSky(opts, group, add, U, starTable);
}

function finishSky(opts, group, add, U, starTable) {
  const { late, rare, highCloud, LU, streams: S } = opts;
  // ---- the new star: a hard point with glare and a soft round halo that is gone 2.4 degrees from it. Never a disc: the core is a point
  // spread (0.3 of a degree across at the most, and never under a pixel and a half), with no edge, shell, ring, ray or spike. One colour.
  { const g = new THREE.PlaneGeometry(2, 2), d = skyDir(STAR_EL, STAR_AZ), a = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 1, 0)).normalize(), b = new THREE.Vector3().crossVectors(a, d);
    const P = g.getAttribute('position'), half = Math.tan(3.2 * DEG), v = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) { v.copy(d).addScaledVector(a, P.getX(i) * half).addScaledVector(b, P.getY(i) * half).multiplyScalar(R); }
    const pos = new Float32Array(12), q = new Float32Array(8);
    for (let i = 0; i < 4; i++) { const x = P.getX(i), y = P.getY(i); v.copy(d).addScaledVector(a, x * half).addScaledVector(b, y * half).multiplyScalar(R); pos.set([v.x, v.y, v.z], i * 3); q.set([x * 3.2, y * 3.2], i * 2); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sg.setAttribute('aQ', new THREE.BufferAttribute(q, 2)); sg.setIndex(g.index);
    add(sg, skyMat({ ...ADD, uniforms: U, vertexShader: /* glsl */`attribute vec2 aQ; varying vec2 vQ;
      void main(){ vQ = aQ; vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p; }`,
      fragmentShader: /* glsl */`uniform float uStar; varying vec2 vQ;
      void main(){ float r = length(vQ), px = max(fwidth(vQ.x), 1e-4);                             // degrees from the point; a pixel in degrees
        float s = max(.075, .75*px);                                                               // the point's spread: 0.15 of a degree across, or a pixel and a half
        float k = clamp(uStar, 0., 1.), first = pow(k, .55);
        float core = 14. * first * exp(-r*r/(s*s));
        float glare = .8 * first * exp(-r/.15) + .4 * k * pow(clamp(1.-r/2.4, 0., 1.), 3.);      // (falling all the way from the point: never a disc)
        // THE HALO IS ROUND because all of it is the star's own: the point's light is held just under the level at which the picture's
        // own glow pass would spread it (that pass spreads a point over square cells, and the display's black point then draws the
        // square's outline round the star)
        gl_FragColor = vec4(vec3(.71,.80,1.) * 1.05 * (1. - exp(-(core + glare)/1.05)), 1.); }` }), -0.94); }

  // ---- cloud bars: three thin ragged ones low on the left (bearing -70 to -30), pearl beneath; on a high-cloud evening thin broken bars
  // above 24 degrees as well. They are streaks of thin vapour no darker than the sky they lie on, their ends and edges fraying away to
  // nothing: never a smooth dark body with an outline. None comes near the star (bearing 14, height 12) or the band's foot.
  // THE VAPOUR'S STREAKS ARE READ FROM A FIELD WITH NO CELLS (slopes dealt at the knots of a net, never values dealt in its squares)
  // and lie ALONG the bar, twice as long as deep: read from a field of squares they stood, from under on the climb, as blocks of
  // paler sky with the dark sky between them cut in ragged square patches. Cloud has soft edges at any size.
  { const bars = [];
    for (let k = 0; k < 3; k++) bars.push({ az: -68 + 13 * k + S.clouds.range(-3, 3), el: S.clouds.range(5.5, 11), w: S.clouds.range(15, 25), h: S.clouds.range(0.8, 1.4), sd: S.clouds() * 40 });
    if (highCloud) for (let k = 0; k < 9; k++) { const side = k % 2 ? 1 : -1; bars.push({ az: side * S.clouds.range(9, 62), el: S.clouds.range(24, 62), w: S.clouds.range(22, 38), h: S.clouds.range(1.7, 3.1), sd: S.clouds() * 40 }); }
    const pos = [], uv = [], sdv = [], idx = [], v = new THREE.Vector3(), NA = 10;
    for (const b of bars) { const base = pos.length / 3;
      for (let j = 0; j <= 2; j++) for (let i = 0; i <= NA; i++) { skyDir(b.el + b.h * (j - 1), b.az + b.w * (i / NA - 0.5) / Math.cos(b.el * DEG), v); pos.push(v.x * R, v.y * R, v.z * R); uv.push(i / NA, j / 2); sdv.push(b.sd, b.w / b.h); }
      for (let j = 0; j < 2; j++) for (let i = 0; i < NA; i++) { const a = base + j * (NA + 1) + i; idx.push(a, a + 1, a + NA + 1, a + 1, a + NA + 2, a + NA + 1); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aSd', new THREE.Float32BufferAttribute(sdv, 2)); g.setIndex(idx);
    add(g, skyMat({ ...PREMULT, uniforms: U, vertexShader: /* glsl */`attribute vec2 aSd; varying vec2 vUv, vSd; varying float vY;
      void main(){ vUv = uv; vSd = aSd; vY = normalize(position).y; vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p; }`,
      fragmentShader: /* glsl */`uniform float uStar, uTime, uLate; varying vec2 vUv, vSd; varying float vY;
      float h2(vec2 p){ vec3 q = fract(vec3(p.xyx)*.1031); q += dot(q, q.yzx+33.33); return fract((q.x+q.y)*q.z); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p), u = f*f*f*(f*(f*6. - 15.) + 10.);
        vec4 a = 6.2831853 * vec4(h2(i), h2(i + vec2(1.,0.)), h2(i + vec2(0.,1.)), h2(i + vec2(1.,1.)));
        vec4 d = cos(a)*vec4(f.x, f.x - 1., f.x, f.x - 1.) + sin(a)*vec4(f.y, f.y, f.y - 1., f.y - 1.);
        return clamp(.5 + mix(mix(d.x, d.y, u.x), mix(d.z, d.w, u.x), u.y), 0., 1.); }
      void main(){ vec2 q = vUv*2.-1.; float asp = max(vSd.y, 1.);
        vec2 p = vec2(vUv.x*asp*.45 + vSd.x + uTime*.006, vUv.y*1.6 + vSd.x*.37);                  // the bars slide slowly along themselves
        float n = n2(p)*.45 + n2(p*vec2(2.7,3.1) + 11.)*.33 + n2(p*vec2(6.3,5.1) + 23.)*.22;       // streaks along the bar, finer and finer
        float ex = clamp(1.-q.x*q.x, 0., 1.), ey = clamp(1.-q.y*q.y, 0., 1.);
        // A CLOUD HAS NO EDGE: it is thickest along its middle and thins to nothing well inside its patch of sky, across and along, by one
        // smooth bell with no level at which a body begins; the streaks of vapour in it only thin it further. (It was a body cut out at
        // one level of that bell and filled to an even 0.55: from under it, on the climb, a flat pane with a rim.)
        float bell = ex*ex * ey*ey*ey;
        float a = bell * (.2 + .8*smoothstep(.25, .8, n)) * .36;                                    // thin: the sky and its stars show through
        float under = (1. - smoothstep(-.9, .3, q.y));                                                     // pearl beneath, from the far side's light
        vec3 c = vec3(.034,.042,.08) + vec3(.11,.115,.145)*under*mix(1., .6, uLate) + vec3(.71,.80,1.)*.06*uStar*smoothstep(.25,.6,vY+.4);
        gl_FragColor = vec4(c*a, a); }` }), -0.92); }

  // ---- the plate's edge range: a strip across the bearings -60 to +60, two and a half degrees tall, snow on its upper half. It takes a
  // cool top from the thread and its snow goes silver with the star.
  { const g = patch(-78, 78, -0.6, 3.4, 96, 2), rs = S.range() * 100;
    add(g, skyMat({ ...PREMULT, uniforms: { ...U, uSeed: { value: rs } }, vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p; }`,
      fragmentShader: /* glsl */`uniform vec3 uFogCol; uniform float uStar, uSeed, uLate; varying vec2 vUv;
      float h1(float p){ p = fract(p*.1031); p *= p+33.33; p *= p+p; return fract(p); }
      float n1(float x){ float i = floor(x), f = fract(x); f = f*f*(3.-2.*f); return mix(h1(i), h1(i+1.), f); }
      float ridge(float x){ float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a*(1.-abs(2.*n1(x)-1.)); x = x*2.13+7.1; a *= .5; } return s; }
      void main(){ float az = (vUv.x-.5)*156., el = -.6 + 4.*vUv.y;
        float env = (1. - smoothstep(52., 72., abs(az)));
        // (under the far side's thread, at bearing 0, the skyline is low and even for a few degrees to either hand: the thread
        // stands beyond the range and must never seem to rise from a summit of it)
        float calm = smoothstep(3., 10., abs(az));
        float rg = ridge(az*.085 + uSeed), sky = (.55 + 2.3*rg*rg*calm) * env;                      // the skyline's height, degrees: peaks and low saddles, never one level
        float aa = max(fwidth(el), .03), a = (1. - smoothstep(sky-aa, sky+aa, el));
        float snowLine = sky*.5 + .25*n1(az*.9+uSeed*3.) - .1;
        float snow = smoothstep(snowLine-.25, snowLine+.4, el);
        float facet = .55 + .45*n1(az*2.3 + el*6. + uSeed);                                         // which slopes face the light
        vec3 rock = uFogCol*.7, sn = rock*1.1 + vec3(.71,.80,1.)*(.03*mix(1., .6, uLate) + .15*uStar*facet);
        vec3 c = mix(rock, sn, snow);
        c = mix(c, uFogCol*1.5, .3 + .6*(1. - smoothstep(0., 1.3, el)));                                   // its foot melts into the plain's haze
        // before it, two layers of low rises, crest behind crest, each nearer one a shade deeper: the country goes back into the haze in
        // layers and nothing rules a line under the range
        float h2 = (.28 + (.5*n1(az*.21 + uSeed*1.7) + .22*n1(az*.67 + 3.)) * mix(.25, 1., calm)) * env, a2 = (1. - smoothstep(h2-aa, h2+aa, el));
        float h1 = (.02 + (.38*n1(az*.13 + uSeed*2.9 + 5.) + .16*n1(az*.51 + 9.)) * mix(.4, 1., calm)) * env, a1 = (1. - smoothstep(h1-aa, h1+aa, el));
        vec3 far2 = uFogCol*1.42 + vec3(.71,.80,1.)*.02*uStar, far1 = uFogCol*1.2;
        c = mix(c, far2, a2); a = max(a, a2); c = mix(c, far1, a1); a = max(a, a1);
        gl_FragColor = vec4(c*a, a); }` }), -0.9); }

  // ---- the rare evening: slow, silent, pale meteors in ones to threes with long gaps, far and low ahead, on a seeded clock; never within
  // seven degrees of the star's bearing (no trail crosses the star, or the thread). A WEATHER OF THAT SKY: they come at this one sparse rate for the whole flight, whatever the
  // flight does; none crosses the star.
  if (rare) {
    const n = 3, A = new Float32Array(n * 4), B = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { const left = S.meteors() < 1 / 2, az = left ? S.meteors.range(-58, -10) : S.meteors.range(STAR_AZ + 14, 60), el = S.meteors.range(9, 19);
        A.set([az, el, S.meteors.range(-7, 7), S.meteors.range(-5.5, -2.5)], i * 4); B.set([S.meteors.range(11, 19), S.meteors() * 19, S.meteors.range(3.2, 4.6), 0], i * 4); }
    const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(2, 2);
    g.index = q.index; g.setAttribute('position', q.getAttribute('position'));
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4)); g.instanceCount = n;
    add(g, skyMat({ ...ADD, uniforms: U, vertexShader: /* glsl */`attribute vec4 aA, aB; uniform float uTime; varying vec2 vQ; varying float vK;
      vec3 dirOf(float el, float az){ el *= .0174533; az *= .0174533; return vec3(sin(az)*cos(el), sin(el), -cos(az)*cos(el)); }
      void main(){ float ph = fract((uTime + aB.y)/aB.x) * aB.x / aB.z, live = step(ph, 1.);       // one slow fall, then a long gap
        vec2 head = aA.xy + aA.zw*ph, tail = head - aA.zw*.34;
        vec3 h = dirOf(head.y, head.x), t = dirOf(tail.y, tail.x), side = normalize(cross(h, t) + vec3(0.,1e-5,0.));
        vQ = position.xy; vK = live * sin(3.14159*clamp(ph,0.,1.));
        vec3 d = mix(t, h, position.x*.5+.5) + side*position.y*.0016;
        vec4 p = projectionMatrix*modelViewMatrix*vec4(d*${R}., 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p; }`,
      fragmentShader: /* glsl */`varying vec2 vQ; varying float vK;
      void main(){ float along = clamp(vQ.x*.5+.5, 0., 1.), w = max(fwidth(vQ.y), 1e-4), s = max(.5, w);
        float a = along*along * exp(-vQ.y*vQ.y/(s*s)) * min(1., .5/s);
        gl_FragColor = vec4(vec3(.80,.95,.90) * .42 * a * vK, 1.); }` }), -0.93);
  }

  const cam = new THREE.Vector3();
  return { group, uniforms: U, stars: starTable,
    // camera: whatever camera draws this frame
    update(time, camera) { camera.getWorldPosition(cam); group.position.copy(cam); } };
}
