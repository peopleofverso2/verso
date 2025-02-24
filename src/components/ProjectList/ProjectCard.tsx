import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Box,
  CircularProgress,
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
import { PovExportService } from '../../services/PovExportService';
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
  const [povExportService] = React.useState(() => PovExportService.getInstance());

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
        });
        
        // Vérifier la structure du projet
        const hasValidNodes = fullProject.nodes?.length > 0;
        
        if (hasValidNodes) {
          // Utiliser PovExportService pour exporter le scénario correctement
          const exportedScenario = await povExportService.exportScenario(
            fullProject.scenario?.scenarioTitle || project.title,
            fullProject.nodes,
            fullProject.edges || []
          );
          
          console.log('ProjectCard: Scenario exported successfully:', {
            nodes: exportedScenario.nodes?.length,
            edges: exportedScenario.edges?.length,
            mediaCount: Object.keys(exportedScenario.media || {}).length,
          });
          
          setScenario(exportedScenario);
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
  }, [project.projectId, isMediaLibraryReady, project.title]);

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
        <div onClick={() => onProjectSelect(project.projectId)}>
          <Box sx={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: 'background.default'
              }}
            >
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
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    position: 'relative'
                  }}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
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
                </Box>
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
          </Box>
          <CardContent>
            <Typography 
              variant="h6" 
              component="div" 
              fontWeight="bold" 
              gutterBottom
            >
              {project.scenario?.scenarioTitle || project.title}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              display="block"
            >
              Modifié le {formatDate(project.updatedAt)}
            </Typography>
          </CardContent>
        </div>
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
