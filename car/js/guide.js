/* ── Guided walkthrough ──────────────────────────────────────────────
   The same inputs as the page, asked one at a time, writing straight
   into the real fields. */
'use strict';

/* ── Guided walkthrough ──────────────────────────────────────────
   Same inputs as the page, asked one at a time in plain language.
   Every step writes straight into the real fields, so closing the
   guide half way through still leaves the calculator better filled in
   than it was. */
const GUIDE_STEPS = [
    {
        id: 'licence',
        q: 'Do you have a US driver\'s licence yet?',
        why: 'It decides what is even possible this month. Without one, buying and leasing wait — ' +
            'a monthly subscription on your foreign licence is the route, and that same car can ' +
            'take you to the road test.',
        choices: [
            { value: 'yes', label: 'Yes, I have one', sub: 'Everything on the page is open to you' },
            { value: 'no', label: 'Not yet', sub: 'I will point you at the Georgia steps at the end' }
        ],
        get: () => guideAnswers.licence,
        set: (v) => { guideAnswers.licence = v; }
    },
    {
        id: 'credit',
        q: 'What does your US credit look like?',
        why: 'This is the gate. A lender decides before any of the maths matters, and it sets the ' +
            'interest rate you would actually be quoted.',
        choices: [
            { value: 'none', label: '🛬 No US credit yet', sub: 'New arrival — empty file, not a bad one' },
            { value: 'subprime', label: 'Under 600', sub: 'Rebuilding' },
            { value: 'nearprime', label: '601–660', sub: 'Approved, but above the advertised rate' },
            { value: 'prime', label: '661–780', sub: 'The mainstream band' },
            { value: 'superprime', label: '781+', sub: 'Promotional 0–2.9% offers are yours' }
        ],
        get: () => creditTier,
        set: (v) => { creditTier = v; applyCreditTier(); }
    },
    {
        id: 'horizon',
        q: 'How long will you realistically keep it?',
        why: 'The single biggest lever on the page. Short answers favour leasing and renting; long ' +
            'answers favour buying, because a paid-off car costs almost nothing to keep.',
        field: 'horizon',
        suffix: 'months',
        choices: [
            { value: 12, label: '1 year', sub: 'A posting, a trial, a visa year' },
            { value: 24, label: '2 years', sub: 'Short assignment' },
            { value: 36, label: '3 years', sub: 'The usual lease length' },
            { value: 60, label: '5 years', sub: 'Settled' },
            { value: 96, label: '8 years', sub: 'Run it into the ground' },
            { value: 120, label: '10 years', sub: 'Maximum value per dollar' }
        ]
    },
    {
        id: 'brand',
        q: 'What sort of car are you picturing?',
        why: 'Marque decides two things at once, and they pull the same way: a Toyota keeps 68% of its ' +
            'value at five years and costs about $15,000 to run for a decade, where a German saloon keeps ' +
            '45% and costs nearer $33,000.',
        /* Priced live at whatever age is already chosen, so the ranges
           are the ones you would actually be shopping. */
        choicesFn: () => {
            const at = carAge || 'three';
            const band = AGE_BANDS[at];
            const priced = (key, text) => {
                const r = estimateRange(key, at);
                return text + ' · <strong>' + usdK(r.low) + '–' + usdK(r.high) + '</strong> ' +
                    (band.buyAge === 0 ? 'new' : 'at ' + band.label.toLowerCase());
            };
            return [
                { value: 'japanese', label: '🇯🇵 Japanese', sub: priced('japanese', 'Toyota, Honda, Mazda — best resale, cheapest to run') },
                { value: 'korean', label: '🇰🇷 Korean', sub: priced('korean', 'Hyundai, Kia — 10yr powertrain warranty') },
                { value: 'american', label: '🇺🇸 American', sub: priced('american', 'Ford, Chevy — cheap upkeep, weak resale') },
                { value: 'germanLux', label: '🇩🇪 German luxury', sub: priced('germanLux', 'BMW, Audi, MB — 2x the upkeep') }
            ];
        },
        get: () => carBrand,
        set: (v) => { carBrand = v; if (!carAge) carAge = 'three'; applyCarProfile(); }
    },
    {
        id: 'body',
        q: 'What shape?',
        why: 'Inside one badge the shape moves the price as much as the badge does — a Civic and a ' +
            'Pilot are the same Honda. It follows through into upkeep and cover too: bigger tires, ' +
            'bigger brakes, more to insure.',
        skipIf: () => !carBrand,
        choicesFn: () => Object.entries(BODY_TYPES)
            .filter(([, body]) => !(body.notFor || []).includes(carBrand))
            .map(([value, body]) => {
                const price = estimatePrice(carBrand, value, carAge || 'three');
                return {
                    value,
                    label: body.label,
                    sub: body.sub + ' · <strong>' + usdK(price) + '</strong>'
                };
            }),
        get: () => carBody,
        set: (v) => { carBody = v; if (!carAge) carAge = 'three'; applyCarProfile(); }
    },
    {
        id: 'age',
        q: 'How old when you buy it?',
        why: 'Repair spend runs at about half the lifetime average while the warranty holds, and climbs ' +
            'steeply once it lapses. Age sets the price, the cover you still have, and the bills ahead.',
        /* The same car at four ages, so the depreciation you are being
           asked about is visible as money rather than described. */
        choicesFn: () => Object.entries(AGE_BANDS).map(([value, band]) => {
            const price = carBrand ? estimatePrice(carBrand, carBody, value) : null;
            return {
                value,
                label: band.label,
                sub: band.sub + (price ? ' · <strong>' + usdK(price) + '</strong>' : '')
            };
        }),
        get: () => carAge,
        set: (v) => { carAge = v; if (!carBrand) carBrand = 'japanese'; applyCarProfile(); }
    },
    {
        id: 'model',
        q: 'Any particular model in mind?',
        why: 'Real cars beat averages. Pick one and the price comes from that nameplate\'s own ' +
            'depreciation curve at the age you chose, not from a segment average.',
        skipIf: () => !MODELS.some((m) => m.brand === carBrand),
        choicesFn: () => {
            const band = AGE_BANDS[carAge] || AGE_BANDS.three;
            const year = new Date().getFullYear() - band.buyAge;
            return MODELS.filter((m) => m.brand === carBrand).map((m) => ({
                value: m.key,
                label: m.name,
                sub: (m.hold5 * 100).toFixed(0) + '% left at 5 years · <strong>' +
                    usdK(modelValueAt(m, modelMsrp(m, year), band.buyAge)) + '</strong> as a ' + year
            })).concat([{
                value: 'none', label: 'Not decided yet',
                sub: 'Use the segment average — ' + (carBrand
                    ? usdK(estimatePrice(carBrand, carBody, carAge || 'three')) : 'no model picked')
            }]);
        },
        get: () => guideAnswers.model,
        set: (v) => {
            guideAnswers.model = v;
            if (v !== 'none') applyRealModel(v);
            else applyCarProfile();
        }
    },
    {
        /* Asked *after* the car, not before it. A budget in the
           abstract is a number nobody can place — "could you find
           $20,000" means nothing until you know whether the car you
           just described costs $14,000 or $62,000. Everything here is
           priced off that car. */
        id: 'cash',
        q: 'How much cash could you put into it?',
        whyFn: () => {
            const otd = num('otd');
            if (!otd) {
                return 'Not what you have — what you are willing to spend without emptying the buffer ' +
                    'you need for a deposit, a flight home, or three months of rent.';
            }
            return 'The car you just described is <strong>' + usd0(otd) + '</strong> out the door. ' +
                'This answer decides which routes stay open: paying cash needs all of it, a loan ' +
                'needs a deposit against it, and a subscription needs almost none — so it is not ' +
                'what you have, it is what you would put in without emptying the buffer you keep ' +
                'for a deposit, a flight home, or three months of rent.';
        },
        field: 'cash',
        prefix: '$',
        /* Fractions of this car rather than round numbers off a list.
           Which door each one opens is the label, because that is the
           only reason the page asks. */
        choicesFn: () => {
            const otd = num('otd');
            if (!otd) return null;
            const step = (x) => Math.max(500, Math.round(x / 500) * 500);
            /* Rounded *up*, or "all of it" would land a few hundred short
               of the car and the page would tell you cash is out of reach. */
            const whole = Math.ceil(otd / 500) * 500;
            return [
                { value: whole, label: 'All of it · ' + usd0(whole),
                  sub: 'Buy it outright — the one route no lender can decline' },
                { value: step(otd * 0.5), label: 'Half · ' + usd0(step(otd * 0.5)),
                  sub: 'A big deposit, a small loan, and the option to just pay cash for something older' },
                { value: step(otd * 0.2), label: 'A fifth · ' + usd0(step(otd * 0.2)),
                  sub: 'The conventional 20% down — best rates, no negative equity' },
                { value: step(otd * 0.1), label: 'A tenth · ' + usd0(step(otd * 0.1)),
                  sub: 'A thin deposit — financing works, leasing and subscriptions work better' }
            ];
        },
        /* The trade-off behind the number is a whole screen of its own. */
        explore: 'See what each budget actually buys'
    },
    {
        id: 'miles',
        q: 'How far do you drive in a year?',
        why: 'Mileage is what quietly kills leases and subscriptions — both meter it, and both charge ' +
            'per mile once you pass the cap.',
        field: 'miles',
        suffix: 'mi/yr',
        choices: [
            { value: 4000, label: '4,000', sub: 'Errands only — transit or walking otherwise' },
            { value: 6000, label: '6,000', sub: 'City, short hops · fits a 500 mi/mo subscription' },
            { value: 8000, label: '8,000', sub: 'Light use, occasional weekend away' },
            { value: 10000, label: '10,000', sub: 'Modest commute — under most lease caps' },
            { value: 12000, label: '12,000', sub: 'US average' },
            { value: 15000, label: '15,000', sub: 'Daily commute, the usual big-cap lease' },
            { value: 20000, label: '20,000', sub: 'Long commute' },
            { value: 30000, label: '30,000', sub: 'Road warrior — leases stop making sense' }
        ]
    },
    {
        id: 'tax',
        q: 'Where are you buying it?',
        why: 'Georgia has no sales tax on cars. It charges a one-time title tax instead, and a new ' +
            'resident bringing their own car pays half rate.',
        field: 'taxRate',
        suffix: '%',
        choices: [
            { value: 7, label: 'Georgia — buying here', sub: '7% title ad valorem tax' },
            { value: 3, label: 'Georgia — brought my own car', sub: '3% new-resident rate' },
            { value: 0, label: 'A state with no car tax', sub: 'Oregon, New Hampshire, Montana…' },
            { value: 6, label: 'Somewhere else', sub: 'Type your state\'s rate below', stay: true }
        ]
    },
    {
        id: 'done',
        q: 'That is everything.',
        why: 'Here is what went into the calculator. Change anything you like — the answer updates as ' +
            'you type.',
        recap: true
    }
];

const guideAnswers = { licence: null, car: null, model: null };
let guideIndex = 0;
let advanceTimer = null;

/* Choosing an answer is the answer — move to the next question rather
   than making people confirm it. The pause is just long enough to see
   the choice light up, and any option that expects follow-up typing
   opts out with `stay`. */
function queueAdvance() {
    clearTimeout(advanceTimer);
    advanceTimer = setTimeout(guideNext, 220);
}

/* Body style is optional — until it is picked, the marque averages
   stand on their own, which is what they were before the shape was a
   question. */
function bodyOf(key) {
    return BODY_TYPES[key === undefined ? carBody : key] || NEUTRAL_BODY;
}

/* Marque, shape and age together decide price, upkeep, cover and resale.
   The figures come from estimateOwnership, the same call the walkthrough
   and the budget explorer price their unchosen options with; this is the
   one place that writes them into the fields. */
function applyCarProfile(bodyOverride) {
    const brand = BRANDS[carBrand], band = AGE_BANDS[carAge];
    if (!brand || !band) return;
    const bodyKey = bodyOverride === undefined ? carBody : bodyOverride;
    const body = bodyOf(bodyOverride);

    const months = Math.max(6, Math.round(num('horizon')));
    const est = estimateOwnership(carBrand, bodyKey, carAge, months, num('miles'));

    const priceNow = est.price;
    $('price').value = Math.round(priceNow / 50) * 50;
    $('depreciation').value = brand.curve;
    $('maintenance').value = Math.round(est.maintenance);
    $('insurance').value = Math.round(est.insurance / 5) * 5;
    /* Shape decides the pump bill more than the badge does — the gap
       between a small car and a pickup is a third of the fuel line.
       Hybrids deliver ~55% better fuel economy than petrol counterparts. */
    if (carPowertrain === 'hybrid') {
        $('mpg').value = body.mpg ? Math.round(body.mpg * 1.55) : 44;
    } else if (carPowertrain === 'ev') {
        if ($('evMiPerKwh')) $('evMiPerKwh').value = 3.4;
    } else {
        if (body.mpg) $('mpg').value = body.mpg;
    }

    $('down').value = Math.round(priceNow * 0.12 / 100) * 100;

    buyingUsed = band.buyAge > 0;
    applyCreditTier();
    priceAnchor = 'price';
    syncPriceFields();
    $('resale').dataset.touched = '0';
}


/* A specific nameplate at the age you picked, priced off its own curve
   rather than the segment average. */
function applyRealModel(key) {
    const model = MODELS.find((m) => m.key === key);
    const band = AGE_BANDS[carAge];
    if (!model || !band) return;

    selectedModel = key;
    const modelYear = new Date().getFullYear() - band.buyAge;
    const msrp = modelMsrp(model, modelYear);
    const miles = num('miles') || 12000;

    /* Every nameplate in the set is a compact SUV, so a shape picked
       earlier must not also be applied on top of the real car. */
    applyCarProfile('suv');
    $('price').value = Math.round(modelValueAt(model, msrp, band.buyAge) / 50) * 50;
    priceAnchor = 'price';
    /* Whichever generic curve tracks this nameplate most closely. */
    const target = modelRetained(model, 5);
    $('depreciation').value = Object.keys(DEPRECIATION_CURVES).reduce((best, k) =>
        Math.abs(retainedValue(5, k) - target) < Math.abs(retainedValue(5, best) - target) ? k : best,
        'average');
    $('resale').dataset.touched = '0';
    guideAnswers.modelLabel = model.name + ', ' + modelYear;
}

/* Says in words what the two chips just did to the numbers. */
function renderCarProfile(v) {
    const host = $('carProfile').querySelector('span:last-child');
    if (!carBrand || !carAge) {
        host.innerHTML = 'Pick a marque, a shape and an age above and the price, depreciation curve, ' +
            'upkeep and insurance are all set together — they are not independent. Or type your own ' +
            'numbers below.';
        return;
    }
    const brand = BRANDS[carBrand], band = AGE_BANDS[carAge];
    const shape = BODY_TYPES[carBody];
    const sellAge = band.buyAge + v.months / 12;
    const basicLeft = Math.max(0, brand.warrantyBasic - band.buyAge);
    const powerLeft = Math.max(0, brand.warrantyPower - band.buyAge);

    let cover;
    if (basicLeft > 0) {
        cover = '<strong>' + basicLeft.toFixed(0) + ' years of bumper-to-bumper cover left</strong> (' +
            brand.warrantyBasic + 'yr basic, ' + brand.warrantyPower + 'yr powertrain), so early repairs ' +
            'are not yours.';
    } else if (powerLeft > 0) {
        cover = 'Basic cover has expired; <strong>' + powerLeft.toFixed(0) + ' years of powertrain ' +
            'warranty remain</strong>, which is the expensive half.';
    } else {
        cover = '<strong>Out of warranty entirely</strong> — every repair is yours from day one.';
    }

    /* "Japanese compact SUV (RAV4, CR-V…)" once a shape is chosen,
       otherwise the marque on its own as before. */
    const name = brand.label + (shape ? ' ' + shape.label.replace(/^\S+\s/, '').toLowerCase() : '');
    host.innerHTML = name + ' (' + brand.examples +
        ') at ' + band.label.toLowerCase() + ': ' +
        'worth ' + usd0(v.price) + ' now, ' + usd0(v.resale) + ' after your ' + v.months + ' months, ' +
        'which is age ' + sellAge.toFixed(1) + '. ' + cover + ' Upkeep is set to <strong>' +
        usd0(v.maintenance) + '/mo</strong> — the ten-year total for this marque is ' +
        usd0(brand.maint10) + ', spread across the years you actually own it and scaled to your mileage' +
        (shape && shape.maintMult !== 1
            ? ' and to the shape, since ' + (shape.maintMult > 1 ? 'a bigger' : 'a smaller') +
              ' vehicle is ' + (shape.maintMult > 1 ? 'dearer' : 'cheaper') + ' on tires and brakes'
            : '') + '. ' + brand.note;
}

function renderGuide() {
    /* A step can drop out entirely — there is no point asking which
       Korean model when none are in the data set. */
    let guard = 0;
    while (GUIDE_STEPS[guideIndex] && GUIDE_STEPS[guideIndex].skipIf &&
           GUIDE_STEPS[guideIndex].skipIf() && guard++ < GUIDE_STEPS.length) {
        guideIndex = Math.min(guideIndex + 1, GUIDE_STEPS.length - 1);
    }
    const step = GUIDE_STEPS[guideIndex];
    const choices = step.choicesFn ? step.choicesFn() : step.choices;

    $('stepProgress').innerHTML = GUIDE_STEPS.map((_, i) =>
        '<span class="step-pip ' + (i < guideIndex ? 'done' : i === guideIndex ? 'current' : '') +
        '"></span>').join('');
    $('stepCount').textContent = 'Step ' + (guideIndex + 1) + ' of ' + GUIDE_STEPS.length;
    $('stepQ').textContent = step.q;
    /* Some questions can only be explained once the earlier answers are
       in — a budget means nothing until the car it is buying is priced. */
    $('stepWhy').innerHTML = step.whyFn ? step.whyFn() : step.why;

    const body = $('stepBody');
    body.innerHTML = '';

    if (step.recap) {
        body.innerHTML = '<div class="recap">' + [
            ['Credit', CREDIT_TIERS[creditTier].label],
            ['Cash available', usd0(num('cash'))],
            ['Keeping it', $('horizon').value + ' months'],
            ['Car', guideAnswers.modelLabel && guideAnswers.model !== 'none'
                ? guideAnswers.modelLabel
                : (carBrand ? BRANDS[carBrand].label +
                    (BODY_TYPES[carBody] ? ' ' + BODY_TYPES[carBody].label.replace(/^\S+\s/, '') : '') +
                    ', ' + AGE_BANDS[carAge].label.toLowerCase() : '—')],
            ['List price', usd0(num('price'))],
            ['Upkeep', usd0(num('maintenance')) + '/mo'],
            ['Out the door', usd0(num('otd'))],
            ['Driving', Number($('miles').value).toLocaleString('en-US') + ' mi/yr'],
            ['Car tax', $('taxRate').value + '%'],
            ['APR you would get', $('apr').value + '%']
        ].map(([l, v]) => '<div class="recap-row"><span class="r-label">' + l +
            '</span><span class="r-val">' + v + '</span></div>').join('') + '</div>';

        if (guideAnswers.licence === 'no') {
            body.innerHTML += '<div class="callout warn" style="margin-top:10px"><span class="ico">🪪</span>' +
                '<span>Without a licence, renting monthly is your only real route today — and it ' +
                'doubles as the car for the road test, since you are the named driver and the ' +
                'insurance comes with it. The Georgia steps, including the licensed-passenger rule, ' +
                'are at the bottom of the page.</span></div>';
        }
        $('stepNext').textContent = 'Show me the answer →';
        $('stepSkip').style.display = 'none';
    } else {
        $('stepNext').textContent = 'Next →';
        $('stepSkip').style.display = '';
    }

    if (choices) {
        const grid = document.createElement('div');
        grid.className = 'choice-grid';
        const current = step.get ? step.get() : Number($(step.field).value);
        for (const choice of choices) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'choice' + (choice.value === current ? ' selected' : '');
            btn.innerHTML = '<span class="c-label">' + choice.label + '</span>' +
                (choice.sub ? '<span class="c-sub">' + choice.sub + '</span>' : '');
            btn.addEventListener('click', () => {
                if (step.set) step.set(choice.value);
                else { $(step.field).value = choice.value; }
                update();
                renderGuide();
                if (!choice.stay) queueAdvance();
            });
            grid.appendChild(btn);
        }
        body.appendChild(grid);
    }

    /* A free-text box alongside the choices, for anyone whose answer is
       not on the list. */
    if (step.field) {
        const wrap = document.createElement('div');
        wrap.className = 'field';
        wrap.style.marginTop = choices ? '10px' : '0';
        wrap.innerHTML = '<label for="guideInput">' + (choices ? 'Or type it exactly' : 'Your number') +
            '</label><div class="input-shell">' +
            (step.prefix ? '<span class="prefix">' + step.prefix + '</span>' : '') +
            '<input type="number" id="guideInput" value="' + $(step.field).value + '">' +
            (step.suffix ? '<span class="suffix">' + step.suffix + '</span>' : '') + '</div>';
        body.appendChild(wrap);
        const input = wrap.querySelector('#guideInput');
        input.addEventListener('input', () => {
            clearTimeout(advanceTimer);
            $(step.field).value = input.value;
            if (step.field === 'price') priceAnchor = 'price';
            update();
            for (const c of body.querySelectorAll('.choice')) c.classList.remove('selected');
        });
    }

    if (step.quick) {
        const row = document.createElement('div');
        row.className = 'preset-row';
        row.style.marginTop = '8px';
        for (const value of step.quick) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'preset-btn';
            btn.textContent = usd0(value);
            btn.addEventListener('click', () => {
                $(step.field).value = value;
                update();
                renderGuide();
                queueAdvance();
            });
            row.appendChild(btn);
        }
        body.appendChild(row);
    }

    /* A question can hand off to a screen that answers it properly. The
       explorer opens over the guide and comes back to this same step,
       with whatever it changed already in the fields. */
    if (step.explore) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'preset-btn explore-btn';
        btn.innerHTML = '💰 ' + step.explore + ' →';
        btn.addEventListener('click', () => {
            clearTimeout(advanceTimer);
            openBudgetModal({ onApply: renderGuide });
        });
        body.appendChild(btn);
    }

    $('stepBack').style.visibility = guideIndex === 0 ? 'hidden' : 'visible';
}

function openGuide() {
    guideIndex = 0;
    $('guideModal').hidden = false;
    requestAnimationFrame(() => {
        $('guideBackdrop').classList.add('open');
        $('guideModal').classList.add('open');
    });
    renderGuide();
    $('guideClose').focus();
}

function closeGuide(showResult) {
    clearTimeout(advanceTimer);
    $('guideBackdrop').classList.remove('open');
    $('guideModal').classList.remove('open');
    setTimeout(() => { $('guideModal').hidden = true; }, 250);
    if (showResult) {
        $('sec-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function guideNext() {
    clearTimeout(advanceTimer);
    if (guideIndex >= GUIDE_STEPS.length - 1) {
        closeGuide(true);
        return;
    }
    guideIndex++;
    renderGuide();
    $('guideModal').scrollTop = 0;
}
