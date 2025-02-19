import React, { useState, useCallback } from 'react';
import { Box, Typography, IconButton, styled } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { MediaFile } from '../../types/media';
import { MediaCard } from '../Media/MediaCard';
import { MediaLibraryService } from '../../services/MediaLibraryService';

const LibraryContainer = styled(Box)(({ theme }) => ({
  width: '300px',
  height: '100%',
  borderRight: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  flexDirection: 'column',
}));

const DropzoneArea = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.default,
  textAlign: 'center',
  cursor: 'pointer',
  margin: theme.spacing(2),
  '&:hover': {
    borderColor: theme.palette.primary.main,
  },
}));

const MediaGrid = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: theme.spacing(2),
}));

export const MediaLibrary: React.FC = () => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const mediaLibraryService = new MediaLibraryService();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      const newMediaFiles = await Promise.all(
        acceptedFiles.map(file => mediaLibraryService.uploadMedia(file))
      );
      setMediaFiles(prev => [...prev, ...newMediaFiles]);
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'video/*': ['.mp4', '.webm'],
      'audio/*': ['.mp3', '.wav']
    }
  });

  return (
    <LibraryContainer>
      <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        Bibliothèque de Médias
      </Typography>

      <DropzoneArea {...getRootProps()}>
        <input {...getInputProps()} />
        <IconButton>
          <CloudUploadIcon />
        </IconButton>
        <Typography>
          {isDragActive
            ? 'Déposez les fichiers ici'
            : 'Glissez-déposez ou cliquez pour importer'}
        </Typography>
      </DropzoneArea>

      <MediaGrid>
        {mediaFiles.map((mediaFile) => (
          <MediaCard
            key={mediaFile.metadata.id}
            mediaFile={mediaFile}
            draggable
          />
        ))}
      </MediaGrid>
    </LibraryContainer>
  );
};
