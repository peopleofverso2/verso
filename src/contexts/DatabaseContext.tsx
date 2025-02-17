import React, { createContext, useContext, useEffect, useState } from 'react';
import { LocalStorageAdapter } from '../services/storage/LocalStorageAdapter';
import { mediaLibraryService } from '../services/mediaLibraryService';

interface DatabaseContextType {
  isInitialized: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initializeDatabase = async () => {
    try {
      const adapter = await LocalStorageAdapter.getInstance();
      await mediaLibraryService.getInstance(adapter);
      setIsInitialized(true);
      setIsError(false);
      setError(null);
    } catch (err) {
      setIsError(true);
      setError(err as Error);
      console.error('Failed to initialize database:', err);
    }
  };

  const reset = async () => {
    try {
      setIsInitialized(false);
      const adapter = await LocalStorageAdapter.getInstance();
      await adapter.resetDatabase();
      await initializeDatabase();
    } catch (err) {
      setIsError(true);
      setError(err as Error);
      console.error('Failed to reset database:', err);
    }
  };

  useEffect(() => {
    initializeDatabase();
  }, []);

  return (
    <DatabaseContext.Provider value={{ isInitialized, isError, error, reset }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
