// A static file server for the repo root — no dependencies, because the site
// has none and the tooling should not be the first.
//
// Used two ways: `node tools/serve.mjs [port]` for local work, and imported by
// run-tests.mjs / check-site.mjs, which need real HTTP rather than `file://`
// (the harnesses fetch their modules, and file:// makes that a CORS error).

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.glsl': 'text/plain; charset=utf-8',
};

/** Resolve a URL path to a file on disk, or null if it escapes the root. */
async function resolve(urlPath) {
    const decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
    // normalize() collapses `..`; the prefix check then rejects anything that
    // climbed out of the repo. Path traversal matters even on a throwaway
    // localhost server, since the harnesses run untrusted-ish page code.
    const target = normalize(join(ROOT, decoded));
    if (!target.startsWith(ROOT)) return null;

    try {
        const info = await stat(target);
        if (info.isDirectory()) {
            const index = join(target, 'index.html');
            await stat(index);
            return index;
        }
        return target;
    } catch {
        return null;
    }
}

export function createStaticServer() {
    return createServer(async (req, res) => {
        const file = await resolve(req.url || '/');
        if (!file) {
            res.writeHead(404, { 'content-type': 'text/plain' });
            res.end('404');
            return;
        }
        res.writeHead(200, {
            'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
            'cache-control': 'no-store',
        });
        createReadStream(file).pipe(res);
    });
}

/** Start on an ephemeral port and resolve to `{ origin, close }`. */
export function startServer(port = 0) {
    return new Promise((resolvePromise, reject) => {
        const server = createStaticServer();
        server.once('error', reject);
        server.listen(port, '127.0.0.1', () => {
            const { port: bound } = server.address();
            resolvePromise({
                origin: `http://127.0.0.1:${bound}`,
                close: () => new Promise((done) => server.close(done)),
            });
        });
    });
}

// Run directly: serve the repo on a fixed port and stay up.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const port = Number(process.argv[2]) || 8000;
    startServer(port).then(({ origin }) => {
        console.log(`serving ${ROOT} on ${origin}`);
    });
}
