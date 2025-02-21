import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipNext as NextIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const PlayerContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '100%',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const Controls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: theme.spacing(1),
  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

interface MinipovPlayerProps {
  nodes: any[];
  edges: any[];
  media: Record<string, any>;
  isPlaying?: boolean;
  onComplete?: () => void;
}

const MinipovPlayer: React.FC<MinipovPlayerProps> = ({
  nodes,
  edges,
  media,
  isPlaying = false,
  onComplete
}) => {
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const currentNode = useMemo(() => nodes[currentNodeIndex], [nodes, currentNodeIndex]);
  
  useEffect(() => {
    console.log('MinipovPlayer - Current node:', currentNode);
    console.log('MinipovPlayer - Media:', media);
  }, [currentNode, media]);

  const currentMedia = useMemo(() => {
    if (!currentNode?.data?.mediaId) {
      console.log('MinipovPlayer - No mediaId in current node');
      return null;
    }
    const mediaItem = media[currentNode.data.mediaId];
    console.log('MinipovPlayer - Media item found:', mediaItem);
    return mediaItem;
  }, [currentNode, media]);

  const handleNext = useCallback(() => {
    if (currentNodeIndex < nodes.length - 1) {
      setCurrentNodeIndex(prev => prev + 1);
    } else {
      onComplete?.();
    }
  }, [currentNodeIndex, nodes.length, onComplete]);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null;
    
    if (isPlaying && currentMedia?.type === 'video') {
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            handleNext();
            return 0;
          }
          return prev + 1;
        });
      }, 100);
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [isPlaying, currentMedia, handleNext]);

  if (!currentMedia) {
    console.log('MinipovPlayer - No media to display');
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
          fontSize: '0.8rem'
        }}
      >
        Aucun média
      </Box>
    );
  }

  // Créer une URL valide pour le média
  const mediaUrl = currentMedia.url;
  console.log('MinipovPlayer - Media URL:', mediaUrl);
  
  if (!mediaUrl) {
    console.error('MinipovPlayer - No URL for media:', currentMedia);
    return null;
  }

  return (
    <PlayerContainer>
      {currentMedia.type === 'video' ? (
        <Box
          component="video"
          src={mediaUrl}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          autoPlay={isPlaying}
          muted
          loop={false}
          onEnded={handleNext}
        />
      ) : currentMedia.type === 'image' ? (
        <Box
          component="img"
          src={mediaUrl}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      ) : null}

      <Controls>
        <Box sx={{ flexGrow: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 2,
              backgroundColor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'white',
              }
            }}
          />
        </Box>
      </Controls>
    </PlayerContainer>
  );
};

export default MinipovPlayer;
