// LocalStorageベースのストレージAPIモック実装
class StorageAPI {
  constructor() {
    this.prefix = 'homescreen_';
  }

  async get(key) {
    try {
      const value = localStorage.getItem(this.prefix + key);
      return value ? { value } : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  async set(key, value) {
    try {
      localStorage.setItem(this.prefix + key, value);
      return { success: true };
    } catch (error) {
      console.error('Storage set error:', error);
      throw error;
    }
  }

  async delete(key) {
    try {
      localStorage.removeItem(this.prefix + key);
      return { success: true };
    } catch (error) {
      console.error('Storage delete error:', error);
      throw error;
    }
  }

  async list(prefix = '') {
    try {
      const keys = [];
      const fullPrefix = this.prefix + prefix;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(fullPrefix)) {
          keys.push(key.replace(this.prefix, ''));
        }
      }

      return { keys };
    } catch (error) {
      console.error('Storage list error:', error);
      return { keys: [] };
    }
  }

  // ストレージをクリア（デバッグ用）
  async clear() {
    try {
      const keys = [];
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      }
      return { success: true };
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  }
}

// グローバルに公開
export const initStorage = () => {
  if (!window.storage) {
    window.storage = new StorageAPI();
  }
};

export default StorageAPI;
