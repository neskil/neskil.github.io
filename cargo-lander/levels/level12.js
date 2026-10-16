// Level 12 — Red Rock Run (Test Flight, unlocked from start)
// Biome: Red-rock desert canyon under a hard blue sky.
//
// 2026-10-16 rebuild. The old "Switchback Canyon" was three rock shelves in a
// well — a careful vertical slalom that played slow and looked bare. Playtest:
// "no fun". This is a canyon RACE: a tight clock that you feed by flying
// through TIME RINGS (collectible type 'ring', +5s each) strung along the
// fast line. Every route through the canyon has its rings; taking them is how
// a two-trip mission fits on the clock.
//
// Layout (left → right; y grows downward):
//   x -500..380    WEST MESA (y:320) — HQ.
//   x  380..560    the west cliff, down to the canyon floor (y:880) — depot.
//   x  930..1230   THE BUTTE — a freestanding tower; Ledge Camp (red) on top,
//                  a rope bridge sagging over to it from the mesa (scenery).
//   x 1480..1920   THE ARCH — a natural arch standing across the canyon
//                  (background scenery); the Spring Pump and two rings under it.
//   x 2020..2330   the river — scenery, and a splash if you fly low.
//   x 2440..2530   THE CHIMNEY — a rock tower beside the east cliff; the slot
//                  between them is the quick way up to the rim, with rings.
//   x 2700..3300   EAST MESA (y:360) — Rim Station.

registerLevel({
  name: "L12: Red Rock Run",
  missionTitle: "Red Rock Canyon — Clock Run",
  description: "The canyon courier run, against the clock. Haul crates up from the canyon floor: red to the camp on top of the Butte, the rest all the way up to Rim Station on the east mesa. The clock is short — but every time ring you fly through puts five seconds back on it.",
  hint: "Rings mark the fast line: down the west cliff, under the Arch, over the river and up the Chimney slot. Miss them and the clock wins. The Spring Pump under the Arch is the only fuel ($3). The Chimney is a squeeze with crates on — go up it straight and slow, or fly round the outside of the tower.",
  unlocked: true,

  // ── Physics ──────────────────────────────────────────────────────────────
  gravity: 0.1,
  maxFuel: 200,
  wind: 0.01,
  windVarianceEnabled: false,

  // ── Mission parameters ────────────────────────────────────────────────────
  deposit: 1000,
  fee: 150,
  timeLimit: 200,
  padScale: 1.1,
  targetCargo: 4,
  allowedTypes: ["normal", "red"],

  startX: -280,
  startY: 320,
  collectionX: 640,
  collectionY: 880,

  terrainDecor: 'rock',
  ambientTrafficRate: 0,

  quests: [
    questPrimary("Deliver 4 crates out of the canyon"),
    questNoCrash(400),
    questQuick("Finish in under 2 minutes", 80, 500),
  ],

  palette: {
    skyTop: "#0c4a6e",
    skyMid: "#38bdf8",
    skyBot: "#fde68a",
    terrainFill: "#3b0d05",
    rockEdge: "#f97316",
    rockGlow: "rgba(249,115,22,",
    fog: "rgba(253,186,116,0.06)",
  },

  worldBounds: {
    leftMargin: 1500,
    rightMargin: 1500
  },

  // ── Hubs ──────────────────────────────────────────────────────────────────
  deliveryHubs: [
    { x: 1040, y: 420, color: "#ef4444", type: "red",    name: "Ledge Camp"  },
    { x: 2900, y: 360, color: "#38bdf8", type: "normal", name: "Rim Station" },
    { x: 1720, y: 885, width: 60, color: "#f59e0b", type: "refuel", name: "Spring Pump", pricePerUnit: 3 }
  ],

  // ── Rings and pickups ─────────────────────────────────────────────────────
  collectibles: [
    { type: 'ring', x: 560,  y: 600, seconds: 5 },   // down the west cliff
    { type: 'ring', x: 880,  y: 650, seconds: 5 },   // up the Butte's west face
    { type: 'ring', x: 1090, y: 300, seconds: 5 },   // over the Butte
    { type: 'ring', x: 1620, y: 760, seconds: 5 },   // through the Arch...
    { type: 'ring', x: 1800, y: 760, seconds: 5 },   // ...and out
    { type: 'ring', x: 2180, y: 810, seconds: 5 },   // skimming the river
    { type: 'ring', x: 2590, y: 720, seconds: 5 },   // into the Chimney
    { type: 'ring', x: 2600, y: 470, seconds: 5 },   // out of the Chimney
    { type: 'cash', x: 1700, y: 440, value: 300 },   // up under the top of the Arch
    { type: 'fuel', x: 2470, y: 400, amount: 30 }    // atop the Chimney tower
  ],

  // ── Water — the canyon river ──────────────────────────────────────────────
  waterBodies: [
    {
      hasBoat: false,
      color: 'rgba(14, 116, 144, 0.55)',
      surfaceColor: '#0e7490',
      pts: [{ x: 2010, y: 920 }, { x: 2335, y: 920 }, { x: 2335, y: 970 }, { x: 2010, y: 970 }]
    }
  ],

  // ── Terrain ───────────────────────────────────────────────────────────────
  terrainPolygons: [
    // The canyon profile: west mesa, west cliff, floor, the Butte, floor, the
    // river bed, the east cliff and the east mesa.
    [
      { x: -500, y: 320 }, { x: 380, y: 320 }, { x: 420, y: 360 }, { x: 440, y: 480 },
      { x: 470, y: 600 }, { x: 450, y: 720 }, { x: 480, y: 830 }, { x: 520, y: 880 },
      { x: 800, y: 880 }, { x: 860, y: 870 }, { x: 930, y: 800 }, { x: 952, y: 640 },
      { x: 962, y: 520 }, { x: 984, y: 445 }, { x: 1008, y: 421 }, { x: 1180, y: 420 },
      { x: 1210, y: 440 }, { x: 1230, y: 560 }, { x: 1220, y: 700 }, { x: 1260, y: 820 },
      { x: 1320, y: 880 }, { x: 1500, y: 885 }, { x: 1690, y: 885 }, { x: 1900, y: 885 },
      { x: 2000, y: 905 }, { x: 2050, y: 960 }, { x: 2300, y: 960 }, { x: 2350, y: 905 },
      { x: 2450, y: 885 }, { x: 2600, y: 885 }, { x: 2650, y: 860 }, { x: 2640, y: 700 },
      { x: 2662, y: 560 }, { x: 2652, y: 455 }, { x: 2668, y: 395 }, { x: 2692, y: 368 }, { x: 2720, y: 360 },
      { x: 3300, y: 360 }, { x: 3300, y: 1400 }, { x: -500, y: 1400 }
    ],
    // The Chimney tower
    [
      { x: 2440, y: 920 }, { x: 2450, y: 700 }, { x: 2440, y: 560 }, { x: 2460, y: 490 },
      { x: 2500, y: 470 }, { x: 2525, y: 500 }, { x: 2520, y: 640 }, { x: 2530, y: 780 },
      { x: 2525, y: 920, invisibleEdge: true }   // base buried in the floor: no stroke
    ]
  ],

  // ── Decals (render/decals.js) ─────────────────────────────────────────────
  decals: [
    // West mesa
    { type: 'cactus', x: -420, y: 320 }, { type: 'cactus', x: -40, y: 320, s: 0.8 }, { type: 'flag', x: -120, y: 320, color: '#f97316' },
    { type: 'skull', x: 150, y: 320 }, { type: 'bush', x: 260, y: 320, color: '#4d7c0f' }, { type: 'hoodoo', x: 330, y: 320, s: 0.7 },
    { type: 'bridge', x: 370, y: 322, x2: 1000, y2: 422, sag: 80 },
    // Canyon floor & depot
    { type: 'rock', x: 540, y: 880 }, { type: 'crates', x: 790, y: 880, n: 3 }, { type: 'barrels', x: 590, y: 880, n: 2 },
    { type: 'cactus', x: 1290, y: 860, s: 0.7 }, { type: 'hoodoo', x: 1380, y: 882, s: 0.9 }, { type: 'bones', x: 1430, y: 884, s: 0.7 },
    // The Butte camp
    { type: 'hut', x: 1150, y: 420, s: 0.9 }, { type: 'flag', x: 1010, y: 420, color: '#ef4444' }, { type: 'lamp', x: 1170, y: 420, color: '#fbbf24' },
    // The Arch — stands across the canyon, so it is scenery you fly under
    { type: 'arch', x: 1700, y: 885, w: 460, h: 400, back: true },
    { type: 'sign', x: 1440, y: 885, s: 0.8 }, { type: 'rock', x: 1960, y: 892, s: 0.8 },
    // River & chimney
    { type: 'bush', x: 1975, y: 895, color: '#3f6212' }, { type: 'rock', x: 2380, y: 895, s: 0.7 }, { type: 'hoodoo', x: 2405, y: 888, s: 0.6 },
    { type: 'sign', x: 2610, y: 885, s: 0.8 },
    // East mesa
    { type: 'cactus', x: 2760, y: 360 }, { type: 'dish', x: 3050, y: 360 }, { type: 'flag', x: 3010, y: 360, color: '#38bdf8' },
    { type: 'hoodoo', x: 3180, y: 360 }, { type: 'skull', x: 2820, y: 360, s: 0.8 }
  ]
});
