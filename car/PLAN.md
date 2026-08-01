# Lease · Rent · Buy — what is left to do

Running list of work identified during the July 2026 review pass but not
finished in it. Ordered by how much each one would change an answer the page
currently gives.

## Done in that pass

- Split the 5,449-line `index.html` into `style.css` and nine plain scripts.
- Fixed the break-even chart, which dropped the dealer haircut, the mileage
  penalty and the scenario multiplier and so drew buying ~$80/mo cheaper than
  the bars said at the same month. Advertised crossover was out by 14 months.
- Made optimistic/pessimistic actually move resale, including when the resale
  field has been typed into; widened the band to post-COVID reality.
- Added fuel; rebased brand maintenance onto Edmunds TCO; gave body style a
  depreciation effect; fixed Georgia registration and the super-prime used APR.
- Answer-first ordering with separate narrow and wide layouts; folded the
  reference tail into collapsible panels.
- Restyled from glassmorphism to flat surfaces and a clay accent.

## Follow-up pass (August 2026)

- Bars carry direct labels, a shared scale and a caption; labels are per
  route and drop out when they will not fit.
- Every route names the vehicle it prices, and a callout says the four are
  not the same car.
- Every folded panel carries a standfirst; the three long explainers in the
  inputs panel fold too.
- Removed the nested scrollbar on the results column.

Still open from that: the page says the lease and subscription are different
cars but cannot say *how* different in money. Backing an implied vehicle price
out of a lease payment needs the residual and the money factor, which the page
does not ask for; the industry "1% of MSRP" rule of thumb is not reliable
enough to use — the $873 IAS quote is a ~$32k Tiguan, which that rule would
price at $87k. Asking for residual and money factor and computing a lease on
*your* car, alongside the quote you were given, would close it properly.

## Second follow-up (August 2026)

- Six routes instead of four: Sixt+ and Flexcar are separate lines, because
  they are different products with different caps and different credit gates,
  and daily rental is in as the anchor everything else is measured against.
- Routes your credit file or bank balance rules out are drawn dimmed, struck
  through, labelled with the reason, and taken out of the running for
  "cheapest" — the verdict now names the cheapest route *you can actually get*
  and says what the closed door costs you.
- Leases can be extended rather than re-signed, which is worth $460/mo on the
  IAS deal at five years.
- Lease excess wear priced, scenario-scaled.
- A live decision flowchart panel: four gates before the money, with your own
  branch lit.
- Fixed the section index not sticking on mobile (`body { overflow-x: hidden }`
  was making the body a scroll container, which kills `position: sticky` for
  everything inside it) and a sticky wrapper the exact height of its content.

## Answers found (August 2026 research pass)

Four of the open questions had published answers. Two did not, and saying so
is the point of writing them down.

**Daily rental was overstated by two to three times — fixed.** Long hires trip
into a different price list at about 28 consecutive days. Hertz's published
contract rates are $796/mo for a compact sedan, $841 for an intermediate, $908
for a full-size, $1,509 for a mid-size SUV and $2,116 for a full-size SUV,
against an average retail rate of $78/day or $543/week. That is $26–70 a day
against $78 — the monthly rate is roughly a third of the daily one. The route
is now charged at a monthly rate; the daily rate stays as an input because it
is what says "and this is why you would not do it for a year". Note the
contract figures are government procurement rates and so a floor, not a retail
quote.

**Flexcar's terms — corrected.** Mileage plans are Standard 850 mi/mo, Cruiser
1,200, Road Warrior 2,000, and Low Gear variable in 200-mile increments; the
page had an invented 1,250 and now uses 1,200. There is $0 down but a **$249
annual membership** covering maintenance and roadside, with a two-week free
trial — the page had $0 and now bills it yearly. Flexcar does check credit but
publishes no minimum score, so the 650 figure the page quotes remains
third-party (ValuePenguin) rather than official, and is flagged as such.

**Lease minimum terms — my own note was wrong.** I had written "most captive
leases start at 24 months" and planned to enforce it. In fact 36 months is the
standard, 24 and 39 are common, 12-month leases are readily available and
6-month ones exist but are rare. Short terms cost 20–30% more per month because
the drive-off and the steep first year spread over fewer payments — which is
exactly the IAS quote's shape. So: no gate, and the existing lease note already
makes the point. Item dropped rather than built.

**Body-style retention — the data does not exist, so the invented numbers are
gone.** iSeeCars publishes only EVs (57.2%), trucks (34.2%), hybrids (35.4%)
and the 41.8% average across 950,000+ five-year-old cars; there is no sedan
versus SUV split. The placeholder 0.97/1.02/0.98 multipliers are now exactly
1.00, and only the sourced pickup figure moves the curve.

**Insurance decay with vehicle age — no usable public answer.** The sources
agree premiums fall "slowly" as a car ages while its value falls fast — the
useful framing being that full coverage on a 10-year-old car can reach 46% of
what the car is worth — but nobody publishes a percentage-per-year curve. This
would need actuarial tables rather than a search. Item stays open and
unquantified rather than being filled with a guess.

**Subscription optionality is still not priced.** Nothing found, because it is
not a published figure — it is an option-value question. The 30-day exit is
worth real money against a lease you cannot leave, and the page still only says
so in prose.

## Real contracts, August 2026

Both subscriptions are now modelled from actual documents rather than a
remembered headline, and both turned out to be structured differently from how
they are advertised.

**Sixt+, from a live contract.** "About $1,000" is five charges: $804.56
subscription, $144.35 loss damage waiver, $67.13 second driver, $22.37 extended
roadside, $6.00 vehicle licence fee — **$1,044.41/mo, tax included**. Two
corrections to what the page used to say: the second driver is *not* free, and
the exit is not 30 days from day one — that contract carried a **two-month
minimum term**. The waiver sits on a **$1,000 financial responsibility**, so it
is an excess, not cover. Waiver plus driver comes to $211.48/mo, within two
dollars of what the owning routes pay for insurance.

**Sixt+ quotes the same product on two different bases.** A live contract
prints "Tax included"; the booking flow for a new car prints "Tax not
included". So the X1's $804.56 and the X3's $819.00 cannot be read side by
side, and doing so makes the bigger car look $14 dearer when it is not. The
additional-driver line appears in both — $67.13 with tax, $59.99 without —
which implies about **11.9%**. On that basis the X3 is roughly **$1,206/mo**
against the X1's $1,044: about **$160 more**, not fourteen. Both chips now
carry their own tax basis so the bars compare properly.

The X3's full breakdown, tax not included: $819.00 subscription, $198.99 Smart
Protection, $59.99 additional driver = **$1,077.98/mo**, plus a **$199
enrollment fee**. Note the protection product differs from the X1's LDW, so
the two are not the same cover either.

**Even so, prices barely track the cars.** A RAV4 — much the cheapest of the
three — costs more than the X1. Price the model, never the class, and always
ask what the size up costs.

**Flexcar, from a checkout that itemises everything.** A Hyundai Tucson:
Standard plan $424.00 (850 mi/mo included) + Essential Protection $245.00 +
**$40.14 tax** = $709.14/mo, falling to $654.00 after six months on OnTrack.
That settles two figures the page had been estimating: tax is **exactly 6.0%**
of the charges, and OnTrack's cut works out at **$52.02 on the car line** —
about 12% — once you work back through the tax, not the $55 the totals appear
to differ by. The mileage tier is priced, not fixed: Standard 850, Cruiser
1,200, Road Warrior 2,000, Low Gear variable in 200-mile increments.

**Flexcar, from live listings.** Real totals are **$749–754/mo plus tax**, far
below the $850 the page had guessed. Structure: a car line plus a *mandatory*
protection plan — Essential $245/mo with a $2,000 deductible, or Enhanced
$295/mo with $500 and glass — because personal and credit-card cover explicitly
do not extend to a Flexcar. Basic liability is state minimum only. Plus $249/yr
membership (servicing, tyres, brakes, roadside, 20¢/gal at Sunoco; free for two
weeks) and a delivery fee that ranges from **$199 to $874** depending on where
the car is. **OnTrack** cuts the rate after six months of on-time payment and
safe driving — $734 → $684 in their own example — and follows you across cars.

**The comparison trap that motivated the tax field:** Sixt+ quotes with tax in,
Flexcar quotes without. Reading the two headlines side by side flatters Flexcar
by whatever the local rate is.

## Still open

- **Subscriptions are not modelled as pausable.** The 30-day-after-minimum exit
  is real value and nothing on the page prices optionality.
- **The 650 Flexcar threshold is third-party** (ValuePenguin); Flexcar checks
  credit but publishes no minimum.
- **Rental monthly rates are government contract rates** — a floor, not a
  retail Atlanta quote.
- **Sixt+ minimum term is a price lever the page does not model.** One month
  against two changed both the rate and the entry fee in the two real quotes;
  the page takes them as given rather than letting you trade term for rate.
- **Flexcar's mileage tiers are not selectable.** Standard 850 / Cruiser 1,200 /
  Road Warrior 2,000 each carry their own price, and the page has one number.

## 1. Electric and hybrid powertrains — the biggest remaining gap

Nothing on the page computes an EV or a hybrid, and both are now the extremes
of the depreciation distribution. iSeeCars 2026 has EVs losing **57.2%** over
five years against a 41.8% average, and hybrids losing only **35.4%** — better
than everything except pickups. The "Premium & EV" strategy card discusses EVs
in prose while the calculator behind it cannot model one.

Touches more than the curve:

- **Fuel** becomes kWh and a home/public rate split, not gallons and mpg. The
  input pair added in this pass assumes a combustion engine.
- **Georgia charges an EV registration surcharge** — about **$235/yr** for
  non-commercial battery-electric vehicles (sources give $234.97 and $238.59
  for the 2026-27 year; it is indexed annually), against $20 for a petrol tag.
  A plug-in hybrid with an alternative-fuel plate pays $20 registration plus a
  $35 special tag fee and a one-time $25 manufacturing fee. Real money the fees
  component should carry.
- **Insurance** runs higher: $3,159/yr full coverage on an EV against $2,218
  on a petrol car, so **+42%** across all model years, narrowing to **+18%** on
  2024-and-newer cars as repair networks catch up. Use something between.
- **Maintenance** runs lower — no oil, no exhaust, far less brake wear.
  Consumer Reports puts EV maintenance and repair at about **half** a petrol
  car's; the Department of Energy says 40% less; roughly $7,000 saved over ten
  years.
- Lease economics differ sharply because manufacturers subsidise EV residuals,
  which is exactly the case the pros-and-cons card already calls out.

Probably a `powertrain` chip row (petrol / hybrid / EV) alongside marque, shape
and age, feeding all five of the above.

## 2. Put maintenance on an age-banded cents-per-mile basis

Currently a brand ten-year total divided by 120 and scaled by an age curve and
a mileage factor. It was rebased in this pass so all four brands land on
Edmunds' TCO, but the structure still hides the disagreement between sources:

- YourMechanic's brand figures are repair labour through their own network, no
  tires, no scheduled service.
- AAA's 11.04 ¢/mile includes tires, full retail servicing **and** a
  comprehensive extended warranty — which this page should not carry, because
  it prices catastrophic repair risk separately in the pessimistic case.
- Edmunds and KBB each draw the line somewhere in between.

A cents-per-mile figure banded by age, with the warranty component named and
excluded explicitly, would be honest about which of those is being used and
would stop the ten-year total from implying a precision it does not have.

## 3. Retention by body style is half-sourced

`BODY_TYPES.depMult` reproduces the iSeeCars pickup figure exactly (65.9%
modelled against 65.8% published). Sedans, compact cars and three-row SUVs sit
at or near 1.00 because that study does not break them out — they are
placeholders, not measurements. Either find segment retention (Black Book or
Cox publish it) or collapse those four to exactly 1.00 and say so, rather than
carrying invented 0.97/1.02/0.98 values.

## 4. Insurance does not fall as the car ages

`AGE_BANDS[].insMult` is applied once, when the profile is set from the age you
bought at. Over a ten-year hold the premium then stays flat, when in reality
comprehensive and collision fall with the payout — which is the mechanism the
page's own insurance callout describes at length. Should decay across the
horizon the way maintenance climbs across it.

## 5. Date-stamp the quotes, and the market itself

- The Sixt+ ($1,000 / 500 mi), Flexcar ($850) and IAS Tiguan ($873) figures are
  real point-in-time quotes with no date attached. They will rot silently.
- The depreciation curves are fitted to a single 2026 snapshot of a market that
  has moved every year since 2020 — 45.6% five-year depreciation in the 2025
  study, 41.8% in the 2026 one. A page that models a ten-year hold should
  either say the curve is a snapshot or let the user shift the whole market up
  and down, which is arguably what the scenario toggle should have been doing
  all along.

## 6. Regenerate the Open Graph image

`assets/og/car.png` shows the old glassmorphism styling and a "$555 per month"
headline that no longer matches anything. `og:image:alt` in `index.html`
repeats that stale number in text. Both need redoing after the restyle.

## 7. A committed test harness

The break-even fix was verified with a throwaway Playwright script asserting
that all four routes agree between the bars and the curve across horizons,
scenarios, disposal channels, mileages and a typed resale override. That check
is worth keeping — `supply-chain/tests.html` is the repo's existing pattern for
a page that self-tests over `file://`, and this page's model is now in its own
module and directly exercisable.

## 8. All-pairs colourblind separation

Pre-existing and inherited: the categorical series pass adjacent-pair CVD
separation but fail `--pairs all` (worst pair ΔE 1.6 deutan). Mitigated the way
the skill allows — legend always present, per-segment tooltips, a numbers table
and now a 2px surface gap between fills — but a texture fill or a faceted view
would settle it properly.

## 9. Smaller things

- The folded reference tail is eight panels deep with only two entries in the
  jump index; it could use its own contents list.
- `mileagePenalty` clamps at 0.60/1.10 with no comment on where those bounds
  came from.
- `LEASE_MAINTENANCE_SHARE = 0.45` is a single flat number for "you buy tires
  and oil but not a transmission" — plausible, unsourced.
- The walkthrough recap does not show the new fuel inputs.
- `BODY_TYPES.truck.notFor: ['germanLux']` is honoured by the walkthrough's
  choice list but not by the body chip row on the page, so you can still select
  German luxury + pickup there and get a price for a car nobody sells.
