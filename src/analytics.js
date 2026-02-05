// ユーザーアクションログシステム

/**
 * アクションの種類
 */
export const ACTION_TYPES = {
  // 認証関連
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'signup',

  // 投稿関連
  POST_CREATE: 'post_create',
  POST_VIEW: 'post_view',
  POST_DELETE: 'post_delete',

  // いいね・保存
  LIKE_ADD: 'like_add',
  LIKE_REMOVE: 'like_remove',
  SAVE_ADD: 'save_add',
  SAVE_REMOVE: 'save_remove',

  // コメント
  COMMENT_ADD: 'comment_add',
  COMMENT_VIEW: 'comment_view',

  // プロフィール
  PROFILE_VIEW: 'profile_view',
  PROFILE_EDIT: 'profile_edit',

  // ナビゲーション
  SCREEN_CHANGE: 'screen_change',
  NOTIFICATION_VIEW: 'notification_view',
  NOTIFICATION_CLICK: 'notification_click',

  // 検索・フィルター（将来の機能）
  SEARCH: 'search',
  FILTER_APPLY: 'filter_apply',
};

/**
 * アクションをログに記録
 * @param {string} userId - ユーザーID
 * @param {string} actionType - アクション種類
 * @param {Object} metadata - 追加情報
 */
export const logAction = async (userId, actionType, metadata = {}) => {
  const action = {
    id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    actionType,
    metadata,
    timestamp: new Date().toISOString(),
    // デバイス情報
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  };

  try {
    // ストレージに保存
    await window.storage.set(
      `action:${userId}:${action.id}`,
      JSON.stringify(action)
    );

    // コンソールに出力（開発時のみ）
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Action logged:', action);
    }

    return action;
  } catch (error) {
    console.error('Error logging action:', error);
  }
};

/**
 * ユーザーのアクションログを取得
 * @param {string} userId - ユーザーID
 * @param {Object} options - フィルター・ソートオプション
 */
export const getUserActions = async (userId, options = {}) => {
  const {
    actionType = null,
    startDate = null,
    endDate = null,
    limit = 100,
  } = options;

  try {
    const result = await window.storage.list(`action:${userId}:`);
    if (!result?.keys) return [];

    const actions = [];
    for (const key of result.keys) {
      const actionResult = await window.storage.get(key);
      if (actionResult?.value) {
        const action = JSON.parse(actionResult.value);

        // フィルター適用
        if (actionType && action.actionType !== actionType) continue;
        if (startDate && new Date(action.timestamp) < new Date(startDate))
          continue;
        if (endDate && new Date(action.timestamp) > new Date(endDate)) continue;

        actions.push(action);
      }
    }

    // タイムスタンプでソート（新しい順）
    actions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 件数制限
    return actions.slice(0, limit);
  } catch (error) {
    console.error('Error getting user actions:', error);
    return [];
  }
};

/**
 * アクション統計を取得
 * @param {string} userId - ユーザーID
 */
export const getActionStats = async (userId) => {
  try {
    const actions = await getUserActions(userId, { limit: 10000 });

    const stats = {
      total: actions.length,
      byType: {},
      byDay: {},
      mostActiveHour: null,
      mostActiveDay: null,
    };

    // アクションタイプ別の集計
    actions.forEach((action) => {
      // タイプ別
      if (!stats.byType[action.actionType]) {
        stats.byType[action.actionType] = 0;
      }
      stats.byType[action.actionType]++;

      // 日別
      const date = new Date(action.timestamp).toISOString().split('T')[0];
      if (!stats.byDay[date]) {
        stats.byDay[date] = 0;
      }
      stats.byDay[date]++;
    });

    // 最もアクティブな時間帯を計算
    const hourCounts = {};
    actions.forEach((action) => {
      const hour = new Date(action.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const hourKeys = Object.keys(hourCounts);
    stats.mostActiveHour = hourKeys.length > 0
      ? hourKeys.reduce((a, b) => (hourCounts[a] > hourCounts[b] ? a : b))
      : null;

    // 最もアクティブな曜日を計算
    const dayCounts = {};
    actions.forEach((action) => {
      const day = new Date(action.timestamp).getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const dayKeys = Object.keys(dayCounts);
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    if (dayKeys.length > 0) {
      const mostActiveDay = dayKeys.reduce((a, b) =>
        dayCounts[a] > dayCounts[b] ? a : b
      );
      stats.mostActiveDay = dayNames[mostActiveDay];
    } else {
      stats.mostActiveDay = null;
    }

    return stats;
  } catch (error) {
    console.error('Error getting action stats:', error);
    return null;
  }
};

/**
 * 全ユーザーのアクション統計を取得（管理者用）
 */
export const getAllUsersStats = async () => {
  try {
    const result = await window.storage.list('user:');
    if (!result?.keys) return [];

    const allStats = [];
    for (const key of result.keys) {
      const userId = key.replace('user:', '');
      const stats = await getActionStats(userId);
      if (stats) {
        const userResult = await window.storage.get(key);
        const user = userResult?.value ? JSON.parse(userResult.value) : {};
        allStats.push({
          userId,
          displayName: user.displayName || '名無し',
          ...stats,
        });
      }
    }

    return allStats;
  } catch (error) {
    console.error('Error getting all users stats:', error);
    return [];
  }
};

/**
 * エクスポート用：CSVフォーマットでアクションログをエクスポート
 * @param {string} userId - ユーザーID
 */
export const exportActionsToCSV = async (userId) => {
  const actions = await getUserActions(userId, { limit: 10000 });

  const headers = ['ID', 'ユーザーID', 'アクション', 'タイムスタンプ', 'メタデータ'];
  const rows = actions.map((action) => [
    action.id,
    action.userId,
    action.actionType,
    action.timestamp,
    JSON.stringify(action.metadata),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  // ダウンロード
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `actions_${userId}_${Date.now()}.csv`;
  link.click();
};
