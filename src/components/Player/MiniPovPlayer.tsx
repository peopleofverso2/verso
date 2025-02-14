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
          };
        };
      };
    }[];
    media?: Record<string, MediaFile>;
  };
  height?: number;
}

const MiniPovPlayer: React.FC<MiniPovPlayerProps> = ({ 
  scenario,
  height = 140
}) => {
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'image' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const mediaLibrary = useRef<MediaLibraryService | null>(null);

  useEffect(() => {
    MediaLibraryService.getInstance().then(lib => {
      mediaLibrary.current = lib;
    });
  }, []);

  useEffect(() => {
    // Commencer par le premier nœud
    if (scenario?.nodes?.length > 0) {
      console.log('Setting initial node:', scenario.nodes[0]);
      setCurrentNodeId(scenario.nodes[0].id);
    } else {
      console.log('No nodes available in scenario:', scenario);
    }
  }, [scenario]);

  useEffect(() => {
    const loadMedia = async () => {
      if (!currentNodeId || !scenario?.nodes || !mediaLibrary.current) {
        console.log('Missing dependencies:', {
          currentNodeId,
          hasScenario: !!scenario,
          hasNodes: !!scenario?.nodes,
          hasMediaLibrary: !!mediaLibrary.current
        });
        return;
      }

      setIsLoading(true);

      try {
        const node = scenario.nodes.find(n => n.id === currentNodeId);
        if (!node?.data?.mediaId) {
          console.log('No media ID in node:', node);
          setIsLoading(false);
          return;
        }

        console.log('Loading media for node:', node);

        const media = await mediaLibrary.current.getMedia(node.data.mediaId);
        console.log('Media loaded:', media);

        if (media?.url) {
          setMediaUrl(media.url);
          setMediaType(media.metadata.type as 'video' | 'image');
        }
      } catch (error) {
        console.error('Error loading media:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMedia();

    return () => {
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [currentNodeId, scenario]);

  // Gérer la transition automatique pour les vidéos
  const handleVideoEnd = () => {
    if (scenario?.nodes) {
      const currentIndex = scenario.nodes.findIndex(n => n.id === currentNodeId);
      if (currentIndex < scenario.nodes.length - 1) {
        setCurrentNodeId(scenario.nodes[currentIndex + 1].id);
      } else {
        // Revenir au début
        setCurrentNodeId(scenario.nodes[0].id);
      }
    }
  };

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          width: '100%',
          height: height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper'
        }}
      >
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        width: '100%',
        height: height,
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.paper'
      }}
    >
      {mediaType === 'video' && mediaUrl && (
        <video
          ref={videoRef}
          src={mediaUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          autoPlay
          muted
          loop
          playsInline
          onEnded={handleVideoEnd}
        />
      )}
      {mediaType === 'image' && mediaUrl && (
        <img
          ref={imageRef}
          src={mediaUrl}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      )}
    </Box>
  );
};

export default MiniPovPlayer;
