// Painted Where You Stood: the central device.
// One scene, two layers. The valley (layer 1) is never seen directly: it is drawn into a target from a "station"
// and the hall (layer 0) wears that target as paint, projected from the station. While the station is carried with
// the camera the paint is solved afresh every frame and passes for a place; when the station stops at S it is paint.
// Everything here is authored in CANONICAL space (the hall bending right); the root group may mirror it (mx = -1).
import * as THREE from 'three';

export const LAYER_VALLEY = 1;
export const GEO = {
  S: [0, 10, -138], H: [0, 15, -258], L: [180, 14, -283], E: [180, 14, -138],
  // ARM TWO: a short white arm (z -350..-280) that opens at x = XB into the room of the cut walls (x XB..XE, z -350..ZN).
  // The cone's axis runs along +z through L and E; walls 1 to 3 are FINS standing out from the east wall, each ending just
  // past its own hole, so from the arm their five faces and four of their holes are seen side by side; walls 4 and 5 cross the whole room.
  // The cone is 145 m long and the walls stand 28 to 30 m apart, so the row is 115 m deep and reads as a row from across the room.
  wallZ: [-253, -225, -197, -168, -138.4], XB: 84, XE: 286, ZN: -137.6,
  // each hole a step wider than the next in the cone: from L the five edges are five exact concentric rims. The steps are
  // broad (the first rim nearly three times the disc), so the near holes are 16 to 26 m across and are plainly holes from 100 m away.
  rho: [3.5, 2.1, 1.55, 1.22, 1.0],
  ring: [0, 14.2, -228, 7], fallZ: -226, wallSlope: 21 / 258, ceil: 48,
  portalR: 15, cone: 13.5,          // the real exit is larger than the painted one so that the five holes read from far off (see proto.md)
};
// THE FIVE CUT WALLS are 1.4 m through, as they were built: local z of a slab's two faces (the front looks back toward L). A thicker slab
// makes each hole a tunnel and covers the pieces of the way out seen through the row from the side, which are the room's subject.
const WALL_ZF = -0.9, WALL_ZB = 0.5;
const lerp = (a, b, t) => a + (b - a) * t, sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// THREE THINGS OF ROUND flight5, EACH BEHIND ONE SWITCH (1 is on; 0 leaves the world as it was, to the pixel). Every line of each thing
// carries its tag: [F5-STAIR], [F5-PIERS], [F5-SPAN].
export const LEE_STAIR = 1;      // [F5-STAIR] the stair the painter never saw: one stair of the hall's own stone in the place pier B hides from S
export const FAR_PIERS = 0;      // [F5-PIERS] plain wall-piers on the far wall of the room of the cut walls, one midway between each two skylights
export const SWALLOW_SPAN = 1;   // [F5-SPAN] swallows 0 and 1 as large as the shadows they throw (R1: the pale underside is out; the bird's shaders are live's text)
// [C1-LEAF] THE LEAVES' NEAR LAW (cure1, the owner's section 128; 1 is on, 0 leaves the leaf shader's text and uniforms exactly as they were).
// The birch picture's falling leaves are particles: each one's size goes smoothly to nothing as the eye of the pass that draws it comes near
// (three's cameraPosition: the station's camera, the only camera that draws the valley's layer; it is the flown eye until S and S after).
// The two figures are the kit's (src/kit/fx.js, falling particles, preset 'petals', near: [0.6, 2.5]): gone inside 0.6 m, whole from 2.5 m.
export const LEAF_NEAR = 1;
// [C2-LID] THE LEAF BORN AT THE LID (cure2, the owner's ruling of 8 October 20:04; 1 is on, 0 leaves the leaf shader's text exactly as cure1's).
// A birth by the leaf's own height, never by the lens and never by the route: each leaf grows in over its first two metres under the lid
// of its wrap and goes out the same way over its last two metres above the floor, one smooth step each. No leaf moved, no lid moved, no draw changed.
export const LEAF_LID = 1;
// [F5-STAIR] the stair's own figures, in the hall's metres (the places they give are worked out in stairPlan(), from GEO.S, PIER_B and the walls):
const STAIR = {
  go: 3,              // a tread is one flag deep (the flags are 3 m square: p.xz/3 in the hall shader), so every riser stands on a joint of the flags
  rise: 1.5,          // a riser is half a course of the walls' blocks (courses are 3 m: p.y/3)
  behindPier: 6,      // the first riser stands on the first joint at least 6 m behind pier B's back face (the order's figure)
  out: 10,            // 10 m out from wall W (the order's figure), narrowed in stairPlan() until the margin below holds
  inShadow: 4.5,      // every point at least two strokes (2 x 2.2 m, the longest dab) inside pier B's shadow from S
  lower: 6,           // the lower flight: six risers, to the terrace at 9 m
  lowTo: -325,        // nothing stands above the terrace north of this z: 3 m beyond where the crossing swallow's second pass begins (z -322)
  farZ: -350,         // the far wall
};
// [F5-PIERS] the far wall's piers: of the family of piers A and B (A is 8 m square), 6 m proud, on the skylights' own module
const FARP = { half: 4, proud: 6, slot0: GEO.XB - 8, module: 30, farZ: -350, clearS: 4.5 };      // slot0, module: the SL0 and the 30. of the hall shader's slotBar; clearS: two strokes east of where the paint ends
// [F5-SPAN] live's scale for swallows 0 and 1 is 1 + 0.9*wc (1 to 1.9; a bird is 1.125 m across at scale 1). The floor: a span of
// 2.0 m, four times the brief's 0.5 m (the end of "two to four times the brief's span", the amendment of 19:52), over the 1.125 m of scale 1:
// 1.778. It is also the dark of the shadow the hall shader draws for the bird (2.1 m to the middle of its soft edge). Never past live's 1.9.
const SPAN_FLOOR = SWALLOW_SPAN ? (4 * 0.5) / 1.125 : 1;

const NOISE = /* glsl */`
  float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
  float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
  float fbm(vec2 p){ return .5*vn(p)+.25*vn(p*2.03+7.1)+.125*vn(p*4.01+3.3)+.0625*vn(p*8.07+1.7); }
`;
// light shared by every valley shader: sun (with a baked cast shadow sh), sky fill, a little green bounce, coloured shadow,
// haze by distance from the station, thicker low in the valley and a touch brighter toward the sun
const VLIGHT = /* glsl */`
  uniform vec3 uSun, uSunCol, uFill, uShadow, uHaze, uEye; uniform float uTime, uHazeK, uFront;
  // one cloud's shadow lies across the middle of the valley at the entry (sun on the forest under us, sun on the head of the valley
  // beyond it) and travels on up the valley ahead of us, over the foot of the fall and up the headwall; uFront = z of its near edge
  float cfront(vec3 p){ float e=uFront-p.z+16.*sin(p.x*.031+1.3)+7.*sin(p.x*.083+p.z*.027)+.14*p.x; return 1.-.55*smoothstep(-14.,14.,e)*(1.-smoothstep(82.,116.,e)); }
  vec3 vlit(vec3 alb, vec3 n, float sh){
    float nl=max(dot(n,uSun),0.)*sh, hemi=.5+.5*n.y;
    vec3 amb=uFill*(.30+.80*hemi)+uSunCol*vec3(.9,.85,.6)*.07*(1.-hemi)*(.4+.6*sh);       // sky from above, warm ground bounce from below
    return alb*(uSunCol*nl+amb)+alb*uShadow*(1.-nl)*.30; }
  vec3 vhaze(vec3 c, vec3 p){ vec3 v=p-uEye; float d=length(v);
    float f=1.-exp(-d*uHazeK*(.42+.75*exp(-max(p.y+8.,0.)*.016)));
    float sd=max(dot(v/max(d,1e-3),uSun),0.);
    return mix(c, uHaze*(1.+.30*sd*sd), f); }
`;

// ---------------------------------------------------------------- the sun's cast shadow, baked: a coarse height map marched toward the sun
async function makeShadow(ctx, shape, sun) {
  const X0 = -208, Z0 = 140, D = 4, nx = 105, nz = 112, H = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) { for (let i = 0; i < nx; i++) H[j * nx + i] = shape.h(X0 + i * D, Z0 - j * D); if (j % 8 === 7) await ctx.yield(); }
  const sample = (x, z) => {
    const fx = Math.min(nx - 1.001, Math.max(0, (x - X0) / D)), fz = Math.min(nz - 1.001, Math.max(0, (Z0 - z) / D)), i = fx | 0, j = fz | 0, a = fx - i, b = fz - j, k = j * nx + i;
    return (H[k] * (1 - a) + H[k + 1] * a) * (1 - b) + (H[k + nx] * (1 - a) + H[k + nx + 1] * a) * b;
  };
  const sx = sun.x, sy = sun.y, sz = sun.z;
  return (x, y, z) => {                                       // 1 = in the sun, 0 = in cast shadow, soft at the edge
    if (Math.abs(x) > 206 || z > 138 || z < -302) return 1;
    let s = 1;
    for (let i = 1; i <= 24; i++) {
      const t = 2.5 * i + 0.42 * i * i, dh = sample(x + sx * t, z + sz * t) - (y + 1.5 + sy * t);
      if (dh > 0) { s = Math.min(s, 1 - dh / (0.07 * t + 2)); if (s <= 0) return 0; }
    }
    return s;
  };
}

// ---------------------------------------------------------------- the valley's shape (canonical space)
const FAR = { r0: 34, r1: 62, p0: 78, p1: 46, s: 36, w: 15000 };      // the land beyond the headwall: second ridge (base, relief), the peak (mass, relief, summit spike, width)
export function valleyShape(noise) {
  const rc = (z) => lerp(11 * Math.sin(z * 0.019 + 0.6) + 5 * Math.sin(z * 0.043 + 2.1), 3.5, sstep(-150, -222, z));
  // the foot of the cliffs: spurs come out from the two sides in turn, so the walls overlap one behind another down the valley
  const half = (z, x = 0) => 46 + 6 * noise.n2(z * 0.008, 3.1) + (x < 0 ? 1 : -1) * 11 * Math.sin(z * 0.026 + 0.9) * sstep(30, -20, z);
  const h = (x, z) => {
    const r = rc(z), d = Math.abs(x - r * 0.3), dr = Math.abs(x - r);
    let y = -6.3 + 0.0040 * d * d + 2.0 * noise.fbm2(x * 0.021, z * 0.021, 3);
    if (z > -226) y = lerp(y, -8.2, sstep(8, 2.6, dr));                                  // river bed
    const hf = half(z, x), c = sstep(hf - 5, hf + 34, d);
    const tp = lerp(1, 0.42, sstep(-50, -250, z));                                         // the walls come down toward the head, opening a notch of sky over the ring
    y += tp * (c * (118 + 22 * noise.fbm2(x * 0.011, z * 0.011, 3)) + c * (1 - c) * 46 * noise.ridged2(x * 0.03 + 9, z * 0.022, 3));
    y += sstep(hf + 30, hf + 200, d) * 30 * (0.5 + noise.fbm2(x * 0.006, z * 0.006, 3));
    const s = sstep(-225.5, -231, z);                                                      // the rock step under the ring
    if (s > 0) y = Math.max(y, lerp(y, 5.6 + 1.2 * noise.n2(x * 0.08, z * 0.08), s));
    const head = sstep(-234, -288, z);                                                     // a headwall closes the valley behind the ring: no bright gap at the foot of the cliffs
    y += head * (40 + 24 * noise.fbm2(x * 0.012 + 7, z * 0.012, 3) - 16 * Math.exp(-x * x / 900) + 22 * sstep(16, 46, Math.abs(x)));
    const back = sstep(-300, -560, z);                                                     // beyond it a second, hazier ridge, and one tall peak standing in the notch
    y += back * (34 + 80 * noise.ridged2(x * 0.0045 + 3, z * 0.0045, 4)) * (0.55 + 0.45 * sstep(0, 160, Math.abs(x) + 60));
    const px = x - 26, pz = z + 705, pk = Math.exp(-(px * px + pz * pz * 0.7) / 21000);
    y += pk * (205 + 70 * noise.ridged2(x * 0.011 + 1, z * 0.011, 3)) + 60 * Math.exp(-(px * px * 0.5 + pz * pz) / 2600);
    // BEYOND THE HEADWALL THE LAND STANDS UNDER THE NOTCH, NOT OVER IT. The trough's sides no longer climb on behind the head of
    // the valley: there is the second ridge, low and jagged, and the one peak with two falling shoulders, and above them a strip
    // of sky, also from the entry, which looks down as it descends (the top of its frame is only 21 degrees up).
    const far = sstep(-300, -430, z);
    if (far > 0) {
      const ridge = FAR.r0 + FAR.r1 * noise.ridged2(x * 0.0045 + 3, z * 0.0045, 4);
      const mass = Math.exp(-(px * px + pz * pz * 0.7) / FAR.w) * (FAR.p0 + FAR.p1 * noise.ridged2(x * 0.011 + 1, z * 0.011, 3)) + FAR.s * Math.exp(-(px * px * 0.5 + pz * pz) / 2600);
      y = lerp(y, ridge + mass, far);
    }
    return y;
  };
  return { rc, half, h };
}

// ---------------------------------------------------------------- terrain meshes (near fine, far coarse)
async function buildTerrain(ctx, shape, P, U, group, lit) {
  const { h, rc, half } = shape, noise = ctx.noise;
  const peak = new THREE.Vector3(26, 0, -705);                                                // the summit of the peak in the notch, as built (its arêtes run down from it)
  for (let x = -40; x <= 92; x += 6) for (let z = -645; z >= -765; z -= 6) { const y = h(x, z); if (y > peak.y) peak.set(x, y, z); }
  const mat = new THREE.ShaderMaterial({
    name: 'pwys-terrain', uniforms: { ...U, uFlower: { value: new THREE.Color(P.flower || '#F3E9B0') }, uBand: { value: new THREE.Color(P.band || P.rock) }, uStrata: { value: P.strata ?? 0 }, uGully: { value: P.snow ? 1 : 0 }, uHeadRock: { value: P.headRock ?? 0 }, uBounce: { value: P.bounce ?? 0.05 }, uRockC: { value: new THREE.Color(P.rock) }, uSnowY: { value: (P.snow ?? 150) - 55 }, uPeak: { value: peak } }, vertexColors: true, fog: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute float aSh, aRk; uniform float uHeadRock; varying vec3 vP, vN, vC; varying float vSh, vRk;
      void main(){ vP=position; vN=normal; vC=color; vSh=aSh; vRk=aRk*uHeadRock; gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); }`,
    fragmentShader: /* glsl */`precision highp float;
      varying vec3 vP, vN, vC; varying float vSh, vRk; uniform vec3 uFlower, uBand, uRockC, uPeak; uniform float uStrata, uGully, uBounce, uSnowY; ${NOISE} ${VLIGHT}
      // THE PEAK IN THE NOTCH: arêtes and gullies run down from the summit (th = bearing round the summit, ro = metres out from it),
      // three sizes of rib, each a crest with a sharp edge; the finer ones only where they are wider than a pixel or two
      float prib(float th, float ro){ float a=vn(vec2(th, ro)); return 1.-abs(a*2.-1.); }
      float prel(float th, float ro, float w2, float w3){
        return .55*prib(th*2.3, ro*.0040)+.30*w2*prib(th*6.1+1.3, ro*.0085+5.)+.15*w3*prib(th*14.3+4.1, ro*.019+9.); }
      void main(){
        vec3 n=normalize(vN+vec3(0.,1e-4,0.));
        float dist=length(vP-uEye), near=1.-smoothstep(40.,150.,dist);
        float big=fbm(vP.xz*.035+3.), med=fbm(vP.xz*.35);
        float rock=max(smoothstep(.50,.72,1.-n.y+(big-.5)*.16), smoothstep(.35,.75,vRk));
        // rock: tall ribs and gullies cut along the face (the sun rakes across them), uneven beds that step back as ledges
        // with a shadow line under each, a few big joints; grass only where the ground really levels
        vec3 tw=vec3(n.z,0.,-n.x); tw/=max(length(tw),1e-3);                                 // along the face, level
        float along=dot(vP,tw)+vP.y*.22;
        float rb=vn(vec2(along*.050, vP.y*.010)+11.)*.62+vn(vec2(along*.135+3., vP.y*.028))*.38;
        float rbs=(vn(vec2(along*.050+.030, vP.y*.010)+11.)-vn(vec2(along*.050-.030, vP.y*.010)+11.))*.62
                 +(vn(vec2(along*.135+3.05, vP.y*.028))-vn(vec2(along*.135+2.95, vP.y*.028)))*.38;      // its slope along the face
        float bed=vP.y*.085*(1.+1.1*uStrata)+along*.012+((1.5-.9*uStrata)*vn(vP.xz*.016)+.5*vn(vP.xz*.07+7.))*mix(1.,.22,vRk), bi=floor(bed), fb=fract(bed);   // at the head of the valley the beds lie level
        float bw=.30+.55*h21(vec2(bi,7.)), strong=smoothstep(.35,.75,vn(vec2(along*.03,bi*3.7))), ledge=smoothstep(bw,bw+.05,fb)*strong, under=smoothstep(bw-.14,bw,fb)*(1.-smoothstep(bw,bw+.05,fb))*strong;
        float quiet=max(smoothstep(.70,.90,min(vC.r,min(vC.g,vC.b))), .92*(1.-smoothstep(-300.,-258.,vP.z))); ledge*=1.-.92*quiet; under*=1.-.92*quiet;   // snow and far faces carry no beds (they read as contour swirls)
        float gentle=1.-smoothstep(.22,.50,1.-n.y);                                               // on the easier slopes ribs and beds are quieter (no contour-map swirls)
        vec3 nr=n-tw*rbs*7.5*(1.-.88*max(gentle,vRk))*(1.-quiet)+vec3(0.,(ledge*.55-under*.35)*(1.-.7*gentle),0.); nr/=max(length(nr),1e-3);
        float tone=mix(.80+.26*h21(vec2(bi,3.)), .93, .65*gentle)*mix(.74+.50*rb, .97, .6*gentle)*(.92+.16*vn(vP.xz*1.3+vP.y*.9))*(1.-.22*under*(1.-.7*gentle));
        tone*=1.-.16*smoothstep(.46,.5,abs(vn(vec2(along*.021, vP.y*.007)+rb*.4)-.5)*2.)*(1.-quiet); tone=mix(tone, .93+.10*rb, .85*quiet);       // a few long joints
        vec3 rk=vC*tone*mix(1., mix(.76+.48*h21(vec2(bi,3.)), 1., .55*gentle), uStrata);
        rk=mix(rk, uBand*tone, uStrata*.46*(1.-.5*gentle)*step(.62,h21(vec2(bi,9.))));                                // strata: beds of another stone, level across the cliffs
        rk*=mix(vec3(1.), vec3(1.14,1.0,.82), smoothstep(.45,.8,vn(vP.xz*.017+vP.y*.011)))*mix(vec3(1.), vec3(1.20,1.07,.90), .7*uGully);               // weathering stain, warm
        rk=mix(rk, vec3(.90,.94,1.), uGully*.80*(1.-smoothstep(.20,.31,rb))*smoothstep(62.,108.,vP.y+22.*big)*smoothstep(.50,.68,vn(vec2(along*.011,5.3)+vP.y*.004))*(1.-gentle)*(1.-vRk));  // old snow lying in the gullies between the ribs
        // meadow: mottled turf, wind running over it, a scatter of flowers near the eye
        float wind=vn(vP.xz*.06+vec2(uTime*.55,uTime*.21));
        float blade=vn(vP.xz*3.1)*vn(vP.xz*7.3+2.);
        vec3 gr=vC*(.70+.42*med+.26*big)*(.90+.22*smoothstep(.35,.8,wind))*(.86+.5*blade*near);
        vec2 fc=vP.xz*1.35; float fl=step(.955,h21(floor(fc)))*(1.-smoothstep(.12,.34,length(fract(fc)-.5)))*near*smoothstep(.45,.7,big)*(1.-rock)*smoothstep(.86,.95,n.y);
        gr=mix(gr, uFlower, fl*.85);
        // THE HEAD OF THE VALLEY AND THE PEAKS IN THE NOTCH are a few big triangles: their rock and snow are drawn here, per pixel
        // (steep ribs of bare rock standing out of the snow, snow lying in the gullies and on every shelf), never smeared from the corners.
        float hw=1.-smoothstep(-296.,-256.,vP.z);
        vec2 fq=vec2(vP.x*.017+vP.z*.006, vP.y*.021);
        float f1=fbm(fq+5.), f2=fbm(fq*2.7+9.), ribv=vn(vec2(vP.x*.050+vP.z*.025+f1*1.1, vP.y*.006))*.6+vn(vec2(vP.x*.135+vP.z*.06+f2*.8, vP.y*.016))*.4;
        float snowL=smoothstep(.44,.60, ribv*.78+f1*.22+(n.y-.5)*.8+(vP.y-uSnowY)*.0055)*uGully;
        vec3 rockc=uRockC*(.50+.75*f2)*(.70+.60*ribv)*mix(vec3(1.), vec3(1.12,1.,.86), smoothstep(.45,.8,f1));
        vec3 hc=mix(mix(rk*(.72+.56*f2)*(.80+.40*ribv), rockc, uGully), vec3(.50,.53,.58)*(.86+.22*f2), snowL);
        float hrock=hw*smoothstep(16.,52.,vP.y+18.*f1)*mix(.0,1.,uGully);
        rock=max(rock, hrock); rk=mix(rk, hc, hw);
        vec3 alb=mix(gr, rk, rock); n=normalize(mix(n, nr, rock)+vec3(0.,1e-4,0.));
        alb*=mix(vec3(1.), vec3(1.40,1.13,.76), uGully*rock*(1.-snowL*hw)*smoothstep(.05,.55,dot(n,uSun))*.85);          // the slate takes the sun warm and keeps its blue in the shade
        n=normalize(n+(tw*(ribv-.5)*1.5+vec3(0.,(f2-.5)*.7+.5*snowL,0.))*hw*rock+vec3(0.,1e-4,0.));
        // BEYOND THE HEADWALL (alpine): the second ridge and the snow peak. Crisp, sunlit snow with clear ridges and blue shade:
        // every rib has a sunlit flank (the sun rakes in from the left) and a flank in shade, meeting in one sharp edge; bare slate
        // where a flank is steep and below the snow line; nothing is stretched down the face and nothing follows the contours.
        float pkw=(1.-smoothstep(-345.,-305.,vP.z))*uGully, shP=1.;
        if(pkw>0.){
          vec2 pd=vP.xz-uPeak.xz; float ro=length(pd)+1e-3, th=atan(pd.x, abs(pd.y)<1e-4?1e-4:pd.y)+(f1-.5)*.50;
          float w2=smoothstep(22.,70.,ro), w3=smoothstep(70.,170.,ro);
          float r0=prel(th,ro,w2,w3), sl=(prel(th+.012,ro,w2,w3)-prel(th-.012,ro,w2,w3))/.024;       // the ribs' slope across the fall line
          vec3 tg=vec3(pd.y,0.,-pd.x)/ro, ng=normalize(vN+vec3(0.,1e-4,0.));
          vec3 np=normalize(ng-tg*sl*.24*ng.y*(.75+.5*f2));
          vec3 rake=normalize(vec3(uSun.x*1.9, uSun.y*.50, uSun.z*.55));
          shP=smoothstep(-.02,.13,dot(np,rake));                                                  // the edge between light and shade is sharp
          float line=smoothstep(52.,96.,vP.y+30.*(f1-.5)+16.*(r0-.5));                             // the snow line
          float steepK=max(smoothstep(.50,.78,abs(sl)*.21+(f2-.5)*.30), smoothstep(.62,.80,1.-ng.y));
          float snowP=line*(1.-.85*steepK);
          vec3 rockP=uRockC*(.34+.42*f2)*(.80+.40*r0)*mix(vec3(.80,.92,1.12), vec3(1.30,1.10,.82), shP);        // slate: warm in the sun, blue in the shade
          vec3 snowC=mix(vec3(.50,.61,.84), vec3(.70,.70,.68), shP)*(.94+.12*r0);                    // snow: white in the sun, blue in the shade
          alb=mix(alb, mix(rockP, snowC, snowP), pkw); n=normalize(mix(n, np, pkw)+vec3(0.,1e-4,0.)); shP=mix(1., shP, pkw); }
        float cl=.56+.44*smoothstep(.40,.58,vn(vP.xz*.014+vec2(uTime*.16,uTime*.045))*.75+vn(vP.xz*.031-vec2(uTime*.2,uTime*.05)+4.)*.25);                   // drifting cloud shade
        cl*=cfront(vP);
        vec3 c=vlit(alb, n, cl*vSh*shP);
        c+=alb*uSunCol*uBounce*(1.-cl*vSh)*(.35+.65*rock)*(.55+.45*n.y)*(1.-pkw);                        // light thrown back into the shade by the sunlit flank
        gl_FragColor=vec4(vhaze(c,vP),1.);
      }`,
  });
  const meadow = new THREE.Color(P.meadow), meadow2 = new THREE.Color(P.meadow2), rock = new THREE.Color(P.rock), rockD = new THREE.Color(P.rockDark), bank = new THREE.Color(P.bank);
  const col = new THREE.Color(), snow = new THREE.Color('#F4F7FA'), floorC = new THREE.Color(P.tree).lerp(meadow, 0.45);
  const grid = async (x0, x1, z0, z1, nx, nz, skip) => {
    const pos = new Float32Array((nx + 1) * (nz + 1) * 3), cols = new Float32Array((nx + 1) * (nz + 1) * 3), nor = new Float32Array((nx + 1) * (nz + 1) * 3), shd = new Float32Array((nx + 1) * (nz + 1)), rkk = new Float32Array((nx + 1) * (nz + 1));
    const dx = (x1 - x0) / nx, dz = (z1 - z0) / nz; let k = 0;
    for (let j = 0; j <= nz; j++) {
      const z = z0 + dz * j;
      for (let i = 0; i <= nx; i++, k += 3) {
        const x = x0 + dx * i, y = h(x, z);
        const e = 1.5, hx = h(x + e, z) - h(x - e, z), hz = h(x, z + e) - h(x, z - e), il = 1 / Math.hypot(hx, 2 * e, hz);
        pos[k] = x; pos[k + 1] = y; pos[k + 2] = z; nor[k] = -hx * il; nor[k + 1] = 2 * e * il; nor[k + 2] = -hz * il;
        const steep = sstep(0.55, 0.8, 1 - nor[k + 1]), d = Math.abs(x - rc(z) * 0.3), up = sstep(half(z, x) + 20, half(z, x) + 60, d);
        col.copy(meadow).lerp(meadow2, sat(0.5 + 0.9 * noise.fbm2(x * 0.03 + 5, z * 0.03, 2)));
        col.lerp(floorC, (P.floorDark ?? 0.55) * sstep(-0.25, 0.3, noise.fbm2(x * 0.016 + 40, z * 0.016, 2)) * (y < 46 ? 1 : 0));           // darker, cooler turf where the trees stand thick
        if (z > -226) col.lerp(bank, sstep(9, 4, Math.abs(x - rc(z))) * 0.8);
        rkk[k / 3] = sstep(-233, -246, z) * sstep(2, 9, y);
        col.lerp(rock, Math.max(steep, sstep(-233, -246, z) * 0.92)).lerp(rockD, steep * sat(0.5 + noise.n2(x * 0.02, y * 0.05)) * 0.6);
        col.lerp(meadow2, up * (1 - steep) * sstep(0.80, 0.93, nor[k + 1]) * 0.25);
        if (z < -231) col.lerp(rockD, 0.75 * Math.exp(-x * x / 2200) * sstep(70, 20, y));                         // a darker recess of wet rock behind the ring
        if (P.snow) col.lerp(snow, sstep(P.snow, P.snow + 45, y + 30 * noise.n2(x * 0.01, z * 0.01)) * (1 - 0.55 * steep));
        cols[k] = col.r; cols[k + 1] = col.g; cols[k + 2] = col.b; shd[k / 3] = lit(x, y, z);
      }
      if (j % 6 === 5) await ctx.yield();
    }
    const idx = [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      if (skip && skip(x0 + dx * (i + 0.5), z0 + dz * (j + 0.5))) continue;
      const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, b, c, b, d, c);   // z0 > z1: this winding faces up
    }
    let P3 = pos, N3 = nor, C3 = cols, S1 = shd, R1 = rkk;
    if (!skip) {                                             // a skirt hangs from the fine grid's far and side edges, so no sky shows where it meets the coarse one
      const edge = []; for (let i = 0; i <= nx; i++) edge.push(nz * (nx + 1) + i);
      const left = [], rightE = []; for (let j = 0; j <= nz; j++) { left.push(j * (nx + 1)); rightE.push(j * (nx + 1) + nx); }
      const runs = [edge, left, rightE], extra = edge.length + left.length + rightE.length, n0 = pos.length / 3;
      P3 = new Float32Array(pos.length + extra * 3); N3 = new Float32Array(P3.length); C3 = new Float32Array(P3.length); S1 = new Float32Array(P3.length / 3); R1 = new Float32Array(P3.length / 3); P3.set(pos); N3.set(nor); C3.set(cols); S1.set(shd); R1.set(rkk);
      let q = n0;
      for (const run of runs) for (let r = 0; r < run.length; r++, q++) {
        const v = run[r] * 3; P3[q * 3] = pos[v]; P3[q * 3 + 1] = pos[v + 1] - 110; P3[q * 3 + 2] = pos[v + 2];
        N3[q * 3] = nor[v]; N3[q * 3 + 1] = nor[v + 1]; N3[q * 3 + 2] = nor[v + 2]; C3[q * 3] = cols[v]; C3[q * 3 + 1] = cols[v + 1]; C3[q * 3 + 2] = cols[v + 2]; S1[q] = shd[run[r]]; R1[q] = rkk[run[r]];
        if (r > 0) idx.push(run[r - 1], run[r], q - 1, run[r], q, q - 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P3, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N3, 3));
    g.setAttribute('color', new THREE.BufferAttribute(C3, 3)); g.setAttribute('aSh', new THREE.BufferAttribute(S1, 1)); g.setAttribute('aRk', new THREE.BufferAttribute(R1, 1)); g.setIndex(idx);
    const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.layers.set(LAYER_VALLEY); group.add(m);
    await ctx.yield();
    return m;
  };
  await grid(-120, 120, 126, -294, 80, 140, null);                                            // 3 m cells: 21k triangles
  await grid(-240, 240, -294, -774, 40, 40, null);                                           // 12 m cells: the head of the valley and the peaks in the notch
  await grid(-720, 720, 216, -1104, 48, 44, (x, z) => (Math.abs(x) < 120 && z > -294) || (Math.abs(x) < 240 && z < -294 && z > -774));         // 30 m cells around and beyond
  return mat;
}

// ---------------------------------------------------------------- trees (instanced, swaying), river, sky
// One tree, unit height: position, normal, and aL = (exposure: 0 deep inside, 1 an outer tip; material: 0 foliage, 1 bark).
function treeGeometry(kind) {
  const pos = [], nor = [], al = [], idx = [];
  const v = (x, y, z, nx, ny, nz, e, m) => { const l = Math.hypot(nx, ny, nz) || 1; pos.push(x, y, z); nor.push(nx / l, ny / l, nz / l); al.push(e, m); return pos.length / 3 - 1; };
  const trunk = (r, top, sides) => {
    const base = pos.length / 3;
    for (let s = 0; s < sides; s++) { const a = s / sides * 6.2832, c = Math.cos(a), sn = Math.sin(a); v(c * r, 0, sn * r, c, 0.1, sn, 0.6, 1); v(c * r * 0.6, top, sn * r * 0.6, c, 0.1, sn, 0.6, 1); }
    for (let s = 0; s < sides; s++) { const i = base + s * 2, j = base + ((s + 1) % sides) * 2; idx.push(i, i + 1, j, j, i + 1, j + 1); }
  };
  if (kind === 'fir') {                                      // six drooping skirts of boughs, star-edged, each darker under the one above
    trunk(0.016, 0.3, 4);
    const T = 7, S = 10;
    for (let t = 0; t < T; t++) {
      const f = t / (T - 1), yr = 0.11 + 0.72 * Math.pow(f, 0.9) * 0.86, R = 0.235 * (1 - 0.80 * f), ya = Math.min(1, yr + 0.20 + 0.10 * (1 - f)), tw = t * 0.9;
      const apex = v(0, ya, 0, 0, 1, 0, 0.12, 0);
      const base = pos.length / 3;
      for (let s = 0; s < S; s++) { const a = s / S * 6.2832 + tw, out = s % 2 === 0, r = R * (out ? 1 : 0.74), c = Math.cos(a), sn = Math.sin(a); v(c * r, yr - (out ? 0.03 : 0), sn * r, c, 0.6, sn, out ? 1 : 0.5, 0); }
      for (let s = 0; s < S; s++) idx.push(apex, base + (s + 1) % S, base + s);
    }
  } else {                                                   // broadleaf: only the stem and three limbs here; the crown is a cloud of leaf masses (leafGeometry)
    const birch = kind === 'birch';
    trunk(birch ? 0.014 : 0.026, birch ? 0.86 : 0.55, 5);
    const limbs = birch ? [[0.42, 0.9, 0.13], [0.56, 3.2, 0.12], [0.68, 5.1, 0.10]] : [[0.22, 0.6, 0.20], [0.32, 2.9, 0.22], [0.42, 4.6, 0.18]];
    for (const [y, a, r] of limbs) {
      const c = Math.cos(a), sn = Math.sin(a), w = birch ? 0.006 : 0.012;
      const i0 = v(0, y - w * 2.2, 0, -sn, 0.2, c, 0.5, 1), i1 = v(0, y + w * 2.2, 0, -sn, 0.2, c, 0.5, 1), i2 = v(c * r, y + r * (birch ? 1.1 : 0.7), sn * r, -sn, 0.2, c, 0.5, 1);
      idx.push(i0, i1, i2);
    }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aL', new THREE.Float32BufferAttribute(al, 2)); g.setIndex(idx);
  return g;
}

async function buildTrees(ctx, shape, P, U, group, count, lit, mx = 1) {
  const { h, rc, half } = shape, rng = ctx.rng.fork('pwys-trees'), noise = ctx.noise;
  const g = treeGeometry(P.treeKind || 'fir');
  const sageN = Math.round((P.sage || 0) * Math.min(1, count / 800)), slopeN = Math.round(count * 0.4), inst = new Float32Array((count + sageN + slopeN) * 4), tint = new Float32Array((count + sageN + slopeN) * 3);
  let n = 0, tries = 0;
  while (n < count && tries < count * 30) {
    tries++;
    const x = rng.range(-112, 112), z = rng.range(-246, 122), y = h(x, z);
    const dr = Math.abs(x - rc(z)), d = Math.abs(x - rc(z) * 0.3), hf = half(z, x);
    if (dr < 6.5 || y > 24 || z < -224 && Math.abs(x) < 16) continue;
    const slope = Math.abs(h(x + 2, z) - y) + Math.abs(h(x, z + 2) - y);
    if (slope > 3.4) continue;
    const dens = 0.25 + 0.75 * sstep(-0.25, 0.3, noise.fbm2(x * 0.016 + 40, z * 0.016, 2)) + 0.5 * sstep(hf - 22, hf - 4, d);
    if (rng() > dens * P.treeDensity) continue;
    let ht = rng.range(9, 16) * P.treeScale;
    if (P.sizeVar) ht *= 0.5 + 1.15 * Math.pow(rng(), 1.7);                    // a mixed stand: many small, a few old and tall
    if (Math.abs(x) < 16) ht = Math.min(ht, rng.range(4.4, 6) - y);            // under the route the tops stay 4 to 6 m below the camera
    if (ht < (P.sizeVar ? 2.6 : 5)) continue;
    inst[n * 4] = x; inst[n * 4 + 1] = y - 0.4; inst[n * 4 + 2] = z; inst[n * 4 + 3] = ht;
    tint[n * 3] = rng(); tint[n * 3 + 1] = rng() * 6.283; tint[n * 3 + 2] = lit(x, y + ht * 0.6, z); n++;
    if (tries % 300 === 0) await ctx.yield();
  }
  const nTrees = n;
  for (let k = 0, t2 = 0; k < sageN && t2 < sageN * 20; t2++) {                 // low sage clumps over the bare floor (the same leaf masses, knee high)
    const x = rng.range(-70, 70), z = rng.range(-224, 122), y = h(x, z);
    if (Math.abs(x - rc(z)) < 5 || y > 8 || Math.abs(h(x + 2, z) - y) + Math.abs(h(x, z + 2) - y) > 2.2) continue;
    if (noise.fbm2(x * 0.05 + 11, z * 0.05, 2) < -0.12) continue;                 // in drifts, not evenly
    inst[n * 4] = x; inst[n * 4 + 1] = y - 0.25; inst[n * 4 + 2] = z; inst[n * 4 + 3] = rng.range(1.3, 2.7);
    tint[n * 3] = rng(); tint[n * 3 + 1] = rng() * 6.283; tint[n * 3 + 2] = lit(x, y + 1, z); n++; k++;
    if (t2 % 300 === 299) await ctx.yield();
  }
  // THE WOOD CLIMBS THE SIDES. Above the valley floor's wood (which stops at 24 m) the trees go on up both sides wherever a tree can
  // stand, thinning with height to single trees at 100 m, smaller as they climb (10 m at the foot, 5 m at the top: wind and thin soil),
  // gathered into the hollows and gullies the same noise gives the floor's wood. Up to two fifths as many again as the floor carries.
  // They draw on from this wood's own rng after everything else has drawn from it, so not one tree of the floor moves.
  for (let k = 0, t3 = 0; k < slopeN && t3 < slopeN * 8; t3++) {
    // a place on one side or the other, from the foot of the cliff (half the trough's width out from its line) to 30 m further out, where the ground is 24 to 100 m up
    const z = rng.range(-240, 122), side = rng() < 0.5 ? -1 : 1, x = rc(z) * 0.3 + side * (half(z, side) + rng.range(0, 30)), y = Math.abs(x) < 118 ? h(x, z) : 0;
    if (t3 % 200 === 199) await ctx.yield();
    if (y <= 24 || y > 100) continue;
    const slope = Math.abs(h(x + 2, z) - y) + Math.abs(h(x, z + 2) - y);
    if (slope > 9) continue;                                                     // the sides' turf goes up to about this steepness (4.5 m of rise in 2 m of ground, either way); beyond it is bare rock
    const up = sstep(24, 100, y), dens = (1 - up) * (0.35 + 0.65 * sstep(-0.2, 0.3, noise.fbm2(x * 0.016 + 40, z * 0.016, 2)));
    if (rng() > dens * Math.min(1, P.treeDensity * 1.4)) continue;
    const ht = lerp(10, 5, up) * rng.range(0.8, 1.25) * P.treeScale;
    inst[n * 4] = x; inst[n * 4 + 1] = y - (0.4 + 0.25 * slope) * ht / 10; inst[n * 4 + 2] = z; inst[n * 4 + 3] = ht;   // the foot sunk so the downhill side of the trunk meets the ground: 0.4 m plus a quarter of the slope for the 10 m tree at the foot of the side, and in proportion for a smaller tree (its trunk and its skirt are narrower by the same ratio)
    tint[n * 3] = rng(); tint[n * 3 + 1] = rng() * 6.283; tint[n * 3 + 2] = lit(x, y + ht * 0.6, z); n++; k++;
  }
  // the trees' own shadows on the ground: a soft streak from each foot, away from the sun (looked up through a coarse grid)
  const CELL = 14, GX0 = -126, GZ0 = -260, GNX = 18, GNZ = 28, cells = Array.from({ length: GNX * GNZ }, () => []);
  const sun = U.uSun.value, sl = Math.hypot(sun.x, sun.z) / Math.max(sun.y, 0.2), sdx = -sun.x / Math.max(Math.hypot(sun.x, sun.z), 1e-3), sdz = -sun.z / Math.max(Math.hypot(sun.x, sun.z), 1e-3);
  for (let i = 0; i < nTrees; i++) { const cx = Math.floor((inst[i * 4] - GX0) / CELL), cz = Math.floor((inst[i * 4 + 2] - GZ0) / CELL); if (cx >= 0 && cx < GNX && cz >= 0 && cz < GNZ) cells[cz * GNX + cx].push(i); }
  const strength = P.treeShadow ?? 0;
  const shade = (x, z) => {                                                      // 1 = open ground, less under a tree's shadow
    if (!strength) return 1;
    const cx = Math.floor((x - GX0) / CELL), cz = Math.floor((z - GZ0) / CELL); let s = 0;
    for (let j = cz - 1; j <= cz + 1; j++) for (let i = cx - 1; i <= cx + 1; i++) {
      if (i < 0 || i >= GNX || j < 0 || j >= GNZ) continue;
      for (const t of cells[j * GNX + i]) {
        const tx = inst[t * 4], tz = inst[t * 4 + 2], ht = inst[t * 4 + 3], len = Math.min(ht * 0.85 * sl, 13), rad = 0.26 * ht + 1.2;
        const px = x - tx, pz = z - tz, al = Math.min(len, Math.max(0, px * sdx + pz * sdz)), d = Math.hypot(px - sdx * al, pz - sdz * al);
        if (d < rad) s = Math.max(s, (1 - d / rad) * (0.55 + 0.45 * al / Math.max(len, 1)));
      }
    }
    return 1 - strength * Math.min(1, s * 1.6);
  };
  g.instanceCount = n;
  g.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 4)); g.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 3));
  const mat = new THREE.ShaderMaterial({
    name: 'pwys-trees', fog: false, side: THREE.DoubleSide,
    uniforms: { ...U, uTreeA: { value: new THREE.Color(P.tree) }, uTreeB: { value: new THREE.Color(P.tree2) }, uTip: { value: new THREE.Color(P.treeTip || P.tree2) }, uBark: { value: new THREE.Color(P.bark || '#4A3A2C') },
      uMottle: { value: P.treeKind && P.treeKind !== 'fir' ? 1 : 0.3 }, uGlow: { value: P.leafGlow ?? 0.06 } },
    vertexShader: /* glsl */`
      attribute vec4 aInst; attribute vec3 aTint; attribute vec2 aL; uniform float uTime; varying vec3 vP, vN, vO; varying vec4 vT; varying float vSh;
      void main(){
        float ca=cos(aTint.y), sa=sin(aTint.y);
        vec3 q=vec3(position.x*ca-position.z*sa, position.y, position.x*sa+position.z*ca)*vec3(1.+.3*(aTint.x-.5),1.,1.+.3*(aTint.x-.5));
        vec3 p=q*aInst.w; vO=p;
        float sw=position.y*position.y, gust=.6+.4*sin(uTime*.31+aInst.x*.021+aInst.z*.017);
        p.x+=sw*.34*gust*sin(uTime*1.1+aTint.y+aInst.x*.05); p.z+=sw*.24*gust*sin(uTime*.83+aTint.y*1.7+aInst.z*.05);
        p+=aInst.xyz; vP=p; vT=vec4(aTint.x, position.y, aL.x, aL.y); vSh=aTint.z;
        vN=vec3(normal.x*ca-normal.z*sa, normal.y, normal.x*sa+normal.z*ca);
        gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(p,1.); }`,
    fragmentShader: /* glsl */`precision highp float;
      varying vec3 vP, vN, vO; varying vec4 vT; varying float vSh; uniform vec3 uTreeA, uTreeB, uTip, uBark; uniform float uMottle, uGlow; ${NOISE} ${VLIGHT}
      void main(){
        float e=clamp(vT.z,0.,1.), near=1.-smoothstep(60.,170.,length(vP-uEye));
        float m=vn(vO.xz*1.1+vO.y*.8+vT.x*9.)*.6+vn(vO.xy*2.6+vO.z*1.9)*.4;                       // soft clumps of needles or leaves
        float leaf=vn(vO.xz*3.3+vO.y*2.7+vT.x*5.);
        vec3 fol=mix(uTreeA,uTreeB,vT.x)*(.84+.30*vT.y)*(.74+.52*vn(vP.xz*.035+3.));
        float firK=1.-step(.5,uMottle);                                                   // the firs: lighter, yellower needles toward the outside of every bough, so the sunlit side of the wood is green and not black
        fol=mix(fol, uTip, smoothstep(.55,1.,e)*(.16+.30*vT.x)); fol=mix(fol, mix(fol*1.7,uTip*1.15,.45), firK*smoothstep(.25,.95,e));
        fol=mix(fol, vec3(.46,.33,.055)*(.36+.50*smoothstep(.1,.9,e)), firK*step(.89,fract(vT.x*7.77))*.80*mix(.20,1.,smoothstep(-172.,-140.,vP.z-vO.z)));                 // one tree in seven is a larch, turning
        fol*=(.50+.50*smoothstep(0.,.8,e))*mix(1., .80+.40*m, (.35+.45*uMottle)*(.35+.65*near))*(gl_FrontFacing?1.:.82);   // darker deep inside the crown
        vec3 bark=uBark*(.75+.45*step(.62,fract(vP.y*1.3+vT.x*5.+m)));
        vec3 alb=mix(fol, bark, step(.5,vT.w));
        // one big soft normal for the whole crown (out from its middle), so each tree has a sunlit side and a shadow side
        float ht=vO.y/max(vT.y,.02), cy=mix(.52,.70,uMottle);
        vec3 nb=vec3(vO.x, (vT.y-cy)*ht*mix(.35,.9,uMottle)+.12*ht*.1, vO.z); nb/=max(length(nb),1e-3);
        vec3 n=mix(vN, nb, .72*(1.-step(.5,vT.w)))+vec3((m-.5)*.5,1e-3,(leaf-.5)*.5)*near; n/=max(length(n),1e-3);
        float nlr=dot(nb,uSun);
        alb*=1.+(leaf-.5)*.30*uMottle*near;
        float gust=smoothstep(.52,.86, vn(vP.xz*.028+vec2(uTime*.42,uTime*.17))*.7+vn(vP.xz*.11-vec2(uTime*.9,uTime*.3))*.3);   // wind running over the canopy turns the leaves pale
        alb*=1.+gust*(.16+.30*uMottle)*(1.-step(.5,vT.w))*smoothstep(.2,.9,e);
        float cl=.56+.44*smoothstep(.40,.58,vn(vP.xz*.014+vec2(uTime*.16,uTime*.045))*.75+vn(vP.xz*.031-vec2(uTime*.2,uTime*.05)+4.)*.25);                   // the same drifting cloud shade as the ground
        cl*=cfront(vP);
        vec3 c=vlit(alb, n, vSh*cl)+alb*uFill*.85+alb*uSunCol*uGlow*vSh*(1.-vT.w)*(.6+.8*(1.-smoothstep(-.6,.2,nlr)));        // light coming through the leaves on the far side
        gl_FragColor=vec4(vhaze(c,vP),1.); }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.layers.set(LAYER_VALLEY); group.add(mesh);
  if (P.treeKind && P.treeKind !== 'fir') buildLeaves(P, U, group, g.getAttribute('aInst'), g.getAttribute('aTint'), n, mx);
  return { mesh, count: n, inst, shade };
}

// ---------------------------------------------------------------- broadleaf crowns: a cloud of leaf masses per tree
// Each mass is a small card turned to the station, cut to a lobed outline that breaks into sprays at its rim (sky and
// branch show between), shaded as a soft ball and by where it sits in the crown. Every tree draws its own build (slender
// or spreading, masses moved, sized and dropped by its seed) and its own colour between rust and pale lemon.
function buildLeaves(P, U, group, aInst, aTint, count, mx) {
  const birch = P.treeKind === 'birch', NP = birch ? 10 : 8, crown = birch ? [0.36, 1.0, 0.19, 0.165] : [0.24, 1.0, 0.33, 0.25];
  const pos = [], ac = [], as = [], idx = [];
  for (let k = 0; k < NP; k++) {
    const f = (k - 0.5) / (NP - 1), prof = k === 0 ? 0 : Math.sin(Math.PI * (0.10 + 0.80 * f)), a = k * 2.399;
    const y = k === 0 ? crown[1] - crown[3] * 0.55 : crown[0] + (crown[1] - crown[0] - crown[3] * 0.9) * f, r = crown[2] * prof * 0.85;
    const size = crown[3] * (k === 0 ? 0.80 : 0.72 + 0.42 * prof), b = pos.length / 3;
    for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(Math.cos(a) * r, y, Math.sin(a) * r); ac.push(cx, cy); as.push(size, k); }
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new THREE.InstancedBufferGeometry(); g.instanceCount = count;
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(ac, 2)); g.setAttribute('aS', new THREE.Float32BufferAttribute(as, 2));
  g.setAttribute('aInst', aInst); g.setAttribute('aTint', aTint); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    name: 'pwys-leaves', fog: false, side: THREE.DoubleSide,
    uniforms: { ...U, uTreeA: { value: new THREE.Color(P.tree) }, uTreeB: { value: new THREE.Color(P.tree2) }, uTip: { value: new THREE.Color(P.treeTip || P.tree2) },
      uRust: { value: new THREE.Color(P.rust || P.tree) }, uGreen: { value: new THREE.Color(P.green || P.tree) }, uGlow: { value: P.leafGlow ?? 0.06 },
      uCrown: { value: new THREE.Vector4(...crown) }, uMx: { value: mx } },
    vertexShader: /* glsl */`
      attribute vec4 aInst; attribute vec3 aTint; attribute vec2 aC, aS; uniform float uTime; uniform vec4 uCrown;
      varying vec2 vUv; varying vec4 vT; varying vec3 vC, vNb; varying float vSh;
      float hh(float x){ return fract(sin(x*127.1)*43758.5453); }
      void main(){
        float k=aS.y, sd=aTint.x*61.7+k*7.31;
        float h1=hh(sd), h2=hh(sd+3.1), h3=hh(sd+9.7), h4=hh(sd+17.3);
        float wide=.72+.62*hh(aTint.x*33.1), tall=.78+.44*hh(aTint.x*77.7);                // each tree its own build: slender or spreading
        vec3 c=position; c.xz=c.xz*wide+(vec2(h1,h2)-.5)*uCrown.z*.9; c.y=uCrown.x+(c.y-uCrown.x)*tall+(h3-.5)*.09;
        float size=aS.x*(.68+.66*h4)*step(.22,h3+step(k,.5));                               // about a fifth of the masses are missing (never the top one)
        float ca=cos(aTint.y), sa=sin(aTint.y);
        vec3 q=vec3(c.x*ca-c.z*sa, c.y, c.x*sa+c.z*ca), p=q*aInst.w;
        float sw=c.y*c.y, gust=.6+.4*sin(uTime*.31+aInst.x*.021+aInst.z*.017);
        p.x+=sw*.34*gust*sin(uTime*1.1+aTint.y+aInst.x*.05); p.z+=sw*.24*gust*sin(uTime*.83+aTint.y*1.7+aInst.z*.05);
        p+=vec3(sin(uTime*1.7+sd), .5*sin(uTime*1.3+sd*1.7), cos(uTime*1.5+sd*.6))*.006*aInst.w;   // and every mass stirs a little on its own
        p+=aInst.xyz;
        vec3 rt=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]), up=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);
        float R=size*aInst.w;
        vec4 wc=modelMatrix*vec4(p,1.); wc.xyz+=(rt*aC.x+up*aC.y)*R;
        vUv=aC; vC=p; vT=vec4(aTint.x, h1, k, R); vSh=aTint.z;
        vNb=vec3(q.x, (c.y-mix(uCrown.x,uCrown.y,.45))*.9, q.z);                            // out from the middle of the crown
        gl_Position=projectionMatrix*viewMatrix*wc; }`,
    fragmentShader: /* glsl */`precision highp float;
      varying vec2 vUv; varying vec4 vT; varying vec3 vC, vNb; varying float vSh;
      uniform vec3 uTreeA, uTreeB, uTip, uRust, uGreen; uniform float uGlow, uMx; ${NOISE} ${VLIGHT}
      void main(){
        float seed=vT.x*37.+vT.z*5.3, R=vT.w, r=length(vUv);
        float lob=vn(vUv*2.1+seed)*.60+vn(vUv*4.7+seed*1.7)*.40;                           // the outline of the mass: lobed
        float edge=.46+.54*lob, rn=r/max(edge,.05);
        if(rn>1.) discard;
        float near=1.-smoothstep(50.,150.,length(vC-uEye));
        vec2 lp=vUv*R*1.5+.04*vec2(sin(uTime*2.1+seed), cos(uTime*1.7+seed));              // leaves: toward the rim the mass breaks into sprays (they shiver)
        float leaf=vn(lp*2.2+seed*3.)*.6+vn(lp*5.1+seed)*.4;
        if(leaf<smoothstep(.40,1.,rn)*.66) discard;
        vec3 rt=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]), up=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]), bk=vec3(viewMatrix[0][2],viewMatrix[1][2],viewMatrix[2][2]);
        vec2 nu=vUv/max(edge,.05); float nz=sqrt(max(1.-dot(nu,nu),.04));
        vec3 nW=rt*nu.x+up*nu.y+bk*nz, n=vec3(nW.x*uMx,nW.y,nW.z);
        vec3 nb=vNb/max(length(vNb),1e-3);
        n=n*.55+nb*.75+vec3((leaf-.5)*.5,1e-3,(lob-.5)*.5)*near; n/=max(length(n),1e-3);
        float t=clamp(vT.x+(vT.y-.5)*.24,0.,1.);                                           // every tree its own colour, every mass a little off its tree
        vec3 fol=mix(uRust, uTreeA, smoothstep(.02,.24,t)); fol=mix(fol, uTreeB, smoothstep(.28,.62,t)); fol=mix(fol, uTip, smoothstep(.68,1.,t));
        fol=mix(fol, uGreen, step(.89,fract(vT.x*7.77))*.70);
        fol*=(.70+.55*leaf)*(.80+.40*vn(vC.xz*.035+3.))*(.60+.40*smoothstep(-.9,.3,nu.y));  // leaf by leaf; darker under each mass
        float nlr=dot(nb,uSun);
        float gust=smoothstep(.52,.86, vn(vC.xz*.028+vec2(uTime*.42,uTime*.17))*.7+vn(vC.xz*.11-vec2(uTime*.9,uTime*.3))*.3);
        fol*=1.+gust*.30;
        float cl=.56+.44*smoothstep(.40,.58,vn(vC.xz*.014+vec2(uTime*.16,uTime*.045))*.75+vn(vC.xz*.031-vec2(uTime*.2,uTime*.05)+4.)*.25);
        cl*=cfront(vC);
        vec3 c=vlit(fol,n,vSh*cl)+fol*uFill*.85+fol*uSunCol*uGlow*vSh*(.6+.8*(1.-smoothstep(-.6,.2,nlr)));
        gl_FragColor=vec4(vhaze(c,vC),1.); }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.layers.set(LAYER_VALLEY); group.add(mesh);
  return mesh;
}

// ---------------------------------------------------------------- fallen rock at the foot of the cliffs (one merged mesh, shaded as the ground is)
function buildBoulders(ctx, shape, P, group, mat, lit) {
  const { h, rc, half } = shape, rng = ctx.rng.fork('pwys-rocks'), noise = ctx.noise, ico = new THREE.IcosahedronGeometry(1, 0).getAttribute('position');
  const pos = [], nor = [], col = [], shd = [], c = new THREE.Color(), rock = new THREE.Color(P.rock), rockD = new THREE.Color(P.rockDark), band = new THREE.Color(P.band || P.rock);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3(), e = new THREE.Euler(), q = new THREE.Quaternion(), tri = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  for (let i = 0, tries = 0; i < P.boulders && tries < P.boulders * 12; tries++) {
    const z = rng.range(-222, 112), side = rng() < 0.5 ? -1 : 1, scree = rng() < 0.7;
    const x = rc(z) * 0.3 + side * (scree ? half(z, side) - rng.range(-3, 13) : rng.range(9, 34)), y = h(x, z);
    const sz = rng.range(0.7, 2.3) * (rng() < 0.12 ? 1.9 : 1), sy = rng.range(0.5, 0.85), seed = rng() * 50;
    e.set(rng() * 0.5, rng() * 6.283, rng() * 0.5); q.setFromEuler(e);
    if (Math.abs(x - rc(z)) < 7 || y > 6 || Math.abs(x) < 9 && y + sz > 2) continue;
    c.copy(rock).lerp(rockD, rng() * 0.6).lerp(band, rng() < 0.3 ? 0.6 : 0); const s = lit(x, y + sz, z);
    for (let t = 0; t < ico.count; t += 3) {
      for (let k = 0; k < 3; k++) {
        d.fromBufferAttribute(ico, t + k); const f = 1 + 0.32 * noise.n2(d.x * 1.7 + seed, d.y * 1.7 + d.z * 2.3);
        tri[k].set(d.x * f * sz * 1.25, d.y * f * sz * sy, d.z * f * sz).applyQuaternion(q); tri[k].x += x; tri[k].y += y + sz * sy * 0.35; tri[k].z += z;
      }
      a.subVectors(tri[1], tri[0]); b.subVectors(tri[2], tri[0]); a.cross(b).normalize();
      for (let k = 0; k < 3; k++) { pos.push(tri[k].x, tri[k].y, tri[k].z); nor.push(a.x, a.y, a.z); col.push(c.r, c.g, c.b); shd.push(s); }
    }
    i++;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aSh', new THREE.Float32BufferAttribute(shd, 1));
  g.setAttribute('aRk', new THREE.Float32BufferAttribute(new Float32Array(shd.length).fill(1), 1));
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.layers.set(LAYER_VALLEY); group.add(m);
  return m;
}

// ---------------------------------------------------------------- leaves coming down through the wood (they are in the picture, so after the stop they fall as paint)
function buildLeafFall(ctx, P, U, group, detail) {
  const rng = ctx.rng.fork('pwys-fall'), N = Math.round(P.leafFall * detail), pos = [], ac = [], as = [], idx = [];
  for (let i = 0; i < N; i++) {
    const x = rng.range(-24, 24), y = rng.range(-7, 23), z = rng.range(-205, 24), sd = rng(), b = i * 4;
    for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(x, y, z); ac.push(cx, cy); as.push(sd); }
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(ac, 2)); g.setAttribute('aS', new THREE.Float32BufferAttribute(as, 1)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    name: 'pwys-leaffall', fog: false, side: THREE.DoubleSide,
    uniforms: { ...U, uTreeB: { value: new THREE.Color(P.tree2) }, uTip: { value: new THREE.Color(P.treeTip || P.tree2) }, uRust: { value: new THREE.Color(P.rust || P.tree) } },
    vertexShader: /* glsl */`
      attribute vec2 aC; attribute float aS; uniform float uTime; varying vec2 vUv; varying vec3 vC; varying float vS;
      float hh(float x){ return fract(sin(x*127.1)*43758.5453); }
      void main(){
        float sd=aS*91.; vec3 c=position;
        c.y=-7.+mod(c.y+7.-uTime*(.9+.8*hh(sd)), 30.);                                      // down, and round again from the top
        c.x=-24.+mod(c.x+24.+uTime*.7+1.4*sin(uTime*(.7+hh(sd+1.))+sd), 48.);                // sideways on the wind, swinging
        c.z+=1.1*sin(uTime*(.5+hh(sd+2.))+sd*3.);
        vec4 wc=modelMatrix*vec4(c,1.);
        vec3 rt=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]), up=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);
        float R=max(.10+.06*hh(sd+5.), length(wc.xyz-cameraPosition)*.0034);                // never under about two pixels${LEAF_NEAR ? `
        R*=smoothstep(.6,2.5,length(wc.xyz-cameraPosition));                                // [C1-LEAF] the near law: size only, by the distance from the leaf's centre to the eye of the pass that draws it` : ''}${LEAF_LID ? `
        R*=smoothstep(0.,2.,23.-c.y)*smoothstep(0.,2.,c.y+7.);                              // [C2-LID] the leaf's own wrapped height, 23 the lid and -7 the floor of its wrap (the line c.y=-7.+mod(..., 30.) above): it grows in over its first two metres under the lid and goes out over its last two above the floor; nothing of the eye, the route, the clock's phase or the seed` : ''}
        float sp=uTime*(2.+3.*hh(sd+7.))+sd, cs=cos(sp), sn=sin(sp);
        vec2 q=vec2(aC.x*(.35+.65*abs(cos(sp*.7))), aC.y*.62); q=vec2(q.x*cs-q.y*sn, q.x*sn+q.y*cs);   // it turns over as it falls
        wc.xyz+=(rt*q.x+up*q.y)*R;
        vUv=aC; vC=c; vS=hh(sd+11.);
        gl_Position=projectionMatrix*viewMatrix*wc; }`,
    fragmentShader: /* glsl */`precision highp float;
      varying vec2 vUv; varying vec3 vC; varying float vS; uniform vec3 uTreeB, uTip, uRust; ${NOISE} ${VLIGHT}
      void main(){
        if(dot(vUv,vUv)>1.) discard;
        vec3 alb=mix(mix(uRust,uTreeB,smoothstep(.0,.35,vS)), uTip, smoothstep(.5,1.,vS));
        vec3 c=alb*(uSunCol*.62+uFill*1.1);
        gl_FragColor=vec4(vhaze(c,vC),1.); }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.layers.set(LAYER_VALLEY); group.add(m);
  return m;
}

// ---------------------------------------------------------------- veils of mist: at the foot of the fall, on one shoulder of the cliffs, low over the river
function buildMist(P, U, group) {
  const cards = [[3.5, -4.5, -221, 15, 6.5, 0.55, 0], [-58, 44, -158, 62, 17, 0.42, 0.9], [14, -1.5, -118, 46, 6.5, 0.30, 0.25]];   // x, y, z, half width, half height, strength, turn
  const pos = [], uv = [], as = [], idx = [];
  cards.forEach(([x, y, z, w, hh, a, turn], i) => {
    const c = Math.cos(turn), s = Math.sin(turn), b = i * 4;
    for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(x + cx * w * c, y + cy * hh, z + cx * w * s); uv.push(cx, cy); as.push(i * 3.7, a); }
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aS', new THREE.Float32BufferAttribute(as, 2)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    name: 'pwys-mist', fog: false, side: THREE.DoubleSide, transparent: true, depthWrite: false, uniforms: { ...U, uMist: { value: P.mist ?? 1 } },
    vertexShader: /* glsl */`attribute vec2 aS; varying vec2 vUv, vS; varying vec3 vP; void main(){ vUv=uv; vS=aS; vP=position; gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); }`,
    fragmentShader: /* glsl */`precision highp float;
      varying vec2 vUv, vS; varying vec3 vP; uniform float uMist; ${NOISE} ${VLIGHT}
      void main(){
        float r=dot(vUv,vUv);
        float body=fbm(vUv*vec2(2.6,1.5)+vec2(uTime*.035+vS.x, -uTime*.02))*.75+fbm(vUv*vec2(6.,3.4)-vec2(uTime*.06, vS.x))*.25;      // it drifts and thins
        float a=(1.-smoothstep(.15,1.,r))*smoothstep(.30,.72,body)*vS.y*uMist*(1.-smoothstep(-.2,1.,vUv.y)*.55)*smoothstep(18.,60.,length(vP-uEye));   // a veil thins as you come up to it (no grey smear over the near pines)
        float sd=max(dot(normalize(vP-uEye+vec3(0.,1e-3,0.)),uSun),0.);
        gl_FragColor=vec4(uHaze*(1.05+.25*sd), a); }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 5; m.layers.set(LAYER_VALLEY); group.add(m);
  return m;
}

function buildRiver(ctx, shape, P, U, group, lit) {
  const { rc } = shape, pos = [], uv = [], sh = [], idx = [], N = 170;
  for (let i = 0; i <= N; i++) {
    const z = lerp(214, -226, i / N), e = 1, tx = rc(z - e) - rc(z + e), tz = -2 * e, il = 1 / Math.hypot(tx, tz), nx = -tz * il, nz = tx * il;
    const w = 3.6, s = lit(rc(z), -7.55, z); pos.push(rc(z) - nx * w, -7.55, z - nz * w, rc(z) + nx * w, -7.55, z + nz * w); uv.push(-1, -z, 1, -z); sh.push(s, s);
    if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aSh', new THREE.Float32BufferAttribute(sh, 1)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    name: 'pwys-river', fog: false, side: THREE.DoubleSide, uniforms: { ...U, uRiver: { value: new THREE.Color(P.river) }, uSkyRef: { value: new THREE.Color(P.sky) } },
    vertexShader: /* glsl */`attribute float aSh; varying vec3 vP; varying vec2 vUv; varying float vSh; void main(){ vP=position; vUv=uv; vSh=aSh; gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); }`,
    fragmentShader: /* glsl */`precision highp float;
      varying vec3 vP; varying vec2 vUv; varying float vSh; uniform vec3 uRiver, uSkyRef; ${NOISE} ${VLIGHT}
      void main(){
        float fl=vUv.y+uTime*3., ax=abs(vUv.x);                                            // toward us at 3 m/s
        float warp=vn(vec2(fl*.15,vUv.x*1.3));
        float rip=vn(vec2(vUv.x*3.+warp*1.5, fl*.22)), rip2=vn(vec2(vUv.x*9.-1.3, fl*.7+warp));
        float cf=cfront(vP);
        vec3 light=uSunCol*.50*vSh*cf+uFill*.95;
        vec3 c=mix(uRiver*.40, mix(uRiver, uSkyRef, .45)*1.05, .25+.65*rip)*light;         // dark where it runs deep, sky where it lies flat
        float riffle=smoothstep(.55,.85,vn(vec2(vUv.x*2.3+5., vUv.y*.06)))*smoothstep(.45,.8,rip2);   // broken water over the shallows
        c=mix(c, vec3(.92,.96,.98)*light, riffle*.5);
        float gl=smoothstep(.64,.90,vn(vec2(vUv.x*7., fl*.9)))*smoothstep(.25,.75,rip2)*(1.-smoothstep(.6,1.,ax));
        c+=uSunCol*(gl*1.5+.05)*vSh*vSh*cf*cf;                                                    // the sun on it: a sheet of light with sparks in it
        float edge=smoothstep(.70,.99,ax+.22*(vn(vec2(vUv.x*4., fl*.5))-.5));              // a lace of foam and wet stones along the banks
        c=mix(c, mix(uRiver*.30*uFill, vec3(.9,.94,.96)*light, smoothstep(.4,.7,rip2)), edge*.7);
        gl_FragColor=vec4(vhaze(c,vP),1.); }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.layers.set(LAYER_VALLEY); group.add(m);
  return m;
}

function buildSky(ctx, P, U, group) {
  const mat = new THREE.ShaderMaterial({
    name: 'pwys-sky', fog: false, side: THREE.BackSide, depthWrite: false, depthTest: false,
    uniforms: { ...U, uSkyLow: { value: new THREE.Color(P.sky) }, uSkyTop: { value: new THREE.Color(P.skyTop) }, uCloud: { value: new THREE.Color(P.cloud) } },
    vertexShader: /* glsl */`varying vec3 vD; void main(){ vD=position; gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); }`,
    fragmentShader: /* glsl */`precision highp float;
      varying vec3 vD; uniform vec3 uSkyLow, uSkyTop, uCloud; ${NOISE} ${VLIGHT}
      void main(){
        vec3 d=normalize(vD); float up=max(d.y,0.);
        vec3 c=mix(uHaze, uSkyLow, smoothstep(0.,.22,up)); c=mix(c, uSkyTop, smoothstep(.2,.95,up));
        float sd=max(dot(d,uSun),0.); c+=uSunCol*(.10*sd*sd*sd*sd);
        float az=atan(d.x, -d.z+1e-5);                                                     // three slow cumulus over the head of the valley
        for(int i=0;i<3;i++){ float fi=float(i);
          vec2 cc=vec2(-.75+.8*fi+uTime*.0035, .33+.09*sin(fi*2.3)); vec2 q=(vec2(az,d.y)-cc)/vec2(.34,.11);
          float m=1.-dot(q,q); float nn=fbm(vec2(az*7.+fi*9.+uTime*.01, d.y*11.));
          float dn=smoothstep(.0,.35, m*.6+ (nn-.45)*.9* step(0.,m+1.) ) * smoothstep(-1.2,.2,m);
          float lit=.62+.38*smoothstep(-.6,.9,q.y+nn*.6);
          c=mix(c, uCloud*lit*(uSunCol*.6+uFill*.55), dn*.92); }
        gl_FragColor=vec4(c,1.); }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1900, 24, 12), mat);
  m.frustumCulled = false; m.renderOrder = -10; m.layers.set(LAYER_VALLEY); group.add(m);
  return m;
}

// ---------------------------------------------------------------- THE HALL SHADER: plaster that wears the valley as paint
// p is the fragment in canonical space. Paint = the target looked up through uProj, wherever p can be seen from uO.
// Ring, fall and swifts are never in the target: they are worked out here along d = normalize(p - uO), so they are
// real things with exact parallax while uO is the camera, and exactly a painter's marks once uO stays at S.
const HALL_VERT = /* glsl */`
  varying vec3 vP, vN;
  void main(){ vP=position; vN=normal; gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); }`;
// [F5-STAIR] THE STAIR IN THE HALL'S LIGHT. The stair is hall mesh: every law of hallShade falls on it by its faces (tone by facing, flags on
// the treads, courses on risers and flank, the wedge from the mouth, what a pier hides of the mouth: all of them are laws of the plan or of
// the facing and hold at any height). What assumed the floor at y 0 is given the stair's own levels here: the dark line where a floor meets
// what stands on it (a tread and the riser at its back; the floor and the stair's foot) and the foot shade of a wall (a riser stands on the
// tread before it; wall W and the far wall stand on the stair where it is against them). No new strength: live's own two laws, re-based.
const zT_ = Math.floor(STAIR.lowTo / STAIR.go) * STAIR.go, f1 = (v) => v.toFixed(1);                                    // [F5-STAIR] as stairPlan()
const STAIR_GLSL = /* glsl */`uniform vec2 uStair;                                                    // [F5-STAIR] z of the first riser; metres the flank stands out from wall W
  const float SGO=${f1(STAIR.go)}, SRISE=${f1(STAIR.rise)}, SNA=${f1(STAIR.lower)}, SNB=${f1(Math.ceil((zT_ - STAIR.farZ) / STAIR.go))}, SZT=${f1(zT_)}, SZF=${f1(STAIR.farZ)};
  float footLaw(float h){ h=max(h,0.); return 1.-.20*exp(-h/1.5)-.10*exp(-h/.25); }                    // live's foot shade of a wall, by the height over what it stands on
  float stairZ(float j){ return j<=SNA? uStair.x-SGO*(j-1.) : SZT-SGO*(j-SNA-1.); }                   // z of riser j (1 ..)
  float stairN(float z){ return z>uStair.x? 0. : (z>SZT? min(floor((uStair.x-z)/SGO)+1., SNA) : SNA+min(floor((SZT-z)/SGO)+1., SNB)); }   // risers at or north of z: the tread under z
  float stairProfD(float z, float y){ float j=stairN(z), dv=y-SRISE*j, dz=j<SNA+SNB? z-stairZ(j+1.) : 1e3, dy=y-SRISE*(j+1.);      // metres from a point over the stair to its profile:
    return min(dv, dy>0.? length(vec2(dz,dy)) : dz); }                                               // the tread below, the next riser to the south (or its top edge)
  `;
const STAIR_FLOOR = /* glsl */`if(p.y>.5){ float j=floor(p.y/SRISE+.5); if(j<SNA+SNB) dm=min(dm, max(p.z-stairZ(j+1.),0.)); }      // [F5-STAIR] a tread: to the riser at its back (the tread is known by its height)
      else if(p.z<uStair.x+20. && p.x<xw+40.) dm=min(dm, length(max(vec2((p.x-xw)/WLEN-uStair.y, p.z-uStair.x),0.)));          // [F5-STAIR] the floor: to the stair's foot (first riser, flank)
      `;
const STAIR_WALL = /* glsl */`if(p.z<uStair.x+12. && p.z>SZF-.5 && dW<uStair.y+60.){ float fy=p.y, dS=dW-uStair.y;                 // [F5-STAIR] dS<=0: between wall W and the flank (.01 m is for rounding only)
        if(n.z>.5 && dS<.01){ if(p.z>SZF+1.){ float j=p.z>SZT+1.? floor((uStair.x-p.z)/SGO+.5) : SNA+floor((SZT-p.z)/SGO+.5); fy=p.y-SRISE*j; }      // a riser stands on the tread before it
          else fy=p.y-SRISE*(SNA+SNB); }                                                                                       // the far wall stands on the top landing
        else if(n.z>.5){ float top=SRISE*(SNA+SNB); if(p.z<SZF+1.) dc=min(dc, p.y<top? dS : length(vec2(dS,p.y-top))); }       // the far wall beside the stair: its inside corner with the flank
        else if(dW<.5) fy=max(stairProfD(p.z,p.y),0.);                                                                         // wall W over the stair: it stands on the treads and meets the risers
        else if(abs(dS)<.5) dc=min(dc, max(p.z-SZF,0.));                                                                       // the flank: its inside corner with the far wall
        tone*=footLaw(fy)/footLaw(p.y); }                                                                                      // live's foot shade (two lines on) taken from the floor and given to the stair's own level
      `;
// [F5-PIERS] THE FAR WALL'S PIERS IN THE HALL'S LIGHT: piers A and B's own two laws, the dark line round a pier's foot on the flags and the
// dark plumb line in the inside corner of pier and wall. Tone by facing, courses, the wash under the skylights and the bars are hallShade's as they stand.
const PIERS_GLSL = /* glsl */`uniform vec2 uFarP;                                                     // [F5-PIERS] x of the first and of the last pier's middle
  const float FPH=${f1(FARP.half)}, FPP=${f1(FARP.proud)}, FPM=${f1(FARP.module)}, FPZ=${f1(FARP.farZ)};
  float farPierX(float x){ return x-uFarP.x-FPM*clamp(floor((x-uFarP.x)/FPM+.5), 0., floor((uFarP.y-uFarP.x)/FPM+.5)); }      // metres east of the nearest pier's middle
  `;
const PIERS_FLOOR = /* glsl */`if(p.z<FPZ+30.) dm=min(dm, boxD(vec2(farPierX(p.x), p.z-FPZ-.5*FPP), vec2(FPH,.5*FPP)));          // [F5-PIERS] the flags round a pier's foot
      `;
const PIERS_WALL = /* glsl */`if(p.z<FPZ+FPP+.1){ float fx=abs(farPierX(p.x))-FPH;                                               // [F5-PIERS]
        if(n.z>.5 && p.z<FPZ+.1 && fx>0.) dc=min(dc, fx);                                                                      // the far wall beside a pier
        else if(abs(n.x)>.5 && abs(fx)<.1) dc=min(dc, max(p.z-FPZ,0.)); }                                                      // a pier's flank, where it meets the wall
      `;
const HALL_COMMON = /* glsl */`precision highp float;
  uniform float uK, uTime; uniform vec3 uPlaster, uFlag, uDay, uMouth; uniform vec3 uBird[3], uBirdV[3]; uniform vec4 uFin[5]; uniform float uShR; uniform vec4 uWN[5], uWX[5]; uniform vec3 uSkyL;
  ${NOISE}
  const float SLOPE=0.0813953, WLEN=1.0033071, XB=${GEO.XB.toFixed(1)}, XE=${GEO.XE.toFixed(1)}, SL0=${(GEO.XB - 8).toFixed(1)}, SL1=${(GEO.XE - 64).toFixed(1)}; const float FSH=.42; const vec4 PA=vec4(23.5,-168.,4.,4.), PB=vec4(7.38256,-262.41563,7.,5.), PBR=vec4(0.9967038,0.0811271,0.0811271,-0.9967038);
  // daylight from arm two: tone by facing, never darker than a cool grey, the wedge across arm one's floor, pools under
  // the six skylights, and a soft darkening where floor, walls and piers meet (so every edge shows as a step of tone)
  float slotZ(vec3 p, float a, float b){ float zc=p.x<XB?-315.:-262., hw=p.x<XB?25.:78.; return 1.-smoothstep(hw*a, hw*b, abs(p.z-zc)); }   // the skylights' reach across the arm and the room
  float boxD(vec2 q, vec2 h){ vec2 d=abs(q)-h; return length(max(d,0.))+min(max(d.x,d.y),0.); }
  // DAYLIGHT THAT FALLS. The skylight has a direction (uSkyL points up into it: from beyond the row of cut walls, toward us).
  // Each wall throws a long shadow over the flags, soft with distance, and its hole lets an ellipse of light through:
  // the ray from p toward the light meets each wall's plane; it is stopped there if it lands on the slab and outside
  // the cone from L that cuts the hole. The first wall met decides (each bay is lit from its own skylights).
  const vec3 LP=vec3(${GEO.L[0].toFixed(1)},${GEO.L[1].toFixed(1)},${GEO.L[2].toFixed(1)}); const float EZ=${GEO.E[2].toFixed(1)}, CEILY=${GEO.ceil.toFixed(1)};
  float wallShadow(vec3 p, out float tHit){
    float acc=0., S=0.; tHit=0.; float pxw=.7*length(fwidth(p));                             // a pixel on this surface, in metres (taken before the loop)
    for(int i=0;i<5;i++){
      float dn=dot(uWN[i].xyz,uSkyL); dn=abs(dn)<1e-3?1e-3:dn;
      float t=-(dot(uWN[i].xyz,p)+uWN[i].w)/dn;
      if(t>.02){ vec3 h=p+uSkyL*t; float w=max(.03+.0087*t, pxw);                                // half the edge's width: a slot shows a patch of sky a degree across (1.7 cm of edge per metre of throw), where it was 4.8 cm per metre and every shade a blur
        float inx=smoothstep(-w,w, dot(h.xz,uWX[i].xy)-uWX[i].z)*(1.-smoothstep(CEILY-w*1.6, CEILY+w*1.6, h.y));
        vec3 dl=h-LP; float dz=max(dl.z,1e-2), tt=(EZ-LP.z)/dz; float rr=length(dl.xy*tt);
        float blk=smoothstep(-w,w,(rr-uWX[i].w)*dz/(EZ-LP.z));
        float k=(1.-acc)*inx; S+=k*blk; tHit+=k*t; acc+=k; } }
    return S; }
  // THE SLOTS THROW SUN. A point is in a bar of sun if its ray toward the light leaves through one of the five slots.
  float slotBar(vec3 p){ float t=(CEILY-p.y)/uSkyL.y; vec3 c=p+uSkyL*t; float w=.25+.006*t;      // the bar's soft edge stays well inside one flag (3 m): 0.9 m at the floor, where it was 1.6 m a side and a bar was a blur
    float sl=abs(fract((c.x-SL0)/30.)-.5)*30.;
    return (1.-smoothstep(3.-w,3.+w,sl))*step(SL0-6.,c.x)*step(c.x,SL1)*smoothstep(-342.-w,-338.+w,c.z)*(1.-smoothstep(-186.-w,-182.+w,c.z)); }
  float shwIn(vec3 p){ float m=0.;                                                       // 1 within about 50 m downstream of a cut wall (where its hole's ellipse lies)
    for(int i=0;i<5;i++){ float dn=dot(uWN[i].xyz,uSkyL); dn=abs(dn)<1e-3?1e-3:dn; float t=-(dot(uWN[i].xyz,p)+uWN[i].w)/dn;
      vec3 h=p+uSkyL*t; float inx=step(0.,dot(h.xz,uWX[i].xy)-uWX[i].z)*step(.02,t)*(1.-smoothstep(40.,62.,t)); m=max(m,inx); }
    return m; }
  // WHAT A PIER HIDES OF THE MOUTH OF ARM TWO. Arm one has its daylight from the mouth: the opening in the plane x 72 between the corner of
  // the L (z -280) and the far wall (z -350). From a point of the floor the mouth is an arc of bearings, measured from the mouth's own
  // normal (+x); every ray to it runs toward +x. A pier (floor to ceiling, so the matter is flat) stops exactly the rays that meet the part
  // of it lying beyond the point toward the mouth: so the pier is cut at the point's own line (the plane x = the point's x; PIN, a
  // millimetre, only keeps a division off zero) and the arc is that of what is left: its corners, and where its edges cross that line.
  // A pier beside or behind the point is cut away whole and hides nothing; floor that sees the whole mouth is lit on whichever side of a
  // pier it lies. The share of the mouth left is the light left: an umbra close behind the pier, a penumbra widening with distance. The
  // two piers' arcs are added: no point of arm one's floor has both between itself and the mouth (pier B stands against wall W, west of A).
  // Checked against a plain ray test on the floor's own metres: shots/painted-where-you-stood/flight2/tmp/piershade.mjs.
  const float PIN=1e-3;
  vec2 pierCorner(int k, vec4 box, vec4 rot){ vec2 q=vec2(k<2?-box.z:box.z, (k==0||k==3)?-box.w:box.w); return box.xy+rot.xy*q.x+rot.zw*q.y; }
  float pierHides(vec2 p, vec4 box, vec4 rot, float a0, float a1){
    float lo=9., hi=-9.; vec2 a=pierCorner(3,box,rot)-p;
    for(int k=0;k<4;k++){ vec2 b=pierCorner(k,box,rot)-p;                                // the edge from corner a to corner b
      if(a.x>PIN){ float t=atan(a.y/a.x); lo=min(lo,t); hi=max(hi,t); }                  // a corner beyond the point's line: its bearing
      if((a.x-PIN)*(b.x-PIN)<0.){ float d=b.x-a.x; d=abs(d)<1e-6?(d<0.?-1e-6:1e-6):d;    // an edge that crosses the line: the bearing of the crossing
        float t=atan((a.y+(b.y-a.y)*clamp((PIN-a.x)/d,0.,1.))/PIN); lo=min(lo,t); hi=max(hi,t); }
      a=b; }
    return max(min(hi,a1)-max(lo,a0), 0.); }                                             // nothing beyond the line: hi < lo, nothing hidden
  float mouthSeen(vec2 p){ if(p.x>71.) return 1.;                                        // the mouth lights arm one; beyond it the skylights do
    float mx=max(72.-p.x,1.); float a0=atan((-280.-p.y)/mx), a1=atan((-350.-p.y)/mx); float lo=min(a0,a1), hi=max(a0,a1), span=max(hi-lo,1e-3);
    float hid=pierHides(p,PA,vec4(1.,0.,0.,1.),lo,hi)+pierHides(p,PB,PBR,lo,hi);
    return clamp(1.-hid/span, 0., 1.); }
  // A JOINT OF THE FLAGS, AS BUILT. Its section, across the joint: an open bed JW wide and as deep as it is wide, and on each side the
  // flag's arris eased at 45 degrees over half the bed's width. Nothing here is a strength chosen by eye: each of the three faces takes
  // the hall's light as its own facing lets it. The hall's light at a point of the floor is the even light of the room (1 on the flat)
  // and the daylight that has a direction (from the mouth of arm two in arm one, from the skylights in arm two), DN times the even light
  // when it falls square on a face: the walls' own two tones, .82 turned to it and .47 turned away, say how much ((.82-.47)/.47).
  //   the flat of the flag:            1 + DN*lit*sinE                        (sinE: the daylight's height over the floor at this point)
  //   an eased arris, 45 degrees:      AC + DN*lit*(sinE +- cosE*al)/sqrt(2)  (AC = (1+cos 45)/2, the share of the room a face tipped 45 degrees sees;
  //                                    + on the arris turned to the light, the lit lip; - on the one turned from it, never under 0)
  //   the bed:                         AB + DN*lit*sinE*(1 - sh)              (AB = sqrt(2)-1, the share of the room seen from the bottom of a groove as deep as
  //                                    wide; sh = the share of the bed in the shade the lightward arris throws = cotE*al, at most 1)
  // lit = the share of that daylight not stopped on its way here (by a pier, by a cut wall). Each face is drawn at its true width and
  // weighted by the share it covers of the picture element it falls in (a box one and a half elements across: the brief's own floor
  // for a thin thing), so a joint goes to the flags' mean tone with distance by itself, whatever the picture's size.
  const float JW=.024, DN=.745, AC=.854, AB=.414;                                        // JW in flags: 7.2 cm, live's joint
  float cover(float a, float b, float t, float h){ return clamp((min(b,t+h)-max(a,t-h))/(2.*h), 0., 1.); }
  float flagJoint(float tq, float fw, float al, float sinE, float cosE, float lit){
    float h=max(.75*fw, 1e-5), w=.5*JW, flat_=1.+DN*lit*sinE, r2=.70711;
    float lip=AC+DN*lit*(sinE+cosE*al)*r2, away=AC+DN*lit*max(sinE-cosE*al,0.)*r2;
    float sh=min(cosE*al/max(sinE,.05), 1.), bed=AB+DN*lit*sinE*(1.-sh);
    return 1.+(cover(-w,w,tq,h)*(bed-flat_)+cover(w,2.*w,tq,h)*(away-flat_)+cover(-2.*w,-w,tq,h)*(lip-flat_))/flat_; }
  ${LEE_STAIR ? STAIR_GLSL : ''}${FAR_PIERS ? PIERS_GLSL : ''}vec3 hallShade(vec3 n, vec3 p, out float joint, out vec2 blk){
    float sunW=0.; blk=vec2(.5,0.);
    vec2 b0=vec2((abs(n.x)>.5?p.z:p.x)/6., p.y/3.), bfw=fwidth(b0);                       // the walls and piers are built in courses: blocks 6 m by 3 m, the flags' ruler going on up the walls
    vec3 tl=uMouth-p; float dl=length(tl); tl/=max(dl,1e-3);
    float tone=mix(.47,.82,smoothstep(-.6,.7,dot(n,tl)));
    joint=1.;
    float xw=-21.-SLOPE*p.z;
    float cs=smoothstep(.52,.70, vn(vec2((p.x*.5-p.z*.86-uTime*8.)*.04, (p.x*.86+p.z*.5)*.022)));       // cloud shade crossing the skylights (8 m/s: the brief's 2 m/s read as frozen)
    float arm2=smoothstep(60.,84.,p.x);
    if(n.y>.5){ tone=.74;
      vec2 g=p.xz/3.; vec2 fw=fwidth(g);
      float fade=1.-smoothstep(.02,.12,max(fw.x,fw.y));                                 // joints go to their mean tone before they alias
      float fade2=1.-smoothstep(.10,.42,max(fw.x,fw.y));                             // each flag its own stone: told apart until a flag is two pixels
      float ftone=1.+(h21(floor(g))-.5)*mix(.10*fade,.06*fade2,arm2);                      // each flag its own stone (live's)
      vec2 m=p.xz-vec2(72.,-315.); float along=-m.x*.86+m.y*.5, across=m.x*.5+m.y*.86;      // the wedge from the mouth of arm two
      // its edge is the shade of the mouth's two jambs: one flag (3 m) wide where it leaves the mouth, wider by 4 cm a metre as it goes
      float wl=22.+max(along,0.)*.18; float wedge=(1.-smoothstep(wl, wl+3.+max(along,0.)*.04, abs(across)))*smoothstep(-10.,20.,along)*(1.-smoothstep(120.,260.,along));
      // THE PIERS STAND IN THAT DAYLIGHT. Floor from which a pier hides the mouth has lost the wedge, and of the plain daylight keeps what
      // a face turned away from arm two keeps (the brief's 0.62 against the floor's 0.74)
      float seen=mix(mouthSeen(p.xz), 1., arm2);
      tone*=mix(.62/.74, 1., seen)*(1.+.18*wedge*seen*(1.-.85*cs));
      float sl=abs(fract((p.x-SL0)/30.)-.5)*30.;                                            // pools under the skylights
      float pool=exp(-sl*sl/36.)*step(SL0-6.,p.x)*step(p.x,SL1)*slotZ(p,.64,1.28);
      float tH; float shw=wallShadow(p,tH)*smoothstep(XB-12.,XB+6.,p.x);                   // the cut walls' long shadows, with the ellipse of light each hole lets through
      float open_=1.-shw, day=1.-.70*cs;                                                   // cloud shade: the shadows fade and return
      tone*=(1.+.46*pool*day*(.35+.65*open_))*(1.-(.11+.05*arm2)*cs)*(1.-.07*arm2);
      float si=shwIn(p);                                                                   // open floor is in plain daylight; the sun itself lands in the holes' ellipses and in the bars under the slots
      tone*=1.+arm2*(day*(.20+.26*si)*open_-(.30-.08*smoothstep(50.,120.,tH))*shw*(.4+.6*day));
      float bar=slotBar(p)*open_*arm2*day; tone*=1.+.60*bar;
      // THE RULER UNDER THE PAINT, AS RELIEF. The daylight at this point: its height and bearing (toward the mouth of arm two in arm one, up into
      // the skylights in arm two) and how much of it arrives (what a pier leaves of the mouth; what a cut wall does not stop).
      vec3 l3=mix(tl, uSkyL, arm2); float cosE=max(length(l3.xz),1e-3), sinE=clamp(l3.y/max(length(l3),1e-3), .05, 1.); vec2 ld=l3.xz/cosE; cosE=sqrt(max(1.-sinE*sinE,0.));
      vec2 tq=(fract(g+.5)-.5)*vec2(ld.x<0.?-1.:1., ld.y<0.?-1.:1.);                      // from each joint's middle, positive toward the light
      float lit=mix(seen, open_, arm2);
      joint=flagJoint(tq.x,fw.x,abs(ld.x),sinE,cosE,lit)*flagJoint(tq.y,fw.y,abs(ld.y),sinE,cosE,lit)*ftone;
      sunW=arm2*max(bar, .62*open_*si*day);
      float dR=p.z>-280.? (p.x<XB-4.? (xw+70.*WLEN-p.x)/WLEN : min(p.x-XB, XE-p.x)) : (p.x>72.? (p.x<XB? -280.-p.z : min(length(p.xz-vec2(XB,-280.)), XE-p.x)) : length(p.xz-vec2(72.,-280.)));
      vec2 qb=p.xz-PB.xy; qb=vec2(dot(qb,PBR.xy),dot(qb,PBR.zw));
      float dm=min(min((p.x-xw)/WLEN, dR), min(p.z+350., min(boxD(p.xz-PA.xy,PA.zw), boxD(qb,PB.zw))));
      ${LEE_STAIR ? STAIR_FLOOR : ''}${FAR_PIERS ? PIERS_FLOOR : ''}for(int i=0;i<5;i++){ vec2 a=uFin[i].xy, ab=uFin[i].zw-a; vec2 ap=p.xz-a;                 // where the five cut walls stand on the floor
        float h=clamp(dot(ap,ab)/max(dot(ab,ab),1e-4),0.,1.); dm=min(dm, max(length(ap-ab*h)-.25,0.)); }
      tone*=1.-.26*exp(-max(dm,0.)/1.5)-.10*exp(-max(dm,0.)/.25); }
    else if(n.y<-.5){ tone=.68*(1.-(.07+.05*arm2)*cs); }
    else { vec2 qc=p.xz-PB.xy; qc=vec2(dot(qc,PBR.xy),dot(qc,PBR.zw)); float dW=(p.x-xw)/WLEN, dB=boxD(qc,PB.zw);
      float dc=min(dW>.06?dW:1e3, dB>.06?dB:1e3);                                           // the inside corner of wall and pier: a dark plumb line
      ${LEE_STAIR ? STAIR_WALL : ''}${FAR_PIERS ? PIERS_WALL : ''}tone*=1.-.22*exp(-dc/1.6)-.16*exp(-dc/.22);
      tone*=(1.-.20*exp(-max(p.y,0.)/1.5)-.10*exp(-max(p.y,0.)/.25))*(1.-.08*exp(-max(48.-p.y,0.)/3.))*(.97+.03*smoothstep(0.,30.,p.y)); tone*=1.-(.13+.04*arm2)*cs;
      float sl=abs(fract((p.x-SL0)/30.)-.5)*30.; float bay=exp(-sl*sl/90.)*step(SL0-12.,p.x)*step(p.x,SL1+6.);            // a wash of light down the wall under each skylight
      tone*=1.+arm2*(.26*bay*smoothstep(4.,48.,p.y)*(1.-.85*cs)-.08);
      float bar=slotBar(p)*arm2*smoothstep(0.,.35,dot(n,uSkyL))*(1.-.85*cs); tone*=1.+.85*bar; sunW=bar;
      vec2 bb=vec2(b0.x+.5*mod(floor(b0.y),2.), b0.y), ba=abs(fract(bb)-.5);
      float bfade=1.-smoothstep(.07,.22,max(bfw.x*2.,bfw.y)); vec2 bw=max(vec2(.007,.014), bfw*.9);                             // the joints go to their mean tone before they alias
      float bj=max(smoothstep(.5-bw.x-max(bfw.x,1e-6),.5-bw.x,ba.x), smoothstep(.5-bw.y-max(bfw.y,1e-6),.5-bw.y,ba.y))*bfade;      // a joint is never thinner than two pixels
      tone*=(1.-mix(.05,.06,arm2)*bj)*(1.+(h21(floor(bb)+2.3)-.5)*mix(.06,.025,arm2)*(.3+.7*bfade));                // all through the hall: under the paint too, so a cliff is seen to lie on a wall (joints never deeper than the flags' 6 percent: a white wall first)
      blk=vec2(h21(floor(bb)+5.1), bfade); }                                              // the block this point is in, for the paint it took (the round's one line here; live's closing brace stands after it)
    float sh=0.;                                                                          // swallow shadows along the daylight
    for(int i=0;i<3;i++){ vec3 r=p-uBird[i]; float al=dot(r,uDay); vec3 pr=r-uDay*al;
      vec3 f=uBirdV[i]-uDay*dot(uBirdV[i],uDay); f/=max(length(f),1e-3); vec3 sd=cross(uDay,f);
      float rad=((i==1?uShR:.85)+.014*max(al,0.))*1.25, a=dot(pr,f)/rad, b=abs(dot(pr,sd))/rad;      // half the span of the shadow, soft with distance
      float wd=max(abs(a-(.16-.80*b*b))-(.17*(1.-b)+.03), b-1.);                                   // swept wings
      float bd=length(vec2((a+.10)/.55, b/.12))-1.;                                              // body and tail
      float dd=min(wd, bd*.12), soft=.05+.0025*max(al,0.);
      sh=max(sh, (1.-smoothstep(-soft, soft, dd))*step(0.,al)*(1.-smoothstep(30.,70.,al))); }
    tone*=1.-.52*sh;
    float a2=smoothstep(60.,84.,p.x);
    // arm two: decided light, the steps of tone half again as deep. The flags stay a PALE floor in shade (the shadows on them are
    // shallower than on plaster; the daylight on them is as it was), and the shade is a cool grey, not a blue: arm two has no colour of its own
    float fl=step(.5,n.y);
    tone=mix(tone, mix(max(.40, .74+(tone-.74)*1.55), mix(max(FSH,.74+(tone-.74)*1.12), .74+(tone-.74)*1.55, step(.74,tone)), fl), a2);
    vec3 tint=mix(mix(vec3(.86,.915,1.), mix(vec3(.695,.795,.97), vec3(.82,.90,1.02), fl), a2), mix(vec3(1.,.992,.965), vec3(.985,.995,1.), a2), smoothstep(.56,.84,tone));
    tint=mix(tint, vec3(1.03,1.06,1.10), .72*sunW);                                        // where the daylight itself lands: a clear cool white (no sun, no colour in the hall)
    return tint*tone; }
`;
const HALL_FRAG = /* glsl */`${HALL_COMMON}
  varying vec3 vP, vN;
  uniform sampler2D tPaint; uniform mat4 uProj; uniform vec3 uO, uRingCol, uSea1, uSea2, uFallCol, uSwiftCol;
  uniform vec4 uRing, uPA, uPB, uPBrot; uniform vec4 uSwift[7]; uniform vec3 uSwiftV[7]; uniform float uFallZ, uBrush, uStop;
  bool segBox(vec2 o, vec2 p, vec4 box, vec4 rot){
    vec2 a=o-box.xy, b=p-box.xy; a=vec2(dot(a,rot.xy),dot(a,rot.zw)); b=vec2(dot(b,rot.xy),dot(b,rot.zw));
    vec2 dir=b-a; dir=vec2(abs(dir.x)<1e-5?1e-5:dir.x, abs(dir.y)<1e-5?1e-5:dir.y);
    vec2 t1=(-box.zw-a)/dir, t2=(box.zw-a)/dir; vec2 lo=min(t1,t2), hi=max(t1,t2);
    float tn=max(lo.x,lo.y), tf=min(hi.x,hi.y);
    return tn<tf && tn<.997 && tf>0.; }
  void main(){
    vec3 n=normalize(vN+vec3(0.,1e-5,0.)), p=vP;
    vec3 od=p-uO; float dist=length(od); vec3 d=od/max(dist,1e-3);
    float apx=length(fwidth(d))+1e-6;                                                   // radians per pixel, in projector space
    vec2 gfl=p.xz/3., gfw=fwidth(gfl);                                                   // the flags, 3 m square (derivative taken here, before any loop)
    // BRUSHWORK (only once the hall is lit: everything here is weighted by uK). The surface is laid out in patches about
    // 3 m across, each painted in one direction (the surface's own, turned by chance: see below); a patch is rows of dabs, and every dab is ONE flat colour: the picture looked up at the dab's centre.
    vec3 t1=abs(n.y)>.5?vec3(1.,0.,0.):normalize(vec3(-n.z,0.,n.x)+vec3(1e-5,0.,0.)), t2=cross(n,t1);
    vec2 s=vec2(dot(p,t1),dot(p,t2));
    float fs=max(fwidth(s.x),fwidth(s.y))+1e-5;                                          // metres of surface per pixel
    // on a floor seen at a low angle a pixel is long one way and short the other: a stroke is still told apart while the mean
    // of the two (the root of the area a pixel covers), leaning three tenths toward the long one, is under about half its width
    float fq=mix(sqrt(length(cross(dFdx(p),dFdy(p)))+1e-10), fs, .3)+1e-5;
    // A DAY'S WORK. The picture was laid in sections about 11 m across (a painter's reach from one stand of the scaffold or one
    // kneeling board), their edges wandering 3.5 m: each section a breath lighter or darker, warmer or cooler than its neighbours,
    // with a seam where the later one laps the earlier. Fixed to the surface, large enough to be seen from across the hall.
    vec2 gw=(s+3.5*vec2(vn(s*.07+3.), vn(s*.07+41.)))/11.; vec2 gi=floor(gw), ga=abs(fract(gw)-.5);
    float gh=h21(gi+7.7), gh2=h21(gi.yx+2.9), gedge=(.5-max(ga.x,ga.y))*11.;                // metres from the seam
    float gseam=(1.-smoothstep(0., .10+1.5*fs, gedge))*min(1., .10/max(fs,1e-3)+.35);
    vec2 swp=s+1.1*vec2(vn(s*.31), vn(s*.31+17.3));                                      // patch edges wander
    vec2 pc=(floor(swp/3.)+.5)*3.; float ph=h21(floor(swp/3.)+3.7);
    vec3 pc3=p+t1*(pc.x-swp.x)+t2*(pc.y-swp.y), dc=pc3-uO; float distc=length(dc); dc/=max(distc,1e-3);
    // THE STROKES LIE IN THE SURFACE'S OWN DIRECTIONS, not along the drag: each patch is brushed one way, anywhere within 69 degrees
    // of the surface's own axis (the flags' rows on the floor; on a wall the level, tipped 29 degrees as a right hand tips a brush).
    // Laid along the drag (as they were) the strokes lengthened every streak of the dragged picture; laid across it they cut the
    // streaks into dabs, which is what a picture pulled askew over a painted floor looks like.
    float ang=(ph-.5)*2.4+(abs(n.y)>.5?0.:.5);
    float scl=clamp(distc/45.,1.,3.2), graze=clamp(1./sqrt(max(abs(dot(dc,n)),.08)),1.,2.2);
    vec2 dab=vec2(min(.62*graze*scl,2.2),.26*scl);                                                   // a dab: 0.62 m by 0.26 m near the station (a wall brush), growing with the distance from the station as the picture's own grain does (to 2.2 m by 0.83 m)
    vec2 cs=vec2(cos(ang),sin(ang)); vec2 sl=swp-pc; vec2 sr=vec2(dot(sl,cs), dot(sl,vec2(-cs.y,cs.x)))/dab;
    sr+=.30*vec2(vn(sl*1.9+ph*31.)-.5, vn(sl*1.9+ph*31.+11.)-.5);                        // edges wobble: no ruled lines
    // two interleaved layers of lens-shaped strokes: A on top, B (half a stroke along and across) showing between them
    vec2 cfA=fract(sr)-.5, cfB=fract(sr+.5)-.5;
    float la=.5*(1.-3.*cfA.x*cfA.x)-abs(cfA.y);                                          // above zero inside a stroke of layer A
    float onA=step(0.,la);
    vec2 cf=mix(cfB,cfA,onA), cell=mix(floor(sr+.5)+vec2(17.,31.), floor(sr), onA);
    float ch=h21(cell+ph*57.), ch2=h21(cell.yx+ph*23.+5.);
    float bfade=uBrush*uK*smoothstep(1.3,3.2,dab.y/fq);                                 // dabs smaller than two pixels melt back into the plain picture
    vec2 off=-cf*dab; off=cs*off.x+vec2(-cs.y,cs.x)*off.y;
    vec3 pb=p+(t1*off.x+t2*off.y)*(.94*bfade);
    vec4 q=uProj*vec4(pb,1.); vec2 uv=q.xy/max(q.w,1e-4)*.5+.5;
    float de=abs(la)*dab.y;                                                             // metres from the edge of the upper stroke
    float drim=(1.-smoothstep(0., .030+1.2*fs, de))*mix(1.,.55,onA);                    // a darker line where one stroke laps the next
    float bristle=vn(vec2(sr.y*11.+ch*40., sr.x*1.3+ch2*9.));                           // hairs of the brush, along the stroke
    float big=smoothstep(2.5,7.,dab.y/fq);                                              // per-stroke accents only where a stroke is several pixels wide
    float dabTone=(1.+(ch-.5)*.34*(.4+.6*big))*(1.-.40*drim*big)*(1.+.14*(bristle-.5)*big);      // stroke to stroke a sixth lighter or darker, a lap line two fifths down: the steps a loaded and a spent brush leave
    vec4 q0=uProj*vec4(p,1.); vec2 uv0=q0.xy/max(q0.w,1e-4)*.5+.5;
    // the picture's outer border ends in stroke ends (whole dabs in or out, a few metres ragged), never a ruled line
    float eb=min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y)), eb0=min(min(uv0.x,1.-uv0.x),min(uv0.y,1.-uv0.y));
    bool cov=q0.w>1e-3 && q.w>1e-3 && eb0>0. && eb>(.004+.030*ch2+.022*vn(s*.23+ph*9.))*uBrush*uK;
    // DRY BRUSH. Where the picture is dragged out at a low angle the brush runs dry: hairs and long streaks of bare
    // stone or plaster are left along the drag, more toward the end of each stroke. Two scales; what is bare is decided below (PAINT IS OPAQUE).
    float dryK=smoothstep(1.2,2.1,graze)*.75+.25*smoothstep(1.5,3.,scl);
    vec2 dr=vec2(dot(sl,cs), dot(sl,vec2(-cs.y,cs.x)));                                   // metres along and across the drag, in this patch
    float hair=vn(vec2(sr.y*5.3+ch*40., sr.x*.55+ch2*9.)), ends=smoothstep(.20,.5,abs(cf.x));
    float dragS=vn(vec2(dr.y*2.3+ph*50., dr.x*.16+ph*7.))*.7+vn(vec2(dr.y*5.9+ph*11., dr.x*.4))*.3;
    vec3 hueS=1.+((ch-.5)*(.4+.6*big)*bfade+(ph-.5)*.8*uBrush*uK*(1.-smoothstep(.3,1.2,fs)))*vec3(.17,.03,-.20);   // stroke to stroke, patch to patch: warmer, cooler
    // the gaps behind the piers and round the corner end where a stroke ends: the test is made for the stroke's own middle (pb), so a
    // whole stroke is in or out and the picture stops in stroke ends with bare block between them, not at a ruled line
    bool hid=segBox(uO.xz,pb.xz,uPA,vec4(1.,0.,0.,1.)) || segBox(uO.xz,pb.xz,uPB,uPBrot);
    vec2 cr=vec2(72.,-280.)-uO.xz, pr=pb.xz-uO.xz;
    hid=(hid || (pb.x>72.2 && cr.x*pr.y-cr.y*pr.x>0.)) && uStop>.5;                                    // arm two round the corner of the L
    float pm=cov?(hid?1.-smoothstep(.12,.60,uK):1.):0.;                                  // the bare gaps behind the piers come up with the hall's daylight (no white sliver in the valley while k is still 0)
    vec3 tex=texture2D(tPaint, clamp(uv,.001,.999)).rgb;
    tex*=mix(1., dabTone, bfade)*hueS;
    tex*=mix(vec3(1.), (1.+(gh-.5)*.13)*(1.+(gh2-.5)*vec3(.10,.02,-.12))*(1.-.22*gseam), uBrush*uK);      // section to section: 6 percent of tone, 5 of warmth; the seam a fifth darker (wet paint over dry)
    // ---- the fall: ray against the plane z = uFallZ
    float dz=min(d.z,-1e-4);
    vec2 fh=uO.xy+d.xy*((uFallZ-uO.z)/dz);
    float fx=smoothstep(.6,1.6,fh.x)*(1.-smoothstep(5.2,6.4,fh.x)), fy=step(fh.y,6.)*step(-8.6,fh.y);
    float streak=vn(vec2(fh.x*3.1, fh.y*.35+uTime*9.*.35))*.6+vn(vec2(fh.x*7.3+3., fh.y*.9+uTime*9.*.9))*.4;
    float fallA=fx*fy*step(d.z,-1e-3)*(.55+.45*smoothstep(.25,.7,streak));
    float mist=exp(-pow(abs(fh.y+7.6)/3.2,2.)-pow(abs(fh.x-3.5)/5.5,2.))*(.45+.3*vn(vec2(fh.x*.5-uTime*.4,fh.y*.6+uTime*.7)))*step(d.z,-1e-3);
    vec3 paint=mix(tex, uFallCol*(.78+.3*streak), fallA);
    paint=mix(paint, uFallCol*.95, mist*.7);
    // ---- the ring: ray against the plane of the ring
    vec2 rh=uO.xy+d.xy*((uRing.z-uO.z)/dz)-uRing.xy; float r=length(rh), R=uRing.w;
    float fr=fwidth(r)+apx*abs((uRing.z-uO.z)/dz);
    vec2 v=rh/R;
    float hz=-.12, below=hz-v.y;
    float band=.5+.5*sin(18./max(below+.12,.03)+uTime*1.4+v.x*3.);
    float glit=smoothstep(.82,.98,vn(vec2(v.x*26., 9./max(below+.1,.03)+uTime*2.2)))*exp(-v.x*v.x*9.)*step(0.,below);
    vec3 sea=mix(uSea1,uSea2,band*.55+.3*smoothstep(0.,.9,below))*(.80+.25*band)+vec3(1.,.98,.9)*glit*1.4;
    vec3 sky=mix(vec3(.93,.98,.96), uSea2*1.05, smoothstep(0.,1.1,v.y-hz))+vec3(1.,.95,.85)*.35*exp(-max(v.y-hz,0.)*5.);
    vec3 inside=min(mix(sky, sea, smoothstep(-.012,.012,below))*1.05, vec3(4.));
    float x=max(r-R,0.)/R;
    float wisp=fbm(v*1.6+vec2(x*5.-uTime*.7, uTime*.2));
    float glow=exp(-x*x*900.)*1.6+exp(-x*7.)*(.30+.8*wisp*wisp)+exp(-x*2.2)*.07;
    float rimw=max(.2, .9*fr), rim=1.-smoothstep(rimw*.6, rimw, abs(r-(R-.2)));
    float disc=1.-smoothstep(R-.4-fr, R-.4, r);
    float ringOn=step(d.z,-1e-3);
    paint=mix(paint, inside, disc*ringOn);
    vec3 lightRing=uRingCol*(glow*(1.-disc)*(1.-.72*uK)+rim*3.)*ringOn;
    paint=paint*(1.-rim*ringOn)+lightRing;
    // ---- seven swifts: darts in projector space (no texture, no derivative in here)
    float sw=0.;
    for(int i=0;i<7;i++){ vec3 sp=uSwift[i].xyz-uO; float sd=length(sp); vec3 sn=sp/max(sd,1e-3);
      vec3 e=d-sn*dot(d,sn); vec3 vv=uSwiftV[i]-sn*dot(uSwiftV[i],sn); vv/=max(length(vv),1e-3);
      float al=dot(e,vv); vec3 side=e-vv*al; float ac=length(side);
      float hs=max(.5*uSwift[i].w/max(sd,1.), 2.4*apx), px=apx/hs;                       // half span, never under 2.4 pixels
      float a=al/hs, b=ac/hs;
      float wd=abs(a-(.16-.80*b*b))-max(.15*(1.-b)+.015, .7*px);
      wd=max(wd, b-1.);
      float bd=length(vec2((a+.12)/.52, b/max(.085,.7*px)))-1.;
      float dd=min(wd, bd*.08); sw=max(sw, (1.-smoothstep(-px*.4, px*.6, dd))*step(0.,dot(d,sn))); }
    paint=mix(paint, uSwiftCol, sw*.92);
    // ---- the hall's own light
    float joint; vec2 blk; vec3 shd=hallShade(n,p,joint,blk);
    float fine=1.-smoothstep(.06,.25,fs);
    float trowel=vn(s*vec2(1.3,5.))*.6+vn(s*vec2(7.,2.1)+9.)*.4;                         // the plaster under the paint: trowel marks and grain
    float grain=(.96+.08*vn(s*9.)*vn(s*31.+3.))*(1.-.10*(trowel-.5)*fine);
    vec3 bare=(n.y>.5?uFlag*(.955+.07*vn(s*.55+floor(s/3.)*7.)+.05*(vn(s*2.7)-.5)*fine):uPlaster*(.975+.04*vn(s*.21)+.03*(vn(s*vec2(1.3,5.))-.5)*fine));   // clouded stone, trowelled plaster
    if(n.y<-.5 && p.x>72.){ float sl=abs(fract((p.x-SL0)/30.)-.5)*30.;
      float slot=(1.-smoothstep(2.4,3.,sl))*slotZ(p,.96,1.)*step(SL0-6.,p.x)*step(p.x,SL1);
      float sk=smoothstep(.38,.66, vn(vec2((p.x*.5-p.z*.86-uTime*8.)*.04, (p.x*.86+p.z*.5)*.022)));                // the sky in the slots: blue, with the same clouds that shade the room crossing it
      bare=mix(bare, mix(vec3(.50,.74,1.16), vec3(1.02,1.04,1.06), sk), slot); shd=mix(shd, vec3(1.), slot); }
    // PAINT ON STONE FLAGS AND COURSED BLOCK. The build is under the paint as relief (the grooves and their light are in hallShade and lie
    // on paint and bare stone alike); every flag and every block took the paint a little differently, and a few flags drank it and dried a tone down.
    float fv=0.;
    if(n.y>.5){ float gm=max(gfw.x,gfw.y), tfade=1.-smoothstep(.12,.50,gm);
      float fh=h21(floor(gfl)+3.3); fv=((fh-.5)*.19-.12*smoothstep(.86,.97,h21(floor(gfl)+9.1)))*tfade; }      // flag to flag a tenth either way; one flag in ten 12 percent down (just past what any flag differs by, so it is told apart)
    else if(n.y>-.5) fv=(blk.x-.5)*.12*blk.y;                                             // block to block 6 percent either way: plaster-faced block drinks less unevenly than stone
    float solid=max(max(disc,rim),max(fallA,sw))*ringOn;                                // ring, fall and swifts are never broken
    // PAINT IS OPAQUE. A point is painted or it is bare: where the brush ran dry it left HAIRS AND STREAKS OF BARE GROUND with an edge (0.06 of
    // the hair's own noise wide), not a wash of plaster through paint. uBrush is 0.8 for the whole flight, so each threshold stands a fifth of the way from its base to 1.03 (a hair 0.69 to 0.98, a streak 0.81 to 0.89, a thin-dragged stroke's hair 0.77): LESS is bare than where live's ramp had reached its top, and at 0.98 (dryK and ends both 0) the hair's noise, 1 at most, never clears the edge's top at 1.01: that hair is nine tenths bare at its barest and never wholly. As a hair or a streak
    // nears the width of a pixel it narrows to nothing (its threshold rises to 1.03), and
    // none is drawn as a scratch a pixel wide: a hair of the dry brush is about 0.057 of its stroke's width across (5.3 hairs to a
    // stroke, three tenths of each bare), a hair of a thin-dragged stroke 0.027 (11 to a stroke), a streak along the drag 10 cm; each
    // is gone before a pixel is half as wide as it is.
    float cut=.03, fA=smoothstep(.25,.5,fs/(.057*dab.y)), fB=smoothstep(.25,.5,fs/.10), fT=smoothstep(.25,.5,fs/(.027*dab.y)), brOn=uBrush*uK*(1.-solid);
    float hA=mix(.97-.20*dryK-.16*ends, 1.+cut, max(fA, 1.-brOn)), hB=mix(.86-.10*dryK, 1.+cut, max(fB, 1.-brOn)), hT=mix(.70, 1.+cut, max(max(fT, 1.-big*bfade), 1.-brOn));
    float bareIn=max(max(smoothstep(hA-cut,hA+cut,hair), smoothstep(hB-cut,hB+cut,dragS)), step(.92,ch2)*smoothstep(hT-cut,hT+cut,bristle));
    // PAINT HAS THE RANGE OF PIGMENT. Under the hall's light the brightest thing a brush can leave is white paint, and white paint on white
    // plaster is as bright as the plaster (PW, the plaster's own albedo), never brighter. Up to half of that the picture keeps its
    // values exactly (meadow, pines, rock, shade); above, sky, snow, river and the ring's sea close up toward white and keep their hue.
    float PW=max(uPlaster.r,max(uPlaster.g,uPlaster.b)), knee=.5*PW;
    vec3 alb=paint*grain*(1.+fv*(1.-solid))/.80; float ma=max(alb.r,max(alb.g,alb.b));
    float mc=ma<=knee? ma : knee+(PW-knee)*(1.-exp(-(ma-knee)/(PW-knee)));
    vec3 pig=alb*(mc/max(ma,1e-4));
    // THE RING, THE FALL AND THE SWIFTS are not the picture from the target: they keep the range the brief gives them (min(paint, 0.86) over
    // 0.80, as live), so the rim is the brightest paint in the hall, the sea under it keeps its bands and glitter and the fall is white.
    // The fall's mist is the fall. (No flag or block tone on them: fv is already off wherever they are.)
    float mxp=max(paint.r,max(paint.g,paint.b)), ana=clamp(max(solid, mist*.7), 0., 1.);
    pig=mix(pig, paint*grain/(.80*max(1., mxp/.86)), ana);
    vec3 lit=mix(bare, mix(pig, bare, bareIn), pm)*shd*joint;
    vec3 raw=mix(bare, paint, pm);
    gl_FragColor=vec4(mix(raw, lit, uK),1.);
  }`;

// ---------------------------------------------------------------- hall geometry (canonical space, inward-facing quads)
const xW = (z) => -21 - GEO.wallSlope * z, WALL_LEN = Math.hypot(1, GEO.wallSlope);
const wDir = [GEO.wallSlope / WALL_LEN, -1 / WALL_LEN], wOut = [1 / WALL_LEN, GEO.wallSlope / WALL_LEN];   // along W (away), out of W (into the hall), in (x, z)
const xR = (z) => xW(z) + 70 * WALL_LEN;
export const PIER_A = { cx: 23.5, cz: -168, hx: 4, hz: 4 };
export const PIER_B = { cx: wDir[0] * 5 + wOut[0] * 7, cz: -258 + wDir[1] * 5 + wOut[1] * 7, hx: 7, hz: 5 };   // local x = out of the wall, local z = along it
// [F5-STAIR] WHERE THE STAIR STANDS, worked out from GEO.S, PIER_B and wall W (nothing here reads the eye, the route, the clock or a seed).
// Risers stand on the flags' joints (z a multiple of STAIR.go) and face +z, back toward S; riser j (1..n) is rise*j high at its top.
// The flank is parallel to wall W, D m out from it: D is STAIR.out, narrowed until every point of the stair lies STAIR.inShadow inside
// the shadow pier B throws from S (the line from S past the pier's corner of greatest bearing; d is the distance inside it).
export function stairPlan() {
  const B = PIER_B, T = STAIR, S = GEO.S, bp = (lx, lz) => [B.cx + wOut[0] * lx + wDir[0] * lz, B.cz + wOut[1] * lx + wDir[1] * lz];      // [F5-STAIR]
  const cs = [bp(-B.hx, -B.hz), bp(B.hx, -B.hz), bp(B.hx, B.hz), bp(-B.hx, B.hz)];                                                      // [F5-STAIR]
  const zA = Math.floor((Math.min(...cs.map((c) => c[1])) - T.behindPier) / T.go) * T.go, zT = Math.floor(T.lowTo / T.go) * T.go;        // [F5-STAIR] first riser; first riser of the upper flight
  const upper = Math.ceil((zT - T.farZ) / T.go), risers = [];                                                                           // [F5-STAIR] a riser on every joint from zT to the far wall
  for (let j = 0; j < T.lower; j++) risers.push(zA - T.go * j);                                                                         // [F5-STAIR]
  for (let j = 0; j < upper; j++) risers.push(zT - T.go * j);                                                                           // [F5-STAIR]
  let edge = cs[0]; for (const c of cs) if ((c[0] - S[0]) / (S[2] - c[1]) > (edge[0] - S[0]) / (S[2] - edge[1])) edge = c;              // [F5-STAIR] the corner the shadow's edge passes
  const rl = Math.hypot(edge[0] - S[0], edge[1] - S[2]), rx = (edge[0] - S[0]) / rl, rz = (edge[1] - S[2]) / rl;                        // [F5-STAIR]
  const inside = (x, z) => rz * (x - S[0]) - rx * (z - S[2]);                                                                           // [F5-STAIR] metres inside the shadow's edge
  let D = T.out; for (const z of [zA, T.farZ]) D = Math.min(D, ((T.inShadow + rx * (z - S[2])) / rz + S[0] - xW(z)) / WALL_LEN);        // [F5-STAIR]
  const margin = Math.min(inside(xW(zA) + D * WALL_LEN, zA), inside(xW(T.farZ) + D * WALL_LEN, T.farZ));                                // [F5-STAIR]
  return { zA, zT, risers, lower: T.lower, upper, D, margin, yTerrace: T.rise * T.lower, yTop: T.rise * (T.lower + upper), landing: risers[risers.length - 1] - T.farZ };   // [F5-STAIR]
}
// [F5-PIERS] WHERE THE FAR WALL'S PIERS STAND: midway between each two skylights and on by the same module (slot0 + module*k), from the
// first whose whole face lies FARP.clearS east of where the paint ends on the plane of the piers' faces (the line from S past the corner
// of the L) to the last that stands clear of the room's east wall.
export function farPierPlan() {
  const T = FARP, S = GEO.S, zF = T.farZ + T.proud, xEnd = S[0] + (xR(-280) - S[0]) * (zF - S[2]) / (-280 - S[2]), xs = [];           // [F5-PIERS]
  for (let k = 1; T.slot0 + T.module * k + T.half < GEO.XE; k++) if (T.slot0 + T.module * k - T.half >= xEnd + T.clearS) xs.push(T.slot0 + T.module * k);   // [F5-PIERS]
  return { xs, zF, xEnd };                                                                                                             // [F5-PIERS]
}

const wOut3 = [wOut[0], 0, wOut[1]];      // [F5-STAIR] out of wall W, as a normal
function hallGeometry() {
  const pos = [], nor = [], idx = [], a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const quad = (p0, p1, p2, p3, n) => {                    // p0..p3 round the quad; wound so its front faces n
    a.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]); b.set(p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]); c.crossVectors(a, b);
    const flip = c.x * n[0] + c.y * n[1] + c.z * n[2] < 0, base = pos.length / 3, ps = flip ? [p0, p3, p2, p1] : [p0, p1, p2, p3];
    for (const p of ps) { pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]); }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  const wall = (x0, z0, x1, z1, nx, nz, y0 = 0, y1 = GEO.ceil) => quad([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], [nx, 0, nz]);
  const C = GEO.ceil, X0 = -220, X1 = 440, Z0 = 280, Z1 = -440, ZB = 150, XE = GEO.XE;
  quad([X0, 0, Z0], [X1, 0, Z0], [X1, 0, Z1], [X0, 0, Z1], [0, 1, 0]);                           // floor
  quad([X0, C, Z0], [X1, C, Z0], [X1, C, Z1], [X0, C, Z1], [0, -1, 0]);                          // ceiling
  wall(xW(ZB), ZB, xW(-350), -350, wOut[0], wOut[1]);                                             // W, arm one's left wall
  wall(xW(ZB), ZB, xR(ZB), ZB, 0, -1);                                                            // behind the entry
  wall(xR(ZB), ZB, xR(-280), -280, -wOut[0], -wOut[1]);                                           // arm one's right wall, to the mouth of arm two
  wall(xR(-280), -280, GEO.XB, -280, 0, -1);                                                      // arm two, near wall, to where the room opens
  wall(GEO.XB, -280, GEO.XB, GEO.ZN, 1, 0);                                                       // the room's west wall
  wall(xW(-350), -350, XE, -350, 0, 1);                                                           // the far wall of both arms and of the room
  wall(XE, GEO.ZN, XE, -350, -1, 0);                                                              // the room's east wall, which the fins stand out from
  wall(GEO.XB, GEO.ZN, XE, GEO.ZN, 0, -1);                                                        // behind wall 5
  const A = PIER_A;
  wall(A.cx - A.hx, A.cz + A.hz, A.cx + A.hx, A.cz + A.hz, 0, 1); wall(A.cx - A.hx, A.cz - A.hz, A.cx + A.hx, A.cz - A.hz, 0, -1);
  wall(A.cx - A.hx, A.cz + A.hz, A.cx - A.hx, A.cz - A.hz, -1, 0); wall(A.cx + A.hx, A.cz + A.hz, A.cx + A.hx, A.cz - A.hz, 1, 0);
  const B = PIER_B, bp = (lx, lz) => [B.cx + wOut[0] * lx + wDir[0] * lz, B.cz + wOut[1] * lx + wDir[1] * lz];
  const b00 = bp(-B.hx, -B.hz), b10 = bp(B.hx, -B.hz), b11 = bp(B.hx, B.hz), b01 = bp(-B.hx, B.hz);
  wall(b00[0], b00[1], b10[0], b10[1], -wDir[0], -wDir[1]);                                       // the face the ring's right half lies on
  wall(b10[0], b10[1], b11[0], b11[1], wOut[0], wOut[1]); wall(b11[0], b11[1], b01[0], b01[1], wDir[0], wDir[1]);
  if (LEE_STAIR) {                                                                                 // [F5-STAIR] risers, treads and the flank, in the hall's one mesh
    const P = stairPlan(), zs = P.risers, n = zs.length, xb = (z) => xW(z) + P.D * WALL_LEN, yj = (j) => STAIR.rise * j, zf = STAIR.farZ;      // [F5-STAIR]
    const tri = (p0, p1, p2, nn) => { a.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]); b.set(p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]); c.crossVectors(a, b);   // [F5-STAIR]
      const base = pos.length / 3; for (const p of (c.x * nn[0] + c.y * nn[1] + c.z * nn[2] < 0 ? [p0, p2, p1] : [p0, p1, p2])) { pos.push(p[0], p[1], p[2]); nor.push(nn[0], nn[1], nn[2]); } idx.push(base, base + 1, base + 2); };   // [F5-STAIR]
    for (let j = 1; j <= n; j++) {                                                                  // [F5-STAIR]
      const z = zs[j - 1], zn = j < n ? zs[j] : zf, y0 = yj(j - 1), y1 = yj(j);                      // [F5-STAIR]
      quad([xW(z), y0, z], [xb(z), y0, z], [xb(z), y1, z], [xW(z), y1, z], [0, 0, 1]);              // [F5-STAIR] riser j
      quad([xW(z), y1, z], [xb(z), y1, z], [xb(zn), y1, zn], [xW(zn), y1, zn], [0, 1, 0]);          // [F5-STAIR] its tread (the terrace; the top landing)
      // the flank in level bands, each from the far wall to its riser; the next riser's foot is a corner of the band, so no edge ends on another's middle
      const A = [xb(zf), y0, zf], Bv = [xb(z), y0, z], C = [xb(z), y1, z], Dv = [xb(zn), y1, zn], E = [xb(zf), y1, zf];      // [F5-STAIR]
      tri(A, Bv, C, wOut3); if (j < n) { tri(A, C, Dv, wOut3); tri(A, Dv, E, wOut3); } else tri(A, C, E, wOut3);             // [F5-STAIR]
    }
  }
  if (FAR_PIERS) {                                                                                 // [F5-PIERS] three faces each, floor to ceiling, in the hall's one mesh
    const P = farPierPlan(), z0 = FARP.farZ;                                                       // [F5-PIERS]
    for (const x of P.xs) { wall(x - FARP.half, P.zF, x + FARP.half, P.zF, 0, 1); wall(x - FARP.half, z0, x - FARP.half, P.zF, -1, 0); wall(x + FARP.half, z0, x + FARP.half, P.zF, 1, 0); }   // [F5-PIERS]
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------- the five cut walls
// A fragment is absent where its ray from L meets the portal plane within uCone of E: five separate holes that are
// one exact disc from L. Each wall's cone is a step wider than the next one's (GEO.rho), so from L, and only from L,
// the five cut edges are five exact concentric rims, each wall's own tone showing as one thin ring.
const CUT_FRAG = /* glsl */`precision highp float;
  varying vec3 vP, vN; uniform vec3 uL, uE, uPlaster, uSkyL; uniform vec4 uPrev[4]; uniform float uCone, uTone, uTime, uScale, uCham, uCollar, uLitR, uExit, uSea; uniform vec3 uBird[3], uExitCol; uniform vec2 uAx;
  ${NOISE}
  const float SL0=${(GEO.XB - 8).toFixed(1)}, SL1=${(GEO.XE - 64).toFixed(1)};
  void main(){
    vec3 p=vP;
    vec2 b0=vec2(dot(p.xz,uAx)/6., p.y/3.), bfw=fwidth(b0);                              // courses of blocks, 6 m by 3 m: the hole is cut across them
    float keep=1.; for(int i=0;i<4;i++){ keep=min(keep, dot(uPrev[i].xyz,p)+uPrev[i].w); }      // each wall stops at the walls before it
    if(keep<0.) discard;
    vec3 dl=p-uL; float t=(uE.z-uL.z)/max(dl.z,1e-3); vec2 h=uL.xy+dl.xy*t-uE.xy; float rr=length(h);
    float fw=fwidth(rr)+1e-5; float a=smoothstep(uCone-fw*.6, uCone+fw*.6, rr);
    if(dl.z<1e-3) a=1.;
    if(a<.03) discard;
    float e=max(rr-uCone,0.)*(6.3/uCone);
    float occ=1.-.10*exp(-e/2.5);
    vec3 n=normalize(vN+vec3(0.,1e-5,0.));
    float cs=smoothstep(.52,.70, vn(vec2((p.x*.5-p.z*.86-uTime*8.)*.04, (p.x*.86+p.z*.5)*.022+p.y*.02)));   // cloud shade drifting over the skylights: its soft edge crosses each slab
    float day=1.-.70*cs;
    // THE FALL OF DAYLIGHT. The light comes down from beyond the row, toward us: the faces we see are the shade side, lit
    // from the skylights above them (bright at the top, in soft scallops under each slot, falling to shade at the foot);
    // the far faces and the sills of the holes take the light itself.
    float nl=max(dot(n,uSkyL),0.);
    float hy=clamp(p.y/44.,0.,1.);
    float sl=abs(fract((p.x-SL0)/30.)-.5)*30.;
    float scal=exp(-sl*sl/(60.+900.*(1.-hy)))*(1.-smoothstep(SL1-4.,SL1+22.,p.x));              // a scallop under each skylight, spreading as it falls
    // THE TWO WALLS THAT CROSS THE ROOM. From L only a collar of each shows (through the hole before it): the collar keeps the
    // wall's tone, so the five rims are what they were. Outside the collar the face stands in the daylight of the slot above
    // it: the last wall all over, the fourth in a broad pool round the axis that falls away to its dark blue-grey.
    float freeW=smoothstep(uCollar-fw, uCollar+fw, rr)*step(.5,uCollar)*(1.-step(.5,uLitR)*smoothstep(uLitR*.5, max(uLitR,1e-6), length(p.xy-uE.xy)));
    float hs=hy*hy*(3.-2.*hy);
    float fall=mix(mix(.44,.95,hs), mix(.36,1.10,hs), freeW)+.55*scal*hy*day;
    float face=fall*(1.+.32*smoothstep(.5,.9,-n.x)-.08*smoothstep(.5,.9,n.x))+.75*nl*day;      // a fin's free end (1.4 m of it) looks west, straight up into the three slots over the open room: a lit edge, a third brighter than the face so that so narrow an end is told from it
    vec3 tint=mix(vec3(.72,.81,.975), vec3(1.,.992,.965), smoothstep(.2,.85,mix(uTone,.80,freeW)*fall));      // shade is a cool grey (as dark as it was, half as blue), light is plaster white: tone and temperature, no colour of the hall's own
    float foot=1.-.20*exp(-max(p.y,0.)/1.5);
    float dm=max(rr-uCone,0.)*uScale, fwm=fw*uScale;                                       // metres on this wall from its cut edge
    float trowel=.975+.05*vn(p.xy*.23+p.z*.11)+.02*(vn(p.xy*vec2(1.1,4.3))-.5)*(1.-smoothstep(.02,.1,fwm));
    // THE LAST WALL. From L only a collar of it shows (through the hole before): that collar keeps the wall's tone, so the five
    // rims are what they were. Outside the collar the face is plaster in full daylight from the slot above it.
    float T=mix(uTone, .80, freeW)/.80;
    vec3 c=uPlaster*tint*T*occ*face*foot*trowel*(1.-.15*cs);
    vec2 bb=vec2(b0.x+.5*mod(floor(b0.y),2.), b0.y), ba=abs(fract(bb)-.5);
    float bfade=1.-smoothstep(.07,.22,max(bfw.x*2.,bfw.y)); vec2 bw=max(vec2(.007,.014), bfw*.9);
    float bj=max(smoothstep(.5-bw.x-max(bfw.x,1e-6),.5-bw.x,ba.x), smoothstep(.5-bw.y-max(bfw.y,1e-6),.5-bw.y,ba.y))*bfade;      // a joint is never thinner than two pixels
    c*=(1.-.05*bj)*(1.+(h21(floor(bb)+uTone*7.)-.5)*.012*(.3+.7*bfade));        // the five slabs are plain sheets: the joints a breath, no block-to-block tone
    // the cut edge, wide enough to read from the axis: a splay round the hole whose lower arc looks up into the light
    // and whose upper arc looks down, away from it; one ruled line where the splay meets the face
    float sinT=h.y/max(rr,1e-3), low=smoothstep(-.85,.70,-sinT);
    float vis=1.-smoothstep(.30,.80,fwm);
    float ch=(1.-smoothstep(uCham-fwm, uCham+fwm, dm))*vis;
    vec3 splay=uPlaster*mix(vec3(.76,.84,.98)*max(T*.50,.16), vec3(.99,1.,1.02)*max(T*1.9,.80)*(.60+.40*day), low)*trowel;
    c=mix(c, splay, ch);
    float rule=smoothstep(uCham-fwm,uCham,dm)*(1.-smoothstep(uCham+.07,uCham+.07+fwm*1.5,dm))*vis;
    c*=1.-.28*rule;
    c*=1.-.30*step(.5,uCollar)*(1.-smoothstep(0.,.12+fwm*1.5,abs(rr-uCollar)*uScale));     // the collar's edge: one ruled line
    c*=1.-.45*(1.-smoothstep(.05,.05+fwm*1.2,dm))*vis;                                    // the cut itself: one fine dark line, the same all the way round
    float Rh=uCone*uScale, bx=(p.x-(uE.x-.25*Rh))/(Rh*1.25);                              // light thrown up from the lit ellipse at the wall's foot
    float bounce=exp(-max(p.y,0.)/(4.+.5*Rh))*exp(-bx*bx)*day*step(n.z,-.3);
    c+=uPlaster*vec3(.94,.98,1.04)*bounce*(.10+.22*T)*trowel*(1.-uExit);
    // the two last walls stand over flags lit by the way out: its colour comes up their feet, strongest beside the hole
    float ex=abs(p.x-uE.x)/(Rh*2.2);
    c+=uPlaster*uExitCol*uExit*exp(-max(p.y,0.)/7.)*exp(-ex*ex)*(.52+.14*vn(vec2(p.x*.2+uTime*.12, uTime*.08)))*freeW;
    // the swallows' shadows on the lit faces (the slot's light comes down and forward onto them)
    float bsh=0.; const vec3 dW=vec3(.30,-.36,.884);
    for(int i=0;i<3;i++){ vec3 r=p-uBird[i]; float al=dot(r,dW); vec3 pr=r-dW*al; float rad=1.05+.035*max(al,0.);
      bsh=max(bsh, (1.-smoothstep(rad*.35,rad,length(pr)))*step(0.,al)*(1.-smoothstep(14.,30.,al))); }
    c*=1.-.30*bsh;
    // THE WAY OUT'S OWN LIGHT. What comes through the last hole is thrown from wall to wall back up the cone: the face round
    // each hole takes the colour of the sea beyond, deeper wall by wall, moving as light off water moves. No lamp, no glow:
    // each wall keeps its step of tone, so the five rims are the same five rims, now going from white to sea-green.
    float sea=uSea*exp(-e/8.)*(1.-freeW);
    float rip=.86+.28*(vn(h*.16+vec2(uTime*.17,-uTime*.11))*.65+vn(h*.45-vec2(uTime*.23,uTime*.14)+5.)*.35);
    c=mix(c, c*vec3(.50,1.06,.92)*1.55*rip, sea)+uPlaster*uExitCol*(.15*sea*rip);
    gl_FragColor=vec4(c,a);
  }`;
export function cutRadius(i) { return GEO.cone * GEO.rho[i] * (GEO.wallZ[i] - GEO.L[2]) / (GEO.E[2] - GEO.L[2]); }
function buildCutWalls(ctx, U, slants, group) {
  const L = new THREE.Vector3(...GEO.L), E = new THREE.Vector3(...GEO.E), zs = GEO.wallZ, tones = [0.88, 0.60, 0.41, 0.28, 0.19];
  const m4 = new THREE.Matrix4(), e = new THREE.Euler(), nrm = new THREE.Vector3(), walls = [], planes = [];
  const none = new THREE.Vector4(0, 0, 1, 900);
  const ZF = WALL_ZF, ZB = WALL_ZB, lp = [], la = [], li = [], lsea = [];
  for (let i = 0; i < 5; i++) {
    const yaw = slants[i][0] * Math.PI / 180, lean = slants[i][1] * Math.PI / 180;
    // fins 1 to 3 end 2.2 m past their own hole on the side we come from; walls 4 and 5 cross the room
    const seen = i > 0 ? GEO.cone * GEO.rho[i - 1] * (zs[i] - GEO.L[2]) / (GEO.E[2] - GEO.L[2]) + 1.2 : 0;      // what L sees of this wall through the hole before it
    const x0 = i < 3 ? -Math.max(cutRadius(i) + 1.3, seen) / Math.cos(yaw) : -(GEO.E[0] - GEO.XB + 5), x1 = GEO.XE - GEO.E[0] + (i < 3 ? 1 : 14);
    const g = new THREE.BoxGeometry(x1 - x0, 150, ZB - ZF); g.translate((x0 + x1) / 2, 10, (ZB + ZF) / 2);          // a thick partition: its hole has an inside you can see
    e.set(lean, yaw, 0, 'YXZ'); m4.makeRotationFromEuler(e).setPosition(GEO.E[0], 14, zs[i]); g.applyMatrix4(m4);
    nrm.set(0, 0, 1).applyEuler(e);
    const yl = -14 / Math.cos(lean), fa = new THREE.Vector3(x0, yl, 0.25).applyMatrix4(m4), fb = new THREE.Vector3(x1, yl, 0.25).applyMatrix4(m4);
    U.uWN.value[i].set(nrm.x, nrm.y, nrm.z, -(nrm.x * GEO.E[0] + nrm.y * 14 + nrm.z * zs[i]) - ZF);
    U.uWX.value[i].set(Math.cos(yaw), -Math.sin(yaw), GEO.E[0] * Math.cos(yaw) - zs[i] * Math.sin(yaw) + x0, GEO.cone * GEO.rho[i]);
    U.uFin.value[i].set(fa.x, fa.z, fb.x, fb.z);                                             // its foot on the floor, for the hall's contact shade
    const prev = [none, none, none, none];        // the fins stand clear of one another now: nothing to clip (the uniform stays for a slant that would cross)
    const mat = new THREE.ShaderMaterial({
      name: 'pwys-cut', fog: false, alphaToCoverage: true,
      uniforms: { uTime: U.uTime, uPlaster: U.uPlaster, uL: { value: L }, uE: { value: E }, uPrev: { value: prev }, uCone: { value: GEO.cone * GEO.rho[i] }, uTone: { value: tones[i] }, uSkyL: U.uSkyL, uCham: { value: Math.min(1.05, Math.max(0.62, 0.075 * cutRadius(i))) }, uCollar: { value: 0 }, uLitR: { value: 0 }, uExit: { value: 0 }, uSea: { value: 0 }, uAx: { value: new THREE.Vector2(Math.cos(yaw), -Math.sin(yaw)) }, uExitCol: { value: new THREE.Color('#BFE6DC') }, uBird: U.uBird, uScale: { value: (zs[i] - GEO.L[2]) / (GEO.E[2] - GEO.L[2]) } },
      vertexShader: HALL_VERT, fragmentShader: CUT_FRAG,
    });
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; group.add(mesh); walls.push(mesh);
    planes.push(new THREE.Vector4(nrm.x, nrm.y, nrm.z, -(nrm.x * GEO.E[0] + nrm.y * 14 + nrm.z * zs[i]) - 0.3));
    // the reveal of the hole: the strip of the cone from L between the slab's two faces. From L it is exactly edge-on
    // (it has no area there), so the disc stays exact; from anywhere else it shows the wall's thickness as a shaded crescent.
    const inv = m4.clone().invert(), Ll = L.clone().applyMatrix4(inv), Rc = GEO.cone * GEO.rho[i], NS = 64, b0 = lp.length / 3;
    for (let k = 0; k <= NS; k++) {
      const th = k / NS * Math.PI * 2, T = new THREE.Vector3(E.x + Rc * Math.cos(th), E.y + Rc * Math.sin(th), E.z).applyMatrix4(inv), d = T.sub(Ll);
      for (const zf of [ZF, ZB]) { const t = (zf - Ll.z) / d.z, q = new THREE.Vector3().copy(Ll).addScaledVector(d, t).applyMatrix4(m4); lp.push(q.x, q.y, q.z); la.push(Math.sin(th), zf === ZF ? 0 : 1, tones[i]); lsea.push(0, th); }
      if (k < NS) { const a = b0 + k * 2; li.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    // THE SEAM BETWEEN THE FACE'S CUT EDGE AND THE REVEAL IS CLOSED (one rule for all five walls). The face fades out over a pixel at
    // its cut edge, and behind that fading rim the slab is hollow: the far side showed through it as a hairline. So the reveal's front
    // edge is turned in behind the face: a flange 6 cm wide on the wall (wider than the face's fading rim from any place the flight
    // comes near enough to see it), lying 3 cm inside the slab at its outer edge (clear of the face in depth), in the arris's own tone.
    // It lies on a cone from L like the reveal itself and behind the opaque face, so from L it has no area inside the hole.
    const f0 = lp.length / 3, eps = 0.06 / cutRadius(i);
    for (let k = 0; k <= NS; k++) {
      const th = k / NS * Math.PI * 2;
      for (const [sc, zf] of [[1, ZF], [1 + eps, ZF + 0.03]]) {
        const d = new THREE.Vector3(E.x + Rc * sc * Math.cos(th), E.y + Rc * sc * Math.sin(th), E.z).applyMatrix4(inv).sub(Ll), t = (zf - Ll.z) / d.z;
        const q = new THREE.Vector3().copy(Ll).addScaledVector(d, t).applyMatrix4(m4); lp.push(q.x, q.y, q.z); la.push(Math.sin(th), 0, tones[i]); lsea.push(0, th);
      }
      if (k < NS) { const a = f0 + k * 2; li.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
  }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg.setAttribute('aLin', new THREE.Float32BufferAttribute(la, 3)); lg.setAttribute('aSea', new THREE.Float32BufferAttribute(lsea, 2)); lg.setIndex(li);
  const lmat = new THREE.ShaderMaterial({
    name: 'pwys-reveal', fog: false, side: THREE.DoubleSide, uniforms: { uPlaster: U.uPlaster, uTime: U.uTime, uExitCol: { value: new THREE.Color('#BFE6DC') } },
    vertexShader: /* glsl */`attribute vec3 aLin; attribute vec2 aSea; varying vec3 vLin; varying vec2 vSea; void main(){ vLin=aLin; vSea=aSea; gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); }`,
    fragmentShader: /* glsl */`precision highp float; varying vec3 vLin; varying vec2 vSea; uniform vec3 uPlaster, uExitCol; uniform float uTime; ${NOISE}
      void main(){ float up=.5-.5*vLin.x;                                                    // the sill of the hole looks up at the skylights, its head looks down
        // the inside of the hole is a surface 1.4 m deep, lit as the room is: the daylight comes down along (-.36,-.46,-.81), so the sill and the
        // flank that faces +x take it (its share in the wall's own plane is (.616,.788)), the head and the other flank stand in shade
        float sun=max(0., -cos(vSea.y)*.616-vLin.x*.788);
        float t=(.20+.45*up*up+.70*sun)*(1.-.22*vLin.y)*mix(.80,1.,smoothstep(.2,.9,vLin.z));
        t*=1.+.30*(1.-smoothstep(0.,.14,vLin.y))*up;                                         // the arris toward us: a worn edge 0.2 m wide (a seventh of the 1.4 m), lighter where it looks up
        vec3 c=uPlaster*mix(vec3(.74,.82,.98), vec3(1.), up)*t/.80;
        float rip=.70+.60*vn(vec2(vSea.y*5.+uTime*.21, vLin.y*2.-uTime*.13));                   // the sea's light running round the inside of the hole
        c=mix(c, uPlaster*uExitCol*(.62+.75*vLin.y)*rip*1.25, vSea.x*.86);
        gl_FragColor=vec4(c,1.); }`,
  });
  const lining = new THREE.Mesh(lg, lmat); lining.frustumCulled = false; group.add(lining);
  return walls;
}

// ---------------------------------------------------------------- shafts of daylight through the five holes
// The light that makes each hole's ellipse on the flags is shown in the air: an oblique shaft from the hole down to the floor
// (or to the back of the wall before). Its brightness is the exact length of the view ray inside the shaft, worked out
// analytically (the light through a point crossed the wall inside the cone from L that cuts the hole), with striations of
// dust that drift, fading with the cloud shade. Seen from the axis it is absent over the exit disc, so the disc stays exact.
const BEAM_FRAG = /* glsl */`precision highp float;
  varying vec3 vP; uniform vec3 uCamC, uSkyL, uLP, uE; uniform vec4 uPl, uPrevPl; uniform vec4 uWN[5], uWX[5]; uniform float uRc, uK, uTime, uGain, uCone0; ${NOISE}
  void main(){
    vec3 V=vP-uCamC; float sF=length(V); V/=max(sF,1e-3);
    float nl=max(dot(uPl.xyz,uSkyL),.05);
    float t0=-(dot(uPl.xyz,uCamC)+uPl.w)/nl, t1=-dot(uPl.xyz,V)/nl;                        // metres downstream of the wall along the light: t0+t1*s
    vec3 a=uCamC+uSkyL*t0-uLP, b=V+uSkyL*t1;                                              // where that light crossed the wall, seen from L: a+b*s
    float K=uE.z-uLP.z, K2=K*K, R2=uRc*uRc;
    float A=K2*dot(b.xy,b.xy)-R2*b.z*b.z, B=K2*dot(a.xy,b.xy)-R2*a.z*b.z, C=K2*dot(a.xy,a.xy)-R2*a.z*a.z;
    float dq=B*B-A*C; if(dq<=0. || A<1e-6) discard;
    float sq=sqrt(max(dq,0.)), s0=max((-B-sq)/A,0.), s1=min((-B+sq)/A, sF+.5);
    if(abs(t1)>1e-5){ float sc=-t0/t1; if(t1>0.) s0=max(s0,sc); else s1=min(s1,sc); } else if(t0<0.) discard;      // downstream of its wall
    if(abs(V.y)>1e-5){ float sc=-uCamC.y/V.y; if(V.y>0.) s0=max(s0,sc); else s1=min(s1,sc); }                      // above the flags
    float pd=dot(uPrevPl.xyz,V), p0=dot(uPrevPl.xyz,uCamC)+uPrevPl.w;                                               // short of the wall before
    if(abs(pd)>1e-5){ float sc=-p0/pd; if(pd>0.) s0=max(s0,sc); else s1=min(s1,sc); } else if(p0<0.) discard;
    float camW=1.-smoothstep(1.5,9.,length(uCamC.xy-uE.xy));                              // 1 when the eye is on the axis of the cone
    float sMid=clamp(-B/A, 0., sF); vec3 hq=a+b*sMid; float rmin=K*length(hq.xy)/max(hq.z,1e-2);   // how near the shaft's axis this view ray passes
    float feather=1.-smoothstep(.62,1.,rmin/uRc);                                         // the shaft has no ruled edge: it thins to nothing at its sides
    float sNear=9.+9.*camW; float len=s1-s0; if(len<=0.) discard;
    len*=smoothstep(sNear, sNear+14., .5*(s0+s1));                                        // the air right round the eye is clear: no veil while we fly through a shaft
    // A SHAFT IS NEVER DRAWN OVER A HOLE, from any eye point: where this view ray goes on (or came) through the hole of any
    // of the five walls it shows nothing, so every opening stays an opening and the piece of the next world keeps its colour
    float thr=1.;
    for(int j=0;j<5;j++){ float dn=dot(uWN[j].xyz,V); dn=abs(dn)<1e-4?1e-4:dn; float sj=-(dot(uWN[j].xyz,uCamC)+uWN[j].w)/dn;
      vec3 hj=uCamC+V*sj-uLP; float rj=K*length(hj.xy)/max(hj.z,1e-2);
      thr*=mix(1., smoothstep(uWX[j].w*1.02, uWX[j].w*1.30, rj), step(0.,sj)); }
    float sm=.5*(s0+s1), tm=t0+t1*sm; vec3 pm=uCamC+V*sm, hm=pm+uSkyL*tm; vec2 hc=hm.xy-uE.xy;
    float ray=vn(hc*.55+vec2(uTime*.045,3.))*.55+vn(hc*1.7-vec2(7.,uTime*.07))*.45;                               // dust in the light: striations along the shaft, drifting
    float cs=smoothstep(.52,.70, vn(vec2((pm.x*.5-pm.z*.86-uTime*8.)*.04, (pm.x*.86+pm.z*.5)*.022)));             // the same cloud shade as the floor
    float dens=(1.-exp(-len*.050))*mix(.50+.85*ray, .80+.25*ray, camW)*(1.-.75*cs)*exp(-max(tm,0.)/70.)*(1.-.35*camW);
    float ez=max(uE.z-uCamC.z,1.), vz=max(V.z,1e-3); vec2 eh=uCamC.xy+V.xy*(ez/vz)-uE.xy;                          // where this view ray meets the plane of the exit
    float guard=mix(1., smoothstep(uRc*.97,uRc*1.25,length(eh))*step(1e-3,V.z), camW);
    gl_FragColor=vec4(vec3(.90,.955,1.04)*uGain*dens*guard*thr*feather*uK, 1.);          // cool daylight: nothing in the hall has colour
  }`;
function buildBeams(U, slants, group, camC) {
  const L = new THREE.Vector3(...GEO.L), E = new THREE.Vector3(...GEO.E), zs = GEO.wallZ, Lu = U.uSkyL.value, ZF = WALL_ZF, ZB = WALL_ZB, NS = 48;
  const m4 = new THREE.Matrix4(), e = new THREE.Euler(), n = new THREE.Vector3(), nPrev = new THREE.Vector3(), tri = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], ab = new THREE.Vector3(), ac = new THREE.Vector3();
  const meshes = []; let prevPl = new THREE.Vector4(0, 0, 0, 1);
  for (let i = 0; i < 5; i++) {
    e.set(slants[i][1] * Math.PI / 180, slants[i][0] * Math.PI / 180, 0, 'YXZ'); m4.makeRotationFromEuler(e).setPosition(GEO.E[0], 14, zs[i]);
    n.set(0, 0, 1).applyEuler(e);
    const inv = m4.clone().invert(), Ll = L.clone().applyMatrix4(inv), Rc = GEO.cone * GEO.rho[i], rim = [], end = [], cQ = new THREE.Vector3(), cE = new THREE.Vector3();
    for (let k = 0; k < NS; k++) {
      const th = k / NS * Math.PI * 2, d = new THREE.Vector3(E.x + Rc * 1.03 * Math.cos(th), E.y + Rc * 1.03 * Math.sin(th), E.z).applyMatrix4(inv).sub(Ll);
      const q = new THREE.Vector3().copy(Ll).addScaledVector(d, (ZF - 0.07 - Ll.z) / d.z).applyMatrix4(m4);
      let t = (q.y - 0.05) / Lu.y;                                                           // down to the flags...
      if (i > 0) t = Math.min(t, (nPrev.x * (q.x - GEO.E[0]) + nPrev.y * (q.y - 14) + nPrev.z * (q.z - zs[i - 1]) - (ZB + 0.07)) / nPrev.dot(Lu));   // ...or to the back of the wall before
      rim.push(q); end.push(new THREE.Vector3().copy(q).addScaledVector(Lu, -Math.max(t, 0.01))); cQ.add(q); cE.add(end[k]);
    }
    cQ.multiplyScalar(1 / NS); cE.multiplyScalar(1 / NS); const mid = new THREE.Vector3().addVectors(cQ, cE).multiplyScalar(0.5), pos = [];
    const put = (p0, p1, p2) => {                                                            // every face wound outward from the middle of the shaft
      ab.subVectors(p1, p0); ac.subVectors(p2, p0); ab.cross(ac); tri[0].copy(p0).sub(mid);
      const o = ab.dot(tri[0]) < 0 ? [p0, p2, p1] : [p0, p1, p2]; for (const p of o) pos.push(p.x, p.y, p.z);
    };
    for (let k = 0; k < NS; k++) { const j = (k + 1) % NS; put(rim[k], rim[j], end[k]); put(rim[j], end[j], end[k]); put(cQ, rim[k], rim[j]); put(cE, end[k], end[j]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const mat = new THREE.ShaderMaterial({
      name: 'pwys-beam', fog: false, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uCamC: { value: camC }, uSkyL: U.uSkyL, uLP: { value: L }, uE: { value: E }, uPl: { value: U.uWN.value[i] }, uPrevPl: { value: prevPl }, uWN: U.uWN, uWX: U.uWX, uRc: { value: Rc }, uK: U.uK, uTime: U.uTime, uGain: { value: 0.70 }, uCone0: { value: GEO.cone } },
      vertexShader: HALL_VERT, fragmentShader: BEAM_FRAG,
    });
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3; group.add(mesh); meshes.push(mesh);
    nPrev.copy(n); prevPl = new THREE.Vector4(n.x, n.y, n.z, -(n.x * GEO.E[0] + n.y * 14 + n.z * zs[i]) - ZB);
  }
  return meshes;
}

// ---------------------------------------------------------------- curtains of daylight under the skylight slots
// The light that lays the bars on the flags and the far wall is shown in the air: under each slot hangs a slanted sheet of
// lit dust, 6 m thick. Its brightness is the exact length of the view ray inside the sheet (a box in coordinates sheared
// along the light), weighted by a soft profile across it so it has no ruled face; striations drift along it and it fades
// with the cloud shade. Like the shafts it is never drawn where the view ray threads a hole, and the air round the eye is clear.
const SHEET_FRAG = /* glsl */`precision highp float;
  varying vec3 vP; uniform vec3 uCamC, uSkyL, uLP, uE; uniform vec4 uWN[5], uWX[5], uSlot; uniform float uK, uTime, uGain; ${NOISE}
  void main(){
    vec3 V=vP-uCamC; float sF=length(V); V/=max(sF,1e-3);
    float kx=uSkyL.x/uSkyL.y, kz=uSkyL.z/uSkyL.y, CY=${GEO.ceil.toFixed(1)}; const float XB4=${GEO.XB.toFixed(1)};
    float ax=uCamC.x+(CY-uCamC.y)*kx-uSlot.x, bx=V.x-V.y*kx, az=uCamC.z+(CY-uCamC.y)*kz, bz=V.z-V.y*kz;      // where the light through a point of the view ray left the ceiling
    float s0=0., s1=sF;
    if(abs(bx)>1e-5){ float ta=(-uSlot.y-ax)/bx, tb=(uSlot.y-ax)/bx; s0=max(s0,min(ta,tb)); s1=min(s1,max(ta,tb)); } else if(abs(ax)>uSlot.y) discard;
    if(abs(bz)>1e-5){ float ta=(uSlot.z-az)/bz, tb=(uSlot.w-az)/bz; s0=max(s0,min(ta,tb)); s1=min(s1,max(ta,tb)); } else if(az<uSlot.z || az>uSlot.w) discard;
    if(abs(V.y)>1e-5){ float ta=-uCamC.y/V.y, tb=(CY-uCamC.y)/V.y; s0=max(s0,min(ta,tb)); s1=min(s1,max(ta,tb)); }
    if(abs(V.x)>1e-5){ float tc=(73.-uCamC.x)/V.x; if(V.x>0.) s0=max(s0,tc); else s1=min(s1,tc); } else if(uCamC.x<73.) discard;   // only in arm two: never in the air in front of the paint
    float len=s1-s0; if(len<=0.) discard;
    float d0=(ax+bx*s0)/uSlot.y, d1=(ax+bx*s1)/uSlot.y;
    float I=len*max(1.-(d0*d0+d0*d1+d1*d1)/3., 0.);                                         // the ray's length in the sheet, weighted by a parabola across it
    float sm=.5*(s0+s1); vec3 pm=uCamC+V*sm; float zs=az+bz*sm, xs=ax+bx*sm;
    float ends=smoothstep(uSlot.z,uSlot.z+9.,zs)*(1.-smoothstep(uSlot.w-9.,uSlot.w,zs));
    float ray=vn(vec2(zs*.21+uTime*.035, xs*.5+uSlot.x))*.6+vn(vec2(zs*.63-uTime*.05, xs*1.3+7.))*.4;      // dust: striations along the light, drifting
    float cs=smoothstep(.52,.70, vn(vec2((pm.x*.5-pm.z*.86-uTime*8.)*.04, (pm.x*.86+pm.z*.5)*.022)));
    float dens=.55*(1.-exp(-I*.160))*(.15+1.50*ray*ray)*(1.-.75*cs)*ends*smoothstep(5.,26.,sm)*(.50+.50*smoothstep(0.,36.,pm.y))*smoothstep(73.,90.,pm.x);
    float K=uE.z-uLP.z, thr=1.;
    for(int j=0;j<5;j++){ float dn=dot(uWN[j].xyz,V); dn=abs(dn)<1e-4?1e-4:dn; float sj=-(dot(uWN[j].xyz,uCamC)+uWN[j].w)/dn;
      vec3 hj=uCamC+V*sj-uLP; float rj=K*length(hj.xy)/max(hj.z,1e-2);
      thr*=mix(1., smoothstep(uWX[j].w*1.02, uWX[j].w*1.30, rj), step(0.,sj));
      if(j==3){ vec3 hw=uCamC+V*sj; thr*=1.-.85*step(0.,sj)*step(hw.y,CY)*step(0.,hw.y)*step(XB4,hw.x); } }      // nothing veils the dark far wall: it stays the darkest thing in the room
    gl_FragColor=vec4(vec3(.90,.955,1.04)*uGain*dens*thr*uK, 1.);
  }`;
function buildSheets(U, group, camC) {
  const Lu = U.uSkyL.value, kx = Lu.x / Lu.y, kz = Lu.z / Lu.y, C = GEO.ceil, ZW = -349.7, Y0 = 0.06, hw = 3, meshes = [];
  for (let k = 0; k < 5; k++) {
    const xc = GEO.XB - 8 + 15 + 30 * k, z0 = -340, z1 = xc > 170 ? -256 : -186;         // the two slots over the fins light only the air south of the first fin
    // the sheet's section in (y, z): from the slot down along the light to the flags, cut off by the far wall
    const yE = C - (z0 - ZW) / kz, sec = [[C, z0], [C, z1], [Y0, z1 - (C - Y0) * kz], [Y0, ZW], [yE, ZW]];
    const v = [], pos = [], mid = new THREE.Vector3();
    for (const sgn of [-1, 1]) for (const [y, z] of sec) { const p = new THREE.Vector3(xc + sgn * (hw + 0.05) - (C - y) * kx, y, z); v.push(p); mid.add(p); }
    mid.multiplyScalar(1 / v.length);
    const ab = new THREE.Vector3(), ac = new THREE.Vector3(), t = new THREE.Vector3();
    const put = (a, b, c) => { ab.subVectors(b, a); ac.subVectors(c, a); ab.cross(ac); t.copy(a).sub(mid); const o = ab.dot(t) < 0 ? [a, c, b] : [a, b, c]; for (const p of o) pos.push(p.x, p.y, p.z); };
    for (let i = 1; i < 4; i++) { put(v[0], v[i], v[i + 1]); put(v[5], v[5 + i], v[5 + i + 1]); }
    for (let i = 0; i < 5; i++) { const j = (i + 1) % 5; put(v[i], v[j], v[5 + i]); put(v[j], v[5 + j], v[5 + i]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const mat = new THREE.ShaderMaterial({
      name: 'pwys-sheet', fog: false, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uCamC: { value: camC }, uSkyL: U.uSkyL, uLP: { value: new THREE.Vector3(...GEO.L) }, uE: { value: new THREE.Vector3(...GEO.E) }, uWN: U.uWN, uWX: U.uWX, uSlot: { value: new THREE.Vector4(xc, hw, z0, z1) }, uK: U.uK, uTime: U.uTime, uGain: { value: 0.46 } },
      vertexShader: HALL_VERT, fragmentShader: SHEET_FRAG,
    });
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3; group.add(mesh); meshes.push(mesh);
  }
  return meshes;
}

// ---------------------------------------------------------------- three living swallows (the only solid things in the air)
function buildBirds(ctx, U, group) {
  const pos = [0, 0, -0.16, 0.035, 0.02, 0, -0.035, 0.02, 0, 0, -0.03, 0, 0, 0, 0.2,
    0.03, 0.01, -0.06, 0.2, 0.01, 0.0, 0.03, 0.01, 0.06, 0.375, 0.01, 0.1,
    -0.03, 0.01, -0.06, -0.2, 0.01, 0.0, -0.03, 0.01, 0.06, -0.375, 0.01, 0.1];
  const wing = [0, 0, 0, 0, 0, 0, 0.5, 0, 1, 0, 0.5, 0, 1];
  const idx = [0, 1, 2, 0, 2, 3, 0, 3, 1, 4, 2, 1, 4, 3, 2, 4, 1, 3, 5, 6, 7, 6, 8, 7, 9, 11, 10, 10, 11, 12];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aWing', new THREE.Float32BufferAttribute(wing, 1)); g.setIndex(idx);
  const birds = [];
  for (let i = 0; i < 3; i++) {
    const mat = new THREE.ShaderMaterial({
      name: 'pwys-bird', fog: false, side: THREE.DoubleSide, uniforms: { uTime: U.uTime, uPhase: { value: i * 2.1 } },
      vertexShader: /* glsl */`attribute float aWing; uniform float uTime, uPhase; varying float vY;
        void main(){ vec3 p=position*1.5; float f=sin(uTime*17.+uPhase)*smoothstep(-.2,.3,sin(uTime*1.3+uPhase*2.));
          p.y+=aWing*(.16*f+.03); p.x*=1.-.18*aWing*abs(f); vY=aWing;
          gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(p,1.); }`,
      fragmentShader: /* glsl */`precision highp float; varying float vY;
        void main(){ gl_FragColor=vec4(mix(vec3(.05,.06,.09), vec3(.10,.12,.16), vY),1.); }`,
    });
    const m = new THREE.Mesh(g, mat); m.frustumCulled = false; group.add(m); birds.push(m);
  }
  return birds;
}

// ---------------------------------------------------------------- the device
export async function buildDevice(ctx, opts) {
  const { P, scene, path } = opts, mx = opts.mirror ? -1 : 1, uStopAt = (opts.stopU ?? 0.23) * (opts.uK ?? 1), detail = opts.detail ?? ctx.quality?.detail ?? 1, mobile = !!ctx.quality?.mobile;
  const root = new THREE.Group(); root.name = 'pwys-root'; root.scale.x = mx; root.updateMatrixWorld(true);
  const valley = new THREE.Group(), hall = new THREE.Group(), birdsG = new THREE.Group(); root.add(valley, hall, birdsG);
  const sun = new THREE.Vector3(...P.sunDir).normalize();
  const U = {
    uSun: { value: sun }, uSunCol: { value: new THREE.Color(P.sunCol).multiplyScalar(P.sunPower) }, uFill: { value: new THREE.Color(P.fill).multiplyScalar(P.fillPower) },
    uShadow: { value: new THREE.Color(P.shadow) }, uHaze: { value: new THREE.Color(P.haze) }, uEye: { value: new THREE.Vector3(...GEO.S) },
    uTime: { value: 0 }, uHazeK: { value: P.hazeK }, uFront: { value: -72 },
  };
  const shape = valleyShape(ctx.noise);
  const lit = await makeShadow(ctx, shape, sun); await ctx.yield();
  const trees = await buildTrees(ctx, shape, P, U, valley, Math.round(2600 * detail * Math.min(opts.density ?? 1, 1.1) * (P.treeKind === 'fir' || !P.treeKind ? 1 : 0.8)), lit, mx); await ctx.yield();
  const terrainMat = await buildTerrain(ctx, shape, P, U, valley, (x, y, z) => lit(x, y, z) * (y < 40 ? trees.shade(x, z) : 1)); await ctx.yield();
  if (P.boulders) { buildBoulders(ctx, shape, P, valley, terrainMat, lit); await ctx.yield(); }
  buildRiver(ctx, shape, P, U, valley, lit);
  if (P.leafFall) buildLeafFall(ctx, P, U, valley, detail);
  buildMist(P, U, valley);
  const sky = buildSky(ctx, P, U, valley); await ctx.yield();

  // the target the valley is drawn into, and the station's camera
  const size = new THREE.Vector2(); ctx.renderer.getDrawingBufferSize(size);
  const rtScale = mobile ? 1 : 1.5;
  const rtFor = (w) => Math.min(mobile ? rtScale : Math.max(rtScale, 1700 / Math.max(w, 1)), 2400 / Math.max(w, 1));
  const rtS0 = rtFor(size.x);
  const rt = new THREE.WebGLRenderTarget(Math.max(8, Math.round(size.x * rtS0)), Math.max(8, Math.round(size.y * rtS0)), {
    type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false, depthBuffer: true, samples: mobile ? 0 : 4,
  });
  const WIDEN = 1.4;
  const valleyCam = new THREE.PerspectiveCamera(62, ctx.aspect || 16 / 9, 0.3, 2600); valleyCam.layers.set(LAYER_VALLEY);
  valleyCam.position.set(GEO.S[0] * mx, GEO.S[1], GEO.S[2]); valleyCam.updateMatrixWorld(true); valleyCam.updateProjectionMatrix();
  valleyCam.projectionMatrix.elements[0] /= WIDEN; valleyCam.projectionMatrix.elements[5] /= WIDEN; valleyCam.projectionMatrixInverse.copy(valleyCam.projectionMatrix).invert();
  const station = { saved: false, pos: new THREE.Vector3(), quat: new THREE.Quaternion(), proj: new THREE.Matrix4() };

  const camC = new THREE.Vector3(0, 10, 0);                                         // the eye in canonical space (for the shafts and the honed floor)
  const HU = {
    uCamC: { value: camC },
    uK: { value: 0 }, uTime: U.uTime, uPlaster: { value: new THREE.Color('#F2EFE8').multiplyScalar(0.72) }, uFlag: { value: new THREE.Color('#C9C2B4').multiplyScalar(0.78) },
    uDay: { value: new THREE.Vector3(-0.40, -0.42, -0.81).normalize() }, uMouth: { value: new THREE.Vector3(95, 34, -315) },
    uBird: { value: [new THREE.Vector3(0, -99, 0), new THREE.Vector3(0, -99, 0), new THREE.Vector3(0, -99, 0)] },
    uBirdV: { value: [new THREE.Vector3(1, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(1, 0, 0)] },
    uShR: { value: 0.8 },                         // the corner swallow's shadow is drawn large only while it crosses the ring
    uFin: { value: Array.from({ length: 5 }, () => new THREE.Vector4(0, 900, 1, 900)) },
    uWN: { value: Array.from({ length: 5 }, () => new THREE.Vector4(0, 0, 1, 900)) }, uWX: { value: Array.from({ length: 5 }, () => new THREE.Vector4(1, 0, 9000, 1)) },
    uWT: { value: [0.88, 0.60, 0.41, 0.28, 0.19] },
    uSkyL: { value: new THREE.Vector3(0.36, 0.46, 0.81).normalize() },             // up into the daylight: it comes down from beyond the row of cut walls, toward the way we arrive
  };
  const PU = {
    ...HU, tPaint: { value: rt.texture }, uProj: { value: new THREE.Matrix4() }, uO: { value: new THREE.Vector3(...GEO.S) },
    uRingCol: { value: new THREE.Color(P.ring) }, uSea1: { value: new THREE.Color(P.sea1) }, uSea2: { value: new THREE.Color(P.sea2) },
    uFallCol: { value: new THREE.Color(P.fall) }, uSwiftCol: { value: new THREE.Color(P.swift) },
    uRing: { value: new THREE.Vector4(...GEO.ring) }, uPA: { value: new THREE.Vector4(PIER_A.cx, PIER_A.cz, PIER_A.hx, PIER_A.hz) },
    uPB: { value: new THREE.Vector4(PIER_B.cx, PIER_B.cz, PIER_B.hx, PIER_B.hz) }, uPBrot: { value: new THREE.Vector4(wOut[0], wOut[1], wDir[0], wDir[1]) },
    uSwift: { value: Array.from({ length: 7 }, () => new THREE.Vector4(0, 20, -190, 0.6)) }, uSwiftV: { value: Array.from({ length: 7 }, () => new THREE.Vector3(1, 0, 0)) },
    uFallZ: { value: GEO.fallZ }, uBrush: { value: 0.8 }, uStop: { value: 0 },
  };
  if (LEE_STAIR) { const sp = stairPlan(); PU.uStair = { value: new THREE.Vector2(sp.zA, sp.D) }; }                                   // [F5-STAIR]
  if (FAR_PIERS) { const fp = farPierPlan(); PU.uFarP = { value: new THREE.Vector2(fp.xs[0], fp.xs[fp.xs.length - 1]) }; }          // [F5-PIERS]
  const hallMat = new THREE.ShaderMaterial({ name: 'pwys-hall', fog: false, uniforms: PU, vertexShader: HALL_VERT, fragmentShader: HALL_FRAG });
  const hallMesh = new THREE.Mesh(hallGeometry(), hallMat); hallMesh.frustumCulled = false; hall.add(hallMesh);
  const walls = buildCutWalls(ctx, HU, opts.slants, hall);
  const beams = buildBeams(HU, opts.slants, hall, camC), sheets = buildSheets(HU, hall, camC);          // camC: the eye in canonical space, for the shafts
  const birds = buildBirds(ctx, U, birdsG); if (opts.rare) birds[2].scale.setScalar(1.6);
  await ctx.yield();

  // swifts: seven closed loops 30 to 80 m beyond S
  const srng = ctx.rng.fork('pwys-swifts'), loops = [];
  for (let i = 0; i < 7; i++) loops.push({ c: [srng.range(-16, 16), srng.range(9, 24), GEO.S[2] - srng.range(34, 76)], r: [srng.range(7, 15), srng.range(1.5, 4.5), srng.range(4, 9)], w: srng.range(0.45, 0.8) * (srng.chance(0.5) ? 1 : -1), ph: srng.range(0, 6.283), tilt: srng.range(0.6, 1.6) });
  const loopAt = (l, t, out) => { const a = l.ph + t * l.w; return out.set(l.c[0] + l.r[0] * Math.cos(a), l.c[1] + l.r[1] * Math.sin(a * 2 + l.tilt), l.c[2] + l.r[2] * Math.sin(a)); };
  const birdLoops = [{ c: [30, 20, -226], r: [20, 4, 32], w: 0.42, ph: 1 }, { c: [122, 22, -306], r: [34, 5, 14], w: -0.5, ph: 2.2 }, { c: [104, 20, -250], r: [12, 5, 22], w: 0.62, ph: 4 }];
  const birdAt = (l, t, out) => { const a = l.ph + t * l.w; return out.set(l.c[0] + l.r[0] * Math.cos(a), l.c[1] + l.r[1] * Math.sin(a * 2), l.c[2] + l.r[2] * Math.sin(a)); };
  const crossP = path.pointAt((uStopAt + 0.02) / (opts.uK ?? 1), new THREE.Vector3()); crossP.x *= mx;                // canonical
  const gaze = new THREE.Vector3(GEO.H[0] - crossP.x, 0, GEO.H[2] - crossP.z).normalize(), right = new THREE.Vector3(-gaze.z, 0, gaze.x);
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _m = new THREE.Matrix4(), _s = new THREE.Vector2(), _q = new THREE.Quaternion(), _sc = new THREE.Vector3(), _q3 = new THREE.Vector3();
  const stats = { triangles: 0, calls: 0, trees: trees.count };
  const smooth = (a, b, x) => sstep(a, b, x);

  const UK = opts.uK ?? 1;                             // act one's moments are keyed to the first route's u (see the world file): UK turns today's u into that one
  function update(dt, time, camera, uNow, renderer) {
    const u = uNow * UK;
    U.uTime.value = time;
    U.uFront.value = -72 - 345 * smooth(0, 0.20, u) - 700 * smooth(0.20, 0.5, u);          // the cloud's shadow goes up the valley ahead of us and off over the ridge
    camC.setFromMatrixPosition(camera.matrixWorld); camC.x *= mx;
    const k = smooth(uStopAt, uStopAt + 0.016, u), carried = u < uStopAt;
    PU.uK.value = k; PU.uStop.value = carried ? 0 : 1;
    // ---- painted swifts
    for (let i = 0; i < 7; i++) { loopAt(loops[i], time, _a); loopAt(loops[i], time + 0.05, _b); PU.uSwift.value[i].set(_a.x, _a.y, _a.z, 0.6); PU.uSwiftV.value[i].copy(_b).sub(_a).normalize(); }
    // ---- living swallows
    birdsG.visible = !carried;
    let rareRoll = 0, bank2 = 0;
    for (let i = 0; i < 3; i++) {
      birdAt(birdLoops[i], time, _a); birdAt(birdLoops[i], time + 0.06, _b);
      if (i === 0) {                                                                    // the one that crosses 6 m ahead at the turn
        const w = 1 - smooth(uStopAt + 0.045, uStopAt + 0.085, u), lat = (u - (uStopAt + 0.02)) / 0.016 * 14;
        _c.copy(crossP).addScaledVector(gaze, 6 + Math.max(0, lat) * 0.5).addScaledVector(right, lat); _c.y += -0.6 + 0.02 * lat;
        _a.lerp(_c, w); _b.lerp(_c.addScaledVector(right, 1).addScaledVector(gaze, 0.5), w);
        // ...and again abeam of pier B: out of the bare gap behind the pier and across its white face, its shadow on the bare floor
        const w2 = smooth(0.335, 0.365, u) * (1 - smooth(0.455, 0.49, u)), tb = (u - 0.345) / 0.11, sway = Math.sin(time * 1.9);
        _c.set(lerp(7, 23, tb) + 1.2 * sway, lerp(15.5, 10.5, tb) + 0.5 * Math.sin(time * 2.7), lerp(-322, -258, tb));
        _a.lerp(_c, w2); _b.lerp(_c.set(_c.x + 0.25, _c.y - 0.05, _c.z + 1), w2);
      }
      if (i === 1) {                                                                    // the one whose shadow crosses the ring and breaks at the corner
        const w = smooth(uStopAt - 0.004, uStopAt + 0.008, u) * (1 - smooth(uStopAt + 0.07, uStopAt + 0.11, u)), lat = Math.min(30, Math.max(-6, (uStopAt + 0.0445 - u) / 0.03 * 6));
        HU.uShR.value = 0.8 + 1.9 * w;
        _c.set(3.9 + lat, 18.4 + 0.03 * lat + 0.25 * Math.sin(time * 2.3), -250.6 + Math.abs(lat) * 0.15); _a.lerp(_c, w); _b.lerp(_c.set(_c.x - 1, _c.y, _c.z + (lat < -2 ? 0.8 : 0)), w);
      }
      if (i === 2) {                                                                    // it leads us round the corner into the room of the cut walls, 12 m ahead, then goes on toward the row
        const w3 = smooth(0.455, 0.49, uNow) * (1 - smooth(0.53, 0.565, uNow));
        birds[2].scale.setScalar((opts.rare ? 1.6 : 1) * (1 + 0.6 * smooth(0.455, 0.49, uNow))); bank2 = 1 - w3;                 // near enough, and large enough, to be a bird and not a speck
        if (w3 > 0) {
          // it wheels in a tight banked circle that moves on ahead of us, so we see its back on the far side of each turn and its belly on the near side
          const lead = 0.0125 + 0.05 * smooth(0.56, 0.66, uNow), an = time * 1.5, R = 2.8;
          path.pointAt(Math.min(1, uNow + lead), _c); _c.x *= mx; _c.y -= 1.7;
          _q3.set(_c.x + R * Math.cos(an + 0.07), _c.y + 0.9 * Math.sin(an + 1.07), _c.z + R * Math.sin(an + 0.07));
          _c.set(_c.x + R * Math.cos(an), _c.y + 0.9 * Math.sin(an + 1), _c.z + R * Math.sin(an));
          _a.lerp(_c, w3); _b.lerp(_q3, w3); rareRoll = w3 * 1.05;
        }
      }
      if (i === 2 && opts.rare) {                                                       // rare: a swallow threads the five holes 11 m ahead of us and leaves through the disc first
        const uL = (opts.uL ?? 0.81) * UK, w = smooth(uL - 0.07, uL - 0.015, u);
        path.pointAt(uNow + 0.015, _c); _c.x *= mx; path.pointAt(uNow + 0.017, _q3); _q3.x *= mx;
        // it flies 9 m ahead and a little below our line, swinging from side to side, so we look down on its back and wings
        const wx = 1.7 * Math.cos(time * 1.3), wy = -2.8 + 1.0 * Math.sin(time * 1.9);
        _c.x += wx; _c.y += wy; _q3.x += wx - 0.9 * Math.sin(time * 1.3); _q3.y += wy + 0.95 * Math.cos(time * 1.9);      // it swoops: on each dip we see its back and both wings, not an edge
        _a.lerp(_c, w); _b.lerp(_q3, w); rareRoll = -w * 0.6 * Math.sin(time * 1.3); bank2 *= 1 - w;        // it banks from side to side, so from behind we see its whole shape
      }
      let roll = i === 2 ? rareRoll : 0;
      if (i < 2) {
        // along the row the two everyday swallows wheel over the lit flags in front of the white slabs, a good way off and well
        // to the side of the holes (never in the cone: only the rare one threads it); before L they drift off along the first slab
        const wc = i === 1 ? smooth(0.575, 0.615, uNow) : smooth(0.60, 0.65, uNow);
        if (wc > 0) {
          path.pointAt(Math.min(uNow, 0.75), _c); _c.x *= mx;                                  // the anchor stops short of L: they stay outside the row
          const fx = GEO.E[0] - _c.x, fz = -251 - _c.z, fl = Math.max(Math.hypot(fx, fz), 1e-3), ahead = 25 - 5 * i, lat = 13 + 5 * i + 42 * smooth(0.715, 0.755, uNow);
          const cx = _c.x + fx / fl * ahead + fz / fl * lat, cz = _c.z + fz / fl * ahead - fx / fl * lat, cy = 10.5 + 5.5 * i;
          const a0 = time * (i === 0 ? 0.8 : -0.95) + i * 2.3, a1 = a0 + (i === 0 ? 0.06 : -0.06), R = 4.2 - i;
          _c.set(cx + R * Math.cos(a0), cy + 1.3 * Math.sin(a0 * 2 + i), cz + R * Math.sin(a0));
          _q3.set(cx + R * Math.cos(a1), cy + 1.3 * Math.sin(a1 * 2 + i), cz + R * Math.sin(a1));
          _a.lerp(_c, wc); _b.lerp(_q3, wc);
        }
        birds[i].scale.setScalar(Math.max(SPAN_FLOOR, 1 + 0.9 * wc));      // [F5-SPAN] live's scale with one floor under it: as large as its shadow all flight (SPAN_FLOOR is 1 with the switch off: live's line)
        // banked hard into the turn: its back is turned to us, so from the axis we see wings and tail, not an edge
        bank2 = wc;
      }
      {
        // banked hard into the turn: its back is turned to us, so we see wings and tail, not an edge (a dash)
        _q3.set(camC.x - _a.x, camC.y - _a.y, camC.z - _a.z).normalize().multiplyScalar(0.9 * bank2); _q3.y += 1 - 0.55 * bank2;      // canonical: the root mirrors it with the bird
        birds[i].up.copy(_q3).normalize();
      }
      // In a mirrored hall the parent is a reflection: lookAt then leaves a quaternion that is not unit (the bird was squashed to a
      // sliver) and turns the bird by the mirror of what it was given. So the heading is handed over in canonical terms and the result made unit.
      birds[i].position.copy(_a); birds[i].lookAt(_c.copy(_a).applyMatrix4(root.matrixWorld).add(_q3.copy(_b).sub(_a))); birds[i].quaternion.normalize(); if (roll !== 0) birds[i].rotateZ(roll); HU.uBird.value[i].copy(_a); _b.sub(_a); if (_b.lengthSq() > 1e-8) HU.uBirdV.value[i].copy(_b).normalize();
    }
    // ---- the station: carried with the camera until the stop, then left where it was
    if (carried) {
      camera.matrixWorld.decompose(valleyCam.position, valleyCam.quaternion, _sc);
      valleyCam.projectionMatrix.copy(camera.projectionMatrix); valleyCam.projectionMatrix.elements[0] /= WIDEN; valleyCam.projectionMatrix.elements[5] /= WIDEN;
      valleyCam.projectionMatrixInverse.copy(valleyCam.projectionMatrix).invert();
      if (u > 0) { station.saved = true; station.u = u; station.pos.copy(valleyCam.position); station.quat.copy(valleyCam.quaternion); station.proj.copy(valleyCam.projectionMatrix); }
    } else if (station.saved && uStopAt - station.u < 0.02) {          // the pose of the last carried frame; after a seek, S itself
      valleyCam.position.copy(station.pos); valleyCam.quaternion.copy(station.quat); valleyCam.projectionMatrix.copy(station.proj); valleyCam.projectionMatrixInverse.copy(station.proj).invert();
    } else { valleyCam.position.set(GEO.S[0] * mx, GEO.S[1], GEO.S[2]); valleyCam.quaternion.identity(); valleyCam.projectionMatrix.copy(presetProj); valleyCam.projectionMatrixInverse.copy(presetProj).invert(); }
    valleyCam.updateMatrixWorld(true);
    PU.uO.value.set(valleyCam.position.x * mx, valleyCam.position.y, valleyCam.position.z); U.uEye.value.copy(PU.uO.value);
    PU.uProj.value.multiplyMatrices(valleyCam.projectionMatrix, valleyCam.matrixWorldInverse).multiply(root.matrixWorld);
    sky.position.copy(PU.uO.value);
    // ---- draw the valley into the target (arm one is behind us once we are in the room of the cut walls)
    if (u < 0.55 && renderer) {
      renderer.getDrawingBufferSize(_s); const sc = rtFor(_s.x), w = Math.max(8, Math.round(_s.x * sc)), h = Math.max(8, Math.round(_s.y * sc));
      if (rt.width !== w || rt.height !== h) rt.setSize(w, h);
      const prev = renderer.getRenderTarget(), t0 = renderer.info.render.triangles, c0 = renderer.info.render.calls, auto = renderer.info.autoReset;
      renderer.info.autoReset = false;
      renderer.setRenderTarget(rt); renderer.render(scene, valleyCam); renderer.setRenderTarget(prev);
      renderer.info.autoReset = auto; stats.triangles = renderer.info.render.triangles - t0; stats.calls = renderer.info.render.calls - c0;
    }
  }
  const presetProj = valleyCam.projectionMatrix.clone();
  return { root, update, stats, uniforms: PU, valleyCam, target: rt, dispose() { rt.dispose(); } };
}
