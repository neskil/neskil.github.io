// valley-inside-the-works, THE SHED: the shader text of its surfaces (brick, stone, granite, boards, planks, iron).
// Every pattern takes the footprint fw = fwidth(uv), taken once before any branch, and fades into its own mean as the
// footprint grows, so nothing shimmers in flight. Direct3D-safe: no pow, sqrt or division on a value that can be zero.
// BROUGHT IN: the hash shHash follows "Hash without Sine", Copyright (c)2014 David Hoskins, MIT License,
// published on Shadertoy: a cut of that set's two-in hashes down to two components, with its numbers
// (0.1031, 0.1030, 33.33). The kit's fx.js carries the same set, but shHash is not the kit's hash12.
export const COMMON = /* glsl */`
// shHash follows "Hash without Sine" (David Hoskins, MIT): see the head of this file.
float shHash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float shNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(shHash(i), shHash(i + vec2(1.0, 0.0)), f.x), mix(shHash(i + vec2(0.0, 1.0)), shHash(i + vec2(1.0, 1.0)), f.x), f.y); }
// the share of a footprint f wide, centred on x, that lies on lines d wide (a share of the period) at every whole number
float shPulse(float x, float d, float f) { f = max(f, 1e-4); float a = x - 0.5 * f, b = x + 0.5 * f;
  return clamp((floor(b) * d + min(fract(b), d) - floor(a) * d - min(fract(a), d)) / f, 0.0, 1.0); }
// a soft edge at distance e from a line, for a footprint f
float shEdge(float e, float f) { return clamp(0.5 + e / max(f, 1e-4), 0.0, 1.0); }
`;

export const SURFACE_FUNCS = /* glsl */`
// brick in English garden-wall bond (three courses of stretchers, then one of headers), three times life size
vec3 shBrick(vec2 uv, vec2 fw, float tone) {
  float ch = 0.225, bl = 0.675;
  float row = floor(uv.y / ch), hdr = step(2.5, mod(row, 4.0));
  float len = mix(bl, bl * 0.5, hdr);
  float bx = uv.x / len + mix(mod(row, 2.0) * 0.5, 0.25, hdr);
  vec2 id = vec2(floor(bx), row);
  float h1 = shHash(id), h2 = shHash(id + 17.3);
  vec3 c = mix(vec3(0.36, 0.12, 0.075), vec3(0.54, 0.21, 0.11), h1);
  c = mix(c, vec3(0.22, 0.10, 0.09), step(0.88, h2) * 0.75);
  c = mix(c, vec3(0.56, 0.31, 0.20), hdr * 0.35 * h2);
  c = mix(c, vec3(0.44, 0.165, 0.095), smoothstep(0.6, 1.6, max(fw.x / len, fw.y / ch)));
  float joint = 1.0 - (1.0 - shPulse(uv.y / ch, 0.14, fw.y / ch)) * (1.0 - shPulse(bx, 0.03 / len, fw.x / len));
  c = mix(c, vec3(0.56, 0.50, 0.41), joint * 0.9);
  float grime = shNoise(uv * 0.11) * 0.6 + shNoise(uv * vec2(0.9, 0.06) + 7.0) * 0.4;
  c *= mix(0.90, 1.06, grime);
  return c * mix(1.0, 1.22, tone);
}
// dressed stone in courses
vec3 shAshlar(vec2 uv, vec2 fw, float tone) {
  float ch = 0.9, bl = 1.8;
  float row = floor(uv.y / ch), bx = uv.x / bl + mod(row, 2.0) * 0.5 + shHash(vec2(row, 3.0)) * 0.3;
  float h = shHash(vec2(floor(bx), row));
  vec3 c = mix(vec3(0.47, 0.43, 0.35), vec3(0.62, 0.57, 0.47), h);
  c = mix(c, vec3(0.545, 0.50, 0.41), smoothstep(0.6, 1.6, max(fw.x / bl, fw.y / ch)));
  float joint = 1.0 - (1.0 - shPulse(uv.y / ch, 0.05, fw.y / ch)) * (1.0 - shPulse(bx, 0.025, fw.x / bl));
  c = mix(c, vec3(0.30, 0.28, 0.24), joint * 0.8);
  float f = max(fw.x, fw.y);
  c *= mix(1.0, mix(0.90, 1.07, shNoise(uv * 3.1)), 1.0 - smoothstep(0.15, 0.6, f));               // tooling
  c *= mix(0.84, 1.06, shNoise(uv * 0.23 + 5.0));
  return c * mix(0.92, 1.12, tone);
}
// speckled granite
vec3 shGranite(vec2 uv, vec2 fw) {
  float f = max(fw.x, fw.y);
  float a = shHash(floor(uv / 0.07)), b = shHash(floor(uv / 0.16) + 9.0);
  vec3 sp = mix(vec3(0.17, 0.16, 0.17), vec3(0.88, 0.84, 0.82), step(0.5, a));
  sp = mix(sp, vec3(0.72, 0.53, 0.49), step(0.78, b));
  float k = (1.0 - smoothstep(0.03, 0.16, f)) * 0.6 * step(0.3, abs(a - 0.5) * 2.0);
  return mix(vec3(0.57, 0.54, 0.53), sp, k) * mix(0.92, 1.06, shNoise(uv * 0.8));
}
// boards painted a worn cream (the roof's underside); u across the boards, v down their length
vec3 shBoards(vec2 uv, vec2 fw, float tone) {
  float bw = 0.45, id = floor(uv.x / bw);
  vec3 c = mix(vec3(0.80, 0.75, 0.60), vec3(0.89, 0.85, 0.71), shHash(vec2(id, 1.0)));
  c = mix(c, vec3(0.845, 0.80, 0.655), smoothstep(0.6, 1.6, fw.x / bw));
  float worn = smoothstep(0.55, 0.85, shNoise(uv * vec2(0.35, 0.12) + tone * 40.0));
  c = mix(c, vec3(0.58, 0.53, 0.44), worn * 0.45);
  float stain = smoothstep(0.6, 0.95, shNoise(vec2(uv.x * 0.7 + tone * 31.0, uv.y * 0.05)));
  c = mix(c, vec3(0.52, 0.45, 0.34), stain * 0.35);
  return mix(c, vec3(0.36, 0.33, 0.27), shPulse(uv.x / bw, 0.07, fw.x / bw) * 0.7);
}
// timber planks, bare (paint 0) or painted in the vertex's own colour and worn (paint toward 1)
vec3 shPlanks(vec2 uv, vec2 fw, float paint) {
  float bw = 0.6, id = floor(uv.x / bw);
  // the grain (nine cells to the metre across a board) and each board's own tone fade into their mean (a half) as the
  // footprint grows past a cell and past a board
  float g = mix(shNoise(vec2(uv.x * 9.0, uv.y * 0.6) + id * 3.7), 0.5, smoothstep(0.04, 0.14, fw.x));
  float tone = mix(shHash(vec2(id, 5.0)), 0.5, smoothstep(0.6, 1.6, fw.x / bw));
  vec3 wood = mix(vec3(0.34, 0.27, 0.20), vec3(0.52, 0.44, 0.33), tone * 0.6 + g * 0.4);
  float worn = smoothstep(0.5, 0.9, shNoise(uv * vec2(1.3, 0.35) + 11.0));
  vec3 c = mix(wood, vec3(1.0), paint * (1.0 - 0.5 * worn));
  return mix(c, c * 0.45, shPulse(uv.x / bw, 0.06, fw.x / bw));
}
`;

export const IRON_FUNCS = /* glsl */`
// painted iron: uv = (along, across) in metres, wd = the face's width across (0: a plain face); paint worn, rust in
// patches, edges that catch the light, and on a face 0.4 m wide or more a row of rivets 0.15 m in from each edge
// (on a narrower face the two rows would cross or sit on the edge, so it has none)
vec3 shIron(vec2 uv, vec2 fw, float wd, vec3 paint) {
  float f = max(fw.x, fw.y), near = 1.0 - smoothstep(0.06, 0.3, f);
  vec3 c = paint * mix(0.90, 1.08, shNoise(uv * vec2(0.5, 1.7)));
  float rust = smoothstep(0.60, 0.92, shNoise(uv * 0.9 + 3.0) * 0.6 + shNoise(uv * 4.1) * 0.4 * near + 0.2 * (1.0 - near));
  c = mix(c, vec3(0.44, 0.23, 0.12), rust * 0.5);
  float has = step(0.05, wd);
  float e = min(uv.y, wd - uv.y);
  c *= 1.0 + 0.22 * has * (1.0 - smoothstep(0.0, 0.05 + f, e));                               // the arris
  float rv = min(abs(uv.y - 0.15), abs(uv.y - wd + 0.15));
  vec2 q = vec2((fract(uv.x / 0.5) - 0.5) * 0.5, rv);
  float r2 = dot(q, q), dotv = (1.0 - smoothstep(0.0036, 0.0072, r2)) * step(0.39, wd) * near;   // (0.39: a face of 0.4 m keeps its rivets against rounding)
  float lit = clamp(0.5 + (q.y - q.x) * 7.0, 0.0, 1.0);
  return mix(c, c * mix(0.62, 1.45, lit), dotv);
}
// a fluted cast shaft: u counts the flutes round it, v is the height, w runs 0 at the foot joint to 1 at the neck
vec3 shFlute(vec2 uv, vec2 fw, float w, vec3 paint, out float tilt) {
  float amp = 1.0 - smoothstep(0.25, 0.9, fw.x), ph = 6.2832 * uv.x;
  vec3 c = paint * mix(0.92, 1.07, shNoise(vec2(uv.x * 1.3, uv.y * 0.12)));
  c *= mix(1.0, mix(0.66, 1.12, cos(ph) * 0.5 + 0.5), amp);
  tilt = -sin(ph) * 0.6 * amp;
  float joint = max(max(1.0 - smoothstep(0.0, 0.05, w), smoothstep(0.95, 1.0, w)), 1.0 - smoothstep(0.004, 0.03, abs(w - 0.5)));
  float streak = smoothstep(0.55, 0.9, shNoise(vec2(uv.x * 0.9 + 3.0, uv.y * 0.05))) * smoothstep(0.3, 1.0, w);
  float rust = clamp(joint * (0.45 + 0.55 * shNoise(uv * vec2(1.7, 0.8))) + streak * 0.35, 0.0, 1.0);
  return mix(c, vec3(0.45, 0.24, 0.12), rust * 0.65);
}
#ifdef SHED_TALL
varying float vCane;                    // a column's own paint, by where it stands: 0 iron, 1 a red cane, 2 a green one
#endif
// a shaft painted as a sugar cane: glossy white with a spiral stripe winding up it, a broad band and a fine one beside
// it (u counts the flutes round the shaft, 20 to the turn; v is the height in metres; the stripe makes a turn in 6 m)
vec3 shCane(vec2 uv, vec2 fw, float green) {
  float ph = uv.x / 20.0 + uv.y / 6.0, f = fw.x / 20.0 + fw.y / 6.0;
  float stripe = max(shPulse(ph, 0.3, f), shPulse(ph + 0.44, 0.07, f));
  return mix(vec3(0.88, 0.87, 0.84), mix(vec3(0.78, 0.03, 0.05), vec3(0.06, 0.48, 0.14), green), stripe);
}
`;

// the block that stands after <color_fragment>: sets diffuseColor, shedRough, shedGlow, shedTilt
export const SURFACE_MAIN = /* glsl */`
{
  float kind = floor(vP.z + 0.5), w = vP.w;
  vec2 uv = vP.xy, fw = fwidth(vP.xy);
  vec3 base = vec3(1.0);
  // what a face turned from the sun takes of the plan's bars of light: where a bar comes down, the lit meadow and
  // the lit dust throw its warm light back at every face; between the bars there is little of it (lightBar and
  // vValleyBar are the plan's own, laid into this material by its barMaterial)
  vec3 bounce = uShedBounce * mix(0.15, 4.5, lightBar(vValleyBar));
  #ifdef SHED_TALL
  float wd = 0.0;
  #else
  float wd = w;
  #endif
  if (kind < 0.5) { base = shBrick(uv, fw, w); shedRough = 0.9; shedGlow = bounce * (0.25 + 0.75 * w); }
  else if (kind < 1.5) { base = shAshlar(uv, fw, w); shedRough = 0.85; shedGlow = bounce * 0.5; }
  else if (kind < 2.5) { base = shGranite(uv, fw); shedRough = 0.42; shedGlow = bounce * 0.4; }
  else if (kind < 3.5) { base = shBoards(uv, fw, w); shedRough = 0.8; shedGlow = uShedSky * uShedLift * mix(0.35, 1.0, clamp(uv.y / 18.9, 0.0, 1.0)) + bounce * 0.6; }
  else if (kind < 4.5) { base = shPlanks(uv, fw, w); shedRough = 0.85; shedGlow = bounce * 0.5; }
  else if (kind < 5.5) { base = shIron(uv, fw, wd, uShedPaint); shedRough = 0.55; shedGlow = bounce * 0.6; }
  else if (kind < 6.5) {
    base = shFlute(uv, fw, w, uShedPaint, shedTilt); shedRough = 0.5; shedGlow = bounce * 0.6;
    #ifdef SHED_TALL
    if (vCane > 0.5) { base = shCane(uv, fw, step(1.5, vCane)); shedTilt = 0.0; shedRough = 0.2; }     // a cane: smooth and glossy
    #endif
  }
  else if (kind < 7.5) { shedGlow = bounce * 0.5; }
  else if (kind < 8.5) {                  // a sugar jewel: its clear colour under a frost of grains, glowing like lit sugar glass
    float grain = step(0.78, shHash(floor(uv / 0.03))) * (1.0 - smoothstep(0.004, 0.02, max(fw.x, fw.y)));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9), 0.3 * grain);    // (the frost shows only from near: far off the colour stays clear)
    shedRough = 0.32; shedGlow = vec3(0.55) + bounce * 0.5;                // (its own glow: it lights nothing)
  }
  else {                                  // a striped boiled sweet: white sugar and a stripe of its own colour, wound as a
    // pinwheel of six arms on a disc (w 0: uv in metres from its middle) or run in bands across a humbug (w 1: u along it)
    float r = sqrt(dot(uv, uv) + 1e-8), f = max(fw.x, fw.y);
    float ph = mix(6.0 * atan(uv.y, uv.x + step(r, 1e-3)) / 6.2832 + 0.5 * r, uv.x / 0.46, w);
    float fp = mix(f * (0.955 / max(r, 0.25) + 0.5), fw.x / 0.46, w);
    float stripe = max(shPulse(ph, 0.5, fp), (1.0 - w) * shEdge(0.24 - r, f));
    diffuseColor.rgb = mix(vec3(0.9, 0.88, 0.84), diffuseColor.rgb, stripe);
    shedRough = 0.22; shedGlow = vec3(0.3) + bounce * 0.5;
  }
  diffuseColor.rgb *= base;
}
`;
// after <normal_fragment_maps>: the flutes turn the normal round the shaft's own (upright) axis
export const SURFACE_NORMAL = /* glsl */`
{
  vec3 shUp = (viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz;
  vec3 shT = cross(shUp, normal);
  normal = normalize(normal + shT * shedTilt);
}
`;
