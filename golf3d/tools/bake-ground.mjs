// Bake a piece of a Portals world's ground into a tour hole.
//
//   node golf3d/tools/world-ground.mjs turtle --box -200,40,200,270 --step 5 --json /tmp/t.json
//   node golf3d/tools/bake-ground.mjs turtle /tmp/t.json --pin 10,4,-70,140 --yaw 40 --scale 2.5 \
//        --y0 150 --box -6,-4,46,66 --step 2 --flat 10,4,2,4.5 --flat 33,54.5,4.5,7
//
// --pin gx,gz,wx,wz   this golf point is this world point
// --yaw degrees       golf's +z runs along this compass heading in the world (0 = world +z)
// --scale s           world units to one golf unit
// --y0 h              the world height that is golf's y = 0 (a sea level, a floor)
// --box, --step       the golf rectangle to bake and its grid spacing
// --flat gx,gz,r0,r1  level the ground inside r0 and ease back to it by r1: a tee, a green
// --min h             nothing is baked lower than this golf height (default 0: the sea)
//
// It writes one entry of js/tour-ground.js (G3.TOUR_GROUND[id]) and prints the
// `place.at` to put in portals.js. Where the world has no ground the bake is
// y = min. One pass of smoothing takes the mesh's facets out of the roll.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2), id = args[0], src = JSON.parse(readFileSync(args[1], 'utf8'));
const one = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const all = (n) => args.map((a, i) => a === n ? args[i + 1] : null).filter(Boolean);
const pin = one('--pin').split(',').map(Number), yaw = +one('--yaw', 0) * Math.PI / 180, s = +one('--scale', 1);
const y0 = +one('--y0', 0), box = one('--box').split(',').map(Number), d = +one('--step', 2), floor = +one('--min', 0);
const c = Math.cos(yaw), sn = Math.sin(yaw);
// golf (gx, gz) -> world: a turn about y by `yaw` takes +z to (sin, cos) and +x to (cos, -sin)
const toWorld = (gx, gz) => [gx * c + gz * sn, -gx * sn + gz * c];
const pw = toWorld(pin[0], pin[1]), ox = pin[2] - s * pw[0], oz = pin[3] - s * pw[1];
function worldH(wx, wz) {
    const fx = (wx - src.box[0]) / src.step, fz = (wz - src.box[1]) / src.step;
    const ix = Math.floor(fx), iz = Math.floor(fz), R = src.rows;
    if (ix < 0 || iz < 0 || iz >= R.length - 1 || ix >= R[0].length - 1) return null;
    const q = [R[iz][ix], R[iz][ix + 1], R[iz + 1][ix], R[iz + 1][ix + 1]];
    if (q.some((v) => v === null)) { const ok = q.filter((v) => v !== null); return ok.length ? Math.min(...ok) : null; }
    const ux = fx - ix, uz = fz - iz;
    return (q[0] * (1 - ux) + q[1] * ux) * (1 - uz) + (q[2] * (1 - ux) + q[3] * ux) * uz;
}
const nx = Math.round((box[2] - box[0]) / d) + 1, nz = Math.round((box[3] - box[1]) / d) + 1;
let h = new Float64Array(nx * nz);
for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) {
    const w = toWorld(box[0] + i * d, box[1] + k * d), wh = worldH(ox + s * w[0], oz + s * w[1]);
    h[k * nx + i] = wh === null ? floor : Math.max(floor, (wh - y0) / s);
}
// one pass of a 3x3 blur, land only: the sea stays the sea
const b = new Float64Array(h);
for (let k = 1; k < nz - 1; k++) for (let i = 1; i < nx - 1; i++) {
    if (h[k * nx + i] <= floor + 1e-6) continue;
    let t = 0;
    for (let a = -1; a <= 1; a++) for (let e = -1; e <= 1; e++) t += h[(k + a) * nx + i + e];
    b[k * nx + i] = (t + h[k * nx + i] * 3) / 12;
}
h = b;
const at = (gx, gz) => { const i = Math.round((gx - box[0]) / d), k = Math.round((gz - box[1]) / d); return h[k * nx + i]; };
for (const f of all('--flat')) {
    const [gx, gz, r0, r1] = f.split(',').map(Number), level = at(gx, gz);
    for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) {
        const r = Math.hypot(box[0] + i * d - gx, box[1] + k * d - gz);
        if (r >= r1) continue;
        const u = r <= r0 ? 0 : (r - r0) / (r1 - r0), m = u * u * (3 - 2 * u);
        h[k * nx + i] = level + (h[k * nx + i] - level) * m;
    }
    console.log(`flat at ${gx},${gz}: y = ${level.toFixed(2)}`);
}
const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'js', 'tour-ground.js');
const HEAD = `/* The World Tour's sculpted ground: pieces of Portals worlds' own terrain,
   sampled through their geometry (tools/world-ground.mjs) and baked into golf
   units at the place each hole stands (tools/bake-ground.mjs). portals.js
   lays these under its holes as \`grid\` field terms (physics.fieldAt), so the
   ball rolls on the world's own hills. Generated: do not edit by hand. */
(function (G3) {
    'use strict';
    G3.TOUR_GROUND = G3.TOUR_GROUND || {};
`;
let body = {};
if (existsSync(file)) for (const m of readFileSync(file, 'utf8').matchAll(/G3\.TOUR_GROUND\['([^']+)'\] = (\{.*\});/g)) body[m[1]] = m[2];
body[id] = JSON.stringify({ x0: box[0], z0: box[1], d, nx, nz, h: Array.from(h, (v) => +v.toFixed(2)) });
writeFileSync(file, HEAD + Object.keys(body).sort().map((k) => `    G3.TOUR_GROUND['${k}'] = ${body[k]};\n`).join('') + '})(window.G3);\n');
console.log(`baked ${id}: ${nx} x ${nz}, heights ${Math.min(...h).toFixed(1)} to ${Math.max(...h).toFixed(1)}`);
console.log(`place.at: { x: ${ox.toFixed(2)}, z: ${oz.toFixed(2)}, y: ${y0}, yaw: ${yaw.toFixed(4)}, scale: ${s} }`);
// a plan, to read the hole off
for (let k = nz - 1; k >= 0; k -= 1) console.log(String(box[1] + k * d).padStart(4) + ' ' + Array.from({ length: nx }, (_, i) => { const v = h[k * nx + i]; return v <= floor + 0.05 ? ' ~' : String(Math.round(v)).padStart(2); }).join(''));
