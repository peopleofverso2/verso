import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, CssBaseline, ThemeProvider, CircularProgress, Box } from '@mui/material';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectLibrary } from './components/ProjectLibrary/ProjectLibrary';
import { ScenarioEditor } from './components/Editor/ScenarioEditor';
import { ConfigPage } from './components/Settings/ConfigPage';
import { MediaLibraryService } from './services/MediaLibraryService';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LoginPage from './components/Auth/LoginPage';

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
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </Box>
    );
  }

  if (!isInitialized) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <p>Initializing application...</p>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Container maxWidth={false} disableGutters sx={{ height: '100vh', overflow: 'hidden' }}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProjectLibrary />} />
              <Route
                path="/editor/:projectId"
                element={
                  <ProtectedRoute>
                    <ScenarioEditor />
                  </ProtectedRoute>
                }
              />
              <Route path="/settings" element={<ConfigPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Container>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
