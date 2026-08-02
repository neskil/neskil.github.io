// Level 4 — Gravity Anomaly
// Biome: Anomaly Zone / Volcanic Cavern.
// A compact cavern run featuring a drifting gravity well, incinerator vent, and cavern spikes.

registerLevel({
  name: "L4: Gravity Anomaly",
  missionTitle: "Anomaly Zone — Vortex Run",
  description: "HQ sits on a western plateau; the cargo dock is atop a ridge pillar to the east, past a gravitational vortex drifting over the open valley. Bring each crate back to the Hollow — a cave alcove carved into the ridge below the dock — but a lava vent guards its mouth, flaring on a duty cycle. Time the flare, duck inside to deliver, then take the low return tunnel back to HQ.",
  hint: "Keep clear of the drifting gravity vortex in the valley. Time your entrance past the flare vent to reach the Hollow, then dive into the lower return tunnel to bypass the vortex on the way back to HQ.",
  gravity: 0.09,          // Light gravity baseline so lander handles with ease
  maxFuel: 300,
  windVarianceEnabled: false,
  weather: "ash",
  night: true,            // Enables radar sonar ping & spotlight beam
  nightDarkness: 0.35,    // Light 35% base darkness — early level stays bright and clear!
  fee: 100,
  timeLimit: 300,
  padScale: 1.4,
  targetCargo: 2,
  allowedTypes: ["normal"],
  backgroundType: "cave",
  ambientTrafficRate: 0,
  ambientTrafficSpeed: 0.1,
  ambientTrafficMinY: -1700,
  ambientTrafficMaxY: -1700,
  startX: -280,
  collectionX: 728,
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
    surfaceY: 1197,
    drag: 0.02,
    buoyancy: 0.02,
  },
  worldBounds: {
    bottomY: 1267,
    bottomAction: "monster",
    leftMargin: 1300,
    rightMargin: 300,
    ceilingY: -693,
    ceilingAction: "monster",
    lateralAction: "monster",
  },
  deliveryHubs: [
    { x: -330, color: "#22c55e", type: "normal", name: "The Hollow", y: 377, style: "house" }
  ],
  waterBodies: [
    {
      hasBoat: false,
      hasFish: false,
      pts: [
        {x: -445, y: 982},
        {x: 189, y: 987},
        {x: 187, y: 984},
        {x: 77, y: 1095},
        {x: -335, y: 1095}
      ]
    }
  ],
  radarPingZone: {
    cx: 202,
    cy: 343,
    r: 221,
    color: "249,115,22",
    period: 3600
  },
  hazards: [
    {
      type: "gravwell",
      speed: 900,
      radius: 117,
      startForce: 0.05,
      endForce: 0.05,
      pts: [
        {x: 1261, y: -112},
        {x: 85, y: -399},
        {x: -1138, y: -224}
      ]
    },
    {
      type: "incinerator",
      onMs: 800,
      offMs: 6000,
      warnMs: 900,
      behindTerrain: true,
      pts: [
        {x: 150, y: 247},
        {x: 254, y: 251},
        {x: 254, y: 440},
        {x: 150, y: 436}
      ]
    }
  ],
  terrainPolygons: [
    // Ground
    [
        {x: -325, y: 98},
        {x: -189, y: 98},
        {x: 46, y: 63},
        {x: 384, y: 70},
        {x: 364, y: 175},
        {x: 403, y: 224},
        {x: 397, y: 287},
        {x: 358, y: 301},
        {x: 306, y: 280},
        {x: 85, y: 273},
        {x: 33, y: 252},
        {x: -20, y: 252},
        {x: -65, y: 224},
        {x: -156, y: 238},
        {x: -202, y: 245},
        {x: -260, y: 224},
        {x: -325, y: 224},
        {x: -384, y: 210},
        {x: -416, y: 287},
        {x: -371, y: 378},
        {x: -286, y: 378},
        {x: -228, y: 357},
        {x: -182, y: 350},
        {x: -150, y: 371},
        {x: -137, y: 406},
        {x: -117, y: 434},
        {x: -117, y: 511},
        {x: -85, y: 609},
        {x: -7, y: 700},
        {x: 0, y: 882, edgeHazard: "spikes"},
        {x: -221, y: 875, edgeHazard: "spikes"},
        {x: -403, y: 777},
        {x: -605, y: 672},
        {x: -663, y: 581},
        {x: -618, y: 420},
        {x: -631, y: 196},
        {x: -553, y: 126},
        {x: -514, y: 14},
        {x: -436, y: 63}
    ],
    // Polygon 2
    [
        {x: 528, y: 144},
        {x: 527, y: 217},
        {x: 566, y: 371},
        {x: 540, y: 504},
        {x: 416, y: 525},
        {x: 299, y: 434},
        {x: 91, y: 427},
        {x: 59, y: 448},
        {x: 33, y: 511},
        {x: 137, y: 560},
        {x: 124, y: 658},
        {x: 215, y: 735},
        {x: 234, y: 847},
        {x: 111, y: 980},
        {x: 77, y: 1012},
        {x: 14, y: 1040},
        {x: -90, y: 1021},
        {x: -190, y: 1068},
        {x: -308, y: 1051},
        {x: -364, y: 1013},
        {x: -415, y: 947},
        {x: -579, y: 868},
        {x: -930, y: 889},
        {x: -1170, y: 1043},
        {x: -1053, y: 1736},
        {x: -46, y: 1785},
        {x: 1131, y: 1680},
        {x: 1228, y: 946},
        {x: 1225, y: 368},
        {x: 1175, y: 165},
        {x: 961, y: 71},
        {x: 910, y: 91},
        {x: 819, y: 112},
        {x: 683, y: 112},
        {x: 605, y: 77},
        {x: 540, y: 70}
    ]
  ]
});
