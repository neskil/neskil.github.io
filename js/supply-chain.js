(function() {
    const canvas = document.getElementById('supplyChainCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const config = window.SupplyChainConfig || {
        density: 22000, speedMultiplier: 1.0, demandFrequency: 0.005
    };

    let width, height, nodes = [], lines = [], packages = [], signals = [];
    let seaLeftEdge = [], seaRightEdge = []; // Sea polygon edges (or top/bottom on mobile)
    let isPortrait = false;

    function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize);
    resize();

    // Raw materials: desaturated, muted tones
    const COLOR_RAW_RED = '#c4a0a0', COLOR_RAW_BLUE = '#8fa8bf', COLOR_RAW_YELLOW = '#bfb87a';
    // Finished goods: vivid, saturated tones
    const COLOR_MIX_PURPLE = '#b07cd8', COLOR_MIX_GREEN = '#34d399', COLOR_MIX_ORANGE = '#f59e0b';
    const RAW_COLORS = [COLOR_RAW_RED, COLOR_RAW_BLUE, COLOR_RAW_YELLOW];
    const MIX_COLORS = [COLOR_MIX_PURPLE, COLOR_MIX_GREEN, COLOR_MIX_ORANGE];

    function getBOM(c) {
        if (c === COLOR_MIX_PURPLE) return [COLOR_RAW_RED, COLOR_RAW_BLUE];
        if (c === COLOR_MIX_GREEN) return [COLOR_RAW_YELLOW, COLOR_RAW_BLUE];
        if (c === COLOR_MIX_ORANGE) return [COLOR_RAW_RED, COLOR_RAW_YELLOW];
        return [COLOR_RAW_RED, COLOR_RAW_BLUE];
    }

    function linesCross(ax,ay,bx,by,cx,cy,dx,dy) {
        let s1x=bx-ax, s1y=by-ay, s2x=dx-cx, s2y=dy-cy;
        let d=(-s2x*s1y+s1x*s2y); if(d===0) return false;
        let s=(-s1y*(ax-cx)+s1x*(ay-cy))/d;
        let t=(s2x*(ay-cy)-s2y*(ax-cx))/d;
        return s>0.01&&s<0.99&&t>0.01&&t<0.99;
    }

    // Point-in-sea test: check if x is between left and right edge at given y
    function isInSea(x, y) {
        if (seaLeftEdge.length < 2) return false;
        if (isPortrait) {
            // Horizontal sea: interpolate along x-axis
            for (let i = 0; i < seaLeftEdge.length - 1; i++) {
                let x1 = seaLeftEdge[i].x, x2 = seaLeftEdge[i+1].x;
                if (x >= x1 && x <= x2) {
                    let t = (x - x1) / (x2 - x1);
                    let topY = seaLeftEdge[i].y + t * (seaLeftEdge[i+1].y - seaLeftEdge[i].y);
                    let botY = seaRightEdge[i].y + t * (seaRightEdge[i+1].y - seaRightEdge[i].y);
                    return y >= topY && y <= botY;
                }
            }
        } else {
            for (let i = 0; i < seaLeftEdge.length - 1; i++) {
                let ly1 = seaLeftEdge[i].y, ly2 = seaLeftEdge[i+1].y;
                if (y >= ly1 && y <= ly2) {
                    let t = (y - ly1) / (ly2 - ly1);
                    let lx = seaLeftEdge[i].x + t * (seaLeftEdge[i+1].x - seaLeftEdge[i].x);
                    let rx = seaRightEdge[i].x + t * (seaRightEdge[i+1].x - seaRightEdge[i].x);
                    return x >= lx && x <= rx;
                }
            }
        }
        return false;
    }

    function whichSide(x, y) {
        if (isPortrait) {
            // Horizontal sea: above=top, below=bottom
            for (let i = 0; i < seaLeftEdge.length - 1; i++) {
                let x1 = seaLeftEdge[i].x, x2 = seaLeftEdge[i+1].x;
                if (x >= x1 && x <= x2) {
                    let t = (x - x1) / (x2 - x1);
                    let topY = seaLeftEdge[i].y + t * (seaLeftEdge[i+1].y - seaLeftEdge[i].y);
                    let botY = seaRightEdge[i].y + t * (seaRightEdge[i+1].y - seaRightEdge[i].y);
                    let mid = (topY + botY) / 2;
                    return y < mid ? 'left' : 'right'; // 'left'=top, 'right'=bottom
                }
            }
            return y < height / 2 ? 'left' : 'right';
        }
        for (let i = 0; i < seaLeftEdge.length - 1; i++) {
            let ly1 = seaLeftEdge[i].y, ly2 = seaLeftEdge[i+1].y;
            if (y >= ly1 && y <= ly2) {
                let t = (y - ly1) / (ly2 - ly1);
                let lx = seaLeftEdge[i].x + t * (seaLeftEdge[i+1].x - seaLeftEdge[i].x);
                let rx = seaRightEdge[i].x + t * (seaRightEdge[i+1].x - seaRightEdge[i].x);
                let mid = (lx + rx) / 2;
                return x < mid ? 'left' : 'right';
            }
        }
        return x < width / 2 ? 'left' : 'right';
    }

    function generateNetwork() {
        nodes=[]; lines=[]; packages=[]; signals=[];
        seaLeftEdge=[]; seaRightEdge=[];

        const numNodes = Math.floor((width * height) / config.density);
        isPortrait = height > width * 1.2; // Detect portrait/mobile

        // 1. Generate meandering sea river polygon
        if (isPortrait) {
            // HORIZONTAL sea on portrait screens (splits top/bottom)
            let seaCenter = height * (0.35 + Math.random() * 0.3);
            let seaW = height * (0.06 + Math.random() * 0.04); // narrower on mobile
            let steps = 12;
            for (let i = 0; i <= steps; i++) {
                let x = (i / steps) * width;
                seaCenter += (Math.random() - 0.5) * height * 0.06;
                seaCenter = Math.max(height * 0.25, Math.min(height * 0.75, seaCenter));
                let halfW = seaW / 2 + (Math.random() - 0.5) * seaW * 0.3;
                seaLeftEdge.push({ x, y: seaCenter - halfW });  // top edge of sea
                seaRightEdge.push({ x, y: seaCenter + halfW }); // bottom edge of sea
            }
        } else {
            // VERTICAL sea on landscape screens (splits left/right)
            let seaCenter = width * (0.35 + Math.random() * 0.3);
            let seaW = width * (0.08 + Math.random() * 0.06);
            let steps = 12;
            for (let i = 0; i <= steps; i++) {
                let y = (i / steps) * height;
                seaCenter += (Math.random() - 0.5) * width * 0.08;
                seaCenter = Math.max(width * 0.2, Math.min(width * 0.8, seaCenter));
                let halfW = seaW / 2 + (Math.random() - 0.5) * seaW * 0.3;
                seaLeftEdge.push({ x: seaCenter - halfW, y });
                seaRightEdge.push({ x: seaCenter + halfW, y });
            }
        }

        // 2. Spawn nodes only on land
        let sCount = 0, fCount = 0;
        for (let i = 0; i < numNodes; i++) {
            let nx, ny, attempts = 0;
            do {
                nx = 30 + Math.random() * (width - 60);
                ny = 30 + Math.random() * (height - 60);
                attempts++;
            } while (isInSea(nx, ny) && attempts < 50);
            if (attempts >= 50) continue;

            let type = 'normal', radius = 2, supplierColor = null, factoryColor = null;
            // Vertical position bias: top=consumers, middle=factories, bottom=suppliers
            let yRatio = ny / height; // 0=top, 1=bottom
            let r = Math.random();
            if (yRatio < 0.35) {
                // Top third: mostly consumers
                if (r < 0.35) { type='consumer'; radius=7; }
                else if (r < 0.45) { type='factory'; radius=6; factoryColor=MIX_COLORS[fCount%3]; fCount++; }
            } else if (yRatio < 0.65) {
                // Middle third: mostly factories
                if (r < 0.30) { type='factory'; radius=6; factoryColor=MIX_COLORS[fCount%3]; fCount++; }
                else if (r < 0.45) { type='consumer'; radius=7; }
                else if (r < 0.55) { type='supplier'; radius=5; supplierColor=RAW_COLORS[sCount%3]; sCount++; }
            } else {
                // Bottom third: mostly suppliers
                if (r < 0.35) { type='supplier'; radius=5; supplierColor=RAW_COLORS[sCount%3]; sCount++; }
                else if (r < 0.45) { type='factory'; radius=6; factoryColor=MIX_COLORS[fCount%3]; fCount++; }
            }

            nodes.push({
                id: i, type, x: nx, y: ny, radius,
                supplierColor, factoryColor, side: whichSide(nx, ny),
                edges: [], inventory: [], demands: [], isPort: false
            });
        }

        // 3. Build MST per side (non-overlapping tree)
        ['left', 'right'].forEach(side => {
            let sNodes = nodes.filter(n => n.side === side);
            if (sNodes.length < 2) return;

            let connected = [sNodes[0]], unconnected = sNodes.slice(1);
            while (unconnected.length > 0) {
                let bestD = Infinity, bestA = null, bestB = null, bestIdx = -1;
                for (let a of connected) {
                    for (let i = 0; i < unconnected.length; i++) {
                        let b = unconnected[i];
                        let d = Math.hypot(a.x - b.x, a.y - b.y);
                        if (d < bestD) { bestD=d; bestA=a; bestB=b; bestIdx=i; }
                    }
                }
                bestA.edges.push(bestB); bestB.edges.push(bestA);
                lines.push({ n1: bestA, n2: bestB, type: 'land', glow: 0, glowColor: null });
                connected.push(bestB); unconnected.splice(bestIdx, 1);
            }

            // Sparse extra loops (~15%)
            sNodes.forEach(n1 => {
                if (Math.random() < 0.15) {
                    let sorted = sNodes.map(n=>({n,d:Math.hypot(n1.x-n.x,n1.y-n.y)})).sort((a,b)=>a.d-b.d);
                    for (let k = 1; k < Math.min(5, sorted.length); k++) {
                        let n2 = sorted[k].n;
                        if (!n1.edges.includes(n2)) {
                            let crosses = lines.some(l => linesCross(n1.x,n1.y,n2.x,n2.y,l.n1.x,l.n1.y,l.n2.x,l.n2.y));
                            if (!crosses) {
                                n1.edges.push(n2); n2.edges.push(n1);
                                lines.push({ n1, n2, type: 'land', glow: 0, glowColor: null });
                                break;
                            }
                        }
                    }
                }
            });
        });

        // 4. Sea connections: slice screen into bands
        let topSideNodes = nodes.filter(n => n.side === 'left');  // top on portrait, left on landscape
        let botSideNodes = nodes.filter(n => n.side === 'right'); // bottom on portrait, right on landscape
        let numSlices = isPortrait ? 3 : 5;

        for (let slice = 0; slice < numSlices; slice++) {
            let lCandidates, rCandidates, sliceMid;

            if (isPortrait) {
                // Vertical slices on portrait
                let xMin = (slice / numSlices) * width;
                let xMax = ((slice + 1) / numSlices) * width;
                sliceMid = (xMin + xMax) / 2;
                lCandidates = topSideNodes.filter(n => n.x >= xMin && n.x < xMax);
                rCandidates = botSideNodes.filter(n => n.x >= xMin && n.x < xMax);
            } else {
                // Horizontal slices on landscape
                let yMin = (slice / numSlices) * height;
                let yMax = ((slice + 1) / numSlices) * height;
                sliceMid = (yMin + yMax) / 2;
                lCandidates = topSideNodes.filter(n => n.y >= yMin && n.y < yMax);
                rCandidates = botSideNodes.filter(n => n.y >= yMin && n.y < yMax);
            }
            if (lCandidates.length === 0 || rCandidates.length === 0) continue;

            // Find closest pair across the sea
            let bestD = Infinity, bestL = null, bestR = null;
            for (let l of lCandidates) {
                for (let r of rCandidates) {
                    let d = Math.hypot(l.x - r.x, l.y - r.y);
                    if (d < bestD) { bestD=d; bestL=l; bestR=r; }
                }
            }

            if (bestL && bestR && !bestL.edges.includes(bestR)) {
                // Move port nodes close to sea edge
                let margin1 = 20 + Math.random() * 40;
                let margin2 = 20 + Math.random() * 40;
                let jitter = (Math.random() - 0.5) * 30;

                if (isPortrait) {
                    for (let si = 0; si < seaLeftEdge.length - 1; si++) {
                        if (sliceMid >= seaLeftEdge[si].x && sliceMid <= seaLeftEdge[si+1].x) {
                            let t = (sliceMid - seaLeftEdge[si].x) / (seaLeftEdge[si+1].x - seaLeftEdge[si].x);
                            let topEdge = seaLeftEdge[si].y + t * (seaLeftEdge[si+1].y - seaLeftEdge[si].y);
                            let botEdge = seaRightEdge[si].y + t * (seaRightEdge[si+1].y - seaRightEdge[si].y);
                            bestL.y = topEdge - margin1;
                            bestL.x = sliceMid + jitter;
                            bestR.y = botEdge + margin2;
                            bestR.x = sliceMid + jitter;
                            break;
                        }
                    }
                } else {
                    for (let si = 0; si < seaLeftEdge.length - 1; si++) {
                        if (sliceMid >= seaLeftEdge[si].y && sliceMid <= seaLeftEdge[si+1].y) {
                            let t = (sliceMid - seaLeftEdge[si].y) / (seaLeftEdge[si+1].y - seaLeftEdge[si].y);
                            let lEdge = seaLeftEdge[si].x + t * (seaLeftEdge[si+1].x - seaLeftEdge[si].x);
                            let rEdge = seaRightEdge[si].x + t * (seaRightEdge[si+1].x - seaRightEdge[si].x);
                            bestL.x = lEdge - margin1;
                            bestL.y = sliceMid + jitter;
                            bestR.x = rEdge + margin2;
                            bestR.y = sliceMid + jitter;
                            break;
                        }
                    }
                }
                bestL.edges.push(bestR); bestR.edges.push(bestL);
                lines.push({ n1: bestL, n2: bestR, type: 'sea', glow: 0, glowColor: null });
                bestL.isPort = true; bestL.type = 'warehouse'; bestL.radius = 6;
                bestR.isPort = true; bestR.type = 'warehouse'; bestR.radius = 6;
            }
        }
    }

    // BFS Pathfinding
    function findPath(start, targetType, targetColor) {
        let queue = [[start]], visited = new Set([start]);
        while (queue.length > 0) {
            let path = queue.shift(), cur = path[path.length-1];
            if (cur.type === targetType && cur !== start) {
                if (targetType==='factory' && cur.factoryColor===targetColor) return path;
                if (targetType==='supplier' && cur.supplierColor===targetColor) return path;
                if (!targetColor) return path;
            }
            let edges = [...cur.edges].sort(()=>Math.random()-0.5);
            for (let nb of edges) {
                if (!visited.has(nb)) { visited.add(nb); queue.push([...path, nb]); }
            }
        }
        return null;
    }

    function findPathTo(start, end) {
        let queue = [[start]], visited = new Set([start]);
        while (queue.length > 0) {
            let path = queue.shift(), cur = path[path.length-1];
            if (cur === end) return path;
            for (let nb of cur.edges) {
                if (!visited.has(nb)) { visited.add(nb); queue.push([...path, nb]); }
            }
        }
        return null;
    }

    // Shapes
    function drawHexagon(x,y,r) {
        ctx.beginPath();
        for(let i=0;i<6;i++){let a=i*Math.PI/3; i===0?ctx.moveTo(x+r*Math.cos(a),y+r*Math.sin(a)):ctx.lineTo(x+r*Math.cos(a),y+r*Math.sin(a));}
        ctx.closePath();
    }
    function drawTriangle(x,y,r) { ctx.beginPath(); ctx.moveTo(x-r,y-r*0.5); ctx.lineTo(x+r,y-r*0.5); ctx.lineTo(x,y+r); ctx.closePath(); }
    function drawSquare(x,y,r) { ctx.beginPath(); ctx.rect(x-r,y-r,r*2,r*2); ctx.closePath(); }

    window.reinitSupplyChain = function(nc) {
        if(nc.density) config.density=nc.density;
        if(nc.speedMultiplier) config.speedMultiplier=nc.speedMultiplier;
        if(nc.demandFrequency) config.demandFrequency=nc.demandFrequency;
        generateNetwork();
    };

    generateNetwork();

    // Animation variables
    let seaTime = 0;
    let frameCount = 0;
    let scrollOffset = 0;
    let smoothScrollOffset = 0;
    window.addEventListener('scroll', () => { scrollOffset = window.scrollY; });

    function animate() {
        ctx.clearRect(0, 0, width, height);
        seaTime += 0.005 * config.speedMultiplier;

        // Smooth parallax from scroll inertia
        smoothScrollOffset += (scrollOffset - smoothScrollOffset) * 0.08;
        let parallaxY = -smoothScrollOffset * 0.15; // Subtle shift
        ctx.save();
        ctx.translate(0, parallaxY);

        // Draw Land polygons
        ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
        if (isPortrait) {
            // Top landmass
            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (let i = 0; i < seaLeftEdge.length; i++) ctx.lineTo(seaLeftEdge[i].x, seaLeftEdge[i].y);
            ctx.lineTo(width, 0); ctx.closePath(); ctx.fill();
            // Bottom landmass
            ctx.beginPath();
            ctx.moveTo(0, height);
            for (let i = 0; i < seaRightEdge.length; i++) ctx.lineTo(seaRightEdge[i].x, seaRightEdge[i].y);
            ctx.lineTo(width, height); ctx.closePath(); ctx.fill();
        } else {
            // Left landmass
            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (let i = 0; i < seaLeftEdge.length; i++) ctx.lineTo(seaLeftEdge[i].x, seaLeftEdge[i].y);
            ctx.lineTo(0, height); ctx.closePath(); ctx.fill();
            // Right landmass
            ctx.beginPath();
            ctx.moveTo(width, 0);
            for (let i = 0; i < seaRightEdge.length; i++) ctx.lineTo(seaRightEdge[i].x, seaRightEdge[i].y);
            ctx.lineTo(width, height); ctx.closePath(); ctx.fill();
        }

        // Draw subtle sea waves
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
        ctx.lineWidth = 1;
        for (let w = 0; w < 8; w++) {
            ctx.beginPath();
            for (let i = 0; i < seaLeftEdge.length; i++) {
                let t = i / (seaLeftEdge.length - 1);
                if (isPortrait) {
                    let ty = seaLeftEdge[i].y, by = seaRightEdge[i].y;
                    let y = ty + (by - ty) * ((w + 1) / 9) + Math.sin(seaTime * 3 + t * 8 + w) * 5;
                    let x = seaLeftEdge[i].x;
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                } else {
                    let lx = seaLeftEdge[i].x, rx = seaRightEdge[i].x;
                    let x = lx + (rx - lx) * ((w + 1) / 9) + Math.sin(seaTime * 3 + t * 8 + w) * 5;
                    let y = seaLeftEdge[i].y;
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }

        // Crawling signals
        for (let i = signals.length - 1; i >= 0; i--) {
            let s = signals[i];
            s.progress += s.speed;
            let sn = s.path[s.pathIndex], en = s.path[s.pathIndex + 1];
            let line = lines.find(l => (l.n1===sn&&l.n2===en)||(l.n1===en&&l.n2===sn));
            if (line) { line.glow = Math.max(line.glow||0, s.progress); line.glowColor = 'rgba(255,255,255,0.9)'; }

            if (s.progress >= 1) {
                if (line) line.glow = 1.0;
                s.pathIndex++; s.progress = 0;
                if (s.pathIndex >= s.path.length - 1) {
                    let fn = s.path[s.path.length-1];
                    if (s.payload&&s.payload.type==='demand_factory') {
                        getBOM(s.payload.finalMixColor).forEach(rc => {
                            let p2s = findPath(fn, 'supplier', rc);
                            if (p2s&&p2s.length>1) signals.push({path:p2s,pathIndex:0,progress:0,color:rc,speed:0.02*config.speedMultiplier,payload:{type:'demand_raw',targetFactory:fn,targetConsumer:s.payload.targetConsumer,finalMixColor:s.payload.finalMixColor,color:rc}});
                        });
                    } else if (s.payload&&s.payload.type==='demand_raw') {
                        packages.push({path:[...s.path].reverse(),pathIndex:0,progress:0,color:s.payload.color,payload:s.payload});
                    }
                    signals.splice(i, 1);
                }
            }
        }

        // Draw lines
        lines.forEach(l => {
            ctx.beginPath();
            ctx.setLineDash(l.type==='sea'?[8,12]:l.type==='air'?[2,6]:[]);
            if (l.glow&&l.glow>0) {
                ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.globalAlpha=Math.min(0.7, 0.2+l.glow*0.5);
                ctx.lineWidth=1+l.glow*0.8; ctx.shadowBlur=l.glow*3; ctx.shadowColor='rgba(255,255,255,0.3)';
                l.glow -= 0.003*config.speedMultiplier;
            } else {
                ctx.strokeStyle='rgba(148,163,184,0.3)'; ctx.globalAlpha=1; ctx.lineWidth=1; ctx.shadowBlur=0;
            }
            ctx.moveTo(l.n1.x,l.n1.y); ctx.lineTo(l.n2.x,l.n2.y); ctx.stroke();
            ctx.setLineDash([]); ctx.globalAlpha=1; ctx.shadowBlur=0;
        });

        // Generate demand (burst at start, then settle)
        frameCount++;
        let startupBoost = frameCount < 300 ? 8 : frameCount < 600 ? 3 : 1; // ~5s burst then ease
        if (Math.random()<config.demandFrequency*startupBoost&&packages.length<150) {
            let consumers=nodes.filter(n=>n.type==='consumer');
            if (consumers.length>0) {
                let consumer=consumers[Math.floor(Math.random()*consumers.length)];
                let dc=MIX_COLORS[Math.floor(Math.random()*MIX_COLORS.length)];
                let path=findPath(consumer,'factory',dc);
                if (path&&path.length>1) {
                    consumer.demands.push(dc);
                    signals.push({path,pathIndex:0,progress:0,color:dc,speed:0.02*config.speedMultiplier,payload:{type:'demand_factory',targetConsumer:consumer,finalMixColor:dc}});
                }
            }
        }

        // Process port/warehouse wait
        nodes.forEach(n => {
            if (n.isPort||n.type==='warehouse') {
                for(let i=n.inventory.length-1;i>=0;i--) {
                    n.inventory[i].waitFrames--;
                    if(n.inventory[i].waitFrames<=0){n.inventory[i].pkg.progress=0;packages.push(n.inventory[i].pkg);n.inventory.splice(i,1);}
                }
            }
        });

        // Packages - constant PIXEL speed regardless of edge length
        const PIXEL_SPEED = 1.5; // pixels per frame
        for(let i=packages.length-1;i>=0;i--) {
            let p=packages[i], sn=p.path[p.pathIndex], en=p.path[p.pathIndex+1];
            let cl=lines.find(l=>(l.n1===sn&&l.n2===en)||(l.n1===en&&l.n2===sn));
            let et=cl?cl.type:'land';
            let edgeLen = Math.hypot(en.x-sn.x, en.y-sn.y) || 1;
            let speedMult = et==='sea'?0.5:et==='air'?1.3:1;
            let spd = (PIXEL_SPEED * speedMult * config.speedMultiplier) / edgeLen;
            p.progress+=spd;

            if(p.progress>=1){
                p.pathIndex++; p.progress=0;
                if(p.pathIndex>=p.path.length-1){
                    let fn=p.path[p.path.length-1];
                    if(fn.type==='factory'&&p.payload&&p.payload.type==='demand_raw'){
                        fn.inventory.push(p);
                        let bom=getBOM(p.payload.finalMixColor);
                        let h1=fn.inventory.findIndex(it=>it.color===bom[0]);
                        let h2=h1!==-1?fn.inventory.findIndex((it,idx)=>it.color===bom[1]&&idx!==h1):-1;
                        if(h1!==-1&&h2!==-1){
                            fn.inventory.splice(Math.max(h1,h2),1); fn.inventory.splice(Math.min(h1,h2),1);
                            let rp=findPathTo(fn,p.payload.targetConsumer);
                            if(rp) packages.push({path:rp,pathIndex:0,progress:0,color:p.payload.finalMixColor,payload:{type:'fulfill_demand',color:p.payload.finalMixColor}});
                        }
                    } else if(fn.type==='consumer'){
                        let di=fn.demands.indexOf(p.color); if(di!==-1) fn.demands.splice(di,1);
                    }
                    packages.splice(i,1); continue;
                } else {
                    let cn=p.path[p.pathIndex];
                    if(cn.isPort||cn.type==='warehouse'){
                        cn.inventory.push({pkg:p,waitFrames:Math.floor((Math.random()*80+40)/config.speedMultiplier)});
                        packages.splice(i,1); continue;
                    }
                }
                sn=p.path[p.pathIndex]; en=p.path[p.pathIndex+1];
                cl=lines.find(l=>(l.n1===sn&&l.n2===en)||(l.n1===en&&l.n2===sn));
                et=cl?cl.type:'land';
            }

            let cx=sn.x+(en.x-sn.x)*p.progress, cy=sn.y+(en.y-sn.y)*p.progress;
            let angle=Math.atan2(en.y-sn.y,en.x-sn.x);
            ctx.save(); ctx.translate(cx,cy); ctx.rotate(angle);
            ctx.fillStyle=p.color; ctx.shadowBlur=6; ctx.shadowColor=p.color;
            if(et==='sea'){
                // Larger cargo ship only on sea crossings
                ctx.fillRect(-9,-4,18,8); // Wide hull
                ctx.fillStyle='#fff'; ctx.shadowBlur=0;
                ctx.fillRect(-7,-3,4,6); // Bridge
                ctx.fillStyle=p.color;
                ctx.fillRect(-1,-3,3,6); // Cargo 1
                ctx.fillRect(4,-3,3,6);  // Cargo 2
            } else if(et==='air'){
                ctx.beginPath(); ctx.moveTo(5,0); ctx.lineTo(-5,-5); ctx.lineTo(-5,5); ctx.fill();
            } else {
                // Truck on land
                ctx.fillRect(4,-2,4,4); ctx.fillRect(-2,-2.5,5,5); ctx.fillRect(-8,-2.5,5,5);
            }
            ctx.restore();
        }

        // Draw nodes
        nodes.forEach(n => {
            ctx.strokeStyle='rgba(148,163,184,0.8)'; ctx.lineWidth=1.5;
            if(n.isPort){ctx.beginPath();ctx.strokeStyle='rgba(56,189,248,0.5)';ctx.lineWidth=1;ctx.arc(n.x,n.y,n.radius+4,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='rgba(148,163,184,0.8)';ctx.lineWidth=1.5;}
            if(n.type==='supplier'){ctx.fillStyle=n.supplierColor;ctx.globalAlpha=0.3;drawHexagon(n.x,n.y,n.radius);ctx.fill();ctx.globalAlpha=1;ctx.stroke();}
            else if(n.type==='warehouse'){ctx.fillStyle='rgba(148,163,184,0.2)';drawTriangle(n.x,n.y,n.radius);ctx.fill();ctx.stroke();}
            else if(n.type==='factory'){ctx.fillStyle=n.factoryColor;ctx.globalAlpha=0.3;drawSquare(n.x,n.y,n.radius);ctx.fill();ctx.globalAlpha=1;ctx.stroke();}
            else{ctx.fillStyle='rgba(148,163,184,0.2)';ctx.beginPath();ctx.arc(n.x,n.y,n.radius,0,Math.PI*2);ctx.fill();ctx.stroke();
                if(n.type==='consumer'&&n.demands.length>0){ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=n.demands[0];ctx.fillText('!',n.x,n.y-14);}
            }
        });

        requestAnimationFrame(animate);
    }
    animate();
})();
