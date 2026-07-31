// Easter eggs. Click the name in the header five times and a panel slides up
// with the links that didn't earn a card: old experiments, the legacy CV, a
// frozen snapshot of the supply chain sim — and one button that should not be
// pressed, which drops the whole grid on the floor.
//
// Every click on the name throws off sparks and adds a dot to the hint under
// the header, which counts down the clicks left. The counter resets after
// three idle seconds, so nobody stumbles in by accident.
window.HOME = window.HOME || {};

HOME.vault = (function () {
    const NEEDED = 5;
    const RESET_MS = 3000;
    const TOAST_MS = 2200;

    // Index n is what's shown after n+1 clicks: one dot fewer each time.
    const HINT_DOTS = ['· · · · ·', '· · · ·', '· · ·', '· ·', '·'];

    let backdrop = null, panel = null, hintEl = null;
    let clicks = 0, resetTimer = null, toastTimer = null;

    function hintFor(clickCount) {
        return HINT_DOTS[clickCount - 1] || '';
    }

    function open() {
        backdrop.classList.add('open');
        panel.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        backdrop.classList.remove('open');
        panel.classList.remove('open');
        document.body.style.overflow = '';
    }

    function resetHint() {
        clicks = 0;
        hintEl.textContent = '';
        hintEl.classList.remove('show');
    }

    function onNameClick(e) {
        spawnSparks(e.clientX, e.clientY);
        clicks++;
        clearTimeout(resetTimer);

        if (clicks >= NEEDED) {
            resetHint();
            open();
            return;
        }

        hintEl.textContent = hintFor(clicks);
        hintEl.classList.add('show');
        resetTimer = setTimeout(resetHint, RESET_MS);
    }

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
        toastTimer = setTimeout(() => toast.classList.remove('show'), TOAST_MS);
    }

    // Drops every card to the bottom of the viewport, bounces it, then springs
    // it home. Written straight to card.style.transform, which is why
    // body.gravity-active kills the cards' transitions — the tilt loop keeps
    // writing its variables underneath, and two animations fighting over the
    // same box looks like a bug rather than a joke.
    function triggerGravityGlitch() {
        if (document.body.classList.contains('gravity-active')) return;
        document.body.classList.add('gravity-active');
        showToast('🛰️ Gravity malfunction detected!');

        const cards = Array.from(document.querySelectorAll('.card'));
        const bodies = cards.map(card => {
            const rect = card.getBoundingClientRect();
            return {
                el: card,
                floor: Math.max(0, window.innerHeight - rect.bottom - 4),
                y: 0, vy: 0, rot: 0,
                vr: (Math.random() - 0.5) * 8,
                settled: false
            };
        });

        const gravity = 0.9, damping = 0.5;
        let frame = 0;

        function step() {
            frame++;
            let allSettled = true;
            bodies.forEach(b => {
                if (b.settled) return;
                allSettled = false;
                b.vy += gravity;
                b.y += b.vy;
                b.rot += b.vr;
                if (b.y >= b.floor) {
                    b.y = b.floor;
                    b.vy *= -damping;
                    b.vr *= 0.55;
                    if (Math.abs(b.vy) < 1.5) {
                        b.vy = 0;
                        b.rot = 0;
                        b.settled = true;
                    }
                }
                b.el.style.transform = `translateY(${b.y}px) rotate(${b.rot}deg)`;
            });
            // The frame cap is a backstop: a card that never settles (a very
            // tall viewport, a tab that was backgrounded mid-fall) still ends.
            if (!allSettled && frame < 600) {
                requestAnimationFrame(step);
            } else {
                setTimeout(reset, 1000);
            }
        }

        function reset() {
            cards.forEach(card => {
                card.style.transition = 'transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)';
                card.style.transform = '';
            });
            showToast('✅ Gravity restored');
            setTimeout(() => {
                cards.forEach(card => { card.style.transition = ''; });
                document.body.classList.remove('gravity-active');
            }, 800);
        }

        requestAnimationFrame(step);
    }

    function init() {
        backdrop = document.getElementById('vault-backdrop');
        panel = document.getElementById('vault-panel');
        hintEl = document.getElementById('secret-hint');
        const nameEl = document.getElementById('name-trigger');
        if (!backdrop || !panel || !hintEl || !nameEl) return;

        nameEl.addEventListener('click', onNameClick);
        backdrop.addEventListener('click', close);
        document.querySelectorAll('[data-vault-close]').forEach(el => {
            el.addEventListener('click', close);
        });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

        document.getElementById('vault-danger-button').addEventListener('click', () => {
            close();
            setTimeout(triggerGravityGlitch, 350); // let the vault slide away first
        });
    }

    return { init, open, close, hintFor, showToast, triggerGravityGlitch, NEEDED, HINT_DOTS };
})();
