// Level 4 — Gravity Anomaly
// Biome: Anomaly Zone / Volcanic Cavern.
// A drifting gravity well, incinerator vent, and cavern spikes.

registerLevel({
  name: "L4: Gravity Anomaly",
  missionTitle: "Anomaly Zone — Vortex Run",
  description: "HQ sits on a western plateau; the cargo dock is atop a ridge pillar far to the east, past a gravitational vortex drifting in slow orbit over the open valley. Bring each crate back to the Hollow — a cave alcove carved into the ridge below the dock — but a lava vent guards its mouth, flaring on a duty cycle. Time the flare, duck inside to deliver, then take the low tunnel under the valley floor straight back to HQ instead of running the vortex a second time.",
  hint: "The cavern is unlit — you're flying on the lander's spotlight, and its sonar ping sweeps the terrain silhouette every few seconds. Grab cargo from the dock atop the eastern ridge, then ride the valley back west — the vortex drifts, so don't hover near its centre. The amber sonar ring marks the lava vent: it seals the corridor when it flares, so wait out a flare and cross on the long gap after it. Skip the vortex on the way home: dive down the shaft next to the Hollow into the tunnel and ride it straight back to HQ.",
  gravity: 0.11,          // Eased gravity baseline so lander floats smoothly
  maxFuel: 300,
  windVarianceEnabled: false,
  weather: "ash",
  night: false,           // Bright cavern run — full visibility of terrain and structures
  fee: 150,
  timeLimit: 260,
  padScale: 1.3,
  targetCargo: 2,
  allowedTypes: ["normal"],
  backgroundType: "cave",
  ambientTrafficRate: 0,
  ambientTrafficSpeed: 0.1,
  ambientTrafficMinY: -2450,
  ambientTrafficMaxY: -2450,
  startX: -430,
  startY: 140,
  collectionX: 1120,
  collectionY: 159,
  quests: [
    questPrimary("Deliver 2 cargo to The Hollow"),
    questNoCargoLost('No cargo lost', 400),
    questQuick("Complete under 40s", 40, 250)
  ],
  palette: {
    skyTop: "#1e0b07",
    skyMid: "#42180d",
    skyBot: "#6d2713",
    terrainFill: "#1c0d08",
    rockEdge: "#f97316",
    rockGlow: "rgba(249,115,22,",
    fog: "rgba(249,115,22,0.06)",
  },
  outOfBounds: {
    type: "void",
    color: "#064e3b",
    mistColor: "#000000",
    surfaceY: 1710,
    drag: 0.02,
    buoyancy: 0.02,
  },
  worldBounds: {
    bottomY: 1810,
    bottomAction: "monster",
    leftMargin: 2000,
    rightMargin: 400,
    ceilingY: -990,
    ceilingAction: "monster",
    lateralAction: "monster",
  },
  deliveryHubs: [
    { x: -507, color: "#22c55e", type: "normal", name: "The Hollow", y: 538, style: "house" }
  ],
  waterBodies: [
    {
      hasBoat: false,
      hasFish: false,
      pts: [
        {x: -684, y: 1403},
        {x: 290, y: 1410},
        {x: 287, y: 1406},
        {x: 119, y: 1564},
        {x: -516, y: 1564}
      ]
    }
  ],
  radarPingZone: {
    cx: 310,
    cy: 490,
    r: 340,
    color: "249,115,22",
    period: 3600
  },
  hazards: [
    {
      type: "gravwell",
      speed: 700,
      radius: 250,
      startForce: 0.10,
      endForce: 0.10,
      pts: [
        {x: 1940, y: -160},
        {x: 130, y: -570},
        {x: -1750, y: -320}
      ]
    },
    {
      type: "incinerator",
      onMs: 1000,
      offMs: 5000,
      warnMs: 900,
      behindTerrain: true,
      pts: [
        {x: 230, y: 353},
        {x: 390, y: 358},
        {x: 390, y: 628},
        {x: 230, y: 623}
      ]
    }
  ],
  terrainPolygons: [
    // Ground
    [
        {x: -500, y: 140},
        {x: -290, y: 140},
        {x: 70, y: 90},
        {x: 590, y: 100},
        {x: 560, y: 250},
        {x: 620, y: 320},
        {x: 610, y: 410},
        {x: 550, y: 430},
        {x: 470, y: 400},
        {x: 130, y: 390},
        {x: 50, y: 360},
        {x: -30, y: 360},
        {x: -100, y: 320},
        {x: -240, y: 340},
        {x: -310, y: 350},
        {x: -400, y: 320},
        {x: -500, y: 320},
        {x: -590, y: 300},
        {x: -640, y: 410},
        {x: -570, y: 540},
        {x: -440, y: 540},
        {x: -350, y: 510},
        {x: -280, y: 500},
        {x: -230, y: 530},
        {x: -210, y: 580},
        {x: -180, y: 620},
        {x: -180, y: 730},
        {x: -130, y: 870},
        {x: -10, y: 1000},
        {x: 0, y: 1260, edgeHazard: "spikes"},
        {x: -340, y: 1250, edgeHazard: "spikes"},
        {x: -620, y: 1110},
        {x: -930, y: 960},
        {x: -1020, y: 830},
        {x: -950, y: 600},
        {x: -970, y: 280},
        {x: -850, y: 180},
        {x: -790, y: 20},
        {x: -670, y: 90}
    ],
    // Polygon 2
    [
        {x: 813, y: 206},
        {x: 810, y: 310},
        {x: 870, y: 530},
        {x: 830, y: 720},
        {x: 640, y: 750},
        {x: 460, y: 620},
        {x: 140, y: 610},
        {x: 90, y: 640},
        {x: 50, y: 730},
        {x: 210, y: 800},
        {x: 190, y: 940},
        {x: 330, y: 1050},
        {x: 360, y: 1210},
        {x: 170, y: 1400},
        {x: 119, y: 1445},
        {x: 22, y: 1486},
        {x: -139, y: 1459},
        {x: -292, y: 1526},
        {x: -474, y: 1502},
        {x: -560, y: 1447},
        {x: -638, y: 1353},
        {x: -890, y: 1240},
        {x: -1430, y: 1270},
        {x: -1800, y: 1490},
        {x: -1620, y: 2480},
        {x: -70, y: 2550},
        {x: 1740, y: 2400},
        {x: 1889, y: 1351},
        {x: 1884, y: 525},
        {x: 1807, y: 236},
        {x: 1478, y: 101},
        {x: 1400, y: 130},
        {x: 1260, y: 160},
        {x: 1050, y: 160},
        {x: 930, y: 110},
        {x: 830, y: 100}
    ]
  ]
});
