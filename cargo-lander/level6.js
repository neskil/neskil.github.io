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
    terrainType: "worm-lair",

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
