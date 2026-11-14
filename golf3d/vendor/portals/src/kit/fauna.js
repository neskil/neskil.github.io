// Fauna kit: wildlife, all animated procedurally on the GPU. See docs/kit/fauna.md.
export { FAUNA_LIGHTS, resolveLight as faunaLight, lightFrom, bakeRoute, loopPoints, crossPoints, alongPoints, resolveRoute, makeTravel, routeBounds, sphereOfPoints, wingReach, hingeReach, pathLine, lineDist, clearRoute,
  Geo, creatureMaterial, creatureMesh, instancedGeo, shadowMaterial, blobGeometry, makeFauna, FRAG_LIT, GLSL_ROUTE, GLSL_UTIL } from './fauna/common.js';
export { makeFlock, makeFlockAsync, birdGeometry, BIRD_PRESETS } from './fauna/birds.js';
export { makeWhale, whaleGeometry, makeMantaRay, mantaGeometry, makeTurtle, turtleGeometry, makeShark, sharkGeometry, makeDolphins, dolphinGeometry, makeSwimmer, hull } from './fauna/marine.js';
export { makeButterflies, makeMoths, makeDragonflies, makeBees, makeFireflies, scatterAnchors, butterflyGeometry, dragonflyGeometry, beeGeometry, BUTTERFLY_VARIETIES, MOTH_VARIETIES, DRAGONFLY_VARIETIES } from './fauna/insects.js';
export { makeHerd, quadrupedGeometry, HERD_PRESETS, makeWaders, waderGeometry, WADER_PRESETS } from './fauna/land.js';
export { makeLeviathan, leviathanGeometry, makeFloatingJellies, makeRibbonEels, makeTripods, tripodGeometry, TRIPOD_PRESET } from './fauna/alien.js';
export { makeFishSchool, fishGeometry, FISH_PRESETS, makeJellyfish, jellyGeometry, JELLY_PRESETS } from './fauna/fish.js';
