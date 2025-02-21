import React, { DragEvent, useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  styled,
  alpha,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  VideoCall as VideoIcon,
  PhotoLibrary as MediaIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

const SidebarContainer = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  padding: theme.spacing(1.5),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  backgroundColor: alpha(theme.palette.background.paper, 0.95),
  backdropFilter: 'blur(8px)',
  borderRadius: theme.shape.borderRadius * 1.5,
  boxShadow: theme.shadows[8],
  width: '280px',
  zIndex: 1000,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  maxHeight: 'calc(100vh - ${theme.spacing(2)})',
  overflowY: 'auto',
}));

const DraggableNode = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  marginBottom: theme.spacing(0.5),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  cursor: 'grab',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  transition: theme.transitions.create(['transform', 'box-shadow', 'background-color'], {
    duration: theme.transitions.duration.shorter,
  }),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
  '&:active': {
    cursor: 'grabbing',
    transform: 'translateY(0)',
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
  },
}));

interface SidebarProps {
  onSave: () => void;
  isSaving: boolean;
  onBackToLibrary?: () => void;
  isPlaybackMode: boolean;
  onStartPlayback: () => void;
  onStopPlayback: () => void;
  onExportPov?: () => void;
  onImportPov?: (file: File) => void;
  children?: React.ReactNode;
  povTitle?: string;
  onPovTitleChange?: (newTitle: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onSave,
  isSaving,
  onBackToLibrary,
  isPlaybackMode,
  onStartPlayback,
  onStopPlayback,
  onExportPov,
  onImportPov,
  children,
  povTitle,
  onPovTitleChange,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(povTitle || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedTitle(povTitle || '');
  }, [povTitle]);

  const handleTitleSubmit = () => {
    onPovTitleChange?.(editedTitle);
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditedTitle(povTitle || '');
    setIsEditingTitle(false);
  };

  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <SidebarContainer elevation={3}>
      <Stack spacing={2}>
        {/* Header avec titre et boutons de navigation */}
        <Stack direction="row" spacing={2} alignItems="center">
          {onBackToLibrary && (
            <Tooltip title="Retour à la bibliothèque" placement="bottom">
              <ActionButton onClick={onBackToLibrary} size="small">
                <ArrowBackIcon />
              </ActionButton>
            </Tooltip>
          )}
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 600,
              color: 'text.primary',
              flex: 1
            }}
          >
            Editor
          </Typography>
          <Tooltip title="Sauvegarder le scénario" placement="bottom">
            <ActionButton
              onClick={onSave}
              disabled={isSaving}
              color="primary"
              size="small"
            >
              <SaveIcon />
            </ActionButton>
          </Tooltip>
        </Stack>

        {/* Section actions POV */}
        <Box sx={{ 
          p: 1, 
          bgcolor: 'background.default',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: 'text.secondary', 
              mb: 1,
              fontWeight: 600,
              fontSize: '0.8rem'
            }}
          >
            Actions POV
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon sx={{ fontSize: '1rem' }} />}
              onClick={() => fileInputRef.current?.click()}
              size="small"
              fullWidth
              sx={{ 
                fontSize: '0.7rem',
                py: 0.5
              }}
            >
              Importer
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon sx={{ fontSize: '1rem' }} />}
              onClick={onExportPov}
              size="small"
              fullWidth
              sx={{ 
                fontSize: '0.7rem',
                py: 0.5
              }}
            >
              Exporter
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pov"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onImportPov) {
                  onImportPov(file);
                }
                e.target.value = '';
              }}
            />
          </Stack>
        </Box>

        {/* Section titre POV */}
        {povTitle !== undefined && (
          <Box sx={{ 
            p: 2, 
            bgcolor: 'background.default',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
              Titre du POV
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {isEditingTitle ? (
                <>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: 'transparent',
                      fontFamily: 'monospace'
                    }}
                    placeholder="Titre du POV..."
                  />
                  <Tooltip title="Valider le titre" placement="top">
                    <IconButton 
                      size="small" 
                      color="success"
                      onClick={handleTitleSubmit}
                      sx={{ 
                        padding: '4px',
                        backgroundColor: (theme) => alpha(theme.palette.success.main, 0.1),
                        '&:hover': {
                          backgroundColor: (theme) => alpha(theme.palette.success.main, 0.2),
                        }
                      }}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Annuler" placement="top">
                    <IconButton 
                      size="small" 
                      onClick={handleTitleCancel}
                      sx={{ padding: '4px' }}
                    >
                      <ArrowBackIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Typography
                    sx={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid transparent',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {povTitle}
                  </Typography>
                  <Tooltip title="Modifier le titre" placement="top">
                    <IconButton 
                      size="small"
                      onClick={() => setIsEditingTitle(true)}
                      sx={{ padding: '4px' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          </Box>
        )}

        {/* Section lecture */}
        <Box sx={{ 
          p: 1, 
          bgcolor: 'background.default',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: 'text.secondary', 
              mb: 1,
              fontWeight: 600,
              fontSize: '0.8rem'
            }}
          >
            Lecture
          </Typography>
          <Button
            variant="contained"
            startIcon={isPlaybackMode ? <StopIcon sx={{ fontSize: '1rem' }} /> : <PlayIcon sx={{ fontSize: '1rem' }} />}
            onClick={isPlaybackMode ? onStopPlayback : onStartPlayback}
            fullWidth
            size="small"
            sx={{ 
              fontSize: '0.7rem',
              py: 0.5
            }}
          >
            {isPlaybackMode ? 'Arrêter' : 'Lancer'}
          </Button>
        </Box>

        {/* Section noeuds disponibles */}
        <Box>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 600,
              color: 'text.primary',
              mb: 1,
              fontSize: '0.8rem'
            }}
          >
            Nodes
          </Typography>
          <Box
            sx={{
              p: 1,
              border: '1px dashed grey',
              borderRadius: 1,
              bgcolor: 'background.default',
            }}
          >
            <DraggableNode
              onDragStart={(event: DragEvent) => onDragStart(event, 'povNode')}
              draggable
              sx={{
                mb: 1
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                P
              </Box>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  POV Node
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    display: 'block',
                  }}
                >
                  Import POV File
                </Typography>
              </Box>
            </DraggableNode>

            <DraggableNode
              onDragStart={(event: DragEvent) => onDragStart(event, 'videoNode2')}
              draggable
            >
              <VideoIcon 
                sx={{ 
                  color: 'primary.main',
                  fontSize: 28,
                }} 
              />
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  Video Node
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    display: 'block',
                  }}
                >
                  Point POV
                </Typography>
              </Box>
            </DraggableNode>

            <DraggableNode
              onDragStart={(event: DragEvent) => onDragStart(event, 'mediaNode')}
              draggable
            >
              <MediaIcon 
                sx={{ 
                  color: 'primary.main',
                  fontSize: 28,
                }} 
              />
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  Media Node
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    display: 'block',
                  }}
                >
                  Drag to add an image or video
                </Typography>
              </Box>
            </DraggableNode>
          </Box>
        </Box>
      </Stack>

      <Box sx={{ mt: 'auto' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlayIcon />}
          fullWidth
          onClick={onStartPlayback}
          sx={{
            mb: 2,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            height: 48,
            fontSize: '1rem',
          }}
        >
          Play Full Screen
        </Button>
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'text.secondary',
            display: 'block',
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          Drag nodes to the canvas to build your scenario
        </Typography>
      </Box>
    </SidebarContainer>
  );
};

export default Sidebar;
