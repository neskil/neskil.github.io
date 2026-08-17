/* ── What a budget actually buys ──────────────────────────────────────
   A price on its own is the least informative number in car buying. The
   same $24,000 is a new small Korean car, a three-year-old Japanese SUV
   or a six-year-old German saloon — and by the time you sell, those
   three are thousands apart, because the badge that sheds value fastest
   is usually the one that costs most to keep on the road. The two
   penalties compound instead of cancelling.

   So this screen takes one budget, prices every marque × shape × age the
   page knows about against it, and ranks what comes back by cost to
   *own* rather than cost to buy. Move the number and the list moves with
   it: that is the trade-off, made steppable. */
'use strict';

let budgetAmount = 0;
/* Set when the explorer is opened from somewhere that needs to redraw
   itself afterwards — the walkthrough, which is sitting underneath it. */
let budgetApplyHook = null;

/* Steps that sound like money rather than arithmetic. */
function budgetStepSize(amount) {
    if (amount >= 45000) return 5000;
    if (amount >= 18000) return 2500;
    return 1000;
}

const BUDGET_MIN = 8000;
const BUDGET_MAX = 95000;

function clampBudget(n) {
    return Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, Math.round(n / 500) * 500));
}

/* The current page state, as budgetMatches wants it. */
function budgetContext() {
    return {
        months: Math.max(6, Math.round(num('horizon'))) || 60,
        miles: num('miles') || 12000,
        taxRate: num('taxRate'),
        fees: num('fees')
    };
}

/* Ranked cheapest-to-own first, but capped at two per marque so the list
   shows the choice rather than four trims of the same answer. */
function budgetShortlist(amount, limit) {
    const all = budgetMatches(amount, budgetContext());
    const perBrand = {};
    const picked = [];
    for (const est of all) {
        perBrand[est.brand] = (perBrand[est.brand] || 0) + 1;
        if (perBrand[est.brand] <= 2) picked.push(est);
        if (picked.length >= (limit || 8)) break;
    }
    /* A narrow budget can match one marque and nothing else; better a
       short honest list than a padded one. */
    return picked;
}

/* A budget one or two steps either side of this one, each labelled with
   the best thing it reaches — the answer to "and if I stretch?" */
function budgetRungs(amount) {
    const step = budgetStepSize(amount);
    const rungs = [];
    for (const delta of [-2 * step, -step, 0, step, 2 * step]) {
        const at = clampBudget(amount + delta);
        if (rungs.some((r) => r.amount === at)) continue;
        const best = budgetShortlist(at, 1)[0] || null;
        rungs.push({ amount: at, delta: delta, best: best, current: delta === 0 });
    }
    return rungs;
}

/* "Japanese compact SUV" — the two chips that describe it, in the words
   the page uses for them everywhere else. The shape reads as prose here
   rather than as a chip, but SUV is an acronym and stays one. */
function budgetCarName(est) {
    const brand = BRANDS[est.brand], body = BODY_TYPES[est.body];
    if (!body) return brand.label;
    const shape = body.label.replace(/^\S+\s/, '').toLowerCase().replace(/\bsuv\b/g, 'SUV');
    return brand.label + ' ' + shape;
}

/* The same car inside a sentence, carrying its age. */
function budgetShortName(est) {
    const band = AGE_BANDS[est.age];
    return band.buyAge === 0
        ? 'a new ' + budgetCarName(est)
        : 'a ' + band.buyAge + '-year-old ' + budgetCarName(est);
}

function renderBudgetRungs() {
    const host = $('budgetRungs');
    host.innerHTML = '';
    let currentBtn = null;
    for (const rung of budgetRungs(budgetAmount)) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'budget-rung' + (rung.current ? ' current' : '');
        btn.innerHTML = '<span class="br-amount">' + usdShort(rung.amount) + '</span>' +
            '<span class="br-buys">' + (rung.best
                ? budgetShortName(rung.best) + ' · ' + usd0(rung.best.perMonth) + '/mo'
                : 'nothing in the data set') + '</span>';
        btn.addEventListener('click', () => setBudget(rung.amount));
        host.appendChild(btn);
        if (rung.current) currentBtn = btn;
    }
    /* The rung you are on sits in the middle of the row, so on a phone it
       starts off screen. Scrolled to only once the row is fully built, or
       the target would be clamped against a shorter scroll width. */
    if (currentBtn) host.scrollLeft = Math.max(0, currentBtn.offsetLeft - host.offsetLeft - 10);
}

function renderBudgetGrid() {
    const host = $('budgetGrid');
    const list = budgetShortlist(budgetAmount);
    host.innerHTML = '';

    if (!list.length) {
        host.innerHTML = '<p class="notes">Nothing in the data set lands within 12% of ' +
            usd0(budgetAmount) + '. The cheapest car here is around $10,000 out the door and the ' +
            'dearest is around $82,000.</p>';
        $('budgetNote').innerHTML = '';
        return;
    }

    const ctx = budgetContext();
    for (const est of list) {
        const band = AGE_BANDS[est.age];
        const isCurrent = est.brand === carBrand && est.body === carBody && est.age === carAge;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'budget-card' + (isCurrent ? ' current' : '');

        const cover = est.warrantyLeft > 0
            ? '<span class="bc-pill good">' + est.warrantyLeft + ' yr cover left</span>'
            : est.powertrainLeft > 0
                ? '<span class="bc-pill">powertrain only</span>'
                : '<span class="bc-pill warn">out of warranty</span>';

        card.innerHTML =
            '<span class="bc-top">' +
                '<span class="bc-name">' + budgetCarName(est) + '</span>' +
                '<span class="bc-month">' + usd0(est.perMonth) + '<small>/mo</small></span>' +
            '</span>' +
            '<span class="bc-age">' + band.label + ' · ' + usd0(est.otd) + ' out the door</span>' +
            '<span class="bc-lines">' +
                '<span>Sheds <strong>' + usd0(est.lost) + '</strong> over ' + ctx.months + ' mo</span>' +
                '<span>Upkeep + cover <strong>' + usd0(est.maintenance + est.insurance) + '</strong>/mo</span>' +
            '</span>' +
            '<span class="bc-foot">' + cover +
                (isCurrent ? '<span class="bc-pill good">on the page now</span>' : '') + '</span>';

        card.addEventListener('click', () => applyBudgetPick(est));
        host.appendChild(card);
    }

    /* The point of the list, said out loud: same money on the
       windscreen, very different money by the time you sell. */
    const cheap = list[0], dear = list[list.length - 1];
    if (list.length > 1 && dear.perMonth > cheap.perMonth) {
        const gap = (dear.perMonth - cheap.perMonth) * ctx.months;
        $('budgetNote').innerHTML = 'Every car here costs about ' + usd0(budgetAmount) +
            ' to drive away. Over your ' + ctx.months + ' months, ' + budgetShortName(cheap) +
            ' costs <strong>' + usd0(cheap.perMonth) + '/mo</strong> to own and ' +
            budgetShortName(dear) + ' costs <strong>' + usd0(dear.perMonth) +
            '/mo</strong> — a <strong>' + usd0(gap) + '</strong> difference on the same purchase ' +
            'price. That gap is depreciation and repair bills, and no amount of haggling reaches it.';
    } else {
        $('budgetNote').innerHTML = 'Cost to own is what it sheds in value plus upkeep and ' +
            'insurance. Fuel and financing are left out here because they are much the same ' +
            'question whichever of these you buy.';
    }
}

function renderBudget() {
    /* Do not fight the caret: while the box has focus it is the source of
       the number rather than a display of it. */
    if (document.activeElement !== $('budgetInput')) $('budgetInput').value = budgetAmount;
    $('budgetSlider').value = budgetAmount;
    const step = budgetStepSize(budgetAmount);
    $('budgetDown').textContent = '− ' + usdShort(step);
    $('budgetUp').textContent = '+ ' + usdShort(step);
    $('budgetDown').disabled = budgetAmount <= BUDGET_MIN;
    $('budgetUp').disabled = budgetAmount >= BUDGET_MAX;
    renderBudgetRungs();
    renderBudgetGrid();
}

function setBudget(amount) {
    budgetAmount = clampBudget(amount);
    renderBudget();
}

/* Picking a card is the same act as clicking the marque, shape and age
   chips on the page — it writes into the real fields, so closing the
   explorer leaves the calculator holding that car. */
function applyBudgetPick(est) {
    carBrand = est.brand;
    carBody = est.body;
    carAge = est.age;
    /* The walkthrough may have pinned a specific nameplate earlier; a
       segment pick here replaces it, and the recap must not go on
       naming a car that is no longer the one being priced. */
    if (typeof guideAnswers === 'object' && guideAnswers) {
        guideAnswers.model = 'none';
        guideAnswers.modelLabel = null;
    }
    applyCarProfile();
    update();
    closeBudgetModal();
    if (budgetApplyHook) budgetApplyHook();
}

function openBudgetModal(opts) {
    budgetApplyHook = (opts && opts.onApply) || null;
    /* Opens on the car already being priced when there is one, so the
       first thing shown is the shelf you are standing at. */
    const seed = num('otd') || num('cash') || 25000;
    budgetAmount = clampBudget(seed);

    $('budgetModal').hidden = false;
    $('budgetBackdrop').hidden = false;
    requestAnimationFrame(() => {
        $('budgetBackdrop').classList.add('open');
        $('budgetModal').classList.add('open');
    });
    renderBudget();
    $('budgetClose').focus();
}

function closeBudgetModal() {
    $('budgetBackdrop').classList.remove('open');
    $('budgetModal').classList.remove('open');
    setTimeout(() => {
        $('budgetModal').hidden = true;
        $('budgetBackdrop').hidden = true;
    }, 250);
}
