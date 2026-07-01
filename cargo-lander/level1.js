// Level 1 — Local Distribution
// Biome: Grasslands / Verdant Basin.
// Your first contract: a rolling highland with a single receiving hub.
// Gently sloping terrain teaches the player that tilt kills cargo before anything else.
// The lake in the lower-right is purely decorative (rendered by game.js on L1 only).

registerLevel({
    name: "L1: Local Distribution",
    missionTitle: "Verdant Basin — First Delivery",
    description: "Welcome to the Verdant Basin, your first posting as a certified cargo pilot. A nearby logistics hub needs a routine freight drop — nothing exotic, just get the packages there in one piece. Tilt too far and they slide off the deck.",

    // ── Physics ──────────────────────────────────────────────────────────────
    gravity: 0.15,
    wind: 0,

    // ── Terrain ───────────────────────────────────────────────────────────────
    startX: -70,
    terrainPolygons: [
        [
            { x: -420, y: 660 },
            { x: -110, y: 710 },
            { x: 40, y: 710 },
            { x: 100, y: 510 },
            { x: 150, y: 410 },
            { x: 290, y: 390 },
            { x: 430, y: 470 },
            { x: 390, y: 740 },
            { x: 750, y: 670 },
            { x: 720, y: 570 },
            { x: 850, y: 580 },
            { x: 940, y: 670 },
            { x: 1120, y: 670 },
            { x: 1700, y: 590 },
            { x: 2570, y: 2010 },
            { x: -1680, y: 2010 },
            { x: -920, y: 760 }
        ]
    ],
    // ── Water Bodies ──────────────────────────────────────────────────────────
    // Hand-authored basin polygon (editable in terrain-editor.html the same way
    // as terrainPolygons) — was previously an auto-generated {x, width} rect.
    waterBodies: [
        {
            hasBoat: true,
            pts: [
                {x: 350, y: 580},
                {x: 740, y: 580},
                {x: 810, y: 700},
                {x: 530, y: 790},
                {x: 340, y: 760}
            ]
        }
    ],

    // ── Mission parameters ────────────────────────────────────────────────────
    padScale: 1.5,
    targetCargo: 2,
    budget: 1000,
    timeLimit: 180,
    allowedTypes: ["normal"],

    // ── Environment ───────────────────────────────────────────────────────────
    outOfBounds: {
        type: 'water',
        color: 'rgba(14, 165, 233, 0.4)',
        mistColor: 'rgba(14, 165, 233, 0.2)',
        surfaceY: 1300,
        drag: 0.92,
        buoyancy: -0.15,
        monsterDepth: 1600
    },

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 1030, color: "#38bdf8", type: "normal", name: "Verdant Depot" }
    ],

    // ── Palette (Grasslands) ──────────────────────────────────────────────────
    palette: {
        skyTop: '#25338fff',
        skyMid: '#13294aff',
        skyBot: '#0f2512ff',
        terrainFill: '#020802',
        rockEdge: '#4ade80',
        rockGlow: 'rgba(74,222,128,',
        fog: 'rgba(74,222,128,0.04)',
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "Land slowly (< 2.0 m/s) or you'll bounce the cargo off the deck. When both crates are delivered, fly back to HQ to extract.",

    quests: [
        questPrimary('Deliver 2 cargo to Verdant Depot'),
        questNoCrash(250),
        questQuick('Finish with 1+ min remaining', 60, 150),
    ],
});
