// Level 6 — The Sand Worm's Lair
// Biome: Desert dunes / Amber dusk.
// Layout matches the design sketch:
//   [1] Start HQ — upper-left plateau
//   [2] Cargo — lower-left shelf (down in the valley, near the lake)
//   [3] Drop off — upper-right plateau
//   Lake — central depression (OOB water zone)
//   Worm Pit — raised mound in the center, worm lurks beneath

registerLevel({
    name: "L6: The Sand Worm's Lair",
    missionTitle: "Sand Worm Extraction",
    description: "A colossal sand worm lurks beneath the dunes. Pick up cargo from the low valley, cross the worm's territory, and deliver to the eastern base.",

    // ── Identity flag ─────────────────────────────────────────────────────────
    terrainType: 'worm-lair',

    // Radar ping zone — read by drawRadarPingZone() in game.js.
    // color is an RGB string; r is max ping radius; period is ms per cycle.
    radarPingZone: { cx: 900, cy: 580, r: 280, color: '200, 100, 20', period: 3600 },

    // Physics spawn point for the sand worm (can reference the zone above)
    wormPitCX: 900,
    wormPitCY: 580,
    wormZoneR: 280,

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.12,
    wind: 0,

    // ── Terrain ───────────────────────────────────────────────────────────────
    // One large organic polygon:
    //  • Upper-left plateau (start HQ)
    //  • Drops into left valley (cargo pickup, near the lake)
    //  • Central raised mound (worm danger zone)
    //  • Another dip on the other side
    //  • Upper-right plateau (drop-off)
    terrainPolygons: [
        [
            // Left wall + upper-left plateau (Start HQ lives here ~x:80)
            {x: -200, y: 430}, {x:  60,  y: 430},
            // Step down into the left valley (cargo lives here ~x:150)
            {x: 160,  y: 430}, {x: 180,  y: 590},
            {x: 350,  y: 640}, {x: 420,  y: 660},
            // Valley floor + lake edge (terrain dips, OOB lake fills the hole)
            {x: 500,  y: 700}, {x: 560,  y: 780},
            {x: 700,  y: 800},
            // Rise up to the worm mound center
            {x: 760,  y: 720}, {x: 820,  y: 580},
            {x: 900,  y: 520}, {x: 980,  y: 580},
            {x: 1040, y: 720}, {x: 1100, y: 800},
            // Right side valley / descent
            {x: 1160, y: 760}, {x: 1260, y: 680},
            {x: 1340, y: 620}, {x: 1380, y: 550},
            // Upper-right plateau (Drop-off lives here ~x:1450)
            {x: 1420, y: 430}, {x: 1700, y: 430},
            // Close the polygon downward
            {x: 1700, y: 1600}, {x: -200, y: 1600}
        ]
    ],

    // ── Mission parameters ────────────────────────────────────────────────────
    targetCargo: 2,
    budget: 2500,
    timeLimit: 240,
    allowedTypes: ["normal", "red"],

    // Start HQ on the upper-left plateau
    startX: 80,
    // Cargo pickup on the lower-left shelf (valley)
    collectionX: 200,

    // ── Environment ───────────────────────────────────────────────────────────
    outOfBounds: {
        type: 'water',
        color: 'rgba(29, 78, 216, 0.65)',
        mistColor: 'rgba(59, 130, 246, 0.25)',
        surfaceY: 780,     // matches the valley floor height
        drag: 0.92,
        buoyancy: -0.18,
        monsterDepth: 1050
    },

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 1460, width: 110, color: "#3b82f6", type: "normal", name: "Eastern Base" }
    ],

    // ── Palette (Desert / Amber Dusk) ─────────────────────────────────────────
    palette: {
        skyTop:      '#1a0e03',
        skyMid:      '#3b1e08',
        skyBot:      '#5c3012',
        terrainFill: '#1f1108',
        rockEdge:    '#d97706',
        rockGlow:    'rgba(217,119,6,',
        fog:         'rgba(180,90,6,0.12)',
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "The valley floor is dangerous — something lurks beneath the central dunes. Move fast!",

    quests: [
        questPrimary('Deliver 2 cargo to Eastern Base'),
        questSurviveWorm(500),
        questNoCrash(300),
    ],
});
