import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Search as SearchIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { LocalStorageAdapter } from '../../../services/storage/LocalStorageAdapter';
import { MediaFile } from '../../../types/media';

interface MediaSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (mediaId: string) => void;
  mediaType?: 'image' | 'video';
}

export const MediaSelector: React.FC<MediaSelectorProps> = ({
  open,
  onClose,
  onSelect,
  mediaType = 'image',
}) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadMedia = useCallback(async () => {
    try {
      setLoading(true);
      const storageAdapter = await LocalStorageAdapter.getInstance();
      const filter = {
        type: mediaType
      };
      const allMedia = await storageAdapter.listMedia(filter);
      setMediaFiles(allMedia);
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  }, [mediaType]);

  useEffect(() => {
    if (open) {
      loadMedia();
    }
  }, [open, loadMedia]);

  const handleUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = mediaType === 'image' ? 'image/*' : 'video/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const storageAdapter = await LocalStorageAdapter.getInstance();
          const now = new Date().toISOString();
          await storageAdapter.saveMedia({
            file,
            metadata: {
              name: file.name,
              type: mediaType,
              mimeType: file.type,
              size: file.size,
              createdAt: now,
              updatedAt: now,
              tags: [],
            }
          });
          await loadMedia();
        } catch (error) {
          console.error('Error uploading file:', error);
        }
      }
    };
    input.click();
  }, [mediaType, loadMedia]);

  const filteredMediaFiles = mediaFiles.filter(media =>
    media.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMediaClick = (mediaId: string) => {
    onSelect(mediaId);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Select {mediaType === 'image' ? 'Image' : 'Video'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Search media..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <IconButton onClick={handleUpload} color="primary">
            <CloudUploadIcon />
          </IconButton>
        </Box>
        <Grid container spacing={2}>
          {loading ? (
            <Box sx={{ p: 2, width: '100%', textAlign: 'center' }}>
              <Typography>Loading media...</Typography>
            </Box>
          ) : filteredMediaFiles.length === 0 ? (
            <Box sx={{ p: 2, width: '100%', textAlign: 'center' }}>
              <Typography>No media found</Typography>
            </Box>
          ) : (
            filteredMediaFiles.map((media) => (
              <Grid item xs={12} sm={6} md={4} key={media.id}>
                <Card
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleMediaClick(media.id)}
                >
                  <CardMedia
                    component={mediaType === 'image' ? 'img' : 'video'}
                    height="140"
                    image={media.url}
                    alt={media.metadata.name}
                  />
                  <CardContent>
                    <Typography variant="body2" noWrap>
                      {media.metadata.name}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default MediaSelector;
