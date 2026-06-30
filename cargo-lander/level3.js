// Level 3 — Gale-Force Winds
// Biome: Glacial Peaks / Ice Blue.
// A permanent katabatic wind blows from the right — the player must counter-thrust to hold position.
// The tall central peak forces a tight approach into the summit; a floating overhang blocks the easy top-down line.
// Peak Station sits in a narrow saddle: tight pads + constant wind = precision demanded.

registerLevel({
    name: "L3: Gale-Force Winds",
    missionTitle: "Glacial Peaks — Summit Delivery",
    description: "Katabatic winds howl down from the Glacial Peaks at a constant rate. Your delivery target — Peak Station — is wedged into the ridge summit, blocked from above by an ice overhang. You'll need to fight the crosswind the whole way in, then hold a steady hover long enough to drop cleanly.",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.15,
    wind: 0.08,         // significant constant horizontal force

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [
        // Ground — left lowland where HQ spawns, rising sharply to the glacier summit ridge
        [
            // Left plateau (HQ spawn, collection depot at x:320)
            {x: -400, y: 700}, {x: 150, y: 700}, {x: 300, y: 650}, {x: 400, y: 650},
            // Steep ascent to the peak — wind funnels up this face
            {x: 500, y: 450}, {x: 600, y: 250},
            // Summit saddle — Peak Station sits here; pads are tight
            {x: 750, y: 250},
            // Steep eastern descent — nowhere to land safely on the far side
            {x: 850, y: 450}, {x: 1000, y: 650}, {x: 1800, y: 650},
            {x: 1800, y: 1800}, {x: -400, y: 1800}
        ],
        // Ice overhang — hangs above the summit, forcing a low angled approach from the west
        [
            {x: 450, y: -200}, {x: 900, y: -200}, {x: 850, y: 120},
            {x: 600, y: 140}, {x: 500, y: -50}
        ]
    ],

    // ── Mission parameters ────────────────────────────────────────────────────
    padScale: 0.85,     // tighter pads — demands accuracy despite the wind
    targetCargo: 2,
    budget: 1500,
    timeLimit: 200,
    allowedTypes: ["normal"],
    collectionX: 320,

    // ── Environment ───────────────────────────────────────────────────────────
    outOfBounds: {
        type: 'void',     // No liquid bottom, just infinite freezing void
        mistColor: 'rgba(125, 211, 252, 0.5)',
        surfaceY: 3000,   // Basically unreachable
        monsterDepth: 2500
    },

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 650, color: "#38bdf8", type: "normal", name: "Ridge Station" }
    ],

    // ── Palette (Arctic / Ice Blue) ───────────────────────────────────────────
    palette: {
        skyTop:      '#020810',
        skyMid:      '#061828',
        skyBot:      '#0a1e2e',
        terrainFill: '#08121c',
        rockEdge:    '#7dd3fc',
        rockGlow:    'rgba(125,211,252,',
        fog:         'rgba(125,211,252,0.06)',
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "The wind blows constantly from the right — lean left with the side thruster to hold position. Approach the summit from below and to the west, under the overhang. Return to HQ to extract.",

    quests: [
        questPrimary('Deliver 2 cargo to Ridge Station'),
        questNoCrash(400),
        questQuick('Finish with 30+ sec remaining', 30, 200),
    ],
});
