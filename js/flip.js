// Cards that open in place instead of navigating (About, Under construction).
// Any .flip-card works the same way: its .flip-open button turns the card over
// and grows it into a centred panel over a blurred page, and any
// [data-flip-close] control, the backdrop or Escape puts it back.
//
// Opening lifts the card out of the grid: a same-sized placeholder drops into
// the cell it vacates so the grid does not reflow, and the card is reparented
// to <body>. That move is load-bearing. .grid animates in with
// `fadeInUp ... both`, which leaves a permanent `transform: translateY(0)` on
// it, and a non-none transform makes an element both a stacking context and
// the containing block for fixed-position descendants. Left in the grid, the
// panel would be positioned against the grid box instead of the viewport and
// painted underneath the backdrop. Escaping to <body> is what makes fixed
// mean fixed.
//
// Geometry (top/left/width/height) is then animated to the target rect; the
// transitions that carry it live in css/flip.css.
window.HOME = window.HOME || {};

HOME.flip = (function () {
    const CLOSE_MS = 480;

    let backdrop = null;
    let openCard = null;
    let openPlaceholder = null;
    let flipTimer = null;

    // Where an open panel should sit, given the card's rect in the grid and
    // the viewport. Pure, so tests.html can check the corner cases without a
    // layout.
    //
    // On desktop the panel keeps the card's aspect ratio and grows up to 45%
    // wider, then shrinks to fit if that makes it taller than the viewport.
    // On mobile it takes the width it can get and the height comes from the
    // copy (contentH), so a panel is exactly as tall as it needs to be and the
    // text can change length without anyone re-tuning a constant.
    function computeTargetRect(rect, viewW, viewH, contentH) {
        let w, h;

        if (viewW <= 640) {
            w = Math.min(520, viewW - 24);
            h = Math.min(viewH - 32, Math.max(200, contentH != null ? contentH + 32 : 360));
        } else {
            const aspectRatio = rect.width / rect.height;
            const maxH = viewH - 40;

            w = Math.min(rect.width * 1.45, Math.min(520, viewW - 36));
            h = w / aspectRatio;

            if (h > maxH) {
                h = maxH;
                w = h * aspectRatio;
            }
        }

        return { w, h, top: (viewH - h) / 2, left: (viewW - w) / 2 };
    }

    // The write-then-read of scrollHeight is a forced reflow on purpose; it
    // runs before anything paints.
    function targetRectFor(card, r) {
        const source = card.classList.contains('is-open') && openPlaceholder ? openPlaceholder : card;
        const rect = r || source.getBoundingClientRect();
        const back = card.querySelector('.card-face-back');
        return computeTargetRect(rect, window.innerWidth, window.innerHeight, back ? back.scrollHeight : null);
    }

    function setRect(card, top, left, w, h) {
        card.style.top = top + 'px';
        card.style.left = left + 'px';
        card.style.width = w + 'px';
        card.style.height = h + 'px';
    }

    // Puts the open card back in its cell and clears all open state. Safe to
    // call at any time; with nothing open it does nothing. This is what makes
    // open and close re-entrant, and it must be flushed rather than cancelled.
    function restore() {
        clearTimeout(flipTimer);
        flipTimer = null;
        if (!openCard) return;

        const card = openCard;
        card.classList.remove('is-open', 'is-flipped');
        ['top', 'left', 'width', 'height', 'transition', 'transform']
            .forEach(prop => card.style.removeProperty(prop));
        card.querySelector('.flip-open').setAttribute('aria-expanded', 'false');

        if (openPlaceholder) {
            openPlaceholder.parentNode.insertBefore(card, openPlaceholder);
            openPlaceholder.remove();
        }

        openCard = null;
        openPlaceholder = null;
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
    }

    function open(card) {
        if (openCard === card) return;

        // A close may still be running with its restore queued. Finish it
        // rather than cancelling it: the placeholder is positioned from the
        // card's parentNode, and mid-close that parent is still <body>.
        restore();

        const r = card.getBoundingClientRect();
        openPlaceholder = document.createElement('div');
        openPlaceholder.className = 'flip-placeholder';
        openPlaceholder.style.height = r.height + 'px';
        openPlaceholder.style.width = r.width + 'px';
        card.parentNode.insertBefore(openPlaceholder, card);
        document.body.appendChild(card);
        openCard = card;

        // Drop any tilt the card was carrying when it was clicked.
        ['--rx', '--ry', '--ty', '--mag'].forEach(prop => card.style.removeProperty(prop));
        card.classList.add('is-open');

        // Start from the grid rect, flush it, then transition to the target.
        const t = targetRectFor(card, r);
        setRect(card, r.top, r.left, r.width, r.height);
        card.getBoundingClientRect(); // flush start state
        card.style.transition = 'top 0.55s cubic-bezier(0.22, 1, 0.36, 1), left 0.55s cubic-bezier(0.22, 1, 0.36, 1), width 0.55s cubic-bezier(0.22, 1, 0.36, 1), height 0.55s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.55s ease';
        setRect(card, t.top, t.left, t.w, t.h);

        card.classList.add('is-flipped');
        backdrop.classList.add('open');
        card.querySelector('.flip-open').setAttribute('aria-expanded', 'true');
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
    }

    // Animates back to wherever the placeholder now sits (the page may have
    // been resized while the panel was open) and only then restores the card
    // to the flow.
    function close() {
        if (!openCard) return;
        const card = openCard;
        clearTimeout(flipTimer);

        if (!openPlaceholder) { restore(); return; }

        const p = openPlaceholder.getBoundingClientRect();
        card.style.transition = 'top 0.48s cubic-bezier(0.4, 0, 0.2, 1), left 0.48s cubic-bezier(0.4, 0, 0.2, 1), width 0.48s cubic-bezier(0.4, 0, 0.2, 1), height 0.48s cubic-bezier(0.4, 0, 0.2, 1)';
        setRect(card, p.top, p.left, p.width, p.height);
        card.classList.remove('is-flipped');
        backdrop.classList.remove('open');
        card.querySelector('.flip-open').setAttribute('aria-expanded', 'false');

        flipTimer = setTimeout(restore, CLOSE_MS);
    }

    function init() {
        backdrop = document.getElementById('about-backdrop');
        if (!backdrop) return;

        document.querySelectorAll('.flip-card').forEach(card => {
            card.querySelector('.flip-open').addEventListener('click', () => open(card));
            card.querySelectorAll('[data-flip-close]').forEach(el => {
                el.addEventListener('click', close);
            });
        });

        backdrop.addEventListener('click', close);
        document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
        window.addEventListener('resize', () => {
            if (!openCard) return;
            const t = targetRectFor(openCard);
            setRect(openCard, t.top, t.left, t.w, t.h);
        });
    }

    return { init, open, close, computeTargetRect, isOpen: () => openCard };
})();
