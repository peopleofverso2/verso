import { openDB, IDBPDatabase } from 'idb';

export interface APIConfig {
  youtube?: {
    enabled: boolean;
    apiKey?: string;
  };
  openai?: {
    enabled: boolean;
    apiKey?: string;
    model: string;
  };
  meta?: {
    enabled: boolean;
    apiKey?: string;
  };
}

export interface AppConfig {
  apis: APIConfig;
  storage: {
    type: 'local' | 'remote';
    settings?: {
      endpoint?: string;
      region?: string;
    };
  };
}

const DB_NAME = 'verso_config';
const STORE_NAME = 'config';
const DB_VERSION = 1;

class ConfigService {
  private static instance: ConfigService;
  private db: IDBPDatabase | null = null;

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private async getDB(): Promise<IDBPDatabase> {
    if (!this.db) {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        },
      });
    }
    return this.db;
  }

  async saveConfig(config: Partial<AppConfig>): Promise<void> {
    try {
      const db = await this.getDB();
      const currentConfig = await this.getConfig();
      const newConfig = {
        ...currentConfig,
        ...config,
        apis: {
          ...currentConfig?.apis,
          ...config.apis,
        },
        storage: {
          ...currentConfig?.storage,
          ...config.storage,
        },
      };
      await db.put(STORE_NAME, newConfig, 'app_config');
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  }

  async getConfig(): Promise<AppConfig> {
    try {
      const db = await this.getDB();
      const config = await db.get(STORE_NAME, 'app_config');
      return config || this.getDefaultConfig();
    } catch (error) {
      console.error('Error getting config:', error);
      return this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): AppConfig {
    return {
      apis: {
        youtube: {
          enabled: false,
        },
        openai: {
          enabled: false,
          model: 'gpt-4',
        },
        meta: {
          enabled: false,
        },
      },
      storage: {
        type: 'local',
      },
    };
  }

  async testAPIKey(service: keyof APIConfig, apiKey: string): Promise<boolean> {
    try {
      switch (service) {
        case 'youtube':
          return await this.testYouTubeAPI(apiKey);
        case 'openai':
          return await this.testOpenAIAPI(apiKey);
        case 'meta':
          return await this.testMetaAPI(apiKey);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error testing ${service} API key:`, error);
      return false;
    }
  }

  private async testYouTubeAPI(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=1&key=${apiKey}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private async testOpenAIAPI(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async testMetaAPI(apiKey: string): Promise<boolean> {
    // Implement Meta API test when needed
    return true;
  }
}

export const configService = ConfigService.getInstance();
