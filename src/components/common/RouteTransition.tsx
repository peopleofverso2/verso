import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

interface RouteTransitionProps {
  children: React.ReactNode;
}

export const RouteTransition: React.FC<RouteTransitionProps> = ({ children }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const location = useLocation();
  const previousPath = React.useRef(location.pathname);

  React.useEffect(() => {
    // Ne déclencher l'animation que si le chemin a changé
    if (previousPath.current !== location.pathname) {
      setIsLoading(true);
      
      // Mettre à jour le chemin précédent
      previousPath.current = location.pathname;
      
      // Attendre que l'animation soit terminée avant de recharger
      const timer = setTimeout(() => {
        window.location.reload();
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          padding: 3,
          boxShadow: 3,
          zIndex: 9999,
        }}
      >
        <CircularProgress size={40} />
        <Box sx={{ color: 'text.primary', fontWeight: 500 }}>
          Chargement...
        </Box>
      </Box>
      {children}
    </>
  );
};
