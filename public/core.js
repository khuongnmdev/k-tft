// Pure data logic (no DOM) — shared by the browser app and the Node self-check.

export const APP_VERSION = '1.1.0';

export const RANKED_QUEUE = 1100;

export const QUEUE_NAMES = {
  1090: 'Thường',
  1100: 'Xếp hạng',
  1130: 'Siêu tốc',
  1160: 'Double Up',
  1170: "Fortune's Favor",
  1180: 'Soul Brawl',
  1210: "Choncc's Treasure",
  6000: 'Galaxies',
  6100: 'Revival',
  6110: 'Festival of Beasts',
  6120: "Pengu's Party",
};

export function queueLabel(queueId, t = null) {
  if (t) {
    if (queueId === 1090) return t('queueNormal');
    if (queueId === 1100) return t('queueRanked');
    if (queueId === 1130) return t('queueHyperRoll');
    if (queueId === 1160) return t('queueDoubleUp');
  }
  return QUEUE_NAMES[queueId] ?? `Queue ${queueId}`;
}

// "TFTSet17" -> "Set 17", "TFTSet9_2" -> "Set 9.5"
export function setLabel(set) {
  const m = /^TFTSet(\d+)(?:_(\d+))?$/.exec(set ?? '');
  if (!m) return set ?? '';
  return m[2] === '2' ? `Set ${m[1]}.5` : `Set ${m[1]}${m[2] ? `_${m[2]}` : ''}`;
}

export function setOrder(set) {
  const m = /^TFTSet(\d+)(?:_(\d+))?$/.exec(set ?? '');
  return m ? Number(m[1]) + (m[2] ? Number(m[2]) / 10 : 0) : -1;
}

const CDN = 'https://cdn.metatft.com/file/metatft';
const sized = (url, px) => `https://cdn.metatft.com/cdn-cgi/image/width=${px},height=${px},format=auto/${url}`;

// ---------- Rank <-> numeric (MetaTFT: tier*400 + division*100 + LP, Master+ from 2800) ----------

const TIERS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND'];
const TIER_SHORT = { IRON: 'I', BRONZE: 'B', SILVER: 'S', GOLD: 'G', PLATINUM: 'P', EMERALD: 'E', DIAMOND: 'D', MASTER: 'M' };
const DIVS = ['IV', 'III', 'II', 'I'];

export function ratingToText(v, short = false) {
  if (v == null) return '—';
  if (v >= 2800) return short ? `M+ ${v - 2800}` : `Master+ ${v - 2800} LP`;
  const tier = TIERS[Math.floor(v / 400)] ?? 'IRON';
  const div = DIVS[Math.floor((v % 400) / 100)];
  const lp = v % 100;
  return short ? `${TIER_SHORT[tier]}${div} ${lp}` : `${tier[0]}${tier.slice(1).toLowerCase()} ${div} ${lp} LP`;
}

export function ratingTickLabel(v) {
  if (v >= 2800) return v === 2800 ? 'Master' : `M+${v - 2800}`;
  if (v % 100 !== 0) return '';
  const tier = TIERS[Math.floor(v / 400)] ?? 'IRON';
  return `${TIER_SHORT[tier]} ${DIVS[Math.floor((v % 400) / 100)]}`;
}

// ---------- Static lookups (units / traits / items) ----------

export function buildLookups(setData) {
  const units = new Map();
  for (const u of setData.units ?? []) {
    const info = {
      apiName: u.apiName,
      name: (u.name ?? u.apiName).trim(),
      cost: u.cost ?? 0,
      icon: sized(`${CDN}/champions/${u.apiName.toLowerCase()}.png`, 64),
    };
    for (const a of u.assetNames ?? []) units.set(a, info);
    units.set(u.apiName, info);
  }
  for (const [asset, api] of Object.entries(setData.unitAssetNames ?? {})) {
    if (!units.has(asset) && units.has(api)) units.set(asset, units.get(api));
  }
  const traits = new Map();
  for (const t of setData.traits ?? []) {
    const info = {
      apiName: t.apiName,
      name: (t.name ?? t.apiName).trim(),
      type: t.type,
      effects: t.effects ?? [],
      icon: `${CDN}/traits/${t.apiName.toLowerCase()}.png`,
    };
    traits.set(t.apiName, info);
    // Older matches name traits "Set10_X" while the lookup uses "TFT10_X" (and the reverse).
    const m = /^(TFT|Set)(\d+)_(.+)$/.exec(t.apiName);
    if (m) {
      const alias = `${m[1] === 'TFT' ? 'Set' : 'TFT'}${m[2]}_${m[3]}`;
      if (!traits.has(alias)) traits.set(alias, info);
    }
  }
  const items = new Map();
  for (const it of setData.items ?? []) {
    items.set(it.apiName, { name: it.name, icon: sized(`${CDN}/items/${it.apiName.toLowerCase()}.png`, 40) });
  }
  const augments = new Map();
  for (const a of setData.augments ?? []) augments.set(a.apiName, { name: a.name });
  const unitsLower = new Map([...units].map(([k, v]) => [k.toLowerCase(), v]));
  return { units, unitsLower, traits, items, augments };
}

// Readable fallback for ids the lookup doesn't know: "TFT9_TwistedFate" -> "Twisted Fate".
function prettyId(id) {
  const s = id
    .replace(/^(DA_|TFT\d*[a-z]?_|Set\d+[a-z]?_)/i, '')
    .replace(/(^|_)18(_|$)|_?(AD|AP)$/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function unitInfo(lk, id) {
  return lk.units.get(id) ?? lk.unitsLower.get(id.toLowerCase()) ?? {
    apiName: id,
    name: prettyId(id),
    cost: 0,
    icon: sized(`${CDN}/champions/${id.toLowerCase()}.png`, 64),
  };
}

export function itemInfo(lk, id) {
  return lk.items.get(id) ?? { name: id.replace(/^DA_/, ''), icon: sized(`${CDN}/items/${id.toLowerCase()}.png`, 40) };
}

export function traitInfo(lk, base) {
  const t = lk?.traits?.get(base);
  const rawIcon = t?.icon ?? `${CDN}/traits/${base.toLowerCase()}.png`;
  return {
    name: t?.name ?? prettyId(base),
    icon: rawIcon.includes('/cdn-cgi/image/') ? rawIcon : sized(rawIcon, 32),
  };
}

export function formatRound(r) {
  if (!r) return '';
  if (r <= 3) return `1-${r}`;
  const stage = Math.floor((r - 4) / 7) + 2;
  const round = ((r - 4) % 7) + 1;
  return `${stage}-${round}`;
}

function traitName(lk, base) {
  return lk.traits.get(base)?.name ?? prettyId(base);
}

// "DA_18_Hunter_2" -> { base: "DA_18_Hunter", tier: 2 }  (tier = index of the active breakpoint, 1-based)
function parseTrait(s) {
  const m = /^(.*)_(\d+)$/.exec(s);
  return m ? { base: m[1], tier: Number(m[2]) } : { base: s, tier: 1 };
}

const isComponent = (item) => /Component/i.test(item);

// ---------- MetaTFT comp clusters ----------

export function buildClusters(compsData, lk) {
  const details = compsData?.results?.data?.cluster_details;
  if (!details) return [];
  const games = compsData.results.games ?? {};
  return Object.values(details).map((c) => {
    const units = new Set(c.units_string.split(',').map((s) => s.trim()).filter(Boolean));
    const traits = new Map(
      c.traits_string.split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
        const t = parseTrait(s);
        return [t.base, t.tier];
      }),
    );
    // name_string is the curated title MetaTFT shows; the `name` array is auto-generated and often differs.
    const nameIds = c.name_string
      ? c.name_string.split(',').map((s) => s.trim()).filter(Boolean)
      : (c.name ?? []).map((n) => n.name);
    const nameParts = nameIds.map((id) => ({
      type: lk.traits.has(id) ? 'trait' : lk.augments.has(id) ? 'augment' : 'unit',
      id,
    }));
    const label = nameParts
      .map((n) =>
        n.type === 'trait' ? traitName(lk, n.id) : n.type === 'augment' ? lk.augments.get(n.id).name : unitInfo(lk, n.id).name,
      )
      .join(' ');
    return {
      key: `c${c.Cluster}`,
      id: c.Cluster,
      label: label || c.name_string,
      units,
      traits,
      nameParts,
      metaCount: games[c.Cluster]?.[0]?.count ?? c.overall?.count ?? 0,
      metaAvg: games[c.Cluster]?.[0]?.avg ?? c.overall?.avg ?? null,
    };
  });
}

// Similarity of one board to one cluster, 0..1.
function clusterScore(board, c) {
  let hit = 0;
  for (const u of c.units) if (board.unitIds.has(u)) hit++;
  const unitScore = c.units.size ? hit / c.units.size : 0;

  let tSum = 0;
  for (const [base, tier] of c.traits) tSum += Math.min((board.traitTiers.get(base) ?? 0) / tier, 1);
  const traitScore = c.traits.size ? tSum / c.traits.size : 0;

  // Augment name parts can't be checked: match summaries don't carry augments.
  let nSum = 0;
  let nCount = 0;
  for (const n of c.nameParts) {
    if (n.type === 'unit') nSum += board.unitIds.has(n.id) ? 1 : 0;
    else if (n.type === 'trait') nSum += Math.min((board.traitTiers.get(n.id) ?? 0) / (c.traits.get(n.id) ?? 1), 1);
    else continue;
    nCount++;
  }
  const nameScore = nCount ? nSum / nCount : unitScore;

  return 0.4 * unitScore + 0.25 * traitScore + 0.35 * nameScore;
}

export const CLUSTER_MIN_SCORE = 0.55;

// ---------- Board helpers ----------

function pickCarry(units) {
  let best = null;
  let bestKey = -1;
  for (const u of units) {
    const nItems = u.items.filter((i) => !isComponent(i)).length;
    const key = nItems * 100 + u.tier * 10 + u.cost;
    if (key > bestKey) {
      bestKey = key;
      best = u;
    }
  }
  return best;
}

function pickMainTrait(traits) {
  let best = null;
  let bestKey = -1;
  for (const t of traits) {
    // Older lookups have no `type`; a single 1-unit breakpoint means a unique trait.
    if (t.type === 'unique' || (t.breakpoints === 1 && t.minUnits <= 1)) continue;
    const key = t.style * 100 + t.minUnits;
    if (key > bestKey) {
      bestKey = key;
      best = t;
    }
  }
  return best;
}

// ---------- Profile -> per-match records with LP deltas ----------

export function processProfile(profile, lk, setName) {
  const raw = (profile.matches ?? []).filter((m) => {
    const s = m.summary;
    if (!s || !Array.isArray(s.units) || s.units.length === 0) return false;
    return !setName || !m.tft_set || m.tft_set === setName;
  });

  const matches = raw.map((m) => {
    const s = m.summary;
    const units = s.units.map((u) => {
      const info = unitInfo(lk, u.character_id);
      return {
        id: u.character_id,
        name: info.name,
        cost: info.cost,
        icon: info.icon,
        tier: u.tier ?? 1,
        items: u.itemNames ?? [],
      };
    });
    const traits = (s.traits ?? []).map((str) => {
      const { base, tier } = parseTrait(str);
      const t = lk.traits.get(base);
      const eff = t?.effects?.[tier - 1];
      return {
        base,
        tier,
        name: traitName(lk, base),
        type: t?.type ?? 'unknown',
        style: eff?.style ?? 1,
        minUnits: eff?.minUnits ?? 0,
        breakpoints: t?.effects?.length ?? 0,
        icon: t?.icon,
      };
    });
    return {
      id: m.riot_match_id,
      matchDataUrl: m.match_data_url || (m.riot_match_id ? `https://matches3.metatft.com/${m.riot_match_id}.json` : null),
      ts: m.match_timestamp,
      queue: m.queue_id,
      patch: m.patch ?? '',
      placement: m.placement,
      level: s.level,
      lastRound: s.last_round,
      duration: m.game_duration,
      lobbyAvg: m.avg_rating_numeric ?? null,
      summaryRating: s.player_rating_numeric ?? null,
      units,
      traits,
      unitIds: new Set(units.map((u) => u.id)),
      traitTiers: new Map(traits.map((t) => [t.base, t.tier])),
      carry: pickCarry(units),
      mainTrait: pickMainTrait(traits),
      gameNo: null,
      lpBefore: null,
      lpAfter: null,
      lpDelta: null,
      lpPending: false,
    };
  });
  matches.sort((a, b) => a.ts - b.ts);

  assignLp(matches, profile, setName);
  return matches;
}

// Rating snapshots carry num_games (= ranked games played). Match game #n to snapshot n,
// so delta(n) = snap(n) - snap(n-1). The match summary's rating is the snapshot *before*
// that game, which lets us verify the alignment.
// When MetaTFT's list is missing games the counts drift, so instead each match is anchored on the
// snapshot equal to its "before" rating, and the next snapshot (num_games + 1) counts as its result
// only if it was created after that game started and no other match claimed it.
function assignLp(matches, profile, setName) {
  const ranked = matches.filter((m) => m.queue === RANKED_QUEUE);
  if (!ranked.length) return;

  const snaps = [];
  for (const r of profile.ranked_rating_changes ?? []) {
    if (r.queue_id !== RANKED_QUEUE) continue;
    if (setName && r.tft_set_name && r.tft_set_name !== setName) continue;
    snaps.push({ n: r.num_games, v: r.rating_numeric, t: parseUtc(r.created_timestamp) });
  }
  const byCount = new Map(snaps.map((s) => [s.n, s]));
  const currentGames = profile.ranked?.num_games ?? null;

  const seasonTotal = profile.ranked_season_stats?.[RANKED_QUEUE]?.total ?? 0;
  const total = Math.max(seasonTotal, ranked.length);
  const countNo = (i) => total - (ranked.length - 1 - i);

  let checked = 0;
  let agree = 0;
  ranked.forEach((m, i) => {
    const prev = byCount.get(countNo(i) - 1);
    if (prev && m.summaryRating != null) {
      checked++;
      if (prev.v === m.summaryRating) agree++;
    }
  });
  const complete = currentGames == null || ranked.length >= currentGames;
  const aligned = complete && (checked === 0 || agree / checked >= 0.9);

  if (aligned) {
    ranked.forEach((m, i) => {
      m.gameNo = countNo(i);
      m.lpBefore = byCount.get(m.gameNo - 1)?.v ?? null;
      m.lpAfter = byCount.get(m.gameNo)?.v ?? null;
      if (m.lpBefore != null && m.lpAfter != null) m.lpDelta = m.lpAfter - m.lpBefore;
      if (m.lpAfter == null && i === ranked.length - 1 && currentGames != null && m.gameNo > currentGames) m.lpPending = true;
    });
    return;
  }

  const SKEW = 5 * 60 * 1000; // snapshot clocks run a few minutes off match timestamps
  // The "before" snapshot must predate the game's end by a margin, otherwise an unchanged rating
  // (e.g. demotion protection) would make this game's own result look like its starting point.
  const BEFORE_MARGIN = 12 * 60 * 1000;
  const claimed = new Set();
  let lastNo = 0;
  ranked.forEach((m, i) => {
    const start = m.ts - (m.duration ?? 0) * 1000;
    let anchor = null;
    if (m.summaryRating != null) {
      for (const s of snaps) {
        if (s.v === m.summaryRating && s.t <= m.ts - BEFORE_MARGIN && (!anchor || s.t > anchor.t)) anchor = s;
      }
    }
    m.gameNo = anchor && anchor.n + 1 > lastNo ? anchor.n + 1 : lastNo + 1;
    lastNo = m.gameNo;
    if (!anchor) return;
    m.lpBefore = anchor.v;
    const next = byCount.get(anchor.n + 1);
    if (next && next.t > start - SKEW && !claimed.has(next.n)) {
      claimed.add(next.n);
      m.lpAfter = next.v;
      m.lpDelta = next.v - anchor.v;
    } else if (!next && i === ranked.length - 1 && anchor.n === currentGames) {
      m.lpPending = true;
    }
  });
}

function parseUtc(s) {
  if (!s) return NaN;
  return Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`);
}

// ---------- Grouping ----------

export const GROUP_MODES = {
  cluster: 'Đội hình MetaTFT',
  traitCarry: 'Tộc/Hệ chính + Carry',
  carry: 'Carry chính',
  trait: 'Tộc/Hệ chính',
};

export function classify(matches, mode, clusters, t = null) {
  const offMetaText = t ? t('offMeta') : '(ngoài meta)';
  const noTraitText = t ? t('noTrait') : 'Không tộc';
  for (const m of matches) {
    const carry = m.carry ? m.carry.name : '?';
    const trait = m.mainTrait ? m.mainTrait.name : noTraitText;
    let key;
    let label;
    let score = null;
    if (mode === 'cluster' && clusters.length) {
      let best = null;
      let bestScore = -1;
      for (const c of clusters) {
        const sc = clusterScore(m, c);
        if (sc > bestScore) {
          bestScore = sc;
          best = c;
        }
      }
      score = bestScore;
      if (best && bestScore >= CLUSTER_MIN_SCORE) {
        key = best.key;
        label = best.label;
      } else {
        key = `x:${trait}|${carry}`;
        label = `${trait} ${carry} ${offMetaText}`;
      }
    } else if (mode === 'carry') {
      key = `u:${carry}`;
      label = carry;
    } else if (mode === 'trait') {
      key = `t:${trait}`;
      label = trait;
    } else {
      key = `tc:${trait}|${carry}`;
      label = `${trait} ${carry}`;
    }
    m.compKey = key;
    m.compLabel = label;
    m.compScore = score;
  }
}

// ---------- Aggregation ----------

export function aggregate(matches) {
  const groups = new Map();
  for (const m of matches) {
    let g = groups.get(m.compKey);
    if (!g) {
      g = {
        key: m.compKey,
        label: m.compLabel,
        games: 0,
        placements: [0, 0, 0, 0, 0, 0, 0, 0],
        placeSum: 0,
        top4: 0,
        wins: 0,
        lpNet: 0,
        lpGames: 0,
        rankedGames: 0,
        first: Infinity,
        last: 0,
        unitFreq: new Map(),
        matches: [],
      };
      groups.set(m.compKey, g);
    }
    g.games++;
    g.placements[m.placement - 1]++;
    g.placeSum += m.placement;
    if (m.placement <= 4) g.top4++;
    if (m.placement === 1) g.wins++;
    if (m.queue === RANKED_QUEUE) g.rankedGames++;
    if (m.lpDelta != null) {
      g.lpNet += m.lpDelta;
      g.lpGames++;
    }
    g.first = Math.min(g.first, m.ts);
    g.last = Math.max(g.last, m.ts);
    for (const u of m.units) {
      const f = g.unitFreq.get(u.id) ?? { unit: u, n: 0, items: 0 };
      f.n++;
      f.items += u.items.filter((i) => !isComponent(i)).length;
      g.unitFreq.set(u.id, f);
    }
    g.matches.push(m);
  }
  for (const g of groups.values()) {
    g.avgPlace = g.placeSum / g.games;
    g.top4Rate = g.top4 / g.games;
    g.winRate = g.wins / g.games;
    g.lpPerGame = g.lpGames ? g.lpNet / g.lpGames : null;
    g.coreUnits = [...g.unitFreq.values()]
      .filter((f) => f.n / g.games >= 0.5)
      .sort((a, b) => b.items / b.n - a.items / a.n || b.unit.cost - a.unit.cost)
      .slice(0, 9)
      .map((f) => f.unit);
  }
  return [...groups.values()];
}

export function summarize(matches) {
  const n = matches.length;
  if (!n) return { games: 0, avgPlace: null, top4Rate: null, winRate: null, lpNet: 0 };
  let place = 0;
  let top4 = 0;
  let wins = 0;
  let lpNet = 0;
  for (const m of matches) {
    place += m.placement;
    if (m.placement <= 4) top4++;
    if (m.placement === 1) wins++;
    if (m.lpDelta != null) lpNet += m.lpDelta;
  }
  return { games: n, avgPlace: place / n, top4Rate: top4 / n, winRate: wins / n, lpNet };
}

// ---------- Input parsing ----------

export const REGIONS = [
  { slug: 'vn', api: 'VN2', label: 'VN' },
  { slug: 'na', api: 'NA1', label: 'NA' },
  { slug: 'euw', api: 'EUW1', label: 'EUW' },
  { slug: 'eune', api: 'EUN1', label: 'EUNE' },
  { slug: 'kr', api: 'KR', label: 'KR' },
  { slug: 'jp', api: 'JP1', label: 'JP' },
  { slug: 'br', api: 'BR1', label: 'BR' },
  { slug: 'lan', api: 'LA1', label: 'LAN' },
  { slug: 'las', api: 'LA2', label: 'LAS' },
  { slug: 'oce', api: 'OC1', label: 'OCE' },
  { slug: 'tr', api: 'TR1', label: 'TR' },
  { slug: 'ru', api: 'RU', label: 'RU' },
  { slug: 'tw', api: 'TW2', label: 'TW' },
  { slug: 'sg', api: 'SG2', label: 'SG' },
  { slug: 'th', api: 'TH2', label: 'TH' },
  { slug: 'ph', api: 'PH2', label: 'PH' },
  { slug: 'me', api: 'ME1', label: 'ME' },
  { slug: 'pbe', api: 'PBE1', label: 'PBE' },
];

export function regionToSlug(apiOrSlug) {
  if (!apiOrSlug) return 'vn';
  const s = String(apiOrSlug).toLowerCase();
  const found = REGIONS.find((r) => r.slug === s || r.api.toLowerCase() === s);
  return found ? found.slug : s;
}

export function regionToLabel(apiOrSlug) {
  if (!apiOrSlug) return 'VN';
  const s = String(apiOrSlug).toLowerCase();
  const found = REGIONS.find((r) => r.slug === s || r.api.toLowerCase() === s);
  return found ? found.label : s.toUpperCase();
}

export function getTierColor(ratingText) {
  if (!ratingText) return 'var(--text-muted)';
  const t = ratingText.toUpperCase();
  if (t.includes('CHALLENGER')) return '#f5b041';
  if (t.includes('GRANDMASTER')) return '#e74c3c';
  if (t.includes('MASTER')) return '#d55181';
  if (t.includes('DIAMOND')) return '#3987e5';
  if (t.includes('EMERALD')) return '#199e70';
  if (t.includes('PLATINUM')) return '#24a896';
  if (t.includes('GOLD')) return '#e9b949';
  if (t.includes('SILVER')) return '#8ba2a7';
  if (t.includes('BRONZE')) return '#a77044';
  if (t.includes('IRON')) return '#8c857b';
  return 'var(--text-secondary)';
}

// Accepts "Name#Tag" or a MetaTFT player URL (…/player/vn/Name-Tag).
export function parsePlayerInput(text, regionSlug) {
  const s = text.trim();
  const url = /metatft\.com\/player\/([a-z0-9]+)\/([^/?#]+)/i.exec(s);
  if (url) {
    const slug = url[1].toLowerCase();
    const full = decodeURIComponent(url[2]);
    const cut = full.lastIndexOf('-');
    if (cut <= 0) return null;
    return { region: slug, name: full.slice(0, cut), tag: full.slice(cut + 1) };
  }
  const hash = s.lastIndexOf('#');
  if (hash <= 0 || hash === s.length - 1) return null;
  return { region: regionSlug, name: s.slice(0, hash).trim(), tag: s.slice(hash + 1).trim() };
}
