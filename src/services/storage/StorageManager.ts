import { MediaMetadata, MediaFile } from '../../types/media';
import { LocalStorageAdapter } from './LocalStorageAdapter';

export interface StorageStats {
  totalSize: number;
  mediaCount: number;
  unusedMediaCount: number;
  lastCleanup: Date | null;
}

export interface ExportData {
  version: string;
  exportDate: string;
  media: {
    metadata: MediaMetadata;
    blob: Blob;
  }[];
}

export class StorageManager {
  private static instance: StorageManager;
  private adapter: LocalStorageAdapter;
  private readonly MAX_STORAGE_SIZE = 500 * 1024 * 1024; // 500 MB
  private readonly CLEANUP_THRESHOLD = 0.9; // 90% du stockage maximum
  private lastCleanupDate: Date | null = null;

  private constructor() {
    this.adapter = LocalStorageAdapter.getInstance();
  }

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  public async getStorageStats(): Promise<StorageStats> {
    const media = await this.adapter.listMedia();
    const unusedMedia = await this.findUnusedMedia();
    
    const totalSize = media.reduce((sum, item) => sum + (item.metadata.size || 0), 0);

    return {
      totalSize,
      mediaCount: media.length,
      unusedMediaCount: unusedMedia.length,
      lastCleanup: this.lastCleanupDate
    };
  }

  public async cleanupUnusedMedia(): Promise<void> {
    console.log('Starting media cleanup...');
    const unusedMedia = await this.findUnusedMedia();
    
    for (const media of unusedMedia) {
      try {
        await this.adapter.deleteMedia(media.metadata.id);
        console.log(`Deleted unused media: ${media.metadata.id}`);
      } catch (error) {
        console.error(`Error deleting media ${media.metadata.id}:`, error);
      }
    }

    this.lastCleanupDate = new Date();
    console.log('Media cleanup completed');
  }

  public async exportMedia(mediaIds?: string[]): Promise<ExportData> {
    const mediaList = mediaIds 
      ? await Promise.all(mediaIds.map(id => this.adapter.getMedia(id)))
      : await this.adapter.listMedia();

    const exportData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      media: []
    };

    for (const media of mediaList) {
      try {
        const response = await fetch(media.url);
        const blob = await response.blob();
        exportData.media.push({
          metadata: media.metadata,
          blob
        });
      } catch (error) {
        console.error(`Error exporting media ${media.metadata.id}:`, error);
      }
    }

    return exportData;
  }

  public async importMedia(exportData: ExportData): Promise<{
    success: number;
    failed: number;
    errors: { id: string; error: string }[];
  }> {
    const result = {
      success: 0,
      failed: 0,
      errors: [] as { id: string; error: string }[]
    };

    const currentStats = await this.getStorageStats();
    const importSize = exportData.media.reduce((sum, item) => sum + item.blob.size, 0);

    if (currentStats.totalSize + importSize > this.MAX_STORAGE_SIZE) {
      throw new Error('Import would exceed maximum storage size');
    }

    for (const item of exportData.media) {
      try {
        const file = new File([item.blob], item.metadata.name, {
          type: item.metadata.mimeType
        });

        await this.adapter.saveMedia(file, {
          ...item.metadata,
          importedAt: new Date().toISOString()
        });

        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          id: item.metadata.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return result;
  }

  private async findUnusedMedia(): Promise<MediaFile[]> {
    const allMedia = await this.adapter.listMedia();
    const unusedMedia: MediaFile[] = [];

    for (const media of allMedia) {
      const isUsed = await this.isMediaUsed(media.metadata.id);
      if (!isUsed) {
        unusedMedia.push(media);
      }
    }

    return unusedMedia;
  }

  private async isMediaUsed(mediaId: string): Promise<boolean> {
    // Vérifier dans le MoodBoard
    const moodBoardMedia = await this.adapter.listMedia({ type: 'moodboard' });
    if (moodBoardMedia.some(m => m.metadata.id === mediaId)) {
      return true;
    }

    // Vérifier dans le Storyboard
    const storyboardMedia = await this.adapter.listMedia({ type: 'storyboard' });
    if (storyboardMedia.some(m => m.metadata.id === mediaId)) {
      return true;
    }

    // Vérifier la date (garder les médias récents)
    const media = await this.adapter.getMedia(mediaId);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const mediaDate = new Date(media.metadata.createdAt);
    if (mediaDate > thirtyDaysAgo) {
      return true;
    }

    return false;
  }

  public async checkStorageHealth(): Promise<void> {
    const stats = await this.getStorageStats();
    
    if (stats.totalSize > this.MAX_STORAGE_SIZE * this.CLEANUP_THRESHOLD) {
      console.log('Storage threshold exceeded, initiating cleanup...');
      await this.cleanupUnusedMedia();
    }
  }
}
