/* ── Words ───────────────────────────────────────────────────────────
   Every sentence the page builds, in English and Swedish. Plain strings
   for fixed text, functions for sentences with numbers in them, so word
   order can differ between the languages. Field labels and help live
   beside their fields in app.js as { en, sv } pairs; the long reading
   panels are written out twice in index.html. No DOM here. */

import { fmtKr, fmtNum } from './model.js';

export const LANGS = ['sv', 'en'];

/* Ledger labels are the model's stable keys; these are what a reader sees. */
export const LEDGER = {
    en: {
        'purchase price': 'purchase price',
        'winter rims': 'winter wheels',
        'winter rims sold': 'winter wheels sold on',
        'sale': 'sold at the end',
        'selling costs': 'selling costs',
        'fordonsskatt': 'vehicle tax (fordonsskatt)',
        'besiktning': 'inspection (besiktning)',
        'halvförsäkring (under vagnskadegaranti)': 'half cover under the damage warranty',
        'helförsäkring': 'full cover (helförsäkring)',
        'service & repairs': 'service & repairs',
        'tyres & swaps': 'tyres & swaps',
        'fuel': 'fuel',
        'charging': 'charging',
        'fuel or charging': 'fuel or charging',
        'parking & congestion': 'parking & congestion',
        'kontantinsats': 'down payment (kontantinsats)',
        'uppläggningsavgift': 'arrangement fee',
        'interest after ränteavdrag': 'interest after the 30 % deduction',
        'interest': 'interest',
        'repayments': 'repayments',
        'aviavgift': 'invoice fees',
        'interest on the unsecured top-up': 'interest on the unsecured top-up',
        'top-up repayments': 'top-up repayments',
        'loan paid off at sale': 'loan cleared at the sale',
        'leasing fee': 'leasing fee',
        'övermil': 'excess mileage (övermil)',
        'wear charged at return': 'wear charged at return',
        'subscription (insurance, tax, service, tyres)': 'subscription (insurance, tax, service, tyres)',
        'extra mil': 'extra mil',
        'rental (insurance, tax, service, tyres)': 'rental (insurance, tax, service, tyres)',
        'monthly transit pass': 'monthly transit pass',
        'car-sharing trips (fuel included)': 'car-sharing trips (fuel included)',
        'holiday car hire': 'holiday car hire',
        'tax on the benefit value': 'tax on the benefit value',
        'gross salary deduction, after tax': 'gross salary deduction, after tax',
        'fuel or charging you pay': 'fuel or charging you pay',
        'return the money stops earning': 'return the money stops earning'
    },
    sv: {
        'purchase price': 'köpesumma',
        'winter rims': 'vinterhjul',
        'winter rims sold': 'vinterhjul sålda vidare',
        'sale': 'försäljning vid slutet',
        'selling costs': 'försäljningskostnad',
        'fordonsskatt': 'fordonsskatt',
        'besiktning': 'besiktning',
        'halvförsäkring (under vagnskadegaranti)': 'halvförsäkring under vagnskadegarantin',
        'helförsäkring': 'helförsäkring',
        'service & repairs': 'service & reparationer',
        'tyres & swaps': 'däck & hjulskiften',
        'fuel': 'drivmedel',
        'charging': 'laddning',
        'fuel or charging': 'drivmedel eller laddning',
        'parking & congestion': 'parkering & trängselskatt',
        'kontantinsats': 'kontantinsats',
        'uppläggningsavgift': 'uppläggningsavgift',
        'interest after ränteavdrag': 'ränta efter ränteavdrag',
        'interest': 'ränta',
        'repayments': 'amorteringar',
        'aviavgift': 'aviavgifter',
        'interest on the unsecured top-up': 'ränta på blancodelen',
        'top-up repayments': 'amortering på blancodelen',
        'loan paid off at sale': 'lånet löses vid försäljningen',
        'leasing fee': 'leasingavgift',
        'övermil': 'övermil',
        'wear charged at return': 'slitage vid återlämning',
        'subscription (insurance, tax, service, tyres)': 'abonnemang (försäkring, skatt, service, däck)',
        'extra mil': 'extra mil',
        'rental (insurance, tax, service, tyres)': 'hyra (försäkring, skatt, service, däck)',
        'monthly transit pass': 'månadskort',
        'car-sharing trips (fuel included)': 'bilpoolsresor (drivmedel ingår)',
        'holiday car hire': 'hyrbil på semestern',
        'tax on the benefit value': 'skatt på förmånsvärdet',
        'gross salary deduction, after tax': 'bruttolöneavdrag efter skatt',
        'fuel or charging you pay': 'drivmedel eller laddning du betalar',
        'return the money stops earning': 'avkastning pengarna går miste om'
    }
};

export const TEXT = {
    en: {
        home: 'Home',
        usEdition: '🇺🇸 US edition',
        usEditionTitle: 'The same question, for the US market',
        scenario: 'Outlook',
        share: '🔗 Share this scenario',
        guide: '🧭 Walk me through it',
        linkCopied: 'Link copied',
        copyThis: 'Copy this link',
        startFrom: 'Start from',
        autoTitle: 'Left empty, this is estimated. Type to use your own figure.',
        krmo: 'kr/mo',
        krman: 'kr/mån',
        months: (n) => `${n} months${n % 12 === 0 ? ` (${n / 12} yr)` : ''}`,
        milKm: (m) => `${fmtNum(m)} mil · ${fmtNum(m * 10)} km`,

        verdictNone: (nocar) => `Every way to a car is shut by your answers under "Money & credit". Going without costs ${fmtKr(nocar)} a month.`,
        verdictNoneHead: 'No route is open',
        kicker: (n, mil) => `Cheapest way to have a car · ${n} months · ${fmtNum(mil)} mil a year`,
        perMilLine: (perMil, total, n) => `<strong>${fmtNum(perMil)} kr per mil</strong> and ${fmtKr(total)} over ${n} months, everything included.`,
        nextBest: (name, diff) => `Next best: <strong>${name}</strong> at ${fmtKr(diff)} a month more.`,
        closedCheaper: (name, diff, reason) => `<strong>${name}</strong> would be ${fmtKr(diff)} a month cheaper, but ${reason}.`,
        noCarLine: (cost, mil, yours) => `Going without a car: ${fmtKr(cost)} a month, covering about ${fmtNum(mil)} mil a year by car sharing and holiday hire against your ${fmtNum(yours)}.`,
        newCarNote: (name, age) => `Note that ${name} prices a <em>new</em> car; cash and loan price the ${age}-year-old one.`,

        badgeBest: 'Cheapest',
        badgeClosed: 'Closed',
        noteCash: (n, exit) => `Sold after ${n} months: ${exit}`,
        noteLoan: (pay, term, rate, gap) => `${fmtKr(pay)}/mo for ${term} months at ${rate} %${gap ? ', part unsecured' : ''}`,
        noteLease: (m, mil, billed) => `${fmtKr(m)}/mo, ${fmtNum(mil)} mil/yr${billed ? `, ${billed}-month term billed in full` : ''}`,
        noteSub: (m, min) => `${fmtKr(m)}/mo all-in${min ? `, ${min} months minimum` : ''}`,
        noteRental: (m, mil) => `${fmtKr(m)}/mo, ${fmtNum(mil)} mil/mo included`,
        noteNoCar: (mil) => `Covers ≈ ${fmtNum(mil)} mil a year`,
        noteBenefit: (fv) => `Benefit value ${fmtKr(fv)}/yr`,

        gate: {
            savings: (v) => `Needs ${fmtKr(v.need)} in savings`,
            loanRemark: 'A payment remark closes almost every lender',
            loanIncome: 'Lenders want a steady income',
            loanHome: 'A mortgage top-up needs a home with room in the loan',
            loanDown: (v) => `The ${v.pct} % down payment needs ${fmtKr(v.need)}`,
            leaseRemark: 'Leasing needs a clean credit report (UC)',
            leaseIncome: 'Lessors want a steady income',
            subRemark: 'Subscriptions run a credit check',
            rentalCard: 'Rental desks want a credit card',
            benefitOff: 'Only if your employer offers one'
        },

        breakdownSub: (n) => `Kronor a month, averaged over ${n} months. Hover or tap a block for what is in it.`,
        breakdownCaption: (mil, ret) => `Every route pays for the same driving (${fmtNum(mil)} mil a year) except <em>Utan bil</em>, which drives what car sharing and a summer hire cover. "Value lost & payments" is what the car itself costs you: the drop in value for an owner, the fee for everyone else. Interest includes the return your money would have earned at ${ret} %.`,
        thRoute: 'Route', thMonth: 'Per month', thMil: 'Per mil', closedTag: ' (closed)',
        yr: (v) => `${v / 12} yr`, monthsLong: (v) => `${v} months`, milLong: (v) => `${fmtNum(v)} mil a year`,
        you: 'you',
        ariaHorizon: 'Monthly cost of each route against how long you keep the car',
        ariaMil: 'Monthly cost of each route against mil driven a year',

        gates: [
            '<b>Less than a year?</b> Then it is a subscription or a monthly rental: a lease bills its whole term, and buying and selling within a year loses the first year\'s drop and a dealer margin both ways.',
            '<b>A payment remark, or no steady income?</b> Lenders and lessors run a UC check and want an income. Cash, a monthly rental on a card, or going without are what stay open.',
            (short) => `<b>Savings short of the price?</b> Then it is a loan, a lease or a subscription.${short ? ` You are ${fmtKr(short)} short of buying outright.` : ''}`,
            '<b>Driving more than 2 000 mil a year?</b> Owning usually wins: a lease prices every extra mil and a subscription caps them, while an owner only loses a little resale.'
        ],
        gateFinal: (name, cost) => `<b>Then the money decides.</b> ${name ? `For you that is <b>${name}</b> at ${fmtKr(cost)} a month.` : 'Nothing is open; see the routes above.'}`
    },

    sv: {
        home: 'Hem',
        usEdition: '🇺🇸 USA-versionen',
        usEditionTitle: 'Samma fråga för den amerikanska marknaden (på engelska)',
        scenario: 'Scenario',
        share: '🔗 Dela scenariot',
        guide: '🧭 Guida mig',
        linkCopied: 'Länken är kopierad',
        copyThis: 'Kopiera länken',
        startFrom: 'Utgå från',
        autoTitle: 'Lämnas fältet tomt uppskattas värdet. Skriv in din egen siffra för att använda den.',
        krmo: 'kr/mån',
        krman: 'kr/mån',
        months: (n) => `${n} månader${n % 12 === 0 ? ` (${n / 12} år)` : ''}`,
        milKm: (m) => `${fmtNum(m)} mil · ${fmtNum(m * 10)} km`,

        verdictNone: (nocar) => `Dina svar under "Pengar & kredit" stänger alla vägar till en bil. Att klara sig utan kostar ${fmtKr(nocar)} i månaden.`,
        verdictNoneHead: 'Ingen väg är öppen',
        kicker: (n, mil) => `Billigaste sättet att ha bil · ${n} månader · ${fmtNum(mil)} mil per år`,
        perMilLine: (perMil, total, n) => `<strong>${fmtNum(perMil)} kr per mil</strong> och ${fmtKr(total)} på ${n} månader, allt inräknat.`,
        nextBest: (name, diff) => `Näst bäst: <strong>${name}</strong>, ${fmtKr(diff)} mer i månaden.`,
        closedCheaper: (name, diff, reason) => `<strong>${name}</strong> hade varit ${fmtKr(diff)} billigare i månaden, men ${reason}.`,
        noCarLine: (cost, mil, yours) => `Utan bil: ${fmtKr(cost)} i månaden, som täcker ungefär ${fmtNum(mil)} mil per år med bilpool och hyrbil på semestern, mot dina ${fmtNum(yours)}.`,
        newCarNote: (name, age) => `Observera att ${name} räknar på en <em>ny</em> bil; kontant och billån räknar på den ${age} år gamla.`,

        badgeBest: 'Billigast',
        badgeClosed: 'Stängd',
        noteCash: (n, exit) => `Säljs efter ${n} månader: ${exit}`,
        noteLoan: (pay, term, rate, gap) => `${fmtKr(pay)}/mån i ${term} månader à ${rate} %${gap ? ', delvis blanco' : ''}`,
        noteLease: (m, mil, billed) => `${fmtKr(m)}/mån, ${fmtNum(mil)} mil/år${billed ? `, hela ${billed} månader betalas` : ''}`,
        noteSub: (m, min) => `${fmtKr(m)}/mån allt inräknat${min ? `, minst ${min} månader` : ''}`,
        noteRental: (m, mil) => `${fmtKr(m)}/mån, ${fmtNum(mil)} mil/mån ingår`,
        noteNoCar: (mil) => `Täcker ≈ ${fmtNum(mil)} mil per år`,
        noteBenefit: (fv) => `Förmånsvärde ${fmtKr(fv)}/år`,

        gate: {
            savings: (v) => `Kräver ${fmtKr(v.need)} i sparpengar`,
            loanRemark: 'En betalningsanmärkning stänger nästan alla långivare',
            loanIncome: 'Långivare vill se en fast inkomst',
            loanHome: 'Ett utökat bolån kräver en bostad med utrymme i lånet',
            loanDown: (v) => `Kontantinsatsen på ${v.pct} % kräver ${fmtKr(v.need)}`,
            leaseRemark: 'Leasing kräver en ren kreditupplysning (UC)',
            leaseIncome: 'Leasingbolag vill se en fast inkomst',
            subRemark: 'Abonnemang kräver kreditprövning',
            rentalCard: 'Biluthyrare vill ha ett kreditkort',
            benefitOff: 'Bara om arbetsgivaren erbjuder det'
        },

        breakdownSub: (n) => `Kronor per månad, i snitt över ${n} månader. Håll över eller tryck på ett block för att se vad det innehåller.`,
        breakdownCaption: (mil, ret) => `Alla vägar betalar för samma körning (${fmtNum(mil)} mil per år) utom <em>Utan bil</em>, som kör det bilpool och en hyrbil på sommaren räcker till. "Värdeminskning & avgifter" är vad själva bilen kostar dig: värdetappet för den som äger, avgiften för alla andra. Räntan inkluderar avkastningen pengarna annars hade gett, ${ret} %.`,
        thRoute: 'Väg', thMonth: 'Per månad', thMil: 'Per mil', closedTag: ' (stängd)',
        yr: (v) => `${v / 12} år`, monthsLong: (v) => `${v} månader`, milLong: (v) => `${fmtNum(v)} mil per år`,
        you: 'du',
        ariaHorizon: 'Månadskostnad per väg mot hur länge du behåller bilen',
        ariaMil: 'Månadskostnad per väg mot antal mil per år',

        gates: [
            '<b>Kortare än ett år?</b> Då blir det abonnemang eller långtidshyra: leasing betalas för hela avtalstiden, och den som köper och säljer inom ett år tar både första årets värdetapp och handlarens marginal åt båda hållen.',
            '<b>Betalningsanmärkning eller ingen fast inkomst?</b> Långivare och leasingbolag tar en UC och vill se en inkomst. Kvar finns kontant, långtidshyra med kort, eller att klara sig utan bil.',
            (short) => `<b>Räcker inte sparpengarna?</b> Då blir det billån, leasing eller abonnemang.${short ? ` Du saknar ${fmtKr(short)} för att köpa kontant.` : ''}`,
            '<b>Kör du mer än 2 000 mil per år?</b> Då brukar det löna sig att äga: leasing tar betalt för varje extra mil och abonnemang har ett tak, medan en ägare bara förlorar lite i andrahandsvärde.'
        ],
        gateFinal: (name, cost) => `<b>Sen avgör pengarna.</b> ${name ? `För dig blir det <b>${name}</b> för ${fmtKr(cost)} i månaden.` : 'Ingen väg är öppen; se ovan.'}`
    }
};

/* Short descriptions under each route's Swedish name. */
export const ROUTE_SUB = {
    en: { cash: 'Buy with cash', loan: 'Car loan', lease: 'Private lease', sub: 'Car subscription', rental: 'Monthly rental', nocar: 'No car', benefit: 'Company car' },
    sv: { cash: 'Betala direkt', loan: 'Lån med bilen som säkerhet', lease: 'Fast avgift, ingen restvärdesrisk', sub: 'Allt ingår, kort uppsägning', rental: 'Hyrbil per månad', nocar: 'Kollektivt, bilpool, hyrbil', benefit: 'Bil via jobbet' }
};

/* t(key, ...args): a string, or the function's result. */
export function translator(lang) {
    const L = TEXT[lang] ? lang : 'en';
    const t = (key, ...args) => {
        const v = TEXT[L][key] !== undefined ? TEXT[L][key] : TEXT.en[key];
        return typeof v === 'function' ? v(...args) : v;
    };
    t.lang = L;
    t.gate = (gate) => {
        const g = TEXT[L].gate[gate.code];
        return g === undefined ? gate.reason : typeof g === 'function' ? g(gate.vars) : g;
    };
    t.ledger = (label) => LEDGER[L][label] || label;
    t.pick = (pair) => (pair && typeof pair === 'object' && !Array.isArray(pair)) ? (pair[L] !== undefined ? pair[L] : pair.en) : pair;
    return t;
}

/* The page's language: a link's ?lang= first, then what this browser chose
   last time, then the browser's own language. */
export function initialLang(search, stored, navLang) {
    const q = new URLSearchParams(search || '').get('lang');
    if (LANGS.includes(q)) return q;
    if (LANGS.includes(stored)) return stored;
    return /^sv\b/i.test(navLang || '') ? 'sv' : 'en';
}
