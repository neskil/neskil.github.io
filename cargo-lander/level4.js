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
    terrainPolygons: [[{"x":-200,"y":920},{"x":-200,"y":1225},{"x":0,"y":625},{"x":40,"y":624},{"x":80,"y":624},{"x":120,"y":624},{"x":160,"y":435},{"x":200,"y":270},{"x":240,"y":209},{"x":280,"y":190},{"x":320,"y":190},{"x":360,"y":200},{"x":400,"y":213},{"x":440,"y":308},{"x":480,"y":452},{"x":520,"y":625},{"x":560,"y":625},{"x":600,"y":632},{"x":640,"y":629},{"x":680,"y":627},{"x":720,"y":626},{"x":760,"y":626},{"x":800,"y":628},{"x":840,"y":630},{"x":880,"y":630},{"x":920,"y":585},{"x":960,"y":512},{"x":1000,"y":540},{"x":1040,"y":658},{"x":1080,"y":665},{"x":1120,"y":656},{"x":1160,"y":583},{"x":1200,"y":509},{"x":1240,"y":499},{"x":1280,"y":512},{"x":1320,"y":511},{"x":1360,"y":534},{"x":1400,"y":539},{"x":1440,"y":535},{"x":1480,"y":535},{"x":1520,"y":531},{"x":1560,"y":530},{"x":1600,"y":530},{"x":1800,"y":1130},{"x":1800,"y":920}]],    // cave ceiling system active; underground data center easter egg

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
