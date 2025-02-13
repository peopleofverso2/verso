import React, { DragEvent } from 'react';
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
} from '@mui/icons-material';

const SidebarContainer = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  backgroundColor: alpha(theme.palette.background.paper, 0.95),
  backdropFilter: 'blur(8px)',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[8],
  width: '280px',
  zIndex: 1000,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const DraggableNode = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
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
  children?: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({
  onSave,
  isSaving,
  onBackToLibrary,
  isPlaybackMode,
  onStartPlayback,
  onStopPlayback,
  children,
}) => {
  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <SidebarContainer elevation={3}>
      <Stack direction="row" spacing={2} alignItems="center">
        {onBackToLibrary && (
          <Tooltip title="Back to Library" placement="bottom">
            <ActionButton onClick={onBackToLibrary} size="small">
              <ArrowBackIcon />
            </ActionButton>
          </Tooltip>
        )}
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 600,
            color: 'text.primary',
          }}
        >
          Editor
        </Typography>
        <Tooltip title="Save Changes" placement="bottom">
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

      <Box>
        <Typography 
          variant="subtitle1" 
          gutterBottom 
          sx={{ 
            fontWeight: 600,
            color: 'text.primary',
            mb: 2,
          }}
        >
          Available Nodes
        </Typography>
        <Box
          sx={{
            p: 2,
            border: '1px dashed grey',
            borderRadius: 1,
            bgcolor: 'background.default',
          }}
        >
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
                Drag to add a video element
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

      {/* Contenu personnalisé */}
      {children}

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
