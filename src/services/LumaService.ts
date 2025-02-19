import axios from 'axios';
import { MediaLibraryService } from './MediaLibraryService';
import { MediaFile } from '../types/media';

interface LumaConfig {
  apiKey: string;
  baseUrl: string;
}

interface LumaGenerationRequest {
  prompt: string;
  negative_prompt?: string;
  style_preset?: string;
  num_frames?: number;
  width?: number;
  height?: number;
}

interface LumaGenerationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  output?: {
    url: string;
  };
  error?: string;
}

export class LumaService {
  private config: LumaConfig;
  private mediaLibraryService: MediaLibraryService;

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_LUMA_API_KEY,
      baseUrl: 'https://api.lumalabs.ai/v1'
    };
    this.mediaLibraryService = new MediaLibraryService();
  }

  async generateVideo(prompt: string, options: Partial<LumaGenerationRequest> = {}): Promise<MediaFile> {
    try {
      // Créer la requête de génération
      const response = await axios.post<LumaGenerationResponse>(
        `${this.config.baseUrl}/videos/generations`,
        {
          prompt,
          ...options
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Attendre que la génération soit terminée
      const result = await this.pollGenerationStatus(response.data.id);

      if (result.status === 'completed' && result.output?.url) {
        // Télécharger la vidéo et l'ajouter à la bibliothèque
        const videoBlob = await this.downloadVideo(result.output.url);
        const file = new File([videoBlob], 'generated-video.mp4', { type: 'video/mp4' });
        
        // Créer les métadonnées
        const metadata = {
          type: 'video' as const,
          mimeType: 'video/mp4',
          name: `Luma Generation - ${new Date().toISOString()}`,
          size: file.size,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['luma', 'generated', ...prompt.split(' ').slice(0, 5)],
          duration: 0, // Sera mis à jour par MediaLibraryService
        };

        // Sauvegarder dans la bibliothèque de médias
        return await this.mediaLibraryService.uploadMedia(file, metadata);
      } else {
        throw new Error(result.error || 'Video generation failed');
      }
    } catch (error) {
      console.error('Error generating video with Luma:', error);
      throw error;
    }
  }

  private async pollGenerationStatus(generationId: string): Promise<LumaGenerationResponse> {
    const maxAttempts = 30;
    const delayMs = 2000;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await axios.get<LumaGenerationResponse>(
        `${this.config.baseUrl}/videos/generations/${generationId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (response.data.status === 'completed' || response.data.status === 'failed') {
        return response.data;
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
      attempts++;
    }

    throw new Error('Generation timed out');
  }

  private async downloadVideo(url: string): Promise<Blob> {
    const response = await axios.get(url, {
      responseType: 'blob'
    });
    return response.data;
  }
}
