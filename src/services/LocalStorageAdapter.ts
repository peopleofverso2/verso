export class LocalStorageAdapter {
  private static instance: LocalStorageAdapter;

  private constructor() {
    console.log('LocalStorageAdapter: Initializing...');
    // Vérifier que localStorage est disponible
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('LocalStorage is not available');
    }
    console.log('LocalStorageAdapter: Initialized successfully');
  }

  public static getInstance(): LocalStorageAdapter {
    if (!LocalStorageAdapter.instance) {
      LocalStorageAdapter.instance = new LocalStorageAdapter();
    }
    return LocalStorageAdapter.instance;
  }

  public async set(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in localStorage:', error);
      throw error;
    }
  }

  public async get(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from localStorage:', error);
      throw error;
    }
  }

  public async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from localStorage:', error);
      throw error;
    }
  }

  public async keys(): Promise<string[]> {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== null) {
          keys.push(key);
        }
      }
      console.log('LocalStorageAdapter: Retrieved keys:', keys);
      return keys;
    } catch (error) {
      console.error('Error getting keys from localStorage:', error);
      throw error;
    }
  }

  public async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      throw error;
    }
  }
}
