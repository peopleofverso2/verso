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
import { MediaLibraryService } from '../../services/mediaLibraryService';
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
  const [isLoading, setIsLoading] = React.useState(true);
  const [isHovered, setIsHovered] = React.useState(false);
  const mediaLibrary = React.useRef<MediaLibraryService | null>(null);
  const [isMediaLibraryReady, setIsMediaLibraryReady] = React.useState(false);

  // Initialiser MediaLibrary
  React.useEffect(() => {
    const initMediaLibrary = async () => {
      try {
        console.log('ProjectCard: Initializing MediaLibrary...');
        mediaLibrary.current = await MediaLibraryService.getInstance();
        console.log('ProjectCard: MediaLibrary initialized successfully');
        setIsMediaLibraryReady(true);
      } catch (error) {
        console.error('ProjectCard: Error initializing MediaLibrary:', error);
        setIsMediaLibraryReady(false);
      }
    };

    initMediaLibrary();
  }, []);

  // Charger le scénario une fois que MediaLibrary est prêt
  React.useEffect(() => {
    const loadScenario = async () => {
      if (!mediaLibrary.current || !isMediaLibraryReady) {
        console.log('ProjectCard: MediaLibrary not ready yet, waiting...');
        return;
      }

      console.log('ProjectCard: MediaLibrary is ready, loading scenario...');
      setIsLoading(true);

      try {
        const projectService = ProjectService.getInstance();
        console.log('ProjectCard: Loading project:', project.projectId);
        
        const fullProject = await projectService.loadProject(project.projectId);
        console.log('ProjectCard: Project loaded:', {
          projectId: project.projectId,
          hasNodes: !!fullProject.nodes,
          nodesCount: fullProject.nodes?.length,
          hasMedia: !!fullProject.media,
          mediaCount: Object.keys(fullProject.media || {}).length,
          nodes: fullProject.nodes,
          media: fullProject.media
        });
        
        // Vérifier la structure du projet
        const hasValidNodes = fullProject.nodes?.length > 0;
        const hasValidMedia = fullProject.media && Object.keys(fullProject.media).length > 0;
        
        console.log('ProjectCard: Project validation:', {
          hasValidNodes,
          hasValidMedia,
          nodesCount: fullProject.nodes?.length,
          mediaCount: Object.keys(fullProject.media || {}).length
        });

        if (hasValidNodes || hasValidMedia) {
          // Pré-charger les médias pour s'assurer que les URLs sont créées
          console.log('ProjectCard: Starting media preload...');
          const mediaMap: Record<string, any> = {};
          const mediaPromises = fullProject.nodes?.map(async (node) => {
            if (node.data?.mediaId) {
              try {
                console.log('ProjectCard: Preloading media:', node.data.mediaId);
                const media = await mediaLibrary.current?.getMedia(node.data.mediaId);
                console.log('ProjectCard: Media preloaded:', {
                  mediaId: node.data.mediaId,
                  hasUrl: !!media?.url,
                  metadata: media?.metadata
                });
                if (media) {
                  mediaMap[node.data.mediaId] = media;
                }
                return media;
              } catch (error) {
                console.warn('ProjectCard: Failed to preload media:', {
                  mediaId: node.data.mediaId,
                  error
                });
              }
            }
            return null;
          }) || [];

          const preloadedMedia = await Promise.all(mediaPromises);
          console.log('ProjectCard: All media preloaded:', {
            totalMedia: mediaPromises.length,
            successfulLoads: preloadedMedia.filter(m => m !== null).length,
            mediaMap
          });

          console.log('ProjectCard: Setting scenario state with:', {
            nodes: fullProject.nodes?.length,
            mediaCount: Object.keys(mediaMap).length,
            preloadedMediaCount: preloadedMedia.filter(m => m !== null).length,
            mediaMapContent: mediaMap
          });
          
          setScenario({
            nodes: fullProject.nodes || [],
            media: mediaMap,
            edges: fullProject.edges || []
          });
        } else {
          console.log('ProjectCard: Invalid project structure');
        }
      } catch (error) {
        console.error('ProjectCard: Error loading project:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadScenario();
  }, [project.projectId, isMediaLibraryReady]);

  // Gérer le hover
  const handleMouseEnter = () => {
    console.log('ProjectCard: Mouse enter');
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    console.log('ProjectCard: Mouse leave');
    setIsHovered(false);
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
    <Card>
      <CardActionArea 
        onClick={() => onProjectSelect(project.projectId)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Box sx={{ height: 140, bgcolor: 'background.paper' }}>
          {isLoading ? (
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
          ) : scenario ? (
            <MiniPovPlayer scenario={scenario} isHovered={isHovered} />
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
              <Typography variant="body2" color="text.secondary">
                Aucun média disponible
              </Typography>
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
