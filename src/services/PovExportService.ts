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

    const media = await this.collectMediaFromNodes(nodes);
    const povFile = await this.createPovFile(nodes, edges, media);

    console.log('POV file created:', povFile);

    return povFile;
  }

  private async collectMediaFromNodes(nodes: Node[]): Promise<Record<string, MediaFile>> {
    const mediaIds = new Set<string>();
    console.log('Collecting media from nodes:', nodes);

    // Collecter tous les IDs de médias des nœuds
    nodes.forEach(node => {
      if (node.data?.mediaId) {
        mediaIds.add(node.data.mediaId);
      }
      // Ajouter la collecte des IDs audio
      if (node.data?.audioId) {
        console.log('Found audio ID:', node.data.audioId);
        mediaIds.add(node.data.audioId);
      }
    });

    console.log('Media IDs found:', Array.from(mediaIds));

    // Récupérer tous les médias
    const mediaPromises = Array.from(mediaIds).map(async id => {
      try {
        const media = await this.mediaLibrary.getMedia(id);
        if (media) {
          // Créer une nouvelle URL de blob pour le média
          const response = await fetch(media.url);
          const blob = await response.blob();
          const newUrl = URL.createObjectURL(blob);
          
          return {
            ...media,
            url: newUrl
          };
        }
        return null;
      } catch (error) {
        console.error(`Error loading media ${id}:`, error);
        return null;
      }
    });

    const mediaFiles = await Promise.all(mediaPromises);
    console.log('Media collected:', mediaFiles);

    // Créer un objet avec les médias indexés par ID
    const mediaMap: Record<string, MediaFile> = {};
    mediaFiles.forEach(media => {
      if (media) {
        mediaMap[media.metadata.id] = media;
      }
    });

    return mediaMap;
  }

  private async createPovFile(nodes: Node[], edges: Edge[], media: Record<string, MediaFile>): Promise<PovFile> {
    console.log('Creating POV file with:', { nodes, edges, media });
    
    // Convertir les nœuds pour le fichier POV
    const povNodes = nodes.map(node => ({
      id: node.id,
      type: node.type,
      data: {
        ...node.data,
        // S'assurer que l'audioId est inclus
        audioId: node.data?.audioId,
        content: {
          ...node.data?.content,
          // Inclure les paramètres audio s'ils existent
          audio: node.data?.content?.audio,
          choices: node.data?.content?.choices || [],
          timer: node.data?.content?.timer,
        }
      }
    }));

    // Créer le fichier POV
    const povFile: PovFile = {
      nodes: povNodes,
      edges,
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
      console.log('Starting POV file import:', file.name);
      const content = await file.text();
      const povData = JSON.parse(content);

      // Valider le format du fichier POV
      if (!this.validatePovFile(povData)) {
        throw new Error('Invalid POV file format');
      }

      console.log('POV file validation successful');

      // Importer les médias dans la bibliothèque locale
      const importedMedia: Record<string, MediaFile> = {};
      for (const [mediaId, mediaFile] of Object.entries(povData.media)) {
        try {
          console.log(`Importing media ${mediaId}...`, mediaFile);
          const imported = await this.mediaLibrary.importMedia({
            ...mediaFile,
            metadata: {
              ...mediaFile.metadata,
              type: mediaFile.metadata.type === 'pov' ? 'pov' : mediaFile.metadata.type
            }
          });
          importedMedia[mediaId] = imported;
          console.log(`Media ${mediaId} imported successfully`);
        } catch (error) {
          console.error(`Error importing media ${mediaId}:`, error);
          throw new Error(`Failed to import media ${mediaId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Convertir les nœuds POV en nœuds ReactFlow en préservant toute la structure
      const nodes: Node[] = povData.nodes.map(node => {
        // Récupérer le média correspondant
        const mediaFile = importedMedia[node.data?.mediaId];
        
        // Préserver la structure exacte du node
        const nodeData = {
          ...node.data,
          mediaId: node.data?.mediaId,
          mediaType: mediaFile?.metadata?.type,
          audioId: node.data?.audioId,
          content: {
            ...node.data?.content,
            timer: node.data?.content?.timer && {
              duration: node.data.content.timer.duration,
              autoTransition: node.data.content.timer.autoTransition ?? true,
              loop: node.data.content.timer.loop ?? false,
              pauseOnInteraction: node.data.content.timer.pauseOnInteraction ?? false
            },
            audio: node.data?.content?.audio && {
              volume: node.data.content.audio.volume ?? 1,
              loop: node.data.content.audio.loop ?? false,
              fadeIn: node.data.content.audio.fadeIn,
              fadeOut: node.data.content.audio.fadeOut
            },
            choices: node.data?.content?.choices ?? [],
            videoUrl: mediaFile?.url,
            imageUrl: mediaFile?.url
          },
          isPlaybackMode: node.data?.isPlaybackMode,
          onMediaEnd: node.data?.onMediaEnd,
          onDataChange: node.data?.onDataChange
        };

        console.log(`Node ${node.id} data:`, nodeData);

        return {
          id: node.id,
          type: node.type,
          position: node.position || { x: 0, y: 0 },
          data: nodeData
        };
      });

      // Convertir les edges POV en edges ReactFlow
      const edges: Edge[] = povData.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || undefined,
        data: {
          ...edge.data,
          label: edge.data?.label
        }
      }));

      console.log('POV file import completed successfully', {
        nodesCount: nodes.length,
        edgesCount: edges.length,
        mediaCount: Object.keys(importedMedia).length
      });

      return {
        nodes,
        edges,
        media: importedMedia
      };
    } catch (error) {
      console.error('Error importing POV file:', error);
      throw error instanceof Error ? error : new Error('Failed to import POV file');
    }
  }
}
