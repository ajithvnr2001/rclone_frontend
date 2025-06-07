import React from 'react';
import { useRemotes } from '../../contexts/RemotesContext';
import RemoteListItem from '../specific/RemoteListItem';

interface SidebarProps {
  onAddNewRemote: () => void;
  onRemoteSelect: (remoteName: string) => void; // For future use to show remote content
}

const Sidebar: React.FC<SidebarProps> = ({ onAddNewRemote, onRemoteSelect }) => {
  const { remotes, isLoading, error, refreshRemotes } = useRemotes();

  const handleRemoteClick = (remoteName: string) => {
    console.log(`Remote selected in Sidebar: ${remoteName}`);
    onRemoteSelect(remoteName);
  };

  return (
    <aside className="w-72 h-full bg-gray-800 text-white p-4 overflow-y-auto flex flex-col">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-3">Rclone Remotes</h2>
        <div className="space-y-2">
          <button
            onClick={onAddNewRemote}
            className="w-full px-3 py-2 text-sm font-medium text-center text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-800"
          >
            + Add New Remote
          </button>
          <button
            onClick={refreshRemotes}
            className="w-full px-3 py-2 text-sm font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh Remotes'}
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto">
        {isLoading && <p className="text-gray-400">Loading remotes...</p>}

        {error && (
          <div className="p-2 my-2 text-sm text-red-300 bg-red-800 rounded-lg" role="alert">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        {!isLoading && !error && remotes.length === 0 && (
          <p className="text-gray-400">No remotes found. Click "Add New Remote" to get started.</p>
        )}

        {!isLoading && !error && remotes.length > 0 && (
          <ul>
            {remotes.map((remoteName) => (
              <RemoteListItem
                key={remoteName}
                remoteName={remoteName}
                onClick={handleRemoteClick}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
