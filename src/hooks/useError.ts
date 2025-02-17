import { useState, useEffect } from 'react';
import { ErrorDetails } from '../services/ErrorService';
import { EventService } from '../services/EventService';

export const useError = () => {
  const [error, setError] = useState<ErrorDetails | null>(null);
  const eventService = EventService.getInstance();

  useEffect(() => {
    const handleError = (errorDetails: ErrorDetails) => {
      setError(errorDetails);
    };

    eventService.on('error', handleError);

    return () => {
      eventService.off('error', handleError);
    };
  }, []);

  const clearError = () => {
    setError(null);
  };

  return {
    error,
    clearError,
  };
};
