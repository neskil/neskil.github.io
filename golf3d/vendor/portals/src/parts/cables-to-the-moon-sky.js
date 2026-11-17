// CABLES TO THE MOON: the sun, the Moon, the band of gold air, and the high cloud bars with the far storms' veils.
// Four far-plane pieces carried by whichever camera draws them (they use only the rotation of the view matrix, so
// they are right through a portal too). The sun is a disc with a surface: granulation, a darkened limb, a corona. The Moon is netted all over in thread. The band of air lies on the exact limb of the sphere
// the forest is bent over (see the common file), so the gold never parts from the green edge.
import * as THREE from 'three';
import { CM_GLSL, withShared, C, DEG, STEAM_DIM } from './cables-to-the-moon-common.js';

const FAR_VERT = /* glsl */`
uniform vec3 uDir; uniform vec2 uSize;        // centre direction; tangent of the radius, extent of the quad in radii
varying vec2 vUv; varying vec3 vDir;      // (vDir: the direction of the point on the sky: the Moon reads its height)
void main(){
  vUv = position.xy*uSize.y;
  vec3 f = normalize(uDir);
  vec3 r = cross(f, vec3(0.0, 1.0, 0.0)); r /= max(length(r), 1e-4);
  vec3 up = cross(r, f);
  vec3 dir = f + (r*vUv.x + up*vUv.y)*uSize.x; vDir = dir;
  vec4 p = projectionMatrix*vec4(mat3(viewMatrix)*dir, 1.0);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`;

const SUN_FRAG = /* glsl */`
uniform vec3 uCore, uLimb, uCorona; uniform vec4 uSunP; uniform vec3 uVeil;      // radiance, veil 0..1, -, seed; the sky's colour round the sun (the veil's bands take it)
varying vec2 vUv;
${CM_GLSL}
void main(){
  float r = length(vUv), fw = fwidth(r) + 1e-5;
  float disc = 1.0 - smoothstep(1.0 - fw, 1.0 + fw, r);
  float mu = sqrt(max(1.0 - r*r, 0.0));
  // slow granulation: fine cells that boil and a faint larger mottle; no pores, no patches (it must never read as
  // a moon's seas)
  vec2 q = vUv*(1.0 + 0.18*(1.0 - mu));
  float g = cmN3(vec3(q*26.0, uTime*0.22 + uSunP.w)) - 0.5;
  float m = cmF3(vec3(q*5.5 + 3.1, uTime*0.045)) - 0.5;
  vec3 col = mix(uLimb, uCore, pow(max(mu, 0.0), 0.55));
  col *= 1.0 + 0.12*g + 0.1*m;
  col *= uSunP.x*(0.5 + 0.5*pow(max(mu, 0.0), 0.5));
  // everything off the limb is centred on the one disc and fades to nothing well inside the quad
  float off = max(r - 1.0, 0.0), edge = 1.0 - smoothstep(1.1, 1.55, off);
  // (no prominences: a tongue of fire on the limb read as a lump on the disc. The sun's edge is its own round
  // limb, with the chromosphere and the corona outside it)
  vec3 add = vec3(0.0);
  // the chromosphere hugging the limb, and the corona: soft
  // (mend R, V3: ONE CORONA AT EVERY HEIGHT. It took the limb's colour, and the limb reddens as the air
  // thins: high up, on the dark sky, it was a ring of dark red round the disc. It keeps the colour the
  // visit's sun has at the leaves (uCorona), at every height: a soft warm glow, light added and nothing else.)
  // (mend T, T3: THE SUN KEEPS A GLOW OF ITS OWN AT EVERY HEIGHT, NARROW: the chromosphere on the limb and a
  // soft glow that is a twentieth of its limb's value a third of the disc's radius out (e to the minus 9
  // radii; it had the same strength at the limb and reached a radius and more, in streams: no stream now,
  // nothing that could read as a ray; 0.42 was tried: a bright ring round the disc by day). Its own colour at the leaves, light added and nothing else; the broad glow low
  // in the air is the dome's own, which thins with height as it did.)
  add += uCorona*uSunP.x*(0.5*exp(-off*30.0) + 0.2*exp(-off*9.0))*(1.0 - disc)*edge;
  // a veil of high seed softens it all, and lies across it in level bands of haze that drift
  col = mix(col, uCore*uSunP.x*0.55, uSunP.y*0.75);
  float bands = smoothstep(0.35, 0.75, cmF(vec2(vUv.x*0.7 + uTime*0.01 + uSunP.w, vUv.y*5.0)));
  col = mix(col, uVeil.rgb*1.05, uSunP.y*0.55*bands);
  add *= 1.0 - 0.6*uSunP.y;
  // (round Q, R5: NOTHING ROUND THE DISC IS PAINTED OVER THE SKY. A patch of 'the sky's colour near the sun' lay
  // round it here to hide the stars in its glare, whole where the air is thin: but the dome behind it carries
  // its own glow round the sun, lighter than that one colour, so the patch stood on it as a dark ring that
  // grew with height. Off the disc this adds light only (the chromosphere and the corona) and covers nothing.)
  gl_FragColor = vec4(col*disc + add, disc);
}`;

// THE MOON IS IN THE SKY, NOT ON IT (mend S). ONE LAW at every hour and on every deal:
//   what is seen = the sky's own colour at that point of the Moon (the dome's three colours by the point's
//   height, the dome's own sum) + 0.9 of the lit face x how much of its light comes through the air.
//   THE AIR: uMoonAir, the share that comes through the air over the eye (the world file's MOON_AIR by the
//   sky's one declared pacing: 0.11 at the leaves, 1 at the ring's rim), times the air low on the sky: within
//   25 degrees of the world's edge it lets through less, down to 0.4 of that on the edge itself (a rule of the
//   sky: the point's own height over the limb; mend S2, said as it is: THIS RULE IS THERE AND NEARLY IDLE: the
//   Moon stands 31 degrees up, so its foot lets through 0.984 of what its middle does). So BY DAY the Moon is the sky's colour warmed, a little
//   lighter than the sky round it, its seas and its net hardly telling; it comes out as the sky goes to rose
//   and violet, and above the air it is the bright webbed thing it was (0.9 of mend R's face on the night's
//   own sky: not brighter than it was).
//   THE LIGHT is this visit's sun (uSunTint: three tenths of the way from white to the sun's own colour, greyed
//   by its veil): cream gold beside the gold sun, rosier beside the red, ash beside the veiled.
//   THE UNLIT PART is the sky behind it, as it was. THE FACE is this book's Moon: large soft seas, the pale
//   grey-green growth in broad patches, the great cables of the net from knot to knot and one finer mesh in
//   patches (the finest mesh and the speckle, which read as craters, are gone).
const MOON_FRAG = /* glsl */`
uniform vec3 uAsh, uMare, uGreen, uNet, uLight, uSunTint, uSkyZ, uSkyM, uSkyH, uAxis;
uniform vec4 uMoonP, uLimbP, uSkyG, uSkyG2;   // -, green 0..1, net brightness, seed; the band's limb; the dome's powers
uniform float uMoonAir;
varying vec2 vUv; varying vec3 vDir;
${CM_GLSL}
// distance to the nearest edge of a cell pattern, and the distance to the nearest knot
vec2 web(vec2 p){
  vec2 n = floor(p), f = fract(p), mg = vec2(0.0), mr = vec2(0.0); float md = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)), o = cmH2(n + g + uMoonP.w), r = g + o - f; float d = dot(r, r);
    if (d < md) { md = d; mr = r; mg = g; }
  }
  float ed = 8.0, kd = 8.0;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 g = mg + vec2(float(i), float(j)), o = cmH2(n + g + uMoonP.w), r = g + o - f; vec2 dr = r - mr;
    float l2 = dot(dr, dr);
    if (l2 > 1e-5) { float e = dot(0.5*(mr + r), dr/sqrt(l2)); if (e < ed) { kd = min(kd, max(ed, e)); ed = e; } else kd = min(kd, e); }
  }
  return vec2(ed, kd);
}
void main(){
  float r = length(vUv), fw = fwidth(r) + 1e-5;
  // (mend R, V4: THE MOON'S LIMB IS SOFT, at every height: the outer twelfth of its radius goes out into the
  // sky in front of it, so it has no hard edge and no rim on a plain sky. Its size and its place are as they were.)
  float disc = 1.0 - smoothstep(0.915 - fw, 1.0, r);
  float z = sqrt(max(1.0 - r*r, 0.0));
  vec3 n = vec3(vUv, z);
  vec2 sp = vUv/(1.0 + z);                                    // stereographic: the net keeps its mesh to the limb
  float pw = fwidth(sp.x) + fwidth(sp.y) + 1e-5;
  // ashen cream, LARGE SOFT SEAS (four or five across the face), the pale grey-green growth in broad patches
  float mare = smoothstep(0.4, 0.8, cmF(sp*2.1 + uMoonP.w));
  float blot = smoothstep(0.34, 0.7, cmF(sp*2.7 - 11.0 + uMoonP.w*2.0));                // the green has spread over most of it
  vec3 alb = mix(uAsh, uMare, mare*0.6);
  alb = mix(alb, uGreen*(0.88 + 0.24*cmN(sp*9.0)), blot*uMoonP.y);
  float ndl = dot(n, normalize(uLight));
  float lit = smoothstep(-0.08, 0.3, ndl)*(0.45 + 0.55*clamp(ndl, 0.0, 1.0));
  lit *= 0.72 + 0.28*z;                                       // a darkened limb
  vec3 col = alb*uSunTint*(lit*0.95 + 0.03);
  // the net: GREAT CABLES of thread from knot to knot (they show as soon as the Moon is a hand across) and one
  // finer mesh between them in patches, glints sliding along the cables
  // (nothing spun is even: the mesh is pulled about, and each size of it lies in patches)
  vec2 wp = sp + 0.11*(vec2(cmN(sp*2.6 + 7.0 + uMoonP.w), cmN(sp*2.6 + 19.0 + uMoonP.w)) - 0.5);
  vec2 w0 = web(wp*3.7 + 2.0), w1 = web(wp*13.0);
  // (the great cables: a mesh of seven across the face, each cable 0.016 of its mesh across and 0.05 at a
  // knot: one to four pixels of a Moon 170 pixels across; they come and go in long reaches, below, so the
  // face is never a honeycomb)
  float th0 = 0.016 + 0.034*(1.0 - smoothstep(0.0, 0.25, w0.y)), th1 = 0.012 + 0.03*(1.0 - smoothstep(0.0, 0.2, w1.y));
  float p0 = pw*3.7, p1 = pw*13.0;
  float l0 = mix(clamp((th0 - w0.x)/max(p0, 1e-4) + 0.5, 0.0, 1.0), min(th0*3.2, 1.0), smoothstep(0.1, 0.5, p0));
  float l1 = mix(clamp((th1 - w1.x)/max(p1, 1e-4) + 0.5, 0.0, 1.0), min(th1*3.2, 1.0), smoothstep(0.1, 0.5, p1))*0.55;
  float glint = pow(clamp(0.5 + 0.5*sin(dot(sp, vec2(31.0, 17.0)) - uTime*0.9 + 6.0*cmN(sp*4.0)), 0.0, 1.0), 6.0)*(1.0 - smoothstep(0.1, 0.5, p0));
  l0 *= 0.15 + 0.85*smoothstep(0.34, 0.6, cmN(sp*1.9 + 5.0 + uMoonP.w));
  l1 *= smoothstep(0.38, 0.66, cmN(sp*3.3 + 40.0 + uMoonP.w));
  float net = max(l0, l1);
  // the thread is A LITTLE PALER THAN THE FACE IT LIES ON, silver-green: the face's own colour there gone
  // 0.45 of the way to the lit thread's (mend R, G2: it was the thread's colour itself, five times the green's
  // brightness: a heavy white net). One law on every deal, at every height; no net stands on the limb's edge.
  // (mend S: and NEVER MORE THAN 1.6 TIMES AS LIGHT AS THE FACE UNDER IT: on the green growth, a darker ground,
  // the lit thread's colour was two to three times the face's and the net stood on it as white lines.
  // Mend S2, said as it is: THE CAP IS TAKEN BEFORE THE GLINT, which then multiplies it by up to 1.5 on the
  // fully lit face: at a glint's peak a thread is drawn about 2.1 times the face under it (the reader's
  // count), 1.6 times everywhere else. Not changed in this mend.)
  vec3 nc = mix(col, uNet*(0.3 + 0.75*lit)*uMoonP.z, 0.45);
  nc *= min(1.0, 1.6*dot(col, vec3(0.3, 0.5, 0.2))/max(dot(nc, vec3(0.3, 0.5, 0.2)), 1e-4))*(1.0 + 0.5*glint*lit);
  col = mix(col, nc, net*0.8*smoothstep(0.0, 0.3, z));
  // THE UNLIT PART OF THE MOON IS NOT SEEN: it is the sky behind it, at every height. Its face and its net show
  // only where the sun lights them; nothing stands off its limb (mend P, Q6: no halo, a clean lit limb).
  float body = clamp(lit*1.4, 0.0, 1.0);
  float a = disc*body;
  // THROUGH THE AIR (the law at the head of this shader): the sky's own colour at this point of the Moon, and
  // on it what of the lit face comes through
  vec3 d = normalize(vDir); float inv = 1.0 - clamp(d.y, 0.0, 1.0);
  vec3 sky = mix(mix(uSkyZ, uSkyM, pow(inv, uSkyG2.x)), uSkyH, pow(inv, uSkyG.x));
  float e = acos(clamp(dot(d, uAxis), -1.0, 1.0)) - uLimbP.x;                 // the point's height over the world's edge
  float through = uMoonAir*mix(0.4, 1.0, smoothstep(0.0, 0.436, e));
  col = sky + 0.9*through*col;
  gl_FragColor = vec4(col*a, a);
}`;

// the band of air on the limb. uAxis: unit vector from the eye to the centre of the sphere the forest lies on;
// uLimb: (angle between that axis and the limb, height of the band in radians, strength, how far the sun side is brighter)
const BAND_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; vec4 p = projectionMatrix*vec4(mat3(viewMatrix)*position, 1.0); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const BAND_FRAG = /* glsl */`
uniform vec3 uAxis, uBandCol; uniform vec4 uLimbP;
varying vec3 vDir;
${CM_GLSL}
void main(){
  vec3 d = normalize(vDir);
  float e = acos(clamp(dot(d, uAxis), -1.0, 1.0)) - uLimbP.x;           // angle above the limb
  vec2 hd = d.xz/max(length(d.xz), 1e-4), sd = uSunDir.xz/max(length(uSunDir.xz), 1e-4);
  float sun = 0.5 + 0.5*dot(hd, sd);
  float below = 1.0 - smoothstep(-0.004, 0.004, e);
  // heat shimmer: the band's top edge wavers
  float az = atan(d.x, -d.z + 1e-6);
  float wav = 0.0012*sin(az*37.0 + uTime*1.3) + 0.0008*sin(az*83.0 - uTime*2.1);
  float x = max(e + wav, 0.0)/max(uLimbP.y, 1e-3);
  // THE WORLD'S EDGE HAS NO LINE (mend P): on the limb and under it the far plane is the sky's own colour at
  // the horizon (uLandAir, mend S: the land's own lit air, the colour the far land has gone into), whole at the limb and
  // thinning upward to an UNEVEN top (by bearing, 0.4 of a band height to about two), so the sky comes down
  // into the land softly at every height of the eye; no strength of it goes by the eye.
  // (mend S: uneven in BROAD REACHES of bearing, 20 to 40 degrees long. It was uneven every 3 to 6 degrees:
  // unseen while the band was the sky's own colour, but the lit air of the land under a violet sky showed it
  // as upright rays over the world's edge.)
  float lift = 0.4 + 2.2*cmF(hd*1.6 + 11.0)*cmF(hd*3.1 + 2.0);
  float band = exp(-x*2.4/lift);
  vec3 steam = uBandCol*${STEAM_DIM.toFixed(2)}*(1.0 + 0.16*sun*sun*sun);
  vec3 col = uLandAir;
  // LONG LOW TORN BANKS OF STEAM lie on the forest at the world's edge (G3 a): by bearing, long along the edge,
  // thin, torn, drifting slowly, just over the limb and never standing up in the sky; the steam's own colour (0.7
  // of the haze's: the common part's STEAM_DIM), a sixth brighter toward the sun.
  float torn = smoothstep(0.46, 0.7, cmF(vec2(az*5.0 + uTime*0.0015, x*7.0) + 7.0) + 0.3*(cmF(vec2(az*31.0, x*17.0) + 3.0) - 0.5))*exp(-x*x*9.0);
  col = mix(col, steam, 0.55*torn*(1.0 - below));
  float a = clamp(max(below, max(band, 0.8*torn)), 0.0, 1.0);
  gl_FragColor = vec4(col*a, a);
}`;

// HIGH CLOUD AND FAR STORMS (sky: painted on the far plane, by rules of the sky). A few long thin bars of high
// cloud lie level between 5 and 22 degrees over the world's edge, uneven, lit from beneath by the low sun (warm
// along their under edge, brightest toward the sun). Far seed storms stand on the world's edge as slanting pale
// veils, four of them at bearings of the visit's own, leaning down the wind. uCloudP: how much of both shows
// (the thick air's share at the eye: the sky's declared pacing), the visit's number, the wind's lean.
const CLOUD_FRAG = /* glsl */`
uniform vec3 uAxis, uCloudLit, uCloudShade; uniform vec4 uLimbP, uCloudP; uniform float uSunA;
varying vec3 vDir;
${CM_GLSL}
void main(){
  vec3 d = normalize(vDir);
  float e = acos(clamp(dot(d, uAxis), -1.0, 1.0)) - uLimbP.x, ed = e*57.29578;       // degrees above the world's edge
  vec2 hd = d.xz/max(length(d.xz), 1e-4), sd = uSunDir.xz/max(length(uSunDir.xz), 1e-4);
  float sun = 0.5 + 0.5*dot(hd, sd), sd0 = uCloudP.y;
  // bars: long in bearing (about 25 degrees), thin in height (a degree or two)
  vec3 q = vec3(hd*2.3 + sd0, ed*0.42 + sd0*3.0);
  float n1 = cmF3(q), n2 = cmF3(q - vec3(0.0, 0.0, 0.25));
  float few = smoothstep(0.42, 0.62, cmN3(vec3(hd*1.1 + 7.0 + sd0, ed*0.07)));
  float bar = smoothstep(0.54, 0.66, n1)*few*smoothstep(4.0, 8.0, ed)*(1.0 - smoothstep(16.0, 23.0, ed));
  // (mend T, T4, the guard's limit: NO CLOUD LIES ACROSS THE SUN'S FACE. A bar ends short of the sun: nothing of
  // it within 1.15 of the disc's own radius of the sun's middle, whole past 1.9 of it: a rule of the sky)
  bar *= smoothstep(1.15*uSunA, 1.9*uSunA, acos(clamp(dot(d, normalize(uSunDir)), -1.0, 1.0)));
  float lit = clamp(0.35 + 9.0*(n1 - n2), 0.0, 1.0);
  vec3 col = mix(uCloudShade, uCloudLit*(0.8 + 0.6*sun*sun*sun), lit);
  float a = bar*0.8*uCloudP.x;
  // veils
  float az = atan(d.x, -d.z + 1e-6), veil = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i), a0 = 6.2831853*cmH(vec2(fi*3.7 + sd0, 1.3)), wd = 0.035 + 0.05*cmH(vec2(fi, 5.1 + sd0)), top = 0.05 + 0.07*cmH(vec2(fi, 9.7 + sd0));
    float x = az - a0 - uCloudP.z*e*1.6; x -= 6.2831853*floor(x/6.2831853 + 0.5);
    float streak = 0.55 + 0.45*cmN(vec2(x*160.0 + fi*9.0, e*50.0 - uTime*0.15));
    veil = max(veil, exp(-x*x/(wd*wd))*(1.0 - smoothstep(0.3*top, top, e))*smoothstep(-0.004, 0.006, e)*streak);
  }
  float av = veil*0.5*uCloudP.x;
  col = mix(col, uHazeCol*0.8, av/max(a + av, 1e-4));                 // (a far storm's veil is the steam's kin: under white)
  a = clamp(a + av, 0.0, 1.0);
  gl_FragColor = vec4(col*a, a);
}`;

export function makeHeavens(ctx, shared, o = {}) {
  const U = shared.U, group = new THREE.Group(); group.name = 'heavens';
  const quad = new THREE.PlaneGeometry(2, 2);
  const mk = (frag, own, order) => {
    const m = new THREE.Mesh(quad, new THREE.ShaderMaterial({ uniforms: withShared(U, own), vertexShader: FAR_VERT, fragmentShader: frag, transparent: true, premultipliedAlpha: true, depthWrite: false, depthTest: true, fog: false }));
    m.frustumCulled = false; m.renderOrder = order; group.add(m); return m;
  };
  // ---- the sun
  const sunR = (o.sunRadius ?? 7.5) * DEG;
  const sunU = { uDir: { value: shared.sunDir.clone() }, uSize: { value: new THREE.Vector2(Math.tan(sunR), 2.6) },
    uCore: { value: C(o.sunCore ?? '#FFDC7A') }, uLimb: { value: C(o.sunLimb ?? '#F08A24') },
    uSunP: { value: new THREE.Vector4(o.sunRadiance ?? 3.5, o.veil ?? 0, 0, o.seed ?? 0) }, uVeil: { value: new THREE.Vector3(0, 0, 0) },
    uCorona: { value: C(o.sunLimb ?? '#F08A24') } };
  const sun = mk(SUN_FRAG, sunU, -0.9); sun.name = 'sun';
  // ---- the Moon
  // its direction is the world's (o.moonDir); it is lit from where the sun really stands beside it on the sky, and
  // o.moonPhase says how much of the lit side is turned to us (-1 new .. 1 full)
  const md = (o.moonDir ? o.moonDir.clone() : new THREE.Vector3(0, Math.sin(24 * DEG), -Math.cos(24 * DEG))).normalize();
  const mr = new THREE.Vector3().crossVectors(md, new THREE.Vector3(0, 1, 0)).normalize(), mu = new THREE.Vector3().crossVectors(mr, md);
  const lx = shared.sunDir.dot(mr), ly = shared.sunDir.dot(mu), ll = Math.hypot(lx, ly) || 1, ph = o.moonPhase ?? 0.55, side = Math.sqrt(Math.max(1 - ph * ph, 0));
  // ONE SIZE for the whole visit (o.moonRadius, degrees of radius)
  // (mend S) lit by this visit's sun: three tenths of the way from white to the sun's own colour, greyed by its veil
  const tint = new THREE.Color(1, 1, 1).lerp(C(o.sunLight ?? '#FFDC7A'), 0.3), tl = 0.2126 * tint.r + 0.7152 * tint.g + 0.0722 * tint.b;
  tint.lerp(new THREE.Color(tl, tl, tl), o.sunVeil ?? 0);
  // the band of air's two uniforms are the Moon's too (the world's edge: the Moon reads its own height over it)
  const bandU = { uAxis: { value: new THREE.Vector3(0, -1, 0) }, uBandCol: { value: C('#F2DC9A') }, uLimbP: { value: new THREE.Vector4(Math.PI / 2, 6 * DEG, 0, 0.5) } };
  // the dome's own colours and powers (o.skyU: the kit sky's uniforms, the very objects the sky's law fills)
  const sk = o.skyU || { uZenith: { value: C('#D8C27A', 0.64) }, uMid: { value: C('#E6D48C', 0.76) }, uHorizon: { value: C('#F6E8B4', 0.92) }, uGrad: { value: new THREE.Vector4(2.6, 0, 0, 0) }, uGrad2: { value: new THREE.Vector4(1.3, 0, 0, 0) } };
  const moonU = { uDir: { value: md }, uSize: { value: new THREE.Vector2(Math.tan((o.moonRadius ?? 7.5) * DEG), 1.3) },
    uAsh: { value: C('#DCD4B2') }, uMare: { value: C('#8E8A70') }, uGreen: { value: C(o.moonGreen ?? '#8C9A7C') }, uNet: { value: C('#C4DCC0', 1.1) },
    uLight: { value: new THREE.Vector3(lx / ll * side, ly / ll * side, ph) }, uSunTint: { value: tint },
    uSkyZ: sk.uZenith, uSkyM: sk.uMid, uSkyH: sk.uHorizon, uSkyG: sk.uGrad, uSkyG2: sk.uGrad2, uAxis: bandU.uAxis, uLimbP: bandU.uLimbP, uMoonAir: { value: 1 },
    uMoonP: { value: new THREE.Vector4(0, o.moonGreenAmount ?? 0.75, o.netGain ?? 1, (o.seed ?? 0) * 7.0) } };
  const moon = mk(MOON_FRAG, moonU, -0.8); moon.name = 'moon';
  // ---- the band of air
  const band = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.ShaderMaterial({ uniforms: withShared(U, bandU), vertexShader: BAND_VERT, fragmentShader: BAND_FRAG, transparent: true, premultipliedAlpha: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide, fog: false }));
  band.frustumCulled = false; band.renderOrder = -0.7; band.name = 'air-band'; group.add(band);

  // ---- high cloud and far storms: the same far box, drawn over the sun and the Moon and under the band of air
  const cloudU = { uSunA: { value: (o.sunRadius ?? 7.5) * DEG }, uAxis: bandU.uAxis, uLimbP: bandU.uLimbP, uCloudP: { value: new THREE.Vector4(1, (o.seed ?? 0) * 13.0, o.windLean ?? 1, 0) },
    uCloudLit: { value: C(o.cloudLit ?? '#FFD79A', 1.05) }, uCloudShade: { value: C(o.cloudShade ?? '#B89A8E', 0.9) } };
  const cloud = new THREE.Mesh(band.geometry, new THREE.ShaderMaterial({ uniforms: withShared(U, cloudU), vertexShader: BAND_VERT, fragmentShader: CLOUD_FRAG, transparent: true, premultipliedAlpha: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide, fog: false }));
  cloud.frustumCulled = false; cloud.renderOrder = -0.75; cloud.name = 'high-cloud'; group.add(cloud);
  const cp = new THREE.Vector3(), cc = new THREE.Vector3();
  const core0 = sunU.uCore.value.clone(), limb0 = sunU.uLimb.value.clone(), coreHi = core0.clone().lerp(C('#FFF2C8'), 0.2), limbHi = C('#D8401A'), veil0 = sunU.uSunP.value.y, rad0 = sunU.uSunP.value.x;
  return {
    object: group, sunU, moonU, bandU, cloudU, moonDir: md,
    // st.roofY: the level of the roof at the sphere's top. The Moon keeps its size and its face for the whole
    // visit; st.moonAir is how much of its light comes through the air over the eye (the world file's law)
    update(camera, st) {
      if (st.moonAir !== undefined) moonU.uMoonAir.value = st.moonAir;
      // the high cloud and the far storms belong to the thick air: st.cloud is its share at the eye; the cloud's
      // shaded side is the sky's own colour, a little darker
      if (st.cloud !== undefined) cloudU.uCloudP.value.x = st.cloud;
      if (st.skyNearSun) cloudU.uCloudShade.value.copy(st.skyNearSun).multiplyScalar(0.78);
      if (st.skyNearSun) sunU.uVeil.value.set(st.skyNearSun.r, st.skyNearSun.g, st.skyNearSun.b);
      // (mend T, T3, the guard's limit) THE SUN IS PALER AND FIERCER AS THE AIR THINS UNDER US, ITS RED KEPT TO
      // ITS LIMB (thin 0 at the roof .. 1 at the ring): its middle goes a fifth of the way from this visit's own
      // core to a pale gold, 0.06 brighter; its limb goes to the red it had. (Its middle went to orange: a
      // whole orange disc on the dark sky, an ember. 0.45 of the way and a quarter brighter were tried: the
      // picture's own bloom made it a white hole.) The sky's one declared pacing, as it was.
      if (st.thin !== undefined) { sunU.uCore.value.copy(core0).lerp(coreHi, st.thin); sunU.uLimb.value.copy(limb0).lerp(limbHi, st.thin); sunU.uSunP.value.y = veil0 * (1 - 0.85 * st.thin); sunU.uSunP.value.x = rad0 * (1 + 0.06 * st.thin); }
      // the limb of the sphere the forest lies on, seen from this camera
      camera.getWorldPosition(cp);
      const b = U.uBend.value, k = b.z, top = st.roofY - b.w;
      if (k < 1e-9) { bandU.uAxis.value.set(0, -1, 0); bandU.uLimbP.value.x = Math.PI / 2 - Math.atan2(Math.max(cp.y - top, 0.5), 60000); }
      else {
        const R = 1 / k; cc.set(b.x, top - R, b.y).sub(cp); const D = cc.length();
        bandU.uAxis.value.copy(cc).multiplyScalar(1 / D);
        bandU.uLimbP.value.x = Math.asin(Math.min(1, R / Math.max(D, R + 0.5)));
      }
    },
  };
}
