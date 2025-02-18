import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FF8C00', // Orange DaVinci
      light: '#FFA640',
      dark: '#CC7000',
    },
    secondary: {
      main: '#4A90E2', // Bleu DaVinci
      light: '#71A7E8',
      dark: '#2C71C7',
    },
    background: {
      default: '#2A2A2A',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#2A2A2A',
          color: '#FFFFFF',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E1E1E',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E1E1E',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
});
