import { MediaMetadata } from '../../../types/media';
import { ImageAnalyzer } from '../../ai/ImageAnalyzer';

export class MediaAnalyzer {
  private static instance: MediaAnalyzer | null = null;
  private imageAnalyzer: ImageAnalyzer;

  private constructor() {
    this.imageAnalyzer = ImageAnalyzer.getInstance();
  }

  static getInstance(): MediaAnalyzer {
    if (!MediaAnalyzer.instance) {
      MediaAnalyzer.instance = new MediaAnalyzer();
    }
    return MediaAnalyzer.instance;
  }

  /**
   * Analyse un fichier média et extrait ses métadonnées
   * @param file Le fichier média à analyser
   * @returns Les métadonnées du média
   */
  async analyzeMedia(file: File): Promise<MediaMetadata> {
    try {
      // Créer un objet URL pour l'analyse
      const objectUrl = URL.createObjectURL(file);

      try {
        const metadata: MediaMetadata = {
          id: crypto.randomUUID(),
          type: this.getMediaType(file),
          mimeType: file.type,
          name: file.name,
          size: file.size,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
        };

        // Extraire les métadonnées spécifiques au type
        if (metadata.type === 'video') {
          const videoMetadata = await this.extractVideoMetadata(file);
          metadata.duration = videoMetadata.duration;
          metadata.dimensions = videoMetadata.dimensions;
          metadata.tags = await this.generateVideoTags(objectUrl);
        } else if (metadata.type === 'image') {
          const imageMetadata = await this.extractImageMetadata(file);
          metadata.dimensions = imageMetadata.dimensions;
          metadata.tags = await this.generateImageTags(objectUrl);
        }

        return metadata;
      } finally {
        // Toujours révoquer l'URL pour éviter les fuites mémoire
        URL.revokeObjectURL(objectUrl);
      }
    } catch (error) {
      console.error('Error analyzing media:', error);
      throw new Error(`Failed to analyze media: ${error.message}`);
    }
  }

  private getMediaType(file: File): 'video' | 'image' {
    return file.type.startsWith('video/') ? 'video' : 'image';
  }

  private async generateImageTags(imageUrl: string): Promise<string[]> {
    try {
      const analysis = await this.imageAnalyzer.analyzeImage(imageUrl);
      return [
        ...analysis.tags,
        ...analysis.dominantColors,
        analysis.style,
        analysis.mood
      ].filter(Boolean);
    } catch (error) {
      console.warn('Error generating image tags:', error);
      return [];
    }
  }

  private async generateVideoTags(videoUrl: string): Promise<string[]> {
    try {
      // Capturer la première frame de la vidéo
      const video = document.createElement('video');
      video.src = videoUrl;
      await new Promise((resolve) => {
        video.onloadeddata = resolve;
        video.load();
      });

      // Créer un canvas pour extraire l'image
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // Dessiner la première frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frameDataUrl = canvas.toDataURL('image/jpeg');

      // Analyser la frame
      const analysis = await this.imageAnalyzer.analyzeImage(frameDataUrl);
      return [
        'video',
        ...analysis.tags,
        analysis.style,
        analysis.mood
      ].filter(Boolean);
    } catch (error) {
      console.warn('Error generating video tags:', error);
      return ['video'];
    }
  }

  private async extractVideoMetadata(file: File): Promise<{
    duration?: number;
    dimensions?: { width: number; height: number };
  }> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          dimensions: {
            width: video.videoWidth,
            height: video.videoHeight,
          },
        });
      };

      video.onerror = () => {
        resolve({});
      };

      video.src = URL.createObjectURL(file);
    });
  }

  private async extractImageMetadata(file: File): Promise<{
    dimensions?: { width: number; height: number };
  }> {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          dimensions: {
            width: img.width,
            height: img.height,
          },
        });
      };

      img.onerror = () => {
        resolve({});
      };

      img.src = URL.createObjectURL(file);
    });
  }
}
