// Level 1 — Local Distribution
// Biome: Grasslands. Gentle intro: flat terrain, single hub, standard cargo only.

registerLevel({
    name: "L1: Local Distribution",
    missionTitle: "Local Distribution Contract",
    description: "Transport standard packages to the Delivery Pad. Fly carefully — tilt too much and cargo will slide off!",

    // ── Physics ──────────────────────────────────────────────────────────────
    gravity: 0.15,
    wind: 0,

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [[
        {x: -400, y: 700}, {x: 0, y: 700}, {x: 100, y: 680}, {x: 200, y: 680}, 
        {x: 300, y: 650}, {x: 400, y: 650}, {x: 500, y: 600}, {x: 600, y: 550}, 
        {x: 700, y: 550}, {x: 850, y: 580}, {x: 1000, y: 650}, {x: 1200, y: 650}, 
        {x: 1800, y: 650}, {x: 1800, y: 1500}, {x: -400, y: 1500}
    ]],
    // ── Mission parameters ────────────────────────────────────────────────────
    padScale: 1.5,
    targetCargo: 2,
    budget: 1000,
    timeLimit: 180,
    allowedTypes: ["normal"],

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 750, color: "#38bdf8", type: "normal", name: "Hub Alpha" }
    ],

    // ── Palette (Grasslands) ──────────────────────────────────────────────────
    palette: {
        skyTop:      '#04071a',
        skyMid:      '#0a1628',
        skyBot:      '#0d2010',
        terrainFill: '#0a1a08',
        rockEdge:    '#4ade80',
        rockGlow:    'rgba(74,222,128,',
        fog:         'rgba(74,222,128,0.04)',
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "Tip: Land slowly (< 2.0 m/s) and return to HQ to extract.",

    quests: [
        questPrimary('Deliver 2 cargo to Hub Alpha'),
        questNoCrash(300),
        questQuick('Finish with 1+ min remaining', 60, 200),
    ],
});
