import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, IconButton, Button, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { LocalStorageAdapter } from '../../services/storage/LocalStorageAdapter';
import { MediaLibraryService } from '../../services/MediaLibraryService';
import { MediaFile } from '../../types/media';
import { VideoPlayer } from '../Editor/nodes/video/VideoPlayer';

interface PovPlayerProps {
  scenario: {
    nodes: {
      id: string;
      data: {
        mediaId?: string;
        audioId?: string;
        content?: {
          videoUrl?: string;
          video?: {
            url?: string;
            name?: string;
          };
          choices?: {
            id: string;
            text: string;
          }[];
        };
      };
    }[];
    edges: {
      id: string;
      source: string;
      target: string;
      sourceHandle?: string;
      data?: {
        label?: string;
      };
    }[];
    media?: Record<string, MediaFile>;
  };
  onClose?: () => void;
}

const PovPlayer: React.FC<PovPlayerProps> = ({ scenario, onClose }) => {
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [choices, setChoices] = useState<{ id: string; text: string; targetId: string; handleId: string }[]>([]);
  const [mediaEnded, setMediaEnded] = useState(false);
  const [mediaType, setMediaType] = useState<'video' | 'image' | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const mediaLibrary = useRef(MediaLibraryService.getInstance());

  // Gérer la touche Échap
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose]);

  // Trouver le premier nœud
  useEffect(() => {
    if (!scenario || !scenario.nodes || !Array.isArray(scenario.nodes)) {
      console.error('Invalid scenario structure:', scenario);
      return;
    }

    if (scenario.nodes.length > 0) {
      const startNode = scenario.nodes[0];
      setCurrentNodeId(startNode.id);
    }
  }, [scenario]);

  // Trouver le nœud suivant en fonction des edges
  const findNextNode = useCallback((currentNodeId: string, handleId?: string) => {
    if (!scenario || !scenario.edges) return null;
    
    const edges = scenario.edges.filter(e => e.source === currentNodeId);
    
    // Si un handleId est spécifié (choix spécifique)
    if (handleId) {
      const edge = edges.find(e => e.sourceHandle === handleId);
      return edge?.target;
    }
    
    // S'il n'y a qu'un seul edge (transition automatique)
    if (edges.length === 1 && !edges[0].sourceHandle) {
      return edges[0].target;
    }
    
    return null;
  }, [scenario]);

  // Gérer la transition vers le prochain nœud
  const handleTransition = useCallback((nextNodeId: string) => {
    setMediaEnded(false);
    setCurrentNodeId(nextNodeId);
  }, []);

  // Gérer la fin d'un média
  const handleMediaEnd = useCallback(() => {
    setMediaEnded(true);
    const nextNodeId = findNextNode(currentNodeId || '', 'default-handle');
    if (nextNodeId) {
      handleTransition(nextNodeId);
    }
  }, [currentNodeId, findNextNode, handleTransition]);

  // Gérer un choix
  const handleChoice = useCallback((handleId: string) => {
    const nextNodeId = findNextNode(currentNodeId || '', handleId);
    if (nextNodeId) {
      handleTransition(nextNodeId);
    }
  }, [currentNodeId, findNextNode, handleTransition]);

  // Gérer la pause
  const handlePause = useCallback(() => {
    setIsPaused(true);
  }, []);

  // Gérer la reprise
  const handlePlay = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Charger le nœud courant
  useEffect(() => {
    const loadCurrentNode = async () => {
      if (!currentNodeId || !scenario.nodes) return;

      const node = scenario.nodes.find(n => n.id === currentNodeId);
      if (!node) return;

      try {
        // Réinitialiser les états
        setMediaUrl(null);
        setChoices([]);
        setMediaType(null);

        // Charger le média principal
        if (node.data.mediaId && scenario.media?.[node.data.mediaId]) {
          const media = scenario.media[node.data.mediaId];
          setMediaUrl(media.url);
          setMediaType(media.metadata.type as 'video' | 'image');
        } else if (node.data.content?.videoUrl) {
          setMediaUrl(node.data.content.videoUrl);
          setMediaType('video');
        } else if (node.data.content?.video?.url) {
          setMediaUrl(node.data.content.video.url);
          setMediaType('video');
        }

        // Charger les choix
        if (node.data.content?.choices) {
          const edges = scenario.edges.filter(e => e.source === currentNodeId);
          const nodeChoices = node.data.content.choices.map(choice => {
            const edge = edges.find(e => e.sourceHandle === `button-handle-${choice.id}`);
            return {
              id: choice.id,
              text: choice.text,
              targetId: edge?.target || '',
              handleId: `button-handle-${choice.id}`,
            };
          });
          setChoices(nodeChoices);
        }
      } catch (error) {
        console.error('Error loading node:', error);
      }
    };

    loadCurrentNode();
  }, [currentNodeId, scenario]);

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
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: 'white',
          zIndex: 10000,
        }}
      >
        <CloseIcon />
      </IconButton>

      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {mediaType === 'video' && mediaUrl && (
          <VideoPlayer
            url={mediaUrl}
            playing={!isPaused}
            controls={true}
            muted={false}
            loop={false}
            width="100%"
            height="100%"
            onEnded={handleMediaEnd}
            onPause={handlePause}
            onPlay={handlePlay}
            style={{ objectFit: 'contain' }}
          />
        )}

        {mediaType === 'image' && mediaUrl && (
          <Box
            component="img"
            src={mediaUrl}
            alt="Scene"
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        )}

        {/* Boutons de choix avec style amélioré */}
        {choices.length > 0 && (mediaEnded || !mediaUrl || isPaused) && (
          <Box
            sx={{
              position: 'fixed',
              bottom: '10%',
              left: 0,
              right: 0,
              display: 'flex',
              gap: 3,
              flexWrap: 'wrap',
              justifyContent: 'center',
              padding: '0 32px',
              zIndex: 10001
            }}
          >
            {choices.map(choice => (
              <Button
                key={choice.id}
                variant="contained"
                onClick={() => handleChoice(choice.handleId)}
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
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PovPlayer;
