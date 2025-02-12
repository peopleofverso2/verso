import { useState } from 'react';
import {
  Card,
  CardMedia,
  Box,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Checkbox,
  Typography,
  IconButton,
  Button,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Image as ImageIcon,
  MusicNote as MusicNoteIcon,
  Movie as MovieIcon,
} from '@mui/icons-material';
import { MediaFile } from '../../types/media';
import MediaPreview from './MediaPreview';

interface MediaCardProps {
  mediaFile: MediaFile;
  onSelect?: (mediaFile: MediaFile) => void;
  onDelete?: (mediaFile: MediaFile) => void;
  selected?: boolean;
}

export default function MediaCard({
  mediaFile,
  onSelect,
  onDelete,
  selected = false,
}: MediaCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewOpen(true);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(mediaFile);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(mediaFile);
    }
    setDeleteDialogOpen(false);
  };

  const renderThumbnail = () => {
    switch (mediaFile.metadata.type) {
      case 'video':
        return (
          <>
            <CardMedia
              component="img"
              image={mediaFile.thumbnailUrl || mediaFile.url}
              alt={mediaFile.metadata.name}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '50%',
                p: 1,
              }}
            >
              <PlayArrowIcon sx={{ color: 'white', fontSize: 40 }} />
            </Box>
          </>
        );
      case 'image':
        return (
          <CardMedia
            component="img"
            image={mediaFile.url}
            alt={mediaFile.metadata.name}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        );
      case 'audio':
        return (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              bgcolor: 'action.hover',
            }}
          >
            <MusicNoteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '50%',
                p: 1,
              }}
            >
              <PlayArrowIcon sx={{ color: 'white', fontSize: 40 }} />
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Card 
        sx={{ 
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%', // 16:9 aspect ratio
          bgcolor: 'background.paper',
          cursor: 'pointer',
          '&:hover': {
            '& .media-overlay': {
              opacity: 1,
            },
          },
        }}
        onClick={handlePreviewClick}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          {renderThumbnail()}
          <Box
            className="media-overlay"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0, 0, 0, 0.3)',
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              p: 0.5,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {mediaFile.metadata.name}
          </Typography>
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 1,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {onDelete && (
            <IconButton
              size="small"
              onClick={handleDeleteClick}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
        {onSelect && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '4px',
              zIndex: 1,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={selected}
              onChange={handleCheckboxChange}
            />
          </Box>
        )}
      </Card>

      {/* Dialog de prévisualisation */}
      <MediaPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        mediaFile={mediaFile}
      />

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
}
