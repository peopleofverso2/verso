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
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import DeleteIcon from '@mui/icons-material/Delete';
import { MediaFile, MediaMetadata } from '../../types/media';
import { MediaLibraryService } from '../../services/MediaLibraryService';

// Catégories principales
const CATEGORIES = [
  'Personnages',
  'Décors',
  'Accessoires',
  'Ambiance',
  'Sons & Musiques',
] as const;

// Sous-catégories
const SUB_CATEGORIES: Record<typeof CATEGORIES[number], string[]> = {
  'Personnages': ['Protagonistes', 'Antagonistes', 'Secondaires'],
  'Décors': ['Urbains', 'Nature', 'Intérieurs', 'Futuristes'],
  'Accessoires': ['Armes', 'Véhicules', 'Objets Quotidiens', 'Technologies'],
  'Ambiance': ['Jour', 'Nuit', 'Aube/Crépuscule', 'Météo'],
  'Sons & Musiques': ['Ambiance', 'Effets Sonores', 'Musique', 'Voix'],
};

interface MoodboardItem extends MediaFile {
  category: typeof CATEGORIES[number];
  subCategory: string;
}

export const MoodboardCanvas: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number] | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [items, setItems] = useState<MoodboardItem[]>([]);

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
          tags: selectedCategory ? [selectedCategory, selectedSubCategory || ''] : [],
        };

        const savedMedia = await mediaLibrary.saveMedia(file, metadata);
        
        if (selectedCategory) {
          setItems(prev => [...prev, {
            ...savedMedia,
            category: selectedCategory,
            subCategory: selectedSubCategory || '',
          }]);
        }
      } catch (error) {
        console.error('Error saving media:', error);
      }
    }
  }, [selectedCategory, selectedSubCategory]);

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

  const filteredItems = items.filter(item => 
    (!selectedCategory || item.category === selectedCategory) &&
    (!selectedSubCategory || item.subCategory === selectedSubCategory)
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Mood Board
      </Typography>

      {/* Catégories principales */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {CATEGORIES.map(category => (
          <Chip
            key={category}
            label={category}
            onClick={() => {
              setSelectedCategory(category);
              setSelectedSubCategory(null);
            }}
            color={selectedCategory === category ? 'primary' : 'default'}
          />
        ))}
      </Box>

      {/* Sous-catégories */}
      {selectedCategory && (
        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {SUB_CATEGORIES[selectedCategory].map(subCategory => (
            <Chip
              key={subCategory}
              label={subCategory}
              onClick={() => setSelectedSubCategory(subCategory)}
              color={selectedSubCategory === subCategory ? 'secondary' : 'default'}
              variant="outlined"
            />
          ))}
        </Box>
      )}

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
                  {item.category} - {item.subCategory}
                </Typography>
              </CardContent>
              <CardActions>
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
