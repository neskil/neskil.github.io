/* ── The cost model ──────────────────────────────────────────────────
   Reads one plain input object and prices the same need seven ways
   through a shared cash-flow ledger, so the routes compare line by line.
   No DOM: tests.html imports this file directly. */

import {
    COMPONENTS, ROUTES, VEHICLE_TAX, INTEREST_DEDUCTION, BENEFIT, POWERTRAINS,
    RESIDUAL_GROUPS, LATE_PHASE, EV_LOSS_MULT, AVERAGE_MIL, VALUE_PER_1000_MIL,
    EXITS, INSURANCE, UPKEEP, SIZE_MULT, sizeTier, LOANS, LEASE, SUBSCRIPTION,
    RENTAL, SCENARIOS, PRESETS, DEFAULTS
} from './data.js';

/* ── Ledger ──────────────────────────────────────────────────────
   Each entry is an amount, the month it happens and its component.
   Money spent in month k could otherwise have earned a return until the
   end of the horizon, so the return given up on it is
   amount × ((1 + i)^(N − k) − 1). Booking it this way puts the
   opportunity cost of paying cash on the same footing as a lease payment
   made in month 30. Money coming back (the sale) is a negative entry. */
export function makeLedger(months, monthlyReturn) {
    const flows = [];
    return {
        add(amount, month, component, label) {
            if (!amount) return;
            flows.push({ amount, month: Math.min(Math.max(month, 0), months), component, label });
        },
        flows,
        totals() {
            const components = Object.fromEntries(COMPONENTS.map(c => [c.key, 0]));
            const detail = {};
            let nominal = 0, lostReturn = 0;
            for (const f of flows) {
                components[f.component] += f.amount;
                nominal += f.amount;
                if (f.label) {
                    detail[f.component] = detail[f.component] || {};
                    detail[f.component][f.label] = (detail[f.component][f.label] || 0) + f.amount;
                }
                if (f.amount > 0) lostReturn += f.amount * (Math.pow(1 + monthlyReturn, months - f.month) - 1);
            }
            components.interest += lostReturn;
            if (lostReturn) {
                detail.interest = detail.interest || {};
                detail.interest['return the money stops earning'] = lostReturn;
            }
            return { components, detail, nominal, lostReturn, total: nominal + lostReturn };
        }
    };
}

export const monthlyRate = (annualPct) => Math.pow(1 + annualPct / 100, 1 / 12) - 1;

/* ── Fordonsskatt ────────────────────────────────────────────────
   Yearly vehicle tax for a car `ageYears` old (counted from first
   registration), plus the register fee. */
export function vehicleTax(powertrain, co2, ageYears) {
    const t = VEHICLE_TAX;
    const g = Math.max(0, Number(co2) || 0);
    let carbon;
    if (powertrain === 'el') carbon = 0;
    else if (ageYears < t.malusYears) {
        carbon = Math.max(0, Math.min(g, t.malusHighFrom) - t.malusLowFrom) * t.malusLowRate +
                 Math.max(0, g - t.malusHighFrom) * t.malusHighRate;
    } else {
        carbon = Math.max(0, g - t.afterFrom) * t.afterRate;
    }
    let tax = t.base + carbon;
    if (powertrain === 'diesel') tax += g * t.dieselPerGram + t.dieselEnvironment;
    return tax + t.registerFee;
}

/* ── Förmånsvärde ────────────────────────────────────────────────
   Skatteverket's 2026 formula. Returns kr per year. */
export function benefitValue(newPrice, powertrain, yearlyVehicleTax) {
    const b = BENEFIT;
    const cut = Math.min(b.reduction[powertrain] || 0, newPrice * b.reductionCap);
    const p = Math.max(0, newPrice - cut);
    return b.fixedShare * b.prisbasbelopp + p * (b.slrShare * b.slr + b.slrAdd) + p * b.priceShare + yearlyVehicleTax;
}

/* ── Resale curve ────────────────────────────────────────────────
   Share of the new price left at `years`, interpolated geometrically
   between the published one-, three- and five-year points, and slowing
   to LATE_PHASE of the year-3-to-5 pace after that. */
export function retained(years, groupKey) {
    const g = RESIDUAL_GROUPS[groupKey] || RESIDUAL_GROUPS.other;
    const t = Math.max(0, years);
    const knots = [[0, 1], [1, g.r1], [3, g.r3], [5, g.r5]];
    for (let i = 1; i < knots.length; i++) {
        const [t0, v0] = knots[i - 1], [t1, v1] = knots[i];
        if (t <= t1) return v0 * Math.pow(v1 / v0, (t - t0) / (t1 - t0));
    }
    const yearly = Math.pow(g.r5 / g.r3, 0.5);           // e.g. 0.90 = 10 % a year
    const slower = 1 - (1 - yearly) * LATE_PHASE;
    return g.r5 * Math.pow(slower, t - 5);
}

/* Market value of the car `k` months into the horizon. The loss since
   purchase is scaled by the scenario and, for an electric car from a
   brand that mostly sells combustion cars, by EV_LOSS_MULT; mileage
   above the national average takes a further share off. */
export function valueAt(inp, k) {
    const price = inp.price;
    const ratio = retained(inp.age + k / 12, inp.group) / retained(inp.age, inp.group);
    const ev = inp.powertrain === 'el' && inp.group !== 'evbrand' ? EV_LOSS_MULT : 1;
    const scen = SCENARIOS[inp.scenario] || SCENARIOS.expected;
    const loss = Math.min(0.95, (1 - ratio) * scen.loss * ev);
    const extraMil = (inp.mil - AVERAGE_MIL) * (k / 12);
    const milFactor = Math.min(1.1, Math.max(0.5, 1 - VALUE_PER_1000_MIL * extraMil / 1000));
    return price * (1 - loss) * milFactor;
}

/* What the same car cost new — needed for the routes that always hand
   you a new one, and for the company-car benefit. */
export function newPriceOf(inp) {
    if (!(inp.age > 0)) return inp.price;
    return inp.price / retained(inp.age, inp.group);
}

/* ── Loans ───────────────────────────────────────────────────────── */
export function loanPayment(principal, r, term) {
    if (principal <= 0 || term <= 0) return 0;
    if (r === 0) return principal / term;
    return principal * r / (1 - Math.pow(1 + r, -term));
}

export function loanTypeOf(inp) {
    return LOANS[inp.loanType] || LOANS.billan;
}

export function loanRateOf(inp) {
    const lt = loanTypeOf(inp);
    return inp.loanRate != null ? inp.loanRate / 100 : lt.rate;
}

/* ── Running costs ───────────────────────────────────────────────
   Per-month figures for month k of the horizon (1-based). */
function energyPerMonth(inp) {
    const pt = POWERTRAINS[inp.powertrain] || POWERTRAINS.bensin;
    const scen = SCENARIOS[inp.scenario] || SCENARIOS.expected;
    const milMonth = inp.mil / 12;
    const share = Math.min(100, Math.max(0, inp.homeShare)) / 100;
    const kwhPrice = share * inp.homeKwh + (1 - share) * inp.publicKwh;
    const fuelPrice = pt.fuel === 'diesel' ? inp.diesel : inp.petrol;
    let kwh = pt.kwhPerMil * pt.electricShare, litres = pt.litrePerMil * (1 - pt.electricShare);
    if (inp.consumption != null) {
        if (inp.powertrain === 'el') kwh = inp.consumption;
        else litres = inp.consumption * (1 - pt.electricShare);
    }
    return milMonth * (kwh * kwhPrice + litres * fuelPrice) * scen.energy;
}

export function energyPerMil(inp) {
    return energyPerMonth(inp) / (inp.mil / 12);
}

/* Helförsäkring a year for a car worth `value`. */
export function helInsurance(inp, value) {
    if (inp.insurance != null) return inp.insurance;
    let y = INSURANCE.helBase + INSURANCE.helPerKr * value;
    y *= INSURANCE.groupMult[inp.group] || (inp.powertrain === 'el' ? INSURANCE.evMult : 1);
    if (inp.young) y *= INSURANCE.youngMult;
    if (inp.bigCity) y *= INSURANCE.cityMult;
    return y;
}

/* Insurance in month k for a car that is `ageMonths` old then. The
   vagnskadegaranti runs three years from first registration, whoever owns
   the car, and while it does halvförsäkring is all it needs. */
export function underGaranti(ageMonths) {
    return ageMonths <= INSURANCE.garantiMonths;
}
function insuranceMonth(inp, value, ageMonths) {
    const hel = helInsurance(inp, value);
    return (underGaranti(ageMonths) ? hel * INSURANCE.halvShare : hel) / 12;
}

function ageMultiplier(ageYears) {
    for (const [upTo, m] of UPKEEP.ageMult) if (ageYears < upTo) return m;
    return 1;
}

export function serviceYear(inp, ageYears) {
    if (inp.service != null) return inp.service;
    const pt = POWERTRAINS[inp.powertrain] || POWERTRAINS.bensin;
    const tier = sizeTier(newPriceOf(inp));
    const scen = SCENARIOS[inp.scenario] || SCENARIOS.expected;
    const use = 0.6 + 0.4 * (inp.mil / AVERAGE_MIL);
    return pt.service * SIZE_MULT[tier] * ageMultiplier(ageYears) * use * scen.upkeep;
}

/* Two sets of tyres, worn out by distance or by age (rubber hardens
   after about seven years, however little it is driven); two swaps a
   year; a däckhotell if you use one. */
export function tyresYear(inp) {
    const tier = sizeTier(newPriceOf(inp));
    const wear = inp.powertrain === 'el' ? UPKEEP.evTyreWear : 1;
    const setsPerYear = 2 * Math.max((inp.mil / 2) / UPKEEP.tyreLifeMil * wear, 1 / 7);
    return UPKEEP.tyreSet[tier] * setsPerYear + 2 * UPKEEP.swap + (inp.hotel ? UPKEEP.hotelYear : 0);
}

/* Months since first registration at which the car is inspected. */
export function isInspectionMonth(ageMonths) {
    const [first, second, then] = UPKEEP.inspectAt;
    if (ageMonths === first || ageMonths === first + second) return true;
    return ageMonths > first + second && (ageMonths - first - second) % then === 0;
}

function cityPerMonth(inp) {
    return (inp.congestion || 0) + (inp.parking || 0);
}

/* Everything an owner pays besides the car itself: tax, insurance,
   upkeep, energy, city. `startAge` is the car's age in months at month 0. */
function bookRunning(L, inp, months, opts) {
    const { startAge, includeService = true, includeTyres = true, valueOf } = opts;
    const pt = inp.powertrain;
    const energy = energyPerMonth(inp);
    const tyres = tyresYear(inp) / 12;
    for (let k = 1; k <= months; k++) {
        const ageM = startAge + k;
        L.add(vehicleTax(pt, inp.co2, (ageM - 1) / 12) / 12, k, 'tax', 'fordonsskatt');
        /* Due by the end of that month; a car handed back or sold the same
           month goes uninspected by you. */
        if (isInspectionMonth(ageM) && k < months) L.add(UPKEEP.inspection, k, 'tax', 'besiktning');
        L.add(insuranceMonth(inp, valueOf(k), ageM), k, 'insurance',
            underGaranti(ageM) ? 'halvförsäkring (under vagnskadegaranti)' : 'helförsäkring');
        if (includeService) L.add(serviceYear(inp, (ageM - 1) / 12) / 12, k, 'upkeep', 'service & repairs');
        if (includeTyres) L.add(tyres, k, 'upkeep', 'tyres & swaps');
        L.add(energy, k, 'energy', POWERTRAINS[pt]?.fuel ? 'fuel' : 'charging');
        L.add(cityPerMonth(inp), k, 'city', 'parking & congestion');
    }
}

/* Winter wheels for a car that does not come with them: a set of rims
   at the start, sold with the car. */
function bookRims(L, inp, months) {
    const rims = UPKEEP.rimSet[sizeTier(newPriceOf(inp))];
    L.add(rims, 0, 'upkeep', 'winter rims');
    L.add(-rims * UPKEEP.rimResale, months, 'upkeep', 'winter rims sold');
}

/* The sale at the end: market value less the channel's discount, and
   its fee (an ad on Blocket). */
function bookSale(L, inp, N) {
    const exit = EXITS[inp.exit] || EXITS.inbyte;
    L.add(-valueAt(inp, N) * (1 - exit.haircut), N, 'value', 'sale');
    if (exit.fee) L.add(exit.fee, N, 'tax', 'selling costs');
}

/* ── The routes ──────────────────────────────────────────────────
   Each returns { total, components, detail, gate, notes, mil }. A gate
   is { open: false, code, vars, reason } when something in your situation
   shuts the door; `code` and `vars` let the page say it in either language,
   `reason` is the English for tests and the console. Such routes are drawn
   but never called the cheapest. */
const closed = (code, vars, reason) => ({ open: false, code, vars: vars || {}, reason });

function priceCash(inp, N, i) {
    const L = makeLedger(N, i);
    const boughtNew = !(inp.age > 0);
    L.add(inp.price, 0, 'value', 'purchase price');
    if (boughtNew) bookRims(L, inp, N);
    bookRunning(L, inp, N, { startAge: Math.round(inp.age * 12), valueOf: k => valueAt(inp, k) });
    bookSale(L, inp, N);
    const need = inp.price + (boughtNew ? UPKEEP.rimSet[sizeTier(newPriceOf(inp))] : 0);
    const gate = inp.savings >= need ? { open: true }
        : closed('savings', { need }, `Needs ${fmtKr(need)} in savings`);
    return { ...L.totals(), gate };
}

/* Ränteavdrag on a year's deductible interest: 30 % up to 100 000 kr,
   21 % above. The cap is per person and shared with a mortgage; this
   page sees only the car loan. */
export function interestDeduction(yearlyInterest) {
    const d = INTEREST_DEDUCTION;
    return d.rate * Math.min(yearlyInterest, d.cap) + d.rateAbove * Math.max(0, yearlyInterest - d.cap);
}

/* One amortising loan, booked month by month. Deductible interest is
   credited per twelve-month block, so the cap and the 21 % step apply to
   a year's interest rather than a month's. Returns what is left owing. */
function bookLoan(L, principal, annualRate, term, N, opts) {
    const r = annualRate / 12;
    const pay = loanPayment(principal, r, term);
    let bal = principal, interestPaid = 0, yearInterest = 0, yearDeducted = 0;
    for (let k = 1; k <= Math.min(N, term); k++) {
        const interest = bal * r;
        const amort = Math.min(bal, pay - interest);
        bal -= amort;
        interestPaid += interest;
        let credit = 0;
        if (opts.deductible) {
            yearInterest += interest;
            const due = interestDeduction(yearInterest);
            credit = due - yearDeducted;
            yearDeducted = due;
            if (k % 12 === 0) { yearInterest = 0; yearDeducted = 0; }
        }
        L.add(interest - credit, k, 'interest', opts.label);
        L.add(amort, k, 'value', opts.repayLabel);
        if (opts.fee) L.add(opts.fee, k, 'tax', 'aviavgift');
    }
    return { bal, pay, interestPaid };
}

function priceLoan(inp, N, i) {
    const L = makeLedger(N, i);
    const lt = loanTypeOf(inp);
    const scen = SCENARIOS[inp.scenario] || SCENARIOS.expected;
    const rate = Math.max(0, loanRateOf(inp) + scen.rate);
    const downShare = Math.max(0, Math.min(1, inp.down / 100));
    const down = inp.price * downShare;
    /* A dealer loan wants 20 % down. Put in less and the gap is lent to
       you separately, unsecured, at a private-loan rate and with no
       deduction; the secured part keeps both. */
    const gapShare = Math.max(0, lt.minDown - downShare);
    const securedShare = 1 - downShare - gapShare;
    const term = Math.max(1, Math.round(inp.loanTerm));
    const boughtNew = !(inp.age > 0);

    L.add(down, 0, 'value', 'kontantinsats');
    L.add(lt.setup, 0, 'tax', 'uppläggningsavgift');
    const main = bookLoan(L, inp.price * securedShare, rate, term, N, {
        deductible: lt.deductible, fee: lt.monthlyFee,
        label: lt.deductible ? 'interest after ränteavdrag' : 'interest', repayLabel: 'repayments'
    });
    let gap = { bal: 0, pay: 0, interestPaid: 0 };
    if (gapShare > 0) {
        const gapRate = Math.max(0, LOANS.privatlan.rate + scen.rate);
        gap = bookLoan(L, inp.price * gapShare, gapRate, term, N, {
            deductible: false, fee: LOANS.privatlan.monthlyFee,
            label: 'interest on the unsecured top-up', repayLabel: 'top-up repayments'
        });
    }
    if (boughtNew) bookRims(L, inp, N);
    bookRunning(L, inp, N, { startAge: Math.round(inp.age * 12), valueOf: k => valueAt(inp, k) });
    const owed = main.bal + gap.bal;
    if (owed > 0.5) L.add(owed, N, 'value', 'loan paid off at sale');
    bookSale(L, inp, N);

    let gate = { open: true };
    if (inp.remark) gate = closed('loanRemark', null, 'A payment remark closes almost every lender');
    else if (!inp.income) gate = closed('loanIncome', null, 'Lenders want a steady income');
    else if (lt.needsHome && !inp.home) gate = closed('loanHome', null, 'A mortgage top-up needs a home with room in the loan');
    else if (inp.savings < down + lt.setup) gate = closed('loanDown', { pct: Math.round(downShare * 100), need: down }, `The ${Math.round(downShare * 100)} % down payment needs ${fmtKr(down)}`);
    return {
        ...L.totals(), gate, payment: main.pay + gap.pay, interestPaid: main.interestPaid + gap.interestPaid,
        rate, gapShare
    };
}

/* Leasing quote for the allowance you sign: the advertised price is at
   1 000 mil a year and each 500 mil more adds a step. */
export function leaseAllowance(inp) {
    if (inp.leaseMil != null) return inp.leaseMil;
    return Math.max(LEASE.baseMil, Math.ceil(inp.mil / LEASE.stepMil) * LEASE.stepMil);
}

export function leaseQuoteOf(inp) {
    if (inp.leaseQuote != null) return inp.leaseQuote;
    return roundTo9(newPriceOf(inp) * LEASE.shareOfPrice);
}

export function leaseMonthly(inp) {
    const steps = Math.max(0, (leaseAllowance(inp) - LEASE.baseMil) / LEASE.stepMil);
    return leaseQuoteOf(inp) + steps * LEASE.stepPrice;
}

function priceLease(inp, N, i) {
    const L = makeLedger(N, i);
    const scen = SCENARIOS[inp.scenario] || SCENARIOS.expected;
    const term = Math.max(6, Math.round(inp.leaseTerm));
    const newPrice = newPriceOf(inp);
    /* A floating lease follows the lessor's funding rate: on roughly 80 %
       of the price outstanding on average, a point of interest is about
       0.067 % of the price a month. */
    const rateBump = newPrice * 0.8 * scen.rate / 12;
    const monthly = Math.max(0, leaseMonthly(inp) + rateBump);
    const billed = Math.max(N, term);
    const allowance = leaseAllowance(inp);
    const lease = { ...inp, age: 0, price: newPrice };

    for (let k = 1; k <= billed; k++) {
        const start = (k - 1) % term === 0;
        if (start) L.add(LEASE.setup, k - 1, 'tax', 'uppläggningsavgift');
        L.add(monthly, Math.min(k, N), 'value', 'leasing fee');
        const end = k % term === 0 || k === billed;
        if (end) {
            const months = ((k - 1) % term) + 1;
            const over = Math.max(0, inp.mil - allowance) * months / 12;
            L.add(over * inp.overMil, Math.min(k, N), 'tax', 'övermil');
            L.add(inp.returnDamage * scen.damage, Math.min(k, N), 'tax', 'wear charged at return');
        }
    }
    /* Running costs for a car that is always new: each contract starts
       at age 0 and comes with the warranty. */
    for (let c = 0; c * term < N; c++) {
        const span = Math.min(term, N - c * term);
        const sub = makeLedger(span, 0);
        bookRunning(sub, lease, span, {
            startAge: 0, includeService: !inp.leaseService,
            valueOf: k => valueAt(lease, k)
        });
        for (const f of sub.flows) L.add(f.amount, f.month + c * term, f.component, f.label);
        const rims = UPKEEP.rimSet[sizeTier(newPrice)];
        L.add(rims, c * term, 'upkeep', 'winter rims');
        L.add(-rims * UPKEEP.rimResale, c * term + span, 'upkeep', 'winter rims sold');
    }
    let gate = { open: true };
    if (inp.remark) gate = closed('leaseRemark', null, 'Leasing needs a clean credit report (UC)');
    else if (!inp.income) gate = closed('leaseIncome', null, 'Lessors want a steady income');
    return { ...L.totals(), gate, monthly, allowance, billed };
}

export function subPriceOf(inp) {
    if (inp.subPrice != null) return inp.subPrice;
    return roundTo9(Math.max(SUBSCRIPTION.floor, newPriceOf(inp) * SUBSCRIPTION.shareOfPrice));
}

function priceSub(inp, N, i) {
    const L = makeLedger(N, i);
    const billed = Math.max(N, Math.round(inp.subMin));
    const price = subPriceOf(inp);
    const excess = Math.max(0, inp.mil / 12 - inp.subMil) * inp.subExcess;
    const energy = energyPerMonth(inp);
    for (let k = 1; k <= billed; k++) {
        L.add(price, Math.min(k, N), 'value', 'subscription (insurance, tax, service, tyres)');
        if (k <= N) {
            L.add(excess, k, 'tax', 'extra mil');
            L.add(energy, k, 'energy', POWERTRAINS[inp.powertrain]?.fuel ? 'fuel' : 'charging');
            L.add(cityPerMonth(inp), k, 'city', 'parking & congestion');
        }
    }
    const gate = inp.remark ? closed('subRemark', null, 'Subscriptions run a credit check') : { open: true };
    return { ...L.totals(), gate, monthly: price, billed };
}

export function rentPriceOf(inp) {
    if (inp.rentPrice != null) return inp.rentPrice;
    return RENTAL.monthly[sizeTier(newPriceOf(inp))];
}

function priceRental(inp, N, i) {
    const L = makeLedger(N, i);
    const price = rentPriceOf(inp);
    const excess = Math.max(0, inp.mil / 12 - inp.rentMil) * inp.rentExcess;
    const energy = energyPerMonth(inp);
    for (let k = 1; k <= N; k++) {
        L.add(price, k, 'value', 'rental (insurance, tax, service, tyres)');
        L.add(excess, k, 'tax', 'extra mil');
        L.add(energy, k, 'energy', 'fuel or charging');
        L.add(cityPerMonth(inp), k, 'city', 'parking & congestion');
    }
    const gate = !inp.card ? closed('rentalCard', null, 'Rental desks want a credit card') : { open: true };
    return { ...L.totals(), gate, monthly: price };
}

/* Mil a year the no-car route actually drives: pool trips plus the
   summer hire (≈ 150 mil a week on holiday). */
export function noCarMil(inp) {
    return (inp.poolTrips * inp.poolKm * 12) / 10 + inp.holidayWeeks * 150;
}

function priceNoCar(inp, N, i) {
    const L = makeLedger(N, i);
    const trip = inp.poolHours * inp.poolHourly + inp.poolKm * inp.poolPerKm;
    for (let k = 1; k <= N; k++) {
        if (inp.transit) L.add(inp.transitPrice, k, 'value', 'monthly transit pass');
        L.add(inp.poolTrips * trip, k, 'value', 'car-sharing trips (fuel included)');
        L.add(inp.holidayWeeks * inp.weekPrice / 12, k, 'value', 'holiday car hire');
    }
    return { ...L.totals(), gate: { open: true } };
}

function priceBenefit(inp, N, i) {
    const L = makeLedger(N, i);
    const newPrice = newPriceOf(inp);
    const tax = vehicleTax(inp.powertrain, inp.co2, 0);
    const fv = benefitValue(newPrice, inp.powertrain, tax);
    const t = Math.min(0.7, Math.max(0, inp.marginalTax / 100));
    const benefitTax = fv * t / 12;
    const deduction = (inp.grossDeduction || 0) * (1 - t);
    const energy = energyPerMonth(inp);
    for (let k = 1; k <= N; k++) {
        L.add(benefitTax, k, 'tax', 'tax on the benefit value');
        if (deduction) L.add(deduction, k, 'value', 'gross salary deduction, after tax');
        L.add(energy, k, 'energy', 'fuel or charging you pay');
        L.add(cityPerMonth(inp), k, 'city', 'parking & congestion');
    }
    const gate = inp.benefit ? { open: true } : closed('benefitOff', null, 'Only if your employer offers one');
    return { ...L.totals(), gate, benefitValue: fv };
}

const PRICERS = {
    cash: priceCash, loan: priceLoan, lease: priceLease, sub: priceSub,
    rental: priceRental, nocar: priceNoCar, benefit: priceBenefit
};

/* Fill in anything missing from DEFAULTS, so a partial object (a test,
   a shared link) prices the same as the page. */
export function withDefaults(inp) {
    return { ...DEFAULTS, ...(inp || {}) };
}

/* Price every route at horizon N (months). */
export function priceAll(input, horizon) {
    const inp = withDefaults(input);
    const N = Math.max(1, Math.round(horizon != null ? horizon : inp.horizon));
    const i = monthlyRate(inp.altReturn);
    const routes = ROUTES.map(r => {
        const res = PRICERS[r.key](inp, N, i);
        const mil = r.key === 'nocar' ? noCarMil(inp) : inp.mil;
        return {
            key: r.key, label: r.label, sv: r.sv,
            ...res,
            perMonth: res.total / N,
            perMil: mil > 0 ? res.total / (mil * N / 12) : 0,
            mil
        };
    });
    const open = routes.filter(r => r.gate.open && !(r.key === 'benefit' && !inp.benefit));
    const cheapest = open.length ? open.reduce((a, b) => (b.total < a.total ? b : a)) : null;
    const shown = routes.filter(r => !(r.key === 'benefit' && !inp.benefit));
    const overall = shown.reduce((a, b) => (b.total < a.total ? b : a));
    /* Going without is nearly always cheapest, and is a different life
       rather than a different way to pay, so the headline answers "the
       cheapest way to have a car" and shows no-car beside it. */
    const withCar = open.filter(r => r.key !== 'nocar');
    const cheapestCar = withCar.length ? withCar.reduce((a, b) => (b.total < a.total ? b : a)) : null;
    const cheapestCarAny = shown.filter(r => r.key !== 'nocar').reduce((a, b) => (b.total < a.total ? b : a));
    return { routes, cheapest, cheapestCar, cheapestCarAny, overall, horizon: N };
}

/* Monthly cost per route across horizons, for the break-even chart. */
export function horizonSeries(input, months) {
    return months.map(m => {
        const { routes } = priceAll(input, m);
        return { x: m, values: Object.fromEntries(routes.map(r => [r.key, r.perMonth])) };
    });
}

/* Monthly cost per route across yearly mileage. The no-car route does
   not move: its mileage is its own. */
export function mileageSeries(input, mils) {
    const inp = withDefaults(input);
    return mils.map(mil => {
        const { routes } = priceAll({ ...inp, mil, leaseMil: inp.leaseMil }, inp.horizon);
        return { x: mil, values: Object.fromEntries(routes.map(r => [r.key, r.perMonth])) };
    });
}

/* ── Share links ─────────────────────────────────────────────────
   Only what differs from DEFAULTS goes in the link, so a link stays short
   and keeps working when a default changes underneath it. */
const SHORT = {
    preset: 'p', price: 'pr', age: 'a', powertrain: 'pt', co2: 'co', group: 'g', horizon: 'h', mil: 'm',
    scenario: 'sc', petrol: 'pe', diesel: 'di', homeKwh: 'hk', publicKwh: 'pk', homeShare: 'hs',
    consumption: 'cn', insurance: 'in', service: 'sv', hotel: 'ho', congestion: 'ct', parking: 'pa',
    young: 'y', bigCity: 'bc', savings: 's', altReturn: 'ar', loanType: 'lt', loanRate: 'lr', down: 'd',
    loanTerm: 'tm', exit: 'ex', remark: 'rm', income: 'ic', card: 'cd', home: 'hm', leaseQuote: 'lq',
    leaseMil: 'lm', leaseTerm: 'lx', overMil: 'om', leaseService: 'ls', returnDamage: 'rd', subPrice: 'sp',
    subMil: 'sm', subExcess: 'se', subMin: 'sn', rentPrice: 'rp', rentMil: 'rl', rentExcess: 're',
    transit: 'tr', transitPrice: 'tp', poolTrips: 'pt2', poolHours: 'ph', poolKm: 'pkm', poolHourly: 'phr',
    poolPerKm: 'ppk', holidayWeeks: 'hw', weekPrice: 'wp', benefit: 'b', marginalTax: 'mt', grossDeduction: 'gd'
};
const LONG = Object.fromEntries(Object.entries(SHORT).map(([k, v]) => [v, k]));

export function encodeState(state) {
    const out = new URLSearchParams();
    for (const [k, short] of Object.entries(SHORT)) {
        const v = state[k], d = DEFAULTS[k];
        if (v === d || v === undefined) continue;
        if (v === null) out.set(short, '~');
        else if (typeof v === 'boolean') out.set(short, v ? '1' : '0');
        else out.set(short, String(v));
    }
    return out.toString();
}

export function decodeState(query) {
    const params = new URLSearchParams(query || '');
    const state = { ...DEFAULTS };
    for (const [short, raw] of params) {
        const k = LONG[short];
        if (!k) continue;
        const d = DEFAULTS[k];
        if (raw === '~') { state[k] = null; continue; }
        if (typeof d === 'boolean') state[k] = raw === '1';
        else if (typeof d === 'string') {
            const allowed = {
                preset: PRESETS.map(p => p.key).concat('custom'), powertrain: Object.keys(POWERTRAINS),
                group: Object.keys(RESIDUAL_GROUPS), scenario: Object.keys(SCENARIOS),
                loanType: Object.keys(LOANS), exit: Object.keys(EXITS)
            }[k];
            if (allowed && allowed.includes(raw)) state[k] = raw;
        } else {
            const n = Number(raw);
            if (Number.isFinite(n) && n >= 0 && n < 1e9) state[k] = n;
        }
    }
    return state;
}

/* ── Formatting (shared with the page) ─────────────────────────── */
const KR = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 });
export function fmtKr(n) {
    return KR.format(Math.round(n)) + ' kr';
}
export function fmtNum(n) {
    return KR.format(Math.round(n));
}
function roundTo9(n) {
    return Math.max(9, Math.round(n / 10) * 10 - 1);
}
