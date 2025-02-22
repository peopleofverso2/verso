import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  Container,
  alpha,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithGoogle } = useAuth();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleGoogleSignIn = async () => {
    try {
      setError(undefined);
      setIsLoading(true);
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 4,
            width: '100%',
            backgroundColor: (theme) =>
              alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(8px)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom>
              Bienvenue sur Verso
            </Typography>

            <Typography variant="body1" color="text.secondary" align="center">
              Connectez-vous pour accéder à l'éditeur de scénarios
            </Typography>

            {error && (
              <Alert severity="error" sx={{ width: '100%' }}>
                {error}
              </Alert>
            )}

            <Button
              variant="contained"
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              sx={{ width: '100%', py: 1.5 }}
            >
              {isLoading ? 'Connexion en cours...' : 'Se connecter avec Google'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
