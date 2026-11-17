// THE DOOR: hero set piece of "the-light-comes-on" (The Light Comes On), built at the brief's giant scale.
//
// The inside of a fridge door, 300 m wide and 400 m tall: white enamel liner with moulded ribs, four racks
// with wire guard rails, 30-odd bottles of milk, juice, soda and sauce whose liquids slop when the door is
// tugged, a covered butter box and a tray of twelve eggs. It swings away on its hinge (12 degrees, creeping
// on to 15) while the grey bellows gasket peels off the cabinet from the top down like a zip, each fold
// snapping back to the door with a shiver, and the bar of kitchen light opens behind the peel. With it come
// the cabinet's front flange (the edge the gasket seals on), the front lips of the three glass shelves with
// their green light-pipe edges, the three fog-falls that pour over those edges, and the fog river that runs
// out through the foot of the slot.
//
// SPACE    Hero-local = the brief's coordinates with z shifted: local (x, y, z) = brief (x, y, z + 240). The
//          door shut lies in the plane z = 0 with its racks toward +Z (into the box); hinge axis x = +150,
//          latch edge x = -150, floor y = 0, door y 10..410. Shelf front edges at z = 60, tops y 110/215/320.
//          Place hero.object at the brief's (0, 0, -240); do NOT rotate or scale it (shaders light in
//          world space minus the object's position). radius ~235, height 420, centre (0, 215, 10).
// STYLE    Studio glass photography, done entirely in this file's ShaderMaterials (no three.js lights, no
//          textures). Every material calls lcShade() from hero.glsl.light: a hard blue-white point light
//          (the bulb) with squared wrap and soft inverse-square falloff (200 m knee), a deep teal ambient, the
//          amber bar as a wedge mask lcBar() (left of a line from the door's latch edge, above the peel
//          front), and diode speculars only. Glass is one front-facing shell, premultiplied alpha: liquid
//          below a tilting plane (colour deepening toward the silhouette's centre, lit from its surface
//          down), the liquid surface ray-traced as an ellipse, a white fresnel rim squared, a tight bulb
//          highlight, shoulder flutes, beads and bubble chains drawn in the fragment shader. Enamel is flat
//          white vertex colour with baked tray and bottle shadows, frost bloom and beads. To match it, build
//          world materials from hero.glsl.light + hero.uniforms (spread hero.uniforms into your uniforms so
//          the same objects are shared) and call lcShade(worldPos, N, V, albedo, gloss, specular).
// LIGHT    Wants a dark scene: fog colour near #04080B, thin; bloom on. Bulb at local (95, 408, 90), diode at
//          (0, 414, 180) (opts.bulbPos, opts.diodePos). uniforms.uBulb 0..1 (the world should latch it by
//          time and call setBulb every frame), uWarm (bar strength), uDiode, uDoor (radians), uBar.
// OPTS     palette (7 hex, the brief's order: dark, teal shadow, haze, bulb white, green, amber, ruby)
//          variant 'midnight' | 'morning' | 'party' (default from ctx.vary.hour and the seed; returned as
//          hero.variant; party cycles the bar through rose, gold and violet over 6 s and racks champagne)
//          density (ctx.vary.density), frost 0..1, duration (40.5 s, converts u to seconds for the ringing),
//          frame (true: the cabinet flange), shelfDepth (34: lips only; 180 builds the whole shelves; 0 none),
//          fogFalls (true), barGlow (true: faint light curtains inside the bar), bulbPos, diodePos, progress,
//          lane ([x, z, dx, dz, half width, widening per metre], hero-local: a strip of the shelves kept clear of mist).
//          uniforms.uDark: x = the hairline of kitchen light round the seal before the bulb (the world sets it; 0 here),
//          y = the held picture's backlight (warm rims and the bar's streak on the glass, 0..1), z = the dark's own ambient.
// PROGRESS hero.setProgress(u) with the world's path u: door angle (from u 0.10), gasket peel (u 0.162-0.49), fog-falls
//          (top from u 0.30, middle 0.37, bottom 0.41), slosh and lean (ringing after each tug of the door)
//          are pure functions of u, so they can never run on the wall clock. Until it is first called the
//          hero plays a slow demo from `time`. Overrides: setBulb(v), setWarm(v), setDiode(v), setDoor(deg),
//          setPeel(0..1), setFalls(a, b, c) (null releases). Call update(dt, time, camera) every frame.
//          hero.peelPoint(out) = where the zip is now; hero.doorPoint(p, out) carries a shut-door point to
//          the swung door; hero.doorAngle() in radians.
// ANCHORS  (hero-local) portalSeat { position (-150, 72, -21), facing (unit vector back up the exit line),
//          radius 7, slotWidth }; exitLine [from, seat] (the last 60 m, 20 degrees down); flyThrough: hairpin
//          over the top shelf edge 16-20 m from the top rack, then the dive down the canyon and the exit, at
//          least 6 m clear of everything solid with the door at its angle for those u; viewpoints { remember,
//          hairpin, dive, canyonFloor, exit, whole }; lookAt { door, topRack, slot, slotFoot, falls }; hinge,
//          latchShut, latchAt12, latchAt15; bulb, diode; shelfEdges; fallFeet (for extra mist); river;
//          rackFloors, rackFrontZ; bottles [{ position, radius, height, rack, kind, fizz }] (door shut);
//          butterBox, eggTray; keepOut.
// ORDER    renderOrder: shelves 1, bottles 2, fog sheets 5, fog puffs 5.5, the shelves' burning edges again as light 5.8,
//          bar curtains 6 (all transparent; bottles and shelves write depth).
// EDGE     the cabinet's latch-side post, beside the way out, is shaded in enamelMaterial by a rule of the surface (white rim,
//          white going blue, teal shade, the kitchen's colour on its slot side, ribs as lines of light, frost at the shelf
//          levels); at the foot of the slot the fog sheets and puffs show rolling billows (GLSL_FOOT, exported for the world's mist).
// COST     about 107k triangles, 13 draw calls, 10 shader programs, no lights, no textures, no render targets;
//          build 150-250 ms with 4 yields. ctx.quality.detail thins fog columns and puffs only.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import { GLSL_HASH, GLSL_VALUE_NOISE, GLSL_FBM, GLSL_FOG_PARS_VERT, GLSL_FOG_VERT, GLSL_FOG_PARS_FRAG } from '../kit/fx.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const DEFAULT_PALETTE = ['#04080B', '#0E2A33', '#7FD6E8', '#EAF6FF', '#5BE6B4', '#FFB45A', '#C8324A'];
const HINGE_X = 150, DOOR_W = 300, DOOR_Y0 = 10, DOOR_Y1 = 410, SHELF_Z = 60, SHELF_TOPS = [320, 215, 110];
const DURATION = 40.5;
const END_X = -129;                                   // where the last bottle of the bottom rack stands, on its end piece
const ITEM_RACK = 1;                                  // the rack that carries the butter box and the egg tray (second from the floor)

// ---------------------------------------------------------------- progress curves (pure functions of the path u)
// door angle in degrees: the pull (two eases to 12 degrees by u 0.36), then three small tugs creeping on to 15
const SWING = [[0.1, 0.27, 7.6], [0.24, 0.36, 4.4], [0.49, 0.6, 1.4], [0.62, 0.8, 1.0], [0.8, 1.0, 0.6]];
function doorAngleDeg(u) { let a = 0; for (const s of SWING) a += s[2] * smoothstep(s[0], s[1], u); return a; }
// each tug of the door sets the liquids ringing: [u, amplitude]
const JOLTS = [[0.103, 1.0], [0.245, 0.7], [0.495, 0.75], [0.545, 0.6], [0.625, 0.5], [0.71, 0.4], [0.805, 0.4], [0.9, 0.3]];
function sloshAt(u, seconds, freq, decay, phase) {
  let s = 0;
  for (const j of JOLTS) { const t = (u - j[0]) * seconds; if (t > 0) s += j[1] * Math.exp(-t * decay) * Math.sin(t * freq * TAU + phase); }
  return s;
}
const PEEL = [0.162, 0.49];
const peelAt = (u) => { const x = clamp((u - PEEL[0]) / (PEEL[1] - PEEL[0]), 0, 1); return x * (0.55 + 0.45 * x) * (1 + 0.5 * (1 - x) * x); };   // steady from the first: the slot is open to half its height by the held frame
const FALL_WINDOWS = [[0.3, 0.47], [0.37, 0.52], [0.41, 0.56]];

// ---------------------------------------------------------------- shared GLSL: the fridge's three lights
// Every material of the hero (and, if the world wants, of the world) lights itself with lcShade():
// the bulb (hard blue-white point), the kitchen bar (a wedge of warm light entering through the slot,
// cut off below the gasket's peel front), the diode (speculars only) and a teal ambient.
const GLSL_LIGHT = /* glsl */`
uniform float uBulb, uWarm, uDiode, uDoor, uTime;
uniform vec3 uBulbPos, uDiodePos, uOrigin, uBulbCol, uWarmCol, uDiodeCol, uShadowCol, uDarkCol, uGreenCol;
uniform vec4 uBar;   // x: spread of the bar per metre of depth, y: peel-front height (local), z: ambient lift, w: slot open 0..1
uniform vec4 uKey;   // x: share of the bulb's light that leaks toward the door, y: ambient gain, z: top light in the shade, w: bar haze gain
uniform vec4 uDark;  // x: the hairline of kitchen light that leaks round the seal before the bulb, y: the held picture's backlight 0..1, z: the dark's own ambient
const vec3 LC_KITCHEN = vec3(-0.3015, 0.1005, -0.9482);
// the ribbed housing throws the bulb's light back into the box: 1 on the terraces and the back plate, uKey.x on the door
float lcHood(vec3 Pw){
  vec3 d = Pw - uBulbPos; float l = max(length(d), 1.);
  return mix(uKey.x, 1., smoothstep(-.44, .04, d.z/l));
}
float lcDoorPlane(float x){ return -(150. - x)*(sin(uDoor)/max(cos(uDoor), .2)); }
// 1 inside the wedge of kitchen light (P in hero-local metres)
float lcBar(vec3 P){
  vec2 E = vec2(150. - 300.*cos(uDoor), -300.*sin(uDoor));
  float dz = P.z - E.y;
  float edge = E.x + dz*uBar.x;
  float soft = 4. + max(dz, 0.)*.06;
  float m = 1. - smoothstep(edge - soft, edge + soft, P.x);
  m *= smoothstep(uBar.y - 10., uBar.y + 6., P.y);
  m *= smoothstep(-2., 4., P.z - lcDoorPlane(P.x));
  return m*uBar.w;
}
// 1 on the kitchen side of the door
float lcOutside(vec3 P){ return smoothstep(2., 10., lcDoorPlane(P.x) - 4. - P.z)*uBar.w; }
float lcBulbAtt(float d){ return 1.35/(1.35 + d*d/(200.*200.)); }
// a surface's own light held under the bloom pass: below six tenths of the ceiling nothing changes, above it the luminance
// bends over and never reaches the ceiling; the hue is kept. (The ceiling used is .9: nine tenths of the lowest bloom
// threshold of the three looks, 1.0, so a body shaded through this never feeds the bloom; glints are added after it.)
vec3 lcCap(vec3 c, float cap){
  float l = dot(c, vec3(.2126, .7152, .0722)), k = cap*.6, w = max(cap - k, 1e-3);
  float m = k + w*(1. - exp(-max(l - k, 0.)/w));
  return l > k ? c*(m/max(l, 1e-4)) : c;
}
// the look's shade as a shadow shows it: at its root (the design's deep teal at midnight, three stops under lit ice) and at
// its tip (blue, two stops under)
vec3 lcShadeRoot(){ return uShadowCol*(uKey.y*1.8); }
vec3 lcShadeTip(){ return uShadowCol*(uKey.y*1.3) + uBulbCol*vec3(.045, .105, .17); }
// before the bulb a hairline of kitchen light leaks round the door's seal: how much of it reaches P (hero-local)
float lcLeak(vec3 P){
  float z = max(P.z, 0.);
  return exp(-length(vec2(P.x + 146., z))/56.) + .45*exp(-length(vec2(P.y - 404., z))/46.) + .3*exp(-length(vec2(P.y - 16., z))/46.);
}
// a liquid's hue as the dark shows it: cyan goes cobalt, ruby magenta, milk a pale mint; the rest keep their colour, deepened
vec3 lcDarkHue(vec3 liq, float milk){
  float mx = max(liq.r, max(liq.g, liq.b)), mn = min(liq.r, min(liq.g, liq.b));
  vec3 h = (liq - mn*.8)/max(mx - mn*.8, .05);
  h = mix(h, vec3(.08, .3, 1.), step(liq.r, .5)*step(liq.g, liq.b));
  h = mix(h, vec3(1., .1, .52), step(.6, liq.r)*step(liq.g, .3));
  return mix(h, vec3(.62, 1., .86), milk);
}
// bulb light that has come through the glass on the terraces: long pools of lime, amber, cyan and (rarely) ruby on
// whatever lies beyond, rippling like light through liquid. Returns a tint for the bulb's light (white outside the pools).
vec3 lcThrown(vec3 Pw){
  vec3 d = Pw - uBulbPos; float l = max(length(d), 1.);
  float el = -d.y/l;
  float az = atan(d.z, d.x + (abs(d.x) + abs(d.z) < 1e-3 ? 1e-3 : 0.));
  float gate = smoothstep(.07, .2, el)*(1. - smoothstep(.8, .96, el))*smoothstep(60., 150., l);
  vec3 acc = vec3(0.); float cov = 0.;
  for (int k = 0; k < 2; k++) {
    float fk = float(k), w = .2 + .09*fk, c = az/w + fk*3.37;
    float id = floor(c), f = fract(c) - .5, h = hash11(id*1.73 + fk*17.1 + 4.2), h2 = hash11(id*3.19 + fk*5.3 + 9.7);
    float wd = .3 + .2*h2, off = (h2 - .5)*.2;
    float m = (1. - smoothstep(wd*.2, wd, abs(f - off)))*step(.36, h);
    m *= .62 + .38*sin(el*(26. + 20.*h2) + az*9. + uTime*(.35 + .5*h) + h*40.);          // the liquid's ripple
    m *= smoothstep(.0, .12, el - .06 - .2*h2*fk);
    vec3 tc = h < .56 ? vec3(.36, 1., .1) : (h < .76 ? vec3(1., .42, .03) : (h < .92 ? vec3(.03, .68, 1.) : vec3(.3, .9, .95)));
    acc += tc*m; cov += m;
  }
  cov = min(cov, 1.);
  return mix(vec3(1.), acc/max(cov, 1e-3)*1.3, cov*gate);
}
vec3 lcShade(vec3 Pw, vec3 N, vec3 V, vec3 alb, float gloss, float specAmt){
  vec3 P = Pw - uOrigin;
  vec3 Lb = uBulbPos - Pw; float d = max(length(Lb), 1.); Lb /= d;
  float nl = dot(N, Lb), hood = lcHood(Pw), att = lcBulbAtt(d);
  float wrap = clamp(nl*.8 + .2, 0., 1.);
  vec3 Hb = normalize(Lb + V + vec3(0., 1e-3, 0.));
  float sp = pow(max(dot(N, Hb), 0.), gloss)*specAmt*smoothstep(-.1, .2, nl);
  vec3 thr = lcThrown(Pw);
  vec3 col = alb*uBulbCol*thr*(wrap*wrap*att*hood*1.5*uBulb) + uBulbCol*thr*(sp*att*(.3 + .7*hood)*uBulb);
  // in the shade: teal ambient with a bounce off the lit back of the box, and a little light from above on every ledge
  col += alb*mix(uDarkCol*.5, uShadowCol*uKey.y, uBulb)*clamp(.58 + .3*N.y + .22*N.z, .3, 1.);
  // the tray of fog on the floor glows: a dim teal lift on whatever stands low in the canyon, so mist never ends against black
  col += alb*uBulbCol*vec3(.42, .78, .9)*(uBulb*.17*exp(-max(P.y, 0.)/105.)*(.75 - .25*N.y));
  // across the canyon the burning shelf lips and the falls light the door: a green-white glow on what faces them and on every underside
  col += alb*mix(uGreenCol, uBulbCol, .45)*(uBulb*.24*smoothstep(75., 45., P.z)*clamp(.3 + .5*N.z - .4*N.y, 0., 1.));
  // kitchen light spills in through the slot: a soft glow on whatever faces the opening, brightest beside it and
  // gone a shelf's depth into the box, so enamel there is white washed with amber and falls away to teal
  vec3 toS = vec3(-146. - P.x, 0., -24. - P.z); float dS = max(length(toS), 1.);
  float spill = clamp(dot(N, toS)/dS*.75 + .25, 0., 1.)/(1. + dS*dS/(64.*64.));
  col += alb*uWarmCol*(uWarm*uBar.w*.45*(1. - hood)*spill);
  col += alb*uBulbCol*(uBulb*att*(1. - hood)*uKey.z*smoothstep(.2, .85, N.y));
  float nk = clamp(dot(N, LC_KITCHEN)*.8 + .2, 0., 1.);
  col += alb*uWarmCol*(uWarm*nk*(lcBar(P)*1.05 + lcOutside(P)*.55));
  vec3 Ld = uDiodePos - Pw; float dd = max(length(Ld), 1.); Ld /= dd;
  vec3 Hd = normalize(Ld + V + vec3(0., 1e-3, 0.));
  col += uDiodeCol*(uDiode*(1. - .6*uBulb))*(pow(max(dot(N, Hd), 0.), gloss*1.4)*min(specAmt, 1.3)*2.2 + alb.g*max(dot(N, Ld), 0.)*.012);
  // before the bulb the dark has depth: a dim pool of the diode's green on whatever faces it, a breath of cobalt in every
  // shadow, and the seal's hairline of kitchen light lying warm on what stands by the door
  float dk = (1. - uBulb)*uDark.z;
  col += alb*(dk*(vec3(.011, .021, .05)*clamp(.7 + .3*N.y, 0., 1.) + uDiodeCol*(uDiode*.09*clamp(dot(N, Ld)*.75 + .25, 0., 1.)/(1. + dd*dd/(160.*160.)))));
  col += alb*uWarmCol*(uDark.x*lcLeak(P)*clamp(dot(N, toS)/dS*.6 + .4, 0., 1.)*.55);
  return col;
}
`;
// condensation beads on a 2D parameterisation (uv in bead cells): returns vec3(mask, highlight, shade)
const GLSL_BEADS = /* glsl */`
float lcBn(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(hash12(i), hash12(i + vec2(1., 0.)), f.x), mix(hash12(i + vec2(0., 1.)), hash12(i + vec2(1., 1.)), f.x), f.y);
}
// small lenses, not dots: they gather in patches, come in every size, a few run; each is clear with a dark lower edge
// (shade) and one point of light (highlight)
vec3 lcBeads(vec2 uv, float density, float t, float aa){
  float col = floor(uv.x);
  float run = step(hash11(col*7.31 + 3.), .1);
  uv.y += run*t*(.25 + .5*hash11(col*3.7 + 11.));
  vec2 id = floor(uv), f = fract(uv) - .5;
  vec2 rnd = hash22(id + 17.3);
  float clump = smoothstep(.36, .7, lcBn(id*.19 + 3.7)*.62 + lcBn(id*.061 + 9.1)*.38);
  float on = step(hash12(id*1.37 + 5.1), density*(.1 + 1.6*clump) + run*.25)*(1. - smoothstep(.12, .3, aa));
  float r = mix(.06, .44, rnd.x*rnd.x*rnd.x)*(1. + run*.35);
  vec2 q = f - (rnd - .5)*(.9 - 1.8*r); q.y *= 1. - run*.3;
  float d = length(q);
  aa = clamp(aa, 1e-3, .2);
  float m = (1. - smoothstep(r - aa, r + aa, d))*on;
  float hl = (1. - smoothstep(0., r*.26 + aa, length(q - vec2(-.3, .32)*r)))*m;
  float sh = smoothstep(-r*.3, r*.9, -q.y)*smoothstep(r*.35, r, d)*m;
  return vec3(m, hl, sh);
}
`;

// the foot of the slot, and fog that rolls. lcFoot(P) is 1 at the foot of the slot, where the cold pours out past the cabinet's
// edge and under the way out, and 0 from the middle of the box inward and above the bottom shelf (hero-local metres: x -100..-50
// is the latch-side third of the box up to where the amber bar ends on the shelf fronts; y 125..162.5 is from above the bottom
// shelf's top, 110, to half way to the next). lcRoll(q, t) is 1 on a billow's crown and 0 in the crease between two, the
// billows turning over and travelling as t runs (q in billow widths). Needs vnoise.
const GLSL_FOOT = /* glsl */`
float lcFoot(vec3 P){ return (1. - smoothstep(-100., -50., P.x))*(1. - smoothstep(125., 162.5, P.y)); }
float lcRoll(vec2 q, float t){
  vec2 w = q + .35*vec2(vnoise(q*.7 + vec2(0., t*.21)), vnoise(q*.7 + vec2(5.2, -t*.17)));
  float n = vnoise(w + vec2(t*.13, -t*.31))*.65 + vnoise(w*2.1 + vec2(-t*.22, -t*.47) + 3.7)*.35;
  return smoothstep(0., .7, abs(2.*n - 1.));
}
`;

// ---------------------------------------------------------------- geometry helpers
const _c = new THREE.Color();
function paint(g, color, mat = 0, shadeFn = null) {
  const n = g.attributes.position.count, col = new Float32Array(n * 3), m = new Float32Array(n);
  const p = g.attributes.position;
  const c = color.isColor ? color : _c.set(color);
  for (let i = 0; i < n; i++) {
    const k = shadeFn ? shadeFn(p.getX(i), p.getY(i), p.getZ(i)) : 1;
    col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k; m[i] = mat;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aMat', new THREE.BufferAttribute(m, 1));
  if (g.attributes.uv) g.deleteAttribute('uv');
  return g;
}
// box with rounded edges (k bevel segments), centred at (cx,cy,cz)
function rbox(cx, cy, cz, sx, sy, sz, bevel, k = 1) {
  const n = 2 * k + 1, g = new THREE.BoxGeometry(2, 2, 2, n, n, n);
  const p = g.attributes.position, nor = g.attributes.normal, h = [sx / 2, sy / 2, sz / 2];
  const b = Math.min(bevel, h[0] * 0.98, h[1] * 0.98, h[2] * 0.98);
  const v = [0, 0, 0], q = [0, 0, 0];
  for (let i = 0; i < p.count; i++) {
    v[0] = p.getX(i); v[1] = p.getY(i); v[2] = p.getZ(i);
    let len = 0;
    for (let a = 0; a < 3; a++) {
      const idx = Math.round((v[a] + 1) * 0.5 * n), s = idx <= k ? -1 : 1, j = idx <= k ? idx : n - idx;   // j: 0 = outer face .. k = inner cut
      const off = j >= k ? 0 : Math.tan((1 - j / k) * Math.PI / 4);       // 1 at the face, 0 at the cut
      v[a] = s * (h[a] - b); q[a] = s * off; len += q[a] * q[a];
    }
    len = Math.sqrt(len) || 1;
    const nx = q[0] / len, ny = q[1] / len, nz = q[2] / len;
    p.setXYZ(i, cx + v[0] + nx * b, cy + v[1] + ny * b, cz + v[2] + nz * b);
    nor.setXYZ(i, nx, ny, nz);
  }
  return g;
}
// tube through points (array of [x,y,z])
function tube(points, radius, seg = 6, closed = false, tension = 0.3) {
  const curve = new THREE.CatmullRomCurve3(points.map((q) => new THREE.Vector3(q[0], q[1], q[2])), closed, 'catmullrom', tension);
  return new THREE.TubeGeometry(curve, Math.max(4, Math.round(curve.getLength() / (radius * 2.2))), radius, seg, closed);
}
// surface of revolution from control points [y, r, steps]; smooth S-curves between the knots
function latheProfile(knots) {
  const pts = [];
  for (let i = 0; i < knots.length - 1; i++) {
    const a = knots[i], b = knots[i + 1], n = b[2] || 1;
    for (let j = 0; j < n; j++) { const t = j / n, s = t * t * (3 - 2 * t); pts.push(new THREE.Vector2(Math.max(lerp(a[1], b[1], s), 1e-4), lerp(a[0], b[0], t))); }
  }
  const l = knots[knots.length - 1]; pts.push(new THREE.Vector2(Math.max(l[1], 1e-4), l[0]));
  return pts;
}
// straight rod between two points (open cylinder)
function rod(a, b, r, seg = 6) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), len = d.length();
  const g = new THREE.CylinderGeometry(r, r, len, seg, 1, true);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  return g;
}
function knob(x, y, z, r) { const g = new THREE.IcosahedronGeometry(r, 1); g.translate(x, y, z); return g.index ? g : (g.setIndex([...Array(g.attributes.position.count).keys()]), g); }

// ---------------------------------------------------------------- bottles: profiles and cast
// knots are [y, r, steps] in units of height and body radius; capY = where glass ends and the closure begins
const PROFILES = {
  milk: { capY: 0.946, crimp: 0, knots: [[0, 0, 2], [0, 0.78, 2], [0.03, 1, 2], [0.5, 1, 4], [0.58, 0.98, 4], [0.74, 0.5, 3], [0.9, 0.47, 2], [0.925, 0.56, 1], [0.945, 0.56, 1], [0.946, 0.58, 1], [0.962, 0.6, 2], [0.992, 0.55, 2], [1, 0, 1]] },
  swing: { capY: 0.925, crimp: 0, knots: [[0, 0, 2], [0, 0.8, 2], [0.03, 1, 2], [0.42, 1, 5], [0.72, 0.4, 3], [0.88, 0.36, 2], [0.9, 0.46, 1], [0.924, 0.46, 1], [0.925, 0.5, 2], [0.955, 0.52, 2], [0.99, 0.34, 2], [1, 0, 1]] },
  soda: { capY: 0.955, crimp: 0.09, knots: [[0, 0, 2], [0, 0.74, 2], [0.035, 0.96, 3], [0.16, 1, 3], [0.36, 0.8, 3], [0.54, 1, 4], [0.8, 0.36, 3], [0.93, 0.33, 1], [0.945, 0.41, 1], [0.954, 0.41, 1], [0.955, 0.47, 1], [0.985, 0.45, 2], [1, 0.36, 1], [1, 0, 1]] },
  sauce: { capY: 0.875, crimp: 0.03, knots: [[0, 0, 2], [0, 0.82, 2], [0.03, 1, 2], [0.56, 1, 3], [0.66, 0.62, 3], [0.86, 0.5, 1], [0.874, 0.56, 1], [0.875, 0.63, 1], [0.98, 0.63, 2], [1, 0.55, 1], [1, 0, 1]] },
  carafe: { capY: 0.9, crimp: 0, knots: [[0, 0, 2], [0, 0.7, 2], [0.04, 0.96, 3], [0.3, 1, 5], [0.72, 0.5, 3], [0.86, 0.47, 2], [0.899, 0.62, 1], [0.9, 0.67, 1], [0.97, 0.67, 2], [1, 0.58, 1], [1, 0, 1]] },
  jam: { capY: 0.86, crimp: 0.02, knots: [[0, 0, 2], [0, 0.84, 2], [0.04, 1, 2], [0.64, 1, 3], [0.76, 0.9, 2], [0.8, 0.82, 1], [0.859, 0.82, 1], [0.86, 0.9, 1], [0.975, 0.9, 2], [1, 0.82, 1], [1, 0, 1]] },
  jamopen: { capY: 2, crimp: 0, knots: [[0, 0, 2], [0, 0.84, 2], [0.04, 1, 2], [0.7, 1, 3], [0.82, 0.9, 2], [0.88, 0.82, 1], [0.96, 0.82, 2], [1, 0.86, 1], [0.985, 0.79, 1]] },
  pickle: { capY: 0.9, crimp: 0.025, knots: [[0, 0, 2], [0, 0.84, 2], [0.03, 1, 2], [0.76, 1, 3], [0.85, 0.8, 2], [0.899, 0.78, 1], [0.9, 0.86, 1], [0.985, 0.86, 2], [1, 0.78, 1], [1, 0, 1]] },
  honey: { capY: 0.84, crimp: 0, knots: [[0, 0, 2], [0, 0.6, 2], [0.05, 0.8, 2], [0.4, 1, 4], [0.72, 0.8, 3], [0.8, 0.6, 2], [0.839, 0.6, 1], [0.84, 0.68, 1], [0.965, 0.68, 2], [1, 0.58, 1], [1, 0, 1]] },
  tumbler: { capY: 2, crimp: 0, knots: [[0, 0, 2], [0, 0.7, 2], [0.03, 0.8, 2], [0.97, 1, 4], [1, 0.985, 1], [0.99, 0.93, 1]] },
  cloche: { capY: 2, crimp: 0, knots: [[0, 1, 1], [0.3, 1, 2], [0.55, 0.9, 2], [0.75, 0.66, 2], [0.87, 0.38, 2], [0.92, 0.12, 1], [0.925, 0.1, 1], [0.96, 0.17, 2], [0.99, 0.12, 1], [1, 0, 1]] },
  bowl: { capY: 2, crimp: 0, knots: [[0, 0, 2], [0, 0.42, 2], [0.07, 0.5, 2], [0.5, 0.86, 4], [0.96, 1, 3], [1, 0.985, 1], [0.97, 0.94, 1]] },
  champagne: { capY: 0.86, crimp: 0, knots: [[0, 0, 2], [0, 0.8, 2], [0.03, 1, 2], [0.46, 1, 5], [0.74, 0.36, 3], [0.859, 0.33, 1], [0.86, 0.4, 2], [0.93, 0.43, 2], [0.985, 0.5, 1], [1, 0.44, 1], [1, 0, 1]] },
};
function bottleGeometry(profile, seg) {
  const g = new THREE.LatheGeometry(latheProfile(profile.knots), seg);
  const p = g.attributes.position, part = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y >= profile.capY - 1e-5) {
      part[i] = 1;
      if (profile.crimp && y < 0.992) {
        const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 + profile.crimp * Math.cos(a * seg * 0.5);
        p.setXYZ(i, x * k, y, z * k);
      }
    }
  }
  g.setAttribute('aPart', new THREE.BufferAttribute(part, 1));
  g.deleteAttribute('uv');
  return g;
}
// what stands in the door: type table (R and H in metres at the brief's giant scale)
function bottleTypes(variant) {
  const T = [
    { p: 'milk', R: [11.5, 13.5], H: [62, 80], fill: [0.5, 0.7], fizz: 0, liq: [[0.86, 0.9, 0.9, 1]], cap: [[0.55, 0.68, 0.78], [0.82, 0.62, 0.3], [0.7, 0.74, 0.76]] },
    { p: 'swing', R: [9.5, 11.5], H: [76, 90], fill: [0.52, 0.68], fizz: 0, liq: [[0.62, 0.86, 0.3, 0.15], [0.98, 0.6, 0.16, 0.05]], cap: [[0.8, 0.82, 0.8]] },
    { p: 'soda', R: [9, 10.5], H: [70, 86], fill: [0.6, 0.78], fizz: 1, liq: [[0.2, 0.78, 0.92, 0]], cap: [[0.7, 0.76, 0.78], [0.3, 0.72, 0.56]] },
    { p: 'sauce', R: [8.5, 10.5], H: [60, 74], fill: [0.38, 0.62], fizz: 0, liq: [[0.8, 0.33, 0.05, 0.25]], cap: [[0.78, 0.8, 0.8], [0.2, 0.5, 0.55]] },
    { p: 'carafe', R: [13, 15.5], H: [64, 82], fill: [0.42, 0.66], fizz: 0, liq: [[1.0, 0.62, 0.16, 0.1], [0.7, 0.88, 0.36, 0.2], [0.86, 0.9, 0.9, 1]], cap: [[0.74, 0.8, 0.82]] },
  ];
  if (variant === 'party') T[3] = { p: 'champagne', R: [11, 12.5], H: [82, 90], fill: [0.6, 0.72], fizz: 1, liq: [[0.98, 0.8, 0.36, 0]], cap: [[0.86, 0.66, 0.28]] };
  if (variant === 'morning') T[1].liq = [[0.62, 0.86, 0.3, 0.15], [1.0, 0.66, 0.2, 0.1]];
  return T;
}
const STREET_LIQ = [[0.1, 0.34, 0.96, 0], [1.0, 0.62, 0.16, 0.08], [0.92, 0.13, 0.5, 0.04], [0.56, 0.64, 0.12, 0.08], [0.95, 0.1, 0.17, 0.03], [0.62, 0.86, 0.3, 0.15]];   // cobalt, amber, magenta, olive, claret, lime
const EXIT_LIQ = [[0.95, 0.1, 0.17, 0.03], [1.0, 0.62, 0.16, 0.08], [0.1, 0.34, 0.96, 0], [0.56, 0.64, 0.12, 0.08]];
// lays the cast out along the four racks; returns [{ type, x, y, z, R, H, fill, liq, cap, phase, lit, rack }]
function layoutBottles(rng, variant, rackY, topItems, density) {
  const T = bottleTypes(variant), out = [];
  const weights = variant === 'party' ? [2, 1, 2, 5, 1] : variant === 'morning' ? [4, 2, 2, 1, 3] : [3, 2, 3, 2, 2];
  const pickType = () => { let s = 0; for (const w of weights) s += w; let r = rng() * s; for (let i = 0; i < 5; i++) { r -= weights[i]; if (r <= 0) return i; } return 0; };
  const LIT = [0.7, 0.76, 0.86, 1.0];
  for (let k = 0; k < 4; k++) {
    const clear = (k < 3 ? rackY[k + 1] - rackY[k] : DOOR_Y1 - 14 - rackY[k]) - 9;
    const spans = k === ITEM_RACK ? topItems.bottleSpans : [[-118, 118]];
    for (const sp of spans) {
      const row = [];
      let x = sp[0] + rng.range(0.5, 2), ti = pickType(), runLeft = rng.int(1, 3);
      for (let guard = 0; guard < 40; guard++) {
        if (runLeft-- <= 0) { ti = pickType(); runLeft = rng.int(1, 3); }
        if (k === 3 && x > 16 && (ti === 0 || ti === 3)) ti = row.length % 2 ? 2 : 1;      // the hairpin faces this end: colour, not milk
        const t = T[ti], R = rng.range(t.R[0], t.R[1]);
        if (x + 2 * R > sp[1]) { if (sp[1] - x > 18.5) { ti = 3 - (variant === 'party' ? 1 : 0); const t2 = T[ti]; const R2 = Math.min((sp[1] - x) / 2 - 0.3, t2.R[1]); if (R2 >= 8.4) row.push({ ti, R: R2 }); } break; }
        row.push({ ti, R });
        x += 2 * R + rng.range(1.2, 3.6) / clamp(density, 0.7, 1.3);
      }
      // spread the leftover gap evenly, then build
      let used = 0; for (const b of row) used += 2 * b.R;
      const gap = (sp[1] - sp[0] - used) / (row.length + 1);
      let cx = sp[0];
      const hs = row.map((b) => { const t = T[b.ti]; return Math.min(rng.range(t.H[0], t.H[1]), clear); });
      if (k === 0) { hs.sort((a, b) => a - b); for (let i = 0; i < hs.length; i++) hs[i] += (i % 2) * 2.5; }   // stepped silhouettes rising from the latch end
      row.forEach((b, i) => {
        const t = T[b.ti];
        cx += gap + b.R;
        let liq = rng.pick(t.liq), fill = rng.range(t.fill[0], t.fill[1]);
        if (k === 3 && cx > 16) { if (liq[3] > 0.9) liq = t.liq[0]; fill = Math.max(fill, 0.64); }
        // the dive passes the three lower racks close by: there milk gives way to coloured glass (the shapes stay), and the first
        // four on the bottom rack, which stand at the way out, are jewels against the kitchen: claret, amber, cobalt, olive
        if (k < 3 && liq[3] > 0.9) liq = STREET_LIQ[(i * 2 + k * 3 + (cx > 0 ? 1 : 0)) % STREET_LIQ.length];
        const jewel = k === 0 && i < 4;
        if (jewel) { liq = EXIT_LIQ[i]; fill = Math.max(fill, 0.8); }
        out.push({ type: b.ti, profile: t.p, x: cx, y: rackY[k] + 0.2, z: 19 + rng.range(-1.5, 1.5) + (16 - b.R) * 0.25, R: b.R, H: hs[i], fill,
          liq, cap: rng.pick(t.cap), fizz: t.fizz, phase: rng(), lit: LIT[k] * rng.range(0.9, 1.1) * (jewel ? 2 : k < 3 ? 1.25 : 1), rack: k });
        cx += b.R;
      });
    }
  }
  // one more on a short end piece of the bottom rack, past its open end: the last dark neck beside the way out
  out.push({ type: 3, profile: 'sauce', x: END_X, y: rackY[0] + 0.2, z: 23, R: 6.4, H: 55, fill: 0.84, liq: [0.92, 0.13, 0.5, 0.04], cap: [0.78, 0.8, 0.8], fizz: 0, phase: 0.37, lit: 1.6, rack: 0 });
  return out;
}

// ---------------------------------------------------------------- the door: shell, liner, racks, butter box, eggs
// Built in hero-local coordinates with the door shut (inner face toward +Z). aMat: 0 enamel, 1 wire and
// bright metal, 2 eggshell, 3 the butter box's frosted cover, 4 the outer skin.
async function buildDoorGeometry(ctx, rng, rackY, topItems, bottles, bulb) {
  const parts = [];
  const white = new THREE.Color(0.76, 0.81, 0.84), liner = new THREE.Color(0.72, 0.79, 0.83), skin = new THREE.Color(0.7, 0.73, 0.74);
  const wire = new THREE.Color(0.62, 0.7, 0.74), egg = new THREE.Color(0.8, 0.77, 0.72), lid = new THREE.Color(0.5, 0.68, 0.74);
  const add = (g, color, mat, fn) => parts.push(paint(g, color, mat, fn));
  // how much bulb light reaches a point on the liner: bottles and the trays above throw long shadows down it
  const trayShadow = (x, y, z) => {
    let s = 0;
    for (let k = 0; k < 4; k++) {
      const yk = rackY[k]; if (y > yk - 1) continue;
      const reach = y + (bulb[1] - y) * ((35 - z) / Math.max(bulb[2] - z, 1));
      s = Math.max(s, smoothstep(yk - 14, yk + 6, reach));
    }
    return s;
  };
  // (what a bottle lets through is not grey: _hue is the colour of the liquid whose shadow is deepest here, _pool how much of it)
  const _hue = [1, 1, 1]; let _pool = 0;
  const bottleShadow = (x, y) => {
    let s = 0; _hue[0] = _hue[1] = _hue[2] = 1;
    for (const b of bottles) {
      const t = b.z / bulb[2], px = x + (bulb[0] - x) * t, py = y + (bulb[1] - y) * t;
      if (py < b.y - 2 || py > b.y + b.H + 2) continue;
      const hh = (py - b.y) / b.H, w = b.R * (hh < 0.55 ? 1 : lerp(1, 0.42, smoothstep(0.55, 0.78, hh)));
      const dx = Math.abs(px - b.x);
      const v = (1 - smoothstep(w - 2.5, w + 2.5, dx)) * smoothstep(b.y - 2, b.y + 2, py) * (1 - smoothstep(b.y + b.H - 3, b.y + b.H + 2, py));
      if (v > s) {
        s = v; const m = Math.max(b.liq[0], b.liq[1], b.liq[2], 1e-3), wet = hh < b.fill ? 1 : 0.25;
        for (let c = 0; c < 3; c++) _hue[c] = lerp(1, lerp(Math.pow(b.liq[c] / m, 1.5), 1, b.liq[3]), wet);
      }
    }
    return s;
  };
  const linerShade = (x, y, z) => {
    const sT = trayShadow(x, y, z) * 0.9, sB = bottleShadow(x, y);
    _pool = sB * (1 - 0.5 * sT);
    let contact = 1;
    for (let k = 0; k < 4; k++) contact *= 1 - 0.45 * Math.exp(-Math.abs(y - rackY[k] + 1.5) / 4);
    const edge = 1 - 0.3 * Math.exp(-(122 - Math.abs(x)) / 7);
    return lerp(1, 0.6, Math.max(sT, sB * 0.45)) * contact * edge;
  };
  const genericShade = (x, y, z) => lerp(1, 0.5, trayShadow(x, y, Math.min(z, 34)) * 0.85);

  // outer shell and its handle
  add(rbox(0, 210, -19.5, DOOR_W, 400, 29, 7, 2), skin, 4);
  add(rbox(-128, 222, -44, 9, 150, 8, 3.6, 2), wire, 1);
  add(rbox(-128, 160, -37, 7, 11, 9, 2, 1), wire, 1); add(rbox(-128, 284, -37, 7, 11, 9, 2, 1), wire, 1);
  await ctx.yield?.();
  // the liner: back panel with moulded ribs, dike bars and the two cheeks that carry the racks
  const panel = new THREE.PlaneGeometry(246, 358, 60, 110); panel.translate(0, 210, 0);
  await ctx.yield?.();
  { const p = panel.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), x = p.getX(i), ph = ((y - 23) % 26 + 26) % 26;
      const rib = Math.exp(-((ph - 13) * (ph - 13)) / 5.5) * 1.5 * smoothstep(122, 104, Math.abs(x));
      p.setZ(i, -0.6 + rib + 2.2 * Math.exp(-(122 - Math.abs(x)) / 4));
    }
    await ctx.yield?.();
    panel.computeVertexNormals(); }
  // every bottle's shadow on every vertex of the panel: worked out a strip at a time, then painted on
  { const p = panel.attributes.position, shade = new Float64Array(p.count), pool = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      if ((i & 1023) === 0) await ctx.yield?.();
      shade[i] = linerShade(p.getX(i), p.getY(i), p.getZ(i));
      for (let c = 0; c < 3; c++) pool[i * 3 + c] = lerp(1, _hue[c] * 1.7, _pool * 0.9);
    }
    let i = 0; add(panel, liner, 0, () => shade[i++]);
    // behind every bottle the liner carries a pool of that bottle's colour: light that has come through the liquid
    const col = panel.attributes.color;
    for (let k = 0; k < p.count; k++) col.setXYZ(k, col.getX(k) * pool[k * 3], col.getY(k) * pool[k * 3 + 1], col.getZ(k) * pool[k * 3 + 2]); }
  await ctx.yield?.();
  // the hinge side keeps a deep cheek; the latch side has only a slim pilaster and a bracket under each rack, so the rack
  // ends and their bottles stand open to the slot (and nothing more than the door's own edge narrows the bar of light)
  for (const sx of [-1, 1]) {
    if (sx > 0) add(rbox(sx * 128, 210, 14.5, 12, 370, 39, 4.5, 2), white, 0, genericShade);
    else add(rbox(sx * 128, 210, 2, 10, 370, 14, 3.5, 2), white, 0, genericShade);
    add(rbox(sx * 143.5, 210, -4.4, 9, 388, 2.2, 0.8, 1), liner, 0);       // seat for the gasket
    for (let k = 0; k < 4; k++) {                                            // lugs under each rack and a moulded rib above
      if (sx > 0) { add(rbox(sx * 121, rackY[k] - 6, 20, 5, 7, 30, 1.6, 1), white, 0, genericShade); add(rbox(sx * 122.6, rackY[k] + 46, 22, 2.4, 3, 20, 1, 1), liner, 0, genericShade); }
      else { add(rbox(sx * 119, rackY[k] - 6.4, 16, 4.4, 6.4, 36, 1.6, 1), white, 0, genericShade); add(rbox(sx * 119, rackY[k] - 13, 5, 4.4, 9, 12, 1.6, 1), white, 0, genericShade); }
    }
    await ctx.yield?.();
  }
  add(rbox(0, 389, 3.5, 246, 12, 17, 3.5, 2), white, 0); add(rbox(0, 31, 3.5, 246, 12, 17, 3.5, 2), white, 0, genericShade);
  add(rbox(0, 403.5, -4.4, 296, 9, 2.2, 0.8, 1), liner, 0); add(rbox(0, 16.5, -4.4, 296, 9, 2.2, 0.8, 1), liner, 0);
  // racks: tray, front lip, wire guard rails with posts
  for (let k = 0; k < 4; k++) {
    await ctx.yield?.();
    const y = rackY[k];
    add(rbox(0.5, y - 1.6, 19.5, 242, 3.2, 33, 1.3, 1), white, 0, (x, yy, z) => (yy > y - 1 ? 0.55 : 0.8) * genericShade(x, yy - 3, z));
    add(rbox(0.5, y + 4, 35, 242, 11.5, 2.6, 1.2, 2), white, 0, (x, yy, z) => genericShade(x, yy, z) * (0.82 + 0.18 * smoothstep(y - 2, y + 9, yy)));
    add(rbox(-119.3, y + 4, 19.5, 2.4, 11.5, 33, 1.1, 1), white, 0, (x, yy, z) => genericShade(x, yy, z) * (0.82 + 0.18 * smoothstep(y - 2, y + 9, yy)));   // the open end's low wall
    for (let r = 0; r < 2; r++) {
      const ry = y + (r ? 37 : 22), rr = r ? 1.0 : 0.85, zf = 37.2;
      const sh = (x, yy, z) => lerp(1, 0.55, trayShadow(x, yy, 34) * 0.8);
      add(rod([-117, ry, zf], [117, ry, zf], rr, 7), wire, 1, sh);
      for (const sx of [-1, 1]) { add(rod([sx * 117, ry, zf], sx > 0 ? [sx * 123, ry, 27] : [-121, ry, 8.6], rr, 7), wire, 1, sh); add(knob(sx * 117, ry, zf, rr * 1.12), wire, 1, sh); }
    }
    // under each tray: moulded ribs and a drip bead, so the underside is never a bare slab when the dive passes beneath it
    for (let i = 0; i < 20; i++) add(rbox(-110 + i * 11.6, y - 4.3, 19.5, 2, 2.6, 30, 0.8, 1), white, 0, (x, yy, z) => 0.74 * genericShade(x, yy - 3, z));
    add(rbox(0.5, y - 3.9, 34.6, 240, 1.8, 1.8, 0.7, 1), white, 0, (x, yy, z) => 0.9 * genericShade(x, yy - 3, z));
    if (k === 0) {
      // the end piece: a short tray past the open end, with its own lip and one rail
      const sh2 = (x, yy, z) => genericShade(x, yy, z) * (0.82 + 0.18 * smoothstep(y - 2, y + 9, yy));
      add(rbox(END_X - 0.5, y - 1.6, 21, 22, 3.2, 30, 1.3, 1), white, 0, (x, yy, z) => (yy > y - 1 ? 0.55 : 0.8) * genericShade(x, yy - 3, z));
      add(rbox(END_X - 0.5, y + 4, 35, 22, 11.5, 2.6, 1.2, 2), white, 0, sh2);
      add(rbox(END_X - 11, y + 4, 21, 2.4, 11.5, 30, 1.1, 1), white, 0, sh2);
      add(rod([END_X - 11, y + 22, 37.2], [-117, y + 22, 37.2], 0.85, 7), wire, 1); add(rod([END_X - 11, y + 22, 37.2], [END_X - 10, y + 22, 8], 0.85, 7), wire, 1); add(knob(END_X - 11, y + 22, 37.2, 0.95), wire, 1);
      add(rod([END_X - 11, y + 9, 36.6], [END_X - 11, y + 22, 37.2], 0.75, 6), wire, 1);
    }
    await ctx.yield?.();
    const posts = 8 + (k % 2);
    for (let i = 0; i <= posts; i++) {
      const x = -112 + (224 * i) / posts;
      add(rod([x, y + 9, 36.6], [x, y + 37, 37.2], 0.75, 6), wire, 1, (xx, yy, z) => lerp(1, 0.55, trayShadow(xx, yy, 34) * 0.8));
      add(knob(x, y + 37, 37.2, 1.15), wire, 1); add(knob(x, y + 22, 37.0, 1.0), wire, 1);
    }
  }
  await ctx.yield?.();
  // rack furniture: the covered butter box and the egg tray of twelve domes
  const y3 = rackY[ITEM_RACK], bx = topItems.butterX, ex = topItems.eggX;
  add(rbox(bx, y3 + 8, 19, 66, 16, 29, 2.2, 2), white, 0);
  add(rbox(bx, y3 + 27, 19, 63, 23, 27.5, 7, 2), lid, 3);
  add(rbox(bx, y3 + 18.5, 33.8, 16, 4.2, 2.6, 1.1, 1), white, 0);
  add(rbox(bx, y3 + 17, 19, 65.4, 2.2, 29.4, 1, 1), white, 0);
  for (let i = -2; i <= 2; i++) add(rbox(bx + i * 11, y3 + 38.4, 19, 2.2, 1.6, 20, 0.7, 1), lid, 3);
  add(rbox(bx, y3 + 30, 33.2, 40, 1.6, 1.4, 0.6, 1), lid, 3);
  for (const sx of [-1, 1]) add(rbox(bx + sx * 24, y3 + 20, 5.6, 7, 6, 2.4, 1, 1), wire, 1);
  add(rbox(ex, y3 + 3.6, 19, 100, 7.2, 29, 1.8, 2), white, 0, (x, yy, z) => {
    let d = 1e9; for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) d = Math.min(d, Math.hypot(x - (ex - 40 + i * 16), z - (12 + j * 14)));
    return yy > y3 + 6 ? 0.5 + 0.5 * smoothstep(6, 9.5, d) : 0.9;
  });
  await ctx.yield?.();
  const eggPts = []; for (let i = 0; i <= 11; i++) { const t = (i / 11) * Math.PI, yy = 8.6 * (1 - Math.cos(t)); eggPts.push(new THREE.Vector2(Math.max(6.7 * Math.sin(t) * (1 - 0.014 * yy), 1e-3), yy)); }
  const eggG = new THREE.LatheGeometry(eggPts, 20);
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) {
    const g = eggG.clone(); g.rotateY(rng() * TAU); g.rotateZ(rng.range(-0.06, 0.06)); g.translate(ex - 40 + i * 16 + rng.range(-0.3, 0.3), y3 + 2.4, 12 + j * 14);
    const tint = _c.copy(egg).multiplyScalar(rng.range(0.92, 1.05)).clone();
    add(g, tint, 2, (x, yy) => 0.6 + 0.4 * smoothstep(y3 + 5, y3 + 13, yy));
  }
  await ctx.yield?.();
  const merged = mergeGeometries(parts, false);
  for (const g of parts) g.dispose();
  return merged;
}

// the cabinet's front flange (the edge the gasket seals on) and the glass shelves whose front edges the fog pours over
function buildFrameGeometry() {
  const parts = [], white = new THREE.Color(0.76, 0.81, 0.84);
  const add = (g, k = 1) => parts.push(paint(g, white, 0, k === 1 ? null : () => k));
  add(rbox(-145.6, 210, 9, 8.8, 420, 18, 2.6, 2)); add(rbox(144.5, 210, 9, 11, 420, 18, 2.6, 2));
  add(rbox(0, 410.5, 9, 278, 19, 18, 2.6, 2)); add(rbox(0, 9.5, 9, 278, 19, 18, 2.6, 2));
  for (let y = 36; y < 400; y += 26) add(rbox(-145.6, y, 9, 9.3, 1.7, 18.5, 0.7, 1), 0.9);       // moulded ribs on the latch-side post
  // moulded bead round the mouth
  add(rbox(-142.6, 210, 17, 2.8, 386, 3.2, 1.3, 1), 0.92); add(rbox(140.2, 210, 17, 3.2, 386, 3.2, 1.4, 1), 0.92);
  add(rbox(0, 402.4, 17, 282, 3.2, 3.2, 1.4, 1), 0.92); add(rbox(0, 17.6, 17, 282, 3.2, 3.2, 1.4, 1), 0.92);
  const merged = mergeGeometries(parts, false);
  for (const g of parts) g.dispose();
  return merged;
}

// ---------------------------------------------------------------- materials
const FOG_U = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
function enamelMaterial(U, frost) {
  return new THREE.ShaderMaterial({
    fog: true, vertexColors: true,
    uniforms: { ...FOG_U(), ...U, uFrost: { value: frost } },
    vertexShader: /* glsl */`
      attribute float aMat; varying vec3 vW, vN, vCol; varying float vMat;
      ${GLSL_FOG_PARS_VERT}
      void main(){
        vCol = color; vMat = aMat;
        vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix)*normal;
        vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
        ${GLSL_FOG_VERT}
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN, vCol; varying float vMat; uniform float uFrost;
      ${GLSL_HASH}${GLSL_VALUE_NOISE}${GLSL_FBM}${GLSL_LIGHT}${GLSL_BEADS}${GLSL_FOG_PARS_FRAG}
      void main(){
        vec3 N = vN/max(length(vN), 1e-4);
        vec3 Vv = cameraPosition - vW; float dist = max(length(Vv), 1e-3); vec3 V = Vv/dist;
        vec3 P = vW - uOrigin;
        float isWire = step(.5, vMat)*step(vMat, 1.5), isEgg = step(1.5, vMat)*step(vMat, 2.5), isLid = step(2.5, vMat)*step(vMat, 3.5), isSkin = step(3.5, vMat);
        float enamel = 1. - isWire - isEgg - isLid;
        vec3 an = abs(N);
        vec2 uv = (an.z > an.x && an.z > an.y) ? P.xy : (an.x > an.y ? P.zy : P.xz);
        float mpp = max(length(fwidth(vW)), 1e-4);
        float near = 1. - smoothstep(110., 300., dist);
        float fr = smoothstep(.5, .78, fbm(uv*.035 + 3.7))*uFrost*enamel*(1. - isSkin);
        // (a varying can overshoot at a sliver's edge: the paint's colour is never below black)
        vec3 alb = mix(clamp(vCol, 0., 1.7), vec3(.84, .9, .94), fr*.55);
        float grain = vnoise(uv*2.3)*.55 + vnoise(uv*8.7)*.45;
        alb *= 1. - fr*.3*grain*near;
        // in the door's shade the enamel is never a blank: fine moulded reeding, a film of condensation that gathers and runs,
        // and (below) every bead of it holds a point of the light from across the canyon
        float shade_ = enamel*(1. - isSkin)*(1. - lcHood(vW))*uBulb*near;
        float reed = smoothstep(.5, 1., cos(uv.y*6.2832/6.5))*step(an.y, .5);
        float film = vnoise(uv*.07 + 5.1)*.6 + vnoise(uv*.23 + 1.3)*.4;
        float runs = smoothstep(.62, .9, vnoise(vec2(uv.x*.42, uv.y*.012 + 3.)))*smoothstep(.3, .7, vnoise(vec2(uv.x*.06 + 9., uv.y*.02)))*step(an.y, .5);
        alb *= 1. - shade_*(.22*reed + .3*(film - .5) + .14*runs);
        // rime: by the back plate and in the frosted corner every ledge carries a crust on its upper side
        float zone = max(smoothstep(186., 230., P.z), (1. - smoothstep(-143., -124., P.x))*smoothstep(70., 170., P.z)*smoothstep(225., 300., P.y));
        // the post beside the way out (the latch-side edge of the cabinet's mouth, its whole height): 1 on it, 0 elsewhere.
        // -140.6..-139.6 lies between the post's ribs (out to x -140.95) and the ends of the top and bottom bars (from x -139);
        // 19..21 is just past the moulded bead on its box side (to z 18.6); -2 is in front of its face (z 0)
        float post = (1. - smoothstep(-140.6, -139.6, P.x))*(1. - smoothstep(19., 21., P.z))*step(-2., P.z)*enamel*(1. - isSkin);
        // the ends of the bars beside it keep their patches of rime; the post itself carries none (see below)
        zone = max(zone, .9*(1. - post)*(1. - smoothstep(-141., -136., P.x))*(1. - smoothstep(19., 25., P.z))*step(-2., P.z)*smoothstep(.34, .6, fbm(vec2(P.y*.035, (P.x + P.z)*.15) + 5.3)));
        float rime = zone*enamel*(1. - isSkin)*clamp(.38 + .62*smoothstep(-.3, .45, N.y) + (fbm(uv*.23 + 11.3) - .5)*1.5, 0., 1.)*(.7 + .3*uFrost);
        float crust = smoothstep(.25, .75, vnoise(uv*.8 + 3.1)*.6 + vnoise(uv*2.9)*.4);
        alb = mix(alb, vec3(.88, .94, .97)*(.5 + .5*crust)*(.8 + .2*grain), rime);
        N = N + (rime*.55)*(vec3(vnoise(uv*1.4 + 1.7), vnoise(uv*1.4 + 8.3), vnoise(uv*1.4 + 15.1)) - .5); N = N/max(length(N), 1e-3);
        vec3 bd = lcBeads(uv/1.7, .36*(1. - fr), uTime*.3, mpp/1.7)*(enamel + isLid)*(1. - isSkin)*step(an.y, .8)*near;
        float gloss = 36., spec = .3;
        gloss = mix(gloss, 150., isWire); spec = mix(spec, 1.8, isWire);
        gloss = mix(gloss, 12., isEgg); spec = mix(spec, .1, isEgg);
        spec = mix(spec, .9, isLid);
        vec3 col = lcShade(vW, N, V, alb*(1. - bd.z*.3), gloss, spec + bd.y*1.4);
        col += uWarmCol*(uWarm*(lcBar(P) + lcOutside(P)*.5)*bd.y*.5);
        col += mix(uGreenCol, uBulbCol, .5)*(shade_*(bd.y*1.1 + bd.x*.05 + .05*runs*film));
        // eggs are pale things: in the door's shade they keep a warm bloom of their own, lighter on top
        col += alb*vec3(1., .86, .66)*(isEgg*uBulb*(.1 + .2*smoothstep(-.2, .9, N.y)));
        float fres = pow(max(1. - abs(dot(N, V)), 0.), 2.5);
        vec3 Lb = uBulbPos - vW; float att = lcBulbAtt(length(Lb));
        col += uBulbCol*(uBulb*att*fres*(isLid*.55 + isWire*.75 + isEgg*.16 + enamel*.07));
        col += uBulbCol*(uBulb*att*rime*(1.5*smoothstep(.87, .97, vnoise(uv*4.3 + V.xy*5.)) + .45*fres + .22*crust)) + uDiodeCol*(uDiode*(1. - uBulb)*rime*.5*smoothstep(.9, .98, vnoise(uv*4.3 + V.xy*5. + 3.)));
        col += uWarmCol*(uWarm*uBar.w*fres*isWire*.5*clamp(dot(N, LC_KITCHEN) + .4, 0., 1.));
        // THE CABINET'S EDGE BESIDE THE WAY OUT. The last stretch of the flight passes this post close by, so here the enamel is
        // shaded the way the rest of the box shades glass: a clean backlit shape. Across its 18 m, from the edge turned to the
        // box and its bulb to the edge turned to the slot: a white rim, white enamel, enamel going blue, deep teal shade, and then
        // the kitchen's colour laid on the bevel and the strip that face the slot (as much of it as lcBar lets through there:
        // none below the gasket's peel front). The moulded ribs are thin lines of light with teal under each; a crust of frost
        // needles grows in from the box side at the three shelf levels; beads of condensation gather under the ribs and a few
        // run. No speckle. It is a rule of the surface (where on the cabinet, which way it is turned, how much of the bar
        // reaches it) and knows nothing of the eye or of the flight.
        if (post > .001) {
          float gz = clamp(P.z/18., 0., 1.);                                           // 18 m: the post's depth in z
          float turn = clamp(N.z*1.2 + (1. - abs(N.z))*(gz*2. - 1.), -1., 1.);         // -1 turned to the slot .. +1 turned to the box
          float wWarm = 1. - smoothstep(-.98, -.55, turn), wLit = smoothstep(-.35, .45, turn), rimK = smoothstep(.8, .9, turn);
          float attP = lcBulbAtt(length(uBulbPos - vW)), kB = uBulb*(.5 + .9*attP);
          vec3 shadeC = mix(uDarkCol*.5, uShadowCol*uKey.y, uBulb);
          vec3 teal = shadeC*1.15 + uBulbCol*vec3(.42, .78, .9)*(uBulb*.1*exp(-max(P.y, 0.)/105.));   // the shade, lifted a little by the fog on the floor as everything low in the canyon is
          vec3 blue = uBulbCol*vec3(.2, .46, .78)*(kB*.42) + shadeC*.6;
          vec3 white = uBulbCol*vec3(.9, .95, 1.)*(kB*.9);
          vec3 pc = mix(mix(teal, blue, smoothstep(-.62, -.15, turn)), white, wLit);
          // the ribs: one every 26 m from y 36 (buildFrameGeometry), each 1.7 m tall; its shadow lies under it for a few metres
          float ph = mod(P.y - 23., 26.) - 13.;
          float onRib = 1. - smoothstep(.6, 1., abs(ph)), under = smoothstep(.8, 1.3, -ph)*(1. - smoothstep(1.3, 7.5, -ph));
          pc = mix(pc, teal*.85, under*.8);
          // frost where the post stands level with the shelves (SHELF_TOPS): needles radiating from its box-side edge, the enamel
          // between them in their blue shade
          float y0 = P.y < 162.5 ? 110. : (P.y < 267.5 ? 215. : 320.);
          vec2 fq = vec2(19.5 - P.z, P.y - y0 + 2.); float fl = max(length(fq), .05), fa = atan(fq.y, max(fq.x, 1e-3));
          float c1 = fa*10. + y0*.37, h1 = hash11(floor(c1)*1.7 + 3.1), reach1 = 8. + 8.*h1*h1, w1 = .42*max(1. - fl/reach1, 0.), a1 = clamp(mpp*10./fl, 1e-3, .5);
          float c2 = fa*23. + y0*.91 + 4., h2 = hash11(floor(c2)*2.3 + 7.7), reach2 = 6. + 6.*h2, w2 = .36*max(1. - fl/reach2, 0.), a2 = clamp(mpp*23./fl, 1e-3, .5);
          float needle = (1. - smoothstep(w1 - a1, w1 + a1, abs(fract(c1) - .5)))*step(fl, reach1)*step(.15, h1)
                       + .8*(1. - smoothstep(w2 - a2, w2 + a2, abs(fract(c2) - .5)))*step(fl, reach2)*step(.2, h2);
          // a solid crust at the root of the needles (to 4-8 m) and on up and down the box-side edge for a dozen metres, and
          // round it the crust's blue shade on the enamel, which is what shows white frost on white enamel
          float lump = vnoise(vec2(P.y, P.z)*.6) - .5;
          float crustK = max(1. - smoothstep(3.5, 7.5, fl + lump*3.5), (1. - smoothstep(.8, 3. + 2.5*lump, 19.5 - P.z))*(1. - smoothstep(8., 20., abs(P.y - y0 + 2.))));
          float frostK = clamp(needle + crustK, 0., 1.), envK = (1. - smoothstep(7.5, 12.5, fl + lump*3.5))*(1. - frostK);
          pc *= mix(vec3(1.), vec3(.34, .54, .82), envK*.85);
          vec3 warm = uWarmCol*(uWarm*(lcBar(P)*1.05 + lcOutside(P)*.55));
          float cry = vnoise(vec2(P.z, P.y)*2.1 + 3.)*.6 + vnoise(vec2(P.z, P.y)*5.7)*.4;
          pc = mix(pc, uBulbCol*vec3(.92, .97, 1.)*(kB*(.8 + .45*wLit)*(.72 + .5*cry)*(.84 + .3*smoothstep(-1., 1., fq.y/fl))) + shadeC*.8, frostK*.94);   // lit from above: the crust's upper half is the brighter
          pc += uBulbCol*(kB*1.3*frostK*smoothstep(.88, .97, vnoise(vec2(P.z, P.y)*3.3 + V.xy*5.)));
          // the rim down the edge that faces the bulb, and the kitchen's colour on the side that faces the slot
          pc = mix(pc, uBulbCol*(kB*1.4), rimK*(1. - .5*under));
          pc = mix(pc, pc*.3 + warm*vec3(.84, .82, .8), wWarm);
          pc = mix(pc, pc + uBulbCol*(kB*(.2 + .75*wLit)) + warm*(wWarm*.5), onRib);
          // condensation: a row of beads gathered under each rib, and the few that run
          float gather = smoothstep(.8, 1.2, -ph)*(1. - smoothstep(2.4, 4.4, -ph));
          vec3 bdp = lcBeads(uv/1.5, .6*gather, uTime*.3, mpp/1.5)*(near*step(an.y, .8));
          pc = pc*(1. - bdp.z*.25) + (uBulbCol*(kB*(.45 + .8*wLit)) + warm*wWarm)*(bdp.y*1.3);
          col = mix(col, pc, post*uBulb);
        }
        gl_FragColor = vec4(fxApplyFog(max(col, vec3(0.))), 1.);
      }`,
  });
}

function glassMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, premultipliedAlpha: true, depthWrite: true,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: { ...FOG_U(), ...U },
    vertexShader: /* glsl */`
      attribute float aPart; attribute vec3 aBase; attribute vec4 aDim, aLiq, aCap; attribute vec2 aFx;
      uniform vec4 uSlosh; uniform float uTime;
      varying vec3 vW, vN, vO; varying float vPart;
      flat varying vec4 vDim, vLiq, vCap, vTilt; flat varying vec3 vAxis; flat varying vec2 vLean;
      ${GLSL_FOG_PARS_VERT}
      void main(){
        float R = max(aDim.x, .1), H = max(aDim.y, .1), ph = aDim.w;
        float ca = cos(ph*6.2832), sa = sin(ph*6.2832);
        vec3 p = vec3(position.x*R, position.y*H, position.z*R);
        vec3 n = vec3(normal.x/R, normal.y/H, normal.z/R);
        n = n/max(length(n), 1e-6);
        vO = p; vPart = aPart;
        p.xz = mat2(ca, sa, -sa, ca)*p.xz; n.xz = mat2(ca, sa, -sa, ca)*n.xz;
        vec2 lean = uSlosh.z*vec2((fract(ph*3.71) - .5)*.7, .6 + .8*fract(ph*7.13));
        p.xz += p.y*lean;
        vec4 w = modelMatrix*vec4(aBase + p, 1.);
        mat3 m3 = mat3(modelMatrix);
        vW = w.xyz; vN = m3*n;
        vAxis = (modelMatrix*vec4(aBase, 1.)).xyz;
        vLean = (m3*vec3(lean.x, 0., lean.y)).xz;
        float s = mix(uSlosh.x, uSlosh.y, fract(ph*5.3));
        vec2 dir = normalize(vec2((fract(ph*9.7) - .5)*1.3, 1.));
        vec2 tilt = dir*s*.2 + uSlosh.w*vec2(sin(uTime*(2.1 + 2.*fract(ph*11.3)) + ph*50.), cos(uTime*(1.7 + 2.*fract(ph*13.1)) + ph*31.));
        vTilt = vec4((m3*vec3(tilt.x, 0., tilt.y)).xz, aFx.y, aFx.x);
        vDim = aDim; vLiq = aLiq; vCap = aCap;
        vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
        ${GLSL_FOG_VERT}
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN, vO; varying float vPart;
      flat varying vec4 vDim, vLiq, vCap, vTilt; flat varying vec3 vAxis; flat varying vec2 vLean;
      ${GLSL_HASH}${GLSL_LIGHT}${GLSL_BEADS}${GLSL_FOG_PARS_FRAG}
      void main(){
        vec3 N = vN/max(length(vN), 1e-4);
        vec3 Vv = cameraPosition - vW; float dist = max(length(Vv), 1e-3); vec3 V = Vv/dist;
        vec3 P = vW - uOrigin;
        float lit = vTilt.z, fizz = vTilt.w, R = vDim.x, H = vDim.y;
        vec3 Lb = uBulbPos - vW; float db = max(length(Lb), 1.); Lb /= db; float att = lcBulbAtt(db)*lit;
        vec3 Ld = uDiodePos - vW; Ld = Ld/max(length(Ld), 1.);
        float mpp = max(length(fwidth(vW)), 1e-4);
        vec3 col, glow = vec3(0.); float alpha; float dio = uDiode*(1. - .85*uBulb);
        if (vPart > .5) {
          // pressed metal: a crimped skirt, a rolled edge, the dark box mirrored below and the lit ceiling above
          float angc = atan(vO.z, vO.x + ((abs(vO.x) + abs(vO.z)) < 1e-4 ? 1e-3 : 0.));
          vec3 Tc = cross(vec3(0., 1., 0.), N); Tc = Tc/max(length(Tc), 1e-3);
          float skirt = 1. - smoothstep(.3, .65, abs(N.y));
          float nC = max(floor(R*3.), 16.);
          float cfade = 1. - smoothstep(.2, .6, mpp*nC/max(R, 1.));
          N = normalize(N + Tc*(sin(angc*nC)*.26*skirt*cfade));
          vec3 capc = vCap.rgb*(.42 + .58*lit);
          // the flat of the lid is stamped: two shallow rings and a dished middle
          float rr = length(vO.xz)/max(R, .1), flatTop = smoothstep(.86, .97, N.y);
          vec2 rd2 = vO.xz/max(length(vO.xz), 1e-3);
          N = normalize(N + vec3(rd2.x, 0., rd2.y)*(flatTop*(.15*sin(rr*34.)*smoothstep(.12, .2, rr) + .12)));
          vec3 Rf = reflect(-V, N);
          float sky = smoothstep(-.4, .6, Rf.y), toBulb = max(dot(Rf, Lb), 0.);
          float tb2 = toBulb*toBulb, tb8 = tb2*tb2*tb2*tb2;
          // bright metal is dark where it mirrors the shade and burns where it mirrors the light. Round the skirt: the lit side
          // of the box as one soft band and the bulb as one hard line down it. On the turned flat of the top: the bulb drawn out
          // into two bright wedges across the disc, as on any lathe-turned lid
          vec3 Rh = vec3(Rf.x, 0., Rf.z); Rh = Rh/max(length(Rh), 1e-3);
          vec3 Lh0 = vec3(Lb.x, 0., Lb.z); Lh0 = Lh0/max(length(Lh0), 1e-3);
          float rb = max(dot(Rh, Lh0), 0.), rb2 = rb*rb, rb8 = rb2*rb2*rb2*rb2, rb64 = rb8*rb8*rb8*rb8*rb8*rb8*rb8*rb8;
          vec3 Hb0 = normalize(Lb + V + vec3(0., 1e-3, 0.));
          float th = dot(vec3(-rd2.y, 0., rd2.x), Hb0), bow = pow(max(1. - th*th, 0.), 90.)*smoothstep(.1, .24, rr)*(1. - smoothstep(.86, .96, rr))*max(dot(N, Hb0), 0.);
          vec3 shade = mix(uDarkCol*.4, uShadowCol*(uKey.y*.5), uBulb);
          vec3 env = shade*(.2 + .5*sky) + uBulbCol*(uBulb*att*(skirt*(.16*sky + 1.1*rb8*rb2 + 7.*rb64*rb64) + flatTop*(.22*sky + 2.4*bow) + .5*tb8 + 5.*tb8*tb8*tb8*tb8));
          col = lcShade(vW, N, V, capc*.1, 220., 5.*lit) + mix(capc, vec3(.85, .9, .92), .3)*env; alpha = 1.;
          float fr = pow(max(1. - abs(dot(N, V)), 0.), 3.);
          float roll = smoothstep(.34, .55, abs(N.y))*(1. - smoothstep(.55, .8, abs(N.y)));
          col *= 1. - .55*smoothstep(.8, .9, abs(N.y))*(1. - smoothstep(.9, .97, abs(N.y)));          // a dark seam inside the rolled edge
          col += uBulbCol*(uBulb*att*(fr*.8 + roll*.6*(.4 + .6*sky))) + uWarmCol*(uWarm*uBar.w*(fr*.45 + roll*.2)*(1. + uDark.y)*clamp(dot(N, LC_KITCHEN) + .5, 0., 1.));
          col += uDiodeCol*(dio*(fr*.2 + (1. - uBulb)*(.05*sky*sky + .12*roll))) + uWarmCol*(uDark.x*(fr*.3 + roll*.12)*lcLeak(P));
        } else {
          float hN = vO.y/H;
          float ang = atan(vO.z, vO.x + ((abs(vO.x) + abs(vO.z)) < 1e-4 ? 1e-3 : 0.));
          float band = smoothstep(.53, .565, hN)*(1. - smoothstep(.69, .735, hN));
          vec3 T = cross(vec3(0., 1., 0.), N); T = T/max(length(T), 1e-3);
          float nRib = max(floor(R*1.5), 8.);
          float ribFade = 1. - smoothstep(.25, .7, mpp*nRib/max(R, 1.));
          vec3 Ng = N;                                           // the smooth wall, before the flutes
          N = normalize(N + T*(sin(ang*nRib)*.15*band*ribFade));   // (shallow: a deep flute splits the bulb's streak into the tines of a fork)
          // the flutes catch small lights of their own, but the body, its rim and its edges are those of the smooth wall:
          // no closed white outlines inside the glass
          float ndv = abs(dot(Ng, V)), fres = pow(max(1. - mix(ndv, abs(dot(N, V)), .22), 0.), 2.4);
          vec2 rel = vW.xz - (vAxis.xz + (vW.y - vAxis.y)*vLean);
          float planeY = vAxis.y + vDim.z*H + dot(vTilt.xy, rel);
          float below = planeY - vW.y;
          float inLiq = smoothstep(-mpp, mpp, below);
          vec3 D = -V; float den = D.y - dot(vTilt.xy, D.xz); den = abs(den) < 1e-3 ? 1e-3 : den;
          float t = below/den;
          float surf = step(0., t)*(1. - smoothstep(R*.84, R*.93, length(rel + D.xz*t)));
          vec3 liq = max(vLiq.rgb, vec3(1e-3)); float milk = vLiq.a;
          float depth = max(below, 0.);
          float topGlow = exp(-depth/(H*.3));
          // across the bottle: side is +1 where the wall faces the bulb, -1 where it is turned away
          vec3 Nh = vec3(N.x, 0., N.z); Nh = Nh/max(length(Nh), 1e-3);
          vec3 Lh = vec3(Lb.x, 0., Lb.z); Lh = Lh/max(length(Lh), 1e-3);
          float side = dot(Nh, Lh), toward = smoothstep(-.95, .5, side);
          // absorption by thickness: thin liquid at the flanks is pale and full of light, the thick middle deep and saturated,
          // and deeper still far below the surface; a dark line of bent light runs just inside each edge
          float thick = smoothstep(0., .95, ndv);
          vec3 trans = pow(liq, vec3(.62 + 1.7*thick + .5*(1. - topGlow)));
          vec3 clearT = trans*(mix(1.6, .8, thick)*(.62 + .78*toward));
          vec3 milkT = liq*((.62 + .26*ndv)*(.7 + .6*toward));
          vec3 tint = mix(clearT, milkT, milk)*mix(.3, 1., smoothstep(.02, .24, ndv));
          // within 30 m of the eye no veil of bloom lies on a jar (see the end of this shader), so its liquid carries that
          // light itself, in its own colour: half as much again at 30 m and nearer, as live from 75 m (half the avenue)
          float nearG = uBulb*(1. - smoothstep(30., 75., dist));
          tint *= 1. + .5*nearG;
          // what stands behind a bottle is bent into upright bands that waver as the liquid trembles
          float wav = sin(ang*5. + 2.2*sin(vO.y*.21 + uTime*.35 + vDim.w*40.) + vDim.w*9.)*.5 + .5;
          tint *= mix(1., .72 + .5*wav*wav, (1. - milk)*smoothstep(.25, .8, ndv));
          // and its neighbours show through it as soft upright bands of their own colours
          float bx = ang*1.3 + vDim.w*7. + .22*sin(vO.y*.13 + uTime*.3 + vDim.w*20.), bh = hash11(floor(bx)*3.7 + vDim.w*23.);
          float bm = (1. - smoothstep(.1, .38, abs(fract(bx) - .5)))*step(.4, bh);
          vec3 nb = bh < .62 ? vec3(.55, 1., .2) : (bh < .82 ? vec3(1., .55, .1) : vec3(.12, .8, 1.));
          tint = mix(tint, nb*(max(liq.r, max(liq.g, liq.b))*.8), bm*.22*(1. - milk)*smoothstep(.3, .8, ndv)*step(liq.r, liq.g + liq.b));
          float bar = lcBar(P);
          float slot = uBar.w*min(exp(-(P.x + 150.)/170.), 1.);
          float floorGlow = uBulb*exp(-max(P.y, 0.)/150.);          // the tray of fog on the canyon floor lights the glass above it
          vec3 E = uBulbCol*(uBulb*att*(.5 + .82*topGlow)) + mix(uDarkCol*.4, uShadowCol*(1.1*uKey.y), uBulb)
                 + uBulbCol*vec3(.45, .8, .92)*(floorGlow*.34) + mix(uGreenCol, uBulbCol, .45)*(uBulb*.16*smoothstep(75., 45., P.z)) + uWarmCol*(uWarm*(bar*1.2 + .22*slot));
          vec3 surfCol = liq*E*1.35 + uBulbCol*(uBulb*att*.22);
          // the empty glass above the liquid: clear in the middle, a dark line inside each edge, and the room's light and
          // shade drawn out into upright streaks that slide round it as the eye moves
          float e1 = 1. - ndv, vang = atan(V.z, V.x + ((abs(V.x) + abs(V.z)) < 1e-4 ? 1e-3 : 0.));
          float st1 = smoothstep(.72, .97, sin((ang - vang)*2. + vDim.w*17.)*.5 + .5), st2 = smoothstep(.8, .98, sin((ang - vang)*5. + vDim.w*29. + 1.3)*.5 + .5);
          float edgeDark = smoothstep(.45, .8, e1)*(1. - smoothstep(.86, .97, e1));
          vec3 roomLight = uBulbCol*(uBulb*att*(.5 + .5*toward)) + uWarmCol*(uWarm*(bar*.8 + .3*slot)) + uDiodeCol*(dio*.05);
          vec3 emptyCol = mix(vec3(.4, .72, .8)*E*.12, roomLight*vec3(.82, .95, 1.), clamp(st1*.38 + st2*.16, 0., 1.))*(1. - .85*edgeDark);
          float emptyA = clamp(.06 + .1*e1 + .6*edgeDark + .13*st1 + .06*st2, 0., 1.);
          col = mix(emptyCol, tint*E, inLiq);
          // the dark line inside the edge that is turned from the bulb takes the look's shade: deep teal, not black
          col += lcShadeRoot()*(uBulb*inLiq*(1. - toward)*(1. - smoothstep(.02, .3, ndv))*(1. - milk));
          alpha = mix(emptyA, mix(.95, 1., milk), inLiq);
          float above = 1. - inLiq;
          col = mix(col, surfCol, surf*above*.92); alpha = max(alpha, surf*above*.9);
          col = mix(col, surfCol*1.15 + uBulbCol*(uBulb*att*.15), surf*inLiq*.55);
          // the meniscus: one bright line where the liquid climbs the glass, a darker band just under it
          float men = 1. - smoothstep(.12, .42 + mpp, abs(below));
          float menShade = smoothstep(.3, .9, below)*(1. - smoothstep(1.2, 3.2, below));
          col *= 1. - .3*menShade*(1. - milk);
          glow += uBulbCol*(uBulb*att*men*(.55 + .7*toward)) + liq*uBulbCol*(uBulb*att*men*.5) + uDiodeCol*(dio*men*.06);
          if (fizz > .5 && fizz < 1.5) {
            // fizz: a few chains of bubbles of every size, swelling as they climb; each a dark ring with a point of light
            float nB = max(floor(R*.9), 5.);
            float cx = ang/6.2832*nB, id = floor(cx), cw = 6.2832*R/nB, fxx = (fract(cx) - .5)*cw;
            float hCol = hash11(id + vDim.w*91.), fillH = max(vDim.z*H, 1.), ringB = 0., pinB = 0., coreB = 0.;
            for (int i = 0; i < 9; i++) {
              float fi = float(i), hb = hash11(id*3.1 + fi*7.7 + vDim.w*13.);
              float yb = fract(uTime*(.03 + .035*hCol) + fi*.111 + hb*.07 + hCol*3.1);
              float rb = (.13 + .36*yb)*(.5 + 1.1*hb*hb);
              vec2 q = vec2(fxx - (hCol - .5)*cw*.3 - sin(yb*17. + fi*2.1 + hCol*40.)*(.2 + .55*yb), depth - (1. - yb)*fillH);
              float dd = length(q);
              ringB += (1. - smoothstep(rb, rb + mpp, dd))*smoothstep(rb*.4, rb*.85, dd);
              coreB += 1. - smoothstep(rb*.5, rb + mpp, dd);
              pinB += 1. - smoothstep(rb*.08, rb*.3 + mpp*.6, length(q + vec2(.36, .36)*rb));
            }
            float onB = step(.38, hCol)*(1. - smoothstep(150., 330., dist))*inLiq*(1. - smoothstep(.5, 1.6, mpp));
            col = col*(1. - .6*min(ringB, 1.)*onB) + tint*E*(.3*min(coreB, 1.)*onB);
            glow += (uBulbCol*(uBulb*att*1.6) + uWarmCol*(uWarm*bar*.8) + uDiodeCol*(dio*.05))*(min(pinB, 1.)*onB);
          }
          if (fizz > 1.5) {
            // things hanging in the liquid: 2 = curls of peel, 3 = cherries, 4 = a slab of comb
            float nC = max(floor(R*.62), 5.), cw = 6.2832*R/nC, caa = clamp(mpp/cw, 1e-3, .3);
            vec2 g = vec2(ang/6.2832*nC, depth/cw);
            g.y += hash11(floor(g.x) + vDim.w*13.)*.8;
            vec2 gid = floor(g), gf = fract(g) - .5, rnd = hash22(gid + vDim.w*37.);
            float fillH2 = max(vDim.z*H, 1.), inc = 0., hl2 = 0.;
            vec3 incCol = liq*liq*.16;
            if (fizz < 2.5) {
              float a0 = rnd.y*6.2832; vec2 q = mat2(cos(a0), sin(a0), -sin(a0), cos(a0))*(gf - (rnd - .5)*.2);
              float bend = .1*sin(q.x*(5. + 5.*rnd.x) + rnd.y*20.) + (rnd.x - .5)*1.6*q.x*q.x;
              float tw = .5 + .5*sin(q.x*(8. + 9.*rnd.y) + rnd.x*30.);
              float hw = mix(.012, .085, tw*tw)*(.55 + .9*rnd.y);
              inc = (1. - smoothstep(hw, hw + .025 + caa, abs(q.y - bend)))*(1. - smoothstep(.24 + .1*rnd.x, .32 + .1*rnd.x, abs(q.x)))*step(.3, rnd.x);
              incCol = mix(liq*liq*.1, liq*vec3(.75, .45, .2)*.5, tw*tw*.6);
            } else if (fizz < 3.5) {
              vec2 q = gf - (rnd - .5)*.22; float dq = length(q);
              inc = (1. - smoothstep(.33, .37 + caa, dq))*step(.2, rnd.x);
              hl2 = (1. - smoothstep(.02, .1 + caa, length(q - vec2(-.11, -.12))))*inc;
              incCol = vec3(.36, .012, .03);
            } else if (fizz < 4.5) {
              vec2 hx = g*vec2(1.6, 1.85); hx.x += .5*mod(floor(hx.y), 2.);
              vec2 hf = abs(fract(hx) - .5);
              inc = smoothstep(.3, .42, max(hf.x, hf.y*1.1))*smoothstep(.12, .2, depth/fillH2)*(1. - smoothstep(.72, .8, depth/fillH2));
              incCol = liq*vec3(.5, .34, .2);
            } else {
              // 5 = preserved lemons: whole ones (a rind with its point of light) and cut ones (pale pith, a wheel of segments), packed close
              float a0 = rnd.y*6.2832; vec2 q = mat2(cos(a0), sin(a0), -sin(a0), cos(a0))*(gf - (rnd - .5)*.14);
              q.y *= 1.24;
              float dq = length(q), cut = step(.52, rnd.x);
              inc = 1. - smoothstep(.43, .47 + caa, dq);
              float sa = atan(q.y, q.x + ((abs(q.x) + abs(q.y)) < 1e-4 ? 1e-3 : 0.));
              float spoke = smoothstep(.0, .3, abs(sin(sa*4. + rnd.x*9.)))*smoothstep(.04, .1, dq);
              vec3 rind = vec3(1.25, .92, .1)*(.62 + .38*(1. - smoothstep(.05, .45, dq)));
              vec3 face = mix(vec3(1.35, 1.25, .78), vec3(1.3, 1.02, .2), spoke);
              face = mix(face, vec3(1.4, 1.34, 1.), smoothstep(.3, .34, dq));
              face = mix(face, rind*.8, smoothstep(.37, .4, dq));
              incCol = mix(rind, face, cut)*1.5;
              hl2 = (1. - smoothstep(.02, .1 + caa, length(q - vec2(-.14, -.16))))*inc*(1. - cut)*2.;
            }
            inc *= inLiq*(1. - smoothstep(170., 380., dist));
            col = mix(col, incCol*E, inc*.86);
            glow += uBulbCol*(uBulb*att*hl2*.5);
          }
          float sB = 2., nA = max(floor(6.2832*R/sB), 6.);
          // beads gather on the shoulder and thin away down the body
          vec3 bd = lcBeads(vec2(ang/6.2832*nA, vO.y/sB), .2 + .5*smoothstep(.3, .62, hN), uTime*.5, mpp/sB)
                  *(smoothstep(.1, .3, hN)*(1. - smoothstep(.7, .8, hN))*(1. - smoothstep(110., 260., dist)));
          col *= 1. - bd.z*.6; alpha = max(alpha, bd.x*.12 + bd.z*.4);
          glow += (uBulbCol*(uBulb*att*.55) + uDiodeCol*(dio*.12*clamp(dot(N, Ld)*2., 0., 1.)) + uWarmCol*(uWarm*bar))*bd.y;
          // the rim is not one even outline: hard and white on the flank toward the bulb, a thin cold line on the other
          float rimK = fres*fres*fres*(.28 + 1.15*smoothstep(-.5, .75, side));
          glow += uBulbCol*(uBulb*(att*.7 + .3*lit)*2.6*rimK) + uBulbCol*vec3(.6, .9, 1.)*(floorGlow*.3*fres*fres);
          float dkn = 1. - uBulb;
          vec3 hue = lcDarkHue(liq, milk);
          glow += mix(uDiodeCol, hue, .7*dkn)*(dio*pow(fres, 3. + 3.*dkn)*(.35 + .65*clamp(dot(N, Ld)*.5 + .5, 0., 1.))*(.9 + .5*dkn));
          // before the bulb: the liquid holds what little light there is, brightest under its surface and toward the diode
          float towardD = clamp(dot(Nh, Ld)*.5 + .5, 0., 1.);
          glow += hue*(dkn*uDark.z*inLiq*(.035 + .13*topGlow)*(.35 + .65*smoothstep(0., .9, ndv))*(.55 + .45*towardD)*mix(1., .6, milk));
          glow += vec3(.25, .5, 1.)*(dkn*uDark.z*(1. - inLiq)*.03*(.4 + .6*fres));
          // the door's seal, a hairline of kitchen light behind us: a warm edge on the flank turned to it and one thin line mirrored down the glass
          vec3 toSeam = vec3(-146. - P.x, 0., -P.z); toSeam = toSeam/max(length(toSeam), 1.);
          vec3 Hk = toSeam + vec3(V.x, 0., V.z); Hk = Hk/max(length(Hk), 1e-3);
          vec3 Ngh = vec3(Ng.x, 0., Ng.z); Ngh = Ngh/max(length(Ngh), 1e-3);
          float shoulder = exp(-(hN - .6)*(hN - .6)*90.), offLine = smoothstep(.6, 2.6, abs(below));
          float seamLine = pow(max(dot(Ngh, Hk), 0.), 260.)*smoothstep(.2, .6, 1. - abs(Ng.y))*shoulder*offLine;
          float seamSide = clamp(dot(Ngh, toSeam), 0., 1.);
          glow += uWarmCol*(uDark.x*(fres*fres*seamSide*seamSide*.55*exp(-(hN - .58)*(hN - .58)*22.)*offLine + seamLine*.5));
          glow += uWarmCol*(uWarm*slot*fres*clamp(dot(N, LC_KITCHEN)*.7 + .5, 0., 1.)*1.6*(1. + 1.4*uDark.y));
          vec3 Hb = normalize(Lb + V + vec3(0., 1e-3, 0.));
          float ndh = max(dot(N, Hb), 0.);
          // one hard highlight: the bulb drawn out into a streak down the shoulder and body
          vec3 Hh = vec3(Hb.x, 0., Hb.z); Hh = Hh/max(length(Hh), 1e-3);
          float streakH = pow(max(dot(Nh, Hh), 0.), 260.)*smoothstep(.1, .5, 1. - abs(N.y))*(.35 + .65*smoothstep(.3, .75, hN))*step(1e-3, dot(N, Hb));
          glow += uBulbCol*(uBulb*att*(pow(ndh, 120.)*4.5 + streakH*1.5 + pow(ndh, 14.)*.06));
          vec3 Hd = normalize(Ld + V + vec3(0., 1e-3, 0.));
          glow += uDiodeCol*(dio*pow(max(dot(N, Hd), 0.), 90.)*4.);
          alpha = max(alpha, clamp(fres*fres*1.6, 0., 1.));
        }
        vec3 outc = max(col*alpha + glow, vec3(0.));
        // near the eye a jar's own lights (rim, the bulb's streak, bead points, the lid's mirror of the bulb) are held under the
        // bloom pass, which would spread them over the liquid as a white veil: full within 30 m, as live from 75 m. Where the
        // glass is clear the wall behind shows through and adds to it, so the ceiling is lower there (.45: the liner's level)
        float nearC = uBulb*(1. - smoothstep(30., 75., dist));
        outc = mix(outc, lcCap(outc, .9 - .45*(1. - alpha)), nearC);
        gl_FragColor = vec4(fxFogPremult(outc, alpha), alpha);
      }`,
  });
}

// ---------------------------------------------------------------- the gasket
// A bellows strip round the door's edge, modelled shut. Each vertex knows where it is fixed to the door
// (aAttach), where its sealing lip sits on the cabinet (aSeal), how far across the bellows it is (aG.x) and
// when the zip reaches it (aG.y, in units of the peel 0..1; negative = never held). Until then it is
// stretched between the two; after, it snaps back to the door with a damped shiver.
const G_X = 143.5, G_Y0 = 16.5, G_Y1 = 403.5, G_R = 9;
function gasketLoop(step) {
  const pts = [];   // { x, y, nx, ny, q }
  const yb = G_Y0 + G_R, yt = G_Y1 - G_R, xl = -G_X + G_R, xr = G_X - G_R;
  const line = (x0, y0, x1, y1, nx, ny, qf) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step)); for (let i = 0; i < n; i++) { const t = i / n, x = lerp(x0, x1, t), y = lerp(y0, y1, t); pts.push({ x, y, nx, ny, q: qf(x, y) }); } };
  const arc = (cx, cy, a0, a1, qf) => { for (let i = 0; i < 5; i++) { const a = lerp(a0, a1, i / 5), nx = Math.cos(a), ny = Math.sin(a); pts.push({ x: cx + nx * G_R, y: cy + ny * G_R, nx, ny, q: qf(cx + nx * G_R, cy + ny * G_R) }); } };
  const qLatch = (x, y) => 0.06 + 0.9 * (1 - clamp((y - G_Y0) / (G_Y1 - G_Y0), 0, 1));
  const qTop = (x) => 0.06 * clamp((G_X - x) / (2 * G_X), 0, 1);
  const qBot = (x) => 0.96 * (1 - smoothstep(0, 95, x + G_X));
  line(xr, G_Y1, xl, G_Y1, 0, 1, qTop);                       // top, hinge to latch
  arc(xl, yt, Math.PI / 2, Math.PI, () => 0.06);
  line(-G_X, yt, -G_X, yb, -1, 0, qLatch);                    // latch side, top to bottom: the zip
  arc(xl, yb, Math.PI, Math.PI * 1.5, () => 0.96);
  line(xl, G_Y0, xr, G_Y0, 0, -1, qBot);                      // bottom
  arc(xr, yb, Math.PI * 1.5, TAU, () => -1);
  line(G_X, yb, G_X, yt, 1, 0, () => -1);                     // hinge side: never held
  arc(xr, yt, 0, Math.PI / 2, () => -1);
  return pts;
}
function buildGasketGeometry() {
  const loop = gasketLoop(3.2), n = loop.length;
  // cross-section: [w along the outward normal, z, across, zig]
  const sec = [], Z0 = -3.4, ZR = 3.2, zig = [0, 1.6, -1.1, 1.5, -1.1, 1.1];
  for (let j = 0; j < 6; j++) sec.push([5.3 + zig[j], lerp(Z0, ZR, j / 6), j / 6, zig[j], 1]);
  sec.push([6.4, ZR + 0.2, 1, 0, 1], [-6.4, ZR + 0.2, 1, 0, -1]);
  for (let j = 5; j >= 0; j--) sec.push([-5.3 - zig[j], lerp(Z0, ZR, j / 6), j / 6, zig[j], -1]);
  const m = sec.length, pos = new Float32Array(n * m * 3), att = new Float32Array(n * m * 3), seal = new Float32Array(n * m * 3), gg = new Float32Array(n * m * 4), nr = new Float32Array(n * m * 2);
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
    const L = loop[i], S = sec[j], k = i * m + j;
    pos[k * 3] = L.x + L.nx * S[0]; pos[k * 3 + 1] = L.y + L.ny * S[0]; pos[k * 3 + 2] = S[1];
    att[k * 3] = L.x + L.nx * 5.3 * S[4]; att[k * 3 + 1] = L.y + L.ny * 5.3 * S[4]; att[k * 3 + 2] = Z0;
    seal[k * 3] = L.x + L.nx * 6.4 * S[4]; seal[k * 3 + 1] = L.y + L.ny * 6.4 * S[4]; seal[k * 3 + 2] = 0;
    gg[k * 4] = S[2]; gg[k * 4 + 1] = L.q; gg[k * 4 + 2] = S[3]; gg[k * 4 + 3] = S[4];
    nr[k * 2] = L.nx; nr[k * 2 + 1] = L.ny;
  }
  const idx = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < m - 1; j++) { const a = i * m + j, b = ((i + 1) % n) * m + j; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aAttach', new THREE.BufferAttribute(att, 3));
  g.setAttribute('aSeal', new THREE.BufferAttribute(seal, 3)); g.setAttribute('aG', new THREE.BufferAttribute(gg, 4)); g.setAttribute('aNrm', new THREE.BufferAttribute(nr, 2));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 210, -30), 270);
  return g;
}
function gasketMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...FOG_U(), ...U },
    vertexShader: /* glsl */`
      attribute vec3 aAttach, aSeal; attribute vec4 aG; attribute vec2 aNrm;
      uniform float uDoor; uniform vec2 uPeel;
      varying vec3 vW, vNo; varying vec4 vG; varying float vF;   // vG: across, stretch, recency, fold; vF: 1 once it is back on the door
      ${GLSL_FOG_PARS_VERT}
      vec3 swing(vec3 p){ float c = cos(uDoor), s = sin(uDoor); vec2 r = vec2(p.x - 150., p.z); return vec3(150. + r.x*c - r.y*s, p.y, r.x*s + r.y*c); }
      void main(){
        float a = aG.x, q = aG.y;
        vec3 n3 = vec3(aNrm.x, aNrm.y, 0.);
        vec3 relaxed = swing(position + n3*(2.*a*sin((position.x + position.y)*.42))), A = swing(aAttach), S = aSeal;
        float gap = length(S - A);
        vec3 stuck = mix(A, S, a) + n3*(aG.z*(.35 + .65/(1. + gap*.07))*(1. + gap*.045)/(1. + gap*.12) + sin(a*3.1416)*gap*.03);   // stretched, it is taut
        float tau = max(uPeel.x - q, 0.)*uPeel.y;
        float w = q < 0. ? 1. : (tau <= 0. ? 0. : 1. - exp(-tau*.85)*cos(tau*4.6));
        vec3 p = mix(stuck, relaxed, w);
        p += n3*(exp(-tau*.6)*sin(tau*9. + q*105.)*min(gap*.1, 6.5)*(.35 + .65*a)*step(1e-5, tau)*step(0., q));
        vG = vec4(a, gap*(1. - clamp(w, 0., 1.)), step(0., q)*exp(-abs(uPeel.x - q)*uPeel.y*1.3)*smoothstep(0., 12., gap), aG.z);
        vF = clamp(w, 0., 1.);
        vNo = vec3(aNrm.x*cos(uDoor), aNrm.y, aNrm.x*sin(uDoor))*(.8*aG.w) + vec3(-sin(uDoor), 0., cos(uDoor))*.6;   // the strip's own smooth facing: out from the loop and in toward the box
        vec4 wp = modelMatrix*vec4(p, 1.); vW = wp.xyz;
        vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
        ${GLSL_FOG_VERT}
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vNo; varying vec4 vG; varying float vF;
      ${GLSL_HASH}${GLSL_LIGHT}${GLSL_FOG_PARS_FRAG}
      void main(){
        vec3 Vv = cameraPosition - vW; vec3 V = Vv/max(length(Vv), 1e-3);
        vec3 n = cross(dFdx(vW), dFdy(vW)); n = n/max(length(n), 1e-9);
        if (dot(n, V) < 0.) n = -n;
        // the bellows are few and large: their flat faces are rounded off toward the strip's own facing, and the folds are shaded in
        vec3 ns = vNo/max(length(vNo), 1e-3); if (dot(ns, V) < 0.) ns = -ns;
        n = normalize(n*.55 + ns);
        // grey rubber in soft folds: deep valleys, pale ridges, fine ribs along its length
        float fc = cos(vG.x*18.85 + .45*sin(vW.y*.19)), fold = .42 + .58*smoothstep(-1., 1., fc);
        vec3 alb = vec3(.3, .33, .35)*fold*(.9 + .1*sin(vW.y*2.6 + vG.x*9.));
        vec3 col = lcShade(vW, n, V, alb, 14., .16);
        vec3 Lb = uBulbPos - vW; float att = lcBulbAtt(length(Lb));
        float fres = pow(max(1. - abs(dot(n, V)), 0.), 3.);
        // the box's own light on the rubber: the bulb is hooded from the door, so this is bounce off the white walls
        col += alb*uBulbCol*(uBulb*(.07 + .26*att)*(.55 + .45*fold)) + uBulbCol*(uBulb*.1*fres);
        // where it is still stretched from the door to the cabinet the kitchen shines through it: an even, dim amber
        // membrane with its folds a shade deeper, brightest where the zip has just let go
        float stretch = smoothstep(5., 36., vG.y);
        float wr = .5 + .5*sin(vW.y*1.7 + 2.5*sin(vW.y*.31) + vG.x*4.);          // tension wrinkles run along the pull
        col = mix(col, col*.3 + uWarmCol*vec3(1., .82, .62)*(uWarm*uBar.w*(.5 + .22*wr)), stretch*.9);
        col += uWarmCol*(uWarm*uBar.w*vG.z*.9*sin(vG.x*3.1416));
        // freed, it stands at the edge of the slot: a warm rim along every ridge on the kitchen side
        float nearSlot = min(exp(-(vW.x - uOrigin.x + 150.)/45.), 1.);
        // (seen from inside it is a dark shape against the kitchen: the light only catches the ridges turned to the slot and its edge)
        col += alb*uWarmCol*(uWarm*uBar.w*vF*nearSlot*(.3 + 1.8*smoothstep(.2, 1., fc))*clamp(.6 - n.x*.6, 0., 1.)) + uWarmCol*(uWarm*uBar.w*vF*nearSlot*fres*1.2);
        col += uWarmCol*(uDark.x*(1. - vF)*smoothstep(.7, 1., vG.x)*1.3);                          // before the bulb: the seal itself is a hairline of light
        gl_FragColor = vec4(fxApplyFog(max(col, vec3(0.))), 1.);
      }`,
  });
}

// ---------------------------------------------------------------- glass shelves (front lips, or whole shelves)
function buildShelfGeometry(depth) {
  const parts = [];
  for (const top of SHELF_TOPS) parts.push(paint(rbox(0, top - 2, SHELF_Z + depth / 2, 296, 4, depth, 1.3, 2), _c.set(1, 1, 1), 0));
  const g = mergeGeometries(parts, false);
  for (const q of parts) q.dispose();
  return g;
}
// Two passes over the same slabs: frost, ferns and the burning edges write depth and are drawn first; the clear glass between
// them (clear = true) is drawn after the bottles without depth, so the racks and terraces below are seen through it.
function shelfMaterial(U, frost, clear = false, lane = null) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, premultipliedAlpha: true, depthWrite: !clear, defines: clear ? { LC_CLEAR: 1 } : {},
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: { ...FOG_U(), ...U, uFrost: { value: frost }, uLane: { value: lane ? new THREE.Vector4(lane[0], lane[1], lane[2], lane[3]) : new THREE.Vector4(0, 0, 1, 0) }, uLaneW: { value: lane ? new THREE.Vector2(lane[4], lane[5]) : new THREE.Vector2(-1000, 0) } },
    vertexShader: /* glsl */`
      varying vec3 vW, vN;
      ${GLSL_FOG_PARS_VERT}
      void main(){
        vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix)*normal;
        vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
        ${GLSL_FOG_VERT}
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; uniform float uFrost; uniform vec4 uLane; uniform vec2 uLaneW;
      ${GLSL_HASH}${GLSL_VALUE_NOISE}${GLSL_FBM}${GLSL_LIGHT}${GLSL_FOG_PARS_FRAG}
      void main(){
        vec3 N = vN/max(length(vN), 1e-4);
        vec3 Vv = cameraPosition - vW; float dist = max(length(Vv), 1e-3); vec3 V = Vv/dist;
        vec3 P = vW - uOrigin;
        float dz = max(P.z - ${SHELF_Z.toFixed(1)}, 0.);
        // a lane of bare glass the world may ask for: less mist on it, so what lies below shows through
        vec2 lr = P.xz - uLane.xy; float lt = dot(lr, uLane.zw), lw0 = uLaneW.x + uLaneW.y*max(lt, 0.);
        float lane = (1. - smoothstep(lw0 - 6., lw0 + 8., abs(lr.x*uLane.w - lr.y*uLane.z)))*step(-24., lt);
        float flat_ = smoothstep(.5, .9, abs(N.y));
        // frost ferns creeping in from the front edge, finer crystals inside them
        float fern = fbm(vec2(P.x*.045, P.z*.11) + 2.3);
        float fr = smoothstep(.62 - .22*uFrost, .86, fern + .3*exp(-dz/5.))*flat_;
        float crystal = vnoise(P.xz*1.9)*.6 + vnoise(P.xz*6.3)*.4;
        // the top is a sheet of frosted glass: a breath of mist all over it, feathered ferns of rime, and the pale rings
        // where cold jars have stood
        float top = flat_*step(0., N.y);
        float haze = top*(.3 + .7*fbm(P.xz*.017 + 7.3));
        // cold air creeping over the sheet toward the lip: a slow drifting breath, so the floor is never still
        float creep = top*smoothstep(.34, .74, fbm(P.xz*.042 + vec2(uTime*.07, uTime*.28)));
        haze = clamp(haze*.8 + creep*.6, 0., 1.)*(1. - .7*lane);
        vec2 fq = P.xz + 9.*vec2(fbm(P.xz*.035 + 1.3), fbm(P.xz*.035 + 6.1));
        float feather = top*smoothstep(.5, .78, fbm(vec2(fq.x*.05, fq.y*.19) + 4.))*smoothstep(.35, .6, fbm(P.xz*.011 + 2.));
        vec2 rc = P.xz/44., rid = floor(rc), rf = fract(rc) - .5, rr = hash22(rid + 3.1);
        float rd = abs(length(rf - (rr - .5)*.36) - (.14 + .12*rr.y))*44.;
        float ring = top*(1. - smoothstep(.4, 1.9, rd))*step(.42, rr.x)*(.35 + .65*vnoise(P.xz*.21 + 5.));
        float ndv = abs(dot(N, V)), milk = top*pow(max(1. - ndv, 0.), 1.5);
        float rime = clamp(max(fr, max(feather*.75, ring*.8)), 0., 1.);
        vec3 alb = mix(mix(vec3(.05, .12, .135), vec3(.42, .58, .62), haze*.62), vec3(.7, .82, .86)*(.7 + .3*crystal), rime);
        vec3 col = lcShade(vW, N, V, alb, 90., 1.2 - rime);
        float fres = pow(max(1. - ndv, 0.), 3.);
        vec3 Lb = uBulbPos - vW; float db = max(length(Lb), 1.); Lb /= db; float att = lcBulbAtt(db);
        col += uBulbCol*(uBulb*fres*.25) + uDiodeCol*(uDiode*fres*.05);
        // the bulb's long soft sheen on the misted sheet, and the sheet's own milk at a glancing angle
        vec3 Hs = normalize(Lb + V + vec3(0., 1e-3, 0.));
        col += uBulbCol*(uBulb*att*top*(.5*pow(max(dot(N, Hs), 0.), 7.)*(.4 + .6*haze) + .16*milk));
        // the light pipe: bulb light travels inside the glass and leaves at the edge
        float edge = (1. - flat_) + flat_*exp(-dz/2.6)*.55 + flat_*exp(-(148. - abs(P.x))/2.6)*.4;
        float streak = .75 + .25*vnoise(vec2(P.x*.35, 3.));
        col += uGreenCol*uGreenCol*(uBulb*edge*streak*3.2) + uGreenCol*(uBulb*edge*streak*.5) + uDiodeCol*((1. - uBulb)*uDiode*edge*.045);
        // what the sheet mirrors, laid over it as light. Lit: the pale box at a glancing angle, in broad soft bands, and the
        // kitchen's bar drawn out toward the eye as a long warm streak, broken by the frost. Before the bulb: the diode's gleam
        float gl = pow(max(1. - ndv, 0.), 2.);
        float bands = .5 + .5*vnoise(vec2(P.x*.028 + V.x*2.5, P.z*.011 + V.z*2.5 + 3.));
        vec3 refl = uBulbCol*(uBulb*att*top*(.07 + .55*gl)*bands*.8*(1. - .6*lane));
        vec3 camL = cameraPosition - uOrigin;
        vec2 dE = vec2(150. - 300.*cos(uDoor), -300.*sin(uDoor)), sA = vec2(-150., 0.), sm = (dE + sA)*.5;
        vec2 cs = sm - camL.xz; float csl = max(length(cs), 1.); cs /= csl;
        vec2 rp = P.xz - camL.xz; float al = dot(rp, cs), pd = abs(rp.x*cs.y - rp.y*cs.x);
        float hw = .5*abs((dE.x - sA.x)*cs.y - (dE.y - sA.y)*cs.x)*clamp(al/csl, 0., 1.) + 1.2 + max(al, 0.)*.025;
        float hS = P.y + (camL.y - P.y)*(csl - al)/max(al, 1.);                       // the height at which this point's mirrored ray meets the slot
        float brk = .35 + .65*smoothstep(.25, .75, vnoise(vec2(P.x*.9 + P.z*.4, P.z*.22 + 1.7)));
        float streakK = (1. - smoothstep(hw*.6, hw*1.5 + 1., pd))*smoothstep(uBar.y - 20., uBar.y + 30., hS)*(1. - smoothstep(380., 425., hS))*step(1., al)*step(al, csl);
        refl += (uWarmCol*uWarmCol*.6 + uWarmCol*.5)*(uWarm*uBar.w*top*streakK*brk*(.3 + .7*gl)*(.55 + .5*uDark.y));
        vec3 Ld = uDiodePos - vW; Ld = Ld/max(length(Ld), 1.);
        vec3 Hd = normalize(Ld + V + vec3(0., 1e-3, 0.));
        vec3 Nr = normalize(N + vec3(crystal - .5, 0., vnoise(P.xz*1.9 + 4.) - .5)*.07);
        refl += uDiodeCol*((1. - uBulb)*uDiode*top*(.3*pow(max(dot(Nr, Hd), 0.), 40.) + .08*pow(max(dot(Nr, Hd), 0.), 8.) + .02*gl)*(.6 + .4*haze));
        // and, at a glancing angle, the far haze of the box itself: the sheet is never a black floor
        #ifdef USE_FOG
          refl += fogColor*((1. - uBulb)*top*(.2 + 1.5*gl)*(.75 + .25*bands));
        #endif
        refl += uWarmCol*(uDark.x*lcLeak(P)*top*(.12 + .4*gl)*(.6 + .4*crystal)*.35);
        // clear glass: looked down through, the terrace below and the racks of the door show; it clouds toward a glancing angle
        float under = flat_*(1. - step(0., N.y));
        float alpha = clamp(.1 + under*.07 + top*(.05 + .2*haze + .34*milk) + rime*.8 + edge + fres*.5, 0., 1.);
        #ifdef LC_CLEAR
          if (alpha >= .55) discard;
        #else
          if (alpha < .55) discard;
        #endif
        gl_FragColor = vec4(fxFogPremult(max(col*alpha + refl, vec3(0.)), alpha), alpha);
      }`,
  });
}

// ---------------------------------------------------------------- the cold falling out: three fog-falls and the river
// Each fall is three overlapping sheets swept along x from one profile: a creep along the shelf top, a thin roll
// over the glowing lip, the drop (dense and bright under the lip, thinning into threads) and a foot that dissolves
// into the puffs that billow there. aK = (fall index 0..2 or 3 = river, layer, arc length, billow m).
const FALL_BOTTOM = [264, 165, 42];            // where each fall's foot dissolves: the upper two leave the next terrace in clear air
function fallProfile(top, bottom, layer, pool) {
  // [z, y, billow]: a creep along the shelf top, a roll over the lip, a drop that leans out a little as it falls, a foot that billows out and fades
  const pts = [], r = 4 + 2 * layer, yS = top + 1.5 + 1.3 * layer, zL = SHELF_Z + 1 - r, yL = yS + 1.5 - r, yF = bottom + 6, R2 = pool ? 14 + 6 * layer : 7 + 3 * layer;
  for (let i = 0; i < 4; i++) { const t = i / 4; pts.push([lerp(SHELF_Z + 30 - layer * 4, SHELF_Z + 1, t), yS + 1.5 * t, 1 + 1.2 * t]); }
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI / 2; pts.push([SHELF_Z + 1 - r * Math.sin(a), yS + 1.5 - r * (1 - Math.cos(a)), 2.2 + i * 0.3]); }
  const lean = (t) => 3 * Math.pow(t, 0.8) + layer * 1.6 * t + 3 * t * t;
  for (let i = 0; i < 12; i++) { const t = i / 12; pts.push([zL - lean(t), lerp(yL, yF, t), 3 + 2.5 * t]); }
  const zF = zL - lean(1);
  for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; pts.push([zF - R2 * Math.sin(a), yF - 6 * (1 - Math.cos(a)), 5.5 + (pool ? 5 : 2) * (i / 6)]); }
  return pts;
}
async function buildFogGeometry(ctx, detail) {
  const pos = [], uv = [], out = [], kk = [], idx = [];
  const NU = Math.round(64 * (detail < 0.9 ? 0.75 : 1));
  for (let f = 0; f < SHELF_TOPS.length; f++) {
    const top = SHELF_TOPS[f], bottom = FALL_BOTTOM[f];
    for (let layer = 0; layer < 3; layer++) {
      await ctx.yield?.();                               // one sheet at a time
      const prof = fallProfile(top, bottom, layer, f === 2), nv = prof.length - 1, base = pos.length / 3;
      let s = 0; const arc = [0];
      for (let j = 1; j <= nv; j++) { s += Math.hypot(prof[j][0] - prof[j - 1][0], prof[j][1] - prof[j - 1][1]); arc.push(s); }
      for (let j = 0; j <= nv; j++) {
        const a = prof[Math.max(j - 1, 0)], b = prof[Math.min(j + 1, nv)];
        let tz = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tz, ty) || 1; tz /= tl; ty /= tl;
        for (let i = 0; i <= NU; i++) {
          pos.push(lerp(-147.5, 147.5, i / NU), prof[j][1], prof[j][0]);
          uv.push(i / NU, j / nv); out.push(0, -tz, ty); kk.push(f, layer, arc[j], prof[j][2]);
        }
      }
      for (let j = 0; j < nv; j++) for (let i = 0; i < NU; i++) { const a = base + j * (NU + 1) + i, b = a + NU + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    }
  }
  await ctx.yield?.();
  // the river: along the canyon floor, humping up as it squeezes through the foot of the slot, then away and down
  const curve = new THREE.CatmullRomCurve3([[80, 13, 30], [10, 14, 31], [-50, 15, 29], [-100, 18, 23], [-134, 23, 6], [-157, 25, -18], [-186, 19, -46], [-216, 4, -72], [-242, -26, -90], [-264, -66, -102]].map((q) => new THREE.Vector3(q[0], q[1], q[2])), false, 'catmullrom', 0.5);
  const NR = 34, NC = 6, len = curve.getLength(), P = new THREE.Vector3(), Tn = new THREE.Vector3();
  for (let layer = 0; layer < 1; layer++) {
    const base = pos.length / 3, wHalf = 25;
    for (let j = 0; j <= NR; j++) {
      const t = j / NR; curve.getPointAt(t, P); curve.getTangentAt(t, Tn);
      const sx = -Tn.z, sz = Tn.x, sl = Math.hypot(sx, sz) || 1, hump = Math.exp(-Math.pow((t - 0.6) / 0.2, 2));
      for (let i = 0; i <= NC; i++) {
        const o = (i / NC - 0.5) * 2, crown = 1 - o * o;
        pos.push(P.x + (sx / sl) * o * wHalf, P.y - 4 + crown * (2 + 3 * hump), P.z + (sz / sl) * o * wHalf);
        uv.push(i / NC, t); out.push(0, 1, 0); kk.push(3, layer, t * len, 3.5 + 3 * hump);
      }
    }
    for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) { const a = base + j * (NC + 1) + i, b = a + NC + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  }
  await ctx.yield?.();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 2));
  await ctx.yield?.();
  g.setAttribute('aOut', new THREE.Float32BufferAttribute(out, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(kk, 4));
  g.setIndex(idx); g.computeBoundingSphere(); g.boundingSphere.radius += 20;
  return g;
}
function fogMaterial(U, amount) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: { ...FOG_U(), ...U, uFogAmt: { value: amount } },
    vertexShader: /* glsl */`
      attribute vec2 aUV; attribute vec3 aOut; attribute vec4 aK;
      uniform float uTime;
      varying vec3 vW; varying vec2 vUV; varying vec4 vK; varying vec3 vNo; varying float vFold;
      ${GLSL_FOG_PARS_VERT}
      void main(){
        vec3 p = position;
        float b = sin(p.x*.052 + aK.z*.09 - uTime*.55 + aK.y*2.1) + .8*sin(p.x*.023 - aK.z*.047 - uTime*.33 + aK.x*1.7) + .5*sin(p.x*.11 + aK.z*.2 - uTime*.9 + aK.y);
        // drapery: slow folds that travel along the curtain, so that it reads when it is looked along
        float arg = p.x*.15 + aK.y*2.3 + aK.x*1.1 + .7*sin(aK.z*.045 - uTime*.35 + p.x*.031);
        float fold = sin(arg);
        float hang = smoothstep(26., 48., aK.z)*step(aK.x, 2.5);
        p += aOut*(aK.w*(.35 + .42*b) + hang*2.4*fold);
        // the face of the sheet turns with its folds: where it turns edge-on to the eye it thins away, so no fold shows a hard outline
        vNo = mat3(modelMatrix)*(aOut - vec3(1., 0., 0.)*(hang*.36*cos(arg)));
        vUV = aUV; vK = aK; vFold = hang*fold;
        vec4 w = modelMatrix*vec4(p, 1.); vW = w.xyz;
        vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
        ${GLSL_FOG_VERT}
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW; varying vec2 vUV; varying vec4 vK; varying vec3 vNo; varying float vFold;
      uniform vec3 uFalls; uniform float uFogAmt;
      ${GLSL_HASH}${GLSL_VALUE_NOISE}${GLSL_FBM}${GLSL_LIGHT}${GLSL_FOOT}${GLSL_FOG_PARS_FRAG}
      void main(){
        vec3 P = vW - uOrigin;
        float idx = vK.x, layer = vK.y, s = vK.z, t = uTime;
        float foot = lcFoot(P);                              // at the foot of the slot the fog shows its rolling (see GLSL_FOOT)
        float dist = length(cameraPosition - vW);
        vec3 Vd = (cameraPosition - vW)/max(dist, 1e-3);
        float facing = abs(dot(vNo/max(length(vNo), 1e-4), Vd));
        float bar = lcBar(P);
        float att = lcBulbAtt(length(uBulbPos - vW));
        vec3 amb = mix(uDarkCol, uShadowCol*(1.1*uKey.y), uBulb)*.7;
        vec3 c; float a;
        if (idx > 2.5) {
          // the river on the canyon floor: a low, slow sheet under the puffs
          float prog = clamp(uFalls.z*1.6 - .5, 0., 1.);
          float ax = vUV.x*46.;
          vec2 q = vec2(ax*.034 + layer*3.7 + idx*1.3, s*.0085);
          float n1 = fbm(vec2(q.x, q.y - t*.1));
          float n2 = fbm(vec2(q.x*2.4 + 5., q.y*2.7 - t*.2) + n1*.7);
          float dens = n1*.62 + n2*.46;
          float tongue = fbm(vec2(ax*.028 + idx*9., t*.02));
          float front = prog*1.42 - .38*tongue;
          float fm = 1. - smoothstep(front - .09, front, vUV.y);
          float vfade = smoothstep(0., .1, vUV.y)*(1. - smoothstep(.5, 1., vUV.y));
          float ufade = smoothstep(0., .48, vUV.x)*(1. - smoothstep(.52, 1., vUV.x));
          a = smoothstep(.37 + .1*vUV.y*vUV.y, .67 + .05*vUV.y, dens + .06)*fm*vfade*ufade*.34;
          float low = mix(.5, 1., smoothstep(10., 230., P.y));
          c = uBulbCol*(uBulb*(.52 + .55*att)*1.1*low)*mix(vec3(.66, .9, 1.), vec3(1.), dens*low) + amb;
          c = mix(c, uWarmCol*(uWarm*.8) + c*.1, bar*.9);
          c *= .6 + .5*dens;
          // the river rolls as it leaves: billows a dozen metres across travelling with the flow, their crowns catching the bulb's cold light
          float lobe = lcRoll(vec2(ax*.08 + 3., s*.065 - t*.12), t);
          a *= mix(1., .65 + .6*lobe, foot);
          c = mix(c*mix(1., .7 + .42*lobe, foot), uBulbCol*vec3(.8, .93, 1.)*(uBulb*(.42 + .5*att)), foot*.3*lobe*lobe);
        } else {
          float top = idx < .5 ? ${SHELF_TOPS[0].toFixed(1)} : (idx < 1.5 ? ${SHELF_TOPS[1].toFixed(1)} : ${SHELF_TOPS[2].toFixed(1)});
          float bottom = idx < .5 ? ${FALL_BOTTOM[0].toFixed(1)} : (idx < 1.5 ? ${FALL_BOTTOM[1].toFixed(1)} : ${FALL_BOTTOM[2].toFixed(1)});
          float prog = idx < .5 ? uFalls.x : (idx < 1.5 ? uFalls.y : uFalls.z);
          float low = step(1.5, idx);                                    // the bottom fall is the thinnest: the crispers are seen through it
          float hh = clamp((top - P.y)/(top - bottom), 0., 1.3);          // 0 at the shelf top, 1 where the foot dissolves
          float fall = smoothstep(.2, .34, vUV.y);                        // 0 on the shelf, 1 from the lip down
          float xs = P.x + layer*37. + idx*91.;
          float yy = P.y + t*(7.5 + layer*1.8);                           // the pattern falls with the fog
          float veil = fbm(vec2(xs*.022, yy*.012));                       // broad veils
          float big = fbm(vec2(xs*.009 + 4., yy*.021 - t*.03));           // slow billows tens of metres across
          float thr = fbmLo(vec2(xs*.07 + veil*1.4, yy*.034 + 3.));       // rolls a dozen metres wide
          float fine = vnoise(vec2(xs*.21, yy*.09));
          float creep = fbm(vec2(xs*.04, s*.07 - t*.12));
          float d = mix(creep, veil*.42 + big*.3 + thr*.34 + fine*.06, fall);
          // dense under the lip, breaking into threads with air between as it falls
          float lo = mix(.42, mix(.17, .52, smoothstep(.1, 1., hh)), fall) + layer*.04 + low*.05;
          float body = smoothstep(lo, lo + .26, d);
          // the ragged end: tongues of different lengths that dissolve before the next terrace
          float tongue = fbm(vec2(xs*.05, t*.03 + idx*9.));
          float end = 1. - smoothstep(.56 + .36*tongue, .86 + .36*tongue, hh);
          // growing down from the lip when the door first opens
          float front = prog*1.5 - .4*tongue - layer*.03;
          float fm = 1. - smoothstep(front - .1, front, vUV.y);
          float ufade = smoothstep(0., .03, vUV.x)*(1. - smoothstep(.97, 1., vUV.x));
          float vfade = smoothstep(0., .1, vUV.y)*(1. - smoothstep(.86, 1., vUV.y));
          // only a thin roll goes over the edge of the glass, so the edge burns through it; the curtain gathers a few metres below
          float dense = 1. - smoothstep(top - 13., top - 5., P.y);
          float thin = mix(.42 - low*.26 - .2*(1. - step(.5, idx)), .46 - low*.08, fall);          // (and on the top terrace: the glass and what the jars throw on it show through)                // on the bottom terrace the creep is a breath: the glass and what stands on it stay dark
          float a0 = body*end*fm*ufade*vfade*mix(thin, .93 - layer*.1 - low*.12, dense*fall);
          // looked along, a curtain is deeper, not thinner; but where a fold turns edge-on it fades, so nothing has a hard outline
          a = 1. - pow(max(1. - a0, 1e-3), 1./clamp(facing, .26, 1.));
          // far off a fold only fades where it turns edge-on; near the eye a sheet looked along thins right away, so the air beside the route is clear
          a *= mix(smoothstep(.16, .62, facing), smoothstep(.0, .1, facing), smoothstep(34., 96., dist));
          a = min(a*mix(1., 1.4, smoothstep(40., 120., dist)), .96);                 // and from across the canyon each fall is a white sheet, not a wisp
          // lit from above and behind: the rolled top is the brightest, thick fog is white, thin fog takes the teal of the shade
          float rr = (P.y - (top - 15.))/8., roll = exp(-rr*rr);
          float lightK = (1.02 - .42*smoothstep(0., 1., hh) + .22*roll)*mix(.5, 1.1, body*body);
          c = uBulbCol*(uBulb*(.5 + .6*att)*lightK)*mix(vec3(.62, .88, 1.), vec3(1.), body) + amb;
          // the green of the glass edge in the fog that goes over it
          float glow = exp(-max(top - 3. - P.y, 0.)/9.)*smoothstep(.1, .3, vUV.y);
          c = mix(c, uGreenCol*(uBulb*1.2) + c*.3, glow*.6);
          c = mix(c, uWarmCol*(uWarm*.85)*(.62 + .5*body) + c*.12, bar*.9);
          c *= .84 + .36*vFold;
          // by the slot the fall is seen from close: it comes over the lip and down in rolls (about 13 m wide, 17 m tall, falling
          // with the pattern) with thin air in the creases, the crown of each roll cold where the bulb reaches it
          float lobe = lcRoll(vec2(xs*.075, yy*.06), t);
          a = min(a*mix(1., .6 + .55*lobe, foot), .96);
          c = mix(c*mix(1., .7 + .42*lobe, foot), uBulbCol*vec3(.8, .93, 1.)*(uBulb*(.42 + .5*att)), foot*.3*lobe*lobe*(1. - .5*min(hh, 1.)));
        }
        a *= smoothstep(20., 84., dist)*mix(.62, 1., smoothstep(70., 180., dist))*uFogAmt;                 // the sheets thin where the route runs close under them: clear air round the camera
        gl_FragColor = vec4(fxFogPremult(max(c, vec3(0.))*a, a), a);
      }`,
  });
}
// the amber bar itself: five thin light curtains fanned through the wedge, hung from the peel front upward
function buildBarGeometry() {
  const g = new THREE.PlaneGeometry(1, 1, 14, 8), n = g.attributes.position.count, parts = [];
  for (const f of [0.1, 0.3, 0.5, 0.7, 0.9]) { const q = g.clone(); q.setAttribute('aF', new THREE.BufferAttribute(new Float32Array(n).fill(f), 1)); parts.push(q); }
  const m = mergeGeometries(parts, false); for (const q of parts) q.dispose(); g.dispose();
  m.boundingSphere = new THREE.Sphere(new THREE.Vector3(-100, 210, 90), 300);
  return m;
}
function barMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    uniforms: { ...FOG_U(), ...U },
    vertexShader: /* glsl */`
      attribute float aF; uniform float uDoor; uniform vec4 uBar; uniform vec3 uOrigin;
      varying vec3 vW; varying vec3 vL; varying vec3 vNs;
      ${GLSL_FOG_PARS_VERT}
      void main(){
        vec2 E = vec2(150. - 300.*cos(uDoor), -300.*sin(uDoor));
        float z = mix(E.y + 6., 238., uv.x), y = mix(12., 410., uv.y);
        float xr = E.x + (z - E.y)*uBar.x, xl = -150.;
        vec3 p = vec3(mix(xl, xr, aF), y, z);
        vL = vec3(uv.x, uv.y, aF); vNs = normalize(vec3(1., 0., -uBar.x*aF));
        vec4 w = modelMatrix*vec4(p, 1.); vW = w.xyz;
        vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
        ${GLSL_FOG_VERT}
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW; varying vec3 vL; varying vec3 vNs;
      ${GLSL_HASH}${GLSL_VALUE_NOISE}${GLSL_FBM}${GLSL_LIGHT}${GLSL_FOG_PARS_FRAG}
      void main(){
        vec3 P = vW - uOrigin;
        vec3 Vv = cameraPosition - vW; float dist = max(length(Vv), 1e-3); vec3 V = Vv/dist;
        float n = fbm(vec2(P.z*.012 - uTime*.03, P.y*.02 + vL.z*7.));
        // shafts: the door's racks and bottles stand in the light's way, so it comes in as bands that drift as the door swings
        float shaft = .3 + .7*smoothstep(.3, .7, vnoise(vec2(P.y*.05 + vL.z*3.1 + uDoor*9., P.z*.004 - uTime*.015)));
        float a = (.012 + .05*n*n)*shaft*smoothstep(0., .1, vL.x)*(1. - smoothstep(.4, 1., vL.x))*smoothstep(0., .08, vL.y)*(1. - smoothstep(.85, 1., vL.y));
        a *= smoothstep(uBar.y - 12., uBar.y + 10., P.y)*uBar.w*uWarm;
        a *= smoothstep(14., 70., dist)*smoothstep(.05, .45, abs(dot(vNs, V)));
        gl_FragColor = vec4(uWarmCol*(a*2.*uKey.w*(1. - fxFog())), 0.);
      }`,
  });
}

// the burning edge of each glass shelf, drawn again over the fog as light: a thin green line the falls hang from.
// aV = (across the band 0..1, 0 = front face, 1 = strip on the top face).
function buildLipGeometry() {
  const pos = [], av = [], idx = [];
  const quad = (p0, p1, p2, p3, face) => { const b = pos.length / 3; pos.push(...p0, ...p1, ...p2, ...p3); av.push(0, face, 0, face, 1, face, 1, face); idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); };
  for (const top of SHELF_TOPS) {
    const z = SHELF_Z - 0.35;
    quad([-147.5, top - 4.3, z], [147.5, top - 4.3, z], [-147.5, top + 0.3, z], [147.5, top + 0.3, z], 0);
    quad([-147.5, top + 0.14, z], [147.5, top + 0.14, z], [-147.5, top + 0.14, z + 6], [147.5, top + 0.14, z + 6], 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aV', new THREE.Float32BufferAttribute(av, 2)); g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}
function lipMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    uniforms: { ...FOG_U(), ...U },
    vertexShader: /* glsl */`
      attribute vec2 aV; varying vec3 vW; varying vec2 vV;
      ${GLSL_FOG_PARS_VERT}
      void main(){
        vV = aV; vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz;
        vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
        ${GLSL_FOG_VERT}
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW; varying vec2 vV;
      ${GLSL_HASH}${GLSL_VALUE_NOISE}${GLSL_LIGHT}${GLSL_FOG_PARS_FRAG}
      void main(){
        vec3 P = vW - uOrigin;
        float t = vV.x - .5;
        float core = vV.y < .5 ? (.3 + .7*exp(-t*t*22.))*(1. - smoothstep(.36, .5, abs(t))) : exp(-vV.x*mix(9., 4.5, uDark.y))*mix(.55, .8, uDark.y)*(1. - smoothstep(.7, 1., vV.x));
        float streak = .72 + .28*vnoise(vec2(P.x*.35, 3.));
        float ends = smoothstep(0., 5., 147.5 - abs(P.x));
        // a green-white line of light; the two lower lips burn a little harder, so all three read from the canyon
        vec3 col = (uGreenCol*uGreenCol*2.1 + uGreenCol*.55 + uBulbCol*(core*core*(.25 + .75*uDark.y)))*(uBulb*core*streak*ends*(1. + .35*smoothstep(300., 240., P.y) + .5*uDark.y));
        gl_FragColor = vec4(col*(1. - fxFog()), 0.);
      }`,
  });
}

// soft puffs that ride the same three falls and the river: they give the sheets their volume and billowing feet.
// aSeed = (x along the shelf, phase, size, fall index or 3 = river), aRnd = four random numbers.
function buildPuffs(rng, detail, U, amount) {
  const perFall = Math.round(150 * detail), riverN = Math.round(170 * detail), n = perFall * 3 + riverN;
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const seed = new Float32Array(n * 4), rnd = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const idx = i < perFall * 3 ? Math.floor(i / perFall) : 3;
    seed.set([rng.range(-146, 146), rng(), rng.range(0.75, 1.3), idx], i * 4);
    rnd.set([rng(), rng(), rng(), rng()], i * 4);
  }
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rnd, 4));
  g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(-20, 170, 20), 330);
  const material = new THREE.ShaderMaterial({
    fog: true, transparent: true, premultipliedAlpha: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: { ...FOG_U(), ...U, uFogAmt: { value: amount } },
    vertexShader: /* glsl */`
      attribute vec4 aSeed, aRnd; uniform vec3 uFalls; uniform float uTime, uFogAmt;
      varying vec2 vUv; varying vec3 vW; varying vec4 vP; varying float vUp;   // vP: alpha, seed, t, river; vUp: -1 underside .. 1 top, on screen
      ${GLSL_FOG_PARS_VERT}
      void main(){
        float idx = aSeed.w, river = step(2.5, idx), pool = step(1.5, idx)*(1. - river);
        float t = fract(aSeed.y + uTime*mix(.06 + .025*aRnd.x, .085 + .04*aRnd.x, river));
        float top = idx < .5 ? ${SHELF_TOPS[0].toFixed(1)} : (idx < 1.5 ? ${SHELF_TOPS[1].toFixed(1)} : ${SHELF_TOPS[2].toFixed(1)});
        float bottom = idx < .5 ? ${FALL_BOTTOM[0].toFixed(1)} : (idx < 1.5 ? ${FALL_BOTTOM[1].toFixed(1)} : ${FALL_BOTTOM[2].toFixed(1)});
        // a quarter of its life rolling over the lip, a quick thin drop close to the shelf front, a long billow at the foot
        float t1 = clamp(t/.24, 0., 1.), t2 = clamp((t - .24)/.4, 0., 1.), t3 = clamp((t - .64)/.36, 0., 1.);
        vec3 c = vec3(aSeed.x + sin(uTime*.3 + aRnd.w*6.2832)*3.,
                      top + 2.5 + aRnd.y*2. + 1.5*sin(t1*3.1416) - (top - bottom - 7.)*pow(t2, 1.3) - (3. + 4.*pool)*t3,
                      ${SHELF_Z.toFixed(1)} + 18.*(1. - t1)*(1. - t1) - 2.5*t1 - (3.5 + aRnd.y*4.)*pow(t2, .6) - 3.*t2*t2 - (6. + aRnd.y*7. + 12.*pool)*t3);
        float k = 1. - t;
        vec3 rv = k*k*k*vec3(70., 15., 30.) + 3.*k*k*t*vec3(-95., 22., 28.) + 3.*k*t*t*vec3(-168., 38., -22.) + t*t*t*vec3(-262., -44., -100.);
        rv += vec3(0., aRnd.y*9. - 5., 0.) + (aRnd.w - .5)*vec3(14., 0., 44.)*(1. - .4*t);
        c = mix(c, rv, river);
        float size = mix(6.5 + 3.*t1 + 2.*t2 + (9. + 10.*pool)*t3, mix(17., 30., aRnd.z), river)*aSeed.z;
        float prog = idx < .5 ? uFalls.x : (idx < 1.5 ? uFalls.y : uFalls.z);
        prog = mix(prog, clamp(uFalls.z*1.6 - .5, 0., 1.), river);
        float front = prog*1.3 - .15*aRnd.z;
        float a = smoothstep(0., .08, t)*(1. - smoothstep(.82, 1., t))*(1. - smoothstep(front - .08, front, t));
        // a wisp while it drops (long, thin, faint), a billow at the foot
        float drop = sin(t2*3.1416)*(1. - river);
        a *= 1. - .5*drop;
        vec4 wc = modelMatrix*vec4(c, 1.);
        vec4 mvPosition = viewMatrix*wc;
        float rot = mix((aRnd.z - .5)*1.4*(1. - .8*drop), aRnd.z*6.2832, river) + uTime*.2*(aRnd.x - .5)*(1. - drop);
        vec2 q = mat2(cos(rot), sin(rot), -sin(rot), cos(rot))*(position.xy*vec2(mix(1., 1.5, river) - .3*drop, 1. + 1.5*drop))*size;
        vUp = q.y/max(size*.5, 1e-3);
        a *= smoothstep(12., 48., -mvPosition.z)*uFogAmt;
        vW = wc.xyz + (vec3(q, 0.)*mat3(viewMatrix));
        mvPosition.xy += q;
        vUv = position.xy*2.; vP = vec4(a, aRnd.w, t, river);
        gl_Position = a < .003 ? vec4(2., 2., 2., 1.) : projectionMatrix*mvPosition;
        ${GLSL_FOG_VERT}
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec3 vW; varying vec4 vP; varying float vUp;
      ${GLSL_HASH}${GLSL_VALUE_NOISE}${GLSL_FBM}${GLSL_LIGHT}${GLSL_FOOT}${GLSL_FOG_PARS_FRAG}
      void main(){
        vec3 P = vW - uOrigin;
        float r = length(vUv);
        float n = fbmLo(vUv*1.4 + vP.y*23. + vec2(0., uTime*.06));
        float d = (1. - r*r)*(.28 + 1.35*n) - .22 - .16*vnoise(vUv*4.6 + vP.y*51. - vec2(0., uTime*.1));
        float a = smoothstep(0., .95, d)*vP.x*mix(.6, .5, vP.w);
        float att = lcBulbAtt(length(uBulbPos - vW));
        float low = mix(.5, 1., smoothstep(10., 230., P.y));
        // lit from above: a bright crown, a teal underside
        float crown = smoothstep(-.75, .65, vUp + (n - .5)*.9);
        vec3 c = uBulbCol*(uBulb*(.42 + .58*att)*low*mix(.5, 1.16, crown))*mix(vec3(.55, .84, 1.), vec3(1.), n*low*crown);
        c += mix(uDarkCol, uShadowCol*(1.1*uKey.y), uBulb)*.7;
        c = mix(c, uGreenCol*(uBulb*1.4) + c*.15, (1. - vP.w)*exp(-abs(vP.z - .2)/.08)*.6);
        c = mix(c, uWarmCol*(uWarm*.85)*mix(.34, 1.1, crown) + c*mix(.55, .1, crown), lcBar(P)*.9*mix(.5, 1., crown));
        c *= .8 + .28*n;
        // at the foot of the slot every billow shows its lobes, turning over: thin in the creases, the crowns cold where the bulb reaches them
        float foot = lcFoot(P), roll = lcRoll(vUv*1.5 + vP.y*37., uTime);
        a *= mix(1., .66 + .48*roll, foot);
        c = mix(c*mix(1., .7 + .42*roll, foot), uBulbCol*vec3(.8, .93, 1.)*(uBulb*(.42 + .5*att)), foot*.3*roll*roll*smoothstep(.2, .9, crown));
        gl_FragColor = vec4(fxFogPremult(c*a, a), a);
      }`,
  });
  const mesh = new THREE.Mesh(g, material); mesh.renderOrder = 5.5; mesh.frustumCulled = true;
  return mesh;
}

// ---------------------------------------------------------------- assembly
function bottleMesh(profileName, list, material, seg) {
  const base = bottleGeometry(PROFILES[profileName], seg), g = new THREE.InstancedBufferGeometry(), n = list.length;
  g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('normal', base.attributes.normal); g.setAttribute('aPart', base.attributes.aPart);
  const aBase = new Float32Array(n * 3), aDim = new Float32Array(n * 4), aLiq = new Float32Array(n * 4), aCap = new Float32Array(n * 4), aFx = new Float32Array(n * 2);
  list.forEach((b, i) => {
    aBase.set([b.x, b.y, b.z], i * 3); aDim.set([b.R, b.H, b.fill, b.phase], i * 4);
    aLiq.set(b.liq, i * 4); aCap.set([b.cap[0], b.cap[1], b.cap[2], 1], i * 4); aFx.set([b.fizz, Math.min(b.lit, 2)], i * 2);
  });
  g.setAttribute('aBase', new THREE.InstancedBufferAttribute(aBase, 3)); g.setAttribute('aDim', new THREE.InstancedBufferAttribute(aDim, 4));
  g.setAttribute('aLiq', new THREE.InstancedBufferAttribute(aLiq, 4)); g.setAttribute('aCap', new THREE.InstancedBufferAttribute(aCap, 4));
  g.setAttribute('aFx', new THREE.InstancedBufferAttribute(aFx, 2));
  g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 210, 20), 265);
  const mesh = new THREE.Mesh(g, material); mesh.renderOrder = 2;
  return mesh;
}
export function pickVariant(vary, rng) {
  const hour = vary && vary.hour;
  if (hour === 'dawn' || hour === 'day') return 'morning';
  if (hour === 'golden') return 'party';
  if (hour === 'night') return rng.chance(0.4) ? 'party' : 'midnight';
  const r = rng(); return r < 0.4 ? 'midnight' : r < 0.7 ? 'morning' : 'party';
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('the-light-comes-on-door') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const detail = (ctx.quality && ctx.quality.detail) || 1;
  const vary = ctx.vary || {};
  const variant = opts.variant || pickVariant(vary, rng);
  const density = opts.density ?? vary.density ?? 1;
  const duration = opts.duration || DURATION;
  const frost = opts.frost ?? rng.range(0.25, 1);
  const bulbLocal = new THREE.Vector3().fromArray(opts.bulbPos || [95, 408, 90]);
  const diodeLocal = new THREE.Vector3().fromArray(opts.diodePos || [0, 414, 180]);

  // ---- the shared uniforms: one object per uniform, handed to every material (and to the world via hero.uniforms)
  const warmBase = variant === 'morning' ? new THREE.Color(1.0, 0.9, 0.68) : pal[5].clone();
  const partyCols = [new THREE.Color('#FF7FA8'), new THREE.Color('#FFC45A'), new THREE.Color('#A78BFF')];
  const U = {
    uTime: { value: 0 }, uBulb: { value: 1 }, uWarm: { value: 1 }, uDiode: { value: 1 }, uDoor: { value: 0 },
    uBulbPos: { value: bulbLocal.clone() }, uDiodePos: { value: diodeLocal.clone() }, uOrigin: { value: new THREE.Vector3() },
    uBulbCol: { value: pal[3].clone() }, uWarmCol: { value: warmBase.clone() }, uDiodeCol: { value: pal[4].clone() },
    uShadowCol: { value: pal[1].clone() }, uDarkCol: { value: pal[0].clone() }, uGreenCol: { value: pal[4].clone() },
    uBar: { value: new THREE.Vector4(0.3, 430, variant === 'morning' ? 0.9 : 0, 0) },
    uKey: { value: variant === 'morning' ? new THREE.Vector4(0.24, 1, 0.3, 0.5) : variant === 'party' ? new THREE.Vector4(0.05, 2.3, 0.2, 2.2) : new THREE.Vector4(0.04, 2.5, 0.2, 2.6) },
    uDark: { value: new THREE.Vector4(0, 0, 1, 0) },
    uSlosh: { value: new THREE.Vector4(0, 0, 0, 0.012) }, uPeel: { value: new THREE.Vector2(0, (PEEL[1] - PEEL[0]) * duration) }, uFalls: { value: new THREE.Vector3() },
  };
  // the shade is the look: deep teal at midnight, indigo at the party, and a bright green-white box in the morning
  if (variant === 'morning') U.uShadowCol.value.setRGB(0.07, 0.15, 0.125);
  else if (variant === 'party') U.uShadowCol.value.setRGB(0.0075, 0.0125, 0.04);
  const warmGain = variant === 'morning' ? 0.85 : variant === 'party' ? 0.95 : 1.0;

  // ---- layout (per seed): rack heights, what stands on the top rack, the cast of bottles
  const rackY = [34, 130, 224, 316].map((y, i) => y + (i === 0 ? rng.range(-1, 3) : rng.range(-3, 3)));
  rng.pick([['b', 'e', 's'], ['s', 'e', 'b'], ['e', 'b', 's'], ['s', 'b', 'e'], ['b', 's', 'e'], ['e', 's', 'b']]);   // (the draw is kept; the order is not)
  const order = ['s', 'e', 'b'];                         // from the latch end: bottles, where the dive leaves past them; the egg tray; the butter box by the hinge
  const topItems = { butterX: 0, eggX: 0, bottleSpans: [] };
  { let x = -118; const W = { b: 66, e: 100, s: 236 - 166 - 8 };
    for (const it of order) { if (it === 'b') topItems.butterX = x + 33; else if (it === 'e') topItems.eggX = x + 50; else topItems.bottleSpans.push([x, x + W.s]); x += W[it] + 4; } }
  const bottles = layoutBottles(rng, variant, rackY, topItems, density);

  const object = new THREE.Group(); object.name = 'the-light-comes-on:door';
  const pivot = new THREE.Group(); pivot.position.set(HINGE_X, 0, 0); object.add(pivot);
  const inDoor = (mesh) => { mesh.position.x = -HINGE_X; pivot.add(mesh); return mesh; };

  const enamel = enamelMaterial(U, frost);
  await ctx.yield?.();
  inDoor(new THREE.Mesh(await buildDoorGeometry(ctx, rng, rackY, topItems, bottles, bulbLocal.toArray()), enamel));
  await ctx.yield?.();
  if (opts.frame !== false) object.add(new THREE.Mesh(buildFrameGeometry(), enamel));
  await ctx.yield?.();
  const gasket = new THREE.Mesh(buildGasketGeometry(), gasketMaterial(U)); object.add(gasket);
  await ctx.yield?.();
  const glass = glassMaterial(U);
  const seg = 28;
  for (const name of Object.keys(PROFILES)) { const list = bottles.filter((b) => b.profile === name); if (list.length) { inDoor(bottleMesh(name, list, glass, seg)); await ctx.yield?.(); } }
  await ctx.yield?.();
  const shelfDepth = opts.shelfDepth ?? 34;
  if (shelfDepth > 0) {
    const sh = new THREE.Mesh(buildShelfGeometry(shelfDepth), shelfMaterial(U, frost, false, opts.lane)); sh.renderOrder = 1; object.add(sh);
    const clear = new THREE.Mesh(sh.geometry, shelfMaterial(U, frost, true, opts.lane)); clear.renderOrder = 2.5; object.add(clear);
  }
  await ctx.yield?.();
  let fog = null, bar = null;
  if (opts.fogFalls !== false) { fog = new THREE.Mesh(await buildFogGeometry(ctx, detail), fogMaterial(U, variant === 'morning' ? 0.72 : 1)); fog.renderOrder = 5; object.add(fog); }
  await ctx.yield?.();
  if (opts.fogFalls !== false) object.add(buildPuffs(rng, detail, U, variant === 'morning' ? 0.72 : 1));
  if (opts.barGlow !== false) { bar = new THREE.Mesh(buildBarGeometry(), barMaterial(U)); bar.renderOrder = 6; object.add(bar); }
  if (shelfDepth > 0) { const lips = new THREE.Mesh(buildLipGeometry(), lipMaterial(U)); lips.renderOrder = 5.8; object.add(lips); }
  await ctx.yield?.();

  // ---- progress
  const manual = { bulb: null, warm: null, diode: null, door: null, peel: null, falls: null };
  let driven = opts.progress != null, progress = opts.progress ?? 0.33;
  const peelY = (p) => (p >= 0.975 ? -100 : p <= 0.06 ? 430 : G_Y0 + (1 - (p - 0.06) / 0.9) * (G_Y1 - G_Y0));
  function apply(u) {
    progress = u;
    const ang = (manual.door ?? doorAngleDeg(u)) * DEG;
    U.uDoor.value = ang; pivot.rotation.y = -ang;
    const peel = manual.peel ?? peelAt(u);
    U.uPeel.value.x = peel; U.uBar.value.y = peelY(peel);
    U.uBar.value.w = smoothstep(0.25 * DEG, 2.5 * DEG, ang);
    for (let i = 0; i < 3; i++) U.uFalls.value.setComponent(i, manual.falls ? manual.falls[i] : clamp((u - FALL_WINDOWS[i][0]) / (FALL_WINDOWS[i][1] - FALL_WINDOWS[i][0]), 0, 1));
    U.uSlosh.value.x = sloshAt(u, duration, 0.42, 0.4, 0.3);
    U.uSlosh.value.y = sloshAt(u, duration, 0.31, 0.3, 1.5);
    U.uSlosh.value.z = 0.032 * sloshAt(u, duration, 0.5, 1.3, 0);
    U.uBulb.value = manual.bulb ?? smoothstep(0.1, 0.1 + 0.35 / duration, u);
    U.uWarm.value = (manual.warm ?? smoothstep(0.1, 0.2, u)) * warmGain;
  }
  apply(progress);

  // ---- anchors (hero-local; the hero's origin is the brief's (0, 0, -240), i.e. local z = brief z + 240)
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const exitFrom = V3(-95, 92, -8), seat = V3(-150, 72, -21);
  const anchors = {
    hinge: V3(HINGE_X, 210, 0), latchShut: V3(-150, 210, 0), latchAt12: V3(150 - 300 * Math.cos(12 * DEG), 210, -300 * Math.sin(12 * DEG)), latchAt15: V3(150 - 300 * Math.cos(15 * DEG), 210, -300 * Math.sin(15 * DEG)),
    portalSeat: { position: seat, facing: exitFrom.clone().sub(seat).normalize(), radius: 7, slotWidth: 43 },
    exitLine: [exitFrom, seat],
    flyThrough: [V3(70, 345, 110), V3(34, 343, 46), V3(4, 338, 24), V3(-24, 312, 28), V3(-52, 250, 31), V3(-76, 170, 28), V3(-90, 118, 14), exitFrom, seat],
    viewpoints: { remember: V3(-12, 346, 172), hairpin: V3(14, 341, 24), dive: V3(-58, 236, 31), canyonFloor: V3(-84, 124, 18), exit: V3(-116, 84, -13), whole: V3(0, 240, 236) },
    lookAt: { door: V3(-30, 300, 0), topRack: V3(0, rackY[3] + 32, 18), hairpinRack: V3(84, rackY[3] + 31, 20), slot: V3(-146, 250, -30), slotFoot: V3(-150, 80, -22), falls: V3(0, 215, 48) },
    bulb: bulbLocal.clone(), diode: diodeLocal.clone(),
    shelfEdges: SHELF_TOPS.map((y) => ({ from: V3(-148, y, SHELF_Z), to: V3(148, y, SHELF_Z) })),
    fallFeet: [V3(0, FALL_BOTTOM[0] + 3, 50), V3(0, FALL_BOTTOM[1] + 3, 50), V3(0, 18, 40)],
    river: [V3(80, 14, 30), V3(-50, 16, 29), V3(-134, 28, 6), V3(-157, 32, -18), V3(-216, 8, -72)],
    rackFloors: rackY.slice(), rackFrontZ: 38,
    bottles: bottles.map((b) => ({ position: V3(b.x, b.y, b.z), radius: b.R, height: b.H, rack: b.rack, kind: b.profile, fizz: !!b.fizz })),
    butterBox: V3(topItems.butterX, rackY[ITEM_RACK] + 20, 19), eggTray: V3(topItems.eggX, rackY[ITEM_RACK] + 12, 19),
    keepOut: [{ min: V3(-150, 10, -36), max: V3(150, 410, 39), note: 'door volume when shut; it rotates about the hinge by hero.doorAngle()' }],
  };

  const hero = {
    object, radius: 235, height: 420, center: V3(0, 215, 10), anchors, ground: false, groundY: 0,
    variant, uniforms: U, glsl: { light: GLSL_LIGHT, beads: GLSL_BEADS }, pivot,
    setProgress(u) { driven = true; apply(clamp(u, 0, 1)); },
    setBulb(v) { manual.bulb = v; U.uBulb.value = v ?? U.uBulb.value; },
    setWarm(v) { manual.warm = v; if (v != null) U.uWarm.value = v * warmGain; },
    setDiode(v) { manual.diode = v; },
    setDoor(deg) { manual.door = deg; apply(progress); },
    setPeel(p) { manual.peel = p; apply(progress); },
    setFalls(a, b, c) { manual.falls = a == null ? null : [a, b, c]; apply(progress); },
    doorAngle() { return U.uDoor.value; },
    // where the zip is now, on the cabinet edge (hero-local): aim a poi here during the peel
    peelPoint(out = new THREE.Vector3()) { return out.set(-146, clamp(U.uBar.value.y, G_Y0, G_Y1), -4); },
    // a point given in door coordinates (door shut) carried to where the door is now (hero-local)
    doorPoint(p, out = new THREE.Vector3()) { const a = U.uDoor.value, c = Math.cos(a), s = Math.sin(a), x = p.x - HINGE_X, z = p.z; return out.set(HINGE_X + x * c - z * s, p.y, x * s + z * c); },
    update(dt, time, camera) {
      U.uTime.value = time;
      object.updateWorldMatrix(true, false);
      U.uOrigin.value.setFromMatrixPosition(object.matrixWorld);
      U.uBulbPos.value.copy(bulbLocal).applyMatrix4(object.matrixWorld);
      U.uDiodePos.value.copy(diodeLocal).applyMatrix4(object.matrixWorld);
      if (!driven) apply(clamp(0.1 + (time - 4) * 0.022, 0, 1));
      U.uDiode.value = manual.diode ?? (0.8 + 0.2 * Math.sin(time * 0.8));
      if (variant === 'party') {
        const ph = time / 6, i = Math.floor(ph) % 3, f = smoothstep(0.2, 0.8, ph - Math.floor(ph));
        U.uWarmCol.value.copy(partyCols[i]).lerp(partyCols[(i + 1) % 3], f);
      }
    },
    dispose() {},
  };
  return hero;
}

// the world builds its shell, shelves' cast and furniture out of the same pieces
export { PROFILES, bottleMesh, glassMaterial, enamelMaterial, rbox, paint, tube, rod, knob, latheProfile, GLSL_LIGHT, GLSL_BEADS, GLSL_FOOT, doorAngleDeg };
