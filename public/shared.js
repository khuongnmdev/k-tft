// Data access and formatting shared by the player page (app.js) and the compare page (compare.js).
import * as core from './core.js?v=1.2.0';
import * as i18n from './i18n.js?v=1.2.0';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const pct = (v) => (v == null ? '—' : `${(v * 100).toFixed(v === 1 || v === 0 ? 0 : 1)}%`);
export const num = (v, d = 2) => (v == null ? '—' : v.toFixed(d));
export const signed = (v, d = 0) => (v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(d)}`);
export const signCls = (v) => (v == null || v === 0 ? 'muted' : v > 0 ? 'pos' : 'neg');

// ---------- MetaTFT API ----------

let forceDirect = false;

function toDirectUrl(path) {
  const u = new URL(path, window.location.origin);
  if (u.pathname === '/api/patch') {
    return 'https://api-hc.metatft.com/tft-stat-api/patch';
  }
  if (u.pathname === '/api/lookup') {
    const set = u.searchParams.get('set');
    const lang = u.searchParams.get('lang') || i18n.getMetaTftLocale();
    return `https://data.metatft.com/lookups/${set}_latest_${lang}.json`;
  }
  if (u.pathname === '/api/comps') {
    const queue = u.searchParams.get('queue') || '1100';
    const set = u.searchParams.get('set');
    let target = `https://api-hc.metatft.com/tft-comps-api/comps_data?queue=${queue}`;
    if (/^TFTSet\d+(_\d+)?$/.test(set ?? '')) target += `&tft_set=${set}`;
    return target;
  }
  if (u.pathname === '/api/profile') {
    const region = u.searchParams.get('region');
    const name = u.searchParams.get('name');
    const tag = u.searchParams.get('tag');
    const set = u.searchParams.get('set');
    let target = `https://api.metatft.com/public/profile/lookup_by_riotid/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?source=full_profile`;
    if (set) target += `&tft_set=${set}`;
    return target;
  }
  if (u.pathname === '/api/refresh') {
    const region = u.searchParams.get('region');
    const name = u.searchParams.get('name');
    const tag = u.searchParams.get('tag');
    return `https://api.metatft.com/public/profile/refresh_by_riotid/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?source=full_profile`;
  }
  if (u.pathname === '/api/search') {
    const query = u.searchParams.get('q') || '';
    return `https://api.metatft.com/public/search/${encodeURIComponent(query)}`;
  }
  if (u.pathname === '/api/match') {
    const id = u.searchParams.get('id') || '';
    return `https://matches3.metatft.com/${encodeURIComponent(id)}.json`;
  }
  return path;
}

export async function api(path) {
  const isStatic =
    forceDirect ||
    window.location.hostname.endsWith('github.io') ||
    window.location.hostname.endsWith('pages.dev') ||
    window.location.protocol === 'file:';

  let targetUrl = isStatic ? toDirectUrl(path) : path;
  let res;
  try {
    res = await fetch(targetUrl);
    if (!res.ok && res.status === 404 && !isStatic && path.startsWith('/api/')) {
      forceDirect = true;
      targetUrl = toDirectUrl(path);
      res = await fetch(targetUrl);
    }
  } catch (netErr) {
    if (!isStatic && path.startsWith('/api/')) {
      forceDirect = true;
      targetUrl = toDirectUrl(path);
      res = await fetch(targetUrl);
    } else {
      throw netErr;
    }
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    const err = new Error(body?.error || body?.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

const lookupCache = new Map();
const compsCache = new Map();

export function getLookup(set, lang = i18n.getMetaTftLocale()) {
  const cacheKey = `${set}_${lang}`;
  if (!lookupCache.has(cacheKey)) {
    const base = set.replace(/_\d+$/, '');
    const fetchWithFallback = (l) =>
      api(`/api/lookup?set=${set}&lang=${l}`).catch((err) =>
        base !== set ? api(`/api/lookup?set=${base}&lang=${l}`) : Promise.reject(err),
      );
    const p = fetchWithFallback(lang).catch((err) => (lang !== 'en_us' ? fetchWithFallback('en_us') : Promise.reject(err)));
    p.catch(() => lookupCache.delete(cacheKey));
    lookupCache.set(cacheKey, p);
  }
  return lookupCache.get(cacheKey);
}

export function getComps(set) {
  if (!compsCache.has(set)) compsCache.set(set, api(`/api/comps?queue=1100&set=${set}`).catch(() => null));
  return compsCache.get(set);
}

export function profileQuery(p) {
  const region = core.REGIONS.find((r) => r.slug === p.region)?.api ?? 'VN2';
  return `region=${region}&name=${encodeURIComponent(p.name)}&tag=${encodeURIComponent(p.tag)}`;
}

// The live patch's major version names the current set ("16.12" -> TFTSet16); null when MetaTFT can't tell.
export async function fetchCurrentSet() {
  try {
    const p = await api('/api/patch');
    const major = String(p.patch ?? '').split('.')[0];
    return /^\d+$/.test(major) ? `TFTSet${major}` : null;
  } catch {
    return null;
  }
}

// ---------- page links ----------

export function playerUrl(p, set = null) {
  const url = new URL('./', location.href);
  url.searchParams.set('r', p.region);
  url.searchParams.set('id', `${p.name}#${p.tag}`);
  if (set) url.searchParams.set('s', set);
  return url.toString();
}

export function compareUrl(a, b, { set = null, queue = '1100' } = {}) {
  const url = new URL('compare.html', location.href);
  const sp = url.searchParams;
  sp.set('r1', a.region);
  sp.set('id1', `${a.name}#${a.tag}`);
  sp.set('r2', b.region);
  sp.set('id2', `${b.name}#${b.tag}`);
  if (set) sp.set('s', set);
  if (queue !== '1100') sp.set('q', queue);
  return url.toString();
}

// ---------- markup shared by both pages ----------

const t = i18n.t;

export const PLAYSTYLE_ICONS = {
  highRoller: '🎲',
  champion: '👑',
  stabilizer: '🛡️',
  consistent: '📈',
  fast8th: '⚠️',
  balanced: '⚖️',
};

export function unitsHtml(units, size = '') {
  return units
    .map((u) => `<div class="unit c${u.cost}${size}" title="${esc(u.name)}"><img src="${esc(u.icon)}" alt="${esc(u.name)}" loading="lazy"></div>`)
    .join('');
}

export function masteryChampHtml(c) {
  return `
          <div class="mastery-item">
            <div class="mastery-champ-icon c${c.cost}">
              <img src="${esc(c.icon)}" alt="${esc(c.name)}" loading="lazy">
              ${c.threeStar > 0 ? `<span class="mastery-3star-badge" title="${t('mastery3Star', { n: c.threeStar })}">3⭐×${c.threeStar}</span>` : ''}
            </div>
            <div class="mastery-info">
              <div class="mastery-name">
                <span class="champ-name">${esc(c.name)}</span>
                <span class="mastery-games">${t('masteryGames', { n: c.games })}</span>
              </div>
              <div class="mastery-stats">
                <span>${t('thAvgPlace')}: <strong>${c.avgPlace.toFixed(2)}</strong></span>
                <span>${t('thTop4')}: <strong>${pct(c.top4Rate)}</strong></span>
                <span>${t('thTop1')}: <strong>${pct(c.winRate)}</strong></span>
              </div>
              ${
                c.topItems.length
                  ? `
                <div class="mastery-champ-items">
                  ${c.topItems.map((it) => `<img src="${esc(it.icon)}" title="${esc(it.name)} (${it.count}x)" class="mastery-small-item" loading="lazy">`).join('')}
                </div>`
                  : ''
              }
            </div>
          </div>`;
}

export function masteryItemHtml(it) {
  return `
          <div class="mastery-item">
            <div class="mastery-item-icon">
              <img src="${esc(it.icon)}" alt="${esc(it.name)}" loading="lazy">
            </div>
            <div class="mastery-info">
              <div class="mastery-name">
                <span class="item-name">${esc(it.name)}</span>
                <span class="mastery-games">${it.count}x</span>
              </div>
              <div class="mastery-stats">
                <span>${t('thAvgPlace')}: <strong>${it.avgPlace.toFixed(2)}</strong></span>
                <span>${t('thTop4')}: <strong>${pct(it.top4Rate)}</strong></span>
                <span>${t('thTop1')}: <strong>${pct(it.winRate)}</strong></span>
              </div>
            </div>
          </div>`;
}
