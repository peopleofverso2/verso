import React from 'react';
import { Button } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import GoogleIcon from '@mui/icons-material/Google';

export const LoginButton: React.FC = () => {
  const { user, signInWithGoogle, signOut } = useAuth();

  const handleAuth = async () => {
    if (user) {
      await signOut();
    } else {
      await signInWithGoogle();
    }
  };

  return (
    <Button
      variant="contained"
      onClick={handleAuth}
      startIcon={user ? null : <GoogleIcon />}
      sx={{
        borderRadius: '20px',
        textTransform: 'none',
        px: 3
      }}
    >
      {user ? 'Sign Out' : 'Sign in with Google'}
    </Button>
  );
};
