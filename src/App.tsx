import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectLibrary } from './components/ProjectLibrary/ProjectLibrary';
import { ScenarioEditor } from './components/Editor/ScenarioEditor';
import { ConfigPage } from './components/Settings/ConfigPage';
import { MoodboardCanvas } from './components/Moodboard/MoodboardCanvas';
import { StorytellingCanvas } from './components/Storytelling/StorytellingCanvas';
import { Navbar } from './components/Navigation/Navbar';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ 
            display: 'flex', 
            minHeight: '100vh',
            backgroundColor: '#2A2A2A', // DaVinci style dark background
          }}>
            <Navbar />
            <Box sx={{ 
              flexGrow: 1, 
              ml: '64px', // Width of the navbar
              height: '100vh',
              overflow: 'auto',
              backgroundColor: '#2A2A2A',
            }}>
              <Routes>
                <Route path="/" element={<ProjectLibrary />} />
                <Route path="/editor/:projectId" element={<ScenarioEditor />} />
                <Route path="/settings" element={<ConfigPage />} />
                <Route path="/moodboard" element={<MoodboardCanvas />} />
                <Route path="/storytelling" element={<StorytellingCanvas />} />
              </Routes>
            </Box>
          </Box>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
