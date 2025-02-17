import { MediaFile, MediaMetadata } from '../../types/media';
import { MediaAnalyzer } from './analysis/MediaAnalyzer';
import { MediaLibraryService } from '../MediaLibraryService';

export class MediaUploadService {
  private static instance: MediaUploadService | null = null;
  private mediaAnalyzer: MediaAnalyzer;
  private mediaLibraryService: MediaLibraryService;

  private constructor() {
    this.mediaAnalyzer = MediaAnalyzer.getInstance();
    this.mediaLibraryService = MediaLibraryService.getInstance();
  }

  static getInstance(): MediaUploadService {
    if (!MediaUploadService.instance) {
      MediaUploadService.instance = new MediaUploadService();
    }
    return MediaUploadService.instance;
  }

  /**
   * Télécharge et analyse un fichier média
   * @param file Le fichier à télécharger
   * @param onProgress Callback pour suivre la progression
   * @returns Les métadonnées du média
   */
  async uploadMedia(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<MediaFile> {
    try {
      // Étape 1: Analyser le fichier
      console.log('Analyzing media file:', file.name);
      const metadata = await this.mediaAnalyzer.analyzeMedia(file);

      // Étape 2: Sauvegarder le média
      console.log('Saving media file:', file.name);
      const mediaFile = await this.mediaLibraryService.saveMedia(file, metadata);

      return mediaFile;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw new Error(`Failed to upload media: ${error.message}`);
    }
  }

  /**
   * Télécharge plusieurs fichiers médias
   * @param files Les fichiers à télécharger
   * @param onProgress Callback pour suivre la progression
   * @returns Les métadonnées des médias
   */
  async uploadMultipleMedia(
    files: File[],
    onProgress?: (progress: number) => void
  ): Promise<MediaFile[]> {
    const total = files.length;
    const results: MediaFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const mediaFile = await this.uploadMedia(file);
        results.push(mediaFile);
        
        if (onProgress) {
          onProgress((i + 1) / total * 100);
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }

    return results;
  }

  /**
   * Valide un fichier média
   * @param file Le fichier à valider
   * @param acceptedTypes Les types de fichiers acceptés
   * @returns true si le fichier est valide
   */
  validateFile(file: File, acceptedTypes: string[] = []): boolean {
    if (acceptedTypes.length === 0) return true;

    const mediaType = file.type.split('/')[0];
    return acceptedTypes.some(type => {
      const [baseType] = type.split('/');
      return (
        type === '*' ||
        type === file.type ||
        (type.endsWith('/*') && baseType === mediaType)
      );
    });
  }
}
