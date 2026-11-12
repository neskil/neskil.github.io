// Terrain kit: land. See docs/kit/terrain.md.
export { makeDetailTexture, makeStrata } from './terrain/textures.js';
export { makeTerrainMaterial, makeRockMaterial } from './terrain/material.js';
export { mountains, hills, dunes, canyon, mesas, karst, volcano, islands, riverValley, terrace, stepper, blend, withCorridor, pathNearest, smin, smax } from './terrain/heights.js';
export { BIOMES, resolveBiome, makeTerrain, makeTerrainAsync } from './terrain/mesh.js';
export * from './terrain/rocks.js';
export { makeHorizonRidges } from './terrain/horizon.js';
