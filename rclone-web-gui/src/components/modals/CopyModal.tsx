import React, { useState, useEffect } from 'react';

interface CopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (destinationPath: string) => Promise<void>; // Make onSubmit async to handle errors
  selectedItemName: string | null; // Name of the single item being copied
  isLoading: boolean; // To disable form while copy is in progress
  error: string | null; // To display errors from the copy operation
}

const CopyModal: React.FC<CopyModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    selectedItemName,
    isLoading,
    error: copyErrorProp
}) => {
  const [destinationPath, setDestinationPath] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    // Reset path when modal is opened or item changes
    if (isOpen) {
      setDestinationPath('');
      setLocalError(null);
    }
  }, [isOpen, selectedItemName]);

  useEffect(() => {
    // Reflect prop error to local error state
    setLocalError(copyErrorProp);
  }, [copyErrorProp]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!destinationPath.trim()) {
      setLocalError('Destination path cannot be empty.');
      return;
    }
    if (!destinationPath.includes(':')) {
        setLocalError('Destination path must be a full rclone path (e.g., "myRemote:path/to/destination").');
        return;
    }

    try {
        await onSubmit(destinationPath);
        // If onSubmit doesn't throw, assume success for now.
        // More robust success handling might involve waiting for job completion or specific success state from context.
        // onClose(); // Close modal on successful submission start
    } catch (err) {
        // Error should be set by the context and reflected via copyErrorProp
        // but if not, set localError
        if (!copyErrorProp) {
            setLocalError(err instanceof Error ? err.message : "Failed to start copy operation.");
        }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75 transition-opacity">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md space-y-4 transform transition-all">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Copy Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">&times;</button>
        </div>

        {selectedItemName && (
            <p className="text-sm text-gray-300">
                Copying: <span className="font-semibold">{selectedItemName}</span>
            </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="destinationPath" className="block mb-2 text-sm font-medium text-gray-300">
              Destination Path
            </label>
            <input
              type="text"
              id="destinationPath"
              value={destinationPath}
              onChange={(e) => setDestinationPath(e.target.value)}
              className="w-full p-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., myRemoteB:backup/"
              disabled={isLoading}
              required
            />
            <p className="mt-1 text-xs text-gray-400">
              Enter the full rclone path (e.g., remoteName:path/to/folder/).
            </p>
          </div>

          {localError && (
            <div className="p-3 my-2 text-sm text-red-300 bg-red-700 rounded-lg" role="alert">
              <span className="font-medium">Error:</span> {localError}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Starting Copy...' : 'Start Copy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CopyModal;
