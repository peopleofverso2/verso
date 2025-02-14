import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, IconButton, Button, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { LocalStorageAdapter } from '../../services/storage/LocalStorageAdapter';
import { MediaLibraryService } from '../../services/MediaLibraryService';
import { MediaFile } from '../../types/media';

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
  onClose: () => void;
}

const PovPlayer: React.FC<PovPlayerProps> = ({ scenario, onClose }) => {
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [choices, setChoices] = useState<{ id: string; text: string; targetId: string; handleId: string }[]>([]);
  const [mediaEnded, setMediaEnded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mediaType, setMediaType] = useState<'video' | 'image' | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const [mediaLibrary, setMediaLibrary] = useState<MediaLibraryService | null>(null);

  // Initialiser MediaLibraryService
  useEffect(() => {
    let mounted = true;
    const initMediaLibrary = async () => {
      try {
        const instance = await MediaLibraryService.getInstance();
        if (mounted) {
          setMediaLibrary(instance);
          setIsInitializing(false);
        }
      } catch (error) {
        console.error('Failed to initialize MediaLibrary:', error);
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };
    initMediaLibrary();
    return () => {
      mounted = false;
    };
  }, []);

  // Trouver le premier nœud
  useEffect(() => {
    if (isInitializing) return;
    
    if (!scenario || !scenario.nodes || !Array.isArray(scenario.nodes)) {
      console.error('Invalid scenario structure:', scenario);
      return;
    }

    if (scenario.nodes.length > 0) {
      const startNode = scenario.nodes[0];
      setCurrentNodeId(startNode.id);
    }
  }, [scenario, isInitializing]);

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

  // Nettoyer les timers
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  // Gérer la transition vers le prochain nœud
  const handleTransition = useCallback((nextNodeId: string) => {
    clearTimers();
    setMediaEnded(false);
    setCurrentNodeId(nextNodeId);
  }, [clearTimers]);

  // Charger le média du nœud actuel
  useEffect(() => {
    const loadMedia = async () => {
      if (!currentNodeId || !scenario || !scenario.nodes) {
        console.error('Missing required data:', {
          currentNodeId,
          hasScenario: !!scenario,
          hasNodes: !!scenario?.nodes
        });
        return;
      }

      const node = scenario.nodes.find(n => n.id === currentNodeId);
      if (!node || !node.data) {
        console.error('Node not found or invalid:', { currentNodeId, node });
        return;
      }

      setMediaEnded(false);
      setIsPaused(false);
      clearTimers();

      // Récupérer l'URL du média et son type
      let url = null;
      let type = null;
      
      if (node.data.mediaId && scenario.media?.[node.data.mediaId]) {
        const mediaFile = scenario.media[node.data.mediaId];
        if (mediaFile?.url) {
          url = mediaFile.url;
          type = mediaFile.metadata.type as 'video' | 'image';
          console.log('Media loaded from scenario:', { mediaId: node.data.mediaId, type });
        }
      }

      if (!url) {
        console.warn('No media URL found for node:', { nodeId: node.id, mediaId: node.data.mediaId });
      }

      setMediaUrl(url);
      setMediaType(type);

      // Démarrer le timer pour les images si configuré
      if (type === 'image' && node.data.content?.timer?.autoTransition) {
        const duration = node.data.content.timer.duration * 1000;
        timerRef.current = setTimeout(() => {
          const nextNodeId = findNextNode(currentNodeId);
          if (nextNodeId) {
            handleTransition(nextNodeId);
          } else if (node.data.content?.timer?.loop) {
            // Redémarrer le timer si loop est activé
            setMediaEnded(false);
            loadMedia();
          } else {
            setMediaEnded(true);
          }
        }, duration);
      }

      // Configurer l'audio si présent
      if (node.data.audioId && scenario.media?.[node.data.audioId]) {
        const audioFile = scenario.media[node.data.audioId];
        console.log('Audio file:', audioFile);
        
        if (audioFile.url && audioFile.metadata?.mimeType?.startsWith('audio/') && audioContainerRef.current) {
          console.log('Setting audio source:', audioFile.url);
          if (audioRef.current) {
            audioRef.current.src = audioFile.url;
            audioRef.current.load();
          }
        }
      } else {
        console.log('No audio ID found for node:', node);
      }

      // Configurer les choix
      if (node.data.content?.choices) {
        const choicesWithTargets = node.data.content.choices.map(choice => {
          const handleId = `button-handle-${choice.id}`;
          const targetId = findNextNode(currentNodeId, handleId);
          return {
            ...choice,
            targetId,
            handleId
          };
        });
        setChoices(choicesWithTargets);
      } else {
        setChoices([]);
      }
    };

    loadMedia();
  }, [currentNodeId, scenario, clearTimers, findNextNode]);

  // Fonction utilitaire pour arrêter et nettoyer l'audio
  const stopAndCleanupAudio = useCallback((audio: HTMLAudioElement) => {
    try {
      // Arrêter la lecture et les effets de fondu
      audio.pause();
      
      // Supprimer les gestionnaires d'événements
      const clone = audio.cloneNode(false);
      if (audio.parentNode && clone instanceof HTMLAudioElement) {
        audio.parentNode.replaceChild(clone, audio);
      }
      
      // Nettoyer la source et forcer la libération des ressources
      audio.src = '';
      audio.load();
      
      // Supprimer l'élément du DOM
      if (audio.parentNode) {
        audio.parentNode.removeChild(audio);
      }
      
      // Révoquer l'URL du blob si nécessaire
      if (audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(audio.src);
      }
    } catch (error) {
      console.error('Error cleaning up audio:', error);
    }
  }, []);

  // Créer le conteneur audio au montage
  useEffect(() => {
    const container = document.createElement('div');
    container.style.display = 'none';
    container.id = 'audio-container';
    document.body.appendChild(container);
    audioContainerRef.current = container;

    // Nettoyer le conteneur audio au démontage
    return () => {
      if (audioContainerRef.current) {
        const audioElements = audioContainerRef.current.getElementsByTagName('audio');
        Array.from(audioElements).forEach(audio => {
          stopAndCleanupAudio(audio);
        });
        audioContainerRef.current.remove();
      }
    };
  }, [stopAndCleanupAudio]);

  // Gérer la fin du média
  const handleMediaEnd = useCallback(() => {
    console.log('Media ended');
    setMediaEnded(true);
    
    const node = scenario.nodes.find(n => n.id === currentNodeId);
    
    // Gérer la boucle pour les vidéos
    if (node?.data.content?.timer?.loop) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(console.error);
        setMediaEnded(false);
      }
    } else {
      // Vérifier s'il y a une transition automatique
      const nextNodeId = findNextNode(currentNodeId);
      if (nextNodeId) {
        handleTransition(nextNodeId);
      }
    }
  }, [currentNodeId, scenario.nodes, findNextNode, handleTransition]);

  // Gérer la pause
  const handlePause = useCallback(() => {
    setIsPaused(true);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  // Gérer la reprise
  const handlePlay = useCallback(() => {
    setIsPaused(false);
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  }, []);

  // Gérer le choix de l'utilisateur
  const handleChoice = useCallback((choice: { targetId: string, handleId: string }) => {
    console.log('Choice selected:', choice);
    if (choice.targetId) {
      handleTransition(choice.targetId);
    }
  }, [handleTransition]);

  // Nettoyer les ressources à la fermeture
  useEffect(() => {
    return () => {
      clearTimers();
      if (mediaUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(mediaUrl);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      // Nettoyer les URLs de blob dans le scénario
      if (scenario?.media) {
        Object.values(scenario.media).forEach(media => {
          if (media.url?.startsWith('blob:')) {
            URL.revokeObjectURL(media.url);
          }
        });
      }
    };
  }, [clearTimers, mediaUrl, scenario]);

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        bgcolor: 'black',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: 'white',
          zIndex: 10000
        }}
      >
        <CloseIcon />
      </IconButton>

      {/* Conteneur du média */}
      {mediaUrl && (
        <Box sx={{ 
          width: '100%', 
          maxWidth: '1280px', 
          aspectRatio: '16/9',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              autoPlay
              controls
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onEnded={handleMediaEnd}
              onPause={handlePause}
              onPlay={handlePlay}
              onError={(e) => {
                console.error('Video error:', e);
                const video = e.currentTarget;
                if (video.error) {
                  console.error('Video error details:', {
                    code: video.error.code,
                    message: video.error.message
                  });
                }
              }}
              onLoadedData={() => {
                console.log('Video loaded successfully');
              }}
              crossOrigin="anonymous"
            />
          ) : mediaType === 'image' ? (
            <img
              ref={imageRef}
              src={mediaUrl}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              alt="Contenu du nœud"
              onError={(e) => {
                console.error('Image error:', e);
                // En cas d'erreur, on peut afficher une image par défaut
                e.currentTarget.src = '/path/to/fallback/image.png';
              }}
              onLoad={() => {
                console.log('Image loaded successfully');
              }}
              crossOrigin="anonymous"
            />
          ) : null}
        </Box>
      )}

      {/* Élément audio caché */}
      <div ref={audioContainerRef} style={{ display: 'none' }} />

      {/* Boutons de choix */}
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
              onClick={() => handleChoice(choice)}
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
  );
};

export default PovPlayer;
