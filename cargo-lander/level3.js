// Level 3 — Gale-Force Winds
// Biome: Arctic / Ice. Persistent crosswind forces precise counter-thrusting.

registerLevel({
    name: "L3: Gale-Force Winds",
    missionTitle: "High-Altitude Wind Contract",
    description: "Strong crosswinds push your lander and cargo. Compensate by thrusting into the wind.",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.15,
    wind: 0.08,         // significant constant horizontal force

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainType: "mountain",

    // ── Mission parameters ────────────────────────────────────────────────────
    padScale: 0.85,     // tighter pads — demands accuracy despite the wind
    targetCargo: 2,
    budget: 1500,
    timeLimit: 200,
    allowedTypes: ["normal"],

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 650, color: "#38bdf8", type: "normal", name: "Peak Station" }
    ],

    // ── Palette (Arctic / Ice Blue) ───────────────────────────────────────────
    palette: {
        skyTop:      '#020810',
        skyMid:      '#061828',
        skyBot:      '#0a1e2e',
        terrainFill: '#08121c',
        rockEdge:    '#7dd3fc',
        rockGlow:    'rgba(125,211,252,',
        fog:         'rgba(125,211,252,0.06)',
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "Tilt into the wind. Return to HQ to extract.",

    quests: [
        questPrimary('Deliver 2 cargo to Peak Station'),
        questNoCrash(400),
        questQuick('Finish with 30+ sec remaining', 30, 200),
    ],
});
