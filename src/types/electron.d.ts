export interface ElectronAPI {
  // App info
  getAppVersion: () => Promise<string>;
  checkYtDlp: () => Promise<boolean>;
  checkFfmpeg: () => Promise<boolean>;
  
  // Downloads
  getDownloads: () => Promise<any[]>;
  addDownload: (url: string, options?: any) => Promise<any>;
  addPlaylistVideos: (playlistData: any) => Promise<any[]>;
  startDownload: (id: string) => Promise<boolean>;
  startQueue: () => Promise<boolean>;
  removeDownload: (id: string) => Promise<boolean>;
  pauseDownload: (id: string) => Promise<boolean>;
  resumeDownload: (id: string) => Promise<boolean>;
  retryDownload: (id: string) => Promise<boolean>;
  clearCompleted: () => Promise<boolean>;
  
  // Queue
  getQueue: () => Promise<string[]>;
  
  // Metadata
  getMetadata: (url: string) => Promise<any>;
  
  // Settings
  getSettings: () => Promise<any>;
  updateSettings: (settings: any) => Promise<any>;
  saveSettings: (settings: any) => Promise<any>;
  
  // System
  selectFolder: () => Promise<string | null>;
  getClipboard: () => Promise<string>;
  
  // Window controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  
  // Event listeners
  onDownloadUpdated: (callback: (download: any) => void) => void;
  removeDownloadUpdateListener: () => void;
  onLogAdded: (callback: (logData: any) => void) => void;
  removeLogAddedListener: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}