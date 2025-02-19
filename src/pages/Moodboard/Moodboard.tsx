import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { MediaLibraryService } from '../../services/MediaLibraryService';
import { MediaFile } from '../../types/media';
import { MediaCard } from '../../components/Media/MediaCard';
import { ErrorDisplay } from '../../components/Common/ErrorDisplay';

const MoodboardContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  marginLeft: '64px', // Pour tenir compte de la navbar
  width: 'calc(100% - 64px)',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
}));

const LoadingContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '200px',
  width: '100%',
});

export const Moodboard: React.FC = () => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMedia = async () => {
      try {
        setLoading(true);
        const mediaLibrary = new MediaLibraryService();
        const files = await mediaLibrary.getAllMedia();
        setMediaFiles(files);
        setError(null);
      } catch (err) {
        setError('Failed to load media files');
        console.error('Error loading media:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMedia();
  }, []);

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <MoodboardContainer>
      <Typography variant="h4" gutterBottom>
        Moodboard
      </Typography>
      
      {loading ? (
        <LoadingContainer>
          <CircularProgress />
        </LoadingContainer>
      ) : (
        <Grid container spacing={3}>
          {mediaFiles.map((mediaFile) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={mediaFile.metadata.id}>
              <MediaCard mediaFile={mediaFile} />
            </Grid>
          ))}
        </Grid>
      )}
    </MoodboardContainer>
  );
};
