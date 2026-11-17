// hall-roofed-with-weather: THE HALL. Pale limestone walls in courses with a blind arcade and bench at their foot, fourteen
// side windows, the great window and three lancets with their mullions and dim weather-glass, the oak screen and gallery,
// the flagged floor with its rushes and wax marks, the one bent table with its benches and its whole setting, and the
// hearth's kerb, firedogs, logs and flames. The air (route, sky, cloud, storm, candles, the light rig) is another part's.
//
//   buildHall(ctx, { THREE, INT, rig, rngFor, weather }) -> { object, update(dt, time, u), setLightning(k, x), triangles, drawCalls, dispose() }
//
// Every surface takes the rig it is handed (the kit's one material; the weather-glass is that material with a pane
// pattern laid in). The hall adds no light and no window row, and reads nothing of the lens. THE WEATHER IS HANDED IN:
// weather = { front(u), back(u), at(x, u) }, made by the world file from places of its route; its band says which
// glass the storm's full rain is on, and setLightning says which glass the flash pales. Without a weather the hall
// builds and runs all the same: every glass keeps the thin rain it has away from the storm (a third of the full run)
// and none ever pales. (The candles' gold is handed in through the rig: rig.gold.)
// Hall space is the plan's: floor y = 0, the hall runs along -z from the low end wall (z 20) to the high end (z -150).
import { HALL, HEARTH, TABLE, tableX, GALLERY, WINDOWS, windowZ, GREAT_WINDOW } from './hall-roofed-with-weather-plan.js';

const lerp = (a, b, t) => a + (b - a) * t;
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// ---- the stone and the oak (linear albedo stays well under 0.8: the flames do the brightening)
const LIME_A = '#d7d3c8', LIME_B = '#c5bfb0', LIME_NEW = '#d9cfb4', LIME_JOINT = '#8e887b', LIME_TRIM = '#d6d2c7', LIME_DEEP = '#b9b4a8';
const FLAG_A = '#b6af9f', FLAG_B = '#9d9687', FLAG_JOINT = '#575147';
const HEARTH_STONES = 7.7;         // how far from the hearth's centre its ring of blackened stones reaches
const WALL_T = 2.0;                 // how deep the glass sits in the wall
const SIDE = { half: WINDOWS.width / 2, sill: WINDOWS.sill, spring: 31, head: WINDOWS.head };
const GREAT = { half: (GREAT_WINDOW.x1 - GREAT_WINDOW.x0) / 2, sill: GREAT_WINDOW.sill, spring: 27, head: GREAT_WINDOW.head };
const LANCETS = [{ s: -13, half: 2.6, sill: 21, spring: 33, head: 38 }, { s: 0, half: 2.9, sill: 21, spring: 35, head: 40.5 }, { s: 13, half: 2.6, sill: 21, spring: 33, head: 38 }];

// A wall's own frame: s runs along the wall, y up, d out of the wall into the room. at(s, y, d) is the place in the hall.
function frameOf(THREE, ox, oz, ax, az) {
  const nx = -az, nz = ax;
  const m = new THREE.Matrix4().set(ax, 0, nx, ox, 0, 1, 0, 0, az, 0, nz, oz, 0, 0, 0, 1);
  return { m, ax, az, nx, nz, ox, oz, at: (s, y, d = 0) => [ox + ax * s + nx * d, y, oz + az * s + nz * d] };
}

// The outline of a pointed opening in a wall's own plane, counter-clockwise from the sill: sc centre, w half width,
// y0 sill, ys springing, ya apex; n points up each flank of the two-centred head. When the rise is at least the half
// width the two centres lie on the springing line; a flatter head takes its centres below that line and past the
// middle (by e), so that both arcs still climb all the way to the point where they meet (no shoulder above the point).
function openingPts(sc, w, y0, ys, ya, n = 8) {
  const rise = ya - ys, tall = rise >= w, e = tall ? (rise * rise - w * w) / (2 * w) : 0.3 * w;
  const cy = tall ? ys : ys + (rise * rise - w * w - 2 * w * e) / (2 * rise), R = Math.hypot(e, ya - cy);
  const a0 = Math.atan2(ys - cy, w + e), a1 = Math.atan2(ya - cy, e), pts = [[sc - w, y0], [sc + w, y0]];
  for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * (a1 - a0); pts.push([sc - e + R * Math.cos(a), cy + R * Math.sin(a)]); }
  for (let i = 1; i <= n; i++) { const a = Math.PI - a1 + (i / n) * (a1 - a0); pts.push([sc + e + R * Math.cos(a), cy + R * Math.sin(a)]); }
  return pts;
}

// A flat face in the z = 0 plane (looking toward +z) from an outline and any number of holes; d moves it along z.
function faceGeo(THREE, outer, holes = [], d = 0) {
  const sh = new THREE.Shape(outer.map((p) => new THREE.Vector2(p[0], p[1])));
  for (const h of holes) sh.holes.push(new THREE.Path(h.map((p) => new THREE.Vector2(p[0], p[1]))));
  const g = new THREE.ShapeGeometry(sh);
  if (d) g.translate(0, 0, d);
  return g;
}

// A quad that looks toward the point `to` whatever order its corners come in (so that no face of the hall is inside out).
function quadTo(b, p0, p1, p2, p3, to, c, sf, away = false) {
  const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p3[0] - p0[0], vy = p3[1] - p0[1], vz = p3[2] - p0[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if ((nx * (to[0] - p0[0]) + ny * (to[1] - p0[1]) + nz * (to[2] - p0[2]) >= 0) !== away) b.quad(p0, p1, p2, p3, c, sf); else b.quad(p0, p3, p2, p1, c, sf);
}

// The kit's builder turns normals the wrong way round under a turned matrix, so whatever is turned is turned here
// first (three's own transform), and handed to the builder as it lies.
function put(b, geo, m, o = {}) { geo.applyMatrix4(m); b.add(geo, o); return b; }

// The splayed reveal between an opening's outline on the wall face (depth 0) and its glass outline (depth -WALL_T).
function addReveal(b, F, face, glass, c, sf) {
  let cs = 0, cy = 0; for (const p of glass) { cs += p[0]; cy += p[1]; } cs /= glass.length; cy /= glass.length;
  const to = F.at(cs, cy, -WALL_T / 2), n = glass.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    quadTo(b, F.at(face[i][0], face[i][1], 0), F.at(face[j][0], face[j][1], 0), F.at(glass[j][0], glass[j][1], -WALL_T), F.at(glass[i][0], glass[i][1], -WALL_T), to, c, sf);
  }
}
// ---- the weather-glass: the kit's material with small leaded quarries laid in. Each pane is dim smoky slate, the
// darkest thing in the room (the sky outside is never seen); a thin rain runs down every pane all the while, and three
// times as strong while the storm band is over that glass, seen only as a wet sheen. Every pane is tilted a hair on
// its own, so the room's flames glint in a few.
// THE FLASH. The storm value the hall is handed never rests while the storm is overhead: the sheet lightning alone
// swings it between about 0.15 and 0.3 (its cap) every half second, and a thread of lightning under the cloud holds it
// at the cap for about a second. The glass takes only the top of that value, from 0.285 up, near the place across the
// hall it is handed: so it pales while a thread runs AND on the strongest pulses of the sheet lightning (about a
// quarter of the storm's time in all, most of it threads), each time for a fraction of a second, and even then only
// to about the tone of the stone beside it: no pane ever glows, and at the sheet's usual level it shows nothing.
const GLASS_PARS = /* glsl */`
uniform float uHallClock; uniform vec2 uHallStorm, uHallFlash; uniform vec3 uSkyPre, uSkyStorm, uSkyPost, uSkyLow;
`;
const GLASS_MAIN = /* glsl */`
vec3 hgTilt=vec3(0.);
{
  vec2 g=vIntUv; float fwg=max(length(fwidth(g)),1e-4); float x=vObjPos.x;
  float sa=clamp((uHallStorm.x-x)/10.,0.,1.), sb=clamp((x-uHallStorm.y)/10.,0.,1.);
  float st=min(sa,sb); st=st*st*(3.-2.*st); float pre=1.-sa, post=1.-sb;
  vec2 q=vec2(g.x/.44+g.y/.62, g.x/.44-g.y/.62); vec2 ci=floor(q), f=fract(q);
  float h=i_h21(ci+7.3), h2=fract(h*17.31);
  float dl=min(min(f.x,1.-f.x),min(f.y,1.-f.y))*.359;
  float lead=i_line(dl,.024,fwg);
  float bar=i_line(abs(fract(g.y/2.3)-.5)*2.3,.04,fwg);
  float nearK=clamp(1.6-fwg/.2,0.,1.);
  float pv=mix(1.,.7+.6*h,nearK);
  float cl=i_fbm2(vec2(x*.02+g.x*.06-uHallClock*.011, g.y*.055+3.));
  vec3 sky=uSkyPre*pre+uSkyStorm*st+uSkyPost*post+uSkyLow*(pre*exp(-max(g.y,0.)/7.));
  float rain=0., run=0.;
  { float cw=.6, cx=g.x/cw, hx=i_h21(vec2(floor(cx),3.1));
    float fx=fract(cx)-.5-.16*sin(g.y*1.3+hx*40.);
    float fy=fract((g.y+uHallClock*(2.2+3.5*hx))/5.+hx*13.);
    float tail=smoothstep(0.,.07,fy)*(1.-fy); tail*=tail;
    run=(1.-smoothstep(.05,.11,abs(fx)))*tail*clamp(.14/fwg,0.,1.);
    float sheet=i_n2(vec2(g.x*.85, g.y*.22+uHallClock*1.25)); sheet*=sheet;
    rain=(.35+.65*st)*(run*1.3+sheet*.5); }
  float dxl=(x-uHallFlash.y)/26.; float fl=smoothstep(.285,.3,uHallFlash.x)*exp(-dxl*dxl);
  float on=lead*bar;
  vec3 tn=mix(vec3(.985,.99,1.),vec3(1.,.97,.9),h2*nearK);
  diffuseColor.rgb=mix(vec3(.03,.03,.031), (vec3(.024,.025,.028)+sky*(.6+.5*cl))*tn*pv, on);
  iGloss=mix(.3,.5+.4*clamp(rain,0.,1.),on); iMetal=mix(.5,0.,on); iH=0.;
  iEmis=vec3(.88,.88,.9)*(fl*(.35+.65*cl)*.13)*(tn*pv*on);
  vec3 tg=vec3(vObjN.z,0.,-vObjN.x); tg*=inversesqrt(dot(tg,tg)+1e-8);
  hgTilt=(tg*((h-.5)*.2*nearK+(.35+.65*st)*run*.5)+vec3(0.,1.,0.)*((h2-.5)*.2*nearK))*on;
}
`;
const GLASS_NORMAL = /* glsl */`
{ vec3 hn=normal+(viewMatrix*vec4(hgTilt,0.)).xyz; normal=hn*inversesqrt(dot(hn,hn)+1e-8); }
`;
function makeGlass(H) {
  const { THREE, INT, rig } = H;
  const mat = INT.propMaterial({ rig, scale: 1 });
  const hour = H.hour, v3 = (r, g, b) => new THREE.Vector3(r, g, b);
  // the glass gives no light of its own (dim smoky slate; pale only while lightning goes): these are the faint casts
  // its slate takes ahead of the front, under the storm and behind it. The hour a seed or the viewer deals changes
  // these and nothing else of the hall (dawn: a grey-rose cast behind the storm; golden: an ember cast low before it;
  // day: a paler slate behind it)
  const pre = v3(0.012, 0.012, 0.014), storm = v3(0.005, 0.005, 0.007), post = v3(0.014, 0.014, 0.017), low = v3(0, 0, 0);
  if (hour === 'dawn') post.set(0.03, 0.021, 0.022);
  if (hour === 'golden') low.set(0.045, 0.012, 0.005);
  if (hour === 'day') post.set(0.022, 0.023, 0.027);
  const U = H.glassU = {
    uHallClock: { value: 0 }, uHallStorm: { value: new THREE.Vector2(-1e4, -1e4) }, uHallFlash: { value: new THREE.Vector2(0, 0) },
    uSkyPre: { value: pre }, uSkyStorm: { value: storm }, uSkyPost: { value: post }, uSkyLow: { value: low },
  };
  const base = mat.onBeforeCompile, key = mat.customProgramCacheKey;
  mat.onBeforeCompile = (shader, renderer) => {
    base(shader, renderer);
    Object.assign(shader.uniforms, U);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <packing>', '#include <packing>\n' + GLASS_PARS)
      .replace('#include <alphamap_fragment>', GLASS_MAIN + '\n#include <alphamap_fragment>')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + GLASS_NORMAL);
  };
  mat.customProgramCacheKey = () => key() + ':hall-glass';
  return mat;
}

// All the glass of the hall as one mesh: panes = [{ F, pts, sc, sill }], uv = metres from the opening's own centre and sill.
function glassGeometry(H, panes) {
  const { THREE, INT } = H, P = [], N = [], C = [], S = [], UV = [], I = [], sf = INT.surf(INT.SURF.PLAIN, 0.9);
  for (const pn of panes) {
    const g = faceGeo(THREE, pn.pts), pa = g.attributes.position, ix = g.index, base = P.length / 3;
    for (let i = 0; i < pa.count; i++) {
      const s = pa.getX(i), y = pa.getY(i), w = pn.F.at(s, y, -WALL_T + 0.05);
      P.push(w[0], w[1], w[2]); N.push(pn.F.nx, 0, pn.F.nz); C.push(1, 1, 1); S.push(sf[0], sf[1], sf[2], sf[3]); UV.push(s - pn.sc, y - pn.sill);
    }
    for (let i = 0; i < ix.count; i++) I.push(base + ix.getX(i));
    g.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); geo.setAttribute('surf', new THREE.Float32BufferAttribute(S, 4));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); geo.setIndex(I); geo.computeBoundingSphere();
  return geo;
}

// ---- THE CANDLES' GOLD. The air hands the rig a uniform object, rig.gold: sixteen places (x, y, z, strength) that ride
// with the candle skeins and that the air alone moves. The hall's stone, floor and wood read it (they make no light
// and move nothing): each place adds a warm term that falls off as strength / (1 + distance squared / radius squared).
// On the floor the height counts for less than the plan distance, so a pool lies under each skein and goes with it.
// hallPool says how much of a pool lies on a flag: the greatest, over the sixteen, of strength / (1 + plan distance
// squared / radius squared) from the point under the place; the floor dims only the flags that have little of it.
// While the air has handed nothing (or in a world without it) every strength is 0 and nothing changes.
const GOLD_PARS = /* glsl */`
uniform vec4 uHallGold[16];
vec2 hallGold(vec3 p, vec3 n, float r2, float flatY, float wrap){
  float g=0., on=0.;
  for(int i=0;i<16;i++){
    vec3 dv=uHallGold[i].xyz-p; float w=uHallGold[i].w;
    float d2=dv.x*dv.x+dv.z*dv.z+dv.y*dv.y*flatY;
    float nl=dot(n,dv)*inversesqrt(dot(dv,dv)+1e-4);
    g+=w*clamp(wrap+(1.-wrap)*nl,0.,1.)/(1.+d2/r2);
    on+=w;
  }
  return vec2(g,min(on,1.));
}
float hallPool(vec3 p, float r2){
  float pk=0.;
  for(int i=0;i<16;i++){ vec2 dh=uHallGold[i].xz-p.xz; pk=max(pk,uHallGold[i].w/(1.+dot(dh,dh)/r2)); }
  return pk;
}
`;
const GOLD_PROP = /* glsl */`
{ vec2 hg=hallGold(vRigPos,vec3(0.,1.,0.),60.,1.,1.); iEmis+=diffuseColor.rgb*vec3(1.,.72,.38)*(min(hg.x,1.2)*.3*(1.-iMetal)); }
`;
// THE OAK IS BROWN. Under straw-gold and firelight a brown base goes red, and the dark end of the film's tone curve
// then drops what green and blue are left (oxblood). So the wood's bases are grey-brown, and half the colour of the
// LIT wood is taken out here, in the material, before the picture's tone curve (and a quarter of that of the plain
// surfaces: clay, crust, rind, pewter, so that no dark pot goes wine red); the carved stone keeps all of its own.
const WOOD_OUT = /* glsl */`
{ float wd=step(1.,vSurf.x)*step(vSurf.x,1.999), pl=step(vSurf.x,.999), lw=dot(outgoingLight,vec3(.35,.5,.15));
  outgoingLight=mix(vec3(lw),outgoingLight,1.-.5*wd-.28*pl); }
`;
function goldPars(H, shader) {
  shader.uniforms.uHallGold = H.goldU;
  shader.fragmentShader = shader.fragmentShader.replace('#include <packing>', '#include <packing>\n' + GOLD_PARS);
}

// ---- the limestone: the kit's wall material with our own ashlar laid in. Courses and blocks come in pairs whose shared
// joint is set off by chance, so that course heights run from about 1.2 to 2.1 m and block lengths from 2.3 to 4.9 m and
// no two neighbours match; each block has a tone of its own inside a narrow range; joints are thin and only a little
// darker than the stone. Lengths are metres of the wall itself.
const STONE_MAIN = /* glsl */`
{
  vec3 nn=vObjN*inversesqrt(dot(vObjN,vObjN)+1e-8); vec2 p; float level=step(.7,abs(nn.y));
  if(level>.5) p=vObjPos.xz; else { vec3 tg=vec3(nn.z,0.,-nn.x); tg*=inversesqrt(dot(tg,tg)+1e-8); p=vec2(dot(vObjPos,tg), vObjPos.y); }
  float fw=max(length(fwidth(p)),1e-4);
  float H0=1.65, yy=p.y/H0, k=floor(yy*.5), f=yy-2.*k, sp=1.+(i_h21(vec2(k,5.3))-.5)*.5;
  float upper=step(sp,f), fy=(f-upper*sp)*H0, rh=mix(sp,2.-sp,upper)*H0, row=2.*k+upper;
  float L0=3.6, xx=(p.x+i_h21(vec2(row,1.7))*9.)/L0, kx=floor(xx*.5), g=xx-2.*kx, sx=1.+(i_h21(vec2(kx,row)+3.1)-.5)*.7;
  float right=step(sx,g), fx=(g-right*sx)*L0, bl=mix(sx,2.-sx,right)*L0;
  float id=i_h21(vec2(2.*kx+right,row)+2.2), id2=fract(id*13.7), id3=fract(id*7.3);
  float d=min(min(fx,bl-fx),min(fy,rh-fy));
  float joint=i_line(d,.02,fw);
  float lod=clamp(1.5-fw/1.2,0.,1.);
  float cloud=i_fbm2(p*.16+3.), fine=i_n2(p*2.3+id*11.), streak=i_n2(vec2(p.x*.8,p.y*.05+7.));
  vec3 base=mix(uColA,uColB,mix(.5,id,lod)*.5+.15+.2*cloud);
  base*=.9+.12*cloud+.06*(fine-.5)*lod-.07*streak*streak;
  base*=(.96+.08*i_h21(vec2(row,9.1)))*mix(vec3(1.025,1.,.96),vec3(1.),i_h21(vec2(row,4.7)));
  base=mix(base,uColC,smoothstep(.9,.96,id)*.4*lod);
  base*=(1.+(id2-.5)*.11*lod)*mix(vec3(1.),mix(vec3(1.03,1.,.95),vec3(1.),id3),lod);
  base*=.88+.12*smoothstep(0.,.3,d);
  float wst=smoothstep(.3,.8,i_n2(vec2(p.x*.9,p.y*.07)))*.75+.25;
  float wet=(smoothstep(6.,11.6,p.y)*step(p.y,11.7)+smoothstep(35.5,42.9,p.y)*step(p.y,43.))*wst*(1.-level);
  base*=mix(vec3(1.),vec3(.74,.78,.72),wet*.75);
  base=mix(uColD*base/max(uColA,vec3(.05)),base,joint);
  diffuseColor.rgb=base*I_VCOL;
  iGloss=uPatB.x*(.5+.5*fine); iH=smoothstep(0.,.1,d)*.016+fine*.0015+((fx/bl-.5)*(id2-.5)+(fy/rh-.5)*(id3-.5))*.012; iBumpK=clamp(1.-fw*5.,0.,1.);
  { vec2 hg=hallGold(vRigPos,nn,60.,1.,.3); iEmis+=diffuseColor.rgb*vec3(1.,.72,.38)*(min(hg.x,1.2)*.34); }
}
`;
function makeStone(H) {
  const mat = H.INT.interiorMaterial({ rig: H.rig, pattern: 'wall', mode: 0, scale: 1, colors: [LIME_A, LIME_B, LIME_NEW, LIME_JOINT], patA: [0, 0, 1, 0], patB: [0.16, 0, 0, 0] });
  const base = mat.onBeforeCompile, key = mat.customProgramCacheKey;
  mat.onBeforeCompile = (shader, renderer) => {
    base(shader, renderer); goldPars(H, shader);
    shader.fragmentShader = shader.fragmentShader.replace('#include <alphamap_fragment>', STONE_MAIN + '\n#include <alphamap_fragment>');
  };
  mat.customProgramCacheKey = () => key() + ':hall-stone';
  return mat;
}

// ---- the floor's dress, laid into the kit's flagstones: a thin strew of rushes (single stalks close to, a pale
// straw-green cast far off; thick along the table's line, none by the fire), old rings of spilt wax on the flags (pale
// flat splashes along three ovals about the hall's middle and a ring about the hearth: they are fixed marks on the
// floor and follow no candle stream of the air's), soot round the kerb, more polish where feet have gone along the
// table, and the candles' gold in pools (see GOLD_PARS). Everything is filtered by the pixel's footprint.
function floorMain(THREE) {
  const lin = (hex) => { const c = new THREE.Color(hex); return 'vec3(' + c.r.toFixed(4) + ',' + c.g.toFixed(4) + ',' + c.b.toFixed(4) + ')'; };
  const f = (x) => x.toFixed(4), amp = TABLE.amp, phi = Math.atan2(-tableX(TABLE.wave / 4), tableX(0));
  return /* glsl */`
{
  vec2 p=vObjPos.xz; float fw=max(length(fwidth(p)),1e-4);
  float zc=clamp(p.y,${f(TABLE.z1)},${f(TABLE.z0)}), ang=6.28318*zc/${f(TABLE.wave)}+(${f(phi)});
  float tx=${f(amp)}*cos(ang), sl=${f(amp * 2 * Math.PI / TABLE.wave)}*sin(ang);
  float dT=length(vec2((p.x-tx)*inversesqrt(1.+sl*sl), p.y-zc));
  float dH=length(p-vec2(${f(HEARTH.x)},${f(HEARTH.z)}));
  // the flags: courses across the hall of uneven depth, flags of uneven length, each with its own tone, polish and lie
  float yy=p.y/3.3, kf=floor(yy*.5), ff=yy-2.*kf, sp=1.+(i_h21(vec2(kf,5.3))-.5)*.5;
  float up=step(sp,ff), fy=(ff-up*sp)*3.3, frh=mix(sp,2.-sp,up)*3.3, row=2.*kf+up;
  float xx=(p.x+i_h21(vec2(row,1.7))*9.)/4.2, kx=floor(xx*.5), gg=xx-2.*kx, sx=1.+(i_h21(vec2(kx,row)+3.1)-.5)*.7;
  float rt=step(sx,gg), fx=(gg-rt*sx)*4.2, bl=mix(sx,2.-sx,rt)*4.2;
  float fid=i_h21(vec2(2.*kx+rt,row)+2.2), fid2=fract(fid*13.7), fid3=fract(fid*7.3);
  float jd=min(min(fx,bl-fx),min(fy,frh-fy)), fjoint=i_line(jd,.03,fw), flod=clamp(1.5-fw/1.6,0.,1.);
  float fcloud=i_n2(p*.13+3.)*.6+i_n2(p*.37)*.4, ffine=i_n2(p*2.1+fid*11.);
  float l0=(p.x+18.)/2.6, l1=p.x/3., l2=(p.x-18.)/2.6;
  float lanes=(exp(-l0*l0)+exp(-l1*l1)+exp(-l2*l2))*smoothstep(-16.,8.,p.y);
  float worn=clamp((1.-smoothstep(4.,8.5,dT))*smoothstep(1.6,2.6,dT)+lanes*.8+(1.-smoothstep(1.5,3.5,abs(dH-9.6)))*.7,0.,1.)*(.55+.45*fcloud);
  vec3 flag=mix(${lin(FLAG_A)},${lin(FLAG_B)},mix(.5,fid,flod));
  flag*=(.84+.22*fcloud+.07*(ffine-.5)*flod)*(1.+(fid2-.5)*.24*flod)*mix(vec3(1.),mix(vec3(1.05,1.,.93),vec3(1.),fid3),flod*.7)*(1.+.12*worn);
  diffuseColor.rgb=mix(${lin(FLAG_JOINT)}*(.7+.5*fcloud),flag,fjoint);
  iGloss=mix(.5,.78,worn)*(.72+.28*fid2)*(.85+.15*ffine)*mix(.35,1.,fjoint);
  iH=smoothstep(0.,.12,jd)*.014+((fx/bl-.5)*(fid2-.5)+(fy/frh-.5)*(fid3-.5))*.26*smoothstep(0.,.3,jd)*flod; iBumpK=clamp(1.-fw*4.,0.,1.);
  float dens=(.16+.3*i_n2(p*.11+uHallStrew.xy)+.85*(1.-smoothstep(1.8,8.5,dT))+.55*smoothstep(7.6,9.5,dH)*(1.-smoothstep(10.5,15.,dH)))*smoothstep(7.5,8.7,dH);
  vec2 cell=floor(p/1.15); float rush=0., rh=0.;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 c=cell+vec2(float(i),float(j));
    for(int k=0;k<2;k++){
      vec2 hs=c+uHallStrew.xy*37.+float(k)*17.3;
      float h1=i_h21(hs), h2=i_h21(hs+5.1), h3=i_h21(hs+9.7), h4=i_h21(hs+13.3);
      vec2 cen=(c+vec2(h1,h2))*1.15; float a=h3*3.14159; vec2 dir=vec2(cos(a),sin(a)); float hl=.45+.5*h4;
      vec2 r=p-cen; float t=clamp(dot(r,dir),-hl,hl); float d=length(r-dir*t);
      float m=(1.-smoothstep(.03,.05+fw,d))*step(h4*.9+h1*.1,dens);
      if(m>rush){ rush=m; rh=h2; }
    }
  }
  rush*=clamp(.1/fw,0.,1.);
  float strew=clamp(rush+dens*.3*(.6+.8*i_n2(p*2.1)),0.,1.);
  diffuseColor.rgb=mix(diffuseColor.rgb, mix(vec3(.47,.47,.27),vec3(.37,.44,.23),rh), strew*.9); iGloss*=1.-strew*.7;
  float el=length(vec2(p.x/27.,(p.y-(${f((HALL.zLow + HALL.zHigh) / 2)}))/78.));
  float band=max(max(1.-abs(el-.45)/.06, 1.-abs(el-.68)/.06), max(1.-abs(el-.9)/.06, 1.-abs(dH-9.5)/1.8));
  float wd=.04+.8*clamp(band,0.,1.);
  vec2 wc=floor(p/2.1), wf=p/2.1-wc, ws=wc+uHallStrew.zw*23.;
  float w1=i_h21(ws), w2=i_h21(ws+3.3), w3=i_h21(ws+7.9);
  vec2 q=(wf-vec2(.3+.4*w1,.3+.4*w2))*2.1; float wr=.2+.42*w3;
  float blob=min(length(q*vec2(1.,.8+.5*w2))-wr*(.55+.75*i_n2(q*2.6+ws)), length(q-vec2(cos(w2*40.),sin(w2*40.))*(wr+.2))-.09);
  float wax=(1.-smoothstep(-.02,.02+fw,blob))*step(w3*.6+w1*.4,wd)*clamp(.5/fw,0.,1.);
  diffuseColor.rgb=mix(diffuseColor.rgb, vec3(.6,.57,.47), wax*.62); iGloss=mix(iGloss,.42,wax);
  float sn=i_n2(p*.33)*.6+i_n2(p*.9+4.)*.4;
  diffuseColor.rgb*=1.-.8*(1.-smoothstep(4.3,12.5,dH))*(.5+.6*sn);
  float ashk=(1.-smoothstep(4.5,8.6,dH))*smoothstep(.46,.7,i_n2(p*.8+11.)*.65+i_n2(p*2.7)*.35);
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.33,.32,.31),ashk*.7); iGloss*=1.-.8*max(ashk,(1.-smoothstep(4.5,9.,dH))*.6);
  vec2 cc=floor(p*2.6), cf=p*2.6-cc-.5-(vec2(i_h21(cc+3.),i_h21(cc+8.))-.5)*.5;
  float cind=step(.9,i_h21(cc))*(1.-smoothstep(.1,.2,length(cf)))*(1.-smoothstep(4.4,9.,dH))*clamp(.3/fw,0.,1.); diffuseColor.rgb*=1.-.8*cind;
  // the hearth stones: two rings of long stones round the fire, blackened
  float hr=1.-smoothstep(${f(HEARTH_STONES - 0.12)},${f(HEARTH_STONES)},dH), rowH=step(5.8,dH), nS=mix(26.,34.,rowH);
  float ha=atan(p.y-(${f(HEARTH.z)}),p.x-(${f(HEARTH.x)})+1e-5)/6.28318*nS+rowH*.5, hf=fract(ha), hid=i_h21(vec2(floor(ha),rowH+31.));
  float hj=min(min(hf,1.-hf)*6.28318*dH/nS,min(abs(dH-5.8),${f(HEARTH_STONES - 0.04)}-dH)), hjl=i_line(hj,.04,fw);
  vec3 hst=mix(vec3(.034,.031,.029),vec3(.074,.069,.064),hid)*(.8+.4*fcloud)*mix(.5,1.,smoothstep(4.2,7.4,dH));
  diffuseColor.rgb=mix(diffuseColor.rgb,mix(vec3(.018,.016,.014),hst,hjl),hr);
  iGloss=mix(iGloss,.2+.22*hid,hr); iH=mix(iH,smoothstep(0.,.1,hj)*.02,hr);
  diffuseColor.rgb*=mix(1.,.2,smoothstep(${f(GALLERY.z0 - 0.4)},${f(GALLERY.z0 + 3.6)},p.y));
  // the candles' gold: a pool under each skein, and the flags between the pools a little darker and cooler. By place:
  // a flag keeps its own tone where a pool lies on it (within about 5 m of the point under a skein at full strength),
  // takes the whole dimming far from every skein (from about 14 m), and between is eased by the pool's strength there
  { vec2 hg=hallGold(vRigPos,vec3(0.,1.,0.),36.,.1,1.); float between=hg.y*(1.-smoothstep(.15,.6,hallPool(vRigPos,36.)));
    diffuseColor.rgb*=mix(vec3(1.),vec3(.64,.67,.73),between);
    iEmis+=diffuseColor.rgb*vec3(1.,.7,.36)*(min(hg.x,1.3)*1.5); }
}
`;
}
function makeFloor(H) {
  const mat = H.INT.interiorMaterial({ rig: H.rig, pattern: 'floor', mode: 4, scale: 3, colors: [FLAG_A, FLAG_B, FLAG_A, FLAG_JOINT], patA: [0.9, 0.011, 0, 0], patB: [0.62, 0, 0, 0] });
  const r1 = H.rngFor('rushes'), r2 = H.rngFor('wax');
  const U = { uHallStrew: { value: new H.THREE.Vector4(r1() * 7, r1() * 7, r2() * 7, r2() * 7) } }, MAIN = floorMain(H.THREE);
  const base = mat.onBeforeCompile, key = mat.customProgramCacheKey;
  mat.onBeforeCompile = (shader, renderer) => {
    base(shader, renderer); goldPars(H, shader);
    Object.assign(shader.uniforms, U);
    shader.fragmentShader = shader.fragmentShader.replace('#include <packing>', '#include <packing>\nuniform vec4 uHallStrew;')
      .replace('#include <alphamap_fragment>', MAIN + '\n#include <alphamap_fragment>');
  };
  mat.customProgramCacheKey = () => key() + ':hall-floor';
  return mat;
}

function makeMaterials(H) {
  const { INT, rig, THREE } = H;
  // the candles' gold as the hall's materials read it: the air's own sixteen places once the air has handed them to the
  // rig (the hall is built before the air: update() takes them once, the first time it finds them); until then, nothing
  H.goldU = { value: Array.from({ length: 16 }, () => new THREE.Vector4(0, 0, 0, 0)) };
  H.matWall = makeStone(H);
  H.matFloor = makeFloor(H);
  // everything carved, sawn, turned or cast: colour and surface per vertex
  const prop = H.matProp = INT.propMaterial({ rig, scale: 3 }), base = prop.onBeforeCompile, key = prop.customProgramCacheKey;
  prop.onBeforeCompile = (shader, renderer) => {
    base(shader, renderer); goldPars(H, shader);
    shader.fragmentShader = shader.fragmentShader.replace('#include <alphamap_fragment>', GOLD_PROP + '\n#include <alphamap_fragment>')
      .replace('#include <opaque_fragment>', WOOD_OUT + '\n#include <opaque_fragment>');
  };
  prop.customProgramCacheKey = () => key() + ':hall-gold';
  H.matGlass = makeGlass(H);
}

export async function buildHall(ctx, o) {
  const { THREE, INT, rig, rngFor } = o, weather = o.weather && o.weather.front && o.weather.back ? o.weather : null;
  const H = { ctx, THREE, INT, rig, rngFor, group: new THREE.Group(), ticks: [], tris: 0, calls: 0, hour: (ctx.vary && ctx.vary.hour) || 'any' };
  H.group.name = 'hall';
  H.m1 = new THREE.Matrix4(); H.m2 = new THREE.Matrix4();
  H.S = { stone: INT.surf(INT.SURF.STONE, 0.14), oak: INT.surf(INT.SURF.WOOD, 0.3), oakDull: INT.surf(INT.SURF.WOOD, 0.14), iron: INT.surf(INT.SURF.PLAIN, 0.4, 0.8), plain: INT.surf(INT.SURF.PLAIN, 0.2) };
  H.mesh = (geo, mat, name) => {
    const m = new THREE.Mesh(geo, mat); m.name = name; H.group.add(m);
    H.tris += (geo.index ? geo.index.count : geo.attributes.position.count) / 3; H.calls += 1; return m;
  };
  makeMaterials(H);
  await ctx.yield();
  await buildShell(H);
  await buildTable(H);
  await buildHearth(H);
  await buildSetting(H);
  await buildScreen(H);
  await buildStores(H);
  buildSteam(H);
  await ctx.yield();
  const flash = H.glassU.uHallFlash.value, storm = H.glassU.uHallStorm.value, clock = H.glassU.uHallClock;
  return {
    object: H.group,
    update(dt, time, u) {
      if (!H.goldTaken && rig.gold && rig.gold.value && rig.gold.value.length >= 16) { H.goldU.value = rig.gold.value; H.goldTaken = true; }
      clock.value = time; if (weather) storm.set(weather.front(u), weather.back(u)); for (let i = 0; i < H.ticks.length; i++) H.ticks[i](dt, time, u);
    },
    setLightning(k, x) { if (weather) flash.set(sat(k), x); },
    triangles: Math.round(H.tris), drawCalls: H.calls,
    dispose() {
      const seen = new Set();
      H.group.traverse((ob) => {
        if (ob.geometry && !seen.has(ob.geometry)) { seen.add(ob.geometry); ob.geometry.dispose(); }
        const m = ob.material;
        if (m) for (const x of Array.isArray(m) ? m : [m]) if (!seen.has(x)) { seen.add(x); x.dispose(); }
        if (ob.isInstancedMesh) ob.dispose();
      });
    },
  };
}

// A piece set on a wall: the geometry is made in the wall's own frame (x along the wall, y up, z out into the room)
// about its own origin and stood at (s, y, d).
function place(H, b, F, geo, s, y, d, o) {
  H.m1.copy(F.m).multiply(H.m2.makeTranslation(s, y, d)); geo.applyMatrix4(H.m1); b.add(geo, o); geo.dispose(); return b;
}

// A stone bar along a line drawn on a wall's own plane (a mullion, a rib of tracery, a hood mould): pts [[s, y], ...];
// its face is hf half wide at depth dF and it splays back to hb half wide at depth dB. closed joins the ends.
function addBar(b, F, pts, hf, hb, dF, dB, c, sf, closed = false) {
  const n = pts.length, N = [];
  for (let i = 0; i < n; i++) {
    const a = pts[closed ? (i + n - 1) % n : Math.max(i - 1, 0)], q = pts[closed ? (i + 1) % n : Math.min(i + 1, n - 1)];
    const tx = q[0] - a[0], ty = q[1] - a[1], l = Math.hypot(tx, ty) || 1; N.push([-ty / l, tx / l]);
  }
  const at = (i, h, d) => F.at(pts[i][0] + N[i][0] * h, pts[i][1] + N[i][1] * h, d);
  for (let i = 0, m = closed ? n : n - 1; i < m; i++) {
    const j = (i + 1) % n;
    quadTo(b, at(i, hf, dF), at(i, -hf, dF), at(j, -hf, dF), at(j, hf, dF), F.at(pts[i][0], pts[i][1], dF + 9), c, sf);
    quadTo(b, at(i, hb, dB), at(i, hf, dF), at(j, hf, dF), at(j, hb, dB), at(i, hb + 9, dF + 9), c, sf);
    quadTo(b, at(i, -hb, dB), at(i, -hf, dF), at(j, -hf, dF), at(j, -hb, dB), at(i, -hb - 9, dF + 9), c, sf);
  }
}

// A moulding run along a wall from sA to sB: prof is its section as [d, y] points from the wall out, round and back.
// caps closes its two ends (a convex section).
function addMould(b, F, sA, sB, prof, c, sf, caps = false) {
  let cd = 0, cy = 0; for (const q of prof) { cd += q[0]; cy += q[1]; } cd /= prof.length; cy /= prof.length;
  const inside = F.at((sA + sB) / 2, cy, cd - 0.02);
  for (let i = 0; i < prof.length - 1; i++) {
    const a = prof[i], q = prof[i + 1];
    quadTo(b, F.at(sA, a[1], a[0]), F.at(sB, a[1], a[0]), F.at(sB, q[1], q[0]), F.at(sA, q[1], q[0]), inside, c, sf, true);
  }
  if (caps) for (const s of [sA, sB]) for (let i = 1; i < prof.length - 1; i++) {
    const a = prof[0], q = prof[i], r = prof[i + 1];
    quadTo(b, F.at(s, a[1], a[0]), F.at(s, q[1], q[0]), F.at(s, r[1], r[0]), F.at(s, r[1], r[0]), inside, c, sf, true);
  }
}

// An arc of a rib: points on the circle about (cx, cy) of radius R from angle a0 to a1.
function arcPts(cx, cy, R, a0, a1, n = 7) {
  const pts = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); } return pts;
}

// One wall's face from y0 to y1 between s0 and s1, with its pointed openings: each gets a deep splayed reveal, its glass,
// a hood mould over its head with a stop at either foot, a sill, and its mullions, transom and plain tracery.
function addWallFace(H, wb, cb, panes, F, s0, s1, y0, y1, wins, niches = []) {
  const { THREE, S } = H, holes = [];
  for (const nc of niches) {                                 // an empty niche: sunk D into the wall, its back a tone deeper
    const o = openingPts(nc.s, nc.half, nc.y0, nc.ys, nc.ya, 6), to = F.at(nc.s, (nc.y0 + nc.ya) / 2, -nc.D / 2);
    holes.push(o);
    for (let j = 0; j < o.length; j++) { const a = o[j], q = o[(j + 1) % o.length]; quadTo(wb, F.at(a[0], a[1], 0), F.at(q[0], q[1], 0), F.at(q[0], q[1], -nc.D), F.at(a[0], a[1], -nc.D), to, '#e9e5dc'); }
    const g = faceGeo(THREE, o, [], -nc.D); put(wb, g, F.m, { c: '#bcb8ae' }); g.dispose();
  }
  for (const w of wins) {
    const glass = openingPts(w.s, w.half, w.sill, w.spring, w.head, 9);
    const face = openingPts(w.s, w.half + 0.9, w.sill - 1.5, w.spring, w.head + 0.95, 9);
    holes.push(face);
    addReveal(wb, F, face, glass, '#f4f1ea');
    panes.push({ F, pts: glass, sc: w.s, sill: w.sill });
    const hood = openingPts(w.s, w.half + 1.25, w.sill, w.spring, w.head + 1.32, 9).slice(2);     // the head only, foot to foot
    addBar(cb, F, hood, 0.24, 0.68, 0.44, 0, LIME_TRIM, S.stone);
    for (const sg of [-1, 1]) place(H, cb, F, new THREE.BoxGeometry(1.15, 0.9, 0.72), w.s + sg * (w.half + 1.25), w.spring - 0.4, 0.36, { c: LIME_TRIM, surf: S.stone });
    if (!w.noSill) addMould(cb, F, w.s - w.half - 1.5, w.s + w.half + 1.5, [[0, w.sill - 2.2], [0.3, w.sill - 2.05], [0.44, w.sill - 1.9], [0.44, w.sill - 1.62], [0, w.sill - 1.46]], LIME_TRIM, S.stone, true);
    addTracery(H, cb, F, w);
  }
  const g = faceGeo(THREE, [[s0, y0], [s1, y0], [s1, y1], [s0, y1]], holes);
  put(wb, g, F.m, { c: '#ffffff' }); g.dispose();
}

// The stone in a window: a frame against the glass, mullions from the sill to the springing, a transom, and plain
// intersecting tracery in the head (every mullion forks into two ribs that run parallel to the head's own two arcs).
function addTracery(H, cb, F, w) {
  const S = H.S, lights = w.lights || 1, big = w.half > 6, dB = -WALL_T + 0.02, dF = dB + (big ? 0.95 : 0.66);
  const hf = big ? 0.24 : 0.16, hb = big ? 0.5 : 0.34, col = LIME_TRIM;
  addBar(cb, F, openingPts(w.s, w.half - 0.12, w.sill + 0.12, w.spring, w.head - 0.14, 9), 0.14, 0.26, dB + 0.5, dB, col, S.stone, true);
  if (lights < 2) return;
  const rise = w.head - w.spring, c = (rise * rise - w.half * w.half) / (2 * w.half), R = w.half + c, lw = (2 * w.half) / lights;
  for (let i = 1; i < lights; i++) {
    const xm = -w.half + i * lw;                                             // this mullion, from the opening's centre
    addBar(cb, F, [[w.s + xm, w.sill], [w.s + xm, w.spring]], hf, hb, dF, dB, col, S.stone);
    const aL = Math.acos(sat(((w.half - xm) / 2 + c) / R)), aR = Math.acos(sat(((w.half + xm) / 2 + c) / R));
    addBar(cb, F, arcPts(w.s + xm - w.half - c, w.spring, R, 0, aL, big ? 10 : 7), hf * 0.85, hb * 0.85, dF - 0.06, dB, col, S.stone);
    addBar(cb, F, arcPts(w.s + xm + w.half + c, w.spring, R, Math.PI, Math.PI - aR, big ? 10 : 7), hf * 0.85, hb * 0.85, dF - 0.06, dB, col, S.stone);
  }
  const yt = w.transom || lerp(w.sill, w.spring, 0.5);
  addBar(cb, F, [[w.s - w.half, yt], [w.s + w.half, yt]], hf * 0.9, hb * 0.9, dF - 0.04, dB, col, S.stone);
  const heads = (y) => { for (let j = 0; j < lights; j++) addBar(cb, F, openingPts(w.s - w.half + (j + 0.5) * lw, lw / 2 - hf, y - 1.6, y - 1.6, y - 0.3, 4).slice(2), hf * 0.7, hb * 0.7, dF - 0.1, dB, col, S.stone); };
  heads(yt);                                                 // a small arch closing each light under the transom
  if (lights === 2) {                                        // a roundel in the eye over the mullion
    const ring = [], cy = w.spring + 0.71 * rise, rr = 0.17 * rise;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.2832; ring.push([w.s + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
    addBar(cb, F, ring, hf * 0.7, hb * 0.7, dF - 0.1, dB, col, S.stone, true);
  }
  if (big) {                                                 // the great window: a second transom, arched below like the first
    const y2 = lerp(yt, w.spring, 0.55);
    addBar(cb, F, [[w.s - w.half, y2], [w.s + w.half, y2]], hf * 0.8, hb * 0.8, dF - 0.05, dB, col, S.stone);
    heads(y2);
  }
}
// A run of the blind arcade from sA to sB: n shallow pointed arches sunk D into the wall face, a colonnette on every
// pier, and the stone bench that stands in it and out of it.
function addArcade(H, wb, cb, F, sA, sB, n) {
  const { THREE, S } = H, U = (sB - sA) / n, hw = U / 2 - 0.42, y0 = 1.5, ys = 5.9, ya = 8.15, D = 0.85, holes = [];
  for (let i = 0; i < n; i++) {
    const sc = sA + (i + 0.5) * U, o = openingPts(sc, hw, y0, ys, ya, 6), to = F.at(sc, 4.5, -D / 2);
    holes.push(o);
    for (let j = 1; j < o.length; j++) {
      const a = o[j], q = o[(j + 1) % o.length];
      quadTo(wb, F.at(a[0], a[1], 0), F.at(q[0], q[1], 0), F.at(q[0], q[1], -D), F.at(a[0], a[1], -D), to, '#ebe8e0');
    }
  }
  const g = faceGeo(THREE, [[sA, 1.2], [sB, 1.2], [sB, 9.02], [sA, 9.02]], holes); put(wb, g, F.m, { c: '#ffffff' }); g.dispose();
  quadTo(wb, F.at(sA, 1.3, -D), F.at(sB, 1.3, -D), F.at(sB, 8.4, -D), F.at(sA, 8.4, -D), F.at((sA + sB) / 2, 5, 5), '#dcd8cf');
  for (let i = 0; i <= n; i++) {                       // a colonnette on every pier: base, shaft, capital
    const s = i === 0 ? sA + 0.21 : i === n ? sB - 0.21 : sA + i * U;
    place(H, cb, F, new THREE.CylinderGeometry(0.2, 0.2, ys - y0 - 0.85, 8, 1, true, -Math.PI / 2, Math.PI), s, (y0 + ys - 0.15) / 2, 0.02, { c: LIME_TRIM, surf: S.stone });
    place(H, cb, F, new THREE.BoxGeometry(0.62, 0.35, 0.5), s, y0 + 0.175, 0.2, { c: LIME_TRIM, surf: S.stone });
    place(H, cb, F, new THREE.BoxGeometry(0.7, 0.5, 0.56), s, ys - 0.25, 0.22, { c: LIME_TRIM, surf: S.stone });
  }
  addMould(wb, F, sA, sB, [[-D, 1.6], [1.3, 1.6], [1.42, 1.5], [1.42, 1.3], [1.24, 1.14], [1.16, 0.5], [1.56, 0.5], [1.64, 0.42], [1.64, 0]], '#f4f1ea', undefined, true);
  addMould(cb, F, sA, sB, [[0, 8.55], [0.2, 8.7], [0.32, 8.78], [0.32, 9.04], [0, 9.3]], LIME_TRIM, S.stone);
}

// A wall pier between two bays: a flat strip the height of the wall on a plinth, with a slim round shaft up its face
// that goes on into the cloud. The shaft has three rings (its base, the arcade's cornice, the windows' transom); the
// two string courses return round the pier, and a leaf capital stands at the window springing and under the upper course.
const PIER_HALF = 1.2, PIER_D = 0.5;
function addPier(H, wb, cb, F, s, top, y0 = 0) {
  const { THREE, S } = H, a = s - PIER_HALF, e = s + PIER_HALF, far = F.at(s, 20, 30);
  quadTo(wb, F.at(a, y0, PIER_D), F.at(e, y0, PIER_D), F.at(e, top, PIER_D), F.at(a, top, PIER_D), far, '#ffffff');
  quadTo(wb, F.at(a, y0, 0), F.at(a, y0, PIER_D), F.at(a, top, PIER_D), F.at(a, top, 0), F.at(a - 9, 20, 0.2), '#f1eee7');
  quadTo(wb, F.at(e, y0, 0), F.at(e, y0, PIER_D), F.at(e, top, PIER_D), F.at(e, top, 0), F.at(e + 9, 20, 0.2), '#f1eee7');
  if (!y0) addMould(wb, F, a - 0.3, e + 0.3, [[0, 1.75], [0.95, 1.75], [1.12, 1.5], [1.12, 0]], '#f6f3ec', undefined, true);
  const yb = y0 ? y0 + 0.5 : 1.75, h = top - yb;
  place(H, cb, F, new THREE.CylinderGeometry(0.55, 0.55, h, 10, 1, true, -Math.PI / 2, Math.PI), s, yb + h / 2, PIER_D, { c: LIME_TRIM, surf: S.stone });
  // (three rings to a shaft from the floor: its base, the arcade's cornice, the windows' transom)
  for (const [y, r, hh] of [[y0 ? y0 + 0.45 : 2.2, 0.8, 0.9], [8.95, 0.74, 0.6], [23.6, 0.7, 0.5]]) {
    if (y < y0) continue;
    place(H, cb, F, new THREE.CylinderGeometry(r * 0.9, r, hh, 10, 1, false, -Math.PI / 2, Math.PI), s, y, PIER_D, { c: LIME_TRIM, surf: S.stone });
  }
  addMould(cb, F, a, e, STRING.map((q) => [q[0] + PIER_D, q[1]]), LIME_TRIM, S.stone, true);
  addMould(cb, F, a, e, STRING2.map((q) => [q[0] + PIER_D, q[1]]), LIME_TRIM, S.stone, true);
  addCapital(H, cb, F, s, SIDE.spring - 1.1, PIER_D); addCapital(H, cb, F, s, 41.25, PIER_D);
}
const STRING2 = [[0, 42.95], [0.46, 43.08], [0.6, 43.2], [0.6, 43.5], [0, 43.78]];        // the upper string course's section
// The upper string course from sA to sB, on a row of stepped corbels.
function addCorbelCourse(H, cb, F, sA, sB) {
  const { THREE, S } = H, n = Math.max(1, Math.round((sB - sA) / 2.45)), st = (sB - sA) / n;
  addMould(cb, F, sA, sB, STRING2, LIME_TRIM, S.stone);
  for (let i = 0; i < n; i++) {
    const s = sA + (i + 0.5) * st;
    place(H, cb, F, new THREE.BoxGeometry(0.66, 0.86, 0.46), s, 42.52, 0.23, { c: LIME_TRIM, surf: S.stone });
  }
}
// A capital carved with leaves only (two rows of stiff leaves curling out under a plain abacus), for a half-round shaft
// that stands on a wall: made about its own foot, looking out along +z.
function leafCapital(THREE) {
  const P = [], tri = (a, b, c, out) => {                 // one facet, turned to look away from the shaft
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (nx * out[0] + ny * out[1] + nz * out[2] >= 0) P.push(...a, ...b, ...c); else P.push(...a, ...c, ...b);
  };
  const leaf = (ang, rho, ys, ws) => {
    const sx = Math.sin(ang), cz = Math.cos(ang), out = [sx, 0.35, cz], n = rho.length;
    const pt = (i, side) => { const w = ws[i] * side, rr = rho[i] + (side === 0 && i < n - 1 ? 0.09 : 0); return [sx * rr + cz * w, ys[i], cz * rr - sx * w]; };
    for (let i = 0; i < n - 1; i++) for (const side of [-1, 1]) {
      const a = pt(i, side), b = pt(i, 0), c = pt(i + 1, 0), d = pt(i + 1, side);
      tri(a, b, c, out); if (i < n - 2) tri(a, c, d, out);
    }
  };
  for (let k = -2; k <= 2; k++) leaf(k * 0.63, [0.68, 0.76, 0.92, 1.16, 1.3], [0.36, 0.66, 0.96, 1.18, 1.08], [0.2, 0.3, 0.33, 0.24, 0]);
  for (let k = -3; k < 3; k++) leaf((k + 0.5) * 0.63, [0.62, 0.68, 0.78, 0.95, 1.04], [0.03, 0.25, 0.47, 0.65, 0.58], [0.16, 0.24, 0.26, 0.18, 0]);
  const leaves = new THREE.BufferGeometry(); leaves.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  leaves.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((P.length / 3) * 2), 2)); leaves.computeVertexNormals();
  const bell = new THREE.LatheGeometry([[0.58, 0], [0.6, 0.15], [0.66, 0.6], [0.82, 1.0], [1.0, 1.22]].map((q) => new THREE.Vector2(q[0], q[1])), 8, -Math.PI / 2, Math.PI);
  const abacus = new THREE.CylinderGeometry(1.3, 1.16, 0.42, 5, 1, false, -Math.PI / 2, Math.PI); abacus.translate(0, 1.43, 0);
  return { leaves, bell, abacus };
}
// THE ENTRY'S TUBE. The route comes in along the line x -21.5, y 33, from z 18 to z -12, 11.5 m from the -x wall's
// face, and needs 9 m of clear air round it: nothing of that wall may stand more than 1.8 m proud there. The deepest
// relief of the long walls, there as everywhere, is this capital on its pier: 1.67 m proud of the face (the pier 0.5,
// the capital's abacus and leaf tips 1.17 beyond it, at y 29.9 to 31.6 and again above y 41). Next come the shaft's
// rings at 1.3 and, at the floor, the bench at 1.64. CAP_K holds the capital's reach: 1.3 m as modelled, times CAP_K.
// Measured on the built hall between z 18 and z -12: the nearest thing of the hall to that line is the top corner
// of this capital's abacus, 9.99 m from it; the screen and gallery pass 17 m and more below it.
const CAP_K = 0.9;
function addCapital(H, cb, F, s, y, d) {
  const cap = H.cap || (H.cap = leafCapital(H.THREE)), S = H.S, k = (g) => { const c = g.clone(); c.scale(CAP_K, 1, CAP_K); return c; };
  place(H, cb, F, k(cap.bell), s, y, d, { c: LIME_DEEP, surf: S.stone });
  place(H, cb, F, k(cap.leaves), s, y, d, { c: LIME_TRIM, surf: S.stone });
  place(H, cb, F, k(cap.abacus), s, y, d, { c: LIME_TRIM, surf: S.stone });
}
// Blind work on a bare stretch of wall about sc: a tall pointed head of two lights drawn in roll mouldings over a field
// a tone deeper than the wall, and a plain roundel over it.
function addBlind(H, wb, cb, F, sc) {
  const { THREE, S } = H, ring = [], out = openingPts(sc, 1.5, 14.6, 27.4, 30.1, 5);
  put(wb, faceGeo(THREE, out, [], 0.05), F.m, { c: '#c6c6c6' });
  addBar(cb, F, out, 0.2, 0.46, 0.5, 0, LIME_TRIM, S.stone, true);
  addBar(cb, F, [[sc, 14.6], [sc, 25.6]], 0.13, 0.28, 0.34, 0.05, LIME_TRIM, S.stone);
  for (const sg of [-1, 1]) addBar(cb, F, openingPts(sc + sg * 0.7, 0.7, 25.6, 25.6, 27.6, 4).slice(2), 0.12, 0.26, 0.32, 0.05, LIME_TRIM, S.stone);
  for (let i = 0; i < 14; i++) { const a = (i / 14) * 6.2832; ring.push([sc + 1.3 * Math.cos(a), 36.7 + 1.3 * Math.sin(a)]); }
  put(wb, faceGeo(THREE, ring, [], 0.05), F.m, { c: '#c6c6c6' });
  addBar(cb, F, ring, 0.18, 0.4, 0.44, 0, LIME_TRIM, S.stone, true);
}
const STRING = [[0, 11.66], [0.24, 11.8], [0.36, 11.88], [0.36, 12.14], [0, 12.4]];      // the string course's section
const label = (y) => [[0, y - 0.28], [0.22, y - 0.16], [0.22, y + 0.06], [0, y + 0.2]];   // the thin course at a springing

// The years on the stone, per vertex: darker where the room's light gets in less (down in reveals and recesses), a
// little grime at the foot, broad slow changes of tone along the wall.
function bakeTone(geo, noise, deep) {
  const P = geo.attributes.position.array, C = geo.attributes.color.array;
  for (let i = 0; i < P.length; i += 3) {
    const x = P[i], y = P[i + 1], z = P[i + 2];
    const depth = Math.max(Math.abs(x) - HALL.x1, HALL.zHigh - z, z - HALL.zLow, 0), along = Math.abs(x) > 32 ? z : x;
    let k = 1 - deep * sat(depth / 1.6);
    k *= 0.84 + 0.16 * sstep(0, 6, y);
    k *= 1 + 0.09 * noise.fbm2(along * 0.045, y * 0.045, 3);
    const w = Math.abs(0.035 * noise.n2(along * 0.021 + 9, y * 0.03));
    C[i] *= k * (1 + w); C[i + 1] *= k; C[i + 2] *= k * (1 - w);
  }
}
async function buildShell(H) {
  const { THREE, INT, ctx, S } = H;
  { // the floor
    const b = INT.makeBuilder(), g = new THREE.PlaneGeometry(HALL.x1 - HALL.x0 + 4, HALL.zLow - HALL.zHigh + 4, 6, 14);
    g.rotateX(-Math.PI / 2); b.add(g, { p: [0, 0, (HALL.zLow + HALL.zHigh) / 2], c: '#ffffff' }); g.dispose();
    H.mesh(b.build(), H.matFloor, 'hall-floor');
  }
  await ctx.yield();
  const FL = frameOf(THREE, HALL.x0, 0, 0, -1), FR = frameOf(THREE, HALL.x1, 0, 0, 1);
  const FE = frameOf(THREE, 0, HALL.zHigh, 1, 0), FW = frameOf(THREE, 0, HALL.zLow, -1, 0);
  H.frames = { FL, FR, FE, FW };
  const wb = INT.makeBuilder(), cb = INT.makeBuilder(), panes = [], top = HALL.wallTop, A_TOP = 9, N = WINDOWS.perSide;
  const side = (sgn) => Array.from({ length: N }, (_, i) => ({ s: sgn * windowZ(i), half: SIDE.half, sill: SIDE.sill, spring: SIDE.spring, head: SIDE.head, lights: 2, transom: 23.6 }));
  for (const [F, sgn] of [[FL, -1], [FR, 1]]) {                  // the two long walls, bay by bay
    const e0 = sgn * HALL.zLow, e1 = sgn * HALL.zHigh;
    addWallFace(H, wb, cb, panes, F, Math.min(e0, e1) - 1.5, Math.max(e0, e1) + 1.5, A_TOP, top, side(sgn));
    await ctx.yield();
    for (let k = 0; k <= N; k++) {
      const sb = sgn * (HALL.zLow - k * WINDOWS.bay);
      addPier(H, wb, cb, F, sb, top);
      if (k < N) {
        const sn = sgn * (HALL.zLow - (k + 1) * WINDOWS.bay), sA = Math.min(sb, sn) + PIER_HALF, sB = Math.max(sb, sn) - PIER_HALF, sc = (sA + sB) / 2;
        addArcade(H, wb, cb, F, sA, sB, 5);
        addMould(cb, F, sA, sB, STRING, LIME_TRIM, S.stone);
        addMould(cb, F, sA, sc - SIDE.half - 1.7, label(SIDE.spring), LIME_TRIM, S.stone);
        addMould(cb, F, sc + SIDE.half + 1.7, sB, label(SIDE.spring), LIME_TRIM, S.stone);
        addCorbelCourse(H, cb, F, sA, sB);
        for (const sg of [-1, 1]) addBlind(H, wb, cb, F, sc + sg * (SIDE.half + 1.25 + sB - sc) / 2);
      }
      await ctx.yield();
    }
  }
  // the high end: the great window of five lights over the same arcade and bench
  const xa = HALL.x0 + PIER_D, xb = HALL.x1 - PIER_D;
  const niches = [-1, 1].map((sg) => ({ s: sg * 17.4, half: 1.55, y0: 16.2, ys: 22.6, ya: 25.3, D: 0.95 }));
  addWallFace(H, wb, cb, panes, FE, HALL.x0, HALL.x1, A_TOP, top, [{ s: 0, half: GREAT.half, sill: GREAT.sill, spring: GREAT.spring, head: GREAT.head, lights: 5, transom: 20.4, noSill: true }], niches);
  await ctx.yield();
  addHighEnd(H, wb, cb, FE, niches);
  addArcade(H, wb, cb, FE, xa, xb, 15);
  addMould(cb, FE, xa, xb, STRING, LIME_TRIM, S.stone);
  // (this wall has no thin course at its window's springing: between the jambs and the corners stand the niches'
  // hoods and the blind windows, and no course crosses them)
  addCorbelCourse(H, cb, FE, xa, xb);
  for (const sg of [-1, 1]) addPier(H, wb, cb, FE, sg * 21.5, top, 9.3);     // a wall shaft either side of the great window, standing on the arcade
  await ctx.yield();
  // the low end: plain wall behind the screen and gallery, three lancets over one long sill
  addWallFace(H, wb, cb, panes, FW, -HALL.x1, -HALL.x0, 0, top, LANCETS.map((w) => ({ ...w, noSill: true })));
  addMould(cb, FW, -xb, -xa, [[0, 18.76], [0.26, 18.9], [0.4, 18.98], [0.4, 19.3], [0, 19.54]], LIME_TRIM, S.stone);
  addCorbelCourse(H, cb, FW, -xb, -xa);
  for (const sg of [-1, 1]) {                                      // a wall shaft either side of the three, and the thin course at their springing
    addPier(H, wb, cb, FW, sg * 21.5, top);
    addMould(cb, FW, Math.min(sg * xb, sg * (21.5 + PIER_HALF)), Math.max(sg * xb, sg * (21.5 + PIER_HALF)), label(LANCETS[0].spring), LIME_TRIM, S.stone);
    addMould(cb, FW, Math.min(sg * 17.3, sg * (21.5 - PIER_HALF)), Math.max(sg * 17.3, sg * (21.5 - PIER_HALF)), label(LANCETS[0].spring), LIME_TRIM, S.stone);
  }
  await ctx.yield();
  await ctx.yield();
  wb.tessellate(8, 0.04);
  await ctx.yield();
  const noise = ctx.core.makeNoise(ctx.core.hashSeed('hall:stone:' + ctx.seed));
  const wg = wb.build();
  await ctx.yield();
  bakeTone(wg, noise, 0.4);
  H.mesh(wg, H.matWall, 'hall-walls');
  await ctx.yield();
  const cg = cb.build();
  await ctx.yield();
  bakeTone(cg, noise, 0.12);
  H.mesh(cg, H.matProp, 'hall-carved');
  await ctx.yield();
  H.mesh(glassGeometry(H, panes), H.matGlass, 'hall-glass');
  await ctx.yield();
}

// A blind window drawn on a bare stretch of wall: an arch of roll mouldings over a field a tone deeper than the wall,
// its lights parted by mullions, a small arch closing each, and a roundel in the head.
function addBlindPanel(H, wb, cb, F, sc, half, y0, ys, ya, lights) {
  const { THREE, S } = H, out = openingPts(sc, half, y0, ys, ya, 7), lw = (2 * half) / lights, ring = [];
  const g = faceGeo(THREE, out, [], 0.05); put(wb, g, F.m, { c: '#c2c2c2' }); g.dispose();
  addBar(cb, F, out, 0.22, 0.5, 0.56, 0, LIME_TRIM, S.stone, true);
  for (let i = 1; i < lights; i++) addBar(cb, F, [[sc - half + i * lw, y0], [sc - half + i * lw, ys]], 0.13, 0.28, 0.36, 0.05, LIME_TRIM, S.stone);
  for (let j = 0; j < lights; j++) addBar(cb, F, openingPts(sc - half + (j + 0.5) * lw, lw / 2, ys - 0.2, ys - 0.2, ys + lw * 0.72, 4).slice(2), 0.12, 0.26, 0.34, 0.05, LIME_TRIM, S.stone);
  const cy = ys + (ya - ys) * 0.6, rr = (ya - ys) * 0.2;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.2832; ring.push([sc + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
  addBar(cb, F, ring, 0.12, 0.26, 0.34, 0.05, LIME_TRIM, S.stone, true);
}
// A boss of leaves on a wall (the capital's own leaves, small): k its size.
function addBoss(H, cb, F, s, y, d, k) {
  const cap = H.cap || (H.cap = leafCapital(H.THREE)), g = cap.leaves.clone(); g.scale(k, k, k);
  place(H, cb, F, g, s, y, d, { c: LIME_TRIM, surf: H.S.stone });
}
// The high end wall's own stonework about the great window: one more moulded order stepping into its reveal; a shaft
// with a leaf capital at either jamb, beside the foot of the window's hood; either side an empty niche on a moulded
// bracket under a gabled hood, with a boss of leaves at the hood's apex and one at the bracket's foot; in each outer
// field a blind window of three lights with a boss of leaves over it; bosses of leaves along the string course; and
// under the corbel course a band of five small blind arches a side.
function addHighEnd(H, wb, cb, F, niches) {
  const { THREE, S } = H, G = GREAT;
  { const grow = 0.46, d = -0.98;                             // (with the frame at the glass and the hood on the face: three in all)
    addBar(cb, F, openingPts(0, G.half + grow, G.sill - 1.67 * grow, G.spring, G.head + 1.05 * grow, 9), 0.2, 0.4, d + 0.42, d, LIME_TRIM, S.stone, true); }
  for (const sg of [-1, 1]) {
    const sj = sg * (G.half + 2.95), y0 = 12.4, yc = G.spring - 1.1;
    place(H, cb, F, new THREE.CylinderGeometry(0.42, 0.42, yc - y0, 10, 1, true, -Math.PI / 2, Math.PI), sj, (y0 + yc) / 2, 0.12, { c: LIME_TRIM, surf: S.stone });
    place(H, cb, F, new THREE.CylinderGeometry(0.5, 0.62, 0.7, 10, 1, false, -Math.PI / 2, Math.PI), sj, y0 + 0.35, 0.12, { c: LIME_TRIM, surf: S.stone });
    addCapital(H, cb, F, sj, yc, 0.12);
    for (const nc of niches) if (nc.s * sg > 0) {              // the niche's dress
      const o = openingPts(nc.s, nc.half, nc.y0, nc.ys, nc.ya, 6);
      addBar(cb, F, o, 0.15, 0.32, 0.4, 0, LIME_TRIM, S.stone, true);
      addMould(cb, F, nc.s - nc.half - 0.45, nc.s + nc.half + 0.45, [[0, nc.y0 - 1.25], [0.34, nc.y0 - 1.05], [0.72, nc.y0 - 0.5], [0.78, nc.y0 - 0.28], [0.78, nc.y0], [0, nc.y0 + 0.02]], LIME_TRIM, S.stone, true);
      addBar(cb, F, [[nc.s - nc.half - 0.75, nc.ys + 0.5], [nc.s, nc.ya + 2.1], [nc.s + nc.half + 0.75, nc.ys + 0.5]], 0.17, 0.4, 0.52, 0, LIME_TRIM, S.stone);
      addBoss(H, cb, F, nc.s, nc.ya + 2.0, 0.3, 0.5);
      addBoss(H, cb, F, nc.s, nc.y0 - 1.45, 0.2, 0.42);
    }
    addBlindPanel(H, wb, cb, F, sg * 27.6, 3.5, 15.4, 25.2, 31.2, 3);
    addBoss(H, cb, F, sg * 27.6, 34.2, 0.2, 0.6);
  }
  for (let k = -8; k <= 8; k++) { const sb = k * 3.72; if (Math.abs(Math.abs(sb) - 21.5) > 1.7) addBoss(H, cb, F, sb, 11.72, 0.22, 0.46); }
  for (const sg of [-1, 1]) for (const sc of [15.9, 18.7, 24.4, 27.6, 30.8]) {       // a band of small blind arches under the corbel course
    const o = openingPts(sg * sc, 1.05, 36.4, 39.5, 41.3, 4), g = faceGeo(THREE, o, [], 0.05);
    put(wb, g, F.m, { c: '#c2c2c2' }); g.dispose();
    addBar(cb, F, o, 0.12, 0.28, 0.36, 0, LIME_TRIM, S.stone, true);
  }
}

// ---- the table's line by metres along it: at(s) gives the place and heading s metres from its low end (tx, tz the
// heading toward the high end; rx, rz the right hand across it)
function makeTableLine() {
  const dz = 0.02, n = Math.round((TABLE.z0 - TABLE.z1) / dz), L = new Float32Array(n + 1);
  let px = tableX(TABLE.z0), len = 0;
  for (let i = 1; i <= n; i++) { const x = tableX(TABLE.z0 - i * dz); len += Math.hypot(x - px, dz); L[i] = len; px = x; }
  const at = (s) => {
    s = Math.min(Math.max(s, 0), len);
    let lo = 0, hi = n; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] < s) lo = m; else hi = m; }
    const f = (s - L[lo]) / Math.max(L[hi] - L[lo], 1e-9), z = TABLE.z0 - (lo + f) * dz, x = tableX(z);
    const d = (tableX(z + 0.01) - tableX(z - 0.01)) / 0.02, l = Math.hypot(d, 1), tx = -d / l, tz = -1 / l;
    return { s, x, z, tx, tz, rx: -tz, rz: tx, hw: TABLE.width / 2 };                 // (hw: half the plan's one width, everywhere)
  };
  return { length: len, at };
}

function boxAt(H, b, w, h, d, x, y, z, th, o) {
  const g = new H.THREE.BoxGeometry(w, h, d); if (th) g.rotateY(th); g.translate(x, y, z); b.add(g, o); g.dispose();
}

// ---- the one table: bare oak boards of three planks, mitred round the bends, on heavy trestles; straight plank benches
// set end to end along both sides. The oak's own space is turned a quarter so that the kit's grain runs down the hall.
async function buildTable(H) {
  const { THREE, INT, ctx, S } = H, line = H.line = makeTableLine(), rng = H.rngFor('boards');
  const ob = INT.makeBuilder(), top = TABLE.top, hw = TABLE.width / 2, th = 0.36;
  const n = Math.round(line.length / 2.4), st = []; for (let i = 0; i <= n; i++) st.push(line.at((i / n) * line.length));
  const P = (q, o, y, a = 0) => [q.x + q.rx * o + q.tx * a, y, q.z + q.rz * o + q.tz * a];
  const OAK = new THREE.Color('#8a8170'), tones = [];
  for (let k = 0; k <= n / 5 + 1; k++) tones.push([0, 1, 2].map(() => OAK.clone().multiplyScalar(rng.range(0.82, 1.1))));
  const E = (q, j) => [-1, -1 / 3, 1 / 3, 1][j] * q.hw + [0, -0.02, 0.03, 0][j];      // three boards across the plan's one width
  for (let i = 0; i < n; i++) {
    const a = st[i], q = st[i + 1], tn = tones[Math.floor(i / 5)], above = [a.x, 99, a.z];
    for (let j = 0; j < 3; j++) quadTo(ob, P(a, E(a, j), top), P(a, E(a, j + 1), top), P(q, E(q, j + 1), top), P(q, E(q, j), top), above, tn[j], S.oak);
    for (const sg of [-1, 1]) quadTo(ob, P(a, sg * a.hw, top), P(q, sg * q.hw, top), P(q, sg * q.hw, top - th), P(a, sg * a.hw, top - th), P(a, sg * 40, top), tn[sg < 0 ? 0 : 2].clone().multiplyScalar(0.7), S.oak);
    if (i && i % 5 === 0) quadTo(ob, P(a, -a.hw, top + 0.006, -0.035), P(a, a.hw, top + 0.006, -0.035), P(a, a.hw, top + 0.006, 0.035), P(a, -a.hw, top + 0.006, 0.035), above, '#2a2620', S.oakDull);
    if (i % 30 === 29) await ctx.yield();
  }
  for (const [q, sg] of [[st[0], -1], [st[n], 1]]) quadTo(ob, P(q, -q.hw, top), P(q, q.hw, top), P(q, q.hw, top - th), P(q, -q.hw, top - th), P(q, 0, top, sg * 40), '#6a6354', S.oak);
  // trestles: a foot beam across, two posts, a head rail
  const TR = '#5c5648', nt = Math.round(line.length / 5.6);
  for (let k = 0; k <= nt; k++) {
    const q = line.at(0.7 + (k / nt) * (line.length - 1.4)), a = Math.atan2(-q.rz, q.rx);
    boxAt(H, ob, 2 * q.hw + 0.3, 0.36, 0.44, q.x, 0.18, q.z, a, { c: TR, surf: S.oakDull });
    boxAt(H, ob, 2 * q.hw, 0.3, 0.38, q.x, top - th - 0.15, q.z, a, { c: TR, surf: S.oakDull });
    for (const sg of [-1, 1]) boxAt(H, ob, 0.34, top - th - 0.66, 0.34, q.x + q.rx * sg * (q.hw - 0.55), (top - th - 0.3 + 0.36) / 2, q.z + q.rz * sg * (q.hw - 0.55), a, { c: TR, surf: S.oakDull });
  }
  await ctx.yield();
  // benches: straight planks about 5 m long on two plank legs, a hand's gap between one and the next
  const BEN = new THREE.Color('#6b6557'), nb = Math.round(line.length / 5.3), bl = line.length / nb, seat = TABLE.bench, rb = H.rngFor('benches');
  for (const side of [-1, 1]) for (let k = 0; k < nb; k++) {
    const a = line.at(k * bl + 0.3), q = line.at((k + 1) * bl - 0.3), o0 = side * (a.hw + 1.0 + rb.range(-0.1, 0.12)), o1 = side * (q.hw + 1.0 + rb.range(-0.1, 0.12));
    const ax = a.x + a.rx * o0, az = a.z + a.rz * o0, qx = q.x + q.rx * o1, qz = q.z + q.rz * o1, len = Math.hypot(qx - ax, qz - az), ang = Math.atan2(-(qz - az), qx - ax);
    const c = BEN.clone().multiplyScalar(rb.range(0.84, 1.1));
    boxAt(H, ob, len, 0.15, 0.95, (ax + qx) / 2, seat - 0.075, (az + qz) / 2, ang, { c, surf: S.oak });
    for (const f of [0.12, 0.88]) boxAt(H, ob, 0.14, seat - 0.15, 0.8, lerp(ax, qx, f), (seat - 0.15) / 2, lerp(az, qz, f), ang, { c: '#565044', surf: S.oakDull });
    if (k % 12 === 11) await ctx.yield();
  }
  const g = ob.build(); g.applyMatrix4(new THREE.Matrix4().makeRotationY(-Math.PI / 2));
  H.mesh(g, H.matProp, 'hall-oak').rotation.y = Math.PI / 2;
  await ctx.yield();
}

// ---- the hearth on the open floor: a low eight-sided kerb, a bed of ash and embers, a pair of iron firedogs, seven
// great logs burning, and the flames (the kit's). Its sparks, smoke and light are the air's.
async function buildHearth(H) {
  const { THREE, INT, ctx, S } = H, rng = H.rngFor('hearth'), hb = INT.makeBuilder(), cx = HEARTH.x, cz = HEARTH.z;
  const ap = HEARTH.across / 2, R1 = ap / Math.cos(Math.PI / 8), R0 = R1 - 1.25, hk = 0.24, mid = [cx, 0.1, cz];
  const ring = (R, y) => Array.from({ length: 8 }, (_, i) => { const a = (i + 0.5) * Math.PI / 4; return [cx + R * Math.cos(a), y, cz + R * Math.sin(a)]; });
  const o0 = ring(R1, 0), o1 = ring(R1, hk - 0.08), o2 = ring(R1 - 0.1, hk), i2 = ring(R0 + 0.1, hk), i0 = ring(R0, 0.06);
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8, tone = 0.9 + 0.1 * rng();
    const kerb = new THREE.Color('#3f3933').multiplyScalar(tone), sooty = new THREE.Color('#2e2925').multiplyScalar(tone);
    quadTo(hb, o0[i], o0[j], o1[j], o1[i], mid, kerb, S.stone, true);
    quadTo(hb, o1[i], o1[j], o2[j], o2[i], mid, kerb, S.stone, true);
    quadTo(hb, o2[i], o2[j], i2[j], i2[i], [cx, 60, cz], sooty, S.stone);
    quadTo(hb, i2[i], i2[j], i0[j], i0[i], [cx, 0.5, cz], '#1c1815', S.stone);
  }
  const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const ASH = [0.022, 0.019, 0.017], COAL = [1.0, 0.22, 0.03], CHAR = [0.012, 0.009, 0.007];
  { // the bed: grey ash, brightest coals under the stack
    const g = new THREE.RingGeometry(0.02, R0 + 0.06, 36, 8); g.rotateX(-Math.PI / 2); g.translate(cx, 0.14, cz);
    const pa = g.attributes.position, C = new Float32Array(pa.count * 3), F = new Float32Array(pa.count * 4);
    for (let i = 0; i < pa.count; i++) {
      const r = Math.hypot(pa.getX(i) - cx, pa.getZ(i) - cz), dA = rng(), dE = rng(), rim = sat((r - 2.3) / 0.7);
      const glow = Math.max(sat(1.5 - r / 2.3) * (0.35 + 0.65 * dA), rim * (dE < 0.2 ? 0.45 + 0.5 * dA : 0));     // (embers lie scattered in the ash)
      pa.setY(i, 0.08 + 0.42 * Math.max(0, 1 - (r / R0) * (r / R0)) * (0.7 + 0.3 * rng()));
      C.set(mixc(mixc(ASH, [0.12, 0.115, 0.108], rim * (0.5 + 0.5 * dE)), COAL, glow), i * 3); F.set([0.1, 0, glow * 3.6, 1], i * 4);
    }
    g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.setAttribute('surf', new THREE.BufferAttribute(F, 4));
    hb.add(g); g.dispose();
  }
  const IRON = '#151312';
  // the firedogs: a low bar that rests on one foot and, at one end (opposite ends of the pair), on a tall upright with
  // a collar and a knop, standing clear of the logs. Every part of a dog stands inside the kerb: the kerb's inner face
  // is 2.85 m from the hearth's middle where it comes nearest (at its foot, square to a side), and the nearest part of
  // a dog, its knop, is 0.14 m inside that face (the collar's corner 0.15, the upright's 0.26, the bar's end 0.32)
  for (const sx of [-1, 1]) {
    const x = cx + sx * 1.1, ze = cz + sx * 2.25;
    boxAt(H, hb, 0.24, 0.22, 4.7, x, 0.5, cz, 0, { c: IRON, surf: S.iron });
    boxAt(H, hb, 0.3, 0.4, 0.3, x, 0.2, cz - sx * 1.5, 0, { c: IRON, surf: S.iron });           // (one foot: the upright is the other)
    boxAt(H, hb, 0.3, 2.3, 0.3, x, 1.15, ze, 0, { c: IRON, surf: S.iron });
    boxAt(H, hb, 0.46, 0.14, 0.46, x, 1.7, ze, 0, { c: IRON, surf: S.iron });
    const k = new THREE.SphereGeometry(0.34, 8, 6); k.translate(x, 2.52, ze); hb.add(k, { c: IRON, surf: S.iron }); k.dispose();
  }
  await ctx.yield();
  // the logs: unequal lengths thrown askew into the fire, low on the dogs' bars and on the bed, burning. A log is
  // charred on top (the shader breaks the char with bright seams), and glows at its ends, along its underside and
  // wherever it lies in the heart of the fire. heat (0..1) goes to the shader as the surface's emissive.
  const heart = new THREE.Vector3(cx, 0.9, cz), p = new THREE.Vector3(), nr = new THREE.Vector3(), ax = new THREE.Vector3();
  const log = (len, r, x, y, z, ry, rz) => {
    const g = new THREE.CylinderGeometry(r * rng.range(0.78, 0.95), r, len, 10, 7), pa = g.attributes.position, na = g.attributes.normal, ph = rng.range(0, 6);
    const along = new Float32Array(pa.count);
    for (let i = 0; i < pa.count; i++) {
      const a = Math.atan2(pa.getZ(i), pa.getX(i)), yy = pa.getY(i), k = 1 + 0.08 * Math.sin(3 * a + yy * 1.7 + ph) + 0.05 * Math.sin(5 * a - yy * 2.3 + ph);
      pa.setX(i, pa.getX(i) * k); pa.setZ(i, pa.getZ(i) * k); along[i] = Math.abs(yy) / (len / 2);
    }
    g.rotateZ(Math.PI / 2 + rz); g.rotateY(ry); g.translate(x, y, z);
    ax.set(Math.cos(rz), Math.sin(rz), 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry);
    const C = new Float32Array(pa.count * 3), F = new Float32Array(pa.count * 4);
    for (let i = 0; i < pa.count; i++) {
      p.fromBufferAttribute(pa, i); nr.fromBufferAttribute(na, i);
      const near = sat(1.5 - Math.hypot(p.x - cx, p.z - cz) / 2.6), cap = Math.abs(nr.dot(ax)) > 0.7 ? 1 : 0;
      const under = sat(-nr.y * 1.3 + 0.15), end = sat((along[i] - 0.72) / 0.28);
      const heat = sat(Math.max(under * (0.45 + 0.55 * near), end * 0.8, cap * 0.95, 0.09 + 0.2 * near * rng()) * (0.75 + 0.5 * rng()));
      C.set(mixc(mixc(CHAR, [0.03, 0.022, 0.017], rng()), COAL, heat * heat), i * 3); F.set([0.12, 0, heat * 3.4, 1], i * 4);
    }
    g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.setAttribute('surf', new THREE.BufferAttribute(F, 4));
    hb.add(g); g.dispose();
  };
  // three long ones across the dogs' bars, every one bearing on both bars, each askew by its own angle and stuck out
  // unevenly (the thinner middle one lies between the other two with no play of its own across the bars, so that it
  // stands in neither whatever they are dealt); two shorter ones thrown across them, tilted down into the gaps; two
  // short ends lying in the embers at the sides
  const yBar = 0.61, lay = [[5.5, 0.44, -0.5, -1.25, 0.3, 1], [4.1, 0.34, 0.1, 0.05, 0.2, 0], [4.7, 0.47, -0.2, 1.5, 0.16, 1]];
  let topY = 0;
  for (const [len, r, dx, dz, yaw, play] of lay) {
    const rr = r * rng.range(0.92, 1.06); topY = Math.max(topY, yBar + 2 * rr);
    log(len * rng.range(0.95, 1.05), rr, cx + dx + rng.range(-0.15, 0.15), yBar + rr, cz + dz + play * rng.range(-0.12, 0.12), yaw + play * rng.range(-0.06, 0.06), rng.range(-0.02, 0.02));
  }
  for (const [len, r, dx, dz, yaw, tilt] of [[3.4, 0.36, -0.75, 0.25, 1.25, 0.2], [2.7, 0.33, 0.9, -0.5, 1.95, -0.16]]) {
    log(len * rng.range(0.95, 1.05), r, cx + dx, topY + r * 0.55 + 0.1, cz + dz, yaw + rng.range(-0.08, 0.08), tilt);
  }
  for (const [len, r, phi] of [[2.3, 0.3, 2.5 + rng.range(-0.2, 0.2)], [1.9, 0.27, 5.5 + rng.range(-0.2, 0.2)]]) {
    log(len, r, cx + 2.35 * Math.cos(phi), 0.5 + r * 0.5, cz + 2.35 * Math.sin(phi), -phi + 1.2, 0.07);
  }
  { // the log pile: split lengths stacked in tiers, bark outside and pale cut ends. ITS PLACE, by rule: on the screen's
    // side of the hearth (the wood comes in by the middle doorway), its near face PILE_GAP clear of the hearth stones'
    // edge; beside the way from that doorway, its inner end WAY_HALF from the hall's axis, on the side of the hearth
    // that the table does not pass
    const PILE_GAP = 0.7, WAY_HALF = 1.8, LOG = 3.3, TIERS = [6, 5, 3], wide = TIERS[0] * 0.9, sd = tableX(cz) > cx ? -1 : 1;
    const px = cx + sd * (WAY_HALF + wide / 2), pz = cz + HEARTH_STONES + PILE_GAP + LOG / 2, BARK = new THREE.Color('#57524a'), CUT = new THREE.Color('#b5aa8e');
    TIERS.forEach((n, j) => { for (let i = 0; i < n; i++) {
      const r = rng.range(0.38, 0.46), len = rng.range(2.8, LOG), x = px + (i - (n - 1) / 2) * 0.9 + rng.range(-0.05, 0.05), y = 0.44 + j * 0.78, z = pz + rng.range(-0.15, 0.15);
      const g = new THREE.CylinderGeometry(r, r, len, 8, 1, true); g.rotateX(Math.PI / 2); g.translate(x, y, z); hb.add(g, { c: BARK.clone().multiplyScalar(rng.range(0.8, 1.2)), surf: S.oakDull }); g.dispose();
      for (const sg of [-1, 1]) { const e = new THREE.CircleGeometry(r, 8); if (sg < 0) e.rotateY(Math.PI); e.translate(x, y, z + sg * len / 2); hb.add(e, { c: CUT.clone().multiplyScalar(rng.range(0.8, 1.1)), surf: S.oakDull }); e.dispose(); }
    } });
  }
  // the bed and the logs' coals breathe: a dark crust fixed on the coal, a draught of brighter heat moving across it
  const mat = INT.propMaterial({ rig: H.rig, scale: 3 }), clock = H.glassU.uHallClock, base = mat.onBeforeCompile, key = mat.customProgramCacheKey;
  mat.onBeforeCompile = (shader, renderer) => {
    base(shader, renderer);
    shader.uniforms.uHallClock = clock;
    shader.fragmentShader = shader.fragmentShader.replace('#include <packing>', '#include <packing>\nuniform float uHallClock;')
      .replace('#include <alphamap_fragment>', EMBER_MAIN + '\n#include <alphamap_fragment>')
      .replace('#include <opaque_fragment>', PILE_OUT + '\n#include <opaque_fragment>');
  };
  mat.customProgramCacheKey = () => key() + ':hall-ember';
  H.mesh(hb.build(), mat, 'hall-hearth');
  await ctx.yield();
  // the flames: a low broad body from every side, many tall single tongues among the logs, sparks that rise and die
  const fr = H.rngFor('flames'), fires = [], topF = HEARTH.flameTop;
  for (let i = 0; i < 3; i++) fires.push({ position: [cx + fr.range(-0.3, 0.3), fr.range(0.5, 0.9), cz + (i - 1) * 1.0], width: 3.4, height: 3.0, tongues: 2, embers: 0 });
  for (let i = 0; i < 11; i++) {
    const a = fr.range(0, 6.2832), rr = 0.4 + 1.3 * Math.sqrt(fr()), y = fr.range(0.4, 1.5);
    fires.push({ position: [cx + rr * Math.cos(a), y, cz + rr * Math.sin(a)], width: fr.range(2.3, 3.4), height: (topF - y) / 0.7, tongues: 1, embers: 0 });
  }
  for (const sx of [-1, 1]) fires.push({ position: [cx + sx * 0.7, 0.9, cz], width: 3.4, height: 2.6, tongues: 0, embers: 60 });
  const fl = INT.makeFlames({ fires, rng: fr, gain: 0.85 });
  H.group.add(fl.object); H.tris += fl.triangles; H.calls += 1; H.ticks.push((dt, time) => fl.update(dt, time));
  await ctx.yield();
}

// the stacked firewood (the only wood surface in the hearth's material) keeps half its colour in the firelight, as the
// hall's other oak does (WOOD_OUT), so that it reads as brown bark and pale cut ends and not as red
const PILE_OUT = /* glsl */`
{ float pw=step(1.,vSurf.x)*step(vSurf.x,1.999), pl=dot(outgoingLight,vec3(.35,.5,.15)); outgoingLight=mix(outgoingLight,vec3(pl),.5*pw); }
`;
const EMBER_MAIN = /* glsl */`
{
  vec3 hp=vObjPos*1.7; float ht=uHallClock;
  float crust=i_n2(hp.xz*2.1+hp.y*1.3);
  float breath=i_n2(hp.xz*.55+vec2(ht*.6,-ht*.45))*.7+i_n2(hp.zx*1.4+vec2(-ht*1.3,ht*.9))*.3;
  // how hot the piece is here (its emissive): hot wood and coal glow under a dark crust; cooler char is black, broken
  // by thin bright seams that widen with the heat
  float heat=clamp(vSurf.z*.29,0.,1.), hot=smoothstep(.3,.7,heat), warmK=smoothstep(.02,.1,heat);
  float rid=abs(i_n2(hp.xz*1.9+hp.y*2.3+7.)-.5)*2., seam=(1.-smoothstep(.03,.1+.35*heat,rid))*warmK;
  iEmis=mix(vec3(2.4,.6,.07)*seam, iEmis*mix(.3,1.5,smoothstep(.3,.7,crust)), hot)*(.45+1.3*breath);
  diffuseColor.rgb=mix(diffuseColor.rgb, vec3(.014,.011,.009)*(.6+.8*crust), warmK*(1.-hot));
}
`;

// ---- the setting. Every kind of dish is one geometry, drawn many times (place, turn, size and tint per piece).
// Sizes are three times life, as the hall is. Profiles run from the foot's centre out, up the outside, over the rim and
// down the inside. A part whose surface carries -1 keeps its own colour whatever the piece's tint.
function dishGeometries(H) {
  const { THREE, INT } = H, G = {}, W = '#ffffff';
  const PEW = INT.surf(0, 0.74, 0.8), CLAY = INT.surf(0, 0.6), CRUST = INT.surf(0, 0.14), RIND = INT.surf(0, 0.3), HORN = INT.surf(0, 0.5), WOOD = INT.surf(1, 0.2);
  const own = (sf) => [sf[0], sf[1], -1, sf[3]];
  const lathe = (b, pts, seg, c, sf, o) => { const g = new THREE.LatheGeometry(pts.map((q) => new THREE.Vector2(Math.max(q[0], 1e-3), q[1])), seg); b.add(g, { c, surf: sf, ...o }); g.dispose(); };
  const disc = (b, r, y, c, sf) => { const g = new THREE.CircleGeometry(r, 10); g.rotateX(-Math.PI / 2); g.translate(0, y, 0); b.add(g, { c, surf: sf }); g.dispose(); };
  const handle = (b, R, tube, x, y, sf) => { const g = new THREE.TorusGeometry(R, tube, 5, 8, Math.PI); g.rotateZ(-Math.PI / 2); g.translate(x, y, 0); b.add(g, { c: W, surf: sf }); g.dispose(); };
  const ball = (b, r, x, y, z, sx, sy, sz, c, sf, o) => { const g = new THREE.SphereGeometry(r, o && o.ws || 12, o && o.hs || 7); g.scale(sx, sy, sz); g.translate(x, y, z); b.add(g, { c, surf: sf, ...(o || {}) }); g.dispose(); };
  let b = INT.makeBuilder();
  { const g = new THREE.BoxGeometry(0.76, 0.08, 0.76); g.translate(0, 0.04, 0); b.add(g, { c: W, surf: WOOD }); g.dispose(); }
  G.trencher = b.build();
  b = INT.makeBuilder(); lathe(b, [[0, 0], [0.27, 0], [0.31, 0.05], [0.45, 0.085], [0.455, 0.1], [0.31, 0.075], [0.27, 0.04], [0, 0.04]], 16, W, PEW); G.plate = b.build();
  b = INT.makeBuilder(); lathe(b, [[0, 0], [0.15, 0], [0.18, 0.03], [0.29, 0.2], [0.315, 0.245], [0.3, 0.25], [0.27, 0.2], [0.15, 0.07], [0, 0.06]], 14, W, PEW); G.bowl = b.build();
  b = INT.makeBuilder(); lathe(b, [[0, 0], [0.2, 0], [0.205, 0.035], [0.175, 0.07], [0.165, 0.5], [0.185, 0.525], [0.15, 0.525], [0.148, 0.45]], 12, W, PEW);
  disc(b, 0.15, 0.452, '#3a2713', own(CLAY)); handle(b, 0.15, 0.03, 0.17, 0.27, PEW); G.tankard = b.build();
  b = INT.makeBuilder(); lathe(b, [[0, 0], [0.11, 0], [0.12, 0.02], [0.158, 0.46], [0.142, 0.46], [0.125, 0.38]], 10, W, HORN, { grad: [0, 0.46, 0.4, 1.12] });
  disc(b, 0.126, 0.382, '#2a1c0e', own(CLAY)); G.horn = b.build();
  b = INT.makeBuilder(); lathe(b, [[0, 0], [0.2, 0], [0.225, 0.03], [0.33, 0.28], [0.34, 0.42], [0.26, 0.62], [0.17, 0.76], [0.2, 0.93], [0.225, 0.955], [0.17, 0.93], [0.14, 0.8]], 14, W, CLAY, { grad: [0, 0.3, 0.72, 1] });
  disc(b, 0.142, 0.802, '#241509', own(CLAY)); handle(b, 0.2, 0.04, 0.27, 0.6, CLAY); G.jug = b.build();
  b = INT.makeBuilder(); lathe(b, [[0, 0], [0.26, 0], [0.3, 0.04], [0.4, 0.3], [0.38, 0.5], [0.33, 0.56], [0.37, 0.61], [0.36, 0.64], [0.3, 0.69], [0.12, 0.76], [0.05, 0.77], [0.05, 0.83], [0.09, 0.87], [0.07, 0.91], [0, 0.92]], 14, W, CLAY, { grad: [0, 0.35, 0.7, 1] });
  for (const sx of [-1, 1]) { const g = new THREE.BoxGeometry(0.12, 0.08, 0.2); g.translate(sx * 0.42, 0.44, 0); b.add(g, { c: W, surf: CLAY }); g.dispose(); }
  G.crock = b.build();
  b = INT.makeBuilder(); lathe(b, [[0, 0], [0.26, 0], [0.27, 0.04], [0.2, 0.1], [0.1, 0.16], [0.08, 0.3], [0.12, 0.36], [0.24, 0.42], [0.27, 0.6], [0.295, 0.62], [0.27, 0.66], [0.18, 0.84], [0.07, 0.94], [0.04, 1.0], [0.085, 1.06], [0.06, 1.12], [0, 1.15]], 12, W, PEW); G.salt = b.build();
  // a loaf: a bread-brown crust and a pale floury crown (the piece's own tint is the flour's cream)
  const bake = (x, y, z, c) => { const t = sat((y - 0.1) / 0.24), k = t * t; c.r *= lerp(0.45, 0.94, k); c.g *= lerp(0.36, 0.93, k); c.b *= lerp(0.27, 0.9, k); };
  b = INT.makeBuilder(); ball(b, 0.36, 0, 0.165, 0, 1, 0.5, 1, W, CRUST, { tint: bake });
  { const g = new THREE.BoxGeometry(0.5, 0.02, 0.05); g.rotateY(0.4); g.translate(0, 0.342, 0); b.add(g, { c: '#7a6a50', surf: own(CRUST) }); g.dispose(); }      // one cut across the crown
  G.loaf = b.build();
  b = INT.makeBuilder(); ball(b, 0.34, 0, 0.15, 0, 1.85, 0.46, 0.64, W, CRUST, { tint: bake, ws: 10, hs: 6 });
  for (const dx of [-0.3, 0, 0.3]) { const g = new THREE.BoxGeometry(0.05, 0.02, 0.3); g.rotateY(0.5); g.translate(dx, 0.305, 0); b.add(g, { c: '#7a6a50', surf: own(CRUST) }); g.dispose(); }
  G.long = b.build();
  b = INT.makeBuilder(); lathe(b, [[0, 0], [0.42, 0], [0.47, 0.05], [0.478, 0.17], [0.47, 0.29], [0.42, 0.34], [0, 0.34]], 16, W, RIND, { grad: [0.2, 0.34, 1, 0.84] }); G.wheel = b.build();
  { // a wedge cut from such a wheel: pale paste on the two cut faces, rind on the back and top
    b = INT.makeBuilder(); const R = 0.47, hh = 0.34, a0 = -0.42, a1 = 0.42, am = 0, P = (a, y) => [R * Math.cos(a), y, R * Math.sin(a)], O0 = [0, 0, 0], O1 = [0, hh, 0], PASTE = '#efe8d2';
    quadTo(b, O0, P(a0, 0), P(a0, hh), O1, [0, 0.2, -9], PASTE, own(RIND)); quadTo(b, O0, P(a1, 0), P(a1, hh), O1, [0, 0.2, 9], PASTE, own(RIND));
    quadTo(b, P(a0, 0), P(am, 0), P(am, hh), P(a0, hh), [9, 0.2, 0], W, RIND); quadTo(b, P(am, 0), P(a1, 0), P(a1, hh), P(am, hh), [9, 0.2, 0], W, RIND);
    quadTo(b, O1, P(a0, hh), P(am, hh), P(a1, hh), [0, 9, 0], '#d8d0c0', RIND); G.wedge = b.build();
  }
  b = INT.makeBuilder(); lathe(b, [[0, 0], [0.3, 0], [0.5, 0.06], [0.525, 0.085], [0.3, 0.055], [0, 0.05]], 14, W, WOOD);
  { const AP = ['#6f5136', '#86983c', '#7b8f3a', '#a8a046', '#74573a', '#8ea046', '#96a04a', '#7f9238', '#6b4e33'];      // green and russet
    for (let i = 0; i < 9; i++) { const top = i >= 6, a = i * (top ? 2.094 : 1.047) + (top ? 0.5 : 0), rr = top ? 0.14 : 0.29; ball(b, 0.135, rr * Math.cos(a), top ? 0.37 : 0.175, rr * Math.sin(a), 1, 0.92, 1, AP[i], own(RIND), { ws: 6, hs: 4 }); } }
  G.apples = b.build();
  b = INT.makeBuilder(); lathe(b, [[0, 0], [0.4, 0], [0.44, 0.03], [0.46, 0.2], [0.485, 0.245], [0.45, 0.275], [0.4, 0.245], [0.2, 0.3], [0, 0.315]], 16, W, CRUST, { tint: (x, y, z, c) => { const r = Math.hypot(x, z); c.multiplyScalar(r > 0.38 ? 0.8 : lerp(0.86, 1.08, r / 0.38)); } });
  for (let i = 0; i < 3; i++) { const g = new THREE.BoxGeometry(0.16, 0.02, 0.04); g.rotateY(i * 2.094); g.translate(0.1 * Math.cos(i * 2.094 + 1.57), 0.31, -0.1 * Math.sin(i * 2.094 + 1.57)); b.add(g, { c: '#3a3024', surf: own(CRUST) }); g.dispose(); }
  G.pie = b.build();
  // the great things down the middle of the board, made to tell from the height of the flight
  const CHARGER = [[0, 0], [0.38, 0], [0.44, 0.05], [0.64, 0.1], [0.66, 0.125], [0.44, 0.09], [0.38, 0.05], [0, 0.05]], MEAT = INT.surf(0, 0.5), FRUIT = ['#6f5136', '#86983c', '#b7b04a', '#7b8f3a', '#a8a046', '#74573a', '#b9ad4c', '#96a04a', '#7f9238', '#6b4e33', '#b3a644'];
  b = INT.makeBuilder(); lathe(b, CHARGER, 14, W, PEW);                                   // a joint on a pewter charger, with its bone and a few onions
  ball(b, 0.34, -0.04, 0.33, 0, 1.45, 0.78, 1.0, '#5e5143', own(MEAT), { ws: 8, hs: 6, tint: (x, y, z, c) => c.multiplyScalar(lerp(0.75, 1.2, sat((y - 0.1) / 0.5))) });
  { const g = new THREE.CylinderGeometry(0.05, 0.07, 0.34, 6); g.rotateZ(Math.PI / 2 - 0.25); g.translate(0.56, 0.42, 0); b.add(g, { c: '#e8dfc8', surf: own(RIND) }); g.dispose(); }
  for (let i = 0; i < 5; i++) { const a = 1.2 + i * 0.9; ball(b, 0.1, 0.47 * Math.cos(a), 0.17, 0.47 * Math.sin(a), 1, 0.85, 1, i % 2 ? '#b3a67c' : '#b9c07a', own(RIND), { ws: 6, hs: 4 }); }
  G.joint = b.build();
  b = INT.makeBuilder();                                                                  // a standing bowl heaped with apples and pears
  lathe(b, [[0, 0], [0.3, 0], [0.31, 0.04], [0.12, 0.1], [0.09, 0.3], [0.14, 0.36], [0.52, 0.52], [0.56, 0.58], [0.5, 0.56], [0.12, 0.44], [0, 0.44]], 14, W, PEW);
  for (let i = 0; i < 11; i++) {
    const lvl = i < 7 ? 0 : i < 10 ? 1 : 2, n = [7, 3, 1][lvl], a = (i - [0, 7, 10][lvl]) * (6.2832 / n) + lvl * 0.5, rr = [0.33, 0.16, 0][lvl], pear = i % 4 === 2;
    ball(b, 0.15, rr * Math.cos(a), [0.64, 0.84, 1.0][lvl] + (pear ? 0.03 : 0), rr * Math.sin(a), pear ? 0.86 : 1, pear ? 1.3 : 0.92, pear ? 0.86 : 1, FRUIT[i], own(RIND), { ws: 6, hs: 4 });
  }
  G.fruit = b.build();
  b = INT.makeBuilder();                                                                  // a lidded pewter flagon
  lathe(b, [[0, 0], [0.3, 0], [0.31, 0.05], [0.25, 0.12], [0.22, 0.48], [0.26, 0.76], [0.2, 0.92], [0.17, 0.98], [0.21, 1.02], [0.13, 1.08], [0.05, 1.1], [0.05, 1.13], [0, 1.14]], 12, W, PEW);
  handle(b, 0.27, 0.04, 0.24, 0.62, PEW); G.flagon = b.build();
  return G;
}

// How richly the table is laid at z: richest where it bends past the hearth and where it swings in under the low
// pass (places in the hall), plainer between and toward both ends.
const richAt = (z) => 0.3 + 0.7 * Math.max(sstep(-62, -56, z) * (1 - sstep(-36, -30, z)), sstep(-102, -96, z) * (1 - sstep(-70, -64, z)));

async function buildSetting(H) {
  const { THREE, ctx } = H, G = dishGeometries(H), rng = H.rngFor('dishes'), line = H.line, L = line.length, lay = {}, steam = [];
  await ctx.yield();
  for (const k in G) lay[k] = [];
  const col = (hex, d, spread = 0.26) => new THREE.Color(hex).multiplyScalar(1 - spread / 2 + spread * d);
  const PEWTER = '#a0a3a8', TINTS = {
    loaf: (d) => col('#d6cdb6', d, 0.16), long: (d) => col('#d6cdb6', d, 0.16), pie: (d) => col('#b9a886', d, 0.2), wheel: (d) => col('#e2dcc6', d, 0.12), wedge: (d) => col('#e2dcc6', d, 0.12),
    joint: (d) => col(PEWTER, d, 0.14), fruit: (d) => col(PEWTER, d, 0.14), flagon: (d) => col(PEWTER, d, 0.14),
    jug: (d, e) => col(e < 0.55 ? '#4a4744' : '#66605a', d), crock: (d, e) => col(e < 0.5 ? '#45423f' : '#5c5449', d), apples: (d) => col('#8c8168', d), salt: (d) => col(PEWTER, d, 0.14),
  };
  const RICH = [['loaf', 1.7], ['long', 1.2], ['jug', 1.0], ['flagon', 2.2], ['crock', 2.0], ['wheel', 1.2], ['wedge', 0.6], ['apples', 0.8], ['fruit', 1.9], ['joint', 2.0], ['pie', 1.6], [null, 0.3]];
  const BIG = { loaf: 1.4, long: 1.35, wheel: 1.2, pie: 1.3, apples: 1.2, jug: 1.15, crock: 1.2 };
  const PLAIN = [['loaf', 2.0], ['long', 1], ['jug', 1.0], ['flagon', 1.1], ['wedge', 0.8], ['apples', 0.7], ['fruit', 0.4], ['joint', 0.4], ['crock', 0.3], [null, 2.0]];
  const pick = (tab, d) => { let sum = 0; for (const t of tab) sum += t[1]; let x = d * sum; for (const t of tab) { x -= t[1]; if (x <= 0) return t[0]; } return null; };
  // no piece stands through its neighbour and none hangs over the board: every piece laid keeps its footprint (round,
  // its kind's reach at size 1 times its size; the trencher a square turned by its own turn), and a new piece that
  // would stand in one already laid is tried a little further along the board, and left out if no try is clear. The
  // middle line is laid first, so the places give way to it. The dice are all drawn before any test.
  const REACH = { trencher: 0.54, plate: 0.46, bowl: 0.32, tankard: 0.35, horn: 0.17, jug: 0.5, crock: 0.5, salt: 0.3, loaf: 0.37, long: 0.64, wheel: 0.48, wedge: 0.48, apples: 0.53, pie: 0.49, joint: 0.7, fruit: 0.57, flagon: 0.52 };
  const laid = [], done = [0, 0], GAP = 0.03, SQ = 0.38, ALONG = [0, 0.4, 0.8], ASIDE = [0, 0.3, -0.3, 0.6, -0.6];
  const toSquare = (dx, dz, h, cs, sn) => Math.hypot(Math.max(Math.abs(dx * cs - dz * sn) - h, 0), Math.max(Math.abs(dx * sn + dz * cs) - h, 0));
  const clear = (x, z, r, h, cs, sn) => {
    for (const f of laid) {
      const dx = x - f[0], dz = z - f[1];
      if (f[3] > 0 && h === 0) { if (toSquare(dx, dz, f[3], f[4], f[5]) < r + GAP) return false; }
      else if (h > 0 && f[3] === 0) { if (toSquare(-dx, -dz, h, cs, sn) < f[2] + GAP) return false; }
      else { const rr = f[2] + r + GAP; if (dx * dx + dz * dz < rr * rr) return false; }
    }
    return true;
  };
  const put = (kind, q, across, along, rot, size, tint, tries) => {
    const r = REACH[kind] * size, h = kind === 'trencher' ? SQ * size : 0, cs = Math.cos(rot), sn = Math.sin(rot);
    if (Math.abs(across) + (h > 0 ? 1.2 * h : r) > TABLE.width / 2) return false;
    for (const sh of tries) {
      const sa = q.s + along + sh, x = q.x + q.rx * across + q.tx * (along + sh), z = q.z + q.rz * across + q.tz * (along + sh);
      if (sa < r + 0.06 || sa > L - r - 0.06 || !clear(x, z, r, h, cs, sn)) continue;
      lay[kind].push([x, z, rot, size, tint]); laid.push([x, z, r, h, cs, sn]); done[0] = x; done[1] = z; return true;
    }
    return false;
  };
  // down the middle of the board: bread, jugs, cheese, apples, pies, pots, and a tall covered salt every so often (the
  // next is due 27 m on where the table is plain, 10.5 m where it is richly laid, and takes the first dealt step from
  // there; the first is due a dealt part of that distance from the low end); set closer, and the greater pieces
  // greater, where the table is richly laid. The standing bowl of fruit is the tallest piece (1.225 to the top of its
  // topmost pear at size 1): its size is capped so that its top stays under the plan's dressTop
  const FRUIT_CAP = (TABLE.dressTop - 0.02 - (TABLE.top + 0.004)) / 1.225;
  let nextSalt = 1.1 + rng() * lerp(27, 10.5, sat((richAt(line.at(1.1).z) - 0.3) / 0.7));
  for (let s = 1.1; s < L - 1.0;) {
    const q = line.at(s), R = richAt(q.z), k = sat((R - 0.3) / 0.7), d1 = rng(), d2 = rng(), d3 = rng(), d4 = rng(), d5 = rng(), d6 = rng(), d7 = rng();
    let kind = pick(R > 0.6 ? RICH : PLAIN, d1);
    if (s >= nextSalt) { kind = 'salt'; nextSalt = s + lerp(27, 10.5, k); }
    if (kind) {
      const off = kind === 'salt' || kind === 'joint' ? 0 : (d2 - 0.5) * 0.4, size = Math.min((0.92 + 0.2 * d4) * lerp(1, BIG[kind] || 1, 0.45 + 0.55 * k), kind === 'fruit' ? FRUIT_CAP : 9);
      if (put(kind, q, off, 0, d3 * 6.2832, size, TINTS[kind](d5, d7), ALONG) && kind === 'crock' && R > 0.6 && d7 < 0.8) steam.push([done[0], done[1]]);
    }
    s += lerp(2.5, 1.3, k) * (0.85 + 0.3 * d6);
  }
  await ctx.yield();
  // the places down both sides (their own stream): a square trencher (a pewter plate at the richer stretches), often a
  // bowl, a tankard or a horn cup
  const rp = H.rngFor('places');
  for (const side of [-1, 1]) for (let s = 1.3 + (side > 0 ? 0.5 : 0); s < L - 1.2; s += 1.95) {
    const d1 = rp(), d2 = rp(), d3 = rp(), d4 = rp(), d5 = rp(), d6 = rp(), d7 = rp(), d8 = rp();
    const q = line.at(s + (d2 - 0.5) * 0.3), R = richAt(q.z), k = sat((R - 0.3) / 0.7), head = Math.atan2(-q.tz, q.tx);
    if (d1 > lerp(0.78, 1, k)) continue;
    if (k > 0.5 && d4 < 0.5) put('plate', q, side * 0.97, 0, d3 * 6.2832, 0.98 + 0.1 * d7, col(PEWTER, d5, 0.16), ASIDE);
    else put('trencher', q, side * 0.98, 0, head + (d3 - 0.5) * 0.36, 0.95 + 0.12 * d7, col('#a99a7c', d5), ASIDE);
    if (d6 < lerp(0.22, 0.6, k)) put('bowl', q, side * 0.95, -0.8, d3 * 6.2832, 0.95 + 0.12 * d5, col(PEWTER, d7, 0.16), ASIDE);
    if (d8 < lerp(0.3, 0.52, k)) put('tankard', q, side * 0.84, 0.82, d5 * 6.2832, 0.94 + 0.14 * d3, col(PEWTER, d6, 0.16), ASIDE);
    else if (d8 < 0.92) put('horn', q, side * 0.84, 0.74, d5 * 6.2832, 0.9 + 0.25 * d3, col('#c6b792', d6, 0.3), ASIDE);
  }
  await ctx.yield();
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), SC = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  for (const k in G) {
    const list = lay[k], geo = G[k];
    if (!list.length) { geo.dispose(); continue; }
    const im = new THREE.InstancedMesh(geo, H.matProp, list.length); im.name = 'hall-' + k;
    for (let i = 0; i < list.length; i++) {
      const it = list[i]; P.set(it[0], TABLE.top + 0.004, it[1]); Q.setFromAxisAngle(UP, it[2]); SC.setScalar(it[3]);
      im.setMatrixAt(i, M.compose(P, Q, SC)); im.setColorAt(i, it[4]);
    }
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.computeBoundingSphere();
    H.group.add(im); H.tris += (geo.index.count / 3) * list.length; H.calls += 1;
    await ctx.yield();
  }
  H.steamAt = steam.slice(0, 9);
}

// ---- the low end: an old oak screen across the hall under a gallery. Heavy posts on bases, boards and uprights below
// a moulded rail and blind pointed heads over set-back boarding above it (one head to a narrow outer bay, three to a
// wide inner bay), three deep pointed doorways into the dark of the passage, a jettied head beam on brackets with the
// joist ends showing, the gallery's boarded floor, and a rail of turned balusters between posts.
async function buildScreen(H) {
  const { THREE, INT, ctx, S } = H, rng = H.rngFor('screen');
  const zf = GALLERY.z0, F = frameOf(THREE, 0, zf, -1, 0), vb = INT.makeBuilder(), hb = INT.makeBuilder();
  const x0 = HALL.x0, x1 = HALL.x1, top = 11.3, room = F.at(0, 6, 40), back = -1.7;
  const BOARD = new THREE.Color('#948a76'), DEEP = new THREE.Color('#6f6757'), POST = '#837a68', BEAM = '#7a715f', DARK = '#2b2520';
  const tone = (c, a, b) => c.clone().multiplyScalar(rng.range(a, b));
  const doors = [{ s: -18, w: 3.2, ys: 5.6, ya: 9.4 }, { s: 0, w: 3.9, ys: 6.0, ya: 10.5 }, { s: 18, w: 3.2, ys: 5.6, ya: 9.4 }];
  const box = (b, s0, s1, y0, y1, d0, d1, c, sf = S.oak) => boxAt(H, b, s1 - s0, y1 - y0, d1 - d0, -(s0 + s1) / 2, (y0 + y1) / 2, zf - (d0 + d1) / 2, 0, { c, surf: sf });
  const rail = (y) => [[0, y - 0.32], [0.3, y - 0.24], [0.44, y - 0.1], [0.44, y + 0.1], [0.3, y + 0.24], [0, y + 0.32]];
  const cuts = [x0 + 0.45]; for (const d of doors) cuts.push(d.s - d.w - 0.35, d.s + d.w + 0.35); cuts.push(x1 - 0.45);
  // the runs between the doorways are not alike: an outer run (door to side wall) has five narrow bays of one board
  // each between six posts, an inner run (door to door) two wide bays of three boards each between three posts
  const posts = [];
  for (let k = 0; k < cuts.length; k += 2) {
    const a = cuts[k], q = cuts[k + 1], outer = k === 0 || k === cuts.length - 2, nBay = outer ? 5 : 2, nBoard = outer ? 1 : 3;
    for (let j = 0; j <= nBay; j++) posts.push([lerp(a, q, j / nBay), (j === 0 && k > 0) || (j === nBay && k < cuts.length - 2)]);
    for (let j = 0; j < nBay; j++) {
      const b0 = lerp(a, q, j / nBay) + 0.45, b1 = lerp(a, q, (j + 1) / nBay) - 0.45, mw = 0.36, pw = (b1 - b0 - (nBoard - 1) * mw) / nBoard, holes = [];
      let s = b0;
      for (let i = 0; i < 2 * nBoard - 1; i++) {
        const board = i % 2 === 0, w = board ? pw : mw;
        if (board) {
          quadTo(vb, F.at(s, 0.5, 0), F.at(s + w, 0.5, 0), F.at(s + w, 5.4, 0), F.at(s, 5.4, 0), room, tone(BOARD, 0.8, 1.14), S.oak);
          holes.push(openingPts(s + w / 2, w / 2 - 0.09, 6.3, 9.3, 9.3 + w * 0.9, 4));
        } else box(vb, s, s + w, 0.5, top, -0.1, 0.34, tone(BOARD, 0.62, 0.78));
        s += w;
      }
      quadTo(vb, F.at(b0, 5.8, -0.32), F.at(b1, 5.8, -0.32), F.at(b1, top, -0.32), F.at(b0, top, -0.32), room, tone(DEEP, 0.8, 1.1), S.oak);
      place(H, vb, F, faceGeo(THREE, [[b0, 5.8], [b1, 5.8], [b1, top], [b0, top]], holes), 0, 0, 0.14, { c: tone(BOARD, 0.86, 1.1), surf: S.oak });
      addMould(hb, F, b0, b1, rail(5.6), BEAM, S.oak);
      box(hb, b0, b1, 0, 0.56, -0.1, 0.46, BEAM);
    }
    await ctx.yield();
  }
  for (const [p, jamb] of posts) {
    const d0 = jamb ? back : -0.3;
    box(vb, p - 0.45, p + 0.45, 0, top + 0.3, d0, 0.76, POST);
    box(vb, p - 0.57, p + 0.57, 0, 1.3, d0, 0.9, POST);                 // its base
    box(vb, p - 0.57, p + 0.57, 10.0, 10.4, d0, 0.9, POST);             // its cap
    box(vb, p - 0.3, p + 0.3, 10.4, 12.3, 0.76, 0.94, POST);            // the bracket under the jetty
    place(H, vb, F, new THREE.CylinderGeometry(0.2, 0.2, 8.7, 6, 1, true, -Math.PI / 2, Math.PI), p, 5.65, 0.76, { c: POST, surf: S.oak });   // a roll up its face
  }
  // the doorways: a board over each pointed head, the head's own depth, a moulding round the opening, the passage behind
  for (const d of doors) {
    const pts = openingPts(d.s, d.w, 0, d.ys, d.ya, 6), arch = pts.slice(2).reverse(), mid = F.at(d.s, 2, -0.8);
    place(H, vb, F, faceGeo(THREE, [...arch, [d.s + d.w, top], [d.s - d.w, top]]), 0, 0, 0.14, { c: tone(BOARD, 0.8, 0.92), surf: S.oak });
    for (let i = 0; i < arch.length - 1; i++) {
      const a = arch[i], q = arch[i + 1];
      quadTo(vb, F.at(a[0], a[1], 0.14), F.at(q[0], q[1], 0.14), F.at(q[0], q[1], back), F.at(a[0], a[1], back), mid, tone(DEEP, 0.9, 1.1), S.oak);
    }
    addBar(vb, F, [[d.s - d.w, 0], ...arch, [d.s + d.w, 0]], 0.2, 0.42, 0.52, 0.14, POST, S.oak);
    for (const sg of [-1, 1]) { const ring = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.2832; ring.push([d.s + sg * d.w * 0.66 + 0.55 * Math.cos(a), top - 0.95 + 0.55 * Math.sin(a)]); } addBar(vb, F, ring, 0.1, 0.2, 0.34, 0.14, POST, S.oak, true); }
  }
  quadTo(hb, F.at(x0, 0, -7.8), F.at(x1, 0, -7.8), F.at(x1, 12.9, -7.8), F.at(x0, 12.9, -7.8), room, DARK, S.plain);
  // the head beam, jettied out over the hall, and the ends of the gallery's joists under it
  addMould(hb, F, x0, x1, [[0, top - 0.1], [0.5, top], [0.5, 11.84], [0.62, 12.3], [0.98, 12.42], [0.98, 13.3], [0.84, 13.45], [0.1, 13.45]], BEAM, S.oak);
  for (let x = x0 + 0.8; x < x1 - 0.3; x += 1.16) box(hb, x - 0.17, x + 0.17, 11.86, 12.3, 0.5, 0.96, POST);
  await ctx.yield();
  // the gallery's floor: boards laid across it, from the rail to the wall
  const nb = 72, bw = (x1 - x0) / nb, FLR = new THREE.Color('#8d8470');
  for (let i = 0; i < nb; i++) {
    const xa = x0 + i * bw, xe = xa + bw - 0.05;
    quadTo(hb, [xa, GALLERY.floor, zf], [xe, GALLERY.floor, zf], [xe, GALLERY.floor, HALL.zLow], [xa, GALLERY.floor, HALL.zLow], [xa, 99, zf], tone(FLR, 0.72, 1.14), S.oakDull);
  }
  quadTo(hb, [x0, GALLERY.floor - 0.03, zf], [x1, GALLERY.floor - 0.03, zf], [x1, GALLERY.floor - 0.03, HALL.zLow], [x0, GALLERY.floor - 0.03, HALL.zLow], [0, 99, zf], DARK, S.plain);
  // a rail on both edges of the gallery: posts, a plinth, a moulded hand rail, and turned balusters between
  const bays = 11, bl = (x1 - x0) / bays, y0 = 13.45, y1 = GALLERY.rail;
  const bal = new THREE.LatheGeometry([[0.11, 0], [0.07, 0.14], [0.16, 0.5], [0.06, 0.85], [0.06, 1.25], [0.1, 1.4], [0.1, 1.55]].map((q) => new THREE.Vector2(q[0], q[1])), 4);
  for (const off of [0, -7.7]) {
    const yf = off ? GALLERY.floor : y0;
    for (let k = 0; k <= bays; k++) box(vb, x0 + k * bl - 0.28, x0 + k * bl + 0.28, yf, y1, off, off + 0.66, POST);
    addMould(hb, F, x0, x1, [[0.1, y1 - 0.3], [0.04, y1 - 0.2], [0.12, y1 - 0.07], [0.33, y1], [0.54, y1 - 0.07], [0.62, y1 - 0.2], [0.56, y1 - 0.3], [0.1, y1 - 0.3]].map((q) => [q[0] + off, q[1]]), BEAM, S.oak);
    box(hb, x0, x1, yf, y0 + 0.2, off + 0.1, off + 0.56, BEAM);
    for (let k = 0; k < bays; k++) {
      const a = x0 + k * bl + 0.28, q = a + bl - 0.56;
      for (let i = 0; i < 9; i++) { const g = bal.clone(); g.translate(lerp(a, q, (i + 0.5) / 9), y0 + 0.2, zf - 0.33 - off); vb.add(g, { c: tone(BOARD, 0.84, 1.08), surf: S.oak }); g.dispose(); }
      if (k % 3 === 2) await ctx.yield();
    }
    await ctx.yield();
  }
  bal.dispose();
  const vg = vb.build(); vg.applyMatrix4(new THREE.Matrix4().makeRotationZ(-Math.PI / 2));
  H.mesh(vg, H.matProp, 'hall-screen').rotation.z = Math.PI / 2;      // the uprights' grain runs up
  H.mesh(hb.build(), H.matProp, 'hall-gallery');
  await ctx.yield();
}

// ---- steam off a few covered pots: three crossed upright leaves over each pot and a slow wisp drawn on them, lit by
// the rig like everything else (one mesh; nothing here turns to the lens).
const STEAM_MAIN = /* glsl */`
{
  float ph=floor(vIntUv.y/4.+.01); vec2 suv=vec2(vIntUv.x, vIntUv.y-ph*4.);
  float t=uHallClock*.3+ph*7.31;
  float bend=sin(suv.y*4.2+t*1.9+ph)*.22*suv.y;
  float w=i_fbm2(vec2((suv.x-bend)*1.2+ph*3.1, suv.y*2.2-t));
  float wd=.3+.62*suv.y;
  float env=smoothstep(0.,.1,suv.y)*(1.-smoothstep(.5,1.,suv.y))*(1.-smoothstep(wd*.25,wd,abs(suv.x-bend)));
  float a=clamp((w-.22)*2.4,0.,1.)*env;
  diffuseColor=vec4(vec3(.74,.72,.7), a*.5); iGloss=0.; iMetal=0.; iH=0.; iEmis=vec3(0.);
}
`;
function buildSteam(H) {
  const { THREE, INT } = H, pots = H.steamAt || [], rng = H.rngFor('steam');
  if (!pots.length) return;
  const P = [], N = [], C = [], S = [], UV = [], I = [];
  pots.forEach((p, k) => {
    const y0 = TABLE.top + 0.95, h = rng.range(2.3, 2.9), w = rng.range(0.7, 0.95), a0 = rng.range(0, Math.PI);
    for (let j = 0; j < 3; j++) {
      const a = a0 + (j * Math.PI) / 3, cx = Math.cos(a), cz = Math.sin(a), base = P.length / 3;
      for (const [u, v] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) {
        P.push(p[0] + cx * w * u, y0 + h * v, p[1] + cz * w * u); N.push(-cz, 0, cx); C.push(1, 1, 1); S.push(0, 0, 0, 0); UV.push(u, k * 4 + v);
      }
      I.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); geo.setAttribute('surf', new THREE.Float32BufferAttribute(S, 4));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); geo.setIndex(I); geo.computeBoundingSphere();
  const mat = INT.propMaterial({ rig: H.rig, scale: 1 }), clock = H.glassU.uHallClock;
  mat.transparent = true; mat.depthWrite = false; mat.side = THREE.DoubleSide;
  const base = mat.onBeforeCompile, key = mat.customProgramCacheKey;
  mat.onBeforeCompile = (shader, renderer) => {
    base(shader, renderer);
    shader.uniforms.uHallClock = clock;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <packing>', '#include <packing>\nuniform float uHallClock;')
      .replace('#include <alphamap_fragment>', STEAM_MAIN + '\n#include <alphamap_fragment>');
  };
  mat.customProgramCacheKey = () => key() + ':hall-steam';
  H.mesh(geo, mat, 'hall-steam').renderOrder = 3;
}

// ---- what a hall keeps before its screen: a tall plain cupboard of open shelves with the pewter on it, casks lying on
// a low timber stillage, and a stack of spare benches and trestles. Oak, pewter and iron hoops; nothing else.
async function buildStores(H) {
  const { THREE, INT, ctx, S } = H, rng = H.rngFor('stores'), b = INT.makeBuilder(), OAKC = new THREE.Color('#a0957c');
  const tone = (a, q) => OAKC.clone().multiplyScalar(rng.range(a, q)), PEW = INT.surf(0, 0.74, 0.8), PEWTER = '#a0a3a8';
  const box = (w, h, d, x, y, z, th, c, sf = S.oak) => boxAt(H, b, w, h, d, x, y, z, th, { c, surf: sf });
  const v2 = (pts) => pts.map((q) => new THREE.Vector2(Math.max(q[0], 1e-3), q[1]));
  { // the cupboard: a boarded body, three open shelves stepping back, side boards, a back and a plain top
    const cx = 9.4, w = 7.2, zb = 10.9, lv = [[2.6, 2.0], [4.5, 1.5], [6.2, 1.1]];
    box(w, 2.5, 2.0, cx, 1.25, zb - 1.0, 0, tone(0.8, 0.95));
    for (let i = -3; i <= 3; i++) box(0.12, 2.3, 0.06, cx + i * 1.0, 1.25, zb - 2.03, 0, tone(0.55, 0.65));
    for (const [y, d] of lv) box(w + 0.3, 0.2, d + 0.15, cx, y, zb - d / 2, 0, tone(0.95, 1.1));
    for (const sg of [-1, 1]) box(0.22, 5.6, 1.5, cx + sg * (w / 2 - 0.11), 5.4, zb - 0.75, 0, tone(0.75, 0.9));
    box(w, 5.6, 0.14, cx, 5.4, zb - 0.07, 0, tone(0.6, 0.72)); box(w + 0.6, 0.28, 1.9, cx, 8.3, zb - 0.8, 0, tone(0.9, 1.05));
    const charger = new THREE.LatheGeometry(v2([[0, 0], [0.38, 0], [0.44, 0.05], [0.64, 0.1], [0.66, 0.125], [0.44, 0.09], [0.38, 0.05], [0, 0.05]]), 12);
    const flagon = new THREE.LatheGeometry(v2([[0, 0], [0.3, 0], [0.31, 0.05], [0.25, 0.12], [0.22, 0.48], [0.26, 0.76], [0.2, 0.92], [0.17, 0.98], [0.21, 1.02], [0.13, 1.08], [0.05, 1.1], [0, 1.14]]), 10);
    for (let k = 0; k < 2; k++) for (let i = 0; i < 5; i++) {         // chargers stood on edge against the back
      const g = charger.clone(), sc = rng.range(0.9, 1.08), lean = 0.2; g.scale(sc, sc, sc); g.rotateX(-(Math.PI / 2 - lean));
      g.translate(cx + (i - 2) * 1.36 + rng.range(-0.06, 0.06), lv[k][0] + 0.1 + 0.66 * sc * Math.cos(lean), zb - 0.3); b.add(g, { c: PEWTER, surf: PEW }); g.dispose();
    }
    for (const [k, n, dz] of [[0, 3, 1.35], [2, 5, 0.55]]) for (let i = 0; i < n; i++) {
      const g = flagon.clone(), sc = rng.range(0.92, 1.1); g.scale(sc, sc, sc); g.rotateY(rng.range(0, 6.28));
      g.translate(cx + (i - (n - 1) / 2) * (n === 3 ? 2.1 : 1.3) + rng.range(-0.1, 0.1), lv[k][0] + 0.1, zb - dz); b.add(g, { c: PEWTER, surf: PEW }); g.dispose();
    }
    charger.dispose(); flagon.dispose();
  }
  await ctx.yield();
  { // the casks: five lying on two rails, their heads to the hall
    const cx = -9.4, zc = 9.4, HOOP = '#2a2521';
    for (const dz of [-0.8, 0.8]) box(10.4, 0.5, 0.42, cx, 0.75, zc + dz, 0, tone(0.6, 0.72));
    for (let i = -1; i <= 1; i++) box(0.5, 0.5, 2.6, cx + i * 4.6, 0.25, zc, 0, tone(0.55, 0.68));
    const prof = [[0.72, -1.35], [0.86, -0.9], [0.96, -0.4], [1.0, 0], [0.96, 0.4], [0.86, 0.9], [0.72, 1.35]];
    for (let i = 0; i < 5; i++) {
      const x = cx + (i - 2) * 2.06, y = 1.0 + 0.92, add = (g, c, sf) => { g.rotateX(Math.PI / 2); g.translate(x, y, zc); b.add(g, { c, surf: sf }); g.dispose(); };
      add(new THREE.LatheGeometry(v2(prof), 12), tone(0.74, 0.94), S.oak);
      for (const sg of [-1, 1]) { const h = new THREE.CircleGeometry(0.71, 12); h.rotateX(sg * Math.PI / 2); h.translate(0, sg * -1.28, 0); add(h, tone(0.9, 1.05), S.oakDull); }
      for (const t of [-1.2, -0.95, -0.45, 0.45, 0.95, 1.2]) { const r = 1.02 - 0.155 * t * t, hp = new THREE.CylinderGeometry(r, r, 0.13, 12, 1, true); hp.translate(0, t, 0); add(hp, HOOP, S.iron); }
    }
  }
  await ctx.yield();
  { // spare benches stacked three high, and three trestle frames laid flat on one another beside them
    const cx = 27.0, zc = 9.6;
    for (let i = 0; i < 3; i++) {
      const dx = rng.range(-0.2, 0.2), y = 1.4 + i * 0.62, c = tone(0.62, 0.8);
      box(6.0, 0.15, 0.95, cx - 1.6 + dx, y - 0.075, zc + i * 0.12, 0, c);
      for (const f of [-2.4, 2.4]) box(0.14, i ? 0.5 : 1.25, 0.8, cx - 1.6 + dx + f, i ? y - 0.4 : 0.625, zc + i * 0.12, 0, tone(0.5, 0.6));
    }
    for (let i = 0; i < 3; i++) {
      const th = rng.range(-0.12, 0.12), x = cx + 2.1, z = zc - 2.6, y = 0.2 + i * 0.4, c = tone(0.55, 0.7), co = Math.cos(th), si = Math.sin(th);
      for (const o of [-1.0, 1.0]) box(3.3, 0.36, 0.4, x - si * o, y, z + co * o, th, c);
      for (const o of [-1.2, 1.2]) box(0.36, 0.36, 2.0, x + co * o, y, z + si * o, th, c);
    }
  }
  H.mesh(b.build(), H.matProp, 'hall-stores');
  await ctx.yield();
}
