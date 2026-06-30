// Level 5 — The Needle's Eye
// Biome: Crystal Caverns / Purple. Drone-only; lower cargo by winch into a narrow shaft.

registerLevel({
    name: "L5: The Needle's Eye",
    missionTitle: "Needle's Eye Precision Drop",
    description: "The hub is at the bottom of a shaft too narrow for your drone. Hover, extend your rope (E/Q), and lower cargo in!",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.10,          // lighter gravity — easier hovering for rope work
    wind: 0,

    // ── Mission parameters ────────────────────────────────────────────────────
    targetCargo: 3,
    budget: 1800,
    timeLimit: 240,
    allowedTypes: ["normal", "red"],
    
    // ── Environment ───────────────────────────────────────────────────────────
    outOfBounds: {
        type: 'acid',
        color: 'rgba(132, 204, 22, 0.7)',
        mistColor: 'rgba(132, 204, 22, 0.3)',
        surfaceY: 1200,
        drag: 0.9,
        buoyancy: -0.25,  // highly buoyant
        monsterDepth: 1500
    },

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [
        // Ground - sloping downwards into the deep core
        [
            {x: -400, y: 700}, {x: 150, y: 700}, {x: 250, y: 800}, 
            {x: 450, y: 800}, {x: 600, y: 950}, {x: 1100, y: 950}, 
            {x: 1300, y: 800}, {x: 1800, y: 800}, 
            {x: 1800, y: 1800}, {x: -400, y: 1800}
        ],
        // Ceiling - encloses the map into a true cave
        [
            {x: -400, y: -400}, {x: 1800, y: -400}, 
            {x: 1800, y: 550}, {x: 1200, y: 550}, {x: 950, y: 700}, 
            {x: 800, y: 700}, {x: 550, y: 550}, {x: 350, y: 550}, 
            {x: 200, y: 450}, {x: 0, y: 450}, {x: -400, y: 450}
        ]
    ],  // narrow shaft + cave ceiling; crystal formations underground

    // ── Mission parameters ────────────────────────────────────────────────────
    // No padScale — hub has explicit narrow width below
    targetCargo: 2,
    budget: 1800,
    timeLimit: 300,
    allowedTypes: ["normal"],
    collectionX: 180,       // cargo spawns further left so player must traverse

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 700, width: 25, color: "#38bdf8", type: "normal", name: "The Pit" }
    ],

    // ── Palette (Crystal Caverns / Deep Purple) ───────────────────────────────
    palette: {
        skyTop:      '#040210',
        skyMid:      '#080420',
        skyBot:      '#0c0630',
        terrainFill: '#060418',
        rockEdge:    '#a855f7',
        rockGlow:    'rgba(168,85,247,',
        fog:         'rgba(168,85,247,0.08)',
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "Hover over the shaft and lower cargo with the fixed rope. SPACE drops cargo. Return to HQ to extract.",

    quests: [
        questPrimary('Lower 2 cargo into The Pit'),
        questNoCargoLost('No cargo lost', 400),
        questQuick('Finish with 2+ min remaining', 120, 200),
    ],
});
