import * as core from './core.js?v=1.1.3';
import * as i18n from './i18n.js?v=1.1.3';

const t = i18n.t;

// Categorical slots (dark-surface steps of the validated reference palette), fixed order.
const PALETTE = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];
const OTHER = '#6f6e69';
const LINE = '#5c5b57';
const GRID = '#2c2c2a';
const GRID_STRONG = '#45443f';
const SURFACE = '#1a1a19';
const TEXT2 = '#c3c2b7';
const POS = '#3987e5';
const NEG = '#e66767';

const DEFAULT_PLAYER = { region: 'vn', id: 'Akite Bánh Mì#akite' };
const PAGE = 30;

const $ = (id) => document.getElementById(id);

const state = {
  player: null,
  currentSet: null,
  set: null,
  seasons: new Map(), // set -> ranked rating text, for the loaded player
  profile: null,
  lk: null,
  clusters: [],
  all: [],
  groupMode: 'cluster',
  queue: '1100',
  patch: 'all',
  minGames: 1,
  selected: null,
  sort: { key: 'games', asc: false },
  colors: new Map(),
  matchLimit: PAGE,
  loading: false,
  pendingPatch: null, // from a shared URL, applied by the next load
  pendingTeam: null,
};

const charts = {};
const lookupCache = new Map();
const compsCache = new Map();
const matchDetailsCache = new Map();
const expandedMatchIds = new Set();

// ---------- helpers ----------

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pct = (v) => (v == null ? '—' : `${(v * 100).toFixed(v === 1 || v === 0 ? 0 : 1)}%`);
const num = (v, d = 2) => (v == null ? '—' : v.toFixed(d));
const signed = (v, d = 0) => (v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(d)}`);
const signCls = (v) => (v == null || v === 0 ? 'muted' : v > 0 ? 'pos' : 'neg');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function fmtDate(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return i18n.getLang() === 'vi'
    ? `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`
    : `${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function fmtDuration(sec) {
  if (!sec) return '';
  return `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
}

function setStatus(msg, isError = false) {
  const el = $('status');
  el.hidden = !msg;
  el.textContent = msg ?? '';
  el.classList.toggle('error', isError);
}

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
    return `https://api-hc.metatft.com/tft-comps-api/comps_data?queue=${queue}`;
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

async function api(path) {
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

const colorOf = (key) => state.colors.get(key) ?? OTHER;
const playerKey = (p) => `${p.region}|${p.name}#${p.tag}`.toLowerCase();

// MetaTFT keeps comp clusters only for recent sets; older ones fall back to trait + carry.
const effectiveMode = () => (state.groupMode === 'cluster' && !state.clusters.length ? 'traitCarry' : state.groupMode);

// ---------- SEO & i18n DOM updates ----------

function updateMetaTags() {
  const p = state.player;
  const season = core.setLabel(state.set);
  const title = p ? t('playerMetaTitle', { name: p.name, tag: p.tag }) : t('metaTitle');
  const desc = p ? t('playerMetaDesc', { name: p.name, tag: p.tag, season: season ? `(${season})` : '' }) : t('metaDesc');

  document.title = title;

  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) descMeta.content = desc;

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.content = title;

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.content = desc;

  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) twitterTitle.content = title;

  const twitterDesc = document.querySelector('meta[name="twitter:description"]');
  if (twitterDesc) twitterDesc.content = desc;

  const ogLocale = document.querySelector('meta[property="og:locale"]');
  if (ogLocale) ogLocale.content = i18n.getLang() === 'vi' ? 'vi_VN' : 'en_US';
}

function applyTranslations() {
  updateMetaTags();
  document.documentElement.lang = i18n.getLang();
  $('lang-select').value = i18n.getLang();

  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const el of document.querySelectorAll('[data-i18n-ph]')) {
    el.placeholder = t(el.dataset.i18nPh);
  }
  for (const el of document.querySelectorAll('[data-i18n-title]')) {
    el.title = t(el.dataset.i18nTitle);
  }

  // Update min-games select
  const minSel = $('min-games');
  for (const opt of minSel.options) {
    opt.textContent = t('minGamesUnit', { n: opt.value });
  }

  // Update group-mode labels
  const groupSel = $('group-mode');
  for (const opt of groupSel.options) {
    if (opt.value === 'cluster') opt.textContent = t('groupCluster');
    else if (opt.value === 'traitCarry') opt.textContent = t('groupTraitCarry');
    else if (opt.value === 'carry') opt.textContent = t('groupCarry');
    else if (opt.value === 'trait') opt.textContent = t('groupTrait');
  }

  // Update queue labels
  const qRanked = $('queue').querySelector('option[value="1100"]');
  if (qRanked) qRanked.textContent = t('queueRanked');
  const qAll = $('queue').querySelector('option[value="all"]');
  if (qAll) qAll.textContent = t('queueAll');

  // Update patch 'all'
  const patchAll = $('patch').querySelector('option[value="all"]');
  if (patchAll) patchAll.textContent = t('patchAll');
}

// ---------- loading ----------

async function detectCurrentSet() {
  if (state.currentSet) return state.currentSet;
  try {
    const p = await api('/api/patch');
    const major = String(p.patch ?? '').split('.')[0];
    if (/^\d+$/.test(major)) state.currentSet = `TFTSet${major}`;
  } catch {
    /* caller falls back to the profile's own set */
  }
  return state.currentSet;
}

function getLookup(set, lang = i18n.getMetaTftLocale()) {
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

function getComps(set) {
  if (!compsCache.has(set)) compsCache.set(set, api(`/api/comps?queue=1100&set=${set}`).catch(() => null));
  return compsCache.get(set);
}

function profileQuery(p) {
  const region = core.REGIONS.find((r) => r.slug === p.region)?.api ?? 'VN2';
  return `region=${region}&name=${encodeURIComponent(p.name)}&tag=${encodeURIComponent(p.tag)}`;
}

async function load(player, { set = null, fresh = false, retried = false } = {}) {
  if (state.loading) return;
  state.loading = true;
  $('refresh').disabled = true;
  $('season').disabled = true;
  const samePlayer = !!state.player && playerKey(state.player) === playerKey(player);
  const current = await detectCurrentSet();
  let wanted = set ?? (samePlayer ? state.set : null) ?? current;
  setStatus(t('loadingPlayer', { season: wanted ? `${core.setLabel(wanted)} ` : '', name: player.name, tag: player.tag }));
  let retryAfterRefresh = false;
  try {
    const profile = await api(`/api/profile?${profileQuery(player)}${wanted ? `&set=${wanted}` : ''}${fresh ? '&fresh=1' : ''}`);
    wanted ??= profile.matches?.[0]?.tft_set ?? null;
    if (!wanted) throw new Error(t('determiningSeasonError'));
    const [setData, comps] = await Promise.all([getLookup(wanted, i18n.getMetaTftLocale()), getComps(wanted)]);

    if (!samePlayer) state.seasons = new Map();
    state.player = player;
    state.set = wanted;
    state.profile = profile;
    state.lk = core.buildLookups(setData);
    const compsSet = comps?.tft_set ?? comps?.results?.data?.tft_set;
    state.clusters = compsSet === wanted ? core.buildClusters(comps, state.lk) : [];
    state.all = core.processProfile(profile, state.lk, wanted);
    state.selected = null;
    state.matchLimit = PAGE;
    expandedMatchIds.clear();
    state.patch = state.pendingPatch ?? 'all';
    state.pendingPatch = null;

    for (const [s, byQueue] of Object.entries(profile.rating_history ?? {})) {
      state.seasons.set(s, byQueue?.[core.RANKED_QUEUE]?.rating_text ?? '');
    }
    state.seasons.set(wanted, profile.ranked?.rating_text ?? '');
    if (state.currentSet && !state.seasons.has(state.currentSet)) state.seasons.set(state.currentSet, '');
    renderSeasonOptions();

    $('group-mode').querySelector('option[value="cluster"]').disabled = state.clusters.length === 0;
    $('group-mode').value = effectiveMode();

    remember(player);
    setStatus(state.all.length ? null : t('noMatchesInSeason', { season: core.setLabel(wanted) }));
    render();
  } catch (err) {
    console.error(err);
    if (err.status === 404 && !retried) {
      retryAfterRefresh = true;
    } else {
      const msg =
        err.status === 404
          ? t('notFoundError', { name: player.name, tag: player.tag })
          : t('loadError', { msg: err.message });
      setStatus(msg, true);
    }
  } finally {
    state.loading = false;
    $('refresh').disabled = false;
    $('season').disabled = false;
  }
  if (retryAfterRefresh) await refreshPlayer(player, true);
}

function renderSeasonOptions() {
  const sel = $('season');
  const sets = [...state.seasons.keys()].sort((a, b) => core.setOrder(b) - core.setOrder(a));
  sel.innerHTML = sets
    .map((s) => {
      const rank = state.seasons.get(s);
      const isCur = s === state.currentSet;
      const tag = isCur ? ` (${i18n.getLang() === 'vi' ? 'mùa này' : 'current'})` : '';
      const rText = rank ? ` · ${rank}` : '';
      return `<option value="${s}">${esc(core.setLabel(s))}${tag}${esc(rText)}</option>`;
    })
    .join('');
  sel.value = state.set;
}

async function refreshPlayer(player = state.player, retried = false) {
  if (!player) return;
  const p = player;
  $('refresh').disabled = true;
  setStatus(t('requestingRefresh', { name: p.name, tag: p.tag }));
  try {
    for (const wait of [0, 4000, 8000, 12000]) {
      await sleep(wait);
      setStatus(t('requestingRefresh', { name: p.name, tag: p.tag }));
      const r = await api(`/api/refresh?${profileQuery(p)}`).catch((e) => (e.status === 404 ? { status: 'queued' } : Promise.reject(e)));
      if (r?.status !== 'queued') break;
    }
  } catch (err) {
    console.warn('refresh failed', err);
  }
  $('refresh').disabled = false;
  await load(p, { fresh: true, retried });
}

// The URL carries the whole view (player, season, filters, selected comp, language) so it can be shared.
function syncUrl() {
  if (!state.player) return;
  const url = new URL(location.href);
  const sp = url.searchParams;
  const put = (k, v, def) => (v == null || v === def ? sp.delete(k) : sp.set(k, v));
  sp.set('r', state.player.region);
  sp.set('id', `${state.player.name}#${state.player.tag}`);
  put('s', state.set, state.currentSet);
  put('g', state.groupMode, 'cluster');
  put('q', state.queue, '1100');
  put('p', state.patch, 'all');
  put('min', String(state.minGames), '1');
  put('lang', i18n.getLang(), i18n.DEFAULT_LANG);
  put('team', state.selected ? state.all.find((m) => m.compKey === state.selected)?.compLabel : null, null);
  history.replaceState(null, '', url);
}

const RECENT_SEARCHES_KEY = 'k-tft:recent-players';

function getRecentSearches() {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(player) {
  if (!player?.name || !player?.tag) return;
  try {
    const list = getRecentSearches().filter(
      (x) =>
        !(
          x.region === player.region &&
          x.name.toLowerCase() === player.name.toLowerCase() &&
          x.tag.toLowerCase() === player.tag.toLowerCase()
        )
    );
    list.unshift({
      region: player.region,
      name: player.name,
      tag: player.tag,
      icon: player.icon ?? null,
      rating: player.rating ?? null,
      games: player.games ?? null,
      time: Date.now(),
    });
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list.slice(0, 8)));
  } catch {
    /* storage unavailable */
  }
}

function removeRecentSearch(region, name, tag) {
  try {
    const list = getRecentSearches().filter(
      (x) =>
        !(
          x.region === region &&
          x.name.toLowerCase() === name.toLowerCase() &&
          x.tag.toLowerCase() === tag.toLowerCase()
        )
    );
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
}

function clearRecentSearches() {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    /* storage unavailable */
  }
}

function remember(p) {
  const id = `${p.name}#${p.tag}`;
  $('player').value = id;
  $('region').value = p.region;
  updateMetaTags();
  try {
    localStorage.setItem('k-tft:last', JSON.stringify({ region: p.region, id }));
  } catch {
    /* storage unavailable */
  }
  saveRecentSearch({
    region: p.region,
    name: p.name,
    tag: p.tag,
    icon: state.profile?.summoner?.profile_icon_id,
    rating: state.profile?.ranked?.rating_text,
    games: state.profile?.ranked?.num_games,
  });
}

function readInput() {
  const p = core.parsePlayerInput($('player').value, $('region').value);
  if (!p) {
    setStatus(t('invalidInput'), true);
    return null;
  }
  if (!core.REGIONS.some((r) => r.slug === p.region)) {
    setStatus(t('unsupportedServer', { region: p.region }), true);
    return null;
  }
  return p;
}

// ---------- derived data ----------

function assignColors() {
  const groups = core.aggregate(state.all).sort((a, b) => b.games - a.games || a.label.localeCompare(b.label));
  state.colors = new Map();
  groups.forEach((g, i) => {
    if (i < PALETTE.length) state.colors.set(g.key, PALETTE[i]);
  });
}

function filtered() {
  return state.all.filter(
    (m) => (state.queue === 'all' || m.queue === Number(state.queue)) && (state.patch === 'all' || m.patch === state.patch),
  );
}

// ---------- render ----------

function render() {
  applyTranslations();
  const mode = effectiveMode();
  core.classify(state.all, mode, state.clusters, t);
  assignColors();
  renderPatchOptions();
  const matches = filtered();
  const groups = core.aggregate(matches);
  if (state.pendingTeam) {
    state.selected = groups.find((g) => g.label === state.pendingTeam)?.key ?? null;
    state.pendingTeam = null;
  }
  if (state.selected && !groups.some((g) => g.key === state.selected)) state.selected = null;

  const season = core.setLabel(state.set);
  const tip = t('compsHint');
  $('comps-hint').textContent =
    mode === 'cluster'
      ? state.set === state.currentSet
        ? t('compsTipClusterCur', { season, tip })
        : t('compsTipClusterOld', { season, tip })
      : state.groupMode === 'cluster'
        ? t('compsTipFallback', { season, tip })
        : tip;

  for (const id of ['player-card', 'controls', 'comps-section', 'charts', 'matches-section']) $(id).hidden = false;
  renderPlayerCard(matches, groups);
  renderTable(groups);
  renderSelectionViews(matches, groups);
  syncUrl();
}

function applyRowSelection() {
  $('clear-sel').hidden = !state.selected;
  for (const tr of $('comps-table').tBodies[0].rows) {
    tr.classList.toggle('selected', tr.dataset.key === state.selected);
    tr.classList.toggle('dim', !!state.selected && tr.dataset.key !== state.selected);
  }
}

function renderSelectionViews(matches, groups) {
  applyRowSelection();
  renderLpChart(matches, groups);
  renderCumChart(groups);
  renderNetChart(groups);
  renderPlaceChart(matches, groups);
  renderSummary(matches, groups);
  renderMatches(matches);
}

function select(key) {
  state.selected = state.selected === key ? null : key;
  state.matchLimit = PAGE;
  const matches = filtered();
  renderSelectionViews(matches, core.aggregate(matches));
  syncUrl();
}

function renderPatchOptions() {
  const patches = [...new Set(state.all.map((m) => m.patch).filter(Boolean))].sort((a, b) =>
    b.localeCompare(a, undefined, { numeric: true }),
  );
  const sel = $('patch');
  sel.innerHTML = `<option value="all">${t('patchAll')}</option>${patches.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join('')}`;
  sel.value = patches.includes(state.patch) ? state.patch : 'all';
  state.patch = sel.value;
}

function tile(k, v, cls = '') {
  return `<div class="tile"><div class="v ${cls}">${v}</div><div class="k">${k}</div></div>`;
}

function renderPlayerCard(matches, groups) {
  const p = state.profile;
  const s = core.summarize(matches);
  const ranked = p.ranked ?? {};
  const currentTier = core.getRankTier(ranked.rating_text, ranked.rating_numeric);
  const sr = p.server_rank;
  const topVal = sr?.rank && sr?.total ? (sr.rank / sr.total) * 100 : null;
  const serverTier = core.getServerTopTier(topVal, sr?.rank);
  const locale = i18n.getLang() === 'vi' ? 'vi-VN' : 'en-US';
  const topPctText = topVal == null ? '' : `Top ${topVal < 0.01 ? '<0.01' : topVal < 0.1 ? '<0.1' : topVal.toFixed(1)}%`;

  let serverRankHtml = '';
  if (sr?.rank) {
    const formattedRank = sr.rank.toLocaleString(locale);
    const tooltip = sr.total
      ? t('serverRankTooltip', { rank: formattedRank, total: sr.total.toLocaleString(locale), top: topPctText })
      : `${t('serverRank', { rank: formattedRank })} (${topPctText})`;

    serverRankHtml = ` · <span class="server-standing-badge tier-${serverTier}" title="${esc(tooltip)}"><span class="server-standing-dot"></span><span class="server-rank-num">${t('serverRank', { rank: formattedRank })}</span>${topPctText ? `<span class="server-standing-sep">·</span><strong class="server-top-pct">${topPctText}</strong>` : ''}</span>`;
  }

  const [name, tag] = (p.summoner?.riot_id ?? `${state.player.name}#${state.player.tag}`).split('#');
  const seasonLabel = core.setLabel(state.set);
  const rankedShown = matches.filter((m) => m.queue === core.RANKED_QUEUE);
  const withLp = rankedShown.filter((m) => m.lpDelta != null).length;
  const rankedStored = state.all.filter((m) => m.queue === core.RANKED_QUEUE).length;
  const partial = ranked.num_games > rankedStored
    ? `<div class="sub">${t('partialNotice', { stored: rankedStored, total: ranked.num_games })}</div>`
    : '';

  const peakTier = ranked.peak_rating ? core.getRankTier(ranked.peak_rating, ranked.peak_rating_numeric) : null;
  const peakRankHtml = ranked.peak_rating
    ? `<div class="sub">${t('peakRank', { rank: `<span class="tier-val tier-${peakTier}">${esc(ranked.peak_rating)}</span>` })}</div>`
    : '';

  $('player-card').innerHTML = `
    <div class="player-id">
      <h1>${esc(name)} <small>#${esc(tag)}</small></h1>
      <div class="rank tier-${currentTier}">
        <span class="rank-dot"></span>
        <span class="rank-name">${esc(ranked.rating_text ?? t('unranked'))}</span>
      </div>
      <div class="sub">${esc(seasonLabel)} · ${t('rankedGamesCount', { n: ranked.num_games ?? 0 })}${serverRankHtml}</div>
      ${peakRankHtml}
      ${partial}
      ${rankedShown.length ? `<div class="sub" title="${t('lpDataNoticeTitle')}">${t('lpDataNotice', { withLp, total: rankedShown.length })}</div>` : ''}
    </div>
    <div class="tiles">
      ${tile(t('tileGames'), s.games)}
      ${tile(t('tileAvgPlace'), num(s.avgPlace))}
      ${tile(t('tileTop4'), pct(s.top4Rate))}
      ${tile(t('tileTop1'), pct(s.winRate))}
      ${tile(t('tileNetLp'), signed(s.lpNet), signCls(s.lpNet))}
      ${tile(t('tileNumComps'), groups.length)}
    </div>`;
}

function unitsHtml(units, size = '') {
  return units
    .map((u) => `<div class="unit c${u.cost}${size}" title="${esc(u.name)}"><img src="${esc(u.icon)}" alt="${esc(u.name)}" loading="lazy"></div>`)
    .join('');
}

function placesHtml(ms) {
  return [...ms]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 8)
    .map((m) => `<span class="pl ${m.placement === 1 ? 'p1' : m.placement <= 4 ? 'top4' : ''}">${m.placement}</span>`)
    .join('');
}

function renderTable(groups) {
  const { key, asc } = state.sort;
  const rows = groups
    .filter((g) => g.games >= state.minGames || g.key === state.selected)
    .sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      if (key === 'label') return asc ? va.localeCompare(vb) : vb.localeCompare(va);
      const x = va ?? -Infinity;
      const y = vb ?? -Infinity;
      return (asc ? x - y : y - x) || b.games - a.games;
    });

  for (const th of $('comps-table').tHead.rows[0].cells) {
    th.classList.toggle('sorted', th.dataset.sort === key);
    th.classList.toggle('asc', th.dataset.sort === key && asc);
  }

  $('comps-table').tBodies[0].innerHTML = rows.length
    ? rows
        .map(
          (g) => `
      <tr data-key="${esc(g.key)}">
        <td class="left">
          <div class="comp-cell">
            <div class="comp-name"><span class="dot" style="background:${colorOf(g.key)}"></span>${esc(g.label)}</div>
            <div class="units">${unitsHtml(g.coreUnits)}</div>
          </div>
        </td>
        <td>${g.games}</td>
        <td>${pct(g.winRate)}</td>
        <td>${pct(g.top4Rate)}</td>
        <td>${num(g.avgPlace)}</td>
        <td class="${signCls(g.lpGames ? g.lpNet : null)}">${g.lpGames ? signed(g.lpNet) : '—'}</td>
        <td class="${signCls(g.lpPerGame)}">${signed(g.lpPerGame, 1)}</td>
        <td class="left"><div class="places">${placesHtml(g.matches)}</div></td>
      </tr>`,
        )
        .join('')
    : `<tr><td colspan="8" class="left muted">${t('noCompsMatched')}</td></tr>`;
}

// ---------- charts ----------

function baseOptions(extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#2a2a28',
        borderColor: '#3a3a37',
        borderWidth: 1,
        titleColor: '#f0efec',
        bodyColor: TEXT2,
        padding: 10,
        cornerRadius: 6,
        boxPadding: 4,
      },
    },
    ...extra,
  };
}

function draw(id, config) {
  charts[id]?.destroy();
  charts[id] = new Chart($(id), config);
}

function renderLpChart(matches, groups) {
  const ranked = matches.filter((m) => m.queue === core.RANKED_QUEUE && m.lpAfter != null);
  const sel = state.selected;
  const selLabel = sel ? groups.find((g) => g.key === sel)?.label : null;
  $('lp-title').textContent = selLabel ? t('lpTitleComp', { name: selLabel }) : t('lpTitle');
  $('lp-hint').textContent = ranked.length
    ? t('lpHint')
    : t('lpHintEmpty');

  const present = groups.filter((g) => state.colors.has(g.key)).sort((a, b) => b.games - a.games);
  const hasOther = groups.some((g) => !state.colors.has(g.key));
  $('lp-legend').innerHTML =
    present
      .map(
        (g) =>
          `<button type="button" data-key="${esc(g.key)}" class="${sel === g.key ? 'active' : sel ? 'faded' : ''}"><span class="dot" style="background:${colorOf(g.key)}"></span>${esc(g.label)} <span class="muted">${g.games}</span></button>`,
      )
      .join('') + (hasOther ? `<span class="legend-other"><span class="dot" style="background:${OTHER};display:inline-block"></span> ${t('legendOther')}</span>` : '');

  const pts = ranked.map((m) => ({ x: m.gameNo, y: m.lpAfter, m }));
  const ys = pts.map((p) => p.y);
  const yMin = ys.length ? Math.floor((Math.min(...ys) - 20) / 100) * 100 : 0;
  const yMax = ys.length ? Math.ceil((Math.max(...ys) + 20) / 100) * 100 : 400;
  const isSel = (m) => !sel || m.compKey === sel;

  draw('lp-chart', {
    type: 'line',
    data: {
      datasets: [
        {
          data: pts,
          parsing: false,
          borderColor: LINE,
          borderWidth: 2,
          tension: 0,
          spanGaps: true,
          pointRadius: (c) => (sel ? (isSel(c.raw?.m ?? {}) ? 6 : 2.5) : 4),
          pointHoverRadius: 8,
          pointBackgroundColor: (c) => {
            const m = c.raw?.m;
            if (!m) return OTHER;
            return isSel(m) ? colorOf(m.compKey) : hexA(colorOf(m.compKey), 0.25);
          },
          pointBorderColor: SURFACE,
          pointBorderWidth: 1.5,
        },
      ],
    },
    options: baseOptions({
      interaction: { mode: 'nearest', intersect: false, axis: 'x' },
      onClick: (_e, els) => {
        const m = els[0] && pts[els[0].index]?.m;
        if (m) select(m.compKey);
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: t('lpAxisX'), color: '#8e8d86' },
          ticks: { precision: 0 },
          grid: { display: false },
        },
        y: {
          min: yMin,
          max: yMax,
          ticks: { stepSize: 100, callback: (v) => core.ratingTickLabel(v) },
          grid: { color: (c) => (c.tick.value % 400 === 0 ? GRID_STRONG : GRID) },
        },
      },
      plugins: {
        ...baseOptions().plugins,
        tooltip: {
          ...baseOptions().plugins.tooltip,
          callbacks: {
            title: (items) => {
              const m = items[0].raw.m;
              return t('tooltipMatch', { gameNo: m.gameNo, date: fmtDate(m.ts) });
            },
            label: (item) => {
              const m = item.raw.m;
              return ` ${m.compLabel}`;
            },
            labelColor: (item) => ({ backgroundColor: colorOf(item.raw.m.compKey), borderColor: colorOf(item.raw.m.compKey) }),
            afterLabel: (item) => {
              const m = item.raw.m;
              return [t('tooltipPlace', { place: m.placement }), `${core.ratingToText(m.lpAfter)}${m.lpDelta != null ? ` (${signed(m.lpDelta)} LP)` : ''}`];
            },
          },
        },
      },
    }),
  });
}

function renderCumChart(groups) {
  const sel = state.selected;
  const shown = groups
    .filter((g) => (state.colors.has(g.key) || g.key === sel) && g.lpGames > 0)
    .sort((a, b) => b.games - a.games);

  const datasets = shown.map((g) => {
    let cum = 0;
    const data = [{ x: 0, y: 0 }];
    let k = 0;
    for (const m of [...g.matches].sort((a, b) => a.ts - b.ts)) {
      if (m.lpDelta == null) continue;
      cum += m.lpDelta;
      data.push({ x: ++k, y: cum, m });
    }
    const on = !sel || g.key === sel;
    const color = colorOf(g.key);
    return {
      label: g.label,
      data,
      parsing: false,
      borderColor: on ? color : hexA(color, 0.2),
      backgroundColor: on ? color : hexA(color, 0.2),
      borderWidth: g.key === sel ? 3 : 2,
      pointRadius: g.key === sel ? 3 : 0,
      pointHoverRadius: 5,
      pointBorderColor: SURFACE,
      tension: 0,
      order: g.key === sel ? 0 : 1,
    };
  });

  draw('cum-chart', {
    type: 'line',
    data: { datasets },
    options: baseOptions({
      interaction: { mode: 'nearest', intersect: false },
      onClick: (_e, els) => {
        const ds = els[0] && shown[els[0].datasetIndex];
        if (ds) select(ds.key);
      },
      scales: {
        x: {
          type: 'linear',
          min: 0,
          title: { display: true, text: t('cumAxisX'), color: '#8e8d86' },
          ticks: { precision: 0 },
          grid: { display: false },
        },
        y: {
          title: { display: true, text: t('cumAxisY'), color: '#8e8d86' },
          grid: { color: (c) => (c.tick.value === 0 ? GRID_STRONG : GRID) },
        },
      },
      plugins: {
        ...baseOptions().plugins,
        legend: {
          display: true,
          position: 'bottom',
          labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8, color: TEXT2 },
          onClick: (_e, item) => select(shown[item.datasetIndex].key),
        },
        tooltip: {
          ...baseOptions().plugins.tooltip,
          callbacks: {
            title: (items) => items[0].dataset.label,
            label: (item) => {
              const m = item.raw.m;
              if (!m) return t('cumStart');
              return t('cumTooltip', { x: item.raw.x, y: signed(item.raw.y), delta: signed(m.lpDelta), place: m.placement });
            },
          },
        },
      },
    }),
  });
}

function renderNetChart(groups) {
  const sel = state.selected;
  const rows = groups
    .filter((g) => g.lpGames > 0 && (g.games >= state.minGames || g.key === sel))
    .sort((a, b) => b.lpNet - a.lpNet)
    .slice(0, 16);
  $('net-chart').parentElement.style.height = `${Math.max(240, rows.length * 28 + 50)}px`;

  draw('net-chart', {
    type: 'bar',
    data: {
      labels: rows.map((g) => g.label),
      datasets: [
        {
          data: rows.map((g) => g.lpNet),
          backgroundColor: rows.map((g) => {
            const c = g.lpNet >= 0 ? POS : NEG;
            return !sel || g.key === sel ? c : hexA(c, 0.25);
          }),
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 18,
        },
      ],
    },
    options: baseOptions({
      indexAxis: 'y',
      onClick: (_e, els) => {
        const g = els[0] && rows[els[0].index];
        if (g) select(g.key);
      },
      scales: {
        x: { grid: { color: (c) => (c.tick.value === 0 ? GRID_STRONG : GRID) }, title: { display: true, text: t('netAxisX'), color: '#8e8d86' } },
        y: { grid: { display: false }, ticks: { autoSkip: false } },
      },
      plugins: {
        ...baseOptions().plugins,
        tooltip: {
          ...baseOptions().plugins.tooltip,
          callbacks: {
            label: (item) => {
              const g = rows[item.dataIndex];
              return t('netTooltip', { net: signed(g.lpNet), games: g.lpGames, perGame: signed(g.lpPerGame, 1) });
            },
          },
        },
      },
    }),
  });
}

function renderPlaceChart(matches, groups) {
  const g = state.selected ? groups.find((x) => x.key === state.selected) : null;
  const ms = g ? g.matches : matches;
  const counts = [0, 0, 0, 0, 0, 0, 0, 0];
  for (const m of ms) counts[m.placement - 1]++;
  const color = g ? colorOf(g.key) : PALETTE[0];
  $('place-title').textContent = g ? t('placeTitleComp', { name: g.label }) : t('placeTitle');
  $('place-hint').textContent = t('placeHint', { n: ms.length });

  draw('place-chart', {
    type: 'bar',
    data: {
      labels: ['1', '2', '3', '4', '5', '6', '7', '8'],
      datasets: [{ data: counts, backgroundColor: color, borderRadius: { topLeft: 4, topRight: 4 }, borderSkipped: 'bottom', maxBarThickness: 36 }],
    },
    options: baseOptions({
      scales: {
        x: { grid: { display: false }, title: { display: true, text: t('placeAxisX'), color: '#8e8d86' } },
        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: GRID } },
      },
      plugins: {
        ...baseOptions().plugins,
        tooltip: {
          ...baseOptions().plugins.tooltip,
          displayColors: false,
          callbacks: {
            title: (items) => t('placeTooltipTitle', { place: items[0].label }),
            label: (item) => t('placeTooltipLabel', { count: item.raw, pct: pct(ms.length ? item.raw / ms.length : 0) }),
          },
        },
      },
    }),
  });
}

function renderSummary(matches, groups) {
  const g = state.selected ? groups.find((x) => x.key === state.selected) : null;
  const ms = g ? g.matches : matches;
  const s = core.summarize(ms);
  const lpGames = ms.filter((m) => m.lpDelta != null).length;
  const cluster = g && effectiveMode() === 'cluster' ? state.clusters.find((c) => c.key === g.key) : null;
  const first = ms.length ? Math.min(...ms.map((m) => m.ts)) : null;
  const last = ms.length ? Math.max(...ms.map((m) => m.ts)) : null;

  $('sum-hint').textContent = g ? g.label : t('summaryHintAll');
  $('sel-summary').innerHTML = [
    tile(t('tileGames'), s.games),
    tile(t('tileTop1'), pct(s.winRate)),
    tile(t('tileTop4'), pct(s.top4Rate)),
    tile(t('tileAvgPlace'), num(s.avgPlace)),
    tile(t('tileNetLp'), signed(s.lpNet), signCls(s.lpNet)),
    tile(t('tileLpPerGame'), lpGames ? signed(s.lpNet / lpGames, 1) : '—', signCls(lpGames ? s.lpNet : null)),
    cluster?.metaAvg ? tile(t('tileMetaAvg'), num(cluster.metaAvg)) : '',
    first ? tile(t('tileFirstPlayed'), fmtDate(first)) : '',
    last ? tile(t('tileLastPlayed'), fmtDate(last)) : '',
  ].join('');
}

// ---------- match list ----------

function boardHtml(units) {
  return [...units]
    .sort((a, b) => b.cost - a.cost || b.tier - a.tier)
    .map((u) => {
      const items = u.items
        .map((id) => {
          const it = core.itemInfo(state.lk, id);
          return `<img src="${esc(it.icon)}" alt="${esc(it.name)}" title="${esc(it.name)}" loading="lazy">`;
        })
        .join('');
      return `<div class="unit c${u.cost}" title="${esc(u.name)}">
        <div class="stars s${u.tier}">${'★'.repeat(Math.min(u.tier, 4))}</div>
        <img src="${esc(u.icon)}" alt="${esc(u.name)}" loading="lazy">
        <div class="items">${items}</div>
      </div>`;
    })
    .join('');
}

async function fetchMatchData(matchId) {
  if (matchDetailsCache.has(matchId)) return matchDetailsCache.get(matchId);
  const matchObj = state.all.find((m) => m.id === matchId);
  const candidateUrls = [];
  if (matchObj?.matchDataUrl) candidateUrls.push(matchObj.matchDataUrl);
  candidateUrls.push(`https://matches3.metatft.com/${encodeURIComponent(matchId)}.json`);

  let lastErr = null;
  // Try direct CDN URLs first (CORS allowed on matches3.metatft.com)
  for (const url of candidateUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        matchDetailsCache.set(matchId, json);
        return json;
      }
    } catch (e) {
      lastErr = e;
    }
  }

  // Fallback to local / server proxy api if direct fetch fails (e.g. adblock blocking metatft.com)
  try {
    const json = await api(`/api/match?id=${encodeURIComponent(matchId)}`);
    matchDetailsCache.set(matchId, json);
    return json;
  } catch (apiErr) {
    throw lastErr || apiErr;
  }
}

function renderLobbyHtml(matchData, matchId) {
  const participants = (matchData?.info?.participants || []).slice().sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99));
  if (!participants.length) {
    return `<div class="lobby-empty">${t('matchLoadError')}</div>`;
  }

  const selfName = state.player?.name?.trim().toLowerCase();
  const selfTag = state.player?.tag?.trim().toLowerCase();

  const rows = participants
    .map((p) => {
      const pName = (p.riotIdGameName || '').trim();
      const pTag = (p.riotIdTagline || '').trim();
      const isSelf =
        selfName &&
        selfTag &&
        pName.toLowerCase() === selfName &&
        pTag.toLowerCase() === selfTag;

      const pUnits = (p.units || []).map((u) => {
        const uInfo = core.unitInfo ? core.unitInfo(state.lk, u.character_id) : null;
        return {
          id: u.character_id || '',
          name: uInfo?.name || u.character_id || '',
          cost: uInfo?.cost ?? 0,
          icon: uInfo?.icon || '',
          tier: u.tier || 1,
          items: Array.isArray(u.itemNames) ? u.itemNames : [],
        };
      });

      const activeTraits = (p.traits || [])
        .filter((tr) => (tr.style ?? 0) > 0)
        .sort((a, b) => (b.style ?? 0) - (a.style ?? 0) || (b.num_units ?? 0) - (a.num_units ?? 0));

      const traitsHtml = activeTraits
        .map((tr) => {
          const trInfo = (core.traitInfo ? core.traitInfo(state.lk, tr.name) : null) || {
            name: tr.name,
            icon: `https://cdn.metatft.com/file/metatft/traits/${(tr.name || '').toLowerCase()}.png`,
          };
          return `<span class="trait-pill style-${tr.style ?? 1}" title="${esc(trInfo.name)} (${tr.num_units ?? 1})">
            <img src="${esc(trInfo.icon)}" alt="${esc(trInfo.name)}" loading="lazy">
            <span class="trait-num">${tr.num_units ?? 1}</span>
          </span>`;
        })
        .join('');

      const roundText = p.last_round ? (core.formatRound ? core.formatRound(p.last_round) : `R${p.last_round}`) : '';
      const goldText = p.gold_left != null ? t('matchGold', { gold: p.gold_left }) : '';
      const dmgText = p.total_damage_to_players ? t('matchDamage', { dmg: p.total_damage_to_players }) : '';

      const nameHtml = isSelf
        ? `<span class="player-name-text">${esc(pName)} <small>#${esc(pTag)}</small></span> <span class="self-badge">${t('matchSelfTag')}</span>`
        : `<button type="button" class="player-link" data-name="${esc(pName)}" data-tag="${esc(pTag)}" title="${esc(t('matchViewProfile', { name: pName, tag: pTag }))}">${esc(pName)} <small>#${esc(pTag)}</small></button>`;

      const place = p.placement ?? '?';
      const playerHtml = `
        <div class="lobby-player ${isSelf ? 'is-self' : ''}">
          <div class="place-badge ${place === 1 ? 'p1' : place <= 4 ? 'top4' : ''}">${place}</div>
          <div class="player-col">
            <div class="player-identity">${nameHtml}</div>
            <div class="player-stats">
              <span class="stat-lvl">${t('matchLvl', { lvl: p.level ?? '?' })}</span>
              ${roundText ? `<span class="stat-round">${t('matchRound', { round: roundText })}</span>` : ''}
              ${goldText ? `<span class="stat-gold">${goldText}</span>` : ''}
              ${dmgText ? `<span class="stat-dmg">${dmgText}</span>` : ''}
            </div>
          </div>
          <div class="lobby-board-col">
            <div class="board">${boardHtml(pUnits)}</div>
          </div>
          <div class="lobby-traits-col">
            <div class="player-traits">${traitsHtml}</div>
          </div>
        </div>`;

      if (p.placement === 4) {
        return playerHtml + `<div class="lobby-rank-split"><span class="top4-pill">${t('lobbyTop4')}</span><span class="split-line"></span><span class="bot4-pill">${t('lobbyBot4')}</span></div>`;
      }
      return playerHtml;
    })
    .join('');

  return `
    <div class="lobby-container">
      <div class="lobby-header">
        <h4>${t('matchLobbyTitle')}</h4>
      </div>
      <div class="lobby-subhead">
        <span class="lsh-rank">${t('lobbyColRank')}</span>
        <span class="lsh-player">${t('lobbyColPlayer')}</span>
        <span class="lsh-board">${t('lobbyColBoard')}</span>
        <span class="lsh-traits">${t('lobbyColTraits')}</span>
      </div>
      <div class="lobby-list">${rows}</div>
    </div>`;
}

async function toggleMatch(matchId, matchItem) {
  if (!matchId || !matchItem) return;
  const panel = matchItem.querySelector('.match-detail-panel');
  const summary = matchItem.querySelector('.match-summary');
  if (!panel || !summary) return;

  const isOpen = !panel.hidden;
  if (isOpen) {
    expandedMatchIds.delete(matchId);
    panel.hidden = true;
    matchItem.classList.remove('open');
    summary.setAttribute('aria-expanded', 'false');
    summary.setAttribute('title', t('matchClickToExpand'));
  } else {
    expandedMatchIds.add(matchId);
    panel.hidden = false;
    matchItem.classList.add('open');
    summary.setAttribute('aria-expanded', 'true');
    summary.setAttribute('title', t('matchClickToCollapse'));

    if (matchDetailsCache.has(matchId)) {
      try {
        panel.innerHTML = renderLobbyHtml(matchDetailsCache.get(matchId), matchId);
      } catch (renderErr) {
        console.error('Render lobby error:', renderErr);
        panel.innerHTML = `<div class="lobby-error"><span>${t('matchLoadError')}</span></div>`;
      }
    } else {
      panel.innerHTML = `
        <div class="lobby-loading">
          <div class="spinner"></div>
          <span>${t('matchLoadingDetails')}</span>
        </div>`;
      try {
        const data = await fetchMatchData(matchId);
        if (expandedMatchIds.has(matchId)) {
          panel.innerHTML = renderLobbyHtml(data, matchId);
        }
      } catch (err) {
        console.error('Failed to load match details:', err);
        if (expandedMatchIds.has(matchId)) {
          panel.innerHTML = `
            <div class="lobby-error">
              <span>${t('matchLoadError')}</span>
              <button type="button" class="btn-retry ghost" data-retry-match-id="${esc(matchId)}">${t('matchRetry')}</button>
            </div>`;
        }
      }
    }
  }
}

async function retryMatch(matchId, matchItem) {
  if (!matchId || !matchItem) return;
  const panel = matchItem.querySelector('.match-detail-panel');
  if (!panel) return;
  panel.innerHTML = `
    <div class="lobby-loading">
      <div class="spinner"></div>
      <span>${t('matchLoadingDetails')}</span>
    </div>`;
  try {
    const data = await fetchMatchData(matchId);
    panel.innerHTML = renderLobbyHtml(data, matchId);
  } catch (err) {
    console.error('Retry failed:', err);
    panel.innerHTML = `
      <div class="lobby-error">
        <span>${t('matchLoadError')}</span>
        <button type="button" class="btn-retry ghost" data-retry-match-id="${esc(matchId)}">${t('matchRetry')}</button>
      </div>`;
  }
}

function renderMatches(matches) {
  const sel = state.selected;
  const list = matches.filter((m) => !sel || m.compKey === sel).sort((a, b) => b.ts - a.ts);
  const label = sel ? list[0]?.compLabel : null;
  $('matches-title').textContent = sel
    ? t('matchesTitleComp', { name: label, count: list.length })
    : t('matchesTitleCount', { count: list.length });

  const rows = list.slice(0, state.matchLimit).map((m) => {
    let lp = '<div class="after muted">—</div>';
    if (m.queue === core.RANKED_QUEUE) {
      const delta = m.lpDelta != null
        ? `<div class="delta ${signCls(m.lpDelta)}">${signed(m.lpDelta)} LP</div>`
        : m.lpPending
          ? `<div class="delta muted">${t('lpPending')}</div>`
          : '';
      const afterText = core.ratingToText(m.lpAfter);
      const afterTier = core.getRankTier(afterText, m.lpAfter);
      lp = `${delta}<div class="after tier-${afterTier}">${esc(afterText)}</div>`;
    }

    const mId = m.id || '';
    const isExpanded = !!mId && expandedMatchIds.has(mId);
    let detailContent = '';
    if (isExpanded) {
      if (matchDetailsCache.has(mId)) {
        detailContent = renderLobbyHtml(matchDetailsCache.get(mId), mId);
      } else {
        detailContent = `
          <div class="lobby-loading">
            <div class="spinner"></div>
            <span>${t('matchLoadingDetails')}</span>
          </div>`;
      }
    }

    const titleAttr = mId ? (isExpanded ? t('matchClickToCollapse') : t('matchClickToExpand')) : '';
    const chevronSvg = mId
      ? `<span class="match-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>`
      : '';

    return `
      <div class="match-item ${isExpanded ? 'open' : ''}" data-match-id="${esc(mId)}">
        <div class="match-summary ${mId ? 'is-expandable' : ''}" role="${mId ? 'button' : 'group'}" tabindex="${mId ? '0' : '-1'}" aria-expanded="${isExpanded ? 'true' : 'false'}" title="${esc(titleAttr)}">
          <div class="place-badge ${m.placement === 1 ? 'p1' : m.placement <= 4 ? 'top4' : ''}">${m.placement}</div>
          <div class="meta">
            <span class="comp"><span class="dot" style="background:${colorOf(m.compKey)}"></span>${esc(m.compLabel)}</span>
            <span>${esc(core.queueLabel(m.queue, t))} · ${esc(m.patch)}${m.gameNo ? ` · #${m.gameNo}` : ''}</span>
            <span>${fmtDate(m.ts)} · ${fmtDuration(m.duration)} · Lv ${m.level ?? '?'}</span>
          </div>
          <div class="board">${boardHtml(m.units)}</div>
          <div class="match-right">
            <div class="lp">${lp}</div>
            ${chevronSvg}
          </div>
        </div>
        <div class="match-detail-panel" ${isExpanded ? '' : 'hidden'}>
          ${detailContent}
        </div>
      </div>`;
  });

  const more = list.length > state.matchLimit
    ? `<button type="button" class="ghost more" id="more-matches">${t('viewMoreMatches', { count: list.length - state.matchLimit })}</button>`
    : '';
  $('matches').innerHTML = rows.join('') + more || `<p class="muted">${t('noMatches')}</p>`;
}

// ---------- wiring ----------

function setupAutocomplete() {
  const inputEl = $('player');
  const dropdownEl = $('autocomplete-dropdown');
  const regionEl = $('region');
  if (!inputEl || !dropdownEl) return;

  let activeIndex = -1;
  let currentResults = [];
  let isRecentMode = false;
  let debounceTimer = null;
  const searchCache = new Map();

  function openDropdown() {
    dropdownEl.hidden = false;
  }

  function closeDropdown() {
    dropdownEl.hidden = true;
    activeIndex = -1;
    currentResults = [];
    isRecentMode = false;
  }

  function updateActiveItem(scroll = true) {
    const items = dropdownEl.querySelectorAll('.ac-item');
    items.forEach((el, i) => {
      el.classList.toggle('active', i === activeIndex);
    });
    if (scroll && activeIndex >= 0 && items[activeIndex]) {
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  function selectItem(item) {
    const regionSlug = core.regionToSlug(item.region);
    regionEl.value = regionSlug;
    inputEl.value = `${item.name}#${item.tag}`;
    closeDropdown();
    saveRecentSearch({
      region: regionSlug,
      name: item.name,
      tag: item.tag,
      icon: item.icon,
      rating: item.rating,
      games: item.games,
    });
    load({ region: regionSlug, name: item.name, tag: item.tag });
  }

  function renderRecent() {
    const recent = getRecentSearches();
    currentResults = recent;
    isRecentMode = true;
    activeIndex = -1;

    if (!recent.length) {
      dropdownEl.innerHTML = `<div class="ac-message">${esc(t('searchEmptyHint'))}</div>`;
      openDropdown();
      return;
    }

    const itemsHtml = recent
      .map(
        (item, i) => `
        <div class="ac-item" data-idx="${i}">
          <img class="ac-avatar" src="https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${item.icon || 29}.jpg" onerror="this.onerror=null;this.src='favicon.svg'" alt="" loading="lazy">
          <div class="ac-info">
            <div class="ac-name-row">
              <span class="ac-name">${esc(item.name)}</span>
              <span class="ac-tag">#${esc(item.tag)}</span>
            </div>
            ${item.rating ? `<div class="ac-detail-row"><span class="ac-tier" style="color:${core.getTierColor(item.rating)}">${esc(item.rating)}</span>${item.games ? `<span class="ac-games">· ${esc(t('searchGamesCount', { n: item.games }))}</span>` : ''}</div>` : ''}
          </div>
          <span class="ac-region">${esc(core.regionToLabel(item.region))}</span>
          <button type="button" class="ac-remove" data-remove-idx="${i}" title="${esc(t('clearSel'))}">&times;</button>
        </div>`
      )
      .join('');

    dropdownEl.innerHTML = `
      <div class="ac-header">
        <span>${esc(t('searchRecentTitle'))}</span>
        <button type="button" id="ac-clear-recent">${esc(t('searchClearRecent'))}</button>
      </div>
      ${itemsHtml}
    `;
    openDropdown();
  }

  function renderSearchResults(items, query) {
    currentResults = items;
    isRecentMode = false;
    activeIndex = -1;

    if (!items.length) {
      dropdownEl.innerHTML = `<div class="ac-message">${esc(t('searchNoResults'))}</div>`;
      openDropdown();
      return;
    }

    const itemsHtml = items
      .map(
        (item, i) => `
        <div class="ac-item" data-idx="${i}">
          <img class="ac-avatar" src="https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${item.icon || 29}.jpg" onerror="this.onerror=null;this.src='favicon.svg'" alt="" loading="lazy">
          <div class="ac-info">
            <div class="ac-name-row">
              <span class="ac-name">${esc(item.name)}</span>
              <span class="ac-tag">#${esc(item.tag)}</span>
            </div>
            ${item.rating ? `<div class="ac-detail-row"><span class="ac-tier" style="color:${core.getTierColor(item.rating)}">${esc(item.rating)}</span>${item.games ? `<span class="ac-games">· ${esc(t('searchGamesCount', { n: item.games }))}</span>` : ''}</div>` : ''}
          </div>
          <span class="ac-region">${esc(core.regionToLabel(item.region))}</span>
        </div>`
      )
      .join('');

    dropdownEl.innerHTML = `
      <div class="ac-header">
        <span>${esc(t('searchSuggestedTitle'))} (${items.length})</span>
      </div>
      ${itemsHtml}
    `;
    openDropdown();
  }

  function renderLoading() {
    dropdownEl.innerHTML = `
      <div class="ac-message">
        <div class="ac-spinner"></div>
        <span>${esc(t('searchSearching'))}</span>
      </div>
    `;
    openDropdown();
  }

  async function triggerSearch(q) {
    const trimmed = q.trim();
    if (!trimmed) {
      renderRecent();
      return;
    }
    const urlMatch = /metatft\.com\/player\/([a-z0-9]+)\/([^/?#]+)/i.exec(trimmed);
    if (urlMatch) {
      closeDropdown();
      return;
    }

    // Handle user typing "Name#Tag" or "Name#"
    const hashIdx = trimmed.indexOf('#');
    const searchName = (hashIdx >= 0 ? trimmed.slice(0, hashIdx) : trimmed).trim();
    const filterTag = (hashIdx >= 0 ? trimmed.slice(hashIdx + 1) : '').trim().toLowerCase();

    if (searchName.length < 2) {
      renderRecent();
      return;
    }

    const cacheKey = searchName.toLowerCase();
    const curRegionSlug = regionEl.value.toLowerCase();
    const curRegionApi = core.REGIONS.find((r) => r.slug === curRegionSlug)?.api?.toLowerCase() || '';

    function processAndRender(rawList) {
      const mapped = rawList
        .map((raw) => {
          const riotId = String(raw.riot_id || raw.name || '');
          const hIdx = riotId.lastIndexOf('#');
          const name = hIdx > 0 ? riotId.slice(0, hIdx).trim() : riotId.trim();
          const tag = hIdx > 0 ? riotId.slice(hIdx + 1).trim() : '';
          const rawRegion = String(raw.region || '').toLowerCase();
          const slug = core.regionToSlug(rawRegion);
          return {
            rawRegion,
            region: slug,
            name,
            tag,
            icon: raw.profile_icon_id ?? null,
            rating: raw.rating || null,
            games: raw.rating_num_played ?? null,
          };
        })
        .filter((x) => x.name && x.tag);

      // If user typed a tag, prioritize or filter matching tag
      let filtered = mapped;
      if (filterTag) {
        const tagMatches = mapped.filter((x) => x.tag.toLowerCase().startsWith(filterTag));
        if (tagMatches.length) filtered = tagMatches;
      }

      filtered.sort((a, b) => {
        const aMatches = a.rawRegion === curRegionApi || a.region === curRegionSlug;
        const bMatches = b.rawRegion === curRegionApi || b.region === curRegionSlug;
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        const aScore = (a.games || 0) + (a.rating ? 50 : 0);
        const bScore = (b.games || 0) + (b.rating ? 50 : 0);
        return bScore - aScore;
      });

      const top10 = filtered.slice(0, 10);
      searchCache.set(cacheKey, rawList);
      renderSearchResults(top10, trimmed);
    }

    if (searchCache.has(cacheKey)) {
      processAndRender(searchCache.get(cacheKey));
      return;
    }

    renderLoading();

    try {
      const res = await api(`/api/search?q=${encodeURIComponent(searchName)}`);
      const rawList = Array.isArray(res) ? res : res?.data || res?.results || [];
      processAndRender(rawList);
    } catch (err) {
      console.warn('Search error:', err);
      dropdownEl.innerHTML = `<div class="ac-message">${esc(t('searchNoResults'))}</div>`;
      openDropdown();
    }
  }

  inputEl.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = inputEl.value;
    if (!q.trim()) {
      renderRecent();
    } else {
      debounceTimer = setTimeout(() => triggerSearch(q), 200);
    }
  });

  inputEl.addEventListener('focus', () => {
    const q = inputEl.value;
    if (!q.trim()) {
      renderRecent();
    } else {
      triggerSearch(q);
    }
  });

  inputEl.addEventListener('click', () => {
    if (dropdownEl.hidden) {
      const q = inputEl.value;
      if (!q.trim()) renderRecent();
      else triggerSearch(q);
    }
  });

  inputEl.addEventListener('keydown', (e) => {
    if (dropdownEl.hidden) {
      if (e.key === 'ArrowDown') {
        const q = inputEl.value;
        if (!q.trim()) renderRecent();
        else triggerSearch(q);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!currentResults.length) return;
      activeIndex = (activeIndex + 1) % currentResults.length;
      updateActiveItem(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!currentResults.length) return;
      activeIndex = (activeIndex - 1 + currentResults.length) % currentResults.length;
      updateActiveItem(true);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && currentResults[activeIndex]) {
        e.preventDefault();
        selectItem(currentResults[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown();
    }
  });

  dropdownEl.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.ac-remove');
    if (removeBtn) {
      e.stopPropagation();
      const idx = Number(removeBtn.dataset.removeIdx);
      const item = currentResults[idx];
      if (item) {
        removeRecentSearch(item.region, item.name, item.tag);
        renderRecent();
      }
      return;
    }
    const clearBtn = e.target.closest('#ac-clear-recent');
    if (clearBtn) {
      e.stopPropagation();
      clearRecentSearches();
      renderRecent();
      return;
    }
    const itemEl = e.target.closest('.ac-item');
    if (itemEl) {
      const idx = Number(itemEl.dataset.idx);
      const item = currentResults[idx];
      if (item) selectItem(item);
    }
  });

  dropdownEl.addEventListener('mousemove', (e) => {
    const itemEl = e.target.closest('.ac-item');
    if (itemEl) {
      const idx = Number(itemEl.dataset.idx);
      if (idx !== activeIndex && !isNaN(idx)) {
        activeIndex = idx;
        updateActiveItem(false);
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-input-wrap')) {
      closeDropdown();
    }
  });
}

const LANG_CONFIG = {
  vi: {
    label: 'Tiếng Việt',
    emoji: '🇻🇳',
    svg: `<svg class="flag-icon" viewBox="0 0 640 480" width="18" height="13.5"><rect width="640" height="480" fill="#da251d"/><polygon points="320,80 367,225 519,225 396,314 443,459 320,370 197,459 244,314 121,225 273,225" fill="#ff0"/></svg>`,
  },
  en: {
    label: 'English',
    emoji: '🇬🇧',
    svg: `<svg class="flag-icon" viewBox="0 0 640 480" width="18" height="13.5"><path fill="#012169" d="M0 0h640v480H0z"/><path fill="#FFF" d="m75 0 245 184L565 0h75v48l-245 184 245 184v64h-75L320 296 75 480H0v-48l245-184L0 64V0h75z"/><path fill="#C8102E" d="m424 288 216 162v30h-40L384 318zm176-288L384 162l40 30 216-162zM0 480l216-162-40-30L0 450zm0-440 216 162 40-30L40 10H0z"/><path fill="#FFF" d="M256 0h128v480H256zM0 176h640v128H0z"/><path fill="#C8102E" d="M280 0h80v480h-80zM0 200h640v80H0z"/></svg>`,
  },
};

function setupLanguageDropdown() {
  const dropdown = $('lang-dropdown');
  const btn = $('lang-btn');
  const menu = $('lang-menu');
  const flagEl = $('current-lang-flag');
  const labelEl = $('current-lang-label');
  const emojiEl = document.querySelector('.lang-btn .lang-emoji');
  const selectEl = $('lang-select');
  if (!dropdown || !btn || !menu) return;

  function updateUi(lang) {
    const cfg = LANG_CONFIG[lang] || LANG_CONFIG.vi;
    if (flagEl) flagEl.innerHTML = cfg.svg;
    if (emojiEl) emojiEl.textContent = cfg.emoji;
    if (labelEl) labelEl.textContent = cfg.label;
    menu.querySelectorAll('.lang-opt').forEach((opt) => {
      const isSelected = opt.dataset.lang === lang;
      opt.classList.toggle('selected', isSelected);
    });
  }

  function toggleMenu(show) {
    const isHidden = typeof show === 'boolean' ? !show : !menu.hidden;
    menu.hidden = isHidden;
    dropdown.classList.toggle('open', !isHidden);
    btn.setAttribute('aria-expanded', String(!isHidden));
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  menu.addEventListener('click', (e) => {
    const opt = e.target.closest('.lang-opt');
    if (!opt) return;
    const chosen = opt.dataset.lang;
    if (chosen && chosen !== i18n.getLang()) {
      if (selectEl) {
        selectEl.value = chosen;
        selectEl.dispatchEvent(new Event('change'));
      } else {
        i18n.setLang(chosen);
        applyTranslations();
      }
      updateUi(chosen);
    }
    toggleMenu(false);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.lang-dropdown')) {
      toggleMenu(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      toggleMenu(false);
    }
  });

  updateUi(i18n.getLang());
  return { updateUi };
}

function init() {
  Chart.defaults.color = TEXT2;
  Chart.defaults.borderColor = GRID;
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;

  // Initialize version watermark & badges
  document.querySelectorAll('.app-version').forEach((el) => {
    el.textContent = `v${core.APP_VERSION}`;
  });

  // Language dropdown
  const langUi = setupLanguageDropdown();
  $('lang-select').value = i18n.getLang();
  $('lang-select').addEventListener('change', async (e) => {
    const newLang = e.target.value;
    i18n.setLang(newLang);
    langUi?.updateUi(newLang);
    applyTranslations();

    if (state.set && state.player) {
      try {
        const setData = await getLookup(state.set, i18n.getMetaTftLocale());
        state.lk = core.buildLookups(setData);
        const comps = await getComps(state.set);
        const compsSet = comps?.tft_set ?? comps?.results?.data?.tft_set;
        state.clusters = compsSet === state.set ? core.buildClusters(comps, state.lk) : [];
        state.all = core.processProfile(state.profile, state.lk, state.set);
      } catch (err) {
        console.warn('Reloading localized lookups error:', err);
      }
    }
    renderSeasonOptions();
    render();
  });

  applyTranslations();

  $('region').innerHTML = core.REGIONS.map((r) => `<option value="${r.slug}">${r.label}</option>`).join('');
  $('group-mode').innerHTML = Object.entries(core.GROUP_MODES)
    .map(([k]) => `<option value="${k}">${esc(t(`group${k[0].toUpperCase()}${k.slice(1)}`))}</option>`)
    .join('');
  $('group-mode').value = state.groupMode;

  setupAutocomplete();

  $('search').addEventListener('submit', (e) => {
    e.preventDefault();
    $('autocomplete-dropdown').hidden = true;
    const p = readInput();
    if (p) load(p);
  });
  $('refresh').addEventListener('click', () => refreshPlayer());

  $('season').addEventListener('change', (e) => {
    if (state.player) load(state.player, { set: e.target.value });
  });
  $('copy-link').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    try {
      await navigator.clipboard.writeText(location.href);
      btn.textContent = t('linkCopied');
    } catch {
      btn.textContent = t('linkCopyFailed');
    }
    setTimeout(() => (btn.textContent = t('copyLink')), 1500);
  });
  $('group-mode').addEventListener('change', (e) => {
    state.groupMode = e.target.value;
    state.selected = null;
    render();
  });
  $('queue').addEventListener('change', (e) => {
    state.queue = e.target.value;
    render();
  });
  $('patch').addEventListener('change', (e) => {
    state.patch = e.target.value;
    render();
  });
  $('min-games').addEventListener('change', (e) => {
    state.minGames = Number(e.target.value);
    render();
  });
  $('clear-sel').addEventListener('click', () => select(state.selected));

  $('comps-table').tHead.addEventListener('click', (e) => {
    const key = e.target.closest('th')?.dataset.sort;
    if (!key) return;
    state.sort = state.sort.key === key ? { key, asc: !state.sort.asc } : { key, asc: key === 'avgPlace' || key === 'label' };
    renderTable(core.aggregate(filtered()));
    applyRowSelection();
  });
  $('comps-table').tBodies[0].addEventListener('click', (e) => {
    const key = e.target.closest('tr')?.dataset.key;
    if (key) select(key);
  });
  $('lp-legend').addEventListener('click', (e) => {
    const key = e.target.closest('button')?.dataset.key;
    if (key) select(key);
  });
  $('matches').addEventListener('click', (e) => {
    if (e.target.id === 'more-matches') {
      state.matchLimit += PAGE;
      renderMatches(filtered());
      return;
    }

    const playerLink = e.target.closest('.player-link');
    if (playerLink) {
      e.stopPropagation();
      const name = playerLink.dataset.name;
      const tag = playerLink.dataset.tag;
      if (name && tag) {
        $('player').value = `${name}#${tag}`;
        load({ region: state.player?.region || 'vn', name, tag });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const retryBtn = e.target.closest('.btn-retry');
    if (retryBtn) {
      e.stopPropagation();
      const matchId = retryBtn.dataset.retryMatchId;
      const matchItem = retryBtn.closest('.match-item');
      if (matchId && matchItem) retryMatch(matchId, matchItem);
      return;
    }

    const summaryEl = e.target.closest('.match-summary');
    if (summaryEl) {
      const matchItem = summaryEl.closest('.match-item');
      const matchId = matchItem?.dataset.matchId;
      if (matchId) toggleMatch(matchId, matchItem);
    }
  });

  $('matches').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const summaryEl = e.target.closest('.match-summary');
      if (summaryEl && document.activeElement === summaryEl) {
        e.preventDefault();
        const matchItem = summaryEl.closest('.match-item');
        const matchId = matchItem?.dataset.matchId;
        if (matchId) toggleMatch(matchId, matchItem);
      }
    }
  });

  // Initial view: URL (shared link) > last search > default.
  const params = new URLSearchParams(location.search);
  if (params.get('g') in core.GROUP_MODES) state.groupMode = params.get('g');
  if (['1100', 'all'].includes(params.get('q'))) state.queue = params.get('q');
  if (/^\d+$/.test(params.get('min') ?? '')) state.minGames = Number(params.get('min'));
  state.pendingPatch = params.get('p');
  state.pendingTeam = params.get('team');
  $('group-mode').value = state.groupMode;
  $('queue').value = state.queue;
  $('min-games').value = String(state.minGames);
  const startSet = /^TFTSet\d+(_\d+)?$/.test(params.get('s') ?? '') ? params.get('s') : null;

  let start = params.get('id') ? { region: params.get('r') || 'vn', id: params.get('id') } : null;
  if (!start) {
    try {
      start = JSON.parse(localStorage.getItem('k-tft:last') || 'null');
    } catch {
      start = null;
    }
  }
  start ??= DEFAULT_PLAYER;
  $('region').value = start.region;
  $('player').value = start.id;
  const p = readInput();
  if (p) load(p, { set: startSet });
}

init();
