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
    terrainType: "canyon",

    // ── Mission parameters ────────────────────────────────────────────────────
    padScale: 1.2,
    targetCargo: 2,
    budget: 1200,
    timeLimit: 240,
    allowedTypes: ["normal", "red"],

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
