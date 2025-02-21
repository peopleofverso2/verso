import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Box,
  CircularProgress,
  CardActionArea,
  Dialog,
  Slide,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import {
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { ProjectMetadata } from '../../types/project';
import { ProjectService } from '../../services/projectService';
import { MediaLibraryService } from '../../services/MediaLibraryService';
import MiniPovPlayer from '../Player/MiniPovPlayer';
import PovPlayer from '../Player/PovPlayer';

interface ProjectCardProps {
  project: ProjectMetadata;
  onProjectSelect: (id: string) => void;
  onProjectDelete: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onProjectSelect,
  onProjectDelete,
}) => {
  const [scenario, setScenario] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
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
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Lancer le scénario en plein écran
  const handlePlayScenario = (event: React.MouseEvent) => {
    event.stopPropagation(); // Empêcher la propagation au CardActionArea
    setIsFullscreen(true);
  };

  // Fermer le plein écran
  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
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
      <Card>
        <CardActionArea 
          onClick={() => onProjectSelect(project.projectId)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Box sx={{ height: 140, bgcolor: 'background.paper', position: 'relative' }}>
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
              <>
                <MiniPovPlayer scenario={scenario} isHovered={isHovered} />
                {isHovered && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 1,
                    }}
                  >
                    <IconButton
                      onClick={handlePlayScenario}
                      sx={{
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.7)',
                        },
                        color: 'white',
                      }}
                    >
                      <PlayArrowIcon fontSize="large" />
                    </IconButton>
                  </Box>
                )}
              </>
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
          <CardContent sx={{ flexGrow: 1 }}>
            <Box sx={{ mb: 2 }}>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  display: 'block',
                  mb: 0.5 
                }}
              >
                Point POV
              </Typography>
              <Typography 
                variant="h6" 
                component="h2" 
                sx={{
                  fontFamily: 'monospace',
                  bgcolor: 'background.default',
                  p: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  fontSize: '0.9rem'
                }} 
                noWrap
              >
                {project.scenario?.povTitle || `${project.scenario?.scenarioTitle?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'sans-titre'}_${formatDate(project.updatedAt).split(' ')[0]}.pov`}
              </Typography>
            </Box>
            {project.scenario?.scenarioTitle && (
              <Typography 
                variant="subtitle1"
                sx={{ 
                  mb: 1,
                  fontWeight: 600
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
            <Typography variant="caption" color="text.secondary" display="block">
              Modifié le {formatDate(project.updatedAt)}
            </Typography>
          </CardContent>
        </CardActionArea>
        <CardActions>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onProjectDelete(project.projectId);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </CardActions>
      </Card>

      {/* Dialog pour le plein écran */}
      <Dialog
        fullScreen
        open={isFullscreen}
        onClose={handleCloseFullscreen}
        TransitionComponent={Transition}
      >
        <Box sx={{ height: '100%', bgcolor: 'black' }}>
          {scenario && <PovPlayer scenario={scenario} onClose={handleCloseFullscreen} />}
        </Box>
      </Dialog>
    </>
  );
};

// Transition pour le dialog
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default ProjectCard;
