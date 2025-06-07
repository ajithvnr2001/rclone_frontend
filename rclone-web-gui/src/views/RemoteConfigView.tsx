import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useRemotes } from '../contexts/RemotesContext';
import { RcloneConfigParams } from '../services/rcloneServiceTypes';

interface RemoteConfigViewProps {
  onConfigured: () => void; // Callback when configuration is successful
  onCancel: () => void; // Callback to cancel and go back
}

type RemoteType = 'local' | 'sftp' | 's3' | ''; // Add more as supported

const RemoteConfigView: React.FC<RemoteConfigViewProps> = ({ onConfigured, onCancel }) => {
  const { addRemote, isCreatingRemote, createRemoteError: contextCreateRemoteError } = useRemotes();

  const [remoteName, setRemoteName] = useState<string>('');
  const [remoteType, setRemoteType] = useState<RemoteType>('');
  const [parameters, setParameters] = useState<RcloneConfigParams>({});

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Clear context error when component mounts or type changes
  useEffect(() => {
    setFormError(null);
  }, [remoteType]);

  // Display context error if it occurs
  useEffect(() => {
    if (contextCreateRemoteError) {
      setFormError(contextCreateRemoteError);
    }
  }, [contextCreateRemoteError]);


  const handleParameterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    // Rclone often uses "true" or "false" as strings for boolean params,
    // but let's store actual booleans if it's a checkbox, service will convert.
    // For select, it will be string. For text/number, string.
    setParameters(prev => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!remoteName.trim()) {
      setFormError("Remote name is required.");
      return;
    }
    if (!remoteType) {
      setFormError("Remote type must be selected.");
      return;
    }

    // Basic validation for required fields based on type
    if (remoteType === 'local' && !parameters.path) {
        setFormError("Path is required for Local remote.");
        return;
    }
    if (remoteType === 'sftp' && (!parameters.host || !parameters.user)) {
        setFormError("Host and User are required for SFTP remote.");
        return;
    }
    if (remoteType === 's3' && (!parameters.access_key_id || !parameters.secret_access_key || !parameters.region)) {
        setFormError("Access Key ID, Secret Access Key, and Region are required for S3 remote.");
        return;
    }


    try {
      await addRemote(remoteName, remoteType, parameters);
      setSuccessMessage(`Remote "${remoteName}" created successfully!`);
      // Optionally reset form or call onConfigured after a delay
      setRemoteName('');
      setRemoteType('');
      setParameters({});
      setTimeout(() => {
        onConfigured();
      }, 1500); // Navigate back after 1.5 seconds
    } catch (err) {
      // Error is already set by the context, but if not, set it here
      if (!contextCreateRemoteError) {
        setFormError(err instanceof Error ? err.message : "An unknown error occurred.");
      }
       // error state is already handled by the context hook and useEffect above
    }
  };

  const renderParameters = () => {
    switch (remoteType) {
      case 'local':
        return (
          <div>
            <label htmlFor="path" className="block mb-2 text-sm font-medium">Path *</label>
            <input type="text" name="path" id="path" value={String(parameters.path || '')} onChange={handleParameterChange} className="bg-gray-700 border border-gray-600 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
          </div>
        );
      case 'sftp':
        return (
          <>
            <div>
              <label htmlFor="host" className="block mb-2 text-sm font-medium">Host *</label>
              <input type="text" name="host" id="host" value={String(parameters.host || '')} onChange={handleParameterChange} className="bg-gray-700 border border-gray-600 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
            </div>
            <div>
              <label htmlFor="user" className="block mb-2 text-sm font-medium">User *</label>
              <input type="text" name="user" id="user" value={String(parameters.user || '')} onChange={handleParameterChange} className="bg-gray-700 border border-gray-600 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
            </div>
            <div>
              <label htmlFor="port" className="block mb-2 text-sm font-medium">Port (optional)</label>
              <input type="number" name="port" id="port" value={String(parameters.port || '')} onChange={handleParameterChange} className="bg-gray-700 border border-gray-600 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" />
            </div>
            <div>
              <label htmlFor="pass" className="block mb-2 text-sm font-medium">Password (optional, leave blank for agent or key file)</label>
              <input type="password" name="pass" id="pass" value={String(parameters.pass || '')} onChange={handleParameterChange} className="bg-gray-700 border border-gray-600 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" />
              <p className="text-xs text-gray-400 mt-1">Rclone will obscure this.</p>
            </div>
            <div>
              <label htmlFor="key_file" className="block mb-2 text-sm font-medium">Key File Path (optional)</label>
              <input type="text" name="key_file" id="key_file" value={String(parameters.key_file || '')} onChange={handleParameterChange} className="bg-gray-700 border border-gray-600 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" />
            </div>
          </>
        );
      case 's3':
        return (
          <>
            <div>
              <label htmlFor="access_key_id" className="block mb-2 text-sm font-medium">Access Key ID *</label>
              <input type="text" name="access_key_id" id="access_key_id" value={String(parameters.access_key_id || '')} onChange={handleParameterChange} className="bg-gray-700 border border-gray-600 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
            </div>
            <div>
              <label htmlFor="secret_access_key" className="block mb-2 text-sm font-medium">Secret Access Key *</label>
              <input type="password" name="secret_access_key" id="secret_access_key" value={String(parameters.secret_access_key || '')} onChange={handleParameterChange} className="bg-gray-700 border border-gray-600 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required/>
               <p className="text-xs text-gray-400 mt-1">Rclone will obscure this.</p>
            </div>
            <div>
              <label htmlFor="region" className="block mb-2 text-sm font-medium">Region *</label>
              <input type="text" name="region" id="region" value={String(parameters.region || '')} onChange={handleParameterChange} className="bg-gray-700 border border-gray-600 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
            </div>
            <div>
              <label htmlFor="acl" className="block mb-2 text-sm font-medium">ACL (e.g., private, public-read) *</label>
              <select name="acl" id="acl" value={String(parameters.acl || 'private')} onChange={handleParameterChange} className="bg-gray-700 border border-gray-600 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
                <option value="private">private</option>
                <option value="public-read">public-read</option>
                <option value="public-read-write">public-read-write</option>
                {/* Add other relevant ACLs */}
              </select>
            </div>
             <div>
              <label htmlFor="storage_class" className="block mb-2 text-sm font-medium">Storage Class (optional)</label>
              <input type="text" name="storage_class" id="storage_class" value={String(parameters.storage_class || '')} onChange={handleParameterChange} className="bg-gray-700 border border-gray-600 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-4 md:space-y-6 sm:p-8 text-white">
      <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl">
        Configure New Remote
      </h1>
      <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="remoteName" className="block mb-2 text-sm font-medium">Remote Name *</label>
          <input type="text" name="remoteName" id="remoteName" value={remoteName} onChange={(e) => setRemoteName(e.target.value)} className="bg-gray-700 border border-gray-600 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="myNewRemote" required />
        </div>
        <div>
          <label htmlFor="remoteType" className="block mb-2 text-sm font-medium">Remote Type *</label>
          <select name="remoteType" id="remoteType" value={remoteType} onChange={(e) => { setRemoteType(e.target.value as RemoteType); setParameters({}); setFormError(null); }} className="bg-gray-700 border border-gray-600 text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
            <option value="">-- Select Type --</option>
            <option value="local">Local</option>
            <option value="sftp">SFTP</option>
            <option value="s3">S3</option>
            {/* Add other types as needed */}
          </select>
        </div>

        {remoteType && <div className="space-y-4 md:space-y-6 border-t border-gray-700 pt-4 mt-4">{renderParameters()}</div>}

        {formError && (
          <div className="p-3 my-2 text-sm text-red-300 bg-red-800 rounded-lg" role="alert">
            <span className="font-medium">Error:</span> {formError}
          </div>
        )}
        {successMessage && (
          <div className="p-3 my-2 text-sm text-green-300 bg-green-700 rounded-lg" role="alert">
            {successMessage}
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
            <button type="button" onClick={onCancel} className="text-white bg-gray-600 hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-gray-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                Cancel
            </button>
            <button type="submit" disabled={isCreatingRemote || !remoteType} className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50">
              {isCreatingRemote ? 'Creating...' : 'Save Remote'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default RemoteConfigView;
