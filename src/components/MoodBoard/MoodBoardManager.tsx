import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Chip,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { MoodBoardService } from '../../services/MoodBoardService';
import { MoodBoard, MoodBoardFilter } from '../../types/moodboard';
import { MediaLibraryService } from '../../services/MediaLibraryService';

export const MoodBoardManager: React.FC = () => {
  const [moodBoards, setMoodBoards] = useState<MoodBoard[]>([]);
  const [selectedMoodBoard, setSelectedMoodBoard] = useState<MoodBoard | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<MoodBoardFilter>({
    sortBy: 'updatedAt',
    sortDirection: 'desc'
  });
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBoardForMenu, setSelectedBoardForMenu] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: ''
  });

  const moodBoardService = MoodBoardService.getInstance();
  const mediaLibrary = MediaLibraryService.getInstance();

  useEffect(() => {
    loadMoodBoards();
  }, [filter]);

  const loadMoodBoards = async () => {
    try {
      const boards = await moodBoardService.listMoodBoards({
        ...filter,
        searchTerm: searchTerm
      });
      setMoodBoards(boards);
    } catch (error) {
      console.error('Error loading mood boards:', error);
    }
  };

  const handleCreateMoodBoard = async () => {
    try {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      await moodBoardService.createMoodBoard(formData.name, formData.description, tags);
      setIsCreateDialogOpen(false);
      setFormData({ name: '', description: '', tags: '' });
      loadMoodBoards();
    } catch (error) {
      console.error('Error creating mood board:', error);
    }
  };

  const handleEditMoodBoard = async () => {
    if (!selectedMoodBoard) return;
    try {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      await moodBoardService.updateMoodBoard(selectedMoodBoard.id, {
        name: formData.name,
        description: formData.description,
        tags
      });
      setIsEditDialogOpen(false);
      loadMoodBoards();
    } catch (error) {
      console.error('Error updating mood board:', error);
    }
  };

  const handleDeleteMoodBoard = async () => {
    if (!selectedMoodBoard) return;
    try {
      await moodBoardService.deleteMoodBoard(selectedMoodBoard.id);
      setIsDeleteDialogOpen(false);
      setSelectedMoodBoard(null);
      loadMoodBoards();
    } catch (error) {
      console.error('Error deleting mood board:', error);
    }
  };

  const handleGenerateProfile = async () => {
    if (!selectedMoodBoard) return;
    try {
      await moodBoardService.generateProfile(selectedMoodBoard.id);
      setIsProfileDialogOpen(false);
      loadMoodBoards();
    } catch (error) {
      console.error('Error generating profile:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, boardId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedBoardForMenu(boardId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedBoardForMenu(null);
  };

  const handleMenuAction = async (action: 'edit' | 'delete' | 'profile') => {
    const board = moodBoards.find(b => b.id === selectedBoardForMenu);
    if (!board) return;

    setSelectedMoodBoard(board);
    handleMenuClose();

    switch (action) {
      case 'edit':
        setFormData({
          name: board.name,
          description: board.description,
          tags: board.tags.join(', ')
        });
        setIsEditDialogOpen(true);
        break;
      case 'delete':
        setIsDeleteDialogOpen(true);
        break;
      case 'profile':
        setIsProfileDialogOpen(true);
        break;
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>, boardId: string) => {
    event.preventDefault();
    const board = moodBoards.find(b => b.id === boardId);
    if (!board) return;

    try {
      // Gérer les fichiers déposés
      const files = Array.from(event.dataTransfer.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));

      for (const file of imageFiles) {
        // Créer un blob URL pour prévisualisation
        const url = URL.createObjectURL(file);
        
        // Ajouter le média à la bibliothèque
        const mediaId = await mediaLibrary.addMedia({
          file,
          type: 'image',
          name: file.name,
          mimeType: file.type,
          size: file.size,
          tags: board.tags
        });

        // Mettre à jour le mood board avec le nouveau média
        const updatedMediaIds = [...board.mediaIds, mediaId];
        await moodBoardService.updateMoodBoard(board.id, { mediaIds: updatedMediaIds });

        // Libérer le blob URL
        URL.revokeObjectURL(url);
      }

      // Générer un nouveau profil
      await moodBoardService.generateProfile(board.id);

      // Recharger les mood boards
      loadMoodBoards();
    } catch (error) {
      console.error('Error handling dropped files:', error);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Mood Boards</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsCreateDialogOpen(true)}
        >
          Nouveau Mood Board
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Box>

      <Grid container spacing={3}>
        {moodBoards.map((board) => (
          <Grid item xs={12} sm={6} md={4} key={board.id}>
            <Paper
              sx={{
                p: 2,
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onDrop={(e) => handleDrop(e, board.id)}
              onDragOver={handleDragOver}
            >
              <Typography variant="h6" gutterBottom>
                {board.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {board.description}
              </Typography>
              <Box sx={{ mt: 'auto' }}>
                <Typography variant="caption" display="block">
                  {board.mediaIds.length} images
                </Typography>
                {board.profile && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    {board.profile.description}
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)}>
        <DialogTitle>Créer un nouveau Mood Board</DialogTitle>
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
            helperText="Ex: moderne, minimaliste, nature"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleCreateMoodBoard} variant="contained">Créer</Button>
        </DialogActions>
      </Dialog>

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

      {/* Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleMenuAction('edit')}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Modifier
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('profile')}>
          <AutoFixHighIcon sx={{ mr: 1 }} fontSize="small" />
          Générer profil
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('delete')} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Supprimer
        </MenuItem>
      </Menu>
    </Box>
  );
};
