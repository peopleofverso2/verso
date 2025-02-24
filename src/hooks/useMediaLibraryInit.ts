import { useState, useEffect, useCallback, useRef } from 'react';
import { MediaLibraryService } from '../services/MediaLibraryService';

export const useMediaLibraryInit = () => {
  const [mediaLibrary, setMediaLibrary] = useState<MediaLibraryService | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const initializeService = useCallback(async () => {
    try {
      const service = MediaLibraryService.getInstance();
      await service.initialize();
      setMediaLibrary(service);
      setIsInitializing(false);
      setError(null);
    } catch (err) {
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        console.warn(`Retry attempt ${retryCountRef.current} of ${maxRetries}`);
        setTimeout(initializeService, 1000);
      } else {
        setError('Failed to initialize MediaLibrary');
        setIsInitializing(false);
      }
    }
  }, []);

  useEffect(() => {
    initializeService();
    return () => {
      // Cleanup
      if (mediaLibrary) {
        mediaLibrary.cleanup();
      }
    };
  }, [initializeService]);

  return { mediaLibrary, isInitializing, error };
};
