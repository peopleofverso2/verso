import React, { useState, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Box, Tabs, Tab, Typography, styled, CircularProgress } from '@mui/material';
import { MoodboardZone, DEFAULT_ZONES } from '../../types/moodboard';
import { MediaLibrary } from './MediaLibrary';
import { ZoneContent } from './ZoneContent';
import { PromptPanel } from './PromptPanel';
import { MoodboardDatabaseService } from '../../services/MoodboardDatabaseService';
import { MediaFile } from '../../types/media';

const MoodBoardContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: theme.palette.background.default,
  overflow: 'hidden',
}));

const ContentContainer = styled(Box)({
  display: 'flex',
  flexGrow: 1,
  overflow: 'hidden',
});

const MainContent = styled(Box)({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

const LoadingContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
});

export const MoodBoard: React.FC = () => {
  const [zones, setZones] = useState<MoodboardZone[]>([]);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [showPromptPanel, setShowPromptPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const dbService = new MoodboardDatabaseService();

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      setLoading(true);
      await dbService.initialize();
      
      // Charger les zones existantes ou initialiser avec les zones par défaut
      let savedZones = await dbService.getAllZones();
      if (savedZones.length === 0) {
        savedZones = DEFAULT_ZONES;
        await Promise.all(savedZones.map(zone => dbService.saveZone(zone)));
      }
      
      setZones(savedZones);
      setActiveZone(savedZones[0]?.id || null);
    } catch (error) {
      console.error('Error loading zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleZoneChange = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setActiveZone(newValue);
  }, []);

  const handleMediaDrop = useCallback(async (mediaFile: MediaFile, subCategoryId: string) => {
    if (!activeZone) return;

    try {
      await dbService.addMediaToSubCategory(activeZone, subCategoryId, mediaFile);
      // Recharger les zones pour mettre à jour l'interface
      await loadZones();
    } catch (error) {
      console.error('Error adding media to subcategory:', error);
    }
  }, [activeZone]);

  const handleMediaRemove = useCallback(async (mediaId: string, subCategoryId: string) => {
    if (!activeZone) return;

    try {
      await dbService.removeMediaFromSubCategory(activeZone, subCategoryId, mediaId);
      // Recharger les zones pour mettre à jour l'interface
      await loadZones();
    } catch (error) {
      console.error('Error removing media from subcategory:', error);
    }
  }, [activeZone]);

  if (loading) {
    return (
      <LoadingContainer>
        <CircularProgress />
      </LoadingContainer>
    );
  }

  const currentZone = zones.find(zone => zone.id === activeZone);

  return (
    <DndProvider backend={HTML5Backend}>
      <MoodBoardContainer>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeZone}
            onChange={handleZoneChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            {zones.map((zone) => (
              <Tab
                key={zone.id}
                label={zone.name}
                value={zone.id}
                sx={{ 
                  minWidth: 120,
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    color: 'primary.main',
                  }
                }}
              />
            ))}
          </Tabs>
        </Box>

        <ContentContainer>
          <MediaLibrary />
          
          <MainContent>
            {currentZone && (
              <ZoneContent
                zone={currentZone}
                onPromptGenerate={() => setShowPromptPanel(true)}
                onMediaDrop={handleMediaDrop}
                onMediaRemove={handleMediaRemove}
              />
            )}
          </MainContent>

          {showPromptPanel && currentZone && (
            <PromptPanel
              zone={currentZone}
              onClose={() => setShowPromptPanel(false)}
            />
          )}
        </ContentContainer>
      </MoodBoardContainer>
    </DndProvider>
  );
};
