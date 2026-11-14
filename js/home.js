<script>
const canvas = document.getElementById('networkCanvas');
const ctx = canvas.getContext('2d');

/* The canvas sits behind the grid (z-index 0 vs 1), which makes it part of
   the backdrop every card's backdrop-filter has to blur. So a frame drawn
   here is never just a canvas frame — it also dirties nine 20px blurs. On a
   phone that is the difference between a smooth scroll and a stuttering one,
   so mobile runs the field at 30fps and skips the costlier flourishes. */
const prefersCheapCanvas = perfLowPowerView;
const canvasReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* Frame budget, dot count and link reach all come off the governor's tier
   (see the head script). A step down buys back the whole chain: fewer dots
   is fewer links is less canvas painted is fewer card backdrops re-blurred.

   Desktop `full` used to be 0 — uncapped, i.e. one canvas frame per display
   refresh. On a 60Hz panel that is what it always was; on the 120Hz and
   144Hz screens that are now ordinary it was two to two-and-a-half times
   the work, and the work is not the canvas: every frame drawn here
   re-dirties the backdrop of the eighteen blurred surfaces above it, so the
   refresh rate of the monitor was quietly setting how often the whole glass
   stack got re-filtered.

   75 sits just under a 60Hz cadence (a 13.3ms budget against a 16.7ms
   frame), so a 60Hz display still draws every frame and loses nothing,
   while 120Hz halves and 144Hz drops to ~72. Nobody has ever picked a
   drifting constellation at 75fps out of one at 144. */
const CANVAS_FRAME_MS_BY_TIER = prefersCheapCanvas
    ? [1000 / 30, 1000 / 24, 1000 / 15]
    : [1000 / 75, 1000 / 40, 1000 / 24];
const FIELD_SCALE_BY_TIER = [1, 0.6, 0.35];
/* 0 turns the O(n²) link pass off entirely — the dots stay, the web goes.
   Only `minimal` does that, and it is the emergency tier.

   `reduced` used to shorten the reach to 115 as well, which was the wrong
   knob: dots on their own read as noise, and the web is the thing anybody
   would say they were looking at. The saving is already in the dot count
   — 0.6 of them is 0.36 of the pairs, since the pass is quadratic — and
   that swamps the 1.7x more area a 150px reach admits. Net link work at
   `reduced` lands near 0.6 of `full` with the web still looking like a
   web, which is a better trade than a cheaper frame nobody recognises. */
const LINK_DISTANCE_BY_TIER = [150, 150, 0];
const TOUCH_MAX_AMBIENT = 45;
let lastCanvasFrame = 0;

let width, height;
let particles = [];
const mouse = {
    x: null, y: null,
    targetX: null, targetY: null,
    smoothX: null, smoothY: null,
    radius: 150,
    active: false,
    presence: 0,
    leaveTimer: null
};

let currentGlobalHue = 220, targetGlobalHue = 220;
let activeThemeCardId = null;

/* ── Letting go of a card's theme ──
   A hovered card pulls the whole page towards its accent, and until now
   nothing ever pulled it back: the first card you touched owned the
   palette for the rest of the visit. That matters more than it did, since
   the background rotates its colours now and a pinned theme outranks the
   rotation — you would see the lights and the sweep change under a hue
   that never moved again. So the theme is released when nothing is
   hovered, and the page falls back to whichever palette is showing.

   Debounced, because sliding from one card to its neighbour releases the
   first before it activates the second, and a flick back to base in
   between would read as a flash. */
const THEME_RELEASE_MS = 260;
let themeReleaseTimer = null;

function deactivateCardTheme() {
    clearTimeout(themeReleaseTimer);
    themeReleaseTimer = setTimeout(() => {
        themeReleaseTimer = null;
        activeThemeCardId = null;
        document.documentElement.removeAttribute('data-theme');
    }, THEME_RELEASE_MS);
}

function activateCardTheme(cardId) {
    if (!cardId) return;
    // Before the early return below: re-entering the card you just left
    // has to cancel its own pending release.
    clearTimeout(themeReleaseTimer);
    themeReleaseTimer = null;
    if (activeThemeCardId === cardId) return;
    activeThemeCardId = cardId;

    document.documentElement.setAttribute('data-theme', cardId);

    const themeHues = {
        'card-bil': 205,
        'card-name-song': 275,
        'card-black-hole': 40,
        'card-gait': 158,
        'card-erosion': 199,
        'card-fika': 30,
        'card-paper-plane': 52,
        'card-orbit': 8,
        'card-elevator': 38,
        'card-terrarium': 170,
        'card-supply-chain': 45,
        'card-cargo-lander': 245,
        'card-converter': 190,
        'card-car': 160,
        'card-cv': 215,
        'card-math': 270,
        'card-math-game': 25,
        'card-cargo-packer': 28,
        'card-3d-poc': 199,
        'card-viz': 200,
        'card-golf-hub': 140,
        'card-about': 345,
        'card-sand': 40
    };

    if (themeHues[cardId] !== undefined) {
        targetGlobalHue = themeHues[cardId];
    }
}

/* ── Extent of the ambient field ──
   The dots live in a band `fieldHeight` tall, which is the viewport plus,
   when the scroll coupling is on, the strip the parallax can uncover at
   the bottom. Without that strip the old parallax slid the field up and
   left bare canvas behind it. */
const FIELD_PARALLAX_MAX = 140;
let fieldHeight = 0;

function updateFieldExtent() {
    fieldHeight = height + (scrollReactiveField ? FIELD_PARALLAX_MAX : 0);
}

/* Clamped: past ~900px of scroll the field simply stops climbing, so no
   amount of page can slide it out of the viewport. */
function bgParallaxShift() {
    return Math.min(smoothScrollY * 0.15, FIELD_PARALLAX_MAX);
}

/* Assigning canvas.width wipes the bitmap even when the value is the same,
   and a phone or tablet fires resize mid-scroll whenever the address bar
   slides in or out. With the field holding still during a scroll (see
   animate), that wipe used to stay on screen until the finger let go: the
   dots vanished for the whole scroll instead of freezing. So an unchanged
   size is left alone, and a real change asks for one frame straight away. */
let canvasNeedsRedraw = false;

function resize() {
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        canvasNeedsRedraw = true;
    }
    updateFieldExtent();
}

document.addEventListener('scrollfield:change', updateFieldExtent);

window.addEventListener('resize', resize);
resize();

function handleMouseMove(e) {
    if (mouse.leaveTimer) {
        clearTimeout(mouse.leaveTimer);
        mouse.leaveTimer = null;
    }
    mouse.active = true;
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    if (mouse.smoothX === null) {
        mouse.smoothX = e.clientX;
        mouse.smoothY = e.clientY;
    }
    mouse.x = e.clientX;
    mouse.y = e.clientY;
}

function handleMouseLeave() {
    if (mouse.leaveTimer) return;
    // Delay 300ms before starting the slow retreat/fade
    mouse.leaveTimer = setTimeout(() => {
        mouse.active = false;
        mouse.leaveTimer = null;
    }, 300);
}

window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('mouseleave', handleMouseLeave);
window.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget && !e.toElement) {
        handleMouseLeave();
    }
});

class Particle {
    // Pass x/y to place a dot deliberately (a click); omit for the ambient field.
    constructor(x, y) {
        const placed = x != null;
        this.placed = placed;
        this.x = placed ? x : Math.random() * width;
        this.y = placed ? y : Math.random() * fieldHeight;
        // Clicked dots drift outward a touch faster so the burst reads as a burst.
        const speed = placed ? 2.4 : 1.5;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.5) * speed;
        this.baseRadius = Math.random() * 1.8 + 0.8;
        this.radius = this.baseRadius;
        this.hue = Math.random() * 80 + 200; // blue-purple-indigo band
        this.glow = 0; // 0..1 proximity brightness
        this.fade = placed ? 0 : 1; // clicked dots ease in instead of popping
        // How hard this dot takes an end-of-page shove. Uniform would slide
        // the whole field as one sheet and the web would never change
        // shape; a spread means it stretches and recovers.
        this.bumpBias = 0.6 + Math.random() * 0.8;
        // Where the shove has it *right now*, relative to where it lives.
        // An offset rather than a move: it decays to zero, so the dot comes
        // home and no amount of slamming into the bottom of the page can
        // walk the whole field off the top of the screen.
        this.bumpOff = 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.fade < 1) this.fade = Math.min(1, this.fade + 0.06);

        // Clamp as well as reflect: fieldHeight moves when the window
        // resizes or the scroll coupling is toggled, and a dot left outside
        // the band would otherwise flip its velocity every frame and stick.
        if (this.x < 0) { this.x = 0; this.vx = Math.abs(this.vx); }
        else if (this.x > width) { this.x = width; this.vx = -Math.abs(this.vx); }
        if (this.y < 0) { this.y = 0; this.vy = Math.abs(this.vy); }
        else if (this.y > fieldHeight) { this.y = fieldHeight; this.vy = -Math.abs(this.vy); }

        // Mouse proximity: repel + glow
        if (mouse.smoothX !== null && mouse.presence > 0.001) {
            let dx = mouse.smoothX - this.x;
            let dy = mouse.smoothY - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius) {
                const force = ((mouse.radius - distance) / mouse.radius) * mouse.presence;
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

    draw() {
        const lightness = 65 + this.glow * 25;
        const saturation = 70 + this.glow * 30;
        const alpha = (0.6 + this.glow * 0.4) * this.fade;
        ctx.beginPath();
        ctx.arc(this.x, this.y + this.bumpOff, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, ${saturation}%, ${lightness}%, ${alpha})`;
        ctx.fill();
    }
}

// Press the background to drop a few new dots into the constellation. The link
// loop is O(n²), so the field is capped — at the cap, the oldest clicked dot
// retires to make room, which keeps every click responsive at a fixed cost.
const CLICK_DOTS = 3;
let maxParticles = 150;

function spawnDotsAt(clientX, clientY) {
    // Undo the parallax shift applied at draw time so dots land under the cursor.
    const y = clientY + bgParallaxShift();
    for (let i = 0; i < CLICK_DOTS; i++) {
        if (particles.length >= maxParticles) {
            let idx = particles.findIndex(p => p.placed);
            particles.splice(idx === -1 ? 0 : idx, 1);
        }
        const jitter = () => (Math.random() - 0.5) * 18;
        particles.push(new Particle(clientX + jitter(), y + jitter()));
    }
}

window.addEventListener('click', (e) => {
    // Leave real UI alone — cards are anchors, so this covers them too.
    if (e.target.closest('a, button, #vault-panel, #vault-backdrop, #name-trigger')) return;
    spawnDotsAt(e.clientX, e.clientY);
});

function loadHighScores() {
    // 1. Supply Chain Tycoon
    try {
        const scRaw = localStorage.getItem('scTycoonSave.v1');
        const scBadge = document.getElementById('stat-supply-chain');
        if (scBadge) {
            if (scRaw) {
                const data = JSON.parse(scRaw);
                const earned = data.earnedTotal || data.money || 0;
                const delivered = data.delivered || 0;
                if (earned > 0 || delivered > 0) {
                    scBadge.innerHTML = `<span class="stat-icon">🏆</span> <span class="stat-val">$${earned.toLocaleString()}</span> <span style="opacity:0.65;font-size:0.7rem;margin-left:3px;">(${delivered} orders)</span>`;
                } else {
                    scBadge.innerHTML = `<span class="stat-icon">🏆</span> <span class="stat-val">—</span>`;
                }
            } else {
                scBadge.innerHTML = `<span class="stat-icon">🏆</span> <span class="stat-val">—</span>`;
            }
        }
    } catch (e) {}

    // 2. CargoLander
    try {
        const clScoresRaw = localStorage.getItem('cargoLanderHighscores');
        const clCash = parseInt(localStorage.getItem('cargoLanderCash') || '0', 10);
        const clBadge = document.getElementById('stat-cargo-lander');
        if (clBadge) {
            let topScore = 0;
            if (clScoresRaw) {
                const scores = JSON.parse(clScoresRaw);
                for (const k in scores) {
                    const entry = scores[k];
                    if (typeof entry === 'number' && entry > topScore) topScore = entry;
                    else if (entry && typeof entry.score === 'number' && entry.score > topScore) topScore = entry.score;
                }
            }
            if (topScore > 0) {
                clBadge.innerHTML = `<span class="stat-icon">🚀</span> High Score: <span class="stat-val">${topScore.toLocaleString()} pts</span>`;
            } else if (clCash > 0) {
                clBadge.innerHTML = `<span class="stat-icon">🚀</span> Pilot Cash: <span class="stat-val">$${clCash.toLocaleString()}</span>`;
            } else {
                clBadge.innerHTML = `<span class="stat-icon">🚀</span> High Score: <span class="stat-val">—</span>`;
            }
        }
    } catch (e) {}

    // 3. Mental Math Game
    try {
        const mathHs = parseInt(localStorage.getItem('mentalMathHighScore') || '0', 10);
        const mathBadge = document.getElementById('stat-math-game');
        if (mathBadge) {
            if (mathHs > 0) {
                mathBadge.innerHTML = `<span class="stat-icon">⚡</span> High Score: <span class="stat-val">${mathHs} pts</span>`;
            } else {
                mathBadge.innerHTML = `<span class="stat-icon">⚡</span> High Score: <span class="stat-val">—</span>`;
            }
        }
    } catch (e) {}

    // 4. Yard Master 3D
    try {
        const cargoRaw = localStorage.getItem('cargo3d.save.v1');
        const cargoBadge = document.getElementById('stat-3d-poc');
        if (cargoBadge) {
            if (cargoRaw) {
                const data = JSON.parse(cargoRaw);
                const missions = data.missions || {};
                let completed = 0, gold = 0;
                for (const k in missions) {
                    if (missions[k].completed) completed++;
                    if (missions[k].medal === 'gold') gold++;
                }
                if (completed > 0) {
                    cargoBadge.innerHTML = `<span class="stat-icon">📦</span> <span class="stat-val">${completed}/12 Missions</span> <span style="opacity:0.65;font-size:0.7rem;margin-left:3px;">(${gold} 🥇)</span>`;
                } else {
                    cargoBadge.innerHTML = `<span class="stat-icon">📦</span> <span class="stat-val">—</span>`;
                }
            } else {
                cargoBadge.innerHTML = `<span class="stat-icon">📦</span> <span class="stat-val">—</span>`;
            }
        }
    } catch (e) {}

    /* 5+6. Mini Golf. The two games keep entirely separate records,
       and the picker shows each on its own option. The chip on the front
       of the card carries whichever of them exist, so you can see there
       is something to beat without turning the card over — labelled by
       dimension rather than merged, since eighteen flat holes and six
       lofted ones are not the same number. The flat record read here
       is the Old Course's: Pocket Links keeps a save file per course,
       and the Old Course is the one under the bare key. */
    let bestFlat = null, bestLofted = null;

    // 5. Pocket Links
    try {
        const golfRaw = localStorage.getItem('miniGolf.save.v1');
        const golfBadge = document.getElementById('stat-golf');
        if (golfBadge) {
            let done = false;
            if (golfRaw) {
                const data = JSON.parse(golfRaw);
                if (typeof data.best === 'number') {
                    const vs = typeof data.bestVsPar === 'number'
                        ? (data.bestVsPar === 0 ? 'E' : (data.bestVsPar > 0 ? '+' : '') + data.bestVsPar)
                        : '';
                    const aces = data.aces > 0
                        ? ` <span style="opacity:0.65;font-size:0.7rem;margin-left:3px;">(${data.aces} ace${data.aces === 1 ? '' : 's'})</span>`
                        : '';
                    golfBadge.innerHTML = `<span class="stat-icon">⛳</span> Best Round: <span class="stat-val">${data.best}${vs ? ' (' + vs + ')' : ''}</span>${aces}`;
                    bestFlat = data.best;
                    done = true;
                }
            }
            if (!done) {
                golfBadge.innerHTML = `<span class="stat-icon">⛳</span> Best Round: <span class="stat-val">—</span>`;
            }
        }
    } catch (e) {}

    // 6. Loft Links 3D — records are per course, so the chip shows the
    // best of them and says which one it was.
    try {
        const loftRaw = localStorage.getItem('loftLinks.save.v1');
        const loftBadge = document.getElementById('stat-golf3d');
        if (loftBadge) {
            const names = { seaside: 'Seaside', quarry: 'Quarry', works: 'Works' };
            let best = null, bestVs = null, bestId = null, aces = 0;
            if (loftRaw) {
                const data = JSON.parse(loftRaw);
                aces = typeof data.aces === 'number' ? data.aces : 0;
                const courses = data.courses || {};
                for (const id of Object.keys(courses)) {
                    const c = courses[id];
                    if (typeof c.best !== 'number') continue;
                    if (best === null || c.best < best) {
                        best = c.best;
                        bestVs = typeof c.bestVsPar === 'number' ? c.bestVsPar : null;
                        bestId = id;
                    }
                }
            }
            if (best !== null) {
                const vs = bestVs === null ? '' : (bestVs === 0 ? 'E' : (bestVs > 0 ? '+' : '') + bestVs);
                const where = names[bestId] ? ` <span style="opacity:0.65;font-size:0.7rem;margin-left:3px;">${names[bestId]}</span>` : '';
                const aceTag = aces > 0
                    ? ` <span style="opacity:0.65;font-size:0.7rem;margin-left:3px;">(${aces} ace${aces === 1 ? '' : 's'})</span>`
                    : '';
                loftBadge.innerHTML = `<span class="stat-icon">🏌️</span> Best Round: <span class="stat-val">${best}${vs ? ' (' + vs + ')' : ''}</span>${where}${aceTag}`;
                bestLofted = best;
            } else {
                loftBadge.innerHTML = `<span class="stat-icon">🏌️</span> Best Round: <span class="stat-val">—</span>`;
            }
        }
    } catch (e) {}

    /* The back of a card repeats its record next to the launch button,
       which is the moment it is worth knowing. Rather than have every
       block above write two elements, mirror the front chip once they
       are all filled in — one place to change when a chip changes. */
    // Tiny Elevator Tycoon: stars earned across its six levels.
    try {
        const elevBadge = document.getElementById('stat-elevator');
        const elevBest = JSON.parse(localStorage.getItem('elevator.best') || '{}');
        const elevStars = Object.values(elevBest).reduce((n, b) => n + ((b && b.stars) || 0), 0);
        if (elevBadge && elevStars > 0) {
            elevBadge.innerHTML = `<span class="stat-icon">★</span> Stars: <span class="stat-val">${elevStars} / 18</span>`;
        }
    } catch (e) {}

    // Paper Plane Glider: the longest throw.
    try {
        const planeBadge = document.getElementById('stat-paper-plane');
        const planeBest = JSON.parse(localStorage.getItem('paperplane.best') || 'null');
        if (planeBadge && planeBest && planeBest.distance > 0) {
            planeBadge.innerHTML = `<span class="stat-icon">✈️</span> Best: <span class="stat-val">${planeBest.distance.toFixed(1)} m</span>`;
        }
    } catch (e) {}

    // Pocket Orbit: stars earned across its seven missions.
    try {
        const orbitBadge = document.getElementById('stat-orbit');
        const orbitBest = JSON.parse(localStorage.getItem('orbit.best') || '{}');
        const orbitStars = Object.values(orbitBest).reduce((n, b) => n + ((b && b.stars) || 0), 0);
        if (orbitBadge && orbitStars > 0) {
            orbitBadge.innerHTML = `<span class="stat-icon">★</span> Stars: <span class="stat-val">${orbitStars} / 21</span>`;
        }
    } catch (e) {}

    document.querySelectorAll('[data-mirror-stat]').forEach(el => {
        const src = document.getElementById(el.dataset.mirrorStat);
        if (src) el.innerHTML = src.innerHTML;
    });

    // 7. The Mini Golf card itself, summarising the two above.
    try {
        const hubBadge = document.getElementById('stat-golf-hub');
        if (hubBadge) {
            const parts = [];
            if (bestFlat !== null) parts.push(`2D <span class="stat-val">${bestFlat}</span>`);
            if (bestLofted !== null) parts.push(`3D <span class="stat-val">${bestLofted}</span>`);
            hubBadge.innerHTML = parts.length
                ? `<span class="stat-icon">⛳</span> Best: ${parts.join(' · ')}`
                : `<span class="stat-icon">⛳</span> <span class="stat-val">2D · 3D</span>`;
        }
    } catch (e) {}
}

// Ambient dots this window would carry at full quality; the tier scales it.
let ambientCount = 0;

/* Tiers trim or top up the field in place rather than re-seeding it, so a
   step down reads as the constellation thinning out rather than blinking.
   Trimming takes from the front, which is the ambient end — dots you put
   there by clicking are the last to go. */
function applyFieldBudget() {
    const scale = FIELD_SCALE_BY_TIER[perfTier];
    const budget = Math.max(12, Math.round(ambientCount * scale));
    // Headroom for clicked dots, scaled to the ambient density so a small
    // window doesn't end up doing big-window work.
    maxParticles = budget + Math.round(36 * scale);
    if (particles.length > budget) {
        particles.splice(0, particles.length - budget);
    } else {
        for (let i = particles.length; i < budget; i++) particles.push(new Particle());
    }
}

function init() {
    particles = [];
    // Responsive amount of particles based on screen size
    ambientCount = Math.round(Math.min((width * height) / 12000, 150));
    /* A tablet is a phone's GPU behind a desktop's screen. Area alone gave
       an iPad 80-115 dots against a phone's ~30, so ~7-14x the O(n²) link
       work, all of it re-blurred by three columns of cards — the lag on
       iPad that a phone never showed. Touch screens stop at ~1.5 phones. */
    if (prefersCheapCanvas) ambientCount = Math.min(ambientCount, TOUCH_MAX_AMBIENT);
    applyFieldBudget();
    loadHighScores();
}

document.addEventListener('perf:tier', applyFieldBudget);

let scrollY = 0, scrollVelocity = 0, smoothScrollY = 0;

/* ── Running out of page ─────────────────────────────────────────────
   The field holds still while you scroll (see animate), so the moment
   the scroll stops is the moment it starts drawing again. An impulse
   that lands exactly there costs nothing during the scroll and arrives
   on the one frame anybody is looking at: hit the top or the bottom
   with some speed on and the dots get shoved the way you were going,
   then drift back out of it on their own.

   Only on the way *into* an edge, and only above a speed — easing up to
   the end of the page should not set the whole sky off. */
const BUMP_MIN_DELTA = 9;     // px in one scroll event; a nudge is not a slam
const BUMP_MAX = 30;
let bumpLastY = window.scrollY;
let bumpPending = 0, bumpImpulse = 0;

window.addEventListener('scroll', () => {
    scrollY = window.scrollY;

    const delta = scrollY - bumpLastY;
    bumpLastY = scrollY;
    if (Math.abs(delta) < BUMP_MIN_DELTA) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const doc = document.documentElement;
    const atTop = scrollY <= 0 && delta < 0;
    const atBottom = scrollY + window.innerHeight >= doc.scrollHeight - 1 && delta > 0;
    if (!atTop && !atBottom) return;

    bumpPending = Math.max(-BUMP_MAX, Math.min(BUMP_MAX, delta));
}, { passive: true });

function animate(now) {
    const frameBudget = CANVAS_FRAME_MS_BY_TIER[perfTier];
    if (frameBudget && now - lastCanvasFrame < frameBudget) {
        requestAnimationFrame(animate);
        return;
    }

    /* A field that no longer tracks the scroll has nothing to say while the
       page is moving, and every frame it draws while the page moves costs
       nine card backdrops as well. So on a phone it holds its last frame
       until the scroll stops — the dots freeze for a few hundred ms and
       nobody has ever noticed, which is exactly the point. Reduced motion
       gets the same treatment for the same reason, on any device: the
       field stays on screen exactly as it was, it just stops redrawing
       itself while the page is moving underneath it. A resize has just
       wiped the canvas, though, so that one frame goes through. */
    if (!canvasNeedsRedraw && (prefersCheapCanvas || perfTier > 0 || canvasReduceMotion.matches) && !scrollReactiveField && scrollIsActive()) {
        requestAnimationFrame(animate);
        return;
    }

    lastCanvasFrame = now;
    canvasNeedsRedraw = false;

    ctx.clearRect(0, 0, width, height);

    // Smooth mouse presence & position tracking
    if (mouse.active) {
        mouse.presence += (1 - mouse.presence) * 0.1;
    } else {
        mouse.presence += (0 - mouse.presence) * 0.035;
        if (mouse.presence < 0.001) {
            mouse.presence = 0;
            mouse.x = null;
            mouse.y = null;
        }
    }

    if (mouse.targetX !== null) {
        if (mouse.smoothX === null) {
            mouse.smoothX = mouse.targetX;
            mouse.smoothY = mouse.targetY;
        } else {
            mouse.smoothX += (mouse.targetX - mouse.smoothX) * 0.12;
            mouse.smoothY += (mouse.targetY - mouse.smoothY) * 0.12;
        }
    }

    /* Smooth scroll tracking + velocity. Half the frame rate needs twice the
       step, or the parallax noticeably trails the page on mobile. With the
       coupling off the target is 0, so a field that was tracking the scroll
       when you turned it off glides home rather than jumping. */
    const parallaxTarget = scrollReactiveField ? scrollY : 0;
    let prevSmooth = smoothScrollY;
    smoothScrollY += (parallaxTarget - smoothScrollY) * (prefersCheapCanvas ? 0.16 : 0.08);
    scrollVelocity = smoothScrollY - prevSmooth;

    // Parallax shift — 0, and free, while the coupling is off
    ctx.save();
    ctx.translate(0, -bgParallaxShift());

    const linkDistance = LINK_DISTANCE_BY_TIER[perfTier];

    /* Take up whatever the scroll handler left, then bleed it off. The
       decay is what turns an impulse into a shove: every dot swings out
       along its own bias and comes back to where it lives over about a
       second, so the web stretches and recovers instead of the field
       taking a permanent step up the screen every time you hit the end
       of the page. */
    if (bumpPending) { bumpImpulse -= bumpPending; bumpPending = 0; }
    const bumping = bumpImpulse !== 0;
    if (bumping) {
        bumpImpulse *= 0.9;
        if (Math.abs(bumpImpulse) < 0.08) bumpImpulse = 0;
    }

    for (let i = 0; i < particles.length; i++) {
        if (bumping) particles[i].bumpOff = bumpImpulse * particles[i].bumpBias;
        else if (particles[i].bumpOff) particles[i].bumpOff = 0;
        // Apply scroll inertia as a gentle push (like mouse repel)
        if (scrollReactiveField && Math.abs(scrollVelocity) > 0.5) {
            particles[i].y -= scrollVelocity * 0.3;
            particles[i].x += (Math.random() - 0.5) * Math.abs(scrollVelocity) * 0.5;
        }

        particles[i].update();
        particles[i].draw();

        if (!linkDistance) continue;

        for (let j = i + 1; j < particles.length; j++) {
            let dx = particles[i].x - particles[j].x;
            let dy = (particles[i].y + particles[i].bumpOff) - (particles[j].y + particles[j].bumpOff);
            // Reject on the cheap tests first — this inner loop runs O(n²)
            // times a frame and most pairs are nowhere near each other, so
            // the square root is only worth taking for the few that pass.
            if (dx > linkDistance || dx < -linkDistance || dy > linkDistance || dy < -linkDistance) continue;
            const d2 = dx * dx + dy * dy;
            if (d2 >= linkDistance * linkDistance) continue;
            const distance = Math.sqrt(d2);

            // Blend glow of both endpoints for line color
            const combinedGlow = (particles[i].glow + particles[j].glow) * 0.5;
            // A link is only as solid as its faintest end, so links ease in
            // with the dots they connect.
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
            ctx.moveTo(particles[i].x, particles[i].y + particles[i].bumpOff);
            ctx.lineTo(particles[j].x, particles[j].y + particles[j].bumpOff);
            ctx.stroke();
        }
    }

    ctx.restore();
    requestAnimationFrame(animate);
}

init();
requestAnimationFrame(animate);

/* ── Secret vault ── */
const nameEl = document.getElementById('name-trigger');
const hintEl = document.getElementById('secret-hint');
const backdrop = document.getElementById('vault-backdrop');
const panel = document.getElementById('vault-panel');
const NEEDED = 5;
let clicks = 0, resetTimer = null;
const dots = ['· · · · ·', '· · · ·', '· · ·', '· ·', '·'];

nameEl.addEventListener('click', (e) => {
    spawnSparks(e.clientX, e.clientY);
    clicks++;
    clearTimeout(resetTimer);
    if (clicks >= NEEDED) {
        clicks = 0;
        hintEl.textContent = '';
        hintEl.classList.remove('show');
        openVault();
    } else {
        hintEl.textContent = dots[clicks - 1] || '';
        hintEl.classList.add('show');
        resetTimer = setTimeout(() => {
            clicks = 0;
            hintEl.textContent = '';
            hintEl.classList.remove('show');
        }, 3000);
    }
});

function spawnSparks(cx, cy) {
    const count = 10;
    const hues = [240, 260, 280, 220, 300];
    for (let i = 0; i < count; i++) {
        const el = document.createElement('span');
        el.classList.add('spark');
        const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.6;
        const dist = 30 + Math.random() * 50;
        const hue = hues[Math.floor(Math.random() * hues.length)];
        el.style.left = cx + 'px';
        el.style.top = cy + 'px';
        el.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
        el.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
        el.style.background = `hsla(${hue}, 90%, 75%, 0.9)`;
        el.style.width = (3 + Math.random() * 4) + 'px';
        el.style.height = el.style.width;
        el.style.animationDuration = (0.5 + Math.random() * 0.4) + 's';
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove());
    }
}

function openVault() {
    backdrop.classList.add('open');
    panel.classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeVault() {
    backdrop.classList.remove('open');
    panel.classList.remove('open');
    document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeVault(); });

/* ── Vault switches ──
   The background picker builds itself from BG_VARIANTS, so a new variant
   turns up here for free. "Rotate" is the default, and while it is on, the
   chip of the palette currently showing is outlined rather than filled —
   it is what you have, not what you picked. The two switches under it are
   plain on/off. */
const bgChips = document.getElementById('vault-bg-chips');
const bgDesc = document.getElementById('vault-bg-desc');

function buildBgChips() {
    const chip = (id, label) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'vault-opt-chip';
        b.dataset.bgPick = id;
        b.textContent = label;
        return b;
    };
    BG_VARIANTS.forEach(v => bgChips.appendChild(chip(v.id, v.label)));
    bgChips.appendChild(chip(BG_ROTATE, 'Rotate'));
    bgChips.addEventListener('click', e => {
        const btn = e.target.closest('[data-bg-pick]');
        if (btn) bgSetMode(btn.dataset.bgPick);
    });
}

function syncBgChips() {
    const rotating = bgMode === BG_ROTATE;
    for (const btn of bgChips.children) {
        const id = btn.dataset.bgPick;
        btn.setAttribute('aria-pressed', String(id === bgMode));
        btn.dataset.live = String(rotating && id === bgCurrent);
    }
    bgDesc.textContent = rotating
        ? 'The grid stays; the colour turns over on the next load. Pick one to hold it.'
        : 'Held for this tab. Rotate puts it back in the cycle; a new tab starts over.';
}

if (bgChips && bgDesc) {
    buildBgChips();
    syncBgChips();
    document.addEventListener('bg:change', syncBgChips);
}

/* A generic on/off pair: two chips, a getter for the current value and a
   setter, plus the line of copy under the title. */
function wireVaultSwitch(chipsId, descId, dataKey, isOn, set, describe) {
    const chips = document.getElementById(chipsId);
    const desc = document.getElementById(descId);
    if (!chips || !desc) return null;

    chips.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (btn && btn.dataset[dataKey] !== undefined) set(btn.dataset[dataKey] === '1');
    });

    // The setter fires its own change event, which is what calls this back.
    return function sync() {
        for (const btn of chips.children) {
            btn.setAttribute('aria-pressed', String((btn.dataset[dataKey] === '1') === isOn()));
        }
        desc.textContent = describe();
    };
}

const syncFieldChips = wireVaultSwitch(
    'vault-field-chips', 'vault-field-desc', 'fieldPick',
    () => scrollReactiveField,
    on => setScrollReactiveField(on),
    () => scrollReactiveField
        ? 'The constellation drifts with the page. Prettier, and it costs frames while you scroll.'
        : 'The constellation stays put while you scroll. Cheaper, and the field can never slide off the page.'
);
if (syncFieldChips) {
    syncFieldChips();
    document.addEventListener('scrollfield:change', syncFieldChips);
}

const syncFpsChips = wireVaultSwitch(
    'vault-fps-chips', 'vault-fps-desc', 'fpsPick',
    () => fpsMeterOn,
    on => setFpsMeter(on),
    () => 'Frames per second and the quality tier, bottom-right. The page steps itself down to '
        + PERF_TIERS.slice(1).join(' then ') + ' if it cannot hold the rate.'
);
if (syncFpsChips) {
    syncFpsChips();
    document.addEventListener('fpsmeter:change', syncFpsChips);
    document.addEventListener('perf:tier', syncFpsChips);
}

/* The About card is a button, not a link: it opens in place instead of
   leaving the page. Opening does three things at once — the card lifts out
   of the grid and grows to a centred panel, it flips to its back face, and
   the page behind it blurs out.

   The grow is a FLIP: freeze the card at its current grid rect as
   position:fixed, drop a same-sized placeholder into the cell it vacated so
   the grid doesn't reflow, then set the target rect and let CSS transition
   the four geometry properties. Closing animates back to wherever the
   placeholder now sits (the page may have been resized) and only then
   restores the card to the flow.

   The card is reparented to <body> while open, and that move is load-
   bearing. `.grid` animates in with `fadeInUp ... both`, whose final
   keyframe leaves a `transform: translateY(0)` on it permanently. A
   non-none transform makes an element both a stacking context and the
   containing block for fixed-position descendants, so left in the grid the
   panel would be positioned against the grid box instead of the viewport
   AND painted underneath the backdrop, since its z-index would be scoped
   inside the grid. Escaping to <body> is what makes fixed mean fixed. */
/* Flip cards. Any .flip-card works the same way: its .flip-open button turns
   the card over and expands it to a centred panel over a blurred page, and
   any [data-flip-close] control, the backdrop or Escape puts it back.

   Opening is a FLIP. Freeze the card at its grid rect, drop a same-sized
   placeholder into the cell it vacates so the grid does not reflow, reparent
   it to <body> (the grid keeps a transform from its fadeIn animation, which
   would otherwise make it the containing block and stacking context for a
   fixed-position child), land the final geometry instantly, then animate
   transform from the inverse of that back to identity. Transform only, so
   the browser composites it instead of re-laying-out every frame. */
const flipBackdrop = document.getElementById('about-backdrop');
const OPEN_MS = 620;
const CLOSE_MS = 450;

let openCard = null;
let openPlaceholder = null;
let openRect = null;
let flipTimer = null;

function inverseTransform(from, to) {
    const sx = from.width / to.w;
    const sy = from.height / to.h;
    const dx = (from.left + from.width / 2) - (to.left + to.w / 2);
    const dy = (from.top + from.height / 2) - (to.top + to.h / 2);
    return `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
}

/* How tall the copy on the back face comes out at a given panel width.
   The back face is inset:0 inside a card whose height we blank first, so
   what is left is the content's own height. The write-then-read is a
   forced reflow on purpose; it runs before anything paints, and the
   card's own inline geometry is put back before it returns. Measuring at
   the *target* width matters — that is the width the text will wrap to,
   and the answer is meaningless at any other. */
function backContentHeight(card, w) {
    const backFace = card.querySelector('.card-face-back');
    if (!backFace) return 0;
    const prevW = card.style.width, prevH = card.style.height;
    card.style.width = w + 'px';
    card.style.height = 'auto';
    const h = backFace.scrollHeight;
    card.style.width = prevW;
    card.style.height = prevH;
    return h;
}

/* Width is whatever the viewport can spare; height is whatever the back
   face needs at that width, capped by the screen. Both come from the
   content rather than from constants, so a panel is exactly as tall as
   what is in it and nobody has to re-tune a number when the copy changes
   or a card gains a screenshot.

   The desktop branch used to derive its height from the card's aspect
   ratio instead, which is fine only while every back face happens to be
   the same shape as its front. It is not: the dimension picker is two
   options and a heading, and opened as a tall box with a hole in the
   bottom; the preview backs are a 800x420 shot plus a paragraph and a
   button, and wanted more. */
function flipTargetRect(card) {
    const isMobile = window.innerWidth <= 640;
    /* 520 was a phone number that a desktop inherited: on a 1080p screen
       it left the screenshot smaller than the card it came from. The
       panel now takes a share of the width it is actually given, floored
       at the old value so nothing shrinks, and capped at 820 — past that
       the 800px-wide shot would be upscaled, and a blurry preview is
       worse than a small one. */
    const w = isMobile
        ? Math.min(520, window.innerWidth - 24)
        : Math.min(820, Math.max(520, window.innerWidth * 0.52), window.innerWidth - 36);
    const maxH = window.innerHeight - (isMobile ? 32 : 40);
    const h = Math.min(maxH, Math.max(200, backContentHeight(card, w) + 6));

    const top = (window.innerHeight - h) / 2;
    const left = (window.innerWidth - w) / 2;
    return { w, h, top, left };
}

function setFlipRect(card, top, left, w, h) {
    card.style.top = top + 'px';
    card.style.left = left + 'px';
    card.style.width = w + 'px';
    card.style.height = h + 'px';
}

/* Puts the open card back in its cell and clears all open state. Safe to call
   at any time; with nothing open it does nothing. This is what makes open and
   close re-entrant, and it must be flushed rather than cancelled. */
function restoreFlip(fade) {
    clearTimeout(flipTimer);
    flipTimer = null;
    stopPeekShow();
    if (!openCard) return;

    const card = openCard;
    card.classList.remove('is-open', 'is-closing', 'is-flipped');
    ['top', 'left', 'width', 'height', 'transition', 'transform']
        .forEach(prop => card.style.removeProperty(prop));
    card.querySelector('.flip-open').setAttribute('aria-expanded', 'false');

    if (openPlaceholder) {
        openPlaceholder.parentNode.insertBefore(card, openPlaceholder);
        openPlaceholder.remove();
    }

    if (fade) {
        card.classList.add('just-restored');
        card.addEventListener('animationend', function done() {
            card.classList.remove('just-restored');
            card.removeEventListener('animationend', done);
        });
    }

    openCard = null;
    openPlaceholder = null;
    openRect = null;
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    // The card is back in the grid, so the tilt loop's cached geometry
    // (its own included) needs re-measuring.
    document.dispatchEvent(new CustomEvent('flip:change'));
}

/* Every card's screenshots together are most of a megabyte that nobody
   has asked for yet, so they are
   held in data-src and fetched the first time a card is turned over —
   or, on a machine with a pointer, the moment the cursor reaches the
   card, which is far enough ahead of the click that the image is
   usually decoded before the flip finishes. The frame around it is
   sized by aspect-ratio either way, so a slow one costs nothing but a
   fade. */
function loadPeek(card) {
    card.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        if (img.complete) img.classList.add('is-loaded');
        else img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
    });
}

/* ── A card whose back holds more than one screenshot ────────────────
   Marked up as a plain stack of <img>; everything that makes it a slide
   show is added here, so with the script off the card still shows its
   first shot rather than three of them piled up. The interval only runs
   while a panel is open — there is exactly one of those at a time, so
   there is exactly one timer, cleared on close. */
const SHOT_MS = 2600;
// The tilt loop keeps its own copy of this inside its closure; the flip
// code is a different scope and needs its own handle on the same query.
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let peekShow = null;

function stopPeekShow() {
    if (!peekShow) return;
    clearInterval(peekShow);
    peekShow = null;
}

function startPeekShow(card) {
    stopPeekShow();
    /* A card back usually has one frame; the golf picker has two, one
       per game. Each runs its own deck, and they take turns on a
       half-beat so the panel never changes both pictures at once. */
    const decks = [...card.querySelectorAll('.peek-shot, .dim-shot')]
        .map(dealPeekDeck).filter(Boolean);
    if (!decks.length || reducedMotionQuery.matches) return;

    let turn = 0;
    peekShow = setInterval(() => {
        decks[turn % decks.length]();
        turn++;
    }, SHOT_MS / decks.length);
}

// Sets one frame up as a slide show and returns its "next shot", or
// null for a frame with a single picture in it.
function dealPeekDeck(shot) {
    const imgs = [...shot.querySelectorAll('img')];
    if (imgs.length < 2) return null;

    shot.classList.add('peek-shot-multi');

    let dots = shot.querySelector('.peek-dots');
    if (!dots) {
        dots = document.createElement('div');
        dots.className = 'peek-dots';
        dots.setAttribute('aria-hidden', 'true');
        imgs.forEach(() => dots.appendChild(document.createElement('span')).className = 'peek-dot');
        shot.appendChild(dots);
    }
    const dotEls = [...dots.children];

    /* Only the first shot carries alt text once they are a set: a screen
       reader wants one description of the picture, not three read out as
       the timer moves. */
    imgs.forEach((img, i) => {
        if (i > 0) img.alt = '';
        img.classList.toggle('is-current', i === 0);
    });
    dotEls.forEach((d, i) => d.classList.toggle('is-current', i === 0));

    let i = 0;
    return () => {
        imgs[i].classList.remove('is-current');
        dotEls[i].classList.remove('is-current');
        i = (i + 1) % imgs.length;
        imgs[i].classList.add('is-current');
        dotEls[i].classList.add('is-current');
    };
}

function openFlip(card) {
    if (openCard === card) return;
    loadPeek(card);

    // A close may still be running with its restore queued. Finish it rather
    // than cancelling it: the placeholder is positioned from the card's
    // parentNode, and mid-close that parent is still <body>.
    restoreFlip(false);

    // After the restore, never before it: restoreFlip stops the slide show
    // as part of tearing down whatever was open, and started above it would
    // clear the timer it had just set.
    startPeekShow(card);

    const r = card.getBoundingClientRect();
    openPlaceholder = document.createElement('div');
    openPlaceholder.className = 'flip-placeholder';
    openPlaceholder.style.height = r.height + 'px';
    openPlaceholder.style.width = r.width + 'px';
    card.parentNode.insertBefore(openPlaceholder, card);
    document.body.appendChild(card);
    openCard = card;

    // Clear tilt properties
    ['--rx', '--ry', '--ty', '--mag'].forEach(prop => card.style.removeProperty(prop));
    card.classList.add('is-open');

    // Measured with same proportions
    const t = flipTargetRect(card);
    openRect = t;

    // Start at initial grid rect
    setFlipRect(card, r.top, r.left, r.width, r.height);
    card.getBoundingClientRect(); // flush start state

    // Animate top, left, width, height smoothly for a rich zoom-in to middle of screen
    card.style.transition = 'top 0.55s cubic-bezier(0.22, 1, 0.36, 1), left 0.55s cubic-bezier(0.22, 1, 0.36, 1), width 0.55s cubic-bezier(0.22, 1, 0.36, 1), height 0.55s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.55s ease';
    setFlipRect(card, t.top, t.left, t.w, t.h);

    card.classList.add('is-flipped');
    flipBackdrop.classList.add('open');
    card.querySelector('.flip-open').setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    // Locking the scrollbar reflows the grid, so cached card geometry is stale.
    document.dispatchEvent(new CustomEvent('flip:change'));
}

function closeFlip() {
    if (!openCard) return;
    const card = openCard;
    clearTimeout(flipTimer);
    stopPeekShow();

    if (!openPlaceholder) { restoreFlip(false); return; }

    const p = openPlaceholder.getBoundingClientRect();
    card.classList.add('is-closing');
    card.style.transition = 'top 0.48s cubic-bezier(0.4, 0, 0.2, 1), left 0.48s cubic-bezier(0.4, 0, 0.2, 1), width 0.48s cubic-bezier(0.4, 0, 0.2, 1), height 0.48s cubic-bezier(0.4, 0, 0.2, 1)';
    setFlipRect(card, p.top, p.left, p.width, p.height);
    card.classList.remove('is-flipped');
    flipBackdrop.classList.remove('open');
    card.querySelector('.flip-open').setAttribute('aria-expanded', 'false');

    flipTimer = setTimeout(() => restoreFlip(false), 480);
}

document.querySelectorAll('.flip-card').forEach(card => {
    card.querySelector('.flip-open').addEventListener('click', () => openFlip(card));
    card.addEventListener('pointerenter', () => loadPeek(card), { once: true });
    card.querySelectorAll('[data-flip-close]').forEach(el => {
        el.addEventListener('click', closeFlip);
    });
});
flipBackdrop.addEventListener('click', closeFlip);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeFlip(); });
window.addEventListener('resize', () => {
    if (!openCard) return;
    const t = flipTargetRect(openCard);
    openRect = t;
    setFlipRect(openCard, t.top, t.left, t.w, t.h);
});

let toastTimer;
function showToast(msg) {
    let toast = document.getElementById('secret-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'secret-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    clearTimeout(toastTimer);
    toast.classList.remove('show');
    void toast.offsetWidth; // restart transition
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ── Card tilt + glare ──
   Every card gets a gentle 3D tilt + colored glare. Three sources feed it,
   highest-priority first:
     1. Direct interaction — mouse hover or a finger on the card. Always wins.
     2. Ambient, mobile only, when nothing is being touched:
        a) accelerometer tilt, relative to a "neutral" holding angle that's
           captured on first reading and then slowly drifts to track wherever
           the phone actually settles (no hardcoded "held at 45°" assumption,
           and a deliberate tilt relaxes back to center after a few seconds).
        b) a scroll-linked bend, vertical only — a card leans back or forward
           as its centre nears the bottom or top edge of the screen, and stays
           flat while it is anywhere near the middle, so the tilt belongs to
           the cards arriving and leaving rather than to all of them at once.
        Both (a) and (b) are additive.
   CargoLander gets a bigger tilt range plus the rainbow holo layer on top,
   which rides the same --mag value as everything else.

   Performance note — this loop is the page's hottest path on a phone, so
   three things keep it off the scroll critical path:
     • Geometry is cached, never measured inside a frame. Measuring meant a
       getBoundingClientRect() per card interleaved with the style writes
       below, which forces a synchronous layout for every card, every frame.
     • Cards outside the viewport are skipped — on mobile the grid is one
       column, so most of them are.
     • A settled card is left alone. The lerp approaches its target
       asymptotically and never quite arrives, so without a dead zone every
       card keeps rewriting its custom properties (and repainting a
       backdrop-filtered surface with a gradient overlay on top) long after
       it has visibly stopped moving. ── */
(function () {
    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

    const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const cardState = new Map(); // card -> state object

    function applyVars(card, s) {
        card.style.setProperty('--rx', s.currentRx.toFixed(2) + 'deg');
        card.style.setProperty('--ry', s.currentRy.toFixed(2) + 'deg');
        card.style.setProperty('--ty', s.currentTy.toFixed(1) + 'px');
        card.style.setProperty('--mx', s.currentMx.toFixed(1) + '%');
        card.style.setProperty('--my', s.currentMy.toFixed(1) + '%');
        card.style.setProperty('--mag', s.currentMag.toFixed(2));
        s.wroteRx = s.currentRx; s.wroteRy = s.currentRy; s.wroteTy = s.currentTy;
        s.wroteMx = s.currentMx; s.wroteMy = s.currentMy; s.wroteMag = s.currentMag;
    }

    /* Below these the change is invisible, so it isn't worth a repaint.
       A degraded page widens the band: a repaint costs more there, so it
       takes a bigger movement to be worth one. */
    function needsWrite(s) {
        const k = perfTier === 0 ? 1 : perfTier === 1 ? 3 : 8;
        return Math.abs(s.currentRx - s.wroteRx) > 0.05 * k
            || Math.abs(s.currentRy - s.wroteRy) > 0.05 * k
            || Math.abs(s.currentTy - s.wroteTy) > 0.05 * k
            || Math.abs(s.currentMx - s.wroteMx) > 0.15 * k
            || Math.abs(s.currentMy - s.wroteMy) > 0.15 * k
            || Math.abs(s.currentMag - s.wroteMag) > 0.005 * k;
    }

    function getOrCreateState(card, maxTilt, lift) {
        let state = cardState.get(card);
        if (!state) {
            state = {
                maxTilt, lift,
                hovered: false,
                targetRx: 0, targetRy: 0, targetTy: 0,
                targetMx: 50, targetMy: 50, targetMag: 0,
                currentRx: 0, currentRy: 0, currentTy: 0,
                currentMx: 50, currentMy: 50, currentMag: 0,
                // Last values actually pushed to the element, so the frame
                // loop can tell a settled card from a moving one.
                wroteRx: 0, wroteRy: 0, wroteTy: 0,
                wroteMx: 50, wroteMy: 50, wroteMag: 0,
                // Cached geometry, in document coordinates (see measureAll).
                docTop: 0, height: 0, docLeft: 0, width: 0
            };
            cardState.set(card, state);
        } else {
            state.maxTilt = maxTilt;
            state.lift = lift;
        }
        return state;
    }

    function attachTilt(card, { maxTilt = 10, lift = -8 } = {}) {
        const state = getOrCreateState(card, maxTilt, lift);

        function fromPoint(clientX, clientY) {
            if (card.classList.contains('is-open')) return;
            const rect = card.getBoundingClientRect();
            const px = clamp((clientX - rect.left) / rect.width, 0, 1);
            const py = clamp((clientY - rect.top) / rect.height, 0, 1);
            state.targetRx = clamp((0.5 - py) * maxTilt * 2, -maxTilt, maxTilt);
            state.targetRy = clamp((px - 0.5) * maxTilt * 2, -maxTilt, maxTilt);
            state.targetTy = lift;
            state.targetMx = 5 + px * 90;
            state.targetMy = 5 + py * 90;
            state.targetMag = clamp((Math.abs(state.targetRx) + Math.abs(state.targetRy)) / (2 * maxTilt), 0, 1);
        }

        function activate() {
            if (card.classList.contains('is-open')) return;
            state.hovered = true;
            if (typeof activateCardTheme === 'function') {
                activateCardTheme(card.id);
            }
        }

        function release() {
            if (card.classList.contains('is-open')) return;
            state.hovered = false;
            if (typeof deactivateCardTheme === 'function') deactivateCardTheme();
        }

        card.addEventListener('mouseenter', activate);
        card.addEventListener('mousemove', (e) => fromPoint(e.clientX, e.clientY));
        card.addEventListener('mouseleave', release);

        card.addEventListener('touchstart', (e) => {
            activate();
            // A touch that starts a scroll keeps delivering touchmove to
            // whichever card it began on, so without this a reduced-motion
            // user still gets the card skewed around for the length of the
            // scroll gesture — the one thing this setting asked to avoid.
            if (reduceMotion.matches) return;
            if (e.touches[0]) fromPoint(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        card.addEventListener('touchmove', (e) => {
            if (reduceMotion.matches) return;
            if (e.touches[0]) fromPoint(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        card.addEventListener('touchend', release);
        card.addEventListener('touchcancel', release);
    }

    // Queried once. The grid is static markup, so re-querying every frame
    // only allocated a NodeList 60 times a second.
    const cards = Array.from(document.querySelectorAll('.card'));

    cards.forEach((card) => {
        const hasMaxSway = card.id === 'card-cargo-lander' || card.id === 'card-supply-chain';
        const isDry = card.id === 'card-cv';
        attachTilt(card, {
            maxTilt: hasMaxSway ? 15 : (isDry ? 7 : 10),
            lift: hasMaxSway ? -12 : (isDry ? -5 : -8)
        });
    });

    /* Geometry cache. The frame loop needs each card's position to work out
       its scroll bend, but measuring inside the loop forces a layout per
       card per frame. Card positions only change when the page reflows, so
       measure on those events instead and derive the viewport position from
       window.scrollY, which is free. */
    let geometryStale = true;

    function measureAll() {
        const sy = window.scrollY, sx = window.scrollX;
        for (const card of cards) {
            const s = cardState.get(card);
            if (!s || card.classList.contains('is-open')) continue;
            const r = card.getBoundingClientRect();
            s.docTop = r.top + sy;
            s.docLeft = r.left + sx;
            s.height = r.height;
            s.width = r.width;
        }
        geometryStale = false;
    }

    function invalidateGeometry() { geometryStale = true; }

    window.addEventListener('resize', invalidateGeometry);
    window.addEventListener('orientationchange', invalidateGeometry);
    window.addEventListener('load', invalidateGeometry);
    // A flip opening or closing pulls a card out of the grid and puts it back.
    document.addEventListener('flip:change', invalidateGeometry);
    // So does a shelf folding or unfolding above it.
    document.addEventListener('shelf:change', invalidateGeometry);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(invalidateGeometry).catch(() => {});
    }
    // High-score chips land after first paint and change card heights.
    setTimeout(invalidateGeometry, 0);

    /* ── Shape of the scroll bend ──
       The bend is vertical only: a card leans back or forward (rotateX) as its
       centre approaches the bottom or top edge of the screen, and nothing rocks
       it sideways. It also stays flat through the middle of the screen — the
       DEADZONE is the fraction of the half-viewport, measured out from the
       centre, in which a card gets no bend at all. Past that it ramps to full
       tilt at the very edge, so the effect belongs to the cards arriving and
       leaving rather than to every card all the time. */
    const SCROLL_BEND_FRACTION = 1.4;   // full-tilt multiple of the card's maxTilt
    const SCROLL_BEND_POWER = 1.6;      // >1 eases in, so the bend arrives gently
    const SCROLL_BEND_DEADZONE = 0.35;  // middle 35% of each half stays flat
    // Sideways rock from the accelerometer, kept as a trace of its old self so
    // the grid still answers to the phone without the bend reading as a wobble.
    const AMBIENT_ROLL_FRACTION = 0.25;
    const BASELINE_HALFLIFE_S = 3;
    // A phone does not need the ambient bend recomputed 60 times a second;
    // it is a slow, broad curve and halving the rate halves the style work.
    const MOBILE_FRAME_MS = 1000 / 30;
    /* Same idea applied to a desktop that turns out to be struggling. Each
       write here repaints a backdrop-filtered surface with a blended
       gradient on top of it, so the rate this loop runs at is a direct
       multiplier on the page's most expensive paint. */
    const TILT_FRAME_MS_BY_TIER = [0, 1000 / 30, 1000 / 20];
    // How far outside the viewport a card still gets updated, so it is already
    // in the right position by the time it scrolls into view.
    const OFFSCREEN_MARGIN = 120;
    let lastFrame = 0;

    let lastBeta = null, lastGamma = null;
    let baselineBeta = null, baselineGamma = null;
    let lastTick = null;

    function onOrientation(e) {
        if (e.beta === null || e.gamma === null) return;
        lastBeta = e.beta;
        lastGamma = e.gamma;
        if (baselineBeta === null) { baselineBeta = e.beta; baselineGamma = e.gamma; }
    }

    function ambientTick(now) {
        const isMobileView = isTouch || window.innerWidth <= 640;

        // Throttle on mobile, and on anything the governor has stepped down.
        // Return before touching lastTick so the accelerometer baseline
        // still integrates over real elapsed time.
        const frameBudget = Math.max(
            isMobileView ? MOBILE_FRAME_MS : 0,
            TILT_FRAME_MS_BY_TIER[perfTier]
        );
        if (frameBudget && now - lastFrame < frameBudget) {
            requestAnimationFrame(ambientTick);
            return;
        }
        lastFrame = now;

        const dt = lastTick === null ? 0 : Math.min((now - lastTick) / 1000, 0.25);
        lastTick = now;

        if (geometryStale) measureAll();

        const viewportH = window.innerHeight;
        const viewportCenter = viewportH / 2;
        const scrollTop = window.scrollY;

        let deltaBeta = 0, deltaGamma = 0;
        if (isMobileView && lastBeta !== null) {
            if (dt > 0) {
                const drift = 1 - Math.pow(0.5, dt / BASELINE_HALFLIFE_S);
                baselineBeta += (lastBeta - baselineBeta) * drift;
                baselineGamma += (lastGamma - baselineGamma) * drift;
            }
            deltaBeta = clamp(lastBeta - baselineBeta, -45, 45);
            deltaGamma = clamp(lastGamma - baselineGamma, -45, 45);
        }

        for (const card of cards) {
            if (card.classList.contains('is-open')) continue;
            const state = cardState.get(card) || getOrCreateState(card, 10, -8);
            const { maxTilt } = state;

            // Cached geometry, shifted into the viewport by the scroll offset.
            const top = state.docTop - scrollTop;
            const left = state.docLeft - window.scrollX;

            // Nothing to see, and nothing that needs to settle either.
            if (!state.hovered
                && top + state.height < -OFFSCREEN_MARGIN
                && !needsWrite(state)) continue;
            if (!state.hovered
                && top > viewportH + OFFSCREEN_MARGIN
                && !needsWrite(state)) continue;

            if (!state.hovered) {
                if (isMobileView && reduceMotion.matches) {
                    // Ambient sway, the scroll bend, and direct touch tilt
                    // (attachTilt's touchmove handler, above) all bail under
                    // reduced motion, so an untouched or just-released card
                    // settles flat here rather than holding whatever tilt a
                    // scroll-by-touch left it at.
                    state.targetRx = 0;
                    state.targetRy = 0;
                    state.targetTy = 0;
                    state.targetMx = 50;
                    state.targetMy = 50;
                    state.targetMag = 0;
                } else if (isMobileView) {
                    const accelRx = clamp(deltaBeta * -0.3, -maxTilt, maxTilt);
                    const accelRy = clamp(deltaGamma * 0.3 * AMBIENT_ROLL_FRACTION,
                        -maxTilt, maxTilt);

                    // -1 at the top edge of the screen, 0 at the middle, +1 at
                    // the bottom, measured from the card's centre.
                    const centerY = top + state.height / 2;
                    const norm = clamp((centerY - viewportCenter) / Math.max(viewportCenter, 1), -1, 1);
                    // Flat through the dead zone, then remapped so the ramp
                    // starts from nothing at its edge and reaches full tilt at
                    // the screen edge.
                    const ramp = clamp(
                        (Math.abs(norm) - SCROLL_BEND_DEADZONE) / (1 - SCROLL_BEND_DEADZONE),
                        0, 1);
                    const eased = Math.sign(norm) * Math.pow(ramp, SCROLL_BEND_POWER);
                    const bend = eased * maxTilt * SCROLL_BEND_FRACTION;

                    // The bend goes to the transform, which is the visible
                    // effect and is nearly free: --rx/--ry/--ty are
                    // inherits:false and feed nothing but this card's own
                    // transform, so the compositor takes it from here.
                    state.targetRx = clamp(accelRx + bend, -16, 16);
                    state.targetRy = accelRy;
                    state.targetTy = Math.abs(eased) * -3;

                    /* The three glare variables deliberately do NOT take the
                       bend. They have to stay inherited (pseudo-elements can't
                       see an inherits:false property — the glare and holo
                       layers are ::before/::after, and .card-face's glare is a
                       level further down), so every write marks a whole card
                       subtree for recalc. They also position gradients rather
                       than move a layer, so a write repaints the card, re-runs
                       the holo overlay blend and re-blurs its backdrop.

                       Feeding scroll into them meant paying all of that on
                       every frame of every scroll — for a shift in sheen that
                       is imperceptible while the page is moving. Driven by the
                       finger and the phone's tilt instead, they hold still
                       during a scroll and the writes stop altogether, and the
                       glare itself is exactly as it was: full tracking under a
                       fingertip, full response when the phone tilts. */
                    state.targetMag = clamp((Math.abs(accelRx) + Math.abs(accelRy)) / 20, 0, 1);
                    state.targetMx = clamp(50 + deltaGamma * 1.1, 5, 95);
                    state.targetMy = clamp(50 + deltaBeta * 1.1, 5, 95);
                } else if (mouse.active && mouse.presence > 0.001 && mouse.smoothX !== null && mouse.smoothY !== null) {
                    // Desktop PC ambient magnetic cursor tilt: cards react subtly to mouse movement outside cards
                    const cardCenterX = left + state.width / 2;
                    const cardCenterY = top + state.height / 2;
                    const dx = mouse.smoothX - cardCenterX;
                    const dy = mouse.smoothY - cardCenterY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    const ambientMax = Math.min(4, maxTilt * 0.4);
                    const factor = clamp(1 - dist / 900, 0.15, 1.0) * mouse.presence;

                    state.targetRx = clamp((-dy / 450) * ambientMax * factor, -ambientMax, ambientMax);
                    state.targetRy = clamp((dx / 450) * ambientMax * factor, -ambientMax, ambientMax);
                    state.targetTy = 0;
                    state.targetMag = clamp((Math.abs(state.targetRx) + Math.abs(state.targetRy)) / (2 * maxTilt), 0, 0.35) * mouse.presence;

                    state.targetMx = clamp(50 + (dx / Math.max(state.width, 1)) * 35, 8, 92);
                    state.targetMy = clamp(50 + (dy / Math.max(state.height, 1)) * 35, 8, 92);
                } else {
                    // Mouse is outside screen (and delay expired) -> return to neutral 0 tilt and 50% center glare
                    state.targetRx = 0;
                    state.targetRy = 0;
                    state.targetTy = 0;
                    state.targetMx = 50;
                    state.targetMy = 50;
                    state.targetMag = 0;
                }
            }

            // On-screen tracking is crisp and responsive; slow decay is strictly for leaving the window
            const isOffScreenDecay = !mouse.active && !state.hovered;
            let lerpSpeed = state.hovered ? 0.18 : (isOffScreenDecay ? 0.04 : 0.15);
            // Half the frames means each one has to cover twice the ground,
            // or the bend visibly trails the scroll.
            if (isMobileView) lerpSpeed = Math.min(1, lerpSpeed * 2);
            state.currentRx += (state.targetRx - state.currentRx) * lerpSpeed;
            state.currentRy += (state.targetRy - state.currentRy) * lerpSpeed;
            state.currentTy += (state.targetTy - state.currentTy) * lerpSpeed;
            state.currentMx += (state.targetMx - state.currentMx) * lerpSpeed;
            state.currentMy += (state.targetMy - state.currentMy) * lerpSpeed;
            state.currentMag += (state.targetMag - state.currentMag) * lerpSpeed;

            if (needsWrite(state)) applyVars(card, state);
        }

        requestAnimationFrame(ambientTick);
    }

    requestAnimationFrame(ambientTick);

    if (window.DeviceOrientationEvent) {
        function enableOrientation() {
            window.addEventListener('deviceorientation', onOrientation);
        }

        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+ requires a user gesture; piggyback on the first touch anywhere on the page.
            const requestOnce = () => {
                document.removeEventListener('touchend', requestOnce);
                DeviceOrientationEvent.requestPermission()
                    .then(state => { if (state === 'granted') enableOrientation(); })
                    .catch(() => {});
            };
            document.addEventListener('touchend', requestOnce, { once: true });
        } else {
            enableOrientation();
        }
    }

    /* ── The card you are on ─────────────────────────────────────────
       A phone has no hover, so nothing in this grid was ever singled
       out. This marks whichever card is nearest the middle of the
       screen, and the CSS above brings it forward and takes the page's
       background hue with it.

       One frame of work per scroll frame, and nothing in it touches
       layout: a class swap that drives a transform, an opacity and a
       hue that is already on an 0.8s lerp of its own. That is a
       deliberate ceiling. The version before this also expanded the
       card once the scroll went still, which meant re-laying-out the
       column a beat after the finger left the glass — the one moment
       where anything moving reads as the page lagging rather than
       answering. Cheap enough to do every frame beats clever enough to
       need its own moment. ── */
    const mobileFocusMQ = window.matchMedia('(max-width: 640px)');
    const FOCUS_HYSTERESIS = 26;  // px a rival must win by to take focus

    let focusActive = false;
    let focusedCard = null;
    let focusRaf = 0;

    function nearestCard() {
        const viewportH = window.innerHeight;
        const mid = viewportH / 2;
        let best = null, bestDist = Infinity;

        for (const card of cards) {
            if (card.classList.contains('is-open')) continue;
            if (card.closest('.shelf.is-collapsed')) continue;
            const r = card.getBoundingClientRect();
            if (r.bottom < 0 || r.top > viewportH) continue;
            const dist = Math.abs(r.top + r.height / 2 - mid);
            if (dist < bestDist) { bestDist = dist; best = card; }
        }

        /* Halfway between two cards the winner flips back and forth on a
           pixel of scroll, and every flip is a pair of class changes on
           backdrop-filtered surfaces. The card holding the detent keeps
           it until another is clearly closer. */
        if (best && focusedCard && best !== focusedCard) {
            const r = focusedCard.getBoundingClientRect();
            if (r.bottom > 0 && r.top < viewportH) {
                const held = Math.abs(r.top + r.height / 2 - mid);
                if (held - bestDist < FOCUS_HYSTERESIS) return focusedCard;
            }
        }
        return best;
    }

    /* The page's background hue follows the focused card. It needs no
       debounce of its own: --bg-color-1/2 and --hue are on an 0.8s
       transition, so a fast scroll past six cards is one hue chasing
       the finger rather than six flashes. Dwelling is what the theme's
       own THEME_DWELL_MS gate watches for before it spawns anything. */
    function setFocus(card) {
        if (card === focusedCard) return;
        if (focusedCard) focusedCard.classList.remove('is-focused');
        focusedCard = card;
        if (!card) {
            if (typeof deactivateCardTheme === 'function') deactivateCardTheme();
            return;
        }
        card.classList.add('is-focused');
        if (typeof activateCardTheme === 'function') activateCardTheme(card.id);
    }

    function refocus() {
        if (document.querySelector('.flip-card.is-open')) return;
        setFocus(nearestCard());
    }

    function onFocusScroll() {
        if (focusRaf) return;
        focusRaf = requestAnimationFrame(() => {
            focusRaf = 0;
            if (focusActive) setFocus(nearestCard());
        });
    }

    function enableFocus() {
        if (focusActive) return;
        focusActive = true;
        document.documentElement.classList.add('mobile-focus');
        window.addEventListener('scroll', onFocusScroll, { passive: true });
        refocus();
    }

    function disableFocus() {
        if (!focusActive) return;
        focusActive = false;
        window.removeEventListener('scroll', onFocusScroll);
        if (focusRaf) { cancelAnimationFrame(focusRaf); focusRaf = 0; }
        document.documentElement.classList.remove('mobile-focus');
        setFocus(null);
    }

    function syncFocusMode() {
        if (mobileFocusMQ.matches) enableFocus(); else disableFocus();
    }

    if (mobileFocusMQ.addEventListener) {
        mobileFocusMQ.addEventListener('change', syncFocusMode);
    } else if (mobileFocusMQ.addListener) {
        mobileFocusMQ.addListener(syncFocusMode);  // Safari < 14
    }
    window.addEventListener('resize', () => { if (focusActive) refocus(); });
    window.addEventListener('orientationchange', () => { if (focusActive) refocus(); });
    // A card leaving or rejoining the grid moves every card below it.
    document.addEventListener('flip:change', () => { if (focusActive) refocus(); });
    document.addEventListener('shelf:change', () => { if (focusActive) refocus(); });
    syncFocusMode();
})();
    </script>
    <script>
/* ── Idle delivery ───────────────────────────────────────────────────
   Leave the page alone for a while and a parcel drops onto one of the
   cards in view; a Cargo Lander comes down, lowers its chain, winches the
   parcel up and flies off with it. Click the parcel before the lander
   gets there and you sign for it yourself.

   This replaced the emoji that drifted across the background on hover.
   Those were drawn into the canvas, so they rode its frame budget and
   every card's backdrop blur with it, and they arrived on every visit
   whether anyone was looking or not. This only happens to someone who
   has stopped doing anything, runs on transforms alone, and leaves
   nothing behind when it is done.

   ?idle=N starts the first one N seconds in, for screenshots and tests. */
(function () {
    if (!('animate' in Element.prototype)) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const forced = parseFloat(new URLSearchParams(location.search).get('idle'));
    const FIRST_IDLE_MS = forced >= 0 ? forced * 1000 : 40000;
    const LATER_IDLE_MS = 120000;   // a second one has to be earned
    const MAX_PER_VISIT = 3;

    const PARCEL_SVG = '<svg viewBox="0 0 26 22" aria-hidden="true">'
        + '<path d="M2 7h22v13H2z" fill="#c08a4f" stroke="#5b3a1a" stroke-width="1.2" stroke-linejoin="round"/>'
        + '<path d="M1 3h24v4H1z" fill="#a8743d" stroke="#5b3a1a" stroke-width="1.2" stroke-linejoin="round"/>'
        + '<path d="M11 3h4v17h-4z" fill="#e8d5a8" opacity="0.85"/>'
        + '<path d="M4.5 11h4.5v3H4.5z" fill="#f8fafc" opacity="0.8"/></svg>';

    // The space truck from Cargo Lander, cut down: hull, dome, gold legs,
    // twin nozzles and the magnet plate the chain hangs from.
    const LANDER_SVG = '<svg viewBox="0 0 64 60" aria-hidden="true"><defs>'
        + '<linearGradient id="egg-hull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#64748b"/><stop offset="1" stop-color="#1e293b"/></linearGradient>'
        + '<linearGradient id="egg-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dd3fc"/><stop offset="1" stop-color="#0369a1"/></linearGradient>'
        + '<linearGradient id="egg-fire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbbf24"/><stop offset="0.4" stop-color="#ef6414" stop-opacity="0.75"/><stop offset="1" stop-color="#ef4444" stop-opacity="0"/></linearGradient>'
        + '</defs>'
        + '<g class="egg-flame"><path d="M19 35h6l-3 15z" fill="url(#egg-fire)"/><path d="M39 35h6l-3 15z" fill="url(#egg-fire)"/></g>'
        + '<g stroke-linecap="round"><path d="M17 29L8 45M47 29l9 16" stroke="#0f172a" stroke-width="4"/><path d="M17 29L8 45M47 29l9 16" stroke="#eab308" stroke-width="2"/></g>'
        + '<ellipse cx="8" cy="46" rx="5" ry="2" fill="#475569" stroke="#0f172a"/><ellipse cx="56" cy="46" rx="5" ry="2" fill="#475569" stroke="#0f172a"/>'
        + '<circle class="egg-nav" cx="8" cy="46" r="1.4" fill="#ef4444"/><circle class="egg-nav" cx="56" cy="46" r="1.4" fill="#10b981"/>'
        + '<path d="M19 33h6l-1 3h-4zM39 33h6l-1 3h-4z" fill="#0f172a"/>'
        + '<rect x="12" y="15" width="40" height="19" rx="6" fill="url(#egg-hull)" stroke="#0f172a" stroke-width="1.5"/>'
        + '<rect x="12.8" y="23" width="38.4" height="3" fill="#f97316"/>'
        + '<path d="M21 15.5a11 9 0 0 1 22 0z" fill="url(#egg-glass)" stroke="#0f172a" stroke-width="1.5"/>'
        + '<path d="M25 12a7 5 0 0 1 6-3.5" stroke="#fff" stroke-opacity="0.5" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
        + '<rect x="26" y="34" width="12" height="3" rx="1" fill="#0f172a"/></svg>';

    let shows = 0, running = false, idleTimer = null, abortShow = null;

    function arm() {
        clearTimeout(idleTimer);
        if (running || shows >= MAX_PER_VISIT) return;
        idleTimer = setTimeout(start, shows ? LATER_IDLE_MS : FIRST_IDLE_MS);
    }

    ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(type =>
        window.addEventListener(type, arm, { passive: true }));
    // A fold or a resize moves the card out from under the parcel.
    ['resize', 'shelf:change'].forEach(type =>
        (type === 'resize' ? window : document).addEventListener(type, () => abortShow && abortShow()));

    /* A card the whole of which is on screen, not folded away and not
       turned over — the parcel has to land somewhere you can see. */
    function pickCard() {
        if (document.querySelector('.flip-card.is-flipped, .flip-card.is-open')) return null;
        const top = 70, bottom = window.innerHeight - 20;
        const cards = Array.from(document.querySelectorAll('.shelf:not(.is-collapsed) .grid > .card')).filter(card => {
            const r = card.getBoundingClientRect();
            return r.width > 120 && r.top >= top && r.bottom <= bottom;
        });
        return cards.length ? cards[Math.floor(Math.random() * cards.length)] : null;
    }

    function el(cls, html) {
        const e = document.createElement('div');
        e.className = cls;
        if (html) e.innerHTML = html;
        return e;
    }

    const at = (x, y, extra) => `translate(${x}px, ${y}px)${extra ? ' ' + extra : ''}`;
    const wait = ms => new Promise(r => setTimeout(r, ms));

    async function start() {
        if (running || document.hidden || reduceMotion.matches) return arm();
        const card = pickCard();
        if (!card) return arm();
        running = true;
        shows++;

        const r = card.getBoundingClientRect();
        const sx = window.scrollX, sy = window.scrollY;
        const layer = el('');
        layer.id = 'idle-egg';
        layer.style.height = document.documentElement.scrollHeight + 'px';

        // Where the parcel comes to rest: on the card's top edge, somewhere
        // in its middle half.
        const px = r.left + sx + r.width * (0.25 + Math.random() * 0.5) - 13;
        const py = r.top + sy - 22;
        const parcel = el('egg-parcel', PARCEL_SVG);
        parcel.title = 'Sign for it';
        const puff = el('egg-puff');
        layer.append(puff, parcel);
        document.body.appendChild(layer);

        let signed = false, aborted = false;
        const live = new Set();
        const run = (node, frames, opts) => {
            const a = node.animate(frames, Object.assign({ fill: 'forwards' }, opts));
            live.add(a);
            return a.finished.catch(() => {}).finally(() => live.delete(a));
        };
        const stopped = () => signed || aborted;

        abortShow = () => {
            aborted = true;
            layer.style.display = 'none';
            live.forEach(a => a.cancel());
        };

        parcel.addEventListener('click', () => {
            if (signed || aborted) return;
            signed = true;
            // Only the parcel's own motion stops; a lander already on its
            // way finishes the approach and leaves empty-handed.
            parcel.getAnimations().forEach(a => a.cancel());
            const note = el('egg-note');
            note.textContent = 'Signed for ✓';
            layer.appendChild(note);
            run(note, [
                { transform: at(px - 22, py - 6), opacity: 0 },
                { transform: at(px - 22, py - 22), opacity: 1, offset: 0.25 },
                { transform: at(px - 22, py - 40), opacity: 0 }
            ], { duration: 1800, easing: 'ease-out' });
            run(parcel, [
                { transform: at(px, py), opacity: 1 },
                { transform: at(px, py - 6, 'scale(1.2)'), opacity: 0 }
            ], { duration: 350, easing: 'ease-out' });
        }, { once: true });

        // 1. The drop, from just above the top of the window.
        await run(parcel, [
            { transform: at(px, sy - 40, 'rotate(-25deg)') },
            { transform: at(px, py, 'rotate(4deg)'), easing: 'ease-out', offset: 0.72 },
            { transform: at(px, py - 7, 'rotate(-2deg)'), easing: 'ease-in', offset: 0.86 },
            { transform: at(px, py) }
        ], { duration: 950, easing: 'ease-in' });
        if (!stopped()) {
            run(puff, [
                { transform: at(px - 9, py + 16, 'scale(0.4)'), opacity: 0.9 },
                { transform: at(px - 9, py + 14, 'scale(1.6)'), opacity: 0 }
            ], { duration: 600, easing: 'ease-out' });
            await wait(1800);
        }

        // 2. The lander comes in from a side and parks above the parcel.
        let lander = null, chain = null;
        const fromLeft = px + 13 > (sx + window.innerWidth / 2);
        const CHAIN = 104;
        const lx = px + 13 - 32, ly = py - CHAIN - 37;
        const off = fromLeft ? -120 : window.innerWidth + 60;
        const tilt = fromLeft ? 1 : -1;
        if (!stopped()) {
            lander = el('egg-lander');
            const ship = el('egg-ship', LANDER_SVG);
            chain = el('egg-chain');
            chain.style.height = CHAIN + 'px';
            lander.append(chain, ship);
            layer.appendChild(lander);
            await run(lander, [
                { transform: at(sx + off, ly - 160, `rotate(${12 * tilt}deg)`) },
                { transform: at(lx, ly, `rotate(${-4 * tilt}deg)`), offset: 0.85 },
                { transform: at(lx, ly) }
            ], { duration: 2600, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' });
        }

        // 3. Chain down, then winch the parcel up into the clamps.
        if (!stopped()) await run(chain, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 650, easing: 'ease-out' });
        if (!stopped()) await wait(250);
        if (!stopped()) {
            parcel.style.pointerEvents = 'none';
            await Promise.all([
                run(chain, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], { duration: 1100, easing: 'ease-in-out' }),
                run(parcel, [{ transform: at(px, py) }, { transform: at(lx + 19, ly + 38) }], { duration: 1100, easing: 'ease-in-out' })
            ]);
        }
        if (!stopped()) {
            // Into the hold: from here on it travels with the ship.
            parcel.getAnimations().forEach(a => a.cancel());
            parcel.style.transform = '';
            lander.appendChild(parcel);
        }

        // 4. Away, up and out the far side — with or without the parcel.
        if (lander && !aborted) {
            // Reels in whatever chain is still out; a no-op after a pickup.
            run(chain, [{ transform: 'scaleY(0)' }], { duration: 500, easing: 'ease-in' });
            const away = fromLeft ? window.innerWidth + 80 : -140;
            await run(lander, [
                { transform: at(lx, ly) },
                { transform: at(lx, ly - 18, `rotate(${-6 * tilt}deg)`), offset: 0.25 },
                { transform: at(sx + away, ly - 260, `rotate(${-14 * tilt}deg)`) }
            ], { duration: 2400, easing: 'ease-in' });
        } else if (signed) {
            await wait(1800);
        }

        layer.classList.add('is-leaving');
        await wait(320);
        layer.remove();
        abortShow = null;
        running = false;
        arm();
    }

    arm();
})();
    </script>
    <script>
/* ── Shelves ─────────────────────────────────────────────────────────
   Each shelf heading folds its grid. What is folded is remembered per
   browser, so someone who only ever comes for the tools can put the
   games away once. With nothing remembered, a desktop opens every shelf
   and a phone opens only the first: a phone shows one card at a time,
   and a page of twenty spines is a long way to thumb past to reach the
   tools at the bottom. The chips above the shelves jump to one and
   unfold it on the way. */
(function () {
    const KEY = 'neskil.shelves.collapsed';
    const FOLD_MS = 500;
    const shelves = Array.from(document.querySelectorAll('.shelf'));

    function load() {
        try {
            const v = JSON.parse(localStorage.getItem(KEY));
            return Array.isArray(v) ? new Set(v) : null;
        } catch (e) { return null; }
    }

    function save() {
        try {
            const collapsed = shelves.filter(s => s.classList.contains('is-collapsed')).map(s => s.dataset.shelf);
            localStorage.setItem(KEY, JSON.stringify(collapsed));
        } catch (e) { /* private mode: the fold just isn't remembered */ }
    }

    function setCollapsed(shelf, collapsed, animate) {
        const head = shelf.querySelector('.shelf-head');
        head.setAttribute('aria-expanded', String(!collapsed));
        const clip = shelf.querySelector('.shelf-clip');
        if (collapsed) clip.setAttribute('inert', ''); else clip.removeAttribute('inert');

        if (animate) {
            shelf.classList.add('is-folding');
            clearTimeout(shelf._foldTimer);
            shelf._foldTimer = setTimeout(() => {
                shelf.classList.remove('is-folding');
                document.dispatchEvent(new CustomEvent('shelf:change'));
            }, FOLD_MS);
        }
        shelf.classList.toggle('is-collapsed', collapsed);
        document.dispatchEvent(new CustomEvent('shelf:change'));
    }

    const saved = load();
    const phone = window.matchMedia('(max-width: 640px)').matches;
    shelves.forEach((shelf, i) => {
        // The count is in the markup for a page without scripts; this
        // keeps it honest when a card is added and the number is not.
        shelf.querySelector('.shelf-count').textContent = shelf.querySelectorAll('.grid > .card').length;
        const collapsed = saved ? saved.has(shelf.dataset.shelf) : (phone && i > 0);
        if (collapsed) setCollapsed(shelf, true, false);
        shelf.querySelector('.shelf-head').addEventListener('click', () => {
            setCollapsed(shelf, !shelf.classList.contains('is-collapsed'), true);
            save();
        });
    });

    document.querySelectorAll('[data-shelf-jump]').forEach(chip => {
        chip.addEventListener('click', (e) => {
            const shelf = document.getElementById('shelf-' + chip.dataset.shelfJump);
            if (!shelf) return;
            e.preventDefault();
            if (shelf.classList.contains('is-collapsed')) {
                setCollapsed(shelf, false, true);
                save();
            }
            const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            shelf.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
            shelf.querySelector('.shelf-head').focus({ preventScroll: true });
        });
    });
})();
    </script>
    <script>
/* ── Surprise me ──────────────────────────────────────────────────────
   The dice chip in the jump bar opens something you have not opened yet.
   "Opened" is remembered per browser: every launch from this page is
   written down with the time (the chip's own picks included), and a game
   that has left a save behind counts too, so a visitor who went straight
   to one by link is not sent back to it as if it were new.

   While anything is unopened the pick is uniform among those, and the
   chip counts them down. After that it deals from the ones opened longest
   ago, so it keeps turning up what you have been away from and never the
   thing you just closed. The About shelf is left out: a CV is not a
   surprise. */
(function () {
    const KEY = 'visited.v1';
    const SAVES = {
        'supply-chain/': 'scTycoonSave.v1',
        'cargo-lander/': 'cargoLanderHighscores',
        '3d-engine-poc/': 'cargo3d.save.v1',
        'golf/': 'miniGolf.save.v1',
        'golf3d/': 'loftLinks.save.v1',
        'elevator/': 'elevator.best',
        'paper-plane/': 'paperplane.best',
        'orbit/': 'orbit.best',
        'math/#game': 'mentalMathHighScore'
    };
    const button = document.getElementById('random-pick');
    const label = document.getElementById('random-label');
    const count = document.getElementById('random-count');
    if (!button) return;

    // "golf3d/index.html?v=1.10.0" and "golf3d/" are the same place; "math/#game" is not "math/".
    const idOf = (a) => a.getAttribute('href').replace(/\?[^#]*/, '').replace(/index\.html/, '');
    const places = [...document.querySelectorAll('.shelf:not(#shelf-about) a.peek-launch, .shelf:not(#shelf-about) a.dim-option')]
        .map(a => ({ id: idOf(a), link: a }));

    function read() {
        let seen = {};
        try { seen = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { }
        for (const id in SAVES) {
            try { if (!seen[id] && localStorage.getItem(SAVES[id])) seen[id] = 1; } catch (e) { }
        }
        return seen;
    }
    function mark(id) {
        const seen = read();
        seen[id] = Date.now();
        try { localStorage.setItem(KEY, JSON.stringify(seen)); } catch (e) { }
    }
    function choose(seen, random) {
        const fresh = places.filter(p => !seen[p.id]);
        if (fresh.length) return fresh[Math.floor(random() * fresh.length)];
        const byAge = places.slice().sort((a, b) => seen[a.id] - seen[b.id]);
        const oldest = byAge.slice(0, Math.max(1, Math.floor(byAge.length / 2)));
        return oldest[Math.floor(random() * oldest.length)];
    }
    function refresh() {
        const left = places.filter(p => !read()[p.id]).length;
        label.textContent = left ? 'Something new' : 'Surprise me';
        count.textContent = left ? left + ' left' : '';
        button.title = left
            ? 'Open one of the ' + left + ' things here you have not tried yet'
            : 'You have opened everything. This picks one you have not been to for a while';
    }

    places.forEach(p => p.link.addEventListener('click', () => { mark(p.id); refresh(); }));
    button.addEventListener('click', () => {
        const pick = choose(read(), Math.random);
        if (!pick) return;
        mark(pick.id);
        refresh();
        window.location.href = pick.link.href;
    });
    // Coming back with the Back button restores this page from memory without rerunning it.
    window.addEventListener('pageshow', refresh);
    button.hidden = places.length === 0;
    refresh();
})();
    </script>
