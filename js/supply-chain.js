(function() {
    const canvas = document.getElementById('supplyChainCanvas');
    if (!canvas) return; // Only run if canvas exists
    const ctx = canvas.getContext('2d');

    // Default configuration
    const config = window.SupplyChainConfig || {
        density: 25000,
        speedMultiplier: 1.0,
        demandFrequency: 0.005
    };

    let width, height;
    let nodes = [];
    let lines = [];
    let packages = [];
    let continents = [];
    let signals = []; // Used for the crawling light paths

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

    // 1. Generate Clustered Network
    function generateNetwork() {
        nodes = [];
        lines = [];
        packages = [];
        continents = [];
        signals = [];
        
        const numNodes = Math.floor((width * height) / config.density); 
        
        // Generate Continents
        const numContinents = Math.floor(Math.random() * 3) + 3; // 3 to 5 continents
        for(let i=0; i<numContinents; i++) {
            continents.push({
                x: width * 0.15 + Math.random() * (width * 0.7),
                y: height * 0.15 + Math.random() * (height * 0.7),
                radius: Math.min(width, height) * (0.15 + Math.random() * 0.1)
            });
        }

        let sCount = 0;
        let fCount = 0;

        for(let i=0; i<numNodes; i++) {
            let cont = continents[Math.floor(Math.random() * continents.length)];
            let angle = Math.random() * Math.PI * 2;
            let r_dist = cont.radius * Math.sqrt(Math.random()); 
            
            let nx = cont.x + Math.cos(angle) * r_dist;
            let ny = cont.y + Math.sin(angle) * r_dist;
            
            nx = Math.max(30, Math.min(width - 30, nx));
            ny = Math.max(30, Math.min(height - 30, ny));

            let type = 'normal';
            let radius = 2;
            let supplierColor = null;
            let factoryColor = null;
            
            const r = Math.random();
            if (r < 0.15) { 
                type = 'supplier'; radius = 5; 
                supplierColor = RAW_COLORS[sCount % 3]; sCount++;
            } else if (r < 0.35) { 
                type = 'factory'; radius = 6; 
                factoryColor = MIX_COLORS[fCount % 3]; fCount++;
            } else if (r < 0.60) { type = 'consumer'; radius = 7; } 
            
            nodes.push({ 
                id: i, type, x: nx, y: ny, radius,
                supplierColor, factoryColor, continent: cont,
                edges: [], inventory: [], demands: []
            });
        }

        // Establish Local Connections (Land)
        nodes.forEach((node) => {
            let localNodes = nodes.filter(n => n.continent === node.continent);
            let distances = localNodes.map(n => ({ node: n, d: Math.hypot(n.x - node.x, n.y - node.y) }));
            distances.sort((a,b) => a.d - b.d);
            
            for(let j=1; j<=3; j++) {
                if(distances[j]) {
                    const neighbor = distances[j].node;
                    if(!node.edges.includes(neighbor)) {
                        node.edges.push(neighbor);
                        neighbor.edges.push(node);
                        lines.push({ n1: node, n2: neighbor, type: 'land', glow: 0, glowColor: null });
                    }
                }
            }
        });

        // Establish Global Connections (Sea / Air)
        for(let i=0; i<continents.length; i++) {
            let c1 = continents[i];
            let c1Nodes = nodes.filter(n => n.continent === c1);
            if (c1Nodes.length === 0) continue;
            
            for(let j=i+1; j<continents.length; j++) {
                let c2 = continents[j];
                let c2Nodes = nodes.filter(n => n.continent === c2);
                if (c2Nodes.length === 0) continue;
                
                let numRoutes = Math.floor(Math.random() * 2) + 1; // 1 or 2 inter-continent lanes
                for(let k=0; k<numRoutes; k++) {
                    let port1 = c1Nodes[Math.floor(Math.random() * c1Nodes.length)];
                    let port2 = c2Nodes[Math.floor(Math.random() * c2Nodes.length)];
                    
                    if(!port1.edges.includes(port2)) {
                        port1.edges.push(port2);
                        port2.edges.push(port1);
                        
                        let isAir = Math.random() < 0.2; // 20% chance of air route
                        lines.push({ n1: port1, n2: port2, type: isAir ? 'air' : 'sea', glow: 0, glowColor: null });
                        
                        // Convert inter-continent connection points to ports (warehouses)
                        port1.type = 'warehouse';
                        port1.radius = 6;
                        port2.type = 'warehouse';
                        port2.radius = 6;
                    }
                }
            }
        }
    }

    // BFS Pathfinding
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

    generateNetwork();

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Draw Continent Backgrounds (Sharp Landmass Break)
        ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
        ctx.beginPath();
        nodes.forEach(n => {
            ctx.moveTo(n.x, n.y);
            ctx.arc(n.x, n.y, 40, 0, Math.PI * 2); // Creates sharp clustered blobs
        });
        ctx.fill();

        // Crawling Signals (Path Illumination)
        for (let i = signals.length - 1; i >= 0; i--) {
            let s = signals[i];
            s.progress += s.speed;
            
            let startNode = s.path[s.pathIndex];
            let endNode = s.path[s.pathIndex + 1];
            
            // Illumniate line as signal crawls over it
            let line = lines.find(l => (l.n1 === startNode && l.n2 === endNode) || (l.n1 === endNode && l.n2 === startNode));
            if (line) {
                line.glow = Math.max(line.glow || 0, s.progress);
                line.glowColor = s.color;
            }
            
            if (s.progress >= 1) {
                if (line) line.glow = 1.0;
                s.pathIndex++;
                s.progress = 0;
                
                if (s.pathIndex >= s.path.length - 1) {
                    // Reached destination
                    let finalNode = s.path[s.path.length - 1];
                    
                    if (s.payload && s.payload.type === 'demand_factory') {
                        let bom = getBOM(s.payload.finalMixColor);
                        bom.forEach(rawColor => {
                            let pathToSupplier = findPath(finalNode, 'supplier', rawColor);
                            if (pathToSupplier && pathToSupplier.length > 1) {
                                signals.push({
                                    path: pathToSupplier,
                                    pathIndex: 0,
                                    progress: 0,
                                    color: rawColor,
                                    speed: 0.02 * config.speedMultiplier,
                                    payload: {
                                        type: 'demand_raw',
                                        targetFactory: finalNode,
                                        targetConsumer: s.payload.targetConsumer,
                                        finalMixColor: s.payload.finalMixColor,
                                        color: rawColor
                                    }
                                });
                            }
                        });
                    } else if (s.payload && s.payload.type === 'demand_raw') {
                        // Dispatch package using the EXACT reversed path for visual consistency
                        let returnPath = [...s.path].reverse();
                        packages.push({
                            path: returnPath,
                            pathIndex: 0,
                            progress: 0,
                            color: s.payload.color,
                            payload: s.payload
                        });
                    }
                    signals.splice(i, 1);
                }
            }
        }

        // Draw lines
        lines.forEach(l => {
            const opacity = 0.2;
            
            ctx.beginPath();
            if (l.type === 'sea') {
                ctx.setLineDash([8, 12]); // Shipping lanes
            } else if (l.type === 'air') {
                ctx.setLineDash([2, 6]); // Air routes
            } else {
                ctx.setLineDash([]); // Roads
            }

            if (l.glow && l.glow > 0) {
                ctx.strokeStyle = l.glowColor;
                ctx.globalAlpha = Math.min(1.0, opacity + (l.glow * 0.8)); // Keep light
                ctx.lineWidth = 1 + (l.glow * 1.5);
                ctx.shadowBlur = l.glow * 6;
                ctx.shadowColor = l.glowColor;
                l.glow -= 0.002 * config.speedMultiplier; // Very slow fade!
            } else {
                ctx.strokeStyle = `rgba(148, 163, 184, ${opacity})`;
                ctx.globalAlpha = 1.0;
                ctx.lineWidth = 1;
                ctx.shadowBlur = 0;
            }
            
            ctx.moveTo(l.n1.x, l.n1.y);
            ctx.lineTo(l.n2.x, l.n2.y);
            ctx.stroke();
            
            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;
        });

        // Generate Demand
        if (Math.random() < config.demandFrequency && packages.length < 150) {
            const consumers = nodes.filter(n => n.type === 'consumer');
            if (consumers.length > 0) {
                const consumer = consumers[Math.floor(Math.random() * consumers.length)];
                const demandedColor = MIX_COLORS[Math.floor(Math.random() * MIX_COLORS.length)];
                
                const path = findPath(consumer, 'factory', demandedColor);
                if (path && path.length > 1) {
                    consumer.demands.push(demandedColor);
                    
                    signals.push({
                        path: path,
                        pathIndex: 0,
                        progress: 0,
                        color: demandedColor,
                        speed: 0.02 * config.speedMultiplier, // Crawling light
                        payload: {
                            type: 'demand_factory',
                            targetConsumer: consumer,
                            finalMixColor: demandedColor
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

        // Manage and draw moving packages
        const BASE_SPEED = 0.003;

        for(let i = packages.length - 1; i >= 0; i--) {
            let p = packages[i];
            
            let startNode = p.path[p.pathIndex];
            let endNode = p.path[p.pathIndex + 1];
            
            let currentLine = lines.find(l => (l.n1 === startNode && l.n2 === endNode) || (l.n1 === endNode && l.n2 === startNode));
            let edgeType = currentLine ? currentLine.type : 'land';
            
            let actualSpeed = BASE_SPEED * config.speedMultiplier;
            if (edgeType === 'sea') actualSpeed *= 0.6; // Boats slower
            if (edgeType === 'air') actualSpeed *= 1.4; // Air faster
            
            p.progress += actualSpeed;
            
            if(p.progress >= 1) {
                p.pathIndex++;
                p.progress = 0;
                
                if (p.pathIndex >= p.path.length - 1) {
                    // Reached final destination
                    let finalNode = p.path[p.path.length - 1];
                    
                    if (finalNode.type === 'factory' && p.payload && p.payload.type === 'demand_raw') {
                        finalNode.inventory.push(p);
                        
                        let bom = getBOM(p.payload.finalMixColor);
                        let hasMat1 = finalNode.inventory.findIndex(item => item.color === bom[0]);
                        let hasMat2 = -1;
                        if (hasMat1 !== -1) {
                            hasMat2 = finalNode.inventory.findIndex((item, idx) => item.color === bom[1] && idx !== hasMat1);
                        }
                        
                        if (hasMat1 !== -1 && hasMat2 !== -1) {
                            let highest = Math.max(hasMat1, hasMat2);
                            let lowest = Math.min(hasMat1, hasMat2);
                            finalNode.inventory.splice(highest, 1);
                            finalNode.inventory.splice(lowest, 1);
                            
                            let returnPath = findPathToSpecificNode(finalNode, p.payload.targetConsumer);
                            if (returnPath) {
                                packages.push({
                                    path: returnPath,
                                    pathIndex: 0,
                                    progress: 0,
                                    color: p.payload.finalMixColor,
                                    payload: {
                                        type: 'fulfill_demand',
                                        color: p.payload.finalMixColor
                                    }
                                });
                            }
                        }
                    } else if (finalNode.type === 'consumer') {
                        let demandIdx = finalNode.demands.indexOf(p.color);
                        if (demandIdx !== -1) {
                            finalNode.demands.splice(demandIdx, 1);
                        }
                    }
                    packages.splice(i, 1);
                    continue;
                } else {
                    let currNode = p.path[p.pathIndex];
                    if (currNode.type === 'warehouse') {
                        // Wait at ports before continuing across sea
                        currNode.inventory.push({
                            pkg: p,
                            waitFrames: Math.floor((Math.random() * 80 + 40) / config.speedMultiplier)
                        });
                        packages.splice(i, 1);
                        continue;
                    }
                }
                startNode = p.path[p.pathIndex];
                endNode = p.path[p.pathIndex + 1];
                currentLine = lines.find(l => (l.n1 === startNode && l.n2 === endNode) || (l.n1 === endNode && l.n2 === startNode));
                edgeType = currentLine ? currentLine.type : 'land';
            }
            
            const curX = startNode.x + (endNode.x - startNode.x) * p.progress;
            const curY = startNode.y + (endNode.y - startNode.y) * p.progress;
            
            const dx = endNode.x - startNode.x;
            const dy = endNode.y - startNode.y;
            const angle = Math.atan2(dy, dx);
            
            ctx.save();
            ctx.translate(curX, curY);
            ctx.rotate(angle);
            
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 6;
            ctx.shadowColor = p.color;
            
            if (edgeType === 'sea') {
                ctx.fillRect(-6, -3, 12, 6); 
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 0;
                ctx.fillRect(-5, -2, 3, 4); 
                ctx.fillStyle = p.color;
                ctx.fillRect(0, -2, 2, 4);  
                ctx.fillRect(3, -2, 2, 4);  
            } else if (edgeType === 'air') {
                // Minimalist Plane
                ctx.beginPath();
                ctx.moveTo(4, 0);
                ctx.lineTo(-4, -4);
                ctx.lineTo(-4, 4);
                ctx.fill();
            } else {
                // Minimalist Truck
                ctx.fillRect(4, -2, 4, 4);  
                ctx.fillRect(-2, -2.5, 5, 5); 
                ctx.fillRect(-8, -2.5, 5, 5); 
            }
            
            ctx.restore();
        }

        // Draw nodes - Simplified colors
        nodes.forEach(n => {
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.8)'; // Universal grey border
            ctx.lineWidth = 1.5;
            
            if (n.type === 'supplier') {
                ctx.fillStyle = n.supplierColor;
                ctx.globalAlpha = 0.3; // Faint color fill
                drawHexagon(n.x, n.y, n.radius);
                ctx.fill(); 
                ctx.globalAlpha = 1.0;
                ctx.stroke();
            } else if (n.type === 'warehouse') {
                ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
                drawTriangle(n.x, n.y, n.radius);
                ctx.fill(); ctx.stroke();
            } else if (n.type === 'factory') {
                ctx.fillStyle = n.factoryColor;
                ctx.globalAlpha = 0.3; // Faint color fill
                drawSquare(n.x, n.y, n.radius);
                ctx.fill(); 
                ctx.globalAlpha = 1.0;
                ctx.stroke();
            } else {
                ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.radius, 0, Math.PI*2);
                ctx.fill(); ctx.stroke();
                
                if (n.type === 'consumer' && n.demands.length > 0) {
                    ctx.font = 'bold 16px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = n.demands[0]; // Actual text is the color
                    ctx.fillText('!', n.x, n.y - 14);
                }
            }
        });

        requestAnimationFrame(animate);
    }

    animate();
})();
