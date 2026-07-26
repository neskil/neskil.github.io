registerLevel({
  name: "L4: Gravity Anomaly",
  missionTitle: "Anomaly Zone — Vortex Run",
  description: "HQ sits on a western plateau; the cargo dock is atop a ridge pillar far to the east, past a gravitational vortex drifting in slow orbit over the open valley. Bring each crate back to the Hollow — a cave alcove carved into the ridge below the dock — but a lava vent guards its mouth, flaring on a duty cycle. Time the flare, duck inside to deliver, then take the low tunnel under the valley floor straight back to HQ instead of running the vortex a second time.",
  hint: "Grab cargo from the dock atop the eastern ridge, then ride the valley back west — the vortex drifts, so don't hover near its centre. Watch the vent flare before ducking into the Hollow to deliver. Skip the vortex on the way home: dive down the shaft next to the Hollow into the tunnel and ride it straight back to HQ.",
  gravity: 0.20,
  maxFuel: 250,
  windVarianceEnabled: false,
  weather: "ash",
  fee: 200,
  timeLimit: 220,
  targetCargo: 3,
  allowedTypes: ["normal"],
  backgroundType: "cave",
  heatHaze: true,
  ambientTrafficRate: 0,
  ambientTrafficSpeed: 0.1,
  ambientTrafficMinY: -2450,
  ambientTrafficMaxY: -2450,
  startX: -430,
  startY: 140,
  collectionX: 1120,
  collectionY: 160,
  collectibles: [
    { type: 'fuel', x: 250, y: -250, amount: 60 },
    { type: 'fuel', x: 750, y: -200, amount: 60 },
    { type: 'fuel', x: -100, y: 350, amount: 60 }
  ],
  quests: [
    questPrimary("Deliver 3 cargo to The Hollow"),
    questNoCargoLost('No cargo lost', 400),
    questQuick("Complete under 20s", 20, 250)
  ],
  palette: {
    skyTop: "#0e0403",
    skyMid: "#1a0602",
    skyBot: "#2a0a04",
    terrainFill: "#050100",
    rockEdge: "#f97316",
    rockGlow: "rgba(249,115,22,",
    fog: "rgba(249,115,22,0.08)",
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
  hazards: [
    {
      type: "gravwell",
      speed: 280,
      radius: 160,
      startForce: 0.1,
      endForce: 0.2,
      pathMode: "pingpong",
      pts: [
        {x: 1982, y: -532},
        {x: 79, y: -808},
        {x: -1745, y: -632}
      ]
    },
    {
      type: "incinerator",
      onMs: 1500,
      offMs: 1000,
      behindTerrain: true,
      pts: [
        {x: 110, y: 290},
        {x: 480, y: 320},
        {x: 510, y: 710},
        {x: 120, y: 590}
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
        {x: 460, y: 400},
        {x: 220, y: 330},
        {x: 80, y: 350},
        {x: -40, y: 390},
        {x: -180, y: 250},
        {x: -540, y: 240},
        {x: -650, y: 390},
        {x: -570, y: 540},
        {x: -440, y: 540},
        {x: -240, y: 490},
        {x: -180, y: 560},
        {x: -180, y: 730},
        {x: -190, y: 830},
        {x: -126, y: 920},
        {x: -216, y: 1095},
        {x: -330, y: 1090},
        {x: -610, y: 1000},
        {x: -930, y: 960},
        {x: -1020, y: 830},
        {x: -950, y: 600},
        {x: -970, y: 280},
        {x: -850, y: 180},
        {x: -790, y: 20},
        {x: -670, y: 90}
    ],
    // New polygon
    [
        {x: 813, y: 206},
        {x: 810, y: 310},
        {x: 870, y: 530},
        {x: 830, y: 720},
        {x: 620, y: 800},
        {x: 510, y: 650},
        {x: 100, y: 550},
        {x: 50, y: 730},
        {x: 220, y: 910},
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
        {x: -1363, y: 2242},
        {x: -139, y: 2406},
        {x: 1494, y: 2242},
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
