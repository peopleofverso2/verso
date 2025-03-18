import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  LinearProgress, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material';
import { StorageManager as StorageManagerService, StorageStats, ExportData } from '../../services/storage/StorageManager';

export const StorageManager: React.FC = () => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const storageManager = StorageManagerService.getInstance();

  const loadStats = async () => {
    try {
      const currentStats = await storageManager.getStorageStats();
      setStats(currentStats);
    } catch (error) {
      console.error('Error loading storage stats:', error);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportData = await storageManager.exportMedia();
      const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `verso-media-export-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setNotification({
        open: true,
        message: 'Export completed successfully',
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error during export: ' + (error instanceof Error ? error.message : 'Unknown error'),
        severity: 'error'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importData: ExportData = JSON.parse(e.target?.result as string);
          const result = await storageManager.importMedia(importData);
          
          setNotification({
            open: true,
            message: `Import completed: ${result.success} successful, ${result.failed} failed`,
            severity: result.failed > 0 ? 'info' : 'success'
          });
          
          loadStats();
        } catch (error) {
          setNotification({
            open: true,
            message: 'Error during import: ' + (error instanceof Error ? error.message : 'Unknown error'),
            severity: 'error'
          });
        }
      };
      reader.readAsText(file);
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error reading import file',
        severity: 'error'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCleanup = async () => {
    setOpenDialog(false);
    setIsCleaning(true);
    try {
      await storageManager.cleanupUnusedMedia();
      await loadStats();
      setNotification({
        open: true,
        message: 'Cleanup completed successfully',
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error during cleanup: ' + (error instanceof Error ? error.message : 'Unknown error'),
        severity: 'error'
      });
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Storage Management
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Storage Statistics
          </Typography>
          
          {stats && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Storage Usage
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(stats.totalSize / (500 * 1024 * 1024)) * 100}
                  sx={{ mt: 1 }}
                />
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {formatSize(stats.totalSize)} / 500 MB
                </Typography>
              </Box>

              <Typography>
                Total Media Items: {stats.mediaCount}
              </Typography>
              <Typography>
                Unused Media Items: {stats.unusedMediaCount}
              </Typography>
              {stats.lastCleanup && (
                <Typography>
                  Last Cleanup: {new Date(stats.lastCleanup).toLocaleString()}
                </Typography>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export Media'}
        </Button>

        <Button
          variant="contained"
          component="label"
          disabled={isImporting}
        >
          {isImporting ? 'Importing...' : 'Import Media'}
          <input
            type="file"
            hidden
            accept=".json"
            onChange={handleImport}
          />
        </Button>

        <Button
          variant="contained"
          color="warning"
          onClick={() => setOpenDialog(true)}
          disabled={isCleaning || !stats?.unusedMediaCount}
        >
          {isCleaning ? 'Cleaning...' : 'Cleanup Unused Media'}
        </Button>
      </Box>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>
          Confirm Cleanup
        </DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete {stats?.unusedMediaCount} unused media items.
            Are you sure you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleCleanup} color="warning" variant="contained">
            Confirm Cleanup
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
