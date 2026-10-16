// Level 10 — The Crystal Caves
// Biome: Underground / Cyan.
// Features tight corridors and crushers embedded in the rock walls using the
// new `behindTerrain` property.
//
// 2026-10 pass — it could not be finished as built:
//   - No fuel stop and a stock 120-unit tank against 3,200px of out-and-back
//     cave with heavy cargo: a careful pilot hit single digits ~35s in, before
//     the first delivery. Now: maxFuel 150 and a paid Crystal Pump on the far
//     shelf past Deep Mining Post ($4/unit) — fill up for the return.
//   - 180s for that round trip through three crushers left no room to wait a
//     cycle. 240s now (the quick bonus still asks for 3 minutes).
//   - Crushers open longer (1.8-2.0s of each cycle) — it is dark, and you
//     can't time what you can't see coming.
//   - The resonance gravity well pulled ~3x full thrust at its core (see the
//     hazard) — now a tug.
//   - It was the least varied map: one corridor, three identical crushers.
//     Glowing crystal clusters (spike hazards) now grow at the bends — they
//     tighten the line through each turn, and in the dark they double as the
//     only landmarks you can see.

registerLevel({
  name: "L10: The Crystal Caves",
  missionTitle: "Crystal Caves — Precision Flying",
  description: "Navigate the winding Crystal Caves in total darkness — main power to the outpost lights is down, so you're flying on your lander's spotlight alone. Ancient automated mining crushers are still active, embedded within the rock walls. Time your passage carefully, as the crushers will smash anything caught between them. Deliver the cargo to the mining outposts and return to HQ.",
  weather: 'bubbles',

  // ── Physics ───────────────────────────────────────────────────────────────
  gravity: 0.12,
  wind: 0.012,      // Light cave draft — subtle, the darkness/crusher timing is the real challenge
  heavyCargo: true,
  night: true,
  maxFuel: 150,

  // ── Terrain ───────────────────────────────────────────────────────────────
  terrainPolygons: [
    // Floor
    [
        {x: -400, y: 500}, {x: 200, y: 500},
        {x: 400, y: 600}, {x: 600, y: 600},
        {x: 700, y: 500}, {x: 792, y: 420}, {x: 888, y: 420}, {x: 900, y: 450}, {x: 1000, y: 550},
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
      waitUnloadedMs: 2000,
      crushMs: 200,
      waitLoadedMs: 400,
      retractMs: 1000,
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
      waitUnloadedMs: 1800,
      crushMs: 200,
      waitLoadedMs: 500,
      retractMs: 1000,
      thickness: 50,
      color: "#06b6d4",
      behindTerrain: true,
      phaseOffset: 1000 // Offset so they don't sync
    },
    // Third embedded crusher guarding the final stretch before Deep Mining Post
    {
      type: "crusher",
      pts: [
        { x: 1520, y: 150 },
        { x: 1520, y: 750 }
      ],
      waitUnloadedMs: 1900,
      crushMs: 180,
      waitLoadedMs: 450,
      retractMs: 1000,
      thickness: 55,
      color: "#06b6d4",
      behindTerrain: true,
      phaseOffset: 500
    },
    // Crystal clusters at the bends (spike hazards: hull damage on contact,
    // cargo shattered). Each sits on the inside of a turn, so the racing line
    // has to swing wide of it.
    { type: "spike", pts: [{ x: 650, y: 368 }], radius: 22, damagePerSec: 60, color: "#67e8f9" },   // ceiling, first climb
    { type: "spike", pts: [{ x: 1250, y: 520 }], radius: 22, damagePerSec: 60, color: "#67e8f9" },  // floor, the ramp out of the resonance chamber
    { type: "spike", pts: [{ x: 1160, y: 548 }], radius: 22, damagePerSec: 60, color: "#67e8f9" },  // resonance chamber floor, under the well
    { type: "spike", pts: [{ x: 1950, y: 316 }], radius: 20, damagePerSec: 60, color: "#67e8f9" },  // ceiling, on the way to the pump
    // Crystal Resonance Anomaly — a gravity well hanging under the chamber
    // roof. It used to orbit the middle of the corridor at 0.35 / r150: a pull
    // of up to 1.2px/frame² (vs 0.45 full thrust and 0.09 strafe) that swept
    // over anything passing, dragged it along and ground it down at the core.
    // Now it sits still up at y:385 and is weaker than gravity everywhere in
    // the corridor: near the roof you go almost weightless (core pull 0.175 vs
    // 0.345 for a dive, so it can always be escaped) — a floaty pocket that
    // throws your hover off. The fuel cell under it pays for skimming close.
    {
      type: "gravwell",
      pts: [{x: 1100, y: 385}],
      startForce: 0.05, radius: 120
    }
  ],

  // ── Collectibles (Glow-in-the-dark navigation cues) ───────────────────────
  collectibles: [
    { type: 'cash', x: 650, y: 480, value: 600 },  // After first crusher descend
    { type: 'fuel', x: 1100, y: 440, amount: 40 }, // Just under the Crystal Resonance Well
    { type: 'cash', x: 1410, y: 450, value: 600 }, // Midway safe zone between crushers 2 & 3
    { type: 'fuel', x: 1620, y: 480, amount: 40 }  // Final approach to Deep Mining Post
  ],

  // ── Mission parameters ────────────────────────────────────────────────────
  targetCargo: 2,
  deposit: 1000,
  fee: 500,
  timeLimit: 240,
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
  },
  worldBounds: {
      bottomY: 1200,
      bottomAction: 'monster',
      leftMargin: 3000,
      rightMargin: 3000
  },

  // ── Hubs ──────────────────────────────────────────────────────────────────
  deliveryHubs: [
      { x: 800, width: 80, color: "#3b82f6", type: "blue", name: "Upper Node" },
      { x: 1700, width: 90, color: "#38bdf8", type: "normal", name: "Deep Mining Post" },
      // The only fuel in the caves, on the far shelf: top up for the run home.
      { x: 2100, width: 60, color: "#f59e0b", type: "refuel", name: "Crystal Pump", pricePerUnit: 4 }
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
  hint: "The crushers are buried in the rock — watch for the jaws, wait at a safe distance, and go the moment they lift. Glowing crystals mark the bends; swing wide of them. The only fuel is the Crystal Pump on the far shelf past Deep Mining Post ($4/unit), so top up there before the run home.",

  quests: [
      questPrimary('Deliver both cargo types and return safely'),
      questNoCrash(400),
      questQuick('Finish in under 3 minutes', 60, 500),  // timeGoal = seconds LEFT on the 240s clock
  ],
});
