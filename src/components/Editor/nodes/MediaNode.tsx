import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Slider,
  Stack,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ErrorIcon from '@mui/icons-material/Error';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import MediaLibrary from '../../../components/MediaLibrary/MediaLibrary';
import { MediaFile } from '../../../types';
import { MediaLibraryService } from '../../../services/MediaLibraryService';
import TimerSettings from './TimerSettings';
import { useTheme } from '@mui/material/styles';

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

  // Styles pour le MediaNode
  const theme = useTheme();
  const nodeStyles = {
    root: {
      border: (theme: any) => `2px solid ${selected ? theme.palette.primary.main : theme.palette.grey[300]}`,
      borderRadius: 1,
      padding: 1,
      backgroundColor: 'background.paper',
      position: 'relative',
      minWidth: 250,
      maxWidth: 400,
      '&:hover': {
        '& .media-controls': {
          opacity: 1,
        },
      },
    },
    mediaContainer: {
      position: 'relative',
      width: '100%',
      minHeight: 150,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderRadius: 1,
      backgroundColor: 'grey.900',
    },
    controls: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 1,
      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)',
      display: 'flex',
      alignItems: 'center',
      opacity: 0,
      transition: 'opacity 0.3s ease',
      '&:hover': {
        opacity: 1,
      },
    },
    buttonContainer: {
      marginTop: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
    },
    choiceButton: {
      width: '100%',
      justifyContent: 'flex-start',
      textAlign: 'left',
      position: 'relative',
      '&:hover .button-actions': {
        opacity: 1,
      },
    },
    buttonActions: {
      position: 'absolute',
      right: 8,
      opacity: 0,
      transition: 'opacity 0.2s ease',
      display: 'flex',
      gap: 0.5,
    },
    addButtonForm: {
      display: 'flex',
      gap: 1,
      marginTop: 1,
    },
  };

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
  const handleVolumeChange = useCallback((event: any, newValue: number | number[]) => {
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

  // Rendu des boutons de choix
  const renderChoiceButtons = () => {
    if (!data.content?.choices?.length && !data.isPlaybackMode) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
          Aucun bouton ajouté. Utilisez le formulaire ci-dessous pour en ajouter.
        </Typography>
      );
    }

    return data.content?.choices?.map((choice, index) => (
      <Box key={choice.id} sx={{ position: 'relative' }}>
        {data.isPlaybackMode ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => data.onChoiceSelect?.(id, choice)}
            sx={nodeStyles.choiceButton}
            disabled={!showButtons}
          >
            {choice.text}
          </Button>
        ) : (
          <Paper
            elevation={1}
            sx={{
              p: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: 'background.default',
            }}
          >
            <DragIndicatorIcon color="action" sx={{ cursor: 'move' }} />
            <TextField
              size="small"
              value={choice.text}
              onChange={(e) => handleEditButtonText(choice.id, e.target.value)}
              fullWidth
              variant="standard"
              InputProps={{
                endAdornment: (
                  <Box className="button-actions" sx={nodeStyles.buttonActions}>
                    <Tooltip title="Supprimer">
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveButton(choice.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ),
              }}
            />
          </Paper>
        )}
      </Box>
    ));
  };

  // Rendu du formulaire d'ajout de bouton
  const renderAddButtonForm = () => {
    if (data.isPlaybackMode) return null;

    return (
      <Box sx={nodeStyles.addButtonForm}>
        <TextField
          size="small"
          value={newButtonText}
          onChange={(e) => setNewButtonText(e.target.value)}
          placeholder="Texte du bouton"
          fullWidth
          variant="outlined"
        />
        <Button
          variant="contained"
          onClick={handleAddButton}
          disabled={!newButtonText.trim()}
          startIcon={<AddIcon />}
        >
          Ajouter
        </Button>
      </Box>
    );
  };

  // Rendu des contrôles média
  const renderMediaControls = () => {
    if (!data.isPlaybackMode) return null;

    return (
      <Box
        className="media-controls"
        sx={nodeStyles.controls}
      >
        <Stack direction="row" spacing={1} alignItems="center" width="100%">
          <IconButton
            size="small"
            onClick={audioState.isPlaying ? handlePauseAudio : handlePlayAudio}
            sx={{ color: 'white' }}
          >
            {audioState.isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
          
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
            step={0.01}
            sx={{
              width: 100,
              color: 'white',
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
              },
              '& .MuiSlider-rail, & .MuiSlider-track': {
                height: 4,
              },
            }}
          />

          {error && (
            <Tooltip title={error}>
              <ErrorIcon color="error" fontSize="small" />
            </Tooltip>
          )}
        </Stack>
      </Box>
    );
  };

  // Rendu principal du composant
  return (
    <Box sx={nodeStyles.root}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={true}
      />

      {/* Container média */}
      <Box sx={nodeStyles.mediaContainer}>
        {data.mediaType === 'image' && mediaUrl && (
          <img
            src={mediaUrl}
            alt="Media content"
            style={{
              maxWidth: '100%',
              maxHeight: '300px',
              objectFit: 'contain',
            }}
          />
        )}

        {data.mediaType === 'video' && mediaUrl && (
          <video
            ref={videoRef}
            src={mediaUrl}
            controls={!data.isPlaybackMode}
            style={{
              maxWidth: '100%',
              maxHeight: '300px',
            }}
          />
        )}

        {/* Contrôles média */}
        {renderMediaControls()}

        {/* Audio caché */}
        <audio
          ref={audioRef}
          style={{ display: 'none' }}
        />
      </Box>

      {/* Boutons de choix */}
      <Box sx={nodeStyles.buttonContainer}>
        {renderChoiceButtons()}
        {renderAddButtonForm()}
      </Box>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={true}
      />

      {/* Actions du nœud */}
      {!data.isPlaybackMode && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Button
            size="small"
            startIcon={<ImageIcon />}
            onClick={() => setIsMediaDialogOpen(true)}
          >
            {data.mediaId ? 'Changer' : 'Ajouter'} média
          </Button>
          <Button
            size="small"
            startIcon={<MusicNoteIcon />}
            onClick={() => setIsAudioDialogOpen(true)}
          >
            {data.audioId ? 'Changer' : 'Ajouter'} audio
          </Button>
        </Box>
      )}

      {/* Dialogs */}
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
            acceptedTypes={['image/*', 'video/*']}
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
        <DialogContent sx={{ minHeight: '80vh', p: 0 }}>
          <MediaLibrary
            onSelect={handleAudioSelect}
            acceptedTypes={['audio/*']}
          />
        </DialogContent>
      </Dialog>

      {error && (
        <Box sx={{ mt: 2, color: 'error.main' }}>
          {error}
        </Box>
      )}
    </Box>
  );
};

export default MediaNode;
