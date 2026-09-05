// Finding a headless Chrome, and driving one page with it.
//
// The repo already leans on `chromium --headless` for OG screenshots (see
// README → "Link previews"); this is the same tool pointed at the test pages,
// so CI needs no browser automation library and no lockfile.

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';

const run = promisify(execFile);

const CANDIDATES = [
    process.env.CHROME,
    process.env.CHROMIUM_BIN,
    '/opt/pw-browsers/chromium',            // this repo's sandboxes
    '/usr/bin/google-chrome',               // GitHub Actions ubuntu images
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
].filter(Boolean);

export function findChrome() {
    const found = CANDIDATES.find((p) => existsSync(p));
    if (!found) {
        throw new Error(
            'No Chrome/Chromium found. Set $CHROME to the binary, or install one of:\n  ' +
            CANDIDATES.slice(2).join('\n  ')
        );
    }
    return found;
}

const BASE_FLAGS = [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    // Software GL, so the WebGL suites compile real shaders on a machine with
    // no graphics hardware. Harmless for the pages that never touch a context.
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--hide-scrollbars',
    '--mute-audio',
    '--no-first-run',
    '--disable-extensions',
    // Keep the browser off the network except for the page under test. Chrome
    // otherwise reaches for update and variations endpoints, which is slow on
    // CI and a pile of connection errors in a sandbox with no egress.
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-sync',
    '--metrics-recording-only',
];

/**
 * Load `url` and return its DOM once scripts have settled.
 *
 * `--virtual-time-budget` fast-forwards the page's clock and only then dumps,
 * so a suite that takes 18 real seconds of timers returns in a fraction of
 * that — and, unlike a fixed sleep, a slow suite is not truncated mid-run.
 */
export async function dumpDom(url, { budgetMs = 60000, timeoutMs = 180000 } = {}) {
    const { stdout } = await run(
        findChrome(),
        [...BASE_FLAGS, `--virtual-time-budget=${budgetMs}`, '--dump-dom', url],
        { timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 }
    );
    return stdout;
}
