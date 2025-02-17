import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from './theme';
import { ProjectLibrary } from './components/ProjectLibrary/ProjectLibrary';
import { ScenarioEditor } from './components/Editor/ScenarioEditor';
import { ConfigPage } from './components/Settings/ConfigPage';
import { Alert, Snackbar } from '@mui/material';
import { validateApiKey } from './services/ai/validateApiKey';
import { AuthProvider } from './contexts/AuthContext';

interface ApiStatus {
  isValid: boolean;
  permissions?: {
    canUseGpt4: boolean;
    canUseVision: boolean;
    canUseGpt35: boolean;
  };
  error?: string;
}

const App: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          setError('Clé API OpenAI manquante dans les variables d\'environnement');
          setApiStatus({ isValid: false });
          return;
        }

        console.log('Vérification de la clé API OpenAI...');
        const result = await validateApiKey(apiKey);
        setApiStatus(result);
        
        if (!result.isValid) {
          setError('La clé API OpenAI est invalide');
        } else if (!result.permissions?.canUseVision) {
          setError('Cette clé API n\'a pas accès aux fonctionnalités Vision d\'OpenAI');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la clé API:', error);
        setError('Erreur lors de la vérification de la clé API OpenAI');
        setApiStatus({ isValid: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    };

    checkApiKey();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Container maxWidth={false} sx={{ height: '100vh', p: 0 }}>
            <Routes>
              <Route path="/" element={<ProjectLibrary />} />
              <Route path="/editor/:projectId" element={<ScenarioEditor />} />
              <Route path="/settings" element={<ConfigPage />} />
            </Routes>
          </Container>
          <Snackbar 
            open={error !== null} 
            autoHideDuration={6000} 
            onClose={() => setError(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert 
              onClose={() => setError(null)} 
              severity="error" 
              variant="filled"
            >
              {error}
            </Alert>
          </Snackbar>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
