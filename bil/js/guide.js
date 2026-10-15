/* ── Walkthrough ─────────────────────────────────────────────────────
   One question at a time, in plain words, each answer written straight
   into the page's state so the result behind the dialog moves as you go.
   Single-choice questions move on by themselves; the ones with a number
   to type wait for Next. Everything it sets can be changed on the page
   afterwards, so no step is a commitment. */

import { PRESETS, POWERTRAINS, RESIDUAL_GROUPS, ENERGY } from './data.js';
import { priceAll, retained, curveOf, fmtKr, fmtNum, leaseQuoteOf } from './model.js';

const T = (en, sv) => ({ en, sv });
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const UI = {
    title: T('Let\'s fill this in', 'Vi fyller i det här tillsammans'),
    step: T((i, n) => `Question ${i} of ${n}`, (i, n) => `Fråga ${i} av ${n}`),
    back: T('Back', 'Tillbaka'),
    next: T('Next', 'Nästa'),
    skip: T('Close', 'Stäng'),
    show: T('Show me the answer', 'Visa svaret'),
    yes: T('Yes', 'Ja'),
    no: T('No', 'Nej'),
    other: T('Something else', 'Något annat'),
    price: T('Price you would pay', 'Pris du skulle betala'),
    keepAuto: T('Leave empty for a typical price', 'Lämna tomt för ett typiskt pris'),
    priceMoved: T((p, a) => `Price set to about ${fmtKr(p)} for a ${a}-year-old; change it on the page if you have a real one.`,
                  (p, a) => `Priset satt till ungefär ${fmtKr(p)} för en ${a} år gammal bil; ändra det på sidan om du har ett riktigt pris.`),
    doneHead: T('That is everything', 'Det var allt'),
    doneLine: T((name, cost, mil) => `The cheapest way for you to have a car is <strong>${name}</strong>, at about <strong>${fmtKr(cost)}</strong> a month (${fmtNum(mil)} kr per mil). The page now shows every route, what is in each, and how it changes with time and mileage.`,
                (name, cost, mil) => `Billigaste sättet för dig att ha bil är <strong>${name}</strong>, ungefär <strong>${fmtKr(cost)}</strong> i månaden (${fmtNum(mil)} kr per mil). Sidan visar nu alla vägar, vad som ingår i varje och hur det ändras med tid och körsträcka.`),
    doneNone: T('None of the ways to a car is open with these answers; the page shows why, and what going without costs.',
                'Ingen väg till en bil är öppen med de här svaren; sidan visar varför, och vad det kostar att klara sig utan.')
};

/* Regions set three things at once: the city insurance factor, the
   electricity zone for home charging, and whether to ask about the
   congestion charge. */
const REGIONS = [
    { key: 'sthlm', label: T('Stockholm', 'Stockholm'), bigCity: true, zone: 'SE3', toll: 1200 },
    { key: 'gbg', label: T('Göteborg', 'Göteborg'), bigCity: true, zone: 'SE3', toll: 700 },
    { key: 'malmo', label: T('Malmö or Skåne', 'Malmö eller Skåne'), bigCity: true, zone: 'SE4', toll: 0 },
    { key: 'middle', label: T('Elsewhere in central Sweden', 'Någon annanstans i Mellansverige'), bigCity: false, zone: 'SE3', toll: 0 },
    { key: 'north', label: T('Norrland', 'Norrland'), bigCity: false, zone: 'SE2', toll: 0 }
];

export function openGuide({ state, lang, apply, applyPreset, done }) {
    const L = (pair, ...args) => {
        const v = pair[lang] !== undefined ? pair[lang] : pair.en;
        return typeof v === 'function' ? v(...args) : v;
    };
    let region = null;

    const chips = (items, current, attr = 'data-v') =>
        `<div class="g-choices">${items.map(([label, v]) =>
            `<button type="button" class="g-choice" ${attr}="${esc(v)}" aria-pressed="${String(String(v) === String(current))}">${esc(label)}</button>`).join('')}</div>`;

    const STEPS = [
        {
            q: T('Which car are you thinking of?', 'Vilken bil funderar du på?'),
            why: T('Its price, brand and powertrain decide what it loses in value, what it costs to tax and run, and what a lease on it costs.',
                   'Pris, märke och drivlina avgör värdetappet, skatten, driftkostnaden och vad den kostar att leasa.'),
            body: () => chips(PRESETS.map(p => [lang === 'sv' ? (p.sv || p.label) : p.label, p.key]).concat([[L(UI.other), 'custom']]), state.preset) +
                `<div class="g-more" ${state.preset === 'custom' ? '' : 'hidden'}>
                    <label class="g-field"><span>${esc(L(UI.price))}</span><span class="g-input"><input type="number" inputmode="numeric" step="1000" min="0" data-k="price" value="${state.price}"><span>kr</span></span></label>
                    <span class="g-label">${esc(L(T('Runs on', 'Drivs med')))}</span>
                    ${chips(Object.entries(POWERTRAINS).map(([k, p]) => [lang === 'sv' ? p.sv : p.label, k]), state.powertrain, 'data-pt')}
                    <span class="g-label">${esc(L(T('Brand', 'Märke')))}</span>
                    ${chips(Object.entries(RESIDUAL_GROUPS).map(([k, g]) => [lang === 'sv' ? g.sv : g.label, k]), state.group, 'data-group')}
                </div>`,
            pick(v, root) {
                if (v === 'custom') {
                    apply({ preset: 'custom' });
                    root.querySelector('.g-more').hidden = false;
                    return false;
                }
                applyPreset(v);
                return true;
            }
        },
        {
            q: T('New or used?', 'Ny eller begagnad?'),
            why: T('A new car loses the most in its first years but comes with three years of damage warranty; an older one costs less to lose and more to keep.',
                   'En ny bil tappar mest de första åren men har tre års vagnskadegaranti; en äldre tappar mindre men kostar mer att hålla igång.'),
            body: () => chips([[L(T('New', 'Ny')), 0], [L(T('1–2 years', '1–2 år')), 2], [L(T('3–5 years', '3–5 år')), 4], [L(T('6–9 years', '6–9 år')), 7], [L(T('10 years or more', '10 år eller äldre')), 11]],
                state.age > 0 ? [2, 4, 7, 11].reduce((a, b) => Math.abs(b - state.age) < Math.abs(a - state.age) ? b : a) : 0) + '<p class="g-note" hidden></p>',
            pick(v, root) {
                const age = Number(v);
                if (age === state.age) return true;
                /* Move the price along the same car's curve, so "a 4-year-old
                   EX30" is priced like one rather than like a new one. */
                const { curve } = curveOf(state);
                const newPrice = state.price / retained(state.age, curve);
                const price = Math.round(newPrice * retained(age, curve) / 1000) * 1000;
                apply({ age, price, preset: 'custom' });
                if (age > 0) {
                    const n = root.querySelector('.g-note');
                    n.textContent = L(UI.priceMoved, price, age);
                    n.hidden = false;
                    return 'wait';
                }
                return true;
            }
        },
        {
            q: T('How long will you keep it?', 'Hur länge tänker du ha den?'),
            why: T('Short stays favour paying monthly; the longer you keep a car you own, the less each month of it costs.',
                   'Korta perioder gynnar månadsbetalning; ju längre du behåller en egen bil, desto billigare blir varje månad.'),
            body: () => chips([[L(T('1 year', '1 år')), 12], [L(T('2 years', '2 år')), 24], [L(T('3 years', '3 år')), 36], [L(T('4 years', '4 år')), 48], [L(T('5 years', '5 år')), 60], [L(T('8 years', '8 år')), 96]], state.horizon),
            pick(v) { apply({ horizon: Number(v) }); return true; }
        },
        {
            q: T('How far do you drive in a year?', 'Hur långt kör du på ett år?'),
            why: T('One mil is ten kilometres. The average Swedish car drove 1 243 mil in 2025. Leases and subscriptions charge for every mil over their allowance.',
                   'En mil är tio kilometer. En genomsnittlig svensk bil körde 1 243 mil 2025. Leasing och abonnemang tar betalt för varje mil över avtalet.'),
            body: () => chips([['500 mil', 500], ['1 000 mil', 1000], [L(T('1 250 mil (average)', '1 250 mil (snittet)')), 1250], ['1 500 mil', 1500], ['2 000 mil', 2000], ['3 000 mil', 3000]], state.mil),
            pick(v) { apply({ mil: Number(v) }); return true; }
        },
        {
            q: T('Where do you live?', 'Var bor du?'),
            why: T('Sets the electricity price for charging at home, city insurance rates, and whether a congestion charge applies.',
                   'Avgör elpriset för hemmaladdning, försäkringspremien i storstad och om trängselskatt kan bli aktuell.'),
            body: () => chips(REGIONS.map(r => [L(r.label), r.key]), region && region.key) +
                `<div class="g-more" hidden><span class="g-label">${esc(L(T('Will you drive through the congestion zone on workdays?', 'Kommer du köra genom trängselskattezonen på vardagar?')))}</span>
                ${chips([[L(UI.yes), 'yes'], [L(UI.no), 'no']], state.congestion > 0 ? 'yes' : 'no', 'data-toll')}</div>`,
            pick(v, root) {
                region = REGIONS.find(r => r.key === v);
                apply({ bigCity: region.bigCity, homeKwh: ENERGY.zones[region.zone], congestion: 0 });
                if (region.toll) {
                    root.querySelector('.g-more').hidden = false;
                    return false;
                }
                return true;
            }
        },
        {
            q: T('How much could you put towards it?', 'Hur mycket kan du lägga in själv?'),
            why: T('Buying outright needs the whole price; a dealer loan needs 20 % down. Money you keep is assumed to earn a savings rate.',
                   'Att köpa kontant kräver hela priset; handlarens billån kräver 20 % kontantinsats. Pengar du behåller antas ge sparränta.'),
            body: () => chips([['0 kr', 0], ['50 000 kr', 50000], ['100 000 kr', 100000], ['250 000 kr', 250000], ['500 000 kr', 500000], ['1 000 000 kr', 1000000]], state.savings) +
                `<label class="g-field"><span>${esc(L(T('Or type an amount', 'Eller skriv ett belopp')))}</span><span class="g-input"><input type="number" inputmode="numeric" step="10000" min="0" data-k="savings" value="${state.savings}"><span>kr</span></span></label>`,
            pick(v) { apply({ savings: Number(v) }); return true; }
        },
        {
            q: T('Anything a lender would want to know?', 'Något en långivare vill veta?'),
            why: T('Swedish lenders and lessors run a credit check (UC). These decide which routes are open to you at all.',
                   'Långivare och leasingbolag tar en kreditupplysning (UC). Det här avgör vilka vägar som alls är öppna för dig.'),
            body: () => [
                ['remark', T('I have a payment remark (betalningsanmärkning)', 'Jag har en betalningsanmärkning')],
                ['income', T('I have a steady income', 'Jag har fast inkomst')],
                ['card', T('I have a credit card', 'Jag har kreditkort')],
                ['home', T('I own a home with room in the mortgage', 'Jag äger en bostad med utrymme i bolånet')],
                ['young', T('A driver is under 25', 'En förare är under 25')]
            ].map(([k, label]) => `<label class="g-toggle"><input type="checkbox" data-flag="${k}"${state[k] ? ' checked' : ''}><span>${esc(L(label))}</span></label>`).join(''),
            manual: true
        },
        {
            q: T('Have you been quoted a lease?', 'Har du fått ett leasingpris?'),
            why: T('Advertised lease prices are usually for 1 000 mil a year. If you have one, it beats the estimate.',
                   'Annonserade leasingpriser gäller oftast 1 000 mil per år. Har du ett pris är det bättre än uppskattningen.'),
            body: () => `<label class="g-field"><span>${esc(L(T('Monthly price at 1 000 mil a year', 'Månadspris vid 1 000 mil per år')))}</span><span class="g-input"><input type="number" inputmode="numeric" step="10" min="0" data-k="leaseQuote" placeholder="${Math.round(leaseQuoteOf({ ...state, leaseQuote: null }))}" value="${state.leaseQuote != null ? state.leaseQuote : ''}"><span>${lang === 'sv' ? 'kr/mån' : 'kr/mo'}</span></span></label>
                <p class="g-note">${esc(L(UI.keepAuto))}</p>`,
            manual: true
        },
        {
            q: T('Does your employer offer a company car?', 'Erbjuder din arbetsgivare förmånsbil?'),
            why: T('A förmånsbil is taxed on a benefit value set by Skatteverket, often far below what the car costs.',
                   'En förmånsbil beskattas på ett förmånsvärde som Skatteverket bestämmer, ofta långt under vad bilen kostar.'),
            body: () => chips([[L(UI.yes), 'yes'], [L(UI.no), 'no']], state.benefit ? 'yes' : 'no') +
                `<div class="g-more" ${state.benefit ? '' : 'hidden'}><span class="g-label">${esc(L(T('Your marginal tax', 'Din marginalskatt')))}</span>
                ${chips([[L(T('About 32 % (municipal only)', 'Ungefär 32 % (bara kommunalskatt)')), 32], [L(T('About 52 % (above the brytpunkt)', 'Ungefär 52 % (över brytpunkten)')), 52]], state.marginalTax, 'data-tax')}</div>`,
            pick(v, root) {
                apply({ benefit: v === 'yes' });
                if (v === 'yes') { root.querySelector('.g-more').hidden = false; return false; }
                return true;
            }
        }
    ];

    /* ── The dialog ── */
    const dlg = document.createElement('dialog');
    dlg.className = 'guide';
    dlg.setAttribute('aria-labelledby', 'guideQ');
    document.body.appendChild(dlg);
    let i = 0;
    let advanceTimer = null;

    function render() {
        clearTimeout(advanceTimer);
        const n = STEPS.length;
        if (i >= n) return renderDone();
        const s = STEPS[i];
        dlg.innerHTML = `
            <div class="g-head">
                <span class="sign">Guide</span><span class="g-step">${esc(L(UI.step, i + 1, n))}</span>
                <button type="button" class="g-close" data-act="close" aria-label="${esc(L(UI.skip))}">✕</button>
            </div>
            <div class="g-progress" aria-hidden="true"><span style="width:${(i / n) * 100}%"></span></div>
            <h2 id="guideQ" class="g-q">${esc(L(s.q))}</h2>
            <p class="g-why">${esc(L(s.why))}</p>
            <div class="g-body">${s.body()}</div>
            <div class="g-foot">
                <button type="button" class="g-back" data-act="back"${i === 0 ? ' disabled' : ''}>${esc(L(UI.back))}</button>
                <button type="button" class="g-next" data-act="next">${esc(L(UI.next))}</button>
            </div>`;
        const first = dlg.querySelector('.g-choice[aria-pressed="true"], .g-choice, input');
        if (first) first.focus({ preventScroll: true });
    }

    function renderDone() {
        const res = priceAll(state);
        const best = res.cheapestCar;
        dlg.innerHTML = `
            <div class="g-head">
                <span class="sign">Guide</span>
                <button type="button" class="g-close" data-act="close" aria-label="${esc(L(UI.skip))}">✕</button>
            </div>
            <div class="g-progress" aria-hidden="true"><span style="width:100%"></span></div>
            <h2 id="guideQ" class="g-q">${esc(L(UI.doneHead))}</h2>
            <p class="g-why">${best ? L(UI.doneLine, esc(best.sv), best.perMonth, best.perMil) : esc(L(UI.doneNone))}</p>
            <div class="g-foot">
                <button type="button" class="g-back" data-act="back">${esc(L(UI.back))}</button>
                <button type="button" class="g-next" data-act="finish">${esc(L(UI.show))}</button>
            </div>`;
        dlg.querySelector('.g-next').focus();
    }

    function mark(root, selector, value, attr) {
        root.querySelectorAll(selector).forEach(b => b.setAttribute('aria-pressed', String(b.getAttribute(attr) === String(value))));
    }

    function close(finished) {
        clearTimeout(advanceTimer);
        dlg.close();
        dlg.remove();
        if (finished) done();
    }

    dlg.addEventListener('click', (e) => {
        if (e.target === dlg) return close(false);   // the backdrop
        const act = e.target.closest('[data-act]');
        if (act) {
            const a = act.dataset.act;
            if (a === 'close') return close(false);
            if (a === 'finish') return close(true);
            if (a === 'back') { i = Math.max(0, i - 1); return render(); }
            if (a === 'next') { i++; return render(); }
        }
        const s = STEPS[i];
        const c = e.target.closest('.g-choice');
        if (!c || !s) return;
        if (c.hasAttribute('data-pt')) {
            apply({ powertrain: c.dataset.pt, co2: POWERTRAINS[c.dataset.pt].co2, consumption: null, preset: 'custom' });
            return mark(dlg, '[data-pt]', c.dataset.pt, 'data-pt');
        }
        if (c.hasAttribute('data-group')) {
            apply({ group: c.dataset.group, preset: 'custom' });
            return mark(dlg, '[data-group]', c.dataset.group, 'data-group');
        }
        if (c.hasAttribute('data-toll')) {
            apply({ congestion: c.dataset.toll === 'yes' && region ? region.toll : 0 });
            mark(dlg, '[data-toll]', c.dataset.toll, 'data-toll');
            advanceTimer = setTimeout(() => { i++; render(); }, 260);
            return;
        }
        if (c.hasAttribute('data-tax')) {
            apply({ marginalTax: Number(c.dataset.tax) });
            mark(dlg, '[data-tax]', c.dataset.tax, 'data-tax');
            advanceTimer = setTimeout(() => { i++; render(); }, 260);
            return;
        }
        mark(dlg.querySelector('.g-body > .g-choices') || dlg, '.g-body > .g-choices > .g-choice', c.dataset.v, 'data-v');
        const go = s.pick ? s.pick(c.dataset.v, dlg) : true;
        if (go === true) advanceTimer = setTimeout(() => { i++; render(); }, 260);
    });

    dlg.addEventListener('input', (e) => {
        const el = e.target;
        if (el.dataset.k) {
            if (el.value === '') {
                if (el.dataset.k === 'leaseQuote') apply({ leaseQuote: null });
                return;
            }
            const v = Number(el.value);
            if (Number.isFinite(v) && v >= 0) {
                const change = { [el.dataset.k]: v };
                if (el.dataset.k === 'price') change.preset = 'custom';
                apply(change);
                if (el.dataset.k === 'savings') mark(dlg, '.g-body > .g-choices > .g-choice', v, 'data-v');
            }
        }
        if (el.dataset.flag) apply({ [el.dataset.flag]: el.checked });
    });

    dlg.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'number') {
            e.preventDefault();
            i++;
            render();
        }
    });
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(false); });

    render();
    dlg.showModal();
}
