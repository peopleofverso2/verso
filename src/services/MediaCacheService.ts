import { MediaFile } from '../types/media';

interface CachedMedia {
  media: MediaFile;
  timestamp: number;
  url: string;
}

export class MediaCacheService {
  private static instance: MediaCacheService;
  private cache: Map<string, CachedMedia>;
  private readonly CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): MediaCacheService {
    if (!MediaCacheService.instance) {
      MediaCacheService.instance = new MediaCacheService();
    }
    return MediaCacheService.instance;
  }

  getMedia(id: string): MediaFile | null {
    const cached = this.cache.get(id);
    if (!cached) return null;

    // Vérifier si le cache est expiré
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(id);
      if (cached.url) {
        URL.revokeObjectURL(cached.url);
      }
      return null;
    }

    return cached.media;
  }

  setMedia(id: string, media: MediaFile, url?: string): void {
    // Si le média existe déjà, révoquer l'ancien URL
    const existing = this.cache.get(id);
    if (existing?.url) {
      URL.revokeObjectURL(existing.url);
    }

    this.cache.set(id, {
      media,
      timestamp: Date.now(),
      url: url || ''
    });
  }

  clearExpiredCache(): void {
    const now = Date.now();
    for (const [id, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_DURATION) {
        if (cached.url) {
          URL.revokeObjectURL(cached.url);
        }
        this.cache.delete(id);
      }
    }
  }

  clearCache(): void {
    for (const cached of this.cache.values()) {
      if (cached.url) {
        URL.revokeObjectURL(cached.url);
      }
    }
    this.cache.clear();
  }

  // Mettre à jour le timestamp pour un média
  touchMedia(id: string): void {
    const cached = this.cache.get(id);
    if (cached) {
      cached.timestamp = Date.now();
      this.cache.set(id, cached);
    }
  }
}
