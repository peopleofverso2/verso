import { Project, ProjectMetadata } from '../types/project';

const DB_NAME = 'verso_db';
const STORE_NAME = 'projects';
const DB_VERSION = 4; // Incrémenter la version pour forcer la mise à jour

export class ProjectService {
  private db: IDBDatabase | null = null;
  private static instance: ProjectService | null = null;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('Initializing ProjectService...');
      await this.getDB();
      this.initialized = true;
      console.log('ProjectService initialized successfully');
    } catch (error) {
      console.error('Error initializing ProjectService:', error);
      throw error;
    }
  }

  async resetDatabase(): Promise<void> {
    console.log('Resetting database...');
    try {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      await deleteDB(DB_NAME);
      console.log('Database deleted successfully');
      await this.initialize();
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      console.log('Opening database...', DB_NAME, 'version:', DB_VERSION);
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          console.error('Error opening database:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          console.log('Database opened successfully');
          this.db = request.result;
          resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
          console.log('Database upgrade needed from version:', event.oldVersion, 'to:', event.newVersion);
          const db = request.result;
          
          // Créer le store si nécessaire
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            console.log('Creating object store:', STORE_NAME);
            db.createObjectStore(STORE_NAME, { keyPath: 'projectId' });
            console.log('Object store created with indexes');
          }
        };
      });
    }
    return this.db;
  }

  async createProject(title: string, description: string = ''): Promise<string> {
    await this.initialize();
    
    console.log('Creating project with title:', title);
    const projectId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const newProject: Project = {
      projectId,
      scenario: {
        scenarioTitle: title,
        description,
        steps: []
      },
      nodes: [],
      edges: [],
      createdAt: now,
      updatedAt: now
    };

    console.log('New project object:', newProject);
    await this.saveProject(newProject);
    console.log('Project saved successfully');
    return projectId;
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    await this.initialize();
    
    console.log('Updating project:', projectId);
    const project = await this.loadProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const updatedProject = {
      ...project,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.saveProject(updatedProject);
    console.log('Project updated successfully');
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.initialize();
    
    try {
      console.log('Deleting project:', projectId);
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(projectId);

        request.onsuccess = () => {
          console.log('Project deleted successfully');
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  async loadProject(projectId: string): Promise<Project | null> {
    await this.initialize();
    
    try {
      console.log('Loading project:', projectId);
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(projectId);

        request.onsuccess = () => {
          const project = request.result;
          console.log('Project loaded:', project);
          resolve(project || null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error loading project:', error);
      throw error;
    }
  }

  async saveProject(project: Project): Promise<void> {
    await this.initialize();
    
    if (!project.projectId) {
      throw new Error('Project must have a projectId');
    }

    try {
      console.log('Saving project:', project);
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        // Ajouter les timestamps
        const now = new Date().toISOString();
        const projectToSave = {
          ...project,
          updatedAt: now,
          createdAt: project.createdAt || now
        };

        const request = store.put(projectToSave);

        request.onsuccess = () => {
          console.log('Project saved successfully with ID:', request.result);
          resolve();
        };
        request.onerror = () => {
          console.error('Error saving project:', request.error);
          reject(request.error);
        };

        transaction.oncomplete = () => {
          console.log('Transaction completed successfully');
        };

        transaction.onerror = () => {
          console.error('Transaction error:', transaction.error);
        };
      });
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  }

  async getProjectList(): Promise<ProjectMetadata[]> {
    await this.initialize();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      console.log('Getting project list');
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      const projects = await new Promise<any[]>((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

      console.log('Raw projects:', projects);
      
      // Convertir en ProjectMetadata en préservant toutes les données du scénario
      const projectMetadata = projects.map(project => ({
        projectId: project.projectId,
        scenario: {
          ...project.scenario, // Préserver toutes les données du scénario
          scenarioTitle: project.scenario?.scenarioTitle || 'Sans titre',
          description: project.scenario?.description || '',
          coverImageId: project.scenario?.coverImageId || null,
          thumbnails: project.scenario?.thumbnails || [],
        },
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }));

      console.log('Project metadata with full structure:', projectMetadata);
      return projectMetadata;

    } catch (error) {
      console.error('Error getting project list:', error);
      throw error;
    }
  }

  async exportAllProjects(): Promise<Project[]> {
    await this.initialize();
    
    try {
      console.log('Exporting all projects');
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const projects = request.result || [];
          console.log('Exported projects:', projects.length);
          resolve(projects);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error exporting projects:', error);
      throw error;
    }
  }

  async importProjects(projects: Project[]): Promise<void> {
    await this.initialize();
    
    try {
      console.log('Importing projects:', projects.length);
      const db = await this.getDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        // Importer chaque projet
        projects.forEach(project => {
          const request = store.put(project);
          request.onerror = () => {
            console.error('Error importing project:', project.projectId, request.error);
          };
        });

        transaction.oncomplete = () => {
          console.log('All projects imported successfully');
          resolve();
        };

        transaction.onerror = () => {
          console.error('Transaction error:', transaction.error);
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('Error importing projects:', error);
      throw error;
    }
  }

  async getProject(projectId: string): Promise<Project> {
    await this.initialize();
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(projectId);
      
      request.onerror = () => {
        reject(new Error('Error getting project'));
      };
      
      request.onsuccess = () => {
        const project = request.result;
        if (!project) {
          reject(new Error('Project not found'));
        } else {
          resolve(project);
        }
      };
    });
  }

  private getFromStore(store: IDBObjectStore, key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  private putInStore(store: IDBObjectStore, value: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = store.put(value);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  public async updateProjectMetadata(project: ProjectMetadata): Promise<void> {
    console.log('ProjectService: updating metadata for project:', {
      projectId: project.projectId,
      scenario: JSON.stringify(project.scenario, null, 2)
    });
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    if (!project.projectId) {
      throw new Error('Project ID is required for update');
    }

    try {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      // Récupérer le projet existant avec une promesse
      const existingProject = await this.getFromStore(store, project.projectId);
      
      if (!existingProject) {
        throw new Error(`Project not found: ${project.projectId}`);
      }

      console.log('Existing project structure:', {
        projectId: existingProject.projectId,
        scenario: JSON.stringify(existingProject.scenario, null, 2),
        nodes: existingProject.nodes?.length,
        edges: existingProject.edges?.length,
        createdAt: existingProject.createdAt,
        updatedAt: existingProject.updatedAt
      });

      // S'assurer que le scenario existe
      if (!existingProject.scenario) {
        existingProject.scenario = {};
      }

      // Mettre à jour uniquement les métadonnées tout en préservant le reste
      const updatedProject = {
        ...existingProject,
        scenario: {
          ...existingProject.scenario,
          scenarioTitle: project.scenario?.scenarioTitle || existingProject.scenario?.scenarioTitle || 'Sans titre',
          description: project.scenario?.description || existingProject.scenario?.description || ''
        },
        updatedAt: new Date().toISOString()
      };

      console.log('Updated project structure:', {
        projectId: updatedProject.projectId,
        scenario: JSON.stringify(updatedProject.scenario, null, 2),
        nodes: updatedProject.nodes?.length,
        edges: updatedProject.edges?.length,
        createdAt: updatedProject.createdAt,
        updatedAt: updatedProject.updatedAt
      });

      // Sauvegarder le projet mis à jour avec une promesse
      await this.putInStore(store, updatedProject);
      await tx.done;

      console.log('Project metadata updated successfully');
    } catch (error) {
      console.error('Error updating project metadata:', error);
      throw error;
    }
  }
}
