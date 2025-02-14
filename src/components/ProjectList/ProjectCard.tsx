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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { ProjectMetadata } from '../../types/project';
import { ProjectService } from '../../services/projectService';
import MiniPovPlayer from '../Player/MiniPovPlayer';

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

  React.useEffect(() => {
    const loadScenario = async () => {
      try {
        const projectService = ProjectService.getInstance();
        const fullProject = await projectService.loadProject(project.projectId);
        console.log('Loaded project for MiniPovPlayer:', fullProject);
        
        // Vérifier la structure du projet
        const hasValidNodes = fullProject.nodes?.length > 0;
        const hasValidMedia = fullProject.media && Object.keys(fullProject.media).length > 0;
        
        console.log('Project validation:', {
          hasValidNodes,
          hasValidMedia,
          nodesCount: fullProject.nodes?.length,
          mediaCount: Object.keys(fullProject.media || {}).length
        });

        if (hasValidNodes || hasValidMedia) {
          setScenario({
            nodes: fullProject.nodes || [],
            media: fullProject.media || {}
          });
        }
      } catch (error) {
        console.error('Error loading project:', error);
      }
    };

    loadScenario();
  }, [project.projectId]);

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
    <Card>
      <CardActionArea onClick={() => onProjectSelect(project.projectId)}>
        <Box sx={{ height: 140, bgcolor: 'background.paper' }}>
          {scenario ? (
            <MiniPovPlayer scenario={scenario} />
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'action.hover'
              }}
            >
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>
        
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom noWrap>
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
  );
};

export default ProjectCard;
