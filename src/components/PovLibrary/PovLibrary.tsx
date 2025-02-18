import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import PovApiService, { PovFile, PovMetadata } from '../../services/PovApiService';
import { LoggingService } from '../../services/loggingService';

interface PovLibraryProps {
  projectId: string;
}

const PovLibrary: React.FC<PovLibraryProps> = ({ projectId }) => {
  const [povFiles, setPovFiles] = useState<PovMetadata[]>([]);
  const [selectedPov, setSelectedPov] = useState<PovFile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPovName, setNewPovName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const povService = PovApiService.getInstance();
  const logger = LoggingService.getInstance();

  useEffect(() => {
    loadPovFiles();
  }, [projectId]);

  const loadPovFiles = async () => {
    try {
      const files = await povService.listProjectPovFiles(projectId);
      setPovFiles(files);
    } catch (error) {
      logger.error('Error loading POV files', { error, projectId });
    }
  };

  const handleCreatePov = async () => {
    try {
      const newPov: Omit<PovFile, 'createdAt' | 'updatedAt'> = {
        id: crypto.randomUUID(),
        projectId,
        name: newPovName,
        content: '',
        metadata: {
          numberOfNodes: 0
        }
      };

      await povService.savePovFile(newPov);
      await loadPovFiles();
      setNewPovName('');
      setIsDialogOpen(false);
    } catch (error) {
      logger.error('Error creating POV file', { error });
    }
  };

  const handleEditPov = async (povId: string) => {
    try {
      const povFile = await povService.getPovFile(povId);
      setSelectedPov(povFile);
      setIsEditing(true);
    } catch (error) {
      logger.error('Error loading POV file for edit', { error, povId });
    }
  };

  const handleDeletePov = async (povId: string) => {
    try {
      await povService.deletePovFile(povId);
      await loadPovFiles();
    } catch (error) {
      logger.error('Error deleting POV file', { error, povId });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedPov) return;

    try {
      await povService.savePovFile(selectedPov);
      await loadPovFiles();
      setSelectedPov(null);
      setIsEditing(false);
    } catch (error) {
      logger.error('Error saving POV file', { error, id: selectedPov.id });
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">POV Files</Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          color="primary"
          onClick={() => setIsDialogOpen(true)}
        >
          New POV
        </Button>
      </Box>

      <List>
        {povFiles.map((pov) => (
          <ListItem key={pov.id}>
            <ListItemText
              primary={pov.name}
              secondary={`Last modified: ${new Date(pov.updatedAt).toLocaleString()}`}
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" aria-label="edit" onClick={() => handleEditPov(pov.id)}>
                <EditIcon />
              </IconButton>
              <IconButton edge="end" aria-label="delete" onClick={() => handleDeletePov(pov.id)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      {/* Create POV Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Create New POV</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="POV Name"
            fullWidth
            value={newPovName}
            onChange={(e) => setNewPovName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreatePov} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit POV Dialog */}
      <Dialog open={isEditing} onClose={() => setIsEditing(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit POV</DialogTitle>
        <DialogContent>
          {selectedPov && (
            <TextField
              margin="dense"
              label="POV Content"
              fullWidth
              multiline
              rows={10}
              value={selectedPov.content}
              onChange={(e) => setSelectedPov({ ...selectedPov, content: e.target.value })}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditing(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PovLibrary;
