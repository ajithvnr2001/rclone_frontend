import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { fetchRemotes as apiFetchRemotes, createRemote as apiCreateRemote } from '../services/rcloneApiService';
import { RcloneRemotes, RcloneConfigParams } from '../services/rcloneServiceTypes';

interface RemotesContextType {
  remotes: RcloneRemotes;
  isLoading: boolean; // For fetching remotes
  error: string | null; // For fetching remotes
  refreshRemotes: () => Promise<void>;
  addRemote: (name: string, type: string, parameters: RcloneConfigParams) => Promise<void>;
  isCreatingRemote: boolean;
  createRemoteError: string | null;
}

const RemotesContext = createContext<RemotesContextType | undefined>(undefined);

export const useRemotes = (): RemotesContextType => {
  const context = useContext(RemotesContext);
  if (!context) {
    throw new Error('useRemotes must be used within a RemotesProvider');
  }
  return context;
};

interface RemotesProviderProps {
  children: ReactNode;
}

const RemotesProvider: React.FC<RemotesProviderProps> = ({ children }) => {
  const [remotes, setRemotes] = useState<RcloneRemotes>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreatingRemote, setIsCreatingRemote] = useState<boolean>(false);
  const [createRemoteError, setCreateRemoteError] = useState<string | null>(null);

  const loadRemotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedRemotes = await apiFetchRemotes();
      setRemotes(fetchedRemotes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching remotes.';
      setError(errorMessage);
      setRemotes([]);
      console.error("Error in RemotesProvider loadRemotes:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRemotes();
  }, [loadRemotes]);

  const refreshRemotes = useCallback(async () => {
    await loadRemotes();
  }, [loadRemotes]);

  const addRemote = useCallback(async (name: string, type: string, parameters: RcloneConfigParams) => {
    setIsCreatingRemote(true);
    setCreateRemoteError(null);
    try {
      await apiCreateRemote(name, type, parameters);
      await refreshRemotes(); // Refresh the list after successful creation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `An unknown error occurred while creating remote "${name}".`;
      setCreateRemoteError(errorMessage);
      console.error(`Error in RemotesProvider addRemote for remote "${name}":`, err);
      throw err; // Re-throw to allow form to catch it for more specific UI updates if needed
    } finally {
      setIsCreatingRemote(false);
    }
  }, [refreshRemotes]);

  return (
    <RemotesContext.Provider
      value={{
        remotes,
        isLoading,
        error,
        refreshRemotes,
        addRemote,
        isCreatingRemote,
        createRemoteError
      }}
    >
      {children}
    </RemotesContext.Provider>
  );
};

export default RemotesProvider;
