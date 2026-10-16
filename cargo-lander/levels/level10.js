// Level 10 — The Crystal Caves
// Biome: Underground / cyan, in total darkness.
//
// 2026-10-16 rebuild. The old L10 was one horizontal corridor with three
// crushers — the same beat-timing test as L8 and L13, in the dark. Playtest:
// "no fun", and the darkness had been "nerfed" by glowing crystals. This
// version is VERTICAL and it is DARK (nightDarkness 0.96): you descend a mine
// by sonar and spotlight, and the cave itself is the puzzle.
//
//   SURFACE    y:300   HQ and the depot on the plateau, the mine head between.
//   SHAFT ONE  x 580-800, y 300-900. Crystal clusters (spike hazards) grow
//              from alternating walls: a slalom you fly downward, by feel.
//   GALLERY    y 900-1150. Upper Node (blue) at the west end. A crystal FLOOR
//              PANE seals a shortcut shaft at x 440-560 — a fragile segment
//              that shatters if you hit it faster than ~4px/frame. Dive into
//              it and you drop straight into the Deep Hall. Ease onto it and
//              it holds like a floor.
//   SHAFT TWO  x 1160-1340, y 1150-1700. The long way down: a draft puffs
//              up the shaft on a beat, and crystals jut from its walls.
//   DEEP HALL  y 1700-1950. Deep Mining Post (normal) at the west end, the
//              Crystal Pump ($4) at the east, and a pinball of BOUNCY
//              crystal shards in between (bouncy segments).
//
// The cave is sealed (surface plateau wall to wall), every pad y is explicit,
// and the crushers are gone — presses belong to L13.

registerLevel({
  name: "L10: The Crystal Caves",
  missionTitle: "Crystal Caves — Lights Out",
  description: "The power's out in the crystal mine and the job won't wait. Fly down the main shaft on your spotlight and sonar, deliver blue cargo to the Upper Node in the gallery and the rest to the Deep Mining Post at the bottom. The crystals cut. The old miners swear there's a quicker way down — through the gallery floor.",
  hint: "Ping often: the sonar shows the walls before the spotlight does. Shaft One is a slalom — crystals jut from alternating walls. In the gallery, the pale floor pane over the west shaft shatters if you dive into it hard; land on it gently and it holds. Shaft Two's draft puffs upward on a beat — drop through between puffs. The Deep Hall's shards bounce you hard: go slow between them. The only fuel is the Crystal Pump in the Deep Hall ($4/unit).",

  weather: 'bubbles',
  backgroundType: 'cave',

  // ── Physics ───────────────────────────────────────────────────────────────
  gravity: 0.11,
  wind: 0,
  windVarianceEnabled: false,
  heavyCargo: true,
  night: true,
  nightDarkness: 0.96,
  maxFuel: 150,

  // ── Mission parameters ────────────────────────────────────────────────────
  targetCargo: 3,
  deposit: 1000,
  fee: 500,
  timeLimit: 270,
  allowedTypes: ["normal", "blue"],
  startX: 80,
  startY: 300,
  collectionX: 320,
  collectionY: 300,

  quests: [
    questPrimary('Deliver 3 cargo down the crystal mine and get back out'),
    questNoCrash(400),
    questNoCargoLost('Not a crate lost to the crystals', 400),
    questQuick('Finish in under 3 minutes', 90, 600),   // timeGoal = seconds LEFT on the 270s clock
  ],

  // ── Terrain ───────────────────────────────────────────────────────────────
  terrainPolygons: [
    // WEST MASS — surface west of the mine head, Shaft One's west wall, the
    // gallery's west end and floor up to the shortcut, the shortcut's west
    // wall, the Deep Hall's west end and its whole floor.
    [
      {x: -300, y: 300}, {x: 520, y: 300}, {x: 580, y: 320},
      {x: 576, y: 420}, {x: 590, y: 520}, {x: 578, y: 640}, {x: 586, y: 760}, {x: 572, y: 880},
      {x: 545, y: 905}, {x: 420, y: 895}, {x: 300, y: 915}, {x: 215, y: 905},
      {x: 196, y: 980}, {x: 208, y: 1080}, {x: 200, y: 1150},
      {x: 420, y: 1150}, {x: 440, y: 1160},
      {x: 436, y: 1300}, {x: 448, y: 1450}, {x: 432, y: 1600}, {x: 440, y: 1690},
      {x: 300, y: 1705}, {x: 170, y: 1700},
      {x: 152, y: 1780}, {x: 160, y: 1880}, {x: 150, y: 1950},
      {x: 640, y: 1950}, {x: 700, y: 1930}, {x: 800, y: 1950}, {x: 1400, y: 1950},
      {x: 1400, y: 2400}, {x: -300, y: 2400}
    ],
    // MIDDLE SLAB — between the gallery floor and the Deep Hall roof, from the
    // shortcut shaft to Shaft Two.
    [
      {x: 560, y: 1160}, {x: 580, y: 1150}, {x: 800, y: 1150}, {x: 860, y: 1162},
      {x: 1000, y: 1150}, {x: 1160, y: 1150},
      {x: 1152, y: 1300}, {x: 1168, y: 1450}, {x: 1156, y: 1600}, {x: 1160, y: 1700},
      {x: 1000, y: 1712}, {x: 820, y: 1700}, {x: 700, y: 1715}, {x: 564, y: 1700},
      {x: 572, y: 1550}, {x: 556, y: 1400}, {x: 566, y: 1260}
    ],
    // EAST MASS — surface east of the mine head, Shaft One's east wall, the
    // gallery roof, the gallery's and Shaft Two's east wall, the Deep Hall's
    // east end.
    [
      {x: 800, y: 320}, {x: 860, y: 300}, {x: 1600, y: 300}, {x: 1600, y: 2400},
      {x: 1400, y: 2400}, {x: 1400, y: 1950},
      {x: 1410, y: 1860}, {x: 1396, y: 1760}, {x: 1400, y: 1700},
      {x: 1340, y: 1700}, {x: 1350, y: 1560}, {x: 1332, y: 1400}, {x: 1346, y: 1250},
      {x: 1338, y: 1100}, {x: 1350, y: 960}, {x: 1320, y: 905},
      {x: 1150, y: 915}, {x: 1000, y: 895}, {x: 880, y: 912}, {x: 830, y: 895},
      {x: 810, y: 880}, {x: 800, y: 760}, {x: 792, y: 640}, {x: 806, y: 520}, {x: 794, y: 420}
    ]
  ],

  // ── Segments — the crystal floor pane and the Deep Hall shards ─────────────
  segments: [
    // The shortcut pane (fragile): a floor if you land soft, a door if you dive.
    { x1: 440, y1: 1158, x2: 560, y2: 1158, fragile: true },
    // Bouncy crystal shards in the Deep Hall — a pinball between the post and the pump.
    { x1: 640, y1: 1950, x2: 690, y2: 1830, bouncy: true },
    { x1: 820, y1: 1700, x2: 860, y2: 1800, bouncy: true },
    { x1: 950, y1: 1950, x2: 1010, y2: 1850, bouncy: true },
    { x1: 1080, y1: 1712, x2: 1120, y2: 1800, bouncy: true }
  ],

  // ── Hazards ───────────────────────────────────────────────────────────────
  hazards: [
    // Shaft One slalom — crystal clusters on alternating walls.
    { type: "spike", pts: [{ x: 596, y: 450 }], radius: 22, damagePerSec: 60, color: "#67e8f9", look: "crystal" },
    { type: "spike", pts: [{ x: 784, y: 610 }], radius: 22, damagePerSec: 60, color: "#67e8f9", look: "crystal" },
    { type: "spike", pts: [{ x: 600, y: 770 }], radius: 22, damagePerSec: 60, color: "#67e8f9", look: "crystal" },
    // Gallery ceiling clusters
    { type: "spike", pts: [{ x: 1000, y: 915 }], radius: 22, damagePerSec: 60, color: "#a5f3fc", look: "crystal" },
    // Shaft Two
    { type: "spike", pts: [{ x: 1172, y: 1330 }], radius: 20, damagePerSec: 60, color: "#67e8f9", look: "crystal" },
    { type: "spike", pts: [{ x: 1328, y: 1500 }], radius: 20, damagePerSec: 60, color: "#67e8f9", look: "crystal" },
    // The draft — puffs up Shaft Two on a beat (repulsor duty cycle).
    {
      type: 'repulsor',
      color: 'rgba(103, 232, 249, 0.12)',
      travelX: 0, travelY: -0.2,
      gustMs: 900, calmMs: 2100, warnMs: 500,
      pts: [{x: 1170, y: 1170}, {x: 1330, y: 1170}, {x: 1330, y: 1690}, {x: 1170, y: 1690}]
    }
  ],

  // ── Hubs ──────────────────────────────────────────────────────────────────
  deliveryHubs: [
    { x: 250,  y: 1150, width: 80, color: "#3b82f6", type: "blue",   name: "Upper Node" },
    { x: 240,  y: 1950, width: 90, color: "#38bdf8", type: "normal", name: "Deep Mining Post" },
    { x: 1220, y: 1950, width: 60, color: "#f59e0b", type: "refuel", name: "Crystal Pump", pricePerUnit: 4 }
  ],

  // ── Collectibles ──────────────────────────────────────────────────────────
  collectibles: [
    { type: 'cash', x: 680,  y: 690,  value: 300 },  // mid-slalom
    { type: 'fuel', x: 1150, y: 1080, amount: 40 },  // gallery east end
    { type: 'cash', x: 500,  y: 1500, value: 600 },  // down the shortcut shaft — only if you smash in
    { type: 'cash', x: 905,  y: 1880, value: 500 }   // among the bouncing shards
  ],

  // ── Decals (render/decals.js) — mostly invisible until your light finds them
  decals: [
    // Surface camp and the mine head
    { type: 'lamp', x: 200, y: 300, color: '#fbbf24' }, { type: 'crates', x: 470, y: 300, n: 3 },
    { type: 'sign', x: 540, y: 304 }, { type: 'sign', x: 840, y: 306, flip: true },
    { type: 'cable', x: 520, y: 250, x2: 860, y2: 250, sag: 12 }, { type: 'hanglamp', x: 690, y: 262, len: 30, color: '#fbbf24' },
    { type: 'barrels', x: 1000, y: 300, n: 4 }, { type: 'tank', x: 1200, y: 300, s: 0.8 }, { type: 'pine', x: 1450, y: 300 }, { type: 'pine', x: -150, y: 300 },
    // Gallery
    { type: 'crystal', x: 420, y: 895, s: 0.8 }, { type: 'stalactite', x: 300, y: 915, len: 60 }, { type: 'stalactite', x: 880, y: 912, len: 70 },
    { type: 'crystal', x: 700, y: 1150, color: '#a5f3fc' }, { type: 'crystal', x: 930, y: 1156, s: 0.7 },
    { type: 'bones', x: 1100, y: 1150, s: 0.7 }, { type: 'hanglamp', x: 1150, y: 915, len: 40, color: '#64748b' },
    // Shortcut shaft & Shaft Two
    { type: 'crystal', x: 436, y: 1420, s: 0.6, color: '#a5f3fc' },
    { type: 'stalactite', x: 1250, y: 910, len: 40 },
    // Deep Hall
    { type: 'crystal', x: 400, y: 1950, color: '#67e8f9' }, { type: 'crystal', x: 1320, y: 1950, color: '#c4b5fd' },
    { type: 'mushroom', x: 560, y: 1950, n: 3, color: '#67e8f9' }, { type: 'stalactite', x: 300, y: 1705, len: 80 },
    { type: 'stalactite', x: 960, y: 1710, len: 60 }, { type: 'crates', x: 360, y: 1950, n: 2 }
  ],

  worldBounds: {
    bottomY: 2300,
    bottomAction: 'monster',
    leftMargin: 3000,
    rightMargin: 3000
  },

  // ── Palette (Cyan Caves) ──────────────────────────────────────────────────
  palette: {
      skyTop:      '#020617',
      skyMid:      '#040b16',
      skyBot:      '#051114',
      terrainFill: '#010204',
      rockEdge:    '#06b6d4',
      rockGlow:    'rgba(6,182,212,',
      fog:         'rgba(6,182,212,0.1)',
  },
});
