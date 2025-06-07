/**
 * Represents the expected response structure from the rclone RC API
 * endpoint `config/listremotes`.
 */
export interface RcloneListRemotesResponse {
  remotes: string[];
}

/**
 * Type for storing the list of remote names.
 * This is directly derived from the response.
 */
export type RcloneRemotes = string[];

/**
 * Generic type for parameters used in rclone config creation.
 * Values are typically strings, numbers, or booleans, but rclone RC expects them
 * as strings within the JSON payload for `parameters`.
 */
export type RcloneConfigParams = Record<string, string | number | boolean>;


/**
 * Payload for the `config/create` rclone RC API endpoint.
 * The `parameters` field specifically expects string values for rclone.
 * The API service will handle converting RcloneConfigParams to this.
 */
export interface RcloneConfigCreatePayload {
  name: string;
  type: string;
  parameters: Record<string, string>; // Rclone expects parameter values as strings in the JSON
  // opt?: Record<string, any>; // Optional: for obscure, noObscure, nonInteractive etc.
}

// --- Types for File/Directory Browser ---

/**
 * Represents a single file or directory item returned by rclone's `operations/list`.
 * Based on the output of `rclone lsjson`.
 */
export interface RcloneFileItem {
  Path: string;      // Path of the object relative to the remote root
  Name: string;      // Name of the object
  Size: number;      // Size in bytes (-1 for directories or unknown)
  MimeType: string;  // MimeType of the object (empty for directories)
  ModTime: string;   // Modification time in RFC3339 format
  IsDir: boolean;    // True if object is a directory
  ID?: string;       // ID of the object (optional, not all remotes support it)
  Hashes?: Record<string, string>; // Optional: Hashes of the object if requested
  OrigPath?: string; // Full original path if different from Path, useful for nested listings
}

/**
 * Represents the expected response structure from the rclone RC API
 * endpoint `operations/list`.
 */
export interface RcloneListFilesResponse {
  list: RcloneFileItem[];
}

/**
 * Represents the payload for the rclone RC API endpoint `operations/list`.
 * `fs` should be the remote name with a colon, e.g., "myRemote:".
 * `remote` is the path within that remote.
 */
export interface RcloneListFilesPayload {
  fs: string;      // Remote name with colon, e.g., "myRemote:" OR "myRemote:sub/path" for the base
  remote: string;  // Path relative to the fs parameter. Often empty if fs contains full path.
  opt?: {
    recurse?: boolean;
    maxDepth?: number;
    filesOnly?: boolean;
    dirsOnly?: boolean;
    showHash?: boolean;
    hashTypes?: string[];
    showEncrypted?: boolean;
    noModTime?: boolean;
    noMimeType?: boolean;
    showOrigIDs?: boolean;
  };
}

// --- Types for Copy Operation ---

/**
 * Payload for the `sync/copy` rclone RC API endpoint.
 * `srcFs` is the source (e.g., "myRemote:path/to/source_file_or_dir").
 * `dstFs` is the destination (e.g., "otherRemote:path/to/dest_dir").
 */
export interface RcloneCopyPayload {
  srcFs: string;
  dstFs: string;
  _async?: boolean;
  // Potentially other options like `createEmptySrcDirs` if needed
}

/**
 * Response from an asynchronous rclone job initiation (e.g., `sync/copy` with `_async: true`).
 * Rclone typically returns a jobid as a number.
 */
export interface RcloneAsyncJobResponse {
  jobid: number;
}

/**
 * Represents an active rclone job being tracked by the UI.
 */
export interface ActiveRcloneJob {
  jobId: number;
  srcFs: string;
  dstFs: string;
  status?: string; // For future detailed status updates
  error?: string | null;
  progress?: any; // For future progress object from job/status
  timestamp: number; // When the job was initiated
}

// If we were to store more info, like type from `config/dump`
// export interface RcloneRemoteDetail {
//   name: string;
//   type: string;
// }
// export type RcloneRemotesDetailed = RcloneRemoteDetail[];
