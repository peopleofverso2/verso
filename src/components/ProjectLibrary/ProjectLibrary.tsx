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
  Chip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  OpenInNew as OpenInNewIcon,
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
  onEdit: () => void;
}> = ({ project, onSelect, onDelete, onPlay, onImageChange, onEdit }) => {
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
      position: 'relative',
      transition: 'box-shadow 0.2s',
      '&:hover': {
        boxShadow: 6
      }
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
            sx={{ 
              objectFit: 'cover',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)'
              }
            }}
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
            mb: 1
          }}>
            {project.scenario.description}
          </Typography>
        )}
        {project.scenario?.tags && project.scenario.tags.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 0.5,
            mt: 'auto'
          }}>
            {project.scenario.tags.map((tag) => (
              <Chip
                key={tag}
                label={`#${tag}`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ 
                  height: 24,
                  '& .MuiChip-label': {
                    px: 1,
                    fontSize: '0.75rem'
                  }
                }}
              />
            ))}
          </Box>
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
          title="Ouvrir"
        >
          <OpenInNewIcon />
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
        <IconButton 
          size="small" 
          onClick={onEdit}
          color="primary"
          title="Éditer"
        >
          <EditIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

const ProjectLibrary: React.FC<ProjectLibraryProps> = ({
  onProjectSelect,
  onProjectDelete
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<ProjectMetadata | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectTags, setNewProjectTags] = useState<string[]>([]);
  const [projectsList, setProjectsList] = useState<ProjectMetadata[]>([]);
  const [uiError, setUiError] = useState<string | null>(null);
  const [povFile, setPovFile] = useState<any>(null);
  const [showPovPlayer, setShowPovPlayer] = useState(false);

  const {
    projects,
    loading,
    error,
    createProject,
    updateProjectMetadata,
    deleteProject
  } = useProjectManager();

  // Synchroniser les projets avec le state local
  useEffect(() => {
    setProjectsList(projects);
  }, [projects]);

  const projectService = useRef(ProjectService.getInstance());
  const mediaLibraryRef = useRef<MediaLibraryService | null>(null);

  const handleCreateProject = async () => {
    try {
      const projectId = await createProject({
        scenarioTitle: newProjectTitle,
        description: newProjectDescription,
        tags: newProjectTags
      });
      setCreateDialogOpen(false);
      setNewProjectTitle('');
      setNewProjectDescription('');
      setNewProjectTags([]);
      onProjectSelect(projectId);
    } catch (error) {
      console.error('Error creating project:', error);
      setUiError('Erreur lors de la création du projet');
    }
  };

  const handleAddTag = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && tagInput.trim()) {
      const newTag = tagInput.trim().toLowerCase();
      if (!newProjectTags.includes(newTag)) {
        setNewProjectTags([...newProjectTags, newTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewProjectTags(newProjectTags.filter(tag => tag !== tagToRemove));
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
      
      // S'assurer que les nœuds et les arêtes existent
      const nodes = fullProject.nodes || [];
      const edges = fullProject.edges || [];
      
      console.log('Exporting scenario with:', { 
        title: fullProject.scenario?.scenarioTitle,
        nodesCount: nodes.length,
        edgesCount: edges.length
      });

      // Exporter le scénario
      const povFile = await povExportService.exportScenario(
        fullProject.scenario?.scenarioTitle || 'Sans titre',
        nodes,
        edges
      );

      console.log('POV file created:', povFile);

      // Vérifier que le povFile a la bonne structure
      if (!povFile || !povFile.nodes || !Array.isArray(povFile.nodes)) {
        throw new Error('Format de scénario invalide');
      }

      setPovFile(povFile);
      setShowPovPlayer(true);
    } catch (error) {
      console.error('Error playing scenario:', error);
      setUiError('Erreur lors du lancement du scénario');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject(projectToDelete);
      setProjectsList(projectsList.filter(p => p.projectId !== projectToDelete));
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      setUiError('Erreur lors de la suppression du projet');
    }
  };

  const handleDeleteRequest = (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const handleEditRequest = (project: ProjectMetadata) => {
    setProjectToEdit(project);
    setEditTitle(project.scenario?.scenarioTitle || '');
    setEditDescription(project.scenario?.description || '');
    setEditTags(project.scenario?.tags || []);
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!projectToEdit) return;

    try {
      const updatedMetadata = {
        ...projectToEdit,
        scenario: {
          ...projectToEdit.scenario,
          scenarioTitle: editTitle,
          description: editDescription,
          tags: editTags
        }
      };

      await updateProjectMetadata(projectToEdit.projectId, updatedMetadata);

      // Mettre à jour la liste locale
      setProjectsList(projectsList.map(p => 
        p.projectId === projectToEdit.projectId ? updatedMetadata : p
      ));

      setEditDialogOpen(false);
      setProjectToEdit(null);
    } catch (error) {
      console.error('Error updating project:', error);
      setUiError('Erreur lors de la mise à jour du projet');
    }
  };

  const handleTagAdd = (event: React.KeyboardEvent<HTMLInputElement>, isEdit: boolean) => {
    if (event.key === 'Enter' && tagInput.trim()) {
      const newTag = tagInput.trim().toLowerCase();
      if (isEdit) {
        if (!editTags.includes(newTag)) {
          setEditTags([...editTags, newTag]);
        }
      } else {
        if (!newProjectTags.includes(newTag)) {
          setNewProjectTags([...newProjectTags, newTag]);
        }
      }
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string, isEdit: boolean) => {
    if (isEdit) {
      setEditTags(editTags.filter(tag => tag !== tagToRemove));
    } else {
      setNewProjectTags(newProjectTags.filter(tag => tag !== tagToRemove));
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
                onDelete={() => handleDeleteRequest(project.projectId)}
                onPlay={() => handlePlayScenario(project)}
                onImageChange={(e) => handleCoverImageChange(e, project.projectId)}
                onEdit={() => handleEditRequest(project)}
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
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Ajouter des hashtags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => handleTagAdd(e, false)}
              helperText="Appuyez sur Entrée pour ajouter un hashtag"
            />
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1,
              mt: 1 
            }}>
              {newProjectTags.map((tag) => (
                <Chip
                  key={tag}
                  label={`#${tag}`}
                  onDelete={() => handleTagRemove(tag, false)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreateDialogOpen(false);
            setNewProjectTitle('');
            setNewProjectDescription('');
            setNewProjectTags([]);
          }}>
            Annuler
          </Button>
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

      {/* Dialogue d'édition */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => {
          setEditDialogOpen(false);
          setProjectToEdit(null);
        }}
      >
        <DialogTitle>Modifier le projet</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Titre du projet"
            fullWidth
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Ajouter des hashtags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => handleTagAdd(e, true)}
              helperText="Appuyez sur Entrée pour ajouter un hashtag"
            />
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1,
              mt: 1 
            }}>
              {editTags.map((tag) => (
                <Chip
                  key={tag}
                  label={`#${tag}`}
                  onDelete={() => handleTagRemove(tag, true)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditDialogOpen(false);
            setProjectToEdit(null);
          }}>
            Annuler
          </Button>
          <Button 
            onClick={handleEditSave}
            variant="contained" 
            color="primary"
            disabled={!editTitle.trim()}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setProjectToDelete(null);
        }}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              setProjectToDelete(null);
            }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lecteur POV */}
      {showPovPlayer && povFile && (
        <PovPlayer
          scenario={povFile}
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
