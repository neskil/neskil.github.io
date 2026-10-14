// Level 13 — Foundry Shift (Test Flight, unlocked from start)
// Biome: Steelworks interior, molten-orange light.
//
// Design brief: a rhythm level. The foundry floor is one long horizontal hall
// and the obstacles are machines on readable cycles, not geometry: two press
// crushers and a laser curtain stand across the hall like gates. Every gate
// stays open well over a second per cycle and telegraphs before it closes, so
// the skill is reading the beat and committing — not twitch reflexes. Nothing
// in the hall moves you; only the gates hurt.
//
// Layout (left → right), hall ceiling y:600, floor y:900:
//   x -500..-260   HQ bay (x:-380)
//   x    0..240    cargo depot (x:80)
//   x  500         GATE 1 — press crusher, jaws meet mid-hall
//   x  630..702    Coolant Tap — refuel pad between the gates; land and wait
//                  out the beat here instead of hovering
//   x  820         GATE 2 — laser curtain
//   x 1000..1250   The Press Pit, floor y:1180 — Press Floor hub (red only),
//                  with a horizontal laser over its mouth: time the drop in
//   x 1550         GATE 3 — faster press crusher, off-beat from Gate 1
//   x 1850..2020   Smelter Chute — skim low over it and it pulls EVERY crate
//                  off your deck, any colour, no landing needed
//
// The choice: red crates can go to the near Press Pit (two gates and a timed
// drop) or ride along to the chute with the rest (three gates, no landing).
// Normal crates have only the chute. A full deck of three skims through in
// one pass — the fast line through the level is all three gates in one go.
//
// Ambient traffic is off (a ceiling would drag every truck into it — see L5's
// header) and every pad y is explicit.

registerLevel({
  name: "L13: Foundry Shift",
  missionTitle: "Steelworks — Foundry Shift",
  description: "Night shift at the steelworks. The presses don't stop for anyone, and the laser curtain doesn't stop for the presses. Run crates down the hall to the smelter chute — skim it low and it takes the whole deck. Red crates can drop into the Press Pit instead, if you can time the beam.",
  hint: "Watch one full cycle of each gate before you go — they all repeat exactly. The presses close from top and bottom and meet in the middle; the laser flashes before it fires. Skim the chute within a deck's height and it pulls your cargo in.",
  unlocked: true,

  // ── Physics ──────────────────────────────────────────────────────────────
  gravity: 0.12,
  maxFuel: 200,     // waiting out a gate means hovering, and hovering burns fuel
  wind: 0,
  windVarianceEnabled: false,
  weather: 'ash',
  backgroundType: 'cave',

  // ── Mission parameters ────────────────────────────────────────────────────
  deposit: 1000,
  fee: 150,
  timeLimit: 300,
  padScale: 1.2,
  targetCargo: 5,     // the depot loads 3 per trip: two runs down the hall
  allowedTypes: ["normal", "red"],

  startX: -380,
  startY: 900,
  collectionX: 80,
  collectionY: 900,

  terrainDecor: 'rock',
  ambientTrafficRate: 0,

  quests: [
    questPrimary("Feed 5 crates to the smelter line"),
    questNoCrash(400),
    questQuick("Finish in under 3 minutes", 120, 400),
  ],

  // ── Palette (Steelworks) ──────────────────────────────────────────────────
  palette: {
    skyTop: "#0c0a09",
    skyMid: "#1c1917",
    skyBot: "#292524",
    terrainFill: "#0c0a09",
    rockEdge: "#f97316",
    rockGlow: "rgba(249,115,22,",
    fog: "rgba(249,115,22,0.06)",
  },

  // ── Hubs ──────────────────────────────────────────────────────────────────
  deliveryHubs: [
    { x: 1085, y: 1180, color: "#ef4444", type: "red",   name: "Press Floor"   },
    { x: 1850, y: 900,  width: 140, color: "#f59e0b", type: "chute", name: "Smelter Chute" },
    // Rest stop between Gate 1 and Gate 2: land, refuel, and watch the laser's
    // beat from the ground instead of burning fuel hovering in front of it.
    { x: 630,  y: 900,  width: 60,  color: "#22d3ee", type: "refuel", name: "Coolant Tap" }
  ],

  // ── Hazards — the three gates and the pit beam ────────────────────────────
  hazards: [
    // GATE 1 — press crusher. Open 2.3s, slams in 0.25s, holds, retracts 0.8s.
    // (Open windows are sized so a pilot hovering just short of the gate can
    // start from a standstill when it opens and clear it — checked headlessly.)
    {
      type: 'crusher',
      pts: [{ x: 500, y: 600 }, { x: 500, y: 900 }],
      waitUnloadedMs: 2300, crushMs: 250, waitLoadedMs: 400, retractMs: 800,
      thickness: 56, color: '#f59e0b'
    },
    // GATE 2 — laser curtain, floor to ceiling. Dark 1.8s, warns 0.5s, fires 1.2s.
    {
      type: 'laser',
      pts: [{ x: 820, y: 600 }, { x: 820, y: 900 }],
      onMs: 1200, offMs: 1800, warnMs: 500, damagePerSec: 35, thickness: 14,
      phaseOffset: 700
    },
    // Pit mouth beam — the drop into the Press Pit is timed, not free.
    {
      type: 'laser',
      pts: [{ x: 1004, y: 950 }, { x: 1246, y: 950 }],
      onMs: 1300, offMs: 2200, warnMs: 500, damagePerSec: 30, thickness: 12,
      phaseOffset: 1500
    },
    // GATE 3 — faster press (open 1.9s), off-beat from Gate 1.
    {
      type: 'crusher',
      pts: [{ x: 1550, y: 600 }, { x: 1550, y: 900 }],
      waitUnloadedMs: 1900, crushMs: 200, waitLoadedMs: 400, retractMs: 700,
      thickness: 56, color: '#f59e0b', phaseOffset: 1500
    }
  ],

  collectibles: [
    { type: 'cash', x: 740,  y: 680,  value: 150 },  // between the gates, up under the roof
    { type: 'cash', x: 1215, y: 1110, value: 200 },  // the pit's far corner
    { type: 'fuel', x: 1700, y: 650,  amount: 30 },  // past Gate 3, up by the ceiling
    { type: 'cash', x: 2120, y: 820,  value: 250 }   // beyond the chute, in the end bay
  ],

  // ── Terrain — the hall's roof-and-end-walls, and its floor ────────────────
  terrainPolygons: [
    // Roof + both end walls (a Π). The roof dips at x 900-1150 over the pit.
    [
      { x: -700, y: -400 }, { x: 2400, y: -400 }, { x: 2400, y: 1300 },
      { x: 2240, y: 1300 }, { x: 2220, y: 620 }, { x: 2000, y: 600 },
      { x: 1200, y: 600 }, { x: 1150, y: 570 }, { x: 900, y: 570 },
      { x: 850, y: 600 }, { x: -480, y: 600 }, { x: -500, y: 1300 },
      { x: -700, y: 1300 }
    ],
    // Floor, with the Press Pit cut into it
    [
      { x: -520, y: 900 }, { x: 980, y: 900 }, { x: 1000, y: 920 },
      { x: 1010, y: 1180 }, { x: 1240, y: 1180 }, { x: 1250, y: 920 },
      { x: 1270, y: 900 }, { x: 2260, y: 900 }, { x: 2260, y: 1400 },
      { x: -520, y: 1400 }
    ]
  ]
});
