// Tiny zero-dependency server: serves ./public and proxies the MetaTFT API with a short cache.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = fileURLToPath(new URL('./public/', import.meta.url));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const cache = new Map();

async function fetchJson(url, ttlMs) {
  const hit = cache.get(url);
  if (ttlMs > 0 && hit && Date.now() - hit.at < ttlMs) return hit.result;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'k-tft/1.0 (personal stats tool)',
      Referer: 'https://www.metatft.com/',
    },
  });
  const body = await res.text();
  const result = { status: res.status, body };
  if (res.ok && ttlMs > 0) cache.set(url, { at: Date.now(), result });
  return result;
}

const enc = encodeURIComponent;
const MIN = 60 * 1000;
const SET_RE = /^TFTSet\d+(_\d+)?$/;

const routes = {
  '/api/patch': () => ({ url: 'https://api-hc.metatft.com/tft-stat-api/patch', ttl: 30 * MIN }),

  '/api/lookup': (q) => {
    const set = q.get('set') ?? '';
    const lang = q.get('lang') ?? 'en_us';
    if (!SET_RE.test(set)) return { error: 'set không hợp lệ' };
    if (!/^[a-z]{2}_[a-z]{2}$/.test(lang)) return { error: 'lang không hợp lệ' };
    return { url: `https://data.metatft.com/lookups/${set}_latest_${lang}.json`, ttl: 6 * 60 * MIN };
  },

  '/api/comps': (q) => {
    const queue = q.get('queue') ?? '1100';
    const set = q.get('set') ?? '';
    if (!/^\d+$/.test(queue)) return { error: 'queue không hợp lệ' };
    let url = `https://api-hc.metatft.com/tft-comps-api/comps_data?queue=${queue}`;
    if (SET_RE.test(set)) url += `&tft_set=${set}`;
    return { url, ttl: 30 * MIN };
  },

  '/api/profile': (q) => {
    const region = q.get('region') ?? '';
    const name = q.get('name') ?? '';
    const tag = q.get('tag') ?? '';
    const set = q.get('set') ?? '';
    if (!/^[a-zA-Z0-9]+$/.test(region) || !name || !tag) return { error: 'Thiếu region / tên / tag' };
    let url = `https://api.metatft.com/public/profile/lookup_by_riotid/${region}/${enc(name)}/${enc(tag)}?source=full_profile`;
    if (SET_RE.test(set)) url += `&tft_set=${set}`;
    return { url, ttl: q.get('fresh') ? 0 : 2 * MIN };
  },

  '/api/refresh': (q) => {
    const region = q.get('region') ?? '';
    const name = q.get('name') ?? '';
    const tag = q.get('tag') ?? '';
    if (!/^[a-zA-Z0-9]+$/.test(region) || !name || !tag) return { error: 'Thiếu region / tên / tag' };
    return {
      url: `https://api.metatft.com/public/profile/refresh_by_riotid/${region}/${enc(name)}/${enc(tag)}?source=full_profile`,
      ttl: 0,
    };
  },

  '/api/search': (q) => {
    const query = q.get('q') ?? '';
    if (!query.trim()) return { error: 'Thiếu query' };
    return {
      url: `https://api.metatft.com/public/search/${enc(query.trim())}`,
      ttl: 5 * MIN,
    };
  },

  '/api/match': (q) => {
    const id = q.get('id') ?? '';
    if (!id || !/^[A-Za-z0-9_]+$/.test(id)) return { error: 'Match id không hợp lệ' };
    return {
      url: `https://matches3.metatft.com/${id}.json`,
      ttl: 60 * MIN,
    };
  },
};

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

async function serveStatic(pathname, res) {
  const rel = normalize(decodeURIComponent(pathname === '/' ? '/index.html' : pathname)).replace(/^([/\\])+/, '');
  const file = join(PUBLIC_DIR, rel);
  if (!file.startsWith(PUBLIC_DIR)) return send(res, 403, 'Forbidden', 'text/plain');
  try {
    const data = await readFile(file);
    send(res, 200, data, MIME[extname(file).toLowerCase()] ?? 'application/octet-stream');
  } catch {
    send(res, 404, 'Not found', 'text/plain');
  }
}

const server = createServer(async (req, res) => {
  const u = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  const route = routes[u.pathname];
  if (!route) return serveStatic(u.pathname, res);

  const spec = route(u.searchParams);
  if (spec.error) return send(res, 400, JSON.stringify({ error: spec.error }));
  try {
    const { status, body } = await fetchJson(spec.url, spec.ttl);
    send(res, status, body);
  } catch (err) {
    console.error(`[proxy] ${spec.url}:`, err.message);
    send(res, 502, JSON.stringify({ error: `Không gọi được MetaTFT: ${err.message}` }));
  }
});

server.listen(PORT, () => {
  console.log(`k-tft đang chạy: http://localhost:${PORT}`);
});
