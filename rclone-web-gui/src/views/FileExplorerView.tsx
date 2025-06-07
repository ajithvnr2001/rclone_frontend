import React, { useState } from 'react';
import { useFileExplorer } from '../contexts/FileExplorerContext';
import Breadcrumbs from '../components/common/Breadcrumbs';
import FileListItem from '../components/specific/FileListItem';
import CopyModal from '../components/modals/CopyModal'; // Import the modal

const FileExplorerView: React.FC = () => {
  const {
    currentRemote,
    currentPath,
    items,
    isLoading,
    error,
    navigateToPath,
    refreshCurrentList,
    goBack,
    selectedItems,
    initiateCopyOperation,
    isCopying, // Loading state from context for copy initiation
    copyError,   // Error state from context for copy initiation
    clearSelectedItems,
  } = useFileExplorer();

  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

  const handleBreadcrumbNavigate = (newPath: string) => {
    navigateToPath(newPath);
  };

  const handleBreadcrumbNavigateRoot = () => {
    navigateToPath('');
  }

  const handleFileNavigate = (path: string, isDir: boolean) => {
    if (isDir) {
      navigateToPath(path);
    } else {
      console.log('File selected for potential action (not navigation):', path);
    }
  };

  const handleOpenCopyModal = () => {
    if (selectedItems.length === 1) { // MVP: Only one item
        setIsCopyModalOpen(true);
    } else if (selectedItems.length > 1) {
        alert("Please select only one item to copy (MVP limitation).");
    } else {
        alert("Please select an item to copy.");
    }
  };

  const handleCloseCopyModal = () => {
    setIsCopyModalOpen(false);
    // Do not clear context's copyError here, it might be useful for the user to see
  };

  const handleStartCopy = async (destinationPath: string) => {
    if (selectedItems.length !== 1 || !currentRemote) return; // Should be ensured by button logic too

    // The initiateCopyOperation in context now handles constructing srcFs
    // It expects the full destination path string (e.g. "myRemoteB:backup/")
    try {
      await initiateCopyOperation(destinationPath);
      handleCloseCopyModal(); // Close modal on successful initiation
      // No need to clearSelectedItems here, initiateCopyOperation does it
    } catch (err) {
      // Error is handled and set in context (copyError)
      // The modal will display this error via its `error` prop (copyErrorProp)
      console.error("Failed to start copy from modal:", err)
    }
  };


  if (!currentRemote) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Please select a remote from the sidebar to start browsing.</p>
      </div>
    );
  }

  return (
    <div className="p-1 h-full flex flex-col text-gray-200"> {/* Ensure text color is suitable */}
      <div className="mb-3 flex flex-col md:flex-row md:items-center md:justify-between">
        <Breadcrumbs
            remoteName={currentRemote}
            path={currentPath}
            onNavigate={handleBreadcrumbNavigate}
            onNavigateRoot={handleBreadcrumbNavigateRoot}
        />
        <div className="flex items-center space-x-2 mt-2 md:mt-0">
            {currentPath && (
                 <button
                    onClick={goBack}
                    disabled={isLoading || isCopying}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                    &larr; Back
                </button>
            )}
            <button
                onClick={refreshCurrentList}
                disabled={isLoading || isCopying}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
                {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
                onClick={handleOpenCopyModal}
                disabled={selectedItems.length !== 1 || isLoading || isCopying} // MVP: Only one item
                className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
                Copy Selected
            </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-400 text-lg">Loading files...</p>
        </div>
      )}

      {error && !isLoading && ( // Show general listing error if not loading
        <div className="p-4 my-4 text-sm text-red-300 bg-red-800 rounded-lg text-center" role="alert">
          <span className="font-medium">Error listing files:</span> {error}
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-400 text-lg">This folder is empty.</p>
        </div>
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="overflow-auto flex-grow">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-750 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-10">
                   {/* Checkbox header can go here if "select all" is needed */}
                </th>
                <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Size
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Modified
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {items.map((item) => (
                <FileListItem key={item.ID || item.Path} item={item} onNavigate={handleFileNavigate} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCopyModalOpen && selectedItems.length === 1 && (
        <CopyModal
          isOpen={isCopyModalOpen}
          onClose={handleCloseCopyModal}
          onSubmit={handleStartCopy}
          selectedItemName={selectedItems[0]?.Name || ''}
          isLoading={isCopying} // Pass loading state from context
          error={copyError}     // Pass error state from context
        />
      )}
    </div>
  );
};

export default FileExplorerView;
