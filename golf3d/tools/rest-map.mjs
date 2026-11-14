// Where does the ball finish? Every line and weight from the tee, and a grid
// of where each one came to rest — the map to read before choosing where a
// pin goes.
//
//   node golf3d/tools/rest-map.mjs works --hole 3              # the hole's bag
//   node golf3d/tools/rest-map.mjs cinder --hole 3 --club mallet --cell 0.5
//
// The hole lab says how much of the sweep is an ace *for the pin a hole has*.
// This is the question before that one: with no pin at all, where do the
// shots a hole makes possible end up? A pin on a cell that takes two or three
// shots in a thousand is a skill shot; one where thirty finish is a giveaway;
// one where none do has no ace however long it is looked at. README → "Where
// the ball finishes" has what it found — above all that a machine which sets
// the ball's pace (a belt, a ramp at two g, a pipe, a carousel) or its place
// (a bowl) leaves every shot on the same cell, so the ace is all or nothing
// until the pin is moved off it or the ground past it is made to lean.
//
// The cup is parked on the tee for the sweep so nothing drops on the way;
// the "holed" figure is only the dribbles that never left it. Numbers are
// per thousand shots out of that club, north up, x left to right. On a hole
// that moves it is played at four moments of the slowest beat.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const js = join(dirname(fileURLToPath(import.meta.url)), '..', 'js');
const ctx = { console, Math, performance: { now: () => Date.now() } };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['config.js', 'physics.js', 'courses.js', 'swing.js', 'bot.js', 'lab.js']) {
    vm.runInContext(readFileSync(join(js, f), 'utf8'), ctx, { filename: f });
}
const G3 = ctx.G3, L = G3.lab;

const args = process.argv.slice(2);
const value = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const course = G3.courseById(args[0]);
const index = Number(value('--hole', 1)) - 1;
if (!course || !course.holes[index]) {
    console.error('usage: rest-map.mjs <course id> --hole <1..6> [--club id] [--cell 1] [--step 2] [--weights 25]');
    process.exit(1);
}
const h = course.holes[index];
const cell = Number(value('--cell', 1)), step = Number(value('--step', 2)), weights = Number(value('--weights', 25));
const bag = value('--club') ? value('--club').split(',').map(L.clubById) : G3.bagFor(h);
const b = h.bounds, x0 = Math.floor(b.minX), z0 = Math.floor(b.minZ);
const nx = Math.ceil((b.maxX - x0) / cell), nz = Math.ceil((b.maxZ - z0) / cell);
const pin = { x: h.cup.x, z: h.cup.z };
h.cup.x = h.tee.x; h.cup.z = h.tee.z;
const moments = L.moments(h, 4);

console.log(`${course.name} ${index + 1}, ${h.name}: tee (${h.tee.x}, ${h.tee.z}), pin (${pin.x}, ${pin.z}), ` +
    `x ${x0}..${x0 + nx * cell}, z ${z0}..${z0 + nz * cell}, cell ${cell}`);
for (const club of bag) {
    const grid = Array.from({ length: nz }, () => new Array(nx).fill(0));
    let n = 0, lost = 0, holed = 0;
    for (const at of moments) for (let a = 0; a < 360; a += step) for (let k = 1; k <= weights; k++) {
        const w = L.shoot(h, club, a * Math.PI / 180, club.power * k / weights, at);
        n++;
        if (!w) continue;
        if (w.sunk) { holed++; continue; }
        if (w.out) { lost++; continue; }
        const i = Math.floor((w.ball.x - x0) / cell), j = Math.floor((w.ball.z - z0) / cell);
        if (i >= 0 && i < nx && j >= 0 && j < nz) grid[j][i]++;
    }
    console.log(`\n${club.id}: ${n} shots, ${(100 * lost / n).toFixed(1)}% lost, ${(100 * holed / n).toFixed(1)}% never left the tee`);
    for (let j = nz - 1; j >= 0; j--) {
        const pj = Math.floor((pin.z - z0) / cell), pi = Math.floor((pin.x - x0) / cell);
        console.log(String((z0 + j * cell).toFixed(cell < 1 ? 1 : 0)).padStart(5) + ' ' + grid[j].map((c, i) => {
            const v = c ? String(Math.min(999, Math.round(1000 * c / n))) : '.';
            return (j === pj && i === pi ? '[' + v + ']' : v).padStart(4);
        }).join(''));
    }
}
