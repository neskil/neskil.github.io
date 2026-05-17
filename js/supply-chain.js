(function() {
    const canvas = document.getElementById('supplyChainCanvas');
    if (!canvas) return; // Only run if canvas exists
    const ctx = canvas.getContext('2d');

    // Default configuration (can be overridden by window.SupplyChainConfig)
    const config = window.SupplyChainConfig || {
        density: 25000,
        speedMultiplier: 1.0,
        demandFrequency: 0.02
    };

    let width, height;
    let nodes = [];
    let lines = [];
    let packages = [];
    let signals = [];

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

    // 1. Generate Nodes
    function generateNetwork() {
        nodes = [];
        lines = [];
        packages = [];
        signals = [];
        
        const numNodes = Math.floor((width * height) / config.density); 
        
        for(let i=0; i<numNodes; i++) {
            let type = 'normal';
            let radius = 2;
            
            const r = Math.random();
            if (r < 0.10) { type = 'supplier'; radius = 5; } // Hexagon
            else if (r < 0.25) { type = 'warehouse'; radius = 6; } // Triangle
            else if (r < 0.40) { type = 'factory'; radius = 6; } // Square
            else if (r < 0.50) { type = 'consumer'; radius = 7; } // Big Circle
            
            nodes.push({ 
                id: i,
                type, 
                x: Math.random() * width, 
                y: Math.random() * height, 
                radius,
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
                        lines.push({ n1: node, n2: neighbor });
                    }
                }
            }
        });
    }

    // BFS Pathfinding
    function findPath(startNode, targetType) {
        let queue = [[startNode]];
        let visited = new Set([startNode]);
        
        while(queue.length > 0) {
            let path = queue.shift();
            let current = path[path.length - 1];
            
            if (current.type === targetType && current !== startNode) {
                return path;
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

    // Expose a method to re-init network from UI
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
        ctx.lineWidth = 1;
        lines.forEach(l => {
            const dist = Math.hypot(l.n1.x - l.n2.x, l.n1.y - l.n2.y);
            const opacity = Math.max(0, 1 - dist / 300) * 0.15;
            ctx.strokeStyle = `rgba(148, 163, 184, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(l.n1.x, l.n1.y);
            ctx.lineTo(l.n2.x, l.n2.y);
            ctx.stroke();
        });

        // Generate Demand (Pull System)
        if (Math.random() < config.demandFrequency && packages.length < 80) {
            const consumers = nodes.filter(n => n.type === 'consumer');
            if (consumers.length > 0) {
                const consumer = consumers[Math.floor(Math.random() * consumers.length)];
                // Consumer demands a random mixed color
                const demandedColor = MIX_COLORS[Math.floor(Math.random() * MIX_COLORS.length)];
                
                // Find a factory to fulfill this
                const path = findPath(consumer, 'factory');
                if (path && path.length > 1) {
                    consumer.demands.push(demandedColor);
                    
                    // Send a fast signal to the factory
                    signals.push({
                        path: path,
                        pathIndex: 0,
                        progress: 0,
                        speed: (Math.random() * 0.015 + 0.01) * config.speedMultiplier, // Signals are very fast
                        color: demandedColor,
                        payload: {
                            type: 'demand_finished',
                            targetConsumer: consumer,
                            color: demandedColor
                        }
                    });
                }
            }
        }

        // Process Signals
        for (let i = signals.length - 1; i >= 0; i--) {
            let s = signals[i];
            s.progress += s.speed;
            
            let startNode = s.path[s.pathIndex];
            let endNode = s.path[s.pathIndex + 1];
            
            if (s.progress >= 1) {
                s.pathIndex++;
                s.progress = 0;
                
                if (s.pathIndex >= s.path.length - 1) {
                    // Signal Reached Destination
                    let finalNode = s.path[s.path.length - 1];
                    
                    if (s.payload.type === 'demand_finished' && finalNode.type === 'factory') {
                        // Factory receives demand. It needs raw materials.
                        let bom = getBOM(s.payload.color);
                        
                        // Factory requests raw materials from suppliers
                        bom.forEach(rawColor => {
                            let pathToSupplier = findPath(finalNode, 'supplier');
                            if (pathToSupplier && pathToSupplier.length > 1) {
                                signals.push({
                                    path: pathToSupplier,
                                    pathIndex: 0,
                                    progress: 0,
                                    speed: (Math.random() * 0.015 + 0.01) * config.speedMultiplier,
                                    color: rawColor,
                                    payload: {
                                        type: 'demand_raw',
                                        targetFactory: finalNode,
                                        targetConsumer: s.payload.targetConsumer,
                                        finalMixColor: s.payload.color,
                                        color: rawColor
                                    }
                                });
                            }
                        });
                    } else if (s.payload.type === 'demand_raw' && finalNode.type === 'supplier') {
                        // Supplier receives demand. It dispatches the raw material package.
                        let returnPath = findPathToSpecificNode(finalNode, s.payload.targetFactory);
                        if (returnPath) {
                            packages.push({
                                path: returnPath,
                                pathIndex: 0,
                                progress: 0,
                                speed: (Math.random() * 0.005 + 0.003) * config.speedMultiplier,
                                color: s.payload.color,
                                payload: s.payload // Pass payload forward so factory knows what to do
                            });
                        }
                    }
                    signals.splice(i, 1);
                    continue;
                }
                startNode = s.path[s.pathIndex];
                endNode = s.path[s.pathIndex + 1];
            }
            
            // Draw Signal (Faint fast dashed pulse)
            const curX = startNode.x + (endNode.x - startNode.x) * s.progress;
            const curY = startNode.y + (endNode.y - startNode.y) * s.progress;
            
            ctx.beginPath();
            ctx.fillStyle = s.color;
            ctx.globalAlpha = 0.6;
            ctx.arc(curX, curY, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
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
                        // Remove demand ! indicator
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
            
            const tailLength = p.speed * 12;
            const prevProg = Math.max(0, p.progress - tailLength);
            const tailX = startNode.x + (endNode.x - startNode.x) * prevProg;
            const tailY = startNode.y + (endNode.y - startNode.y) * prevProg;
            
            ctx.beginPath();
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 12;
            ctx.shadowColor = p.color;
            ctx.lineCap = 'round';
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(curX, curY);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Draw nodes
        nodes.forEach(n => {
            ctx.lineWidth = 1.5;
            if (n.type === 'supplier') {
                ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.8)';
                drawHexagon(n.x, n.y, n.radius);
                ctx.fill(); ctx.stroke();
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
                ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
                ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
                drawSquare(n.x, n.y, n.radius);
                ctx.fill(); ctx.stroke();
                
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
                    ctx.shadowBlur = 4;
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
