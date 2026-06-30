// Level 2 — Cross-Dock Sorting
// Biome: Desert / Amber. Two hubs require correct cargo sorting.

registerLevel({
    name: "L2: Cross-Dock Sorting",
    missionTitle: "Cross-Dock Sorting Contract",
    description: "Sort the cargo. Normal packages → Main Processing. Fragile (red) → Fragile Handling. Don't drop fragile cargo!",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.15,
    wind: 0,

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [[
        {x: -400, y: 650}, {x: 100, y: 650}, {x: 300, y: 600}, {x: 600, y: 600}, // Plateau 1
        {x: 630, y: 1500}, {x: 750, y: 1500}, // Chasm
        {x: 780, y: 600}, {x: 1200, y: 600}, {x: 1800, y: 550}, // Plateau 2
        {x: 1800, y: 1800}, {x: -400, y: 1800} // Bottom enclosure
    ]],

    // ── Mission parameters ────────────────────────────────────────────────────
    padScale: 1.2,
    targetCargo: 2,
    budget: 1200,
    timeLimit: 240,
    allowedTypes: ["normal", "red"],

    // ── Environment ───────────────────────────────────────────────────────────
    outOfBounds: {
        type: 'sand',
        color: '#b45309',
        mistColor: 'rgba(180, 83, 9, 0.4)',
        surfaceY: 1700,
        drag: 0.85,       // Quicksand: heavy drag
        buoyancy: -0.2,   // Quicksand: strong push up, but hard to move
        monsterDepth: 1900
    },

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 500, color: "#38bdf8", type: "normal", name: "Main Processing" },
        { x: 800, color: "#ef4444", type: "red",    name: "Fragile Handling" },
    ],

    // ── Palette (Desert / Amber) ──────────────────────────────────────────────
    palette: {
        skyTop:      '#120a02',
        skyMid:      '#1e1005',
        skyBot:      '#2e1a06',
        terrainFill: '#1a0f04',
        rockEdge:    '#d97706',
        rockGlow:    'rgba(217,119,6,',
        fog:         'rgba(217,119,6,0.06)',
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "Sort correctly and return to HQ to extract.",

    quests: [
        questPrimary('Sort & deliver 2 cargo'),
        questNoCargoLost('No cargo lost', 250),
        questNoCrash(300),
    ],
});
