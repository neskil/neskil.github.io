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
    terrainPolygons: [[{"x":-200,"y":920},{"x":-200,"y":1260},{"x":0,"y":660},{"x":40,"y":674},{"x":80,"y":652},{"x":120,"y":652},{"x":160,"y":652},{"x":200,"y":544},{"x":240,"y":484},{"x":280,"y":362},{"x":320,"y":362},{"x":360,"y":362},{"x":400,"y":266},{"x":440,"y":192},{"x":480,"y":118},{"x":520,"y":100},{"x":560,"y":100},{"x":600,"y":100},{"x":640,"y":100},{"x":680,"y":100},{"x":720,"y":100},{"x":760,"y":100},{"x":800,"y":143},{"x":840,"y":178},{"x":880,"y":339},{"x":920,"y":339},{"x":960,"y":339},{"x":1000,"y":428},{"x":1040,"y":507},{"x":1080,"y":544},{"x":1120,"y":604},{"x":1160,"y":675},{"x":1200,"y":655},{"x":1240,"y":649},{"x":1280,"y":674},{"x":1480,"y":1274},{"x":1480,"y":920}]],

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
