import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { MediaLibraryService } from '../../services/MediaLibraryService';
import { MediaFile } from '../../types/media';

interface MiniPovPlayerProps {
  scenario: any;
  isHovered?: boolean;
  height?: number;
}

const MiniPovPlayer: React.FC<MiniPovPlayerProps> = ({
  scenario,
  isHovered = false,
  height = 140
}) => {
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const [isLoading, setIsLoading] = useState(true);
  const mediaLibrary = useRef<MediaLibraryService | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Initialiser MediaLibrary
  useEffect(() => {
    const initMediaLibrary = async () => {
      try {
        mediaLibrary.current = await MediaLibraryService.getInstance();
      } catch (error) {
        console.error('MiniPovPlayer: Error initializing MediaLibrary:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initMediaLibrary();
  }, []);

  // Nettoyer les ressources
  const cleanup = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  }, []);

  // Pause/Play en fonction du hover
  useEffect(() => {
    if (videoRef.current) {
      if (isHovered) {
        console.log('MiniPovPlayer: Starting playback on hover');
        videoRef.current.play().catch(error => {
          console.warn('MiniPovPlayer: Autoplay failed:', error);
        });
      } else {
        console.log('MiniPovPlayer: Pausing playback on hover end');
        videoRef.current.pause();
        // Optionnel : remettre la vidéo au début
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered]);

  // Sélectionner le premier nœud avec média
  useEffect(() => {
    if (!scenario) return;

    console.log('Scenario received:', {
      hasNodes: !!scenario.nodes,
      nodesCount: scenario.nodes?.length,
      nodes: scenario.nodes,
      media: scenario.media
    });

    // Trouver le premier nœud avec un média
    for (const node of scenario.nodes || []) {
      const mediaId = node.data?.mediaId || node.mediaId;
      console.log('Checking node:', {
        id: node.id,
        mediaId,
        videoUrl: node.data?.videoUrl,
        videoContentUrl: node.data?.videoContentUrl,
        contentMedia: node.data?.content?.media,
        hasMedia: node.data?.hasMedia
      });

      if (mediaId) {
        console.log('Node with media found:', node);
        const media = scenario.media?.[mediaId];
        
        // Charger le média depuis MediaLibrary si nécessaire
        const loadMedia = async () => {
          console.log('Loading media for node:', {
            id: node.id,
            data: node.data,
            mediaId,
            content: node.data?.content,
            scenarioMedia: scenario.media
          });

          try {
            if (!mediaLibrary.current) {
              mediaLibrary.current = await MediaLibraryService.getInstance();
            }

            let mediaFile;
            if (media?.url) {
              console.log('Using media from scenario:', media);
              mediaFile = media;
            } else {
              console.log('Loading media from MediaLibrary:', mediaId);
              mediaFile = await mediaLibrary.current.getMedia(mediaId);
              
              // Mettre à jour le cache du scénario avec le média chargé
              if (scenario.media && mediaFile) {
                scenario.media[mediaId] = mediaFile;
              }
            }

            if (mediaFile?.url) {
              console.log('Media loaded successfully:', {
                id: mediaId,
                url: mediaFile.url,
                type: mediaFile.metadata?.type
              });
              setMediaUrl(mediaFile.url);
              setMediaType(mediaFile.metadata.type as 'video' | 'image');
              setCurrentNodeId(node.id);
            } else {
              console.warn('No media URL found for:', mediaId);
            }
          } catch (error) {
            console.error('Error loading media:', error);
          }
        };

        loadMedia();
        break;
      }
    }
  }, [scenario]);

  // Charger le média
  useEffect(() => {
    const loadMedia = async () => {
      cleanup();
      if (!currentNodeId || !scenario?.nodes) return;

      setIsLoading(true);

      try {
        const node = scenario.nodes.find(n => n.id === currentNodeId);
        if (!node?.data) return;

        console.log('Loading media for node:', {
          id: node.id,
          data: node.data,
          mediaId: node.data.mediaId,
          content: node.data.content,
          scenarioMedia: scenario.media
        });

        // 1. Essayer le média depuis le scénario
        if (node.data.mediaId && scenario.media?.[node.data.mediaId]) {
          const mediaFile = scenario.media[node.data.mediaId];
          console.log('Found media in scenario:', mediaFile);
          
          if (mediaFile?.metadata?.type === 'pov') {
            console.log('Skipping POV file');
            setIsLoading(false);
            return;
          }
          
          if (mediaFile?.url) {
            console.log('Using media from scenario:', mediaFile);
            setMediaUrl(mediaFile.url);
            setMediaType(mediaFile.metadata.type as 'video' | 'image');
            setIsLoading(false);
            return;
          }
        }

        // 2. Essayer le contenu direct
        if (node.data.content?.videoUrl) {
          console.log('Using videoUrl:', node.data.content.videoUrl);
          setMediaUrl(node.data.content.videoUrl);
          setMediaType('video');
          setIsLoading(false);
          return;
        }

        if (node.data.content?.video?.url) {
          console.log('Using video.url:', node.data.content.video.url);
          setMediaUrl(node.data.content.video.url);
          setMediaType('video');
          setIsLoading(false);
          return;
        }

        // 3. Essayer de charger depuis MediaLibrary
        if (node.data.mediaId && mediaLibrary.current) {
          console.log('Loading media from library:', node.data.mediaId);
          try {
            const mediaFile = await mediaLibrary.current.getMedia(node.data.mediaId);
            console.log('Media loaded from library:', mediaFile);
            if (mediaFile?.url) {
              console.log('Using media from library:', mediaFile);
              setMediaUrl(mediaFile.url);
              setMediaType(mediaFile.metadata.type as 'video' | 'image');
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error('Error loading media from library:', error);
          }
        }

        console.log('No media found for node:', node);

      } catch (error) {
        console.error('Error loading media:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMedia();
  }, [currentNodeId, scenario, cleanup]);

  // Gérer la transition automatique pour les vidéos
  const handleVideoEnd = useCallback(() => {
    if (!scenario?.nodes) return;
    
    const currentIndex = scenario.nodes.findIndex(n => n.id === currentNodeId);
    if (currentIndex < scenario.nodes.length - 1) {
      setCurrentNodeId(scenario.nodes[currentIndex + 1].id);
    } else {
      setCurrentNodeId(scenario.nodes[0].id);
    }
  }, [currentNodeId, scenario]);

  // Rendu du composant
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
        bgcolor: 'background.paper',
        overflow: 'hidden'
      }}
    >
      {mediaType === 'video' && mediaUrl && (
        <video
          ref={videoRef}
          src={mediaUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
          muted
          playsInline
          loop
          onEnded={handleVideoEnd}
          onError={(e) => console.error('Video error:', e)}
        />
      )}
      {mediaType === 'image' && mediaUrl && (
        <img
          ref={imageRef}
          src={mediaUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
          alt=""
          onError={(e) => console.error('Image error:', e)}
        />
      )}
      {!mediaUrl && !isLoading && (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.paper'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Aucun média disponible
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MiniPovPlayer;
