import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Slider,
  Typography,
  Stack,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Close,
  MusicNote,
} from '@mui/icons-material';
import ReactPlayer from 'react-player';
import { MediaFile } from '../../types/media';

interface MediaPreviewProps {
  open: boolean;
  onClose: () => void;
  mediaFile: MediaFile;
}

export default function MediaPreview({ open, onClose, mediaFile }: MediaPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!open) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [open]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
    const newVolume = newValue as number;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (_event: Event, newValue: number | number[]) => {
    const newTime = newValue as number;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSeekCommitted = (_event: Event | React.SyntheticEvent, newValue: number | number[]) => {
    const newTime = newValue as number;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const renderPreview = () => {
    switch (mediaFile.metadata.type) {
      case 'video':
        return (
          <ReactPlayer
            url={mediaFile.url}
            playing={isPlaying}
            controls
            width="100%"
            height="auto"
            style={{ aspectRatio: '16/9' }}
            volume={volume}
            muted={isMuted}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        );
      case 'image':
        return (
          <Box
            component="img"
            src={mediaFile.url}
            alt={mediaFile.metadata.name}
            sx={{
              width: '100%',
              height: 'auto',
              maxHeight: '80vh',
              objectFit: 'contain',
            }}
          />
        );
      case 'audio':
        return (
          <Box sx={{ 
            p: 3,
            bgcolor: 'background.paper',
            borderRadius: 1,
            boxShadow: 1,
          }}>
            <Stack spacing={3}>
              {/* Titre et Waveform */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 2,
                mb: 2 
              }}>
                <Box sx={{
                  width: 50,
                  height: 50,
                  borderRadius: 1,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <MusicNote sx={{ color: 'white', fontSize: 30 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    {mediaFile.metadata.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatTime(duration)}
                  </Typography>
                </Box>
              </Box>

              {/* Contrôles de lecture */}
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                bgcolor: 'background.default',
                p: 2,
                borderRadius: 1,
              }}>
                {/* Bouton Play et Timeline */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IconButton 
                    onClick={handlePlayPause}
                    sx={{
                      width: 45,
                      height: 45,
                      bgcolor: 'primary.main',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                    }}
                  >
                    {isPlaying ? 
                      <Pause sx={{ color: 'white' }} /> : 
                      <PlayArrow sx={{ color: 'white' }} />
                    }
                  </IconButton>
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 45 }}>
                      {formatTime(currentTime)}
                    </Typography>
                    <Slider
                      value={currentTime}
                      max={duration}
                      onChange={handleSeek}
                      onChangeCommitted={handleSeekCommitted}
                      aria-label="time-indicator"
                      size="small"
                      sx={{
                        color: 'primary.main',
                        '& .MuiSlider-thumb': {
                          width: 12,
                          height: 12,
                          '&:before': {
                            boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
                          },
                          '&:hover, &.Mui-focusVisible': {
                            boxShadow: '0px 0px 0px 8px rgba(25, 118, 210, 0.16)',
                          },
                        },
                        '& .MuiSlider-rail': {
                          opacity: 0.28,
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 45 }}>
                      {formatTime(duration)}
                    </Typography>
                  </Box>
                </Box>

                {/* Volume */}
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: 'background.paper',
                  p: 1,
                  borderRadius: 1,
                }}>
                  <IconButton 
                    onClick={handleMuteToggle}
                    size="small"
                    sx={{ color: 'text.secondary' }}
                  >
                    {isMuted ? <VolumeOff /> : <VolumeUp />}
                  </IconButton>
                  <Slider
                    size="small"
                    value={volume}
                    onChange={handleVolumeChange}
                    min={0}
                    max={1}
                    step={0.01}
                    aria-label="Volume"
                    sx={{
                      width: 100,
                      color: 'text.secondary',
                      '& .MuiSlider-rail': {
                        opacity: 0.28,
                      },
                    }}
                  />
                </Box>
              </Box>
            </Stack>

            <audio
              ref={audioRef}
              src={mediaFile.url}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={() => {
                if (audioRef.current) {
                  setDuration(audioRef.current.duration);
                }
              }}
              onEnded={() => setIsPlaying(false)}
            />
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: mediaFile.metadata.type === 'video' ? 'black' : 'background.paper',
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        <Typography variant="h6" component="div" sx={{ pr: 6 }}>
          {mediaFile.metadata.name}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: mediaFile.metadata.type === 'video' ? 0 : 2 }}>
        {renderPreview()}
      </DialogContent>
    </Dialog>
  );
}
