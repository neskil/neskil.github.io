// Level 3 — Gale-Force Winds
// Biome: Arctic / Ice. Persistent crosswind forces precise counter-thrusting.

registerLevel({
    name: "L3: Gale-Force Winds",
    missionTitle: "High-Altitude Wind Contract",
    description: "Strong crosswinds push your lander and cargo. Compensate by thrusting into the wind.",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.15,
    wind: 0.08,         // significant constant horizontal force

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [
        // Ground - massive peak
        [
            {x: -400, y: 700}, {x: 150, y: 700}, {x: 300, y: 650}, {x: 400, y: 650},
            {x: 500, y: 450}, {x: 600, y: 250}, {x: 750, y: 250}, {x: 850, y: 450},
            {x: 1000, y: 650}, {x: 1800, y: 650}, {x: 1800, y: 1800}, {x: -400, y: 1800}
        ],
        // Floating overhang blocking direct top-down approach
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
        { x: 650, color: "#38bdf8", type: "normal", name: "Peak Station" }
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
    hint: "Tilt into the wind. Return to HQ to extract.",

    quests: [
        questPrimary('Deliver 2 cargo to Peak Station'),
        questNoCrash(400),
        questQuick('Finish with 30+ sec remaining', 30, 200),
    ],
});
