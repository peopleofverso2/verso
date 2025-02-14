import React, { useState } from 'react';
import { Button, CircularProgress, Avatar, Box, Menu, MenuItem, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import GoogleIcon from '@mui/icons-material/Google';
import LogoutIcon from '@mui/icons-material/Logout';

export const LoginButton: React.FC = () => {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (user) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!user) {
        await signInWithGoogle();
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      handleClose();
    } catch (error: any) {
      console.error('Sign out error:', error);
      setError(error.message || 'Sign out failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <CircularProgress size={24} />;
  }

  if (user) {
    return (
      <>
        <Box 
          onClick={handleClick}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8
            }
          }}
        >
          <Avatar 
            src={user.photoURL || undefined}
            alt={user.displayName || 'User'}
            sx={{ width: 32, height: 32 }}
          />
          <Typography variant="body2" sx={{ color: 'white' }}>
            {user.displayName || user.email}
          </Typography>
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleSignOut}>
            <LogoutIcon sx={{ mr: 1 }} />
            Sign Out
          </MenuItem>
        </Menu>
      </>
    );
  }

  return (
    <Button
      variant="contained"
      onClick={handleAuth}
      startIcon={<GoogleIcon />}
      color={error ? "error" : "primary"}
      sx={{
        borderRadius: '20px',
        textTransform: 'none',
        px: 3
      }}
    >
      {error ? 'Retry' : 'Sign in with Google'}
    </Button>
  );
};
