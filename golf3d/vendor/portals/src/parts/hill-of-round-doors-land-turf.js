// hill-of-round-doors, the land builder's part: THE TURF, the one material of the ground mesh. By place alone it is
// grazed or mown sward (in broad patches of unmown grass and clover, buttercups in drifts, sheep paths along the
// slopes), long meadow grass, the lane's pale earth with its grassy crown and two wheel ruts, a bank of rough
// tussocky turf where the ground stands steep, wet margin, a rim of mud and stones at the water's edge and the
// stream's gravel bed. Slow cloud shadows drift over it. Its near patterns have
// no grain and are laid on the ground's own plane or, on a face, on the two upright planes, so that nothing is
// drawn out down a slope. What the lens changes is only how fine a pattern is drawn (by the pixel's footprint), a
// sheen by the angle of view and the low sun's light through and along the blades seen against it. The ground is left out over the hall's footprint (the plan's), where the homes builder's hall stands.
import { LAND_NOISE, LAND_PARS, LAND_FAR, FAR } from './hill-of-round-doors-land-glsl.js';
import { HALL_BOX } from './hill-of-round-doors-land-lines.js';
import { FIELD, WATER } from './hill-of-round-doors-plan.js';

const f1 = (v) => v.toFixed(3);

const VERT = /* glsl */`
attribute vec2 aShade; attribute vec4 aLand; attribute vec2 aKind;
varying vec3 vW; varying vec3 vN; varying vec2 vSh; varying vec4 vLand; varying vec2 vKind; varying float vDepth;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vN = normal; vSh = aShade; vLand = aLand; vKind = aKind;
  vec4 mv = viewMatrix * wp; vDepth = -mv.z; gl_Position = projectionMatrix * mv;
}`;

// what the turf's shader draws with
const TURF_FN = /* glsl */`
// The sward seen near, at a place q (metres) on a plane, px the pixel's footprint there: x the tone of its tufts
// (patches a foot and a hand across, 0 dark to 1 light), y the blade tips that catch the light (about a quarter of
// the face). A layer is drawn with a sharp edge while its patches are bigger than the pixel, and fades out only as
// they grow smaller than it. The pattern has no grain: it is the same in every direction of the plane.
vec2 turfDetail(vec2 q, float px){
  float a = vnoise(q * 3.1), b = vnoise(q * 9.7 + 3.1), c = vnoise(q * 31. + 7.7);
  float kb = 1. - smoothstep(.04, .14, px), kc = 1. - smoothstep(.012, .045, px);
  float eb = clamp(px * 9.7, .05, .5), ec = clamp(px * 31., .06, .5);
  float tone = mix(.5, mix(a, a * .45 + .55 * smoothstep(.5 - eb, .5 + eb, b), kb), 1. - smoothstep(.12, .45, px));
  return vec2(tone, smoothstep(.6 - ec, .6 + ec, c) * kc);
}
// long grass stands in clumps a stride across: x how much of a clump's crown a place is (0 in the gaps between
// clumps, 1 on a crown), y the clump's own number
vec2 turfClump(vec2 p){
  vec2 q = p / .95; q += .35 * vec2(vnoise(q * 1.3), vnoise(q * 1.3 + 4.));
  vec2 g = floor(q), f = fract(q); float best = 9., id = 0.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j)), c = o + hash22(g + o) * .8 + .1; float d = length(f - c);
    if (d < best) { best = d; id = hash12(g + o + 7.); }
  }
  return vec2(1. - smoothstep(.18, .62, best), id);
}
`;

const FRAG_HEAD = /* glsl */`
uniform vec4 uHall; uniform vec3 uHallV; uniform vec3 uEarth;
varying vec3 vW; varying vec3 vN; varying vec2 vSh; varying vec4 vLand; varying vec2 vKind; varying float vDepth;
void main(){
  vec2 p = vW.xz; vec3 N = normalize(vN);
  // the pixel's footprint on the ground, in metres: its short side (what is still wider than that is drawn sharp),
  // let out to at most two and a half times where the ground is seen aslant
  vec3 fx = dFdx(vW), fy = dFdy(vW); float pa = length(fx), pb = length(fy);
  float px = min(max(pa, pb), min(pa, pb) * 2.5);
  float mid = 1. - smoothstep(1.5, 9., px);
  float n2 = vnoise(p * .055 + 17.), n3 = vnoise(p * .23), n4 = vnoise(p * .9 + 5.);
  // how steep the ground stands (0 where a foot stands easily, 1 on a face), and which upright plane a face lies nearer
  float steep = 1. - smoothstep(.45, .72, N.y), ax = abs(N.x), az = abs(N.z), sideX = smoothstep(.35, .65, ax / max(ax + az, 1e-3));
  // ---- by place: the way, the homes, the field, the water
  // (metres from the way's middle: by the way the signed distance, which is exact across the middle line; away
  // from it the unsigned one, which does not pass through 0 where the hill's side and the valley's side meet)
  float wd = mix(abs(vLand.x), vKind.y, smoothstep(3.2, 4.6, vKind.y)), mound = vLand.y, garden = vLand.z;
  float fe = length((p - vec2(${f1(FIELD.x)}, ${f1(FIELD.z)})) / vec2(${f1(FIELD.rx)}, ${f1(FIELD.rz)}));
  float lawn = max(1. - smoothstep(.92, 1.06, fe + (n3 - .5) * .08), garden);
  float wet = 1. - smoothstep(${f1(WATER + 0.25)}, ${f1(WATER + 1.7)}, vW.y + (n3 - .5) * .5);
  float bed = 1. - smoothstep(${f1(WATER - 0.25)}, ${f1(WATER + 0.12)}, vW.y);
  // ---- the land's fields (the far country's own lattice): each is pasture grazed short with islands of long grass,
  // or hay standing long to within a stride of its hedge, or just mown; lawns and mounds are mown, the way's crown short
  vec2 fq = farCell(p), ff = fract(fq); float fk = farKind(floor(fq));
  float he = min(min(ff.x, 1. - ff.x), min(ff.y, 1. - ff.y)) * ${f1(FAR.size)};
  // (a field's own tone, its hay and its stubble are lost in the common sward over a few ragged strides at its edge,
  // so that where no hedge stands between two fields no line is drawn there)
  float inField = smoothstep(.5, 6.5, he + (n4 - .5) * 3. + (n3 - .5) * 2.);
  float mownK = step(${f1(FAR.mown)}, fk), hay = step(${f1(FAR.hay)}, fk) * (1. - mownK) * inField;
  float longK = max(vKind.x * .75 * (1. - mownK), hay) * (1. - lawn) * (1. - mound) * smoothstep(3.2, 5.5, wd);
  longK = max(longK, wet * (1. - lawn) * .8);
`;

const FRAG_ALBEDO = /* glsl */`
  // ---- the sward's colour: short turf with deeper clover patches, long grass yellower and paler
  vec3 shortC = landSward(0., n3) * mix(vec3(1.), vec3(.84, .98, .94), smoothstep(.55, .8, n2) * (1. - lawn));
  shortC *= mix(vec3(1.), vec3(.9, 1., .96), lawn);                      // the lawn is deeper
  // (broad drifts of tone across the down: warmer and paler here, cooler and deeper there)
  shortC *= mix(vec3(.9, .96, 1.02), vec3(1.1, 1.04, .92), vnoise(p * .0125 + 40.));
  // (and patches a stone's throw across break it: islands left unmown, longer and paler; clover in deep green drifts)
  float unm = smoothstep(.5, .62, vnoise(p * .03 + 71.) * .72 + n3 * .28) * (1. - lawn);
  shortC = mix(shortC, shortC * vec3(1.34, 1.17, .68), unm * .75);
  shortC *= mix(vec3(1.), vec3(.64, .9, .78), smoothstep(.56, .7, vnoise(p * .071 + 23.)) * (1. - lawn) * (1. - unm));
  // a field just mown: paler stubble; each pasture its own cast of green; rank dark grass under the hedges (none
  // by the flown line, where no hedge stands)
  float away = (1. - lawn) * (1. - mound);
  float mownS = mownK * away * inField;
  shortC = mix(shortC, uTurf * vec3(1.3, 1.2, .82) * (.97 + .05 * sin(dot(p, vec2(.8, -.6)) * 1.3)), mownS);
  shortC *= mix(vec3(1.), mix(vec3(.86, .97, 1.03), vec3(1.08, 1.03, .88), fract(fk * 7.3)), away * (1. - mownK) * inField);
  float rank = (1. - smoothstep(.6, 2.6, he + (n4 - .5) * 1.2)) * away * smoothstep(5., 7., wd) * smoothstep(11., 17., vLand.w);
  vec3 longC = landSward(1., n4);
  // ---- the sward seen near: tufts and lit blade tips, laid on the ground's own plane where it lies easy and on the
  // two upright planes where it stands as a face, so that no pattern is drawn out down a bank
  vec2 det = turfDetail(p, px);
  if (steep > 0.) det = mix(det, mix(turfDetail(vW.xy + 11.3, px), turfDetail(vW.zy + 4.7, px), sideX), steep);
  // ---- the way: hard pale earth, a grassy crown down its middle, a rut under each wheel. Each edge of it is worked
  // out from the distance to the way's middle line: it wanders a hand's breadth with a slow wobble, round tufts of
  // grass a foot across bite into it, and it is as soft as the pixel is wide (so it is smooth at every distance)
  vec2 tf = vec2(0.); if (wd < 4.6) tf = turfClump(p * 2.3 + 31.);
  float aa = max(.035, px * .8), ta = clamp(aa * 5.5, .06, .5);
  float wob = (vnoise(p * .37 + 5.) - .5) * .44 + (vnoise(p * 1.1 + 9.) - .5) * .14;
  float bite = tf.x * smoothstep(.3, .7, tf.y);                              // (two tufts in three bite)
  float way = 1. - smoothstep(2.9 - aa, 2.9 + aa, wd + wob + bite * .42);
  float crown = 1. - smoothstep(.92 - aa, .92 + aa, wd + wob * .6 - bite * .36);
  float rut = 1. - smoothstep(.26, .66, abs(wd - 1.75) + wob * .3);
  float tuft = smoothstep(.5 - ta, .5 + ta, tf.x) * step(.74, tf.y) * (1. - rut);      // grass that has taken hold on the earth, out of the wheels' way
  float earthK = way * (1. - crown) * (1. - tuft);
  longK *= 1. - earthK;
  vec3 alb = mix(shortC, longC, longK) * mix(vec3(1.), vec3(.62, .78, .7), rank);
  // the tufts' tone and the lit tips; a face is rougher and darker in its hollows; the long grass stands in clumps
  // with pale seed heads on some
  alb *= (.74 + .52 * det.x) * mix(1., .7 + .55 * det.x, steep);
  alb = mix(alb, alb * vec3(1.45, 1.4, 1.1) + uTurf * vec3(.1, .09, 0.), det.y * .6);
  // buttercups in drifts: yellow on the lit tips seen near, a wash of yellow from afar
  float butt = smoothstep(.6, .74, vnoise(p * .052 + 88.) * .8 + n4 * .2) * (1. - lawn) * (1. - earthK);
  alb = mix(alb, uTurf * vec3(2.4, 2.1, .4), butt * (.1 + .7 * det.y));
  // sheep paths on the pastures' slopes: trodden lines that keep to the slope's level, one some two and a half
  // metres above the next, wandering, worn through in some stretches and grown over in others, in broad parts of
  // the hill and not elsewhere. Each is two feet wide on the ground (so its share of height goes by the slope),
  // ragged, and as soft as the pixel reaches in height; they are left out where the pixel takes in more than a
  // path and the turf between two
  float tanS = sqrt(max(2. * (1. - N.y), 0.) + 1e-4), hw = (.2 + .16 * n4) * tanS, hpx = max(abs(fx.y), abs(fy.y)) + 1e-4;
  float hd = abs(fract(vW.y * .4 + (vnoise(p * .041 + 61.) - .5) * 2.6 + (n3 - .5) * .2) - .5) / .4, ha = max(hpx, hw * .6);
  float trod = (1. - smoothstep(hw - ha, hw + ha, hd)) * clamp(hw / hpx, 0., 1.) * (1. - smoothstep(.2, .55, hpx));
  trod *= smoothstep(.01, .04, 1. - N.y) * (1. - steep) * smoothstep(.4, .62, vnoise(p * .013 + 41.)) * smoothstep(.3, .62, vnoise(p * .09 + 7.)) * (1. - lawn) * (1. - earthK) * (1. - smoothstep(.05, .3, mound)) * (1. - garden);
  alb = mix(alb, mix(alb, uEarth, .55), trod * .5);
  vec2 cl = turfClump(p); float clK = longK * (1. - smoothstep(.05, .4, px)) * (1. - steep);
  alb *= mix(1., .86 + .24 * cl.x, clK);
  alb = mix(alb, uTurf * vec3(1.75, 1.45, .8), clK * cl.x * smoothstep(.45, .9, cl.y) * .3);
  // the earth: pale, with small stones (drawn as stones while a stone is wider than the pixel), darker in the ruts
  float es = clamp(px * 23., .05, .5), stone = smoothstep(.7 - es, .7 + es, vnoise(p * 23. + 3.)) * (1. - smoothstep(.02, .07, px));
  vec3 earth = uEarth * (.9 + .16 * n4) * mix(1., .8, rut * .7);
  earth = mix(earth, uEarth * vec3(1.28, 1.26, 1.22), stone * (1. - rut * .6));
  alb = mix(alb, earth, earthK);
  // ---- the wet margin and the stream's bed: darker lush grass, then mud and gravel under the clear water
  alb = mix(alb, alb * vec3(.7, .86, .62), wet * (1. - bed) * .6);
  // the bank's wet rim between the grass and the water: bare dark mud, its edge wandering, pale stones lying in it
  float rim = 1. - smoothstep(${f1(WATER + 0.05)}, ${f1(WATER + 0.55)}, vW.y + (vnoise(p * .45 + 41.) - .5) * .8 + (n3 - .5) * .2);
  vec3 mud = mix(vec3(.1, .078, .046), vec3(.19, .15, .095), vnoise(p * 2.3 + 7.));
  mud = mix(mud, vec3(.4, .38, .34) * (.8 + .4 * vnoise(p * 9. + 3.)), smoothstep(.6, .7, vnoise(p * 2.9 + 53.)) * .85);
  alb = mix(alb, mud, rim * .9);
  vec3 bedC = mix(vec3(.13, .105, .06), vec3(.34, .29, .18), vnoise(p * 1.7)) * (.75 + .5 * vnoise(p * 6.3));
  alb = mix(alb, bedC, bed);
  // ---- beyond the village the plain is the far country's patchwork of fields, hedges and woods
  float farK = smoothstep(190., 330., vLand.w) * (1. - bed);
  alb = mix(alb, landFar(p, 1. - N.y, px), farK); longK *= 1. - farK;
`;
const FRAG_LIGHT = /* glsl */`
  // ---- the light: the scene's own sun and fill on a matt ground; what stands between the place and the sun is
  // baked (the mesh's own hills in vSh, trees, hedges, walls and buildings in the shade map)
  vec3 sh = landShade(p);
  // (a cloud's shadow is laid on lightly where the tufts stand, within reach of the flown line in plan, for they
  // are lit once when they are made; what blocks the sun also hides a share of the sky, so shade is deeper than
  // the open sky's fill alone would leave it)
  float sun = vSh.x * sh.r * mix(1., landCloud(p), .4 + .6 * smoothstep(40., 75., vLand.w)), open = (.5 + .5 * vSh.y) * sh.g * mix(.66, 1., sh.r);
  vec3 c = landLight(alb, N, sun, open);
  // long grass lets the low sun through: looking toward the sun the sward glows yellow-green
  vec3 V = normalize(cameraPosition - vW);
  float back = max(dot(-V, uSunDir), 0.), grassK = (1. - earthK) * (1. - bed);
  c += alb * uSunCol * (.3183 * sun * back * back * (.08 + .3 * longK) * grassK) * vec3(1.1, 1., .5);
  // and against the light the blade tips are rimmed with it
  c += alb * uSunCol * (.3183 * sun * det.y * (.15 + .9 * back * back) * grassK);
  c += landSheen(N, V, open) * grassK;
  // the wind runs over it: gust fronts pale the grass as it bows
  c *= 1. + (landGust(p) - .45) * .26 * (.3 + .7 * longK) * mid * grassK;
  // dew at dawn: a cool silver bloom on the short turf, seen against the light
  c += uDew * vec3(.5, .56, .62) * uSunCol * (.05 * grassK * (1. - longK * .5) * sun * (.3 + back * back));
  // lamplight by place (the lanterns of the party tree, the windows), once the sun is down: warm on the grass,
  // never black at night
  c += alb * uLampCol * (sh.b * max(uLit * 2. - 1., 0.));
  // the stream's bed is seen through a little depth of clear water
  c = mix(c, c * vec3(.62, .8, .78), bed * .7);
  c = landFog(c, vDepth, farK);
  // ---- left out over the hall's footprint
  vec2 hr = p - uHall.xy; float hv = -(hr.x * uHall.z + hr.y * uHall.w), hu = hr.x * uHall.w - hr.y * uHall.z;
  gl_FragColor = vec4(c, 1.);
  if (hv > uHallV.x && hv < uHallV.y && abs(hu) < uHallV.z) discard;
}`;

// The ground's material. uniforms: the land's own table (landUniforms); the earth's colour comes with the look of the hour.
export function makeTurfMaterial(THREE, uniforms, look) {
  return new THREE.ShaderMaterial({
    name: 'hill-turf',
    uniforms: { ...uniforms,
      uHall: { value: new THREE.Vector4(HALL_BOX.x, HALL_BOX.z, HALL_BOX.fx, HALL_BOX.fz) },
      uHallV: { value: new THREE.Vector3(HALL_BOX.v0, HALL_BOX.v1, HALL_BOX.half) },
      uEarth: { value: look.earth.clone() } },
    vertexShader: VERT,
    fragmentShader: LAND_NOISE + LAND_PARS + LAND_FAR + TURF_FN + FRAG_HEAD + FRAG_ALBEDO + FRAG_LIGHT,
  });
}
