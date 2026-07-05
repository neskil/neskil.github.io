// levelGenerator.js — Procedural Mission Generator
// Generates random levels with stitched terrain, randomized hubs, and dynamic palettes.

const BIOMES = [
    {
        name: "Grasslands",
        palette: { skyTop: '#25338fff', skyMid: '#13294aff', skyBot: '#0f2512ff', terrainFill: '#020802', rockEdge: '#4ade80', rockGlow: 'rgba(74,222,128,', fog: 'rgba(74,222,128,0.04)' }
    },
    {
        name: "Desert Wastes",
        palette: { skyTop: '#4a1505', skyMid: '#2e0f06', skyBot: '#0a0301', terrainFill: '#0a0301', rockEdge: '#f59e0b', rockGlow: 'rgba(245,158,11,', fog: 'rgba(245,158,11,0.04)' }
    },
    {
        name: "Arctic Expanse",
        palette: { skyTop: '#0a192f', skyMid: '#112240', skyBot: '#020c1b', terrainFill: '#010613', rockEdge: '#38bdf8', rockGlow: 'rgba(56,189,248,', fog: 'rgba(56,189,248,0.04)' }
    },
    {
        name: "Volcanic Zone",
        palette: { skyTop: '#3a0808', skyMid: '#1a0303', skyBot: '#050000', terrainFill: '#050000', rockEdge: '#ef4444', rockGlow: 'rgba(239,68,68,', fog: 'rgba(239,68,68,0.04)' }
    },
    {
        name: "Crystal Caverns",
        palette: { skyTop: '#1e0a2b', skyMid: '#12041c', skyBot: '#06010a', terrainFill: '#06010a', rockEdge: '#a855f7', rockGlow: 'rgba(168,85,247,', fog: 'rgba(168,85,247,0.04)' }
    }
];

const CARGO_TYPES = ['normal', 'red', 'blue', 'green'];
const HUB_COLORS = { 'normal': '#38bdf8', 'red': '#ef4444', 'blue': '#3b82f6', 'green': '#10b981' };

let proceduralLevelCount = 0;

function generateProceduralLevel(craziness = 1) {
    proceduralLevelCount++;
    const biome = BIOMES[Math.floor(Math.random() * BIOMES.length)];
    
    let targetLength = 2500;
    let targetCargo = 2;
    let budget = 1000;
    let timeLimit = 180;
    let gravity = 0.035;
    let wind = 0;
    
    if (craziness === 1) {
        targetLength = 2500 + Math.random() * 1000;
        targetCargo = 2 + Math.floor(Math.random() * 2);
        budget = 800 + Math.random() * 500;
        timeLimit = 180 + Math.random() * 60;
        gravity = 0.035 + Math.random() * 0.01;
        wind = (Math.random() - 0.5) * 0.0005;
    } else if (craziness === 2) {
        targetLength = 4000 + Math.random() * 2000;
        targetCargo = 3 + Math.floor(Math.random() * 3);
        budget = 1500 + Math.random() * 500;
        timeLimit = 240 + Math.random() * 120;
        gravity = 0.04 + Math.random() * 0.02;
        wind = (Math.random() - 0.5) * 0.002;
    } else if (craziness === 3) {
        targetLength = 6000 + Math.random() * 4000;
        targetCargo = 5 + Math.floor(Math.random() * 4);
        budget = 2500 + Math.random() * 1000;
        timeLimit = 360 + Math.random() * 180;
        gravity = 0.05 + Math.random() * 0.04;
        wind = (Math.random() - 0.5) * 0.004;
    }

    // Build terrain
    let pts = [];
    // Start way left and high
    pts.push({ x: -1000, y: 0 });
    pts.push({ x: -1000, y: 700 });
    
    let currentX = -1000;
    let currentY = 700;
    
    // We need flat pads for: StartHQ, Collection, and 1-2 Hubs.
    // Let's place them at specific X ranges.
    const pads = [
        { xMin: -300, xMax: -100, label: 'hq', width: 250 },
        { xMin: 200,  xMax: 400,  label: 'collection', width: 250 },
        { xMin: 900,  xMax: 1100, label: 'hub1', width: 200 },
        { xMin: 1600, xMax: 1800, label: 'hub2', width: 200 }
    ];
    
    let activePad = 0;
    let nextPadX = pads[activePad].xMin + Math.random() * (pads[activePad].xMax - pads[activePad].xMin);
    
    let hqX = 0, collectionX = 0;
    let hubs = [];
    let buildings = [];
    
    while (currentX < targetLength) {
        if (activePad < pads.length && currentX >= nextPadX) {
            // Draw flat pad
            currentY = currentY + (Math.random() - 0.5) * 60; // Step to pad height (less drastic)
            pts.push({ x: currentX, y: currentY });
            let endX = currentX + pads[activePad].width;
            
            // Maybe add a building on this flat pad
            if (Math.random() > 0.4) {
                const bTypes = ['antenna', 'silo', 'refinery'];
                const btype = bTypes[Math.floor(Math.random() * bTypes.length)];
                // Place it either at the start or end of the pad
                let bX = Math.random() > 0.5 ? currentX + 30 : endX - 30;
                buildings.push({ type: btype, x: bX });
            }

            pts.push({ x: endX, y: currentY });
            
            // Record pad center
            let centerX = currentX + pads[activePad].width / 2;
            if (pads[activePad].label === 'hq') hqX = centerX;
            if (pads[activePad].label === 'collection') collectionX = centerX;
            if (pads[activePad].label.startsWith('hub')) {
                // Random cargo type for this hub
                let type = CARGO_TYPES[Math.floor(Math.random() * CARGO_TYPES.length)];
                hubs.push({ x: centerX, color: HUB_COLORS[type], type: type, name: `Outpost ${Math.floor(Math.random()*999)}` });
            }
            
            currentX = endX;
            activePad++;
            if (activePad < pads.length) {
                nextPadX = pads[activePad].xMin + Math.random() * (pads[activePad].xMax - pads[activePad].xMin);
                // Ensure next pad is after currentX
                if (nextPadX < currentX + 150) nextPadX = currentX + 150 + Math.random() * 200;
            }
        } else {
            // Random walk terrain - INCREASED X STEP FOR MORE SPACIOUSNESS
            let stepX = 120 + Math.random() * 200;
            
            // Overhang logic
            if (craziness >= 2 && Math.random() < 0.2) {
                // Generate an overhang by going backwards and down (wider cave)
                let overX = currentX - (50 + Math.random() * 70);
                let overY = currentY + (80 + Math.random() * 120);
                pts.push({ x: overX, y: overY });
                
                // Then continue forward from the overhang
                currentX += stepX;
                currentY = overY + (Math.random() - 0.5) * 80;
                pts.push({ x: currentX, y: currentY });
            } else {
                currentX += stepX;
                // Less drastic Y variance for smoother slopes
                let variance = 150 + craziness * 100;
                let stepY = (Math.random() - 0.5) * variance;
                
                // Prevent going too high or low
                if (currentY + stepY < 200) stepY = Math.abs(stepY) + 50; // Push down
                if (currentY + stepY > 900) stepY = -Math.abs(stepY) - 50; // Push up
                
                currentY += stepY;
                pts.push({ x: currentX, y: currentY });
            }
        }
    }
    
    // Add Hazards for Insane (craziness >= 3) or sometimes hard (craziness >= 2)
    let hazards = [];
    if (craziness >= 2) {
        let numHazards = craziness === 2 ? Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numHazards; i++) {
            let hx = 500 + Math.random() * (targetLength - 1000);
            let hy = 300 + Math.random() * 500;
            if (Math.random() > 0.5) {
                hazards.push({ type: 'laser', x: hx, y: hy, endX: hx + 200 + Math.random() * 100, endY: hy, onTime: 1500, offTime: 1500, offset: Math.random() * 2000 });
            } else {
                hazards.push({ type: 'drone', x: hx, y: hy, patrolRadius: 200 + Math.random() * 200, speed: 1 + Math.random() });
            }
        }
    }
    
    // Finish polygon
    pts.push({ x: 3000 + (targetLength - 2500), y: currentY });
    pts.push({ x: 3000 + (targetLength - 2500), y: 2000 });
    pts.push({ x: -1000, y: 2000 });
    
    let hubTypes = hubs.map(h => h.type);
    
    // OOB zone
    let oob = {
        type: 'water',
        color: 'rgba(239, 68, 68, 0.2)',
        mistColor: 'rgba(239, 68, 68, 0.1)',
        surfaceY: 1300,
        drag: 0.95,
        buoyancy: -0.1,
        monsterDepth: 1500
    };

    return { craziness,
        name: `Mission ♾️ · Endless`,
        missionTitle: `Sector ${Math.floor(Math.random() * 9999)} — ${biome.name}`,
        description: `A procedurally generated delivery contract in the ${biome.name}. Unpredictable terrain and weather conditions. Be careful out there, pilot.`,
        gravity: Number(gravity.toFixed(3)),
        wind: Number(wind.toFixed(4)),
        startX: Math.floor(hqX),
        collectionX: Math.floor(collectionX),
        terrainPolygons: [pts],
        hazards: hazards,
        buildings: buildings,
        collectibles: [],
        padScale: 1.0,
        targetCargo: targetCargo,
        budget: budget,
        timeLimit: timeLimit,
        allowedTypes: hubTypes.length > 0 ? hubTypes : ['normal'],
        outOfBounds: oob,
        deliveryHubs: hubs,
        palette: biome.palette,
        hint: "This sector was procedurally generated. Expect the unexpected.",
        quests: [
            questPrimary(`Deliver ${targetCargo} cargo to destination hubs`),
            questNoCrash(250)
        ]
    };
}
