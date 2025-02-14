import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  Tooltip,
  CardActionArea,
  CircularProgress,
  Dialog,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { ProjectMetadata } from '../../types/project';
import { ProjectService } from '../../services/projectService';
import MiniPovPlayer from '../Player/MiniPovPlayer';
import PovPlayer from '../Player/PovPlayer';

interface ProjectCardProps {
  project: ProjectMetadata;
  onProjectSelect: (projectId: string) => void;
  onProjectDelete?: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onProjectSelect,
  onProjectDelete,
}) => {
  const [scenario, setScenario] = React.useState<any>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    const loadScenario = async () => {
      try {
        const projectService = ProjectService.getInstance();
        console.log('ProjectCard: Loading project:', project.projectId);
        
        const fullProject = await projectService.loadProject(project.projectId);
        console.log('ProjectCard: Project loaded:', {
          projectId: project.projectId,
          hasNodes: !!fullProject.nodes,
          nodesCount: fullProject.nodes?.length,
          hasMedia: !!fullProject.media,
          mediaCount: Object.keys(fullProject.media || {}).length
        });
        
        // Vérifier la structure du projet
        const hasValidNodes = fullProject.nodes?.length > 0;
        const hasValidMedia = fullProject.media && Object.keys(fullProject.media).length > 0;
        
        console.log('ProjectCard: Project validation:', {
          hasValidNodes,
          hasValidMedia,
          nodesCount: fullProject.nodes?.length,
          mediaCount: Object.keys(fullProject.media || {}).length,
          media: fullProject.media
        });

        if (hasValidNodes) {
          console.log('ProjectCard: Setting scenario state with:', {
            nodes: fullProject.nodes.length,
            mediaCount: Object.keys(fullProject.media || {}).length,
            media: fullProject.media
          });
          setScenario({
            nodes: fullProject.nodes,
            edges: fullProject.edges || [],
            media: fullProject.media || {}
          });
        }
      } catch (error) {
        console.error('ProjectCard: Error loading project:', error);
      }
    };

    loadScenario();
  }, [project.projectId]);

  const handlePlayClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsPlaying(true);
  };

  const handleClose = () => {
    setIsPlaying(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Card sx={{ minWidth: 275, maxWidth: 345, m: 1 }}>
        <Box sx={{ position: 'relative' }}>
          <CardActionArea onClick={() => onProjectSelect(project.projectId)}>
            <CardContent>
              <Box sx={{ position: 'relative', minHeight: 200 }}>
                {scenario ? (
                  <MiniPovPlayer scenario={scenario} />
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: 200,
                    }}
                  >
                    <CircularProgress />
                  </Box>
                )}
              </Box>
              <Typography variant="h6" component="div">
                {project.scenarioTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Created: {formatDate(project.createdAt)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Modified: {formatDate(project.updatedAt)}
              </Typography>
            </CardContent>
          </CardActionArea>
          {scenario && (
            <IconButton
              sx={{
                position: 'absolute',
                bottom: 72,
                right: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                },
                zIndex: 1,
              }}
              onClick={handlePlayClick}
            >
              <PlayArrowIcon sx={{ color: 'white' }} />
            </IconButton>
          )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, borderTop: 1, borderColor: 'divider' }}>
          <Tooltip title="Edit">
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                onProjectSelect(project.projectId);
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          {onProjectDelete && (
            <Tooltip title="Delete">
              <IconButton 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onProjectDelete(project.projectId);
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Card>

      <Dialog
        fullScreen
        open={isPlaying}
        onClose={handleClose}
      >
        {scenario && <PovPlayer scenario={scenario} onClose={handleClose} />}
      </Dialog>
    </>
  );
};

export default ProjectCard;
