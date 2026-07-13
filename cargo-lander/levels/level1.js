// Level 1 — Local Distribution
// Biome: Grasslands / Verdant Basin.
// Your first contract: a rolling highland with a single receiving hub.
// Gently sloping terrain teaches the player that tilt kills cargo before anything else.

registerLevel({
  name: "L1: Local Distribution",
  missionTitle: "Verdant Basin — First Delivery",
  description: "Welcome to the Verdant Basin, your first posting as a certified cargo pilot. A nearby logistics hub needs a routine freight drop — nothing exotic, just get the packages there in one piece. Tilt too far and they slide off the deck.",
  hint: "Land slowly (< 2.0 m/s) or you'll bounce the cargo off the deck. When both crates are delivered, fly back to HQ to extract.",

  // ── Physics ──────────────────────────────────────────────────────────────
  gravity: 0.15,
  wind: 0.01,       // Barely-there breeze — first level, don't fight the player on tilt yet
  weather: 'rain',

  // ── Mission parameters ────────────────────────────────────────────────────
  deposit: 1000,
  fee: 50,
  timeLimit: 180,
  padScale: 1.5,
  targetCargo: 2,
  allowedTypes: ["normal"],

  // ── Terrain ───────────────────────────────────────────────────────────────
  startX: -330,
  collectionX: 180,

  // ── Quests ────────────────────────────────────────────────────────────────
  quests: [
    questPrimary("Deliver 2 cargo to Verdant Depot"),
    questNoCrash(),
    questQuick("Complete under 60s", 60)
  ],

  // ── Palette (Grasslands) ──────────────────────────────────────────────────
  palette: {
    skyTop: "#25338fff",
    skyMid: "#163158",
    skyBot: "#1f4e25",
    terrainFill: "#020802",
    rockEdge: "#4ade80",
    rockGlow: "rgba(74,222,128,",
    fog: "rgba(74,222,128,0.04)",
  },

  // ── Environment ───────────────────────────────────────────────────────────
  outOfBounds: {
    type: "water",
    color: "rgba(14, 165, 233, 0.4)",
    mistColor: "rgba(14, 165, 233, 0.2)",
    surfaceY: 1000,
    drag: 0.92,
    buoyancy: -0.15,
  },
  worldBounds: {
    bottomY: 1050,
    bottomAction: 'monster',
    leftMargin: 3000,
    rightMargin: 3000
  },

  // ── Hubs ──────────────────────────────────────────────────────────────────
  deliveryHubs: [
    { x: 998, color: "#38bdf8", type: "normal", name: "Verdant Depot" }
  ],

  // ── Water Bodies ──────────────────────────────────────────────────────────
  waterBodies: [
    {
      hasBoat: true,
      pts: [
        {x: 330, y: 580},
        {x: 770, y: 580},
        {x: 830, y: 730},
        {x: 540, y: 820},
        {x: 320, y: 760}
      ]
    },
    {
      hasBoat: false,
      pts: [
        {x: 1110, y: 334},
        {x: 1310, y: 334},
        {x: 1310, y: 382},
        {x: 1110, y: 382}
      ]
    }
  ],

  // ── Terrain Polygons ──────────────────────────────────────────────────────
  terrainPolygons: [
    // Ground
    [
        {x: -420, y: 660},
        {x: -360, y: 770},
        {x: -190, y: 770},
        {x: -140, y: 710},
        {x: -20, y: 690},
        {x: 90, y: 750},
        {x: 110, y: 660},
        {x: 90, y: 580},
        {x: 90, y: 480},
        {x: 120, y: 430},
        {x: 170, y: 420},
        {x: 330, y: 420},
        {x: 360, y: 500},
        {x: 340, y: 630},
        {x: 330, y: 700},
        {x: 420, y: 770},
        {x: 620, y: 750},
        {x: 700, y: 750},
        {x: 730, y: 700},
        {x: 750, y: 660},
        {x: 740, y: 610},
        {x: 750, y: 560},
        {x: 800, y: 560},
        {x: 870, y: 570},
        {x: 900, y: 650},
        {x: 940, y: 700},
        {x: 1130, y: 700},
        {x: 1180, y: 670},
        {x: 1230, y: 680},
        {x: 1520, y: 980},
        {x: 1640, y: 1350},
        {x: -960, y: 1330},
        {x: -880, y: 880},
        {x: -700, y: 790},
        {x: -640, y: 700},
        {x: -470, y: 720}
    ],
    // New polygon
    [
        {x: 1099, y: 425},
        {x: 1223, y: 445},
        {x: 1280, y: 440},
        {x: 1340, y: 405},
        {x: 1344, y: 342},
        {x: 1330, y: 321},
        {x: 1294, y: 329},
        {x: 1260, y: 360},
        {x: 1150, y: 350},
        {x: 1140, y: 300},
        {x: 1120, y: 310},
        {x: 1100, y: 290},
        {x: 1070, y: 310},
        {x: 1064, y: 374}
    ]
  ]
});
