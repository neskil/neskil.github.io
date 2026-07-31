/* ── Depreciation-by-model modal ─────────────────────────────────────
   Six real nameplates on their own curves, so "what does it lose" can be
   answered about a car rather than a segment. */
'use strict';

/* ── Depreciation by model ───────────────────────────────────────
   Each nameplate carries a first-year drop and an annual rate on the
   remainder, solved so five-year retention lands on the figure from
   the iSeeCars 2026 depreciation study (950k+ transactions of
   five-year-old vehicles, March 2025 – February 2026). Prices when new
   are 2019 base-trim MSRPs. Same curve shape as the main calculator,
   so the two agree. */
const MODELS = [
    { key: 'rav4',    name: 'Toyota RAV4', brand: 'japanese', d1: 0.12, r: 0.0392, hold5: 0.750, hybrid: true,
      trims: [['LE', 25500], ['XLE', 27300], ['XLE Premium', 29500], ['Limited', 33500]] },
    { key: 'crv',     name: 'Honda CR-V', brand: 'japanese', d1: 0.13, r: 0.0492, hold5: 0.711, hybrid: true,
      trims: [['LX', 24350], ['EX', 27250], ['EX-L', 29750], ['Touring', 32750]] },
    { key: 'cx5',     name: 'Mazda CX-5', brand: 'japanese', d1: 0.17, r: 0.0849, hold5: 0.582,
      trims: [['Sport', 25325], ['Touring', 27660], ['Grand Touring', 31090], ['Signature', 36890]] },
    { key: 'x3',      name: 'BMW X3', brand: 'germanLux', d1: 0.24, r: 0.0976, hold5: 0.504,
      trims: [['sDrive30i', 41000], ['xDrive30i', 43000], ['M40i', 54650]] },
    { key: 'equinox', name: 'Chevrolet Equinox', brand: 'american', d1: 0.22, r: 0.1079, hold5: 0.494,
      trims: [['L', 24995], ['LS', 26995], ['LT', 28295], ['Premier', 32195]] },
    { key: 'escape',  name: 'Ford Escape', brand: 'american', d1: 0.23, r: 0.1223, hold5: 0.457, hybrid: true,
      trims: [['S', 25200], ['SE', 26700], ['SEL', 29000], ['Titanium', 35215]] }
];

/* Real 2019 trim ladders rather than a multiplier — a CR-V Touring was
   $32,750 against $24,350 for the LX. Options give back less than they
   cost, so higher rungs carry a small retention penalty. Ladders differ
   in length, so the rung is an index and the penalty is spread across
   however many rungs the car has. */
const DESTINATION_2019 = 1045;

/* Hybrids cost more new and hold it better. */
const HYBRID = { priceMult: 1.04, retentionAdj: 0.03 };

function trimRetentionAdj(model) {
    const n = model.trims.length;
    if (n < 2) return 0;
    /* +2 points on the base rung sliding to -3 on the top one. */
    return 0.02 - 0.05 * (selectedTrim / (n - 1));
}

const MODEL_YEARS = [];
for (let y = 2026; y >= 2014; y--) MODEL_YEARS.push(y);

/* Sticker prices drifted up over the decade; 2019 is the anchor. */
function modelMsrp(model, year) {
    const rung = model.trims[Math.min(selectedTrim, model.trims.length - 1)];
    const mult = selectedHybrid && model.hybrid ? HYBRID.priceMult : 1;
    return Math.round((rung[1] + DESTINATION_2019) * mult *
        Math.pow(1.032, year - 2019) / 50) * 50;
}

function modelRetained(model, years) {
    if (years <= 0) return 1;
    let adj = trimRetentionAdj(model);
    if (selectedHybrid && model.hybrid) adj += HYBRID.retentionAdj;
    const d1 = Math.min(0.5, Math.max(0.05, model.d1 - adj));
    return Math.max(0.03, retainedCurve(years, d1, model.r));
}

/* Same odometer rule the calculator uses. */
function modelMileageFactor(milesPerYear, age) {
    return mileagePenalty((milesPerYear - 12000) * age);
}

function modelValueAt(model, msrp, age) {
    return msrp * modelRetained(model, age) * modelMileageFactor(num('modelMiles') || 12000, age);
}

/* A 2019 car is seven years old today — you cannot buy one at nought. */
function earliestBuyAge() {
    return Math.max(0, new Date().getFullYear() - Number($('modelYear').value));
}

function currentModel() {
    return MODELS.find((m) => m.key === selectedModel);
}

function renderDepChart() {
    const model = currentModel();
    const msrp = Math.max(0, num('modelMsrp'));
    const buyAge = parseFloat($('buyAge').value);
    const hold = parseFloat($('holdYears').value);
    const sellAge = buyAge + hold;
    /* Always keep the sell point on the canvas. */
    const maxAge = Math.max(12, Math.ceil(sellAge));

    const width = 700, height = 280;
    const pad = { l: 52, r: 58, t: 12, b: 32 };
    const yMax = msrp * 1.05 || 1;
    const f = chartFrame({ width, height, pad, xMin: 0, xMax: maxAge, yMin: 0, yMax });
    const yStep = niceStep(yMax, 5);

    let svg = '<svg class="linechart" viewBox="0 0 ' + width + ' ' + height +
        '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Value against age by model">';

    for (let y = 0; y <= yMax; y += yStep) {
        svg += '<line class="grid" x1="' + pad.l + '" y1="' + f.py(y).toFixed(1) + '" x2="' +
            (width - pad.r) + '" y2="' + f.py(y).toFixed(1) + '"/>';
        svg += '<text class="tick" x="' + (pad.l - 6) + '" y="' + (f.py(y) + 3).toFixed(1) +
            '" text-anchor="end">' + usdShort(y) + '</text>';
    }
    for (let a = 0; a <= maxAge; a += 2) {
        svg += '<text class="tick" x="' + f.px(a).toFixed(1) + '" y="' + (height - pad.b + 14) +
            '" text-anchor="middle">' + a + 'y</text>';
    }
    svg += '<line class="axis" x1="' + pad.l + '" y1="' + (height - pad.b) + '" x2="' +
        (width - pad.r) + '" y2="' + (height - pad.b) + '"/>';
    svg += '<text class="axis-title" x="' + (width - pad.r) + '" y="' + (height - 3) +
        '" text-anchor="end">Age in years →</text>';

    /* Hold window */
    if (sellAge > buyAge) {
        svg += '<rect class="band" x="' + f.px(Math.min(buyAge, maxAge)).toFixed(1) + '" y="' + pad.t +
            '" width="' + Math.max(0, f.px(Math.min(sellAge, maxAge)) - f.px(Math.min(buyAge, maxAge))).toFixed(1) +
            '" height="' + f.plotH + '"/>';
    }

    /* Context: every other model, recessive. One focus line plus quiet
       context beats six competing hues. */
    const path = (m) => {
        const pts = [];
        for (let a = 0; a <= maxAge; a += 0.25) {
            pts.push((a ? 'L' : 'M') + f.px(a).toFixed(1) + ' ' +
                f.py(modelValueAt(m, msrp, a)).toFixed(1));
        }
        return pts.join(' ');
    };

    const modelLabels = [];
    for (const m of MODELS) {
        const endY = f.py(modelValueAt(m, msrp, maxAge)) + 3;
        const focus = m.key === selectedModel;
        if (!focus) svg += '<path class="ctx" d="' + path(m) + '"/>';
        modelLabels.push({
            y: endY,
            text: m.name.split(' ').slice(-1)[0],
            cls: focus ? 'serie-label' : 'ctx-label',
            color: focus ? 'var(--accent)' : ''
        });
    }
    svg += '<path class="serie" d="' + path(model) + '" stroke="var(--accent)" stroke-width="2.5"/>';

    for (const l of stackLabels(modelLabels, 11, pad.t + 8, height - pad.b)) {
        svg += '<text class="' + l.cls + '" x="' + (width - pad.r + 5) + '" y="' + l.y.toFixed(1) + '"' +
            (l.color ? ' fill="' + l.color + '"' : '') + '>' + l.text + '</text>';
    }

    /* Everything left of today is history — you cannot buy into it. */
    const ageNow = earliestBuyAge();
    if (ageNow > 0) {
        svg += '<rect x="' + pad.l + '" y="' + pad.t + '" width="' +
            Math.max(0, f.px(Math.min(ageNow, maxAge)) - pad.l).toFixed(1) + '" height="' + f.plotH +
            '" fill="rgba(148,163,184,0.07)"/>';
        svg += '<text class="tick" x="' + ((pad.l + f.px(Math.min(ageNow, maxAge))) / 2).toFixed(1) +
            '" y="' + (height - pad.b - 6) + '" text-anchor="middle">already happened</text>';
    }
    if (ageNow > 0 && ageNow <= maxAge) {
        svg += '<line class="marker-line" x1="' + f.px(ageNow).toFixed(1) + '" y1="' + pad.t +
            '" x2="' + f.px(ageNow).toFixed(1) + '" y2="' + (height - pad.b) +
            '" stroke="rgba(148,163,184,0.55)"/>';
        svg += '<text class="tick" x="' + f.px(ageNow).toFixed(1) + '" y="' + (pad.t + 9) +
            '" text-anchor="middle">today · ' + ageNow + 'y</text>';
    }

    /* The two chosen points */
    for (const [age, label] of [[buyAge, 'buy'], [sellAge, 'sell']]) {
        if (age > maxAge) continue;
        const value = modelValueAt(model, msrp, age);
        svg += '<circle cx="' + f.px(age).toFixed(1) + '" cy="' + f.py(value).toFixed(1) +
            '" r="5" fill="var(--accent)" stroke="var(--surface-1)" stroke-width="2"/>';
        svg += '<text class="tick" x="' + f.px(age).toFixed(1) + '" y="' + (f.py(value) - 10).toFixed(1) +
            '" text-anchor="middle" fill="var(--text-primary)">' + label + ' ' + usdShort(value) + '</text>';
    }
    svg += '</svg>';

    $('depChart').innerHTML = svg;
    $('depLegend').innerHTML =
        '<span class="legend-item"><span class="legend-dash" style="border-top-color:var(--accent)">' +
        '</span>' + model.name + '</span>' +
        '<span class="legend-item"><span class="legend-dash" ' +
        'style="border-top-color:rgba(148,163,184,0.5)"></span>the others, same price when new</span>';
}

function renderDepReadout() {
    const model = currentModel();
    const msrp = Math.max(0, num('modelMsrp'));
    const buyAge = parseFloat($('buyAge').value);
    const hold = parseFloat($('holdYears').value);
    const sellAge = buyAge + hold;

    const buyValue = modelValueAt(model, msrp, buyAge);
    const sellValue = modelValueAt(model, msrp, sellAge);
    const loss = buyValue - sellValue;
    const pctOfBuy = buyValue > 0 ? loss / buyValue * 100 : 0;
    const pctOfNew = msrp > 0 ? loss / msrp * 100 : 0;

    $('buyAgeVal').textContent = buyAge === 0 ? 'brand new' : buyAge.toFixed(1) + ' yr old';
    $('holdYearsVal').textContent = hold.toFixed(1) + ' yr';

    $('lossGrid').innerHTML = [
        ['You pay', usd0(buyValue), buyAge === 0 ? 'new' : 'at ' + buyAge.toFixed(1) + ' yr old'],
        ['Worth at sale', usd0(sellValue), 'at ' + sellAge.toFixed(1) + ' yr old'],
        ['Value lost', usd0(loss), pctOfBuy.toFixed(0) + '% of what you paid'],
        ['Per year', usd0(loss / hold), usd0(loss / (hold * 12)) + '/mo'],
        ['Of new price', pctOfNew.toFixed(0) + '%', 'the maker\'s $' + Math.round(msrp / 1000) + 'k'],
        ['Dealer asking', usd0(buyValue * ASKING_MARKUP), 'what you will see listed']
    ].map(([label, val, sub]) =>
        '<div class="loss-tile"><div class="tile-label">' + label + '</div><div class="tile-val">' + val +
        '</div><div class="tile-sub">' + sub + '</div></div>').join('');

    /* How the same money would have fared in the other five. */
    const ranked = MODELS.map((m) => ({
        m,
        loss: modelValueAt(m, msrp, buyAge) - modelValueAt(m, msrp, sellAge)
    })).sort((a, b) => a.loss - b.loss);
    const bestAlt = ranked[0];
    const worst = ranked[ranked.length - 1];

    const bits = ['Buying a ' + $('modelYear').value + ' ' + model.name + ' at ' +
        (buyAge === 0 ? 'new' : buyAge.toFixed(1) + ' years old') + ' and keeping it ' + hold.toFixed(1) +
        ' years costs you <strong>' + usd0(loss) + '</strong> in value — ' + pctOfBuy.toFixed(0) +
        '% of the ' + usd0(buyValue) + ' you paid, or <strong>' + usd0(loss / (hold * 12)) +
        '/mo</strong> before a single tank of fuel.'];

    if (bestAlt.m.key !== model.key) {
        bits.push('The same window in a <strong>' + bestAlt.m.name + '</strong> would have lost ' +
            usd0(bestAlt.loss) + ' — ' + usd0(loss - bestAlt.loss) + ' less. The ' + worst.m.name +
            ' is the other end at ' + usd0(worst.loss) + '.');
    } else {
        bits.push('That is the best of these six over this window; the ' + worst.m.name + ' would shed ' +
            usd0(worst.loss) + ', a difference of ' + usd0(worst.loss - loss) + '.');
    }
    bits.push('Note the curve flattens — the annual rate eases off after year five, so the same car held ' +
        'from year 5 to year 10 loses far less than from year 0 to year 5. That is the whole argument for ' +
        'buying used.');
    bits.push('<strong>These are market values, not asking prices.</strong> A forecourt adds roughly 12% ' +
        'for reconditioning, warranty and overhead, so browsing listings will always look dearer than a ' +
        'valuation — a 2019 CR-V values around $20,400 here and KBB puts a dealer EX-L at $20,900, while ' +
        'the average 2019 CR-V <em>listed</em> runs $21,000–25,000.');

    $('depSummary').innerHTML = bits.join(' ');
}

function renderTrimChips() {
    const model = currentModel();
    if (selectedTrim > model.trims.length - 1) selectedTrim = model.trims.length - 1;
    let html = model.trims.map(([name, price], i) =>
        '<button class="preset-btn' + (i === selectedTrim ? ' active' : '') +
        '" type="button" data-trim="' + i + '">' + name + ' · ' +
        usd0(price + DESTINATION_2019) + '</button>').join('');
    if (model.hybrid) {
        html += '<button class="preset-btn' + (selectedHybrid ? ' active' : '') +
            '" type="button" data-hybrid="1">🔋 Hybrid</button>';
    } else {
        selectedHybrid = false;
    }
    $('trimChips').innerHTML = html;
}

function refreshModal() {
    renderTrimChips();
    const minBuy = earliestBuyAge();
    $('buyAge').min = minBuy;
    if (parseFloat($('buyAge').value) < minBuy) $('buyAge').value = minBuy;

    const year = Number($('modelYear').value);
    const miles = num('modelMiles') || 12000;
    $('depAvailability').innerHTML = minBuy > 0
        ? 'A ' + year + ' is <strong>' + minBuy + ' years old today</strong>, so that is the earliest ' +
          'you can buy one — the shaded part of the curve already happened to whoever owned it. ' +
          'At ' + miles.toLocaleString('en-US') + ' mi/yr it has about <strong>' +
          (minBuy * miles).toLocaleString('en-US') + ' miles</strong> on it.'
        : 'A ' + year + ' can still be bought new, so the whole curve is ahead of you.';

    renderDepChart();
    renderDepReadout();
}

function buildModal() {
    $('modelChips').innerHTML = MODELS.map((m) =>
        '<button type="button" class="model-chip' + (m.key === selectedModel ? ' active' : '') +
        '" data-model="' + m.key + '">' + m.name + '</button>').join('');
    for (const chip of $('modelChips').querySelectorAll('.model-chip')) {
        chip.addEventListener('click', () => {
            selectedModel = chip.dataset.model;
            for (const c of $('modelChips').querySelectorAll('.model-chip')) {
                c.classList.toggle('active', c.dataset.model === selectedModel);
            }
            $('modelMsrp').value = modelMsrp(currentModel(), Number($('modelYear').value));
            refreshModal();
        });
    }

    $('modelYear').innerHTML = MODEL_YEARS.map((y) =>
        '<option value="' + y + '"' + (y === 2019 ? ' selected' : '') + '>' + y + '</option>').join('');
    $('modelMsrp').value = modelMsrp(currentModel(), 2019);

    $('modelYear').addEventListener('change', () => {
        $('modelMsrp').value = modelMsrp(currentModel(), Number($('modelYear').value));
        refreshModal();
    });
    for (const id of ['modelMsrp', 'modelMiles', 'buyAge', 'holdYears']) {
        $(id).addEventListener('input', refreshModal);
    }

    $('trimChips').addEventListener('click', (e) => {
        const chip = e.target.closest('.preset-btn');
        if (!chip) return;
        if (chip.dataset.hybrid) selectedHybrid = !selectedHybrid;
        else selectedTrim = Number(chip.dataset.trim);
        $('modelMsrp').value = modelMsrp(currentModel(), Number($('modelYear').value));
        refreshModal();
    });

    $('applyModel').addEventListener('click', () => {
        const model = currentModel();
        const msrp = Math.max(0, num('modelMsrp'));
        const buyAge = parseFloat($('buyAge').value);
        const hold = parseFloat($('holdYears').value);
        $('price').value = Math.round(modelValueAt(model, msrp, buyAge));
        priceAnchor = 'price';
        $('horizon').value = Math.round(hold * 12);
        $('miles').value = Math.round(num('modelMiles') || 12000);
        /* Snap the generic curve to whichever preset holds value most
           like this model, so the break-even chart keeps the right
           shape either side of the horizon. */
        const target = modelRetained(model, 5);
        $('depreciation').value = Object.keys(DEPRECIATION_CURVES).reduce((best, key) =>
            Math.abs(retainedValue(5, key) - target) < Math.abs(retainedValue(5, best) - target)
                ? key : best, 'average');
        $('resale').value = Math.round(modelValueAt(model, msrp, buyAge + hold) *
            disposalFactor($('disposal').value, buyAge + hold,
                (num('modelMiles') || 12000) * (buyAge + hold)));
        $('resale').dataset.touched = '1';
        closeModal();
        update();
        $('price').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

let lastFocused = null;

function openModal() {
    lastFocused = document.activeElement;
    $('depModal').hidden = false;
    requestAnimationFrame(() => {
        $('depBackdrop').classList.add('open');
        $('depModal').classList.add('open');
    });
    refreshModal();
    $('depClose').focus();
}

function closeModal() {
    $('depBackdrop').classList.remove('open');
    $('depModal').classList.remove('open');
    setTimeout(() => { $('depModal').hidden = true; }, 250);
    if (lastFocused) lastFocused.focus();
}
