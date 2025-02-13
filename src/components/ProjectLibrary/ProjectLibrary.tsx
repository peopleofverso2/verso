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
  IconButton,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Grid,
  Skeleton,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  PlayArrow as PlayArrowIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { ProjectMetadata } from '../../types/project';
import { useProjectManager } from '../../hooks/useProjectManager';
import { MediaLibraryService } from '../../services/mediaLibraryService';
import { ProjectService } from '../../services/projectService';
import { PovExportService } from '../../services/povExportService';
import PovPlayer from '../Player/PovPlayer';

interface ProjectLibraryProps {
  onProjectSelect: (projectId: string) => void;
  onProjectDelete?: (projectId: string) => void;
}

const ProjectCard: React.FC<{ 
  project: ProjectMetadata; 
  onSelect: () => void;
  onDelete?: () => void;
  onPlay: () => void;
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ project, onSelect, onDelete, onPlay, onImageChange }) => {
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const mediaLibraryRef = useRef<MediaLibraryService | null>(null);

  useEffect(() => {
    const loadCoverImage = async () => {
      setLoading(true);
      try {
        if (!mediaLibraryRef.current) {
          mediaLibraryRef.current = await MediaLibraryService.getInstance();
        }

        if (project?.scenario?.coverImageId) {
          console.log('Loading cover image:', project.scenario.coverImageId);
          const media = await mediaLibraryRef.current.getMedia(project.scenario.coverImageId);
          if (media) {
            console.log('Cover image loaded:', media);
            setCoverUrl(media.url);
          }
        } else {
          setCoverUrl('');
        }
      } catch (error) {
        console.error('Error loading cover image:', error);
        setCoverUrl('');
      }
      setLoading(false);
    };

    loadCoverImage();
  }, [project?.scenario?.coverImageId]);

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative'
    }}>
      {loading ? (
        <Skeleton 
          variant="rectangular" 
          width="100%" 
          height={200}
          animation="wave"
        />
      ) : (
        coverUrl ? (
          <CardMedia
            component="img"
            height={200}
            image={coverUrl}
            alt={project.scenario?.scenarioTitle || 'Cover image'}
            sx={{ objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={{
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.100'
            }}
          >
            <ImageIcon sx={{ fontSize: 60, color: 'grey.400' }} />
          </Box>
        )
      )}

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h2" gutterBottom noWrap>
          {project.scenario?.scenarioTitle || 'Sans titre'}
        </Typography>
        {project.scenario?.description && (
          <Typography variant="body2" color="text.secondary" sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {project.scenario.description}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
        <IconButton 
          size="small" 
          component="label"
          color="primary"
          title="Changer l'image"
        >
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={onImageChange}
          />
          <ImageIcon />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={onSelect}
          color="primary"
          title="Éditer"
        >
          <EditIcon />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={onPlay}
          color="primary"
          title="Lancer"
        >
          <PlayArrowIcon />
        </IconButton>
        {onDelete && (
          <IconButton 
            size="small" 
            onClick={onDelete}
            color="error"
            title="Supprimer"
          >
            <DeleteIcon />
          </IconButton>
        )}
      </CardActions>
    </Card>
  );
};

const ProjectLibrary: React.FC<ProjectLibraryProps> = ({
  onProjectSelect,
  onProjectDelete
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [showPovPlayer, setShowPovPlayer] = useState(false);
  const [povFile, setPovFile] = useState<any>(null);
  const [uiError, setUiError] = useState<string | null>(null);
  const [projectsList, setProjectsList] = useState<ProjectMetadata[]>([]);

  const {
    projects,
    loading,
    error,
    createProject,
    updateProjectMetadata
  } = useProjectManager();

  // Synchroniser les projets avec le state local
  useEffect(() => {
    setProjectsList(projects);
  }, [projects]);

  const projectService = useRef(ProjectService.getInstance());
  const mediaLibraryRef = useRef<MediaLibraryService | null>(null);

  const handleCreateProject = async () => {
    try {
      const projectId = await createProject(newProjectTitle, newProjectDescription);
      setCreateDialogOpen(false);
      setNewProjectTitle('');
      setNewProjectDescription('');
      onProjectSelect(projectId);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleUpdateCoverImage = async (projectId: string, file: File) => {
    try {
      console.log('Updating cover image for project:', projectId, file);
      setUiError(null);
      
      if (!mediaLibraryRef.current) {
        mediaLibraryRef.current = await MediaLibraryService.getInstance();
      }

      // Vérifier le type et la taille du fichier
      if (!file.type.startsWith('image/')) {
        throw new Error('Le fichier doit être une image');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB max
        throw new Error('L\'image ne doit pas dépasser 5MB');
      }

      // Créer les métadonnées du média
      const mediaMetadata = {
        type: 'image' as const,
        mimeType: file.type,
        name: file.name,
        size: file.size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['cover'],
      };

      console.log('Uploading media with metadata:', mediaMetadata);
      
      // Stocker l'image via MediaLibraryService
      const mediaFile = await mediaLibraryRef.current.uploadMedia(file, mediaMetadata);
      console.log('Media uploaded:', mediaFile);

      // Charger le projet existant pour préserver toutes les données
      const currentProject = await projectService.current.loadProject(projectId);
      if (!currentProject) {
        throw new Error('Projet non trouvé');
      }

      // Créer une copie complète du projet avec les nouvelles métadonnées
      const updatedMetadata: Partial<ProjectMetadata> = {
        ...currentProject,
        scenario: {
          ...currentProject.scenario,
          coverImageId: mediaFile.metadata.id,
          // Préserver les autres données du scénario si elles existent
          title: currentProject.scenario?.title || '',
          description: currentProject.scenario?.description || '',
          thumbnails: currentProject.scenario?.thumbnails || [],
          // Si d'autres champs existent dans le scénario, ils seront préservés par le spread operator
        }
      };

      console.log('Updating project metadata:', updatedMetadata);
      await updateProjectMetadata(projectId, updatedMetadata);
      console.log('Project metadata updated successfully');

      // Forcer le rechargement de l'image
      const project = await projectService.current.loadProject(projectId);
      if (project) {
        const updatedProjects = projectsList.map(p => 
          p.projectId === projectId ? project : p
        );
        setProjectsList(updatedProjects);
      }

    } catch (error) {
      console.error('Error updating cover image:', error);
      setUiError(error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'image de couverture');
    }
  };

  const handleCoverImageChange = async (event: React.ChangeEvent<HTMLInputElement>, projectId: string) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleUpdateCoverImage(projectId, file);
    }
    event.target.value = '';
  };

  const handlePlayScenario = async (project: ProjectMetadata) => {
    try {
      console.log('Loading project:', project.projectId);
      // Charger le projet complet
      const fullProject = await projectService.current.loadProject(project.projectId);
      if (!fullProject) {
        throw new Error('Projet non trouvé');
      }

      // Créer une instance de PovExportService
      const povExportService = PovExportService.getInstance();
      
      // Exporter le scénario
      const povFile = await povExportService.exportScenario(
        fullProject.scenario?.scenarioTitle || 'Sans titre',
        fullProject.nodes || [],
        fullProject.edges || []
      );

      // Convertir le povFile en format attendu par PovPlayer
      const scenario = {
        nodes: povFile.nodes || [],
        edges: povFile.edges || [],
        media: povFile.media || {}
      };

      setPovFile(scenario);
      setShowPovPlayer(true);
    } catch (error) {
      console.error('Error playing scenario:', error);
      setUiError('Erreur lors du lancement du scénario');
    }
  };

  return (
    <Box sx={{ 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default'
    }}>
      {/* Header avec le titre et les boutons */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="h5" component="h1">
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

      {/* Zone de scroll pour la grille de projets */}
      <Box sx={{ 
        flexGrow: 1,
        overflow: 'auto',
        p: 2
      }}>
        {/* Grille de projets */}
        <Grid container spacing={3}>
          {projectsList.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.projectId}>
              <ProjectCard
                project={project}
                onSelect={() => onProjectSelect(project.projectId)}
                onDelete={onProjectDelete ? () => onProjectDelete(project.projectId) : undefined}
                onPlay={() => handlePlayScenario(project)}
                onImageChange={(e) => handleCoverImageChange(e, project.projectId)}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Message d'erreur */}
      {uiError && (
        <Alert 
          severity="error" 
          sx={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)' }}
          onClose={() => setUiError(null)}
        >
          {uiError}
        </Alert>
      )}

      {/* Dialogue de création de projet */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Créer un nouveau projet</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Titre du projet"
            fullWidth
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleCreateProject} variant="contained" color="primary">
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lecteur POV */}
      {showPovPlayer && povFile && (
        <PovPlayer
          povFile={povFile}
          onClose={() => {
            setShowPovPlayer(false);
            setPovFile(null);
          }}
        />
      )}
    </Box>
  );
};

export default ProjectLibrary;
