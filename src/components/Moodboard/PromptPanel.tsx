import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  CircularProgress,
  Drawer,
  styled,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MovieIcon from '@mui/icons-material/Movie';
import { MoodboardZone } from '../../types/moodboard';
import { PromptGeneration } from '../../types/analysis';
import { AIAnalysisService } from '../../services/AIAnalysisService';
import { LumaService } from '../../services/LumaService';
import { MediaFile } from '../../types/media';

interface PromptPanelProps {
  zone: MoodboardZone;
  onClose: () => void;
}

const DrawerContent = styled(Box)(({ theme }) => ({
  width: '400px',
  height: '100%',
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

export const PromptPanel: React.FC<PromptPanelProps> = ({ zone, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptData, setPromptData] = useState<PromptGeneration | null>(null);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [generatedVideo, setGeneratedVideo] = useState<MediaFile | null>(null);
  
  const aiService = new AIAnalysisService();
  const lumaService = new LumaService();

  useEffect(() => {
    generatePrompt();
  }, [zone]);

  const generatePrompt = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await aiService.generatePrompt(zone);
      setPromptData(result);
      setEditedPrompt(result.prompt);
    } catch (error) {
      console.error('Error generating prompt:', error);
      setError('Erreur lors de la génération du prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    try {
      setGenerating(true);
      setError(null);
      setGeneratedVideo(null);

      const video = await lumaService.generateVideo(editedPrompt, {
        style_preset: promptData?.context.style,
        width: 1024,
        height: 576
      });

      setGeneratedVideo(video);
    } catch (error) {
      console.error('Error generating video:', error);
      setError('Erreur lors de la génération de la vidéo');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={true}
      onClose={onClose}
      variant="persistent"
    >
      <DrawerContent>
        <Header>
          <Typography variant="h6">Générateur de Prompts</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Header>

        <Typography variant="subtitle1" color="text.secondary">
          Zone: {zone.name}
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TextField
              label="Prompt"
              multiline
              rows={6}
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              fullWidth
              variant="outlined"
              disabled={generating}
            />

            {promptData?.context && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Contexte
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Style: {promptData.context.style}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ambiance: {promptData.context.mood}
                </Typography>
              </Box>
            )}

            {generatedVideo && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Vidéo Générée
                </Typography>
                <video
                  src={generatedVideo.url}
                  controls
                  style={{ width: '100%', borderRadius: 4 }}
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                onClick={generatePrompt}
                disabled={loading || generating}
              >
                Régénérer
              </Button>
              <Button
                variant="contained"
                startIcon={generating ? <CircularProgress size={20} /> : <MovieIcon />}
                onClick={handleGenerateVideo}
                disabled={loading || generating || !editedPrompt}
              >
                {generating ? 'Génération...' : 'Générer la Vidéo'}
              </Button>
            </Box>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};
