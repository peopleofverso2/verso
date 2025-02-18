import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Slider,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import { VideoPlayer } from '../Editor/nodes/video/VideoPlayer';

interface PlaybackFullscreenProps {
  url: string;
  onClose: () => void;
  autoPlay?: boolean;
  loop?: boolean;
  showControls?: boolean;
}

export const PlaybackFullscreen: React.FC<PlaybackFullscreenProps> = ({
  url,
  onClose,
  autoPlay = true,
  loop = true,
  showControls = true,
}) => {
  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const handlePlayPause = useCallback(() => {
    setPlaying(!playing);
  }, [playing]);

  const handleMuteToggle = useCallback(() => {
    setMuted(!muted);
  }, [muted]);

  const handleVolumeChange = useCallback((_: Event, newValue: number | number[]) => {
    setVolume(newValue as number);
  }, []);

  const handleProgress = useCallback((state: { played: number; playedSeconds: number }) => {
    setProgress(state.played * 100);
  }, []);

  const handleDuration = useCallback((duration: number) => {
    setDuration(duration);
  }, []);

  const handleSeek = useCallback((_: Event, newValue: number | number[]) => {
    setProgress(newValue as number);
    return newValue as number / 100;
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'black',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: 'white',
        }}
      >
        <CloseIcon />
      </IconButton>

      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <VideoPlayer
          url={url}
          playing={playing}
          loop={loop}
          muted={muted}
          volume={volume}
          onProgress={handleProgress}
          onDuration={handleDuration}
          width="100%"
          height="100%"
          style={{ objectFit: 'contain' }}
        />

        {showControls && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              p: 2,
            }}
          >
            <Stack spacing={1}>
              <Slider
                value={progress}
                onChange={handleSeek}
                sx={{
                  color: 'white',
                  '& .MuiSlider-thumb': {
                    width: 12,
                    height: 12,
                  },
                }}
              />
              
              <Stack direction="row" spacing={2} alignItems="center">
                <IconButton onClick={handlePlayPause} sx={{ color: 'white' }}>
                  {playing ? <PauseIcon /> : <PlayIcon />}
                </IconButton>

                <Box sx={{ position: 'relative' }}>
                  <IconButton
                    onClick={handleMuteToggle}
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                    sx={{ color: 'white' }}
                  >
                    {muted || volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
                  </IconButton>

                  {showVolumeSlider && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 100,
                        height: 100,
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                        p: 1,
                        borderRadius: 1,
                      }}
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      onMouseLeave={() => setShowVolumeSlider(false)}
                    >
                      <Slider
                        value={volume}
                        onChange={handleVolumeChange}
                        orientation="vertical"
                        min={0}
                        max={1}
                        step={0.1}
                        sx={{ color: 'white' }}
                      />
                    </Box>
                  )}
                </Box>

                <Typography variant="body2" sx={{ color: 'white', flexGrow: 1 }}>
                  {formatTime(duration * (progress / 100))} / {formatTime(duration)}
                </Typography>

                <IconButton onClick={handleFullscreenToggle} sx={{ color: 'white' }}>
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Stack>
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
};
