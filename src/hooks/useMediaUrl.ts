import { useState, useEffect, useRef } from 'react';
import { MediaLibraryService } from '../services/MediaLibraryService';

export const useMediaUrl = (mediaId: string | undefined, mediaLibrary: MediaLibraryService | null) => {
  const [url, setUrl] = useState<string | undefined>();
  const urlRef = useRef<string | undefined>();

  useEffect(() => {
    const loadMedia = async () => {
      if (!mediaId || !mediaLibrary) {
        setUrl(undefined);
        return;
      }

      try {
        const mediaFile = await mediaLibrary.getMedia(mediaId);
        if (mediaFile?.url) {
          setUrl(mediaFile.url);
          urlRef.current = mediaFile.url;
        }
      } catch (error) {
        console.error(`Error loading media ${mediaId}:`, error);
        setUrl(undefined);
      }
    };

    loadMedia();

    return () => {
      // Cleanup URL
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = undefined;
      }
    };
  }, [mediaId, mediaLibrary]);

  return url;
};
