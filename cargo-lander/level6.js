// Level 6 — The Sand Worm's Lair
// Biome: Desert dunes / Amber dusk. Colossal sand worm hazard — speed is survival.

registerLevel({
    name: "L6: The Sand Worm's Lair",
    missionTitle: "Sand Worm Extraction",
    description: "A colossal sand worm lurks beneath the dunes. Deliver the cargo quickly before it strikes!",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.12,          // slightly lighter — worm threat compensates difficulty
    wind: 0,

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [[{"x":-200,"y":920},{"x":-200,"y":1250},{"x":0,"y":650},{"x":40,"y":647},{"x":80,"y":644},{"x":120,"y":644},{"x":160,"y":644},{"x":200,"y":531},{"x":240,"y":568},{"x":280,"y":654},{"x":320,"y":654},{"x":360,"y":654},{"x":400,"y":654},{"x":440,"y":643},{"x":480,"y":629},{"x":520,"y":532},{"x":560,"y":562},{"x":600,"y":558},{"x":640,"y":656},{"x":680,"y":672},{"x":720,"y":710},{"x":760,"y":646},{"x":800,"y":609},{"x":840,"y":539},{"x":880,"y":645},{"x":920,"y":645},{"x":960,"y":645},{"x":1000,"y":645},{"x":1040,"y":696},{"x":1080,"y":651},{"x":1120,"y":586},{"x":1160,"y":549},{"x":1200,"y":542},{"x":1240,"y":601},{"x":1280,"y":647},{"x":1480,"y":1247},{"x":1480,"y":920}]],

    // ── Mission parameters ────────────────────────────────────────────────────
    targetCargo: 1,
    budget: 2000,
    timeLimit: 180,
    allowedTypes: ["normal", "red"],
    collectionX: 60,        // collection depot on the far-left edge

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 1370, width: 90, color: "#10b981", type: "normal", name: "Dune Base" }
    ],

    // ── Palette (Desert / Amber Dusk) ─────────────────────────────────────────
    palette: {
        skyTop:      '#1a1005',
        skyMid:      '#3a2010',
        skyBot:      '#5a3015',
        terrainFill: '#1a1005',
        rockEdge:    '#d97706',
        rockGlow:    'rgba(217,119,6,',
        fog:         'rgba(217,119,6,0.15)',
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "The sand worm is more likely to attack if you linger near its pit. Move fast!",

    quests: [
        questPrimary('Deliver cargo to Dune Base'),
        questSurviveWorm(500),
    ],
});
