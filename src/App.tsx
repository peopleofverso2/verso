import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, CssBaseline, ThemeProvider, CircularProgress } from '@mui/material';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectLibrary } from './components/ProjectLibrary/ProjectLibrary';
import { ScenarioEditor } from './components/Editor/ScenarioEditor';
import { ConfigPage } from './components/Settings/ConfigPage';
import { MediaLibraryService } from './services/MediaLibraryService'; // Import MediaLibraryService

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeServices = async () => {
      try {
        const mediaLibrary = MediaLibraryService.getInstance();
        await mediaLibrary.initialize();
        
        if (!mediaLibrary.isInitialized()) {
          throw new Error('Failed to initialize MediaLibraryService');
        }

        setIsInitialized(true);
      } catch (err) {
        console.error('Error initializing services:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize application');
      }
    };

    initializeServices();
  }, []);

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <CircularProgress />
        <p>Initializing application...</p>
      </div>
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Container maxWidth={false} disableGutters sx={{ height: '100vh', overflow: 'hidden' }}>
            <Routes>
              <Route path="/" element={<ProjectLibrary />} />
              <Route path="/editor/:projectId" element={<ScenarioEditor />} />
              <Route path="/settings" element={<ConfigPage />} />
            </Routes>
          </Container>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
