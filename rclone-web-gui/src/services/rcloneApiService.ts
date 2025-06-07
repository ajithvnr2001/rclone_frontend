import axios, { AxiosError } from 'axios';
import {
  RcloneListRemotesResponse,
  RcloneConfigCreatePayload,
  RcloneConfigParams,
  RcloneFileItem,
  RcloneListFilesPayload,
  RcloneListFilesResponse,
  RcloneCopyPayload,
  RcloneAsyncJobResponse
} from './rcloneServiceTypes';

const RCLONE_RC_URL = 'http://localhost:5572';

const apiClient = axios.create({
  baseURL: RCLONE_RC_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetches the list of configured rclone remotes.
 */
export async function fetchRemotes(): Promise<string[]> {
  try {
    const response = await apiClient.post<RcloneListRemotesResponse>('config/listremotes', {});
    if (response.data && Array.isArray(response.data.remotes)) {
      return response.data.remotes;
    } else {
      console.error('Invalid response structure from config/listremotes:', response.data);
      throw new Error('Failed to fetch remotes: Invalid response structure.');
    }
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      console.error('Error fetching remotes - Server responded:', axiosError.response.data);
      console.error('Status:', axiosError.response.status);
    } else if (axiosError.request) {
      console.error('Error fetching remotes - No response received:', axiosError.request);
    } else {
      console.error('Error fetching remotes - Request setup error:', axiosError.message);
    }
    console.error('Generic error object for fetchRemotes:', error);
    throw new Error(`Failed to fetch remotes. ${axiosError.message || 'An unknown error occurred.'}`);
  }
}

/**
 * Creates a new rclone remote configuration.
 */
export async function createRemote(
  name: string,
  type: string,
  parameters: RcloneConfigParams
): Promise<void> {
  const stringParameters: Record<string, string> = {};
  for (const key in parameters) {
    if (Object.prototype.hasOwnProperty.call(parameters, key)) {
      stringParameters[key] = String(parameters[key]);
    }
  }

  const payload: RcloneConfigCreatePayload = {
    name,
    type,
    parameters: stringParameters,
  };

  try {
    await apiClient.post('config/create', payload);
    console.log(`Remote "${name}" of type "${type}" created successfully.`);
  } catch (error) {
    const axiosError = error as AxiosError;
    let errorMessage = `Failed to create remote "${name}".`;
    if (axiosError.response) {
      console.error(`Error creating remote "${name}" - Server responded:`, axiosError.response.data);
      const rcloneError = (axiosError.response.data as any)?.error;
      if (rcloneError) errorMessage += ` Rclone error: ${rcloneError}`;
    } else if (axiosError.request) {
      console.error(`Error creating remote "${name}" - No response received:`, axiosError.request);
      errorMessage += ' No response from server.';
    } else {
      console.error(`Error creating remote "${name}" - Request setup error:`, axiosError.message);
      errorMessage += ` Request setup error: ${axiosError.message}`;
    }
    console.error('Generic error object for createRemote:', error);
    throw new Error(errorMessage);
  }
}

/**
 * Lists files and directories for a given rclone remote and path.
 */
export async function listFiles(fs: string, remotePath: string): Promise<RcloneFileItem[]> {
  const payload: RcloneListFilesPayload = {
    fs: fs,
    remote: remotePath,
  };

  try {
    const response = await apiClient.post<RcloneListFilesResponse>('operations/list', payload);
    if (response.data && Array.isArray(response.data.list)) {
      return response.data.list;
    } else {
      if (response.data && response.data.list === null) {
        return [];
      }
      console.error('Invalid response structure from operations/list:', response.data);
      throw new Error('Failed to list files: Invalid response structure.');
    }
  } catch (error) {
    const axiosError = error as AxiosError;
    let errorMessage = `Failed to list files for "${fs}${remotePath}".`;
    if (axiosError.response) {
      console.error('Error listing files - Server responded:', axiosError.response.data);
      const rcloneError = (axiosError.response.data as any)?.error;
      if (rcloneError) errorMessage += ` Rclone error: ${rcloneError}`;
    } else if (axiosError.request) {
      console.error('Error listing files - No response received:', axiosError.request);
      errorMessage += ' No response from server.';
    } else {
      console.error('Error listing files - Request setup error:', axiosError.message);
      errorMessage += ` Request setup error: ${axiosError.message}`;
    }
    console.error('Generic error object for listFiles:', error);
    throw new Error(errorMessage);
  }
}

/**
 * Starts an asynchronous rclone copy operation.
 * @param srcFs The source remote and path (e.g., "myRemote:path/to/source_file_or_dir").
 * @param dstFs The destination remote and path (e.g., "otherRemote:path/to/dest_dir").
 * @returns A promise that resolves to an RcloneAsyncJobResponse containing the job ID.
 */
export async function startRcloneCopy(srcFs: string, dstFs: string): Promise<RcloneAsyncJobResponse> {
  const payload: RcloneCopyPayload = {
    srcFs,
    dstFs,
    _async: true,
  };

  try {
    const response = await apiClient.post<RcloneAsyncJobResponse>('sync/copy', payload);
    if (response.data && typeof response.data.jobid === 'number') {
      return response.data;
    } else {
      console.error('Invalid response structure from sync/copy:', response.data);
      throw new Error('Failed to start copy job: Invalid job ID received.');
    }
  } catch (error) {
    const axiosError = error as AxiosError;
    let errorMessage = `Failed to start copy job from "${srcFs}" to "${dstFs}".`;
     if (axiosError.response) {
      console.error('Error starting copy job - Server responded:', axiosError.response.data);
      const rcloneError = (axiosError.response.data as any)?.error;
      if (rcloneError) errorMessage += ` Rclone error: ${rcloneError}`;
    } else if (axiosError.request) {
      console.error('Error starting copy job - No response received:', axiosError.request);
      errorMessage += ' No response from server.';
    } else {
      console.error('Error starting copy job - Request setup error:', axiosError.message);
      errorMessage += ` Request setup error: ${axiosError.message}`;
    }
    console.error('Generic error object for startRcloneCopy:', error);
    throw new Error(errorMessage);
  }
}
