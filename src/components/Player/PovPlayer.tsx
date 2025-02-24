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
            volume?: number;
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
  const [isPaused, setIsPaused] = useState(false);
  const [mediaType, setMediaType] = useState<'video' | 'image' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const mediaLibrary = useRef(MediaLibraryService.getInstance());

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
      if (!currentNodeId || !scenario || !scenario.nodes || !mediaLibrary.current) return;

      const node = scenario.nodes.find(n => n.id === currentNodeId);
      if (!node || !node.data) return;

      setMediaEnded(false);
      setIsPaused(false);
      clearTimers();

      // Récupérer l'URL du média et son type
      let url = null;
      let type = null;
      if (node.data.mediaId && scenario.media?.[node.data.mediaId]) {
        const mediaFile = scenario.media[node.data.mediaId];
        if (mediaFile.url) {
          url = mediaFile.url;
          type = mediaFile.metadata.type as 'video' | 'image';
        }
      }

      setMediaUrl(url);
      setMediaType(type);

      // Configurer le volume de la vidéo si c'est une vidéo
      if (type === 'video' && videoRef.current) {
        const videoSettings = node.data.content?.video;
        if (videoSettings) {
          videoRef.current.volume = videoSettings.volume ?? 1;
          console.log('Video volume set to:', videoRef.current.volume);
        } else {
          videoRef.current.volume = 1;
          console.log('No video settings found, volume set to 1');
        }
      }

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
        console.log('Audio ID found:', node.data.audioId);
        const audioFile = scenario.media[node.data.audioId];
        console.log('Audio file:', audioFile);
        
        if (audioFile.url && audioFile.metadata?.mimeType?.startsWith('audio/') && audioContainerRef.current) {
          console.log('Setting audio source:', audioFile.url);
          
          // Nettoyer l'ancien audio s'il existe
          if (audioRef.current) {
            stopAndCleanupAudio(audioRef.current);
          }
          
          // Créer un nouvel élément audio
          const newAudio = new Audio();
          newAudio.style.display = 'none';
          newAudio.crossOrigin = 'anonymous';
          newAudio.preload = 'auto';
          
          // Configurer les gestionnaires d'événements avant de définir la source
          newAudio.addEventListener('error', (e) => {
            console.error('Audio error event:', e);
            console.error('Audio error code:', newAudio.error?.code);
            console.error('Audio error message:', newAudio.error?.message);
            
            // Réessayer le chargement en cas d'erreur
            if (newAudio.error?.code !== MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
              setTimeout(() => {
                newAudio.load();
                newAudio.play().catch(console.error);
              }, 1000);
            }
          });

          newAudio.addEventListener('loadeddata', () => {
            console.log('Audio loaded successfully');
          });

          newAudio.addEventListener('playing', () => {
            console.log('Audio started playing');
          });
          
          // Définir la source et ajouter au conteneur dédié
          newAudio.src = audioFile.url;
          audioContainerRef.current.appendChild(newAudio);
          audioRef.current = newAudio;
          
          const audio = node.data.content?.audio;
          console.log('Audio settings:', audio);
          
          if (audio) {
            newAudio.volume = audio.volume ?? 1;
            newAudio.loop = audio.loop ?? false;
            console.log('Audio volume:', newAudio.volume);
            console.log('Audio loop:', newAudio.loop);

            // Appliquer le fade-in
            if (audio.fadeIn) {
              console.log('Applying fade-in:', audio.fadeIn);
              newAudio.volume = 0;
              const steps = 50;
              const stepTime = (audio.fadeIn * 1000) / steps;
              const volumeStep = (audio.volume ?? 1) / steps;

              let currentStep = 0;
              const fadeInterval = setInterval(() => {
                currentStep++;
                if (newAudio && currentStep <= steps) {
                  newAudio.volume = volumeStep * currentStep;
                  console.log('Fade-in step:', currentStep, 'volume:', newAudio.volume);
                } else {
                  clearInterval(fadeInterval);
                }
              }, stepTime);
            }

            // Démarrer la lecture audio avec gestion d'erreur détaillée
            newAudio.play().then(() => {
              console.log('Audio started playing successfully');
            }).catch(error => {
              console.error('Error playing audio:', error);
              if (error.name === 'NotAllowedError') {
                console.error('Audio playback was not allowed. This might be due to browser autoplay restrictions.');
                // Ajouter un gestionnaire de clic pour démarrer l'audio
                const startAudio = () => {
                  newAudio.play().catch(console.error);
                  document.removeEventListener('click', startAudio);
                };
                document.addEventListener('click', startAudio);
              } else if (error.name === 'NotSupportedError') {
                console.error('Audio format is not supported.');
              }
            });
          }
        } else {
          console.log('Invalid audio file or MIME type:', { 
            hasUrl: !!audioFile.url, 
            mimeType: audioFile.metadata?.mimeType 
          });
        }
      } else {
        console.log('No audio ID found for node:', node.data);
      }

      // Trouver les choix disponibles
      const nodeChoices = node.data.content?.choices || [];
      const edges = scenario.edges?.filter(e => e.source === currentNodeId) || [];
      
      const availableChoices = nodeChoices.map(choice => {
        const edge = edges.find(e => e.sourceHandle === `button-handle-${choice.id}`);
        if (!edge) return null;
        
        return {
          id: choice.id,
          text: choice.text,
          targetId: edge.target,
          handleId: edge.sourceHandle || ''
        };
      }).filter((choice): choice is { id: string; text: string; targetId: string; handleId: string } => choice !== null);

      // Si pas de choix mais un lien simple, créer un choix "Continuer"
      if (availableChoices.length === 0 && edges.length === 1 && !edges[0].sourceHandle) {
        availableChoices.push({
          id: 'continue',
          text: 'Continuer',
          targetId: edges[0].target,
          handleId: ''
        });
      }

      setChoices(availableChoices);
    };

    loadMedia();

    // Nettoyer
    return () => {
      clearTimers();
      if (mediaUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(mediaUrl);
      }
      // Réinitialiser le volume de la vidéo
      if (videoRef.current) {
        videoRef.current.volume = 0;
        videoRef.current.pause();
      }
      if (audioRef.current) {
        const audio = audioRef.current;
        
        // Appliquer le fade-out avant de stopper
        const node = scenario.nodes.find(n => n.id === currentNodeId);
        const fadeOut = node?.data.content?.audio?.fadeOut;
        
        if (fadeOut && audio.volume > 0) {
          const currentVolume = audio.volume;
          const steps = 50;
          const stepTime = (fadeOut * 1000) / steps;
          const volumeStep = currentVolume / steps;

          let currentStep = 0;
          const fadeInterval = setInterval(() => {
            currentStep++;
            if (currentStep <= steps) {
              audio.volume = currentVolume - (volumeStep * currentStep);
            } else {
              clearInterval(fadeInterval);
              stopAndCleanupAudio(audio);
            }
          }, stepTime);
        } else {
          stopAndCleanupAudio(audio);
        }
      }
    };
  }, [currentNodeId, scenario, clearTimers, findNextNode, handleTransition]);

  // Fonction utilitaire pour arrêter et nettoyer l'audio
  const stopAndCleanupAudio = useCallback((audio: HTMLAudioElement) => {
    try {
      audio.pause();
      audio.src = '';
      audio.load(); // Force la libération des ressources
      
      // Supprimer tous les gestionnaires d'événements
      const clone = audio.cloneNode(false);
      if (audio.parentNode && clone instanceof HTMLAudioElement) {
        audio.parentNode.replaceChild(clone, audio);
      }
      
      if (audio.parentNode) {
        audio.parentNode.removeChild(audio);
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

    return () => {
      if (audioContainerRef.current) {
        // S'assurer que tous les éléments audio sont nettoyés
        const audioElements = audioContainerRef.current.getElementsByTagName('audio');
        Array.from(audioElements).forEach(audio => {
          stopAndCleanupAudio(audio);
        });
        audioContainerRef.current.remove();
      }
    };
  }, []);

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

  // Gérer la touche Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
      {onClose && (
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
      )}

      {/* Conteneur du média */}
      {mediaUrl && (
        <Box sx={{ 
          width: '100%', 
          maxWidth: '1280px', 
          aspectRatio: '16/9',
          position: 'relative'  
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
            />
          ) : mediaType === 'image' ? (
            <img
              ref={imageRef}
              src={mediaUrl}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              alt="Contenu du nœud"
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
