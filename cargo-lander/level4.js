// Level 4 — Gravity Anomaly
// Biome: Volcanic / Orange. Moving gravity well + tight pads + two cargo types.

registerLevel({
    name: "L4: Gravity Anomaly",
    missionTitle: "Anomaly Zone Delivery",
    description: "A gravitational vortex is pulling you in. Counter the force and sort red/blue cargo to their correct hubs.",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.15,
    wind: 0,

    // Moving gravity well — physics.js reads gravityWell config
    gravityWell: {
        x: 500,
        y: 400,
        strength: 0.8,
        radius: 200,
        orbitRadius: 200,   // well orbits its base position (Lissajous phase)
    },

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainType: "cave",    // cave ceiling system active; underground data center easter egg

    // ── Mission parameters ────────────────────────────────────────────────────
    padScale: 0.70,         // tightest standard pads so far
    targetCargo: 2,
    budget: 2000,
    timeLimit: 180,
    allowedTypes: ["red", "blue"],

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 750, color: "#ef4444", type: "red",    name: "Sector 4"     },
        { x: 900, color: "#3b82f6", type: "blue",   name: "Deep Storage" },
    ],

    // ── Palette (Volcanic / Orange-Red) ──────────────────────────────────────
    palette: {
        skyTop:      '#0e0403',
        skyMid:      '#1a0602',
        skyBot:      '#2a0a04',
        terrainFill: '#120402',
        rockEdge:    '#f97316',
        rockGlow:    'rgba(249,115,22,',
        fog:         'rgba(249,115,22,0.08)',
    },

    // ── Segments — floating lava platforms and a diagonal barrier ────────────
    // Coordinates are in level-space (same as deliveryHub x values).
    // The lander and cargo boxes collide with these just like terrain.
    segments: [
        // Floating lava platform — left of the vortex zone
        { x1: 300, y1: 520, x2: 420, y2: 520 },
        // Short angled ramp leading up to it
        { x1: 220, y1: 570, x2: 300, y2: 520 },
        // Floating platform — right side, near the hubs
        { x1: 620, y1: 480, x2: 720, y2: 480 },
        // Diagonal barrier cutting across the upper cave
        { x1: 480, y1: 300, x2: 560, y2: 380 },
    ],

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "Avoid the vortex and the lava platforms! Return to HQ to extract.",

    quests: [
        questPrimary('Deliver red & blue cargo'),
        questNoCargoLost('No cargo sucked in', 350),
        questNoCrash(300),
    ],
});
