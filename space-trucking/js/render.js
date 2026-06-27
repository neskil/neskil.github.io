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

    drawLander: function(ctx, landerBody, thrustersActive) {
        if (!landerBody) return;
        
        const pos = landerBody.position;
        const angle = landerBody.angle;
        
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);
        
        // Draw hull
        ctx.fillStyle = '#ccc';
        ctx.fillRect(-20, -15, 40, 30);
        
        // Draw cockpit window
        ctx.fillStyle = '#add8e6';
        ctx.beginPath();
        ctx.arc(10, -5, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw landing gear
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-15, 15); ctx.lineTo(-20, 25);
        ctx.moveTo(15, 15); ctx.lineTo(20, 25);
        ctx.stroke();

        // Draw thruster flames
        if (thrustersActive.main) {
            ctx.fillStyle = '#ff9900';
            ctx.beginPath();
            ctx.moveTo(-10, 15);
            ctx.lineTo(10, 15);
            ctx.lineTo(0, 15 + Math.random() * 20 + 10);
            ctx.fill();
        }
        if (thrustersActive.left) {
            ctx.fillStyle = '#ff9900';
            ctx.beginPath();
            ctx.moveTo(-20, 5);
            ctx.lineTo(-20, -5);
            ctx.lineTo(-20 - (Math.random() * 15 + 5), 0);
            ctx.fill();
        }
        if (thrustersActive.right) {
            ctx.fillStyle = '#ff9900';
            ctx.beginPath();
            ctx.moveTo(20, 5);
            ctx.lineTo(20, -5);
            ctx.lineTo(20 + (Math.random() * 15 + 5), 0);
            ctx.fill();
        }

        ctx.restore();
    },

    drawBoxes: function(ctx, boxes) {
        ctx.fillStyle = '#cd853f'; // Box color
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 2;

        for (const box of boxes) {
            const pos = box.position;
            const angle = box.angle;
            
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate(angle);
            ctx.fillRect(-10, -10, 20, 20);
            ctx.strokeRect(-10, -10, 20, 20);
            
            // Draw cross on box
            ctx.beginPath();
            ctx.moveTo(-10, -10); ctx.lineTo(10, 10);
            ctx.moveTo(10, -10); ctx.lineTo(-10, 10);
            ctx.stroke();
            
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
