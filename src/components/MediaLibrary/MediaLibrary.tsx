import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  TextField,
  Button,
  Autocomplete,
  Snackbar,
  Alert,
  Stack,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  CloudUpload as CloudUploadIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { MediaFile, MediaFilter } from '../../types/media';
import { MediaLibraryService } from '../../services/MediaLibraryService';
import MediaCard from './MediaCard';
import UploadDialog from './UploadDialog';
import MediaTypeFilter, { MediaType } from './MediaTypeFilter';

interface MediaLibraryProps {
  onSelect?: (mediaFiles: MediaFile[]) => void;
  multiSelect?: boolean;
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

export default function MediaLibrary({ 
  onSelect,
  multiSelect = true,
  acceptedTypes = ACCEPTED_TYPES
}: MediaLibraryProps) {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [filter, setFilter] = useState<MediaFilter>({});
  const [search, setSearch] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('all');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [mediaLibrary, setMediaLibrary] = useState<MediaLibraryService | null>(null);

  useEffect(() => {
    const initMediaLibrary = async () => {
      try {
        const service = await MediaLibraryService.getInstance();
        await service.initialize();
        setMediaLibrary(service);
      } catch (error) {
        console.error('Error initializing media library:', error);
      }
    };
    
    initMediaLibrary();
  }, []);

  // Filtrer les médias en fonction du type sélectionné et de la recherche
  const filteredMedia = useMemo(() => {
    return media.filter(file => {
      // Filtre par type de média
      if (mediaType !== 'all' && file.metadata.type !== mediaType) {
        return false;
      }

      // Filtre par recherche
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          file.metadata.name.toLowerCase().includes(searchLower) ||
          file.metadata.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });
  }, [media, mediaType, search]);

  useEffect(() => {
    const loadMedia = async () => {
      try {
        console.log('Starting media loading...');
        console.log('Accepted types:', acceptedTypes);
        
        if (!mediaLibrary) {
          console.error('Media library not initialized');
          return;
        }
        
        const mediaFiles = await mediaLibrary.listMedia(filter);
        console.log('Raw media files:', mediaFiles);
        
        const filteredFiles = mediaFiles.filter(file => {
          if (!file || !file.metadata) {
            console.warn('Invalid media file:', file);
            return false;
          }
          
          const isAccepted = acceptedTypes.length === 0 || 
            acceptedTypes.some(type => {
              const [category] = type.split('/');
              const isMatch = file.metadata.type === category || type === '*/*';
              console.log('Type check:', {
                fileType: file.metadata.type,
                category,
                type,
                isMatch
              });
              return isMatch;
            });
            
          if (!isAccepted) {
            console.log('File rejected:', file.metadata.name);
          }
          return isAccepted;
        });
        
        console.log('Filtered media files:', filteredFiles);
        setMedia(filteredFiles);
      } catch (error) {
        console.error('Detailed error loading media:', error);
        if (error instanceof Error) {
          showError(`Error loading media: ${error.message}`);
        } else {
          showError('Unknown error loading media');
        }
      }
    };
    loadMedia();
  }, [filter, acceptedTypes, mediaLibrary]);

  const handleUpload = useCallback(async (files: File[]) => {
    try {
      if (!mediaLibrary) {
        console.error('Media library not initialized');
        return;
      }
      for (const file of files) {
        await mediaLibrary.uploadMedia(file);
      }
      
      // Refresh media list
      const mediaFiles = await mediaLibrary.listMedia(filter);
      setMedia(mediaFiles);
      
      setSnackbar({
        open: true,
        message: 'Upload successful',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      setSnackbar({
        open: true,
        message: 'Error uploading files',
        severity: 'error'
      });
    }
    setUploadOpen(false);
  }, [mediaLibrary, filter]);

  const handleDelete = async (mediaFile: MediaFile) => {
    try {
      if (!mediaLibrary) {
        console.error('Media library not initialized');
        return;
      }
      await mediaLibrary.deleteMedia(mediaFile.metadata.id);
      setSelectedMedia(prev => {
        const next = new Set(prev);
        next.delete(mediaFile.metadata.id);
        return next;
      });
      const mediaFiles = await mediaLibrary.listMedia(filter);
      setMedia(mediaFiles);
      setSnackbar({
        open: true,
        message: 'Media deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting media:', error);
      setSnackbar({
        open: true,
        message: 'Error deleting media',
        severity: 'error'
      });
    }
  };

  const handleSelect = (mediaFile: MediaFile) => {
    setSelectedMedia(prev => {
      const next = new Set(prev);
      if (next.has(mediaFile.metadata.id)) {
        next.delete(mediaFile.metadata.id);
      } else {
        if (!multiSelect) {
          next.clear();
        }
        next.add(mediaFile.metadata.id);
      }
      return next;
    });
  };

  const handleConfirmSelection = () => {
    if (onSelect) {
      const selectedFiles = media.filter(m => selectedMedia.has(m.metadata.id));
      onSelect(selectedFiles);
    }
  };

  const showSuccess = (message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'success'
    });
  };

  const showError = (message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'error'
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Barre d'actions sticky en haut */}
      {onSelect && (
        <Paper
          elevation={3}
          sx={{
            position: 'sticky',
            top: 0,
            p: 1,
            backgroundColor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <Typography variant="body2" sx={{ pl: 2 }}>
            {selectedMedia.size > 0 
              ? `${selectedMedia.size} média${selectedMedia.size > 1 ? 's' : ''} sélectionné${selectedMedia.size > 1 ? 's' : ''}`
              : 'Aucun média sélectionné'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selectedMedia.size > 0 && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<CheckIcon />}
                onClick={handleConfirmSelection}
              >
                Valider
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {/* Contenu principal */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            {/* Barre de recherche et filtres */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ flexGrow: 1 }}
              />
              <MediaTypeFilter value={mediaType} onChange={setMediaType} />
              <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                onClick={() => setUploadOpen(true)}
              >
                Upload
              </Button>
            </Box>

            {/* Tags */}
            <Autocomplete
              multiple
              size="small"
              options={availableTags}
              value={selectedTags}
              onChange={(_, newValue) => setSelectedTags(newValue)}
              renderInput={(params) => (
                <TextField {...params} placeholder="Filtrer par tags..." />
              )}
            />

            {/* Grille de médias */}
            <Grid container spacing={2}>
              {filteredMedia.map((mediaFile) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={mediaFile.metadata.id}>
                  <MediaCard
                    mediaFile={mediaFile}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                    selected={selectedMedia.has(mediaFile.metadata.id)}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Message si aucun résultat */}
            {filteredMedia.length === 0 && (
              <Typography variant="body1" color="text.secondary" align="center">
                Aucun média trouvé
              </Typography>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Dialogs et notifications */}
      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
        acceptedTypes={acceptedTypes}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
