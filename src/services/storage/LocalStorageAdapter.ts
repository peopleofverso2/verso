import { MediaStorageAdapter, MediaFile, MediaMetadata, MediaFilter } from '../../types/media';
import { openDB, IDBPDatabase, deleteDB } from 'idb';

export class LocalStorageAdapter implements MediaStorageAdapter {
  private readonly STORAGE_KEY = 'media_library';
  private static instance: LocalStorageAdapter;
  private dbPromise: Promise<IDBPDatabase> | null = null;
  private static readonly DB_NAME = 'AmenMediaLibrary';
  private static readonly DB_VERSION = 4; 
  private static readonly MEDIA_STORE = 'media';
  private static readonly METADATA_STORE = 'metadata';
  private static readonly THUMBNAIL_STORE = 'thumbnails';

  private urlCache: Map<string, string> = new Map();
  private thumbnailUrlCache: Map<string, string> = new Map();

  private constructor() {
    if (LocalStorageAdapter.instance) {
      return LocalStorageAdapter.instance;
    }
    LocalStorageAdapter.instance = this;
  }

  public async initialize(): Promise<void> {
    try {
      console.log('LocalStorageAdapter: Initializing...');
      await this.getDb();
      console.log('LocalStorageAdapter: Initialized successfully');
    } catch (error) {
      console.error('LocalStorageAdapter: Initialization failed:', error);
      throw error;
    }
  }

  private async getDb(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(LocalStorageAdapter.DB_NAME, LocalStorageAdapter.DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(LocalStorageAdapter.MEDIA_STORE)) {
            db.createObjectStore(LocalStorageAdapter.MEDIA_STORE);
          }
          if (!db.objectStoreNames.contains(LocalStorageAdapter.METADATA_STORE)) {
            db.createObjectStore(LocalStorageAdapter.METADATA_STORE);
          }
          if (!db.objectStoreNames.contains(LocalStorageAdapter.THUMBNAIL_STORE)) {
            db.createObjectStore(LocalStorageAdapter.THUMBNAIL_STORE);
          }
        },
      });
    }
    return this.dbPromise;
  }

  private async resetDatabase() {
    try {
      this.clearUrlCaches();

      if (this.dbPromise) {
        const db = await this.dbPromise;
        db.close();
        this.dbPromise = null;
      }

      await deleteDB(LocalStorageAdapter.DB_NAME);
      
      return this.getDb();
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  }

  private clearUrlCaches() {
    console.log('LocalStorageAdapter: Clearing URL caches...');
    console.log('LocalStorageAdapter: Current cache size:', {
      mediaUrls: this.urlCache.size,
      thumbnailUrls: this.thumbnailUrlCache.size
    });

    this.urlCache.forEach((url, id) => {
      console.log('LocalStorageAdapter: Revoking URL for media:', id);
      URL.revokeObjectURL(url);
    });
    this.thumbnailUrlCache.forEach((url, id) => {
      console.log('LocalStorageAdapter: Revoking thumbnail URL for media:', id);
      URL.revokeObjectURL(url);
    });
    
    this.urlCache.clear();
    this.thumbnailUrlCache.clear();
    
    console.log('LocalStorageAdapter: URL caches cleared');
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateThumbnail(file: File): Promise<Blob | null> {
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          canvas.width = 320;
          canvas.height = (video.videoHeight / video.videoWidth) * canvas.width;
          video.currentTime = 1;
        };
        
        video.onseeked = () => {
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              URL.revokeObjectURL(video.src);
              resolve(blob);
            }, 'image/jpeg', 0.7);
          } else {
            URL.revokeObjectURL(video.src);
            resolve(null);
          }
        };
        
        video.onerror = () => {
          URL.revokeObjectURL(video.src);
          resolve(null);
        };
        
        video.src = URL.createObjectURL(file);
      });
    }
    return null;
  }

  async saveMedia(file: File, partialMetadata: Partial<MediaMetadata>): Promise<MediaFile> {
    console.log('Starting saveMedia...', { fileName: file.name, fileType: file.type, size: file.size });
    
    try {
      const id = partialMetadata.id || this.generateId();
      console.log('Generated/Using ID:', id);
      
      // Nettoyer les anciennes URLs
      if (this.urlCache.has(id)) {
        console.log('Cleaning up old URL for ID:', id);
        URL.revokeObjectURL(this.urlCache.get(id)!);
        this.urlCache.delete(id);
      }
      if (this.thumbnailUrlCache.has(id)) {
        console.log('Cleaning up old thumbnail URL for ID:', id);
        URL.revokeObjectURL(this.thumbnailUrlCache.get(id)!);
        this.thumbnailUrlCache.delete(id);
      }

      // Vérifier la validité du fichier
      if (!file.size) {
        throw new Error('File is empty');
      }

      if (!(file instanceof File)) {
        throw new Error('Invalid file object');
      }

      const metadata: MediaMetadata = {
        id,
        type: file.type.startsWith('video/') ? 'video' : 
              file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('audio/') ? 'audio' : 'unknown',
        mimeType: file.type,
        name: file.name,
        size: file.size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [],
        ...partialMetadata,
      };

      console.log('Prepared metadata:', metadata);

      // Obtenir une connexion à la base de données
      console.log('Getting database connection...');
      const db = await this.getDb();
      
      // Sauvegarder le fichier et les métadonnées
      console.log('Saving file to media store...');
      await db.put(LocalStorageAdapter.MEDIA_STORE, file, id);
      
      console.log('Saving metadata...');
      await db.put(LocalStorageAdapter.METADATA_STORE, metadata, id);

      // Générer la miniature pour les vidéos
      if (file.type.startsWith('video/')) {
        console.log('Generating thumbnail for video...');
        const thumbnail = await this.generateThumbnail(file);
        if (thumbnail) {
          console.log('Saving thumbnail...');
          await db.put(LocalStorageAdapter.THUMBNAIL_STORE, thumbnail, id);
        }
      }

      // Créer les URLs
      console.log('Creating object URL for file...');
      const mediaUrl = URL.createObjectURL(file);
      this.urlCache.set(id, mediaUrl);
      
      let thumbnailUrl: string | undefined;
      if (file.type.startsWith('video/')) {
        console.log('Getting thumbnail from store...');
        const thumbnail = await db.get(LocalStorageAdapter.THUMBNAIL_STORE, id);
        if (thumbnail) {
          console.log('Creating thumbnail URL...');
          thumbnailUrl = URL.createObjectURL(thumbnail);
          this.thumbnailUrlCache.set(id, thumbnailUrl);
        }
      }

      const result = {
        id,
        url: mediaUrl,
        thumbnailUrl,
        metadata,
      };

      console.log('Media save completed successfully:', result);
      return result;
      
    } catch (error) {
      console.error('Detailed error in saveMedia:', {
        error,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });
      
      if (error instanceof Error) {
        if (error.name === 'NotFoundError') {
          console.log('Database not found, attempting reset...');
          await this.resetDatabase();
          return this.saveMedia(file, partialMetadata);
        }
        
        if (error.name === 'QuotaExceededError') {
          throw new Error('Storage quota exceeded. Please free up some space.');
        }
      }
      
      throw error;
    }
  }

  async getMedia(id: string): Promise<MediaFile> {
    try {
      console.log('LocalStorageAdapter: Getting media with ID:', id);
      const db = await this.getDb();
      const file = await db.get(LocalStorageAdapter.MEDIA_STORE, id);
      const metadata = await db.get(LocalStorageAdapter.METADATA_STORE, id);

      if (!file) {
        console.error('LocalStorageAdapter: Media not found:', id);
        throw new Error(`Media not found: ${id}`);
      }

      console.log('LocalStorageAdapter: Media file found:', {
        id,
        hasFile: !!file,
        hasMetadata: !!metadata,
        fileType: file.type,
        fileSize: file.size
      });

      const finalMetadata = metadata || {
        id,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        mimeType: file.type || 'video/mp4',
        name: 'Unknown',
        size: file.size || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [],
      };

      let mediaUrl = this.urlCache.get(id);
      if (!mediaUrl) {
        console.log('LocalStorageAdapter: Creating new URL for media:', id);
        mediaUrl = URL.createObjectURL(file);
        this.urlCache.set(id, mediaUrl);
        console.log('LocalStorageAdapter: URL created and cached:', {
          id,
          hasUrl: !!mediaUrl
        });
      } else {
        console.log('LocalStorageAdapter: Using cached URL for media:', id);
      }

      let thumbnailUrl = this.thumbnailUrlCache.get(id);
      if (!thumbnailUrl && finalMetadata.type === 'video') {
        const thumbnail = await db.get(LocalStorageAdapter.THUMBNAIL_STORE, id);
        if (thumbnail) {
          console.log('LocalStorageAdapter: Creating thumbnail URL for video:', id);
          thumbnailUrl = URL.createObjectURL(thumbnail);
          this.thumbnailUrlCache.set(id, thumbnailUrl);
        }
      }

      const result = {
        id,
        url: mediaUrl,
        thumbnailUrl,
        metadata: finalMetadata,
      };

      console.log('LocalStorageAdapter: Media loaded successfully:', {
        id,
        hasUrl: !!result.url,
        hasMetadata: !!result.metadata,
        type: result.metadata.type
      });

      return result;
    } catch (error) {
      console.error('LocalStorageAdapter: Error in getMedia:', {
        id,
        error
      });
      if (error instanceof Error && error.name === 'NotFoundError') {
        console.log('LocalStorageAdapter: Database not found, attempting reset...');
        await this.resetDatabase();
        return this.getMedia(id);
      }
      throw error;
    }
  }

  async listMedia(filter?: MediaFilter): Promise<MediaFile[]> {
    try {
      const db = await this.getDb();
      const mediaKeys = await db.getAllKeys(LocalStorageAdapter.MEDIA_STORE);
      const mediaFiles = await Promise.all(
        mediaKeys.map(async (id) => {
          try {
            return await this.getMedia(id as string);
          } catch (error) {
            console.error(`Error loading media ${id}:`, error);
            return null;
          }
        })
      );

      const validMediaFiles = mediaFiles.filter((file): file is MediaFile => file !== null);
      return filter ? validMediaFiles.filter(file => this.matchesFilter(file.metadata, filter)) : validMediaFiles;
    } catch (error) {
      console.error('Error in listMedia:', error);
      if (error instanceof Error && error.name === 'NotFoundError') {
        await this.resetDatabase();
        return this.listMedia(filter);
      }
      throw error;
    }
  }

  private matchesFilter(metadata: MediaMetadata, filter: MediaFilter): boolean {
    if (filter.type && metadata.type !== filter.type) return false;
    if (filter.tags && filter.tags.length > 0) {
      if (!metadata.tags.some(tag => filter.tags!.includes(tag))) return false;
    }
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const nameMatch = metadata.name.toLowerCase().includes(searchLower);
      const tagMatch = metadata.tags.some(tag => tag.toLowerCase().includes(searchLower));
      if (!nameMatch && !tagMatch) return false;
    }
    return true;
  }

  async deleteMedia(id: string): Promise<void> {
    try {
      if (this.urlCache.has(id)) {
        URL.revokeObjectURL(this.urlCache.get(id)!);
        this.urlCache.delete(id);
      }
      if (this.thumbnailUrlCache.has(id)) {
        URL.revokeObjectURL(this.thumbnailUrlCache.get(id)!);
        this.thumbnailUrlCache.delete(id);
      }

      const db = await this.getDb();
      await db.delete(LocalStorageAdapter.MEDIA_STORE, id);
      await db.delete(LocalStorageAdapter.METADATA_STORE, id);
      await db.delete(LocalStorageAdapter.THUMBNAIL_STORE, id);
    } catch (error) {
      console.error('Error in deleteMedia:', error);
      throw error;
    }
  }

  async updateMetadata(id: string, updates: Partial<MediaMetadata>): Promise<MediaFile> {
    try {
      const db = await this.getDb();
      const currentMetadata = await db.get(LocalStorageAdapter.METADATA_STORE, id);
      
      if (!currentMetadata) {
        throw new Error(`Metadata not found for media: ${id}`);
      }

      const updatedMetadata = {
        ...currentMetadata,
        ...updates,
        id,
        updatedAt: new Date().toISOString(),
      };

      await db.put(LocalStorageAdapter.METADATA_STORE, updatedMetadata, id);

      return this.getMedia(id);
    } catch (error) {
      console.error('Error in updateMetadata:', error);
      if (error instanceof Error && error.name === 'NotFoundError') {
        await this.resetDatabase();
        return this.updateMetadata(id, updates);
      }
      throw error;
    }
  }

  public static async getInstance(): Promise<LocalStorageAdapter> {
    if (!LocalStorageAdapter.instance) {
      LocalStorageAdapter.instance = new LocalStorageAdapter();
    }
    return LocalStorageAdapter.instance;
  }
}
