import React from 'react';
import { Alert, AlertTitle, Snackbar } from '@mui/material';
import { useError } from '../hooks/useError';
import { ErrorDetails } from '../services/ErrorService';

const getAlertSeverity = (error: ErrorDetails) => {
  switch (error.severity) {
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'error';
  }
};

const getAlertTitle = (error: ErrorDetails) => {
  switch (error.severity) {
    case 'error':
      return 'Error';
    case 'warning':
      return 'Warning';
    case 'info':
      return 'Information';
    default:
      return 'Notice';
  }
};

export const ErrorAlert: React.FC = () => {
  const { error, clearError } = useError();

  if (!error) return null;

  return (
    <Snackbar
      open={!!error}
      autoHideDuration={6000}
      onClose={clearError}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={clearError}
        severity={getAlertSeverity(error)}
        variant="filled"
        sx={{ width: '100%' }}
      >
        <AlertTitle>{getAlertTitle(error)}</AlertTitle>
        {error.message}
        {error.code && (
          <div style={{ fontSize: '0.8em', marginTop: '4px' }}>
            Code: {error.code}
          </div>
        )}
      </Alert>
    </Snackbar>
  );
};
