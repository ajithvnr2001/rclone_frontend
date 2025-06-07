import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { listFiles as apiListFiles, startRcloneCopy as apiStartRcloneCopy } from '../services/rcloneApiService';
import { RcloneFileItem, ActiveRcloneJob } from '../services/rcloneServiceTypes';

interface FileExplorerContextType {
  currentRemote: string | null;
  currentPath: string;
  items: RcloneFileItem[];
  isLoading: boolean; // For listing files
  error: string | null; // For listing files
  navigateToPath: (newPath: string) => Promise<void>;
  selectRemote: (remoteName: string) => Promise<void>;
  refreshCurrentList: () => Promise<void>;
  goBack: () => Promise<void>;
  getRootPath: () => string;

  // Selection state
  selectedItems: RcloneFileItem[];
  toggleSelectItem: (item: RcloneFileItem) => void;
  clearSelectedItems: () => void;
  isItemSelected: (item: RcloneFileItem) => boolean;

  // Copy operation state and functions
  activeJobs: ActiveRcloneJob[];
  initiateCopyOperation: (dstFs: string) => Promise<void>; // dstFs is the full destination string e.g. "myRemoteB:backup/"
  isCopying: boolean; // Loading state specifically for the copy initiation
  copyError: string | null; // Error state specifically for the copy initiation
}

const FileExplorerContext = createContext<FileExplorerContextType | undefined>(undefined);

export const useFileExplorer = (): FileExplorerContextType => {
  const context = useContext(FileExplorerContext);
  if (!context) {
    throw new Error('useFileExplorer must be used within a FileExplorerProvider');
  }
  return context;
};

interface FileExplorerProviderProps {
  children: ReactNode;
}

const FileExplorerProvider: React.FC<FileExplorerProviderProps> = ({ children }) => {
  const [currentRemote, setCurrentRemote] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [items, setItems] = useState<RcloneFileItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedItems, setSelectedItems] = useState<RcloneFileItem[]>([]);
  const [activeJobs, setActiveJobs] = useState<ActiveRcloneJob[]>([]);
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const [copyError, setCopyError] = useState<string | null>(null);


  const getRootPath = useCallback(() => {
    if (!currentRemote) return '';
    return `${currentRemote}:`;
  }, [currentRemote]);

  const fetchItems = useCallback(async (remote: string | null, path: string) => {
    if (!remote) {
      setItems([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const remoteNameWithColon = `${remote}:`;
      const fetchedItems = await apiListFiles(remoteNameWithColon, path);
      setItems(fetchedItems);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching files.';
      setError(errorMessage);
      setItems([]);
      console.error(`Error fetching items for ${remote}:${path}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectRemote = useCallback(async (remoteName: string) => {
    setCurrentRemote(remoteName);
    setCurrentPath('');
    clearSelectedItems();
    await fetchItems(remoteName, '');
  }, [fetchItems]);

  const navigateToPath = useCallback(async (newPath: string) => {
    if (!currentRemote) return;
    const normalizedPath = newPath.startsWith('/') ? newPath.substring(1) : newPath;
    setCurrentPath(normalizedPath);
    clearSelectedItems();
    await fetchItems(currentRemote, normalizedPath);
  }, [currentRemote, fetchItems]);

  const goBack = useCallback(async () => {
    if (!currentPath || !currentRemote) return;
    const pathSegments = currentPath.split('/').filter(segment => segment.length > 0);
    pathSegments.pop();
    const newPath = pathSegments.join('/');
    clearSelectedItems();
    await navigateToPath(newPath);
  }, [currentPath, currentRemote, navigateToPath]);

  const refreshCurrentList = useCallback(async () => {
    if (!currentRemote) return;
    clearSelectedItems();
    await fetchItems(currentRemote, currentPath);
  }, [currentRemote, currentPath, fetchItems]);

  // --- Selection Logic ---
  const toggleSelectItem = useCallback((item: RcloneFileItem) => {
    setSelectedItems(prevSelected =>
      prevSelected.find(selected => (selected.ID || selected.Path) === (item.ID || item.Path))
        ? prevSelected.filter(selected => (selected.ID || selected.Path) !== (item.ID || item.Path))
        : [...prevSelected, item]
    );
  }, []);

  const clearSelectedItems = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const isItemSelected = useCallback((item: RcloneFileItem) => {
    return selectedItems.some(selected => (selected.ID || selected.Path) === (item.ID || item.Path));
  }, [selectedItems]);

  // --- Copy Operation Logic ---
  const initiateCopyOperation = useCallback(async (dstFsCombined: string) => {
    if (!currentRemote || selectedItems.length === 0) {
      setCopyError("No items selected or current remote is not set.");
      return;
    }
    // For MVP, copy one selected item at a time.
    // If multiple selected, this logic needs to be more robust (e.g. show multiple job IDs or make one job if API supports)
    if (selectedItems.length > 1) {
        setCopyError("MVP: Please select only one item to copy.");
        // Or loop and create multiple jobs:
        // for (const item of selectedItems) { ... }
        return;
    }
    const itemToCopy = selectedItems[0];
    const srcFsCombined = `${currentRemote}:${itemToCopy.Path}`; // e.g., "myDrive:folder/file.txt"

    setIsCopying(true);
    setCopyError(null);
    try {
      const jobResponse = await apiStartRcloneCopy(srcFsCombined, dstFsCombined);
      const newJob: ActiveRcloneJob = {
        jobId: jobResponse.jobid,
        srcFs: srcFsCombined,
        dstFs: dstFsCombined,
        status: 'Initiated',
        timestamp: Date.now(),
      };
      setActiveJobs(prevJobs => [...prevJobs, newJob]);
      clearSelectedItems(); // Clear selection after initiating copy
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while starting the copy job.';
      setCopyError(errorMessage);
      console.error(`Error initiating copy from ${srcFsCombined} to ${dstFsCombined}:`, err);
      // Re-throw to allow modal to potentially handle it or stay open
      throw err;
    } finally {
      setIsCopying(false);
    }
  }, [currentRemote, selectedItems, clearSelectedItems]);


  return (
    <FileExplorerContext.Provider
      value={{
        currentRemote,
        currentPath,
        items,
        isLoading,
        error,
        navigateToPath,
        selectRemote,
        refreshCurrentList,
        goBack,
        getRootPath,
        selectedItems,
        toggleSelectItem,
        clearSelectedItems,
        isItemSelected,
        activeJobs,
        initiateCopyOperation,
        isCopying,
        copyError,
      }}
    >
      {children}
    </FileExplorerContext.Provider>
  );
};

export default FileExplorerProvider;
