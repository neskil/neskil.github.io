/* ── Result panels ───────────────────────────────────────────────────
   Everything that turns the numbers into sentences: the verdict, the
   per-route notes, the mileage table and the reading guide. */
'use strict';

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
    const ranked = OPTIONS.slice().sort((a, b) => results[a.key].total - results[b.key].total);
    const win = ranked[0], second = ranked[1];
    const gap = results[second.key].total - results[win.key].total;

    $('verdictWinner').textContent = win.label;
    $('verdictCost').textContent = usd0(results[win.key].perMonth) + '/mo · ' +
        usd0(results[win.key].total) + ' over ' + v.months + ' mo';

    /* Cheapest is only useful if you can actually put the money down. */
    const upfront = {
        cash: v.price + v.price * v.taxRate + v.fees,
        loan: Math.min(v.down, v.price) + v.price * v.taxRate + v.fees,
        lease: v.leaseSigning,
        rent: v.rentStartFee
    };
    const short = upfront[win.key] - v.cash;
    /* Re-run the winner under the other two cases so the headline
       carries its own uncertainty rather than pretending to precision. */
    const spread = {};
    const held = scenarioCase;
    for (const key of Object.keys(SCENARIOS)) {
        scenarioCase = key;
        spread[key] = computeAll(readInputs())[win.key].perMonth;
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

    $('verdictSub').innerHTML =
        'Next best is <strong>' + second.label.toLowerCase() + '</strong>, ' +
        (gap < 1
            ? 'which lands within a rounding error — treat them as a tie and pick on flexibility.'
            : 'costing <strong>' + usd0(gap) + '</strong> more over ' + v.months + ' months (' +
              usd0(gap / v.months) + '/mo). Most expensive: <strong>' +
              ranked[ranked.length - 1].label.toLowerCase() + '</strong> at ' +
              usd0(results[ranked[ranked.length - 1].key].total) + '.');
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
    if (lease.cycles > 1) {
        leaseBits.push('A ' + v.leaseTerm + '-month lease does not cover ' + v.months +
            ' months, so this assumes <strong>' + lease.cycles +
            ' back-to-back leases</strong> on the same terms — signing costs repeat each time.');
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
    leaseBits.push('You own nothing at the end — every payment is rent on the depreciation.');
    $('leaseNote').innerHTML = leaseBits.join(' ');

    const rent = results.rent;
    const rentBits = [];
    const perMonth = Math.round(v.miles / 12);
    if (rent.overagePerMonth > 0) {
        rentBits.push('You drive ' + perMonth.toLocaleString('en-US') + ' mi/mo against ' +
            v.rentAllowance.toLocaleString('en-US') + ' included, so you buy <strong>' +
            rent.mileageBlocks + ' extra block' + (rent.mileageBlocks > 1 ? 's' : '') +
            '</strong> of 1,000 miles at ' + usd0(v.rentBlockPrice) + ' each — <strong>' +
            usd0(rent.overagePerMonth) + '/mo</strong> on top, ' +
            usd0(rent.overagePerMonth * v.months) + ' over the horizon. Blocks are sold whole, so the ' +
            'last one is only partly used.');
    } else {
        rentBits.push('Your ' + perMonth.toLocaleString('en-US') + ' mi/mo fits inside the ' +
            v.rentAllowance.toLocaleString('en-US') + ' included, with ' +
            (v.rentAllowance - perMonth).toLocaleString('en-US') + ' to spare — and unused miles roll ' +
            'over, so it is your average that has to fit, not every single month.');
    }
    rentBits.push('Effective all-in: <strong>' + usd0(rent.monthlyOutlay) + '/mo</strong>.');
    $('rentNote').innerHTML = rentBits.join(' ');

    for (const el of document.querySelectorAll('.summary-cost')) {
        el.textContent = usd0(results[el.dataset.cost].perMonth) + '/mo';
    }
}

/* Mileage is metered on two of the four routes and quietly repriced on
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
        ['Rent monthly', v.rentAllowance.toLocaleString('en-US') + ' mi/mo',
            results.rent.overagePerMonth > 0
                ? usd0(results.rent.overagePerMonth) + '/mo for ' + results.rent.mileageBlocks +
                  ' extra block' + (results.rent.mileageBlocks > 1 ? 's' : '')
                : 'Inside the allowance',
            results.rent.overagePerMonth > 0 ? 'gated' : 'open']
    ];

    const table = '<div class="table-wrap" style="margin-top:0"><table><thead><tr>' +
        ['Route', 'Included', 'What your ' + perMonth.toLocaleString('en-US') + ' mi/mo costs']
            .map((h) => '<th scope="col">' + h + '</th>').join('') +
        '</tr></thead><tbody>' + rows.map(([r, inc, cost, state]) =>
            '<tr><td>' + r + '</td><td>' + inc + '</td><td class="cost-cell ' + state + '">' +
            cost + '</td></tr>').join('') +
        '</tbody></table></div>';

    const metered = results.lease.overageTotal > 0 || results.rent.overagePerMonth > 0;
    const note = metered
        ? '<strong>Two of these meter you and two do not.</strong> At ' +
          v.miles.toLocaleString('en-US') + ' miles a year you are over on ' +
          [results.lease.overageTotal > 0 ? 'the lease' : null,
           results.rent.overagePerMonth > 0 ? 'the subscription' : null].filter(Boolean).join(' and ') +
          '. Owning has no cap — the mileage comes out of resale instead, which is the quieter but often ' +
          'smaller cost. <strong>High-mileage drivers should generally own.</strong>'
        : 'Your mileage fits every allowance here, which keeps all four routes genuinely comparable. ' +
          'Push past a cap and the metered options reprice fast — worth re-checking if your driving changes.';

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

    const rentPremium = results.rent.total - results[ranked[0].key].total;
    out.push(['🗓️',
        rentPremium > 0
            ? 'Renting monthly costs <strong>' + usd0(rentPremium) + '</strong> more than the cheapest option — ' +
              'about ' + usd0(rentPremium / v.months) + '/mo for the right to hand the keys back any month. ' +
              'Worth it if you might move, deploy, or change jobs; expensive if you will not.'
            : 'Renting monthly is the cheapest line here, which normally only happens over a short horizon or ' +
              'when insurance and maintenance are unusually costly for you.']);

    out.push(['⏳',
        'Stretch the horizon and buying wins harder — a paid-off car costs only insurance, maintenance and ' +
        'registration. Shorten it and leasing or renting takes over, because you never eat the first-year ' +
        'depreciation cliff.']);

    $('insights').innerHTML = out.map(([ico, text]) =>
        '<div class="callout"><span class="ico">' + ico + '</span><span>' + text + '</span></div>').join('');
}
