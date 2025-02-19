import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import {
  Box,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SmartButtonIcon from '@mui/icons-material/SmartButton';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MediaLibrary from '../../../components/MediaLibrary/MediaLibrary';
import { MediaFile } from '../../../types/media';
import { MediaLibraryService } from '../../../services/MediaLibraryService';

interface MediaNodeProps {
  id: string;
  data: {
    mediaId?: string;
    mediaType?: 'video' | 'image';
    audioId?: string;
    content?: {
      audio?: {
        loop?: boolean;
        volume?: number;
        fadeIn?: number;
        fadeOut?: number;
      };
      choices?: Array<{
        id: string;
        text: string;
      }>;
    };
    onMediaEnd?: (id: string) => void;
    onDataChange?: (id: string, data: any) => void;
    onChoiceSelect?: (id: string, choice: any) => void;
    isPlaybackMode?: boolean;
  };
  selected?: boolean;
}

const MediaNode: React.FC<MediaNodeProps> = ({ id, data, selected }) => {
  // États pour les médias
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showButtons, setShowButtons] = useState(true); // Toujours afficher les boutons par défaut

  // Gestion de la fin du média
  const handleVideoEnd = useCallback(() => {
    console.log('Video ended, id:', id);
    console.log('isPlaybackMode:', data.isPlaybackMode);
    console.log('choices:', data.content?.choices);
    
    if (data.isPlaybackMode) {
      if (!data.content?.choices || data.content.choices.length === 0) {
        console.log('No choices available, calling onMediaEnd');
        data.onMediaEnd?.(id);
      } else if (data.content.choices.length === 1) {
        console.log('Single choice available, auto-selecting');
        data.onChoiceSelect?.(id, data.content.choices[0]);
      } else {
        console.log('Multiple choices, showing buttons');
        setShowButtons(true);
      }
    }
  }, [data, id]);

  // Log des changements d'état
  useEffect(() => {
    console.log('MediaNode state:', {
      id,
      isPlaybackMode: data.isPlaybackMode,
      mediaType: data.mediaType,
      hasChoices: data.content?.choices?.length > 0,
      showButtons,
      isMediaLoaded
    });
  }, [id, data.isPlaybackMode, data.mediaType, data.content?.choices, showButtons, isMediaLoaded]);

  // Reset showButtons when node changes
  useEffect(() => {
    setShowButtons(true);
  }, [id]);

  // Chargement du média
  useEffect(() => {
    const loadMedia = async () => {
      if (!data.mediaId) {
        setMediaUrl(null);
        setIsMediaLoaded(false);
        return;
      }

      try {
        const mediaLibrary = await MediaLibraryService.getInstance();
        const media = await mediaLibrary.getMedia(data.mediaId);
        
        if (media && media.metadata && media.url) {
          // Utiliser directement l'URL du média
          setMediaUrl(media.url);
          setError(null);
          setIsMediaLoaded(true);
        } else {
          console.error('Media not found:', data.mediaId);
          setError('Media not found');
          setIsMediaLoaded(false);
        }
      } catch (error) {
        console.error('Error loading media:', error);
        setError('Failed to load media');
        setIsMediaLoaded(false);
      }
    };

    loadMedia();
  }, [data.mediaId]);

  // Chargement de l'audio
  useEffect(() => {
    const loadAudio = async () => {
      if (!data.audioId) {
        setAudioUrl(null);
        setIsAudioLoaded(false);
        return;
      }

      try {
        const mediaLibrary = await MediaLibraryService.getInstance();
        const audio = await mediaLibrary.getMedia(data.audioId);
        
        if (audio && audio.metadata && audio.url) {
          // Utiliser directement l'URL de l'audio
          setAudioUrl(audio.url);
          setError(null);
          setIsAudioLoaded(true);
        } else {
          console.error('Audio not found:', data.audioId);
          setError('Audio not found');
          setIsAudioLoaded(false);
        }
      } catch (error) {
        console.error('Error loading audio:', error);
        setError('Failed to load audio');
        setIsAudioLoaded(false);
      }
    };

    loadAudio();
  }, [data.audioId]);

  // États pour les contrôles
  const [volume, setVolume] = useState(data.content?.audio?.volume ?? 1);
  const [isMuted, setIsMuted] = useState(false);

  // États pour les dialogues
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [isAudioDialogOpen, setIsAudioDialogOpen] = useState(false);
  const [isButtonDialogOpen, setIsButtonDialogOpen] = useState(false);
  const [editedChoices, setEditedChoices] = useState<Array<{ id: string; text: string }>>([]);

  // Initialiser les choix édités quand le dialogue s'ouvre
  useEffect(() => {
    if (isButtonDialogOpen) {
      setEditedChoices(data.content?.choices ?? []);
    }
  }, [isButtonDialogOpen, data.content?.choices]);

  // Handlers
  const handleMediaSelect = useCallback(async (mediaFiles: MediaFile[]) => {
    if (mediaFiles.length > 0) {
      const mediaFile = mediaFiles[0];
      if (data.onDataChange) {
        data.onDataChange(id, {
          ...data,
          mediaId: mediaFile.metadata.id,
          mediaType: mediaFile.metadata.type,
        });
      }
    }
    setIsMediaDialogOpen(false);
  }, [id, data]);

  const handleAudioSelect = useCallback(async (mediaFiles: MediaFile[]) => {
    if (mediaFiles.length > 0) {
      const audioFile = mediaFiles[0];
      if (data.onDataChange) {
        data.onDataChange(id, {
          ...data,
          audioId: audioFile.metadata.id,
          content: {
            ...data.content,
            audio: {
              ...data.content?.audio,
              volume: 1,
              fadeIn: 0,
              fadeOut: 0,
              loop: false,
            },
          },
        });
      }
    }
    setIsAudioDialogOpen(false);
  }, [id, data]);

  const handleVolumeChange = useCallback((event: Event, newValue: number | number[]) => {
    const value = newValue as number;
    setVolume(value);
    if (data.onDataChange) {
      data.onDataChange(id, {
        ...data,
        content: {
          ...data.content,
          audio: {
            ...data.content?.audio,
            volume: value,
          },
        },
      });
    }
  }, [id, data]);

  const handleMuteToggle = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleButtonsChange = useCallback((choices: Array<{ id: string; text: string }>) => {
    if (data.onDataChange) {
      data.onDataChange(id, {
        ...data,
        content: {
          ...data.content,
          choices,
        },
      });
    }
    setIsButtonDialogOpen(false);
  }, [id, data]);

  // Log initial data
  useEffect(() => {
    console.log('MediaNode mounted with ID:', id);
    console.log('MediaNode data:', data);
    console.log('MediaNode content:', data.content);
    console.log('MediaNode choices:', data.content?.choices);

    // Log handle configuration
    if (data.content?.choices) {
      data.content.choices.forEach(choice => {
        console.log(`Configuring handle for button ${choice.id}:`, {
          id: `button-handle-${choice.id}`,
          type: 'source',
          position: Position.Right
        });
      });
    }
  }, [id, data]);

  return (
    <Paper
      elevation={selected ? 8 : 2}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        minWidth: 320,
        maxWidth: 480,
        width: '100%',
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'visible',
        transition: 'all 0.2s ease-in-out',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        border: selected ? '2px solid #1976d2' : 'none',
        position: 'relative',
      }}
    >
      {/* Target handle pour les connexions entrantes */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '20px',
          display: 'flex',
          justifyContent: 'center',
          transform: 'translateY(-50%)',
          zIndex: 10,
        }}
      >
        <Handle
          type="target"
          position={Position.Top}
          id="default-handle"
          style={{
            background: '#1976d2',
            width: 10,
            height: 10,
            border: '2px solid white',
            zIndex: 10,
            cursor: 'pointer',
            visibility: 'visible',
          }}
          isConnectable={true}
          isValidConnection={(connection) => {
            console.log('Validating target connection:', connection);
            // On accepte les connexions depuis n'importe quel handle
            return true;
          }}
        />
      </Box>

      {/* Source handle pour les connexions sortantes par défaut */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '20px',
          display: 'flex',
          justifyContent: 'center',
          transform: 'translateY(50%)',
          zIndex: 10,
        }}
      >
        <Handle
          type="source"
          position={Position.Bottom}
          id="default-handle"
          style={{
            background: '#1976d2',
            width: 10,
            height: 10,
            border: '2px solid white',
            zIndex: 10,
            cursor: 'pointer',
            visibility: 'visible',
          }}
          isConnectable={true}
          isValidConnection={(connection) => {
            console.log('Validating source connection:', connection);
            return true;
          }}
        />
      </Box>

      {/* Contenu du nœud */}
      <Box sx={{ p: 2, position: 'relative' }}>
        {/* Media Display */}
        <Box 
          sx={{ 
            position: 'relative',
            width: '100%',
            height: 0,
            paddingBottom: '56.25%',
            backgroundColor: 'grey.900',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
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
            }}
          >
            {error ? (
              <Typography color="error">{error}</Typography>
            ) : mediaUrl ? (
              data.mediaType === 'video' ? (
                <video
                  src={mediaUrl}
                  controls={!data.isPlaybackMode}
                  autoPlay={data.isPlaybackMode}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onLoadedData={() => setIsMediaLoaded(true)}
                  onError={() => {
                    setError('Failed to load video');
                    setIsMediaLoaded(false);
                  }}
                  onEnded={handleVideoEnd}
                  muted={data.isPlaybackMode}
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt="Media content"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onLoad={() => {
                    setIsMediaLoaded(true);
                    if (data.isPlaybackMode) {
                      setShowButtons(true);
                    }
                  }}
                  onError={() => {
                    setError('Failed to load image');
                    setIsMediaLoaded(false);
                  }}
                />
              )
            ) : (
              <Typography>No media selected</Typography>
            )}

            {/* Controls Overlay */}
            {!data.isPlaybackMode && isHovered && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  display: 'flex',
                  gap: 0.5,
                  background: 'rgba(0, 0, 0, 0.7)',
                  borderRadius: 1,
                  padding: '4px',
                  backdropFilter: 'blur(4px)',
                  zIndex: 20,
                }}
              >
                <Tooltip title="Changer le média">
                  <IconButton
                    size="small"
                    onClick={() => setIsMediaDialogOpen(true)}
                    sx={{ color: 'white' }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Configuration audio">
                  <IconButton
                    size="small"
                    onClick={() => setIsAudioDialogOpen(true)}
                    sx={{ color: 'white' }}
                  >
                    <MusicNoteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Gérer les boutons">
                  <IconButton
                    size="small"
                    onClick={() => setIsButtonDialogOpen(true)}
                    sx={{ color: 'white' }}
                  >
                    <SmartButtonIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            {/* Audio Controls */}
            {audioUrl && !data.isPlaybackMode && isHovered && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  right: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  background: 'rgba(0, 0, 0, 0.7)',
                  borderRadius: 1,
                  padding: '4px 8px',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <IconButton
                  size="small"
                  onClick={handleMuteToggle}
                  sx={{ color: 'white' }}
                >
                  {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
                <Slider
                  size="small"
                  value={volume}
                  onChange={handleVolumeChange}
                  min={0}
                  max={1}
                  step={0.1}
                  sx={{ 
                    width: 100,
                    color: 'white',
                    '& .MuiSlider-thumb': {
                      width: 12,
                      height: 12,
                    },
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>

        {/* Boutons de choix toujours visibles */}
        {data.content?.choices && data.content.choices.length > 0 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: '20%',
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              alignItems: 'center',
              p: 2,
              zIndex: 1000,
            }}
          >
            {data.content.choices.map((choice) => (
              <Box
                key={choice.id}
                sx={{
                  position: 'relative',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Button
                  variant="contained"
                  onClick={() => data.onChoiceSelect?.(id, choice)}
                  sx={{
                    minWidth: '280px',
                    height: '64px',
                    fontSize: '1.2rem',
                    fontWeight: 500,
                    bgcolor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    color: 'white',
                    border: '2px solid rgba(255, 255, 255, 0.5)',
                    borderRadius: '32px',
                    textTransform: 'none',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.85)',
                      border: '2px solid rgba(255, 255, 255, 0.8)',
                      transform: 'scale(1.02)',
                      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.6)'
                    },
                    '&:active': {
                      bgcolor: 'rgba(0, 0, 0, 0.95)',
                      transform: 'scale(0.98)'
                    }
                  }}
                >
                  {choice.text}
                </Button>
                {!data.isPlaybackMode && (
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      right: -20,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 1001,
                    }}
                  >
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={`button-handle-${choice.id}`}
                      style={{
                        background: '#1976d2',
                        width: 8,
                        height: 8,
                        border: '2px solid white',
                        zIndex: 1001,
                        cursor: 'pointer',
                        visibility: 'visible',
                      }}
                      isConnectable={true}
                      isValidConnection={(connection) => {
                        console.log('Validating source connection:', {
                          connection,
                          handleId: `button-handle-${choice.id}`,
                          nodeId: id
                        });
                        return true;
                      }}
                    />
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Dialogs */}
      <Dialog
        open={isMediaDialogOpen}
        onClose={() => setIsMediaDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Select Media</DialogTitle>
        <DialogContent>
          <MediaLibrary
            onSelect={handleMediaSelect}
            acceptedTypes={['video/*', 'image/*']}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAudioDialogOpen}
        onClose={() => setIsAudioDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Select Audio</DialogTitle>
        <DialogContent>
          <MediaLibrary
            onSelect={handleAudioSelect}
            acceptedTypes={['audio/*']}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isButtonDialogOpen}
        onClose={() => setIsButtonDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Button Configuration</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {editedChoices.map((choice, index) => (
              <Box key={choice.id} sx={{ mb: 2, display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label={`Button ${index + 1} text`}
                  value={choice.text}
                  onChange={(event) => {
                    const newChoices = [...editedChoices];
                    newChoices[index] = { ...newChoices[index], text: event.target.value };
                    setEditedChoices(newChoices);
                  }}
                />
                <IconButton
                  onClick={() => {
                    const newChoices = [...editedChoices];
                    newChoices.splice(index, 1);
                    setEditedChoices(newChoices);
                  }}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={() => {
                setEditedChoices([
                  ...editedChoices,
                  { id: crypto.randomUUID(), text: '' }
                ]);
              }}
              sx={{ mt: 1 }}
            >
              Add Button
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsButtonDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              handleButtonsChange(editedChoices);
              setIsButtonDialogOpen(false);
            }}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default MediaNode;
