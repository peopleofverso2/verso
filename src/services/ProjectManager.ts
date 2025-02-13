import { MediaLibraryService } from './MediaLibraryService';
import { ProjectService } from './projectService';
import { PovExportService } from './PovExportService';
import { Project, ProjectMetadata } from '../types/project';
import { MediaFile } from '../types/media';

/**
 * Service unifié pour la gestion des projets
 * Implémente le pattern Facade pour simplifier l'interface
 * tout en maintenant la compatibilité avec les services existants
 */
export class ProjectManager {
  private static instance: ProjectManager | null = null;
  private projectService: ProjectService;
  private mediaLibrary: MediaLibraryService | null = null;
  private povExport: PovExportService;
  private initialized = false;

  private constructor() {
    this.projectService = ProjectService.getInstance();
    this.povExport = PovExportService.getInstance();
  }

  public static getInstance(): ProjectManager {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager();
    }
    return ProjectManager.instance;
  }

  /**
   * Initialise tous les services nécessaires
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.mediaLibrary = await MediaLibraryService.getInstance();
      await this.projectService.initialize();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize ProjectManager:', error);
      throw error;
    }
  }

  /**
   * Récupère la liste des projets avec leurs médias associés
   */
  public async getProjects(): Promise<ProjectMetadata[]> {
    await this.ensureInitialized();
    return this.projectService.getProjectList();
  }

  /**
   * Crée un nouveau projet
   */
  public async createProject(title: string, description: string = ''): Promise<string> {
    await this.ensureInitialized();
    return this.projectService.createProject(title, description);
  }

  /**
   * Charge un projet avec tous ses médias
   */
  public async loadProject(projectId: string): Promise<Project | null> {
    await this.ensureInitialized();
    const project = await this.projectService.loadProject(projectId);
    if (!project) return null;

    // Précharge les médias si nécessaire
    if (this.mediaLibrary) {
      const mediaIds = this.extractMediaIds(project);
      await Promise.all(
        mediaIds.map(async (mediaId) => {
          try {
            await this.mediaLibrary?.getMedia(mediaId);
          } catch (error) {
            console.warn(`Failed to preload media ${mediaId}:`, error);
          }
        })
      );
    }

    return project;
  }

  /**
   * Supprime un projet et nettoie ses ressources
   */
  public async deleteProject(projectId: string): Promise<void> {
    await this.ensureInitialized();
    const project = await this.projectService.loadProject(projectId);
    
    if (project) {
      // Nettoyage des médias si nécessaire
      const mediaIds = this.extractMediaIds(project);
      // Note: on ne supprime pas les médias car ils peuvent être utilisés par d'autres projets
      
      await this.projectService.deleteProject(projectId);
    }
  }

  /**
   * Exporte un projet au format POV
   */
  public async exportToPov(projectId: string): Promise<Blob> {
    await this.ensureInitialized();
    const project = await this.loadProject(projectId);
    if (!project) throw new Error('Project not found');

    return this.povExport.exportProject(project);
  }

  /**
   * Met à jour les métadonnées d'un projet
   */
  public async updateProjectMetadata(projectId: string, metadata: Partial<ProjectMetadata>): Promise<void> {
    await this.ensureInitialized();
    
    try {
      // Charger le projet existant
      const project = await this.loadProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Mettre à jour les métadonnées en fusionnant avec l'existant
      const updatedProject = {
        ...project,
        scenario: {
          ...project.scenario,
          ...metadata.scenario
        }
      };

      // Sauvegarder le projet mis à jour
      await this.projectService.saveProject(updatedProject);
    } catch (error) {
      console.error('Failed to update project metadata:', error);
      throw error;
    }
  }

  /**
   * Vérifie si les services sont initialisés
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Extrait tous les IDs de médias d'un projet
   */
  private extractMediaIds(project: Project): string[] {
    const mediaIds = new Set<string>();
    
    // Parcourt les nœuds pour trouver les médias
    project.nodes.forEach(node => {
      if (node.data?.mediaId) {
        mediaIds.add(node.data.mediaId);
      }
      if (node.data?.audioId) {
        mediaIds.add(node.data.audioId);
      }
    });

    return Array.from(mediaIds);
  }
}
