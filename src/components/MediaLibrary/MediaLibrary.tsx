import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Grid,
  Stack,
  TextField,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Alert,
  Typography,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Psychology as PsychologyIcon,
  Upload as UploadIcon,
  SelectAll as SelectAllIcon
} from '@mui/icons-material';
import { debounce } from 'lodash';
import MediaCard from './MediaCard';
import { MediaFile, MediaType, MediaLibraryProps } from '../../types/media';
import { MediaLibraryService } from '../../services/MediaLibraryService';
import { ImageAnalyzer } from '../../services/ai/ImageAnalyzer';

interface MediaLibraryProps {
  onSelect?: (mediaFiles: MediaFile[]) => void;
  multiSelect?: boolean;
  initialSelectedMedia?: MediaFile[];
  acceptedTypes?: string[];
}

export const ACCEPTED_TYPES = [
  'video/mp4',
  'video/webm',
  'image/jpeg',
  'image/png',
  'image/gif',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg'
];

const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onSelect,
  multiSelect = true,
  initialSelectedMedia = [],
  acceptedTypes = ACCEPTED_TYPES
}) => {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [filter, setFilter] = useState<MediaFilter>({});
  const [search, setSearch] = useState('');
  const [mediaType, setMediaType] = useState<MediaType | ''>('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(
    new Set(initialSelectedMedia.map(m => m.metadata.id))
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mediaLibraryService, setMediaLibraryService] = useState<MediaLibraryService | null>(null);
  const [styleFilter, setStyleFilter] = useState<string | null>(null);
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [filteredMedia, setFilteredMedia] = useState<MediaFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Initialiser le service au montage
  useEffect(() => {
    const initService = async () => {
      try {
        const service = await MediaLibraryService.getInstance();
        setMediaLibraryService(service);
      } catch (error) {
        console.error('Error initializing MediaLibraryService:', error);
        setError('Failed to initialize media library');
      }
    };
    initService();
  }, []);

  // Charger les médias au montage et quand le filtre change
  useEffect(() => {
    if (!mediaLibraryService) return;
    loadMedia();
  }, [filter, mediaType, selectedTags, mediaLibraryService]);

  // Charger les tags disponibles au montage
  useEffect(() => {
    if (!mediaLibraryService) return;
    loadAvailableTags();
  }, [mediaLibraryService]);

  const loadMedia = async () => {
    if (!mediaLibraryService) return;
    
    try {
      const updatedFilter: MediaFilter = {
        ...filter,
        type: mediaType === '' ? undefined : mediaType,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        search: search || undefined,
      };

      const mediaFiles = await mediaLibraryService.listMedia(updatedFilter);
      setMedia(mediaFiles);
    } catch (error) {
      console.error('Error loading media:', error);
      setError('Failed to load media');
    }
  };

  const loadAvailableTags = async () => {
    if (!mediaLibraryService) return;

    try {
      const allMedia = await mediaLibraryService.listMedia();
      const tags = new Set<string>();
      allMedia.forEach(media => {
        media.metadata.tags.forEach(tag => tags.add(tag));
      });
      setAvailableTags(Array.from(tags));
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const mediaLibraryService = await MediaLibraryService.getInstance();
      const uploadedFiles: MediaFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log('Uploading file:', file.name);
        
        try {
          const mediaFile = await mediaLibraryService.uploadMedia(file);
          uploadedFiles.push(mediaFile);
          console.log('File uploaded successfully:', mediaFile.metadata.id);
        } catch (error) {
          console.error('Error uploading file:', file.name, error);
          setError(`Erreur lors de l'upload de ${file.name}`);
        }
      }

      // Mettre à jour la liste des médias
      if (uploadedFiles.length > 0) {
        setMedia(prevMedia => [...prevMedia, ...uploadedFiles]);
        setSuccess(`${uploadedFiles.length} fichier(s) uploadé(s) avec succès`);
      }
    } catch (error) {
      console.error('Error during upload:', error);
      setError('Erreur lors de l\'upload des fichiers');
    } finally {
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleMediaSelect = (mediaFile: MediaFile) => {
    if (!onSelect) return;

    if (multiSelect) {
      const isSelected = selectedMedia.has(mediaFile.metadata.id);
      const newSelection = isSelected
        ? new Set([...selectedMedia].filter(m => m !== mediaFile.metadata.id))
        : new Set([...selectedMedia, mediaFile.metadata.id]);
      setSelectedMedia(newSelection);
      onSelect([...newSelection].map(id => media.find(m => m.metadata.id === id)));
    } else {
      setSelectedMedia(new Set([mediaFile.metadata.id]));
      onSelect([mediaFile]);
    }
  };

  const handleMediaUpdate = (updatedMedia: MediaFile) => {
    setMedia(prevMedia => 
      prevMedia.map(m => 
        m.metadata.id === updatedMedia.metadata.id ? updatedMedia : m
      )
    );
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handleTagsChange = (_event: any, newTags: string[]) => {
    setSelectedTags(newTags);
  };

  const debouncedSearch = useMemo(
    () => debounce(() => {
      loadMedia();
    }, 500),
    [search]
  );

  useEffect(() => {
    debouncedSearch();
    return () => {
      debouncedSearch.cancel();
    };
  }, [search, debouncedSearch]);

  useEffect(() => {
    setFilteredMedia(
      media.filter((item) => {
        // Filtrer par type de média
        if (mediaType && item.metadata.type !== mediaType) {
          return false;
        }

        // Filtrer par style
        if (styleFilter && !item.metadata.tags?.some(tag => tag.startsWith('style:') && tag.substring(6) === styleFilter)) {
          return false;
        }

        // Filtrer par ambiance
        if (moodFilter && !item.metadata.tags?.some(tag => tag.startsWith('mood:') && tag.substring(5) === moodFilter)) {
          return false;
        }

        // Filtrer par couleur
        if (colorFilter && !item.metadata.tags?.some(tag => tag.startsWith('color:') && tag.substring(6) === colorFilter)) {
          return false;
        }

        // Filtrer par recherche
        if (search) {
          const searchLower = search.toLowerCase();
          return (
            item.metadata.name.toLowerCase().includes(searchLower) ||
            item.metadata.tags?.some(tag => tag.toLowerCase().includes(searchLower))
          );
        }

        return true;
      })
    );
  }, [media, mediaType, styleFilter, moodFilter, colorFilter, search]);

  // Extraire tous les styles, ambiances et couleurs uniques
  const allStyles = useMemo(() => {
    console.log('Analyzing media for styles:', media);
    const styles = new Set<string>();
    media.forEach(m => {
      console.log('Checking tags for media:', m.metadata.id, m.metadata.tags);
      const styleTag = m.metadata.tags.find(t => t.startsWith('style:'));
      if (styleTag) {
        console.log('Found style tag:', styleTag);
        styles.add(styleTag.replace('style:', ''));
      }
    });
    const result = Array.from(styles);
    console.log('All styles found:', result);
    return result;
  }, [media]);

  const allMoods = useMemo(() => {
    const moods = new Set<string>();
    media.forEach(m => {
      const moodTag = m.metadata.tags.find(t => t.startsWith('mood:'));
      if (moodTag) {
        console.log('Found mood tag:', moodTag);
        moods.add(moodTag.replace('mood:', ''));
      }
    });
    const result = Array.from(moods);
    console.log('All moods found:', result);
    return result;
  }, [media]);

  const allColors = useMemo(() => {
    const colors = new Set<string>();
    media.forEach(m => {
      const colorTags = m.metadata.tags.filter(t => t.startsWith('color:'));
      if (colorTags.length > 0) {
        console.log('Found color tags:', colorTags);
        colorTags.forEach(t => colors.add(t.replace('color:', '')));
      }
    });
    const result = Array.from(colors);
    console.log('All colors found:', result);
    return result;
  }, [media]);

  // Initialiser les tags par défaut si nécessaire
  useEffect(() => {
    if (!mediaLibraryService) return;

    const initializeTags = async () => {
      try {
        const mediaList = await mediaLibraryService.listMedia();
        console.log('Loaded media for tags:', mediaList);
        
        // Vérifier si les médias ont des tags
        const needsAnalysis = mediaList.some(m => !m.metadata.tags || m.metadata.tags.length === 0);
        
        if (needsAnalysis) {
          console.log('Some media needs analysis');
          // TODO: Proposer une analyse en masse
        }
      } catch (error) {
        console.error('Error initializing tags:', error);
      }
    };

    initializeTags();
  }, [mediaLibraryService]);

  // S'assurer que les tags sont initialisés
  useEffect(() => {
    if (media.length > 0) {
      console.log('Current media tags:', media.map(m => ({
        id: m.metadata.id,
        tags: m.metadata.tags
      })));
    }
  }, [media]);

  const handleBulkAnalyze = async () => {
    if (!mediaLibraryService) {
      console.error('MediaLibraryService not initialized');
      setError('Service not initialized');
      return;
    }

    setAnalyzing(true);
    setAnalyzedCount(0);
    setError(null);
    setSuccess(null);

    const errors: Array<{ id: string; error: string }> = [];
    let successCount = 0;

    try {
      const imageAnalyzer = ImageAnalyzer.getInstance();
      const mediaToAnalyze = media.filter(m => {
        if (!m.metadata) {
          console.warn('Media missing metadata:', m);
          return false;
        }
        return !m.metadata.tags || m.metadata.tags.length === 0;
      });
      
      console.log(`Starting bulk analysis of ${mediaToAnalyze.length} media files`);
      
      for (let i = 0; i <mediaToAnalyze.length; i++) {
        const m = mediaToAnalyze[i];
        try {
          if (!m.metadata || !m.metadata.id || !m.url) {
            console.error('Invalid media object:', m);
            errors.push({ id: m.metadata?.id || 'unknown', error: 'Invalid media data' });
            continue;
          }

          console.log(`Analyzing media ${i + 1}/${mediaToAnalyze.length}:`, {
            id: m.metadata.id,
            type: m.metadata.type,
            name: m.metadata.name
          });

          const analysis = await imageAnalyzer.analyzeImage(m.url);
          console.log('Analysis results:', {
            id: m.metadata.id,
            style: analysis.style,
            mood: analysis.mood,
            tags: analysis.tags.length
          });
          
          const updatedMetadata = {
            ...m.metadata,
            tags: [
              ...new Set([
                ...(m.metadata.tags || []),
                `style:${analysis.style}`,
                `mood:${analysis.mood}`,
                ...analysis.dominantColors.map(color => `color:${color}`),
                ...analysis.tags
              ])
            ].filter(Boolean),
            updatedAt: new Date().toISOString()
          };

          await mediaLibraryService.updateMetadata(m.metadata.id, updatedMetadata);
          successCount++;
          setAnalyzedCount(i + 1);
        } catch (error) {
          console.error(`Error analyzing media ${m.metadata?.id}:`, error);
          errors.push({ 
            id: m.metadata?.id || 'unknown', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      // Recharger les médias avec leurs nouveaux tags
      await loadMedia();
      
      // Afficher un résumé des résultats
      if (errors.length > 0) {
        console.warn('Analysis completed with errors:', {
          total: mediaToAnalyze.length,
          success: successCount,
          errors: errors.length,
          details: errors
        });
        setError(`Analysis completed with ${errors.length} errors. ${successCount} files processed successfully.`);
      } else {
        console.log('Analysis completed successfully:', {
          total: mediaToAnalyze.length,
          success: successCount
        });
        setSuccess(`Analyzed ${successCount} media files successfully`);
      }
    } catch (error) {
      console.error('Error during bulk analysis:', error);
      setError('Failed to complete analysis: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelect = (mediaId: string) => {
    setSelectedMedia(prev => {
      const newSelection = new Set(prev);
      if (multiSelect) {
        if (newSelection.has(mediaId)) {
          newSelection.delete(mediaId);
        } else {
          newSelection.add(mediaId);
        }
      } else {
        newSelection.clear();
        newSelection.add(mediaId);
      }
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    setSelectedMedia(prev => {
      if (prev.size === filteredMedia.length) {
        return new Set();
      } else {
        return new Set(filteredMedia.map(m => m.metadata.id));
      }
    });
  };

  const handleAnalyzeSelected = async () => {
    if (selectedMedia.size === 0) {
      setError('Veuillez sélectionner au moins un média à analyser');
      return;
    }

    setAnalyzing(true);
    setAnalyzedCount(0);
    setError(null);
    setSuccess(null);

    try {
      const imageAnalyzer = ImageAnalyzer.getInstance();
      const mediaLibraryService = await MediaLibraryService.getInstance();
      const mediaToAnalyze = filteredMedia.filter(m => selectedMedia.has(m.metadata.id));
      
      console.log(`Starting bulk analysis of ${mediaToAnalyze.length} media files`);
      
      for (let i = 0; i < mediaToAnalyze.length; i++) {
        const m = mediaToAnalyze[i];
        try {
          if (!m.metadata || !m.metadata.id || !m.url) {
            console.error('Invalid media file:', m);
            continue;
          }

          console.log(`Analyzing media ${i + 1}/${mediaToAnalyze.length}:`, m.metadata.id);
          const analysis = await imageAnalyzer.analyzeImage(m.url);
          
          // Mettre à jour les métadonnées avec les résultats de l'analyse
          const newTags = [
            ...(m.metadata.tags || []),
            ...(analysis.style && analysis.style.trim() !== '' ? [`style:${analysis.style.trim()}`] : []),
            ...(analysis.mood && analysis.mood.trim() !== '' ? [`mood:${analysis.mood.trim()}`] : []),
            ...analysis.dominantColors.filter(color => color.trim() !== '').map(color => `color:${color.trim()}`),
            ...analysis.tags.filter(tag => tag.trim() !== '').map(tag => tag.trim())
          ];

          const updatedMetadata = {
            ...m.metadata,
            tags: Array.from(new Set(newTags)),
            updatedAt: new Date().toISOString()
          };

          await mediaLibraryService.updateMetadata(m.metadata.id, updatedMetadata);
          setAnalyzedCount(prev => prev + 1);

          // Mettre à jour l'état local
          setMedia(prevMedia => 
            prevMedia.map(prevM => 
              prevM.metadata.id === m.metadata.id 
                ? { ...prevM, metadata: updatedMetadata }
                : prevM
            )
          );
        } catch (error) {
          console.error('Error analyzing media:', m.metadata.id, error);
        }
      }

      setSuccess(`Analyse terminée pour ${analyzedCount} médias`);
    } catch (error) {
      console.error('Error during bulk analysis:', error);
      setError('Erreur lors de l\'analyse des médias');
    } finally {
      setAnalyzing(false);
      setSelectedMedia(new Set());
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Filtrer les fichiers pour ne garder que les images et vidéos
    const mediaFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (mediaFiles.length === 0) {
      setError('Seuls les fichiers images et vidéos sont acceptés');
      return;
    }

    try {
      const mediaLibraryService = await MediaLibraryService.getInstance();
      const uploadedFiles: MediaFile[] = [];

      for (const file of mediaFiles) {
        console.log('Uploading file:', file.name);
        
        try {
          const mediaFile = await mediaLibraryService.uploadMedia(file);
          uploadedFiles.push(mediaFile);
          console.log('File uploaded successfully:', mediaFile.metadata.id);
        } catch (error) {
          console.error('Error uploading file:', file.name, error);
          setError(`Erreur lors de l'upload de ${file.name}`);
        }
      }

      // Mettre à jour la liste des médias
      if (uploadedFiles.length > 0) {
        setMedia(prevMedia => [...prevMedia, ...uploadedFiles]);
        setSuccess(`${uploadedFiles.length} fichier(s) uploadé(s) avec succès`);
      }
    } catch (error) {
      console.error('Error during upload:', error);
      setError('Erreur lors de l\'upload des fichiers');
    }
  };

  useEffect(() => {
    if (onSelect) {
      const selectedFiles = media.filter(m => selectedMedia.has(m.metadata.id));
      onSelect(selectedFiles);
    }
  }, [selectedMedia, media, onSelect]);

  return (
    <Box 
      sx={{ 
        p: 2,
        position: 'relative',
        minHeight: '200px',
        ...(isDragging && {
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '3px dashed white',
          }
        })
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '1.5rem',
            zIndex: 1001,
            textAlign: 'center',
            width: '100%'
          }}
        >
          <Typography variant="h5" sx={{ color: 'white' }}>
            Déposez vos fichiers ici
          </Typography>
          <Typography variant="body1" sx={{ color: 'white', mt: 1 }}>
            Images et vidéos uniquement
          </Typography>
        </Box>
      )}

      <Stack spacing={2}>
        {/* Barre d'outils */}
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ flexGrow: 1 }} />

          {/* Filtres */}
          <FormControl size="small">
            <Select
              value={mediaType || ''}
              onChange={(e) => setMediaType(e.target.value as MediaType | '')}
              displayEmpty
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="">Tous les types</MenuItem>
              <MenuItem value="image">Images</MenuItem>
              <MenuItem value="video">Vidéos</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small">
            <Select
              value={styleFilter || ''}
              onChange={(e) => setStyleFilter(e.target.value)}
              displayEmpty
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="">Tous les styles</MenuItem>
              {allStyles.map((style) => (
                <MenuItem key={style} value={style}>
                  {style}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <Select
              value={moodFilter || ''}
              onChange={(e) => setMoodFilter(e.target.value)}
              displayEmpty
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="">Toutes les ambiances</MenuItem>
              {allMoods.map((mood) => (
                <MenuItem key={mood} value={mood}>
                  {mood}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <Select
              value={colorFilter || ''}
              onChange={(e) => setColorFilter(e.target.value)}
              displayEmpty
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="">Toutes les couleurs</MenuItem>
              {allColors.map((color) => (
                <MenuItem key={color} value={color}>
                  {color}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <IconButton onClick={handleUpload}>
            <UploadIcon />
          </IconButton>

          {onSelect && (
            <>
              <IconButton 
                onClick={handleSelectAll}
                color={selectedMedia.size === filteredMedia.length ? "primary" : "default"}
              >
                <SelectAllIcon />
              </IconButton>
            </>
          )}

          <IconButton 
            onClick={handleAnalyzeSelected}
            disabled={selectedMedia.size === 0 || analyzing}
            color={selectedMedia.size > 0 ? "primary" : "default"}
          >
            {analyzing ? (
              <CircularProgress size={24} />
            ) : (
              <PsychologyIcon />
            )}
          </IconButton>
        </Stack>

        {/* Messages */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        {analyzing && (
          <Alert severity="info">
            Analyse en cours... {analyzedCount}/{selectedMedia.size} médias analysés
          </Alert>
        )}

        {/* Grille de médias */}
        <Grid container spacing={2}>
          {filteredMedia.map((mediaFile) => (
            <Grid item key={mediaFile.metadata.id} xs={12} sm={6} md={4} lg={3}>
              <MediaCard
                mediaFile={mediaFile}
                onDelete={handleMediaUpdate}
                onUpdate={handleMediaUpdate}
                selected={selectedMedia.has(mediaFile.metadata.id)}
                onSelect={onSelect ? () => handleSelect(mediaFile.metadata.id) : undefined}
              />
            </Grid>
          ))}
        </Grid>

        {/* Input caché pour l'upload */}
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
      </Stack>
    </Box>
  );
}

export default MediaLibrary;
