import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Box,
  CardActions,
  Skeleton,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { ProjectMetadata } from '../../types/project';
import { MediaLibraryService } from '../../services/mediaLibraryService';

interface ProjectCardProps {
  project?: ProjectMetadata;
  onSelect?: () => void;
  onDelete?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onSelect,
  onDelete,
}) => {
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCoverImage = async () => {
      if (project?.scenario?.coverImageId) {
        try {
          const mediaLibrary = await MediaLibraryService.getInstance();
          const media = await mediaLibrary.getMedia(project.scenario.coverImageId);
          setCoverUrl(media.url);
        } catch (error) {
          console.error('Error loading cover image:', error);
        }
      }
      setLoading(false);
    };

    loadCoverImage();
  }, [project?.scenario?.coverImageId]);

  if (!project) {
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Créez votre premier scénario !
          </Typography>
        </CardContent>
      </Card>
    );
  }

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
          onClick={onSelect}
          color="primary"
          title="Éditer"
        >
          <EditIcon />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={onSelect}
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

export default ProjectCard;
