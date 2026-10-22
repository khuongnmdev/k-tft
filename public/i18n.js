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

    // Tabs & Navigation
    tabProfile: 'Hồ sơ kỳ thủ',
    tabMeta: 'Meta Tier List',

    // Favorites
    favoriteAdd: 'Ghim kỳ thủ',
    favoriteRemove: 'Bỏ ghim',
    favoriteTitle: 'Kỳ thủ đã ghim',

    // Placement Distribution & Playstyle
    placementHeading: 'Phân bố thứ hạng & Lối chơi',
    placement1to4: 'Top 4 (Thắng)',
    placement5to8: 'Bot 4 (Thua)',
    playstyleBalanced: 'Cân bằng & Toàn diện',
    playstyleBalancedDesc: 'Tỉ lệ vào các thứ hạng đồng đều, xử lý tốt nhiều tình huống.',
    playstyleHighRoller: 'Liều ăn nhiều (Fast 8 / High Roll)',
    playstyleHighRollerDesc: 'Tập trung nhiều ở Top 1 hoặc Top 8. Chấp nhận rủi ro để giành chức vô địch.',
    playstyleStabilizer: 'Giữ máu chắc tay (Mid-game Stabilizer)',
    playstyleStabilizerDesc: 'Đa số về đích ở Top 2–4. Lối đánh an toàn, tối ưu bảo toàn LP.',
    playstyleChampion: 'Nhà Vô Địch (Win Dominator)',
    playstyleChampionDesc: 'Tỉ lệ Top 1 vượt trội, khả năng snowball ván đấu cực mạnh.',
    playstyleFast8th: 'Kỳ Thủ Cóng Tay (Tilt Alert)',
    playstyleFast8thDesc: 'Tỉ lệ Top 8 cao, cần chú ý def máu và xoay bài giữa trận.',
    playstyleConsistent: 'Chiến Thần Leo Rank (Steady Climber)',
    playstyleConsistentDesc: 'Tỉ lệ Top 4 trên 58%, phong độ ổn định và tích lũy điểm đều đặn.',

    // Recent Form & Streaks
    streakWin: '👑 Chuỗi {n} trận Top 1',
    streakTop4: '🔥 Chuỗi {n} trận Top 4',
    streakBot4: '🧊 Chuỗi {n} trận Bot 4',
    formLast10: 'Phong độ 10 trận gần nhất',
    formHot: 'Rực sáng (Hạng TB {avg})',
    formCold: 'Chững lại (Hạng TB {avg})',
    formSteady: 'Ổn định (Hạng TB {avg})',

    // Mastery (Champions & Items)
    masteryHeading: 'Tướng gánh & Trang bị trấn phái',
    masteryChamps: 'Tướng chơi nhiều nhất',
    masteryItems: 'Trang bị yêu thích',
    mastery3Star: '{n} lần 3⭐',
    masteryGames: '{n} trận',
    masteryTopItems: 'Trang bị thường dùng',

    // Meta Tier List
    metaTierHeading: 'Meta Tier List · {season}',
    metaTierDesc: 'Danh sách các đội hình meta mạnh nhất kết hợp với hiệu suất chơi của bạn.',
    metaColComp: 'Đội hình',
    metaColTier: 'Tier',
    metaColAvg: 'Hạng TB Meta',
    metaColMetaCount: 'Độ phổ biến',
    metaColYourStats: 'Hiệu suất của bạn',
    metaYouPlayed: '{games} trận · Hạng {avg}',
    metaNotPlayed: 'Chưa chơi đội này',
    metaBetter: '(+{diff} tốt hơn meta)',
    metaWorse: '({diff} so với meta)',

    // Compare 1v1
    compareBtn: '⚔️ So sánh 1v1',
    compareModalTitle: 'So sánh kỳ thủ 1v1',
    compareInputPlaceholder: 'Nhập Riot ID đối thủ (Tên#Tag)...',
    compareSubmit: 'So sánh',
    compareVs: 'VS',
    comparePlayer1: 'Kỳ thủ 1',
    comparePlayer2: 'Kỳ thủ 2',
    compareRank: 'Bậc xếp hạng',
    compareWinRate: 'Tỉ lệ Top 1',
    compareTop4Rate: 'Tỉ lệ Top 4',
    compareAvgPlace: 'Hạng trung bình',
    compareNetLp: 'LP ròng',
    compareFavoriteComp: 'Bài tủ',

    // Compare page
    cmpPageTitle: '{a} vs {b} · So sánh 1v1 | k-tft',
    cmpPageDesc: 'So sánh rank, tỉ lệ Top 4, Top 1, LP, đội hình và tướng tủ của {a} và {b} ({season}).',
    cmpBrandSub: 'so sánh 1v1',
    cmpLoading: 'Đang tải {season}của {a} và {b}…',
    cmpMissingPlayers: 'Link so sánh thiếu người chơi. Mở trang một kỳ thủ rồi bấm "So sánh 1v1".',
    cmpNotFound: 'MetaTFT chưa có dữ liệu của {name}#{tag}. Mở trang kỳ thủ đó, bấm "Cập nhật" rồi thử lại.',
    cmpSwap: '⇄ Đổi bên',
    cmpScore: 'Hơn {n}/{total} chỉ số',
    cmpGamesShown: '{n} trận · {queue}',
    cmpStatsHeading: 'Chỉ số đối đầu',
    cmpStatsHint: 'Ô xanh là bên tốt hơn ở chỉ số đó.',
    cmpPeak: 'Rank cao nhất',
    cmpServerRank: 'Hạng máy chủ',
    cmpSeasonGames: 'Trận xếp hạng cả mùa',
    cmpEighthRate: 'Tỉ lệ về 8',
    cmpLast10: 'Hạng TB 10 trận gần nhất',
    cmpAvgLevel: 'Cấp cuối trận (TB)',
    cmpAvgRound: 'Trụ tới vòng (TB)',
    cmpPlaystyle: 'Lối chơi',
    cmpPlacementHint: '% số trận ở mỗi thứ hạng.',
    cmpLpHint: 'LP sau mỗi trận xếp hạng của từng người.',
    cmpCommonComps: 'Đội hình cả hai cùng chơi',
    cmpCommonHint: 'Cùng một đội hình, ai chơi tốt hơn. {mode}',
    cmpNoCommon: 'Hai người chưa chơi chung đội hình nào.',
    cmpTopComps: 'Đội hình chơi nhiều nhất',

    // Share Card
    shareBtn: '📸 Chia sẻ thẻ',
    shareModalTitle: 'Thẻ thông tin kỳ thủ',
    shareModalDesc: 'Ảnh thẻ profile chuẩn eSports được tạo tự động để bạn chia sẻ lên Facebook, Discord hoặc gửi cho bạn bè.',
    shareDownload: 'Tải ảnh PNG',
    shareCopy: 'Sao chép ảnh',
    shareCopied: 'Đã sao chép ảnh vào clipboard!',
    shareClose: 'Đóng',

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

    // Tabs & Navigation
    tabProfile: 'Player Profile',
    tabMeta: 'Meta Tier List',

    // Favorites
    favoriteAdd: 'Pin Player',
    favoriteRemove: 'Unpin Player',
    favoriteTitle: 'Pinned Players',

    // Placement Distribution & Playstyle
    placementHeading: 'Placement Distribution & Playstyle',
    placement1to4: 'Top 4 (Win)',
    placement5to8: 'Bot 4 (Loss)',
    playstyleBalanced: 'Balanced & Adaptable',
    playstyleBalancedDesc: 'Even placement distribution across all tiers, capable of handling diverse game states.',
    playstyleHighRoller: 'High Roller (Fast 8 / High Roll)',
    playstyleHighRollerDesc: 'Heavy concentration in 1st or 8th. High risk, high reward playstyle playing for 1st.',
    playstyleStabilizer: 'Safe Stabilizer (Mid-game Control)',
    playstyleStabilizerDesc: 'Majority of finishes in 2nd–4th. Safe, disciplined climb prioritising LP conservation.',
    playstyleChampion: 'Apex Champion (Win Dominator)',
    playstyleChampionDesc: 'Outstanding 1st place rate, excels at snowballing tempo into victory.',
    playstyleFast8th: 'Tilt Alert (Unstable Finishes)',
    playstyleFast8thDesc: 'High 8th place rate; needs safer mid-game transitions and earlier stabilization.',
    playstyleConsistent: 'Consistent Climber (Steady Grind)',
    playstyleConsistentDesc: 'Over 58% Top 4 rate, rock-solid consistency and reliable LP accumulation.',

    // Recent Form & Streaks
    streakWin: '👑 {n} Game Win Streak',
    streakTop4: '🔥 {n} Game Top 4 Streak',
    streakBot4: '🧊 {n} Game Cold Streak',
    formLast10: 'Last 10 Games Form',
    formHot: 'On Fire (Avg {avg})',
    formCold: 'Cold Streak (Avg {avg})',
    formSteady: 'Steady (Avg {avg})',

    // Mastery (Champions & Items)
    masteryHeading: 'Carry Mastery & Core Items',
    masteryChamps: 'Top Played Champions',
    masteryItems: 'Favorite Items',
    mastery3Star: '{n} times 3⭐',
    masteryGames: '{n} games',
    masteryTopItems: 'Frequent Items',

    // Meta Tier List
    metaTierHeading: 'Meta Tier List · {season}',
    metaTierDesc: 'Top meta compositions ranked by MetaTFT server statistics combined with your performance.',
    metaColComp: 'Composition',
    metaColTier: 'Tier',
    metaColAvg: 'Meta Avg',
    metaColMetaCount: 'Pick Rate',
    metaColYourStats: 'Your Performance',
    metaYouPlayed: '{games} games · Avg {avg}',
    metaNotPlayed: 'Not played yet',
    metaBetter: '(+{diff} better than meta)',
    metaWorse: '({diff} vs meta)',

    // Compare 1v1
    compareBtn: '⚔️ Compare 1v1',
    compareModalTitle: 'Head-to-Head Compare 1v1',
    compareInputPlaceholder: 'Opponent Riot ID (Name#Tag)...',
    compareSubmit: 'Compare',
    compareVs: 'VS',
    comparePlayer1: 'Player 1',
    comparePlayer2: 'Player 2',
    compareRank: 'Rank',
    compareWinRate: 'Top 1 Rate',
    compareTop4Rate: 'Top 4 Rate',
    compareAvgPlace: 'Average Place',
    compareNetLp: 'Net LP',
    compareFavoriteComp: 'Favorite Comp',

    // Compare page
    cmpPageTitle: '{a} vs {b} · Compare 1v1 | k-tft',
    cmpPageDesc: 'Rank, Top 4, Top 1, LP, comps and favorite champions of {a} and {b} side by side ({season}).',
    cmpBrandSub: 'compare 1v1',
    cmpLoading: 'Loading {season}for {a} and {b}…',
    cmpMissingPlayers: 'This compare link is missing a player. Open a player page and press "Compare 1v1".',
    cmpNotFound: 'MetaTFT has no data for {name}#{tag} yet. Open that player page, press "Refresh" and try again.',
    cmpSwap: '⇄ Swap sides',
    cmpScore: 'Ahead in {n}/{total} stats',
    cmpGamesShown: '{n} games · {queue}',
    cmpStatsHeading: 'Head-to-head stats',
    cmpStatsHint: 'The green cell is the better side for that stat.',
    cmpPeak: 'Peak rank',
    cmpServerRank: 'Server rank',
    cmpSeasonGames: 'Ranked games this season',
    cmpEighthRate: '8th place rate',
    cmpLast10: 'Avg place, last 10 games',
    cmpAvgLevel: 'Final level (avg)',
    cmpAvgRound: 'Survived until (avg)',
    cmpPlaystyle: 'Playstyle',
    cmpPlacementHint: '% of games at each placement.',
    cmpLpHint: 'LP after each ranked game, per player.',
    cmpCommonComps: 'Comps both have played',
    cmpCommonHint: 'Same comp, who plays it better. {mode}',
    cmpNoCommon: 'These players have no comp in common yet.',
    cmpTopComps: 'Most played comps',

    // Share Card
    shareBtn: '📸 Share Card',
    shareModalTitle: 'Player Card Showcase',
    shareModalDesc: 'Auto-generated eSports-grade profile banner ready to share on Discord, Facebook or with friends.',
    shareDownload: 'Download PNG',
    shareCopy: 'Copy Image',
    shareCopied: 'Image copied to clipboard!',
    shareClose: 'Close',

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
