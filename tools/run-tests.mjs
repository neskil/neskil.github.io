#!/usr/bin/env node
// Run every headless test harness in the repo and fail loudly if any is red.
//
//   node tools/run-tests.mjs            # all suites
//   node tools/run-tests.mjs golf3d     # only suites whose path contains "golf3d"
//
// Suites are discovered, not listed: any `*tests.html` carrying a
// `<div id="summary">` is one. Add a harness to a new project and it is picked
// up here with no edit to this file — the same trick supply-chain/CLAUDE.md
// uses for its module loader, for the same reason (a hand-kept list goes stale
// the moment someone is in a hurry).

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer, ROOT } from './serve.mjs';
import { dumpDom } from './chrome.mjs';

const SKIP_DIRS = new Set(['.git', 'node_modules', 'surprise', 'assets']);
const CONCURRENCY = Number(process.env.TEST_CONCURRENCY) || 3;

async function findSuites(dir = ROOT, out = []) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            await findSuites(full, out);
        } else if (/tests\.html$/.test(entry.name)) {
            const text = await readFile(full, 'utf8');
            if (text.includes('id="summary"')) out.push(relative(ROOT, full));
        }
    }
    return out.sort();
}

/**
 * Read a verdict out of a harness's `#summary`.
 *
 * The eight suites predate any shared contract and each phrase their result
 * differently, so this understands all the shapes in use. It is deliberately
 * strict: a summary it cannot read is reported as a failure, never as a pass,
 * because "the page didn't say" and "the page said everything is fine" must
 * not collapse into the same green tick.
 */
export function parseSummary(dom) {
    const el = dom.match(/<div[^>]*id="summary"[^>]*>([\s\S]*?)<\/div>/i);
    if (!el) return { ok: false, reason: 'no #summary element in the DOM — the page never rendered' };

    const text = el[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (!text) return { ok: false, reason: '#summary is empty — the suite threw before it finished' };

    // "FAILED — 3 of 392 assertions"  (3d-engine-poc)
    const ofAssertions = text.match(/FAILED\s*[—-]\s*(\d+)\s+of\s+(\d+)\s+assertions/i);
    if (ofAssertions) {
        const failed = Number(ofAssertions[1]);
        return { ok: false, passed: Number(ofAssertions[2]) - failed, failed, text };
    }

    // "… 3 failed …" in any arrangement — an explicit count wins over any marker.
    const failedCount = text.match(/(\d+)\s+failed/i);
    if (failedCount) {
        const failed = Number(failedCount[1]);
        const passed = Number((text.match(/(\d+)\s+passed/i) || [, 0])[1]);
        return { ok: failed === 0, passed, failed, text };
    }

    // Success spellings that omit a failure count entirely.
    if (text.startsWith('✓') || /ALL TESTS PASSED/i.test(text)) {
        const passed = Number((text.match(/(\d+)\s+(?:passed|assertions)/i) || [, 0])[1]);
        return { ok: true, passed, failed: 0, text };
    }

    return { ok: false, reason: `could not read a verdict from #summary: "${text}"`, text };
}

async function runSuite(origin, path) {
    const started = Date.now();
    try {
        const dom = await dumpDom(`${origin}/${path}`);
        return { path, ...parseSummary(dom), ms: Date.now() - started };
    } catch (err) {
        const timedOut = err.killed || /ETIMEDOUT/.test(String(err.code));
        return {
            path,
            ok: false,
            reason: timedOut ? 'browser timed out — the suite hung' : `browser failed: ${err.message}`,
            ms: Date.now() - started,
        };
    }
}

/** Run `items` with a bounded number in flight, preserving input order. */
async function pool(items, limit, worker) {
    const results = new Array(items.length);
    let next = 0;
    await Promise.all(
        Array.from({ length: Math.min(limit, items.length) }, async () => {
            while (next < items.length) {
                const i = next++;
                results[i] = await worker(items[i]);
            }
        })
    );
    return results;
}

async function main() {
    const filters = process.argv.slice(2);
    let suites = await findSuites();
    if (filters.length) suites = suites.filter((s) => filters.some((f) => s.includes(f)));

    if (!suites.length) {
        console.error(filters.length ? `No suites match ${filters.join(', ')}` : 'No suites found');
        process.exit(1);
    }

    const { origin, close } = await startServer();
    console.log(`Running ${suites.length} suite${suites.length === 1 ? '' : 's'} against ${origin}\n`);

    let results;
    try {
        results = await pool(suites, CONCURRENCY, (path) => runSuite(origin, path));
    } finally {
        await close();
    }

    let totalPassed = 0;
    let totalFailed = 0;
    for (const r of results) {
        totalPassed += r.passed || 0;
        totalFailed += r.failed || 0;
        const detail = r.ok ? `${r.passed} passed` : r.reason || `${r.failed} failed, ${r.passed} passed`;
        console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.path.padEnd(34)} ${detail}  (${(r.ms / 1000).toFixed(1)}s)`);
    }

    const bad = results.filter((r) => !r.ok);
    console.log(
        `\n${results.length - bad.length}/${results.length} suites green — ` +
        `${totalPassed} assertions passed${totalFailed ? `, ${totalFailed} failed` : ''}`
    );

    if (bad.length) {
        console.error(`\nRed: ${bad.map((r) => r.path).join(', ')}`);
        process.exit(1);
    }
}

// Only when run directly — parseSummary is exported, and importing it must not
// kick off a twenty-second browser run as a side effect.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch((err) => {
        console.error(err.message || err);
        process.exit(1);
    });
}
