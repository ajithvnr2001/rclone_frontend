import React from 'react';

interface BreadcrumbsProps {
  remoteName: string | null; // The name of the current remote
  path: string; // Current path, e.g., "folderA/subfolderB"
  onNavigate: (pathToNavigate: string) => void; // Callback when a breadcrumb segment is clicked
  onNavigateRoot: () => void; // Callback to navigate to the root of the current remote
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ remoteName, path, onNavigate, onNavigateRoot }) => {
  if (!remoteName) {
    return null; // Don't render if no remote is selected
  }

  const segments = path.split('/').filter(segment => segment.length > 0);

  const handleNavigation = (index: number) => {
    const newPath = segments.slice(0, index + 1).join('/');
    onNavigate(newPath);
  };

  return (
    <nav className="flex mb-4 text-gray-300" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
        <li className="inline-flex items-center">
          <button
            onClick={onNavigateRoot}
            className="inline-flex items-center text-sm font-medium hover:text-blue-400"
          >
            <svg className="w-3 h-3 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
            </svg>
            {remoteName}:
          </button>
        </li>
        {segments.map((segment, index) => (
          <li key={index}>
            <div className="flex items-center">
              <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
              </svg>
              {index === segments.length - 1 ? (
                <span className="ms-1 text-sm font-medium text-gray-500 md:ms-2">
                  {segment}
                </span>
              ) : (
                <button
                  onClick={() => handleNavigation(index)}
                  className="ms-1 text-sm font-medium hover:text-blue-400 md:ms-2"
                >
                  {segment}
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
