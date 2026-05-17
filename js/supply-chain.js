(function() {
    const canvas = document.getElementById('supplyChainCanvas');
    if (!canvas) return; // Only run if canvas exists
    const ctx = canvas.getContext('2d');

    // Default configuration
    const config = window.SupplyChainConfig || {
        density: 25000,
        speedMultiplier: 1.0,
        demandFrequency: 0.02
    };

    let width, height;
    let nodes = [];
    let lines = [];
    let packages = [];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Constants (Muted Colors)
    const COLOR_RAW_RED = '#fca5a5';
    const COLOR_RAW_BLUE = '#93c5fd';
    const COLOR_RAW_YELLOW = '#fde047';
    
    const COLOR_MIX_PURPLE = '#d8b4fe'; // Red + Blue
    const COLOR_MIX_GREEN = '#6ee7b7'; // Yellow + Blue
    const COLOR_MIX_ORANGE = '#fdba74'; // Red + Yellow
    
    const RAW_COLORS = [COLOR_RAW_RED, COLOR_RAW_BLUE, COLOR_RAW_YELLOW];
    const MIX_COLORS = [COLOR_MIX_PURPLE, COLOR_MIX_GREEN, COLOR_MIX_ORANGE];

    function getBOM(mixedColor) {
        if (mixedColor === COLOR_MIX_PURPLE) return [COLOR_RAW_RED, COLOR_RAW_BLUE];
        if (mixedColor === COLOR_MIX_GREEN) return [COLOR_RAW_YELLOW, COLOR_RAW_BLUE];
        if (mixedColor === COLOR_MIX_ORANGE) return [COLOR_RAW_RED, COLOR_RAW_YELLOW];
        return [COLOR_RAW_RED, COLOR_RAW_BLUE]; // fallback
    }

    // 1. Generate Balanced Network
    function generateNetwork() {
        nodes = [];
        lines = [];
        packages = [];
        
        const numNodes = Math.floor((width * height) / config.density); 
        
        let sCount = 0;
        let fCount = 0;

        for(let i=0; i<numNodes; i++) {
            let type = 'normal';
            let radius = 2;
            let supplierColor = null;
            let factoryColor = null;
            
            const r = Math.random();
            if (r < 0.10) { 
                type = 'supplier'; 
                radius = 5; 
                supplierColor = RAW_COLORS[sCount % 3]; // Balance colors
                sCount++;
            } 
            else if (r < 0.25) { type = 'warehouse'; radius = 6; } 
            else if (r < 0.40) { 
                type = 'factory'; 
                radius = 6; 
                factoryColor = MIX_COLORS[fCount % 3]; // Balance colors
                fCount++;
            } 
            else if (r < 0.50) { type = 'consumer'; radius = 7; } 
            
            nodes.push({ 
                id: i,
                type, 
                x: Math.random() * width, 
                y: Math.random() * height, 
                radius,
                supplierColor,
                factoryColor,
                edges: [],
                inventory: [], // Holds waiting packages or raw materials
                demands: [] // For consumers: list of colors currently requested
            });
        }

        // Establish connections (edges)
        nodes.forEach((node) => {
            let distances = nodes.map(n => ({ node: n, d: Math.hypot(n.x - node.x, n.y - node.y) }));
            distances.sort((a,b) => a.d - b.d);
            // Connect to 3 nearest to form graph
            for(let j=1; j<=3; j++) {
                if(distances[j]) {
                    const neighbor = distances[j].node;
                    if(!node.edges.includes(neighbor)) {
                        node.edges.push(neighbor);
                        neighbor.edges.push(node);
                        lines.push({ n1: node, n2: neighbor, glow: 0, glowColor: null });
                    }
                }
            }
        });
    }

    // BFS Pathfinding (Specialized)
    function findPath(startNode, targetType, targetColor) {
        let queue = [[startNode]];
        let visited = new Set([startNode]);
        
        while(queue.length > 0) {
            let path = queue.shift();
            let current = path[path.length - 1];
            
            if (current.type === targetType && current !== startNode) {
                if (targetType === 'factory' && current.factoryColor === targetColor) return path;
                if (targetType === 'supplier' && current.supplierColor === targetColor) return path;
                if (!targetColor) return path;
            }
            
            // Shuffle edges for organic routing variation
            let edges = [...current.edges].sort(() => Math.random() - 0.5);
            for(let neighbor of edges) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([...path, neighbor]);
                }
            }
        }
        return null;
    }

    function findPathToSpecificNode(startNode, endNode) {
        let queue = [[startNode]];
        let visited = new Set([startNode]);
        while(queue.length > 0) {
            let path = queue.shift();
            let current = path[path.length - 1];
            if (current === endNode) return path;
            for(let neighbor of current.edges) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([...path, neighbor]);
                }
            }
        }
        return null;
    }

    // Highlight Network Route
    function highlightPath(path, color) {
        for (let i = 0; i < path.length - 1; i++) {
            let n1 = path[i];
            let n2 = path[i+1];
            let line = lines.find(l => (l.n1 === n1 && l.n2 === n2) || (l.n1 === n2 && l.n2 === n1));
            if (line) {
                line.glow = 1.0;
                line.glowColor = color;
            }
        }
    }

    // Shapes
    function drawHexagon(x, y, r) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            if (i===0) ctx.moveTo(x + r*Math.cos(angle), y + r*Math.sin(angle));
            else ctx.lineTo(x + r*Math.cos(angle), y + r*Math.sin(angle));
        }
        ctx.closePath();
    }

    function drawTriangle(x, y, r) {
        ctx.beginPath();
        ctx.moveTo(x - r, y - r*0.5);
        ctx.lineTo(x + r, y - r*0.5);
        ctx.lineTo(x, y + r);
        ctx.closePath();
    }
    
    function drawSquare(x, y, r) {
        ctx.beginPath();
        ctx.rect(x - r, y - r, r*2, r*2);
        ctx.closePath();
    }

    window.reinitSupplyChain = function(newConfig) {
        if (newConfig.density) config.density = newConfig.density;
        if (newConfig.speedMultiplier) config.speedMultiplier = newConfig.speedMultiplier;
        if (newConfig.demandFrequency) config.demandFrequency = newConfig.demandFrequency;
        generateNetwork();
    };

    generateNetwork(); // Initial generation

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Draw lines
        lines.forEach(l => {
            const dist = Math.hypot(l.n1.x - l.n2.x, l.n1.y - l.n2.y);
            const opacity = Math.max(0, 1 - dist / 300) * 0.15;
            
            ctx.beginPath();
            if (l.glow && l.glow > 0) {
                ctx.strokeStyle = l.glowColor;
                ctx.globalAlpha = Math.min(1.0, opacity + (l.glow * 0.7)); // Brighter route
                ctx.lineWidth = 1 + (l.glow * 1.5);
                ctx.shadowBlur = l.glow * 8;
                ctx.shadowColor = l.glowColor;
                l.glow -= 0.015 * config.speedMultiplier; // fade out over time
            } else {
                ctx.strokeStyle = `rgba(148, 163, 184, ${opacity})`;
                ctx.globalAlpha = 1.0;
                ctx.lineWidth = 1;
                ctx.shadowBlur = 0;
            }
            
            ctx.moveTo(l.n1.x, l.n1.y);
            ctx.lineTo(l.n2.x, l.n2.y);
            ctx.stroke();
            
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;
        });

        // Generate Demand (Pull System)
        if (Math.random() < config.demandFrequency && packages.length < 150) {
            const consumers = nodes.filter(n => n.type === 'consumer');
            if (consumers.length > 0) {
                const consumer = consumers[Math.floor(Math.random() * consumers.length)];
                const demandedColor = MIX_COLORS[Math.floor(Math.random() * MIX_COLORS.length)];
                
                // Find a factory specialized in this color
                const path = findPath(consumer, 'factory', demandedColor);
                if (path && path.length > 1) {
                    const factory = path[path.length - 1];
                    consumer.demands.push(demandedColor);
                    
                    highlightPath(path, demandedColor); // Route Consumer -> Factory
                    
                    const bom = getBOM(demandedColor);
                    bom.forEach(rawColor => {
                        // Find a supplier specialized in this raw material
                        let pathToSupplier = findPath(factory, 'supplier', rawColor);
                        if (pathToSupplier && pathToSupplier.length > 1) {
                            highlightPath(pathToSupplier, rawColor); // Route Factory -> Supplier
                            
                            // Instantly request and dispatch raw material from supplier
                            let returnPath = [...pathToSupplier].reverse();
                            packages.push({
                                path: returnPath,
                                pathIndex: 0,
                                progress: 0,
                                speed: (Math.random() * 0.005 + 0.003) * config.speedMultiplier,
                                color: rawColor,
                                payload: {
                                    type: 'demand_raw',
                                    targetFactory: factory,
                                    targetConsumer: consumer,
                                    finalMixColor: demandedColor
                                }
                            });
                        }
                    });
                }
            }
        }

        // Process Warehouse logic
        nodes.forEach(n => {
            if (n.type === 'warehouse') {
                for(let i = n.inventory.length - 1; i >= 0; i--) {
                    let item = n.inventory[i];
                    item.waitFrames--;
                    if (item.waitFrames <= 0) {
                        item.pkg.progress = 0;
                        packages.push(item.pkg);
                        n.inventory.splice(i, 1);
                    }
                }
            }
        });

        // Manage and draw moving packages (Trucks)
        for(let i = packages.length - 1; i >= 0; i--) {
            let p = packages[i];
            p.progress += p.speed;
            
            let startNode = p.path[p.pathIndex];
            let endNode = p.path[p.pathIndex + 1];
            
            if(p.progress >= 1) {
                p.pathIndex++;
                p.progress = 0;
                
                if (p.pathIndex >= p.path.length - 1) {
                    // Reached final destination
                    let finalNode = p.path[p.path.length - 1];
                    
                    if (finalNode.type === 'factory' && p.payload && p.payload.type === 'demand_raw') {
                        // Raw material arrived at factory
                        finalNode.inventory.push(p);
                        
                        // Check if factory can fulfill the finished good
                        let bom = getBOM(p.payload.finalMixColor);
                        let hasMat1 = finalNode.inventory.findIndex(item => item.color === bom[0]);
                        let hasMat2 = -1;
                        if (hasMat1 !== -1) {
                            hasMat2 = finalNode.inventory.findIndex((item, idx) => item.color === bom[1] && idx !== hasMat1);
                        }
                        
                        if (hasMat1 !== -1 && hasMat2 !== -1) {
                            // Consume materials
                            let highest = Math.max(hasMat1, hasMat2);
                            let lowest = Math.min(hasMat1, hasMat2);
                            finalNode.inventory.splice(highest, 1);
                            finalNode.inventory.splice(lowest, 1);
                            
                            // Ship Finished Good
                            let returnPath = findPathToSpecificNode(finalNode, p.payload.targetConsumer);
                            if (returnPath) {
                                packages.push({
                                    path: returnPath,
                                    pathIndex: 0,
                                    progress: 0,
                                    speed: (Math.random() * 0.005 + 0.003) * config.speedMultiplier,
                                    color: p.payload.finalMixColor,
                                    payload: {
                                        type: 'fulfill_demand',
                                        color: p.payload.finalMixColor
                                    }
                                });
                            }
                        }
                    } else if (finalNode.type === 'consumer') {
                        // Consumer received finished good
                        let demandIdx = finalNode.demands.indexOf(p.color);
                        if (demandIdx !== -1) {
                            finalNode.demands.splice(demandIdx, 1);
                        }
                    }
                    packages.splice(i, 1);
                    continue;
                } else {
                    // Reached an intermediate node
                    let currNode = p.path[p.pathIndex];
                    if (currNode.type === 'warehouse') {
                        currNode.inventory.push({
                            pkg: p,
                            waitFrames: Math.floor((Math.random() * 100 + 50) / config.speedMultiplier)
                        });
                        packages.splice(i, 1);
                        continue;
                    }
                }
                startNode = p.path[p.pathIndex];
                endNode = p.path[p.pathIndex + 1];
            }
            
            const curX = startNode.x + (endNode.x - startNode.x) * p.progress;
            const curY = startNode.y + (endNode.y - startNode.y) * p.progress;
            
            // Calculate direction angle for truck orientation
            const dx = endNode.x - startNode.x;
            const dy = endNode.y - startNode.y;
            const angle = Math.atan2(dy, dx);
            
            ctx.save();
            ctx.translate(curX, curY);
            ctx.rotate(angle);
            
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
            
            // Draw Truck (Constant size, simulating a convoy/truck with cargo)
            // Front Cab
            ctx.fillRect(4, -2, 4, 4);
            // Middle Cargo
            ctx.fillRect(-2, -2.5, 5, 5);
            // Rear Cargo
            ctx.fillRect(-8, -2.5, 5, 5);
            
            ctx.restore();
        }

        // Draw nodes
        nodes.forEach(n => {
            ctx.lineWidth = 1.5;
            if (n.type === 'supplier') {
                ctx.fillStyle = 'rgba(148, 163, 184, 0.1)';
                ctx.strokeStyle = n.supplierColor; // Specialized color border
                ctx.lineWidth = 2;
                ctx.shadowBlur = 4;
                ctx.shadowColor = n.supplierColor;
                drawHexagon(n.x, n.y, n.radius);
                ctx.fill(); ctx.stroke();
                ctx.shadowBlur = 0;
            } else if (n.type === 'warehouse') {
                ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
                drawTriangle(n.x, n.y, n.radius);
                ctx.fill(); ctx.stroke();
                
                if (n.inventory.length > 0) {
                    n.inventory.forEach((item, idx) => {
                        ctx.fillStyle = item.pkg.color;
                        ctx.fillRect(n.x + n.radius + 2, n.y - n.radius + (idx * 4), 3, 3);
                    });
                }
            } else if (n.type === 'factory') {
                ctx.fillStyle = 'rgba(148, 163, 184, 0.1)';
                ctx.strokeStyle = n.factoryColor; // Specialized color border
                ctx.lineWidth = 2;
                ctx.shadowBlur = 4;
                ctx.shadowColor = n.factoryColor;
                drawSquare(n.x, n.y, n.radius);
                ctx.fill(); ctx.stroke();
                ctx.shadowBlur = 0;
                
                n.inventory.forEach((item, idx) => {
                    ctx.fillStyle = item.color;
                    ctx.beginPath();
                    ctx.arc(n.x - n.radius + 3 + (idx*5), n.y + n.radius + 5, 2, 0, Math.PI*2);
                    ctx.fill();
                });
            } else if (n.type === 'consumer') {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.radius, 0, Math.PI*2);
                ctx.fill(); ctx.stroke();
                ctx.shadowBlur = 0;

                // Draw demand indicators
                if (n.demands.length > 0) {
                    ctx.font = 'bold 12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowBlur = 6;
                    ctx.shadowColor = n.demands[0]; // Glow in the requested color
                    ctx.fillText('!', n.x, n.y - 12);
                    ctx.shadowBlur = 0;
                }
            } else {
                ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.radius, 0, Math.PI*2);
                ctx.fill();
            }
        });

        requestAnimationFrame(animate);
    }

    animate();
})();
