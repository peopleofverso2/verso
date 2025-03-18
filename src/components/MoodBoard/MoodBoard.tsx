import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  LinearProgress,
  Snackbar,
  Alert,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { MediaLibraryService } from '../../services/MediaLibraryService';
import { MoodBoardService } from '../../services/MoodBoardService';
import { MoodBoard as IMoodBoard } from '../../types/moodboard';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

const DropZone = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  textAlign: 'center',
  backgroundColor: theme.palette.background.default,
  cursor: 'pointer',
  transition: 'border-color 0.2s ease-in-out',
  '&:hover': {
    borderColor: theme.palette.primary.main,
  },
}));

const MediaGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
}));

const MediaItem = styled(Paper)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  aspectRatio: '1',
  '&:hover .media-actions': {
    opacity: 1,
  },
}));

const MediaActions = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  padding: theme.spacing(0.5),
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  opacity: 0,
  transition: 'opacity 0.2s ease-in-out',
}));

export const MoodBoard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [moodBoard, setMoodBoard] = useState<IMoodBoard | null>(null);
  const [uploads, setUploads] = useState<{ [key: string]: number }>({});
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: ''
  });

  const mediaLibrary = MediaLibraryService.getInstance();
  const moodBoardService = MoodBoardService.getInstance();

  useEffect(() => {
    if (id) {
      loadMoodBoard();
    }
  }, [id]);

  const loadMoodBoard = async () => {
    if (!id) return;
    try {
      const board = await moodBoardService.getMoodBoard(id);
      if (!board) {
        navigate('/moodboards');
        return;
      }
      setMoodBoard(board);
      setFormData({
        name: board.name,
        description: board.description,
        tags: board.tags.join(', ')
      });
    } catch (error) {
      console.error('Error loading mood board:', error);
      setNotification({
        open: true,
        message: 'Erreur lors du chargement du mood board',
        severity: 'error'
      });
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!id) return;

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;

      const uploadId = Date.now().toString();
      setUploads(prev => ({ ...prev, [uploadId]: 0 }));

      try {
        const metadata = await mediaLibrary.uploadMedia(file, (progress) => {
          setUploads(prev => ({ ...prev, [uploadId]: progress }));
        });

        await moodBoardService.updateMoodBoard(id, {
          mediaIds: [...(moodBoard?.mediaIds || []), metadata.id]
        });

        setUploads(prev => {
          const { [uploadId]: removed, ...rest } = prev;
          return rest;
        });

        await loadMoodBoard();

        setNotification({
          open: true,
          message: 'Image ajoutée avec succès',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        setNotification({
          open: true,
          message: 'Erreur lors de l\'upload de l\'image',
          severity: 'error'
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!id || !moodBoard) return;

    try {
      await moodBoardService.updateMoodBoard(id, {
        mediaIds: moodBoard.mediaIds.filter(id => id !== mediaId)
      });
      await mediaLibrary.deleteMedia(mediaId);
      await loadMoodBoard();

      setNotification({
        open: true,
        message: 'Image supprimée avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting media:', error);
      setNotification({
        open: true,
        message: 'Erreur lors de la suppression de l\'image',
        severity: 'error'
      });
    }
  };

  const handleEditMoodBoard = async () => {
    if (!id) return;
    try {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      await moodBoardService.updateMoodBoard(id, {
        name: formData.name,
        description: formData.description,
        tags
      });
      setIsEditDialogOpen(false);
      await loadMoodBoard();
      setNotification({
        open: true,
        message: 'Mood board mis à jour avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating mood board:', error);
      setNotification({
        open: true,
        message: 'Erreur lors de la mise à jour du mood board',
        severity: 'error'
      });
    }
  };

  const handleDeleteMoodBoard = async () => {
    if (!id) return;
    try {
      await moodBoardService.deleteMoodBoard(id);
      navigate('/moodboards');
      setNotification({
        open: true,
        message: 'Mood board supprimé avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting mood board:', error);
      setNotification({
        open: true,
        message: 'Erreur lors de la suppression du mood board',
        severity: 'error'
      });
    }
  };

  const handleGenerateProfile = async () => {
    if (!id) return;
    try {
      await moodBoardService.generateProfile(id);
      await loadMoodBoard();
      setIsProfileDialogOpen(false);
      setNotification({
        open: true,
        message: 'Profil généré avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error generating profile:', error);
      setNotification({
        open: true,
        message: 'Erreur lors de la génération du profil',
        severity: 'error'
      });
    }
  };

  if (!moodBoard) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">{moodBoard.name}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<AutoFixHighIcon />}
            onClick={() => setIsProfileDialogOpen(true)}
            variant="outlined"
          >
            Générer Profil
          </Button>
          <IconButton onClick={() => setIsEditDialogOpen(true)}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => setIsDeleteDialogOpen(true)} color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        {moodBoard.description}
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {moodBoard.tags.map((tag) => (
          <Chip key={tag} label={tag} size="small" />
        ))}
      </Box>

      {moodBoard.profile && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            Profil Généré
          </Typography>
          <Typography variant="body2" paragraph>
            {moodBoard.profile.description}
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            Prompt généré :
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {moodBoard.profile.generatedPrompt}
          </Typography>
        </Paper>
      )}

      <DropZone
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Typography>
          Glissez et déposez des images ici
        </Typography>
      </DropZone>

      {Object.entries(uploads).length > 0 && (
        <Box sx={{ mt: 2 }}>
          {Object.entries(uploads).map(([id, progress]) => (
            <Box key={id} sx={{ mb: 1 }}>
              <Typography variant="caption">Upload en cours...</Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          ))}
        </Box>
      )}

      <MediaGrid>
        {moodBoard.mediaIds.map((mediaId) => (
          <MediaItem key={mediaId} elevation={2}>
            <img
              src={mediaLibrary.getMediaUrl(mediaId)}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <MediaActions className="media-actions">
              <IconButton
                size="small"
                onClick={() => handleDeleteMedia(mediaId)}
                sx={{ color: 'white' }}
              >
                <DeleteIcon />
              </IconButton>
            </MediaActions>
          </MediaItem>
        ))}
      </MediaGrid>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
        <DialogTitle>Modifier le Mood Board</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nom"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Tags (séparés par des virgules)"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleEditMoodBoard} variant="contained">Enregistrer</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Supprimer le Mood Board</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer ce mood board ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleDeleteMoodBoard} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onClose={() => setIsProfileDialogOpen(false)}>
        <DialogTitle>Générer un profil</DialogTitle>
        <DialogContent>
          <Typography>
            Voulez-vous générer un profil basé sur les médias de ce mood board ?
            Cela analysera les images et créera un profil détaillé qui pourra être utilisé
            pour le storyboard.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsProfileDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleGenerateProfile} variant="contained">
            Générer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
