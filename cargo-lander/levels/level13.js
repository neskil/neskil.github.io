// Level 13 — Foundry Shift (Test Flight, unlocked from start)
// Biome: Steelworks interior, molten-orange light.
//
// 2026-10-16 rebuild. The old hall was a flat corridor with three gates in a
// row — the same "wait for the beat, then go" as L8 and L10. Playtest: "no
// fun". This is now the one level where the MACHINERY is the map, and each
// machine asks something different:
//
//   • LADLE POURS (incinerator hazards) — molten metal pours from two ladles
//     on the overhead crane, out of step with each other. They burn the hull
//     and melt any crate they touch.
//   • THE BELT — the hall floor under the ladles is a conveyor running east,
//     toward Press One. Set down on it and it carries you into the press.
//   • PRESSES (crushers) — Press One and Press Two slam roof-to-floor.
//   • THE STEAM LIFT — the Mezzanine Office (red) is a room hung from the roof
//     whose only door is a hole in its floor. A steam vent under the hole
//     puffs upward on a beat: ride a puff up through the hole.
//   • THE LASER CURTAIN before the smelter.
//   • THE FEED BELT — a second conveyor runs into the Smelter Chute (normal
//     crates only): land on it and it walks you into the chute's pull.
//
// Layout (y grows down; roof y:300, floor y:900):
//   x -600..-260  HQ bay            x   0..120   depot
//   x  150..740   the belt, ladle pours at x:350 and x:580
//   x  780        PRESS ONE
//   x  940..1395  the Mezzanine Office room (floor y:600, hole x 1220-1340);
//                 Coolant Tap refuel on the hall floor beneath it
//   x 1620        PRESS TWO         x 1900       LASER CURTAIN
//   x 1960..2140  the feed belt     x 2150..2320 Smelter Chute (normal only)

registerLevel({
  name: "L13: Foundry Shift",
  missionTitle: "Steelworks — Foundry Shift",
  description: "Night shift at the steelworks, and every machine in the hall is running. Thread the ladle pours, beat the presses and the laser curtain, and feed normal crates to the smelter chute at the far end. Red crates go up to the Mezzanine Office — whose only door is a hole in its floor, over the steam vent.",
  hint: "Every machine repeats exactly — watch one cycle first. The ladles pour out of step: go between them. Don't sit on the belt under the ladles: it carries you east into Press One. To reach the Mezzanine Office, hover under the hole in its floor and let a steam puff lift you through. The Coolant Tap under the office refuels you. At the far end, set down on the feed belt and it walks you into the chute.",
  unlocked: true,

  // ── Physics ──────────────────────────────────────────────────────────────
  gravity: 0.12,
  maxFuel: 200,
  wind: 0,
  windVarianceEnabled: false,
  weather: 'ash',
  backgroundType: 'cave',

  // ── Mission parameters ────────────────────────────────────────────────────
  deposit: 1000,
  fee: 150,
  timeLimit: 300,
  padScale: 1.2,
  targetCargo: 5,
  allowedTypes: ["normal", "red"],

  startX: -450,
  startY: 900,
  collectionX: 0,
  collectionY: 900,

  terrainDecor: 'none',
  ambientTrafficRate: 0,

  quests: [
    questPrimary("Feed 5 crates through the foundry"),
    questNoCrash(400),
    questNoCargoLost("Nothing melted, nothing crushed", 400),
    questQuick("Finish in under 3 minutes", 120, 400),
  ],

  palette: {
    skyTop: "#0c0a09",
    skyMid: "#1c1917",
    skyBot: "#292524",
    terrainFill: "#1c1917",
    rockEdge: "#f97316",
    rockGlow: "rgba(249,115,22,",
    fog: "rgba(249,115,22,0.06)",
  },

  // ── Hubs ──────────────────────────────────────────────────────────────────
  deliveryHubs: [
    { x: 1010, y: 600, color: "#ef4444", type: "red", name: "Mezzanine Office" },
    { x: 2150, y: 900, width: 140, color: "#f59e0b", type: "chute", name: "Smelter Chute", accepts: ["normal"] },
    { x: 1050, y: 900, width: 60, color: "#22d3ee", type: "refuel", name: "Coolant Tap", pricePerUnit: 3 }
  ],

  // ── Hazards ───────────────────────────────────────────────────────────────
  hazards: [
    // Ladle pours — out of step with each other. Dark 1.6s, warn 0.7s, pour 1.3s.
    {
      type: 'incinerator',
      pts: [{ x: 332, y: 444 }, { x: 370, y: 444 }, { x: 370, y: 898 }, { x: 332, y: 898 }],
      onMs: 1300, offMs: 2300, warnMs: 700, damagePerSec: 40
    },
    {
      type: 'incinerator',
      pts: [{ x: 562, y: 444 }, { x: 600, y: 444 }, { x: 600, y: 898 }, { x: 562, y: 898 }],
      onMs: 1300, offMs: 2300, warnMs: 700, damagePerSec: 40, phaseOffset: 1800
    },
    // PRESS ONE — open 2.3s, slams 0.25s, holds, retracts 0.8s.
    {
      type: 'crusher',
      pts: [{ x: 780, y: 300 }, { x: 780, y: 900 }],
      waitUnloadedMs: 2300, crushMs: 250, waitLoadedMs: 400, retractMs: 800,
      thickness: 56, color: '#f59e0b'
    },
    // THE STEAM LIFT — puffs up through the office's floor hole.
    {
      type: 'repulsor',
      color: 'rgba(226, 232, 240, 0.14)',
      travelX: 0, travelY: -0.34,
      gustMs: 1500, calmMs: 1700, warnMs: 500,
      pts: [{ x: 1225, y: 640 }, { x: 1335, y: 640 }, { x: 1335, y: 895 }, { x: 1225, y: 895 }]
    },
    // PRESS TWO — open 2.2s, off-beat from Press One.
    {
      type: 'crusher',
      pts: [{ x: 1620, y: 300 }, { x: 1620, y: 900 }],
      waitUnloadedMs: 2200, crushMs: 200, waitLoadedMs: 400, retractMs: 700,
      thickness: 56, color: '#f59e0b', phaseOffset: 1500
    },
    // THE LASER CURTAIN — dark 1.3s.
    {
      type: 'laser',
      pts: [{ x: 1900, y: 300 }, { x: 1900, y: 900 }],
      onMs: 1200, offMs: 1800, warnMs: 500, damagePerSec: 35, thickness: 14,
      phaseOffset: 700
    }
  ],

  // ── Segments — the two conveyor belts ─────────────────────────────────────
  segments: [
    { x1: 150, y1: 897, x2: 740, y2: 897, conveyorSpeed: 2 },     // the belt: east, into Press One
    { x1: 1960, y1: 897, x2: 2148, y2: 897, conveyorSpeed: 1.5 }  // the feed belt: east, into the chute
  ],

  collectibles: [
    { type: 'cash', x: 465,  y: 700, value: 200 },  // between the ladles
    { type: 'fuel', x: 690,  y: 520, amount: 30 },  // just short of Press One
    { type: 'cash', x: 1300, y: 420, value: 300 },  // up in the office
    { type: 'cash', x: 1760, y: 620, value: 200 },  // between Press Two and the curtain
    { type: 'cash', x: 2430, y: 820, value: 250 }   // the end bay past the chute
  ],

  // ── Terrain ───────────────────────────────────────────────────────────────
  terrainPolygons: [
    // Roof and both end walls (a Π).
    [
      { x: -800, y: -200 }, { x: 2700, y: -200 }, { x: 2700, y: 1300 }, { x: 2520, y: 1300 },
      { x: 2520, y: 320 }, { x: 2400, y: 300 }, { x: -580, y: 300 }, { x: -600, y: 320 },
      { x: -600, y: 1300 }, { x: -800, y: 1300 }
    ],
    // Hall floor
    [
      { x: -620, y: 900 }, { x: 2540, y: 900 }, { x: 2540, y: 1400 }, { x: -620, y: 1400 }
    ],
    // Mezzanine Office — west wall and the floor slab up to the hole
    [
      { x: 940, y: 290 }, { x: 975, y: 290 }, { x: 975, y: 600 }, { x: 1220, y: 600 },
      { x: 1220, y: 632 }, { x: 975, y: 640 }, { x: 940, y: 652 }
    ],
    // Mezzanine Office — the slab past the hole and the east wall
    [
      { x: 1340, y: 600 }, { x: 1360, y: 600 }, { x: 1360, y: 290 }, { x: 1395, y: 290 },
      { x: 1395, y: 652 }, { x: 1360, y: 640 }, { x: 1340, y: 632 }
    ]
  ],

  // ── Decals (render/decals.js) ─────────────────────────────────────────────
  decals: [
    // Overhead crane rail, the ladles on it, and hanging tackle
    { type: 'pipe', x: -580, y: 322, x2: 2500, y2: 322, s: 0.9, color: '#44403c' },
    { type: 'ladle', x: 351, y: 330, len: 66 }, { type: 'ladle', x: 581, y: 330, len: 66, flip: true },
    { type: 'chain', x: 100, y: 330, len: 140 }, { type: 'chain', x: 1500, y: 330, len: 190 },
    { type: 'chain', x: 2060, y: 330, len: 110 }, { type: 'chain', x: -300, y: 330, len: 90, hook: false },
    { type: 'hanglamp', x: -140, y: 330, len: 50, color: '#fdba74' }, { type: 'hanglamp', x: 880, y: 330, len: 60, color: '#fdba74' },
    { type: 'hanglamp', x: 1780, y: 330, len: 50, color: '#fdba74' }, { type: 'hanglamp', x: 2300, y: 330, len: 70, color: '#fdba74' },
    // Furnaces and gears in the walls (behind the hall)
    { type: 'furnace', x: 460, y: 900, s: 1.2, back: true }, { type: 'furnace', x: 2420, y: 900, back: true },
    { type: 'gear', x: 1470, y: 470, back: true }, { type: 'gear', x: 1540, y: 540, back: true, flip: true, s: 0.7 },
    { type: 'gear', x: -380, y: 520, back: true, s: 1.3 },
    { type: 'pipe', x: -560, y: 330, x2: -560, y2: 900, s: 1.2 }, { type: 'pipe', x: 2480, y: 330, x2: 2480, y2: 900, s: 1.2 },
    // Floor clutter and warnings
    { type: 'tank', x: -300, y: 900 }, { type: 'barrels', x: -130, y: 900, n: 5 }, { type: 'crates', x: 2360, y: 900, n: 3 },
    { type: 'sign', x: 140, y: 900 }, { type: 'sign', x: 730, y: 897, flip: true }, { type: 'sign', x: 1570, y: 900 },
    { type: 'sign', x: 1860, y: 900 }, { type: 'tank', x: 1760, y: 900, s: 0.8, color: '#57534e' },
    // The office
    { type: 'crates', x: 1170, y: 600, n: 2 }, { type: 'hanglamp', x: 1170, y: 300, len: 40, color: '#fde68a' },
    { type: 'sign', x: 1210, y: 600, s: 0.7 }
  ]
});
