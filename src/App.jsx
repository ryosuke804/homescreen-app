import React, { useState, useEffect } from 'react';
import { Camera, Home, User, LogOut, Eye, EyeOff, Trash2, Upload, Heart, MessageCircle, Bookmark, Bell } from 'lucide-react';

// 通知タイプ
const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment'
};

// 通知を作成・保存する関数
const createNotification = async (type, fromUserId, toUserId, screenId, commentText = null) => {
  if (fromUserId === toUserId) return; // 自分自身への通知は作成しない

  const notification = {
    id: `notif_${Date.now()}_${Math.random()}`,
    type,
    fromUserId,
    toUserId,
    screenId,
    commentText,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  try {
    // 通知を保存
    await window.storage.set(
      `notification:${toUserId}:${notification.id}`,
      JSON.stringify(notification)
    );
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// モックデータストレージ（実際のFirebaseの代わり）
const mockStorage = {
  users: {},
  homeScreens: {},
  currentUser: null
};

// ユーザー認証モック
const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // セッションストレージから復元
    const loadUser = async () => {
      try {
        const saved = await window.storage.get('current-user');
        if (saved?.value) {
          const userData = JSON.parse(saved.value);
          mockStorage.currentUser = userData;
          setCurrentUser(userData);
        }
      } catch (error) {
        console.log('No saved user');
      }
      setIsLoading(false);
    };
    loadUser();
  }, []);

  const signIn = async (email, provider) => {
    const userId = `user_${Date.now()}`;
    const user = {
      id: userId,
      email,
      provider,
      createdAt: new Date().toISOString()
    };
    mockStorage.currentUser = user;
    setCurrentUser(user);
    await window.storage.set('current-user', JSON.stringify(user));
    return user;
  };

  const signOut = async () => {
    mockStorage.currentUser = null;
    setCurrentUser(null);
    await window.storage.delete('current-user');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-gray-600">読み込み中...</div>
    </div>;
  }

  return children({ currentUser, signIn, signOut });
};

// 年齢計算ユーティリティ
const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const formatAge = (birthDate, setting) => {
  if (setting === 'HIDE') return null;
  const age = calculateAge(birthDate);
  if (setting === 'DECADE') {
    const decade = Math.floor(age / 10) * 10;
    return `${decade}代`;
  }
  return `${age}歳`;
};

// 画像圧縮ヘルパー関数（全コンポーネントで使用）
const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 縦横比を保ちながらリサイズ
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Canvasで圧縮
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // 圧縮してBase64に変換
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);

        // サイズをログ出力
        const originalSize = (file.size / 1024 / 1024).toFixed(2);
        const compressedSize = (compressedBase64.length * 0.75 / 1024 / 1024).toFixed(2);
        console.log(`画像圧縮: ${originalSize}MB → ${compressedSize}MB (${width}x${height})`);

        resolve(compressedBase64);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// ログイン画面
const LoginScreen = ({ onSignIn }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'verify'
  const [error, setError] = useState('');

  const handleSendCode = () => {
    // 電話番号の簡易バリデーション
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setError('正しい電話番号を入力してください');
      return;
    }
    
    setError('');
    // 実際はFirebase Authで認証コードを送信
    console.log('Sending verification code to:', cleanPhone);
    setStep('verify');
  };

  const handleVerifyCode = () => {
    if (verificationCode.length !== 6) {
      setError('6桁の認証コードを入力してください');
      return;
    }

    // 実際はFirebase Authで認証コードを検証
    console.log('Verifying code:', verificationCode);
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    onSignIn(cleanPhone, 'phone');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Camera className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">HomeScreen</h1>
          <p className="text-gray-600">ホーム画面は作品。見せる・発散する場所</p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                電話番号
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="090-1234-5678"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              onClick={handleSendCode}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition"
            >
              認証コードを送信
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                認証コード
              </label>
              <p className="text-sm text-gray-600 mb-2">
                {phoneNumber} に送信された6桁のコードを入力してください
              </p>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-2xl tracking-widest"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              onClick={handleVerifyCode}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition"
            >
              ログイン
            </button>

            <button
              onClick={() => setStep('phone')}
              className="w-full text-gray-600 py-2 text-sm hover:text-gray-800"
            >
              ← 電話番号を変更
            </button>
          </div>
        )}
        
        <p className="text-xs text-gray-500 text-center mt-6">
          サインインすることで、利用規約とプライバシーポリシーに同意したものとみなされます
        </p>
      </div>
    </div>
  );
};

// 初回生年月日入力
const BirthDateSetup = ({ onComplete }) => {
  const [birthDate, setBirthDate] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('初めまして、よろしくお願いします！');
  const [profileImage, setProfileImage] = useState('');
  const [error, setError] = useState('');

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }

    try {
      // 画像を圧縮してbase64に変換
      const compressed = await compressImage(file, 800, 800, 0.85);
      setProfileImage(compressed);
      setError('');
    } catch (error) {
      console.error('画像の圧縮に失敗しました:', error);
      setError('画像の処理に失敗しました');
    }
  };

  const handleSubmit = () => {
    if (!birthDate) {
      setError('生年月日は必須です');
      return;
    }

    if (!displayName || displayName.trim() === '') {
      setError('表示名は必須です');
      return;
    }

    const birth = new Date(birthDate);
    const today = new Date();
    if (birth > today) {
      setError('無効な日付です');
      return;
    }

    // 年齢計算
    const age = calculateAge(birthDate);
    if (age >= 120) {
      setError('120歳以上の年齢は登録できません。正しい生年月日を入力してください。');
      return;
    }

    console.log('Submitting profile:', { birthDate, displayName, bio, profileImage });
    onComplete({ birthDate, displayName: displayName.trim(), bio, profileImage });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">プロフィール設定</h2>
        <p className="text-gray-600 mb-6">最初に基本情報を入力してください</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              生年月日 <span className="text-red-500">*必須</span>
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              ※生年月日そのものは公開されません。年齢表示の設定は後で変更できます
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              表示名 <span className="text-red-500">*必須</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="例：太郎"
              maxLength={20}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              自己紹介（任意）
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="簡単な自己紹介を書いてください"
              maxLength={100}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プロフィール画像（任意）
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  displayName ? displayName[0].toUpperCase() : '?'
                )}
              </div>
              <label className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition cursor-pointer text-center">
                画像を選択
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition"
          >
            はじめる
          </button>
        </div>
      </div>
    </div>
  );
};

// 通知画面
const NotificationsScreen = ({ currentUserId, onNavigateToProfile, onBack }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState({});

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const notifsResult = await window.storage.list(`notification:${currentUserId}:`);
      
      if (!notifsResult?.keys) {
        setNotifications([]);
        setIsLoading(false);
        return;
      }

      const notifData = [];
      const userIds = new Set();

      for (const key of notifsResult.keys) {
        try {
          const result = await window.storage.get(key);
          if (result?.value) {
            const notif = JSON.parse(result.value);
            notifData.push(notif);
            userIds.add(notif.fromUserId);
          }
        } catch (error) {
          console.error('Error loading notification:', error);
        }
      }

      // ユーザー情報を取得
      const usersData = {};
      for (const userId of userIds) {
        try {
          const userResult = await window.storage.get(`user:${userId}`);
          if (userResult?.value) {
            usersData[userId] = JSON.parse(userResult.value);
          }
        } catch (error) {
          console.error('Error loading user:', error);
        }
      }

      setUsers(usersData);
      notifData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(notifData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
    setIsLoading(false);
  };

  const markAsRead = async (notifId) => {
    const notif = notifications.find(n => n.id === notifId);
    if (!notif || notif.isRead) return;

    const updatedNotif = { ...notif, isRead: true };
    
    try {
      await window.storage.set(
        `notification:${currentUserId}:${notifId}`,
        JSON.stringify(updatedNotif)
      );
      
      setNotifications(notifications.map(n => 
        n.id === notifId ? updatedNotif : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const updates = notifications
        .filter(n => !n.isRead)
        .map(n => ({
          ...n,
          isRead: true
        }));

      for (const notif of updates) {
        await window.storage.set(
          `notification:${currentUserId}:${notif.id}`,
          JSON.stringify(notif)
        );
      }

      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationText = (notif) => {
    const user = users[notif.fromUserId];
    const userName = user?.displayName || '誰か';

    if (notif.type === NOTIFICATION_TYPES.LIKE) {
      return `${userName}さんがあなたの投稿にいいねしました`;
    } else if (notif.type === NOTIFICATION_TYPES.COMMENT) {
      return `${userName}さんがコメントしました：${notif.commentText}`;
    }
    return '';
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
            ← 戻る
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              すべて既読にする
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">通知</h1>

        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">通知はありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => {
                  markAsRead(notif.id);
                  onNavigateToProfile(notif.fromUserId);
                }}
                className={`w-full text-left p-4 rounded-xl transition ${
                  notif.isRead 
                    ? 'bg-white hover:bg-gray-50' 
                    : 'bg-purple-50 hover:bg-purple-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {(users[notif.fromUserId]?.displayName || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${notif.isRead ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                      {getNotificationText(notif)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notif.createdAt).toLocaleString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ボトムナビゲーション */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-around">
          <button
            onClick={onBack}
            className="flex flex-col items-center text-gray-500"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">ホーム</span>
          </button>
          <button
            onClick={() => onNavigateToProfile(currentUserId)}
            className="flex flex-col items-center text-gray-500"
          >
            <User className="w-5 h-5" />
            <span className="text-xs">プロフィール</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// フィード画面
const FeedScreen = ({ currentUserId, onNavigateToProfile, onUpload }) => {
  const [feed, setFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComments, setShowComments] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const usersResult = await window.storage.list('user:');
      if (!usersResult?.keys) {
        setFeed([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const feedItems = [];
      
      for (const userKey of usersResult.keys) {
        try {
          const userResult = await window.storage.get(userKey);
          if (!userResult?.value) continue;
          
          const user = JSON.parse(userResult.value);
          
          const screenKey = `screen:${user.id}:current`;
          const screenResult = await window.storage.get(screenKey);
          
          if (screenResult?.value) {
            const screen = JSON.parse(screenResult.value);
            if (screen.visibility === 'PUBLIC') {
              feedItems.push({
                ...screen,
                user: {
                  id: user.id,
                  displayName: user.displayName || '名無し',
                  ageDisplay: formatAge(user.birthDate, user.agePublicSetting || 'AGE'),
                  profileImage: user.profileImage
                }
              });
            }
          }
        } catch (error) {
          console.error('Error loading user:', error);
        }
      }

      feedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setFeed(feedItems);
    } catch (error) {
      console.error('Error loading feed:', error);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  };

  const handleRefresh = () => {
    loadFeed(true);
  };

  // プルトゥリフレッシュのイベントハンドラ
  const handleTouchStart = (e) => {
    if (window.scrollY === 0 && !isRefreshing) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;

    // 下に引っ張っている場合のみ
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance, 100)); // 最大100px
      // デフォルトのスクロール動作を防ぐ
      if (distance > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling) return;

    setIsPulling(false);

    // 60px以上引っ張ったらリフレッシュ
    if (pullDistance > 60 && !isRefreshing) {
      handleRefresh();
    }

    setPullDistance(0);
  };

  const handleLike = async (screenId, userId) => {
    const itemIndex = feed.findIndex(item => item.id === screenId);
    if (itemIndex === -1) return;

    const item = feed[itemIndex];
    const likes = item.likes || [];
    const hasLiked = likes.includes(currentUserId);

    const updatedLikes = hasLiked 
      ? likes.filter(id => id !== currentUserId)
      : [...likes, currentUserId];

    const updatedScreen = { ...item, likes: updatedLikes };

    try {
      await window.storage.set(`screen:${userId}:current`, JSON.stringify(updatedScreen));
      await window.storage.set(`screen:${userId}:${screenId}`, JSON.stringify(updatedScreen));
      
      // いいねした場合は通知を作成
      if (!hasLiked) {
        await createNotification(NOTIFICATION_TYPES.LIKE, currentUserId, userId, screenId);
      }
      
      const updatedItem = { ...updatedScreen, user: item.user };
      const newFeed = [...feed];
      newFeed[itemIndex] = updatedItem;
      setFeed(newFeed);
      // 詳細モーダルも更新
      if (selectedItem && selectedItem.id === screenId) {
        setSelectedItem(updatedItem);
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleSave = async (screenId, userId) => {
    const itemIndex = feed.findIndex(item => item.id === screenId);
    if (itemIndex === -1) return;

    const item = feed[itemIndex];
    const saves = item.saves || [];
    const hasSaved = saves.includes(currentUserId);

    const updatedSaves = hasSaved
      ? saves.filter(id => id !== currentUserId)
      : [...saves, currentUserId];

    const updatedScreen = { ...item, saves: updatedSaves };

    try {
      await window.storage.set(`screen:${userId}:current`, JSON.stringify(updatedScreen));
      await window.storage.set(`screen:${userId}:${screenId}`, JSON.stringify(updatedScreen));

      const updatedItem = { ...updatedScreen, user: item.user };
      const newFeed = [...feed];
      newFeed[itemIndex] = updatedItem;
      setFeed(newFeed);
      // 詳細モーダルも更新
      if (selectedItem && selectedItem.id === screenId) {
        setSelectedItem(updatedItem);
      }
    } catch (error) {
      console.error('Error updating save:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div
      className="max-w-2xl mx-auto pb-24 relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* プルトゥリフレッシュインジケーター */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 overflow-hidden"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 0 ? 1 : 0
        }}
      >
        <div className="flex flex-col items-center">
          <div
            className="text-2xl transition-transform"
            style={{
              transform: pullDistance > 60 ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          >
            ↓
          </div>
          {pullDistance > 60 && (
            <span className="text-sm text-purple-600 font-medium mt-1">
              離して更新
            </span>
          )}
          {isRefreshing && (
            <span className="text-sm text-purple-600 font-medium mt-1">
              更新中...
            </span>
          )}
        </div>
      </div>

      <div style={{ paddingTop: isRefreshing ? '60px' : '0px', transition: 'padding-top 0.3s' }}>
        {feed.length === 0 ? (
        <div className="text-center py-16 px-4">
          <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">まだ投稿がありません</p>
          <p className="text-sm text-gray-400">最初のホーム画面を投稿してみましょう</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-3">
          {feed.map((item) => (
            <FeedCard
              key={item.id}
              item={item}
              currentUserId={currentUserId}
              onNavigateToProfile={onNavigateToProfile}
              onLike={handleLike}
              onTap={() => setSelectedItem(item)}
            />
          ))}
        </div>
      )}
      </div>

      {/* 詳細モーダル */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto" onClick={() => setSelectedItem(null)}>
          {/* 右上の✕ボタン */}
          <button
            onClick={() => setSelectedItem(null)}
            className="fixed top-4 right-4 z-[60] bg-black bg-opacity-50 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-opacity-70 transition"
          >
            ✕
          </button>
          <div className="flex items-center justify-center min-h-full p-4">
            <div className="max-w-lg w-full my-8" onClick={(e) => e.stopPropagation()}>
              <FeedItem
                item={selectedItem}
                currentUserId={currentUserId}
                onNavigateToProfile={(userId) => { setSelectedItem(null); onNavigateToProfile(userId); }}
                onLike={(screenId, userId) => { handleLike(screenId, userId); }}
                onSave={(screenId, userId) => { handleSave(screenId, userId); }}
                showComments={showComments === selectedItem.id}
                onToggleComments={() => setShowComments(showComments === selectedItem.id ? null : selectedItem.id)}
              />
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onUpload}
        className="fixed bottom-20 right-6 bg-purple-600 text-white w-14 h-14 rounded-full shadow-lg hover:bg-purple-700 transition flex items-center justify-center z-10"
      >
        <Upload className="w-5 h-5" />
      </button>
    </div>
  );
};

// フィードカードコンポーネント（グリッド表示用）
const FeedCard = ({ item, currentUserId, onNavigateToProfile, onLike, onTap }) => {
  const hasLiked = (item.likes || []).includes(currentUserId);
  const images = item.images || (item.imageUrl ? [item.imageUrl] : []);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden" onClick={onTap}>
      {/* 画像 */}
      <div className="relative aspect-[9/16] bg-gray-100 overflow-hidden">
        <img
          src={images[0]}
          alt="Home screen"
          className="w-full h-full object-cover"
        />
        {images.length > 1 && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded">
            +{images.length - 1}
          </div>
        )}
      </div>

      {/* ユーザー情報 & いいね */}
      <div className="p-2">
        <div className="flex items-center gap-1.5 mb-1">
          <button
            onClick={(e) => { e.stopPropagation(); onNavigateToProfile(item.userId); }}
            className="flex items-center gap-1.5 min-w-0 flex-1"
          >
            <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
              {item.user.profileImage ? (
                <img src={item.user.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                item.user.displayName[0].toUpperCase()
              )}
            </div>
            <span className="text-xs font-medium text-gray-900 truncate">{item.user.displayName}</span>
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <button
            onClick={(e) => { e.stopPropagation(); onLike(item.id, item.userId); }}
            className="flex items-center gap-0.5"
          >
            <span className={hasLiked ? 'text-red-500' : ''}>{hasLiked ? '❤️' : '🤍'}</span>
            <span>{(item.likes || []).length}</span>
          </button>
          <span className="flex items-center gap-0.5">
            💬 {(item.comments || []).length}
          </span>
        </div>
      </div>
    </div>
  );
};

// フィードアイテムコンポーネント（詳細表示・複数画像対応）
const FeedItem = ({ item, currentUserId, onNavigateToProfile, onLike, onSave, showComments, onToggleComments }) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(item.comments || []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const hasLiked = (item.likes || []).includes(currentUserId);
  const hasSaved = (item.saves || []).includes(currentUserId);

  // 複数画像対応：imagesがあればそれを使用、なければimageUrlを配列に変換
  const images = item.images || (item.imageUrl ? [item.imageUrl] : []);
  const hasMultipleImages = images.length > 1;

  const handleAddComment = async () => {
    const trimmedComment = commentText.trim();
    
    if (!trimmedComment) return;
    
    if (trimmedComment.length > 200) {
      alert('コメントは200文字以内で入力してください');
      return;
    }

    // URLを含む場合は警告
    if (/(https?:\/\/|www\.)/i.test(trimmedComment)) {
      const shouldPost = confirm('URLが含まれています。投稿しますか？\n\n※セキュリティ上の理由から、リンクはクリックできません。');
      if (!shouldPost) return;
    }

    const newComment = {
      id: `comment_${Date.now()}`,
      userId: currentUserId,
      text: trimmedComment,
      createdAt: new Date().toISOString()
    };

    const updatedComments = [...comments, newComment];
    const updatedScreen = { ...item, comments: updatedComments };

    try {
      await window.storage.set(`screen:${item.userId}:current`, JSON.stringify(updatedScreen));
      await window.storage.set(`screen:${item.userId}:${item.id}`, JSON.stringify(updatedScreen));
      
      // 通知を作成
      await createNotification(NOTIFICATION_TYPES.COMMENT, currentUserId, item.userId, item.id, trimmedComment);
      
      setComments(updatedComments);
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('コメントの投稿に失敗しました');
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="p-4 flex items-center gap-3">
        <button
          onClick={() => onNavigateToProfile(item.userId)}
          className="flex items-center gap-3 hover:opacity-80 transition flex-1"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
            {item.user.profileImage ? (
              <img src={item.user.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              item.user.displayName[0].toUpperCase()
            )}
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-900">{item.user.displayName}</div>
            {item.user.ageDisplay && (
              <div className="text-sm text-gray-500">{item.user.ageDisplay}</div>
            )}
          </div>
        </button>
      </div>
      
      {/* 画像表示エリア（複数画像対応） */}
      <div className="relative bg-gray-100 p-4 flex justify-center">
        {/* スマホ風の枠 */}
        <div className="relative bg-black rounded-[2.5rem] p-3 shadow-2xl" style={{ maxWidth: '400px' }}>
          {/* ノッチ（画面上部の切り欠き） */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>
          {/* 画面部分 */}
          <div className="relative bg-gray-900 rounded-[2rem] overflow-hidden">
            <img
              src={images[currentImageIndex]}
              alt={`Home screen ${currentImageIndex + 1}`}
              className="w-full object-contain bg-gray-100 cursor-pointer hover:opacity-95 transition"
              style={{ maxHeight: '600px' }}
              onClick={() => window.open(images[currentImageIndex], '_blank')}
              title="クリックで拡大表示"
            />
          </div>
          {/* 複数画像の場合のナビゲーション */}
          {hasMultipleImages && (
            <>
              {/* 左右の矢印ボタン */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white w-10 h-10 rounded-full hover:bg-opacity-70 transition flex items-center justify-center z-20"
                title="前の画像"
              >
                ←
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white w-10 h-10 rounded-full hover:bg-opacity-70 transition flex items-center justify-center z-20"
                title="次の画像"
              >
                →
              </button>

              {/* インジケーター（ドット） */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition ${
                      index === currentImageIndex
                        ? 'bg-white w-6'
                        : 'bg-white bg-opacity-50'
                    }`}
                    title={`画像 ${index + 1}`}
                  />
                ))}
              </div>

              {/* 画像カウンター */}
              <div className="absolute top-8 right-4 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-20">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLike(item.id, item.userId)}
            className="flex items-center gap-2 hover:opacity-70 transition"
          >
            <div className={hasLiked ? 'text-red-500' : 'text-gray-600'}>
              {hasLiked ? '❤️' : '🤍'}
            </div>
            <span className="text-sm text-gray-600">{(item.likes || []).length}</span>
          </button>

          <button
            onClick={onToggleComments}
            className="flex items-center gap-2 hover:opacity-70 transition text-gray-600"
          >
            💬
            <span className="text-sm">{comments.length}</span>
          </button>

          <button
            onClick={() => onSave(item.id, item.userId)}
            className="flex items-center gap-2 hover:opacity-70 transition ml-auto"
          >
            <div className={hasSaved ? 'text-purple-600' : 'text-gray-600'}>
              {hasSaved ? '🔖' : '📑'}
            </div>
          </button>
        </div>

        {showComments && (
          <div className="border-t pt-3 space-y-3">
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="text-sm">
                  <span className="font-medium text-gray-900">User {comment.userId.slice(-4)}: </span>
                  <span className="text-gray-700">{comment.text}</span>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="コメントを追加..."
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                {commentText.length > 0 && (
                  <span className={`absolute right-2 top-2 text-xs ${commentText.length > 180 ? 'text-red-500' : 'text-gray-400'}`}>
                    {commentText.length}/200
                  </span>
                )}
              </div>
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                投稿
              </button>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500">
          {new Date(item.createdAt).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>
    </div>
  );
};
// プロフィール画像ギャラリーコンポーネント（複数画像対応）
const ProfileImageGallery = ({ screen }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = screen.images || (screen.imageUrl ? [screen.imageUrl] : []);
  const hasMultiple = images.length > 1;

  return (
    <div className="relative bg-gray-100 p-4 flex justify-center">
      {/* スマホ風の枠 */}
      <div className="relative bg-black rounded-[2.5rem] p-3 shadow-2xl" style={{ maxWidth: '400px' }}>
        {/* ノッチ（画面上部の切り欠き） */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>
        {/* 画面部分 */}
        <div className="relative bg-gray-900 rounded-[2rem] overflow-hidden">
          <img
            src={images[currentIndex] || images[0]}
            alt={`Home screen from ${new Date(screen.createdAt).toLocaleDateString()}`}
            className="w-full object-contain bg-gray-100"
            style={{ maxHeight: '600px' }}
          />
        </div>
        {hasMultiple && (
          <>
            <button
              onClick={() => setCurrentIndex((currentIndex - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white w-8 h-8 rounded-full hover:bg-opacity-70 transition flex items-center justify-center z-20"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentIndex((currentIndex + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white w-8 h-8 rounded-full hover:bg-opacity-70 transition flex items-center justify-center z-20"
            >
              →
            </button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition ${i === currentIndex ? 'bg-white w-6' : 'bg-white bg-opacity-50'}`}
                />
              ))}
            </div>
            <div className="absolute top-8 right-4 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-20">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// プロフィール画面
const ProfileScreen = ({ userId, currentUserId, onBack, onRefresh, onSignOut, onNavigateToNotifications, unreadCount }) => {
  const [user, setUser] = useState(null);
  const [screens, setScreens] = useState([]);
  const [savedScreens, setSavedScreens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'saved'
  const [selectedScreen, setSelectedScreen] = useState(null);

  const isOwnProfile = userId === currentUserId;

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const userResult = await window.storage.get(`user:${userId}`);
      if (userResult?.value) {
        setUser(JSON.parse(userResult.value));
      }

      // 全バージョンを取得
      const screensResult = await window.storage.list(`screen:${userId}:`);
      if (screensResult?.keys) {
        const screenData = [];
        for (const key of screensResult.keys) {
          if (key.endsWith(':current')) continue; // currentは別で取得
          try {
            const result = await window.storage.get(key);
            if (result?.value) {
              const screen = JSON.parse(result.value);
              // 自分のプロフィールか、公開されているもののみ表示
              if (isOwnProfile || screen.visibility === 'PUBLIC') {
                screenData.push(screen);
              }
            }
          } catch (error) {
            console.error('Error loading screen:', error);
          }
        }
        
        // Currentを先頭に
        screenData.sort((a, b) => {
          if (a.isCurrent) return -1;
          if (b.isCurrent) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        setScreens(screenData);
      }

      // 保存済み投稿を取得（自分のプロフィールの場合のみ）
      if (isOwnProfile) {
        const allUsersResult = await window.storage.list('user:');
        const savedScreenData = [];

        if (allUsersResult?.keys) {
          for (const userKey of allUsersResult.keys) {
            try {
              const screenListResult = await window.storage.list(userKey.replace('user:', 'screen:'));

              for (const screenKey of screenListResult.keys || []) {
                if (screenKey.endsWith(':current')) continue;

                const screenResult = await window.storage.get(screenKey);
                if (screenResult?.value) {
                  const screen = JSON.parse(screenResult.value);
                  // 自分が保存した投稿のみ
                  if (screen.saves && screen.saves.includes(currentUserId)) {
                    // ユーザー情報も取得
                    const screenUserResult = await window.storage.get(`user:${screen.userId}`);
                    if (screenUserResult?.value) {
                      const screenUser = JSON.parse(screenUserResult.value);
                      savedScreenData.push({
                        ...screen,
                        user: {
                          id: screenUser.id,
                          displayName: screenUser.displayName || '名無し',
                          profileImage: screenUser.profileImage
                        }
                      });
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error loading saved screens:', error);
            }
          }
        }

        // 保存日時順にソート（新しい順）
        savedScreenData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setSavedScreens(savedScreenData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
    setIsLoading(false);
  };

  const handleToggleVisibility = async (screenId, currentVisibility) => {
    const newVisibility = currentVisibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
    const screenIndex = screens.findIndex(s => s.id === screenId);
    if (screenIndex === -1) return;

    const updatedScreen = { ...screens[screenIndex], visibility: newVisibility };
    
    try {
      await window.storage.set(
        `screen:${userId}:${screenId}`,
        JSON.stringify(updatedScreen)
      );
      
      // Currentの場合は別途更新
      if (updatedScreen.isCurrent) {
        await window.storage.set(
          `screen:${userId}:current`,
          JSON.stringify(updatedScreen)
        );
      }
      
      const newScreens = [...screens];
      newScreens[screenIndex] = updatedScreen;
      setScreens(newScreens);
      
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error updating visibility:', error);
    }
  };

  const handleDelete = async (screenId, isCurrent) => {
    if (!confirm('本当に削除しますか？')) return;

    try {
      await window.storage.delete(`screen:${userId}:${screenId}`);
      if (isCurrent) {
        await window.storage.delete(`screen:${userId}:current`);
      }
      
      setScreens(screens.filter(s => s.id !== screenId));
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting screen:', error);
    }
  };

  const handleUpdateProfile = async (updates) => {
    const updatedUser = { ...user, ...updates };
    try {
      await window.storage.set(`user:${userId}`, JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">ユーザーが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-end">
          {onNavigateToNotifications && (
            <button
              onClick={onNavigateToNotifications}
              className="relative text-gray-600 hover:text-gray-900"
              title="通知"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* プロフィールヘッダー */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <button
            onClick={() => isOwnProfile && setIsEditing(!isEditing)}
            className={`flex items-start gap-4 mb-4 w-full text-left ${isOwnProfile ? 'hover:bg-gray-50 -m-2 p-2 rounded-xl transition' : ''}`}
            disabled={!isOwnProfile}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden">
              {user.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                (user.displayName || '?')[0].toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <ProfileEditor user={user} onSave={handleUpdateProfile} onCancel={() => setIsEditing(false)} onSignOut={onSignOut} />
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {user.displayName || '名無し'}
                    </h2>
                    {isOwnProfile && (
                      <span className="text-sm text-gray-400">✏️</span>
                    )}
                  </div>
                  {formatAge(user.birthDate, user.agePublicSetting || 'AGE') && (
                    <p className="text-gray-600 mb-2">
                      {formatAge(user.birthDate, user.agePublicSetting || 'AGE')}
                    </p>
                  )}
                  {user.bio && (
                    <p className="text-gray-700 text-sm break-words">{user.bio}</p>
                  )}
                  {isOwnProfile && (
                    <p className="text-xs text-gray-400 mt-2">タップして編集</p>
                  )}
                </>
              )}
            </div>
          </button>
        </div>

        {/* タブ */}
        {isOwnProfile && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                activeTab === 'posts'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              投稿 ({screens.length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                activeTab === 'saved'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              保存済み ({savedScreens.length})
            </button>
          </div>
        )}

        {/* ギャラリー */}
        {activeTab === 'posts' ? (
          screens.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl">
              <p className="text-gray-500">まだホーム画面がありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {screens.map((screen) => {
                const images = screen.images || (screen.imageUrl ? [screen.imageUrl] : []);
                return (
                  <div key={screen.id} className="bg-white rounded-xl shadow-sm overflow-hidden relative cursor-pointer" onClick={() => setSelectedScreen(screen)}>
                    {/* サムネイル */}
                    <div className="relative aspect-[9/16] bg-gray-100 overflow-hidden">
                      <img
                        src={images[0]}
                        alt="Home screen"
                        className="w-full h-full object-cover"
                      />
                      {images.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded">
                          +{images.length - 1}
                        </div>
                      )}
                      {screen.isCurrent && (
                        <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                          最新
                        </div>
                      )}
                      {screen.visibility === 'PRIVATE' && (
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> 非公開
                        </div>
                      )}
                    </div>
                    {/* 情報 */}
                    <div className="p-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(screen.createdAt).toLocaleDateString('ja-JP')}
                      </span>
                      {isOwnProfile && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleVisibility(screen.id, screen.visibility); }}
                            className="p-1 hover:bg-gray-100 rounded transition"
                          >
                            {screen.visibility === 'PUBLIC' ? (
                              <Eye className="w-4 h-4 text-purple-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(screen.id, screen.isCurrent); }}
                            className="p-1 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          savedScreens.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl">
              <p className="text-gray-500">保存した投稿がありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {savedScreens.map((screen) => {
                const images = screen.images || (screen.imageUrl ? [screen.imageUrl] : []);
                return (
                  <div key={screen.id} className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer" onClick={() => setSelectedScreen(screen)}>
                    <div className="relative aspect-[9/16] bg-gray-100 overflow-hidden">
                      <img
                        src={images[0]}
                        alt="Home screen"
                        className="w-full h-full object-cover"
                      />
                      {images.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded">
                          +{images.length - 1}
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                          {screen.user?.profileImage ? (
                            <img src={screen.user.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (screen.user?.displayName || '?')[0].toUpperCase()
                          )}
                        </div>
                        <span className="text-xs text-gray-900 truncate">{screen.user?.displayName || '名無し'}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(screen.createdAt).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* 投稿拡大モーダル */}
      {selectedScreen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto" onClick={() => setSelectedScreen(null)}>
          <button
            onClick={() => setSelectedScreen(null)}
            className="fixed top-4 right-4 z-[60] bg-black bg-opacity-50 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-opacity-70 transition"
          >
            ✕
          </button>
          <div className="flex items-center justify-center min-h-full p-4">
            <div className="max-w-lg w-full my-8" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <ProfileImageGallery screen={selectedScreen} />
                <div className="p-3 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {new Date(selectedScreen.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>❤️ {(selectedScreen.likes || []).length}</span>
                    <span>💬 {(selectedScreen.comments || []).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ボトムナビゲーション */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-around">
          <button
            onClick={onBack}
            className="flex flex-col items-center text-gray-500"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">ホーム</span>
          </button>
          <button
            className="flex flex-col items-center text-purple-600"
          >
            <User className="w-5 h-5" />
            <span className="text-xs">プロフィール</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// プロフィール編集コンポーネント
const ProfileEditor = ({ user, onSave, onCancel, onSignOut }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [agePublicSetting, setAgePublicSetting] = useState(user.agePublicSetting || 'AGE');
  const [profileImage, setProfileImage] = useState(user.profileImage || '');

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    try {
      // 画像を圧縮してbase64に変換
      const compressed = await compressImage(file, 800, 800, 0.85);
      setProfileImage(compressed);
    } catch (error) {
      console.error('画像の圧縮に失敗しました:', error);
      alert('画像の処理に失敗しました');
    }
  };

  const handleSubmit = () => {
    if (!displayName.trim()) {
      alert('表示名は必須です');
      return;
    }
    onSave({ displayName: displayName.trim(), bio, agePublicSetting, profileImage });
  };

  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">表示名 <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={20}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">自己紹介</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={100}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">年齢表示</label>
        <select
          value={agePublicSetting}
          onChange={(e) => setAgePublicSetting(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="AGE">年齢を表示（例：29歳）</option>
          <option value="DECADE">年代を表示（例：20代）</option>
          <option value="HIDE">非表示</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">プロフィール画像</label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              displayName ? displayName[0].toUpperCase() : '?'
            )}
          </div>
          <label className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition cursor-pointer text-center">
            画像を変更
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            キャンセル
          </button>
        )}
        <button
          onClick={handleSubmit}
          className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition"
        >
          保存
        </button>
      </div>

      {/* ログアウトボタン */}
      {onSignOut && (
        <div className="pt-4 border-t">
          <button
            onClick={() => {
              if (confirm('ログアウトしますか？')) {
                onSignOut();
              }
            }}
            className="w-full bg-red-50 text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-100 transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
};

// 画像アップロード画面（複数枚対応）
const UploadScreen = ({ userId, onComplete, onCancel }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    // 最大5枚まで
    const totalFiles = selectedFiles.length + files.length;
    if (totalFiles > 5) {
      alert('⚠️ 一度に投稿できる画像は最大5枚までです');
      return;
    }

    // 画像ファイルのみチェック
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length !== files.length) {
      alert('⚠️ 画像ファイルのみ選択してください');
      return;
    }

    const newFiles = [...selectedFiles, ...imageFiles];
    setSelectedFiles(newFiles);

    // プレビューを生成（圧縮処理を適用）
    try {
      const previewPromises = imageFiles.map(file => compressImage(file));
      const newPreviews = await Promise.all(previewPromises);
      const allPreviews = [...previews, ...newPreviews];
      setPreviews(allPreviews);
    } catch (error) {
      console.error('画像の圧縮に失敗しました:', error);
      alert('⚠️ 画像の処理に失敗しました。別の画像を試してください。');
    }
  };

  const removeImage = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || previews.length === 0) return;

    // 確認チェックボックスのチェック
    if (!isConfirmed) {
      alert('⚠️ ホーム画面のスクリーンショットであることを確認してください');
      return;
    }

    setIsUploading(true);

    try {
      // 現在のCurrentを取得して履歴に移動
      try {
        const currentResult = await window.storage.get(`screen:${userId}:current`);
        if (currentResult?.value) {
          const currentScreen = JSON.parse(currentResult.value);
          const archivedScreen = { ...currentScreen, isCurrent: false };
          await window.storage.set(
            `screen:${userId}:${currentScreen.id}`,
            JSON.stringify(archivedScreen)
          );
        }
      } catch (error) {
        console.log('No current screen found, this is the first post');
      }

      // 新しいスクリーンを作成（複数画像）
      const newScreen = {
        id: `screen_${Date.now()}`,
        userId,
        images: previews, // 複数画像の配列
        createdAt: new Date().toISOString(),
        visibility: 'PUBLIC',
        isCurrent: true,
        likes: [],
        saves: [],
        comments: []
      };

      await window.storage.set(
        `screen:${userId}:current`,
        JSON.stringify(newScreen)
      );

      await window.storage.set(
        `screen:${userId}:${newScreen.id}`,
        JSON.stringify(newScreen)
      );

      alert('✨ 投稿しました！\n\nフィードで確認できます。');
      onComplete();
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ アップロードに失敗しました\n\nもう一度お試しください。');
    } finally {
      setIsUploading(false);
    }
  };

  const canUpload = selectedFiles.length > 0 && isConfirmed && !isUploading;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">ホーム画面を更新</h2>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-900 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
            title="閉じる"
          >
            ✕
          </button>
        </div>

        {previews.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">画像を選択してください（最大5枚）</p>
            <label className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition cursor-pointer">
              画像を選択
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-4">
              ※スマートフォンのホーム画面のスクリーンショットを選択してください
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-1">
              {previews.map((preview, index) => (
                <div key={index} className="relative">
                  <div className="bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-300">
                    <div className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-auto object-contain"
                        style={{ maxHeight: '300px' }}
                      />
                      <button
                        onClick={() => removeImage(index)}
                        disabled={isUploading}
                        className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full hover:bg-red-600 transition flex items-center justify-center shadow-lg disabled:opacity-50"
                        title="削除"
                      >
                        ×
                      </button>
                    </div>
                    <div className="p-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">画像 {index + 1}</span>
                        <span className="text-xs text-gray-500">{index + 1}/{previews.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 確認チェックボックス */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    これらはスマートフォンのホーム画面のスクリーンショットです
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    ※ホーム画面以外の投稿は運営により削除される場合があります
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              {selectedFiles.length < 5 && (
                <label className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition text-center cursor-pointer disabled:opacity-50">
                  + 画像を追加
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading || selectedFiles.length >= 5}
                  />
                </label>
              )}

              <button
                onClick={onCancel}
                disabled={isUploading}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleUpload}
                disabled={!canUpload}
                className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50"
              >
                {isUploading ? '投稿中...' : `投稿する（${selectedFiles.length}枚）`}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              投稿後も削除・非公開にできます
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// メインアプリ
const App = () => {
  return (
    <AuthProvider>
      {({ currentUser, signIn, signOut }) => (
        <MainApp currentUser={currentUser} signIn={signIn} signOut={signOut} />
      )}
    </AuthProvider>
  );
};

const MainApp = ({ currentUser, signIn, signOut }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('feed');
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (currentUser) {
      loadUserProfile();
      loadUnreadCount();
      
      // 30秒ごとに未読数を更新
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const loadUserProfile = async () => {
    try {
      const result = await window.storage.get(`user:${currentUser.id}`);
      if (result?.value) {
        setUserProfile(JSON.parse(result.value));
      }
    } catch (error) {
      console.log('No user profile found');
    }
  };

  const loadUnreadCount = async () => {
    try {
      const notifsResult = await window.storage.list(`notification:${currentUser.id}:`);
      
      if (!notifsResult?.keys) {
        setUnreadCount(0);
        return;
      }

      let count = 0;
      for (const key of notifsResult.keys) {
        try {
          const result = await window.storage.get(key);
          if (result?.value) {
            const notif = JSON.parse(result.value);
            if (!notif.isRead) count++;
          }
        } catch (error) {
          console.error('Error loading notification:', error);
        }
      }
      
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleCompleteSetup = async (profileData) => {
    console.log('handleCompleteSetup called with:', profileData);
    const newProfile = {
      id: currentUser.id,
      ...profileData,
      agePublicSetting: 'AGE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Saving profile:', newProfile);

    try {
      const result = await window.storage.set(`user:${currentUser.id}`, JSON.stringify(newProfile));
      console.log('Storage result:', result);
      setUserProfile(newProfile);
      console.log('Profile set successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('プロフィールの保存に失敗しました: ' + error.message);
    }
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    setRefreshKey(prev => prev + 1);
  };

  if (!currentUser) {
    return <LoginScreen onSignIn={signIn} />;
  }

  if (!userProfile) {
    return <BirthDateSetup onComplete={handleCompleteSetup} />;
  }

  if (showUpload) {
    return (
      <UploadScreen
        userId={currentUser.id}
        onComplete={handleUploadComplete}
        onCancel={() => setShowUpload(false)}
      />
    );
  }

  if (currentScreen === 'notifications') {
    return (
      <NotificationsScreen
        currentUserId={currentUser.id}
        onNavigateToProfile={(userId) => {
          setSelectedProfileId(userId);
          setCurrentScreen('profile');
        }}
        onBack={() => {
          setCurrentScreen('feed');
          loadUnreadCount();
        }}
      />
    );
  }

  if (currentScreen === 'profile' && selectedProfileId) {
    return (
      <ProfileScreen
        userId={selectedProfileId}
        currentUserId={currentUser.id}
        onBack={() => {
          setCurrentScreen('feed');
          setSelectedProfileId(null);
        }}
        onRefresh={() => setRefreshKey(prev => prev + 1)}
        onSignOut={signOut}
        onNavigateToNotifications={() => {
          setCurrentScreen('notifications');
          setRefreshKey(prev => prev + 1);
        }}
        unreadCount={unreadCount}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* トップバー */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-6 h-6 text-purple-600" />
            <h1 className="text-xl font-bold text-gray-900">HomeScreen</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCurrentScreen('notifications');
                setRefreshKey(prev => prev + 1);
              }}
              className="relative text-gray-600 hover:text-gray-900"
              title="通知"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <FeedScreen
        key={refreshKey}
        currentUserId={currentUser.id}
        onNavigateToProfile={(userId) => {
          setSelectedProfileId(userId);
          setCurrentScreen('profile');
        }}
        onUpload={() => setShowUpload(true)}
      />

      {/* ボトムナビゲーション */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-around">
          <button
            onClick={() => setCurrentScreen('feed')}
            className={`flex flex-col items-center ${
              currentScreen === 'feed' ? 'text-purple-600' : 'text-gray-500'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">ホーム</span>
          </button>
          <button
            onClick={() => {
              setSelectedProfileId(currentUser.id);
              setCurrentScreen('profile');
            }}
            className={`flex flex-col items-center ${
              currentScreen === 'profile' && selectedProfileId === currentUser.id
                ? 'text-purple-600'
                : 'text-gray-500'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs">プロフィール</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
