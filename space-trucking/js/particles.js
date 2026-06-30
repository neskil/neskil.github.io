// particles.js
// High-performance particle system using a fixed-size ring buffer pool.

const Particles = {
    maxParticles: 200,
    pool: [],
    index: 0,
    
    init: function() {
        this.pool = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.pool.push({
                active: false,
                x: 0, y: 0,
                vx: 0, vy: 0,
                color: '#fff',
                size: 5,
                life: 0,
                maxLife: 100,
                gravity: true
            });
        }
        this.index = 0;
    },
    
    spawn: function(x, y, vx, vy, color, size, maxLife, gravity = true) {
        const p = this.pool[this.index];
        p.active = true;
        p.x = x;
        p.y = y;
        p.vx = vx;
        p.vy = vy;
        p.color = color;
        p.size = size;
        p.life = maxLife;
        p.maxLife = maxLife;
        p.gravity = gravity;
        
        this.index = (this.index + 1) % this.maxParticles;
    },
    
    update: function() {
        for (let i = 0; i < this.maxParticles; i++) {
            const p = this.pool[i];
            if (p.active) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.gravity) {
                    p.vy += 0.02; // Soft gravity for falling sparks
                }
                p.life--;
                if (p.life <= 0) {
                    p.active = false;
                }
            }
        }
    }
};
// Initialize on load
Particles.init();
