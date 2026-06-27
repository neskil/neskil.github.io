// level-loader.js
// Responsible for loading a PNG and extracting terrain geometry and entities

const LevelLoader = {
    // 1 image pixel = 10 game pixels (adjustable)
    SCALE: 10,
    
    // Helper to load image
    loadImage: function(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    },

    // Convert an image into game data
    loadFromImage: async function(url) {
        const img = await this.loadImage(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        
        return this.parseLevelData(imgData, img.width, img.height);
    },

    parseLevelData: function(imgData, width, height) {
        const data = imgData.data;
        const getPixel = (x, y) => {
            if (x < 0 || x >= width || y < 0 || y >= height) return [0,0,0,0];
            const i = (y * width + x) * 4;
            return [data[i], data[i+1], data[i+2], data[i+3]];
        };

        const isTerrain = (r, g, b, a) => {
            // Dark pixels are terrain (e.g., black or dark gray)
            return a > 128 && r < 50 && g < 50 && b < 50;
        };

        const terrainPixels = [];
        const pads = [];

        // Scan pixels
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const [r, g, b, a] = getPixel(x, y);
                if (a < 128) continue; // transparent

                if (isTerrain(r, g, b, a)) {
                    terrainPixels.push({x, y});
                } else if (r > 200 && g < 100 && b < 100) {
                    // Red pad (Start Depot)
                    pads.push({ type: 'start', x: x * this.SCALE, y: y * this.SCALE });
                } else if (r > 200 && g > 200 && b < 100) {
                    // Yellow pad (Collection Terminal)
                    pads.push({ type: 'collection', x: x * this.SCALE, y: y * this.SCALE });
                } else if (r < 100 && g > 150 && b < 150) {
                    // Green pad (Delivery Hub)
                    pads.push({ type: 'hub_green', x: x * this.SCALE, y: y * this.SCALE });
                } else if (r < 100 && g < 150 && b > 200) {
                    // Blue pad (Delivery Hub)
                    pads.push({ type: 'hub_blue', x: x * this.SCALE, y: y * this.SCALE });
                } else if (r > 200 && g < 100 && b > 200) {
                    // Magenta pad (Hazard/Sandworm)
                    pads.push({ type: 'hazard', x: x * this.SCALE, y: y * this.SCALE });
                }
            }
        }

        // Trace contour for terrain using a simple boundary tracing algorithm
        // We'll extract a single contiguous polygon for now.
        const vertices = this.traceContour(width, height, getPixel, isTerrain);
        
        // Scale vertices and simplify
        let scaledVertices = vertices.map(v => ({ x: v.x * this.SCALE, y: v.y * this.SCALE }));
        scaledVertices = this.simplify(scaledVertices, 2 * this.SCALE); 

        return {
            terrainVertices: scaledVertices,
            pads: pads,
            width: width * this.SCALE,
            height: height * this.SCALE
        };
    },

    // Moore neighborhood boundary tracing
    traceContour: function(width, height, getPixel, isTerrain) {
        // Find starting pixel (first terrain pixel scanning top-left to bottom-right)
        let startX = -1, startY = -1;
        outer: for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const [r,g,b,a] = getPixel(x, y);
                if (isTerrain(r,g,b,a)) {
                    startX = x; startY = y; break outer;
                }
            }
        }
        
        if (startX === -1) return []; // no terrain found

        const vertices = [];
        let currX = startX, currY = startY;
        let prevX = startX - 1, prevY = startY;
        
        // 8-directional neighbors (clockwise)
        const dirs = [
            {dx:-1,dy:0}, {dx:-1,dy:-1}, {dx:0,dy:-1}, {dx:1,dy:-1},
            {dx:1,dy:0}, {dx:1,dy:1}, {dx:0,dy:1}, {dx:-1,dy:1}
        ];

        // A basic boundary follower
        let attempts = 0;
        let p = {x: currX, y: currY};
        let b = {x: prevX, y: prevY};
        
        do {
            vertices.push({x: p.x, y: p.y});
            
            // Find direction from p to b
            let dirIndex = dirs.findIndex(d => d.dx === (b.x - p.x) && d.dy === (b.y - p.y));
            if (dirIndex === -1) dirIndex = 0;

            let nextP = null;
            let nextB = null;

            // Check neighbors clockwise from b
            for(let i = 1; i <= 8; i++) {
                const checkIdx = (dirIndex + i) % 8;
                const checkX = p.x + dirs[checkIdx].dx;
                const checkY = p.y + dirs[checkIdx].dy;
                const [r,g,bl,a] = getPixel(checkX, checkY);
                if (isTerrain(r,g,bl,a)) {
                    nextP = {x: checkX, y: checkY};
                    // The pixel right before the one we found is the new 'backtrack' pixel
                    const backIdx = (dirIndex + i - 1) % 8;
                    nextB = {x: p.x + dirs[backIdx].dx, y: p.y + dirs[backIdx].dy};
                    break;
                }
            }

            if (!nextP) break; // Isolated pixel
            
            p = nextP;
            b = nextB;
            
            attempts++;
            if (attempts > 10000) break; // infinite loop failsafe
        } while (p.x !== startX || p.y !== startY);

        return vertices;
    },

    // Simple Douglas-Peucker or distance-based simplification to avoid overwhelming Matter.js
    simplify: function(vertices, tolerance) {
        if (vertices.length <= 2) return vertices;
        const simplified = [vertices[0]];
        let lastKept = vertices[0];
        
        for (let i = 1; i < vertices.length - 1; i++) {
            const pt = vertices[i];
            const dist = Math.hypot(pt.x - lastKept.x, pt.y - lastKept.y);
            if (dist > tolerance) {
                simplified.push(pt);
                lastKept = pt;
            }
        }
        simplified.push(vertices[vertices.length-1]);
        return simplified;
    }
};
