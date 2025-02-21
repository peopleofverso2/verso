import React, { useState, useCallback, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Button,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { PovExportService } from '../../../services/PovExportService';
import { styled } from '@mui/material/styles';
import MinipovPlayer from './MinipovPlayer';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  width: 300,
  minHeight: 200,
  display: 'flex',
  flexDirection: 'column',
}));

const PreviewContainer = styled(Box)({
  width: '100%',
  height: 150,
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 4,
  backgroundColor: '#000',
  marginBottom: 8,
});

interface PovNodeData {
  id: string;
  povFile?: {
    title: string;
    nodes: any[];
    edges: any[];
    media: Record<string, any>;
  };
  onDataChange?: (nodeId: string, data: any) => void;
}

const PovNode: React.FC<{ data: PovNodeData }> = ({ data }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const povService = PovExportService.getInstance();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const povData = await povService.importFromPovFile(file);
      
      // Mettre à jour les données du node
      if (data.onDataChange) {
        data.onDataChange(data.id, {
          ...data,
          povFile: {
            title: file.name,
            ...povData
          }
        });
      }
    } catch (error) {
      console.error('Error importing POV file:', error);
    }

    // Reset input
    event.target.value = '';
  }, [data, povService]);

  const togglePlayback = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  return (
    <StyledPaper elevation={3}>
      {/* Handle d'entrée */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555' }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 600 }}>
          {data.povFile?.title || 'POV Node'}
        </Typography>
        <IconButton
          size="small"
          onClick={() => fileInputRef.current?.click()}
          title="Importer un POV"
        >
          <UploadIcon />
        </IconButton>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pov"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
      </Box>

      <PreviewContainer>
        {data.povFile ? (
          <>
            <MinipovPlayer
              nodes={data.povFile.nodes}
              edges={data.povFile.edges}
              media={data.povFile.media}
              isPlaying={isPlaying}
              onComplete={() => setIsPlaying(false)}
            />
            <IconButton
              size="small"
              onClick={togglePlayback}
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                },
                color: 'white',
              }}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
          </>
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              Importer un POV
            </Button>
          </Box>
        )}
      </PreviewContainer>

      {data.povFile && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            {data.povFile.nodes.length} nœuds • {Object.keys(data.povFile.media).length} médias
          </Typography>
        </Box>
      )}

      {/* Handle de sortie */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#555' }}
      />
    </StyledPaper>
  );
};

export default PovNode;
