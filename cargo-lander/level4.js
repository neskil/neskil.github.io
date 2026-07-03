// Level 4 — Gravity Anomaly
// Biome: Volcanic / Lava Rock / Orange-Red.
// The defining hazard is a moving gravity well that orbits its base position —
// physics.js reads gravityWell.orbitRadius and applies a Lissajous phase offset each tick.
// Two cargo types (red → Sector 4, blue → Deep Storage) force the player to read labels
// while also fighting the vortex pull and the floating asteroid obstacles.
// Underground easter egg: a blinking server rack cluster lives 60px below the terrain surface.

registerLevel({
    name: "L4: Gravity Anomaly",
    missionTitle: "Anomaly Zone — Dual Cargo Sort",
    description: "Sector 4 sits inside a classified Anomaly Zone where a gravitational vortex drifts in slow orbit, dragging anything nearby off course. Two clients need urgent deliveries sorted by colour: red crates to Sector 4, blue crates to Deep Storage. Floating asteroid debris adds extra collision risk. Don't let the vortex pull you into the lava.",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.28,           // Heavy gravity — volcanic world has dense core
    wind: 0,
    heavyCargo: true,        // Cargo mass affects handling — critical near the vortex

    // Moving gravity well — physics.js reads gravityWell config and applies
    // a Lissajous-phase orbit so the pull point drifts unpredictably
    gravityWell: {
        x: 500,
        y: 400,
        strength: 0.8,
        radius: 200,
        orbitRadius: 200,   // well orbits its base position (Lissajous phase)
    },

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [
        // Ground — valley floor shaped around the gravity well;
        // twin saddles mark the hub landing zones
        [
            // Left approach and HQ spawn area
            {x: -400, y: 650}, {x: 100, y: 650},
            // Saddle 1 — Sector 4 (red hub) sits in this dip
            {x: 300, y: 550}, {x: 450, y: 650}, {x: 600, y: 650},
            // Saddle 2 — Deep Storage (blue hub) sits in this dip
            {x: 750, y: 550}, {x: 900, y: 650}, {x: 1050, y: 650},
            // Eastern ridge — higher ground, no hubs
            {x: 1200, y: 550}, {x: 1800, y: 550},
            // Enclosure
            {x: 1800, y: 1800}, {x: -400, y: 1800}
        ],
        // Floating Asteroid 1 — orbits left of the well; collision hazard on approach
        [
            {x: 200, y: 250}, {x: 350, y: 200}, {x: 300, y: 350}, {x: 220, y: 320}
        ],
        // Floating Asteroid 2 — orbits right of the well; blocks the direct path to Deep Storage
        [
            {x: 700, y: 300}, {x: 850, y: 250}, {x: 800, y: 400}, {x: 680, y: 350}
        ]
    ],

    // ── Mission parameters ────────────────────────────────────────────────────
    padScale: 0.70,         // Tightest standard pads so far — tight quarters in the anomaly zone
    targetCargo: 2,
    budget: 2000,
    timeLimit: 180,
    allowedTypes: ["red", "blue"],
    collectionX: -100,      // Pickup depot is behind HQ on the far-left — safe from the vortex

    // ── Environment ───────────────────────────────────────────────────────────
    outOfBounds: {
        type: 'goo',
        color: 'rgba(239, 68, 68, 0.7)',
        mistColor: 'rgba(239, 68, 68, 0.4)',
        surfaceY: 1200,     // Molten plasma pool below terrain
        drag: 0.96,         // Thick plasma — slows descent but the monster still comes
        buoyancy: -0.1,
        monsterDepth: 1600
    },

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 525, color: "#ef4444", type: "red",    name: "Sector 4"     },
        { x: 975, color: "#3b82f6", type: "blue",   name: "Deep Storage" },
    ],

    // ── Palette (Volcanic / Orange-Red) ──────────────────────────────────────
    palette: {
        skyTop:      '#0e0403',
        skyMid:      '#1a0602',
        skyBot:      '#2a0a04',
        terrainFill: '#050100',
        rockEdge:    '#f97316',
        rockGlow:    'rgba(249,115,22,',
        fog:         'rgba(249,115,22,0.08)',
    },

    // ── Segments — floating lava platforms and a diagonal barrier ────────────
    // These are solid line segments — lander and cargo collide with them like terrain.
    segments: [
        // Floating lava platform — left of the vortex, above Sector 4
        { x1: 280, y1: 520, x2: 440, y2: 520 },
        // Angled ramp up to the left platform — forces the player to come from below
        { x1: 220, y1: 580, x2: 280, y2: 520 },
        // Floating platform — right side, hovers above the Deep Storage approach
        { x1: 600, y1: 480, x2: 740, y2: 480 },
        // Diagonal barrier — cuts across the upper mid zone; blocks naive top-down shortcuts
        { x1: 450, y1: 280, x2: 580, y2: 380 },
    ],

    // ── Hazards ───────────────────────────────────────────────────────────────
    hazards: [
        // Laser gauntlet blocking the Deep Storage approach
        { type: 'laser', pts: [{ x: 740, y: -200 }, { x: 740, y: 700 }], onMs: 1200, offMs: 1500, warnMs: 400, damagePerSec: 40, thickness: 12 }
    ],

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "The vortex drifts — don't hover near the centre. Match cargo colour to hub colour. Return to HQ to extract.",

    quests: [
        questPrimary('Deliver red & blue cargo'),
        questNoCargoLost('No cargo sucked into the vortex', 400),
        questQuick('Finish with 20+ sec remaining', 20, 250),
    ],
});
