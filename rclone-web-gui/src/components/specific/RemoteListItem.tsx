import React from 'react';

interface RemoteListItemProps {
  remoteName: string;
  onClick?: (remoteName: string) => void; // Optional: for future use
}

const RemoteListItem: React.FC<RemoteListItemProps> = ({ remoteName, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(remoteName);
    }
  };

  return (
    <li
      className={`p-2 hover:bg-gray-700 rounded cursor-pointer ${onClick ? '' : 'cursor-default'}`}
      onClick={handleClick}
      title={remoteName}
    >
      {/* Basic icon placeholder - can be replaced with an actual icon later */}
      <span className="mr-2">📁</span>
      <span>{remoteName}</span>
    </li>
  );
};

export default RemoteListItem;
