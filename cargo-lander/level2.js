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
    terrainPolygons: [[{"x":-200,"y":920},{"x":-200,"y":1220},{"x":0,"y":620},{"x":40,"y":630},{"x":80,"y":611},{"x":120,"y":611},{"x":160,"y":611},{"x":200,"y":630},{"x":240,"y":618},{"x":280,"y":629},{"x":320,"y":629},{"x":360,"y":629},{"x":400,"y":629},{"x":440,"y":611},{"x":480,"y":623},{"x":520,"y":683},{"x":560,"y":710},{"x":600,"y":710},{"x":640,"y":710},{"x":680,"y":710},{"x":720,"y":710},{"x":760,"y":666},{"x":800,"y":626},{"x":840,"y":626},{"x":880,"y":626},{"x":920,"y":612},{"x":960,"y":626},{"x":1000,"y":611},{"x":1040,"y":611},{"x":1080,"y":611},{"x":1120,"y":627},{"x":1160,"y":627},{"x":1200,"y":612},{"x":1240,"y":614},{"x":1280,"y":628},{"x":1480,"y":1228},{"x":1480,"y":920}]],

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
