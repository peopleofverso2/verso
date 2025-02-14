import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectLibrary } from './components/ProjectLibrary/ProjectLibrary';
import { ScenarioEditor } from './components/Editor/ScenarioEditor';
import { ConfigPage } from './components/Settings/ConfigPage';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Container maxWidth={false} disableGutters sx={{ height: '100vh', overflow: 'hidden' }}>
            <Routes>
              <Route path="/" element={<ProjectLibrary />} />
              <Route 
                path="/editor/:projectId" 
                element={
                  <ProtectedRoute>
                    <ScenarioEditor />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <ConfigPage />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </Container>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
