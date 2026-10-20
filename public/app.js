import * as core from './core.js';

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
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
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
    return `https://data.metatft.com/lookups/${set}_latest_en_us.json`;
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

function getLookup(set) {
  if (!lookupCache.has(set)) {
    const base = set.replace(/_\d+$/, ''); // Set 9.5 has no lookup of its own; it shares Set 9's
    const p = api(`/api/lookup?set=${set}`).catch((err) => (base !== set ? api(`/api/lookup?set=${base}`) : Promise.reject(err)));
    p.catch(() => lookupCache.delete(set));
    lookupCache.set(set, p);
  }
  return lookupCache.get(set);
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
  setStatus(`Đang tải ${wanted ? `${core.setLabel(wanted)} của ` : ''}${player.name}#${player.tag}…`);
  let retryAfterRefresh = false;
  try {
    const profile = await api(`/api/profile?${profileQuery(player)}${wanted ? `&set=${wanted}` : ''}${fresh ? '&fresh=1' : ''}`);
    wanted ??= profile.matches?.[0]?.tft_set ?? null;
    if (!wanted) throw new Error('Không xác định được mùa hiện tại.');
    const [setData, comps] = await Promise.all([getLookup(wanted), getComps(wanted)]);

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
    setStatus(state.all.length ? null : `Không có trận nào trong ${core.setLabel(wanted)}.`);
    render();
  } catch (err) {
    console.error(err);
    if (err.status === 404 && !retried) {
      // MetaTFT queues a fetch for unknown players; wait for it once before giving up.
      retryAfterRefresh = true;
    } else {
      const msg =
        err.status === 404
          ? `Không tìm thấy ${player.name}#${player.tag} trên MetaTFT. Kiểm tra lại tên, tag và server.`
          : `Lỗi khi tải dữ liệu: ${err.message}`;
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
  const sets = [...state.seasons.keys()].sort((a, b) => core.setOrder(b) - core.setOrder(a));
  $('season').innerHTML = sets
    .map((s) => {
      const rank = state.seasons.get(s);
      const label = `${core.setLabel(s)}${s === state.currentSet ? ' (hiện tại)' : ''}${rank ? ` · ${rank}` : ''}`;
      return `<option value="${esc(s)}">${esc(label)}</option>`;
    })
    .join('');
  $('season').value = state.set;
}

async function refreshPlayer(player = null, retried = false) {
  const p = player ?? readInput() ?? state.player;
  if (!p) return;
  $('refresh').disabled = true;
  try {
    for (const wait of [0, 2000, 3000, 5000, 8000, 10000]) {
      await sleep(wait);
      setStatus(`Đang yêu cầu MetaTFT cập nhật ${p.name}#${p.tag}…`);
      const r = await api(`/api/refresh?${profileQuery(p)}`).catch((e) => (e.status === 404 ? { status: 'queued' } : Promise.reject(e)));
      if (r?.status !== 'queued') break;
    }
  } catch (err) {
    console.warn('refresh failed', err);
  }
  $('refresh').disabled = false;
  await load(p, { fresh: true, retried });
}

// The URL carries the whole view (player, season, filters, selected comp) so it can be shared.
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
  put('team', state.selected ? state.all.find((m) => m.compKey === state.selected)?.compLabel : null, null);
  history.replaceState(null, '', url);
}

function remember(p) {
  const id = `${p.name}#${p.tag}`;
  $('player').value = id;
  $('region').value = p.region;
  document.title = `${id} · k-tft`;
  try {
    localStorage.setItem('k-tft:last', JSON.stringify({ region: p.region, id }));
  } catch {
    /* storage unavailable */
  }
}

function readInput() {
  const p = core.parsePlayerInput($('player').value, $('region').value);
  if (!p) {
    setStatus('Nhập Riot ID dạng Tên#Tag (vd: Akite Bánh Mì#akite) hoặc dán link MetaTFT.', true);
    return null;
  }
  if (!core.REGIONS.some((r) => r.slug === p.region)) {
    setStatus(`Server “${p.region}” chưa được hỗ trợ.`, true);
    return null;
  }
  return p;
}

// ---------- derived data ----------

function assignColors() {
  // Colour follows the comp, ranked once on the unfiltered season so filters never repaint survivors.
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
  const mode = effectiveMode();
  core.classify(state.all, mode, state.clusters);
  assignColors();
  renderPatchOptions();
  const matches = filtered();
  const groups = core.aggregate(matches);
  if (state.pendingTeam) {
    // A shared link names the comp by its label; keys can differ between sessions.
    state.selected = groups.find((g) => g.label === state.pendingTeam)?.key ?? null;
    state.pendingTeam = null;
  }
  if (state.selected && !groups.some((g) => g.key === state.selected)) state.selected = null;

  const season = core.setLabel(state.set);
  const tip = 'Bấm vào một đội để xem chart leo rank và lịch sử trận của đội đó.';
  $('comps-hint').textContent =
    mode === 'cluster'
      ? `Ghép theo comp meta MetaTFT của ${season}${state.set === state.currentSet ? ' (patch hiện tại)' : ' (bản cuối mùa)'}. ${tip}`
      : state.groupMode === 'cluster'
        ? `MetaTFT không còn comp meta cho ${season}, đang nhóm theo Tộc/Hệ chính + Carry. ${tip}`
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
  sel.innerHTML = `<option value="all">Tất cả</option>${patches.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join('')}`;
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
  const sr = p.server_rank;
  const topVal = sr?.rank && sr?.total ? (sr.rank / sr.total) * 100 : null;
  const topPct = topVal == null ? '' : ` · Top ${topVal < 0.1 ? '<0.1' : topVal.toFixed(1)}%`;
  const [name, tag] = (p.summoner?.riot_id ?? `${state.player.name}#${state.player.tag}`).split('#');
  const seasonLabel = core.setLabel(state.set);
  const rankedShown = matches.filter((m) => m.queue === core.RANKED_QUEUE);
  const withLp = rankedShown.filter((m) => m.lpDelta != null).length;
  const rankedStored = state.all.filter((m) => m.queue === core.RANKED_QUEUE).length;
  const partial = ranked.num_games > rankedStored
    ? `<div class="sub">MetaTFT chỉ còn lưu đội hình của ${rankedStored}/${ranked.num_games} trận xếp hạng mùa này.</div>`
    : '';
  $('player-card').innerHTML = `
    <div class="player-id">
      <h1>${esc(name)} <small>#${esc(tag)}</small></h1>
      <div class="rank">${esc(ranked.rating_text ?? 'Chưa có rank')}</div>
      <div class="sub">${esc(seasonLabel)} · ${ranked.num_games ?? 0} trận xếp hạng${sr?.rank ? ` · Hạng #${sr.rank.toLocaleString('vi-VN')}${topPct}` : ''}</div>
      ${ranked.peak_rating ? `<div class="sub">Cao nhất: ${esc(ranked.peak_rating)}</div>` : ''}
      ${partial}
      ${rankedShown.length ? `<div class="sub" title="MetaTFT không lưu LP sau mọi trận; trận thiếu dữ liệu không được tính vào LP ròng.">Có dữ liệu LP: ${withLp}/${rankedShown.length} trận xếp hạng</div>` : ''}
    </div>
    <div class="tiles">
      ${tile('Trận', s.games)}
      ${tile('Hạng TB', num(s.avgPlace))}
      ${tile('Top 4', pct(s.top4Rate))}
      ${tile('Top 1', pct(s.winRate))}
      ${tile('LP ròng', signed(s.lpNet), signCls(s.lpNet))}
      ${tile('Số đội hình', groups.length)}
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
    : `<tr><td colspan="8" class="left muted">Không có trận nào khớp bộ lọc.</td></tr>`;
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
  $('lp-title').textContent = selLabel ? `Leo rank theo thời gian · ${selLabel}` : 'Leo rank theo thời gian';
  $('lp-hint').textContent = ranked.length
    ? 'Mỗi chấm là LP sau một trận xếp hạng, tô màu theo đội hình đã chơi. Bấm chấm hoặc chú thích để chọn đội.'
    : 'Không có dữ liệu LP cho bộ lọc này (chỉ trận Xếp hạng mới có LP).';

  // Legend chips: coloured comps present in this view, plus "Khác".
  const present = groups.filter((g) => state.colors.has(g.key)).sort((a, b) => b.games - a.games);
  const hasOther = groups.some((g) => !state.colors.has(g.key));
  $('lp-legend').innerHTML =
    present
      .map(
        (g) =>
          `<button type="button" data-key="${esc(g.key)}" class="${sel === g.key ? 'active' : sel ? 'faded' : ''}"><span class="dot" style="background:${colorOf(g.key)}"></span>${esc(g.label)} <span class="muted">${g.games}</span></button>`,
      )
      .join('') + (hasOther ? `<span class="legend-other"><span class="dot" style="background:${OTHER};display:inline-block"></span> Khác</span>` : '');

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
          title: { display: true, text: 'Trận xếp hạng thứ', color: '#8e8d86' },
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
              return `Trận #${m.gameNo} · ${fmtDate(m.ts)}`;
            },
            label: (item) => {
              const m = item.raw.m;
              return ` ${m.compLabel}`;
            },
            labelColor: (item) => ({ backgroundColor: colorOf(item.raw.m.compKey), borderColor: colorOf(item.raw.m.compKey) }),
            afterLabel: (item) => {
              const m = item.raw.m;
              return [`Hạng ${m.placement}`, `${core.ratingToText(m.lpAfter)}${m.lpDelta != null ? ` (${signed(m.lpDelta)} LP)` : ''}`];
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
          title: { display: true, text: 'Số trận chơi đội này (có LP)', color: '#8e8d86' },
          ticks: { precision: 0 },
          grid: { display: false },
        },
        y: {
          title: { display: true, text: 'LP cộng dồn', color: '#8e8d86' },
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
              if (!m) return ' Bắt đầu: 0 LP';
              return ` Lần ${item.raw.x}: ${signed(item.raw.y)} LP (trận này ${signed(m.lpDelta)}, hạng ${m.placement})`;
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
        x: { grid: { color: (c) => (c.tick.value === 0 ? GRID_STRONG : GRID) }, title: { display: true, text: 'LP', color: '#8e8d86' } },
        y: { grid: { display: false }, ticks: { autoSkip: false } },
      },
      plugins: {
        ...baseOptions().plugins,
        tooltip: {
          ...baseOptions().plugins.tooltip,
          callbacks: {
            label: (item) => {
              const g = rows[item.dataIndex];
              return ` ${signed(g.lpNet)} LP qua ${g.lpGames} trận (${signed(g.lpPerGame, 1)} LP/trận)`;
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
  $('place-title').textContent = g ? `Phân bố thứ hạng · ${g.label}` : 'Phân bố thứ hạng';
  $('place-hint').textContent = `${ms.length} trận`;

  draw('place-chart', {
    type: 'bar',
    data: {
      labels: ['1', '2', '3', '4', '5', '6', '7', '8'],
      datasets: [{ data: counts, backgroundColor: color, borderRadius: { topLeft: 4, topRight: 4 }, borderSkipped: 'bottom', maxBarThickness: 36 }],
    },
    options: baseOptions({
      scales: {
        x: { grid: { display: false }, title: { display: true, text: 'Thứ hạng', color: '#8e8d86' } },
        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: GRID } },
      },
      plugins: {
        ...baseOptions().plugins,
        tooltip: {
          ...baseOptions().plugins.tooltip,
          displayColors: false,
          callbacks: {
            title: (items) => `Hạng ${items[0].label}`,
            label: (item) => ` ${item.raw} trận (${pct(ms.length ? item.raw / ms.length : 0)})`,
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

  $('sum-hint').textContent = g ? g.label : 'Tất cả đội hình (theo bộ lọc)';
  $('sel-summary').innerHTML = [
    tile('Trận', s.games),
    tile('Top 1', pct(s.winRate)),
    tile('Top 4', pct(s.top4Rate)),
    tile('Hạng TB', num(s.avgPlace)),
    tile('LP ròng', signed(s.lpNet), signCls(s.lpNet)),
    tile('LP/trận', lpGames ? signed(s.lpNet / lpGames, 1) : '—', signCls(lpGames ? s.lpNet : null)),
    cluster?.metaAvg ? tile('Hạng TB meta (patch này)', num(cluster.metaAvg)) : '',
    first ? tile('Chơi lần đầu', fmtDate(first)) : '',
    last ? tile('Gần nhất', fmtDate(last)) : '',
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

function renderMatches(matches) {
  const sel = state.selected;
  const list = matches.filter((m) => !sel || m.compKey === sel).sort((a, b) => b.ts - a.ts);
  const label = sel ? list[0]?.compLabel : null;
  $('matches-title').textContent = `Lịch sử trận${label ? ` · ${label}` : ''} (${list.length})`;

  const rows = list.slice(0, state.matchLimit).map((m) => {
    let lp = '<div class="after muted">—</div>';
    if (m.queue === core.RANKED_QUEUE) {
      const delta = m.lpDelta != null
        ? `<div class="delta ${signCls(m.lpDelta)}">${signed(m.lpDelta)} LP</div>`
        : m.lpPending
          ? '<div class="delta muted">chờ cập nhật</div>'
          : '';
      lp = `${delta}<div class="after">${esc(core.ratingToText(m.lpAfter))}</div>`;
    }
    return `
      <div class="match">
        <div class="place-badge ${m.placement === 1 ? 'p1' : m.placement <= 4 ? 'top4' : ''}">${m.placement}</div>
        <div class="meta">
          <span class="comp"><span class="dot" style="background:${colorOf(m.compKey)}"></span>${esc(m.compLabel)}</span>
          <span>${esc(core.QUEUE_NAMES[m.queue] ?? `Queue ${m.queue}`)} · ${esc(m.patch)}${m.gameNo ? ` · #${m.gameNo}` : ''}</span>
          <span>${fmtDate(m.ts)} · ${fmtDuration(m.duration)} · Lv ${m.level ?? '?'}</span>
        </div>
        <div class="board">${boardHtml(m.units)}</div>
        <div class="lp">${lp}</div>
      </div>`;
  });

  const more = list.length > state.matchLimit
    ? `<button type="button" class="ghost more" id="more-matches">Xem thêm (${list.length - state.matchLimit})</button>`
    : '';
  $('matches').innerHTML = rows.join('') + more || '<p class="muted">Không có trận nào.</p>';
}

// ---------- wiring ----------

function init() {
  Chart.defaults.color = TEXT2;
  Chart.defaults.borderColor = GRID;
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;

  $('region').innerHTML = core.REGIONS.map((r) => `<option value="${r.slug}">${r.label}</option>`).join('');
  $('group-mode').innerHTML = Object.entries(core.GROUP_MODES)
    .map(([k, v]) => `<option value="${k}">${esc(v)}</option>`)
    .join('');
  $('group-mode').value = state.groupMode;

  $('search').addEventListener('submit', (e) => {
    e.preventDefault();
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
      btn.textContent = 'Đã sao chép';
    } catch {
      btn.textContent = 'Không sao chép được';
    }
    setTimeout(() => (btn.textContent = 'Sao chép link'), 1500);
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
    if (e.target.id !== 'more-matches') return;
    state.matchLimit += PAGE;
    renderMatches(filtered());
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
