#!/usr/bin/env node
/* Writes js/portal-worlds.js: every world in vendor/portals (Portals' own
   registry, src/worlds/index.js) as plain data a classic script can read
   before the module half of the game has loaded — endless.js deals from it.

     node golf3d/tools/portal-index.mjs

   Run it after dropping a newer Portals release into vendor/portals. The
   registry's `load` functions are never called: only its fields are read. */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const { WORLDS } = await import(join(here, '../vendor/portals/src/worlds/index.js'));
const rows = WORLDS.filter((w) => !w.antechamber && !/^_/.test(w.id)).map((w) => [
    w.id, w.name, w.category || '', Math.round((w.weirdness || 0) * 100) / 100,
    w.tone || [0.5, 0.1], (w.media || ['air']).join(' '), w.line || ''
]);
const out = `/* Every world of Portals vendored in vendor/portals — written by
   tools/portal-index.mjs from Portals' own registry (src/worlds/index.js),
   so do not edit by hand. [id, name, category, weirdness, tone [hue, chroma],
   media, line]. ${rows.length} worlds. Portals is Ethan Mollick's, CC BY-NC-SA 4.0. */
window.G3 = window.G3 || {};
window.G3.PORTAL_INDEX = ${JSON.stringify(rows).replace(/\],\[/g, '],\n[')};
`;
writeFileSync(join(here, '../js/portal-worlds.js'), out);
console.log('wrote js/portal-worlds.js:', rows.length, 'worlds');
