import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  IconButton,
  Box,
  Skeleton,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { ProjectMetadata } from '../../types/project';
import { MediaLibraryService } from '../../services/mediaLibraryService';

interface ProjectCardProps {
  project: ProjectMetadata;
  onSelect: () => void;
  onDelete?: () => void;
  onPlay: () => void;
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onSelect,
  onDelete,
  onPlay,
  onImageChange,
}) => {
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
      transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
      '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: (theme) => theme.shadows[8],
        '& .card-actions': {
          opacity: 1,
          transform: 'translateY(0)',
        }
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
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)'
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
              bgcolor: 'grey.100',
              transition: 'background-color 0.3s ease-in-out',
              '&:hover': {
                bgcolor: 'grey.200'
              }
            }}
          >
            <ImageIcon sx={{ fontSize: 60, color: 'grey.400' }} />
          </Box>
        )
      )}

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h2" gutterBottom noWrap>
          {project.scenario?.povTitle || 'Sans titre'}
        </Typography>
        {project.scenario?.scenarioTitle && (
          <Typography 
            variant="subtitle2" 
            color="text.secondary" 
            sx={{ 
              mb: 1,
              fontStyle: 'italic'
            }} 
            noWrap
          >
            {project.scenario.scenarioTitle}
          </Typography>
        )}
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

      <CardActions 
        className="card-actions"
        sx={{ 
          justifyContent: 'flex-end', 
          p: 1,
          opacity: { xs: 1, sm: 0 },
          transform: { xs: 'none', sm: 'translateY(10px)' },
          transition: 'all 0.3s ease-in-out',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <IconButton 
          size="small" 
          component="label"
          color="primary"
          title="Changer l'image"
          sx={{
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.1)'
            }
          }}
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
          title="Éditer"
          sx={{
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.1)'
            }
          }}
        >
          <EditIcon />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={onPlay}
          color="primary"
          title="Lancer"
          sx={{
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.1)'
            }
          }}
        >
          <PlayArrowIcon />
        </IconButton>
        {onDelete && (
          <IconButton 
            size="small" 
            onClick={onDelete}
            color="error"
            title="Supprimer"
            sx={{
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.1)'
              }
            }}
          >
            <DeleteIcon />
          </IconButton>
        )}
      </CardActions>
    </Card>
  );
};

export default ProjectCard;
