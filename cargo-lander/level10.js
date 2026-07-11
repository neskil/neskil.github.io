// Level 10 — The Crystal Caves
// Biome: Underground / Cyan.
// Features tight corridors and crushers embedded in the rock walls using the
// new `behindTerrain` property.

registerLevel({
  name: "L10: The Crystal Caves",
  missionTitle: "Crystal Caves — Precision Flying",
  description: "Navigate the winding Crystal Caves. Ancient automated mining crushers are still active, embedded within the rock walls. Time your passage carefully, as the crushers will smash anything caught between them. Deliver the cargo to the mining outposts and return to HQ.",
  weather: 'bubbles',

  // ── Physics ───────────────────────────────────────────────────────────────
  gravity: 0.15,
  wind: 0,
  heavyCargo: true,

  // ── Terrain ───────────────────────────────────────────────────────────────
  terrainPolygons: [
    // Floor
    [
        {x: -400, y: 500}, {x: 200, y: 500},
        {x: 400, y: 600}, {x: 600, y: 600},
        {x: 700, y: 500}, {x: 800, y: 400}, {x: 900, y: 450}, {x: 1000, y: 550},
        {x: 1200, y: 550}, {x: 1400, y: 450}, {x: 1600, y: 550}, {x: 1800, y: 550},
        {x: 2000, y: 500}, {x: 2400, y: 500},
        // Enclosure
        {x: 2400, y: 1200}, {x: -400, y: 1200}
    ],
    // Ceiling
    [
        {x: -400, y: -200}, {x: 2400, y: -200},
        {x: 2400, y: 300}, {x: 2000, y: 300},
        {x: 1800, y: 350}, {x: 1600, y: 350}, {x: 1400, y: 250}, {x: 1200, y: 350},
        {x: 1000, y: 350}, {x: 900, y: 250}, {x: 800, y: 200}, {x: 700, y: 300},
        {x: 600, y: 400}, {x: 400, y: 400},
        {x: 200, y: 300}, {x: -400, y: 300}
    ]
  ],

  // ── Hazards ───────────────────────────────────────────────────────────────
  hazards: [
    // Crusher embedded in the rock, smashing vertically
    {
      type: "crusher",
      pts: [
        { x: 500, y: 200 }, // Buried in ceiling
        { x: 500, y: 800 }  // Buried in floor
      ],
      waitUnloadedMs: 1500,
      crushMs: 150,
      waitLoadedMs: 400,
      retractMs: 1200,
      thickness: 60,
      color: "#06b6d4",
      behindTerrain: true
    },
    // Second embedded crusher
    {
      type: "crusher",
      pts: [
        { x: 1300, y: 100 }, // Buried in ceiling
        { x: 1300, y: 750 }  // Buried in floor
      ],
      waitUnloadedMs: 1200,
      crushMs: 200,
      waitLoadedMs: 500,
      retractMs: 1000,
      thickness: 50,
      color: "#06b6d4",
      behindTerrain: true,
      phaseOffset: 1000 // Offset so they don't sync
    }
  ],

  // ── Mission parameters ────────────────────────────────────────────────────
  targetCargo: 2,
  budget: 3000,
  timeLimit: 180,
  allowedTypes: ["normal", "blue"],
  collectionX: 100,
  startX: -100,

  // ── Environment ───────────────────────────────────────────────────────────
  outOfBounds: {
      type: 'void',
      color: 'rgba(6, 182, 212, 0.55)',
      mistColor: 'rgba(6, 182, 212, 0.25)',
      surfaceY: 900,
      drag: 0.9,
      buoyancy: -0.05,
      monsterDepth: 1200
  },

  // ── Hubs ──────────────────────────────────────────────────────────────────
  deliveryHubs: [
      { x: 800, width: 80, color: "#3b82f6", type: "blue", name: "Upper Node" },
      { x: 1700, width: 90, color: "#38bdf8", type: "normal", name: "Deep Mining Post" }
  ],

  // ── Palette (Cyan Caves) ─────────────────────────────────────────
  palette: {
      skyTop:      '#020617',
      skyMid:      '#040b16',
      skyBot:      '#051114',
      terrainFill: '#010204',
      rockEdge:    '#06b6d4',
      rockGlow:    'rgba(6,182,212,',
      fog:         'rgba(6,182,212,0.1)',
  },

  // ── UI ────────────────────────────────────────────────────────────────────
  hint: "Watch the ancient mining crushers. They are embedded deep within the rock walls. Time your passage carefully, and remember the return trip!",

  quests: [
      questPrimary('Deliver both cargo types and return safely'),
      questNoCrash(400),
      questQuick('Finish in under 2 minutes', 120, 500),
  ],
});
