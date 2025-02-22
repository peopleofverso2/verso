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
  CircularProgress,
  AppBar,
  Toolbar
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
  Image as ImageIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { ProjectService } from '../../services/projectService';
import { ProjectMetadata } from '../../types/project';
import ProjectList from '../ProjectList/ProjectList';
import { PovExportService } from '../../services/povExportService';
import PovPlayer from '../Player/PovPlayer';
import { MediaLibraryService } from '../../services/mediaLibraryService';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../ProjectList/ProjectCard';

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

export const ProjectLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { user, signInWithGoogle, signOut } = useAuth();
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [editingProject, setEditingProject] = useState<ProjectMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPovPlayer, setShowPovPlayer] = useState(false);
  const [povFile, setPovFile] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectMetadata | null>(null);
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [povPlayerOpen, setPovPlayerOpen] = useState(false);
  const [povScenario, setPovScenario] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const projectService = useRef(ProjectService.getInstance());
  const povExportService = useRef(PovExportService.getInstance());

  const [mediaLibrary, setMediaLibrary] = useState<MediaLibraryService | null>(null);

  useEffect(() => {
    const initMediaLibrary = async () => {
      try {
        const service = MediaLibraryService.getInstance();
        await service.initialize();
        setMediaLibrary(service);
      } catch (error) {
        console.error('Error initializing media library:', error);
      }
    };
    
    initMediaLibrary();
  }, []);

  const getMediaUrl = useCallback(async (mediaId: string) => {
    if (!mediaLibrary) return '';
    try {
      const media = await mediaLibrary.getMedia(mediaId);
      return media.url;
    } catch (error) {
      console.error('Error getting media URL:', error);
      return '';
    }
  }, [mediaLibrary]);

  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    projects.forEach(async (project) => {
      if (project.scenario?.coverImage && !mediaUrls[project.scenario.coverImage]) {
        const url = await getMediaUrl(project.scenario.coverImage);
        setMediaUrls(prev => ({
          ...prev,
          [project.scenario.coverImage]: url
        }));
      }
    });
  }, [projects, getMediaUrl]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading projects...');
      const projectService = ProjectService.getInstance();
      const projects = await projectService.getProjectList();
      console.log('Projects loaded:', projects);
      setProjects(projects.map(project => ({
        projectId: project.projectId,
        scenario: {
          scenarioTitle: project.scenario?.scenarioTitle || 'Sans titre',
          povTitle: project.scenario?.povTitle,
          description: project.scenario?.description || ''
        },
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        minimap: project.minimap
      })));
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
      setError('Le titre est requis');
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
      navigate(`/editor/${projectId}`);
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Erreur lors de la création du projet');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await projectService.current.deleteProject(projectId);
      await loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Erreur lors de la suppression du projet');
    }
  };

  const handleUpdateMetadata = async (updatedProject: ProjectMetadata) => {
    try {
      console.log('Updating project metadata:', updatedProject);
      
      // Créer la structure correcte du projet pour la mise à jour
      const projectToUpdate = {
        projectId: updatedProject.projectId,
        scenario: {
          scenarioTitle: updatedProject.scenario?.scenarioTitle,
          description: updatedProject.scenario?.description
        }
      };
      
      console.log('Sending update with structure:', projectToUpdate);
      await projectService.current.updateProjectMetadata(projectToUpdate);
      console.log('Metadata updated, reloading projects...');
      await loadProjects();
    } catch (error) {
      console.error('Error updating project metadata:', error);
      setError('Erreur lors de la mise à jour des métadonnées');
    }
  };

  const handleUpdateCoverImage = async (project: ProjectMetadata, file: File) => {
    try {
      setError(null);
      
      if (!mediaLibrary) {
        throw new Error('MediaLibraryService not initialized');
      }

      // Vérifier le type et la taille du fichier
      if (!file.type.startsWith('image/')) {
        setError('Le fichier doit être une image');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        setError('L\'image ne doit pas dépasser 5MB');
        return;
      }

      // Créer les métadonnées du média
      const mediaMetadata: MediaMetadata = {
        id: `project-cover-${project.projectId}`,
        type: 'image',
        mimeType: file.type,
        name: file.name,
        size: file.size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['project-cover']
      };

      // Stocker l'image via MediaLibraryService
      const mediaFile = await mediaLibrary.uploadMedia(file, mediaMetadata);
      
      // Mettre à jour les métadonnées du projet
      const updatedProject = {
        ...project,
        scenario: {
          ...project.scenario,
          coverImage: mediaFile.id
        }
      };
      
      await projectService.current.updateProjectMetadata(updatedProject);
      await loadProjects();
    } catch (error) {
      console.error('Error updating cover image:', error);
      setError('Erreur lors de la mise à jour de l\'image de couverture');
    }
  };

  const handleCoverImageChange = async (event: React.ChangeEvent<HTMLInputElement>, project: ProjectMetadata) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleUpdateCoverImage(project, file);
    }
    event.target.value = '';
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleCreateProject();
    }
  };

  const handleImportPov = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      
      // Importer le fichier POV
      const povService = PovExportService.getInstance();
      const { nodes, edges, scenario } = await povService.importFromPovFile(file);
      
      // Créer un nouveau projet avec les données importées
      const projectId = await projectService.current.createProject(
        scenario.scenarioTitle || 'Projet importé',
        scenario.description || ''
      );
      
      // Mettre à jour le projet avec les nœuds et les arêtes
      const project = await projectService.current.loadProject(projectId);
      const updatedProject = {
        ...project,
        nodes,
        edges,
        scenario: {
          ...project.scenario,
          ...scenario
        }
      };
      
      await projectService.current.saveProject(updatedProject);
      
      // Recharger la liste des projets
      await loadProjects();
      
      setSnackbar({
        open: true,
        message: 'Projet importé avec succès',
        severity: 'success'
      });
      
      // Rediriger vers l'éditeur
      navigate(`/editor/${projectId}`);
    } catch (error) {
      console.error('Error importing POV:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'import du fichier POV');
      setSnackbar({
        open: true,
        message: 'Erreur lors de l\'import du fichier POV',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

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

  const handleProjectSelect = (projectId: string) => {
    navigate(`/editor/${projectId}`);
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

      <AppBar position="static" color="default">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Verso Project Library
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={() => navigate('/settings')}
              sx={{ mr: 1 }}
            >
              <SettingsIcon />
            </IconButton>
            {user ? (
              <Button
                variant="outlined"
                onClick={signOut}
                startIcon={<LogoutIcon />}
              >
                Se déconnecter
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={signInWithGoogle}
                startIcon={<LoginIcon />}
              >
                Se connecter
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Bibliothèque de Projets
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Nouveau projet
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => fileInputRef.current?.click()}
          >
            Importer un POV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pov"
            style={{ display: 'none' }}
            onChange={handleImportPov}
          />
        </Box>
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
            <ProjectCard
              key={project.projectId}
              project={project}
              onProjectSelect={() => navigate(`/editor/${project.projectId}`)}
              onProjectDelete={handleDeleteProject}
            />
          ))}
        </Box>
      )}

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Nouveau Projet</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Titre"
            fullWidth
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            error={error === 'Le titre est requis'}
            helperText={error === 'Le titre est requis' ? 'Le titre est requis' : ''}
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
          <Button onClick={() => setCreateDialogOpen(false)}>Annuler</Button>
          <Button 
            onClick={handleCreateProject} 
            variant="contained" 
            color="primary"
            disabled={!newProjectTitle.trim()}
          >
            Créer
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
