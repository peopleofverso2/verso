export interface ApiKeys {
  youtube?: string;
  openai?: string;
  meta?: string;
  luma?: string;
}

export interface AppSettings {
  apiKeys: ApiKeys;
  theme?: 'light' | 'dark';
  language?: string;
  // Ajoutez d'autres paramètres si nécessaire
}

export interface SettingsUpdate {
  key: string;
  value: any;
  category: 'apiKeys' | 'general';
}
