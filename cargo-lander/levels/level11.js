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
//   x  840..1040   Sea Stack — a lone rock with the Buoy Tank refuel pad on top
//   x 1230..1760   Red Cliff — the red-cargo Cliff Post sits high on the cliff top
//   x 1960..2540   Far Atoll — Atoll Market (normal cargo), with a lagoon
//
// Risk/reward: the cash arc between Harbor Isle and the Sea Stack rewards a
// clean ballistic hop instead of hugging the waves; the fuel token skims the
// sea surface; the far cash floats out past the atoll, upwind of home.
//
// Every pad has an explicit y on a flat run of terrain at least as wide as
// the pad (padScale 1.3), so nothing snaps to an unexpected surface.

registerLevel({
  name: "L11: Island Hopper",
  missionTitle: "Sunset Archipelago — Island Hopper",
  description: "The island chain runs on whatever the evening ferry missed. Haul crates from the harbor out to the cliff post and the atoll market. The trade wind blows east — a free ride out, a fight on the way home. Watch for the gust warning.",
  hint: "Fly out high and let the wind carry you; save fuel for the trip home into the wind. The Sea Stack's Buoy Tank refuels you halfway across. When a gust warning shows, get low or get landed.",
  unlocked: true,

  // ── Physics ──────────────────────────────────────────────────────────────
  gravity: 0.11,
  maxFuel: 160,     // the widest map in the game — a bigger tank keeps it breezy
  wind: 0.02,
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
    { x: 1420, y: 430, color: "#ef4444", type: "red",    name: "Cliff Post"   },
    { x: 2080, y: 740, color: "#38bdf8", type: "normal", name: "Atoll Market" },
    { x: 905,  y: 540, width: 60, color: "#f59e0b", type: "refuel", name: "Buoy Tank" }
  ],

  buildings: [
    { x: -130, type: 'antenna' },   // the lighthouse mast
    { x: 560,  type: 'silo' },      // harbor water tower
    { x: 1600, type: 'antenna' }    // cliff radio mast, east of the post
  ],

  collectibles: [
    { type: 'cash', x: 700,  y: 560, value: 150 },  // the hop off Harbor Isle...
    { type: 'cash', x: 790,  y: 470, value: 150 },  // ...arcing up toward the stack
    { type: 'fuel', x: 1150, y: 800, amount: 35 },  // skim the waves for it
    { type: 'cash', x: 2650, y: 560, value: 400 }   // out past the atoll, upwind of home
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
    // Sea Stack — Buoy Tank on the summit
    [
      { x: 840, y: 1200 }, { x: 870, y: 560 }, { x: 890, y: 540 },
      { x: 990, y: 540 }, { x: 1010, y: 560 }, { x: 1040, y: 1200 }
    ],
    // Red Cliff — Cliff Post on the summit plateau
    [
      { x: 1230, y: 1200 }, { x: 1270, y: 760 }, { x: 1330, y: 700 },
      { x: 1360, y: 520 }, { x: 1400, y: 430 }, { x: 1580, y: 430 },
      { x: 1620, y: 470 }, { x: 1660, y: 640 }, { x: 1720, y: 760 },
      { x: 1760, y: 1200 }
    ],
    // Far Atoll — market flat, then the lagoon dip
    [
      { x: 1960, y: 1200 }, { x: 2000, y: 800 }, { x: 2060, y: 740 },
      { x: 2240, y: 740 }, { x: 2260, y: 800 }, { x: 2410, y: 800 },
      { x: 2430, y: 740 }, { x: 2500, y: 760 }, { x: 2540, y: 1200 }
    ]
  ]
});
