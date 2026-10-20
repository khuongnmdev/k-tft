// Internationalization (i18n) module for k-tft
// Supports English ('en') and Vietnamese ('vi') with automatic browser language detection.

export const SUPPORTED_LANGS = ['vi', 'en'];
export const DEFAULT_LANG = 'vi';

export const TRANSLATIONS = {
  vi: {
    appTitle: 'k-tft · Thống kê đội hình & Leo rank TFT',
    metaTitle: 'k-tft · Thống kê đội hình & Leo rank TFT',
    metaDesc: 'Tra cứu lịch sử trận, tỉ lệ thắng (Top 1), tỉ lệ Top 4, điểm LP ròng và biểu đồ leo rank theo từng đội hình TFT (Đấu Trường Chân Lý) dựa trên dữ liệu MetaTFT & Riot Games.',
    playerMetaTitle: '{name}#{tag} · Thống kê đội hình & Leo rank TFT | k-tft',
    playerMetaDesc: 'Thống kê chi tiết đội hình, tỉ lệ thắng, Top 4 và lịch sử leo rank TFT của {name}#{tag} ({season}).',
    brandSub: 'thống kê đội hình',
    playerPlaceholder: 'Tên#Tag hoặc link MetaTFT',
    searchRecentTitle: 'Tìm kiếm gần đây',
    searchSuggestedTitle: 'Gợi ý người chơi',
    searchClearRecent: 'Xóa',
    searchNoResults: 'Không tìm thấy người chơi nào',
    searchSearching: 'Đang tìm kiếm…',
    searchEmptyHint: 'Gõ tên người chơi hoặc Riot ID để tìm kiếm',
    searchGamesCount: '{n} trận',
    viewBtn: 'Xem',
    refreshBtn: 'Cập nhật',
    refreshBtnTitle: 'Yêu cầu MetaTFT cập nhật trận mới',
    seasonLabel: 'Mùa',
    groupByLabel: 'Nhóm theo',
    modeLabel: 'Chế độ',
    queueRanked: 'Xếp hạng',
    queueAll: 'Tất cả',
    patchLabel: 'Patch',
    patchAll: 'Tất cả',
    minGamesLabel: 'Ẩn đội dưới',
    minGamesUnit: '{n} trận',
    clearSel: 'Bỏ chọn đội',
    copyLink: 'Sao chép link',
    copyLinkTitle: 'Link giữ nguyên mùa, bộ lọc và đội đang chọn',
    linkCopied: 'Đã sao chép',
    linkCopyFailed: 'Không sao chép được',
    compsHeading: 'Đội hình đã chơi',
    compsHint: 'Bấm vào một đội để xem chart leo rank và lịch sử trận của đội đó.',
    compsTipClusterCur: 'Ghép theo comp meta MetaTFT của {season} (patch hiện tại). {tip}',
    compsTipClusterOld: 'Ghép theo comp meta MetaTFT của {season} (bản cuối mùa). {tip}',
    compsTipFallback: 'MetaTFT không còn comp meta cho {season}, đang nhóm theo Tộc/Hệ chính + Carry. {tip}',

    // Table
    thComp: 'Đội hình',
    thGames: 'Trận',
    thTop1: 'Top 1',
    thTop4: 'Top 4',
    thAvgPlace: 'Hạng TB',
    thLpNet: 'LP ròng',
    thLpPerGame: 'LP/trận',
    thRecent: 'Gần đây',
    noCompsMatched: 'Không có trận nào khớp bộ lọc.',

    // Charts
    lpTitle: 'Leo rank theo thời gian',
    lpTitleComp: 'Leo rank theo thời gian · {name}',
    lpHint: 'Mỗi chấm là LP sau một trận xếp hạng, tô màu theo đội hình đã chơi. Bấm chấm hoặc chú thích để chọn đội.',
    lpHintEmpty: 'Không có dữ liệu LP cho bộ lọc này (chỉ trận Xếp hạng mới có LP).',
    lpAxisX: 'Trận xếp hạng thứ',
    legendOther: 'Khác',
    tooltipMatch: 'Trận #{gameNo} · {date}',
    tooltipPlace: 'Hạng {place}',

    cumTitle: 'LP cộng dồn theo đội hình',
    cumHint: 'Nếu chỉ chơi đội đó thì đã lên/xuống bao nhiêu LP.',
    cumAxisX: 'Số trận chơi đội này (có LP)',
    cumAxisY: 'LP cộng dồn',
    cumStart: ' Bắt đầu: 0 LP',
    cumTooltip: ' Lần {x}: {y} LP (trận này {delta}, hạng {place})',

    netTitle: 'LP ròng theo đội hình',
    netHint: 'Đội nào kéo rank lên, đội nào kéo xuống.',
    netAxisX: 'LP',
    netTooltip: ' {net} LP qua {games} trận ({perGame} LP/trận)',

    placeTitle: 'Phân bố thứ hạng',
    placeTitleComp: 'Phân bố thứ hạng · {name}',
    placeHint: '{n} trận',
    placeAxisX: 'Thứ hạng',
    placeTooltipTitle: 'Hạng {place}',
    placeTooltipLabel: ' {count} trận ({pct})',

    summaryTitle: 'Tóm tắt',
    summaryHintAll: 'Tất cả đội hình (theo bộ lọc)',

    matchesTitle: 'Lịch sử trận',
    matchesTitleComp: 'Lịch sử trận · {name} ({count})',
    matchesTitleCount: 'Lịch sử trận ({count})',
    viewMoreMatches: 'Xem thêm ({count})',
    noMatches: 'Không có trận nào.',
    matchSelfTag: 'Bạn',
    matchLobbyTitle: 'Chi tiết sảnh đấu (8 người chơi)',
    matchLoadingDetails: 'Đang tải thông tin 8 người chơi…',
    matchLoadError: 'Không thể tải chi tiết trận đấu này.',
    matchRetry: 'Thử lại',
    matchLvl: 'Lv {lvl}',
    matchRound: 'Vòng {round}',
    matchGold: '{gold} vàng',
    matchDamage: '{dmg} ST',
    matchClickToExpand: 'Bấm để xem chi tiết 8 người chơi',
    matchClickToCollapse: 'Bấm để thu gọn',
    matchViewProfile: 'Xem thống kê {name}#{tag}',
    lobbyColRank: 'Hạng',
    lobbyColPlayer: 'Người chơi',
    lobbyColBoard: 'Đội hình',
    lobbyColTraits: 'Tộc / Hệ',
    lobbyTop4: 'Top 4 (Thắng)',
    lobbyBot4: 'Bot 4 (Thua)',

    // Tiles
    tileGames: 'Trận',
    tileAvgPlace: 'Hạng TB',
    tileTop4: 'Top 4',
    tileTop1: 'Top 1',
    tileNetLp: 'LP ròng',
    tileLpPerGame: 'LP/trận',
    tileNumComps: 'Số đội hình',
    tileMetaAvg: 'Hạng TB meta (patch này)',
    tileFirstPlayed: 'Chơi lần đầu',
    tileLastPlayed: 'Gần nhất',

    // Player card
    unranked: 'Chưa có rank',
    rankedGamesCount: '{n} trận xếp hạng',
    serverRank: 'Hạng #{rank}',
    serverRankTooltip: 'Hạng #{rank} trên {total} người chơi ({top})',
    serverStandingLabel: 'so với máy chủ',
    peakRank: 'Cao nhất: {rank}',
    partialNotice: 'MetaTFT chỉ còn lưu đội hình của {stored}/{total} trận xếp hạng mùa này.',
    lpDataNotice: 'Có dữ liệu LP: {withLp}/{total} trận xếp hạng',
    lpDataNoticeTitle: 'MetaTFT không lưu LP sau mọi trận; trận thiếu dữ liệu không được tính vào LP ròng.',

    // Titles (Danh hiệu kỳ thủ)
    titleKingOf: 'Vua {name}',
    titleDescKingOf: 'Chơi {games} trận {comp} mùa này',
    titleLordOf: 'Chúa Tể {name}',
    titleDescLordOf: 'Chơi {games} trận {comp} mùa này',
    titleMasterOf: 'Bậc Thầy {name}',
    titleDescMasterOf: 'Chơi {games} trận {comp} mùa này',
    titleTftMachine: 'Cỗ Máy Đánh Cờ',
    titleDescTftMachine: 'Đã cày hơn {n} trận trong mùa',
    titleGrindLord: 'Chiến Thần Cày Rank',
    titleDescGrindLord: 'Đã cày hơn {n} trận trong mùa',
    titleVeteran: 'Kỳ Thủ Bền Bỉ',
    titleDescVeteran: 'Đã hoàn thành {n} trận xếp hạng',
    titleRegular: 'Chiến Binh Dạn Dày',
    titleDescRegular: 'Đã chơi {n} trận trong mùa',
    titleNewcomer: 'Tân Binh Tiềm Năng',
    titleDescNewcomer: 'Khởi đầu mùa giải với {n} trận',
    titleLpTycoon: 'Thần Tài LP',
    titleDescLpTycoon: 'Đã kiếm được +{lp} LP ròng mùa này',
    titleLpClimber: 'Tay Lái Lụa LP',
    titleDescLpClimber: 'Thu về +{lp} LP ròng',
    titleWinHunter: 'Thợ Săn Top 1',
    titleDescWinHunter: 'Tỉ lệ Top 1 ấn tượng ({rate}%)',
    titleTop4Maestro: 'Bậc Thầy Top 4',
    titleDescTop4Maestro: 'Tỉ lệ vào Top 4 cực đỉnh ({rate}%)',
    titleTop4Specialist: 'Chuyên Gia Giữ Top',
    titleDescTop4Specialist: 'Tỉ lệ vào Top 4 ổn định ({rate}%)',
    titleOneTrick: 'One-Trick Kỳ Thủ',
    titleDescOneTrick: 'Dành {pct}% số trận cho {comp}',
    titleFlexMaster: 'Vạn Bài Thông',
    titleDescFlexMaster: 'Chơi linh hoạt hơn {n} đội hình khác nhau',
    titleServerElite: 'Đỉnh Cao Máy Chủ',
    titleDescServerElite: 'Thuộc Top {top}% người chơi hàng đầu máy chủ',
    titleServerGrandmaster: 'Chiến Tướng Máy Chủ',
    titleDescServerGrandmaster: 'Thuộc Top {top}% máy chủ',
    compFavTag: 'Bài tủ',
    compFavTitle: 'Đội hình được chơi nhiều nhất ({n} trận)',

    // Statuses
    loadingPlayer: 'Đang tải {season}của {name}#{tag}…',
    requestingRefresh: 'Đang yêu cầu MetaTFT cập nhật {name}#{tag}…',
    noMatchesInSeason: 'Không có trận nào trong {season}.',
    notFoundError: 'Không tìm thấy {name}#{tag} trên MetaTFT. Kiểm tra lại tên, tag và server.',
    loadError: 'Lỗi khi tải dữ liệu: {msg}',
    invalidInput: 'Nhập Riot ID dạng Tên#Tag (vd: Akite Bánh Mì#akite) hoặc dán link MetaTFT.',
    unsupportedServer: 'Server “{region}” chưa được hỗ trợ.',
    determiningSeasonError: 'Không xác định được mùa hiện tại.',
    lpPending: 'chờ cập nhật',

    // Group Modes
    groupCluster: 'Đội hình MetaTFT',
    groupTraitCarry: 'Tộc/Hệ chính + Carry',
    groupCarry: 'Carry chính',
    groupTrait: 'Tộc/Hệ chính',
    offMeta: '(ngoài meta)',
    noTrait: 'Không tộc',

    // Queues
    queueNormal: 'Thường',
    queueHyperRoll: 'Siêu tốc',
    queueDoubleUp: 'Double Up',

    // Footer
    footerText: 'Dữ liệu lấy từ MetaTFT (API không chính thức). Đội hình được ghép với các comp meta MetaTFT lưu cho từng mùa.',
  },

  en: {
    appTitle: 'k-tft · TFT Comp Stats & Rank Climber',
    metaTitle: 'k-tft · TFT Comp Stats & Rank Progression Tracker',
    metaDesc: 'Track TFT win rates, Top 4 rates, net LP gains, and rank climbing charts by team composition using MetaTFT & Riot Games data.',
    playerMetaTitle: '{name}#{tag} · TFT Comp Stats & Rank Progression | k-tft',
    playerMetaDesc: 'Detailed TFT stats, comp win rates, Top 4 rates, and rank progression chart for {name}#{tag} ({season}).',
    brandSub: 'comp statistics',
    playerPlaceholder: 'Name#Tag or MetaTFT link',
    searchRecentTitle: 'Recent Searches',
    searchSuggestedTitle: 'Suggested Players',
    searchClearRecent: 'Clear',
    searchNoResults: 'No players found',
    searchSearching: 'Searching…',
    searchEmptyHint: 'Type a player name or Riot ID to search',
    searchGamesCount: '{n} games',
    viewBtn: 'View',
    refreshBtn: 'Update',
    refreshBtnTitle: 'Request MetaTFT to fetch new matches',
    seasonLabel: 'Season',
    groupByLabel: 'Group by',
    modeLabel: 'Queue',
    queueRanked: 'Ranked',
    queueAll: 'All',
    patchLabel: 'Patch',
    patchAll: 'All',
    minGamesLabel: 'Min games',
    minGamesUnit: '{n} games',
    clearSel: 'Clear selection',
    copyLink: 'Copy link',
    copyLinkTitle: 'Link preserves season, filters, and selected comp',
    linkCopied: 'Copied!',
    linkCopyFailed: 'Copy failed',
    compsHeading: 'Played Compositions',
    compsHint: 'Click a comp to view its rank climb chart and match history.',
    compsTipClusterCur: 'Matched against MetaTFT meta comps for {season} (current patch). {tip}',
    compsTipClusterOld: 'Matched against MetaTFT meta comps for {season} (end of season). {tip}',
    compsTipFallback: 'MetaTFT has no meta comps for {season}, grouping by Main Trait + Carry. {tip}',

    // Table
    thComp: 'Composition',
    thGames: 'Games',
    thTop1: 'Top 1',
    thTop4: 'Top 4',
    thAvgPlace: 'Avg Place',
    thLpNet: 'Net LP',
    thLpPerGame: 'LP/Game',
    thRecent: 'Recent',
    noCompsMatched: 'No matches match the current filter.',

    // Charts
    lpTitle: 'Rank Progression Over Time',
    lpTitleComp: 'Rank Progression Over Time · {name}',
    lpHint: 'Each dot represents LP after a ranked match, colored by comp played. Click a dot or legend chip to select.',
    lpHintEmpty: 'No LP data available for this filter (only Ranked games track LP).',
    lpAxisX: 'Ranked Match #',
    legendOther: 'Other',
    tooltipMatch: 'Match #{gameNo} · {date}',
    tooltipPlace: 'Place #{place}',

    cumTitle: 'Cumulative LP by Comp',
    cumHint: 'LP you would have gained/lost if you only played this comp.',
    cumAxisX: 'Games played with this comp (with LP)',
    cumAxisY: 'Cumulative LP',
    cumStart: ' Start: 0 LP',
    cumTooltip: ' Game {x}: {y} LP (this match {delta}, place {place})',

    netTitle: 'Net LP by Comp',
    netHint: 'Comps that gained vs. lost LP.',
    netAxisX: 'LP',
    netTooltip: ' {net} LP over {games} games ({perGame} LP/game)',

    placeTitle: 'Placement Distribution',
    placeTitleComp: 'Placement Distribution · {name}',
    placeHint: '{n} games',
    placeAxisX: 'Placement',
    placeTooltipTitle: 'Place #{place}',
    placeTooltipLabel: ' {count} games ({pct})',

    summaryTitle: 'Summary',
    summaryHintAll: 'All comps (filtered)',

    matchesTitle: 'Match History',
    matchesTitleComp: 'Match History · {name} ({count})',
    matchesTitleCount: 'Match History ({count})',
    viewMoreMatches: 'Load more ({count})',
    noMatches: 'No matches found.',
    matchSelfTag: 'You',
    matchLobbyTitle: 'Lobby Details (8 Players)',
    matchLoadingDetails: 'Loading 8-player lobby details…',
    matchLoadError: 'Could not load lobby details for this match.',
    matchRetry: 'Retry',
    matchLvl: 'Lv {lvl}',
    matchRound: 'Round {round}',
    matchGold: '{gold}g',
    matchDamage: '{dmg} dmg',
    matchClickToExpand: 'Click to view 8-player lobby',
    matchClickToCollapse: 'Click to collapse',
    matchViewProfile: 'View stats for {name}#{tag}',
    lobbyColRank: 'Rank',
    lobbyColPlayer: 'Player',
    lobbyColBoard: 'Board',
    lobbyColTraits: 'Traits',
    lobbyTop4: 'Top 4',
    lobbyBot4: 'Bot 4',

    // Tiles
    tileGames: 'Games',
    tileAvgPlace: 'Avg Place',
    tileTop4: 'Top 4',
    tileTop1: 'Top 1',
    tileNetLp: 'Net LP',
    tileLpPerGame: 'LP/Game',
    tileNumComps: 'Compositions',
    tileMetaAvg: 'Meta Avg Place (this patch)',
    tileFirstPlayed: 'First played',
    tileLastPlayed: 'Most recent',

    // Player card
    unranked: 'Unranked',
    rankedGamesCount: '{n} ranked games',
    serverRank: 'Rank #{rank}',
    serverRankTooltip: 'Rank #{rank} out of {total} players ({top})',
    serverStandingLabel: 'on server',
    peakRank: 'Peak: {rank}',
    partialNotice: 'MetaTFT only retained boards for {stored}/{total} ranked matches this season.',
    lpDataNotice: 'LP data available: {withLp}/{total} ranked games',
    lpDataNoticeTitle: 'MetaTFT does not record LP after every match; unrecorded games are excluded from Net LP.',

    // Titles
    titleKingOf: 'King of {name}',
    titleDescKingOf: '{games} matches with {comp} this season',
    titleLordOf: 'Lord of {name}',
    titleDescLordOf: '{games} matches with {comp} this season',
    titleMasterOf: 'Master of {name}',
    titleDescMasterOf: '{games} matches with {comp} this season',
    titleTftMachine: 'TFT Machine',
    titleDescTftMachine: 'Grinded over {n} matches this season',
    titleGrindLord: 'Grind Warlord',
    titleDescGrindLord: 'Over {n} matches played this season',
    titleVeteran: 'Dedicated Tactician',
    titleDescVeteran: 'Completed {n} ranked games',
    titleRegular: 'Battle Hardened',
    titleDescRegular: 'Played {n} matches this season',
    titleNewcomer: 'Rising Tactician',
    titleDescNewcomer: 'Starting the season with {n} matches',
    titleLpTycoon: 'LP Tycoon',
    titleDescLpTycoon: 'Accumulated +{lp} Net LP this season',
    titleLpClimber: 'LP Climber',
    titleDescLpClimber: 'Earned +{lp} Net LP',
    titleWinHunter: 'Champion Hunter',
    titleDescWinHunter: 'Impressive {rate}% win rate',
    titleTop4Maestro: 'Top 4 Maestro',
    titleDescTop4Maestro: 'Exceptional {rate}% Top 4 rate',
    titleTop4Specialist: 'Top 4 Specialist',
    titleDescTop4Specialist: 'Consistent {rate}% Top 4 rate',
    titleOneTrick: 'One-Trick Tactician',
    titleDescOneTrick: 'Dedicated {pct}% of games to {comp}',
    titleFlexMaster: 'Flex Master',
    titleDescFlexMaster: 'Flexibly played over {n} different comps',
    titleServerElite: 'Server Elite',
    titleDescServerElite: 'Top {top}% best players on the server',
    titleServerGrandmaster: 'Server Grandmaster',
    titleDescServerGrandmaster: 'Top {top}% on the server',
    compFavTag: 'Favorite',
    compFavTitle: 'Most played composition ({n} matches)',

    // Statuses
    loadingPlayer: 'Loading {season}for {name}#{tag}…',
    requestingRefresh: 'Requesting MetaTFT to refresh {name}#{tag}…',
    noMatchesInSeason: 'No matches found in {season}.',
    notFoundError: 'Player {name}#{tag} not found on MetaTFT. Please verify name, tag, and region.',
    loadError: 'Error loading data: {msg}',
    invalidInput: 'Enter Riot ID as Name#Tag (e.g. Akite Bánh Mì#akite) or paste MetaTFT link.',
    unsupportedServer: 'Region “{region}” is not supported.',
    determiningSeasonError: 'Unable to determine current season.',
    lpPending: 'pending update',

    // Group Modes
    groupCluster: 'MetaTFT Comps',
    groupTraitCarry: 'Main Trait + Carry',
    groupCarry: 'Main Carry',
    groupTrait: 'Main Trait',
    offMeta: '(off-meta)',
    noTrait: 'No trait',

    // Queues
    queueNormal: 'Normal',
    queueHyperRoll: 'Hyper Roll',
    queueDoubleUp: 'Double Up',

    // Footer
    footerText: 'Data sourced from MetaTFT (unofficial API). Compositions are matched against MetaTFT season meta comps.',
  },
};

let currentLang = DEFAULT_LANG;

export function detectLanguage() {
  // 1. URL search param: ?lang=vi or ?lang=en (or ?l=...)
  if (typeof window !== 'undefined' && window.location?.search) {
    const params = new URLSearchParams(window.location.search);
    const paramLang = params.get('lang') || params.get('l');
    if (paramLang && SUPPORTED_LANGS.includes(paramLang.toLowerCase())) {
      return paramLang.toLowerCase();
    }
  }

  // 2. localStorage
  try {
    const saved = localStorage.getItem('k-tft:lang');
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  } catch {}

  // 3. User navigator language
  if (typeof navigator !== 'undefined') {
    const userLangs = navigator.languages || [navigator.language || ''];
    for (const l of userLangs) {
      if (l.toLowerCase().startsWith('vi')) return 'vi';
    }
    // If user's language is English or any other language, default to 'en'
    return 'en';
  }

  return DEFAULT_LANG;
}

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (SUPPORTED_LANGS.includes(lang)) {
    currentLang = lang;
    try {
      localStorage.setItem('k-tft:lang', lang);
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }
}

export function t(key, vars = {}) {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS[DEFAULT_LANG];
  let str = dict[key] || TRANSLATIONS[DEFAULT_LANG][key] || key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replaceAll(`{${k}}`, v);
  }
  return str;
}

export function getMetaTftLocale() {
  return currentLang === 'vi' ? 'vi_vn' : 'en_us';
}

// Initialize detected language
currentLang = detectLanguage();
