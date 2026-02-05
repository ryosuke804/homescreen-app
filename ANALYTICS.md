# ユーザーアクションデータの活用ガイド

## 📊 概要

ユーザーの行動を追跡・分析するためのシステムです。

## 🚀 使い方

### 1. アクションの記録

```javascript
import { logAction, ACTION_TYPES } from './analytics.js';

// ログイン時
await logAction(userId, ACTION_TYPES.LOGIN);

// 投稿作成時
await logAction(userId, ACTION_TYPES.POST_CREATE, {
  postId: newPost.id,
  imageCount: images.length,
});

// いいね追加時
await logAction(userId, ACTION_TYPES.LIKE_ADD, {
  postId: post.id,
  postOwnerId: post.userId,
});

// プロフィール閲覧時
await logAction(userId, ACTION_TYPES.PROFILE_VIEW, {
  viewedUserId: targetUserId,
  isOwnProfile: userId === targetUserId,
});
```

### 2. 統計データの取得

```javascript
import { getActionStats, getUserActions } from './analytics.js';

// ユーザーの統計を取得
const stats = await getActionStats(userId);
console.log('総アクション数:', stats.total);
console.log('いいね数:', stats.byType.like_add);
console.log('最もアクティブな時間:', stats.mostActiveHour);
console.log('最もアクティブな曜日:', stats.mostActiveDay);

// 特定のアクションのみ取得
const likes = await getUserActions(userId, {
  actionType: ACTION_TYPES.LIKE_ADD,
  limit: 50,
});
```

### 3. データのエクスポート

```javascript
import { exportActionsToCSV } from './analytics.js';

// CSVファイルとしてダウンロード
await exportActionsToCSV(userId);
```

## 📈 実装例

### App.jsxへの組み込み

```javascript
import { logAction, ACTION_TYPES } from './analytics.js';

// ログイン時
const signIn = async (email, provider) => {
  const user = await authService.signIn(email, provider);
  await logAction(user.id, ACTION_TYPES.LOGIN);
  return user;
};

// 投稿作成時
const handleUpload = async () => {
  const newPost = await createPost(images);
  await logAction(currentUser.id, ACTION_TYPES.POST_CREATE, {
    postId: newPost.id,
    imageCount: images.length,
  });
};

// いいね追加時
const handleLike = async (postId, postOwnerId) => {
  await likePost(postId);
  await logAction(currentUser.id, ACTION_TYPES.LIKE_ADD, {
    postId,
    postOwnerId,
  });
};

// 画面遷移時
const setCurrentScreen = async (screen) => {
  await logAction(currentUser.id, ACTION_TYPES.SCREEN_CHANGE, {
    from: currentScreen,
    to: screen,
  });
  _setCurrentScreen(screen);
};
```

## 📊 分析できるデータ

### ユーザーエンゲージメント
- アクティブユーザー数（日次・週次・月次）
- 平均セッション時間
- 画面遷移パターン

### 投稿分析
- 投稿数（日次・週次・月次）
- 投稿あたりの平均いいね数
- 投稿あたりの平均コメント数
- 人気の投稿時間帯

### ユーザー行動
- いいね数（あげた・もらった）
- コメント数（書いた・もらった）
- 保存数
- プロフィール閲覧数

### リテンション
- DAU（Daily Active Users）
- WAU（Weekly Active Users）
- MAU（Monthly Active Users）
- リテンションレート

## 🎯 活用例

### 1. ユーザーダッシュボード

```javascript
const Dashboard = ({ userId }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      const data = await getActionStats(userId);
      setStats(data);
    };
    loadStats();
  }, [userId]);

  return (
    <div>
      <h2>あなたの統計</h2>
      <p>総アクション数: {stats?.total}</p>
      <p>投稿数: {stats?.byType.post_create || 0}</p>
      <p>いいね数: {stats?.byType.like_add || 0}</p>
      <p>最もアクティブな時間: {stats?.mostActiveHour}時</p>
    </div>
  );
};
```

### 2. 管理者ダッシュボード

```javascript
import { getAllUsersStats } from './analytics.js';

const AdminDashboard = () => {
  const [allStats, setAllStats] = useState([]);

  useEffect(() => {
    const loadStats = async () => {
      const data = await getAllUsersStats();
      setAllStats(data);
    };
    loadStats();
  }, []);

  return (
    <div>
      <h2>全ユーザー統計</h2>
      <table>
        <thead>
          <tr>
            <th>ユーザー</th>
            <th>総アクション数</th>
            <th>投稿数</th>
            <th>いいね数</th>
          </tr>
        </thead>
        <tbody>
          {allStats.map((stat) => (
            <tr key={stat.userId}>
              <td>{stat.displayName}</td>
              <td>{stat.total}</td>
              <td>{stat.byType.post_create || 0}</td>
              <td>{stat.byType.like_add || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### 3. リアルタイム通知

```javascript
// 特定のアクションが発生したときに通知
const watchActions = async (userId, callback) => {
  // 定期的にチェック
  setInterval(async () => {
    const recentActions = await getUserActions(userId, {
      limit: 10,
    });

    // 新しいアクションがあればコールバック実行
    recentActions.forEach((action) => {
      if (isNew(action)) {
        callback(action);
      }
    });
  }, 5000); // 5秒ごと
};
```

## 🔒 プライバシー

- ユーザーの個人情報は記録しません
- アクションデータはユーザーごとに分離されています
- ユーザーは自分のデータをいつでもエクスポート・削除できます

## 📝 記録されるデータ

- ユーザーID
- アクションタイプ
- タイムスタンプ
- メタデータ（投稿ID、対象ユーザーIDなど）
- デバイス情報（画面サイズ、ユーザーエージェント）

## 🚫 記録されないデータ

- パスワード
- 個人を特定できる情報
- 画像の内容
- コメントの内容（IDのみ）
