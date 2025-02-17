import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { MediaUploadService } from '../../services/media/MediaUploadService';

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
  acceptedTypes?: string[];
}

export default function UploadDialog({
  open,
  onClose,
  onUpload,
  acceptedTypes = [],
}: UploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadService = MediaUploadService.getInstance();

  const handleFiles = useCallback((files: File[]) => {
    const validFiles = files.filter(file => uploadService.validateFile(file, acceptedTypes));
    
    if (validFiles.length < files.length) {
      setError('Some files were rejected due to invalid type');
    }
    
    setSelectedFiles(validFiles);
    setError(validFiles.length === 0 ? 'No valid files selected' : null);
  }, [acceptedTypes]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    handleFiles(files);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    handleFiles(files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError(null);
    
    try {
      await uploadService.uploadMultipleMedia(selectedFiles, (progress) => {
        setUploadProgress(progress);
      });
      
      await onUpload(selectedFiles);
      setSelectedFiles([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Media</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            border: '2px dashed #ccc',
            borderRadius: 1,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
            },
          }}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            multiple
            accept={acceptedTypes.join(',')}
          />
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="body1" gutterBottom>
            Drag and drop files here or click to select
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Accepted types: {acceptedTypes.join(', ') || 'All files'}
          </Typography>
        </Box>

        {selectedFiles.length > 0 && (
          <List>
            {selectedFiles.map((file, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                />
              </ListItem>
            ))}
          </List>
        )}

        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
              Uploading... {Math.round(uploadProgress)}%
            </Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', color: 'error.main' }}>
            <ErrorIcon sx={{ mr: 1 }} />
            <Typography color="inherit">{error}</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || uploading}
          variant="contained"
          startIcon={<CloudUploadIcon />}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}
