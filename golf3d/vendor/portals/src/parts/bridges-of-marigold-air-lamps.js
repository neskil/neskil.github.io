// bridges-of-marigold, the air: THE STRINGS OF COLOURED LAMPS (design, section 3: teal, magenta, orange, violet,
// lime). Every lamp hangs a hand under its string at a place of the string's own sagging span (the lines' deal),
// sways with it and twinkles by the world's clock. A lamp is a point of light with a halo, never smaller than three
// pixels. A string's colours go by its own dice: all five in turn, two in turn, or one alone.
// The lamps stand where their lines stand: the lines' deal keeps every part of a line, sway included, CLEAR metres
// (the plan's measure) from the flown line.
import { SPARK_VERT, SPARK_FRAG } from './bridges-of-marigold-air-glsl.js';
import { fogUniforms } from '../kit/fx.js';
import { linePoint } from './bridges-of-marigold-air-lines.js';
import { routeDistance } from './bridges-of-marigold-plan.js';

export const LAMP_DROP = 0.24;         // a lamp hangs this far under its string
export function sparkMaterial(THREE, U, o) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: SPARK_VERT, fragmentShader: SPARK_FRAG,
    uniforms: { ...fogUniforms(), uTime: U.uTime, uPx: U.uPx, uDrop: { value: o.drop || 0 }, uCore: { value: o.core }, uHalo: { value: o.halo } },
  });
}
export function sparkMesh(THREE, material, P, H, C) {
  const quad = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
  g.index = quad.index; g.setAttribute('position', quad.attributes.position);
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(P), 4)); g.setAttribute('aHang', new THREE.InstancedBufferAttribute(new Float32Array(H), 4));
  g.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(C), 4)); g.instanceCount = P.length / 4;
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.renderOrder = 6;
  return { mesh, count: P.length / 4, dispose() { quad.dispose(); g.dispose(); } };
}

export async function buildLamps(ctx, o) {
  const { THREE, U, rng, lines, lampColors } = o;
  const five = [lampColors.teal, lampColors.magenta, lampColors.orange, lampColors.violet, lampColors.lime];
  const P = [], H = [], C = [], near = [];
  const step = 2.0;                                                  // metres from lamp to lamp (the visit's density deals the count of strings)
  let done = 0;
  for (const l of lines) {
    if (l.kind !== 'lamps') continue;
    const mode = rng(), first = Math.floor(rng() * 5), second = (first + 1 + Math.floor(rng() * 4)) % 5, n = Math.max(3, Math.round(l.len * (l.t1 - l.t0) / step));
    for (let i = 0; i < n; i++) {
      const t = l.t0 + (l.t1 - l.t0) * (i + 0.5) / n, p = linePoint(l, t), tw = rng();
      const col = mode < 0.5 ? five[(first + i) % 5] : mode < 0.8 ? five[i % 2 ? first : second] : five[first];
      P.push(p[0], p[1], p[2], 1.7); H.push(l.px, l.pz, l.sway * 4 * t * (1 - t), l.phase); C.push(col.r, col.g, col.b, tw);
      if (routeDistance(p[0], p[1], p[2]) < 38) near.push({ p, hang: [l.px, l.pz, l.sway * 4 * t * (1 - t), l.phase], col });
    }
    if (++done % 12 === 0) await ctx.yield();
  }
  const mat = sparkMaterial(THREE, U, { drop: LAMP_DROP, core: 3.2, halo: 0.55 });
  const set = sparkMesh(THREE, mat, P, H, C);
  return {
    object: set.mesh, triangles: set.count * 2, drawCalls: 1, count: set.count, near,
    update() {},
    dispose() { set.dispose(); mat.dispose(); },
  };
}
