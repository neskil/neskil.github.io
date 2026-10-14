// Level 12 — Switchback Canyon (Test Flight, unlocked from start)
// Biome: Red-rock desert canyon.
//
// Design brief: a pure flying level — no lasers, no monsters, no timers on the
// terrain. The whole challenge is the shape of the canyon: three rock ledges
// jut in from alternating walls, so the only way down is a slalom — drop
// through a gap, slide sideways under the next ledge, drop through the next
// gap on the other side. Each gap is ~200px (3.5 lander widths): roomy at
// walking pace, tight at speed. The coins sit on the racing line around each
// bend, so a fast player gets paid for a clean line rather than for detours.
//
// Section (x 0..520 is the canyon; the rim is y:400 west, y:420 east):
//   rim  y:400    HQ on the west rim (x:-360)
//   ledge A  y:620-700   juts from the EAST wall to x:210  → gap on the west
//                        Shelf Tank refuel on its top (x:400), just under the rim
//   ledge B  y:900-980   juts from the WEST wall to x:310  → gap on the east
//                        Ledge Camp (red) sits on top of it, under gap A
//   ledge C  y:1180-1260 juts from the EAST wall to x:210  → gap on the west
//   floor  y:1500        cargo depot (x:300) under ledge C, Spring Pump refuel (x:40)
//   east rim y:420       Rim Station (normal) at x:1050 — out of the canyon and away
//
// Red cargo is a half-depth round trip (floor → ledge B). Normal cargo has to
// climb the whole slalom back out to the east rim — the long, satisfying one.
// Everything is ONE polygon whose boundary threads the ledges, so the canyon
// air is outside it and every pad y is set explicitly.

registerLevel({
  name: "L12: Switchback Canyon",
  missionTitle: "Red Rock Canyon — Switchback Run",
  description: "The canyon camp's supply drop landed on the canyon floor — again. Three rock shelves zig-zag down the gorge, so there is no straight way in or out. Bring the red crates up to Ledge Camp and the rest all the way out to Rim Station.",
  hint: "Go slow through the first slalom to learn the shape; there is nothing here that punishes patience except the clock and your fuel gauge. Refuel at the Spring Pump on the floor and the Shelf Tank just under the rim. Coins mark the fast line around each bend.",
  unlocked: true,

  // ── Physics ──────────────────────────────────────────────────────────────
  gravity: 0.09,    // floaty on purpose: the slalom is all hovering, and hover costs fuel
  maxFuel: 260,     // ~one full round trip per tank; Spring Pump (floor) and Shelf Tank (ledge A) top you up
  wind: 0.005,
  windVarianceEnabled: false,

  // ── Mission parameters ────────────────────────────────────────────────────
  deposit: 1000,
  fee: 150,
  timeLimit: 330,
  padScale: 1.1,
  targetCargo: 5,     // the depot loads 3 per trip: two runs down the slalom
  allowedTypes: ["normal", "red"],

  startX: -360,
  startY: 400,
  collectionX: 300,
  collectionY: 1500,

  terrainDecor: 'rock',
  ambientTrafficRate: 0.4,
  ambientTrafficMaxY: 300,   // keep trucks above the rim, never in the gorge

  quests: [
    questPrimary("Deliver 5 crates out of the canyon"),
    questNoCrash(400),
    questQuick("Finish in under 4 minutes", 90, 400),
  ],

  // ── Palette (Red Rock Canyon) ─────────────────────────────────────────────
  palette: {
    skyTop: "#1c1917",
    skyMid: "#7c2d12",
    skyBot: "#ea580c",
    terrainFill: "#1a0d07",
    rockEdge: "#fb923c",
    rockGlow: "rgba(251,146,60,",
    fog: "rgba(251,146,60,0.05)",
  },

  worldBounds: {
    leftMargin: 1500,
    rightMargin: 1500
  },

  // ── Hubs ──────────────────────────────────────────────────────────────────
  deliveryHubs: [
    { x: 40,   y: 900,  color: "#ef4444", type: "red",    name: "Ledge Camp"  },
    { x: 1050, y: 420,  color: "#38bdf8", type: "normal", name: "Rim Station" },
    { x: 40,   y: 1500, width: 60, color: "#f59e0b", type: "refuel", name: "Spring Pump" },
    // On ledge A's top, just inside the rim: the climb out's fuel stop.
    { x: 400,  y: 620,  width: 60, color: "#f59e0b", type: "refuel", name: "Shelf Tank" }
  ],

  buildings: [
    { x: -620, type: 'antenna' },   // HQ relay mast
    { x: 1300, type: 'silo' }       // rim station water tank
  ],

  collectibles: [
    { type: 'cash', x: 110, y: 540, value: 100 },   // lining up the first drop
    { type: 'cash', x: 420, y: 800, value: 150 },   // bend 1: under ledge A, toward gap B
    { type: 'fuel', x: 420, y: 1090, amount: 30 },  // falling out of gap B
    { type: 'cash', x: 110, y: 1080, value: 150 },  // bend 2: under ledge B, toward gap C
    { type: 'cash', x: 470, y: 1420, value: 200 }   // tucked in the far floor corner
  ],

  // ── Terrain — one polygon threading all three ledges ──────────────────────
  terrainPolygons: [
    [
      // West rim (HQ) and the lip into the canyon
      { x: -1000, y: 400 }, { x: -120, y: 400 }, { x: -60, y: 410 }, { x: 0, y: 430 },
      // West wall, down to ledge B
      { x: -8, y: 540 }, { x: 6, y: 660 }, { x: 0, y: 780 }, { x: 0, y: 900 },
      // Ledge B — top (Ledge Camp), tip, underside
      { x: 290, y: 900 }, { x: 310, y: 920 }, { x: 304, y: 962 }, { x: 290, y: 980 },
      { x: 140, y: 988 }, { x: 0, y: 984 },
      // West wall, down to the floor
      { x: -6, y: 1120 }, { x: 6, y: 1300 }, { x: 0, y: 1420 }, { x: 0, y: 1500 },
      // Canyon floor (Spring Pump, depot)
      { x: 520, y: 1500 },
      // East wall up to ledge C
      { x: 520, y: 1400 }, { x: 514, y: 1300 }, { x: 520, y: 1260 },
      // Ledge C — underside, tip, top
      { x: 230, y: 1260 }, { x: 210, y: 1240 }, { x: 214, y: 1196 }, { x: 230, y: 1180 },
      { x: 520, y: 1180 },
      // East wall up to ledge A
      { x: 528, y: 1060 }, { x: 514, y: 900 }, { x: 522, y: 780 }, { x: 520, y: 700 },
      // Ledge A — underside, tip, top
      { x: 230, y: 700 }, { x: 210, y: 680 }, { x: 214, y: 636 }, { x: 230, y: 620 },
      { x: 520, y: 620 },
      // East wall up to the rim, then the east rim (Rim Station)
      { x: 540, y: 500 }, { x: 560, y: 420 }, { x: 1600, y: 420 },
      // Bedrock
      { x: 1600, y: 2000 }, { x: -1000, y: 2000 }
    ]
  ]
});
