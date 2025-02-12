import React, { useState, useCallback } from 'react';
import { Box, IconButton, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControlLabel, Switch, Tooltip } from '@mui/material';
import { Handle, Position } from 'reactflow';
import CollectionsIcon from '@mui/icons-material/Collections';
import TimerIcon from '@mui/icons-material/Timer';
import { MediaSelector } from '../controls/MediaSelector';
import { MediaLibraryService } from '../../../services/MediaLibraryService';

interface ImageNodeProps {
  data: {
    content: {
      mediaId?: string;
      imageUrl?: string;
      timer?: {
        duration: number;
        autoTransition: boolean;
        loop: boolean;
        pauseOnInteraction: boolean;
      };
    };
    onDataChange?: (id: string, data: any) => void;
  };
  id: string;
  selected: boolean;
}

const ImageNode: React.FC<ImageNodeProps> = ({ data, id, selected }) => {
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
  const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(data.content?.imageUrl);
  const [duration, setDuration] = useState(data.content?.timer?.duration || 0);
  const [autoTransition, setAutoTransition] = useState(data.content?.timer?.autoTransition || false);
  const [loop, setLoop] = useState(data.content?.timer?.loop || false);
  const [pauseOnInteraction, setPauseOnInteraction] = useState(data.content?.timer?.pauseOnInteraction || false);

  const handleMediaSelect = useCallback(async (mediaId: string) => {
    try {
      const mediaLibrary = await MediaLibraryService.getInstance();
      const media = await mediaLibrary.getMedia(mediaId);
      
      if (media && media.url) {
        const newData = {
          ...data,
          content: {
            ...data.content,
            imageUrl: media.url,
            mediaId: mediaId,
          },
        };
        setImageUrl(media.url);
        if (data.onDataChange) {
          data.onDataChange(id, newData);
        }
      }
    } catch (error) {
      console.error('Error loading media:', error);
    }
    setIsMediaSelectorOpen(false);
  }, [data, id]);

  const handleTimerSave = useCallback(() => {
    const newData = {
      ...data,
      content: {
        ...data.content,
        timer: {
          duration,
          autoTransition,
          loop,
          pauseOnInteraction,
        },
      },
    };
    if (data.onDataChange) {
      data.onDataChange(id, newData);
    }
    setIsTimerDialogOpen(false);
  }, [data, id, duration, autoTransition, loop, pauseOnInteraction]);

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minWidth: 200,
          minHeight: 150,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: '1px solid',
          borderColor: selected ? 'primary.main' : 'divider',
          overflow: 'hidden',
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Node content"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        ) : (
          <Box sx={{ color: 'text.secondary' }}>No image selected</Box>
        )}

        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 1,
            zIndex: 1,
          }}
        >
          <Tooltip title="Select Image">
            <IconButton 
              color="primary" 
              onClick={() => setIsMediaSelectorOpen(true)}
            >
              <CollectionsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Timer Settings">
            <IconButton 
              color="primary" 
              onClick={() => setIsTimerDialogOpen(true)}
            >
              <TimerIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
      </Box>

      <MediaSelector
        open={isMediaSelectorOpen}
        onClose={() => setIsMediaSelectorOpen(false)}
        onSelect={handleMediaSelect}
        mediaType="image"
      />

      <Dialog open={isTimerDialogOpen} onClose={() => setIsTimerDialogOpen(false)}>
        <DialogTitle>Timer Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Duration (seconds)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              inputProps={{ min: 0 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={autoTransition}
                  onChange={(e) => setAutoTransition(e.target.checked)}
                />
              }
              label="Auto transition"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={loop}
                  onChange={(e) => setLoop(e.target.checked)}
                />
              }
              label="Loop"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={pauseOnInteraction}
                  onChange={(e) => setPauseOnInteraction(e.target.checked)}
                />
              }
              label="Pause on interaction"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTimerDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTimerSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ImageNode;
