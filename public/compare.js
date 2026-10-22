// Compare page: two players' season stats side by side, from ?r1=&id1=&r2=&id2=&s=&q=
import * as core from './core.js?v=1.2.0';
import * as i18n from './i18n.js?v=1.2.0';
import {
  esc,
  pct,
  num,
  signed,
  signCls,
  api,
  getLookup,
  getComps,
  profileQuery,
  fetchCurrentSet,
  playerUrl,
  compareUrl,
  PLAYSTYLE_ICONS,
  unitsHtml,
  masteryChampHtml,
  masteryItemHtml,
} from './shared.js?v=1.2.0';

const t = i18n.t;
const $ = (id) => document.getElementById(id);

// The first two slots of the player page's palette: blue for the left player, orange for the right.
const SIDE = ['#3987e5', '#d95926'];
const GRID = '#2c2c2a';
const GRID_STRONG = '#45443f';
const SURFACE = '#1a1a19';
const TEXT2 = '#c3c2b7';

const SECTIONS = ['cmp-head', 'cmp-stats-section', 'cmp-charts', 'cmp-common-section', 'cmp-top-section', 'cmp-mastery-section'];

const state = {
  players: [], // [left, right] as { region, name, tag }
  set: null,
  currentSet: null,
  queue: '1100',
  lk: null,
  mode: 'cluster',
  sides: [], // per player: { player, profile, all }
};

const charts = {};

function setStatus(msg, isError = false) {
  const el = $('status');
  el.hidden = !msg;
  el.textContent = msg ?? '';
  el.classList.toggle('error', isError);
}

function showSections(show) {
  for (const id of SECTIONS) $(id).hidden = !show;
}

function applyTranslations() {
  document.documentElement.lang = i18n.getLang();
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
}

const riotId = (d) => {
  const [name, tag] = (d.profile.summoner?.riot_id ?? `${d.player.name}#${d.player.tag}`).split('#');
  return { name, tag };
};

// ---------- URL ----------

function readUrl() {
  const sp = new URLSearchParams(location.search);
  state.players = [1, 2].map((i) => core.parsePlayerInput(sp.get(`id${i}`) ?? '', sp.get(`r${i}`) || 'vn')).filter(Boolean);
  const s = sp.get('s');
  state.set = /^TFTSet\d+(_\d+)?$/.test(s ?? '') ? s : null;
  if (['1100', 'all'].includes(sp.get('q'))) state.queue = sp.get('q');
}

function syncUrl() {
  const url = new URL(compareUrl(state.players[0], state.players[1], { set: state.set, queue: state.queue }));
  const lang = new URLSearchParams(location.search).get('lang');
  if (lang) url.searchParams.set('lang', lang);
  history.replaceState(null, '', url);
}

// ---------- loading ----------

// An error whose message is already written for the reader, shown without the "error loading" prefix.
const userError = (msg) => Object.assign(new Error(msg), { userFacing: true });

async function load() {
  const label = (p) => `${p.name}#${p.tag}`;
  const [a, b] = state.players;
  state.currentSet ??= await fetchCurrentSet();
  const wanted = state.set ?? state.currentSet;
  setStatus(t('cmpLoading', { season: wanted ? `${core.setLabel(wanted)} ` : '', a: label(a), b: label(b) }));
  $('season').disabled = true;

  try {
    const results = await Promise.allSettled(
      state.players.map((p) => api(`/api/profile?${profileQuery(p)}${wanted ? `&set=${wanted}` : ''}`)),
    );
    const failed = results.findIndex((r) => r.status === 'rejected');
    if (failed >= 0) {
      const err = results[failed].reason;
      const p = state.players[failed];
      throw err.status === 404 ? userError(t('cmpNotFound', { name: p.name, tag: p.tag })) : err;
    }
    const profiles = results.map((r) => r.value);
    const set = wanted ?? profiles[0].matches?.[0]?.tft_set ?? null;
    if (!set) throw userError(t('determiningSeasonError'));

    const [setData, comps] = await Promise.all([getLookup(set), getComps(set)]);
    state.lk = core.buildLookups(setData);
    const compsSet = comps?.tft_set ?? comps?.results?.data?.tft_set;
    const clusters = compsSet === set ? core.buildClusters(comps, state.lk) : [];
    // MetaTFT keeps comp clusters only for recent sets; older ones fall back to trait + carry.
    state.mode = clusters.length ? 'cluster' : 'traitCarry';
    state.set = set;
    state.sides = profiles.map((profile, i) => {
      const all = core.processProfile(profile, state.lk, set);
      core.classify(all, state.mode, clusters, t);
      return { player: state.players[i], profile, all };
    });

    renderSeasonOptions();
    setStatus(null);
    render();
  } catch (err) {
    console.error(err);
    showSections(false);
    setStatus(err.userFacing ? err.message : t('loadError', { msg: err.message }), true);
  }
  $('season').disabled = false;
}

function renderSeasonOptions() {
  const sets = new Set([state.set, state.currentSet].filter(Boolean));
  for (const d of state.sides) for (const s of Object.keys(d.profile.rating_history ?? {})) sets.add(s);
  const cur = i18n.getLang() === 'vi' ? 'mùa này' : 'current';
  $('season').innerHTML = [...sets]
    .filter((s) => /^TFTSet\d+(_\d+)?$/.test(s))
    .sort((x, y) => core.setOrder(y) - core.setOrder(x))
    .map((s) => `<option value="${s}">${esc(core.setLabel(s))}${s === state.currentSet ? ` (${cur})` : ''}</option>`)
    .join('');
  $('season').value = state.set;
}

// ---------- derived data ----------

function sideData(d) {
  const matches = d.all.filter((m) => state.queue === 'all' || m.queue === Number(state.queue));
  const avg = (f) => {
    const vals = matches.map(f).filter((v) => v != null);
    return vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : null;
  };
  const sr = d.profile.server_rank;
  const groups = core.aggregate(matches).sort((x, y) => y.games - x.games);
  return {
    ...d,
    ...riotId(d),
    matches,
    groups,
    s: core.summarize(matches),
    dist: core.placementDistribution(matches),
    ...core.recentFormAndStreak(matches),
    ranked: d.profile.ranked ?? {},
    lpGames: matches.filter((m) => m.lpDelta != null).length,
    serverRank: sr?.rank ?? null,
    topPct: sr?.rank && sr?.total ? (sr.rank / sr.total) * 100 : null,
    avgLevel: avg((m) => m.level),
    avgRound: avg((m) => m.lastRound),
    mastery: core.championAndItemStats(matches, state.lk),
  };
}

const topText = (v) => `Top ${v < 0.01 ? '<0.01' : v < 0.1 ? '<0.1' : v.toFixed(1)}%`;

// `better` says which direction wins the row; rows without it are shown but not scored.
const STATS = [
  { key: 'compareRank', get: (d) => d.ranked.rating_numeric, fmt: (v, d) => esc(d.ranked.rating_text ?? t('unranked')), better: 'high' },
  { key: 'cmpPeak', get: (d) => d.ranked.peak_rating_numeric, fmt: (v, d) => esc(d.ranked.peak_rating ?? '—'), better: 'high' },
  {
    key: 'cmpServerRank',
    get: (d) => d.topPct,
    fmt: (v, d) => (d.serverRank ? `#${d.serverRank.toLocaleString(i18n.getLang() === 'vi' ? 'vi-VN' : 'en-US')} · ${topText(v)}` : '—'),
    better: 'low',
  },
  { key: 'cmpSeasonGames', get: (d) => d.ranked.num_games, fmt: (v) => v ?? '—' },
  { key: 'tileGames', get: (d) => d.s.games, fmt: (v) => v },
  { key: 'compareAvgPlace', get: (d) => d.s.avgPlace, fmt: (v) => num(v), better: 'low' },
  { key: 'compareTop4Rate', get: (d) => d.s.top4Rate, fmt: (v) => pct(v), better: 'high' },
  { key: 'compareWinRate', get: (d) => d.s.winRate, fmt: (v) => pct(v), better: 'high' },
  { key: 'cmpEighthRate', get: (d) => (d.dist.total ? d.dist.counts[7] / d.dist.total : null), fmt: (v) => pct(v), better: 'low' },
  { key: 'compareNetLp', get: (d) => (d.lpGames ? d.s.lpNet : null), fmt: (v) => signed(v), better: 'high' },
  { key: 'tileLpPerGame', get: (d) => (d.lpGames ? d.s.lpNet / d.lpGames : null), fmt: (v) => signed(v, 1), better: 'high' },
  { key: 'cmpLast10', get: (d) => d.last10?.avgPlace ?? null, fmt: (v) => num(v), better: 'low' },
  { key: 'cmpAvgLevel', get: (d) => d.avgLevel, fmt: (v) => num(v), better: 'high' },
  { key: 'cmpAvgRound', get: (d) => d.avgRound, fmt: (v) => (v == null ? '—' : core.formatRound(Math.round(v))), better: 'high' },
  { key: 'tileNumComps', get: (d) => d.groups.length, fmt: (v) => v },
];

function statRows(sides) {
  return STATS.map((st) => {
    const vals = sides.map(st.get);
    let winner = -1;
    if (st.better && vals.every((v) => v != null) && vals[0] !== vals[1]) {
      const firstHigher = vals[0] > vals[1];
      winner = (st.better === 'high') === firstHigher ? 0 : 1;
    }
    return { ...st, vals, winner, text: sides.map((d, i) => st.fmt(vals[i], d)) };
  });
}

// ---------- render ----------

function render() {
  const sides = state.sides.map(sideData);
  const rows = statRows(sides);
  renderHead(sides, rows);
  renderStats(rows);
  renderLpChart(sides);
  renderPlaceChart(sides);
  renderCommon(sides);
  renderTop(sides);
  renderMastery(sides);
  showSections(true);
  updateMeta(sides);
  syncUrl();
}

function updateMeta(sides) {
  const [a, b] = sides.map((d) => `${d.name}#${d.tag}`);
  document.title = t('cmpPageTitle', { a, b });
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('cmpPageDesc', { a, b, season: core.setLabel(state.set) }));
}

function playerCardHtml(d, i, wins, scored) {
  const tier = core.getRankTier(d.ranked.rating_text, d.ranked.rating_numeric);
  const icon = d.profile.summoner?.profile_icon_id ?? 29;
  const queueLabel = state.queue === 'all' ? t('queueAll') : t('queueRanked');
  const link = playerUrl(d.player, state.set === state.currentSet ? null : state.set);

  let streakHtml = '';
  if (d.streak && d.streak.count >= 2) {
    const sKey = d.streak.type === 'win' ? 'streakWin' : d.streak.type === 'top4' ? 'streakTop4' : 'streakBot4';
    streakHtml = `<span class="streak-badge streak-${d.streak.type}">${t(sKey, { n: d.streak.count })}</span>`;
  }
  let formHtml = '';
  if (d.last10 && d.last10.games >= 5) {
    const fKey = d.last10.trend === 'hot' ? 'formHot' : d.last10.trend === 'cold' ? 'formCold' : 'formSteady';
    formHtml = `<span class="form-pill trend-${d.last10.trend}" title="${t('formLast10')}">${t(fKey, { avg: d.last10.avgPlace.toFixed(1) })}</span>`;
  }

  const psKey = `playstyle${d.dist.playstyle[0].toUpperCase()}${d.dist.playstyle.slice(1)}`;
  const playstyleHtml = d.dist.total
    ? `<div class="playstyle-pill playstyle-${d.dist.playstyle}" title="${esc(t(`${psKey}Desc`))}">
        <span class="ps-icon">${PLAYSTYLE_ICONS[d.dist.playstyle] ?? PLAYSTYLE_ICONS.balanced}</span>
        <div class="ps-text">
          <div class="ps-name">${esc(t(psKey))}</div>
          <div class="ps-sub">${t('cmpPlaystyle')}</div>
        </div>
      </div>`
    : '';

  const titles = core.computePlayerTitles(d.matches, d.groups, d.profile, t);
  const titlesHtml = titles.length
    ? `<div class="player-titles">${titles
        .map(
          (x) =>
            `<span class="title-badge ${x.type}" title="${esc(x.desc)}"><span class="title-icon">${x.icon}</span><span class="title-name">${esc(x.name)}</span></span>`,
        )
        .join('')}</div>`
    : '';

  return `
    <article class="card cmp-player" style="--side:${SIDE[i]}">
      <div class="cmp-player-top">
        <img class="cmp-avatar" src="https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${icon}.jpg" onerror="this.onerror=null;this.src='favicon.svg'" alt="">
        <div class="player-id">
          <h1><a href="${esc(link)}">${esc(d.name)} <small>#${esc(d.tag)}</small></a></h1>
          <div class="player-rank-row">
            <div class="rank tier-${tier}"><span class="rank-dot"></span><span class="rank-name">${esc(d.ranked.rating_text ?? t('unranked'))}</span></div>
            ${streakHtml}
            ${formHtml}
          </div>
          <div class="sub">${esc(core.regionToLabel(d.player.region))} · ${t('cmpGamesShown', { n: d.s.games, queue: queueLabel })}</div>
        </div>
      </div>
      <div class="cmp-player-meta">
        ${playstyleHtml}
        <span class="cmp-score-line">${t('cmpScore', { n: wins, total: scored })}</span>
      </div>
      ${titlesHtml}
    </article>`;
}

function renderHead(sides, rows) {
  const scored = rows.filter((r) => r.winner >= 0).length;
  const wins = [0, 1].map((i) => rows.filter((r) => r.winner === i).length);
  $('cmp-head').innerHTML = `
    ${playerCardHtml(sides[0], 0, wins[0], scored)}
    <div class="cmp-vs">
      <span class="cmp-vs-label">${t('compareVs')}</span>
      <span class="cmp-vs-score"><span style="color:${SIDE[0]}">${wins[0]}</span> – <span style="color:${SIDE[1]}">${wins[1]}</span></span>
    </div>
    ${playerCardHtml(sides[1], 1, wins[1], scored)}`;
}

function renderStats(rows) {
  const cls = (r, i) => (r.winner < 0 ? '' : r.winner === i ? 'better' : 'worse');
  $('cmp-stats').innerHTML = rows
    .map(
      (r) => `
      <div class="cmp-row">
        <div class="cmp-val ${cls(r, 0)}">${r.text[0]}</div>
        <div class="cmp-label">${esc(t(r.key))}</div>
        <div class="cmp-val ${cls(r, 1)}">${r.text[1]}</div>
      </div>`,
    )
    .join('');
}

// ---------- charts ----------

function legendHtml(sides) {
  return sides
    .map((d, i) => `<span class="cmp-legend-item"><span class="dot" style="background:${SIDE[i]}"></span>${esc(d.name)}<span class="muted">#${esc(d.tag)}</span></span>`)
    .join('');
}

const tooltipStyle = {
  backgroundColor: '#2a2a28',
  borderColor: '#3a3a37',
  borderWidth: 1,
  titleColor: '#f0efec',
  bodyColor: TEXT2,
  padding: 10,
  cornerRadius: 6,
  boxPadding: 4,
};

function draw(id, config) {
  charts[id]?.destroy();
  charts[id] = new Chart($(id), config);
}

function renderLpChart(sides) {
  $('lp-legend').innerHTML = legendHtml(sides);
  const series = sides.map((d) =>
    d.matches.filter((m) => m.queue === core.RANKED_QUEUE && m.lpAfter != null).map((m) => ({ x: m.gameNo, y: m.lpAfter, m })),
  );
  const ys = series.flat().map((p) => p.y);
  const yMin = ys.length ? Math.floor((Math.min(...ys) - 20) / 100) * 100 : 0;
  const yMax = ys.length ? Math.ceil((Math.max(...ys) + 20) / 100) * 100 : 400;

  draw('lp-chart', {
    type: 'line',
    data: {
      datasets: series.map((pts, i) => ({
        label: sides[i].name,
        data: pts,
        parsing: false,
        borderColor: SIDE[i],
        backgroundColor: SIDE[i],
        borderWidth: 2,
        tension: 0,
        pointRadius: 2.5,
        pointHoverRadius: 6,
        pointBorderColor: SURFACE,
        pointBorderWidth: 1,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 200 },
      interaction: { mode: 'nearest', intersect: false },
      scales: {
        x: { type: 'linear', title: { display: true, text: t('lpAxisX'), color: '#8e8d86' }, ticks: { precision: 0 }, grid: { display: false } },
        y: {
          min: yMin,
          max: yMax,
          ticks: { stepSize: 100, callback: (v) => core.ratingTickLabel(v) },
          grid: { color: (c) => (c.tick.value % 400 === 0 ? GRID_STRONG : GRID) },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipStyle,
          callbacks: {
            title: (items) => `${items[0].dataset.label} · ${t('tooltipMatch', { gameNo: items[0].raw.m.gameNo, date: new Date(items[0].raw.m.ts).toLocaleDateString() })}`,
            label: (item) => ` ${item.raw.m.compLabel}`,
            afterLabel: (item) => {
              const m = item.raw.m;
              return [t('tooltipPlace', { place: m.placement }), `${core.ratingToText(m.lpAfter)}${m.lpDelta != null ? ` (${signed(m.lpDelta)} LP)` : ''}`];
            },
          },
        },
      },
    },
  });
}

function renderPlaceChart(sides) {
  $('place-legend').innerHTML = legendHtml(sides);
  draw('place-chart', {
    type: 'bar',
    data: {
      labels: [1, 2, 3, 4, 5, 6, 7, 8].map((p) => `#${p}`),
      datasets: sides.map((d, i) => ({
        label: d.name,
        data: d.dist.pcts,
        counts: d.dist.counts,
        backgroundColor: SIDE[i],
        borderRadius: 4,
        maxBarThickness: 36,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 200 },
      scales: {
        x: { title: { display: true, text: t('placeAxisX'), color: '#8e8d86' }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { callback: (v) => `${v}%` } },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipStyle,
          callbacks: {
            title: (items) => t('placeTooltipTitle', { place: items[0].dataIndex + 1 }),
            label: (item) =>
              ` ${item.dataset.label}: ${t('placeTooltipLabel', { count: item.dataset.counts[item.dataIndex], pct: `${item.raw.toFixed(1)}%` }).trim()}`,
          },
        },
      },
    },
  });
}

// ---------- comps & mastery ----------

function colHead(d, i) {
  return `<div class="cmp-col-head"><span class="dot" style="background:${SIDE[i]}"></span>${esc(d.name)} <span class="muted">#${esc(d.tag)}</span></div>`;
}

function renderCommon(sides) {
  const byKey = sides.map((d) => new Map(d.groups.map((g) => [g.key, g])));
  const common = [...byKey[0].keys()]
    .filter((k) => byKey[1].has(k))
    .map((k) => [byKey[0].get(k), byKey[1].get(k)])
    .sort((x, y) => y[0].games + y[1].games - (x[0].games + x[1].games))
    .slice(0, 12);

  const mode = `${t('groupByLabel')}: ${t(state.mode === 'cluster' ? 'groupCluster' : 'groupTraitCarry')}`;
  $('cmp-common-hint').textContent = t('cmpCommonHint', { mode });
  if (!common.length) {
    $('cmp-common').innerHTML = `<p class="muted">${t('cmpNoCommon')}</p>`;
    return;
  }

  const cells = (g, other) => {
    const better = (v, w, lowWins) => (v != null && w != null && v !== w && (lowWins ? v < w : v > w) ? 'cmp-win' : '');
    return `
        <td class="cmp-side-start">${g.games}</td>
        <td class="${better(g.avgPlace, other.avgPlace, true)}">${num(g.avgPlace)}</td>
        <td class="${better(g.top4Rate, other.top4Rate)}">${pct(g.top4Rate)}</td>
        <td class="${signCls(g.lpGames ? g.lpNet : null)}">${g.lpGames ? signed(g.lpNet) : '—'}</td>`;
  };
  const sub = `<th>${t('thGames')}</th><th>${t('thAvgPlace')}</th><th>${t('thTop4')}</th><th>${t('thLpNet')}</th>`;

  $('cmp-common').innerHTML = `
    <table class="cmp-table">
      <thead>
        <tr>
          <th class="left" rowspan="2">${t('thComp')}</th>
          ${sides.map((d, i) => `<th colspan="4" class="cmp-side-start"><span class="dot" style="background:${SIDE[i]};display:inline-block"></span> ${esc(d.name)}</th>`).join('')}
        </tr>
        <tr>${sub}${sub}</tr>
      </thead>
      <tbody>
        ${common
          .map(
            ([a, b]) => `
        <tr>
          <td class="left"><div class="comp-cell"><div class="comp-name">${esc(a.label)}</div><div class="units">${unitsHtml(a.coreUnits)}</div></div></td>
          ${cells(a, b)}
          ${cells(b, a)}
        </tr>`,
          )
          .join('')}
      </tbody>
    </table>`;
}

function renderTop(sides) {
  $('cmp-top').innerHTML = sides
    .map(
      (d, i) => `
      <div class="cmp-col">
        ${colHead(d, i)}
        ${
          d.groups.length
            ? d.groups
                .slice(0, 6)
                .map(
                  (g) => `
          <div class="cmp-comp">
            <div class="comp-name">${esc(g.label)}</div>
            <div class="units">${unitsHtml(g.coreUnits)}</div>
            <div class="cmp-comp-stats">
              <span>${t('masteryGames', { n: g.games })}</span>
              <span>${t('thAvgPlace')} <strong>${num(g.avgPlace)}</strong></span>
              <span>${t('thTop4')} <strong>${pct(g.top4Rate)}</strong></span>
              <span class="${signCls(g.lpGames ? g.lpNet : null)}">${g.lpGames ? `${signed(g.lpNet)} LP` : '—'}</span>
            </div>
          </div>`,
                )
                .join('')
            : `<p class="muted">${t('noMatches')}</p>`
        }
      </div>`,
    )
    .join('');
}

function renderMastery(sides) {
  $('cmp-mastery').innerHTML = sides
    .map(
      (d, i) => `
      <div class="cmp-col">
        ${colHead(d, i)}
        <div class="mastery-col">
          <h3>${t('masteryChamps')}</h3>
          <div class="mastery-list">${d.mastery.champions.slice(0, 5).map(masteryChampHtml).join('') || `<div class="muted">${t('noMatches')}</div>`}</div>
        </div>
        <div class="mastery-col">
          <h3>${t('masteryItems')}</h3>
          <div class="mastery-list">${d.mastery.items.slice(0, 5).map(masteryItemHtml).join('') || `<div class="muted">${t('noMatches')}</div>`}</div>
        </div>
      </div>`,
    )
    .join('');
}

// ---------- wiring ----------

function init() {
  Chart.defaults.color = TEXT2;
  Chart.defaults.borderColor = GRID;
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  document.querySelectorAll('.app-version').forEach((el) => {
    el.textContent = `v${core.APP_VERSION}`;
  });
  applyTranslations();
  readUrl();
  $('queue').value = state.queue;

  $('queue').addEventListener('change', (e) => {
    state.queue = e.target.value;
    if (state.sides.length) render();
  });
  $('season').addEventListener('change', (e) => {
    state.set = e.target.value;
    load();
  });
  $('swap').addEventListener('click', () => {
    state.players.reverse();
    state.sides.reverse();
    if (state.sides.length) render();
  });
  $('copy-link').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    try {
      await navigator.clipboard.writeText(location.href);
      btn.textContent = t('linkCopied');
    } catch {
      btn.textContent = t('linkCopyFailed');
    }
    setTimeout(() => {
      btn.textContent = t('copyLink');
    }, 1500);
  });

  if (state.players.length < 2) {
    setStatus(t('cmpMissingPlayers'), true);
    return;
  }
  load();
}

init();
