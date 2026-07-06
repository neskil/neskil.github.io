Object.assign(CargoGame.prototype, {
drawParticles() {
        const particles = this.physics.particles;
        if (!particles.length) return;
        const ctx = this.ctx;
        // Batch by color to minimise fillStyle state changes
        const byColor = {};
        for (const p of particles) {
            (byColor[p.color] || (byColor[p.color] = [])).push(p);
        }
        for (const color in byColor) {
            ctx.fillStyle = color;
            for (const p of byColor[color]) {
                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1.0;
    }

});
