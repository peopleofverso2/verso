import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Grid,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  TextField,
  Divider,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { MediaFile, MediaMetadata } from '../../types/media';
import { MediaLibraryService } from '../../services/MediaLibraryService';

// Types de contenu narratif
const STORY_ELEMENTS = [
  'Scènes',
  'Personnages',
  'Dialogues',
  'Narration',
  'Transitions',
] as const;

// Phases narratives
const STORY_PHASES = [
  'Exposition',
  'Développement',
  'Climax',
  'Dénouement',
  'Résolution',
] as const;

interface StoryItem extends MediaFile {
  element: typeof STORY_ELEMENTS[number];
  phase: typeof STORY_PHASES[number];
  description: string;
  order: number;
}

export const StorytellingCanvas: React.FC = () => {
  const [selectedElement, setSelectedElement] = useState<typeof STORY_ELEMENTS[number] | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<typeof STORY_PHASES[number] | null>(null);
  const [items, setItems] = useState<StoryItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const mediaLibrary = await MediaLibraryService.getInstance();
    
    for (const file of acceptedFiles) {
      try {
        const metadata: Partial<MediaMetadata> = {
          name: file.name,
          type: file.type.startsWith('video/') ? 'video' : 
                file.type.startsWith('audio/') ? 'audio' : 'image',
          mimeType: file.type,
          size: file.size,
          tags: [selectedElement || '', selectedPhase || ''],
        };

        const savedMedia = await mediaLibrary.saveMedia(file, metadata);
        
        if (selectedElement && selectedPhase) {
          setItems(prev => [...prev, {
            ...savedMedia,
            element: selectedElement,
            phase: selectedPhase,
            description: '',
            order: prev.length,
          }]);
        }
      } catch (error) {
        console.error('Error saving media:', error);
      }
    }
  }, [selectedElement, selectedPhase]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': [],
      'audio/*': [],
    }
  });

  const handleDelete = async (id: string) => {
    try {
      const mediaLibrary = await MediaLibraryService.getInstance();
      await mediaLibrary.deleteMedia(id);
      setItems(prev => prev.filter(item => item.metadata.id !== id));
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  };

  const handleEdit = (id: string) => {
    const item = items.find(i => i.metadata.id === id);
    if (item) {
      setDescription(item.description);
      setEditingId(id);
    }
  };

  const handleSaveDescription = (id: string) => {
    setItems(prev => prev.map(item => 
      item.metadata.id === id ? { ...item, description } : item
    ));
    setEditingId(null);
    setDescription('');
  };

  const filteredItems = items.filter(item => 
    (!selectedElement || item.element === selectedElement) &&
    (!selectedPhase || item.phase === selectedPhase)
  ).sort((a, b) => a.order - b.order);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Storytelling Board
      </Typography>

      {/* Éléments narratifs */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {STORY_ELEMENTS.map(element => (
          <Chip
            key={element}
            label={element}
            onClick={() => {
              setSelectedElement(element);
              setSelectedPhase(null);
            }}
            color={selectedElement === element ? 'primary' : 'default'}
          />
        ))}
      </Box>

      {/* Phases narratives */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {STORY_PHASES.map(phase => (
          <Chip
            key={phase}
            label={phase}
            onClick={() => setSelectedPhase(phase)}
            color={selectedPhase === phase ? 'secondary' : 'default'}
            variant="outlined"
          />
        ))}
      </Box>

      {/* Zone de drop */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          mb: 3,
          textAlign: 'center',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          cursor: 'pointer',
        }}
      >
        <input {...getInputProps()} />
        <Typography>
          {isDragActive
            ? 'Déposez les fichiers ici...'
            : 'Glissez et déposez des fichiers ici, ou cliquez pour sélectionner'}
        </Typography>
      </Paper>

      {/* Grille de médias */}
      <Grid container spacing={2}>
        {filteredItems.map(item => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.metadata.id}>
            <Card>
              {item.metadata.type === 'image' ? (
                <CardMedia
                  component="img"
                  height="140"
                  image={item.url}
                  alt={item.metadata.name}
                />
              ) : item.metadata.type === 'video' ? (
                <CardMedia
                  component="video"
                  height="140"
                  image={item.url}
                  title={item.metadata.name}
                  controls
                />
              ) : (
                <CardMedia
                  component="audio"
                  image={item.url}
                  title={item.metadata.name}
                  controls
                />
              )}
              <CardContent>
                <Typography variant="body2" noWrap>
                  {item.metadata.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {item.element} - {item.phase}
                </Typography>
                <Divider sx={{ my: 1 }} />
                {editingId === item.metadata.id ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => handleSaveDescription(item.metadata.id)}
                    placeholder="Description..."
                    size="small"
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {item.description || 'Aucune description'}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <IconButton
                  size="small"
                  onClick={() => handleEdit(item.metadata.id)}
                  aria-label="edit"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(item.metadata.id)}
                  aria-label="delete"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
