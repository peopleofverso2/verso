import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Box,
  Paper,
  Slider,
  Stack,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Movie as MovieIcon,
  Image as ImageIcon,
  Timer as TimerIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  SmartButton as SmartButtonIcon,
  MusicNote as MusicNoteIcon,
} from '@mui/icons-material';
import MediaLibrary from '../../../components/MediaLibrary/MediaLibrary';
import { MediaFile } from '../../../types';
import { MediaLibraryService } from '../../../services/MediaLibraryService';
import TimerSettings from './TimerSettings';

interface MediaNodeProps {
  id: string;
  data: {
    mediaId?: string;
    mediaType?: 'video' | 'image';
    audioId?: string;
    content?: {
      timer?: {
        duration: number;
        autoTransition: boolean;
        loop: boolean;
      };
      audio?: {
        loop?: boolean;
        volume?: number;
        fadeIn?: number;
        fadeOut?: number;
        autoPlay?: boolean;
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

interface AudioState {
  volume: number;
  isMuted: boolean;
  isPlaying: boolean;
  fadeInDuration: number;
  fadeOutDuration: number;
}

const DEFAULT_FADE_DURATION = 1000; // 1 second

const MediaNode: React.FC<MediaNodeProps> = ({ id, data, selected }) => {
  // Media states
  const [mediaUrl, setMediaUrl] = useState<string>();
  const [audioUrl, setAudioUrl] = useState<string>();
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [isAudioDialogOpen, setIsAudioDialogOpen] = useState(false);
  const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false);
  const [isButtonDialogOpen, setIsButtonDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState<string>();
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>();
  const [isPlaying, setIsPlaying] = useState(false);

  // Audio states
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const [audioState, setAudioState] = useState<AudioState>({
    volume: data.content?.audio?.volume ?? 1,
    isMuted: false,
    isPlaying: false,
    fadeInDuration: data.content?.audio?.fadeIn ?? DEFAULT_FADE_DURATION,
    fadeOutDuration: data.content?.audio?.fadeOut ?? DEFAULT_FADE_DURATION
  });

  // New state for button visibility
  const [showButtons, setShowButtons] = useState(false);

  // New state for button management
  const [newButtonText, setNewButtonText] = useState('');

  // Load media on mount and when mediaId changes
  useEffect(() => {
    const loadMedia = async () => {
      if (!data.mediaId) {
        setMediaUrl(undefined);
        setDimensions(undefined);
        return;
      }
      try {
        console.log('Loading media for node:', id);
        const mediaLibrary = await MediaLibraryService.getInstance();
        const media = await mediaLibrary.getMedia(data.mediaId);
        console.log('Media loaded:', media);
        
        if (media && media.url) {
          setMediaUrl(media.url);
          if (media.metadata.dimensions) {
            setDimensions(media.metadata.dimensions);
          }
          if (media.metadata.type) {
            data.onDataChange?.(id, {
              ...data,
              mediaType: media.metadata.type
            });
          }
          setError(undefined);
        } else {
          console.error('Media or URL is missing');
          setError('Media not found');
        }
      } catch (error) {
        console.error('Error loading media:', error);
        setError('Failed to load media');
      }
    };
    loadMedia();
    
    // Cleanup function
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
    };
  }, [data.mediaId, id]);

  // Load audio on mount and when audioId changes
  useEffect(() => {
    let audioUrl: string | null = null;

    const setupAudio = async () => {
      if (data.audioId) {
        try {
          const mediaLibrary = await MediaLibraryService.getInstance();
          const audioFile = await mediaLibrary.getMediaFile(data.audioId);
          if (audioFile) {
            audioUrl = URL.createObjectURL(audioFile.file);
            if (audioRef.current) {
              audioRef.current.src = audioUrl;
              audioRef.current.volume = audioState.volume;
              audioRef.current.loop = data.content?.audio?.loop ?? true;
            }
          }
        } catch (error) {
          console.error('Error loading audio:', error);
        }
      }
    };

    setupAudio();

    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [data.audioId]);

  // Gestion du fade in/out
  const fadeVolume = useCallback((start: number, end: number, duration: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const steps = 20;
    const stepTime = duration / steps;
    const volumeStep = (end - start) / steps;
    
    let currentStep = 0;

    const fade = () => {
      if (!audio || currentStep >= steps) return;
      
      audio.volume = start + (volumeStep * currentStep);
      currentStep++;
      
      if (currentStep < steps) {
        setTimeout(fade, stepTime);
      } else {
        audio.volume = end;
      }
    };

    fade();
  }, []);

  // Gestion de la lecture audio
  const handlePlayAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audioState.isPlaying) {
      audio.volume = 0;
      audio.play()
        .then(() => {
          fadeVolume(0, audioState.volume, audioState.fadeInDuration);
          setAudioState(prev => ({ ...prev, isPlaying: true }));
        })
        .catch(error => console.error('Error playing audio:', error));
    }
  }, [audioState.volume, audioState.fadeInDuration, audioState.isPlaying, fadeVolume]);

  const handlePauseAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioState.isPlaying) {
      fadeVolume(audio.volume, 0, audioState.fadeOutDuration);
      setTimeout(() => {
        audio.pause();
        setAudioState(prev => ({ ...prev, isPlaying: false }));
      }, audioState.fadeOutDuration);
    }
  }, [audioState.fadeOutDuration, audioState.isPlaying, fadeVolume]);

  // Gestion du volume
  const handleVolumeChange = useCallback((event: Event, newValue: number | number[]) => {
    const newVolume = newValue as number;
    setAudioState(prev => ({ ...prev, volume: newVolume }));
    
    if (audioRef.current && !audioState.isMuted) {
      audioRef.current.volume = newVolume;
    }

    if (data.onDataChange) {
      data.onDataChange(id, {
        ...data,
        content: {
          ...data.content,
          audio: {
            ...data.content?.audio,
            volume: newVolume
          }
        }
      });
    }
  }, [id, data, audioState.isMuted]);

  // Gestion du mute
  const handleMuteToggle = useCallback(() => {
    setAudioState(prev => {
      const newIsMuted = !prev.isMuted;
      if (audioRef.current) {
        audioRef.current.volume = newIsMuted ? 0 : prev.volume;
      }
      return { ...prev, isMuted: newIsMuted };
    });
  }, []);

  // Auto-play en mode lecture
  useEffect(() => {
    if (data.isPlaybackMode && data.content?.audio?.autoPlay) {
      handlePlayAudio();
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [data.isPlaybackMode, data.content?.audio?.autoPlay, handlePlayAudio]);

  // Playback control effect
  useEffect(() => {
    if (data.isPlaybackMode) {
      // Démarrer la lecture automatiquement en mode playback
      if (videoRef.current) {
        videoRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
      if (audioRef.current) {
        // Appliquer le fade-in si configuré
        if (data.content?.audio?.fadeIn) {
          audioRef.current.volume = 0;
          const targetVolume = data.content.audio.volume ?? 1;
          const fadeInDuration = data.content.audio.fadeIn * 1000;
          const steps = 50;
          const stepTime = fadeInDuration / steps;
          const volumeStep = targetVolume / steps;

          let currentStep = 0;
          const fadeInterval = setInterval(() => {
            currentStep++;
            if (audioRef.current && currentStep <= steps) {
              audioRef.current.volume = volumeStep * currentStep;
            } else {
              clearInterval(fadeInterval);
            }
          }, stepTime);
        }
        handlePlayAudio();
      }
    } else {
      // Arrêter la lecture si on n'est pas en mode playback
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      if (audioRef.current) {
        handlePauseAudio();
      }
    }

    // Cleanup function
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      if (audioRef.current) {
        // Appliquer le fade-out si configuré
        if (data.content?.audio?.fadeOut) {
          const currentVolume = audioRef.current.volume;
          const fadeOutDuration = data.content.audio.fadeOut * 1000;
          const steps = 50;
          const stepTime = fadeOutDuration / steps;
          const volumeStep = currentVolume / steps;

          let currentStep = 0;
          const fadeInterval = setInterval(() => {
            currentStep++;
            if (audioRef.current && currentStep <= steps) {
              audioRef.current.volume = currentVolume - (volumeStep * currentStep);
            } else {
              if (audioRef.current) {
                audioRef.current.pause();
              }
              clearInterval(fadeInterval);
            }
          }, stepTime);
        } else {
          audioRef.current.pause();
        }
      }
    };
  }, [data.isPlaybackMode, data.content?.audio]);

  // Initialize audio/video properties
  useEffect(() => {
    const initializeMedia = () => {
      if (audioRef.current) {
        audioRef.current.volume = audioState.volume;
        audioRef.current.muted = audioState.isMuted;
        audioRef.current.loop = data.content?.audio?.loop ?? false;
      }
      if (videoRef.current) {
        videoRef.current.volume = audioState.volume;
        videoRef.current.muted = audioState.isMuted;
        videoRef.current.loop = data.content?.timer?.loop ?? false;
      }
    };

    initializeMedia();
  }, [audioState.volume, audioState.isMuted, data.content?.audio?.loop, data.content?.timer?.loop, mediaUrl, audioUrl]);

  // Timer effect for images
  useEffect(() => {
    if (data.mediaType === 'image' && data.isPlaybackMode) {
      // Show buttons immediately if no timer or timer is 0
      if (!data.content?.timer?.duration || data.content.timer.duration === 0) {
        setShowButtons(true);
        return;
      }

      // Reset buttons visibility
      setShowButtons(false);

      if (data.content?.timer?.autoTransition) {
        const startTimer = () => {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }
          
          timerRef.current = setTimeout(() => {
            // Show buttons when timer expires
            setShowButtons(true);
            
            // Handle auto-transition if no choices are available
            if (!data.content?.choices?.length) {
              if (data.onMediaEnd) {
                data.onMediaEnd(id);
              }
              if (data.content?.timer?.loop) {
                startTimer();
              }
            }
          }, data.content.timer.duration * 1000);
        };

        startTimer();
        return () => {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }
        };
      } else {
        // If timer exists but auto-transition is off, just show buttons after timer
        const timer = setTimeout(() => {
          setShowButtons(true);
        }, data.content.timer.duration * 1000);
        
        return () => clearTimeout(timer);
      }
    } else if (!data.isPlaybackMode) {
      // Reset buttons visibility when not in playback mode
      setShowButtons(false);
    }
  }, [id, data.mediaType, data.content?.timer, data.isPlaybackMode, data.onMediaEnd, data.content?.choices]);

  // Handle media selection
  const handleMediaSelect = useCallback(async (mediaFiles: MediaFile[]) => {
    if (!mediaFiles.length || !data.onDataChange) return;

    try {
      const mediaFile = mediaFiles[0];
      const newData = {
        ...data,
        mediaId: mediaFile.id,
        mediaType: mediaFile.metadata.type,
      };
      setMediaUrl(mediaFile.url);
      data.onDataChange(id, newData);
      setIsMediaDialogOpen(false);
    } catch (error) {
      console.error('Error selecting media:', error);
      setError('Failed to select media');
    }
  }, [id, data, data.onDataChange]);

  // Handle audio selection
  const handleAudioSelect = useCallback(async (mediaFiles: MediaFile[]) => {
    if (!mediaFiles.length || !data.onDataChange) return;

    try {
      const audioFile = mediaFiles[0];
      const newData = {
        ...data,
        audioId: audioFile.id,
        content: {
          ...data.content,
          audio: {
            ...data.content?.audio,
            volume: 1,
            loop: true,
          },
        },
      };
      setAudioUrl(audioFile.url);
      data.onDataChange(id, newData);
      setIsAudioDialogOpen(false);
    } catch (error) {
      console.error('Error selecting audio:', error);
      setError('Failed to select audio');
    }
  }, [id, data, data.onDataChange]);

  // Handle button management
  const handleAddButton = useCallback(() => {
    if (!newButtonText.trim() || !data.onDataChange) return;

    const newButton = {
      id: `btn-${Date.now()}`,
      text: newButtonText.trim()
    };

    const newData = {
      ...data,
      content: {
        ...data.content,
        choices: [...(data.content?.choices || []), newButton]
      }
    };

    data.onDataChange(id, newData);
    setNewButtonText('');
  }, [id, data, newButtonText]);

  const handleRemoveButton = useCallback((buttonId: string) => {
    if (!data.onDataChange) return;

    const newData = {
      ...data,
      content: {
        ...data.content,
        choices: data.content?.choices?.filter(choice => choice.id !== buttonId) || []
      }
    };

    data.onDataChange(id, newData);
  }, [id, data, data.onDataChange]);

  const handleEditButtonText = useCallback((buttonId: string, newText: string) => {
    if (!data.onDataChange) return;

    const newData = {
      ...data,
      content: {
        ...data.content,
        choices: data.content?.choices?.map(choice => 
          choice.id === buttonId ? { ...choice, text: newText } : choice
        ) || []
      }
    };

    data.onDataChange(id, newData);
  }, [id, data, data.onDataChange]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Handle type="target" position={Position.Top} />
      <Paper
        elevation={1}
        sx={{
          position: 'relative',
          width: '100%',
          minWidth: 200,
          minHeight: 150,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 1,
          border: '1px solid',
          borderColor: selected ? 'primary.main' : 'divider',
          overflow: 'hidden',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Media Display */}
        <Box 
          sx={{ 
            position: 'relative',
            width: '100%',
            paddingBottom: '56.25%', // Ratio 16:9
            flex: 1,
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
              overflow: 'hidden',
            }}
          >
            {data.mediaType === 'video' ? (
              <video
                ref={videoRef}
                src={mediaUrl}
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
                controls={!data.isPlaybackMode}
                onEnded={() => {
                  if (data.onMediaEnd) {
                    data.onMediaEnd(id);
                  }
                  if (data.content?.timer?.loop) {
                    videoRef.current?.play();
                  }
                }}
              />
            ) : data.mediaType === 'image' ? (
              <img
                src={mediaUrl}
                alt="Media content"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'background.default',
                  color: 'text.secondary',
                }}
              >
                {error ? (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <MovieIcon sx={{ fontSize: 40, mb: 1 }} />
                    <div>{error}</div>
                  </Box>
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <MovieIcon sx={{ fontSize: 40, mb: 1 }} />
                    <div>Cliquez pour ajouter un média</div>
                  </Box>
                )}
              </Box>
            )}

            {/* Audio Element */}
            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                loop={data.content?.audio?.loop}
                muted={audioState.isMuted}
                preload="auto"
                onError={(e) => {
                  console.error('Audio error:', e);
                  setError('Failed to play audio');
                }}
              />
            )}

            {/* Controls Overlay */}
            {!data.isPlaybackMode && isHovered && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  p: 1,
                  display: 'flex',
                  gap: 1,
                  background: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '0 0 0 4px',
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => setIsMediaDialogOpen(true)}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  <EditIcon />
                </IconButton>
                {data.mediaType === 'image' && (
                  <>
                    <IconButton
                      size="small"
                      onClick={() => setIsTimerDialogOpen(true)}
                      sx={{ bgcolor: 'background.paper' }}
                    >
                      <TimerIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setIsButtonDialogOpen(true)}
                      sx={{ bgcolor: 'background.paper' }}
                    >
                      <SmartButtonIcon />
                    </IconButton>
                  </>
                )}
                <IconButton
                  size="small"
                  onClick={() => setIsAudioDialogOpen(true)}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  <MusicNoteIcon />
                </IconButton>
              </Box>
            )}

            {/* Volume Controls */}
            {(audioUrl || data.mediaType === 'video') && !data.isPlaybackMode && isHovered && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 1,
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <IconButton
                  size="small"
                  onClick={handleMuteToggle}
                  sx={{ color: 'white' }}
                >
                  {audioState.isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
                <Slider
                  size="small"
                  value={audioState.volume}
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

        <Handle type="source" position={Position.Bottom} />
      </Paper>

      {/* Button Handles */}
      {(!data.isPlaybackMode || showButtons) && data.content?.choices?.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            p: 1,
            width: '100%',
            maxWidth: '300px',
            margin: '8px auto 0',
          }}
        >
          {data.content.choices.map((choice) => (
            <Box
              key={choice.id}
              sx={{
                position: 'relative',
                width: '100%',
              }}
            >
              <Handle
                type="source"
                position={Position.Right}
                id={`button-handle-${choice.id}`}
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
                  right: '-15px',
                  width: '15px',
                  height: '15px',
                  background: '#555',
                  border: '2px solid #fff',
                  zIndex: 1000,
                  cursor: 'crosshair',
                }}
              />
              <Button
                variant="contained"
                fullWidth
                onClick={() => data.onChoiceSelect?.(id, choice)}
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(8px)',
                  color: '#fff',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.9)',
                    borderColor: 'white',
                  },
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {choice.text}
              </Button>
            </Box>
          ))}
        </Box>
      )}

      {/* Media Selection Dialog */}
      <Dialog
        open={isMediaDialogOpen}
        onClose={() => setIsMediaDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Select Media</DialogTitle>
        <DialogContent sx={{ minHeight: '80vh', p: 0 }}>
          <MediaLibrary
            onSelect={handleMediaSelect}
            acceptedTypes={['video/mp4', 'video/webm', 'image/jpeg', 'image/png', 'image/gif']}
          />
        </DialogContent>
      </Dialog>

      {/* Audio Selection Dialog */}
      <Dialog
        open={isAudioDialogOpen}
        onClose={() => setIsAudioDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Select Audio</DialogTitle>
        <DialogContent sx={{ minHeight: '80vh', p: 0 }}>
          <MediaLibrary
            onSelect={handleAudioSelect}
            acceptedTypes={['audio/mpeg', 'audio/wav', 'audio/ogg']}
          />
        </DialogContent>
      </Dialog>

      {/* Timer Settings Dialog */}
      {data.mediaType === 'image' && (
        <TimerSettings
          open={isTimerDialogOpen}
          onClose={() => setIsTimerDialogOpen(false)}
          timer={{
            duration: data.content?.timer?.duration ?? 5,
            autoTransition: data.content?.timer?.autoTransition ?? false,
            loop: data.content?.timer?.loop ?? false,
          }}
          onSave={(timer) => {
            if (data.onDataChange) {
              data.onDataChange(id, {
                ...data,
                content: {
                  ...data.content,
                  timer,
                },
              });
            }
          }}
        />
      )}

      {/* Button Editor Dialog */}
      <Dialog
        open={isButtonDialogOpen}
        onClose={() => setIsButtonDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Gérer les Boutons</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {/* Add new button */}
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <TextField
                fullWidth
                label="Texte du bouton"
                value={newButtonText}
                onChange={(e) => setNewButtonText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddButton();
                  }
                }}
              />
              <Tooltip title="Ajouter">
                <IconButton
                  onClick={handleAddButton}
                  color="primary"
                  disabled={!newButtonText.trim()}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Button list */}
            <List>
              {data.content?.choices?.map((choice) => (
                <ListItem
                  key={choice.id}
                  sx={{
                    bgcolor: 'background.paper',
                    mb: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <TextField
                    fullWidth
                    value={choice.text}
                    onChange={(e) => handleEditButtonText(choice.id, e.target.value)}
                    variant="standard"
                    sx={{ mr: 2 }}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Supprimer">
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveButton(choice.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsButtonDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {error && (
        <Box sx={{ mt: 2, color: 'error.main' }}>
          {error}
        </Box>
      )}
    </div>
  );
};

export default MediaNode;
