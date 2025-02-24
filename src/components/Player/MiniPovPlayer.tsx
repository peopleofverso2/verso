import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { MediaLibraryService } from '../../services/MediaLibraryService';
import { MediaFile } from '../../types/media';

interface MiniPovPlayerProps {
  scenario: {
    nodes: {
      id: string;
      data: {
        mediaId?: string;
        content?: {
          videoUrl?: string;
          video?: {
            url?: string;
            name?: string;
          };
        };
      };
    }[];
  };
  isHovered?: boolean;
}

const MiniPovPlayer: React.FC<MiniPovPlayerProps> = ({
  scenario,
  isHovered = false
}) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolume] = useState(1);
  const mediaLibrary = useRef<MediaLibraryService | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Charger le média du premier nœud
  useEffect(() => {
    const loadFirstNodeMedia = async () => {
      console.log('MiniPovPlayer: Loading first node media', { scenario });
      
      if (!scenario || !scenario.nodes || !Array.isArray(scenario.nodes) || scenario.nodes.length === 0) {
        console.error('Invalid scenario structure:', scenario);
        setIsLoading(false);
        return;
      }

      const firstNode = scenario.nodes[0];
      const mediaId = firstNode.data?.mediaId;
      console.log('MiniPovPlayer: First node media ID:', mediaId);

      if (!mediaId) {
        // Essayer de récupérer l'URL de la vidéo depuis content
        const videoUrl = firstNode.data?.content?.videoUrl || firstNode.data?.content?.video?.url;
        console.log('MiniPovPlayer: Trying video URL from content:', videoUrl);
        if (videoUrl) {
          setMediaUrl(videoUrl);
          setMediaType('video');
          setIsLoading(false);
          return;
        }
        console.warn('No media ID or video URL found in first node');
        setIsLoading(false);
        return;
      }

      try {
        if (!mediaLibrary.current) {
          console.log('MiniPovPlayer: Initializing MediaLibraryService');
          mediaLibrary.current = await MediaLibraryService.getInstance();
        }

        console.log('MiniPovPlayer: Loading media with ID:', mediaId);
        const media = await mediaLibrary.current.getMedia(mediaId);
        console.log('MiniPovPlayer: Media loaded:', media);
        
        if (media?.url) {
          setMediaUrl(media.url);
          setMediaType(media.metadata.type as 'video' | 'image');
          console.log('MiniPovPlayer: Media URL and type set:', {
            url: media.url,
            type: media.metadata.type
          });
        }
      } catch (error) {
        console.error('MiniPovPlayer: Error loading media:', error);
      }
      
      setIsLoading(false);
    };

    loadFirstNodeMedia();
  }, [scenario]);

  // Gérer la lecture/pause et le volume en fonction du hover
  useEffect(() => {
    if (!videoRef.current || !mediaUrl) return;

    const video = videoRef.current;
    console.log('MiniPovPlayer: Video element state:', {
      currentTime: video.currentTime,
      paused: video.paused,
      volume: video.volume,
      isHovered
    });

    if (isHovered) {
      // Démarrer la lecture et monter progressivement le volume
      console.log('MiniPovPlayer: Starting playback on hover');
      video.play().catch(error => {
        console.error('MiniPovPlayer: Error playing video:', error);
      });
      
      // Fade in du volume
      let currentVolume = 0;
      const fadeInterval = setInterval(() => {
        currentVolume = Math.min(currentVolume + 0.1, volume);
        video.volume = currentVolume;
        console.log('MiniPovPlayer: Fading in volume:', currentVolume);
        if (currentVolume >= volume) {
          clearInterval(fadeInterval);
        }
      }, 50);

    } else {
      // Fade out du volume et pause
      console.log('MiniPovPlayer: Starting fade out');
      let currentVolume = video.volume;
      const fadeInterval = setInterval(() => {
        currentVolume = Math.max(currentVolume - 0.1, 0);
        video.volume = currentVolume;
        console.log('MiniPovPlayer: Fading out volume:', currentVolume);
        if (currentVolume <= 0) {
          clearInterval(fadeInterval);
          video.pause();
          video.currentTime = 0;
          console.log('MiniPovPlayer: Playback paused and reset');
        }
      }, 50);
    }

    // Cleanup
    return () => {
      if (videoRef.current) {
        videoRef.current.volume = 0;
        videoRef.current.pause();
        console.log('MiniPovPlayer: Cleanup - volume set to 0 and playback paused');
      }
    };
  }, [isHovered, mediaUrl, volume]);

  if (isLoading) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {mediaType === 'video' && mediaUrl && (
        <video
          ref={videoRef}
          src={mediaUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          playsInline
          loop
        />
      )}
      {mediaType === 'image' && mediaUrl && (
        <img
          src={mediaUrl}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
    </Box>
  );
};

export default MiniPovPlayer;
