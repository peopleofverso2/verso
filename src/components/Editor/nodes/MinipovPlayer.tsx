import React, { useState, useCallback, useEffect } from 'react';
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

  const currentNode = nodes[currentNodeIndex];
  const currentMedia = currentNode?.data?.mediaId ? media[currentNode.data.mediaId] : null;

  const handleNext = useCallback(() => {
    if (currentNodeIndex < nodes.length - 1) {
      setCurrentNodeIndex(prev => prev + 1);
      setProgress((currentNodeIndex + 1) * 100 / nodes.length);
    } else {
      setCurrentNodeIndex(0);
      setProgress(0);
      if (onComplete) {
        onComplete();
      }
    }
  }, [currentNodeIndex, nodes.length, onComplete]);

  // Auto-advance si isPlaying est true
  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(handleNext, 2000); // 2 secondes par nœud
      return () => clearTimeout(timer);
    }
  }, [isPlaying, handleNext, currentNodeIndex]);

  // Reset quand isPlaying passe à false
  useEffect(() => {
    if (!isPlaying) {
      setCurrentNodeIndex(0);
      setProgress(0);
    }
  }, [isPlaying]);

  if (!currentMedia) {
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

  return (
    <PlayerContainer>
      <Box
        component={currentMedia.type === 'video' ? 'video' : 'img'}
        src={currentMedia.url}
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
