import React, { useState } from 'react';
import { Container, CssBaseline, ThemeProvider, Box } from '@mui/material';
import { theme } from './theme';
import ScenarioEditor from './components/Editor/ScenarioEditor';
import ProjectLibrary from './components/ProjectLibrary/ProjectLibrary';
import { ProjectService } from './services/projectService';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigPage } from './components/Settings/ConfigPage';

function App() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectService] = useState(() => ProjectService.getInstance());

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleBackToLibrary = () => {
    setSelectedProjectId(null);
  };

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/" element={
                <Container maxWidth={false} disableGutters sx={{ height: '100vh', overflow: 'hidden' }}>
                  {selectedProjectId ? (
                    <ScenarioEditor
                      projectId={selectedProjectId}
                      onBackToLibrary={handleBackToLibrary}
                    />
                  ) : (
                    <ProjectLibrary onProjectSelect={handleProjectSelect} />
                  )}
                </Container>
              } />
              <Route path="/editor/:projectId" element={
                <Container maxWidth={false} disableGutters sx={{ height: '100vh', overflow: 'hidden' }}>
                  <ScenarioEditor projectId={selectedProjectId} onBackToLibrary={handleBackToLibrary} />
                </Container>
              } />
              <Route path="/settings" element={
                <Container maxWidth={false} disableGutters sx={{ height: '100vh', overflow: 'hidden' }}>
                  <ConfigPage />
                </Container>
              } />
            </Routes>
          </Box>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
