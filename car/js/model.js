/* ── The cost model ──────────────────────────────────────────────────
   Reads the inputs once, then prices the same choice six ways through a
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
        /* `label` is what this money actually is — "sales tax", "doc, title
           and plates", "one major repair". The component is the colour on
           the chart; the label is the answer to "what is in that block?",
           which the chart could not previously give. */
        add(amount, month, component, label) {
            if (!amount) return;
            flows.push({ amount, month: Math.min(Math.max(month, 0), months), component, label });
        },
        totals() {
            const out = { depreciation: 0, interest: 0, fees: 0, insurance: 0,
                          maintenance: 0, fuel: 0 };
            /* Same money, grouped by what it is rather than what colour it
               is, so a tooltip can itemise a block instead of naming it. */
            const detail = {};
            let nominal = 0, lostReturn = 0;
            for (const f of flows) {
                out[f.component] += f.amount;
                nominal += f.amount;
                if (f.label) {
                    detail[f.component] = detail[f.component] || {};
                    detail[f.component][f.label] = (detail[f.component][f.label] || 0) + f.amount;
                }
                const grown = f.amount * Math.pow(1 + monthlyReturn, months - f.month);
                lostReturn += grown - f.amount;
            }
            out.interest += lostReturn;
            if (lostReturn) {
                detail.interest = detail.interest || {};
                detail.interest['return your money stops earning'] = lostReturn;
            }
            return { components: out, detail, nominal, lostReturn };
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

/* Body style bends the marque's curve rather than replacing it: a Toyota
   pickup and a Toyota saloon share a badge and a reputation but not a
   resale line, and the pickup's is much the stronger of the two. */
function retainedValue(years, curve, depMult) {
    const c = DEPRECIATION_CURVES[curve] || DEPRECIATION_CURVES.average;
    const k = Number.isFinite(depMult) && depMult > 0 ? depMult : 1;
    return retainedCurve(years, c.firstYear * k, c.annual * k);
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

/* ── Everything that moves when the horizon moves ────────────────
   The bars price one horizon; the break-even chart prices sixty of
   them. Deriving these in two places is how they drift apart, and they
   had: the curve kept the depreciation but quietly dropped the dealer
   haircut, the mileage penalty and the optimistic/pessimistic multiplier,
   so at the very month the bars called $848/mo the curve drew $767. One
   function, called from both. */
function horizonTerms(base, months) {
    const scen = SCENARIOS[base.scenarioCase];
    const mileageValue = mileagePenalty((base.miles - 12000) * (months / 12));
    const ageAtSale = base.buyAge + months / 12;
    /* Miles on the clock when you sell: the previous owner's assumed
       average plus your own driving, which is what a dealer's appraisal
       actually keys off. */
    const milesAtSale = base.buyAge * 12000 + base.miles * (months / 12);
    const disposal = disposalFactor(base.channel, ageAtSale, milesAtSale);
    const autoResale = base.price * retainedValue(months / 12, base.curve, base.depMult) *
        mileageValue * scen.resale * disposal;
    /* A hand-typed resale is carried as a ratio rather than a fixed sum,
       so it still reproduces exactly at the chosen horizon but keeps the
       curve's shape everywhere else. */
    const resale = Math.max(0, autoResale * base.resaleFactor);
    return {
        months,
        mileageValue,
        ageAtSale,
        milesAtSale,
        disposal,
        autoResale,
        resale,
        haircutVsPrivate: haircutVsPrivate(base.channel, ageAtSale, milesAtSale),
        /* Only worth anything if you are buying another car from the
           same dealer, which is the situation a trade-in implies. */
        tradeTaxCredit: DISPOSAL[base.channel].taxCredit ? resale * base.taxRate : 0,
        /* One big bill, sized against this car's own upkeep, only if
           the basic warranty has run out before you sell. */
        repairShock: scen.shock && outOfWarrantyDuring(months)
            ? base.rawMaintenance * scen.shock : 0
    };
}

/* Reads every input once so the four scenarios share one snapshot. */
function readInputs() {
    const months = Math.max(1, Math.round(num('horizon')));
    const scen = SCENARIOS[scenarioCase];
    const band = AGE_BANDS[carAge];
    const ptKey = POWERTRAIN_TYPES[carPowertrain] ? carPowertrain : 'petrol';
    const pt = POWERTRAIN_TYPES[ptKey];

    const rawMaint = num('maintenance');
    const rawIns = num('insurance');
    const rawReg = num('registration');
    const rawPrice = num('price');

    const bodyDep = (BODY_TYPES[carBody] || {}).depMult || 1;
    const combinedDepMult = bodyDep * (pt.depMult || 1);

    /* The half of the snapshot that does not care how long you keep it. */
    const base = {
        price: rawPrice,
        curve: $('depreciation').value,
        depMult: combinedDepMult,
        miles: num('miles'),
        channel: $('disposal').value,
        buyAge: band ? band.buyAge : 0,
        taxRate: num('taxRate') / 100,
        rawMaintenance: rawMaint,
        rawInsurance: rawIns,
        rawRegistration: rawReg,
        powertrain: ptKey,
        flexTier: typeof flexTier !== 'undefined' && FLEXCAR_TIERS[flexTier] ? flexTier : 'standard',
        scenarioCase,
        resaleFactor: 1
    };

    /* An untouched resale field follows the curve. A touched one is read
       as the *expected* case and pinned as a ratio against it, so a number
       you typed still reproduces exactly on Expected while optimistic and
       pessimistic flex around it — typing a figure should not opt you out
       of the uncertainty, it should recentre it. */
    if ($('resale').dataset.touched === '1') {
        const expected = Object.assign({}, base, { scenarioCase: 'expected' });
        const auto = horizonTerms(expected, months).autoResale;
        base.resaleFactor = auto > 0 ? Math.max(0, num('resale')) / auto : 1;
    }

    /* What the car fetches on the middle case. The resale *field* always
       shows this, whichever scenario is selected, because it is an input
       — the optimistic and pessimistic figures are outputs and belong in
       the chart's own caption, not in a box you can type into. */
    const expectedResale = scenarioCase === 'expected'
        ? horizonTerms(base, months).resale
        : horizonTerms(Object.assign({}, base, { scenarioCase: 'expected' }), months).resale;

    const evKwhPrice = num('evKwhPrice') || FUEL_DEFAULTS.evKwhPrice;
    const evMiPerKwh = num('evMiPerKwh') || FUEL_DEFAULTS.evMiPerKwh;

    return Object.assign({}, base, horizonTerms(base, months), {
        expectedResale,
        fees: num('fees'),
        insurance: rawIns * pt.insMult,
        maintenance: rawMaint * scen.maint * pt.maintMult,
        registration: rawReg + pt.evRegistrationSurcharge,
        mpg: Math.max(1, num('mpg') || FUEL_DEFAULTS.mpg),
        gasPrice: num('gasPrice'),
        evKwhPrice,
        evMiPerKwh,
        leaseResidualBonus: pt.leaseResidualBonus,
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
        leaseWear: num('leaseWear') * scen.wear,
        leaseRenewal: $('leaseRenewal').value,
        rentRate: num('rentRate'),
        rentStartFee: num('rentStartFee'),
        rentAllowance: num('rentAllowance'),
        rentBlockPrice: num('rentBlockPrice'),
        sixtLdw: num('sixtLdw'),
        sixtDriver: num('sixtDriver'),
        sixtRoadside: num('sixtRoadside'),
        sixtLicense: num('sixtLicense'),
        sixtExcess: num('sixtExcess'),
        sixtTax: num('sixtTax'),
        flexRate: num('flexRate'),
        flexProtection: num('flexProtection'),
        ownInsuranceQuote: num('ownInsuranceQuote'),
        flexTax: num('flexTax'),
        flexDelivery: num('flexDelivery'),
        flexOnTrack: num('flexOnTrack'),
        flexExcess: num('flexExcess'),
        flexStartFee: num('flexStartFee'),
        flexAllowance: num('flexAllowance'),
        flexBlockPrice: num('flexBlockPrice'),
        rentalDaily: num('rentalDaily'),
        rentalMonthly: num('rentalMonthly')
    });
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

/* Fuel is the one running cost every route carries in full, including
   the subscription — the rate covers insurance, servicing and roadside,
   but nobody fills the tank for you. It does not change which option
   wins, because it is the same car either way; it is here because a page
   that calls itself a total cost of ownership cannot leave out the line
   AAA, Edmunds and KBB all count, and at 2026 pump prices it is larger
   than the maintenance line it sits next to. */
function monthlyFuel(v) {
    if (v.powertrain === 'ev') {
        if (!v.evKwhPrice || !v.evMiPerKwh) return 0;
        return (v.miles / 12) / v.evMiPerKwh * v.evKwhPrice;
    }
    if (!v.gasPrice || !v.mpg) return 0;
    return (v.miles / 12) / v.mpg * v.gasPrice;
}

/* Costs an owner carries whichever way the car was bought. */
function addOwnerRunningCosts(led, v, maintenanceShare) {
    const fuel = monthlyFuel(v);
    const isEV = v.powertrain === 'ev';
    const pt = POWERTRAIN_TYPES[v.powertrain] || POWERTRAIN_TYPES.petrol;
    const fuelLabel = isEV
        ? 'electricity at ' + usd0(v.evKwhPrice) + '/kWh, ' + v.evMiPerKwh + ' mi/kWh'
        : 'petrol at ' + usd0(v.gasPrice) + '/gal, ' + v.mpg + ' mpg';

    for (let m = 1; m <= v.months; m++) {
        led.add(v.insurance, m, 'insurance', 'full-coverage premium' + (v.powertrain !== 'petrol' ? ' (' + pt.label + ' rate)' : ''));
        led.add(v.maintenance * maintenanceShare, m, 'maintenance',
            maintenanceShare < 1
                ? 'servicing and tyres (warranty covers the rest)'
                : (isEV ? 'EV servicing & tyres (no engine/oil repairs)' : 'servicing and repairs'));
        led.add(fuel, m, 'fuel', fuelLabel);
    }
    const years = Math.ceil(v.months / 12);
    const regLabel = isEV ? 'annual registration ($70 tag + $238 GA EV surcharge)' : 'annual registration';
    for (let y = 0; y < years; y++) {
        led.add(v.registration, Math.min(y * 12, v.months), 'fees', regLabel);
    }
    /* A lease keeps you inside cover, so the failure is the bank's. */
    if (v.repairShock && maintenanceShare === 1) {
        led.add(v.repairShock, Math.round(v.months * 0.6), 'maintenance', 'one major failure out of warranty');
    }
}


function scenarioCash(v) {
    const led = makeLedger(v.months, v.monthlyReturn);
    led.add(v.price, 0, 'depreciation', 'the purchase price');
    led.add(v.price * v.taxRate, 0, 'fees', 'title tax on the purchase');
    led.add(v.fees, 0, 'fees', 'doc, title and plates');
    addOwnerRunningCosts(led, v, 1);

    const t = led.totals();
    t.components.depreciation -= v.resale;
    t.components.fees -= v.tradeTaxCredit;
    return finish(t, v, {
        resale: v.resale,
        monthlyOutlay: v.insurance + v.maintenance + monthlyFuel(v)
    });
}

function scenarioLoan(v) {
    const led = makeLedger(v.months, v.monthlyReturn);
    const down = Math.min(v.down, v.price);
    const principal = Math.max(0, v.price - down);
    const j = v.apr / 12;
    const payment = loanPayment(principal, j, v.loanTerm);
    const paidMonths = Math.min(v.months, v.loanTerm);

    led.add(down, 0, 'depreciation', 'down payment');
    led.add(v.price * v.taxRate, 0, 'fees', 'title tax on the purchase');
    led.add(v.fees, 0, 'fees', 'doc, title and plates');

    /* Walk the amortisation so interest lands in its own component
       and the principal repaid shows up as money sunk into the car. */
    let balance = principal;
    let interestPaid = 0;
    for (let m = 1; m <= paidMonths; m++) {
        const interest = balance * j;
        const principalPart = Math.min(payment - interest, balance);
        balance -= principalPart;
        interestPaid += interest;
        led.add(interest, m, 'interest', 'loan interest');
        led.add(principalPart, m, 'depreciation', 'principal repaid');
    }
    /* Sell before the loan is done and the payoff comes out of the sale. */
    if (balance > 0.5) led.add(balance, v.months, 'depreciation', 'loan balance settled at sale');

    addOwnerRunningCosts(led, v, 1);

    const t = led.totals();
    t.components.depreciation -= v.resale;
    t.components.fees -= v.tradeTaxCredit;
    return finish(t, v, {
        resale: v.resale,
        payment,
        interestPaid,
        balanceAtEnd: balance,
        monthlyOutlay: (v.months <= v.loanTerm ? payment : 0) + v.insurance + v.maintenance +
            monthlyFuel(v)
    });
}

function scenarioLease(v) {
    const led = makeLedger(v.months, v.monthlyReturn);
    /* Two ways a lease outlives its own term, and they cost very different
       money. Re-signing starts a fresh contract each time: the drive-off is
       paid again, the car goes back, and the inspection and disposition fee
       land at every changeover. Extending keeps the same car on the same
       payment — which is what IAS offers past the first year — so the
       drive-off is paid once and there is a single turn-in at the end. On a
       $5,500 / $365 twelve-month deal held five years that is the
       difference between paying the drive-off five times and once. */
    const extending = v.leaseRenewal === 'extend';
    const cycles = extending ? 1 : Math.ceil(v.months / v.leaseTerm);
    const cycleLen = extending ? v.months : v.leaseTerm;
    let overageTotal = 0;
    let wearTotal = 0;
    let unfinishedMonths = 0;

    for (let c = 0; c < cycles; c++) {
        const start = c * cycleLen;
        if (start >= v.months) break;
        const end = Math.min(start + cycleLen, v.months);
        const monthsThisCycle = end - start;

        led.add(v.leaseSigning, start, 'depreciation', 'due at signing');
        if (c === 0 && v.leaseResidualBonus > 0) {
            led.add(-v.leaseResidualBonus, start, 'depreciation', 'IRA Sec 45W clean vehicle lease credit');
        }
        for (let m = start + 1; m <= end; m++) led.add(v.leasePayment, m, 'depreciation', 'monthly lease payment');


        /* Extra miles are cheaper bought at signing than settled at
           turn-in, but the money is gone whether you drive them or not,
           so a pre-buy is only worth it if you are sure. */
        const excessThisCycle = Math.max(0, v.miles - v.leaseAllowance) * (monthsThisCycle / 12);
        if (v.leaseMileagePlan === 'prepaid' && excessThisCycle > 0) {
            const prepaid = excessThisCycle * v.leasePrepaidRate;
            overageTotal += prepaid;
            led.add(prepaid, start, 'fees', 'extra miles bought at signing');
        }

        /* Turn-in charges only land if this cycle actually finishes inside
           the horizon. When extending there is one contract and it ends
           when you do, so the car always goes back inside the comparison. */
        if (extending || end === start + cycleLen) {
            led.add(v.leaseDisposition, end, 'fees', 'disposition fee at turn-in');
            /* The inspection happens when the car goes back, so this lands
               with the disposition fee and only on cycles that finish. */
            wearTotal += v.leaseWear;
            led.add(v.leaseWear, end, 'fees', 'excess wear at turn-in');
            if (v.leaseMileagePlan !== 'prepaid') {
                const charge = excessThisCycle * v.leaseOverage;
                overageTotal += charge;
                led.add(charge, end, 'fees', 'over-mileage billed at turn-in');
            }
        } else {
            /* The horizon ends mid-contract — the remaining payments
               are outside the comparison, not forgiven. */
            unfinishedMonths = start + cycleLen - v.months;
        }
    }

    addOwnerRunningCosts(led, v, LEASE_MAINTENANCE_SHARE);

    const t = led.totals();
    return finish(t, v, {
        resale: 0,
        cycles,
        extending,
        overageTotal,
        wearTotal,
        unfinishedMonths,
        monthlyOutlay: v.leasePayment + v.insurance + v.maintenance * LEASE_MAINTENANCE_SHARE +
            monthlyFuel(v)
    });
}

/* One subscription engine, two providers. They differ in rate, cap, block
   price and — the part that decides it for a newcomer — who they will say
   yes to, but the arithmetic is identical, so it lives here once. */
function scenarioSubscription(v, cfg) {
    const led = makeLedger(v.months, v.monthlyReturn);
    if (cfg.annualFee) {
        /* Flexcar bills membership yearly, not once — $249 covers servicing
           and roadside and recurs for as long as you stay. */
        for (let y = 0; y < Math.ceil(v.months / 12); y++) {
            led.add(cfg.startFee, Math.min(y * 12, v.months), 'fees', 'annual membership (required)');
        }
    } else {
        led.add(cfg.startFee, 0, 'fees', 'joining / delivery fee');
    }
    /* A subscription sells mileage in blocks rather than billing per
       mile after the fact, so you buy the whole block or go without.
       Unused miles roll over, which means your average matters and a
       single heavy month does not. */
    const excessPerMonth = Math.max(0, v.miles / 12 - cfg.allowance);
    const blocks = Math.ceil(excessPerMonth / 1000);
    const overagePerMonth = blocks * cfg.blockPrice;
    const fuel = monthlyFuel(v);
    led.add(cfg.delivery || 0, 0, 'fees', 'vehicle delivery');
    /* Sixt+ quotes tax-inclusive and Flexcar quotes before it. Comparing
       the two headlines as they are published flatters Flexcar by the
       local rate, so tax is added here rather than assumed away. */
    const tax = cfg.taxRate || 0;
    for (let m = 1; m <= v.months; m++) {
        /* OnTrack: pay on time and drive safely for six months and the
           rate steps down, and the discount follows you across cars. */
        const cut = cfg.onTrackCut && m > 6 ? cfg.onTrackCut : 0;
        const rate = Math.max(0, cfg.rate - cut);
        led.add(rate, m, 'depreciation', 'monthly subscription rate');
        led.add(overagePerMonth, m, 'fees', 'extra mileage blocks');
        led.add(cfg.fees || 0, m, 'fees', 'vehicle licence fee');
        led.add((rate + (cfg.insurance || 0)) * tax, m, 'fees', 'sales tax on the subscription');
        led.add(cfg.insurance || 0, m, 'insurance', 'protection plan and extra driver');
        led.add(cfg.upkeep || 0, m, 'maintenance', 'roadside cover');
        led.add(fuel, m, 'fuel');
    }

    /* A damage waiver is not the same as being covered. Sixt's carries a
       $1,000 "financial responsibility" — the excess you pay before the
       waiver does anything — so the bad case books one claim, the same way
       the owning routes book one major repair and the lease books its
       turn-in bill. Every route should have something to go wrong. */
    const excessRisk = cfg.excess && SCENARIOS[v.scenarioCase].wear >= 3 ? cfg.excess : 0;
    if (excessRisk) led.add(excessRisk, Math.round(v.months * 0.5), 'fees', 'damage excess on one claim');

    const allIn = (cfg.rate + (cfg.insurance || 0)) * (1 + tax) +
        (cfg.upkeep || 0) + (cfg.fees || 0);
    const t = led.totals();
    return finish(t, v, {
        resale: 0,
        overagePerMonth,
        mileageBlocks: blocks,
        allowance: cfg.allowance,
        rate: cfg.rate,
        allIn,
        annualFee: cfg.annualFee ? cfg.startFee : 0,
        insuranceLine: cfg.insurance || 0,
        excessRisk,
        monthlyOutlay: allIn + overagePerMonth + fuel
    });
}

/* The real contract, line by line, rather than one headline number. Each
   charge lands in the component it actually is, so the Sixt+ bar breaks
   down like every other route instead of being a single opaque block —
   and the damage waiver plus the second driver come to $211/mo, which is
   within a couple of dollars of what the owning routes pay for insurance.
   That is the clearest evidence on the page that the all-in rate is not
   the markup it looks like. */
function scenarioSixt(v) {
    return scenarioSubscription(v, {
        rate: v.rentRate,
        insurance: v.sixtLdw + v.sixtDriver,
        upkeep: v.sixtRoadside,
        fees: v.sixtLicense,
        taxRate: v.sixtTax / 100,
        excess: v.sixtExcess,
        startFee: v.rentStartFee,
        allowance: v.rentAllowance,
        blockPrice: v.rentBlockPrice
    });
}

/* Flexcar's tile is a car line plus a mandatory protection plan, and the
   two fees it does not show: a $249 annual membership covering servicing
   and roadside, and a delivery charge that ranges from $199 to $874
   depending on where the car happens to be. */
function scenarioFlexcar(v) {
    const tier = FLEXCAR_TIERS[v.flexTier] || FLEXCAR_TIERS.standard;
    const rate = v.flexRate + tier.rateOffset;
    const allowance = tier.allowance;
    return scenarioSubscription(v, {
        rate: rate,
        insurance: v.flexProtection,
        taxRate: v.flexTax / 100,
        delivery: v.flexDelivery,
        onTrackCut: v.flexOnTrack,
        excess: v.flexExcess,
        startFee: v.flexStartFee, annualFee: true,
        allowance: allowance, blockPrice: v.flexBlockPrice
    });
}

/* Renting by the day, every day. Nobody plans to do this for five years,
   which is the point: it prices the option of committing to nothing, and
   it is the ceiling every other route is measured against. Mileage is
   almost always unlimited, and the rate carries insurance, servicing and
   registration the way a subscription does — but not fuel. */
function scenarioRental(v) {
    const led = makeLedger(v.months, v.monthlyReturn);
    const perMonth = v.rentalMonthly;
    const fuel = monthlyFuel(v);
    for (let m = 1; m <= v.months; m++) {
        led.add(perMonth, m, 'depreciation', 'monthly hire rate');
        led.add(fuel, m, 'fuel');
    }

    const t = led.totals();
    return finish(t, v, {
        resale: 0,
        dailyRate: v.rentalDaily,
        monthlyOutlay: perMonth + fuel
    });
}

/* Shared tail: total, per-month, and the raw cash figure without the
   opportunity-cost layer, so both readings are available. */
function finish(t, v, extra) {
    const total = Object.values(t.components).reduce((a, b) => a + b, 0);
    return Object.assign({
        components: t.components,
        detail: t.detail,
        total,
        perMonth: total / v.months,
        cashOut: t.nominal,
        lostReturn: t.lostReturn
    }, extra);
}

function getAccountability(v) {
    const pt = POWERTRAIN_TYPES[v.powertrain] || POWERTRAIN_TYPES.petrol;
    const isEV = v.powertrain === 'ev';
    const fuelMonthly = monthlyFuel(v);
    const scen = SCENARIOS[v.scenarioCase];

    return {
        powertrainLabel: pt.label,
        powertrainNote: pt.note,
        fuel: {
            monthly: fuelMonthly,
            formula: isEV
                ? `(${v.miles.toLocaleString()} mi/yr ÷ 12) ÷ ${v.evMiPerKwh} mi/kWh × $${v.evKwhPrice}/kWh`
                : `(${v.miles.toLocaleString()} mi/yr ÷ 12) ÷ ${v.mpg} mpg × $${v.gasPrice}/gal`,
            unitPrice: isEV ? `$${v.evKwhPrice}/kWh` : `$${v.gasPrice}/gal`,
            efficiency: isEV ? `${v.evMiPerKwh} mi/kWh` : `${v.mpg} mpg`
        },
        maintenance: {
            monthly: v.maintenance,
            base: v.rawMaintenance,
            ptMult: pt.maintMult,
            scenMult: scen.maint,
            formula: `$${Math.round(v.rawMaintenance)}/mo base × ${pt.maintMult} (${pt.label}) × ${scen.maint} (${scen.label})`
        },
        insurance: {
            monthly: v.insurance,
            base: v.rawInsurance,
            ptMult: pt.insMult,
            formula: `$${Math.round(v.rawInsurance)}/mo base × ${pt.insMult} (${pt.label})`
        },
        registration: {
            annual: v.registration,
            monthly: v.registration / 12,
            base: v.rawRegistration,
            evSurcharge: pt.evRegistrationSurcharge,
            formula: pt.evRegistrationSurcharge > 0
                ? `$${Math.round(v.rawRegistration)}/yr tag + $${pt.evRegistrationSurcharge}/yr GA EV Surcharge`
                : `$${Math.round(v.rawRegistration)}/yr tag & emissions`
        },
        leaseSubsidy: pt.leaseResidualBonus
    };
}

function computeAll(v) {
    return {
        cash: scenarioCash(v),
        loan: scenarioLoan(v),
        lease: scenarioLease(v),
        sixt: scenarioSixt(v),
        flexcar: scenarioFlexcar(v),
        rental: scenarioRental(v),
        accountability: getAccountability(v)
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
   re-runs all six scenarios across a range of horizons. Every term that
   depends on the horizon is re-derived through horizonTerms, which is
   what makes the curve pass exactly through the bars at the month you
   picked — the odometer at sale, the dealer's haircut widening with it,
   the trade-in tax credit and the out-of-warranty repair shock all move
   with the horizon, not just the depreciation. */
function costCurve(v, maxMonths, step) {
    const points = [];
    for (let m = 6; m <= maxMonths; m += step) {
        const variant = Object.assign({}, v, horizonTerms(v, m));
        const r = computeAll(variant);
        points.push({
            month: m,
            cash: r.cash, loan: r.loan, lease: r.lease,
            sixt: r.sixt, flexcar: r.flexcar, rental: r.rental
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
            const val = measure === 'total'
                ? activeTotal(p[o.key]) : activePerMonth(p[o.key], p.month);
            if (val < best) { best = val; lead = o.key; }
        }
        if (prevLead && lead !== prevLead) {
            changes.push({ month: p.month, from: prevLead, to: lead });
        }
        prevLead = lead;
    }
    return changes;
}
