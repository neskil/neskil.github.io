// Fika Generator — the deck, the calendar and the dealing. No DOM.

/* ── The three suits ──
   Each card: a stable id (it goes in share links, so never renumber), the
   Swedish name, an English line, a rough pronunciation, and how to draw it
   (`art` names a shape in art.js, `colours` fills it). */
export const PASTRIES = [
    { id: 'kanelbulle', name: 'Kanelbulle', say: 'kah-NEHL-bull-eh', en: 'Cinnamon bun', line: 'Rolled or knotted, with cardamom in the dough and pearl sugar on top. 4 October is its day.', art: 'knot', colours: ['#c98a4b', '#7a4520', '#fff8ec'] },
    { id: 'kardemummabulle', name: 'Kardemummabulle', say: 'kar-deh-MUM-ah-bull-eh', en: 'Cardamom bun', line: 'The kanelbulle’s grown-up cousin: twisted, buttery and full of crushed cardamom.', art: 'knot', colours: ['#d9a35e', '#a8742f', '#f4ecd8'] },
    { id: 'semla', name: 'Semla', say: 'SEM-lah', en: 'Cream bun', line: 'A cardamom bun hollowed out, filled with almond paste and whipped cream, lid on and dusted with icing sugar.', art: 'semla', colours: ['#c98a4b', '#fffaf2', '#e9d3a8'] },
    { id: 'prinsesstarta', name: 'Prinsesstårta', say: 'prin-SESS-tor-tah', en: 'Princess cake', line: 'Sponge, raspberry jam, vanilla custard and a dome of cream under green marzipan, with a pink rose on top.', art: 'dome', colours: ['#9fd38a', '#f9a8c9', '#fff4e6'] },
    { id: 'chokladboll', name: 'Chokladboll', say: 'shok-LAHD-boll', en: 'Chocolate ball', line: 'Oats, cocoa, butter, sugar and a splash of coffee, rolled in coconut. No oven involved.', art: 'ball', colours: ['#4a2c1f', '#f5efe6', '#6b4030'] },
    { id: 'dammsugare', name: 'Dammsugare', say: 'DAMM-soo-gah-reh', en: '“Vacuum cleaner”', line: 'Punsch-flavoured filling wrapped in green marzipan, both ends dipped in chocolate.', art: 'roll', colours: ['#86c56b', '#3b2418', '#b9df9f'] },
    { id: 'kladdkaka', name: 'Kladdkaka', say: 'KLADD-kah-kah', en: 'Sticky chocolate cake', line: 'Chocolate cake taken out of the oven before it is done, on purpose. Whipped cream on the side.', art: 'slice', colours: ['#3a2117', '#5a3424', '#fff7ee'] },
    { id: 'mazarin', name: 'Mazarin', say: 'mah-sah-REEN', en: 'Almond tartlet', line: 'A shortcrust case filled with almond cake and finished with a thin sheet of white icing.', art: 'tart', colours: ['#d9a35e', '#f7f3ea', '#b07a3a'] },
    { id: 'hallongrotta', name: 'Hallongrotta', say: 'HALL-on-grot-tah', en: '“Raspberry cave”', line: 'A crumbly butter cookie with a pool of raspberry jam baked into the middle.', art: 'cookie', colours: ['#e8c48c', '#c2253f', '#f3ddb3'] },
    { id: 'drommar', name: 'Drömmar', say: 'DRUH-mar', en: '“Dreams”', line: 'Pale, airy cookies that crack across the top and melt the moment you bite.', art: 'cookie', colours: ['#f2e3c4', null, '#e3cfa6'] },
    { id: 'lussekatt', name: 'Lussekatt', say: 'LOO-seh-katt', en: 'Saffron bun', line: 'Saffron dough curled into an S with a raisin in each curl. Lucia, 13 December.', art: 'ess', colours: ['#f2b52e', '#3b1d17', '#ffd45e'] },
    { id: 'wienerbrod', name: 'Wienerbröd', say: 'VEE-ner-brerd', en: 'Danish pastry', line: 'Flaky layers folded round vanilla custard. In Denmark it is Viennese bread too.', art: 'danish', colours: ['#d99a4e', '#ffd97a', '#f4e1bd'] },
    { id: 'toscakaka', name: 'Toscakaka', say: 'TOS-kah-kah-kah', en: 'Tosca cake', line: 'Light sponge under a crackling lid of caramelised almonds.', art: 'slice', colours: ['#f1d39a', '#b9782f', '#e6b45c'] },
    { id: 'pepparkaka', name: 'Pepparkaka', say: 'PEP-par-kah-kah', en: 'Ginger biscuit', line: 'Thin and crisp. Press one in your palm: if it breaks in three, make a wish.', art: 'heart', colours: ['#9b5523', '#ffffff', '#7b4019'] },
    { id: 'vaffla', name: 'Våffla', say: 'VOFF-lah', en: 'Waffle', line: 'Heart-shaped, with jam and whipped cream. 25 March is Våffeldagen, by way of a pun.', art: 'waffle', colours: ['#e6b366', '#c2253f', '#fffaf2'] },
    { id: 'budapest', name: 'Budapestbakelse', say: 'BOO-dah-pest-bah-kel-seh', en: 'Budapest roll', line: 'Hazelnut meringue rolled round cream and mandarin, dusted with cocoa. Swedish, despite the name.', art: 'swirl', colours: ['#d8a86a', '#fff6e8', '#f59e0b'] },
    { id: 'morotskaka', name: 'Morotskaka', say: 'MOO-rots-kah-kah', en: 'Carrot cake', line: 'Spiced carrot cake under a thick layer of cream-cheese frosting.', art: 'slice', colours: ['#c87533', '#a85a22', '#fbf3e4'] },
    { id: 'appelkaka', name: 'Äppelkaka', say: 'EPP-el-kah-kah', en: 'Apple cake', line: 'Buttery cake baked with sliced apples and cinnamon. Vanilla sauce, warm, poured generously.', art: 'slice', colours: ['#e2b46a', '#c07c34', '#fce9b6'] },
    { id: 'biskvi', name: 'Chokladbiskvi', say: 'shok-LAHD-bisk-vee', en: 'Chocolate biscuit', line: 'An almond-meringue base, a mound of chocolate buttercream, the whole thing dipped in chocolate.', art: 'dome', colours: ['#3d2318', '#d7a960', '#5a3424'] },
    { id: 'rabarberpaj', name: 'Rabarberpaj', say: 'rah-BAR-ber-pie', en: 'Rhubarb crumble pie', line: 'The first rhubarb of the year under a crumble, with cold vanilla sauce. Early summer on a plate.', art: 'pie', colours: ['#e0aa5c', '#d6436b', '#f5e6c8'] },
];

export const DRINKS = [
    { id: 'bryggkaffe', name: 'Bryggkaffe', say: 'BRYGG-kaff-eh', en: 'Filter coffee', line: 'Strong, black, and refilled without asking. Sweden drinks more coffee per person than almost anywhere.', art: 'mug', colours: ['#2a1a12', '#e5e7eb', '#5b3a29'] },
    { id: 'kokkaffe', name: 'Kokkaffe', say: 'KOOK-kaff-eh', en: 'Boiled coffee', line: 'The cabin way: grounds straight in the pot, boil, let it settle, pour carefully.', art: 'mug', colours: ['#3a2418', '#2563eb', '#5b3a29'] },
    { id: 'cappuccino', name: 'Cappuccino', say: 'kah-poo-CHEE-no', en: 'Cappuccino', line: 'Fika has no rules about where the coffee came from, only that you stop for it.', art: 'cup', colours: ['#a8774f', '#f8fafc', '#f3e5d0'] },
    { id: 'te', name: 'Te', say: 'TEH', en: 'Black tea', line: 'A pot of black tea, a slice of lemon if you like, and nowhere to be for a while.', art: 'cup', colours: ['#9a4b1c', '#fde68a', '#f8fafc'] },
    { id: 'saft', name: 'Lingonsaft', say: 'LING-on-saft', en: 'Lingonberry cordial', line: 'Mixed from concentrate in a jug, the way it has been at every summer cottage forever.', art: 'glass', colours: ['#c2253f', '#fecdd3', null] },
    { id: 'choklad', name: 'Varm choklad', say: 'varm shok-LAHD', en: 'Hot chocolate', line: 'Made with milk, finished with a cloud of whipped cream that slowly sinks.', art: 'mug', colours: ['#5a3424', '#fca5a5', '#fffaf2'] },
    { id: 'glogg', name: 'Glögg', say: 'GLUGG', en: 'Mulled wine', line: 'Spiced and warm, with raisins and blanched almonds in the cup. December only, really.', art: 'small', colours: ['#7f1d1d', '#e5e7eb', '#d6b37a'] },
    { id: 'mjolk', name: 'Kall mjölk', say: 'kall MYULK', en: 'Cold milk', line: 'A tall cold glass of milk. Unbeatable with kladdkaka; the grown-ups’ secret.', art: 'glass', colours: ['#f8fafc', '#e2e8f0', null] },
    { id: 'iskaffe', name: 'Iskaffe', say: 'EES-kaff-eh', en: 'Iced coffee', line: 'For the two genuinely warm weeks of the Swedish summer. Drink it on the jetty.', art: 'glass', colours: ['#8b5e3c', '#e0f2fe', '#ffffff'] },
    { id: 'nyponsoppa', name: 'Nyponsoppa', say: 'NEE-pon-sop-pah', en: 'Rosehip soup', line: 'Warm rosehip soup drunk from a mug: what cross-country skiers fika on in the forest.', art: 'mug', colours: ['#c2410c', '#f97316', '#fef3c7'] },
    { id: 'julmust', name: 'Julmust', say: 'YOOL-must', en: 'Christmas soda', line: 'A dark, spiced soft drink that outsells cola in Sweden every December.', art: 'bottle', colours: ['#3f1d0e', '#b91c1c', '#facc15'] },
    { id: 'havrelatte', name: 'Havrelatte', say: 'HAV-reh-lat-teh', en: 'Oat latte', line: 'Swedish oat milk went out and conquered the world’s coffee bars. Here it is back home.', art: 'cup', colours: ['#c9a27c', '#f8fafc', '#efe3d0'] },
];

export const TOPICS = [
    'What small thing made you happy this week?',
    'If you had to live in one season forever, which, and why?',
    'What skill would you learn if it took no time at all?',
    'Which meal could you happily eat every day for a month?',
    'What is the best advice you have ever ignored?',
    'Where would you spend a week with no phone?',
    'What did you want to be when you were seven?',
    'What is the most useful thing you own?',
    'Describe your perfect Sunday, hour by hour.',
    'Which word from another language do you wish English had? (Lagom, mys and fika are taken.)',
    'Lagom means “just enough”. What in your life is exactly enough?',
    'What would you name a boat?',
    'Which fictional place would you move to?',
    'What was the last thing that made you laugh out loud?',
    'If animals could talk, which would be the rudest?',
    'Allemansrätten lets you camp almost anywhere in Sweden. Where would you pitch a tent tonight?',
    'What small tradition would you like to start?',
    'Which song do you play at full volume when you are alone in the car?',
    'Name one thing that is overrated and one that is underrated.',
    'Which food did you hate as a child and love now?',
    'Which three people, living or not, would you have round for dinner?',
    'What is the best thing about where you live?',
    'Which hobby would you take up if money were no object?',
    'Which memory comes back to you with a smell?',
    'Midsummer or Christmas, and defend your answer.',
    'Which invention would you un-invent?',
    'What is your favourite way to waste ten minutes?',
    'What would your autobiography be called?',
    'What is the kindest thing a stranger has done for you?',
    'Coffee or tea? You have one minute to convince the table.',
    'What would you do with an extra hour every day?',
    'Which superpower would be most useful on a Monday morning?',
    'Which book or film should everyone at this table see?',
    'Which household chore is secretly not so bad?',
    'Where has felt like home the first time you saw it?',
    'What question do you wish people asked you more often?',
];

/* ── The calendar ──
   Sweden has a day for most of its pastries. On one of those days the deck
   is not random about it. Fettisdagen moves with Easter, so it is computed. */
export function easter(year) {
    // Anonymous Gregorian algorithm (Meeus/Jones/Butcher).
    const a = year % 19, b = Math.floor(year / 100), c = year % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(year, month - 1, day));
}

export function fettisdagen(year) {
    const e = easter(year);
    return new Date(e.getTime() - 47 * 86400000);
}

const ymd = (d) => d.toISOString().slice(0, 10);

/** The pastry day falling on `date` (a local calendar date given as Y, M, D
    in UTC fields), or null. */
export function specialDay(date) {
    const y = date.getUTCFullYear(), m = date.getUTCMonth() + 1, d = date.getUTCDate();
    const key = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (ymd(date) === ymd(fettisdagen(y))) return { pastry: 'semla', name: 'Fettisdagen', note: 'Fat Tuesday: the one day a semla is not just allowed but expected.' };
    const fixed = {
        '03-25': { pastry: 'vaffla', name: 'Våffeldagen', note: 'Waffle Day — Vårfrudagen, Lady Day, misheard as “våffeldagen” long ago and never corrected.' },
        '05-11': { pastry: 'chokladboll', name: 'Chokladbollens dag', note: 'Chocolate Ball Day.' },
        '10-04': { pastry: 'kanelbulle', name: 'Kanelbullens dag', note: 'Cinnamon Bun Day: bakeries sell millions of them today.' },
        '11-07': { pastry: 'kladdkaka', name: 'Kladdkakans dag', note: 'Sticky Chocolate Cake Day.' },
        '12-13': { pastry: 'lussekatt', name: 'Lucia', note: 'Lucia: saffron buns and candlelight before dawn.' },
    };
    return fixed[key] || null;
}

/** Cards that only make sense in season stay out of the deck otherwise. */
export function inSeason(card, date) {
    const m = date.getUTCMonth() + 1;
    if (card.id === 'glogg' || card.id === 'julmust' || card.id === 'lussekatt' || card.id === 'pepparkaka') return m === 12 || m === 11 && date.getUTCDate() > 20;
    if (card.id === 'semla') return m <= 3 || specialDay(date)?.pastry === 'semla';
    if (card.id === 'rabarberpaj') return m >= 5 && m <= 7;
    if (card.id === 'iskaffe') return m >= 5 && m <= 9;
    return true;
}

/* ── Dealing ── */
export function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** A seed from a calendar date, so "today's fika" is the same for everyone. */
export function daySeed(date) {
    const key = ymd(date);
    let h = 2166136261;
    for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
    return h >>> 0;
}

/** Deals a hand: { pastry, drink, topic } as indices. Anything in `keep` is
    kept; anything else is drawn fresh and never repeats what it replaces. On
    a pastry day the pastry is that day's, unless it is being kept. */
export function deal(rng, date, keep = {}, previous = null) {
    const pick = (list, prev, ok = () => true) => {
        const pool = list.map((c, i) => i).filter(i => i !== prev && ok(list[i]));
        const from = pool.length ? pool : list.map((c, i) => i);
        return from[Math.floor(rng() * from.length)];
    };
    const special = specialDay(date);
    const hand = {};
    if (keep.pastry != null) hand.pastry = keep.pastry;
    else if (special && (!previous || PASTRIES[previous.pastry].id !== special.pastry)) hand.pastry = PASTRIES.findIndex(p => p.id === special.pastry);
    else hand.pastry = pick(PASTRIES, previous && previous.pastry, c => inSeason(c, date));
    hand.drink = keep.drink != null ? keep.drink : pick(DRINKS, previous && previous.drink, c => inSeason(c, date));
    hand.topic = keep.topic != null ? keep.topic : pick(TOPICS, previous && previous.topic);
    return hand;
}

/* ── Share links ──
   ?fika=kanelbulle.bryggkaffe.12 — ids, not indices, for the two suits that
   could grow, so an old link still deals the same pastry after cards are
   added. */
export function encode(hand) {
    return `${PASTRIES[hand.pastry].id}.${DRINKS[hand.drink].id}.${hand.topic}`;
}

export function decode(code) {
    if (typeof code !== 'string') return null;
    const parts = code.split('.');
    if (parts.length !== 3) return null;
    const [p, d, t] = parts;
    const pastry = PASTRIES.findIndex(x => x.id === p);
    const drink = DRINKS.findIndex(x => x.id === d);
    const topic = Number(t);
    if (pastry < 0 || drink < 0 || !Number.isInteger(topic) || topic < 0 || topic >= TOPICS.length) return null;
    return { pastry, drink, topic };
}
