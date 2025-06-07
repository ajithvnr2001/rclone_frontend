import React, { useState } from 'react';
import RemotesProvider from './contexts/RemotesContext';
import FileExplorerProvider, { useFileExplorer } from './contexts/FileExplorerContext';
import Sidebar from './components/layout/Sidebar';
import RemoteConfigView from './views/RemoteConfigView';
import FileExplorerView from './views/FileExplorerView';
import { ActiveRcloneJob } from './services/rcloneServiceTypes'; // Import type

type ViewMode = 'explorer' | 'addRemote';

// Active Jobs Display Component (simple version)
const ActiveJobsDisplay: React.FC = () => {
  const { activeJobs } = useFileExplorer(); // Assuming activeJobs is in FileExplorerContext

  if (!activeJobs || activeJobs.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 p-3 shadow-md border-t border-gray-700 max-h-40 overflow-y-auto">
      <h3 className="text-md font-semibold text-gray-300 mb-2">Active Transfers</h3>
      <ul className="space-y-1">
        {activeJobs.map((job) => (
          <li key={job.jobId} className="text-xs text-gray-400 p-1.5 bg-gray-800 rounded">
            Job ID: {job.jobId} - Copying from <span className="font-medium text-gray-300">{job.srcFs}</span> to <span className="font-medium text-gray-300">{job.dstFs}</span> - Status: {job.status || 'Initiated'}
            {job.error && <p className="text-red-400">Error: {job.error}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
};


// Content component to access FileExplorerContext easily after it's provided
const MainContent: React.FC<{
  currentView: ViewMode;
  selectedRemoteForExplorer: string | null;
  onRemoteConfigured: () => void;
  onCancelRemoteConfig: () => void;
}> = ({ currentView, selectedRemoteForExplorer, onRemoteConfigured, onCancelRemoteConfig }) => {

  if (currentView === 'addRemote') {
    return <RemoteConfigView onConfigured={onRemoteConfigured} onCancel={onCancelRemoteConfig} />;
  }

  if (currentView === 'explorer') {
    if (selectedRemoteForExplorer) {
      return <FileExplorerView />;
    }
    return (
      <div className="p-4 text-center text-gray-400"> {/* Adjusted text color */}
        <h1 className="text-2xl font-bold mb-4 text-gray-100">Welcome to Rclone Web UI</h1>
        <p>Select a remote from the sidebar to browse its content, or add a new remote.</p>
      </div>
    );
  }
  return null;
};


// AppWrapper to ensure useFileExplorer is called within provider context
const AppWrapper: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('explorer');
  const [selectedRemoteForExplorer, setSelectedRemoteForExplorer] = useState<string | null>(null);

  const { selectRemote: selectRemoteForExplorer } = useFileExplorer();

  const handleAddNewRemote = () => {
    setCurrentView('addRemote');
    setSelectedRemoteForExplorer(null);
  };

  const handleRemoteConfigured = () => {
    setCurrentView('explorer');
  };

  const handleCancelRemoteConfig = () => {
    setCurrentView('explorer');
  };

  const handleRemoteSelectFromSidebar = (remoteName: string) => {
    selectRemoteForExplorer(remoteName);
    setSelectedRemoteForExplorer(remoteName);
    setCurrentView('explorer');
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar
        onAddNewRemote={handleAddNewRemote}
        onRemoteSelect={handleRemoteSelectFromSidebar}
      />
      <main className="flex-1 bg-gray-850 text-gray-100 flex flex-col relative pb-40"> {/* Added pb-40 for ActiveJobsDisplay */}
        <div className="flex-grow overflow-y-auto p-1 md:p-4"> {/* Added padding here */}
            <MainContent
            currentView={currentView}
            selectedRemoteForExplorer={selectedRemoteForExplorer}
            onRemoteConfigured={handleRemoteConfigured}
            onCancelRemoteConfig={handleCancelRemoteConfig}
            />
        </div>
        <ActiveJobsDisplay /> {/* Display active jobs here */}
      </main>
    </div>
  );
}


// Root App component
function App() {
  return (
    <RemotesProvider>
      <FileExplorerProvider>
        <AppWrapper />
      </FileExplorerProvider>
    </RemotesProvider>
  );
}

export default App;
