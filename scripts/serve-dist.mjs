// Local static server for dist/ that mimics Cloudflare Pages closely enough to verify the build:
// /path/ → path/index.html, 301 for /path → /path/, _redirects (200 rewrite + 301), _headers, real 404.
// Usage: npm run preview  [-- --port 4173]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.join(process.cwd(), 'dist');
const portArg = process.argv.indexOf('--port');
const PORT = portArg > -1 ? Number(process.argv[portArg + 1]) : 4173;
const HOST = '127.0.0.1';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

function parseRedirects() {
  const f = path.join(DIST, '_redirects');
  if (!fs.existsSync(f)) return [];
  return fs
    .readFileSync(f, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const [from, to, code] = l.split(/\s+/);
      return { from, to, code: Number(code || 301) };
    });
}

function parseHeaders() {
  const f = path.join(DIST, '_headers');
  if (!fs.existsSync(f)) return [];
  const rules = [];
  let cur = null;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    if (!line.startsWith(' ')) {
      cur = { pattern: line.trim(), headers: {} };
      rules.push(cur);
    } else if (cur) {
      const i = line.indexOf(':');
      cur.headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return rules;
}

const match = (pattern, p) => {
  if (pattern.endsWith('*')) return p.startsWith(pattern.slice(0, -1));
  return pattern === p;
};

const redirects = parseRedirects();
const headerRules = parseHeaders();

function send(res, status, file, reqPath) {
  const headers = { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' };
  for (const r of headerRules) if (match(r.pattern, reqPath)) Object.assign(headers, r.headers);
  res.writeHead(status, headers);
  fs.createReadStream(file).pipe(res);
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://${HOST}`);
    const p = decodeURIComponent(url.pathname);
    if (p.includes('..')) return res.writeHead(400).end();

    for (const r of redirects) {
      if (r.code === 301 && r.from === p) {
        res.writeHead(301, { Location: r.to });
        return res.end();
      }
    }
    let file = path.join(DIST, p);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return send(res, 200, file, p);
    if (!p.endsWith('/') && fs.existsSync(path.join(file, 'index.html'))) {
      res.writeHead(301, { Location: p + '/' + url.search });
      return res.end();
    }
    if (p.endsWith('/') && fs.existsSync(path.join(file, 'index.html'))) return send(res, 200, path.join(file, 'index.html'), p);
    for (const r of redirects) {
      if (r.code === 200 && match(r.from, p)) return send(res, 200, path.join(DIST, r.to), p);
    }
    return send(res, 404, path.join(DIST, '404.html'), p);
  })
  .listen(PORT, HOST, () => console.log(`dist served at http://${HOST}:${PORT}/`));
