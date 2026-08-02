/* ── Result panels ───────────────────────────────────────────────────
   Everything that turns the numbers into sentences: the verdict, the
   per-route notes, the mileage table and the reading guide. */
'use strict';

/* ── Which car is each route actually pricing? ───────────────────────
   This is the page's biggest unstated assumption, and it is worth being
   loud about. Cash and finance price the car described in the inputs —
   its marque, its shape, its age, its price. The lease and the
   subscription do not: they price whatever vehicle the quote you typed
   happens to be for. A $1,000 Sixt+ rate is a BMW X1; the $873 IAS quote
   is a new Tiguan; the car in the inputs might be a nine-year-old Civic.
   Comparing those six numbers is still useful — it is the real choice in
   front of you, six ways to have *a* car for a while — but it is not six
   prices for one car, and reading it as though it were is the easiest
   mistake this page invites. */
function activePreset(rowId) {
    const btn = document.querySelector('#' + rowId + ' .preset-btn.active');
    return btn ? { car: btn.dataset.car, msrp: Number(btn.dataset.msrp) || 0 } : null;
}

function routeVehicle(key, v) {
    if (key === 'cash' || key === 'loan') {
        const brand = BRANDS[carBrand], band = AGE_BANDS[carAge], shape = BODY_TYPES[carBody];
        const described = brand && band
            ? brand.label + (shape ? ' ' + shape.label.replace(/^\S+\s/, '').toLowerCase() : '') +
              ', ' + band.label.toLowerCase()
            : 'the car you described';
        return { text: described + ' · ' + usd0(v.price), matches: true };
    }
    const ROW = { lease: 'leasePresets', sixt: 'rentPresets', flexcar: 'flexPresets',
                  rental: 'rentalPresets' };
    const preset = ROW[key] ? activePreset(ROW[key]) : null;
    if (preset && preset.car) {
        return { text: preset.car + (preset.msrp ? ' · about ' + usdK(preset.msrp) + ' new' : ''),
                 matches: false, msrp: preset.msrp };
    }
    const rate = { lease: v.leasePayment,
                   sixt: (v.rentRate + v.sixtLdw + v.sixtDriver) * (1 + v.sixtTax / 100) +
                         v.sixtRoadside + v.sixtLicense,
                   flexcar: v.flexRate, rental: v.rentalMonthly }[key];
    return { text: 'whatever your ' + usd0(rate) + '/mo quote is for', matches: false, msrp: 0 };
}

/* ── Can you actually get this one? ──────────────────────────────────
   The cheapest route is useless advice if a lender, a platform or your
   bank balance says no, and for a newcomer that is most of them. The
   credit tier decides four of the six; cash decides itself on whether the
   money is there. Anything gated is drawn dimmed and taken out of the
   running for "cheapest", with the reason said out loud — the winner
   should be the cheapest thing you can actually have. */
const GATE_REASON = {
    loan: 'mainstream lenders decline a thin file',
    lease: 'captive leases need a credit history',
    flexcar: 'Flexcar wants a score around 650',
    sixt: 'available, but priced for saying yes without a file',
    rental: 'needs a credit card in your name'
};

function routeAvailability(key, v, results) {
    const state = CREDIT_TIERS[creditTier].avail[key] || 'open';
    if (key === 'cash') {
        const upfront = v.price + v.price * v.taxRate + v.fees;
        if (upfront > v.cash) {
            return { state: 'gated', reason: 'needs ' + usd0(upfront) + ' up front, ' +
                usd0(upfront - v.cash) + ' more than you have' };
        }
        return { state: 'open', reason: '' };
    }
    if (key === 'lease' && results && results.lease.unfinishedMonths > 0) {
        return { state, reason: state === 'gated' ? GATE_REASON.lease
            : 'your horizon ends mid-contract — leaving early is billed as the rest of the payments' };
    }
    return { state, reason: state === 'open' ? '' : (GATE_REASON[key] || '') };
}

/* The cheapest route you can actually take. */
function cheapestAvailable(results, v) {
    const usable = OPTIONS.filter((o) => routeAvailability(o.key, v, results).state !== 'gated');
    const pool = usable.length ? usable : OPTIONS;
    return pool.slice().sort((a, b) => activeTotal(results[a.key]) - activeTotal(results[b.key]))[0];
}

function renderTable(results, v) {
    const rows = COMPONENTS.map((c) =>
        '<tr><td>' + c.label + '</td>' +
        OPTIONS.map((o) => '<td>' + usd(results[o.key].components[c.key]) + '</td>').join('') +
        '</tr>').join('');

    $('tableWrap').innerHTML =
        '<table><caption class="sr-only">Total cost by component over ' + v.months + ' months</caption>' +
        '<thead><tr><th scope="col">Component</th>' +
        OPTIONS.map((o) => '<th scope="col">' + o.label + '</th>').join('') +
        '</tr></thead><tbody>' + rows +
        '<tr class="total-row"><td>Total over ' + v.months + ' mo</td>' +
        OPTIONS.map((o) => '<td>' + usd(results[o.key].total) + '</td>').join('') + '</tr>' +
        '<tr class="total-row"><td>Per month</td>' +
        OPTIONS.map((o) => '<td>' + usd(results[o.key].perMonth) + '</td>').join('') + '</tr>' +
        '<tr class="total-row"><td>Cash out of pocket</td>' +
        OPTIONS.map((o) => '<td>' + usd(results[o.key].cashOut - (results[o.key].resale || 0)) + '</td>').join('') +
        '</tr></tbody></table>';
}

function renderVerdict(results, best, v) {
    /* Ranked among the routes actually open to you. A cheapest that a
       lender has already declined is not an answer, so gated routes drop
       out of the ranking and get named separately if one of them would in
       fact have been cheaper. */
    const open = OPTIONS.filter((o) => routeAvailability(o.key, v, results).state !== 'gated');
    const pool = open.length > 1 ? open : OPTIONS;
    const ranked = pool.slice().sort((a, b) => activeTotal(results[a.key]) - activeTotal(results[b.key]));
    const win = ranked[0], second = ranked[1];
    const gap = activeTotal(results[second.key]) - activeTotal(results[win.key]);
    const overall = OPTIONS.slice().sort((a, b) =>
        activeTotal(results[a.key]) - activeTotal(results[b.key]))[0];

    $('verdictWinner').textContent = win.label;
    $('verdictCost').textContent = usd0(activePerMonth(results[win.key], v.months)) + '/mo · ' +
        usd0(activeTotal(results[win.key])) + ' over ' + v.months + ' mo' +
        (allComponentsOn() ? '' : ', counting only the lines you left on');

    /* Cheapest is only useful if you can actually put the money down. */
    const upfront = {
        cash: v.price + v.price * v.taxRate + v.fees,
        loan: Math.min(v.down, v.price) + v.price * v.taxRate + v.fees,
        lease: v.leaseSigning,
        sixt: v.rentStartFee,
        flexcar: v.flexStartFee,
        rental: v.rentalMonthly
    };
    const short = upfront[win.key] - v.cash;
    /* Re-run the winner under the other two cases so the headline
       carries its own uncertainty rather than pretending to precision. */
    const spread = {};
    const held = scenarioCase;
    for (const key of Object.keys(SCENARIOS)) {
        scenarioCase = key;
        spread[key] = activePerMonth(computeAll(readInputs())[win.key], v.months);
    }
    scenarioCase = held;
    $('verdictRange').innerHTML = 'If things go well <strong>' + usd0(spread.optimistic) +
        '/mo</strong>; if they go badly <strong>' + usd0(spread.pessimistic) + '/mo</strong>. ' +
        'That spread — ' + usd0(spread.pessimistic - spread.optimistic) +
        '/mo — is the risk you are taking on, and it is widest on the routes where you own the car.';

    $('verdictWarning').innerHTML = short > 0
        ? '⚠️ It also needs <strong>' + usd0(upfront[win.key]) + '</strong> up front, ' +
          usd0(short) + ' more cash than you have.'
        : '';

    /* If something cheaper exists but is shut to you, say so — it is the
       clearest possible statement of what your credit file is costing. */
    const blocked = overall.key !== win.key
        ? ' <strong>' + overall.label + '</strong> would be cheaper still at ' +
          usd0(activePerMonth(results[overall.key], v.months)) + '/mo, but ' +
          routeAvailability(overall.key, v, results).reason + ' — that gap, ' +
          usd0(activeTotal(results[win.key]) - activeTotal(results[overall.key])) +
          ' over the horizon, is what the ' +
          'closed door costs you.'
        : '';

    $('verdictSub').innerHTML = blocked +
        ' Next best of the ones open to you is <strong>' + second.label.toLowerCase() + '</strong>, ' +
        (gap < 1
            ? 'which lands within a rounding error — treat them as a tie and pick on flexibility.'
            : 'costing <strong>' + usd0(gap) + '</strong> more over ' + v.months + ' months (' +
              usd0(gap / v.months) + '/mo). Most expensive: <strong>' +
              ranked[ranked.length - 1].label.toLowerCase() + '</strong> at ' +
              usd0(activeTotal(results[ranked[ranked.length - 1].key])) + '.');
}

function renderCashNote(results, v) {
    const upfrontCash = v.price + v.price * v.taxRate + v.fees;
    const shortfall = upfrontCash - v.cash;
    const be = breakEvenApr(v);
    const parts = [];

    if (shortfall > 0) {
        parts.push('Buying outright needs <strong>' + usd0(upfrontCash) +
            '</strong> up front — <strong>' + usd0(shortfall) + '</strong> more than you have, so cash is ' +
            'shown for comparison only.');
    } else {
        parts.push('Buying outright takes <strong>' + usd0(upfrontCash) +
            '</strong> of your ' + usd0(v.cash) + ', leaving <strong>' + usd0(-shortfall) +
            '</strong> liquid.');
        parts.push('Over ' + v.months + ' months that money would have earned <strong>' +
            usd0(results.cash.lostReturn) + '</strong> at ' + (v.returnRate * 100).toFixed(1) +
            '% — that is the real price of paying cash, and it is in the bars below.');
    }

    if (be === null) {
        parts.push('No realistic APR makes financing beat cash here.');
    } else if (be <= 0.0001) {
        parts.push('Even a 0% loan does not beat cash at these numbers.');
    } else {
        const cmp = v.apr < be ? 'below' : 'above';
        parts.push('<strong>Financing wins below an APR of ' + (be * 100).toFixed(2) + '%.</strong> ' +
            'Your ' + (v.apr * 100).toFixed(2) + '% is ' + cmp + ' that, so ' +
            (v.apr < be ? 'borrowing and keeping the cash invested is the cheaper play'
                        : 'the loan costs more than your cash earns') + '.');
    }

    $('cashNote').innerHTML = parts.join(' ');
}

/* What the lender decides before any of the maths applies. */
function renderCredit() {
    const tier = CREDIT_TIERS[creditTier];
    for (const btn of $('creditTiers').querySelectorAll('.preset-btn')) {
        btn.classList.toggle('active', btn.dataset.tier === creditTier);
    }
    /* Scoped to the option badges — anything else wearing this class
       is not the credit tier's business. */
    for (const badge of document.querySelectorAll('.avail-badge[data-avail]')) {
        const state = tier.avail[badge.dataset.avail];
        badge.className = 'avail-badge ' + state;
        badge.textContent = AVAIL_TEXT[state];
    }
    const rate = buyingUsed ? tier.aprUsed : tier.aprNew;
    const estimated = tier.estimated || (buyingUsed && tier.aprUsedEstimated);
    $('creditNote').innerHTML = '<strong>' + tier.label + '</strong> — average APR ' + rate.toFixed(2) +
        '% on a ' + (buyingUsed ? 'used' : 'new') + ' car' +
        (estimated ? ' (estimated for this band)' : ' (Experian, Q1 2026)') + '. ' + tier.note;
}

function applyCreditTier() {
    const tier = CREDIT_TIERS[creditTier];
    $('apr').value = (buyingUsed ? tier.aprUsed : tier.aprNew).toFixed(2);
}

function renderOptionNotes(results, v) {
    const loan = results.loan;
    const loanBits = ['Payment: <strong>' + usd0(loan.payment) + '/mo</strong>.'];
    if (v.months < v.loanTerm) {
        loanBits.push('You sell in month ' + v.months + ' with <strong>' + usd0(loan.balanceAtEnd) +
            '</strong> still owed, settled out of the sale.');
        if (loan.balanceAtEnd > v.resale) {
            loanBits.push('<span style="color:var(--warning)">That is more than the car will be worth — ' +
                'you would be underwater by ' + usd0(loan.balanceAtEnd - v.resale) + '.</span>');
        }
    } else if (v.months === v.loanTerm) {
        loanBits.push('Paid off exactly at the end of the horizon.');
    } else {
        loanBits.push('Paid off in month ' + v.loanTerm + ', then <strong>' + (v.months - v.loanTerm) +
            ' payment-free months</strong> of ownership.');
    }
    loanBits.push('Interest over the horizon: <strong>' + usd0(loan.interestPaid) + '</strong>.');
    $('loanNote').innerHTML = loanBits.join(' ');

    const lease = results.lease;
    const leaseBits = [];

    /* The number a dealer quotes you is the contract alone spread over the
       term — signing costs plus payments, divided by months, before
       insurance and before anything you spend running the car. It is not
       what the bar shows, and it is the only figure that lets you check
       this page against a quote in your hand, so state it first and say
       exactly what is in it. Two quotes shaped differently — $365/mo on
       $5,500 up front against $873/mo on nothing — are comparable here
       and nowhere else. */
    const contractOnly = (v.leaseSigning * lease.cycles + v.leasePayment * v.months) / v.months;
    leaseBits.push('<strong>The contract alone works out at ' + usd0(contractOnly) + '/mo</strong> — ' +
        usd0(v.leaseSigning) + ' up front' + (lease.cycles > 1 ? ' each cycle' : '') + ' plus ' +
        usd0(v.leasePayment) + ' a month over ' + v.months + ' months. That is the number to compare ' +
        'against a quote; the bar above adds insurance, servicing, fuel and the return your ' +
        'drive-off money stops earning.');

    if (v.months > v.leaseTerm && lease.extending) {
        /* The whole reason a short IAS term is not the disaster it looks
           like: the expensive part happens once. */
        const resigned = scenarioLease(Object.assign({}, v, { leaseRenewal: 'resign' }));
        leaseBits.push('Your ' + v.months + ' months outlast the ' + v.leaseTerm +
            '-month term, and this assumes you <strong>carry on at the same payment</strong> rather ' +
            'than signing again — so the ' + usd0(v.leaseSigning) + ' drive-off is paid once, not ' +
            Math.ceil(v.months / v.leaseTerm) + ' times. That is worth <strong>' +
            usd0(resigned.total - lease.total) + '</strong> over the horizon, and it is the single ' +
            'thing to confirm in writing before signing a short term.');
    } else if (lease.cycles > 1) {
        leaseBits.push('A ' + v.leaseTerm + '-month lease does not cover ' + v.months +
            ' months, so this assumes <strong>' + lease.cycles +
            ' back-to-back leases</strong> on the same terms — signing costs repeat each time. If the ' +
            'lender will instead let you continue at the same payment, switch "past the term" above; ' +
            'it is worth thousands.');
    }
    if (lease.overageTotal > 0) {
        const excessPerYear = v.miles - v.leaseAllowance;
        const prepaying = v.leaseMileagePlan === 'prepaid';
        /* Price both plans through the real ledger rather than a
           shortcut sum — cycles that do not finish inside the horizon
           are never billed at turn-in, which the shortcut misses. */
        const asTurnIn = scenarioLease(Object.assign({}, v, { leaseMileagePlan: 'turnin' }));
        const asPrepaid = scenarioLease(Object.assign({}, v, { leaseMileagePlan: 'prepaid' }));
        const atTurnIn = asTurnIn.overageTotal;
        const atSigning = asPrepaid.overageTotal;
        const costGap = asPrepaid.total - asTurnIn.total;
        leaseBits.push('You drive ' + Math.round(v.miles / 12).toLocaleString('en-US') +
            ' mi/mo against ' + Math.round(v.leaseAllowance / 12).toLocaleString('en-US') +
            ' included — <strong>' + Math.round(excessPerYear / 12).toLocaleString('en-US') +
            ' mi/mo over</strong>. ' +
            (prepaying
                ? 'Bought at signing that is <strong>' + usd0(atSigning) + '</strong>, paid up front and ' +
                  'non-refundable if you end up driving less.'
                : 'Settled at turn-in that is <strong>' + usd0(atTurnIn) + '</strong>, billed when you ' +
                  'hand the car back.') +
            ' Over your ' + v.months + ' months the two plans differ by <strong>' +
            usd0(Math.abs(costGap)) + '</strong> all in' +
            (Math.abs(costGap) < 1
                ? ' — effectively nothing, because the cheaper rate is offset by paying it years earlier.'
                : (costGap < 0 ? ', in favour of pre-buying.' : ', in favour of settling at turn-in.') +
                  ' A pre-buy only wins if you are sure of the mileage: the money is gone either way.'));
    } else if (v.miles > v.leaseAllowance) {
        leaseBits.push('You are ' + (v.miles - v.leaseAllowance).toLocaleString('en-US') +
            ' mi/yr over the allowance, but no contract reaches turn-in inside this horizon, so the ' +
            'overage bill falls outside it.');
    } else {
        leaseBits.push('Your mileage fits the allowance with ' +
            Math.max(0, v.leaseAllowance - v.miles).toLocaleString('en-US') + ' mi/yr to spare.');
    }
    if (lease.unfinishedMonths > 0) {
        leaseBits.push('<span style="color:var(--warning)">Your horizon ends ' + lease.unfinishedMonths +
            ' months into a contract that is still running — walking away early is billed as the remaining ' +
            'payments, which is not counted here.</span>');
    }
    /* The trade the whole route rests on, and the reason the pessimistic
       case is not free here either. */
    if (lease.wearTotal > 0) {
        leaseBits.push('Handing it back carries <strong>' + usd0(lease.wearTotal) + '</strong> of excess ' +
            'wear on this case — kerbed wheels, a deep scratch, tyres under the tread limit. Lessors ' +
            'expect a used car and are not looking for perfection, but a scratch runs $200–400 and a ' +
            'set of tyres can be billed at $200 apiece, so a bill in four figures is not unusual on a ' +
            'car that looked fine to its driver.');
    }
    leaseBits.push('<strong>You own nothing at the end</strong> — every payment is rent on the ' +
        'depreciation, and there is no resale cheque to come. That is the trade: no exposure to what ' +
        'the used market does, and no share of it either. What you carry instead is the damage, and ' +
        'what you avoid is the recurring maintenance, because the car never leaves warranty.');
    $('leaseNote').innerHTML = leaseBits.join(' ');

    /* Both subscriptions read the same way, so one writer serves both. */
    const subNote = (res, allowance, blockPrice, host) => {
        const bits = [];
        const perMonth = Math.round(v.miles / 12);
        if (res.overagePerMonth > 0) {
            bits.push('You drive ' + perMonth.toLocaleString('en-US') + ' mi/mo against ' +
                allowance.toLocaleString('en-US') + ' included, so you buy <strong>' +
                res.mileageBlocks + ' extra block' + (res.mileageBlocks > 1 ? 's' : '') +
                '</strong> of 1,000 miles at ' + usd0(blockPrice) + ' each — <strong>' +
                usd0(res.overagePerMonth) + '/mo</strong> on top, ' +
                usd0(res.overagePerMonth * v.months) + ' over the horizon. Blocks are sold whole, so the ' +
                'last one is only partly used.');
        } else {
            bits.push('Your ' + perMonth.toLocaleString('en-US') + ' mi/mo fits inside the ' +
                allowance.toLocaleString('en-US') + ' included, with ' +
                (allowance - perMonth).toLocaleString('en-US') + ' to spare — and unused miles roll ' +
                'over, so it is your average that has to fit, not every single month.');
        }
        bits.unshift('The contract runs to <strong>' + usd0(res.allIn) + '/mo</strong>' +
            (res.insuranceLine
                ? ', of which ' + usd0(res.insuranceLine) + ' is cover you would otherwise be buying ' +
                  'yourself — against ' + usd0(v.insurance) + '/mo on the owning routes'
                : '') + '.' +
            (res.annualFee
                ? ' The <strong>' + usd0(res.annualFee) + '/yr membership is required</strong> and is not in ' +
                  'that figure — it is billed separately two weeks after pickup, so the real monthly is ' +
                  '<strong>' + usd0(res.allIn + res.annualFee / 12) + '</strong>, and it recurs every year ' +
                  'you stay.'
                : ''));
        bits.push('With fuel and any mileage blocks on top: <strong>' + usd0(res.monthlyOutlay) +
            '/mo</strong>.' + (res.excessRisk
                ? ' This case also books the <strong>' + usd0(res.excessRisk) + '</strong> damage excess once.'
                : ''));
        $(host).innerHTML = bits.join(' ');
    };
    subNote(results.sixt, v.rentAllowance, v.rentBlockPrice, 'rentNote');
    subNote(results.flexcar, v.flexAllowance, v.flexBlockPrice, 'flexNote');

    /* Sixt's waiver came to within two dollars of retail cover, which made
       "it is all-in" a fair claim. Flexcar's does not, and the gap is the
       whole point: the plan is mandatory *and* dearer than the policy it
       replaces, because your own insurer is not allowed to cover the car.
       Price it against a real quote rather than against the page default. */
    if (v.ownInsuranceQuote > 0) {
        const markup = v.flexProtection - v.ownInsuranceQuote;
        $('flexInsuranceNote').innerHTML = markup > 0
            ? 'Flexcar charges <strong>' + usd0(v.flexProtection) + '/mo</strong> for cover you have been ' +
              'quoted <strong>' + usd0(v.ownInsuranceQuote) + '</strong> for elsewhere — a markup of ' +
              '<strong>' + usd0(markup) + '/mo</strong>, ' +
              Math.round(markup / v.ownInsuranceQuote * 100) + '% over the retail price, or ' +
              usd0(markup * v.months) + ' across your ' + v.months + ' months. You cannot decline it: ' +
              'Flexcar states that personal and credit-card policies do not extend to their cars. That is ' +
              'the honest cost of the route, and it is the clearest difference from Sixt+, whose waiver and ' +
              'driver together come to about what retail cover costs.'
            : 'At <strong>' + usd0(v.flexProtection) + '/mo</strong> the mandatory plan is at or below the ' +
              usd0(v.ownInsuranceQuote) + ' you have been quoted elsewhere, so the bundling is genuinely ' +
              'working in your favour here.';
    }

    /* The anchor. Saying the multiple out loud is the whole value of the
       line — a number this big is easier to disbelieve than to reason
       about, so put it next to the one it is a multiple of. */
    const rental = results.rental;
    const cheapestSub = Math.min(results.sixt.perMonth, results.flexcar.perMonth);
    $('rentalNote').innerHTML =
        'At ' + usd0(v.rentalMonthly) + '/mo that is <strong>' +
        usd0(v.rentalMonthly / DAYS_PER_MONTH) + ' a day</strong>, against ' + usd0(v.rentalDaily) +
        ' a day on a short booking — long hires trip into a different price list at about 28 days, ' +
        'and the gap is roughly threefold. Over your ' + v.months + ' months it comes to ' +
        usd0(rental.total) + ', ' + (rental.perMonth / cheapestSub).toFixed(1) +
        '× the cheaper subscription. It is the right answer for a few weeks and a poor one for a few ' +
        'years, which is exactly what makes it the yardstick.'

    for (const el of document.querySelectorAll('.summary-cost')) {
        el.textContent = usd0(results[el.dataset.cost].perMonth) + '/mo';
    }
}

/* Mileage is metered on three of the six routes and quietly repriced on
   the other two, so it deserves its own comparison. */
function renderMileagePanel(results, v) {
    const perMonth = Math.round(v.miles / 12);
    const leasePerMonth = Math.round(v.leaseAllowance / 12);
    const rows = [
        ['Pay cash', 'Unlimited', 'Miles cost you resale value and wear, not a fee — ' +
            usd0(v.price * (1 - v.mileageValue)) + ' of value at your mileage',
            v.mileageValue < 1 ? 'costly' : 'open'],
        ['Finance it', 'Unlimited', 'Same as cash, except a high-mileage car is also worth less than ' +
            'the loan for longer', v.mileageValue < 1 ? 'costly' : 'open'],
        ['Lease it', leasePerMonth.toLocaleString('en-US') + ' mi/mo',
            results.lease.overageTotal > 0
                ? usd0(results.lease.overageTotal) + (v.leaseMileagePlan === 'prepaid'
                    ? ' bought up front at $' + v.leasePrepaidRate.toFixed(2) + '/mi'
                    : ' billed at turn-in at $' + v.leaseOverage.toFixed(2) + '/mi')
                : 'Inside the allowance',
            results.lease.overageTotal > 0 ? 'gated' : 'open'],
        ['Sixt+', v.rentAllowance.toLocaleString('en-US') + ' mi/mo',
            results.sixt.overagePerMonth > 0
                ? usd0(results.sixt.overagePerMonth) + '/mo for ' + results.sixt.mileageBlocks +
                  ' extra block' + (results.sixt.mileageBlocks > 1 ? 's' : '')
                : 'Inside the allowance',
            results.sixt.overagePerMonth > 0 ? 'gated' : 'open'],
        ['Flexcar', v.flexAllowance.toLocaleString('en-US') + ' mi/mo',
            results.flexcar.overagePerMonth > 0
                ? usd0(results.flexcar.overagePerMonth) + '/mo for ' + results.flexcar.mileageBlocks +
                  ' extra block' + (results.flexcar.mileageBlocks > 1 ? 's' : '')
                : 'Inside the allowance',
            results.flexcar.overagePerMonth > 0 ? 'gated' : 'open'],
        ['Daily rental', 'Usually unlimited', 'No cap worth planning around — the rate is the problem, ' +
            'not the mileage', 'open']
    ];

    const table = '<div class="table-wrap" style="margin-top:0"><table><thead><tr>' +
        ['Route', 'Included', 'What your ' + perMonth.toLocaleString('en-US') + ' mi/mo costs']
            .map((h) => '<th scope="col">' + h + '</th>').join('') +
        '</tr></thead><tbody>' + rows.map(([r, inc, cost, state]) =>
            '<tr><td>' + r + '</td><td>' + inc + '</td><td class="cost-cell ' + state + '">' +
            cost + '</td></tr>').join('') +
        '</tbody></table></div>';

    const over = [results.lease.overageTotal > 0 ? 'the lease' : null,
                  results.sixt.overagePerMonth > 0 ? 'Sixt+' : null,
                  results.flexcar.overagePerMonth > 0 ? 'Flexcar' : null].filter(Boolean);
    const note = over.length
        ? '<strong>Some of these meter you and some do not.</strong> At ' +
          v.miles.toLocaleString('en-US') + ' miles a year you are over on ' +
          (over.length > 1 ? over.slice(0, -1).join(', ') + ' and ' + over[over.length - 1] : over[0]) +
          '. Owning has no cap — the mileage comes out of resale instead, which is the quieter but often ' +
          'smaller cost. <strong>High-mileage drivers should generally own.</strong>'
        : 'Your mileage fits every allowance here, which keeps the metered routes genuinely comparable ' +
          'with the ones that are not. Push past a cap and they reprice fast — worth re-checking if ' +
          'your driving changes.';

    $('mileagePanel').innerHTML = table + '<div class="callout" style="margin-top:10px">' +
        '<span class="ico">🛣️</span><span>' + note + '</span></div>';
}

function renderInsights(results, v) {
    const out = [];
    const ranked = OPTIONS.slice().sort((a, b) => results[a.key].total - results[b.key].total);
    const buyBest = results.cash.total <= results.loan.total ? 'cash' : 'loan';
    const ownVsLease = results.lease.total - results[buyBest].total;

    out.push(['🔁',
        ownVsLease > 0
            ? 'Owning beats leasing by <strong>' + usd0(ownVsLease) + '</strong> here, and the gap grows every ' +
              'month you keep the car past the payoff. Leasing catches up only if you replace the car on a ' +
              'fixed cycle anyway.'
            : 'Leasing is ahead by <strong>' + usd0(-ownVsLease) + '</strong> over this horizon — usually a sign ' +
              'the horizon is short, the lease is subsidised, or the car depreciates hard early.']);

    out.push(['📉',
        'Depreciation is the big line item on any purchase: <strong>' +
        usd0(v.price - v.resale) + '</strong> of the ' + usd0(v.price) +
        ' price evaporates over ' + v.months + ' months, whether you paid cash or financed. ' +
        'The financing choice only moves the smaller interest line.']);

    const subKey = results.sixt.total <= results.flexcar.total ? 'sixt' : 'flexcar';
    const rentPremium = results[subKey].total - results[ranked[0].key].total;
    out.push(['🗓️',
        rentPremium > 0
            ? 'The cheaper subscription costs <strong>' + usd0(rentPremium) + '</strong> more than the cheapest option — ' +
              'about ' + usd0(rentPremium / v.months) + '/mo for the right to hand the keys back any month. ' +
              'Worth it if you might move, deploy, or change jobs; expensive if you will not.'
            : 'A subscription is the cheapest line here, which normally only happens over a short horizon or ' +
              'when insurance and maintenance are unusually costly for you.']);

    out.push(['⏳',
        'Stretch the horizon and buying wins harder — a paid-off car costs only insurance, maintenance and ' +
        'registration. Shorten it and leasing or renting takes over, because you never eat the first-year ' +
        'depreciation cliff.']);

    $('insights').innerHTML = out.map(([ico, text]) =>
        '<div class="callout"><span class="ico">' + ico + '</span><span>' + text + '</span></div>').join('');
}

/* ── How to decide ───────────────────────────────────────────────────
   The calculator answers "what does each cost". This answers the question
   people actually arrive with — "which one is even mine to pick" — and it
   is mostly not about money. Four gates come before the arithmetic, in
   this order, because each one can eliminate routes the next would have
   ranked: a licence, a horizon, a credit file, a bank balance. The
   walkthrough asks the same four.

   It is drawn live rather than as a static diagram, so the branch your
   own answers take is lit and the rest stay visible as the roads not
   taken. */
function renderDecisionFlow(results, v) {
    const upfront = v.price + v.price * v.taxRate + v.fees;
    const tier = CREDIT_TIERS[creditTier];
    const gated = (k) => routeAvailability(k, v, results).state === 'gated';

    const STEPS = [
        {
            q: 'Do you have a US licence?',
            why: 'Nothing else matters until this is settled — you cannot title, insure or lease a car ' +
                 'without one, and Georgia gives you 30 days from becoming a resident.',
            branches: [
                { label: 'Not yet',
                  then: 'A subscription is the only real route, and it doubles as the car for the road ' +
                        'test — you are the named driver and the insurance comes with it.',
                  on: guideAnswers.licence === 'no' },
                { label: 'Yes',
                  then: 'Everything on this page is open to you, subject to the gates below.',
                  on: guideAnswers.licence !== 'no' }
            ]
        },
        {
            q: 'How long will you keep it?',
            why: 'The single biggest lever. Every route that hands the car back charges you for the ' +
                 'privilege every month; every route that keeps it charges the round trip once.',
            branches: [
                { label: 'Under a year',
                  then: 'Owning cannot amortise the buy-sell spread in that time. Subscribe.',
                  on: v.months < 12 },
                { label: '1–3 years',
                  then: 'The genuinely close range — a lease or a subscription against buying, and the ' +
                        'break-even chart is the argument.',
                  on: v.months >= 12 && v.months < 36 },
                { label: 'Three years or more',
                  then: 'Owning pulls ahead and keeps pulling: a paid-off car costs only insurance, ' +
                        'upkeep and fuel.',
                  on: v.months >= 36 }
            ]
        },
        {
            q: 'What does your credit file say?',
            why: 'A lender decides before any of the maths applies, and an empty US file is treated ' +
                 'like a bad one.',
            branches: [
                { label: 'Nothing yet, or under 600',
                  then: 'Loans and captive leases are shut, and so is Flexcar. Cash if you have it, ' +
                        'Sixt+ or an expat programme such as IAS if you do not.',
                  on: creditTier === 'none' || creditTier === 'subprime' },
                { label: '600–660',
                  then: 'Approved, but above the advertised rate. Both subscriptions open up.',
                  on: creditTier === 'nearprime' },
                { label: '661 and up',
                  then: 'Every route is open, including promotional financing — which is where ' +
                        'borrowing can genuinely beat paying cash.',
                  on: creditTier === 'prime' || creditTier === 'superprime' }
            ]
        },
        {
            q: 'Can you put the money down?',
            why: 'The cheapest route per month is not an option if the up-front number is not there, ' +
                 'and emptying the buffer to buy a car is how a car becomes an emergency.',
            branches: [
                { label: 'Not ' + usd0(upfront),
                  then: 'Buying outright is out. Finance if your file allows it, subscribe if it does ' +
                        'not — a subscription asks for almost nothing up front.',
                  on: upfront > v.cash },
                { label: usd0(upfront) + ' and still liquid',
                  then: 'Cash is on the table. Whether it should be depends on the break-even APR ' +
                        'above, not on instinct.',
                  on: upfront <= v.cash }
            ]
        },
        {
            q: 'How far do you drive?',
            why: 'Three of the six meter you. Owning has no cap — the miles come out of resale instead, ' +
                 'which is usually the smaller cost.',
            branches: [
                { label: 'Over a cap',
                  then: 'Metered routes reprice fast. High-mileage drivers should generally own.',
                  on: results.lease.overageTotal > 0 || results.sixt.overagePerMonth > 0 ||
                      results.flexcar.overagePerMonth > 0 },
                { label: 'Inside every allowance',
                  then: 'All six stay comparable, so the decision is genuinely about money and exit.',
                  on: !(results.lease.overageTotal > 0 || results.sixt.overagePerMonth > 0 ||
                        results.flexcar.overagePerMonth > 0) }
            ]
        }
    ];

    const html = STEPS.map((step, i) => {
        const branches = step.branches.map((br) =>
            '<div class="flow-branch' + (br.on ? ' on' : '') + '">' +
            '<div class="flow-label">' + br.label + '</div>' +
            '<div class="flow-then">' + br.then + '</div></div>').join('');
        return '<div class="flow-step">' +
            '<div class="flow-q"><span class="flow-n">' + (i + 1) + '</span>' + step.q + '</div>' +
            '<p class="flow-why">' + step.why + '</p>' +
            '<div class="flow-branches">' + branches + '</div></div>';
    }).join('');

    const shut = OPTIONS.filter((o) => gated(o.key));
    const outcome = '<div class="flow-out">' +
        '<div class="flow-q">Where that leaves you</div>' +
        '<p class="flow-then"><strong>' + $('verdictWinner').textContent + '</strong> at ' +
        usd0(results[cheapestAvailable(results, v).key].perMonth) + '/mo is the cheapest route open ' +
        'to you on these answers' +
        (shut.length
            ? ', with ' + shut.map((o) => o.label.toLowerCase()).join(', ') + ' shut off. ' +
              'Change the credit chips or the cash figure and watch which doors open.'
            : ', and nothing is shut off — every route is genuinely yours to pick, so this is a ' +
              'question about money and flexibility rather than eligibility.') +
        '</p></div>';

    $('decisionFlow').innerHTML = html + outcome;
}

function renderAccountabilityPanel(v, results) {
    const el = $('accountabilityBody');
    if (!el || !results || !results.accountability) return;
    const acc = results.accountability;
    const pt = POWERTRAIN_TYPES[v.powertrain] || POWERTRAIN_TYPES.petrol;

    let html = '';
    html += '<div class="accountability-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-top:6px;">';

    // 1. Powertrain & Fuel Accountability
    html += '<div class="acc-card" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:10px;">';
    html += '<div style="font-weight:600;margin-bottom:4px;color:var(--text-main);">' + pt.label + ' Energy & Fuel</div>';
    html += '<div style="font-size:0.85em;color:var(--text-mute);">' + pt.note + '</div>';
    html += '<div style="font-size:0.85em;margin-top:6px;"><strong>Monthly Cost:</strong> ' + usd0(acc.fuel.monthly) + '/mo</div>';
    html += '<div style="font-size:0.8em;font-family:monospace;background:rgba(0,0,0,0.2);padding:4px 6px;border-radius:4px;margin-top:4px;">' + acc.fuel.formula + '</div>';
    html += '</div>';

    // 2. Maintenance Accountability
    html += '<div class="acc-card" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:10px;">';
    html += '<div style="font-weight:600;margin-bottom:4px;color:var(--text-main);">🔧 Upkeep & Repairs</div>';
    html += '<div style="font-size:0.85em;color:var(--text-mute);">Powertrain factor: ' + Math.round(pt.maintMult * 100) + '% of petrol upkeep.</div>';
    html += '<div style="font-size:0.85em;margin-top:6px;"><strong>Monthly Cost:</strong> ' + usd0(acc.maintenance.monthly) + '/mo</div>';
    html += '<div style="font-size:0.8em;font-family:monospace;background:rgba(0,0,0,0.2);padding:4px 6px;border-radius:4px;margin-top:4px;">' + acc.maintenance.formula + '</div>';
    html += '</div>';

    // 3. Insurance Accountability
    html += '<div class="acc-card" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:10px;">';
    html += '<div style="font-weight:600;margin-bottom:4px;color:var(--text-main);">🛡️ Insurance Premium</div>';
    html += '<div style="font-size:0.85em;color:var(--text-mute);">Powertrain factor: ' + ((pt.insMult - 1) >= 0 ? '+' : '') + Math.round((pt.insMult - 1) * 100) + '% premium multiplier.</div>';
    html += '<div style="font-size:0.85em;margin-top:6px;"><strong>Monthly Cost:</strong> ' + usd0(acc.insurance.monthly) + '/mo</div>';
    html += '<div style="font-size:0.8em;font-family:monospace;background:rgba(0,0,0,0.2);padding:4px 6px;border-radius:4px;margin-top:4px;">' + acc.insurance.formula + '</div>';
    html += '</div>';

    // 4. Registration & Taxes Accountability
    html += '<div class="acc-card" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:10px;">';
    html += '<div style="font-weight:600;margin-bottom:4px;color:var(--text-main);">🏷️ State Tag & Fees</div>';
    html += '<div style="font-size:0.85em;color:var(--text-mute);">' + (pt.evRegistrationSurcharge > 0 ? 'Includes $238 GA annual EV tag surcharge to offset zero gas tax.' : 'Standard GA tag & emissions renewal.') + '</div>';
    html += '<div style="font-size:0.85em;margin-top:6px;"><strong>Annual Fee:</strong> ' + usd0(acc.registration.annual) + '/yr (' + usd0(acc.registration.monthly) + '/mo)</div>';
    html += '<div style="font-size:0.8em;font-family:monospace;background:rgba(0,0,0,0.2);padding:4px 6px;border-radius:4px;margin-top:4px;">' + acc.registration.formula + '</div>';
    html += '</div>';

    html += '</div>';

    el.innerHTML = html;
}

