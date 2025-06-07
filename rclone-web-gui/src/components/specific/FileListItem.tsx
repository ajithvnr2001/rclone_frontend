import React from 'react';
import { RcloneFileItem } from '../../services/rcloneServiceTypes';
import { useFileExplorer } from '../../contexts/FileExplorerContext'; // To manage selection

interface FileListItemProps {
  item: RcloneFileItem;
  onNavigate: (path: string, isDir: boolean) => void;
}

const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === -1) return '-';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString();
  } catch (e) {
    return dateString;
  }
};

const FileListItem: React.FC<FileListItemProps> = ({ item, onNavigate }) => {
  const { toggleSelectItem, isItemSelected } = useFileExplorer();
  const selected = isItemSelected(item);

  const handleItemClick = (e: React.MouseEvent) => {
    // Allow clicking on row to toggle selection, but not if clicking on the name/button itself for navigation
    if ((e.target as HTMLElement).closest('button')) {
        return;
    }
    // If not a directory, or if a directory and not the name part, toggle selection
     if (!item.IsDir || !(e.target as HTMLElement).classList.contains('item-name-button')) {
        toggleSelectItem(item);
     }
  };

  const handleNameButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent row click event if name is clicked
    if (item.IsDir) {
      onNavigate(item.Path, true);
    } else {
      // Potentially select the item if it's a file and not just navigate
      // toggleSelectItem(item); // Or handle file preview
      console.log("File name clicked:", item.Path);
       // For now, let's make clicking the name of a file also toggle its selection
       toggleSelectItem(item);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent row click event
    toggleSelectItem(item);
  };

  const icon = item.IsDir ? '📁' : '📄';

  return (
    <tr
      className={`border-b border-gray-700 transition-colors duration-150 ease-in-out ${selected ? 'bg-blue-900 hover:bg-blue-800' : 'hover:bg-gray-700'}`}
      onClick={handleItemClick} // Click row to select
      onDoubleClick={item.IsDir ? () => onNavigate(item.Path, true) : undefined} // Double click directory to navigate
      style={{ cursor: 'pointer' }}
    >
      <td className="px-2 py-2 whitespace-nowrap w-10">
        <input
          type="checkbox"
          className="form-checkbox h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          checked={selected}
          onChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()} // Prevent row click when checkbox is clicked
        />
      </td>
      <td className="px-2 py-2 whitespace-nowrap">
        <button
          onClick={handleNameButtonClick}
          className="flex items-center text-left hover:text-blue-300 focus:outline-none item-name-button"
          title={item.IsDir ? `Open directory: ${item.Name}`: `File: ${item.Name}`}
        >
          <span className="mr-2 text-lg">{icon}</span>
          {item.Name}
        </button>
      </td>
      <td className="px-3 py-2 text-sm text-gray-400 whitespace-nowrap">
        {formatBytes(item.Size)}
      </td>
      <td className="px-3 py-2 text-sm text-gray-400 whitespace-nowrap">
        {item.MimeType || (item.IsDir ? 'Directory' : 'Unknown')}
      </td>
      <td className="px-3 py-2 text-sm text-gray-400 whitespace-nowrap">
        {formatDate(item.ModTime)}
      </td>
    </tr>
  );
};

export default FileListItem;
