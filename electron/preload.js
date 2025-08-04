const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkYtDlp: () => ipcRenderer.invoke('check-yt-dlp'),
  checkFfmpeg: () => ipcRenderer.invoke('check-ffmpeg'),
  
  // Downloads
  getDownloads: () => ipcRenderer.invoke('get-downloads'),
  addDownload: (url, options) => ipcRenderer.invoke('add-download', url, options),
  addPlaylistVideos: (playlistData) => ipcRenderer.invoke('add-playlist-videos', playlistData),
  startDownload: (id) => ipcRenderer.invoke('start-download', id),
  startQueue: () => ipcRenderer.invoke('start-queue'),
  pauseQueue: () => ipcRenderer.invoke('pause-queue'),
  stopAllDownloads: () => ipcRenderer.invoke('stop-all-downloads'),
  removeDownload: (id) => ipcRenderer.invoke('remove-download', id),
  pauseDownload: (id) => ipcRenderer.invoke('pause-download', id),
  resumeDownload: (id) => ipcRenderer.invoke('resume-download', id),
  retryDownload: (id) => ipcRenderer.invoke('retry-download', id),
  clearCompleted: () => ipcRenderer.invoke('clear-completed'),
  
  // Queue
  getQueue: () => ipcRenderer.invoke('get-queue'),
  
  // Metadata
  getMetadata: (url) => ipcRenderer.invoke('get-metadata', url),
  getAvailableQualities: (url) => ipcRenderer.invoke('get-available-qualities', url),
  preValidateUrl: (url) => ipcRenderer.invoke('pre-validate-url', url),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // System
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFile: (filters) => ipcRenderer.invoke('select-file', filters),
  getClipboard: () => ipcRenderer.invoke('get-clipboard'),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // Event listeners
  onDownloadUpdated: (callback) => {
    ipcRenderer.on('download-updated', (event, download) => callback(download));
  },
  removeDownloadUpdateListener: () => {
    ipcRenderer.removeAllListeners('download-updated');
  },
  onDownloadUpdatedBatch: (callback) => {
    ipcRenderer.on('download-updated-batch', (event, downloads) => callback(downloads));
  },
  onLogAdded: (callback) => {
    ipcRenderer.on('log-added', (event, logData) => callback(logData));
  },
  removeLogAddedListener: () => {
    ipcRenderer.removeAllListeners('log-added');
  },
  testYtDlp: () => ipcRenderer.invoke('test-yt-dlp'),
});