import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton,
  TextField,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Divider,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useWorkspace } from '../Navigation/WorkspaceContext';
import { MediaLibraryService } from '../../services/MediaLibraryService';
import { MediaMetadata } from '../../types/media';

interface StoryboardScene {
  id: string;
  title: string;
  description: string;
  mediaId?: string;
  order: number;
}

const StoryboardContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  display: 'flex',
  gap: theme.spacing(2),
  overflow: 'auto'
}));

const SceneColumn = styled(Box)(({ theme }) => ({
  minWidth: '300px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}));

const SceneCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isdragging'
})<{ isdragging?: boolean }>(({ theme, isdragging }) => ({
  position: 'relative',
  transition: 'all 0.2s ease-in-out',
  cursor: 'grab',
  ...(isdragging && {
    opacity: 0.5,
    transform: 'scale(1.02)',
    cursor: 'grabbing'
  }),
  '&:hover': {
    boxShadow: theme.shadows[8]
  },
  '&:hover .scene-actions': {
    opacity: 1
  }
}));

const SceneActions = styled(CardActions)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  opacity: 0,
  transition: 'opacity 0.2s ease-in-out',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  padding: theme.spacing(0.5),
  zIndex: 2
}));

const DragHandle = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: theme.spacing(1),
  top: '50%',
  transform: 'translateY(-50%)',
  cursor: 'grab',
  color: theme.palette.text.secondary,
  opacity: 0.5,
  transition: 'opacity 0.2s ease-in-out',
  '&:hover': {
    opacity: 1
  }
}));

const MediaDropZone = styled(Box)(({ theme }) => ({
  height: '150px',
  backgroundColor: theme.palette.action.hover,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.shape.borderRadius,
  border: `2px dashed ${theme.palette.divider}`,
  marginBottom: theme.spacing(2),
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.action.selected
  }
}));

const AddSceneCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  border: `2px dashed ${theme.palette.divider}`,
  backgroundColor: 'transparent',
  minHeight: '100px',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.primary.main
  }
}));

export const Storyboard: React.FC = () => {
  const { state } = useWorkspace();
  const [scenes, setScenes] = useState<StoryboardScene[]>([]);
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);
  const [sceneMedia, setSceneMedia] = useState<Record<string, MediaMetadata>>({});
  const mediaLibrary = MediaLibraryService.getInstance();

  useEffect(() => {
    // Charger les médias pour chaque scène
    const loadSceneMedia = async () => {
      const mediaMap: Record<string, MediaMetadata> = {};
      for (const scene of scenes) {
        if (scene.mediaId) {
          try {
            const media = await mediaLibrary.getMediaById(scene.mediaId);
            if (media) {
              mediaMap[scene.id] = media.metadata;
            }
          } catch (error) {
            console.error(`Erreur lors du chargement du média pour la scène ${scene.id}:`, error);
          }
        }
      }
      setSceneMedia(mediaMap);
    };

    loadSceneMedia();
  }, [scenes]);

  const handleAddScene = () => {
    const newScene: StoryboardScene = {
      id: Date.now().toString(),
      title: 'Nouvelle scène',
      description: '',
      order: scenes.length
    };
    setScenes([...scenes, newScene]);
  };

  const handleDeleteScene = (sceneId: string) => {
    setScenes(scenes.filter(scene => scene.id !== sceneId));
  };

  const handleSceneChange = (sceneId: string, field: keyof StoryboardScene, value: string) => {
    setScenes(scenes.map(scene => 
      scene.id === sceneId ? { ...scene, [field]: value } : scene
    ));
  };

  const handleDragStart = (e: React.DragEvent, sceneId: string) => {
    setDraggedSceneId(sceneId);
    e.dataTransfer.setData('text/plain', sceneId);
  };

  const handleDragEnd = () => {
    setDraggedSceneId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    
    // Gestion du drop d'une image
    if (e.dataTransfer.types.includes('Files')) {
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          try {
            const metadata = await mediaLibrary.uploadMedia(file);
            setScenes(scenes.map(scene =>
              scene.id === targetId ? { ...scene, mediaId: metadata.id } : scene
            ));
            break; // Ne prendre que la première image
          } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'image:', error);
          }
        }
      }
      return;
    }

    // Gestion du réarrangement des scènes
    const sourceScene = scenes.find(s => s.id === sourceId);
    const targetScene = scenes.find(s => s.id === targetId);
    
    if (sourceScene && targetScene) {
      const newScenes = scenes.map(scene => {
        if (scene.id === sourceId) {
          return { ...scene, order: targetScene.order };
        }
        if (scene.id === targetId) {
          return { ...scene, order: sourceScene.order };
        }
        return scene;
      });
      
      setScenes(newScenes.sort((a, b) => a.order - b.order));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <StoryboardContainer>
      <SceneColumn>
        {scenes.map((scene) => (
          <SceneCard
            key={scene.id}
            isdragging={draggedSceneId === scene.id}
            draggable
            onDragStart={(e) => handleDragStart(e, scene.id)}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, scene.id)}
            onDragOver={handleDragOver}
          >
            <DragHandle>
              <DragIndicatorIcon />
            </DragHandle>
            
            {sceneMedia[scene.id] ? (
              <CardMedia
                component="img"
                height="150"
                image={sceneMedia[scene.id].url}
                alt={scene.title}
              />
            ) : (
              <MediaDropZone
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, scene.id)}
              >
                <ImageIcon sx={{ fontSize: 40, opacity: 0.5 }} />
              </MediaDropZone>
            )}

            <CardContent sx={{ pt: 1 }}>
              <TextField
                fullWidth
                variant="standard"
                label="Titre"
                value={scene.title}
                onChange={(e) => handleSceneChange(scene.id, 'title', e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                variant="standard"
                label="Description"
                value={scene.description}
                onChange={(e) => handleSceneChange(scene.id, 'description', e.target.value)}
                margin="normal"
              />
            </CardContent>

            <SceneActions className="scene-actions">
              <Tooltip title="Supprimer la scène">
                <IconButton
                  size="small"
                  onClick={() => handleDeleteScene(scene.id)}
                  sx={{ color: 'white' }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </SceneActions>

            <Divider sx={{ my: 1 }} />
            
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ px: 2, pb: 1, display: 'block' }}
            >
              {`Scène ${scene.order + 1}`}
            </Typography>
          </SceneCard>
        ))}
        
        <AddSceneCard onClick={handleAddScene}>
          <IconButton>
            <AddIcon />
          </IconButton>
          <Typography variant="caption">
            Ajouter une scène
          </Typography>
        </AddSceneCard>
      </SceneColumn>
    </StoryboardContainer>
  );
};
