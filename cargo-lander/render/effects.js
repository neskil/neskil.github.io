Object.assign(CargoGame.prototype, {
drawParticles() {
        const particles = this.physics.particles;
        if (!particles.length) return;
        const ctx = this.ctx;
        for (const p of particles) {
            ctx.globalAlpha = p.life;
            if (p.type === 'spark') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = Math.max(1, p.size * 0.8);
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                // Stretch spark along its velocity vector relative to the lander/camera
                const lander = this.physics.lander;
                const lvx = (lander && !lander.crashed) ? lander.vx : 0;
                const lvy = (lander && !lander.crashed) ? lander.vy : 0;
                const dx = p.vx - lvx;
                const dy = p.vy - lvy;
                ctx.lineTo(p.x - dx * 2.2, p.y - dy * 2.2);
                ctx.stroke();
            } else if (p.type === 'ring') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = Math.max(1, p.size * 0.15);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.stroke();
            } else if (p.type === 'smoke') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                // Draw a chunky octagon for retro smoke
                const s = p.size;
                ctx.moveTo(p.x - s, p.y - s * 0.4);
                ctx.lineTo(p.x - s * 0.4, p.y - s);
                ctx.lineTo(p.x + s * 0.4, p.y - s);
                ctx.lineTo(p.x + s, p.y - s * 0.4);
                ctx.lineTo(p.x + s, p.y + s * 0.4);
                ctx.lineTo(p.x + s * 0.4, p.y + s);
                ctx.lineTo(p.x - s * 0.4, p.y + s);
                ctx.lineTo(p.x - s, p.y + s * 0.4);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1.0;
        ctx.lineCap = 'butt';
    }

});
