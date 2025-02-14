import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { MediaLibraryService } from '../../services/MediaLibraryService';
import { MediaFile } from '../../types/media';

interface MiniPovPlayerProps {
  scenario: any;
  isHovered?: boolean;
}

const MiniPovPlayer: React.FC<MiniPovPlayerProps> = ({
  scenario,
  isHovered = false
}) => {
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const [isLoading, setIsLoading] = useState(true);
  const [choices, setChoices] = useState<any[]>([]);
  const mediaLibrary = useRef<MediaLibraryService | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Gérer la fin de la vidéo
  const handleVideoEnd = useCallback(() => {
    console.log('MiniPovPlayer: Video ended');
    const currentNode = scenario.nodes.find((n: any) => n.id === currentNodeId);
    if (!currentNode) return;

    // Trouver les edges sortants
    const outgoingEdges = scenario.edges?.filter((e: any) => e.source === currentNodeId) || [];
    console.log('MiniPovPlayer: Outgoing edges:', outgoingEdges);

    if (outgoingEdges.length === 1 && !outgoingEdges[0].sourceHandle) {
      // Transition automatique si un seul edge sans handle
      const nextNodeId = outgoingEdges[0].target;
      console.log('MiniPovPlayer: Auto transitioning to:', nextNodeId);
      setCurrentNodeId(nextNodeId);
    } else if (outgoingEdges.length > 0) {
      // Afficher les choix si plusieurs edges
      const choicesData = outgoingEdges.map(edge => ({
        id: edge.id,
        label: edge.data?.label || 'Suivant',
        targetId: edge.target
      }));
      console.log('MiniPovPlayer: Setting choices:', choicesData);
      setChoices(choicesData);
    } else {
      console.log('MiniPovPlayer: No outgoing edges, restarting video');
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
    }
  }, [currentNodeId, scenario]);

  // Gérer la sélection d'un choix
  const handleChoiceSelect = useCallback((targetId: string) => {
    console.log('MiniPovPlayer: Choice selected, transitioning to:', targetId);
    setCurrentNodeId(targetId);
    setChoices([]);
  }, []);

  // Charger le média pour un node
  const loadNodeMedia = useCallback(async (node: any) => {
    if (!node) return;
    
    console.log('MiniPovPlayer: Loading media for node:', node);
    const mediaId = node.data?.mediaId;
    
    if (!mediaId) {
      console.log('MiniPovPlayer: No media ID found for node');
      setIsLoading(false);
      return;
    }

    try {
      if (!mediaLibrary.current) {
        mediaLibrary.current = await MediaLibraryService.getInstance();
      }

      const media = scenario.media?.[mediaId] || await mediaLibrary.current.getMedia(mediaId);
      
      if (media?.url) {
        console.log('MiniPovPlayer: Media loaded:', {
          id: mediaId,
          type: media.metadata.type,
          hasUrl: !!media.url
        });
        setMediaUrl(media.url);
        setMediaType(media.metadata.type as 'video' | 'image');
        setIsLoading(false);
      } else {
        console.warn('MiniPovPlayer: No media URL found');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('MiniPovPlayer: Error loading media:', error);
      setIsLoading(false);
    }
  }, [scenario]);

  // Charger le média quand le node change
  useEffect(() => {
    if (!currentNodeId) {
      // Charger le premier node avec média
      const firstNode = scenario.nodes?.find((n: any) => n.data?.mediaId);
      if (firstNode) {
        console.log('MiniPovPlayer: Loading first node:', firstNode.id);
        setCurrentNodeId(firstNode.id);
      }
      return;
    }

    const node = scenario.nodes?.find((n: any) => n.id === currentNodeId);
    loadNodeMedia(node);
  }, [currentNodeId, loadNodeMedia, scenario]);

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
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered]);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {isLoading ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <CircularProgress size={24} />
        </Box>
      ) : mediaUrl ? (
        <>
          {mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              muted
              playsInline
              loop={choices.length === 0}
              onEnded={handleVideoEnd}
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Media content"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}
          {choices.length > 0 && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                gap: 1,
                p: 1,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
              }}
            >
              {choices.map(choice => (
                <Button
                  key={choice.id}
                  variant="contained"
                  size="small"
                  onClick={() => handleChoiceSelect(choice.targetId)}
                  sx={{ minWidth: 0, px: 1 }}
                >
                  {choice.label}
                </Button>
              ))}
            </Box>
          )}
        </>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            bgcolor: 'action.hover',
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
