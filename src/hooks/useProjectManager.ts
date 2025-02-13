import { useState, useEffect, useCallback } from 'react';
import { ProjectManager } from '../services/ProjectManager';
import { Project, ProjectMetadata } from '../types/project';

export function useProjectManager() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [manager] = useState(() => ProjectManager.getInstance());

  // Charge la liste des projets
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const projectList = await manager.getProjects();
      setProjects(projectList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [manager]);

  // Crée un nouveau projet
  const createProject = useCallback(async (title: string, description?: string) => {
    try {
      setError(null);
      const projectId = await manager.createProject(title, description);
      await loadProjects(); // Recharge la liste
      return projectId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      throw err;
    }
  }, [manager, loadProjects]);

  // Charge un projet spécifique
  const loadProject = useCallback(async (projectId: string) => {
    try {
      setError(null);
      return await manager.loadProject(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
      throw err;
    }
  }, [manager]);

  // Met à jour les métadonnées d'un projet
  const updateProjectMetadata = useCallback(async (projectId: string, metadata: Partial<ProjectMetadata>) => {
    try {
      setError(null);
      await manager.updateProjectMetadata(projectId, metadata);
      await loadProjects(); // Recharge la liste pour refléter les changements
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project metadata');
      throw err;
    }
  }, [manager, loadProjects]);

  // Supprime un projet
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      setError(null);
      await manager.deleteProject(projectId);
      await loadProjects(); // Recharge la liste
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      throw err;
    }
  }, [manager, loadProjects]);

  // Exporte un projet en POV
  const exportToPov = useCallback(async (projectId: string) => {
    try {
      setError(null);
      return await manager.exportToPov(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export project');
      throw err;
    }
  }, [manager]);

  // Charge les projets au montage du composant
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    loading,
    error,
    projects,
    loadProjects,
    createProject,
    loadProject,
    deleteProject,
    exportToPov,
    updateProjectMetadata,
  };
}
