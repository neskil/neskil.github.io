# Leasa · Hyra · Köpa — the Swedish edition

`/bil/` asks the question `/car/` asks, for Sweden: what does it really cost a
month to have a car, by each way of getting one? Same idea, rebuilt rather than
translated, because almost every lever is different: no sales tax but a
three-year malus, no credit score but a UC check and a 20 % rule, a 30 %
interest deduction that now depends on whether the loan has security, a damage
warranty that halves insurance for three years, and two sets of tyres.

**Status: first draft** (October 2026). The numbers will be revised as better
ones arrive; every one of them lives in `js/data.js` so that is a one-file
change.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Markup, metadata and the reading panels (static prose). |
| `style.css` | Swedish theme on the house glass: night blue, flag blue and yellow, Falu red, road-sign headers, number plates. The chart colours (`--s1…--s7`, `--r-*`) are the dataviz reference palette's dark steps in their validated order; theme around them, do not recolour them. |
| `js/data.js` | **Every number**, each with its source or marked ≈ as an estimate. No logic. |
| `js/model.js` | The cost model: one cash-flow ledger, seven routes, the tax rules. No DOM. |
| `js/app.js` | The page: inputs generated from one schema, verdict, route tiles, stacked bars, two line charts, share links. |
| `tests.html` | Asserts the model; found by `tools/run-tests.mjs`. |

Verify with `node tools/run-tests.mjs bil` and `node tools/check-site.mjs`.

## How a route is priced

Every krona is booked on a ledger as *(amount, month, component, label)*.
Money spent in month *k* also costs the return it would have earned until the
end of the horizon *N*:

```
lost return = amount × ((1 + i)^(N − k) − 1),   i = (1 + altReturn)^(1/12) − 1
total       = Σ amounts + Σ lost return          (money back, the sale, is negative)
per month   = total / N          per mil = total / (mil × N / 12)
```

That puts paying cash, a down payment and a lease fee in month 30 on the same
footing. The components are the stacked bar's segments: value lost & payments,
interest & lost return, taxes & fees, insurance, service & tyres, energy,
parking & congestion.

| Route | What is booked |
| --- | --- |
| Kontantköp | Price at month 0, winter rims if new, running costs, sale at *N* (market value × channel factor − fee). |
| Billån | Down payment; secured loan with ränteavdrag per 12-month block; if down < 20 % on a dealer loan, the gap as a separate unsecured loan (no deduction); avi and setup fees; remaining balance cleared at the sale. |
| Privatleasing | Fee at the signed allowance for max(*N*, term) months (leaving early pays the term); setup per contract; övermil and expected wear at each return; running costs for a car that is always new (so always malus, always halvförsäkring); service only if not included. |
| Bilabonnemang | All-in price for max(*N*, minimum incl. notice); extra mil; energy and city costs. |
| Långtidshyra | Monthly price; extra mil; energy and city costs. Needs a credit card. |
| Utan bil | Transit pass, car-sharing trips (hours × rate + km × rate), holiday hire. Covers its own, smaller, mileage. |
| Förmånsbil | Tax on the benefit value at your marginal rate, any bruttolöneavdrag after tax, your own energy. Off unless offered. |

The headline is the cheapest *open* route that gives you a car. Going without is
shown beside it, not as the answer, because it is a different life rather than
a different way to pay.

## Formulas

**Fordonsskatt** (cars first registered from 1 June 2022), per year:

```
years 1–3:  360 + 107 × clamp(CO2 − 75, 0, 50) + 132 × max(0, CO2 − 125)
year 4 on:  360 + 22 × max(0, CO2 − 111)
diesel:     + 13.52 × CO2 + 250              (every year)
electric:   360
always:     + 74 vägtrafikregisteravgift (2026)
```

Check: a 160 g diesel (Tiguan TDI) pays 12 743 kr in the malus years and 3 851
after (plus the 74 kr fee). The deep-research source's table gave 12 583 / 3 891
and the source itself flagged its 3 491; the formula is what the page uses.

**Ränteavdrag** on a year's interest on a loan *with security*:
`0.30 × min(I, 100 000) + 0.21 × max(0, I − 100 000)`. Unsecured loans: 0 from 2026.

**Förmånsvärde** (2026):

```
FV = 0.29 × 59 200 + P × (0.70 × 2.55 % + 1 %) + P × 13 % + fordonsskatt
P  = nybilspris − min(reduction, nybilspris / 2);  reduction: el 350 000, laddhybrid 140 000
monthly cost = FV × marginal tax / 12 + bruttolöneavdrag × (1 − marginal tax)
```

Skatteverket's own check (322 000 kr, 4 050 kr tax → 72 045 kr) is a test.

**Resale.** Share of new price left at 1, 3 and 5 years per brand group,
interpolated geometrically, slowing to 70 % of the year-3-to-5 pace after year
five. An EV from a combustion brand loses 12 % more; scenario scales the loss;
each 1 000 mil above 1 250 a year takes 2 % off.

## US → Sweden: the parameter map

| US page | Swedish page | Default |
| --- | --- | --- |
| USD, miles, mpg | SEK (kr), mil (10 km), l/mil and kWh/mil | — |
| Miles a year (12 000) | Mil a year | 1 250 (Trafikanalys: 1 243 in 2025) |
| State sales / title tax | None beyond 25 % moms in the price; fordonsskatt with malus | 360 kr + malus |
| Trade-in tax credit | None. A trade-in is just a sale | — |
| Registration | Vägtrafikregisteravgift | 74 kr/yr |
| FICO score, credit tiers | UC check: payment remark (betalningsanmärkning) and steady income as gates | clean, employed |
| APR | Effektiv ränta | 6.5 % billån, 9.5 % privatlån, 3.0 % bolån |
| Down payment (optional) | Kontantinsats, 20 % by law on dealer credit (konsumentkreditlagen 26 §); gap lent unsecured | 20 % |
| Interest (not deductible) | Ränteavdrag 30 %/21 %, secured loans only from 2026 | — |
| Lease money factor, residual | Privatleasing quote at 1 000 mil, +300 kr per 500 mil | EX30: 3 690 kr |
| Excess mileage | Övermil | 12 kr/mil (Volvo) |
| Lease disposition / wear | Onormalt slitage at return | 4 500 kr ≈ |
| Sixt+, Flexcar | Bilabonnemang (Kinto Flex, Care by Volvo) | ≈ 1.4 % of price/mo, min 9 months |
| Daily / monthly rental | Långtidshyra (Avis Minilease) | 7 495 kr small |
| — | Utan bil: SL pass, car sharing, summer hire | 1 060 kr pass |
| — | Förmånsbil / personalbil | 32 % marginal tax |
| Insurance (flat) | Halvförsäkring under the 3-year vagnskadegaranti, then helförsäkring | hel ≈ 3 000 + 1.2 % of value/yr |
| — | Winter wheels, two swaps a year, däckhotell | rims ≈ 7–15 k; swap 450 |
| State inspection | Besiktning at 36, +24, then every 14 months | 450 kr |
| Gas $/gal | Bensin 95 / diesel kr/l | 22.50 / 25.80 (after 1 Dec 2026) |
| EV $/kWh | Home charging all-in, public charging, home share | 1.80 / 5.70 / 80 % |
| Tolls | Trängselskatt, parking | 0 (presets ≈ 700 / 1 200 kr) |
| CarMax / dealer / private sale | Blocket/Wayke, KVD, direct buyer, inbyte | trade-in (0.84 of private) |
| Opportunity cost | Sparkonto / index fund return | 2.0 % |

**Terminology on the page:** APR → effektiv ränta; down payment → kontantinsats;
trade-in → inbyte; FICO → UC / betalningsanmärkning; lease → privatleasing;
subscription → bilabonnemang; long-term rental → långtidshyra; company car →
förmånsbil; salary sacrifice → bruttolöneavdrag; vehicle tax → fordonsskatt;
inspection → besiktning; congestion charge → trängselskatt; comprehensive /
partial cover → helförsäkring / halvförsäkring.

## Sourced, and estimated

Sourced (October 2026): malus and vehicle tax rules; register fee; ränteavdrag
2026; förmånsvärde 2026 and its EV reduction; elbilspremie; pump prices and the
1 December tax change; home and Ionity charging prices; Trafikanalys mileage;
Riksbanken's 1.75 %; leasing offers for the EX30, XC40 and EX40; Volvo's 12 kr
övermil; Kinto Flex and Avis Minilease prices; car-sharing rates; besiktning
interval and price range; winter-tyre dates; insurance averages; the 20 % rule's
scope; maskinskadeskydd limits.

Estimated (marked ≈ in `data.js`): the resale curves (midpoints of conflicting
ranges), the EV loss multiplier, the mileage effect on value, selling-channel
factors, the insurance slope and multipliers, service by age, tyre and rim
prices, expected wear at lease return, the subscription's share of price and
its mileage terms, mid/large rental prices, congestion presets, home charging
by elområde.

Where two research summaries disagreed, the page keeps the more recent or more
primary figure and notes it: fuel (19.40 kr today, not 17.65), the register
fee (74 kr, not 65), mileage (1 250, not 1 500 mil), and inspection (every 14
months after the second, not yearly).

## Open

- Replace the estimates above with better numbers as they come in.
- Price a lease on *your* car (residual + rate) beside the quote you were given.
- Elbilspremie as an option on the routes it applies to.
- A per-model depreciation table rather than brand groups.
- Restvärdeslån (balloon) as its own loan shape.
- Shared mortgage-interest cap for the 100 000 kr ränteavdrag limit.
