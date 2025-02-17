import { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Box,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Info as InfoIcon,
  Style as StyleIcon,
  Palette as PaletteIcon,
  LocalOffer as TagIcon,
  Psychology as AIIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { MediaFile } from '../../types/media';
import MediaPreview from './MediaPreview';
import { ImageAnalyzer } from '../../services/ai/ImageAnalyzer';
import { MediaLibraryService } from '../../services/MediaLibraryService';

interface MediaCardProps {
  mediaFile: MediaFile;
  onDelete?: (mediaFile: MediaFile) => void;
  onUpdate?: (mediaFile: MediaFile) => void;
  selected?: boolean;
  onSelect?: () => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ 
  mediaFile, 
  onDelete, 
  onUpdate,
  selected = false,
  onSelect
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handlePreviewClick = () => {
    setPreviewOpen(true);
  };

  const handleInfoClick = () => {
    setInfoOpen(true);
  };

  const handleAnalyze = async () => {
    if (!mediaFile.metadata?.id) {
      console.error('No media ID found');
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    
    try {
      console.log('Starting analysis for media:', mediaFile.metadata.id);
      const imageAnalyzer = ImageAnalyzer.getInstance();
      const mediaLibraryService = await MediaLibraryService.getInstance();
      
      const analysis = await imageAnalyzer.analyzeImage(mediaFile.url);
      console.log('Analysis results:', analysis);
      
      // Mettre à jour les métadonnées avec les résultats de l'analyse
      const newTags = [
        ...(mediaFile.metadata.tags || []),
        ...(analysis.style && analysis.style.trim() !== '' ? [`style:${analysis.style.trim()}`] : []),
        ...(analysis.mood && analysis.mood.trim() !== '' ? [`mood:${analysis.mood.trim()}`] : []),
        ...analysis.dominantColors.filter(color => color.trim() !== '').map(color => `color:${color.trim()}`),
        ...analysis.tags.filter(tag => tag.trim() !== '').map(tag => tag.trim())
      ];

      const updatedMetadata = {
        ...mediaFile.metadata,
        tags: Array.from(new Set(newTags)),
        updatedAt: new Date().toISOString()
      };

      console.log('Updated metadata:', updatedMetadata);

      // Sauvegarder les métadonnées mises à jour
      const updatedMedia = await mediaLibraryService.updateMetadata(mediaFile.metadata.id, updatedMetadata);
      console.log('Saved updated media:', updatedMedia);

      // Notifier le parent de la mise à jour
      if (onUpdate) {
        console.log('Notifying parent of update');
        onUpdate(updatedMedia);
      }

      // Mettre à jour l'état local
      mediaFile.metadata = updatedMedia.metadata;
      setAnalyzing(false);
    } catch (error) {
      console.error('Error analyzing media:', error);
      setAnalysisError('Erreur lors de l\'analyse. Veuillez réessayer.');
      setAnalyzing(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (onSelect) {
      e.stopPropagation();
      onSelect();
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(mediaFile);
    }
    setDeleteDialogOpen(false);
  };

  // Vérifier si l'analyse IA est disponible
  const isAnalysisAvailable = Boolean(import.meta.env.VITE_OPENAI_API_KEY);

  // Grouper les tags par catégorie
  const tagGroups = {
    style: mediaFile.metadata.tags.find(tag => tag.startsWith('style:')),
    mood: mediaFile.metadata.tags.find(tag => tag.startsWith('mood:')),
    colors: mediaFile.metadata.tags.filter(tag => tag.startsWith('color:')),
    general: mediaFile.metadata.tags.filter(tag => 
      !tag.startsWith('style:') && 
      !tag.startsWith('mood:') && 
      !tag.startsWith('color:')
    ),
  };

  return (
    <>
      <Card 
        sx={{ 
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: onSelect ? 'pointer' : 'default',
          ...(selected && {
            outline: '2px solid',
            outlineColor: 'primary.main'
          })
        }}
        onClick={handleCardClick}
      >
        {selected && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 2,
              backgroundColor: 'primary.main',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CheckIcon sx={{ color: 'white', fontSize: 18 }} />
          </Box>
        )}

        <CardMedia
          component="div"
          sx={{
            position: 'relative',
            paddingTop: '56.25%', // 16:9
            backgroundColor: 'black',
          }}
        >
          {mediaFile.metadata.type === 'video' && (
            <IconButton
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                },
              }}
              onClick={(e) => {
                e.stopPropagation();
                handlePreviewClick();
              }}
            >
              <PlayIcon />
            </IconButton>
          )}

          <img
            src={mediaFile.thumbnailUrl || mediaFile.url}
            alt={mediaFile.metadata.name}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </CardMedia>

        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" noWrap>
            {mediaFile.metadata.name}
          </Typography>

          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {tagGroups.style && (
              <Tooltip title="Style">
                <Chip
                  icon={<StyleIcon />}
                  label={tagGroups.style.replace('style:', '')}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Tooltip>
            )}
            {tagGroups.mood && (
              <Tooltip title="Ambiance">
                <Chip
                  icon={<TagIcon />}
                  label={tagGroups.mood.replace('mood:', '')}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              </Tooltip>
            )}
          </Box>

          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                handleInfoClick();
              }}
            >
              <InfoIcon />
            </IconButton>
            {onDelete && (
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick();
                }}
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Dialog de prévisualisation */}
      <MediaPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        mediaFile={mediaFile}
      />

      {/* Dialog d'informations */}
      <Dialog 
        open={infoOpen} 
        onClose={() => setInfoOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Informations sur le média</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            {mediaFile.metadata.name}
          </Typography>

          {mediaFile.metadata.dimensions && (
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Dimensions: {mediaFile.metadata.dimensions.width}x{mediaFile.metadata.dimensions.height}
            </Typography>
          )}

          {mediaFile.metadata.duration && (
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Durée: {Math.round(mediaFile.metadata.duration)}s
            </Typography>
          )}

          <Typography variant="body2" color="textSecondary" gutterBottom>
            Taille: {(mediaFile.metadata.size / 1024 / 1024).toFixed(2)} MB
          </Typography>

          <Box sx={{ mt: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2">Style et Ambiance</Typography>
              <Tooltip title={isAnalysisAvailable ? "Analyser avec l'IA" : "Clé API OpenAI non configurée"}>
                <span>
                  <IconButton 
                    size="small" 
                    onClick={handleAnalyze}
                    disabled={analyzing || !isAnalysisAvailable}
                  >
                    {analyzing ? <CircularProgress size={20} /> : <AIIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            {analysisError && (
              <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                {analysisError}
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {tagGroups.style && (
                <Chip
                  icon={<StyleIcon />}
                  label={tagGroups.style.replace('style:', '')}
                  color="primary"
                />
              )}
              {tagGroups.mood && (
                <Chip
                  icon={<TagIcon />}
                  label={tagGroups.mood.replace('mood:', '')}
                  color="secondary"
                />
              )}
            </Box>
          </Box>

          {tagGroups.colors.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Couleurs dominantes
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {tagGroups.colors.map((color, index) => (
                  <Chip
                    key={index}
                    icon={<PaletteIcon />}
                    label={color.replace('color:', '')}
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {tagGroups.general.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          Êtes-vous sûr de vouloir supprimer "{mediaFile.metadata.name}" ?
          Cette action est irréversible.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MediaCard;
