import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tooltip,
  IconButton,
  Card,
  CardContent,
  CardActions,
  CircularProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  CloudDownload as CloudDownloadIcon,
  GetApp as GetAppIcon,
  OpenInNew as OpenInNewIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { ProjectService } from '../../services/projectService';
import { ProjectMetadata } from '../../types/project';
import ProjectList from '../ProjectList/ProjectList';
import { PovExportService } from '../../services/povExportService';
import PovPlayer from '../Player/PovPlayer';

interface ProjectLibraryProps {
  onProjectSelect: (projectId: string) => void;
  onProjectDelete: (projectId: string) => void;
}

interface ProjectMetadataDialogProps {
  open: boolean;
  project: ProjectMetadata;
  onClose: () => void;
  onSave: (updatedProject: ProjectMetadata) => void;
}

const ProjectMetadataDialog: React.FC<ProjectMetadataDialogProps> = ({
  open,
  project,
  onClose,
  onSave
}) => {
  console.log('Opening dialog with project:', JSON.stringify(project, null, 2));
  const [title, setTitle] = useState(project.scenario?.scenarioTitle || '');
  const [description, setDescription] = useState(project.scenario?.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const updatedProject = {
        ...project,
        scenario: {
          ...project.scenario,
          scenarioTitle: title,
          description: description
        }
      };
      
      console.log('Saving project with structure:', JSON.stringify(updatedProject, null, 2));
      await onSave(updatedProject);
      onClose();
    } catch (err) {
      console.error('Error saving metadata:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Modifier les métadonnées</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="Titre"
          type="text"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={saving}
        />
        <TextField
          margin="dense"
          label="Description"
          type="text"
          fullWidth
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={saving}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={saving}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ProjectLibrary: React.FC<ProjectLibraryProps> = ({ onProjectSelect, onProjectDelete }) => {
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [editingProject, setEditingProject] = useState<ProjectMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPovPlayer, setShowPovPlayer] = useState(false);
  const [povFile, setPovFile] = useState<any>(null);

  const projectService = useRef(ProjectService.getInstance());
  const povExportService = useRef(PovExportService.getInstance());

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading projects...');
      const projectService = await ProjectService.getInstance();
      const projects = await projectService.getProjectList();
      console.log('Projects loaded:', projects);
      setProjects(projects);
    } catch (error) {
      console.error('Error loading projects:', error);
      setError('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim()) {
      setError('Title is required');
      return;
    }

    try {
      console.log('Creating project with title:', newProjectTitle);
      const projectId = await projectService.current.createProject(
        newProjectTitle,
        newProjectDescription
      );
      console.log('Project created with ID:', projectId);
      
      setCreateDialogOpen(false);
      setNewProjectTitle('');
      setNewProjectDescription('');
      
      console.log('Reloading projects...');
      await loadProjects();
      
      console.log('Selecting new project...');
      onProjectSelect(projectId);
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await projectService.current.deleteProject(projectId);
      await loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Failed to delete project');
    }
  };

  const handleUpdateMetadata = async (updatedProject: ProjectMetadata) => {
    try {
      console.log('Updating project metadata:', updatedProject);
      const projectService = await ProjectService.getInstance();
      
      // Créer la structure correcte du projet pour la mise à jour
      const projectToUpdate = {
        projectId: updatedProject.projectId,
        scenario: {
          scenarioTitle: updatedProject.scenario?.scenarioTitle,
          description: updatedProject.scenario?.description
        }
      };
      
      console.log('Sending update with structure:', JSON.stringify(projectToUpdate, null, 2));
      await projectService.updateProjectMetadata(projectToUpdate);
      console.log('Metadata updated, reloading projects...');
      await loadProjects();
    } catch (error) {
      console.error('Error updating project metadata:', error);
      setError('Erreur lors de la mise à jour des métadonnées');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleCreateProject();
    }
  };

  const handleImportPov = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const povService = PovExportService.getInstance();
      const { nodes, edges } = await povService.importFromPovFile(file);
      
      // Créer un nouveau projet avec le scénario importé
      const projectService = ProjectService.getInstance();
      const projectId = await projectService.createProject(file.name.replace('.pov', ''));
      const project = await projectService.loadProject(projectId);
      
      if (project) {
        project.nodes = nodes;
        project.edges = edges;
        await projectService.saveProject(project);
        
        // setSnackbar({
        //   open: true,
        //   message: 'Projet importé avec succès',
        //   severity: 'success'
        // });
      }
    } catch (error) {
      console.error('Error importing POV:', error);
      // setSnackbar({
      //   open: true,
      //   message: 'Erreur lors de l\'import du projet',
      //   severity: 'error'
      // });
    }

    // Reset input
    event.target.value = '';
  }, []);

  const handlePlayScenario = async (project: ProjectMetadata) => {
    try {
      console.log('Loading project:', project.projectId);
      const fullProject = await projectService.current.loadProject(project.projectId);
      if (!fullProject) {
        throw new Error('Projet non trouvé');
      }
      
      console.log('Project loaded:', fullProject);
      const povFile = await povExportService.current.exportScenario(
        fullProject.scenario?.scenarioTitle || 'Sans titre',
        fullProject.nodes || [],
        fullProject.edges || []
      );
      console.log('POV file created:', povFile);

      setPovFile(povFile);
      setShowPovPlayer(true);
    } catch (error) {
      console.error('Error playing scenario:', error);
      setError('Erreur lors du lancement du scénario');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* PovPlayer Modal */}
      {showPovPlayer && povFile && (
        <PovPlayer
          scenario={povFile}
          onClose={() => {
            setShowPovPlayer(false);
            setPovFile(null);
          }}
        />
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Bibliothèque de Projets
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setCreateDialogOpen(true)}
          startIcon={<AddIcon />}
        >
          Nouveau Projet
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
          {projects.map((project) => (
            <Card key={project.projectId} sx={{ display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div" gutterBottom>
                  {project.scenario?.scenarioTitle || 'Sans titre'}
                </Typography>
                {project.scenario?.description && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {project.scenario.description}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" display="block">
                  Créé le: {new Date(project.createdAt).toLocaleDateString()}
                </Typography>
                {project.updatedAt && project.updatedAt !== project.createdAt && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Modifié le: {new Date(project.updatedAt).toLocaleDateString()}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <IconButton
                  size="small"
                  onClick={() => handlePlayScenario(project)}
                  title="Lancer le scénario"
                >
                  <PlayArrowIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onProjectSelect(project.projectId)}
                  title="Ouvrir"
                >
                  <OpenInNewIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setEditingProject(project)}
                  title="Modifier les métadonnées"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteProject(project.projectId)}
                  title="Supprimer"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Scenario</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            error={error === 'Title is required'}
            helperText={error === 'Title is required' ? 'Title is required' : ''}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateProject} 
            variant="contained" 
            color="primary"
            disabled={!newProjectTitle.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {editingProject && (
        <ProjectMetadataDialog
          open={!!editingProject}
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSave={handleUpdateMetadata}
        />
      )}
    </Container>
  );
};

export default ProjectLibrary;
