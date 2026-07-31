/* ── The cost model ──────────────────────────────────────────────────
   Reads the inputs once, then prices the same car four ways through a
   shared cash-flow ledger so the routes are comparable line by line. */
'use strict';

/* ── Cash flow ledger ────────────────────────────────────────────
   Each entry is an amount, the month it happens, and its component.
   Money spent in month k could otherwise have compounded until the
   end of the horizon, so the "lost return" on it is
   amount * ((1 + i)^(N - k) - 1). Tracking it this way keeps the
   opportunity cost of paying cash on the same footing as a lease
   payment made in month 40. */
function makeLedger(months, monthlyReturn) {
    const flows = [];
    return {
        add(amount, month, component) {
            if (!amount) return;
            flows.push({ amount, month: Math.min(Math.max(month, 0), months), component });
        },
        totals() {
            const out = { depreciation: 0, interest: 0, fees: 0, insurance: 0, maintenance: 0 };
            let nominal = 0, lostReturn = 0;
            for (const f of flows) {
                out[f.component] += f.amount;
                nominal += f.amount;
                const grown = f.amount * Math.pow(1 + monthlyReturn, months - f.month);
                lostReturn += grown - f.amount;
            }
            out.interest += lostReturn;
            return { components: out, nominal, lostReturn };
        }
    };
}

/* Depreciation is not a constant percentage forever — it eases off as
   a car ages, which is why a five-to-ten-year-old car loses far less
   than a new one. Beyond year five the annual rate drops to 70% of the
   early rate. Checked against the market: a 2019 CR-V EX-L comes out at
   $20,400 on this curve against KBB's $20,900, where a constant rate
   gave $19,800. */
const LATE_PHASE = 0.7;

function retainedCurve(years, firstYear, annual) {
    if (years <= 0) return 1;
    if (years <= 1) return 1 - firstYear * years;
    const early = (1 - firstYear) * Math.pow(1 - annual, Math.min(years, 5) - 1);
    if (years <= 5) return early;
    return early * Math.pow(1 - annual * LATE_PHASE, years - 5);
}

function retainedValue(years, curve) {
    const c = DEPRECIATION_CURVES[curve] || DEPRECIATION_CURVES.average;
    return retainedCurve(years, c.firstYear, c.annual);
}

function loanPayment(principal, monthlyRate, term) {
    if (principal <= 0 || term <= 0) return 0;
    if (monthlyRate === 0) return principal / term;
    return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -term));
}

function loanBalance(principal, monthlyRate, payment, k) {
    if (monthlyRate === 0) return Math.max(0, principal - payment * k);
    const grown = principal * Math.pow(1 + monthlyRate, k);
    const paid = payment * (Math.pow(1 + monthlyRate, k) - 1) / monthlyRate;
    return Math.max(0, grown - paid);
}

/* Reads every input once so the four scenarios share one snapshot. */
function readInputs() {
    const months = Math.max(1, Math.round(num('horizon')));
    const price = num('price');
    const curve = $('depreciation').value;
    const milesPerYear = num('miles');
    const excessMiles = (milesPerYear - 12000) * (months / 12);
    const mileageValue = mileagePenalty(excessMiles);
    const scen = SCENARIOS[scenarioCase];
    const channel = $('disposal').value;
    const band = AGE_BANDS[carAge];
    const ageAtSale = (band ? band.buyAge : 0) + months / 12;
    /* Miles on the clock when you sell: the previous owner's assumed
       average plus your own driving, which is what a dealer's appraisal
       actually keys off. */
    const milesAtSale = (band ? band.buyAge : 0) * 12000 + milesPerYear * (months / 12);
    const disposal = disposalFactor(channel, ageAtSale, milesAtSale);
    const autoResale = price * retainedValue(months / 12, curve) * mileageValue * scen.resale * disposal;
    const resaleField = $('resale');
    const resale = resaleField.dataset.touched === '1'
        ? Math.max(0, num('resale'))
        : autoResale;
    function resaleOf() { return resale; }

    return {
        months,
        price,
        curve,
        autoResale,
        resale,
        mileageValue,
        scenarioCase,
        channel,
        disposal,
        ageAtSale,
        milesAtSale,
        haircutVsPrivate: haircutVsPrivate(channel, ageAtSale, milesAtSale),
        /* Only worth anything if you are buying another car from the
           same dealer, which is the situation a trade-in implies. */
        tradeTaxCredit: DISPOSAL[channel].taxCredit ? resaleOf() * (num('taxRate') / 100) : 0,
        /* One big bill, sized against this car's own upkeep, only if
           the basic warranty has run out before you sell. */
        repairShock: scen.shock && outOfWarrantyDuring(months)
            ? num('maintenance') * scen.shock : 0,
        taxRate: num('taxRate') / 100,
        fees: num('fees'),
        miles: num('miles'),
        insurance: num('insurance'),
        maintenance: num('maintenance') * scen.maint,
        registration: num('registration'),
        cash: num('cash'),
        monthlyReturn: Math.pow(1 + num('returnRate') / 100, 1 / 12) - 1,
        returnRate: num('returnRate') / 100,
        down: num('down'),
        apr: num('apr') / 100,
        loanTerm: Math.max(1, Math.round(num('loanTerm'))),
        leasePayment: num('leasePayment'),
        leaseSigning: num('leaseSigning'),
        leaseTerm: Math.max(1, Math.round(num('leaseTerm'))),
        /* Quoted per month, contracted per year. */
        leaseAllowance: num('leaseAllowance') * 12,
        leaseOverage: num('leaseOverage'),
        leaseMileagePlan: $('leaseMileagePlan').value,
        leasePrepaidRate: num('leasePrepaidRate'),
        leaseDisposition: num('leaseDisposition'),
        rentRate: num('rentRate'),
        rentStartFee: num('rentStartFee'),
        rentAllowance: num('rentAllowance'),
        rentBlockPrice: num('rentBlockPrice')
    };
}

function syncPriceFields() {
    const taxRate = num('taxRate') / 100;
    const fees = num('fees');
    if (priceAnchor === 'otd') {
        const list = (num('otd') - fees) / (1 + taxRate);
        $('price').value = Math.max(0, Math.round(list));
    } else {
        $('otd').value = Math.round(num('price') * (1 + taxRate) + fees);
    }
}

/* True once the bumper-to-bumper cover lapses inside the hold. With no
   marque chosen we cannot know, so assume the cover is gone. */
function outOfWarrantyDuring(months) {
    const brand = BRANDS[carBrand], band = AGE_BANDS[carAge];
    if (!brand || !band) return true;
    return band.buyAge + months / 12 > brand.warrantyBasic;
}

/* Costs an owner carries whichever way the car was bought. */
function addOwnerRunningCosts(led, v, maintenanceShare) {
    for (let m = 1; m <= v.months; m++) {
        led.add(v.insurance, m, 'insurance');
        led.add(v.maintenance * maintenanceShare, m, 'maintenance');
    }
    const years = Math.ceil(v.months / 12);
    for (let y = 0; y < years; y++) {
        led.add(v.registration, Math.min(y * 12, v.months), 'fees');
    }
    /* A lease keeps you inside cover, so the failure is the bank's. */
    if (v.repairShock && maintenanceShare === 1) {
        led.add(v.repairShock, Math.round(v.months * 0.6), 'maintenance');
    }
}

function scenarioCash(v) {
    const led = makeLedger(v.months, v.monthlyReturn);
    led.add(v.price, 0, 'depreciation');
    led.add(v.price * v.taxRate + v.fees, 0, 'fees');
    addOwnerRunningCosts(led, v, 1);

    const t = led.totals();
    t.components.depreciation -= v.resale;
    t.components.fees -= v.tradeTaxCredit;
    return finish(t, v, { resale: v.resale, monthlyOutlay: v.insurance + v.maintenance });
}

function scenarioLoan(v) {
    const led = makeLedger(v.months, v.monthlyReturn);
    const down = Math.min(v.down, v.price);
    const principal = Math.max(0, v.price - down);
    const j = v.apr / 12;
    const payment = loanPayment(principal, j, v.loanTerm);
    const paidMonths = Math.min(v.months, v.loanTerm);

    led.add(down, 0, 'depreciation');
    led.add(v.price * v.taxRate + v.fees, 0, 'fees');

    /* Walk the amortisation so interest lands in its own component
       and the principal repaid shows up as money sunk into the car. */
    let balance = principal;
    let interestPaid = 0;
    for (let m = 1; m <= paidMonths; m++) {
        const interest = balance * j;
        const principalPart = Math.min(payment - interest, balance);
        balance -= principalPart;
        interestPaid += interest;
        led.add(interest, m, 'interest');
        led.add(principalPart, m, 'depreciation');
    }
    /* Sell before the loan is done and the payoff comes out of the sale. */
    if (balance > 0.5) led.add(balance, v.months, 'depreciation');

    addOwnerRunningCosts(led, v, 1);

    const t = led.totals();
    t.components.depreciation -= v.resale;
    t.components.fees -= v.tradeTaxCredit;
    return finish(t, v, {
        resale: v.resale,
        payment,
        interestPaid,
        balanceAtEnd: balance,
        monthlyOutlay: (v.months <= v.loanTerm ? payment : 0) + v.insurance + v.maintenance
    });
}

function scenarioLease(v) {
    const led = makeLedger(v.months, v.monthlyReturn);
    const cycles = Math.ceil(v.months / v.leaseTerm);
    let overageTotal = 0;
    let unfinishedMonths = 0;

    for (let c = 0; c < cycles; c++) {
        const start = c * v.leaseTerm;
        if (start >= v.months) break;
        const end = Math.min(start + v.leaseTerm, v.months);
        const monthsThisCycle = end - start;

        led.add(v.leaseSigning, start, 'depreciation');
        for (let m = start + 1; m <= end; m++) led.add(v.leasePayment, m, 'depreciation');

        /* Extra miles are cheaper bought at signing than settled at
           turn-in, but the money is gone whether you drive them or not,
           so a pre-buy is only worth it if you are sure. */
        const excessThisCycle = Math.max(0, v.miles - v.leaseAllowance) * (monthsThisCycle / 12);
        if (v.leaseMileagePlan === 'prepaid' && excessThisCycle > 0) {
            const prepaid = excessThisCycle * v.leasePrepaidRate;
            overageTotal += prepaid;
            led.add(prepaid, start, 'fees');
        }

        /* Turn-in charges only land if this cycle actually finishes
           inside the horizon. */
        if (end === start + v.leaseTerm) {
            led.add(v.leaseDisposition, end, 'fees');
            if (v.leaseMileagePlan !== 'prepaid') {
                const charge = excessThisCycle * v.leaseOverage;
                overageTotal += charge;
                led.add(charge, end, 'fees');
            }
        } else {
            /* The horizon ends mid-contract — the remaining payments
               are outside the comparison, not forgiven. */
            unfinishedMonths = start + v.leaseTerm - v.months;
        }
    }

    addOwnerRunningCosts(led, v, LEASE_MAINTENANCE_SHARE);

    const t = led.totals();
    return finish(t, v, {
        resale: 0,
        cycles,
        overageTotal,
        unfinishedMonths,
        monthlyOutlay: v.leasePayment + v.insurance + v.maintenance * LEASE_MAINTENANCE_SHARE
    });
}

function scenarioRent(v) {
    const led = makeLedger(v.months, v.monthlyReturn);
    led.add(v.rentStartFee, 0, 'fees');
    /* A subscription sells mileage in blocks rather than billing per
       mile after the fact, so you buy the whole block or go without.
       Unused miles roll over, which means your average matters and a
       single heavy month does not. */
    const excessPerMonth = Math.max(0, v.miles / 12 - v.rentAllowance);
    const blocks = Math.ceil(excessPerMonth / 1000);
    const overagePerMonth = blocks * v.rentBlockPrice;
    for (let m = 1; m <= v.months; m++) {
        led.add(v.rentRate, m, 'depreciation');
        led.add(overagePerMonth, m, 'fees');
    }

    const t = led.totals();
    return finish(t, v, {
        resale: 0,
        overagePerMonth,
        mileageBlocks: blocks,
        monthlyOutlay: v.rentRate + overagePerMonth
    });
}

/* Shared tail: total, per-month, and the raw cash figure without the
   opportunity-cost layer, so both readings are available. */
function finish(t, v, extra) {
    const total = Object.values(t.components).reduce((a, b) => a + b, 0);
    return Object.assign({
        components: t.components,
        total,
        perMonth: total / v.months,
        cashOut: t.nominal,
        lostReturn: t.lostReturn
    }, extra);
}

function computeAll(v) {
    return {
        cash: scenarioCash(v),
        loan: scenarioLoan(v),
        lease: scenarioLease(v),
        rent: scenarioRent(v)
    };
}

/* The APR at which financing stops beating cash. Both scenarios move
   with the APR only through the loan, so a bisection is exact enough
   and far more readable than solving it in closed form. */
function breakEvenApr(v) {
    const cashTotal = scenarioCash(v).total;
    const at = (apr) => scenarioLoan(Object.assign({}, v, { apr })).total - cashTotal;
    if (at(0) > 0) return 0;
    let lo = 0, hi = 0.30;
    if (at(hi) < 0) return null;
    for (let i = 0; i < 60; i++) {
        const mid = (lo + hi) / 2;
        if (at(mid) < 0) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
}

/* ── Break-even curve ────────────────────────────────────────────
   The whole comparison hinges on how long you keep the car, so this
   re-runs all four scenarios across a range of horizons. Resale has to
   move with the horizon or the curves would be meaningless; a manual
   resale override is carried through as a scaling factor on the curve
   so the chart still agrees with the bars at the selected month. */
function costCurve(v, maxMonths, step) {
    const resaleFactor = v.autoResale > 0 ? v.resale / v.autoResale : 1;
    const points = [];
    for (let m = 6; m <= maxMonths; m += step) {
        const variant = Object.assign({}, v, {
            months: m,
            resale: v.price * retainedValue(m / 12, v.curve) * resaleFactor
        });
        const r = computeAll(variant);
        points.push({
            month: m,
            cash: r.cash, loan: r.loan, lease: r.lease, rent: r.rent
        });
    }
    return points;
}

/* Where the cheapest option changes hands — the answer to "how long do
   I have to keep it for buying to win". */
function findLeadChanges(points, measure) {
    const changes = [];
    let prevLead = null;
    for (const p of points) {
        let lead = null, best = Infinity;
        for (const o of OPTIONS) {
            const val = p[o.key][measure];
            if (val < best) { best = val; lead = o.key; }
        }
        if (prevLead && lead !== prevLead) {
            changes.push({ month: p.month, from: prevLead, to: lead });
        }
        prevLead = lead;
    }
    return changes;
}
