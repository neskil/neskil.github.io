// A small static file server for running the site on your own machine. It needs nothing installed but Node.
// Usage: node tools/serve.mjs [folder] [port]      (npm start serves the source as it is on port 8000; npm run preview serves dist/ on 8001)
// It answers only on this machine (127.0.0.1) and serves only files inside the folder it was given.
// Served from source, the gallery asks once for atlas.json, a file only the build makes: that one "not found" is expected.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', process.argv[2] || '.');
const port = Number(process.argv[3] || process.env.PORT || 8000);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
};
if (!fs.existsSync(root)) { console.error(`there is no folder ${root}` + (process.argv[2] === 'dist' ? ' yet: run "npm run build" first' : '')); process.exit(1); }
const server = http.createServer((req, res) => {
  const say = (code, text) => { res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(text); };
  let url, rel;
  try { url = new URL(req.url, 'http://localhost'); rel = decodeURIComponent(url.pathname); } catch (e) { return say(400, 'bad request'); }
  if (rel.includes('\0')) return say(400, 'bad request');
  let file = path.join(root, rel);
  if (file !== root && !file.startsWith(root + path.sep)) return say(403, 'forbidden');
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) {
      // a folder is its index.html; without the closing slash the page's relative addresses would point one level too high
      if (!rel.endsWith('/')) { res.writeHead(301, { Location: url.pathname + '/' + url.search }); return res.end(); }
      file = path.join(file, 'index.html');
    }
    fs.readFile(file, (e2, body) => {
      if (e2) return say(404, 'not found');
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : body);
    });
  });
});
server.on('error', (e) => { console.error(e.code === 'EADDRINUSE' ? `port ${port} is in use (is another copy of this server still running?): try "node tools/serve.mjs ${process.argv[2] || '.'} ${port + 10}"` : String(e)); process.exit(1); });
server.listen(port, '127.0.0.1', () => console.log(`Portals is running at http://localhost:${port}/   (Ctrl+C stops it)`));
