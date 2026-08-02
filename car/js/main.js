/* ── Wiring ──────────────────────────────────────────────────────────
   Event listeners, the single update() that redraws everything, and
   localStorage persistence. Loaded last. */
'use strict';

/* ── Wiring ────────────────────────────────────────────────────── */
const INPUT_IDS = ['horizon', 'price', 'otd', 'taxRate', 'fees', 'depreciation', 'disposal', 'resale', 'miles',
    'insurance', 'maintenance', 'mpg', 'gasPrice', 'evKwhPrice', 'evMiPerKwh', 'registration', 'cash', 'returnRate', 'down', 'apr', 'loanTerm',
    'leasePayment', 'leaseSigning', 'leaseTerm', 'leaseAllowance', 'leaseMileagePlan', 'leaseOverage',
    'leasePrepaidRate', 'leaseDisposition', 'leaseWear', 'leaseRenewal',
    'rentRate', 'rentStartFee', 'rentAllowance', 'rentBlockPrice',
    'sixtLdw', 'sixtDriver', 'sixtRoadside', 'sixtLicense', 'sixtExcess', 'sixtTax',
    'flexRate', 'flexProtection', 'flexTax', 'flexDelivery', 'flexOnTrack', 'flexExcess',
    'flexStartFee', 'flexAllowance', 'flexBlockPrice', 'ownInsuranceQuote',
    'rentalDaily', 'rentalMonthly'];

function update() {
    syncPriceFields();

    /* Toggle EV vs ICE fuel input visibility */
    const isEv = carPowertrain === 'ev';
    if ($('evMiPerKwhField')) $('evMiPerKwhField').style.display = isEv ? '' : 'none';
    if ($('evKwhPriceField')) $('evKwhPriceField').style.display = isEv ? '' : 'none';
    if ($('iceMpgField')) $('iceMpgField').style.display = isEv ? 'none' : '';
    if ($('iceGasPriceField')) $('iceGasPriceField').style.display = isEv ? 'none' : '';

    const v = readInputs();

    /* The resale field tracks the depreciation curve until the user
       overrides it, then it is theirs to keep. Either way it shows the
       expected case, so switching to pessimistic moves the bars without
       rewriting a number under the cursor. */
    if ($('resale').dataset.touched !== '1') {
        $('resale').value = Math.round(v.expectedResale);
    }

    const results = computeAll(v);
    /* Before the chart: the bars name the vehicle behind each route, and
       that comes from which quote chip is lit. */
    syncPresets(v.months, v);
    const best = renderChart(results, v);
    renderBreakeven(v);
    renderTable(results, v);
    renderVerdict(results, best, v);
    renderCashNote(results, v);
    renderOptionNotes(results, v);
    renderCarProfile(v);
    renderAccountabilityPanel(v, results);
    renderMileagePanel(results, v);
    renderCredit();
    renderInsights(results, v);
    renderDecisionFlow(results, v);
    /* Two different bases, and conflating them is what makes a haircut
       look punitive: the model works in market value, the published
       spreads quote private money. Say both. */
    const disp = DISPOSAL[v.channel];
    const odo = Math.round(v.milesAtSale / 1000) * 1000;
    const at = ' At ' + v.ageAtSale.toFixed(1) + ' years and ' +
        odo.toLocaleString('en-US') + ' miles that is ';
    const vsMarket = Math.round((1 - v.disposal) * 100);
    $('disposalNote').innerHTML = disp.note + at + (DISPOSAL[v.channel].dealer
        ? '<strong>' + Math.round(v.haircutVsPrivate * 100) + '% under private money</strong> — ' +
          vsMarket + '% under market value, since private money is itself ' +
          Math.round((1 - disposalFactor('private', v.ageAtSale, v.milesAtSale)) * 100) + '% under it'
        : '<strong>' + vsMarket + '% under market value</strong>, which is what private money means here') +
        (v.tradeTaxCredit > 0
            ? '. That is offset by <strong>' + usd0(v.tradeTaxCredit) +
              '</strong> of tax you do not pay on your next car'
            : '') + '.';
    /* The case moves what the car fetches at the end, and that is the
       largest single line on both owning routes — so say the number
       rather than leaving it to be inferred from a shifting bar. */
    const scen = SCENARIOS[scenarioCase];
    const vsExpected = scenarioCase === 'expected' ? '' :
        ' — ' + usd0(Math.abs(v.resale - v.resale / scen.resale)) +
        (scen.resale > 1 ? ' more' : ' less') + ' than expected';
    $('caseBlurb').innerHTML = scen.blurb +
        ' Resale at ' + v.months + ' months: <strong>' + usd0(v.resale) + '</strong>' +
        vsExpected + '.' +
        (v.repairShock ? ' Includes <strong>' + usd0(v.repairShock) +
            '</strong> for one major repair, since the warranty runs out before you sell.' : '');
    $('caveatMonths').textContent = v.months;

    /* Resale is the biggest single line on both owning routes and the case
       toggle swings it by thousands, but the field itself holds the
       expected figure and does not move — which reads as the toggle doing
       nothing. Spell the swing out where the number is entered, and mark
       whichever case is currently driving the bars. */
    const held = scenarioCase;
    const bycase = {};
    for (const key of Object.keys(SCENARIOS)) {
        scenarioCase = key;
        bycase[key] = readInputs().resale;
    }
    scenarioCase = held;
    const mark = (key, text) => key === scenarioCase
        ? '<strong class="now">' + text + '</strong>' : text;
    $('resaleRange').innerHTML =
        mark('optimistic', 'good market ' + usd0(bycase.optimistic)) + ' · ' +
        mark('expected', 'expected ' + usd0(bycase.expected)) + ' · ' +
        mark('pessimistic', 'soft market ' + usd0(bycase.pessimistic)) +
        ' — a <strong>' + usd0(bycase.optimistic - bycase.pessimistic) + '</strong> swing, and the ' +
        'largest single uncertainty in owning the car. The scenario buttons on the chart pick which ' +
        'one the bars use.';
    for (const btn of document.querySelectorAll('#brandPresets .preset-btn')) {
        btn.classList.toggle('active', btn.dataset.brand === carBrand);
    }
    for (const btn of document.querySelectorAll('#bodyPresets .preset-btn')) {
        btn.classList.toggle('active', btn.dataset.body === carBody);
    }
    for (const btn of document.querySelectorAll('#powertrainPresets .preset-btn')) {
        btn.classList.toggle('active', btn.dataset.powertrain === carPowertrain);
    }
    for (const btn of document.querySelectorAll('#agePresets .preset-btn')) {
        btn.classList.toggle('active', btn.dataset.age === carAge);
    }
    for (const btn of document.querySelectorAll('#flexTierPresets .preset-btn')) {
        btn.classList.toggle('active', btn.dataset.tier === flexTier);
    }
    save();
}

function syncPresets(months, v) {
    for (const btn of document.querySelectorAll('#horizonPresets .preset-btn')) {
        btn.classList.toggle('active', Number(btn.dataset.months) === months);
    }
    /* The lease and subscription chips are quotes for particular vehicles,
       so which one is selected decides what the page can say those two
       routes are pricing. Match on the rate: type the number by hand and
       no chip lights, which is itself the honest answer — we no longer
       know what car it is. */
    for (const btn of document.querySelectorAll('#leasePresets .preset-btn')) {
        btn.classList.toggle('active',
            Number(btn.dataset.payment) === v.leasePayment &&
            (btn.dataset.signing === undefined || Number(btn.dataset.signing) === v.leaseSigning) &&
            (!btn.dataset.term || Number(btn.dataset.term) === v.leaseTerm));
    }
    for (const btn of document.querySelectorAll('#rentPresets .preset-btn')) {
        btn.classList.toggle('active', Number(btn.dataset.rate) === v.rentRate &&
            Number(btn.dataset.ldw) === v.sixtLdw);
    }
    for (const btn of document.querySelectorAll('#rentalPresets .preset-btn')) {
        btn.classList.toggle('active', Number(btn.dataset.monthly) === v.rentalMonthly);
    }
    for (const btn of document.querySelectorAll('#flexPresets .preset-btn')) {
        btn.classList.toggle('active', Number(btn.dataset.rate) === v.flexRate &&
            Number(btn.dataset.protection) === v.flexProtection);
    }
    for (const btn of document.querySelectorAll('#flexProtectionTiers .preset-btn')) {
        btn.classList.toggle('active', Number(btn.dataset.prot) === v.flexProtection);
    }
}

function save() {
    try {
        const data = {
            touchedResale: $('resale').dataset.touched === '1',
            creditTier, buyingUsed, carBrand, carAge, carBody, carPowertrain, flexTier, scenarioCase
        };
        for (const id of INPUT_IDS) {
            const el = $(id);
            if (el) data[id] = el.value;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* private mode — inputs just will not persist */ }
}

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        for (const id of INPUT_IDS) {
            const el = $(id);
            if (el && typeof data[id] === 'string' && data[id] !== '') el.value = data[id];
        }
        if (data.touchedResale) $('resale').dataset.touched = '1';
        if (CREDIT_TIERS[data.creditTier]) creditTier = data.creditTier;
        if (typeof data.buyingUsed === 'boolean') buyingUsed = data.buyingUsed;
        if (BRANDS[data.carBrand]) carBrand = data.carBrand;
        if (AGE_BANDS[data.carAge]) carAge = data.carAge;
        if (BODY_TYPES[data.carBody]) carBody = data.carBody;
        if (POWERTRAIN_TYPES[data.carPowertrain]) carPowertrain = data.carPowertrain;
        if (FLEXCAR_TIERS[data.flexTier]) flexTier = data.flexTier;
        if (SCENARIOS[data.scenarioCase]) scenarioCase = data.scenarioCase;
    } catch (e) { /* corrupt or unavailable storage — fall back to defaults */ }
}


/* The price pair has to claim its anchor in the same handler that
   recomputes, or the sync would run against a stale anchor and stomp
   whichever field was just typed into. */
function onInput(e) {
    if (e.target.id === 'price') priceAnchor = 'price';
    else if (e.target.id === 'otd') priceAnchor = 'otd';
    update();
}

for (const id of INPUT_IDS) {
    $(id).addEventListener('input', onInput);
    $(id).addEventListener('change', onInput);
}

/* Editing resale by hand detaches it from the curve; clearing the
   field hands control back. */
$('resale').addEventListener('input', () => {
    $('resale').dataset.touched = $('resale').value.trim() === '' ? '0' : '1';
});
$('depreciation').addEventListener('change', () => {
    $('resale').dataset.touched = '0';
});

for (const btn of document.querySelectorAll('#horizonPresets .preset-btn')) {
    btn.addEventListener('click', () => {
        $('horizon').value = btn.dataset.months;
        update();
    });
}

for (const btn of document.querySelectorAll('#brandPresets .preset-btn')) {
    btn.addEventListener('click', () => {
        carBrand = btn.dataset.brand;
        if (!carAge) carAge = 'three';
        applyCarProfile();
        update();
    });
}

for (const btn of document.querySelectorAll('#agePresets .preset-btn')) {
    btn.addEventListener('click', () => {
        carAge = btn.dataset.age;
        if (!carBrand) carBrand = 'japanese';
        applyCarProfile();
        update();
    });
}

for (const btn of document.querySelectorAll('#bodyPresets .preset-btn')) {
    btn.addEventListener('click', () => {
        carBody = btn.dataset.body;
        if (!carBrand) carBrand = 'japanese';
        if (!carAge) carAge = 'three';
        applyCarProfile();
        update();
    });
}

for (const btn of document.querySelectorAll('#powertrainPresets .preset-btn')) {
    btn.addEventListener('click', () => {
        carPowertrain = btn.dataset.powertrain;
        if (!carBrand) carBrand = 'japanese';
        if (!carAge) carAge = 'three';
        applyCarProfile();
        update();
    });
}

for (const btn of document.querySelectorAll('#flexTierPresets .preset-btn')) {
    btn.addEventListener('click', () => {
        flexTier = btn.dataset.tier;
        update();
    });
}


for (const btn of document.querySelectorAll('#creditTiers .preset-btn')) {
    btn.addEventListener('click', () => {
        creditTier = btn.dataset.tier;
        applyCreditTier();
        update();
    });
}

/* A subscription preset is a rate *and* a cap — the Sixt+ 500 mi/mo
   allowance is as much a part of the quote as the $1,000. */
for (const btn of document.querySelectorAll('#rentPresets .preset-btn')) {
    btn.addEventListener('click', () => {
        $('rentRate').value = btn.dataset.rate;
        for (const [key, id] of [['ldw', 'sixtLdw'], ['driver', 'sixtDriver'],
                                 ['roadside', 'sixtRoadside'], ['license', 'sixtLicense'],
                                 ['tax', 'sixtTax'], ['allowance', 'rentAllowance'],
                                 ['start', 'rentStartFee']]) {
            if (btn.dataset[key] !== undefined) $(id).value = btn.dataset[key];
        }
        update();
    });
}

for (const btn of document.querySelectorAll('#leasePresets .preset-btn')) {
    btn.addEventListener('click', () => {
        $('leasePayment').value = btn.dataset.payment;
        if (btn.dataset.signing !== undefined) $('leaseSigning').value = btn.dataset.signing;
        if (btn.dataset.term) $('leaseTerm').value = btn.dataset.term;
        update();
    });
}

for (const btn of document.querySelectorAll('#flexProtectionTiers .preset-btn')) {
    btn.addEventListener('click', () => {
        $('flexProtection').value = btn.dataset.prot;
        update();
    });
}

for (const btn of document.querySelectorAll('#flexPresets .preset-btn')) {
    btn.addEventListener('click', () => {
        $('flexRate').value = btn.dataset.rate;
        $('flexProtection').value = btn.dataset.protection;
        $('flexDelivery').value = btn.dataset.delivery;
        if (btn.dataset.allowance) $('flexAllowance').value = btn.dataset.allowance;
        update();
    });
}

/* A rental chip carries both rates: the monthly one the route is charged
   at, and the daily one that says what a short hire would have cost. */
for (const btn of document.querySelectorAll('#rentalPresets .preset-btn')) {
    btn.addEventListener('click', () => {
        $('rentalDaily').value = btn.dataset.daily;
        if (btn.dataset.monthly) $('rentalMonthly').value = btn.dataset.monthly;
        update();
    });
}

/* The legend is the switch. Delegated, because it is re-rendered on every
   update. */
$('legend').addEventListener('click', (e) => {
    const btn = e.target.closest('.legend-toggle');
    if (btn) {
        const key = btn.dataset.comp;
        if (activeComponents.has(key)) activeComponents.delete(key);
        else activeComponents.add(key);
        /* Never leave nothing on — an empty chart answers nothing. */
        if (!activeComponents.size) activeComponents.add(key);
        update();
        return;
    }
    if (e.target.closest('#legendReset')) {
        for (const c of COMPONENTS) activeComponents.add(c.key);
        update();
    }
});

$('tableToggle').addEventListener('click', () => {
    const wrap = $('tableWrap');
    const shown = !wrap.hidden;
    wrap.hidden = shown;
    $('tableToggle').textContent = shown ? 'Show numbers' : 'Hide numbers';
    $('tableToggle').setAttribute('aria-expanded', String(!shown));
});

for (const btn of $('caseToggle').querySelectorAll('button')) {
    btn.addEventListener('click', () => {
        scenarioCase = btn.dataset.case;
        for (const b of $('caseToggle').querySelectorAll('button')) {
            b.classList.toggle('active', b === btn);
        }
        update();
    });
}

for (const btn of $('curveMode').querySelectorAll('button')) {
    btn.addEventListener('click', () => {
        curveMeasure = btn.dataset.mode;
        for (const b of $('curveMode').querySelectorAll('button')) {
            b.classList.toggle('active', b === btn);
        }
        update();
    });
}

$('guideCount').textContent = '— ' + (GUIDE_STEPS.length - 1) + ' questions, fills the whole page in';
$('openGuide').addEventListener('click', openGuide);
$('guideClose').addEventListener('click', () => closeGuide(false));
$('guideBackdrop').addEventListener('click', () => closeGuide(false));
$('stepNext').addEventListener('click', guideNext);
$('stepSkip').addEventListener('click', guideNext);
$('stepBack').addEventListener('click', () => {
    clearTimeout(advanceTimer);
    if (guideIndex > 0) { guideIndex--; renderGuide(); }
});
document.addEventListener('keydown', (e) => {
    if ($('guideModal').hidden) return;
    if (e.key === 'Escape') closeGuide(false);
    /* Enter advances, unless the caret is in the free-text box and the
       user is still typing a number. */
    if (e.key === 'Enter' && e.target.id !== 'guideInput') guideNext();
});

$('openDataModal').addEventListener('click', openDataModal);
$('dataClose').addEventListener('click', closeDataModal);
$('dataBackdrop').addEventListener('click', closeDataModal);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('dataModal').hidden) closeDataModal();
});

$('openDepModal').addEventListener('click', openModal);
$('depClose').addEventListener('click', closeModal);
$('depBackdrop').addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('depModal').hidden) closeModal();
});

window.addEventListener('scroll', hideTooltip, { passive: true });
document.addEventListener('pointerdown', hideTooltip);
window.addEventListener('resize', () => { if (!$('depModal').hidden) refreshModal(); });

/* Jumping to a folded panel should unfold it — otherwise the link lands
   you on a closed summary and looks broken. */
for (const link of document.querySelectorAll('.nav-link')) {
    link.addEventListener('click', () => {
        const target = document.querySelector(link.getAttribute('href'));
        if (target && target.tagName === 'DETAILS') target.open = true;
    });
}

// ScrollSpy observer for section index
const spySections = document.querySelectorAll('section[id], details[id]');
const spyLinks = document.querySelectorAll('.nav-link');
if ('IntersectionObserver' in window && spySections.length > 0) {
    const spyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                spyLinks.forEach(link => {
                    if (link.getAttribute('href') === '#' + id) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
        });
    }, { rootMargin: '-15% 0px -50% 0px' });
    spySections.forEach(sec => spyObserver.observe(sec));
}

buildModal();
buildDataModal();
load();
update();
