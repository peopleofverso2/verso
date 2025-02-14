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
  Settings as SettingsIcon
} from '@mui/icons-material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { ProjectService } from '../../services/projectService';
import { ProjectMetadata } from '../../types/project';
import ProjectList from '../ProjectList/ProjectList';
import { PovExportService } from '../../services/povExportService';
import PovPlayer from '../Player/PovPlayer';
import { MediaLibraryService } from '../../services/mediaLibraryService';
import { LoginButton } from '../Auth/LoginButton';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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

const ProjectLibrary: React.FC<ProjectLibraryProps> = ({ onProjectSelect, onProjectDelete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const [mediaLibrary, setMediaLibrary] = useState<MediaLibraryService | null>(null);

  useEffect(() => {
    MediaLibraryService.getInstance().then(setMediaLibrary);
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
      const projects = await projectService.current.getProjectList();
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
      onProjectSelect(projectId);
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
      }
    } catch (error) {
      console.error('Error importing POV:', error);
      setError('Erreur lors de l\'import du fichier POV');
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

      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Verso Project Library
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <IconButton
              color="inherit"
              onClick={() => navigate('/settings')}
              title="Settings"
            >
              <SettingsIcon />
            </IconButton>
            <LoginButton />
          </Box>
        </Toolbar>
      </AppBar>

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
            <Card 
              key={project.projectId} 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                position: 'relative',
                minHeight: '200px',
                backgroundImage: project.scenario?.coverImage ? 
                  `url(${mediaUrls[project.scenario.coverImage] || ''})` : 
                  'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                '&::before': project.scenario?.coverImage ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  zIndex: 1
                } : {}
              }}
            >
              <CardContent sx={{ 
                flexGrow: 1,
                position: 'relative',
                zIndex: 2,
                color: project.scenario?.coverImage ? 'white' : 'inherit'
              }}>
                <Typography variant="h6" component="div" gutterBottom>
                  {project.scenario?.scenarioTitle || 'Sans titre'}
                </Typography>
                {project.scenario?.description && (
                  <Typography 
                    variant="body2" 
                    color={project.scenario?.coverImage ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'} 
                    gutterBottom
                  >
                    {project.scenario.description}
                  </Typography>
                )}
                <Typography 
                  variant="caption" 
                  color={project.scenario?.coverImage ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'} 
                  display="block"
                >
                  Créé le: {new Date(project.createdAt).toLocaleDateString()}
                </Typography>
                {project.updatedAt && project.updatedAt !== project.createdAt && (
                  <Typography 
                    variant="caption" 
                    color={project.scenario?.coverImage ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'} 
                    display="block"
                  >
                    Modifié le: {new Date(project.updatedAt).toLocaleDateString()}
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ position: 'relative', zIndex: 2 }}>
                <IconButton
                  size="small"
                  onClick={() => handlePlayScenario(project)}
                  title="Lancer le scénario"
                  sx={{ color: project.scenario?.coverImage ? 'white' : 'inherit' }}
                >
                  <PlayArrowIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onProjectSelect(project.projectId)}
                  title="Ouvrir"
                  sx={{ color: project.scenario?.coverImage ? 'white' : 'inherit' }}
                >
                  <OpenInNewIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setEditingProject(project)}
                  title="Modifier les métadonnées"
                  sx={{ color: project.scenario?.coverImage ? 'white' : 'inherit' }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  component="label"
                  title="Changer l'image de couverture"
                  sx={{ color: project.scenario?.coverImage ? 'white' : 'inherit' }}
                >
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleCoverImageChange(e, project)}
                  />
                  <ImageIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteProject(project.projectId)}
                  title="Supprimer"
                  sx={{ color: project.scenario?.coverImage ? 'white' : 'inherit' }}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
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

export default ProjectLibrary;
