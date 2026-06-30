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
    // terrainType drives procedural generation in physics.js
    terrainPolygons: [[{"x":-200,"y":920},{"x":-200,"y":1235},{"x":0,"y":635},{"x":40,"y":641},{"x":80,"y":652},{"x":120,"y":652},{"x":160,"y":652},{"x":200,"y":652},{"x":240,"y":656},{"x":280,"y":599},{"x":320,"y":599},{"x":360,"y":599},{"x":400,"y":599},{"x":440,"y":599},{"x":480,"y":576},{"x":520,"y":586},{"x":560,"y":620},{"x":600,"y":667},{"x":640,"y":671},{"x":680,"y":656},{"x":720,"y":638},{"x":760,"y":669},{"x":800,"y":669},{"x":840,"y":669},{"x":880,"y":669},{"x":920,"y":617},{"x":960,"y":600},{"x":1000,"y":601},{"x":1040,"y":602},{"x":1080,"y":589},{"x":1120,"y":572},{"x":1160,"y":573},{"x":1200,"y":597},{"x":1240,"y":627},{"x":1280,"y":641},{"x":1480,"y":1241},{"x":1480,"y":920}]],

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
