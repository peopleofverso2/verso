import React, { useEffect, useState, useCallback } from 'react';
import { Box } from '@mui/material';
import { Handle, Position, useReactFlow } from 'reactflow';
import { MediaLibraryService } from '../../../../services/MediaLibraryService';

interface ImagePreviewNodeProps {
  data: {
    content: {
      imageUrl?: string;
      mediaId?: string;
      timer?: {
        duration: number;
        autoTransition: boolean;
        loop: boolean;
        pauseOnInteraction: boolean;
      };
    };
    isPlaybackMode?: boolean;
    onNavigate?: () => void;
  };
  id: string;
}

const ImagePreviewNode: React.FC<ImagePreviewNodeProps> = ({ data, id }) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | undefined>(undefined);
  const [hasInteracted, setHasInteracted] = useState(false);
  const { getNode, getEdges, setNodes } = useReactFlow();

  const loadImage = useCallback(async () => {
    try {
      if (data.content.mediaId) {
        console.log('Loading image from mediaId:', data.content.mediaId);
        const mediaLibrary = await MediaLibraryService.getInstance();
        const media = await mediaLibrary.getMedia(data.content.mediaId);
        if (media && media.url) {
          console.log('Image loaded successfully:', media.url);
          setImageUrl(media.url);
        } else {
          console.warn('Image not found:', data.content.mediaId);
        }
      } else if (data.content.imageUrl) {
        console.log('Using direct imageUrl:', data.content.imageUrl);
        setImageUrl(data.content.imageUrl);
      }
    } catch (error) {
      console.error('Error loading image:', error);
    }
  }, [data.content.mediaId, data.content.imageUrl]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  useEffect(() => {
    if (data.isPlaybackMode && data.content.timer && !hasInteracted) {
      const { duration, autoTransition, loop } = data.content.timer;

      if (autoTransition && duration > 0) {
        console.log('Setting up timer:', {
          duration,
          autoTransition,
          loop,
          hasInteracted
        });

        const timeout = setTimeout(() => {
          if (loop) {
            console.log('Timer expired - Looping');
            setHasInteracted(false);
            if (data.onNavigate) {
              data.onNavigate();
            }
          } else if (!hasInteracted && data.onNavigate) {
            console.log('Timer expired - Navigating');
            data.onNavigate();
          }
        }, duration * 1000);

        setTimeoutId(timeout);
        return () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        };
      }
    }
  }, [data.isPlaybackMode, data.content.timer, hasInteracted, data.onNavigate, timeoutId]);

  const handleInteraction = useCallback(() => {
    if (data.content.timer?.pauseOnInteraction) {
      console.log('User interaction - Pausing timer');
      setHasInteracted(true);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }, [data.content.timer?.pauseOnInteraction, timeoutId]);

  const handleTransition = useCallback(() => {
    const edges = getEdges().filter(edge => edge.source === id);
    if (edges.length === 1) {
      const targetId = edges[0].target;
      const targetNode = getNode(targetId);
      
      if (targetNode) {
        setNodes(nodes => 
          nodes.map(node => ({
            ...node,
            style: {
              ...node.style,
              opacity: node.id === targetId ? 1 : 0,
              zIndex: node.id === targetId ? 2 : 1,
            },
          }))
        );
      }
    }
  }, [id, getEdges, getNode, setNodes]);

  return (
    <Box
      onClick={handleInteraction}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: 'black',
        cursor: data.content.timer?.pauseOnInteraction ? 'pointer' : 'default',
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Node content"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        />
      ) : (
        <Box sx={{ color: 'white' }}>Loading image...</Box>
      )}
      <Handle type="target" position={Position.Top} style={{ zIndex: 3 }} />
      <Handle type="source" position={Position.Bottom} style={{ zIndex: 3 }} />
    </Box>
  );
};

export default ImagePreviewNode;
