// Level 3 — Gale-Force Winds
// Biome: Glacial Peaks / Ice Blue.
// A permanent katabatic wind blows from the right — the player must counter-thrust to hold position.
// The tall central peak forces a tight approach into the summit; a floating overhang blocks the easy top-down line.
// Peak Station sits in a narrow saddle: tight pads + constant wind = precision demanded.

registerLevel({
  name: "L3: Gale-Force Winds",
  missionTitle: "Glacial Peaks — Summit Delivery",
  description: "Katabatic winds howl down from the Glacial Peaks at a constant rate. Your delivery target — Peak Station — is wedged into the ridge summit, blocked from above by an ice overhang. You'll need to fight the crosswind the whole way in, then hold a steady hover long enough to drop cleanly.",
  hint: "The wind blows constantly from the right — lean left with the side thruster to hold position. Approach the summit from below and to the west, under the overhang. Return to HQ to extract.",
  gravity: 0.15,
  wind: 0.08,
  // Was "rain" — a mismatch for an ice biome (Glacial Peaks), and the exact
  // one the "Biome Weather Effects" backlog item called for. Notably,
  // startLevel()'s own weather fallback logic (game.js, grep "Glacial")
  // already infers 'snow' for a level named "Glacial" — it just never ran
  // because this explicit config value always took precedence.
  weather: "snow",
  budget: 1500,
  timeLimit: 200,
  padScale: 0.65,
  targetCargo: 2,
  allowedTypes: ["normal"],
  startX: 330,
  startY: 650,
  collectionX: 480,
  collectionY: 490,
  quests: [
    questPrimary("Deliver 2 cargo to Peak Station"),
    questNoCrash(350),
    questNoCargoLost('No cargo lost', 250)
  ],
  palette: {
    skyTop: "#030712",
    skyMid: "#0b1b36",
    skyBot: "#132b4b",
    terrainFill: "#02050a",
    rockEdge: "#7dd3fc",
    rockGlow: "rgba(125,211,252,",
    fog: "rgba(125,211,252,0.06)",
  },
  outOfBounds: {
    type: "acid",
    color: "rgba(168, 85, 247, 0.7)", // Purple acid
    mistColor: "rgba(168, 85, 247, 0.4)", // Purple mist
    surfaceY: 800,
    monsterDepth: 1200,
    drag: 5,
    buoyancy: 0.01,
  },
  deliveryHubs: [
    { x: 1070, color: "#38bdf8", type: "normal", name: "Peak Station" }
  ],
  waterBodies: [
    {
      hasBoat: false,
      pts: [
        {x: 610, y: 300},
        {x: 810, y: 300},
        {x: 810, y: 350},
        {x: 610, y: 350}
      ]
    }
  ],
  hazards: [
    {
      type: "laser",
      onMs: 20,
      offMs: 20,
      warnMs: 800,
      damagePerSec: 41,
      thickness: 15,
      pts: [
        {x: 610, y: 140},
        {x: 610, y: 280}
      ]
    },
    {
      type: "laser",
      onMs: 20,
      offMs: 20,
      phaseOffset: 10,
      warnMs: 400,
      damagePerSec: 40,
      thickness: 15,
      pts: [
        {x: 810, y: 140},
        {x: 810, y: 290}
      ]
    }
  ],
  terrainPolygons: [
    // Ground
    [
        {x: 20, y: 930},
        {x: 140, y: 710},
        {x: 300, y: 650},
        {x: 300, y: 650},
        {x: 400, y: 650},
        {x: 440, y: 490},
        {x: 580, y: 490},
        {x: 600, y: 390},
        {x: 570, y: 340},
        {x: 540, y: 340},
        {x: 490, y: 330},
        {x: 470, y: 300},
        {x: 490, y: 260},
        {x: 550, y: 260},
        {x: 620, y: 280},
        {x: 660, y: 330},
        {x: 760, y: 330},
        {x: 810, y: 290},
        {x: 900, y: 290},
        {x: 990, y: 470},
        {x: 1020, y: 540},
        {x: 1190, y: 540},
        {x: 1300, y: 470},
        {x: 1540, y: 700},
        {x: 1560, y: 1210},
        {x: 10, y: 1200}
    ],
    // Ceiling
    [
        {x: -630, y: -1220},
        {x: 2050, y: -1070},
        {x: 1200, y: -20},
        {x: 1150, y: 140},
        {x: 1000, y: 190},
        {x: 870, y: 130},
        {x: 810, y: 140},
        {x: 680, y: 110},
        {x: 610, y: 140},
        {x: 580, y: 130},
        {x: 540, y: 80},
        {x: 420, y: 10},
        {x: 270, y: -50}
    ]
  ]
});
