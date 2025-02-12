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

  public async exportToPovFile(project: any): Promise<Blob> {
    const title = project.scenario?.scenarioTitle || 'sans-titre';
    const safeTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-') // Remplacer les caractères non alphanumériques par des tirets
      .replace(/-+/g, '-') // Remplacer les tirets multiples par un seul
      .replace(/^-|-$/g, ''); // Supprimer les tirets au début et à la fin

    const povData = await this.exportScenario(title, project.nodes, project.edges);
    const date = new Date().toISOString().split('T')[0];
    const filename = `${safeTitle}_${date}.pov`;
    return new Blob([JSON.stringify(povData)], { type: 'application/json' });
  }

  private validatePovFile(data: any): data is PovFile {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid POV file format: root must be an object');
    }

    // Valider les nodes
    if (!Array.isArray(data.nodes)) {
      throw new Error('Invalid POV file format: nodes must be an array');
    }

    for (const node of data.nodes) {
      if (!node.id || !node.type || !node.data) {
        throw new Error('Invalid POV file format: each node must have id, type, and data');
      }
    }

    // Valider les edges
    if (!Array.isArray(data.edges)) {
      throw new Error('Invalid POV file format: edges must be an array');
    }

    for (const edge of data.edges) {
      if (!edge.id || !edge.source || !edge.target) {
        throw new Error('Invalid POV file format: each edge must have id, source, and target');
      }
    }

    // Valider les médias
    if (!data.media || typeof data.media !== 'object') {
      throw new Error('Invalid POV file format: media must be an object');
    }

    for (const [mediaId, mediaFile] of Object.entries(data.media)) {
      if (!mediaFile || !mediaFile.metadata || !mediaFile.url) {
        throw new Error(`Invalid POV file format: invalid media format for ID ${mediaId}`);
      }
    }

    return true;
  }

  public async importFromPovFile(file: File): Promise<{
    nodes: Node[];
    edges: Edge[];
    media: Record<string, MediaFile>;
  }> {
    await this.initialize();

    if (!this.mediaLibrary) {
      throw new Error('MediaLibrary not initialized');
    }

    if (!file.name.endsWith('.pov')) {
      throw new Error('Invalid file type: must be a .pov file');
    }

    try {
      const content = await file.text();
      const povData = JSON.parse(content);

      // Valider le format du fichier POV
      if (!this.validatePovFile(povData)) {
        throw new Error('Invalid POV file format');
      }

      console.log('Importing POV file:', povData);

      // Importer les médias dans la bibliothèque locale
      for (const [mediaId, mediaFile] of Object.entries(povData.media)) {
        try {
          await this.mediaLibrary.importMedia(mediaFile);
          console.log(`Media ${mediaId} imported successfully`);
        } catch (error) {
          console.error(`Error importing media ${mediaId}:`, error);
          throw new Error(`Failed to import media ${mediaId}`);
        }
      }

      // Convertir les nœuds POV en nœuds ReactFlow
      const nodes: Node[] = povData.nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: { x: 0, y: 0 }, // Position par défaut, à ajuster par l'éditeur
        data: {
          mediaId: node.data.mediaId,
          content: node.data.content
        }
      }));

      // Convertir les edges POV en edges ReactFlow
      const edges: Edge[] = povData.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || undefined,
        data: edge.data
      }));

      console.log('POV file imported successfully:', { nodes, edges });

      return {
        nodes,
        edges,
        media: povData.media
      };
    } catch (error) {
      console.error('Error importing POV file:', error);
      throw error instanceof Error ? error : new Error('Failed to import POV file');
    }
  }
}
