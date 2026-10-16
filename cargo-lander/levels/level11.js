// Level 11 — Island Hopper (Test Flight, unlocked from start)
// Biome: Tropical archipelago at sunset.
//
// Design brief: the easy-to-read, breezy level the campaign is missing between
// L1's tutorial basin and the hazard-stacked late game. One skill, taught
// cleanly: carrying momentum across open water while a steady trade wind
// (with telegraphed gusts) pushes you east. Flying out is downwind and fast;
// flying home is into the wind and costs fuel — so the return leg, not the
// outbound, is where you plan.
//
// Layout (left → right), sea surface y:860:
//   x -700..-60    Home Isle — HQ (x:-420) and a lighthouse hill
//   x  120..660    Harbor Isle — cargo depot (x:320), low and wide
//   x  845..1100   Hook Rock — mushroom-capped pillar, Buoy Tank refuel on the cap
//   x 1230..1760   Red Cliff — the red-cargo Cliff Post sits high on the cliff top
//   x 1960..2540   Far Atoll — Atoll Market (normal cargo), with a lagoon
//
// Risk/reward: the cash arc between Harbor Isle and Hook Rock rewards a
// clean ballistic hop instead of hugging the waves; the fuel token skims the
// sea surface; the far cash floats out past the atoll, upwind of home.
//
// Every pad has an explicit y on a flat run of terrain at least as wide as
// the pad (padScale 1.3), so nothing snaps to an unexpected surface.
//
// 2026-10-16 pass ("no fun"): the islands were five bare humps. Now:
//   • HOOK ROCK replaces the Sea Stack — a mushroom-capped pillar whose top
//     overhangs both sides; the Buoy Tank sits on the cap, cash hides under it.
//   • RED CLIFF has an overhanging lip and a SEA CAVE at its waterline: an air
//     pocket ~140px tall and 200px deep, open to the west, with cash inside.
//   • A WATERSPOUT (gusting repulsor) churns in the strait between Hook Rock
//     and Red Cliff: it flashes, then heaves anything low in it skyward.
//   • Palms, stilt huts, the lighthouse, a pier, beached boats and a wreck on
//     the reef (render/decals.js).

registerLevel({
  name: "L11: Island Hopper",
  missionTitle: "Sunset Archipelago — Island Hopper",
  description: "The island chain runs on whatever the evening ferry missed. Haul crates from the harbor out to the cliff post and the atoll market. The trade wind blows east — a free ride out, a fight on the way home. A waterspout is working the strait past Hook Rock, and the Red Cliff's sea cave is said to hide a smuggler's stash.",
  hint: "Fly out high and let the wind carry you; save fuel for the trip home into the wind. Hook Rock's Buoy Tank refuels you halfway across. The waterspout flashes before it heaves — stay high over the strait, or cross low between surges. The sea cave opens to the west at the waterline: go in slow.",
  unlocked: true,

  // ── Physics ──────────────────────────────────────────────────────────────
  gravity: 0.11,
  maxFuel: 160,     // the widest map in the game — a bigger tank keeps it breezy
  wind: 0.02,
  windForce: 10,    // the trade wind is the level: ~135px hands-off drift per gust cycle
  windGust: { calm: 6, warn: 2, gust: 3, gustMult: 3 },

  // ── Mission parameters ────────────────────────────────────────────────────
  deposit: 1000,
  fee: 100,
  timeLimit: 270,
  padScale: 1.3,
  targetCargo: 5,     // the depot loads 3 per trip: two runs out, one headwind return between
  allowedTypes: ["normal", "red"],

  startX: -420,
  startY: 620,
  collectionX: 320,
  collectionY: 690,

  terrainDecor: 'grass',
  ambientTrafficRate: 0.5,

  quests: [
    questPrimary("Deliver 5 crates across the islands"),
    questNoCrash(300),
    questNoCargoLost("Keep every crate out of the sea", 250),
    questQuick("Finish in under 3 minutes", 90, 300),
  ],

  // ── Palette (Sunset Archipelago) ──────────────────────────────────────────
  palette: {
    skyTop: "#172554",
    skyMid: "#7c3aed",
    skyBot: "#fb923c",
    terrainFill: "#0b1a12",
    rockEdge: "#fcd34d",
    rockGlow: "rgba(252,211,77,",
    fog: "rgba(251,146,60,0.05)",
  },

  // ── Environment — the sea between the islands ─────────────────────────────
  outOfBounds: {
    type: "water",
    color: "rgba(14, 116, 144, 0.55)",
    mistColor: "rgba(56, 189, 248, 0.18)",
    surfaceY: 860,
    drag: 0.92,
    buoyancy: -0.15,
  },
  worldBounds: {
    bottomY: 1100,
    bottomAction: 'monster',
    leftMargin: 2500,
    rightMargin: 2500
  },

  // ── Hubs ──────────────────────────────────────────────────────────────────
  deliveryHubs: [
    { x: 1420, y: 410, color: "#ef4444", type: "red",    name: "Cliff Post"   },
    { x: 2080, y: 740, color: "#38bdf8", type: "normal", name: "Atoll Market" },
    { x: 930,  y: 540, width: 60, color: "#f59e0b", type: "refuel", name: "Buoy Tank" }
  ],

  collectibles: [
    { type: 'cash', x: 700,  y: 560, value: 150 },  // the hop off Harbor Isle...
    { type: 'cash', x: 790,  y: 470, value: 150 },  // ...arcing up toward Hook Rock
    { type: 'cash', x: 1062, y: 730, value: 250 },  // tucked under Hook Rock's east overhang
    { type: 'fuel', x: 1155, y: 800, amount: 35 },  // in the waterspout's foot
    { type: 'cash', x: 1350, y: 800, value: 500 },  // the smuggler's stash, back of the sea cave
    { type: 'cash', x: 2650, y: 560, value: 400 }   // out past the atoll, upwind of home
  ],

  // ── Hazards — the waterspout in the strait ────────────────────────────────
  hazards: [
    {
      type: 'repulsor',
      color: 'rgba(125, 211, 252, 0.16)',
      travelX: 0.05, travelY: -0.3,
      gustMs: 1300, calmMs: 2600, warnMs: 700,
      pts: [{ x: 1118, y: 470 }, { x: 1192, y: 470 }, { x: 1192, y: 860 }, { x: 1118, y: 860 }]
    }
  ],

  // ── Decals (render/decals.js) ─────────────────────────────────────────────
  decals: [
    // Home Isle
    { type: 'lighthouse', x: -130, y: 600 }, { type: 'palm', x: -600, y: 655 }, { type: 'palm', x: -230, y: 630, flip: true },
    { type: 'hut', x: -520, y: 628, s: 0.9 }, { type: 'boat', x: -40, y: 862 }, { type: 'flag', x: -270, y: 620, color: '#fb923c' },
    // Harbor Isle and its pier
    { type: 'bridge', x: 560, y: 722, x2: 760, y2: 800, sag: 6 }, { type: 'boat', x: 730, y: 866, flip: true },
    { type: 'palm', x: 210, y: 714 }, { type: 'palm', x: 520, y: 704, flip: true }, { type: 'hut', x: 450, y: 690, s: 0.8 },
    { type: 'crates', x: 290, y: 690, n: 2 }, { type: 'barrels', x: 595, y: 760, n: 3 },
    // Hook Rock
    { type: 'palm', x: 1040, y: 540, s: 0.7, flip: true }, { type: 'beacon', x: 890, y: 540, color: '#22c55e' },
    { type: 'vine', x: 870, y: 600, len: 60 }, { type: 'vine', x: 1085, y: 585, len: 70 },
    // Red Cliff
    { type: 'flag', x: 1550, y: 410, color: '#ef4444' }, { type: 'palm', x: 1290, y: 410, s: 0.8 }, { type: 'hut', x: 1350, y: 410, s: 0.8 },
    { type: 'vine', x: 1215, y: 446, len: 110 }, { type: 'vine', x: 1290, y: 728, len: 50 },
    { type: 'barrels', x: 1420, y: 880, n: 2, color: '#78350f' }, { type: 'bush', x: 1640, y: 470 },
    // Far Atoll
    { type: 'palm', x: 2020, y: 770 }, { type: 'palm', x: 2190, y: 740, flip: true }, { type: 'palm', x: 2480, y: 750 },
    { type: 'hut', x: 2240, y: 740, s: 0.8 }, { type: 'flag', x: 2070, y: 740, color: '#38bdf8' },
    { type: 'boat', x: 2600, y: 880, s: 1.1 }, { type: 'rock', x: 2560, y: 870 }
  ],

  waterBodies: [
    // Atoll lagoon — scenery
    {
      hasBoat: true,
      pts: [
        { x: 2252, y: 772 }, { x: 2418, y: 772 },
        { x: 2410, y: 800 }, { x: 2260, y: 800 }
      ]
    }
  ],

  // ── Terrain — five islands rising out of the sea ──────────────────────────
  terrainPolygons: [
    // Home Isle — HQ on the flat at y:620, lighthouse hill to the east
    [
      { x: -700, y: 1200 }, { x: -640, y: 700 }, { x: -560, y: 640 },
      { x: -440, y: 620 }, { x: -260, y: 620 }, { x: -200, y: 650 },
      { x: -150, y: 600 }, { x: -110, y: 600 }, { x: -60, y: 760 },
      { x: -20, y: 1200 }
    ],
    // Harbor Isle — depot on the long flat at y:690
    [
      { x: 120, y: 1200 }, { x: 160, y: 780 }, { x: 230, y: 700 },
      { x: 300, y: 690 }, { x: 480, y: 690 }, { x: 560, y: 720 },
      { x: 620, y: 820 }, { x: 660, y: 1200 }
    ],
    // Hook Rock — a pillar with a mushroom cap overhanging both sides
    [
      { x: 905, y: 1200 }, { x: 915, y: 760 }, { x: 900, y: 660 }, { x: 862, y: 610 },
      { x: 845, y: 570 }, { x: 860, y: 540 }, { x: 1080, y: 540 }, { x: 1100, y: 572 },
      { x: 1075, y: 610 }, { x: 1030, y: 660 }, { x: 1012, y: 760 }, { x: 1020, y: 1200 }
    ],
    // Red Cliff — overhanging lip to the west, the sea cave at the waterline,
    // Cliff Post on the summit plateau
    [
      { x: 1230, y: 1200 }, { x: 1236, y: 880 }, { x: 1450, y: 880 }, { x: 1462, y: 820 },
      { x: 1440, y: 745 }, { x: 1380, y: 722 }, { x: 1300, y: 732 }, { x: 1252, y: 705 },
      { x: 1262, y: 640 }, { x: 1290, y: 560 }, { x: 1300, y: 500 }, { x: 1262, y: 462 },
      { x: 1205, y: 445 }, { x: 1198, y: 425 }, { x: 1230, y: 410 }, { x: 1580, y: 410 },
      { x: 1620, y: 450 }, { x: 1660, y: 640 }, { x: 1720, y: 760 }, { x: 1760, y: 1200 }
    ],
    // Far Atoll — market flat, then the lagoon dip
    [
      { x: 1960, y: 1200 }, { x: 2000, y: 800 }, { x: 2060, y: 740 },
      { x: 2240, y: 740 }, { x: 2260, y: 800 }, { x: 2410, y: 800 },
      { x: 2430, y: 740 }, { x: 2500, y: 760 }, { x: 2540, y: 1200 }
    ]
  ]
});
