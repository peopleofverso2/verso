import { Node, Edge } from 'reactflow';
import { LocalStorageAdapter } from './storage/LocalStorageAdapter';
import { MediaLibraryService } from './MediaLibraryService';
import { MediaFile } from '../types/media';

interface PovFile {
  nodes: {
    id: string;
    type: string;
    data: {
      mediaId: string;
      content: {
        choices: any[];
        videoUrl: string;
        video: any;
      };
    };
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    sourceHandle: string;
    data: {
      label: string;
    };
  }[];
  media: Record<string, MediaFile>;
}

export class PovExportService {
  private static instance: PovExportService;
  private storageAdapter?: LocalStorageAdapter;
  private mediaLibrary?: MediaLibraryService;
  private initialized = false;

  private constructor() {}

  private async initialize() {
    if (this.initialized) return;

    try {
      this.storageAdapter = await LocalStorageAdapter.getInstance();
      this.mediaLibrary = await MediaLibraryService.getInstance();
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing PovExportService:', error);
      throw error;
    }
  }

  public static getInstance(): PovExportService {
    if (!PovExportService.instance) {
      PovExportService.instance = new PovExportService();
    }
    return PovExportService.instance;
  }

  public async exportScenario(title: string, nodes: Node[], edges: Edge[]): Promise<PovFile> {
    await this.initialize();
    
    if (!this.mediaLibrary) {
      throw new Error('MediaLibrary not initialized');
    }

    console.log('Exporting scenario:', { title, nodes, edges });

    // Collecter tous les IDs de médias utilisés dans les nœuds
    const mediaIds = nodes
      .map(node => node.data?.mediaId)
      .filter((id): id is string => !!id);

    console.log('Media IDs found:', mediaIds);

    // Récupérer les métadonnées des médias
    const media: Record<string, MediaFile> = {};
    for (const mediaId of mediaIds) {
      try {
        const mediaFile = await this.mediaLibrary.getMedia(mediaId);
        if (mediaFile) {
          media[mediaId] = mediaFile;
        }
      } catch (error) {
        console.error(`Error getting media ${mediaId}:`, error);
      }
    }

    console.log('Media collected:', Object.keys(media));

    // Créer le fichier POV
    const povFile = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        data: {
          mediaId: node.data?.mediaId,
          content: {
            choices: node.data?.content?.choices || [],
            videoUrl: node.data?.content?.videoUrl,
            video: node.data?.content?.video
          }
        }
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || '',
        data: {
          label: edge.data?.label
        }
      })),
      media
    };

    console.log('POV file created:', povFile);

    return povFile;
  }
}
