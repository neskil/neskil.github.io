// Fika Generator — little drawings for the card faces. Each `art` name in the
// deck is one function here returning SVG markup in a 120×100 box; the card's
// `colours` paint it, so one drawing serves several pastries.

const plate = (y = 84, w = 46) =>
    `<ellipse cx="60" cy="${y}" rx="${w}" ry="${w * 0.2}" fill="#f8fafc"/><ellipse cx="60" cy="${y - 1}" rx="${w * 0.72}" ry="${w * 0.13}" fill="#e2e8f0"/>`;

const dots = (n, cx, cy, rx, ry, r, fill, seed = 1) => {
    let s = seed, out = '';
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let k = 0; k < n; k++) {
        const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd());
        out += `<circle cx="${(cx + Math.cos(a) * rx * d).toFixed(1)}" cy="${(cy + Math.sin(a) * ry * d).toFixed(1)}" r="${r}" fill="${fill}"/>`;
    }
    return out;
};

const steam = (x, y) => [0, 9, 18].map((dx, i) =>
    `<path class="steam" style="animation-delay:${i * 0.5}s" d="M${x + dx} ${y} c-4 -6 4 -10 0 -16 c-4 -6 4 -10 0 -14" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" opacity="0.6"/>`).join('');

export const ART = {
    knot: ([dough, swirl, sugar]) => `${plate()}
        <ellipse cx="60" cy="62" rx="36" ry="20" fill="${dough}"/>
        <ellipse cx="60" cy="56" rx="32" ry="17" fill="${dough}" stroke="${swirl}" stroke-opacity="0.25"/>
        <path d="M60 56 c8 -2 10 6 2 8 c-12 3 -16 -10 -4 -14 c16 -5 24 12 10 18 c-18 7 -32 -6 -24 -18" fill="none" stroke="${swirl}" stroke-width="4" stroke-linecap="round"/>
        ${dots(22, 60, 52, 26, 11, 1.6, sugar, 3)}`,

    semla: ([bun, cream, almond]) => `${plate()}
        <path d="M26 66 q34 22 68 0 l-3 -6 h-62z" fill="${bun}"/>
        <rect x="29" y="57" width="62" height="5" rx="2" fill="${almond}"/>
        <path d="M28 59 q4 -14 11 -6 q5 -13 11 -5 q5 -13 11 -5 q5 -13 11 -5 q5 -12 11 -4 q6 -8 5 8 z" fill="${cream}" stroke="#d9c9b0" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M34 46 q26 -30 52 0 q-26 6 -52 0z" fill="${bun}"/>
        <path d="M40 40 q20 -16 40 0" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="3" stroke-linecap="round"/>
        ${dots(34, 60, 36, 20, 6, 1.3, '#ffffff', 7)}`,

    dome: ([top, accent, base]) => `${plate()}
        <path d="M22 78 q0 -46 38 -46 q38 0 38 46 z" fill="${top}"/>
        <path d="M22 78 h76" stroke="${base}" stroke-width="4"/>
        <path d="M34 50 q26 -14 52 0" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="3" stroke-linecap="round"/>
        <circle cx="60" cy="31" r="7" fill="${accent}"/><circle cx="56" cy="29" r="4" fill="${accent}" stroke="#ffffff" stroke-opacity="0.4"/>
        <circle cx="64" cy="33" r="4" fill="${accent}" stroke="#ffffff" stroke-opacity="0.4"/>
        <path d="M52 37 q-6 2 -10 -2 M68 37 q6 2 10 -2" stroke="#4d7c0f" stroke-width="3" stroke-linecap="round"/>`,

    ball: ([choc, coconut, shade]) => `${plate()}
        <circle cx="60" cy="58" r="24" fill="${choc}"/>
        <circle cx="52" cy="50" r="10" fill="${shade}" opacity="0.5"/>
        ${dots(70, 60, 58, 22, 22, 1.2, coconut, 11)}`,

    roll: ([marzipan, choc, light]) => `${plate()}
        <rect x="26" y="50" width="68" height="26" rx="6" fill="${marzipan}"/>
        <rect x="26" y="50" width="68" height="8" rx="4" fill="${light}" opacity="0.6"/>
        <path d="M26 56 q0 -6 6 -6 h10 v26 h-10 q-6 0 -6 -6z" fill="${choc}"/>
        <path d="M94 56 q0 -6 -6 -6 h-10 v26 h10 q6 0 6 -6z" fill="${choc}"/>`,

    slice: ([body, layer, top]) => `${plate()}
        <path d="M20 66 l66 -22 l14 14 l-66 22 z" fill="${top}"/>
        <path d="M34 80 l66 -22 v12 l-66 22 z" fill="${body}"/>
        <path d="M20 66 l14 14 v12 l-14 -14 z" fill="${layer}"/>
        <path d="M34 86 l66 -22" stroke="${layer}" stroke-width="2.5" opacity="0.7"/>`,

    tart: ([crust, icing, edge]) => `${plate()}
        <path d="M28 62 l6 18 h52 l6 -18 z" fill="${crust}"/>
        ${[34, 42, 50, 58, 66, 74, 82].map(x => `<path d="M${x} 64 l2 15" stroke="${edge}" stroke-width="2"/>`).join('')}
        <ellipse cx="60" cy="62" rx="32" ry="10" fill="${edge}"/>
        <ellipse cx="60" cy="60" rx="29" ry="8.5" fill="${icing}"/>`,

    cookie: ([dough, jam, edge]) => `${plate()}
        <ellipse cx="60" cy="66" rx="30" ry="13" fill="${edge}"/>
        <ellipse cx="60" cy="61" rx="30" ry="13" fill="${dough}"/>
        ${jam ? `<ellipse cx="60" cy="60" rx="10" ry="4.5" fill="${jam}"/><ellipse cx="57" cy="59" rx="3" ry="1.2" fill="#ffffff" opacity="0.4"/>`
              : `<path d="M44 60 l6 -3 l5 4 l7 -4 l6 3 l7 -2" fill="none" stroke="${edge}" stroke-width="1.6"/><path d="M48 66 l6 -2 l6 3 l8 -3" fill="none" stroke="${edge}" stroke-width="1.4"/>`}`,

    ess: ([dough, raisin, light]) => `${plate()}
        <path d="M38 64 c-14 0 -14 -20 0 -20 c14 0 16 14 22 20 c6 6 8 20 22 20 c14 0 14 -20 0 -20" fill="none" stroke="${dough}" stroke-width="13" stroke-linecap="round" transform="translate(0 -10)"/>
        <path d="M38 64 c-14 0 -14 -20 0 -20 c14 0 16 14 22 20 c6 6 8 20 22 20 c14 0 14 -20 0 -20" fill="none" stroke="${light}" stroke-width="4" stroke-linecap="round" opacity="0.6" transform="translate(-2 -12)"/>
        <circle cx="35" cy="44" r="3.4" fill="${raisin}"/><circle cx="85" cy="64" r="3.4" fill="${raisin}"/>`,

    danish: ([pastry, filling, light]) => `${plate()}
        <path d="M60 36 l30 24 l-30 24 l-30 -24 z" fill="${pastry}"/>
        <path d="M60 36 l14 11 l-14 3 l-14 -3 z M90 60 l-11 14 l-3 -14 l3 -14 z M60 84 l-14 -11 l14 -3 l14 3 z M30 60 l11 -14 l3 14 l-3 14 z" fill="${light}" opacity="0.7"/>
        <circle cx="60" cy="60" r="10" fill="${filling}"/>`,

    heart: ([biscuit, icing, edge]) => `${plate()}
        <path d="M60 82 c-30 -18 -34 -36 -20 -42 c9 -4 17 2 20 8 c3 -6 11 -12 20 -8 c14 6 10 24 -20 42z" fill="${edge}" transform="translate(0 3)"/>
        <path d="M60 82 c-30 -18 -34 -36 -20 -42 c9 -4 17 2 20 8 c3 -6 11 -12 20 -8 c14 6 10 24 -20 42z" fill="${biscuit}"/>
        <path d="M60 76 c-24 -15 -27 -29 -17 -33 c7 -3 14 2 17 7 c3 -5 10 -10 17 -7 c10 4 7 18 -17 33z" fill="none" stroke="${icing}" stroke-width="1.8" stroke-dasharray="3 2.5"/>`,

    waffle: ([waffle, jam, cream]) => `${plate()}
        ${[0, 72, 144, 216, 288].map(a => `<g transform="rotate(${a} 60 60)"><path d="M60 60 c-12 -8 -12 -24 -2 -26 c4 -1 6 2 2 4 c-4 -2 -2 -5 2 -4 c10 2 10 18 -2 26z" fill="${waffle}" stroke="#b9853f" stroke-width="1"/></g>`).join('')}
        <path d="M40 48 l40 24 M44 72 l32 -28 M36 60 h48" stroke="#b9853f" stroke-width="1.2" opacity="0.5"/>
        <circle cx="60" cy="58" r="9" fill="${cream}"/><circle cx="66" cy="54" r="5" fill="${jam}"/>`,

    swirl: ([outer, cream, fruit]) => `${plate()}
        <ellipse cx="60" cy="62" rx="30" ry="20" fill="${outer}"/>
        <path d="M60 62 m-2 0 a3 3 0 1 1 6 0 a8 7 0 1 1 -16 0 a14 12 0 1 1 28 0 a20 16 0 1 1 -40 0" fill="none" stroke="${cream}" stroke-width="4.5"/>
        ${dots(5, 60, 62, 16, 10, 2.4, fruit, 5)}
        ${dots(30, 60, 52, 26, 8, 0.9, '#5a3424', 13)}`,

    pie: ([crust, filling, crumble]) => `${plate()}
        <path d="M24 64 l72 -6 l-6 22 l-60 4 z" fill="${crust}"/>
        <path d="M27 62 l66 -6 l-2 10 l-62 5 z" fill="${filling}"/>
        ${dots(40, 60, 57, 32, 4, 2, crumble, 17)}`,

    mug: ([liquid, mug, topping]) => `
        <path d="M86 46 h6 a10 10 0 0 1 0 20 h-6" fill="none" stroke="${mug}" stroke-width="6"/>
        <path d="M32 40 h56 v36 a10 10 0 0 1 -10 10 h-36 a10 10 0 0 1 -10 -10 z" fill="${mug}"/>
        <ellipse cx="60" cy="40" rx="28" ry="6" fill="${liquid}"/>
        ${topping && topping !== liquid ? `<path d="M38 40 q4 -10 10 -4 q6 -10 12 -3 q6 -9 12 -2 q6 -6 8 4 z" fill="${topping}"/>` : ''}
        ${steam(48, 30)}`,

    cup: ([liquid, cup, foam]) => `
        <ellipse cx="60" cy="84" rx="40" ry="8" fill="#f1f5f9"/><ellipse cx="60" cy="83" rx="28" ry="5" fill="#e2e8f0"/>
        <path d="M82 54 h5 a8 8 0 0 1 0 16 h-6" fill="none" stroke="${cup}" stroke-width="5"/>
        <path d="M30 48 h60 q0 34 -30 34 q-30 0 -30 -34z" fill="${cup}"/>
        <ellipse cx="60" cy="48" rx="30" ry="6" fill="${liquid}"/>
        <ellipse cx="60" cy="48" rx="20" ry="3.5" fill="${foam}"/>
        <path d="M55 48 q5 -3 10 0 q-5 3 -10 0" fill="${liquid}" opacity="0.6"/>
        ${steam(50, 38)}`,

    glass: ([liquid, light, ice]) => `
        <path d="M40 24 h40 l-5 62 h-30 z" fill="#e0f2fe" fill-opacity="0.18" stroke="#e2e8f0" stroke-opacity="0.6" stroke-width="2"/>
        <path d="M42.5 40 h35 l-3.7 44 h-27.6 z" fill="${liquid}"/>
        <path d="M46 42 l3 40" stroke="${light}" stroke-width="3" opacity="0.45" stroke-linecap="round"/>
        ${ice ? `<rect x="52" y="44" width="10" height="10" rx="2" fill="${ice}" opacity="0.6" transform="rotate(12 57 49)"/><rect x="62" y="52" width="9" height="9" rx="2" fill="${ice}" opacity="0.5" transform="rotate(-10 66 56)"/>` : ''}
        <ellipse cx="60" cy="88" rx="22" ry="4" fill="#000" opacity="0.15"/>`,

    small: ([liquid, cup, nuts]) => `
        <ellipse cx="60" cy="86" rx="30" ry="6" fill="#000" opacity="0.15"/>
        <path d="M76 56 h4 a7 7 0 0 1 0 14 h-4" fill="none" stroke="${cup}" stroke-width="4"/>
        <path d="M42 50 h36 v24 a8 8 0 0 1 -8 8 h-20 a8 8 0 0 1 -8 -8z" fill="${cup}" opacity="0.9"/>
        <ellipse cx="60" cy="50" rx="18" ry="4.5" fill="${liquid}"/>
        <circle cx="54" cy="50" r="2" fill="${nuts}"/><circle cx="63" cy="51" r="2" fill="#3b1d17"/><circle cx="67" cy="49" r="1.8" fill="${nuts}"/>
        ${steam(52, 40)}`,

    bottle: ([drink, label, gold]) => `
        <ellipse cx="60" cy="90" rx="20" ry="4" fill="#000" opacity="0.2"/>
        <path d="M54 12 h12 v14 q12 8 12 22 v38 a4 4 0 0 1 -4 4 h-28 a4 4 0 0 1 -4 -4 v-38 q0 -14 12 -22 z" fill="${drink}"/>
        <rect x="54" y="10" width="12" height="5" rx="1.5" fill="${gold}"/>
        <rect x="42" y="52" width="36" height="22" rx="3" fill="${label}"/>
        <text x="60" y="66" text-anchor="middle" font-family="Outfit, sans-serif" font-weight="700" font-size="9" fill="${gold}">MUST</text>
        <path d="M70 34 q4 6 4 16" stroke="#ffffff" stroke-opacity="0.25" stroke-width="3" fill="none" stroke-linecap="round"/>`,

    talk: () => `
        <path d="M18 22 h70 a10 10 0 0 1 10 10 v28 a10 10 0 0 1 -10 10 h-40 l-14 12 v-12 h-16 a10 10 0 0 1 -10 -10 v-28 a10 10 0 0 1 10 -10z" fill="#fde68a" opacity="0.9"/>
        <path d="M40 34 h44 a8 8 0 0 1 8 8 v18 a8 8 0 0 1 -8 8 h-8 v10 l-12 -10 h-24 a8 8 0 0 1 -8 -8 v-18 a8 8 0 0 1 8 -8z" fill="#f9a8d4" opacity="0.85" transform="translate(10 6)"/>
        <text x="46" y="52" text-anchor="middle" font-family="Outfit, sans-serif" font-weight="800" font-size="26" fill="#78350f">?</text>
        <text x="80" y="64" text-anchor="middle" font-family="Outfit, sans-serif" font-weight="800" font-size="22" fill="#831843">!</text>`,
};

export function drawing(card) {
    const f = ART[card.art] || ART.talk;
    return `<svg viewBox="0 0 120 100" aria-hidden="true">${f(card.colours || [])}</svg>`;
}
