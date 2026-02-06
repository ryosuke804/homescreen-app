// Firestore Storage ラッパー
// 既存のwindow.storage APIと互換性を保ちながらFirestoreを使用
import { db } from './firebase.js';
import {
  doc, getDoc, setDoc, deleteDoc,
  collection, getDocs, query, where, orderBy
} from 'firebase/firestore';

// キーを解析してコレクション名とドキュメントIDに変換
const parseKey = (key) => {
  // user:{userId} → collection: users, docId: {userId}
  if (key.startsWith('user:')) {
    return { collection: 'users', docId: key.replace('user:', '') };
  }
  // screen:{userId}:current → collection: screens, docId: {userId}_current
  // screen:{userId}:{screenId} → collection: screens, docId: {userId}_{screenId}
  if (key.startsWith('screen:')) {
    const parts = key.split(':');
    const userId = parts[1];
    const screenPart = parts[2] || 'unknown';
    return { collection: 'screens', docId: `${userId}_${screenPart}` };
  }
  // notification:{toUserId}:{notifId} → collection: notifications, docId: {toUserId}_{notifId}
  if (key.startsWith('notification:')) {
    const parts = key.split(':');
    return { collection: 'notifications', docId: `${parts[1]}_${parts[2]}` };
  }
  // action:{userId}:{actionId} → collection: actions, docId: {userId}_{actionId}
  if (key.startsWith('action:')) {
    const parts = key.split(':');
    return { collection: 'actions', docId: `${parts[1]}_${parts[2]}` };
  }
  // current-user → collection: sessions, docId: current-user
  return { collection: 'sessions', docId: key };
};

// プレフィックスからコレクション名とフィルターを取得
const parsePrefixForList = (prefix) => {
  // user: → collection: users
  if (prefix === 'user:' || prefix.startsWith('user:')) {
    return { collection: 'users', prefix: prefix.replace('user:', '') };
  }
  // screen:{userId}: → collection: screens, filter by userId prefix
  if (prefix.startsWith('screen:')) {
    const parts = prefix.split(':');
    return { collection: 'screens', prefix: parts[1] || '' };
  }
  // notification:{toUserId}: → collection: notifications, filter by toUserId prefix
  if (prefix.startsWith('notification:')) {
    const parts = prefix.split(':');
    return { collection: 'notifications', prefix: parts[1] || '' };
  }
  // action:{userId}: → collection: actions, filter by userId prefix
  if (prefix.startsWith('action:')) {
    const parts = prefix.split(':');
    return { collection: 'actions', prefix: parts[1] || '' };
  }
  return { collection: 'misc', prefix: '' };
};

// Firestoreベースのストレージクラス
class FirestoreStorage {
  // データを取得
  async get(key) {
    try {
      const { collection: col, docId } = parseKey(key);
      const docRef = doc(db, col, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { value: docSnap.data().value };
      }
      return null;
    } catch (error) {
      console.error('Firestore get エラー:', key, error);
      return null;
    }
  }

  // データを保存
  async set(key, value) {
    try {
      const { collection: col, docId } = parseKey(key);
      const docRef = doc(db, col, docId);

      // 元のキーも保存（list操作用）
      await setDoc(docRef, {
        value: value,
        originalKey: key,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Firestore set エラー:', key, error);
    }
  }

  // データを削除
  async delete(key) {
    try {
      const { collection: col, docId } = parseKey(key);
      const docRef = doc(db, col, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Firestore delete エラー:', key, error);
    }
  }

  // プレフィックスに一致するキーのリストを取得
  async list(prefix) {
    try {
      const { collection: col, prefix: filterPrefix } = parsePrefixForList(prefix);
      const colRef = collection(db, col);
      const querySnapshot = await getDocs(colRef);

      const keys = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.originalKey && data.originalKey.startsWith(prefix)) {
          keys.push(data.originalKey);
        }
      });

      return { keys };
    } catch (error) {
      console.error('Firestore list エラー:', prefix, error);
      return { keys: [] };
    }
  }

  // 全データを削除（使用注意）
  async clear() {
    console.warn('Firestore clear は実装されていません（安全のため）');
  }
}

// Firestoreストレージを初期化してwindow.storageに設定
export const initFirestoreStorage = () => {
  window.storage = new FirestoreStorage();
  console.log('Firestore Storage 初期化完了');
};
