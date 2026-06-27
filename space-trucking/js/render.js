// render.js
// Pure functions for drawing the game state.
// No state mutations here.

const Render = {
    drawTerrain: function(ctx, terrainBodies) {
        ctx.fillStyle = '#4a3f35'; // Dark rocky brown
        ctx.strokeStyle = '#2a1f15';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        for (const body of terrainBodies) {
            const parts = body.parts.length > 1 ? body.parts.slice(1) : [body];
            for (const part of parts) {
                const verts = part.vertices;
                if (verts.length === 0) continue;
                ctx.moveTo(verts[0].x, verts[0].y);
                for (let i = 1; i < verts.length; i++) {
                    ctx.lineTo(verts[i].x, verts[i].y);
                }
                ctx.lineTo(verts[0].x, verts[0].y);
            }
        }
        ctx.fill();
        ctx.stroke();
    },

    drawPads: function(ctx, pads) {
        for (const pad of pads) {
            let color = '#ccc';
            let label = '?';
            if (pad.type === 'start') { color = '#ff4444'; label = 'S'; }
            else if (pad.type === 'collection') { color = '#ffbb33'; label = 'C'; }
            else if (pad.type === 'hub_green') { color = '#00C851'; label = 'H'; }
            else if (pad.type === 'hub_blue') { color = '#33b5e5'; label = 'H'; }

            ctx.fillStyle = color;
            ctx.fillRect(pad.x - 30, pad.y - 10, 60, 20);
            
            ctx.fillStyle = '#fff';
            ctx.font = '12px Courier';
            ctx.textAlign = 'center';
            ctx.fillText(label, pad.x, pad.y + 4);
        }
    },

    drawHazards: function(ctx, hazards, assets) {
        for (const hazard of hazards) {
            // Draw Danger Zone
            ctx.fillStyle = `rgba(255, 0, 0, ${0.1 + hazard.dangerLevel * 0.2})`;
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, 300, 0, Math.PI * 2);
            ctx.fill();

            // Draw Sandworm if lunging
            if (hazard.wormBody) {
                const pos = hazard.wormBody.position;
                if (assets && assets.sandworm) {
                    ctx.save();
                    ctx.translate(pos.x, pos.y);
                    // The physics body is 80x400.
                    // Image scaling:
                    const dw = 120;
                    const dh = 420;
                    ctx.drawImage(assets.sandworm, -dw/2, -dh/2 - 50, dw, dh);
                    ctx.restore();
                } else {
                    ctx.fillStyle = '#8b4513';
                    ctx.fillRect(pos.x - 40, pos.y - 200, 80, 400);
                }
            }
        }
    },

    drawLander: function(ctx, landerBody, thrustersActive, assets) {
        if (!landerBody) return;
        
        const pos = landerBody.position;
        const angle = landerBody.angle;
        
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);
        
        const ox = 0; 
        const oy = 5;

        if (assets && assets.lander) {
            // Draw generated sprite
            // Assuming the sprite needs some offset to match the basket body
            const dw = 120; // Scale image to fit physics bounds
            const dh = 80;
            ctx.drawImage(assets.lander, -dw/2 + ox, -dh/2 + oy + 10, dw, dh);
        } else {
            // Draw back wall (engine block)
            ctx.fillStyle = '#ff9900'; // Orange tanks
            ctx.fillRect(-30 + ox, -25 + oy, 12, 35);
            ctx.fillStyle = '#555';
            ctx.fillRect(-35 + ox, -5 + oy, 5, 10); // exhaust port
            
            // Draw bed bottom
            ctx.fillStyle = '#888';
            ctx.fillRect(-20 + ox, 0 + oy, 40, 10);
            
            // Draw cabin
            ctx.fillStyle = '#ccc';
            ctx.beginPath();
            ctx.moveTo(20 + ox, 10 + oy);
            ctx.lineTo(40 + ox, 10 + oy);
            ctx.lineTo(35 + ox, -15 + oy);
            ctx.lineTo(20 + ox, -20 + oy);
            ctx.fill();

            // Draw cockpit window
            ctx.fillStyle = '#add8e6';
            ctx.beginPath();
            ctx.moveTo(22 + ox, -15 + oy);
            ctx.lineTo(32 + ox, -12 + oy);
            ctx.lineTo(35 + ox, 0 + oy);
            ctx.lineTo(22 + ox, 0 + oy);
            ctx.fill();
            
            // Draw landing gear
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-20 + ox, 10 + oy); ctx.lineTo(-25 + ox, 20 + oy);
            ctx.moveTo(30 + ox, 10 + oy); ctx.lineTo(35 + ox, 20 + oy);
            ctx.stroke();
        }

        // Draw thruster flames
        if (thrustersActive.main) {
            ctx.fillStyle = '#00ffff'; // Blueish plasma flame
            ctx.beginPath();
            ctx.moveTo(-15 + ox, 10 + oy);
            ctx.lineTo(30 + ox, 10 + oy);
            ctx.lineTo(10 + ox, 15 + Math.random() * 20 + oy);
            ctx.fill();
        }
        if (thrustersActive.left) { // Rotate left (fire right thruster)
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.moveTo(35 + ox, 15 + oy);
            ctx.lineTo(35 + ox, 5 + oy);
            ctx.lineTo(35 + (Math.random() * 15 + 5) + ox, 10 + oy);
            ctx.fill();
        }
        if (thrustersActive.right) { // Rotate right (fire left thruster)
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.moveTo(-35 + ox, 5 + oy);
            ctx.lineTo(-35 + ox, -5 + oy);
            ctx.lineTo(-35 - (Math.random() * 15 + 5) + ox, 0 + oy);
            ctx.fill();
        }

        ctx.restore();
    },

    drawBoxes: function(ctx, boxes, assets) {
        for (const box of boxes) {
            const pos = box.position;
            const angle = box.angle;
            
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate(angle);
            
            if (assets && assets.cargo) {
                // Physics body is 20x20
                ctx.drawImage(assets.cargo, -15, -15, 30, 30);
            } else {
                ctx.fillStyle = '#cd853f'; // Box color
                ctx.strokeStyle = '#8b4513';
                ctx.lineWidth = 2;
                ctx.fillRect(-10, -10, 20, 20);
                ctx.strokeRect(-10, -10, 20, 20);
                ctx.beginPath();
                ctx.moveTo(-10, -10); ctx.lineTo(10, 10);
                ctx.moveTo(10, -10); ctx.lineTo(-10, 10);
                ctx.stroke();
            }
            
            ctx.restore();
        }
    },
    
    // Optional debug draw
    drawDebug: function(ctx, state) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        
        const drawBody = (b) => {
            ctx.beginPath();
            b.vertices.forEach((v, i) => {
                if(i===0) ctx.moveTo(v.x, v.y);
                else ctx.lineTo(v.x, v.y);
            });
            ctx.lineTo(b.vertices[0].x, b.vertices[0].y);
            ctx.stroke();
        };

        if(state.lander) drawBody(state.lander);
        state.terrain.forEach(drawBody);
        state.boxes.forEach(drawBody);
    }
};
