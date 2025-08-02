import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Settings {
  maxConcurrentDownloads: number;
  outputPath: string;
  qualityPreset: string;
  retryAttempts: number;
  downloadSpeed: number; // KB/s, 0 = unlimited
  customYtDlpArgs: string;
  fileNamingTemplate: string;
  autoStartDownloads: boolean;
  keepOriginalFiles: boolean;
  writeSubtitles: boolean;
  embedSubtitles: boolean;
  writeThumbnail: boolean;
  writeDescription: boolean;
  writeInfoJson: boolean;
  verboseLogging: boolean; // Show all console logs or only important ones
  
  // Advanced Queue Settings
  queueProcessingDelay: number; // Delay between starting downloads (ms)
  maxRetriesPerDownload: number; // Maximum retries per individual download
  autoRetryFailed: boolean; // Automatically retry failed downloads
  
  // File Management
  maxFileSize: number; // Maximum file size in MB (0 = unlimited)
  skipExistingFiles: boolean; // Skip downloading if file already exists
  createSubdirectories: boolean; // Create subdirectories for different content types
  
  // Network & Performance
  connectionTimeout: number; // Connection timeout in seconds
  socketTimeout: number; // Socket timeout in seconds
  maxDownloadsPerHour: number; // Rate limiting (0 = unlimited)
  
  // Authentication & Cookies
  useCookies: boolean; // Use cookies for authentication
  cookiesFilePath: string; // Path to cookies file
  userAgent: string; // Custom user agent string
  
  // Proxy Settings
  useProxy: boolean; // Use proxy for downloads
  proxyUrl: string; // Proxy URL (e.g., http://proxy:port)
  proxyUsername: string; // Proxy username
  proxyPassword: string; // Proxy password
  
  // Advanced yt-dlp Options
  extractAudioFormat: string; // Audio format for extraction (mp3, m4a, etc.)
  videoFormat: string; // Preferred video format (mp4, mkv, etc.)
  audioQuality: string; // Audio quality (best, worst, etc.)
  videoQuality: string; // Video quality (best, worst, etc.)
  
  // Metadata & Info
  writePlaylistInfo: boolean; // Write playlist info for playlists
  writeAnnotations: boolean; // Write video annotations
  writeComments: boolean; // Write video comments
  
  // Processing Options
  postProcessors: string; // Custom post-processor arguments
  mergeVideoFormats: boolean; // Merge video and audio formats
  preferFreeFormats: boolean; // Prefer free formats over non-free ones
  
  // Debug & Development
  enableDebugMode: boolean; // Enable debug mode for yt-dlp
  logLevel: string; // Log level (debug, info, warning, error)
  saveLogsToFile: boolean; // Save logs to file
  logsDirectory: string; // Directory to save logs
}

interface SettingsState {
  data: Settings;
  isOpen: boolean;
  activeTab: string;
}

const initialState: SettingsState = {
  data: {
    maxConcurrentDownloads: 3,
    outputPath: '',
    qualityPreset: 'best',
    retryAttempts: 3,
    downloadSpeed: 0,
    customYtDlpArgs: '',
    fileNamingTemplate: '%(title)s.%(ext)s',
    autoStartDownloads: false,
    keepOriginalFiles: false,
    writeSubtitles: false,
    embedSubtitles: false,
    writeThumbnail: false,
    writeDescription: false,
    writeInfoJson: false,
    verboseLogging: false, // Default to showing only important logs
    
    // Advanced Queue Settings
    queueProcessingDelay: 1000, // 1 second delay
    maxRetriesPerDownload: 3,
    autoRetryFailed: false,
    
    // File Management
    maxFileSize: 0, // Unlimited
    skipExistingFiles: true,
    createSubdirectories: false,
    
    // Network & Performance
    connectionTimeout: 30,
    socketTimeout: 60,
    maxDownloadsPerHour: 0, // Unlimited
    
    // Authentication & Cookies
    useCookies: false,
    cookiesFilePath: '',
    userAgent: '',
    
    // Proxy Settings
    useProxy: false,
    proxyUrl: '',
    proxyUsername: '',
    proxyPassword: '',
    
    // Advanced yt-dlp Options
    extractAudioFormat: 'mp3',
    videoFormat: 'mp4',
    audioQuality: 'best',
    videoQuality: 'best',
    
    // Metadata & Info
    writePlaylistInfo: false,
    writeAnnotations: false,
    writeComments: false,
    
    // Processing Options
    postProcessors: '',
    mergeVideoFormats: true,
    preferFreeFormats: true,
    
    // Debug & Development
    enableDebugMode: false,
    logLevel: 'info',
    saveLogsToFile: false,
    logsDirectory: '',
  },
  isOpen: false,
  activeTab: 'general',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings: (state, action: PayloadAction<Settings>) => {
      state.data = action.payload;
    },
    updateSetting: (state, action: PayloadAction<{ key: keyof Settings; value: any }>) => {
      const { key, value } = action.payload;
      (state.data as any)[key] = value;
    },
    openSettings: (state, action: PayloadAction<string>) => {
      state.isOpen = true;
      state.activeTab = action.payload;
    },
    closeSettings: (state) => {
      state.isOpen = false;
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
  },
});

export const {
  setSettings,
  updateSetting,
  openSettings,
  closeSettings,
  setActiveTab,
} = settingsSlice.actions;

export default settingsSlice.reducer;