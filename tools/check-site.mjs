#!/usr/bin/env node
// Check the site-wide invariants that README.md describes in prose.
//
//   node tools/check-site.mjs
//
// The rules here are not new policy — they are README → "What crawlers see"
// and → "Link previews", plus AGENTS.md → "Stack & styling", turned into
// something that fails a build instead of something a reader is trusted to
// remember. The README already warns that "add a new test or probe page and it
// needs both lines, or it will quietly show up in search results"; quietly is
// the operative word, and prose cannot catch it.
//
// Every page falls into exactly one class, decided by the page and the sitemap
// rather than by a list kept here:
//
//   promoted  — listed in sitemap.xml. Meant to be found, so it carries the
//               full set of tags and a link preview that actually resolves.
//   excluded  — carries <meta name="robots" content="noindex">. Must also be
//               disallowed in robots.txt, because the two mechanisms fail
//               differently and only the pair is airtight.
//   unlisted  — neither. Reachable and indexable but not promoted (the level
//               editors, the frozen legacy sim). Only the universal rules
//               apply, but a tag it *does* carry still has to be correct.

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT } from './serve.mjs';

const SITE = 'https://neskil.github.io';
const GA_ID = 'G-9GP823TGLB';

// Vendored third-party demo code, disallowed wholesale in robots.txt. Its pages
// are not ours to hold to the house rules — see README → "Pruning surprise/".
const VENDORED = 'surprise';

// GitHub Pages serves 404.html for any missing URL. It is noindex, but it must
// stay fetchable: a `Disallow` would stop crawlers reading the 404 they were
// sent to, and cannot keep the page out of an index it was never going to
// enter. The one page where noindex-without-Disallow is correct.
const NO_DISALLOW_NEEDED = new Set(['404.html']);

// A frozen pre-rewrite snapshot, kept as it shipped — see README → Layout.
// Adding a tag to it would make it something other than the snapshot it is.
const FROZEN = new Set(['supply-chain-legacy/index.html']);

const problems = [];
const fail = (file, msg) => problems.push({ file, msg });

/** `cv/index.html` -> `/cv/`, `golf/level-editor.html` -> `/golf/level-editor.html`. */
const sitePath = (rel) => '/' + rel.replace(/(^|\/)index\.html$/, '$1');

async function walk(dir = ROOT, out = []) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) await walk(full, out);
        else out.push(relative(ROOT, full));
    }
    return out;
}

const exists = (rel) => stat(join(ROOT, rel)).then(() => true, () => false);

const meta = (html, name) =>
    (html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i')) || [])[1];
const og = (html, prop) =>
    (html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']*)["']`, 'i')) || [])[1];
const canonical = (html) =>
    (html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i) || [])[1];

/** robots.txt `Disallow` patterns, where `*` is any run of characters. */
function robotsMatcher(robotsTxt) {
    const rules = robotsTxt
        .split('\n')
        .filter((l) => /^\s*Disallow:/i.test(l))
        .map((l) => l.split(':').slice(1).join(':').trim())
        .filter(Boolean);
    const test = (rule, path) =>
        new RegExp('^' + rule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*')).test(path);
    return {
        rules,
        blocks: (path) => rules.some((r) => test(r, path)),
        matchedBy: (path) => rules.filter((r) => test(r, path)),
    };
}

async function main() {
    const files = await walk();
    const htmlFiles = files.filter((f) => f.endsWith('.html'));

    const robotsTxt = await readFile(join(ROOT, 'robots.txt'), 'utf8');
    const robots = robotsMatcher(robotsTxt);

    const sitemapXml = await readFile(join(ROOT, 'sitemap.xml'), 'utf8');
    const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const sitemapPaths = new Set(sitemapUrls.map((u) => u.replace(SITE, '')));

    // ── Every sitemap entry points at something that exists ──────────────
    for (const url of sitemapUrls) {
        if (!url.startsWith(SITE + '/')) {
            fail('sitemap.xml', `<loc> is not under ${SITE}: ${url}`);
            continue;
        }
        const path = url.replace(SITE, '');
        const target = path.endsWith('/') ? path.slice(1) + 'index.html' : path.slice(1);
        if (!(await exists(target))) fail('sitemap.xml', `<loc> ${url} has no file (${target})`);
    }

    // ── Stale robots.txt rules ───────────────────────────────────────────
    for (const rule of robots.rules) {
        const hits = htmlFiles.some((f) => robots.matchedBy('/' + f).includes(rule));
        const dirRule = rule.endsWith('/') && files.some((f) => ('/' + f).startsWith(rule));
        if (!hits && !dirRule) fail('robots.txt', `Disallow rule matches nothing: ${rule}`);
    }

    // ── Per-page rules ───────────────────────────────────────────────────
    for (const rel of htmlFiles.sort()) {
        if (rel.startsWith(VENDORED + '/')) continue;
        const html = await readFile(join(ROOT, rel), 'utf8');
        const path = sitePath(rel);
        const noindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
        const promoted = sitemapPaths.has(path);
        const blocked = robots.blocks('/' + rel);

        // Universal: a page with no language is a page a screen reader has to guess at.
        if (!/<html[^>]*\slang=/i.test(html)) fail(rel, 'no lang attribute on <html>');

        if (noindex) {
            if (promoted) fail(rel, 'has noindex but is listed in sitemap.xml');
            if (!blocked && !NO_DISALLOW_NEEDED.has(rel)) {
                fail(rel, `has noindex but no robots.txt Disallow — add "Disallow: ${'/' + rel}"`);
            }
            continue;
        }

        if (blocked && !promoted) {
            fail(rel, 'is disallowed in robots.txt but carries no noindex — add the meta tag too');
        }

        // Every page a visitor can actually land on, promoted or not.
        // AGENTS.md → "Analytics"; a page nobody counts is a page nobody knows
        // is being used, and the level editors are real features.
        if (!FROZEN.has(rel) && !html.includes(GA_ID)) {
            fail(rel, `no analytics tag (${GA_ID})`);
        }
        // A page with no viewport renders at desktop width on a phone, zoomed
        // out to illegibility. cargo-lander/level-editor.html shipped that way.
        if (!/<meta[^>]+name=["']viewport["']/i.test(html)) {
            fail(rel, 'no <meta name="viewport"> — renders unusably on mobile');
        }

        if (promoted) {
            if (blocked) fail(rel, 'is in sitemap.xml but disallowed in robots.txt');
            if (!meta(html, 'description')) fail(rel, 'no <meta name="description">');
            if (!/twitter:card/.test(html)) fail(rel, 'no twitter:card meta');
            for (const prop of ['title', 'description', 'type', 'url', 'image']) {
                if (!og(html, prop)) fail(rel, `no og:${prop} meta`);
            }
        }

        // ── Structured data ──────────────────────────────────────────────
        // Every promoted page carries one JSON-LD graph, and what it claims has
        // to survive contact with the rest of the page: a block that says the
        // page lives at a different URL, or points at an image that isn't
        // there, is worse than no block at all — search engines act on it.
        const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
        if (promoted && !blocks.length) fail(rel, 'no JSON-LD structured data');

        for (const [, body] of blocks) {
            let data;
            try {
                data = JSON.parse(body);
            } catch (err) {
                fail(rel, `JSON-LD does not parse: ${err.message}`);
                continue;
            }
            const nodes = data['@graph'] || [data];
            if (data['@context'] !== 'https://schema.org') {
                fail(rel, 'JSON-LD @context is not https://schema.org');
            }
            if (nodes[0]?.url && nodes[0].url !== SITE + path) {
                fail(rel, `JSON-LD url is ${nodes[0].url}, should be ${SITE + path}`);
            }
            // Any absolute site URL it names — url, image, a Person's portrait —
            // has to resolve. `@id` values are identifiers, not links, so a
            // fragment like "/#website" is left alone.
            for (const node of nodes) {
                for (const key of ['url', 'image']) {
                    const value = node[key];
                    if (typeof value !== 'string' || !value.startsWith(SITE + '/')) continue;
                    const target = value.replace(SITE + '/', '') || 'index.html';
                    const asDir = target.endsWith('/') ? target + 'index.html' : target;
                    if (!(await exists(asDir))) fail(rel, `JSON-LD ${key} has no file: ${value}`);
                }
            }
        }

        // Tags a page carries must be right, promoted or not — a wrong canonical
        // is worse than none, since it hands the crawler a different page.
        const canon = canonical(html);
        if (canon && canon !== SITE + path) {
            fail(rel, `canonical is ${canon}, should be ${SITE + path}`);
        }
        const ogUrl = og(html, 'url');
        if (ogUrl && ogUrl !== SITE + path) fail(rel, `og:url is ${ogUrl}, should be ${SITE + path}`);

        const image = og(html, 'image');
        if (image) {
            // Scrapers do not resolve relative paths — README → "Link previews".
            if (!image.startsWith('https://')) fail(rel, `og:image is not absolute: ${image}`);
            else if (image.startsWith(SITE + '/') && !(await exists(image.replace(SITE + '/', '')))) {
                fail(rel, `og:image has no file: ${image}`);
            }
        }
    }

    // ── Internal links resolve ───────────────────────────────────────────
    const refFiles = files.filter((f) => /\.(html|css|js|mjs)$/.test(f) && !f.startsWith(VENDORED + '/'));
    for (const rel of refFiles) {
        const text = await readFile(join(ROOT, rel), 'utf8');
        const seen = new Set();
        for (const m of text.matchAll(/(?:href|src)\s*=\s*"([^"]*)"/gi)) {
            const raw = m[1].trim();
            // Values built by script at runtime, not references to check.
            if (!raw || raw.includes('${') || raw.includes("'")) continue;
            if (/^(https?:|\/\/|data:|mailto:|tel:|#|javascript:|blob:)/i.test(raw)) continue;
            const link = raw.split('#')[0].split('?')[0].replace(/&amp;/g, '&');
            if (!link || seen.has(link)) continue;
            seen.add(link);

            const target = link.startsWith('/')
                ? normalize(link.slice(1))
                : normalize(join(dirname(rel), link));
            if (target.startsWith('..')) {
                fail(rel, `link escapes the site root: ${raw}`);
                continue;
            }
            if (await exists(target)) continue;
            if (await exists(join(target, 'index.html'))) continue;
            fail(rel, `broken link: ${raw}`);
        }
    }

    // ── Report ───────────────────────────────────────────────────────────
    if (!problems.length) {
        console.log(`OK — ${htmlFiles.length} pages, ${sitemapUrls.length} sitemap entries, no problems`);
        return;
    }
    const byFile = new Map();
    for (const p of problems) {
        if (!byFile.has(p.file)) byFile.set(p.file, []);
        byFile.get(p.file).push(p.msg);
    }
    for (const [file, msgs] of [...byFile].sort()) {
        console.error(file);
        for (const msg of msgs) console.error(`  - ${msg}`);
    }
    console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'} in ${byFile.size} file(s)`);
    process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch((err) => {
        console.error(err.message || err);
        process.exit(1);
    });
}
