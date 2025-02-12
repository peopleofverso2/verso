import { MediaStorageAdapter, MediaFile, MediaMetadata, MediaFilter } from '../types/media';
import { LocalStorageAdapter } from './storage/LocalStorageAdapter';
import { resizeImage, ResizeOptions } from '../utils/imageResizer';

export class MediaLibraryService {
  private static instance: MediaLibraryService;
  private storageAdapter: MediaStorageAdapter;
  private urlCache: Map<string, string> = new Map();

  private readonly DEFAULT_IMAGE_OPTIONS: ResizeOptions = {
    maxWidth: 2560,
    maxHeight: 1440,
    maintainAspectRatio: true,
    quality: 0.95
  };

  private constructor() {
    // L'adaptateur sera initialisé dans init()
  }

  public static async getInstance(adapter?: MediaStorageAdapter): Promise<MediaLibraryService> {
    if (!MediaLibraryService.instance) {
      MediaLibraryService.instance = new MediaLibraryService();
      await MediaLibraryService.instance.init(adapter);
    }
    return MediaLibraryService.instance;
  }

  private async init(adapter?: MediaStorageAdapter) {
    this.storageAdapter = adapter || await LocalStorageAdapter.getInstance();
  }

  setStorageAdapter(adapter: MediaStorageAdapter) {
    this.storageAdapter = adapter;
  }

  async uploadMedia(file: File, metadata: Partial<MediaMetadata> = {}): Promise<MediaFile> {
    // Vérifier si c'est un fichier .pov
    if (file.name.endsWith('.pov')) {
      const autoMetadata: Partial<MediaMetadata> = {
        ...metadata,
        type: 'pov',
        mimeType: 'application/pov',
      };
      return this.storageAdapter.saveMedia(file, autoMetadata);
    }

    // Pour les autres types de fichiers
    if (!file.type.startsWith('video/') && 
        !file.type.startsWith('image/') && 
        !file.type.startsWith('audio/')) {
      throw new Error('Type de fichier non supporté');
    }

    const autoMetadata: Partial<MediaMetadata> = {
      ...metadata,
      type: file.type.startsWith('video/') 
        ? 'video' 
        : file.type.startsWith('image/') 
          ? 'image' 
          : 'audio',
    };

    let processedFile = file;
    
    // Redimensionner l'image si nécessaire
    if (file.type.startsWith('image/')) {
      try {
        // Obtenir les dimensions originales
        const originalDimensions = await this.getMediaDimensions(file);
        
        // Ne redimensionner que si l'image est plus grande que les dimensions maximales
        if (originalDimensions && 
            (originalDimensions.width > this.DEFAULT_IMAGE_OPTIONS.maxWidth || 
             originalDimensions.height > this.DEFAULT_IMAGE_OPTIONS.maxHeight)) {
          processedFile = await resizeImage(file, this.DEFAULT_IMAGE_OPTIONS);
          const dimensions = await this.getMediaDimensions(processedFile);
          if (dimensions) {
            autoMetadata.dimensions = dimensions;
          }
        } else if (originalDimensions) {
          // Garder les dimensions originales si pas de redimensionnement
          autoMetadata.dimensions = originalDimensions;
        }
      } catch (error) {
        console.error('Error processing image:', error);
        // Continuer avec le fichier original en cas d'erreur
        processedFile = file;
      }
    } else if (file.type.startsWith('video/')) {
      const duration = await this.getVideoDuration(file);
      autoMetadata.duration = duration;
      const dimensions = await this.getMediaDimensions(file);
      if (dimensions) {
        autoMetadata.dimensions = dimensions;
      }
    } else if (file.type.startsWith('audio/')) {
      try {
        const duration = await this.getAudioDuration(file);
        autoMetadata.duration = duration;
      } catch (error) {
        console.warn('Erreur lors de la récupération de la durée audio:', error);
      }
    }

    const mediaFile = await this.storageAdapter.saveMedia(processedFile, autoMetadata);
    
    // Mettre en cache l'URL
    if (mediaFile.url) {
      this.urlCache.set(mediaFile.id, mediaFile.url);
    }

    return mediaFile;
  }

  private getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      const url = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(video.duration);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video metadata'));
      };
      
      video.src = url;
    });
  }

  private getMediaDimensions(file: File): Promise<{ width: number; height: number } | undefined> {
    return new Promise((resolve, reject) => {
      if (file.type.startsWith('image/')) {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve({ width: img.width, height: img.height });
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load image'));
        };
        
        img.src = url;
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        const url = URL.createObjectURL(file);
        
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(url);
          resolve({ width: video.videoWidth, height: video.videoHeight });
        };
        
        video.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load video metadata'));
        };
        
        video.src = url;
      } else {
        resolve(undefined);
      }
    });
  }

  private getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);

      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Erreur lors du chargement de l\'audio'));
      };

      audio.src = url;
    });
  }

  async getMedia(id: string): Promise<MediaFile> {
    // Vérifier si l'URL est en cache
    const cachedUrl = this.urlCache.get(id);
    if (cachedUrl) {
      const media = await this.storageAdapter.getMedia(id);
      return { ...media, url: cachedUrl };
    }

    const media = await this.storageAdapter.getMedia(id);
    
    // Mettre en cache la nouvelle URL
    if (media.url) {
      this.urlCache.set(id, media.url);
    }
    
    return media;
  }

  async listMedia(filter?: MediaFilter): Promise<MediaFile[]> {
    const mediaFiles = await this.storageAdapter.listMedia(filter);
    
    // Mettre à jour le cache des URLs
    mediaFiles.forEach(media => {
      if (media.url) {
        this.urlCache.set(media.id, media.url);
      }
    });
    
    return mediaFiles;
  }

  async deleteMedia(id: string): Promise<void> {
    // Révoquer l'URL du cache
    const cachedUrl = this.urlCache.get(id);
    if (cachedUrl) {
      URL.revokeObjectURL(cachedUrl);
      this.urlCache.delete(id);
    }
    
    return this.storageAdapter.deleteMedia(id);
  }

  async updateMetadata(id: string, metadata: Partial<MediaMetadata>): Promise<MediaFile> {
    return this.storageAdapter.updateMetadata(id, metadata);
  }

  async checkMediaExists(mediaId: string): Promise<boolean> {
    try {
      const media = await this.storageAdapter.getMedia(mediaId);
      return !!media;
    } catch (error) {
      console.error('Error checking media existence:', error);
      return false;
    }
  }

  async importMedia(mediaFile: MediaFile): Promise<MediaFile> {
    // Vérifier si le média existe déjà
    try {
      const existingMedia = await this.getMedia(mediaFile.id);
      if (existingMedia) {
        return existingMedia;
      }
    } catch (error) {
      // Le média n'existe pas, on continue l'import
    }

    // Créer un blob à partir de l'URL du média
    const response = await fetch(mediaFile.url);
    const blob = await response.blob();
    const file = new File([blob], mediaFile.metadata.name, { type: mediaFile.metadata.mimeType });

    // Importer le média avec ses métadonnées
    const importedMedia = await this.storageAdapter.saveMedia(file, mediaFile.metadata);
    
    return importedMedia;
  }
}
