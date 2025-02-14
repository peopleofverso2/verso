import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { MediaLibraryService } from '../../services/MediaLibraryService';
import { MediaFile } from '../../types/media';

interface MiniPovPlayerProps {
  scenario: {
    nodes: {
      id: string;
      type?: string;
      data: {
        mediaId?: string;
        content?: {
          media?: Array<{
            id: string;
            type: string;
          }>;
        };
      };
    }[];
    edges?: {
      id: string;
      source: string;
      target: string;
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
  const [isInitializing, setIsInitializing] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [mediaLibrary, setMediaLibrary] = useState<MediaLibraryService | null>(null);

  // Initialiser MediaLibrary
  useEffect(() => {
    let mounted = true;

    const initMediaLibrary = async () => {
      try {
        console.log('MiniPovPlayer: Initializing MediaLibrary...');
        const lib = await MediaLibraryService.getInstance();
        if (mounted) {
          console.log('MiniPovPlayer: MediaLibrary initialized');
          setMediaLibrary(lib);
          setIsInitializing(false);
        }
      } catch (error) {
        console.error('MiniPovPlayer: Error initializing MediaLibrary:', error);
        if (mounted) {
          setIsInitializing(false);
          setIsLoading(false);
        }
      }
    };

    initMediaLibrary();

    return () => {
      mounted = false;
    };
  }, []);

  // Sélectionner le premier nœud avec média
  useEffect(() => {
    if (isInitializing) return;
    if (!scenario?.nodes?.length || !mediaLibrary) return;

    const findNodeWithMedia = () => {
      for (const node of scenario.nodes) {
        // Vérifier d'abord mediaId direct
        if (node.data?.mediaId) {
          console.log('MiniPovPlayer: Found node with direct mediaId:', node);
          return node;
        }
        // Sinon vérifier dans content.media
        if (node.data?.content?.media?.length > 0) {
          console.log('MiniPovPlayer: Found node with media in content:', node);
          return node;
        }
      }
      return null;
    };

    const nodeWithMedia = findNodeWithMedia();
    if (nodeWithMedia) {
      setCurrentNodeId(nodeWithMedia.id);
    } else {
      console.log('MiniPovPlayer: No nodes with media found in:', scenario.nodes);
      setIsLoading(false);
    }
  }, [scenario, mediaLibrary, isInitializing]);

  // Charger le média
  useEffect(() => {
    const loadMedia = async () => {
      if (!currentNodeId || !scenario?.nodes || !mediaLibrary) {
        console.log('MiniPovPlayer: Missing dependencies:', {
          currentNodeId,
          hasScenario: !!scenario,
          hasNodes: !!scenario?.nodes,
          hasMediaLibrary: !!mediaLibrary
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const node = scenario.nodes.find(n => n.id === currentNodeId);
        if (!node) return;

        console.log('MiniPovPlayer: Loading media for node:', node);

        // Essayer d'abord mediaId direct
        let mediaId = node.data?.mediaId;
        let mediaType: 'video' | 'image' | null = null;

        // Sinon chercher dans content.media
        if (!mediaId && node.data?.content?.media?.length > 0) {
          const firstMedia = node.data.content.media[0];
          mediaId = firstMedia.id;
          mediaType = firstMedia.type as 'video' | 'image';
        }

        if (!mediaId) {
          console.log('MiniPovPlayer: No media ID found in node');
          setIsLoading(false);
          return;
        }

        console.log('MiniPovPlayer: Getting media:', { mediaId, mediaType });

        // Essayer d'abord de récupérer le média depuis le scénario
        let media = scenario.media?.[mediaId];
        
        // Si pas trouvé, le charger depuis MediaLibrary
        if (!media) {
          console.log('MiniPovPlayer: Media not found in scenario, loading from library');
          media = await mediaLibrary.getMedia(mediaId);
        } else {
          console.log('MiniPovPlayer: Media found in scenario');
        }

        console.log('MiniPovPlayer: Media loaded:', media);

        if (media?.url) {
          setMediaUrl(media.url);
          setMediaType(mediaType || (media.metadata.type as 'video' | 'image'));
          console.log('MiniPovPlayer: Media state updated');
        } else {
          console.log('MiniPovPlayer: No URL in media response');
        }
      } catch (error) {
        console.error('MiniPovPlayer: Error loading media:', error);
      } finally {
        setIsLoading(false);
        console.log('MiniPovPlayer: Loading finished');
      }
    };

    loadMedia();

    return () => {
      if (mediaUrl) {
        console.log('MiniPovPlayer: Cleaning up URL:', mediaUrl);
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
