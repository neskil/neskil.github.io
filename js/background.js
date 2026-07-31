// Ambient canvas behind the page: a drifting constellation of dots that links
// up with its neighbours, reacts to the cursor, and gets a few extra dots
// wherever you click. On top of that, lingering on one of a few cards sends a
// themed emoji drifting across — a truck for the logistics sim, a lander for
// CargoLander.
//
// This module also owns the shared pointer state (HOME.background.pointer).
// js/tilt.js reads it so the cards lean toward the cursor off the same
// smoothed position the dots repel from, instead of each tracking its own.
window.HOME = window.HOME || {};

HOME.background = (function () {
    // Canvas size in CSS pixels. Exposed so tests can size the world without
    // a real canvas.
    const view = { width: 0, height: 0 };

    // Cursor position, smoothed. `presence` is the 0..1 fade that eases in on
    // enter and out on leave, so nothing snaps when the pointer arrives or
    // leaves the window. smoothX/smoothY deliberately keep their last value
    // once presence hits 0 — the field settles where the cursor left it.
    const pointer = {
        targetX: null, targetY: null,
        smoothX: null, smoothY: null,
        radius: 150,
        active: false,
        presence: 0,
        leaveTimer: null
    };

    let canvas = null, ctx = null;
    let particles = [];
    let themeEntities = [];
    let maxParticles = 150;
    let scrollY = 0, smoothScrollY = 0, scrollVelocity = 0;

    // ── Card themes ──────────────────────────────────────────────────────
    // Hovering a card tints the page gradient (the html[data-theme=...] rules
    // in css/base.css) and, for the three cards below, eventually sends a
    // themed drifter across the canvas.
    //
    // Drifters only start after a deliberate hover, and never more than a
    // couple at a time — it's a hint, not a parade.
    const THEME_DWELL_MS = 900;
    const MAX_THEME_ENTITIES = 2;

    let activeThemeCardId = null;
    let themeSpawnArmed = false;
    let themeDwellTimer = null;

    // One entry per card that gets a drifter. Adding a card here is the whole
    // change — the spawn gate below reads this table rather than a second list.
    //
    //   band/bandTop  vertical strip it may spawn in, as a fraction of the
    //                 canvas height plus a top offset
    //   speed         [minimum, extra random] horizontal pixels per frame
    //   drift         peak vertical wander per frame
    //   size          [minimum, extra random] font size in pixels
    //   spawnPad      how far off-screen it starts
    //   lifePad       extra travel budget beyond one screen width
    //   bob           adds a slow sine wave to the vertical motion
    //   flipWhen      the emoji is drawn facing one way; mirror it when
    //                 travelling the other way ('left', 'right', or omitted)
    //   directional   pick symbols[0] when moving right and [1] when moving
    //                 left, rather than picking from the list at random
    const ENTITY_SPECS = {
        'card-cargo-lander': {
            hue: 245, band: 0.65, bandTop: 50, speed: [2.5, 1.5], drift: 0.4,
            size: [22, 10], spawnPad: 50, lifePad: 100, maxAlpha: 0.4,
            bob: true, flipWhen: 'left', directional: true, symbols: ['🚀', '🛸']
        },
        'card-supply-chain': {
            hue: 45, band: 0.8, bandTop: 60, speed: [2.0, 1.2], drift: 0,
            size: [20, 8], spawnPad: 50, lifePad: 100, maxAlpha: 0.4,
            flipWhen: 'right', directional: true, symbols: ['🚚', '🚛']
        },
        'card-car': {
            hue: 160, band: 1, bandTop: 0, speed: [1.2, 1.2], drift: 0.5,
            size: [14, 8], spawnPad: 40, lifePad: 80, maxAlpha: 0.35,
            symbols: ['🚗', '🔑', '$/mo', '📉', 'APR']
        }
    };

    // How far past the edge a drifter travels before it is retired.
    const EXIT_MARGIN = 80;

    function activateCardTheme(cardId) {
        if (!cardId || activeThemeCardId === cardId) return;
        activeThemeCardId = cardId;

        clearTimeout(themeDwellTimer);
        themeSpawnArmed = false;
        themeDwellTimer = setTimeout(() => { themeSpawnArmed = true; }, THEME_DWELL_MS);

        document.documentElement.setAttribute('data-theme', cardId);
    }

    class ThemeEntity {
        constructor(cardId) {
            const spec = ENTITY_SPECS[cardId];
            this.dead = !spec;
            if (!spec) return;

            const fromLeft = Math.random() < 0.5;
            const dir = fromLeft ? 1 : -1;

            this.cardId = cardId;
            this.life = 0;
            this.hue = spec.hue;
            this.maxAlpha = spec.maxAlpha;
            this.bob = !!spec.bob;
            this.flipWhen = spec.flipWhen || null;
            this.alpha = 0;

            this.x = fromLeft ? -spec.spawnPad : view.width + spec.spawnPad;
            this.y = Math.random() * (view.height * spec.band) + spec.bandTop;
            this.vx = dir * (spec.speed[0] + Math.random() * spec.speed[1]);
            this.vy = (Math.random() - 0.5) * spec.drift;
            this.size = spec.size[0] + Math.random() * spec.size[1];
            this.maxLife = Math.ceil((view.width + spec.lifePad) / Math.abs(this.vx));

            this.symbol = spec.directional
                ? spec.symbols[fromLeft ? 0 : 1]
                : spec.symbols[Math.floor(Math.random() * spec.symbols.length)];
        }

        update() {
            this.life++;
            this.x += this.vx;
            this.y += this.vy;

            if (this.bob) this.y += Math.sin(this.life * 0.08) * 0.6;

            // Fade in over the first 15% of the crossing and back out over the
            // last 15%, so nothing pops into or out of existence mid-screen.
            const progress = this.life / this.maxLife;
            if (progress < 0.15) {
                this.alpha = (progress / 0.15) * this.maxAlpha;
            } else if (progress > 0.85) {
                this.alpha = ((1 - progress) / 0.15) * this.maxAlpha;
            } else {
                this.alpha = this.maxAlpha;
            }

            if (this.life >= this.maxLife ||
                (this.vx > 0 && this.x > view.width + EXIT_MARGIN) ||
                (this.vx < 0 && this.x < -EXIT_MARGIN)) {
                this.dead = true;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            if (this.flipWhen === 'right' ? this.vx > 0 : this.flipWhen === 'left' && this.vx < 0) {
                ctx.scale(-1, 1);
            }
            ctx.fillStyle = `hsla(${this.hue}, 85%, 75%, ${this.alpha})`;
            ctx.shadowColor = `hsla(${this.hue}, 90%, 65%, ${this.alpha * 0.8})`;
            ctx.shadowBlur = 10;
            ctx.font = `${Math.round(this.size)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.symbol, 0, 0);
            ctx.restore();
        }
    }

    // ── The constellation ────────────────────────────────────────────────
    class Particle {
        // Pass x/y to place a dot deliberately (a click); omit for the
        // ambient field.
        constructor(x, y) {
            const placed = x != null;
            this.placed = placed;
            this.x = placed ? x : Math.random() * view.width;
            this.y = placed ? y : Math.random() * view.height;
            // Clicked dots drift outward a touch faster so the burst reads as
            // a burst.
            const speed = placed ? 2.4 : 1.5;
            this.vx = (Math.random() - 0.5) * speed;
            this.vy = (Math.random() - 0.5) * speed;
            this.baseRadius = Math.random() * 1.8 + 0.8;
            this.radius = this.baseRadius;
            this.hue = Math.random() * 80 + 200; // blue-purple-indigo band
            this.glow = 0; // 0..1 proximity brightness
            this.fade = placed ? 0 : 1; // clicked dots ease in instead of popping
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.fade < 1) this.fade = Math.min(1, this.fade + 0.06);

            if (this.x < 0 || this.x > view.width) this.vx = -this.vx;
            if (this.y < 0 || this.y > view.height) this.vy = -this.vy;

            // Pointer proximity: repel + glow
            if (pointer.smoothX !== null && pointer.presence > 0.001) {
                const dx = pointer.smoothX - this.x;
                const dy = pointer.smoothY - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < pointer.radius) {
                    const force = ((pointer.radius - distance) / pointer.radius) * pointer.presence;
                    this.x -= (dx / distance) * force * 5;
                    this.y -= (dy / distance) * force * 5;
                    this.glow += (force - this.glow) * 0.2;
                } else {
                    this.glow += (0 - this.glow) * 0.05;
                }
            } else {
                this.glow += (0 - this.glow) * 0.05;
            }

            // Radius swells slightly when glowing
            this.radius = this.baseRadius + this.glow * 2.5;
        }

        draw(ctx) {
            const lightness = 65 + this.glow * 25;
            const saturation = 70 + this.glow * 30;
            const alpha = (0.6 + this.glow * 0.4) * this.fade;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue}, ${saturation}%, ${lightness}%, ${alpha})`;
            ctx.fill();
        }
    }

    // Press the background to drop a few new dots into the constellation. The
    // link loop is O(n²), so the field is capped — at the cap, the oldest
    // clicked dot retires to make room, which keeps every click responsive at
    // a fixed cost.
    const CLICK_DOTS = 3;

    function spawnDotsAt(clientX, clientY) {
        // Undo the parallax shift applied at draw time so dots land under the
        // cursor.
        const y = clientY + smoothScrollY * 0.15;
        for (let i = 0; i < CLICK_DOTS; i++) {
            if (particles.length >= maxParticles) {
                const idx = particles.findIndex(p => p.placed);
                particles.splice(idx === -1 ? 0 : idx, 1);
            }
            const jitter = () => (Math.random() - 0.5) * 18;
            particles.push(new Particle(clientX + jitter(), y + jitter()));
        }
    }

    function seed() {
        particles = [];
        themeEntities = [];
        // Responsive amount of particles based on screen size
        const numberOfParticles = Math.min((view.width * view.height) / 12000, 150);
        // Headroom for clicked dots, scaled to the ambient density so a small
        // window doesn't end up doing big-window work.
        maxParticles = Math.round(numberOfParticles) + 36;
        for (let i = 0; i < numberOfParticles; i++) {
            particles.push(new Particle());
        }
    }

    function resize() {
        view.width = canvas.width = window.innerWidth;
        view.height = canvas.height = window.innerHeight;
    }

    function handleMouseMove(e) {
        if (pointer.leaveTimer) {
            clearTimeout(pointer.leaveTimer);
            pointer.leaveTimer = null;
        }
        pointer.active = true;
        pointer.targetX = e.clientX;
        pointer.targetY = e.clientY;
        if (pointer.smoothX === null) {
            pointer.smoothX = e.clientX;
            pointer.smoothY = e.clientY;
        }
    }

    function handleMouseLeave() {
        if (pointer.leaveTimer) return;
        // Delay 300ms before starting the slow retreat/fade
        pointer.leaveTimer = setTimeout(() => {
            pointer.active = false;
            pointer.leaveTimer = null;
        }, 300);
    }

    function animate() {
        ctx.clearRect(0, 0, view.width, view.height);

        // Smooth pointer presence & position tracking
        if (pointer.active) {
            pointer.presence += (1 - pointer.presence) * 0.1;
        } else {
            pointer.presence += (0 - pointer.presence) * 0.035;
            if (pointer.presence < 0.001) pointer.presence = 0;
        }

        if (pointer.targetX !== null) {
            if (pointer.smoothX === null) {
                pointer.smoothX = pointer.targetX;
                pointer.smoothY = pointer.targetY;
            } else {
                pointer.smoothX += (pointer.targetX - pointer.smoothX) * 0.12;
                pointer.smoothY += (pointer.targetY - pointer.smoothY) * 0.12;
            }
        }

        // Smooth scroll tracking + velocity
        const prevSmooth = smoothScrollY;
        smoothScrollY += (scrollY - smoothScrollY) * 0.08;
        scrollVelocity = smoothScrollY - prevSmooth;

        // Parallax shift
        ctx.save();
        ctx.translate(0, -smoothScrollY * 0.15);

        for (let i = 0; i < particles.length; i++) {
            // Apply scroll inertia as a gentle push (like the pointer repel)
            if (Math.abs(scrollVelocity) > 0.5) {
                particles[i].y -= scrollVelocity * 0.3;
                particles[i].x += (Math.random() - 0.5) * Math.abs(scrollVelocity) * 0.5;
            }

            particles[i].update();
            particles[i].draw(ctx);

            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 150) {
                    // Blend glow of both endpoints for line color
                    const combinedGlow = (particles[i].glow + particles[j].glow) * 0.5;
                    // A link is only as solid as its faintest end, so links
                    // ease in with the dots they connect.
                    const linkFade = Math.min(particles[i].fade, particles[j].fade);
                    const baseAlpha = (0.35 - distance / 430) * linkFade;
                    const lineAlpha = baseAlpha + combinedGlow * 0.45 * linkFade;
                    const hue = particles[i].hue;
                    const saturation = 30 + combinedGlow * 70;
                    const lightness = 60 + combinedGlow * 30;
                    ctx.beginPath();
                    ctx.strokeStyle = combinedGlow > 0.05
                        ? `hsla(${hue}, ${saturation}%, ${lightness}%, ${lineAlpha})`
                        : `rgba(148, 163, 184, ${baseAlpha})`;
                    ctx.lineWidth = 0.8 + combinedGlow * 1.2;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        // Spawn themed drifters after a lingering hover over a card
        if (themeSpawnArmed && ENTITY_SPECS[activeThemeCardId] &&
            themeEntities.length < MAX_THEME_ENTITIES && Math.random() < 0.012) {
            themeEntities.push(new ThemeEntity(activeThemeCardId));
        }

        for (let i = themeEntities.length - 1; i >= 0; i--) {
            const e = themeEntities[i];
            e.update();
            e.draw(ctx);
            if (e.dead) themeEntities.splice(i, 1);
        }

        ctx.restore();
        requestAnimationFrame(animate);
    }

    function init() {
        canvas = document.getElementById('networkCanvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');

        resize();
        seed();

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('mouseout', (e) => {
            if (!e.relatedTarget) handleMouseLeave();
        });
        window.addEventListener('scroll', () => { scrollY = window.scrollY; });
        window.addEventListener('click', (e) => {
            // Leave real UI alone — cards are anchors, so this covers them too.
            if (e.target.closest('a, button, #vault-panel, #vault-backdrop, #name-trigger')) return;
            spawnDotsAt(e.clientX, e.clientY);
        });

        requestAnimationFrame(animate);
    }

    return {
        init,
        view,
        pointer,
        activateCardTheme,
        ENTITY_SPECS,
        ThemeEntity,
        Particle
    };
})();
